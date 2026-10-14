/**
 * Modern handhelds (fictional): Button Lite, Retrobit RB35, Rogue Pal and the DuoScreen
 * family. One factory, one board (160 × 100 mm): USB → charger → Li-ion pack → 3.3 V LDO
 * → main chip (power-button latch) → screen(s) on ribbons, speaker amp, buttons; options
 * for a game-card slot, sticks + trigger, a Wi-Fi board and a camera that must answer
 * before the main chip finishes booting, and the RB35's bias-resistor charger switch.
 */
import { device, place } from '../blocks/core';
import { liIonCharger, usbInput } from '../blocks/usb';
import { c, type ComponentDef, type DeviceDef } from '../board';
import { customerSession, type BoardState, type DamageEvent, type FunctionalReport, type OperatingPoint } from '../circuit';
import { tarnish } from '../contacts';
import { addMark, liquidDamage, type Rng, type Variant } from '../faults';
import { cx, testCart } from './retro';

interface HandheldSpec {
  id: string;
  name: string;
  tagline: string;
  soc: string;
  usb: 'usbc' | 'micro';
  screens: 1 | 2;
  cardSlot?: boolean;
  sticks?: boolean;
  wifi?: boolean;
  camera?: boolean;
  /** RB35: the charger input goes through a P-FET held on by a bias resistor. */
  biasSwitch?: boolean;
  extraVariants?: (ids: { lcd: string[] }) => Variant[];
  marketValue: number;
  quoteBase: number;
  minReputation: number;
}

const TW = 160;
const TH = 100;

