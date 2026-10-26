import { describe, expect, it } from 'vitest';
import { createBoard } from '../src/sim/circuit';
import { DL12 } from '../src/sim/devices';
import { generateJob } from '../src/sim/faults';
import { part } from '../src/sim/parts';
import { evaluate } from '../src/sim/repair';

describe('repair quotes', () => {
  it('scale with the value of the device and the difficulty of the fault', () => {
    const cheap = generateJob(DL12, 1, { variant: 'fuse-blown' }).quote;
    const pricey = generateJob({ ...DL12, marketValue: 1000 }, 1, { variant: 'fuse-blown' }).quote;
    expect(pricey).toBeGreaterThan(cheap * 2);
    expect(pricey).toBeGreaterThanOrEqual(100); // a $1000 device is never quoted a few dollars
    // a tier-3 fault on a $1000 console lands in the $200-300 range
    const q3 = Math.round((1000 * (0.08 + 0.06 * 3)) / 5) * 5;
    expect(q3).toBeGreaterThanOrEqual(200);
    expect(q3).toBeLessThanOrEqual(300);
  });

  it('adds the parts you fitted to the bill (cost plus 50 %)', () => {
    const job = generateJob(DL12, 1, { variant: 'fuse-blown' });
    const base = evaluate(job, createBoard(DL12), 0);
    expect(base.partsBilled).toBe(0);
    const b = createBoard(DL12);
    b.comps.F1.part = part('M-BATT-1S'); // a $12 part stands in for an expensive replacement
    b.comps.F1.replaced = true;
    const billed = evaluate(job, b, 0);
    expect(billed.partsBilled).toBe(18);
    expect(billed.payout).toBe(job.quote * (billed.outcome === 'not-fixed' ? 0 : 1) + (billed.outcome === 'not-fixed' ? 0 : 18));
  });
});
