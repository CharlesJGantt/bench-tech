/** Prices and rates for the shop economy. All brand names are fictional. */
import { BGA_TYPES, stencilLabel } from '../sim/bgatypes';

export type SupplyId =
  | 'solder'
  | 'lowmelt'
  | 'flux-rosin'
  | 'flux-noclean'
  | 'flux-premium'
  | 'wick-1'
  | 'wick-2'
  | 'wick-3'
  | 'ipa'
  | 'flux-cleaner'
  | 'corrosion-cleaner'
  | 'thermal-paste'
  | 'spare-screws'
  | 'liquid-metal'
  | 'pink-eraser'
  | 'magic-sponge'
  | 'pad-bright'
  | 'wipes'
  | 'swabs'
  | 'ipa-wipes'
  | 'brushes'
  | 'wire-30'
  | 'wire-34'
  | 'wire-38'
  | 'mask-green'
  | 'mask-red'
  | 'mask-blue'
  | 'mask-black'
  | 'kapton'
  | 'disc-polish'
  | 'solder-cert'
  | 'flux-cert'
  | 'coating-remover'
  | 'conformal-coat'
  | 'bga-balls-030'
  | 'bga-balls-045'
  | 'bga-balls-060'
  | 'solder-paste';

export interface SupplyDef {
  id: SupplyId;
  name: string;
  unit: string;
  /** Reorder pack. */
  pack: { qty: number; cost: number; label: string };
  start: number;
  /** Level at which the office warns you (0 = never warn). */
  low: number;
  blurb: string;
}

