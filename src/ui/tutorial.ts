/**
 * First-game walkthrough: a scripted lamp with a blown fuse, from the office to handing it
 * back. Each step points at what to use (a DOM element or a pad on the board) and moves on
 * by itself once the player has done it. Skippable at any time; can be replayed from Help.
 */
import type { Session } from '../game/session';

const KEY = 'benchtech.tutorial';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export interface TutorialHost {
  isSoldering(): boolean;
  openOffice(): void;
  /** Screen position (CSS px) of a pad or part on the board, or null if not visible. */
  screenOf(ref: string, pin?: string): { x: number; y: number } | null;
  focusOn(bx: number, by: number, dist: number): void;
}

interface Step {
  id: string;
  title: string;
  /** HTML body (may be a function of the session). */
  body: string;
  /** DOM element to ring. */
  target?: string;
  /** Pads to mark on the board. */
  points?: { ref: string; pin?: string }[];
  place?: 'bottom' | 'top' | 'side';
  /** Manual steps show a Next button. */
  next?: string;
  done?: (s: Session) => boolean;
  enter?: (s: Session) => void;
}

const netOf = (s: Session, p: { ref: string; pin: string } | null) => (p ? s.board.comps[p.ref]?.def.pins[p.pin] : undefined);

export class Tutorial {
  private step = -1;
  private jobId = 0;
  private timer = 0;
  private card = document.createElement('div');
  private ring = document.createElement('div');
  private marks: HTMLDivElement[] = [];
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
  static pending(): { step: number; jobId: number } | 'new' | null {
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
  resume(state: { step: number; jobId: number }): void {
    const exists = this.s.shop.queue.some((q) => q.id === state.jobId) || this.s.shop.active?.id === state.jobId;
    if (!exists && state.step < this.steps.findIndex((x) => x.id === 'return')) {
      this.start();
      return;
    }
    this.jobId = state.jobId;
    this.go(state.step);
  }

  private go(i: number): void {
    if (i >= this.steps.length) {
      this.finish();
      return;
    }
    this.step = i;
    try {
      localStorage.setItem(KEY, JSON.stringify({ step: i, jobId: this.jobId }));
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
  }

  private tick(): void {
    if (this.step < 0) return;
    const st = this.steps[this.step];
    if (st.done?.(this.s)) {
      this.go(this.step + 1);
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

  /** Ring the target element and mark board points. */
  private position(): void {
    const st = this.steps[this.step];
    const el = st.target ? document.querySelector<HTMLElement>(st.target) : null;
    const r = el && el.offsetParent !== null ? el.getBoundingClientRect() : null;
    if (r && r.width) {
      Object.assign(this.ring.style, { display: 'block', left: `${r.left - 5}px`, top: `${r.top - 5}px`, width: `${r.width + 10}px`, height: `${r.height + 10}px` });
    } else this.ring.style.display = 'none';
    const pts = (st.points ?? []).map((p) => this.host.screenOf(p.ref, p.pin));
    while (this.marks.length < pts.length) {
      const m = document.createElement('div');
      m.className = 'tut-mark';
      document.body.append(m);
      this.marks.push(m);
    }
    while (this.marks.length > pts.length) this.marks.pop()!.remove();
    // Hide board markers while a modal (office, microscope) covers the board.
    const covered = document.querySelector('#modal.show') !== null;
    pts.forEach((p, i) => {
      const m = this.marks[i];
      m.style.display = p && !covered ? 'block' : 'none';
      if (p) Object.assign(m.style, { left: `${p.x}px`, top: `${p.y}px` });
    });
  }

  // ---------------------------------------------------------------- the script

  private build(): Step[] {
    const host = this.host;
    const onJob = (s: Session) => s.shop.active?.id === this.jobId;
    return [
      {
        id: 'welcome',
        title: 'Welcome to Bench Tech!',
        place: 'top',
        body: `<p>You've just opened a little electronics repair shop. This walkthrough fixes your first job with you — a desk lamp that will not turn on — one step at a time.</p>
          <p class="muted small">Takes about 5 minutes. You can skip it now or at any point, and replay it later from <b>? Help</b>.</p>`,
        next: 'Start the tutorial',
      },
      {
        id: 'office',
        title: 'Your shop office',
        target: '[data-act="start-work"][data-tutorial="1"]',
        body: `<p>This is the office: customers wait here, and so do your supplies, orders and money. <b>Robin T.</b> has brought in a lamp.</p><p>Click <b>Start</b> next to Robin to put it on your bench.</p>`,
        enter: () => host.openOffice(),
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
        target: '#power-modes',
        body: `<p>Plug in the customer's own adapter: choose <b>Customer adapter</b> in the Power panel.</p><p>Watch the status lines under it — nothing lights up. Now let's find out why.</p>`,
        done: (s) => s.powerMode === 'adapter',
      },
      {
        id: 'tp1',
        title: 'Measure where power comes in',
        target: '#meter',
        points: [{ ref: 'TP1', pin: '1' }],
        body: `<p>The multimeter is set to <b>volts</b>, and its black probe is already clipped to ground (TP5).</p><p><b>Left-click the flashing test point TP1</b> to put the red probe on the raw input, where the adapter's power arrives.</p>`,
        enter: (s) => {
          s.tool = 'probe';
          s.activeProbe = 'red';
          s.setMeterMode('dcv');
          host.focusOn(25, 30, 95);
        },
        done: (s) => s.powerMode !== 'off' && netOf(s, s.meter.red) === 'IN_VIN' && (s.reading?.value ?? 0) > 9,
      },
      {
        id: 'tp2',
        title: 'Follow the power',
        target: '#meter',
        points: [{ ref: 'TP2', pin: '1' }],
        body: `<p>✓ TP1 reads about <b>12 V</b> — power is getting into the board.</p><p>Now click <b>TP2</b>, the 12 V rail a little further along, after the protection parts.</p>`,
        done: (s) => s.powerMode !== 'off' && netOf(s, s.meter.red) === '12V_SYS',
      },
      {
        id: 'off',
        title: 'Power off before testing parts',
        target: '#power-modes',
        body: `<p>✗ TP2 reads <b>0 V</b>! Power gets in at TP1 but is lost before TP2. The only part between them is the fuse, <b>F1</b> — let's test it.</p><p>Resistance, continuity and diode tests only make sense with the power <b>off</b>. Click <b>Off</b>.</p>`,
        done: (s) => s.powerMode === 'off',
      },
      {
        id: 'fuse',
        title: 'Check the fuse',
        target: '#meter',
        points: [
          { ref: 'F1', pin: '1' },
          { ref: 'F1', pin: '2' },
        ],
        body: `<p>Choose the continuity mode <b>•))</b>, then probe both ends of <b>F1</b>: left-click one end (red), <b>right-click</b> the other (black).</p><p>A good fuse beeps and reads close to 0 Ω.</p>`,
        enter: () => host.focusOn(19, 25, 38),
        done: (s) => {
          const r = s.meter.red;
          const b = s.meter.black;
          return s.meter.mode === 'continuity' && r?.ref === 'F1' && b?.ref === 'F1' && r.pin !== b.pin;
        },
      },
      {
        id: 'select',
        title: 'Take it to the microscope',
        target: '[data-tool="iron"]',
        points: [{ ref: 'F1' }],
        body: `<p>✗ No beep, and the meter reads <b>OL</b> (open circuit): the fuse has blown. Found it!</p><p>Press <kbd>3</kbd> (Soldering) and click the fuse <b>F1</b>. In the part card that opens, click <b>🔬 Rework at the microscope</b>.</p>`,
        enter: (s) => {
          s.tool = 'iron';
          s.emit();
        },
        done: () => host.isSoldering(),
      },
      {
        id: 'rework',
        title: 'Replace the fuse',
        place: 'side',
        target: '#rw-guide',
        body: `<p>This is the hands-on bit. The <b>yellow hint box</b> on the right always tells you the next move:</p>
          <ol class="small"><li><b>Flux</b> (3) on the pads, then heat both ends with the <b>Iron</b> (1) or <b>Hot air</b> (5)</li>
          <li>When both joints are molten, lift the fuse with the <b>Tweezers</b> (4)</li>
          <li>Take a new <b>1A fuse</b> from the parts tray, place it, and solder both ends (hold <kbd>Space</kbd> on the iron to feed solder)</li>
          <li>Clean up: <b>IPA</b> (6), scrub with the <b>Brush</b> (7), <b>Wipe</b> (8)</li></ol>
          <p class="small">Click <b>✓ Done</b> when you're finished. You can always come back — your work is kept.</p>`,
        done: (s) => !host.isSoldering() && !!s.board.comps.F1.part && !s.board.comps.F1.fault && s.board.comps.F1.replaced,
      },
      {
        id: 'test',
        title: 'Test it like the customer will',
        target: '#controls',
        body: `<p>Power it with the <b>Customer adapter</b> again, then press the <b>lamp button</b> (hold <kbd>Space</kbd> or the button in the Power panel).</p><p>The lamp should light up. If it doesn't, re-check your joints at the microscope.</p>`,
        done: (s) => !!s.op && s.op.current('LED1') > 0.05,
      },
      {
        id: 'return',
        title: 'Hand it back',
        target: '[data-act="return"]',
        place: 'top',
        body: `<p>Fixed! Click <b>Return to customer</b>. Robin tests it at home — good work gets paid and builds your reputation; sloppy joints can come back later as free warranty repairs.</p>`,
        done: (s) => !onJob(s) && s.lastResult !== null,
      },
      {
        id: 'end',
        title: "That's the job!",
        place: 'top',
        body: `<p>From here on it's your shop:</p>
          <ul class="small"><li><b>🏪 Office</b>: take customers, reorder supplies and parts, advertise, and buy broken devices to flip.</li>
          <li><b>🌙 End day</b> pays the bills and brings new customers and deliveries.</li>
          <li><b>🛠 Equipment</b>: better tips and nozzles, an ESR meter, an oscilloscope and a thermal camera.</li>
          <li>Better reputation unlocks bigger jobs — speakers, monitors, handhelds and consoles.</li></ul>`,
        next: 'Finish',
      },
    ];
  }
}
