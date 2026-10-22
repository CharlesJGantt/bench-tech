"""
Check that the recorded tutorial narration says what the step text says: every clip in
public/voice is transcribed with Whisper (speech-to-text) and compared, word by word, with the
text it was generated from (tools/narration.json). Prints the steps that differ.

    pip install faster-whisper
    python tools/verify-voice.py [similarity threshold, default 0.93]
"""
import difflib
import json
import os
import re
import sys

from faster_whisper import WhisperModel

THRESHOLD = float(sys.argv[1]) if len(sys.argv) > 1 else 0.93

ONES = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split()
TENS = 'zero ten twenty thirty forty fifty sixty seventy eighty ninety'.split()


def words_for(n: int) -> str:
    if n < 20:
        return ONES[n]
    if n < 100:
        return TENS[n // 10] + ('' if n % 10 == 0 else ' ' + ONES[n % 10])
    if n < 1000:
        return ONES[n // 100] + ' hundred' + ('' if n % 100 == 0 else ' ' + words_for(n % 100))
    return str(n)


def norm(text: str) -> list[str]:
    t = text.lower()
    t = t.replace('&', ' and ').replace('%', ' percent ')
    t = re.sub(r'(\d+)\s*a\b', r'\1 amp', t)  # "1A" -> "1 amp"
    t = re.sub(r'\d+', lambda m: ' ' + words_for(int(m.group())) + ' ', t)
    t = re.sub(r"[^a-z' ]+", ' ', t)
    t = t.replace('okay', 'ok')
    return [w for w in t.split() if w]


model = WhisperModel('base.en', device='cpu', compute_type='int8')
steps = json.load(open('tools/narration.json', encoding='utf-8'))
bad = 0
for st in steps:
    path = os.path.join('public', 'voice', f"{st['id']}.{st['hash']}.mp3")
    if not os.path.exists(path):
        print(f"MISSING  {st['id']}")
        bad += 1
        continue
    segments, _ = model.transcribe(path, language='en', beam_size=5, condition_on_previous_text=False)
    heard = ' '.join(s.text for s in segments)
    a, b = norm(st['text']), norm(heard)
    score = difflib.SequenceMatcher(None, a, b).ratio()
    if score < THRESHOLD:
        bad += 1
        print(f"{score:.2f}  {st['id']}")
        sm = difflib.SequenceMatcher(None, a, b)
        for op, i1, i2, j1, j2 in sm.get_opcodes():
            if op != 'equal':
                print(f"      {op}: text '{' '.join(a[i1:i2])}'  ->  heard '{' '.join(b[j1:j2])}'")
print(f"checked {len(steps)} clips; {bad} below {THRESHOLD}")
