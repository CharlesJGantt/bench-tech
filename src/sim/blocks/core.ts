/**
 * Circuit blocks: reusable, parameterised sub-circuits (an input stage, a buck rail, an
 * LDO…) that bring their parts, layout, service-sheet data and fault variants with them.
 * `device()` expands placed blocks plus a device's own parts into an ordinary DeviceDef,
 * so the solver, router, renderer, rework and saves are unaware of blocks.
 *
 * Refs are plain-numbered (U7, C23): a device's own parts and any explicit overrides keep
 * their refs; block parts take the next free number for their prefix, in block order.
 * Block-internal nets are namespaced with the block id (e.g. "5V_FB"); port nets are shared.
 */
import type { ComponentDef, DeviceDef, TestPointInfo } from '../board';
import type { BoardState } from '../circuit';
import type { AppliedFault, Rng, Tier, Variant } from '../faults';
import { part, type Kind } from '../parts';

/** A part inside a block, positioned relative to the block's top-left corner. */
export interface BlockPart {
  /** Local key used by the block's own code (e.g. "reg", "cout"). */
  key: string;
  partNo: string;
  at: [number, number];
  rot?: ComponentDef['rot'];
  /** pin → local net name (ports or internal nets). */
  pins: Record<string, string>;
  role: string;
  /** Plug-in module: mates through the block part with this key. */
  mates?: string;
}

/** Resolves a block part key to its assigned board ref. */
export type RefOf = (key: string) => string;
/** Resolves a block-local net name to its board net. */
export type NetOf = (local: string) => string;

export interface BlockVariant {
  id: string;
  family: string;
  tier: Tier;
  weight: number;
  apply(b: BoardState, rng: Rng, ref: RefOf, net: NetOf): Omit<AppliedFault, 'variant' | 'family' | 'tier'>;
}

export interface BlockDef {
  /** Silkscreen title of the block outline. */
  title: string;
  size: [number, number];
  /** Local net names that connect outside the block. */
  ports: string[];
  parts: BlockPart[];
  /** Descriptions of local nets (ports and internals). */
  nets: Record<string, { desc: string; expected?: number; power?: boolean }>;
  testPoints?: { key: string; expected: string }[];
  rails?: { net: string; nominal: number; label: string }[];
  variants: BlockVariant[];
  missable?: string[];
  carbonise?: [string, string, string][];
}

/** A block placed on a board. */
export interface PlacedBlock {
  /** Unique id on this board; also the prefix of its internal nets. */
  id: string;
  def: BlockDef;
  at: [number, number];
  /** port → board net. */
  wire: Record<string, string>;
  /** Optional fixed refs for some parts (key → ref), e.g. to keep refs stable in old saves. */
  refs?: Record<string, string>;
  /** Optional absolute positions for some parts (key → [x, y, rot]), to keep an existing board's layout. */
  layout?: Record<string, [number, number, ComponentDef['rot']?]>;
  /** Include the block's fault variants (default), none, or all but these ids. */
  faults?: boolean | { except: string[] };
  /** Custom silkscreen outline for this block (default: the block's own rectangle and title). */
  outline?: { name: string; x: number; y: number; w: number; h: number } | null;
}

export const place = (
  id: string,
  def: BlockDef,
  at: [number, number],
  wire: Record<string, string>,
  refs?: Record<string, string>,
  extra: Pick<PlacedBlock, 'layout' | 'faults' | 'outline'> = {},
): PlacedBlock => ({ id, def, at, wire, refs, ...extra });


const PREFIX: Record<Kind, string> = {
  resistor: 'R',
  capacitor: 'C',
  electrolytic: 'C',
  fuse: 'F',
  diode: 'D',
  tvs: 'D',
  zener: 'D',
  led: 'D',
  cob: 'LED',
  nmos: 'Q',
  pmos: 'Q',
  inductor: 'L',
  buck: 'U',
  ldo: 'U',
  mcu: 'U',
  charger: 'U',
  retimer: 'U',
  amp: 'U',
  boost: 'U',
  shifter: 'U',
  jack: 'J',
  connector: 'J',
  battery: 'BT',
  module: 'M',
  button: 'SW',
  testpoint: 'TP',
};

/** Everything a device file provides besides its blocks. */
export type DeviceSpec = Omit<DeviceDef, 'components' | 'blocks' | 'testPoints' | 'rails' | 'nets' | 'variants' | 'missable' | 'carbonise'> & {
  blocks: PlacedBlock[];
  /** Parts unique to this device (explicit refs). */
  parts: ComponentDef[];
  /** Extra silkscreen block outlines for the device's own parts. */
  outlines?: DeviceDef['blocks'];
  testPoints?: TestPointInfo[];
  rails?: DeviceDef['rails'];
  nets?: DeviceDef['nets'];
  variants?: Variant[];
  missable?: string[];
  carbonise?: DeviceDef['carbonise'];
};

