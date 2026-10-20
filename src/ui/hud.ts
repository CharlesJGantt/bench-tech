import type { MeterMode, PointRef } from '../sim/circuit';
import { part } from '../sim/parts';
import type { SolderQuality } from '../sim/repair';
import { pointLabel, type PowerMode, type Session, type Tool } from '../game/session';
import type { BenchScene, BoardHit } from '../render/scene';
import { beep, pop, sizzle } from './audio';
import { schematicHtml } from './schematic';
import { ReworkStation } from './rework';
import { TeardownStation } from './teardown';
import { ContactStation } from './contacts';
import { TestStation } from './teststation';
import { jobName } from '../sim/faults';
import { scrubbable } from '../sim/contacts';
import { assembled } from '../sim/enclosure';
import { Tutorial } from './tutorial';
import { cartLines, officeHtml, type Cart, type OfficeTab } from './office';
import { buyListing, buyoutOffer, buyTool, expressFee, harvestPart, inTransit, placeOrder, searchOnline, stockOf, storeProject, trendMult, type CustomerAsk } from '../business/shop';
import { loadJob } from '../sim/persist';
import { ADS, NOT_SOLD, type DeliveryId } from '../business/economy';

const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector(sel) as T;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

const TOOLS: { id: Tool; key: string; name: string; hint: string }[] = [
  { id: 'probe', key: '1', name: 'Multimeter', hint: 'Left-click a pad to place the probe shown in the meter panel. Right-click always places the BLACK probe.' },
  { id: 'inspect', key: '2', name: 'Inspect', hint: 'Click a part to look at it closely. Zoom in (mouse wheel) to see small details like cracked joints.' },
  { id: 'iron', key: '3', name: 'Soldering', hint: 'Click a part to reflow it, remove it or fit a new one.' },
  { id: 'jumper', key: '4', name: 'Jumper wire', hint: 'Click two pads to bridge them with a wire (for broken traces and lifted pads).' },
  { id: 'clip', key: '5', name: 'PSU probes', hint: 'Inject voltage straight from the bench supply: left-click places the RED probe, right-click the BLACK. Then set Power to "PSU probes". Tip: 1 V at 1–2 A into a shorted rail makes the shorted part warm up — find it by touch or with a thermal camera.' },
  { id: 'ipa', key: '6', name: 'Liquid', hint: 'Click the board to flood it with the cleaning liquid picked in the rework kit: IPA or flux remover clean flux; corrosion cleaner (rinsed with IPA) eats corrosion crust.' },
  { id: 'scope', key: '7', name: 'Scope', hint: 'Click a pad to see its signal on the oscilloscope (ground clip is on board ground).' },
];

const MARK_TEXT: Record<string, string> = {
  residue: 'Some amber flux residue around it — looks like leftover from the factory.',
  'rework-residue': 'Sticky brown flux around it — someone has soldered here.',
  crooked: 'It sits slightly crooked on its pads.',
  discolored: 'The board around it is slightly discoloured.',
  scorch: 'Burn marks! This area got very hot.',
  scratch: 'Light scratches in the green solder mask nearby.',
  bulged: 'The top of the can is bulging.',
  loose: 'The connector wobbles when you push it.',
  'bent-pin': 'Looking into the socket, the centre pin looks bent and cracked.',
  tarnish: 'The contacts are dull, dark and blotchy — oxidised. Scrub them clean (eraser), then Pad-Bright.',
  corrosion: 'Crusty corrosion (green, white, yellow and dark flecks) on its pads — liquid got in here. Solder will not stick to it: treat it with corrosion cleaner, scrub, rinse with IPA and wipe.',
};

/** `?debug` in the URL shows live net voltages on hover and the hidden fault on the ticket. */
const DEBUG = new URLSearchParams(location.search).has('debug');

export class Hud {
  private scene!: BenchScene;
  private pending = false;
  private toastTimer = 0;
  private soldering = false;
  private station: ReworkStation | null = null;
  private tutorial!: Tutorial;
  private officeTab: OfficeTab = 'work';
  private cart: Cart = {};
  private speed: DeliveryId = 'standard';
  private officeOpen = false;

  constructor(private s: Session) {}

  attach(scene: BenchScene): void {
    this.scene = scene;
    this.buildStatic();
    this.s.onChange(() => this.schedule());
    this.s.onDamage((events) => {
      for (const e of events) {
        if (e.kind === 'fuse' || e.kind === 'pop') pop(e.kind === 'pop' ? 1 : 0.7);
        if (e.kind === 'smoke' || e.kind === 'vent' || e.kind === 'burn') {
          sizzle();
          this.scene.spawnSmoke(e.ref);
        }
        this.toast(`⚠ ${e.message}`, 'bad');
      }
    });
    this.render();
    this.tutorial = new Tutorial(this.s, {
      isSoldering: () => this.soldering,
      openOffice: (tab = 'work') => this.openOffice(tab),
      closeModal: () => this.closeModal(),
      screenOf: (ref, pin) => this.scene.screenOf(ref, pin),
      focusOn: (x, y, d) => this.scene.focusOn(x, y, d),
      focusBoard: () => this.scene.focusBoard(),
      highlight: (pts) => (this.scene.tutorialPads = pts),
      reworkState: () => (this.soldering ? (this.station?.state ?? null) : null),
      reworkTool: () => (this.soldering ? (this.station?.currentTool ?? null) : null),
      reworkPad: (i) => (this.soldering ? (this.station?.padScreen(i) ?? null) : null),
      reworkReveal: (sel) => this.station?.reveal(sel),
    });
    const pending = Tutorial.pending();
    if (pending === 'new') this.tutorial.start();
    else if (pending) this.tutorial.resume(pending);
    else if (this.s.idle) this.openOffice('work');
  }

  private schedule(): void {
    if (this.pending) return;
    this.pending = true;
    // rAF for smoothness, with a timer fallback so the HUD still updates when the tab is in the background.
    const run = () => {
      if (!this.pending) return;
      this.pending = false;
      this.render();
    };
    requestAnimationFrame(run);
    setTimeout(run, 50);
  }

  private set(sel: string, html: string): void {
    const el = $(sel);
    if (el && el.dataset.html !== html) {
      el.dataset.html = html;
      el.innerHTML = html;
    }
  }

  // ------------------------------------------------------------------ static wiring

