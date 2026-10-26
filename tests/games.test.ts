import { describe, expect, it } from 'vitest';
import { DEVICES } from '../src/sim/devices';
import { DEVICE_PLATFORM, GAMES, gameArt, gamesOn, PLATFORMS, titlesOf } from '../src/sim/games';

describe('game library', () => {
  it('loads the whole catalog with unique SKUs on 28 platforms', () => {
    expect(GAMES).toHaveLength(1396);
    expect(new Set(GAMES.map((g) => g.sku)).size).toBe(1396);
    expect(PLATFORMS).toHaveLength(28);
    expect(GAMES.every((g) => g.value > 0 && g.title && g.art)).toBe(true);
  });

  it('keeps the 34 titles that were already in the game', () => {
    const originals = GAMES.filter((g) => g.original);
    expect(originals).toHaveLength(34);
    const titles = (p: string) => originals.filter((g) => g.platform === p).map((g) => g.title);
    expect(titles('BES')).toEqual(expect.arrayContaining(['Pipe Brothers', 'Duck Blaster', 'Mega Bolt Man', 'Castle Climber']));
    expect(titles('FS5')).toHaveLength(5);
    expect(titles('SB1X')).toEqual(expect.arrayContaining(['Ironclad Frontier', 'Apex Drift X', 'Zombie Harvest 3', 'Starfarer Legacy', 'Blitz Arena 2026']));
  });

  it('cartridge and disc devices use the library titles', () => {
    for (const dev of Object.keys(DEVICE_PLATFORM)) expect(DEVICES[dev], dev).toBeTruthy();
    const cartTitles = Object.values(DEVICES).filter((d) => d.cartFor).map((d) => d.titles!.length);
    expect(cartTitles.every((n) => n >= 49)).toBe(true);
    expect(DEVICES.fs5.discTitles).toHaveLength(gamesOn('FS5').length);
    expect(DEVICES.sbox.discTitles!.map((t) => t.name)).toContain('Starfarer Legacy');
    expect(titlesOf('BES').length).toBe(53);
  });

  it('games released on several platforms share one id', () => {
    const shared = GAMES.filter((g) => g.crossId === GAMES.find((x) => x.title === 'Pipe Brothers')!.crossId);
    expect(shared.length).toBeGreaterThanOrEqual(1);
    expect(gameArt(GAMES[0], 'label')).toMatch(/games\/.+\/label\.webp$/);
    expect(gameArt(undefined, 'label')).toBeNull();
  });
});
