/**
 * Modern handhelds (fictional): Button Lite, Retrobit RB35, Rogue Pal and the DuoScreen
 * family. One factory, one board (160 × 100 mm): USB → charger → Li-ion pack → 3.3 V LDO
 * → main chip (power-button latch) → screen(s) on ribbons, speaker amp, buttons; options
 * for a game-card slot, sticks + trigger, a Wi-Fi board and a camera that must answer
 * before the main chip finishes booting, and the RB35's bias-resistor charger switch.
 */
import { device, place } from '../blocks/core';
import { liIonCharger, usbInput } from '../blocks/usb';
import { c, type ComponentDef, type DeviceDef, type FaceSpec } from '../board';
import type { EncItem, EnclosureDef } from '../enclosure';
import { customerSession, type BoardState, type DamageEvent, type FunctionalReport, type OperatingPoint } from '../circuit';
import { tarnish } from '../contacts';
import { addMark, liquidDamage, type Rng, type Variant } from '../faults';
import { cx, silk, testCart } from './retro';

/**
 * Physical form: board size, where each part sits (refs → [x, y, rot]), the block layouts
 * and the front face (screen windows, controls). Researched against the real-world shapes:
 * vertical "brick" (3.5" 4:3 screen on top, D-pad + ABXY below), wide (screen in the middle,
 * sticks/D-pad left, buttons right) and clamshell (two screens, hinge in between).
 */
export interface Form {
  width: number;
  height: number;
  screenPart: string;
  layout: Record<string, [number, number, number?]>;
  usb: Record<string, [number, number, number?]>;
  chg: Record<string, [number, number, number?]>;
  face: FaceSpec;
}

interface HandheldSpec {
  form: Form;
  /** Case colour, and whether the top screws are security (tri-wing) ones. */
  color: string;
  security?: boolean;
  id: string;
  name: string;
  tagline: string;
  soc: string;
  usb: 'usbc' | 'micro';
  screens: 1 | 2;
  cardSlot?: boolean;
  /** The games come on a microSD card (emulation handhelds) instead of game cards. */
  microSD?: boolean;
  sticks?: boolean;
  wifi?: boolean;
  camera?: boolean;
  /** RB35: the charger input goes through a P-FET held on by a bias resistor. */
  biasSwitch?: boolean;
  extraVariants?: (ids: { lcd: string[] }) => Variant[];
  marketValue: number;
  quoteBase: number;
  minReputation: number;
}


/** Vertical "brick" (RB35): 90 × 150 mm; 3.5" 4:3 screen on top, controls below, speaker + USB-C at the bottom. */
const VERTICAL: Form = {
  width: 90,
  height: 150,
  screenPart: 'M-HHLCD35',
  layout: {
    LCD1: [45, 34], J3: [45, 68], R10: [30, 50, 90],
    U2: [20, 16], C2: [34, 12, 90], TP2: [34, 22], TP1: [8, 104], J2: [9, 72, 90], F4: [9, 58, 90],
    U3: [50, 30], R1: [70, 14, 90], R2: [70, 24, 90], R3: [70, 34, 90], R15: [20, 40, 90], R16: [40, 48, 90],
    U4: [60, 50], R8: [72, 50, 90],
    SW11: [22, 78], SW12: [22, 94], SW13: [13, 86], SW14: [31, 86],
    SW8: [68, 78], SW9: [59, 86], SW2: [77, 86], SW10: [68, 94],
    SW1: [84, 108], R7: [76, 122, 90], D1: [84, 122, 90],
    J4: [24, 108], SPK1: [24, 128],
    Q1: [30, 104], R6: [30, 112, 90], R5: [36, 112, 90],
  },
  usb: { conn: [45, 145, 180], tvs: [58, 140, 270], tp: [32, 146] },
  chg: { chg: [66, 104], ledRes: [78, 140, 90], led: [70, 140, 90], cbat: [74, 100, 90], conn: [45, 110], pack: [52, 128], tp: [66, 112] },
  face: { windows: [[45, 34, 70, 52]], dpad: [22, 86], buttons: [[68, 78], [59, 86], [77, 86], [68, 94]], pills: [[38, 104], [52, 104]], grille: [24, 128] },
};

/** Wide handheld (Button Lite): 208 × 92 mm; 5.5" screen in the middle, stick + D-pad left, buttons + stick right. */
const WIDE_LITE: Form = {
  width: 208,
  height: 92,
  screenPart: 'M-HHLCDW',
  layout: {
    LCD1: [104, 46], J3: [60, 86], R10: [90, 60, 90],
    U2: [70, 20], C2: [80, 16, 90], TP2: [80, 26], TP1: [44, 88],
    U3: [104, 40], R1: [124, 20, 90], R2: [130, 20, 90], R3: [136, 20, 90], R15: [70, 40, 90], R16: [76, 40, 90],
    U4: [120, 60], R8: [132, 60, 90],
    STK1: [22, 22], SW11: [22, 50], SW12: [22, 66], SW13: [13, 58], SW14: [31, 58],
    SW8: [186, 14], SW9: [177, 22], SW2: [195, 22], SW10: [186, 30], STK2: [186, 52],
    SW5: [200, 86], R14: [204, 74, 90],
    SW1: [24, 6], R7: [40, 14, 90], D1: [40, 6, 90],
    J4: [168, 72], SPK1: [190, 78],
    J2: [140, 6],
  },
  usb: { conn: [104, 88, 180], tvs: [116, 84, 270], tp: [92, 88] },
  chg: { chg: [140, 84], ledRes: [148, 88, 90], led: [156, 88, 90], cbat: [132, 84, 90], conn: [42, 74], pack: [22, 80], tp: [126, 88] },
  face: { windows: [[104, 46, 110, 62]], sticks: [[22, 22], [186, 52]], dpad: [22, 58], buttons: [[186, 14], [177, 22], [195, 22], [186, 30]], pills: [[40, 40], [168, 40]], grille: [190, 78] },
};

