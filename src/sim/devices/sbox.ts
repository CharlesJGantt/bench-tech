/**
 * Sbox One X — console power-distribution board. 12 V from the internal brick, standby
 * 5 V buck + 3.3 V LDO, a standby MCU that switches the main 12 V rail to the
 * motherboard through a P-channel power MOSFET, and shuts it off again if the rail's
 * "power good" never comes up. Fictional product.
 */
import { c } from '../board';
import { device, place } from '../blocks/core';
import { buckRail, ldoRail, powerInput } from '../blocks/power';
import { customerSession, type BoardState, type DamageEvent, type FunctionalReport, type OperatingPoint } from '../circuit';
import { resistor } from '../elements';
import { addMark, type Rng, type Variant } from '../faults';

const VARIANTS: Variant[] = [
  {
    id: 'fuse-bulged-cap',
    family: 'Bulged capacitor',
    tier: 1,
    weight: 1,
    apply(b, rng) {
      b.comps.C1.fault = { type: 'short', r: rng.range(0.2, 0.5) };
      b.comps.F1.fault = { type: 'open' };
      addMark(b, 'C1', 'bulged');
      addMark(b, 'F1', 'discolored');
      return {
        summary: 'The big input capacitor C1 failed short (domed top) and blew the 5 A fuse. Replace both.',
        refs: ['C1', 'F1'],
        hint: 'Look at the big capacitors. Then check the fuse.',
        flavor: 'There was a bang and a burning smell. Now it is totally dead.',
      };
    },
  },
  {
    id: 'psu-conn-joint',
    family: 'Cracked solder joint',
    tier: 1,
    weight: 1,
    apply(b) {
      b.comps.J1.joints['12V'] = { r: Infinity, cracked: true };
      return {
        summary: 'The 12 V pin of the power connector J1 has a cracked joint (years of heating and cooling). Reflow it.',
        refs: ['J1'],
        hint: 'Dead with 12 V on the plug? Flip the board and look at the connector joints from underneath.',
        flavor: 'It sometimes would not turn on, now it never does.',
      };
    },
  },
  {
    id: 'main-cap-short',
    family: 'Shorted capacitor',
    tier: 2,
    weight: 1,
    apply(b, rng) {
      const r = rng.range(0.2, 1);
      b.comps.C9.fault = { type: 'short', r };
      return {
        summary: `Capacitor C9 on the main 12 V rail failed short (${r.toFixed(2)} Ω). The standby controller turns the main rail on, sees it collapse and shuts down.`,
        refs: ['C9'],
        hint: 'It tries and gives up — the main rail is probably shorted. Power off, measure 12V_MAIN to ground.',
      };
    },
  },
  {
    id: 'main-fet-short',
    family: 'Failed MOSFET',
    tier: 2,
    weight: 0.9,
    apply(b, rng) {
      b.comps.Q1.fault = { type: 'short', r: rng.range(0.005, 0.05) };
      return {
        summary: 'Main power MOSFET Q1 failed short drain-to-source, so the console gets 12 V the moment it is plugged in.',
        refs: ['Q1'],
        hint: 'It turns on without the button. What switches the main 12 V? Check that part from source to drain with the power off.',
      };
    },
  },
  {
    id: 'gate-res-open',
    family: 'Open resistor',
    tier: 2,
    weight: 0.8,
    apply(b) {
      b.comps.R9.fault = { type: 'open' };
      return {
        summary: 'Resistor R9 (Q1 gate drive) went open, so the main MOSFET never switches on. The controller tries, sees no power-good, and shuts down.',
        refs: ['R9'],
        hint: 'When you press power, does Q1 gate drop from 12 V? Follow the drive from the MCU to Q2 and on to Q1.',
      };
    },
  },
  {
    id: 'sb-buck-dead',
    family: 'Failed regulator',
    tier: 2,
    weight: 0.8,
    apply(b) {
      b.comps.U1.fault = { type: 'dead' };
      return { summary: 'Standby 5 V regulator U1 died: 12 V in, nothing out — no standby power at all.', refs: ['U1'], hint: '12 V is present but the standby light is off. What makes the standby 5 V?' };
    },
  },
  {
    id: 'pg-res-open',
    family: 'Open resistor',
    tier: 2,
    weight: 0.6,
    apply(b) {
      b.comps.R12.fault = { type: 'open' };
      return {
        summary: 'Resistor R12 in the power-good divider went open. The main rail is actually fine, but the controller never sees "power good" and shuts it off.',
        refs: ['R12'],
        hint: 'The main 12 V comes up for a moment — so why does the controller give up? Check what it is watching (PG).',
      };
    },
  },
  {
    id: 'main-fet-dead',
    family: "MOSFET won't switch",
    tier: 2,
    weight: 0.7,
    apply(b) {
      b.comps.Q1.fault = { type: 'dead' };
      return {
        summary: 'Q1 (main 12 V switch) failed: its gate no longer turns it on, so it never conducts. Replace Q1.',
        refs: ['Q1'],
        hint: 'The console tries to start, then gives up. When it tries, the gate of Q1 is pulled low but 12V_MAIN never appears: the MOSFET is not switching.',
        flavor: 'It beeps and the light comes on for a second, then it shuts off.',
      };
    },
  },
  {
    id: 'esr-standby',
    family: 'Dried-out capacitor',
    tier: 2,
    weight: 0.8,
    apply(b, rng) {
      const ref = 'C3';
      b.comps[ref].fault = { type: 'esr', esr: rng.range(4, 12) };
      return {
        summary: `${ref} on the standby 5 V rail dried out: its capacitance and resistance still look normal, but its ESR is very high, so the regulator went unstable and the standby 5 V rail sags. Replace ${ref}.`,
        refs: [ref],
        hint: 'The standby 5 V rail is low but nothing is shorted and the regulator is not hot. An ESR meter on the standby 5 V capacitors (or a scope on the rail — look for ripple) finds the culprit.',
        flavor: 'It got harder and harder to turn on, now nothing.',
      };
    },
  },
  {
    id: 'inductor-open',
    family: 'Failed inductor',
    tier: 2,
    weight: 0.6,
    apply(b) {
      b.comps.L1.fault = { type: 'open' };
      return {
        summary: 'Buck inductor L1 went open inside, so nothing reaches the standby 5 V rail even though the regulator is switching. Replace L1.',
        refs: ['L1'],
        hint: 'The standby 5 V rail is dead but the regulator has power. Unpowered, check continuity across the inductor L1 — a good one reads almost 0 Ω.',
        flavor: 'Completely dead, not even the standby light.',
      };
    },
  },
];

