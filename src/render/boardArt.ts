import type { DeviceDef } from '../sim/board';
import type { BoardState } from '../sim/circuit';
import { bodyRect, padsOf, type PadWorld } from '../sim/footprints';
import { part } from '../sim/parts';
import { cachedRoute, routeKey } from './routeCache';
import { routeBoard, type Segment, type TraceGeom } from './router';

export const PX = 20; // texture pixels per millimetre

/** Board silkscreen branding (all fictional): title, revision line, maker. */
const SILK: Record<string, [string, string, string]> = {
  dl12: ['BRIGHTLINE  DL-12', 'MAIN BOARD  REV C   2024-11   12V 0.5A', 'BRIGHTLINE LIGHTING CO.'],
  boompuck: ['BOOMPUCK  MINI', 'BP-M1 MAIN  REV B   5V USB', 'BOOMPUCK AUDIO'],
  viewmax: ['VIEWMAX  24', 'VM24-PS  PWR/SCALER  REV A   19V 3A', 'VIEWMAX DISPLAYS'],
  sbox: ['SBOX ONE X', 'SBX-PD1  POWER DIST  REV 2   12V', 'SBOX HARDWARE GROUP'],
  button: ['BUTTON', 'BTN-M01  MAIN  REV 3   5V USB-C', 'BUTTON CONSOLES'],
  fs5: ['FUNSTATION 5', 'FS5-MB  HDMI/APU  REV 1.1   12V', 'FUN INTERACTIVE ENT.'],
};

function silkOf(dev: DeviceDef): [string, string, string] {
  return SILK[dev.id] ?? [dev.name.toUpperCase(), 'MAIN BOARD', ''];
}

/** First spot (mm) where a w×h label fits without covering parts or pads. */
function freeSpot(dev: DeviceDef, pads: PadWorld[], w: number, h: number): { x: number; y: number } {
  const rects = [...dev.components.map((c) => bodyRect(c)), ...pads.map((p) => ({ x: p.x - p.w / 2, y: p.y - p.h / 2, w: p.w, h: p.h }))];
  const hit = (x: number, y: number) => rects.some((r) => x < r.x + r.w + 1 && x + w + 1 > r.x && y < r.y + r.h + 1 && y + h + 1 > r.y);
  for (let y = 2; y + h < dev.height - 2; y += 1) for (let x = 3; x + w < dev.width - 3; x += 1) if (!hit(x, y)) return { x, y };
  return { x: 8, y: 2 };
}

const COL = {
  mask: '#15532d',
  pour: '#2a7e49',
  copper: '#45a868',
  pad: '#cfd3d6',
  padShade: '#a9aeb3',
  gold: '#d8b25a',
  silk: '#f1f1ea',
  fr4: '#9a7a46',
  via: '#b9bec3',
};

const POWER_NETS = new Set(['VIN_J', 'VIN_F', '12V_SYS', '12V_BUCK', 'SW', '5V', '5V_LDO', '3V3', '3V3_MCU', 'LAMP_A', 'LAMP_K']);

export type { Segment, TraceGeom } from './router';

/** Pre-computed copper geometry for a device (routing is deterministic). */
export interface BoardGeometry {
  pads: PadWorld[];
  segments: Segment[];
  traces: TraceGeom[];
  vias: { x: number; y: number }[];
  failures: string[];
}

/** Trace width per net (mm): power nets are wide. */
export const traceWidth = (net: string) => (POWER_NETS.has(net) ? 0.8 : 0.35);

/** Copper for a device: from the pre-routed cache when it is current, else routed live. */
export function buildGeometry(device: DeviceDef, opts: { live?: boolean } = {}): BoardGeometry {
  if (!opts.live) {
    const hit = cachedRoute(device, routeKey(device, traceWidth));
    if (hit) return hit;
  }
  return routeBoard(device, traceWidth);
}

// ---------------------------------------------------------------------------

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function blob(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, inner: string, outer: string) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function strokeSegs(ctx: CanvasRenderingContext2D, segs: Segment[], color: string, extra: number) {
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const s of segs) {
    ctx.lineWidth = (s.width + extra) * PX;
    ctx.beginPath();
    ctx.moveTo(s.x1 * PX, s.y1 * PX);
    ctx.lineTo(s.x2 * PX, s.y2 * PX);
    ctx.stroke();
  }
}

