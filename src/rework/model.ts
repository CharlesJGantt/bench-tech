/**
 * Hands-on rework simulation for one component footprint.
 *
 * Every pad has its own temperature, solder volume (and how much of it is low-melt
 * alloy), flux level and grade, and condition. The player's kit — iron tip, hot-air
 * nozzle, wick width, flux grade, solder type, brush and wipes — changes how heat and
 * material move. The outcome of each joint (good / cold / weak / open / lifted /
 * bridged) is derived from what actually happened and written back to the board so
 * the electrical sim sees it. No PlayCanvas or DOM here.
 */
import type { BoardState, Joint, PointRef } from '../sim/circuit';
import { padNames } from '../sim/circuit';
import { FOOTPRINTS, padsOf } from '../sim/footprints';
import { part, pinsOf, type PartSpec } from '../sim/parts';
import { FLUX_GRADES, UNKNOWN_FLUX, USAGE, WICKS, type FluxGrade, type Liquid, type WickDef } from '../business/economy';

import { CLEAN_CRUST, NO_WET_CRUST, crustAt, syncMark } from '../sim/corrosion';

const LIQUID_NAME: Record<Liquid, string> = { ipa: 'IPA', 'flux-cleaner': 'flux remover', 'corrosion-cleaner': 'corrosion cleaner' };

export type ReworkTool = 'iron' | 'wick' | 'flux' | 'tweezers' | 'hotair' | 'ipa' | 'brush' | 'wipe';
export type FluxSupply = keyof typeof FLUX_GRADES;

export const MELT = 217; // lead-free solder liquidus (°C)
export const LOW_MELT = 138; // low-melt alloy liquidus (°C)
export const AMBIENT = 25;

export interface PadState {
  pin: string;
  /** Centre and size relative to the component centre, board orientation (mm). */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Connected to the ground pour: soaks heat, slow to melt. */
  gnd: boolean;
  temp: number;
  /** Solder volume; ~1 is a good joint for this pad. */
  solder: number;
  /** Fraction of the solder that is low-melt alloy (0..1). */
  lowmelt: number;
  /** Old, oxidised solder that needs flux (or fresh solder) to flow properly. */
  dirty: boolean;
  /** Sticky flux on the pad, 0..1. */
  flux: number;
  /** Grade of the flux last applied here. */
  fluxGrade: FluxSupply | 'flux-unknown';
  /** Cleaning-liquid wetness, 0..1 (evaporates). */
  ipa: number;
  /** Which liquid the pad is wet with. */
  solvent: Liquid;
  /** Flux dissolved/loosened in the IPA, ready to be wiped up. */
  dissolved: number;
  /** White residue left when dissolved flux dries without being wiped. */
  white: number;
  /** Corrosion crust on the pad, 0..1 (solder will not wet it). */
  crust: number;
  /** Crust fizzed loose by corrosion cleaner: scrub, rinse with IPA and wipe it off before it dries. */
  sludge: number;
  lifted: boolean;
  /** Accumulated heat damage; ≥ 1 lifts the pad. */
  damage: number;
  /** Seconds molten in the current melt. */
  molten: number;
  /** A component leg was soldered here during this session. */
  wetted: boolean;
  /** Worst conditions seen while the joint was last molten with a leg in it. */
  meltFlux: number;
  meltDirty: boolean;
  meltTime: number;
  /** The original joint from before (kept unless this pad gets reflowed). */
  original: Joint | null;
}

export interface PlacedPart {
  spec: PartSpec;
  /** Rotated 180° from the silkscreen orientation (2-terminal parts). */
  reversed: boolean;
  /** Offset from the footprint centre (mm). */
  dx: number;
  dy: number;
  /** Twist off the footprint axis (degrees) — a misaligned part. */
  angle: number;
  /** The part that was on the board when the session started. */
  original: boolean;
  /** Body temperature (°C) and plastic damage for heat-sensitive parts. */
  bodyTemp: number;
  heatDamage: number;
  melted: boolean;
}

/** The tools in hand. */
export interface Kit {
  tip: { heat: number; radius: number; name: string };
  nozzle: { heat: number; radius: number; name: string };
  wick: WickDef;
  flux: FluxSupply;
  solder: 'solder' | 'lowmelt';
  /** Liquid the IPA tool applies. */
  liquid: Liquid;
  /** Current brush wear, 0 (new) .. 1 (worn out). */
  brushWear: number;
  /** How full of solder the end of the wick braid is, 0 (fresh copper) .. 1 (silver, saturated). */
  wickLoad: number;
}

export const DEFAULT_KIT: Kit = {
  tip: { heat: 1, radius: 0.35, name: 'chisel' },
  nozzle: { heat: 1, radius: 3.5, name: '5 mm' },
  wick: WICKS['wick-2'],
  flux: 'flux-noclean',
  solder: 'solder',
  liquid: 'ipa',
  brushWear: 0,
  wickLoad: 0,
};

