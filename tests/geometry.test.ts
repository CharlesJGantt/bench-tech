import { describe, expect, it } from 'vitest';
import { buildGeometry, type Segment } from '../src/render/boardArt';
import { DL12 } from '../src/sim/devices';

/**
 * The PCB artwork must be a faithful drawing of the netlist the simulator solves:
 * every net fully connected by its copper, and no copper touching another net.
 */
describe('board routing', () => {
  const geo = buildGeometry(DL12);
  // Fragments joined by a breakable trace form one logical net while the trace is intact.
  const logical = (net: string) => DL12.traces.find((t) => t.b === net)?.a ?? net;
  const segs = [...geo.segments, ...geo.traces.flatMap((t) => t.segments)];

  const samples = (s: Segment) => {
    const len = Math.hypot(s.x2 - s.x1, s.y2 - s.y1);
    const k = Math.max(1, Math.round(len / 0.125));
    return Array.from({ length: k + 1 }, (_, i) => ({ x: s.x1 + ((s.x2 - s.x1) * i) / k, y: s.y1 + ((s.y2 - s.y1) * i) / k }));
  };

  it('routes every connection', () => {
    expect(geo.failures).toEqual([]);
  });

  it('connects every pad of every net through copper', () => {
    const parent = new Map<string, string>();
    const find = (a: string): string => {
      while (parent.get(a) !== undefined && parent.get(a) !== a) a = parent.get(a)!;
      return a;
    };
    const union = (a: string, b: string) => {
      if (!parent.has(a)) parent.set(a, a);
      if (!parent.has(b)) parent.set(b, b);
      parent.set(find(a), find(b));
    };
    const key = (x: number, y: number, layer: string) => `${Math.round(x * 4)},${Math.round(y * 4)},${layer}`;
    segs.forEach((s, i) => {
      for (const p of samples(s)) union(`seg${i}`, key(p.x, p.y, s.layer));
    });
    for (const v of geo.vias) union(key(v.x, v.y, 'top'), key(v.x, v.y, 'bottom'));
    for (const p of geo.pads) {
      const id = `${p.ref}.${p.pin}`;
      union(id, id);
      for (const layer of p.round ? ['top', 'bottom'] : ['top'])
        // walk the router's 0.25 mm grid points that fall inside the pad
        for (let x = Math.ceil((p.x - p.w / 2) * 4 - 1e-9) / 4; x <= p.x + p.w / 2 + 1e-9; x += 0.25)
          for (let y = Math.ceil((p.y - p.h / 2) * 4 - 1e-9) / 4; y <= p.y + p.h / 2 + 1e-9; y += 0.25) {
            const k = key(x, y, layer);
            if (parent.has(k)) union(id, k);
          }
    }
    const byNet = new Map<string, string[]>();
    for (const p of geo.pads) {
      if (p.net === 'GND') continue; // ground joins through the copper pour
      const n = logical(p.net);
      if (!byNet.has(n)) byNet.set(n, []);
      byNet.get(n)!.push(`${p.ref}.${p.pin}`);
    }
    const broken: string[] = [];
    for (const [net, ids] of byNet) {
      const roots = new Set(ids.map(find));
      if (roots.size > 1) broken.push(`${net}: ${ids.join(' ')}`);
    }
    expect(broken).toEqual([]);
  });

  it('never lets copper touch another net', () => {
    const hits = new Set<string>();
    for (const s of segs) {
      const net = logical(s.net);
      const pts = samples(s);
      for (const p of geo.pads) {
        if (logical(p.net) === net || (s.layer === 'bottom' && !p.round)) continue;
        for (const q of pts) {
          const dx = Math.max(0, Math.abs(q.x - p.x) - p.w / 2);
          const dy = Math.max(0, Math.abs(q.y - p.y) - p.h / 2);
          if (Math.hypot(dx, dy) < s.width / 2 + 0.1) hits.add(`${s.net} touches pad ${p.ref}.${p.pin} (${p.net})`);
        }
      }
      for (const o of segs) {
        if (o === s || o.layer !== s.layer || logical(o.net) === net) continue;
        const ops = samples(o);
        for (const q of pts)
          for (const r of ops)
            if (Math.hypot(q.x - r.x, q.y - r.y) < (s.width + o.width) / 2 + 0.1) {
              hits.add(`${s.net} touches ${o.net} on ${s.layer}`);
              break;
            }
      }
    }
    expect([...hits]).toEqual([]);
  });

  it('keeps breakable traces on the top layer', () => {
    for (const t of geo.traces) {
      expect(t.segments.length).toBeGreaterThan(0);
      for (const s of t.segments) expect(s.layer).toBe('top');
    }
  });
});