/** Big wide handheld PC (Rogue Pal): 260 × 110 mm, sticks above the D-pad / buttons, shoulder trigger. */
const WIDE_PC: Form = {
  width: 260,
  height: 110,
  screenPart: 'M-HHLCDW',
  layout: {
    LCD1: [130, 52], J3: [100, 100], R10: [116, 70, 90],
    U2: [100, 26], C2: [110, 22, 90], TP2: [110, 32], TP1: [80, 104],
    U3: [130, 46], R1: [150, 26, 90], R2: [156, 26, 90], R3: [162, 26, 90], R15: [100, 46, 90], R16: [106, 46, 90],
    U4: [146, 70], R8: [158, 70, 90],
    STK1: [30, 26], SW11: [30, 58], SW12: [30, 74], SW13: [21, 66], SW14: [39, 66],
    SW8: [226, 22], SW9: [217, 30], SW2: [235, 30], SW10: [226, 38], STK2: [226, 66],
    SW5: [250, 8], R14: [254, 22, 90],
    SW1: [50, 8], R7: [62, 16, 90], D1: [62, 8, 90],
    J4: [206, 90], SPK1: [230, 94],
  },
  usb: { conn: [130, 104], tvs: [142, 100, 270], tp: [118, 104] },
  chg: { chg: [166, 98], ledRes: [174, 102, 90], led: [182, 102, 90], cbat: [158, 98, 90], conn: [60, 92], pack: [36, 96], tp: [166, 106] },
  face: { windows: [[130, 52, 110, 62]], sticks: [[30, 26], [226, 66]], dpad: [30, 66], buttons: [[226, 22], [217, 30], [235, 30], [226, 38]], pills: [[64, 48], [196, 48]], grille: [230, 94] },
};

/** Clamshell, opened flat (DuoScreen): 150 × 175 mm; top screen, hinge, bottom screen with controls either side. */
const CLAMSHELL: Form = {
  width: 150,
  height: 175,
  screenPart: 'M-HHLCD35',
  layout: {
    LCD1: [75, 38], J3: [40, 80], R10: [50, 50, 90],
    LCD2: [75, 125], J5: [110, 80], R11: [50, 56, 90],
    U2: [60, 20], C2: [70, 16, 90], TP2: [70, 26], TP1: [8, 80],
    U3: [90, 30], R1: [90, 110, 90], R2: [96, 110, 90], R3: [102, 110, 90], R15: [60, 40, 90], R16: [66, 40, 90],
    U4: [100, 40], R8: [106, 46, 90],
    SW11: [18, 104], SW12: [18, 120], SW13: [9, 112], SW14: [27, 112],
    SW8: [132, 104], SW9: [123, 112], SW2: [141, 112], SW10: [132, 120],
    SW1: [18, 140], D1: [30, 140, 90], R7: [36, 140, 90],
    J4: [130, 52], SPK1: [130, 30],
    J8: [19, 46], WIFI1: [19, 30], R12: [19, 56, 90],
    J9: [95, 72], CAM1: [75, 82], R13: [100, 84, 90],
    J2: [75, 166],
  },
  usb: { conn: [130, 165], tvs: [140, 160, 270], tp: [120, 170] },
  chg: { chg: [130, 140], ledRes: [146, 146, 90], led: [146, 154, 90], cbat: [138, 140, 90], conn: [44, 156], pack: [22, 163], tp: [124, 148] },
  face: { hinge: 82, windows: [[75, 38, 70, 52], [75, 125, 70, 52]], dpad: [18, 112], buttons: [[132, 104], [123, 112], [141, 112], [132, 120]], pills: [[132, 136], [132, 146]], grille: [130, 30] },
};