/** Consumables available (keyed by supply id). */
export type Supplies = Record<string, number>;

export interface ReworkState {
  ref: string;
  footprint: PartSpec;
  pads: PadState[];
  /** Part sitting on the footprint (soldered or not). */
  part: PlacedPart | null;
  /** Part held in the tweezers. */
  held: PlacedPart | null;
  ironTemp: number;
  hotAirTemp: number;
  /** Pairs of pad indices joined by a solder bridge (and what kind: default a visible blob). */
  bridges: [number, number, BridgeKind?][];
  removedOriginal: boolean;
  /** The part that was taken off this session, and whether it survived (for salvage). */
  removed: { spec: PartSpec; melted: boolean } | null;
  /** Parts taken from stock this session. */
  partsUsed: string[];
  kit: Kit;
  /** Consumables available from the shop at the start. */
  supplies: Supplies;
  /** Consumables used so far (by supply id), plus seconds of heating for the electricity bill. */
  used: Record<string, number> & { heatSeconds: number };
  /** Dissolved flux soaked into the current wipe. */
  wipeLoad: number;
  /** Corrosion cleaner fizzing on crust (0..1, for the view). */
  fizz: number;
  messages: string[];
  time: number;
}

export interface ReworkInput {
  tool: ReworkTool;
  /** Cursor position relative to the component centre (mm), or null when off-canvas. */
  pos: { x: number; y: number } | null;
  /** Primary button held. */
  down: boolean;
  /** Feeding solder wire (Space) while using the iron. */
  feeding: boolean;
  /** Distance the cursor moved this step (mm) — scrubbing and wiping need motion. */
  move?: number;
}

export const say = (st: ReworkState, msg: string) => {
  if (st.messages[st.messages.length - 1] !== msg) st.messages.push(msg);
  if (st.messages.length > 30) st.messages.shift();
};

const newPlaced = (spec: PartSpec, original: boolean, reversed = false, dx = 0, dy = 0): PlacedPart => ({
  spec,
  reversed,
  dx,
  dy,
  angle: 0,
  original,
  bodyTemp: AMBIENT,
  heatDamage: 0,
  melted: false,
});

/** A part that was soldered down crooked: twisted and shifted off its pads, so it shows under the microscope. */
function crookedPart(p: PlacedPart, crooked: boolean): PlacedPart {
  if (crooked) {
    const fp = FOOTPRINTS[p.spec.pkg];
    const big = Math.max(fp.w, fp.h) > 4;
    p.angle = big ? 6 : 12;
    p.dx = big ? 0.35 : 0.2;
    p.dy = big ? -0.2 : 0.12;
  }
  return p;
}

export function initRework(b: BoardState, ref: string, supplies: Supplies = {}, kit: Kit = DEFAULT_KIT): ReworkState {
  const c = b.comps[ref];
  const fp = part(c.def.partNo);
  const lifted = new Set(b.liftedPads);
  const names = padNames(c);
  const pads: PadState[] = padsOf(c.def).map((p, i) => {
    const pin = names[i];
    const has = !!c.part;
    const j = c.joints[pin];
    return {
      pin,
      x: p.x - c.def.x,
      y: p.y - c.def.y,
      w: p.w,
      h: p.h,
      gnd: p.net === 'GND',
      temp: AMBIENT,
      solder: has ? (j?.r === Infinity && j.cracked ? 0.8 : 1) : 0.35,
      lowmelt: 0,
      dirty: true,
      // Someone else's leftover flux: thicker, and of unknown (stubborn) type.
      flux: c.marks.includes('rework-residue') ? 0.35 : 0,
      fluxGrade: c.marks.includes('rework-residue') ? 'flux-unknown' : 'flux-rosin',
      ipa: 0,
      solvent: 'ipa',
      dissolved: 0,
      white: 0,
      crust: crustAt(c, pin),
      sludge: 0,
      lifted: lifted.has(`${ref}.${pin}`),
      damage: 0,
      molten: 0,
      wetted: false,
      meltFlux: 0,
      meltDirty: false,
      meltTime: 0,
      original: has ? (j ?? { r: 0 }) : null,
    };
  });
  // Existing solder bridges across this part's pins come into the session (and can be wicked away).
  const bridges: [number, number, BridgeKind?][] = [];
  for (const j of b.jumpers) {
    if (!j.bridge || j.a.ref !== ref || j.b.ref !== ref) continue;
    const i = names.indexOf(j.a.pin);
    const k = names.indexOf(j.b.pin);
    if (i >= 0 && k >= 0) bridges.push(j.hidden ? [Math.min(i, k), Math.max(i, k), j.hidden] : [Math.min(i, k), Math.max(i, k)]);
  }
  return {
    ref,
    footprint: fp,
    pads,
    part: c.part ? crookedPart(newPlaced(c.part, true, c.reversed), c.marks.includes('crooked')) : null,
    held: null,
    ironTemp: 330,
    hotAirTemp: 340,
    bridges,
    removedOriginal: false,
    removed: null,
    partsUsed: [],
    kit: { ...kit },
    supplies: { ...supplies },
    used: { heatSeconds: 0 },
    wipeLoad: 0,
    fizz: 0,
    messages: [],
    time: 0,
  };
}

