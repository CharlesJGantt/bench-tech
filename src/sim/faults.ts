/**
 * Fault generation. Each device lists its own fault variants (src/sim/devices); this
 * module picks one, adds red herrings and optional extras (missing parts, a burnt PCB),
 * lets the owner keep using it (so damage propagates), and writes the ticket.
 */
import { usesUsbCharger } from './accessories';
import type { DeviceDef } from './board';
import { breakable, newEnclosure, type EnclosureDef, type EnclosureState } from './enclosure';
import { CORROSION_COLORS, corrode } from './corrosion';
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
  /** Case items (ribbon cables) that arrive torn: fitting a new one clears the fault. */
  torn?: string[];
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

/** Liquid damage: crust on these parts' pads, in one dominant colour per spill. */
export function liquidDamage(b: BoardState, rng: Rng, refs: string[], lo = 0.35, hi = 0.6): void {
  const color = rng.pick(CORROSION_COLORS);
  for (const ref of refs) corrode(b, ref, rng.range(lo, hi), color, () => rng.next());
}

/** The case as it comes in: someone who has been inside may have torn the sticker and lost a screw. */
/** An overheating service: the case is closed, the fan and heatsink are dusty and the paste is dry. */
function dustyEnclosure(def: EnclosureDef): EnclosureState {
  const st = newEnclosure(def);
  st.dusty = true;
  st.dried = def.items.filter((i) => i.kind === 'heatsink').map((i) => i.id);
  return st;
}

/** A dropped device: the shell is cracked and sometimes the clips are snapped too. */
function crackedEnclosure(def: EnclosureDef, rng: Rng): EnclosureState {
  const st = newEnclosure(def);
  const parts = breakable(def);
  const shells = parts.filter((p) => p.kind === 'shell');
  const clips = parts.filter((p) => p.kind === 'clips');
  st.cracked = [];
  if (shells.length) st.cracked.push(rng.pick(shells).id);
  if (clips.length && (!st.cracked.length || rng.next() < 0.5)) st.cracked.push(rng.pick(clips).id);
  return st;
}

/** A device with a damaged ribbon: a closed case, the ribbon marked torn. */
function tornEnclosure(def: EnclosureDef, torn: string[]): EnclosureState {
  const st = newEnclosure(def);
  st.torn = [...torn];
  return st;
}

function intakeEnclosure(def: EnclosureDef, previousRepair: Job['previousRepair'], rng: Rng): EnclosureState {
  const st = newEnclosure(def);
  const opened = previousRepair === 'Yes' || (previousRepair === 'Unknown' && rng.next() < 0.4);
  if (!opened) return st;
  st.stickerBroken = true;
  const screws = def.items.filter((i) => i.screw);
  if (screws.length && rng.next() < 0.5) {
    const s = rng.pick(screws);
    st.screws[s.id] = 0;
    st.missingAtIntake = [s.id];
  }
  // A chewed-up screw head from someone using the wrong bit
  const left = screws.filter((s) => st.screws[s.id]);
  if (left.length && rng.next() < 0.3) st.stripped = [rng.pick(left).id];
  return st;
}

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
  /** The state of the case (absent on old saves: treated as already open). */
  enclosure?: EnclosureState;
  /** Cartridges: which game this one is (same board, different label). */
  title?: string;
  /** What the customer originally paid (cartridge home-test refunds are 10 % of it). */
  paid?: number;
  /** Certified work on this job: what has been done, and the analysis results so far. */
  cert?: JobCert;
  /** An accessory-service job: the device is fine, the customer's charger and/or cable is not. */
  accessory?: { charger: string; cable: string; chargerSold?: boolean; cableSold?: boolean };
  /** A frozen device that just needs a hard reset (hold the power button, or pull the battery). */
  hung?: boolean;
  /** A drive service: its storage is corrupt (re-image it) or dead (fit a new one). */
  drive?: { state: 'corrupt' | 'dead'; reimaged?: boolean; replaced?: boolean };
  /** A scratched game disc to resurface on the buffing machine. */
  disc?: DiscState;
  /** Last Test Station run on this job: day and whether the title screen came up. */
  stationTest?: { day: number; passed: boolean };
}

/** What to call the job's item: "Pipe Brothers (BES Game Pak)" or the device name. */
export function jobName(j: Pick<Job, 'title' | 'device'>): string {
  return j.title ? `${j.title} (${j.device.name})` : j.device.name;
}

/** A scratched disc: arcs of damage, each with a depth (0 = polished out, 1 = through the data layer). */
export interface DiscState {
  scratches: { a0: number; sweep: number; r: number; depth: number }[];
  /** Polishing passes so far, and whether it was polished too thin (cloudy, unreadable). */
  passes: number;
  ruined?: boolean;
  /** Told the customer it cannot be saved. */
  givenUp?: boolean;
}

export const DISC_SAFE_PASSES = 6;
/** Depth at or above which a scratch reaches the data layer and cannot be polished out. */
export const DISC_UNSAVEABLE = 0.85;

