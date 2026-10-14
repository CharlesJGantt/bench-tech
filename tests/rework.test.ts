import { describe, expect, it } from 'vitest';
import { DL12 } from '../src/sim/devices';
import { cloneBoard, createBoard, functionalTest, type BoardState } from '../src/sim/circuit';
import { generateJob } from '../src/sim/faults';
import { evaluate } from '../src/sim/repair';
import { DEFAULT_KIT, applyRework, click, cutWick, initRework, jointResults, meltOf, pickFromTray, step, type ReworkState, type ReworkTool } from '../src/rework/model';
import { WICKS } from '../src/business/economy';

const DT = 1 / 60;

/** Hold a tool at a position for some time. */
function hold(st: ReworkState, tool: ReworkTool, x: number, y: number, seconds: number, feeding = false) {
  for (let t = 0; t < seconds; t += DT) step(st, DT, { tool, pos: { x, y }, down: true, feeding });
}
function wait(st: ReworkState, seconds: number) {
  for (let t = 0; t < seconds; t += DT) step(st, DT, { tool: 'iron', pos: null, down: false, feeding: false });
}
const pad = (st: ReworkState, i: number) => st.pads[i];

/** Move back and forth around a point (brushing / wiping). */
function scrub(st: ReworkState, tool: ReworkTool, x: number, y: number, seconds: number) {
  let k = 0;
  for (let t = 0; t < seconds; t += DT) {
    const dx = Math.sin(k++ * 0.6) * 0.8;
    step(st, DT, { tool, pos: { x: x + dx, y }, down: true, feeding: false, move: 0.8 * 0.6 * Math.abs(Math.cos(k * 0.6)) });
  }
}

/** IPA, scrub, wipe. */
function clean(st: ReworkState) {
  hold(st, 'ipa', 0, 0, 1);
  scrub(st, 'brush', 0, 0, 2);
  scrub(st, 'wipe', 0, 0, 2);
}

/** Textbook part swap on a 2-terminal footprint. */
function properSwap(st: ReworkState, partNo: string) {
  const [a, b] = [pad(st, 0), pad(st, 1)];
  hold(st, 'flux', a.x, a.y, 0.5);
  hold(st, 'flux', b.x, b.y, 0.5);
  // Melt both joints together with hot air, then lift.
  hold(st, 'hotair', 0, 0, 2);
  click(st, 'tweezers', 0, 0);
  expect(st.held).not.toBeNull();
  st.held = null; // bin it
  wait(st, 3);
  // Clean the pads with wick + flux, then tin lightly.
  for (const p of [a, b]) {
    hold(st, 'flux', p.x, p.y, 0.4);
    hold(st, 'wick', p.x, p.y, 1.5);
  }
  expect(a.solder).toBeLessThan(0.2);
  for (const p of [a, b]) {
    hold(st, 'flux', p.x, p.y, 0.4);
    hold(st, 'iron', p.x, p.y, 0.6);
    hold(st, 'iron', p.x, p.y, 0.5, true);
  }
  wait(st, 3);
  pickFromTray(st, partNo);
  click(st, 'tweezers', 0.1, -0.05);
  for (const p of [a, b]) {
    hold(st, 'iron', p.x, p.y, 0.8);
    hold(st, 'iron', p.x, p.y, 0.25, true);
    wait(st, 1.5);
  }
  clean(st);
}

