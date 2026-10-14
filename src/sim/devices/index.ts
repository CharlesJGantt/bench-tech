import type { DeviceDef } from '../board';
import { BOOMPUCK } from './boompuck';
import { BUTTON } from './button';
import { DL12 } from './dl12';
import { FS5 } from './fs5';
import { SBOX } from './sbox';
import { VIEWMAX } from './viewmax';
import { ENCLOSURES } from '../enclosures';

/** Every device the shop can see, by id. */
export const DEVICES: Record<string, DeviceDef> = {
  [DL12.id]: DL12,
  [BOOMPUCK.id]: BOOMPUCK,
  [VIEWMAX.id]: VIEWMAX,
  [SBOX.id]: SBOX,
  [BUTTON.id]: BUTTON,
  [FS5.id]: FS5,
};

export const DEVICE_LIST: DeviceDef[] = Object.values(DEVICES);

// Every device comes in a case.
for (const d of DEVICE_LIST) d.enclosure ??= ENCLOSURES[d.id];

export { BOOMPUCK, BUTTON, DL12, FS5, SBOX, VIEWMAX };