/** One polishing pass: takes a layer off every scratch that is not too deep, and thins the disc. */
export function polishDiscPass(d: DiscState): void {
  d.passes++;
  for (const x of d.scratches) if (x.depth < DISC_UNSAVEABLE) x.depth = Math.max(0, Math.round((x.depth - 0.2) * 100) / 100);
  if (d.passes > DISC_SAFE_PASSES) d.ruined = true;
}

function scratchedDisc(rng: Rng): DiscState {
  const n = rng.int(3, 6);
  const scratches = Array.from({ length: n }, () => ({
    a0: rng.range(0, 6.28),
    sweep: rng.range(0.5, 2.6),
    r: rng.range(0.35, 0.95),
    depth: Math.round(rng.range(0.2, 0.9) * 100) / 100,
  }));
  return { scratches, passes: 0 };
}

/** The certification record carried by a job whose device needs sign-off. */
export interface JobCert {
  authority: string;
  fee: number;
  coated: boolean;
  /** Last day the customer will wait (set when the job arrives). */
  dueDay?: number;
  /** Certified part orders must go overnight while this job waits. */
  overnight?: boolean;
  /** Things done that a certified repair does not allow (uncertified solder or flux, ...). */
  violations: string[];
  /** How many analyses have been paid for, and the last report. */
  attempts: number;
  report?: { passed: boolean; lines: { ok: boolean; text: string }[] };
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
  /** A cleaning service rather than a fault: an overheating device that needs its dust cleared and fresh paste. */
  service?: 'overheat' | 'accessory' | 'case' | 'reset' | 'drive' | 'disc';
}

/** Can this device have its cooling serviced (does it have a heatsink)? */
export function canServiceCooling(device: DeviceDef): boolean {
  return !!device.enclosure?.items.some((i) => i.kind === 'heatsink');
}

