/**
 * Funstation 5 — console main board, HDMI section. 12 V from the internal PSU, 5 V buck,
 * 3.3 V LDO, the APU (which only sends video once the TV is detected on HPD), an HDMI
 * retimer, ESD diodes on the data lines, the HDMI port, and the HDMI +5 V line through a
 * polyfuse. A TV on the bench terminates the data lines and drives hot-plug detect.
 * Fictional product.
 */
import { c, type DeviceDef } from '../board';
import { customerSession, type BoardState, type DamageEvent, type FunctionalReport, type OperatingPoint } from '../circuit';
import { hpdSink, limitedSource, resistor } from '../elements';
import { addMark, type Rng, type Variant } from '../faults';

const LINES = ['D0', 'D1', 'D2', 'CK'] as const;
const ESD: Record<(typeof LINES)[number], string> = { D2: 'D3', D1: 'D4', D0: 'D5', CK: 'D6' };

const VARIANTS: Variant[] = [
  {
    id: 'hdmi-bent-pin',
    family: 'Damaged connector',
    tier: 1,
    weight: 1.2,
    apply(b, rng) {
      const pin = rng.pick(LINES);
      b.comps.J2.fault = { type: 'pins-open', pins: [pin] };
      addMark(b, 'J2', 'bent-pin');
      return {
        summary: `The HDMI port's ${pin} contact is bent flat, so one data line never reaches the TV. Replace the port (it has a plastic body — low-melt alloy and gentle hot air).`,
        refs: ['J2'],
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
    apply(b, rng) {
      const pin = rng.pick(LINES);
      b.comps.J2.joints[pin] = { r: Infinity, cracked: true };
      return {
        summary: `The HDMI port's ${pin} pin has a cracked solder joint (cable strain). Reflow it — keep the heat low, the port is plastic.`,
        refs: ['J2'],
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
    apply(b) {
      b.comps.F2.fault = { type: 'open' };
      return {
        summary: 'The HDMI +5 V polyfuse F2 failed open, so the TV never sees +5 V and never signals hot-plug — the APU never sends video.',
        refs: ['F2'],
        hint: 'A TV only "answers" (hot-plug detect) if it sees +5 V on its HDMI pin. Is there 5 V on the port?',
      };
    },
  },
  {
    id: 'esd-short',
    family: 'Failed diode',
    tier: 2,
    weight: 0.9,
    apply(b, rng) {
      const line = rng.pick(LINES);
      const ref = ESD[line];
      b.comps[ref].fault = { type: 'short', r: rng.range(0.5, 2) };
      return {
        summary: `ESD protection diode ${ref} on the ${line} line failed short after a static zap, pulling that line to ground.`,
        refs: [ref],
        hint: 'Power off, diode mode, red on ground: one HDMI data line reads near zero while the others read ~0.5 V. Which part on that line is shorted?',
      };
    },
  },
  {
    id: 'retimer-short',
    family: 'Failed HDMI retimer',
    tier: 2,
    weight: 0.8,
    apply(b) {
      b.comps.U4.fault = { type: 'short', r: 1.5 };
      addMark(b, 'U4', 'discolored');
      return {
        summary: 'The HDMI retimer U4 failed with all its outputs shorted to ground. Replace it (expensive — you may need to order one or pull one from a donor board).',
        refs: ['U4'],
        hint: 'Every HDMI data line reads near zero in diode mode. The one part all four lines go through is the retimer.',
      };
    },
  },
  {
    id: 'retimer-dead',
    family: 'Failed HDMI retimer',
    tier: 3,
    weight: 0.6,
    apply(b) {
      b.comps.U4.fault = { type: 'dead' };
      return {
        summary: 'The HDMI retimer U4 is dead: it has power, enable and video in, but drives nothing out. Replace it.',
        refs: ['U4'],
        hint: 'With the TV connected and the console on: is U4 powered and enabled, and does it get video from the APU? Then it is the chip.',
      };
    },
  },
  {
    id: 'buck-dead',
    family: 'Failed regulator',
    tier: 2,
    weight: 0.7,
    apply(b) {
      b.comps.U1.fault = { type: 'dead' };
      return { summary: '5 V regulator U1 died: 12 V in, nothing out — the console cannot start.', refs: ['U1'], hint: '12 V is there but nothing else. What makes the 5 V?' };
    },
  },
  {
    id: 'psu-conn-joint',
    family: 'Cracked solder joint',
    tier: 1,
    weight: 0.8,
    apply(b) {
      b.comps.J1.joints['12V'] = { r: Infinity, cracked: true };
      return {
        summary: 'The 12 V pin of the internal power connector J1 has a cracked joint. Reflow it.',
        refs: ['J1'],
        hint: 'Totally dead. Does the 12 V get from the connector pin onto the board? Flip it over and look at the joints.',
        flavor: 'It just would not turn on one day.',
      };
    },
  },
  {
    id: 'prev-port-bridge',
    family: 'Bad previous repair',
    tier: 2,
    weight: 0.7,
    apply(b) {
      addMark(b, 'J2', 'rework-residue');
      addMark(b, 'J2', 'crooked');
      b.jumpers.push({ id: b.nextJumperId++, a: { ref: 'J2', pin: 'CK' }, b: { ref: 'J2', pin: '5V' }, cold: false, bridge: true });
      return {
        summary: 'Another shop replaced the HDMI port and left a solder bridge between the CK and +5 V pins. Wick the bridge away (or redo the port).',
        refs: ['J2'],
        hint: 'Someone has been here before — inspect the HDMI pins under magnification, and check neighbouring pins for continuity.',
        flavor: 'A shop replaced the HDMI port last month. Still no picture.',
        previousRepair: true,
      };
    },
  },
  {
    id: 'esr-5v',
    family: 'Dried-out capacitor',
    tier: 2,
    weight: 0.8,
    apply(b, rng) {
      const ref = 'C3';
      b.comps[ref].fault = { type: 'esr', esr: rng.range(4, 12) };
      return {
        summary: `${ref} on the 5 V rail dried out: its capacitance and resistance still look normal, but its ESR is very high, so the regulator went unstable and the 5 V rail sags. Replace ${ref}.`,
        refs: [ref],
        hint: 'The 5 V rail is low but nothing is shorted and the regulator is not hot. An ESR meter on the 5 V capacitors (or a scope on the rail — look for ripple) finds the culprit.',
        flavor: 'It started crashing, now it will not turn on at all.',
      };
    },
  },
  {
    id: 'hpd-shifter-dead',
    family: 'Failed level shifter',
    tier: 2,
    weight: 0.8,
    apply(b) {
      b.comps.U5.fault = { type: 'dead' };
      return {
        summary: 'Level shifter U5 died: the TV\'s hot-plug signal reaches its input but never comes out the other side, so the console never sees the TV and sends no picture. Replace U5.',
        refs: ['U5'],
        hint: 'Check the level shifter U5 with the meter, powered with a TV connected: its input (A) should be high, and if both supplies are there its output (B) should be high too.',
        flavor: 'Powers on fine but my TV just says no signal.',
      };
    },
  },
];

export const FS5: DeviceDef = {
  id: 'fs5',
  name: 'Funstation 5 (main board, HDMI section)',
  category: 'Consoles',
  tagline: 'Current-gen console — the dreaded "no picture" HDMI repairs.',
  width: 140,
  height: 86,
  blocks: [
    { name: '12V IN / 5V BUCK', x: 2, y: 2, w: 56, h: 32 },
    { name: '3V3', x: 58, y: 2, w: 18, h: 32 },
    { name: 'APU', x: 86, y: 2, w: 52, h: 40 },
    { name: 'RETIMER', x: 40, y: 44, w: 50, h: 40 },
    { name: 'HDMI PORT', x: 90, y: 44, w: 48, h: 40 },
  ],
  components: [
    c('J1', 'J-PWR2', 'INPUT', 9, 7, 0, { '12V': 'VIN_J', GND: 'GND' }, '12 V from the internal PSU'),
    c('F1', 'F-5A', 'INPUT', 21, 7, 0, { '1': 'VIN_J', '2': '12V' }, 'Main fuse'),
    c('C1', 'C-470U-35', 'INPUT', 26, 22, 0, { '+': '12V', '-': 'GND' }, '12 V bulk capacitor'),
    c('TP1', 'TP', 'INPUT', 5, 22, 0, { '1': 'VIN_J' }, 'Raw input'),
    c('TP2', 'TP', 'INPUT', 13, 29, 0, { '1': '12V' }, '12 V rail'),
    c('U1', 'U-VX2302', 'BUCK', 41, 10, 0, { BST: 'BST', GND: 'GND', FB: 'FB', EN: 'EN_B', IN: '12V', SW: 'SW' }, '5 V buck converter'),
    c('C5', 'C-100N', 'BUCK', 41, 4, 0, { '1': 'BST', '2': 'SW' }, 'Bootstrap capacitor'),
    c('R2', 'R-100K', 'BUCK', 35, 15, 90, { '1': '12V', '2': 'EN_B' }, 'Enable divider (top)'),
    c('R3', 'R-47K', 'BUCK', 35, 22, 90, { '1': 'EN_B', '2': 'GND' }, 'Enable divider (bottom)'),
    c('L1', 'L-10U', 'BUCK', 49, 10, 0, { '1': 'SW', '2': '5V' }, 'Buck inductor'),
    c('R4', 'R-52K3', 'BUCK', 42, 19, 90, { '1': '5V', '2': 'FB' }, 'Feedback divider (top)'),
    c('R5', 'R-10K', 'BUCK', 42, 26, 90, { '1': 'FB', '2': 'GND' }, 'Feedback divider (bottom)'),
    c('C3', 'C-22U-10', 'BUCK', 55, 19, 90, { '1': '5V', '2': 'GND' }, '5 V capacitor'),
    c('TP3', 'TP', 'BUCK', 49, 29, 0, { '1': '5V' }, '5 V rail'),
    c('U2', 'U-HL33', '3V3', 66, 9, 0, { GND: 'GND', OUT: '3V3', IN: '5V', TAB: '3V3' }, '3.3 V regulator'),
    c('C4', 'C-10U-6', '3V3', 71, 20, 90, { '1': '3V3', '2': 'GND' }, '3.3 V capacitor'),
    c('TP4', 'TP', '3V3', 64, 29, 0, { '1': '3V3' }, '3.3 V rail'),
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
    c('R8', 'R-100R', 'RETIMER', 50, 59, 0, { '1': 'RT_EN_IO', '2': 'RT_EN' }, 'Retimer enable resistor'),
    c('R9', 'R-100R', 'RETIMER', 50, 70, 0, { '1': 'VID_IO', '2': 'VID' }, 'Video link resistor'),
    c('C7', 'C-100N', 'RETIMER', 56, 54, 90, { '1': '3V3', '2': 'GND' }, 'Retimer decoupling'),
    c('U4', 'U-LX9201', 'RETIMER', 62, 64, 0, { VCC: '3V3', EN: 'RT_EN', IN: 'VID', D2: 'HD_D2', D1: 'HD_D1', D0: 'HD_D0', CK: 'HD_CK', GND: 'GND' }, 'HDMI retimer'),
    c('D3', 'D-ESD5', 'RETIMER', 80, 58, 0, { A: 'GND', K: 'HD_D2' }, 'ESD diode (D2 line)'),
    c('D4', 'D-ESD5', 'RETIMER', 80, 64, 0, { A: 'GND', K: 'HD_D1' }, 'ESD diode (D1 line)'),
    c('D5', 'D-ESD5', 'RETIMER', 80, 70, 0, { A: 'GND', K: 'HD_D0' }, 'ESD diode (D0 line)'),
    c('D6', 'D-ESD5', 'RETIMER', 80, 76, 0, { A: 'GND', K: 'HD_CK' }, 'ESD diode (CK line)'),
    c('F2', 'F-POLY05', 'HDMI', 82, 36, 0, { '1': '5V_H', '2': 'H5V_F' }, 'HDMI +5 V polyfuse'),
    c('D7', 'D-SS14', 'HDMI', 98, 50, 0, { A: 'H5V_F', K: 'HDMI_5V' }, 'HDMI +5 V back-feed diode'),
    c('J2', 'J-HDMI', 'HDMI', 116, 68, 90, { D2: 'HD_D2', D1: 'HD_D1', D0: 'HD_D0', CK: 'HD_CK', '5V': 'HDMI_5V', HPD: 'HPD_PORT', GND: 'GND', SHLD: 'GND' }, 'HDMI port'),
    c('U5', 'U-LS1T', 'HDMI', 100, 79, 0, { VA: 'HDMI_5V', GND: 'GND', A: 'HPD_PORT', B: 'HPD_IN', VB: '3V3', EN: '3V3' }, 'Hot-plug level shifter (5 V → 3.3 V)'),
    c('R11', 'R-100K', 'HDMI', 90, 83, 0, { '1': 'HPD_IN', '2': 'GND' }, 'Hot-plug detect pull-down'),
    c('TP6', 'TP', 'HDMI', 130, 52, 0, { '1': 'HDMI_5V' }, 'HDMI +5 V'),
    c('TP7', 'TP', 'HDMI', 74, 82, 0, { '1': 'HPD_IN' }, 'Hot-plug detect'),
  ],
  traces: [{ id: 'T1', a: '5V', b: '5V_H' }],
  testPoints: [
    { ref: 'TP1', net: 'VIN_J', expected: '12 V' },
    { ref: 'TP2', net: '12V', expected: '≈12 V' },
    { ref: 'TP3', net: '5V', expected: '5.0 V' },
    { ref: 'TP4', net: '3V3', expected: '3.3 V' },
    { ref: 'TP6', net: 'HDMI_5V', expected: '≈4.6 V (to the TV)' },
    { ref: 'TP7', net: 'HPD_IN', expected: '≈3.3 V once the TV is detected' },
    { ref: 'TP5', net: 'GND', expected: '0 V' },
  ],
  rails: [
    { net: '12V', nominal: 12, label: '12V' },
    { net: '5V', nominal: 5, label: '5V' },
    { net: '3V3', nominal: 3.3, label: '3V3' },
  ],
  nets: {
    GND: { desc: 'Ground', expected: 0 },
    VIN_J: { desc: 'Raw 12 V from the internal PSU', expected: 12 },
    '12V': { desc: '12 V main rail', expected: 12 },
    EN_B: { desc: 'Enable of the 5 V regulator U1', expected: 3.8 },
    FB: { desc: 'U1 feedback — regulated to 0.8 V', expected: 0.8 },
    SW: { desc: '5 V buck switch node', expected: 5 },
    BST: { desc: 'U1 bootstrap pin' },
    '5V': { desc: '5 V rail', expected: 5 },
    '5V_H': { desc: '5 V feed towards the HDMI +5 V line', expected: 5 },
    '3V3': { desc: '3.3 V for the APU and retimer', expected: 3.3 },
    BTN: { desc: 'Power button — high normally, low while pressed', expected: 3.3 },
    LED_IO: { desc: 'APU power-light output' },
    PWR_LED_A: { desc: 'Power light anode' },
    RT_EN_IO: { desc: 'APU "retimer enable" output (high once the TV is detected)' },
    RT_EN: { desc: 'Retimer enable pin' },
    VID_IO: { desc: 'APU video output (high when sending video)' },
    VID: { desc: 'Video into the retimer' },
    HD_D0: { desc: 'HDMI data line 0 (≈2.8 V with a TV connected and video running; ~0.5 V diode reading to ground)' },
    HD_D1: { desc: 'HDMI data line 1 (same as D0)' },
    HD_D2: { desc: 'HDMI data line 2 (same as D0)' },
    HD_CK: { desc: 'HDMI clock line (same as D0)' },
    H5V_F: { desc: 'HDMI +5 V after the polyfuse', expected: 5 },
    HDMI_5V: { desc: 'HDMI +5 V to the TV (after the diode)', expected: 4.6 },
    HPD_PORT: { desc: 'Hot-plug detect from the TV (5 V when the TV sees the console)' },
    HPD_IN: { desc: 'Hot-plug detect into the APU, from level shifter U5 — 3.3 V = TV detected' },
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
      { label: 'HDMI +5 V', value: `${op.net('HDMI_5V').toFixed(2)} V` },
    ];
  },
  variants: VARIANTS,
  missable: ['D1', 'D3', 'D4', 'D5', 'D6', 'C3', 'C4', 'C6', 'C7', 'R11', 'SW1'],
  carbonise: [
    ['12V', 'GND', 'C1'],
    ['5V', 'GND', 'L1'],
  ],
  marketValue: 320,
  quoteBase: 60,
  minReputation: 15,
};

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
