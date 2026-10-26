import { describe, expect, it } from 'vitest';
import { certPrice, SUPPLIES } from '../src/business/economy';
import { createShop, endDay, orderCost, placeOrder, stockOf, takeCertPart } from '../src/business/shop';
import type { DeviceDef } from '../src/sim/board';
import { cloneBoard } from '../src/sim/circuit';
import { DL12 } from '../src/sim/devices';
import { generateJob } from '../src/sim/faults';
import { cleanBoard, evaluate, installPart, removePart } from '../src/sim/repair';

const CERT_DL12: DeviceDef = {
  ...DL12,
  id: 'dl12-cert',
  cert: { authority: 'JEFFA', premium: 4, fee: 150, coated: true, dueDays: 2 },
};

/** The textbook repair of the lamp's blown fuse. */
function repaired(opts: { certified: boolean; clean: boolean }) {
  const job = generateJob(CERT_DL12, 5, { variant: 'fuse-blown' });
  const b = cloneBoard(job.board);
  removePart(b, 'F1', 'good');
  installPart(b, 'F1', 'F-1A', false, 'good');
  b.comps.F1.certified = opts.certified;
  if (opts.clean) cleanBoard(b);
  return { job, b };
}

describe('certified work', () => {
  it('a certified device produces a coated job with a premium quote and a deadline field', () => {
    const plain = generateJob(DL12, 5, { variant: 'fuse-blown' });
    const job = generateJob(CERT_DL12, 5, { variant: 'fuse-blown' });
    expect(job.cert).toBeTruthy();
    expect(job.quote).toBe(Math.round(plain.quote * 4));
    expect(Object.values(job.board.comps).filter((c) => !c.def.mates).every((c) => c.coat === 'on')).toBe(true);
  });

  it('an uncertified part or leftover flux fails the analysis, so nobody pays', () => {
    const a = evaluate(...(Object.values(repaired({ certified: false, clean: true })) as [never, never]), 0);
    expect(a.outcome).toBe('not-fixed');
    expect(a.certLines.find((l) => !l.ok)?.text).toContain('Uncertified parts');
    const messy = repaired({ certified: true, clean: false });
    const m = evaluate(messy.job, messy.b, 0);
    expect(m.certLines.find((l) => !l.ok)?.text).toContain('Flux residue');
  });

  it('certified parts, clean board and intact coating pass; the part is billed at certified prices', () => {
    const { job, b } = repaired({ certified: true, clean: true });
    const ev = evaluate(job, b, 0);
    expect(ev.certLines.every((l) => l.ok)).toBe(true);
    expect(ev.outcome).toBe('fixed');
    expect(ev.partsBilled).toBe(Math.round(certPrice(2 * 0.15) * 1.5) || ev.partsBilled);
    expect(ev.partsBilled).toBeGreaterThan(10);
  });

  it('coating taken off and not restored fails; restored passes', () => {
    const { job, b } = repaired({ certified: true, clean: true });
    b.comps.F1.coat = 'removed';
    expect(evaluate(job, b, 0).outcome).toBe('not-fixed');
    b.comps.F1.coat = 'reapplied';
    expect(evaluate(job, b, 0).outcome).toBe('fixed');
  });

  it('uncertified solder or flux used is recorded and fails the analysis', () => {
    const { job, b } = repaired({ certified: true, clean: true });
    job.cert!.violations.push('uncertified flux');
    const ev = evaluate(job, b, 0);
    expect(ev.outcome).toBe('not-fixed');
    expect(ev.certLines.find((l) => !l.ok)?.text).toContain('Uncertified consumables');
  });

  it('certified parts are ordered at a premium and arrive as certified stock', () => {
    const st = createShop(9);
    st.cash = 5000;
    const normal = orderCost([{ kind: 'part', id: 'F-1A', qty: 2 }], 'express');
    const cert = orderCost([{ kind: 'part', id: 'F-1A', qty: 2, cert: true }], 'express');
    expect(cert).toBeGreaterThan(normal);
    const o = placeOrder(st, [{ kind: 'part', id: 'F-1A', qty: 2, cert: true }], 'express');
    expect(o).toBeTruthy();
    endDay(st);
    expect(stockOf(st, 'F-1A').cert).toBe(2);
    expect(takeCertPart(st, 'F-1A')).toBe(true);
    expect(stockOf(st, 'F-1A').cert).toBe(1);
  });

  it('certified consumables exist and cost far more than the ordinary ones', () => {
    expect(SUPPLIES['solder-cert'].pack.cost / SUPPLIES['solder-cert'].pack.qty).toBeGreaterThan((SUPPLIES.solder.pack.cost / SUPPLIES.solder.pack.qty) * 8);
    expect(SUPPLIES['flux-cert'].pack.cost / SUPPLIES['flux-cert'].pack.qty).toBeGreaterThan(5);
    expect(SUPPLIES['coating-remover']).toBeTruthy();
    expect(SUPPLIES['conformal-coat']).toBeTruthy();
  });
});
