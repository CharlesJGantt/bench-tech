import type { ComponentDef, DeviceDef } from './board';
import * as E from './elements';
import { part, pinsOf, type Kind, type PartSpec } from './parts';
import { elementPower, solveDC, type Element } from './solver';
import { corrosionLeakR, corrosionSeriesR, crustAt, type Corrosion } from './corrosion';

// ---------------------------------------------------------------------------
// Board state
// ---------------------------------------------------------------------------

export type CompFault =
  | { type: 'open' }
  | { type: 'short'; r: number }
  /** IC alive but produces no output. */
  | { type: 'dead' }
  /** LDO pass element failed short IN→OUT. */
  | { type: 'blown' }
  /** Connector: these pins no longer make contact with the plug / module (bent, broken, corroded). */
  | { type: 'pins-open'; pins: string[] }
  /** Battery worn out: low voltage, high internal resistance. */
  | { type: 'worn' }
  /** Plastic body melted by too much heat. */
  | { type: 'melted' }
  /** Capacitor dried out: capacitance and DC readings look fine, but its ESR is high (Ω). */
  | { type: 'esr'; esr: number }
  /** Big chip: one supply rail shorted to ground inside the package (Ω). */
  | { type: 'rail-short'; pin: string; r: number };

export interface Joint {
  /** Extra series resistance (Ω). 0 = good, Infinity = open. */
  r: number;
  /** Visibly cracked (seen under magnification). */
  cracked?: boolean;
  /** Cold / grainy joint from poor technique: conducts now, fails later. */
  cold?: boolean;
}

export type Mark =
  | 'residue' // manufacturing flux residue (harmless)
  | 'rework-residue' // sticky flux from a previous repair
  | 'crooked'
  | 'discolored'
  | 'scratch'
  | 'scorch'
  | 'bulged'
  | 'loose'
  | 'bent-pin'
  | 'corrosion'
  | 'cracked-screen'
  | 'swollen';

export interface CompState {
  ref: string;
  def: ComponentDef;
  /** The part physically installed, or null if removed. */
  part: PartSpec | null;
  /** Installed backwards (2-terminal parts). */
  reversed: boolean;
  fault: CompFault | null;
  joints: Record<string, Joint>;
  burnt: boolean;
  marks: Mark[];
  /** Installed by the player this job. */
  replaced: boolean;
  /** Plug-in module (battery, screen...) disconnected from its connector. */
  unplugged?: boolean;
  /** Liquid-damage crust on the pads (see corrosion.ts). */
  corr?: Corrosion;
}

export interface PointRef {
  ref: string;
  pin: string;
}

export interface Jumper {
  id: number;
  a: PointRef;
  b: PointRef;
  cold: boolean;
  /** An accidental solder bridge rather than a deliberate wire. */
  bridge?: boolean;
  /**
   * A bridge you cannot see with the naked eye: a thin `whisker` between fine pins (needs
   * magnification or a ring light) or a solder `ball` under a chip (needs the tilt view).
   */
  hidden?: 'whisker' | 'ball';
}

export interface McuState {
  running: boolean;
  /** Firmware variables. */
  state: Record<string, number>;
  /** Input levels seen on the previous step (edge detection). */
  prev: Record<string, boolean>;
  /** Pin drive: true = high, false = low, absent = high-impedance. */
  outputs: Record<string, boolean>;
}

export interface BoardState {
  device: DeviceDef;
  comps: Record<string, CompState>;
  traces: Record<string, { broken: boolean }>;
  /** "REF.PIN" pads that have been torn off the board. */
  liftedPads: string[];
  jumpers: Jumper[];
  mcu: McuState;
  /** Buttons currently held down (component refs). */
  pressed: string[];
  /** External equipment hooked up to the device (e.g. a TV on the HDMI port). */
  attached: string[];
  nextJumperId: number;
  /**
   * Damage to the PCB itself (carbonised fibreglass between two nets). It is not a part,
   * so no amount of part swapping fixes it — the board is scrap.
   */
  pcbDamage: { a: string; b: string; r: number; near: string }[];
}

export function createBoard(device: DeviceDef): BoardState {
  const comps: Record<string, CompState> = {};
  for (const def of device.components) {
    const p = part(def.partNo);
    const joints: Record<string, Joint> = {};
    for (const pin of pinsOf(p)) joints[pin] = { r: 0 };
    comps[def.ref] = { ref: def.ref, def, part: p, reversed: false, fault: null, joints, burnt: false, marks: [], replaced: false };
  }
  const traces: BoardState['traces'] = {};
  for (const t of device.traces) traces[t.id] = { broken: false };
  return {
    device,
    comps,
    traces,
    liftedPads: [],
    jumpers: [],
    mcu: { running: false, state: {}, prev: {}, outputs: {} },
    pressed: [],
    attached: [],
    nextJumperId: 1,
    pcbDamage: [],
  };
}

/** Deep-copy a board's state. The device definition (which holds functions) is shared, not copied. */
export function cloneBoard(b: BoardState): BoardState {
  const { device, ...rest } = b;
  return { ...structuredClone(rest), device };
}

/** Footprint pad names for a component (from its designed part, not what is installed). */
export function padNames(c: CompState): string[] {
  return pinsOf(part(c.def.partNo));
}

/** Does anything on the board supply power by itself (a plugged-in battery)? */
export function hasInternalPower(b: BoardState): boolean {
  return Object.values(b.comps).some((c) => c.part?.kind === 'battery' && !c.unplugged && c.fault?.type !== 'open');
}

// ---------------------------------------------------------------------------
// Power / instrument configuration
// ---------------------------------------------------------------------------

export type PowerConfig =
  | { kind: 'off' }
  /** The device's own charger / adapter, plugged into its power input. */
  | { kind: 'adapter' }
  /** Bench PSU through a lead into the power input. */
  | { kind: 'psu-jack'; v: number; ilim: number }
  /** Bench PSU via clip leads onto any two points (voltage injection). */
  | { kind: 'psu-clips'; v: number; ilim: number; red: PointRef; black: PointRef };

