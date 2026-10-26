/**
 * The USB port tester: a diode-mode check of every pin of the charging port against a healthy board of the
 * same device, shown as green (matches) or red (reads differently: a short, an open, or something off by a
 * lot). Like the pocket testers repair shops clip onto a console's USB-C port. Unpowered boards only.
 */
import { createBoard, measure, type BoardState } from './circuit';
import { cloneBoard } from './circuit';

export interface PortPin {
  pin: string;
  reading: string;
  reference: string;
  /** Matches the healthy board. */
  ok: boolean;
  /** What a bad reading means. */
  state: 'ok' | 'short' | 'open' | 'off';
}

export interface PortReport {
  ref: string;
  pins: PortPin[];
}

const fmt = (v: number | null): string => (v === null ? 'OL' : v < 0.02 ? '0.00 (short)' : `${v.toFixed(2)} V`);

/** The port's connector ref, if the device charges over USB. */
export function portRef(b: BoardState): string | null {
  const c = b.comps[b.device.input.ref];
  return c && (c.def.partNo === 'J-USBC' || c.def.partNo === 'J-MUSB') ? c.ref : null;
}

export function portTest(b: BoardState): PortReport | null {
  const ref = portRef(b);
  if (!ref) return null;
  const off = { kind: 'off' } as const;
  const good = createBoard(b.device);
  const bad = cloneBoard(b);
  const gnd = { ref, pin: 'GND' };
  const pins: PortPin[] = [];
  for (const pin of Object.keys(b.comps[ref].def.pins)) {
    if (pin === 'GND') continue;
    const a = measure(bad, off, 'diode', gnd, { ref, pin }).value;
    const r = measure(good, off, 'diode', gnd, { ref, pin }).value;
    const same = a === null || r === null ? a === r : Math.abs(a - r) < 0.08;
    const state: PortPin['state'] = same ? 'ok' : a === null ? 'open' : a < 0.02 ? 'short' : 'off';
    pins.push({ pin, reading: fmt(a), reference: fmt(r), ok: same, state });
  }
  return { ref, pins };
}
