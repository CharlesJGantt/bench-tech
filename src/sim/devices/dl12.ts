/**
 * Brightline DL-12 LED desk lamp main board. 12 V adapter in, 5 V buck, 3.3 V LDO,
 * a small MCU and a COB LED switched by a MOSFET.
 */
import { c, type DeviceDef } from '../board';
import { customerSession, type BoardState, type DamageEvent, type FunctionalReport, type OperatingPoint } from '../circuit';
import { addMark, type Variant } from '../faults';
import { part } from '../parts';

const VARIANTS: Variant[] = [
  // ---- Tier 1 ------------------------------------------------------------
  {
    id: 'fuse-blown',
    family: 'Blown fuse',
    tier: 1,
    weight: 1,
    apply(b) {
      b.comps.F1.fault = { type: 'open' };
      addMark(b, 'F1', 'discolored');
      return { summary: 'Input fuse F1 blew from a one-off power surge.', refs: ['F1'], hint: 'Nothing lights up at all. Start where power comes in: check the fuse F1 with continuity mode.' };
    },
  },
  {
    id: 'jack-broken',
    family: 'Damaged connector',
    tier: 1,
    weight: 1,
    apply(b) {
      b.comps.J1.fault = { type: 'open' };
      addMark(b, 'J1', 'loose');
      addMark(b, 'J1', 'bent-pin');
      return {
        summary: 'DC jack J1 is broken inside — the plug no longer makes contact. Replace the jack.',
        refs: ['J1'],
        hint: 'The customer had to wiggle the plug. Inspect the power jack J1 closely.',
        flavor: 'I had to wiggle the plug to make it work. Now it does not work at all.',
      };
    },
  },
  {
    id: 'jack-joint',
    family: 'Cracked solder joint',
    tier: 1,
    weight: 0.8,
    apply(b, rng) {
      const pin = rng.pick(['TIP', 'SLEEVE']);
      b.comps.J1.joints[pin] = { r: Infinity, cracked: true };
      return {
        summary: `The solder joint on J1's ${pin === 'TIP' ? 'centre' : 'ground'} pin cracked from cable strain. Reflow it.`,
        refs: ['J1'],
        hint: 'Power jacks take a lot of strain. Zoom in on the solder joints of J1.',
        flavor: 'It cut in and out for a while when I bumped the cable. Now nothing.',
      };
    },
  },
  {
    id: 'rail-short-5v',
    family: 'Shorted capacitor',
    tier: 1,
    weight: 1.2,
    apply(b, rng) {
      const ref = rng.pick(['C3', 'C4', 'C7', 'C6']);
      const r = rng.range(0.2, 1.5);
      b.comps[ref].fault = { type: 'short', r };
      return {
        summary: `Capacitor ${ref} failed short (${r.toFixed(2)} Ω), dragging its power rail down to ground.`,
        refs: [ref],
        hint: 'One power rail is dead. Measure resistance from each rail test point to ground — a few ohms means a short. Then inject a little voltage with the PSU and find what heats up.',
      };
    },
  },
  {
    id: 'lamp-resistor-burnt',
    family: 'Burnt resistor',
    tier: 1,
    weight: 0.8,
    apply(b) {
      b.comps.R10.fault = { type: 'open' };
      b.comps.R10.burnt = true;
      addMark(b, 'R10', 'scorch');
      return { summary: 'Lamp resistor R10 overheated and burnt open.', refs: ['R10'], hint: 'The small lights work but the lamp does not. Look around the lamp circuit for anything that looks cooked.' };
    },
  },
  {
    id: 'led-dead',
    family: 'Failed diode',
    tier: 1,
    weight: 0.6,
    apply(b, rng) {
      const ref = rng.pick(['D4', 'D6']);
      b.comps[ref].fault = { type: 'open' };
      return { summary: `Indicator LED ${ref} failed open.`, refs: [ref], hint: `One indicator stays dark. Test ${ref} with diode mode — a good LED reads around 2–3 V and glows faintly.` };
    },
  },
  {
    id: 'lamp-fet-short',
    family: 'Failed MOSFET',
    tier: 1,
    weight: 0.8,
    apply(b, rng) {
      b.comps.Q2.fault = { type: 'short', r: rng.range(0.02, 0.3) };
      return { summary: 'Lamp switch MOSFET Q2 failed shorted, so the lamp is stuck on.', refs: ['Q2'], hint: 'The lamp cannot be switched off. The part that switches the lamp is Q2 — test it in diode mode between its pins.' };
    },
  },

  // ---- Tier 2 ------------------------------------------------------------
  {
    id: 'tvs-short',
    family: 'Failed diode',
    tier: 2,
    weight: 1,
    apply(b, rng) {
      b.comps.D1.fault = { type: 'short', r: rng.range(0.05, 0.4) };
      addMark(b, 'D1', 'discolored');
      return {
        summary: 'Protection diode D1 failed short after a surge and blew the fuse. Replacing only the fuse just blows it again.',
        refs: ['D1', 'F1'],
        hint: 'The fuse is blown — but why? Check resistance from the input to ground after the fuse.',
        flavor: 'It was plugged into a different power adapter for a bit — now it is dead.',
      };
    },
  },
  {
    id: 'cap-short-other',
    family: 'Shorted capacitor',
    tier: 2,
    weight: 0.8,
    apply(b, rng) {
      const ref = rng.pick(['C2', 'C9', 'C8']);
      const r = rng.range(0.2, 2);
      b.comps[ref].fault = { type: 'short', r };
      return { summary: `Capacitor ${ref} failed short (${r.toFixed(2)} Ω).`, refs: [ref], hint: 'Find which net reads near zero ohms to ground, then which part on that net is the culprit.' };
    },
  },
  {
    id: 'resistor-open',
    family: 'Open resistor',
    tier: 2,
    weight: 1,
    apply(b, rng) {
      const ref = rng.pick(['R2', 'R6', 'R7', 'R8', 'R11', 'R13']);
      b.comps[ref].fault = { type: 'open' };
      return { summary: `Resistor ${ref} (${b.comps[ref].def.role.toLowerCase()}) cracked internally and went open.`, refs: [ref], hint: 'Find the section that is not working, then measure each resistor there with the ohms setting.' };
    },
  },
  {
    id: 'buck-dead',
    family: 'Failed regulator',
    tier: 2,
    weight: 0.8,
    apply(b) {
      b.comps.U1.fault = { type: 'dead' };
      return { summary: '5 V regulator U1 died: 12 V going in, nothing coming out.', refs: ['U1'], hint: '12 V is present but 5 V is missing. The chip that makes 5 V is U1.' };
    },
  },
  {
    id: 'ldo-dead',
    family: 'Failed regulator',
    tier: 2,
    weight: 0.8,
    apply(b) {
      b.comps.U2.fault = { type: 'dead' };
      return { summary: '3.3 V regulator U2 died: 5 V going in, nothing coming out.', refs: ['U2'], hint: '5 V is fine but 3.3 V is missing. The chip that makes 3.3 V is U2.' };
    },
  },
  {
    id: 'trace-broken',
    family: 'Broken trace',
    tier: 2,
    weight: 0.8,
    apply(b, rng) {
      const t = rng.pick(b.device.traces);
      b.traces[t.id].broken = true;
      return {
        summary: `Copper trace ${t.id} (${t.a} → ${t.b}) is cracked through. Bridge it with a jumper wire.`,
        refs: [t.id],
        hint: 'Power reaches one end of a track but not the other. Look closely along the copper traces for a hairline crack.',
      };
    },
  },
  {
    id: 'joint-cracked',
    family: 'Cracked solder joint',
    tier: 2,
    weight: 0.8,
    apply(b, rng) {
      const [ref, pin] = rng.pick<[string, string]>([
        ['L1', '2'],
        ['U2', 'IN'],
        ['F1', '1'],
        ['U3', 'VDD'],
        ['R10', '2'],
      ]);
      b.comps[ref].joints[pin] = { r: Infinity, cracked: true };
      return { summary: `Cracked solder joint on ${ref} pin ${pin}. Reflow it.`, refs: [ref], hint: 'Voltage is on the pad but not on the part leg sitting on it. Zoom in on the joints.' };
    },
  },
  {
    id: 'lamp-fet-open',
    family: 'Failed MOSFET',
    tier: 2,
    weight: 0.6,
    apply(b) {
      b.comps.Q2.fault = { type: 'open' };
      return { summary: 'Lamp switch MOSFET Q2 failed open.', refs: ['Q2'], hint: 'The button works (the controller tries to switch the lamp) but nothing happens. Check Q2.' };
    },
  },
  {
    id: 'prev-led-backwards',
    family: 'Bad previous repair',
    tier: 2,
    weight: 0.6,
    apply(b) {
      b.comps.D6.reversed = true;
      addMark(b, 'D6', 'rework-residue');
      return { summary: 'A previous repairer installed status LED D6 backwards.', refs: ['D6'], hint: 'Something here has been reworked. Check the orientation marks on reworked parts.', previousRepair: true };
    },
  },
  {
    id: 'prev-cap-backwards',
    family: 'Bad previous repair',
    tier: 2,
    weight: 0.6,
    apply(b) {
      b.comps.C1.reversed = true;
      addMark(b, 'C1', 'rework-residue');
      return { summary: 'A previous repairer installed bulk capacitor C1 backwards. It vented, shorted and blew the fuse.', refs: ['C1', 'F1'], hint: 'Electrolytic capacitors only go in one way round. Inspect C1.', previousRepair: true };
    },
  },
  {
    id: 'prev-big-fuse',
    family: 'Bad previous repair',
    tier: 2,
    weight: 0.5,
    apply(b, rng) {
      b.comps.F1.part = part('F-5A');
      b.comps.D1.fault = { type: 'short', r: rng.range(0.1, 0.4) };
      addMark(b, 'F1', 'rework-residue');
      addMark(b, 'D1', 'discolored');
      return { summary: 'Protection diode D1 is shorted, and someone "fixed" the blown fuse with an oversized 5 A fuse.', refs: ['D1', 'F1'], hint: 'The fuse is fine, but the input is pulled down. What else is across the input? Is that the right fuse?', previousRepair: true };
    },
  },

  // ---- Tier 3 ------------------------------------------------------------
  {
    id: 'buck-short',
    family: 'Failed regulator',
    tier: 3,
    weight: 0.6,
    apply(b, rng) {
      b.comps.U1.fault = { type: 'short', r: rng.range(0.3, 1.5) };
      return { summary: 'Regulator U1 failed with its input shorted to ground, and blew the fuse.', refs: ['U1', 'F1'], hint: 'The 12 V rail is shorted. Inject a low voltage and find what gets hot.' };
    },
  },
  {
    id: 'ldo-short',
    family: 'Failed regulator',
    tier: 3,
    weight: 0.5,
    apply(b, rng) {
      b.comps.U2.fault = { type: 'short', r: rng.range(0.8, 3) };
      return { summary: 'Regulator U2 failed with an internal short on its output.', refs: ['U2'], hint: 'The 3.3 V rail is low and U2 runs hot. Is it the regulator or something else on the rail?' };
    },
  },
  {
    id: 'prev-r4-wrong',
    family: 'Bad previous repair',
    tier: 3,
    weight: 0.5,
    apply(b) {
      b.comps.R4.part = part('R-10K');
      addMark(b, 'R4', 'rework-residue');
      addMark(b, 'R4', 'crooked');
      return { summary: 'A previous repairer replaced R4 (52.3k) with a 10k part, so the 5 V rail only reaches about 1.6 V.', refs: ['R4'], hint: 'Rails are low but not shorted. Compare reworked parts with the parts list.', previousRepair: true };
    },
  },
  {
    id: 'prev-r5-wrong',
    family: 'Bad previous repair',
    tier: 3,
    weight: 0.4,
    apply(b) {
      b.comps.R5.part = part('R-1K');
      addMark(b, 'R5', 'rework-residue');
      return { summary: 'A previous repairer replaced R5 (10k) with a 1k part. The 5 V rail shot up to ~12 V and killed parts downstream.', refs: ['R5'], hint: 'Several parts are dead. Before replacing them, work out what killed them.', previousRepair: true };
    },
  },
  {
    id: 'esr-5v',
    family: 'Dried-out capacitor',
    tier: 2,
    weight: 0.8,
    apply(b, rng) {
      const ref = rng.pick(['C3', 'C4']);
      b.comps[ref].fault = { type: 'esr', esr: rng.range(4, 12) };
      return {
        summary: `${ref} on the 5 V rail dried out: its capacitance and resistance still look normal, but its ESR is very high, so the regulator went unstable and the 5 V rail sags. Replace ${ref}.`,
        refs: [ref],
        hint: 'The 5 V rail is low but nothing is shorted and the regulator is not hot. An ESR meter on the 5 V capacitors (or a scope on the rail — look for ripple) finds the culprit.',
        flavor: 'It flickered for a few weeks, then stopped turning on.',
      };
    },
  },
  {
    id: 'inductor-open',
    family: 'Failed inductor',
    tier: 2,
    weight: 0.6,
    apply(b) {
      b.comps.L1.fault = { type: 'open' };
      return {
        summary: 'Buck inductor L1 went open inside, so nothing reaches the 5 V rail even though the regulator is switching. Replace L1.',
        refs: ['L1'],
        hint: 'The 5 V rail is dead but the regulator has power. Unpowered, check continuity across the inductor L1 — a good one reads almost 0 Ω.',
        flavor: 'It just died while I was using it.',
      };
    },
  },
];


