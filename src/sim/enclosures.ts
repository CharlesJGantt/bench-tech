/**
 * The case around each device: what holds it shut and what sits over the board.
 * Coordinates are board mm. Mixed screw lengths are deliberate — put a long one in a short
 * hole and it punches into the board.
 */
import type { EnclosureDef, EncItem } from './enclosure';

const screw = (id: string, label: string, at: [number, number], length: number, hole: number, needs: string[] = [], punch?: [string, string]): EncItem => ({
  id,
  kind: 'screw',
  label,
  at,
  screw: { length, hole },
  needs,
  ...(punch ? { punch } : {}),
});

export const ENCLOSURES: Record<string, EnclosureDef> = {
  dl12: {
    color: '#e9e6df',
    items: [
      screw('s1', 'Base screw (front left)', [6, 58], 6, 6, [], ['3V3', 'GND']),
      screw('s2', 'Base screw (front right)', [94, 58], 6, 6, [], ['5V', 'GND']),
      screw('s3', 'Neck screw (left)', [6, 6], 10, 10),
      screw('s4', 'Neck screw (right)', [94, 6], 10, 10),
      { id: 'base', kind: 'shell', label: 'Base cover', at: [50, 32], size: [100, 64], needs: ['s1', 's2', 's3', 's4'], covers: true },
    ],
  },
  boompuck: {
    color: '#2f6f8f',
    items: [
      { id: 'feet', kind: 'adhesive', label: 'Rubber base pad', at: [45, 32], size: [70, 46] },
      screw('s1', 'Base screw 1', [8, 8], 8, 8, ['feet']),
      screw('s2', 'Base screw 2', [82, 8], 8, 8, ['feet']),
      screw('s3', 'Base screw 3', [8, 56], 5, 5, ['feet'], ['3V3', 'GND']),
      screw('s4', 'Base screw 4', [82, 56], 5, 5, ['feet'], ['3V3', 'GND']),
      { id: 'shell', kind: 'shell', label: 'Bottom shell', at: [45, 32], size: [90, 64], needs: ['s1', 's2', 's3', 's4'], covers: true },
      { id: 'spk', kind: 'cable', label: 'Speaker plug', at: [56, 58], module: 'SPK1', needs: ['shell'] },
      { id: 'bat', kind: 'cable', label: 'Battery plug', at: [48, 6], module: 'BT1', needs: ['shell'] },
    ],
  },
  viewmax: {
    color: '#2b2b2e',
    items: [
      { id: 'back', kind: 'clips', label: 'Rear cover', at: [60, 36], size: [120, 72] },
      screw('s1', 'Shield screw 1', [6, 6], 6, 6, ['back'], ['3V3', 'GND']),
      screw('s2', 'Shield screw 2', [114, 6], 6, 6, ['back']),
      screw('s3', 'Shield screw 3', [6, 66], 10, 10, ['back']),
      screw('s4', 'Shield screw 4', [114, 66], 10, 10, ['back']),
      { id: 'led', kind: 'cable', label: 'Backlight cable', at: [96, 41], module: 'LB1', needs: ['back'] },
      { id: 'shield', kind: 'shield', label: 'Metal shield', at: [60, 36], size: [114, 66], needs: ['s1', 's2', 's3', 's4'], covers: true },
      { id: 'hs', kind: 'heatsink', label: 'FET heatsink', at: [61, 46], size: [18, 14], chip: 'Q1', needs: ['shield'] },
    ],
  },
  sbox: {
    color: '#1d1f1d',
    items: [
      { id: 'sticker', kind: 'sticker', label: 'Warranty sticker', at: [100, 64] },
      screw('c1', 'Case screw (rear left)', [4, 66], 12, 12, ['sticker']),
      screw('c2', 'Case screw (rear right)', [106, 66], 12, 12, ['sticker']),
      { id: 'top', kind: 'clips', label: 'Top case', at: [55, 35], size: [110, 70], needs: ['c1', 'c2'] },
      screw('s1', 'Shield screw 1', [8, 4], 5, 5, ['top'], ['3V3_SB', 'GND']),
      screw('s2', 'Shield screw 2', [102, 4], 5, 5, ['top'], ['5V_SB', 'GND']),
      screw('s3', 'Shield screw 3', [8, 60], 12, 12, ['top']),
      screw('s4', 'Shield screw 4', [102, 60], 12, 12, ['top']),
      { id: 'shield', kind: 'shield', label: 'Metal shield', at: [55, 33], size: [104, 62], needs: ['s1', 's2', 's3', 's4'], covers: true },
      { id: 'hs', kind: 'heatsink', label: 'Power FET heatsink', at: [31, 46], size: [20, 14], chip: 'Q1', needs: ['shield'] },
    ],
  },
  button: {
    color: '#3a3d44',
    items: [
      screw('s1', 'Back screw (top left)', [4, 4], 6, 6, []),
      screw('s2', 'Back screw (top right)', [116, 4], 6, 6, []),
      screw('s3', 'Back screw (bottom left)', [4, 68], 4, 4, [], ['3V3', 'GND']),
      screw('s4', 'Back screw (bottom right)', [116, 68], 4, 4, [], ['3V3', 'GND']),
      { id: 'back', kind: 'shell', label: 'Back shell', at: [60, 36], size: [120, 72], needs: ['s1', 's2', 's3', 's4'], covers: true },
      { id: 'bat', kind: 'cable', label: 'Battery plug', at: [55, 6], module: 'BT1', needs: ['back'] },
      { id: 'lcd', kind: 'cable', label: 'Screen ribbon', at: [68, 52], module: 'LCD1', latch: true, needs: ['back'] },
    ],
  },
  fs5: {
    color: '#f2f2f0',
    items: [
      { id: 'sticker', kind: 'sticker', label: 'Warranty sticker', at: [130, 80] },
      { id: 'side', kind: 'clips', label: 'Side panels', at: [70, 43], size: [140, 86], needs: ['sticker'] },
      { id: 'fanc', kind: 'cable', label: 'Fan cable', at: [24, 76], needs: ['side'] },
      { id: 'fan', kind: 'fan', label: 'Cooling fan', at: [22, 64], size: [30, 30], needs: ['fanc'] },
      screw('s1', 'Shield screw 1', [4, 4], 6, 6, ['side'], ['3V3', 'GND']),
      screw('s2', 'Shield screw 2', [136, 4], 6, 6, ['side'], ['3V3', 'GND']),
      screw('s3', 'Shield screw 3', [4, 82], 6, 6, ['side'], ['IN_VIN', 'GND']),
      screw('s4', 'Shield screw 4', [136, 82], 6, 6, ['side'], ['3V3', 'GND']),
      screw('s5', 'Heatsink screw (long)', [94, 30], 15, 15, ['side']),
      screw('s6', 'Heatsink screw (long)', [118, 30], 15, 15, ['side']),
      { id: 'shield', kind: 'shield', label: 'Metal shield', at: [70, 43], size: [134, 80], needs: ['fan', 's1', 's2', 's3', 's4', 's5', 's6'], covers: true },
      { id: 'hs', kind: 'heatsink', label: 'APU heatsink', at: [106, 18], size: [30, 24], chip: 'U3', needs: ['shield'] },
    ],
  },
};
