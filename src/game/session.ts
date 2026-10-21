import { DL12 } from '../sim/devices';
import {
  applyStress,
  createBoard,
  cloneBoard,
  functionalTest,
  batteryConnected,
  hasInternalPower,
  hasSparkingBattery,
  measure,
  operatingPoint,
  powerDown,
  steadyTemps,
  AMBIENT,
  type DamageEvent,
  type MeterMode,
  type MeterReading,
  type OperatingPoint,
  type PointRef,
  type PowerConfig,
} from '../sim/circuit';
import { generateJob, jobName, type Job } from '../sim/faults';
import { loadJob, saveJob } from '../sim/persist';
import { part } from '../sim/parts';
import { corrodedRefs, treatCorrosion } from '../sim/corrosion';
import { padBright, SCRUBBERS, scrubPin, syncTarnishMark, type Scrubber } from '../sim/contacts';
import { applyPaste, boardReachable, closeForMe, coolingFor, drillOut, installItem, openForMe, removeItem, spillLiquidMetal, type EnclosureDef, type EnclosureState, type EncResult, type EncTool } from '../sim/enclosure';
import { addJumper, cleanBoard, evaluate, removeJumper, type Evaluation, type SolderQuality } from '../sim/repair';
import { applyRework, type Kit, type ReworkState, type Supplies } from '../rework/model';
import { delivery, FLUX_GRADES, LIQUIDS, USAGE, WICKS, tool, type SupplyId } from '../business/economy';
import {
  completeCustomerJob,
  cartHomeFailure,
  createShop,
  endDay,
  listProject,
  maxTier,
  returnPart,
  takePart,
  scrapProject,
  storeProject,
  migrateShop,
  useSupply,
  askCustomer,
  placeOrder,
  type CustomerAsk,
  type DayReport,
  type ReturnedJob,
  type ShopState,
} from '../business/shop';
import { explainReading } from './explain';
import { scopeAt, type Waveform } from '../sim/scope';

export type PowerMode = 'off' | 'adapter' | 'psu-jack' | 'psu-clips';
/** A big chip shuts itself down above this (°C). */
const THERMAL_TRIP = 95;

export type Tool = 'inspect' | 'probe' | 'iron' | 'jumper' | 'clip' | 'ipa' | 'scope';

export interface LogEntry {
  id: number;
  kind: 'reading' | 'action' | 'event' | 'note';
  text: string;
  detail?: string;
}

/** What happened when a job left the bench (shown in the debrief). */
export type WorkResult =
  | { kind: 'customer'; evaluation: Evaluation; job: Job }
  | { kind: 'listed'; price: number; evaluation: Evaluation; job: Job }
  | { kind: 'scrapped'; salvaged: string[]; job: Job }
  | { kind: 'gave-up'; job: Job };

const SAVE_KEY = 'benchtech.save.v2';
const SETTINGS_KEY = 'benchtech.settings.v1';

function loadSettings(): { guided: boolean } {
  try {
    return { guided: true, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') };
  } catch {
    return { guided: true };
  }
}

function loadShop(): ShopState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const st = JSON.parse(raw) as ShopState;
      if (st.version === 2) return migrateShop(st);
    }
  } catch {
    /* fall through to a new game */
  }
  return createShop(Math.floor(Math.random() * 2 ** 31));
}

type Listener = () => void;

/** An empty, healthy board shown on the bench when no job is active. */
function idleJob(): Job {
  return {
    seed: 0,
    device: DL12,
    board: createBoard(DL12),
    faults: [],
    history: [],
    complaint: '',
    previousRepair: 'No',
    quote: 0,
    customer: '',
    kind: 'customer',
  };
}

/** All game state for the bench and the business. Rendering and UI observe it; nothing here touches PlayCanvas. */
export class Session {
  job: Job = idleJob();
  /** True when nothing is on the bench. */
  idle = true;
  shop: ShopState = loadShop();
  guided: boolean = loadSettings().guided;
  lastResult: WorkResult | null = null;
  lastDay: DayReport | null = null;

  tool: Tool = 'probe';
  powerMode: PowerMode = 'off';
  psu = { v: 12, ilim: 1, red: null as PointRef | null, black: null as PointRef | null };
  meter = { mode: 'dcv' as MeterMode, red: null as PointRef | null, black: null as PointRef | null };
  /** Which probe / clip a left-click places next. */
  activeProbe: 'red' | 'black' = 'red';
  activeClip: 'red' | 'black' = 'red';
  reading: MeterReading | null = null;
  readingNote = '';

  op: OperatingPoint | null = null;
  /** Lagged component temperatures (°C). */
  temps: Record<string, number> = {};
  /** IPA wetness per component, 0..1. */
  wet: Record<string, number> = {};
  /** Components with fresh flux applied (wider soldering window for jumpers). */
  fluxed = new Set<string>();

  selected: string | null = null;
  /** Where the oscilloscope probe sits (ground clip on board ground). */
  scopePoint: PointRef | null = null;
  /** Thermal camera view on. */
  thermal = false;
  jumperStart: PointRef | null = null;
  log: LogEntry[] = [];
  lastEvents: DamageEvent[] = [];

