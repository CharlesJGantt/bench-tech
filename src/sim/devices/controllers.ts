/**
 * Game controllers (fictional): DualPulse (USB-C + Li-ion, touchpad, light bar), Sbox
 * controller (2 × AA) and Button Grips (rail contacts charge a small pack). One factory,
 * one board (110 × 64 mm): power → MCU, two analog sticks, face buttons on membranes,
 * a trigger with a return spring, a wireless chip with its link light.
 */
import { device, place } from '../blocks/core';
import { liIonCharger, usbInput } from '../blocks/usb';
import { c, type ComponentDef, type DeviceDef } from '../board';
import { customerSession, type BoardState, type DamageEvent, type FunctionalReport, type OperatingPoint } from '../circuit';
import { tarnish } from '../contacts';
import { addMark, liquidDamage, type Rng, type Variant } from '../faults';
import { cx } from './retro';

interface PadSpec {
  id: string;
  name: string;
  tagline: string;
  power: 'usbc' | 'aa' | 'rail';
  sticks: 1 | 2;
  touchpad: boolean;
  marketValue: number;
  quoteBase: number;
  minReputation: number;
}

/** Stick wiper position as a fraction of the supply (0.5 = centred). */
function stickPos(op: OperatingPoint, net: string): number {
  const v = op.net('VCC');
  return v > 0.5 ? op.net(net) / v : 0.5;
}

