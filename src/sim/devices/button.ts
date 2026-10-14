/**
 * Button — a handheld games console (main board). USB-C in, fuse + TVS, current-sense
 * resistor, Li-ion charger, battery pack on a plug, 3.3 V LDO, SoC with power button and
 * charge light, and a screen module on a ribbon connector whose backlight is switched by
 * a MOSFET. Fictional product.
 */
import { c } from '../board';
import { device, place } from '../blocks/core';
import { ldoRail } from '../blocks/power';
import { liIonCharger, usbInput } from '../blocks/usb';
import { customerSession, type BoardState, type DamageEvent, type FunctionalReport, type OperatingPoint } from '../circuit';
import { addMark, liquidDamage, type Rng, type Variant } from '../faults';

const VARIANTS: Variant[] = [
  {
    id: 'usbc-loose',
    family: 'Damaged connector',
    tier: 1,
    weight: 1,
    apply(b) {
      b.comps.J1.fault = { type: 'pins-open', pins: ['VBUS'] };
      addMark(b, 'J1', 'loose');
      return {
        summary: 'The USB-C port is worn: its VBUS contacts no longer touch the plug. Replace the port.',
        refs: ['J1'],
        hint: 'Plug the charger in and measure VBUS on the port legs. No 5 V there means the port itself.',
        flavor: 'The charging port is wobbly and it will not charge any more.',
      };
    },
  },
  {
    id: 'usbc-corroded',
    family: 'Liquid damage',
    tier: 1,
    weight: 0.8,
    apply(b, rng) {
      b.comps.J1.fault = { type: 'pins-open', pins: ['VBUS'] };
      liquidDamage(b, rng, ['J1']);
      return {
        summary: 'Liquid got into the USB-C port and corroded its VBUS contacts. Replace the port and clean up the board.',
        refs: ['J1'],
        hint: 'Crusty green-white deposits around the port are a giveaway. Is 5 V getting past it?',
        flavor: 'My little brother spilled juice on it. Now it will not charge.',
      };
    },
  },
  {
    id: 'battery-worn',
    family: 'Dead battery',
    tier: 1,
    weight: 1,
    apply(b) {
      b.comps.BT1.fault = { type: 'worn' };
      addMark(b, 'BT1', 'swollen');
      return {
        summary: 'The battery pack is worn out and swollen. Replace the pack.',
        refs: ['BT1'],
        hint: 'Unplug the charger and measure the battery. Also look at its shape.',
        flavor: 'It only works when it is plugged in, and the back case is bulging a bit.',
      };
    },
  },
  {
    id: 'screen-cracked',
    family: 'Broken screen',
    tier: 1,
    weight: 1,
    apply(b) {
      b.comps.LCD1.fault = { type: 'open' };
      addMark(b, 'LCD1', 'cracked-screen');
      return {
        summary: 'The screen module is cracked and its backlight is dead. Swap the screen.',
        refs: ['LCD1'],
        hint: 'Have a good look at the screen itself before you get the meter out.',
        flavor: 'I dropped it. The screen is cracked and stays black.',
      };
    },
  },
  {
    id: 'fuse-usb',
    family: 'Blown fuse',
    tier: 1,
    weight: 0.7,
    apply(b) {
      b.comps.F1.fault = { type: 'open' };
      return { summary: 'USB input fuse F1 blew (a cheap charger spiked it).', refs: ['F1'], hint: 'Follow the 5 V in from the port: where does it stop?', flavor: 'I used a dodgy charger and now it will not charge.' };
    },
  },
  {
    id: 'charger-dead',
    family: 'Failed charger IC',
    tier: 2,
    weight: 0.8,
    apply(b) {
      b.comps.U1.fault = { type: 'dead' };
      return { summary: 'The charger IC U1 died: 5 V in, nothing going to the battery.', refs: ['U1'], hint: 'With the charger plugged in: 5 V on U1 VBUS? Does the battery rail rise?' };
    },
  },
  {
    id: 'sense-open',
    family: 'Open resistor',
    tier: 2,
    weight: 0.7,
    apply(b) {
      b.comps.R1.fault = { type: 'open' };
      return {
        summary: 'The 50 mΩ current-sense resistor R1 in the charging path cracked open.',
        refs: ['R1'],
        hint: 'There is 5 V on one side of R1 but not the other? It should be almost a dead short.',
      };
    },
  },
  {
    id: 'backlight-trace',
    family: 'Liquid damage',
    tier: 2,
    weight: 0.8,
    apply(b, rng) {
      b.traces.T1.broken = true;
      liquidDamage(b, rng, ['C6', 'R4']);
      return {
        summary: 'Corrosion near the screen connector ate through trace T1, cutting the backlight supply. Clean it and bridge it with a jumper wire.',
        refs: ['T1'],
        hint: 'Is the battery voltage reaching the backlight resistor R4? Look for green crust and follow the copper.',
        flavor: 'It got rained on in my bag. It turns on (I hear the sound) but the screen is black.',
      };
    },
  },
  {
    id: 'bl-fet-open',
    family: 'Failed MOSFET',
    tier: 2,
    weight: 0.7,
    apply(b) {
      b.comps.Q1.fault = { type: 'open' };
      return {
        summary: 'Backlight switch MOSFET Q1 failed open, so the screen backlight never turns on.',
        refs: ['Q1'],
        hint: 'When it is switched on, is the backlight enable (Q1 gate) high? Then what does Q1 drain do?',
      };
    },
  },
  {
    id: 'fpc-melted',
    family: 'Bad previous repair',
    tier: 2,
    weight: 0.6,
    apply(b) {
      b.comps.J3.fault = { type: 'melted' };
      addMark(b, 'J3', 'rework-residue');
      addMark(b, 'J3', 'discolored');
      return {
        summary: 'Someone swapped the screen before and cooked the ribbon connector J3 with too much heat — its contacts no longer touch. Replace J3 (low heat — it melts easily).',
        refs: ['J3'],
        hint: 'The screen tests fine on its own. Look closely at the ribbon connector it plugs into.',
        flavor: 'A shop put a new screen in last month. It worked for a day, now it is black.',
        previousRepair: true,
      };
    },
  },
  {
    id: 'bl-fet-dead',
    family: "MOSFET won't switch",
    tier: 2,
    weight: 0.7,
    apply(b) {
      b.comps.Q1.fault = { type: 'dead' };
      return {
        summary: 'Q1 (backlight switch) failed: its gate no longer turns it on, so it never conducts. Replace Q1.',
        refs: ['Q1'],
        hint: 'Sound but no backlight. The SoC drives the gate of Q1 high, yet the backlight stays off: Q1 is not switching.',
        flavor: 'I can hear the game but the screen stays black.',
      };
    },
  },
  {
    id: 'esr-3v3',
    family: 'Dried-out capacitor',
    tier: 2,
    weight: 0.8,
    apply(b, rng) {
      const ref = 'C4';
      b.comps[ref].fault = { type: 'esr', esr: rng.range(4, 12) };
      return {
        summary: `${ref} on the 3.3 V rail dried out: its capacitance and resistance still look normal, but its ESR is very high, so the regulator went unstable and the 3.3 V rail sags. Replace ${ref}.`,
        refs: [ref],
        hint: 'The 3.3 V rail is low but nothing is shorted and the regulator is not hot. An ESR meter on the 3.3 V capacitors (or a scope on the rail — look for ripple) finds the culprit.',
        flavor: 'It froze a lot and now it will not boot.',
      };
    },
  },
];