export const SBOX = device({
  id: 'sbox',
  name: 'Sbox One X (power board)',
  category: 'Consoles',
  tagline: 'Console power-distribution board — standby supply and the main 12 V switch.',
  width: 110,
  height: 70,
  blocks: [
    place(
      'IN',
      powerInput({ connector: 'header', volts: 12, fuse: 'F-5A', bulk: 'C-1000U-16', source: 'the power brick' }),
      [2, 2],
      { out: '12V' },
      { conn: 'J1', fuse: 'F1', bulk: 'C1', tpIn: 'TP1', tpOut: 'TP2' },
      { faults: false, outline: { name: '12V INPUT', x: 2, y: 2, w: 34, h: 30 }, layout: { conn: [9, 7], fuse: [21, 7], bulk: [26, 22], tpIn: [5, 22], tpOut: [13, 28] } },
    ),
    place(
      'SB',
      buckRail({ vout: 5, vin: 12, inductor: 'L-22U', led: 'red' }),
      [36, 2],
      { vin: '12V', out: '5V_SB' },
      { reg: 'U1', boot: 'C5', enTop: 'R2', enBot: 'R3', ind: 'L1', fbTop: 'R4', fbBot: 'R5', cout: 'C3', ledRes: 'R15', led: 'D2', tp: 'TP3' },
      {
        faults: false,
        outline: { name: 'STANDBY 5V / 3V3', x: 36, y: 2, w: 40, h: 30 },
        layout: {
          reg: [45, 10], boot: [45, 4], enTop: [39, 15, 90], enBot: [39, 22, 90], ind: [53, 10], fbTop: [46, 19, 90], fbBot: [46, 26, 90],
          cout: [59, 19, 90], ledRes: [53, 28], led: [60, 28], tp: [66, 26],
        },
      },
    ),
    place('SB3', ldoRail({ vin: 5 }), [62, 2], { vin: '5V_SB', out: '3V3_SB' }, { reg: 'U2', cout: 'C4', tp: 'TP4' }, {
      faults: false,
      outline: null,
      layout: { reg: [68, 9], cout: [73, 20, 90], tp: [81, 26] },
    }),
  ],
  outlines: [
    { name: 'STANDBY MCU', x: 76, y: 2, w: 32, h: 30 },
    { name: 'MAIN 12V SWITCH', x: 2, y: 34, w: 76, h: 34 },
    { name: 'MOTHERBOARD', x: 78, y: 34, w: 30, h: 34 },
  ],
  parts: [
    c('U3', 'U-PIC8-SBX', 'MCU', 88, 12, 0, { VDD: '3V3_SB', LED: 'LED_IO', MAINEN: 'MAIN_EN_IO', BTN: 'BTN', PG: 'PG', NC6: 'U3_NC6', NC7: 'U3_NC7', GND: 'GND' }, 'Standby / power-sequencing MCU'),
    c('C6', 'C-100N', 'MCU', 80, 6, 90, { '1': '3V3_SB', '2': 'GND' }, 'MCU decoupling'),
    c('R6', 'R-220R', 'MCU', 99, 5, 0, { '1': 'LED_IO', '2': 'PWR_LED_A' }, 'Power LED resistor'),
    c('D1', 'LED-WHT', 'MCU', 105, 5, 0, { A: 'PWR_LED_A', K: 'GND' }, 'Power light (white)'),
    c('R14', 'R-10K', 'MCU', 99, 13, 0, { '1': '3V3_SB', '2': 'BTN' }, 'Button pull-up'),
    c('SW1', 'SW-TACT', 'MCU', 101, 23, 0, { '1': 'BTN', '2': 'GND' }, 'Power button'),
    c('TP5', 'TP', 'MCU', 90, 28, 0, { '1': 'GND' }, 'Ground'),
    c('R10', 'R-10K', 'MAIN', 21, 44, 90, { '1': '12V', '2': 'Q1_G' }, 'Q1 gate pull-up (keeps it off)'),
    c('Q1', 'Q-PPWR', 'MAIN', 31, 46, 180, { G: 'Q1_G', S: '12V', D: '12V_MAIN' }, 'Main 12 V switch (P-MOSFET)'),
    c('R9', 'R-1K', 'MAIN', 44, 54, 0, { '1': 'Q1_G', '2': 'Q2_D' }, 'Q1 gate drive resistor'),
    c('Q2', 'Q-NFET', 'MAIN', 58, 48, 0, { G: 'Q2_G', S: 'GND', D: 'Q2_D' }, 'Gate driver transistor'),
    c('R7', 'R-1K', 'MAIN', 60, 40, 0, { '1': 'MAIN_EN_IO', '2': 'Q2_G' }, 'Q2 base/gate resistor'),
    c('R8', 'R-100K', 'MAIN', 52, 46, 90, { '1': 'Q2_G', '2': 'GND' }, 'Q2 gate pull-down'),
    c('C2', 'C-1000U-16', 'MAIN', 12, 60, 0, { '+': '12V_MAIN', '-': 'GND' }, 'Main rail bulk capacitor'),
    c('C9', 'C-10U-25', 'MAIN', 40, 63, 0, { '1': '12V_MAIN', '2': 'GND' }, 'Main rail ceramic capacitor'),
    c('TP6', 'TP', 'MAIN', 50, 66, 0, { '1': '12V_MAIN' }, 'Main 12 V'),
    c('R12', 'R-22K', 'MAIN', 68, 55, 90, { '1': '12V_MAIN', '2': 'PG' }, 'Power-good divider (top)'),
    c('R13', 'R-10K', 'MAIN', 68, 63, 90, { '1': 'PG', '2': 'GND' }, 'Power-good divider (bottom)'),
    c('TP7', 'TP', 'MAIN', 74, 60, 0, { '1': 'PG' }, 'Power good'),
    c('J2', 'J-PWR2', 'MOBO', 92, 50, 0, { '12V': '12V_MAIN', GND: 'GND' }, 'Motherboard power connector'),
  ],
  traces: [],
  testPoints: [
    { ref: 'TP1', net: 'IN_VIN', expected: '12 V (brick connected)' },
    { ref: 'TP2', net: '12V', expected: '≈12 V' },
    { ref: 'TP3', net: '5V_SB', expected: '5.0 V (always on)' },
    { ref: 'TP4', net: '3V3_SB', expected: '3.3 V (always on)' },
    { ref: 'TP6', net: '12V_MAIN', expected: '12 V only while the console is on' },
    { ref: 'TP7', net: 'PG', expected: '≈3.7 V while on (power good)' },
    { ref: 'TP5', net: 'GND', expected: '0 V' },
  ],
  rails: [
    { net: '12V', nominal: 12, label: '12V' },
    { net: '5V_SB', nominal: 5, label: '5V SB' },
    { net: '3V3_SB', nominal: 3.3, label: '3V3 SB' },
    { net: '12V_MAIN', nominal: 12, label: '12V MAIN' },
  ],
  nets: {
    GND: { desc: 'Ground', expected: 0 },
    'IN_VIN': { desc: 'Raw 12 V from the power brick', expected: 12 },
    '12V': { desc: '12 V input rail (after the fuse)', expected: 12 },
    'SB_EN': { desc: 'Enable of the standby regulator U1', expected: 3.8 },
    'SB_FB': { desc: 'U1 feedback — regulated to 0.8 V', expected: 0.8 },
    'SB_SW': { desc: 'Standby buck switch node', expected: 5 },
    'SB_BST': { desc: 'U1 bootstrap pin' },
    '5V_SB': { desc: 'Standby 5 V — on whenever the brick is plugged in', expected: 5 },
    '3V3_SB': { desc: 'Standby 3.3 V for the standby MCU', expected: 3.3 },
    'SB_LED': { desc: 'Standby light anode' },
    BTN: { desc: 'Power button — high normally, low while pressed', expected: 3.3 },
    LED_IO: { desc: 'MCU power-light output (high when the console is on)' },
    PWR_LED_A: { desc: 'Power light anode' },
    MAIN_EN_IO: { desc: 'MCU "main power on" output (high when the console is on)' },
    Q2_G: { desc: 'Gate of driver transistor Q2 (high = turn the console on)' },
    Q2_D: { desc: 'Q2 drain — pulled to ground when the console is on' },
    Q1_G: { desc: 'Gate of main MOSFET Q1 — 12 V = off, about 1 V = on' },
    '12V_MAIN': { desc: 'Main 12 V to the motherboard — only on while the console is running' },
    PG: { desc: 'Power good — about 3.7 V when the main 12 V is healthy; the MCU shuts down if it stays low' },
  },
  input: {
    ref: 'J1',
    plus: '12V',
    minus: 'GND',
    adapter: { v: 12.1, ilim: 8, rint: 0.02, label: "the console's 12 V power brick" },
    psuV: 12,
    psuI: 2,
  },
  ground: 'TP5',
  controls: [{ ref: 'SW1', label: 'Power button' }],
  externals: [
    {
      id: 'mobo',
      label: '🖥 Motherboard (load) on J2',
      attach(api) {
        api.add(resistor(api.mate('J2', '12V'), api.mate('J2', 'GND'), 12, 'mobo'));
      },
    },
  ],
  ownerAttaches: ['mobo'],
  firmware: {
    ref: 'U3',
    vmin: 2.8,
    vmax: 4.2,
    inputs: ['BTN', 'PG'],
    boot: () => ({ on: 0, fault: 0 }),
    step(state, inputs, prev) {
      const pressed = !inputs.BTN && prev.BTN;
      if (pressed) {
        if (state.on) state.on = 0;
        else {
          state.on = 1; // switching on: check power-good on the next step
          state.fault = 0;
        }
      } else if (state.on === 1) {
        if (inputs.PG) state.on = 2;
        else {
          state.on = 0;
          state.fault = 1;
        }
      } else if (state.on === 2 && !inputs.PG) {
        state.on = 0;
        state.fault = 1;
      }
      return { MAINEN: state.on > 0, LED: state.on > 0 };
    },
  },
  functional,
  complain,
  status(b, op) {
    if (!op) return [];
    const load = op.current('mobo');
    const lines = [
      { label: 'Standby light (red)', value: op.current('D2') > 5e-4 ? 'on' : 'off', ok: op.current('D2') > 5e-4 },
      { label: 'Power light (white)', value: op.current('D1') > 5e-4 ? 'on' : b.mcu.state.fault ? 'flashed, then off (fault)' : 'off', ok: op.current('D1') > 5e-4 },
      { label: 'Console', value: load > 0.8 ? 'running' : b.attached.includes('mobo') ? 'off' : 'motherboard not connected', ok: load > 0.8 },
      { label: 'Main 12 V', value: `${op.net('12V_MAIN').toFixed(2)} V` },
    ];
    return lines;
  },
  variants: VARIANTS,
  missable: ['D1', 'D2', 'C3', 'C4', 'C6', 'C9', 'R6', 'R13', 'R15', 'SW1'],
  carbonise: [
    ['12V', 'GND', 'C1'],
    ['12V_MAIN', 'GND', 'C2'],
  ],
  marketValue: 260,
  quoteBase: 50,
  minReputation: 10,
});

