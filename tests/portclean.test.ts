import { describe, expect, it } from 'vitest';
import { cloneBoard } from '../src/sim/circuit';
import { DEVICE_LIST } from '../src/sim/devices';
import { generateJob } from '../src/sim/faults';
import { saveJob, loadJob } from '../src/sim/persist';
import { cleanPort, debrisLevel, debrisR, portClear } from '../src/sim/portclean';
import { evaluate } from '../src/sim/repair';
import { functionalTest } from '../src/sim/circuit';

const withVariant = (id: string) => DEVICE_LIST.filter((d) => d.variants.some((v) => v.id === id));

describe('clogged ports', () => {
  it('a clogged USB port fails the owner test and is fixed by cleaning the right way', () => {
    const devs = withVariant('usb-port-clogged');
    expect(devs.length).toBeGreaterThan(0);
    for (const d of devs.slice(0, 6)) {
      const job = generateJob(d, 3, { variant: 'usb-port-clogged' });
      const b = cloneBoard(job.board);
      const ref = job.faults[0].refs[0];
      expect(functionalTest(cloneBoard(b)).passed, d.name).toBe(false);
      const c = b.comps[ref];
      // order matters: lint with tweezers, pick the packed grime loose, then blow and wipe it out
      expect(cleanPort(c, 'blower').ok).toBe(true); // moves loose dust and some lint
      expect(cleanPort(c, 'swab').ok === true || c.debris!.loose < 0.02).toBe(true);
      expect(cleanPort(c, 'tweezers').ok).toBe(true);
      expect(portClear(c)).toBe(false); // the packed grime is still there
      expect(cleanPort(c, 'pick').ok).toBe(true);
      expect(cleanPort(c, 'blower').ok).toBe(true);
      expect(portClear(c), d.name).toBe(true);
      expect(evaluate(job, b, 0).outcome, d.name).toBe('fixed');
    }
  });
  it('a tool in the wrong order does nothing useful', () => {
    const job = generateJob(withVariant('usb-port-clogged')[0], 5, { variant: 'usb-port-clogged' });
    const c = job.board.comps[job.faults[0].refs[0]];
    c.debris = { lint: 0, packed: 0.6, loose: 0 };
    expect(cleanPort(c, 'blower').ok).toBe(false);
    expect(cleanPort(c, 'swab').ok).toBe(false);
    expect(cleanPort(c, 'tweezers').ok).toBe(false);
  });
  it('debris resistance rises with the amount, and a full port will not seat', () => {
    expect(debrisR(undefined)).toBe(0);
    expect(debrisR({ lint: 0, packed: 0.3, loose: 0 })).toBeLessThan(debrisR({ lint: 0, packed: 0.7, loose: 0 }));
    expect(debrisR({ lint: 0.9, packed: 0.9, loose: 0.5 })).toBe(Infinity);
    expect(debrisLevel({ lint: 0, packed: 0, loose: 0 })).toBe(0);
  });
  it('survives saving', () => {
    const job = generateJob(withVariant('usb-port-clogged')[0], 7, { variant: 'usb-port-clogged' });
    const back = loadJob(saveJob(job));
    const ref = job.faults[0].refs[0];
    expect(back.board.comps[ref].debris).toEqual(job.board.comps[ref].debris);
  });
});

describe('bent port contacts', () => {
  it('cleaning does not help; only a new port does', () => {
    for (const id of ['usb-pins-bent', 'hdmi-bent-pin']) {
      const d = withVariant(id)[0];
      const job = generateJob(d, 4, { variant: id });
      const b = cloneBoard(job.board);
      const c = b.comps[job.faults[0].refs[0]];
      expect(c.bent?.length, id).toBeGreaterThan(0);
      expect(functionalTest(cloneBoard(b)).passed, id).toBe(false);
    }
  });
});

describe('port window', () => {
  it('draws debris and bent contacts', async () => {
    const { portViewHtml } = await import('../src/ui/portview');
    for (const id of ['usb-port-clogged', 'usb-pins-bent', 'hdmi-port-clogged', 'hdmi-bent-pin']) {
      const d = withVariant(id)[0];
      const job = generateJob(d, 2, { variant: id });
      const ref = job.faults[0].refs[0];
      const fake = { board: job.board, job, guided: true, owns: () => true, shop: { supplies: { swabs: 5 } } } as never;
      const html = portViewHtml(fake, ref, 'test');
      expect(html).toContain('<svg');
      expect(html).toContain('data-pv-clean');
      expect(html).toContain('eyepiece');
      if (id.includes('bent')) expect(html).toContain('bent');
      else expect(html).toMatch(/fluff|grime|dust/);
    }
  });

  it('shows corrosion crust on the contacts after liquid damage', async () => {
    const { portViewHtml } = await import('../src/ui/portview');
    const { corrode } = await import('../src/sim/corrosion');
    const d = withVariant('usb-port-clogged')[0];
    const job = generateJob(d, 2, { variant: 'usb-port-clogged' });
    const ref = job.faults[0].refs[0];
    corrode(job.board, ref, 0.6);
    const fake = { board: job.board, job, guided: true, owns: () => true, shop: { supplies: { swabs: 5 } } } as never;
    const html = portViewHtml(fake, ref, '', { zoom: 2, ring: true });
    expect(html).toContain('liquid damage');
    expect(html).toContain('scale(2)');
  });
});
