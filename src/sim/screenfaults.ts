/**
 * A dropped device: the glass is cracked and the screen is dead. Available on every device that has a screen
 * module (unless it defines its own). The player sees the cracks (a decal over the glass) and swaps the module.
 */
import type { DeviceDef } from './board';
import { addMark, type Variant } from './faults';
import { part } from './parts';

/** The screen modules on a device (the parts the board is designed to carry). */
export function screenRefs(d: DeviceDef): string[] {
  return d.components.filter((c) => {
    const p = part(c.partNo);
    return (p.kind === 'module' || p.kind === 'logic') && p.pkg.startsWith('SCREEN');
  }).map((c) => c.ref);
}

export const SCREEN_CRACKED: Variant = {
  id: 'screen-cracked',
  family: 'Broken screen',
  tier: 1,
  weight: 1,
  apply(b, rng) {
    const ref = rng.pick(screenRefs(b.device));
    const p = part(b.comps[ref].def.partNo);
    b.comps[ref].fault = p.kind === 'logic' ? { type: 'dead' } : { type: 'open' };
    addMark(b, ref, 'cracked-screen');
    return {
      summary: `The glass of the screen module ${ref} is cracked and the display is dead. Swap the screen module (it plugs in on a ribbon).`,
      refs: [ref],
      hint: 'Have a good look at the screen itself before you get the meter out: cracks spread out from the impact.',
      flavor: rng.pick(['I dropped it. The screen is cracked and stays black.', 'It fell off the table and now the screen is smashed and dead.', 'The screen got stepped on. It lights up faintly but shows nothing.']),
    };
  },
};
