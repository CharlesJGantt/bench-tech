/**
 * Funstation 5 — console main board, HDMI section. 12 V from the internal PSU, 5 V buck,
 * 3.3 V LDO, the APU (which only sends video once the TV is detected on HPD), an HDMI
 * retimer, ESD diodes on the data lines, the HDMI port, and the HDMI +5 V line through a
 * polyfuse. A TV on the bench terminates the data lines and drives hot-plug detect.
 * Fictional product.
 */
import { c } from '../board';
import { device, place } from '../blocks/core';
import { hdmiOut } from '../blocks/hdmi';
import { buckRail, ldoRail, powerInput } from '../blocks/power';
import { customerSession, type BoardState, type DamageEvent, type FunctionalReport, type OperatingPoint } from '../circuit';
import { hpdSink, limitedSource, resistor } from '../elements';
import type { Rng } from '../faults';

const LINES = ['D0', 'D1', 'D2', 'CK'] as const;
export const FS5 = device({
  id: 'fs5',
  name: 'Funstation 5 (main board, HDMI section)',
  category: 'Consoles',
  tagline: 'Current-gen console — the dreaded "no picture" HDMI repairs.',
  width: 140,
  height: 86,
  blocks: [
    place('IN', powerInput({ connector: 'header', volts: 12, fuse: 'F-5A', bulk: 'C-470U-35', source: 'the internal PSU' }), [2, 2], { out: '12V' }, { conn: 'J1', fuse: 'F1', bulk: 'C1', tpIn: 'TP1', tpOut: 'TP2' }),
    place('5V', buckRail({ vout: 5, vin: 12 }), [32, 2], { vin: '12V', out: '5V' }, { reg: 'U1', boot: 'C5', enTop: 'R2', enBot: 'R3', ind: 'L1', fbTop: 'R4', fbBot: 'R5', cout: 'C3', tp: 'TP3' }),
    place('3V3', ldoRail({ vin: 5 }), [58, 2], { vin: '5V', out: '3V3' }, { reg: 'U2', cout: 'C4', tp: 'TP4' }),
    place(
      'HDMI',
      hdmiOut(),
      [40, 34],
      { vcc: '3V3', en: 'RT_EN_IO', video: 'VID_IO', fiveV: '5V_H', hpd: 'HPD_IN' },
      {
        enRes: 'R8', vidRes: 'R9', dec: 'C7', rt: 'U4', esd2: 'D3', esd1: 'D4', esd0: 'D5', esdCk: 'D6',
        poly: 'F2', diode: 'D7', port: 'J2', shifter: 'U5', hpdPull: 'R11', tp5v: 'TP6', tpHpd: 'TP7',
      },
      { outline: null },
    ),
  ],
  outlines: [
    { name: 'APU', x: 86, y: 2, w: 52, h: 40 },
    { name: 'RETIMER', x: 40, y: 44, w: 50, h: 40 },
    { name: 'HDMI PORT', x: 90, y: 44, w: 48, h: 40 },
  ],
  parts: [
    c('U3', 'U-APU-F5', 'APU', 106, 18, 0, {
      VDD: '3V3', HPD: 'HPD_IN', RTEN: 'RT_EN_IO', VID: 'VID_IO', LED: 'LED_IO', BTN: 'BTN',
      NC7: 'U3_NC7', NC8: 'U3_NC8', NC9: 'U3_NC9', NC10: 'U3_NC10', NC11: 'U3_NC11', NC12: 'U3_NC12', NC13: 'U3_NC13', NC14: 'U3_NC14', NC15: 'U3_NC15',
      GND: 'GND',
    }, 'APU (main processor)'),
    c('C6', 'C-100N', 'APU', 94, 10, 90, { '1': '3V3', '2': 'GND' }, 'APU decoupling'),
    c('R6', 'R-220R', 'APU', 100, 30, 90, { '1': 'LED_IO', '2': 'PWR_LED_A' }, 'Power LED resistor'),
    c('D1', 'LED-WHT', 'APU', 100, 37, 90, { A: 'PWR_LED_A', K: 'GND' }, 'Power light (white)'),
    c('R7', 'R-10K', 'APU', 107, 30, 270, { '1': '3V3', '2': 'BTN' }, 'Button pull-up'),
    c('SW1', 'SW-TACT', 'APU', 121, 32, 0, { '1': 'BTN', '2': 'GND' }, 'Power button'),
    c('TP5', 'TP', 'APU', 134, 40, 0, { '1': 'GND' }, 'Ground'),
  ],
  traces: [{ id: 'T1', a: '5V', b: '5V_H' }],
  testPoints: [
    { ref: 'TP5', net: 'GND', expected: '0 V' },
  ],
  nets: {
    GND: { desc: 'Ground', expected: 0 },
    '5V_H': { desc: '5 V feed towards the HDMI +5 V line', expected: 5 },
    '3V3': { desc: '3.3 V for the APU and retimer', expected: 3.3 },
    '5V': { desc: '5 V rail (also feeds the HDMI +5 V line)', expected: 5 },
    BTN: { desc: 'Power button — high normally, low while pressed', expected: 3.3 },
    LED_IO: { desc: 'APU power-light output' },
    PWR_LED_A: { desc: 'Power light anode' },
    RT_EN_IO: { desc: 'APU "retimer enable" output (high once the TV is detected)' },
    VID_IO: { desc: 'APU video output (high when sending video)' },
  },
  input: {
    ref: 'J1',
    plus: '12V',
    minus: 'GND',
    adapter: { v: 12.1, ilim: 8, rint: 0.02, label: "the console's internal 12 V supply" },
    psuV: 12,
    psuI: 2,
  },
  ground: 'TP5',
  controls: [{ ref: 'SW1', label: 'Power button' }],
  externals: [
    {
      id: 'tv',
      label: '📺 TV on the HDMI port',
      attach(api) {
        const gnd = api.mate('J2', 'GND');
        const vtt = api.node();
        // The TV terminates each data line to its own 3.3 V through 50 Ω.
        api.add(limitedSource(vtt, gnd, 3.3, 0.5, 0.01, 'tv-vtt'));
        for (const l of LINES) api.add(resistor(vtt, api.mate('J2', l), 50, `tv-${l}`));
        api.add(hpdSink(api.mate('J2', '5V'), api.mate('J2', 'HPD'), gnd, 'tv-hpd'));
      },
    },
  ],
  ownerAttaches: ['tv'],
  firmware: {
    ref: 'U3',
    vmin: 2.8,
    vmax: 4.2,
    inputs: ['BTN', 'HPD'],
    boot: () => ({ on: 0 }),
    step(state, inputs, prev) {
      if (!inputs.BTN && prev.BTN) state.on = state.on ? 0 : 1;
      const video = state.on === 1 && inputs.HPD;
      return { LED: state.on === 1, RTEN: video, VID: video };
    },
  },
  functional,
  complain,
  status(b, op) {
    if (!op) return [];
    return [
      { label: 'Power light (white)', value: op.current('D1') > 5e-4 ? 'on' : 'off', ok: op.current('D1') > 5e-4 },
      { label: 'TV', value: tvState(b, op), ok: tvState(b, op) === 'picture' },
      { label: 'HDMI +5 V', value: `${op.net('HDMI_P5V').toFixed(2)} V` },
    ];
  },
  missable: ['D1', 'C6', 'SW1'],
  marketValue: 320,
  quoteBase: 60,
  minReputation: 15,
});

