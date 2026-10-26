/**
 * The "look into the port" window: the board is tipped up on its edge so you see straight into a USB or HDMI
 * port, with a light. Debris and bent contacts are drawn here (they cannot be seen from above), and the cleaning
 * tools are used from this window. Pure HTML; the HUD wires the buttons.
 */
import type { Session } from '../game/session';
import { debrisLevel, portClear } from '../sim/portclean';
import { CORROSION_RGB, crustAt } from '../sim/corrosion';
import { part, pinsOf } from '../sim/parts';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** Small deterministic generator so the debris sits in the same places every time you look. */
function seeded(text: string): () => number {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const TOOL_BTNS: [string, string, string, string][] = [
  ['tweezers', 'tweezers', '🪛 Tweezers', 'Pull lint and fluff out'],
  ['pick', 'pick-tool', '📍 Pick', 'Break packed grime loose'],
  ['blower', 'air-blower', '🌬 Air blower', 'Blow loose dust out'],
  ['swab', '', '🧽 Swab', 'Wipe loose dust out (uses a swab)'],
];

/** Microscope state for the port view: lens zoom (1..) and the ring light. */
export interface ScopeOpts {
  zoom: number;
  ring: boolean;
}

export function portViewHtml(s: Session, ref: string, message = '', scope: ScopeOpts = { zoom: 1, ring: false }): string {
  const c = s.board.comps[ref];
  const p = c.part ?? part(c.def.partNo);
  const pkg = p.pkg;
  const rnd = seeded(`${ref}:${s.job.seed}`);
  const d = c.debris;
  const bent = c.bent ?? [];
  const pins = pinsOf(p).filter((n) => n !== 'SHLD' && n !== 'GND2');
  const W = 360;
  const H = pkg === 'HDMI' ? 150 : 120;

  // Housing
  const housing =
    pkg === 'HDMI'
      ? `<path d="M20 30 H340 V92 L322 120 H38 L20 92 Z" fill="#26303b" stroke="#8b99a8" stroke-width="3"/>`
      : pkg === 'MUSB'
        ? `<path d="M50 38 H310 L330 62 V84 H30 V62 Z" fill="#26303b" stroke="#8b99a8" stroke-width="3"/>`
        : `<rect x="30" y="36" width="300" height="52" rx="26" fill="#26303b" stroke="#8b99a8" stroke-width="3"/>`;

  // Contacts: one row for USB, two rows for HDMI
  const rows = pkg === 'HDMI' ? 2 : 1;
  const perRow = Math.ceil(pins.length / rows);
  let contacts = '';
  pins.forEach((pin, i) => {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    const x = 56 + (col + 0.5) * ((W - 112) / perRow);
    const y = pkg === 'HDMI' ? 52 + row * 34 : 62;
    const isBent = bent.includes(pin);
    contacts += isBent
      ? `<g><rect x="${x - 4}" y="${y + 6}" width="14" height="4" rx="2" fill="#c9a24a" transform="rotate(-18 ${x} ${y + 8})"/><circle cx="${x + 12}" cy="${y + 4}" r="2" fill="#e0463f"/></g>`
      : `<rect x="${x - 3}" y="${y - 8}" width="6" height="${pkg === 'HDMI' ? 18 : 24}" rx="2" fill="#e2bf5a"/>`;
  });

  // Corrosion crust on the contacts (liquid damage): speckles in the spill's colours
  let crust = '';
  const corrPins = new Set<string>();
  pins.forEach((pin, i) => {
    const lv = crustAt(c, pin) || (c.marks.includes('corrosion') && !c.corr ? 0.3 : 0);
    if (lv < 0.05) return;
    corrPins.add(pin);
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    const x = 56 + (col + 0.5) * ((W - 112) / perRow);
    const y = pkg === 'HDMI' ? 52 + row * 34 : 62;
    const rgb = CORROSION_RGB[c.corr?.color ?? 'green'];
    const rgb2 = CORROSION_RGB[(['green', 'white', 'yellow', 'purple', 'black'] as const)[Math.floor(rnd() * 5)]];
    for (let k = 0; k < 4 + Math.round(lv * 12); k++) {
      const col2 = rnd() < 0.6 ? rgb : rgb2;
      crust += `<circle cx="${(x + (rnd() - 0.5) * 12).toFixed(1)}" cy="${(y + (rnd() - 0.3) * 22).toFixed(1)}" r="${(1 + rnd() * 2.6 * (0.5 + lv)).toFixed(1)}" fill="rgb(${col2[0]},${col2[1]},${col2[2]})" opacity="${(0.55 + 0.4 * rnd()).toFixed(2)}"/>`;
    }
  });

  // Debris
  let junk = '';
  if (d) {
    for (let i = 0; i < Math.round(d.lint * 9); i++) {
      const x = 60 + rnd() * (W - 120);
      const y = 48 + rnd() * (H - 90);
      junk += `<g stroke="#b9bcc2" stroke-width="1.6" fill="none" opacity="0.9"><path d="M${x} ${y} q8 -10 14 2 q6 10 -3 14 q-9 3 -10 -8"/><path d="M${x + 4} ${y + 4} q10 -4 12 8"/></g>`;
    }
    for (let i = 0; i < Math.round(d.packed * 8); i++) {
      const x = 50 + rnd() * (W - 110);
      const y = 56 + rnd() * 26;
      junk += `<rect x="${x}" y="${y}" width="${16 + rnd() * 22}" height="${7 + rnd() * 6}" rx="3" fill="#2d2519" opacity="0.92"/>`;
    }
    for (let i = 0; i < Math.round(d.loose * 22); i++) {
      junk += `<circle cx="${50 + rnd() * (W - 100)}" cy="${44 + rnd() * (H - 70)}" r="${0.8 + rnd() * 1.6}" fill="#8f8a80" opacity="0.8"/>`;
    }
  }

  const lvl = debrisLevel(d);
  const seen: string[] = [];
  if (d && d.lint > 0.05) seen.push('grey fluff and lint');
  if (d && d.packed > 0.05) seen.push('dark grime packed onto the contacts');
  if (d && d.loose > 0.05) seen.push('loose dust and crumbs');
  if (corrPins.size) seen.push(`green, white and dark crust on ${corrPins.size === 1 ? 'a contact' : `${corrPins.size} contacts`} (liquid damage)`);
  if (bent.length) seen.push(`${bent.length > 1 ? 'contacts' : 'a contact'} bent flat (${bent.join(', ')})`);
  const verdict = bent.length
    ? 'A bent contact cannot be straightened without breaking it: this port has to be replaced.'
    : corrPins.size
      ? 'Corrosion on the contacts: liquid got in. Treat the board with corrosion cleaner, scrub and rinse it, then clean the port.'
      : portClear(c) && lvl < 0.03
      ? 'Spotless. A cable will seat properly now.'
      : lvl >= 0.05
        ? 'Still dirty. Work through it with the tools below.'
        : 'Almost clean.';

  const btn = ([how, toolId, label, tip]: (typeof TOOL_BTNS)[number]) => {
    const own = how === 'swab' ? s.shop.supplies.swabs >= 1 : s.owns(toolId);
    const lock = own ? '' : ` disabled title="${how === 'swab' ? 'Out of swabs' : 'You do not have this tool yet (Equipment tab)'}"`;
    return `<button data-pv-clean="${how}" title="${esc(tip)}"${lock}>${label}</button>`;
  };

  const z = Math.max(1, Math.min(4, scope.zoom));
  const bright = scope.ring ? 1.25 : 0.82;
  return `<h2>🔬 Microscope: end view of ${esc(ref)} <span class="muted">· ${esc(p.label)}</span></h2>
    <p class="muted small">${(0.7 * z).toFixed(1)}× lens view · wheel zooms · <kbd>L</kbd> ring light ${scope.ring ? 'on' : 'off'} (the ring light shows fine crust and bent contacts) ${s.guided ? '· The board must be off.' : ''}</p>
    <div class="portview scope"><div class="eyepiece" style="filter:brightness(${bright})"><svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Looking into the port through the microscope" style="transform:scale(${z});transform-origin:50% 50%">
      <rect width="${W}" height="${H}" fill="#0d1218"/>${housing}${contacts}${crust}${junk}
    </svg></div></div>
    ${s.guided || seen.length ? `<p class="small">${seen.length ? `You can see ${seen.join(', ')}.` : 'The contacts are bright and clear.'} <b>${esc(verdict)}</b></p>` : ''}
    ${message ? `<p class="note">${esc(message)}</p>` : ''}
    <div class="row">${TOOL_BTNS.map(btn).join('')}</div>
    <div class="row"><button data-pv-ring>${scope.ring ? '💡 Ring light off' : '💡 Ring light on'}</button><button class="primary" data-pv-back>↩ Back to the pads</button></div>`;
}
