import { measure, type MeterReading, type PointRef } from '../sim/circuit';
import type { Session } from './session';

/** Nets joined by copper traces count as one logical net. */
function logicalNet(s: Session, net: string): string {
  for (const t of s.board.device.traces) if (t.b === net) return t.a;
  return net;
}

const fmtV = (v: number) => `${v.toFixed(v < 10 ? 2 : 1)} V`;

/**
 * Guided-mode explanation of a meter reading, in plain language.
 * Aims to teach the reasoning, not to name the faulty part.
 */
export function explainReading(s: Session, r: MeterReading, red: PointRef, black: PointRef): string {
  const dev = s.board.device;
  const netR = s.board.comps[red.ref].def.pins[red.pin];
  const netB = s.board.comps[black.ref].def.pins[black.pin];
  const powered = s.power.kind !== 'off';
  const sameComp = red.ref === black.ref && red.pin !== black.pin;
  const c = s.board.comps[red.ref];
  const p = c.part;
  const ok = (t: string) => `✓ ${t}`;
  const bad = (t: string) => `✗ ${t}`;

  if (r.mode === 'esr') {
    if (powered) return 'Use the ESR meter with the power OFF (and big capacitors discharged).';
    if (!(sameComp && p && (p.kind === 'capacitor' || p.kind === 'electrolytic'))) return 'The ESR meter is for capacitors: put one probe on each pad of a capacitor.';
    if (r.value === null) return bad('No reading — this capacitor looks open (or is not making contact).');
    if (r.value > 2) return bad(`ESR ${r.value.toFixed(1)} Ω is far too high. This capacitor has dried out — it still "measures" fine on a multimeter, but it cannot smooth the rail any more. Replace it.`);
    const dc = measure(s.board, { kind: 'off' }, 'ohm', red, black);
    if (r.value < 0.003 || (dc.value !== null && dc.value < 5)) return bad('It conducts DC as well — that is a short, not a healthy capacitor. Confirm in Ω mode.');
    return ok(`ESR ${r.value.toFixed(2)} Ω — healthy for this kind of capacitor.`);
  }

  // ---------------------------------------------------------------- across one part
  if (sameComp && p && r.mode !== 'dcv') {
    if (powered) return 'Resistance and diode tests only make sense with the power OFF.';
    switch (p.kind) {
      case 'fuse':
        return r.value !== null && r.value < 1 ? ok('A good fuse reads close to 0 Ω.') : bad('A fuse should read close to 0 Ω. This one is open — it has blown.');
      case 'resistor': {
        if (r.mode === 'diode') return 'Use the Ω setting to check resistors.';
        const nominal = p.value;
        if (r.value === null || r.value > nominal * 1.15)
          return bad(`${red.ref} is a ${p.description.split(',')[0]} (marked "${p.marking}"). In-circuit it may read LOWER than that because of other parts, but never higher. This one reads high → it is open/damaged.`);
        return ok(`${red.ref} is a ${p.description.split(',')[0]} (marked "${p.marking}"). In-circuit readings can be a bit lower than the marked value — that is normal.`);
      }
      case 'capacitor':
      case 'electrolytic':
        if (r.value !== null && r.value < 10 && r.mode !== 'diode') return bad('A capacitor should NOT read a few ohms. This one looks shorted (or something else on the same rail is).');
        return 'Capacitors block DC, so a healthy one reads high (or climbs as it charges).';
      case 'led':
      case 'diode':
      case 'tvs':
      case 'zener':
      case 'cob': {
        if (r.mode !== 'diode') return 'Switch to diode mode (⏵|) to test diodes and LEDs.';
        const fwd = red.pin === 'A';
        if (r.value !== null && r.value < 0.05) return bad('Reads like a dead short in diode mode — this part has failed short (or something in parallel is shorted).');
        if (p.kind === 'cob') return 'The lamp LED needs about 9 V to light — more than a meter puts out — so it reads OL either way. Test it by powering the board instead.';
        if (fwd) {
          if (r.value === null) return bad(`Red on the anode, black on the cathode should show a forward drop (${p.kind === 'led' ? 'about 2–3 V, and the LED glows faintly' : 'about 0.3–0.8 V'}). OL means it is open — or installed backwards.`);
          return ok(`Forward drop of ${r.display} V — ${p.kind === 'led' ? 'normal for an LED' : 'normal for a diode'}.`);
        }
        return r.value === null ? ok('Reverse direction: OL is what a good diode shows.') : bad('A diode should block in this direction (OL). It conducts → leaky or shorted.');
      }
      case 'nmos':
      case 'pmos': {
        const pins = new Set([red.pin, black.pin]);
        if (pins.has('D') && pins.has('S')) {
          if (r.value !== null && r.value < 0.05) return bad('Drain to source reads ~0 — this MOSFET is shorted.');
          return 'Drain–source: one direction shows the built-in body diode (~0.5 V), the other should be OL. Near 0 both ways = shorted.';
        }
        return 'Gate pins should not read as a short to anything.';
      }
      default:
        break;
    }
  }

  // ---------------------------------------------------------------- same logical net
  if (logicalNet(s, netR) === logicalNet(s, netB) && red.ref + red.pin !== black.ref + black.pin) {
    if (r.mode === 'continuity' || r.mode === 'ohm') {
      if (powered) return 'Turn the power OFF before testing continuity.';
      return r.value !== null && r.value < 2
        ? ok(`Both points are on the same connection (${netR}) and they are connected.`)
        : bad(`Both points should be connected (${netR}) but they are not — a broken trace or a cracked solder joint is in between.`);
    }
    if (r.mode === 'dcv' && powered && r.value !== null && Math.abs(r.value) > 0.3)
      return bad(`These two points should be the same connection, yet there is ${fmtV(Math.abs(r.value))} between them — the link between them is broken.`);
  }

  // ---------------------------------------------------------------- rail checks against ground
  if (logicalNet(s, netB) === 'GND' && netR !== 'GND') {
    const info = dev.nets[netR];
    const desc = info?.desc ?? netR;
    if (r.mode === 'dcv') {
      if (!powered) return 'The board has no power. Voltage checks need power — plug something in first.';
      if (info?.expected === undefined || r.value === null) return `${desc}.`;
      const exp = info.expected;
      const v = r.value;
      if (exp > 0.5 && Math.abs(v - exp) <= exp * 0.12) return ok(`${desc}: expect about ${fmtV(exp)} — looks normal.`);
      if (exp > 0.5 && v < 0.15) return bad(`${desc}: should be about ${fmtV(exp)} but it is missing. Work backwards toward where this voltage comes from.`);
      if (exp > 0.5 && v < exp) return bad(`${desc}: should be about ${fmtV(exp)} but it is low. Something is dragging it down, or its source is struggling.`);
      if (v > exp * 1.15 + 0.2) return bad(`${desc}: should be about ${fmtV(exp)} but it is too HIGH. That can damage parts!`);
      return `${desc}: expect about ${fmtV(exp)}.`;
    }
    if (r.mode === 'ohm' || r.mode === 'continuity') {
      if (powered) return 'Turn the power OFF before measuring resistance — readings on a live board are meaningless.';
      if (r.value !== null && r.value < 5) return bad(`${desc} reads almost 0 Ω to ground — it is SHORTED. Something on this connection is failing. Try injecting a little voltage with the PSU and see what heats up.`);
      if (r.value !== null && r.value < 100) return bad(`${desc} reads quite low to ground — suspicious.`);
      return ok(`${desc}: no short to ground.`);
    }
  }
  if (logicalNet(s, netR) === 'GND' && r.mode === 'diode' && netB !== 'GND') {
    if (powered) return 'Diode mode only works with the power OFF.';
    const desc = dev.nets[netB]?.desc ?? netB;
    if (r.value !== null && r.value < 0.05) return bad(`${desc}: reads ~0 in diode mode from ground — shorted.`);
    if (r.value !== null) return ok(`${desc}: a reading of roughly 0.3–0.8 is a normal "diode-to-ground" value for a rail.`);
    return `${desc}: OL from ground.`;
  }

  if (r.mode === 'dcv' && !powered) return 'No power is connected, so every voltage reads 0.';
  return '';
}

