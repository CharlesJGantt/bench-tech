/**
 * Bintendo 64, Vega Exodus and Paltari Family Console (fictional), each with its cartridge
 * board. Built on the retro-console factory; each adds its own parts and faults.
 */
import { titlesOf } from '../games';
import { c } from '../board';
import type { Variant } from '../faults';
import { cartridge } from './retro';
import { retroConsole } from './retroconsole';

const b64Variants: Variant[] = [
  {
    id: 'no-jumper-pak',
    family: 'Missing part',
    tier: 1,
    weight: 1.3,
    apply(b) {
      b.comps.M1.part = null;
      return {
        summary: 'The jumper pak is missing from the memory expansion slot — without it (or an expansion pak) the console never draws a picture. Fit a jumper pak.',
        refs: ['M1'],
        hint: 'Light on, game in, black screen… Look at the expansion slot on top of the console. Is anything in it?',
        flavor: 'Bought it at a car-boot sale. Lights up but the TV stays black, whatever game I try.',
      };
    },
  },
  {
    id: 'reg33-dead',
    family: 'Failed regulator',
    tier: 2,
    weight: 0.8,
    apply(b) {
      b.comps.U6.fault = { type: 'dead' };
      return {
        summary: 'The 3.3 V regulator U6 for the reality chip has died: the CPU runs but the video chip has no power. Replace U6.',
        refs: ['U6'],
        hint: '5 V is fine and the light is on. Does every chip have its supply? The reality chip runs from 3.3 V.',
        flavor: 'The light comes on but the screen stays black.',
      };
    },
  },
];

export const B64 = retroConsole({
  id: 'b64',
  name: 'Bintendo 64',
  tagline: 'The 64-bit one with the jumper pak, four ports and a separate power brick.',
  volts: 12,
  connector: 'header',
  cpu: 'U-B64-CPU',
  video: 'U-B64-RCP',
  videoRail: '3V3',
  lockout: true,
  rf: false,
  av: true,
  ports: 2,
  cpuInputs: { RAMOK: 'RAMOK' },
  extras: [
    c('U6', 'U-HL33', 'CPU', 72, 38, 0, { IN: '5V', OUT: '3V3', GND: 'GND', TAB: '3V3' }, '3.3 V regulator (reality chip)'),
    c('C7', 'C-10U-6', 'CPU', 84, 38, 0, { '1': '3V3', '2': 'GND' }, '3.3 V capacitor'),
    c('TP6', 'TP', 'CPU', 66, 30, 0, { '1': '3V3' }, '3.3 V rail'),
    c('J8', 'J-EXP2', 'CPU', 136, 62, 0, { A: '3V3', B: 'RAMOK' }, 'Memory expansion slot'),
    c('M1', 'M-JUMPERPAK', 'CPU', 136, 46, 0, { A: 'M1_A', B: 'M1_B' }, 'Jumper pak', 'J8'),
    c('R8', 'R-10K', 'CPU', 124, 66, 0, { '1': 'RAMOK', '2': 'GND' }, 'Memory-OK pull-down'),
  ],
  extraNets: {
    '3V3': { desc: '3.3 V for the reality chip', expected: 3.3, power: true },
    RAMOK: { desc: 'Memory expansion present (jumper pak links it to 3.3 V)' },
  },
  extraVariants: b64Variants,
  marketValue: 75,
  quoteBase: 40,
  minReputation: 5,
});

export const B64_CART = cartridge({
  id: 'b64-cart',
  name: 'B64 Game Pak',
  console: 'b64',
  consoleName: 'Bintendo 64',
  romPart: 'U-ROM-B64',
  lockout: true,
  save: false,
  quoteBase: 18,
  minReputation: 5,
  titles: titlesOf('B64'),
});

export const VEGA = retroConsole({
  id: 'vega',
  name: 'Vega Exodus',
  tagline: '16-bit black box: blast processing, a headphone jack and a fussy adapter.',
  volts: 9,
  connector: 'barrel',
  reverse: true,
  cpu: 'U-VGA-CPU',
  video: 'U-VGA-VDP',
  lockout: false,
  rf: true,
  av: true,
  audio: 'U-VGA-AUD',
  ports: 2,
  marketValue: 55,
  quoteBase: 35,
  minReputation: 0,
});

export const VEGA_CART = cartridge({
  id: 'vega-cart',
  name: 'Vega Cartridge',
  console: 'vega',
  consoleName: 'Vega Exodus',
  romPart: 'U-ROM-VGA',
  lockout: false,
  save: true,
  quoteBase: 16,
  titles: titlesOf('VEGA'),
});

export const PALTARI = retroConsole({
  id: 'paltari',
  name: 'Paltari Family Console',
  tagline: 'Woodgrain, chunky switches, RF only — the one that started it all.',
  volts: 9,
  connector: 'barrel',
  cpu: 'U-PAL-CPU',
  video: 'U-PAL-TIA',
  lockout: false,
  rf: true,
  av: false,
  powerSwitch: true,
  ports: 2,
  marketValue: 60,
  quoteBase: 30,
  minReputation: 0,
});

export const PALTARI_CART = cartridge({
  id: 'paltari-cart',
  name: 'Paltari Cartridge',
  console: 'paltari',
  consoleName: 'Paltari Family Console',
  romPart: 'U-ROM-PAL',
  lockout: false,
  save: false,
  quoteBase: 12,
  titles: titlesOf('PALT'),
});