export type MeterMode = 'dcv' | 'ohm' | 'continuity' | 'diode' | 'esr';

const SRC = '__SRC';
const METER = '__METER';

// ---------------------------------------------------------------------------
// Netlist compilation
// ---------------------------------------------------------------------------

interface Compiled {
  nodeCount: number;
  elements: Element[];
  pointNode(p: PointRef): number;
  netNode(net: string): number;
  /** Elements by owning component, first element is the "main" one. */
  byOwner: Map<string, Element[]>;
  sourcePlugged: boolean;
}

const ESD: E.DiodeParams = { is: 1e-14, n: 1, rs: 5 };
const BODY: E.DiodeParams = { is: 1e-12, n: 1.1, rs: 0.1 };

const DIODES: Record<string, E.DiodeParams> = {
  'D-TVS15': { is: E.isFromVf(0.72, 0.1, 1.6), n: 1.6, rs: 0.08, bv: 16.7, nbv: 2 },
  'D-Z10': { is: E.isFromVf(0.7, 0.01, 1.5), n: 1.5, rs: 1, bv: 10, nbv: 1.5 },
  'D-SS14': { is: E.isFromVf(0.45, 1, 1.3), n: 1.3, rs: 0.05 },
  'LED-GRN': { is: E.isFromVf(2.1, 3e-3, 2.5), n: 2.5, rs: 5 },
  'LED-BLU': { is: E.isFromVf(2.8, 4e-3, 2.5), n: 2.5, rs: 8 },
  'LED-COB3': { is: E.isFromVf(8.7, 0.1, 6), n: 6, rs: 2 },
  'LED-WHT': { is: E.isFromVf(2.9, 5e-3, 2.5), n: 2.5, rs: 8 },
  'LED-RED': { is: E.isFromVf(1.9, 3e-3, 2.3), n: 2.3, rs: 5 },
  'D-TVS24': { is: E.isFromVf(0.72, 0.1, 1.6), n: 1.6, rs: 0.08, bv: 26.7, nbv: 2 },
  'D-TVS5': { is: E.isFromVf(0.7, 0.05, 1.5), n: 1.5, rs: 0.1, bv: 6.4, nbv: 1.5 },
  'D-ESD5': { is: E.isFromVf(0.6, 1e-3, 1.4), n: 1.4, rs: 2, bv: 6.8, nbv: 1.5 },
  'D-SS36': { is: E.isFromVf(0.5, 1, 1.3), n: 1.3, rs: 0.03 },
  // module internals
  'M-SCREEN-B': { is: E.isFromVf(2.9, 0.02, 2.5), n: 2.5, rs: 6 },
  'M-LEDBAR': { is: E.isFromVf(30, 0.1, 20), n: 20, rs: 6 },
};

const MOS: Record<string, E.MosParams> = {
  'Q-PFET': { vth: 1.8, ron: 0.04, roff: 1e9 },
  'Q-NFET': { vth: 1.5, ron: 0.05, roff: 1e9 },
  'Q-NPWR': { vth: 2.5, ron: 0.012, roff: 1e9 },
  'Q-PPWR': { vth: 2, ron: 0.02, roff: 1e9 },
};

