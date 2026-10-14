/**
 * ViewMax 24 monitor — power & backlight board. 19 V brick in, 5 V buck, 3.3 V LDO,
 * scaler with power button, and an LED backlight boost converter (external MOSFET,
 * Schottky, current-sense resistor) driving a plug-in LED strip. Fictional product.
 */
import { c } from '../board';
import { device, place } from '../blocks/core';
import { buckRail, ldoRail, powerInput } from '../blocks/power';
import { customerSession, type BoardState, type DamageEvent, type FunctionalReport, type OperatingPoint } from '../circuit';
import { addMark, type Rng, type Variant } from '../faults';

const VARIANTS: Variant[] = [
  {
    id: 'fuse-blown',
    family: 'Blown fuse',
    tier: 1,
    weight: 0.8,
    apply(b) {
      b.comps.F1.fault = { type: 'open' };
      addMark(b, 'F1', 'discolored');
      return { summary: 'Input fuse F1 blew from a power surge.', refs: ['F1'], hint: 'Completely dead? Start at the power input: check the fuse with continuity mode.' };
    },
  },
  {
    id: 'input-cap-bulged',
    family: 'Bulged capacitor',
    tier: 1,
    weight: 1,
    apply(b, rng) {
      b.comps.C1.fault = { type: 'short', r: rng.range(0.2, 0.6) };
      addMark(b, 'C1', 'bulged');
      return {
        summary: 'The big input capacitor C1 failed short (bulged top) and took the fuse with it. Replace both.',
        refs: ['C1'],
        hint: 'Look at the tops of the big capacitors — flat is good, domed is dead.',
        flavor: 'It went pop and now it is dead. Smells a bit.',
      };
    },
  },
  {
    id: 'bl-fet-short',
    family: 'Failed MOSFET',
    tier: 2,
    weight: 1,
    apply(b, rng) {
      b.comps.Q1.fault = { type: 'short', r: rng.range(0.02, 0.15) };
      return {
        summary: 'Backlight switching MOSFET Q1 failed short, shorting the boost inductor to ground and blowing the input fuse. Replace Q1 and the fuse.',
        refs: ['Q1'],
        hint: 'The fuse blew — but why? With the power off, measure Q1 drain to source.',
      };
    },
  },
  {
    id: 'sense-open',
    family: 'Open resistor',
    tier: 2,
    weight: 0.8,
    apply(b) {
      b.comps.R11.fault = { type: 'open' };
      return {
        summary: 'Current-sense resistor R11 (2 Ω) cracked open, so the LED strip has no return path.',
        refs: ['R11'],
        hint: 'Backlight dark but the boost output (VLED) is way above normal? Something in the LED current path is open.',
      };
    },
  },
  {
    id: 'boost-dead',
    family: 'Failed regulator',
    tier: 2,
    weight: 0.8,
    apply(b) {
      b.comps.U4.fault = { type: 'dead' };
      return {
        summary: 'Backlight boost controller U4 died: 19 V in and enabled, but it does not boost.',
        refs: ['U4'],
        hint: 'Switched on: is there 19 V on U4 VIN? Is EN high? Is VLED only a little under 19 V?',
      };
    },
  },
  {
    id: 'led-conn-joint',
    family: 'Cracked solder joint',
    tier: 1,
    weight: 1,
    apply(b, rng) {
      const pin = rng.pick(['1', '2']);
      b.comps.J2.joints[pin] = { r: Infinity, cracked: true };
      return {
        summary: `The LED strip connector J2 has a cracked joint on pin ${pin}. Reflow it.`,
        refs: ['J2'],
        hint: 'Backlight dark — check the joints on the LED strip connector under magnification.',
        flavor: 'The screen flickered for a week and now it is black. The power light still comes on.',
      };
    },
  },
  {
    id: 'ledbar-dead',
    family: 'Failed LED strip',
    tier: 1,
    weight: 0.8,
    apply(b) {
      b.comps.LB1.fault = { type: 'open' };
      return {
        summary: 'One LED in the backlight strip failed open, so the whole series string is dark. Replace the strip.',
        refs: ['LB1'],
        hint: 'Unplug the strip and test it alone with the bench PSU: ~29 V with a low current limit should make it glow.',
        flavor: 'I can just see the picture if I shine a torch on the screen.',
      };
    },
  },
  {
    id: 'corroded-trace',
    family: 'Liquid damage',
    tier: 2,
    weight: 0.7,
    apply(b) {
      b.traces.T1.broken = true;
      addMark(b, 'L2', 'corrosion');
      addMark(b, 'C8', 'corrosion');
      return {
        summary: 'Liquid got onto the backlight section and corrosion ate through trace T1 (19 V to the boost converter). Clean it up and bridge it with a jumper wire.',
        refs: ['T1'],
        hint: 'See the green crust? Clean it with IPA, then check that the 19 V reaches the boost converter.',
        flavor: 'I knocked a drink over near it. Power light comes on but the screen is black.',
      };
    },
  },
  {
    id: 'boost-fet-dead',
    family: "MOSFET won't switch",
    tier: 2,
    weight: 0.7,
    apply(b) {
      b.comps.Q1.fault = { type: 'dead' };
      return {
        summary: 'Q1 (backlight boost switch) failed: its gate no longer turns it on, so it never conducts. Replace Q1.',
        refs: ['Q1'],
        hint: 'The backlight boost does nothing. The boost chip is powered and enabled, but Q1 never switches — check it out of circuit with diode mode, or replace it.',
        flavor: 'You can just about see the picture with a torch, but the screen is dark.',
      };
    },
  },
  {
    id: 'esr-5v',
    family: 'Dried-out capacitor',
    tier: 2,
    weight: 0.8,
    apply(b, rng) {
      const ref = 'C3';
      b.comps[ref].fault = { type: 'esr', esr: rng.range(4, 12) };
      return {
        summary: `${ref} on the 5 V rail dried out: its capacitance and resistance still look normal, but its ESR is very high, so the regulator went unstable and the 5 V rail sags. Replace ${ref}.`,
        refs: [ref],
        hint: 'The 5 V rail is low but nothing is shorted and the regulator is not hot. An ESR meter on the 5 V capacitors (or a scope on the rail — look for ripple) finds the culprit.',
        flavor: 'The picture kept blinking off, now the monitor will not wake up.',
      };
    },
  },
];

