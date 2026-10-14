import { describe, expect, it } from 'vitest';
import { c } from '../src/sim/board';
import { device, place } from '../src/sim/blocks/core';
import { buckRail, ldoRail, powerInput } from '../src/sim/blocks/power';
import { cloneBoard, createBoard, operatingPoint } from '../src/sim/circuit';
import { DL12 } from '../src/sim/devices';
import { PARTS } from '../src/sim/parts';

// A test-only processor with a second supply rail (AUX, fed from 5 V).
PARTS['U-TEST-SOC'] = {
  ...PARTS['U-PIC8'],
  partNo: 'U-TEST-SOC',
  label: 'Test SoC',
  pins: ['VDD', 'LED', 'AUX', 'NC4', 'NC5', 'NC6', 'NC7', 'GND'],
  rails: [{ pin: 'AUX', nominal: 5, uvlo: 4.5, amps: 0.3, standbyAmps: 0.001 }],
};

const board = () =>
  device({
    ...DL12,
    id: 'soc-test',
    blocks: [
      place('IN', powerInput({ connector: 'barrel', volts: 12, fuse: 'F-1A', bulk: 'C-100U-25', source: 'the adapter' }), [2, 2], { out: '12V' }),
      place('5V', buckRail({ vout: 5, vin: 12 }), [32, 2], { vin: '12V', out: '5V' }),
      place('3V3', ldoRail({ vin: 5 }), [58, 2], { vin: '5V', out: '3V3' }),
    ],
    parts: [
      c('U9', 'U-TEST-SOC', 'SOC', 80, 20, 0, { VDD: '3V3', LED: 'LED_IO', AUX: '5V', NC4: 'X4', NC5: 'X5', NC6: 'X6', NC7: 'X7', GND: 'GND' }, 'Processor'),
      c('TP9', 'TP', 'SOC', 80, 40, 0, { '1': 'GND' }, 'Ground'),
    ],
    traces: [],
    controls: [],
    input: { ...DL12.input, ref: 'J1' },
    ground: 'TP9',
    variants: [],
    firmware: { ref: 'U9', vmin: 2.8, vmax: 3.6, inputs: [], boot: () => ({}), step: () => ({ LED: true }) },
  });

describe('multi-rail chips', () => {
  it('boots when every rail is up, and draws its rail current while running', () => {
    const b = createBoard(board());
    const op = operatingPoint(b, { kind: 'adapter' });
    expect(b.mcu.running).toBe(true);
    expect(op.net('LED_IO')).toBeGreaterThan(3);
    // 0.3 A on AUX at 5 V through the buck shows up as input current (≈ 0.15 A at 12 V).
    expect(op.srcI).toBeGreaterThan(0.1);
  });

  it('a shorted rail inside the chip stops it booting and drags the rail down', () => {
    const b = cloneBoard(createBoard(board()));
    b.comps.U9.fault = { type: 'rail-short', pin: 'AUX', r: 0.3 };
    const op = operatingPoint(b, { kind: 'adapter' });
    expect(b.mcu.running).toBe(false);
    expect(op.net('5V')).toBeLessThan(1);
  });
});
