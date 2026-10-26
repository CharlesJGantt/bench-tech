/**
 * Ball grid array package types: twelve stencil types (laser-cut stainless), three ball sizes (four stencils per size) and
 * 24 chips, two per package. A stencil fits every chip whose code is etched on it; the balls must match the ball size etched beside it. No imports: parts, footprints and the BGA model all read this table.
 */
export type BgaPkg =
  | 'BGA64' | 'BGA100' | 'BGA144' | 'BGA196'
  | 'BGA36' | 'BGA81' | 'BGA169' | 'BGA256'
  | 'BGA49' | 'BGA121' | 'BGA225' | 'BGA324';

/** The three solder ball diameters (mm). Balls are bought by size. */
export const BALL_SIZES = [0.3, 0.45, 0.6] as const;
export type BallSize = (typeof BALL_SIZES)[number];

export interface BgaType {
  pkg: BgaPkg;
  /** The ball grid is n x n. */
  n: number;
  /** Ball pitch (mm) and ball diameter (mm, one of BALL_SIZES). */
  pitch: number;
  ballMm: BallSize;
  /** Stencil id etched on the stencil. The stencil also lists the codes of every chip it fits (see BGA_CHIPS). */
  stencil: string;
}

const T = (pkg: BgaPkg, n: number, ballMm: BallSize, stencil: string): BgaType => ({
  pkg,
  n,
  ballMm,
  // simplified pitches so the board router can escape the outer ring
  pitch: ballMm === 0.3 ? 0.8 : ballMm === 0.45 ? 1.0 : 1.2,
  stencil,
});

/** Twelve stencil types, four per ball size. */
export const BGA_TYPES: BgaType[] = [
  T('BGA64', 8, 0.3, 'ST-01'),
  T('BGA100', 10, 0.3, 'ST-02'),
  T('BGA144', 12, 0.3, 'ST-03'),
  T('BGA196', 14, 0.3, 'ST-04'),
  T('BGA36', 6, 0.45, 'ST-05'),
  T('BGA81', 9, 0.45, 'ST-06'),
  T('BGA169', 13, 0.45, 'ST-07'),
  T('BGA256', 16, 0.45, 'ST-08'),
  T('BGA49', 7, 0.6, 'ST-09'),
  T('BGA121', 11, 0.6, 'ST-10'),
  T('BGA225', 15, 0.6, 'ST-11'),
  T('BGA324', 18, 0.6, 'ST-12'),
];

/**
 * The BGA chips the game knows (24, two per package). A stencil fits every chip of its package, so one stencil serves
 * more than one chip; the chip code is the chip's marking.
 */
export const BGA_CHIPS: { code: string; pkg: BgaPkg }[] = [
  { code: 'MC-064', pkg: 'BGA64' }, { code: 'MC-065', pkg: 'BGA64' },
  { code: 'MX-100', pkg: 'BGA100' }, { code: 'MX-101', pkg: 'BGA100' },
  { code: 'PH-144', pkg: 'BGA144' }, { code: 'PH-145', pkg: 'BGA144' },
  { code: 'TB-196', pkg: 'BGA196' }, { code: 'TB-197', pkg: 'BGA196' },
  { code: 'RP-Z1', pkg: 'BGA36' }, { code: 'RP-Z2', pkg: 'BGA36' },
  { code: 'AU-081', pkg: 'BGA81' }, { code: 'AU-082', pkg: 'BGA81' },
  { code: 'GP-169', pkg: 'BGA169' }, { code: 'GP-170', pkg: 'BGA169' },
  { code: 'CN-256', pkg: 'BGA256' }, { code: 'CN-257', pkg: 'BGA256' },
  { code: 'PM-049', pkg: 'BGA49' }, { code: 'PM-050', pkg: 'BGA49' },
  { code: 'RM-121', pkg: 'BGA121' }, { code: 'RM-122', pkg: 'BGA121' },
  { code: 'XG-225', pkg: 'BGA225' }, { code: 'XG-226', pkg: 'BGA225' },
  { code: 'ML-324', pkg: 'BGA324' }, { code: 'ML-325', pkg: 'BGA324' },
];

/** Chip codes a stencil fits. */
export const stencilChips = (t: BgaType): string[] => BGA_CHIPS.filter((c) => c.pkg === t.pkg).map((c) => c.code);

/** The stencil type that fits a chip code. */
export const stencilForChip = (code: string): BgaType | undefined => {
  const c = BGA_CHIPS.find((x) => x.code === code);
  return c ? bgaType(c.pkg) : undefined;
};

export const bgaType = (pkg: string): BgaType | undefined => BGA_TYPES.find((t) => t.pkg === pkg);

/** Text etched on a stencil: stencil id, the chip codes it fits, and the ball size. */
export const stencilLabel = (t: BgaType): string => `${t.stencil}  ${stencilChips(t).join(' / ')}  ${t.ballMm.toFixed(2)} mm`;

/** Row-major ball names: A1, A2... (letters for rows, numbers for columns). */
export function ballNames(n: number): string[] {
  const out: string[] = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) out.push(`${String.fromCharCode(65 + r)}${c + 1}`);
  return out;
}

/** Is this grid position on the outer ring? (the ring carries signals and power; the inside is a ground array) */
export const onRing = (n: number, r: number, c: number): boolean => r === 0 || c === 0 || r === n - 1 || c === n - 1;
