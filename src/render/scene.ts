import * as pc from 'playcanvas';
import type { PointRef } from '../sim/circuit';
import { bodyRect, FOOTPRINTS, rotate, type PadWorld } from '../sim/footprints';
import type { DeviceDef } from '../sim/board';
import type { PartSpec } from '../sim/parts';
import type { Session } from '../game/session';
import { buildGeometry, drawBoard, drawBoardBottom, type BoardGeometry } from './boardArt';

export interface BoardHit {
  /** Board coordinates (mm). */
  bx: number;
  by: number;
  pad: PadWorld | null;
  comp: string | null;
  trace: string | null;
}

export interface SceneCallbacks {
  onClick(hit: BoardHit | null, ev: PointerEvent): void;
  onHover(hit: BoardHit | null, ev: PointerEvent): void;
}

const BOARD_T = 1.6;

function templateFor(p: PartSpec): string {
  switch (p.pkg) {
    case '0603':
      return p.kind === 'capacitor' ? 'pkg_0603_cap' : 'pkg_0603_res';
    case '1206':
      return p.kind === 'fuse' ? 'pkg_1206_fuse' : p.kind === 'capacitor' ? 'pkg_1206_cap' : 'pkg_1206_res';
    case 'LED0805':
      return `pkg_LED0805_${p.color ?? 'green'}`;
    case 'TP':
      return '';
    default:
      return `pkg_${p.pkg}`;
  }
}

interface CompVisual {
  sig: string;
  entity: pc.Entity | null;
  lenses: pc.StandardMaterial[];
  /** Tact-switch plunger (moves when pressed). */
  cap: pc.Entity | null;
  lensColor: pc.Color;
  /** Current (A) at which the lens is at full brightness. */
  fullI: number;
  wet: pc.Entity;
  wetMat: pc.StandardMaterial;
}

interface Puff {
  e: pc.Entity;
  mat: pc.StandardMaterial;
  t: number;
  vx: number;
  vz: number;
}

export class BenchScene {
  readonly app: pc.Application;
  private camera!: pc.Entity;
  private templates = new Map<string, pc.Entity>();
  private geo!: BoardGeometry;
  private boardCanvas = document.createElement('canvas');
  private boardTex!: pc.Texture;
  private bottomCanvas = document.createElement('canvas');
  private bottomTex!: pc.Texture;
  /** Everything that belongs to the board (flips together). */
  private boardGroup!: pc.Entity;
  /** 0 = component side up, 1 = flipped over. */
  private flipT = 0;
  private flipTarget = 0;
  private ledLights = new Map<string, pc.Entity>();
  private boardSig = '';
  private comps = new Map<string, CompVisual>();
  private meter!: pc.Entity;
  private meterDial: pc.Entity | null = null;
  private psu!: pc.Entity;
  private iron!: pc.Entity;
  private probes: Record<'red' | 'black', pc.Entity> = {} as never;
  private lampLight!: pc.Entity;
  private thermalCanvas = document.createElement('canvas');
  private thermalTex: pc.Texture | null = null;
  private thermalPlane: pc.Entity | null = null;
  private thermalT = 0;
  /** COB lamp driving the room light, if this board has one. */
  private lampRef: string | null = null;
  private builtDevice: DeviceDef | null = null;
  private hoverMarker!: pc.Entity;
  private lcd = this.makeDisplay(256, 112);
  private psuV = this.makeDisplay(256, 96);
  private psuA = this.makeDisplay(256, 96);
  private puffs: Puff[] = [];
  private ironTarget: string | null = null;
  private hover: BoardHit | null = null;

  // Orbit camera state
  private target = new pc.Vec3(0, 0, 4);
  private yaw = 0;
  private pitch = 58;
  private dist = 175;

  constructor(
    private canvas: HTMLCanvasElement,
    private session: Session,
    private cb: SceneCallbacks,
  ) {
    const app = new pc.Application(canvas, {
      graphicsDeviceOptions: { antialias: true, alpha: false },
    });
    this.app = app;
    app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
    app.setCanvasResolution(pc.RESOLUTION_AUTO);
    window.addEventListener('resize', () => app.resizeCanvas());
  }

  /** Distance from camera to target (mm) — small values mean "magnified". */
  get zoom(): number {
    return this.dist;
  }

  async load(): Promise<void> {
    const app = this.app;
    const asset = new pc.Asset('parts', 'container', { url: `${import.meta.env.BASE_URL}models/parts.glb` });
    app.assets.add(asset);
    await new Promise<void>((resolve, reject) => {
      asset.once('load', () => resolve());
      asset.once('error', (e: unknown) => reject(e));
      app.assets.load(asset);
    });
    const root = (asset.resource as pc.ContainerResource).instantiateRenderEntity();
    for (const child of root.children as pc.Entity[]) this.templates.set(child.name, child);

    this.buildWorld();
    this.bindInput();
    app.on('update', (dt: number) => this.update(dt));
    app.start();
  }

  private clone(name: string): pc.Entity {
    const t = this.templates.get(name);
    if (!t) throw new Error(`Missing model ${name}`);
    return t.clone() as pc.Entity;
  }

