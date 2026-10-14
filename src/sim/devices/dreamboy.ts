/**
 * Dream Boy family of handhelds (fictional): Dream Boy, Pocket, Color and Advance on two AA
 * cells; Advance SP and Micro on a Li-ion pack with a charge port. One board design (130 × 80
 * mm), varied per model. Battery → power switch → logic; CPU, cartridge slot, LCD on a
 * ribbon, speaker amp. Plus their two cartridge types.
 */
import { device, place } from '../blocks/core';
import { liIonCharger, usbInput } from '../blocks/usb';
import { c, type ComponentDef, type DeviceDef } from '../board';
import { customerSession, type BoardState, type DamageEvent, type FunctionalReport, type OperatingPoint } from '../circuit';
import { tarnish } from '../contacts';
import { addMark, liquidDamage, type Rng, type Variant } from '../faults';
import { cartridge, cx, testCart } from './retro';

interface Model {
  id: string;
  name: string;
  tagline: string;
  cpu: string;
  liion: boolean;
  marketValue: number;
  quoteBase: number;
  minReputation: number;
  /** Corrosion-restoration fault (the Color's classic). */
  eatenPads?: boolean;
}

function dreamBoy(m: Model): DeviceDef {
  const supply = m.liion ? 'BAT' : 'BATT_P';
  const parts: ComponentDef[] = [
    c('SW1', 'SW-SLIDE', 'POWER', 12, 8, 0, { '1': supply, '2': 'VSW' }, 'Power switch'),
    c('F1', 'F-1A', 'POWER', 24, 8, 0, { '1': 'VSW', '2': 'VCC' }, 'Power fuse'),
    c('C1', 'C-22U-10', 'POWER', 24, 16, 0, { '1': 'VCC', '2': 'GND' }, 'Supply capacitor'),
    c('TP1', 'TP', 'POWER', 4, 4, 0, { '1': 'GND' }, 'Ground'),
    c('TP2', 'TP', 'POWER', 34, 6, 0, { '1': 'VCC' }, 'Supply after the fuse'),
    cx('U2', m.cpu, 'CPU', 44, 24, 0, { VDD: 'VCC', GND: 'GND', RST: 'RST', CE: 'CE', DIN: 'DIN', LED: 'LED_IO', VEN: 'LCD_D', SND: 'SND' }, 'CPU'),
    c('R5', 'R-10K', 'CPU', 30, 30, 0, { '1': 'VCC', '2': 'RST' }, 'Reset pull-up'),
    c('R1', 'R-220R', 'CPU', 10, 22, 90, { '1': 'LED_IO', '2': 'LED_A' }, 'Power LED resistor'),
    c('D1', 'LED-RED', 'CPU', 10, 30, 90, { A: 'LED_A', K: 'GND' }, 'Power light'),
    c('J2', 'J-SLOT6', 'SLOT', 84, 12, 0, { '5V': 'VCC', GND: 'GND', CE: 'CE', D0: 'DIN', LKI: 'SLOT_LKI', LKO: 'SLOT_LKO' }, 'Cartridge slot'),
    c('R3', 'R-10K', 'SLOT', 66, 26, 0, { '1': 'DIN', '2': 'GND' }, 'Data pull-down'),
    c('J3', 'J-FPC3', 'SCREEN', 25, 40, 0, { VCC: 'VCC', DATA: 'LCD_D', GND: 'GND' }, 'Screen ribbon connector'),
    c('LCD1', 'M-DBLCD', 'SCREEN', 25, 60, 0, { VCC: 'LCD1_VCC', DATA: 'LCD1_DATA', GND: 'LCD1_GND' }, 'LCD screen', 'J3'),
    cx('U4', 'U-SA8002', 'AUDIO', 104, 36, 0, { VDD: 'VCC', GND: 'GND', EN: 'SND', OUTP: 'SPK_P', OUTN: 'SPK_N' }, 'Speaker amp'),
    c('R6', 'R-100K', 'AUDIO', 92, 30, 90, { '1': 'SND', '2': 'GND' }, 'Amp enable pull-down'),
    c('J4', 'J-JST2', 'AUDIO', 116, 46, 0, { '1': 'SPK_P', '2': 'SPK_N' }, 'Speaker connector'),
    c('SPK1', 'M-SPK4', 'AUDIO', 116, 64, 0, { '1': 'SPK1_A', '2': 'SPK1_B' }, 'Speaker', 'J4'),
  ];
  if (!m.liion)
    parts.push(
      c('J1', 'J-AA2', 'BATT', 75, 74, 0, { '+': 'BATT_P', '-': 'GND' }, 'Battery springs'),
      c('BT1', 'M-AA2', 'BATT', 75, 58, 0, { '+': 'BT1_P', '-': 'BT1_N' }, '2 × AA batteries', 'J1'),
    );

  const variants: Variant[] = [
    {
      id: 'switch-oxide',
      family: 'Dirty contacts',
      tier: 1,
      weight: 1,
      apply(b, rng) {
        tarnish(b, 'SW1', rng.range(0.92, 0.99), () => rng.next());
        return { summary: 'The power switch contacts are oxidised and no longer connect. Clean the switch contacts (scrub + Pad-Bright).', refs: ['SW1'], hint: 'Battery voltage before the switch, nothing after it, switch on.', flavor: 'I have to flick the switch a dozen times. Now it never turns on.' };
      },
    },
    {
      id: 'slot-tarnish',
      family: 'Dirty contacts',
      tier: 1,
      weight: 1.2,
      apply(b, rng) {
        tarnish(b, 'J2', rng.range(0.5, 0.75), () => rng.next());
        b.comps.J2.oxide!.D0 = 0.95;
        return { summary: 'The cartridge slot contacts are tarnished, so games will not load. Scrub the slot contacts and Pad-Bright them.', refs: ['J2'], hint: 'Every game fails to start? Look at the slot contacts.', flavor: 'It turns on but the logo just scrolls into garbage with every game.' };
      },
    },
    {
      id: 'screen-lines',
      family: 'Cracked solder joint',
      tier: 2,
      weight: 0.9,
      apply(b) {
        b.comps.J3.joints.DATA = { r: Infinity, cracked: true };
        return { summary: 'The screen ribbon connector J3 has a cracked joint on its data line: lines and a blank screen. Reflow the connector joints.', refs: ['J3'], hint: 'Sound works, light on, but the screen is blank or striped. Follow the picture data from the CPU to the screen ribbon.', flavor: 'Vertical lines across the screen, now it is just blank.' };
      },
    },
    {
      id: 'speaker-dead',
      family: 'Blown speaker',
      tier: 1,
      weight: 0.9,
      apply(b) {
        b.comps.SPK1.fault = { type: 'open' };
        return { summary: 'The speaker is open circuit (should read about 4 Ω). Fit a new speaker.', refs: ['SPK1'], hint: 'Unplug the speaker and measure it.', flavor: 'The game works but there is no sound.' };
      },
    },
    {
      id: 'amp-dead',
      family: 'Failed amp IC',
      tier: 2,
      weight: 0.6,
      apply(b) {
        b.comps.U4.fault = { type: 'dead' };
        return { summary: 'The speaker amp U4 has died: powered and enabled, but no output. Replace U4.', refs: ['U4'], hint: 'Is the amp powered and enabled while a game plays? Anything on its outputs?', flavor: 'No sound, even with a new speaker.' };
      },
    },
  ];
  if (!m.liion)
    variants.push(
      {
        id: 'spring-tarnish',
        family: 'Dirty contacts',
        tier: 1,
        weight: 1,
        apply(b, rng) {
          tarnish(b, 'J1', rng.range(0.93, 0.99), () => rng.next());
          return { summary: 'The battery contacts are dull and oxidised: fresh batteries make no contact. Scrub the springs and plates, then Pad-Bright them.', refs: ['J1'], hint: 'Fresh batteries in, and nothing. Measure on the springs themselves.', flavor: 'New batteries and it is still dead.' };
        },
      },
      {
        id: 'battery-leak',
        family: 'Liquid damage',
        tier: 1,
        weight: 1.4,
        apply(b, rng) {
          b.comps.J1.fault = { type: 'pins-open', pins: ['+'] };
          addMark(b, 'J1', 'corrosion');
          liquidDamage(b, rng, ['J1', 'C1'], 0.3, 0.5);
          return { summary: 'Batteries were left in and leaked: the spring is rusted through and crust has spread. Replace the battery springs, then clean the corrosion (cleaner, scrub, IPA).', refs: ['J1'], hint: 'Look in the battery compartment. Rust under the plating cannot be scrubbed back — that spring needs replacing.', flavor: 'Found it in a drawer with the old batteries still in. Dead.' };
        },
      },
    );
  if (m.eatenPads)
    variants.push({
      id: 'leak-eaten',
      family: 'Liquid damage',
      tier: 2,
      weight: 1,
      apply(b, rng) {
        liquidDamage(b, rng, ['F1', 'C1', 'SPK1'], 0.35, 0.55);
        b.comps.F1.corr!.pins['1'] = 0.97;
        b.comps.SPK1.fault = { type: 'open' };
        return { summary: 'Battery leak damage: corrosion has eaten through the fuse joint and rotted the speaker wires. Clean all the corrosion (cleaner, scrub, IPA) and fit a new speaker.', refs: ['F1', 'SPK1'], hint: 'Battery voltage reaches the switch but not past the fuse. Look closely at the fuse — and listen.', flavor: 'Leaked batteries. Dead, and I think the speaker is gone too.' };
      },
    });

  const lcdOn = (op: OperatingPoint) => op.at({ ref: 'LCD1', pin: 'VCC' }) - op.at({ ref: 'LCD1', pin: 'GND' }) > 2.4 && op.at({ ref: 'LCD1', pin: 'DATA' }) - op.at({ ref: 'LCD1', pin: 'GND' }) > 1.2;
  const state = (b: BoardState, op: OperatingPoint) => ({
    on: op.current('D1') > 3e-4,
    picture: lcdOn(op) && b.mcu.running,
    sound: Math.abs(op.current('SPK1')) > 0.03,
  });

  function functional(b: BoardState): FunctionalReport {
    b.attached = ['cart'];
    const s = customerSession(b, { kind: 'off' });
    s.settle();
    const op = s.settle();
    const st = state(b, op);
    let charging = true;
    if (m.liion) {
      const op2 = s.setPower({ kind: 'adapter' });
      charging = op2.current('D2') > 5e-4;
    }
    s.end();
    const checks = [
      { label: 'Switches on (power light)', ok: st.on },
      { label: 'Game picture on the screen', ok: st.picture },
      { label: 'Sound from the speaker', ok: st.sound },
      ...(m.liion ? [{ label: 'Charges (charge light)', ok: charging }] : []),
    ];
    return { checks, facts: { ...st, charging }, inputCurrent: op.srcI, events: s.events, passed: checks.every((x) => x.ok) && !s.events.length };
  }

  function complain(r: FunctionalReport, events: DamageEvent[], rng: Rng): string {
    const f = r.facts as Record<string, boolean>;
    const hot = events.length ? ' It got hot.' : '';
    if (!f.on) return rng.pick(['Dead. Fresh batteries, nothing.', 'Will not turn on at all.']) + hot;
    if (!f.picture) return 'The light comes on but the screen stays blank.' + hot;
    if (!f.sound) return 'Plays fine but no sound.' + hot;
    if (!f.charging) return 'It will not charge any more.' + hot;
    return 'Something is wrong with it.' + hot;
  }

  return device({
    id: m.id,
    name: m.name,
    category: 'Retro handheld',
    tagline: m.tagline,
    width: 130,
    height: 80,
    blocks: m.liion
      ? [
          place('USB', usbInput({ connector: 'micro', tvs: 'D-TVS5' }), [96, 2], { out: 'VBUS' }, { conn: 'J6', tvs: 'D6', tp: 'TP6' }, {
            faults: true,
            outline: null,
            layout: { conn: [124, 30, 90], tvs: [118, 20, 270], tp: [114, 26] },
          }),
          place('CHG', liIonCharger({ led: true, battery: true }), [40, 44], { vin: 'VBUS', bat: 'BAT', stat: 'CHG' }, { chg: 'U5', ledRes: 'R7', led: 'D2', cbat: 'C5', conn: 'J1', pack: 'BT1', tp: 'TP5' }, {
            faults: true,
            outline: null,
            layout: { chg: [96, 22], ledRes: [86, 40], led: [92, 46, 90], cbat: [104, 22, 90], conn: [72, 50], pack: [75, 66], tp: [64, 38] },
          }),
        ]
      : [],
    outlines: [
      { name: 'POWER', x: 2, y: 2, w: 36, h: 18 },
      { name: 'CPU', x: 30, y: 14, w: 30, h: 22 },
      { name: 'CARTRIDGE', x: 60, y: 2, w: 48, h: 30 },
    ],
    parts,
    traces: [],
    testPoints: [
      { ref: 'TP1', net: 'GND', expected: '0 V' },
      { ref: 'TP2', net: 'VCC', expected: m.liion ? '3.7–4.2 V (battery)' : '≈3 V (two AA cells)' },
    ],
    rails: [{ net: 'VCC', nominal: m.liion ? 3.8 : 3, label: 'VCC' }],
    nets: {
      GND: { desc: 'Ground', expected: 0 },
      VCC: { desc: 'Main supply after the switch and fuse', expected: m.liion ? 3.8 : 3, power: true },
      VSW: { desc: 'After the power switch', power: true },
      ...(m.liion ? {} : { BATT_P: { desc: 'Battery + from the springs', expected: 3, power: true } }),
      CE: { desc: 'Cartridge enable' },
      DIN: { desc: 'Game data from the cartridge' },
      LCD_D: { desc: 'Picture data to the screen ribbon' },
      SND: { desc: 'Speaker amp enable' },
      RST: { desc: 'CPU reset (pulled high = run)' },
      LED_IO: { desc: 'Power light drive' },
      LED_A: { desc: 'Power LED anode' },
      SPK_P: { desc: 'Speaker +' },
      SPK_N: { desc: 'Speaker −' },
    },
    input: m.liion
      ? { ref: 'J6', plus: 'VBUS', minus: 'GND', adapter: { v: 5.1, ilim: 1, rint: 0.15, label: "the owner's charger" }, psuV: 5, psuI: 1 }
      : { ref: 'J1', plus: '+', minus: '-', adapter: { v: 3, ilim: 1, rint: 0.2, label: 'fresh batteries' }, psuV: 3, psuI: 0.5 },
    ground: 'TP1',
    controls: [],
    firmware: {
      ref: 'U2',
      vmin: 2.4,
      vmax: 4.4,
      reset: 'RST',
      inputs: ['DIN'],
      boot: () => ({}),
      step(_s, inputs) {
        return { CE: true, LED: true, VEN: inputs.DIN, SND: inputs.DIN };
      },
    },
    externals: [testCart('J2', '🎮 Test cartridge (known good)', 2.4)],
    ownerAttaches: ['cart'],
    functional,
    complain,
    status(b, op) {
      if (!op) return [];
      const st = state(b, op);
      return [
        { label: 'Power light', value: st.on ? 'on' : 'off', ok: st.on },
        { label: 'Screen', value: st.picture ? 'game picture' : b.attached.includes('cart') ? 'blank' : 'no game in', ok: st.picture },
        { label: 'Sound', value: st.sound ? 'playing' : 'silent', ok: st.sound },
      ];
    },
    variants,
    missable: ['C1', 'R6'],
    carbonise: [['VCC', 'GND', 'C1']],
    marketValue: m.marketValue,
    quoteBase: m.quoteBase,
    minReputation: m.minReputation,
  });
}

