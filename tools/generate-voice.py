"""
Record the tutorial narration: reads tools/narration.json (written from the game by
`window.tutorial.scripts()`: id, text, hash for every step) and speaks each step with the Kokoro
neural voice into .voice-work/<id>.<hash>.wav. `node tools/encode-voice.mjs` then turns those
into the small MP3s the game plays (public/voice).

    pip install kokoro-onnx soundfile
    python tools/generate-voice.py [voice]        # default voice: am_michael (American male)

Other American male voices: am_adam, am_eric, am_fenrir, am_liam, am_onyx. The model files
(~350 MB) are downloaded once into ~/.cache/kokoro.
"""
import json
import os
import re
import sys
import urllib.request

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

VOICE = sys.argv[1] if len(sys.argv) > 1 else os.environ.get('VOICE', 'am_michael')
SPEED = float(os.environ.get('SPEED', '0.92'))
# Pauses (seconds): after a full stop / question / exclamation, and at a dash or aside
GAP_SENTENCE = 0.35
GAP_CLAUSE = 0.15
CACHE = os.path.join(os.path.expanduser('~'), '.cache', 'kokoro')
BASE = 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/'
OUT = '.voice-work'

os.makedirs(CACHE, exist_ok=True)
os.makedirs(OUT, exist_ok=True)
for name in ('kokoro-v1.0.onnx', 'voices-v1.0.bin'):
    path = os.path.join(CACHE, name)
    if not os.path.exists(path):
        print('downloading', name)
        urllib.request.urlretrieve(BASE + name, path)

kokoro = Kokoro(os.path.join(CACHE, 'kokoro-v1.0.onnx'), os.path.join(CACHE, 'voices-v1.0.bin'))
steps = json.load(open('tools/narration.json', encoding='utf-8'))


def spoken(text: str) -> str:
    """Strip symbols the voice would stumble over (arrows, emoji, bullets)."""
    text = re.sub(r'[←-⇿⌀-⏿☀-➿\U0001F000-\U0001FAFF]', '', text)
    return re.sub(r'\s+', ' ', text).strip()


def speak(clause: str):
    """One clause of speech. The model occasionally babbles on after a short clause, so a take that
    is far longer than the words need is thrown away and recorded again (slightly different speed)."""
    limit = max(1.8, len(clause) / 8 + 0.8)
    for attempt in range(6):
        samples, rate = kokoro.create(clause, voice=VOICE, speed=SPEED + 0.01 * attempt, lang='en-us')
        if len(samples) / rate <= limit:
            return samples, rate
        print(f"   retake ({len(samples) / rate:.1f}s for {len(clause)} characters): {clause[:50]}")
    return samples, rate


wanted = {f"{st['id']}.{st['hash']}.wav" for st in steps}
for old in os.listdir(OUT):
    if old.endswith('.wav') and old not in wanted:
        os.remove(os.path.join(OUT, old))

for i, st in enumerate(steps, 1):
    path = os.path.join(OUT, f"{st['id']}.{st['hash']}.wav")
    if os.path.exists(path):
        continue
    chunks = []
    rate = 24000
    for sentence in re.split(r'(?<=[.!?:])\s+', spoken(st['text'])):
        clauses = [c for c in re.split(r'\s+,\s+', sentence) if c.strip()]
        for j, clause in enumerate(clauses):
            samples, rate = speak(clause)
            chunks.append(samples)
            chunks.append(np.zeros(int(rate * (GAP_SENTENCE if j == len(clauses) - 1 else GAP_CLAUSE)), dtype=samples.dtype))
    samples = np.concatenate(chunks) if chunks else np.zeros(1, dtype='float32')
    sf.write(path, samples, rate)
    print(f"[{i}/{len(steps)}] {st['id']}  {len(samples) / rate:.1f}s")
print('done')
