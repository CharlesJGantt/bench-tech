import { describe, expect, it } from 'vitest';
import { cloneBoard, createBoard, functionalTest, measure, operatingPoint } from '../src/sim/circuit';
import { DL12, FS5 } from '../src/sim/devices';
import { generateJob } from '../src/sim/faults';
import { scopeAt } from '../src/sim/scope';
import { askCustomer, createShop, endDay, harvestPart, buyListing, searchOnline, stockOf } from '../src/business/shop';
import { saveJob } from '../src/sim/persist';

const off = { kind: 'off' } as const;
const adapter = (b: ReturnType<typeof createBoard>) => ({ kind: 'adapter' as const, device: b.device });

describe('ESR meter', () => {
  it('a healthy cap reads near 0 Ω; a dried-out one reads high, though ohms mode looks the same', () => {
    const good = createBoard(DL12);
    const bad = cloneBoard(good);
    bad.comps.C3.fault = { type: 'esr', esr: 8 };
    bad.comps.C4.part = null;
    const g2 = cloneBoard(good);
    g2.comps.C4.part = null;
    const esr = (b: typeof good) => measure(b, off, 'esr', { ref: 'C3', pin: '1' }, { ref: 'C3', pin: '2' }).value!;
    expect(esr(g2)).toBeLessThan(0.1);
    expect(esr(bad)).toBeGreaterThan(5);
    const ohm = (b: typeof good) => measure(b, off, 'ohm', { ref: 'C3', pin: '1' }, { ref: 'C3', pin: '2' }).display;
    expect(ohm(bad)).toBe(ohm(g2));
  });

  it('a high-ESR output cap makes the 5 V rail sag', () => {
    const b = createBoard(DL12);
    b.comps.C3.fault = { type: 'esr', esr: 8 };
    const op = operatingPoint(b, adapter(b) as never);
    expect(op.net('5V')).toBeLessThan(3.5);
    expect(op.net('5V')).toBeGreaterThan(1.5);
    expect(scopeAt(b, op, { ref: 'TP3', pin: '1' }).kind).toBe('ripple');
  });
});

describe('oscilloscope', () => {
  it('a dead retimer takes data in but sends nothing out', () => {
    const job = generateJob(FS5, 3, { variant: 'retimer-dead' });
    const b = job.board;
    b.attached = ['tv'];
    const r = functionalTest(cloneBoard(b));
    expect(r.passed).toBe(false);
  });

  it('a running buck shows a square wave on its switch node', () => {
    const b = createBoard(DL12);
    const op = operatingPoint(b, adapter(b) as never);
    expect(scopeAt(b, op, { ref: 'U1', pin: 'SW' }).kind).toBe('square');
    expect(scopeAt(b, op, { ref: 'TP3', pin: '1' }).kind).toBe('flat');
  });
});

describe('customers', () => {
  it('buying a dead device for parts puts it in the store-room', () => {
    const st = createShop(50);
    const q = st.queue[0];
    const job = generateJob(DL12, 1, { variant: 'buck-dead' });
    let said = false;
    for (let i = 0; i < 20 && !said; i++) said = askCustomer(st, q.id, job, 'buyout', { pct: 0.25 }).yes;
    expect(said).toBe(true);
    expect(st.queue.find((x) => x.id === q.id)).toBeUndefined();
    const donor = st.projects.find((p) => p.status === 'donor')!;
    expect(donor).toBeDefined();
    expect(harvestPart(st, donor.id, 'U3').ok).toBe(true);
    expect(stockOf(st, 'U-PIC8').used).toBe(1);
  });

  it('a customer who agreed to wait does not walk out', () => {
    const st = createShop(51);
    const q = st.queue[0];
    let yes = false;
    for (let i = 0; i < 20 && !yes; i++) yes = askCustomer(st, q.id, generateJob(DL12, 1), 'wait-donor').yes;
    expect(yes).toBe(true);
    for (let i = 0; i < 5; i++) endDay(st);
    expect(st.queue.find((x) => x.id === q.id)).toBeDefined();
    for (let i = 0; i < 3; i++) endDay(st);
    expect(st.queue.find((x) => x.id === q.id)).toBeUndefined();
  });

  it('agreeing to next-day delivery adds the fee to the bill', () => {
    const st = createShop(52);
    const q = st.queue[0];
    const job = generateJob(DL12, 1);
    const quote = q.quote;
    const jq = job.quote;
    let yes = false;
    for (let i = 0; i < 40 && !yes; i++) yes = askCustomer(st, q.id, job, 'express').yes;
    expect(yes).toBe(true);
    expect(q.quote - quote).toBe(q.extraFee);
    expect(job.quote - jq).toBe(q.extraFee);
  });

  it('online donors arrive in the post', () => {
    const st = createShop(53);
    st.cash = 1000;
    const found = searchOnline(st, 'fs5');
    expect(found.length).toBeGreaterThan(0);
    expect(searchOnline(st, 'fs5')).toEqual([]); // once a day
    const l = found[0];
    const p = buyListing(st, l.id)!;
    expect(p.arrives).toBe(st.day + l.ships!);
    if (p.status === 'donor') expect(harvestPart(st, p.id, 'U3').ok).toBe(false);
    while (st.day < p.arrives!) endDay(st);
    if (p.status === 'donor') expect(harvestPart(st, p.id, 'C6').text).not.toMatch(/arrived/);
    expect(saveJob).toBeDefined();
  });
});
