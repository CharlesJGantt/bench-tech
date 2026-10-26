/**
 * BGA work: the balls under a chip are hidden until the chip is off. Pure state machine (no DOM): the station UI calls these
 * with the result of the heat bar. Ball states become open joints (cracked / lifted / missing), intermittent joints (cold) and
 * hidden solder bridges (bridged) on the board, so the normal circuit and functional test see them.
 *
 * Process: inspect -> (reflow in place, < 50 % to fix) or remove -> clean pads -> clean chip -> reball (stencil + balls or paste)
 * -> fit -> test.
 */
import type { BoardState, CompState } from '../sim/circuit';
import { bgaType, onRing, stencilForChip, type BallSize, type BgaType } from '../sim/bgatypes';
import { part, pinsOf } from '../sim/parts';

export type BallState = 'good' | 'cracked' | 'cold' | 'bridged' | 'lifted' | 'missing';
/** Chip side while the chip is off: a ball, a cracked ball, a stripped (bare) pad, or a paste blob that bridged. */
export type ChipBall = 'good' | 'cracked' | 'bare' | 'bridged' | 'weak';
/** Board side while the chip is off. */
export type BoardPad = 'clean' | 'solder' | 'bridged' | 'lifted';
export type Heat = 'cold' | 'good' | 'over';

export interface OffChip {
  /** The chip that was lifted (null when the pads are empty and no chip is held). */
  partNo: string | null;
  chip: Record<string, ChipBall>;
  pads: Record<string, BoardPad>;
  /** Flux left on the chip / board pads (reballing needs it; paste has its own). */
  cleanedChip: boolean;
  burnt: boolean;
}

export interface BgaState {
  /** Ball condition by pin while the chip is on. */
  balls: Record<string, BallState>;
  off?: OffChip;
  /** Reflowed in place before: the repair does not last (comes back). */
  reflowed?: boolean;
  /** Fitted with a reballed chip. */
  reballed?: boolean;
}

export type Rng = () => number;

export const isBga = (c: CompState): boolean => !!c.part && !!bgaType(c.part.pkg);
export const isBgaDef = (c: CompState): boolean => !!bgaType(part(c.def.partNo).pkg);

/** Footprint pin names in pad order. */
export const bgaPins = (c: CompState): string[] => pinsOf(part(c.def.partNo));

export function ensureBga(c: CompState): BgaState {
  if (!c.bga) {
    c.bga = { balls: {} };
    for (const p of bgaPins(c)) c.bga.balls[p] = 'good';
  }
  return c.bga;
}

/** Grid position of a pad index. */
const rc = (n: number, i: number) => ({ r: Math.floor(i / n), c: i % n });

/** Pin names of the ring neighbour a bridged ball touches (next along the ring), or null. */
export function ringNeighbour(c: CompState, pin: string): string | null {
  const pins = bgaPins(c);
  const t = bgaType(part(c.def.partNo).pkg)!;
  const i = pins.indexOf(pin);
  if (i < 0) return null;
  const { r, c: col } = rc(t.n, i);
  if (!onRing(t.n, r, col)) return null;
  const right = col + 1 < t.n && onRing(t.n, r, col + 1) ? i + 1 : -1;
  const down = r + 1 < t.n && onRing(t.n, r + 1, col) ? i + t.n : -1;
  const j = right >= 0 ? right : down;
  return j >= 0 ? pins[j] : null;
}

/** Write ball states into joints and hidden bridge jumpers. Call after any change. */
export function syncBga(b: BoardState, ref: string): void {
  const c = b.comps[ref];
  const st = c.bga;
  b.jumpers = b.jumpers.filter((j) => !(j.bridge && j.hidden === 'ball' && j.a.ref === ref && j.b.ref === ref));
  if (!st || !c.part) return;
  const pins = pinsOf(c.part);
  const joints: CompState['joints'] = {};
  for (const pin of pins) {
    const s = st.balls[pin] ?? 'good';
    joints[pin] =
      s === 'good' || s === 'bridged'
        ? { r: 0 }
        : s === 'cold'
          ? { r: 0.5, cold: true }
          : { r: Infinity, ...(s === 'cracked' ? { cracked: true } : {}) };
    if (b.liftedPads.includes(`${ref}.${pin}`)) joints[pin] = { r: Infinity };
  }
  c.joints = joints;
  for (const pin of pins) {
    if (st.balls[pin] !== 'bridged') continue;
    const n = ringNeighbour(c, pin);
    if (n) b.jumpers.push({ id: b.nextJumperId++, a: { ref, pin }, b: { ref, pin: n }, cold: false, bridge: true, hidden: 'ball' });
  }
}

