# Bench Tech: game library, media and artwork (2026-10-26)

Source files (yours, in `docs/`): `Bench_Tech_Game_Library_1396_SKUs_Expanded.csv` (every game),
`Bench_Tech_Master_Games_Media_Catalog_V3_1396_Titles.md`, `Bench_Tech_Image_Asset_Manifest_2792_Assets.csv` (every
image to make), `Bench_Tech_Image_Asset_Master_List.md`, `Bench_Tech_Console_Aspect_Ratio_Master_List.md`,
`Bench_Tech_Unique_Game_Title_Inventory.md`, `Bench_Tech_new-Console_and_Controller_TO_CREATE_List.md`.

## What the library is
- **1,396 game titles on 28 platforms.** The six retro platforms (BES, B64, Vega, Paltari, Dream Boy, Dream Boy
  Advance) have 53 titles each; the other 22 platforms have 49 each.
- **34 titles were already in the game** and are kept: 4 each for BES, B64, Vega, Paltari, Dream Boy, Dream Boy
  Advance, plus 5 each for Funstation 5 and Sbox One X.
- **Media (what the physical item is):** cartridges 465, microSD cards 49, SD game packs 49, CD 294, DVD 49, mini DVD
  98, mini CD 49, Blu-ray 245, ultra-HD Blu-ray 98.
- **Rarity:** Common 810, Uncommon 325, Scarce 159, Rare 56, Very Rare 24, Collector 12, Grail 10 (multipliers 1.00,
  1.18, 1.45, 1.75, 2.20, 2.80, 5.00). 22 titles are marked high-value collector titles.
- **Cross-platform releases:** 210 releases belong to a game sold on 2 to 7 platforms (they share one artwork identity).
- The CSV has columns for condition grade, grade multiplier, appraised value and a unique copy id, all **empty so far**:
  they are for individual copies of a game (a copy's condition changes its value).

## Platforms and their media
| Platform id | Console / handheld | Medium | Hardware in the game today |
|---|---|---|---|
| BES, B64, VEGA, PALT | Bintendo Entertainment System, Bintendo 64, Vega Exodus, Paltari Family Console | cartridge | built, with carts |
| DB, DBA | Dream Boy / Pocket / Color, Dream Boy Advance / SP / Micro | cartridge | built, with carts |
| BUTTON | Button Lite | 6-pin game card | built (no game names used yet) |
| RB35 | Retrobit RB35 | microSD | built (no game names used yet) |
| FS5, SB1X | Funstation 5, Sbox One X | ultra-HD Blu-ray | boards built (HDMI / power sections only); disc job titles use the library |
| PJOY | Bintendo Pocket Joy Advance | mini cartridge | not built |
| SINN | Homey Sinnusus | retro cartridge | not built |
| GORB | Bintentendo Game Orb | optical disc (mini DVD class) | not built |
| SWAMA | Swamarami All-In-One | SD game pack | not built |
| DJ1, DJ2, DJ3, DJP | DiscJockie 1, 2, 3, Pocket | CD, DVD, Blu-ray, mini CD | not built |
| FS1 to FS4 | Funstation 1 to 4 | CD, DVD, Blu-ray | not built |
| SB1, SB2, SB720, SB10, SBS | Sbox 1, 2, 720, 10, S | DVD, DVD, DVD, Blu-ray, Blu-ray | not built |
| PYRAMID | Bintendo Pyramid | Bintendo Mini-Disc (own format) | not built |

## Artwork (made by Codex, being redone: a few more days)
- **One image set per unique title per console; a game released on several consoles reuses the artwork.**
- 2,792 files: 1,396 labels (cartridge, disc or SD label, 128 / 256 / 512 px squares; discs are round with a transparent
  hub) and 1,396 loading screens (4:3 at 960 x 720 for retro systems, 16:9 at 960 x 540 for HD systems).
- Raw art lives in `assets/Game Cart and Disk and Loading Images/<Platform>/<Title>/label.webp + loading.webp`
  (about 460 MB so far; **not in git**; the folder is in `.gitignore`). Codex's own status file
  (`ARTWORK_REBUILD_STATUS.md` there) says its first fast pass was derived art and that every title must get genuinely
  unique illustrations (first block done: 20 Bintendo 64 titles).
- **Correction (2026-10-26, from you):** Codex reused assets a lot, so most of the first pass is not usable. Only about
  **25-30 titles have the correct stylised typography** on the art. Codex is redoing the art as its usage allows, over
  the next few days. Treat everything in the raw folder as provisional until you say a title (or the set) is finished.
- **We do not touch the art until it is finished.** The optimizer stays unused; no art goes into the game before then.

## What is wired in the game now (committed after this note)
- `tools/build-games.py` builds `src/data/games.json` from the CSV and the manifest; `src/sim/games.ts` loads it.
- The retro cartridge devices and the Funstation 5 / Sbox One X disc jobs take their titles from the library.
- `tools/build-game-art.py` makes small in-game copies of finished art into `public/games/` (labels and loading
  screens) and an index of what exists. **Written but not used**; run it only when the art is finished.

## Still to do for the library
- Use the loading screens (the cart / disc test station shows the title's loading screen when it boots).
- Put the label art on the 3D cartridge and disc meshes (Blender models need a label slot) and on SD cards.
- Condition grades and per-copy appraisal; rarity and collector values in the shop and on the marketplace.
- Marketplace game lots; the storefront game racks; posters from the art (see `WORLD_AND_MENU_PLAN.md`).
- Media for the new consoles (discs for DJ / FS / SB, the Bintendo Mini-Disc, the Pocket Joy, Sinnusus and Swamarami
  media); each has its own media id and mesh, and media incompatibility is not an electronics fault.
- Decide how the full 49-title lists affect cart job frequency and values on the retro consoles.
- Image size: ~460 MB raw. Decide the shipped size (the optimizer defaults: labels 256 px, loading 640 px wide).
