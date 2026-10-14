/**
 * Bintendo Entertainment System — 1980s 8-bit console. 9 V DC adapter → fuse → 7805 → 5 V;
 * CPU, picture chip, lockout chip, cartridge slot, RF modulator (aerial out) and AV out,
 * one controller port. Fictional product. Its cartridge board is BES_CART below.
 */
import { device, place } from '../blocks/core';
import { powerInput } from '../blocks/power';
import { c } from '../board';
import { customerSession, type BoardState, type DamageEvent, type FunctionalReport, type OperatingPoint } from '../circuit';
import { tarnish } from '../contacts';
import { resistor } from '../elements';
import { addMark, type Rng, type Variant } from '../faults';
import { cartridge, cx, testCart } from './retro';

const VARIANTS: Variant[] = [
  {
    id: 'slot-tarnish',
    family: 'Dirty contacts',
    tier: 1,
    weight: 1.6,
    apply(b, rng) {
      tarnish(b, 'J2', rng.range(0.5, 0.75), () => rng.next());
      for (const pin of ['D0', 'LKO']) b.comps.J2.oxide![pin] = 0.95;
      return {
        summary: 'The cartridge slot contacts are tarnished: no game reads and the lockout never gets its answer — blinking power light. Scrub the slot contacts and Pad-Bright them.',
        refs: ['J2'],
        hint: 'Every game blinks? Then it is not the games. Look at the slot contacts.',
        flavor: 'The red light just blinks on and off with every game I own.',
      };
    },
  },
  {
    id: 'slot-worn',
    family: 'Damaged connector',
    tier: 2,
    weight: 0.7,
    apply(b) {
      b.comps.J2.fault = { type: 'pins-open', pins: ['D0', 'LKO'] };
      addMark(b, 'J2', 'loose');
      return {
        summary: 'The cartridge slot springs are worn flat — cleaning will not bring them back. Replace the slot connector J2.',
        refs: ['J2'],
        hint: 'The slot contacts are clean, but do they still press against a cartridge? Check continuity from a known-good cart to the board.',
        flavor: 'I have to wedge the game down with a folded card to make it work, now even that does not.',
      };
    },
  },
  {
    id: 'reg-dead',
    family: 'Failed regulator',
    tier: 2,
    weight: 0.9,
    apply(b) {
      b.comps.U1.fault = { type: 'dead' };
      return {
        summary: 'The 7805 regulator U1 died: 9 V goes in, no 5 V comes out. Replace U1.',
        refs: ['U1'],
        hint: 'Is 9 V reaching the regulator input? Is there 5 V on its output?',
        flavor: 'Completely dead. No red light at all.',
      };
    },
  },
  {
    id: 'lockout-dead',
    family: 'Failed lockout chip',
    tier: 2,
    weight: 0.7,
    apply(b) {
      b.comps.U4.fault = { type: 'dead' };
      return {
        summary: 'The console lockout chip U4 is dead, holding the CPU in reset whatever cartridge is in. Replace U4 (or, as many owners do, lift its reset pin).',
        refs: ['U4'],
        hint: 'Clean slot, good cartridge, still blinking? Check the lockout chip: does it send its challenge (KO), and does RST ever go high?',
        flavor: 'It blinks with every game, even brand-new cleaned ones.',
      };
    },
  },
  {
    id: 'rfmod-dead',
    family: 'Failed RF modulator',
    tier: 2,
    weight: 0.7,
    apply(b) {
      b.comps.RF1.fault = { type: 'dead' };
      return {
        summary: 'The RF modulator RF1 is dead: the picture is fine on the AV out, but nothing on the aerial socket the owner uses. Replace RF1.',
        refs: ['RF1'],
        hint: 'Try the AV output instead of the aerial cable. Picture there? Then what makes the aerial signal?',
        flavor: 'Plugs into the TV aerial socket like always, but the channel is just snow.',
      };
    },
  },
  {
    id: 'pad-port',
    family: 'Damaged connector',
    tier: 1,
    weight: 0.8,
    apply(b) {
      b.comps.J5.fault = { type: 'pins-open', pins: ['DATA'] };
      addMark(b, 'J5', 'bent-pin');
      return {
        summary: 'The controller port J5 has a bent, cracked data pin. Replace the port.',
        refs: ['J5'],
        hint: 'Games start but the controller does nothing. Look into the controller port.',
        flavor: 'The game starts but the controller does nothing, and the controller works on my friend’s console.',
      };
    },
  },
  {
    id: 'reg-cap',
    family: 'Shorted capacitor',
    tier: 1,
    weight: 0.7,
    apply(b, rng) {
      b.comps.C3.fault = { type: 'short', r: rng.range(0.2, 0.8) };
      addMark(b, 'C3', 'bulged');
      return {
        summary: 'The 5 V output capacitor C3 has shorted (bulging), so the regulator is in current limit and very hot. Replace C3.',
        refs: ['C3'],
        hint: 'The regulator gets very hot and the 5 V rail is near zero. Measure 5 V to ground with the power off.',
        flavor: 'The red light is very dim and it smells hot.',
      };
    },
  },
];

