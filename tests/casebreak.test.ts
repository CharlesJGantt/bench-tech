import { describe, expect, it } from 'vitest';
import { cloneBoard, functionalTest } from '../src/sim/circuit';
import { DEVICE_LIST } from '../src/sim/devices';
import { breakable, casePartPrice, fitNewCasePart, fitNewRibbon } from '../src/sim/enclosure';
import { generateJob } from '../src/sim/faults';
import { evaluate } from '../src/sim/repair';
import { saveJob, loadJob } from '../src/sim/persist';

describe('broken cases', () => {
  const dev = DEVICE_LIST.find((d) => d.enclosure && breakable(d.enclosure).some((i) => i.kind === 'shell'))!;
  it('a case-repair job needs every cracked part replaced, and bills for them', () => {
    const job = generateJob(dev, 17, { service: 'case' });
    expect(job.faults[0].variant).toBe('service-case');
    const st = job.enclosure!;
    expect(st.cracked!.length).toBeGreaterThan(0);
    const b = cloneBoard(job.board);
    expect(evaluate(job, b, 0).outcome).toBe('not-fixed');
    for (const id of st.cracked!) {
      // must be off first
      expect(fitNewCasePart(dev.enclosure!, st, id).ok).toBe(false);
      st.removed.push(id);
      expect(fitNewCasePart(dev.enclosure!, st, id).ok).toBe(true);
      st.removed = st.removed.filter((x) => x !== id);
    }
    const ev = evaluate(job, b, 0);
    expect(ev.outcome).toBe('fixed');
    const price = st.cracked!.reduce((t, id) => t + casePartPrice(dev.enclosure!.items.find((i) => i.id === id)!, dev.marketValue) * 1.5, 0);
    expect(ev.partsBilled).toBeGreaterThanOrEqual(Math.round(price) - 1);
  });
  it('a dropped device with a cracked screen sometimes has a cracked case too, and the cracks survive saving', () => {
    let cracked = 0;
    const withScreen = DEVICE_LIST.find((d) => d.variants.some((v) => v.id === 'screen-cracked') && d.enclosure)!;
    for (let s = 1; s <= 40; s++) {
      const job = generateJob(withScreen, s * 31, { variant: 'screen-cracked' });
      if (job.enclosure?.cracked?.length) {
        cracked++;
        expect(loadJob(saveJob(job)).enclosure!.cracked).toEqual(job.enclosure.cracked);
      }
    }
    expect(cracked).toBeGreaterThan(3);
    expect(cracked).toBeLessThan(40);
  });
});

describe('torn ribbon cables', () => {
  it('the fault is in the cheap ribbon: fitting a new one fixes it', () => {
    const d = DEVICE_LIST.find((x) => x.variants.some((v) => v.id === 'ribbon-torn'))!;
    const job = generateJob(d, 8, { variant: 'ribbon-torn' });
    const st = job.enclosure!;
    expect(st.torn!.length).toBe(1);
    expect(functionalTest(cloneBoard(job.board)).passed).toBe(false);
    // it has to be unplugged before a new one goes in
    expect(fitNewRibbon(d.enclosure!, st, st.torn![0]).ok).toBe(false);
    st.removed.push(st.torn![0]);
    const r = fitNewRibbon(d.enclosure!, st, st.torn![0]);
    expect(r.ok).toBe(true);
    const conn = job.board.comps[job.board.comps[r.conn!].def.mates!];
    conn.fault = null; // what Session.encFitRibbon does
    expect(functionalTest(cloneBoard(job.board)).passed).toBe(true);
  });
});