export const SUPPLIES: Record<SupplyId, SupplyDef> = {
  solder: { id: 'solder', name: 'Solder wire (lead-free)', unit: 'g', pack: { qty: 50, cost: 14, label: '50 g spool' }, start: 40, low: 8, blurb: 'Everyday solder. Melts at about 217 °C.' },
  lowmelt: {
    id: 'lowmelt',
    name: 'ChillMelt low-melt alloy',
    unit: 'g',
    pack: { qty: 10, cost: 22, label: '10 g tube' },
    start: 0,
    low: 0,
    blurb: 'Mix it into a joint and it melts at ~140 °C — remove plastic connectors and delicate chips without cooking them. Wick it all out before soldering the new part, or the joints will be weak.',
  },
  'flux-rosin': {
    id: 'flux-rosin',
    name: 'Yellow rosin flux',
    unit: 'ml',
    pack: { qty: 10, cost: 5, label: '10 ml pot' },
    start: 8,
    low: 2,
    blurb: 'Cheap starter flux. Works, but it is thick and sticky: lots of scrubbing to clean off, and it leaves white residue if the IPA dries.',
  },
  'flux-noclean': { id: 'flux-noclean', name: 'No-clean flux', unit: 'ml', pack: { qty: 10, cost: 9, label: '10 ml syringe' }, start: 0, low: 0, blurb: 'Better wetting and much easier to clean up.' },
  'flux-premium': {
    id: 'flux-premium',
    name: 'Premium tacky flux',
    unit: 'ml',
    pack: { qty: 10, cost: 18, label: '10 ml syringe' },
    start: 0,
    low: 0,
    blurb: 'Pro-grade gel flux: best heat transfer and solder flow, burns off slowly, wipes away with almost no scrubbing.',
  },
  'wick-1': { id: 'wick-1', name: 'Desoldering wick 1.0 mm', unit: 'cm', pack: { qty: 150, cost: 6, label: '1.5 m roll' }, start: 0, low: 0, blurb: 'Narrow: precise on tiny pads, slow on big ones.' },
  'wick-2': { id: 'wick-2', name: 'Desoldering wick 2.0 mm', unit: 'cm', pack: { qty: 150, cost: 6, label: '1.5 m roll' }, start: 120, low: 25, blurb: 'The all-rounder.' },
  'wick-3': { id: 'wick-3', name: 'Desoldering wick 3.0 mm', unit: 'cm', pack: { qty: 150, cost: 8, label: '1.5 m roll' }, start: 0, low: 0, blurb: 'Wide: clears big pads and connector rows fast, but soaks up heat and covers neighbours.' },
  ipa: { id: 'ipa', name: 'Isopropyl alcohol 99%', unit: 'ml', pack: { qty: 500, cost: 9, label: '500 ml bottle' }, start: 300, low: 60, blurb: 'Dissolves flux. Evaporates quickly.' },
  'flux-cleaner': {
    id: 'flux-cleaner',
    name: 'Flux remover',
    unit: 'ml',
    pack: { qty: 250, cost: 7.2, label: '250 ml can' },
    start: 0,
    low: 0,
    blurb: 'Dissolves flux about 1.5× faster than IPA, and strips the baked-on "unknown" flux other repairers leave behind, which IPA barely touches.',
  },
  'thermal-paste': {
    id: 'thermal-paste',
    name: 'Thermal paste',
    unit: 'g',
    pack: { qty: 4, cost: 6, label: '4 g syringe' },
    start: 2,
    low: 0.6,
    blurb: 'A pea of fresh paste every time a heatsink comes off — putting it back on the old, broken paste cooks the chip.',
  },
  'pink-eraser': {
    id: 'pink-eraser',
    name: 'Pink pencil erasers',
    unit: 'pcs',
    pack: { qty: 6, cost: 3, label: 'pack of 6' },
    start: 3,
    low: 1,
    blurb: 'The classic way to scrub tarnish off cartridge and connector contacts. Slow, cheap, wears down as you rub.',
  },
  'magic-sponge': {
    id: 'magic-sponge',
    name: 'Magic eraser sponges',
    unit: 'pcs',
    pack: { qty: 4, cost: 5, label: 'pack of 4' },
    start: 0,
    low: 0,
    blurb: 'Melamine foam: scrubs contacts about 2.5× faster than a pencil eraser. Wears out a little quicker.',
  },
  'pad-bright': {
    id: 'pad-bright',
    name: 'Pad-Bright contact treatment',
    unit: 'ml',
    pack: { qty: 30, cost: 7, label: '30 ml bottle' },
    start: 10,
    low: 2,
    blurb: 'After scrubbing: wipe it on and the contacts come up bright and stay protected. Skip it and they dull again.',
  },
  'liquid-metal': {
    id: 'liquid-metal',
    name: 'Liquid metal compound',
    unit: 'g',
    pack: { qty: 1, cost: 16, label: '1 g syringe + swabs' },
    start: 0,
    low: 0,
    blurb: 'Gallium alloy some consoles use instead of paste: far better cooling, but it conducts — keep it off everything except the chip, and never tilt a board with it wet.',
  },
  'spare-screws': {
    id: 'spare-screws',
    name: 'Assorted case screws',
    unit: 'pcs',
    pack: { qty: 50, cost: 6, label: 'box of 50 (all common lengths)' },
    start: 10,
    low: 4,
    blurb: 'For holes that came in empty or screws you had to drill or extract. Always the right length.',
  },
  'corrosion-cleaner': {
    id: 'corrosion-cleaner',
    name: 'Corrosion cleaner',
    unit: 'ml',
    pack: { qty: 250, cost: 6.3, label: '250 ml bottle' },
    start: 125, // half a bottle to start with
    low: 0,
    blurb: 'Fizzes the green/white crust of liquid damage into a sludge. Scrub it with the brush, then rinse with IPA and wipe it away — leftover sludge dries back into crust.',
  },
  wipes: { id: 'wipes', name: 'Lint-free wipes', unit: 'wipes', pack: { qty: 50, cost: 4, label: 'pack of 50' }, start: 20, low: 5, blurb: 'Each wipe soaks up a little dissolved flux before it is spent.' },
  swabs: { id: 'swabs', name: 'Cleaning swabs', unit: 'swabs', pack: { qty: 100, cost: 3, label: 'bag of 100' }, start: 20, low: 5, blurb: 'Foam and cotton swabs for getting into corners, fan hubs and port housings. One swab, one spot.' },
  'ipa-wipes': { id: 'ipa-wipes', name: 'IPA wipes', unit: 'wipes', pack: { qty: 50, cost: 6, label: 'tub of 50' }, start: 10, low: 3, blurb: 'Pre-soaked with isopropyl alcohol: quick for wiping cases, screens and cartridge shells without opening a bottle.' },
  brushes: { id: 'brushes', name: 'Anti-static scrub brushes', unit: 'brushes', pack: { qty: 3, cost: 5, label: 'pack of 3' }, start: 1, low: 1, blurb: 'Stiff ESD-safe bristles. They splay and wear out with scrubbing.' },
  'wire-30': { id: 'wire-30', name: 'Copper repair wire, 30 gauge', unit: 'cm', pack: { qty: 500, cost: 6, label: '5 m spool' }, start: 0, low: 0, blurb: 'Thick enamelled copper wire for rebuilding power traces that carry real current, and for long jumpers.' },
  'wire-34': { id: 'wire-34', name: 'Copper repair wire, 34 gauge', unit: 'cm', pack: { qty: 500, cost: 7, label: '5 m spool' }, start: 0, low: 0, blurb: 'The all-rounder for signal traces and lifted pads: thin enough to route between pins.' },
  'wire-38': { id: 'wire-38', name: 'Copper repair wire, 38 gauge', unit: 'cm', pack: { qty: 500, cost: 9, label: '5 m spool' }, start: 0, low: 0, blurb: 'Hair-thin wire for fine-pitch chips and tiny pads. Breaks if you look at it wrong.' },
  'mask-green': { id: 'mask-green', name: 'UV solder mask, green', unit: 'ml', pack: { qty: 10, cost: 8, label: '10 ml syringe' }, start: 0, low: 0, blurb: 'Brush it over a repaired trace and cure it with the UV lamp to seal the copper. Matches most boards.' },
  'mask-red': { id: 'mask-red', name: 'UV solder mask, red', unit: 'ml', pack: { qty: 10, cost: 8, label: '10 ml syringe' }, start: 0, low: 0, blurb: 'For boards with a red solder mask.' },
  'mask-blue': { id: 'mask-blue', name: 'UV solder mask, blue', unit: 'ml', pack: { qty: 10, cost: 8, label: '10 ml syringe' }, start: 0, low: 0, blurb: 'For boards with a blue solder mask.' },
  'mask-black': { id: 'mask-black', name: 'UV solder mask, black', unit: 'ml', pack: { qty: 10, cost: 8, label: '10 ml syringe' }, start: 0, low: 0, blurb: 'For boards with a black solder mask.' },
  kapton: { id: 'kapton', name: 'Kapton heat tape', unit: 'cm', pack: { qty: 1000, cost: 5, label: '10 m roll' }, start: 0, low: 0, blurb: 'Heat-proof tape: cover plastic connectors and parts that melt next to your hot air, then peel it off.' },
  'bga-balls-030': { id: 'bga-balls-030', name: 'Solder balls 0.30 mm', unit: 'pcs', pack: { qty: 2000, cost: 9, label: 'bottle of 2000' }, start: 0, low: 0, blurb: 'The smallest BGA balls: they fit the 0.30 mm stencils (ST-01 to ST-04). One ball goes in every hole of the stencil.' },
  'bga-balls-045': { id: 'bga-balls-045', name: 'Solder balls 0.45 mm', unit: 'pcs', pack: { qty: 2000, cost: 9, label: 'bottle of 2000' }, start: 0, low: 0, blurb: 'Medium BGA balls: they fit the 0.45 mm stencils (ST-05 to ST-08).' },
  'bga-balls-060': { id: 'bga-balls-060', name: 'Solder balls 0.60 mm', unit: 'pcs', pack: { qty: 2000, cost: 10, label: 'bottle of 2000' }, start: 0, low: 0, blurb: 'The biggest BGA balls: they fit the 0.60 mm stencils (ST-09 to ST-12).' },
  'solder-paste': { id: 'solder-paste', name: 'Solder paste', unit: 'g', pack: { qty: 25, cost: 16, label: '25 g syringe' }, start: 0, low: 0, blurb: 'Smear it over a stencil and scrape the excess off: quick reballing, no extra flux. About one time in five it leaves some pads with too little or too much.' },
  'solder-cert': { id: 'solder-cert', name: 'Certified solder (traceable lot)', unit: 'g', pack: { qty: 25, cost: 120, label: '25 g certified spool' }, start: 0, low: 0, blurb: 'Lot-traceable, certified alloy. Required for aviation, orbital and military boards. Far dearer than ordinary solder.' },
  'flux-cert': { id: 'flux-cert', name: 'Certified no-residue flux', unit: 'ml', pack: { qty: 10, cost: 95, label: '10 ml certified syringe' }, start: 0, low: 0, blurb: 'Certified flux that cleans off completely. Required for certified boards, where flux must never be left behind.' },
  'coating-remover': { id: 'coating-remover', name: 'Conformal coating remover', unit: 'ml', pack: { qty: 60, cost: 55, label: '60 ml bottle' }, start: 0, low: 0, blurb: 'Softens conformal coating around a repair area, used with the pen grinder. Needed before reworking a coated board.' },
  'conformal-coat': { id: 'conformal-coat', name: 'Conformal coating (UV cure)', unit: 'ml', pack: { qty: 30, cost: 70, label: '30 ml bottle' }, start: 0, low: 0, blurb: 'Re-seals the repair area after rework; cured under the UV lamp. A certified board is not finished until its coating is back.' },
  'disc-polish': { id: 'disc-polish', name: 'Disc polishing compound', unit: 'ml', pack: { qty: 100, cost: 7, label: '100 ml bottle' }, start: 10, low: 0, blurb: 'Used with the disc buffer to polish scratches out of game discs.' },
};