function handheld(sp: HandheldSpec): DeviceDef {
  const okPins = { OK1: '3V3', OK2: '3V3', OK3: '3V3', OK4: '3V3' } as Record<string, string>;
  const lcds = sp.screens === 2 ? ['LCD1', 'LCD2'] : ['LCD1'];
  okPins.OK1 = 'OK_LCD1';
  if (sp.screens === 2) okPins.OK2 = 'OK_LCD2';
  if (sp.wifi) okPins.OK3 = 'OK_WIFI';
  if (sp.camera) okPins.OK4 = 'OK_CAM';
  const chgIn = sp.biasSwitch ? 'CHG_IN' : 'VBUS';

  const parts: ComponentDef[] = [
    c('U2', 'U-HL33', 'POWER', 60, 10, 0, { IN: 'BAT', OUT: '3V3', GND: 'GND', TAB: '3V3' }, '3.3 V regulator'),
    c('C2', 'C-10U-6', 'POWER', 70, 18, 90, { '1': '3V3', '2': 'GND' }, '3.3 V capacitor'),
    c('TP1', 'TP', 'POWER', 4, 30, 0, { '1': 'GND' }, 'Ground'),
    c('TP2', 'TP', 'POWER', 58, 22, 0, { '1': '3V3' }, '3.3 V rail'),
    cx('U3', sp.soc, 'SOC', 62, 36, 0, { VDD: '3V3', GND: 'GND', PWR: 'PWR', BA: 'BA', DIN: 'DIN', LED: 'LED_IO', VEN: 'LCD_D', SND: 'SND', EN: 'MOD_EN', CE: 'CE', ...okPins }, 'Main chip'),
    c('SW1', 'SW-TACT', 'BUTTONS', 140, 12, 0, { '1': 'PWR', '2': 'GND' }, 'Power button'),
    c('R1', 'R-10K', 'BUTTONS', 128, 20, 90, { '1': '3V3', '2': 'PWR' }, 'Power button pull-up'),
    c('SW2', 'SW-TACT', 'BUTTONS', 140, 34, 0, { '1': 'BA', '2': 'GND' }, 'A button'),
    c('R2', 'R-10K', 'BUTTONS', 128, 34, 90, { '1': '3V3', '2': 'BA' }, 'A button pull-up'),
    c('R7', 'R-220R', 'BUTTONS', 150, 46, 90, { '1': 'LED_IO', '2': 'LED_A' }, 'Power light resistor'),
    c('D1', 'LED-GRN', 'BUTTONS', 150, 54, 90, { A: 'LED_A', K: 'GND' }, 'Power light'),
    cx('U4', 'U-SA8002', 'AUDIO', 100, 48, 0, { VDD: 'BAT', GND: 'GND', EN: 'SND', OUTP: 'SPK_P', OUTN: 'SPK_N' }, 'Speaker amp'),
    c('R8', 'R-100K', 'AUDIO', 88, 48, 90, { '1': 'SND', '2': 'GND' }, 'Amp enable pull-down'),
    c('J4', 'J-JST2', 'AUDIO', 116, 62, 0, { '1': 'SPK_P', '2': 'SPK_N' }, 'Speaker connector'),
    c('SPK1', 'M-SPK4', 'AUDIO', 134, 82, 0, { '1': 'SPK1_A', '2': 'SPK1_B' }, 'Speaker', 'J4'),
    c('J3', 'J-FPC-LCD', 'SCREEN', 40, 46, 0, { VCC: '3V3', DATA: 'LCD_D', OK: 'OK_LCD1', GND: 'GND' }, sp.screens === 2 ? 'Top screen ribbon connector' : 'Screen ribbon connector'),
    c('LCD1', 'M-HHLCD', 'SCREEN', 30, 78, 0, { VCC: 'LCD1_VCC', DATA: 'LCD1_DATA', OK: 'LCD1_OK', GND: 'LCD1_GND' }, sp.screens === 2 ? 'Top screen' : 'Screen', 'J3'),
    c('R10', 'R-100K', 'SCREEN', 52, 50, 90, { '1': 'OK_LCD1', '2': 'GND' }, 'Screen-OK pull-down'),
  ];
  if (sp.screens === 2)
    parts.push(
      c('J5', 'J-FPC-LCD', 'SCREEN', 76, 64, 0, { VCC: '3V3', DATA: 'LCD_D', OK: 'OK_LCD2', GND: 'GND' }, 'Bottom screen ribbon connector'),
      c('LCD2', 'M-HHLCD', 'SCREEN', 84, 86, 0, { VCC: 'LCD2_VCC', DATA: 'LCD2_DATA', OK: 'LCD2_OK', GND: 'LCD2_GND' }, 'Bottom screen', 'J5'),
      c('R11', 'R-100K', 'SCREEN', 66, 64, 90, { '1': 'OK_LCD2', '2': 'GND' }, 'Bottom-screen-OK pull-down'),
    );
  if (sp.wifi)
    parts.push(
      c('J8', 'J-FPC-MOD', 'BOARDS', 100, 24, 0, { VCC: '3V3', EN: 'MOD_EN', OK: 'OK_WIFI', GND: 'GND' }, 'Wi-Fi board connector'),
      c('WIFI1', 'M-WIFIB', 'BOARDS', 104, 34, 0, { VCC: 'WIFI1_VCC', EN: 'WIFI1_EN', OK: 'WIFI1_OK', GND: 'WIFI1_GND' }, 'Wi-Fi board', 'J8'),
      c('R12', 'R-100K', 'BOARDS', 90, 30, 90, { '1': 'OK_WIFI', '2': 'GND' }, 'Wi-Fi-OK pull-down'),
    );
  if (sp.camera)
    parts.push(
      c('J9', 'J-FPC-MOD', 'BOARDS', 120, 44, 0, { VCC: '3V3', EN: 'MOD_EN', OK: 'OK_CAM', GND: 'GND' }, 'Camera ribbon connector'),
      c('CAM1', 'M-CAM', 'BOARDS', 120, 92, 0, { VCC: 'CAM1_VCC', EN: 'CAM1_EN', OK: 'CAM1_OK', GND: 'CAM1_GND' }, 'Camera + ribbon', 'J9'),
      c('R13', 'R-100K', 'BOARDS', 110, 40, 90, { '1': '3V3', '2': 'OK_CAM' }, 'Camera-OK pull-up (no camera = fine)'),
    );
  if (sp.cardSlot)
    parts.push(
      c('J2', 'J-SLOT6', 'CARD', 100, 8, 0, { '5V': '3V3', GND: 'GND', CE: 'CE', D0: 'DIN', LKI: 'CARD_LKI', LKO: 'CARD_LKO' }, 'Game card slot'),
      c('R3', 'R-10K', 'CARD', 82, 24, 90, { '1': 'DIN', '2': 'GND' }, 'Card data pull-down'),
    );
  else parts.push(c('R3', 'R-10K', 'CARD', 82, 24, 90, { '1': '3V3', '2': 'DIN' }, 'Data tie-high (no card slot)'));
  if (sp.sticks)
    parts.push(
      cx('STK1', 'M-STICK', 'STICKS', 90, 74, 0, { VCC: '3V3', GND: 'GND', X: 'STK1_X', Y: 'STK1_Y' }, 'Left stick'),
      cx('STK2', 'M-STICK', 'STICKS', 140, 30, 0, { VCC: '3V3', GND: 'GND', X: 'STK2_X', Y: 'STK2_Y' }, 'Right stick'),
      c('SW5', 'SW-TRIG', 'STICKS', 150, 74, 0, { '1': 'TRIG', '2': 'GND' }, 'Trigger (switch + spring)'),
      c('R14', 'R-10K', 'STICKS', 150, 64, 90, { '1': '3V3', '2': 'TRIG' }, 'Trigger pull-up'),
    );
  if (sp.biasSwitch)
    parts.push(
      c('Q1', 'Q-PFET', 'POWER', 24, 8, 0, { S: 'VBUS', D: 'CHG_IN', G: 'Q1_G' }, 'Charger input switch (P-FET)'),
      c('R6', 'R-4K7', 'POWER', 22, 18, 90, { '1': 'VBUS', '2': 'Q1_G' }, 'Switch gate pull-up'),
      c('R5', 'R-2K2', 'POWER', 28, 18, 90, { '1': 'Q1_G', '2': 'GND' }, 'Switch bias resistor'),
    );
  // Stick positions moved for 1-screen boards with sticks (Rogue Pal) are above; SW2 sits below STK2.
  if (sp.sticks) for (const p of parts) if (p.ref === 'SW2') Object.assign(p, { x: 140, y: 52 });
  if (sp.sticks) for (const p of parts) if (p.ref === 'R2') Object.assign(p, { x: 128, y: 52 });

  const variants: Variant[] = [
    {
      id: 'screen-ribbon',
      family: 'Cracked solder joint',
      tier: 2,
      weight: 0.8,
      apply(b) {
        b.comps.J3.joints.DATA = { r: Infinity, cracked: true };
        return { summary: 'The screen ribbon connector J3 has a cracked joint on the picture-data pin: it boots (sound, light) but the screen stays blank. Reflow J3.', refs: ['J3'], hint: 'Sound and light but no picture. Follow the picture data from the main chip to the screen connector.', flavor: 'I can hear it start, but the screen is black.' };
      },
    },
    {
      id: 'speaker-dead',
      family: 'Blown speaker',
      tier: 1,
      weight: 0.8,
      apply(b) {
        b.comps.SPK1.fault = { type: 'open' };
        return { summary: 'The speaker is open circuit. Fit a new speaker.', refs: ['SPK1'], hint: 'Unplug the speaker and measure it (≈4 Ω).', flavor: 'No sound any more.' };
      },
    },
    {
      id: 'button-worn',
      family: 'Worn membrane',
      tier: 1,
      weight: 0.8,
      apply(b) {
        b.comps.SW2.fault = { type: 'open' };
        return { summary: 'The A button contact is worn out. Replace it.', refs: ['SW2'], hint: 'Press A and measure its line: it should drop to 0 V.', flavor: 'The A button does nothing.' };
      },
    },
    {
      id: 'liquid-buttons',
      family: 'Liquid damage',
      tier: 2,
      weight: 0.6,
      apply(b, rng) {
        liquidDamage(b, rng, ['SW2', 'R2'], 0.35, 0.5);
        b.comps.SW2.corr!.pins['1'] = 0.97;
        return { summary: 'A spill corroded the button area: the crust has eaten through the A button joint. Clean the corrosion (cleaner, scrub, IPA).', refs: ['SW2'], hint: 'Sticky buttons, one dead. Look for crust under the buttons.', flavor: 'Spilled juice on it. Now a button is dead and others are sticky.' };
      },
    },
    ...(sp.cardSlot
      ? [
          {
            id: 'card-slot',
            family: 'Dirty contacts',
            tier: 1,
            weight: 1,
            apply(b: BoardState, rng: Rng) {
              tarnish(b, 'J2', rng.range(0.5, 0.75), () => rng.next());
              b.comps.J2.oxide!.D0 = 0.95;
              return { summary: 'The game-card slot contacts are tarnished: no card reads. Scrub the slot contacts and Pad-Bright them.', refs: ['J2'], hint: 'Every game card fails? Look at the card slot contacts.', flavor: 'It says “cannot read the game card” with every card.' };
            },
          } as Variant,
        ]
      : []),
    ...(sp.sticks
      ? [
          {
            id: 'stick-drift',
            family: 'Stick drift',
            tier: 1,
            weight: 1.6,
            apply(b: BoardState, rng: Rng) {
              const ref = rng.pick(['STK1', 'STK2']);
              b.comps[ref].fault = { type: 'drift', axis: rng.pick(['X', 'Y'] as const), pos: rng.range(0.15, 0.3) };
              return { summary: `The ${ref === 'STK1' ? 'left' : 'right'} stick drifts: a worn potentiometer. Replace the stick.`, refs: [ref], hint: 'Measure each stick output with it centred: half the supply.', flavor: 'The camera keeps spinning on its own.' };
            },
          } as Variant,
          {
            id: 'trigger-spring',
            family: 'Broken spring',
            tier: 1,
            weight: 0.8,
            apply(b: BoardState) {
              b.comps.SW5.fault = { type: 'short', r: 0.2 };
              return { summary: 'The trigger spring is broken, so the trigger reads as held down. Replace the trigger mechanism.', refs: ['SW5'], hint: 'Is the trigger line low when nothing touches it?', flavor: 'The trigger feels spongy and fires by itself.' };
            },
          } as Variant,
        ]
      : []),
    ...(sp.extraVariants?.({ lcd: lcds }) ?? []),
  ];

  const lcdOk = (b: BoardState, op: OperatingPoint, ref: string) =>
    !!b.comps[ref].part && !b.comps[ref].unplugged && b.comps[ref].fault?.type !== 'dead' && op.at({ ref, pin: 'VCC' }) - op.at({ ref, pin: 'GND' }) > 2.6 && op.at({ ref, pin: 'DATA' }) - op.at({ ref, pin: 'GND' }) > 1.5;
  const state = (b: BoardState, op: OperatingPoint) => ({
    on: op.current('D1') > 3e-4,
    picture: lcds.every((r) => lcdOk(b, op, r)),
    sound: Math.abs(op.current('SPK1')) > 0.03,
    card: !sp.cardSlot || op.net('DIN') > 1.6,
    centred: !sp.sticks || ['STK1_X', 'STK1_Y', 'STK2_X', 'STK2_Y'].every((n) => Math.abs(op.net(n) / Math.max(0.5, op.net('3V3')) - 0.5) < 0.08),
    trigger: !sp.sticks || op.net('TRIG') > 1.6,
  });

  function functional(b: BoardState): FunctionalReport {
    b.attached = sp.cardSlot ? ['cart'] : [];
    const s = customerSession(b, { kind: 'off' });
    s.settle();
    s.press('SW1');
    const op = s.settle();
    const st = state(b, op);
    b.pressed = ['SW2'];
    const pa = s.settle();
    const aWorks = pa.net('BA') < 1 && pa.net('3V3') > 3;
    b.pressed = [];
    const op2 = s.setPower({ kind: 'adapter' });
    const charging = op2.current('D5') > 5e-4;
    s.end();
    const checks = [
      { label: 'Turns on (power light)', ok: st.on },
      { label: sp.screens === 2 ? 'Picture on both screens' : 'Picture on the screen', ok: st.picture },
      { label: 'Sound', ok: st.sound },
      { label: 'Buttons work', ok: aWorks && st.trigger },
      ...(sp.cardSlot ? [{ label: 'Reads a game card', ok: st.card }] : []),
      ...(sp.sticks ? [{ label: 'Sticks rest centred', ok: st.centred }] : []),
      { label: 'Charges', ok: charging },
    ];
    return { checks, facts: { ...st, buttons: aWorks, charging }, inputCurrent: op.srcI, events: s.events, passed: checks.every((x) => x.ok) && !s.events.length };
  }

  function complain(r: FunctionalReport, events: DamageEvent[], rng: Rng): string {
    const f = r.facts as Record<string, boolean>;
    const hot = events.length ? ' It got hot.' : '';
    if (!f.on) return rng.pick(['Completely dead.', 'Will not turn on, even plugged in.']) + hot;
    if (!f.picture) return (sp.screens === 2 ? 'The light comes on but both screens stay black.' : 'Lights up but the screen stays black.') + hot;
    if (!f.sound) return 'No sound.' + hot;
    if (!f.charging) return 'It will not charge.' + hot;
    if (!f.card) return 'It will not read games.' + hot;
    if (!f.centred) return 'The stick drifts.' + hot;
    if (!f.buttons || !f.trigger) return 'A button is not working right.' + hot;
    return 'Something is off.' + hot;
  }

  return device({
    id: sp.id,
    name: sp.name,
    category: 'Handheld',
    tagline: sp.tagline,
    width: TW,
    height: TH,
    blocks: [
      place('USB', usbInput({ connector: sp.usb, tvs: 'D-TVS5' }), [2, 2], { out: 'VBUS' }, { conn: 'J6', tvs: 'D6', tp: 'TP6' }, { faults: true, outline: null, layout: { conn: [8, 8], tvs: [16, 18, 270], tp: [6, 24] } }),
      place('CHG', liIonCharger({ led: true, battery: true }), [30, 2], { vin: chgIn, bat: 'BAT', stat: 'CHG' }, { chg: 'U5', ledRes: 'R9', led: 'D5', cbat: 'C5', conn: 'J1', pack: 'BT1', tp: 'TP5' }, {
        faults: true,
        outline: null,
        layout: { chg: [38, 10], ledRes: [36, 22, 90], led: [42, 22, 90], cbat: [48, 14, 90], conn: [40, 32], pack: [150, 90], tp: [48, 26] },
      }),
    ],
    outlines: [
      { name: 'POWER', x: 2, y: 2, w: 74, h: 30 },
      { name: 'MAIN CHIP', x: 52, y: 28, w: 22, h: 18 },
    ],
    parts,
    traces: [],
    testPoints: [
      { ref: 'TP1', net: 'GND', expected: '0 V' },
      { ref: 'TP2', net: '3V3', expected: '3.3 V' },
    ],
    rails: [
      { net: 'BAT', nominal: 3.8, label: 'BAT' },
      { net: '3V3', nominal: 3.3, label: '3V3' },
    ],
    nets: {
      GND: { desc: 'Ground', expected: 0 },
      '3V3': { desc: '3.3 V logic rail', expected: 3.3, power: true },
      PWR: { desc: 'Power button (low when pressed)' },
      BA: { desc: 'A button (low when pressed)' },
      LCD_D: { desc: 'Picture data to the screen(s)' },
      SND: { desc: 'Speaker amp enable' },
      MOD_EN: { desc: 'Enable for the plug-in boards' },
      OK_LCD1: { desc: 'Screen reports OK (high)' },
      ...(sp.screens === 2 ? { OK_LCD2: { desc: 'Bottom screen reports OK (high)' } } : {}),
      ...(sp.wifi ? { OK_WIFI: { desc: 'Wi-Fi board reports OK (high)' } } : {}),
      ...(sp.camera ? { OK_CAM: { desc: 'Camera ready (high; pulled up if no camera)' } } : {}),
      ...(sp.biasSwitch ? { CHG_IN: { desc: 'Charger input after the P-FET switch', expected: 5, power: true }, Q1_G: { desc: 'Switch gate: must be pulled well below 5 V for the switch to turn on' } } : {}),
    },
    input: { ref: 'J6', plus: 'VBUS', minus: 'GND', adapter: { v: 5.1, ilim: 1.5, rint: 0.15, label: "the owner's charger" }, psuV: 5, psuI: 1 },
    ground: 'TP1',
    controls: [
      { ref: 'SW1', label: 'Power button' },
      { ref: 'SW2', label: 'A' },
    ],
    firmware: {
      ref: 'U3',
      vmin: 2.9,
      vmax: 3.6,
      inputs: ['PWR', 'BA', 'DIN', 'OK1', 'OK2', 'OK3', 'OK4'],
      boot: () => ({ on: 0 }),
      step(state, inputs, prev) {
        if (!inputs.PWR && prev.PWR) state.on = state.on ? 0 : 1;
        const on = state.on === 1;
        const booted = on && inputs.OK1 && inputs.OK2 && inputs.OK3 && inputs.OK4;
        return { LED: on, EN: on, CE: on, VEN: booted, SND: booted };
      },
    },
    externals: sp.cardSlot ? [testCart('J2', '🎮 Game card (known good)', 2.4)] : [],
    ownerAttaches: sp.cardSlot ? ['cart'] : [],
    functional,
    complain,
    status(b, op) {
      if (!op) return [];
      const st = state(b, op);
      return [
        { label: 'Power light', value: st.on ? 'on' : 'off', ok: st.on },
        { label: sp.screens === 2 ? 'Screens' : 'Screen', value: st.picture ? 'picture' : 'black', ok: st.picture },
        { label: 'Sound', value: st.sound ? 'playing' : 'silent', ok: st.sound },
        ...(sp.cardSlot ? [{ label: 'Game card', value: st.card ? 'reads' : b.attached.includes('cart') ? 'not read' : 'none in', ok: st.card }] : []),
      ];
    },
    variants,
    missable: ['C2', 'TP2'],
    carbonise: [['3V3', 'GND', 'C2']],
    marketValue: sp.marketValue,
    quoteBase: sp.quoteBase,
    minReputation: sp.minReputation,
  });
}