/** Melting point of a pad's solder, lowered by low-melt alloy mixed in. */
export function meltOf(p: PadState): number {
  return MELT - (MELT - LOW_MELT) * Math.min(1, p.lowmelt * 1.4);
}

/** Distance from a point to a pad's copper (0 inside). */
function padDist(p: PadState, x: number, y: number): number {
  return Math.hypot(Math.max(0, Math.abs(x - p.x) - p.w / 2), Math.max(0, Math.abs(y - p.y) - p.h / 2));
}

/** Index of the pad under a point (with a little tolerance), or -1. */
export function padAt(st: ReworkState, x: number, y: number, tol = 0.35): number {
  let best = -1;
  let bd = Infinity;
  st.pads.forEach((p, i) => {
    const d = padDist(p, x, y);
    if (d <= tol && d < bd) {
      bd = d;
      best = i;
    }
  });
  return best;
}

/** Is the part close enough to centre that every leg sits on its pad? */
export function aligned(p: PlacedPart): boolean {
  return Math.hypot(p.dx, p.dy) < 0.45;
}

/** Pads that currently have a component leg resting on them. */
function legPads(st: ReworkState): number[] {
  if (!st.part || !aligned(st.part)) return [];
  return st.pads.map((_, i) => i);
}

/** Can a part be fitted here (same package as the footprint)? */
export function fits(st: ReworkState, partNo: string): boolean {
  return part(partNo).pkg === st.footprint.pkg;
}

/** Can this part be turned round (2-terminal parts only)? */
export function rotatable(p: PlacedPart): boolean {
  return pinsOf(p.spec).length === 2;
}

export function pickFromTray(st: ReworkState, partNo: string): void {
  if (st.held) say(st, 'You are already holding a part.');
  else if (!fits(st, partNo)) say(st, 'That part does not fit this footprint.');
  else {
    st.held = newPlaced(part(partNo), false);
    st.partsUsed.push(partNo);
    say(st, `Picked up a ${part(partNo).label} with the tweezers.`);
  }
}

export function rotateHeld(st: ReworkState): void {
  if (st.held && rotatable(st.held)) {
    st.held.reversed = !st.held.reversed;
    say(st, 'Turned the part around.');
  }
}

/** Single click actions (tweezers). */
export function click(st: ReworkState, tool: ReworkTool, x: number, y: number): void {
  if (tool !== 'tweezers') return;
  if (st.held) {
    if (st.part) {
      say(st, 'There is already a part on the footprint.');
      return;
    }
    st.part = { ...st.held, dx: x, dy: y };
    st.held = null;
    for (const p of st.pads) p.wetted = false;
    say(st, aligned(st.part) ? 'Part placed on the pads.' : 'Part placed — but it is off-centre; the legs are not on the pads.');
    return;
  }
  if (!st.part) return;
  // Grab the part if the click is on it.
  const near = Math.abs(x - st.part.dx) < 0.6 + 0.5 * spanX(st) && Math.abs(y - st.part.dy) < 0.6 + 0.5 * spanY(st);
  if (!near) return;
  const legs = st.pads.filter((p) => !p.lifted);
  const soldered = st.pads.some((p) => p.solder > 0.15 && (p.original || p.wetted));
  const allMolten = legs.every((p) => p.temp >= meltOf(p));
  if (soldered && !allMolten) {
    const n = legs.filter((p) => p.temp >= meltOf(p)).length;
    say(st, n ? `Only ${n} of ${legs.length} joints are molten — they all need to be melted at the same time.` : 'It is still soldered down. Melt the joints first.');
    if (n > 0 && st.pads.length === 2) {
      // Pulling on a half-melted part can tear the other pad.
      const cold = st.pads.find((p) => p.temp < meltOf(p) && !p.lifted);
      if (cold && cold.temp > 150 && Math.random() < 0.15) {
        cold.lifted = true;
        say(st, `Pulled too hard — the ${cold.pin} pad tore off the board!`);
      }
    }
    return;
  }
  st.held = st.part;
  st.part = null;
  if (st.held.original) {
    st.removedOriginal = true;
    st.removed = { spec: st.held.spec, melted: st.held.melted };
    st.held.original = false;
  }
  for (const p of st.pads) {
    p.original = null;
    p.wetted = false;
    if (p.solder > 0.1) p.solder *= 0.7; // some solder leaves with the part
  }
  say(st, st.held.melted ? 'Lifted it off — but its plastic body is melted. It is scrap now.' : 'Lifted the part off with the tweezers.');
}