function handheld(sp: HandheldSpec): DeviceDef {
  const TW = sp.form.width;
  const TH = sp.form.height;
  const okPins = { OK1: '3V3', OK2: '3V3', OK3: '3V3', OK4: '3V3' } as Record<string, string>;
  const lcds = sp.screens === 2 ? ['LCD1', 'LCD2'] : ['LCD1'];
  okPins.OK1 = 'OK_LCD1';
  if (sp.screens === 2) okPins.OK2 = 'OK_LCD2';
  if (sp.wifi) okPins.OK3 = 'OK_WIFI';
  if (sp.camera) okPins.OK4 = 'OK_CAM';
  const chgIn = sp.biasSwitch ? 'CHG_IN' : 'VBUS';

  const parts: ComponentDef[] = [
    c('U2', 'U-HL33', 'POWER', 60, 10, 0, { IN: 'BAT', OUT: '3V3', GND: 'GND', TAB: '3V3' }, '3.3 V regulator'),
    c('C2', 'C-10U-6', 'POWER', 70, 18, 90, { '1': '3V3', '2': 'GND' }, '3.3 V capacitor'),
    c('TP1', 'TP', 'POWER', 4, 30, 0, { '1': 'GND' }, 'Ground'),
    c('TP2', 'TP', 'POWER', 58, 22, 0, { '1': '3V3' }, '3.3 V rail'),
    cx('U3', sp.soc, 'SOC', 62, 36, 0, { VDD: '3V3', GND: 'GND', PWR: 'PWR', BA: 'BA', BB: 'BB', DP: 'DPAD', DIN: 'DIN', LED: 'LED_IO', VEN: 'LCD_D', SND: 'SND', EN: 'MOD_EN', CE: 'CE', ...okPins }, 'Main chip'),
    // D-pad (four dome switches under one cap) and the other face buttons
    c('SW11', 'SW-TACT', 'BUTTONS', 0, 0, 0, { '1': 'DPAD', '2': 'GND' }, 'D-pad up'),
    c('SW12', 'SW-TACT', 'BUTTONS', 0, 0, 0, { '1': 'DPAD', '2': 'GND' }, 'D-pad down'),
    c('SW13', 'SW-TACT', 'BUTTONS', 0, 0, 0, { '1': 'DPAD', '2': 'GND' }, 'D-pad left'),
    c('SW14', 'SW-TACT', 'BUTTONS', 0, 0, 0, { '1': 'DPAD', '2': 'GND' }, 'D-pad right'),
    c('R15', 'R-10K', 'BUTTONS', 0, 0, 90, { '1': '3V3', '2': 'DPAD' }, 'D-pad pull-up'),
    c('SW8', 'SW-TACT', 'BUTTONS', 0, 0, 0, { '1': 'BB', '2': 'GND' }, 'X button'),
    c('SW9', 'SW-TACT', 'BUTTONS', 0, 0, 0, { '1': 'BB', '2': 'GND' }, 'Y button'),
    c('SW10', 'SW-TACT', 'BUTTONS', 0, 0, 0, { '1': 'BB', '2': 'GND' }, 'B button'),
    c('R16', 'R-10K', 'BUTTONS', 0, 0, 90, { '1': '3V3', '2': 'BB' }, 'Face-button pull-up'),
    c('SW1', 'SW-TACT', 'BUTTONS', 140, 12, 0, { '1': 'PWR', '2': 'GND' }, 'Power button'),
    c('R1', 'R-10K', 'BUTTONS', 128, 20, 90, { '1': '3V3', '2': 'PWR' }, 'Power button pull-up'),
    c('SW2', 'SW-TACT', 'BUTTONS', 140, 34, 0, { '1': 'BA', '2': 'GND' }, 'A button'),
    c('R2', 'R-10K', 'BUTTONS', 128, 34, 90, { '1': '3V3', '2': 'BA' }, 'A button pull-up'),
    c('R7', 'R-220R', 'BUTTONS', 150, 46, 90, { '1': 'LED_IO', '2': 'LED_A' }, 'Power light resistor'),
    c('D1', 'LED-GRN', 'BUTTONS', 150, 54, 90, { A: 'LED_A', K: 'GND' }, 'Power light'),
    cx('U4', 'U-SA8002', 'AUDIO', 100, 48, 0, { VDD: 'BAT', GND: 'GND', EN: 'SND', OUTP: 'SPK_P', OUTN: 'SPK_N' }, 'Speaker amp'),
    c('R8', 'R-100K', 'AUDIO', 88, 48, 90, { '1': 'SND', '2': 'GND' }, 'Amp enable pull-down'),
    c('J4', 'J-JST2', 'AUDIO', 116, 62, 0, { '1': 'SPK_P', '2': 'SPK_N' }, 'Speaker connector'),
    c('SPK1', 'M-SPK4', 'AUDIO', 134, 82, 0, { '1': 'SPK1_A', '2': 'SPK1_B' }, 'Speaker', 'J4'),
    c('J3', 'J-FPC-LCD', 'SCREEN', 40, 46, 0, { VCC: '3V3', DATA: 'LCD_D', OK: 'OK_LCD1', GND: 'GND' }, sp.screens === 2 ? 'Top screen ribbon connector' : 'Screen ribbon connector'),
    c('LCD1', sp.form.screenPart, 'SCREEN', 30, 78, 0, { VCC: 'LCD1_VCC', DATA: 'LCD1_DATA', OK: 'LCD1_OK', GND: 'LCD1_GND' }, sp.screens === 2 ? 'Top screen' : 'Screen', 'J3'),
    c('R10', 'R-100K', 'SCREEN', 52, 50, 90, { '1': 'OK_LCD1', '2': 'GND' }, 'Screen-OK pull-down'),
  ];
  if (sp.screens === 2)
    parts.push(
      c('J5', 'J-FPC-LCD', 'SCREEN', 76, 64, 0, { VCC: '3V3', DATA: 'LCD_D', OK: 'OK_LCD2', GND: 'GND' }, 'Bottom screen ribbon connector'),
      c('LCD2', sp.form.screenPart, 'SCREEN', 84, 86, 0, { VCC: 'LCD2_VCC', DATA: 'LCD2_DATA', OK: 'LCD2_OK', GND: 'LCD2_GND' }, 'Bottom screen', 'J5'),
      c('R11', 'R-100K', 'SCREEN', 66, 64, 90, { '1': 'OK_LCD2', '2': 'GND' }, 'Bottom-screen-OK pull-down'),
    );
  if (sp.wifi)
    parts.push(
      c('J8', 'J-FPC-MOD', 'BOARDS', 100, 24, 0, { VCC: '3V3', EN: 'MOD_EN', OK: 'OK_WIFI', GND: 'GND' }, 'Wi-Fi board connector'),
      c('WIFI1', 'M-WIFIB', 'BOARDS', 104, 34, 0, { VCC: 'WIFI1_VCC', EN: 'WIFI1_EN', OK: 'WIFI1_OK', GND: 'WIFI1_GND' }, 'Wi-Fi board', 'J8'),
      c('R12', 'R-100K', 'BOARDS', 90, 30, 90, { '1': 'OK_WIFI', '2': 'GND' }, 'Wi-Fi-OK pull-down'),
    );
  if (sp.camera)
    parts.push(
      c('J9', 'J-FPC-MOD', 'BOARDS', 120, 44, 0, { VCC: '3V3', EN: 'MOD_EN', OK: 'OK_CAM', GND: 'GND' }, 'Camera ribbon connector'),
      c('CAM1', 'M-CAM', 'BOARDS', 120, 92, 0, { VCC: 'CAM1_VCC', EN: 'CAM1_EN', OK: 'CAM1_OK', GND: 'CAM1_GND' }, 'Camera + ribbon', 'J9'),
      c('R13', 'R-100K', 'BOARDS', 110, 40, 90, { '1': '3V3', '2': 'OK_CAM' }, 'Camera-OK pull-up (no camera = fine)'),
    );
  if (sp.cardSlot)
    parts.push(
      c('J2', sp.microSD ? 'J-TFSLOT' : 'J-SLOT6', 'CARD', 100, 8, 0, { '5V': sp.microSD ? 'CARD_V' : '3V3', GND: 'GND', CE: 'CE', D0: 'DIN', LKI: 'CARD_LKI', LKO: 'CARD_LKO' }, sp.microSD ? 'microSD games slot' : 'Game card slot'),
      c('R3', 'R-10K', 'CARD', 82, 24, 90, { '1': 'DIN', '2': 'GND' }, 'Card data pull-down'),
      ...(sp.microSD ? [c('F4', 'F-POLY05', 'CARD', 0, 0, 0, { '1': '3V3', '2': 'CARD_V' }, 'microSD slot resettable fuse (PPTC)')] : []),
    );
  else parts.push(c('R3', 'R-10K', 'CARD', 82, 24, 90, { '1': '3V3', '2': 'DIN' }, 'Data tie-high (no card slot)'));
  if (sp.sticks)
    parts.push(
      cx('STK1', 'M-STICK', 'STICKS', 90, 74, 0, { VCC: '3V3', GND: 'GND', X: 'STK1_X', Y: 'STK1_Y' }, 'Left stick'),
      cx('STK2', 'M-STICK', 'STICKS', 140, 30, 0, { VCC: '3V3', GND: 'GND', X: 'STK2_X', Y: 'STK2_Y' }, 'Right stick'),
      c('SW5', 'SW-TRIG', 'STICKS', 150, 74, 0, { '1': 'TRIG', '2': 'GND' }, 'Trigger (switch + spring)'),
      c('R14', 'R-10K', 'STICKS', 150, 64, 90, { '1': '3V3', '2': 'TRIG' }, 'Trigger pull-up'),
    );
  if (sp.biasSwitch)
    parts.push(
      c('Q1', 'Q-PFET', 'POWER', 24, 8, 0, { S: 'VBUS', D: 'CHG_IN', G: 'Q1_G' }, 'Charger input switch (P-FET)'),
      c('R6', 'R-4K7', 'POWER', 22, 18, 90, { '1': 'VBUS', '2': 'Q1_G' }, 'Switch gate pull-up'),
      c('R5', 'R-2K2', 'POWER', 28, 18, 90, { '1': 'Q1_G', '2': 'GND' }, 'Switch bias resistor'),
    );
  silk(parts, {
    U3: 'CPU', SW1: 'POWER', SW2: 'A', SW10: 'B', SW8: 'X', SW9: 'Y', SW11: 'UP', SW12: 'DOWN', SW13: 'LEFT', SW14: 'RIGHT',
    SW5: 'TRIG', STK1: 'L-STICK', STK2: 'R-STICK', J2: sp.microSD ? 'microSD' : 'GAME CARD', J3: sp.screens === 2 ? 'TOP LCD' : 'LCD', J5: 'BOTTOM LCD',
    J8: 'WIFI', J9: 'CAMERA', J4: 'SPEAKER', U2: '3.3V REG', U4: 'AMP',
  });
  // Place everything where the real thing has it
  for (const p of parts) {
    const at = sp.form.layout[p.ref];
    if (!at) throw new Error(`${sp.id}: no position for ${p.ref} in its form layout`);
    p.x = at[0];
    p.y = at[1];
    p.rot = (at[2] ?? 0) as ComponentDef['rot'];
  }

  const variants: Variant[] = [
    {
      id: 'screen-ribbon',
      family: 'Cracked solder joint',
      tier: 2,
      weight: 0.8,
      apply(b) {
        b.comps.J3.joints.DATA = { r: Infinity, cracked: true };
        return { summary: 'The screen ribbon connector J3 has a cracked joint on the picture-data pin: it boots (sound, light) but the screen stays blank. Reflow J3.', refs: ['J3'], hint: 'Sound and light but no picture. Follow the picture data from the main chip to the screen connector.', flavor: 'I can hear it start, but the screen is black.' };
      },
    },
    {
      id: 'speaker-dead',
      family: 'Blown speaker',
      tier: 1,
      weight: 0.8,
      apply(b) {
        b.comps.SPK1.fault = { type: 'open' };
        return { summary: 'The speaker is open circuit. Fit a new speaker.', refs: ['SPK1'], hint: 'Unplug the speaker and measure it (≈4 Ω).', flavor: 'No sound any more.' };
      },
    },
    {
      id: 'button-worn',
      family: 'Worn membrane',
      tier: 1,
      weight: 0.8,
      apply(b) {
        b.comps.SW2.fault = { type: 'open' };
        return { summary: 'The A button contact is worn out. Replace it.', refs: ['SW2'], hint: 'Press A and measure its line: it should drop to 0 V.', flavor: 'The A button does nothing.' };
      },
    },
    {
      id: 'liquid-buttons',
      family: 'Liquid damage',
      tier: 2,
      weight: 0.6,
      apply(b, rng) {
        liquidDamage(b, rng, ['SW2', 'R2'], 0.35, 0.5);
        b.comps.SW2.corr!.pins['1'] = 0.97;
        return { summary: 'A spill corroded the button area: the crust has eaten through the A button joint. Clean the corrosion (cleaner, scrub, IPA).', refs: ['SW2'], hint: 'Sticky buttons, one dead. Look for crust under the buttons.', flavor: 'Spilled juice on it. Now a button is dead and others are sticky.' };
      },
    },
    ...(sp.cardSlot
      ? [
          {
            id: 'card-slot',
            family: 'Dirty contacts',
            tier: 1,
            weight: 1,
            apply(b: BoardState, rng: Rng) {
              tarnish(b, 'J2', rng.range(0.5, 0.75), () => rng.next());
              b.comps.J2.oxide!.D0 = 0.95;
              return sp.microSD
                ? { summary: 'The microSD slot contacts are tarnished: the games card is never read. Scrub the slot contacts and Pad-Bright them.', refs: ['J2'], hint: 'It boots to an error. Is the card being read at all? Look at the slot contacts.', flavor: 'It says “no games found” even with a fresh card.' }
                : { summary: 'The game-card slot contacts are tarnished: no card reads. Scrub the slot contacts and Pad-Bright them.', refs: ['J2'], hint: 'Every game card fails? Look at the card slot contacts.', flavor: 'It says “cannot read the game card” with every card.' };
            },
          } as Variant,
        ]
      : []),
    ...(sp.sticks
      ? [
          {
            id: 'stick-drift',
            family: 'Stick drift',
            tier: 1,
            weight: 1.6,
            apply(b: BoardState, rng: Rng) {
              const ref = rng.pick(['STK1', 'STK2']);
              b.comps[ref].fault = { type: 'drift', axis: rng.pick(['X', 'Y'] as const), pos: rng.range(0.15, 0.3) };
              return { summary: `The ${ref === 'STK1' ? 'left' : 'right'} stick drifts: a worn potentiometer. Replace the stick.`, refs: [ref], hint: 'Measure each stick output with it centred: half the supply.', flavor: 'The camera keeps spinning on its own.' };
            },
          } as Variant,
          {
            id: 'trigger-spring',
            family: 'Broken spring',
            tier: 1,
            weight: 0.8,
            apply(b: BoardState) {
              b.comps.SW5.fault = { type: 'short', r: 0.2 };
              return { summary: 'The trigger spring is broken, so the trigger reads as held down. Replace the trigger mechanism.', refs: ['SW5'], hint: 'Is the trigger line low when nothing touches it?', flavor: 'The trigger feels spongy and fires by itself.' };
            },
          } as Variant,
        ]
      : []),
    ...(sp.extraVariants?.({ lcd: lcds }) ?? []),
  ];

  const lcdOk = (b: BoardState, op: OperatingPoint, ref: string) =>
    !!b.comps[ref].part && !b.comps[ref].unplugged && b.comps[ref].fault?.type !== 'dead' && op.at({ ref, pin: 'VCC' }) - op.at({ ref, pin: 'GND' }) > 2.6 && op.at({ ref, pin: 'DATA' }) - op.at({ ref, pin: 'GND' }) > 1.5;
  const state = (b: BoardState, op: OperatingPoint) => ({
    on: op.current('D1') > 3e-4,
    picture: lcds.every((r) => lcdOk(b, op, r)),
    sound: Math.abs(op.current('SPK1')) > 0.03,
    card: !sp.cardSlot || op.net('DIN') > 1.6,
    centred: !sp.sticks || ['STK1_X', 'STK1_Y', 'STK2_X', 'STK2_Y'].every((n) => Math.abs(op.net(n) / Math.max(0.5, op.net('3V3')) - 0.5) < 0.08),
    trigger: !sp.sticks || op.net('TRIG') > 1.6,
  });

  function functional(b: BoardState): FunctionalReport {
    b.attached = sp.cardSlot ? ['cart'] : [];
    const s = customerSession(b, { kind: 'off' });
    s.settle();
    s.press('SW1');
    const op = s.settle();
    const st = state(b, op);
    b.pressed = ['SW2'];
    const pa = s.settle();
    const aWorks = pa.net('BA') < 1 && pa.net('3V3') > 3;
    b.pressed = [];
    const op2 = s.setPower({ kind: 'adapter' });
    const charging = op2.current('D5') > 5e-4;
    s.end();
    const checks = [
      { label: 'Turns on (power light)', ok: st.on },
      { label: sp.screens === 2 ? 'Picture on both screens' : 'Picture on the screen', ok: st.picture },
      { label: 'Sound', ok: st.sound },
      { label: 'Buttons work', ok: aWorks && st.trigger },
      ...(sp.cardSlot ? [{ label: sp.microSD ? 'Loads games from the microSD card' : 'Reads a game card', ok: st.card }] : []),
      ...(sp.sticks ? [{ label: 'Sticks rest centred', ok: st.centred }] : []),
      { label: 'Charges', ok: charging },
    ];
    return { checks, facts: { ...st, buttons: aWorks, charging }, inputCurrent: op.srcI, events: s.events, passed: checks.every((x) => x.ok) && !s.events.length };
  }

  function complain(r: FunctionalReport, events: DamageEvent[], rng: Rng): string {
    const f = r.facts as Record<string, boolean>;
    const hot = events.length ? ' It got hot.' : '';
    if (!f.on) return rng.pick(['Completely dead.', 'Will not turn on, even plugged in.']) + hot;
    if (!f.picture) return (sp.screens === 2 ? 'The light comes on but both screens stay black.' : 'Lights up but the screen stays black.') + hot;
    if (!f.sound) return 'No sound.' + hot;
    if (!f.charging) return 'It will not charge.' + hot;
    if (!f.card) return 'It will not read games.' + hot;
    if (!f.centred) return 'The stick drifts.' + hot;
    if (!f.buttons || !f.trigger) return 'A button is not working right.' + hot;
    return 'Something is off.' + hot;
  }

  const dev = device({
    id: sp.id,
    name: sp.name,
    category: 'Handheld',
    tagline: sp.tagline,
    width: TW,
    height: TH,
    blocks: [
      place('USB', usbInput({ connector: sp.usb, tvs: 'D-TVS5' }), [2, 2], { out: 'VBUS' }, { conn: 'J6', tvs: 'D6', tp: 'TP6' }, { faults: true, outline: null, layout: sp.form.usb as never }),
      place('CHG', liIonCharger({ led: true, battery: true }), [30, 2], { vin: chgIn, bat: 'BAT', stat: 'CHG' }, { chg: 'U5', ledRes: 'R9', led: 'D5', cbat: 'C5', conn: 'J1', pack: 'BT1', tp: 'TP5' }, {
        faults: true,
        outline: null,
        layout: sp.form.chg as never,
      }),
    ],
    outlines: [],
    face: sp.form.face,
    parts,
    traces: [],
    testPoints: [
      { ref: 'TP1', net: 'GND', expected: '0 V' },
      { ref: 'TP2', net: '3V3', expected: '3.3 V' },
    ],
    rails: [
      { net: 'BAT', nominal: 3.8, label: 'BAT' },
      { net: '3V3', nominal: 3.3, label: '3V3' },
    ],
    nets: {
      GND: { desc: 'Ground', expected: 0 },
      '3V3': { desc: '3.3 V logic rail', expected: 3.3, power: true },
      ...(sp.microSD ? { CARD_V: { desc: 'microSD slot supply: 3.3 V through its resettable fuse (PPTC)', expected: 3.3, power: true } } : {}),
      PWR: { desc: 'Power button (low when pressed)' },
      BA: { desc: 'A button (low when pressed)' },
      BB: { desc: 'B / X / Y buttons (low when pressed)' },
      DPAD: { desc: 'D-pad (low when any direction is pressed)' },
      LCD_D: { desc: 'Picture data to the screen(s)' },
      SND: { desc: 'Speaker amp enable' },
      MOD_EN: { desc: 'Enable for the plug-in boards' },
      OK_LCD1: { desc: 'Screen reports OK (high)' },
      ...(sp.screens === 2 ? { OK_LCD2: { desc: 'Bottom screen reports OK (high)' } } : {}),
      ...(sp.wifi ? { OK_WIFI: { desc: 'Wi-Fi board reports OK (high)' } } : {}),
      ...(sp.camera ? { OK_CAM: { desc: 'Camera ready (high; pulled up if no camera)' } } : {}),
      ...(sp.biasSwitch ? { CHG_IN: { desc: 'Charger input after the P-FET switch', expected: 5, power: true }, Q1_G: { desc: 'Switch gate: must be pulled well below 5 V for the switch to turn on' } } : {}),
    },
    input: { ref: 'J6', plus: 'VBUS', minus: 'GND', adapter: { v: 5.1, ilim: 1.5, rint: 0.15, label: "the owner's charger" }, psuV: 5, psuI: 1 },
    ground: 'TP1',
    controls: [
      { ref: 'SW1', label: 'Power button' },
      { ref: 'SW2', label: 'A' },
    ],
    firmware: {
      ref: 'U3',
      vmin: 2.9,
      vmax: 3.6,
      inputs: ['PWR', 'BA', 'DIN', 'OK1', 'OK2', 'OK3', 'OK4'],
      boot: () => ({ on: 0 }),
      step(state, inputs, prev) {
        if (!inputs.PWR && prev.PWR) state.on = state.on ? 0 : 1;
        const on = state.on === 1;
        const booted = on && inputs.OK1 && inputs.OK2 && inputs.OK3 && inputs.OK4;
        return { LED: on, EN: on, CE: on, VEN: booted, SND: booted };
      },
    },
    externals: sp.cardSlot ? [testCart('J2', sp.microSD ? '💾 microSD card with games' : '🎮 Game card (known good)', 2.4)] : [],
    ownerAttaches: sp.cardSlot ? ['cart'] : [],
    functional,
    complain,
    status(b, op) {
      if (!op) return [];
      const st = state(b, op);
      return [
        { label: 'Power light', value: st.on ? 'on' : 'off', ok: st.on },
        { label: sp.screens === 2 ? 'Screens' : 'Screen', value: st.picture ? 'picture' : 'black', ok: st.picture },
        { label: 'Sound', value: st.sound ? 'playing' : 'silent', ok: st.sound },
        ...(sp.cardSlot ? [{ label: sp.microSD ? 'microSD card' : 'Game card', value: st.card ? 'reads' : b.attached.includes('cart') ? 'not read' : 'none in', ok: st.card }] : []),
      ];
    },
    variants,
    missable: ['C2', 'TP2'],
    carbonise: [['3V3', 'GND', 'C2']],
    marketValue: sp.marketValue,
    quoteBase: sp.quoteBase,
    minReputation: sp.minReputation,
  });
  dev.enclosure = handheldCase(dev, sp);
  return dev;
}

