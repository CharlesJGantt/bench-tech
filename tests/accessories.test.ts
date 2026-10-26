import { describe, expect, it } from 'vitest';
import { cable, charger, chargePath, devicePd, usesUsbCharger } from '../src/sim/accessories';
import { cloneBoard } from '../src/sim/circuit';
import { DEVICE_LIST } from '../src/sim/devices';
import { generateJob } from '../src/sim/faults';
import { evaluate } from '../src/sim/repair';

describe('chargers and cables', () => {
  it('a PD charger fast-charges a USB-C device at higher voltage and lower current', () => {
    const slow = chargePath(0.8, 9, charger('old-1a'), cable('good'));
    const fast = chargePath(0.8, 9, charger('bench-pd'), cable('good'));
    expect(slow.negotiated).toBe(5);
    expect(fast.negotiated).toBe(9);
    expect(fast.watts).toBeGreaterThan(slow.watts);
    expect(fast.amps).toBeLessThan(0.8);
  });
  it('a device that cannot fast-charge stays at 5 V; 20 V needs an e-marked cable', () => {
    expect(chargePath(0.8, 5, charger('bench-pd'), cable('good')).negotiated).toBe(5);
    expect(chargePath(2, 20, charger('pd-65'), cable('good')).negotiated).toBe(15);
    expect(chargePath(2, 20, charger('pd-65'), cable('emark')).negotiated).toBe(20);
  });
  it('a thin cable and an old block hold the current down', () => {
    const good = chargePath(1.5, 5, charger('block-24'), cable('good'));
    const thin = chargePath(1.5, 5, charger('block-24'), cable('cheap'));
    const old = chargePath(1.5, 5, charger('old-1a'), cable('good'));
    expect(thin.amps).toBeLessThan(good.amps);
    expect(thin.limitedBy).toBe('cable');
    expect(old.amps).toBeLessThan(good.amps);
    expect(old.limitedBy).toBe('charger');
    expect(thin.volts).toBeLessThan(good.volts);
  });
  it('dead and open accessories give nothing', () => {
    expect(chargePath(1, 5, charger('customer-dead'), cable('good')).amps).toBe(0);
    expect(chargePath(1, 5, charger('bench-pd'), cable('customer-open')).amps).toBe(0);
  });
});

describe('accessory service jobs', () => {
  const dev = DEVICE_LIST.find((d) => usesUsbCharger(d))!;
  it('the device is fine; the job is done only once the worn-out accessories are replaced', () => {
    const job = generateJob(dev, 11, { service: 'accessory' });
    expect(job.accessory).toBeTruthy();
    expect(job.faults[0].variant).toBe('service-accessory');
    const board = cloneBoard(job.board);
    expect(evaluate(job, board, 0).outcome).toBe('not-fixed');
    job.accessory!.chargerSold = true;
    job.accessory!.cableSold = true;
    const ev = evaluate(job, board, 0);
    expect(ev.outcome).toBe('fixed');
    expect(ev.partsBilled).toBeGreaterThan(0);
  });
  it('USB-C devices negotiate more than micro-USB ones', () => {
    const c = DEVICE_LIST.find((d) => d.components.find((x) => x.ref === d.input.ref)?.partNo === 'J-USBC')!;
    const m = DEVICE_LIST.find((d) => d.components.find((x) => x.ref === d.input.ref)?.partNo === 'J-MUSB')!;
    expect(devicePd(c)).toBeGreaterThan(5);
    expect(devicePd(m)).toBe(5);
  });
});
