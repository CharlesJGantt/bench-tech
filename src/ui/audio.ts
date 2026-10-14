let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** Multimeter continuity beep. */
export function beep(duration = 0.18): void {
  const a = ac();
  if (!a) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = 'square';
  o.frequency.value = 2700;
  g.gain.value = 0.05;
  o.connect(g).connect(a.destination);
  o.start();
  o.stop(a.currentTime + duration);
}

/** Short noise burst: fuse pop / capacitor pop. */
export function pop(loud = 1): void {
  const a = ac();
  if (!a) return;
  const len = 0.12;
  const buf = a.createBuffer(1, a.sampleRate * len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (a.sampleRate * 0.015));
  const src = a.createBufferSource();
  const g = a.createGain();
  g.gain.value = 0.5 * loud;
  src.buffer = buf;
  src.connect(g).connect(a.destination);
  src.start();
}

/** Sizzle for smoke events. */
export function sizzle(): void {
  const a = ac();
  if (!a) return;
  const len = 1.2;
  const buf = a.createBuffer(1, a.sampleRate * len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.3 * Math.min(1, (d.length - i) / (a.sampleRate * 0.5));
  const src = a.createBufferSource();
  const f = a.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = 3000;
  const g = a.createGain();
  g.gain.value = 0.25;
  src.buffer = buf;
  src.connect(f).connect(g).connect(a.destination);
  src.start();
}