export const DL12: DeviceDef = {
  id: 'dl12',
  name: 'Brightline DL-12 LED Desk Lamp',
  category: 'Lighting',
  tagline: 'A simple 12 V LED desk lamp — good for learning the basics.',
  width: 100,
  height: 64,
  blocks: [
    { name: 'POWER INPUT / PROTECTION', x: 2, y: 12, w: 40, h: 30 },
    { name: '5V BUCK', x: 42, y: 12, w: 30, h: 40 },
    { name: '3V3 LDO', x: 66, y: 10, w: 22, h: 26 },
    { name: 'MCU', x: 72, y: 36, w: 26, h: 26 },
    { name: 'LAMP DRIVER', x: 2, y: 42, w: 66, h: 20 },
  ],
  components: [
    // Power input / protection
    c('J1', 'J-BARREL', 'POWER INPUT', 7, 28, 0, { TIP: 'VIN_J', SLEEVE: 'GND' }, '12 V DC input jack'),
    c('TP1', 'TP', 'POWER INPUT', 16, 18, 0, { '1': 'VIN_J' }, 'Raw input'),
    c('F1', 'F-1A', 'POWER INPUT', 19, 25, 0, { '1': 'VIN_J', '2': 'VIN_F' }, 'Input fuse'),
    c('D1', 'D-TVS15', 'POWER INPUT', 24, 33, 270, { A: 'GND', K: 'VIN_F' }, 'Surge / over-voltage clamp'),
    c('Q1', 'Q-PFET', 'POWER INPUT', 29, 25, 0, { D: 'VIN_F', S: '12V_SYS', G: 'Q1_G' }, 'Reverse-polarity protection'),
    c('R1', 'R-100K', 'POWER INPUT', 29, 33, 90, { '1': 'Q1_G', '2': 'GND' }, 'Q1 gate pull-down'),
    c('D2', 'D-Z10', 'POWER INPUT', 34, 31, 270, { A: 'Q1_G', K: '12V_SYS' }, 'Q1 gate-source clamp'),
    c('C1', 'C-100U-25', 'POWER INPUT', 37, 19, 0, { '+': '12V_SYS', '-': 'GND' }, '12 V bulk capacitor'),
    c('TP2', 'TP', 'POWER INPUT', 39, 28, 0, { '1': '12V_SYS' }, '12 V system rail'),

    // 5 V buck
    c('C2', 'C-10U-25', '5V BUCK', 46, 22, 90, { '1': '12V_BUCK', '2': 'GND' }, 'Buck input capacitor'),
    c('U1', 'U-VX2302', '5V BUCK', 52, 23, 0, { BST: 'BST', GND: 'GND', FB: 'FB', EN: 'EN_BUCK', IN: '12V_BUCK', SW: 'SW' }, '5 V buck converter'),
    c('C5', 'C-100N', '5V BUCK', 52, 17, 0, { '1': 'BST', '2': 'SW' }, 'Bootstrap capacitor'),
    c('R2', 'R-100K', '5V BUCK', 46, 31, 90, { '1': '12V_BUCK', '2': 'EN_BUCK' }, 'Enable divider (top)'),
    c('R3', 'R-47K', '5V BUCK', 46, 37, 90, { '1': 'EN_BUCK', '2': 'GND' }, 'Enable divider (bottom)'),
    c('L1', 'L-10U', '5V BUCK', 59, 23, 0, { '1': 'SW', '2': '5V' }, 'Buck inductor'),
    c('R4', 'R-52K3', '5V BUCK', 53, 31, 90, { '1': '5V', '2': 'FB' }, 'Feedback divider (top)'),
    c('R5', 'R-10K', '5V BUCK', 53, 37, 90, { '1': 'FB', '2': 'GND' }, 'Feedback divider (bottom)'),
    c('C3', 'C-22U-10', '5V BUCK', 65, 19, 90, { '1': '5V', '2': 'GND' }, '5 V output capacitor'),
    c('C4', 'C-22U-10', '5V BUCK', 65, 27, 90, { '1': '5V', '2': 'GND' }, '5 V output capacitor'),
    c('TP3', 'TP', '5V BUCK', 61, 33, 0, { '1': '5V' }, '5 V rail'),
    c('R8', 'R-1K', '5V BUCK', 60, 39, 0, { '1': '5V', '2': 'PWR_LED' }, 'Power LED resistor'),
    c('D4', 'LED-GRN', '5V BUCK', 60, 44, 0, { A: 'PWR_LED', K: 'GND' }, 'Power indicator LED'),

    // 3.3 V LDO
    c('C6', 'C-1U', '3V3 LDO', 70, 15, 90, { '1': '5V_LDO', '2': 'GND' }, 'LDO input capacitor'),
    c('U2', 'U-HL33', '3V3 LDO', 77, 19, 0, { GND: 'GND', OUT: '3V3', IN: '5V_LDO', TAB: '3V3' }, '3.3 V regulator'),
    c('C7', 'C-10U-6', '3V3 LDO', 84, 27, 90, { '1': '3V3', '2': 'GND' }, '3.3 V output capacitor'),
    c('TP4', 'TP', '3V3 LDO', 78, 31, 0, { '1': '3V3' }, '3.3 V rail'),

    // MCU
    c('U3', 'U-PIC8', 'MCU', 85, 47, 0, { VDD: '3V3_MCU', STAT: 'STAT', LAMP: 'LAMP_IO', NRST: 'NRST', BTN: 'BTN', NC6: 'NC6', NC7: 'NC7', GND: 'GND' }, 'Lamp controller'),
    c('C9', 'C-100N', 'MCU', 79, 42, 90, { '1': '3V3_MCU', '2': 'GND' }, 'MCU decoupling'),
    c('R6', 'R-10K', 'MCU', 76, 49, 90, { '1': '3V3_MCU', '2': 'NRST' }, 'Reset pull-up'),
    c('C8', 'C-100N', 'MCU', 76, 56, 90, { '1': 'NRST', '2': 'GND' }, 'Reset delay capacitor'),
    c('R7', 'R-10K', 'MCU', 92, 40, 90, { '1': '3V3_MCU', '2': 'BTN' }, 'Button pull-up'),
    c('SW1', 'SW-TACT', 'MCU', 92, 54, 0, { '1': 'BTN', '2': 'GND' }, 'Lamp on/off button'),
    c('R13', 'R-100R', 'MCU', 89, 37, 0, { '1': 'STAT', '2': 'STAT_LED' }, 'Status LED resistor'),
    c('D6', 'LED-BLU', 'MCU', 95, 33, 90, { A: 'STAT_LED', K: 'GND' }, 'Status LED (MCU running)'),

    // Lamp driver
    c('R10', 'R-33R-1206', 'LAMP DRIVER', 16, 46, 0, { '1': '12V_SYS', '2': 'LAMP_A' }, 'Lamp current-set resistor'),
    c('LED1', 'LED-COB3', 'LAMP DRIVER', 30, 52, 0, { A: 'LAMP_A', K: 'LAMP_K' }, 'Lamp COB LED'),
    c('Q2', 'Q-NFET', 'LAMP DRIVER', 46, 52, 0, { D: 'LAMP_K', S: 'GND', G: 'LAMP_G' }, 'Lamp low-side switch'),
    c('R11', 'R-100R', 'LAMP DRIVER', 54, 52, 180, { '1': 'LAMP_IO2', '2': 'LAMP_G' }, 'Q2 gate resistor'),
    c('R12', 'R-100K', 'LAMP DRIVER', 50, 57, 90, { '1': 'LAMP_G', '2': 'GND' }, 'Q2 gate pull-down'),
    c('TP5', 'TP', 'LAMP DRIVER', 8, 56, 0, { '1': 'GND' }, 'Ground'),
  ],
  traces: [
    { id: 'T1', a: '12V_SYS', b: '12V_BUCK' },
    { id: 'T2', a: '3V3', b: '3V3_MCU' },
    { id: 'T3', a: 'LAMP_IO', b: 'LAMP_IO2' },
    { id: 'T4', a: '5V', b: '5V_LDO' },
  ],
  testPoints: [
    { ref: 'TP1', net: 'VIN_J', expected: '12 V (input present)' },
    { ref: 'TP2', net: '12V_SYS', expected: '≈12 V' },
    { ref: 'TP3', net: '5V', expected: '5.0 V' },
    { ref: 'TP4', net: '3V3', expected: '3.3 V' },
    { ref: 'TP5', net: 'GND', expected: '0 V' },
  ],
  nets: {
    GND: { desc: 'Ground', expected: 0 },
    VIN_J: { desc: 'Raw 12 V input straight from the DC jack', expected: 12 },
    VIN_F: { desc: 'Input after the fuse', expected: 12 },
    '12V_SYS': { desc: '12 V system rail (after the protection MOSFET)', expected: 12 },
    '12V_BUCK': { desc: '12 V feed into the 5 V regulator U1', expected: 12 },
    Q1_G: { desc: 'Gate of protection MOSFET Q1 (sits ~10 V below the rail when on)', expected: 2.2 },
    EN_BUCK: { desc: 'Enable pin of U1 — must be above 1.2 V for U1 to run', expected: 3.9 },
    SW: { desc: 'U1 switch node (a meter shows the average, about 5 V)', expected: 5 },
    BST: { desc: 'U1 bootstrap pin' },
    FB: { desc: 'U1 feedback — U1 regulates this to 0.8 V', expected: 0.8 },
    '5V': { desc: '5 V rail', expected: 5 },
    '5V_LDO': { desc: '5 V feed into the 3.3 V regulator U2', expected: 5 },
    PWR_LED: { desc: 'Power LED D4 anode', expected: 2.1 },
    '3V3': { desc: '3.3 V rail', expected: 3.3 },
    '3V3_MCU': { desc: '3.3 V supply at the microcontroller', expected: 3.3 },
    NRST: { desc: 'Microcontroller reset — must be high or the MCU stays asleep', expected: 3.3 },
    BTN: { desc: 'Button input — high normally, drops to 0 V while pressed', expected: 3.3 },
    STAT: { desc: 'MCU status output (high = MCU running)', expected: 3.3 },
    STAT_LED: { desc: 'Status LED D6 anode' },
    LAMP_IO: { desc: 'MCU lamp output (high = lamp on)' },
    LAMP_IO2: { desc: 'Lamp control signal at R11' },
    LAMP_G: { desc: 'Gate of lamp switch Q2 (high = lamp on)' },
    LAMP_A: { desc: 'Lamp LED anode' },
    LAMP_K: { desc: 'Lamp LED cathode / Q2 drain (near 0 V when the lamp is on)' },
    NC6: { desc: 'Unused MCU pin' },
    NC7: { desc: 'Unused MCU pin' },
  },
  rails: [
    { net: '12V_SYS', nominal: 12, label: '12V' },
    { net: '5V', nominal: 5, label: '5V' },
    { net: '3V3', nominal: 3.3, label: '3V3' },
  ],
  input: {
    ref: 'J1',
    plus: 'TIP',
    minus: 'SLEEVE',
    adapter: { v: 12.2, ilim: 2.5, rint: 0.25, label: "the owner's 12 V adapter" },
    psuV: 12,
    psuI: 1,
  },
  ground: 'TP5',
  controls: [{ ref: 'SW1', label: 'Lamp button' }],
  firmware: {
    ref: 'U3',
    vmin: 2.6,
    vmax: 4.2,
    reset: 'NRST',
    inputs: ['BTN'],
    boot: () => ({ lamp: 0 }),
    step(state, inputs, prev) {
      // Button pulls BTN low: toggle the lamp on each press.
      if (!inputs.BTN && prev.BTN) state.lamp = state.lamp ? 0 : 1;
      return { STAT: true, LAMP: state.lamp === 1 };
    },
  },
  functional,
  complain,
  status(_b, op) {
    if (!op) return [];
    const lamp = op.current('LED1');
    return [
      { label: 'Lamp', value: lamp > 0.03 ? `ON (${Math.round((lamp / 0.1) * 100)}%)` : 'off', ok: lamp > 0.03 },
      { label: 'Power light (green)', value: op.current('D4') > 5e-4 ? 'on' : 'off', ok: op.current('D4') > 5e-4 },
      { label: 'Status light (blue)', value: op.current('D6') > 5e-4 ? 'on' : 'off', ok: op.current('D6') > 5e-4 },
    ];
  },
  variants: VARIANTS,
  missable: ['C3', 'C4', 'C6', 'C9', 'R8', 'R12', 'R13', 'D4', 'D6', 'Q2', 'SW1', 'F1'],
  carbonise: [
    ['12V_SYS', 'GND', 'C1'],
    ['5V', 'GND', 'L1'],
    ['VIN_F', 'GND', 'D1'],
  ],
  marketValue: 92,
  quoteBase: 30,
  minReputation: 0,
};

