# Bench Tech — Static Game Image Asset Master List (Codex Implementation Handoff)

**Version:** 2.0 — static offline production workflow. **Scope:** 1,396 platform-specific releases, 1,260 shared game identities, 28 platform/media families.

> **NON-NEGOTIABLE: The game does not generate artwork, labels, or loading screens.** Codex produces every final texture before the game is run. Do not implement runtime Canvas drawing, procedural media labels, loading-screen composition, AI image generation, text-to-texture, or dynamic texture exports in PlayCanvas. The game only loads and displays static files produced offline.

## Deliverables and production counts

| Final static asset | Outputs |
|---|---:|
| Game Cartridge Label | 465 |
| Game Disk Label | 833 |
| Game SD Label | 98 |
| Game Loading Screen | 1,396 |
| **Total static output files** | **2,792** |

**These are final exported image counts, not individually hand-illustrated images.** Make the final static outputs by running an offline batch-generation process in Codex. Use source artwork, reusable genre backgrounds, layers, template masks, logos, and proper text layout; do not have the shipped game generate, crop, label, or composite them.

### Source-art strategy (offline only)

- **52 reusable genre backgrounds:** exactly two backgrounds per each of the 26 genres in the current library. The recipe CSV enumerates `background_id` assignments.
- **18 reusable graphic-layout styles:** `LAYOUT-01` through `LAYOUT-18`, with varied typography, silhouettes, framing, and graphical details. Apply palettes, title styles, hero graphic/symbol treatments and contrast changes to avoid repetitive-looking covers.
- **22 distinctive collector/grail identities:** dedicate extra source work to these; reuse their art for cross-platform copies. This count is based on *distinct game identities*, not per-platform SKUs.
- **1,260 game recipes** (one per shared title identity) specify the source/template choices; compose game art during the Codex asset-generation step. Do not save a separate full-resolution master PNG for every identity unless it meaningfully helps the build pipeline.
- Cross-platform releases use the same core artwork / visual identity but have separate platform-specific static label and loading images. All asset paths remain unique by platform SKU.
- Art for higher-value games may need manual attention; do not automatically invent distinct game-cover art when a reusable template produces a good result.

## Resolution and output formats

| Asset | Target static output | Implementation |
|---|---|---|
| Shared genre/background source | 512 × 512 px or comparable | Offline source texture, not shipped unless actually referenced. |
| Cartridge labels | Max 512 × 512 px canvas | Crop into each console/cartridge label template; avoid stretching; respect label safe area. |
| Mini-cartridge / game-card labels | Max 256 × 256 px canvas | Small high-contrast design for handheld-sized carts. |
| Disc labels: CD / DVD / Blu-ray / UHD | 512 × 512 px | Shared circular art mask with center hole; disc mesh reused. |
| Mini-disc labels | 256 × 256 px | Small circular art mask with center hub. |
| Standard SD label | 256 × 256 px | Card print / UV-specific region. |
| microSD label | 128 × 128 px | Minimal title and symbol; prioritize readability. |
| Loading/title screens | 960 × 540 px (16:9) | **Pre-rendered static** from cover/genre art and independently laid-out title / platform branding. |
| Collector and Grail source artwork | Up to 1024 × 1024 px | Higher-detail source art only when justified by close-up viewing. Final outputs use normal texture budget unless a real in-game close-up needs more. |

**File format:** WebP as the primary delivery format, approximately quality 80–85 subject to legibility and visual tests. Preserve transparency where the UV/material requires it. Output canvas dimensions define texture budgets, not the final visual label aspect ratio; use template masks/UVs rather than stretching artwork.

If a UI/zoom test reveals visible blur, selectively replace that image with 1280×720 or a 1024-px label; do not upscale all assets. Use well-placed text at the final target resolution so it is legible.

## Artwork pipeline Codex must implement once

1. **Audit existing assets.** The 34 `Already Created` game releases are *game record statuses*, not proof that both art assets exist. Check their legacy `.png` paths, keep satisfactory artwork, optionally convert to static `.webp`, and update their references. Do not overwrite existing finished art without a reason.
2. **Create the source kit.** Author or generate reusable genre backgrounds, foreground motif elements, typography/label layouts, controller/console family logo placements, circular disc masks, and card/cartridge-specific safe zones. Make a small test batch before bulk export.
3. **Generate cover compositions offline.** Use `Bench_Tech_Static_Artwork_Recipes_1260.csv` to choose each unique game identity’s background, layout, accent palette, typography, and custom art direction. For cross-platform titles reuse the identity art. This is a build-time Codex job; never the game engine.
4. **Export media labels offline.** For every row of type label in the 2,792-row manifest, apply the title art to the correct physical format and platform logo, then export a static `.webp` image to `asset_path`. Preserve proper transparent center holes for disc labels when material mapping requires them.
5. **Export loading screens offline.** For every row of type loading screen, precompose its platform-specific branding, game title, and art into a 960×540 `.webp` image. The game loads the exact pre-existing image; it does not reconstruct it with code.
6. **Validate + save.** Confirm every required file exists and has expected dimensions, unique path, correct game/media text, readable title, alpha where appropriate, and no accidental missing/empty texture. Generate a contact sheet for spot checks. Report actual generated, reused and missing counts.
7. **Integrate.** Update the game’s asset references to the completed static WebP files. Keep media model meshes shared, but the label UV texture is selected from the static files associated with the actual game SKU.

### Efficient work batching

