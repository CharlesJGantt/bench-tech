import { cloneBoard, functionalTest, padNames, type BoardState, type FunctionalReport, type Mark, type PointRef } from './circuit';
import type { Job } from './faults';
import { PIN_NAMES, part } from './parts';
import { CLEAN_CRUST, corrodedRefs } from './corrosion';
import { enclosureIssues } from './enclosure';
import { contactIssues } from './contacts';

/** Outcome of a soldering action, from the soldering minigame. */
export type SolderQuality = 'good' | 'cold' | 'overheated';

/** Marks that belong to the physical part (they leave with it). */
const PART_MARKS: Mark[] = ['crooked', 'loose', 'bent-pin', 'bulged', 'discolored'];

function addMark(marks: Mark[], m: Mark) {
  if (!marks.includes(m)) marks.push(m);
}

function liftPad(b: BoardState, ref: string, pin: string) {
  const key = `${ref}.${pin}`;
  if (!b.liftedPads.includes(key)) b.liftedPads.push(key);
}

/** Reflow every joint of a component. Fixes cracked/cold joints if done well. */
export function reflow(b: BoardState, ref: string, q: SolderQuality, rng: () => number = Math.random): string {
  const c = b.comps[ref];
  if (!c.part) return `${ref} is not installed.`;
  const pins = Object.keys(c.joints);
  for (const pin of pins) c.joints[pin] = q === 'cold' ? { r: 0.5, cold: true } : { r: 0 };
  addMark(c.marks, 'rework-residue');
  if (q === 'overheated') {
    const pin = pins[Math.floor(rng() * pins.length)];
    liftPad(b, ref, pin);
    return `Too much heat — the pad under ${ref} pin ${pin} lifted off the board.`;
  }
  return q === 'cold' ? `${ref} reflowed, but the joints look dull and grainy.` : `${ref} reflowed. Joints look shiny and clean.`;
}

export function removePart(b: BoardState, ref: string, q: SolderQuality, rng: () => number = Math.random): string {
  const c = b.comps[ref];
  if (!c.part) return `${ref} is already removed.`;
  c.part = null;
  c.fault = null;
  c.reversed = false;
  c.burnt = false;
  // Lifting the part and cleaning its pads also clears solder bridges across its pins.
  b.jumpers = b.jumpers.filter((j) => !(j.bridge && j.a.ref === ref && j.b.ref === ref));
  c.marks = c.marks.filter((m) => !PART_MARKS.includes(m));
  addMark(c.marks, 'rework-residue');
  for (const pin of Object.keys(c.joints)) c.joints[pin] = { r: 0 };
  if (q === 'overheated') {
    const pins = padNames(c);
    const pin = pins[Math.floor(rng() * pins.length)];
    liftPad(b, ref, pin);
    return `${ref} removed — but a pad (${pin}) lifted with it.`;
  }
  return `${ref} removed.`;
}

/** Install a part on an empty footprint. The package must match. */
export function installPart(b: BoardState, ref: string, partNo: string, reversed: boolean, q: SolderQuality, rng: () => number = Math.random): string {
  const c = b.comps[ref];
  if (c.part) return `Remove the old ${ref} first.`;
  const p = part(partNo);
  const fp = part(c.def.partNo);
  if (p.pkg !== fp.pkg) throw new Error(`${p.partNo} (${p.pkg}) does not fit ${ref} (${fp.pkg})`);
  c.part = p;
  c.reversed = reversed && PIN_NAMES[p.kind].length === 2;
  c.fault = null;
  c.burnt = false;
  c.replaced = true;
  addMark(c.marks, 'rework-residue');
  const pins = PIN_NAMES[p.kind];
  c.joints = {};
  for (const pin of pins) c.joints[pin] = q === 'cold' ? { r: 0.5, cold: true } : { r: 0 };
  if (q === 'overheated') {
    const pin = padNames(c)[Math.floor(rng() * pins.length)];
    liftPad(b, ref, pin);
    return `${ref} installed — but too much heat lifted the ${pin} pad.`;
  }
  return q === 'cold' ? `${ref} installed. The joints look dull and lumpy.` : `${ref} installed.`;
}

/** How far apart two points on the board are, in mm (a little extra for the wire's path). */
export function wireLength(b: BoardState, a: PointRef, z: PointRef): number {
  const pa = b.comps[a.ref]?.def;
  const pz = b.comps[z.ref]?.def;
  if (!pa || !pz) return 30;
  return Math.max(8, Math.round(Math.hypot(pa.x - pz.x, pa.y - pz.y) * 1.2));
}

export interface WireOptions {
  gauge?: 30 | 34 | 38;
  /** The pads were scraped with the pen grinder first. */
  scraped?: boolean;
}

export function addJumper(b: BoardState, a: PointRef, z: PointRef, q: SolderQuality, opts: WireOptions = {}): string {
  const len = opts.gauge ? wireLength(b, a, z) : undefined;
  b.jumpers.push({ id: b.nextJumperId++, a, b: z, cold: q === 'cold', ...(opts.gauge ? { gauge: opts.gauge, len, masked: !opts.scraped } : {}) });
  const how = opts.gauge ? ` with ${opts.gauge}-gauge copper wire` : '';
  return `Jumper wire added from ${a.ref}.${a.pin} to ${z.ref}.${z.pin}${how}${q === 'cold' ? ' (joints look dull)' : ''}.`;
}