/** How much of each supply the rework tools use. */
export const USAGE = {
  /** grams per unit of solder fed in the rework model */
  solderPerUnit: 0.6,
  /** per second of tool use */
  fluxPerSec: 0.35,
  /** Solder (model units, ~1 per joint) the end of the braid soaks up before it is saturated. */
  wickCapacity: 3,
  /** Braid cut off and binned each time a saturated end is trimmed (cm). */
  wickCutCm: 2,
  ipaPerSec: 4,
  /** IPA used by flooding the whole board on the bench */
  ipaFlood: 25,
  /** Thermal paste per heatsink (g). */
  pastePerChip: 0.3,
  /** Liquid metal per chip (g). */
  lmPerChip: 0.1,
  /** Pad-Bright per contact (ml). */
  padBrightPerPin: 0.15,
  /** Dissolved flux one wipe can soak up before it is spent. */
  wipeCapacity: 1.6,
  /** Brush wear per mm of scrubbing. */
  brushWearPerMm: 0.0002,
};

// ---------------------------------------------------------------------------
// Tools (bought once)
// ---------------------------------------------------------------------------

export interface FluxGrade {
  /** Heat transfer / wetting multiplier. */
  wet: number;
  /** How easily the brush loosens it. */
  clean: number;
  /** How much white residue it leaves if the IPA dries. */
  residue: number;
  /** How fast it burns off. */
  burn: number;
}

