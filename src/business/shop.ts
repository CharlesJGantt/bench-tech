/**
 * The repair business: cash ledger, supplies, parts stock, supplier orders, bills,
 * advertising, the customer queue, warranty returns, and the broken-device marketplace
 * with flip projects and salvage. Pure state + functions (no DOM); persisted as JSON.
 */
import type { DeviceDef } from '../sim/board';
import { DEVICE_LIST, DEVICES } from '../sim/devices';
import { cloneBoard, functionalTest, type BoardState } from '../sim/circuit';
import { generateJob, Rng, type Job, type Tier } from '../sim/faults';
import { part, PARTS } from '../sim/parts';
import { loadJob, saveJob, type SavedJob } from '../sim/persist';
import { removePart } from '../sim/repair';
import { spreadCorrosion } from '../sim/corrosion';
import {
  ADS,
  delivery,
  ELECTRICITY,
  NOT_SOLD,
  RENT,
  RUSH_MARKUP,
  RUSH_MIN,
  SPECIAL_ORDER_COST,
  STARTING_STOCK,
  STARTER_PACK,
  STARTING_TOOLS,
  SUPPLIES,
  tool,
  TRENDS,
  type AdTier,
  type DeliveryId,
  type SupplyId,
} from './economy';

export type LedgerCat = 'repair' | 'sale' | 'parts' | 'supplies' | 'rent' | 'electricity' | 'advertising' | 'purchase' | 'refund';

export interface LedgerEntry {
  day: number;
  cat: LedgerCat;
  /** Positive = money in, negative = money out. */
  amount: number;
  text: string;
}

export interface StockLevel {
  new: number;
  /** Salvaged from donor boards. */
  used: number;
}

export interface OrderLine {
  kind: 'part' | 'supply';
  id: string;
  qty: number;
}

export interface Order {
  id: number;
  placed: number;
  arrives: number;
  lines: OrderLine[];
  cost: number;
  speed?: DeliveryId;
}

export interface Listing {
  id: number;
  /** Device id (see DEVICES). */
  device: string;
  /** Sold as a non-working donor: cheap, goes straight to the store-room. */
  partsOnly?: boolean;
  /** Online seller: ships in this many days (local listings are picked up today). */
  ships?: number;
  title: string;
  price: number;
  desc: string;
  seed: number;
  missing: number;
  unrepairable: boolean;
  expires: number;
}

/** 'donor' = kept in the store-room to pull parts from. */
export type ProjectStatus = 'owned' | 'listed' | 'sold' | 'scrapped' | 'donor';

export interface Project {
  id: number;
  title: string;
  paid: number;
  status: ProjectStatus;
  salePrice?: number;
  sellsOn?: number;
  /** Hidden workmanship issues when listed → the buyer may complain. */
  hiddenIssues?: number;
  /** Bought online and still in the post: arrives this morning. */
  arrives?: number;
  job: SavedJob;
}

export interface QueuedJob {
  id: number;
  kind: 'customer' | 'warranty';
  customer: string;
  complaint: string;
  quote: number;
  arrived: number;
  /** The customer agreed to wait (for parts or a donor board) until this day. */
  hold?: { reason: 'parts' | 'donor'; until: number; note: string };
  /** Extra charges the customer agreed to (next-day shipping), already in `quote`. */
  extraFee?: number;
  /** The walkthrough's scripted job. */
  tutorial?: boolean;
  job: SavedJob;
}

/** A customer job already handed back: shown as a finished row, with no Start button. */
export interface ReturnedJob {
  id: number;
  kind: 'customer' | 'warranty';
  customer: string;
  device: string;
  quote: number;
  outcome: 'fixed' | 'comeback' | 'not-fixed' | 'gave-up';
  paid: number;
}

export interface ActiveWork {
  kind: 'customer' | 'warranty' | 'project';
  id: number;
}

