import { describe, expect, it } from 'vitest';
import { cloneBoard, functionalTest } from '../src/sim/circuit';
import { DEVICE_LIST } from '../src/sim/devices';
import { generateJob } from '../src/sim/faults';
import { fuseRefs, resetThermalFuse } from '../src/sim/thermalfuse';

describe('thermal fuse reset', () => {
  const devs = DEVICE_LIST.filter((d) => fuseRefs(d).length);
  it('a tripped fuse kills the device; a masked reset fixes it', () => {
    expect(devs.length).toBeGreaterThan(0);
    for (const d of devs.slice(0, 5)) {
      const job = generateJob(d, 6, { variant: 'thermal-fuse-tripped' });
      const ref = job.faults[0].refs[0];
      expect(functionalTest(cloneBoard(job.board)).passed, d.name).toBe(false);
      const r = resetThermalFuse(job.board, ref, true);
      expect(r.ok).toBe(true);
      expect(r.melted).toBeUndefined();
      expect(functionalTest(cloneBoard(job.board)).passed, d.name).toBe(true);
    }
  });
  it('an unmasked reset melts a plastic connector beside the fuse (when there is one)', () => {
    let melted = 0;
    for (const d of devs) {
      const job = generateJob(d, 9, { variant: 'thermal-fuse-tripped' });
      const r = resetThermalFuse(job.board, job.faults[0].refs[0], false);
      expect(r.ok).toBe(true);
      if (r.melted) {
        melted++;
        expect(job.board.comps[r.melted].fault?.type).toBe('melted');
      }
    }
    expect(melted).toBeGreaterThan(0);
  });
  it('a part that never tripped cannot be reset', () => {
    const job = generateJob(devs[0], 2, { variant: 'thermal-fuse-tripped' });
    expect(resetThermalFuse(job.board, 'TP1', true).ok).toBe(false);
  });

  it('the heat has to be right: too little leaves it open, too much flows the solder', () => {
    const job = generateJob(devs[0], 4, { variant: 'thermal-fuse-tripped' });
    const ref = job.faults[0].refs[0];
    expect(resetThermalFuse(job.board, ref, true, 'cold').ok).toBe(false);
    expect(job.board.comps[ref].fault?.type).toBe('open');
    const r = resetThermalFuse(job.board, ref, true, 'overheated');
    expect(r.ok).toBe(true);
    expect(Object.values(job.board.comps[ref].joints).every((j) => j.cold)).toBe(true);
  });
});
