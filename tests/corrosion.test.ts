import { describe, expect, it } from 'vitest';
import { DEVICES, DL12, FS5 } from '../src/sim/devices';
import { cloneBoard, createBoard, functionalTest } from '../src/sim/circuit';
import { corrode, corrodedRefs, spreadCorrosion, treatCorrosion } from '../src/sim/corrosion';
import { generateJob } from '../src/sim/faults';
import { padsOf } from '../src/sim/footprints';
import { loadBoard, saveBoard } from '../src/sim/persist';
import { evaluate } from '../src/sim/repair';
import { DEFAULT_KIT, applyRework, initRework, step, type ReworkState, type ReworkTool } from '../src/rework/model';

const DT = 1 / 60;
function hold(st: ReworkState, tool: ReworkTool, x: number, y: number, seconds: number) {
  for (let t = 0; t < seconds; t += DT) step(st, DT, { tool, pos: { x, y }, down: true, feeding: false });
}
function scrub(st: ReworkState, tool: ReworkTool, seconds: number) {
  let k = 0;
  for (let t = 0; t < seconds; t += DT) {
    const dx = Math.sin(k++ * 0.6) * 0.8;
    step(st, DT, { tool, pos: { x: dx, y: 0 }, down: true, feeding: false, move: 0.8 * 0.6 * Math.abs(Math.cos(k * 0.6)) });
  }
}
const wait = (st: ReworkState, s: number) => {
  for (let t = 0; t < s; t += DT) step(st, DT, { tool: 'iron', pos: null, down: false, feeding: false });
};
const crust = (st: ReworkState) => st.pads.reduce((s, p) => s + p.crust, 0);

describe('corrosion', () => {
  it('eaten-through crust opens a joint; treating it brings the board back', () => {
    const job = generateJob(FS5, 11, { variant: FS5.variants.find((v) => v.id.endsWith('input-corroded'))!.id });
    expect(functionalTest(cloneBoard(job.board)).passed).toBe(false);
    const b = cloneBoard(job.board);
    treatCorrosion(b, 1);
    expect(corrodedRefs(b)).toEqual([]);
    expect(functionalTest(cloneBoard(b)).passed).toBe(true);
    expect(evaluate(job, b, 0).outcome).toBe('fixed');
  });

  it('crust left on a working board is a comeback', () => {
    const job = generateJob(DL12, 3);
    const b = createBoard(DL12);
    corrode(b, 'R10', 0.4);
    expect(functionalTest(cloneBoard(b)).passed).toBe(true);
    expect(evaluate(job, b, 0).outcome).toBe('comeback');
  });

  it('spreads every day it is left, onto nearby parts, and survives a save', () => {
    // The part with the closest neighbour on the FS5 board
    const defs = FS5.components;
    const gap = (r: string) => {
      const mine = padsOf(defs.find((c) => c.ref === r)!);
      return Math.min(...defs.filter((c) => c.ref !== r).flatMap((c) => padsOf(c).flatMap((p) => mine.map((m) => Math.hypot(m.x - p.x, m.y - p.y)))));
    };
    const ref = defs.map((c) => c.ref).sort((x, y) => gap(x) - gap(y))[0];
    expect(gap(ref)).toBeLessThan(5);
    const b = createBoard(FS5);
    corrode(b, ref, 0.5, 'yellow', () => 0.5);
    const before = Object.values(b.comps[ref].corr!.pins)[0];
    spreadCorrosion(b, 3);
    expect(Object.values(b.comps[ref].corr!.pins)[0]).toBeCloseTo(before + 0.12, 5);
    expect(corrodedRefs(b, 0).length).toBeGreaterThan(1);
    const back = loadBoard(saveBoard(b));
    expect(back.comps[ref].corr).toEqual(b.comps[ref].corr);
    expect(back.comps[ref].marks).toContain('corrosion');
  });

  it('old saves with only the corrosion mark get a crust', () => {
    const s = saveBoard(createBoard(DL12));
    s.comps.R10.marks.push('corrosion');
    expect(loadBoard(s).comps.R10.corr).toBeTruthy();
  });

  it('at the microscope: cleaner fizzes crust into sludge; scrub, IPA rinse and wipe clear it', () => {
    const b = createBoard(DL12);
    corrode(b, 'R10', 0.6, 'green', () => 0.5);
    const kit = { ...DEFAULT_KIT, liquid: 'corrosion-cleaner' as const };
    const st = initRework(b, 'R10', { 'corrosion-cleaner': 100, ipa: 100 }, kit);
    expect(crust(st)).toBeGreaterThan(1);
    hold(st, 'ipa', 0, 0, 1);
    expect(st.pads.every((p) => p.sludge > 0.2)).toBe(true);
    scrub(st, 'brush', 2);
    expect(crust(st)).toBeLessThan(0.05);
    st.kit.liquid = 'ipa';
    hold(st, 'ipa', 0, 0, 0.5);
    scrub(st, 'wipe', 2);
    expect(st.pads.every((p) => p.sludge < 0.05)).toBe(true);
    applyRework(b, st);
    expect(corrodedRefs(b)).toEqual([]);
  });

  it('sludge left to dry turns back into crust, and IPA alone does nothing to crust', () => {
    const b = createBoard(DL12);
    corrode(b, 'R10', 0.6, 'green', () => 0.5);
    const st = initRework(b, 'R10', { ipa: 100 }, DEFAULT_KIT);
    const c0 = crust(st);
    hold(st, 'ipa', 0, 0, 1);
    scrub(st, 'brush', 2);
    expect(crust(st)).toBeGreaterThan(c0 * 0.9);
    const st2 = initRework(b, 'R10', { 'corrosion-cleaner': 100 }, { ...DEFAULT_KIT, liquid: 'corrosion-cleaner' });
    hold(st2, 'ipa', 0, 0, 1);
    wait(st2, 15);
    expect(st2.pads.every((p) => p.sludge === 0)).toBe(true);
    expect(crust(st2)).toBeGreaterThan(c0 * 0.6);
  });

  it('every device lists its liquid-damage variants as tier-1 or tier-2', () => {
    for (const d of Object.values(DEVICES)) for (const v of d.variants.filter((x) => x.family === 'Liquid damage')) expect(v.tier).toBeLessThanOrEqual(2);
  });
});
