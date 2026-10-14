/**
 * BoomPuck Mini — a small Bluetooth speaker. Micro-USB in, Li-ion charger, battery
 * pack on a plug, 3.3 V LDO, MCU with power button, class-D amp, speaker on a plug.
 * Fictional product.
 */
import { c } from '../board';
import { device, place } from '../blocks/core';
import { ldoRail } from '../blocks/power';
import { liIonCharger, usbInput } from '../blocks/usb';
import { customerSession, type BoardState, type DamageEvent, type FunctionalReport, type OperatingPoint } from '../circuit';
import { addMark, type Rng, type Variant } from '../faults';

const VARIANTS: Variant[] = [
  {
    id: 'bt-chip-dead',
    family: 'Failed wireless chip',
    tier: 2,
    weight: 0.9,
    apply(b) {
      b.comps.U5.fault = { type: 'dead' };
      return {
        summary: 'The Bluetooth chip U5 has died: it powers on but never pairs, so nothing plays. Replace U5 (small-chip rework: flux, hot air, tweezers).',
        refs: ['U5'],
        hint: 'Blue power light on, link light never. Is the Bluetooth chip powered and enabled? Does it ever signal a link?',
        flavor: 'It turns on but my phone cannot find it any more.',
      };
    },
  },
  {
    id: 'musb-loose',
    family: 'Damaged connector',
    tier: 1,
    weight: 1,
    apply(b) {
      b.comps.J1.fault = { type: 'pins-open', pins: ['VBUS'] };
      addMark(b, 'J1', 'loose');
      return {
        summary: 'The micro-USB port is worn out: its power pin no longer touches the plug. Replace the port.',
        refs: ['J1'],
        hint: 'Plug the charger in and measure VBUS on the port pins themselves, then right behind them.',
        flavor: 'The charging cable only works if I hold it at an angle. Now it does not charge at all.',
      };
    },
  },
  {
    id: 'musb-ripped',
    family: 'Ripped-off port',
    tier: 2,
    weight: 0.8,
    apply(b) {
      b.comps.J1.part = null;
      b.liftedPads.push('J1.VBUS', 'J1.GND');
      addMark(b, 'J1', 'scratch');
      return {
        summary: 'The micro-USB port was ripped off by a yanked cable and took its VBUS and GND pads with it. Fit a new port and wire the torn pads back to their connections.',
        refs: ['J1'],
        hint: 'Two pads are gone. Fit the port, then run jumper wires from its legs to the nearest point on the same connections (the service sheet shows where VBUS and GND go).',
        flavor: 'Someone tripped over the charging cable and the plug came off with the socket still in it.',
      };
    },
  },
  {
    id: 'speaker-joint',
    family: 'Cracked solder joint',
    tier: 1,
    weight: 1,
    apply(b, rng) {
      const pin = rng.pick(['1', '2']);
      b.comps.J3.joints[pin] = { r: Infinity, cracked: true };
      return {
        summary: `The speaker connector J3 has a cracked joint on pin ${pin}. Reflow it.`,
        refs: ['J3'],
        hint: 'No sound but the amp seems alive? Check continuity from the amp outputs to the speaker plug.',
        flavor: 'The sound cut in and out when I moved it, now there is no sound at all.',
      };
    },
  },
  {
    id: 'speaker-blown',
    family: 'Blown speaker',
    tier: 1,
    weight: 0.8,
    apply(b) {
      b.comps.SPK1.fault = { type: 'open' };
      return {
        summary: 'The speaker voice coil is burnt open (it should read about 4 Ω). Fit a new speaker.',
        refs: ['SPK1'],
        hint: 'Unplug the speaker and measure across its contacts with the Ω setting.',
        flavor: 'I turned it all the way up at a party and it crackled and went quiet.',
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
        summary: 'The battery pack is worn out (low voltage, high internal resistance). Fit a new pack.',
        refs: ['BT1'],
        hint: 'Unplug the charger and measure the battery voltage. A healthy pack sits around 3.7–4.2 V.',
        flavor: 'It only works when it is plugged in.',
      };
    },
  },
  {
    id: 'amp-dead',
    family: 'Failed amp IC',
    tier: 2,
    weight: 0.8,
    apply(b) {
      b.comps.U4.fault = { type: 'dead' };
      return {
        summary: 'The audio amp U4 died: it has power and is enabled, but its outputs do nothing.',
        refs: ['U4'],
        hint: 'With it switched on: is there battery voltage on the amp VDD pin? Is EN high? Do OUT+ and OUT− differ?',
      };
    },
  },
  {
    id: 'charger-dead',
    family: 'Failed charger IC',
    tier: 2,
    weight: 0.8,
    apply(b) {
      b.comps.U1.fault = { type: 'dead' };
      return {
        summary: 'The charger IC U1 died: 5 V goes in but nothing reaches the battery.',
        refs: ['U1'],
        hint: 'Plug the charger in. Is there 5 V on U1 VBUS? Does the BAT pin rise above the battery voltage?',
      };
    },
  },
  {
    id: 'amp-cap-short',
    family: 'Shorted capacitor',
    tier: 2,
    weight: 0.7,
    apply(b, rng) {
      const r = rng.range(0.2, 0.8);
      b.comps.C5.fault = { type: 'short', r };
      return {
        summary: `Capacitor C5 on the battery rail failed short (${r.toFixed(2)} Ω), dragging the whole battery rail down.`,
        refs: ['C5'],
        hint: 'Unplug the battery, then measure resistance from the battery rail to ground. Inject a little voltage and feel for the hot part.',
        flavor: 'It got really hot near the speaker and died.',
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
        flavor: 'It kept switching itself off, now it will not turn on.',
      };
    },
  },
];

