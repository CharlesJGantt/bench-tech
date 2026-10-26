/**
 * A tripped thermal fuse: the device was overheated (or a short briefly cooked it), the fuse opened and the device
 * went dead. It resets with a little hot air (~150 °C), but the plastic parts around it melt in the same blast
 * unless you mask them with Kapton tape first. Replacing the fuse also works.
 */
import type { BoardState } from './circuit';
import type { DeviceDef } from './board';
import { addMark, type Variant } from './faults';
import { part } from './parts';

/** Kapton tape used per reset (cm). */
export const KAPTON_PER_RESET = 6;

/** Fuses on the board that could trip. */
export function fuseRefs(d: DeviceDef): string[] {
  return d.components.filter((c) => part(c.partNo).kind === 'fuse' && !part(c.partNo).partNo.includes('POLY')).map((c) => c.ref);
}

export const THERMAL_FUSE: Variant = {
  id: 'thermal-fuse-tripped',
  family: 'Tripped thermal fuse',
  tier: 2,
  weight: 0.7,
  apply(b, rng) {
    const ref = rng.pick(fuseRefs(b.device));
    b.comps[ref].fault = { type: 'open' };
    addMark(b, ref, 'thermal-trip');
    return {
      summary: `The thermal fuse ${ref} tripped after the device overheated. A short blast of hot air (about 150 °C) resets it: mask the plastic connectors around it with Kapton tape first or they will melt. Or replace the fuse.`,
      refs: [ref],
      hint: `The device is completely dead and ${ref} reads open. It has a faint heat stain. Heat resets it; protect the parts next to it.`,
      flavor: rng.pick(['It got really hot, then died. Nothing at all now.', 'I left it in the car on a hot day and now it will not turn on.', 'It smelled warm, shut off, and has been dead since.']),
    };
  },
};

export interface ResetResult {
  ok: boolean;
  text: string;
  /** A neighbouring part that melted. */
  melted?: string;
}

/** Plastic-bodied parts within reach of the hot air around a part. */
function neighbours(b: BoardState, ref: string, radius = 14): string[] {
  const c = b.comps[ref].def;
  return Object.values(b.comps)
    .filter((n) => n.ref !== ref && n.part && n.part.kind === 'connector' && !n.def.mates && Math.hypot(n.def.x - c.x, n.def.y - c.y) <= radius)
    .map((n) => n.ref);
}

/**
 * Reset a tripped fuse with the heat of the hot air (the solder is not reflowed: the fuse is reset in place).
 * `masked` = the neighbours are covered with Kapton. `heat`: too little and it stays open; too much and the
 * solder under it flows too, leaving dull joints that will crack later.
 */
export function resetThermalFuse(b: BoardState, ref: string, masked: boolean, heat: 'cold' | 'good' | 'overheated' = 'good'): ResetResult {
  const c = b.comps[ref];
  if (!c || !c.marks.includes('thermal-trip')) return { ok: false, text: 'This part is not a tripped thermal fuse.' };
  if (heat === 'cold') return { ok: false, text: `${ref} did not get hot enough: it stays open. Give it a little longer, then let go.` };
  if (heat === 'overheated')
    for (const pin of Object.keys(c.joints)) c.joints[pin] = { r: 0.4, cold: true };
  c.fault = null;
  c.marks = c.marks.filter((m) => m !== 'thermal-trip');
  const warm = heat === 'overheated' ? ' But you held the heat on too long: the solder under it flowed and the joints look dull.' : '';
  if (masked) return { ok: true, text: `Kapton over the connectors, a short blast of hot air on ${ref}: it clicks closed again.${warm}` };
  const hit = neighbours(b, ref);
  if (!hit.length) return { ok: true, text: `A short blast of hot air on ${ref} and it clicks closed again. There was nothing plastic close by to melt.${warm}` };
  b.comps[hit[0]].fault = { type: 'melted' };
  return { ok: true, melted: hit[0], text: `${ref} clicked closed again, but the hot air also softened the plastic connector ${hit[0]} next to it: it has melted. Kapton tape would have protected it.${warm}` };
}
