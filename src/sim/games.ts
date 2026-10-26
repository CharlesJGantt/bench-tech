/**
 * The game library: every game / media title in the world (cartridges, cards, discs), loaded from
 * `src/data/games.json` (built by `tools/build-games.py` from the library CSV). Pure: no DOM.
 *
 * Each game has a platform (`BES`, `FS5`, `SB1X`...), a medium (cart, SD, disc...), a genre, a reference value
 * and a rarity. Art (a label for the cartridge / disc and a loading screen) lives under `public/games/<art>/`.
 */
import data from '../data/games.json';

export interface Game {
  sku: string;
  /** Platform id (BES, B64, FS5...). */
  platform: string;
  title: string;
  genre: string;
  /** Reference value in dollars (a typical copy in good condition). */
  value: number;
  rarity: 'Common' | 'Uncommon' | 'Scarce' | 'Rare' | 'Very Rare' | 'Collector' | 'Grail';
  /** Price multiplier for the rarity. */
  rarityMult: number;
  /** The same game on several platforms shares this id (and its artwork). */
  crossId: string;
  /** Art folder under games/ ("bes/pipe-brothers"). */
  art: string;
  /** Already in the game before the full library. */
  original: boolean;
  collector: boolean;
}

export interface PlatformInfo {
  id: string;
  name: string;
  /** Name of the physical media ("BES Game Pak", "FS5 Game Disc"). */
  media: string;
  /** cart, microSD, SD, CD, DVD, Blu-ray, UHD-BD, miniCD, miniDVD. */
  medium: string;
}

type Raw = { sku: string; p: string; t: string; g: string; v: number; r: string; m: number; x: string; a: string; c: number; hv: number };

export const GAMES: Game[] = (data.games as Raw[]).map((g) => ({
  sku: g.sku,
  platform: g.p,
  title: g.t,
  genre: g.g,
  value: g.v,
  rarity: g.r as Game['rarity'],
  rarityMult: g.m,
  crossId: g.x,
  art: g.a,
  original: !!g.c,
  collector: !!g.hv,
}));

export const PLATFORMS: PlatformInfo[] = Object.entries(data.platforms as Record<string, { name: string; media: string; medium: string }>).map(([id, p]) => ({ id, ...p }));

const byPlatform = new Map<string, Game[]>();
for (const g of GAMES) (byPlatform.get(g.platform) ?? byPlatform.set(g.platform, []).get(g.platform)!).push(g);

/** Every game for a platform, in catalog order. */
export const gamesOn = (platform: string): Game[] => byPlatform.get(platform) ?? [];

export const platformInfo = (id: string): PlatformInfo | undefined => PLATFORMS.find((p) => p.id === id);

/** Games usable as `{ name, value }` titles (carts and discs of a device). */
export const titlesOf = (platform: string): { name: string; value: number }[] => gamesOn(platform).map((g) => ({ name: g.title, value: g.value }));

/** Which library platform a device's media belongs to (devices that take games). */
export const DEVICE_PLATFORM: Record<string, string> = {
  bes: 'BES',
  b64: 'B64',
  vega: 'VEGA',
  paltari: 'PALT',
  db: 'DB',
  'db-pocket': 'DB',
  'db-color': 'DB',
  dba: 'DBA',
  'dba-sp': 'DBA',
  'dba-micro': 'DBA',
  'button-lite': 'BUTTON',
  rb35: 'RB35',
  fs5: 'FS5',
  sbox: 'SB1X',
};

export const gameBySku = (sku: string): Game | undefined => GAMES.find((g) => g.sku === sku);
export const gameByTitle = (platform: string, title: string): Game | undefined => gamesOn(platform).find((g) => g.title === title);

/** URLs of a game's artwork (under public/games), or null when it has none. */
export function gameArt(g: Game | undefined, kind: 'label' | 'loading'): string | null {
  if (!g?.art) return null;
  return `${import.meta.env?.BASE_URL ?? '/'}games/${g.art}/${kind}.webp`;
}
