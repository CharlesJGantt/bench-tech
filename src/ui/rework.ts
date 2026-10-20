import { FOOTPRINTS } from '../sim/footprints';
import { crustSpeckles, hashStr } from '../sim/corrosion';
import { PARTS, POLARIZED, type PartSpec } from '../sim/parts';
import {
  bridgeVisible,
  cutWick,
  maxZoom,
  say,
  type ScopeView,
  meltOf,
  aligned,
  click,
  dropHeld,
  initRework,
  jointResults,
  pickFromTray,
  rotatable,
  rotateHeld,
  step,
  type PlacedPart,
  type ReworkState,
  type ReworkTool,
} from '../rework/model';
import type { Session } from '../game/session';
import { FLUX_GRADES, NOT_SOLD, SUPPLIES, TOOLS as KIT_TOOLS, WICKS, tool as toolDef, type SupplyId } from '../business/economy';
import { isSpecialOrder, returnPart, rushBuy, rushPrice, stockOf, takePart } from '../business/shop';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

const TOOLS: { id: ReworkTool; key: string; name: string; tip: string }[] = [
  { id: 'iron', key: '1', name: 'Iron', tip: 'Hold on a pad to heat it. Hold Space while heating to feed solder.' },
  { id: 'wick', key: '2', name: 'Wick', tip: 'Hold on a molten pad to soak the solder up. Works far better with flux.' },
  { id: 'flux', key: '3', name: 'Flux', tip: 'Paint flux on the pads. Helps heat flow, cleans old solder, stops cold joints.' },
  { id: 'tweezers', key: '4', name: 'Tweezers', tip: 'Click a part to lift it (all joints must be molten). Click to place a held part. R rotates.' },
  { id: 'hotair', key: '5', name: 'Hot air', tip: 'Hold over the part to heat every joint at once. Slower, but even.' },
  { id: 'ipa', key: '6', name: 'Liquid', tip: 'Hold to apply the cleaning liquid chosen in the kit (IPA, flux remover or corrosion cleaner). It evaporates in a few seconds.' },
  { id: 'brush', key: '7', name: 'Brush', tip: 'Anti-static scrub brush: scrub back and forth on wet IPA to loosen the flux.' },
  { id: 'wipe', key: '8', name: 'Wipe', tip: 'Lint-free wipe: drag across to lift the dissolved flux before the IPA dries.' },
];

const RESULT_TEXT: Record<string, string> = {
  good: '✓ good',
  unchanged: '· untouched',
  cold: '✗ cold/grainy',
  weak: '✗ weak (low-melt alloy left in it)',
  starved: '✗ too little solder',
  excess: '! blob of solder',
  open: '✗ not soldered',
  lifted: '✗ pad lifted',
};

/** The microscope rework station: a hands-on close-up of one footprint. */
export class ReworkStation {
  private st!: ReworkState;

  /** Live state of the bench (read by the tutorial). */
  get state(): ReworkState {
    return this.st;
  }
  private canvas!: HTMLCanvasElement;
  private tool: ReworkTool = 'iron';
  private mouse: { x: number; y: number } | null = null;
  private down = false;
  private feeding = false;
  /** Cursor travel since the last step (mm), for scrubbing and wiping. */
  private moved = 0;
  private raf = 0;
  private timer = 0;
  private last = 0;
  private scale = 60;
  /** Microscope view: zoom (wheel), pan offset in mm (right-drag), ring light (L), tilt (T). */
  private view: ScopeView = { zoom: 1, ring: false, tilt: false };
  private ox = 0;
  private oy = 0;
  private panning: { x: number; y: number } | null = null;
  private bubbles: { x: number; y: number; t: number }[] = [];
  private keyDown = (e: KeyboardEvent) => this.onKey(e, true);
  private keyUp = (e: KeyboardEvent) => this.onKey(e, false);

  constructor(
    private session: Session,
    private host: HTMLElement,
    private done: (summary: string | null) => void,
  ) {}