export const BES = device({
  id: 'bes',
  name: 'Bintendo Entertainment System',
  category: 'Retro console',
  tagline: 'Grey 8-bit classic: blinking-light fame, cartridge slot, RF out.',
  width: 150,
  height: 100,
  blocks: [
    place('IN', powerInput({ connector: 'barrel', volts: 9, fuse: 'F-1A', bulk: 'C-470U-16', source: 'the 9 V adapter' }), [2, 2], { out: '9V' }, { conn: 'J1', fuse: 'F1', bulk: 'C1', tpIn: 'TP1', tpOut: 'TP2' }, { faults: true }),
  ],
  outlines: [
    { name: '5 V', x: 34, y: 2, w: 32, h: 30 },
    { name: 'CARTRIDGE SLOT', x: 74, y: 2, w: 54, h: 30 },
    { name: 'CPU / PICTURE', x: 2, y: 38, w: 128, h: 34 },
    { name: 'LOCKOUT / PORTS', x: 2, y: 74, w: 110, h: 24 },
  ],
  parts: [
    c('U1', 'U-7805T', '5V', 46, 10, 0, { IN: '9V', GND: 'GND', OUT: '5V' }, '5 V regulator (7805)'),
    c('C2', 'C-100N', '5V', 40, 22, 0, { '1': '9V', '2': 'GND' }, 'Regulator input decoupling'),
    c('C3', 'C-10U-16E', '5V', 58, 22, 0, { '+': '5V', '-': 'GND' }, '5 V output capacitor'),
    c('TP3', 'TP', '5V', 62, 8, 0, { '1': '5V' }, '5 V rail'),
    c('J2', 'J-SLOT6', 'SLOT', 100, 14, 0, { '5V': '5V', GND: 'GND', CE: 'CE', D0: 'DIN', LKI: 'KEY_OUT', LKO: 'KEY_IN' }, 'Cartridge slot'),
    c('R3', 'R-10K', 'SLOT', 82, 28, 0, { '1': 'DIN', '2': 'GND' }, 'Data pull-down'),
    c('R4', 'R-10K', 'SLOT', 118, 28, 0, { '1': 'KEY_IN', '2': 'GND' }, 'Lockout answer pull-down'),
    cx('U2', 'U-BES-CPU', 'CPU', 38, 55, 0, { VDD: '5V', GND: 'GND', RST: 'RST', CE: 'CE', DIN: 'DIN', LED: 'LED_IO', VEN: 'VEN' }, 'CPU'),
    cx('U3', 'U-BES-PPU', 'CPU', 98, 55, 0, { VCC: '5V', GND: 'GND', VEN: 'VEN', VID: 'VID' }, 'Picture chip'),
    cx('RF1', 'U-RFMOD', 'CPU', 136, 50, 0, { '5V': '5V', GND: 'GND', VID: 'VID', RF: 'RF' }, 'RF modulator'),
    c('J3', 'J-RCA', 'CPU', 140, 82, 0, { SIG: 'VID', GND: 'GND' }, 'AV out (composite video)'),
    c('J4', 'J-RCA', 'CPU', 124, 82, 0, { SIG: 'RF', GND: 'GND' }, 'RF out (aerial)'),
    cx('U4', 'U-LOCK-C', 'LOCK', 30, 86, 0, { VCC: '5V', GND: 'GND', KI: 'KEY_IN', KO: 'KEY_OUT', RST: 'RST' }, 'Lockout chip'),
    c('R5', 'R-10K', 'LOCK', 50, 80, 0, { '1': 'RST', '2': 'GND' }, 'CPU reset pull-down'),
    c('J5', 'J-HDR3', 'LOCK', 80, 90, 0, { '5V': '5V', DATA: 'PAD', GND: 'GND' }, 'Controller port'),
    c('R6', 'R-10K', 'LOCK', 80, 80, 0, { '1': '5V', '2': 'PAD' }, 'Controller data pull-up'),
    c('R1', 'R-220R', 'LOCK', 96, 80, 0, { '1': 'LED_IO', '2': 'LED_A' }, 'Power LED resistor'),
    c('D1', 'LED-RED', 'LOCK', 104, 88, 0, { A: 'LED_A', K: 'GND' }, 'Power light (red)'),
    c('TP4', 'TP', 'LOCK', 6, 94, 0, { '1': 'GND' }, 'Ground'),
    c('TP5', 'TP', 'CPU', 120, 70, 0, { '1': 'VID' }, 'Composite video'),
  ],
  traces: [],
  testPoints: [
    { ref: 'TP1', net: 'IN_VIN', expected: '9 V from the adapter' },
    { ref: 'TP2', net: '9V', expected: '≈9 V after the fuse' },
    { ref: 'TP3', net: '5V', expected: '5 V' },
    { ref: 'TP4', net: 'GND', expected: '0 V' },
    { ref: 'TP5', net: 'VID', expected: 'high with a game running' },
  ],
  rails: [
    { net: '9V', nominal: 9, label: '9V' },
    { net: '5V', nominal: 5, label: '5V' },
  ],
  nets: {
    GND: { desc: 'Ground', expected: 0 },
    '5V': { desc: '5 V logic supply from the 7805', expected: 5, power: true },
    CE: { desc: 'Cartridge ROM enable (CPU → cartridge)' },
    DIN: { desc: 'Game data from the cartridge into the CPU' },
    KEY_OUT: { desc: 'Lockout challenge (console → cartridge)' },
    KEY_IN: { desc: 'Lockout answer (cartridge → console)' },
    RST: { desc: 'CPU reset: held low by the lockout chip until the cartridge answers' },
    VEN: { desc: 'CPU tells the picture chip to draw' },
    VID: { desc: 'Composite video out (picture chip → AV jack and RF modulator)' },
    RF: { desc: 'RF (aerial) signal out of the modulator' },
    LED_IO: { desc: 'Power light drive from the CPU' },
    LED_A: { desc: 'Power LED anode' },
    PAD: { desc: 'Controller data line' },
  },
  input: { ref: 'J1', plus: 'TIP', minus: 'SLEEVE', adapter: { v: 9, ilim: 1, rint: 0.5, label: "the owner's 9 V adapter" }, psuV: 9, psuI: 1 },
  ground: 'TP4',
  controls: [],
  firmware: {
    ref: 'U2',
    vmin: 4.5,
    vmax: 5.6,
    reset: 'RST',
    inputs: ['DIN'],
    boot: () => ({}),
    step(_s, inputs) {
      return { CE: true, LED: true, VEN: inputs.DIN };
    },
  },
  externals: [
    testCart('J2'),
    {
      id: 'tv',
      label: '📺 TV (aerial + AV)',
      attach(api) {
        api.add(resistor(api.mate('J4', 'SIG'), api.mate('J4', 'GND'), 1000, 'tv-rf'));
        api.add(resistor(api.mate('J3', 'SIG'), api.mate('J3', 'GND'), 1000, 'tv-av'));
      },
    },
    {
      id: 'pad',
      label: '🎮 Controller',
      attach(api) {
        api.add(resistor(api.mate('J5', 'DATA'), api.mate('J5', 'GND'), 47e3, 'pad'));
      },
    },
  ],
  ownerAttaches: ['cart', 'tv', 'pad'],
  functional,
  complain,
  status(b, op) {
    if (!op) return [];
    const st = besState(b, op);
    return [
      { label: 'Power light', value: st.light, ok: st.light === 'on' },
      { label: 'TV (aerial)', value: st.rf ? 'game picture' : b.attached.includes('tv') ? 'snow' : 'not connected', ok: st.rf },
      { label: 'TV (AV)', value: st.av ? 'game picture' : b.attached.includes('tv') ? 'no signal' : 'not connected', ok: st.av },
      { label: 'Controller', value: st.pad ? 'responds' : b.attached.includes('pad') ? 'dead' : 'not plugged in', ok: st.pad },
    ];
  },
  variants: VARIANTS,
  missable: ['C2', 'R6', 'TP5'],
  carbonise: [
    ['5V', 'GND', 'C3'],
    ['9V', 'GND', 'C1'],
  ],
  marketValue: 90,
  quoteBase: 35,
  minReputation: 0,
});