  private buildStatic(): void {
    const s = this.s;
    this.renderToolbar();
    $('#toolbar').addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest('button');
      if (b?.dataset.tool) this.setTool(b.dataset.tool as Tool);
    });
    window.addEventListener('keydown', (e) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || this.soldering) return;
      const t = TOOLS.find((x) => x.key === e.key);
      if (t && (t.id !== 'scope' || s.owns('oscilloscope'))) this.setTool(t.id);
      if ((e.key === 't' || e.key === 'T') && s.owns('thermal-cam')) this.action('thermal', {});
      if (e.key === 'b' || e.key === 'B') this.flip();
      if (e.key === 'Escape') {
        s.selected = null;
        s.jumperStart = null;
        this.closeModal();
        s.emit();
      }
    });

    document.body.addEventListener('click', (e) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
      if (!el) return;
      this.action(el.dataset.act!, el.dataset);
    });

    // Device buttons (rendered per device into #controls), held while the pointer is down.
    const ctlEl = $('#controls');
    const down = (ref: string) => {
      ctlEl.querySelector(`[data-ctl="${ref}"]`)?.classList.add('on');
      const result = s.setButton(ref, true);
      if (result) this.toast(`${s.board.device.controls.find((c) => c.ref === ref)?.label ?? ref}: ${result}`, s.op ? '' : 'bad');
    };
    const up = (ref: string) => {
      ctlEl.querySelector(`[data-ctl="${ref}"]`)?.classList.remove('on');
      s.setButton(ref, false);
    };
    ctlEl.addEventListener('pointerdown', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('[data-ctl]');
      if (b) down(b.dataset.ctl!);
    });
    for (const ev of ['pointerup', 'pointerleave'] as const)
      ctlEl.addEventListener(ev, () => {
        for (const ref of [...s.board.pressed]) up(ref);
      });
    // Space presses the device's first button (except while soldering or typing).
    window.addEventListener('keydown', (e) => {
      if (e.code !== 'Space' || e.repeat || this.soldering || (e.target as HTMLElement)?.tagName === 'INPUT') return;
      const first = s.board.device.controls[0];
      if (!first || s.idle) return;
      e.preventDefault();
      down(first.ref);
    });
    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space' && !this.soldering) for (const ref of [...s.board.pressed]) up(ref);
    });

    for (const id of ['#psu-v', '#psu-i']) {
      $(id).addEventListener('change', () => {
        s.setPsu(parseFloat($<HTMLInputElement>('#psu-v').value) || 0, parseFloat($<HTMLInputElement>('#psu-i').value) || 0.01);
      });
    }

    $('#guided').addEventListener('change', (e) => s.setGuided((e.target as HTMLInputElement).checked));
  }

  flip(): void {
    const s = this.s;
    if (!this.scene.flipped && !s.reachable) {
      this.toast('Take the board out of its case first (🔧 Case on the ticket).');
      return;
    }
    if (!this.scene.flipped && s.powerMode !== 'off') {
      s.setPowerMode('off');
      this.toast('Unplugged the power before turning the board over.');
    }
    if (!this.scene.flipped) {
      s.selected = null;
      s.jumperStart = null;
    }
    if (!this.scene.flipped && s.enc?.lmExposed?.length && s.guided && !confirm('Liquid metal is still wet on the chip — turn the board over and it will run off onto the parts around it. Flip it anyway?')) return;
    this.scene.toggleFlip();
    s.addLog('action', this.scene.flipped ? 'Flipped the board over to look at the underside.' : 'Turned the board back component-side up.');
    if (this.scene.flipped) {
      const spill = s.onFlip();
      if (spill) this.toast(spill, 'bad');
    }
    s.emit();
  }

  private toolbarSig = '';

  /** Toolbar buttons (the scope only once you own one). */
  private renderToolbar(): void {
    const list = TOOLS.filter((t) => t.id !== 'scope' || this.s.owns('oscilloscope'));
    const sig = list.map((t) => t.id).join();
    if (sig === this.toolbarSig) return;
    this.toolbarSig = sig;
    $('#toolbar').innerHTML = list.map((t) => `<button data-tool="${t.id}" title="${esc(t.hint)}"><kbd>${t.key}</kbd>${t.name}</button>`).join('');
  }

  setTool(t: Tool): void {
    this.s.tool = t;
    this.s.jumperStart = null;
    this.s.emit();
  }

  // ------------------------------------------------------------------ board interaction

  onHover(hit: BoardHit | null, ev: PointerEvent): void {
    const tip = $('#tip');
    if (!hit || (!hit.pad && !hit.comp && !hit.trace)) {
      tip.style.display = 'none';
      return;
    }
    const s = this.s;
    let text = '';
    if (hit.pad && ['probe', 'clip', 'jumper', 'scope'].includes(s.tool)) {
      const desc = s.board.device.nets[hit.pad.net]?.desc;
      const active = s.tool === 'probe' ? s.activeProbe : s.tool === 'clip' ? s.activeClip : null;
      const what = s.tool === 'probe' ? 'probe' : 'clip';
      const badge = active
        ? `<div class="badge ${active}">Click: ${active} ${what}${active === 'red' ? ` · right-click: black ${what}` : ''}</div>`
        : '';
      text = `${badge}<b>${pointLabel(s, hit.pad)}</b>${s.guided && desc ? `<br><span>${esc(desc)}</span>` : ''}`;
      if (DEBUG) text += `<br><span class="dbg">net ${hit.pad.net} = ${s.op ? s.op.at(hit.pad).toFixed(3) + ' V' : 'unpowered'}</span>`;
    } else if (hit.comp) {
      const c = s.board.comps[hit.comp];
      text = `<b>${c.ref}</b> ${c.part ? esc(c.part.label) : '(empty)'}`;
      if (hit.pad && (s.tool === 'inspect' || s.tool === 'iron')) text += `<br><span>Press 1 for the multimeter to probe</span>`;
    } else if (hit.trace) text = 'Copper trace';
    tip.innerHTML = text;
    tip.style.display = text ? 'block' : 'none';
    tip.style.left = `${ev.clientX + 16}px`;
    tip.style.top = `${ev.clientY + 14}px`;
  }

  /** Which lead a click places: right-click / Shift = black, otherwise the active one. */
  private leadFor(ev: PointerEvent, active: 'red' | 'black'): 'red' | 'black' {
    return ev.button === 2 || ev.shiftKey || ev.altKey ? 'black' : active;
  }

  onClick(hit: BoardHit | null, ev: PointerEvent): void {
    const s = this.s;
    if (this.scene.flipped) {
      if (ev.button === 0) this.toast('The board is upside down — press B (or Flip board) to turn it back over.');
      return;
    }
    if (!hit) return;
    if (!s.reachable && s.tool !== 'inspect') {
      if (ev.button === 0) this.toast('The case is still closed — open it up first (🔧 Case on the ticket). You can still power it and watch it work.');
      return;
    }
    if (ev.button === 2 && s.tool !== 'probe' && s.tool !== 'clip') return;
    const point: PointRef | null = hit.pad ? { ref: hit.pad.ref, pin: hit.pad.pin } : null;
    switch (s.tool) {
      case 'probe':
        if (point) {
          const which = this.leadFor(ev, s.activeProbe);
          s.setProbe(which, point);
          // After a left-click, move on to whichever probe still needs placing (else back to red).
          if (ev.button === 0 && !ev.shiftKey) s.activeProbe = which === 'red' && !s.meter.black ? 'black' : 'red';
          s.emit();
          if (s.reading?.beep) beep();
        }
        break;
      case 'scope':
        if (point) {
          s.scopePoint = point;
          s.emit();
        }
        break;
      case 'clip':
        if (point) {
          const which = this.leadFor(ev, s.activeClip);
          s.setClip(which, point);
          if (ev.button === 0 && !ev.shiftKey) s.activeClip = which === 'red' && !s.psu.black ? 'black' : 'red';
          s.emit();
        }
        break;
      case 'jumper':
        if (!point) break;
        if (!s.jumperStart) {
          s.jumperStart = point;
          this.toast(`Wire tacked to ${pointLabel(s, point)} — now click the other end.`);
          s.emit();
        } else {
          const a = s.jumperStart;
          s.jumperStart = null;
          if (a.ref === point.ref && a.pin === point.pin) break;
          if (!this.liveBoardCheck(a.ref)) break;
          void this.solder(`Solder jumper ${pointLabel(s, a)} → ${pointLabel(s, point)}`, null).then((q) => q && this.toast(s.doJumper(a, point, q)));
        }
        break;
      case 'ipa':
        {
          const r = s.cleanWithIpa();
          this.toast(r.ok ? `${r.text} Watch where it dries first if the board is powered.` : r.text, r.ok ? undefined : 'bad');
        }
        break;
      case 'inspect':
      case 'iron':
        if (hit.pad && !hit.comp) {
          this.toast('That is a test point — press 1 for the multimeter to probe it.');
          break;
        }
        if (hit.trace && !hit.comp) {
          const broken = s.board.traces[hit.trace]?.broken;
          if (this.scene.zoom > 70) this.toast('Zoom in closer to inspect the copper.');
          else this.toast(broken ? '🔍 A hairline crack runs across this copper trace!' : 'The trace looks intact.', broken ? 'bad' : '');
          s.addLog('note', `Inspected trace ${hit.trace}: ${this.scene.zoom > 70 ? 'too far away to tell' : broken ? 'hairline crack!' : 'looks fine'}`);
          s.emit();
        } else {
          s.selected = hit.comp;
          s.emit();
        }
        break;
    }
  }

  // ------------------------------------------------------------------ actions

  private action(act: string, d: DOMStringMap): void {
    const s = this.s;
    const ref = s.selected;
    switch (act) {
      case 'power':
        s.setPowerMode(d.mode as PowerMode);
        break;
      case 'mode':
        s.setMeterMode(d.mode as MeterMode);
        if (s.reading?.beep) beep();
        break;
      case 'active-probe':
        s.activeProbe = d.which as 'red' | 'black';
        if (s.tool !== 'probe') s.tool = 'probe';
        s.emit();
        break;
      case 'active-clip':
        s.activeClip = d.which as 'red' | 'black';
        if (s.tool !== 'clip') s.tool = 'clip';
        s.emit();
        break;
      case 'black-gnd':
        s.setProbe('black', { ref: s.board.device.ground, pin: '1' });
        break;
      case 'clear-probes':
        s.setProbe('red', null);
        s.setProbe('black', null);
        break;
      case 'swap-probes': {
        const { red, black } = s.meter;
        s.meter.red = black;
        s.setProbe('black', red);
        break;
      }
      case 'psu-step': {
        const dv = parseFloat(d.dv ?? '0');
        const di = parseFloat(d.di ?? '0');
        s.setPsu(Math.round((s.psu.v + dv) * 10) / 10, Math.round((s.psu.ilim + di) * 100) / 100);
        break;
      }
      case 'rework':
        if (ref) this.openRework(ref);
        break;
      case 'contacts':
        if (ref) this.openContacts(ref);
        break;
      case 'attach':
        s.toggleAttach(d.id!);
        break;
      case 'jumper-del':
        s.doRemoveJumper(parseInt(d.id!, 10));
        break;
      case 'deselect':
        s.selected = null;
        s.emit();
        break;
      case 'return':
        this.confirmReturn();
        break;
      case 'case':
        this.openTeardown();
        break;
      case 'station':
        this.openStation();
        break;
      case 'case-close-return':
        {
          const log = s.encCloseForMe();
          if (!assembled(s.enc)) this.toast(log[log.length - 1] ?? 'Could not close it up.', 'bad');
          else {
            s.returnToCustomer();
            this.showDebrief();
          }
        }
        break;
      case 'return-yes':
        s.returnToCustomer();
        this.showDebrief();
        break;
      case 'give-up':
        if (confirm(`Hand ${s.job.customer}'s ${s.job.device.name} back unrepaired? (−2 reputation, no payment)`)) {
          s.giveUp();
          this.showDebrief();
        }
        break;
      case 'list-sale': {
        const res = s.listForSale();
        if (!res.ok) this.toast(res.reason ?? 'Cannot list it.', 'bad');
        else this.showDebrief();
        break;
      }
      case 'scrap':
        if (confirm('Strip this board for parts? Every good part goes into your used-parts stock and the board is finished.')) {
          s.scrapForParts();
          this.showDebrief();
        }
        break;
      case 'call':
        this.showCall();
        break;
      case 'ask': {
        const sel = document.querySelector<HTMLSelectElement>('#call-part');
        const res = s.callCustomer(d.ask as CustomerAsk, { partNo: sel?.value, pct: d.pct ? parseFloat(d.pct) : undefined });
        this.modal(`<h2>📞 ${res.yes ? 'They said yes' : 'They said no'}</h2><p class="quote">${esc(res.text)}</p>
          <div class="row">${res.yes && d.ask === 'buyout' ? '<button class="big primary" data-act="office-storeroom">To the store-room →</button>' : '<button class="big" data-act="close">Back to the bench</button>'}</div>`);
        break;
      }
      case 'office-storeroom':
        this.openOffice('storeroom');
        break;
      case 'search-online': {
        const dev = document.querySelector<HTMLSelectElement>('#search-dev')?.value;
        if (dev) {
          const found = searchOnline(s.shop, dev);
          s.save();
          this.toast(found.length ? `Found ${found.length} online listing${found.length === 1 ? '' : 's'} — they are in the Marketplace now.` : 'You already searched for that one today.');
        }
        this.renderOffice();
        break;
      }
      case 'store-donor':
        if (confirm('Give up on this one and put it on the store-room shelf? You can pull parts off it later.') && s.storeAsDonor()) {
          this.toast('On the store-room shelf. Pull parts from it in Office → Store-room.');
          this.openOffice('storeroom');
        }
        break;
      case 'store-project': {
        const p = s.shop.projects.find((x) => x.id === parseInt(d.id!, 10));
        if (p && confirm(`Move ${p.title} to the store-room as a parts donor?`) && storeProject(s.shop, p.id, loadJob(p.job))) {
          s.save();
          this.officeTab = 'storeroom';
        }
        this.renderOffice();
        break;
      }
      case 'harvest': {
        const res = harvestPart(s.shop, parseInt(d.id!, 10), d.ref!);
        s.save();
        this.toast(res.text, res.ok ? undefined : 'bad');
        this.renderOffice();
        break;
      }
      case 'set-speed':
        this.speed = d.id as DeliveryId;
        this.renderOffice();
        break;
      case 'plug':
        s.setPlugged(d.ref!, d.on === '1');
        break;
      case 'swap-module': {
        const t = s.swapModule(d.ref!, d.kind as 'new' | 'used');
        if (t) this.toast(t);
        break;
      }
      case 'pause':
        s.pauseWork();
        this.openOffice('work');
        break;
      case 'office':
        this.openOffice(s.idle ? 'work' : this.officeTab);
        break;
      case 'office-tab':
        this.officeTab = d.tab as OfficeTab;
        this.renderOffice();
        break;
      case 'start-work':
        if (d.kind === 'project') {
          const p = s.shop.projects.find((x) => x.id === parseInt(d.id!, 10));
          if (p && inTransit(s.shop, p)) {
            this.toast(`Still in the post — it arrives on day ${p.arrives}.`, 'bad');
            break;
          }
        }
        s.startWork(d.kind as 'customer' | 'warranty' | 'project', parseInt(d.id!, 10));
        this.closeModal();
        this.scene.focusBoard();
        this.toast(`On the bench: ${s.describeJob()}.`);
        break;
      case 'buy-listing': {
        const p = buyListing(s.shop, parseInt(d.id!, 10));
        if (p) {
          s.save();
          this.toast(`Bought it. It is in Work → Your projects.`);
        }
        this.renderOffice();
        break;
      }
      case 'buy-tool':
        if (buyTool(s.shop, d.id!)) {
          s.save();
          this.toast('Bought it — choose it in the microscope kit selectors.');
        }
        this.renderOffice();
        break;
      case 'set-ads':
        s.shop.ads = d.id as (typeof ADS)[number]['id'];
        s.save();
        this.renderOffice();
        break;
      case 'cart': {
        const k = d.key!;
        this.cart[k] = Math.max(0, (this.cart[k] ?? 0) + parseInt(d.d!, 10));
        this.renderOffice();
        break;
      }
      case 'clear-cart':
        this.cart = {};
        this.renderOffice();
        break;
      case 'place-order': {
        const o = placeOrder(s.shop, cartLines(this.cart), this.speed);
        if (o) {
          this.cart = {};
          s.save();
          this.toast(`Order #${o.id} placed — $${o.cost.toFixed(2)}. Arrives ${o.arrives - s.shop.day === 1 ? 'tomorrow morning' : `on day ${o.arrives}`}.`);
        }
        this.renderOffice();
        break;
      }
      case 'end-day':
        this.modal(`<h2>🌙 End the day?</h2>
          <p>Tonight's bills get paid (electricity${s.shop.day % 7 === 0 ? ', <b>rent</b>' : ''}${s.shop.ads !== 'none' ? ', advertising' : ''}), orders arrive and new customers come in tomorrow.${s.shop.active ? ' The job on your bench will be put aside.' : ''}</p>
          <div class="row"><button class="big primary" data-act="end-day-yes">End day ${s.shop.day}</button><button data-act="office">Not yet</button></div>`);
        break;
      case 'end-day-yes':
        this.showDayReport();
        break;
      case 'schematic':
        this.modal(schematicHtml(s.board.device, s.guided), 'wide');
        break;
      case 'help':
        this.showHelp();
        break;
      case 'tutorial':
        this.closeModal();
        if (s.shop.active) s.pauseWork();
        this.tutorial.start();
        break;
      case 'close':
        this.closeModal();
        if (s.idle && !this.soldering) this.openOffice('work');
        break;
      case 'flip':
        this.flip();
        break;
      case 'thermal':
        s.thermal = !s.thermal;
        if (s.thermal && s.powerMode === 'off') this.toast('Thermal camera on. Power the board up — faulty parts take a few seconds to warm up.');
        s.emit();
        break;
      case 'focus':
        this.scene.focusBoard();
        break;
      case 'new-game':
        if (confirm(`Start a new career on day 1?

Your shop, cash ($${s.shop.cash.toFixed(0)}), reputation, stock, tools, projects and every job in the queue will be wiped. This cannot be undone.`)) {
          s.newGame();
          this.cart = {};
          this.toast('New career started — day 1. A starter pack of parts is in the drawers.');
          this.openOffice('work');
          this.tutorial.start();
        }
        break;
    }
  }

  // ------------------------------------------------------------------ rework station

  /** Soldering with the battery still plugged in: warn (guided), then maybe spark. False = cancelled. */
  private liveBoardCheck(ref: string | null): boolean {
    const s = this.s;
    if (!s.batteryLive) return true;
    // Desoldering the battery itself is how you disconnect a soldered one: no warning.
    if (ref && s.board.comps[ref]?.part?.kind === 'battery') return true;
    const how = s.batterySoldered
      ? 'The battery is soldered in, so the board is live even with the bench power off. Soldering elsewhere now can spark and blow parts — desolder one battery tab first (open the battery on the rework station, negative tab first).'
      : 'The battery is still plugged in, so the board is live even with the bench power off. Soldering now can spark and blow parts — unplug the battery first (Case → battery plug).';
    if (s.guided && !confirm(`${how}\n\nSolder anyway?`)) return false;
    const spark = s.batterySpark(ref);
    if (spark) {
      this.toast(spark, 'bad');
      sizzle();
    }
    return true;
  }

  private openRework(ref: string): void {
    const s = this.s;
    if (!s.reachable) {
      this.toast('Open the case first (🔧 Case on the ticket) — you cannot get a microscope on a board inside its case.');
      return;
    }
    if (!this.liveBoardCheck(ref)) return;
    const m = $('#modal');
    m.className = 'show rework';
    this.soldering = true;
    this.scene.setIronTarget(ref);
    const station = new ReworkStation(s, $('#modal-body'), (summary) => {
      this.soldering = false;
      this.station = null;
      this.scene.setIronTarget(null);
      m.className = '';
      $('#modal-body').innerHTML = '';
      if (summary) this.toast(summary);
    });
    station.open(ref);
    this.station = station;
    (window as unknown as { rework: unknown }).rework = station; // console debugging
  }

  // ------------------------------------------------------------------ test station

  private openStation(): void {
    const s = this.s;
    if (s.powerMode !== 'off') s.setPowerMode('off');
    const m = $('#modal');
    m.className = 'show rework';
    this.soldering = true;
    new TestStation(s, $('#modal-body'), () => {
      this.soldering = false;
      m.className = '';
      $('#modal-body').innerHTML = '';
      s.emit();
    }).open();
  }

  // ------------------------------------------------------------------ contacts

  private openContacts(ref: string): void {
    const s = this.s;
    if (!s.reachable && !s.board.comps[ref].def.partNo.startsWith('J-EDGE')) {
      this.toast('Open the case first (🔧 Case on the ticket).');
      return;
    }
    if (s.powerMode !== 'off') s.setPowerMode('off');
    const m = $('#modal');
    m.className = 'show rework';
    this.soldering = true;
    new ContactStation(s, $('#modal-body'), ref, () => {
      this.soldering = false;
      m.className = '';
      $('#modal-body').innerHTML = '';
      s.emit();
    }).open();
  }

  // ------------------------------------------------------------------ teardown

  private openTeardown(): void {
    const s = this.s;
    if (!s.encDef || !s.enc) return;
    const m = $('#modal');
    m.className = 'show rework';
    this.soldering = true;
    const station = new TeardownStation(s, $('#modal-body'), this.scene.boardArtCanvas(), () => {
      this.soldering = false;
      m.className = '';
      $('#modal-body').innerHTML = '';
      s.emit();
    });
    station.open();
  }

  // ------------------------------------------------------------------ soldering minigame

  /** Hold-to-heat minigame. Resolves with the joint quality, or null if cancelled. */
  private solder(title: string, ref: string | null): Promise<SolderQuality | null> {
    const s = this.s;
    const flux = ref ? s.fluxed.has(ref) : true;
    const multi = ref ? Object.keys(s.board.comps[ref].joints).length > 3 : false;
    const lo = flux ? 38 : 48;
    const hi = flux ? 86 : 76;
    this.soldering = true;
    this.scene.setIronTarget(ref);
    this.modal(
      `<h2>${esc(title)}</h2>
      <p>${multi ? 'Hot air: heat the whole part evenly.' : 'Hold to heat the joint.'} Let go when the solder flows (<b class="good">green zone</b>).</p>
      <p class="muted">${flux ? '✓ Flux applied — the solder flows easily.' : 'No fresh flux: the window is narrow. (Tip: apply flux first.)'}</p>
      <div class="heat"><div class="zone" style="left:${lo}%;width:${hi - lo}%"></div><div class="fill" id="heat-fill"></div></div>
      <div class="heat-labels"><span>cold joint</span><span>good</span><span>overheated</span></div>
      <div class="row"><button id="heat-btn" class="big">🔥 Hold to heat (or hold Space)</button><button data-act="close">Cancel</button></div>`,
    );
    return new Promise((resolve) => {
      let heat = 0;
      let holding = false;
      let downAt = 0;
      const rate = flux ? 38 : 46; // % per second
      const heatNow = () => (holding ? Math.min(100, ((performance.now() - downAt) / 1000) * rate) : heat);
      let started = false;
      let raf = 0;
      let done = false;
      const fill = $('#heat-fill');
      const finish = (q: SolderQuality | null) => {
        if (done) return;
        done = true;
        cancelAnimationFrame(raf);
        window.removeEventListener('keydown', kd);
        window.removeEventListener('keyup', ku);
        this.soldering = false;
        this.scene.setIronTarget(null);
        this.closeModal();
        resolve(q);
      };
      const release = () => {
        if (!holding) return;
        heat = heatNow();
        holding = false;
        finish(heat < lo ? 'cold' : heat > hi ? 'overheated' : 'good');
      };
      const loop = () => {
        if (holding) heat = heatNow();
        fill.style.width = `${heat}%`;
        fill.className = `fill ${heat < lo ? 'cold' : heat > hi ? 'hot' : 'ok'}`;
        if (heat >= 100) {
          holding = true;
          release();
          return;
        }
        if (!$('#heat-fill')) return finish(null);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      const btn = $('#heat-btn');
      const press = () => {
        if (holding) return;
        downAt = performance.now();
        holding = started = true;
      };
      btn.addEventListener('pointerdown', press);
      btn.addEventListener('pointerup', release);
      btn.addEventListener('pointerleave', () => started && release());
      const kd = (e: KeyboardEvent) => {
        if (e.code === 'Space') {
          e.preventDefault();
          press();
        }
      };
      const ku = (e: KeyboardEvent) => {
        if (e.code === 'Space') release();
      };
      window.addEventListener('keydown', kd);
      window.addEventListener('keyup', ku);
      $('#modal').addEventListener('close-modal', () => finish(null), { once: true });
    });
  }

  // ------------------------------------------------------------------ modals

  private modal(html: string, cls = ''): void {
    const m = $('#modal');
    m.className = `show ${cls}`;
    $('#modal-body').innerHTML = `<button class="x" data-act="close" aria-label="Close">×</button>${html}`;
  }

  private closeModal(): void {
    const m = $('#modal');
    this.officeOpen = false;
    if (!m.classList.contains('show')) return;
    m.className = '';
    $('#modal-body').innerHTML = '';
    m.dispatchEvent(new Event('close-modal'));
  }

  private showHelp(): void {
    try {
      localStorage.setItem('benchtech.seenHelp', '1');
    } catch {
      /* ignore */
    }
    this.modal(`<h2>Welcome to the bench</h2>
    <p>You run a small electronics repair shop. Customers drop off broken gadgets — starting with simple <b>desk lamps</b> and speakers, and, as your reputation grows, TVs, handheld consoles and the big consoles. Find out what is wrong, fix it, and hand it back.</p>
    <ol>
      <li><b>Read the ticket</b> — what does the customer say it does?</li>
      <li><b>Look</b> — use <kbd>2</kbd> Inspect and zoom in. Burnt, bulging or cracked things are clues (but not every mark means trouble).</li>
      <li><b>Measure</b> — <kbd>1</kbd> Multimeter: click = red probe, Shift+click = black probe. Power it with the adapter or the bench supply and check each voltage.</li>
      <li><b>Fix</b> — <kbd>3</kbd> Soldering: reflow, remove and replace parts. Flux first makes it easier.</li>
      <li><b>Test</b> — power it up, use its buttons and check the status panel, then <b>Return to customer</b>.</li>
    </ol>
    <p class="muted">Camera: right-drag to orbit, Shift+right-drag or middle-drag to pan, mouse wheel to zoom, <kbd>F</kbd> to reset. Guided mode explains every reading in plain words.</p>
    <p>Between jobs you run the business from the <b>🏪 Office</b>: pick customers, reorder supplies and parts, advertise, buy broken devices to fix and sell (watch for 🔥 demand spikes), and keep donor boards in the store-room for expensive parts.</p>
    <div class="row"><button class="big" data-act="office">Open the shop</button><button class="big" data-act="tutorial">▶ Play the tutorial</button></div>
    <div class="row"><button data-act="new-game" title="Wipe this save and start again on day 1 with a fresh shop and a starter pack of parts">⟲ Start a new career (day 1)</button></div>`);
  }

  /** Phone the customer: next-day parts, waiting, or buying the dead device as spares. */
  private showCall(): void {
    const s = this.s;
    const job = s.job;
    const parts = [...new Set(job.device.components.map((c) => c.partNo))]
      .map((pn) => part(pn))
      .filter((p) => p.kind !== 'testpoint' && !NOT_SOLD.has(p.partNo))
      .sort((a, b) => b.cost - a.cost);
    const opts = parts
      .map((p) => {
        const sl = stockOf(s.shop, p.partNo);
        return `<option value="${p.partNo}">${esc(p.label)} — $${p.cost.toFixed(2)} (${sl.new + sl.used} in stock)</option>`;
      })
      .join('');
    const fee = expressFee();
    const offer = (pct: number) => `<button data-act="ask" data-ask="buyout" data-pct="${pct}">Offer $${buyoutOffer(job.device, pct)} (${Math.round(pct * 100)}%)</button>`;
    const hold = s.hold;
    this.modal(`<h2>📞 Call ${esc(job.customer)}</h2>
      ${hold ? `<p class="note">Agreed: ${esc(hold.note)} — they will wait until day ${hold.until}.</p>` : ''}
      <h3>Need a part you don't have?</h3>
      <label>Part <select id="call-part">${opts}</select></label>
      <div class="row">
        <button data-act="ask" data-ask="express" title="Express courier, paid by the customer">⚡ Ask to pay for next-day delivery (+$${fee} on their bill)</button>
        <button data-act="ask" data-ask="wait-parts">📦 Order standard delivery (free) and ask them to wait</button>
      </div>
      <p class="muted small">The customer decides. Pricey extras on a cheap repair are a hard sell.</p>
      <h3>Expensive chip nobody sells new?</h3>
      <div class="row"><button data-act="ask" data-ask="wait-donor">🔎 Ask them to wait while you find a donor board</button></div>
      <p class="muted small">Then search online for a donor in the Marketplace (it ships in a few days), or check your store-room.</p>
      <h3>Not worth saving?</h3>
      <p>Offer to buy it as spares for parts. If they accept, the board goes into your store-room.</p>
      <div class="row">${offer(0.1)}${offer(0.15)}${offer(0.25)}</div>
      <div class="row"><button data-act="close">Hang up</button></div>`);
  }

  private confirmReturn(): void {
    const s = this.s;
    const open = !assembled(s.enc);
    this.modal(`<h2>Hand it back?</h2>
      <p>${esc(s.job.customer)} will take the ${esc(jobName(s.job))} home and use it. ${s.job.device.cartFor ? `They pay now and try it at home — if it does not boot, they come back tomorrow for <b>10% back</b> and you fix it again.${s.job.stationTest ? ` (Test Station, day ${s.job.stationTest.day}: ${s.job.stationTest.passed ? 'title screen ✓' : 'did NOT boot'})` : ' Test it on the 📺 Test Station first if you have the console.'}` : "If it fails, you don't get paid — and if it fails <i>later</i>, they'll be back for a free warranty repair."}</p>
      ${open ? `<p class="note bad">⚠ The case is not back together. Handing it back in bits counts against you.${s.guided ? ' Close it up first (or let me do it).' : ''}</p>` : ''}
      <p class="muted">Tip: test it yourself first — power it, check the lights, press the button.</p>
      <div class="row">${open && s.guided ? `<button class="big primary" data-act="case-close-return">Close it up, then return it</button>` : ''}<button class="big" data-act="return-yes">Return to ${esc(s.job.customer)}${open ? ' as it is' : ''}</button><button data-act="close">Keep working</button></div>`);
  }

  // ------------------------------------------------------------------ office

  private openOffice(tab: OfficeTab = this.officeTab): void {
    this.officeTab = tab;
    this.officeOpen = true;
    this.renderOffice();
  }

  private renderOffice(): void {
    if (!this.officeOpen) return;
    this.modal(officeHtml(this.s, this.officeTab, this.cart, this.speed), 'wide office-modal');
  }

  private showDayReport(): void {
    const s = this.s;
    const r = s.endDay();
    const lines = (xs: string[]) => xs.map((x) => `<li>${esc(x)}</li>`).join('');
    const bills = r.bills.map((b) => `<tr><td>${esc(b.text)}</td><td class="num bad">−$${Math.abs(b.amount).toFixed(2)}</td></tr>`).join('');
    this.officeOpen = false;
    this.modal(
      `<h2>🌙 End of day ${r.day}</h2>
      <h3>Tonight's bills</h3><table class="bom">${bills || '<tr><td class="muted">None</td></tr>'}</table>
      <h3>Day ${s.shop.day} morning</h3><ul class="checks">
        ${lines(r.trends)}${lines(r.deliveries)}${lines(r.sales.map((x) => '💰 ' + x))}${lines(r.refunds.map((x) => '↩ ' + x))}
        ${r.walkouts ? `<li class="bad">${r.walkouts} customer${r.walkouts > 1 ? 's' : ''} got tired of waiting and left (−reputation).</li>` : ''}
        ${r.warranty ? `<li class="warn">${r.warranty} warranty return${r.warranty > 1 ? 's' : ''} came back in.</li>` : ''}
        <li>${r.newCustomers} new customer${r.newCustomers === 1 ? '' : 's'} came in.</li>
      </ul>
      <p>Cash: <b class="${s.shop.cash < 0 ? 'bad' : ''}">$${s.shop.cash.toFixed(2)}</b></p>
      <div class="row"><button class="big primary" data-act="office">Open the shop →</button></div>`,
    );
  }

  private showDebrief(): void {
    const s = this.s;
    const res = s.lastResult;
    if (!res) return;
    this.officeOpen = false;
    const line = (ok: boolean, t: string) => `<li class="${ok ? 'good' : 'bad'}">${ok ? '✓' : '✗'} ${t}</li>`;
    const back = `<div class="row"><button class="big primary" data-act="office">Back to the office →</button></div>`;
    const job = res.job;
    const truth = job.faults
      .map((f) => `<p><b>${esc(f.family)}</b> (difficulty ${'★'.repeat(f.tier)}): ${esc(f.summary)}</p>`)
      .join('');
    const hint = job.faults[0] ? `<p class="muted">A pro would start with: ${esc(job.faults[0].hint)}</p>` : '';

    if (res.kind === 'gave-up') {
      this.modal(`<h2>Handed back unrepaired</h2><p>${esc(job.customer)} takes it away. No payment, and a small dent in your reputation.</p><h3>What was actually wrong</h3>${truth}${hint}${back}`, 'wide');
      return;
    }
    if (res.kind === 'scrapped') {
      const counts: Record<string, number> = {};
      for (const p of res.salvaged) counts[p] = (counts[p] ?? 0) + 1;
      const rows = Object.entries(counts)
        .map(([p, n]) => `<li>${n}× ${esc(part(p).label)}${NOT_SOLD.has(p) ? ' <span class="good">— a programmed MCU, only available from donors!</span>' : ''}</li>`)
        .join('');
      this.modal(`<h2>♻ Scrapped for parts</h2><p>You stripped every good part off the board into your used-parts stock.</p><ul class="checks">${rows || '<li class="muted">Nothing worth saving.</li>'}</ul><h3>What was wrong with it</h3>${truth}${back}`, 'wide');
      return;
    }
    const ev = res.evaluation;
    const r = ev.report;
    const tests = `<h3>Functional test</h3><ul class="checks">
        ${r.checks.map((c) => line(c.ok, esc(c.label))).join('')}
        ${r.events.length ? line(false, `Something failed during use: ${r.events.map((e) => esc(e.message)).join(', ')}`) : ''}
      </ul>
      ${ev.hidden.length ? `<h3>Workmanship problems</h3><ul class="checks">${ev.hidden.map((h) => line(false, esc(h))).join('')}</ul>` : ''}
      ${ev.notes.length ? `<h3>Notes</h3><ul class="checks">${ev.notes.map((n) => `<li class="muted">• ${esc(n)}</li>`).join('')}</ul>` : ''}`;
    if (res.kind === 'listed') {
      this.modal(
        `<h2>🏷 Listed for sale at $${res.price.toFixed(2)}</h2>
        <p>It should sell within a few days. ${ev.hidden.length ? '<span class="warn">Buyers cannot see the workmanship problems below — some of them will want a refund.</span>' : 'Clean work — buyers will be happy.'}</p>
        ${tests}<h3>What was wrong with it</h3>${truth}${back}`,
        'wide',
      );
      return;
    }
    const warranty = job.kind === 'warranty';
    const title = { fixed: '✅ Repair successful', comeback: '⚠ It works… for now', 'not-fixed': '❌ Still broken' }[ev.outcome];
    const blurb = {
      fixed: warranty ? `${esc(job.customer)} is relieved it is fixed for good.` : `${esc(job.customer)} is happy and leaves a good review.`,
      comeback: `It passed the test, but it will be back under warranty in a few days — for free.`,
      'not-fixed': `${esc(job.customer)} plugs it in… and it still doesn't work. ${warranty ? '' : 'No payment.'}`,
    }[ev.outcome];
    this.modal(
      `<h2>${title}</h2><p>${blurb}</p>${tests}
      <h3>What was actually wrong</h3>${truth}
      ${job.history.length ? `<p class="muted">Damage while the customer kept using it: ${job.history.map((e) => esc(e.message)).join(', ')}.</p>` : ''}${hint}
      <h3>Money</h3>
      <table class="bom"><tr><td>${warranty ? 'Warranty repair (no charge)' : 'Payment'}</td><td>$${ev.payout.toFixed(2)}</td></tr><tr><td>Reputation</td><td>${ev.reputation >= 0 ? '+' : ''}${ev.reputation}</td></tr></table>
      <p class="muted small">Parts and supplies came out of your stock; reorder them from the office.</p>${back}`,
      'wide',
    );
  }

  // ------------------------------------------------------------------ toasts

  toast(text: string, kind: '' | 'bad' = ''): void {
    const t = $('#toast');
    t.textContent = text;
    t.className = `show ${kind}`;
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => (t.className = ''), 3800);
  }

  // ------------------------------------------------------------------ render

  private render(): void {
    const s = this.s;
    const tierNames = ['', 'Beginner', 'Bench tech', 'Expert'];

    this.set(
      '#shop',
      `<span title="Day">📅 Day ${s.shop.day}</span><span title="Cash" class="${s.shop.cash < 0 ? 'bad' : ''}">💵 $${s.shop.cash.toFixed(2)}</span><span title="Reputation">⭐ ${s.shop.reputation}</span><span class="muted" title="Hardest faults you will see">Jobs: ${tierNames[s.maxTier]}</span><button data-act="office" class="office-btn">🏪 Office</button>`,
    );
    $<HTMLInputElement>('#guided').checked = s.guided;

    this.set('#ticket', this.ticketHtml());

    // Component card
    if (s.selected) this.set('#card', this.cardHtml(s.selected));
    else this.set('#card', '');
    $('#card').style.display = s.selected ? 'block' : 'none';

    // Log
    this.set(
      '#log',
      `<h3>Bench notes</h3>${s.log
        .slice(0, 40)
        .map((l) => `<div class="log ${l.kind}">${esc(l.text)}${l.detail ? ` <span class="muted">(${esc(l.detail)})</span>` : ''}</div>`)
        .join('')}`,
    );

    // Meter
    const r = s.reading;
    const modes: [MeterMode, string, string][] = [
      ['dcv', 'V⎓', 'DC volts'],
      ['ohm', 'Ω', 'Resistance'],
      ['continuity', '•))', 'Continuity (beeps)'],
      ['diode', '⏵|', 'Diode test'],
    ];
    if (s.owns('esr-meter')) modes.push(['esr', 'ESR', 'ESR meter: capacitor health, in circuit, unpowered']);
    this.set(
      '#meter',
      `<h3>Multimeter</h3>
      <div class="lcd ${r?.beep ? 'beep' : ''} ${r ? '' : 'idle'}"><span>${r ? esc(r.display) : !s.meter.red && !s.meter.black ? 'place both probes' : !s.meter.red ? 'place red probe' : 'place black probe'}</span><small>${r && r.display !== 'OL' ? esc(r.unit) : ''}</small></div>
      <div class="modes">${modes.map(([m, sym, title]) => `<button data-act="mode" data-mode="${m}" class="${s.meter.mode === m ? 'on' : ''}" title="${title}">${sym}</button>`).join('')}</div>
      <div class="leads">
        <button data-act="active-probe" data-which="red" class="lead red ${s.activeProbe === 'red' ? 'on' : ''}" title="Left-click places this probe next">● Red <span>${s.meter.red ? pointLabel(s, s.meter.red) : 'not placed'}</span></button>
        <button data-act="active-probe" data-which="black" class="lead black ${s.activeProbe === 'black' ? 'on' : ''}" title="Left-click places this probe next">● Black <span>${s.meter.black ? pointLabel(s, s.meter.black) : 'not placed'}</span></button>
      </div>
      <div class="muted small">Left-click places the highlighted probe · right-click places black</div>
      <div class="row small"><button data-act="black-gnd">Black → GND</button><button data-act="swap-probes">Swap</button><button data-act="clear-probes">Lift</button></div>
      ${s.readingNote ? `<p class="note">${esc(s.readingNote)}</p>` : ''}`,
    );

    // Power
    const op = s.op;
    const modesP: [PowerMode, string][] = [
      ['off', 'Off'],
      ['adapter', 'Customer adapter'],
      ['psu-jack', 'PSU → jack'],
      ['psu-clips', 'PSU probes'],
    ];
    const psuLive = s.powerMode.startsWith('psu') && op;
    const cc = psuLive && op!.srcI > s.psu.ilim * 0.98;
    this.set(
      '#power-modes',
      modesP.map(([m, label]) => `<button data-act="power" data-mode="${m}" class="${s.powerMode === m ? 'on' : ''}">${label}</button>`).join(''),
    );
    this.set(
      '#psu-read',
      `<span class="seg">${psuLive ? Math.max(0, op!.srcV).toFixed(2) : '--.--'}<small>V</small></span><span class="seg">${psuLive ? Math.max(0, op!.srcI).toFixed(3) : '-.---'}<small>A</small></span>${cc ? '<span class="cc">CC</span>' : ''}`,
    );
    const vIn = $<HTMLInputElement>('#psu-v');
    const iIn = $<HTMLInputElement>('#psu-i');
    if (document.activeElement !== vIn) vIn.value = s.psu.v.toFixed(1);
    if (document.activeElement !== iIn) iIn.value = s.psu.ilim.toFixed(2);
    this.set(
      '#clips',
      s.powerMode === 'psu-clips' || s.tool === 'clip'
        ? `<button data-act="active-clip" data-which="red" class="lead red ${s.activeClip === 'red' ? 'on' : ''}">● Red clip <span>${s.psu.red ? pointLabel(s, s.psu.red) : 'not placed'}</span></button><button data-act="active-clip" data-which="black" class="lead black ${s.activeClip === 'black' ? 'on' : ''}">● Black clip <span>${s.psu.black ? pointLabel(s, s.psu.black) : 'not placed'}</span></button>`
        : '',
    );
    const clipsMissing = s.powerMode === 'psu-clips' && (!s.psu.red || !s.psu.black);
    this.set(
      '#lamp-state',
      clipsMissing
        ? '<span class="warn">⚠ PSU clips not placed — the board has no power. Use tool 5 to clip them on, or pick "PSU → input".</span>'
        : op
          ? `${op.srcV || op.srcI ? `Input ${Math.max(0, op.srcI).toFixed(3)} A` : 'Running on its battery'}`
          : 'Unpowered',
    );
    const dev = s.board.device;
    const lines = s.idle ? [] : dev.status(s.board, op);
    this.set(
      '#device-status',
      lines.map((l) => `<div class="kv small"><span>${esc(l.label)}</span><b class="${l.ok === undefined ? '' : l.ok ? 'good' : 'muted'}">${esc(l.value)}</b></div>`).join(''),
    );
    this.set(
      '#controls',
      s.idle
        ? ''
        : dev.controls
            .map((c, i) => `<button class="big ctl ${s.board.pressed.includes(c.ref) ? 'on' : ''}" data-ctl="${c.ref}">Hold: ${esc(c.label)} (${c.ref})${i === 0 ? ' · Space' : ''}</button>`)
            .join('') +
          (dev.externals ?? [])
            .map((x) => `<button class="ext ${s.board.attached.includes(x.id) ? 'on' : ''}" data-act="attach" data-id="${x.id}">${s.board.attached.includes(x.id) ? '✓ ' : ''}${esc(x.label)}</button>`)
            .join(''),
    );

    // Toolbar + hint
    for (const b of document.querySelectorAll<HTMLButtonElement>('#toolbar button')) b.classList.toggle('on', b.dataset.tool === s.tool);
    const t = TOOLS.find((x) => x.id === s.tool)!;
    let hint = t.hint;
    if (s.tool === 'jumper' && s.jumperStart) hint = `Wire tacked to ${pointLabel(s, s.jumperStart)} — click the other end (Esc to cancel).`;
    if (s.tool === 'probe') hint = `Left-click a pad to place the <b class="${s.activeProbe === 'red' ? 'red' : 'blk'}">${s.activeProbe.toUpperCase()}</b> probe · right-click places BLACK · right-drag to orbit`;
    if (s.tool === 'clip') hint = `Left-click places the <b class="${s.activeClip === 'red' ? 'red' : 'blk'}">${s.activeClip.toUpperCase()}</b> PSU probe · right-click places BLACK · then set Power → "PSU probes" to inject`;
    this.renderToolbar();
    $('#thermal-btn').style.display = s.owns('thermal-cam') ? '' : 'none';
    $('#thermal-btn').classList.toggle('on', s.thermal);
    $('#scope').style.display = s.owns('oscilloscope') && (s.tool === 'scope' || s.scopePoint) ? '' : 'none';
    this.set('#hint', hint);
  }

  private scopePhase = 0;

  /** Draw the oscilloscope trace (called every frame by the scene loop via tickScope). */
  tickScope(dt: number): void {
    const s = this.s;
    const panel = $('#scope');
    if (!panel || panel.style.display === 'none') return;
    const cv = $<HTMLCanvasElement>('#scope-cv');
    const ctx = cv.getContext('2d')!;
    const W = cv.width;
    const H = cv.height;
    this.scopePhase += dt;
    ctx.fillStyle = '#0b1410';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(120,200,150,0.18)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 10; i++) {
      ctx.beginPath();
      ctx.moveTo((W * i) / 10, 0);
      ctx.lineTo((W * i) / 10, H);
      ctx.stroke();
    }
    for (let j = 1; j < 8; j++) {
      ctx.beginPath();
      ctx.moveTo(0, (H * j) / 8);
      ctx.lineTo(W, (H * j) / 8);
      ctx.stroke();
    }
    const w = s.scope;
    const read = $('#scope-read');
    if (!w) {
      read.innerHTML = '<span class="muted small">Click a pad with the Scope tool (7).</span>';
      return;
    }
    // Auto-scale: fit 0..max(vdc+vpp, 1) V into the screen.
    const top = Math.max(1, Math.abs(w.vdc) + w.vpp) * 1.25;
    const y = (v: number) => H - 12 - (v / top) * (H - 24);
    const ph = this.scopePhase;
    ctx.strokeStyle = '#ffd34d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 2) {
      const t = x / W;
      let v = w.vdc;
      switch (w.kind) {
        case 'square':
          v = (Math.floor(t * 8 + ph * 3) % 2 ? w.vpp : 0) + (Math.random() - 0.5) * 0.05;
          break;
        case 'ripple':
          v = w.vdc + (w.vpp / 2) * Math.sin((t * 5 + ph) * Math.PI * 2) * (1 + 0.4 * Math.sin(t * 31));
          break;
        case 'clock':
          v = w.vdc + (w.vpp / 2) * Math.sin((t * 14 + ph * 6) * Math.PI * 2);
          break;
        case 'data': {
          const bit = Math.sin(Math.floor(t * 40 + ph * 50) * 12.9898) * 43758.5453;
          v = w.vdc + (w.vpp / 2) * (bit - Math.floor(bit) > 0.5 ? 1 : -1) + (Math.random() - 0.5) * 0.06 * w.vpp;
          break;
        }
        case 'audio':
          v = w.vdc + (w.vpp / 2) * Math.sin((t * 3 + ph) * Math.PI * 2);
          break;
        default:
          v = w.vdc + (Math.random() - 0.5) * 0.01 * top;
      }
      if (x === 0) ctx.moveTo(x, y(v));
      else ctx.lineTo(x, y(v));
    }
    ctx.stroke();
    const html = `<div class="kv small"><span>Probe</span><b>${s.scopePoint ? pointLabel(s, s.scopePoint) : '—'}</b></div>
      <div class="kv small"><span>Mean / pk-pk</span><b>${w.vdc.toFixed(2)} V / ${w.vpp.toFixed(2)} V</b></div>
      ${w.freq ? `<div class="kv small"><span>Frequency</span><b>${w.freq}</b></div>` : ''}
      ${s.guided ? `<p class="note small">${esc(w.note)}</p>` : ''}`;
    if (read.dataset.html !== html) {
      read.dataset.html = html;
      read.innerHTML = html;
    }
  }

  /** Case status and the button to the teardown station. */
  private caseRow(): string {
    const s = this.s;
    const def = s.encDef;
    const st = s.enc;
    if (!def || !st) return '';
    const status = assembled(st) ? 'closed' : s.reachable ? 'open' : 'partly open';
    const sticker = st.stickerBroken && def.items.some((i) => i.kind === 'sticker') && !st.removed.includes('sticker') ? '<p class="note small">🔍 The warranty sticker is already torn — someone has been inside this before.</p>' : '';
    return `${sticker}<div class="row"><button data-act="case" title="Take it apart / put it back together">🔧 Case: ${status}</button></div>`;
  }

  private ticketHtml(): string {
    const s = this.s;
    const job = s.job;
    if (s.idle)
      return `<div class="tag">BENCH</div><h2>Nothing on the bench</h2>
        <p class="muted">Pick a customer job or one of your own projects in the office.</p>
        <div class="row"><button class="primary" data-act="office">🏪 Open the office</button></div>`;
    const f = job.faults[0];
    const debug = DEBUG && f ? `<p class="dbg">DEBUG: ${job.faults.map((x) => esc(x.variant + ' — ' + x.summary)).join(' | ')}</p>` : '';
    const nudge = s.guided && f ? `<details><summary>Need a nudge?</summary><p class="muted">${esc(f.hint)}</p></details>` : '';
    if (job.kind === 'project') {
      const p = s.shop.projects.find((x) => x.id === s.shop.active?.id);
      return `<div class="tag">YOUR PROJECT</div>
        <h2>${esc(job.device.name)}</h2>
        <div class="kv"><span>Paid</span><b>$${(p?.paid ?? 0).toFixed(2)}</b></div>
        <div class="kv"><span>Sells for (working)</span><b>~$${(job.device.marketValue * trendMult(s.shop, job.device.id)).toFixed(0)}${trendMult(s.shop, job.device.id) > 1 ? ' 🔥' : ''}</b></div>
        <p class="complaint">Seller said: “${esc(job.complaint)}”</p>
        ${debug}${nudge}${this.caseRow()}
        <div class="row"><button class="primary" data-act="list-sale">List for sale</button><button data-act="store-donor" title="Keep it in the store-room and pull parts later">Store-room</button><button data-act="scrap">Strip all parts</button></div>
        <div class="row"><button data-act="schematic">Service sheet</button><button data-act="pause">Pause → office</button></div>`;
    }
    return `<div class="tag">${job.kind === 'warranty' ? 'WARRANTY RETURN' : 'REPAIR TICKET'} · #${job.seed}</div>
      <h2>${esc(jobName(job))}</h2>
      <div class="kv"><span>Customer</span><b>${esc(job.customer)}</b></div>
      <div class="kv"><span>Quote</span><b>${job.kind === 'warranty' ? 'free (your warranty)' : '$' + job.quote}</b></div>
      <div class="kv"><span>Previous repair</span><b>${job.previousRepair}</b></div>
      ${job.previousRepairNote ? `<p class="quote">“${esc(job.previousRepairNote)}”</p>` : ''}
      <p class="complaint">“${esc(job.complaint)}”</p>
      ${s.hold ? `<p class="note small">⏳ ${esc(s.hold.note)} — they'll wait until day ${s.hold.until}.</p>` : ''}
      ${debug}${nudge}${this.caseRow()}
      ${job.device.cartFor ? '<div class="row"><button data-act="station">📺 Test Station</button></div>' : ''}
      <div class="row"><button class="primary" data-act="return">Return to customer</button><button data-act="schematic">Service sheet</button></div>
      <div class="row"><button data-act="call" title="Next-day parts, waiting for a donor, or buying it for parts">📞 Call customer</button></div>
      <div class="row"><button data-act="pause">Pause → office</button>${job.kind === 'customer' ? '<button data-act="give-up">Give up</button>' : ''}</div>`;
  }

  private cardHtml(ref: string): string {
    const s = this.s;
    const c = s.board.comps[ref];
    const fp = part(c.def.partNo);
    const p = c.part;
    const magnified = this.scene.zoom < 70;
    const obs: string[] = [];
    if (!p) obs.push('Empty footprint — the part has been removed.');
    for (const m of c.marks) if (MARK_TEXT[m] && !(m === 'rework-residue' && s.fluxed.has(ref))) obs.push(MARK_TEXT[m]);
    if (s.fluxed.has(ref)) obs.push('Fresh flux applied.');
    if (c.burnt) obs.push('The part itself looks cooked.');
    if (p && c.reversed && (p.kind === 'electrolytic' || p.kind === 'diode' || p.kind === 'tvs' || p.kind === 'led' || p.kind === 'zener')) {
      if (p.kind === 'electrolytic' || magnified) obs.push(`Its polarity marking is on the opposite side to the silkscreen mark!`);
    }
    if (p && p.partNo !== c.def.partNo && magnified && p.marking !== fp.marking) obs.push(`Marked "${p.marking}" — the parts list says this should be "${fp.marking || fp.label}".`);
    const lifted = s.board.liftedPads.filter((k) => k.startsWith(`${ref}.`)).map((k) => k.split('.')[1]);
    for (const pin of lifted) obs.push(`The ${pin} pad has been torn off the board!`);
    const joints = Object.entries(c.joints);
    if (p && !p.plugIn) {
      if (magnified) {
        for (const [pin, j] of joints) {
          if (j.cracked) obs.push(`🔍 A ring-shaped crack around the solder joint on pin ${pin}.`);
          if (j.cold) obs.push(`🔍 The joint on pin ${pin} looks dull and grainy.`);
        }
      } else if (joints.length) obs.push('<span class="muted">Zoom in closer to inspect the solder joints.</span>');
    }
    if (!obs.length) obs.push('Looks normal.');

    const temp = s.temps[ref] ?? 25;
    const touch =
      temp < 33 ? 'room temperature' : temp < 45 ? 'slightly warm' : temp < 60 ? '<b class="warn">warm</b>' : temp < 85 ? '<b class="bad">hot!</b>' : '<b class="bad">ouch — too hot to touch!</b>';
    const isTp = fp.kind === 'testpoint';
    const stockLine = (pn: string) => {
      const sl = this.s.shop.stock[pn] ?? { new: 0, used: 0 };
      return sl;
    };
    if (fp.plugIn) {
      const sl = stockLine(fp.partNo);
      const unplugged = !p || c.unplugged;
      return `<div class="card-head"><h3>${ref}</h3><button class="x" data-act="deselect" aria-label="Close">×</button></div>
      <div class="muted">${esc(c.def.role)} · plug-in module</div>
      <div class="kv"><span>Fitted</span><b>${p ? esc(p.label) : '—'}</b></div>
      <div class="kv"><span>Connection</span><b class="${unplugged ? 'warn' : ''}">${unplugged ? 'unplugged' : 'plugged in'}</b></div>
      <ul class="obs">${obs.map((o) => `<li>${o}</li>`).join('')}</ul>
      ${s.op || temp > 33 ? `<div class="kv"><span>Finger test</span><span>${touch}</span></div>` : ''}
      ${s.guided && p ? `<details><summary>Datasheet</summary><p class="muted small">${esc(p.description)}</p></details>` : ''}
      <div class="row small">
        ${p ? `<button data-act="plug" data-ref="${ref}" data-on="${unplugged ? '1' : '0'}">${unplugged ? '🔌 Plug in' : '⏏ Unplug'}</button>` : ''}
        ${sl.new ? `<button class="primary" data-act="swap-module" data-ref="${ref}" data-kind="new">Fit new (${sl.new})</button>` : ''}
        ${sl.used ? `<button data-act="swap-module" data-ref="${ref}" data-kind="used">Fit used (${sl.used})</button>` : ''}
      </div>
      ${!sl.new && !sl.used ? `<p class="muted small">No spare ${esc(fp.label)} on the shelf — special-order one in the office or pull one off a donor in the store-room.</p>` : ''}
      <p class="muted small">Modules plug in — no soldering. Unplug one to measure it on its own.</p>`;
    }
    const jumpers = s.board.jumpers.filter((j) => !j.bridge && (j.a.ref === ref || j.b.ref === ref));
    return `<div class="card-head"><h3>${ref}</h3><button class="x" data-act="deselect" aria-label="Close">×</button></div>
      <div class="muted">${esc(c.def.role)} · ${fp.pkg}</div>
      <div class="kv"><span>Fitted</span><b>${p ? esc(p.label) : '—'}</b></div>
      ${p?.marking ? `<div class="kv"><span>Marking</span><b class="mono">${magnified || p.pkg !== '0603' ? esc(p.marking) : '<span class="muted">zoom in to read</span>'}</b></div>` : ''}
      <ul class="obs">${obs.map((o) => `<li>${o}</li>`).join('')}</ul>
      ${s.op || temp > 33 ? `<div class="kv"><span>Finger test</span><span>${touch}</span></div>` : ''}
      ${s.guided && p ? `<details><summary>Datasheet</summary><p class="muted small">${esc(p.description)}</p></details>` : ''}
      ${
        isTp
          ? ''
          : `<div class="row small">
        <button class="primary" data-act="rework">🔬 Rework at the microscope</button>
        ${scrubbable(c) ? '<button data-act="contacts">🧽 Clean the contacts</button>' : ''}
      </div>`
      }
      ${jumpers.map((j) => `<div class="kv small"><span>Jumper ${j.id}</span><button data-act="jumper-del" data-id="${j.id}">Remove wire</button></div>`).join('')}`;
  }
}
