/**
 * Pocket LCD games (fictional): Game & Clock and Critter Mini. Two button cells in a clip
 * power a tiny CPU straight away (no power switch — the clock never stops); a segment LCD
 * on a ribbon, a speaker and a game button. Critter Mini also has its notorious
 * catastrophic-corrosion "total loss" fault.
 */
import { device } from '../blocks/core';
import { c, type DeviceDef } from '../board';
import { customerSession, type BoardState, type DamageEvent, type FunctionalReport, type OperatingPoint } from '../circuit';
import { tarnish } from '../contacts';
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
      id: 'clip-tarnish',
      family: 'Dirty contacts',
      tier: 1,
      weight: 1.4,
      apply(b, rng) {
        tarnish(b, 'J1', rng.range(0.93, 0.99), () => rng.next());
        return { summary: 'The coin-cell clip contacts are oxidised from an old leaked cell: new cells make no contact. Scrub and Pad-Bright the clip.', refs: ['J1'], hint: 'Fresh cells, nothing. Measure on the clip contacts themselves.', flavor: 'New batteries and it is still dead.' };
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
        liquidDamage(b, rng, ['J1', 'C1', 'R1', 'R2', 'J3'], 0.6, 0.9);
        b.comps.U1.part = null;
        addMark(b, 'U1', 'corrosion');
        return {
          summary: 'Catastrophic corrosion: the main chip has fallen off its corroded pads and everything is crusted. Only a donor board can supply that chip — without one it is a total loss. Clean everything and fit a donor chip.',
          refs: ['U1', 'J1', 'C1', 'R1', 'R2', 'J3'],
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
    s.end();
    const checks = [
      { label: 'The screen shows the game', ok: st.picture },
      { label: 'It beeps', ok: st.sound },
    ];
    return { checks, facts: st, inputCurrent: op.srcI, events: s.events, passed: checks.every((x) => x.ok) && !s.events.length };
  }

  function complain(r: FunctionalReport, events: DamageEvent[], rng: Rng): string {
    const f = r.facts as Record<string, boolean>;
    if (!f.picture) return rng.pick(['Nothing on the screen.', 'Dead, even with new batteries.']) + (events.length ? ' It got warm.' : '');
    if (!f.sound) return 'No beeps.';
    return 'Something is wrong with it.';
  }

  const dev = device({
    id: sp.id,
    name: sp.name,
    category: 'LCD game',
    tagline: sp.tagline,
    width: 120,
    height: 80,
    blocks: [],
    outlines: [{ name: 'CPU', x: 38, y: 3, w: 30, h: 22 }],
    parts: [
      c('J1', 'J-CELLCLIP', 'POWER', 10, 12, 0, { '+': 'VCC', '-': 'GND' }, 'Coin-cell clip'),
      c('BT1', 'M-LR44X2', 'POWER', 20, 42, 0, { '+': 'BT1_P', '-': 'BT1_N' }, '2 × LR44 cells', 'J1'),
      c('C1', 'C-10U-6', 'POWER', 28, 10, 90, { '1': 'VCC', '2': 'GND' }, 'Supply capacitor'),
      c('TP1', 'TP', 'POWER', 6, 74, 0, { '1': 'GND' }, 'Ground'),
      c('TP2', 'TP', 'POWER', 36, 22, 0, { '1': 'VCC' }, 'Supply (≈3 V)'),
      cx('U1', sp.cpu, 'CPU', 52, 13, 0, { VDD: 'VCC', GND: 'GND', PWR: 'START', LED: 'LED_IO', VEN: 'LCD_D', SND: 'SND', OK1: 'VCC', OK2: 'VCC', OK3: 'VCC', OK4: 'VCC', BA: 'VCC', DIN: 'VCC' }, 'CPU'),
      c('R1', 'R-10K', 'CPU', 70, 20, 90, { '1': 'VCC', '2': 'START' }, 'Game button pull-up'),
      c('SW1', 'SW-TACT', 'CPU', 100, 72, 0, { '1': 'START', '2': 'GND' }, 'Game button'),
      c('J3', 'J-FPC3', 'SCREEN', 62, 27, 0, { VCC: 'VCC', DATA: 'LCD_D', GND: 'GND' }, 'LCD ribbon connector'),
      c('LCD1', 'M-DBLCD', 'SCREEN', 62, 52, 0, { VCC: 'LCD1_VCC', DATA: 'LCD1_DATA', GND: 'LCD1_GND' }, 'Segment LCD', 'J3'),
      cx('U2', 'U-SA8002', 'SOUND', 94, 12, 0, { VDD: 'VCC', GND: 'GND', EN: 'SND', OUTP: 'SPK_P', OUTN: 'SPK_N' }, 'Beeper driver'),
      c('R2', 'R-100K', 'SOUND', 84, 20, 90, { '1': 'SND', '2': 'GND' }, 'Beeper enable pull-down'),
      c('J4', 'J-JST2', 'SOUND', 104, 30, 0, { '1': 'SPK_P', '2': 'SPK_N' }, 'Speaker plug'),
      c('SPK1', 'M-SPK4', 'SOUND', 104, 52, 0, { '1': 'SPK1_A', '2': 'SPK1_B' }, 'Speaker', 'J4'),
    ],
    traces: [],
    testPoints: [
      { ref: 'TP1', net: 'GND', expected: '0 V' },
      { ref: 'TP2', net: 'VCC', expected: '≈3 V (two LR44 cells)' },
    ],
    rails: [{ net: 'VCC', nominal: 3, label: 'VCC' }],
    nets: {
      GND: { desc: 'Ground', expected: 0 },
      VCC: { desc: 'Supply from the button cells', expected: 3, power: true },
      START: { desc: 'Game button (low when pressed)' },
      LCD_D: { desc: 'Segment data to the LCD' },
      SND: { desc: 'Beeper enable' },
    },
    input: { ref: 'J1', plus: '+', minus: '-', adapter: { v: 3, ilim: 0.3, rint: 0.5, label: 'fresh cells' }, psuV: 3, psuI: 0.2 },
    ground: 'TP1',
    controls: [{ ref: 'SW1', label: 'Game button' }],
    firmware: {
      ref: 'U1',
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
      ];
    },
    variants,
    missable: ['C1'],
    carbonise: [['VCC', 'GND', 'C1']],
    marketValue: sp.marketValue,
    quoteBase: sp.quoteBase,
    minReputation: sp.minReputation,
  });
  silk(dev.components, { U1: 'CPU', SW1: 'GAME', J1: 'BATTERY', J3: 'LCD', U2: 'BEEPER', J4: 'SPEAKER' });
  return dev;
}

export const GAME_CLOCK = lcdGame({ id: 'game-clock', name: 'Game & Clock', tagline: 'Pocket LCD game with a clock: faded screens and crusty cell clips.', cpu: 'U-GNC-CPU', marketValue: 70, quoteBase: 25, minReputation: 0 });
export const CRITTER_MINI = lcdGame({ id: 'critter-mini', name: 'Critter Mini', tagline: 'Rare LCD virtual pet — sometimes a total loss.', cpu: 'U-CRT-CPU', totalLoss: true, marketValue: 120, quoteBase: 30, minReputation: 5 });
