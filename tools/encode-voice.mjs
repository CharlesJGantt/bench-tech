// Turns the recorded narration WAVs (.voice-work, from tools/generate-voice.py) into small mono
// MP3s in public/voice/<id>.<hash>.mp3, and removes clips whose step text has since changed.
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
// lamejs' bundled build is a browser script that defines a global: run it in its own context.
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(readFileSync(require.resolve('lamejs/lame.all.js'), 'utf8') + ';this.lamejs = lamejs;', sandbox);
const lamejs = sandbox.lamejs;

const KBPS = 56;
const work = '.voice-work';
const out = 'public/voice';
mkdirSync(out, { recursive: true });

function readWav(buf) {
  let pos = 12;
  let fmt = null;
  while (pos + 8 <= buf.length) {
    const id = buf.toString('ascii', pos, pos + 4);
    const size = buf.readUInt32LE(pos + 4);
    if (id === 'fmt ') fmt = { format: buf.readUInt16LE(pos + 8), channels: buf.readUInt16LE(pos + 10), rate: buf.readUInt32LE(pos + 12), bits: buf.readUInt16LE(pos + 22) };
    if (id === 'data') {
      if (!fmt || fmt.bits !== 16 || fmt.format !== 1) throw new Error('only 16-bit PCM WAV is supported');
      const end = Math.min(buf.length, pos + 8 + size);
      return { ...fmt, samples: new Int16Array(buf.buffer.slice(buf.byteOffset + pos + 8, buf.byteOffset + end - ((end - pos - 8) % 2))) };
    }
    pos += 8 + size + (size % 2);
  }
  throw new Error('no data chunk');
}

const keep = new Set();
let total = 0;
for (const f of readdirSync(work).filter((x) => x.endsWith('.wav'))) {
  const name = f.replace(/\.wav$/, '.mp3');
  keep.add(name);
  if (existsSync(join(out, name))) continue;
  const wav = readWav(readFileSync(join(work, f)));
  const enc = new lamejs.Mp3Encoder(1, wav.rate, KBPS);
  const mono = new Int16Array(wav.samples.length / wav.channels);
  for (let i = 0; i < mono.length; i++) mono[i] = wav.samples[i * wav.channels];
  const parts = [];
  // Exactly one MP3 frame (1152 samples) per call: lamejs outputs near-silence when fed bigger blocks.
  for (let i = 0; i < mono.length; i += 1152) {
    const c = enc.encodeBuffer(mono.subarray(i, i + 1152));
    if (c.length) parts.push(Buffer.from(c));
  }
  const t = enc.flush();
  if (t.length) parts.push(Buffer.from(t));
  writeFileSync(join(out, name), Buffer.concat(parts));
  console.log(name);
}
// Drop clips for step text that no longer exists
for (const f of readdirSync(out).filter((x) => x.endsWith('.mp3'))) if (!keep.has(f)) rmSync(join(out, f));
for (const f of readdirSync(out)) total += readFileSync(join(out, f)).length;
console.log(`${keep.size} clips, ${(total / 1048576).toFixed(1)} MB`);
