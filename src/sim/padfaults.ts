/**
 * Board-level damage that can happen on any device: a pad torn off by a knock, a trace scratched through, and
 * pads eaten away by liquid. They are repaired with the pen grinder, copper repair wire and UV solder mask (see
 * repair.ts). Each fault is placed on a pad whose loss really breaks the device, so there is always a symptom.
 */
import { cloneBoard, functionalTest, type BoardState } from './circuit';
import { addMark, liquidDamage, type Rng, type Variant } from './faults';

interface Spot {
  ref: string;
  pin: string;
  net: string;
  /** How likely losing this pad breaks the device (power nets and chips first). */
  w: number;
}

/** Pads on named, meaningful nets that share their net with at least one other fixed pad (so a wire can bridge them). */
function spots(b: BoardState): Spot[] {
  const out: Spot[] = [];
  const padsOnNet = new Map<string, number>();
  for (const c of Object.values(b.comps)) {
    if (c.def.mates) continue;
    for (const net of Object.values(c.def.pins)) padsOnNet.set(net, (padsOnNet.get(net) ?? 0) + 1);
  }
  for (const c of Object.values(b.comps)) {
    if (!c.part || c.def.mates || c.part.kind === 'testpoint') continue;
    for (const [pin, net] of Object.entries(c.def.pins)) {
      const info = b.device.nets[net];
      if (!info || (padsOnNet.get(net) ?? 0) < 2) continue;
      const w = (info.power ? 4 : info.expected !== undefined ? 2 : 0.5) * (net === 'GND' ? 0.5 : 1) * (c.part.kind === 'resistor' || c.part.kind === 'capacitor' ? 0.7 : 1.5);
      out.push({ ref: c.ref, pin, net, w });
    }
  }
  return out;
}

/** Try pads until losing one makes the device fail its owner test. */
function place(b: BoardState, rng: Rng, how: (s: Spot) => void, undo: (s: Spot) => void, tries = 14): Spot {
  const all = spots(b);
  if (!all.length) throw new Error(`${b.device.id} has no pad to damage`);
  let last = all[0];
  for (let i = 0; i < tries; i++) {
    last = rng.weighted(all.map((x) => [x, x.w] as [Spot, number]));
    how(last);
    if (!functionalTest(cloneBoard(b)).passed) return last;
    undo(last);
  }
  how(last);
  return last;
}

const drop = (list: string[] | undefined, key: string) => (list ? list.filter((k) => k !== key) : []);

export const PAD_VARIANTS: Variant[] = [
  {
    id: 'pad-lifted',
    family: 'Lifted pad',
    tier: 2,
    weight: 0.7,
    apply(b, rng) {
      const s = place(
        b,
        rng,
        (p) => {
          b.liftedPads.push(`${p.ref}.${p.pin}`);
          addMark(b, p.ref, 'scratch');
        },
        (p) => {
          b.liftedPads = drop(b.liftedPads, `${p.ref}.${p.pin}`);
          b.comps[p.ref].marks = b.comps[p.ref].marks.filter((m) => m !== 'scratch');
        },
      );
      return {
        summary: `A hard knock tore the pad under ${s.ref} pin ${s.pin} (${s.net}) off the board. Scrape the mask off the torn trace with the pen grinder, solder fine copper wire from the part's leg to the nearest point on ${s.net}, and seal it with UV solder mask.`,
        refs: [s.ref],
        hint: `The part is on but its ${s.net} connection is missing: look closely at ${s.ref} for a pad that is gone or lifted. Wire the leg to another point on the same net.`,
      };
    },
  },
  {
    id: 'trace-cut',
    family: 'Scratched trace',
    tier: 2,
    weight: 0.7,
    apply(b, rng) {
      const s = place(
        b,
        rng,
        (p) => {
          b.cutPads = [...(b.cutPads ?? []), `${p.ref}.${p.pin}`];
          addMark(b, p.ref, 'scratch');
        },
        (p) => {
          b.cutPads = drop(b.cutPads, `${p.ref}.${p.pin}`);
          b.comps[p.ref].marks = b.comps[p.ref].marks.filter((m) => m !== 'scratch');
        },
      );
      return {
        summary: `A screwdriver slip scratched the copper trace leading to ${s.ref} pin ${s.pin} (${s.net}) clean through. Bare the copper either side of the cut with the pen grinder, bridge it with copper wire and seal the repair with UV mask.`,
        refs: [s.ref],
        hint: `Power reaches the pad's net but not the pad itself. Zoom in along the track to ${s.ref} for a fine scratch across the copper.`,
      };
    },
  },
  {
    id: 'pad-eaten',
    family: 'Corroded-away pads',
    tier: 3,
    weight: 0.5,
    apply(b, rng) {
      const s = place(
        b,
        rng,
        (p) => {
          b.liftedPads.push(`${p.ref}.${p.pin}`);
          liquidDamage(b, rng, [p.ref], 0.4, 0.7);
        },
        (p) => {
          b.liftedPads = drop(b.liftedPads, `${p.ref}.${p.pin}`);
          const c = b.comps[p.ref];
          delete c.corr;
          c.marks = c.marks.filter((m) => m !== 'corrosion');
        },
      );
      return {
        summary: `Liquid (or a leaking battery) ate the copper away around ${s.ref} pin ${s.pin} (${s.net}). Clean the corrosion off completely, then rebuild the lost pad with copper wire to the nearest healthy point on ${s.net}, sealed with UV mask.`,
        refs: [s.ref],
        hint: `Green or white crust around ${s.ref}. Clean it with corrosion cleaner and IPA first, then see which pad is missing.`,
      };
    },
  },
];