const countBad = (st: BgaState) => Object.values(st.balls).filter((s) => s !== 'good').length;
export const ballsOk = (st: BgaState): boolean => countBad(st) === 0;

/** A plain-language summary of the hidden balls (only shown once the chip is off or a test points at them). */
export function ballSummary(st: BgaState): string {
  const n: Record<string, number> = {};
  for (const s of Object.values(st.balls)) n[s] = (n[s] ?? 0) + 1;
  return Object.entries(n).filter(([k]) => k !== 'good').map(([k, v]) => `${v} ${k}`).join(', ') || 'all balls good';
}

// ------------------------------------------------------------------------------------------------------------------ reflow

export interface ReflowOpts {
  flux: boolean;
  heat: Heat;
}

/** Chance that a reflow in place fixes cracked / cold balls (below one half, as designed). */
export const REFLOW_FIX_CHANCE = 0.4;

export function reflowInPlace(b: BoardState, ref: string, o: ReflowOpts, rng: Rng = Math.random): string {
  const c = b.comps[ref];
  if (!isBga(c)) return `${ref} is not a BGA chip, or it is off the board.`;
  const st = ensureBga(c);
  if (!o.flux) return `Dry reflow of ${ref}: no flux, so nothing changes. Flux the edges of the chip first.`;
  if (o.heat === 'cold') return `${ref} did not get hot enough to melt the balls. Nothing changed.`;
  if (!c.marks.includes('rework-residue')) c.marks.push('rework-residue');
  if (o.heat === 'over') {
    const pins = Object.keys(st.balls);
    const pin = pins[Math.floor(rng() * pins.length)];
    st.balls[pin] = 'lifted';
    if (rng() < 0.5) c.burnt = true;
    syncBga(b, ref);
    return c.burnt ? `Too much heat: ${ref} cooked and a pad lifted under it.` : `Too much heat: a pad lifted under ${ref}.`;
  }
  st.reflowed = true;
  const bad = Object.entries(st.balls).filter(([, s]) => s === 'cracked' || s === 'cold');
  if (!bad.length) {
    syncBga(b, ref);
    return `${ref} reflowed. The balls looked fine anyway.`;
  }
  if (rng() < REFLOW_FIX_CHANCE) {
    for (const [pin] of bad) st.balls[pin] = 'good';
    syncBga(b, ref);
    return `${ref} reflowed: the cracked balls re-melted and the chip works again. This is only a temporary fix.`;
  }
  syncBga(b, ref);
  return `${ref} reflowed, but it made no difference.`;
}

// ------------------------------------------------------------------------------------------------------------------ remove

export function removeBga(b: BoardState, ref: string, o: { flux: boolean; heat: Heat }, rng: Rng = Math.random): string {
  const c = b.comps[ref];
  if (!isBga(c)) return `${ref} is not on the board.`;
  const st = ensureBga(c);
  const partNo = c.part!.partNo;
  if (o.heat === 'cold') return `The solder under ${ref} has not melted. Lifting now would tear the pads: keep heating.`;
  const pins = bgaPins(c);
  const chip: Record<string, ChipBall> = {};
  const pads: Record<string, BoardPad> = {};
  for (const p of pins) {
    const s = st.balls[p] ?? 'good';
    chip[p] = s === 'cracked' ? 'cracked' : s === 'good' || s === 'cold' ? 'good' : s === 'bridged' ? 'bridged' : 'bare';
    pads[p] = s === 'lifted' ? 'lifted' : s === 'missing' ? 'clean' : s === 'bridged' ? 'bridged' : 'solder';
  }
  let burnt = c.burnt;
  let note = '';
  if (o.heat === 'over') {
    // too hot: pads lift with the chip, the chip may cook
    for (const p of pins.filter(() => rng() < 0.08)) pads[p] = 'lifted';
    if (rng() < 0.5) burnt = true;
    note = burnt ? ' It was cooked by the heat.' : ' Some pads came up with it.';
  }
  c.bga = { balls: {}, off: { partNo, chip, pads, cleanedChip: false, burnt }, ...(st.reflowed ? { reflowed: true } : {}) };
  for (const [p, s] of Object.entries(pads)) if (s === 'lifted') liftKey(b, ref, p);
  c.part = null;
  c.fault = null;
  c.burnt = false;
  c.reversed = false;
  if (!c.marks.includes('rework-residue')) c.marks.push('rework-residue');
  for (const pin of Object.keys(c.joints)) c.joints[pin] = { r: 0 };
  syncBga(b, ref);
  return `${ref} lifted off.${note} ${padSummary(c.bga.off!)}`;
}