/** Baked-on flux of unknown origin left by a previous repairer: IPA barely shifts it. */
export const UNKNOWN_FLUX: FluxGrade = { wet: 0.7, clean: 0.08, residue: 1.4, burn: 1 };

/** Cleaning liquids the IPA tool can apply (selected in the kit). */
export const LIQUIDS = ['ipa', 'flux-cleaner', 'corrosion-cleaner'] as const;
export type Liquid = (typeof LIQUIDS)[number];

export const FLUX_GRADES: Record<'flux-rosin' | 'flux-noclean' | 'flux-premium' | 'flux-cert', FluxGrade> = {
  'flux-cert': { wet: 1.4, clean: 2.2, residue: 0.25, burn: 0.55 },
  'flux-rosin': { wet: 0.8, clean: 0.45, residue: 1.6, burn: 1.3 },
  'flux-noclean': { wet: 1, clean: 1, residue: 1, burn: 1 },
  'flux-premium': { wet: 1.3, clean: 1.8, residue: 0.5, burn: 0.65 },
};

export interface WickDef {
  supply: 'wick-1' | 'wick-2' | 'wick-3';
  /** Width (mm): how far around the cursor it touches pads. */
  width: number;
  /** Soak-up speed multiplier. */
  rate: number;
  /** Heat delivered through the braid (wider wick sinks more heat). */
  heat: number;
}

export const WICKS: Record<WickDef['supply'], WickDef> = {
  'wick-1': { supply: 'wick-1', width: 1, rate: 0.6, heat: 0.9 },
  'wick-2': { supply: 'wick-2', width: 2, rate: 1, heat: 0.75 },
  'wick-3': { supply: 'wick-3', width: 3, rate: 1.5, heat: 0.6 },
};

export interface ToolDef {
  id: string;
  kind: 'tip' | 'nozzle' | 'instrument' | 'microscope' | 'testconsole' | 'cleaning' | 'stencil';
  name: string;
  cost: number;
  blurb: string;
  /** Heat-transfer multiplier. */
  heat: number;
  /** Contact / airflow radius (mm). */
  radius: number;
}