function spanX(st: ReworkState) {
  return Math.max(...st.pads.map((p) => Math.abs(p.x) + p.w / 2)) * 2;
}
function spanY(st: ReworkState) {
  return Math.max(...st.pads.map((p) => Math.abs(p.y) + p.h / 2)) * 2;
}

/** Discard a part held in the tweezers. */
export function dropHeld(st: ReworkState): void {
  if (st.held) say(st, 'Put the part in the bin.');
  st.held = null;
}

/** How much of a consumable is left (unlimited when the shop did not say). */
function left(st: ReworkState, id: string): number {
  return (st.supplies[id] ?? Infinity) - (st.used[id] ?? 0);
}
function use(st: ReworkState, id: string, amount: number): void {
  st.used[id] = (st.used[id] ?? 0) + amount;
}

/** Trim the saturated end off the wick braid; uses a little of the roll. */
export function cutWick(st: ReworkState): boolean {
  const kit = st.kit;
  if (kit.wickLoad <= 0.02) {
    say(st, 'The wick end is still clean copper — no need to cut it yet.');
    return false;
  }
  if (left(st, kit.wick.supply) < USAGE.wickCutCm) {
    say(st, 'Not enough of that wick left on the roll! Reorder it from the office.');
    return false;
  }
  use(st, kit.wick.supply, USAGE.wickCutCm);
  kit.wickLoad = 0;
  say(st, `Snipped off the used wick (${USAGE.wickCutCm} cm) into the bin. Fresh copper braid ready.`);
  return true;
}