function controller(sp: PadSpec): DeviceDef {
  const battery = sp.power === 'aa' ? 'BATT_P' : 'BAT';
  const parts: ComponentDef[] = [
    c('SW1', 'SW-SLIDE', 'POWER', 40, 6, 0, { '1': battery, '2': 'VCC' }, 'Battery switch'),
    c('C1', 'C-10U-6', 'POWER', 52, 6, 0, { '1': 'VCC', '2': 'GND' }, 'Supply capacitor'),
    c('TP1', 'TP', 'POWER', 34, 14, 0, { '1': 'GND' }, 'Ground'),
    c('TP2', 'TP', 'POWER', 60, 6, 0, { '1': 'VCC' }, 'Supply'),
    cx('U2', 'U-PAD-MCU', 'MCU', 55, 28, 0, { VDD: 'VCC', GND: 'GND', HOME: 'HOME', BA: 'BA', BB: 'BB', TRIG: 'TRIG', TPD: 'TPD', BTEN: 'BTEN', LED: 'LED_IO', TEN: 'TEN' }, 'Controller MCU'),
    c('SW2', 'SW-TACT', 'BUTTONS', 55, 46, 0, { '1': 'HOME', '2': 'GND' }, 'Home / power button'),
    c('SW3', 'SW-TACT', 'BUTTONS', 92, 16, 0, { '1': 'BA', '2': 'GND' }, 'Face button A (membrane)'),
    c('SW4', 'SW-TACT', 'BUTTONS', 102, 26, 0, { '1': 'BB', '2': 'GND' }, 'Face button B (membrane)'),
    c('SW5', 'SW-TRIG', 'BUTTONS', 100, 56, 0, { '1': 'TRIG', '2': 'GND' }, 'Trigger (switch + return spring)'),
    c('R2', 'R-10K', 'BUTTONS', 63, 40, 90, { '1': 'VCC', '2': 'HOME' }, 'Home pull-up'),
    c('R3', 'R-10K', 'BUTTONS', 80, 12, 90, { '1': 'VCC', '2': 'BA' }, 'A pull-up'),
    c('R4', 'R-10K', 'BUTTONS', 84, 26, 90, { '1': 'VCC', '2': 'BB' }, 'B pull-up'),
    c('R5', 'R-10K', 'BUTTONS', 96, 46, 90, { '1': 'VCC', '2': 'TRIG' }, 'Trigger pull-up'),
    cx('STK1', 'M-STICK', 'STICKS', 22, 46, 0, { VCC: 'VCC', GND: 'GND', X: 'STK1_X', Y: 'STK1_Y' }, 'Left analog stick'),
    cx('U3', 'U-BT', 'RADIO', 74, 6, 0, { VCC: 'VCC', GND: 'GND', EN: 'BTEN', LINK: 'LINK' }, 'Wireless chip'),
    c('R6', 'R-220R', 'RADIO', 84, 4, 0, { '1': 'LINK', '2': 'LINK_A' }, 'Link light resistor'),
    c('D1', 'LED-BLU', 'RADIO', 92, 4, 0, { A: 'LINK_A', K: 'GND' }, sp.touchpad ? 'Light bar (blue = connected)' : 'Link light'),
    c('R7', 'R-220R', 'RADIO', 40, 22, 90, { '1': 'LED_IO', '2': 'PWR_A' }, 'Power light resistor'),
    c('D2', 'LED-WHT', 'RADIO', 40, 30, 90, { A: 'PWR_A', K: 'GND' }, 'Power light'),
  ];
  if (sp.sticks === 2) parts.push(cx('STK2', 'M-STICK', 'STICKS', 78, 46, 0, { VCC: 'VCC', GND: 'GND', X: 'STK2_X', Y: 'STK2_Y' }, 'Right analog stick'));
  if (sp.touchpad)
    parts.push(
      c('J7', 'J-FPC4', 'TOUCH', 56, 12, 0, { VCC: 'VCC', TEN: 'TEN', TOUT: 'TPD', GND: 'GND' }, 'Touchpad ribbon connector'),
      c('TPAD1', 'M-TOUCHPAD', 'TOUCH', 56, 58, 0, { VCC: 'TPAD1_VCC', TEN: 'TPAD1_TEN', TOUT: 'TPAD1_TOUT', GND: 'TPAD1_GND' }, 'Touchpad', 'J7'),
      c('R8', 'R-100K', 'TOUCH', 66, 18, 90, { '1': 'TPD', '2': 'GND' }, 'Touchpad data pull-down'),
    );
  else parts.push(c('R8', 'R-10K', 'TOUCH', 66, 18, 90, { '1': 'VCC', '2': 'TPD' }, 'Touch input tie-high (no touchpad)'));
  if (sp.power === 'aa')
    parts.push(
      c('J1', 'J-AA2', 'BATT', 30, 58, 0, { '+': 'BATT_P', '-': 'GND' }, 'Battery springs'),
      c('BT1', 'M-AA2', 'BATT', 30, 30, 0, { '+': 'BT1_P', '-': 'BT1_N' }, '2 × AA batteries', 'J1'),
    );

  const blocks =
    sp.power === 'aa'
      ? []
      : [
          sp.power === 'usbc'
            ? place('USB', usbInput({ connector: 'usbc', tvs: 'D-TVS5' }), [2, 2], { out: 'VBUS' }, { conn: 'J6', tvs: 'D6', tp: 'TP6' }, { faults: true, outline: null, layout: { conn: [8, 8], tvs: [18, 6, 270], tp: [6, 18] } })
            : null,
          place('CHG', liIonCharger({ led: true, battery: true }), [2, 20], { vin: 'VBUS', bat: 'BAT', stat: 'CHG' }, { chg: 'U5', ledRes: 'R9', led: 'D5', cbat: 'C5', conn: 'J1', pack: 'BT1', tp: 'TP5' }, {
            faults: true,
            outline: null,
            layout: { chg: [26, 6], ledRes: [6, 26, 90], led: [12, 26, 90], cbat: [30, 14, 90], conn: [14, 34], pack: [24, 46], tp: [20, 18] },
          }),
        ].filter((x): x is NonNullable<typeof x> => !!x);
  if (sp.power === 'rail') parts.push(c('J6', 'J-HDR3', 'POWER', 8, 10, 90, { '5V': 'VBUS', DATA: 'RAIL_D', GND: 'GND' }, 'Rail contacts (to the console)'));

  const variants: Variant[] = [
    {
      id: 'stick-drift',
      family: 'Stick drift',
      tier: 1,
      weight: 2,
      apply(b, rng) {
        const ref = sp.sticks === 2 && rng.next() < 0.5 ? 'STK2' : 'STK1';
        const axis = rng.pick(['X', 'Y'] as const);
        b.comps[ref].fault = { type: 'drift', axis, pos: rng.next() < 0.5 ? rng.range(0.15, 0.3) : rng.range(0.7, 0.85) };
        return {
          summary: `The ${ref === 'STK1' ? 'left' : 'right'} stick's ${axis} potentiometer is worn: it rests off-centre, so the character walks by itself. Replace the stick module.`,
          refs: [ref],
          hint: 'With the controller on, measure each stick output: a centred stick sits at half the supply.',
          flavor: 'My character keeps walking on his own.',
        };
      },
    },
    {
      id: 'membrane-worn',
      family: 'Worn membrane',
      tier: 1,
      weight: 1.2,
      apply(b, rng) {
        const ref = rng.pick(['SW3', 'SW4']);
        b.comps[ref].fault = { type: 'open' };
        return { summary: `The ${ref === 'SW3' ? 'A' : 'B'} button's membrane contact is worn flat — pressing it no longer connects. Replace the button contact.`, refs: [ref], hint: 'Press each button and measure its line: it should drop to 0 V while pressed.', flavor: 'One of the buttons does nothing however hard I press.' };
      },
    },
    {
      id: 'trigger-spring',
      family: 'Broken spring',
      tier: 1,
      weight: 1,
      apply(b) {
        b.comps.SW5.fault = { type: 'short', r: 0.2 };
        addMark(b, 'SW5', 'loose');
        return { summary: 'The trigger return spring snapped: the trigger stays pressed down. Replace the trigger mechanism.', refs: ['SW5'], hint: 'Is the trigger line low even when you are not touching it?', flavor: 'The trigger is floppy and the car just keeps accelerating.' };
      },
    },
    {
      id: 'radio-dead',
      family: 'Failed wireless chip',
      tier: 2,
      weight: 0.8,
      apply(b) {
        b.comps.U3.fault = { type: 'dead' };
        return { summary: 'The wireless chip U3 has died: the controller powers on but never connects. Replace U3 (small-chip rework: flux, hot air, tweezers).', refs: ['U3'], hint: 'Power light on, link light never comes on. Is the wireless chip powered and enabled (EN)? Does LINK ever go high?', flavor: 'It lights up but will not pair any more.' };
      },
    },
    {
      id: 'liquid',
      family: 'Liquid damage',
      tier: 2,
      weight: 0.7,
      apply(b, rng) {
        liquidDamage(b, rng, ['SW3', 'R3'], 0.35, 0.5);
        b.comps.SW3.corr!.pins['1'] = 0.97;
        return { summary: 'Soda got under the buttons: corrosion has eaten through the A-button contact. Clean the corrosion (cleaner, scrub, IPA).', refs: ['SW3'], hint: 'Sticky buttons and one dead. Look under the membrane for crust.', flavor: 'My little brother spilled cola on it. The A button stopped working.' };
      },
    },
  ];
  if (sp.touchpad)
    variants.push({
      id: 'touchpad-ribbon',
      family: 'Torn ribbon',
      tier: 1,
      weight: 1,
      apply(b) {
        b.comps.TPAD1.fault = { type: 'dead' };
        return { summary: 'The touchpad ribbon is torn, so the touchpad and its click are dead. Replace the touchpad assembly.', refs: ['TPAD1'], hint: 'Touchpad does nothing. Open it up and look at the touchpad ribbon.', flavor: 'The touchpad button does not click any more.' };
      },
    });
  if (sp.power === 'aa')
    variants.push({
      id: 'spring-tarnish',
      family: 'Dirty contacts',
      tier: 1,
      weight: 1,
      apply(b, rng) {
        tarnish(b, 'J1', rng.range(0.93, 0.99), () => rng.next());
        return { summary: 'The battery contacts are oxidised: fresh batteries make no contact. Scrub and Pad-Bright the springs.', refs: ['J1'], hint: 'Fresh batteries in and nothing. Measure on the springs.', flavor: 'New batteries and it is dead.' };
      },
    });
  if (sp.power === 'rail')
    variants.push({
      id: 'rail-tarnish',
      family: 'Dirty contacts',
      tier: 1,
      weight: 1,
      apply(b, rng) {
        tarnish(b, 'J6', rng.range(0.93, 0.99), () => rng.next());
        return { summary: 'The rail contacts are dirty and oxidised, so it never charges on the console. Scrub and Pad-Bright the rail contacts.', refs: ['J6'], hint: 'Slide it on the console: does 5 V reach the charger?', flavor: 'It will not charge when I slide it onto the console.' };
      },
    });

  const state = (_b: BoardState, op: OperatingPoint) => {
    const sticks = ['STK1', ...(sp.sticks === 2 ? ['STK2'] : [])].flatMap((s) => [`${s}_X`, `${s}_Y`]);
    return {
      on: op.current('D2') > 3e-4,
      linked: op.current('D1') > 3e-4,
      centred: sticks.every((n) => Math.abs(stickPos(op, n) - 0.5) < 0.08),
      triggerIdle: op.net('TRIG') > 0.5 * op.net('VCC'),
      touch: op.net('TPD') > 0.5 * op.net('VCC'),
    };
  };

  function functional(b: BoardState): FunctionalReport {
    const s = customerSession(b, { kind: 'off' });
    s.settle();
    s.press('SW2');
    const op = s.settle();
    const st = state(b, op);
    // Press each face button: its line must drop
    const presses: Record<string, boolean> = {};
    for (const [sw, net] of [
      ['SW3', 'BA'],
      ['SW4', 'BB'],
    ]) {
      b.pressed = [sw];
      const o = s.settle();
      presses[sw] = o.net(net) < 0.3 * o.net('VCC') && o.net('VCC') > 2.5;
      b.pressed = [];
    }
    let charging = true;
    if (sp.power !== 'aa') {
      const op2 = s.setPower({ kind: 'adapter' });
      charging = op2.current('D5') > 5e-4;
    }
    s.end();
    const checks = [
      { label: 'Turns on with the home button', ok: st.on },
      { label: 'Connects (link light)', ok: st.linked },
      { label: 'Sticks rest centred (no drift)', ok: st.centred },
      { label: 'Every button works', ok: presses.SW3 && presses.SW4 && st.triggerIdle },
      ...(sp.touchpad ? [{ label: 'Touchpad works', ok: st.touch }] : []),
      ...(sp.power !== 'aa' ? [{ label: 'Charges', ok: charging }] : []),
    ];
    return { checks, facts: { ...st, buttons: presses.SW3 && presses.SW4, charging }, inputCurrent: op.srcI, events: s.events, passed: checks.every((x) => x.ok) && !s.events.length };
  }

  function complain(r: FunctionalReport, events: DamageEvent[], rng: Rng): string {
    const f = r.facts as Record<string, boolean>;
    const hot = events.length ? ' It got warm.' : '';
    if (!f.on) return rng.pick(['Completely dead.', 'Will not turn on.']) + hot;
    if (!f.linked) return 'Lights up but will not connect.' + hot;
    if (!f.centred) return 'The stick drifts — my character walks on his own.' + hot;
    if (!f.triggerIdle) return 'The trigger is stuck down.' + hot;
    if (!f.buttons) return 'A button does not work.' + hot;
    if (!f.touch) return 'The touchpad does not work.' + hot;
    if (!f.charging) return 'It will not charge.' + hot;
    return 'It acts up.' + hot;
  }

  const sticksNets: DeviceDef['nets'] = {};
  for (const s of ['STK1', ...(sp.sticks === 2 ? ['STK2'] : [])])
    for (const a of ['X', 'Y']) sticksNets[`${s}_${a}`] = { desc: `${s === 'STK1' ? 'Left' : 'Right'} stick ${a} (half the supply when centred)` };

  return device({
    id: sp.id,
    name: sp.name,
    category: 'Controller',
    tagline: sp.tagline,
    width: 110,
    height: 64,
    blocks,
    outlines: [
      { name: 'MCU', x: 44, y: 18, w: 24, h: 22 },
      { name: 'BUTTONS', x: 82, y: 8, w: 26, h: 26 },
    ],
    parts,
    traces: [],
    testPoints: [
      { ref: 'TP1', net: 'GND', expected: '0 V' },
      { ref: 'TP2', net: 'VCC', expected: sp.power === 'aa' ? '≈3 V' : '3.7–4.2 V' },
    ],
    rails: [{ net: 'VCC', nominal: sp.power === 'aa' ? 3 : 3.8, label: 'VCC' }],
    nets: {
      GND: { desc: 'Ground', expected: 0 },
      VCC: { desc: 'Supply after the battery switch', power: true, expected: sp.power === 'aa' ? 3 : 3.8 },
      HOME: { desc: 'Home button (low when pressed)' },
      BA: { desc: 'Button A (low when pressed)' },
      BB: { desc: 'Button B (low when pressed)' },
      TRIG: { desc: 'Trigger (low when pressed)' },
      TPD: { desc: 'Touch input (high = touchpad OK)' },
      BTEN: { desc: 'Wireless enable from the MCU' },
      LINK: { desc: 'Wireless linked (drives the link light)' },
      ...sticksNets,
    },
    input:
      sp.power === 'usbc'
        ? { ref: 'J6', plus: 'VBUS', minus: 'GND', adapter: { v: 5.1, ilim: 1.5, rint: 0.15, label: 'a USB-C charger' }, psuV: 5, psuI: 1 }
        : sp.power === 'rail'
          ? { ref: 'J6', plus: '5V', minus: 'GND', adapter: { v: 5, ilim: 1, rint: 0.15, label: 'the console rail' }, psuV: 5, psuI: 0.5 }
          : { ref: 'J1', plus: '+', minus: '-', adapter: { v: 3, ilim: 1, rint: 0.2, label: 'fresh batteries' }, psuV: 3, psuI: 0.5 },
    ground: 'TP1',
    controls: [
      { ref: 'SW2', label: 'Home button' },
      { ref: 'SW3', label: 'A' },
      { ref: 'SW4', label: 'B' },
      { ref: 'SW5', label: 'Trigger' },
    ],
    firmware: {
      ref: 'U2',
      vmin: 2.6,
      vmax: 4.4,
      inputs: ['HOME'],
      boot: () => ({ on: 0 }),
      step(state, inputs, prev) {
        if (!inputs.HOME && prev.HOME) state.on = 1;
        const on = state.on === 1;
        return { BTEN: on, LED: on, TEN: on };
      },
    },
    functional,
    complain,
    status(b, op) {
      if (!op) return [];
      const st = state(b, op);
      return [
        { label: 'Power light', value: st.on ? 'on' : 'off', ok: st.on },
        { label: sp.touchpad ? 'Light bar' : 'Link light', value: st.linked ? 'connected' : 'searching / off', ok: st.linked },
        { label: 'Sticks', value: st.centred ? 'centred' : 'drifting', ok: st.centred },
        ...(sp.touchpad ? [{ label: 'Touchpad', value: st.touch ? 'responds' : 'dead', ok: st.touch }] : []),
      ];
    },
    variants,
    missable: ['C1', 'TP2'],
    carbonise: [['VCC', 'GND', 'C1']],
    marketValue: sp.marketValue,
    quoteBase: sp.quoteBase,
    minReputation: sp.minReputation,
  });
}

export const DUALPULSE = controller({ id: 'dualpulse', name: 'DualPulse Controller', tagline: 'Funstation 5 pad: touchpad, light bar, drifting sticks.', power: 'usbc', sticks: 2, touchpad: true, marketValue: 45, quoteBase: 22, minReputation: 0 });
export const SBOX_PAD = controller({ id: 'sbox-pad', name: 'Sbox Wireless Controller', tagline: 'The AA-powered Sbox pad.', power: 'aa', sticks: 2, touchpad: false, marketValue: 35, quoteBase: 20, minReputation: 0 });
export const BUTTON_GRIP = controller({ id: 'button-grip', name: 'Button Grip (left)', tagline: 'Slide-on Button controller: one stick, rail contacts, notorious drift.', power: 'rail', sticks: 1, touchpad: false, marketValue: 30, quoteBase: 20, minReputation: 0 });