export const TOOLS: ToolDef[] = [
  { id: 'tip-conical', kind: 'tip', name: 'Fine conical tip', cost: 0, heat: 0.6, radius: 0.4, blurb: 'The stock tip. Pin-point accurate but small contact area — slow on big pads and ground planes.' },
  { id: 'tip-chisel', kind: 'tip', name: '2 mm chisel tip', cost: 8, heat: 1, radius: 0.7, blurb: 'Flat face for good heat transfer. The best everyday tip.' },
  { id: 'tip-bevel', kind: 'tip', name: '3 mm bevel ("hoof") tip', cost: 12, heat: 1.3, radius: 1.1, blurb: 'Huge contact area: melts ground pads and connector shields fast. Big enough to touch neighbouring pins.' },
  { id: 'tip-knife', kind: 'tip', name: 'Knife tip', cost: 14, heat: 1.15, radius: 0.8, blurb: 'Long edge — drag along a row of pins, or heat both ends of a small part at once.' },
  { id: 'nozzle-5', kind: 'nozzle', name: '5 mm hot-air nozzle', cost: 0, heat: 1, radius: 3.5, blurb: 'The stock nozzle.' },
  { id: 'nozzle-3', kind: 'nozzle', name: '3 mm hot-air nozzle', cost: 9, heat: 1.4, radius: 2, blurb: 'Focused: heats a small part without cooking its neighbours.' },
  { id: 'air-blower', kind: 'cleaning', name: 'Compressed air blower', cost: 30, heat: 0, radius: 0, blurb: 'Blows dust out of fans, vents and heatsinks. The tool for cleaning an overheating device; no mess, and it never runs out.' },
  { id: 'esr-meter', kind: 'instrument', name: 'ESR meter', cost: 45, heat: 0, radius: 0, blurb: 'Measures a capacitor\'s ESR in circuit. A dried-out cap still reads fine on a multimeter — this shows it at a glance. Adds an ESR mode to the meter.' },
  { id: 'oscilloscope', kind: 'instrument', name: 'Oscilloscope', cost: 140, heat: 0, radius: 0, blurb: 'See signals, not just voltages: is that chip putting out data? Is the rail rippling? Is the regulator switching? Adds the Scope tool (7).' },
  { id: 'thermal-cam', kind: 'instrument', name: 'Thermal camera', cost: 220, heat: 0, radius: 0, blurb: 'Watch the powered board in heat colours: shorted parts glow. Pairs well with injecting a low voltage from the bench supply. Dead parts that get no power stay cold, so it does not catch everything.' },
  { id: 'objective-1x', kind: 'microscope', name: '1.0× objective', cost: 60, heat: 0, radius: 0, blurb: 'Swaps the stock 0.7× lens: zoom in up to 2.5× (mouse wheel at the microscope). Enough to spot fine solder whiskers between pins.' },
  { id: 'objective-2x', kind: 'microscope', name: '2.0× objective', cost: 120, heat: 0, radius: 0, blurb: 'Zoom in up to 4×: tiny parts and hairline joint cracks fill the view.' },
  { id: 'ring-light', kind: 'microscope', name: 'LED ring light', cost: 35, heat: 0, radius: 0, blurb: 'Even, shadow-free light (L at the microscope): fine whiskers glint even at low zoom.' },
  { id: 'tilt-mount', kind: 'microscope', name: 'Tilting microscope arm', cost: 75, heat: 0, radius: 0, blurb: 'Look in at an angle (T at the microscope) to see under a chip: stray solder balls and hidden bridges.' },
  { id: 'tc-bes', kind: 'testconsole', name: 'Working Bintendo Entertainment System', cost: 45, heat: 0, radius: 0, blurb: 'A known-good console for the Test Station: insert a fixed BES cartridge, press power, and see the title screen for yourself before the customer does.' },
  { id: 'tc-b64', kind: 'testconsole', name: 'Working Bintendo 64 (with jumper pak)', cost: 60, heat: 0, radius: 0, blurb: 'Known-good B64 for the Test Station.' },
  { id: 'tc-vega', kind: 'testconsole', name: 'Working Vega Exodus', cost: 40, heat: 0, radius: 0, blurb: 'Known-good Vega Exodus for the Test Station.' },
  { id: 'tc-paltari', kind: 'testconsole', name: 'Working Paltari Family Console', cost: 35, heat: 0, radius: 0, blurb: 'Known-good Paltari for the Test Station.' },
  { id: 'tc-db', kind: 'testconsole', name: 'Working Dream Boy', cost: 35, heat: 0, radius: 0, blurb: 'Known-good Dream Boy for testing Dream Boy cartridges.' },
  { id: 'tc-dba', kind: 'testconsole', name: 'Working Dream Boy Advance', cost: 45, heat: 0, radius: 0, blurb: 'Known-good Dream Boy Advance for testing Advance cartridges.' },
  { id: 'gamebit', kind: 'instrument', name: 'Game-Bit security drivers', cost: 9, heat: 0, radius: 0, blurb: 'The odd security screws on game cartridges and retro consoles. Without them the shell stays shut.' },
  { id: 'screw-extractor', kind: 'instrument', name: 'Screw extractor bits', cost: 14, heat: 0, radius: 0, blurb: 'Reverse-cut bits that bite into a stripped screw head and back it out. The screw is ruined, but the case opens.' },
  { id: 'screw-mat', kind: 'instrument', name: 'Magnetic screw mat', cost: 12, heat: 0, radius: 0, blurb: 'A whiteboard mat with magnets: every screw stays where it came out, so each one goes back in its own hole — no more long screws in short holes.' },
  { id: 'tweezers', kind: 'instrument', name: 'Fine tweezers', cost: 6, heat: 0, radius: 0, blurb: 'Pulls lint and fluff out of USB and HDMI ports. Every bench has a pair.' },
  { id: 'pick-tool', kind: 'instrument', name: 'Plastic pick tool', cost: 7, heat: 0, radius: 0, blurb: 'Scrapes packed grime off the contacts inside a port without scratching them. Look into the port first (tip the board up).' },
  { id: 'drive-imager', kind: 'instrument', name: 'Drive imager / programmer', cost: 45, heat: 0, radius: 0, blurb: 'Writes a clean system image onto a console or handheld storage drive. Fixes corrupt storage without a new drive, and sets up a replacement.' },
  { id: 'port-tester', kind: 'instrument', name: 'USB port diode tester', cost: 38, heat: 0, radius: 0, blurb: 'Clips onto a charging port and checks every pin in diode mode against a healthy board: red dots mark pins that read wrong (a short or an open). Finds a bad port, filter or protection part without probing each one.' },
  { id: 'pen-grinder', kind: 'instrument', name: 'Pen grinder (fibreglass pen)', cost: 18, heat: 0, radius: 0, blurb: 'Scrapes the solder mask off a trace or lifted pad so you can solder repair wire straight to clean copper.' },
  { id: 'uv-lamp', kind: 'instrument', name: 'UV curing lamp', cost: 22, heat: 0, radius: 0, blurb: 'Sets UV solder mask in seconds. Needed for sealing trace repairs.' },
  { id: 'usb-meter', kind: 'instrument', name: 'USB power meter', cost: 16, heat: 0, radius: 0, blurb: 'Sits between the charger and the device and shows volts and amps: tells you whether a device is really charging, drawing nothing, or shorted.' },
  { id: 'disc-buffer', kind: 'instrument', name: 'Disc buffing machine', cost: 85, heat: 0, radius: 0, blurb: 'Spins a game disc against a polishing pad to remove scratches. The core of a disc-resurfacing service.' },
  { id: 'micro-drill', kind: 'instrument', name: 'Micro drill & carbide bits', cost: 25, heat: 0, radius: 0, blurb: 'For boards a long screw has bitten into: drill the damaged via out under the microscope to separate the shorted inner layers again.' },
  { id: 'nozzle-10', kind: 'nozzle', name: '10 mm hot-air nozzle', cost: 12, heat: 0.8, radius: 6, blurb: 'Wide and even — big chips, connectors and shields.' },
  { id: 'bga-vise', kind: 'instrument', name: 'Reballing vise', cost: 150, heat: 0, radius: 0, blurb: 'Holds a BGA chip steady under its stencil so the balls land on the pads. Needed for every reball.' },
  { id: 'paste-scraper', kind: 'instrument', name: 'Paste scraper', cost: 8, heat: 0, radius: 0, blurb: 'Wipes excess solder paste off a stencil. Only needed for the paste method of reballing.' },
  ...BGA_TYPES.map((t): ToolDef => ({ id: `stencil-${t.stencil}`, kind: 'stencil', name: `Stencil ${t.stencil} (${t.ballMm.toFixed(2)} mm)`, cost: 40, heat: 0, radius: 0, blurb: `Laser-cut stainless stencil. Etched: ${stencilLabel(t)}. It warps if the hot air is too hot, and then it has to be replaced.` })),
];

