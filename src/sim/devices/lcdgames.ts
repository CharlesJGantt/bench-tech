/**
 * Pocket LCD games (fictional): Game & Clock and Critter Mini. A USB-C port charges a
 * soldered-in Li-ion pouch cell (no battery door), a 3.3 V regulator laid flat on the board
 * (bent legs) feeds a tiny CPU that never switches off (the clock keeps running); a segment
 * LCD on a ribbon, a speaker, a D-pad, A / B buttons and a Game button. Critter Mini also has
 * its notorious catastrophic-corrosion "total loss" fault.
 */
import { device, place } from '../blocks/core';
import { liIonCharger, usbInput } from '../blocks/usb';
import { c, type DeviceDef } from '../board';
import { customerSession, type BoardState, type DamageEvent, type FunctionalReport, type OperatingPoint } from '../circuit';
import { addMark, liquidDamage, type Rng, type Variant } from '../faults';
import { silk, cx } from './retro';

interface LcdGameSpec {
  id: string;
  name: string;
  tagline: string;
  cpu: string;
  totalLoss?: boolean;
  marketValue: number;
  quoteBase: number;
  minReputation: number;
}

function lcdGame(sp: LcdGameSpec): DeviceDef {
  const variants: Variant[] = [
    {
      id: 'lcd-faded',
      family: 'Faded screen',
      tier: 1,
      weight: 1.4,
      apply(b) {
        b.comps.LCD1.fault = { type: 'dead' };
        addMark(b, 'LCD1', 'discolored');
        return { summary: 'The LCD has faded (the reflector behind it has gone dark): the segments are invisible. Fit a new LCD module.', refs: ['LCD1'], hint: 'You can hear it beep, but the screen shows nothing. Is the LCD getting its supply and data?', flavor: 'The screen has gone so faint you cannot see anything.' };
      },
    },
    {
      id: 'reg-dead',
      family: 'Failed regulator',
      tier: 2,
      weight: 0.9,
      apply(b) {
        b.comps.U4.fault = { type: 'dead' };
        return { summary: 'The 3.3 V regulator U4 died: the battery rail is fine but nothing comes out, so the CPU never runs. Replace U4.', refs: ['U4'], hint: 'The battery reads fine but the 3.3 V supply is missing. Is the regulator getting power in?', flavor: 'It will not do anything, not even the clock.' };
      },
    },
    {
      id: 'reg-legs',
      family: 'Cracked solder joint',
      tier: 1,
      weight: 1.1,
      apply(b) {
        b.comps.U4.joints.OUT = { r: Infinity, cracked: true };
        return { summary: 'The output leg of the flat-lying regulator U4 has cracked away from its pad (the bent legs take all the strain when the case flexes). Reflow it.', refs: ['U4'], hint: 'Power gets into the regulator but not out. Look closely at the three bent legs of U4.', flavor: 'I dropped it and now it is dead. It rattled a bit before.' };
      },
    },
    {
      id: 'button-worn',
      family: 'Worn membrane',
      tier: 1,
      weight: 0.9,
      apply(b) {
        b.comps.SW1.fault = { type: 'open' };
        return { summary: 'The Game button contact is worn out: the game never starts. Replace the button contact.', refs: ['SW1'], hint: 'Press Game and measure its line: does it drop to 0 V?', flavor: 'The clock works but I cannot start a game.' };
      },
    },
    {
      id: 'speaker-dead',
      family: 'Blown speaker',
      tier: 1,
      weight: 0.7,
      apply(b) {
        b.comps.SPK1.fault = { type: 'open' };
        return { summary: 'The little speaker is open circuit. Replace it.', refs: ['SPK1'], hint: 'Measure the speaker.', flavor: 'No beeps any more.' };
      },
    },
  ];
  if (sp.totalLoss)
    variants.push({
      id: 'total-loss',
      family: 'Total loss',
      tier: 3,
      weight: 0.5,
      apply(b, rng) {
        liquidDamage(b, rng, ['C3', 'C4', 'R3', 'R10', 'J3'], 0.6, 0.9);
        b.comps.U2.part = null;
        addMark(b, 'U2', 'corrosion');
        return {
          summary: 'Catastrophic corrosion: the main chip has fallen off its corroded pads and everything is crusted. Only a donor board can supply that chip — without one it is a total loss. Clean everything and fit a donor chip.',
          refs: ['U2', 'C3', 'C4', 'R3', 'R10', 'J3'],
          hint: 'Look at it under the light. Is the main chip even still there?',
          flavor: 'Found it in the loft after the roof leaked. It is a rare one — can you save it?',
        };
      },
    });

  const lcdOn = (op: OperatingPoint) => op.at({ ref: 'LCD1', pin: 'VCC' }) - op.at({ ref: 'LCD1', pin: 'GND' }) > 2.4 && op.at({ ref: 'LCD1', pin: 'DATA' }) - op.at({ ref: 'LCD1', pin: 'GND' }) > 1.2;
  const state = (b: BoardState, op: OperatingPoint) => ({
    picture: lcdOn(op) && b.mcu.running && b.comps.LCD1.fault?.type !== 'dead',
    sound: Math.abs(op.current('SPK1')) > 0.03,
  });

  function functional(b: BoardState): FunctionalReport {
    const s = customerSession(b, { kind: 'off' });
    s.settle();
    s.press('SW1');
    const op = s.settle();
    const st = state(b, op);
    const op2 = s.setPower({ kind: 'adapter' });
    const charging = op2.current('D2') > 5e-4;
    s.end();
    const checks = [
      { label: 'The screen shows the game (on battery)', ok: st.picture },
      { label: 'It beeps', ok: st.sound },
      { label: 'It charges from USB (charge light on)', ok: charging },
    ];
    return { checks, facts: { ...st, charging }, inputCurrent: op2.srcI, events: s.events, passed: checks.every((x) => x.ok) && !s.events.length };
  }

  function complain(r: FunctionalReport, events: DamageEvent[], rng: Rng): string {
    const f = r.facts as Record<string, boolean>;
    if (!f.picture) return rng.pick(['Nothing on the screen.', 'Dead, even after charging all night.']) + (events.length ? ' It got warm.' : '');
    if (!f.sound) return 'No beeps.';
    if (!f.charging) return 'It will not charge any more.';
    return 'Something is wrong with it.';
  }

  const dev = device({
    id: sp.id,
    name: sp.name,
    category: 'LCD game',
    tagline: sp.tagline,
    width: 150,
    height: 90,
    blocks: [
      place('USB', usbInput({ connector: 'usbc', fuse: 'F-1A', tvs: 'D-TVS5' }), [2, 2], { out: 'VBUS' }, { conn: 'J1', fuse: 'F1', tvs: 'D1', tp: 'TP1' }, {
        outline: { name: 'USB-C / CHARGER', x: 12, y: 2, w: 66, h: 32 },
        layout: { conn: [19, 3.2], fuse: [30, 10], tvs: [35, 18, 270], tp: [23, 27] },
      }),
      place(
        'CHG',
        liIonCharger({ sense: true, cin: 'C-10U-25', cbat: 'C-22U-10', led: true, battery: 'soldered' }),
        [28, 2],
        { vin: 'VBUS', bat: 'VSYS', stat: 'CHG' },
        { sense: 'R1', cin: 'C1', chg: 'U1', cbat: 'C2', tp: 'TP2', ledRes: 'R2', led: 'D2', pack: 'BT1' },
        { outline: null, layout: { sense: [44, 10], cin: [49, 18, 90], chg: [56, 10], cbat: [61, 20, 90], tp: [53, 29], ledRes: [67, 6], led: [72, 6], pack: [28, 44] } },
      ),
    ],
    outlines: [
      { name: 'CPU', x: 82, y: 3, w: 30, h: 26 },
      { name: '3.3 V', x: 48, y: 33, w: 20, h: 24 },
      { name: 'D-PAD', x: 4, y: 59, w: 42, h: 30 },
      { name: 'BUTTONS', x: 118, y: 59, w: 30, h: 30 },
    ],
    parts: [
      c('U4', 'U-LDO33T', 'POWER', 56, 43, 0, { IN: 'VSYS', GND: 'GND', OUT: 'VCC' }, '3.3 V regulator (laid flat, legs bent down)'),
      c('C3', 'C-1U', 'POWER', 65, 37, 90, { '1': 'VSYS', '2': 'GND' }, 'Regulator input capacitor'),
      c('C4', 'C-10U-6', 'POWER', 65, 50, 90, { '1': 'VCC', '2': 'GND' }, 'Regulator output capacitor'),
      c('C5', 'C-100N', 'CPU', 85, 14, 90, { '1': 'VCC', '2': 'GND' }, 'CPU decoupling'),
      c('TP3', 'TP', 'POWER', 80, 27, 0, { '1': 'VCC' }, '3.3 V rail'),
      c('TP4', 'TP', 'POWER', 10, 80, 0, { '1': 'GND' }, 'Ground'),
      cx('U2', sp.cpu, 'CPU', 96, 14, 0, { VDD: 'VCC', GND: 'GND', PWR: 'START', LED: 'LED_IO', VEN: 'LCD_D', SND: 'SND', OK1: 'VCC', OK2: 'VCC', OK3: 'VCC', OK4: 'VCC', BA: 'UP', DIN: 'DOWN', CE: 'LEFT', DP: 'RIGHT', EN: 'BTN_A', BB: 'BTN_B' }, 'CPU'),
      c('R3', 'R-10K', 'CPU', 104, 25, 90, { '1': 'VCC', '2': 'START' }, 'Game button pull-up'),
      c('SW1', 'SW-TACT', 'CTRL', 60, 83, 0, { '1': 'START', '2': 'GND' }, 'Game button'),
      c('SW2', 'SW-TACT', 'CTRL', 25, 65, 0, { '1': 'UP', '2': 'GND' }, 'D-pad up'),
      c('SW3', 'SW-TACT', 'CTRL', 25, 83, 0, { '1': 'DOWN', '2': 'GND' }, 'D-pad down'),
      c('SW4', 'SW-TACT', 'CTRL', 15, 74, 0, { '1': 'LEFT', '2': 'GND' }, 'D-pad left'),
      c('SW5', 'SW-TACT', 'CTRL', 35, 74, 0, { '1': 'RIGHT', '2': 'GND' }, 'D-pad right'),
      c('SW6', 'SW-TACT', 'CTRL', 140, 70, 0, { '1': 'BTN_A', '2': 'GND' }, 'A button'),
      c('SW7', 'SW-TACT', 'CTRL', 127, 79, 0, { '1': 'BTN_B', '2': 'GND' }, 'B button'),
      c('R4', 'R-10K', 'CTRL', 31, 65, 90, { '1': 'VCC', '2': 'UP' }, 'Up pull-up'),
      c('R5', 'R-10K', 'CTRL', 31, 83, 90, { '1': 'VCC', '2': 'DOWN' }, 'Down pull-up'),
      c('R6', 'R-10K', 'CTRL', 8, 70, 90, { '1': 'VCC', '2': 'LEFT' }, 'Left pull-up'),
      c('R7', 'R-10K', 'CTRL', 41, 74, 90, { '1': 'VCC', '2': 'RIGHT' }, 'Right pull-up'),
      c('R8', 'R-10K', 'CTRL', 146, 65, 90, { '1': 'VCC', '2': 'BTN_A' }, 'A pull-up'),
      c('R9', 'R-10K', 'CTRL', 121, 85, 90, { '1': 'VCC', '2': 'BTN_B' }, 'B pull-up'),
      c('J3', 'J-FPC3', 'SCREEN', 92, 81, 0, { VCC: 'VCC', DATA: 'LCD_D', GND: 'GND' }, 'LCD ribbon connector'),
      c('LCD1', 'M-DBLCD', 'SCREEN', 92, 56, 0, { VCC: 'LCD1_VCC', DATA: 'LCD1_DATA', GND: 'LCD1_GND' }, 'Segment LCD', 'J3'),
      cx('U3', 'U-SA8002', 'SOUND', 118, 12, 0, { VDD: 'VCC', GND: 'GND', EN: 'SND', OUTP: 'SPK_P', OUTN: 'SPK_N' }, 'Beeper driver'),
      c('R10', 'R-100K', 'SOUND', 110, 20, 90, { '1': 'SND', '2': 'GND' }, 'Beeper enable pull-down'),
      c('J4', 'J-JST2', 'SOUND', 131, 22, 0, { '1': 'SPK_P', '2': 'SPK_N' }, 'Speaker plug'),
      c('SPK1', 'M-SPK4', 'SOUND', 131, 40, 0, { '1': 'SPK1_A', '2': 'SPK1_B' }, 'Speaker', 'J4'),
    ],
    traces: [],
    testPoints: [
      { ref: 'TP1', net: 'VBUS', expected: '5 V with the charger plugged in' },
      { ref: 'TP2', net: 'VSYS', expected: '3.7–4.2 V (battery)' },
      { ref: 'TP3', net: 'VCC', expected: '3.3 V' },
      { ref: 'TP4', net: 'GND', expected: '0 V' },
    ],
    rails: [
      { net: 'VBUS', nominal: 5, label: 'VBUS' },
      { net: 'VSYS', nominal: 3.8, label: 'VSYS' },
      { net: 'VCC', nominal: 3.3, label: 'VCC' },
    ],
    nets: {
      GND: { desc: 'Ground', expected: 0 },
      VBUS: { desc: 'USB 5 V after the fuse', expected: 5 },
      VSYS: { desc: 'Battery rail — the cell voltage, a little higher while charging', expected: 3.8 },
      VCC: { desc: '3.3 V from the flat regulator U4', expected: 3.3, power: true },
      CHG: { desc: 'Charge status — pulled low while charging (lights the red LED)' },
      START: { desc: 'Game button (low when pressed)' },
      UP: { desc: 'D-pad up (low when pressed)' },
      DOWN: { desc: 'D-pad down (low when pressed)' },
      LEFT: { desc: 'D-pad left (low when pressed)' },
      RIGHT: { desc: 'D-pad right (low when pressed)' },
      BTN_A: { desc: 'A button (low when pressed)' },
      BTN_B: { desc: 'B button (low when pressed)' },
      LCD_D: { desc: 'Segment data to the LCD' },
      SND: { desc: 'Beeper enable' },
    },
    input: { ref: 'J1', plus: 'VBUS', minus: 'GND', adapter: { v: 5.1, ilim: 1, rint: 0.2, label: "the owner's USB charger" }, psuV: 5, psuI: 1 },
    ground: 'TP4',
    controls: [
      { ref: 'SW1', label: 'Game button' },
      { ref: 'SW2', label: 'D-pad up' },
      { ref: 'SW3', label: 'D-pad down' },
      { ref: 'SW4', label: 'D-pad left' },
      { ref: 'SW5', label: 'D-pad right' },
      { ref: 'SW6', label: 'A button' },
      { ref: 'SW7', label: 'B button' },
    ],
    firmware: {
      ref: 'U2',
      vmin: 2.2,
      vmax: 3.6,
      inputs: ['PWR'],
      boot: () => ({ on: 0 }),
      step(state, inputs, prev) {
        if (!inputs.PWR && prev.PWR) state.on = 1;
        return { VEN: true, SND: state.on === 1, LED: true };
      },
    },
    functional,
    complain,
    status(b, op) {
      if (!op) return [];
      const st = state(b, op);
      return [
        { label: 'Screen', value: st.picture ? 'segments showing' : 'blank', ok: st.picture },
        { label: 'Beeper', value: st.sound ? 'beeping' : 'silent', ok: st.sound },
        { label: 'Charge light (red)', value: op.current('D2') > 5e-4 ? 'on (charging)' : 'off', ok: op.current('D2') > 5e-4 },
        { label: 'Battery rail', value: `${op.net('VSYS').toFixed(2)} V` },
      ];
    },
    variants,
    missable: ['C3', 'C4', 'C5'],
    carbonise: [['VCC', 'GND', 'C4']],
    marketValue: sp.marketValue,
    quoteBase: sp.quoteBase,
    minReputation: sp.minReputation,
  });
  // The front of the case: the screen sits flush in its window, plastic caps over the buttons,
  // holes over the speaker and a tunnel for the USB-C port.
  dev.face = {
    windows: [[92, 56, 42, 34]],
    dpad: [25, 74],
    buttons: [[140, 70], [127, 79]],
    smallButtons: [[60, 83]],
    grille: [131, 40],
    ports: [[19, 1.5, 12, 11]],
    height: 7.2,
    corners: [9, 9, 9, 9],
  };
  silk(dev.components, { U2: 'CPU', SW1: 'GAME', SW2: 'UP', SW3: 'DOWN', SW4: 'LEFT', SW5: 'RIGHT', SW6: 'A', SW7: 'B', BT1: 'BATTERY', J1: 'USB-C', J3: 'LCD', U3: 'BEEPER', U4: '3.3V', J4: 'SPEAKER' });
  return dev;
}

export const GAME_CLOCK = lcdGame({ id: 'game-clock', name: 'Game & Clock', tagline: 'Pocket LCD game with a clock: USB charging, a soldered-in battery and a flat regulator.', cpu: 'U-GNC-CPU', marketValue: 70, quoteBase: 25, minReputation: 0 });
export const CRITTER_MINI = lcdGame({ id: 'critter-mini', name: 'Critter Mini', tagline: 'Rare LCD virtual pet — sometimes a total loss.', cpu: 'U-CRT-CPU', totalLoss: true, marketValue: 120, quoteBase: 30, minReputation: 5 });
