/**
 * Ball grid array package types: the ten chip types the game knows. Each has a laser-cut stencil (one per type) with the
 * ball size and a chip code etched on it. No imports: parts, footprints and the BGA model all read this table.
 */
export type BgaPkg = 'BGA36' | 'BGA64' | 'BGA100' | 'BGA144' | 'BGA169' | 'BGA196' | 'BGA256' | 'BGA324' | 'BGA400' | 'BGA484';

export interface BgaType {
  pkg: BgaPkg;
  /** The ball grid is n x n. */
  n: number;
  /** Ball pitch (mm) and ball diameter (mm). */
  pitch: number;
  ballMm: number;
  /** Code etched on the stencil. */
  code: string;
}

export const BGA_TYPES: BgaType[] = [
  { pkg: 'BGA36', n: 6, pitch: 1.0, ballMm: 0.5, code: 'BG-36A' },
  { pkg: 'BGA64', n: 8, pitch: 0.8, ballMm: 0.4, code: 'BG-64B' },
  { pkg: 'BGA100', n: 10, pitch: 0.8, ballMm: 0.4, code: 'BG-100C' },
  { pkg: 'BGA144', n: 12, pitch: 0.65, ballMm: 0.3, code: 'BG-144D' },
  { pkg: 'BGA169', n: 13, pitch: 0.8, ballMm: 0.45, code: 'BG-169E' },
  { pkg: 'BGA196', n: 14, pitch: 0.8, ballMm: 0.45, code: 'BG-196F' },
  { pkg: 'BGA256', n: 16, pitch: 1.0, ballMm: 0.6, code: 'BG-256G' },
  { pkg: 'BGA324', n: 18, pitch: 0.8, ballMm: 0.45, code: 'BG-324H' },
  { pkg: 'BGA400', n: 20, pitch: 1.0, ballMm: 0.6, code: 'BG-400J' },
  { pkg: 'BGA484', n: 22, pitch: 0.65, ballMm: 0.3, code: 'BG-484K' },
];

export const bgaType = (pkg: string): BgaType | undefined => BGA_TYPES.find((t) => t.pkg === pkg);

/** Ball diameters that exist (supplies of balls come in these sizes). */
export const BALL_SIZES = [0.3, 0.4, 0.45, 0.5, 0.6] as const;

/** Row-major ball names: A1, A2... (letters for rows, numbers for columns). */
export function ballNames(n: number): string[] {
  const out: string[] = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) out.push(`${String.fromCharCode(65 + r)}${c + 1}`);
  return out;
}

/** Is this grid position on the outer ring? (the ring carries signals and power; the inside is a ground array) */
export const onRing = (n: number, r: number, c: number): boolean => r === 0 || c === 0 || r === n - 1 || c === n - 1;