export interface UsbMeterReading {
  volts: number;
  amps: number;
  watts: number;
  /** Plain-language reading of what the numbers mean. */
  verdict: string;
  ok: boolean;
}

/**
 * What a USB power meter between the charger and the device shows, and what it means.
 * A healthy charge pulls a steady few hundred mA or more at about 5 V; no draw means the
 * power never gets in; a trickle means charging is stuck; a collapsed voltage means a short.
 */
export function usbMeterReading(volts: number, amps: number): UsbMeterReading {
  const v = Math.max(0, volts);
  const a = Math.max(0, amps);
  const base = { volts: v, amps: a, watts: v * a };
  if (v < 3.5 && a > 0.05) return { ...base, ok: false, verdict: 'The voltage collapses as soon as it is plugged in: something is shorted, and the charger is limiting its current. Look for a hot part or a failed capacitor.' };
  if (a < 0.005) return { ...base, ok: false, verdict: 'Nothing is drawn at all. The power is not getting in: check the port, the input fuse and the charger chip, or the device may simply be full.' };
  if (a < 0.1) return { ...base, ok: false, verdict: 'Only a trickle. Charging is stuck at a low current: a deeply discharged or worn battery, a weak charger chip, or a poor contact in the path.' };
  return { ...base, ok: true, verdict: 'Charging normally: a healthy current at about 5 V.' };
}