/** Advance the simulation by dt seconds with the current input. */
export function step(st: ReworkState, dt: number, input: ReworkInput): void {
  st.time += dt;
  st.fizz = Math.max(0, st.fizz - dt * 2);
  const kit = st.kit;
  const pos = input.pos;
  const active = !!(input.down && pos);
  const move = input.move ?? 0;

  // Which pads the iron tip / wick braid touches: the one under the cursor fully, others within reach partly.
  const reach = input.tool === 'wick' ? kit.wick.width / 2 : kit.tip.radius;
  const touched = new Map<number, number>();
  if (active && (input.tool === 'iron' || input.tool === 'wick')) {
    const main = padAt(st, pos!.x, pos!.y, Math.max(0.35, reach));
    if (main >= 0) touched.set(main, 1);
    st.pads.forEach((p, i) => {
      if (i !== main && padDist(p, pos!.x, pos!.y) < reach) touched.set(i, 0.6);
    });
  }

  // Consumables: a tool whose supply has run out does nothing.
  let tool: ReworkTool | 'none' = input.tool;
  if (active) {
    const need: Partial<Record<ReworkTool, [string, number, string]>> = {
      flux: [kit.flux, USAGE.fluxPerSec * dt, 'that flux'],
      ipa: [kit.liquid, USAGE.ipaPerSec * dt, LIQUID_NAME[kit.liquid]],
    };
    const n = need[input.tool];
    if (n) {
      if (left(st, n[0]) >= n[1]) use(st, n[0], n[1]);
      else {
        say(st, `Out of ${n[2]}! Reorder it from the office.`);
        tool = 'none';
      }
    }
    if (tool === 'wipe' && st.wipeLoad === 0 && left(st, 'wipes') < 1) {
      say(st, 'Out of wipes! Reorder them from the office.');
      tool = 'none';
    }
    if (tool === 'iron' || tool === 'wick' || tool === 'hotair') st.used.heatSeconds += dt;
  }
  const legs = new Set(legPads(st));

  st.pads.forEach((p, i) => {
    if (p.lifted) {
      p.temp += (AMBIENT - p.temp) * (1 - Math.exp(-dt * 0.6));
      return;
    }
    const grade: FluxGrade = p.fluxGrade === 'flux-unknown' ? UNKNOWN_FLUX : FLUX_GRADES[p.fluxGrade];
    // How well the liquid on this pad dissolves its flux: flux remover is stronger, and the
    // only thing that really shifts unknown baked-on flux; corrosion cleaner is a poor solvent.
    const solvency =
      p.solvent === 'flux-cleaner' ? (p.fluxGrade === 'flux-unknown' ? 5 : 1.5) : p.solvent === 'corrosion-cleaner' ? 0.6 : 1;
    // Heat-transfer efficiency: flux and a bit of solder make a good thermal bridge; ground pads sink heat.
    const contact = (0.45 + 0.35 * p.flux * grade.wet + 0.4 * Math.min(1, p.solder + (legs.has(i) ? 0.2 : 0))) * (p.gnd ? 0.45 : 1);
    let heat = 0;
    let src = AMBIENT;
    const share = touched.get(i) ?? 0;
    if (share && tool !== 'none') {
      src = tool === 'wick' ? st.ironTemp - 25 : st.ironTemp;
      heat = 3.2 * contact * kit.tip.heat * share * (tool === 'wick' ? kit.wick.heat : 1);
    } else if (active && tool === 'hotair') {
      const d = Math.hypot(pos!.x - p.x, pos!.y - p.y);
      const r = kit.nozzle.radius;
      if (d < r) {
        src = st.hotAirTemp;
        heat = 1.1 * kit.nozzle.heat * (p.gnd ? 0.6 : 1) * (1 - d / (r + 0.5));
      }
    }
    if (heat > 0) p.temp += (src - p.temp) * (1 - Math.exp(-dt * heat));
    else p.temp += (AMBIENT - p.temp) * (1 - Math.exp(-dt * 0.55));

    // Flux: painted on (of the selected grade), boils off when hot
    if (active && tool === 'flux' && Math.hypot(pos!.x - p.x, pos!.y - p.y) < Math.max(1.4, Math.max(p.w, p.h))) {
      p.flux = Math.min(1, p.flux + 2.5 * dt);
      p.fluxGrade = kit.flux;
    }
    if (p.temp > 240) p.flux = Math.max(0, p.flux - dt * 0.12 * grade.burn * (p.temp > 350 ? 2.5 : 1));

    // Cleaning: IPA wets, the brush loosens flux into it, the wipe lifts it away.
    const near = (r: number) => active && Math.hypot(pos!.x - p.x, pos!.y - p.y) < r + Math.max(p.w, p.h) / 2;
    if (near(1.5) && tool === 'ipa') {
      p.ipa = Math.min(1, p.ipa + 2 * dt);
      p.solvent = kit.liquid;
      // The liquid alone slowly softens flux and re-dissolves dried residue
      const soak = Math.min(p.flux, dt * 0.15 * grade.clean * solvency);
      p.flux -= soak;
      p.dissolved += soak;
      const redissolve = Math.min(p.white, dt * 0.5);
      p.white -= redissolve;
      p.dissolved += redissolve;
      // Corrosion cleaner fizzes crust into a sludge; other liquids barely touch it.
      if (p.crust > 0) {
        const eat = Math.min(p.crust, dt * (kit.liquid === 'corrosion-cleaner' ? 0.35 : 0.01));
        p.crust -= eat;
        p.sludge += eat;
        if (kit.liquid === 'corrosion-cleaner') st.fizz = 1;
      }
    }
    if (near(1.2) && tool === 'brush') {
      if (p.ipa > 0.1) {
        const eff = 1 - 0.7 * Math.min(1, kit.brushWear);
        const loosened = Math.min(p.flux, move * 0.04 * grade.clean * eff * solvency);
        p.flux -= loosened;
        p.dissolved += loosened;
        // Scrubbing breaks up crust the cleaner has started on
        if (p.crust > 0 && p.solvent === 'corrosion-cleaner') {
          const broke = Math.min(p.crust, move * 0.06 * eff);
          p.crust -= broke;
          p.sludge += broke;
        }
      } else if (move > 0 && p.flux > 0.05) say(st, 'Scrubbing dry just smears the flux around — apply IPA first.');
    }
    if (near(2) && tool === 'wipe' && move > 0) {
      const lifted = Math.min(p.dissolved, move * 0.3 * (p.ipa > 0.05 ? 1 : 0.5));
      p.dissolved -= lifted;
      st.wipeLoad += lifted;
      // Sludge comes away cleanly once it is rinsed in IPA; wiping it in the cleaner just smears it.
      const rinsed = p.ipa > 0.05 && p.solvent !== 'corrosion-cleaner';
      const gone = Math.min(p.sludge, move * 0.3 * (rinsed ? 1 : 0.25));
      p.sludge -= gone;
      st.wipeLoad += gone;
      if (p.sludge > 0.05 && !rinsed) say(st, 'The sludge just smears around — rinse it with IPA, then wipe.');
      p.ipa = Math.max(0, p.ipa - move * 0.25);
      if (p.flux > 0.1 && p.dissolved < 0.02 && p.ipa < 0.05) say(st, 'The wipe just drags sticky flux around — dissolve it with IPA and the brush first.');
    }
    if (p.ipa > 0) {
      p.ipa = Math.max(0, p.ipa - dt * (0.1 + Math.max(0, p.temp - 30) * 0.004));
      if (p.ipa === 0 && p.sludge > 0.02) {
        p.crust = Math.min(1, p.crust + p.sludge * 0.8);
        p.sludge = 0;
        say(st, 'The sludge dried before you wiped it — it is crust again. Cleaner, scrub, IPA, wipe.');
      }
      if (p.ipa === 0 && p.dissolved > 0.03) {
        p.white += p.dissolved * grade.residue;
        p.dissolved = 0;
        say(st, 'The IPA dried before you wiped it — it left a white residue. More IPA, then wipe.');
      }
    }

    const molten = p.temp >= meltOf(p);
    if (molten) {
      p.molten += dt;
      // Solder wire: only flows into a molten joint
      if (share === 1 && tool === 'iron' && input.feeding) {
        const add = 1.3 * dt;
        const grams = add * USAGE.solderPerUnit;
        if (left(st, kit.solder) < grams) say(st, `Out of ${kit.solder === 'lowmelt' ? 'low-melt alloy' : 'solder wire'}! Reorder it from the office.`);
        else {
          use(st, kit.solder, grams);
          const lm = kit.solder === 'lowmelt' ? add : 0;
          p.lowmelt = (p.lowmelt * p.solder + lm) / (p.solder + add);
          p.solder = Math.min(3, p.solder + add);
        }
        if (p.solder > 0.6) p.dirty = false;
      }
      // Wick: soaks up molten solder, far better with flux
      if (share && tool === 'wick') {
        // A braid end full of solder (silver) barely soaks up anything: trim it off.
        const fresh = Math.max(0, 1 - kit.wickLoad);
        const before = p.solder;
        p.solder = Math.max(0.03, p.solder - dt * kit.wick.rate * share * (0.35 + 1.6 * p.flux * grade.wet) * (0.05 + 0.95 * fresh));
        kit.wickLoad = Math.min(1, kit.wickLoad + (before - p.solder) / USAGE.wickCapacity);
        if (kit.wickLoad >= 1) say(st, 'The end of the wick is silver and full of solder — cut it off and bin it (C).');
        if (p.solder < 0.15) {
          p.dirty = false;
          p.lowmelt = 0;
        }
        p.flux = Math.max(0, p.flux - dt * 0.3);
      }
      // Fresh flux lets old solder flow and clean itself
      if (p.flux > 0.4 && p.molten > 0.6) p.dirty = false;
      if (legs.has(i) && p.solder >= 0.25 && p.crust > NO_WET_CRUST) {
        if (share === 1 && tool === 'iron') say(st, 'The solder balls up and will not stick — the pad is crusted with corrosion. Clean it first.');
      } else if (legs.has(i) && p.solder >= 0.25) {
        if (!p.wetted || p.meltTime === 0) {
          p.meltFlux = p.flux;
          p.meltDirty = p.dirty;
        }
        p.wetted = true;
        p.original = null;
        p.meltFlux = Math.max(p.meltFlux, p.flux);
        p.meltDirty = p.meltDirty && p.dirty;
        p.meltTime += dt;
      }
    } else {
      if (share === 1 && tool === 'iron' && input.feeding && p.temp > 120) say(st, 'The solder will not flow — the pad is not hot enough yet.');
      p.molten = 0;
    }

    // Heat damage: too hot, or held molten too long
    if (p.temp > 380) p.damage += dt * ((p.temp - 380) / 45);
    if (p.molten > 6) p.damage += dt * 0.18;
    if (p.damage >= 1 && !p.lifted) {
      p.lifted = true;
      p.solder = 0;
      say(st, `Too much heat — the ${p.pin} pad lifted off the board!`);
    } else if (p.damage > 0.6 && p.damage - dt * 0.3 <= 0.6) say(st, `Careful — the ${p.pin} pad is getting badly overheated.`);
  });

  // Brush wear and fresh brushes
  if (active && tool === 'brush' && move > 0) {
    kit.brushWear = Math.min(1, kit.brushWear + move * USAGE.brushWearPerMm);
    if (kit.brushWear >= 1) {
      if (left(st, 'brushes') >= 1) {
        use(st, 'brushes', 1);
        kit.brushWear = 0;
        say(st, 'The bristles are splayed flat — swapped in a fresh brush.');
      } else say(st, 'Your brush is worn out and barely scrubs. Buy new brushes in the office.');
    }
  }
  // Wipes get saturated and replaced
  if (st.wipeLoad >= USAGE.wipeCapacity) {
    use(st, 'wipes', 1);
    st.wipeLoad = 0;
    say(st, left(st, 'wipes') >= 1 ? 'That wipe is saturated — grabbed a fresh one.' : 'That was your last wipe.');
  }

  // Plastic bodies: hot air on the part, or very hot joints, cook the housing.
  const body = st.part;
  if (body?.spec.heatLimit) {
    let target = AMBIENT;
    for (const p of st.pads) target = Math.max(target, AMBIENT + (p.temp - AMBIENT) * 0.8);
    if (active && tool === 'hotair' && Math.hypot(pos!.x - body.dx, pos!.y - body.dy) < kit.nozzle.radius + 1) target = Math.max(target, st.hotAirTemp);
    body.bodyTemp += (target - body.bodyTemp) * (1 - Math.exp(-dt * 1.2));
    if (body.bodyTemp > body.spec.heatLimit) {
      body.heatDamage += dt * ((body.bodyTemp - body.spec.heatLimit) / 25);
      if (body.heatDamage > 0.5 && body.heatDamage - dt * 2 <= 0.5) say(st, `The plastic on ${st.ref} is starting to deform — too hot!`);
      if (body.heatDamage >= 1 && !body.melted) {
        body.melted = true;
        say(st, `The plastic body of ${st.ref} melted. That part is ruined.`);
      }
    }
  }

  // Surface tension pulls a part straight when its joints are molten.
  if (st.part && st.pads.every((p) => p.lifted || p.temp >= meltOf(p)) && Math.hypot(st.part.dx, st.part.dy) < 0.6) {
    const k = Math.exp(-dt * 3);
    st.part.dx *= k;
    st.part.dy *= k;
    st.part.angle *= k;
  }

  // Hidden bridges: a whisker pulls back into the joints once fluxed and molten; a ball under
  // a chip only comes out when the chip is lifted.
  for (let k = st.bridges.length - 1; k >= 0; k--) {
    const [i, j, kind] = st.bridges[k];
    const a = st.pads[i];
    const b = st.pads[j];
    const hot = (p: PadState) => p.temp >= meltOf(p) && p.flux > 0.2;
    if (kind === 'whisker' && (hot(a) || hot(b))) {
      st.bridges.splice(k, 1);
      say(st, `A fine solder whisker between ${a.pin} and ${b.pin} pulled back into the joints.`);
    } else if (kind === 'ball' && !st.part) {
      st.bridges.splice(k, 1);
      say(st, `A stray solder ball was hiding under the chip between ${a.pin} and ${b.pin} — it is out now.`);
    }
  }

  // Solder bridges between close neighbours
  for (let i = 0; i < st.pads.length; i++)
    for (let j = i + 1; j < st.pads.length; j++) {
      const a = st.pads[i];
      const b = st.pads[j];
      const gap = Math.max(Math.abs(a.x - b.x) - (a.w + b.w) / 2, Math.abs(a.y - b.y) - (a.h + b.h) / 2);
      if (gap > 0.8) continue;
      const idx = st.bridges.findIndex(([x, y, kind]) => x === i && y === j && kind !== 'ball');
      const amount = a.solder + b.solder;
      if (idx < 0 && a.temp >= meltOf(a) && b.temp >= meltOf(b) && amount > 2.6 + gap * 2) {
        st.bridges.push([i, j]);
        say(st, `Solder bridge between ${a.pin} and ${b.pin}! Wick it away.`);
      } else if (idx >= 0 && (a.temp >= meltOf(a) || b.temp >= meltOf(b)) && amount < 1.9 + gap * 2) {
        st.bridges.splice(idx, 1);
        say(st, `Bridge between ${a.pin} and ${b.pin} cleared.`);
      }
    }
}