/** The case, generated from the real board: corner screws, back shell, cables on their connectors. */
function handheldCase(dev: DeviceDef, sp: HandheldSpec): EnclosureDef {
  const at = (ref: string): [number, number] => {
    const c = dev.components.find((x) => x.ref === ref)!;
    return [c.x, c.y];
  };
  const W = dev.width;
  const H = dev.height;
  const sec = sp.security ?? false;
  const screw = (id: string, label: string, p: [number, number], len: number, punch?: [string, string]): EncItem => ({ id, kind: 'screw', label, at: p, screw: { length: len, hole: len }, security: sec && id <= 's2', ...(punch ? { punch } : {}) });
  const items: EncItem[] = [
    screw('s1', 'Back screw (top left)', [4, 4], 4),
    screw('s2', 'Back screw (top right)', [W - 4, 4], 4),
    screw('s3', 'Back screw (bottom left)', [4, H - 4], 6),
    screw('s4', 'Back screw (bottom right)', [W - 4, H - 4], 3, ['3V3', 'GND']),
    { id: 'back', kind: 'clips', label: 'Back shell', at: [W / 2, H / 2], size: [W, H], needs: ['s1', 's2', 's3', 's4'], covers: true },
    { id: 'bat', kind: 'cable', label: 'Battery plug', at: at('J1'), module: 'BT1', needs: ['back'] },
    { id: 'lcd', kind: 'cable', label: sp.screens === 2 ? 'Top screen ribbon' : 'Screen ribbon', at: at('J3'), module: 'LCD1', latch: true, needs: ['back'] },
    { id: 'spk', kind: 'cable', label: 'Speaker plug', at: at('J4'), module: 'SPK1', needs: ['back'] },
  ];
  if (sp.screens === 2) items.push({ id: 'lcd2', kind: 'cable', label: 'Bottom screen ribbon', at: at('J5'), module: 'LCD2', latch: true, needs: ['back'] });
  return { color: sp.color, items };
}

