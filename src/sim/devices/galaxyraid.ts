/**
 * Galaxy Raid (fictional, 1979) arcade logic board. Pure TTL-style logic on a 5 V supply
 * from the cabinet: clock oscillator → horizontal and vertical counters → EPROM + video
 * shifter → line driver → monitor; a noise-generator chip makes the explosions. Chips sit
 * in sockets. A prestige restoration job: scope the counters, replace worn sockets, find
 * the EPROM with the missing leg, and survive the mis-plugged-stack disaster.
 */
import { device, place } from '../blocks/core';
import { powerInput } from '../blocks/power';
import { c } from '../board';
import { customerSession, type BoardState, type DamageEvent, type FunctionalReport, type OperatingPoint } from '../circuit';
import { resistor } from '../elements';
import { addMark, type Rng, type Variant } from '../faults';
import { cx } from './retro';

const VARIANTS: Variant[] = [
  {
    id: 'counter-dead',
    family: 'Failed logic chip',
    tier: 2,
    weight: 1.2,
    apply(b) {
      b.comps.U2.fault = { type: 'dead' };
      return {
        summary: 'The vertical counter U2 has died: good clock in, nothing out, so the same few lines repeat down the screen. Replace U2 (into its socket).',
        refs: ['U2'],
        hint: 'Scope the counters in order from the clock: which chip has good inputs but no outputs?',
        flavor: 'The same 16 lines repeat all the way down the screen.',
      };
    },
  },
  {
    id: 'socket-worn',
    family: 'Worn socket',
    tier: 2,
    weight: 1,
    apply(b) {
      b.comps.U1.joints.CLK = { r: Infinity, cracked: true };
      addMark(b, 'U1', 'loose');
      return {
        summary: 'The cheap single-leaf socket under U1 has lost its grip on the clock pin. Replace the socket (a dual-leaf one) and re-seat the chip.',
        refs: ['U1'],
        hint: 'Clock is fine at the oscillator but never arrives at U1’s own pin. Press on the chip while it runs…',
        flavor: 'It flickers on if I tap the board, then goes black again.',
      };
    },
  },
  {
    id: 'eprom-leg',
    family: 'Bad previous repair',
    tier: 2,
    weight: 0.9,
    apply(b) {
      b.comps.U4.joints.DO = { r: Infinity, cracked: true };
      addMark(b, 'U4', 'bent-pin');
      return {
        summary: 'Someone has had the EPROM U4 out before and snapped its data leg: it never reaches the socket. Fit a freshly programmed EPROM.',
        refs: ['U4'],
        hint: 'Counters all count, but no graphics data. Look very closely at the EPROM legs.',
        flavor: 'A previous owner "had a go". Now there are no graphics, just a black screen.',
        previousRepair: true,
      };
    },
  },
  {
    id: 'osc-dead',
    family: 'Dead oscillator',
    tier: 2,
    weight: 0.8,
    apply(b) {
      b.comps.X1.fault = { type: 'dead' };
      return {
        summary: 'The clock oscillator X1 is dead: nothing on the board is clocked, so nothing happens at all. Replace X1.',
        refs: ['X1'],
        hint: '5 V is fine everywhere. Put the scope on the clock: is there one?',
        flavor: 'Power is on, the monitor is black and silent.',
      };
    },
  },
  {
    id: 'noise-dead',
    family: 'Failed sound chip',
    tier: 2,
    weight: 0.8,
    apply(b) {
      b.comps.U6.fault = { type: 'dead' };
      return {
        summary: 'The noise-generator chip U6 is dead: the game plays but the explosions are silent. Replace U6.',
        refs: ['U6'],
        hint: 'Picture fine, explosion sound missing. Is the sound chip enabled, and does it output anything?',
        flavor: 'Plays fine but the explosions make no sound.',
      };
    },
  },
  {
    id: 'misplug',
    family: 'Mis-plugged board stack',
    tier: 3,
    weight: 0.5,
    apply(b) {
      b.comps.U2.fault = { type: 'dead' };
      b.comps.U1.fault = { type: 'dead' };
      b.comps.U7.fault = { type: 'dead' };
      addMark(b, 'U7', 'discolored');
      return {
        summary: 'The board stack was plugged together one row off: it killed both counters (U1, U2) and the rare video line driver U7 (only from abroad). Replace all three — check every chip on the clock path, not just the first dead one.',
        refs: ['U1', 'U2', 'U7'],
        hint: 'Several chips are dead at once. Work along the signal path from the clock and test every stage.',
        flavor: 'I took the boards apart to clean them and put them back… now nothing.',
      };
    },
  },
];

