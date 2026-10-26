import type { DeviceDef } from '../board';
import { BOOMPUCK } from './boompuck';
import { BUTTON } from './button';
import { DL12 } from './dl12';
import { FS5 } from './fs5';
import { SBOX } from './sbox';
import { VIEWMAX } from './viewmax';
import { BES, BES_CART } from './bes';
import { GALAXY_RAID } from './galaxyraid';
import { CRITTER_MINI, GAME_CLOCK } from './lcdgames';
import { BUTTON_LITE, DUO_3DXL, DUO_IXL, DUO_LITE, RB35, ROGUE_PAL } from './handhelds';
import { BUTTON_GRIP, DUALPULSE, SBOX_PAD } from './controllers';
import { DB_CART, DBA_CART, DREAMBOY, DREAMBOY_ADVANCE, DREAMBOY_COLOR, DREAMBOY_MICRO, DREAMBOY_POCKET, DREAMBOY_SP } from './dreamboy';
import { B64, B64_CART, PALTARI, PALTARI_CART, VEGA, VEGA_CART } from './consoles3';
import { ENCLOSURES } from '../enclosures';
import { PAD_VARIANTS } from '../padfaults';
import { RIBBON_TORN, ribbonSlots } from '../ribbonfaults';
import { SCREEN_CRACKED, screenRefs } from '../screenfaults';

/** Every device the shop can see, by id. */
export const DEVICES: Record<string, DeviceDef> = {
  [DL12.id]: DL12,
  [BOOMPUCK.id]: BOOMPUCK,
  [VIEWMAX.id]: VIEWMAX,
  [SBOX.id]: SBOX,
  [BUTTON.id]: BUTTON,
  [FS5.id]: FS5,
  [BES.id]: BES,
  [BES_CART.id]: BES_CART,
  [B64.id]: B64,
  [B64_CART.id]: B64_CART,
  [VEGA.id]: VEGA,
  [VEGA_CART.id]: VEGA_CART,
  [PALTARI.id]: PALTARI,
  [PALTARI_CART.id]: PALTARI_CART,
  [DREAMBOY.id]: DREAMBOY,
  [DREAMBOY_POCKET.id]: DREAMBOY_POCKET,
  [DREAMBOY_COLOR.id]: DREAMBOY_COLOR,
  [DREAMBOY_ADVANCE.id]: DREAMBOY_ADVANCE,
  [DREAMBOY_SP.id]: DREAMBOY_SP,
  [DREAMBOY_MICRO.id]: DREAMBOY_MICRO,
  [DB_CART.id]: DB_CART,
  [DBA_CART.id]: DBA_CART,
  [DUALPULSE.id]: DUALPULSE,
  [SBOX_PAD.id]: SBOX_PAD,
  [BUTTON_GRIP.id]: BUTTON_GRIP,
  [BUTTON_LITE.id]: BUTTON_LITE,
  [RB35.id]: RB35,
  [ROGUE_PAL.id]: ROGUE_PAL,
  [DUO_IXL.id]: DUO_IXL,
  [DUO_3DXL.id]: DUO_3DXL,
  [DUO_LITE.id]: DUO_LITE,
  [GAME_CLOCK.id]: GAME_CLOCK,
  [CRITTER_MINI.id]: CRITTER_MINI,
  [GALAXY_RAID.id]: GALAXY_RAID,
};

export const DEVICE_LIST: DeviceDef[] = Object.values(DEVICES);

// Every device comes in a case, and any board can suffer pad and trace damage.
for (const d of DEVICE_LIST) {
  d.enclosure ??= ENCLOSURES[d.id];
  if (!d.variants.some((v) => v.id === 'pad-lifted') && !d.id.endsWith('_cart')) d.variants.push(...PAD_VARIANTS);
  if (!d.variants.some((v) => v.id === 'ribbon-torn') && d.enclosure && ribbonSlots(d).length) d.variants.push(RIBBON_TORN);
  if (!d.variants.some((v) => v.id === 'screen-cracked') && screenRefs(d).length && !d.id.startsWith('db')) d.variants.push(SCREEN_CRACKED); // (the Dream Boy owner test never looks at the glass itself)
}

export { B64, B64_CART, PALTARI, PALTARI_CART, VEGA, VEGA_CART, BES, BES_CART, BOOMPUCK, BUTTON, DL12, FS5, SBOX, VIEWMAX };
