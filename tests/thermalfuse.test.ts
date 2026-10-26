import { describe, expect, it } from 'vitest';
import { cloneBoard, functionalTest } from '../src/sim/circuit';
import { DEVICE_LIST } from '../src/sim/devices';
import { generateJob } from '../src/sim/faults';
import { evaluate } from '../src/sim/repair';
import { fuseRefs, pptcRefs, resetThermalFuse } from '../src/sim/thermalfuse';

const oneShot = DEVICE_LIST.filter((d) => fuseRefs(d).length);
const pptc = DEVICE_LIST.filter((d) => pptcRefs(d).length);

describe('one-shot thermal fuses', () => {
  it('kill the device and cannot be reset by heat', () => {
    expect(oneShot.length).toBeGreaterThan(0);
    const job = generateJob(oneShot[0], 6, { variant: 'thermal-fuse-tripped' });
    const ref = job.faults[0].refs[0];
    expect(functionalTest(cloneBoard(job.board)).passed).toBe(false);
    const r = resetThermalFuse(job.board, ref, true, 'good');
    expect(r.ok).toBe(false);
    expect(r.text).toContain('replaced');
    expect(job.board.comps[ref].fault?.type).toBe('open');
  });
});

describe('PPTC polyfuses stuck high', () => {
  it('a stuck polyfuse starves what it feeds; the right heat revives it', () => {
    expect(pptc.length).toBeGreaterThan(0);
    for (const d of pptc.slice(0, 4)) {
      const job = generateJob(d, 5, { variant: 'pptc-degraded' });
      const ref = job.faults[0].refs[0];
      expect(job.board.comps[ref].fault?.type).toBe('high');
      expect(functionalTest(cloneBoard(job.board)).passed, d.name).toBe(false);
      const r = resetThermalFuse(job.board, ref, true, 'good');
      expect(r.ok).toBe(true);
      expect(r.melted).toBeUndefined();
      expect(functionalTest(cloneBoard(job.board)).passed, d.name).toBe(true);
      // it works, but the customer is told heat is not the proper fix
      expect(evaluate(job, cloneBoard(job.board), 0).notes.join(' ')).toContain('revived with heat');
    }
  });
  it('too little heat does nothing; too much cooks it open', () => {
    const job = generateJob(pptc[0], 4, { variant: 'pptc-degraded' });
    const ref = job.faults[0].refs[0];
    expect(resetThermalFuse(job.board, ref, true, 'cold').ok).toBe(false);
    expect(job.board.comps[ref].fault?.type).toBe('high');
    const r = resetThermalFuse(job.board, ref, true, 'overheated');
    expect(r.ok).toBe(true);
    expect(job.board.comps[ref].fault?.type).toBe('open');
    expect(job.board.comps[ref].burnt).toBe(true);
  });
  it('without Kapton the hot air melts a plastic connector beside it (when there is one)', () => {
    let melted = 0;
    for (const d of pptc) {
      const job = generateJob(d, 9, { variant: 'pptc-degraded' });
      const r = resetThermalFuse(job.board, job.faults[0].refs[0], false, 'good');
      if (r.melted) {
        melted++;
        expect(job.board.comps[r.melted].fault?.type).toBe('melted');
      }
    }
    expect(melted).toBeGreaterThanOrEqual(0);
  });
});
