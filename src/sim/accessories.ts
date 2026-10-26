/**
 * Chargers and cables, and what a USB meter reads through them: which voltage they negotiate and how
 * much current gets through. Chargers differ in what they offer, cables in how much they carry.
 */
import type { DeviceDef } from './board';

export interface Charger {
  id: string;
  name: string;
  /** Voltages it offers (5 V always; higher ones are fast-charge levels). */
  offers: number[];
  /** Current it can give at 5 V (A). */
  maxA5: number;
  /** Power it can give at higher voltages (W). */
  maxW: number;
  /** A customer's own charger that has gone bad. */
  bad?: boolean;
}

export interface Cable {
  id: string;
  name: string;
  /** Most current it carries (A). */
  limitA: number;
  /** Round-trip resistance (Ω): the voltage dropped is current × this. */
  ohms: number;
  /** Carries an e-marker chip (needed for 20 V / big currents). */
  emarked: boolean;
  /** A customer's own cable that has gone bad. */
  bad?: boolean;
}

export const CHARGERS: Charger[] = [
  { id: 'bench-pd', name: 'Bench PD charger (20 W)', offers: [5, 9, 15], maxA5: 3, maxW: 20 },
  { id: 'block-24', name: '2.4 A USB block', offers: [5], maxA5: 2.4, maxW: 12 },
  { id: 'old-1a', name: 'Old 1 A block', offers: [5], maxA5: 1, maxW: 5 },
  { id: 'cheap-fast', name: 'Cheap "fast" charger', offers: [5, 9], maxA5: 1.5, maxW: 11 },
  { id: 'pd-65', name: 'PD 65 W laptop charger', offers: [5, 9, 15, 20], maxA5: 3, maxW: 65 },
  { id: 'customer-weak', name: "Customer's charger", offers: [5], maxA5: 0.12, maxW: 0.6, bad: true },
  { id: 'customer-dead', name: "Customer's charger", offers: [5], maxA5: 0, maxW: 0, bad: true },
];

export const CABLES: Cable[] = [
  { id: 'good', name: 'Good cable', limitA: 3, ohms: 0.12, emarked: false },
  { id: 'cheap', name: 'Cheap thin cable', limitA: 1, ohms: 0.55, emarked: false },
  { id: 'emark', name: 'E-marked 100 W cable', limitA: 5, ohms: 0.08, emarked: true },
  { id: 'customer-frayed', name: "Customer's cable", limitA: 0.25, ohms: 1.8, emarked: false, bad: true },
  { id: 'customer-open', name: "Customer's cable", limitA: 0, ohms: 50, emarked: false, bad: true },
];

/** What a replacement costs the customer. */
export const ACCESSORY_PRICE = { charger: 18, cable: 9 };

export const charger = (id: string): Charger => CHARGERS.find((c) => c.id === id) ?? CHARGERS[0];
export const cable = (id: string): Cable => CABLES.find((c) => c.id === id) ?? CABLES[0];

/** The highest voltage the device asks its charger for (5 = it cannot fast-charge). */
export function devicePd(device: DeviceDef): number {
  if (device.input.pd) return device.input.pd;
  const conn = device.components.find((c) => c.ref === device.input.ref);
  return conn && conn.partNo === 'J-USBC' ? 9 : 5;
}

/** Does the device charge from a USB charger and cable (as opposed to a barrel jack)? */
export function usesUsbCharger(device: DeviceDef): boolean {
  const conn = device.components.find((c) => c.ref === device.input.ref);
  return !!conn && (conn.partNo === 'J-USBC' || conn.partNo === 'J-MUSB');
}

export interface ChargePath {
  /** Negotiated voltage at the charger (V). */
  negotiated: number;
  /** Voltage reaching the device after the cable's drop (V). */
  volts: number;
  amps: number;
  watts: number;
  limitedBy: 'device' | 'charger' | 'cable';
  /** Plain-language reading of what limits it. */
  note: string;
}

/**
 * What the meter shows with this charger and cable on a device whose own appetite at 5 V is `need5A`.
 * `pd` is the highest voltage the device will negotiate (5 if it cannot).
 */
export function chargePath(need5A: number, pd: number, ch: Charger, cb: Cable): ChargePath {
  if (ch.maxA5 <= 0 || cb.limitA <= 0) return { negotiated: 5, volts: 0, amps: 0, watts: 0, limitedBy: ch.maxA5 <= 0 ? 'charger' : 'cable', note: ch.maxA5 <= 0 ? 'The charger puts out nothing at all.' : 'The cable is open: nothing gets through.' };
  // Negotiate: the highest level both ends support (20 V needs an e-marked cable)
  const levels = ch.offers.filter((v) => v <= pd && (v < 20 || cb.emarked));
  const negotiated = Math.max(5, ...levels);
  const want = need5A * 5 * (negotiated > 5 ? 1.6 : 1);
  const chargerW = negotiated > 5 ? ch.maxW : ch.maxA5 * 5;
  const cableW = cb.limitA * negotiated;
  let watts = want;
  let limitedBy: ChargePath['limitedBy'] = 'device';
  if (chargerW < watts) {
    watts = chargerW;
    limitedBy = 'charger';
  }
  if (cableW < watts) {
    watts = cableW;
    limitedBy = 'cable';
  }
  const amps = watts / negotiated;
  const volts = Math.max(0, negotiated - amps * cb.ohms);
  const note =
    limitedBy === 'charger'
      ? `The charger cannot give more than ${chargerW.toFixed(1)} W, so the current is held down.`
      : limitedBy === 'cable'
        ? 'The cable is the bottleneck: thin wire limits the current and drops the voltage.'
        : negotiated > 5
          ? `Fast-charging at ${negotiated} V.`
          : pd > 5
            ? 'Charging at 5 V: this charger does not fast-charge, or the device and charger failed to negotiate.'
            : 'Charging at 5 V.';
  return { negotiated, volts, amps, watts: volts * amps, limitedBy, note };
}
