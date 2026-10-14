/**
 * Teardown station: a top-down view of the device in its case. Pick a tool and click
 * what you want off; switch to "Put back" to reassemble. Loose screws wait on the mat.
 */
import type { Session } from '../game/session';
import { assembled, canInstall, canRemove, nextOpenStep, riskOf, rightTool, type EncItem, type EncTool } from '../sim/enclosure';

type Mode = EncTool | 'install';

const TOOLS: { id: Mode; key: string; name: string; tip: string }[] = [
  { id: 'screwdriver', key: '1', name: 'Screwdriver', tip: 'Screws out.' },
  { id: 'spudger', key: '2', name: 'Spudger', tip: 'Plastic pry tool: clips, glued panels (once warm), plugs and ribbon latches.' },
  { id: 'heat', key: '3', name: 'Heat', tip: 'Warm glued panels and pads until the adhesive lets go.' },
  { id: 'fingers', key: '4', name: 'Fingers', tip: 'Lift loose panels, shields, heatsinks and fans. Never pull cables by hand.' },
  { id: 'install', key: '5', name: 'Put back', tip: 'Click an empty spot to put that part back. Screws: pick a length from the mat first.' },
];

const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export class TeardownStation {
  private canvas!: HTMLCanvasElement;
  private mode: Mode = 'screwdriver';
  private mouse: { x: number; y: number } | null = null;
  private scale = 4;
  private ox = 0;
  private oy = 0;
  private pick = 0;
  private raf = 0;
  private keyDown = (e: KeyboardEvent) => this.onKey(e);

  constructor(
    private session: Session,
    private host: HTMLElement,
    private boardArt: HTMLCanvasElement | null,
    private done: () => void,
  ) {}

  private get def() {
    return this.session.encDef!;
  }
  private get st() {
    return this.session.enc!;
  }

  open(): void {
    const s = this.session;
    this.host.innerHTML = `
      <div class="rw">
        <div class="rw-head">
          <h2>🔧 Case — ${esc(s.job.device.name)}</h2>
          <div class="row" style="margin:0"><button class="primary" id="td-done" title="Back to the bench (Esc)">✓ Done</button></div>
        </div>
        <div class="rw-main">
          <canvas id="td-canvas"></canvas>
          <aside class="rw-side">
            <div class="rw-tools">${TOOLS.map((t) => `<button data-td-tool="${t.id}" title="${esc(t.tip)}"><kbd>${t.key}</kbd>${t.name}</button>`).join('')}</div>
            <p id="td-tip" class="muted small"></p>
            <div id="td-guide" class="note"></div>
            ${s.guided ? '<div class="row"><button id="td-open">Open it for me</button><button id="td-close">Close it up for me</button></div>' : ''}
            <h3>Screw mat</h3>
            <div id="td-mat" class="rw-tray"></div>
            <div id="td-extra"></div>
            <h3>Parts</h3>
            <div id="td-list" class="small"></div>
            <div id="td-msgs" class="rw-msgs"></div>
          </aside>
        </div>
      </div>`;
    this.canvas = this.host.querySelector('#td-canvas') as HTMLCanvasElement;
    this.host.querySelectorAll<HTMLButtonElement>('[data-td-tool]').forEach((b) => b.addEventListener('click', () => this.setMode(b.dataset.tdTool as Mode)));
    (this.host.querySelector('#td-done') as HTMLElement).addEventListener('click', () => this.close());
    this.host.querySelector('#td-open')?.addEventListener('click', () => this.say(s.encOpenForMe()));
    this.host.querySelector('#td-close')?.addEventListener('click', () => this.say(s.encCloseForMe()));
    this.host.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      const m = t.closest<HTMLElement>('[data-td-len]');
      if (m) {
        this.pick = parseFloat(m.dataset.tdLen!);
        this.setMode('install');
      }
      const p = t.closest<HTMLElement>('[data-td-paste]');
      if (p) this.say([s.encPaste(p.dataset.tdPaste!).text]);
      const d = t.closest<HTMLElement>('[data-td-drill]');
      if (d) this.say([s.encDrill(d.dataset.tdDrill!).text]);
    });
    const cv = this.canvas;
    cv.addEventListener('pointermove', (e) => (this.mouse = this.toMm(e)));
    cv.addEventListener('pointerleave', () => (this.mouse = null));
    cv.addEventListener('pointerdown', (e) => {
      if (e.button === 0) this.clickAt(this.toMm(e));
    });
    window.addEventListener('keydown', this.keyDown);
    this.setMode('screwdriver');
    this.renderSide();
    const loop = () => {
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    loop();
  }

  private msgs: string[] = [];
  private say(lines: string[]): void {
    this.msgs.push(...lines.filter(Boolean));
    this.msgs = this.msgs.slice(-6);
    this.renderSide();
  }

  private close(): void {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this.keyDown);
    this.done();
  }

  private onKey(e: KeyboardEvent): void {
    if (e.key === 'Escape') this.close();
    const t = TOOLS.find((x) => x.key === e.key);
    if (t) this.setMode(t.id);
  }

  private setMode(m: Mode): void {
    this.mode = m;
    this.host.querySelectorAll<HTMLButtonElement>('[data-td-tool]').forEach((b) => b.classList.toggle('on', b.dataset.tdTool === m));
    (this.host.querySelector('#td-tip') as HTMLElement).textContent = TOOLS.find((t) => t.id === m)!.tip;
    this.renderSide();
  }

  private toMm(e: PointerEvent): { x: number; y: number } {
    const r = this.canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left - this.ox) / this.scale, y: (e.clientY - r.top - this.oy) / this.scale };
  }

  /** How deep an item sits (things on top first come off): deeper items are drawn first. */
  private depth(it: EncItem): number {
    const d = (id: string): number => 1 + Math.max(0, ...(this.def.items.find((x) => x.id === id)!.needs ?? []).map(d));
    return d(it.id);
  }

  private hitBox(it: EncItem): { x: number; y: number; w: number; h: number } {
    const [w, h] = it.size ?? (it.kind === 'screw' ? [5, 5] : it.kind === 'cable' ? [9, 6] : it.kind === 'sticker' ? [10, 6] : [8, 8]);
    return { x: it.at[0] - w / 2, y: it.at[1] - h / 2, w, h };
  }

  private itemAt(p: { x: number; y: number }, removed: boolean): EncItem | null {
    const st = this.st;
    const items = this.def.items.filter((i) => st.removed.includes(i.id) === removed).sort((a, b) => this.depth(a) - this.depth(b));
    for (const it of items) {
      const r = this.hitBox(it);
      if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) return it;
    }
    return null;
  }

  private clickAt(p: { x: number; y: number }): void {
    const s = this.session;
    if (this.mode === 'install') {
      // The removed item that could go back here, shallowest first
      const it = this.def.items
        .filter((i) => this.st.removed.includes(i.id) && canInstall(this.def, this.st, i.id))
        .sort((a, b) => this.depth(a) - this.depth(b))
        .find((i) => {
          const r = this.hitBox(i);
          return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
        });
      if (!it) return;
      let len: number | undefined;
      if (it.screw) {
        // A magnetic screw mat remembers which hole each screw came from
        const own = this.session.owns('screw-mat') ? this.st.matFrom?.[it.id] : undefined;
        if (this.pick === -1) {
          this.say([s.encInstall(it.id, undefined, true).text]);
          return;
        }
        len = own && this.st.mat.includes(own) ? own : this.st.mat.includes(this.pick) ? this.pick : 0;
        if (!len && !confirm('No screw picked — leave this hole empty? (Pick one from the mat, or a spare from the box.)')) return;
        if (len && s.guided && len > it.screw.hole + 1 && !confirm(`That ${len} mm screw looks too long for this hole — long screws can bite into the board. Use it anyway?`)) return;
      }
      this.say([s.encInstall(it.id, len).text]);
      return;
    }
    const it = this.itemAt(p, false);
    if (!it) return;
    const risk = riskOf(it, this.st, this.mode);
    if (risk && s.guided && !confirm(`${risk}\n\nDo it anyway?`)) return;
    this.say([s.encRemove(it.id, this.mode).text]);
  }

  private renderSide(): void {
    const s = this.session;
    const st = this.st;
    const def = this.def;
    const mat = this.host.querySelector('#td-mat') as HTMLElement;
    const lens = [...new Set(st.mat)].sort((a, b) => a - b);
    const count = (l: number) => st.mat.filter((x) => x === l).length;
    const magnetic = s.owns('screw-mat');
    if (magnetic && lens.length) {
      mat.innerHTML = `<p class="small muted">Magnetic mat: each screw goes back in its own hole automatically.</p>${def.items
        .filter((i) => st.matFrom?.[i.id])
        .map((i) => `<div class="kv small"><span>${esc(i.label)}</span><b>${st.matFrom![i.id]} mm</b></div>`)
        .join('')}`;
    } else mat.innerHTML = lens.length
      ? `<div class="row" style="flex-wrap:wrap;margin:0">${lens.map((l) => `<button data-td-len="${l}" class="${l === this.pick && this.mode === 'install' ? 'on primary' : ''}" title="Pick one to put back">🔩 ${l} mm × ${count(l)}</button>`).join('')}</div>`
      : '<span class="muted">empty</span>';
    const extra: string[] = [];
    if (st.removed.some((id) => def.items.find((i) => i.id === id)?.screw))
      extra.push(`<button data-td-len="-1" class="${this.pick === -1 && this.mode === 'install' ? 'on primary' : ''}" title="A new screw of the right length">📦 Spare screw from the box (${Math.floor(s.shop.supplies['spare-screws'])} left)</button>`);
    for (const it of def.items)
      if (it.kind === 'heatsink' && st.removed.includes(it.id))
        extra.push(st.paste[it.id] ? `<p class="small">✓ Fresh paste on ${esc(it.chip ?? 'the chip')}.</p>` : `<button data-td-paste="${it.id}">Fresh thermal paste on ${esc(it.chip ?? 'the chip')} (${s.shop.supplies['thermal-paste'].toFixed(1)} g left)</button>`);
    for (const d of s.board.pcbDamage.filter((x) => x.screw))
      extra.push(
        st.removed.includes(d.screw!)
          ? `<button data-td-drill="${d.screw}">Drill out the via the screw bit into (${esc(d.near)})</button>`
          : `<p class="note small">⚠ The screw in ${esc(d.near.toLowerCase())} bit into the board. Take it out, then drill out the damaged via.</p>`,
      );
    (this.host.querySelector('#td-extra') as HTMLElement).innerHTML = extra.join('');
    (this.host.querySelector('#td-list') as HTMLElement).innerHTML = def.items
      .map((it) => {
        const off = st.removed.includes(it.id);
        const len = it.screw && !off ? ` · ${st.screws[it.id] ? `${st.screws[it.id]} mm` : 'empty'}` : '';
        return `<div class="kv"><span>${esc(it.label)}</span><b class="${off ? 'muted' : ''}">${off ? 'off' : 'on'}${len}</b></div>`;
      })
      .join('');
    (this.host.querySelector('#td-msgs') as HTMLElement).innerHTML = this.msgs.map((m) => `<div>${esc(m)}</div>`).join('');
    const guide = this.host.querySelector('#td-guide') as HTMLElement;
    guide.innerHTML = s.guided ? this.advice() : '';
    guide.style.display = s.guided ? '' : 'none';
  }

  private advice(): string {
    const s = this.session;
    const st = this.st;
    const def = this.def;
    if (!s.reachable) {
      const n = nextOpenStep(def, st);
      if (n) {
        const it = def.items.find((i) => i.id === n.id)!;
        return `Next: <b>${esc(it.label)}</b> with the <b>${n.tool}</b>.`;
      }
    }
    if (assembled(st)) return 'It is all closed up.';
    const back = def.items.find((i) => canInstall(def, st, i.id));
    if (back?.kind === 'heatsink' && !st.paste[back.id]) return `Before the ${esc(back.label)} goes back: fresh thermal paste (button below).`;
    if (back?.screw) return `The board is open. To close up: <b>Put back</b> (5), pick a <b>${back.screw.length} mm</b> screw from the mat for ${esc(back.label.toLowerCase())}.`;
    return `The board is open — work on it on the bench. To close up: <b>Put back</b> (5) and click the empty spots.`;
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
    const dev = this.session.job.device;
    const S = (this.scale = Math.min((W - 40) / dev.width, (H - 40) / dev.height));
    this.ox = (W - dev.width * S) / 2;
    this.oy = (H - dev.height * S) / 2;
    const X = (x: number) => this.ox + x * S;
    const Y = (y: number) => this.oy + y * S;
    ctx.fillStyle = '#5b6066';
    ctx.fillRect(0, 0, W, H);
    // The board underneath
    if (this.boardArt) ctx.drawImage(this.boardArt, X(0), Y(0), dev.width * S, dev.height * S);
    else {
      ctx.fillStyle = '#1e6e40';
      ctx.fillRect(X(0), Y(0), dev.width * S, dev.height * S);
    }
    const st = this.st;
    const color = this.def.color;
    const items = [...this.def.items].sort((a, b) => this.depth(b) - this.depth(a));
    const hover = this.mouse ? (this.mode === 'install' ? null : this.itemAt(this.mouse, false)) : null;
    for (const it of items) {
      const box = this.hitBox(it);
      const off = st.removed.includes(it.id);
      if (off) {
        // Ghost outline where it goes back
        if (this.mode === 'install' && canInstall(this.def, st, it.id)) {
          ctx.setLineDash([5, 4]);
          ctx.strokeStyle = 'rgba(255,220,120,0.9)';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(X(box.x), Y(box.y), box.w * S, box.h * S);
          ctx.setLineDash([]);
        }
        continue;
      }
      ctx.save();
      switch (it.kind) {
        case 'shell':
        case 'clips':
          ctx.fillStyle = color;
          ctx.globalAlpha = 0.97;
          ctx.beginPath();
          ctx.roundRect(X(box.x), Y(box.y), box.w * S, box.h * S, 4 * S);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.strokeStyle = 'rgba(0,0,0,0.35)';
          ctx.lineWidth = 2;
          ctx.stroke();
          if (it.kind === 'clips') {
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            for (let k = 1; k < 6; k++) {
              ctx.fillRect(X(box.x + (box.w * k) / 6) - 3, Y(box.y), 6, 3);
              ctx.fillRect(X(box.x + (box.w * k) / 6) - 3, Y(box.y + box.h) - 3, 6, 3);
            }
          }
          break;
        case 'adhesive':
          ctx.fillStyle = st.heated.includes(it.id) ? '#3d3a38' : '#26272a';
          ctx.beginPath();
          ctx.roundRect(X(box.x), Y(box.y), box.w * S, box.h * S, 6 * S);
          ctx.fill();
          break;
        case 'shield':
          ctx.fillStyle = '#b9bec3';
          ctx.fillRect(X(box.x), Y(box.y), box.w * S, box.h * S);
          ctx.fillStyle = 'rgba(0,0,0,0.12)';
          for (let x = box.x + 3; x < box.x + box.w; x += 5) for (let y = box.y + 3; y < box.y + box.h; y += 5) ctx.fillRect(X(x), Y(y), 1.6, 1.6);
          break;
        case 'heatsink':
          ctx.fillStyle = '#8f969c';
          ctx.fillRect(X(box.x), Y(box.y), box.w * S, box.h * S);
          ctx.strokeStyle = '#61676d';
          for (let x = box.x + 1.5; x < box.x + box.w; x += 2.5) {
            ctx.beginPath();
            ctx.moveTo(X(x), Y(box.y));
            ctx.lineTo(X(x), Y(box.y + box.h));
            ctx.stroke();
          }
          break;
        case 'fan':
          ctx.fillStyle = '#222';
          ctx.beginPath();
          ctx.arc(X(it.at[0]), Y(it.at[1]), (box.w / 2) * S, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#555';
          for (let k = 0; k < 7; k++) {
            const a = (k / 7) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(X(it.at[0]), Y(it.at[1]));
            ctx.quadraticCurveTo(X(it.at[0] + Math.cos(a) * 8), Y(it.at[1] + Math.sin(a) * 4), X(it.at[0] + Math.cos(a + 0.6) * 13), Y(it.at[1] + Math.sin(a + 0.6) * 13));
            ctx.stroke();
          }
          break;
        case 'cable':
          ctx.fillStyle = it.latch ? '#c88a2c' : '#f1eee6';
          ctx.fillRect(X(box.x), Y(box.y), box.w * S, box.h * S);
          ctx.fillStyle = it.latch ? (st.latchOpen.includes(it.id) ? '#e9e2c9' : '#111') : '#d33';
          ctx.fillRect(X(box.x), Y(box.y), box.w * S, 1.6 * S);
          break;
        case 'sticker':
          ctx.fillStyle = st.stickerBroken ? '#9aa3a8' : '#d9dfe3';
          ctx.fillRect(X(box.x), Y(box.y), box.w * S, box.h * S);
          ctx.fillStyle = '#4a5056';
          ctx.font = `${Math.max(8, 1.6 * S)}px Segoe UI, sans-serif`;
          ctx.fillText('VOID IF', X(box.x + 1), Y(box.y + 2.6));
          ctx.fillText('REMOVED', X(box.x + 1), Y(box.y + 5));
          if (st.stickerBroken) {
            ctx.strokeStyle = '#333';
            ctx.beginPath();
            ctx.moveTo(X(box.x), Y(box.y + box.h / 2));
            ctx.lineTo(X(box.x + box.w), Y(box.y + box.h / 3));
            ctx.stroke();
          }
          break;
        case 'screw': {
          const len = st.screws[it.id] ?? 0;
          const cx = X(it.at[0]);
          const cy = Y(it.at[1]);
          ctx.fillStyle = '#111';
          ctx.beginPath();
          ctx.arc(cx, cy, 1.6 * S, 0, Math.PI * 2);
          ctx.fill();
          if (len && st.stripped?.includes(it.id)) {
            ctx.fillStyle = '#6d7277';
            ctx.beginPath();
            ctx.arc(cx, cy, 1.4 * S, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#2b2f33';
            ctx.beginPath();
            ctx.arc(cx, cy, 0.7 * S, 0, Math.PI * 2);
            ctx.fill();
          } else if (len) {
            const g = ctx.createRadialGradient(cx - 0.4 * S, cy - 0.4 * S, 0.2, cx, cy, 1.4 * S);
            g.addColorStop(0, '#f2f4f5');
            g.addColorStop(1, '#7d848a');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(cx, cy, 1.4 * S, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#3b4045';
            ctx.lineWidth = Math.max(1, 0.25 * S);
            ctx.beginPath();
            ctx.moveTo(cx - 0.8 * S, cy);
            ctx.lineTo(cx + 0.8 * S, cy);
            ctx.moveTo(cx, cy - 0.8 * S);
            ctx.lineTo(cx, cy + 0.8 * S);
            ctx.stroke();
          }
          break;
        }
      }
      ctx.restore();
      if (hover === it) {
        ctx.strokeStyle = canRemove(this.def, st, it.id) ? '#ffd166' : 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(X(box.x) - 2, Y(box.y) - 2, box.w * S + 4, box.h * S + 4);
      }
    }
    // Label under the cursor
    if (this.mouse) {
      const it = this.mode === 'install' ? null : hover;
      if (it) {
        const free = canRemove(this.def, st, it.id);
        const label = `${it.label}${free ? (this.session.guided ? ` — ${rightTool(it, st)}` : '') : ' (something is still on top)'}`;
        ctx.font = '600 13px Segoe UI, sans-serif';
        const tw = ctx.measureText(label).width;
        const mx = X(this.mouse.x);
        const my = Y(this.mouse.y);
        ctx.fillStyle = 'rgba(10,12,14,0.8)';
        ctx.fillRect(mx + 14, my + 10, tw + 12, 22);
        ctx.fillStyle = '#e8e6e1';
        ctx.fillText(label, mx + 20, my + 25);
      }
    }
  }
}