export const BUTTON = device({
  id: 'button',
  name: 'Button Handheld Console',
  category: 'Consoles',
  tagline: 'Hybrid handheld console main board — charging, battery and screen faults.',
  width: 120,
  height: 72,
  blocks: [
    place('USB', usbInput({ connector: 'usbc', fuse: 'F-3A', tvs: 'D-TVS5' }), [2, 2], { out: 'VBUS' }, { conn: 'J1', fuse: 'F1', tvs: 'D1', tp: 'TP1' }, {
      faults: false,
      outline: { name: 'USB-C / CHARGER', x: 2, y: 2, w: 48, h: 32 },
      layout: { conn: [9, 6], fuse: [20, 9], tvs: [25, 17, 270], tp: [13, 26] },
    }),
    place(
      'CHG',
      liIonCharger({ sense: true, cin: 'C-10U-25', cbat: 'C-22U-10', battery: true }),
      [28, 2],
      { vin: 'VBUS', bat: 'VSYS', stat: 'CHG' },
      { sense: 'R1', cin: 'C1', chg: 'U1', cbat: 'C2', tp: 'TP2', conn: 'J2', pack: 'BT1' },
      { faults: false, outline: null, layout: { sense: [31, 9], cin: [36, 17, 90], chg: [43, 9], cbat: [46, 20, 90], tp: [40, 28], conn: [55, 6], pack: [74, 21] } },
    ),
    place('3V3', ldoRail({ vin: 3.8, cin: 'C-1U' }), [2, 36], { vin: 'VSYS', out: '3V3' }, { reg: 'U2', cin: 'C3', cout: 'C4', tp: 'TP3' }, {
      faults: false,
      outline: null,
      layout: { reg: [12, 45, 180], cin: [4, 41, 90], cout: [20, 47, 90], tp: [24, 40] },
    }),
  ],
  outlines: [
    { name: 'BATTERY', x: 50, y: 2, w: 42, h: 32 },
    { name: 'SoC', x: 2, y: 36, w: 46, h: 34 },
    { name: 'SCREEN / BACKLIGHT', x: 48, y: 36, w: 70, h: 34 },
  ],
  parts: [
    c('TP4', 'TP', 'USB', 4, 28, 0, { '1': 'GND' }, 'Ground'),
    c('U3', 'U-SOC-BTN', 'SoC', 32, 56, 0, {
      VDD: '3V3', BLEN: 'BL_EN_IO', BTN: 'BTN', CHG: 'CHG', LED: 'LED_IO',
      NC6: 'U3_NC6', NC7: 'U3_NC7', NC8: 'U3_NC8', NC9: 'U3_NC9', NC10: 'U3_NC10', NC11: 'U3_NC11', NC12: 'U3_NC12', NC13: 'U3_NC13', NC14: 'U3_NC14', NC15: 'U3_NC15',
      GND: 'GND',
    }, 'Main SoC'),
    c('C5', 'C-100N', 'SoC', 22, 56, 90, { '1': '3V3', '2': 'GND' }, 'SoC decoupling'),
    c('R7', 'R-10K', 'SoC', 42, 44, 0, { '1': '3V3', '2': 'CHG' }, 'Charge-status pull-up'),
    c('R8', 'R-220R', 'SoC', 6, 55, 90, { '1': 'LED_IO', '2': 'CHG_LED_A' }, 'Charge LED resistor'),
    c('D2', 'LED-RED', 'SoC', 6, 63, 90, { A: 'CHG_LED_A', K: 'GND' }, 'Charge light'),
    c('R9', 'R-10K', 'SoC', 16, 63, 90, { '1': '3V3', '2': 'BTN' }, 'Button pull-up'),
    c('SW1', 'SW-TACT', 'SoC', 25, 66, 0, { '1': 'BTN', '2': 'GND' }, 'Power button'),
    c('R5', 'R-100R', 'SCREEN', 44, 64, 0, { '1': 'BL_EN_IO', '2': 'Q1_G' }, 'Q1 gate resistor'),
    c('R6', 'R-100K', 'SCREEN', 50, 68, 0, { '1': 'Q1_G', '2': 'GND' }, 'Q1 gate pull-down'),
    c('Q1', 'Q-NFET', 'SCREEN', 56, 60, 0, { G: 'Q1_G', S: 'GND', D: 'BL_K' }, 'Backlight switch'),
    c('C6', 'C-1U', 'SCREEN', 53, 42, 90, { '1': 'VSYS_BL', '2': 'GND' }, 'Backlight supply capacitor'),
    c('R4', 'R-33R-1206', 'SCREEN', 60, 44, 0, { '1': 'VSYS_BL', '2': 'BL_A' }, 'Backlight current resistor'),
    c('J3', 'J-FPC2', 'SCREEN', 68, 52, 0, { 'BL+': 'BL_A', 'BL-': 'BL_K' }, 'Screen ribbon connector'),
    c('TP5', 'TP', 'SCREEN', 62, 66, 0, { '1': 'BL_K' }, 'Backlight return'),
    c('LCD1', 'M-SCREEN-B', 'SCREEN', 95, 52, 0, { 'BL+': 'LCD1_A', 'BL-': 'LCD1_K' }, 'Screen module', 'J3'),
  ],
  traces: [{ id: 'T1', a: 'VSYS', b: 'VSYS_BL' }],
  testPoints: [
    { ref: 'TP1', net: 'VBUS', expected: '5 V with the charger plugged in' },
    { ref: 'TP2', net: 'VSYS', expected: '3.7–4.2 V (battery)' },
    { ref: 'TP3', net: '3V3', expected: '3.3 V' },
    { ref: 'TP5', net: 'BL_K', expected: '≈0 V with the screen on' },
    { ref: 'TP4', net: 'GND', expected: '0 V' },
  ],
  rails: [
    { net: 'VBUS', nominal: 5, label: 'VBUS' },
    { net: 'VSYS', nominal: 3.8, label: 'VSYS' },
    { net: '3V3', nominal: 3.3, label: '3V3' },
  ],
  nets: {
    GND: { desc: 'Ground', expected: 0 },
    'USB_VIN': { desc: 'USB 5 V straight from the port', expected: 5 },
    VBUS: { desc: 'USB 5 V after the fuse', expected: 5 },
    'CHG_S': { desc: 'USB 5 V after the current-sense resistor, into the charger', expected: 5 },
    'USB_CC': { desc: 'USB-C configuration pin' },
    VSYS: { desc: 'Battery / system rail — the battery voltage, a little higher while charging', expected: 3.8 },
    VSYS_BL: { desc: 'Battery rail feeding the backlight', expected: 3.8 },
    '3V3': { desc: '3.3 V for the SoC', expected: 3.3 },
    CHG: { desc: 'Charge status — the charger pulls this low while charging' },
    LED_IO: { desc: 'SoC charge-light output' },
    CHG_LED_A: { desc: 'Charge light anode' },
    BTN: { desc: 'Power button — high normally, low while pressed', expected: 3.3 },
    BL_EN_IO: { desc: 'SoC backlight-enable output (high when on)' },
    Q1_G: { desc: 'Backlight MOSFET gate (high = screen on)' },
    BL_A: { desc: 'Backlight anode (≈ battery voltage)' },
    BL_K: { desc: 'Backlight cathode — pulled to ground by Q1 when the screen is on' },
  },
  input: {
    ref: 'J1',
    plus: 'VBUS',
    minus: 'GND',
    adapter: { v: 5.1, ilim: 2, rint: 0.1, label: "the owner's USB-C charger" },
    psuV: 5,
    psuI: 1.5,
  },
  ground: 'TP4',
  controls: [{ ref: 'SW1', label: 'Power button' }],
  firmware: {
    ref: 'U3',
    vmin: 2.8,
    vmax: 4.2,
    inputs: ['BTN', 'CHG'],
    boot: () => ({ on: 0 }),
    step(state, inputs, prev) {
      if (!inputs.BTN && prev.BTN) state.on = state.on ? 0 : 1;
      return { BLEN: state.on === 1, LED: !inputs.CHG };
    },
  },
  functional,
  complain,
  status(b, op) {
    if (!op) return [];
    const scr = Math.max(0, op.current('LCD1'));
    return [
      { label: 'Console', value: b.mcu.running && b.mcu.state.on ? 'on' : b.mcu.running ? 'off (standby)' : 'no power', ok: !!(b.mcu.running && b.mcu.state.on) },
      { label: 'Screen backlight', value: scr > 0.012 ? 'lit' : 'dark', ok: scr > 0.012 },
      { label: 'Charge light (red)', value: op.current('D2') > 5e-4 ? 'on (charging)' : 'off', ok: op.current('D2') > 5e-4 },
      { label: 'Battery rail', value: `${op.net('VSYS').toFixed(2)} V` },
    ];
  },
  variants: VARIANTS,
  missable: ['C1', 'C2', 'C4', 'C5', 'C6', 'D2', 'R8', 'SW1', 'BT1'],
  carbonise: [
    ['VSYS', 'GND', 'C2'],
    ['VBUS', 'GND', 'D1'],
  ],
  marketValue: 140,
  quoteBase: 40,
  minReputation: 0,
});

