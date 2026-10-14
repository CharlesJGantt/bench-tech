/**
 * Shared pieces for retro consoles and their cartridges: the cartridge board factory (one
 * board design per console, sold under several game titles), the "test cartridge" a console
 * repair uses, and the console-side hookup a cartridge repair uses.
 *
 * Cartridge bus (abstracted to six contacts): 5V, GND, CE (console enables the ROM), D0 (game
 * data back to the console), LKI (lockout challenge in), LKO (lockout answer out).
 */
import { c, type ComponentDef, type DeviceDef, type External } from '../board';
import { device } from '../blocks/core';
import { customerSession, type BoardState, type DamageEvent, type FunctionalReport, type OperatingPoint } from '../circuit';
import { tarnish } from '../contacts';
import { logic, resistor } from '../elements';
import { addMark, liquidDamage, type Rng, type Variant } from '../faults';
import { part, pinsOf } from '../parts';

/** Pin map for a part: named nets, everything else on its own `<ref>_<pin>` net. */
export function pinMap(ref: string, partNo: string, nets: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const pin of pinsOf(part(partNo))) out[pin] = nets[pin] ?? `${ref}_${pin}`;
  return out;
}

/** Place a part with only some pins connected (the rest float on their own nets). */
export function cx(ref: string, partNo: string, block: string, x: number, y: number, rot: ComponentDef['rot'], nets: Record<string, string>, role: string, mates?: string): ComponentDef {
  return c(ref, partNo, block, x, y, rot, pinMap(ref, partNo, nets), role, mates);
}

/** A known-good cartridge in a console's slot: answers the lockout and serves game data. */
export function testCart(slot: string, label = '🎮 Test cartridge (known good)', vmin = 4.2): External {
  return {
    id: 'cart',
    label,
    attach(api) {
      const m = (p: string) => api.mate(slot, p);
      api.add(logic(m('5V'), m('GND'), [{ high: [m('CE')], low: [], outs: [m('D0')] }, { high: [m('LKI')], low: [], outs: [m('LKO')] }], vmin, 0.02, 'test-cart'));
    },
  };
}

/** The console a cartridge is plugged into: enables the ROM, sends the lockout challenge, reads both back. */
export function consoleSlot(edge: string, label = '🕹 Plugged into a console'): External {
  return {
    id: 'console',
    label,
    attach(api) {
      const m = (p: string) => api.mate(edge, p);
      api.add(resistor(m('5V'), m('CE'), 1000, 'con-ce'));
      api.add(resistor(m('5V'), m('LKI'), 1000, 'con-lki'));
      api.add(resistor(m('D0'), m('GND'), 10e3, 'con-d0'));
      api.add(resistor(m('LKO'), m('GND'), 10e3, 'con-lko'));
    },
  };
}

/** What the console sees from a cartridge (used by the cart's own test and the Test Station). */
export function cartReads(op: OperatingPoint): { rom: boolean; lockout: boolean } {
  return { rom: op.current('con-d0') > 3e-4, lockout: op.current('con-lko') > 3e-4 };
}

export interface CartSpec {
  id: string;
  /** e.g. "BES Game Pak" */
  name: string;
  console: string;
  consoleName: string;
  titles: { name: string; value: number }[];
  romPart: string;
  lockout: boolean;
  save: boolean;
  quoteBase: number;
  minReputation?: number;
}

