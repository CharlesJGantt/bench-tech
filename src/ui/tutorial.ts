/**
 * First-game walkthrough: a scripted lamp with a blown fuse, from the office to handing it
 * back, then a tour of the shop office. Each step points at what to use (a DOM element, a
 * pad on the board, or a pad under the microscope) and moves on by itself once the player
 * has done it. Skippable at any time; can be replayed from Help.
 */
import type { Session } from '../game/session';
import { jointResults, meltOf, type ReworkState, type ReworkTool } from '../rework/model';
import { assembled } from '../sim/enclosure';
import { Narrator, speakable, textHash } from './narrator';
import type { OfficeTab } from './office';

const KEY = 'benchtech.tutorial';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export interface TutorialHost {
  isSoldering(): boolean;
  openOffice(tab?: OfficeTab): void;
  closeModal(): void;
  /** Screen position (CSS px) of a pad or part on the board, or null if not visible. */
  screenOf(ref: string, pin?: string): { x: number; y: number } | null;
  focusOn(bx: number, by: number, dist: number): void;
  /** Pull the camera back so the whole board is in view. */
  focusBoard(): void;
  /** Outline these pads on the board (empty = none). */
  highlight(points: { ref: string; pin?: string }[]): void;
  /** The microscope bench, while it is open. */
  reworkState(): ReworkState | null;
  reworkTool(): ReworkTool | null;
  /** Screen position of pad i under the microscope. */
  reworkPad(i: number): { x: number; y: number } | null;
  /** Scroll the microscope's side panel to a section. */
  reworkReveal(selector: string): void;
  /** Put a tool in the player's hand at the microscope. */
  reworkSelect(tool: ReworkTool): void;
  /** Screen position of the part (the fuse) under the microscope. */
  reworkPart(): { x: number; y: number } | null;
  /** Show a short message (toast). */
  toast(msg: string): void;
}

/** A point to mark: a board pad, or pad i under the microscope. */
type Point = { ref: string; pin?: string; label?: string; info?: boolean } | { rw: number; label?: string; info?: boolean } | { rwPart: true; label?: string; info?: boolean };

interface Step {
  id: string;
  title: string;
  /** HTML body. */
  body: string;
  /** DOM element to ring (may depend on the state). */
  target?: string | ((s: Session) => string | null);
  /** More elements to make glow while this step is up. */
  glow?: string[] | ((s: Session) => string[]);
  /** Pads to mark, with an optional callout label. */
  points?: Point[] | ((s: Session) => Point[]);
  place?: 'bottom' | 'top' | 'side' | 'right';
  /** Manual steps show a Next button. */
  next?: string;
  done?: (s: Session) => boolean;
  /** Skip this step when it does not apply. */
  skip?: (s: Session) => boolean;
  enter?: (s: Session) => void;
  /** Steps to fall back to when this one no longer applies (e.g. the microscope was closed). */
  back?: { to: string; when: (s: Session) => boolean }[];
  /** The numbered "do this" list and what stays clickable (default: see META). */
  meta?: Meta;
  /** Extra card content that is shown but not read aloud (e.g. the narration on / off question). */
  ask?: string;
}

/** Which part of the walkthrough a step belongs to (shown as "Step 12 of 46 · Fixing the fuse"). */
const SECTIONS: [string, string[]][] = [
  ['Getting started', ['welcome', 'office', 'ticket']],
  ['Finding the fault', ['power', 'tp1', 'tp2', 'off', 'mode', 'fuse']],
  ['Fixing the fuse', ['select', 'rw-t-flux1', 'rw-flux', 'rw-t-wick', 'rw-wick', 'rw-t-tweezers', 'rw-lift', 'rw-bin', 'rw-tray', 'rw-place', 'rw-t-flux2', 'rw-flux2', 'rw-t-iron', 'rw-joints', 'rw-heat1', 'rw-feed1', 'rw-heat2', 'rw-feed2', 'rw-t-flux3', 'rw-flux3', 'rw-t-hotair', 'rw-hotair']],
  ['Cleaning up', ['rw-t-liquid', 'rw-liquid', 'rw-ipa', 'rw-t-brush', 'rw-brush', 'rw-t-wipe1', 'rw-wipe1', 'rw-t-liquid2', 'rw-rewet', 'rw-t-wipe2', 'rw-wipe2', 'rw-done', 'rw-lifted']],
  ['Testing and handing back', ['test-power', 'test-lamp', 'case-open', 'case-close', 'case-done', 'return', 'return-yes', 'end']],
];
const sectionOf = (id: string) => SECTIONS.find(([, ids]) => ids.includes(id))?.[0] ?? 'Office tour';

/**
 * Per-step extras: the numbered "do this" list (numbers match the badges on the highlighted
 * things), what the step lets the player click, and extra keys.
 *   ctx    the ringed element is only context (the whole multimeter): nothing in it is clickable
 *   canvas the microscope view can be clicked / dragged on
 *   allow  more elements that stay clickable
 *   keys   more keys that stay usable
 */
interface Meta {
  todo?: string[];
  ctx?: boolean;
  canvas?: boolean;
  allow?: string[];
  keys?: string[];
  /** Heating step: show the pad-heat warning and live gauge. */
  heat?: boolean;
}
const META: Record<string, Meta> = {
  welcome: { todo: ['Click Start the tutorial'] },
  office: { todo: ['Click Start next to Robin T.'] },
  ticket: { ctx: true, todo: ['Read the ticket, then click Next'] },
  power: { todo: ['Click Customer adapter'] },
  tp1: { ctx: true, todo: ['Click TP1 with the red probe'] },
  tp2: { ctx: true, todo: ['Click TP2'] },
  off: { todo: ['Click Off'] },
  mode: { todo: ['Click the continuity mode on the multimeter'] },
  fuse: { ctx: true, todo: ['Left-click one end of F1 (red probe)', 'Right-click the other end of F1 (black probe)'] },
  select: { todo: ['Choose Soldering (key 3) — later: click Rework at the microscope', 'Click the fuse F1 on the board'] },
  'rw-flux': { todo: ['Pick the Flux tool', 'Paint every marked pad (clicking again adds more flux)'] },
  'rw-wick': { canvas: true, keys: ['c'], todo: ['Pick the Wick tool', 'Hold it on each marked joint until the solder is gone'] },
  'rw-lift': { canvas: true, todo: ['Pick the Tweezers', 'Click the fuse to lift it, then press Delete to bin it'] },
  'rw-tray': { todo: ['Click New beside Fuse 1A fast'] },
  'rw-place': { canvas: true, todo: ['Click the empty footprint to set the fuse down'] },
  'rw-flux2': { todo: ['Pick the Flux tool', 'Paint both marked pads'] },
  'rw-flux3': { todo: ['Pick the Flux tool', 'Paint both marked pads'] },
  'rw-hotair': { canvas: true, todo: ['Pick Hot air', 'Sweep it back and forth over both joints until about 300°C, then stop'] },
  'rw-liquid': { allow: ['select[data-kit="liquid"]'], todo: ['Pick the Liquid tool', 'Check the Cleaning liquid says IPA'] },
  'rw-ipa': { canvas: true, todo: ['Liquid tool (in your hand)', 'Wet each marked joint until the flux dissolves'] },
  'rw-brush': { canvas: true, todo: ['Pick the Brush', 'Scrub each marked joint'] },
  'rw-wipe1': { canvas: true, todo: ['Pick the Wipe', 'Wipe the joint that is still wet'] },
  'rw-rewet': { canvas: true, todo: ['Pick the Liquid tool', 'Re-wet the dried residue'] },
  'rw-wipe2': { canvas: true, todo: ['Pick the Wipe', 'Wipe the rest away'] },
  'rw-done': { todo: ['Click Done'] },
  'rw-lifted': { todo: ['Click Undo all, then confirm'] },
  'test-power': { todo: ['Click Customer adapter'] },
  'test-lamp': { keys: [' '], todo: ['Press and hold the lamp button (or hold Space)'] },
  'case-open': { todo: ['Click Case: open'] },
  'case-close': { todo: ['Click Close it up for me'] },
  'case-done': { todo: ['Click Done'] },
  return: { todo: ['Click Return to customer'] },
  'return-yes': { todo: ['Click Return to Robin T.'] },
  end: { todo: ['Click Tour the office'] },
};
/** The office tour only explains: the highlighted tab / button is context, Next moves on. */
const metaOf = (st: Step): Meta => st.meta ?? META[st.id] ?? { ctx: true, todo: ['Read this, then click Next'] };

