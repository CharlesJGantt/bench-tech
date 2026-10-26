/**
 * Enclosures: what has to come off before you can reach the board, in what order, with
 * which tool — and the damage done by doing it wrong. Pure (no DOM / PlayCanvas).
 *
 * Each device has a list of items (sticker, screws, clips, adhesive, shell, shield,
 * heatsink, fan, cables). An item can come off once everything in its `needs` is off, and
 * goes back on once everything that sits on top of it is back. Cables to plug-in modules
 * (battery, screen, speaker, LED strip) unplug the module on the board.
 */
import type { BoardState } from './circuit';

export type EncTool = 'screwdriver' | 'spudger' | 'heat' | 'fingers';
export type EncKind = 'sticker' | 'screw' | 'clips' | 'adhesive' | 'shell' | 'shield' | 'heatsink' | 'fan' | 'cable';

export interface EncItem {
  id: string;
  kind: EncKind;
  label: string;
  /** Items that must be removed first. */
  needs?: string[];
  /** Where it sits on the board (mm, board coordinates): centre, and size for panels. */
  at: [number, number];
  size?: [number, number];
  /** Screw: its length, and the depth of the hole it belongs in (mm). */
  screw?: { length: number; hole: number };
  /** Cable: the plug-in module it connects (unplugged when removed). */
  module?: string;
  /** Cable: a flip latch (ribbon / FPC) that must be opened before pulling. */
  latch?: boolean;
  /** Heatsink: the chip under it (thermal paste). */
  chip?: string;
  /** Heatsink: the factory used liquid metal, not paste. */
  lm?: boolean;
  /** The board cannot be reached until this is off. */
  covers?: boolean;
  /** Board nets a long screw in this hole punches into (internal layers). */
  punch?: [string, string];
  /** Security screw: needs a Game-Bit driver, not an ordinary screwdriver. */
  security?: boolean;
}

export interface EnclosureDef {
  /** Case colour (CSS). */
  color: string;
  items: EncItem[];
}

export type EncDamageKind = 'clip' | 'crack' | 'cable-torn' | 'latch-broken' | 'punch';

export interface EnclosureState {
  removed: string[];
  /** Adhesive softened with heat. */
  heated: string[];
  /** Flex latches flipped open. */
  latchOpen: string[];
  /** Loose screws on the mat (length in mm). */
  mat: number[];
  /** Screw holes: length of the screw now in it (0 = left empty). */
  screws: Record<string, number>;
  /** Heatsinks with fresh thermal paste under them (false once lifted, until re-pasted). */
  paste: Record<string, boolean>;
  damage: { kind: EncDamageKind; item: string; text: string }[];
  /** Warranty sticker torn (opened before). */
  stickerBroken: boolean;
  /** Screw holes that were already empty when it came in (not your fault). */
  missingAtIntake?: string[];
  /** Screws a previous repairer chewed up: a screwdriver just spins in them. */
  stripped?: string[];
  /** Which hole each screw on the mat came out of (a magnetic screw mat keeps them in place). */
  matFrom?: Record<string, number>;
  /** Lifted liquid-metal heatsinks: the metal is still wet on the chip (tilt the board and it runs). */
  lmExposed?: string[];
  /** Liquid-metal chips re-done with ordinary paste (they run hot). */
  wrongTim?: string[];
  /** Dust clogging the fan and heatsink (an overheating service job): cleaned with the air blower or swabs. */
  dusty?: boolean;
  /** Heatsinks whose old paste has dried out: lift them and re-paste. */
  dried?: string[];
  /** Case parts broken when it was dropped (shell cracked, clips snapped): they need replacing. */
  cracked?: string[];
  /** Case parts you have fitted a new one of. */
  fitted?: string[];
  /** Ribbon cables that arrived torn (fit a new one). */
  torn?: string[];
}

export interface EncOptions {
  /** Owns a screw extractor (gets stripped screws out). */
  extractor?: boolean;
  /** Owns a Game-Bit security driver. */
  gamebit?: boolean;
}

