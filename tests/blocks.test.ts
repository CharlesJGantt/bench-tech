import { describe, expect, it } from 'vitest';
import { c } from '../src/sim/board';
import { device, place } from '../src/sim/blocks/core';
import { buckRail, ldoRail, powerInput } from '../src/sim/blocks/power';
import { createBoard, operatingPoint } from '../src/sim/circuit';
import { FS5 } from '../src/sim/devices';
import { DEVICE_LIST, DL12 } from '../src/sim/devices';

/** A minimal board made only of blocks plus a ground test point. */
const tiny = () =>
  device({
    ...DL12,
    id: 'tiny',
    blocks: [
      place('IN', powerInput({ connector: 'barrel', volts: 12, fuse: 'F-1A', bulk: 'C-100U-25', source: 'the adapter' }), [2, 2], { out: '12V' }),
      place('5V', buckRail({ vout: 5, vin: 12 }), [32, 2], { vin: '12V', out: '5V' }),
      place('3V3', ldoRail({ vin: 5 }), [58, 2], { vin: '5V', out: '3V3' }),
    ],
    parts: [c('TP9', 'TP', 'GND', 80, 30, 0, { '1': 'GND' }, 'Ground')],
    traces: [],
    firmware: undefined,
    controls: [],
    input: { ...DL12.input, ref: 'J1' },
    ground: 'TP9',
    variants: [],
  });

describe('circuit blocks', () => {
  it('plain-numbers refs per prefix, in block order', () => {
    const d = tiny();
    expect(d.blockRefs.IN).toMatchObject({ conn: 'J1', fuse: 'F1', bulk: 'C1', tpIn: 'TP1', tpOut: 'TP2' });
    expect(d.blockRefs['5V']).toMatchObject({ reg: 'U1', boot: 'C2', ind: 'L1', cout: 'C3', tp: 'TP3' });
    expect(d.blockRefs['3V3']).toMatchObject({ reg: 'U2', cout: 'C4', tp: 'TP4' });
    // The device's own TP9 is untouched and never reused.
    expect(new Set(d.components.map((x) => x.ref)).size).toBe(d.components.length);
  });

  it('namespaces internal nets and shares port nets', () => {
    const d = tiny();
    const reg = d.components.find((x) => x.ref === 'U1')!;
    expect(reg.pins.IN).toBe('12V');
    expect(reg.pins.FB).toBe('5V_FB');
    expect(d.nets['5V_FB'].expected).toBe(0.8);
    expect(d.testPoints.map((t) => `${t.ref}:${t.net}`)).toContain('TP3:5V');
  });

  it('a board built from blocks actually works', () => {
    const d = tiny();
    const op = operatingPoint(createBoard(d), { kind: 'adapter' });
    expect(Math.abs(op.net('5V') - 5)).toBeLessThan(0.2);
    expect(Math.abs(op.net('3V3') - 3.3)).toBeLessThan(0.1);
  });

  it('collects block variants with their refs resolved', () => {
    const d = tiny();
    expect(d.variants.map((v) => v.id)).toEqual(['psu-conn-joint', 'fuse-blown', 'buck-dead', 'inductor-open', 'esr-out', 'ldo-dead']);
  });

  it('rejects unwired ports and duplicate refs', () => {
    expect(() => device({ ...tiny(), blocks: [place('5V', buckRail({ vout: 5, vin: 12 }), [0, 0], { vin: '12V' })], parts: [] })).toThrow(/port out/);
    expect(() =>
      device({ ...tiny(), blocks: [place('3V3', ldoRail({ vin: 5 }), [0, 0], { vin: '5V', out: '3V3' }, { reg: 'U9' })], parts: [c('U9', 'U-HL33', 'X', 0, 0, 0, {}, 'x')] }),
    ).toThrow(/U9 used twice/);
  });

  it('Funstation 5 keeps its original refs after moving to blocks', () => {
    const refs = FS5.components.map((x) => x.ref);
    for (const r of ['J1', 'F1', 'C1', 'U1', 'L1', 'C3', 'U2', 'C4', 'TP1', 'TP2', 'TP3', 'TP4']) expect(refs).toContain(r);
    expect(FS5.components.length).toBe(39);
  });
});

describe('service data stays consistent', () => {
  for (const d of DEVICE_LIST)
    it(`${d.name}: net descriptions and test points refer to real nets`, () => {
      const used = new Set(d.components.flatMap((x) => Object.values(x.pins)));
      for (const t of d.traces) (used.add(t.a), used.add(t.b));
      expect(Object.keys(d.nets).filter((n) => !used.has(n))).toEqual([]);
      expect(d.testPoints.filter((t) => !used.has(t.net)).map((t) => t.ref)).toEqual([]);
      expect(new Set(d.components.map((x) => x.ref)).size).toBe(d.components.length);
    });
});
