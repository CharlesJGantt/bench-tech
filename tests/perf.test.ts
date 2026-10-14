import { describe, expect, it } from 'vitest';
import type { DeviceDef } from '../src/sim/board';
import { compile, createBoard, operatingPoint } from '../src/sim/circuit';
import { DEVICE_LIST, DL12 } from '../src/sim/devices';

/**
 * Solver performance budget. A "mega board" stitches copies of the lamp board together
 * (separate nets, shared ground) to stand in for a 300+ part motherboard.
 */
export function megaBoard(copies: number): DeviceDef {
  const comps = [];
  for (let k = 0; k < copies; k++) {
    const sfx = (net: string) => (net === 'GND' ? 'GND' : `${net}_${k}`);
    for (const c of DL12.components) {
      // Every copy is powered from the first copy's input jack (one supply, many loads).
      const pins = Object.fromEntries(Object.entries(c.pins).map(([p, n]) => [p, k > 0 && n === 'VIN_J' ? 'VIN_J_0' : sfx(n)]));
      if (k > 0 && c.ref === 'J1') continue;
      comps.push({ ...c, ref: `${c.ref}_${k}`, pins });
    }
  }
  return {
    ...DL12,
    id: `mega${copies}`,
    components: comps,
    traces: [],
    firmware: undefined,
    input: { ...DL12.input, ref: 'J1_0' },
    ground: 'TP5_0',
  };
}

const time = (fn: () => void, reps = 3) => {
  fn(); // warm-up
  const t = performance.now();
  for (let i = 0; i < reps; i++) fn();
  return (performance.now() - t) / reps;
};

describe('solver performance', () => {
  it('reports node counts and solve times', () => {
    for (const d of [...DEVICE_LIST, megaBoard(8)]) {
      const b = createBoard(d);
      const nodes = compile(b, { kind: 'adapter' }).nodeCount;
      const ms = time(() => operatingPoint(createBoard(d), { kind: 'adapter' }), 2);
      console.log(`${d.id.padEnd(8)} parts ${String(d.components.length).padStart(4)}  nodes ${String(nodes).padStart(5)}  op ${ms.toFixed(1)} ms`);
    }
  });

  it('solves a 300+ part board within budget', () => {
    const d = megaBoard(8);
    expect(d.components.length).toBeGreaterThan(300);
    const op = operatingPoint(createBoard(d), { kind: 'adapter' });
    expect(op.converged).toBe(true);
    const ms = time(() => operatingPoint(createBoard(d), { kind: 'adapter' }), 1);
    expect(ms).toBeLessThan(400);
  }, 120_000);
});