/** Variants every cartridge board can have (refs follow the factory layout below). */
function cartVariants(spec: CartSpec): Variant[] {
  const v: Variant[] = [
    {
      id: 'dirty-fingers',
      family: 'Dirty contacts',
      tier: 1,
      weight: 1.6,
      apply(b, rng) {
        tarnish(b, 'J1', rng.range(0.55, 0.8), () => rng.next());
        for (const pin of ['CE', 'D0']) b.comps.J1.oxide![pin] = 0.95;
        return {
          summary: 'Decades of grime and oxide on the edge fingers: the console cannot read the game. Scrub the contacts (eraser or magic sponge), then Pad-Bright them.',
          refs: ['J1'],
          hint: 'Look at the gold fingers along the bottom edge. Are they bright?',
          flavor: rng.pick(['It just shows a grey screen. Blowing in it used to work.', 'Takes ten tries to get it to start, now it never does.']),
        };
      },
    },
    {
      id: 'rom-resistor',
      family: 'Blown resistor',
      tier: 2,
      weight: 0.7,
      apply(b) {
        b.comps.R1.fault = { type: 'open' };
        addMark(b, 'R1', 'discolored');
        return {
          summary: 'The data-line resistor R1 between the ROM and the edge fingers is burnt open, so no game data reaches the console. Replace R1.',
          refs: ['R1'],
          hint: 'Power it through the fingers and follow the data line from the ROM to the edge connector.',
          flavor: 'Black screen. My friend says it was in a console with a dodgy power supply.',
        };
      },
    },
    {
      id: 'bad-cap',
      family: 'Shorted capacitor',
      tier: 1,
      weight: 0.8,
      apply(b, rng) {
        b.comps.C2.fault = { type: 'short', r: rng.range(0.3, 1) };
        addMark(b, 'C2', 'bulged');
        return {
          summary: 'The 5 V filter capacitor C2 has failed short (bulging top), dragging the cartridge supply down. Replace C2.',
          refs: ['C2'],
          hint: 'Measure resistance from 5V to GND on the fingers. Any part looking swollen?',
          flavor: 'The console turns off by itself when this game is in.',
        };
      },
    },
    {
      id: 'rom-dead',
      family: 'Dead game ROM',
      tier: 3,
      weight: 0.3,
      apply(b) {
        b.comps.U1.fault = { type: 'dead' };
        return {
          summary: 'The mask ROM U1 has died. Nobody sells new ones: transplant the ROM from a donor cartridge of the same game (or sell this one as faulty).',
          refs: ['U1'],
          hint: 'Power and enable (CE) reach the ROM, but its data pin never answers.',
        };
      },
    },
  ];
  if (spec.lockout)
    v.push({
      id: 'lockout-dead',
      family: 'Failed lockout chip',
      tier: 2,
      weight: 0.7,
      apply(b) {
        b.comps.U2.fault = { type: 'dead' };
        return {
          summary: `The cartridge lockout chip U2 is dead, so the ${spec.consoleName} keeps resetting (blinking power light). Replace U2.`,
          refs: ['U2'],
          hint: 'The console asks the cartridge a question on LKI. Does the lockout chip answer on LKO?',
          flavor: 'The power light just blinks with this game in. Other games work.',
        };
      },
    });
  if (spec.save)
    v.push(
      {
        id: 'save-battery',
        family: 'Dead save battery',
        tier: 1,
        weight: 1.3,
        apply(b) {
          b.comps.BT1.fault = { type: 'open' };
          return {
            summary: 'The save coin cell BT1 is flat, so the save RAM forgets everything when the console is off. Fit a new tabbed CR2032 — solder the tabs, never the cell.',
            refs: ['BT1'],
            hint: 'With the console off, what keeps the save RAM alive? Measure the coin cell.',
            flavor: 'The game works but it never remembers my saves.',
          };
        },
      },
      {
        id: 'save-resistor',
        family: 'Blown resistor',
        tier: 2,
        weight: 0.6,
        apply(b) {
          b.comps.R2.fault = { type: 'open' };
          return {
            summary: 'R2, which feeds the coin cell to the save RAM, is open: the battery is fine but never reaches the chip. Replace R2.',
            refs: ['R2'],
            hint: 'The coin cell measures 3 V but the save RAM supply (VSAVE) is 0 V with the console off. Follow the path.',
            flavor: 'Saves disappear. I already put a new battery in and it did not help.',
          };
        },
      },
      {
        id: 'battery-leak',
        family: 'Liquid damage',
        tier: 2,
        weight: 0.6,
        apply(b, rng) {
          b.comps.BT1.fault = { type: 'open' };
          liquidDamage(b, rng, ['BT1', 'R2'], 0.35, 0.55);
          b.comps.R2.corr!.pins['1'] = 0.97;
          return {
            summary: 'The old coin cell leaked: the crust has eaten through the R2 joint and the cell is dead. Clean the corrosion (cleaner, scrub, IPA), and fit a new tabbed CR2032.',
            refs: ['BT1', 'R2'],
            hint: 'Look around the coin cell. That crust is not supposed to be there.',
            flavor: 'Lost all my saves and there is green stuff in it.',
          };
        },
      },
    );
  return v;
}