export const STARTING_TOOLS = ['tip-conical', 'nozzle-5', 'tweezers', 'pick-tool'];

export function tool(id: string): ToolDef {
  return TOOLS.find((t) => t.id === id) ?? TOOLS[0];
}

export const RENT = { amount: 140, everyDays: 7 };

export type LocationId = 'garage' | 'storefront' | 'mall';
export interface LocationDef {
  id: LocationId;
  name: string;
  /** Weekly rent (the garage is the base RENT). */
  rent: number;
  /** One-off fit-out cost to move in. */
  fitOut: number;
  /** Reputation needed before a landlord will rent to you. */
  reputation: number;
  /** Walk-in traffic for storefront sales (0 = no shop window at all). */
  traffic: number;
  /** Extra new customers a day on top of advertising. */
  extraCustomers: number;
  blurb: string;
}

export const LOCATIONS: LocationDef[] = [
  { id: 'garage', name: 'Home garage lab', rent: RENT.amount, fitOut: 0, reputation: 0, traffic: 0, extraCustomers: 0, blurb: 'Where everyone starts. Repairs and online sales only: nobody can walk in off the street.' },
  { id: 'storefront', name: 'Small storefront', rent: 320, fitOut: 600, reputation: 15, traffic: 1, extraCustomers: 1, blurb: 'Low rent on a quiet street. A shelf for walk-in customers and a trickle of passing trade.' },
  { id: 'mall', name: 'Mall shop', rent: 800, fitOut: 2500, reputation: 45, traffic: 2.4, extraCustomers: 2, blurb: 'High rent, high footfall. Walk-ins buy a lot more, and more people bring repairs.' },
];