export interface ShopState {
  version: 2;
  day: number;
  cash: number;
  reputation: number;
  jobsDone: number;
  comebacks: number;
  ads: AdTier['id'];
  supplies: Record<SupplyId, number>;
  /** Tools owned (iron tips, hot-air nozzles). */
  tools: string[];
  /** Wear on the brush currently in use (0..1). */
  brushWear: number;
  /** Saturation of the end of each wick roll (by supply id). */
  wickLoad: Record<string, number>;
  /** Market demand per device id: resale multiplier while a craze lasts. */
  trend: Record<string, { mult: number; until: number; label: string }>;
  /** Day each device was last searched for online (one search per device per day). */
  searched: Record<string, number>;
  /** Last kit chosen at the rework station. */
  kit: { tip: string; nozzle: string; wick: string; flux: string; solder: string; liquid?: string; scrubber?: string };
  /** Wear on the eraser / sponge in use (0..1, by supply id). */
  scrubWear?: Record<string, number>;
  stock: Record<string, StockLevel>;
  orders: Order[];
  ledger: LedgerEntry[];
  market: Listing[];
  projects: Project[];
  queue: QueuedJob[];
  /** Jobs handed back today (shown as completed in the office until the day ends). */
  returned?: ReturnedJob[];
  /** Comebacks that will walk back in on a later day. */
  warrantyPending: { day: number; job: SavedJob; customer: string; homeTest?: { refund: number } }[];
  /** Unhappy flip buyers. */
  refundsPending: { day: number; amount: number; text: string }[];
  active: ActiveWork | null;
  /** Tool use today, for the electricity bill. */
  usage: { heatSeconds: number; powerSeconds: number };
  nextId: number;
  rngSeed: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

function rng(st: ShopState): Rng {
  const r = new Rng(st.rngSeed);
  st.rngSeed = Math.floor(r.next() * 2 ** 31) + 1;
  return r;
}

export function maxTier(reputation: number): Tier {
  return reputation >= 60 ? 3 : reputation >= 15 ? 2 : 1;
}

export function adTier(st: ShopState): AdTier {
  return ADS.find((a) => a.id === st.ads) ?? ADS[0];
}

// ---------------------------------------------------------------------------
// Money
// ---------------------------------------------------------------------------

export function book(st: ShopState, cat: LedgerCat, amount: number, text: string): void {
  amount = round2(amount);
  if (!amount) return;
  st.cash = round2(st.cash + amount);
  st.ledger.push({ day: st.day, cat, amount, text });
  if (st.ledger.length > 400) st.ledger.splice(0, st.ledger.length - 400);
}

/** Income and expenses per category for a range of days (inclusive). */
export function profitAndLoss(st: ShopState, fromDay: number, toDay: number): { byCat: Partial<Record<LedgerCat, number>>; income: number; expenses: number; net: number } {
  const byCat: Partial<Record<LedgerCat, number>> = {};
  let income = 0;
  let expenses = 0;
  for (const e of st.ledger) {
    if (e.day < fromDay || e.day > toDay) continue;
    byCat[e.cat] = round2((byCat[e.cat] ?? 0) + e.amount);
    if (e.amount > 0) income += e.amount;
    else expenses -= e.amount;
  }
  return { byCat, income: round2(income), expenses: round2(expenses), net: round2(income - expenses) };
}

// ---------------------------------------------------------------------------
// Stock & supplies
// ---------------------------------------------------------------------------

export function stockOf(st: ShopState, partNo: string): StockLevel {
  return st.stock[partNo] ?? { new: 0, used: 0 };
}

/** Take one part from stock (new first unless `used` is preferred). */
export function takePart(st: ShopState, partNo: string, prefer: 'new' | 'used' = 'new'): 'new' | 'used' | null {
  const s = (st.stock[partNo] ??= { new: 0, used: 0 });
  const order: ('new' | 'used')[] = prefer === 'new' ? ['new', 'used'] : ['used', 'new'];
  for (const k of order)
    if (s[k] > 0) {
      s[k]--;
      return k;
    }
  return null;
}

export function returnPart(st: ShopState, partNo: string, kind: 'new' | 'used'): void {
  (st.stock[partNo] ??= { new: 0, used: 0 })[kind]++;
}

export function rushPrice(partNo: string): number {
  return round2(Math.max(RUSH_MIN, part(partNo).cost * RUSH_MARKUP));
}

/** Expensive parts (retimers, APUs, screens…) are never on the local store's shelf. */
export function isSpecialOrder(partNo: string): boolean {
  return part(partNo).cost >= SPECIAL_ORDER_COST;
}

export function canRushBuy(partNo: string): boolean {
  return !NOT_SOLD.has(partNo) && !isSpecialOrder(partNo);
}

/** Buy one part from the local store right now. */
export function rushBuy(st: ShopState, partNo: string): boolean {
  if (!canRushBuy(partNo)) return false;
  book(st, 'parts', -rushPrice(partNo), `Rush-bought ${part(partNo).label} locally`);
  (st.stock[partNo] ??= { new: 0, used: 0 }).new++;
  return true;
}

export function useSupply(st: ShopState, id: SupplyId, amount: number): void {
  st.supplies[id] = Math.max(0, round2(st.supplies[id] - amount));
}

export function lowSupplies(st: ShopState): SupplyId[] {
  return (Object.keys(SUPPLIES) as SupplyId[]).filter((id) => SUPPLIES[id].low > 0 && st.supplies[id] <= SUPPLIES[id].low);
}

/** Buy a tool (iron tip, nozzle) outright. */
export function buyTool(st: ShopState, id: string): boolean {
  const t = tool(id);
  if (st.tools.includes(id) || st.cash < t.cost) return false;
  st.tools.push(id);
  book(st, 'supplies', -t.cost, `Bought ${t.name}`);
  return true;
}

/** Fill in fields added after a save was made. */
export function migrateShop(st: ShopState): ShopState {
  const sup = st.supplies as Record<string, number>;
  if ('flux' in sup) {
    sup['flux-noclean'] = (sup['flux-noclean'] ?? 0) + sup.flux;
    delete sup.flux;
  }
  if ('wick' in sup) {
    sup['wick-2'] = (sup['wick-2'] ?? 0) + sup.wick;
    delete sup.wick;
  }
  for (const id of Object.keys(SUPPLIES) as SupplyId[]) if (typeof st.supplies[id] !== 'number') st.supplies[id] = SUPPLIES[id].start;
  st.tools ??= [...STARTING_TOOLS];
  st.brushWear ??= 0;
  if (!st.wickLoad) {
    // Saves from before per-joint wick use lost their roll to a per-second drain: refill it once.
    for (const id of ['wick-1', 'wick-2', 'wick-3'] as SupplyId[]) st.supplies[id] = Math.max(st.supplies[id] ?? 0, SUPPLIES[id].start);
    st.wickLoad = {};
  }
  st.kit ??= { tip: 'tip-conical', nozzle: 'nozzle-5', wick: 'wick-2', flux: 'flux-rosin', solder: 'solder' };
  st.trend ??= {};
  st.searched ??= {};
  for (const l of st.market) l.device ??= 'dl12';
  for (const p of Object.keys(PARTS)) st.stock[p] ??= { new: 0, used: 0 };
  return st;
}

/** Price an order (shipping charged once per order, by delivery service). */
export function orderCost(lines: OrderLine[], speed: DeliveryId = 'standard'): number {
  let cost = 0;
  for (const l of lines) cost += l.kind === 'part' ? part(l.id).cost * l.qty : SUPPLIES[l.id as SupplyId].pack.cost * l.qty;
  return round2(cost + (lines.length ? delivery(speed).cost : 0));
}

/** Place a supplier order; paid now, delivered after the chosen service's lead time. */
export function placeOrder(st: ShopState, lines: OrderLine[], speed: DeliveryId = 'standard'): Order | null {
  lines = lines.filter((l) => l.qty > 0 && !(l.kind === 'part' && NOT_SOLD.has(l.id)));
  if (!lines.length) return null;
  const cost = orderCost(lines, speed);
  const o: Order = { id: st.nextId++, placed: st.day, arrives: st.day + delivery(speed).days, lines, cost, speed };
  st.orders.push(o);
  const desc = lines.map((l) => (l.kind === 'part' ? `${l.qty}× ${part(l.id).label}` : `${l.qty}× ${SUPPLIES[l.id as SupplyId].pack.label} ${SUPPLIES[l.id as SupplyId].name.toLowerCase()}`)).join(', ');
  book(st, lines.every((l) => l.kind === 'supply') ? 'supplies' : 'parts', -cost, `Supplier order #${o.id}: ${desc}`);
  return o;
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

/** Devices the shop is known for at this reputation. */
export function availableDevices(st: ShopState): DeviceDef[] {
  return DEVICE_LIST.filter((d) => d.minReputation <= st.reputation);
}

/** Pick a device: the starter lamp is the most common walk-in; anything in a craze shows up more. */
function pickDevice(st: ShopState, r: Rng): DeviceDef {
  const list = availableDevices(st);
  const w = list.map((d) => (d.id === 'dl12' ? 1.6 : 1) * (st.trend[d.id] ? 1.8 : 1));
  let x = r.next() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < list.length; i++) if ((x -= w[i]) <= 0) return list[i];
  return list[list.length - 1];
}

/** Resale multiplier while a device is in demand. */
export function trendMult(st: ShopState, deviceId: string): number {
  const t = st.trend[deviceId];
  return t && t.until >= st.day ? t.mult : 1;
}

function newCustomer(st: ShopState): QueuedJob {
  const r = rng(st);
  const job = generateJob(pickDevice(st, r), Math.floor(r.next() * 1e9), { maxTier: maxTier(st.reputation) });
  job.quote = Math.round(job.quote * adTier(st).quoteMult);
  return { id: st.nextId++, kind: 'customer', customer: job.customer, complaint: job.complaint, quote: job.quote, arrived: st.day, job: saveJob(job) };
}

/** Turn cold joints into cracked ones — what a comeback looks like a few days later. */
function ageWorkmanship(b: BoardState): void {
  for (const c of Object.values(b.comps))
    for (const [pin, j] of Object.entries(c.joints)) if (j.cold) c.joints[pin] = { r: Infinity, cracked: true };
  b.jumpers = b.jumpers.filter((j) => !j.cold);
}

/**
 * A cartridge handed back without proof it works (no test console): the customer pays now
 * and tries it at home. If it does not boot, they come back tomorrow for 10 % back and a
 * free re-fix.
 */
export function cartHomeFailure(st: ShopState, job: Job): void {
  const paid = job.paid ?? job.quote;
  const refund = Math.round(paid * 10) / 100;
  st.warrantyPending.push({ day: st.day + 1, job: saveJob({ ...job, paid }), customer: job.customer, homeTest: { refund } });
}

/** Record the outcome of a customer or warranty job. */
export function completeCustomerJob(
  st: ShopState,
  job: Job,
  outcome: 'fixed' | 'comeback' | 'not-fixed',
  payout: number,
  reputation: number,
): void {
  if (payout) book(st, 'repair', payout, `${job.kind === 'warranty' ? 'Warranty' : 'Repair'} for ${job.customer}`);
  st.reputation = Math.max(0, st.reputation + reputation);
  st.jobsDone++;
  if (outcome === 'comeback') {
    st.comebacks++;
    const r = rng(st);
    st.warrantyPending.push({ day: st.day + r.int(2, 4), job: saveJob(job), customer: job.customer });
  }
  st.active = null;
}

// ---------------------------------------------------------------------------
// Marketplace & projects
// ---------------------------------------------------------------------------

const SELLER_LINES = [
  'Selling as-is for parts or repair.',
  'Untested, sold as seen.',
  'My kid knocked it off the desk.',
  'Clearing out the garage.',
  'Was working last year, now not.',
];

const PARTS_ONLY_LINES = [
  'For parts only. Board will not power on, no returns.',
  'Water damaged, spares or repair.',
  'Dropped and dead. Selling for parts.',
  'Shop clear-out: untested boards, sold as donors.',
];

function newListing(st: ShopState): Listing {
  const r = rng(st);
  const dev = pickDevice(st, r);
  const seed = Math.floor(r.next() * 1e9);
  const partsOnly = r.next() < 0.22;
  const missing = r.next() < (partsOnly ? 0.5 : 0.3) ? r.int(1, 3) : 0;
  const unrepairable = r.next() < (partsOnly ? 0.45 : 0.08);
  const preview = generateJob(dev, seed, { maxTier: maxTier(st.reputation), missingParts: missing, unrepairable, kind: 'project' });
  const honest = r.next() < 0.6;
  const hype = trendMult(st, dev.id);
  const value = dev.marketValue * (1 + (hype - 1) * 0.5);
  if (partsOnly) {
    const price = Math.max(5, Math.round(value * r.range(0.12, 0.2) - missing * 2));
    const desc = `${r.pick(PARTS_ONLY_LINES)}${missing ? ' A few parts already pulled.' : ''}`;
    return { id: st.nextId++, device: dev.id, partsOnly, title: `${dev.name} — for parts`, price, desc, seed, missing, unrepairable, expires: st.day + r.int(2, 4) };
  }
  let desc = `${r.pick(SELLER_LINES)} "${preview.complaint}"`;
  if (missing && honest) desc += ' Someone took a few bits off the board.';
  if (unrepairable && honest) desc += ' Smelled a bit burnt.';
  if (preview.previousRepair === 'Yes' && honest) desc += ' Somebody had a go at fixing it.';
  const price = Math.max(8, Math.round(value * r.range(0.26, 0.5) - missing * 4 - (honest && unrepairable ? value * 0.08 : 0)));
  return { id: st.nextId++, device: dev.id, title: `${dev.name} — broken`, price, desc, seed, missing, unrepairable, expires: st.day + r.int(2, 4) };
}

export function buyListing(st: ShopState, listingId: number): Project | null {
  const l = st.market.find((x) => x.id === listingId);
  if (!l) return null;
  const dev = DEVICES[l.device] ?? DEVICES.dl12;
  st.market = st.market.filter((x) => x !== l);
  const job = generateJob(dev, l.seed, { maxTier: maxTier(st.reputation), missingParts: l.missing, unrepairable: l.unrepairable, kind: 'project' });
  job.customer = 'Your shop';
  job.quote = 0;
  const p: Project = {
    id: st.nextId++,
    title: `${dev.name} (${l.partsOnly ? 'donor, ' : ''}bought day ${st.day})`,
    paid: l.price,
    status: l.partsOnly ? 'donor' : 'owned',
    arrives: l.ships ? st.day + l.ships : undefined,
    job: saveJob(job),
  };
  st.projects.push(p);
  book(st, 'purchase', -l.price, `Bought a ${l.partsOnly ? 'parts-only' : 'broken'} ${dev.name} online`);
  return p;
}

/** Value a working unit would fetch, docked for workmanship you can see, boosted while the device is in demand. */
export function resaleValue(board: BoardState, st?: ShopState): number {
  const base = board.device.marketValue;
  const cosmetic = Object.values(board.comps).filter((c) => c.marks.includes('rework-residue') || c.marks.includes('scorch')).length;
  return round2(base * Math.max(0.6, 1 - cosmetic * 0.04) * (st ? trendMult(st, board.device.id) : 1));
}

/** Put a project on the store-room shelf as a parts donor. */
export function storeProject(st: ShopState, projectId: number, job: Job): boolean {
  const p = st.projects.find((x) => x.id === projectId);
  if (!p || p.status === 'sold' || p.status === 'listed') return false;
  p.status = 'donor';
  p.job = saveJob(job);
  if (st.active?.kind === 'project' && st.active.id === projectId) st.active = null;
  return true;
}

/** Still in the post? */
export function inTransit(st: ShopState, p: Project): boolean {
  return (p.arrives ?? 0) > st.day;
}

/** Donor boards in the store-room (and on their way). */
export function donors(st: ShopState): Project[] {
  return st.projects.filter((p) => p.status === 'donor');
}

const ONLINE_SELLERS = ['parts_hoarder_92', 'RefurbDepot', 'BoardBarn', 'gadgetgraveyard', 'SpareTech Outlet'];

/**
 * Search online sellers for a specific device — usually a donor for one expensive part.
 * Results ship in a few days and cost a bit more than local pick-ups.
 */
export function searchOnline(st: ShopState, deviceId: string): Listing[] {
  const dev = DEVICES[deviceId];
  if (!dev || st.searched[deviceId] === st.day) return [];
  st.searched[deviceId] = st.day;
  const r = rng(st);
  const found: Listing[] = [];
  const n = r.int(1, 3);
  for (let i = 0; i < n; i++) {
    const partsOnly = r.next() < 0.7;
    const seed = Math.floor(r.next() * 1e9);
    const ships = r.int(1, 4);
    const missing = r.next() < 0.3 ? r.int(1, 2) : 0;
    const unrepairable = partsOnly && r.next() < 0.5;
    const value = dev.marketValue * (1 + (trendMult(st, dev.id) - 1) * 0.5);
    const price = Math.round(value * (partsOnly ? r.range(0.15, 0.25) : r.range(0.35, 0.55)) + 6);
    found.push({
      id: st.nextId++,
      device: dev.id,
      partsOnly,
      ships,
      title: `${dev.name} — ${partsOnly ? 'for parts' : 'broken'} (online)`,
      price,
      desc: `${r.pick(ONLINE_SELLERS)}: ${partsOnly ? r.pick(PARTS_ONLY_LINES) : r.pick(SELLER_LINES)} Ships in ${ships} day${ships === 1 ? '' : 's'}, postage included.`,
      seed,
      missing,
      unrepairable,
      expires: st.day + 2,
    });
  }
  st.market.push(...found);
  return found;
}

// ---------------------------------------------------------------------------
// Talking to the customer
// ---------------------------------------------------------------------------

/** Next-day shipping plus a handling charge, passed on to the customer. */
export function expressFee(): number {
  return delivery('express').cost + 10;
}

/** What you would offer a customer for their dead device, as spares. */
export function buyoutOffer(dev: DeviceDef, pct: number): number {
  return Math.max(3, Math.round(dev.marketValue * pct));
}

export type CustomerAsk = 'express' | 'wait-parts' | 'wait-donor' | 'buyout';

/**
 * Ask the customer something. They may say no. On yes:
 * - express: the next-day fee is added to their bill and the job waits for the delivery.
 * - wait-parts / wait-donor: they agree to wait (no walking out) until the given day.
 * - buyout: you pay them `pct` of the device's value and keep the board as a donor.
 */
export function askCustomer(
  st: ShopState,
  queueId: number,
  job: Job,
  ask: CustomerAsk,
  opts: { pct?: number; until?: number } = {},
): { yes: boolean; text: string } {
  const q = st.queue.find((x) => x.id === queueId);
  if (!q) return { yes: false, text: 'That customer is not in your queue.' };
  const r = rng(st);
  const who = q.customer.split(' ')[0];
  switch (ask) {
    case 'express': {
      const fee = expressFee();
      const p = Math.max(0.25, Math.min(0.95, 1.05 - (fee / Math.max(20, q.quote)) * 1.4));
      if (r.next() > p) return { yes: false, text: `${who}: "$${fee} extra just for shipping? No thanks — I'll wait for the normal delivery."` };
      q.extraFee = (q.extraFee ?? 0) + fee;
      q.quote += fee;
      job.quote += fee;
      q.hold = { reason: 'parts', until: (opts.until ?? st.day + 1) + 1, note: 'Next-day part on order' };
      return { yes: true, text: `${who}: "Fine, add the $${fee} — I need it back quickly."` };
    }
    case 'wait-parts': {
      const until = (opts.until ?? st.day + 2) + 1;
      const days = until - st.day;
      if (days > 4 && r.next() < 0.4) return { yes: false, text: `${who}: "${days} days? That is too long, I need it sooner."` };
      q.hold = { reason: 'parts', until, note: 'Waiting for a part' };
      return { yes: true, text: `${who}: "OK, call me when the part is in."` };
    }
    case 'wait-donor': {
      if (r.next() < 0.25) return { yes: false, text: `${who}: "I can't wait around for a maybe. Just do what you can with it."` };
      const until = st.day + 6;
      q.hold = { reason: 'donor', until, note: 'Waiting for a donor board' };
      return { yes: true, text: `${who}: "Sure, I'm in no hurry. Let me know — I'll check back by day ${until}."` };
    }
    case 'buyout': {
      const pct = opts.pct ?? 0.15;
      const offer = buyoutOffer(job.device, pct);
      const p = Math.min(0.92, 0.2 + pct * 3);
      if (r.next() > p) return { yes: false, text: `${who}: "Only $${offer}? I'll keep it, thanks."` };
      book(st, 'purchase', -offer, `Bought ${q.customer}'s dead ${job.device.name} for parts`);
      st.queue = st.queue.filter((x) => x !== q);
      st.projects.push({ id: st.nextId++, title: `${job.device.name} (bought from ${q.customer}, day ${st.day})`, paid: offer, status: 'donor', job: saveJob(job) });
      if (st.active && st.active.kind !== 'project' && st.active.id === queueId) st.active = null;
      return { yes: true, text: `${who}: "$${offer}? Deal — better than throwing it away."` };
    }
  }
}

/** Parts that could be pulled off a donor (anything still on the board except test points and plug-in leads' sockets). */
export function harvestable(job: Job): { ref: string; partNo: string; label: string; cost: number }[] {
  return Object.values(job.board.comps)
    .filter((c) => c.part && c.part.kind !== 'testpoint' && !c.unplugged)
    .map((c) => ({ ref: c.ref, partNo: c.part!.partNo, label: c.part!.label, cost: c.part!.cost }))
    .sort((a, b) => b.cost - a.cost);
}

/**
 * Pull one part off a donor board. You test it once it is off: good parts go into
 * the used bin, dead ones get binned (that is how you find out).
 */
export function harvestPart(st: ShopState, projectId: number, ref: string): { ok: boolean; text: string } {
  const p = st.projects.find((x) => x.id === projectId);
  if (!p || p.status !== 'donor') return { ok: false, text: 'That board is not in the store-room.' };
  if (inTransit(st, p)) return { ok: false, text: `It has not arrived yet — due on day ${p.arrives}.` };
  const job = loadJob(p.job);
  const c = job.board.comps[ref];
  if (!c?.part) return { ok: false, text: `${ref} is already gone.` };
  const sp = c.part;
  const dead = !!c.fault || c.burnt || Object.values(c.joints).some((j) => j.cracked && sp.kind !== 'connector');
  if (sp.plugIn) c.unplugged = true;
  else removePart(job.board, ref, 'good');
  if (sp.plugIn) c.part = null;
  p.job = saveJob(job);
  if (dead) return { ok: false, text: `Pulled ${sp.label} (${ref}) — it tests dead. Binned.` };
  (st.stock[sp.partNo] ??= { new: 0, used: 0 }).used++;
  return { ok: true, text: `Pulled ${sp.label} (${ref}) — tests good. Added to used stock.` };
}

/**
 * List a finished project for sale. It must pass the customer test; hidden workmanship
 * problems are not visible to buyers, but some will come back as refunds.
 */
export function listProject(st: ShopState, projectId: number, job: Job, hiddenIssues: number): { ok: boolean; reason?: string; price?: number } {
  const p = st.projects.find((x) => x.id === projectId);
  if (!p) return { ok: false, reason: 'No such project.' };
  if (!functionalTest(cloneBoard(job.board)).passed) return { ok: false, reason: 'It does not pass a functional test yet — nobody will buy it.' };
  const r = rng(st);
  p.job = saveJob(job);
  p.status = 'listed';
  p.salePrice = resaleValue(job.board, st);
  // Hot items sell overnight.
  p.sellsOn = st.day + (trendMult(st, job.device.id) > 1 ? 1 : r.int(1, 3));
  p.hiddenIssues = hiddenIssues;
  if (st.active?.kind === 'project' && st.active.id === projectId) st.active = null;
  return { ok: true, price: p.salePrice };
}

/** Strip every good part off a board into the used-parts bin. */
export function scrapProject(st: ShopState, projectId: number, job: Job): string[] {
  const p = st.projects.find((x) => x.id === projectId);
  if (!p) return [];
  const salvaged: string[] = [];
  for (const c of Object.values(job.board.comps)) {
    const sp = c.part;
    if (!sp || sp.kind === 'testpoint' || c.fault || c.burnt) continue;
    if (Object.values(c.joints).some((j) => j.cracked)) continue; // damaged during removal attempts
    (st.stock[sp.partNo] ??= { new: 0, used: 0 }).used++;
    salvaged.push(sp.partNo);
  }
  p.status = 'scrapped';
  p.job = saveJob(job);
  if (st.active?.kind === 'project' && st.active.id === projectId) st.active = null;
  return salvaged;
}

// ---------------------------------------------------------------------------
// Days
// ---------------------------------------------------------------------------

export interface DayReport {
  day: number;
  bills: LedgerEntry[];
  deliveries: string[];
  sales: string[];
  refunds: string[];
  walkouts: number;
  newCustomers: number;
  warranty: number;
  /** Market news: crazes starting or fading. */
  trends: string[];
}

/** Close the shop for the night and open the next morning. */
export function endDay(st: ShopState): DayReport {
  const before = st.ledger.length;
  const report: DayReport = { day: st.day, bills: [], deliveries: [], sales: [], refunds: [], walkouts: 0, newCustomers: 0, warranty: 0, trends: [] };

  // Evening bills for today
  const elec = ELECTRICITY.basePerDay + (st.usage.heatSeconds / 60) * ELECTRICITY.perHeatMinute + (st.usage.powerSeconds / 60) * ELECTRICITY.perPowerMinute;
  book(st, 'electricity', -elec, `Electricity, day ${st.day}`);
  const ad = adTier(st);
  if (ad.perDay) book(st, 'advertising', -ad.perDay, `${ad.name}, day ${st.day}`);
  if (st.day % RENT.everyDays === 0) book(st, 'rent', -RENT.amount, `Shop rent (week ${st.day / RENT.everyDays})`);
  report.bills = st.ledger.slice(before);

  // Next morning
  st.day++;
  st.usage = { heatSeconds: 0, powerSeconds: 0 };

  for (const o of st.orders.filter((x) => x.arrives <= st.day)) {
    for (const l of o.lines) {
      if (l.kind === 'part') (st.stock[l.id] ??= { new: 0, used: 0 }).new += l.qty;
      else st.supplies[l.id as SupplyId] = round2(st.supplies[l.id as SupplyId] + SUPPLIES[l.id as SupplyId].pack.qty * l.qty);
    }
    report.deliveries.push(`Order #${o.id} delivered`);
  }
  st.orders = st.orders.filter((x) => x.arrives > st.day);

  const r = rng(st);

  // Market demand: crazes fade, and now and then a new one starts.
  for (const [id, t] of Object.entries(st.trend))
    if (t.until < st.day) {
      delete st.trend[id];
      report.trends.push(`📉 The ${DEVICES[id]?.name ?? id} craze has cooled off — prices are back to normal.`);
    }
  if (!Object.keys(st.trend).length && r.next() < 0.18) {
    const dev = r.pick(availableDevices(st).filter((d) => d.marketValue >= 100).concat(availableDevices(st)));
    const mult = Math.round(r.range(1.3, 1.8) * 100) / 100;
    const label = r.pick(TRENDS);
    st.trend[dev.id] = { mult, until: st.day + r.int(3, 6), label };
    report.trends.push(`📈 ${label}: working ${dev.name} units are selling for ×${mult.toFixed(2)} until day ${st.trend[dev.id].until}.`);
  }

  for (const p of st.projects) {
    if (p.status !== 'listed' || (p.sellsOn ?? Infinity) > st.day) continue;
    p.status = 'sold';
    book(st, 'sale', p.salePrice ?? 0, `Sold ${p.title}`);
    report.sales.push(`${p.title} sold for $${(p.salePrice ?? 0).toFixed(2)}`);
    if ((p.hiddenIssues ?? 0) > 0 && r.next() < 0.6) {
      st.refundsPending.push({ day: st.day + r.int(1, 3), amount: round2((p.salePrice ?? 0) * 0.5), text: `Buyer complaint: ${p.title} failed after a few days` });
    }
  }
  for (const f of st.refundsPending.filter((x) => x.day <= st.day)) {
    book(st, 'refund', -f.amount, f.text);
    st.reputation = Math.max(0, st.reputation - 2);
    report.refunds.push(`${f.text} — refunded $${f.amount.toFixed(2)}`);
  }
  st.refundsPending = st.refundsPending.filter((x) => x.day > st.day);

  // Corrosion keeps eating boards that sit waiting
  for (const q of st.queue) {
    if (!q.job.board.comps || !Object.values(q.job.board.comps).some((c) => c.corr || c.marks.includes('corrosion'))) continue;
    const job = loadJob(q.job);
    spreadCorrosion(job.board);
    q.job = saveJob(job);
  }

  // Yesterday's finished jobs drop off the list
  st.returned = [];

  // Customers who waited too long walk out
  const before2 = st.queue.length;
  const patient = (q: QueuedJob) => (q.hold ? st.day <= q.hold.until : st.day - q.arrived <= 3);
  st.queue = st.queue.filter((q) => q.kind === 'warranty' || patient(q) || (st.active?.kind === 'customer' && st.active.id === q.id));
  report.walkouts = before2 - st.queue.length;
  st.reputation = Math.max(0, st.reputation - report.walkouts);

  for (const w of st.warrantyPending.filter((x) => x.day <= st.day)) {
    const job = loadJob(w.job);
    ageWorkmanship(job.board);
    job.kind = 'warranty';
    job.quote = 0;
    job.complaint = 'You fixed this a few days ago and it has stopped working again.';
    if (w.homeTest) {
      // A cartridge that failed the customer's home test: 10 % back, and you fix it again.
      book(st, 'refund', -w.homeTest.refund, `10% refund to ${w.customer}: the cartridge failed at home`);
      st.reputation = Math.max(0, st.reputation - 1);
      job.complaint = `I tried it at home and it still does not work. (You refunded 10%, $${w.homeTest.refund.toFixed(2)} — please fix it properly this time.)`;
      report.refunds.push(`${w.customer}'s cartridge failed at home — refunded $${w.homeTest.refund.toFixed(2)}; it is back in the queue to fix again`);
    }
    job.previousRepair = 'Yes';
    job.previousRepairNote = 'Your own repair.';
    st.queue.push({ id: st.nextId++, kind: 'warranty', customer: w.customer, complaint: job.complaint, quote: 0, arrived: st.day, job: saveJob(job) });
    report.warranty++;
  }
  st.warrantyPending = st.warrantyPending.filter((x) => x.day > st.day);

  const [lo, hi] = ad.customers;
  const n = Math.min(6 - st.queue.length, r.int(lo, hi) + (st.reputation >= 30 ? 1 : 0));
  for (let i = 0; i < n; i++) st.queue.push(newCustomer(st));
  report.newCustomers = Math.max(0, n);

  st.market = st.market.filter((l) => l.expires >= st.day);
  while (st.market.length < 4) st.market.push(newListing(st));
  return report;
}

export function createShop(seed = 12345): ShopState {
  const stock: Record<string, StockLevel> = {};
  for (const p of Object.keys(PARTS)) stock[p] = { new: (STARTING_STOCK[p] ?? 0) + (STARTER_PACK[p] ?? 0), used: 0 };
  const st: ShopState = {
    version: 2,
    day: 1,
    cash: 150,
    reputation: 0,
    jobsDone: 0,
    comebacks: 0,
    ads: 'none',
    supplies: Object.fromEntries((Object.keys(SUPPLIES) as SupplyId[]).map((id) => [id, SUPPLIES[id].start])) as Record<SupplyId, number>,
    tools: [...STARTING_TOOLS],
    brushWear: 0,
    wickLoad: {},
    kit: { tip: 'tip-conical', nozzle: 'nozzle-5', wick: 'wick-2', flux: 'flux-rosin', solder: 'solder' },
    trend: {},
    searched: {},
    stock,
    orders: [],
    ledger: [],
    market: [],
    projects: [],
    queue: [],
    warrantyPending: [],
    refundsPending: [],
    active: null,
    usage: { heatSeconds: 0, powerSeconds: 0 },
    nextId: 1,
    rngSeed: seed,
  };
  st.queue.push(newCustomer(st), newCustomer(st));
  while (st.market.length < 3) st.market.push(newListing(st));
  return st;
}
