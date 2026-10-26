"""
Turns the finished game artwork into the small files the game loads.

    python tools/build-game-art.py [--loading-width 640] [--label-size 256] [--quality 72] [--dry]

Source:  assets/Game Cart and Disk and Loading Images/<Platform>/<Title>/label.webp + loading.webp   (made elsewhere)
Output:  public/games/<art>/label.webp + loading.webp      (<art> comes from src/data/games.json, e.g. "bes/pipe-brothers")
         public/games/index.json                           (which games have which art, so the game never requests a missing file)

Run `python tools/build-games.py` first if the library changed. Only changed or new files are rewritten. The raw
artwork is not in git (it is hundreds of MB); the optimised copies are small enough to ship.
"""
import argparse
import json
import os
import re
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets', 'Game Cart and Disk and Loading Images')
OUT = os.path.join(ROOT, 'public', 'games')
DATA = os.path.join(ROOT, 'src', 'data', 'games.json')

ap = argparse.ArgumentParser()
ap.add_argument('--loading-width', type=int, default=640)
ap.add_argument('--label-size', type=int, default=256)
ap.add_argument('--quality', type=int, default=72)
ap.add_argument('--dry', action='store_true')
args = ap.parse_args()

data = json.load(open(DATA, encoding='utf-8'))
platform_name = {pid: p['name'] for pid, p in data['platforms'].items()}


def safe(name: str) -> str:
    """Folder-name version of a title or platform: path separators and Windows-illegal characters become '_'."""
    return re.sub(r'[<>:"/\\|?*]', '_', name).strip()


def find(folder: str, title: str, base: str):
    """The source file for a title, tolerating small naming differences (case, trailing dots)."""
    direct = os.path.join(SRC, folder, title, base)
    if os.path.exists(direct):
        return direct
    plat = os.path.join(SRC, folder)
    if not os.path.isdir(plat):
        return None
    want = title.lower().rstrip('. ')
    for d in os.listdir(plat):
        if d.lower().rstrip('. ') == want and os.path.exists(os.path.join(plat, d, base)):
            return os.path.join(plat, d, base)
    return None


made = {}
sizes = [0, 0]
missing = 0
for g in data['games']:
    folder = safe(platform_name[g['p']])
    title = safe(g['t'])
    out_dir = os.path.join(OUT, g['a'])
    have = {}
    for kind, width in (('label', args.label_size), ('loading', args.loading_width)):
        src = find(folder, title, f'{kind}.webp')
        if not src:
            continue
        dst = os.path.join(out_dir, f'{kind}.webp')
        have[kind] = 1
        if os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src):
            sizes[0 if kind == 'label' else 1] += os.path.getsize(dst)
            continue
        if args.dry:
            continue
        os.makedirs(out_dir, exist_ok=True)
        im = Image.open(src)
        if im.width > width:
            im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
        im.save(dst, 'WEBP', quality=args.quality, method=6)
        sizes[0 if kind == 'label' else 1] += os.path.getsize(dst)
    if have:
        made[g['a']] = ('l' if 'label' in have else '') + ('s' if 'loading' in have else '')
    else:
        missing += 1

if not args.dry:
    os.makedirs(OUT, exist_ok=True)
    json.dump(made, open(os.path.join(OUT, 'index.json'), 'w', encoding='utf-8'), separators=(',', ':'))
print(f'{len(made)} games with art, {missing} without. Labels {sizes[0] // 1024} KB, loading screens {sizes[1] // 1024} KB.')
sys.exit(0)
