import { describe, expect, it } from 'vitest';
import { cloneBoard, functionalTest } from '../src/sim/circuit';
import { DEVICES } from '../src/sim/devices';
import { generateJob } from '../src/sim/faults';
import { BALL_SIZES, BGA_CHIPS, BGA_TYPES, stencilChips, stencilForChip } from '../src/sim/bgatypes';
import { part } from '../src/sim/parts';
import { loadBoard, saveBoard } from '../src/sim/persist';
import { createBoard } from '../src/sim/circuit';
import { cleanBoardPads, cleanChip, fitBga, reballChip, reflowInPlace, removeBga, REFLOW_FIX_CHANCE, type Stencil } from '../src/rework/bga';

const seq = (...v: number[]) => {
  let i = 0;
  return () => v[i++ % v.length];
};

describe('BGA stencil tables', () => {
  it('has 12 stencils, 3 ball sizes with 4 stencils each, and 24 chips', () => {
    expect(BGA_TYPES).toHaveLength(12);
    for (const s of BALL_SIZES) expect(BGA_TYPES.filter((t) => t.ballMm === s)).toHaveLength(4);
    expect(BGA_CHIPS).toHaveLength(24);
    for (const t of BGA_TYPES) expect(stencilChips(t).length).toBeGreaterThan(1);
  });
  it('every chip code maps to its stencil', () => {
    for (const c of BGA_CHIPS) expect(stencilForChip(c.code)?.pkg).toBe(c.pkg);
  });
  it('the Rogue Pal APU is stencilled by ST-05 with 0.45 mm balls', () => {
    const t = stencilForChip(part('U-RP-APU').marking!)!;
    expect(t.stencil).toBe('ST-05');
    expect(t.ballMm).toBe(0.45);
  });
});

const crackedJob = () => generateJob(DEVICES['rogue-pal'], 7, { variant: 'bga-cracked' });