const lit = (op: OperatingPoint, ref: string, min: number) => op.current(ref) > min;

/** Plug in the adapter, check the lights, press the button twice. */
function functional(b: BoardState): FunctionalReport {
  const s = customerSession(b);
  const op0 = s.settle();
  const pwrLed = lit(op0, 'D4', 0.5e-3);
  const statusLed = lit(op0, 'D6', 0.5e-3);
  const lampAtPowerOn = lit(op0, 'LED1', 0.03);
  const inputCurrent = op0.srcI;
  const op1 = s.press('SW1');
  const lampAfterPress = lit(op1, 'LED1', 0.03);
  const lampBrightness = op1.current('LED1') / 0.1;
  const op2 = s.press('SW1');
  const lampOffAfterSecondPress = !lit(op2, 'LED1', 0.005);
  s.end();
  const checks = [
    { label: 'Green power light on', ok: pwrLed },
    { label: 'Blue status light on', ok: statusLed },
    { label: 'Lamp stays off until the button is pressed', ok: !lampAtPowerOn },
    { label: 'Button turns the lamp on at full brightness', ok: lampAfterPress && lampBrightness > 0.8 && lampBrightness < 1.3 },
    { label: 'Button turns the lamp off again', ok: lampOffAfterSecondPress },
  ];
  return {
    checks,
    facts: { pwrLed, statusLed, lampAtPowerOn, lampAfterPress, lampOffAfterSecondPress, lampBrightness },
    inputCurrent,
    events: s.events,
    passed: checks.every((c) => c.ok) && !s.events.length,
  };
}

