import { describe, expect, it } from 'vitest';
import { METER_CHARGE_START, usbMeterCurrent, usbMeterNow, usbMeterReading } from '../src/game/explain';

describe('USB power meter', () => {
  it('tells charging, no draw, trickle and short apart', () => {
    expect(usbMeterReading(5.0, 0.6).ok).toBe(true);
    expect(usbMeterReading(5.0, 0).verdict).toContain('Nothing is drawn');
    expect(usbMeterReading(5.0, 0.03).verdict).toContain('trickle');
    expect(usbMeterReading(1.2, 1.0).verdict).toContain('shorted');
    expect(usbMeterReading(4.0, 0.8).verdict).toContain('sags');
    expect(usbMeterReading(5, 0.5).watts).toBeCloseTo(2.5);
  });
  it('a healthy device spikes on boot, settles low, then the charger ramps it up', () => {
    const boot = usbMeterCurrent(0.1, 0.6).amps;
    const settled = usbMeterCurrent(3, 0.6).amps;
    const charging = usbMeterCurrent(METER_CHARGE_START + 5, 0.6).amps;
    expect(boot).toBeGreaterThan(settled);
    expect(charging).toBeGreaterThan(settled * 5);
    expect(charging).toBeCloseTo(0.6, 2);
    expect(usbMeterCurrent(3, 0.6).stage).toBe('settled');
  });
  it('a dead charger controller never kicks in', () => {
    const late = usbMeterNow(20, 5, 0.02);
    expect(late.done).toBe(true);
    expect(late.amps).toBeLessThan(0.05);
    expect(late.ok).toBe(false);
  });
  it('with no battery to charge the current never holds steady; with one it does', () => {
    const sample = (unsteady: boolean) => Array.from({ length: 20 }, (_, i) => usbMeterCurrent(8 + i * 0.37, 0.8, unsteady).amps);
    const spread = (a: number[]) => Math.max(...a) - Math.min(...a);
    expect(spread(sample(true))).toBeGreaterThan(0.4);
    expect(spread(sample(false))).toBeLessThan(0.01);
    expect(usbMeterNow(20, 5, 0.8, true).verdict).toContain('fluctuating');
  });
  it('a hard short makes the meter brown out', () => {
    expect(usbMeterReading(0.4, 1.5).verdict).toContain('browns out');
  });
});

describe('battery capacity test', () => {
  it('a worn battery delivers far less than rated; a good one about its rating', async () => {
    const { DEVICE_LIST } = await import('../src/sim/devices');
    const { generateJob } = await import('../src/sim/faults');
    const { chargeTest, batteryHealth } = await import('../src/sim/circuit');
    const { capacityVerdict } = await import('../src/game/explain');
    let tested = 0;
    for (const d of DEVICE_LIST) {
      const v = d.variants.find((x) => x.id.endsWith('battery-worn'));
      if (!v) continue;
      const job = generateJob(d, 3, { variant: v.id });
      const worn = chargeTest(job.board, 3);
      const bad = Object.values(job.board.comps).find((c) => c.fault?.type === 'worn')!;
      expect(batteryHealth(bad)).toBeLessThan(0.6);
      if (worn) {
        expect(worn.deliveredMah).toBeLessThan(worn.ratedMah * 0.6);
        expect(capacityVerdict(worn).ok).toBe(false);
      }
      bad.fault = null;
      const fine = chargeTest(job.board, 3);
      if (fine) expect(capacityVerdict(fine).ok).toBe(true);
      tested++;
    }
    expect(tested).toBeGreaterThan(0);
    expect(chargeTest(generateJob(DEVICE_LIST[0], 1).board, 0.01)).toBeNull();
  });
});