export const BUTTON_LITE = handheld({
  id: 'button-lite',
  name: 'Button Lite',
  tagline: 'The handheld-only Button: corroded backlight connectors and drifting… everything.',
  soc: 'U-BTL-SOC',
  usb: 'usbc',
  screens: 1,
  cardSlot: true,
  extraVariants: () => [
    {
      id: 'screen-conn-short',
      family: 'Liquid damage',
      tier: 2,
      weight: 1.2,
      apply(b, rng) {
        liquidDamage(b, rng, ['J3'], 0.35, 0.5);
        b.jumpers.push({ id: b.nextJumperId++, a: { ref: 'J3', pin: 'VCC' }, b: { ref: 'J3', pin: 'GND' }, cold: false, bridge: true });
        return {
          summary: 'Liquid got into the screen connector J3: corrosion grew a bridge from its supply pin to ground, shorting the 3.3 V rail — it tries to boot over and over. Clean the corrosion and wick away the bridge (or replace J3).',
          refs: ['J3'],
          hint: 'It draws current in bursts and never starts. Unplug the screen: still shorted? Then the short is on the board side — look at the screen connector.',
          flavor: 'It sat in a damp bag. The charge light flickers and it never turns on.',
        };
      },
    },
  ],
  marketValue: 90,
  quoteBase: 40,
  minReputation: 8,
});

