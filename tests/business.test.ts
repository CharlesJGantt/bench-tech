import { describe, expect, it } from 'vitest';
import { BES_CART } from '../src/sim/devices';
import { delivery, ELECTRICITY, RENT, SUPPLIES } from '../src/business/economy';
import {
  availableDevices,
  buyListing,
  completeCustomerJob,
  harvestPart,
  resaleValue,
  storeProject,
  cartHomeFailure,
  createShop,
  dailySaleChance,
  endDay,
  listProject,
  placeOrder,
  profitAndLoss,
  rushBuy,
  scrapProject,
  stockOf,
  takePart,
} from '../src/business/shop';
import { cloneBoard, functionalTest } from '../src/sim/circuit';
import { generateJob } from '../src/sim/faults';
import { DL12, FS5 } from '../src/sim/devices';
import { loadJob, saveJob } from '../src/sim/persist';
import { part } from '../src/sim/parts';

describe('shop economy', () => {
  it('starts with customers, listings, supplies and stock', () => {
    const st = createShop(1);
    expect(st.queue.length).toBe(2);
    expect(st.market.length).toBe(3);
    expect(st.supplies.solder).toBe(SUPPLIES.solder.start);
    expect(stockOf(st, 'R-10K').new).toBeGreaterThan(0);
    expect(stockOf(st, 'U-PIC8').new).toBe(1); // programmed MCUs: one in the starter pack, otherwise donor boards only
  });

  it('bills electricity and advertising daily, and rent weekly', () => {
    const st = createShop(2);
    st.ads = 'flyers';
    const r1 = endDay(st);
    expect(r1.bills.some((b) => b.cat === 'electricity' && b.amount === -ELECTRICITY.basePerDay)).toBe(true);
    expect(r1.bills.some((b) => b.cat === 'advertising')).toBe(true);
    expect(r1.bills.some((b) => b.cat === 'rent')).toBe(false);
    while (st.day < RENT.everyDays) endDay(st);
    const r7 = endDay(st);
    expect(r7.bills.some((b) => b.cat === 'rent' && b.amount === -RENT.amount)).toBe(true);
  });

  it('express orders are paid now and delivered next morning', () => {
    const st = createShop(3);
    const cash = st.cash;
    const before = stockOf(st, 'C-22U-10').new;
    placeOrder(st, [
      { kind: 'part', id: 'C-22U-10', qty: 5 },
      { kind: 'supply', id: 'flux-noclean', qty: 1 },
    ], 'express');
    expect(st.cash).toBeCloseTo(cash - (part('C-22U-10').cost * 5 + SUPPLIES['flux-noclean'].pack.cost + delivery('express').cost), 2);
    expect(stockOf(st, 'C-22U-10').new).toBe(before);
    const flux = st.supplies['flux-noclean'];
    endDay(st);
    expect(stockOf(st, 'C-22U-10').new).toBe(before + 5);
    expect(st.supplies['flux-noclean']).toBe(flux + SUPPLIES['flux-noclean'].pack.qty);
  });

  it('cannot order or rush-buy the factory-programmed MCU', () => {
    const st = createShop(4);
    expect(placeOrder(st, [{ kind: 'part', id: 'U-PIC8', qty: 1 }])).toBeNull();
    expect(rushBuy(st, 'U-PIC8')).toBe(false);
    expect(rushBuy(st, 'F-1A')).toBe(true);
    expect(takePart(st, 'F-1A')).toBe('new');
  });

  it('comebacks walk back in as free warranty jobs with cracked joints', () => {
    const st = createShop(5);
    const job = generateJob(DL12, 9, { variant: 'fuse-blown' });
    job.board.comps.F1.fault = null;
    job.board.comps.F1.joints = { '1': { r: 0.5, cold: true }, '2': { r: 0 } };
    completeCustomerJob(st, job, 'comeback', 45, -4);
    for (let i = 0; i < 5; i++) endDay(st);
    const w = st.queue.find((q) => q.kind === 'warranty');
    expect(w).toBeDefined();
    expect(w!.quote).toBe(0);
    const back = loadJob(w!.job);
    expect(back.board.comps.F1.joints['1'].cracked).toBe(true);
    expect(functionalTest(back.board).passed).toBe(false);
  });

  it('flip projects: buy, repair, list, sell', () => {
    const st = createShop(6);
    const l = st.market.find((x) => !x.unrepairable)!;
    const cash = st.cash;
    const p = buyListing(st, l.id)!;
    expect(st.cash).toBe(cash - l.price);
    // Pretend we repaired it perfectly: a brand-new board.
    const job = loadJob(p.job);
    const fresh = generateJob(DL12, 1, { variant: 'fuse-blown' });
    fresh.board.comps.F1.fault = null;
    job.board = fresh.board;
    for (const c of Object.values(job.board.comps)) c.marks = [];
    const res = listProject(st, p.id, job, 0);
    expect(res.ok).toBe(true);
    for (let i = 0; i < 4; i++) endDay(st);
    expect(st.projects.find((x) => x.id === p.id)!.status).toBe('sold');
    expect(profitAndLoss(st, 1, st.day).byCat.sale).toBeGreaterThan(l.price);
  });

  it('a broken project cannot be listed', () => {
    const st = createShop(7);
    const p = buyListing(st, st.market[0].id)!;
    const res = listProject(st, p.id, loadJob(p.job), 0);
    expect(res.ok).toBe(false);
  });

  it('carbonised boards cannot be fixed by swapping parts, but can be scrapped for parts', () => {
    const job = generateJob(DL12, 11, { variant: 'fuse-blown', unrepairable: true });
    job.board.comps.F1.fault = null;
    expect(functionalTest(cloneBoard(job.board)).passed).toBe(false);
    const st = createShop(8);
    st.projects.push({ id: 99, title: 'donor', paid: 20, status: 'owned', job: saveJob(job) });
    const parts = scrapProject(st, 99, job);
    expect(parts).toContain('U-PIC8');
    expect(stockOf(st, 'U-PIC8').used).toBe(1);
  });

  it('missing-parts listings arrive with empty footprints', () => {
    const job = generateJob(DL12, 21, { missingParts: 2 });
    expect(Object.values(job.board.comps).filter((c) => !c.part).length).toBe(2);
    expect(job.faults.some((f) => f.family === 'Missing parts')).toBe(true);
  });

  it('jobs survive a save/load round trip', () => {
    const job = generateJob(DL12, 33, { variant: 'joint-cracked' });
    const back = loadJob(JSON.parse(JSON.stringify(saveJob(job))));
    expect(functionalTest(cloneBoard(back.board))).toEqual(functionalTest(cloneBoard(job.board)));
  });

  it('slower delivery is cheaper but takes longer', () => {
    const st = createShop(30);
    const start = stockOf(st, 'U-LX9201').new;
    const o = placeOrder(st, [{ kind: 'part', id: 'U-LX9201', qty: 1 }], 'economy')!;
    expect(o.arrives).toBe(st.day + delivery('economy').days);
    endDay(st);
    expect(stockOf(st, 'U-LX9201').new).toBe(start);
    endDay(st);
    endDay(st);
    expect(stockOf(st, 'U-LX9201').new).toBe(start + 1);
  });

  it('expensive chips are special order: no local rush buy', () => {
    const st = createShop(31);
    const start = stockOf(st, 'U-LX9201').new;
    expect(rushBuy(st, 'U-LX9201')).toBe(false);
    expect(rushBuy(st, 'U-APU-F5')).toBe(false);
    expect(stockOf(st, 'U-LX9201').new).toBe(start);
  });

  it('better devices come in as reputation grows', () => {
    const st = createShop(32);
    expect(availableDevices(st).every((d) => d.minReputation === 0)).toBe(true);
    st.reputation = 80;
    expect(availableDevices(st).some((d) => d.id === 'fs5')).toBe(true);
    const seen = new Set<string>();
    for (let i = 0; i < 12; i++) {
      endDay(st);
      for (const q of st.queue) seen.add(q.job.deviceId);
      for (const l of st.market) seen.add(l.device);
      st.queue = [];
    }
    expect(seen.size).toBeGreaterThan(3);
  });

  it('a craze raises resale value and sells overnight', () => {
    const st = createShop(33);
    const board = generateJob(FS5, 1, { variant: FS5.variants[0].id }).board;
    const base = resaleValue(board, st);
    st.trend.fs5 = { mult: 1.5, until: st.day + 3, label: 'Test hype' };
    expect(resaleValue(board, st)).toBeCloseTo(base * 1.5, 1);
    // Crazes end on their own.
    for (let i = 0; i < 5; i++) endDay(st);
    expect(st.trend.fs5).toBeUndefined();
  });

  it('store-room donors: pull parts one at a time; dead parts are binned', () => {
    const st = createShop(34);
    const job = generateJob(FS5, 5, { kind: 'project' });
    st.projects.push({ id: 77, title: 'donor', paid: 40, status: 'owned', job: saveJob(job) });
    expect(storeProject(st, 77, job)).toBe(true);
    const healthy = Object.values(job.board.comps).find((c) => c.part?.partNo === 'U-APU-F5' && !c.fault)!;
    const res = harvestPart(st, 77, healthy.ref);
    expect(res.ok).toBe(true);
    expect(stockOf(st, 'U-APU-F5').used).toBe(1);
    expect(harvestPart(st, 77, healthy.ref).ok).toBe(false); // already gone
    const dead = job.faults.flatMap((f) => f.refs ?? []).find((r) => job.board.comps[r]?.fault);
    if (dead) expect(harvestPart(st, 77, dead).ok).toBe(false);
  });
});

