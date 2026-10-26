/**
 * Liquid damage indicator (LDI) stickers: small white stickers stuck to the PCB at the places where liquid is most
 * likely to get in and do harm (beside ports, the battery connector, the card slot and the main chip). A dry sticker is
 * white with pale rings; once liquid reaches it, it blooms red. A red sticker tells the technician where to look for
 * corrosion. Pure: the state is read from the corrosion already on the board.
 */
import type { DeviceDef } from './board';
import type { BoardState, CompState } from './circuit';
import { crustAt } from './corrosion';
import { bodyRect, FOOTPRINTS } from './footprints';
import { part, pinsOf } from './parts';

export interface LdiSpot {
  id: string;
  /** Centre of the sticker (board mm) and its side length. */
  x: number;
  y: number;
  size: number;
  /** What it guards (for the description). */
  guards: string;
}

const SIZE = 4.2;
/** How far liquid from a damaged part can reach a sticker (mm). */
export const LDI_REACH = 22;

const cache = new Map<string, LdiSpot[]>();

/** What a sticker is placed to guard: ports first, then the battery connector, card slot and the biggest chip. */
function targets(d: DeviceDef): { ref: string; guards: string; rank: number }[] {
  const out: { ref: string; guards: string; rank: number }[] = [];
  for (const c of d.components) {
    if (c.mates) continue;
    const p = part(c.partNo);
    if (['USBC', 'MUSB', 'HDMI'].includes(p.pkg)) out.push({ ref: c.ref, guards: `the ${p.label.toLowerCase()}`, rank: 0 });
    else if (p.pkg === 'JST2' || p.pkg === 'BATT' || /battery/i.test(c.role)) out.push({ ref: c.ref, guards: 'the battery connector', rank: 1 });
    else if (p.pkg === 'TFSLOT' || p.pkg === 'CARTSLOT6') out.push({ ref: c.ref, guards: 'the game slot', rank: 2 });
  }
  const chips = d.components
    .filter((c) => !c.mates && ['logic', 'ic', 'ldo', 'buck', 'retimer', 'charger', 'amp', 'mcu'].includes(part(c.partNo).kind))
    .sort((a, b) => FOOTPRINTS[part(b.partNo).pkg].w * FOOTPRINTS[part(b.partNo).pkg].h - FOOTPRINTS[part(a.partNo).pkg].w * FOOTPRINTS[part(a.partNo).pkg].h);
  if (chips[0]) out.push({ ref: chips[0].ref, guards: 'the main chip', rank: 3 });
  return out.sort((a, b) => a.rank - b.rank);
}

/** Where the stickers go on this device: free board space next to the parts they guard. */
export function ldiSpots(d: DeviceDef): LdiSpot[] {
  const hit = cache.get(d.id);
  if (hit) return hit;
  const rects = d.components.filter((c) => !c.mates).map((c) => bodyRect(c));
  const free = (x: number, y: number) =>
    x - SIZE / 2 >= 2 && y - SIZE / 2 >= 2 && x + SIZE / 2 <= d.width - 2 && y + SIZE / 2 <= d.height - 2 &&
    rects.every((r) => x + SIZE / 2 + 1 < r.x || x - SIZE / 2 - 1 > r.x + r.w || y + SIZE / 2 + 1 < r.y || y - SIZE / 2 - 1 > r.y + r.h);
  const spots: LdiSpot[] = [];
  for (const t of targets(d)) {
    if (spots.length >= 4) break;
    const c = d.components.find((x) => x.ref === t.ref)!;
    const r = bodyRect(c);
    // Candidates around the part, nearest first, preferring the side facing the board centre
    const cands: [number, number, number][] = [];
    for (let ring = 1; ring <= 5; ring++)
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2;
        const rad = Math.max(r.w, r.h) / 2 + 3 + ring * 3;
        const x = c.x + Math.cos(a) * rad;
        const y = c.y + Math.sin(a) * rad;
        const towardCentre = -(Math.cos(a) * (c.x - d.width / 2) + Math.sin(a) * (c.y - d.height / 2));
        cands.push([x, y, ring * 10 - towardCentre * 0.02]);
      }
    cands.sort((a, b) => a[2] - b[2]);
    const pick = cands.find(([x, y]) => free(x, y) && spots.every((s) => Math.hypot(s.x - x, s.y - y) >= 14));
    if (pick) spots.push({ id: `ldi-${t.ref}`, x: Math.round(pick[0] * 10) / 10, y: Math.round(pick[1] * 10) / 10, size: SIZE, guards: t.guards });
  }
  cache.set(d.id, spots);
  return spots;
}

/** Worst crust on any pad of this part (0..1). */
function worstCrust(c: CompState): number {
  let m = c.marks.includes('corrosion') && !c.corr ? 0.3 : 0;
  for (const pin of pinsOf(part(c.def.partNo))) m = Math.max(m, crustAt(c, pin));
  return m;
}

/** How far the sticker has bloomed: 0 = still white, 1 = fully red. Liquid within reach of it. */
export function ldiLevel(b: BoardState, s: LdiSpot): number {
  let level = 0;
  for (const c of Object.values(b.comps)) {
    if (c.def.mates) continue;
    const crust = worstCrust(c);
    if (crust < 0.12) continue;
    const d = Math.hypot(c.def.x - s.x, c.def.y - s.y);
    if (d > LDI_REACH) continue;
    level = Math.max(level, Math.min(1, crust * 1.6 * (1 - d / (LDI_REACH * 1.4))));
  }
  return level > 0.15 ? level : 0;
}

/** Stickers that have tripped (for hints and tests). */
export function trippedStickers(b: BoardState): LdiSpot[] {
  return ldiSpots(b.device).filter((s) => ldiLevel(b, s) > 0);
}