function besState(b: BoardState, op: OperatingPoint) {
  const fivev = op.net('5V') > 4.5;
  const running = b.mcu.running;
  return {
    light: running ? 'on' : fivev ? 'blinking' : 'off',
    rf: op.current('tv-rf') > 2e-3,
    av: op.current('tv-av') > 2e-3,
    pad: op.current('pad') > 5e-5 && running,
  };
}

function functional(b: BoardState): FunctionalReport {
  b.attached = ['cart', 'tv', 'pad'];
  const s = customerSession(b, { kind: 'adapter' });
  s.settle(); // the CPU comes out of reset…
  const op = s.settle(); // …then drives the cartridge and the picture
  const st = besState(b, op);
  s.end();
  const checks = [
    { label: 'Power light comes on steady (not blinking)', ok: st.light === 'on' },
    { label: 'Game picture on the TV (aerial)', ok: st.rf },
    { label: 'Controller works', ok: st.pad },
  ];
  return { checks, facts: { ...st, light: st.light === 'on', blinking: st.light === 'blinking' }, inputCurrent: op.srcI, events: s.events, passed: checks.every((x) => x.ok) && !s.events.length };
}

function complain(r: FunctionalReport, events: DamageEvent[], rng: Rng): string {
  const f = r.facts as Record<string, boolean>;
  const pop = events.length ? ' Something popped.' : '';
  if (f.blinking) return rng.pick(['The red light just blinks on and off.', 'Blinking light, grey screen, every game.']) + pop;
  if (!f.light) return 'Completely dead — no light.' + pop;
  if (!f.rf) return 'The light is on but the TV channel is just snow.' + pop;
  if (!f.pad) return 'Games start but the controller does nothing.' + pop;
  return 'It acts up.' + pop;
}

/** The BES cartridge: one board, many games. */
export const BES_CART = cartridge({
  id: 'bes-cart',
  name: 'BES Game Pak',
  console: 'bes',
  consoleName: 'Bintendo Entertainment System',
  romPart: 'U-ROM-BES',
  lockout: true,
  save: true,
  quoteBase: 18,
  titles: [
    { name: 'Pipe Brothers', value: 22 },
    { name: 'Duck Blaster', value: 12 },
    { name: 'Mega Bolt Man', value: 38 },
    { name: 'Castle Climber', value: 28 },
  ],
});
