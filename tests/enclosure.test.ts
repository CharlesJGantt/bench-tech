import { describe, expect, it } from 'vitest';
import { cloneBoard, createBoard, functionalTest, operatingPoint, steadyTemps } from '../src/sim/circuit';
import { BUTTON, DEVICE_LIST, FS5, SBOX } from '../src/sim/devices';
import {
  applyPaste,
  assembled,
  boardReachable,
  canRemove,
  closeForMe,
  coolingFor,
  spillLiquidMetal,
  drillOut,
  enclosureIssues,
  installItem,
  newEnclosure,
  openForMe,
  removeItem,
  riskOf,
} from '../src/sim/enclosure';
import { generateJob } from '../src/sim/faults';
import { loadJob, saveJob } from '../src/sim/persist';
import { evaluate } from '../src/sim/repair';

describe('enclosures', () => {
  for (const d of DEVICE_LIST) {
    it(`${d.name}: opens the right way, closes back up, and is still healthy`, () => {
      const def = d.enclosure!;
      expect(def).toBeTruthy();
      // Every item, need and covering panel is consistent
      const ids = new Set(def.items.map((i) => i.id));
      for (const i of def.items) for (const n of i.needs ?? []) expect(ids.has(n), `${i.id} needs ${n}`).toBe(true);
      expect(def.items.some((i) => i.covers)).toBe(true);
      for (const i of def.items) {
        expect(i.at[0]).toBeGreaterThanOrEqual(0);
        expect(i.at[0]).toBeLessThanOrEqual(d.width);
        expect(i.at[1]).toBeLessThanOrEqual(d.height);
        if (i.module) expect(d.components.some((c) => c.ref === i.module && c.mates)).toBe(true);
        if (i.chip) expect(d.components.some((c) => c.ref === i.chip)).toBe(true);
        for (const n of i.punch ?? []) expect(d.components.some((c) => Object.values(c.pins).includes(n)), `${i.id} punches ${n}`).toBe(true);
      }

      const b = createBoard(d);
      const st = newEnclosure(def);
      expect(boardReachable(def, st)).toBe(false);
      const log = openForMe(def, st, b, { gamebit: true });
      expect(log.length).toBeGreaterThan(0);
      expect(boardReachable(def, st)).toBe(true);
      expect(st.damage).toEqual([]);
      // Take off everything else too (cables, heatsink), then close it all
      for (let k = 0; k < 50; k++) {
        const it = def.items.find((i) => canRemove(def, st, i.id));
        if (!it) break;
        const tool = it.kind === 'screw' ? 'screwdriver' : it.kind === 'adhesive' && !st.heated.includes(it.id) ? 'heat' : it.kind === 'clips' || it.kind === 'cable' || it.kind === 'adhesive' ? 'spudger' : 'fingers';
        expect(removeItem(def, st, b, it.id, tool, { gamebit: true }).ok).toBe(true);
      }
      closeForMe(def, st, b);
      expect(assembled(st)).toBe(true);
      expect(st.damage).toEqual([]);
      expect(enclosureIssues(def, st)).toEqual({ hidden: [], notes: [] });
      expect(functionalTest(cloneBoard(b)).passed).toBe(true);
    });
  }

  it('order matters: the shell will not come off with screws still in', () => {
    const def = BUTTON.enclosure!;
    const st = newEnclosure(def);
    const r = removeItem(def, st, createBoard(BUTTON), 'back', 'fingers');
    expect(r.ok).toBe(false);
    expect(r.text).toMatch(/first/);
  });

  it('pulling a ribbon with the latch shut tears the screen; the latch done right does not', () => {
    const def = BUTTON.enclosure!;
    const b = createBoard(BUTTON);
    const st = newEnclosure(def);
    openForMe(def, st, b);
    expect(riskOf(def.items.find((i) => i.id === 'lcd')!, st, 'fingers')).toMatch(/tears/);
    const r = removeItem(def, st, b, 'lcd', 'fingers');
    expect(r.damage).toBe('cable-torn');
    expect(b.comps.LCD1.fault).toEqual({ type: 'open' });
    closeForMe(def, st, b);
    expect(functionalTest(cloneBoard(b)).passed).toBe(false);

    const b2 = createBoard(BUTTON);
    const st2 = newEnclosure(def);
    openForMe(def, st2, b2);
    expect(removeItem(def, st2, b2, 'lcd', 'spudger').text).toMatch(/latch/);
    expect(removeItem(def, st2, b2, 'lcd', 'spudger').ok).toBe(true);
    expect(b2.comps.LCD1.unplugged).toBe(true);
    closeForMe(def, st2, b2);
    expect(b2.comps.LCD1.unplugged).toBe(false);
    expect(st2.damage).toEqual([]);
  });

  it('a long screw in a short hole punches into the board; drilling the via out fixes it', () => {
    const def = SBOX.enclosure!;
    const b = createBoard(SBOX);
    const st = newEnclosure(def);
    openForMe(def, st, b);
    // s1 is a 5 mm hole; put a 12 mm screw from s3 into it
    expect(installItem(def, st, b, 'shield', undefined).ok).toBe(true);
    const r = installItem(def, st, b, 's1', 12);
    expect(r.damage).toBe('punch');
    expect(functionalTest(cloneBoard(b)).passed).toBe(false);
    expect(drillOut(st, b, 's1').ok).toBe(true);
    expect(functionalTest(cloneBoard(b)).passed).toBe(true);
  });

  it('a heatsink back on old paste is a comeback; fresh paste is fine', () => {
    const job = generateJob(FS5, 5);
    const def = FS5.enclosure!;
    const st = job.enclosure!;
    st.stickerBroken = false;
    openForMe(def, st, job.board);
    expect(removeItem(def, st, job.board, 'hs', 'fingers').ok).toBe(true);
    const lazy = structuredClone(st);
    // Close without new paste
    for (let k = 0; k < 40 && lazy.removed.length; k++) {
      const it = def.items.find((i) => lazy.removed.includes(i.id) && def.items.filter((x) => x.needs?.includes(i.id)).every((x) => !lazy.removed.includes(x.id)))!;
      installItem(def, lazy, job.board, it.id, it.screw?.length);
    }
    expect(enclosureIssues(def, lazy).hidden.join()).toMatch(/old paste/);
    expect(applyPaste(def, st, 'hs', 'lm').ok).toBe(true);
    closeForMe(def, st, job.board);
    expect(enclosureIssues(def, st).hidden).toEqual([]);
  });

  it('clips pried with a screwdriver snap; cold adhesive cracks', () => {
    const def = FS5.enclosure!;
    const b = createBoard(FS5);
    const st = newEnclosure(def);
    removeItem(def, st, b, 'sticker', 'fingers');
    expect(removeItem(def, st, b, 'side', 'screwdriver').damage).toBe('clip');
    expect(enclosureIssues(def, st).notes.join()).toMatch(/clips/);
    const bp = DEVICE_LIST.find((d) => d.id === 'boompuck')!;
    const st2 = newEnclosure(bp.enclosure!);
    expect(removeItem(bp.enclosure!, st2, createBoard(bp), 'feet', 'spudger').damage).toBe('crack');
  });

  it('jobs come in closed, keep their case through a save, and must go back closed', () => {
    const job = generateJob(FS5, 21);
    expect(job.enclosure).toBeTruthy();
    expect(boardReachable(FS5.enclosure, job.enclosure)).toBe(false);
    openForMe(FS5.enclosure!, job.enclosure!, job.board);
    const back = loadJob(saveJob(job));
    expect(back.enclosure).toEqual(job.enclosure);
    expect(boardReachable(FS5.enclosure, back.enclosure)).toBe(true);
    expect(evaluate(back, back.board, 0).hidden.join()).toMatch(/not fully reassembled/);
  });

  it('a screw missing when it came in is not held against you', () => {
    for (let seed = 1; seed < 400; seed++) {
      const job = generateJob(SBOX, seed);
      if (!job.enclosure?.missingAtIntake) continue;
      const def = SBOX.enclosure!;
      openForMe(def, job.enclosure, job.board);
      closeForMe(def, job.enclosure, job.board);
      expect(enclosureIssues(def, job.enclosure).notes).toEqual([]);
      return;
    }
    throw new Error('no job with a missing screw');
  });

  it('a stripped screw needs an extractor; it is ruined, and a spare fills its hole', () => {
    const def = BUTTON.enclosure!;
    const b = createBoard(BUTTON);
    const st = newEnclosure(def);
    st.stripped = ['s1'];
    const r = removeItem(def, st, b, 's1', 'screwdriver');
    expect(r.ok).toBe(false);
    expect(r.text).toMatch(/stripped/);
    expect(openForMe(def, st, b).at(-1)).toMatch(/stripped/);
    expect(removeItem(def, st, b, 's1', 'screwdriver', { extractor: true }).ok).toBe(true);
    expect(st.mat).toEqual([]); // the extracted screw is binned
    openForMe(def, st, b, { extractor: true });
    expect(boardReachable(def, st)).toBe(true);
    // One 6 mm screw short: without spares the hole stays empty, with one it is filled
    const noSpare = structuredClone(st);
    closeForMe(def, noSpare, createBoard(BUTTON), 0);
    expect(enclosureIssues(def, noSpare).notes.join()).toMatch(/missing/);
    const log = closeForMe(def, st, b, 3);
    expect(log.sparesUsed).toBe(1);
    expect(enclosureIssues(def, st).notes).toEqual([]);
  });

  it('screws remember the hole they came out of (for the magnetic mat)', () => {
    const def = SBOX.enclosure!;
    const b = createBoard(SBOX);
    const st = newEnclosure(def);
    openForMe(def, st, b);
    expect(st.matFrom).toMatchObject({ s1: 5, s3: 12, c1: 12 });
    installItem(def, st, b, 'shield');
    installItem(def, st, b, 's1', st.matFrom!.s1);
    expect(st.damage).toEqual([]);
    expect(st.matFrom!.s1).toBeUndefined();
  });

  it('the APU heatsink keeps it cool; old paste runs hot; no heatsink means thermal shutdown territory', () => {
    const def = FS5.enclosure!;
    const temp = (cooling: Record<string, number> | undefined) => {
      const b = createBoard(FS5);
      b.cooling = cooling;
      const op = operatingPoint(b, { kind: 'adapter' });
      expect(b.mcu.running).toBe(true);
      return steadyTemps(b, op).U3;
    };
    const st = newEnclosure(def);
    const fresh = temp(coolingFor(def, st));
    expect(fresh).toBeGreaterThan(55);
    expect(fresh).toBeLessThan(80);
    expect(temp(undefined)).toBeCloseTo(fresh, 5); // factory default = fresh
    const b = createBoard(FS5);
    openForMe(def, st, b);
    // Fan unplugged (to get the shield off): hotter, even with the heatsink on
    expect(coolingFor(def, st)!.U3).toBeCloseTo(0.325, 5);
    removeItem(def, st, b, 'hs', 'fingers');
    const lifted = coolingFor(def, st)!;
    expect(lifted.U3).toBe(1);
    expect(temp(lifted)).toBeGreaterThan(95);
    // Back on the old compound, with the fan running
    st.lmExposed = [];
    closeForMe(def, st, b);
    st.paste.hs = false;
    const old = temp(coolingFor(def, st));
    expect(old).toBeGreaterThan(fresh + 10);
    expect(old).toBeLessThan(95);
  });

  it('flipping the board with liquid metal wet on the APU shorts the parts around it', () => {
    const def = FS5.enclosure!;
    const b = createBoard(FS5);
    const st = newEnclosure(def);
    openForMe(def, st, b);
    expect(removeItem(def, st, b, 'hs', 'fingers').text).toMatch(/Liquid metal/);
    expect(st.lmExposed).toEqual(['hs']);
    const text = spillLiquidMetal(def, st, b);
    expect(text).toMatch(/shorted/);
    expect(b.jumpers.filter((j) => j.bridge).length).toBe(2);
    expect(spillLiquidMetal(def, st, b)).toBeNull();
    // Re-done with ordinary paste: works, but is a comeback
    applyPaste(def, st, 'hs', 'paste');
    closeForMe(def, st, b);
    expect(enclosureIssues(def, st).hidden.join()).toMatch(/liquid metal belongs/);
  });

  it('cartridge security screws need a Game-Bit driver', () => {
    const d = DEVICE_LIST.find((x) => x.id === 'bes-cart')!;
    const st = newEnclosure(d.enclosure!);
    const b = createBoard(d);
    expect(removeItem(d.enclosure!, st, b, 's1', 'screwdriver').text).toMatch(/Game-Bit/);
    expect(removeItem(d.enclosure!, st, b, 's1', 'screwdriver', { gamebit: true }).ok).toBe(true);
  });
});
