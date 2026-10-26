/**
 * Faults of ball grid array chips, generic for any device that has one: cracked balls under the chip (a drop, heat cycles),
 * a solder bridge between balls (a bad earlier reflow) and a dead chip. The balls are hidden until the chip is off; the proper
 * repair is remove, clean, reball, fit (see rework/bga.ts). A reflow in place fixes cracked balls less than half the time.
 */
import { cloneBoard, functionalTest, type BoardState } from './circuit';
import type { DeviceDef } from './board';
import { addMark, type Rng, type Variant } from './faults';
import { bgaType } from './bgatypes';
import { onRing } from './bgatypes';
import { part, pinsOf } from './parts';
import { ensureBga, ringNeighbour, syncBga, type BallState } from '../rework/bga';

/** BGA chips on a device (designed footprint is a BGA). */
export const bgaRefsOf = (d: DeviceDef): string[] => d.components.filter((c) => bgaType(part(c.partNo).pkg)).map((c) => c.ref);

/** Ring pins of a BGA footprint that carry a net the device cares about. */
function ringPins(b: BoardState, ref: string): string[] {
  const c = b.comps[ref];
  const t = bgaType(part(c.def.partNo).pkg)!;
  return pinsOf(part(c.def.partNo)).filter((p, i) => onRing(t.n, Math.floor(i / t.n), i % t.n) && c.def.pins[p] && c.def.pins[p] !== 'GND');
}

function breakBalls(b: BoardState, rng: Rng, state: BallState, many: number): { ref: string; pins: string[] } {
  const refs = bgaRefsOf(b.device);
  const ref = rng.pick(refs);
  const c = b.comps[ref];
  const st = ensureBga(c);
  const pool = ringPins(b, ref);
  let chosen: string[] = [];
  for (let attempt = 0; attempt < 30; attempt++) {
    chosen = [];
    const n = state === 'bridged' ? 1 : 1 + Math.floor(rng.next() * many);
    while (chosen.length < n) {
      const p = rng.pick(pool);
      if (!chosen.includes(p) && (state !== 'bridged' || ringNeighbour(c, p))) chosen.push(p);
    }
    for (const p of chosen) st.balls[p] = state;
    syncBga(b, ref);
    if (!functionalTest(cloneBoard(b)).passed) break;
    for (const p of chosen) st.balls[p] = 'good';
    syncBga(b, ref);
  }
  if (state === 'cracked') addMark(b, ref, 'rework-residue');
  return { ref, pins: chosen };
}

export const BGA_VARIANTS: Variant[] = [
  {
    id: 'bga-cracked',
    family: 'Cracked BGA balls',
    tier: 2,
    weight: 0.8,
    apply(b, rng) {
      const { ref, pins } = breakBalls(b, rng, 'cracked', 3);
      return {
        summary: `Heat cycles cracked ${pins.length > 1 ? 'some solder balls' : 'a solder ball'} under ${ref} (${pins.join(', ')}). The balls are hidden under the chip. Reflowing in place with flux sometimes brings it back for a while; the proper fix is to lift the chip, clean the pads, reball the chip and fit it again.`,
        refs: [ref],
        hint: `${ref} is a ball grid chip: its joints are under the package, so you cannot see or touch them. Warm the area and a knock changes the symptom. Try a reflow in place with flux, or lift the chip and reball it.`,
      };
    },
  },
  {
    id: 'bga-bridged',
    family: 'Bridged BGA balls',
    tier: 3,
    weight: 0.4,
    apply(b, rng) {
      const { ref, pins } = breakBalls(b, rng, 'bridged', 1);
      return {
        summary: `A bad earlier reflow squashed the balls under ${ref} together: ${pins[0]} is bridged to its neighbour. Lift the chip, clean the pads and reball.`,
        refs: [ref],
        hint: `Two connections of ${ref} read as shorted together, but nothing shows on top. Under a BGA chip the only cure is to lift it, clean the pads and reball.`,
        previousRepair: true,
      };
    },
  },
  {
    id: 'bga-dead',
    family: 'Dead BGA chip',
    tier: 2,
    weight: 0.5,
    apply(b, rng) {
      const ref = rng.pick(bgaRefsOf(b.device));
      b.comps[ref].fault = { type: 'dead' };
      return {
        summary: `${ref} died. The chip is gone: lift it, clean the pads and fit a replacement (a new chip comes with its balls; a used or donor chip needs reballing first).`,
        refs: [ref],
        hint: `The rails around ${ref} look right but the chip does nothing. Replace it: it is a BGA, so lift it with hot air, clean the pads and fit the new chip.`,
      };
    },
  },
];