export function compile(b: BoardState, power: PowerConfig, meter?: { red: PointRef; black: PointRef; voc: number; rs: number }): Compiled {
  let count = 1;
  const nets = new Map<string, number>([['GND', 0]]);
  const elements: Element[] = [];
  const byOwner = new Map<string, Element[]>();
  const add = (el: Element) => {
    elements.push(el);
    if (el.owner) {
      const list = byOwner.get(el.owner) ?? [];
      list.push(el);
      byOwner.set(el.owner, list);
    }
  };
  const netNode = (net: string): number => {
    let n = nets.get(net);
    if (n === undefined) {
      n = count++;
      nets.set(net, n);
    }
    return n;
  };

  // Pad nodes: a lifted pad is isolated from its net.
  const lifted = new Set(b.liftedPads);
  const padNode = new Map<string, number>();
  const getPad = (c: CompState, pin: string): number => {
    const key = `${c.ref}.${pin}`;
    let n = padNode.get(key);
    if (n === undefined) {
      n = lifted.has(key) ? count++ : netNode(c.def.pins[pin]);
      padNode.set(key, n);
    }
    return n;
  };
  // Lead nodes: a bad joint inserts resistance between lead and pad.
  const leadNode = new Map<string, number>();
  const getLead = (c: CompState, pin: string): number => {
    const key = `${c.ref}.${pin}`;
    let n = leadNode.get(key);
    if (n !== undefined) return n;
    const pad = getPad(c, pin);
    const j = c.joints[pin];
    // Crust on the pad adds to the joint's resistance (eaten through = open).
    const r = (j?.r ?? 0) + corrosionSeriesR(crustAt(c, pin));
    if (!c.part || r === 0) n = pad;
    else {
      n = count++;
      if (Number.isFinite(r)) add(E.resistor(n, pad, r));
    }
    leadNode.set(key, n);
    return n;
  };
  // Mating contacts: the plug / module side of a connector pin.
  const mateNode = new Map<string, number>();
  const getMate = (ref: string, pin: string): number => {
    const key = `${ref}.${pin}`;
    let n = mateNode.get(key);
    if (n !== undefined) return n;
    n = count++;
    const conn = b.comps[ref];
    const f = conn?.fault;
    const broken = !conn?.part || f?.type === 'open' || f?.type === 'melted' || (f?.type === 'pins-open' && f.pins.includes(pin));
    if (!broken) add(E.resistor(n, getLead(conn, pin), 0.02));
    mateNode.set(key, n);
    return n;
  };
  // A module's pins map onto its connector's pins by position.
  const modulePin = (c: CompState, pin: string): number => {
    const conn = b.comps[c.def.mates!];
    const connPins = pinsOf(part(conn.def.partNo));
    return getMate(conn.ref, connPins[padNames(c).indexOf(pin)] ?? pin);
  };
  const pointNode = (p: PointRef): number => {
    const c = b.comps[p.ref];
    if (!c) throw new Error(`Unknown ref ${p.ref}`);
    // A module's contacts are the connector's mating contacts (when plugged in).
    if (c.def.mates) return c.part && !c.unplugged ? modulePin(c, p.pin) : getPad(c, p.pin);
    return c.part ? getLead(c, p.pin) : getPad(c, p.pin);
  };

  // Corrosion leaks current between neighbouring crusted pins of a part.
  for (const c of Object.values(b.comps)) {
    if (!c.corr) continue;
    const names = padNames(c);
    for (let i = 0; i + 1 < names.length; i++) {
      const leak = corrosionLeakR(crustAt(c, names[i]), crustAt(c, names[i + 1]));
      if (leak && c.def.pins[names[i]] !== c.def.pins[names[i + 1]]) add(E.resistor(getPad(c, names[i]), getPad(c, names[i + 1]), leak));
    }
  }

  for (const t of b.device.traces) {
    netNode(t.a);
    netNode(t.b);
    if (!b.traces[t.id].broken) add(E.resistor(netNode(t.a), netNode(t.b), 0.005));
  }

  for (const c of Object.values(b.comps)) {
    if (!c.part) {
      for (const pin of padNames(c)) getPad(c, pin);
      continue;
    }
    if (c.def.mates) {
      if (!c.unplugged) buildComponent(b, c, (pin) => modulePin(c, pin), add);
      else for (const pin of padNames(c)) getPad(c, pin);
      continue;
    }
    buildComponent(b, c, (pin) => getLead(c, pin), add);
  }

  for (const j of b.jumpers) add(E.resistor(pointNode(j.a), pointNode(j.b), j.cold ? 3 : 0.02, `jumper${j.id}`));
  for (const d of b.pcbDamage ?? []) add(E.resistor(netNode(d.a), netNode(d.b), d.r, `pcb-${d.near}`));

  // External equipment (e.g. a TV on the HDMI port)
  for (const id of b.attached) {
    const ext = b.device.externals?.find((x) => x.id === id);
    ext?.attach({ mate: getMate, node: () => count++, add, gnd: 0 });
  }

  // Power source
  let sourcePlugged = false;
  if (power.kind === 'adapter' || power.kind === 'psu-jack') {
    const inp = b.device.input;
    const jack = b.comps[inp.ref];
    if (jack?.part) {
      sourcePlugged = true;
      const plus = getMate(inp.ref, inp.plus);
      const minus = getMate(inp.ref, inp.minus);
      if (power.kind === 'adapter') add(E.limitedSource(plus, minus, inp.adapter.v, inp.adapter.ilim, inp.adapter.rint, SRC));
      else add(E.limitedSource(plus, minus, power.v, power.ilim, 0.005, SRC));
    }
  } else if (power.kind === 'psu-clips') {
    sourcePlugged = true;
    add(E.limitedSource(pointNode(power.red), pointNode(power.black), power.v, power.ilim, 0.005, SRC));
  }

  if (meter) add(E.theveninSource(pointNode(meter.red), pointNode(meter.black), meter.voc, meter.rs, METER));

  return { nodeCount: count, elements, pointNode, netNode, byOwner, sourcePlugged: sourcePlugged || hasInternalPower(b) };
}

