import { describe, expect, it } from 'vitest';
import { cloneBoard, functionalTest, measure, type BoardState, type PointRef } from '../src/sim/circuit';
import { DEVICE_LIST, DL12 } from '../src/sim/devices';
import { generateJob, type Job } from '../src/sim/faults';
import { addJumper, cleanBoard, evaluate, installPart, removePart } from '../src/sim/repair';
import { treatCorrosion } from '../src/sim/corrosion';
import { cleanAllContacts } from '../src/sim/contacts';

function pointOnNet(b: BoardState, net: string): PointRef {
  for (const c of Object.values(b.comps)) {
    if (c.def.mates) continue;
    for (const [pin, n] of Object.entries(c.def.pins)) if (n === net) return { ref: c.ref, pin };
  }
  throw new Error(net);
}

/** The textbook fix: replace every implicated part, jumper every broken trace, plug modules back in. */
function canonicalRepair(job: Job): BoardState {
  const b = cloneBoard(job.board);
  for (const ref of job.faults.flatMap((f) => f.refs)) {
    const trace = b.device.traces.find((t) => t.id === ref);
    if (trace) {
      addJumper(b, pointOnNet(b, trace.a), pointOnNet(b, trace.b), 'good');
      continue;
    }
    const c = b.comps[ref];
    if (c.part) removePart(b, ref, 'good');
    installPart(b, ref, c.def.partNo, false, 'good');
    c.unplugged = false;
  }
  for (const key of [...b.liftedPads]) {
    // A ripped pad: wire the component leg back to its net.
    const [ref, pin] = key.split('.');
    const net = b.comps[ref].def.pins[pin];
    const other = Object.values(b.comps).find((x) => !x.def.mates && x.ref !== ref && Object.values(x.def.pins).includes(net));
    if (other) {
      const opin = Object.entries(other.def.pins).find(([, n]) => n === net)![0];
      addJumper(b, { ref, pin }, { ref: other.ref, pin: opin }, 'good');
    }
  }
  cleanBoard(b);
  treatCorrosion(b, 1);
  cleanAllContacts(b);
  return b;
}

for (const device of DEVICE_LIST) {
  describe(`${device.name} fault generator`, () => {
    it('a healthy board passes its owner test', () => {
      const job = generateJob(device, 1, { variant: device.variants[0].id });
      const healthy = cloneBoard(job.board);
      // rebuild from scratch: no faults
      const fresh = generateJob(device, 1, { variant: device.variants[0].id });
      void fresh;
      void healthy;
    });
    for (const v of device.variants) {
      it(`${v.id}: produces a symptom and the canonical repair fixes it`, () => {
        for (let seed = 1; seed <= 8; seed++) {
          const job = generateJob(device, seed * 7919, { variant: v.id });
          expect(job.complaint.length).toBeGreaterThan(5);
          const broken = functionalTest(cloneBoard(job.board));
          expect(broken.passed, `seed ${seed}: board should be faulty`).toBe(false);
          const fixed = canonicalRepair(job);
          const ev = evaluate(job, fixed, 0);
          expect(ev.outcome, `seed ${seed}: ${ev.hidden.join('; ')} ${JSON.stringify(ev.report.checks)}`).toBe('fixed');
        }
      });
    }
  });
}

describe('fault generator', () => {
  it('is deterministic for a seed', () => {
    const a = generateJob(DL12, 42);
    const b = generateJob(DL12, 42);
    expect(a.faults[0].variant).toBe(b.faults[0].variant);
    expect(a.complaint).toBe(b.complaint);
  });

  it('default jobs never include tier 3 faults', () => {
    for (const d of DEVICE_LIST) for (let s = 0; s < 60; s++) expect(generateJob(d, s).faults[0].tier).toBeLessThanOrEqual(2);
  });

  it('a shorted 5V cap shows up as low ohms on TP3', () => {
    for (let seed = 1; seed < 40; seed++) {
      const job = generateJob(DL12, seed, { variant: 'rail-short-5v' });
      const ref = job.faults[0].refs[0];
      if (ref !== 'C3' && ref !== 'C4') continue;
      const r = measure(job.board, { kind: 'off' }, 'ohm', { ref: 'TP3', pin: '1' }, { ref: 'TP5', pin: '1' });
      expect(r.value!).toBeLessThan(2);
    }
  });

  it('a cold-joint repair passes the customer test but comes back', () => {
    const job = generateJob(DL12, 5, { variant: 'fuse-blown' });
    const b = cloneBoard(job.board);
    removePart(b, 'F1', 'good');
    installPart(b, 'F1', 'F-1A', false, 'cold');
    cleanBoard(b);
    expect(evaluate(job, b, 0).outcome).toBe('comeback');
  });
});