export const BUTTON_LITE = handheld({
  color: '#d9c84a',
  security: true,
  form: WIDE_LITE,
  sticks: true,
  id: 'button-lite',
  name: 'Button Lite',
  tagline: 'The handheld-only Button: corroded backlight connectors and drifting… everything.',
  soc: 'U-BTL-SOC',
  usb: 'usbc',
  screens: 1,
  cardSlot: true,
  extraVariants: () => [
    {
      id: 'screen-conn-short',
      family: 'Liquid damage',
      tier: 2,
      weight: 1.2,
      apply(b, rng) {
        liquidDamage(b, rng, ['J3'], 0.35, 0.5);
        b.jumpers.push({ id: b.nextJumperId++, a: { ref: 'J3', pin: 'VCC' }, b: { ref: 'J3', pin: 'GND' }, cold: false, bridge: true });
        return {
          summary: 'Liquid got into the screen connector J3: corrosion grew a bridge from its supply pin to ground, shorting the 3.3 V rail — it tries to boot over and over. Clean the corrosion and wick away the bridge (or replace J3).',
          refs: ['J3'],
          hint: 'It draws current in bursts and never starts. Unplug the screen: still shorted? Then the short is on the board side — look at the screen connector.',
          flavor: 'It sat in a damp bag. The charge light flickers and it never turns on.',
        };
      },
    },
  ],
  marketValue: 90,
  quoteBase: 40,
  minReputation: 8,
});

