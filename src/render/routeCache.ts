/**
 * Pre-routed copper. Routing a big board takes seconds to minutes, so `npm run routes`
 * routes every device once and stores the result in `routes/<device id>.json`, keyed by
 * a hash of everything that affects routing. A stale or missing entry falls back to
 * routing live (and `tests/geometry.test.ts` fails until the cache is rebuilt).
 */
import type { DeviceDef } from '../sim/board';
import { padsOf } from '../sim/footprints';
import type { RouteResult } from './router';

/** Bump when the router's algorithm or rules change, to invalidate every cached route. */
export const ROUTER_VERSION = 2;

export interface CachedRoute {
  key: string;
  route: RouteResult;
}

/** FNV-1a hash of a string, as 8 hex digits. */
function fnv(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/** Everything that changes the routed copper: board size, parts, pads, trace links, net widths. */
export function routeKey(device: DeviceDef, widthOf: (net: string) => number): string {
  const pads = device.components.flatMap(padsOf);
  const nets = [...new Set(pads.map((p) => p.net))].sort();
  return fnv(
    JSON.stringify([
      ROUTER_VERSION,
      device.width,
      device.height,
      device.components.map((c) => [c.ref, c.partNo, c.x, c.y, c.rot, c.pins, c.mates ?? null]),
      pads.map((p) => [p.ref, p.pin, p.net, p.x, p.y, p.w, p.h, !!p.round, !!p.module]),
      device.traces,
      nets.map((n) => [n, widthOf(n)]),
    ]),
  );
}

const files = import.meta.glob<CachedRoute>('./routes/*.json', { eager: true, import: 'default' });

/** The cached route for a device, if it is up to date. */
export function cachedRoute(device: DeviceDef, key: string): RouteResult | null {
  const hit = files[`./routes/${device.id}.json`];
  return hit && hit.key === key ? hit.route : null;
}