  open(ref: string): void {
    const s = this.session;
    if (s.powerMode !== 'off') s.setPowerMode('off');
    this.st = initRework(s.board, ref, s.supplies, s.kit);
    const c = s.board.comps[ref];
    const fp = this.st.footprint;
    const tray = Object.values(PARTS).filter((p) => p.pkg === fp.pkg && p.kind !== 'testpoint');
    this.host.innerHTML = `
      <div class="rw">
        <div class="rw-head">
          <h2>🔬 Rework — ${ref} <span class="muted">${esc(c.def.role)} · ${fp.pkg}</span></h2>
          <label class="rw-temp">Iron <input type="range" id="rw-temp" min="200" max="450" step="10" value="330"> <b id="rw-temp-v">330°C</b></label>
          <label class="rw-temp">Air <input type="range" id="rw-air" min="150" max="450" step="10" value="340"> <b id="rw-air-v">340°C</b></label>
          <div class="row" style="margin:0"><button class="primary" id="rw-done" title="Leave the microscope. Everything you did stays done (Esc).">✓ Done</button><button id="rw-cancel" title="Put the board back exactly as it was when you sat down">↶ Undo all</button></div>
        </div>
        <div class="rw-main">
          <canvas id="rw-canvas"></canvas>
          <aside class="rw-side">
            <div class="rw-tools">${TOOLS.map((t) => `<button data-rw-tool="${t.id}" title="${esc(t.tip)}"><kbd>${t.key}</kbd>${t.name}</button>`).join('')}</div>
            <p id="rw-tip" class="muted small"></p>
            <div class="rw-kit" id="rw-kit"></div>
            <div class="rw-cons" id="rw-cons"></div>
            <h3>Parts tray</h3>
            <div class="rw-tray" id="rw-tray"></div>
            <p class="muted small">Board calls for: <b>${esc(fp.label)}</b>${POLARIZED.includes(fp.kind) ? ' — polarised, match the silkscreen mark (R to rotate).' : ''}</p>
            <h3>Joints</h3>
            <div id="rw-joints"></div>
            <div id="rw-guide" class="note"></div>
            <div id="rw-msgs" class="rw-msgs"></div>
          </aside>
        </div>
      </div>`;
    this.canvas = this.host.querySelector('#rw-canvas') as HTMLCanvasElement;
    const temp = this.host.querySelector('#rw-temp') as HTMLInputElement;
    temp.addEventListener('input', () => {
      this.st.ironTemp = parseInt(temp.value, 10);
      (this.host.querySelector('#rw-temp-v') as HTMLElement).textContent = `${temp.value}°C`;
    });
    this.host.querySelectorAll<HTMLButtonElement>('[data-rw-tool]').forEach((b) => b.addEventListener('click', () => this.setTool(b.dataset.rwTool as ReworkTool)));
    this.trayParts = tray.map((p) => p.partNo);
    this.renderTray();
    (this.host.querySelector('#rw-tray') as HTMLElement).addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-rw-part]');
      if (b) this.takeFromTray(b.dataset.rwPart!, b.dataset.rwKind as 'new' | 'used' | 'rush');
    });
    const air = this.host.querySelector('#rw-air') as HTMLInputElement;
    air.addEventListener('input', () => {
      this.st.hotAirTemp = parseInt(air.value, 10);
      (this.host.querySelector('#rw-air-v') as HTMLElement).textContent = `${air.value}°C`;
    });
    this.renderKit();
    (this.host.querySelector('#rw-cons') as HTMLElement).addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('[data-rw-cut]')) cutWick(this.st);
    });
    (this.host.querySelector('#rw-kit') as HTMLElement).addEventListener('change', (e) => {
      const sel = e.target as HTMLSelectElement;
      this.chooseKit(sel.dataset.kit as 'tip' | 'nozzle' | 'wick' | 'flux' | 'solder' | 'liquid', sel.value);
    });
    (this.host.querySelector('#rw-done') as HTMLElement).addEventListener('click', () => this.finish(true));
    (this.host.querySelector('#rw-cancel') as HTMLElement).addEventListener('click', () => {
      if (confirm('Undo everything you did at the microscope this time? Supplies you used are still gone.')) this.finish(false);
    });

    const cv = this.canvas;
    cv.addEventListener('pointerdown', (e) => {
      cv.setPointerCapture(e.pointerId);
      this.mouse = this.toMm(e);
      if (e.button === 2 && this.view.zoom > 1) this.panning = { x: e.clientX, y: e.clientY };
      if (e.button !== 0) return;
      this.down = true;
      if (this.tool === 'tweezers') click(this.st, this.tool, this.mouse.x, this.mouse.y);
    });
    cv.addEventListener('pointermove', (e) => {
      if (this.panning) {
        this.ox -= (e.clientX - this.panning.x) / this.scale;
        this.oy -= (e.clientY - this.panning.y) / this.scale;
        this.panning = { x: e.clientX, y: e.clientY };
      }
      const m = this.toMm(e);
      if (this.mouse && this.down) this.moved += Math.hypot(m.x - this.mouse.x, m.y - this.mouse.y);
      this.mouse = m;
    });
    cv.addEventListener('pointerup', () => {
      this.down = false;
      this.panning = null;
    });
    cv.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const max = maxZoom(this.session.shop.tools);
        const z = Math.min(max, Math.max(1, this.view.zoom * Math.exp(-Math.max(-600, Math.min(600, e.deltaY)) * 0.0015)));
        if (z === this.view.zoom) {
          if (e.deltaY < 0 && max < 4) say(this.st, `That is as far as this objective goes (${max}×). A stronger objective in the office's Tools tab zooms further.`);
          return;
        }
        // Keep the point under the cursor fixed while zooming
        const r = cv.getBoundingClientRect();
        const m = this.toMm(e);
        this.scale = (this.scale / this.view.zoom) * z;
        this.view.zoom = z;
        this.ox = z === 1 ? 0 : m.x - (e.clientX - r.left - r.width / 2) / this.scale;
        this.oy = z === 1 ? 0 : m.y - (e.clientY - r.top - r.height / 2) / this.scale;
      },
      { passive: false },
    );
    cv.addEventListener('pointerleave', () => {
      this.down = false;
      this.panning = null;
      this.mouse = null;
    });
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', this.keyDown);
    window.addEventListener('keyup', this.keyUp);

    this.setTool('iron');
    this.last = performance.now();
    // Physics runs on a fixed timer so it keeps going even if animation frames are throttled;
    // drawing happens on animation frames.
    this.timer = window.setInterval(() => {
      const t = performance.now();
      let left = Math.min(1, (t - this.last) / 1000);
      this.last = t;
      while (left > 1e-4) {
        const dt = Math.min(1 / 60, left);
        left -= dt;
        step(this.st, dt, { tool: this.tool, pos: this.mouse, down: this.down && !!this.mouse, feeding: this.feeding, move: this.moved });
        this.moved = 0;
      }
    }, 16);
    let lastDraw = performance.now();
    const frame = (t: number) => {
      this.draw(Math.min(0.05, (t - lastDraw) / 1000));
      lastDraw = t;
      this.panel();
      this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
  }

  /** Kit selectors: only tools you own and supplies you have in stock. */
  private renderKit(): void {
    const el = this.host.querySelector('#rw-kit');
    if (!el) return;
    const shop = this.session.shop;
    const k = shop.kit;
    const sel = (key: string, label: string, opts: [string, string][], cur: string) =>
      `<label>${label}<select data-kit="${key}">${opts.map(([v, t]) => `<option value="${v}" ${v === cur ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`;
    const owned = (kind: 'tip' | 'nozzle') => KIT_TOOLS.filter((t) => t.kind === kind && shop.tools.includes(t.id)).map((t) => [t.id, t.name] as [string, string]);
    const stocked = (ids: SupplyId[]) => ids.map((id) => [id, `${SUPPLIES[id].name} (${shop.supplies[id]} ${SUPPLIES[id].unit})`] as [string, string]);
    el.innerHTML = [
      sel('tip', 'Iron tip', owned('tip'), k.tip),
      sel('nozzle', 'Nozzle', owned('nozzle'), k.nozzle),
      sel('wick', 'Wick', stocked(Object.keys(WICKS) as SupplyId[]), k.wick),
      sel('flux', 'Flux', stocked(Object.keys(FLUX_GRADES) as SupplyId[]), k.flux),
      sel('solder', 'Solder', stocked(['solder', 'lowmelt']), k.solder),
      sel('liquid', 'Cleaning liquid', stocked(['ipa', 'flux-cleaner', 'corrosion-cleaner']), k.liquid ?? 'ipa'),
    ].join('');
  }

  private chooseKit(key: 'tip' | 'nozzle' | 'wick' | 'flux' | 'solder' | 'liquid', value: string): void {
    const shop = this.session.shop;
    // Each wick roll keeps its own (possibly silver) end.
    shop.wickLoad[this.st.kit.wick.supply] = this.st.kit.wickLoad;
    shop.kit[key] = value;
    const kit = this.session.kit;
    // Keep brush wear from this session; swap everything else.
    this.st.kit = { ...kit, brushWear: this.st.kit.brushWear };
    const name = key === 'tip' || key === 'nozzle' ? toolDef(value).name : SUPPLIES[value as SupplyId].name;
    this.st.messages.push(`Switched to: ${name}.`);
    this.session.save();
  }

  private trayParts: string[] = [];
  /** Parts taken from shop stock during this session (returned on Cancel). */
  private taken: { partNo: string; kind: 'new' | 'used' }[] = [];

  /** Parts tray backed by the shop's real stock. */
  private renderTray(): void {
    const el = this.host.querySelector('#rw-tray');
    if (!el) return;
    const shop = this.session.shop;
    el.innerHTML = this.trayParts
      .map((partNo) => {
        const p = PARTS[partNo];
        const sl = stockOf(shop, partNo);
        const btns: string[] = [];
        if (sl.new) btns.push(`<button data-rw-part="${partNo}" data-rw-kind="new">New (${sl.new})</button>`);
        if (sl.used) btns.push(`<button data-rw-part="${partNo}" data-rw-kind="used" title="Salvaged from a donor board">Used (${sl.used})</button>`);
        if (!sl.new && !sl.used)
          btns.push(
            NOT_SOLD.has(partNo)
              ? `<span class="muted small">none — salvage only</span>`
              : isSpecialOrder(partNo)
                ? `<span class="muted small">none — special order (office) or pull one from a donor</span>`
                : `<button data-rw-part="${partNo}" data-rw-kind="rush" title="Buy one from the local store now">Rush buy $${rushPrice(partNo).toFixed(2)}</button>`,
          );
        return `<div class="rw-tray-row" title="${esc(p.description)}"><div><b>${esc(p.label)}</b><span>${p.marking ? `"${esc(p.marking)}"` : ''}</span></div><div class="rw-tray-btns">${btns.join('')}</div></div>`;
      })
      .join('');
  }

  private takeFromTray(partNo: string, kind: 'new' | 'used' | 'rush'): void {
    const shop = this.session.shop;
    if (this.st.held) {
      pickFromTray(this.st, partNo); // explains that the tweezers are full
      return;
    }
    if (kind === 'rush' && !rushBuy(shop, partNo)) return;
    const got = takePart(shop, partNo, kind === 'used' ? 'used' : 'new');
    if (!got) return;
    this.taken.push({ partNo, kind: got });
    pickFromTray(this.st, partNo);
    this.setTool('tweezers');
    this.renderTray();
    this.session.save();
  }

  private setTool(t: ReworkTool): void {
    this.tool = t;
    this.host.querySelectorAll<HTMLButtonElement>('[data-rw-tool]').forEach((b) => b.classList.toggle('on', b.dataset.rwTool === t));
    const tip = this.host.querySelector('#rw-tip');
    if (tip) tip.textContent = TOOLS.find((x) => x.id === t)!.tip;
  }

  private onKey(e: KeyboardEvent, down: boolean): void {
    if ((e.target as HTMLElement)?.tagName === 'INPUT' && e.code !== 'Space') return;
    if (e.code === 'Space') {
      e.preventDefault();
      this.feeding = down;
      return;
    }
    if (!down) return;
    const t = TOOLS.find((x) => x.key === e.key);
    if (t) this.setTool(t.id);
    if (e.key === 'r' || e.key === 'R') rotateHeld(this.st);
    if (e.key === 'c' || e.key === 'C') cutWick(this.st);
    if (e.key === 'l' || e.key === 'L') this.toggleView('ring', 'ring-light', 'an LED ring light');
    if (e.key === 't' || e.key === 'T') this.toggleView('tilt', 'tilt-mount', 'a tilting microscope arm');
    if (e.key === '0') {
      this.view.zoom = 1;
      this.ox = this.oy = 0;
    }
    if (e.key === 'Delete' || e.key === 'Backspace') dropHeld(this.st);
    if (e.key === 'Escape') this.finish(true);
  }

  private toggleView(key: 'ring' | 'tilt', toolId: string, name: string): void {
    if (!this.session.shop.tools.includes(toolId)) {
      say(this.st, `You need ${name} for that — buy one in the office (Tools tab).`);
      return;
    }
    this.view[key] = !this.view[key];
  }

  private finish(apply: boolean): void {
    cancelAnimationFrame(this.raf);
    clearInterval(this.timer);
    window.removeEventListener('keydown', this.keyDown);
    window.removeEventListener('keyup', this.keyUp);
    let summary: string | null = null;
    if (apply) {
      // A new part still in the tweezers goes back in the drawer.
      const held = this.st.held;
      if (held && !held.original) {
        const i = this.taken.findIndex((t) => t.partNo === held.spec.partNo);
        if (i >= 0) returnPart(this.session.shop, this.taken.splice(i, 1)[0].partNo, 'new');
        this.st.held = null;
      }
      summary = this.session.doRework(this.st);
    } else this.session.cancelRework(this.st, this.taken);
    this.done(summary);
  }

  // ---------------------------------------------------------------- drawing

  private toMm(e: PointerEvent | WheelEvent): { x: number; y: number } {
    const r = this.canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left - r.width / 2) / this.scale + this.ox, y: (e.clientY - r.top - r.height / 2) / this.scale + this.oy };
  }

  private draw(dt: number): void {
    const cv = this.canvas;
    const r = cv.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    if (cv.width !== Math.round(r.width * dpr) || cv.height !== Math.round(r.height * dpr)) {
      cv.width = Math.round(r.width * dpr);
      cv.height = Math.round(r.height * dpr);
    }
    const ctx = cv.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const W = r.width;
    const H = r.height;
    const st = this.st;
    const spanX = Math.max(...st.pads.map((p) => Math.abs(p.x) + p.w / 2)) * 2 + 7;
    const spanY = Math.max(...st.pads.map((p) => Math.abs(p.y) + p.h / 2)) * 2 + 7;
    const S = (this.scale = Math.min(W / spanX, H / spanY) * this.view.zoom);
    // Keep the pan inside the footprint area
    this.ox = Math.max(-spanX / 2, Math.min(spanX / 2, this.ox));
    this.oy = Math.max(-spanY / 2, Math.min(spanY / 2, this.oy));
    const X = (x: number) => W / 2 + (x - this.ox) * S;
    const Y = (y: number) => H / 2 + (y - this.oy) * S;

    // Solder mask with a vignette like a microscope view
    ctx.fillStyle = '#1e6e40';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let x = -H; x < W; x += 0.6 * S) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + H, H);
      ctx.stroke();
    }

    // Silkscreen outline + polarity mark
    const c = this.session.board.comps[st.ref];
    const fpd = FOOTPRINTS[st.footprint.pkg];
    const swap = c.def.rot === 90 || c.def.rot === 270;
    const bw = (swap ? fpd.h : fpd.w) + 0.7;
    const bh = (swap ? fpd.w : fpd.h) + 0.7;
    ctx.strokeStyle = 'rgba(240,240,232,0.85)';
    ctx.lineWidth = Math.max(1, 0.12 * S);
    if (st.footprint.pkg !== 'TP') ctx.strokeRect(X(-bw / 2), Y(-bh / 2), bw * S, bh * S);
    const kIdx = st.pads.findIndex((p) => p.pin === 'K' || p.pin === '-');
    if (kIdx >= 0 && POLARIZED.includes(st.footprint.kind)) {
      const k = st.pads[kIdx];
      ctx.fillStyle = 'rgba(240,240,232,0.9)';
      ctx.font = `bold ${0.9 * S}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = st.footprint.kind === 'electrolytic' ? '−' : '▮';
      ctx.fillText(label, X(k.x * 1.9), Y(k.y * 1.9));
    }

    // Bridges under the pads' solder (fine whiskers only show with enough zoom or a ring light)
    for (const [i, j, kind] of st.bridges) {
      if (kind === 'ball' || !bridgeVisible(kind, this.view)) continue;
      const a = st.pads[i];
      const b = st.pads[j];
      ctx.strokeStyle = kind === 'whisker' ? (this.view.ring ? '#ffffff' : '#dfe3e6') : '#cfd4d8';
      ctx.lineCap = 'round';
      ctx.lineWidth = kind === 'whisker' ? Math.max(1, 0.06 * S) : Math.min(a.w, a.h) * 0.8 * S;
      ctx.beginPath();
      ctx.moveTo(X(a.x), Y(a.y));
      if (kind === 'whisker') ctx.quadraticCurveTo(X((a.x + b.x) / 2 + 0.15), Y((a.y + b.y) / 2 - 0.1), X(b.x), Y(b.y));
      else ctx.lineTo(X(b.x), Y(b.y));
      ctx.stroke();
    }

    // Pad copper first; the part sits on top; solder fillets are drawn over the part's ends.
    st.pads.forEach((p) => {
      if (p.lifted) return;
      ctx.fillStyle = p.solder < 0.08 ? '#c98a52' : p.dirty ? '#8e9295' : '#d7dadd';
      ctx.fillRect(X(p.x - p.w / 2), Y(p.y - p.h / 2), p.w * S, p.h * S);
    });
    // Tilted, you can look in under the part's body: it is drawn see-through, with any solder balls
    if (st.part) this.drawPart(ctx, st.part, X, Y, S, this.view.tilt ? 0.3 : 1);
    if (this.view.tilt)
      for (const [i, j, kind] of st.bridges) {
        if (kind !== 'ball') continue;
        const mx = (st.pads[i].x + st.pads[j].x) / 2;
        const my = (st.pads[i].y + st.pads[j].y) / 2;
        const g = ctx.createRadialGradient(X(mx) - 0.08 * S, Y(my) - 0.08 * S, 1, X(mx), Y(my), 0.3 * S);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(1, '#8d9399');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(X(mx), Y(my), 0.3 * S, 0, Math.PI * 2);
        ctx.fill();
      }

    const color = this.session.board.comps[st.ref].corr?.color ?? 'green';
    // Solder: copper → tinned → blob; dull when old/oxidised, bright when molten
    st.pads.forEach((p) => {
      const x0 = X(p.x - p.w / 2);
      const y0 = Y(p.y - p.h / 2);
      if (p.lifted) {
        ctx.fillStyle = '#7a5a2e';
        ctx.fillRect(x0, y0, p.w * S, p.h * S);
        ctx.strokeStyle = '#3d2b14';
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(x0, y0, p.w * S, p.h * S);
        ctx.setLineDash([]);
        return;
      }
      const molten = p.temp >= meltOf(p);
      // With a part fitted, the fillet sits on the outer end of the pad (away from the body).
      const len = Math.hypot(p.x, p.y) || 1;
      const out = st.part ? 0.28 : 0;
      const fx = p.x + (p.x / len) * Math.min(p.w, p.h) * out;
      const fy = p.y + (p.y / len) * Math.min(p.w, p.h) * out;
      if (p.solder >= 0.08) {
        const amt = Math.min(3, p.solder);
        const rx = (p.w / 2) * S * Math.min(1.25, 0.55 + amt * 0.3);
        const ry = (p.h / 2) * S * Math.min(1.25, 0.55 + amt * 0.3);
        const g = ctx.createRadialGradient(X(fx) - rx * 0.3, Y(fy) - ry * 0.35, 1, X(fx), Y(fy), Math.max(rx, ry));
        const hi = molten ? '#ffffff' : p.lowmelt > 0.15 ? '#c7d3df' : p.dirty ? '#b2b5b8' : '#f4f6f7';
        const lo = molten ? '#c9cdd1' : p.lowmelt > 0.15 ? '#7f93a8' : p.dirty ? '#6d7174' : '#9aa0a5';
        g.addColorStop(0, hi);
        g.addColorStop(1, lo);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(X(fx), Y(fy), rx * (st.part ? 0.75 : 1), ry * (st.part ? 0.75 : 1), 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // Heat glow
      const heat = Math.max(0, Math.min(1, (p.temp - 60) / 340));
      if (heat > 0) {
        ctx.fillStyle = `rgba(255,${Math.round(140 - heat * 100)},40,${heat * 0.35})`;
        ctx.fillRect(x0 - 0.15 * S, y0 - 0.15 * S, (p.w + 0.3) * S, (p.h + 0.3) * S);
      }
      // Flux
      if (p.flux > 0.02) {
        ctx.fillStyle = `rgba(214,160,50,${0.12 + p.flux * 0.4})`;
        ctx.beginPath();
        ctx.ellipse(X(p.x), Y(p.y), (p.w / 2 + 0.5) * S, (p.h / 2 + 0.5) * S, 0, 0, Math.PI * 2);
        ctx.fill();
        if (p.temp > 180 && Math.random() < dt * 25) this.bubbles.push({ x: p.x + (Math.random() - 0.5) * p.w, y: p.y + (Math.random() - 0.5) * p.h, t: 0 });
      }
      // Corrosion crust: mottled speckles (same pattern as on the board); sludge is a wet grey-green smear
      if (p.crust > 0.02) {
        for (const sp of crustSpeckles(hashStr(`${st.ref}.${p.pin}`), p.crust, Math.max(p.w, p.h) / 2, color)) {
          // Finer, denser grain under magnification
          ctx.fillStyle = `rgba(${sp.rgb[0]},${sp.rgb[1]},${sp.rgb[2]},${Math.min(0.95, sp.a + 0.2)})`;
          ctx.beginPath();
          ctx.arc(X(p.x + sp.x), Y(p.y + sp.y), sp.r * S * 0.45, 0, Math.PI * 2);
          ctx.fill();
        }
        if (st.fizz > 0 && p.ipa > 0.1 && Math.random() < dt * 40)
          this.bubbles.push({ x: p.x + (Math.random() - 0.5) * (p.w + 1.5), y: p.y + (Math.random() - 0.5) * (p.h + 1.5), t: 0 });
      }
      if (p.sludge > 0.02) {
        ctx.fillStyle = `rgba(118,130,96,${Math.min(0.7, 0.2 + p.sludge * 0.8)})`;
        ctx.beginPath();
        ctx.ellipse(X(p.x), Y(p.y), (p.w / 2 + 0.9) * S, (p.h / 2 + 0.9) * S, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // Dried white residue
      if (p.white > 0.02) {
        ctx.fillStyle = `rgba(235,235,225,${Math.min(0.75, 0.2 + p.white * 0.6)})`;
        for (let k = 0; k < 7; k++) {
          const a = (k / 7) * Math.PI * 2 + p.x;
          ctx.beginPath();
          ctx.arc(X(p.x + Math.cos(a) * (p.w / 2 + 0.3)), Y(p.y + Math.sin(a) * (p.h / 2 + 0.3)), 0.25 * S, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // Wet IPA sheen, cloudy where flux is dissolved in it
      if (p.ipa > 0.02) {
        const tint = p.solvent === 'corrosion-cleaner' ? '235,200,215' : p.solvent === 'flux-cleaner' ? '230,235,200' : '200,225,255';
        ctx.fillStyle = p.dissolved > 0.05 ? `rgba(225,200,150,${0.15 + p.ipa * 0.3})` : `rgba(${tint},${p.ipa * 0.35})`;
        ctx.beginPath();
        ctx.ellipse(X(p.x), Y(p.y), (p.w / 2 + 1) * S, (p.h / 2 + 1) * S, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Flux fumes
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (const b of this.bubbles) {
      b.t += dt;
      ctx.globalAlpha = Math.max(0, 0.6 - b.t);
      ctx.beginPath();
      ctx.arc(X(b.x + b.t * 0.6), Y(b.y - b.t * 2), (0.08 + b.t * 0.25) * S, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    this.bubbles = this.bubbles.filter((b) => b.t < 0.6);

    // Part held in the tweezers
    if (st.held && this.mouse && this.tool === 'tweezers') this.drawPart(ctx, { ...st.held, dx: this.mouse.x, dy: this.mouse.y }, X, Y, S, 0.75);

    // Tool cursor
    const m = this.mouse;
    if (m) {
      const mx = X(m.x);
      const my = Y(m.y);
      ctx.lineWidth = 2;
      switch (this.tool) {
        case 'iron':
          ctx.strokeStyle = this.down ? '#ff8a3d' : '#c9ced3';
          ctx.fillStyle = this.down ? 'rgba(255,138,61,0.25)' : 'rgba(200,205,210,0.15)';
          ctx.beginPath();
          ctx.arc(mx, my, Math.max(0.3, st.kit.tip.radius) * S, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          if (this.feeding) {
            ctx.strokeStyle = st.kit.solder === 'lowmelt' ? '#9fb3c8' : '#d9dde0';
            ctx.lineWidth = Math.max(2, 0.3 * S);
            ctx.beginPath();
            ctx.moveTo(mx + 0.4 * S, my - 0.2 * S);
            ctx.lineTo(mx + 4 * S, my - 3 * S);
            ctx.stroke();
          }
          break;
        case 'wick': {
          const w = st.kit.wick.width * S;
          // Copper braid turns silver as it fills with solder.
          const k = Math.min(1, st.kit.wickLoad);
          const mix = (a: number[], b: number[]) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(',')})`;
          ctx.fillStyle = mix([184, 109, 52], [200, 204, 208]);
          ctx.fillRect(mx - w / 2, my - w * 0.35, w, w * 0.7);
          // the fresh braid trailing off behind the end
          ctx.fillStyle = '#b86d34';
          ctx.fillRect(mx - w / 2, my + w * 0.35, w, w * 1.6);
          ctx.strokeStyle = mix([122, 69, 32], [140, 144, 150]);
          ctx.lineWidth = 1;
          for (let i = -4; i <= 4; i++) {
            ctx.beginPath();
            ctx.moveTo(mx + (i * w) / 9 - w * 0.1, my - w * 0.35);
            ctx.lineTo(mx + (i * w) / 9 + w * 0.1, my + w * 0.35);
            ctx.stroke();
          }
          break;
        }
        case 'hotair':
          ctx.strokeStyle = this.down ? 'rgba(255,120,60,0.9)' : 'rgba(255,255,255,0.6)';
          ctx.setLineDash([6, 5]);
          ctx.beginPath();
          ctx.arc(mx, my, st.kit.nozzle.radius * S, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          break;
        case 'flux':
          ctx.strokeStyle = 'rgba(230,180,70,0.9)';
          ctx.beginPath();
          ctx.arc(mx, my, 1.2 * S, 0, Math.PI * 2);
          ctx.stroke();
          break;
        case 'tweezers':
          ctx.strokeStyle = '#d0d4d8';
          ctx.beginPath();
          ctx.moveTo(mx - 0.25 * S, my);
          ctx.lineTo(mx - 1.5 * S, my - 5 * S);
          ctx.moveTo(mx + 0.25 * S, my);
          ctx.lineTo(mx + 1.5 * S, my - 5 * S);
          ctx.stroke();
          break;
        case 'ipa':
          // dropper bottle nozzle
          ctx.fillStyle = 'rgba(200,225,255,0.35)';
          ctx.beginPath();
          ctx.arc(mx, my, 1.5 * S, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#e6f0ff';
          ctx.beginPath();
          ctx.moveTo(mx, my);
          ctx.lineTo(mx + 2 * S, my - 4 * S);
          ctx.stroke();
          break;
        case 'brush':
          this.drawBrush(ctx, mx, my, S, st.kit.brushWear);
          break;
        case 'wipe':
          ctx.fillStyle = 'rgba(245,245,240,0.85)';
          ctx.strokeStyle = 'rgba(180,180,175,0.9)';
          ctx.beginPath();
          ctx.roundRect(mx - 2 * S, my - 1.2 * S, 4 * S, 2.4 * S, 0.4 * S);
          ctx.fill();
          ctx.stroke();
          break;
      }
      // Temperature readout for the pad under the cursor
      const hover = st.pads.find((p) => Math.abs(m.x - p.x) < p.w / 2 + 0.3 && Math.abs(m.y - p.y) < p.h / 2 + 0.3);
      if (hover) {
        ctx.font = '600 13px Segoe UI, sans-serif';
        ctx.textAlign = 'left';
        const label = `${hover.pin}: ${Math.round(hover.temp)}°C ${hover.temp >= meltOf(hover) ? '· MOLTEN' : `(melts at ${Math.round(meltOf(hover))}°C)`}`;
        const tw = ctx.measureText(label).width;
        ctx.fillStyle = 'rgba(10,12,14,0.8)';
        ctx.fillRect(mx + 14, my + 10, tw + 12, 22);
        ctx.fillStyle = hover.temp >= meltOf(hover) ? '#ffb070' : '#e8e6e1';
        ctx.fillText(label, mx + 20, my + 25);
      }
    }

    // Microscope readout: magnification, light, angle
    {
      const tools = this.session.shop.tools;
      const max = maxZoom(tools);
      const parts = [`${(0.7 * this.view.zoom).toFixed(1)}× lens view (max ${(0.7 * max).toFixed(1)}×) · wheel zoom${this.view.zoom > 1 ? ', right-drag pans, 0 resets' : ''}`];
      if (tools.includes('ring-light')) parts.push(`ring light ${this.view.ring ? 'ON' : 'off'} (L)`);
      if (tools.includes('tilt-mount')) parts.push(`${this.view.tilt ? 'TILTED — looking under the part' : 'straight down'} (T)`);
      ctx.font = '600 12px Segoe UI, sans-serif';
      ctx.textAlign = 'left';
      const text = parts.join(' · ');
      const tw = ctx.measureText(text).width;
      const tx = Math.max(8, (W - tw) / 2);
      ctx.fillStyle = 'rgba(10,12,14,0.7)';
      ctx.fillRect(tx - 7, H - 58, tw + 14, 22);
      ctx.fillStyle = '#e8e6e1';
      ctx.fillText(text, tx, H - 43);
      if (this.view.ring) {
        const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.7);
        g.addColorStop(0, 'rgba(255,255,255,0.06)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
    }
  }

  private drawPart(ctx: CanvasRenderingContext2D, p: PlacedPart, X: (x: number) => number, Y: (y: number) => number, S: number, alpha: number): void {
    const st = this.st;
    const c = this.session.board.comps[st.ref];
    const fp = FOOTPRINTS[p.spec.pkg];
    const rot = (c.def.rot + (p.reversed ? 180 : 0)) % 360;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(X(p.dx), Y(p.dy));
    ctx.rotate(((rot + (p.angle ?? 0)) * Math.PI) / 180);
    const w = fp.w * S;
    const h = fp.h * S;
    const spec: PartSpec = p.spec;
    // Legs / terminations sit over the pads (in local, unrotated footprint coordinates)
    ctx.fillStyle = '#cfd3d6';
    for (const pad of fp.pads) {
      if (['0603', '1206', 'LED0805'].includes(spec.pkg)) continue;
      ctx.fillRect((pad.x - pad.w * 0.3) * S, (pad.y - pad.h * 0.3) * S, pad.w * 0.6 * S, pad.h * 0.6 * S);
    }
    const body: Record<string, string> = { resistor: '#2f3134', capacitor: '#b48a5e', fuse: '#ebe5d0', led: '#f1efe9', cob: '#c3c7cc', electrolytic: '#c3c7cc', inductor: '#55575c', jack: '#35373c', button: '#35373c' };
    ctx.fillStyle = body[spec.kind] ?? '#3d3f44';
    const cooked = (p.original && c.burnt) || p.melted;
    if (cooked) ctx.fillStyle = '#3a2614';
    if (spec.kind === 'electrolytic') {
      ctx.beginPath();
      ctx.arc(0, 0, Math.min(w, h) * 0.47, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2d2f33';
      ctx.fillRect(w * 0.2, -h * 0.4, w * 0.18, h * 0.8);
    } else {
      ctx.fillRect(-w / 2, -h / 2, w, h);
    }
    if (['0603', '1206', 'LED0805'].includes(spec.pkg)) {
      ctx.fillStyle = '#d7dadd';
      const cap = (spec.pkg === '0603' ? 0.3 : spec.pkg === 'LED0805' ? 0.35 : 0.5) * S;
      ctx.fillRect(-w / 2, -h / 2, cap, h);
      ctx.fillRect(w / 2 - cap, -h / 2, cap, h);
    }
    // Polarity: band / mark on the cathode end (+x in local coordinates)
    if (['diode', 'tvs', 'zener'].includes(spec.kind)) {
      ctx.fillStyle = '#c4c6ca';
      ctx.fillRect(w * 0.22, -h / 2, w * 0.12, h);
    }
    if (spec.kind === 'led') {
      ctx.fillStyle = spec.color === 'blue' ? '#3a7bff' : '#39d84a';
      ctx.fillRect(w * 0.12, -h * 0.4, w * 0.1, h * 0.8);
    }
    if (spec.kind === 'cob') {
      ctx.fillStyle = '#f2d65a';
      ctx.beginPath();
      ctx.arc(0, 0, w * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
    if (cooked) {
      const g = ctx.createRadialGradient(0, 0, 1, 0, 0, Math.max(w, h) * 0.6);
      g.addColorStop(0, 'rgba(10,6,2,0.9)');
      g.addColorStop(1, 'rgba(10,6,2,0)');
      ctx.fillStyle = g;
      ctx.fillRect(-w, -h, 2 * w, 2 * h);
    }
    if (spec.marking && !['electrolytic', 'cob'].includes(spec.kind) && !cooked) {
      ctx.fillStyle = '#d9dade';
      ctx.font = `bold ${Math.min(h * 0.45, (w * 0.8) / Math.max(2, spec.marking.length) * 1.6)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(spec.marking, 0, 0);
    }
    ctx.restore();
  }

  /** A small toothbrush-style scrub brush; bristles splay as it wears. */
  private drawBrush(ctx: CanvasRenderingContext2D, mx: number, my: number, S: number, wear: number): void {
    ctx.save();
    ctx.translate(mx, my);
    ctx.rotate(-0.5);
    // handle
    ctx.fillStyle = '#3b6fb6';
    ctx.beginPath();
    ctx.roundRect(-0.6 * S, -9 * S, 1.2 * S, 7 * S, 0.5 * S);
    ctx.fill();
    // head
    ctx.fillStyle = '#4a7ec4';
    ctx.beginPath();
    ctx.roundRect(-1.3 * S, -2.6 * S, 2.6 * S, 1.6 * S, 0.5 * S);
    ctx.fill();
    // bristle tufts: 3 rows × 6 columns, dense fibres in each
    const spread = 0.15 + wear * 0.9;
    ctx.lineWidth = Math.max(1, 0.05 * S);
    for (let row = 0; row < 3; row++)
      for (let col = 0; col < 6; col++) {
        const bx = (-1.05 + col * 0.42) * S;
        const by = (-1.0 + row * 0.05) * S;
        for (let f = -3; f <= 3; f++) {
          const ang = (f / 3) * spread + (col - 2.5) * 0.04 * wear * 4;
          ctx.strokeStyle = row === 1 ? 'rgba(235,235,240,0.95)' : 'rgba(205,220,240,0.9)';
          ctx.beginPath();
          ctx.moveTo(bx + f * 0.025 * S, by);
          ctx.lineTo(bx + f * 0.025 * S + Math.sin(ang) * 1.3 * S, by + Math.cos(ang) * 1.3 * S * (1 - wear * 0.25));
          ctx.stroke();
        }
      }
    ctx.restore();
  }

  private panel(): void {
    const cons = this.host.querySelector('#rw-cons') as HTMLElement | null;
    if (cons) {
      const shop = this.session.shop;
      const left = (id: SupplyId) => Math.max(0, Math.round((shop.supplies[id] - (this.st.used[id] ?? 0)) * 10) / 10);
      const wear = Math.round(this.st.kit.brushWear * 100);
      const wl = Math.round(this.st.kit.wickLoad * 100);
      const wickId = this.st.kit.wick.supply as SupplyId;
      const html = `Brush: <b class="${wear > 80 ? 'bad' : ''}">${wear}% worn</b> (${left('brushes')} spare) · Wipes: <b>${left('wipes')}</b> · IPA: <b>${left('ipa')} ml</b><br>
        Wick end: <b class="${wl >= 100 ? 'bad' : wl > 60 ? 'warn' : ''}">${wl >= 100 ? 'silver — full, cut it (C)' : `${wl}% used`}</b> · roll ${left(wickId)} cm
        ${wl > 2 ? '<button data-rw-cut>✂ Cut (C)</button>' : ''}`;
      if (cons.dataset.html !== html) {
        cons.dataset.html = html;
        cons.innerHTML = html;
      }
    }
    const st = this.st;
    const results = jointResults(st);
    const jointsEl = this.host.querySelector('#rw-joints');
    if (!jointsEl) return;
    const guided = this.session.guided;
    jointsEl.innerHTML = st.pads
      .map((p, i) => {
        const bar = Math.min(100, (p.solder / 2) * 100);
        const state = p.lifted ? 'lifted' : p.temp >= meltOf(p) ? 'molten' : `${Math.round(p.temp)}°C`;
        return `<div class="rw-joint"><b>${p.pin}</b><span class="rw-bar"><i style="width:${bar}%"></i><em style="left:${50}%"></em></span><span class="muted">${state}</span>${guided ? `<span class="rw-res ${results[i]}">${RESULT_TEXT[results[i]]}</span>` : ''}</div>`;
      })
      .join('');
    const guide = this.host.querySelector('#rw-guide') as HTMLElement;
    guide.style.display = guided ? 'block' : 'none';
    if (guided) guide.innerHTML = this.advice();
    const msgs = this.host.querySelector('#rw-msgs') as HTMLElement;
    const html = st.messages.slice(-4).map((m) => `<div>${esc(m)}</div>`).join('');
    if (msgs.dataset.html !== html) {
      msgs.dataset.html = html;
      msgs.innerHTML = html;
    }
  }

  /** Guided-mode suggestion for the next step, based on the actual state. */
  private advice(): string {
    const st = this.st;
    const pads = st.pads.filter((p) => !p.lifted);
    if (st.pads.some((p) => p.lifted)) return 'A pad has lifted. Finish up — you will need a jumper wire from that leg to its connection.';
    const seen = st.bridges.filter(([, , kind]) => bridgeVisible(kind, this.view));
    if (seen.some(([, , kind]) => kind === 'ball')) return 'A solder ball under the chip! It cannot be wicked out from under the body: lift the chip (flux, hot air, tweezers), and it comes out with it.';
    if (seen.some(([, , kind]) => kind === 'whisker')) return 'A fine solder whisker between pins! Flux it and touch the joint with the iron — it pulls back into the joints.';
    if (seen.length) return 'Solder bridge! Flux it, then wick the excess away.';
    const liquid = st.kit.liquid;
    if (pads.some((p) => p.sludge > 0.05))
      return liquid === 'corrosion-cleaner'
        ? 'The crust is fizzing into sludge. Scrub it with the brush (7), then switch the kit liquid to IPA, rinse (6) and wipe (8) before it dries.'
        : 'Rinse the sludge with IPA (6) and wipe it up (8) before it dries back into crust.';
    if (pads.some((p) => p.crust > 0.05))
      return liquid === 'corrosion-cleaner'
        ? 'Corrosion crust on the pads — solder will not stick to it. Apply the corrosion cleaner (6) and let it fizz, then scrub (7).'
        : 'Corrosion crust on the pads — solder will not stick to it. Pick <b>Corrosion cleaner</b> as the cleaning liquid in the kit, apply it (6), scrub (7), then rinse with IPA and wipe.';
    if (st.held) return st.part ? 'Put that part somewhere (Delete to bin it).' : `Click the footprint to place the part.${rotatable(st.held) && POLARIZED.includes(st.held.spec.kind) ? ' Match the band/stripe to the silkscreen mark (R rotates).' : ''}`;
    if (st.part?.original) {
      if (st.footprint.heatLimit && !st.pads.some((p) => p.lowmelt > 0.15))
        return `This part has a plastic body that melts above ~${st.footprint.heatLimit}°C. To remove it safely: flux, mix low-melt alloy into every joint (Solder → ChillMelt, heat + Space), then gentle hot air and lift. To just reflow it, keep the heat low and quick.`;
      if (st.pads.length <= 3 && pads.every((p) => p.solder < 0.15)) return 'The solder is off. Lift the part with the tweezers (4), then Delete to bin it.';
      const pull =
        st.pads.length <= 3
          ? '<b>Replace</b>: wick the solder off every joint (wick, 2), then lift the part with the tweezers. Short passes: a pad held hot too long burns and lifts.'
          : '<b>Replace</b>: melt every joint at once (hot air, or alternate the iron fast) and lift it with the tweezers.';
      return pads.some((p) => p.flux < 0.2)
        ? `Start with flux on the joints.<br>• <b>Reflow</b>: heat each joint until it melts.<br>• ${pull}`
        : `Reflow each joint, or ${pull.replace('<b>Replace</b>: ', '')}`;
    }
    if (!st.part) {
      if (pads.some((p) => p.lowmelt > 0.05)) return 'Low-melt alloy is still on the pads. Flux and wick it ALL off before fitting the new part, or the joints will be weak.';
      if (pads.some((p) => p.solder > 0.45 || p.dirty)) return 'Clean the pads: flux, then wick the old solder off until they are flat and shiny.';
      return 'Pads are clean. Pick the right part from the tray and place it with the tweezers, then flux and solder each end (iron + Space).';
    }
    if (!aligned(st.part)) return 'The part is off its pads. Pick it up with the tweezers and place it again.';
    const res = jointResults(st);
    if (res.some((r) => r === 'open')) return 'Solder each end: heat the pad until it melts, then feed a little solder (Space).';
    if (res.some((r) => r === 'weak')) return 'Low-melt alloy is mixed into a joint. Wick it out, switch back to normal solder and redo that joint.';
    if (res.some((r) => r === 'cold' || r === 'starved')) return 'Some joints are poor. Add flux and reflow them (a touch more solder if they look starved).';
    if (st.pads.some((p) => p.white > 0.05)) return 'White residue: the IPA dried before you wiped. Apply more IPA to redissolve it, then wipe.';
    if (st.pads.some((p) => p.dissolved > 0.05)) return 'Flux is dissolved — wipe it up (8) before the IPA evaporates!';
    if (st.pads.some((p) => p.flux > 0.05)) return st.pads.some((p) => p.ipa > 0.1) ? 'Scrub with the brush (7) while it is wet.' : 'Joints look good. Clean up: IPA (6), scrub with the brush (7), then wipe (8).';
    return 'All joints look good. Press Done.';
  }
}
