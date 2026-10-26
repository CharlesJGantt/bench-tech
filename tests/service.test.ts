import { describe, expect, it } from 'vitest';
import { DEVICE_LIST } from '../src/sim/devices';
import { applyPaste, boardReachable, cleanDust, closeForMe, coolingFor, openForMe, removeItem } from '../src/sim/enclosure';
import { canServiceCooling, generateJob } from '../src/sim/faults';
import { evaluate } from '../src/sim/repair';

const serviceable = DEVICE_LIST.filter(canServiceCooling);

describe('overheating cleaning service', () => {
  it('exists for devices with a heatsink', () => {
    expect(serviceable.length).toBeGreaterThan(0);
  });

  for (const dev of serviceable) {
    it(`${dev.name}: dusty and dried-out until cleaned and re-pasted`, () => {
      const job = generateJob(dev, 5, { service: 'overheat' });
      const def = dev.enclosure!;
      const st = job.enclosure!;
      expect(job.faults[0].variant).toBe('service-overheat');
      expect(st.dusty).toBe(true);
      expect(job.complaint.length).toBeGreaterThan(10);
      // Handed back as it came: it still overheats, so no payment
      expect(evaluate(job, job.board, 0).outcome).toBe('not-fixed');
      // It runs hotter than a clean one
      const dirty = coolingFor(def, st)!;
      // Open it up, clean the dust, new paste on every heatsink, close it
      openForMe(def, st, job.board);
      expect(boardReachable(def, st)).toBe(true);
      expect(cleanDust(def, st, 'blower').ok).toBe(true);
      for (const it of def.items.filter((i) => i.kind === 'heatsink')) {
        expect(removeItem(def, st, job.board, it.id, 'fingers').ok).toBe(true);
        expect(applyPaste(def, st, it.id, it.lm ? 'lm' : 'paste').ok).toBe(true);
      }
      closeForMe(def, st, job.board, 20);
      const clean = coolingFor(def, st)!;
      for (const chip of Object.keys(clean)) expect(clean[chip]).toBeLessThan(dirty[chip]);
      expect(evaluate(job, job.board, 0).outcome).toBe('fixed');
    });
  }
});
