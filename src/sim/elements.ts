import type { Element } from './solver';

/** Thermal voltage at ~27 °C. */
export const VT = 0.025852;

export const sig = (x: number): number => (x >= 0 ? 1 / (1 + Math.exp(-x)) : Math.exp(x) / (1 + Math.exp(x)));

/** Smooth max(0, x) with sharpness k (units 1/x). */
export const softplus = (x: number, k: number): number => {
  const z = k * x;
  return z > 30 ? x : Math.log1p(Math.exp(z)) / k;
};
/** Smooth min(a, b). */
export const smin = (a: number, b: number, k: number): number => a - softplus(a - b, k);
/** Smooth max(a, b). */
export const smax = (a: number, b: number, k: number): number => a + softplus(b - a, k);

export function resistor(a: number, b: number, r: number, owner?: string): Element {
  const g = 1 / r;
  return {
    nodes: [a, b],
    owner,
    eval(v) {
      const i = (v[0] - v[1]) * g;
      return [i, -i];
    },
  };
}

export interface DiodeParams {
  /** Saturation current (A). */
  is: number;
  /** Emission coefficient (multiply by series junction count for stacks). */
  n: number;
  /** Series resistance used above the critical current (Ω). */
  rs: number;
  /** Reverse breakdown voltage (V), or undefined for none. */
  bv?: number;
  /** Emission coefficient of the breakdown knee. */
  nbv?: number;
}

/** Build saturation current from a known operating point (vf at if). */
export function isFromVf(vf: number, iF: number, n: number): number {
  return iF / Math.exp(vf / (n * VT));
}

export function diode(anode: number, cathode: number, p: DiodeParams, owner?: string): Element {
  const nvt = p.n * VT;
  const icrit = 2; // above this the junction is linearised through rs
  const vcrit = nvt * Math.log(icrit / p.is + 1);
  const nbvt = (p.nbv ?? 1) * VT;
  const vbcrit = nbvt * Math.log(icrit / 1e-3);
  const fwd = (vd: number): number =>
    vd < vcrit ? p.is * (Math.exp(vd / nvt) - 1) : icrit + (vd - vcrit) / p.rs;
  const rev = (vr: number): number => {
    // vr = reverse voltage beyond breakdown; current 1 mA at vr = 0
    if (p.bv === undefined) return 0;
    return vr < vbcrit ? 1e-3 * Math.exp(vr / nbvt) : icrit + (vr - vbcrit) / p.rs;
  };
  return {
    nodes: [anode, cathode],
    owner,
    eval(v) {
      const vd = v[0] - v[1];
      let i = fwd(vd);
      if (p.bv !== undefined) i -= rev(-vd - p.bv) - 1e-3 * Math.exp((-p.bv - 0) / nbvt);
      return [i, -i];
    },
  };
}

export interface MosParams {
  vth: number;
  ron: number;
  roff: number;
}

/** N-channel MOSFET as a gate-controlled resistor (body diode added separately). */
export function nmos(d: number, g: number, s: number, p: MosParams, owner?: string): Element {
  return {
    nodes: [d, g, s],
    owner,
    eval(v) {
      const vgs = v[1] - v[2];
      // Squared sigmoid: smooth turn-on, but essentially zero leakage when off.
      const on = sig((vgs - p.vth) / 0.1);
      const gch = 1 / p.roff + (on * on) / p.ron;
      const i = (v[0] - v[2]) * gch;
      return [i, 0, -i];
    },
  };
}

/** P-channel MOSFET as a gate-controlled resistor (body diode added separately). */
export function pmos(d: number, g: number, s: number, p: MosParams, owner?: string): Element {
  return {
    nodes: [d, g, s],
    owner,
    eval(v) {
      const vsg = v[2] - v[1];
      const on = sig((vsg - p.vth) / 0.1);
      const gch = 1 / p.roff + (on * on) / p.ron;
      const i = (v[0] - v[2]) * gch;
      return [i, 0, -i];
    },
  };
}

/**
 * Voltage source with internal resistance and a current limit (CV/CC behaviour).
 * Cannot sink meaningful current, like a bench supply or wall adapter.
 */
export function limitedSource(pos: number, neg: number, vset: number, ilim: number, rint: number, owner?: string): Element {
  const k = 4000 / Math.max(ilim, 1e-3);
  return {
    nodes: [pos, neg],
    owner,
    eval(v, s) {
      const ilin = (vset * s - (v[0] - v[1])) / rint;
      let i = smin(ilin, ilim, k);
      i = smax(i, -1e-4, k);
      // current flows out of pos into the circuit
      return [-i, i];
    },
  };
}

/** Plain Thevenin source (used for meter test currents). */
export function theveninSource(pos: number, neg: number, voc: number, rs: number, owner?: string): Element {
  return {
    nodes: [pos, neg],
    owner,
    eval(v, s) {
      const i = (voc * s - (v[0] - v[1])) / rs;
      return [-i, i];
    },
  };
}

