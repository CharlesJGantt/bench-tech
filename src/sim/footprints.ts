import type { ComponentDef } from './board';
import { part, pinsOf, type Pkg } from './parts';

/**
 * Package geometry in millimetres, in board layout space (x right, y down),
 * before component rotation. Pads are listed in pin order (see pinsOf).
 */
export interface Footprint {
  /** Body size (w along x, h along y) and height above the board. */
  w: number;
  h: number;
  height: number;
  pads: { x: number; y: number; w: number; h: number; round?: boolean }[];
}

const two = (d: number, pw: number, ph: number) => [
  { x: -d, y: 0, w: pw, h: ph },
  { x: d, y: 0, w: pw, h: ph },
];

export const FOOTPRINTS: Record<Pkg, Footprint> = {
  '0603': { w: 1.6, h: 0.8, height: 0.45, pads: two(0.8, 0.8, 0.9) },
  '1206': { w: 3.2, h: 1.6, height: 0.6, pads: two(1.5, 1.1, 1.8) },
  LED0805: { w: 2.0, h: 1.25, height: 0.8, pads: two(1.0, 1.0, 1.4) },
  SMA: { w: 4.3, h: 2.6, height: 2.1, pads: two(2.0, 1.6, 1.8) },
  SOD123: { w: 2.7, h: 1.6, height: 1.1, pads: two(1.6, 0.9, 1.2) },
  SOT23: {
    w: 2.9,
    h: 1.3,
    height: 1.0,
    pads: [
      { x: -0.95, y: 1.1, w: 0.7, h: 0.9 },
      { x: 0.95, y: 1.1, w: 0.7, h: 0.9 },
      { x: 0, y: -1.1, w: 0.7, h: 0.9 },
    ],
  },
  'SOT23-6': {
    w: 2.9,
    h: 1.6,
    height: 1.1,
    pads: [
      { x: -0.95, y: 1.3, w: 0.6, h: 0.9 },
      { x: 0, y: 1.3, w: 0.6, h: 0.9 },
      { x: 0.95, y: 1.3, w: 0.6, h: 0.9 },
      { x: 0.95, y: -1.3, w: 0.6, h: 0.9 },
      { x: 0, y: -1.3, w: 0.6, h: 0.9 },
      { x: -0.95, y: -1.3, w: 0.6, h: 0.9 },
    ],
  },
  SOT223: {
    w: 6.5,
    h: 3.5,
    height: 1.6,
    pads: [
      { x: -2.3, y: 3.2, w: 1.2, h: 1.8 },
      { x: 0, y: 3.2, w: 1.2, h: 1.8 },
      { x: 2.3, y: 3.2, w: 1.2, h: 1.8 },
      { x: 0, y: -3.2, w: 3.4, h: 1.8 },
    ],
  },
  SOIC8: {
    w: 3.9,
    h: 4.9,
    height: 1.5,
    pads: [
      { x: -2.7, y: -1.905, w: 1.5, h: 0.6 },
      { x: -2.7, y: -0.635, w: 1.5, h: 0.6 },
      { x: -2.7, y: 0.635, w: 1.5, h: 0.6 },
      { x: -2.7, y: 1.905, w: 1.5, h: 0.6 },
      { x: 2.7, y: 1.905, w: 1.5, h: 0.6 },
      { x: 2.7, y: 0.635, w: 1.5, h: 0.6 },
      { x: 2.7, y: -0.635, w: 1.5, h: 0.6 },
      { x: 2.7, y: -1.905, w: 1.5, h: 0.6 },
    ],
  },
  CAP_EL: { w: 6.6, h: 6.6, height: 5.8, pads: two(2.6, 3.0, 1.6) },
  IND5: { w: 5, h: 5, height: 3, pads: two(2.0, 1.6, 4.0) },
  BARREL: {
    w: 12,
    h: 9,
    height: 11,
    pads: [
      { x: 7.5, y: -1.8, w: 2.4, h: 2.4, round: true },
      { x: 7.5, y: 2.8, w: 2.4, h: 2.4, round: true },
    ],
  },
  TACT6: { w: 6, h: 6, height: 3.5, pads: two(4.25, 1.6, 1.6) },
  COB: { w: 10, h: 10, height: 1.2, pads: two(6.5, 1.8, 2.4) },
  TP: { w: 1.8, h: 1.8, height: 0, pads: [{ x: 0, y: 0, w: 1.8, h: 1.8, round: true }] },
  QFP16: {
    w: 7,
    h: 7,
    height: 1.4,
    pads: [
      // pin 1 top-left, counter-clockwise: left side top→bottom, bottom left→right, right bottom→top, top right→left
      ...[-2.25, -0.75, 0.75, 2.25].map((y) => ({ x: -4.4, y, w: 1.6, h: 0.55 })),
      ...[-2.25, -0.75, 0.75, 2.25].map((x) => ({ x, y: 4.4, w: 0.55, h: 1.6 })),
      ...[2.25, 0.75, -0.75, -2.25].map((y) => ({ x: 4.4, y, w: 1.6, h: 0.55 })),
      ...[2.25, 0.75, -0.75, -2.25].map((x) => ({ x, y: -4.4, w: 0.55, h: 1.6 })),
    ],
  },
  DPAK: {
    w: 6.6,
    h: 6.1,
    height: 2.3,
    pads: [
      { x: -2.28, y: 4.6, w: 1.2, h: 2.2 },
      { x: 2.28, y: 4.6, w: 1.2, h: 2.2 },
      { x: 0, y: -1.2, w: 6, h: 5.8 },
    ],
  },
  CAP_EL10: { w: 10.3, h: 10.3, height: 10.5, pads: two(4.2, 4.5, 2.2) },
  USBC: {
    w: 9,
    h: 7.3,
    height: 3.2,
    pads: [
      { x: -1.75, y: 3.9, w: 0.7, h: 1.3 },
      { x: 0.25, y: 3.9, w: 0.5, h: 1.3 },
      { x: 1.75, y: 3.9, w: 0.7, h: 1.3 },
      { x: 4.6, y: 1.5, w: 1.2, h: 2.2 },
    ],
  },
  MUSB: {
    w: 7.5,
    h: 5,
    height: 2.6,
    pads: [
      { x: -1.3, y: 2.6, w: 0.4, h: 1.4 },
      { x: -0.65, y: 2.6, w: 0.4, h: 1.4 },
      { x: 0, y: 2.6, w: 0.4, h: 1.4 },
      { x: 1.3, y: 2.6, w: 0.4, h: 1.4 },
      { x: 3.6, y: 1.2, w: 1.4, h: 1.8 },
    ],
  },
  HDMI: {
    w: 15,
    h: 11,
    height: 5.6,
    pads: [
      ...[-4.5, -3, -1.5, 0, 1.5, 3, 4.5].map((x) => ({ x, y: 5.9, w: 0.75, h: 1.8 })),
      { x: 7.6, y: 2, w: 1.6, h: 3 },
    ],
  },
  PWR2: {
    w: 10,
    h: 6,
    height: 9,
    pads: [
      { x: -2.5, y: 4.4, w: 2.4, h: 2.4, round: true },
      { x: 2.5, y: 4.4, w: 2.4, h: 2.4, round: true },
    ],
  },
  JST2: {
    w: 6,
    h: 4.5,
    height: 4.2,
    pads: [
      { x: -1, y: 3, w: 1, h: 1.8 },
      { x: 1, y: 3, w: 1, h: 1.8 },
    ],
  },
  FPC2: {
    w: 8,
    h: 4,
    height: 1.5,
    pads: [
      { x: -1.2, y: 2.6, w: 0.6, h: 1.4 },
      { x: 1.2, y: 2.6, w: 0.6, h: 1.4 },
    ],
  },
  // Plug-in modules: their "pads" are the contacts on the module's own lead, not PCB pads.
  BATT: { w: 34, h: 20, height: 6, pads: two(4, 2.2, 2.2).map((p) => ({ ...p, y: -8 })) },
  SCREEN: { w: 44, h: 28, height: 3, pads: two(3, 2, 2).map((p) => ({ ...p, y: 12 })) },
  SPK: { w: 22, h: 22, height: 7, pads: two(3, 2, 2).map((p) => ({ ...p, y: -8.5 })) },
  LEDBAR: { w: 60, h: 6, height: 2, pads: two(27, 2, 2.2) },
};

