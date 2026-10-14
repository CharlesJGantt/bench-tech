/**
 * Small nonlinear DC solver (nodal analysis + damped Newton-Raphson).
 *
 * Every element reports the current flowing INTO it from each of its terminals,
 * given the terminal voltages. KCL at every non-ground node gives the residual;
 * the Jacobian is built per-element by finite differences, so new behavioral
 * models only need an `eval` function.
 *
 * Strategy: plain Newton (optionally warm-started) → pseudo-transient continuation
 * (every node gets a small capacitor and we step "time" until the board settles,
 * i.e. a simulated power-up) → final Newton polish.
 *
 * Linear algebra: nodes are renumbered with reverse Cuthill–McKee so connected nodes sit
 * close together, then the Jacobian is factored by banded Gaussian elimination with
 * partial pivoting. Cost is O(n·b²) for bandwidth b instead of O(n³), which is what lets
 * motherboard-sized netlists (hundreds of nodes) solve interactively.
 */

export interface Element {
  /** Node indices of the terminals. Node 0 is ground. */
  nodes: number[];
  /** Currents (A) flowing into the element from each terminal. `s` scales independent sources (0..1). */
  eval(v: number[], s: number): number[];
  /** Component reference that owns this element (for power / thermal accounting). */
  owner?: string;
}

export interface SolveResult {
  v: Float64Array;
  converged: boolean;
  iterations: number;
}

export interface SolveOptions {
  initial?: Float64Array;
  /** Conductance from every node to ground; keeps floating nodes solvable. */
  gmin?: number;
  maxIter?: number;
}

const MAX_STEP = 1.0;

interface Ctx {
  n: number;
  elements: Element[];
  gmin: number;
  /** Pseudo-capacitor conductance (C/dt) to vref; 0 for a true DC solve. */
  gc: number;
  vref: Float64Array;
  J: Float64Array;
  F: Float64Array;
  Fs: Float64Array;
  dx: Float64Array;
  trial: Float64Array;
  local: number[];
  /** Matrix row/column of each circuit node (node 0 = ground → -1). */
  pos: Int32Array;
  /** Lower bandwidth of the reordered matrix. */
  band: number;
  /** Per-row right-most non-zero column (updated during elimination). */
  rowEnd: Int32Array;
}

/** Reverse Cuthill–McKee ordering of nodes 1..N; returns pos[node] and the lower bandwidth. */
function rcm(nodeCount: number, elements: Element[]): { pos: Int32Array; band: number } {
  const N = nodeCount - 1;
  // Small boards: reordering costs more than it saves — plain order, full band.
  if (N < 64) {
    const pos = new Int32Array(nodeCount);
    for (let i = 0; i < nodeCount; i++) pos[i] = i - 1;
    return { pos, band: Math.max(0, N - 1) };
  }
  const adj: Set<number>[] = Array.from({ length: nodeCount }, () => new Set<number>());
  for (const el of elements)
    for (const a of el.nodes)
      for (const b of el.nodes) if (a !== b && a !== 0 && b !== 0) adj[a].add(b);
  const deg = (i: number) => adj[i].size;
  const order: number[] = [];
  const seen = new Uint8Array(nodeCount);
  const nodes = Array.from({ length: N }, (_, i) => i + 1).sort((x, y) => deg(x) - deg(y));
  for (const start of nodes) {
    if (seen[start]) continue;
    seen[start] = 1;
    const queue = [start];
    for (let qi = 0; qi < queue.length; qi++) {
      const u = queue[qi];
      order.push(u);
      const next = [...adj[u]].filter((w) => !seen[w]).sort((x, y) => deg(x) - deg(y));
      for (const w of next) {
        seen[w] = 1;
        queue.push(w);
      }
    }
  }
  order.reverse();
  const pos = new Int32Array(nodeCount).fill(-1);
  order.forEach((node, i) => (pos[node] = i));
  let band = 0;
  for (let a = 1; a < nodeCount; a++) for (const b of adj[a]) band = Math.max(band, Math.abs(pos[a] - pos[b]));
  return { pos, band };
}

function makeCtx(nodeCount: number, elements: Element[], gmin: number): Ctx {
  const n = nodeCount - 1;
  const { pos, band } = rcm(nodeCount, elements);
  return {
    pos,
    band,
    rowEnd: new Int32Array(Math.max(n, 1)),
    n,
    elements,
    gmin,
    gc: 0,
    vref: new Float64Array(nodeCount),
    J: new Float64Array(n * n),
    F: new Float64Array(n),
    Fs: new Float64Array(n),
    dx: new Float64Array(n),
    trial: new Float64Array(nodeCount),
    local: [],
  };
}

/** Residual into F, returns squared 2-norm. */
function residual(ctx: Ctx, v: Float64Array, F: Float64Array): number {
  F.fill(0);
  const local = ctx.local;
  for (const el of ctx.elements) {
    const k = el.nodes.length;
    local.length = k;
    for (let a = 0; a < k; a++) local[a] = v[el.nodes[a]];
    const i = el.eval(local, 1);
    for (let a = 0; a < k; a++) {
      const na = el.nodes[a];
      if (na !== 0) F[ctx.pos[na]] += i[a];
    }
  }
  let norm = 0;
  for (let node = 1; node <= ctx.n; node++) {
    const r = ctx.pos[node];
    F[r] += ctx.gmin * v[node] + ctx.gc * (v[node] - ctx.vref[node]);
    norm += F[r] * F[r];
  }
  return norm;
}

