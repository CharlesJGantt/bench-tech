/**
 * Test Station: a shelf of known-good test consoles cabled to an old TV. Put the fixed
 * cartridge in the matching console, press its power button, wait — the game's title
 * screen means it is fixed. Title screens are drawn procedurally per game.
 */
import type { Session } from '../game/session';
import { DEVICES } from '../sim/devices';
import { TOOLS } from '../business/economy';

const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

type Phase = 'empty' | 'inserted' | 'booting' | 'done';

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export class TestStation {
  private canvas!: HTMLCanvasElement;
  private phase: Phase = 'empty';
  private t0 = 0;
  private raf = 0;
  private result: { boots: boolean; rom: boolean; lockout: boolean; saveOk: boolean } | null = null;
  private keyDown = (e: KeyboardEvent) => e.key === 'Escape' && this.close();

  constructor(
    private session: Session,
    private host: HTMLElement,
    private done: () => void,
  ) {}

  open(): void {
    const s = this.session;
    const job = s.job;
    const consoleId = job.device.cartFor!;
    const consoleName = DEVICES[consoleId]?.name ?? consoleId;
    const owned = s.owns(`tc-${consoleId}`);
    const shelf = TOOLS.filter((t) => t.kind === 'testconsole')
      .map((t) => `<li class="${s.owns(t.id) ? '' : 'muted'}">${s.owns(t.id) ? '✓' : '—'} ${esc(t.name)}</li>`)
      .join('');
    this.host.innerHTML = `
      <div class="rw">
        <div class="rw-head">
          <h2>📺 Test Station <span class="muted">${esc(job.title ?? job.device.name)}</span></h2>
          <div class="row" style="margin:0"><button class="primary" id="ts-done">✓ Done</button></div>
        </div>
        <div class="rw-main">
          <canvas id="td-canvas"></canvas>
          <aside class="rw-side">
            <h3>Test consoles on the shelf</h3>
            <ul class="small">${shelf}</ul>
            ${
              owned
                ? `<p>Put the cartridge in the ${esc(consoleName)}, press its power button and wait for the title screen.</p>
                   <div class="row"><button id="ts-insert">⬇ Insert cartridge</button><button id="ts-power" disabled>⏻ Power</button><button id="ts-eject" disabled>⏏ Eject</button></div>`
                : `<p class="note">You do not have a working ${esc(consoleName)} to test with. Buy one in the office (Tools → Test consoles), or hand the cartridge back untested: the customer pays and tries it at home — if it does not boot, they are back tomorrow for 10% and a re-fix.</p>`
            }
            <div id="ts-out" class="note"></div>
          </aside>
        </div>
      </div>`;
    this.canvas = this.host.querySelector('#td-canvas') as HTMLCanvasElement;
    (this.host.querySelector('#ts-done') as HTMLElement).addEventListener('click', () => this.close());
    const ins = this.host.querySelector('#ts-insert') as HTMLButtonElement | null;
    const pow = this.host.querySelector('#ts-power') as HTMLButtonElement | null;
    const ej = this.host.querySelector('#ts-eject') as HTMLButtonElement | null;
    ins?.addEventListener('click', () => {
      this.phase = 'inserted';
      ins.disabled = true;
      pow!.disabled = false;
      ej!.disabled = false;
      this.out('Cartridge in. Press the power button.');
    });
    ej?.addEventListener('click', () => {
      this.phase = 'empty';
      this.result = null;
      ins!.disabled = false;
      pow!.disabled = true;
      ej.disabled = true;
      this.out('');
    });
    pow?.addEventListener('click', () => {
      if (this.phase !== 'inserted' && this.phase !== 'done') return;
      this.result = s.stationTest();
      this.phase = 'booting';
      this.t0 = performance.now();
      this.out('Booting…');
    });
    window.addEventListener('keydown', this.keyDown);
    const loop = () => {
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    loop();
  }

  private out(html: string): void {
    (this.host.querySelector('#ts-out') as HTMLElement).innerHTML = html;
  }

  private close(): void {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this.keyDown);
    this.done();
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
    ctx.fillStyle = '#2b2622';
    ctx.fillRect(0, 0, W, H);
    // The CRT
    const tw = Math.min(W * 0.8, H * 1.1);
    const th = tw * 0.75;
    const tx = (W - tw) / 2;
    const ty = H * 0.06;
    ctx.fillStyle = '#4a4440';
    ctx.beginPath();
    ctx.roundRect(tx - 20, ty - 20, tw + 40, th + 40, 22);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(tx, ty, tw, th, 28);
    ctx.clip();
    this.drawScreen(ctx, tx, ty, tw, th);
    // Scanlines + glass glare
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    for (let y = ty; y < ty + th; y += 3) ctx.fillRect(tx, y, tw, 1);
    const g = ctx.createRadialGradient(tx + tw * 0.3, ty + th * 0.2, 10, tx + tw / 2, ty + th / 2, tw * 0.75);
    g.addColorStop(0, 'rgba(255,255,255,0.08)');
    g.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = g;
    ctx.fillRect(tx, ty, tw, th);
    ctx.restore();
    // The test console with its power light
    const cy = ty + th + 40;
    const cw = tw * 0.5;
    const cxp = (W - cw) / 2;
    ctx.fillStyle = '#bdb9b0';
    ctx.fillRect(cxp, cy, cw, Math.min(70, H - cy - 10));
    ctx.fillStyle = '#3b3b3b';
    ctx.fillRect(cxp + cw * 0.3, cy + 6, cw * 0.4, 10);
    if (this.phase !== 'empty') {
      ctx.fillStyle = '#6d6a64';
      ctx.fillRect(cxp + cw * 0.32, cy - 18, cw * 0.36, 26);
    }
    const t = (performance.now() - this.t0) / 1000;
    const on = this.phase === 'booting' || this.phase === 'done';
    const blink = on && this.result && !this.result.lockout;
    ctx.fillStyle = on && (!blink || Math.floor(t * 2.5) % 2 === 0) ? '#ff3a2a' : '#3a1a18';
    ctx.beginPath();
    ctx.arc(cxp + 18, cy + 20, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawScreen(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    const t = (performance.now() - this.t0) / 1000;
    if (this.phase === 'empty' || this.phase === 'inserted') {
      ctx.fillStyle = '#0b0d0c';
      ctx.fillRect(x, y, w, h);
      return;
    }
    if (this.phase === 'booting' && t < 2.5) {
      // Snow while the console starts
      for (let i = 0; i < 1400; i++) {
        const v = Math.floor(Math.random() * 255);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(x + Math.random() * w, y + Math.random() * h, 3, 2);
      }
      return;
    }
    if (this.phase === 'booting') this.finish();
    const r = this.result!;
    if (!r.lockout) {
      ctx.fillStyle = '#111';
      ctx.fillRect(x, y, w, h);
      return;
    }
    if (!r.rom) {
      ctx.fillStyle = '#7d7d7d';
      ctx.fillRect(x, y, w, h);
      return;
    }
    this.titleScreen(ctx, x, y, w, h, t);
    if (!r.saveOk) {
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(x + w * 0.15, y + h * 0.72, w * 0.7, h * 0.12);
      ctx.fillStyle = '#ff6b5a';
      ctx.font = `bold ${Math.round(h * 0.045)}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('SAVE DATA: NONE', x + w / 2, y + h * 0.795);
    }
  }

  private finish(): void {
    this.phase = 'done';
    const r = this.result!;
    const lines = [
      r.boots ? '✓ Title screen — the game boots.' : r.lockout ? '✗ Grey screen — the console cannot read the game.' : '✗ Black screen, power light blinking — the lockout handshake fails.',
    ];
    if (r.boots) lines.push(r.saveOk ? '✓ Saved games kept with the power off.' : '✗ Saved games are lost when it is switched off.');
    this.out(lines.join('<br>'));
  }

  /** A procedural title screen for the game. */
  private titleScreen(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number): void {
    const title = this.session.job.title ?? 'GAME';
    const hsh = hash(title);
    const hue = hsh % 360;
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, `hsl(${hue},70%,22%)`);
    g.addColorStop(1, `hsl(${(hue + 40) % 360},75%,45%)`);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    // Blocky scenery
    const px = w / 32;
    let s = hsh;
    const rnd = () => ((s = (Math.imul(s, 1103515245) + 12345) >>> 0) / 4294967296);
    ctx.fillStyle = `hsl(${(hue + 180) % 360},55%,35%)`;
    for (let i = 0; i < 32; i++) {
      const hh = Math.floor(2 + rnd() * 6);
      ctx.fillRect(x + i * px, y + h - hh * px, px + 1, hh * px);
    }
    ctx.fillStyle = `hsl(${(hue + 90) % 360},80%,60%)`;
    for (let i = 0; i < 6; i++) ctx.fillRect(x + rnd() * w, y + h * (0.15 + rnd() * 0.35), px, px);
    // Title
    ctx.textAlign = 'center';
    ctx.font = `bold ${Math.round(h * 0.11)}px monospace`;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillText(title.toUpperCase(), x + w / 2 + 4, y + h * 0.42 + 4);
    ctx.fillStyle = '#ffe36b';
    ctx.fillText(title.toUpperCase(), x + w / 2, y + h * 0.42);
    ctx.font = `${Math.round(h * 0.04)}px monospace`;
    ctx.fillStyle = '#fff';
    ctx.fillText('© 198' + (hsh % 10) + ' BINTENDO-ISH', x + w / 2, y + h * 0.52);
    if (Math.floor(t * 1.6) % 2 === 0) {
      ctx.font = `bold ${Math.round(h * 0.055)}px monospace`;
      ctx.fillText('PRESS START', x + w / 2, y + h * 0.64);
    }
  }
}
