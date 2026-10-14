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
  bes: {
    color: '#c9c6bd',
    items: [
      screw('s1', 'Bottom screw 1', [6, 6], 12, 12),
      screw('s2', 'Bottom screw 2', [144, 6], 12, 12),
      screw('s3', 'Bottom screw 3', [6, 94], 12, 12),
      screw('s4', 'Bottom screw 4', [144, 94], 12, 12),
      screw('s5', 'Bottom screw (short) 5', [70, 6], 6, 6, [], ['5V', 'GND']),
      screw('s6', 'Bottom screw (short) 6', [70, 94], 6, 6, [], ['5V', 'GND']),
      { id: 'top', kind: 'shell', label: 'Top shell', at: [75, 50], size: [150, 100], needs: ['s1', 's2', 's3', 's4', 's5', 's6'], covers: true },
    ],
  },
  b64: {
    color: '#2c2c30',
    items: [
      ...[[6, 6], [144, 6], [6, 94], [144, 94]].map(([x, y], i) => ({ ...screw(`s${i + 1}`, `Security screw ${i + 1}`, [x, y] as [number, number], 12, 12), security: true })),
      { id: 'top', kind: 'shell', label: 'Top shell', at: [75, 50], size: [150, 100], needs: ['s1', 's2', 's3', 's4'], covers: true },
      { id: 'shield', kind: 'shield', label: 'Heat-spreader shield', at: [75, 52], size: [140, 90], needs: ['top'], covers: true },
    ],
  },
  'b64-cart': {
    color: '#55575c',
    items: [
      { ...screw('s1', 'Security screw', [45, 30], 10, 10), security: true },
      { id: 'shell', kind: 'clips', label: 'Cartridge shell', at: [45, 32], size: [90, 64], needs: ['s1'], covers: true },
    ],
  },
  vega: {
    color: '#1b1b1d',
    items: [
      ...[[6, 6], [144, 6], [6, 94], [144, 94], [70, 6]].map(([x, y], i) => screw(`s${i + 1}`, `Bottom screw ${i + 1}`, [x, y] as [number, number], 10, 10)),
      screw('s6', 'Bottom screw (short) 6', [70, 94], 6, 6, [], ['5V', 'GND']),
      { id: 'top', kind: 'shell', label: 'Top shell', at: [75, 50], size: [150, 100], needs: ['s1', 's2', 's3', 's4', 's5', 's6'], covers: true },
    ],
  },
  'vega-cart': {
    color: '#202022',
    items: [
      screw('s1', 'Cartridge screw', [45, 30], 8, 8),
      { id: 'shell', kind: 'clips', label: 'Cartridge shell', at: [45, 32], size: [90, 64], needs: ['s1'], covers: true },
    ],
  },
  paltari: {
    color: '#6b4a2b',
    items: [
      ...[[6, 6], [144, 6], [6, 94], [144, 94]].map(([x, y], i) => screw(`s${i + 1}`, `Bottom screw ${i + 1}`, [x, y] as [number, number], 14, 14)),
      { id: 'top', kind: 'shell', label: 'Woodgrain top', at: [75, 50], size: [150, 100], needs: ['s1', 's2', 's3', 's4'], covers: true },
      { id: 'shield', kind: 'shield', label: 'RF shield', at: [75, 55], size: [130, 70], needs: ['top'], covers: true },
    ],
  },
  'paltari-cart': {
    color: '#1e1e1e',
    items: [{ id: 'shell', kind: 'clips', label: 'Cartridge shell (snap-together)', at: [45, 32], size: [90, 64], covers: true }],
  },
  ...Object.fromEntries(
    (['db', 'db-pocket', 'db-color', 'dba'] as const).map((id) => [
      id,
      {
        color: id === 'db' ? '#c9c7bd' : id === 'db-color' ? '#6c3fa8' : id === 'dba' ? '#4c3a8f' : '#b9b9b9',
        items: [
          { id: 'cover', kind: 'clips', label: 'Battery cover', at: [75, 66], size: [56, 26] },
          { ...screw('s1', 'Back screw (top left)', [6, 6], 6, 6), security: true },
          { ...screw('s2', 'Back screw (top right)', [124, 6], 6, 6), security: true },
          screw('s3', 'Back screw (bottom left)', [6, 74], 6, 6),
          screw('s4', 'Back screw (bottom right)', [124, 74], 6, 6),
          { id: 'back', kind: 'shell', label: 'Back shell', at: [65, 40], size: [130, 80], needs: ['cover', 's1', 's2', 's3', 's4'], covers: true },
          { id: 'lcd', kind: 'cable', label: 'Screen ribbon', at: [25, 40], module: 'LCD1', latch: true, needs: ['back'] },
          { id: 'spk', kind: 'cable', label: 'Speaker plug', at: [116, 46], module: 'SPK1', needs: ['back'] },
        ],
      } satisfies EnclosureDef,
    ]),
  ),
  ...Object.fromEntries(
    (['dba-sp', 'dba-micro'] as const).map((id) => [
      id,
      {
        color: id === 'dba-sp' ? '#2b4d8f' : '#9a9a9a',
        items: [
          { ...screw('s1', 'Tri-wing screw 1', [6, 6], 4, 4, [], ['VCC', 'GND']), security: true },
          { ...screw('s2', 'Tri-wing screw 2', [124, 6], 4, 4), security: true },
          screw('s3', 'Back screw 3', [6, 74], 6, 6),
          screw('s4', 'Back screw 4', [124, 74], 6, 6),
          { id: 'back', kind: 'shell', label: 'Back shell', at: [65, 40], size: [130, 80], needs: ['s1', 's2', 's3', 's4'], covers: true },
          { id: 'bat', kind: 'cable', label: 'Battery plug', at: [72, 50], module: 'BT1', needs: ['back'] },
          { id: 'lcd', kind: 'cable', label: 'Screen ribbon', at: [25, 40], module: 'LCD1', latch: true, needs: ['back'] },
          { id: 'spk', kind: 'cable', label: 'Speaker plug', at: [116, 46], module: 'SPK1', needs: ['back'] },
        ],
      } satisfies EnclosureDef,
    ]),
  ),
  'db-cart': {
    color: '#8e8d87',
    items: [
      { ...screw('s1', 'Security screw', [45, 30], 6, 6), security: true },
      { id: 'shell', kind: 'clips', label: 'Cartridge shell', at: [45, 32], size: [90, 64], needs: ['s1'], covers: true },
    ],
  },
  'dba-cart': {
    color: '#3a3a3c',
    items: [
      { ...screw('s1', 'Tri-wing screw', [45, 30], 5, 5), security: true },
      { id: 'shell', kind: 'clips', label: 'Cartridge shell', at: [45, 32], size: [90, 64], needs: ['s1'], covers: true },
    ],
  },
  dualpulse: {
    color: '#e8e8ec',
    items: [
      screw('s1', 'Back screw (left grip)', [8, 56], 6, 6),
      screw('s2', 'Back screw (right grip)', [102, 56], 6, 6),
      screw('s3', 'Back screw (top left)', [30, 6], 6, 6),
      screw('s4', 'Back screw (top right)', [96, 6], 4, 4, [], ['VCC', 'GND']),
      { id: 'back', kind: 'clips', label: 'Back shell', at: [55, 32], size: [110, 64], needs: ['s1', 's2', 's3', 's4'], covers: true },
      { id: 'bat', kind: 'cable', label: 'Battery plug', at: [14, 34], module: 'BT1', needs: ['back'] },
      { id: 'tp', kind: 'cable', label: 'Touchpad ribbon', at: [56, 12], module: 'TPAD1', latch: true, needs: ['back'] },
    ],
  },
  'sbox-pad': {
    color: '#2a2b2d',
    items: [
      { id: 'cover', kind: 'clips', label: 'Battery door', at: [30, 30], size: [56, 34] },
      { ...screw('s1', 'Security screw (under the label)', [55, 6], 8, 8), security: true },
      screw('s2', 'Grip screw (left)', [8, 56], 8, 8),
      screw('s3', 'Grip screw (right)', [102, 56], 8, 8),
      { id: 'back', kind: 'clips', label: 'Back shell', at: [55, 32], size: [110, 64], needs: ['cover', 's1', 's2', 's3'], covers: true },
    ],
  },
  'button-grip': {
    color: '#2e86c9',
    items: [
      { ...screw('s1', 'Tri-wing screw 1', [6, 6], 4, 4), security: true },
      { ...screw('s2', 'Tri-wing screw 2', [104, 6], 4, 4), security: true },
      { ...screw('s3', 'Tri-wing screw 3', [6, 58], 4, 4, [], ['VCC', 'GND']), security: true },
      { ...screw('s4', 'Tri-wing screw 4', [104, 58], 4, 4), security: true },
      { id: 'back', kind: 'shell', label: 'Back shell', at: [55, 32], size: [110, 64], needs: ['s1', 's2', 's3', 's4'], covers: true },
      { id: 'bat', kind: 'adhesive', label: 'Glued-in battery', at: [24, 46], size: [34, 20], needs: ['back'] },
    ],
  },
  ...Object.fromEntries(
    (
      [
        ['button-lite', '#d9c84a', true],
        ['rb35', '#7a5fb3', false],
        ['rogue-pal', '#2b2b2b', false],
        ['duo-ixl', '#3d3f8f', true],
        ['duo-3dxl', '#8f2b2b', true],
        ['duo-lite', '#e6e6ea', true],
      ] as const
    ).map(([id, color, security]) => [
      id,
      {
        color,
        items: [
          { ...screw('s1', 'Back screw 1', [6, 6], 4, 4), security },
          { ...screw('s2', 'Back screw 2', [154, 6], 4, 4), security },
          screw('s3', 'Back screw 3', [6, 94], 6, 6),
          screw('s4', 'Back screw 4', [154, 94], 3, 3, [], ['3V3', 'GND']),
          { id: 'back', kind: 'clips', label: 'Back shell', at: [80, 50], size: [160, 100], needs: ['s1', 's2', 's3', 's4'], covers: true },
          { id: 'bat', kind: 'cable', label: 'Battery plug', at: [40, 32], module: 'BT1', needs: ['back'] },
          { id: 'lcd', kind: 'cable', label: 'Screen ribbon', at: [40, 46], module: 'LCD1', latch: true, needs: ['back'] },
          { id: 'spk', kind: 'cable', label: 'Speaker plug', at: [116, 62], module: 'SPK1', needs: ['back'] },
        ],
      } satisfies EnclosureDef,
    ]),
  ),
  ...Object.fromEntries(
    (['game-clock', 'critter-mini'] as const).map((id) => [
      id,
      {
        color: id === 'game-clock' ? '#b8b3a6' : '#e7a8c0',
        items: [
          { id: 'door', kind: 'clips', label: 'Battery door', at: [14, 26], size: [24, 22] },
          { ...screw('s1', 'Back screw 1', [4, 4], 5, 5), security: id === 'critter-mini' },
          screw('s2', 'Back screw 2', [86, 4], 5, 5),
          screw('s3', 'Back screw 3', [86, 52], 5, 5),
          { id: 'back', kind: 'shell', label: 'Back cover', at: [45, 28], size: [90, 56], needs: ['door', 's1', 's2', 's3'], covers: true },
        ],
      } satisfies EnclosureDef,
    ]),
  ),
  'bes-cart': {
    color: '#8d8c88',
    items: [
      { ...screw('s1', 'Security screw', [45, 30], 10, 10), security: true },
      { id: 'shell', kind: 'clips', label: 'Cartridge shell', at: [45, 32], size: [90, 64], needs: ['s1'], covers: true },
    ],
  },
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
      { id: 'hs', kind: 'heatsink', label: 'APU heatsink', at: [106, 18], size: [30, 24], chip: 'U3', lm: true, needs: ['shield'] },
    ],
  },
};
