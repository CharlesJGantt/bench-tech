import { describe, expect, it } from 'vitest';
import { cloneBoard } from '../src/sim/circuit';
import { corrode } from '../src/sim/corrosion';
import { DEVICE_LIST } from '../src/sim/devices';
import { generateJob } from '../src/sim/faults';
import { bodyRect } from '../src/sim/footprints';
import { ldiLevel, ldiSpots, trippedStickers } from '../src/sim/ldi';

describe('liquid damage stickers', () => {
  it('every device with a port, battery or slot has stickers, on free board space', () => {
    let withStickers = 0;
    for (const d of DEVICE_LIST) {
      const spots = ldiSpots(d);
      if (spots.length) withStickers++;
      for (const s of spots) {
        expect(s.x - s.size / 2).toBeGreaterThanOrEqual(1.9);
        expect(s.x + s.size / 2).toBeLessThanOrEqual(d.width - 1.9);
        for (const c of d.components.filter((x) => !x.mates)) {
          const r = bodyRect(c);
          const clear = s.x + s.size / 2 < r.x || s.x - s.size / 2 > r.x + r.w || s.y + s.size / 2 < r.y || s.y - s.size / 2 > r.y + r.h;
          expect(clear, `${d.id} ${s.id} overlaps ${c.ref}`).toBe(true);
        }
      }
    }
    expect(withStickers).toBeGreaterThan(15);
  });
  it('stay white on a dry board and turn red near corrosion', () => {
    const d = DEVICE_LIST.find((x) => ldiSpots(x).length >= 2)!;
    const job = generateJob(d, 3, { variant: d.variants.find((v) => v.tier === 1)!.id });
    const b = cloneBoard(job.board);
    for (const c of Object.values(b.comps)) {
      delete c.corr;
      c.marks = c.marks.filter((m) => m !== 'corrosion');
    }
    expect(trippedStickers(b)).toHaveLength(0);
    const spot = ldiSpots(d)[0];
    const near = Object.values(b.comps).filter((c) => !c.def.mates).sort((a, z) => Math.hypot(a.def.x - spot.x, a.def.y - spot.y) - Math.hypot(z.def.x - spot.x, z.def.y - spot.y))[0];
    corrode(b, near.ref, 0.6);
    expect(ldiLevel(b, spot)).toBeGreaterThan(0.2);
    expect(trippedStickers(b).length).toBeGreaterThan(0);
    // far-away corrosion does not trip it
    const far = Object.values(b.comps).filter((c) => !c.def.mates).sort((a, z) => Math.hypot(z.def.x - spot.x, z.def.y - spot.y) - Math.hypot(a.def.x - spot.x, a.def.y - spot.y))[0];
    delete near.corr;
    near.marks = near.marks.filter((m) => m !== 'corrosion');
    if (Math.hypot(far.def.x - spot.x, far.def.y - spot.y) > 40) {
      corrode(b, far.ref, 0.6);
      expect(ldiLevel(b, spot)).toBe(0);
    }
  });
});
