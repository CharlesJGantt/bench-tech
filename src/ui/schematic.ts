import type { DeviceDef } from '../sim/board';
import { part } from '../sim/parts';

/** Simplified power-tree schematic for the DL-12, plus a parts list by block. */
export function schematicHtml(dev: DeviceDef, guided: boolean): string {
  const box = (x: number, y: number, w: number, h: number, title: string, sub: string, cls = '') =>
    `<g class="sb ${cls}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/><text x="${x + w / 2}" y="${y + 20}" class="t">${title}</text><text x="${x + w / 2}" y="${y + 38}" class="s">${sub}</text></g>`;
  const arrow = (x1: number, y1: number, x2: number, y2: number, label = '') =>
    `<line class="ar" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" marker-end="url(#ah)"/>${label ? `<text class="lbl" x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 7}">${label}</text>` : ''}`;
  const tp = (x: number, y: number, name: string, v: string) => `<g class="tp"><circle cx="${x}" cy="${y}" r="6"/><text x="${x}" y="${y + 20}">${name}${guided ? ` · ${v}` : ''}</text></g>`;

  const svg = `<svg viewBox="0 0 980 360" class="schem" role="img" aria-label="DL-12 power tree">
  <defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>
  ${box(10, 40, 110, 52, 'J1 DC jack', '12 V in')}
  ${arrow(120, 66, 160, 66)}
  ${tp(140, 66, 'TP1', '12V')}
  ${box(160, 40, 100, 52, 'F1 fuse', '1 A')}
  ${arrow(260, 66, 300, 66)}
  ${box(300, 40, 130, 52, 'Q1 + D2, R1', 'reverse protection')}
  ${box(300, 120, 130, 46, 'D1 TVS → GND', 'surge clamp', 'side')}
  <line class="ln" x1="280" y1="66" x2="280" y2="143"/><line class="ln" x1="280" y1="143" x2="300" y2="143"/>
  ${arrow(430, 66, 480, 66, '12V_SYS')}
  ${tp(455, 90, 'TP2', '12V')}
  ${box(480, 40, 140, 52, 'U1 buck + L1', 'R4/R5 set 5 V')}
  ${box(480, 120, 140, 46, 'R2/R3 → EN', 'enable divider', 'side')}
  <line class="ln" x1="550" y1="92" x2="550" y2="120"/>
  ${arrow(620, 66, 670, 66, '5V')}
  ${tp(645, 90, 'TP3', '5V')}
  ${box(670, 40, 130, 52, 'U2 LDO', '3.3 V')}
  ${box(670, 120, 130, 46, 'D4 power LED', 'via R8', 'side')}
  <line class="ln" x1="655" y1="66" x2="655" y2="143"/><line class="ln" x1="655" y1="143" x2="670" y2="143"/>
  ${arrow(800, 66, 840, 66, '3V3')}
  ${tp(820, 90, 'TP4', '3.3V')}
  ${box(840, 40, 130, 52, 'U3 MCU', 'R6 reset, R7+SW1')}
  ${box(840, 120, 130, 46, 'D6 status LED', 'via R13', 'side')}
  <line class="ln" x1="905" y1="92" x2="905" y2="120"/>
  <line class="ln" x1="905" y1="166" x2="905" y2="260"/>
  ${arrow(905, 260, 640, 260, 'LAMP signal (R11)')}
  ${box(500, 232, 140, 56, 'Q2 lamp switch', 'low-side MOSFET')}
  ${arrow(455, 92, 455, 232)}
  ${box(330, 232, 140, 56, 'R10 → LED1 lamp', '≈100 mA from 12V_SYS')}
  ${arrow(470, 260, 500, 260)}
  ${box(560 - 70, 310, 140, 40, 'GND', '', 'gnd')}
  <line class="ln" x1="570" y1="288" x2="570" y2="310"/>
  </svg>`;

  const diagram = dev.id === 'dl12' ? svg : blockMap(dev, guided);

  const blocks = new Map<string, string[]>();
  for (const c of dev.components) {
    const p = part(c.partNo);
    if (p.kind === 'testpoint') continue;
    const row = `<tr><td><b>${c.ref}</b></td><td>${p.label}</td><td>${c.role}</td><td class="mono">${p.marking || '—'}</td></tr>`;
    if (!blocks.has(c.block)) blocks.set(c.block, []);
    blocks.get(c.block)!.push(row);
  }
  const tables = [...blocks]
    .map(([name, rows]) => `<h4>${name}</h4><table class="bom"><tr><th>Ref</th><th>Value</th><th>Job</th><th>Marking</th></tr>${rows.join('')}</table>`)
    .join('');
  const tps = dev.testPoints.map((t) => `<tr><td><b>${t.ref}</b></td><td>${t.net}</td><td>${t.expected}</td></tr>`).join('');

  return `<h2>${dev.name} — service sheet</h2>
  <p class="muted">${dev.id === 'dl12' ? 'Power flows left to right.' : 'Board map: each block sits where it is on the board.'} Each block needs the one feeding it. When something is dead, find the first block whose output is missing.</p>
  ${diagram}
  <div class="cols"><div><h3>Test points</h3><table class="bom"><tr><th>TP</th><th>Net</th><th>Expect</th></tr>${tps}</table></div>
  <div><h3>Parts list</h3>${tables}</div></div>`;
}

/** Generic board map: the device's functional blocks at their real positions, with test points and expected readings. */
function blockMap(dev: DeviceDef, guided: boolean): string {
  const W = 980;
  const k = W / dev.width;
  const H = Math.round(dev.height * k);
  const rects = dev.blocks
    .map(
      (b) =>
        `<g class="sb"><rect x="${b.x * k}" y="${b.y * k}" width="${b.w * k}" height="${b.h * k}" rx="6"/><text x="${(b.x + b.w / 2) * k}" y="${b.y * k + 22}" class="t">${b.name}</text></g>`,
    )
    .join('');
  const tps = dev.testPoints
    .map((t) => {
      const c = dev.components.find((x) => x.ref === t.ref);
      if (!c) return '';
      return `<g class="tp"><circle cx="${c.x * k}" cy="${c.y * k}" r="6"/><text x="${c.x * k}" y="${c.y * k + 20}">${t.ref}${guided ? ` · ${t.expected}` : ''}</text></g>`;
    })
    .join('');
  const io = [dev.input.ref, ...dev.components.filter((c) => part(c.partNo).kind === 'connector' && c.ref !== dev.input.ref).map((c) => c.ref)]
    .map((ref) => {
      const c = dev.components.find((x) => x.ref === ref)!;
      return `<text class="lbl" x="${c.x * k}" y="${c.y * k + 4}">◆ ${ref}</text>`;
    })
    .join('');
  return `<svg viewBox="-10 -10 ${W + 20} ${H + 20}" class="schem" role="img" aria-label="${dev.name} board map">
  <rect x="0" y="0" width="${W}" height="${H}" rx="10" class="board-outline" fill="none" stroke="currentColor" stroke-opacity="0.25"/>
  ${rects}${io}${tps}</svg>`;
}