function padPath(ctx: CanvasRenderingContext2D, p: PadWorld, grow = 0) {
  const w = (p.w + grow) * PX;
  const h = (p.h + grow) * PX;
  ctx.beginPath();
  if (p.round) ctx.ellipse(p.x * PX, p.y * PX, w / 2, h / 2, 0, 0, Math.PI * 2);
  else ctx.roundRect(p.x * PX - w / 2, p.y * PX - h / 2, w, h, Math.min(w, h) * 0.15);
}

/** Paint the board top layer for the current state. */
export function drawBoard(canvas: HTMLCanvasElement, b: BoardState, geo: BoardGeometry): void {
  const dev = b.device;
  canvas.width = dev.width * PX;
  canvas.height = dev.height * PX;
  const ctx = canvas.getContext('2d')!;
  const W = canvas.width;
  const H = canvas.height;
  const lifted = new Set(b.liftedPads);
  const rand = rng(1234);
  // Plug-in module contacts are on cables, not on the PCB.
  const pads = geo.pads.filter((p) => !p.module);

  // Bare board under solder mask (no copper) is darker than the copper ground fill.
  ctx.fillStyle = COL.mask;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = COL.pour;
  ctx.beginPath();
  ctx.roundRect(1.2 * PX, 1.2 * PX, W - 2.4 * PX, H - 2.4 * PX, 2 * PX);
  ctx.fill();
  // Faint crosshatch so the ground fill reads as copper, not bare board
  ctx.strokeStyle = 'rgba(255,255,255,0.035)';
  ctx.lineWidth = 0.08 * PX;
  for (let x = -H; x < W; x += 1.2 * PX) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + H, H);
    ctx.stroke();
  }

  const allTraceSegs = [...geo.segments, ...geo.traces.flatMap((t) => t.segments)];
  const topSegs = allTraceSegs.filter((s) => s.layer !== 'bottom');

  // Ground pads: clearance ring with four thermal spokes joining them to the ground fill
  for (const p of pads) {
    if (p.net !== 'GND') continue;
    padPath(ctx, p, 0.7);
    ctx.fillStyle = COL.mask;
    ctx.fill();
    ctx.strokeStyle = COL.pour;
    ctx.lineWidth = Math.min(p.w, p.h) * 0.45 * PX;
    ctx.lineCap = 'butt';
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      ctx.beginPath();
      ctx.moveTo(p.x * PX, p.y * PX);
      ctx.lineTo((p.x + dx * (p.w / 2 + 0.9)) * PX, (p.y + dy * (p.h / 2 + 0.9)) * PX);
      ctx.stroke();
    }
  }

  // Clearance gap (bare board) around everything on top that is not ground. Cut *after* the spokes:
  // like a real pour, the ground fill and its spokes never reach another net's copper.
  strokeSegs(ctx, topSegs.filter((sg) => sg.net !== 'GND'), COL.mask, 0.7);
  ctx.fillStyle = COL.mask;
  for (const p of pads) {
    if (p.net === 'GND') continue;
    padPath(ctx, p, 0.7);
    ctx.fill();
  }

  // Top copper traces (bottom-layer copper is only visible when the board is flipped)
  strokeSegs(ctx, topSegs, COL.copper, 0);

  // Ground vias stitched around the board
  ctx.fillStyle = COL.via;
  for (const p of pads)
    if (p.net === 'GND' && !p.round) {
      ctx.beginPath();
      ctx.arc((p.x + (p.w / 2 + 0.9) * Math.sign(rand() - 0.5)) * PX, p.y * PX, 0.35 * PX, 0, Math.PI * 2);
      ctx.fill();
    }
  for (let i = 0; i < 40; i++) {
    const x = 4 + rand() * (dev.width - 8);
    const y = 4 + rand() * (dev.height - 8);
    if (pads.some((p) => Math.abs(p.x - x) < 4 && Math.abs(p.y - y) < 4)) continue;
    if (allTraceSegs.some((s) => Math.min(s.x1, s.x2) - 1.5 < x && x < Math.max(s.x1, s.x2) + 1.5 && Math.min(s.y1, s.y2) - 1.5 < y && y < Math.max(s.y1, s.y2) + 1.5)) continue;
    ctx.beginPath();
    ctx.arc(x * PX, y * PX, 0.35 * PX, 0, Math.PI * 2);
    ctx.fill();
  }

  // Mounting holes
  for (const [x, y] of [
    [3.5, 3.5],
    [dev.width - 3.5, 3.5],
    [3.5, dev.height - 3.5],
    [dev.width - 3.5, dev.height - 3.5],
  ]) {
    ctx.fillStyle = COL.pad;
    ctx.beginPath();
    ctx.arc(x * PX, y * PX, 2.6 * PX, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0b0b0b';
    ctx.beginPath();
    ctx.arc(x * PX, y * PX, 1.6 * PX, 0, Math.PI * 2);
    ctx.fill();
  }

  // Broken traces: cut through the copper
  for (const t of geo.traces) {
    if (!b.traces[t.id]?.broken) continue;
    const { x, y, vertical } = t.crack;
    ctx.strokeStyle = '#123f24';
    ctx.lineWidth = 0.12 * PX;
    ctx.beginPath();
    const w = 0.7;
    if (vertical) {
      ctx.moveTo((x - w) * PX, (y - 0.1) * PX);
      ctx.lineTo((x - 0.1) * PX, (y + 0.08) * PX);
      ctx.lineTo((x + w) * PX, (y - 0.05) * PX);
    } else {
      ctx.moveTo((x - 0.1) * PX, (y - w) * PX);
      ctx.lineTo((x + 0.08) * PX, (y - 0.1) * PX);
      ctx.lineTo((x - 0.05) * PX, (y + w) * PX);
    }
    ctx.stroke();
  }

  // Pads
  for (const p of pads) {
    const key = `${p.ref}.${p.pin}`;
    if (lifted.has(key)) {
      padPath(ctx, p, 0.2);
      ctx.fillStyle = COL.fr4;
      ctx.fill();
      ctx.strokeStyle = '#5b4524';
      ctx.lineWidth = 0.1 * PX;
      ctx.stroke();
      continue;
    }
    const isTp = part(b.comps[p.ref].def.partNo).kind === 'testpoint';
    padPath(ctx, p);
    const g = ctx.createLinearGradient((p.x - p.w / 2) * PX, (p.y - p.h / 2) * PX, (p.x + p.w / 2) * PX, (p.y + p.h / 2) * PX);
    g.addColorStop(0, isTp ? '#efd38a' : '#e6e9eb');
    g.addColorStop(1, isTp ? COL.gold : COL.padShade);
    ctx.fillStyle = g;
    ctx.fill();
    if (p.round && !isTp) {
      ctx.fillStyle = '#2a2a2a';
      ctx.beginPath();
      ctx.arc(p.x * PX, p.y * PX, 0.5 * PX, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Via-in-pad holes: these pads continue on the bottom layer
  for (const v of geo.vias) {
    ctx.fillStyle = '#5d6166';
    ctx.beginPath();
    ctx.arc(v.x * PX, v.y * PX, 0.3 * PX, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#121416';
    ctx.beginPath();
    ctx.arc(v.x * PX, v.y * PX, 0.17 * PX, 0, Math.PI * 2);
    ctx.fill();
  }

  // Silkscreen
  ctx.strokeStyle = COL.silk;
  ctx.fillStyle = COL.silk;
  ctx.lineWidth = 0.15 * PX;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const def of dev.components) {
    if (def.mates) continue;
    const p = part(def.partNo);
    if (p.kind === 'testpoint') {
      const tp = dev.testPoints.find((t) => t.ref === def.ref);
      ctx.beginPath();
      ctx.arc(def.x * PX, def.y * PX, 1.25 * PX, 0, Math.PI * 2);
      ctx.stroke();
      ctx.font = `bold ${1.3 * PX}px Arial, sans-serif`;
      ctx.fillText(def.ref, def.x * PX, (def.y - 2.3) * PX);
      if (tp) {
        ctx.font = `${1.05 * PX}px Arial, sans-serif`;
        ctx.fillText(tp.net === 'VIN_J' ? 'VIN' : tp.net, def.x * PX, (def.y + 2.3) * PX);
      }
      continue;
    }
    const r = bodyRect(def);
    const m = 0.35;
    if (p.kind !== 'jack') {
      ctx.strokeRect((r.x - m) * PX, (r.y - m) * PX, (r.w + 2 * m) * PX, (r.h + 2 * m) * PX);
    } else {
      ctx.strokeRect(r.x * PX, r.y * PX, r.w * PX, r.h * PX);
    }
    // Reference designator, placed beside the long side
    const fs = Math.min(1.5, Math.max(1.05, Math.min(r.w, r.h) * 0.9));
    ctx.font = `bold ${fs * PX}px Arial, sans-serif`;
    const above = r.w >= r.h;
    const lx = above ? def.x : r.x + r.w + 0.6 + (def.ref.length * fs) / 3;
    const ly = above ? r.y - 1.1 - fs / 2 : def.y;
    ctx.fillText(def.ref, lx * PX, ly * PX);

    // Polarity marks
    const pads = padsOf(def);
    if (['diode', 'tvs', 'zener', 'led'].includes(p.kind)) {
      const k = pads.find((q) => q.pin === 'K')!;
      const vertical = def.rot === 90 || def.rot === 270;
      ctx.lineWidth = 0.35 * PX;
      ctx.beginPath();
      if (vertical) {
        const yy = k.y + Math.sign(k.y - def.y) * (k.h / 2 + 0.5);
        ctx.moveTo((def.x - r.w / 2 - m) * PX, yy * PX);
        ctx.lineTo((def.x + r.w / 2 + m) * PX, yy * PX);
      } else {
        const xx = k.x + Math.sign(k.x - def.x) * (k.w / 2 + 0.5);
        ctx.moveTo(xx * PX, (def.y - r.h / 2 - m) * PX);
        ctx.lineTo(xx * PX, (def.y + r.h / 2 + m) * PX);
      }
      ctx.stroke();
      ctx.lineWidth = 0.15 * PX;
    }
    if (p.kind === 'electrolytic' || p.kind === 'cob') {
      const plus = pads[0];
      ctx.font = `bold ${1.6 * PX}px Arial, sans-serif`;
      ctx.fillText('+', (plus.x - (plus.w / 2 + 1)) * PX, (plus.y - 1.6) * PX);
    }
    if (p.kind === 'mcu' || p.kind === 'buck') {
      const p1 = pads[0];
      ctx.beginPath();
      ctx.arc((p1.x - (p.kind === 'mcu' ? 1.3 : 0.9)) * PX, (p1.y + (p.kind === 'mcu' ? -0.9 : 1.1)) * PX, 0.35 * PX, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Block labels
  ctx.font = `${1.25 * PX}px Arial, sans-serif`;
  ctx.textAlign = 'left';
  ctx.setLineDash([0.6 * PX, 0.5 * PX]);
  ctx.lineWidth = 0.1 * PX;
  ctx.globalAlpha = 0.55;
  for (const bl of dev.blocks) {
    ctx.strokeRect(bl.x * PX, bl.y * PX, bl.w * PX, bl.h * PX);
    ctx.fillText(bl.name, (bl.x + 0.8) * PX, (bl.y + 1.3) * PX);
  }
  ctx.globalAlpha = 1;
  ctx.setLineDash([]);
  const [title, rev] = silkOf(dev);
  ctx.font = `${1.4 * PX}px Arial, sans-serif`;
  const tw = Math.max(ctx.measureText(rev).width, (ctx.measureText(title).width * 2.4) / 1.4) / PX;
  const spot = dev.id === 'dl12' ? { x: 8, y: 3 } : freeSpot(dev, geo.pads, tw, 6.5);
  ctx.font = `bold ${2.4 * PX}px Arial, sans-serif`;
  ctx.fillText(title, spot.x * PX, (spot.y + 2.2) * PX);
  ctx.font = `${1.4 * PX}px Arial, sans-serif`;
  ctx.fillText(rev, spot.x * PX, (spot.y + 5.2) * PX);
  ctx.textAlign = 'center';

  // Jumper wires (enamelled copper)
  for (const j of b.jumpers) {
    const pa = pads.find((p) => p.ref === j.a.ref && p.pin === j.a.pin);
    const pb = pads.find((p) => p.ref === j.b.ref && p.pin === j.b.pin);
    if (!pa || !pb) continue;
    if (j.bridge) {
      // A lump of solder spanning the two pads
      ctx.strokeStyle = '#d9dde0';
      ctx.lineCap = 'round';
      ctx.lineWidth = 0.7 * PX;
      ctx.beginPath();
      ctx.moveTo(pa.x * PX, pa.y * PX);
      ctx.lineTo(pb.x * PX, pb.y * PX);
      ctx.stroke();
      continue;
    }
    ctx.strokeStyle = '#b5652a';
    ctx.lineWidth = 0.25 * PX;
    ctx.beginPath();
    ctx.moveTo(pa.x * PX, pa.y * PX);
    const mx = (pa.x + pb.x) / 2 + (pb.y - pa.y) * 0.08;
    const my = (pa.y + pb.y) / 2 - (pb.x - pa.x) * 0.08;
    ctx.quadraticCurveTo(mx * PX, my * PX, pb.x * PX, pb.y * PX);
    ctx.stroke();
    for (const p of [pa, pb]) {
      ctx.fillStyle = j.cold ? '#8e9296' : '#e2e5e8';
      ctx.beginPath();
      ctx.arc(p.x * PX, p.y * PX, 0.45 * PX, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Condition marks: residue, discolouration, scorch, scratches, cracked joints
  for (const c of Object.values(b.comps)) {
    const r = bodyRect(c.def);
    const cx = c.def.x * PX;
    const cy = c.def.y * PX;
    const size = Math.max(r.w, r.h) * PX;
    const lr = rng(c.ref.charCodeAt(0) * 31 + c.ref.length * 7 + (c.ref.charCodeAt(1) || 0));
    for (const m of c.marks) {
      switch (m) {
        case 'residue':
          blob(ctx, cx + (lr() - 0.5) * size * 0.4, cy + (lr() - 0.5) * size * 0.4, size * 0.9 + 1.5 * PX, 'rgba(214,170,70,0.45)', 'rgba(214,170,70,0)');
          break;
        case 'rework-residue':
          blob(ctx, cx, cy, size * 0.8 + 2 * PX, 'rgba(170,110,30,0.55)', 'rgba(150,95,20,0)');
          for (let i = 0; i < 6; i++) blob(ctx, cx + (lr() - 0.5) * size * 1.6, cy + (lr() - 0.5) * size * 1.6, 0.35 * PX, 'rgba(110,70,15,0.6)', 'rgba(110,70,15,0)');
          break;
        case 'discolored':
          blob(ctx, cx, cy, size * 0.75 + 1 * PX, 'rgba(120,85,30,0.55)', 'rgba(120,85,30,0)');
          break;
        case 'scorch':
          blob(ctx, cx, cy, size * 0.9 + 2 * PX, 'rgba(20,10,5,0.9)', 'rgba(60,35,10,0)');
          break;
        case 'scratch':
          ctx.strokeStyle = 'rgba(200,230,205,0.55)';
          ctx.lineWidth = 0.08 * PX;
          for (let i = 0; i < 2; i++) {
            const x0 = cx + (lr() - 0.5) * size * 2;
            const y0 = cy + (lr() - 0.5) * size * 2;
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.lineTo(x0 + (lr() + 0.5) * 3 * PX, y0 + (lr() - 0.5) * 2 * PX);
            ctx.stroke();
          }
          break;
        default:
          break;
      }
    }
    for (const [pin, j] of Object.entries(c.joints)) {
      if (!j.cracked && !j.cold) continue;
      const pad = pads.find((p) => p.ref === c.ref && p.pin === pin);
      if (!pad) continue;
      if (j.cold) {
        padPath(ctx, pad);
        ctx.fillStyle = 'rgba(120,124,128,0.65)';
        ctx.fill();
      }
      if (j.cracked) {
        ctx.strokeStyle = 'rgba(20,20,20,0.9)';
        ctx.lineWidth = 0.07 * PX;
        ctx.beginPath();
        ctx.ellipse(pad.x * PX, pad.y * PX, (pad.w / 2) * 0.62 * PX, (pad.h / 2) * 0.62 * PX, 0, 0.3, Math.PI * 1.7);
        ctx.stroke();
      }
    }
  }
}

/**
 * Paint the bottom layer. The canvas is mirrored in y so that, once the board is
 * flipped over (rotated about its x axis), everything lines up with the top side.
 */
export function drawBoardBottom(canvas: HTMLCanvasElement, b: BoardState, geo: BoardGeometry): void {
  const dev = b.device;
  canvas.width = dev.width * PX;
  canvas.height = dev.height * PX;
  const ctx = canvas.getContext('2d')!;
  const W = canvas.width;
  const H = canvas.height;
  const Y = (y: number) => (dev.height - y) * PX;
  const bottomSegs = geo.segments.filter((s) => s.layer === 'bottom');
  const th = geo.pads.filter((p) => p.round && !p.module && part(b.comps[p.ref].def.partNo).kind !== 'testpoint');

  ctx.fillStyle = COL.mask;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = COL.pour;
  ctx.beginPath();
  ctx.roundRect(1.2 * PX, 1.2 * PX, W - 2.4 * PX, H - 2.4 * PX, 2 * PX);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.035)';
  ctx.lineWidth = 0.08 * PX;
  for (let x = -H; x < W; x += 1.2 * PX) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + H, H);
    ctx.stroke();
  }

  const stroke = (color: string, extra: number) => {
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const s of bottomSegs) {
      ctx.lineWidth = (s.width + extra) * PX;
      ctx.beginPath();
      ctx.moveTo(s.x1 * PX, Y(s.y1));
      ctx.lineTo(s.x2 * PX, Y(s.y2));
      ctx.stroke();
    }
  };
  // Clearance, then copper
  stroke(COL.mask, 0.7);
  ctx.fillStyle = COL.mask;
  for (const v of geo.vias) {
    ctx.beginPath();
    ctx.arc(v.x * PX, Y(v.y), 0.9 * PX, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const p of th) {
    if (p.net === 'GND') continue;
    ctx.beginPath();
    ctx.arc(p.x * PX, Y(p.y), (p.w / 2 + 0.7) * PX, 0, Math.PI * 2);
    ctx.fill();
  }
  stroke(COL.copper, 0);

  // Vias
  for (const v of geo.vias) {
    ctx.fillStyle = COL.via;
    ctx.beginPath();
    ctx.arc(v.x * PX, Y(v.y), 0.55 * PX, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0d2417';
    ctx.beginPath();
    ctx.arc(v.x * PX, Y(v.y), 0.25 * PX, 0, Math.PI * 2);
    ctx.fill();
  }

  // Through-hole solder joints (the DC jack) — cracks show up here
  for (const p of th) {
    const x = p.x * PX;
    const y = Y(p.y);
    const r = (p.w / 2) * PX;
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    g.addColorStop(0, '#f2f4f5');
    g.addColorStop(1, '#9ea3a8');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7d8287';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
    const j = b.comps[p.ref].joints[p.pin];
    if (j?.cracked) {
      ctx.strokeStyle = 'rgba(15,15,15,0.95)';
      ctx.lineWidth = 0.09 * PX;
      ctx.beginPath();
      ctx.arc(x, y, r * 0.55, 0.4, Math.PI * 1.8);
      ctx.stroke();
    }
    if (j?.cold) {
      ctx.fillStyle = 'rgba(120,124,128,0.6)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Mounting holes
  for (const [mx, my] of [
    [3.5, 3.5],
    [dev.width - 3.5, 3.5],
    [3.5, dev.height - 3.5],
    [dev.width - 3.5, dev.height - 3.5],
  ]) {
    ctx.fillStyle = COL.pad;
    ctx.beginPath();
    ctx.arc(mx * PX, Y(my), 2.6 * PX, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0b0b0b';
    ctx.beginPath();
    ctx.arc(mx * PX, Y(my), 1.6 * PX, 0, Math.PI * 2);
    ctx.fill();
  }

  // Bottom silkscreen (text is drawn the right way round for a flipped board)
  ctx.fillStyle = COL.silk;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${2.2 * PX}px Arial, sans-serif`;
  const [btitle, , maker] = silkOf(dev);
  ctx.fillText(`${btitle}  ·  BOTTOM`, 8 * PX, (dev.height - 6) * PX - 40 * PX);
  ctx.font = `${1.3 * PX}px Arial, sans-serif`;
  ctx.fillText(`${maker}   94V-0   E-41207`, 8 * PX, (dev.height - 6) * PX - 36.5 * PX);
  // QC sticker
  ctx.fillStyle = '#f4f1e4';
  ctx.fillRect(70 * PX, 6 * PX, 18 * PX, 7 * PX);
  ctx.fillStyle = '#1b1b1b';
  ctx.font = `bold ${1.4 * PX}px Arial, sans-serif`;
  ctx.fillText('QC PASSED', 71.2 * PX, 8.2 * PX);
  for (let i = 0; i < 26; i++) ctx.fillRect((71.2 + i * 0.6) * PX, 10 * PX, (i % 3 === 0 ? 0.35 : 0.18) * PX, 2.2 * PX);
}