/** One cartridge board design (90 × 64 mm, edge fingers along the bottom). */
export function cartridge(spec: CartSpec): DeviceDef {
  const lock = spec.lockout;
  const save = spec.save;
  const parts: ComponentDef[] = [
    c('J1', 'J-EDGE6', 'EDGE', 45, 58, 0, { '5V': '5V', GND: 'GND', CE: 'CE', D0: 'D0', LKI: 'LKI', LKO: 'LKO' }, 'Edge connector (gold fingers)'),
    cx('U1', spec.romPart, 'ROM', 28, 16, 0, { VCC: '5V', GND: 'GND', CE: 'CE', DO: 'ROM_D' }, 'Game ROM'),
    c('R1', 'R-33R-1206', 'ROM', 50, 27, 90, { '1': 'ROM_D', '2': 'D0' }, 'Data-line resistor'),
    c('C1', 'C-100N', 'ROM', 48, 8, 0, { '1': '5V', '2': 'GND' }, 'ROM decoupling'),
    c('C2', 'C-10U-16E', 'ROM', 82, 54, 0, { '+': '5V', '-': 'GND' }, '5 V filter capacitor'),
    c('TP1', 'TP', 'ROM', 6, 6, 0, { '1': 'GND' }, 'Ground'),
    c('TP2', 'TP', 'ROM', 6, 50, 0, { '1': '5V' }, '5 V from the console'),
  ];
  if (lock) parts.push(cx('U2', 'U-LOCK-G', 'LOCK', 68, 12, 0, { VCC: '5V', GND: 'GND', KI: 'LKI', KO: 'LKO' }, 'Lockout chip'));
  else parts.push(c('R5', 'R-1K', 'LOCK', 68, 12, 0, { '1': 'LKI', '2': 'LKO' }, 'Lockout link (no lockout chip on this console)'));
  if (save)
    parts.push(
      cx('U3', 'U-SRAM8K', 'SAVE', 28, 36, 0, { VCC: 'VSAVE', GND: 'GND' }, 'Save RAM'),
      c('D1', 'D-SS14', 'SAVE', 54, 20, 0, { A: '5V', K: 'VSAVE' }, 'Save power from the console'),
      c('BT1', 'BT-CR2032T', 'SAVE', 68, 34, 0, { '+': 'BAT_P', '-': 'GND' }, 'Save battery (tabbed CR2032)'),
      c('R2', 'R-1K', 'SAVE', 72, 48, 0, { '1': 'BAT_P', '2': 'BAT_R' }, 'Battery feed resistor'),
      c('D2', 'D-SS14', 'SAVE', 60, 48, 180, { A: 'BAT_R', K: 'VSAVE' }, 'Save power from the battery'),
      c('TP3', 'TP', 'SAVE', 48, 40, 0, { '1': 'VSAVE' }, 'Save RAM supply'),
    );

  function functional(b: BoardState): FunctionalReport {
    b.attached = ['console'];
    const s = customerSession(b, { kind: 'adapter' });
    const op = s.settle();
    const r = cartReads(op);
    const boots = r.rom && r.lockout;
    let saveOk = true;
    if (save) {
      const off = s.setPower({ kind: 'off' });
      saveOk = off.net('VSAVE') >= 2 && b.comps.U3.part !== null && b.comps.U3.fault?.type !== 'dead';
    }
    s.end();
    const checks = [{ label: `Boots to the title screen in a ${spec.consoleName}`, ok: boots }];
    if (save) checks.push({ label: 'Keeps saved games with the console off', ok: saveOk });
    return { checks, facts: { boots, rom: r.rom, lockout: r.lockout, saveOk }, inputCurrent: op.srcI, events: s.events, passed: checks.every((x) => x.ok) && !s.events.length };
  }

  function complain(r: FunctionalReport, events: DamageEvent[], rng: Rng): string {
    const f = r.facts as Record<string, boolean>;
    if (!f.lockout) return 'The power light just blinks when this game is in.';
    if (!f.rom) return rng.pick(['Grey screen, every time.', 'It will not start — black screen.']);
    if (!f.saveOk) return 'It plays but never keeps my saves.';
    return events.length ? 'It got hot.' : 'Something is off with it.';
  }

  return device({
    id: spec.id,
    name: spec.name,
    category: 'Cartridge',
    tagline: `${spec.consoleName} game cartridge — same board under every label.`,
    width: 90,
    height: 64,
    blocks: [],
    outlines: [
      { name: 'ROM', x: 2, y: 2, w: 54, h: 26 },
      { name: save ? 'SAVE' : '', x: 2, y: 28, w: 86, h: 20 },
    ],
    parts,
    traces: [],
    testPoints: [
      { ref: 'TP1', net: 'GND', expected: '0 V' },
      { ref: 'TP2', net: '5V', expected: '5 V (in a console or on the bench supply)' },
      ...(save ? [{ ref: 'TP3', net: 'VSAVE', expected: '≈4.5 V powered, ≈2.5 V on the coin cell' }] : []),
    ],
    rails: [{ net: '5V', nominal: 5, label: '5V' }],
    nets: {
      GND: { desc: 'Ground', expected: 0 },
      '5V': { desc: '5 V from the console through the edge fingers', expected: 5, power: true },
      CE: { desc: 'ROM enable from the console (high = read the game)' },
      D0: { desc: 'Game data back to the console' },
      ROM_D: { desc: 'ROM data pin (before the series resistor)' },
      LKI: { desc: 'Lockout challenge from the console' },
      LKO: { desc: 'Lockout answer back to the console' },
      ...(save
        ? {
            VSAVE: { desc: 'Save RAM supply: from the console when on, from the coin cell when off', expected: 2.5 },
            BAT_P: { desc: 'Coin cell + (about 3 V)', expected: 3 },
            BAT_R: { desc: 'Coin cell feed after R2' },
          }
        : {}),
    },
    input: { ref: 'J1', plus: '5V', minus: 'GND', adapter: { v: 5, ilim: 1, rint: 0.05, label: `a ${spec.consoleName}` }, psuV: 5, psuI: 0.5 },
    ground: 'TP1',
    controls: [],
    externals: [consoleSlot('J1', `🕹 In a ${spec.consoleName}`)],
    ownerAttaches: ['console'],
    functional,
    complain,
    status(b, op) {
      if (!op || !b.attached.includes('console')) return [{ label: 'Console', value: 'not plugged in (attach it to see what a console reads)' }];
      const r = cartReads(op);
      return [
        { label: 'Console reads the game', value: r.rom ? 'yes' : 'no', ok: r.rom },
        { label: 'Lockout answers', value: r.lockout ? 'yes' : 'no', ok: r.lockout },
      ];
    },
    variants: cartVariants(spec),
    missable: ['C1'],
    carbonise: [['5V', 'GND', 'C2']],
    marketValue: Math.min(...spec.titles.map((t) => t.value)),
    quoteBase: spec.quoteBase,
    minReputation: spec.minReputation ?? 0,
    cartFor: spec.console,
    titles: spec.titles,
  });
}
