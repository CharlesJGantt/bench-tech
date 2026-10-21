// Converts the Bench Tech soundtrack WAVs to MP3 (public/music/*.mp3) and writes the track list
// (public/music/tracks.json). Pure JavaScript (lamejs), no ffmpeg needed.
//
//   node tools/encode-music.mjs [source folder] [kbps]
//
// Default source: C:\Users\cjgan\Music\AIMusicMaker\swaggorithm\bench-tech-soundtrack, 112 kbps.
import { createRequire } from 'node:module';
import { mkdirSync, readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
// lamejs' bundled build is a browser script that defines a global: run it in its own context.
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(readFileSync(require.resolve('lamejs/lame.all.js'), 'utf8') + ';this.lamejs = lamejs;', sandbox);
const lamejs = sandbox.lamejs;

const src = process.argv[2] ?? 'C:\\Users\\cjgan\\Music\\AIMusicMaker\\swaggorithm\\bench-tech-soundtrack';
const kbps = parseInt(process.argv[3] ?? '112', 10);
const out = 'public/music';
mkdirSync(out, { recursive: true });

/** Titles the file name cannot spell (accents). */
const TITLES = { 'focado-na-repara-o': 'Focado Na Reparação' };
const titleOf = (slug) => TITLES[slug] ?? slug.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');

function readWav(buf) {
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') throw new Error('not a WAV file');
  let pos = 12;
  let fmt = null;
  while (pos + 8 <= buf.length) {
    const id = buf.toString('ascii', pos, pos + 4);
    const size = buf.readUInt32LE(pos + 4);
    if (id === 'fmt ') fmt = { format: buf.readUInt16LE(pos + 8), channels: buf.readUInt16LE(pos + 10), rate: buf.readUInt32LE(pos + 12), bits: buf.readUInt16LE(pos + 22) };
    if (id === 'data') {
      if (!fmt || fmt.bits !== 16 || fmt.format !== 1) throw new Error('only 16-bit PCM WAV is supported');
      const end = Math.min(buf.length, pos + 8 + size);
      const view = new Int16Array(buf.buffer.slice(buf.byteOffset + pos + 8, buf.byteOffset + end - ((end - pos - 8) % 2)));
      return { ...fmt, samples: view };
    }
    pos += 8 + size + (size % 2);
  }
  throw new Error('no data chunk');
}

const files = readdirSync(src).filter((f) => f.toLowerCase().endsWith('.wav')).sort();
const tracks = [];
let total = 0;
for (const f of files) {
  const t0 = Date.now();
  const wav = readWav(readFileSync(join(src, f)));
  const ch = Math.min(2, wav.channels);
  const enc = new lamejs.Mp3Encoder(ch, wav.rate, kbps);
  const frames = wav.samples.length / wav.channels;
  const left = new Int16Array(frames);
  const right = ch === 2 ? new Int16Array(frames) : null;
  for (let i = 0; i < frames; i++) {
    left[i] = wav.samples[i * wav.channels];
    if (right) right[i] = wav.samples[i * wav.channels + 1];
  }
  const parts = [];
  // Exactly one MP3 frame per call: lamejs outputs near-silence when fed bigger blocks.
  const BLOCK = 1152;
  for (let i = 0; i < frames; i += BLOCK) {
    const l = left.subarray(i, i + BLOCK);
    const chunk = right ? enc.encodeBuffer(l, right.subarray(i, i + BLOCK)) : enc.encodeBuffer(l);
    if (chunk.length) parts.push(Buffer.from(chunk));
  }
  const tail = enc.flush();
  if (tail.length) parts.push(Buffer.from(tail));
  const m = /^(\d+)\s+(.+)\.wav$/i.exec(f);
  const num = m ? m[1] : String(tracks.length + 1).padStart(2, '0');
  const slug = (m ? m[2] : f.replace(/\.wav$/i, '')).toLowerCase().replace(/[^a-z0-9-]+/g, '-');
  const name = `${num}-${slug}.mp3`;
  writeFileSync(join(out, name), Buffer.concat(parts));
  const bytes = statSync(join(out, name)).size;
  total += bytes;
  tracks.push({ file: name, title: titleOf(slug), seconds: Math.round(frames / wav.rate) });
  console.log(`${name}  ${(bytes / 1048576).toFixed(1)} MB  ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}
writeFileSync(join(out, 'tracks.json'), JSON.stringify(tracks, null, 1));
console.log(`${tracks.length} tracks, ${(total / 1048576).toFixed(1)} MB at ${kbps} kbps`);