/** Cover a repair wire with UV-cured mask. */
export function sealJumper(b: BoardState, id: number): boolean {
  const j = b.jumpers.find((x) => x.id === id);
  if (!j || j.bridge || j.sealed) return false;
  j.sealed = true;
  return true;
}

/** Is this net one that carries real current? */
function powerPoint(b: BoardState, p: PointRef): boolean {
  const c = b.comps[p.ref];
  return !!c && !!b.device.nets[c.def.pins[p.pin]]?.power;
}

export function removeJumper(b: BoardState, id: number): void {
  b.jumpers = b.jumpers.filter((j) => j.id !== id);
}

/** Wipe flux residue off the whole board with IPA. */
export function cleanBoard(b: BoardState): void {
  for (const c of Object.values(b.comps)) c.marks = c.marks.filter((m) => m !== 'residue' && m !== 'rework-residue');
}

// ---------------------------------------------------------------------------
// Evaluation
// ---------------------------------------------------------------------------

export type Outcome = 'fixed' | 'comeback' | 'not-fixed';

export interface Evaluation {
  outcome: Outcome;
  report: FunctionalReport;
  /** Problems that pass the customer's test but will come back. */
  hidden: string[];
  /** Cosmetic / review issues. */
  notes: string[];
  payout: number;
  /** Parts fitted during the repair, billed to the customer on top of the labour quote. */
  partsBilled: number;
  partsCost: number;
  reputation: number;
}

export function evaluate(job: Job, b: BoardState, partsCost: number): Evaluation {
  const report = functionalTest(cloneBoard(b));
  // A cleaning service is only done when it runs cool again: dust and dried paste both have to go
  if (job.faults.some((f) => f.variant === 'service-overheat') && (job.enclosure?.dusty || job.enclosure?.dried?.length)) {
    report.checks.push({ label: 'Runs cool after the service', ok: false });
    report.passed = false;
  }
  const hidden: string[] = [];
  const notes: string[] = [];
  for (const c of Object.values(b.comps)) {
    if (!c.part) {
      if (c.def.partNo !== 'TP') hidden.push(`${c.ref} is missing.`);
      continue;
    }
    if (Object.values(c.joints).some((j) => j.cold)) hidden.push(`Cold solder joints on ${c.ref} will crack within weeks.`);
    if (c.burnt) hidden.push(`${c.ref} is heat-damaged and was left on the board.`);
    if (c.part.partNo !== c.def.partNo) {
      if (c.part.kind === 'fuse' && c.part.value > part(c.def.partNo).value) hidden.push(`${c.ref} is an oversized fuse (${c.part.label}) — a fire risk.`);
      else notes.push(`${c.ref} is a ${c.part.label} part; the board calls for ${part(c.def.partNo).label}.`);
    }
    if (c.marks.includes('rework-residue')) notes.push(`Sticky flux left around ${c.ref}.`);
  }
  for (const j of b.jumpers) {
    if (j.bridge) hidden.push(`Solder bridge between ${j.a.ref}.${j.a.pin} and ${j.b.ref}.${j.b.pin}.`);
    else if (j.cold) hidden.push(`Jumper wire ${j.id} has cold joints.`);
    else if (!j.gauge) notes.push(`Jumper ${j.id} is loose hookup wire — a proper repair uses fine copper wire sealed with UV mask.`);
    else {
      if (j.masked) hidden.push(`Repair wire ${j.id} was soldered onto mask-covered copper — the bond is weak and will let go.`);
      if (!j.sealed) hidden.push(`Repair wire ${j.id} is not sealed with UV solder mask — it can catch and snap.`);
      if (j.gauge === 38 && (powerPoint(b, j.a) || powerPoint(b, j.b))) hidden.push(`Repair wire ${j.id} is too thin (38 gauge) for a power trace — it will overheat.`);
    }
  }
  for (const ref of corrodedRefs(b, 0.2)) hidden.push(`Corrosion left on the pads of ${ref} — it keeps spreading and will come back.`);
  for (const ref of corrodedRefs(b, CLEAN_CRUST)) if (!corrodedRefs(b, 0.2).includes(ref)) notes.push(`Traces of corrosion left around ${ref}.`);
  for (const ref of Object.keys(b.comps)) if (b.comps[ref].marks.includes('scorch') && b.comps[ref].burnt) hidden.push(`Scorched board around ${ref}.`);

  const con = contactIssues(b);
  hidden.push(...con.hidden);
  notes.push(...con.notes);
  const enc = enclosureIssues(job.device.enclosure, job.enclosure);
  hidden.push(...enc.hidden);
  notes.push(...enc.notes);
  const uniqueNotes = [...new Set(notes)];
  let outcome: Outcome;
  if (!report.passed) outcome = 'not-fixed';
  else if (hidden.length) outcome = 'comeback';
  else outcome = 'fixed';

  const residuePenalty = uniqueNotes.some((n) => n.startsWith('Sticky flux')) ? 1 : 0;
  // Parts you fitted are charged at cost plus 50 %, on top of the quote (the labour)
  const partsBilled = Math.round(Object.values(b.comps).reduce((t, c) => t + (c.replaced && c.part && c.part.kind !== 'testpoint' ? c.part.cost * 1.5 : 0), 0));
  const payout = outcome === 'not-fixed' ? 0 : job.quote + partsBilled;
  const reputation = outcome === 'fixed' ? 5 - residuePenalty : outcome === 'comeback' ? -4 : -3;
  return { outcome, report, hidden, notes: uniqueNotes, payout, partsBilled, partsCost, reputation };
}
