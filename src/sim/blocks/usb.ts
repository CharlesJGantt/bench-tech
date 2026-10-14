/**
 * USB power blocks: the charging port, and a single-cell Li-ion charger with its battery.
 */
import { addMark } from '../faults';
import type { BlockDef, BlockPart, BlockVariant } from './core';

// ---------------------------------------------------------------------------
// USB input: port (micro-USB or USB-C) → optional fuse → surge clamp / input cap
// ---------------------------------------------------------------------------

export interface UsbInputOpts {
  connector: 'micro' | 'usbc';
  /** Input fuse part, if fitted. */
  fuse?: string;
  /** Surge clamp on VBUS (TVS part number). */
  tvs?: string;
  /** Input capacitor on VBUS. */
  cin?: string;
}

/** Ports: `out` (VBUS after the fuse). Locals: VIN (straight from the port), DM/DP or CC. */
export function usbInput(o: UsbInputOpts): BlockDef {
  const micro = o.connector === 'micro';
  const vbus = o.fuse ? 'VIN' : 'out';
  const parts: BlockPart[] = [
    {
      key: 'conn',
      partNo: micro ? 'J-MUSB' : 'J-USBC',
      at: [8, 3],
      pins: micro ? { VBUS: vbus, DM: 'DM', DP: 'DP', GND: 'GND', SHLD: 'GND' } : { VBUS: vbus, CC: 'CC', GND: 'GND', SHLD: 'GND' },
      role: micro ? 'Micro-USB charging port' : 'USB-C charging port',
    },
    { key: 'tp', partNo: 'TP', at: [10, 24], pins: { '1': 'out' }, role: 'USB 5 V' },
  ];
  if (o.fuse) parts.push({ key: 'fuse', partNo: o.fuse, at: [18, 7], pins: { '1': 'VIN', '2': 'out' }, role: 'USB input fuse' });
  if (o.tvs) parts.push({ key: 'tvs', partNo: o.tvs, at: [16, 11], rot: 270, pins: { A: 'GND', K: 'out' }, role: 'USB surge clamp' });
  if (o.cin) parts.push({ key: 'cin', partNo: o.cin, at: [22, 11], rot: 90, pins: { '1': 'out', '2': 'GND' }, role: 'USB input capacitor' });
  const kind = micro ? 'micro-USB' : 'USB-C';
  return {
    title: micro ? 'USB INPUT' : 'USB-C INPUT',
    size: [28, 28],
    ports: ['out'],
    parts,
    nets: {
      ...(o.fuse ? { VIN: { desc: `5 V straight from the ${kind} port`, expected: 5, power: true } } : {}),
      out: { desc: 'USB 5 V (VBUS) with the charger plugged in', expected: 5, power: true },
      ...(micro ? { DM: { desc: 'USB data −' }, DP: { desc: 'USB data +' } } : { CC: { desc: 'USB-C configuration pin (tells the charger what it is plugged into)' } }),
    },
    testPoints: [{ key: 'tp', expected: '5 V when the charger is plugged in' }],
    rails: [{ net: 'out', nominal: 5, label: 'VBUS' }],
    variants: [
      {
        id: 'usb-port-loose',
        family: 'Damaged connector',
        tier: 1,
        weight: 1,
        apply(b, _rng, ref) {
          const r = ref('conn');
          b.comps[r].fault = { type: 'pins-open', pins: ['VBUS'] };
          addMark(b, r, 'loose');
          return {
            summary: `The ${kind} port ${r} is worn loose inside — its power pin no longer touches the plug. Replace the port.`,
            refs: [r],
            hint: `The cable had to be held at an angle. Inspect the port ${r}, and check for 5 V on VBUS with the charger in.`,
            flavor: 'The charging cable only works if I hold it at an angle. Now it does not charge at all.',
          };
        },
      },
      {
        id: 'usb-port-joint',
        family: 'Cracked solder joint',
        tier: 1,
        weight: 0.8,
        apply(b, _rng, ref) {
          const r = ref('conn');
          b.comps[r].joints.VBUS = { r: Infinity, cracked: true };
          return {
            summary: `The VBUS joint of the ${kind} port ${r} cracked from cable strain. Reflow it.`,
            refs: [r],
            hint: `Ports take a lot of strain. Zoom in on the solder joints of ${r}.`,
          };
        },
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Li-ion charger + battery

const batteryWorn: BlockVariant = {
  id: 'battery-worn',
  family: 'Dead battery',
  tier: 1,
  weight: 1,
  apply(b, _rng, ref) {
    const r = ref('pack');
    b.comps[r].fault = { type: 'worn' };
    return {
      summary: `The battery ${r} is worn out: it reads well under 3.6 V and collapses under load. Fit a new pack (it plugs in).`,
      refs: [r],
      hint: 'Measure the battery itself: unplug it and check its voltage. A healthy single cell reads 3.7–4.2 V.',
      flavor: 'It dies after a few minutes even when fully charged.',
    };
  },
};
// ---------------------------------------------------------------------------

export interface ChargerOpts {
  /** Current-sense resistor between VBUS and the charger (with the input cap after it). */
  sense?: boolean;
  /** Charger input capacitor. */
  cin?: string;
  /** Battery-rail capacitor (default 10 µF 6.3 V). */
  cbat?: string;
  /** Red charge LED (VBUS → LED → STAT, lit while charging). */
  led?: boolean;
  /** Battery connector + plug-in Li-ion pack. */
  battery?: boolean;
}

/** Ports: `vin` (VBUS), `bat` (battery / system rail), `stat` (charge status, low while charging). */
export function liIonCharger(o: ChargerOpts): BlockDef {
  const supply = o.sense ? 'S' : 'vin';
  const parts: BlockPart[] = [
    { key: 'chg', partNo: 'U-TC41', at: [12, 10], pins: { VBUS: supply, GND: 'GND', BAT: 'bat', STAT: 'stat', NC5: 'NC5', NC6: 'NC6' }, role: 'Li-ion charger' },
    { key: 'cbat', partNo: o.cbat ?? 'C-10U-6', at: [18, 18], rot: 90, pins: { '1': 'bat', '2': 'GND' }, role: 'Battery capacitor' },
    { key: 'tp', partNo: 'TP', at: [22, 25], pins: { '1': 'bat' }, role: 'Battery rail' },
  ];
  if (o.sense) parts.push({ key: 'sense', partNo: 'R-0R05-1206', at: [2, 6], pins: { '1': 'vin', '2': 'S' }, role: 'Charge current-sense resistor' });
  if (o.cin) parts.push({ key: 'cin', partNo: o.cin, at: [6, 14], rot: 90, pins: { '1': supply, '2': 'GND' }, role: 'Charger input capacitor' });
  if (o.led)
    parts.push(
      { key: 'ledRes', partNo: 'R-1K', at: [2, 18], pins: { '1': 'vin', '2': 'LED' }, role: 'Charge LED resistor' },
      { key: 'led', partNo: 'LED-RED', at: [8, 18], pins: { A: 'LED', K: 'stat' }, role: 'Charge LED (on while charging)' },
    );
  if (o.battery)
    parts.push(
      { key: 'conn', partNo: 'J-JST2', at: [28, 4], pins: { '1': 'bat', '2': 'GND' }, role: 'Battery connector' },
      { key: 'pack', partNo: 'M-BATT-1S', at: [44, 16], pins: { '+': 'P', '-': 'N' }, role: 'Li-ion battery pack', mates: 'conn' },
    );
  return {
    title: 'CHARGER',
    size: [32, 28],
    ports: ['vin', 'bat', 'stat'],
    parts,
    nets: {
      ...(o.sense ? { S: { desc: 'VBUS after the current-sense resistor (charger input)', expected: 5, power: true } } : {}),
      bat: { desc: 'Battery / system rail', expected: 3.8, power: true },
      stat: { desc: 'Charger status — pulled low while charging' },
      ...(o.led ? { LED: { desc: 'Charge LED anode' } } : {}),
      NC5: { desc: 'Unused charger pin' },
      NC6: { desc: 'Unused charger pin' },
      P: { desc: 'Battery pack +' },
      N: { desc: 'Battery pack −' },
    },
    testPoints: [{ key: 'tp', expected: '3.7–4.2 V (battery)' }],
    rails: [{ net: 'bat', nominal: 3.8, label: 'BAT' }],
    variants: [
      {
        id: 'charger-dead',
        family: 'Failed charger IC',
        tier: 2,
        weight: 0.8,
        apply(b, _rng, ref) {
          const r = ref('chg');
          b.comps[r].fault = { type: 'dead' };
          return {
            summary: `Charger ${r} died: 5 V reaches it but it never charges the battery.`,
            refs: [r],
            hint: `With the charger plugged in: is there 5 V on ${r}'s input, and does the battery voltage rise? If 5 V arrives but nothing comes out, it is the chip.`,
            flavor: 'It will not charge any more. The light does not come on.',
          };
        },
      },
      ...(o.battery ? [batteryWorn] : []),
    ],
  };
}