/** What the TV shows: picture / no signal / not detected. */
function tvState(b: BoardState, op: OperatingPoint): string {
  if (!b.attached.includes('tv')) return 'not connected';
  const detected = op.net('HPD_IN') > 2;
  const lines = LINES.map((l) => op.current(`tv-${l}`));
  const ok = lines.every((i) => i > 0.004 && i < 0.02);
  if (ok && detected) return 'picture';
  return detected ? 'no signal' : 'no signal (console not detected)';
}

/** Hook up the TV, press power, check the picture, switch off. */
function functional(b: BoardState): FunctionalReport {
  b.attached = ['tv'];
  const s = customerSession(b);
  s.settle();
  const op1 = s.press('SW1');
  const on = op1.current('D1') > 5e-4;
  const picture = tvState(b, op1) === 'picture';
  const inputCurrent = op1.srcI;
  const op2 = s.press('SW1');
  const off = op2.current('D1') < 5e-4;
  s.end();
  const checks = [
    { label: 'Powers on with the button', ok: on },
    { label: 'Picture on the TV', ok: picture },
    { label: 'Turns off again', ok: off },
  ];
  return { checks, facts: { on, picture, off }, inputCurrent, events: s.events, passed: checks.every((x) => x.ok) && !s.events.length };
}

function complain(r: FunctionalReport, events: DamageEvent[], rng: Rng): string {
  const f = r.facts as Record<string, boolean>;
  const bang = events.length ? ' I heard a pop.' : '';
  if (!f.on) return rng.pick(['Completely dead — the light does not even come on.', 'Nothing happens when I press power.']) + bang;
  if (!f.picture) return rng.pick(['It turns on — white light, fans spin — but the TV just says "no signal".', 'Powers on fine but there is no picture on any TV I try.']) + bang;
  return 'It does something weird.' + bang;
}