export const RB35 = handheld({
  id: 'rb35',
  name: 'Retrobit RB35',
  tagline: 'Cheap emulation handheld: a charger switch held on by one tiny resistor.',
  soc: 'U-RB35-SOC',
  usb: 'usbc',
  screens: 1,
  biasSwitch: true,
  extraVariants: () => [
    {
      id: 'bias-missing',
      family: 'Missing part',
      tier: 2,
      weight: 1.6,
      apply(b) {
        b.comps.R5.part = null;
        addMark(b, 'R5', 'scorch');
        return {
          summary: 'The charger-switch bias resistor R5 is missing (burnt off, probably by a fast charger), so the P-FET never turns on and it never charges. Its value is not on the board: try values from the resistor drawer — 10k does nothing, around 2.2k–3k works.',
          refs: ['R5'],
          hint: 'USB meter shows 0 A. 5 V reaches the switch FET but nothing comes out. What holds its gate low? Look closely at the empty pads next to it.',
          flavor: 'Brand new, will not charge at all.',
        };
      },
    },
    {
      id: 'usb-corroded',
      family: 'Liquid damage',
      tier: 1,
      weight: 0.8,
      apply(b, rng) {
        liquidDamage(b, rng, ['J6'], 0.35, 0.5);
        b.comps.J6.corr!.pins.VBUS = 0.97;
        return { summary: 'The USB-C port is corroded and the crust has eaten through its power pin joint. Clean the corrosion (cleaner, scrub, IPA).', refs: ['J6'], hint: 'Nothing gets past the USB port pins. Look at the port joints.', flavor: 'It got wet at the beach. Will not charge.' };
      },
    },
  ],
  marketValue: 45,
  quoteBase: 25,
  minReputation: 0,
});