export const BOOMPUCK = device({
  id: 'boompuck',
  name: 'BoomPuck Mini Bluetooth Speaker',
  category: 'Audio',
  tagline: 'Pocket Bluetooth speaker — battery, charging port and a little amp.',
  width: 90,
  height: 64,
  blocks: [
    place('USB', usbInput({ connector: 'micro', tvs: 'D-TVS5', cin: 'C-10U-25' }), [2, 2], { out: 'VBUS' }, { conn: 'J1', tvs: 'D1', cin: 'C1', tp: 'TP1' }, {
      faults: false,
      outline: { name: 'USB INPUT / CHARGER', x: 2, y: 2, w: 42, h: 28 },
      layout: { conn: [10, 5], tvs: [18, 13, 270], cin: [24, 13, 90], tp: [12, 26] },
    }),
    place(
      'CHG',
      liIonCharger({ led: true, battery: true }),
      [20, 2],
      { vin: 'VBUS', bat: 'BAT', stat: 'CHG' },
      { chg: 'U1', ledRes: 'R2', led: 'D2', cbat: 'C2', conn: 'J2', pack: 'BT1', tp: 'TP2' },
      { faults: false, outline: null, layout: { chg: [32, 13], ledRes: [22, 21], led: [29, 21], cbat: [38, 21, 90], conn: [48, 6], pack: [68, 18], tp: [44, 27] } },
    ),
    place('3V3', ldoRail({ vin: 3.8, cin: 'C-1U' }), [2, 32], { vin: 'BAT', out: '3V3' }, { reg: 'U2', cin: 'C3', cout: 'C4', tp: 'TP3' }, {
      faults: false,
      outline: null,
      layout: { reg: [14, 40, 180], cin: [5, 38, 90], cout: [23, 38, 90], tp: [30, 33] },
    }),
  ],
  outlines: [
    { name: 'BATTERY', x: 44, y: 2, w: 44, h: 28 },
    { name: 'MCU', x: 2, y: 32, w: 38, h: 30 },
    { name: 'AMP / SPEAKER', x: 40, y: 32, w: 48, h: 30 },
  ],
  parts: [
    c('TP4', 'TP', 'USB', 4, 26, 0, { '1': 'GND' }, 'Ground'),
    c('U3', 'U-PIC8-SPK', 'MCU', 17, 54, 0, { VDD: '3V3', LED: 'LED_IO', AMPEN: 'AMP_EN', BTN: 'BTN', CHG: 'CHG', BTEN: 'BT_EN', NC7: 'U3_NC7', GND: 'GND' }, 'Speaker controller'),
    c('U5', 'U-BT', 'AMP', 68, 36, 0, { VCC: '3V3', GND: 'GND', EN: 'BT_EN', LINK: 'BT_LINK', NC5: 'U5_NC5', NC6: 'U5_NC6' }, 'Bluetooth chip'),
    c('R7', 'R-1K', 'AMP', 76, 36, 0, { '1': 'BT_LINK', '2': 'BT_LED_A' }, 'Link light resistor'),
    c('D4', 'LED-BLU', 'AMP', 84, 36, 90, { A: 'BT_LED_A', K: 'GND' }, 'Bluetooth link light'),
    c('R3', 'R-220R', 'MCU', 6, 49, 90, { '1': 'LED_IO', '2': 'PWR_LED_A' }, 'Power LED resistor'),
    c('D3', 'LED-BLU', 'MCU', 6, 57, 90, { A: 'PWR_LED_A', K: 'GND' }, 'Power LED (blue)'),
    c('R4', 'R-10K', 'MCU', 28, 47, 90, { '1': '3V3', '2': 'BTN' }, 'Button pull-up'),
    c('R5', 'R-10K', 'MCU', 28, 56, 90, { '1': '3V3', '2': 'CHG' }, 'Charge-status pull-up'),
    c('SW1', 'SW-TACT', 'MCU', 35, 53, 90, { '1': 'BTN', '2': 'GND' }, 'Power button'),
    c('C5', 'C-22U-10', 'AMP', 46, 40, 90, { '1': 'BAT', '2': 'GND' }, 'Amp supply capacitor'),
    c('U4', 'U-SA8002', 'AMP', 56, 47, 0, { VDD: 'BAT', EN: 'AMP_EN', NC3: 'U4_NC3', NC4: 'U4_NC4', OUTP: 'SPK_P', OUTN: 'SPK_N', NC7: 'U4_NC7', GND: 'GND' }, 'Class-D audio amp'),
    c('R6', 'R-100K', 'AMP', 46, 53, 90, { '1': 'AMP_EN', '2': 'GND' }, 'Amp enable pull-down'),
    c('J3', 'J-JST2', 'AMP', 56, 58, 0, { '1': 'SPK_P', '2': 'SPK_N' }, 'Speaker connector'),
    c('SPK1', 'M-SPK4', 'AMP', 77, 50, 0, { '1': 'SPK1_A', '2': 'SPK1_B' }, 'Speaker', 'J3'),
  ],
  traces: [],
  testPoints: [
    { ref: 'TP1', net: 'VBUS', expected: '5 V when the charger is plugged in' },
    { ref: 'TP2', net: 'BAT', expected: '3.7–4.2 V (battery)' },
    { ref: 'TP3', net: '3V3', expected: '3.3 V' },
    { ref: 'TP4', net: 'GND', expected: '0 V' },
  ],
  rails: [
    { net: 'VBUS', nominal: 5, label: 'VBUS' },
    { net: 'BAT', nominal: 3.8, label: 'BAT' },
    { net: '3V3', nominal: 3.3, label: '3V3' },
  ],
  nets: {
    GND: { desc: 'Ground', expected: 0 },
    VBUS: { desc: 'USB 5 V from the charging port (only with the charger plugged in)', expected: 5 },
    BAT: { desc: 'Battery rail — the battery voltage, a bit higher while charging', expected: 3.8 },
    '3V3': { desc: '3.3 V rail for the microcontroller', expected: 3.3 },
    CHG: { desc: 'Charge status — pulled low by the charger while it is charging' },
    CHG_LED: { desc: 'Charge LED anode' },
    LED_IO: { desc: 'MCU power-LED output (high when switched on)' },
    PWR_LED_A: { desc: 'Power LED anode' },
    BTN: { desc: 'Power button — high normally, low while pressed', expected: 3.3 },
    AMP_EN: { desc: 'Amp enable from the MCU (high when switched on)' },
    BT_EN: { desc: 'Bluetooth chip enable from the MCU' },
    BT_LINK: { desc: 'Bluetooth linked to a phone (drives the link light)' },
    SPK_P: { desc: 'Amp output + (about half the battery voltage while playing)' },
    SPK_N: { desc: 'Amp output − (about half the battery voltage while playing)' },
    USB_DM: { desc: 'USB data (unused for charging)' },
    USB_DP: { desc: 'USB data (unused for charging)' },
  },
  input: {
    ref: 'J1',
    plus: 'VBUS',
    minus: 'GND',
    adapter: { v: 5.1, ilim: 1.5, rint: 0.15, label: "the owner's USB charger" },
    psuV: 5,
    psuI: 1,
  },
  ground: 'TP4',
  controls: [{ ref: 'SW1', label: 'Power button' }],
  firmware: {
    ref: 'U3',
    vmin: 2.8,
    vmax: 4.2,
    inputs: ['BTN'],
    boot: () => ({ on: 0 }),
    step(state, inputs, prev) {
      if (!inputs.BTN && prev.BTN) state.on = state.on ? 0 : 1;
      return { LED: state.on === 1, AMPEN: state.on === 1, BTEN: state.on === 1 };
    },
  },
  functional,
  complain,
  status(_b, op) {
    if (!op) return [];
    const spk = Math.abs(op.current('SPK1'));
    const bat = op.net('BAT');
    return [
      { label: 'Power light (blue)', value: op.current('D3') > 5e-4 ? 'on' : 'off', ok: op.current('D3') > 5e-4 },
      { label: 'Sound', value: spk > 0.04 ? `playing (${Math.round(spk * 1000)} mA)` : 'silent', ok: spk > 0.04 },
      { label: 'Charge light (red)', value: op.current('D2') > 5e-4 ? 'on (charging)' : 'off', ok: op.current('D2') > 5e-4 },
      { label: 'Battery rail', value: `${bat.toFixed(2)} V` },
    ];
  },
  variants: VARIANTS,
  missable: ['D2', 'D3', 'C1', 'C4', 'C5', 'R2', 'R3', 'SW1', 'SPK1'],
  carbonise: [
    ['BAT', 'GND', 'C5'],
    ['VBUS', 'GND', 'C1'],
  ],
  marketValue: 45,
  quoteBase: 25,
  minReputation: 0,
});