const liftKey = (b: BoardState, ref: string, pin: string) => {
  const k = `${ref}.${pin}`;
  if (!b.liftedPads.includes(k)) b.liftedPads.push(k);
};

export function padSummary(off: OffChip): string {
  const n: Record<string, number> = {};
  for (const s of Object.values(off.pads)) n[s] = (n[s] ?? 0) + 1;
  const bits = [n.solder ? `${n.solder} pads have old solder` : '', n.bridged ? `${n.bridged} bridged` : '', n.lifted ? `${n.lifted} lifted` : '', n.clean ? `${n.clean} clean` : ''].filter(Boolean);
  return `Pads: ${bits.join(', ')}.`;
}

// ------------------------------------------------------------------------------------------------------------------ clean

/** Clean the board pads with flux and wick: old solder and bridges go; lifted pads stay lifted. */
export function cleanBoardPads(b: BoardState, ref: string, o: { flux: boolean; wick: boolean }): string {
  const c = b.comps[ref];
  const off = c.bga?.off;
  if (!off) return `${ref}: the chip is still on.`;
  if (!o.flux || !o.wick) return 'Cleaning the pads needs flux and solder wick.';
  for (const p of Object.keys(off.pads)) if (off.pads[p] === 'solder' || off.pads[p] === 'bridged') off.pads[p] = 'clean';
  return `${ref} pads cleaned and flat. ${padSummary(off)}`;
}

/** Strip the old balls off a chip and clean it, ready for a stencil. */
export function cleanChip(b: BoardState, ref: string, o: { flux: boolean; wick: boolean }): string {
  const off = b.comps[ref].bga?.off;
  if (!off?.partNo) return 'There is no chip to clean.';
  if (!o.flux || !o.wick) return 'Cleaning the chip needs flux and solder wick.';
  for (const p of Object.keys(off.chip)) off.chip[p] = 'bare';
  off.cleanedChip = true;
  return 'The chip is stripped bare and shiny, ready to reball.';
}

// ------------------------------------------------------------------------------------------------------------------ reball

export type FillMethod = 'balls' | 'paste';

export interface Stencil {
  /** Stencil id etched on it (ST-01...). */
  id: string;
  warped: boolean;
}

export interface ReballOpts {
  stencil: Stencil;
  method: FillMethod;
  /** Ball diameter of the balls used (method 'balls'). */
  ballMm?: BallSize;
  /** Flux laid on the chip (method 'balls'; paste has its own). */
  flux: boolean;
  heat: Heat;
}

/** Chance that stencilled paste leaves some pads too little or too much. */
export const PASTE_BAD_CHANCE = 0.2;

export function stencilFits(partNo: string, stencil: Stencil): boolean {
  const p = part(partNo);
  const t = stencilForChip(p.marking ?? '');
  return !!t && t.stencil === stencil.id;
}

/** Reball the held chip. Mutates the stencil (it warps if overheated) and the chip's balls. */
export function reballChip(b: BoardState, ref: string, o: ReballOpts, rng: Rng = Math.random): string {
  const off = b.comps[ref].bga?.off;
  if (!off?.partNo) return 'There is no chip held in the vise.';
  if (!off.cleanedChip && Object.values(off.chip).some((s) => s !== 'bare')) return 'Strip and clean the old balls off the chip first.';
  if (o.stencil.warped) return `Stencil ${o.stencil.id} is warped: the holes no longer line up. Replace it.`;
  if (!stencilFits(off.partNo, o.stencil)) {
    const need = stencilForChip(part(off.partNo).marking ?? '');
    return `Stencil ${o.stencil.id} does not fit this chip. It needs ${need?.stencil ?? 'another stencil'} (chip code ${part(off.partNo).marking}).`;
  }
  const t = stencilForChip(part(off.partNo).marking ?? '')!;
  if (o.method === 'balls') {
    if (o.ballMm !== t.ballMm) return `These balls are the wrong size: this stencil takes ${t.ballMm.toFixed(2)} mm balls.`;
    if (!o.flux) return 'Lay a thin layer of flux on the chip first so the balls stay put.';
  }
  if (o.heat === 'cold') return 'The balls did not melt into bumps. Heat the chip more.';
  const pins = Object.keys(off.chip);
  if (o.heat === 'over') {
    o.stencil.warped = true;
    if (rng() < 0.4) off.burnt = true;
    for (const p of pins) off.chip[p] = 'good';
    return off.burnt ? `Too hot: stencil ${o.stencil.id} warped and the chip cooked.` : `Too hot: the bumps formed but stencil ${o.stencil.id} warped. Buy a new one before the next job.`;
  }
  for (const p of pins) off.chip[p] = 'good';
  off.cleanedChip = false;
  if (o.method === 'paste' && rng() < PASTE_BAD_CHANCE) {
    const ring = pins.filter((_, i) => onRing(t.n, rc(t.n, i).r, rc(t.n, i).c));
    const n = 1 + Math.floor(rng() * 3);
    for (let k = 0; k < n; k++) {
      const p = ring[Math.floor(rng() * ring.length)];
      off.chip[p] = rng() < 0.5 ? 'weak' : 'bridged';
    }
    return 'Reballed with paste. The bumps formed, but the scraper left a few pads uneven.';
  }
  return o.method === 'balls' ? 'Reballed: every hole took a ball and every bump is perfect.' : 'Reballed with paste: the bumps look even.';
}