const running = (op: OperatingPoint) => op.current('mobo') > 0.8;

/** Plug the brick in, check the standby light, press power, then press it again to switch off. */
function functional(b: BoardState): FunctionalReport {
  b.attached = ['mobo'];
  const s = customerSession(b);
  const op0 = s.settle();
  const standby = op0.current('D2') > 5e-4;
  const onByItself = running(op0);
  const op1 = s.press('SW1');
  const boots = running(op1) && op1.current('D1') > 5e-4;
  const shutdown = b.mcu.state.fault === 1;
  const inputCurrent = op1.srcI;
  const op2 = s.press('SW1');
  const turnsOff = !running(op2);
  s.end();
  const checks = [
    { label: 'Standby light on when plugged in', ok: standby },
    { label: 'Stays off until the power button is pressed', ok: !onByItself },
    { label: 'Powers up with the button and stays on', ok: boots },
    { label: 'Turns off with the button', ok: turnsOff },
  ];
  return { checks, facts: { standby, onByItself, boots, shutdown, turnsOff }, inputCurrent, events: s.events, passed: checks.every((x) => x.ok) && !s.events.length };
}

function complain(r: FunctionalReport, events: DamageEvent[], rng: Rng): string {
  const f = r.facts as Record<string, boolean>;
  const bang = events.length ? ' There was a pop.' : '';
  if (!f.standby) return rng.pick(['Completely dead — not even the little standby light.', 'Plugged it in and nothing at all.']) + bang;
  if (f.onByItself) return 'It turns itself on as soon as I plug it in, and the power button will not turn it off.' + bang;
  if (f.shutdown) return rng.pick(['The light comes on for a second, it beeps, then it turns straight back off.', 'Press power — it starts, then shuts itself off.']) + bang;
  if (!f.boots) return 'The standby light is on but it will not power on.' + bang;
  return 'It does something odd when I turn it off.' + bang;
}