function buildComponent(b: BoardState, c: CompState, lead: (pin: string) => number, add: (el: Element) => void): void {
  const p = c.part!;
  const pads = padNames(c);
  const ref = c.ref;
  const f = c.fault;
  // Map installed part pins onto footprint pads by index (reversed swaps 2-terminal parts).
  const pins = pinsOf(p);
  const pinNode = (name: string): number => {
    let idx = pins.indexOf(name);
    if (c.reversed && pins.length === 2) idx = 1 - idx;
    return lead(pads[idx]);
  };
  const two = (): [number, number] => [pinNode(pins[0]), pinNode(pins[1])];

  if (f?.type === 'open' || f?.type === 'melted') {
    // Open components conduct nothing — except MOSFET body diodes.
    if (p.kind === 'nmos') add(E.diode(pinNode('S'), pinNode('D'), BODY, ref));
    if (p.kind === 'pmos') add(E.diode(pinNode('D'), pinNode('S'), BODY, ref));
    return;
  }

  const kind: Kind = p.kind;
  switch (kind) {
    case 'resistor': {
      const [a, z] = two();
      add(E.resistor(a, z, f?.type === 'short' ? f.r : p.value, ref));
      return;
    }
    case 'capacitor': {
      if (f?.type === 'short') add(E.resistor(...two(), f.r, ref));
      return;
    }
    case 'electrolytic': {
      if (f?.type === 'short') add(E.resistor(...two(), f.r, ref));
      // A reversed electrolytic conducts heavily and heats up.
      else if (c.reversed) add(E.resistor(...two(), 40, ref));
      return;
    }
    case 'fuse': {
      add(E.resistor(...two(), p.value >= 5 ? 0.01 : 0.05, ref));
      return;
    }
    case 'inductor': {
      add(E.resistor(...two(), f?.type === 'short' ? f.r : 0.03, ref));
      return;
    }
    case 'diode':
    case 'tvs':
    case 'zener':
    case 'led':
    case 'cob': {
      if (f?.type === 'short') add(E.resistor(...two(), f.r, ref));
      else add(E.diode(pinNode('A'), pinNode('K'), DIODES[p.partNo], ref));
      return;
    }
    case 'nmos':
    case 'pmos': {
      if (f?.type === 'short') {
        add(E.resistor(pinNode('D'), pinNode('S'), f.r, ref));
        add(E.resistor(pinNode('G'), pinNode('S'), 8, ref));
        add(E.resistor(pinNode('G'), pinNode('D'), 8, ref));
        return;
      }
      const params = MOS[p.partNo];
      if (f?.type === 'dead') {
        // Gate oxide gone: the channel never turns on, only the body diode is left.
        if (kind === 'nmos') add(E.diode(pinNode('S'), pinNode('D'), BODY, ref));
        else add(E.diode(pinNode('D'), pinNode('S'), BODY, ref));
        add(E.resistor(pinNode('G'), pinNode('S'), 50e3, ref));
        return;
      }
      if (kind === 'nmos') {
        add(E.nmos(pinNode('D'), pinNode('G'), pinNode('S'), params, ref));
        add(E.diode(pinNode('S'), pinNode('D'), BODY, ref));
      } else {
        add(E.pmos(pinNode('D'), pinNode('G'), pinNode('S'), params, ref));
        add(E.diode(pinNode('D'), pinNode('S'), BODY, ref));
      }
      return;
    }
    case 'buck': {
      const [inN, gnd, en, sw, fb, bst] = ['IN', 'GND', 'EN', 'SW', 'FB', 'BST'].map(pinNode);
      if (f?.type === 'short') {
        add(E.resistor(inN, gnd, f.r, ref));
      } else if (f?.type !== 'dead') {
        add(E.buck(inN, gnd, en, sw, fb, { vref: 0.8 * esrSag(b, buckOutNet(b, c), 0.55), ilim: 2, eff: 0.9, rloss: 0.25, iq: 1.5e-3, uvlo: 4.3 }, ref));
      }
      add(E.resistor(inN, gnd, 300e3, ref));
      add(E.diode(gnd, sw, BODY, ref)); // low-side body diode
      add(E.diode(sw, inN, BODY, ref)); // high-side body diode
      for (const n of [en, fb, bst]) add(E.diode(gnd, n, ESD, ref));
      return;
    }
    case 'ldo': {
      const [inN, out, gnd, tab] = ['IN', 'OUT', 'GND', 'TAB'].map(pinNode);
      add(E.resistor(out, tab, 0.002, ref));
      if (f?.type === 'blown') add(E.resistor(inN, out, 0.4, ref));
      else if (f?.type !== 'dead') add(E.ldo(inN, out, gnd, { vout: 3.3 * esrSag(b, c.def.pins.OUT, 0.72), dropout: 0.3, ilim: 0.4, iq: 60e-6 }, ref));
      if (f?.type === 'short') add(E.resistor(out, gnd, f.r, ref));
      add(E.resistor(out, gnd, 120e3, ref));
      add(E.resistor(inN, gnd, 1e6, ref));
      add(E.diode(out, inN, BODY, ref));
      add(E.diode(gnd, inN, ESD, ref));
      return;
    }
    case 'mcu': {
      const vdd = pinNode('VDD');
      const gnd = pinNode('GND');
      if (f?.type === 'dead' || f?.type === 'short') {
        add(E.resistor(vdd, gnd, f.type === 'short' ? f.r : 3, ref));
        return;
      }
      // Only the device's firmware controller runs code; it draws more current while running.
      const running = b.device.firmware?.ref === ref && b.mcu.running;
      add(E.resistor(vdd, gnd, running ? 275 : 200e3, ref));
      add(E.diode(gnd, vdd, ESD, ref));
      // Extra supply rails: a load per rail (heavy while running), and a possible internal short.
      const railPins = new Set((p.rails ?? []).map((r) => r.pin));
      for (const r of p.rails ?? []) {
        const n = pinNode(r.pin);
        const amps = running ? r.amps : (r.standbyAmps ?? r.amps * 0.002);
        add(E.resistor(n, gnd, r.nominal / Math.max(amps, 1e-6), ref));
        add(E.diode(gnd, n, ESD, ref));
        if (f?.type === 'rail-short' && f.pin === r.pin) add(E.resistor(n, gnd, f.r, ref));
      }
      for (const io of pins) {
        if (io === 'VDD' || io === 'GND' || io.startsWith('NC') || railPins.has(io)) continue;
        const n = pinNode(io);
        add(E.diode(gnd, n, ESD, ref));
        add(E.diode(n, vdd, ESD, ref));
        if (running && io in b.mcu.outputs) add(E.resistor(n, b.mcu.outputs[io] ? vdd : gnd, 25, ref));
      }
      return;
    }
    case 'charger': {
      const [vbus, gnd, bat, stat] = ['VBUS', 'GND', 'BAT', 'STAT'].map(pinNode);
      if (f?.type === 'short') add(E.resistor(vbus, gnd, f.r, ref));
      else if (f?.type !== 'dead') add(E.charger(vbus, bat, gnd, stat, { ichg: 1, vfloat: 4.2, eff: 0.9, iq: 1e-3 }, ref));
      add(E.resistor(vbus, gnd, 200e3, ref));
      add(E.diode(gnd, vbus, ESD, ref));
      add(E.diode(gnd, bat, ESD, ref));
      add(E.diode(gnd, stat, ESD, ref));
      return;
    }
    case 'retimer': {
      const vcc = pinNode('VCC');
      const gnd = pinNode('GND');
      const outs = ['D0', 'D1', 'D2', 'CK'].map(pinNode);
      if (f?.type === 'short') for (const o of outs) add(E.resistor(o, gnd, f.r, ref));
      else if (f?.type !== 'dead') add(E.retimer(vcc, gnd, pinNode('EN'), pinNode('IN'), outs, ref));
      add(E.resistor(vcc, gnd, 50e3, ref));
      add(E.diode(gnd, vcc, ESD, ref));
      for (const n of [...outs, pinNode('EN'), pinNode('IN')]) add(E.diode(gnd, n, ESD, ref));
      return;
    }
    case 'amp': {
      const [vdd, gnd, en, op, on] = ['VDD', 'GND', 'EN', 'OUTP', 'OUTN'].map(pinNode);
      if (f?.type === 'short') add(E.resistor(vdd, gnd, f.r, ref));
      else if (f?.type !== 'dead') add(E.amp(vdd, gnd, en, op, on, ref));
      add(E.resistor(vdd, gnd, 100e3, ref));
      for (const n of [vdd, en, op, on]) add(E.diode(gnd, n, ESD, ref));
      return;
    }
    case 'boost': {
      const [vin, gnd, en, fb, gate, sw, out] = ['VIN', 'GND', 'EN', 'FB', 'GATE', 'SW', 'OUT'].map(pinNode);
      if (f?.type === 'short') add(E.resistor(vin, gnd, f.r, ref));
      // The boost can only switch if its external MOSFET (gate on GATE) still works.
      else if (f?.type !== 'dead' && !boostFetFailed(b, c)) add(E.boost(vin, gnd, en, sw, fb, out, { vref: 0.2 * esrSag(b, c.def.pins.OUT, 0.6), ilim: 0.4, ovp: 45, eff: 0.88, iq: 2e-3 }, ref));
      // In the averaged DC model the gate drive sits low (the switch is "off" on average).
      add(E.resistor(gate, gnd, 10, ref));
      add(E.resistor(vin, gnd, 300e3, ref));
      for (const n of [en, fb, sw]) add(E.diode(gnd, n, ESD, ref));
      return;
    }
    case 'battery': {
      const [pos, neg] = [pinNode('+'), pinNode('-')];
      if (f?.type === 'short') add(E.resistor(pos, neg, f.r, ref));
      else if (f?.type === 'worn') add(E.theveninSource(pos, neg, 2.9, 6, ref));
      else add(E.theveninSource(pos, neg, p.value, 0.15, ref));
      return;
    }
    case 'module': {
      if (p.partNo === 'M-SPK4') add(E.resistor(...two(), f?.type === 'short' ? f.r : p.value, ref));
      else if (DIODES[p.partNo]) {
        if (f?.type === 'short') add(E.resistor(...two(), f.r, ref));
        else add(E.diode(pinNode(pins[0]), pinNode(pins[1]), DIODES[p.partNo], ref));
      }
      return;
    }
    case 'button': {
      if (b.pressed.includes(ref) || f?.type === 'short') add(E.resistor(...two(), 0.1, ref));
      return;
    }
    case 'shifter': {
      const [va, gnd, a, bo, vb, en] = ['VA', 'GND', 'A', 'B', 'VB', 'EN'].map(pinNode);
      if (f?.type === 'short') add(E.resistor(vb, gnd, f.r, ref));
      else if (f?.type !== 'dead') add(E.shifter(va, vb, gnd, en, a, bo, ref));
      add(E.resistor(a, gnd, 1e6, ref));
      for (const n of [va, vb, a, bo, en]) add(E.diode(gnd, n, ESD, ref));
      return;
    }
    case 'jack':
    case 'connector':
    case 'testpoint':
      return;
  }
}

