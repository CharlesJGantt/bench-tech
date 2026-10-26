/**
 * Thermal protection that trips, and what you can do about it. Based on how repairers actually deal with it:
 *
 *   one-shot thermal fuse (TCO)   opens for good when overheated: heat cannot reset it, replace it.
 *   PPTC polyfuse                 a resettable fuse that can go stuck at a high resistance (tens of ohms) after
 *                                 thermal cycling or a cracked joint. Repairers revive it with heat from a hot-air
 *                                 station (set around 350 °C: the part itself sees far less) and it drops back to
 *                                 a fraction of an ohm. Heating is not its designed reset and the protection may
 *                                 no longer be to spec, so a replacement is the more reliable repair.
 *   bimetal thermal switch        resets by itself when it cools (not modelled).
 *
 * The plastic parts around the fuse melt in the hot air unless masked with Kapton tape first.
 */
import type { BoardState } from './circuit';
import type { DeviceDef } from './board';
import { addMark, type Variant } from './faults';
import { part } from './parts';

/** Kapton tape used per hot-air job (cm). */
export const KAPTON_PER_RESET = 6;

const isPolyfuse = (partNo: string) => partNo.includes('POLY');

/** One-shot fuses on the board (ordinary fuses). */
export function fuseRefs(d: DeviceDef): string[] {
  return d.components.filter((c) => part(c.partNo).kind === 'fuse' && !isPolyfuse(c.partNo)).map((c) => c.ref);
}

/** Resettable PPTC polyfuses on the board. */
export function pptcRefs(d: DeviceDef): string[] {
  // (Only fuses that feed a real load can be seen failing: the microSD slot's, as on the ROG Ally-style handhelds)
  return d.components.filter((c) => part(c.partNo).kind === 'fuse' && isPolyfuse(c.partNo) && c.block === 'CARD').map((c) => c.ref);
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
      summary: `The thermal fuse ${ref} opened after the device overheated. A one-shot thermal fuse cannot be reset by heat: replace it (and find out why it got so hot).`,
      refs: [ref],
      hint: `The device is completely dead and ${ref} reads open, with a faint heat stain. Heat will not close it again: fit a new one.`,
      flavor: rng.pick(['It got really hot, then died. Nothing at all now.', 'I left it in the car on a hot day and now it will not turn on.', 'It smelled warm, shut off, and has been dead since.']),
    };
  },
};

export const PPTC_DEGRADED: Variant = {
  id: 'pptc-degraded',
  family: 'Stuck PPTC fuse',
  tier: 2,
  weight: 0.8,
  apply(b, rng) {
    const ref = rng.pick(pptcRefs(b.device));
    b.comps[ref].fault = { type: 'high', r: Math.round(rng.range(65, 110)) };
    addMark(b, ref, 'pptc-high');
    return {
      summary: `The resettable (PPTC) fuse ${ref} on the microSD slot's supply is stuck at a high resistance (tens of ohms instead of about 0.2 Ω), so the card reader never gets enough power. Heat from the parts around it (or a bad card) tripped it and it did not recover. Heating it with hot air at about 200-300 °C (small nozzle, mask the plastic parts around it with Kapton first) resets it, and so does a replacement; the heat source is still there, so it can trip again.`,
      refs: [ref],
      hint: `The card reader gets no power. With the board off, measure across the small fuse ${ref} by the slot (it may be hidden under tape or putty): a healthy polyfuse reads about 0.2 Ω, a stuck one tens of ohms. Heat it with hot air to reset it. Do not measure it while it is resetting: the meter's test current makes it stick.`,
      flavor: rng.pick(['It worked, then one day the card reader (or the video port) just stopped. Nothing else is wrong.', 'The port was fine until it got hot while I was playing. Now it does not work at all.', 'Part of it stopped working after a long gaming session and never came back.']),
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
 * Heat a fuse with the hot air. A PPTC stuck high is revived (`heat`: too little leaves it high; too much cooks it
 * open). A one-shot thermal fuse does nothing at all. `masked` = the neighbours are covered with Kapton.
 */
export function resetThermalFuse(b: BoardState, ref: string, masked: boolean, heat: 'cold' | 'good' | 'overheated' = 'good'): ResetResult {
  const c = b.comps[ref];
  if (!c) return { ok: false, text: 'Nothing there.' };
  if (c.marks.includes('thermal-trip')) return { ok: false, text: `${ref} is a one-shot thermal fuse: it opened for good and heat cannot close it. It has to be replaced.` };
  if (!c.marks.includes('pptc-high')) return { ok: false, text: `${ref} is not stuck: there is nothing for the heat to fix.` };
  if (heat === 'cold') return { ok: false, text: `${ref} did not get hot enough: it still reads high. Give it a little longer, then let go.` };
  // Neighbours suffer either way
  let melted: string | undefined;
  if (!masked) {
    melted = neighbours(b, ref)[0];
    if (melted) b.comps[melted].fault = { type: 'melted' };
  }
  const meltText = melted ? ` The hot air also softened the plastic connector ${melted} next to it: it has melted. Kapton tape would have protected it.` : '';
  if (heat === 'overheated') {
    c.fault = { type: 'open' };
    c.burnt = true;
    c.marks = c.marks.filter((m) => m !== 'pptc-high');
    return { ok: true, melted, text: `You held the heat on too long and cooked ${ref}: it is open now and will have to be replaced.${meltText}` };
  }
  c.fault = null;
  c.marks = c.marks.filter((m) => m !== 'pptc-high');
  if (!c.marks.includes('revived')) c.marks.push('revived');
  return { ok: true, melted, text: `${masked ? 'Kapton over the connectors, a measured' : 'A'} blast of hot air on ${ref}: it cools back down reading well under an ohm. It works again, but heating is not its proper reset.${meltText}` };
}
