/**
 * Oscilloscope model. The circuit solver is DC (averaged), so the scope view is derived
 * from the operating point plus what each active part would be doing: a running buck
 * switches its SW node, a working retimer streams data, an amp plays audio, and a rail
 * whose output capacitor has dried out (high ESR) rides a big ripple.
 */
import { capsOn, netGroup, type BoardState, type CompState, type OperatingPoint, type PointRef } from './circuit';

export type WaveKind = 'flat' | 'ripple' | 'square' | 'data' | 'clock' | 'audio';

export interface Waveform {
  kind: WaveKind;
  /** Average (DC) level, V. */
  vdc: number;
  /** Peak-to-peak, V. */
  vpp: number;
  /** Human-readable frequency, or '' for DC. */
  freq: string;
  /** Plain-language description of what is on the screen. */
  note: string;
}

const alive = (c: CompState | undefined): c is CompState =>
  !!c?.part && !c.unplugged && !(c.fault && ['dead', 'short', 'open', 'melted'].includes(c.fault.type));

const pinNet = (c: CompState, pin: string) => c.def.pins[pin];

/** What the scope shows on the net under the probe (ground clip on board ground). */
export function scopeAt(b: BoardState, op: OperatingPoint | null, p: PointRef): Waveform {
  const c = b.comps[p.ref];
  const net = c?.def.pins[p.pin];
  if (!op || !op.powered || !net) return { kind: 'flat', vdc: 0, vpp: 0, freq: '', note: 'Flat line at 0 V — the board is not powered.' };
  const vdc = op.at(p);
  const group = netGroup(b, net);
  const v = (n: string) => op.net(n);

  for (const x of Object.values(b.comps)) {
    if (!alive(x)) continue;
    const k = x.part!.kind;
    if ((k === 'buck' || k === 'boost') && group.has(pinNet(x, 'SW'))) {
      const vin = k === 'buck' ? v(pinNet(x, 'IN')) : v(pinNet(x, 'OUT'));
      const en = v(pinNet(x, 'EN'));
      if (en > 1.2 && v(pinNet(x, k === 'buck' ? 'IN' : 'VIN')) > (k === 'buck' ? 4.3 : 2.5))
        return { kind: 'square', vdc, vpp: vin, freq: '500 kHz', note: `Switching square wave, 0 → ${vin.toFixed(1)} V — ${x.ref} is running.` };
    }
    if (k === 'retimer') {
      const on = v(pinNet(x, 'VCC')) > 2.8 && v(pinNet(x, 'EN')) > 1.2 && v(pinNet(x, 'IN')) > 1.5;
      for (const o of ['D0', 'D1', 'D2', 'CK']) {
        const n = pinNet(x, o);
        if (on && group.has(n) && !x.joints[o]?.cracked && (x.joints[o]?.r ?? 0) !== Infinity)
          return o === 'CK'
            ? { kind: 'clock', vdc, vpp: 0.8, freq: '297 MHz', note: 'Clean video clock from the retimer.' }
            : { kind: 'data', vdc, vpp: 0.8, freq: '5.9 Gb/s', note: 'Fast video data from the retimer — an "eye" pattern.' };
      }
    }
    if (k === 'amp') {
      const on = v(pinNet(x, 'VDD')) > 2.6 && v(pinNet(x, 'EN')) > 1.2;
      if (on && (group.has(pinNet(x, 'OUTP')) || group.has(pinNet(x, 'OUTN'))))
        return { kind: 'audio', vdc, vpp: Math.min(6, v(pinNet(x, 'VDD')) * 0.8), freq: '1 kHz', note: 'Audio: the amp is playing its test tone.' };
    }
    if (k === 'mcu' && b.device.firmware?.ref === x.ref && b.mcu.running) {
      for (const [pin, n] of Object.entries(x.def.pins)) {
        if (!/^VID|DATA|CLK/.test(pin) || !group.has(n)) continue;
        if (vdc > 1.5) return { kind: 'data', vdc, vpp: 3.3, freq: '5.9 Gb/s', note: `Video data leaving the ${x.part!.label}.` };
      }
    }
  }
  // Retimer input fed from the processor
  for (const x of Object.values(b.comps)) {
    if (x.part?.kind === 'retimer' && group.has(pinNet(x, 'IN')) && vdc > 1.5)
      return { kind: 'data', vdc, vpp: 3.3, freq: '5.9 Gb/s', note: 'Video data arriving at the retimer input.' };
  }
  // A rail with a dried-out capacitor: the regulator oscillates.
  if (capsOn(b, net).some((x) => x.fault?.type === 'esr' && !x.unplugged) && vdc > 0.5)
    return { kind: 'ripple', vdc, vpp: Math.min(vdc * 0.5, 1.6), freq: '≈30 kHz', note: 'Big ripple on this rail — the regulator is unstable. A dried-out capacitor (high ESR) is the usual cause.' };
  return { kind: 'flat', vdc, vpp: 0.01, freq: '', note: Math.abs(vdc) < 0.05 ? 'Flat line at 0 V — no signal here.' : `Steady DC, ${vdc.toFixed(2)} V. No signal on this net.` };
}
