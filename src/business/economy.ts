/** Prices and rates for the shop economy. All brand names are fictional. */

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
  | 'wipes'
  | 'brushes';

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
    start: 0,
    low: 0,
    blurb: 'Fizzes the green/white crust of liquid damage into a sludge. Scrub it with the brush, then rinse with IPA and wipe it away — leftover sludge dries back into crust.',
  },
  wipes: { id: 'wipes', name: 'Lint-free wipes', unit: 'wipes', pack: { qty: 50, cost: 4, label: 'pack of 50' }, start: 20, low: 5, blurb: 'Each wipe soaks up a little dissolved flux before it is spent.' },
  brushes: { id: 'brushes', name: 'Anti-static scrub brushes', unit: 'brushes', pack: { qty: 3, cost: 5, label: 'pack of 3' }, start: 1, low: 1, blurb: 'Stiff ESD-safe bristles. They splay and wear out with scrubbing.' },
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

export const FLUX_GRADES: Record<'flux-rosin' | 'flux-noclean' | 'flux-premium', FluxGrade> = {
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
  kind: 'tip' | 'nozzle' | 'instrument' | 'microscope';
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
  { id: 'esr-meter', kind: 'instrument', name: 'ESR meter', cost: 45, heat: 0, radius: 0, blurb: 'Measures a capacitor\'s ESR in circuit. A dried-out cap still reads fine on a multimeter — this shows it at a glance. Adds an ESR mode to the meter.' },
  { id: 'oscilloscope', kind: 'instrument', name: 'Oscilloscope', cost: 140, heat: 0, radius: 0, blurb: 'See signals, not just voltages: is that chip putting out data? Is the rail rippling? Is the regulator switching? Adds the Scope tool (7).' },
  { id: 'thermal-cam', kind: 'instrument', name: 'Thermal camera', cost: 220, heat: 0, radius: 0, blurb: 'Watch the powered board in heat colours: shorted parts glow. Pairs well with injecting a low voltage from the bench supply. Dead parts that get no power stay cold, so it does not catch everything.' },
  { id: 'objective-1x', kind: 'microscope', name: '1.0× objective', cost: 60, heat: 0, radius: 0, blurb: 'Swaps the stock 0.7× lens: zoom in up to 2.5× (mouse wheel at the microscope). Enough to spot fine solder whiskers between pins.' },
  { id: 'objective-2x', kind: 'microscope', name: '2.0× objective', cost: 120, heat: 0, radius: 0, blurb: 'Zoom in up to 4×: tiny parts and hairline joint cracks fill the view.' },
  { id: 'ring-light', kind: 'microscope', name: 'LED ring light', cost: 35, heat: 0, radius: 0, blurb: 'Even, shadow-free light (L at the microscope): fine whiskers glint even at low zoom.' },
  { id: 'tilt-mount', kind: 'microscope', name: 'Tilting microscope arm', cost: 75, heat: 0, radius: 0, blurb: 'Look in at an angle (T at the microscope) to see under a chip: stray solder balls and hidden bridges.' },
  { id: 'screw-extractor', kind: 'instrument', name: 'Screw extractor bits', cost: 14, heat: 0, radius: 0, blurb: 'Reverse-cut bits that bite into a stripped screw head and back it out. The screw is ruined, but the case opens.' },
  { id: 'screw-mat', kind: 'instrument', name: 'Magnetic screw mat', cost: 12, heat: 0, radius: 0, blurb: 'A whiteboard mat with magnets: every screw stays where it came out, so each one goes back in its own hole — no more long screws in short holes.' },
  { id: 'micro-drill', kind: 'instrument', name: 'Micro drill & carbide bits', cost: 25, heat: 0, radius: 0, blurb: 'For boards a long screw has bitten into: drill the damaged via out under the microscope to separate the shorted inner layers again.' },
  { id: 'nozzle-10', kind: 'nozzle', name: '10 mm hot-air nozzle', cost: 12, heat: 0.8, radius: 6, blurb: 'Wide and even — big chips, connectors and shields.' },
];

export const STARTING_TOOLS = ['tip-conical', 'nozzle-5'];

export function tool(id: string): ToolDef {
  return TOOLS.find((t) => t.id === id) ?? TOOLS[0];
}

export const RENT = { amount: 140, everyDays: 7 };
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
export const NOT_SOLD = new Set(['U-PIC8', 'U-PIC8-SPK', 'U-PIC8-SBX']);

/** Market crazes: a device's resale price jumps for a few days. */
export const TRENDS = [
  'Holiday rush',
  'Streamer hype',
  'Shortage of new units',
  'Back-to-school demand',
  'Viral video',
];

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