function boostFetFailed(b: BoardState, c: CompState): boolean {
  // The switch MOSFET's drain sits on the boost's SW node.
  const sw = c.def.pins.SW;
  const fet = Object.values(b.comps).find((x) => x !== c && x.def.pins.D === sw && x.def.pins.G !== undefined);
  if (!fet) return false;
  return !fet.part || !!fet.unplugged || fet.fault?.type === 'dead' || fet.fault?.type === 'open' || fet.fault?.type === 'melted';
}

/** A net plus the nets joined to it by board traces. */
export function netGroup(b: BoardState, net: string): Set<string> {
  const nets = new Set([net]);
  for (const t of b.device.traces) if (nets.has(t.a) || nets.has(t.b)) (nets.add(t.a), nets.add(t.b));
  return nets;
}

/** Capacitors (and electrolytics) sitting directly across `net` and ground. */
export function capsOn(b: BoardState, net: string): CompState[] {
  const nets = netGroup(b, net);
  const gnd = b.device.ground ? b.comps[b.device.ground]?.def.pins['1'] ?? 'GND' : 'GND';
  return Object.values(b.comps).filter((x) => {
    const k = x.part?.kind;
    if (k !== 'capacitor' && k !== 'electrolytic') return false;
    const ns = Object.values(x.def.pins);
    return ns.some((n) => nets.has(n)) && ns.includes(gnd);
  });
}

/** A regulator goes unstable — and its output sags — when an output capacitor has dried out (high ESR). */
export function esrSag(b: BoardState, net: string | undefined, k: number): number {
  if (!net) return 1;
  return capsOn(b, net).some((x) => x.fault?.type === 'esr' && !x.unplugged) ? k : 1;
}

/** The net a buck converter regulates: the far side of the inductor on its switch node. */
export function buckOutNet(b: BoardState, c: CompState): string | undefined {
  const sw = c.def.pins.SW;
  for (const x of Object.values(b.comps)) {
    if (x.def.partNo.startsWith('L-') && Object.values(x.def.pins).includes(sw)) return Object.values(x.def.pins).find((n) => n !== sw);
  }
  return undefined;
}

/** Typical ESR (Ω) of a healthy capacitor. */
function healthyEsr(p: PartSpec): number {
  if (p.kind === 'electrolytic') return Math.min(0.5, 0.04 * Math.sqrt(1000e-6 / p.value) + 0.02);
  return 0.01;
}

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------

export interface OperatingPoint {
  converged: boolean;
  powered: boolean;
  v: Float64Array;
  /** Voltage at a probe point (V). */
  at(p: PointRef): number;
  /** Voltage on a net (V). */
  net(name: string): number;
  /** Power dissipated per component (W). */
  power: Record<string, number>;
  /** Current through the main element of a two-terminal component (A, anode/pin1 → cathode/pin2). */
  current(ref: string): number;
  srcV: number;
  srcI: number;
}