export const RB35 = handheld({
  cardSlot: true,
  microSD: true,
  color: '#7a5fb3',
  form: VERTICAL,
  id: 'rb35',
  name: 'Retrobit RB35',
  tagline: 'Cheap emulation handheld: a charger switch held on by one tiny resistor.',
  soc: 'U-RB35-SOC',
  usb: 'usbc',
  screens: 1,
  biasSwitch: true,
  extraVariants: () => [
    {
      id: 'bias-missing',
      family: 'Missing part',
      tier: 2,
      weight: 1.6,
      apply(b) {
        b.comps.R5.part = null;
        addMark(b, 'R5', 'scorch');
        return {
          summary: 'The charger-switch bias resistor R5 is missing (burnt off, probably by a fast charger), so the P-FET never turns on and it never charges. Its value is not on the board: try values from the resistor drawer — 10k does nothing, around 2.2k–3k works.',
          refs: ['R5'],
          hint: 'USB meter shows 0 A. 5 V reaches the switch FET but nothing comes out. What holds its gate low? Look closely at the empty pads next to it.',
          flavor: 'Brand new, will not charge at all.',
        };
      },
    },
    {
      id: 'usb-corroded',
      family: 'Liquid damage',
      tier: 1,
      weight: 0.8,
      apply(b, rng) {
        liquidDamage(b, rng, ['J6'], 0.35, 0.5);
        b.comps.J6.corr!.pins.VBUS = 0.97;
        return { summary: 'The USB-C port is corroded and the crust has eaten through its power pin joint. Clean the corrosion (cleaner, scrub, IPA).', refs: ['J6'], hint: 'Nothing gets past the USB port pins. Look at the port joints.', flavor: 'It got wet at the beach. Will not charge.' };
      },
    },
  ],
  marketValue: 45,
  quoteBase: 25,
  minReputation: 0,
});

