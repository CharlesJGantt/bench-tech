import { describe, expect, it } from 'vitest';
import { DEVICES } from '../src/sim/devices';
import { generateJob } from '../src/sim/faults';
import { loadJob, saveJob } from '../src/sim/persist';

describe('saved jobs', () => {
  it('round-trips a job', () => {
    const job = generateJob(DEVICES['game-clock'], 3, {});
    const back = loadJob(saveJob(job));
    expect(Object.keys(back.board.comps)).toEqual(Object.keys(job.board.comps));
    expect(back.faults[0].variant).toBe(job.faults[0].variant);
  });

  it('rebuilds a job saved from an older layout of the device', () => {
    const job = generateJob(DEVICES['game-clock'], 3, {});
    const saved = saveJob(job);
    // An old design: the CPU was U1 and the beeper U2 (refs and parts no longer line up).
    saved.board.comps.U2 = { ...saved.board.comps.U2, partNo: 'U-SA8002' };
    delete (saved.board.comps as Record<string, unknown>).U4;
    saved.customer = 'Old Customer';
    saved.quote = 33;
    const back = loadJob(saved);
    expect(back.customer).toBe('Old Customer');
    expect(back.quote).toBe(33);
    expect(back.board.comps.U2.part?.kind).toBe('mcu');
    expect(back.board.comps.U4.part?.partNo).toBe('U-LDO33T');
  });
});
