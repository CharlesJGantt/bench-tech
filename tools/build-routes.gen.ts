/**
 * Route every device and write the copper cache (src/render/routes/<id>.json).
 * Run with `npm run routes` (it executes under Vitest so TypeScript + import.meta.glob work).
 */
import { writeFileSync } from 'node:fs';
import { it } from 'vitest';
import { buildGeometry, traceWidth } from '../src/render/boardArt';
import { routeKey } from '../src/render/routeCache';
import { DEVICE_LIST } from '../src/sim/devices';

it('routes every device into the cache', () => {
  for (const d of DEVICE_LIST) {
    const t = performance.now();
    const route = buildGeometry(d, { live: true });
    if (route.failures.length) throw new Error(`${d.id}: unrouted ${route.failures.join(', ')}`);
    writeFileSync(`src/render/routes/${d.id}.json`, JSON.stringify({ key: routeKey(d, traceWidth), route }));
    console.log(`routed ${d.id} in ${((performance.now() - t) / 1000).toFixed(1)} s`);
  }
}, 3_600_000);
