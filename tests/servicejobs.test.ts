import { describe, expect, it } from 'vitest';
import { cloneBoard } from '../src/sim/circuit';
import { DEVICE_LIST } from '../src/sim/devices';
import { DISC_SAFE_PASSES, DISC_UNSAVEABLE, generateJob, polishDiscPass } from '../src/sim/faults';
import { evaluate } from '../src/sim/repair';
import { loadJob, saveJob } from '../src/sim/persist';

const consoles = DEVICE_LIST.filter((d) => d.category === 'Consoles');
const withFw = DEVICE_LIST.filter((d) => d.firmware);

describe('hard reset jobs', () => {
  it('the device is fine but the job is not done until it has been hard reset', () => {
    const job = generateJob(withFw[0], 3, { service: 'reset' });
    expect(job.hung).toBe(true);
    expect(job.faults[0].variant).toBe('service-reset');
    const b = cloneBoard(job.board);
    expect(evaluate(job, b, 0).outcome).toBe('not-fixed');
    job.hung = false;
    expect(evaluate(job, b, 0).outcome).toBe('fixed');
  });
});

describe('drive service jobs', () => {
  it('corrupt storage is re-imaged; a dead drive is replaced and then imaged, and billed', () => {
    expect(consoles.length).toBeGreaterThan(0);
    for (let s = 1; s <= 6; s++) {
      const job = generateJob(consoles[0], s * 13, { service: 'drive' });
      const b = cloneBoard(job.board);
      expect(evaluate(job, b, 0).outcome).toBe('not-fixed');
      if (job.drive!.state === 'corrupt') {
        job.drive!.reimaged = true;
        expect(evaluate(job, b, 0).outcome).toBe('fixed');
      } else {
        job.drive!.replaced = true;
        expect(evaluate(job, b, 0).outcome).toBe('not-fixed'); // blank drive
        job.drive!.reimaged = true;
        const ev = evaluate(job, b, 0);
        expect(ev.outcome).toBe('fixed');
        expect(ev.partsBilled).toBeGreaterThan(0);
      }
    }
  });
});

describe('disc buffing', () => {
  it('polishing clears scratches, too many passes ruin the disc, a deep scratch cannot be saved', () => {
    let fixedOnce = false;
    let unsaveable = false;
    for (let s = 1; s <= 16; s++) {
      const job = generateJob(consoles[0], s * 7, { service: 'disc' });
      const d = job.disc!;
      expect(d.scratches.length).toBeGreaterThan(0);
      const deep = d.scratches.some((x) => x.depth >= DISC_UNSAVEABLE);
      const b = cloneBoard(job.board);
      expect(evaluate(job, b, 0).outcome).toBe('not-fixed');
      for (let i = 0; i < 5; i++) polishDiscPass(d);
      if (deep) {
        unsaveable = true;
        expect(evaluate(job, b, 0).outcome).toBe('not-fixed');
      } else {
        fixedOnce = true;
        expect(d.ruined).toBeFalsy();
        expect(evaluate(job, b, 0).outcome).toBe('fixed');
        for (let i = 0; i < DISC_SAFE_PASSES; i++) polishDiscPass(d);
        expect(d.ruined).toBe(true);
        expect(evaluate(job, b, 0).outcome).toBe('not-fixed');
      }
      expect(loadJob(saveJob(job)).disc).toBeTruthy();
    }
    expect(fixedOnce).toBe(true);
    expect(unsaveable).toBe(true);
  });
});

describe('disc games', () => {
  it('a scratched-disc job names a game from the console\'s disc list', () => {
    const withDiscs = DEVICE_LIST.filter((d) => d.discTitles?.length);
    expect(withDiscs.map((d) => d.id)).toEqual(expect.arrayContaining(['fs5', 'sbox']));
    for (const d of withDiscs) {
      const job = generateJob(d, 4, { service: 'disc' });
      expect(d.discTitles!.map((t) => t.name)).toContain(job.title);
    }
  });
});
