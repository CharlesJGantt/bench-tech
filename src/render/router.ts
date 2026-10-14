/**
 * Two-layer grid autorouter for the board artwork.
 *
 * Each net is grown as a Steiner tree: starting from one pad, the nearest unconnected
 * pad is routed (A* on a 0.25 mm grid, 8 directions, bend + via penalties) to ANY copper
 * already belonging to that net, so branches meet in T-junctions instead of forming loops.
 * Foreign copper is dilated by (half trace width + clearance) so different nets never touch.
 * Copper is generated from the same netlist the circuit simulator solves.
 */
import type { DeviceDef } from '../sim/board';
import { bodyRect, padsOf, type PadWorld } from '../sim/footprints';

export interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  net: string;
  layer: 'top' | 'bottom';
}

export interface TraceGeom {
  id: string;
  segments: Segment[];
  /** Where a crack is drawn when broken (mm). */
  crack: { x: number; y: number; vertical: boolean };
}

export interface RouteResult {
  pads: PadWorld[];
  segments: Segment[];
  traces: TraceGeom[];
  vias: { x: number; y: number }[];
  /** Connections that could not be routed (should be empty). */
  failures: string[];
}

const G = 0.25; // grid pitch (mm)
const CLEAR = 0.25; // copper-to-copper clearance (mm)
const EDGE = -2; // board edge / holes: blocked for everyone

const DIRS: [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

class Heap {
  private k: number[] = [];
  private v: number[] = [];
  get size() {
    return this.k.length;
  }
  push(key: number, val: number) {
    const k = this.k;
    const v = this.v;
    let i = k.length;
    k.push(key);
    v.push(val);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (k[p] <= key) break;
      k[i] = k[p];
      v[i] = v[p];
      i = p;
    }
    k[i] = key;
    v[i] = val;
  }
  pop(): number {
    const k = this.k;
    const v = this.v;
    const top = v[0];
    const lk = k.pop()!;
    const lv = v.pop()!;
    if (k.length) {
      let i = 0;
      const n = k.length;
      for (;;) {
        const l = 2 * i + 1;
        if (l >= n) break;
        const r = l + 1;
        const c = r < n && k[r] < k[l] ? r : l;
        if (k[c] >= lk) break;
        k[i] = k[c];
        v[i] = v[c];
        i = c;
      }
      k[i] = lk;
      v[i] = lv;
    }
    return top;
  }
}

/** Route the board; nets that fail are moved to the front of the queue and everything is re-routed. */
export function routeBoard(device: DeviceDef, widthOf: (net: string) => number): RouteResult {
  let best: RouteResult | null = null;
  // Rip-up and retry: failed nets jump the queue. If that stalls, start over with a
  // different (deterministic) shuffle of the signal nets.
  for (let restart = 0; restart < 6; restart++) {
    let first: string[] = restart ? shuffledNets(device, restart) : [];
    for (let attempt = 0; attempt < 5; attempt++) {
      const r = routeOnce(device, widthOf, first);
      if (!best || r.failures.length < best.failures.length) best = r;
      if (!r.failures.length) return r;
      const failed = r.failures.map((f) => f.split(':')[0]).filter((n) => !first.includes(n));
      if (!failed.length) break;
      first = [...failed, ...first.filter((n) => !failed.includes(n))];
    }
  }
  return best!;
}

/** A deterministic shuffle of the board's nets, used to vary routing order between restarts. */
function shuffledNets(device: DeviceDef, seed: number): string[] {
  const nets = [...new Set(device.components.flatMap((c) => (c.mates ? [] : Object.values(c.pins))))].filter((n) => n !== 'GND').sort();
  let s = seed * 2654435761;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  for (let i = nets.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [nets[i], nets[j]] = [nets[j], nets[i]];
  }
  return nets;
}

