/**
 * First-game walkthrough: a scripted lamp with a blown fuse, from the office to handing it
 * back, then a tour of the shop office. Each step points at what to use (a DOM element, a
 * pad on the board, or a pad under the microscope) and moves on by itself once the player
 * has done it. Skippable at any time; can be replayed from Help.
 */
import type { Session } from '../game/session';
import { jointResults, type ReworkState, type ReworkTool } from '../rework/model';
import { assembled } from '../sim/enclosure';
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
}

/** A point to mark: a board pad, or pad i under the microscope. */
type Point = { ref: string; pin?: string; label?: string } | { rw: number; label?: string };

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
}

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
      if (b.dataset.tut === 'min') {
        this.minimized = !this.minimized;
        this.card.classList.toggle('tut-min', this.minimized);
        b.textContent = this.minimized ? '▴' : '▾';
      }
    });
    this.steps = this.build();
    this.hide();
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
    this.hide();
  }

  private hide(): void {
    this.card.style.display = 'none';
    this.ring.style.display = 'none';
    for (const m of this.marks) m.remove();
    this.marks = [];
    this.setGlow([]);
    this.host.highlight([]);
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
    this.card.innerHTML = `<div class="tut-head"><span class="tut-step">Tutorial · ${this.step + 1} / ${n}</span><span class="row" style="margin:0;gap:4px"><button class="tut-skip" data-tut="min" title="Collapse / expand">▾</button><button class="tut-skip" data-tut="skip" title="End the tutorial">Skip tutorial ✕</button></span></div>
      <h3>${esc(st.title)}</h3><div class="tut-body">${st.body}</div>
      <div class="tut-foot">${st.next ? `<button class="primary" data-tut="next">${esc(st.next)}</button>` : '<span class="muted small">Do it on the bench — this moves on by itself.</span>'}</div>`;
    this.position();
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

    const points = typeof st.points === 'function' ? st.points(this.s) : (st.points ?? []);
    // Board markers hide while a modal (office, microscope) covers the board; microscope
    // markers only show while it is open.
    const covered = document.querySelector('#modal.show') !== null;
    const board = points.filter((p): p is { ref: string; pin?: string; label?: string } => 'ref' in p);
    this.host.highlight(covered ? [] : board);
    const pts = points.map((p) => ('rw' in p ? this.host.reworkPad(p.rw) : covered ? null : this.host.screenOf(p.ref, p.pin)));
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
      if (m.dataset.label !== label) {
        m.dataset.label = label;
        m.innerHTML = label ? `<span class="tut-mark-label">${esc(label)}</span>` : '';
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
        target: ring('flux'),
        body,
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

    // The hot-air reflow: both joints have to reach 300 °C while the step is up.
    let peak: number[] = [];

    return [
      {
        id: 'welcome',
        title: 'Welcome to Bench Tech!',
        place: 'top',
        body: `<p>You've just opened a little electronics repair shop. This walkthrough fixes your first job with you — a desk lamp that will not turn on — one step at a time, then shows you around the office.</p>
          <p class="muted small">Takes about 10 minutes. You can skip it now or at any point, and replay it later from <b>? Help</b>.</p>`,
        next: 'Start the tutorial',
      },
      {
        id: 'office',
        title: 'Your shop office',
        target: '[data-act="start-work"][data-tutorial="1"]',
        body: `<p>This is the office: customers wait here, and so do your supplies, orders and money. <b>Robin T.</b> has brought in a lamp.</p><p>Click <b>Start</b> next to Robin to put it on your bench.</p>`,
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
        body: `<p>Plug in the customer's own adapter: click the highlighted <b>Customer adapter</b> in the Power panel.</p><p>Watch the status lines under it — nothing lights up. Now let's find out why.</p>`,
        done: (s) => s.powerMode === 'adapter',
      },
      {
        id: 'tp1',
        title: 'Measure where power comes in',
        target: '#meter',
        points: [
          { ref: 'TP1', pin: '1', label: 'TP1 · red probe here' },
          { ref: 'TP5', pin: '1', label: 'GND · black clip' },
        ],
        body: `<p>The multimeter is set to <b>volts</b>, and we have clipped its black probe to ground (TP5) for you — the <b>Black → GND</b> button does that any time.</p><p><b>Left-click the highlighted test point TP1</b> to put the red probe on the raw input, where the adapter's power arrives.</p>`,
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
          { ref: 'TP5', pin: '1', label: 'GND · black clip' },
        ],
        body: `<p>✓ TP1 reads about <b>12 V</b> — power is getting into the board.</p><p>Now click the highlighted <b>TP2</b>, the 12 V rail a little further along, after the protection parts.</p>`,
        done: (s) => s.powerMode !== 'off' && netOf(s, s.meter.red) === '12V_SYS',
      },
      {
        id: 'off',
        title: 'Power off before testing parts',
        target: '[data-act="power"][data-mode="off"]',
        body: `<p>✗ TP2 reads <b>0 V</b>! Power gets in at TP1 but is lost before TP2. The only part between them is the fuse, <b>F1</b> — let's test it.</p><p>Resistance, continuity and diode tests only make sense with the power <b>off</b>. Click the highlighted <b>Off</b>.</p>`,
        done: (s) => s.powerMode === 'off',
      },
      {
        id: 'mode',
        title: 'Switch to continuity',
        target: '[data-act="mode"][data-mode="continuity"]',
        body: `<p>Click the highlighted continuity mode <b>•))</b> on the multimeter.</p><p>In continuity mode the meter <b>beeps</b> when the two probes are connected through almost nothing — perfect for checking a fuse.</p>`,
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
        body: `<p>Probe both ends of <b>F1</b>: <b>left-click</b> one highlighted end (red probe), <b>right-click</b> the other (black probe).</p><p>A good fuse beeps and reads close to 0 Ω.</p>`,
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
        body: `<p>✗ No beep, and the meter reads <b>OL</b> (open circuit): the fuse has blown. Found it!</p>
          <p>Press <kbd>3</kbd> (<b>Soldering</b>) and click the fuse <b>F1</b>. In the part card that opens on the left, click the highlighted <b>🔬 Rework at the microscope</b>.</p>`,
        enter: (s) => {
          s.tool = 'iron';
          s.emit();
        },
        done: () => host.isSoldering(),
      },

      // ------------------------------------------------ at the microscope: off with the old one
      fluxStep(
        'rw-flux',
        'Flux the old joints',
        `<p>Welcome to the microscope. The <b>yellow hint box</b> on the right always suggests the next move.</p>
          <p>Always flux before you wick: flux lets the heat flow and the old solder run into the braid. Pick the highlighted <b>Flux</b> (<kbd>3</kbd>) and click or hold on each highlighted pad. Every click adds a bit more flux.</p>`,
        (s) => !!bench() && !oldFuseOn(s),
      ),
      {
        id: 'rw-wick',
        title: 'Wick the old solder off',
        place: 'side',
        target: ring('wick'),
        body: `<p>Now pick the highlighted <b>Wick</b> (<kbd>2</kbd>) and hold it on each highlighted joint. The iron heats through the copper braid and the molten solder soaks up into it. Keep going until the pad is bare copper.</p>
          <p class="small">⚠ <b>Careful not to overheat the pads.</b> After about 10 seconds of heat a copper pad burns and <b>lifts off the board</b> — then the new fuse can't be soldered on properly and the tutorial job fails. Work in short passes and let the pad cool in between; <i>"pad is getting badly overheated"</i> means stop right away. If the wick end turns silver, cut it off (<kbd>C</kbd>). If the flux is gone, add a little more.</p>`,
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
      {
        id: 'rw-lift',
        title: 'Lift out the blown fuse',
        place: 'side',
        target: ring('tweezers'),
        body: `<p>✓ The solder is off, so nothing holds the fuse down any more.</p>
          <p>Pick the highlighted <b>Tweezers</b> (<kbd>4</kbd>) and click the fuse to lift it. While it's in the tweezers, press <kbd>Delete</kbd> to throw it in the bin.</p>`,
        done: (s) => {
          const rs = bench();
          return !!rs && !oldFuseOn(s) && !rs.held;
        },
        back: rwBack,
      },

      // ------------------------------------------------ on with the new one
      {
        id: 'rw-tray',
        title: 'Take a new fuse',
        place: 'side',
        target: '[data-rw-part="F-1A"]',
        body: `<p>Look in the <b>Parts tray</b> on the right for <b>Fuse 1A fast</b> (marked "H") and click its highlighted <b>New</b> button. It comes out of your stock.</p>`,
        enter: () => host.reworkReveal('#rw-tray'),
        done: (s) => !!bench()?.held || newFuseOn(s),
        skip: (s) => newFuseOn(s),
        back: rwBack,
      },
      {
        id: 'rw-place',
        title: 'Place it on the pads',
        place: 'side',
        target: '#rw-canvas',
        body: `<p>The new fuse is in the tweezers. Click on the empty footprint, right between the two pads, to set it down.</p>`,
        done: (s) => newFuseOn(s),
        skip: (s) => newFuseOn(s),
        back: [...rwBack, { to: 'rw-tray', when: (s) => !bench()?.held && !newFuseOn(s) }],
      },
      fluxStep(
        'rw-flux2',
        'Flux the pads',
        `<p>✓ It's in place. Before soldering, flux both pads again: pick the highlighted <b>Flux</b> (<kbd>3</kbd>) and click or hold on each highlighted pad. Clicking more than once adds more flux.</p>`,
        (s) => jointsMade(s),
      ),
      {
        id: 'rw-solder',
        title: 'Solder both ends',
        place: 'side',
        target: ring('iron'),
        glow: ['#rw-joints'],
        body: `<p>The <b>Iron</b> (<kbd>1</kbd>) is in your hand. Hold it on a highlighted pad until the readout says <b>MOLTEN</b>.</p>
          <p>Then press and hold <kbd>Space</kbd> to feed solder into the joint — only for <b>1–2 seconds</b>. Do the same on the other end.</p>
          <p class="small">Watch the <b>Joints</b> bars on the right: about <b>half a bar (50%)</b> makes a solid joint without a solder blob.</p>`,
        enter: () => {
          // Hand them the iron, then give them a moment before the panel scrolls to the joints.
          host.reworkSelect('iron');
          window.setTimeout(() => host.reworkReveal('#rw-joints'), 1800);
        },
        points: () => {
          const rs = bench();
          if (!rs) return [];
          const res = jointResults(rs);
          return pads(rs)
            .filter(({ i }) => res[i] === 'open' || res[i] === 'starved')
            .map(({ i }) => ({ rw: i, label: 'solder here' }));
        },
        done: (s) => jointsMade(s),
        back: rwBack,
      },

      // ------------------------------------------------ reflow with hot air
      fluxStep(
        'rw-flux3',
        'Flux for the reflow',
        `<p>✓ Both ends are soldered. Now a pro finish: a hot-air reflow melts both joints together so the solder flows evenly and the fuse pulls itself straight on its pads.</p>
          <p>First, flux both joints again: the highlighted <b>Flux</b> (<kbd>3</kbd>) on each highlighted pad.</p>`,
      ),
      {
        id: 'rw-hotair',
        title: 'Reflow with hot air',
        place: 'side',
        target: ring('hotair'),
        body: `<p>Pick the highlighted <b>Hot air</b> (<kbd>5</kbd>). Hold the button down and move the nozzle <b>back and forth over both joints at the same time</b>.</p>
          <p>Keep going until the flux bubbles and both joints read <b>300–320°C</b> (hover a pad to see its temperature) — then <b>stop</b> and let go.</p>`,
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
      {
        id: 'rw-liquid',
        title: 'Stop — now clean up',
        place: 'side',
        target: () => (tool() === 'ipa' ? 'select[data-kit="liquid"]' : ring('ipa')),
        glow: ['select[data-kit="liquid"]'],
        body: `<p>✓ Reflowed — <b>let go of the hot air</b> now. Keep heating and the pads start to burn.</p>
          <p>The flux has done its job, and what's left is sticky. To clean it off, pick the highlighted <b>Liquid</b> (<kbd>6</kbd>) tool, and make sure the highlighted <b>Cleaning liquid</b> selector is set to <b>Isopropyl alcohol (IPA)</b>.</p>`,
        enter: () => host.reworkReveal('#rw-kit'),
        done: () => tool() === 'ipa' && bench()?.kit.liquid === 'ipa',
        back: rwBack,
      },
      {
        id: 'rw-ipa',
        title: 'Wet the flux with IPA',
        place: 'side',
        target: ring('ipa'),
        body: `<p>Hold the IPA on each highlighted joint. Keep it wet until the flux melts into the IPA — it turns the liquid cloudy and yellowish.</p>`,
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
      {
        id: 'rw-brush',
        title: 'Scrub with the brush',
        place: 'side',
        target: ring('brush'),
        body: `<p>Pick the highlighted <b>Brush</b> (<kbd>7</kbd>) and scrub back and forth over each highlighted joint while it's wet, until the faint <b>flux ovals</b> around the pads disappear.</p>
          <p class="small">If the IPA dries before you finish, add a little more (<kbd>6</kbd>).</p>`,
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
      {
        id: 'rw-wipe1',
        title: 'Wipe it up before it dries',
        place: 'side',
        target: ring('wipe'),
        body: `<p>Look closely: <b>one side has already dried</b> and left white residue marks. That's what happens when IPA evaporates before you wipe the dissolved flux away.</p>
          <p>First save the side that is still wet: pick the highlighted <b>Wipe</b> (<kbd>8</kbd>) and drag it across the highlighted joint to lift the wet IPA and flux off.</p>`,
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
      {
        id: 'rw-rewet',
        title: 'Re-wet the dried residue',
        place: 'side',
        target: ring('ipa'),
        body: `<p>The white marks are dried flux. Don't scrape them — dissolve them again: pick the highlighted <b>Liquid</b> (<kbd>6</kbd>) and hold the IPA on the highlighted residue until it turns back into liquid.</p>`,
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
      {
        id: 'rw-wipe2',
        title: 'Wipe the rest away',
        place: 'side',
        target: ring('wipe'),
        body: `<p>Now, quickly, before it dries again: pick the highlighted <b>Wipe</b> (<kbd>8</kbd>) and wipe the remaining residue away.</p>`,
        points: () => {
          const rs = bench();
          return rs ? pads(rs).filter(({ p }) => p.dissolved > 0.03 || p.flux > 0.05).map(({ i }) => ({ rw: i, label: 'wipe here' })) : [];
        },
        done: () => {
          const rs = bench();
          return !!rs && pads(rs).every(({ p }) => p.dissolved <= 0.03 && p.white <= 0.02 && p.flux <= 0.05);
        },
        back: [...rwBack, { to: 'rw-rewet', when: () => !!bench()?.pads.some((p) => !p.lifted && p.white > 0.05) }],
      },
      {
        id: 'rw-done',
        title: 'Done at the microscope',
        place: 'side',
        target: '#rw-done',
        body: `<p>✓ Clean, shiny joints. Click the highlighted <b>✓ Done</b> to put the board back on the bench.</p>
          <p class="small">Messed up — a <b>lifted pad</b>, a blob, a crooked fuse? Click <b>↶ Undo all</b> instead: the board goes back exactly as it was when you sat down, and you can try again.</p>`,
        done: (s) => !host.isSoldering() && fuseDone(s),
        back: rwBack,
      },

      {
        id: 'rw-lifted',
        title: 'A pad lifted — start over',
        place: 'side',
        target: '#rw-cancel',
        body: `<p>Too much heat for too long: a copper pad burned and peeled off the board. A fuse soldered to it would not connect, and the lamp would stay dead.</p>
          <p>No harm done in the tutorial — click the highlighted <b>↶ Undo all</b> (and confirm). The board goes back exactly as it was when you sat down, and you can try again. This time, work in short passes.</p>`,
        skip: () => !bench()?.pads.some((p) => p.lifted),
        done: () => !host.isSoldering(),
      },

      // ------------------------------------------------ test, close up, hand back
      {
        id: 'test-power',
        title: 'Test it like the customer will',
        target: '[data-act="power"][data-mode="adapter"]',
        body: `<p>Back on the bench. Plug the customer's power adapter back in: click the highlighted <b>Customer adapter</b>.</p>`,
        enter: () => host.focusBoard(),
        done: (s) => s.powerMode === 'adapter',
        back: [{ to: 'select', when: (s) => !fuseDone(s) && !host.isSoldering() }],
      },
      {
        id: 'test-lamp',
        title: 'Press the lamp button',
        target: (s) => `[data-ctl="${s.board.device.controls[0]?.ref ?? 'SW1'}"]`,
        body: `<p>Now press the lamp's button: click and hold the highlighted <b>Hold: Lamp button</b>, or hold <kbd>Space</kbd>.</p><p>The lamp should light up. If it doesn't, re-check your joints at the microscope.</p>`,
        done: (s) => !!s.op && s.op.current('LED1') > 0.05,
        back: [{ to: 'test-power', when: (s) => s.powerMode === 'off' }],
      },
      {
        id: 'case-open',
        title: 'Put the case back on',
        target: '[data-act="case"]',
        body: `<p>💡 It lights up — fixed!</p><p>The lamp is still out of its case. Click the highlighted <b>🔧 Case: open</b> button on the ticket.</p>`,
        done: () => visible('#td-done'),
        skip: (s) => !s.enc || assembled(s.enc),
      },
      {
        id: 'case-close',
        title: 'Close it up',
        place: 'side',
        target: '#td-close',
        body: `<p>This is the teardown bench, where you take cases apart and put them back together screw by screw.</p><p>For now, click the highlighted <b>Close it up for me</b>.</p>`,
        done: (s) => assembled(s.enc),
        skip: (s) => !s.enc || assembled(s.enc),
        back: [{ to: 'case-open', when: (s) => !visible('#td-done') && !assembled(s.enc) }],
      },
      {
        id: 'case-done',
        title: 'Back to the bench',
        place: 'side',
        target: '#td-done',
        body: `<p>✓ All screwed back together. Click the highlighted <b>✓ Done</b>.</p>`,
        done: () => !visible('#td-done'),
        skip: () => !visible('#td-done'),
      },
      {
        id: 'return',
        title: 'Hand it back',
        target: '[data-act="return"]',
        place: 'top',
        body: `<p>Click the highlighted <b>Return to customer</b> on the ticket.</p>`,
        done: (s) => visible('[data-act="return-yes"]') || (!onJob(s) && s.lastResult !== null),
      },
      {
        id: 'return-yes',
        title: 'Hand it back',
        target: '[data-act="return-yes"]',
        place: 'top',
        body: `<p>Click the highlighted <b>Return to Robin T.</b> Robin tests it at home — good work gets paid and builds your reputation; sloppy joints can come back later as free warranty repairs.</p>`,
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
