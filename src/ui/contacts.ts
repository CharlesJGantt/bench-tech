/**
 * Contact cleaning: a close-up of a connector's contacts. Rub back and forth over them with
 * the pink pencil eraser (or a magic eraser sponge, faster), then dab on Pad-Bright to bring
 * them up bright and keep them that way.
 */
import type { Session } from '../game/session';
import { DULL, oxideAt, SCRUB_FLOOR, SCRUBBERS, type Scrubber } from '../sim/contacts';
import { FOOTPRINTS } from '../sim/footprints';
import { part, pinsOf } from '../sim/parts';

type Tool = Scrubber | 'pad-bright';

const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export class ContactStation {
  private canvas!: HTMLCanvasElement;
  private tool: Tool;
  private mouse: { x: number; y: number } | null = null;
  private down = false;
  private scale = 10;
  private raf = 0;
  private dabbed = new Set<string>();
  private msgs: string[] = [];
  private keyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') this.close();
    if (e.key === '1') this.setTool('pink-eraser');
    if (e.key === '2') this.setTool('magic-sponge');
    if (e.key === '3') this.setTool('pad-bright');
  };

  constructor(
    private session: Session,
    private host: HTMLElement,
    private ref: string,
    private done: () => void,
  ) {
    this.tool = session.scrubber;
  }

  private get comp() {
    return this.session.board.comps[this.ref];
  }
  private get pins() {
    return pinsOf(part(this.comp.def.partNo));
  }
  private get pads() {
    return FOOTPRINTS[part(this.comp.def.partNo).pkg].pads;
  }

  open(): void {
    const c = this.comp;
    this.host.innerHTML = `
      <div class="rw">
        <div class="rw-head">
          <h2>🧽 Contacts — ${this.ref} <span class="muted">${esc(c.def.role)}</span></h2>
          <div class="row" style="margin:0"><button class="primary" id="ct-done" title="Back to the bench (Esc)">✓ Done</button></div>
        </div>
        <div class="rw-main">
          <canvas id="td-canvas"></canvas>
          <aside class="rw-side">
            <div class="rw-tools" id="ct-tools"></div>
            <p class="muted small">Hold the mouse button and rub back and forth over the contacts. Then dab Pad-Bright on each one.</p>
            <div id="ct-guide" class="note"></div>
            <h3>Contacts</h3>
            <div id="ct-pins"></div>
            <div id="ct-msgs" class="rw-msgs"></div>
          </aside>
        </div>
      </div>`;
    this.canvas = this.host.querySelector('#td-canvas') as HTMLCanvasElement;
    (this.host.querySelector('#ct-done') as HTMLElement).addEventListener('click', () => this.close());
    (this.host.querySelector('#ct-tools') as HTMLElement).addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('[data-ct-tool]');
      if (b) this.setTool(b.dataset.ctTool as Tool);
    });
    const cv = this.canvas;
    cv.addEventListener('pointerdown', (e) => {
      cv.setPointerCapture(e.pointerId);
      this.down = e.button === 0;
      this.dabbed.clear();
      this.mouse = this.toMm(e);
      this.apply(0);
    });
    cv.addEventListener('pointermove', (e) => {
      const m = this.toMm(e);
      const moved = this.mouse ? Math.hypot(m.x - this.mouse.x, m.y - this.mouse.y) : 0;
      this.mouse = m;
      if (this.down) this.apply(moved);
    });
    cv.addEventListener('pointerup', () => (this.down = false));
    cv.addEventListener('pointerleave', () => {
      this.down = false;
      this.mouse = null;
    });
    window.addEventListener('keydown', this.keyDown);
    this.setTool(this.tool);
    const loop = () => {
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    loop();
  }

  private close(): void {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this.keyDown);
    const c = this.comp;
    const vals = this.pins.map((p) => oxideAt(c, p));
    const summary = vals.every((v) => v === 0)
      ? 'contacts scrubbed and Pad-Brightened — bright and protected.'
      : vals.some((v) => v > DULL)
        ? 'contacts still partly oxidised.'
        : 'contacts scrubbed clean (not yet Pad-Brightened).';
    this.session.doneContacts(this.ref, summary);
    this.done();
  }

  private setTool(t: Tool): void {
    this.tool = t;
    if (t !== 'pad-bright') this.session.setScrubber(t);
    this.renderSide();
  }

  private say(m: string): void {
    if (this.msgs[this.msgs.length - 1] !== m) this.msgs.push(m);
    this.msgs = this.msgs.slice(-5);
  }

  private toMm(e: PointerEvent): { x: number; y: number } {
    const r = this.canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left - r.width / 2) / this.scale, y: (e.clientY - r.top - r.height / 2) / this.scale };
  }

  /** The contact under the cursor (generous: the eraser is wider than a finger). */
  private pinAt(m: { x: number; y: number }): string | null {
    const pads = this.pads;
    let best: string | null = null;
    let bd = Infinity;
    pads.forEach((p, i) => {
      const d = Math.max(Math.abs(m.x - p.x) - p.w / 2, Math.abs(m.y - p.y) - p.h / 2);
      if (d < 1.2 && d < bd) {
        bd = d;
        best = this.pins[i];
      }
    });
    return best;
  }

  private apply(moved: number): void {
    if (!this.mouse) return;
    const pin = this.pinAt(this.mouse);
    if (!pin) return;
    const s = this.session;
    if (this.tool === 'pad-bright') {
      if (this.dabbed.has(pin)) return;
      this.dabbed.add(pin);
      const r = s.padBrightContact(this.ref, pin);
      this.say(r === 'empty' ? 'The Pad-Bright bottle is empty — order more from the office.' : r === 'bright' ? `${pin}: bright gold, and protected.` : `${pin}: still tarnished under the Pad-Bright — scrub it first.`);
    } else if (moved > 0) {
      if (!s.scrubContact(this.ref, pin, moved)) this.say(`No ${SCRUBBERS[this.tool].name}s left — order some from the office.`);
    }
    this.renderSide();
  }

  private renderSide(): void {
    const s = this.session;
    const sup = s.shop.supplies;
    const wear = s.shop.scrubWear ?? {};
    const btn = (id: Tool, key: string, label: string, stock: string) =>
      `<button data-ct-tool="${id}" class="${this.tool === id ? 'on' : ''}" title="${stock}"><kbd>${key}</kbd>${label}</button>`;
    const left = (id: Scrubber) => `${Math.floor(sup[id])} in stock${wear[id] ? `, current one ${Math.round(wear[id] * 100)}% worn` : ''}`;
    (this.host.querySelector('#ct-tools') as HTMLElement).innerHTML =
      btn('pink-eraser', '1', 'Pink eraser', left('pink-eraser')) +
      btn('magic-sponge', '2', 'Magic sponge', left('magic-sponge')) +
      btn('pad-bright', '3', 'Pad-Bright', `${sup['pad-bright'].toFixed(1)} ml left`);
    const c = this.comp;
    (this.host.querySelector('#ct-pins') as HTMLElement).innerHTML = this.pins
      .map((p) => {
        const o = oxideAt(c, p);
        const state = o === 0 && c.brightened?.includes(p) ? 'bright ✓' : o <= SCRUB_FLOOR + 0.001 ? 'clean, dull' : o > DULL ? 'tarnished' : 'partly clean';
        return `<div class="rw-joint"><span>${esc(p)}</span><span class="rw-res ${o > DULL ? 'open' : o === 0 ? 'good' : 'unchanged'}">${state}</span></div>`;
      })
      .join('');
    const guide = this.host.querySelector('#ct-guide') as HTMLElement;
    const vals = this.pins.map((p) => oxideAt(c, p));
    guide.innerHTML = vals.some((v) => v > SCRUB_FLOOR + 0.001)
      ? `Scrub every contact until it is clean. ${s.scrubber === 'pink-eraser' ? 'A magic eraser sponge (2) is much faster if you have one.' : ''}`
      : vals.every((v) => v === 0)
        ? 'All bright and protected. Press Done.'
        : 'Clean! Now dab Pad-Bright (3) on each contact to bring them up bright and protect them.';
    (this.host.querySelector('#ct-msgs') as HTMLElement).innerHTML = this.msgs.map((m) => `<div>${esc(m)}</div>`).join('');
  }

  private draw(): void {
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
    const pads = this.pads;
    const spanX = Math.max(...pads.map((p) => Math.abs(p.x) + p.w / 2)) * 2 + 6;
    const spanY = Math.max(...pads.map((p) => Math.abs(p.y) + p.h / 2)) * 2 + 6;
    const S = (this.scale = Math.min(W / spanX, H / spanY));
    const X = (x: number) => W / 2 + x * S;
    const Y = (y: number) => H / 2 + y * S;
    ctx.fillStyle = '#1e6e40';
    ctx.fillRect(0, 0, W, H);
    const c = this.comp;
    pads.forEach((p, i) => {
      const pin = this.pins[i];
      const o = oxideAt(c, pin);
      const bright = o === 0 && c.brightened?.includes(pin);
      // Gold, dulled towards brown/black by oxide; Pad-Bright adds a shine
      const mix = (a: number, b: number) => Math.round(a + (b - a) * Math.min(1, o * 1.4));
      ctx.fillStyle = `rgb(${mix(222, 70)},${mix(176, 55)},${mix(70, 35)})`;
      const x0 = X(p.x - p.w / 2);
      const y0 = Y(p.y - p.h / 2);
      if (p.round) {
        ctx.beginPath();
        ctx.arc(X(p.x), Y(p.y), (p.w / 2) * S, 0, Math.PI * 2);
        ctx.fill();
      } else ctx.fillRect(x0, y0, p.w * S, p.h * S);
      // Blotchy tarnish
      if (o > 0.05) {
        let t = (i + 1) * 9301;
        const rnd = () => ((t = (t * 16807) % 2147483647) / 2147483647);
        ctx.fillStyle = `rgba(40,45,30,${Math.min(0.6, o * 0.7)})`;
        for (let k = 0; k < 14; k++) {
          ctx.beginPath();
          ctx.arc(X(p.x + (rnd() - 0.5) * p.w), Y(p.y + (rnd() - 0.5) * p.h), (0.2 + rnd() * 0.5) * S, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (bright) {
        const g = ctx.createLinearGradient(x0, y0, x0 + p.w * S, y0 + p.h * S);
        g.addColorStop(0, 'rgba(255,255,255,0)');
        g.addColorStop(0.5, 'rgba(255,255,240,0.45)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x0, y0, p.w * S, p.h * S);
      }
      ctx.fillStyle = 'rgba(240,240,232,0.85)';
      ctx.font = `600 ${Math.max(11, 0.9 * S)}px Segoe UI, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(pin, X(p.x), Y(p.y + p.h / 2) + Math.max(14, 1.2 * S));
    });
    // The tool under the cursor
    if (this.mouse) {
      const mx = X(this.mouse.x);
      const my = Y(this.mouse.y);
      ctx.save();
      if (this.tool === 'pad-bright') {
        ctx.fillStyle = 'rgba(180,220,255,0.5)';
        ctx.beginPath();
        ctx.arc(mx, my, 1.4 * S, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = this.tool === 'pink-eraser' ? '#f2a0b0' : '#f4f4f2';
        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.roundRect(mx - 2.5 * S, my - 1.2 * S, 5 * S, 2.4 * S, 0.5 * S);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }
  }
}
