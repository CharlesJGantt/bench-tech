/**
 * HDMI output block: retimer (with enable and video series resistors), ESD diodes on the
 * four lanes, the +5 V feed (polyfuse + back-feed diode), the port, and the hot-plug
 * detect path back through a 5 V → 3.3 V level shifter. Brings the classic console
 * "no picture" faults.
 */
import { addMark } from '../faults';
import type { BlockDef } from './core';

const LANES = ['D0', 'D1', 'D2', 'CK'] as const;
type Lane = (typeof LANES)[number];
const ESD_KEY: Record<Lane, string> = { D2: 'esd2', D1: 'esd1', D0: 'esd0', CK: 'esdCk' };

/**
 * Ports: `vcc` (3.3 V), `en` (processor's retimer-enable output), `video` (processor's video
 * output), `fiveV` (5 V feed for the HDMI +5 V line), `hpd` (hot-plug detect into the processor).
 */
export function hdmiOut(): BlockDef {
  return {
    title: 'HDMI',
    size: [98, 50],
    ports: ['vcc', 'en', 'video', 'fiveV', 'hpd'],
    parts: [
      { key: 'enRes', partNo: 'R-100R', at: [10, 25], pins: { '1': 'en', '2': 'EN' }, role: 'Retimer enable resistor' },
      { key: 'vidRes', partNo: 'R-100R', at: [10, 36], pins: { '1': 'video', '2': 'VID' }, role: 'Video link resistor' },
      { key: 'dec', partNo: 'C-100N', at: [16, 20], rot: 90, pins: { '1': 'vcc', '2': 'GND' }, role: 'Retimer decoupling' },
      { key: 'rt', partNo: 'U-LX9201', at: [22, 30], pins: { VCC: 'vcc', EN: 'EN', IN: 'VID', D2: 'D2', D1: 'D1', D0: 'D0', CK: 'CK', GND: 'GND' }, role: 'HDMI retimer' },
      { key: 'esd2', partNo: 'D-ESD5', at: [40, 24], pins: { A: 'GND', K: 'D2' }, role: 'ESD diode (D2 line)' },
      { key: 'esd1', partNo: 'D-ESD5', at: [40, 30], pins: { A: 'GND', K: 'D1' }, role: 'ESD diode (D1 line)' },
      { key: 'esd0', partNo: 'D-ESD5', at: [40, 36], pins: { A: 'GND', K: 'D0' }, role: 'ESD diode (D0 line)' },
      { key: 'esdCk', partNo: 'D-ESD5', at: [40, 42], pins: { A: 'GND', K: 'CK' }, role: 'ESD diode (CK line)' },
      { key: 'poly', partNo: 'F-POLY05', at: [42, 2], pins: { '1': 'fiveV', '2': 'F5V' }, role: 'HDMI +5 V polyfuse' },
      { key: 'diode', partNo: 'D-SS14', at: [58, 16], pins: { A: 'F5V', K: 'P5V' }, role: 'HDMI +5 V back-feed diode' },
      { key: 'port', partNo: 'J-HDMI', at: [76, 34], rot: 90, pins: { D2: 'D2', D1: 'D1', D0: 'D0', CK: 'CK', '5V': 'P5V', HPD: 'HPD', GND: 'GND', SHLD: 'GND' }, role: 'HDMI port' },
      { key: 'shifter', partNo: 'U-LS1T', at: [60, 45], pins: { VA: 'P5V', GND: 'GND', A: 'HPD', B: 'hpd', VB: 'vcc', EN: 'vcc' }, role: 'Hot-plug level shifter (5 V → 3.3 V)' },
      { key: 'hpdPull', partNo: 'R-100K', at: [50, 49], pins: { '1': 'hpd', '2': 'GND' }, role: 'Hot-plug detect pull-down' },
      { key: 'tp5v', partNo: 'TP', at: [90, 18], pins: { '1': 'P5V' }, role: 'HDMI +5 V' },
      { key: 'tpHpd', partNo: 'TP', at: [34, 48], pins: { '1': 'hpd' }, role: 'Hot-plug detect' },
    ],
    nets: {
      EN: { desc: 'Retimer enable pin' },
      VID: { desc: 'Video into the retimer' },
      D0: { desc: 'HDMI data line 0 (≈2.8 V with a TV connected and video running; ~0.5 V diode reading to ground)' },
      D1: { desc: 'HDMI data line 1 (same as D0)' },
      D2: { desc: 'HDMI data line 2 (same as D0)' },
      CK: { desc: 'HDMI clock line (same as D0)' },
      F5V: { desc: 'HDMI +5 V after the polyfuse', expected: 5 },
      P5V: { desc: 'HDMI +5 V to the TV (after the diode)', expected: 4.6 },
      HPD: { desc: 'Hot-plug detect from the TV (5 V when the TV sees the console)' },
      hpd: { desc: 'Hot-plug detect into the processor, from the level shifter — 3.3 V = TV detected' },
    },
    testPoints: [
      { key: 'tp5v', expected: '≈4.6 V (to the TV)' },
      { key: 'tpHpd', expected: '≈3.3 V once the TV is detected' },
    ],
    missable: ['esd2', 'esd1', 'esd0', 'esdCk', 'dec', 'hpdPull'],
    variants: [
      {
        id: 'hdmi-bent-pin',
        family: 'Damaged connector',
        tier: 1,
        weight: 1.2,
        apply(b, rng, ref) {
          const pin = rng.pick(LANES);
          const r = ref('port');
          b.comps[r].fault = { type: 'pins-open', pins: [pin] };
          addMark(b, r, 'bent-pin');
          return {
            summary: `The HDMI port's ${pin} contact is bent flat, so one data line never reaches the TV. Replace the port (it has a plastic body — low-melt alloy and gentle hot air).`,
            refs: [r],
            hint: 'Look inside the HDMI port. Then, power off, compare the data pins in diode mode — they should all read about the same.',
            flavor: 'Someone tripped over the HDMI cable. It powers on but there is no picture any more.',
          };
        },
      },
      {
        id: 'hdmi-port-joint',
        family: 'Cracked solder joint',
        tier: 2,
        weight: 0.8,
        apply(b, rng, ref) {
          const pin = rng.pick(LANES);
          const r = ref('port');
          b.comps[r].joints[pin] = { r: Infinity, cracked: true };
          return {
            summary: `The HDMI port's ${pin} pin has a cracked solder joint (cable strain). Reflow it — keep the heat low, the port is plastic.`,
            refs: [r],
            hint: 'Compare each HDMI pin leg with its pad. Zoom right in on the joints.',
            flavor: 'The picture used to flicker if I touched the cable. Now there is no picture.',
          };
        },
      },
      {
        id: 'hdmi-5v-fuse',
        family: 'Blown fuse',
        tier: 2,
        weight: 0.8,
        apply(b, _rng, ref) {
          const r = ref('poly');
          b.comps[r].fault = { type: 'open' };
          return {
            summary: `The HDMI +5 V polyfuse ${r} failed open, so the TV never sees +5 V and never signals hot-plug — no video is ever sent.`,
            refs: [r],
            hint: 'A TV only "answers" (hot-plug detect) if it sees +5 V on its HDMI pin. Is there 5 V on the port?',
          };
        },
      },
      {
        id: 'esd-short',
        family: 'Failed diode',
        tier: 2,
        weight: 0.9,
        apply(b, rng, ref) {
          const line = rng.pick(LANES);
          const r = ref(ESD_KEY[line]);
          b.comps[r].fault = { type: 'short', r: rng.range(0.5, 2) };
          return {
            summary: `ESD protection diode ${r} on the ${line} line failed short after a static zap, pulling that line to ground.`,
            refs: [r],
            hint: 'Power off, diode mode, red on ground: one HDMI data line reads near zero while the others read ~0.5 V. Which part on that line is shorted?',
          };
        },
      },
      {
        id: 'retimer-short',
        family: 'Failed HDMI retimer',
        tier: 2,
        weight: 0.8,
        apply(b, _rng, ref) {
          const r = ref('rt');
          b.comps[r].fault = { type: 'short', r: 1.5 };
          addMark(b, r, 'discolored');
          return {
            summary: `The HDMI retimer ${r} failed with all its outputs shorted to ground. Replace it (expensive — you may need to order one or pull one from a donor board).`,
            refs: [r],
            hint: 'Every HDMI data line reads near zero in diode mode. The one part all four lines go through is the retimer.',
          };
        },
      },
      {
        id: 'retimer-dead',
        family: 'Failed HDMI retimer',
        tier: 3,
        weight: 0.6,
        apply(b, _rng, ref) {
          const r = ref('rt');
          b.comps[r].fault = { type: 'dead' };
          return {
            summary: `The HDMI retimer ${r} is dead: it has power, enable and video in, but drives nothing out. Replace it.`,
            refs: [r],
            hint: `With the TV connected and the console on: is ${r} powered and enabled, and does it get video in? Then it is the chip — a scope on its outputs shows nothing.`,
          };
        },
      },
      {
        id: 'prev-port-bridge',
        family: 'Bad previous repair',
        tier: 2,
        weight: 0.7,
        apply(b, _rng, ref) {
          const r = ref('port');
          addMark(b, r, 'rework-residue');
          addMark(b, r, 'crooked');
          b.jumpers.push({ id: b.nextJumperId++, a: { ref: r, pin: 'CK' }, b: { ref: r, pin: '5V' }, cold: false, bridge: true });
          return {
            summary: 'Another shop replaced the HDMI port and left a solder bridge between the CK and +5 V pins. Wick the bridge away (or redo the port).',
            refs: [r],
            hint: 'Someone has been here before — inspect the HDMI pins under magnification, and check neighbouring pins for continuity.',
            flavor: 'A shop replaced the HDMI port last month. Still no picture.',
            previousRepair: true,
          };
        },
      },
      {
        id: 'hpd-shifter-dead',
        family: 'Failed level shifter',
        tier: 2,
        weight: 0.8,
        apply(b, _rng, ref) {
          const r = ref('shifter');
          b.comps[r].fault = { type: 'dead' };
          return {
            summary: `Level shifter ${r} died: the TV's hot-plug signal reaches its input but never comes out the other side, so the console never sees the TV and sends no picture. Replace ${r}.`,
            refs: [r],
            hint: `Check the level shifter ${r} with the meter, powered with a TV connected: its input (A) should be high, and if both supplies are there its output (B) should be high too.`,
            flavor: 'Powers on fine but my TV just says no signal.',
          };
        },
      },
    ],
  };
}
