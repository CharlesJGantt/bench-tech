/**
 * A ribbon cable with torn or cracked traces: the module it feeds loses a line. Unlike a dead screen, the module
 * is fine: only the cheap ribbon needs replacing (take the case apart, pull the ribbon, fit a new one).
 * Available on every device whose case lists a ribbon cable (a latch connector) to a plug-in module.
 */
import type { DeviceDef } from './board';
import { part, pinsOf } from './parts';
import type { Variant } from './faults';

export interface RibbonSlot {
  item: string;
  module: string;
  conn: string;
}

/** The ribbon cables of a device: the case item, its module and the connector the ribbon plugs into. */
export function ribbonSlots(d: DeviceDef): RibbonSlot[] {
  const out: RibbonSlot[] = [];
  for (const it of d.enclosure?.items ?? []) {
    if (it.kind !== 'cable' || !it.latch || !it.module) continue;
    const conn = d.components.find((c) => c.ref === it.module)?.mates;
    if (conn) out.push({ item: it.id, module: it.module, conn });
  }
  return out;
}

export const RIBBON_TORN: Variant = {
  id: 'ribbon-torn',
  family: 'Damaged ribbon cable',
  tier: 2,
  weight: 0.8,
  apply(b, rng) {
    const slot = rng.pick(ribbonSlots(b.device));
    const conn = b.comps[slot.conn];
    const pins = pinsOf(part(conn.def.partNo));
    const pin = rng.pick(pins);
    conn.fault = { type: 'pins-open', pins: [pin] };
    const label = b.device.enclosure?.items.find((i) => i.id === slot.item)?.label ?? 'ribbon cable';
    return {
      summary: `The ${label.toLowerCase()} has a cracked trace: the ${pin} line never reaches the board. The screen or part it feeds is fine. Open the case, pull the ribbon and fit a new one.`,
      refs: [slot.conn],
      hint: `Everything on the board measures normal but the part on the ribbon gets no ${pin}. The ribbon is the cheap part: open the case and look at it.`,
      flavor: rng.pick(['The screen flickers when I open and close it, and now it stays dark.', 'It was fine until I bent the cable by the hinge. Now there are lines, then nothing.', 'Sometimes the picture comes back if I press on the case.']),
      torn: [slot.item],
    };
  },
};