const netOf = (s: Session, p: { ref: string; pin: string } | null) => (p ? s.board.comps[p.ref]?.def.pins[p.pin] : undefined);
const visible = (sel: string) => {
  const el = document.querySelector<HTMLElement>(sel);
  return !!el && el.offsetParent !== null;
};

export class Tutorial {
  private step = -1;
  private jobId = 0;
  private timer = 0;
  private card = document.createElement('div');
  private ring = document.createElement('div');
  private marks: HTMLDivElement[] = [];
  private glowing: HTMLElement[] = [];
  private steps: Step[];
  private minimized = false;
  private voice = new Narrator();
  private narrationText = '';

  constructor(
    private s: Session,
    private host: TutorialHost,
  ) {
    this.card.id = 'tut-card';
    this.ring.id = 'tut-ring';
    document.body.append(this.ring, this.card);
    this.card.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('[data-tut]');
      if (!b) return;
      e.stopPropagation();
      if (b.dataset.tut === 'next') this.go(this.step + 1);
      if (b.dataset.tut === 'skip') this.finish();
      if (b.dataset.tut === 'voice') {
        this.voice.setEnabled(!this.voice.enabled);
        b.textContent = this.voice.enabled ? '🔊' : '🔇';
        b.title = this.voice.enabled ? 'Voice on: click to turn the narration off' : 'Voice off: click to turn the narration on';
        if (this.voice.enabled) this.narrate();
      }
      if (b.dataset.tut === 'replay') this.narrate();
      if (b.dataset.tut === 'voice-on' || b.dataset.tut === 'voice-off') {
        const on = b.dataset.tut === 'voice-on';
        this.voice.setEnabled(on);
        this.card.querySelectorAll('[data-tut^="voice-"]').forEach((x) => x.classList.toggle('chosen', x === b));
        const head = this.card.querySelector<HTMLElement>('[data-tut="voice"]');
        if (head) head.textContent = on ? '🔊' : '🔇';
        // The click is the gesture the browser wants before it will play sound
        if (on) this.narrate();
        else this.card.querySelector<HTMLButtonElement>('[data-tut="next"]')?.removeAttribute('disabled');
      }
      if (b.dataset.tut === 'min') {
        this.minimized = !this.minimized;
        this.card.classList.toggle('tut-min', this.minimized);
        b.textContent = this.minimized ? '▴' : '▾';
      }
    });
    this.steps = this.build();
    this.hide();
    // Lock the game down to the highlighted thing(s) while the walkthrough runs
    for (const type of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click', 'dblclick', 'contextmenu'])
      window.addEventListener(type, (e) => this.guard(e), true);
    window.addEventListener('keydown', (e) => this.guardKey(e), true);
    window.addEventListener('keyup', (e) => this.guardKey(e, true), true);
  }

  // ---------------------------------------------------------------- lock-out

  /** Elements the player may use right now (the highlighted ones, plus what the step allows). */
  private allowedEls(): HTMLElement[] {
    const st = this.steps[this.step];
    if (!st) return [];
    const m = metaOf(st);
    const sels: string[] = [];
    const t = typeof st.target === 'function' ? st.target(this.s) : st.target;
    if (t && !m.ctx) sels.push(t);
    sels.push(...(typeof st.glow === 'function' ? st.glow(this.s) : (st.glow ?? [])), ...(m.allow ?? []));
    if (m.canvas || this.pointsOf(st).some((p) => 'rw' in p || 'rwPart' in p)) sels.push('#rw-canvas');
    return sels.flatMap((sel) => [...document.querySelectorAll<HTMLElement>(sel)]);
  }

  private pointsOf(st: Step): Point[] {
    return typeof st.points === 'function' ? st.points(this.s) : (st.points ?? []);
  }

  private static readonly INTERACTIVE = 'button, a, select, input, textarea, label, summary, [data-act], [data-ctl], [data-tool], [data-rw-tool], [data-rw-part], [data-td-tool], [data-td-len], #rw-canvas, #td-canvas';
  private lastNag = 0;

  /** Say (once in a while) why nothing happened. */
  private nag(): void {
    const now = Date.now();
    this.card.classList.remove('tut-shake');
    void this.card.offsetWidth;
    this.card.classList.add('tut-shake');
    if (now - this.lastNag < 2500) return;
    this.lastNag = now;
    this.host.toast('🔒 The tutorial is guiding you: use the highlighted item, or press Skip tutorial to play freely.');
  }

  private guard(e: Event): void {
    if (this.step < 0) return;
    const t = e.target as HTMLElement | null;
    if (!t || !(t instanceof Element)) return;
    // Always usable: the tutorial card, the music controls, the splash
    if (t.closest('#tut-card, #music, #music-hint, #splash')) return;
    // The dimmed backdrop of a window (clicking it would close the office / microscope)
    if (t.id === 'modal') return this.block(e);
    const hit = t.closest<HTMLElement>(Tutorial.INTERACTIVE);
    if (!hit) return; // plain panel background / text / the 3D view (its picks are checked in allowsBoard)
    const ok = this.allowedEls().some((a) => a === hit || a.contains(hit) || hit.contains(a) && hit.matches('label'));
    if (!ok) this.block(e);
  }

  private block(e: Event): void {
    e.stopImmediatePropagation();
    e.preventDefault();
    if (e.type === 'pointerdown' || e.type === 'click') this.nag();
  }

  /** Keys that stay usable: Space / Delete / modifiers, the highlighted tool's own key, and the step's extras. */
  private guardKey(e: KeyboardEvent, up = false): void {
    if (this.step < 0) return;
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    const k = e.key;
    if ([' ', 'Delete', 'Backspace', 'Shift', 'Control', 'Alt', 'Meta', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(k)) return;
    const m = metaOf(this.steps[this.step]);
    if (m.keys?.includes(k.toLowerCase())) return;
    const fromTarget = this.allowedEls().flatMap((el) => [...el.querySelectorAll('kbd')].map((x) => (x.textContent ?? '').trim().toLowerCase()));
    if (fromTarget.includes(k.toLowerCase())) return;
    e.stopImmediatePropagation();
    e.preventDefault();
    if (!up && k !== 'Escape') this.nag();
  }

  /** The 3D board: only the pads / parts the step points at can be picked. */
  allowsBoard(hit: { pad: { ref: string; pin: string } | null; comp: string | null } | null): boolean {
    if (this.step < 0) return true;
    const pts = this.pointsOf(this.steps[this.step]).filter((p): p is { ref: string; pin?: string; label?: string } => 'ref' in p && !p.info);
    const ok = !!hit && pts.some((p) => (hit.pad ? hit.pad.ref === p.ref && (!p.pin || hit.pad.pin === p.pin) : false) || hit.comp === p.ref);
    if (!ok) this.nag();
    return ok;
  }

  get active(): boolean {
    return this.step >= 0;
  }

  /** True on a brand-new player, or a tutorial left half-way. */
  static pending(): { step: number; id?: string; jobId: number } | 'new' | null {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw === 'done') return null;
      if (raw) return JSON.parse(raw);
      return localStorage.getItem('benchtech.seenHelp') ? null : 'new';
    } catch {
      return null;
    }
  }

  /** Start from the welcome card (a tutorial customer is added to the queue). */
  start(): void {
    this.jobId = this.s.addTutorialJob();
    this.go(0);
  }

  /** Pick up where a reload left off. */
  resume(state: { step: number; id?: string; jobId: number }): void {
    const byId = state.id ? this.steps.findIndex((x) => x.id === state.id) : -1;
    const step = byId >= 0 ? byId : Math.min(state.step, this.steps.length - 1);
    const exists = this.s.shop.queue.some((q) => q.id === state.jobId) || this.s.shop.active?.id === state.jobId;
    if (!exists && step < this.index('return')) {
      this.start();
      return;
    }
    this.jobId = state.jobId;
    this.go(step);
  }

  private index(id: string): number {
    return this.steps.findIndex((x) => x.id === id);
  }

  private go(i: number): void {
    while (i < this.steps.length && this.steps[i].skip?.(this.s)) i++;
    if (i >= this.steps.length) {
      this.finish();
      return;
    }
    this.step = i;
    try {
      localStorage.setItem(KEY, JSON.stringify({ step: i, id: this.steps[i].id, jobId: this.jobId }));
      localStorage.setItem('benchtech.seenHelp', '1');
    } catch {
      /* ignore */
    }
    const st = this.steps[i];
    st.enter?.(this.s);
    this.render();
    clearInterval(this.timer);
    this.timer = window.setInterval(() => this.tick(), 250);
  }

  private finish(): void {
    clearInterval(this.timer);
    this.step = -1;
    try {
      localStorage.setItem(KEY, 'done');
      localStorage.setItem('benchtech.seenHelp', '1');
    } catch {
      /* ignore */
    }
    this.voice.stop();
    this.hide();
    // Others (the music hint) wait for the walkthrough to be over
    window.dispatchEvent(new Event('benchtech:tutorial-done'));
  }

  private hide(): void {
    this.card.style.display = 'none';
    this.ring.style.display = 'none';
    for (const m of this.marks) m.remove();
    this.marks = [];
    this.setGlow([]);
    this.host.highlight([]);
    this.lock([]);
    document.body.classList.remove('tut-locked', 'tut-canvas-ok');
  }

  private tick(): void {
    if (this.step < 0) return;
    const st = this.steps[this.step];
    if (st.done?.(this.s)) {
      this.go(this.step + 1);
      return;
    }
    const back = st.back?.find((b) => b.when(this.s));
    if (back) {
      this.go(this.index(back.to));
      return;
    }
    this.position();
  }

  private render(): void {
    const st = this.steps[this.step];
    const n = this.steps.length;
    this.minimized = false;
    this.card.className = `tut-${st.place ?? 'bottom'}`;
    this.card.style.display = 'block';
    const todo = metaOf(st).todo ?? [];
    this.card.innerHTML = `<div class="tut-head"><span class="tut-step">Step ${this.step + 1} of ${n} · ${esc(sectionOf(st.id))}</span><span class="row" style="margin:0;gap:4px">${this.voice.supported ? `<button class="tut-skip" data-tut="replay" title="Hear this step again">↻</button><button class="tut-skip" data-tut="voice" title="${this.voice.enabled ? 'Voice on: click to turn the narration off' : 'Voice off: click to turn the narration on'}">${this.voice.enabled ? '🔊' : '🔇'}</button>` : ''}<button class="tut-skip" data-tut="min" title="Collapse / expand">▾</button><button class="tut-skip" data-tut="skip" title="End the tutorial">Skip tutorial ✕</button></span></div>
      <div class="tut-progress"><i style="width:${Math.round(((this.step + 1) / n) * 100)}%"></i></div>
      <h3>${esc(st.title)}</h3>
      ${todo.length ? `<ol class="tut-todo">${todo.map((t, i) => `<li><span class="tut-n">${i + 1}</span>${esc(t)}</li>`).join('')}</ol>` : ''}
      <div class="tut-body">${st.body}</div>${st.ask ?? ''}
      <div class="tut-foot">${st.next ? `<button class="primary" data-tut="next" data-label="${esc(st.next)}">${esc(st.next)}</button>` : '<span class="muted small">Do it on the bench — this moves on by itself.</span>'}</div>`;
    this.position();
    this.narrate();
  }

  /** Read the current step aloud; "Next" waits until the reading is done so nothing is skipped. */
  private narrate(): void {
    const st = this.steps[this.step];
    if (!st) return;
    this.narrationText = this.narrationFor(st);
    const next = this.card.querySelector<HTMLButtonElement>('[data-tut="next"]');
    const gate = !!next && this.voice.enabled;
    if (next && gate) {
      next.disabled = true;
      next.textContent = '🔊 Listening…';
    }
    const release = () => {
      if (next && this.card.contains(next)) {
        next.disabled = false;
        next.textContent = next.dataset.label ?? 'Next';
      }
    };
    void this.voice.speak(st.id, this.narrationText).then(release);
    // If the clip never reports its end, do not trap the player
    if (gate) window.setTimeout(release, Math.max(6000, this.narrationText.length * 90));
  }

  /** What the voice says for a step: its title, the numbered to-do list, any heat warning and the explanation. */
  private narrationFor(st: Step): string {
    const m = metaOf(st);
    // Say the action itself ("Click the continuity mode on the multimeter."), then the explanation.
    // The office tour has no action to announce, only text to read.
    const todo = st.meta || META[st.id] ? (m.todo ?? []) : [];
    const lead = ['First, ', 'Then, ', 'After that, ', 'Finally, '];
    const actions = todo.map((t, i) => `<p>${todo.length > 1 ? (i === todo.length - 1 && todo.length > 2 ? lead[3] : lead[Math.min(i, 2)]) : ''}${esc(t.replace(/\.$/, ''))}.</p>`).join('');
    // The full heat warning is spoken once (the first heating step); after that a short reminder
    const firstHeat = this.steps.find((x) => metaOf(x).heat)?.id;
    const warn = !m.heat
      ? ''
      : st.id === firstHeat
        ? '<p>Warning. Heat kills pads. A pad that stays molten for about ten seconds, or gets far above 320 degrees, burns and lifts off the board, and the repair is ruined. Work in short bursts, watch the pad heat bar, and let go before it fills.</p>'
        : '<p>Watch the pad heat bar, and let go before it fills.</p>';
    const html = `${actions}${warn}${st.body}`;
    return speakable(html);
  }

  /** Narration text and clip hash for every step (used by `npm run voice` to record the clips). */
  scripts(): { id: string; text: string; hash: string }[] {
    return this.steps.map((st) => {
      const text = this.narrationFor(st);
      return { id: st.id, text, hash: textHash(text) };
    });
  }

  private okEls: HTMLElement[] = [];

  /** Mark what is usable (everything else interactive is dimmed by CSS while the lock is on). */
  private lock(els: HTMLElement[]): void {
    for (const el of this.okEls) if (!els.includes(el)) el.classList.remove('tut-ok');
    for (const el of els) el.classList.add('tut-ok');
    this.okEls = els;
    document.body.classList.add('tut-locked');
    document.body.classList.toggle('tut-canvas-ok', els.some((e) => e.id === 'rw-canvas'));
  }

  private setGlow(selectors: string[]): void {
    const els = selectors.flatMap((sel) => [...document.querySelectorAll<HTMLElement>(sel)]);
    for (const el of this.glowing) if (!els.includes(el)) el.classList.remove('tut-glow');
    for (const el of els) el.classList.add('tut-glow');
    this.glowing = els;
  }

  /** Ring the target element, light up the glow elements and mark points. */
  private position(): void {
    const st = this.steps[this.step];
    const sel = typeof st.target === 'function' ? st.target(this.s) : st.target;
    const el = sel ? document.querySelector<HTMLElement>(sel) : null;
    const r = el && el.offsetParent !== null ? el.getBoundingClientRect() : null;
    if (r && r.width) {
      Object.assign(this.ring.style, { display: 'block', left: `${r.left - 5}px`, top: `${r.top - 5}px`, width: `${r.width + 10}px`, height: `${r.height + 10}px` });
    } else this.ring.style.display = 'none';
    this.setGlow(typeof st.glow === 'function' ? st.glow(this.s) : (st.glow ?? []));
    // Numbers on the things to use, matching the numbered list on the card: the ringed element
    // is 1 (unless it is only context), then each different marker in turn.
    const meta = metaOf(st);
    let nextN = 1;
    if (r && r.width && !meta.ctx) this.ring.dataset.n = String(nextN++);
    else delete this.ring.dataset.n;
    this.lock(this.allowedEls());

    const points = this.pointsOf(st);
    const numbers: (number | null)[] = [];
    const byLabel = new Map<string, number>();
    for (const p of points) {
      if (p.info) {
        numbers.push(null);
        continue;
      }
      const key = p.label ?? '';
      if (!byLabel.has(key)) byLabel.set(key, nextN++);
      numbers.push(byLabel.get(key)!);
    }
    // Board markers hide while a modal (office, microscope) covers the board; microscope
    // markers only show while it is open.
    const covered = document.querySelector('#modal.show') !== null;
    const board = points.filter((p): p is { ref: string; pin?: string; label?: string } => 'ref' in p);
    this.host.highlight(covered ? [] : board);
    const pts = points.map((p) => ('rw' in p ? this.host.reworkPad(p.rw) : 'rwPart' in p ? this.host.reworkPart() : covered ? null : this.host.screenOf(p.ref, p.pin)));
    while (this.marks.length < pts.length) {
      const m = document.createElement('div');
      m.className = 'tut-mark';
      document.body.append(m);
      this.marks.push(m);
    }
    while (this.marks.length > pts.length) this.marks.pop()!.remove();
    pts.forEach((p, i) => {
      const m = this.marks[i];
      m.style.display = p ? 'block' : 'none';
      if (p) Object.assign(m.style, { left: `${p.x}px`, top: `${p.y}px` });
      const label = points[i].label ?? '';
      const key = `${numbers[i] ?? ''}|${label}`;
      if (m.dataset.label !== key) {
        m.dataset.label = key;
        const badge = numbers[i] ? `<span class="tut-n">${numbers[i]}</span>` : '';
        m.innerHTML = label || badge ? `<span class="tut-mark-label">${badge}${esc(label)}</span>` : '';
      }
    });
  }

  // ---------------------------------------------------------------- the script

  private build(): Step[] {
    const host = this.host;
    const onJob = (s: Session) => s.shop.active?.id === this.jobId;
    const fuseDone = (s: Session) => {
      const f = s.board.comps.F1;
      return !!f.part && !f.fault && f.replaced;
    };
    const bench = () => host.reworkState();
    const tool = () => host.reworkTool();
    const pads = (rs: ReworkState) => rs.pads.map((p, i) => ({ p, i })).filter(({ p }) => !p.lifted);
    /** The blown fuse is still on the pads (not a new one fitted on an earlier visit). */
    const oldFuseOn = (s: Session) => !!bench()?.part?.original && !s.board.comps.F1.replaced;
    /** A new fuse sits on the pads (placed now, or fitted on an earlier visit). */
    const newFuseOn = (s: Session) => {
      const rs = bench();
      return !!rs?.part && (!rs.part.original || s.board.comps.F1.replaced);
    };
    const jointsMade = (s: Session) => {
      const rs = bench();
      if (!rs || !newFuseOn(s)) return false;
      const res = jointResults(rs);
      if (res.every((r) => r === 'unchanged')) return fuseDone(s);
      return res.every((r) => r === 'good' || r === 'excess' || r === 'cold');
    };
    const ring = (id: string) => `[data-rw-tool="${id}"]`;
    // Closing the microscope part-way sends the walkthrough back to "open the microscope".
    const reopen = { to: 'select', when: (s: Session) => !host.isSoldering() && !fuseDone(s) };
    // A pad burned off: stop and point at Undo all.
    const liftedPad = { to: 'rw-lifted', when: () => !!bench()?.pads.some((p) => p.lifted) };
    const rwBack = [reopen, liftedPad];

    // The hot-air reflow: both joints have to reach 300 °C while the step is up.
    let peak: number[] = [];

    const keyOf: Record<ReworkTool, string> = { iron: '1', wick: '2', flux: '3', tweezers: '4', hotair: '5', ipa: '6', brush: '7', wipe: '8' };
    const toolName: Record<ReworkTool, string> = { iron: 'Iron', wick: 'Wick', flux: 'Flux', tweezers: 'Tweezers', hotair: 'Hot air', ipa: 'Liquid', brush: 'Brush', wipe: 'Wipe' };
    /** "Select the X tool": one click, done as soon as it is in hand (skipped if it already is). */
    const pickTool = (id: string, t: ReworkTool, why: string, skipMore?: (s: Session) => boolean): Step => ({
      id,
      title: `Select the ${toolName[t]}`,
      place: 'side',
      target: ring(t),
      meta: { todo: [`Click ${toolName[t]} (or press ${keyOf[t]})`] },
      body: `<p>${why}</p>`,
      done: () => !!bench() && tool() === t,
      skip: (s) => (!!bench() && tool() === t) || !!skipMore?.(s),
      back: rwBack,
    });
    /** Pads that still need solder (open or starved). */
    const needy = (rs: ReworkState) => jointResults(rs).map((r, i) => ({ r, i })).filter(({ r, i }) => !rs.pads[i].lifted && (r === 'open' || r === 'starved')).map(({ i }) => i);
    const joined = (rs: ReworkState, i: number) => ['good', 'excess', 'cold'].includes(jointResults(rs)[i]);
    let heatIdx = [-1, -1];
    /** "Heat pad N" then "Feed solder on pad N": one action each. */
    const solderPad = (n: 0 | 1): Step[] => {
      const pad = () => heatIdx[n];
      const mark = (label: string) => () => (pad() >= 0 ? [{ rw: pad(), label }] : []);
      return [
        {
          id: `rw-heat${n + 1}`,
          title: n === 0 ? 'Heat the first pad' : 'Heat the second pad',
          place: 'side',
          meta: { canvas: true, heat: true, todo: ['Press and hold the mouse button on the marked pad until the readout says MOLTEN'] },
          glow: ['#rw-joints'],
          body: `<p>Hold the iron's tip on the pad (hover it to read its temperature). Solder melts at about 220°C, so <b>MOLTEN</b> appears long before the pad is in danger. Keep the pad under about 320°C.</p>`,
          enter: () => {
            const rs = bench();
            heatIdx[n] = rs ? (needy(rs)[0] ?? -1) : -1;
          },
          points: mark('hold the iron here'),
          done: () => {
            const rs = bench();
            return !!rs && pad() >= 0 && rs.pads[pad()].temp >= meltOf(rs.pads[pad()]);
          },
          skip: () => {
            const rs = bench();
            return !!rs && needy(rs).length === 0;
          },
          back: rwBack,
        },
        {
          id: `rw-feed${n + 1}`,
          title: 'Feed in the solder',
          place: 'side',
          meta: { canvas: true, heat: true, keys: [' '], todo: ['Keep the iron on the pad (still MOLTEN) and hold Space for 1–2 seconds'] },
          glow: ['#rw-joints'],
          body: `<p>Holding <kbd>Space</kbd> feeds solder wire into the molten joint. In the <b>Joints</b> panel the solder bar should reach about <b>half (50%)</b>: a solid joint without a blob. Then let go and lift the iron.</p>`,
          points: mark('then hold Space'),
          done: () => {
            const rs = bench();
            return !!rs && pad() >= 0 && joined(rs, pad());
          },
          skip: () => {
            const rs = bench();
            return !!rs && (pad() < 0 || joined(rs, pad()));
          },
          back: [
            ...rwBack,
            { to: `rw-heat${n + 1}`, when: () => { const rs = bench(); return !!rs && pad() >= 0 && rs.pads[pad()].temp < meltOf(rs.pads[pad()]) - 20 && !joined(rs, pad()); } },
          ],
        },
      ];
    };

    /** A "flux both pads" step: done once every pad got a fresh coat while it was up. */
    const fluxStep = (id: string, title: string, body: string, skip?: (s: Session) => boolean): Step => {
      // Flux only ever goes up when the player paints it on, so watch for a rise on each pad.
      let prev: number[] | null = null;
      let got: boolean[] = [];
      const sample = (rs: ReworkState) => {
        rs.pads.forEach((p, i) => {
          if (prev && p.flux > prev[i] + 0.005) got[i] = true;
        });
        prev = rs.pads.map((p) => p.flux);
      };
      const fresh = (rs: ReworkState, i: number) => !!got[i] && rs.pads[i].flux >= 0.3;
      return {
        id,
        title,
        place: 'side',
        body,
        meta: { canvas: true, todo: ['Click or hold on every marked pad (clicking again adds more flux)'] },
        enter: () => {
          prev = bench()?.pads.map((p) => p.flux) ?? null;
          got = [];
        },
        points: () => {
          const rs = bench();
          return rs ? pads(rs).filter(({ i }) => !fresh(rs, i)).map(({ i }) => ({ rw: i, label: 'flux here' })) : [];
        },
        done: () => {
          const rs = bench();
          if (!rs) return false;
          sample(rs);
          return pads(rs).every(({ i }) => fresh(rs, i));
        },
        skip,
        back: rwBack,
      };
    };

    return [
      {
        id: 'welcome',
        title: 'Welcome to Bench Tech!',
        place: 'top',
        body: `<p>You've just opened a little electronics repair shop. This walkthrough fixes your first job with you — a desk lamp that will not turn on — one step at a time, then shows you around the office.</p>
          <p class="muted small">Takes about 10 minutes. You can skip it now or at any point, and replay it later from <b>? Help</b>.</p>`,
        ask: `<div class="tut-voice-ask"><b>Want the tutorial read out loud?</b><div class="row" style="margin:6px 0 0"><button data-tut="voice-on">🔊 Yes, read it to me</button><button data-tut="voice-off" class="chosen">No thanks</button></div></div>`,
        next: 'Start the tutorial',
      },
      {
        id: 'office',
        title: 'Your shop office',
        target: '[data-act="start-work"][data-tutorial="1"]',
        body: `<p>This is the office: customers wait here, and so do your supplies, orders and money. <b>Robin T.</b> has brought in a lamp.</p>`,
        enter: () => host.openOffice('work'),
        done: onJob,
      },
      {
        id: 'ticket',
        title: 'Read the repair ticket',
        target: '#ticket',
        place: 'top',
        body: `<p>The ticket says what the customer noticed: <i>completely dead</i>. Always start with the symptom.</p>
          <p>Stuck later? <b>Need a nudge?</b> on the ticket gives a hint, and the <b>Service sheet</b> shows the board's blocks and test points.</p>`,
        next: 'Next',
      },
      {
        id: 'power',
        title: 'Power it up',
        target: '[data-act="power"][data-mode="adapter"]',
        body: `<p>The customer's own adapter powers the lamp. Watch the status lines under the buttons: nothing lights up. Now let's find out why.</p>`,
        done: (s) => s.powerMode === 'adapter',
      },
      {
        id: 'tp1',
        title: 'Measure where power comes in',
        target: '#meter',
        points: [
          { ref: 'TP1', pin: '1', label: 'TP1 · red probe here' },
          { ref: 'TP5', pin: '1', label: 'GND · black clip', info: true },
        ],
        body: `<p>The multimeter is set to <b>volts</b>, and we have clipped its black probe to ground (TP5) for you. The <b>Black → GND</b> button does that any time.</p><p>The red probe goes on the raw input, where the adapter's power arrives.</p>`,
        enter: (s) => {
          s.tool = 'probe';
          s.activeProbe = 'red';
          s.setMeterMode('dcv');
          if (!s.meter.black) s.setProbe('black', { ref: s.board.device.ground, pin: '1' });
          host.focusOn(25, 30, 95);
        },
        done: (s) => s.powerMode !== 'off' && netOf(s, s.meter.red) === 'IN_VIN' && (s.reading?.value ?? 0) > 9,
      },
      {
        id: 'tp2',
        title: 'Follow the power',
        target: '#meter',
        points: [
          { ref: 'TP2', pin: '1', label: 'TP2 · red probe here' },
          { ref: 'TP5', pin: '1', label: 'GND · black clip', info: true },
        ],
        body: `<p>TP1 reads about <b>12 V</b>: power is getting into the board.</p><p>TP2 is the 12 V rail a little further along, after the protection parts.</p>`,
        done: (s) => s.powerMode !== 'off' && netOf(s, s.meter.red) === '12V_SYS',
      },
      {
        id: 'off',
        title: 'Power off before testing parts',
        target: '[data-act="power"][data-mode="off"]',
        body: `<p>TP2 reads <b>0 V</b>! Power gets in at TP1 but is lost before TP2. The only part between them is the fuse, <b>F1</b>, so let's test it.</p><p>Resistance, continuity and diode tests only make sense with the power <b>off</b>.</p>`,
        done: (s) => s.powerMode === 'off',
      },
      {
        id: 'mode',
        title: 'Switch to continuity',
        target: '[data-act="mode"][data-mode="continuity"]',
        body: `<p>In continuity mode the meter <b>beeps</b> when the two probes are connected through almost nothing: perfect for checking a fuse.</p>`,
        enter: () => host.focusOn(19, 25, 38),
        done: (s) => s.meter.mode === 'continuity',
      },
      {
        id: 'fuse',
        title: 'Check the fuse',
        target: '#meter',
        points: [
          { ref: 'F1', pin: '1', label: 'F1 end · left-click' },
          { ref: 'F1', pin: '2', label: 'F1 end · right-click' },
        ],
        body: `<p>A good fuse beeps and reads close to 0 Ω.</p>`,
        done: (s) => {
          const r = s.meter.red;
          const b = s.meter.black;
          return s.meter.mode === 'continuity' && r?.ref === 'F1' && b?.ref === 'F1' && r.pin !== b.pin;
        },
      },
      {
        id: 'select',
        title: 'Take it to the microscope',
        place: 'right',
        target: () => (visible('[data-act="rework"]') ? '[data-act="rework"]' : '[data-tool="iron"]'),
        points: [{ ref: 'F1', label: 'F1 · the fuse' }],
        body: `<p>No beep, and the meter reads <b>OL</b>, an open circuit: the fuse has blown. Found it!</p><p>The part card that opens on the left has the button that takes you to the microscope.</p>`,
        enter: (s) => {
          s.tool = 'iron';
          s.emit();
        },
        done: () => host.isSoldering(),
      },

      // ------------------------------------------------ at the microscope: off with the old one
      pickTool('rw-t-flux1', 'flux', 'Welcome to the microscope. The <b>yellow hint box</b> on the right always suggests the next move. First, flux: it lets the heat flow and the old solder run.', (s) => !!bench() && !oldFuseOn(s)),
      fluxStep('rw-flux', 'Flux the old joints', '<p>Flux on both ends of the fuse helps the heat flow and the old solder run.</p>', (s) => !!bench() && !oldFuseOn(s)),
      pickTool('rw-t-wick', 'wick', 'The wick is a copper braid: heated, it soaks the molten solder up off the pad.', (s) => !!bench() && !oldFuseOn(s)),
      {
        id: 'rw-wick',
        title: 'Wick the old solder off',
        place: 'side',
        meta: { canvas: true, heat: true, keys: ['c'], todo: ['Hold the wick on each marked joint until the solder is gone'] },
        glow: ['#rw-joints'],
        body: `<p>Press and hold on a joint: the iron heats through the braid and the solder runs into it. The pad should end up bare copper. If the wick end turns silver, cut it off with <kbd>C</kbd>; if the flux is gone, add more.</p>`,
        points: () => {
          const rs = bench();
          return rs ? pads(rs).filter(({ p }) => p.solder >= 0.15).map(({ i }) => ({ rw: i, label: 'wick here' })) : [];
        },
        done: (s) => {
          const rs = bench();
          return !!rs && (!oldFuseOn(s) || pads(rs).every(({ p }) => p.solder < 0.15));
        },
        back: rwBack,
      },
      pickTool('rw-t-tweezers', 'tweezers', 'The tweezers pick parts up and set them down.', (s) => !!bench() && !oldFuseOn(s)),
      {
        id: 'rw-lift',
        title: 'Lift out the blown fuse',
        place: 'side',
        meta: { canvas: true, todo: ['Click the fuse to pick it up with the tweezers'] },
        body: `<p>✓ The solder is off, so nothing holds the fuse down any more.</p>`,
        points: [{ rwPart: true, label: 'click the fuse' }],
        done: () => {
          const rs = bench();
          return !!rs && rs.removedOriginal && (!!rs.held || !!rs.part);
        },
        skip: (s) => !!bench() && !oldFuseOn(s) && !!bench()?.removedOriginal,
        back: rwBack,
      },
      {
        id: 'rw-bin',
        title: 'Throw the bad fuse away',
        place: 'side',
        meta: { todo: ['Press Delete on your keyboard to bin the fuse in the tweezers'] },
        body: `<p>The blown fuse is no use to anyone any more.</p>`,
        done: () => {
          const rs = bench();
          return !!rs && rs.removedOriginal && !rs.held;
        },
        skip: () => !!bench() && !bench()!.held && bench()!.removedOriginal,
        back: rwBack,
      },

      // ------------------------------------------------ on with the new one
      {
        id: 'rw-tray',
        title: 'Select a new fuse',
        place: 'side',
        target: '[data-rw-part="F-1A"]',
        meta: { todo: ['Click New beside Fuse 1A fast in the Parts tray'] },
        body: `<p>It comes out of your stock and lands in the tweezers.</p>`,
        enter: () => host.reworkReveal('#rw-tray'),
        done: (s) => !!bench()?.held || newFuseOn(s),
        skip: (s) => newFuseOn(s),
        back: rwBack,
      },
      {
        id: 'rw-place',
        title: 'Place the new fuse',
        place: 'side',
        meta: { canvas: true, todo: ['Click the empty footprint to set the fuse down on the pads'] },
        body: `<p>It only counts if it sits on both pads.</p>`,
        points: [{ rwPart: true, label: 'click here to place it' }],
        done: (s) => newFuseOn(s),
        skip: (s) => newFuseOn(s),
        back: [...rwBack, { to: 'rw-tray', when: (s) => !bench()?.held && !newFuseOn(s) }],
      },
      pickTool('rw-t-flux2', 'flux', 'Flux again, so the solder flows into the new joints.', (s) => jointsMade(s)),
      fluxStep('rw-flux2', 'Flux the pads', '<p>Fresh flux on both pads helps the new solder flow.</p>', (s) => jointsMade(s)),
      pickTool('rw-t-iron', 'iron', 'The iron heats the pad, and the solder wire melts into the joint.', (s) => jointsMade(s)),
      {
        id: 'rw-joints',
        title: 'Find the Joints panel',
        place: 'side',
        meta: { allow: ['#rw-joints'], todo: ['Look at the Joints section on the right, then click Got it'] },
        glow: ['#rw-joints'],
        body: `<p>The panel has been scrolled to <b>Joints</b>. Each pad shows its <b>solder bar</b> (about <b>half full = a good joint</b>, no blob), its temperature, and a <b>Pad heat</b> bar: if that one fills, the pad burns off the board.</p>`,
        enter: () => {
          window.setTimeout(() => host.reworkReveal('#rw-joints'), 1000);
        },
        next: 'Got it',
        skip: (s) => jointsMade(s),
        back: rwBack,
      },
      ...solderPad(0),
      ...solderPad(1),

      // ------------------------------------------------ reflow with hot air
      pickTool('rw-t-flux3', 'flux', 'A hot-air reflow melts both joints together so the solder flows evenly and the fuse pulls itself straight. It needs fresh flux first.'),
      fluxStep('rw-flux3', 'Flux for the reflow', '<p>Fresh flux lets the solder flow evenly during the reflow.</p>'),
      pickTool('rw-t-hotair', 'hotair', 'Hot air heats the whole part evenly, with no tip touching the pads.'),
      {
        id: 'rw-hotair',
        title: 'Reflow with hot air',
        place: 'side',
        meta: { canvas: true, heat: true, todo: ['Hold the mouse button and sweep back and forth over both joints until they read 300–320°C, then let go'] },
        glow: ['#rw-joints'],
        body: `<p>Keep the nozzle moving over <b>both joints at the same time</b>. The flux bubbles as it heats. Hover a pad for its temperature. When both are about <b>300–320°C</b>, <b>stop</b>: any longer and the pads start to burn.</p>`,
        enter: () => {
          peak = [];
        },
        points: () => {
          const rs = bench();
          return rs ? pads(rs).filter(({ i }) => (peak[i] ?? 0) < 295).map(({ i }) => ({ rw: i, label: 'heat to 300°C' })) : [];
        },
        done: () => {
          const rs = bench();
          if (!rs) return false;
          rs.pads.forEach((p, i) => (peak[i] = Math.max(peak[i] ?? 0, p.temp)));
          return pads(rs).every(({ i }) => peak[i] >= 295);
        },
        back: rwBack,
      },

      // ------------------------------------------------ clean-up
      pickTool('rw-t-liquid', 'ipa', 'The flux has done its job and what is left is sticky. <b>Let go of the hot air first</b>, then pick the Liquid tool to clean it off.'),
      {
        id: 'rw-liquid',
        title: 'Check the cleaning liquid',
        place: 'side',
        target: 'select[data-kit="liquid"]',
        meta: { todo: ['Make sure Cleaning liquid says Isopropyl alcohol (IPA), then click Next'] },
        body: `<p>The <b>Cleaning liquid</b> selector decides what the Liquid tool applies. For flux, use <b>IPA</b> (isopropyl alcohol).</p>`,
        enter: () => host.reworkReveal('#rw-kit'),
        next: 'It says IPA — next',
        back: rwBack,
      },
      {
        id: 'rw-ipa',
        title: 'Wet the flux with IPA',
        place: 'side',
        meta: { canvas: true, todo: ['Hold the Liquid tool on each marked joint until the flux dissolves into the IPA'] },
        body: `<p>Keep it wet until the flux melts into the IPA: the liquid turns cloudy and yellowish.</p>`,
        points: () => {
          const rs = bench();
          return rs ? pads(rs).filter(({ p }) => p.flux > 0.02 && p.dissolved < 0.05).map(({ i }) => ({ rw: i, label: 'IPA here' })) : [];
        },
        done: () => {
          const rs = bench();
          return !!rs && pads(rs).every(({ p }) => p.flux <= 0.02 || p.dissolved >= 0.05);
        },
        back: rwBack,
      },
      pickTool('rw-t-brush', 'brush', 'The brush loosens the dissolved flux. Only scrub while the pad is wet.'),
      {
        id: 'rw-brush',
        title: 'Scrub with the brush',
        place: 'side',
        meta: { canvas: true, todo: ['Scrub back and forth over each marked joint until the flux ovals disappear'] },
        body: `<p>If the IPA dries before you finish, pick the Liquid tool and add a little more.</p>`,
        points: () => {
          const rs = bench();
          return rs ? pads(rs).filter(({ p }) => p.flux > 0.02).map(({ i }) => ({ rw: i, label: 'scrub here' })) : [];
        },
        done: () => {
          const rs = bench();
          return !!rs && pads(rs).every(({ p }) => p.flux <= 0.02);
        },
        back: rwBack,
      },
      pickTool('rw-t-wipe1', 'wipe', 'The wipe lifts the dissolved flux away. <b>One side has already dried</b>, leaving white residue marks: that is what happens when IPA evaporates before you wipe.', () => !!bench() && pads(bench()!).every(({ p }) => p.dissolved <= 0.03)),
      {
        id: 'rw-wipe1',
        title: 'Wipe the wet joint',
        place: 'side',
        meta: { canvas: true, todo: ['Drag the wipe across the joint that is still wet'] },
        body: `<p>Save the side that is still wet first.</p>`,
        enter: () => {
          // Let one side dry out (if neither has), so the next steps can show how to rescue it.
          const rs = bench();
          if (!rs || rs.pads.some((p) => p.white > 0.02)) return;
          const wet = pads(rs).filter(({ p }) => p.dissolved > 0.03);
          if (wet.length < 2) return;
          const { p } = wet[wet.length - 1];
          p.ipa = Math.min(p.ipa, 1e-6);
        },
        points: () => {
          const rs = bench();
          return rs ? pads(rs).filter(({ p }) => p.dissolved > 0.03).map(({ i }) => ({ rw: i, label: 'wipe here' })) : [];
        },
        done: () => {
          const rs = bench();
          return !!rs && pads(rs).every(({ p }) => p.dissolved <= 0.03);
        },
        skip: () => {
          const rs = bench();
          return !!rs && pads(rs).every(({ p }) => p.dissolved <= 0.03);
        },
        back: rwBack,
      },
      pickTool('rw-t-liquid2', 'ipa', 'The white marks are dried flux. Do not scrape them: dissolve them again with IPA.', () => !!bench() && pads(bench()!).every(({ p }) => p.white <= 0.02)),
      {
        id: 'rw-rewet',
        title: 'Re-wet the dried residue',
        place: 'side',
        meta: { canvas: true, todo: ['Hold the Liquid tool on the marked residue until it turns liquid again'] },
        body: `<p>When the white residue goes cloudy and wet, it can be wiped.</p>`,
        points: () => {
          const rs = bench();
          return rs ? pads(rs).filter(({ p }) => p.white > 0.02).map(({ i }) => ({ rw: i, label: 'IPA here' })) : [];
        },
        done: () => {
          const rs = bench();
          return !!rs && pads(rs).every(({ p }) => p.white <= 0.02);
        },
        skip: () => {
          const rs = bench();
          return !!rs && pads(rs).every(({ p }) => p.white <= 0.02);
        },
        back: rwBack,
      },
      pickTool('rw-t-wipe2', 'wipe', 'Now wipe it away, quickly, before it dries again.'),
      {
        id: 'rw-wipe2',
        title: 'Wipe the rest away',
        place: 'side',
        meta: { canvas: true, todo: ['Drag the wipe over the marked joints until they are clean'] },
        body: `<p>The pads should end up clean and shiny.</p>`,
        points: () => {
          const rs = bench();
          return rs ? pads(rs).filter(({ p }) => p.dissolved > 0.03 || p.flux > 0.05 || p.white > 0.02).map(({ i }) => ({ rw: i, label: 'wipe here' })) : [];
        },
        done: () => {
          const rs = bench();
          return !!rs && pads(rs).every(({ p }) => p.dissolved <= 0.03 && p.white <= 0.02 && p.flux <= 0.05);
        },
        back: [...rwBack, { to: 'rw-t-liquid2', when: () => !!bench()?.pads.some((p) => !p.lifted && p.white > 0.05) }],
      },
      {
        id: 'rw-done',
        title: 'Done at the microscope',
        place: 'side',
        target: '#rw-done',
        meta: { todo: ['Click Done to put the board back on the bench'] },
        body: `<p>✓ Clean, shiny joints.</p>
          <p class="small">Messed up — a <b>lifted pad</b>, a blob, a crooked fuse? Click <b>↶ Undo all</b> instead: the board goes back exactly as it was when you sat down, and you can try again.</p>`,
        done: (s) => !host.isSoldering() && fuseDone(s),
        back: rwBack,
      },
      {
        id: 'rw-lifted',
        title: 'A pad lifted — start over',
        place: 'side',
        target: '#rw-cancel',
        meta: { todo: ['Click Undo all, then confirm'] },
        body: `<p>Too much heat for too long: a copper pad burned and peeled off the board. A fuse soldered to it would not connect, and the lamp would stay dead.</p><p>No harm done in the tutorial. The board goes back exactly as it was when you sat down, and you can try again. This time, work in short bursts and watch the <b>Pad heat</b> bar.</p>`,
        skip: () => !bench()?.pads.some((p) => p.lifted),
        done: () => !host.isSoldering(),
      },

      // ------------------------------------------------ test, close up, hand back
      {
        id: 'test-power',
        title: 'Test it like the customer will',
        target: '[data-act="power"][data-mode="adapter"]',
        body: `<p>Back on the bench. Time to test it the way the customer will.</p>`,
        enter: () => host.focusBoard(),
        done: (s) => s.powerMode === 'adapter',
        back: [{ to: 'select', when: (s) => !fuseDone(s) && !host.isSoldering() }],
      },
      {
        id: 'test-lamp',
        title: 'Press the lamp button',
        target: (s) => `[data-ctl="${s.board.device.controls[0]?.ref ?? 'SW1'}"]`,
        body: `<p>The lamp should light up. If it doesn't, re-check your joints at the microscope.</p>`,
        done: (s) => !!s.op && s.op.current('LED1') > 0.05,
        back: [{ to: 'test-power', when: (s) => s.powerMode === 'off' }],
      },
      {
        id: 'case-open',
        title: 'Put the case back on',
        target: '[data-act="case"]',
        body: `<p>💡 It lights up, so the fuse is fixed!</p><p>The lamp is still out of its case, so let's put it back together.</p>`,
        done: () => visible('#td-done'),
        skip: (s) => !s.enc || assembled(s.enc),
      },
      {
        id: 'case-close',
        title: 'Close it up',
        place: 'side',
        target: '#td-close',
        body: `<p>This is the teardown bench, where you take cases apart and put them back together, screw by screw.</p>`,
        done: (s) => assembled(s.enc),
        skip: (s) => !s.enc || assembled(s.enc),
        back: [{ to: 'case-open', when: (s) => !visible('#td-done') && !assembled(s.enc) }],
      },
      {
        id: 'case-done',
        title: 'Back to the bench',
        place: 'side',
        target: '#td-done',
        body: `<p>✓ All screwed back together.</p>`,
        done: () => !visible('#td-done'),
        skip: () => !visible('#td-done'),
      },
      {
        id: 'return',
        title: 'Hand it back',
        target: '[data-act="return"]',
        place: 'top',
        body: `<p>The lamp is fixed and closed up. Time to hand it back.</p>`,
        done: (s) => visible('[data-act="return-yes"]') || (!onJob(s) && s.lastResult !== null),
      },
      {
        id: 'return-yes',
        title: 'Hand it back',
        target: '[data-act="return-yes"]',
        place: 'top',
        body: `<p>Robin tests it at home. Good work gets paid and builds your reputation; sloppy joints can come back later as free warranty repairs.</p>`,
        done: (s) => !onJob(s) && s.lastResult !== null,
        back: [{ to: 'return', when: (s) => onJob(s) && !visible('[data-act="return-yes"]') }],
      },
      {
        id: 'end',
        title: "That's the job!",
        place: 'top',
        body: `<p>You found the fault, swapped the fuse like a pro and got paid. 🎉</p><p>Next, a quick tour of the office, where you run the business side of the shop.</p>`,
        next: 'Tour the office',
      },

      // ------------------------------------------------ office tour
      {
        id: 'of-overview',
        title: 'Overview',
        place: 'bottom',
        target: '[data-act="office-tab"][data-tab="overview"]',
        body: `<p>The <b>📊 Overview</b> tab is your shop at a glance: today's alerts (low supplies, rent due, deliveries on the way), profit and loss for today and the week, and the ledger of every payment in and out.</p>`,
        enter: () => host.openOffice('overview'),
        next: 'Next',
      },
      {
        id: 'of-work',
        title: 'Work',
        place: 'bottom',
        target: '[data-act="office-tab"][data-tab="work"]',
        body: `<p>The <b>🔧 Work</b> tab lists the customers waiting and the devices you own (your projects). Click <b>Start</b> to put one on the bench.</p><p>Customers don't wait forever — after about three days they collect their device unrepaired.</p>`,
        enter: () => host.openOffice('work'),
        next: 'Next',
      },
      {
        id: 'of-supplies',
        title: 'Supplies & parts: consumables',
        place: 'bottom',
        target: '[data-act="office-tab"][data-tab="stock"]',
        glow: ['.of-grid.two > .of-card:first-child tr:first-child .qty'],
        body: `<p>On <b>📦 Supplies &amp; parts</b> you buy what the microscope uses up: solder, flux, wick, IPA, brushes and wipes. Run out and that tool stops working.</p>
          <p>To buy: click <b>+</b> next to a pack to add it to the <b>Order basket</b>.</p>`,
        enter: () => host.openOffice('stock'),
        next: 'Next',
      },
      {
        id: 'of-parts',
        title: 'Supplies & parts: components',
        place: 'top',
        target: '.bom.parts',
        body: `<p>Further down is <b>Components in stock</b>: every fuse, resistor, capacitor and chip you have, and what they cost. Use <b>+</b> to add parts to the basket too.</p>
          <p>In the <b>Order basket</b>, pick a delivery speed and click <b>Place order</b> — it arrives on a later morning. Cheap parts can also be rush-bought one at a time from the microscope's parts tray; expensive chips are special order.</p>`,
        enter: () => document.querySelector('.bom.parts')?.scrollIntoView({ block: 'start', behavior: 'smooth' }),
        next: 'Next',
      },
      {
        id: 'of-storeroom',
        title: 'Store-room',
        place: 'bottom',
        target: '[data-act="office-tab"][data-tab="storeroom"]',
        body: `<p>The <b>🗄 Store-room</b> holds donor boards: repairs you gave up on and parts-only devices you bought. <b>Pull</b> parts off them — retimers, screens, programmed chips — when a job needs one and nobody sells it new.</p>`,
        enter: () => host.openOffice('storeroom'),
        next: 'Next',
      },
      {
        id: 'of-tools',
        title: 'Equipment',
        place: 'bottom',
        target: '[data-act="office-tab"][data-tab="tools"]',
        body: `<p><b>🛠 Equipment</b> sells new capabilities: an ESR meter, an oscilloscope, a thermal camera, microscope upgrades, test consoles for cartridges, and better iron tips and hot-air nozzles. Choose tips and nozzles in the microscope's kit selectors.</p>`,
        enter: () => host.openOffice('tools'),
        next: 'Next',
      },
      {
        id: 'of-market',
        title: 'Marketplace',
        place: 'bottom',
        target: '[data-act="office-tab"][data-tab="market"]',
        body: `<p>The <b>🛒 Marketplace</b> sells broken devices. Buy one with <b>Buy for $…</b>: a normal listing goes to <b>Work → Your projects</b> to repair and sell on for profit; a <b>parts only</b> listing goes to the store-room as a donor to stockpile parts.</p>
          <p>Need one exact chip? <b>Search online for a donor</b> of that device at the top.</p>`,
        enter: () => host.openOffice('market'),
        next: 'Next',
      },
      {
        id: 'of-ads',
        title: 'Advertising',
        place: 'bottom',
        target: '[data-act="office-tab"][data-tab="ads"]',
        body: `<p><b>📣 Advertising</b> brings in more customers each day, and people who find you through ads accept slightly higher quotes. It's billed every night, so start small.</p>`,
        enter: () => host.openOffice('ads'),
        next: 'Next',
      },
      {
        id: 'of-endday',
        title: 'End day',
        place: 'bottom',
        target: '[data-act="end-day"]',
        body: `<p>When you're done for the day, click <b>🌙 End day</b>. Tonight's bills get paid (electricity, rent every 7 days, advertising), orders arrive, and new customers come in the next morning.</p>`,
        enter: () => host.openOffice('overview'),
        next: 'Next',
      },
      {
        id: 'of-career',
        title: 'Starting over',
        place: 'top',
        target: '[data-act="new-game"]',
        body: `<p>Want a fresh start? The <b>Career</b> card on the Overview tab has <b>⟲ Start a new career</b>: back to day 1 with a new shop, starting cash and a starter pack of parts. It wipes the current save.</p>`,
        enter: () => {
          host.openOffice('overview');
          document.querySelector('[data-act="new-game"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        },
        next: 'Next',
      },
      {
        id: 'of-help',
        title: 'Replay any time',
        place: 'top',
        target: '[data-act="help"]',
        body: `<p>Forgot something? Click <b>? Help</b> at the top right any time — it explains the controls and has <b>▶ Play the tutorial</b> to run this walkthrough again.</p>
          <p>That's everything. Good luck with the shop!</p>`,
        enter: () => host.closeModal(),
        next: 'Finish',
      },
    ];
  }
}