export interface BuiltDevice extends DeviceDef {
  /** Assigned refs per block: refs[blockId][key]. */
  blockRefs: Record<string, Record<string, string>>;
}

/** Expand blocks into a plain DeviceDef. */
export function device(spec: DeviceSpec): BuiltDevice {
  const { blocks: placed, parts, outlines = [], ...rest } = spec;
  const taken = new Set(parts.map((p) => p.ref));
  for (const pb of placed) for (const r of Object.values(pb.refs ?? {})) {
    if (taken.has(r)) throw new Error(`${spec.id}: ref ${r} used twice`);
    taken.add(r);
  }
  const next: Record<string, number> = {};
  const fresh = (prefix: string) => {
    let n = next[prefix] ?? 1;
    while (taken.has(`${prefix}${n}`)) n++;
    next[prefix] = n + 1;
    const ref = `${prefix}${n}`;
    taken.add(ref);
    return ref;
  };

  const components: ComponentDef[] = [...parts];
  const outline: DeviceDef['blocks'] = [...outlines];
  const testPoints: TestPointInfo[] = [...(spec.testPoints ?? [])];
  const rails = [...(spec.rails ?? [])];
  const nets: DeviceDef['nets'] = {};
  const variants: Variant[] = [];
  const missable = [...(spec.missable ?? [])];
  const carbonise = [...(spec.carbonise ?? [])];
  const blockRefs: Record<string, Record<string, string>> = {};
  const ids = new Set<string>();

  for (const pb of placed) {
    const def = pb.def;
    if (ids.has(pb.id)) throw new Error(`${spec.id}: block id ${pb.id} used twice`);
    ids.add(pb.id);
    for (const port of def.ports) if (!(port in pb.wire)) throw new Error(`${spec.id}/${pb.id}: port ${port} not wired`);
    const netOf: NetOf = (local) => (local === 'GND' ? 'GND' : def.ports.includes(local) ? pb.wire[local] : `${pb.id}_${local}`);
    const refs: Record<string, string> = {};
    for (const bp of def.parts) refs[bp.key] = pb.refs?.[bp.key] ?? fresh(PREFIX[part(bp.partNo).kind]);
    blockRefs[pb.id] = refs;
    const refOf: RefOf = (key) => {
      const r = refs[key];
      if (!r) throw new Error(`${spec.id}/${pb.id}: no part "${key}"`);
      return r;
    };
    for (const bp of def.parts) {
      const fixed = pb.layout?.[bp.key];
      components.push({
        ref: refs[bp.key],
        partNo: bp.partNo,
        block: def.title,
        x: fixed ? fixed[0] : pb.at[0] + bp.at[0],
        y: fixed ? fixed[1] : pb.at[1] + bp.at[1],
        rot: fixed ? (fixed[2] ?? 0) : (bp.rot ?? 0),
        pins: Object.fromEntries(Object.entries(bp.pins).map(([pin, local]) => [pin, netOf(local)])),
        role: bp.role,
        ...(bp.mates ? { mates: refOf(bp.mates) } : {}),
      });
    }
    if (pb.outline !== null) outline.push(pb.outline ?? { name: def.title, x: pb.at[0], y: pb.at[1], w: def.size[0], h: def.size[1] });
    for (const [local, info] of Object.entries(def.nets)) {
      const n = netOf(local);
      if (!(n in nets)) nets[n] = info;
    }
    for (const tp of def.testPoints ?? []) {
      const bp = def.parts.find((p) => p.key === tp.key)!;
      if (!testPoints.some((t) => t.ref === refOf(tp.key))) testPoints.push({ ref: refOf(tp.key), net: netOf(Object.values(bp.pins)[0]), expected: tp.expected });
    }
    for (const r of def.rails ?? []) if (!rails.some((x) => x.net === netOf(r.net))) rails.push({ ...r, net: netOf(r.net) });
    for (const m of def.missable ?? []) missable.push(refOf(m));
    for (const [a, b2, k] of def.carbonise ?? []) carbonise.push([netOf(a), netOf(b2), refOf(k)]);
    const skip = pb.faults === false ? null : typeof pb.faults === 'object' ? new Set(pb.faults.except) : new Set<string>();
    for (const v of skip ? def.variants.filter((x) => !skip.has(x.id)) : [])
      variants.push({
        id: placed.filter((x) => x.def === def || x.def.title === def.title).length > 1 ? `${pb.id}:${v.id}` : v.id,
        family: v.family,
        tier: v.tier,
        weight: v.weight,
        apply: (b, rng) => v.apply(b, rng, refOf, netOf),
      });
  }
  // The device's own descriptions win over block defaults (but keep the block's power flag).
  for (const [n, info] of Object.entries(spec.nets ?? {})) nets[n] = { ...nets[n], ...info };
  variants.push(...(spec.variants ?? []));

  return {
    ...rest,
    components,
    blocks: outline,
    testPoints,
    rails,
    nets,
    variants,
    missable,
    carbonise,
    blockRefs,
  };
}