export const ROGUE_PAL = handheld({
  color: '#2b2b2b',
  form: WIDE_PC,
  id: 'rogue-pal',
  name: 'Rogue Pal',
  tagline: 'Handheld gaming PC: drifting sticks, flat batteries, fragile triggers.',
  soc: 'U-RP-APU',
  usb: 'usbc',
  screens: 1,
  sticks: true,
  extraVariants: () => [
    {
      id: 'screen-dead',
      family: 'Dead screen',
      tier: 1,
      weight: 1,
      apply(b) {
        b.comps.LCD1.fault = { type: 'dead' };
        return { summary: 'The screen module has died, and the main chip refuses to finish booting without it. Fit a new screen module.', refs: ['LCD1'], hint: 'Boot sound? No — and it never starts. Does the screen report OK to the main chip?', flavor: 'Dropped it. Now nothing shows and it does not start.' };
      },
    },
    {
      id: 'battery-flat',
      family: 'Dead battery',
      tier: 1,
      weight: 0.9,
      apply(b) {
        b.comps.BT1.fault = { type: 'open' };
        return { summary: 'The battery pack is dead (0 V, not detected). Fit a new battery pack.', refs: ['BT1'], hint: 'Unplug the battery and measure it.', flavor: 'Orange light when charging, then nothing. Seller said "ghost touch".' };
      },
    },
  ],
  marketValue: 260,
  quoteBase: 60,
  minReputation: 15,
});