const lit = (op: OperatingPoint, ref: string, min: number) => op.current(ref) > min;

/** On battery: switch on, check the screen, switch off. Then plug the charger in. */
function functional(b: BoardState): FunctionalReport {
  const s = customerSession(b, { kind: 'off' });
  s.settle();
  const op1 = s.press('SW1');
  const on = b.mcu.running && b.mcu.state.on === 1;
  const screen = lit(op1, 'LCD1', 0.012);
  s.press('SW1');
  const op3 = s.setPower({ kind: 'adapter' });
  const charging = lit(op3, 'D2', 5e-4);
  const inputCurrent = op3.srcI;
  const op4 = s.press('SW1');
  const worksPlugged = lit(op4, 'LCD1', 0.012);
  s.end();
  const checks = [
    { label: 'Switches on with the power button (on battery)', ok: on },
    { label: 'Screen lights up', ok: screen },
    { label: 'Charges when plugged in (red light on)', ok: charging },
  ];
  return { checks, facts: { on, screen, charging, worksPlugged }, inputCurrent, events: s.events, passed: checks.every((x) => x.ok) && !s.events.length };
}

function complain(r: FunctionalReport, events: DamageEvent[], rng: Rng): string {
  const f = r.facts as Record<string, boolean>;
  const hot = events.length ? ' It got hot.' : '';
  if (!f.on && f.worksPlugged) return 'It only works when it is plugged in.' + hot;
  if (!f.on && !f.charging) return rng.pick(['Completely dead. Will not turn on or charge.', 'Nothing happens at all, even on the charger.']) + hot;
  if (f.on && !f.screen) return rng.pick(['It turns on — I hear the startup sound — but the screen stays black.', 'Sound works but there is no picture on the screen.']) + hot;
  if (!f.charging) return 'It will not charge — the charge light never comes on.' + hot;
  return 'Something is off with it.' + hot;
}