/** What staff cost and do. Wages are paid every night; a raise moves someone up a level. */
export interface StaffLevel {
  level: 1 | 2 | 3;
  title: string;
  /** Repairs finished per day. */
  repairs: number;
  /** Daily wage ($). */
  wage: number;
  blurb: string;
}

export const STAFF_LEVELS: StaffLevel[] = [
  { level: 1, title: 'Trainee', repairs: 1, wage: 55, blurb: 'Cheap and keen. Handles the easy jobs; harder ones often go wrong.' },
  { level: 2, title: 'Technician', repairs: 2, wage: 90, blurb: 'Two repairs a day and steady on moderate faults.' },
  { level: 3, title: 'Senior technician', repairs: 3, wage: 140, blurb: 'Three repairs a day, and can take on the hard ones.' },
];

/** How many people each place has room for. */
export const STAFF_CAP: Record<LocationId, number> = { garage: 0, storefront: 1, mall: 2 };

export function locationDef(id: LocationId | undefined): LocationDef {
  return LOCATIONS.find((l) => l.id === id) ?? LOCATIONS[0];
}
export const ELECTRICITY = { basePerDay: 2.5, perHeatMinute: 0.12, perPowerMinute: 0.03 };

export interface AdTier {
  id: 'none' | 'flyers' | 'online' | 'radio';
  name: string;
  perDay: number;
  /** Customers per day (min..max). */
  customers: [number, number];
  /** Customers accept slightly higher quotes when they found you through ads. */
  quoteMult: number;
  blurb: string;
}

export const ADS: AdTier[] = [
  { id: 'none', name: 'Word of mouth', perDay: 0, customers: [1, 2], quoteMult: 1, blurb: 'Free. A trickle of customers.' },
  { id: 'flyers', name: 'Flyers & community board', perDay: 6, customers: [2, 3], quoteMult: 1.05, blurb: 'Cheap and local.' },
  { id: 'online', name: 'Local online ads', perDay: 18, customers: [2, 4], quoteMult: 1.12, blurb: 'Steady stream of jobs.' },
  { id: 'radio', name: 'Radio spot', perDay: 45, customers: [3, 5], quoteMult: 1.2, blurb: 'Busy shop, better-paying customers.' },
];

/** Parts from the supplier: price per piece is part.cost; orders also pay shipping by the chosen service. */
export interface DeliveryDef {
  id: 'economy' | 'standard' | 'express';
  name: string;
  /** Days until it arrives (1 = tomorrow morning). */
  days: number;
  cost: number;
  blurb: string;
}