describe('new career', () => {
  it('starts on day 1 with a starter pack of hard-to-get parts', () => {
    const st = createShop(1);
    expect(st.day).toBe(1);
    expect(st.stock['U-TC41'].new).toBeGreaterThanOrEqual(1);
    expect(st.stock['U-LX9201'].new).toBe(1);
    expect(st.stock['U-PIC8'].new).toBe(1); // factory-programmed: otherwise salvage-only
    expect(st.stock['U-APU-F5'].new).toBe(0);
  });
});

describe('cartridges tested at home', () => {
  it('a dud comes back the next day for 10% and a free re-fix', () => {
    const st = createShop(5);
    const job = generateJob(BES_CART, 12, { variant: 'dirty-fingers' });
    job.quote = 30;
    cartHomeFailure(st, job);
    const cash = st.cash;
    const before = st.queue.length;
    endDay(st);
    const back = st.queue.find((q) => q.kind === 'warranty');
    expect(back).toBeTruthy();
    expect(back!.complaint).toMatch(/10%/);
    expect(st.queue.length).toBeGreaterThan(before - 1);
    expect(st.ledger.some((e) => e.amount === -3 && /10% refund/.test(e.text))).toBe(true);
    expect(st.cash).toBeLessThan(cash);
  });
});

describe('review save', () => {
  it('has one waiting job for every device, all loadable', async () => {
    const { createReviewShop } = await import('../src/business/shop');
    const { DEVICE_LIST } = await import('../src/sim/devices');
    const { loadJob } = await import('../src/sim/persist');
    const st = createReviewShop();
    expect(st.queue.length).toBe(DEVICE_LIST.length);
    expect(new Set(st.queue.map((q) => q.job.deviceId)).size).toBe(DEVICE_LIST.length);
    for (const q of st.queue) expect(loadJob(q.job).device.id).toBe(q.job.deviceId);
  });

  it('selling channels: tracker record, fees, reserve and pricing', () => {
    const fixed = (seed: number) => {
      const st = createShop(seed);
      st.queue = [];
      const l = st.market.find((x) => !x.unrepairable)!;
      const p = buyListing(st, l.id)!;
      const job = loadJob(p.job);
      const fresh = generateJob(DL12, 1, { variant: 'fuse-blown' });
      fresh.board.comps.F1.fault = null;
      job.board = fresh.board;
      for (const c of Object.values(job.board.comps)) c.marks = [];
      return { st, p, job, value: resaleValue(job.board, st) };
    };
    // a reserve nobody will meet: the auction ends unsold and the device comes back
    const a = fixed(21);
    expect(listProject(a.st, a.p.id, a.job, 0, { channel: 'auction', reserve: a.value * 5, days: 3 }).ok).toBe(true);
    for (let i = 0; i < 5; i++) endDay(a.st);
    expect(a.p.status).toBe('owned');
    expect(a.st.sales).toHaveLength(0);
    // a fair auction sells, charges its fee and is recorded
    const b = fixed(22);
    listProject(b.st, b.p.id, b.job, 0, { channel: 'auction', reserve: 1, days: 3 });
    for (let i = 0; i < 5; i++) endDay(b.st);
    expect(b.p.status).toBe('sold');
    const rec = b.st.sales![0];
    expect(rec.channel).toBe('auction');
    expect(rec.fee).toBeCloseTo(rec.price * 0.08, 1);
    expect(rec.profit).toBeCloseTo(rec.price - rec.fee - b.p.paid, 1);
    expect(profitAndLoss(b.st, 1, b.st.day).byCat.fees).toBeLessThan(0);
    // pricing: a cheap storefront item moves faster than an overpriced one
    expect(dailySaleChance('storefront', 0.8)).toBeGreaterThan(dailySaleChance('storefront', 1.4));
    expect(dailySaleChance('buy-now', 1)).toBeGreaterThan(dailySaleChance('storefront', 1));
  });
});
