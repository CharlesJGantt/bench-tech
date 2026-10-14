/**
 * Retro home-console factory. One layout (150 × 100 mm) for the 8/16/64-bit consoles:
 * adapter → fuse → (power switch) → 7805 → 5 V; CPU, video chip, optional lockout chip,
 * cartridge slot, RF modulator and/or AV out, optional sound chip, controller ports.
 * Each console adds its own parts and faults on top.
 */
import { device, place } from '../blocks/core';
import { powerInput } from '../blocks/power';
import { c, type ComponentDef, type DeviceDef, type External } from '../board';
import { customerSession, type BoardState, type DamageEvent, type FunctionalReport, type OperatingPoint } from '../circuit';
import { tarnish } from '../contacts';
import { resistor } from '../elements';
import { addMark, type Rng, type Variant } from '../faults';
import { cx, testCart } from './retro';

export interface ConsoleSpec {
  id: string;
  name: string;
  tagline: string;
  volts: 9 | 12;
  connector: 'barrel' | 'header';
  /** Reverse-polarity protection on the input. */
  reverse?: boolean;
  cpu: string;
  video: string;
  /** Video chip runs from this rail (default 5V). */
  videoRail?: string;
  lockout: boolean;
  rf: boolean;
  av: boolean;
  audio?: string;
  powerSwitch?: boolean;
  ports: 1 | 2;
  /** Extra CPU inputs that must be high before it draws (e.g. the B64 jumper pak). */
  cpuInputs?: Record<string, string>;
  extras?: ComponentDef[];
  extraNets?: DeviceDef['nets'];
  extraVariants?: Variant[];
  marketValue: number;
  quoteBase: number;
  minReputation: number;
}

