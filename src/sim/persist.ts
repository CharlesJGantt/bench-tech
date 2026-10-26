/**
 * JSON-safe save format for boards and jobs (localStorage). Device definitions and
 * part specs are stored by id and re-attached on load; Infinity joint resistances
 * are encoded as -1 because JSON has no Infinity.
 */
import { createBoard, type BoardState, type CompFault, type Jumper, type Mark } from './circuit';
import { generateJob, type AppliedFault, type Job } from './faults';
import { part } from './parts';
import type { BgaState } from '../rework/bga';
import { migrateCorrosion, type Corrosion } from './corrosion';
import { DEVICES } from './devices';

export { DEVICES };

export interface SavedBoard {
  deviceId: string;
  comps: Record<
    string,
    {
      partNo: string | null;
      reversed: boolean;
      fault: CompFault | null;
      joints: Record<string, { r: number; cracked?: boolean; cold?: boolean }>;
      burnt: boolean;
      marks: Mark[];
      replaced: boolean;
      unplugged?: boolean;
      corr?: Corrosion;
      oxide?: Record<string, number>;
      brightened?: string[];
      debris?: { lint: number; packed: number; loose: number };
      bent?: string[];
      certified?: boolean;
      coat?: 'on' | 'removed' | 'reapplied';
      bga?: BgaState;
    }
  >;
  traces: Record<string, { broken: boolean }>;
  liftedPads: string[];
  cutPads?: string[];
  jumpers: Jumper[];
  nextJumperId: number;
  pcbDamage: BoardState['pcbDamage'];
}

export interface SavedJob extends Omit<Job, 'device' | 'board'> {
  deviceId: string;
  board: SavedBoard;
}

const encR = (r: number) => (Number.isFinite(r) ? r : -1);
const decR = (r: number) => (r < 0 ? Infinity : r);

export function saveBoard(b: BoardState): SavedBoard {
  const comps: SavedBoard['comps'] = {};
  for (const c of Object.values(b.comps)) {
    const joints: SavedBoard['comps'][string]['joints'] = {};
    for (const [pin, j] of Object.entries(c.joints)) joints[pin] = { ...j, r: encR(j.r) };
    const fault = c.fault?.type === 'short' ? { ...c.fault } : c.fault;
    comps[c.ref] = { partNo: c.part?.partNo ?? null, reversed: c.reversed, fault, joints, burnt: c.burnt, marks: [...c.marks], replaced: c.replaced, unplugged: c.unplugged, ...(c.corr ? { corr: structuredClone(c.corr) } : {}), ...(c.oxide ? { oxide: { ...c.oxide }, brightened: [...(c.brightened ?? [])] } : {}), ...(c.debris ? { debris: { ...c.debris } } : {}), ...(c.bent ? { bent: [...c.bent] } : {}), ...(c.certified ? { certified: true } : {}), ...(c.coat ? { coat: c.coat } : {}), ...(c.bga ? { bga: structuredClone(c.bga) } : {}) };
  }
  return {
    deviceId: b.device.id,
    comps,
    traces: structuredClone(b.traces),
    liftedPads: [...b.liftedPads],
    cutPads: [...(b.cutPads ?? [])],
    jumpers: structuredClone(b.jumpers),
    nextJumperId: b.nextJumperId,
    pcbDamage: structuredClone(b.pcbDamage),
  };
}

export function loadBoard(s: SavedBoard): BoardState {
  const device = DEVICES[s.deviceId];
  if (!device) throw new Error(`Unknown device ${s.deviceId}`);
  const b = createBoard(device);
  for (const [ref, c] of Object.entries(s.comps)) {
    const comp = b.comps[ref];
    if (!comp) continue;
    comp.part = c.partNo ? part(c.partNo) : null;
    comp.reversed = c.reversed;
    comp.fault = c.fault;
    comp.joints = {};
    for (const [pin, j] of Object.entries(c.joints)) comp.joints[pin] = { ...j, r: decR(j.r) };
    comp.burnt = c.burnt;
    comp.marks = [...c.marks];
    comp.replaced = c.replaced;
    comp.unplugged = c.unplugged;
    if (c.corr) comp.corr = structuredClone(c.corr);
    if (c.oxide) {
      comp.oxide = { ...c.oxide };
      comp.brightened = [...(c.brightened ?? [])];
    }
    if (c.debris) comp.debris = { ...c.debris };
    if (c.bent) comp.bent = [...c.bent];
    if (c.certified) comp.certified = true;
    if (c.coat) comp.coat = c.coat;
    if (c.bga) comp.bga = structuredClone(c.bga);
    migrateCorrosion(comp);
  }
  b.traces = structuredClone(s.traces);
  b.liftedPads = [...s.liftedPads];
  b.cutPads = [...(s.cutPads ?? [])];
  b.jumpers = structuredClone(s.jumpers);
  b.nextJumperId = s.nextJumperId;
  b.pcbDamage = structuredClone(s.pcbDamage ?? []);
  return b;
}

export function saveJob(j: Job): SavedJob {
  const { device, board, ...rest } = j;
  return structuredClone({ ...rest, deviceId: device.id, board: saveBoard(board) });
}

/**
 * Was this board saved from an older layout of its device (different parts or refs)? Devices get
 * redesigned between versions; the old board can no longer be mapped onto the new one.
 */
function outdated(deviceId: string, board: SavedBoard): boolean {
  const dev = DEVICES[deviceId];
  if (!dev) return false;
  const want = new Set(dev.components.map((c) => c.ref));
  const have = Object.keys(board.comps);
  if (have.length !== want.size || have.some((r) => !want.has(r))) return true;
  return dev.components.some((c) => {
    const saved = board.comps[c.ref]?.partNo;
    return !!saved && part(saved).kind !== part(c.partNo).kind;
  });
}

export function loadJob(s: SavedJob): Job {
  const { deviceId, board, ...rest } = structuredClone(s);
  if (outdated(deviceId, board)) {
    // Rebuild the same customer's device on the current design (same seed and fault type when it still exists).
    const dev = DEVICES[deviceId];
    const variant = (rest.faults as AppliedFault[] | undefined)?.[0]?.variant;
    let fresh: Job;
    try {
      fresh = generateJob(dev, rest.seed, variant && dev.variants.some((v) => v.id === variant) ? { variant } : {});
    } catch {
      fresh = generateJob(dev, rest.seed, {});
    }
    return { ...fresh, customer: rest.customer, kind: rest.kind, quote: rest.quote, paid: rest.paid, title: rest.title };
  }
  return { ...rest, device: DEVICES[deviceId], board: loadBoard(board), faults: rest.faults as AppliedFault[] };
}