const state = (op: OperatingPoint) => ({
  picture: op.current('mon-vid') > 2e-3,
  sound: op.current('mon-aud') > 2e-3,
});

function functional(b: BoardState): FunctionalReport {
  b.attached = ['monitor'];
  const s = customerSession(b, { kind: 'adapter' });
  const op = s.settle();
  const st = state(op);
  s.end();
  const checks = [
    { label: 'Picture on the monitor', ok: st.picture },
    { label: 'Explosion sounds', ok: st.sound },
  ];
  return { checks, facts: st, inputCurrent: op.srcI, events: s.events, passed: checks.every((x) => x.ok) && !s.events.length };
}

function complain(r: FunctionalReport, events: DamageEvent[], rng: Rng): string {
  const f = r.facts as Record<string, boolean>;
  if (!f.picture) return rng.pick(['Black screen.', 'The monitor shows nothing.']) + (events.length ? ' Something smoked.' : '');
  if (!f.sound) return 'The game plays but it is silent.';
  return 'It acts strange.';
}

export const GALAXY_RAID = device({
  id: 'galaxy-raid',
  name: 'Galaxy Raid (arcade logic board)',
  category: 'Arcade',
  tagline: '1979 cocktail-cabinet logic board: a forest of socketed logic chips.',
  width: 160,
  height: 100,
  blocks: [place('IN', powerInput({ connector: 'header', volts: 5, fuse: 'F-3A', bulk: 'C-1000U-16', source: 'the cabinet supply' }), [2, 2], { out: '5V' }, { conn: 'J1', fuse: 'F1', bulk: 'C1', tpIn: 'TP1', tpOut: 'TP2' }, { faults: true })],
  outlines: [
    { name: 'CLOCK / COUNTERS', x: 38, y: 2, w: 88, h: 28 },
    { name: 'GRAPHICS', x: 30, y: 34, w: 124, h: 30 },
    { name: 'SOUND', x: 30, y: 70, w: 70, h: 26 },
  ],
  parts: [
    cx('X1', 'U-OSC14', 'CLOCK', 50, 14, 0, { VCC: '5V', GND: 'GND', OUT: 'CLK' }, 'Clock oscillator'),
    cx('U1', 'U-CNT16', 'CLOCK', 80, 14, 0, { VCC: '5V', GND: 'GND', CLK: 'CLK', Q: 'HCNT' }, 'Horizontal counter'),
    cx('U2', 'U-CNT16', 'CLOCK', 110, 14, 0, { VCC: '5V', GND: 'GND', CLK: 'HCNT', Q: 'VCNT' }, 'Vertical counter'),
    cx('U4', 'U-EPROM-GR', 'GRAPHICS', 52, 48, 0, { VCC: '5V', GND: 'GND', CE: 'VCNT', DO: 'GFX' }, 'Graphics EPROM'),
    cx('U3', 'U-SHIFT16', 'GRAPHICS', 100, 48, 0, { VCC: '5V', GND: 'GND', CLK: 'HCNT', D: 'GFX', VID: 'VID' }, 'Video shifter'),
    cx('U7', 'U-LINEDRV', 'GRAPHICS', 132, 48, 0, { VCC: '5V', GND: 'GND', IN: 'VID', OUT: 'VIDOUT' }, 'Video line driver'),
    cx('U6', 'U-NOISE14', 'SOUND', 60, 82, 0, { VCC: '5V', GND: 'GND', EN: 'VCNT', AOUT: 'AUD' }, 'Noise generator (explosions)'),
    c('J2', 'J-RCA', 'GRAPHICS', 150, 70, 0, { SIG: 'VIDOUT', GND: 'GND' }, 'Video out (monitor)'),
    c('J3', 'J-RCA', 'SOUND', 110, 86, 0, { SIG: 'AUD', GND: 'GND' }, 'Sound out'),
    c('C2', 'C-100N', 'CLOCK', 64, 24, 0, { '1': '5V', '2': 'GND' }, 'Decoupling'),
    c('C3', 'C-100N', 'CLOCK', 94, 24, 0, { '1': '5V', '2': 'GND' }, 'Decoupling'),
    c('C4', 'C-100N', 'GRAPHICS', 80, 60, 0, { '1': '5V', '2': 'GND' }, 'Decoupling'),
    c('C5', 'C-100N', 'SOUND', 80, 90, 0, { '1': '5V', '2': 'GND' }, 'Decoupling'),
    c('TP3', 'TP', 'CLOCK', 40, 26, 0, { '1': 'CLK' }, 'Clock'),
    c('TP4', 'TP', 'GRAPHICS', 120, 62, 0, { '1': 'VID' }, 'Video'),
    c('TP5', 'TP', 'SOUND', 6, 94, 0, { '1': 'GND' }, 'Ground'),
  ],
  traces: [],
  testPoints: [
    { ref: 'TP1', net: 'IN_VIN', expected: '5 V from the cabinet supply' },
    { ref: 'TP2', net: '5V', expected: '5 V' },
    { ref: 'TP3', net: 'CLK', expected: 'clock (scope it)' },
    { ref: 'TP4', net: 'VID', expected: 'video' },
    { ref: 'TP5', net: 'GND', expected: '0 V' },
  ],
  rails: [{ net: '5V', nominal: 5, label: '5V' }],
  nets: {
    GND: { desc: 'Ground', expected: 0 },
    '5V': { desc: '5 V logic supply from the cabinet', expected: 5, power: true },
    CLK: { desc: 'Master clock from the oscillator' },
    HCNT: { desc: 'Horizontal count (U1 → U2, shifter)' },
    VCNT: { desc: 'Vertical count (U2 → EPROM, sound)' },
    GFX: { desc: 'Graphics data from the EPROM' },
    VID: { desc: 'Video from the shifter' },
    VIDOUT: { desc: 'Buffered video to the monitor' },
    AUD: { desc: 'Explosion sound out' },
  },
  input: { ref: 'J1', plus: '12V', minus: 'GND', adapter: { v: 5, ilim: 3, rint: 0.05, label: 'the cabinet power supply' }, psuV: 5, psuI: 2 },
  ground: 'TP5',
  controls: [],
  externals: [
    {
      id: 'monitor',
      label: '🖥 Cabinet monitor + speaker',
      attach(api) {
        api.add(resistor(api.mate('J2', 'SIG'), api.mate('J2', 'GND'), 1000, 'mon-vid'));
        api.add(resistor(api.mate('J3', 'SIG'), api.mate('J3', 'GND'), 1000, 'mon-aud'));
      },
    },
  ],
  ownerAttaches: ['monitor'],
  functional,
  complain,
  status(b, op) {
    if (!op) return [];
    const st = state(op);
    const on = b.attached.includes('monitor');
    return [
      { label: 'Monitor', value: st.picture ? 'game picture' : on ? 'black' : 'not connected', ok: st.picture },
      { label: 'Sound', value: st.sound ? 'explosions' : on ? 'silent' : 'not connected', ok: st.sound },
    ];
  },
  variants: VARIANTS,
  missable: ['C2', 'C3', 'C4', 'C5'],
  carbonise: [['5V', 'GND', 'C1']],
  marketValue: 320,
  quoteBase: 90,
  minReputation: 20,
});