describe('BGA repair process', () => {
  it('cracked balls break the board; a full reball repairs it', () => {
    const job = crackedJob();
    const b = cloneBoard(job.board);
    expect(functionalTest(cloneBoard(b)).passed).toBe(false);
    const ref = job.faults[0].refs[0];
    const stencil: Stencil = { id: 'ST-05', warped: false };
    expect(removeBga(b, ref, { flux: true, heat: 'good' }, seq(0.9))).toContain('lifted');
    expect(b.comps[ref].part).toBeNull();
    cleanBoardPads(b, ref, { flux: true, wick: true });
    cleanChip(b, ref, { flux: true, wick: true });
    expect(reballChip(b, ref, { stencil, method: 'balls', ballMm: 0.45, flux: true, heat: 'good' })).toContain('perfect');
    fitBga(b, ref, { partNo: 'U-RP-APU', fromStock: false, flux: true, heat: 'good', aligned: true });
    expect(functionalTest(cloneBoard(b)).passed).toBe(true);
  });
  it('refuses a wrong stencil, wrong balls, a warped stencil and missing flux', () => {
    const b = cloneBoard(crackedJob().board);
    const ref = 'U3';
    removeBga(b, ref, { flux: true, heat: 'good' }, seq(0.9));
    cleanChip(b, ref, { flux: true, wick: true });
    expect(reballChip(b, ref, { stencil: { id: 'ST-01', warped: false }, method: 'balls', ballMm: 0.45, flux: true, heat: 'good' })).toContain('does not fit');
    expect(reballChip(b, ref, { stencil: { id: 'ST-05', warped: false }, method: 'balls', ballMm: 0.6, flux: true, heat: 'good' })).toContain('wrong size');
    expect(reballChip(b, ref, { stencil: { id: 'ST-05', warped: false }, method: 'balls', ballMm: 0.45, flux: false, heat: 'good' })).toContain('flux');
    expect(reballChip(b, ref, { stencil: { id: 'ST-05', warped: true }, method: 'balls', ballMm: 0.45, flux: true, heat: 'good' })).toContain('warped');
  });
  it('overheating warps the stencil', () => {
    const b = cloneBoard(crackedJob().board);
    removeBga(b, 'U3', { flux: true, heat: 'good' }, seq(0.9));
    cleanChip(b, 'U3', { flux: true, wick: true });
    const st: Stencil = { id: 'ST-05', warped: false };
    reballChip(b, 'U3', { stencil: st, method: 'balls', ballMm: 0.45, flux: true, heat: 'over' }, seq(0.9));
    expect(st.warped).toBe(true);
  });
  it('paste can leave uneven pads about one time in five', () => {
    const b = cloneBoard(crackedJob().board);
    removeBga(b, 'U3', { flux: true, heat: 'good' }, seq(0.9));
    cleanChip(b, 'U3', { flux: true, wick: true });
    const msg = reballChip(b, 'U3', { stencil: { id: 'ST-05', warped: false }, method: 'paste', flux: false, heat: 'good' }, seq(0.05, 0.1, 0.3, 0.9, 0.2, 0.6));
    expect(msg).toContain('uneven');
    expect(Object.values(b.comps.U3.bga!.off!.chip).some((s) => s === 'weak' || s === 'bridged')).toBe(true);
  });
  it('an unaligned or dirty fit leaves bad balls', () => {
    const b = cloneBoard(crackedJob().board);
    removeBga(b, 'U3', { flux: true, heat: 'good' }, seq(0.9));
    // pads not cleaned: old solder makes cold joints
    cleanChip(b, 'U3', { flux: true, wick: true });
    reballChip(b, 'U3', { stencil: { id: 'ST-05', warped: false }, method: 'balls', ballMm: 0.45, flux: true, heat: 'good' });
    fitBga(b, 'U3', { partNo: 'U-RP-APU', fromStock: false, flux: true, heat: 'good', aligned: true });
    expect(Object.values(b.comps.U3.bga!.balls).includes('cold')).toBe(true);
  });
});

describe('reflow in place', () => {
  it('needs flux and heat, and fixes cracked balls less than half the time', () => {
    expect(REFLOW_FIX_CHANCE).toBeLessThan(0.5);
    const base = crackedJob().board;
    expect(reflowInPlace(cloneBoard(base), 'U3', { flux: false, heat: 'good' })).toContain('flux');
    expect(reflowInPlace(cloneBoard(base), 'U3', { flux: true, heat: 'cold' })).toContain('not get hot');
    const fixed = cloneBoard(base);
    reflowInPlace(fixed, 'U3', { flux: true, heat: 'good' }, seq(0.1));
    expect(functionalTest(cloneBoard(fixed)).passed).toBe(true);
    expect(fixed.comps.U3.bga!.reflowed).toBe(true);
    const no = cloneBoard(base);
    reflowInPlace(no, 'U3', { flux: true, heat: 'good' }, seq(0.9));
    expect(functionalTest(cloneBoard(no)).passed).toBe(false);
  });
});

describe('BGA save', () => {
  it('ball states survive a save and load', () => {
    const b = cloneBoard(crackedJob().board);
    const back = loadBoard(JSON.parse(JSON.stringify(saveBoard(b))));
    expect(back.comps.U3.bga).toEqual(b.comps.U3.bga);
    expect(createBoard(DEVICES['rogue-pal']).comps.U3.bga).toBeUndefined();
  });
});

describe('BGA faults', () => {
  for (const id of ['bga-cracked', 'bga-bridged', 'bga-dead'])
    it(`${id} is on the Rogue Pal and breaks it`, () => {
      expect(DEVICES['rogue-pal'].variants.some((v) => v.id === id)).toBe(true);
      const job = generateJob(DEVICES['rogue-pal'], 11, { variant: id });
      expect(functionalTest(cloneBoard(job.board)).passed).toBe(false);
    });
});