export interface BuckParams {
  vref: number;
  ilim: number;
  eff: number;
  /** Lumped conduction loss resistance (Ω). */
  rloss: number;
  iq: number;
  uvlo: number;
}

/**
 * Behavioral synchronous buck controller: regulates FB to vref by sourcing current
 * into SW, drawing power-balanced current from IN. Nodes: IN, GND, EN, SW, FB.
 */
export function buck(inN: number, gnd: number, en: number, sw: number, fb: number, p: BuckParams, owner?: string): Element {
  return {
    nodes: [inN, gnd, en, sw, fb],
    owner,
    eval(v) {
      const vin = v[0] - v[1];
      const ven = v[2] - v[1];
      const vsw = v[3] - v[1];
      const vfb = v[4] - v[1];
      const enable = sig((ven - 1.2) / 0.04) * sig((vin - p.uvlo) / 0.15);
      const headroom = sig((vin - 0.35 - vsw) / 0.04);
      const ctrl = sig(500 * (p.vref - vfb));
      // Foldback: with the output dragged far below regulation the limit drops (hiccup-style protection).
      const foldback = 0.3 + 0.7 * sig((vfb - 0.4) / 0.05);
      const iout = p.ilim * foldback * ctrl * enable * headroom;
      const vinS = Math.max(vin, 0.5);
      const iin = (Math.max(vsw, 0) * iout) / (p.eff * vinS) + (iout * iout * p.rloss) / vinS + p.iq * enable;
      return [iin, iout - iin, 0, -iout, 0];
    },
  };
}

export interface LdoParams {
  vout: number;
  dropout: number;
  ilim: number;
  iq: number;
}

/** Behavioral LDO. Nodes: IN, OUT, GND. */
export function ldo(inN: number, out: number, gnd: number, p: LdoParams, owner?: string): Element {
  return {
    nodes: [inN, out, gnd],
    owner,
    eval(v) {
      const vin = v[0] - v[2];
      const vo = v[1] - v[2];
      const enable = sig((vin - 1.6) / 0.08);
      const target = smin(p.vout, vin - p.dropout, 60);
      const i = p.ilim * sig(300 * (target - vo)) * enable;
      const iq = p.iq * enable;
      return [i + iq, -i, -iq];
    },
  };
}

export interface ChargerParams {
  /** Charge current (A). */
  ichg: number;
  /** Float voltage (V). */
  vfloat: number;
  eff: number;
  iq: number;
}

/**
 * Single-cell Li-ion charger (CC/CV). Nodes: VBUS, BAT, GND, STAT.
 * Needs a battery present (> 2.2 V) to charge; STAT sinks current while charging.
 */
export function charger(vbusN: number, bat: number, gnd: number, stat: number, p: ChargerParams, owner?: string): Element {
  return {
    nodes: [vbusN, bat, gnd, stat],
    owner,
    eval(v) {
      const vbus = v[0] - v[2];
      const vbat = v[1] - v[2];
      const vstat = v[3] - v[2];
      const inOk = sig((vbus - 4.4) / 0.05);
      const room = sig((p.vfloat - vbat) / 0.015);
      const present = sig((vbat - 2.2) / 0.05);
      const i = p.ichg * inOk * room * present;
      const iin = (i * Math.max(vbat, 0.5)) / (p.eff * Math.max(vbus, 1)) + p.iq * inOk;
      // Open-drain status: sinks only while really charging (squared sigmoid = no leakage when idle).
      const chg = sig((i - 0.05) / 0.005);
      const istat = (vstat / 40) * chg * chg;
      return [iin, -i, i - iin - istat, istat];
    },
  };
}

/**
 * HDMI retimer. Nodes: VCC, GND, EN, IN, then the output lines.
 * When powered, enabled and fed video, each output sinks ~10 mA from the TV's termination.
 */
export function retimer(vcc: number, gnd: number, en: number, inN: number, outs: number[], owner?: string): Element {
  return {
    nodes: [vcc, gnd, en, inN, ...outs],
    owner,
    eval(v) {
      const supply = v[0] - v[1];
      const act = sig((supply - 2.8) / 0.05) * sig((v[2] - v[1] - 1.2) / 0.05) * sig((v[3] - v[1] - 1.5) / 0.05);
      const g = act / 300 + 1e-9;
      const iq = 0.03 * sig((supply - 2.8) / 0.05) * sig((v[2] - v[1] - 1.2) / 0.05);
      const res = [iq, 0, 0, 0];
      let sink = 0;
      for (let k = 0; k < outs.length; k++) {
        const i = (v[4 + k] - v[1]) * g;
        res.push(i);
        sink += i;
      }
      res[1] = -(iq + sink);
      return res;
    },
  };
}

/**
 * Generic logic chip: powered from VCC (above vmin), each channel drives its outputs high
 * (through ~200 Ω, from VCC) while its inputs are in the required state.
 */