function newton(ctx: Ctx, v: Float64Array, maxIter: number): { converged: boolean; iterations: number } {
  const { n, J, F, Fs, dx, trial, local, pos } = ctx;
  if (n <= 0) return { converged: true, iterations: 0 };

  for (let iter = 1; iter <= maxIter; iter++) {
    J.fill(0);
    for (const el of ctx.elements) {
      const k = el.nodes.length;
      local.length = k;
      for (let a = 0; a < k; a++) local[a] = v[el.nodes[a]];
      const base = el.eval(local, 1);
      for (let b = 0; b < k; b++) {
        const nb = el.nodes[b];
        if (nb === 0) continue;
        const h = 1e-7 + 1e-7 * Math.abs(local[b]);
        local[b] += h;
        const pert = el.eval(local, 1);
        local[b] -= h;
        const col = pos[nb];
        for (let a = 0; a < k; a++) {
          const na = el.nodes[a];
          if (na !== 0) J[pos[na] * n + col] += (pert[a] - base[a]) / h;
        }
      }
    }
    const g = ctx.gmin + ctx.gc;
    for (let i = 0; i < n; i++) J[i * n + i] += g;
    const norm0 = residual(ctx, v, F);
    // KCL already satisfied to a picoamp everywhere: done. (Without this, nodes held only by
    // gmin keep "moving" by meaningless amounts and Newton never declares convergence.)
    if (norm0 < 1e-24 && iter > 1) return { converged: true, iterations: iter };

    for (let i = 0; i < n; i++) dx[i] = -F[i];
    if (!bandSolve(J, dx, n, ctx.band, ctx.rowEnd)) return { converged: false, iterations: iter };

    let maxDx = 0;
    for (let i = 0; i < n; i++) maxDx = Math.max(maxDx, Math.abs(dx[i]));
    if (!Number.isFinite(maxDx)) return { converged: false, iterations: iter };

    // Backtracking line search on the residual norm.
    let alpha = maxDx > MAX_STEP ? MAX_STEP / maxDx : 1;
    trial[0] = 0;
    for (let tries = 0; tries < 10; tries++) {
      for (let node = 1; node <= n; node++) trial[node] = v[node] + dx[pos[node]] * alpha;
      if (residual(ctx, trial, Fs) <= norm0 || tries === 9) break;
      alpha *= 0.5;
    }
    let maxV = 0;
    for (let i = 0; i < n; i++) {
      v[i + 1] = trial[i + 1];
      maxV = Math.max(maxV, Math.abs(v[i + 1]));
    }
    if (maxDx < 1e-9 + 1e-9 * maxV) return { converged: true, iterations: iter };
  }
  return { converged: false, iterations: maxIter };
}

/**
 * In-place banded Gaussian elimination with partial pivoting (dense storage, band-limited
 * loops). `kl` is the lower bandwidth; row extents grow with fill-in and are tracked in
 * `rowEnd`. Solution is left in `b`.
 */
function bandSolve(A: Float64Array, b: Float64Array, n: number, kl: number, rowEnd: Int32Array): boolean {
  for (let r = 0; r < n; r++) {
    let e = r;
    for (let c = Math.min(n - 1, r + kl); c > r; c--)
      if (A[r * n + c] !== 0) {
        e = c;
        break;
      }
    rowEnd[r] = e;
  }
  for (let col = 0; col < n; col++) {
    const last = Math.min(n - 1, col + kl);
    let piv = col;
    let best = Math.abs(A[col * n + col]);
    for (let r = col + 1; r <= last; r++) {
      const val = Math.abs(A[r * n + col]);
      if (val > best) {
        best = val;
        piv = r;
      }
    }
    if (best < 1e-30) return false;
    if (piv !== col) {
      const end = Math.max(rowEnd[col], rowEnd[piv]);
      for (let c = col; c <= end; c++) {
        const t = A[col * n + c];
        A[col * n + c] = A[piv * n + c];
        A[piv * n + c] = t;
      }
      const t = b[col];
      b[col] = b[piv];
      b[piv] = t;
      const te = rowEnd[col];
      rowEnd[col] = rowEnd[piv];
      rowEnd[piv] = te;
    }
    const d = A[col * n + col];
    const end = rowEnd[col];
    for (let r = col + 1; r <= last; r++) {
      const f = A[r * n + col] / d;
      if (f === 0) continue;
      for (let c = col; c <= end; c++) A[r * n + c] -= f * A[col * n + c];
      b[r] -= f * b[col];
      if (end > rowEnd[r]) rowEnd[r] = end;
    }
  }
  for (let r = n - 1; r >= 0; r--) {
    let sum = b[r];
    for (let c = r + 1; c <= rowEnd[r]; c++) sum -= A[r * n + c] * b[c];
    b[r] = sum / A[r * n + r];
  }
  return true;
}