export const DELIVERY: DeliveryDef[] = [
  { id: 'economy', name: 'Economy post', days: 3, cost: 2, blurb: 'Cheap, arrives in 3 days.' },
  { id: 'standard', name: 'Standard', days: 2, cost: 5, blurb: 'Arrives the day after tomorrow.' },
  { id: 'express', name: 'Express courier', days: 1, cost: 14, blurb: 'Arrives tomorrow morning.' },
];
export type DeliveryId = DeliveryDef['id'];
export const delivery = (id: DeliveryId = 'standard') => DELIVERY.find((d) => d.id === id) ?? DELIVERY[1];
/** Kept for older callers: the standard shipping fee. */
export const SHIPPING = delivery('standard').cost;
/** Parts at or above this price are special-order only: the local store never has them, and the supplier ships them in. */
export const SPECIAL_ORDER_COST = 10;
/** Buying a single part from the local store right now costs this many times the list price (minimum $1.50). */
export const RUSH_MARKUP = 3;
export const RUSH_MIN = 1.5;
/** Parts the supplier will not sell (factory-programmed — salvage only). */
export const NOT_SOLD = new Set(['U-PIC8', 'U-PIC8-SPK', 'U-PIC8-SBX', 'U-PAD-MCU', 'U-BTL-SOC', 'U-RB35-SOC', 'U-RP-APU', 'U-DUO-SOC', 'U-GNC-CPU', 'U-CRT-CPU']);

/** Market crazes: a device's resale price jumps for a few days. */
export const TRENDS = [
  'Holiday rush',
  'Streamer hype',
  'Shortage of new units',
  'Back-to-school demand',
  'Viral video',
];

/**
 * Starter pack: one or two of the chips, connectors and modules you would otherwise have to
 * order (or could never buy — factory-programmed controllers), so the first jobs of a new
 * career can be fixed straight away and money starts coming in. The big processors, screens
 * and LED strips are not included — those come from orders or donor boards.
 */
export const STARTER_PACK: Record<string, number> = {
  'U-TC41': 2,
  'U-LS1T': 2,
  'U-SA8002': 1,
  'U-LB693': 1,
  'U-LX9201': 1,
  'U-PIC8': 1,
  'U-PIC8-SPK': 1,
  'U-PIC8-SBX': 1,
  'Q-NPWR': 1,
  'Q-PPWR': 1,
  'L-22U': 1,
  'D-TVS24': 1,
  'D-SS36': 1,
  'C-470U-35': 1,
  'C-1000U-16': 1,
  'LED-COB3': 1,
  'R-2R0-1206': 2,
  'R-0R05-1206': 1,
  'J-HDMI': 1,
  'J-PWR2': 1,
  'J-FPC2': 1,
  'M-BATT-1S': 1,
  'U-7805T': 1,
  'BT-CR2032T': 2,
  'BT-LR44X2T': 2,
  'U-LDO33T': 1,
  'BT-LIPO-1S': 1,
};

export const STARTING_STOCK: Record<string, number> = {
  'R-33R-1206': 2,
  'R-100R': 5,
  'R-1K': 5,
  'R-10K': 10,
  'R-47K': 5,
  'R-52K3': 3,
  'R-100K': 8,
  'C-100N': 10,
  'C-1U': 5,
  'C-10U-25': 3,
  'C-10U-6': 3,
  'C-22U-10': 4,
  'C-100U-25': 2,
  'F-1A': 3,
  'D-TVS15': 2,
  'D-Z10': 2,
  'LED-GRN': 3,
  'LED-BLU': 3,
  'Q-NFET': 2,
  'Q-PFET': 2,
  'L-10U': 1,
  'U-VX2302': 1,
  'U-HL33': 1,
  'J-BARREL': 1,
  'SW-TACT': 2,
  'R-10R-1206': 2,
  'R-220R': 3,
  'R-4K7': 4,
  'R-22K': 3,
  'C-4U7-50': 2,
  'F-3A': 2,
  'F-5A': 1,
  'F-POLY05': 2,
  'D-SS14': 2,
  'D-ESD5': 4,
  'D-TVS5': 2,
  'LED-RED': 3,
  'LED-WHT': 3,
  'J-USBC': 1,
  'J-MUSB': 2,
  'J-JST2': 2,
  'M-SPK4': 1,
};


/** Certified parts cost this many times the ordinary price (lot-traceable stock). */
export const CERT_PART_MULT = 8;
export const certPrice = (cost: number): number => Math.max(12, Math.round(cost * CERT_PART_MULT * 100) / 100);