export function rotate(x: number, y: number, rot: number): [number, number] {
  switch (rot) {
    case 90:
      return [-y, x];
    case 180:
      return [-x, -y];
    case 270:
      return [y, -x];
    default:
      return [x, y];
  }
}

export interface PadWorld {
  ref: string;
  pin: string;
  net: string;
  x: number;
  y: number;
  w: number;
  h: number;
  round?: boolean;
  /** Contact on a plug-in module's lead (not PCB copper). */
  module?: boolean;
}

/** Board-space positions of every pad of a component. */
export function padsOf(def: ComponentDef): PadWorld[] {
  const p = part(def.partNo);
  const fp = FOOTPRINTS[p.pkg];
  const names = pinsOf(p);
  return fp.pads.map((pad, i) => {
    const [dx, dy] = rotate(pad.x, pad.y, def.rot);
    const swap = def.rot === 90 || def.rot === 270;
    return {
      ref: def.ref,
      pin: names[i],
      net: def.pins[names[i]],
      x: def.x + dx,
      y: def.y + dy,
      w: swap ? pad.h : pad.w,
      h: swap ? pad.w : pad.h,
      round: pad.round,
      ...(def.mates ? { module: true } : {}),
    };
  });
}

/** Board-space bounding box of a component body. */
export function bodyRect(def: ComponentDef): { x: number; y: number; w: number; h: number } {
  const fp = FOOTPRINTS[part(def.partNo).pkg];
  const swap = def.rot === 90 || def.rot === 270;
  const w = swap ? fp.h : fp.w;
  const h = swap ? fp.w : fp.h;
  return { x: def.x - w / 2, y: def.y - h / 2, w, h };
}