export function retroConsole(spec: ConsoleSpec): DeviceDef {
  const vin = spec.powerSwitch ? 'VSW' : 'VIN_F';
  const extraIn = spec.cpuInputs ?? {};
  const parts: ComponentDef[] = [
    c('U1', 'U-7805T', '5V', 46, 10, 0, { IN: vin, GND: 'GND', OUT: '5V' }, '5 V regulator (7805)'),
    c('C2', 'C-100N', '5V', 40, 22, 0, { '1': vin, '2': 'GND' }, 'Regulator input decoupling'),
    c('C3', 'C-10U-16E', '5V', 58, 22, 0, { '+': '5V', '-': 'GND' }, '5 V output capacitor'),
    c('TP3', 'TP', '5V', 62, 8, 0, { '1': '5V' }, '5 V rail'),
    c('J2', 'J-SLOT6', 'SLOT', 100, 14, 0, { '5V': '5V', GND: 'GND', CE: 'CE', D0: 'DIN', LKI: 'KEY_OUT', LKO: 'KEY_IN' }, 'Cartridge slot'),
    c('R3', 'R-10K', 'SLOT', 82, 28, 0, { '1': 'DIN', '2': 'GND' }, 'Data pull-down'),
    cx('U2', spec.cpu, 'CPU', 38, 55, 0, { VDD: '5V', GND: 'GND', RST: 'RST', CE: 'CE', DIN: 'DIN', LED: 'LED_IO', VEN: 'VEN', ...extraIn }, 'CPU'),
    cx('U3', spec.video, 'CPU', 98, 55, 0, { VCC: spec.videoRail ?? '5V', GND: 'GND', VEN: 'VEN', VID: 'VID' }, 'Video chip'),
    c('J5', 'J-HDR3', 'PORTS', 80, 90, 0, { '5V': '5V', DATA: 'PAD', GND: 'GND' }, 'Controller port 1'),
    c('R6', 'R-10K', 'PORTS', 80, 80, 0, { '1': '5V', '2': 'PAD' }, 'Controller data pull-up'),
    c('R1', 'R-220R', 'PORTS', 96, 80, 0, { '1': 'LED_IO', '2': 'LED_A' }, 'Power LED resistor'),
    c('D1', 'LED-RED', 'PORTS', 104, 88, 0, { A: 'LED_A', K: 'GND' }, 'Power light'),
    c('TP4', 'TP', 'PORTS', 6, 94, 0, { '1': 'GND' }, 'Ground'),
    c('TP5', 'TP', 'CPU', 120, 70, 0, { '1': 'VID' }, 'Video'),
  ];
  if (spec.lockout)
    parts.push(
      c('R4', 'R-10K', 'SLOT', 118, 28, 0, { '1': 'KEY_IN', '2': 'GND' }, 'Lockout answer pull-down'),
      cx('U4', 'U-LOCK-C', 'LOCK', 30, 86, 0, { VCC: '5V', GND: 'GND', KI: 'KEY_IN', KO: 'KEY_OUT', RST: 'RST' }, 'Lockout chip'),
      c('R5', 'R-10K', 'LOCK', 50, 80, 0, { '1': 'RST', '2': 'GND' }, 'CPU reset pull-down'),
    );
  else parts.push(c('R5', 'R-10K', 'LOCK', 50, 80, 0, { '1': '5V', '2': 'RST' }, 'CPU reset pull-up'));
  if (spec.rf) {
    parts.push(cx('RF1', 'U-RFMOD', 'CPU', 136, 50, 0, { '5V': '5V', GND: 'GND', VID: 'VID', RF: 'RF' }, 'RF modulator'));
    parts.push(c('J4', 'J-RCA', 'CPU', 124, 82, 0, { SIG: 'RF', GND: 'GND' }, 'RF out (aerial)'));
  }
  if (spec.av) parts.push(c('J3', 'J-RCA', 'CPU', 140, 82, 0, { SIG: 'VID', GND: 'GND' }, 'AV out (composite video)'));
  if (spec.audio)
    parts.push(
      cx('U5', spec.audio, 'AUDIO', 72, 38, 0, { VCC: '5V', GND: 'GND', AEN: 'VEN', AOUT: 'AUD' }, 'Sound chip'),
      c('J6', 'J-RCA', 'AUDIO', 140, 30, 0, { SIG: 'AUD', GND: 'GND' }, 'Audio out'),
    );
  if (spec.powerSwitch) parts.push(c('SW1', 'SW-SLIDE', '5V', 40, 32, 0, { '1': 'VIN_F', '2': 'VSW' }, 'Power switch'));
  if (spec.ports === 2)
    parts.push(
      c('J7', 'J-HDR3', 'PORTS', 64, 90, 0, { '5V': '5V', DATA: 'PAD2', GND: 'GND' }, 'Controller port 2'),
      c('R7', 'R-10K', 'PORTS', 64, 80, 0, { '1': '5V', '2': 'PAD2' }, 'Port 2 data pull-up'),
    );
  parts.push(...(spec.extras ?? []));

  const tvInput = spec.rf ? 'aerial' : 'AV';
  const state = (b: BoardState, op: OperatingPoint) => {
    const running = b.mcu.running;
    const fivev = op.net('5V') > 4.5;
    return {
      light: running ? 'on' : fivev && spec.lockout ? 'blinking' : fivev ? 'on (no game)' : 'off',
      rf: op.current('tv-rf') > 2e-3,
      av: op.current('tv-av') > 2e-3,
      sound: op.current('tv-aud') > 2e-3,
      pad: op.current('pad') > 5e-5 && running,
    };
  };
  const picture = (st: ReturnType<typeof state>) => (spec.rf ? st.rf : st.av);

  const variants: Variant[] = [
    {
      id: 'slot-tarnish',
      family: 'Dirty contacts',
      tier: 1,
      weight: 1.5,
      apply(b, rng) {
        tarnish(b, 'J2', rng.range(0.5, 0.75), () => rng.next());
        for (const pin of ['D0', 'LKO']) b.comps.J2.oxide![pin] = 0.95;
        return {
          summary: 'The cartridge slot contacts are tarnished, so no game reads. Scrub the slot contacts and Pad-Bright them.',
          refs: ['J2'],
          hint: 'Every game fails? Then it is not the games. Look at the slot contacts.',
          flavor: spec.lockout ? 'The power light just blinks with every game I own.' : 'Every game gives a scrambled or blank screen.',
        };
      },
    },
    {
      id: 'slot-worn',
      family: 'Damaged connector',
      tier: 2,
      weight: 0.6,
      apply(b) {
        b.comps.J2.fault = { type: 'pins-open', pins: ['D0', 'LKO'] };
        addMark(b, 'J2', 'loose');
        return {
          summary: 'The cartridge slot springs are worn flat — cleaning will not bring them back. Replace the slot J2.',
          refs: ['J2'],
          hint: 'The slot contacts look clean, but do they still press against a cartridge?',
          flavor: 'I have to wedge the game in at an angle, and now even that does not work.',
        };
      },
    },
    {
      id: 'reg-dead',
      family: 'Failed regulator',
      tier: 2,
      weight: 0.8,
      apply(b) {
        b.comps.U1.fault = { type: 'dead' };
        return { summary: 'The 7805 regulator U1 died: input voltage in, no 5 V out. Replace U1.', refs: ['U1'], hint: 'Is the adapter voltage reaching the regulator? Is there 5 V on its output?', flavor: 'Completely dead. No light at all.' };
      },
    },
    {
      id: 'reg-cap',
      family: 'Shorted capacitor',
      tier: 1,
      weight: 0.6,
      apply(b, rng) {
        b.comps.C3.fault = { type: 'short', r: rng.range(0.2, 0.8) };
        addMark(b, 'C3', 'bulged');
        return { summary: 'The 5 V capacitor C3 has shorted (bulging), pulling the 5 V rail down and cooking the regulator. Replace C3.', refs: ['C3'], hint: 'Regulator very hot, 5 V near zero. Measure 5 V to ground with the power off.', flavor: 'It smells hot and nothing happens.' };
      },
    },
    {
      id: 'video-dead',
      family: 'Failed video chip',
      tier: 3,
      weight: 0.4,
      apply(b) {
        b.comps.U3.fault = { type: 'dead' };
        return { summary: `The video chip U3 has died: the CPU runs and asks for a picture, but nothing comes out. Replace U3 (special order, or a donor board).`, refs: ['U3'], hint: 'The light is steady and the CPU enables the video chip (VEN high), but there is no video signal anywhere.', flavor: 'The light comes on but the TV stays black.' };
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
        return { summary: 'Controller port 1 (J5) has a bent, cracked data pin. Replace the port.', refs: ['J5'], hint: 'The game starts but the controller does nothing. Look into the port.', flavor: 'Games start but player one cannot move.' };
      },
    },
    ...(spec.lockout
      ? [
          {
            id: 'lockout-dead',
            family: 'Failed lockout chip',
            tier: 2,
            weight: 0.6,
            apply(b: BoardState) {
              b.comps.U4.fault = { type: 'dead' };
              return { summary: 'The console lockout chip U4 is dead and holds the CPU in reset. Replace U4.', refs: ['U4'], hint: 'Clean slot, good game, still no start? Does the lockout chip send its challenge — and release reset?', flavor: 'Nothing starts, with any game.' };
            },
          } as Variant,
        ]
      : []),
    ...(spec.rf
      ? [
          {
            id: 'rfmod-dead',
            family: 'Failed RF modulator',
            tier: 2,
            weight: 0.6,
            apply(b: BoardState) {
              b.comps.RF1.fault = { type: 'dead' };
              return { summary: 'The RF modulator RF1 is dead: no signal on the aerial output. Replace RF1.', refs: ['RF1'], hint: spec.av ? 'Try the AV output. Picture there?' : 'Is there video going into the modulator? Anything coming out?', flavor: 'The TV channel is just snow now.' };
            },
          } as Variant,
        ]
      : []),
    ...(spec.audio
      ? [
          {
            id: 'sound-dead',
            family: 'Failed sound chip',
            tier: 2,
            weight: 0.6,
            apply(b: BoardState) {
              b.comps.U5.fault = { type: 'dead' };
              return { summary: 'The sound chip U5 has died: picture fine, no sound. Replace U5.', refs: ['U5'], hint: 'Picture is fine but silent. Is the sound chip powered and enabled? Anything on its output?', flavor: 'Picture is perfect but there is no sound at all.' };
            },
          } as Variant,
        ]
      : []),
    ...(spec.powerSwitch
      ? [
          {
            id: 'switch-oxide',
            family: 'Dirty contacts',
            tier: 1,
            weight: 1.2,
            apply(b: BoardState, rng: Rng) {
              tarnish(b, 'SW1', rng.range(0.92, 0.99), () => rng.next());
              return { summary: 'The power switch contacts are oxidised: the switch no longer connects. Clean the switch contacts (scrub + Pad-Bright).', refs: ['SW1'], hint: 'Adapter voltage is there before the switch, nothing after it, with the switch on.', flavor: 'I used to wiggle the switch to get it going. Now it will not come on at all.' };
            },
          } as Variant,
        ]
      : []),
    ...(spec.extraVariants ?? []),
  ];

  const externals: External[] = [
    testCart('J2'),
    {
      id: 'tv',
      label: `📺 TV (${[spec.rf ? 'aerial' : '', spec.av ? 'AV' : ''].filter(Boolean).join(' + ')})`,
      attach(api) {
        if (spec.rf) api.add(resistor(api.mate('J4', 'SIG'), api.mate('J4', 'GND'), 1000, 'tv-rf'));
        if (spec.av) api.add(resistor(api.mate('J3', 'SIG'), api.mate('J3', 'GND'), 1000, 'tv-av'));
        if (spec.audio) api.add(resistor(api.mate('J6', 'SIG'), api.mate('J6', 'GND'), 1000, 'tv-aud'));
      },
    },
    {
      id: 'pad',
      label: '🎮 Controller',
      attach(api) {
        api.add(resistor(api.mate('J5', 'DATA'), api.mate('J5', 'GND'), 47e3, 'pad'));
      },
    },
  ];

  function functional(b: BoardState): FunctionalReport {
    b.attached = ['cart', 'tv', 'pad'];
    const s = customerSession(b, { kind: 'adapter' });
    s.settle();
    const op = s.settle();
    const st = state(b, op);
    s.end();
    const checks = [
      { label: 'Power light comes on steady', ok: st.light === 'on' },
      { label: `Game picture on the TV (${tvInput})`, ok: picture(st) },
      ...(spec.audio ? [{ label: 'Game sound', ok: st.sound }] : []),
      { label: 'Controller works', ok: st.pad },
    ];
    return { checks, facts: { light: st.light === 'on', blinking: st.light === 'blinking', picture: picture(st), sound: st.sound, pad: st.pad }, inputCurrent: op.srcI, events: s.events, passed: checks.every((x) => x.ok) && !s.events.length };
  }

  function complain(r: FunctionalReport, events: DamageEvent[], rng: Rng): string {
    const f = r.facts as Record<string, boolean>;
    const pop = events.length ? ' Something popped.' : '';
    if (f.blinking) return 'The power light just blinks on and off.' + pop;
    if (!f.light) return rng.pick(['Completely dead.', 'No light, nothing.']) + pop;
    if (!f.picture) return 'The light is on but the TV shows nothing.' + pop;
    if (spec.audio && !f.sound) return 'Picture is fine but there is no sound.' + pop;
    if (!f.pad) return 'Games start but the controller does nothing.' + pop;
    return 'It acts up.' + pop;
  }

  return device({
    id: spec.id,
    name: spec.name,
    category: 'Retro console',
    tagline: spec.tagline,
    width: 150,
    height: 100,
    blocks: [
      place('IN', powerInput({ connector: spec.connector, volts: spec.volts, fuse: 'F-1A', bulk: 'C-470U-16', source: `the ${spec.volts} V adapter`, reverse: spec.reverse }), [2, 2], { out: 'VIN_F' }, { conn: 'J1', fuse: 'F1', bulk: 'C1', tpIn: 'TP1', tpOut: 'TP2', rpFet: 'Q1', rpRes: 'R9', rpZener: 'D9' }, { faults: true }),
    ],
    outlines: [
      { name: '5 V', x: 34, y: 2, w: 32, h: 34 },
      { name: 'CARTRIDGE SLOT', x: 74, y: 2, w: 54, h: 30 },
      { name: 'CPU / VIDEO', x: 2, y: 38, w: 128, h: 34 },
      { name: 'PORTS', x: 2, y: 74, w: 110, h: 24 },
    ],
    parts,
    traces: [],
    testPoints: [
      { ref: 'TP1', net: 'IN_VIN', expected: `${spec.volts} V from the adapter` },
      { ref: 'TP2', net: 'VIN_F', expected: `≈${spec.volts} V after the fuse` },
      { ref: 'TP3', net: '5V', expected: '5 V' },
      { ref: 'TP4', net: 'GND', expected: '0 V' },
      { ref: 'TP5', net: 'VID', expected: 'high with a game running' },
    ],
    rails: [
      { net: 'VIN_F', nominal: spec.volts, label: `${spec.volts}V` },
      { net: '5V', nominal: 5, label: '5V' },
    ],
    nets: {
      GND: { desc: 'Ground', expected: 0 },
      '5V': { desc: '5 V logic supply from the 7805', expected: 5, power: true },
      ...(spec.powerSwitch ? { VSW: { desc: 'After the power switch', expected: spec.volts, power: true } } : {}),
      CE: { desc: 'Cartridge ROM enable (CPU → cartridge)' },
      DIN: { desc: 'Game data from the cartridge into the CPU' },
      KEY_OUT: { desc: 'Lockout challenge (console → cartridge)' },
      KEY_IN: { desc: 'Lockout answer (cartridge → console)' },
      RST: { desc: spec.lockout ? 'CPU reset: held low by the lockout chip until the cartridge answers' : 'CPU reset (pulled high = run)' },
      VEN: { desc: 'CPU tells the video (and sound) chips to run' },
      VID: { desc: 'Composite video out' },
      ...(spec.rf ? { RF: { desc: 'RF (aerial) signal out of the modulator' } } : {}),
      ...(spec.audio ? { AUD: { desc: 'Audio out' } } : {}),
      LED_IO: { desc: 'Power light drive from the CPU' },
      LED_A: { desc: 'Power LED anode' },
      PAD: { desc: 'Controller port 1 data' },
      ...(spec.ports === 2 ? { PAD2: { desc: 'Controller port 2 data' } } : {}),
      ...(spec.extraNets ?? {}),
    },
    input: { ref: 'J1', plus: spec.connector === 'header' ? '12V' : 'TIP', minus: spec.connector === 'header' ? 'GND' : 'SLEEVE', adapter: { v: spec.volts, ilim: 1, rint: 0.5, label: `the owner's ${spec.volts} V adapter` }, psuV: spec.volts, psuI: 1 },
    ground: 'TP4',
    controls: [],
    firmware: {
      ref: 'U2',
      vmin: 4.5,
      vmax: 5.6,
      reset: 'RST',
      inputs: ['DIN', ...Object.keys(extraIn)],
      boot: () => ({}),
      step(_s, inputs) {
        return { CE: true, LED: true, VEN: inputs.DIN && Object.keys(extraIn).every((k) => inputs[k]) };
      },
    },
    externals,
    ownerAttaches: ['cart', 'tv', 'pad'],
    functional,
    complain,
    status(b, op) {
      if (!op) return [];
      const st = state(b, op);
      const tv = b.attached.includes('tv');
      return [
        { label: 'Power light', value: st.light, ok: st.light === 'on' },
        ...(spec.rf ? [{ label: 'TV (aerial)', value: st.rf ? 'game picture' : tv ? 'snow' : 'not connected', ok: st.rf }] : []),
        ...(spec.av ? [{ label: 'TV (AV)', value: st.av ? 'game picture' : tv ? 'no signal' : 'not connected', ok: st.av }] : []),
        ...(spec.audio ? [{ label: 'Sound', value: st.sound ? 'playing' : tv ? 'silent' : 'not connected', ok: st.sound }] : []),
        { label: 'Controller', value: st.pad ? 'responds' : b.attached.includes('pad') ? 'dead' : 'not plugged in', ok: st.pad },
      ];
    },
    variants,
    missable: ['C2', 'R6', 'TP5'],
    carbonise: [
      ['5V', 'GND', 'C3'],
      ['VIN_F', 'GND', 'C1'],
    ],
    marketValue: spec.marketValue,
    quoteBase: spec.quoteBase,
    minReputation: spec.minReputation,
  });
}
