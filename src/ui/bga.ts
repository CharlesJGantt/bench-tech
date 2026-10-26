/**
 * BGA station: reflow in place, lift the chip, clean the pads, reball with a stencil (balls or paste) and fit it again.
 * The balls under a chip are hidden until the chip is off; then the pad field on the board and the balls on the chip are shown
 * as two ball maps. Each heating step uses the heat bar (passed in by the HUD).
 */
import type { Session } from '../game/session';
import type { BgaState, BoardPad, ChipBall, Heat } from '../rework/bga';
import { stencilForChip, stencilLabel } from '../sim/bgatypes';
import { part, pinsOf } from '../sim/parts';
import { stockOf } from '../business/shop';
const money = (n: number) => `${n < 0 ? '−' : ''}$${Math.abs(n).toFixed(2)}`;
const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export type HeatBar = (title: string, ref: string) => Promise<Heat | null>;

const PAD_COL: Record<BoardPad, string> = { clean: '#d9b44a', solder: '#9a9aa0', bridged: '#d94a4a', lifted: '#3a2a1a' };
const CHIP_COL: Record<ChipBall, string> = { good: '#c9ccd4', cracked: '#c97a4a', bare: '#d9b44a', bridged: '#d94a4a', weak: '#7d7f88' };

export class BgaStation {
  private msgs: string[] = [];
  private aligned = false;
  private method: 'balls' | 'paste' = 'balls';
  private busy = false;

  constructor(
    private session: Session,
    private host: HTMLElement,
    private ref: string,
    private heatBar: HeatBar,
    private done: () => void,
  ) {}

  private get comp() {
    return this.session.board.comps[this.ref];
  }
  private get state(): BgaState | undefined {
    return this.comp.bga;
  }

  open(): void {
    this.render();
    window.addEventListener('keydown', this.key);
  }

