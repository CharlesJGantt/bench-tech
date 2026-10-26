import { describe, expect, it } from 'vitest';
import { usbMeterReading } from '../src/game/explain';

describe('USB power meter', () => {
  it('tells charging, no draw, trickle and short apart', () => {
    expect(usbMeterReading(5.0, 0.6).ok).toBe(true);
    expect(usbMeterReading(5.0, 0).verdict).toContain('Nothing is drawn');
    expect(usbMeterReading(5.0, 0.03).verdict).toContain('trickle');
    expect(usbMeterReading(1.2, 1.0).verdict).toContain('shorted');
    expect(usbMeterReading(5, 0.5).watts).toBeCloseTo(2.5);
  });
});