export interface EncResult {
  ok: boolean;
  text: string;
  /** Something was damaged doing this. */
  damage?: EncDamageKind;
}

const item = (def: EnclosureDef, id: string) => {
  const it = def.items.find((x) => x.id === id);
  if (!it) throw new Error(`No enclosure item ${id}`);
  return it;
};

/** What a replacement case part costs (the customer is billed 1.5 times this). */
export function casePartPrice(it: EncItem, marketValue: number): number {
  return it.kind === 'clips' || it.kind === 'cable' ? 4 : Math.max(8, Math.round(marketValue * 0.08));
}

/** Case parts that can be broken by a drop. */
export const breakable = (def: EnclosureDef): EncItem[] => def.items.filter((i) => i.kind === 'shell' || i.kind === 'clips');

/** Fit a new case part in place of a cracked one (it must be off the device). */
export function fitNewCasePart(def: EnclosureDef, st: EnclosureState, id: string): EncResult {
  const it = item(def, id);
  if (!st.cracked?.includes(id)) return { ok: false, text: `The ${it.label.toLowerCase()} is not broken: no need for a new one.` };
  if (st.fitted?.includes(id)) return { ok: false, text: 'You already fitted a new one.' };
  if (!st.removed.includes(id)) return { ok: false, text: `Take the cracked ${it.label.toLowerCase()} off first.` };
  (st.fitted ??= []).push(id);
  return { ok: true, text: `A new ${it.label.toLowerCase()} is ready to go on.` };
}

/** Fit a new ribbon cable in place of a torn one (it must be unplugged). Returns the module's connector ref to clear. */
export function fitNewRibbon(def: EnclosureDef, st: EnclosureState, id: string): EncResult & { conn?: string } {
  const it = item(def, id);
  if (!st.torn?.includes(id)) return { ok: false, text: `The ${it.label.toLowerCase()} is fine: no need for a new one.` };
  if (st.fitted?.includes(id)) return { ok: false, text: 'You already fitted a new one.' };
  if (!st.removed.includes(id)) return { ok: false, text: `Unplug the torn ${it.label.toLowerCase()} first.` };
  (st.fitted ??= []).push(id);
  return { ok: true, text: `A fresh ${it.label.toLowerCase()} is ready to plug in.`, conn: it.module };
}

/** A freshly closed device as it came from the factory. */
export function newEnclosure(def: EnclosureDef): EnclosureState {
  const screws: Record<string, number> = {};
  const paste: Record<string, boolean> = {};
  for (const it of def.items) {
    if (it.screw) screws[it.id] = it.screw.length;
    if (it.kind === 'heatsink') paste[it.id] = true;
  }
  return { removed: [], heated: [], latchOpen: [], mat: [], screws, paste, damage: [], stickerBroken: false };
}

/** Items lying on top of this one (they have it in their `needs`... inverted: it needs them off). */
const above = (def: EnclosureDef, id: string) => item(def, id).needs ?? [];
/** Items this one sits on top of (they need it off first). */
const below = (def: EnclosureDef, id: string) => def.items.filter((x) => x.needs?.includes(id)).map((x) => x.id);

export function canRemove(def: EnclosureDef, st: EnclosureState, id: string): boolean {
  return !st.removed.includes(id) && above(def, id).every((n) => st.removed.includes(n));
}

export function canInstall(def: EnclosureDef, st: EnclosureState, id: string): boolean {
  return st.removed.includes(id) && below(def, id).every((n) => !st.removed.includes(n));
}

/** The board can be reached (probed, soldered). Old saves / no enclosure: always. */
export function boardReachable(def: EnclosureDef | undefined, st: EnclosureState | undefined): boolean {
  if (!def || !st) return true;
  return def.items.filter((i) => i.covers).every((i) => st.removed.includes(i.id));
}

export function assembled(st: EnclosureState | undefined): boolean {
  return !st || st.removed.length === 0;
}

