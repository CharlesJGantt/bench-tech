import { describe, expect, it } from 'vitest';
import { device, place } from '../src/sim/blocks/core';
import { c } from '../src/sim/board';
import { createBoard, operatingPoint } from '../src/sim/circuit';
import { cleanAllContacts, contactIssues, oxideAt, padBright, scrubPin, SCRUB_FLOOR, tarnish } from '../src/sim/contacts';
import { DL12 } from '../src/sim/devices';
import { DEVICES, loadBoard, saveBoard } from '../src/sim/persist';
void place;

// A cartridge-style board powered through its edge fingers into a 100 Ω load.
const CART = device({
  ...DL12,
  id: 'edge-test',
  blocks: [],
  outlines: [],
  parts: [
    c('J1', 'J-EDGE6', 'CART', 30, 40, 0, { '5V': '5V', GND: 'GND', CE: 'CE', D0: 'D0', LKI: 'LKI', LKO: 'LKO' }, 'Edge fingers'),
    c('R1', 'R-100R', 'CART', 30, 20, 0, { '1': '5V', '2': 'GND' }, 'Load'),
    c('TP1', 'TP', 'CART', 10, 10, 0, { '1': 'GND' }, 'Ground'),
  ],
  traces: [],
  testPoints: [],
  rails: [],
  controls: [],
  input: { ...DL12.input, ref: 'J1', plus: '5V', minus: 'GND', adapter: { v: 5, ilim: 1, rint: 0.01, label: 'a console' } },
  ground: 'TP1',
  variants: [],
  firmware: undefined,
  missable: [],
  carbonise: [],
});

const volts = (b: ReturnType<typeof createBoard>) => operatingPoint(b, { kind: 'adapter' }).net('5V');

describe('contact oxide and cleaning', () => {
  it('tarnished fingers starve the board; heavy tarnish cuts it off', () => {
    const b = createBoard(CART);
    expect(volts(b)).toBeGreaterThan(4.9);
    tarnish(b, 'J1', 0.5, () => 0.5);
    const v = volts(b);
    expect(v).toBeLessThan(4.6);
    expect(v).toBeGreaterThan(1);
    tarnish(b, 'J1', 1, () => 0.5);
    expect(volts(b)).toBeLessThan(0.1);
    expect(b.comps.J1.marks).toContain('tarnish');
  });

  it('a magic sponge scrubs faster than a pink eraser; both stop at a dull floor', () => {
    const left = (tool: 'pink-eraser' | 'magic-sponge') => {
      const b = createBoard(CART);
      tarnish(b, 'J1', 0.8, () => 0.5);
      scrubPin(b.comps.J1, '5V', 20, tool);
      return oxideAt(b.comps.J1, '5V');
    };
    expect(left('magic-sponge')).toBeLessThan(left('pink-eraser') - 0.2);
    const b = createBoard(CART);
    tarnish(b, 'J1', 0.8, () => 0.5);
    scrubPin(b.comps.J1, '5V', 500, 'pink-eraser');
    expect(oxideAt(b.comps.J1, '5V')).toBeCloseTo(SCRUB_FLOOR, 5);
  });

  it('Pad-Bright only finishes scrubbed contacts; unfinished ones are noted, tarnished ones a comeback', () => {
    const b = createBoard(CART);
    tarnish(b, 'J1', 0.8, () => 0.5);
    expect(contactIssues(b).hidden.length).toBe(1);
    expect(padBright(b.comps.J1, '5V')).toBe('softened');
    for (const pin of Object.keys(b.comps.J1.oxide!)) scrubPin(b.comps.J1, pin, 500, 'magic-sponge');
    expect(contactIssues(b)).toEqual({ hidden: [], notes: [expect.stringMatching(/Pad-Bright/)] });
    for (const pin of Object.keys(b.comps.J1.oxide!)) expect(padBright(b.comps.J1, pin)).toBe('bright');
    expect(contactIssues(b)).toEqual({ hidden: [], notes: [] });
    expect(volts(b)).toBeGreaterThan(4.9);
  });

  it('oxide and brightening survive a save; cleanAllContacts finishes everything', () => {
    const b = createBoard(CART);
    tarnish(b, 'J1', 0.6, () => 0.5);
    b.comps.J1.brightened = ['GND'];
    DEVICES[CART.id] = CART; // test-only device
    const back = loadBoard(saveBoard(b));
    delete DEVICES[CART.id];
    expect(back.comps.J1.oxide).toEqual(b.comps.J1.oxide);
    expect(back.comps.J1.brightened).toEqual(['GND']);
    cleanAllContacts(back);
    expect(contactIssues(back)).toEqual({ hidden: [], notes: [] });
  });
});