// ---------------------------------------------------------------------------
// Microscope view: magnification, ring light, tilt
// ---------------------------------------------------------------------------

export type BridgeKind = 'blob' | 'whisker' | 'ball';

export interface ScopeView {
  /** Magnification relative to the fitted view. */
  zoom: number;
  ring: boolean;
  tilt: boolean;
}

/** Highest magnification the owned objectives allow. */
export function maxZoom(tools: readonly string[]): number {
  return tools.includes('objective-2x') ? 4 : tools.includes('objective-1x') ? 2.5 : 1.5;
}

/** Can this bridge be seen with the current view? */
export function bridgeVisible(kind: BridgeKind | undefined, v: ScopeView): boolean {
  if (kind === 'whisker') return v.zoom >= 2.5 || (v.ring && v.zoom >= 1.5);
  if (kind === 'ball') return v.tilt;
  return true;
}

// ---------------------------------------------------------------------------
// Outcome
// ---------------------------------------------------------------------------

export type JointResult = 'good' | 'cold' | 'weak' | 'starved' | 'excess' | 'open' | 'lifted' | 'unchanged';

/** What each joint will be if the work is applied now. */
export function jointResults(st: ReworkState): JointResult[] {
  return st.pads.map((p) => {
    if (p.lifted) return 'lifted';
    if (!st.part) return 'open';
    if (!aligned(st.part)) return 'open';
    if (p.original && !p.wetted) return 'unchanged';
    if (!p.wetted) return 'open';
    if (p.solder < 0.35) return 'starved';
    if (p.lowmelt > 0.15) return 'weak';
    if ((p.meltDirty && p.meltFlux < 0.2) || p.meltTime < 0.25) return 'cold';
    if (p.solder > 2) return 'excess';
    return 'good';
  });
}

