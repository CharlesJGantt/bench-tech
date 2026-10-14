import { describe, expect, it } from 'vitest';
import { DL12 } from '../src/sim/devices';
import { createBoard, functionalTest, measure, operatingPoint, powerUpSteady, type PowerConfig } from '../src/sim/circuit';

const adapter: PowerConfig = { kind: 'adapter' };
const off: PowerConfig = { kind: 'off' };
const tp = (ref: string) => ({ ref, pin: '1' });
const GND = tp('TP5');

describe('healthy DL-12', () => {
  it('has correct rail voltages', () => {
    const b = createBoard(DL12);
    const op = operatingPoint(b, adapter);
    expect(op.converged).toBe(true);
    expect(op.net('12V_SYS')).toBeGreaterThan(11.7);
    expect(op.net('12V_SYS')).toBeLessThan(12.3);
    expect(op.net('5V')).toBeGreaterThan(4.85);
    expect(op.net('5V')).toBeLessThan(5.15);
    expect(op.net('3V3')).toBeGreaterThan(3.2);
    expect(op.net('3V3')).toBeLessThan(3.4);
    expect(b.mcu.running).toBe(true);
  });

  it('passes the functional test', () => {
    const b = createBoard(DL12);
    const r = functionalTest(b);
    expect(r.checks.every((c) => c.ok)).toBe(true);
    expect(r.facts.lampBrightness).toBeGreaterThan(0.8);
    expect(r.passed).toBe(true);
    expect(r.inputCurrent).toBeLessThan(0.05);
  });

  it('meter readings are sensible unpowered', () => {
    const b = createBoard(DL12);
    const fuse = measure(b, off, 'continuity', { ref: 'F1', pin: '1' }, { ref: 'F1', pin: '2' });
    expect(fuse.beep).toBe(true);
    const r5v = measure(b, off, 'ohm', tp('TP3'), GND);
    expect(r5v.value).toBeGreaterThan(5e3);
    const diodeFwd = measure(b, off, 'diode', GND, tp('TP3'));
    expect(diodeFwd.value).toBeGreaterThan(0.3);
    expect(diodeFwd.value).toBeLessThan(0.8);
    const r12 = measure(b, off, 'ohm', { ref: 'R12', pin: '1' }, { ref: 'R12', pin: '2' });
    expect(r12.value).toBeGreaterThan(50e3);
  });

  it('dcv reads the 5V rail when powered', () => {
    const b = createBoard(DL12);
    const r = measure(b, adapter, 'dcv', tp('TP3'), GND);
    expect(r.value!).toBeCloseTo(5, 0);
  });

  it('a shorted TVS blows the fuse on the customer adapter', () => {
    const b = createBoard(DL12);
    b.comps.D1.fault = { type: 'short', r: 0.2 };
    const { events } = powerUpSteady(b, adapter);
    expect(events.some((e) => e.ref === 'F1')).toBe(true);
    expect(b.comps.F1.fault?.type).toBe('open');
  });
});
