/**
 * Corrosion from liquid damage, as a physical layer on the pads of each component.
 * Each pad carries a crust amount 0..1:
 * - electrically, crust adds series resistance to the joint (open when it is eaten through)
 *   and leaks current between neighbouring pins of the same part;
 * - at the microscope, solder will not wet a crusted pad, and corrosion cleaner fizzes the
 *   crust into a sludge that must be scrubbed, rinsed with IPA and wiped away;
 * - left alone (waiting in the queue), it spreads a little every day.
 */
import type { BoardState, CompState } from './circuit';
import { padsOf } from './footprints';
import { pinsOf, part } from './parts';

export const CORROSION_COLORS = ['green', 'white', 'yellow', 'purple', 'black'] as const;
export type CorrosionColor = (typeof CORROSION_COLORS)[number];

/** Render colours (r, g, b) of each crust type. */
export const CORROSION_RGB: Record<CorrosionColor, [number, number, number]> = {
  green: [74, 150, 96],
  white: [226, 230, 214],
  yellow: [204, 178, 74],
  purple: [124, 78, 136],
  black: [42, 38, 34],
};

/**
 * Mottled speckles for a crusted pad (mm, relative to the pad centre): mostly the dominant
 * colour with flecks of the others. Deterministic per seed so the art does not flicker.
 */
export function crustSpeckles(seed: number, crust: number, padR: number, color: CorrosionColor): { x: number; y: number; r: number; rgb: [number, number, number]; a: number }[] {
  let t = seed >>> 0 || 1;
  const rnd = () => ((t = (Math.imul(t ^ (t >>> 15), 2246822519) + 0x9e3779b9) >>> 0), (t >>> 8) / 16777216);
  const n = Math.round(10 + crust * 40);
  const spread = padR + 0.3 + crust * 1.4;
  const out = [];
  for (let i = 0; i < n; i++) {
    const ang = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * spread;
    const c = rnd() < 0.55 ? color : CORROSION_COLORS[Math.floor(rnd() * CORROSION_COLORS.length)];
    out.push({ x: Math.cos(ang) * d, y: Math.sin(ang) * d, r: (0.15 + rnd() * 0.3) * (0.6 + crust), rgb: CORROSION_RGB[c], a: 0.5 + 0.4 * crust * rnd() });
  }
  return out;
}

export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export interface Corrosion {
  /** Dominant colour (the render mottles it with the others). */
  color: CorrosionColor;
  /** Crust per footprint pad, 0..1. */
  pins: Record<string, number>;
}

/** Below this the pad is clean enough for solder, the evaluation and the eye. */
export const CLEAN_CRUST = 0.05;
/** Above this, solder will not wet the pad. */
export const NO_WET_CRUST = 0.25;

const pinNames = (c: CompState) => pinsOf(part(c.def.partNo));

export function crustAt(c: CompState, pin: string): number {
  return c.corr?.pins[pin] ?? 0;
}

/** Extra series resistance a crusted pad adds to its joint (Ω; Infinity when eaten through). */
export function corrosionSeriesR(crust: number): number {
  if (crust >= 0.95) return Infinity;
  return crust > NO_WET_CRUST ? (crust - NO_WET_CRUST) * 6 : 0;
}

/** Leakage between two neighbouring crusted pins (Ω), or 0 for none. */
export function corrosionLeakR(a: number, b: number): number {
  const k = a * b;
  return k > 0.1 ? 30e3 / k : 0;
}

/** Corrode every pad of a part (a little uneven), and mark it. */
export function corrode(b: BoardState, ref: string, amount: number, color: CorrosionColor = 'green', rand: () => number = Math.random): void {
  const c = b.comps[ref];
  const pins: Record<string, number> = { ...(c.corr?.pins ?? {}) };
  for (const pin of pinNames(c)) pins[pin] = Math.min(1, Math.max(pins[pin] ?? 0, amount * (0.75 + rand() * 0.5)));
  c.corr = { color: c.corr?.color ?? color, pins };
  syncMark(c);
}

/** Keep the old `corrosion` mark in step with the crust (the HUD and texts use it). */
export function syncMark(c: CompState): void {
  const any = !!c.corr && Object.values(c.corr.pins).some((v) => v > CLEAN_CRUST);
  if (c.corr && Object.values(c.corr.pins).every((v) => v <= 0)) delete c.corr;
  if (any && !c.marks.includes('corrosion')) c.marks.push('corrosion');
  if (!any) c.marks = c.marks.filter((m) => m !== 'corrosion');
}

/** Old saves only had the mark: give them a matching crust. */
export function migrateCorrosion(c: CompState): void {
  if (c.marks.includes('corrosion') && !c.corr) {
    const pins: Record<string, number> = {};
    for (const pin of pinNames(c)) pins[pin] = 0.5;
    c.corr = { color: 'green', pins };
  }
}

/** Parts with crust worth mentioning. */
export function corrodedRefs(b: BoardState, min = CLEAN_CRUST): string[] {
  return Object.values(b.comps)
    .filter((c) => c.corr && Object.values(c.corr.pins).some((v) => v > min))
    .map((c) => c.ref);
}

/** One day of neglect: crust grows, and creeps onto the pads of nearby parts. */
export function spreadCorrosion(b: BoardState, days = 1): void {
  for (let d = 0; d < days; d++) {
    const src = Object.values(b.comps).filter((c) => c.corr);
    if (!src.length) return;
    const centres = new Map(Object.values(b.comps).map((c) => [c.ref, padsOf(c.def)] as const));
    const grow: [CompState, string, number, CorrosionColor][] = [];
    for (const c of src) {
      const worst = Math.max(...Object.values(c.corr!.pins));
      for (const [pin, v] of Object.entries(c.corr!.pins)) if (v > CLEAN_CRUST) grow.push([c, pin, Math.min(1, v + 0.04), c.corr!.color]);
      if (worst < 0.3) continue;
      // Creep onto pads within ~5 mm of any badly crusted pad (the boards are laid out roomy)
      const hot = centres.get(c.ref)!.filter((_, i) => (c.corr!.pins[pinNames(c)[i]] ?? 0) >= 0.3);
      for (const o of Object.values(b.comps)) {
        if (o === c) continue;
        const names = pinNames(o);
        centres.get(o.ref)!.forEach((p, i) => {
          if (hot.some((h) => Math.hypot(h.x - p.x, h.y - p.y) < 5)) grow.push([o, names[i], Math.max(crustAt(o, names[i]), 0) + 0.03, c.corr!.color]);
        });
      }
    }
    for (const [c, pin, v, color] of grow) {
      c.corr ??= { color, pins: {} };
      c.corr.pins[pin] = Math.min(1, Math.max(c.corr.pins[pin] ?? 0, v));
    }
    for (const c of Object.values(b.comps)) if (c.corr) syncMark(c);
  }
}

/**
 * Whole-board treatment (flood with cleaner, scrub, rinse with IPA): takes off a share
 * of the crust everywhere. Precise per-pad work at the microscope uses far less liquid.
 */
export function treatCorrosion(b: BoardState, share = 0.7): string[] {
  const touched = corrodedRefs(b);
  for (const ref of touched) {
    const c = b.comps[ref];
    for (const pin of Object.keys(c.corr!.pins)) {
      const v = c.corr!.pins[pin] * (1 - share);
      c.corr!.pins[pin] = v < CLEAN_CRUST ? 0 : v;
    }
    syncMark(c);
  }
  return touched;
}
