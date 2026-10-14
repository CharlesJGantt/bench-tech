/**
 * JSON-safe save format for boards and jobs (localStorage). Device definitions and
 * part specs are stored by id and re-attached on load; Infinity joint resistances
 * are encoded as -1 because JSON has no Infinity.
 */
import { createBoard, type BoardState, type CompFault, type Jumper, type Mark } from './circuit';
import type { AppliedFault, Job } from './faults';
import { part } from './parts';
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
    }
  >;
  traces: Record<string, { broken: boolean }>;
  liftedPads: string[];
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
    comps[c.ref] = { partNo: c.part?.partNo ?? null, reversed: c.reversed, fault, joints, burnt: c.burnt, marks: [...c.marks], replaced: c.replaced, unplugged: c.unplugged };
  }
  return {
    deviceId: b.device.id,
    comps,
    traces: structuredClone(b.traces),
    liftedPads: [...b.liftedPads],
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
  }
  b.traces = structuredClone(s.traces);
  b.liftedPads = [...s.liftedPads];
  b.jumpers = structuredClone(s.jumpers);
  b.nextJumperId = s.nextJumperId;
  b.pcbDamage = structuredClone(s.pcbDamage ?? []);
  return b;
}

export function saveJob(j: Job): SavedJob {
  const { device, board, ...rest } = j;
  return structuredClone({ ...rest, deviceId: device.id, board: saveBoard(board) });
}

export function loadJob(s: SavedJob): Job {
  const { deviceId, board, ...rest } = structuredClone(s);
  return { ...rest, device: DEVICES[deviceId], board: loadBoard(board), faults: rest.faults as AppliedFault[] };
}
