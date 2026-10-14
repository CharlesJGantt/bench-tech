import type { DeviceDef } from '../board';
import { BOOMPUCK } from './boompuck';
import { BUTTON } from './button';
import { DL12 } from './dl12';
import { FS5 } from './fs5';
import { SBOX } from './sbox';
import { VIEWMAX } from './viewmax';
import { BES, BES_CART } from './bes';
import { DB_CART, DBA_CART, DREAMBOY, DREAMBOY_ADVANCE, DREAMBOY_COLOR, DREAMBOY_MICRO, DREAMBOY_POCKET, DREAMBOY_SP } from './dreamboy';
import { B64, B64_CART, PALTARI, PALTARI_CART, VEGA, VEGA_CART } from './consoles3';
import { ENCLOSURES } from '../enclosures';

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
};

export const DEVICE_LIST: DeviceDef[] = Object.values(DEVICES);

// Every device comes in a case.
for (const d of DEVICE_LIST) d.enclosure ??= ENCLOSURES[d.id];

export { B64, B64_CART, PALTARI, PALTARI_CART, VEGA, VEGA_CART, BES, BES_CART, BOOMPUCK, BUTTON, DL12, FS5, SBOX, VIEWMAX };