/** The right tool for taking an item off (for hints and "open it for me"). */
export function rightTool(it: EncItem, st: EnclosureState): EncTool {
  switch (it.kind) {
    case 'screw':
      return 'screwdriver';
    case 'adhesive':
      return st.heated.includes(it.id) ? 'spudger' : 'heat';
    case 'clips':
    case 'cable':
      return 'spudger';
    default:
      return 'fingers';
  }
}

const TOOL_NAME: Record<EncTool, string> = { screwdriver: 'screwdriver', spudger: 'spudger', heat: 'heat gun', fingers: 'fingers' };

/**
 * Would this tool damage something? (Guided mode warns first.) Null when it is safe or
 * simply will not work.
 */
export function riskOf(it: EncItem, st: EnclosureState, tool: EncTool): string | null {
  if (it.kind === 'clips' && tool === 'screwdriver') return 'Prying clips with a screwdriver snaps them.';
  if (it.kind === 'adhesive' && tool === 'spudger' && !st.heated.includes(it.id)) return 'Prying cold adhesive cracks the panel — warm it first.';
  if (it.kind === 'cable' && tool === 'fingers') return it.latch ? 'Pulling a ribbon with its latch still closed tears it.' : 'Pulling a plug by its wires rips them out of the plug.';
  if (it.kind === 'cable' && it.latch && tool === 'screwdriver') return 'A screwdriver snaps the flimsy latch.';
  return null;
}

function hurt(st: EnclosureState, kind: EncDamageKind, it: EncItem, text: string): EncResult {
  st.damage.push({ kind, item: it.id, text });
  return { ok: true, text, damage: kind };
}

/**
 * Take an item off (or a step towards it: heating adhesive, opening a latch). Cables
 * unplug their module on the board; damage is written to the board where it is electrical.
 */