function routeOnce(device: DeviceDef, widthOf: (net: string) => number, first: string[]): RouteResult {
  const nx = Math.ceil(device.width / G) + 1;
  const ny = Math.ceil(device.height / G) + 1;
  const n = nx * ny;
  const netIds = new Map<string, number>();
  const idOf = (net: string) => {
    let id = netIds.get(net);
    if (id === undefined) netIds.set(net, (id = netIds.size));
    return id;
  };
  // occ[layer*n + cell] = net id of copper there, -1 empty, EDGE blocked
  const occ = new Int16Array(2 * n).fill(-1);
  const bodyCost = new Uint8Array(n);
  const allPads = device.components.flatMap(padsOf);
  // Module contacts sit on cables, not the PCB: no copper, nothing to route.
  const pads = allPads.filter((p) => !p.module);
  const cellOf = (x: number, y: number) => Math.round(y / G) * nx + Math.round(x / G);

  // Board edge and mounting holes
  for (let iy = 0; iy < ny; iy++)
    for (let ix = 0; ix < nx; ix++) {
      const x = ix * G;
      const y = iy * G;
      const edge = x < 1.2 || y < 1.2 || x > device.width - 1.2 || y > device.height - 1.2;
      const hole = [
        [3.5, 3.5],
        [device.width - 3.5, 3.5],
        [3.5, device.height - 3.5],
        [device.width - 3.5, device.height - 3.5],
      ].some(([hx, hy]) => Math.hypot(x - hx, y - hy) < 3);
      if (edge || hole) occ[iy * nx + ix] = occ[n + iy * nx + ix] = EDGE;
    }

  const fillRect = (layer: number, x0: number, y0: number, x1: number, y1: number, id: number) => {
    for (let iy = Math.max(0, Math.ceil(y0 / G)); iy <= Math.min(ny - 1, Math.floor(y1 / G)); iy++)
      for (let ix = Math.max(0, Math.ceil(x0 / G)); ix <= Math.min(nx - 1, Math.floor(x1 / G)); ix++) occ[layer * n + iy * nx + ix] = id;
  };
  const padCells = new Map<PadWorld, number[]>();
  // Big connector / through-hole pads get extra clearance (like real boards); fine-pitch IC pins don't.
  const bigPad = new Uint8Array(2 * n);
  for (const p of pads) {
    const id = idOf(p.net);
    const layers = p.round ? [0, 1] : [0];
    const cells: number[] = [];
    for (const L of layers) {
      // Snap pad edges to the nearest grid line (not inward), so quantisation eats at most G/2 of clearance.
      const snap = (v: number) => Math.round(v / G) * G;
      fillRect(L, snap(p.x - p.w / 2), snap(p.y - p.h / 2), snap(p.x + p.w / 2), snap(p.y + p.h / 2), id);
      if (p.round || Math.min(p.w, p.h) >= 1.5)
        for (let iy = Math.max(0, Math.floor((p.y - p.h / 2) / G)); iy <= Math.min(ny - 1, Math.ceil((p.y + p.h / 2) / G)); iy++)
          for (let ix = Math.max(0, Math.floor((p.x - p.w / 2) / G)); ix <= Math.min(nx - 1, Math.ceil((p.x + p.w / 2) / G)); ix++) bigPad[L * n + iy * nx + ix] = 1;
      for (let iy = Math.ceil((p.y - p.h / 2) / G); iy <= Math.floor((p.y + p.h / 2) / G); iy++)
        for (let ix = Math.ceil((p.x - p.w / 2) / G); ix <= Math.floor((p.x + p.w / 2) / G); ix++) cells.push(L * n + iy * nx + ix);
    }
    if (!cells.length) cells.push(cellOf(p.x, p.y));
    padCells.set(p, cells);
  }
  for (const c of device.components) {
    if (c.partNo === 'TP' || c.mates) continue;
    const r = bodyRect(c);
    for (let iy = Math.ceil(r.y / G); iy <= Math.floor((r.y + r.h) / G); iy++)
      for (let ix = Math.ceil(r.x / G); ix <= Math.floor((r.x + r.w) / G); ix++) if (iy >= 0 && iy < ny && ix >= 0 && ix < nx) bodyCost[iy * nx + ix] = 1;
  }

  /** Cells blocked for a net: foreign copper dilated by half-width + clearance. */
  const blocked = new Uint8Array(2 * n);
  /** Soft zone around other nets' connector / through-hole pads: allowed, but routes prefer to keep away. */
  const near = new Uint8Array(2 * n);
  const buildBlocked = (allowed: Set<number>, halfW: number) => {
    blocked.fill(0);
    near.fill(0);
    const rFor = (extra: number) => Math.ceil((halfW + CLEAR + extra) / G);
    const r2For = (extra: number) => ((halfW + CLEAR + extra) / G) ** 2 + 0.5;
    const rN = rFor(0);
    const r2N = r2For(0);
    const rB = rFor(0.3);
    const r2B = r2For(0.3);
    for (let L = 0; L < 2; L++)
      for (let iy = 0; iy < ny; iy++)
        for (let ix = 0; ix < nx; ix++) {
          const o = occ[L * n + iy * nx + ix];
          if (o === -1 || allowed.has(o)) continue;
          if (o === EDGE) {
            blocked[L * n + iy * nx + ix] = 1;
            continue;
          }
          const big = bigPad[L * n + iy * nx + ix] === 1;
          const r = big ? rB : rN;
          const r2 = big ? r2B : r2N;
          if (big) {
            const rs = rB + 4; // about 1 mm beyond the hard clearance
            for (let dy = -rs; dy <= rs; dy++) {
              const yy = iy + dy;
              if (yy < 0 || yy >= ny) continue;
              for (let dx = -rs; dx <= rs; dx++) {
                const xx = ix + dx;
                if (xx >= 0 && xx < nx && dx * dx + dy * dy <= rs * rs) near[L * n + yy * nx + xx] = 1;
              }
            }
          }
          for (let dy = -r; dy <= r; dy++) {
            const yy = iy + dy;
            if (yy < 0 || yy >= ny) continue;
            for (let dx = -r; dx <= r; dx++) {
              if (dx * dx + dy * dy > r2) continue;
              const xx = ix + dx;
              if (xx >= 0 && xx < nx) blocked[L * n + yy * nx + xx] = 1;
            }
          }
        }
  };

  const gScore = new Float32Array(2 * n);
  const closed = new Uint8Array(2 * n);
  const parent = new Int32Array(2 * n);
  const pdir = new Int8Array(2 * n);
  const target = new Int32Array(2 * n).fill(-1);
  let stamp = 0;

  /** A* from source cells to any target-stamped cell. Returns the path (state indices) or null. */
  const astar = (sources: number[], tb: { x0: number; y0: number; x1: number; y1: number }, allowVia: boolean, topOnly: boolean): number[] | null => {
    gScore.fill(Infinity);
    const h = (s: number) => {
      const c = s % n;
      const x = c % nx;
      const y = (c - x) / nx;
      const dx = Math.max(tb.x0 - x, 0, x - tb.x1);
      const dy = Math.max(tb.y0 - y, 0, y - tb.y1);
      return Math.max(dx, dy) + 0.414 * Math.min(dx, dy);
    };
    const heap = new Heap();
    for (const s of sources) {
      if (topOnly && s >= n) continue;
      gScore[s] = 0;
      parent[s] = -1;
      pdir[s] = -1;
      heap.push(h(s), s);
    }
    closed.fill(0);
    let expanded = 0;
    while (heap.size) {
      const s = heap.pop();
      // Skip stale queue entries: each state is expanded once.
      if (closed[s]) continue;
      closed[s] = 1;
      if (target[s] === stamp) {
        const path: number[] = [];
        for (let c = s; c !== -1; c = parent[c]) path.push(c);
        return path.reverse();
      }
      if (++expanded > 800000) return null;
      const L = s >= n ? 1 : 0;
      const c = s - L * n;
      const x = c % nx;
      const y = (c - x) / nx;
      const gs = gScore[s];
      for (let d = 0; d < 8; d++) {
        const [dx, dy] = DIRS[d];
        const xx = x + dx;
        const yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= nx || yy >= ny) continue;
        const t = L * n + yy * nx + xx;
        if (closed[t] || (blocked[t] && target[t] !== stamp)) continue;
        if (dx && dy && (blocked[L * n + y * nx + xx] || blocked[L * n + yy * nx + x])) continue;
        let cost = dx && dy ? 1.414 : 1;
        const pd = pdir[s];
        if (pd >= 0 && pd !== d) {
          // A 45° change is cheap, a 90°+ change is not — gives the familiar mitred look.
          const diag = dx !== 0 && dy !== 0;
          const pdiag = DIRS[pd][0] !== 0 && DIRS[pd][1] !== 0;
          cost += diag !== pdiag ? 1.5 : 4;
        }
        if (L === 1) cost *= 1.25;
        else if (bodyCost[yy * nx + xx]) cost += 1.5;
        if (near[t]) cost += 1.5;
        const g2 = gs + cost;
        if (g2 < gScore[t]) {
          gScore[t] = g2;
          parent[t] = s;
          pdir[t] = d;
          heap.push(g2 + h(t), t);
        }
      }
      if (allowVia && !topOnly) {
        const t = (1 - L) * n + c;
        if (!blocked[t] && !blocked[c] && !blocked[n + c]) {
          const g2 = gs + 40;
          if (g2 < gScore[t]) {
            gScore[t] = g2;
            parent[t] = s;
            pdir[t] = -1;
            heap.push(g2 + h(t), t);
          }
        }
      }
    }
    return null;
  };

  const segments: Segment[] = [];
  const vias: { x: number; y: number }[] = [];
  const failures: string[] = [];
  const treeCells = new Map<number, number[]>(); // net id -> copper cells (state indices)

  /** Turn a cell path into straight segments (+ vias where the layer changes). */
  const emit = (path: number[], width: number, net: string): Segment[] => {
    const out: Segment[] = [];
    const pt = (s: number) => {
      const c = s % n;
      const x = c % nx;
      return { x: x * G, y: ((c - x) / nx) * G, L: s >= n ? 1 : 0 };
    };
    let start = pt(path[0]);
    let prev = start;
    let dir = '';
    for (let i = 1; i < path.length; i++) {
      const p = pt(path[i]);
      if (p.L !== prev.L) {
        if (prev.x !== start.x || prev.y !== start.y) out.push({ x1: start.x, y1: start.y, x2: prev.x, y2: prev.y, width, net, layer: start.L ? 'bottom' : 'top' });
        vias.push({ x: p.x, y: p.y });
        start = p;
        prev = p;
        dir = '';
        continue;
      }
      const d = `${Math.sign(p.x - prev.x)},${Math.sign(p.y - prev.y)}`;
      if (dir && d !== dir) {
        out.push({ x1: start.x, y1: start.y, x2: prev.x, y2: prev.y, width, net, layer: start.L ? 'bottom' : 'top' });
        start = prev;
      }
      dir = d;
      prev = p;
    }
    if (prev.x !== start.x || prev.y !== start.y) out.push({ x1: start.x, y1: start.y, x2: prev.x, y2: prev.y, width, net, layer: start.L ? 'bottom' : 'top' });
    return out;
  };

  /** Mark routed copper (with its real width) as occupied by the net. */
  const commit = (path: number[], id: number, halfW: number, joinTree = true) => {
    const r = Math.max(0, Math.round(halfW / G));
    let cells = treeCells.get(id);
    if (!cells) treeCells.set(id, (cells = []));
    if (!joinTree) cells = [];
    for (const s of path) {
      const L = s >= n ? 1 : 0;
      const c = s - L * n;
      const x = c % nx;
      const y = (c - x) / nx;
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= nx || yy >= ny) continue;
          const t = L * n + yy * nx + xx;
          if (occ[t] === -1) occ[t] = id;
        }
      cells.push(s);
    }
  };

  const bbox = (cells: number[]) => {
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (const s of cells) {
      const c = s % n;
      const x = c % nx;
      const y = (c - x) / nx;
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
    }
    return { x0, y0, x1, y1 };
  };

  const partners = new Map<number, number[]>();
  for (const t of device.traces) {
    const a = idOf(t.a);
    const b = idOf(t.b);
    partners.set(a, [...(partners.get(a) ?? []), b]);
    partners.set(b, [...(partners.get(b) ?? []), a]);
  }
  const byNet = new Map<string, PadWorld[]>();
  for (const p of pads) {
    if (!byNet.has(p.net)) byNet.set(p.net, []);
    byNet.get(p.net)!.push(p);
  }

  // ---- Breakable traces between net fragments (top layer only) ---------------
  const traces: TraceGeom[] = [];
  for (const t of device.traces) {
    const a = idOf(t.a);
    const b = idOf(t.b);
    // Routed first, so start from the fragments' pads.
    const from = byNet.get(t.a)!.flatMap((p) => padCells.get(p)!);
    const to = byNet.get(t.b)!.flatMap((p) => padCells.get(p)!);
    const width = widthOf(t.a);
    stamp++;
    for (const s of to) if (s < n) target[s] = stamp;
    buildBlocked(new Set([a, b]), width / 2);
    const path = astar(
      from.filter((s) => s < n),
      bbox(to.filter((s) => s < n)),
      false,
      true,
    );
    if (!path) {
      failures.push(`${t.id}: ${t.a} → ${t.b}`);
      traces.push({ id: t.id, segments: [], crack: { x: 0, y: 0, vertical: false } });
      continue;
    }
    const segs = emit(path, width, t.a);
    // Occupy the copper, but let the net's own tree connect to it through its pads.
    commit(path, a, width / 2, false);
    const longest = segs.reduce((m, s) => (Math.hypot(s.x2 - s.x1, s.y2 - s.y1) > Math.hypot(m.x2 - m.x1, m.y2 - m.y1) ? s : m), segs[0]);
    traces.push({
      id: t.id,
      segments: segs,
      crack: { x: (longest.x1 + longest.x2) / 2, y: (longest.y1 + longest.y2) / 2, vertical: Math.abs(longest.x1 - longest.x2) < Math.abs(longest.y1 - longest.y2) },
    });
  }

  // ---- Nets (power first, then by size) --------------------------------------
  const nets = [...byNet.keys()]
    .filter((net) => net !== 'GND' && byNet.get(net)!.length > 1)
    .sort((a, b) => {
      const fa = first.indexOf(a);
      const fb = first.indexOf(b);
      if (fa !== fb) return (fa < 0 ? Infinity : fa) - (fb < 0 ? Infinity : fb);
      return widthOf(b) - widthOf(a) || byNet.get(b)!.length - byNet.get(a)!.length;
    });

  for (const net of nets) {
    const id = idOf(net);
    const list = [...byNet.get(net)!];
    const width = widthOf(net);
    if (!treeCells.has(id)) treeCells.set(id, []);
    // Start the tree at the pad closest to the net's centre of mass.
    const cx = list.reduce((s, p) => s + p.x, 0) / list.length;
    const cy = list.reduce((s, p) => s + p.y, 0) / list.length;
    list.sort((a, b) => Math.hypot(a.x - cx, a.y - cy) - Math.hypot(b.x - cx, b.y - cy));
    const first = list.shift()!;
    treeCells.get(id)!.push(...padCells.get(first)!);
    const inTree = [first];
    while (list.length) {
      // Nearest remaining pad to anything already in the tree.
      let bi = 0;
      let bd = Infinity;
      list.forEach((p, i) => {
        for (const q of inTree) {
          const d = Math.abs(p.x - q.x) + Math.abs(p.y - q.y);
          if (d < bd) {
            bd = d;
            bi = i;
          }
        }
      });
      const p = list.splice(bi, 1)[0];
      stamp++;
      const tcells = treeCells.get(id)!;
      for (const s of tcells) target[s] = stamp;
      // Fragments joined by a breakable trace are one conductor while the trace is intact.
      buildBlocked(new Set([id, ...(partners.get(id) ?? [])]), width / 2);
      const path = astar(padCells.get(p)!, bbox(tcells), true, false);
      if (!path) {
        failures.push(`${net}: ${p.ref}.${p.pin}`);
        treeCells.get(id)!.push(...padCells.get(p)!);
        inTree.push(p);
        continue;
      }
      segments.push(...emit(path, width, net));
      commit(path, id, width / 2);
      treeCells.get(id)!.push(...padCells.get(p)!);
      inTree.push(p);
    }
  }

  return { pads: allPads, segments, traces, vias, failures };
}
