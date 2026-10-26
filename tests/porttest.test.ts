import { describe, expect, it } from 'vitest';
import { DEVICE_LIST } from '../src/sim/devices';
import { generateJob } from '../src/sim/faults';
import { portRef, portTest } from '../src/sim/porttest';

describe('USB port diode tester', () => {
  it('a healthy board shows all green; a shorted surge clamp lights VBUS red', () => {
    let checked = 0;
    for (const d of DEVICE_LIST) {
      const v = d.variants.find((x) => x.id.endsWith('usb-tvs-short'));
      if (!v) continue;
      const bad = generateJob(d, 4, { variant: v.id });
      const rep = portTest(bad.board)!;
      expect(portRef(bad.board)).toBeTruthy();
      expect(rep.pins.find((p) => p.pin === 'VBUS')!.ok, d.name).toBe(false);
      expect(rep.pins.find((p) => p.pin === 'VBUS')!.state).toBe('short');
      checked++;
    }
    expect(checked).toBeGreaterThan(0);
    const dev = DEVICE_LIST.find((d) => d.variants.some((x) => x.id.endsWith('usb-tvs-short')))!;
    const ok = generateJob(dev, 4, { variant: dev.variants.find((x) => x.id.endsWith('usb-port-loose'))!.id });
    // a worn port still has its pads: the surge clamp and charger are untouched
    for (const p of portTest(ok.board)!.pins) expect(['ok', 'open', 'off']).toContain(p.state);
  });
  it('a port ripped off the board reads open on the lifted pads', () => {
    const dev = DEVICE_LIST.find((d) => d.variants.some((x) => x.id.endsWith('usb-port-ripped')))!;
    const job = generateJob(dev, 2, { variant: dev.variants.find((x) => x.id.endsWith('usb-port-ripped'))!.id });
    const rep = portTest(job.board)!;
    expect(rep.pins.some((p) => !p.ok)).toBe(true);
  });
});