export function removeItem(def: EnclosureDef, st: EnclosureState, b: BoardState, id: string, tool: EncTool, opts: EncOptions = {}): EncResult {
  const it = item(def, id);
  if (st.removed.includes(id)) return { ok: false, text: `${it.label} is already off.` };
  if (!canRemove(def, st, id)) {
    const first = above(def, id).filter((n) => !st.removed.includes(n)).map((n) => item(def, n).label);
    return { ok: false, text: `${it.label} will not come off yet — first: ${first.join(', ')}.` };
  }
  const off = (text: string): EncResult => {
    st.removed.push(id);
    return { ok: true, text };
  };
  switch (it.kind) {
    case 'sticker':
      st.stickerBroken = true;
      return off(`You cut through the ${it.label}. (A torn sticker on a device that comes in tells you someone has been inside before.)`);
    case 'screw': {
      if (tool !== 'screwdriver') return { ok: false, text: `${it.label} needs a ${TOOL_NAME.screwdriver}.` };
      if (it.security && !opts.gamebit) return { ok: false, text: `${it.label} is a security screw — an ordinary bit will not turn it. A Game-Bit driver (office, Tools tab) will.` };
      if (st.stripped?.includes(id)) {
        if (!opts.extractor) return { ok: false, text: `${it.label}: the head is stripped — the bit just spins. A screw extractor (office, Tools tab) will bite into it.` };
        st.stripped = st.stripped.filter((x) => x !== id);
        delete st.screws[id];
        return off(`${it.label}: the extractor bit into the chewed head and it came out — but that screw is ruined (binned). The hole needs another ${it.screw!.length} mm screw.`);
      }
      const len = st.screws[id] ?? 0;
      delete st.screws[id];
      if (len > 0) {
        st.mat.push(len);
        (st.matFrom ??= {})[id] = len;
      }
      return off(len > 0 ? `${it.label} out — ${len} mm long. It goes on the mat.` : `That hole is empty — the screw was already missing.`);
    }
    case 'clips':
      if (tool === 'fingers' || tool === 'heat') return { ok: false, text: 'The clips are too tight for fingers — work round the seam with a spudger.' };
      if (tool === 'screwdriver') {
        off('');
        return hurt(st, 'clip', it, `${it.label}: the screwdriver popped it open, but snapped two clips. The case will creak now.`);
      }
      return off(`${it.label}: you walk the spudger round the seam and the clips pop free.`);
    case 'adhesive':
      if (tool === 'heat') {
        if (!st.heated.includes(id)) st.heated.push(id);
        return { ok: true, text: `${it.label}: warmed — the glue is soft now. Lift it with the spudger.` };
      }
      if (tool !== 'spudger') return { ok: false, text: `${it.label} is glued down. Warm it, then lift it with a spudger.` };
      if (!st.heated.includes(id)) {
        off('');
        return hurt(st, 'crack', it, `${it.label}: prying it cold cracked it. It came off, but the crack shows.`);
      }
      return off(`${it.label} lifts away cleanly.`);
    case 'cable': {
      const mod = it.module ? b.comps[it.module] : null;
      const unplug = () => {
        if (mod) mod.unplugged = true;
      };
      if (it.latch && !st.latchOpen.includes(id)) {
        if (tool === 'spudger') {
          st.latchOpen.push(id);
          return { ok: true, text: `${it.label}: latch flipped up. Now slide the ribbon out.` };
        }
        if (tool === 'screwdriver') {
          off('');
          unplug();
          return hurt(st, 'latch-broken', it, `${it.label}: the screwdriver snapped the connector latch. The ribbon will not stay seated any more.`);
        }
        if (tool === 'fingers') {
          off('');
          unplug();
          if (mod) mod.fault = { type: 'open' };
          return hurt(st, 'cable-torn', it, `${it.label}: you pulled it with the latch closed — the ribbon tore. ${mod ? `${mod.def.role} needs replacing.` : 'It needs a new cable.'}`);
        }
        return { ok: false, text: 'That does nothing to the latch.' };
      }
      if (!it.latch && tool === 'fingers') {
        off('');
        unplug();
        if (mod) mod.fault = { type: 'open' };
        return hurt(st, 'cable-torn', it, `${it.label}: you pulled the wires and they ripped out of the plug. ${mod ? `${mod.def.role} needs replacing.` : ''}`);
      }
      if (tool === 'heat') return { ok: false, text: 'Heat does nothing for a cable.' };
      unplug();
      return off(`${it.label} unplugged.`);
    }
    case 'heatsink':
      if (tool === 'heat') return { ok: false, text: 'No need to heat it — just lift it off.' };
      st.paste[id] = false;
      if (it.lm) {
        (st.lmExposed ??= []).push(id);
        return off(`${it.label} lifted off. Liquid metal glistens on ${it.chip ?? 'the chip'} — do not tilt or flip the board until it is cleaned up and redone.`);
      }
      return off(`${it.label} lifted off. The old thermal paste is broken now — it needs fresh paste before it goes back.`);
    default:
      if (tool === 'heat') return { ok: false, text: 'No need to heat it.' };
      return off(`${it.label} off.`);
  }
}

/**
 * Put an item back. Screws take one from the mat (`length`; 0 = leave the hole empty).
 * A screw much longer than its hole punches into the board's inner layers.
 */