const duoVariants = (model: 'ixl' | '3dxl' | 'lite') => (): Variant[] => {
  const v: Variant[] = [];
  if (model === 'ixl')
    v.push(
      {
        id: 'top-screen-dead',
        family: 'Dead screen',
        tier: 2,
        weight: 1.2,
        apply(b) {
          b.comps.LCD1.fault = { type: 'dead' };
          return { summary: 'The top screen has died — and the DuoScreen will not boot at all without it. Replace the top screen.', refs: ['LCD1'], hint: 'Swap the cheap suspects first: power board, Wi-Fi board, bottom screen, top screen. Which OK line stays low?', flavor: 'Completely dead — not even the bottom screen comes on.' };
        },
      },
      {
        id: 'wifi-board-dead',
        family: 'Failed board',
        tier: 2,
        weight: 1,
        apply(b) {
          b.comps.WIFI1.fault = { type: 'dead' };
          return { summary: 'The Wi-Fi board has died and the main chip waits for it forever. Replace the Wi-Fi board.', refs: ['WIFI1'], hint: 'Power light on, both screens black. Check each OK line into the main chip.', flavor: 'Lights up, nothing on either screen.' };
        },
      },
    );
  if (model === '3dxl')
    v.push({
      id: 'camera-ribbon',
      family: 'Torn ribbon',
      tier: 2,
      weight: 1.4,
      apply(b) {
        b.jumpers.push({ id: b.nextJumperId++, a: { ref: 'CAM1', pin: 'OK' }, b: { ref: 'CAM1', pin: 'GND' }, cold: false, bridge: true });
        return { summary: 'The camera ribbon is damaged where it runs through the hinge and shorts the camera-ready line, so both screens stay off. Unplug the camera to prove it, then replace the camera ribbon.', refs: ['CAM1'], hint: 'Sound but no displays. Try booting with the camera ribbon unplugged.', flavor: 'It makes the start-up sound but both screens are black.' };
      },
    });
  if (model === 'lite')
    v.push({
      id: 'drop-caps',
      family: 'Missing part',
      tier: 2,
      weight: 1.4,
      apply(b) {
        b.comps.C2.part = null;
        addMark(b, 'C2', 'scratch');
        return { summary: 'Dropped: the 3.3 V output capacitor C2 broke off its pads (it was rattling in the case), so the regulator oscillates and the rail sags. Solder a new C2 on.', refs: ['C2'], hint: 'Something rattles inside. The 3.3 V rail is low and noisy. Any empty pads?', flavor: 'I dropped it and now something rattles inside. Dead.' };
      },
    });
  return v;
};

export const DUO_IXL = handheld({ form: CLAMSHELL, color: '#3d3f8f', security: true, id: 'duo-ixl', name: 'DuoScreen i XL', tagline: 'Big dual-screen: a dead top screen means no boot at all.', soc: 'U-DUO-SOC', usb: 'micro', screens: 2, cardSlot: true, wifi: true, camera: true, extraVariants: duoVariants('ixl'), marketValue: 70, quoteBase: 35, minReputation: 5 });
export const DUO_3DXL = handheld({ form: CLAMSHELL, color: '#8f2b2b', security: true, id: 'duo-3dxl', name: 'DuoScreen 3D XL', tagline: 'Dual-screen 3D: camera ribbons through the hinge.', soc: 'U-DUO-SOC', usb: 'micro', screens: 2, cardSlot: true, wifi: true, camera: true, extraVariants: duoVariants('3dxl'), marketValue: 110, quoteBase: 40, minReputation: 8 });
export const DUO_LITE = handheld({ form: CLAMSHELL, color: '#e6e6ea', security: true, id: 'duo-lite', name: 'DuoScreen Lite', tagline: 'Slim dual-screen: drops knock caps off.', soc: 'U-DUO-SOC', usb: 'micro', screens: 2, cardSlot: true, wifi: true, extraVariants: duoVariants('lite'), marketValue: 55, quoteBase: 30, minReputation: 3 });
