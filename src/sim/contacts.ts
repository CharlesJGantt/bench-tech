/**
 * Oxidised connector contacts (cartridge edge fingers, cart slots, battery springs).
 * Each contact carries an oxide film 0..1 that adds resistance between the plug and the
 * board (fully tarnished = no contact at all). You scrub it off — pink pencil eraser by
 * default, a magic eraser sponge faster — and finish with Pad-Bright, which brightens the
 * last dullness off and protects the contacts. Pure (no DOM).
 */
import type { BoardState, CompState } from './circuit';
import { part, pinsOf } from './parts';

/** Packages whose contacts can be scrubbed. */
export const SCRUBBABLE = ['EDGE6', 'CARTSLOT6', 'SPRING2', 'SLIDE'];

export type Scrubber = 'pink-eraser' | 'magic-sponge';

export const SCRUBBERS: Record<Scrubber, { name: string; rate: number; lifeMm: number }> = {
  'pink-eraser': { name: 'pink pencil eraser', rate: 1, lifeMm: 600 },
  'magic-sponge': { name: 'magic eraser sponge', rate: 2.5, lifeMm: 400 },
};

/** Scrubbing alone leaves contacts this dull; Pad-Bright takes them to 0. */
export const SCRUB_FLOOR = 0.08;
/** Above this the contact is still noticeably oxidised. */
export const DULL = 0.35;

export const scrubbable = (c: CompState) => SCRUBBABLE.includes(part(c.def.partNo).pkg);

export function oxideAt(c: CompState, pin: string): number {
  return c.oxide?.[pin] ?? 0;
}

/** Contact resistance of a plug contact with this much oxide (Ω; Infinity = no contact). */
export function oxideR(o: number): number {
  if (o >= 0.9) return Infinity;
  return 0.02 + 40 * o * o;
}

/** Tarnish a connector's contacts (fault generation), a little unevenly. */
export function tarnish(b: BoardState, ref: string, amount: number, rand: () => number = Math.random): void {
  const c = b.comps[ref];
  const ox: Record<string, number> = { ...(c.oxide ?? {}) };
  for (const pin of pinsOf(part(c.def.partNo))) ox[pin] = Math.min(1, Math.max(ox[pin] ?? 0, amount * (0.8 + rand() * 0.4)));
  c.oxide = ox;
  c.brightened = [];
  syncTarnishMark(c);
}

export function syncTarnishMark(c: CompState): void {
  const dull = Object.values(c.oxide ?? {}).some((v) => v > DULL);
  if (dull && !c.marks.includes('tarnish')) c.marks.push('tarnish');
  if (!dull) c.marks = c.marks.filter((m) => m !== 'tarnish');
}

/** Scrub one contact: `mm` of stroke with a scrubber. Returns how much oxide came off. */
export function scrubPin(c: CompState, pin: string, mm: number, tool: Scrubber): number {
  const o = oxideAt(c, pin);
  if (o <= SCRUB_FLOOR) return 0;
  const off = Math.min(o - SCRUB_FLOOR, mm * 0.012 * SCRUBBERS[tool].rate);
  (c.oxide ??= {})[pin] = o - off;
  return off;
}

/**
 * Pad-Bright on one contact: on a scrubbed contact it takes the last dullness off and
 * protects it; on a still-tarnished one it only softens the film a little.
 */
export function padBright(c: CompState, pin: string): 'bright' | 'softened' {
  const o = oxideAt(c, pin);
  if (o <= SCRUB_FLOOR + 0.04) {
    (c.oxide ??= {})[pin] = 0;
    c.brightened = [...new Set([...(c.brightened ?? []), pin])];
    return 'bright';
  }
  (c.oxide ??= {})[pin] = Math.max(SCRUB_FLOOR, o - 0.05);
  return 'softened';
}

/** Canonical "done properly": scrubbed and Pad-Brightened everywhere (tests, guided skips). */
export function cleanAllContacts(b: BoardState): void {
  for (const c of Object.values(b.comps)) {
    if (!c.oxide) continue;
    for (const pin of Object.keys(c.oxide)) c.oxide[pin] = 0;
    c.brightened = Object.keys(c.oxide);
    syncTarnishMark(c);
  }
}

/** What a customer / later inspection notices about the contacts. */
export function contactIssues(b: BoardState): { hidden: string[]; notes: string[] } {
  const hidden: string[] = [];
  const notes: string[] = [];
  for (const c of Object.values(b.comps)) {
    if (!c.oxide) continue;
    const vals = Object.entries(c.oxide);
    if (vals.some(([, v]) => v > DULL)) hidden.push(`${c.ref}'s contacts are still oxidised — it will cut in and out.`);
    else if (vals.some(([pin, v]) => v > 0.02 && !c.brightened?.includes(pin))) notes.push(`${c.ref}'s contacts were scrubbed but not treated with Pad-Bright — they will dull again.`);
  }
  return { hidden, notes };
}