export const ROGUE_PAL = handheld({
  id: 'rogue-pal',
  name: 'Rogue Pal',
  tagline: 'Handheld gaming PC: drifting sticks, flat batteries, fragile triggers.',
  soc: 'U-RP-APU',
  usb: 'usbc',
  screens: 1,
  sticks: true,
  extraVariants: () => [
    {
      id: 'screen-dead',
      family: 'Dead screen',
      tier: 1,
      weight: 1,
      apply(b) {
        b.comps.LCD1.fault = { type: 'dead' };
        return { summary: 'The screen module has died, and the main chip refuses to finish booting without it. Fit a new screen module.', refs: ['LCD1'], hint: 'Boot sound? No — and it never starts. Does the screen report OK to the main chip?', flavor: 'Dropped it. Now nothing shows and it does not start.' };
      },
    },
    {
      id: 'battery-flat',
      family: 'Dead battery',
      tier: 1,
      weight: 0.9,
      apply(b) {
        b.comps.BT1.fault = { type: 'open' };
        return { summary: 'The battery pack is dead (0 V, not detected). Fit a new battery pack.', refs: ['BT1'], hint: 'Unplug the battery and measure it.', flavor: 'Orange light when charging, then nothing. Seller said "ghost touch".' };
      },
    },
  ],
  marketValue: 260,
  quoteBase: 60,
  minReputation: 15,
});

