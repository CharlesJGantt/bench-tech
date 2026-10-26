/**
 * Looking into a charging or video port, and cleaning it. Pocket lint, packed grime and loose dust stop a
 * cable seating; a bent contact cannot be straightened and needs a new port. The board is tipped up on its
 * edge to see inside (see the port window in the HUD).
 *
 *   tweezers  – pull the lint out
 *   pick tool – break packed grime loose (it turns into loose dust)
 *   blower    – blows loose dust out (and some lint)
 *   swabs     – wipe loose dust out, one swab per swipe
 */
import type { BoardState, CompState } from './circuit';
import { part } from './parts';

export interface Debris {
  /** Fluff and pocket lint: pulled out with tweezers. */
  lint: number;
  /** Compacted grime stuck to the contacts: loosened with a pick. */
  packed: number;
  /** Loose dust and crumbs: blown or wiped out. */
  loose: number;
}

export type PortTool = 'tweezers' | 'pick' | 'blower' | 'swab';

/** Packages that are ports with an opening you can look into. */
export const PORT_PKGS = ['USBC', 'MUSB', 'HDMI'];

export const isPort = (c: CompState): boolean => !!c.part && PORT_PKGS.includes(part(c.def.partNo).pkg);

export const debrisLevel = (d?: Debris): number => (d ? Math.min(1, d.lint * 0.5 + d.packed + d.loose * 0.6) : 0);

/** Series resistance the debris adds between the plug and the contact (Ω; Infinity = the cable will not seat). */
export function debrisR(d?: Debris): number {
  const l = debrisLevel(d);
  if (l < 0.05) return 0;
  if (l >= 0.95) return Infinity;
  return 0.03 + 60 * l * l;
}

/** Fill a port with debris (fault generation). */
export function clog(b: BoardState, ref: string, rand: () => number = Math.random, packedSolid = false): void {
  if (packedSolid) {
    // a port so full that no lane makes contact
    b.comps[ref].debris = { lint: 0.6 + rand() * 0.3, packed: 0.85 + rand() * 0.15, loose: 0.5 + rand() * 0.3 };
    return;
  }
  b.comps[ref].debris = { lint: 0.35 + rand() * 0.25, packed: 0.45 + rand() * 0.3, loose: 0.2 + rand() * 0.3 };
}

/** A contact bent flat (fault generation): cannot be straightened. */
export function bend(b: BoardState, ref: string, pin: string): void {
  const c = b.comps[ref];
  c.bent = [...new Set([...(c.bent ?? []), pin])];
}

export interface CleanResult {
  ok: boolean;
  text: string;
  /** Supplies used: swabs. */
  swabs?: number;
}

/** Use a tool on a port. Mutates the board; the caller checks the board is off and reachable. */
export function cleanPort(c: CompState, tool: PortTool): CleanResult {
  const d = c.debris;
  if (!d || debrisLevel(d) < 0.02) return { ok: false, text: 'The port is already clean.' };
  switch (tool) {
    case 'tweezers':
      if (d.lint < 0.02) return { ok: false, text: 'No loose fluff left to pull out. What is left is stuck on or too fine for tweezers.' };
      d.lint = 0;
      return { ok: true, text: 'You pull a grey wad of pocket lint out of the port with the tweezers.' };
    case 'pick':
      if (d.packed < 0.02) return { ok: false, text: 'Nothing is packed on any more.' };
      d.loose += d.packed * 0.8;
      d.packed = 0;
      return { ok: true, text: 'You scrape the packed grime loose along the tongue with the pick. A lot of dust comes away: now it needs blowing or wiping out.' };
    case 'blower':
      if (d.loose < 0.02 && d.lint < 0.02) return { ok: false, text: 'The air only moves dust that is loose, and there is none. The rest is packed on: loosen it with the pick first.' };
      d.loose = 0;
      d.lint *= 0.4;
      return { ok: true, text: 'A few short bursts of air clear the loose dust out of the port.' };
    case 'swab': {
      if (d.loose < 0.02) return { ok: false, text: 'A swab only picks up loose dust and grime; there is none to wipe.' };
      d.loose = Math.max(0, d.loose - 0.35);
      return { ok: true, text: 'You wipe the port out with a swab. It comes away grey.', swabs: 1 };
    }
  }
}

/** Is the port clean enough for a cable to seat properly? */
export const portClear = (c: CompState): boolean => debrisLevel(c.debris) < 0.08;

/** Fully clean every port (tests, guided skips). */
export function cleanAllPorts(b: BoardState): void {
  for (const c of Object.values(b.comps)) if (c.debris) c.debris = { lint: 0, packed: 0, loose: 0 };
}
