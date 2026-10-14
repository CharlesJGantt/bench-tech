import { describe, expect, it } from 'vitest';
import { buildGeometry } from '../src/render/boardArt';
import { cloneBoard, createBoard, functionalTest } from '../src/sim/circuit';
import { DEVICE_LIST } from '../src/sim/devices';

for (const d of DEVICE_LIST) {
  describe(d.name, () => {
    it('a healthy board passes its owner test', () => {
      const r = functionalTest(createBoard(d));
      expect(r.checks.filter((c) => !c.ok).map((c) => c.label)).toEqual([]);
      expect(r.events).toEqual([]);
      expect(r.passed).toBe(true);
    });
    it('routes cleanly', () => {
      expect(buildGeometry(d).failures).toEqual([]);
    });
    it('every component fits on the board', () => {
      for (const c of d.components) {
        expect(c.x, c.ref).toBeGreaterThan(0);
        expect(c.x, c.ref).toBeLessThan(d.width);
        expect(c.y, c.ref).toBeGreaterThan(0);
        expect(c.y, c.ref).toBeLessThan(d.height);
      }
      void cloneBoard;
    });
  });
}