export const VIEWMAX = device({
  id: 'viewmax',
  name: 'ViewMax 24 Monitor (power board)',
  category: 'Displays',
  tagline: '24" monitor power & backlight board — the classic "dark screen" repair.',
  width: 120,
  height: 72,
  blocks: [
    place(
      'IN',
      powerInput({ connector: 'barrel', volts: 19, fuse: 'F-1A', bulk: 'C-470U-35', source: 'the power brick', tvs: 'D-TVS24' }),
      [2, 2],
      { out: '19V' },
      { conn: 'J1', fuse: 'F1', tvs: 'D1', bulk: 'C1', tpIn: 'TP1', tpOut: 'TP2' },
      { faults: false, outline: { name: 'POWER INPUT', x: 2, y: 2, w: 34, h: 28 }, layout: { conn: [7, 14], fuse: [21, 7], tvs: [21, 17, 270], bulk: [29, 22], tpIn: [15, 26], tpOut: [4, 26] } },
    ),
    place(
      '5V',
      buckRail({ vout: 5, vin: 19, enBottom: 'R-22K' }),
      [36, 2],
      { vin: '19V', out: '5V' },
      { reg: 'U1', boot: 'C5', enTop: 'R2', enBot: 'R3', ind: 'L1', fbTop: 'R4', fbBot: 'R5', cout: 'C3', tp: 'TP3' },
      {
        faults: false,
        outline: { name: '5V / 3V3 LOGIC', x: 36, y: 2, w: 40, h: 28 },
        layout: { reg: [45, 10], boot: [45, 4], enTop: [39, 15, 90], enBot: [39, 22, 90], ind: [53, 10], fbTop: [46, 19, 90], fbBot: [46, 26, 90], cout: [59, 19, 90], tp: [53, 26] },
      },
    ),
    place('3V3', ldoRail({ vin: 5 }), [62, 2], { vin: '5V', out: '3V3' }, { reg: 'U2', cout: 'C4', tp: 'TP4' }, {
      faults: false,
      outline: null,
      layout: { reg: [67, 9], cout: [72, 20, 90], tp: [65, 26] },
    }),
  ],
  outlines: [
    { name: 'SCALER', x: 76, y: 2, w: 42, h: 28 },
    { name: 'BACKLIGHT BOOST', x: 2, y: 32, w: 82, h: 28 },
    { name: 'LED STRIP', x: 84, y: 32, w: 34, h: 28 },
  ],
  parts: [
    c('U3', 'U-SCL24', 'SCALER', 90, 15, 0, {
      VDD: '3V3', BLEN: 'BL_EN_IO', BTN: 'BTN', LED: 'LED_IO',
      NC5: 'U3_NC5', NC6: 'U3_NC6', NC7: 'U3_NC7', NC8: 'U3_NC8', NC9: 'U3_NC9', NC10: 'U3_NC10', NC11: 'U3_NC11', NC12: 'U3_NC12', NC13: 'U3_NC13', NC14: 'U3_NC14', NC15: 'U3_NC15',
      GND: 'GND',
    }, 'Scaler (picture processor)'),
    c('C6', 'C-100N', 'SCALER', 81, 6, 90, { '1': '3V3', '2': 'GND' }, 'Scaler decoupling'),
    c('R6', 'R-220R', 'SCALER', 103, 7, 0, { '1': 'LED_IO', '2': 'PWR_LED_A' }, 'Power LED resistor'),
    c('D2', 'LED-BLU', 'SCALER', 110, 7, 0, { A: 'PWR_LED_A', K: 'GND' }, 'Power LED (blue)'),
    c('R7', 'R-10K', 'SCALER', 103, 15, 0, { '1': '3V3', '2': 'BTN' }, 'Button pull-up'),
    c('SW1', 'SW-TACT', 'SCALER', 110, 22, 0, { '1': 'BTN', '2': 'GND' }, 'Power button'),
    c('R8', 'R-1K', 'SCALER', 98, 26, 0, { '1': 'BL_EN_IO', '2': 'BL_EN' }, 'Backlight enable resistor'),
    c('TP5', 'TP', 'SCALER', 82, 26, 0, { '1': 'GND' }, 'Ground'),
    c('C8', 'C-10U-25', 'BOOST', 8, 44, 90, { '1': '19V_BL', '2': 'GND' }, 'Boost input capacitor'),
    c('L2', 'L-22U', 'BOOST', 18, 44, 0, { '1': '19V_BL', '2': 'SW2' }, 'Boost inductor'),
    c('U4', 'U-LB693', 'BOOST', 40, 46, 0, { VIN: '19V_BL', EN: 'BL_EN', FB: 'LED_K', GATE: 'GATE_R', SW: 'SW2', OUT: 'VLED', NC7: 'U4_NC7', GND: 'GND' }, 'Backlight boost controller'),
    c('R9', 'R-100K', 'BOOST', 30, 53, 90, { '1': 'BL_EN', '2': 'GND' }, 'Enable pull-down'),
    c('R10', 'R-10R-1206', 'BOOST', 50, 55, 0, { '1': 'GATE_R', '2': 'GATE' }, 'MOSFET gate resistor'),
    c('Q1', 'Q-NPWR', 'BOOST', 61, 46, 0, { G: 'GATE', S: 'GND', D: 'SW2' }, 'Boost switching MOSFET'),
    c('D3', 'D-SS36', 'BOOST', 72, 38, 0, { A: 'SW2', K: 'VLED' }, 'Boost rectifier (Schottky)'),
    c('C7', 'C-4U7-50', 'BOOST', 79, 46, 90, { '1': 'VLED', '2': 'GND' }, 'Backlight output capacitor'),
    c('TP6', 'TP', 'BOOST', 72, 55, 0, { '1': 'VLED' }, 'Backlight voltage'),
    c('J2', 'J-JST2', 'LED', 96, 41, 0, { '1': 'VLED', '2': 'LED_K' }, 'LED strip connector'),
    c('R11', 'R-2R0-1206', 'LED', 96, 53, 0, { '1': 'LED_K', '2': 'GND' }, 'LED current-sense resistor'),
    c('TP7', 'TP', 'LED', 108, 53, 0, { '1': 'LED_K' }, 'LED return / sense'),
    c('LB1', 'M-LEDBAR', 'LED', 82, 66, 0, { A: 'LB1_A', K: 'LB1_K' }, 'Backlight LED strip', 'J2'),
  ],
  traces: [{ id: 'T1', a: '19V', b: '19V_BL' }],
  testPoints: [
    { ref: 'TP1', net: 'IN_VIN', expected: '19 V (brick plugged in)' },
    { ref: 'TP2', net: '19V', expected: '≈19 V' },
    { ref: 'TP3', net: '5V', expected: '5.0 V' },
    { ref: 'TP4', net: '3V3', expected: '3.3 V' },
    { ref: 'TP6', net: 'VLED', expected: '≈30 V with the backlight on, ≈18.5 V off' },
    { ref: 'TP7', net: 'LED_K', expected: '0.2 V with the backlight on' },
    { ref: 'TP5', net: 'GND', expected: '0 V' },
  ],
  rails: [
    { net: '19V', nominal: 19, label: '19V' },
    { net: '5V', nominal: 5, label: '5V' },
    { net: '3V3', nominal: 3.3, label: '3V3' },
  ],
  nets: {
    GND: { desc: 'Ground', expected: 0 },
    'IN_VIN': { desc: 'Raw 19 V input from the jack', expected: 19 },
    '19V': { desc: '19 V main rail (after the fuse)', expected: 19 },
    '19V_BL': { desc: '19 V feed into the backlight boost converter', expected: 19 },
    '5V_EN': { desc: 'Enable pin of the 5 V regulator U1 — must be above 1.2 V', expected: 3.4 },
    '5V_FB': { desc: 'U1 feedback — regulated to 0.8 V', expected: 0.8 },
    '5V_SW': { desc: '5 V buck switch node (average ≈ 5 V)', expected: 5 },
    '5V_BST': { desc: 'U1 bootstrap pin' },
    '5V': { desc: '5 V logic rail', expected: 5 },
    '3V3': { desc: '3.3 V rail for the scaler', expected: 3.3 },
    BTN: { desc: 'Power button — high normally, low while pressed', expected: 3.3 },
    LED_IO: { desc: 'Scaler power-LED output (high when on)' },
    PWR_LED_A: { desc: 'Power LED anode' },
    BL_EN_IO: { desc: 'Scaler backlight-enable output (high when on)' },
    BL_EN: { desc: 'Backlight enable into U4 — must be high for the backlight to run' },
    SW2: { desc: 'Boost switch node: inductor, MOSFET drain and diode meet here (≈19 V on average)' },
    GATE: { desc: 'Boost MOSFET gate (switching; reads near 0 V on a meter)' },
    GATE_R: { desc: 'Gate drive from U4' },
    VLED: { desc: 'Backlight boost output — ≈30 V with the strip lit; it shoots up to ~45 V if the LED path is open', expected: 30 },
    LED_K: { desc: 'LED strip return — U4 holds this at 0.2 V across the 2 Ω sense resistor (= 100 mA)', expected: 0.2 },
  },
  input: {
    ref: 'J1',
    plus: 'TIP',
    minus: 'SLEEVE',
    adapter: { v: 19.2, ilim: 3.5, rint: 0.1, label: "the monitor's 19 V power brick" },
    psuV: 19,
    psuI: 1,
  },
  ground: 'TP5',
  controls: [{ ref: 'SW1', label: 'Power button' }],
  firmware: {
    ref: 'U3',
    vmin: 2.8,
    vmax: 4.2,
    inputs: ['BTN'],
    boot: () => ({ on: 0 }),
    step(state, inputs, prev) {
      if (!inputs.BTN && prev.BTN) state.on = state.on ? 0 : 1;
      return { LED: state.on === 1, BLEN: state.on === 1 };
    },
  },
  functional,
  complain,
  status(_b, op) {
    if (!op) return [];
    const bl = Math.max(0, op.current('LB1'));
    return [
      { label: 'Power light (blue)', value: op.current('D2') > 5e-4 ? 'on' : 'off', ok: op.current('D2') > 5e-4 },
      { label: 'Backlight', value: bl > 0.01 ? `${Math.round((bl / 0.1) * 100)}%` : 'dark', ok: bl > 0.08 },
      { label: 'Backlight voltage', value: `${op.net('VLED').toFixed(1)} V` },
    ];
  },
  variants: VARIANTS,
  missable: ['D2', 'C3', 'C4', 'C6', 'C7', 'C8', 'R6', 'R11', 'SW1', 'LB1'],
  carbonise: [
    ['19V', 'GND', 'C1'],
    ['SW2', 'GND', 'Q1'],
  ],
  marketValue: 110,
  quoteBase: 45,
  minReputation: 5,
});