/** Last solution per board and analysis kind, used to warm-start the solver. */
const warmStarts = new WeakMap<BoardState, Map<string, Float64Array>>();

function analyse(b: BoardState, power: PowerConfig, meter?: Parameters<typeof compile>[2]): OperatingPoint {
  const cp = compile(b, power, meter);
  let warm = warmStarts.get(b);
  if (!warm) warmStarts.set(b, (warm = new Map()));
  const key = `${power.kind}|${meter ? 'meter' : ''}|${b.attached.join(',')}`;
  let init = warm.get(key);
  if (init?.length !== cp.nodeCount) init = undefined;
  const sol = solveDC(cp.nodeCount, cp.elements, { initial: init });
  if (sol.converged) warm.set(key, sol.v);
  const v = sol.v;
  const pw: Record<string, number> = {};
  for (const [owner, els] of cp.byOwner) {
    let p = 0;
    for (const el of els) p += elementPower(el, v);
    pw[owner] = p;
  }
  const src = cp.byOwner.get(SRC)?.[0];
  let srcV = 0;
  let srcI = 0;
  if (src) {
    srcV = v[src.nodes[0]] - v[src.nodes[1]];
    srcI = -src.eval([v[src.nodes[0]], v[src.nodes[1]]], 1)[0];
  }
  return {
    converged: sol.converged,
    powered: cp.sourcePlugged,
    v,
    at: (p) => v[cp.pointNode(p)],
    net: (n) => v[cp.netNode(n)],
    power: pw,
    current: (ref) => {
      const el = cp.byOwner.get(ref)?.[0];
      if (!el) return 0;
      return el.eval(el.nodes.map((n) => v[n]), 1)[0];
    },
    srcV,
    srcI,
  };
}

/**
 * Solve the board with power applied, iterating the device firmware until its outputs settle.
 * Mutates b.mcu (boot, button edges, firmware state).
 */
export function operatingPoint(b: BoardState, power: PowerConfig): OperatingPoint {
  const fw = b.device.firmware;
  const u = fw ? b.comps[fw.ref] : undefined;
  let op = analyse(b, power);
  for (let i = 0; i < 10; i++) {
    const m = b.mcu;
    let running = false;
    const inputs: Record<string, boolean> = {};
    // Only the correct, programmed controller runs the firmware.
    if (fw && u?.part && u.part.partNo === u.def.partNo && (!u.fault || u.fault.type === 'rail-short')) {
      const gnd = op.at({ ref: u.ref, pin: 'GND' });
      const vdd = op.at({ ref: u.ref, pin: 'VDD' }) - gnd;
      const lo = m.running ? fw.vmin - 0.2 : fw.vmin;
      const reset = fw.reset ? op.at({ ref: u.ref, pin: fw.reset }) - gnd > 0.6 * vdd : true;
      // Every extra rail must be above its UVLO too (a rail short drags one below it).
      const railsOk = (u.part.rails ?? []).every((r) => op.at({ ref: u.ref, pin: r.pin }) - gnd >= (m.running ? r.uvlo * 0.95 : r.uvlo));
      running = vdd >= lo && vdd <= fw.vmax && reset && railsOk;
      for (const pin of fw.inputs) inputs[pin] = op.at({ ref: u.ref, pin }) - gnd > 0.5 * vdd;
    }
    const before = JSON.stringify([m.running, m.outputs]);
    if (!running) {
      m.running = false;
      m.outputs = {};
      m.state = {};
      m.prev = {};
    } else {
      if (!m.running) {
        // Boot: fresh state, sample inputs without treating them as edges.
        m.running = true;
        m.state = fw!.boot();
        m.prev = inputs;
      }
      m.outputs = fw!.step(m.state, inputs, m.prev);
      m.prev = inputs;
    }
    if (JSON.stringify([m.running, m.outputs]) === before) break;
    op = analyse(b, power);
  }
  return op;
}

// ---------------------------------------------------------------------------
// Multimeter
// ---------------------------------------------------------------------------

export interface MeterReading {
  mode: MeterMode;
  /** Numeric value in base units (V or Ω); null when over-range. */
  value: number | null;
  display: string;
  unit: string;
  beep: boolean;
}

function fmtOhms(r: number): { display: string; unit: string } {
  if (r < 1000) return { display: r < 10 ? r.toFixed(2) : r.toFixed(1), unit: 'Ω' };
  if (r < 1e6) return { display: (r / 1000).toFixed(r < 1e4 ? 3 : r < 1e5 ? 2 : 1), unit: 'kΩ' };
  return { display: (r / 1e6).toFixed(r < 1e7 ? 3 : 2), unit: 'MΩ' };
}

export function fmtVolts(v: number): string {
  if (Math.abs(v) < 0.0005) v = 0;
  const a = Math.abs(v);
  return a < 10 ? v.toFixed(3) : a < 100 ? v.toFixed(2) : v.toFixed(1);
}

/**
 * Take a meter reading. In voltage mode `op` (the powered operating point) is used.
 * Resistance and diode modes inject the meter's own test signal — with power still
 * applied that gives nonsense readings, just like a real meter.
 */