  private key = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && !this.busy) this.close();
  };

  private close(): void {
    window.removeEventListener('keydown', this.key);
    this.done();
  }

  private say(text: string, ok = true): void {
    this.msgs.unshift(`${ok ? '' : '⚠ '}${text}`);
    this.msgs = this.msgs.slice(0, 8);
  }

  private render(): void {
    const c = this.comp;
    const s = this.session;
    const off = this.state?.off;
    const sp = part(c.def.partNo);
    const t = stencilForChip(sp.marking ?? '');
    const need = s.bgaNeeds(this.ref);
    const held = off?.partNo ? part(off.partNo) : null;
    const stock = stockOf(s.shop, sp.partNo);
    const btn = (act: string, label: string, enabled = true, title = '') => `<button data-bga="${act}" ${enabled && !this.busy ? '' : 'disabled'} ${title ? `title="${esc(title)}"` : ''}>${label}</button>`;
    const has = (id: string) => s.owns(id);
    this.host.innerHTML = `
      <div class="rw">
        <div class="rw-head">
          <h2>🔲 BGA chip — ${this.ref} <span class="muted">${esc(c.def.role)} · ${esc(sp.label)}</span></h2>
          <div class="row" style="margin:0"><button class="primary" data-bga="done" title="Back to the bench (Esc)">✓ Done</button></div>
        </div>
        <div class="rw-main">
          <canvas id="bga-canvas" width="560" height="360" style="width:100%;max-width:560px;height:auto;align-self:flex-start"></canvas>
          <aside class="rw-side">
            <p class="muted small">${off ? 'The chip is off the board. Left: the pads on the board. Right: the balls on the chip.' : 'The balls are hidden under the chip. Lift it to see them.'}</p>
            ${t && need ? `<div class="note small">Needs stencil <b>${t.stencil}</b> and <b>${t.ballMm.toFixed(2)} mm</b> balls · <span class="mono">${esc(stencilLabel(t))}</span><br>Stencil: ${need.owned ? (need.warped ? '<b class="bad">warped, replace it</b>' : 'on the shelf') : 'not bought yet'} · Vise: ${has('bga-vise') ? 'yes' : 'not bought'}</div>` : ''}
            <h3>On the board</h3>
            <div class="row small">
              ${btn('flux', '💧 Flux (1 ml)', true, 'Flux around the edges of the chip, or on the chip before balls go on')}
              ${!off ? btn('reflow', '🔥 Reflow in place', !!c.part, 'Heat the chip where it sits. Needs flux. Under half the time it fixes anything, and the fix does not last.') : ''}
              ${!off ? btn('remove', '🧲 Lift the chip off', !!c.part, 'Hot air, heat until the solder flows. Too cold tears pads; too hot cooks it.') : ''}
            </div>
            ${
              off
                ? `<h3>Pads and chip</h3>
            <div class="row small">
              ${btn('clean-pads', '🧽 Clean the board pads (flux + wick)')}
              ${btn('load-new', `📦 New chip (${stock.new})`, stock.new > 0, 'Comes with its balls')}
              ${btn('load-used', `♻ Used / donor chip (${stock.used})`, stock.used > 0, 'Arrives bare: reball it')}
              ${btn('clean-chip', '🧽 Strip the chip', !!held)}
            </div>
            <h3>Reball</h3>
            <div class="row small">
              <label><input type="radio" name="bga-method" value="balls" ${this.method === 'balls' ? 'checked' : ''}> Balls: flux, then one ball in each hole (always perfect)</label>
              <label><input type="radio" name="bga-method" value="paste" ${this.method === 'paste' ? 'checked' : ''}> Paste: smear and scrape (fast, about one time in five leaves uneven pads)</label>
            </div>
            <div class="row small">${btn('reball', '🔥 Reball the chip (stencil + heat)', !!held)}</div>
            <h3>Fit</h3>
            <div class="row small">
              ${btn('align', this.aligned ? '✓ Lined up' : '🎯 Line the chip up on the pads', !!held && !c.part)}
              ${btn('fit', '🔥 Fit the chip (heat)', !!held && !c.part)}
            </div>`
                : ''
            }
            <div id="bga-msgs" class="rw-msgs">${this.msgs.map((m) => `<div>${esc(m)}</div>`).join('')}</div>
            <p class="muted small">Cash: ${money(s.shop.cash)}</p>
          </aside>
        </div>
      </div>`;
    this.host.querySelectorAll<HTMLButtonElement>('[data-bga]').forEach((b) => b.addEventListener('click', () => void this.act(b.dataset.bga!)));
    this.host.querySelectorAll<HTMLInputElement>('input[name="bga-method"]').forEach((r) => r.addEventListener('change', () => (this.method = r.value as 'balls' | 'paste')));
    this.draw();
  }

  private async heat(title: string): Promise<Heat | null> {
    this.busy = true;
    this.render();
    const h = await this.heatBar(title, this.ref);
    this.busy = false;
    return h;
  }

  private async act(a: string): Promise<void> {
    const s = this.session;
    const ref = this.ref;
    let r: { ok: boolean; text: string } | null = null;
    switch (a) {
      case 'done':
        return this.close();
      case 'flux':
        r = s.bgaFluxUp(ref);
        break;
      case 'reflow': {
        const h = await this.heat(`Reflow ${ref} in place: heat until the balls melt`);
        if (h) r = s.bgaReflow(ref, h);
        break;
      }
      case 'remove': {
        const h = await this.heat(`Lift ${ref}: heat until the solder under it flows`);
        if (h) r = s.bgaRemove(ref, h);
        break;
      }
      case 'clean-pads':
        r = s.bgaClean(ref, 'pads');
        break;
      case 'clean-chip':
        r = s.bgaClean(ref, 'chip');
        break;
      case 'load-new':
        r = s.bgaLoadChip(ref, 'new');
        break;
      case 'load-used':
        r = s.bgaLoadChip(ref, 'used');
        break;
      case 'reball': {
        const h = await this.heat(`Reball the chip in the vise: heat until the balls melt into bumps (not too hot, the stencil warps)`);
        if (h) r = s.bgaReball(ref, this.method, h);
        break;
      }
      case 'align':
        this.aligned = true;
        r = { ok: true, text: 'The chip is lined up on the pads under the microscope.' };
        break;
      case 'fit': {
        const h = await this.heat(`Fit ${ref}: heat until the balls melt onto the pads`);
        if (h) {
          r = s.bgaFit(ref, h, this.aligned);
          this.aligned = false;
        }
        break;
      }
    }
    if (r) this.say(r.text, r.ok);
    this.render();
  }

  private draw(): void {
    const cv = this.host.querySelector<HTMLCanvasElement>('#bga-canvas');
    if (!cv) return;
    const g = cv.getContext('2d')!;
    g.fillStyle = '#16301f';
    g.fillRect(0, 0, cv.width, cv.height);
    const c = this.comp;
    const pins = pinsOf(part(c.def.partNo));
    const n = Math.round(Math.sqrt(pins.length));
    const off = this.state?.off;
    const grid = (ox: number, title: string, color: (pin: string) => string | null) => {
      const size = 240;
      const step = size / n;
      g.fillStyle = '#cfd8d0';
      g.font = '14px sans-serif';
      g.fillText(title, ox, 28);
      pins.forEach((pin, i) => {
        const x = ox + (i % n) * step + step / 2;
        const y = 50 + Math.floor(i / n) * step + step / 2;
        const col = color(pin);
        g.beginPath();
        g.arc(x, y, Math.max(2, step * 0.36), 0, Math.PI * 2);
        g.fillStyle = col ?? '#2c3d31';
        g.fill();
        if (col) {
          g.strokeStyle = '#00000055';
          g.stroke();
        }
      });
    };
    if (off) {
      grid(14, 'Board pads', (p) => PAD_COL[off.pads[p] ?? 'clean']);
      grid(290, off.partNo ? 'Chip balls' : 'No chip in the vise', (p) => (off.partNo ? CHIP_COL[off.chip[p] ?? 'bare'] : null));
    } else {
      grid(150, 'Under the chip (hidden)', () => null);
      g.fillStyle = '#cfd8d0cc';
      g.fillRect(150 + 20, 50 + 80, 200, 80);
      g.fillStyle = '#222';
      g.font = '15px monospace';
      g.fillText(part(c.def.partNo).marking ?? '', 150 + 44, 50 + 126);
    }
    g.font = '12px sans-serif';
    g.fillStyle = '#cfd8d0';
    const legend: [string, string][] = off
      ? [['clean pad', PAD_COL.clean], ['old solder', PAD_COL.solder], ['bridged', PAD_COL.bridged], ['lifted pad', PAD_COL.lifted], ['ball', CHIP_COL.good], ['cracked ball', CHIP_COL.cracked]]
      : [];
    legend.forEach(([t, col], i) => {
      g.fillStyle = col;
      g.fillRect(14 + i * 90, 330, 10, 10);
      g.fillStyle = '#cfd8d0';
      g.fillText(t, 28 + i * 90, 339);
    });
  }
}