const lit = (op: OperatingPoint, ref: string, min: number) => op.current(ref) > min;

/** Plug the brick in, press power, look at the screen, switch it off. */
function functional(b: BoardState): FunctionalReport {
  const s = customerSession(b);
  s.settle();
  const op1 = s.press('SW1');
  const powersOn = lit(op1, 'D2', 5e-4);
  const backlight = Math.max(0, op1.current('LB1')) / 0.1;
  const inputCurrent = op1.srcI;
  const op2 = s.press('SW1');
  const turnsOff = !lit(op2, 'D2', 5e-4) && !lit(op2, 'LB1', 0.01);
  s.end();
  const checks = [
    { label: 'Power light comes on with the button', ok: powersOn },
    { label: 'Backlight lights the screen at full brightness', ok: backlight > 0.8 && backlight < 1.3 },
    { label: 'Switches off again', ok: turnsOff },
  ];
  return { checks, facts: { powersOn, backlight, turnsOff }, inputCurrent, events: s.events, passed: checks.every((x) => x.ok) && !s.events.length };
}

function complain(r: FunctionalReport, events: DamageEvent[], rng: Rng): string {
  const f = r.facts as Record<string, number | boolean>;
  const bang = events.some((e) => e.kind === 'fuse' || e.kind === 'pop') ? ' I heard a click and it died.' : '';
  if (!f.powersOn) return rng.pick(['Completely dead. No power light.', 'Nothing happens when I press the power button.']) + bang;
  if ((f.backlight as number) < 0.1)
    return rng.pick(['Power light comes on but the screen stays black.', 'Screen is black, but if I shine a torch on it I can just make out the picture.']) + bang;
  if ((f.backlight as number) < 0.8) return 'The screen is very dim.' + bang;
  return 'It does something strange — hard to describe.' + bang;
}