export function installItem(def: EnclosureDef, st: EnclosureState, b: BoardState, id: string, length?: number, spare = false): EncResult {
  const it = item(def, id);
  if (!st.removed.includes(id)) return { ok: false, text: `${it.label} is already in place.` };
  if (!canInstall(def, st, id)) {
    const first = below(def, id).filter((n) => st.removed.includes(n)).map((n) => item(def, n).label);
    return { ok: false, text: `Put back ${first.join(', ')} first.` };
  }
  const on = (text: string): EncResult => {
    st.removed = st.removed.filter((x) => x !== id);
    return { ok: true, text };
  };
  switch (it.kind) {
    case 'screw': {
      const len = spare ? it.screw!.length : (length ?? 0);
      if (len > 0 && !spare) {
        const k = st.mat.indexOf(len);
        if (k < 0) return { ok: false, text: `There is no ${len} mm screw on the mat.` };
        st.mat.splice(k, 1);
      }
      st.screws[id] = len;
      if (st.matFrom) delete st.matFrom[id];
      const hole = it.screw!.hole;
      if (len > hole + 1 && it.punch) {
        on('');
        const near = it.label;
        b.pcbDamage.push({ a: it.punch[0], b: it.punch[1], r: 1.5, near, screw: id });
        return hurt(st, 'punch', it, `That ${len} mm screw is too long for a ${hole} mm hole — it bottomed out, then bit into the board. You felt it crunch.`);
      }
      if (len > hole + 1) return on(`The ${len} mm screw is too long for this hole and will not go all the way in.`);
      return on(len ? `${it.label} in (${len} mm${spare ? ', a new one from the spares box' : ''}).` : `Left ${it.label.toLowerCase()} empty.`);
    }
    case 'cable': {
      const mod = it.module ? b.comps[it.module] : null;
      if (st.damage.some((d) => d.kind === 'latch-broken' && d.item === id)) {
        if (mod) mod.unplugged = false;
        return on(`${it.label} pushed in, but with the latch broken it barely holds.`);
      }
      if (mod) mod.unplugged = false;
      st.latchOpen = st.latchOpen.filter((x) => x !== id);
      return on(`${it.label} plugged back in${it.latch ? ' and the latch closed' : ''}.`);
    }
    case 'heatsink':
      return on(st.paste[id] ? `${it.label} back on, on fresh paste.` : `${it.label} back on — on the old, broken paste.`);
    case 'adhesive':
      st.heated = st.heated.filter((x) => x !== id);
      return on(`${it.label} pressed back on.`);
    default:
      return on(`${it.label} back on.`);
  }
}

/** Fresh thermal compound on the chip under a lifted heatsink (the old one is cleaned off first). */
export function applyPaste(def: EnclosureDef, st: EnclosureState, id: string, compound: 'paste' | 'lm' = 'paste'): EncResult {
  const it = item(def, id);
  if (it.kind !== 'heatsink' || !st.removed.includes(id)) return { ok: false, text: 'Lift the heatsink off first.' };
  st.paste[id] = true;
  if (st.dried) st.dried = st.dried.filter((x) => x !== id);
  st.lmExposed = (st.lmExposed ?? []).filter((x) => x !== id);
  st.wrongTim = (st.wrongTim ?? []).filter((x) => x !== id);
  if (compound === 'lm') return { ok: true, text: `Old metal cleaned off ${it.chip ?? 'the chip'} with IPA swabs; a thin, even film of fresh liquid metal brushed on.` };
  if (it.lm) {
    st.wrongTim.push(id);
    return { ok: true, text: `Liquid metal cleaned off; ordinary paste applied on ${it.chip ?? 'the chip'} instead. It works, but it will run hotter than the factory liquid metal.` };
  }
  return { ok: true, text: `Old paste wiped off ${it.chip ?? 'the chip'}; a fresh pea of paste applied.` };
}

/**
 * The board was tilted or flipped with liquid metal still wet on a chip: it runs off and
 * bridges the pins of nearby parts (real shorts to wick away).
 */
