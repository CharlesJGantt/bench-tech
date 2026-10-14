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
}

function makeCtx(nodeCount: number, elements: Element[], gmin: number): Ctx {
  const n = nodeCount - 1;
  return {
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
      if (na !== 0) F[na - 1] += i[a];
    }
  }
  let norm = 0;
  for (let i = 0; i < ctx.n; i++) {
    F[i] += ctx.gmin * v[i + 1] + ctx.gc * (v[i + 1] - ctx.vref[i + 1]);
    norm += F[i] * F[i];
  }
  return norm;
}

function newton(ctx: Ctx, v: Float64Array, maxIter: number): { converged: boolean; iterations: number } {
  const { n, J, F, Fs, dx, trial, local } = ctx;
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
        for (let a = 0; a < k; a++) {
          const na = el.nodes[a];
          if (na !== 0) J[(na - 1) * n + (nb - 1)] += (pert[a] - base[a]) / h;
        }
      }
    }
    const g = ctx.gmin + ctx.gc;
    for (let i = 0; i < n; i++) J[i * n + i] += g;
    const norm0 = residual(ctx, v, F);

    for (let i = 0; i < n; i++) dx[i] = -F[i];
    if (!gaussSolve(J, dx, n)) return { converged: false, iterations: iter };

    let maxDx = 0;
    for (let i = 0; i < n; i++) maxDx = Math.max(maxDx, Math.abs(dx[i]));
    if (!Number.isFinite(maxDx)) return { converged: false, iterations: iter };

    // Backtracking line search on the residual norm.
    let alpha = maxDx > MAX_STEP ? MAX_STEP / maxDx : 1;
    trial[0] = 0;
    for (let tries = 0; tries < 10; tries++) {
      for (let i = 0; i < n; i++) trial[i + 1] = v[i + 1] + dx[i] * alpha;
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

/** In-place Gaussian elimination with partial pivoting. Solution is left in `b`. */
function gaussSolve(A: Float64Array, b: Float64Array, n: number): boolean {
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
  for (let step = 0; step < 400; step++) {
    prev.set(v);
    ctx.vref.set(v);
    ctx.gc = C / dt;
    const r = newton(ctx, v, 25);
    total += r.iterations;
    if (r.converged) {
      let change = 0;
      for (let i = 1; i < v.length; i++) change = Math.max(change, Math.abs(v[i] - prev[i]));
      if (dt > 1e3 && change < 1e-9) break;
      dt *= change < 0.05 ? 4 : 1.5;
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