export const DREAMBOY = dreamBoy({ id: 'db', name: 'Dream Boy', tagline: 'The brick: green screen, four buttons, indestructible (mostly).', cpu: 'U-DB-CPU', liion: false, marketValue: 55, quoteBase: 25, minReputation: 0 });
export const DREAMBOY_POCKET = dreamBoy({ id: 'db-pocket', name: 'Dream Boy Pocket', tagline: 'Slimmer Dream Boy on two AA cells.', cpu: 'U-DB-CPU', liion: false, marketValue: 45, quoteBase: 25, minReputation: 0 });
export const DREAMBOY_COLOR = dreamBoy({ id: 'db-color', name: 'Dream Boy Color', tagline: 'Colour screen — and the classic leaked-battery restoration.', cpu: 'U-DBC-CPU', liion: false, marketValue: 60, quoteBase: 30, minReputation: 0, eatenPads: true });
export const DREAMBOY_ADVANCE = dreamBoy({ id: 'dba', name: 'Dream Boy Advance', tagline: 'Wide-screen 32-bit Dream Boy on AA cells.', cpu: 'U-DBA-CPU', liion: false, marketValue: 55, quoteBase: 30, minReputation: 3 });
export const DREAMBOY_SP = dreamBoy({ id: 'dba-sp', name: 'Dream Boy Advance SP', tagline: 'Clamshell with a rechargeable pack (and a habit of bulging it).', cpu: 'U-DBA-CPU', liion: true, marketValue: 75, quoteBase: 35, minReputation: 3 });
export const DREAMBOY_MICRO = dreamBoy({ id: 'dba-micro', name: 'Dream Boy Micro', tagline: 'Tiny, rare, rechargeable.', cpu: 'U-DBA-CPU', liion: true, marketValue: 110, quoteBase: 40, minReputation: 8 });

export const DB_CART = cartridge({
  id: 'db-cart',
  name: 'Dream Boy Game Pak',
  console: 'db',
  consoleName: 'Dream Boy',
  romPart: 'U-ROM-DB',
  lockout: false,
  save: true,
  quoteBase: 14,
  titles: [
    { name: 'Blockfall', value: 8 },
    { name: 'Critter Catchers Red', value: 35 },
    { name: 'Pocket Plumber Land', value: 15 },
    { name: 'Moonlit Quest', value: 20 },
  ],
});

export const DBA_CART = cartridge({
  id: 'dba-cart',
  name: 'Dream Boy Advance Game Pak',
  console: 'dba',
  consoleName: 'Dream Boy Advance',
  romPart: 'U-ROM-DBA',
  lockout: false,
  save: true,
  quoteBase: 16,
  minReputation: 3,
  titles: [
    { name: 'Critter Catchers Sapphire', value: 40 },
    { name: 'Kart Smash Advance', value: 18 },
    { name: 'Moonlit Quest II', value: 22 },
    { name: 'Metro Hunter Fusion', value: 30 },
  ],
});
