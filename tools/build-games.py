"""
Builds src/data/games.json from the game library CSV and the image-asset manifest.

    python tools/build-games.py

Input:  docs/Bench_Tech_Game_Library_1396_SKUs_Expanded.csv   (every game: platform, title, medium, genre, value, rarity)
        docs/Bench_Tech_Image_Asset_Manifest_2792_Assets.csv  (where each game's label / loading art lives in the game)
Output: src/data/games.json  (compact: the game reads it through src/sim/games.ts)

The art itself is made elsewhere (assets/Game Cart and Disk and Loading Images/...) and turned into the in-game
files by tools/build-game-art.py.
"""
import csv
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIB = os.path.join(ROOT, 'docs', 'Bench_Tech_Game_Library_1396_SKUs_Expanded.csv')
MAN = os.path.join(ROOT, 'docs', 'Bench_Tech_Image_Asset_Manifest_2792_Assets.csv')
OUT = os.path.join(ROOT, 'src', 'data', 'games.json')


def money(s: str) -> float:
    return float(re.sub(r'[^0-9.]', '', s) or 0)


lib = list(csv.DictReader(open(LIB, encoding='utf-8-sig')))
man = list(csv.DictReader(open(MAN, encoding='utf-8-sig')))

# sku -> art folder ("b64/pipe-brothers-64"); the loading screen's shape is read from the image itself
art = {}
for r in man:
    path = r['asset_path']
    m = re.match(r'assets/games/(.+)/(label|loading)\.\w+$', path)
    if not m:
        continue
    art[r['sku']] = m.group(1)

platforms = {}
games = []
for r in lib:
    pid = r['platform_id']
    if pid not in platforms:
        platforms[pid] = {'name': r['platform'], 'media': r['media'], 'medium': r['medium']}
    games.append(
        {
            'sku': r['sku'],
            'p': pid,
            't': r['title'],
            'g': r['genre'],
            'v': money(r['value']),
            'r': r['rarity'],
            'm': float(r['rarity_mult'] or 1),
            'x': r['cross_platform_title_id'],
            'a': art.get(r['sku'], ''),
            'c': 1 if r['status'] == 'Already Created' else 0,
            'hv': 1 if r['high_value_collector_title'] == 'Yes' else 0,
        }
    )

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, 'w', encoding='utf-8') as f:
    json.dump({'platforms': platforms, 'games': games}, f, ensure_ascii=False, separators=(',', ':'))
print(f'{len(games)} games, {len(platforms)} platforms, {sum(1 for g in games if g["a"])} with art paths -> {os.path.relpath(OUT, ROOT)} ({os.path.getsize(OUT) // 1024} KB)')
sys.exit(0)