export function measure(
  b: BoardState,
  power: PowerConfig,
  mode: MeterMode,
  red: PointRef,
  black: PointRef,
  op?: OperatingPoint,
): MeterReading {
  if (mode === 'dcv') {
    const o = op ?? operatingPoint(b, power);
    const v = o.at(red) - o.at(black);
    return { mode, value: v, display: fmtVolts(v), unit: 'V', beep: false };
  }
  if (mode === 'esr') {
    // ESR meter: a small AC test signal. Caps across the probes read as their combined ESR;
    // a dead short anywhere between the probes reads near 0.
    const na = b.comps[red.ref]?.def.pins[red.pin];
    const nb = b.comps[black.ref]?.def.pins[black.pin];
    if (!na || !nb) return { mode, value: null, display: 'OL', unit: 'Ω', beep: false };
    const ga = netGroup(b, na);
    const gb = netGroup(b, nb);
    // Tweezer probes right across one capacitor's own pads read mostly that capacitor.
    const own = red.ref === black.ref ? b.comps[red.ref] : null;
    let g = 0;
    for (const x of Object.values(b.comps)) {
      const p = x.part;
      if (!p || x.unplugged || (p.kind !== 'capacitor' && p.kind !== 'electrolytic')) continue;
      if (own?.part && (own.part.kind === 'capacitor' || own.part.kind === 'electrolytic') && x !== own) continue;
      const ns = Object.values(x.def.pins);
      if (!(ns.some((n) => ga.has(n)) && ns.some((n) => gb.has(n)))) continue;
      const f = x.fault;
      if (f?.type === 'open' || f?.type === 'melted') continue;
      const esr = f?.type === 'short' ? f.r : f?.type === 'esr' ? f.esr : healthyEsr(p);
      g += 1 / Math.max(esr, 1e-3);
    }
    const dc = measure(b, power, 'ohm', red, black);
    if (dc.value !== null && dc.value < 5) g += 1 / Math.max(dc.value, 1e-3);
    if (!g) return { mode, value: null, display: 'OL', unit: 'Ω', beep: false };
    const r = 1 / g;
    return { mode, value: r, display: r < 10 ? r.toFixed(2) : r.toFixed(1), unit: 'Ω', beep: false };
  }
  if (mode === 'diode') {
    const voc = 3.0;
    const rs = 2200;
    const o = analyse(b, power, { red, black, voc, rs });
    const v = o.at(red) - o.at(black);
    if (v > 2.0 || v < -0.05) return { mode, value: null, display: 'OL', unit: 'V', beep: false };
    return { mode, value: v, display: Math.max(v, 0).toFixed(3), unit: 'V', beep: v < 0.05 };
  }
  const voc = 0.5;
  const rs = 100e3;
  const o = analyse(b, power, { red, black, voc, rs });
  const v = o.at(red) - o.at(black);
  const i = (voc - v) / rs;
  const r = i > 0 ? v / i : -1;
  const ol = r < 0 || r > 40e6 || (mode === 'continuity' && r > 400);
  const beep = mode === 'continuity' && r >= 0 && r < 30;
  if (ol) return { mode, value: null, display: 'OL', unit: mode === 'continuity' ? 'Ω' : 'MΩ', beep: false };
  return { mode, value: Math.max(r, 0), ...fmtOhms(Math.max(r, 0)), beep };
}

// ---------------------------------------------------------------------------
// Thermal + stress (damage)
// ---------------------------------------------------------------------------

const THETA: Record<string, number> = {
  '0603': 250,
  '1206': 120,
  SMA: 90,
  SOD123: 200,
  LED0805: 250,
  SOT23: 220,
  'SOT23-6': 160,
  SOT223: 60,
  SOIC8: 120,
  CAP_EL: 80,
  IND5: 60,
  BARREL: 50,
  TACT6: 100,
  COB: 18,
  QFP16: 50,
  DPAK: 35,
  CAP_EL10: 40,
  USBC: 60,
  MUSB: 80,
  HDMI: 40,
  PWR2: 40,
  JST2: 80,
  FPC2: 100,
  BATT: 10,
  SCREEN: 20,
  SPK: 15,
  LEDBAR: 3,
  TP: 0,
};

export const AMBIENT = 25;

/** Steady-state temperature of every installed component (°C). */
export function steadyTemps(b: BoardState, op: OperatingPoint): Record<string, number> {
  const t: Record<string, number> = {};
  for (const c of Object.values(b.comps)) {
    const p = c.part ? Math.max(0, op.power[c.ref] ?? 0) : 0;
    t[c.ref] = AMBIENT + p * (THETA[c.part?.pkg ?? 'TP'] ?? 100);
  }
  return t;
}

export interface DamageEvent {
  ref: string;
  kind: 'fuse' | 'smoke' | 'pop' | 'burn' | 'vent';
  message: string;
}

const T_LIMIT: Partial<Record<Kind, number>> = {
  resistor: 280,
  capacitor: 280,
  electrolytic: 110,
  inductor: 250,
  diode: 220,
  tvs: 220,
  zener: 220,
  led: 160,
  cob: 160,
  nmos: 200,
  pmos: 200,
  buck: 190,
  ldo: 190,
  mcu: 150,
  charger: 170,
  retimer: 150,
  amp: 170,
  boost: 180,
};

/**
 * Check electrical (instant) and thermal limits, applying any resulting damage.
 * `temps` are the temperatures to judge by (steady-state or the game's lagged values).
 */