const on = (op: OperatingPoint, ref: string, min: number) => Math.abs(op.current(ref)) > min;

/** On battery: switch on, listen, switch off. Then plug the charger in. */
function functional(b: BoardState): FunctionalReport {
  const s = customerSession(b, { kind: 'off' });
  s.settle();
  const op1 = s.press('SW1');
  const powersOn = on(op1, 'D3', 5e-4);
  const sound = on(op1, 'SPK1', 0.04);
  const paired = on(op1, 'D4', 3e-4);
  s.press('SW1');
  const op3 = s.setPower({ kind: 'adapter' });
  const charging = on(op3, 'D2', 5e-4);
  const inputCurrent = op3.srcI;
  const op4 = s.press('SW1');
  const worksPlugged = on(op4, 'D3', 5e-4);
  s.end();
  const checks = [
    { label: 'Switches on with the power button (on battery)', ok: powersOn },
    { label: 'Pairs with a phone (link light)', ok: paired },
    { label: 'Plays sound through the speaker', ok: sound },
    { label: 'Charges when plugged in (red light on)', ok: charging },
  ];
  return {
    checks,
    facts: { powersOn, sound, charging, worksPlugged, paired },
    inputCurrent,
    events: s.events,
    passed: checks.every((x) => x.ok) && !s.events.length,
  };
}

function complain(r: FunctionalReport, events: DamageEvent[], rng: Rng): string {
  const f = r.facts as Record<string, boolean>;
  const hot = events.length ? ' It got hot before it died.' : '';
  if (!f.powersOn && f.worksPlugged) return 'It only works when it is plugged in.' + hot;
  if (!f.powersOn && !f.charging) return rng.pick(['Completely dead — will not turn on or charge.', 'Nothing. No lights, no sound, will not charge.']) + hot;
  if (f.powersOn && !f.paired) return 'It turns on but my phone cannot find it.' + hot;
  if (f.powersOn && !f.sound) return rng.pick(['It turns on (blue light) but no sound comes out.', 'Connects to my phone but plays nothing.']) + hot;
  if (!f.charging) return 'It will not charge any more — the red light never comes on.' + hot;
  return 'Something is not right with it.' + hot;
}
