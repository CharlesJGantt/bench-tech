/**
 * Fault generation. Each device lists its own fault variants (src/sim/devices); this
 * module picks one, adds red herrings and optional extras (missing parts, a burnt PCB),
 * lets the owner keep using it (so damage propagates), and writes the ticket.
 */
import type { DeviceDef } from './board';
import { createBoard, functionalTest, type BoardState, type DamageEvent, type Mark } from './circuit';

// ---------------------------------------------------------------------------
// Seeded RNG (mulberry32)
// ---------------------------------------------------------------------------

export class Rng {
  private s: number;
  constructor(seed: number) {
    this.s = seed >>> 0;
  }
  next(): number {
    let t = (this.s = (this.s + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(a: number, b: number): number {
    return a + (b - a) * this.next();
  }
  int(a: number, b: number): number {
    return Math.floor(this.range(a, b + 1));
  }
  pick<T>(xs: readonly T[]): T {
    return xs[Math.floor(this.next() * xs.length)];
  }
  weighted<T>(xs: readonly [T, number][]): T {
    const total = xs.reduce((s, [, w]) => s + w, 0);
    let r = this.next() * total;
    for (const [x, w] of xs) {
      r -= w;
      if (r <= 0) return x;
    }
    return xs[xs.length - 1][0];
  }
}

// ---------------------------------------------------------------------------
// Fault variants
// ---------------------------------------------------------------------------

/**
 * 1 = approachable: clear evidence, often visible (blown fuse, burnt part, loose jack, shorted rail).
 * 2 = needs a few measurements and some reasoning.
 * 3 = expert: subtle or cascading. Never in early jobs.
 */
export type Tier = 1 | 2 | 3;

export interface AppliedFault {
  variant: string;
  family: string;
  tier: Tier;
  /** What actually went wrong, revealed in the debrief. */
  summary: string;
  refs: string[];
  /** Guided-mode nudge. */
  hint: string;
  /** Optional complaint flavour that overrides the symptom-derived text. */
  flavor?: string;
  previousRepair?: boolean;
}

export interface Variant {
  id: string;
  family: string;
  tier: Tier;
  weight: number;
  apply(b: BoardState, rng: Rng): Omit<AppliedFault, 'variant' | 'family' | 'tier'>;
}

export const addMark = (b: BoardState, ref: string, m: Mark) => {
  const marks = b.comps[ref].marks;
  if (!marks.includes(m)) marks.push(m);
};

const RED_HERRINGS: Mark[] = ['residue', 'crooked', 'discolored', 'scratch'];

function addRedHerrings(b: BoardState, rng: Rng, count: number, previousRepair: boolean): void {
  const refs = Object.keys(b.comps).filter((r) => !r.startsWith('TP') && b.comps[r].marks.length === 0 && !b.comps[r].def.mates);
  for (let i = 0; i < count && refs.length; i++) {
    addMark(b, rng.pick(refs), previousRepair && rng.next() < 0.5 ? 'rework-residue' : rng.pick(RED_HERRINGS));
  }
}

function removeParts(board: BoardState, rng: Rng, count: number): AppliedFault | null {
  const refs: string[] = [];
  const pool = board.device.missable.filter((r) => board.comps[r]?.part && !board.comps[r].fault);
  for (let i = 0; i < count && pool.length; i++) {
    const ref = pool.splice(Math.floor(rng.next() * pool.length), 1)[0];
    const c = board.comps[ref];
    c.part = null;
    c.marks = c.marks.filter((m) => m !== 'crooked');
    if (!c.def.mates && !c.marks.includes('rework-residue')) c.marks.push('rework-residue');
    refs.push(ref);
  }
  if (!refs.length) return null;
  return {
    variant: 'missing-parts',
    family: 'Missing parts',
    tier: 1,
    summary: `Parts had been pulled off: ${refs.join(', ')}.`,
    refs,
    hint: 'Look for empty footprints and check the parts list for what goes there.',
  };
}

function carboniseBoard(board: BoardState, rng: Rng): AppliedFault {
  const [a, b, near] = rng.pick(board.device.carbonise);
  board.pcbDamage.push({ a, b, r: rng.range(1.2, 4), near });
  const n = board.comps[near].def;
  for (const ref of Object.keys(board.comps)) {
    const d = board.comps[ref].def;
    if (d.mates || Math.hypot(d.x - n.x, d.y - n.y) > 7) continue;
    addMark(board, ref, 'scorch');
  }
  return {
    variant: 'carbonised-pcb',
    family: 'Damaged PCB',
    tier: 3,
    summary: `The fibreglass under ${near} burnt and carbonised, leaving a permanent short from ${a} to ${b} inside the board. Not repairable — scrap it for parts.`,
    refs: [near],
    hint: 'If a short stays after removing every part on that rail, the board itself is burnt.',
  };
}

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------

export interface Job {
  seed: number;
  device: DeviceDef;
  board: BoardState;
  faults: AppliedFault[];
  /** Damage that happened while the customer kept using it. */
  history: DamageEvent[];
  complaint: string;
  previousRepair: 'Yes' | 'No' | 'Unknown';
  previousRepairNote?: string;
  quote: number;
  customer: string;
  /** Who it belongs to: a paying customer, a free warranty return, or your own flip project. */
  kind: 'customer' | 'warranty' | 'project';
}

const CUSTOMERS = ['Dana P.', 'Marcus L.', 'Priya S.', 'Tom W.', 'Ines R.', 'Kofi A.', 'Jun H.', 'Sam B.', 'Alex M.', 'Rosa G.', 'Leah K.', 'Omar F.', 'Wren T.', 'Yuki N.'];

export interface JobOptions {
  /** Highest fault tier allowed (default 2). */
  maxTier?: Tier;
  redHerrings?: boolean;
  /** Force a specific variant id (debug / tests). */
  variant?: string;
  /** Parts already pulled off the board by a previous owner. */
  missingParts?: number;
  /** Carbonised PCB: not repairable, only good for spare parts. */
  unrepairable?: boolean;
  kind?: Job['kind'];
}

export function generateJob(device: DeviceDef, seed: number, opts: JobOptions = {}): Job {
  const rng = new Rng(seed);
  const board = createBoard(device);
  const maxTier = opts.maxTier ?? 2;
  // Easier tiers stay common even when harder ones unlock.
  const pool = device.variants.filter((v) => (opts.variant ? v.id === opts.variant : v.tier <= maxTier));
  if (!pool.length) throw new Error(`No ${device.id} fault variant matches ${opts.variant ?? maxTier}`);
  const v = rng.weighted(pool.map((x) => [x, x.weight * (x.tier === 1 ? 1.5 : 1)] as [Variant, number]));
  const fault: AppliedFault = { variant: v.id, family: v.family, tier: v.tier, ...v.apply(board, rng) };

  const faults = [fault];
  if (opts.missingParts) {
    const m = removeParts(board, rng, opts.missingParts);
    if (m) faults.push(m);
  }
  if (opts.unrepairable && device.carbonise.length) faults.push(carboniseBoard(board, rng));

  if (opts.redHerrings !== false) addRedHerrings(board, rng, rng.int(1, 3), !!fault.previousRepair);

  // The owner kept using it — let the fault propagate.
  const report = functionalTest(board);
  const history = report.events;
  for (const e of history) if (!fault.refs.includes(e.ref)) fault.refs.push(e.ref);

  let complaint = fault.flavor ?? device.complain(report, history, rng);
  if (fault.flavor && history.length) complaint += ' I think I heard a little pop.';

  const previousRepair: Job['previousRepair'] = fault.previousRepair ? 'Yes' : rng.next() < 0.75 ? 'No' : 'Unknown';
  let previousRepairNote: string | undefined;
  if (fault.previousRepair) previousRepairNote = rng.pick(['My cousin tried fixing it.', 'Another shop had it for a week and gave up.', 'I watched a video and replaced a part myself.']);
  else if (previousRepair === 'Unknown') previousRepairNote = 'Bought it second-hand.';

  const quote = device.quoteBase + 10 * fault.tier + 5 * rng.int(0, 3) + (history.length ? 10 : 0);
  return {
    seed,
    device,
    board,
    faults,
    history,
    complaint,
    previousRepair,
    previousRepairNote,
    quote,
    customer: rng.pick(CUSTOMERS),
    kind: opts.kind ?? 'customer',
  };
}