export function logic(vcc: number, gnd: number, chans: { high: number[]; low: number[]; outs: number[] }[], vmin: number, iq: number, owner?: string): Element {
  const nodes = [vcc, gnd];
  const idx = (n: number) => {
    nodes.push(n);
    return nodes.length - 1;
  };
  const chs = chans.map((c) => ({ high: c.high.map(idx), low: c.low.map(idx), outs: c.outs.map(idx) }));
  return {
    nodes,
    owner,
    eval(v) {
      const res = new Array(nodes.length).fill(0);
      const supply = v[0] - v[1];
      const pw = sig((supply - vmin) / 0.05);
      const half = 0.5 * Math.max(supply, 0.6);
      let src = iq * pw;
      for (const c of chs) {
        let act = pw;
        for (const k of c.high) act *= sig((v[k] - v[1] - half) / 0.05);
        for (const k of c.low) act *= sig((half - (v[k] - v[1])) / 0.05);
        const target = v[1] + supply * act;
        const g = pw / 200 + 1e-9;
        for (const k of c.outs) {
          const i = (v[k] - target) * g;
          res[k] += i;
          if (i < 0) src -= i;
        }
      }
      res[0] += src;
      // Conservation: everything that flows in leaves through GND.
      res[1] = -res.reduce((a, x, k) => (k === 1 ? a : a + x), 0);
      return res;
    },
  };
}

/** Single-channel level shifter. Nodes: VA, VB, GND, EN, A (input), B (output, powered from VB). */
export function shifter(va: number, vb: number, gnd: number, en: number, a: number, bOut: number, owner?: string): Element {
  return {
    nodes: [va, vb, gnd, en, a, bOut],
    owner,
    eval(v) {
      const sa = v[0] - v[2];
      const sb = v[1] - v[2];
      const act = sig((sa - 1.4) / 0.05) * sig((sb - 1.4) / 0.05) * sig((v[3] - v[2] - 1) / 0.05);
      const high = sig((v[4] - v[2] - 0.5 * Math.max(sa, 0.1)) / 0.05);
      const target = v[2] + sb * high;
      const g = act / 200 + 1e-9;
      const ib = (v[5] - target) * g;
      const ivb = 2e-4 * act + Math.max(0, -ib);
      return [1e-5 * act, ivb, -(1e-5 * act + ivb + ib), 0, 0, ib];
    },
  };
}

/** Class-D bridge amp playing a test tone (DC model). Nodes: VDD, GND, EN, OUTP, OUTN. */
export function amp(vdd: number, gnd: number, en: number, outp: number, outn: number, owner?: string): Element {
  return {
    nodes: [vdd, gnd, en, outp, outn],
    owner,
    eval(v) {
      const supply = v[0] - v[1];
      const act = sig((supply - 2.6) / 0.05) * sig((v[2] - v[1] - 1.2) / 0.05);
      const mid = supply / 2;
      const g = act / 0.5 + 1e-7;
      const ip = (v[3] - (v[1] + mid + 0.3 * act)) * g;
      const iN = (v[4] - (v[1] + mid - 0.3 * act)) * g;
      // Outputs are powered from VDD: whatever they source comes from the supply pin.
      const ivdd = 0.004 * act + Math.max(0, -ip) + Math.max(0, -iN);
      return [ivdd, -(ivdd + ip + iN), 0, ip, iN];
    },
  };
}

export interface BoostParams {
  vref: number;
  ilim: number;
  ovp: number;
  eff: number;
  iq: number;
}

/**
 * Behavioral LED boost controller. Nodes: VIN, GND, EN, SW, FB, OUT.
 * Pulls power-balanced current from SW (the inductor) and delivers it to OUT,
 * regulating FB to vref, with output over-voltage protection.
 */
export function boost(vin: number, gnd: number, en: number, sw: number, fb: number, out: number, p: BoostParams, owner?: string): Element {
  return {
    nodes: [vin, gnd, en, sw, fb, out],
    owner,
    eval(v) {
      const vi = v[0] - v[1];
      const vsw = v[3] - v[1];
      const vout = v[5] - v[1];
      const act = sig((vi - 7) / 0.2) * sig((v[2] - v[1] - 1.2) / 0.05);
      const ovp = sig((p.ovp - vout) / 0.3);
      const ctrl = sig(500 * (p.vref - (v[4] - v[1])));
      const i = p.ilim * act * ovp * ctrl * sig((vsw - 1) / 0.2);
      const isw = (Math.max(vout, 0) * i) / (p.eff * Math.max(vsw, 1));
      const iq = p.iq * act;
      return [iq, -(iq + isw - i), 0, isw, 0, -i];
    },
  };
}

/**
 * The TV end of an HDMI cable: asserts hot-plug detect (5 V through 1 kΩ) once it
 * sees the source's +5 V line. Nodes: P5V, HPD, GND.
 */
export function hpdSink(p5v: number, hpd: number, gnd: number, owner?: string): Element {
  return {
    nodes: [p5v, hpd, gnd],
    owner,
    eval(v) {
      const seen = sig((v[0] - v[2] - 4) / 0.1);
      const load = 0.001 * seen;
      const i = (seen * (5 - (v[1] - v[2]))) / 1000;
      return [load, -i, i - load];
    },
  };
}
