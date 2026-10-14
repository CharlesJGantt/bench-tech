# Circuit blocks — design (Phase 0, for approval)

## Problem
Every device file hand-writes everything:
- every part and its exact x/y (40 lines for the lamp);
- every net description and test point;
- 10–20 fault variants.

A laptop board with 300 parts would be about 2,000 lines, mostly repeating circuits we already have: a 12 V input with fuse and TVS, a buck regulator, an LDO, a USB-C charger, an HDMI output. The same circuits also re-implement the same faults ("buck dead", "output cap shorted", "fuse blown") in each device file.

## Idea
A **block** is a reusable, parameterised sub-circuit that brings **everything** with it:
- **Its parts:** layout relative to the block's corner, ref prefixes, nets named from its ports.
- **Ports:** named nets it connects to (`in`, `out`, `en`, `pg`, `gnd`).
- **Its fault variants:** written once, valid on every board that uses the block.
- **Its service-sheet data:** net descriptions, expected voltages, test points, the silkscreen block outline.
- **Its own Blender package set:** already shared by part number, so nothing new is needed.

A device becomes **a list of placed blocks plus a few unique parts**, with its own firmware, functional test and complaints, exactly as today.

```ts
// Today (excerpt): every part by hand
c('U1', 'U-VX2302', '5V BUCK', 41, 10, 0, { BST: 'BST', GND: 'GND', FB: 'FB', EN: 'EN_B', IN: '12V', SW: 'SW' }, '5 V buck converter'),
c('C5', 'C-100N', 'BUCK', 41, 4, 0, { '1': 'BST', '2': 'SW' }, 'Bootstrap capacitor'),
c('R2', 'R-100K', 'BUCK', 35, 15, 90, { '1': '12V', '2': 'EN_B' }, 'Enable divider (top)'),
// … 7 more lines, plus nets, test points, and 4 buck fault variants in this file

// With blocks
const blocks = [
  dcJackInput('IN', { at: [2, 2], vin: 12, fuse: 'F-5A', tvs: true, out: '12V' }),
  buckRail('5V', { at: [32, 2], vin: '12V', vout: 5, out: '5V', enable: 'auto' }),
  ldoRail('3V3', { at: [58, 2], vin: '5V', out: '3V3' }),
  hdmiOut('HDMI', { at: [40, 44], vcc: '3V3', video: 'VID', en: 'RT_EN', fiveV: '5V' }),
];
export const FS5 = device({
  id: 'fs5',
  name: 'Funstation 5 (main board, HDMI section)',
  size: [140, 86],
  blocks,
  parts: [ /* the APU, its LED and button — the parts unique to this board */ ],
  firmware, functional, complain, status,
  variants: [ /* board-specific faults only; block faults come automatically */ ],
});
```

### What `device()` does
1. **Expands each block** into `ComponentDef`s:
   - refs are prefixed per block (`5V.U1`, shown as `U1` with the block name on the silkscreen);
   - internal nets are namespaced (`5V.FB`);
   - port nets are shared.
2. **Merges** block net descriptions, test points and rails into the device's service data.
3. **Collects every block's fault variants** and tags them with the block (so the generator can say "the 3.3 V regulator section"), plus the device's own variants.
4. **Checks** that ports connect, refs are unique and blocks don't overlap.

The output is the same `DeviceDef` shape as today. Solver, router, renderer, rework, save files and tests are unchanged.

### Block catalog (first set)

| Block | Ports | Faults included |
|---|---|---|
| `dcJackInput` / `pwrHeaderInput` | out, gnd | jack broken/joint cracked, fuse blown, TVS short, reverse-protection FET short, bulk cap short/bulged |
| `usbCInput` (+ PD) | vbus out, cc | port pins bent/corroded/loose, fuse, sense resistor open, CC resistor (stuck at 5 V, no 15 V) |
| `buckRail` | vin, out, en, pg | IC dead/short, inductor open, output cap short/ESR, FB divider drift, enable divider open |
| `ldoRail` | vin, out | IC dead/blown (overvoltage cascade)/short, output cap short/ESR |
| `liIonCharger` | vin, bat, stat, ntc | charger dead, NTC open (refuses to charge), battery worn/swollen, battery connector |
| `backlightBoost` | vin, en, led± | boost IC dead, switch FET dead/short, sense R open, LED-strip connector joint |
| `hdmiOut` | vcc, video, en, 5V, hpd | port bent pins/joint, ESD short, retimer dead/short, level shifter dead, 5 V polyfuse |
| `mcuCore` | vdd, io… | crystal dead (no clock), decoupling short, reset cap leak, firmware corrupt (later) |
| `flybackSmps` (Phase 5) | mains in, outputs | start-up resistor open → PWM IC dead (cascade), primary FET short, opto aged, output cap ESR |
| `linearPsu7805` (retro) | ac in, 5V | bridge diode, filter cap dried, regulator dead |
| `wifiModule` / `btModule` | vcc, en | module dead (swap), shield corrosion, antenna connector |
| `cartridgeSlot` / `cartridge` | bus | dirty/corroded fingers, cracked finger, save battery, lockout chip |

### Migration
Existing devices are rewritten onto blocks **one at a time**. Each must keep its tests green (healthy board passes, every variant symptomatic and fixable, routing, DRC). Device IDs and part refs stay stable where possible, so saved games still load. Saves store refs; any renamed ref gets a small alias map in `persist.ts`.

### Chips as power blocks (Phase 0, same push)
Big chips (APU, SoC, south bridge, EC) become **macro elements**:
- **Inputs:** rails (each with a UVLO threshold and a current draw), an enable.
- **Outputs:** power-good and logic-level I/O pins.
- **State:** a "boot stage", which drives the standby current signatures from the research notes.

Faults flip their internal state (dead, short on a rail, stuck in a boot loop). No transistor-level modelling, so a 300-part board solves in milliseconds.

## Open questions for you
1. **Ref naming on the board:**
   - *Prefixed* refs like `5V.U1` on the silkscreen (clearer on big boards, a bit unusual), or
   - *renumbered* refs like `U7` with the block name shown only on the silkscreen outline (realistic).
   - I suggest **renumbered refs**, with the block shown in tooltips and the service sheet.
2. **Block layout:** each block places its parts in its own rectangle. Boards then look modular and tidy, like real reference-design copies, but less organic. Is that OK? (Unique parts can still go anywhere.)
