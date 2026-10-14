/**
 * Power blocks: the input stage, buck and LDO rails that most boards share.
 * Each brings its parts, test points, net descriptions and fault variants.
 */
import { addMark, liquidDamage } from '../faults';
import { part } from '../parts';
import type { BlockDef } from './core';

// ---------------------------------------------------------------------------
// Input: power header / DC jack → fuse → bulk capacitor
// ---------------------------------------------------------------------------

export interface InputOpts {
  /** Connector: an internal 2-pin power header or a barrel jack. */
  connector: 'header' | 'barrel';
  /** Nominal input voltage, for descriptions. */
  volts: number;
  fuse: string;
  bulk: string;
  /** Where the power comes from, for hints ("the internal PSU"). */
  source: string;
  /** Surge clamp after the fuse (TVS part number). */
  tvs?: string;
  /** Reverse-polarity protection: P-MOSFET with gate pull-down and gate-source zener. */
  reverse?: boolean;
}

/** Ports: `out` (fused rail). Local nets: VIN (raw input). */
export function powerInput(o: InputOpts): BlockDef {
  const header = o.connector === 'header';
  const plus = header ? '12V' : 'TIP';
  const minus = header ? 'GND' : 'SLEEVE';
  const v = `${o.volts} V`;
  // Without reverse protection the fuse feeds the rail directly (a TVS then clamps the rail).
  const fused = o.reverse ? 'VF' : 'out';
  const extra: BlockDef['parts'] = [];
  if (o.tvs) extra.push({ key: 'tvs', partNo: o.tvs, at: [22, 31], rot: 270, pins: { A: 'GND', K: fused }, role: 'Surge / over-voltage clamp' });
  if (o.reverse)
    extra.push(
      { key: 'rpFet', partNo: 'Q-PFET', at: [27, 23], pins: { D: 'VF', S: 'out', G: 'G' }, role: 'Reverse-polarity protection' },
      { key: 'rpRes', partNo: 'R-100K', at: [27, 31], rot: 90, pins: { '1': 'G', '2': 'GND' }, role: 'Protection FET gate pull-down' },
      { key: 'rpZener', partNo: 'D-Z10', at: [32, 29], rot: 270, pins: { A: 'G', K: 'out' }, role: 'Protection FET gate-source clamp' },
    );
  return {
    title: `${v} INPUT`,
    size: [30, 32],
    ports: ['out'],
    parts: [
      { key: 'conn', partNo: header ? 'J-PWR2' : 'J-BARREL', at: [7, 5], pins: { [plus]: 'VIN', [minus]: 'GND' }, role: `${v} in from ${o.source}` },
      { key: 'fuse', partNo: o.fuse, at: [19, 5], pins: { '1': 'VIN', '2': fused }, role: 'Main fuse' },
      { key: 'bulk', partNo: o.bulk, at: [24, 20], pins: { '+': 'out', '-': 'GND' }, role: `${v} bulk capacitor` },
      { key: 'tpIn', partNo: 'TP', at: [3, 20], pins: { '1': 'VIN' }, role: 'Raw input' },
      { key: 'tpOut', partNo: 'TP', at: [11, 27], pins: { '1': 'out' }, role: `${v} rail` },
      ...extra,
    ],
    nets: {
      VIN: { desc: `Raw ${v} from ${o.source}`, expected: o.volts, power: true },
      ...(fused === 'VF' ? { VF: { desc: `${v} after the fuse`, expected: o.volts, power: true } } : {}),
      ...(o.reverse ? { G: { desc: 'Reverse-protection FET gate (held low, so the FET is on)', expected: 0 } } : {}),
      out: { desc: `${v} main rail (after the fuse)`, expected: o.volts, power: true },
    },
    testPoints: [
      { key: 'tpIn', expected: v },
      { key: 'tpOut', expected: `≈${v}` },
    ],
    rails: [{ net: 'out', nominal: o.volts, label: `${o.volts}V` }],
    carbonise: [['out', 'GND', 'bulk']],
    variants: [
      {
        id: 'psu-conn-joint',
        family: 'Cracked solder joint',
        tier: 1,
        weight: 0.8,
        apply(b, _rng, ref) {
          const r = ref('conn');
          b.comps[r].joints[plus] = { r: Infinity, cracked: true };
          return {
            summary: `The ${v} pin of the input connector ${r} has a cracked joint. Reflow it.`,
            refs: [r],
            hint: `Totally dead. Does the ${v} get from the connector pin onto the board? Look closely at the connector joints.`,
            flavor: 'It just would not turn on one day.',
          };
        },
      },
      {
        id: 'fuse-blown',
        family: 'Blown fuse',
        tier: 1,
        weight: 0.8,
        apply(b, _rng, ref) {
          const r = ref('fuse');
          b.comps[r].fault = { type: 'open' };
          addMark(b, r, 'discolored');
          return {
            summary: `Main fuse ${r} blew from a one-off surge.`,
            refs: [r],
            hint: `Nothing at all. Follow the ${v} in from the connector: check the fuse ${r} with continuity mode.`,
          };
        },
      },
      {
        id: 'input-corroded',
        family: 'Liquid damage',
        tier: 1,
        weight: 0.7,
        apply(b, rng, ref) {
          const r = ref('conn');
          liquidDamage(b, rng, [r, ref('fuse')], 0.3, 0.5);
          b.comps[r].corr!.pins[plus] = 0.97;
          return {
            summary: `A spill left corrosion on the input connector ${r}; the crust has eaten right through its ${v} joint. No part is bad: treat it with corrosion cleaner, scrub, rinse with IPA and wipe.`,
            refs: [r],
            hint: `Dead. Look closely at the connector ${r} — is that crust on its pins? Does the ${v} get from the pin onto the board?`,
            flavor: 'It was on the floor when the washing machine leaked. Dried it out for a week, still dead.',
          };
        },
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Buck rail: regulator, enable divider, inductor, feedback divider, output cap
// ---------------------------------------------------------------------------

export interface BuckOpts {
  /** Output voltage. Supported: 5 (feedback 52.3 k / 10 k). */
  vout: 5;
  /** Input voltage, for descriptions. */
  vin: number;
  /** Inductor part (default 10 µH). */
  inductor?: string;
  /** Bottom resistor of the enable divider (default 47 k; use a smaller one for higher input voltages). */
  enBottom?: string;
  /** Input capacitor part, if fitted. */
  cin?: string;
  /** Number of output capacitors (default 1). */
  couts?: 1 | 2;
  /** Power LED on the output (true = green). */
  led?: boolean | 'green' | 'red';
}

/** Ports: `vin`, `out`. Local nets: EN, FB, SW, BST. */
export function buckRail(o: BuckOpts): BlockDef {
  const v = `${o.vout} V`;
  const enBot = o.enBottom ?? 'R-47K';
  const extra: BlockDef['parts'] = [];
  if (o.cin) extra.push({ key: 'cin', partNo: o.cin, at: [3, 6], rot: 90, pins: { '1': 'vin', '2': 'GND' }, role: 'Buck input capacitor' });
  if (o.couts === 2) extra.push({ key: 'cout2', partNo: 'C-22U-10', at: [23, 24], rot: 90, pins: { '1': 'out', '2': 'GND' }, role: `${v} output capacitor` });
  if (o.led)
    extra.push(
      { key: 'ledRes', partNo: 'R-1K', at: [18, 31], pins: { '1': 'out', '2': 'LED' }, role: 'Power LED resistor' },
      { key: 'led', partNo: o.led === 'red' ? 'LED-RED' : 'LED-GRN', at: [18, 36], pins: { A: 'LED', K: 'GND' }, role: 'Power indicator LED' },
    );
  return {
    title: `${o.vout}V BUCK`,
    size: [26, 32],
    ports: ['vin', 'out'],
    parts: [
      { key: 'reg', partNo: 'U-VX2302', at: [9, 8], pins: { BST: 'BST', GND: 'GND', FB: 'FB', EN: 'EN', IN: 'vin', SW: 'SW' }, role: `${v} buck converter` },
      { key: 'boot', partNo: 'C-100N', at: [9, 2], pins: { '1': 'BST', '2': 'SW' }, role: 'Bootstrap capacitor' },
      { key: 'enTop', partNo: 'R-100K', at: [3, 13], rot: 90, pins: { '1': 'vin', '2': 'EN' }, role: 'Enable divider (top)' },
      { key: 'enBot', partNo: enBot, at: [3, 20], rot: 90, pins: { '1': 'EN', '2': 'GND' }, role: 'Enable divider (bottom)' },
      { key: 'ind', partNo: o.inductor ?? 'L-10U', at: [17, 8], pins: { '1': 'SW', '2': 'out' }, role: 'Buck inductor' },
      { key: 'fbTop', partNo: 'R-52K3', at: [10, 17], rot: 90, pins: { '1': 'out', '2': 'FB' }, role: 'Feedback divider (top)' },
      { key: 'fbBot', partNo: 'R-10K', at: [10, 24], rot: 90, pins: { '1': 'FB', '2': 'GND' }, role: 'Feedback divider (bottom)' },
      { key: 'cout', partNo: 'C-22U-10', at: [23, 17], rot: 90, pins: { '1': 'out', '2': 'GND' }, role: `${v} output capacitor` },
      { key: 'tp', partNo: 'TP', at: [17, 27], pins: { '1': 'out' }, role: `${v} rail` },
      ...extra,
    ],
    nets: {
      vin: { desc: `${o.vin} V into the ${v} regulator`, expected: o.vin, power: true },
      EN: { desc: `Enable of the ${v} regulator`, expected: (o.vin * part(enBot).value) / (part('R-100K').value + part(enBot).value) },
      FB: { desc: `${v} regulator feedback — regulated to 0.8 V`, expected: 0.8 },
      SW: { desc: `${v} buck switch node`, expected: o.vout, power: true },
      BST: { desc: `${v} regulator bootstrap pin` },
      out: { desc: `${v} rail`, expected: o.vout, power: true },
      ...(o.led ? { LED: { desc: 'Power LED anode' } } : {}),
    },
    testPoints: [{ key: 'tp', expected: `${o.vout.toFixed(1)} V` }],
    rails: [{ net: 'out', nominal: o.vout, label: `${o.vout}V` }],
    missable: ['cout'],
    carbonise: [['out', 'GND', 'ind']],
    variants: [
      {
        id: 'buck-dead',
        family: 'Failed regulator',
        tier: 2,
        weight: 0.7,
        apply(b, _rng, ref) {
          const r = ref('reg');
          b.comps[r].fault = { type: 'dead' };
          return { summary: `${v} regulator ${r} died: ${o.vin} V in, nothing out.`, refs: [r], hint: `${o.vin} V is there but the ${v} rail is missing. What makes the ${v}?` };
        },
      },
      {
        id: 'inductor-open',
        family: 'Failed inductor',
        tier: 2,
        weight: 0.6,
        apply(b, _rng, ref) {
          const r = ref('ind');
          b.comps[r].fault = { type: 'open' };
          return {
            summary: `Buck inductor ${r} went open inside, so nothing reaches the ${v} rail even though the regulator is switching. Replace ${r}.`,
            refs: [r],
            hint: `The ${v} rail is dead but the regulator has power. Unpowered, check continuity across the inductor ${r} — a good one reads almost 0 Ω.`,
            flavor: 'It just died while I was using it.',
          };
        },
      },
      {
        id: 'esr-out',
        family: 'Dried-out capacitor',
        tier: 2,
        weight: 0.8,
        apply(b, rng, ref) {
          const r = ref('cout');
          b.comps[r].fault = { type: 'esr', esr: rng.range(4, 12) };
          return {
            summary: `${r} on the ${v} rail dried out: capacitance and resistance still look normal, but its ESR is very high, so the regulator went unstable and the ${v} rail sags. Replace ${r}.`,
            refs: [r],
            hint: `The ${v} rail is low but nothing is shorted and the regulator is not hot. An ESR meter on the ${v} capacitors (or a scope on the rail — look for ripple) finds the culprit.`,
            flavor: 'It started crashing, now it will not turn on at all.',
          };
        },
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// LDO rail
// ---------------------------------------------------------------------------

/** Ports: `vin`, `out`. A 3.3 V LDO with its output capacitor (and optional input capacitor). */
export function ldoRail(o: { vin: number; cin?: string }): BlockDef {
  const extra: BlockDef['parts'] = o.cin ? [{ key: 'cin', partNo: o.cin, at: [2, 7], rot: 90, pins: { '1': 'vin', '2': 'GND' }, role: 'LDO input capacitor' }] : [];
  return {
    title: '3V3',
    size: [18, 32],
    ports: ['vin', 'out'],
    parts: [
      { key: 'reg', partNo: 'U-HL33', at: [8, 7], pins: { GND: 'GND', OUT: 'out', IN: 'vin', TAB: 'out' }, role: '3.3 V regulator' },
      { key: 'cout', partNo: 'C-10U-6', at: [13, 18], rot: 90, pins: { '1': 'out', '2': 'GND' }, role: '3.3 V capacitor' },
      { key: 'tp', partNo: 'TP', at: [6, 27], pins: { '1': 'out' }, role: '3.3 V rail' },
      ...extra,
    ],
    nets: { vin: { desc: `${o.vin} V into the 3.3 V regulator`, expected: o.vin, power: true }, out: { desc: '3.3 V rail', expected: 3.3, power: true } },
    testPoints: [{ key: 'tp', expected: '3.3 V' }],
    rails: [{ net: 'out', nominal: 3.3, label: '3V3' }],
    missable: ['cout'],
    variants: [
      {
        id: 'ldo-dead',
        family: 'Failed regulator',
        tier: 2,
        weight: 0.6,
        apply(b, _rng, ref) {
          const r = ref('reg');
          b.comps[r].fault = { type: 'dead' };
          return { summary: `3.3 V regulator ${r} died: ${o.vin} V in, nothing out.`, refs: [r], hint: `${o.vin} V reaches the regulator but there is no 3.3 V. Is the regulator itself getting its input?` };
        },
      },
    ],
  };
}
