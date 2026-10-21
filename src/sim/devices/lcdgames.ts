/**
 * Pocket LCD games (fictional): Game & Clock and Critter Mini. A USB-C port charges a
 * soldered-in Li-ion pouch cell (no battery door), a 3.3 V regulator laid flat on the board
 * (bent legs) feeds a tiny CPU that never switches off (the clock keeps running); a segment
 * LCD on a ribbon, a speaker, a D-pad, A / B buttons and a Power button. Critter Mini also has
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
  /** Printed on the top of the case. */
  caseTitle: string;
  tagline: string;
  cpu: string;
  totalLoss?: boolean;
  marketValue: number;
  quoteBase: number;
  minReputation: number;
}

/** How dark the LCD writing is, from the voltage the screen gets (full from ~3.1 V, gone below 2.4 V). */
export const lcdContrast = (v: number): number => Math.max(0, Math.min(1, (v - 2.4) / 0.7));

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
      id: 'contrast-burnt',
      family: 'Burnt contrast resistor',
      tier: 1,
      weight: 1.0,
      apply(b, rng) {
        b.comps.R11.fault = { type: 'high', r: Math.round(rng.range(55, 75)) };
        addMark(b, 'R11', 'discolored');
        return { summary: 'The screen contrast resistor R11 has burnt out high: it should be about 10 Ω but reads far more, so the LCD gets too little voltage and the writing is faint. Replace R11.', refs: ['R11'], hint: 'The screen works but the writing is pale. Measure the voltage at the LCD connector against the 3.3 V supply — where is it being lost? Check R11 with the meter.', flavor: 'The screen has gone really faint — I can hardly read the time.' };
      },
    },
    {
      id: 'contrast-crooked',
      family: 'Misaligned resistor',
      tier: 1,
      weight: 0.8,
      apply(b, rng) {
        addMark(b, 'R11', 'crooked');
        b.comps.R11.joints['1'] = { r: Math.round(rng.range(40, 60)), cold: true };
        return { summary: 'The contrast resistor R11 was soldered on crooked and one end barely touches its pad, adding resistance in series: the LCD is starved and the writing is faint. Re-seat or replace R11 (flux, reflow, straighten it).', refs: ['R11'], hint: 'Pale writing. Look at R11 under the microscope — is it sitting square on both pads?', flavor: 'It has been a bit faint since the repair shop had it open.' };
      },
    },
    {
      id: 'contrast-cold',
      family: 'Cold solder joint',
      tier: 1,
      weight: 0.8,
      apply(b, rng) {
        b.comps.R11.joints['2'] = { r: Math.round(rng.range(35, 65)), cold: true };
        return { summary: 'A cold, cracked solder joint on the contrast resistor R11 adds resistance in series, so the LCD is starved and the writing is faint. Reflow the joint with flux.', refs: ['R11'], hint: 'Pale writing. Measure the voltage across R11: it should drop only a little. Inspect both ends of R11 under the microscope.', flavor: 'The screen got fainter over the years, and sometimes it comes back if I tap it.' };
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
        return { summary: 'The Power button contact is worn out: the game never starts. Replace the button contact.', refs: ['SW1'], hint: 'Press Power and measure its line: does it drop to 0 V?', flavor: 'The clock works but I cannot start a game.' };
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
        liquidDamage(b, rng, ['C3', 'C4', 'R3', 'R10', 'R11', 'J3'], 0.6, 0.9);
        b.comps.U2.part = null;
        addMark(b, 'U2', 'corrosion');
        return {
          summary: 'Catastrophic corrosion: the main chip has fallen off its corroded pads and everything is crusted. Only a donor board can supply that chip — without one it is a total loss. Clean everything and fit a donor chip.',
          refs: ['U2', 'C3', 'C4', 'R3', 'R10', 'R11', 'J3'],
          hint: 'Look at it under the light. Is the main chip even still there?',
          flavor: 'Found it in the loft after the roof leaked. It is a rare one — can you save it?',
        };
      },
    });

  const lcdOn = (op: OperatingPoint) => op.at({ ref: 'LCD1', pin: 'VCC' }) - op.at({ ref: 'LCD1', pin: 'GND' }) > 2.4 && op.at({ ref: 'LCD1', pin: 'DATA' }) - op.at({ ref: 'LCD1', pin: 'GND' }) > 1.2;
  const state = (b: BoardState, op: OperatingPoint) => ({
    picture: lcdOn(op) && b.mcu.running && b.comps.LCD1.fault?.type !== 'dead',
    sound: Math.abs(op.current('SPK1')) > 0.03,
    contrast: lcdContrast(op.at({ ref: 'LCD1', pin: 'VCC' }) - op.at({ ref: 'LCD1', pin: 'GND' })),
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
      { label: 'The writing on the screen is dark and clear', ok: !st.picture || st.contrast > 0.7 },
      { label: 'It charges from USB (charge light on)', ok: charging },
    ];
    return { checks, facts: { ...st, charging }, inputCurrent: op2.srcI, events: s.events, passed: checks.every((x) => x.ok) && !s.events.length };
  }

  function complain(r: FunctionalReport, events: DamageEvent[], rng: Rng): string {
    const f = r.facts as Record<string, boolean | number>;
    if (f.picture && (f.contrast as number) <= 0.7) return rng.pick(['The writing on the screen is really faint.', 'I can barely read the screen — it is all washed out.']);
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
        outline: { name: 'USB-C / CHARGER', x: 12, y: 2, w: 66, h: 19 },
        layout: { conn: [19, 3.2], fuse: [30, 9], tvs: [35, 16, 270], tp: [24, 18] },
      }),
      place(
        'CHG',
        liIonCharger({ sense: true, cin: 'C-10U-25', cbat: 'C-22U-10', led: true, battery: 'soldered' }),
        [28, 2],
        { vin: 'VBUS', bat: 'VSYS', stat: 'CHG' },
        { sense: 'R1', cin: 'C1', chg: 'U1', cbat: 'C2', tp: 'TP2', ledRes: 'R2', led: 'D2', pack: 'BT1' },
        { outline: null, layout: { sense: [44, 8], cin: [49, 16, 90], chg: [56, 9], cbat: [62, 16, 90], tp: [70, 17], ledRes: [68, 5], led: [74, 5], pack: [21, 34] } },
      ),
    ],
    outlines: [
      { name: 'CPU', x: 82, y: 3, w: 30, h: 18 },
      { name: '3.3 V', x: 44, y: 70, w: 24, h: 19 },
      { name: 'D-PAD', x: 4, y: 49, w: 36, h: 40 },
      { name: 'BUTTONS', x: 114, y: 48, w: 34, h: 40 },
    ],
    parts: [
      c('U4', 'U-LDO33T', 'POWER', 52, 77, 0, { IN: 'VSYS', GND: 'GND', OUT: 'VCC' }, '3.3 V regulator (laid flat, legs bent down)'),
      c('C3', 'C-1U', 'POWER', 63, 75, 90, { '1': 'VSYS', '2': 'GND' }, 'Regulator input capacitor'),
      c('C4', 'C-10U-6', 'POWER', 63, 83, 90, { '1': 'VCC', '2': 'GND' }, 'Regulator output capacitor'),
      c('C5', 'C-100N', 'CPU', 89, 15, 90, { '1': 'VCC', '2': 'GND' }, 'CPU decoupling'),
      c('TP3', 'TP', 'POWER', 82, 18, 0, { '1': 'VCC' }, '3.3 V rail'),
      c('TP4', 'TP', 'POWER', 10, 85, 0, { '1': 'GND' }, 'Ground'),
      cx('U2', sp.cpu, 'CPU', 97, 12, 0, { VDD: 'VCC', GND: 'GND', PWR: 'START', LED: 'LED_IO', VEN: 'LCD_D', SND: 'SND', OK1: 'VCC', OK2: 'VCC', OK3: 'VCC', OK4: 'VCC', BA: 'UP', DIN: 'DOWN', CE: 'LEFT', DP: 'RIGHT', EN: 'BTN_A', BB: 'BTN_B' }, 'CPU'),
      c('R3', 'R-10K', 'CPU', 105, 18, 90, { '1': 'VCC', '2': 'START' }, 'Power button pull-up'),
      c('SW1', 'SW-TACT', 'CTRL', 75, 83, 0, { '1': 'START', '2': 'GND' }, 'Power button'),
      c('SW2', 'SW-TACT', 'CTRL', 22, 54, 0, { '1': 'UP', '2': 'GND' }, 'D-pad up'),
      c('SW3', 'SW-TACT', 'CTRL', 22, 74, 0, { '1': 'DOWN', '2': 'GND' }, 'D-pad down'),
      c('SW4', 'SW-TACT', 'CTRL', 12, 64, 0, { '1': 'LEFT', '2': 'GND' }, 'D-pad left'),
      c('SW5', 'SW-TACT', 'CTRL', 32, 64, 0, { '1': 'RIGHT', '2': 'GND' }, 'D-pad right'),
      c('SW6', 'SW-TACT', 'CTRL', 138, 56, 0, { '1': 'BTN_A', '2': 'GND' }, 'A button'),
      c('SW7', 'SW-TACT', 'CTRL', 126, 66, 0, { '1': 'BTN_B', '2': 'GND' }, 'B button'),
      c('R4', 'R-10K', 'CTRL', 28, 54, 90, { '1': 'VCC', '2': 'UP' }, 'Up pull-up'),
      c('R5', 'R-10K', 'CTRL', 28, 74, 90, { '1': 'VCC', '2': 'DOWN' }, 'Down pull-up'),
      c('R6', 'R-10K', 'CTRL', 6, 64, 90, { '1': 'VCC', '2': 'LEFT' }, 'Left pull-up'),
      c('R7', 'R-10K', 'CTRL', 38, 71, 90, { '1': 'VCC', '2': 'RIGHT' }, 'Right pull-up'),
      c('R8', 'R-10K', 'CTRL', 144, 56, 90, { '1': 'VCC', '2': 'BTN_A' }, 'A pull-up'),
      c('R9', 'R-10K', 'CTRL', 132, 66, 90, { '1': 'VCC', '2': 'BTN_B' }, 'B pull-up'),
      c('R11', 'R-10R-1206', 'SCREEN', 87, 74, 0, { '1': 'VCC', '2': 'LCD_V' }, 'LCD contrast resistor'),
      c('J3', 'J-FPC3', 'SCREEN', 75, 74, 0, { VCC: 'LCD_V', DATA: 'LCD_D', GND: 'GND' }, 'LCD ribbon connector'),
      c('LCD1', 'M-DBLCD', 'SCREEN', 75, 47, 0, { VCC: 'LCD1_VCC', DATA: 'LCD1_DATA', GND: 'LCD1_GND' }, 'Segment LCD', 'J3'),
      cx('U3', 'U-SA8002', 'SOUND', 122, 8, 0, { VDD: 'VCC', GND: 'GND', EN: 'SND', OUTP: 'SPK_P', OUTN: 'SPK_N' }, 'Beeper driver'),
      c('R10', 'R-100K', 'SOUND', 114, 13, 90, { '1': 'SND', '2': 'GND' }, 'Beeper enable pull-down'),
      c('J4', 'J-JST2', 'SOUND', 131, 16, 0, { '1': 'SPK_P', '2': 'SPK_N' }, 'Speaker plug'),
      c('SPK1', 'M-SPK4', 'SOUND', 131, 32, 0, { '1': 'SPK1_A', '2': 'SPK1_B' }, 'Speaker', 'J4'),
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
      START: { desc: 'Power button (low when pressed)' },
      UP: { desc: 'D-pad up (low when pressed)' },
      DOWN: { desc: 'D-pad down (low when pressed)' },
      LEFT: { desc: 'D-pad left (low when pressed)' },
      RIGHT: { desc: 'D-pad right (low when pressed)' },
      BTN_A: { desc: 'A button (low when pressed)' },
      BTN_B: { desc: 'B button (low when pressed)' },
      LCD_V: { desc: 'LCD supply after the contrast resistor — a little under 3.3 V; lower means fainter writing', expected: 3.2 },
      LCD_D: { desc: 'Segment data to the LCD' },
      SND: { desc: 'Beeper enable' },
    },
    input: { ref: 'J1', plus: 'VBUS', minus: 'GND', adapter: { v: 5.1, ilim: 1, rint: 0.2, label: "the owner's USB charger" }, psuV: 5, psuI: 1 },
    ground: 'TP4',
    controls: [
      { ref: 'SW1', label: 'Power button' },
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
        { label: 'Screen contrast', value: st.picture ? `${Math.round(st.contrast * 100)} %` : '—', ok: !st.picture || st.contrast > 0.7 },
        { label: 'Charge light (red)', value: op.current('D2') > 5e-4 ? 'on (charging)' : 'off', ok: op.current('D2') > 5e-4 },
        { label: 'Battery rail', value: `${op.net('VSYS').toFixed(2)} V` },
      ];
    },
    variants,
    missable: ['C3', 'C4', 'C5', 'R11'],
    carbonise: [['VCC', 'GND', 'C4']],
    marketValue: sp.marketValue,
    quoteBase: sp.quoteBase,
    minReputation: sp.minReputation,
  });
  // The front of the case: the screen sits flush in its window, plastic caps over the buttons,
  // holes over the speaker and a tunnel for the USB-C port.
  dev.face = {
    windows: [[75, 45, 66, 38]],
    dpad: [22, 64],
    buttons: [[138, 56], [126, 66]],
    smallButtons: [[75, 83]],
    speaker: [131, 32],
    ports: [[19, 1.5, 12, 11]],
    height: 7.2,
    corners: [10, 10, 10, 10],
    labels: [
      { text: sp.caseTitle, at: [75, 13], size: 6.5, bold: true },
      { text: 'A', at: [138, 47.5], size: 4, bold: true },
      { text: 'B', at: [126, 74.5], size: 4, bold: true },
      { text: 'POWER', at: [75, 89], size: 2.8, bold: true },
    ],
  };
  dev.logo = { x: 120, y: 73, w: 36 };
  silk(dev.components, { U2: 'CPU', SW1: 'POWER', SW2: 'UP', SW3: 'DOWN', SW4: 'LEFT', SW5: 'RIGHT', SW6: 'A', SW7: 'B', BT1: 'BATTERY', J1: 'USB-C', J3: 'LCD', U3: 'BEEPER', U4: '3.3V', J4: 'SPEAKER', R11: 'CONTRAST' });
  return dev;
}

export const GAME_CLOCK = lcdGame({ id: 'game-clock', name: 'TMWB Gamer Clock', caseTitle: 'TMWB GAMER CLOCK', tagline: 'Pocket LCD game with a clock: USB charging, a soldered-in battery and a flat regulator.', cpu: 'U-GNC-CPU', marketValue: 70, quoteBase: 25, minReputation: 0 });
export const CRITTER_MINI = lcdGame({ id: 'critter-mini', name: 'Critter Mini', caseTitle: 'CRITTER MINI', tagline: 'Rare LCD virtual pet — sometimes a total loss.', cpu: 'U-CRT-CPU', totalLoss: true, marketValue: 120, quoteBase: 30, minReputation: 5 });