export function generateJob(device: DeviceDef, seed: number, opts: JobOptions = {}): Job {
  const rng = new Rng(seed);
  const board = createBoard(device);
  if (device.cert?.coated) for (const c of Object.values(board.comps)) if (!c.def.mates) c.coat = 'on';
  const maxTier = opts.maxTier ?? 2;
  const accessoryJob = opts.service === 'accessory' && usesUsbCharger(device);
  const caseJob = opts.service === 'case' && !!device.enclosure && breakable(device.enclosure).length > 0;
  const overheatJob = opts.service === 'overheat' && canServiceCooling(device);
  const resetJob = opts.service === 'reset' && !!device.firmware;
  const driveJob = opts.service === 'drive' && device.category === 'Consoles';
  const discJob = opts.service === 'disc' && device.category === 'Consoles';
  const service = overheatJob || accessoryJob || caseJob || resetJob || driveJob || discJob;
  let hung: boolean | undefined;
  let drive: Job['drive'];
  let disc: Job['disc'];
  let accessory: Job['accessory'];
  let fault: AppliedFault;
  if (accessoryJob) {
    const which = rng.pick(['charger', 'cable', 'both'] as const);
    accessory = { charger: which === 'cable' ? 'bench-pd' : rng.pick(['customer-weak', 'customer-dead']), cable: which === 'charger' ? 'good' : rng.pick(['customer-frayed', 'customer-open']) };
    fault = {
      variant: 'service-accessory',
      family: 'Bad charger or cable',
      tier: 1,
      summary: `Nothing is wrong with the device: the customer's ${which === 'both' ? 'charger and cable are' : which === 'charger' ? 'charger is' : 'cable is'} worn out. Show them with the USB meter and sell a new ${which === 'both' ? 'charger and cable' : which}.`,
      refs: [],
      hint: "Plug the device in with your own charger and cable: if it charges normally, the customer's accessory is the problem. Swap them one at a time on the USB meter to find which is bad, then sell a replacement.",
      flavor: rng.pick(['It will not charge any more, or only if I hold the cable just right.', 'It takes forever to charge now, and sometimes does not charge at all.', 'My phone charger stopped working with this. Is it broken?']),
    };
  } else if (resetJob) {
    hung = true;
    fault = {
      variant: 'service-reset',
      family: 'Frozen: needs a hard reset',
      tier: 1,
      summary: 'Nothing is broken: the firmware locked up. Switch it off, unplug everything and hold the power button for 15 seconds (or disconnect the battery for a moment) to hard reset it.',
      refs: [],
      hint: 'Use "Hard reset" on the ticket: power off, unplug the charger, hold the power button 15 seconds. Then check that it starts.',
      flavor: rng.pick(['It froze on the logo and now it will not respond to anything.', 'The screen went black in the middle of a game and the buttons do nothing.', 'It will not turn on and the charge light does nothing, but it was fine this morning.']),
    };
  } else if (driveJob) {
    const state = rng.pick(['corrupt', 'corrupt', 'dead'] as const);
    drive = { state };
    fault = {
      variant: 'service-drive',
      family: state === 'corrupt' ? 'Corrupt storage' : 'Dead drive',
      tier: 1,
      summary: state === 'corrupt' ? 'The system storage is corrupt: it never finishes booting. Re-image the drive with the drive imager (or fit a new one).' : 'The drive has died: the console cannot even see it. Fit a new drive and re-image it.',
      refs: [],
      hint: state === 'corrupt' ? 'It starts and then hangs on a boot-error screen. Use "Re-image the drive" on the ticket.' : 'It never gets past the logo and the drive is not detected. A drive that is not detected is dead: replace it.',
      flavor: rng.pick(['It shows an error about the system storage and will not start.', 'It hangs on the logo forever and then restarts.', 'It says it needs to repair the system and then fails every time.']),
    };
  } else if (discJob) {
    disc = scratchedDisc(rng);
    fault = {
      variant: 'service-disc',
      family: 'Scratched disc',
      tier: 1,
      summary: 'Nothing wrong with the console: the game disc is scratched and will not read. Resurface it on the disc buffing machine: a few passes with polishing compound. Too many passes and it is polished too thin; a scratch that goes through the data layer cannot be saved.',
      refs: [],
      hint: 'Use the disc buffing station on the ticket. Look at how deep each scratch is, then polish in short passes and check between them.',
      flavor: rng.pick(['The game freezes at the same place every time, and there are scratches all over the disc.', 'My dog dragged the disc across the floor and now the console will not read it.', 'It says "unreadable disc" now.']),
    };
  } else if (caseJob) {
    fault = {
      variant: 'service-case',
      family: 'Broken case',
      tier: 1,
      summary: 'Nothing is wrong with the electronics: it was dropped and the case is cracked. Open it, take the cracked part off, fit a new one and close it up again.',
      refs: [],
      hint: 'Open the case (🔧 Case on the ticket), take off the cracked part, use "Fit new" in the case window and put it back together.',
      flavor: rng.pick(['I dropped it and the back has a big crack in it. It still works, but it rattles.', 'The case split along the seam when it hit the floor. Can you fix the shell?', 'It fell off the shelf. The plastic is cracked and the clips are broken.']),
    };
  } else if (service) {
    fault = {
      variant: 'service-overheat',
      family: 'Overheating: cleaning service',
      tier: 1,
      summary: 'Nothing is broken: the fan and heatsink are choked with dust and the thermal paste has dried out, so it overheats. Clean the dust out (compressed air blower or swabs) and put fresh thermal paste on the chip.',
      refs: [],
      hint: 'Open it up, clean the dust out of the fan and heatsink, then lift the heatsink, wipe off the dried paste and apply fresh paste before putting it back together.',
      flavor: rng.pick(['It gets really hot and the fan screams, then it shuts itself off.', 'It has been getting hotter and slower for months. Can you give it a good clean?', 'It is so hot I cannot touch the case, and it crashes after a few minutes.']),
    };
  } else {
    // Easier tiers stay common even when harder ones unlock.
    const pool = device.variants.filter((v) => (opts.variant ? v.id === opts.variant : v.tier <= maxTier));
    if (!pool.length) throw new Error(`No ${device.id} fault variant matches ${opts.variant ?? maxTier}`);
    const v = rng.weighted(pool.map((x) => [x, x.weight * (x.tier === 1 ? 1.5 : 1)] as [Variant, number]));
    fault = { variant: v.id, family: v.family, tier: v.tier, ...v.apply(board, rng) };
  }

  const faults = [fault];
  if (opts.missingParts && !service) {
    const m = removeParts(board, rng, opts.missingParts);
    if (m) faults.push(m);
  }
  if (opts.unrepairable && device.carbonise.length && !service) faults.push(carboniseBoard(board, rng));

  if (opts.redHerrings !== false && !service) addRedHerrings(board, rng, rng.int(1, 3), !!fault.previousRepair);

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

  // Labour: the device's base rate plus the difficulty of the fault; a valuable device is never quoted
  // below a share of its worth (a significant repair on a $1000 console is $200-300).
  const labour = device.quoteBase + 10 * fault.tier + 5 * rng.int(0, 3) + (history.length ? 10 : 0);
  const quote = Math.round(Math.max(labour, Math.round((device.marketValue * (0.08 + 0.06 * fault.tier)) / 5) * 5) * (device.cert?.premium ?? 1));
  const customer = rng.pick(CUSTOMERS);
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
    customer,
    kind: opts.kind ?? 'customer',
    ...(device.cert ? { cert: { authority: device.cert.authority, fee: device.cert.fee, coated: device.cert.coated, ...(device.cert.overnight ? { overnight: true } : {}), violations: [], attempts: 0 } } : {}),
    ...(accessory ? { accessory } : {}),
    ...(hung ? { hung } : {}),
    ...(drive ? { drive } : {}),
    ...(disc ? { disc } : {}),
    ...(device.enclosure ? { enclosure: fault.torn ? tornEnclosure(device.enclosure, fault.torn) : caseJob ? crackedEnclosure(device.enclosure, rng) : fault.variant === 'screen-cracked' && rng.next() < 0.45 ? crackedEnclosure(device.enclosure, rng) : overheatJob ? dustyEnclosure(device.enclosure) : intakeEnclosure(device.enclosure, previousRepair, rng) } : {}),
    ...(device.titles ? { title: rng.pick(device.titles).name } : {}),
  };
}