export function anyHot(st: ReworkState): boolean {
  return st.pads.some((p) => p.temp >= meltOf(p));
}

/** Write the rework outcome back to the board. Returns a short summary. */
export function applyRework(b: BoardState, st: ReworkState): string {
  const c = b.comps[st.ref];
  const results = jointResults(st);
  const names = st.pads.map((p) => p.pin);
  const notes: string[] = [];

  for (const p of st.pads) {
    const key = `${st.ref}.${p.pin}`;
    if (p.lifted && !b.liftedPads.includes(key)) b.liftedPads.push(key);
  }

  if (!st.part) {
    if (c.part) {
      c.part = null;
      c.fault = null;
      c.reversed = false;
      c.burnt = false;
      c.marks = c.marks.filter((m) => !['crooked', 'loose', 'bent-pin', 'bulged', 'discolored'].includes(m));
      notes.push(`${st.ref} removed`);
    }
    for (const pin of Object.keys(c.joints)) c.joints[pin] = { r: 0 };
  } else {
    const fresh = !st.part.original;
    if (fresh) {
      c.part = st.part.spec;
      c.fault = null;
      c.burnt = false;
      c.replaced = true;
      c.marks = c.marks.filter((m) => !['crooked', 'loose', 'bent-pin', 'bulged', 'discolored'].includes(m));
      notes.push(`fitted ${st.part.spec.label}${st.part.reversed ? ' (turned round)' : ''}`);
    }
    if (st.part.melted) {
      c.fault = { type: 'melted' };
      notes.push('its plastic body melted');
    }
    c.reversed = st.part.reversed && pinsOf(st.part.spec).length === 2;
    const off = Math.hypot(st.part.dx, st.part.dy) > 0.12 || Math.abs(st.part.angle) > 2;
    if (off && !c.marks.includes('crooked')) c.marks.push('crooked');
    if (!off) c.marks = c.marks.filter((m) => m !== 'crooked');
    const joints: Record<string, { r: number; cold?: boolean; cracked?: boolean }> = {};
    const pins = pinsOf(c.part!);
    names.forEach((pin, i) => {
      const r = results[i];
      // Footprint pad i carries installed pin i.
      const ipin = pins[i] ?? pin;
      if (r === 'unchanged') joints[ipin] = st.pads[i].original ?? { r: 0 };
      else if (r === 'good' || r === 'excess') joints[ipin] = { r: 0 };
      else if (r === 'cold' || r === 'starved' || r === 'weak') joints[ipin] = { r: 0.5, cold: true };
      else joints[ipin] = { r: Infinity };
    });
    c.joints = joints;
    const counts = results.reduce<Record<string, number>>((m, r) => ((m[r] = (m[r] ?? 0) + 1), m), {});
    const desc = Object.entries(counts)
      .filter(([r]) => r !== 'unchanged')
      .map(([r, n]) => `${n} ${r}`)
      .join(', ');
    if (desc) notes.push(`joints: ${desc}`);
  }

  // Solder bridges become real shorts on the board (replacing whatever bridges this part had).
  b.jumpers = b.jumpers.filter((j) => !(j.bridge && j.a.ref === st.ref && j.b.ref === st.ref));
  for (const [i, j, kind] of st.bridges) {
    const a: PointRef = { ref: st.ref, pin: names[i] };
    const z: PointRef = { ref: st.ref, pin: names[j] };
    b.jumpers.push({ id: b.nextJumperId++, a, b: z, cold: false, bridge: true, ...(kind && kind !== 'blob' ? { hidden: kind } : {}) });
    notes.push(`solder bridge ${names[i]}–${names[j]}`);
  }

  // Crust (and any sludge left to dry) goes back onto the board.
  if (c.corr || st.pads.some((p) => p.crust + p.sludge > 0)) {
    c.corr ??= { color: 'green', pins: {} };
    for (const p of st.pads) c.corr.pins[p.pin] = Math.min(1, p.crust + p.sludge * 0.8);
    syncMark(c);
    const left = st.pads.filter((p) => p.crust + p.sludge > CLEAN_CRUST).length;
    if (left) notes.push(`corrosion left on ${left} pad${left > 1 ? 's' : ''}`);
  }

  const residue = st.pads.some((p) => p.flux > 0.05 || p.dissolved > 0.05 || p.white > 0.05);
  c.marks = c.marks.filter((m) => m !== 'rework-residue' && m !== 'residue');
  if (residue) {
    c.marks.push('rework-residue');
    notes.push('flux left on the board');
  }
  const lifted = st.pads.filter((p) => p.lifted).map((p) => p.pin);
  if (lifted.length) notes.push(`lifted pad ${lifted.join(', ')}`);
  return `${st.ref}: ${notes.join('; ') || 'no changes'}.`;
}