export function spillLiquidMetal(def: EnclosureDef, st: EnclosureState, b: BoardState): string | null {
  if (!st.lmExposed?.length) return null;
  const hit: string[] = [];
  for (const id of st.lmExposed) {
    const chip = item(def, id).chip;
    const c = chip ? b.comps[chip] : null;
    if (!c) continue;
    // The two nearest small parts with two pins on different nets
    const near = Object.values(b.comps)
      .filter((o) => o !== c && o.part && !o.def.mates && Object.keys(o.def.pins).length >= 2)
      .filter((o) => {
        const [p1, p2] = Object.keys(o.def.pins);
        return o.def.pins[p1] !== o.def.pins[p2];
      })
      .sort((a, z) => Math.hypot(a.def.x - c.def.x, a.def.y - c.def.y) - Math.hypot(z.def.x - c.def.x, z.def.y - c.def.y))
      .slice(0, 2);
    for (const o of near) {
      const [p1, p2] = Object.keys(o.def.pins);
      b.jumpers.push({ id: b.nextJumperId++, a: { ref: o.ref, pin: p1 }, b: { ref: o.ref, pin: p2 }, cold: false, bridge: true });
      hit.push(o.ref);
    }
  }
  st.lmExposed = [];
  return hit.length ? `The liquid metal ran off the chip and across ${hit.join(' and ')} — their pins are shorted now. Wick it off under the microscope.` : null;
}

/** Blow or wipe the dust out of the fan and heatsink fins (the case must be open far enough to reach them). */
export function cleanDust(def: EnclosureDef, st: EnclosureState, how: 'blower' | 'swabs'): EncResult {
  if (!st.dusty) return { ok: false, text: 'Nothing to clean: the fan and heatsink are already clear.' };
  if (!boardReachable(def, st)) return { ok: false, text: 'You cannot reach the fan and heatsink with the case on. Open it up first.' };
  st.dusty = false;
  return { ok: true, text: how === 'blower' ? 'A few short blasts of compressed air and a cloud of grey dust comes out of the fan and heatsink fins.' : 'The swabs pull a thick mat of dust off the fan blades and out of the heatsink fins.' };
}

/**
 * How well each chip under a heatsink is cooled, as a multiplier on its package's thermal
 * resistance: fresh compound 0.25, ordinary paste where liquid metal belongs 0.32, old broken
 * paste 0.38, no heatsink 1. A missing or unplugged fan makes it 1.3x worse.
 */
export function coolingFor(def: EnclosureDef | undefined, st: EnclosureState | undefined): Record<string, number> | undefined {
  if (!def || !st) return undefined;
  const out: Record<string, number> = {};
  const hasFan = def.items.some((f) => f.kind === 'fan');
  const fanOff = hasFan && def.items.some((i) => (i.kind === 'fan' || (i.kind === 'cable' && !i.module)) && st.removed.includes(i.id));
  for (const it of def.items) {
    if (it.kind !== 'heatsink' || !it.chip) continue;
    if (st.removed.includes(it.id)) {
      out[it.chip] = 1;
      continue;
    }
    const k = !st.paste[it.id] || st.dried?.includes(it.id) ? 0.38 : st.wrongTim?.includes(it.id) ? 0.32 : 0.25;
    out[it.chip] = k * (fanOff ? 1.3 : 1) * (st.dusty ? 1.8 : 1);
  }
  return out;
}

/**
 * Drill out a via a screw punched through, isolating the inner layers it shorted (the
 * classic fix for a "long screw" board).
 */
export function drillOut(st: EnclosureState, b: BoardState, id: string): EncResult {
  const before = b.pcbDamage.length;
  b.pcbDamage = b.pcbDamage.filter((d) => d.screw !== id);
  if (b.pcbDamage.length === before) return { ok: false, text: 'Nothing to drill out there.' };
  st.damage = st.damage.filter((d) => !(d.kind === 'punch' && d.item === id));
  return { ok: true, text: 'Drilled the damaged via out under the microscope — the shorted inner layers are isolated again.' };
}

/** The next correct step to open the device (for guided hints and "open it for me"). */
export function nextOpenStep(def: EnclosureDef, st: EnclosureState): { id: string; tool: EncTool } | null {
  for (const it of def.items) if (canRemove(def, st, it.id) && def.items.some((c) => c.covers && !st.removed.includes(c.id) && dependsOn(def, c.id, it.id))) return { id: it.id, tool: rightTool(it, st) };
  return null;
}

/** Does taking `target` off require `id` off first (directly or indirectly)? */
function dependsOn(def: EnclosureDef, target: string, id: string): boolean {
  if (target === id) return true;
  return above(def, target).some((n) => dependsOn(def, n, id));
}