export function applyStress(b: BoardState, op: OperatingPoint, temps?: Record<string, number>): DamageEvent[] {
  const ev: DamageEvent[] = [];
  if (!op.powered) return ev;
  for (const c of Object.values(b.comps)) {
    const p = c.part;
    if (!p) continue;
    const pin = (name: string) => op.at({ ref: c.ref, pin: name });
    const pads = padNames(c);
    const across = pads.length >= 2 ? pin(pads[0]) - pin(pads[1]) : 0;

    if (p.kind === 'fuse' && !c.fault && Math.abs(op.current(c.ref)) > 2 * p.value) {
      c.fault = { type: 'open' };
      ev.push({ ref: c.ref, kind: 'fuse', message: `${c.ref} blew` });
      continue;
    }
    if ((p.kind === 'capacitor' || p.kind === 'electrolytic') && p.rating && c.fault?.type !== 'short') {
      const v = c.reversed ? -across : across;
      if (v > p.rating * 1.4) {
        c.fault = { type: 'short', r: 1.5 };
        ev.push({ ref: c.ref, kind: 'pop', message: `${c.ref} failed short (over-voltage)` });
        continue;
      }
    }
    if (p.kind === 'ldo' && !c.fault && pin('IN') - pin('GND') > (p.rating ?? 6) + 1) {
      c.fault = { type: 'blown' };
      c.marks.push('discolored');
      ev.push({ ref: c.ref, kind: 'pop', message: `${c.ref} failed (input over-voltage)` });
      continue;
    }
    if (p.kind === 'mcu' && !c.fault && pin('VDD') - pin('GND') > 4.3) {
      c.fault = { type: 'dead' };
      ev.push({ ref: c.ref, kind: 'smoke', message: `${c.ref} destroyed (supply over-voltage)` });
      continue;
    }
    if ((p.kind === 'charger' && !c.fault && pin('VBUS') - pin('GND') > 7.5) || (p.kind === 'amp' && !c.fault && pin('VDD') - pin('GND') > 6.5)) {
      c.fault = { type: 'short', r: 0.6 };
      ev.push({ ref: c.ref, kind: 'pop', message: `${c.ref} failed short (supply over-voltage)` });
      continue;
    }
    if (p.kind === 'retimer' && !c.fault && pin('VCC') - pin('GND') > 4.3) {
      c.fault = { type: 'short', r: 1.5 };
      ev.push({ ref: c.ref, kind: 'smoke', message: `${c.ref} destroyed (supply over-voltage)` });
      continue;
    }
    if ((p.kind === 'buck' || p.kind === 'boost') && !c.fault && pin(p.kind === 'buck' ? 'IN' : 'VIN') - pin('GND') > 30) {
      c.fault = { type: 'short', r: 0.4 };
      ev.push({ ref: c.ref, kind: 'pop', message: `${c.ref} failed short (input over-voltage)` });
      continue;
    }
    if ((p.kind === 'led' || p.kind === 'cob') && !c.fault) {
      const limit = p.kind === 'cob' ? 0.35 : 0.04;
      if (Math.abs(op.current(c.ref)) > limit) {
        c.fault = { type: 'open' };
        c.burnt = true;
        ev.push({ ref: c.ref, kind: 'burn', message: `${c.ref} burnt out (over-current)` });
        continue;
      }
    }

    const limit = T_LIMIT[p.kind];
    const t = temps?.[c.ref];
    // A shorted ceramic cap stays shorted however hot it gets (it just keeps cooking).
    const stuckShort = p.kind === 'capacitor' && c.fault?.type === 'short';
    if (limit !== undefined && t !== undefined && t > limit && !c.burnt && !stuckShort) {
      c.burnt = true;
      if (!c.marks.includes('scorch')) c.marks.push('scorch');
      switch (p.kind) {
        case 'resistor':
        case 'capacitor':
        case 'inductor':
        case 'led':
        case 'cob':
          c.fault = { type: 'open' };
          ev.push({ ref: c.ref, kind: 'smoke', message: `${c.ref} overheated and burnt open` });
          break;
        case 'electrolytic':
          c.fault = { type: 'short', r: 3 };
          c.marks.push('bulged');
          ev.push({ ref: c.ref, kind: 'vent', message: `${c.ref} vented` });
          break;
        case 'ldo':
          c.fault = { type: 'blown' };
          ev.push({ ref: c.ref, kind: 'smoke', message: `${c.ref} overheated and failed` });
          break;
        case 'mcu':
          c.fault = { type: 'dead' };
          ev.push({ ref: c.ref, kind: 'smoke', message: `${c.ref} overheated and died` });
          break;
        default:
          c.fault = { type: 'short', r: 0.3 };
          ev.push({ ref: c.ref, kind: 'smoke', message: `${c.ref} overheated and failed short` });
      }
    }
  }
  return ev;
}

/**
 * Apply power and let the board settle at steady state, propagating any damage
 * (e.g. a shorted TVS blowing the fuse). Used for customer history and final tests.
 */
export function powerUpSteady(b: BoardState, power: PowerConfig): { op: OperatingPoint; events: DamageEvent[] } {
  const events: DamageEvent[] = [];
  let op = operatingPoint(b, power);
  for (let i = 0; i < 8; i++) {
    const ev = applyStress(b, op, steadyTemps(b, op));
    if (!ev.length) break;
    events.push(...ev);
    op = operatingPoint(b, power);
  }
  return { op, events };
}

export function powerDown(b: BoardState): void {
  b.mcu.running = false;
  b.mcu.state = {};
  b.mcu.prev = {};
  b.mcu.outputs = {};
  b.pressed = [];
}

// ---------------------------------------------------------------------------
// Functional test (what the customer experiences)
// ---------------------------------------------------------------------------

export interface FunctionalReport {
  /** What the customer checks, in order, and whether it worked. */
  checks: { label: string; ok: boolean }[];
  /** Device-specific observations used to write complaints. */
  facts: Record<string, number | boolean>;
  inputCurrent: number;
  events: DamageEvent[];
  passed: boolean;
}

/**
 * Helper for device functional tests: power the board like the customer would,
 * press buttons, and collect any damage that happens along the way.
 */
export function customerSession(b: BoardState, power: PowerConfig = { kind: 'adapter' }) {
  powerDown(b);
  const events: DamageEvent[] = [];
  let current = power;
  const settle = () => {
    const r = powerUpSteady(b, current);
    events.push(...r.events);
    return r.op;
  };
  return {
    events,
    settle,
    setPower(p: PowerConfig) {
      current = p;
      return settle();
    },
    press(ref: string) {
      b.pressed = [ref];
      settle();
      b.pressed = [];
      return settle();
    },
    end() {
      powerDown(b);
    },
  };
}

/** Use the device the way its owner would. Mutates the board (damage can happen). */
export function functionalTest(b: BoardState): FunctionalReport {
  return b.device.functional(b);
}
