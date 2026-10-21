/**
 * Device definition types. Each device (in src/sim/devices) describes its board layout,
 * netlist, firmware, how its owner uses it, and how it can fail.
 * Layout units are millimetres, origin top-left, y down. All products are fictional.
 */
import type { EnclosureDef } from './enclosure';
import type { BoardState, DamageEvent, FunctionalReport, OperatingPoint } from './circuit';
import type { Rng, Variant } from './faults';
import type { Element } from './solver';

export interface ComponentDef {
  ref: string;
  partNo: string;
  block: string;
  x: number;
  y: number;
  rot: 0 | 90 | 180 | 270;
  /** pin name -> net name */
  pins: Record<string, string>;
  /** Role on the schematic, shown in documentation. */
  role: string;
  /** Plug-in module: its pins connect through this connector's contacts (no PCB traces). */
  mates?: string;
  /** Function label printed on the silkscreen next to the part ("A", "CPU", "POWER"…). */
  silk?: string;
}

export interface TraceDef {
  id: string;
  /** The two net fragments this copper segment joins. */
  a: string;
  b: string;
  /** True if the segment runs under a component body (crack not visible from the top). */
  hidden?: boolean;
}

export interface TestPointInfo {
  ref: string;
  net: string;
  expected: string;
}

export interface PowerInput {
  /** Connector the power comes in on. */
  ref: string;
  plus: string;
  minus: string;
  /** The owner's own charger / adapter. */
  adapter: { v: number; ilim: number; rint: number; label: string };
  /** Sensible bench-PSU settings for this device. */
  psuV: number;
  psuI: number;
}

export interface Control {
  ref: string;
  label: string;
}

export interface StatusLine {
  label: string;
  value: string;
  ok?: boolean;
}

/** Hook for attaching external equipment (a TV, a speaker…) to the netlist. */
export interface AttachApi {
  /** Node of the plug side of a connector pin (broken pins return an isolated node). */
  mate(ref: string, pin: string): number;
  node(): number;
  add(el: Element): void;
  gnd: number;
}

export interface External {
  id: string;
  label: string;
  attach(api: AttachApi): void;
}

/** Device firmware running on the controller `ref`. */
export interface Firmware {
  ref: string;
  /** Supply window in which the controller runs (V). */
  vmin: number;
  vmax: number;
  /** Active-low reset input (must be high to run). */
  reset?: string;
  /** Pins read as digital inputs. */
  inputs: string[];
  boot(): Record<string, number>;
  /** Given inputs (true = high) and the previous inputs, update state and return output drive (true = high, false = low). */
  step(state: Record<string, number>, inputs: Record<string, boolean>, prev: Record<string, boolean>): Record<string, boolean>;
}

/** Front shell layout (centres / sizes in board mm). */
export interface FaceSpec {
  /** Screen openings: centre x, centre y, width, height. */
  windows: [number, number, number, number][];
  dpad?: [number, number];
  /** Round face buttons (A/B/X/Y…). */
  buttons?: [number, number][];
  /** Small pill buttons (start / select / menu). */
  pills?: [number, number][];
  /** Openings the analog sticks poke through. */
  sticks?: [number, number][];
  grille?: [number, number];
  /** Round speaker grille (concentric rings of holes): centre x, centre y. */
  speaker?: [number, number];
  /** Openings in the shell wall for connectors at the board edge (a USB port): centre x, centre y, width, height. */
  ports?: [number, number, number, number][];
  /** Small round buttons (home / PS / capture). */
  smallButtons?: [number, number][];
  /** Flat panels set into the shell (a touchpad): centre, size, colour. */
  panels?: { at: [number, number]; size: [number, number]; color: string }[];
  /** Strips that glow while an LED on the board is lit (a light bar). */
  glows?: { ref: string; at: [number, number]; size: [number, number]; color: string }[];
  /** Shell regions beyond the board (controller grips): x0, y0, x1, y1 in board mm. */
  grips?: [number, number, number, number][];
  /** Height of the front shell above the board (mm). */
  height?: number;
  /** Corner radii of the body outline: top-left, top-right, bottom-right, bottom-left (mm). */
  corners?: [number, number, number, number];
  /** Clamshells opened flat: y of the hinge groove across the shell (mm). */
  hinge?: number;
}

export interface DeviceDef {
  id: string;
  name: string;
  category: string;
  /** One line for the marketplace / tickets. */
  tagline: string;
  width: number;
  height: number;
  components: ComponentDef[];
  traces: TraceDef[];
  blocks: { name: string; x: number; y: number; w: number; h: number }[];
  testPoints: TestPointInfo[];
  /** Rails a tech would check, with nominal values. */
  rails: { net: string; nominal: number; label: string }[];
  /** Plain-language description of nets, with the voltage expected on a working board. */
  nets: Record<string, { desc: string; expected?: number; /** Carries real current: routed as a wide trace. */ power?: boolean }>;

  input: PowerInput;
  /** Test point the black probe clips to. */
  ground: string;
  /** Buttons the player can press on the bench. */
  controls: Control[];
  firmware?: Firmware;
  /** Equipment that can be hooked up on the bench (and that the owner uses). */
  externals?: External[];
  /** Externals the owner always has connected when using it. */
  ownerAttaches?: string[];
  /** The case around the board (see enclosure.ts); set from enclosures.ts in devices/index.ts. */
  enclosure?: EnclosureDef;
  /**
   * The front of a handheld / controller (board mm): screen windows, controls and grille.
   * The scene builds the closed front shell from it so it lines up with the parts.
   */
  face?: FaceSpec;
  /** Where the Makers Workbench logo and web address go on the silkscreen: centre x, top y, logo width (mm). */
  logo?: { x: number; y: number; w: number };
  /** Cartridge boards: the console they plug into (device id) and the games sold on this board. */
  cartFor?: string;
  titles?: { name: string; value: number }[];

  /** Use the device like its owner would. */
  functional(b: BoardState): FunctionalReport;
  /** Turn a functional report into what the owner says. */
  complain(r: FunctionalReport, events: DamageEvent[], rng: Rng): string;
  /** Live readouts for the bench (lamp on, TV picture, charging…). */
  status(b: BoardState, op: OperatingPoint | null): StatusLine[];

  variants: Variant[];
  /** Parts a previous owner might have pulled off. */
  missable: string[];
  /** Places the PCB can carbonise (net, net, near ref) for unrepairable units. */
  carbonise: [string, string, string][];

  /** Typical working resale value ($). */
  marketValue: number;
  /** Starting price for a repair quote ($). */
  quoteBase: number;
  /** Reputation needed before these come into the shop. */
  minReputation: number;
}

export const c = (
  ref: string,
  partNo: string,
  block: string,
  x: number,
  y: number,
  rot: ComponentDef['rot'],
  pins: Record<string, string>,
  role: string,
  mates?: string,
): ComponentDef => ({ ref, partNo, block, x, y, rot, pins, role, ...(mates ? { mates } : {}) });