/** Turn what the owner experiences into a complaint. */
function complain(r: FunctionalReport, events: DamageEvent[]): string {
  const f = r.facts as Record<string, boolean> & { lampBrightness: number };
  const bang = events.some((e) => e.kind === 'smoke' || e.kind === 'vent')
    ? ' There was a burning smell.'
    : events.some((e) => e.kind === 'pop' || e.kind === 'fuse')
      ? ' I think I heard a little pop.'
      : '';
  let s: string;
  if (!f.pwrLed && !f.statusLed && !f.lampAtPowerOn && !f.lampAfterPress) s = 'Completely dead. No lights at all.';
  else if (f.lampAtPowerOn && !f.lampOffAfterSecondPress) s = 'The lamp turns on by itself as soon as I plug it in, and the button will not turn it off.';
  else if (f.pwrLed && !f.statusLed && !f.lampAfterPress) s = 'The little green light comes on, but the button does nothing and the lamp will not light.';
  else if (!f.pwrLed && f.statusLed && f.lampAfterPress) s = 'The green power light is out. Otherwise it seems to work.';
  else if (f.pwrLed && !f.statusLed && f.lampAfterPress) s = 'The blue light on the base stopped working. The lamp itself is fine.';
  else if (f.statusLed && !f.lampAfterPress) s = 'Both little lights come on but the lamp will not turn on when I press the button.';
  else if (f.lampAfterPress && f.lampBrightness < 0.8) s = 'The lamp is really dim now.';
  else if (!f.pwrLed && !f.statusLed && f.lampAfterPress) s = 'Weird one: the lamp comes on but the indicator lights are dead.';
  else s = 'It acts strange — sometimes works, sometimes not.';
  return s + bang;
}
