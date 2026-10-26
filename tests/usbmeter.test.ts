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
});