const duoVariants = (model: 'ixl' | '3dxl' | 'lite') => (): Variant[] => {
  const v: Variant[] = [];
  if (model === 'ixl')
    v.push(
      {
        id: 'top-screen-dead',
        family: 'Dead screen',
        tier: 2,
        weight: 1.2,
        apply(b) {
          b.comps.LCD1.fault = { type: 'dead' };
          return { summary: 'The top screen has died — and the DuoScreen will not boot at all without it. Replace the top screen.', refs: ['LCD1'], hint: 'Swap the cheap suspects first: power board, Wi-Fi board, bottom screen, top screen. Which OK line stays low?', flavor: 'Completely dead — not even the bottom screen comes on.' };
        },
      },
      {
        id: 'wifi-board-dead',
        family: 'Failed board',
        tier: 2,
        weight: 1,
        apply(b) {
          b.comps.WIFI1.fault = { type: 'dead' };
          return { summary: 'The Wi-Fi board has died and the main chip waits for it forever. Replace the Wi-Fi board.', refs: ['WIFI1'], hint: 'Power light on, both screens black. Check each OK line into the main chip.', flavor: 'Lights up, nothing on either screen.' };
        },
      },
    );
  if (model === '3dxl')
    v.push({
      id: 'camera-ribbon',
      family: 'Torn ribbon',
      tier: 2,
      weight: 1.4,
      apply(b) {
        b.jumpers.push({ id: b.nextJumperId++, a: { ref: 'CAM1', pin: 'OK' }, b: { ref: 'CAM1', pin: 'GND' }, cold: false, bridge: true });
        return { summary: 'The camera ribbon is damaged where it runs through the hinge and shorts the camera-ready line, so both screens stay off. Unplug the camera to prove it, then replace the camera ribbon.', refs: ['CAM1'], hint: 'Sound but no displays. Try booting with the camera ribbon unplugged.', flavor: 'It makes the start-up sound but both screens are black.' };
      },
    });
  if (model === 'lite')
    v.push({
      id: 'drop-caps',
      family: 'Missing part',
      tier: 2,
      weight: 1.4,
      apply(b) {
        b.comps.C2.part = null;
        addMark(b, 'C2', 'scratch');
        return { summary: 'Dropped: the 3.3 V output capacitor C2 broke off its pads (it was rattling in the case), so the regulator oscillates and the rail sags. Solder a new C2 on.', refs: ['C2'], hint: 'Something rattles inside. The 3.3 V rail is low and noisy. Any empty pads?', flavor: 'I dropped it and now something rattles inside. Dead.' };
      },
    });
  return v;
};

export const DUO_IXL = handheld({ id: 'duo-ixl', name: 'DuoScreen i XL', tagline: 'Big dual-screen: a dead top screen means no boot at all.', soc: 'U-DUO-SOC', usb: 'micro', screens: 2, cardSlot: true, wifi: true, camera: true, extraVariants: duoVariants('ixl'), marketValue: 70, quoteBase: 35, minReputation: 5 });
export const DUO_3DXL = handheld({ id: 'duo-3dxl', name: 'DuoScreen 3D XL', tagline: 'Dual-screen 3D: camera ribbons through the hinge.', soc: 'U-DUO-SOC', usb: 'micro', screens: 2, cardSlot: true, wifi: true, camera: true, extraVariants: duoVariants('3dxl'), marketValue: 110, quoteBase: 40, minReputation: 8 });
export const DUO_LITE = handheld({ id: 'duo-lite', name: 'DuoScreen Lite', tagline: 'Slim dual-screen: drops knock caps off.', soc: 'U-DUO-SOC', usb: 'micro', screens: 2, cardSlot: true, wifi: true, extraVariants: duoVariants('lite'), marketValue: 55, quoteBase: 30, minReputation: 3 });