describe('rework station', () => {
  it('a careful part swap gives good joints and fixes the lamp', () => {
    const job = generateJob(DL12, 3, { variant: 'lamp-resistor-burnt' });
    const st = initRework(job.board, 'R10');
    properSwap(st, 'R-33R-1206');
    expect(jointResults(st)).toEqual(['good', 'good']);
    applyRework(job.board, st);
    expect(functionalTest(cloneBoard(job.board)).passed).toBe(true);
    expect(evaluate(job, job.board, 0).outcome).toBe('fixed');
  });

  it('a part will not lift until every joint is molten at once', () => {
    const b = createBoard(DL12);
    const st = initRework(b, 'R10');
    hold(st, 'iron', pad(st, 0).x, pad(st, 0).y, 1.5);
    click(st, 'tweezers', 0, 0);
    expect(st.held).toBeNull();
    expect(st.part).not.toBeNull();
    // Quick alternating heat: melt one, move straight to the other.
    hold(st, 'flux', 0, 0, 0.5);
    hold(st, 'iron', pad(st, 0).x, pad(st, 0).y, 1);
    hold(st, 'iron', pad(st, 1).x, pad(st, 1).y, 0.45);
    click(st, 'tweezers', 0, 0);
    expect(st.held).not.toBeNull();
  });

  it('reflowing old solder without flux leaves cold joints; with flux they come out good', () => {
    const b = createBoard(DL12);
    const st = initRework(b, 'R10');
    for (const p of st.pads) {
      hold(st, 'iron', p.x, p.y, 0.6);
      wait(st, 1);
    }
    expect(jointResults(st)).toEqual(['cold', 'cold']);
    const st2 = initRework(createBoard(DL12), 'R10');
    for (const p of st2.pads) {
      hold(st2, 'flux', p.x, p.y, 0.4);
      hold(st2, 'iron', p.x, p.y, 1);
      wait(st2, 1);
    }
    expect(jointResults(st2)).toEqual(['good', 'good']);
  });

  it('cleaning needs IPA, scrubbing and wiping — letting it dry leaves white residue', () => {
    const b = createBoard(DL12);
    const st = initRework(b, 'R10');
    hold(st, 'flux', 0, 0, 1);
    clean(st);
    expect(st.pads.every((p) => p.flux + p.dissolved + p.white < 0.05)).toBe(true);

    const st2 = initRework(createBoard(DL12), 'R10');
    hold(st2, 'flux', 0, 0, 1);
    scrub(st2, 'brush', 0, 0, 2); // dry brushing does nothing
    expect(st2.pads[0].flux).toBeGreaterThan(0.5);
    hold(st2, 'ipa', 0, 0, 1);
    scrub(st2, 'brush', 0, 0, 2);
    wait(st2, 15); // walked away before wiping
    expect(st2.pads.some((p) => p.white > 0.1)).toBe(true);
    const b2 = createBoard(DL12);
    applyRework(b2, st2);
    expect(b2.comps.R10.marks).toContain('rework-residue');
  });

  it('tools stop working when the shop runs out of a supply', () => {
    const st = initRework(createBoard(DL12), 'R10', { solder: 10, 'flux-noclean': 0, 'wick-2': 100, ipa: 100 });
    hold(st, 'flux', 0, 0, 1);
    expect(st.pads.every((p) => p.flux === 0)).toBe(true);
    expect(st.messages.some((m) => m.includes('Out of'))).toBe(true);
    hold(st, 'iron', st.pads[0].x, st.pads[0].y, 1);
    hold(st, 'iron', st.pads[0].x, st.pads[0].y, 0.5, true);
    expect(st.used.solder).toBeGreaterThan(0);
    expect(st.used.heatSeconds).toBeGreaterThan(1);
  });

  it('low-melt alloy lets a plastic connector come off cool, but left in a joint it is weak', () => {
    const b = createBoard(DL12);
    const st = initRework(b, 'J1', {}, { ...DEFAULT_KIT, solder: 'lowmelt' });
    for (const p of st.pads) {
      hold(st, 'flux', p.x, p.y, 0.4);
      hold(st, 'iron', p.x, p.y, 1.2);
      hold(st, 'iron', p.x, p.y, 0.8, true);
    }
    expect(st.pads.every((p) => meltOf(p) < 190)).toBe(true);
    // gentle hot air now melts both joints well below the plastic's limit
    st.hotAirTemp = 220;
    hold(st, 'hotair', 7.5, 0.5, 6); // over the jack's two solder tabs
    click(st, 'tweezers', 0, 0);
    expect(st.held).not.toBeNull();
    expect(st.removed?.melted).toBe(false);
    // put it straight back without cleaning the alloy off: weak joints
    st.held = null;
    pickFromTray(st, 'J-BARREL');
    click(st, 'tweezers', 0, 0);
    for (const p of st.pads) hold(st, 'iron', p.x, p.y, 1.5);
    expect(jointResults(st)).toContain('weak');
  });

  it('blasting a plastic connector with hot air melts it', () => {
    const st = initRework(createBoard(DL12), 'J1');
    st.hotAirTemp = 420;
    hold(st, 'hotair', 0, 0, 8);
    expect(st.part?.melted).toBe(true);
  });

  it('rosin flux takes far more scrubbing than premium flux', () => {
    const scrubbed = (flux: 'flux-rosin' | 'flux-premium') => {
      const st = initRework(createBoard(DL12), 'R10', {}, { ...DEFAULT_KIT, flux });
      hold(st, 'flux', 0, 0, 1);
      hold(st, 'ipa', 0, 0, 1);
      scrub(st, 'brush', 0, 0, 1);
      return st.pads.reduce((s, p) => s + p.flux, 0);
    };
    expect(scrubbed('flux-rosin')).toBeGreaterThan(scrubbed('flux-premium') + 0.3);
  });

  it('brushes wear out and are replaced from stock; wipes get used up', () => {
    const st = initRework(createBoard(DL12), 'R10', { brushes: 1, wipes: 2 }, { ...DEFAULT_KIT, brushWear: 0.995 });
    hold(st, 'flux', 0, 0, 1);
    hold(st, 'ipa', 0, 0, 1);
    scrub(st, 'brush', 0, 0, 3);
    expect(st.used.brushes).toBe(1);
    scrub(st, 'wipe', 0, 0, 3);
    expect((st.used.wipes ?? 0) + (st.wipeLoad > 0 ? 1 : 0)).toBeGreaterThan(0);
  });

  it('a wide wick soaks up solder faster than a narrow one', () => {
    const wicked = (w: keyof typeof WICKS) => {
      const st = initRework(createBoard(DL12), 'R10', {}, { ...DEFAULT_KIT, wick: WICKS[w] });
      const p = st.pads[0];
      hold(st, 'flux', p.x, p.y, 0.4);
      hold(st, 'iron', p.x, p.y, 1);
      hold(st, 'wick', p.x, p.y, 0.6);
      return p.solder;
    };
    expect(wicked('wick-3')).toBeLessThan(wicked('wick-1'));
  });

  it('wick turns silver per joint and must be cut, not burned per second', () => {
    const st = initRework(createBoard(DL12), 'R10', { 'wick-2': 10 }, { ...DEFAULT_KIT });
    // Holding the wick on a clean, already-wicked pad uses no roll at all.
    for (const p of st.pads) {
      hold(st, 'flux', p.x, p.y, 0.4);
      hold(st, 'iron', p.x, p.y, 1);
      hold(st, 'wick', p.x, p.y, 2);
    }
    expect(st.used['wick-2'] ?? 0).toBe(0);
    expect(st.kit.wickLoad).toBeGreaterThan(0.4);
    expect(st.kit.wickLoad).toBeLessThan(1);
    expect(cutWick(st)).toBe(true);
    expect(st.kit.wickLoad).toBe(0);
    expect(st.used['wick-2']).toBe(2);
    expect(DEFAULT_KIT.wickLoad).toBe(0);
  });

  it('a saturated wick end barely soaks up solder', () => {
    const run = (load: number) => {
      const st = initRework(createBoard(DL12), 'R10', {}, { ...DEFAULT_KIT, wickLoad: load });
      const p = st.pads[0];
      hold(st, 'flux', p.x, p.y, 0.4);
      hold(st, 'iron', p.x, p.y, 1);
      hold(st, 'wick', p.x, p.y, 0.6);
      return p.solder;
    };
    expect(run(1)).toBeGreaterThan(run(0) + 0.3);
  });

  it('ground pads are slower to heat than signal pads', () => {
    const st = initRework(createBoard(DL12), 'R5'); // pin 2 is ground
    const sig = st.pads.find((p) => !p.gnd)!;
    const gnd = st.pads.find((p) => p.gnd)!;
    hold(st, 'iron', sig.x, sig.y, 0.2);
    const tSig = sig.temp;
    wait(st, 5);
    hold(st, 'iron', gnd.x, gnd.y, 0.2);
    expect(gnd.temp).toBeLessThan(tSig);
  });

  it('too much heat lifts a pad, which becomes an open circuit', () => {
    const b: BoardState = createBoard(DL12);
    const st = initRework(b, 'R10');
    st.ironTemp = 450;
    hold(st, 'iron', pad(st, 0).x, pad(st, 0).y, 10);
    expect(pad(st, 0).lifted).toBe(true);
    applyRework(b, st);
    expect(b.liftedPads).toContain('R10.1');
    expect(functionalTest(b).facts.lampAfterPress).toBe(false);
  });

  it('flooding neighbouring IC pins with solder bridges them into a real short', () => {
    const b = createBoard(DL12);
    const st = initRework(b, 'U3');
    // STAT (always high) next to LAMP (low when off): bridging them forces the lamp on.
    const p1 = st.pads[1];
    const p2 = st.pads[2];
    hold(st, 'hotair', (p1.x + p2.x) / 2, (p1.y + p2.y) / 2, 1.5);
    hold(st, 'iron', p1.x, p1.y, 1.5, true);
    hold(st, 'iron', p2.x, p2.y, 1.5, true);
    expect(st.bridges.length).toBeGreaterThan(0);
    applyRework(b, st);
    expect(b.jumpers.some((j) => j.bridge)).toBe(true);
    expect(functionalTest(b).passed).toBe(false);
  });

  it('wick clears a bridge', () => {
    const st = initRework(createBoard(DL12), 'U3');
    const [p1, p2] = st.pads;
    hold(st, 'hotair', (p1.x + p2.x) / 2, (p1.y + p2.y) / 2, 1.5);
    hold(st, 'iron', p1.x, p1.y, 1.5, true);
    hold(st, 'iron', p2.x, p2.y, 1.5, true);
    expect(st.bridges.length).toBeGreaterThan(0);
    hold(st, 'flux', p1.x, p1.y, 0.5);
    // A big blob fills the braid: wick, snip the silver end, wick again.
    for (let i = 0; i < 3; i++) {
      hold(st, 'wick', p1.x, p1.y, 1.5);
      hold(st, 'wick', p2.x, p2.y, 1.5);
      cutWick(st);
    }
    expect(st.bridges).toEqual([]);
  });
});