- Group game recipes by genre to reduce switching between artwork styles, then export labels by console family for consistent cropping and branding.
- Start with a **24-game pilot** across a mix of cartridge, SD, standard discs, mini discs, and loading screens. Check visually in Bench Tech on real 3D models before rendering the whole library.
- Make predictable, deterministic output. Re-running the pipeline should not change game art unless the recipe or source asset changes. Use the stable `shared_game_identity`, `sku`, and template IDs for file keys.
- Prefer one offline compositing CLI/script (Pillow/Sharp/ImageMagick or similar) orchestrated by Codex for layout, scaling, masking, labels, text and WebP export. New illustration sources can be authored in batches; source graphics should not be an individual illustration for every single release.
- For game titles where a simple crop cuts off important content, reposition the artwork and use an outpaint-like extend/background region or graphic border at **build time**, rather than naive cropping. Keep title/logo overlays inside safe zones.
- Do not create ten grade-dependent label files per SKU; condition grade changes game valuation and separate wear props/decals if they already exist. The asset manifest defines one clean label and loading screen per release.

## Static asset directory and compatibility

All manifest `asset_path` values now end in `.webp`; the source locations used in the old manifest are retained as `legacy_asset_path` (`.png`). Preserve IDs and SKUs. When converting existing art, **do not remove the original until the game asset references are updated and tested**. Do not touch the game-library metadata or grading data.

`Already Created` is a status of the **game release**, not a reliable claim that the physical-label art and loading-screen art already exist. The manifest uses `asset_action = VERIFY_EXISTING_ASSET_THEN_REUSE` on those 68 rows and `CREATE_STATIC_OFFLINE` on the remaining 2,724 rows. If either existing image is absent, queue the missing file for offline generation.

## Manifest files

- **`Bench_Tech_Image_Asset_Manifest_2792_Assets.csv`**: 2,792 rows, one required final **static** image per row. Adds dimensions, WebP paths, genre/layout choices, game identity grouping, and original PNG paths.
- **`Bench_Tech_Static_Artwork_Recipes_1260.csv`**: 1,260 records, one per shared game identity. Gives Codex deterministic background/layout choices and identifies collector/grail custom source-art jobs.
- **This Markdown file**: complete batch-generation specifications, output budgets and validation requirements.

## Counts by platform

| Platform | Game releases | Cartridge labels | Disc labels | SD labels | Loading screens |
|---|---:|---:|---:|---:|---:|
| Bintendo 64 (B64) | 53 | 53 | 0 | 0 | 53 |
| Bintendo Entertainment System (BES) | 53 | 53 | 0 | 0 | 53 |
| Button Lite (BUTTON) | 49 | 49 | 0 | 0 | 49 |
| Dream Boy / Pocket / Color (DB) | 53 | 53 | 0 | 0 | 53 |
| Dream Boy Advance / SP / Micro (DBA) | 53 | 53 | 0 | 0 | 53 |
| DiscJockie 1 (DJ1) | 49 | 0 | 49 | 0 | 49 |
| DiscJockie 2 (DJ2) | 49 | 0 | 49 | 0 | 49 |
| DiscJockie 3 (DJ3) | 49 | 0 | 49 | 0 | 49 |
| DiscJockie Pocket (DJP) | 49 | 0 | 49 | 0 | 49 |
| Funstation 1 (FS1) | 49 | 0 | 49 | 0 | 49 |
| Funstation 2 (FS2) | 49 | 0 | 49 | 0 | 49 |
| Funstation 3 (FS3) | 49 | 0 | 49 | 0 | 49 |
| Funstation 4 (FS4) | 49 | 0 | 49 | 0 | 49 |
| Funstation 5 (FS5) | 49 | 0 | 49 | 0 | 49 |
| Bintentendo Game Orb (GORB) | 49 | 0 | 49 | 0 | 49 |
| Paltari Family Console (PALT) | 53 | 53 | 0 | 0 | 53 |
| Bintendo Pocket Joy Advance (PJOY) | 49 | 49 | 0 | 0 | 49 |
| Bintendo Pyramid (PYRAMID) | 49 | 0 | 49 | 0 | 49 |
| Retrobit RB35 (RB35) | 49 | 0 | 0 | 49 | 49 |
| Sbox 1 (SB1) | 49 | 0 | 49 | 0 | 49 |
| Sbox 10 (SB10) | 49 | 0 | 49 | 0 | 49 |
| Sbox One X (SB1X) | 49 | 0 | 49 | 0 | 49 |
| Sbox 2 (SB2) | 49 | 0 | 49 | 0 | 49 |
| Sbox 720 (SB720) | 49 | 0 | 49 | 0 | 49 |
| Sbox S (SBS) | 49 | 0 | 49 | 0 | 49 |
| Homey Sinnusus (SINN) | 49 | 49 | 0 | 0 | 49 |
| Swamarami All-In-One (SWAMA) | 49 | 0 | 0 | 49 | 49 |
| Vega Exodus (VEGA) | 53 | 53 | 0 | 0 | 53 |

## Final acceptance criteria

- **2,792 static output images** accounted for: 465 cartridge labels, 833 disc/mini-disc labels, 98 SD labels, and 1396 pre-rendered loading screens.
- Every file is created by Codex before gameplay; the PlayCanvas application never draws/assembles cover art, cartridge/disc labels or loading imagery.
- All game labels and loading screens retain the correct game title, console branding, platform-specific media format, and reference SKU.
- Source art may be reused for games with the same `shared_game_identity`, and a 52-background/18-layout kit can efficiently generate the rest, while exported image paths remain release-specific.
- Output resolution and aspect treatment follow the manifest; all 34 `Already Created` games are verified for artwork rather than implicitly considered finished.
- No changes to game rarity, grading, market value, cartridge electronics or PCB revision metadata.