/** In-place Gaussian elimination with partial pivoting (dense reference implementation). */
export function gaussSolve(A: Float64Array, b: Float64Array, n: number): boolean {
  for (let col = 0; col < n; col++) {
    let piv = col;
    let best = Math.abs(A[col * n + col]);
    for (let r = col + 1; r < n; r++) {
      const val = Math.abs(A[r * n + col]);
      if (val > best) {
        best = val;
        piv = r;
      }
    }
    if (best < 1e-30) return false;
    if (piv !== col) {
      for (let c = 0; c < n; c++) {
        const t = A[col * n + c];
        A[col * n + c] = A[piv * n + c];
        A[piv * n + c] = t;
      }
      const t = b[col];
      b[col] = b[piv];
      b[piv] = t;
    }
    const d = A[col * n + col];
    for (let r = col + 1; r < n; r++) {
      const f = A[r * n + col] / d;
      if (f === 0) continue;
      for (let c = col; c < n; c++) A[r * n + c] -= f * A[col * n + c];
      b[r] -= f * b[col];
    }
  }
  for (let r = n - 1; r >= 0; r--) {
    let sum = b[r];
    for (let c = r + 1; c < n; c++) sum -= A[r * n + c] * b[c];
    b[r] = sum / A[r * n + r];
  }
  return true;
}

/** Pseudo-transient continuation: 1 µF on every node, backward-Euler steps with adaptive dt. */
function pseudoTransient(ctx: Ctx, v: Float64Array): number {
  const C = 1e-6;
  let dt = 1e-6;
  let total = 0;
  const prev = new Float64Array(v.length);
  const probe = new Float64Array(v.length);
  let good = 0;
  // Big boards: fail fast and grow the step by how easily it converged (measured ~1.6× faster).
  // Small boards keep the conservative schedule, which is faster for them.
  const big = ctx.n >= 64;
  // Iteration budget: some faulty boards (e.g. a shorted main rail that makes the board
  // hiccup on and off) have no steady state at all; searching forever doesn't find one.
  const budget = 5000 + 8 * ctx.n;
  for (let step = 0; step < 400 && total < budget; step++) {
    prev.set(v);
    ctx.vref.set(v);
    ctx.gc = C / dt;
    // Fail fast: a step that needs many iterations is better retried with a smaller dt.
    const r = newton(ctx, v, big ? 12 : 25);
    total += r.iterations;
    if (r.converged) {
      let change = 0;
      for (let i = 1; i < v.length; i++) change = Math.max(change, Math.abs(v[i] - prev[i]));
      if (dt > 1e3 && change < 1e-9) break;
      // Big boards: once mostly settled, try jumping straight to the DC solution
      // (on small boards a failed probe costs more than it saves).
      if (big && ++good % 4 === 0 && dt > 1e-4 && change < 0.05) {
        probe.set(v);
        ctx.gc = 0;
        const d = newton(ctx, probe, 15);
        total += d.iterations;
        if (d.converged) {
          v.set(probe);
          break;
        }
      }
      // Grow faster when the step was easy.
      dt *= change < 0.05 ? 4 : big ? (r.iterations <= 4 ? 2.5 : r.iterations <= 8 ? 1.6 : 1.2) : 1.5;
    } else {
      v.set(prev);
      dt /= 4;
      if (dt < 1e-12) break;
    }
  }
  ctx.gc = 0;
  return total;
}

/** Solve the DC operating point. */
export const solverStats = { calls: 0, ptc: 0, iterations: 0, failures: 0 };

export function solveDC(nodeCount: number, elements: Element[], opts: SolveOptions = {}): SolveResult {
  solverStats.calls++;
  const ctx = makeCtx(nodeCount, elements, opts.gmin ?? 1e-11);
  const maxIter = opts.maxIter ?? 60;
  const v = new Float64Array(nodeCount);
  if (opts.initial && opts.initial.length === nodeCount) v.set(opts.initial);
  v[0] = 0;

  let res = newton(ctx, v, maxIter);
  let total = res.iterations;
  if (res.converged) return { v, converged: true, iterations: total };

  solverStats.ptc++;
  if (!opts.initial) v.fill(0);
  else v.set(opts.initial);
  total += pseudoTransient(ctx, v);
  res = newton(ctx, v, maxIter);
  total += res.iterations;
  if (!res.converged && opts.initial) {
    // A bad warm start can trap us; retry from a cold board.
    v.fill(0);
    total += pseudoTransient(ctx, v);
    res = newton(ctx, v, maxIter);
    total += res.iterations;
  }
  solverStats.iterations += total;
  if (!res.converged) solverStats.failures++;
  return { v, converged: res.converged, iterations: total };
}

/** Power dissipated by an element (W), positive = absorbing. */
export function elementPower(el: Element, v: Float64Array): number {
  const local = el.nodes.map((n) => v[n]);
  const i = el.eval(local, 1);
  let p = 0;
  for (let a = 0; a < local.length; a++) p += local[a] * i[a];
  return p;
}