  private logId = 1;
  private listeners = new Set<Listener>();
  private eventListeners = new Set<(e: DamageEvent[]) => void>();

  constructor() {
    if (this.shop.active) this.resumeActive();
    else this.recompute();
    window.addEventListener('beforeunload', () => this.save());
  }

  // ------------------------------------------------------------------ events

  onChange(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  onDamage(fn: (e: DamageEvent[]) => void): void {
    this.eventListeners.add(fn);
  }
  emit(): void {
    for (const fn of this.listeners) fn();
  }

  get board() {
    return this.job.board;
  }

  get maxTier() {
    return maxTier(this.shop.reputation);
  }

  // ------------------------------------------------------------------ saving

  /** Write the job on the bench back into the shop, then persist everything. */
  save(): void {
    const a = this.shop.active;
    if (a && !this.idle) {
      const saved = saveJob(this.job);
      if (a.kind === 'project') {
        const p = this.shop.projects.find((x) => x.id === a.id);
        if (p) p.job = saved;
      } else {
        const q = this.shop.queue.find((x) => x.id === a.id);
        if (q) q.job = saved;
      }
    }
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.shop));
    } catch {
      /* storage unavailable */
    }
  }

  // ------------------------------------------------------------------ work on the bench

  private resetBench(): void {
    this.powerMode = 'off';
    this.psu.red = this.psu.black = null;
    // Both meter leads start off the board (Black → GND clips the black one to ground).
    this.meter.red = null;
    this.meter.black = null;
    this.activeProbe = 'red';
    this.selected = null;
    this.scopePoint = null;
    this.jumperStart = null;
    this.fluxed.clear();
    this.wet = {};
    this.temps = {};
    this.log = [];
  }

  private resumeActive(): void {
    const a = this.shop.active!;
    const saved = a.kind === 'project' ? this.shop.projects.find((x) => x.id === a.id)?.job : this.shop.queue.find((x) => x.id === a.id)?.job;
    if (!saved) {
      this.shop.active = null;
      this.recompute();
      return;
    }
    this.job = loadJob(saved);
    this.idle = false;
    this.resetBench();
    this.addLog('note', `Back to work on ${this.describeJob()}.`);
    this.recompute();
  }

  describeJob(): string {
    const j = this.job;
    return j.kind === 'project' ? `your ${j.device.name}` : `${j.customer}'s ${j.device.name}${j.kind === 'warranty' ? ' (warranty)' : ''}`;
  }

  /** Put a customer job, warranty job or project on the bench (pausing whatever was there). */
  startWork(kind: 'customer' | 'warranty' | 'project', id: number): void {
    if (this.shop.active) this.pauseWork();
    this.shop.active = { kind, id };
    this.lastResult = null;
    this.resumeActive();
    this.save();
  }

  /**
   * Phone the customer whose device is on the bench: ask them to pay for next-day parts,
   * to wait for a part or a donor board, or offer to buy the dead device for parts.
   */
  callCustomer(ask: CustomerAsk, opts: { partNo?: string; pct?: number } = {}): { yes: boolean; text: string } {
    const a = this.shop.active;
    if (!a || a.kind === 'project') return { yes: false, text: 'This is your own project — there is nobody to call.' };
    let res: { yes: boolean; text: string };
    if (ask === 'express' || ask === 'wait-parts') {
      if (!opts.partNo) return { yes: false, text: 'Pick the part you need first.' };
      const speed = ask === 'express' ? 'express' : 'standard';
      res = askCustomer(this.shop, a.id, this.job, ask, { until: this.shop.day + delivery(speed).days });
      if (res.yes) {
        const o = placeOrder(this.shop, [{ kind: 'part', id: opts.partNo, qty: 1 }], speed);
        res.text += o ? ` (Ordered ${part(opts.partNo).label} — arrives ${o.arrives - this.shop.day === 1 ? 'tomorrow morning' : `day ${o.arrives}`}.)` : ' (But the supplier does not sell that part!)';
      }
    } else {
      this.setPowerMode('off');
      res = askCustomer(this.shop, a.id, this.job, ask, { pct: opts.pct });
    }
    this.addLog('note', `📞 ${res.text}`);
    if (res.yes && ask === 'buyout') {
      this.lastResult = null;
      this.clearBench();
    } else this.save();
    this.emit();
    return res;
  }

  /** Add the tutorial's scripted customer (a lamp with a blown fuse) to the front of the queue. */
  addTutorialJob(): number {
    // Reuse one that is still waiting (replaying the tutorial should not stack up lamps).
    const waiting = this.shop.queue.find((q) => q.tutorial);
    if (waiting) return waiting.id;
    const job = generateJob(DL12, 7, { variant: 'fuse-blown' });
    job.customer = 'Robin T.';
    job.complaint = 'It was working last night. This morning it is completely dead — no lights at all.';
    job.previousRepair = 'No';
    job.quote = 35;
    // Robin already took the base cover off (the walkthrough starts at the board).
    if (job.enclosure && DL12.enclosure) openForMe(DL12.enclosure, job.enclosure, job.board);
    const id = this.shop.nextId++;
    this.shop.queue.unshift({ id, kind: 'customer', customer: job.customer, complaint: job.complaint, quote: job.quote, arrived: this.shop.day, tutorial: true, job: saveJob(job) });
    // Make sure there is a spare fuse to fit.
    const f = (this.shop.stock['F-1A'] ??= { new: 0, used: 0 });
    if (f.new + f.used === 0) f.new = 1;
    this.save();
    this.emit();
    return id;
  }

  /** The hold (agreed wait) on the customer job on the bench, if any. */
  get hold() {
    const a = this.shop.active;
    if (!a || a.kind === 'project') return null;
    return this.shop.queue.find((q) => q.id === a.id)?.hold ?? null;
  }

  /** Put the current job aside (state is kept). */
  pauseWork(): void {
    this.setPowerMode('off');
    this.save();
    this.shop.active = null;
    this.job = idleJob();
    this.idle = true;
    this.resetBench();
    this.recompute();
    this.save();
  }

  private clearBench(): void {
    this.shop.active = null;
    this.job = idleJob();
    this.idle = true;
    this.resetBench();
    this.recompute();
    this.save();
  }

  /** Remember a handed-back job so the office can show it as finished today. */
  private noteReturned(id: number | undefined, job: Job, outcome: ReturnedJob['outcome'], paid: number): void {
    if (id === undefined) return;
    (this.shop.returned ??= []).push({ id, kind: job.kind === 'warranty' ? 'warranty' : 'customer', customer: job.customer, device: jobName(job), quote: job.quote, outcome, paid });
  }

  /** Hand a customer / warranty job back. */
  returnToCustomer(): WorkResult {
    this.setPowerMode('off');
    const job = this.job;
    const ev = evaluate(job, this.board, 0);
    let payout = job.kind === 'warranty' ? 0 : ev.payout;
    let rep = job.kind === 'warranty' ? (ev.outcome === 'fixed' ? 1 : ev.reputation) : ev.reputation;
    // Cartridges: the customer pays at pickup and tests at home; a dud comes back tomorrow.
    const homeFail = !!job.device.cartFor && ev.outcome === 'not-fixed';
    if (homeFail) {
      payout = job.kind === 'warranty' ? 0 : job.quote;
      rep = 0;
      job.paid = job.paid ?? job.quote;
    }
    // Note which queue entry this was before completing the job clears `active`.
    const a = this.shop.active;
    completeCustomerJob(this.shop, job, ev.outcome, payout, rep);
    if (homeFail) cartHomeFailure(this.shop, job);
    if (a) this.shop.queue = this.shop.queue.filter((q) => q.id !== a.id);
    this.noteReturned(a?.id, job, homeFail ? 'not-fixed' : ev.outcome, payout);
    this.lastResult = { kind: 'customer', evaluation: { ...ev, payout, reputation: rep }, job };
    this.clearBench();
    return this.lastResult;
  }

  /** Give a customer job back unrepaired. */
  giveUp(): WorkResult {
    const job = this.job;
    this.setPowerMode('off');
    this.shop.reputation = Math.max(0, this.shop.reputation - 2);
    const a = this.shop.active;
    this.shop.queue = this.shop.queue.filter((q) => q.id !== a?.id);
    this.noteReturned(a?.id, job, 'gave-up', 0);
    this.lastResult = { kind: 'gave-up', job };
    this.clearBench();
    return this.lastResult;
  }

  /** List the project on the bench for sale (it must work). */
  listForSale(): { ok: boolean; reason?: string } {
    const a = this.shop.active;
    if (!a || a.kind !== 'project') return { ok: false, reason: 'This is not one of your projects.' };
    this.setPowerMode('off');
    const ev = evaluate(this.job, this.board, 0);
    const res = listProject(this.shop, a.id, this.job, ev.hidden.length);
    if (!res.ok) return res;
    this.lastResult = { kind: 'listed', price: res.price!, evaluation: ev, job: this.job };
    this.clearBench();
    return res;
  }

  /** Give up on the project on the bench and shelve it in the store-room as a parts donor. */
  storeAsDonor(): boolean {
    const a = this.shop.active;
    if (!a || a.kind !== 'project') return false;
    this.setPowerMode('off');
    const ok = storeProject(this.shop, a.id, this.job);
    if (ok) this.clearBench();
    return ok;
  }

  /** Strip the project on the bench for parts. */
  scrapForParts(): string[] {
    const a = this.shop.active;
    if (!a || a.kind !== 'project') return [];
    this.setPowerMode('off');
    const salvaged = scrapProject(this.shop, a.id, this.job);
    this.lastResult = { kind: 'scrapped', salvaged, job: this.job };
    this.clearBench();
    return salvaged;
  }

  endDay(): DayReport {
    if (this.shop.active) this.pauseWork();
    this.lastDay = endDay(this.shop);
    this.save();
    this.emit();
    return this.lastDay;
  }

  newGame(): void {
    this.shop = createShop(Math.floor(Math.random() * 2 ** 31));
    this.clearBench();
    this.emit();
  }

  setGuided(on: boolean): void {
    this.guided = on;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ guided: on }));
    } catch {
      /* ignore */
    }
    this.updateReading(false);
    this.emit();
  }

  addLog(kind: LogEntry['kind'], text: string, detail?: string): void {
    this.log.unshift({ id: this.logId++, kind, text, detail });
    if (this.log.length > 200) this.log.pop();
  }

  // ------------------------------------------------------------------ power

  get power(): PowerConfig {
    if (this.idle) return { kind: 'off' };
    switch (this.powerMode) {
      case 'adapter':
        return { kind: 'adapter' };
      case 'psu-jack':
        return { kind: 'psu-jack', v: this.psu.v, ilim: this.psu.ilim };
      case 'psu-clips':
        return this.psu.red && this.psu.black ? { kind: 'psu-clips', v: this.psu.v, ilim: this.psu.ilim, red: this.psu.red, black: this.psu.black } : { kind: 'off' };
      default:
        return { kind: 'off' };
    }
  }

  setPowerMode(m: PowerMode): void {
    if (m === this.powerMode) return;
    this.powerMode = m;
    if (m === 'off') this.board.mcu.tripped = false;
    const names: Record<PowerMode, string> = { off: 'Power off', adapter: 'Plugged in the 12 V adapter', 'psu-jack': 'Bench PSU connected to the DC jack', 'psu-clips': 'Bench PSU on clip leads' };
    this.addLog('action', names[m]);
    this.recompute();
  }

  setPsu(v: number, ilim: number): void {
    this.psu.v = Math.min(30, Math.max(0, v));
    this.psu.ilim = Math.min(5, Math.max(0.01, ilim));
    if (this.powerMode.startsWith('psu')) this.recompute();
    else this.emit();
  }

  setClip(which: 'red' | 'black', p: PointRef): void {
    this.psu[which] = p;
    this.addLog('action', `PSU ${which} clip on ${p.ref}.${p.pin}`);
    this.recompute();
  }

  /** Press or release a button on the device. On press, returns a plain-language description of what changed. */
  setButton(ref: string, down: boolean): string | null {
    const b = this.board;
    if (b.pressed.includes(ref) === down) return null;
    const before = this.statusText();
    b.pressed = down ? [...b.pressed, ref] : b.pressed.filter((r) => r !== ref);
    this.recompute();
    if (!down) return null;
    const label = b.device.controls.find((c) => c.ref === ref)?.label ?? ref;
    let result: string;
    if (!this.op) result = 'nothing happens — the board has no power. Plug something in first.';
    else {
      const after = this.statusText();
      const changed = after.filter((line, i) => line !== before[i]);
      if (changed.length) result = changed.join('; ') + '.';
      else if (b.device.firmware && !b.mcu.running) result = 'nothing happens (is the controller running?).';
      else result = 'nothing changes.';
    }
    this.addLog('action', `Pressed ${label}: ${result}`);
    this.emit();
    return result;
  }

  /** Hook up / unhook external equipment (e.g. a TV on the HDMI port). */
  toggleAttach(id: string): void {
    const b = this.board;
    const ext = b.device.externals?.find((x) => x.id === id);
    if (!ext) return;
    const on = !b.attached.includes(id);
    b.attached = on ? [...b.attached, id] : b.attached.filter((x) => x !== id);
    this.addLog('action', `${on ? 'Connected' : 'Disconnected'}: ${ext.label}`);
    this.recompute();
  }

  /** Unplug or re-seat a plug-in module (battery, screen, speaker, LED strip). */
  setPlugged(ref: string, plugged: boolean): void {
    const c = this.board.comps[ref];
    if (!c?.part?.plugIn) return;
    this.setPowerMode('off');
    c.unplugged = !plugged;
    this.addLog('action', `${plugged ? 'Plugged in' : 'Unplugged'} ${ref} (${c.part.label}).`);
    this.recompute();
    this.save();
  }

  /** Swap a plug-in module for one from stock. A healthy old module goes into the used bin. */
  swapModule(ref: string, prefer: 'new' | 'used'): string | null {
    const c = this.board.comps[ref];
    const spec = part(c.def.partNo);
    if (!spec.plugIn) return null;
    const got = takePart(this.shop, spec.partNo, prefer);
    if (!got) return `No ${spec.label} in stock.`;
    this.setPowerMode('off');
    const old = c.part;
    if (old && !c.fault && !c.burnt && !c.marks.some((m) => m === 'swollen' || m === 'cracked-screen')) returnPart(this.shop, old.partNo, 'used');
    c.part = spec;
    c.fault = null;
    c.burnt = false;
    c.replaced = true;
    c.unplugged = false;
    c.marks = c.marks.filter((m) => m !== 'swollen' && m !== 'cracked-screen');
    for (const pin of Object.keys(c.joints)) c.joints[pin] = { r: 0 };
    const text = `Fitted a ${got} ${spec.label} at ${ref}.`;
    this.addLog('action', text);
    this.recompute();
    this.save();
    return text;
  }

  /** Instruments bought in the office. */
  owns(id: string): boolean {
    return this.shop.tools.includes(id);
  }

  /** What the oscilloscope shows right now. */
  get scope(): Waveform | null {
    return this.scopePoint ? scopeAt(this.board, this.op, this.scopePoint) : null;
  }

  /** Status readouts as text (lamp on, picture, charging…). */
  statusText(): string[] {
    return this.board.device.status(this.board, this.op).map((l) => `${l.label}: ${l.value}`);
  }

  /** Re-solve the board after anything changed. Applies instant (electrical) damage. */
  recompute(): void {
    const power = this.power;
    // No bench power — but a connected battery still runs the board.
    if (power.kind === 'off' && (this.idle || !hasInternalPower(this.board))) {
      powerDown(this.board);
      this.op = null;
    } else {
      let op = operatingPoint(this.board, power);
      const events: DamageEvent[] = [];
      for (let i = 0; i < 6; i++) {
        const ev = applyStress(this.board, op);
        if (!ev.length) break;
        events.push(...ev);
        op = operatingPoint(this.board, power);
      }
      this.op = op;
      if (events.length) this.damage(events);
    }
    this.updateReading(true);
    this.emit();
  }

  private damage(events: DamageEvent[]): void {
    this.lastEvents = events;
    for (const e of events) this.addLog('event', `⚠ ${e.message}`);
    for (const fn of this.eventListeners) fn(events);
  }

  /** Advance time: thermal lag, thermal damage, IPA evaporation, electricity use. */
  tick(dt: number): void {
    if (this.op) this.shop.usage.powerSeconds += dt;
    this.board.cooling = coolingFor(this.encDef, this.enc);
    const target = this.op ? steadyTemps(this.board, this.op) : {};
    const k = 1 - Math.exp(-dt / 1.8);
    let changed = false;
    for (const ref of Object.keys(this.board.comps)) {
      const cur = this.temps[ref] ?? AMBIENT;
      const tgt = target[ref] ?? AMBIENT;
      const next = cur + (tgt - cur) * k;
      if (Math.abs(next - cur) > 0.01) changed = true;
      this.temps[ref] = next;
      const w = this.wet[ref];
      if (w) {
        const rate = 0.025 + Math.max(0, next - 30) * 0.012;
        this.wet[ref] = Math.max(0, w - rate * dt);
      }
    }
    // Thermal protection: a big chip that gets too hot shuts itself down until power is cycled
    const fw = this.board.device.firmware?.ref;
    if (this.op && fw && this.board.mcu.running && this.board.comps[fw]?.part?.heatW && (this.temps[fw] ?? 0) > THERMAL_TRIP) {
      this.board.mcu.tripped = true;
      this.addLog('event', `⚠ ${fw} hit ${Math.round(this.temps[fw])}°C and shut itself down (thermal protection). Is its heatsink on, with good paste — and is the fan running?`);
      this.recompute();
      return;
    }
    if (this.op) {
      const ev = applyStress(this.board, this.op, this.temps);
      if (ev.length) {
        this.damage(ev);
        this.recompute();
        return;
      }
    }
    if (changed) this.emit();
  }

  // ------------------------------------------------------------------ meter

  setMeterMode(m: MeterMode): void {
    this.meter.mode = m;
    this.updateReading(true);
    this.emit();
  }

  setProbe(which: 'red' | 'black', p: PointRef | null): void {
    this.meter[which] = p;
    this.updateReading(true);
    this.emit();
  }

  private lastLogged = '';

  updateReading(log: boolean): void {
    const { red, black, mode } = this.meter;
    if (!red || !black || this.idle) {
      this.reading = null;
      this.readingNote = '';
      return;
    }
    const power = this.power;
    this.reading = measure(this.board, power, mode, red, black, this.op ?? undefined);
    this.readingNote = this.guided ? explainReading(this, this.reading, red, black) : '';
    const key = `${mode}|${red.ref}.${red.pin}|${black.ref}.${black.pin}|${this.reading.display}|${power.kind}`;
    if (log && key !== this.lastLogged) {
      this.lastLogged = key;
      const modeName = { dcv: 'DCV', ohm: 'Ω', continuity: 'Cont', diode: 'Diode', esr: 'ESR' }[mode];
      const pw = power.kind === 'off' ? 'unpowered' : 'powered';
      this.addLog('reading', `${modeName}  ${pointLabel(this, red)} → ${pointLabel(this, black)}:  ${this.reading.display} ${this.reading.display === 'OL' ? '' : this.reading.unit}`, pw);
    }
  }

  // ------------------------------------------------------------------ repairs

  /** Supplies available to the rework station. */
  get supplies(): Supplies {
    return { ...this.shop.supplies };
  }

  /** The kit currently selected for the rework station. */
  // ---------------------------------------------------------------- the case

  get encDef(): EnclosureDef | undefined {
    return this.idle ? undefined : this.job.device.enclosure;
  }

  /** The case on the job on the bench (old saves have none: treated as open). */
  get enc(): EnclosureState | undefined {
    return this.idle ? undefined : this.job.enclosure;
  }

  /** Can the board be probed / soldered (case off)? */
  get reachable(): boolean {
    return this.idle || boardReachable(this.encDef, this.enc);
  }

  private encDone(r: EncResult): EncResult {
    if (r.text) this.addLog(r.damage ? 'event' : 'action', r.text);
    this.recompute();
    this.save();
    this.emit();
    return r;
  }

  encRemove(id: string, tool: EncTool): EncResult {
    const def = this.encDef;
    const st = this.enc;
    if (!def || !st) return { ok: false, text: 'There is no case on this one.' };
    if (this.powerMode !== 'off') this.setPowerMode('off');
    return this.encDone(removeItem(def, st, this.board, id, tool, { extractor: this.owns('screw-extractor'), gamebit: this.owns('gamebit') }));
  }

  encInstall(id: string, length?: number, spare = false): EncResult {
    const def = this.encDef;
    const st = this.enc;
    if (!def || !st) return { ok: false, text: 'There is no case on this one.' };
    if (spare && this.shop.supplies['spare-screws'] < 1) return { ok: false, text: 'The spare screw box is empty — order more from the office.' };
    const r = installItem(def, st, this.board, id, length, spare);
    if (r.ok && spare) useSupply(this.shop, 'spare-screws', 1);
    return this.encDone(r);
  }

  encPaste(id: string, compound: 'paste' | 'lm' = 'paste'): EncResult {
    const def = this.encDef;
    const st = this.enc;
    if (!def || !st) return { ok: false, text: 'There is no case on this one.' };
    const [sup, amt, name] = compound === 'lm' ? (['liquid-metal', USAGE.lmPerChip, 'liquid metal'] as const) : (['thermal-paste', USAGE.pastePerChip, 'thermal paste'] as const);
    if (this.shop.supplies[sup] < amt) return { ok: false, text: `Out of ${name} — order some from the office.` };
    const r = applyPaste(def, st, id, compound);
    if (r.ok) useSupply(this.shop, sup, amt);
    return this.encDone(r);
  }

  /** Turning the board over: wet liquid metal on a chip runs off and shorts things. */
  onFlip(): string | null {
    const def = this.encDef;
    const st = this.enc;
    if (!def || !st) return null;
    const spill = spillLiquidMetal(def, st, this.board);
    if (spill) this.encDone({ ok: true, text: spill, damage: 'punch' });
    return spill;
  }

  /**
   * Is a battery that can blow parts still connected (the board is live even with the bench
   * power off)? Coin cells don't count: they can't push enough current to hurt anything.
   */
  get batteryLive(): boolean {
    return !this.idle && hasSparkingBattery(this.board);
  }

  /** The live battery is soldered in (no plug): the way to disconnect it is to desolder a tab. */
  get batterySoldered(): boolean {
    return Object.values(this.board.comps).some((c) => batteryConnected(this.board, c) && !c.part!.plugIn && c.part!.pkg !== 'COIN');
  }

  /**
   * Soldering on a board with its battery connected: the iron or tweezers can bridge a live
   * pad to ground. Returns what happened (null = got away with it). Working on the battery's
   * own tabs is how a soldered battery comes off, so that never sparks.
   */
  batterySpark(ref: string | null, rand = Math.random): string | null {
    const c = ref ? this.board.comps[ref] : null;
    if (c?.part?.kind === 'battery') return null;
    if (!this.batteryLive || rand() > 0.35) return null;
    let text: string;
    if (c?.part && ['resistor', 'capacitor', 'fuse', 'inductor', 'diode'].includes(c.part.kind)) {
      c.fault = { type: 'open' };
      if (!c.marks.includes('scorch')) c.marks.push('scorch');
      text = `⚡ Spark! The battery was still connected — the tweezers shorted a live pad and ${c.ref} blew open. Unplug the battery before soldering.`;
    } else {
      if (c && !c.marks.includes('scorch')) c.marks.push('scorch');
      text = '⚡ Spark! The battery was still connected and the tip touched a live pad. Nothing seems dead this time — unplug the battery before soldering.';
    }
    this.addLog('event', text);
    this.recompute();
    this.save();
    this.emit();
    return text;
  }

  encDrill(id: string): EncResult {
    const st = this.enc;
    if (!st) return { ok: false, text: 'There is no case on this one.' };
    if (!this.owns('micro-drill')) return { ok: false, text: 'You need a micro drill for that — the office sells one (Tools tab).' };
    if (!st.removed.includes(id)) return { ok: false, text: 'Take that long screw out first (screwdriver), then drill out the damaged via.' };
    return this.encDone(drillOut(st, this.board, id));
  }

  /** Guided: open it the right way. */
  encOpenForMe(): string[] {
    const def = this.encDef;
    const st = this.enc;
    if (!def || !st) return [];
    if (this.powerMode !== 'off') this.setPowerMode('off');
    const before = st.removed.length;
    const log = openForMe(def, st, this.board, { extractor: this.owns('screw-extractor'), gamebit: this.owns('gamebit') });
    const steps = st.removed.length - before;
    const stuck = !boardReachable(def, st) && log.length ? ` Stopped: ${log[log.length - 1]}` : '';
    this.encDone({ ok: true, text: log.length ? `Opened it up: ${steps} step${steps === 1 ? '' : 's'}.${stuck}` : '' });
    return log;
  }

  /** Guided: close it up, re-pasting heatsinks and matching screws. */
  encCloseForMe(): string[] {
    const def = this.encDef;
    const st = this.enc;
    if (!def || !st) return [];
    const sinks = def.items.filter((i) => i.kind === 'heatsink' && st.removed.includes(i.id) && !st.paste[i.id]);
    const lm = sinks.filter((i) => i.lm).length;
    const paste = sinks.length - lm;
    if (lm && this.shop.supplies['liquid-metal'] < lm * USAGE.lmPerChip) return ['This chip uses liquid metal and you have none — order some (or re-paste it yourself with ordinary paste) before closing it up.'];
    if (paste && this.shop.supplies['thermal-paste'] < paste * USAGE.pastePerChip) return ['Out of thermal paste — order a syringe before closing it up.'];
    if (lm) useSupply(this.shop, 'liquid-metal', lm * USAGE.lmPerChip);
    if (paste) useSupply(this.shop, 'thermal-paste', paste * USAGE.pastePerChip);
    const log = closeForMe(def, st, this.board, Math.floor(this.shop.supplies['spare-screws']));
    if (log.sparesUsed) useSupply(this.shop, 'spare-screws', log.sparesUsed);
    this.encDone({ ok: true, text: log.length ? `Closed it up: ${log.length} step${log.length === 1 ? '' : 's'}.` : '' });
    return log;
  }

  // ---------------------------------------------------------------- test station

  /**
   * Run the cartridge on the bench in a known-good test console (needs one on the shelf):
   * what does the TV show? Recorded on the job.
   */
  stationTest(): { boots: boolean; rom: boolean; lockout: boolean; saveOk: boolean } {
    const r = functionalTest(cloneBoard(this.board));
    const f = r.facts as Record<string, boolean>;
    const res = { boots: !!f.boots, rom: !!f.rom, lockout: !!f.lockout, saveOk: f.saveOk !== false };
    const passed = res.boots && res.saveOk;
    this.job.stationTest = { day: this.shop.day, passed };
    this.addLog('action', `📺 Test Station: ${passed ? 'title screen, saves kept — it works.' : res.boots ? 'boots, but loses its saves.' : res.lockout ? 'grey screen.' : 'black screen, blinking light.'}`);
    this.save();
    this.emit();
    return res;
  }

  // ---------------------------------------------------------------- contact cleaning

  get scrubber(): Scrubber {
    return this.shop.kit.scrubber === 'magic-sponge' ? 'magic-sponge' : 'pink-eraser';
  }

  setScrubber(id: Scrubber): void {
    this.shop.kit.scrubber = id;
    this.save();
    this.emit();
  }

  /**
   * Scrub one contact with the selected eraser / sponge (`mm` of stroke). Wears the scrubber
   * and takes a new one from stock when it is used up. Returns false when none are left.
   */
  scrubContact(ref: string, pin: string, mm: number): boolean {
    const tool = this.scrubber;
    const wear = (this.shop.scrubWear ??= {});
    if ((wear[tool] ?? 0) === 0 && this.shop.supplies[tool] < 1) return false;
    if ((wear[tool] ?? 0) === 0) {
      useSupply(this.shop, tool, 1);
      wear[tool] = 1e-6;
    }
    const c = this.board.comps[ref];
    scrubPin(c, pin, mm, tool);
    wear[tool] += mm / SCRUBBERS[tool].lifeMm;
    if (wear[tool] >= 1) {
      wear[tool] = 0;
      this.addLog('note', `The ${SCRUBBERS[tool].name} is worn down to a nub — binned it.`);
    }
    syncTarnishMark(c);
    this.recompute();
    return true;
  }

  /** Pad-Bright on one contact. */
  padBrightContact(ref: string, pin: string): 'bright' | 'softened' | 'empty' {
    if (this.shop.supplies['pad-bright'] < USAGE.padBrightPerPin) return 'empty';
    useSupply(this.shop, 'pad-bright', USAGE.padBrightPerPin);
    const c = this.board.comps[ref];
    const r = padBright(c, pin);
    syncTarnishMark(c);
    this.recompute();
    return r;
  }

  /** Leaving the contact-cleaning view: save and log. */
  doneContacts(ref: string, summary: string): void {
    if (summary) this.addLog('action', `${ref}: ${summary}`);
    this.save();
    this.emit();
  }

  get kit(): Kit {
    const k = this.shop.kit;
    const tip = tool(k.tip);
    const nozzle = tool(k.nozzle);
    return {
      tip: { heat: tip.heat, radius: tip.radius, name: tip.name },
      nozzle: { heat: nozzle.heat, radius: nozzle.radius, name: nozzle.name },
      wick: WICKS[k.wick as keyof typeof WICKS] ?? WICKS['wick-2'],
      flux: (k.flux in FLUX_GRADES ? k.flux : 'flux-rosin') as Kit['flux'],
      solder: k.solder === 'lowmelt' ? 'lowmelt' : 'solder',
      liquid: (LIQUIDS as readonly string[]).includes(k.liquid ?? '') ? (k.liquid as Kit['liquid']) : 'ipa',
      brushWear: this.shop.brushWear,
      wickLoad: this.shop.wickLoad[k.wick] ?? 0,
    };
  }

  /** Charge the consumables a rework session used, and remember brush wear. */
  private consume(st: ReworkState): void {
    for (const [id, amount] of Object.entries(st.used)) {
      if (id === 'heatSeconds') this.shop.usage.heatSeconds += amount;
      else useSupply(this.shop, id as SupplyId, amount);
    }
    // A part-used wipe still goes in the bin.
    if (st.wipeLoad > 0) useSupply(this.shop, 'wipes', 1);
    this.shop.brushWear = st.kit.brushWear;
    this.shop.wickLoad[st.kit.wick.supply] = st.kit.wickLoad;
  }

  private afterRepair(msg: string): void {
    this.addLog('action', msg);
    this.recompute();
    this.save();
  }

  /** Apply a finished rework-station session: consumables are deducted, parts were taken from stock. */
  doRework(st: ReworkState): string {
    this.consume(st);
    // Salvage: a healthy part that came off in one piece goes in the used-parts bin.
    const before = this.board.comps[st.ref];
    let salvaged = '';
    if (st.removed && !st.removed.melted && !before.fault && !before.burnt && before.part?.partNo === st.removed.spec.partNo) {
      returnPart(this.shop, st.removed.spec.partNo, 'used');
      salvaged = ` Saved the old ${st.removed.spec.label} to the spares bin.`;
    }
    const msg = applyRework(this.board, st) + salvaged;
    this.fluxed.delete(st.ref);
    this.afterRepair(msg);
    return msg;
  }

  /** A rework session was cancelled: put untouched parts back in stock, but consumables are still used. */
  cancelRework(st: ReworkState, taken: { partNo: string; kind: 'new' | 'used' }[]): void {
    this.consume(st);
    for (const t of taken) returnPart(this.shop, t.partNo, t.kind);
    this.save();
    this.emit();
  }

  doJumper(a: PointRef, b: PointRef, q: SolderQuality): string {
    useSupply(this.shop, 'solder', 0.4);
    const msg = addJumper(this.board, a, b, q);
    this.afterRepair(msg);
    return msg;
  }

  doRemoveJumper(id: number): void {
    removeJumper(this.board, id);
    this.afterRepair(`Removed jumper ${id}`);
  }

  /**
   * Flood the whole board with the kit's cleaning liquid. IPA / flux remover clean flux;
   * corrosion cleaner (then an IPA rinse) takes off most of the crust each pass.
   */
  cleanWithIpa(): { ok: boolean; text: string } {
    const liquid = this.kit.liquid;
    const sup = this.shop.supplies;
    if (liquid === 'corrosion-cleaner') {
      if (sup['corrosion-cleaner'] < USAGE.ipaFlood) return { ok: false, text: 'Not enough corrosion cleaner left — order more from the office.' };
      if (sup.ipa < USAGE.ipaFlood) return { ok: false, text: 'You need IPA to rinse the cleaner off afterwards — order more from the office.' };
      useSupply(this.shop, 'corrosion-cleaner', USAGE.ipaFlood);
      useSupply(this.shop, 'ipa', USAGE.ipaFlood);
      this.shop.brushWear = Math.min(1, this.shop.brushWear + 0.05);
      const refs = treatCorrosion(this.board, 0.7);
      for (const ref of Object.keys(this.board.comps)) this.wet[ref] = 1;
      const left = corrodedRefs(this.board);
      const text = !refs.length
        ? 'Flooded the board with corrosion cleaner — it did not fizz anywhere: there is no corrosion.'
        : `Cleaner fizzed on ${refs.join(', ')}; scrubbed and rinsed with IPA.${left.length ? ` Still some crust on ${left.join(', ')} — another pass, or finish it under the microscope.` : ' The pads look clean.'}`;
      this.addLog('action', text);
      this.save();
      this.emit();
      return { ok: true, text };
    }
    if (sup[liquid] < USAGE.ipaFlood) return { ok: false, text: `Not enough ${liquid === 'ipa' ? 'IPA' : 'flux remover'} left — order more from the office.` };
    useSupply(this.shop, liquid, USAGE.ipaFlood);
    cleanBoard(this.board);
    for (const ref of Object.keys(this.board.comps)) this.wet[ref] = 1;
    const text = liquid === 'ipa' ? 'Flooded the board with IPA and scrubbed off the flux.' : 'Flooded the board with flux remover — even the old baked-on flux came off.';
    this.addLog('action', text);
    this.save();
    this.emit();
    return { ok: true, text };
  }
}

export function pointLabel(s: Session, p: PointRef): string {
  const c = s.board.comps[p.ref];
  if (c.def.partNo === 'TP') return p.ref;
  return `${p.ref}.${p.pin}`;
}

export function netOf(s: Session, p: PointRef): string {
  return s.board.comps[p.ref].def.pins[p.pin];
}