  private makeDisplay(w: number, h: number) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    return { canvas, tex: null as pc.Texture | null, text: '' };
  }

  private texture(canvas: HTMLCanvasElement, srgb = true): pc.Texture {
    const t = new pc.Texture(this.app.graphicsDevice, {
      width: canvas.width,
      height: canvas.height,
      format: srgb ? pc.PIXELFORMAT_SRGBA8 : pc.PIXELFORMAT_RGBA8,
      mipmaps: true,
      minFilter: pc.FILTER_LINEAR_MIPMAP_LINEAR,
      magFilter: pc.FILTER_LINEAR,
      anisotropy: 8,
      addressU: pc.ADDRESS_CLAMP_TO_EDGE,
      addressV: pc.ADDRESS_CLAMP_TO_EDGE,
    });
    t.setSource(canvas);
    return t;
  }

  /** Point a mesh's material at a canvas texture (used for instrument displays). */
  private attachDisplay(entity: pc.Entity, nodeName: string, disp: { canvas: HTMLCanvasElement; tex: pc.Texture | null }, glow: pc.Color) {
    disp.tex = this.texture(disp.canvas);
    for (const r of entity.findComponents('render') as pc.RenderComponent[]) {
      if (r.entity.name !== nodeName) continue;
      for (const mi of r.meshInstances) {
        const m = new pc.StandardMaterial();
        m.diffuse = new pc.Color(1, 1, 1);
        m.diffuseMap = disp.tex;
        m.emissive = glow;
        m.emissiveMap = disp.tex;
        m.emissiveIntensity = 1;
        m.useLighting = true;
        m.update();
        mi.material = m;
        // Box UVs are per-face; remap the whole box to the display canvas via the top/front face.
      }
    }
  }

  private buildWorld(): void {
    const app = this.app;
    app.scene.ambientLight = new pc.Color(0.5, 0.51, 0.55);

    // Camera
    const cam = new pc.Entity('camera');
    cam.addComponent('camera', {
      clearColor: new pc.Color(0.11, 0.115, 0.13),
      nearClip: 1,
      farClip: 6000,
      fov: 40,
    });
    const cc = cam.camera!;
    cc.toneMapping = pc.TONEMAP_ACES;
    cc.gammaCorrection = pc.GAMMA_SRGB;
    app.root.addChild(cam);
    this.camera = cam;

    // Lights
    const sun = new pc.Entity('key');
    sun.addComponent('light', {
      type: 'directional',
      color: new pc.Color(1, 0.97, 0.92),
      intensity: 1.6,
      castShadows: true,
      shadowDistance: 900,
      shadowResolution: 2048,
      shadowBias: 0.2,
      normalOffsetBias: 0.05,
    });
    sun.setEulerAngles(55, 30, 0);
    app.root.addChild(sun);
    const fill = new pc.Entity('fill');
    fill.addComponent('light', { type: 'directional', color: new pc.Color(0.75, 0.82, 1), intensity: 0.7 });
    fill.setEulerAngles(40, -140, 0);
    app.root.addChild(fill);

    // Bench + mat (mat top sits at the board bottom)
    const bench = this.clone('env_bench');
    bench.setLocalPosition(0, -BOARD_T - 2, 30);
    app.root.addChild(bench);

    // Instruments
    this.meter = this.clone('tool_multimeter');
    this.meter.setLocalPosition(175, -BOARD_T, 20);
    this.meter.setLocalEulerAngles(0, 14, 0);
    app.root.addChild(this.meter);
    this.meterDial = this.meter.findByName('tool_multimeter_dial') as pc.Entity | null;
    this.attachDisplay(this.meter, 'tool_multimeter_lcd', this.lcd, new pc.Color(0.55, 0.6, 0.5));

    this.psu = this.clone('tool_psu');
    this.psu.setLocalPosition(-215, -BOARD_T, -120);
    this.psu.setLocalEulerAngles(0, 24, 0);
    app.root.addChild(this.psu);
    this.attachDisplay(this.psu, 'tool_psu_disp_v', this.psuV, new pc.Color(1, 1, 1));
    this.attachDisplay(this.psu, 'tool_psu_disp_a', this.psuA, new pc.Color(1, 1, 1));

    this.iron = this.clone('tool_iron');
    app.root.addChild(this.iron);

    for (const c of ['red', 'black'] as const) {
      const p = this.clone(`tool_probe_${c}`);
      app.root.addChild(p);
      this.probes[c] = p;
    }

    // Lamp light (driven by LED1 current)
    this.lampLight = new pc.Entity('lamp-light');
    this.lampLight.addComponent('light', { type: 'omni', color: new pc.Color(1, 0.94, 0.82), intensity: 0, range: 260, castShadows: false });
    app.root.addChild(this.lampLight);

    // Hover marker
    const hm = new pc.StandardMaterial();
    hm.diffuse = new pc.Color(0, 0, 0);
    hm.emissive = new pc.Color(1, 0.85, 0.2);
    hm.opacity = 0.55;
    hm.blendType = pc.BLEND_NORMAL;
    hm.depthWrite = false;
    hm.update();
    this.hoverMarker = new pc.Entity('hover');
    this.hoverMarker.addComponent('render', { type: 'cylinder', material: hm, castShadows: false });
    this.hoverMarker.enabled = false;
    app.root.addChild(this.hoverMarker);

    this.buildBoard();
    this.updateCamera();
  }

  /** (Re)build everything that depends on which device is on the bench. */
  private buildBoard(): void {
    const app = this.app;
    const dev = this.session.board.device;
    this.boardGroup?.destroy();
    this.comps.clear();
    this.ledLights.clear();
    this.boardSig = '';
    this.builtDevice = dev;
    this.flipT = this.flipTarget = 0;
    if (this.camera) this.focusBoard();
    this.ironTarget = null;
    this.hover = null;
    this.geo = buildGeometry(dev);
    this.boardCanvas = document.createElement('canvas');
    this.bottomCanvas = document.createElement('canvas');
    // Board
    drawBoard(this.boardCanvas, this.session.board, this.geo);
    this.boardTex = this.texture(this.boardCanvas);
    const top = new pc.StandardMaterial();
    top.diffuseMap = this.boardTex;
    top.gloss = 0.55;
    top.useMetalness = true;
    top.metalness = 0;
    top.update();
    const edge = new pc.StandardMaterial();
    edge.diffuse = new pc.Color(0.11, 0.33, 0.19);
    edge.gloss = 0.4;
    edge.update();
    const body = new pc.Entity('pcb');
    body.addComponent('render', { type: 'box', material: edge, castShadows: true });
    body.setLocalScale(dev.width, BOARD_T, dev.height);
    body.setLocalPosition(0, -BOARD_T / 2 - 0.01, 0);
    this.boardGroup = new pc.Entity('board-group');
    app.root.addChild(this.boardGroup);
    this.boardGroup.addChild(body);
    const face = new pc.Entity('pcb-top');
    face.addComponent('render', { type: 'plane', material: top, castShadows: false, receiveShadows: true });
    face.setLocalScale(dev.width, 1, dev.height);
    face.setLocalPosition(0, 0.001, 0);
    this.boardGroup.addChild(face);
    drawBoardBottom(this.bottomCanvas, this.session.board, this.geo);
    this.bottomTex = this.texture(this.bottomCanvas);
    const bottomMat = new pc.StandardMaterial();
    bottomMat.diffuseMap = this.bottomTex;
    bottomMat.gloss = 0.55;
    bottomMat.update();
    const under = new pc.Entity('pcb-bottom');
    under.addComponent('render', { type: 'plane', material: bottomMat, castShadows: false, receiveShadows: true });
    under.setLocalScale(dev.width, 1, dev.height);
    under.setLocalPosition(0, -BOARD_T - 0.021, 0);
    under.setLocalEulerAngles(180, 0, 0);
    this.boardGroup.addChild(under);

    // Thermal camera overlay: drawn on top of everything, as if looking straight down.
    this.thermalCanvas.width = Math.round(dev.width * 4);
    this.thermalCanvas.height = Math.round(dev.height * 4);
    this.thermalTex?.destroy();
    this.thermalTex = this.texture(this.thermalCanvas);
    const tm = new pc.StandardMaterial();
    tm.diffuse = new pc.Color(0, 0, 0);
    tm.emissive = new pc.Color(1, 1, 1);
    tm.emissiveMap = this.thermalTex;
    tm.opacityMap = this.thermalTex;
    tm.opacityMapChannel = 'a';
    tm.blendType = pc.BLEND_NORMAL;
    tm.depthTest = false;
    tm.depthWrite = false;
    tm.useLighting = false;
    tm.update();
    this.thermalPlane = new pc.Entity('thermal');
    this.thermalPlane.addComponent('render', { type: 'plane', material: tm, castShadows: false, receiveShadows: false });
    this.thermalPlane.setLocalScale(dev.width, 1, dev.height);
    this.thermalPlane.setLocalPosition(0, 0.5, 0);
    this.thermalPlane.enabled = false;
    this.boardGroup.addChild(this.thermalPlane);

    // Small glow lights for the indicator LEDs
    const glowCol = { blue: new pc.Color(0.3, 0.5, 1), green: new pc.Color(0.3, 1, 0.35), red: new pc.Color(1, 0.3, 0.25), white: new pc.Color(1, 0.95, 0.85) };
    this.lampRef = null;
    for (const c of Object.values(this.session.board.comps)) {
      if (c.part?.kind === 'cob') this.lampRef = c.ref;
      if (c.part?.kind !== 'led') continue;
      const ref = c.ref;
      const l = new pc.Entity(`glow-${ref}`);
      l.addComponent('light', { type: 'omni', color: glowCol[c.part.color ?? 'green'], intensity: 0, range: 18, castShadows: false });
      l.setLocalPosition(this.toWorld(c.def.x, c.def.y, 3));
      this.boardGroup.addChild(l);
      this.ledLights.set(ref, l);
    }


    this.syncComponents();
  }

  // ---------------------------------------------------------------- coordinates

  toWorld(bx: number, by: number, y = 0): pc.Vec3 {
    const dev = this.session.board.device;
    return new pc.Vec3(bx - dev.width / 2, y, by - dev.height / 2);
  }

  private updateCamera(): void {
    const yaw = (this.yaw * Math.PI) / 180;
    const pitch = (this.pitch * Math.PI) / 180;
    const off = new pc.Vec3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)).mulScalar(this.dist);
    this.camera.setPosition(this.target.clone().add(off));
    this.camera.lookAt(this.target);
  }

  focusBoard(): void {
    this.target.set(0, 0, 4);
    this.yaw = 0;
    this.pitch = 58;
    const dev = this.session.board.device;
    this.dist = Math.max(175, dev.width * 1.75, dev.height * 2.6);
    this.updateCamera();
  }

  focusOn(bx: number, by: number, dist = 45): void {
    this.target.copy(this.toWorld(bx, by));
    this.dist = dist;
    this.updateCamera();
  }

  // ---------------------------------------------------------------- picking

  private rayToBoard(clientX: number, clientY: number): { bx: number; by: number } | null {
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const cc = this.camera.camera!;
    const near = cc.screenToWorld(x, y, cc.nearClip);
    const far = cc.screenToWorld(x, y, cc.farClip);
    const dir = far.sub(near);
    if (Math.abs(dir.y) < 1e-6) return null;
    const t = -near.y / dir.y;
    if (t < 0) return null;
    const dev = this.session.board.device;
    return { bx: near.x + dir.x * t + dev.width / 2, by: near.z + dir.z * t + dev.height / 2 };
  }

  get flipped(): boolean {
    return this.flipTarget === 1 || this.flipT > 0.01;
  }

  /** Turn the board over (or back). */
  toggleFlip(): void {
    this.flipTarget = this.flipTarget ? 0 : 1;
  }

  pick(clientX: number, clientY: number): BoardHit | null {
    if (this.flipped) return null;
    const p = this.rayToBoard(clientX, clientY);
    if (!p) return null;
    const dev = this.session.board.device;
    if (p.bx < -2 || p.by < -2 || p.bx > dev.width + 2 || p.by > dev.height + 2) return null;
    const radius = Math.max(0.5, this.dist * 0.008);
    let pad: PadWorld | null = null;
    let best = Infinity;
    for (const q of this.geo.pads) {
      const dx = Math.max(0, Math.abs(p.bx - q.x) - q.w / 2);
      const dy = Math.max(0, Math.abs(p.by - q.y) - q.h / 2);
      const d = Math.hypot(dx, dy) + Math.hypot(p.bx - q.x, p.by - q.y) * 0.05;
      if (d < radius && d < best) {
        best = d;
        pad = q;
      }
    }
    let comp: string | null = null;
    let area = Infinity;
    for (const def of dev.components) {
      const r = bodyRect(def);
      const m = 0.6;
      if (p.bx >= r.x - m && p.bx <= r.x + r.w + m && p.by >= r.y - m && p.by <= r.y + r.h + m && r.w * r.h < area) {
        area = r.w * r.h;
        comp = def.ref;
      }
    }
    if (!comp && pad) comp = pad.ref;
    let trace: string | null = null;
    for (const t of this.geo.traces)
      for (const s of t.segments) {
        const len2 = (s.x2 - s.x1) ** 2 + (s.y2 - s.y1) ** 2 || 1;
        const k = Math.max(0, Math.min(1, ((p.bx - s.x1) * (s.x2 - s.x1) + (p.by - s.y1) * (s.y2 - s.y1)) / len2));
        if (Math.hypot(p.bx - (s.x1 + k * (s.x2 - s.x1)), p.by - (s.y1 + k * (s.y2 - s.y1))) < s.width / 2 + 0.4) trace = t.id;
      }
    return { ...p, pad, comp, trace };
  }

  private bindInput(): void {
    const c = this.canvas;
    let drag: { x: number; y: number; button: number; moved: boolean; shift: boolean } | null = null;
    c.addEventListener('contextmenu', (e) => e.preventDefault());
    c.addEventListener('pointerdown', (e) => {
      c.setPointerCapture(e.pointerId);
      drag = { x: e.clientX, y: e.clientY, button: e.button, moved: false, shift: e.shiftKey };
    });
    c.addEventListener('pointermove', (e) => {
      if (drag) {
        const dx = e.clientX - drag.x;
        const dy = e.clientY - drag.y;
        if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
        if (drag.moved && (drag.button === 2 || drag.button === 1)) {
          if (drag.button === 1 || (drag.button === 2 && drag.shift)) {
            // pan in the ground plane
            const yaw = (this.yaw * Math.PI) / 180;
            const s = this.dist * 0.0016;
            const rx = Math.cos(yaw);
            const rz = -Math.sin(yaw);
            this.target.x -= (dx * rx + dy * Math.sin(yaw)) * s;
            this.target.z -= (dx * rz + dy * Math.cos(yaw)) * s;
          } else {
            this.yaw -= dx * 0.3;
            this.pitch = Math.min(88, Math.max(12, this.pitch + dy * 0.3));
          }
          this.updateCamera();
          drag.x = e.clientX;
          drag.y = e.clientY;
        }
      }
      const hit = this.pick(e.clientX, e.clientY);
      this.hover = hit;
      this.cb.onHover(hit, e);
    });
    c.addEventListener('pointerup', (e) => {
      // A right-click that didn't drag counts as a click too (places the black probe).
      if (drag && !drag.moved && (drag.button === 0 || drag.button === 2)) this.cb.onClick(this.pick(e.clientX, e.clientY), e);
      drag = null;
    });
    c.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const f = Math.exp(e.deltaY * 0.0012);
        const p = this.rayToBoard(e.clientX, e.clientY);
        const nd = Math.min(1100, Math.max(14, this.dist * f));
        if (p && nd < this.dist) {
          const w = this.toWorld(p.bx, p.by);
          const k = 1 - nd / this.dist;
          this.target.lerp(this.target, w, k);
        }
        this.dist = nd;
        this.updateCamera();
      },
      { passive: false },
    );
    window.addEventListener('keydown', (e) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.key === 'f' || e.key === 'F') this.focusBoard();
    });
  }

  // ---------------------------------------------------------------- per-frame sync

  setIronTarget(ref: string | null): void {
    this.ironTarget = ref;
  }

  spawnSmoke(ref: string, amount = 14): void {
    const def = this.session.board.comps[ref]?.def;
    if (!def) return;
    const base = this.toWorld(def.x, def.y, 2);
    for (let i = 0; i < amount; i++) {
      const mat = new pc.StandardMaterial();
      mat.diffuse = new pc.Color(0.55, 0.55, 0.57);
      mat.blendType = pc.BLEND_NORMAL;
      mat.depthWrite = false;
      mat.opacity = 0.6;
      mat.update();
      const e = new pc.Entity('puff');
      e.addComponent('render', { type: 'sphere', material: mat, castShadows: false });
      e.setPosition(base.x + (Math.random() - 0.5) * 2, base.y + Math.random() * 2, base.z + (Math.random() - 0.5) * 2);
      e.setLocalScale(1.5, 1.5, 1.5);
      this.app.root.addChild(e);
      this.puffs.push({ e, mat, t: -i * 0.06, vx: (Math.random() - 0.5) * 4, vz: (Math.random() - 0.5) * 4 });
    }
  }

  private visualSig(): string {
    const b = this.session.board;
    return JSON.stringify([
      Object.values(b.comps).map((c) => [c.part?.partNo, c.reversed, c.marks, c.burnt, c.joints, c.unplugged, c.corr]),
      b.traces,
      b.liftedPads,
      b.jumpers,
    ]);
  }

  /** Rebuild component entities whose physical state changed. */
  syncComponents(): void {
    if (this.session.board.device !== this.builtDevice) {
      this.buildBoard();
      return;
    }
    const sig = this.visualSig();
    if (sig === this.boardSig) return;
    this.boardSig = sig;
    drawBoard(this.boardCanvas, this.session.board, this.geo);
    this.boardTex.setSource(this.boardCanvas);
    drawBoardBottom(this.bottomCanvas, this.session.board, this.geo);
    this.bottomTex.setSource(this.bottomCanvas);

    for (const c of Object.values(this.session.board.comps)) {
      const csig = JSON.stringify([c.part?.partNo, c.reversed, c.marks, c.burnt, c.unplugged]);
      let v = this.comps.get(c.ref);
      if (!v) {
        const wetMat = new pc.StandardMaterial();
        wetMat.diffuse = new pc.Color(0.85, 0.92, 1);
        wetMat.gloss = 0.95;
        wetMat.blendType = pc.BLEND_NORMAL;
        wetMat.depthWrite = false;
        wetMat.opacity = 0;
        wetMat.update();
        const wet = new pc.Entity(`wet-${c.ref}`);
        wet.addComponent('render', { type: 'plane', material: wetMat, castShadows: false });
        const r = bodyRect(c.def);
        wet.setLocalScale(r.w + 3, 1, r.h + 3);
        wet.setLocalPosition(this.toWorld(c.def.x, c.def.y, 0.05));
        wet.enabled = false;
        this.boardGroup.addChild(wet);
        v = { sig: '', entity: null, lenses: [], cap: null, lensColor: new pc.Color(), fullI: 0.003, wet, wetMat };
        this.comps.set(c.ref, v);
      }
      if (v.sig === csig) continue;
      v.sig = csig;
      v.entity?.destroy();
      v.entity = null;
      v.lenses = [];
      v.cap = null;
      if (!c.part || c.unplugged) continue;
      const tpl = templateFor(c.part);
      if (!tpl) continue;
      const e = this.clone(tpl);
      let rot = c.def.rot + (c.reversed ? 180 : 0);
      if (c.marks.includes('crooked')) rot += 9;
      e.setLocalPosition(this.toWorld(c.def.x, c.def.y, 0.03));
      e.setLocalEulerAngles(c.marks.includes('loose') ? 4 : 0, -rot, 0);
      if (c.marks.includes('bulged')) e.setLocalScale(1, 1.12, 1);
      this.boardGroup.addChild(e);
      v.entity = e;
      v.cap = (e.findByName(`${tpl}_cap`) as pc.Entity | null) ?? null;
      this.addMarking(e, c.part);
      for (const r of e.findComponents('render') as pc.RenderComponent[]) {
        for (const mi of r.meshInstances) {
          if (r.entity.name.endsWith('_lens')) {
            const m = (mi.material as pc.StandardMaterial).clone();
            mi.material = m;
            v.lenses.push(m);
            const col = c.part.kind === 'module' && c.part.pkg === 'SCREEN' ? 'screen' : (c.part.color ?? 'white');
            v.lensColor = { blue: new pc.Color(0.25, 0.5, 1), green: new pc.Color(0.25, 1, 0.3), red: new pc.Color(1, 0.22, 0.15), white: new pc.Color(1, 0.95, 0.82), screen: new pc.Color(0.75, 0.85, 1) }[col];
            v.fullI = c.part.kind === 'cob' || c.part.pkg === 'LEDBAR' ? 0.1 : c.part.pkg === 'SCREEN' ? 0.02 : 0.003;
          } else if (c.burnt) {
            const m = (mi.material as pc.StandardMaterial).clone();
            m.diffuse = new pc.Color(m.diffuse.r * 0.25, m.diffuse.g * 0.2, m.diffuse.b * 0.15);
            m.update();
            mi.material = m;
          }
        }
      }
    }
  }

  /** Draw the copper of a net (including fragments joined by breakable traces) as a glowing outline. */
  private drawNet(net: string): void {
    const dev = this.session.board.device;
    const nets = new Set([net]);
    for (const t of dev.traces) if (t.a === net || t.b === net) (nets.add(t.a), nets.add(t.b));
    const top: pc.Vec3[] = [];
    const bottom: pc.Vec3[] = [];
    const segs = [...this.geo.segments, ...this.geo.traces.filter((t) => dev.traces.some((d) => d.id === t.id && nets.has(d.a))).flatMap((t) => t.segments)];
    for (const sg of segs) {
      if (!nets.has(sg.net)) continue;
      const list = sg.layer === 'bottom' ? bottom : top;
      list.push(this.toWorld(sg.x1, sg.y1, 0.12), this.toWorld(sg.x2, sg.y2, 0.12));
    }
    for (const p of this.geo.pads) {
      if (!nets.has(p.net)) continue;
      const a = this.toWorld(p.x - p.w / 2 - 0.2, p.y - p.h / 2 - 0.2, 0.15);
      const b = this.toWorld(p.x + p.w / 2 + 0.2, p.y + p.h / 2 + 0.2, 0.15);
      const c1 = new pc.Vec3(b.x, a.y, a.z);
      const c3 = new pc.Vec3(a.x, a.y, b.z);
      top.push(a, c1, c1, b, b, c3, c3, a);
    }
    if (top.length) this.app.drawLines(top, new pc.Color(1, 0.9, 0.25), true);
    if (bottom.length) this.app.drawLines(bottom, new pc.Color(1, 0.55, 0.15), false);
  }

  private markingTex = new Map<string, pc.Texture>();

  /** Printed part marking on the top of a package (laser-etched light grey text). */
  private addMarking(e: pc.Entity, p: PartSpec): void {
    if (!p.marking || ['CAP_EL', 'CAP_EL10', 'BARREL', 'TACT6', 'LED0805', 'COB', 'TP', 'USBC', 'MUSB', 'HDMI', 'PWR2', 'JST2', 'FPC2', 'SCREEN', 'LEDBAR'].includes(p.pkg)) return;
    let tex = this.markingTex.get(p.marking);
    if (!tex) {
      const cv = document.createElement('canvas');
      cv.width = 256;
      cv.height = 96;
      const ctx = cv.getContext('2d')!;
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.fillStyle = '#d9dade';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      let size = 72;
      ctx.font = `bold ${size}px Arial, sans-serif`;
      while (ctx.measureText(p.marking).width > cv.width * 0.92 && size > 20) ctx.font = `bold ${(size -= 4)}px Arial, sans-serif`;
      ctx.fillText(p.marking, cv.width / 2, cv.height / 2 + 2);
      tex = this.texture(cv);
      this.markingTex.set(p.marking, tex);
    }
    const fp = FOOTPRINTS[p.pkg];
    const m = new pc.StandardMaterial();
    m.diffuse = new pc.Color(1, 1, 1);
    m.diffuseMap = tex;
    m.opacityMap = tex;
    m.opacityMapChannel = 'a';
    m.blendType = pc.BLEND_NORMAL;
    m.depthWrite = false;
    m.gloss = 0.3;
    m.update();
    const plane = new pc.Entity('marking');
    plane.addComponent('render', { type: 'plane', material: m, castShadows: false });
    const bodyW = p.pkg === 'SOIC8' ? fp.w * 0.85 : fp.w * (p.pkg === '0603' || p.pkg === '1206' ? 0.55 : 0.8);
    plane.setLocalScale(bodyW, 1, Math.min(fp.h * 0.55, bodyW * 0.38));
    const top: Partial<Record<string, number>> = { '0603': 0.48, '1206': 0.6, SMA: 2.12, SOD123: 1.12, SOT23: 1.02, 'SOT23-6': 1.12, SOT223: 1.62, SOIC8: 1.52, IND5: 3.02, QFP16: 1.42, DPAK: 2.32, BATT: 6.02, SPK: 6.62 };
    plane.setLocalPosition(0, (top[p.pkg] ?? fp.height) + 0.015, p.pkg === 'SOT223' ? 0.3 : 0);
    e.addChild(plane);
  }

  private drawDisplay(d: { canvas: HTMLCanvasElement; tex: pc.Texture | null; text: string }, text: string, fg: string, bg: string, unit = ''): void {
    const key = text + unit;
    if (d.text === key || !d.tex) return;
    d.text = key;
    const ctx = d.canvas.getContext('2d')!;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, d.canvas.width, d.canvas.height);
    ctx.fillStyle = fg;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${d.canvas.height * 0.62}px "Courier New", monospace`;
    ctx.fillText(text, d.canvas.width * (unit ? 0.78 : 0.94), d.canvas.height * 0.54);
    if (unit) {
      ctx.font = `bold ${d.canvas.height * 0.3}px Arial, sans-serif`;
      ctx.fillText(unit, d.canvas.width * 0.96, d.canvas.height * 0.6);
    }
    d.tex.setSource(d.canvas);
  }

  private wire(from: pc.Vec3, to: pc.Vec3, color: pc.Color, sag = 30): void {
    const pts: pc.Vec3[] = [];
    const n = 16;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const p = new pc.Vec3().lerp(from, to, t);
      p.y -= Math.sin(Math.PI * t) * sag;
      p.y = Math.max(p.y, -BOARD_T + 1);
      pts.push(p);
    }
    const segs: pc.Vec3[] = [];
    for (let i = 0; i < n; i++) segs.push(pts[i], pts[i + 1]);
    this.app.drawLines(segs, color, true);
  }

  private local(e: pc.Entity, x: number, y: number, z: number): pc.Vec3 {
    return e.getWorldTransform().transformPoint(new pc.Vec3(x, y, z));
  }

  private pointWorld(p: PointRef): pc.Vec3 | null {
    const pad = this.geo.pads.find((q) => q.ref === p.ref && q.pin === p.pin);
    return pad ? this.toWorld(pad.x, pad.y, 0.25) : null;
  }

  private placeProbe(which: 'red' | 'black', p: PointRef | null): pc.Vec3 {
    const probe = this.probes[which];
    const w = p && !this.flipped ? this.pointWorld(p) : null;
    if (w) {
      probe.setPosition(w);
      probe.setEulerAngles(-28, which === 'red' ? -35 : 35, 0);
    } else {
      probe.setPosition(which === 'red' ? 128 : 116, -BOARD_T + 4.5, 150);
      probe.setEulerAngles(-90, which === 'red' ? 10 : 18, 0);
    }
    return this.local(probe, 0, 118, 0);
  }

  /** Iron-bow style palette: 0 = ambient (dark blue/purple) .. 1 = very hot (white-yellow). */
  private static heatColor(k: number): [number, number, number] {
    const stops: [number, number, number, number][] = [
      [0, 20, 10, 60],
      [0.25, 110, 20, 140],
      [0.5, 220, 60, 40],
      [0.75, 255, 170, 20],
      [1, 255, 250, 210],
    ];
    k = Math.max(0, Math.min(1, k));
    for (let i = 1; i < stops.length; i++) {
      const [k1, ...c1] = stops[i];
      const [k0, ...c0] = stops[i - 1];
      if (k <= k1) {
        const f = (k - k0) / (k1 - k0);
        return [0, 1, 2].map((j) => Math.round(c0[j] + (c1[j] - c0[j]) * f)) as [number, number, number];
      }
    }
    return [255, 250, 210];
  }

  private drawThermal(): void {
    const cv = this.thermalCanvas;
    const ctx = cv.getContext('2d')!;
    const s = this.session;
    const K = cv.width / s.board.device.width;
    const [r0, g0, b0] = BenchScene.heatColor(0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = `rgba(${r0},${g0},${b0},0.82)`;
    ctx.fillRect(0, 0, cv.width, cv.height);
    // Hot spots, auto-ranged like a real camera: ambient → 0, the hottest thing (at least 33 °C) → 1.
    ctx.globalCompositeOperation = 'lighter';
    let hottest = { ref: '', t: 0 };
    for (const c of Object.values(s.board.comps)) {
      const t = s.temps[c.ref] ?? 25;
      if (t > hottest.t) hottest = { ref: c.ref, t };
    }
    const span = Math.max(8, hottest.t - 25);
    for (const c of Object.values(s.board.comps)) {
      const t = s.temps[c.ref] ?? 25;
      const k = (t - 25) / span;
      if (k < 0.03) continue;
      const r = bodyRect(c.def);
      const cx = (r.x + r.w / 2) * K;
      const cy = (r.y + r.h / 2) * K;
      const rad = (Math.max(r.w, r.h) / 2 + 1.5 + Math.min(6, k * 6)) * K;
      const [cr, cg, cb] = BenchScene.heatColor(k);
      const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
      gr.addColorStop(0, `rgba(${cr},${cg},${cb},0.95)`);
      gr.addColorStop(0.45, `rgba(${cr},${cg},${cb},0.55)`);
      gr.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    // Spot-temperature readout like a real camera.
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(1 * K, 1 * K, 30 * K, 5 * K);
    ctx.fillStyle = '#fff';
    ctx.font = `${2.6 * K}px Arial, sans-serif`;
    ctx.fillText(`25 – ${(25 + span).toFixed(0)} °C`, 2 * K, 4.6 * K);
    if (hottest.t > 27) {
      const d = s.board.comps[hottest.ref].def;
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${3 * K}px Arial, sans-serif`;
      ctx.fillText(`✛ ${hottest.t.toFixed(1)}°C`, (d.x + 2) * K, (d.y - 2) * K);
    }
    this.thermalTex?.setSource(cv);
  }

  /** Screen position (CSS px) of a pad, or of a part's centre; null when the board is flipped or off screen. */
  screenOf(ref: string, pin?: string): { x: number; y: number } | null {
    if (this.flipped) return null;
    const pad = pin ? this.geo.pads.find((q) => q.ref === ref && q.pin === pin) : null;
    const def = this.session.board.comps[ref]?.def;
    if (!pad && !def) return null;
    const w = pad ? this.toWorld(pad.x, pad.y, 0.3) : this.toWorld(def!.x, def!.y, 1);
    const cam = this.camera.camera!;
    const sp = cam.worldToScreen(w);
    if (sp.z < 0) return null;
    const r = this.canvas.getBoundingClientRect();
    return { x: r.left + sp.x, y: r.top + sp.y };
  }

  /** Where the power cable plugs in: the mouth of the device's input connector. */
  private inputMouth(): pc.Vec3 {
    const dev = this.session.board.device;
    const def = dev.components.find((d) => d.ref === dev.input.ref)!;
    const pkg = this.session.board.comps[def.ref]?.part?.pkg ?? 'BARREL';
    const fp = FOOTPRINTS[pkg];
    const [lx, ly] = pkg === 'BARREL' ? [-fp.w / 2 - 1, 0] : [0, -fp.h / 2 - 1];
    const [dx, dy] = rotate(lx, ly, def.rot);
    return this.toWorld(def.x + dx, def.y + dy, pkg === 'BARREL' ? 6 : fp.height * 0.5);
  }

  private update(dt: number): void {
    const s = this.session;
    s.tick(Math.min(dt, 0.1));
    this.syncComponents();

    // LEDs + lamp
    const op = s.op;
    for (const [ref, v] of this.comps) {
      if (!v.lenses.length) continue;
      const i = op ? Math.max(0, op.current(ref)) : 0;
      const big = v.fullI >= 0.02;
      const k = Math.min(big ? 1.4 : 1.5, i / v.fullI);
      for (const m of v.lenses) {
        m.emissive = v.lensColor;
        m.emissiveIntensity = k * (big ? 6 : 4);
        m.update();
      }
      const glow = this.ledLights.get(ref);
      if (glow) glow.light!.intensity = this.flipped ? 0 : k * 0.9;
      if (ref === this.lampRef) {
        const def = s.board.comps[ref].def;
        this.lampLight.setPosition(this.toWorld(def.x, def.y, 22));
        this.lampLight.light!.intensity = k * 2.2;
      }
    }

    // Flip animation: rotate about the board's long axis, lift it clear, and rest it on its components.
    if (this.flipT !== this.flipTarget) {
      const step = dt / 0.9;
      this.flipT = this.flipTarget > this.flipT ? Math.min(1, this.flipT + step) : Math.max(0, this.flipT - step);
      const e = this.flipT * this.flipT * (3 - 2 * this.flipT);
      this.boardGroup.setLocalEulerAngles(180 * e, 0, 0);
      this.boardGroup.setLocalPosition(0, Math.sin(Math.PI * this.flipT) * 45 + e * (BOARD_T + 11.2), 0);
      if (this.flipT === 1 || this.flipT === 0) this.lampLight.enabled = this.flipT === 0;
    }
    if (!this.lampRef && this.lampLight.light!.intensity) this.lampLight.light!.intensity = 0;
    {
    }

    // Thermal camera
    if (this.thermalPlane) {
      const on = s.thermal && !this.flipped;
      this.thermalPlane.enabled = on;
      this.thermalT -= dt;
      if (on && this.thermalT <= 0) {
        this.thermalT = 0.25;
        this.drawThermal();
      }
    }

    // IPA wetness
    for (const [ref, v] of this.comps) {
      const w = s.wet[ref] ?? 0;
      v.wet.enabled = w > 0.01;
      if (v.wet.enabled) {
        v.wetMat.opacity = w * 0.5;
        v.wetMat.update();
      }
    }

    // Probes and leads
    const meterRed = this.local(this.meter, 0, 35.5, 64);
    const meterBlack = this.local(this.meter, -22, 35.5, 64);
    const redTop = this.placeProbe('red', s.meter.red);
    const blackTop = this.placeProbe('black', s.meter.black);
    this.wire(redTop, meterRed, new pc.Color(0.85, 0.12, 0.12), 25);
    this.wire(blackTop, meterBlack, new pc.Color(0.08, 0.08, 0.08), 25);

    // Power cables
    const postRed = this.local(this.psu, 0, 22, 116);
    const postBlack = this.local(this.psu, -40, 22, 116);
    const jackMouth = this.inputMouth();
    if (s.powerMode === 'psu-jack') {
      this.wire(postRed, jackMouth, new pc.Color(0.8, 0.1, 0.1), 15);
      this.wire(postBlack, jackMouth.clone().add(new pc.Vec3(0, -1, 1)), new pc.Color(0.1, 0.1, 0.1), 18);
    } else if (s.powerMode === 'adapter') {
      this.wire(jackMouth, new pc.Vec3(-260, -BOARD_T, 140), new pc.Color(0.05, 0.05, 0.05), 5);
    } else if (s.powerMode === 'psu-clips') {
      for (const [which, post, col] of [
        ['red', postRed, new pc.Color(0.85, 0.12, 0.12)],
        ['black', postBlack, new pc.Color(0.1, 0.1, 0.1)],
      ] as const) {
        const p = this.flipped ? null : s.psu[which];
        const w = p && this.pointWorld(p);
        if (w) {
          this.wire(post, w.clone().add(new pc.Vec3(0, 6, 0)), col, 12);
          this.app.drawLine(w, w.clone().add(new pc.Vec3(0, 6, 0)), col, true);
        }
      }
    }

    // Instrument displays
    const r = s.reading;
    const lcdText = r ? r.display : s.meter.mode === 'dcv' ? '0.000' : 'OL';
    this.drawDisplay(this.lcd, lcdText, '#1d2418', '#a9b897', r?.display === 'OL' ? '' : (r?.unit ?? (s.meter.mode === 'dcv' ? 'V' : s.meter.mode === 'diode' ? 'V' : 'Ω')));
    if (this.meterDial) {
      const ang = { dcv: -45, ohm: 0, continuity: 35, diode: 70, esr: 100 }[s.meter.mode];
      this.meterDial.setLocalEulerAngles(0, -ang, 0);
    }
    const psuOn = s.powerMode.startsWith('psu') && op;
    this.drawDisplay(this.psuV, psuOn ? Math.max(0, op!.srcV).toFixed(2) : s.psu.v.toFixed(2), psuOn ? '#ff6a3d' : '#7a2c1c', '#120c0a', 'V');
    this.drawDisplay(this.psuA, psuOn ? Math.max(0, op!.srcI).toFixed(3) : s.psu.ilim.toFixed(3), psuOn ? '#ff6a3d' : '#7a2c1c', '#120c0a', 'A');

    // Soldering iron
    if (this.ironTarget && !this.flipped) {
      const d = s.board.comps[this.ironTarget].def;
      this.iron.setPosition(this.toWorld(d.x + 0.5, d.y, 1.2));
      this.iron.setEulerAngles(40, 120, 0);
    } else {
      this.iron.setPosition(-175, -BOARD_T + 7, 30);
      this.iron.setEulerAngles(-90, -20, 0);
    }

    // Boardview-style net highlight: hovering a pad lights up every bit of copper on its net
    const hp = this.hover?.pad;
    if (hp && s.guided && !this.flipped) this.drawNet(hp.net);

    // Tact switch plungers
    for (const ctl of s.board.device.controls) {
      const cap = this.comps.get(ctl.ref)?.cap;
      if (cap) cap.setLocalPosition(0, s.board.pressed.includes(ctl.ref) ? -0.7 : 0, 0);
    }

    // Hover marker + selection outline
    const h = this.hover;
    if (h?.pad && (s.tool === 'probe' || s.tool === 'clip' || s.tool === 'jumper')) {
      this.hoverMarker.enabled = true;
      this.hoverMarker.setPosition(this.toWorld(h.pad.x, h.pad.y, 0.3));
      const d = Math.max(h.pad.w, h.pad.h) + 0.6;
      this.hoverMarker.setLocalScale(d, 0.1, d);
    } else this.hoverMarker.enabled = false;
    if (s.selected && !this.flipped) {
      const r2 = bodyRect(s.board.comps[s.selected].def);
      const m = 1;
      const a = this.toWorld(r2.x - m, r2.y - m, 0.4);
      const b = this.toWorld(r2.x + r2.w + m, r2.y + r2.h + m, 0.4);
      const col = new pc.Color(1, 0.85, 0.2);
      const c1 = new pc.Vec3(b.x, a.y, a.z);
      const c3 = new pc.Vec3(a.x, a.y, b.z);
      this.app.drawLines([a, c1, c1, b, b, c3, c3, a], col, false);
    }

    // Smoke
    for (const p of this.puffs) {
      p.t += dt;
      if (p.t < 0) continue;
      const pos = p.e.getPosition();
      p.e.setPosition(pos.x + p.vx * dt, pos.y + 14 * dt, pos.z + p.vz * dt);
      const sc = 1.5 + p.t * 5;
      p.e.setLocalScale(sc, sc, sc);
      p.mat.opacity = Math.max(0, 0.55 * (1 - p.t / 2.5));
      p.mat.update();
    }
    this.puffs = this.puffs.filter((p) => {
      if (p.t > 2.5) {
        p.e.destroy();
        return false;
      }
      return true;
    });
  }
}