/** Open the device the right way (guided skip). */
export function openForMe(def: EnclosureDef, st: EnclosureState, b: BoardState, opts: EncOptions = {}): string[] {
  const log: string[] = [];
  for (let guard = 0; guard < 200; guard++) {
    const s = nextOpenStep(def, st);
    if (!s) break;
    const r = removeItem(def, st, b, s.id, s.tool, opts);
    log.push(r.text);
    if (!r.ok) break;
  }
  return log;
}

/** Put everything back the right way, matching screws to holes (guided skip). */
export function closeForMe(def: EnclosureDef, st: EnclosureState, b: BoardState, spares = 0): string[] & { sparesUsed?: number } {
  const log: string[] & { sparesUsed?: number } = [];
  log.sparesUsed = 0;
  for (const it of def.items) if (it.kind === 'heatsink' && st.removed.includes(it.id) && !st.paste[it.id]) log.push(applyPaste(def, st, it.id, it.lm ? 'lm' : 'paste').text);
  for (let guard = 0; guard < 200 && st.removed.length; guard++) {
    const it = def.items.find((x) => canInstall(def, st, x.id));
    if (!it) break;
    let len: number | undefined;
    if (it.screw) {
      // The longest screw on the mat that still fits the hole; none left → leave it empty
      const fits = st.mat.filter((l) => l <= it.screw!.hole + 1).sort((a, z) => z - a);
      len = fits.includes(it.screw.length) ? it.screw.length : (fits[0] ?? 0);
      if (!len && log.sparesUsed! < spares) {
        log.sparesUsed!++;
        log.push(installItem(def, st, b, it.id, undefined, true).text);
        continue;
      }
    }
    log.push(installItem(def, st, b, it.id, len).text);
  }
  return log;
}

/** What the customer (or a later inspection) will notice about the case. */
export function enclosureIssues(def: EnclosureDef | undefined, st: EnclosureState | undefined): { hidden: string[]; notes: string[] } {
  const hidden: string[] = [];
  const notes: string[] = [];
  if (!def || !st) return { hidden, notes };
  for (const id of st.cracked ?? []) {
    if (!st.fitted?.includes(id)) notes.push(`The ${def.items.find((i) => i.id === id)?.label.toLowerCase() ?? 'case part'} is still cracked.`);
  }
  if (st.dusty) hidden.push('The fan and heatsink are still full of dust — it will overheat again.');
  if (st.dried?.length) hidden.push('The old, dried-out thermal paste was never replaced — it still runs hot.');
  if (st.removed.length) hidden.push('The device was handed back with its case not fully reassembled.');
  // Screws: only the ones you lost count (it may have come in with some missing already)
  const empty = def.items.filter((it) => it.screw && !st.removed.includes(it.id) && !st.screws[it.id]);
  const lost = empty.length - (st.missingAtIntake?.length ?? 0);
  if (lost > 0) notes.push(lost === 1 ? `A screw is missing (${empty[0].label.toLowerCase()}).` : `${lost} case screws are missing.`);
  for (const it of def.items) {
    if (it.kind === 'heatsink' && !st.removed.includes(it.id) && !st.paste[it.id]) hidden.push(`${it.label} went back on the old paste — the chip will overheat.`);
    if (it.kind === 'heatsink' && !st.removed.includes(it.id) && st.wrongTim?.includes(it.id)) hidden.push(`Ordinary paste on ${it.chip ?? 'the chip'} where liquid metal belongs — it runs hot and throttles.`);
  }
  for (const d of st.damage) {
    if (d.kind === 'clip') notes.push('Snapped case clips — the case creaks.');
    if (d.kind === 'crack') notes.push('A cracked panel from prying it cold.');
    if (d.kind === 'latch-broken') hidden.push('A broken connector latch — the ribbon will work loose.');
  }
  return { hidden, notes: [...new Set(notes)] };
}