// ------------------------------------------------------------------------------------------------------------------ fit

export interface FitOpts {
  /** The chip to fit: the one held in the vise, or a new one from stock (comes with good balls). */
  partNo: string;
  fromStock: boolean;
  flux: boolean;
  heat: Heat;
  /** Lined up on the pads. */
  aligned: boolean;
}

/** Fit a chip on the empty footprint. A new chip has balls; a used or donor chip arrives bare and must be reballed first. */
export function fitBga(b: BoardState, ref: string, o: FitOpts, rng: Rng = Math.random): string {
  const c = b.comps[ref];
  if (c.part) return `Remove the old ${ref} first.`;
  const p = part(o.partNo);
  if (p.pkg !== part(c.def.partNo).pkg) return `${p.label} does not fit ${ref}.`;
  const pins = bgaPins(c);
  const off = c.bga?.off;
  const pads: Record<string, BoardPad> = off?.pads ?? Object.fromEntries(pins.map((x) => [x, 'clean' as BoardPad]));
  let chip: Record<string, ChipBall>;
  if (o.fromStock) chip = Object.fromEntries(pins.map((x) => [x, 'good' as ChipBall]));
  else if (off?.partNo === o.partNo) chip = off.chip;
  else return 'That chip is not in the vise.';
  if (o.heat === 'cold') return `${ref} did not reflow: the balls have not melted yet. Heat it more.`;
  const balls: Record<string, BallState> = {};
  for (const x of pins) {
    const cs = chip[x];
    const bs = pads[x];
    if (cs === 'bare' || cs === 'weak') balls[x] = 'missing';
    else if (cs === 'cracked') balls[x] = 'cracked';
    else balls[x] = 'good';
    if (cs === 'bridged' || bs === 'bridged') balls[x] = 'bridged';
    if (bs === 'lifted') balls[x] = 'lifted';
    else if (bs === 'solder' && balls[x] === 'good') balls[x] = 'cold'; // dirty pad: uneven, intermittent
  }
  if (!o.flux && !o.fromStock) for (const x of pins) if (balls[x] === 'good') balls[x] = 'cold';
  if (!o.aligned) {
    for (const x of pins) if (balls[x] === 'good' && rng() < 0.35) balls[x] = rng() < 0.5 ? 'bridged' : 'missing';
  }
  let burnt = off?.burnt ?? false;
  if (o.heat === 'over' && rng() < 0.5) burnt = true;
  const reballed = !o.fromStock && off?.partNo === o.partNo;
  c.bga = { balls, ...(reballed ? { reballed: true } : {}), ...(c.bga?.reflowed ? { reflowed: true } : {}) };
  c.part = p;
  c.fault = null;
  c.burnt = burnt;
  c.replaced = true;
  if (!c.marks.includes('rework-residue')) c.marks.push('rework-residue');
  syncBga(b, ref);
  const bad = countBad(c.bga);
  return burnt ? `${ref} fitted, but the chip was cooked by the heat.` : bad ? `${ref} fitted. (${bad} ball${bad > 1 ? 's' : ''} not right: test it.)` : `${ref} fitted. All balls look right.`;
}

/** Specs for the UI: all the BGA components on a board. */
export function bgaRefs(b: BoardState): string[] {
  return Object.keys(b.comps).filter((r) => isBgaDef(b.comps[r]));
}

export function typeOf(c: CompState): BgaType | undefined {
  return bgaType(part(c.def.partNo).pkg);
}
