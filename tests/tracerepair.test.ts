import { describe, expect, it } from 'vitest';
import { cloneBoard, type BoardState, type PointRef } from '../src/sim/circuit';
import { DL12 } from '../src/sim/devices';
import { generateJob } from '../src/sim/faults';
import { addJumper, evaluate, sealJumper } from '../src/sim/repair';

function pointOnNet(b: BoardState, net: string): PointRef {
  for (const c of Object.values(b.comps)) {
    if (c.def.mates) continue;
    for (const [pin, n] of Object.entries(c.def.pins)) if (n === net) return { ref: c.ref, pin };
  }
  throw new Error(net);
}

function repaired(opts: Parameters<typeof addJumper>[4]) {
  const job = generateJob(DL12, 5, { variant: 'trace-broken' });
  const b = cloneBoard(job.board);
  job.board = b;
  const trace = b.device.traces.find((t) => t.id === job.faults[0].refs[0])!;
  addJumper(b, pointOnNet(b, trace.a), pointOnNet(b, trace.b), 'good', opts);
  return { job, b };
}

describe('trace repair with copper wire', () => {
  it('loose hookup wire fixes it but only earns a note', () => {
    const { job, b } = repaired({});
    const ev = evaluate(job, b, 0);
    expect(ev.outcome).toBe('fixed');
    expect(ev.notes.join(' ')).toContain('hookup wire');
  });
  it('unsealed, unscraped repair wire comes back; scraped and sealed is clean', () => {
    const bad = repaired({ gauge: 34, scraped: false });
    const evBad = evaluate(bad.job, bad.b, 0);
    expect(evBad.outcome).toBe('comeback');
    expect(evBad.hidden.join(' ')).toContain('not sealed');
    expect(evBad.hidden.join(' ')).toContain('mask-covered');
    const good = repaired({ gauge: 30, scraped: true });
    sealJumper(good.b, good.b.jumpers[0].id);
    expect(evaluate(good.job, good.b, 0).outcome).toBe('fixed');
  });
});
