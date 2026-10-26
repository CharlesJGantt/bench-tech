# Bench Tech — Master Video Game & Media Creation Catalog

**Claude implementation handoff | Version 3 (expanded 1,396-title library, cross-platform ports, collector grading) | October 26, 2026**

This is the game/media creation library, **not a request to recreate consoles**. Console and controller creation live in their separate `TO-CREATE` list. Preserve the existing game SKUs below and create the new game SKUs, using reusable physical media models and title-specific visual assets.

## 0. Scope and status counts

| Metric | Count |
|---|---:|
| Console/media families | **28** |
| Named game SKUs in this master plan | **1,396** |
| **Already Created** (user-provided names) | **34** |
| **Needs Created** (new additions) | **1,362** |
| Game SKUs per media family | **49 or 53** |
| Cartridge connector/PCB families | **9** |
| Reusable cartridge PCB layouts | **45** (9 families × 5 variants) |
| Reusable optical-disc 3D meshes | **2** (full-size and miniature) |
| SD / microSD base meshes | **2** |

**Status definition:** “Already Created” means named in the existing Bench Tech library supplied by the project owner. It does **not** guarantee the artwork, metadata, game data or testing is complete. Claude must inspect real assets before marking any particular game asset complete. “Needs Created” means the game SKU, art, label and data are planned, not already implemented. Previously named games with an owner-supplied price retain **exactly that price at Grade 8** as an official initial reference value; the ten previously unpriced named games now receive **clearly provisional** Grade-8 values so the valuation system works for every SKU. Prices of physical copies vary with grade, completeness and current market conditions.

**SKU vs. console distinction:** Dream Boy/Pocket/Color share one game family; Dream Boy Advance/SP/Micro share another. The 28 groups are 28 **media/game SKU catalogs**, not 28 unique console chassis. Game Orb cartridge compatibility does not duplicate Pocket Joy SKU rows. Swamarami compatible cartridge titles do not duplicate those SKU rows either.

### Ground rules for Claude

1. **Do not duplicate existing entries.** Match user-provided game names and existing IDs/stock first; reuse them and add missing metadata/assets only.
2. **Create a game definition once per platform SKU.** Store `sku`, title, game family, accepted media, parent console(s), genre, price, PCB profile (cart only), label material, rarity tier, loading-screen asset and repair-test signature.
3. **Do not create a new cartridge PCB for each title.** Use one of five per connector family. Swapping labels/covers/title data produces new game SKUs.
4. **Use the same full-size round disc 3D mesh for CD, DVD, Blu-ray and UHD Blu-ray.** Media type and disc protocol are metadata/texture/material variants. Use one smaller mini-disc mesh for mini-CD and mini-DVD. Avoid unnecessary per-game geometry.
5. **SD and microSD cards** reuse base card meshes. Vary sticker/printed branding, data image, save file, title info and packaging. Standard sealed SD/microSD devices are not conventional solder-repairable PCBs; diagnose reader faults, worn contacts and media corruption rather than inventing routine internal component swaps.
6. **Unique per title:** name, SKU, label artwork, icon/box/spine where needed, genre, release era, value, loading/title screen, metadata, library thumbnail, game-boot test and optional corrupted/failed-boot screen.
7. **Existing Faults from Fault Catalog** applies to every *repairable cartridge PCB* and any repairable game-media interface board. Supplement with media-specific faults listed below. Disc surfaces and sealed cards get appropriate media faults, not arbitrary PCB failures.
8. **No copy-paste game artwork.** Reuse framing templates/layout grids but create unique title motifs and loading illustrations based on the per-title art directions. Same-series sequels can intentionally share visual branding.
9. **No fictional media geometry inflation.** Keep only 5 variants of each cartridge connector profile and common disc/card geometries. Reuse PCB layout across multiple game titles; print skins and metadata differ.
10. **Compatibility must be data-driven.** A physical CD/DVD/BD disc type is not proof of console compatibility. Native platform ID, region/security flags, generation and any authorized backward-compatibility list determine whether it boots.

## 1. Format/compatibility registry

| Family | Game medium | Technology | Reused hardware | Notes |
|---|---|---|---|---|
| `BES` | BES Game Pak | Cartridge | 5 shared PCB designs (see factory revision register) | Shared BES cartridge shell; label variant per title |
| `B64` | B64 Game Pak | Cartridge | 5 shared PCB designs (see factory revision register) | Shared B64 cartridge shell; label variant per title |
| `VEGA` | Vega Cartridge | Cartridge | 5 shared PCB designs (see factory revision register) | Shared Vega cartridge shell |
| `PALT` | Paltari Cartridge | Cartridge | 5 shared PCB designs (see factory revision register) | Shared Paltari cartridge shell |
| `DB` | Dream Boy Game Pak | Mini cartridge | 5 shared PCB designs (see factory revision register) | Dream Boy, Pocket and Color use one compatible game family; game-level exceptions allowed |
| `DBA` | Dream Boy Advance Game Pak | Mini cartridge | 5 shared PCB designs (see factory revision register) | Dream Boy Advance, SP and Micro share this game family |
| `BUTTON` | Button Lite 6-pin Game Card | Mini game card | 5 shared PCB designs (see factory revision register) | Serial 6-pin bus; no external parallel GPU bus |
| `PJOY` | Pocket Joy Mini Cartridge | Mini cartridge | 5 shared PCB designs (see factory revision register) | Pocket Joy Advance native; optional support in Game Orb cartridge slot |
| `SINN` | Sinnusus Retro Cartridge | Mini cartridge | 5 shared PCB designs (see factory revision register) | Homey Sinnusus native |
| `RB35` | Retrobit microSD Game Card | microSD | 1 microSD model | Content image/profile and printed branding vary by title |
| `SWAMA` | Swamarami SD Game Pack | SD | 1 SD model | Native SD releases; cartridge-compatibility uses original carts unchanged |
| `GORB` | Game Orb Optical Game Disc | Mini DVD | 1 mini disc model | Game Orb-native mini discs, plus Pocket Joy cartridge slot |
| `PYRAMID` | Bintendo Mini-Disc | Mini DVD | 1 mini disc model | Pyramid-native mini optical discs |
| `DJP` | DJ Pocket Mini Game Disc | Mini CD | 1 mini disc model | DiscJockie Pocket handheld-specific small optical media |
| `DJ1` | DJ1 Game Disc | CD | 1 shared full-size disc model | CD generation 1 |
| `DJ2` | DJ2 Game Disc | CD | 1 shared full-size disc model | CD generation 2, overrides earlier DVD listing |
| `DJ3` | DJ3 Game Disc | Blu-ray | 1 shared full-size disc model | Next-gen high density |
| `FS1` | FS1 Game Disc | CD | 1 shared full-size disc model | CD generation 1 |
| `FS2` | FS2 Game Disc | CD | 1 shared full-size disc model | CD generation 2, overrides earlier DVD listing |
| `FS3` | FS3 Game Disc | Blu-ray | 1 shared full-size disc model | BD generation |
| `FS4` | FS4 Game Disc | Blu-ray | 1 shared full-size disc model | BD generation |
| `FS5` | FS5 Game Disc | UHD-BD | 1 shared full-size disc model | High capacity BD family |
| `SB1` | SB1 Game Disc | CD | 1 shared full-size disc model | CD generation 1, overrides earlier DVD listing |
| `SB2` | SB2 Game Disc | CD | 1 shared full-size disc model | CD generation 2, overrides earlier DVD listing |
| `SB720` | SB720 Game Disc | DVD | 1 shared full-size disc model | DVD generation |
| `SB10` | SB10 Game Disc | Blu-ray | 1 shared full-size disc model | BD generation |
| `SBS` | SBS Game Disc | Blu-ray | 1 shared full-size disc model | BD family; includes optical drive as requested |
| `SB1X` | SB1X Game Disc | UHD-BD | 1 shared full-size disc model | High capacity BD family |

**Optical media override (authoritative):** DiscJockie 1 and 2, Funstation 1 and 2, and Sbox 1 and 2 use **CD-based game media**. Later home-console models in each series use **DVD or Blu-ray family media**. DiscJockie Pocket is a **mini-CD**, while Bintendo Pyramid and Game Orb are distinct **mini-DVD** formats. Do not convert Funstation 5 and Sbox One X to CDs.

**Disc mesh library:** `MEDIA-DISC-FULL-01` reused across CD/DVD/BD/UHD-BD; `MEDIA-DISC-MINI-01` reused across mini-CD/mini-DVD. Unique labels are textures/material instances and the optical format is a property. Optional visible reflective coatings and hub markings come from materials, not new meshes. Each console native format has its own `format_id` and allowed drive controller profile. DiscJockie Pocket, Pyramid and Game Orb mini-discs are incompatible unless explicitly designed otherwise.

**Card meshes:** `MEDIA-SD-01`, `MEDIA-MICROSD-01`. Controller/reader connectors are separately repairable hardware, not part of the card game asset. Swamarami runs native SD-format software and compatible cartridge games; Retrobit RB35 runs its microSD releases. Do not assume all systems accept SD.

## 2. Reusable cartridge PCB library — 45 layouts with unique factory revisions

Nine connector families × five reusable PCB layouts each. `V1`–`V5` are **distinct layouts**, not simply alternate component populations on an unmodified board. All PCB shapes are relative, using XS/S/M/L/XL/XXL without physical measurements. Component density uses Sparse, Medium, High and Medium-High. Each cartridge label is a separate customizable texture.

### Factory revision numbering and stable layout identities

**Factory revision rules:** 45 individual PCB designs across nine connector families get exact, non-generic factory version/revision IDs, such as `V1.117` and `V3.734`. The five design slots retain internal IDs `V1`–`V5` for compatibility with existing assets. **Do not generate a new PCB mesh for each individual game, grade or acquisition.** Display the family-specific factory revision on the silkscreen, board metadata and inspection UI. A given SKU's assigned revision remains fixed; individual physical copies can differ in grade and faults, not automatically in revision.

| Cartridge family | Layout 1 revision | Layout 2 revision | Layout 3 revision | Layout 4 revision (battery SRAM) | Layout 5 revision (flash save) |
|---|---|---|---|---|---|
| `BES` | `V1.117` | `V1.483` | `V2.216` | `V3.734` | `V4.106` |
| `B64` | `V1.204` | `V2.041` | `V2.508` | `V3.129` | `V3.842` |
| `VEGA` | `V1.095` | `V1.622` | `V2.174` | `V2.906` | `V3.318` |
| `PALT` | `V0.921` | `V1.052` | `V1.771` | `V2.409` | `V2.955` |
| `DB` | `V1.033` | `V1.319` | `V2.078` | `V2.615` | `V3.207` |
| `DBA` | `V1.114` | `V1.566` | `V2.208` | `V3.071` | `V3.449` |
| `BUTTON` | `V1.011` | `V1.407` | `V1.953` | `V2.305` | `V2.824` |
| `PJOY` | `V1.223` | `V2.079` | `V2.491` | `V3.146` | `V4.008` |
| `SINN` | `V0.876` | `V1.312` | `V1.748` | `V2.541` | `V3.017` |

Use the *internal asset key* `BES-V1` with *printed PCB identifier* `BES-V1.117`; the corresponding `pcb_revision_full_id` is `BES-V1.117`. Both identifiers are supplied per game in the CSV. The distinct numbers identify factory PCB designs, not rarity, manufacturing date, or condition.

### Global cartridge layout variants

| Variant | Class | Density | Representative build | Solder-tab backup battery? | Added failure modes |
|---|---|---|---|---|---|
| `V1` | Basic ROM | Sparse | one mask-ROM/serial flash game program chip plus bypass capacitors and identification passives | No | open trace, oxidized edge fingers, cracked solder, bad decoupling capacitor |
| `V2` | Dual ROM / expanded | Medium | main program ROM plus additional graphics/audio ROM and decode logic | No | secondary ROM select fault, failed address decoder, cracked second-package joints |
| `V3` | Enhancement chip | High | main ROM plus graphics-assist/mapper/DSP chip, clock and support memory | No | enhancement-chip clock fault, mapper IC failure, corrupt graphics bus |
| `V4` | Battery-backed save | Medium | ROM plus SRAM, save-control logic and a spot-welded-tab coin-cell battery soldered by its tabs | Yes | flat backup battery, fractured battery tab joint, corroded SRAM supply trace, lost saves |
| `V5` | Flash / EEPROM save | Medium-High | ROM or game flash plus EEPROM/FRAM/save flash and write-protection components | No | save-memory write fault, torn pad, damaged write-enable path, corrupt save records |

**Battery construction:** Any backed-up save cart has a battery with welded solder tabs; the board solder joints attach to the tabs, not directly to a bare coin cell. In-game replacement must preserve polarity and avoid damaging nearby traces. Add save-retention test after replacement. Cartridge ROM failure should be less common than edge damage, solder faults, SRAM and power issues.

### Per-connector physical PCB workups

#### `BES` — BES Game Pak

**PCB size:** M  |  **Shape:** tall rectangular board with squared upper corners  |  **Base component placement:** bottom broad edge fingers; high upper ROM area.

| Board ID | Density | Key placement and components | Battery | Common added faults |
|---|---|---|---|---|
| `BES-V1.117` | Sparse | one mask-ROM/serial flash game program chip plus bypass capacitors and identification passives; bottom broad edge fingers; high upper ROM area | No | open trace, oxidized edge fingers, cracked solder, bad decoupling capacitor |
| `BES-V1.483` | Medium | main program ROM plus additional graphics/audio ROM and decode logic; bottom broad edge fingers; high upper ROM area | No | secondary ROM select fault, failed address decoder, cracked second-package joints |
| `BES-V2.216` | High | main ROM plus graphics-assist/mapper/DSP chip, clock and support memory; bottom broad edge fingers; high upper ROM area | No | enhancement-chip clock fault, mapper IC failure, corrupt graphics bus |
| `BES-V3.734` | Medium | ROM plus SRAM, save-control logic and a spot-welded-tab coin-cell battery soldered by its tabs; bottom broad edge fingers; high upper ROM area | Yes | flat backup battery, fractured battery tab joint, corroded SRAM supply trace, lost saves |
| `BES-V4.106` | Medium-High | ROM or game flash plus EEPROM/FRAM/save flash and write-protection components; bottom broad edge fingers; high upper ROM area | No | save-memory write fault, torn pad, damaged write-enable path, corrupt save records |

**Game-specific faults:** dirty or oxidized contact fingers; cracked joint at edge flex point; broken fine trace; impact deformation; out-of-spec 3.3/5 V support where applicable; failed address, clock or data line. **Existing Faults from Fault Catalog**.

#### `B64` — B64 Game Pak

**PCB size:** M  |  **Shape:** broad rectangle with upper shoulder notches  |  **Base component placement:** bottom fine-pitch edge fingers; shield-compatible component height.

| Board ID | Density | Key placement and components | Battery | Common added faults |
|---|---|---|---|---|
| `B64-V1.204` | Sparse | one mask-ROM/serial flash game program chip plus bypass capacitors and identification passives; bottom fine-pitch edge fingers; shield-compatible component height | No | open trace, oxidized edge fingers, cracked solder, bad decoupling capacitor |
| `B64-V2.041` | Medium | main program ROM plus additional graphics/audio ROM and decode logic; bottom fine-pitch edge fingers; shield-compatible component height | No | secondary ROM select fault, failed address decoder, cracked second-package joints |
| `B64-V2.508` | High | main ROM plus graphics-assist/mapper/DSP chip, clock and support memory; bottom fine-pitch edge fingers; shield-compatible component height | No | enhancement-chip clock fault, mapper IC failure, corrupt graphics bus |
| `B64-V3.129` | Medium | ROM plus SRAM, save-control logic and a spot-welded-tab coin-cell battery soldered by its tabs; bottom fine-pitch edge fingers; shield-compatible component height | Yes | flat backup battery, fractured battery tab joint, corroded SRAM supply trace, lost saves |
| `B64-V3.842` | Medium-High | ROM or game flash plus EEPROM/FRAM/save flash and write-protection components; bottom fine-pitch edge fingers; shield-compatible component height | No | save-memory write fault, torn pad, damaged write-enable path, corrupt save records |

**Game-specific faults:** dirty or oxidized contact fingers; cracked joint at edge flex point; broken fine trace; impact deformation; out-of-spec 3.3/5 V support where applicable; failed address, clock or data line. **Existing Faults from Fault Catalog**.

#### `VEGA` — Vega Cartridge

**PCB size:** M  |  **Shape:** long rectangle with angled top shoulders  |  **Base component placement:** lower connector edge; upper chip banks.

| Board ID | Density | Key placement and components | Battery | Common added faults |
|---|---|---|---|---|
| `VEGA-V1.095` | Sparse | one mask-ROM/serial flash game program chip plus bypass capacitors and identification passives; lower connector edge; upper chip banks | No | open trace, oxidized edge fingers, cracked solder, bad decoupling capacitor |
| `VEGA-V1.622` | Medium | main program ROM plus additional graphics/audio ROM and decode logic; lower connector edge; upper chip banks | No | secondary ROM select fault, failed address decoder, cracked second-package joints |
| `VEGA-V2.174` | High | main ROM plus graphics-assist/mapper/DSP chip, clock and support memory; lower connector edge; upper chip banks | No | enhancement-chip clock fault, mapper IC failure, corrupt graphics bus |
| `VEGA-V2.906` | Medium | ROM plus SRAM, save-control logic and a spot-welded-tab coin-cell battery soldered by its tabs; lower connector edge; upper chip banks | Yes | flat backup battery, fractured battery tab joint, corroded SRAM supply trace, lost saves |
| `VEGA-V3.318` | Medium-High | ROM or game flash plus EEPROM/FRAM/save flash and write-protection components; lower connector edge; upper chip banks | No | save-memory write fault, torn pad, damaged write-enable path, corrupt save records |

**Game-specific faults:** dirty or oxidized contact fingers; cracked joint at edge flex point; broken fine trace; impact deformation; out-of-spec 3.3/5 V support where applicable; failed address, clock or data line. **Existing Faults from Fault Catalog**.

#### `PALT` — Paltari Cartridge

**PCB size:** M  |  **Shape:** wide shallow rectangle  |  **Base component placement:** bottom edge fingers; predominantly through-hole footprints in early variant.

| Board ID | Density | Key placement and components | Battery | Common added faults |
|---|---|---|---|---|
| `PALT-V0.921` | Sparse | one mask-ROM/serial flash game program chip plus bypass capacitors and identification passives; bottom edge fingers; predominantly through-hole footprints in early variant | No | open trace, oxidized edge fingers, cracked solder, bad decoupling capacitor |
| `PALT-V1.052` | Medium | main program ROM plus additional graphics/audio ROM and decode logic; bottom edge fingers; predominantly through-hole footprints in early variant | No | secondary ROM select fault, failed address decoder, cracked second-package joints |
| `PALT-V1.771` | High | main ROM plus graphics-assist/mapper/DSP chip, clock and support memory; bottom edge fingers; predominantly through-hole footprints in early variant | No | enhancement-chip clock fault, mapper IC failure, corrupt graphics bus |
| `PALT-V2.409` | Medium | ROM plus SRAM, save-control logic and a spot-welded-tab coin-cell battery soldered by its tabs; bottom edge fingers; predominantly through-hole footprints in early variant | Yes | flat backup battery, fractured battery tab joint, corroded SRAM supply trace, lost saves |
| `PALT-V2.955` | Medium-High | ROM or game flash plus EEPROM/FRAM/save flash and write-protection components; bottom edge fingers; predominantly through-hole footprints in early variant | No | save-memory write fault, torn pad, damaged write-enable path, corrupt save records |

**Game-specific faults:** dirty or oxidized contact fingers; cracked joint at edge flex point; broken fine trace; impact deformation; out-of-spec 3.3/5 V support where applicable; failed address, clock or data line. **Existing Faults from Fault Catalog**.

#### `DB` — Dream Boy Game Pak

**PCB size:** XS  |  **Shape:** short rounded rectangle  |  **Base component placement:** short bottom edge fingers; tiny upper component field.

| Board ID | Density | Key placement and components | Battery | Common added faults |
|---|---|---|---|---|
| `DB-V1.033` | Sparse | one mask-ROM/serial flash game program chip plus bypass capacitors and identification passives; short bottom edge fingers; tiny upper component field | No | open trace, oxidized edge fingers, cracked solder, bad decoupling capacitor |
| `DB-V1.319` | Medium | main program ROM plus additional graphics/audio ROM and decode logic; short bottom edge fingers; tiny upper component field | No | secondary ROM select fault, failed address decoder, cracked second-package joints |
| `DB-V2.078` | High | main ROM plus graphics-assist/mapper/DSP chip, clock and support memory; short bottom edge fingers; tiny upper component field | No | enhancement-chip clock fault, mapper IC failure, corrupt graphics bus |
| `DB-V2.615` | Medium | ROM plus SRAM, save-control logic and a spot-welded-tab coin-cell battery soldered by its tabs; short bottom edge fingers; tiny upper component field | Yes | flat backup battery, fractured battery tab joint, corroded SRAM supply trace, lost saves |
| `DB-V3.207` | Medium-High | ROM or game flash plus EEPROM/FRAM/save flash and write-protection components; short bottom edge fingers; tiny upper component field | No | save-memory write fault, torn pad, damaged write-enable path, corrupt save records |

**Game-specific faults:** dirty or oxidized contact fingers; cracked joint at edge flex point; broken fine trace; impact deformation; out-of-spec 3.3/5 V support where applicable; failed address, clock or data line. **Existing Faults from Fault Catalog**.

#### `DBA` — Dream Boy Advance Game Pak

**PCB size:** XS  |  **Shape:** short stepped rectangle with side notches  |  **Base component placement:** bottom compact edge fingers; horizontal chip placement.

| Board ID | Density | Key placement and components | Battery | Common added faults |
|---|---|---|---|---|
| `DBA-V1.114` | Sparse | one mask-ROM/serial flash game program chip plus bypass capacitors and identification passives; bottom compact edge fingers; horizontal chip placement | No | open trace, oxidized edge fingers, cracked solder, bad decoupling capacitor |
| `DBA-V1.566` | Medium | main program ROM plus additional graphics/audio ROM and decode logic; bottom compact edge fingers; horizontal chip placement | No | secondary ROM select fault, failed address decoder, cracked second-package joints |
| `DBA-V2.208` | High | main ROM plus graphics-assist/mapper/DSP chip, clock and support memory; bottom compact edge fingers; horizontal chip placement | No | enhancement-chip clock fault, mapper IC failure, corrupt graphics bus |
| `DBA-V3.071` | Medium | ROM plus SRAM, save-control logic and a spot-welded-tab coin-cell battery soldered by its tabs; bottom compact edge fingers; horizontal chip placement | Yes | flat backup battery, fractured battery tab joint, corroded SRAM supply trace, lost saves |
| `DBA-V3.449` | Medium-High | ROM or game flash plus EEPROM/FRAM/save flash and write-protection components; bottom compact edge fingers; horizontal chip placement | No | save-memory write fault, torn pad, damaged write-enable path, corrupt save records |

**Game-specific faults:** dirty or oxidized contact fingers; cracked joint at edge flex point; broken fine trace; impact deformation; out-of-spec 3.3/5 V support where applicable; failed address, clock or data line. **Existing Faults from Fault Catalog**.

#### `BUTTON` — Button Lite 6-pin Game Card

**PCB size:** XS  |  **Shape:** ultra-narrow rounded card PCB  |  **Base component placement:** 6-pin serial edge connector; constrained routing and low-power ICs.

| Board ID | Density | Key placement and components | Battery | Common added faults |
|---|---|---|---|---|
| `BUTTON-V1.011` | Sparse | one mask-ROM/serial flash game program chip plus bypass capacitors and identification passives; 6-pin serial edge connector; constrained routing and low-power ICs | No | open trace, oxidized edge fingers, cracked solder, bad decoupling capacitor |
| `BUTTON-V1.407` | Medium | main serial flash plus auxiliary serial content flash on shared clock/data bus and tiny address-select controller; 6-pin serial edge connector; constrained routing and low-power ICs | No | secondary ROM select fault, failed address decoder, cracked second-package joints |
| `BUTTON-V1.953` | Medium | serial program flash plus low-power decompression/mapper coprocessor and small SRAM; not a full discrete GPU; 6-pin serial edge connector; constrained routing and low-power ICs | No | enhancement-chip clock fault, mapper IC failure, corrupt graphics bus |
| `BUTTON-V2.305` | Medium | serial ROM plus low-power SRAM, power isolation and solder-tab backup cell; six-pin interface remains serialized; 6-pin serial edge connector; constrained routing and low-power ICs | Yes | flat backup battery, fractured battery tab joint, corroded SRAM supply trace, lost saves |
| `BUTTON-V2.824` | Medium-High | serial program flash plus nonvolatile FRAM/EEPROM save chip; 6-pin serial edge connector; constrained routing and low-power ICs | No | save-memory write fault, torn pad, damaged write-enable path, corrupt save records |

**Game-specific faults:** dirty or oxidized contact fingers; cracked joint at edge flex point; broken fine trace; impact deformation; out-of-spec 3.3/5 V support where applicable; failed address, clock or data line. **Existing Faults from Fault Catalog**.

#### `PJOY` — Pocket Joy Mini Cartridge

**PCB size:** XS  |  **Shape:** notched mini-cartridge rectangle  |  **Base component placement:** small high-density edge fingers; top flash area.

| Board ID | Density | Key placement and components | Battery | Common added faults |
|---|---|---|---|---|
| `PJOY-V1.223` | Sparse | one mask-ROM/serial flash game program chip plus bypass capacitors and identification passives; small high-density edge fingers; top flash area | No | open trace, oxidized edge fingers, cracked solder, bad decoupling capacitor |
| `PJOY-V2.079` | Medium | main program ROM plus additional graphics/audio ROM and decode logic; small high-density edge fingers; top flash area | No | secondary ROM select fault, failed address decoder, cracked second-package joints |
| `PJOY-V2.491` | High | main ROM plus graphics-assist/mapper/DSP chip, clock and support memory; small high-density edge fingers; top flash area | No | enhancement-chip clock fault, mapper IC failure, corrupt graphics bus |
| `PJOY-V3.146` | Medium | ROM plus SRAM, save-control logic and a spot-welded-tab coin-cell battery soldered by its tabs; small high-density edge fingers; top flash area | Yes | flat backup battery, fractured battery tab joint, corroded SRAM supply trace, lost saves |
| `PJOY-V4.008` | Medium-High | ROM or game flash plus EEPROM/FRAM/save flash and write-protection components; small high-density edge fingers; top flash area | No | save-memory write fault, torn pad, damaged write-enable path, corrupt save records |

**Game-specific faults:** dirty or oxidized contact fingers; cracked joint at edge flex point; broken fine trace; impact deformation; out-of-spec 3.3/5 V support where applicable; failed address, clock or data line. **Existing Faults from Fault Catalog**.

#### `SINN` — Sinnusus Retro Cartridge

**PCB size:** S  |  **Shape:** tall slim rounded rectangle  |  **Base component placement:** bottom fine-pitch edge fingers; upper ROM field.

| Board ID | Density | Key placement and components | Battery | Common added faults |
|---|---|---|---|---|
| `SINN-V0.876` | Sparse | one mask-ROM/serial flash game program chip plus bypass capacitors and identification passives; bottom fine-pitch edge fingers; upper ROM field | No | open trace, oxidized edge fingers, cracked solder, bad decoupling capacitor |
| `SINN-V1.312` | Medium | main program ROM plus additional graphics/audio ROM and decode logic; bottom fine-pitch edge fingers; upper ROM field | No | secondary ROM select fault, failed address decoder, cracked second-package joints |
| `SINN-V1.748` | High | main ROM plus graphics-assist/mapper/DSP chip, clock and support memory; bottom fine-pitch edge fingers; upper ROM field | No | enhancement-chip clock fault, mapper IC failure, corrupt graphics bus |
| `SINN-V2.541` | Medium | ROM plus SRAM, save-control logic and a spot-welded-tab coin-cell battery soldered by its tabs; bottom fine-pitch edge fingers; upper ROM field | Yes | flat backup battery, fractured battery tab joint, corroded SRAM supply trace, lost saves |
| `SINN-V3.017` | Medium-High | ROM or game flash plus EEPROM/FRAM/save flash and write-protection components; bottom fine-pitch edge fingers; upper ROM field | No | save-memory write fault, torn pad, damaged write-enable path, corrupt save records |

**Game-specific faults:** dirty or oxidized contact fingers; cracked joint at edge flex point; broken fine trace; impact deformation; out-of-spec 3.3/5 V support where applicable; failed address, clock or data line. **Existing Faults from Fault Catalog**.

### Cartridge PCB allocation logic

`PCB profile` in the game tables below identifies one of the five shared layouts. Use `family_profile` (e.g., `BES-V2.216`) to spawn the correct geometry, trace network and fault eligibility. 49–53 different labels may therefore share five board assets in that format. RPGs or strategy titles are biased toward save-memory layouts; action games may use mapper/graphics-assist layouts; simple arcade titles tend to use V1. These allocations are game-design suggestions and can be changed for electrical credibility.

## 3. Game-media failure and test profiles

| Medium | Additional faults / conditions | Test equipment and successful completion |
|---|---|---|
| Cartridge & mini-cartridge | Corroded fingers, torn trace, lifted IC pad, cracked package solder, damaged shell guide, mapper failure, dead solder-tab backup battery, bad SRAM retention, failing save EEPROM/FRAM | Microscope, continuity test, connector test jig, controlled voltage rails, logic analyzer for bus activity, boot emulator/real test console, save/load cycle |
| CD & mini-CD | Scratches, contamination, label-side layer damage, warping, clamping faults, disc read errors | Visual disc inspection, disc cleaning/polish only when appropriate, compatible console drive test, TOC/readability and game boot test |
| DVD / Blu-ray & mini-DVD | Scratches, contamination, delamination, coating damage, read/seek failures, disc mismatch | Disc surface inspection, appropriate cleaning, correct-media drive test, disc authentication read where implemented, level load test |
| SD / microSD | Worn contacts, corrupted partition or game image, write protection (full-size SD where fitted), failing flash memory / bad blocks, counterfeit or incompatible capacity (as scripted scenario) | Card reader, integrity hash check, filesystem/image validation, reflash from legally owned in-game backup where permitted, boot test |

**No unsupported magic fixes:** An irrecoverably damaged optical disc or worn-out NAND card is a replace/refund job, not a solder job. Media-repair minigames should distinguish recoverable contamination from nonrecoverable damage. Cartridge faults come from `Existing Faults from Fault Catalog` plus format-specific failures.

### Version 3 permanent rarity tiers (supersedes Version 2 table below)

The following registry is **authoritative** across all 1,396 game SKUs. The older six-tier Version 2 table further down is kept solely for historical audit; use this table instead. The collector tier is newly introduced between Very Rare and Grail. Grails remain exceptionally uncommon. Fixed per-SKU tier; only **condition grade** is randomly rolled per acquired copy.

| Tier | Game SKUs | Catalog rarity multiplier | Loot/source tier weight |
|---|---:|---:|---:|
| Common | 810 | ×1 | 71% |
| Uncommon | 325 | ×1.18 | 21% |
| Scarce | 159 | ×1.45 | 5.5% |
| Rare | 56 | ×1.75 | 1.7% |
| Very Rare | 24 | ×2.2 | 0.5% |
| Collector | 12 | ×2.8 | 0.24% |
| Grail | 10 | ×5 | 0.06% |

**Collector premium titles:** 12 additional SKUs have Grade-8 reference values of $145–$198. **New Grails:** four additional SKUs at Grade-8 prices $275, $335, $385, and $395; previous six Grails ($235–$420) are unchanged. Across the complete library there are **10 Grails** (0.72% of 1,396 SKU records) and **12 Collector-tier** games. These are video-game economy design values, not real-world market appraisals. Non-collector new games have Grade-8 references of $132 or lower.

**Do not double apply rarity:** the per-SKU `grade8_reference_value_usd` already includes rarity. The grade/completeness formula multiplies that reference, *not* an extra rarity factor. A physical copy's grade is 1–10, weighted by the source, rolled once, saved under its item ID, and never rerolled on reopen.

**Cross-platform ports:** a `cross_platform_title_id` can appear on several platforms with the same display title, but each release has a separate `sku`, platform media format, rarity, Grade-8 price, PCB layout when relevant, unique label/box texture, and platform-specific boot/loading screen. Shared game identity does not grant cross-boot compatibility. Preserve compatibility checks per native media family and generation. Gameplay content or splash composition may share source elements where artistically appropriate, but **never print an FS2 CD label on an Sbox game disc**.

## 3A. Collector rarity, random grading and dynamic resale value

### Catalog rarity is permanent; individual-copy condition is randomized

1. **Rarity belongs to a game SKU and never rerolls when acquired.** Each of the 1,396 platform-specific game SKUs has exactly one predetermined rarity classification. Rarity changes the catalog's reference price and how often the game is offered by customers/marketplace sellers. It is not generated once per copy.
2. **Grade belongs to an owned physical copy.** At each purchase, trade-in, repair intake, marketplace purchase or loot discovery, randomly draw an **integer from 1 through 10** using the appropriate source-specific grade weights below. Store that grade and one unique item instance ID; never reroll merely by loading the item or reopening a listing.
3. Record **cosmetic, completeness and functional state separately** when gameplay needs it. Fixing a broken ROM connection or battery-backed SRAM can improve tested functionality and appraisal, but cannot magically repair a sun-faded label, cracked shell, torn instruction manual or collector wear. Reinspect/regrade only if there was a meaningful physical change.
4. Existing game definition rows are templates. They intentionally have no acquisition-specific condition grade, final resale appraisal or physical-instance ID. Compute those when the game is actually spawned.

### Permanent rarity tiers and inventory likelihood

See the authoritative **Version 3 permanent rarity tiers** table immediately above. All source probabilities in this section use that seven-tier registry.

Rarity selection is **tier first**, then a randomly eligible title within that tier; exclude unavailable or incompatible platform pools and renormalize. These are suggested general-play market generation weights, not the ratio of library titles and not guarantees per customer. A known shop listing can also have a fixed selected SKU. Highly specialized customers/events may use different pools with transparent odds.

**Collector Grails:** Ten platform-specific game releases out of 1,396 SKUs (0.72%) hold the highest fixed rarity tier and Grade-8 reference value:

| SKU | Grail title | Platform | Grade-8 reference |
|---|---|---|---:|
| `BES-025` | Crypt of the Copper King | Bintendo Entertainment System | $235 |
| `B64-008` | Crystal Kingdom Chronicles | Bintendo 64 | $285 |
| `DJ1-011` | Midnight Motel 1997 | DiscJockie 1 | $350 |
| `FS1-011` | Resident Scarecrow | Funstation 1 | $385 |
| `SB720-004` | Ironclad Frontier: Beginnings | Sbox 720 | $420 |
| `PYRAMID-004` | Pyramid of the Lost Crown | Bintendo Pyramid | $315 |
| `BES-050` | The Clockwork Cabbage | Bintendo Entertainment System | $275 |
| `DJP-042` | The Clockwork Seas | DiscJockie Pocket | $335 |
| `FS2-047` | Mansion of a Thousand Doors | Funstation 2 | $385 |
| `PYRAMID-047` | The Crown of Golden Sand | Bintendo Pyramid | $395 |

**Collector tier (below Grail):** Twelve additional titles have Grade-8 reference values of $145–$198:

| SKU | Collector title | Platform | Grade-8 reference |
|---|---|---|---:|
| `B64-051` | Knight School Dropout | Bintendo 64 | $154 |
| `VEGA-052` | Cyber-Samurai Voltage | Vega Exodus | $169 |
| `PALT-046` | Missile City Survivor | Paltari Family Console | $149 |
| `DB-053` | The Final Jellybean | Dream Boy / Pocket / Color | $174 |
| `DBA-031` | Metro Hunter: Corrosion | Dream Boy Advance / SP / Micro | $186 |
| `RB35-049` | The Pixel Time Capsule | Retrobit RB35 | $153 |
| `PJOY-044` | Ghost Camera Chronicles | Bintendo Pocket Joy Advance | $175 |
| `SINN-047` | The Last Viking Lunch | Homey Sinnusus | $159 |
| `GORB-049` | Nova Wings Championship | Bintentendo Game Orb | $182 |
| `DJ1-044` | The Lost Arcade Tape | DiscJockie 1 | $163 |
| `FS3-047` | Little Big Cardboard Planet | Funstation 3 | $194 |
| `SB1X-044` | The Great Orbital Heist | Sbox One X | $198 |

Only Grail SKUs have a Grade-8 reference value of $200 or more. This is deliberately a tiny fraction of the library. These tier assignments stay fixed, while acquired-copy Grade 1–10, completeness, and functional status affect each individual appraisal. The standard resale-value cap remains **$499**; the 45 cartridge PCB layouts and all existing native media meshes remain reusable.


### Condition grades and price factors

Grades are integers, not free-form adjectives or permanent title attributes. A lower grade indicates more wear, poor labels, missing pieces, or worse functionality; a 10 means pristine tested media and collector-grade appearance, not necessarily factory-sealed.

| Grade | Condition description | Value multiplier relative to Grade 8 |
|---|---|---:|
| 1 | Destroyed / heavy damage | ×0.15 |
| 2 | Very poor | ×0.28 |
| 3 | Poor | ×0.40 |
| 4 | Heavily worn | ×0.53 |
| 5 | Fair / worn | ×0.66 |
| 6 | Used, functional | ×0.78 |
| 7 | Good | ×0.90 |
| 8 | Very good / reference condition | ×1.00 |
| 9 | Excellent | ×1.09 |
| 10 | Near-mint, tested | ×1.16 |

**Random condition on acquisition** (each grade's integer weight is a percentage and each row totals 100%):

| Source | G1 | G2 | G3 | G4 | G5 | G6 | G7 | G8 | G9 | G10 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Customer Trade In | 4% | 6% | 10% | 14% | 16% | 18% | 14% | 10% | 6% | 2% |
| Marketplace | 2% | 4% | 7% | 11% | 14% | 17% | 18% | 14% | 9% | 4% |
| Thrift Or Junk Lot | 13% | 15% | 16% | 15% | 12% | 10% | 8% | 6% | 3% | 2% |
| Collector Or Estate | 1% | 2% | 3% | 5% | 8% | 13% | 17% | 21% | 19% | 11% |

`marketplace`, `customer_trade_in`, `thrift_or_junk_lot`, and `collector_or_estate` should use separate distributions. Grades can be influenced by explicitly signposted seller claims or photos, but hidden defects/inspection differences should be resolved through gameplay, not by silently rerolling grade after the purchase.

### In-game valuation and purchase offers

**Reference price at Grade 8:** For new games, `catalog_base_value_usd × rarity_mult`, rounded to a whole dollar. For the **24 owner-priced games**, reverse-solve `catalog_base_value_usd` so their originally supplied prices remain exactly the Grade-8 reference. Ten previously unpriced named games have provisional prices clearly identified in the CSV.

**Appraised resale value for a specific copy:**

```text
grade = weighted_random_integer(1..10, grade_weights[source])   # ONCE at item creation
rarity = game_definition.rarity                                   # NEVER reroll
reference = game_definition.grade8_reference_value_usd           # already includes rarity
condition_factor = grade_multiplier[grade]
completeness_factor = 1.00                # loose media only, baseline
# 1.06 = matching case/box; 1.12 = complete with case/manual; 0.82 = missing/damaged essential sleeve or label
market_factor = 1.00                      # optional economy adjustment, e.g. 0.95..1.05
appraised_resale_usd = clamp(round(reference * condition_factor * completeness_factor * market_factor), 1, 499)
```

Keep a `user_supplied_original_value_usd` audit field. Only inventory **instances** gain `grade`, `condition_description`, `seller_source`, `purchase_price`, `completeness`, `functional_test_status`, `estimated_resale`, `actual_resale`, `defects`, and `item_instance_id`. Do not store grade in the shared game SKU definition as if every copy has the same condition. The master CSV leaves those instance fields blank intentionally.

Suggested purchase offers: Marketplace asking price can be about **70–95%** of appraised value; customer trade-in cash offers **35–55%**; thrift/junk lot **20–45%**; collector dealer purchases **90–110%**. Offer/asking price must not determine a different grade. Keep rarity and price information visually distinct from the player's technical repair difficulty and the repair's success probability.

**Examples:** An ordinary game with a $20 Grade-8 reference is worth $13 at Grade 5, $20 at Grade 8, and $23 at Grade 10 (loose, no market variation). A Grail title with a $350 Grade-8 reference appraises at $231 at Grade 5, $350 at Grade 8 and $406 at Grade 10. If the player buys a damaged copy and repairs it, increase its functional appraisal only when the test actually passes; keep the cosmetic grade limitation if the label or shell is still worn.

### Implementation/test requirements for Claude

- [ ] Register rarity tier as **fixed SKU metadata**; keep tiers compatible with owned/legacy game definitions.
- [ ] Register exact `factory_revision` for the 45 cartridge layouts; keep `pcb_layout_id` stable for asset reuse.
- [ ] Add weighted random Grade 1–10 at item *instance* creation, using source-specific grade distributions.
- [ ] Persist condition/rarity/seller source and copy ID; verify save/load never re-rolls grades.
- [ ] Show appraisal breakdown: initial game value, rarity, grade factor, completeness factor, any market effect, final selling price.
- [ ] Preserve owner-provided values as Grade-8 references and status `Already Created`; new prices and ten previously unpriced values are provisional.
- [ ] Respect 10 Grail SKUs only, $499 baseline resale cap, and the acquisition tier probabilities.
- [ ] Cartridge PCB models use existing repair faults plus layout-specific faults; disc and SD grading does not fabricate internal solderable faults.

## 4. ALREADY CREATED — preserve these 34 user-supplied game titles

The 34 names are owner-provided and kept verbatim. The **24 owner-supplied prices are preserved as Grade-8 reference values**; ten originally unpriced games now have explicitly proposed reference values (flagged in CSV as proposed). Do not replace real existing asset data, and do not assume names mean visual assets already exist.

### Bintendo Entertainment System — BES Game Pak

| SKU | Game | Status | Grade-8 reference value | Media / PCB | Genre | Rarity |
|---|---|---|---:|---|---|---|
| `BES-001` | Pipe Brothers | Already Created | $22 | BES Game Pak / `BES-V1.117` | Platformer | Common |
| `BES-002` | Duck Blaster | Already Created | $12 | BES Game Pak / `BES-V1.483` | Arcade Shooter | Common |
| `BES-003` | Mega Bolt Man | Already Created | $38 | BES Game Pak / `BES-V1.117` | Platformer | Common |
| `BES-004` | Castle Climber | Already Created | $28 | BES Game Pak / `BES-V3.734` | Platformer | Common |

### Bintendo 64 — B64 Game Pak

| SKU | Game | Status | Grade-8 reference value | Media / PCB | Genre | Rarity |
|---|---|---|---:|---|---|---|
| `B64-001` | Pipe Brothers 64 | Already Created | $35 | B64 Game Pak / `B64-V1.204` | Platformer | Scarce |
| `B64-002` | Kart Smash 64 | Already Created | $30 | B64 Game Pak / `B64-V2.508` | Kart Racing | Common |
| `B64-003` | Golden Agent 64 | Already Created | $25 | B64 Game Pak / `B64-V2.508` | Stealth | Common |
| `B64-004` | Star Pilot 64 | Already Created | $20 | B64 Game Pak / `B64-V1.204` | Space Combat | Common |

### Vega Exodus — Vega Cartridge

| SKU | Game | Status | Grade-8 reference value | Media / PCB | Genre | Rarity |
|---|---|---|---:|---|---|---|
| `VEGA-001` | Blur the Hedgepig | Already Created | $12 | Vega Cartridge / `VEGA-V1.095` | Platformer | Common |
| `VEGA-002` | Streets of Rumble | Already Created | $30 | Vega Cartridge / `VEGA-V1.622` | Beat-em-up | Common |
| `VEGA-003` | Mortal Tussle | Already Created | $18 | Vega Cartridge / `VEGA-V1.622` | Fighting | Common |
| `VEGA-004` | Dragon Road | Already Created | $40 | Vega Cartridge / `VEGA-V3.318` | Action RPG | Common |

### Paltari Family Console — Paltari Cartridge

| SKU | Game | Status | Grade-8 reference value | Media / PCB | Genre | Rarity |
|---|---|---|---:|---|---|---|
| `PALT-001` | Asteroid Belt | Already Created | $8 | Paltari Cartridge / `PALT-V0.921` | Arcade Shooter | Very Rare |
| `PALT-002` | Paddle Duel | Already Created | $6 | Paltari Cartridge / `PALT-V1.052` | Sports | Uncommon |
| `PALT-003` | Pit Runner | Already Created | $12 | Paltari Cartridge / `PALT-V0.921` | Platformer | Common |
| `PALT-004` | Space Rescue | Already Created | $10 | Paltari Cartridge / `PALT-V2.409` | Arcade Shooter | Common |

### Dream Boy / Pocket / Color — Dream Boy Game Pak

| SKU | Game | Status | Grade-8 reference value | Media / PCB | Genre | Rarity |
|---|---|---|---:|---|---|---|
| `DB-001` | Blockfall | Already Created | $8 | Dream Boy Game Pak / `DB-V1.033` | Puzzle | Common |
| `DB-002` | Critter Catchers Red | Already Created | $35 | Dream Boy Game Pak / `DB-V3.207` | Role-playing | Common |
| `DB-003` | Pocket Plumber Land | Already Created | $15 | Dream Boy Game Pak / `DB-V1.033` | Platformer | Common |
| `DB-004` | Moonlit Quest | Already Created | $20 | Dream Boy Game Pak / `DB-V3.207` | Role-playing | Common |

### Dream Boy Advance / SP / Micro — Dream Boy Advance Game Pak

| SKU | Game | Status | Grade-8 reference value | Media / PCB | Genre | Rarity |
|---|---|---|---:|---|---|---|
| `DBA-001` | Critter Catchers Sapphire | Already Created | $40 | Dream Boy Advance Game Pak / `DBA-V3.071` | Role-playing | Common |
| `DBA-002` | Kart Smash Advance | Already Created | $18 | Dream Boy Advance Game Pak / `DBA-V2.208` | Kart Racing | Common |
| `DBA-003` | Moonlit Quest II | Already Created | $22 | Dream Boy Advance Game Pak / `DBA-V3.071` | Role-playing | Common |
| `DBA-004` | Metro Hunter Fusion | Already Created | $30 | Dream Boy Advance Game Pak / `DBA-V3.449` | Action RPG | Common |

### Funstation 5 — FS5 Game Disc

| SKU | Game | Status | Grade-8 reference value | Media / PCB | Genre | Rarity |
|---|---|---|---:|---|---|---|
| `FS5-001` | Crown of Embers | Already Created | $24 | FS5 Game Disc | Action RPG | Common |
| `FS5-002` | Nightfall Ranger | Already Created | $28 | FS5 Game Disc | Adventure | Uncommon |
| `FS5-003` | Pitch Perfect Soccer 25 | Already Created | $24 | FS5 Game Disc | Sports | Common |
| `FS5-004` | Tidal Rally 5 | Already Created | $24 | FS5 Game Disc | Racing | Common |
| `FS5-005` | Hunters of the Hollow Moon | Already Created | $35 | FS5 Game Disc | Survival Horror | Scarce |

### Sbox One X — SB1X Game Disc

| SKU | Game | Status | Grade-8 reference value | Media / PCB | Genre | Rarity |
|---|---|---|---:|---|---|---|
| `SB1X-001` | Ironclad Frontier | Already Created | $28 | SB1X Game Disc | Tactical Action | Uncommon |
| `SB1X-002` | Apex Drift X | Already Created | $42 | SB1X Game Disc | Racing | Rare |
| `SB1X-003` | Zombie Harvest 3 | Already Created | $24 | SB1X Game Disc | Survival Horror | Common |
| `SB1X-004` | Starfarer Legacy | Already Created | $24 | SB1X Game Disc | Space Combat | Common |
| `SB1X-005` | Blitz Arena 2026 | Already Created | $24 | SB1X Game Disc | Sports | Common |

## 5. NEEDS CREATED — 662 PREVIOUSLY PLANNED GAME SKUs (see 5A for 700 more)

This Section 5 lists the 662 previously planned releases only; Section 5A adds 700 more. Each title below needs its own SKU, label texture, title/loading splash, thumbnail, metadata, price, test-boot result and appropriate package art. **Reuse the media hardware and cartridge PCB profiles above**. Prices shown are proposed **Grade-8 reference resale values** including the assigned, **fixed per-title rarity multiplier**. All amounts may be balanced later; the ten intentionally special Grail titles are exceptions with low-to-mid three-figure values. Art directions are concise seeds; they are not completed artwork.

### Bintendo Entertainment System (`BES`) — 24 games to create

**Game format:** BES Game Pak  |  **Reused hardware:** 5 shared PCB designs (see factory revision register).

| SKU | New game title | Genre | PCB profile | Grade-8 reference value | Rarity | Label / loading-screen art direction |
|---|---|---|---|---:|---|---|
| `BES-005` | Turtle Town Tumble | Platformer | `BES-V1.117` | $18 | Common | hero leaping across layered platforms; lime & charcoal |
| `BES-006` | Duck Pond Defender | Arcade Shooter | `BES-V1.483` | $38 | Common | pixel projectile streaks over hostile silhouettes; saffron & teal |
| `BES-007` | Turbo Toaster Rally | Racing | `BES-V1.483` | $17 | Scarce | angled track with speeding vehicles; black & neon magenta |
| `BES-008` | Dragon Crown of Tallow | Role-playing | `BES-V4.106` | $30 | Common | fantasy party beneath a monumental landmark; blood orange & black |
| `BES-009` | Maze of the Missing Socks | Puzzle | `BES-V4.106` | $60 | Common | floating geometric tiles and a glowing solution path; sky blue & white |
| `BES-010` | Kung-Fu Kettle | Fighting | `BES-V2.216` | $25 | Common | two rivals face off in an arena; cobalt & coral |
| `BES-011` | Professor Pebble and the Cave | Adventure | `BES-V1.483` | $50 | Common | explorer at the entrance to a mysterious location; amber & navy |
| `BES-012` | Penalty Kick Panic | Sports | `BES-V2.216` | $29 | Scarce | stadium spotlights and mid-action sports equipment; violet & electric cyan |
| `BES-013` | Castle Siege Tactics | Strategy | `BES-V4.106` | $47 | Uncommon | top-down tactical map with colored factions; forest green & gold |
| `BES-014` | Disco Dungeon Beats | Rhythm | `BES-V4.106` | $15 | Common | pulsing equalizer bars and note trails; warm red & cream |
| `BES-015` | The Basement Visitor | Survival Horror | `BES-V1.117` | $35 | Common | single flashlight beam in an ominous corridor; silver & deep purple |
| `BES-016` | Farmyard Tycoon | Simulation | `BES-V4.106` | $8 | Common | isometric miniature workspace or city; turquoise & sunset orange |
| `BES-017` | Shadow Sock Agent | Stealth | `BES-V2.216` | $28 | Common | masked silhouette beneath searchlights; lime & charcoal |
| `BES-018` | Nebula Patrol 8 | Space Combat | `BES-V1.117` | $65 | Uncommon | starfighters bank through an asteroid field; saffron & teal |
| `BES-019` | Jungle Map Mystery | Exploration | `BES-V4.106` | $26 | Uncommon | wide horizon with map markers; black & neon magenta |
| `BES-020` | Four Player Food Fight | Party | `BES-V1.117` | $45 | Common | four distinct mascot characters in a lively collage; blood orange & black |
| `BES-021` | Downtown Donnybrook | Beat-em-up | `BES-V1.483` | $18 | Common | street fighters against an urban skyline; sky blue & white |
| `BES-022` | Bricktown Builders | Building | `BES-V2.216` | $38 | Common | modular structures growing across a grid; cobalt & coral |
| `BES-023` | Tiny Tank Brigade | Tactical Action | `BES-V1.117` | $12 | Common | squad silhouettes over a targeting-grid display; amber & navy |
| `BES-024` | Micro Kart Mania | Kart Racing | `BES-V4.106` | $30 | Common | small racing machines sliding through corners; violet & electric cyan |
| `BES-025` | Crypt of the Copper King | Roguelike | `BES-V1.117` | $235 | Grail | maze entrance with relics and randomized doorways; forest green & gold |
| `BES-026` | The Case of the Missing Moon | Mystery | `BES-V4.106` | $30 | Uncommon | detective board, clues, and a dramatic shadow; warm red & cream |
| `BES-027` | Knight of the Paper Crown | Action RPG | `BES-V3.734` | $50 | Common | armored hero confronting a towering guardian; silver & deep purple |
| `BES-028` | Pinball Panic Palace | Pinball | `BES-V3.734` | $24 | Uncommon | ball, bumpers, and glowing score indicators; turquoise & sunset orange |

### Bintendo 64 (`B64`) — 24 games to create

**Game format:** B64 Game Pak  |  **Reused hardware:** 5 shared PCB designs (see factory revision register).

| SKU | New game title | Genre | PCB profile | Grade-8 reference value | Rarity | Label / loading-screen art direction |
|---|---|---|---|---:|---|---|
| `B64-005` | Plumber Planet 64 | Platformer | `B64-V1.204` | $26 | Scarce | hero leaping across layered platforms; lime & charcoal |
| `B64-006` | Laser Llama Invasion | Arcade Shooter | `B64-V2.041` | $45 | Uncommon | pixel projectile streaks over hostile silhouettes; saffron & teal |
| `B64-007` | Turbo Tunnel Racers | Racing | `B64-V2.041` | $12 | Common | angled track with speeding vehicles; black & neon magenta |
| `B64-008` | Crystal Kingdom Chronicles | Role-playing | `B64-V3.842` | $285 | Grail | fantasy party beneath a monumental landmark; blood orange & black |
| `B64-009` | Puzzle Pyramid 64 | Puzzle | `B64-V3.842` | $60 | Common | floating geometric tiles and a glowing solution path; sky blue & white |
| `B64-010` | Battle Beasts Arena | Fighting | `B64-V2.508` | $36 | Scarce | two rivals face off in an arena; cobalt & coral |
| `B64-011` | Temple of the Blue Monkey | Adventure | `B64-V2.041` | $72 | Scarce | explorer at the entrance to a mysterious location; amber & navy |
| `B64-012` | Extreme Frisbee 64 | Sports | `B64-V2.508` | $20 | Common | stadium spotlights and mid-action sports equipment; violet & electric cyan |
| `B64-013` | Tiny Kingdom Conquest | Strategy | `B64-V3.842` | $58 | Scarce | top-down tactical map with colored factions; forest green & gold |
| `B64-014` | DJ Thunder Turntable | Rhythm | `B64-V3.842` | $15 | Common | pulsing equalizer bars and note trails; warm red & cream |
| `B64-015` | Cabin at the End of Level | Survival Horror | `B64-V1.204` | $61 | Rare | single flashlight beam in an ominous corridor; silver & deep purple |
| `B64-016` | City Block Simulator | Simulation | `B64-V3.842` | $12 | Scarce | isometric miniature workspace or city; turquoise & sunset orange |
| `B64-017` | Sneaky Squirrel 64 | Stealth | `B64-V2.508` | $33 | Uncommon | masked silhouette beneath searchlights; lime & charcoal |
| `B64-018` | Galactic Ace Squadron | Space Combat | `B64-V1.204` | $65 | Uncommon | starfighters bank through an asteroid field; saffron & teal |
| `B64-019` | Deep Cave Explorers | Exploration | `B64-V3.842` | $26 | Uncommon | wide horizon with map markers; black & neon magenta |
| `B64-020` | Couch Chaos Party | Party | `B64-V1.204` | $45 | Common | four distinct mascot characters in a lively collage; blood orange & black |
| `B64-021` | Street Snack Showdown | Beat-em-up | `B64-V2.041` | $26 | Scarce | street fighters against an urban skyline; sky blue & white |
| `B64-022` | World Builder 64 | Building | `B64-V2.508` | $38 | Common | modular structures growing across a grid; cobalt & coral |
| `B64-023` | Robot Command 64 | Tactical Action | `B64-V1.204` | $17 | Scarce | squad silhouettes over a targeting-grid display; amber & navy |
| `B64-024` | Mini Kart Mayhem | Kart Racing | `B64-V3.842` | $30 | Common | small racing machines sliding through corners; violet & electric cyan |
| `B64-025` | Castle Crawl 64 | Roguelike | `B64-V1.204` | $71 | Uncommon | maze entrance with relics and randomized doorways; forest green & gold |
| `B64-026` | Clocktower Detective | Mystery | `B64-V3.842` | $25 | Common | detective board, clues, and a dramatic shadow; warm red & cream |
| `B64-027` | The Ember Sword 64 | Action RPG | `B64-V3.129` | $110 | Very Rare | armored hero confronting a towering guardian; silver & deep purple |
| `B64-028` | Cosmic Pinball 64 | Pinball | `B64-V3.129` | $24 | Uncommon | ball, bumpers, and glowing score indicators; turquoise & sunset orange |

### Vega Exodus (`VEGA`) — 24 games to create

**Game format:** Vega Cartridge  |  **Reused hardware:** 5 shared PCB designs (see factory revision register).

| SKU | New game title | Genre | PCB profile | Grade-8 reference value | Rarity | Label / loading-screen art direction |
|---|---|---|---|---:|---|---|
| `VEGA-005` | Pixel Possum Patrol | Platformer | `VEGA-V1.095` | $24 | Uncommon | hero leaping across layered platforms; saffron & teal |
| `VEGA-006` | Astro Blaster Alpha | Arcade Shooter | `VEGA-V1.622` | $58 | Scarce | pixel projectile streaks over hostile silhouettes; black & neon magenta |
| `VEGA-007` | Night Highway Overdrive | Racing | `VEGA-V1.622` | $22 | Scarce | angled track with speeding vehicles; blood orange & black |
| `VEGA-008` | Rune Knight Exodus | Role-playing | `VEGA-V3.318` | $35 | Common | fantasy party beneath a monumental landmark; sky blue & white |
| `VEGA-009` | Hex Block Havoc | Puzzle | `VEGA-V3.318` | $8 | Common | floating geometric tiles and a glowing solution path; cobalt & coral |
| `VEGA-010` | Battle Brawler V | Fighting | `VEGA-V2.174` | $28 | Common | two rivals face off in an arena; amber & navy |
| `VEGA-011` | Lost City of Vexa | Adventure | `VEGA-V1.622` | $55 | Common | explorer at the entrance to a mysterious location; violet & electric cyan |
| `VEGA-012` | Super Kick Cup | Sports | `VEGA-V2.174` | $26 | Uncommon | stadium spotlights and mid-action sports equipment; forest green & gold |
| `VEGA-013` | War of the Tiny Empires | Strategy | `VEGA-V3.318` | $53 | Uncommon | top-down tactical map with colored factions; warm red & cream |
| `VEGA-014` | Sonic Beatdown Mix | Rhythm | `VEGA-V3.318` | $18 | Common | pulsing equalizer bars and note trails; silver & deep purple |
| `VEGA-015` | Crypt Keeper Hotline | Survival Horror | `VEGA-V1.095` | $45 | Uncommon | single flashlight beam in an ominous corridor; turquoise & sunset orange |
| `VEGA-016` | Theme Park Takeover | Simulation | `VEGA-V3.318` | $12 | Common | isometric miniature workspace or city; lime & charcoal |
| `VEGA-017` | Agent Sidewinder | Stealth | `VEGA-V2.174` | $30 | Common | masked silhouette beneath searchlights; saffron & teal |
| `VEGA-018` | Steel Falcon Squadron | Space Combat | `VEGA-V1.095` | $87 | Scarce | starfighters bank through an asteroid field; black & neon magenta |
| `VEGA-019` | Ruins of the Red Sun | Exploration | `VEGA-V3.318` | $25 | Common | wide horizon with map markers; blood orange & black |
| `VEGA-020` | Saturday Party Panic | Party | `VEGA-V1.095` | $50 | Common | four distinct mascot characters in a lively collage; sky blue & white |
| `VEGA-021` | Mean Street Meatheads | Beat-em-up | `VEGA-V1.622` | $20 | Common | street fighters against an urban skyline; cobalt & coral |
| `VEGA-022` | Mech Factory Manager | Building | `VEGA-V2.174` | $58 | Scarce | modular structures growing across a grid; amber & navy |
| `VEGA-023` | Shadow Trooper 16 | Tactical Action | `VEGA-V1.095` | $15 | Common | squad silhouettes over a targeting-grid display; violet & electric cyan |
| `VEGA-024` | Turbo Track Terrors | Kart Racing | `VEGA-V3.318` | $41 | Uncommon | small racing machines sliding through corners; forest green & gold |
| `VEGA-025` | Dungeon Dice Duel | Roguelike | `VEGA-V1.095` | $8 | Common | maze entrance with relics and randomized doorways; warm red & cream |
| `VEGA-026` | Detective Neon | Mystery | `VEGA-V3.318` | $28 | Common | detective board, clues, and a dramatic shadow; silver & deep purple |
| `VEGA-027` | Blade of the Burning Realm | Action RPG | `VEGA-V2.906` | $55 | Common | armored hero confronting a towering guardian; turquoise & sunset orange |
| `VEGA-028` | Pinball Exodus | Pinball | `VEGA-V2.906` | $22 | Common | ball, bumpers, and glowing score indicators; lime & charcoal |

### Paltari Family Console (`PALT`) — 24 games to create

**Game format:** Paltari Cartridge  |  **Reused hardware:** 5 shared PCB designs (see factory revision register).

| SKU | New game title | Genre | PCB profile | Grade-8 reference value | Rarity | Label / loading-screen art direction |
|---|---|---|---|---:|---|---|
| `PALT-005` | Jumping Jackrabbit | Platformer | `PALT-V0.921` | $20 | Common | hero leaping across layered platforms; saffron & teal |
| `PALT-006` | Pixel Invaders | Arcade Shooter | `PALT-V1.052` | $40 | Common | pixel projectile streaks over hostile silhouettes; black & neon magenta |
| `PALT-007` | Grand Prix Paper Car | Racing | `PALT-V1.052` | $22 | Scarce | angled track with speeding vehicles; blood orange & black |
| `PALT-008` | Cave Wizard Adventure | Role-playing | `PALT-V2.955` | $41 | Uncommon | fantasy party beneath a monumental landmark; sky blue & white |
| `PALT-009` | Number Blocks Deluxe | Puzzle | `PALT-V2.955` | $8 | Common | floating geometric tiles and a glowing solution path; cobalt & coral |
| `PALT-010` | Stick Figure Kombat | Fighting | `PALT-V1.771` | $41 | Scarce | two rivals face off in an arena; amber & navy |
| `PALT-011` | The Haunted Lighthouse | Adventure | `PALT-V1.052` | $55 | Common | explorer at the entrance to a mysterious location; violet & electric cyan |
| `PALT-012` | Backyard Baseball Byte | Sports | `PALT-V1.771` | $22 | Common | stadium spotlights and mid-action sports equipment; forest green & gold |
| `PALT-013` | Tower Defense 260 | Strategy | `PALT-V2.955` | $79 | Rare | top-down tactical map with colored factions; warm red & cream |
| `PALT-014` | Beep Boop Boogie | Rhythm | `PALT-V2.955` | $18 | Common | pulsing equalizer bars and note trails; silver & deep purple |
| `PALT-015` | Night of the Haunted Dot | Survival Horror | `PALT-V0.921` | $38 | Common | single flashlight beam in an ominous corridor; turquoise & sunset orange |
| `PALT-016` | Railway Dispatcher | Simulation | `PALT-V2.955` | $12 | Common | isometric miniature workspace or city; lime & charcoal |
| `PALT-017` | Invisible Spy | Stealth | `PALT-V1.771` | $30 | Common | masked silhouette beneath searchlights; saffron & teal |
| `PALT-018` | Solar Defender | Space Combat | `PALT-V0.921` | $132 | Very Rare | starfighters bank through an asteroid field; black & neon magenta |
| `PALT-019` | The Secret Mine | Exploration | `PALT-V2.955` | $25 | Common | wide horizon with map markers; blood orange & black |
| `PALT-020` | Party Paddle Collection | Party | `PALT-V0.921` | $50 | Common | four distinct mascot characters in a lively collage; sky blue & white |
| `PALT-021` | Street Brawl 8 | Beat-em-up | `PALT-V1.052` | $20 | Common | street fighters against an urban skyline; cobalt & coral |
| `PALT-022` | Little City Planner | Building | `PALT-V1.771` | $40 | Common | modular structures growing across a grid; amber & navy |
| `PALT-023` | Frontline Blips | Tactical Action | `PALT-V0.921` | $26 | Rare | squad silhouettes over a targeting-grid display; violet & electric cyan |
| `PALT-024` | Kart Racer 260 | Kart Racing | `PALT-V2.955` | $35 | Common | small racing machines sliding through corners; forest green & gold |
| `PALT-025` | Rogue Dot Dungeon | Roguelike | `PALT-V0.921` | $14 | Rare | maze entrance with relics and randomized doorways; warm red & cream |
| `PALT-026` | Mystery House Radio | Mystery | `PALT-V2.955` | $28 | Common | detective board, clues, and a dramatic shadow; silver & deep purple |
| `PALT-027` | Quest of Tiny Tim | Action RPG | `PALT-V2.409` | $65 | Uncommon | armored hero confronting a towering guardian; turquoise & sunset orange |
| `PALT-028` | Electric Pinball Club | Pinball | `PALT-V2.409` | $22 | Common | ball, bumpers, and glowing score indicators; lime & charcoal |

### Dream Boy / Pocket / Color (`DB`) — 24 games to create

**Game format:** Dream Boy Game Pak  |  **Reused hardware:** 5 shared PCB designs (see factory revision register).

| SKU | New game title | Genre | PCB profile | Grade-8 reference value | Rarity | Label / loading-screen art direction |
|---|---|---|---|---:|---|---|
| `DB-005` | Bubble Boots Adventure | Platformer | `DB-V1.033` | $15 | Common | hero leaping across layered platforms; turquoise & sunset orange |
| `DB-006` | Alien Sprout Defender | Arcade Shooter | `DB-V1.319` | $51 | Scarce | pixel projectile streaks over hostile silhouettes; lime & charcoal |
| `DB-007` | Pocket Racer Circuit | Racing | `DB-V1.319` | $12 | Scarce | angled track with speeding vehicles; saffron & teal |
| `DB-008` | Mystic Leaf Kingdom | Role-playing | `DB-V3.207` | $33 | Uncommon | fantasy party beneath a monumental landmark; black & neon magenta |
| `DB-009` | Tile Match Tower | Puzzle | `DB-V3.207` | $55 | Common | floating geometric tiles and a glowing solution path; blood orange & black |
| `DB-010` | Pocket Punch League | Fighting | `DB-V2.078` | $22 | Common | two rivals face off in an arena; sky blue & white |
| `DB-011` | The Lost Puddle | Adventure | `DB-V1.319` | $99 | Very Rare | explorer at the entrance to a mysterious location; cobalt & coral |
| `DB-012` | Mini Golf Mayhem | Sports | `DB-V2.078` | $18 | Common | stadium spotlights and mid-action sports equipment; amber & navy |
| `DB-013` | Castle Chess Clash | Strategy | `DB-V3.207` | $38 | Common | top-down tactical map with colored factions; violet & electric cyan |
| `DB-014` | Pocket Beat Parade | Rhythm | `DB-V3.207` | $17 | Scarce | pulsing equalizer bars and note trails; forest green & gold |
| `DB-015` | Haunted Handheld Hotel | Survival Horror | `DB-V1.033` | $44 | Scarce | single flashlight beam in an ominous corridor; warm red & cream |
| `DB-016` | Tiny Town Mayor | Simulation | `DB-V3.207` | $60 | Common | isometric miniature workspace or city; silver & deep purple |
| `DB-017` | Agent Acorn | Stealth | `DB-V2.078` | $30 | Uncommon | masked silhouette beneath searchlights; turquoise & sunset orange |
| `DB-018` | Star Wing Pocket | Space Combat | `DB-V1.033` | $50 | Common | starfighters bank through an asteroid field; lime & charcoal |
| `DB-019` | Crystal Cavern Mapper | Exploration | `DB-V3.207` | $20 | Common | wide horizon with map markers; saffron & teal |
| `DB-020` | Sleepover Mini Games | Party | `DB-V1.033` | $47 | Uncommon | four distinct mascot characters in a lively collage; black & neon magenta |
| `DB-021` | Alleyway Brawlers | Beat-em-up | `DB-V1.319` | $18 | Uncommon | street fighters against an urban skyline; blood orange & black |
| `DB-022` | Pocket Farm Builder | Building | `DB-V2.078` | $41 | Uncommon | modular structures growing across a grid; sky blue & white |
| `DB-023` | Tactical Tadpoles | Tactical Action | `DB-V1.033` | $9 | Uncommon | squad silhouettes over a targeting-grid display; cobalt & coral |
| `DB-024` | Super Mini Kart | Kart Racing | `DB-V3.207` | $33 | Uncommon | small racing machines sliding through corners; amber & navy |
| `DB-025` | Rogue Pocket Crypt | Roguelike | `DB-V1.033` | $65 | Uncommon | maze entrance with relics and randomized doorways; violet & electric cyan |
| `DB-026` | Detective Daisy | Mystery | `DB-V3.207` | $22 | Common | detective board, clues, and a dramatic shadow; forest green & gold |
| `DB-027` | The Goblin Pocketbook | Action RPG | `DB-V2.615` | $45 | Common | armored hero confronting a towering guardian; warm red & cream |
| `DB-028` | Pocketball Pinball | Pinball | `DB-V2.615` | $18 | Common | ball, bumpers, and glowing score indicators; silver & deep purple |

### Dream Boy Advance / SP / Micro (`DBA`) — 24 games to create

**Game format:** Dream Boy Advance Game Pak  |  **Reused hardware:** 5 shared PCB designs (see factory revision register).

| SKU | New game title | Genre | PCB profile | Grade-8 reference value | Rarity | Label / loading-screen art direction |
|---|---|---|---|---:|---|---|
| `DBA-005` | Pixel Pirate Advance | Platformer | `DBA-V1.114` | $18 | Common | hero leaping across layered platforms; lime & charcoal |
| `DBA-006` | Bug Blaster DX | Arcade Shooter | `DBA-V1.566` | $38 | Common | pixel projectile streaks over hostile silhouettes; saffron & teal |
| `DBA-007` | Nitro Road Pocket | Racing | `DBA-V1.566` | $14 | Uncommon | angled track with speeding vehicles; black & neon magenta |
| `DBA-008` | Dragon Orchid Legacy | Role-playing | `DBA-V3.449` | $30 | Common | fantasy party beneath a monumental landmark; blood orange & black |
| `DBA-009` | Blockfall Advance | Puzzle | `DBA-V3.449` | $60 | Common | floating geometric tiles and a glowing solution path; sky blue & white |
| `DBA-010` | Pocket Fighters EX | Fighting | `DBA-V2.208` | $25 | Common | two rivals face off in an arena; cobalt & coral |
| `DBA-011` | The Golden Compass Frog | Adventure | `DBA-V1.566` | $72 | Scarce | explorer at the entrance to a mysterious location; amber & navy |
| `DBA-012` | Championship Tennis Mini | Sports | `DBA-V2.208` | $20 | Common | stadium spotlights and mid-action sports equipment; violet & electric cyan |
| `DBA-013` | Advance Castle Wars | Strategy | `DBA-V3.449` | $40 | Common | top-down tactical map with colored factions; forest green & gold |
| `DBA-014` | Beatbox Battalion | Rhythm | `DBA-V3.449` | $18 | Uncommon | pulsing equalizer bars and note trails; warm red & cream |
| `DBA-015` | Midnight Mansion Advance | Survival Horror | `DBA-V1.114` | $35 | Common | single flashlight beam in an ominous corridor; silver & deep purple |
| `DBA-016` | Island Resort Manager | Simulation | `DBA-V3.449` | $9 | Uncommon | isometric miniature workspace or city; turquoise & sunset orange |
| `DBA-017` | Stealth Gecko Zero | Stealth | `DBA-V2.208` | $62 | Very Rare | masked silhouette beneath searchlights; lime & charcoal |
| `DBA-018` | Star Patrol Fusion | Space Combat | `DBA-V1.114` | $55 | Common | starfighters bank through an asteroid field; saffron & teal |
| `DBA-019` | Cavern Explorer EX | Exploration | `DBA-V3.449` | $26 | Uncommon | wide horizon with map markers; black & neon magenta |
| `DBA-020` | Party Pack Advance | Party | `DBA-V1.114` | $45 | Common | four distinct mascot characters in a lively collage; blood orange & black |
| `DBA-021` | Subway Brawl Advance | Beat-em-up | `DBA-V1.566` | $18 | Common | street fighters against an urban skyline; sky blue & white |
| `DBA-022` | Mini Metro Architect | Building | `DBA-V2.208` | $66 | Rare | modular structures growing across a grid; cobalt & coral |
| `DBA-023` | Pocket Commando Tactics | Tactical Action | `DBA-V1.114` | $17 | Scarce | squad silhouettes over a targeting-grid display; amber & navy |
| `DBA-024` | Turbo Kart Advance | Kart Racing | `DBA-V3.449` | $35 | Uncommon | small racing machines sliding through corners; violet & electric cyan |
| `DBA-025` | Rogue Lantern Advance | Roguelike | `DBA-V1.114` | $87 | Scarce | maze entrance with relics and randomized doorways; forest green & gold |
| `DBA-026` | Detective Pixel 2 | Mystery | `DBA-V3.449` | $25 | Common | detective board, clues, and a dramatic shadow; warm red & cream |
| `DBA-027` | Sword of the Sapphire Age | Action RPG | `DBA-V3.071` | $50 | Common | armored hero confronting a towering guardian; silver & deep purple |
| `DBA-028` | Pinball Galaxy Advance | Pinball | `DBA-V3.071` | $20 | Common | ball, bumpers, and glowing score indicators; turquoise & sunset orange |

### Button Lite (`BUTTON`) — 24 games to create

**Game format:** Button Lite 6-pin Game Card  |  **Reused hardware:** 5 shared PCB designs (see factory revision register).

| SKU | New game title | Genre | PCB profile | Grade-8 reference value | Rarity | Label / loading-screen art direction |
|---|---|---|---|---:|---|---|
| `BUTTON-001` | Button Hop Heroes | Platformer | `BUTTON-V1.011` | $25 | Common | hero leaping across layered platforms; turquoise & sunset orange |
| `BUTTON-002` | Micro Meteor Blaster | Arcade Shooter | `BUTTON-V1.407` | $50 | Common | pixel projectile streaks over hostile silhouettes; lime & charcoal |
| `BUTTON-003` | Thumb Racing Turbo | Racing | `BUTTON-V1.407` | $20 | Common | angled track with speeding vehicles; saffron & teal |
| `BUTTON-004` | Tiny Dragon Diary | Role-playing | `BUTTON-V2.824` | $40 | Common | fantasy party beneath a monumental landmark; black & neon magenta |
| `BUTTON-005` | Six-Pin Shape Shifter | Puzzle | `BUTTON-V2.824` | $15 | Common | floating geometric tiles and a glowing solution path; blood orange & black |
| `BUTTON-006` | Pocket Punch Mini | Fighting | `BUTTON-V1.953` | $41 | Uncommon | two rivals face off in an arena; sky blue & white |
| `BUTTON-007` | Lost Buttons Adventure | Adventure | `BUTTON-V1.407` | $12 | Scarce | explorer at the entrance to a mysterious location; cobalt & coral |
| `BUTTON-008` | Finger Football Lite | Sports | `BUTTON-V1.953` | $33 | Uncommon | stadium spotlights and mid-action sports equipment; amber & navy |
| `BUTTON-009` | Button Tower Tactics | Strategy | `BUTTON-V2.824` | $55 | Common | top-down tactical map with colored factions; violet & electric cyan |
| `BUTTON-010` | Tiny Beat Tapper | Rhythm | `BUTTON-V2.824` | $22 | Common | pulsing equalizer bars and note trails; forest green & gold |
| `BUTTON-011` | Spooky Pixel Mini | Survival Horror | `BUTTON-V1.011` | $45 | Common | single flashlight beam in an ominous corridor; warm red & cream |
| `BUTTON-012` | Little Bakery Story | Simulation | `BUTTON-V2.824` | $18 | Common | isometric miniature workspace or city; silver & deep purple |
| `BUTTON-013` | Secret Button Agent | Stealth | `BUTTON-V1.953` | $38 | Common | masked silhouette beneath searchlights; turquoise & sunset orange |
| `BUTTON-014` | Pocket Satellite Wars | Space Combat | `BUTTON-V1.011` | $12 | Common | starfighters bank through an asteroid field; lime & charcoal |
| `BUTTON-015` | Mini Cave Explorer | Exploration | `BUTTON-V2.824` | $30 | Common | wide horizon with map markers; saffron & teal |
| `BUTTON-016` | Button Party Twelve | Party | `BUTTON-V1.011` | $71 | Uncommon | four distinct mascot characters in a lively collage; black & neon magenta |
| `BUTTON-017` | Tiny Town Trouble | Beat-em-up | `BUTTON-V1.407` | $30 | Uncommon | street fighters against an urban skyline; blood orange & black |
| `BUTTON-018` | Build a Pocket Garden | Building | `BUTTON-V1.953` | $59 | Uncommon | modular structures growing across a grid; sky blue & white |
| `BUTTON-019` | Micro Soldier Tactics | Tactical Action | `BUTTON-V1.011` | $20 | Common | squad silhouettes over a targeting-grid display; cobalt & coral |
| `BUTTON-020` | Thumb Kart Sprint | Kart Racing | `BUTTON-V2.824` | $40 | Common | small racing machines sliding through corners; amber & navy |
| `BUTTON-021` | Little Dungeon Loop | Roguelike | `BUTTON-V1.011` | $22 | Scarce | maze entrance with relics and randomized doorways; violet & electric cyan |
| `BUTTON-022` | Mystery Button Motel | Mystery | `BUTTON-V2.824` | $35 | Common | detective board, clues, and a dramatic shadow; forest green & gold |
| `BUTTON-023` | Sword of the Six Pins | Action RPG | `BUTTON-V2.305` | $8 | Common | armored hero confronting a towering guardian; warm red & cream |
| `BUTTON-024` | Pinball in Your Palm | Pinball | `BUTTON-V2.305` | $33 | Uncommon | ball, bumpers, and glowing score indicators; silver & deep purple |

### Retrobit RB35 (`RB35`) — 24 games to create

**Game format:** Retrobit microSD Game Card  |  **Reused hardware:** 1 microSD model.

| SKU | New game title | Genre | PCB profile | Grade-8 reference value | Rarity | Label / loading-screen art direction |
|---|---|---|---|---:|---|---|
| `RB35-001` | Retrobit Arcade Vault | Platformer | Shared media mesh | $20 | Common | hero leaping across layered platforms; warm red & cream |
| `RB35-002` | Hyper Tiny Blaster | Arcade Shooter | Shared media mesh | $47 | Uncommon | pixel projectile streaks over hostile silhouettes; silver & deep purple |
| `RB35-003` | Open Road Retro Rally | Racing | Shared media mesh | $26 | Rare | angled track with speeding vehicles; turquoise & sunset orange |
| `RB35-004` | Chronicles of Bitfall | Role-playing | Shared media mesh | $35 | Common | fantasy party beneath a monumental landmark; lime & charcoal |
| `RB35-005` | Puzzle Pixel Anthology | Puzzle | Shared media mesh | $8 | Common | floating geometric tiles and a glowing solution path; saffron & teal |
| `RB35-006` | Sidekick Fighter Collection | Fighting | Shared media mesh | $28 | Common | two rivals face off in an arena; black & neon magenta |
| `RB35-007` | The Forgotten Cassette | Adventure | Shared media mesh | $121 | Very Rare | explorer at the entrance to a mysterious location; blood orange & black |
| `RB35-008` | Backyard Sports Mix | Sports | Shared media mesh | $26 | Uncommon | stadium spotlights and mid-action sports equipment; sky blue & white |
| `RB35-009` | Retro Strategy Vault | Strategy | Shared media mesh | $53 | Uncommon | top-down tactical map with colored factions; cobalt & coral |
| `RB35-010` | Beat Chip Collection | Rhythm | Shared media mesh | $21 | Uncommon | pulsing equalizer bars and note trails; amber & navy |
| `RB35-011` | Midnight Horror Bits | Survival Horror | Shared media mesh | $84 | Very Rare | single flashlight beam in an ominous corridor; violet & electric cyan |
| `RB35-012` | Pixel City Workshop | Simulation | Shared media mesh | $17 | Scarce | isometric miniature workspace or city; forest green & gold |
| `RB35-013` | Shadowbyte Operations | Stealth | Shared media mesh | $30 | Common | masked silhouette beneath searchlights; warm red & cream |
| `RB35-014` | Orbit Command Retro | Space Combat | Shared media mesh | $60 | Common | starfighters bank through an asteroid field; silver & deep purple |
| `RB35-015` | Cave Map Compendium | Exploration | Shared media mesh | $25 | Common | wide horizon with map markers; turquoise & sunset orange |
| `RB35-016` | Living Room Party Pack | Party | Shared media mesh | $50 | Common | four distinct mascot characters in a lively collage; lime & charcoal |
| `RB35-017` | Punch-Out-ish Street Club | Beat-em-up | Shared media mesh | $20 | Common | street fighters against an urban skyline; saffron & teal |
| `RB35-018` | Builder's Toolbox 35 | Building | Shared media mesh | $47 | Uncommon | modular structures growing across a grid; black & neon magenta |
| `RB35-019` | Squad Tactics Retro | Tactical Action | Shared media mesh | $15 | Common | squad silhouettes over a targeting-grid display; blood orange & black |
| `RB35-020` | Micro Kart Vault | Kart Racing | Shared media mesh | $61 | Rare | small racing machines sliding through corners; sky blue & white |
| `RB35-021` | Dungeon Crawl Library | Roguelike | Shared media mesh | $8 | Common | maze entrance with relics and randomized doorways; cobalt & coral |
| `RB35-022` | Mystery Mansion Remix | Mystery | Shared media mesh | $28 | Common | detective board, clues, and a dramatic shadow; amber & navy |
| `RB35-023` | Sword & Scroll Collection | Action RPG | Shared media mesh | $55 | Common | armored hero confronting a towering guardian; violet & electric cyan |
| `RB35-024` | Pinball Museum RB | Pinball | Shared media mesh | $22 | Common | ball, bumpers, and glowing score indicators; forest green & gold |

### Bintendo Pocket Joy Advance (`PJOY`) — 24 games to create

**Game format:** Pocket Joy Mini Cartridge  |  **Reused hardware:** 5 shared PCB designs (see factory revision register).

| SKU | New game title | Genre | PCB profile | Grade-8 reference value | Rarity | Label / loading-screen art direction |
|---|---|---|---|---:|---|---|
| `PJOY-001` | Twin Screen Plumbers | Platformer | `PJOY-V1.223` | $24 | Uncommon | hero leaping across layered platforms; warm red & cream |
| `PJOY-002` | Alien Doodle Defense | Arcade Shooter | `PJOY-V2.079` | $40 | Common | pixel projectile streaks over hostile silhouettes; silver & deep purple |
| `PJOY-003` | Touch Turbo Rally | Racing | `PJOY-V2.079` | $15 | Common | angled track with speeding vehicles; turquoise & sunset orange |
| `PJOY-004` | Dragon of the Two Moons | Role-playing | `PJOY-V4.008` | $35 | Common | fantasy party beneath a monumental landmark; lime & charcoal |
| `PJOY-005` | Stylus Sudoku City | Puzzle | `PJOY-V4.008` | $8 | Common | floating geometric tiles and a glowing solution path; saffron & teal |
| `PJOY-006` | Dual Screen Dojo | Fighting | `PJOY-V2.491` | $33 | Uncommon | two rivals face off in an arena; black & neon magenta |
| `PJOY-007` | Mystery at Double Lake | Adventure | `PJOY-V2.079` | $65 | Uncommon | explorer at the entrance to a mysterious location; blood orange & black |
| `PJOY-008` | Touchdown Touchscreen | Sports | `PJOY-V2.491` | $26 | Uncommon | stadium spotlights and mid-action sports equipment; sky blue & white |
| `PJOY-009` | Empire of Mini Maps | Strategy | `PJOY-V4.008` | $45 | Common | top-down tactical map with colored factions; cobalt & coral |
| `PJOY-010` | Tap Tap Rhythm Quest | Rhythm | `PJOY-V4.008` | $18 | Common | pulsing equalizer bars and note trails; amber & navy |
| `PJOY-011` | Hotel Nightlight | Survival Horror | `PJOY-V1.223` | $38 | Common | single flashlight beam in an ominous corridor; violet & electric cyan |
| `PJOY-012` | Pet Shop Simulator | Simulation | `PJOY-V4.008` | $17 | Scarce | isometric miniature workspace or city; forest green & gold |
| `PJOY-013` | Secret Agent Stylus | Stealth | `PJOY-V2.491` | $44 | Scarce | masked silhouette beneath searchlights; warm red & cream |
| `PJOY-014` | Galaxy Screens Squadron | Space Combat | `PJOY-V1.223` | $71 | Uncommon | starfighters bank through an asteroid field; silver & deep purple |
| `PJOY-015` | Deep Ocean Atlas | Exploration | `PJOY-V4.008` | $30 | Uncommon | wide horizon with map markers; turquoise & sunset orange |
| `PJOY-016` | Four Stylus Frenzy | Party | `PJOY-V1.223` | $72 | Scarce | four distinct mascot characters in a lively collage; lime & charcoal |
| `PJOY-017` | Street Scribble Brawl | Beat-em-up | `PJOY-V2.079` | $20 | Common | street fighters against an urban skyline; saffron & teal |
| `PJOY-018` | Tiny Island Builder | Building | `PJOY-V2.491` | $40 | Common | modular structures growing across a grid; black & neon magenta |
| `PJOY-019` | Pocket Tacticians | Tactical Action | `PJOY-V1.223` | $15 | Common | squad silhouettes over a targeting-grid display; blood orange & black |
| `PJOY-020` | Double Deck Kart | Kart Racing | `PJOY-V4.008` | $35 | Common | small racing machines sliding through corners; sky blue & white |
| `PJOY-021` | Crypt Keeper Touch | Roguelike | `PJOY-V1.223` | $12 | Scarce | maze entrance with relics and randomized doorways; cobalt & coral |
| `PJOY-022` | Detective Duo DS | Mystery | `PJOY-V4.008` | $28 | Common | detective board, clues, and a dramatic shadow; amber & navy |
| `PJOY-023` | The Sapphire Wizard | Action RPG | `PJOY-V3.146` | $55 | Common | armored hero confronting a towering guardian; violet & electric cyan |
| `PJOY-024` | Pinball Double Vision | Pinball | `PJOY-V3.146` | $22 | Common | ball, bumpers, and glowing score indicators; forest green & gold |

### Homey Sinnusus (`SINN`) — 24 games to create

**Game format:** Sinnusus Retro Cartridge  |  **Reused hardware:** 5 shared PCB designs (see factory revision register).

| SKU | New game title | Genre | PCB profile | Grade-8 reference value | Rarity | Label / loading-screen art direction |
|---|---|---|---|---:|---|---|
| `SINN-001` | Pixel Nomad | Platformer | `SINN-V0.876` | $24 | Uncommon | hero leaping across layered platforms; warm red & cream |
| `SINN-002` | Cosmic Bug Brigade | Arcade Shooter | `SINN-V1.312` | $40 | Common | pixel projectile streaks over hostile silhouettes; silver & deep purple |
| `SINN-003` | Neon Drift Pocket | Racing | `SINN-V1.312` | $15 | Common | angled track with speeding vehicles; turquoise & sunset orange |
| `SINN-004` | The Ancient Homey Scroll | Role-playing | `SINN-V3.017` | $35 | Common | fantasy party beneath a monumental landmark; lime & charcoal |
| `SINN-005` | Puzzle Planet Color | Puzzle | `SINN-V3.017` | $12 | Scarce | floating geometric tiles and a glowing solution path; saffron & teal |
| `SINN-006` | Kickbox Koala | Fighting | `SINN-V1.748` | $28 | Common | two rivals face off in an arena; black & neon magenta |
| `SINN-007` | The Winding Ruins | Adventure | `SINN-V1.312` | $55 | Common | explorer at the entrance to a mysterious location; blood orange & black |
| `SINN-008` | Street Hockey Handheld | Sports | `SINN-V1.748` | $26 | Uncommon | stadium spotlights and mid-action sports equipment; sky blue & white |
| `SINN-009` | Little Empires Portable | Strategy | `SINN-V3.017` | $45 | Common | top-down tactical map with colored factions; cobalt & coral |
| `SINN-010` | Chiptune Beat Journey | Rhythm | `SINN-V3.017` | $18 | Common | pulsing equalizer bars and note trails; amber & navy |
| `SINN-011` | Midnight Walk 16 | Survival Horror | `SINN-V0.876` | $38 | Common | single flashlight beam in an ominous corridor; violet & electric cyan |
| `SINN-012` | Village Builder Color | Simulation | `SINN-V3.017` | $12 | Common | isometric miniature workspace or city; forest green & gold |
| `SINN-013` | Secret Agent Specter | Stealth | `SINN-V1.748` | $30 | Common | masked silhouette beneath searchlights; warm red & cream |
| `SINN-014` | Star Defender Sinnusus | Space Combat | `SINN-V0.876` | $60 | Common | starfighters bank through an asteroid field; silver & deep purple |
| `SINN-015` | Lost Temple Pocket | Exploration | `SINN-V3.017` | $25 | Common | wide horizon with map markers; turquoise & sunset orange |
| `SINN-016` | Sinnusus Party Smash | Party | `SINN-V0.876` | $50 | Common | four distinct mascot characters in a lively collage; lime & charcoal |
| `SINN-017` | Back Alley Heroes | Beat-em-up | `SINN-V1.312` | $20 | Common | street fighters against an urban skyline; saffron & teal |
| `SINN-018` | Workshop 16 | Building | `SINN-V1.748` | $40 | Common | modular structures growing across a grid; black & neon magenta |
| `SINN-019` | Pocket War Council | Tactical Action | `SINN-V0.876` | $15 | Common | squad silhouettes over a targeting-grid display; blood orange & black |
| `SINN-020` | Kart Chaos Color | Kart Racing | `SINN-V3.017` | $41 | Uncommon | small racing machines sliding through corners; sky blue & white |
| `SINN-021` | Rogue Rune Rescue | Roguelike | `SINN-V0.876` | $9 | Uncommon | maze entrance with relics and randomized doorways; cobalt & coral |
| `SINN-022` | The Clockwork Detective | Mystery | `SINN-V3.017` | $33 | Uncommon | detective board, clues, and a dramatic shadow; amber & navy |
| `SINN-023` | The Last Pixel Knight | Action RPG | `SINN-V2.541` | $65 | Uncommon | armored hero confronting a towering guardian; violet & electric cyan |
| `SINN-024` | Sunset Pinball | Pinball | `SINN-V2.541` | $26 | Uncommon | ball, bumpers, and glowing score indicators; forest green & gold |

### Bintentendo Game Orb (`GORB`) — 24 games to create

**Game format:** Game Orb Optical Game Disc  |  **Reused hardware:** 1 mini disc model.

| SKU | New game title | Genre | PCB profile | Grade-8 reference value | Rarity | Label / loading-screen art direction |
|---|---|---|---|---:|---|---|
| `GORB-001` | Orbital Plumber Parade | Platformer | Shared media mesh | $20 | Common | hero leaping across layered platforms; warm red & cream |
| `GORB-002` | Star Duck Armada | Arcade Shooter | Shared media mesh | $40 | Common | pixel projectile streaks over hostile silhouettes; silver & deep purple |
| `GORB-003` | Gravity Kart GP | Racing | Shared media mesh | $15 | Common | angled track with speeding vehicles; turquoise & sunset orange |
| `GORB-004` | Legend of the Crystal Orb | Role-playing | Shared media mesh | $41 | Uncommon | fantasy party beneath a monumental landmark; lime & charcoal |
| `GORB-005` | Sphere Puzzle Factory | Puzzle | Shared media mesh | $8 | Common | floating geometric tiles and a glowing solution path; saffron & teal |
| `GORB-006` | Gladiator Goblins | Fighting | Shared media mesh | $28 | Common | two rivals face off in an arena; black & neon magenta |
| `GORB-007` | The Island Beyond the Ring | Adventure | Shared media mesh | $55 | Common | explorer at the entrance to a mysterious location; blood orange & black |
| `GORB-008` | Orb Soccer Championship | Sports | Shared media mesh | $26 | Uncommon | stadium spotlights and mid-action sports equipment; sky blue & white |
| `GORB-009` | Moonbase Colony Wars | Strategy | Shared media mesh | $45 | Common | top-down tactical map with colored factions; cobalt & coral |
| `GORB-010` | Rhythm Rocket Orchestra | Rhythm | Shared media mesh | $18 | Common | pulsing equalizer bars and note trails; amber & navy |
| `GORB-011` | Haunted Orbit Station | Survival Horror | Shared media mesh | $38 | Common | single flashlight beam in an ominous corridor; violet & electric cyan |
| `GORB-012` | Planet Zoo Tycoon | Simulation | Shared media mesh | $12 | Common | isometric miniature workspace or city; forest green & gold |
| `GORB-013` | Agent Orb Zero | Stealth | Shared media mesh | $35 | Uncommon | masked silhouette beneath searchlights; warm red & cream |
| `GORB-014` | Cosmic Fleet Command | Space Combat | Shared media mesh | $60 | Common | starfighters bank through an asteroid field; silver & deep purple |
| `GORB-015` | Sea of Sapphire Stars | Exploration | Shared media mesh | $25 | Common | wide horizon with map markers; turquoise & sunset orange |
| `GORB-016` | Orb Party Carnival | Party | Shared media mesh | $50 | Common | four distinct mascot characters in a lively collage; lime & charcoal |
| `GORB-017` | Rumble Raccoon Brawl | Beat-em-up | Shared media mesh | $24 | Uncommon | street fighters against an urban skyline; saffron & teal |
| `GORB-018` | Little Planets Architect | Building | Shared media mesh | $40 | Common | modular structures growing across a grid; black & neon magenta |
| `GORB-019` | Space Marine Tactics | Tactical Action | Shared media mesh | $15 | Common | squad silhouettes over a targeting-grid display; blood orange & black |
| `GORB-020` | Galaxy Kart Knockout | Kart Racing | Shared media mesh | $41 | Uncommon | small racing machines sliding through corners; sky blue & white |
| `GORB-021` | Rogue Planet Explorer | Roguelike | Shared media mesh | $8 | Common | maze entrance with relics and randomized doorways; cobalt & coral |
| `GORB-022` | The Detective of Hollow Earth | Mystery | Shared media mesh | $28 | Common | detective board, clues, and a dramatic shadow; amber & navy |
| `GORB-023` | Sword of a Thousand Suns | Action RPG | Shared media mesh | $65 | Uncommon | armored hero confronting a towering guardian; violet & electric cyan |
| `GORB-024` | Orbit Pinball Deluxe | Pinball | Shared media mesh | $32 | Scarce | ball, bumpers, and glowing score indicators; forest green & gold |

### Swamarami All-In-One (`SWAMA`) — 24 games to create

**Game format:** Swamarami SD Game Pack  |  **Reused hardware:** 1 SD model.

| SKU | New game title | Genre | PCB profile | Grade-8 reference value | Rarity | Label / loading-screen art direction |
|---|---|---|---|---:|---|---|
| `SWAMA-001` | One Box Platform Parade | Platformer | Shared media mesh | $22 | Common | hero leaping across layered platforms; silver & deep purple |
| `SWAMA-002` | Budget Space Invaders | Arcade Shooter | Shared media mesh | $53 | Uncommon | pixel projectile streaks over hostile silhouettes; turquoise & sunset orange |
| `SWAMA-003` | Cardboard Kart Rally | Racing | Shared media mesh | $26 | Scarce | angled track with speeding vehicles; lime & charcoal |
| `SWAMA-004` | Legend of the Discount Dragon | Role-playing | Shared media mesh | $38 | Common | fantasy party beneath a monumental landmark; saffron & teal |
| `SWAMA-005` | Puzzle Pile 999 | Puzzle | Shared media mesh | $14 | Uncommon | floating geometric tiles and a glowing solution path; black & neon magenta |
| `SWAMA-006` | Fighting Fellas 20-in-1 | Fighting | Shared media mesh | $35 | Uncommon | two rivals face off in an arena; blood orange & black |
| `SWAMA-007` | Lost in Menu Screens | Adventure | Shared media mesh | $71 | Uncommon | explorer at the entrance to a mysterious location; sky blue & white |
| `SWAMA-008` | Soccer Super Combo | Sports | Shared media mesh | $25 | Common | stadium spotlights and mid-action sports equipment; cobalt & coral |
| `SWAMA-009` | Tiny War Collection | Strategy | Shared media mesh | $72 | Scarce | top-down tactical map with colored factions; amber & navy |
| `SWAMA-010` | Rhythm Bargain Bin | Rhythm | Shared media mesh | $20 | Common | pulsing equalizer bars and note trails; violet & electric cyan |
| `SWAMA-011` | Haunted Bootleg Arcade | Survival Horror | Shared media mesh | $40 | Common | single flashlight beam in an ominous corridor; forest green & gold |
| `SWAMA-012` | Market Stall Simulator | Simulation | Shared media mesh | $22 | Scarce | isometric miniature workspace or city; warm red & cream |
| `SWAMA-013` | Secret Agent Offbrand | Stealth | Shared media mesh | $51 | Scarce | masked silhouette beneath searchlights; silver & deep purple |
| `SWAMA-014` | Cosmo Attack Mix | Space Combat | Shared media mesh | $14 | Rare | starfighters bank through an asteroid field; turquoise & sunset orange |
| `SWAMA-015` | Adventure Game Megabundle | Exploration | Shared media mesh | $33 | Uncommon | wide horizon with map markers; lime & charcoal |
| `SWAMA-016` | Family Night 50-in-1 | Party | Shared media mesh | $65 | Uncommon | four distinct mascot characters in a lively collage; saffron & teal |
| `SWAMA-017` | Street Scrappers Remix | Beat-em-up | Shared media mesh | $26 | Uncommon | street fighters against an urban skyline; black & neon magenta |
| `SWAMA-018` | City Blocks Economy | Building | Shared media mesh | $45 | Common | modular structures growing across a grid; blood orange & black |
| `SWAMA-019` | Tactical Game Sampler | Tactical Action | Shared media mesh | $26 | Scarce | squad silhouettes over a targeting-grid display; sky blue & white |
| `SWAMA-020` | Super Value Kart | Kart Racing | Shared media mesh | $45 | Uncommon | small racing machines sliding through corners; cobalt & coral |
| `SWAMA-021` | Roguelike Grab Bag | Roguelike | Shared media mesh | $17 | Scarce | maze entrance with relics and randomized doorways; amber & navy |
| `SWAMA-022` | Mysterious Memory Card | Mystery | Shared media mesh | $30 | Common | detective board, clues, and a dramatic shadow; violet & electric cyan |
| `SWAMA-023` | Sword Quest Bargain | Action RPG | Shared media mesh | $60 | Common | armored hero confronting a towering guardian; forest green & gold |
| `SWAMA-024` | Pinball 700 Games | Pinball | Shared media mesh | $25 | Common | ball, bumpers, and glowing score indicators; warm red & cream |

### DiscJockie 1 (`DJ1`) — 24 games to create

**Game format:** DJ1 Game Disc  |  **Reused hardware:** 1 shared full-size disc model.

| SKU | New game title | Genre | PCB profile | Grade-8 reference value | Rarity | Label / loading-screen art direction |
|---|---|---|---|---:|---|---|
| `DJ1-001` | Jockie Jump Heroes | Platformer | Shared media mesh | $21 | Uncommon | hero leaping across layered platforms; forest green & gold |
| `DJ1-002` | Cosmic Disc Defender | Arcade Shooter | Shared media mesh | $38 | Common | pixel projectile streaks over hostile silhouettes; warm red & cream |
| `DJ1-003` | Turbo Jockey Racers | Racing | Shared media mesh | $12 | Common | angled track with speeding vehicles; silver & deep purple |
| `DJ1-004` | Crystal Dungeons 1 | Role-playing | Shared media mesh | $30 | Common | fantasy party beneath a monumental landmark; turquoise & sunset orange |
| `DJ1-005` | Laser Tile Logic | Puzzle | Shared media mesh | $60 | Common | floating geometric tiles and a glowing solution path; lime & charcoal |
| `DJ1-006` | Blade Brawl Arena | Fighting | Shared media mesh | $36 | Scarce | two rivals face off in an arena; saffron & teal |
| `DJ1-007` | The Sunken Radio Tower | Adventure | Shared media mesh | $50 | Common | explorer at the entrance to a mysterious location; black & neon magenta |
| `DJ1-008` | World Cup Disc Soccer | Sports | Shared media mesh | $24 | Uncommon | stadium spotlights and mid-action sports equipment; blood orange & black |
| `DJ1-009` | Kings of Colony One | Strategy | Shared media mesh | $47 | Uncommon | top-down tactical map with colored factions; sky blue & white |
| `DJ1-010` | Dance Floor Disc Mix | Rhythm | Shared media mesh | $15 | Common | pulsing equalizer bars and note trails; cobalt & coral |
| `DJ1-011` | Midnight Motel 1997 | Survival Horror | Shared media mesh | $350 | Grail | single flashlight beam in an ominous corridor; amber & navy |
| `DJ1-012` | Studio Tycoon 98 | Simulation | Shared media mesh | $8 | Common | isometric miniature workspace or city; violet & electric cyan |
| `DJ1-013` | Agent Double Static | Stealth | Shared media mesh | $41 | Scarce | masked silhouette beneath searchlights; forest green & gold |
| `DJ1-014` | Solar Strike Squadron | Space Combat | Shared media mesh | $96 | Rare | starfighters bank through an asteroid field; warm red & cream |
| `DJ1-015` | Ancient Isle Explorer | Exploration | Shared media mesh | $22 | Common | wide horizon with map markers; silver & deep purple |
| `DJ1-016` | Disc Party Unlimited | Party | Shared media mesh | $45 | Common | four distinct mascot characters in a lively collage; turquoise & sunset orange |
| `DJ1-017` | Downtown Rumble CD | Beat-em-up | Shared media mesh | $18 | Common | street fighters against an urban skyline; lime & charcoal |
| `DJ1-018` | Build-a-Robot Workshop | Building | Shared media mesh | $55 | Scarce | modular structures growing across a grid; saffron & teal |
| `DJ1-019` | Operation Neon Storm | Tactical Action | Shared media mesh | $14 | Uncommon | squad silhouettes over a targeting-grid display; black & neon magenta |
| `DJ1-020` | Kart Raceway One | Kart Racing | Shared media mesh | $44 | Scarce | small racing machines sliding through corners; blood orange & black |
| `DJ1-021` | Rogue Dungeon Alpha | Roguelike | Shared media mesh | $60 | Common | maze entrance with relics and randomized doorways; sky blue & white |
| `DJ1-022` | Detective Cassette | Mystery | Shared media mesh | $25 | Common | detective board, clues, and a dramatic shadow; cobalt & coral |
| `DJ1-023` | The Silver Griffin | Action RPG | Shared media mesh | $50 | Common | armored hero confronting a towering guardian; amber & navy |
| `DJ1-024` | Tilt Table Pinball | Pinball | Shared media mesh | $20 | Common | ball, bumpers, and glowing score indicators; violet & electric cyan |

### DiscJockie 2 (`DJ2`) — 24 games to create

**Game format:** DJ2 Game Disc  |  **Reused hardware:** 1 shared full-size disc model.

| SKU | New game title | Genre | PCB profile | Grade-8 reference value | Rarity | Label / loading-screen art direction |
|---|---|---|---|---:|---|---|
| `DJ2-001` | Jockie Jump 2 | Platformer | Shared media mesh | $26 | Scarce | hero leaping across layered platforms; forest green & gold |
| `DJ2-002` | Space Defenders Turbo | Arcade Shooter | Shared media mesh | $38 | Common | pixel projectile streaks over hostile silhouettes; warm red & cream |
| `DJ2-003` | Burnout Boulevard 2 | Racing | Shared media mesh | $12 | Common | angled track with speeding vehicles; silver & deep purple |
| `DJ2-004` | Legend of the Clocktower II | Role-playing | Shared media mesh | $44 | Scarce | fantasy party beneath a monumental landmark; turquoise & sunset orange |
| `DJ2-005` | Prism Puzzle Masters | Puzzle | Shared media mesh | $60 | Common | floating geometric tiles and a glowing solution path; lime & charcoal |
| `DJ2-006` | Steel Fist Revolution | Fighting | Shared media mesh | $30 | Uncommon | two rivals face off in an arena; saffron & teal |
| `DJ2-007` | The Ruins of Tembora | Adventure | Shared media mesh | $59 | Uncommon | explorer at the entrance to a mysterious location; black & neon magenta |
| `DJ2-008` | National Soccer Stars 2 | Sports | Shared media mesh | $24 | Uncommon | stadium spotlights and mid-action sports equipment; blood orange & black |
| `DJ2-009` | Empire at Dawn | Strategy | Shared media mesh | $58 | Scarce | top-down tactical map with colored factions; sky blue & white |
| `DJ2-010` | Dance Jockie Live | Rhythm | Shared media mesh | $15 | Common | pulsing equalizer bars and note trails; cobalt & coral |
| `DJ2-011` | The Last Train Home | Survival Horror | Shared media mesh | $35 | Common | single flashlight beam in an ominous corridor; amber & navy |
| `DJ2-012` | City Tycoon: Uptown | Simulation | Shared media mesh | $8 | Common | isometric miniature workspace or city; violet & electric cyan |
| `DJ2-013` | Secret Agent Cobalt | Stealth | Shared media mesh | $28 | Common | masked silhouette beneath searchlights; forest green & gold |
| `DJ2-014` | Nebula Strike Two | Space Combat | Shared media mesh | $55 | Common | starfighters bank through an asteroid field; warm red & cream |
| `DJ2-015` | Deep Desert Raiders | Exploration | Shared media mesh | $38 | Rare | wide horizon with map markers; silver & deep purple |
| `DJ2-016` | Party Panic Disc 2 | Party | Shared media mesh | $45 | Common | four distinct mascot characters in a lively collage; turquoise & sunset orange |
| `DJ2-017` | Midnight Alley Brawlers | Beat-em-up | Shared media mesh | $18 | Common | street fighters against an urban skyline; lime & charcoal |
| `DJ2-018` | Robot Factory 2002 | Building | Shared media mesh | $38 | Common | modular structures growing across a grid; saffron & teal |
| `DJ2-019` | Operation Iron Eagle | Tactical Action | Shared media mesh | $12 | Common | squad silhouettes over a targeting-grid display; black & neon magenta |
| `DJ2-020` | Jockie Kart Championship | Kart Racing | Shared media mesh | $30 | Common | small racing machines sliding through corners; blood orange & black |
| `DJ2-021` | Rogue Catacombs II | Roguelike | Shared media mesh | $60 | Common | maze entrance with relics and randomized doorways; sky blue & white |
| `DJ2-022` | The Private Eye Files | Mystery | Shared media mesh | $25 | Common | detective board, clues, and a dramatic shadow; cobalt & coral |
| `DJ2-023` | Dragon Sword: Eclipse | Action RPG | Shared media mesh | $59 | Uncommon | armored hero confronting a towering guardian; amber & navy |
| `DJ2-024` | Pinball Fever 2 | Pinball | Shared media mesh | $29 | Scarce | ball, bumpers, and glowing score indicators; violet & electric cyan |

### DiscJockie 3 (`DJ3`) — 24 games to create

**Game format:** DJ3 Game Disc  |  **Reused hardware:** 1 shared full-size disc model.

| SKU | New game title | Genre | PCB profile | Grade-8 reference value | Rarity | Label / loading-screen art direction |
|---|---|---|---|---:|---|---|
| `DJ3-001` | Rooftop Runners 3 | Platformer | Shared media mesh | $21 | Uncommon | hero leaping across layered platforms; forest green & gold |
| `DJ3-002` | Voidbreaker: Zero Hour | Arcade Shooter | Shared media mesh | $84 | Very Rare | pixel projectile streaks over hostile silhouettes; warm red & cream |
| `DJ3-003` | Nitro Legends HD | Racing | Shared media mesh | $17 | Scarce | angled track with speeding vehicles; silver & deep purple |
| `DJ3-004` | Chronicles of the Red Crown | Role-playing | Shared media mesh | $30 | Common | fantasy party beneath a monumental landmark; turquoise & sunset orange |
| `DJ3-005` | Quantum Puzzle Lab | Puzzle | Shared media mesh | $71 | Uncommon | floating geometric tiles and a glowing solution path; lime & charcoal |
| `DJ3-006` | Iron Arena HD | Fighting | Shared media mesh | $25 | Common | two rivals face off in an arena; saffron & teal |
| `DJ3-007` | Echoes of Sundown Valley | Adventure | Shared media mesh | $50 | Common | explorer at the entrance to a mysterious location; black & neon magenta |
| `DJ3-008` | Football Frenzy 3 | Sports | Shared media mesh | $20 | Common | stadium spotlights and mid-action sports equipment; blood orange & black |
| `DJ3-009` | The Republic of Ash | Strategy | Shared media mesh | $40 | Common | top-down tactical map with colored factions; sky blue & white |
| `DJ3-010` | Rhythm City All Stars | Rhythm | Shared media mesh | $15 | Common | pulsing equalizer bars and note trails; cobalt & coral |
| `DJ3-011` | The Hollow Pines | Survival Horror | Shared media mesh | $51 | Scarce | single flashlight beam in an ominous corridor; amber & navy |
| `DJ3-012` | Mega Mall Designer | Simulation | Shared media mesh | $8 | Common | isometric miniature workspace or city; violet & electric cyan |
| `DJ3-013` | The Ghost Protocol Agent | Stealth | Shared media mesh | $28 | Common | masked silhouette beneath searchlights; forest green & gold |
| `DJ3-014` | Orbital Strike 3 | Space Combat | Shared media mesh | $55 | Common | starfighters bank through an asteroid field; warm red & cream |
| `DJ3-015` | Lost Ocean Deep | Exploration | Shared media mesh | $26 | Uncommon | wide horizon with map markers; silver & deep purple |
| `DJ3-016` | Party Universe HD | Party | Shared media mesh | $45 | Common | four distinct mascot characters in a lively collage; turquoise & sunset orange |
| `DJ3-017` | Iron Knuckle Rebellion | Beat-em-up | Shared media mesh | $18 | Common | street fighters against an urban skyline; lime & charcoal |
| `DJ3-018` | Megacity Builders | Building | Shared media mesh | $38 | Common | modular structures growing across a grid; saffron & teal |
| `DJ3-019` | Tactical Vector 3 | Tactical Action | Shared media mesh | $12 | Common | squad silhouettes over a targeting-grid display; black & neon magenta |
| `DJ3-020` | Super Kart Showdown | Kart Racing | Shared media mesh | $30 | Common | small racing machines sliding through corners; blood orange & black |
| `DJ3-021` | Roguelight Odyssey | Roguelike | Shared media mesh | $60 | Common | maze entrance with relics and randomized doorways; sky blue & white |
| `DJ3-022` | Detective Blacklight | Mystery | Shared media mesh | $25 | Common | detective board, clues, and a dramatic shadow; cobalt & coral |
| `DJ3-023` | Blades of Emberfall | Action RPG | Shared media mesh | $50 | Common | armored hero confronting a towering guardian; amber & navy |
| `DJ3-024` | Pinball Planet HD | Pinball | Shared media mesh | $29 | Scarce | ball, bumpers, and glowing score indicators; violet & electric cyan |

### DiscJockie Pocket (`DJP`) — 24 games to create

**Game format:** DJ Pocket Mini Game Disc  |  **Reused hardware:** 1 mini disc model.

| SKU | New game title | Genre | PCB profile | Grade-8 reference value | Rarity | Label / loading-screen art direction |
|---|---|---|---|---:|---|---|
| `DJP-001` | Jockie Pocket Jumper | Platformer | Shared media mesh | $18 | Common | hero leaping across layered platforms; forest green & gold |
| `DJP-002` | Astro Pocket Patrol | Arcade Shooter | Shared media mesh | $38 | Common | pixel projectile streaks over hostile silhouettes; warm red & cream |
| `DJP-003` | Thumbstick Speedway | Racing | Shared media mesh | $12 | Common | angled track with speeding vehicles; silver & deep purple |
| `DJP-004` | Mini Moon Chronicles | Role-playing | Shared media mesh | $35 | Uncommon | fantasy party beneath a monumental landmark; turquoise & sunset orange |
| `DJP-005` | Puzzle Diskette | Puzzle | Shared media mesh | $71 | Uncommon | floating geometric tiles and a glowing solution path; lime & charcoal |
| `DJP-006` | Pocket Fighting Stars | Fighting | Shared media mesh | $25 | Common | two rivals face off in an arena; saffron & teal |
| `DJP-007` | The Strange Beach | Adventure | Shared media mesh | $59 | Uncommon | explorer at the entrance to a mysterious location; black & neon magenta |
| `DJP-008` | Pocket Soccer Tour | Sports | Shared media mesh | $24 | Uncommon | stadium spotlights and mid-action sports equipment; blood orange & black |
| `DJP-009` | Tiny Kingdom Campaign | Strategy | Shared media mesh | $40 | Common | top-down tactical map with colored factions; sky blue & white |
| `DJP-010` | Chiptune DJ Pocket | Rhythm | Shared media mesh | $18 | Uncommon | pulsing equalizer bars and note trails; cobalt & coral |
| `DJP-011` | Little Night Terrors | Survival Horror | Shared media mesh | $51 | Scarce | single flashlight beam in an ominous corridor; amber & navy |
| `DJP-012` | Pocket Zoo Manager | Simulation | Shared media mesh | $8 | Common | isometric miniature workspace or city; violet & electric cyan |
| `DJP-013` | Agent Mini Disc | Stealth | Shared media mesh | $28 | Common | masked silhouette beneath searchlights; forest green & gold |
| `DJP-014` | Starfighter Pocket | Space Combat | Shared media mesh | $65 | Uncommon | starfighters bank through an asteroid field; warm red & cream |
| `DJP-015` | Treasure Island Mini | Exploration | Shared media mesh | $22 | Common | wide horizon with map markers; silver & deep purple |
| `DJP-016` | Four Friends Pocket | Party | Shared media mesh | $45 | Common | four distinct mascot characters in a lively collage; turquoise & sunset orange |
| `DJP-017` | Alley Brawlers Portable | Beat-em-up | Shared media mesh | $21 | Uncommon | street fighters against an urban skyline; lime & charcoal |
| `DJP-018` | Mini Robot Shop | Building | Shared media mesh | $38 | Common | modular structures growing across a grid; saffron & teal |
| `DJP-019` | Pocket Command Assault | Tactical Action | Shared media mesh | $12 | Common | squad silhouettes over a targeting-grid display; black & neon magenta |
| `DJP-020` | Turbo Pocket Kart | Kart Racing | Shared media mesh | $30 | Common | small racing machines sliding through corners; blood orange & black |
| `DJP-021` | Rogue Island Mini | Roguelike | Shared media mesh | $60 | Common | maze entrance with relics and randomized doorways; sky blue & white |
| `DJP-022` | Detective Pocket Files | Mystery | Shared media mesh | $36 | Scarce | detective board, clues, and a dramatic shadow; cobalt & coral |
| `DJP-023` | Sword of the Micro Moon | Action RPG | Shared media mesh | $50 | Common | armored hero confronting a towering guardian; amber & navy |
| `DJP-024` | Pocket Pinball World | Pinball | Shared media mesh | $24 | Uncommon | ball, bumpers, and glowing score indicators; violet & electric cyan |

### Funstation 1 (`FS1`) — 24 games to create

**Game format:** FS1 Game Disc  |  **Reused hardware:** 1 shared full-size disc model.

| SKU | New game title | Genre | PCB profile | Grade-8 reference value | Rarity | Label / loading-screen art direction |
|---|---|---|---|---:|---|---|
| `FS1-001` | Funland Jump Club | Platformer | Shared media mesh | $18 | Common | hero leaping across layered platforms; forest green & gold |
| `FS1-002` | Space Wasps CD | Arcade Shooter | Shared media mesh | $55 | Scarce | pixel projectile streaks over hostile silhouettes; warm red & cream |
| `FS1-003` | Road Racers '97 | Racing | Shared media mesh | $12 | Common | angled track with speeding vehicles; silver & deep purple |
| `FS1-004` | Final Kingdom VIII-ish | Role-playing | Shared media mesh | $30 | Common | fantasy party beneath a monumental landmark; turquoise & sunset orange |
| `FS1-005` | Brain Block Carnival | Puzzle | Shared media mesh | $87 | Scarce | floating geometric tiles and a glowing solution path; lime & charcoal |
| `FS1-006` | Ultra Combat Heroes | Fighting | Shared media mesh | $25 | Common | two rivals face off in an arena; saffron & teal |
| `FS1-007` | The Hidden Stone Manor | Adventure | Shared media mesh | $72 | Scarce | explorer at the entrance to a mysterious location; black & neon magenta |
| `FS1-008` | International Fun Soccer | Sports | Shared media mesh | $20 | Common | stadium spotlights and mid-action sports equipment; blood orange & black |
| `FS1-009` | Age of Tiny Kingdoms | Strategy | Shared media mesh | $40 | Common | top-down tactical map with colored factions; sky blue & white |
| `FS1-010` | Dance Pad Fever | Rhythm | Shared media mesh | $22 | Scarce | pulsing equalizer bars and note trails; cobalt & coral |
| `FS1-011` | Resident Scarecrow | Survival Horror | Shared media mesh | $385 | Grail | single flashlight beam in an ominous corridor; amber & navy |
| `FS1-012` | Theme Park Mogul | Simulation | Shared media mesh | $12 | Scarce | isometric miniature workspace or city; violet & electric cyan |
| `FS1-013` | Agent Nightshade | Stealth | Shared media mesh | $28 | Common | masked silhouette beneath searchlights; forest green & gold |
| `FS1-014` | Galaxy Ace 1998 | Space Combat | Shared media mesh | $55 | Common | starfighters bank through an asteroid field; warm red & cream |
| `FS1-015` | Crystal Cave 3D | Exploration | Shared media mesh | $22 | Common | wide horizon with map markers; silver & deep purple |
| `FS1-016` | Party Disco House | Party | Shared media mesh | $45 | Common | four distinct mascot characters in a lively collage; turquoise & sunset orange |
| `FS1-017` | Street Fight Maximum | Beat-em-up | Shared media mesh | $21 | Uncommon | street fighters against an urban skyline; lime & charcoal |
| `FS1-018` | Builder City 2000 | Building | Shared media mesh | $45 | Uncommon | modular structures growing across a grid; saffron & teal |
| `FS1-019` | Tactical Strike 99 | Tactical Action | Shared media mesh | $14 | Uncommon | squad silhouettes over a targeting-grid display; black & neon magenta |
| `FS1-020` | Kart Legends Classic | Kart Racing | Shared media mesh | $30 | Common | small racing machines sliding through corners; blood orange & black |
| `FS1-021` | Rogue Castle Chronicles | Roguelike | Shared media mesh | $71 | Uncommon | maze entrance with relics and randomized doorways; sky blue & white |
| `FS1-022` | The Silent Detective | Mystery | Shared media mesh | $30 | Uncommon | detective board, clues, and a dramatic shadow; cobalt & coral |
| `FS1-023` | Swords of the Old Realm | Action RPG | Shared media mesh | $50 | Common | armored hero confronting a towering guardian; amber & navy |
| `FS1-024` | Pinball Funland | Pinball | Shared media mesh | $20 | Common | ball, bumpers, and glowing score indicators; violet & electric cyan |

### Funstation 2 (`FS2`) — 24 games to create

**Game format:** FS2 Game Disc  |  **Reused hardware:** 1 shared full-size disc model.

| SKU | New game title | Genre | PCB profile | Grade-8 reference value | Rarity | Label / loading-screen art direction |
|---|---|---|---|---:|---|---|
| `FS2-001` | Funland Heroes 2 | Platformer | Shared media mesh | $18 | Common | hero leaping across layered platforms; forest green & gold |
| `FS2-002` | Alien Outbreak CD | Arcade Shooter | Shared media mesh | $45 | Uncommon | pixel projectile streaks over hostile silhouettes; warm red & cream |
| `FS2-003` | Velocity X2 | Racing | Shared media mesh | $17 | Scarce | angled track with speeding vehicles; silver & deep purple |
| `FS2-004` | Final Kingdom X-ish | Role-playing | Shared media mesh | $30 | Common | fantasy party beneath a monumental landmark; turquoise & sunset orange |
| `FS2-005` | Mind Maze Revolution | Puzzle | Shared media mesh | $60 | Common | floating geometric tiles and a glowing solution path; lime & charcoal |
| `FS2-006` | Combat Arena 2002 | Fighting | Shared media mesh | $30 | Uncommon | two rivals face off in an arena; saffron & teal |
| `FS2-007` | The Lost Fortress | Adventure | Shared media mesh | $59 | Uncommon | explorer at the entrance to a mysterious location; black & neon magenta |
| `FS2-008` | Funstation Soccer 2004 | Sports | Shared media mesh | $24 | Uncommon | stadium spotlights and mid-action sports equipment; blood orange & black |
| `FS2-009` | Empire of the Stone Age | Strategy | Shared media mesh | $47 | Uncommon | top-down tactical map with colored factions; sky blue & white |
| `FS2-010` | Dance Revolution 2 | Rhythm | Shared media mesh | $15 | Common | pulsing equalizer bars and note trails; cobalt & coral |
| `FS2-011` | House of Hollow Faces | Survival Horror | Shared media mesh | $51 | Scarce | single flashlight beam in an ominous corridor; amber & navy |
| `FS2-012` | Resort Builder 2 | Simulation | Shared media mesh | $8 | Common | isometric miniature workspace or city; violet & electric cyan |
| `FS2-013` | Agent Nightshade Returns | Stealth | Shared media mesh | $28 | Common | masked silhouette beneath searchlights; forest green & gold |
| `FS2-014` | Interstellar Armada 2 | Space Combat | Shared media mesh | $65 | Uncommon | starfighters bank through an asteroid field; warm red & cream |
| `FS2-015` | Jungle Temple Explorer | Exploration | Shared media mesh | $22 | Common | wide horizon with map markers; silver & deep purple |
| `FS2-016` | Ultimate Party Masters | Party | Shared media mesh | $65 | Scarce | four distinct mascot characters in a lively collage; turquoise & sunset orange |
| `FS2-017` | Street Knockout 2 | Beat-em-up | Shared media mesh | $18 | Common | street fighters against an urban skyline; lime & charcoal |
| `FS2-018` | Megacity Architect | Building | Shared media mesh | $38 | Common | modular structures growing across a grid; saffron & teal |
| `FS2-019` | Operation Desert Circuit | Tactical Action | Shared media mesh | $12 | Common | squad silhouettes over a targeting-grid display; black & neon magenta |
| `FS2-020` | Turbo Kart 2003 | Kart Racing | Shared media mesh | $30 | Common | small racing machines sliding through corners; blood orange & black |
| `FS2-021` | Rogue Shadow Manor | Roguelike | Shared media mesh | $60 | Common | maze entrance with relics and randomized doorways; sky blue & white |
| `FS2-022` | The Vanishing Hotel | Mystery | Shared media mesh | $30 | Uncommon | detective board, clues, and a dramatic shadow; cobalt & coral |
| `FS2-023` | Legend of the Blue Flame | Action RPG | Shared media mesh | $50 | Common | armored hero confronting a towering guardian; amber & navy |
| `FS2-024` | Pinball Funland 2 | Pinball | Shared media mesh | $24 | Uncommon | ball, bumpers, and glowing score indicators; violet & electric cyan |

### Funstation 3 (`FS3`) — 24 games to create

**Game format:** FS3 Game Disc  |  **Reused hardware:** 1 shared full-size disc model.

| SKU | New game title | Genre | PCB profile | Grade-8 reference value | Rarity | Label / loading-screen art direction |
|---|---|---|---|---:|---|---|
| `FS3-001` | Funland Reborn | Platformer | Shared media mesh | $21 | Uncommon | hero leaping across layered platforms; forest green & gold |
| `FS3-002` | Attack of the Glass Planet | Arcade Shooter | Shared media mesh | $55 | Scarce | pixel projectile streaks over hostile silhouettes; warm red & cream |
| `FS3-003` | Coastline Velocity 3 | Racing | Shared media mesh | $17 | Scarce | angled track with speeding vehicles; silver & deep purple |
| `FS3-004` | The Last Crown Chronicles | Role-playing | Shared media mesh | $44 | Scarce | fantasy party beneath a monumental landmark; turquoise & sunset orange |
| `FS3-005` | Puzzle Machine Ultra | Puzzle | Shared media mesh | $71 | Uncommon | floating geometric tiles and a glowing solution path; lime & charcoal |
| `FS3-006` | Deadly Kombat 3 | Fighting | Shared media mesh | $25 | Common | two rivals face off in an arena; saffron & teal |
| `FS3-007` | Secrets of North Vale | Adventure | Shared media mesh | $50 | Common | explorer at the entrance to a mysterious location; black & neon magenta |
| `FS3-008` | Champion Sports 2010 | Sports | Shared media mesh | $29 | Scarce | stadium spotlights and mid-action sports equipment; blood orange & black |
| `FS3-009` | Global Conflict Command | Strategy | Shared media mesh | $40 | Common | top-down tactical map with colored factions; sky blue & white |
| `FS3-010` | Beat Wave Revolution | Rhythm | Shared media mesh | $15 | Common | pulsing equalizer bars and note trails; cobalt & coral |
| `FS3-011` | The Fog at Briar Lake | Survival Horror | Shared media mesh | $35 | Common | single flashlight beam in an ominous corridor; amber & navy |
| `FS3-012` | Metropolis Manager 3 | Simulation | Shared media mesh | $8 | Common | isometric miniature workspace or city; violet & electric cyan |
| `FS3-013` | Nightshade: Silent Mission | Stealth | Shared media mesh | $33 | Uncommon | masked silhouette beneath searchlights; forest green & gold |
| `FS3-014` | Orbital Armada HD | Space Combat | Shared media mesh | $65 | Uncommon | starfighters bank through an asteroid field; warm red & cream |
| `FS3-015` | The Forgotten Meridian | Exploration | Shared media mesh | $26 | Uncommon | wide horizon with map markers; silver & deep purple |
| `FS3-016` | Party Planet Three | Party | Shared media mesh | $53 | Uncommon | four distinct mascot characters in a lively collage; turquoise & sunset orange |
| `FS3-017` | City Riot Reign | Beat-em-up | Shared media mesh | $18 | Common | street fighters against an urban skyline; lime & charcoal |
| `FS3-018` | Planet Colony Architect | Building | Shared media mesh | $38 | Common | modular structures growing across a grid; saffron & teal |
| `FS3-019` | Strike Team Falcon | Tactical Action | Shared media mesh | $12 | Common | squad silhouettes over a targeting-grid display; black & neon magenta |
| `FS3-020` | Super Kart HD | Kart Racing | Shared media mesh | $30 | Common | small racing machines sliding through corners; blood orange & black |
| `FS3-021` | Rogue Forge 3 | Roguelike | Shared media mesh | $60 | Common | maze entrance with relics and randomized doorways; sky blue & white |
| `FS3-022` | The Missing Signal | Mystery | Shared media mesh | $25 | Common | detective board, clues, and a dramatic shadow; cobalt & coral |
| `FS3-023` | Blade of the Seven Towers | Action RPG | Shared media mesh | $50 | Common | armored hero confronting a towering guardian; amber & navy |
| `FS3-024` | Pinball Beyond | Pinball | Shared media mesh | $24 | Uncommon | ball, bumpers, and glowing score indicators; violet & electric cyan |

### Funstation 4 (`FS4`) — 24 games to create

**Game format:** FS4 Game Disc  |  **Reused hardware:** 1 shared full-size disc model.

| SKU | New game title | Genre | PCB profile | Grade-8 reference value | Rarity | Label / loading-screen art direction |
|---|---|---|---|---:|---|---|
| `FS4-001` | Funland Infinity | Platformer | Shared media mesh | $21 | Uncommon | hero leaping across layered platforms; forest green & gold |
| `FS4-002` | Void Phantom Protocol | Arcade Shooter | Shared media mesh | $38 | Common | pixel projectile streaks over hostile silhouettes; warm red & cream |
| `FS4-003` | Tidal Rally 4 | Racing | Shared media mesh | $12 | Common | angled track with speeding vehicles; silver & deep purple |
| `FS4-004` | Crown of Embers: Origins | Role-playing | Shared media mesh | $30 | Common | fantasy party beneath a monumental landmark; turquoise & sunset orange |
| `FS4-005` | Prism Puzzles 4K | Puzzle | Shared media mesh | $71 | Uncommon | floating geometric tiles and a glowing solution path; lime & charcoal |
| `FS4-006` | Steel Arena IV | Fighting | Shared media mesh | $30 | Uncommon | two rivals face off in an arena; saffron & teal |
| `FS4-007` | Nightfall Ranger: Origins | Adventure | Shared media mesh | $50 | Common | explorer at the entrance to a mysterious location; black & neon magenta |
| `FS4-008` | Pitch Perfect Soccer 24 | Sports | Shared media mesh | $44 | Very Rare | stadium spotlights and mid-action sports equipment; blood orange & black |
| `FS4-009` | Warlords of Iron Coast | Strategy | Shared media mesh | $40 | Common | top-down tactical map with colored factions; sky blue & white |
| `FS4-010` | Rhythm Nation Pulse | Rhythm | Shared media mesh | $15 | Common | pulsing equalizer bars and note trails; cobalt & coral |
| `FS4-011` | Hunters of the Hollow Moon: Prelude | Survival Horror | Shared media mesh | $51 | Scarce | single flashlight beam in an ominous corridor; amber & navy |
| `FS4-012` | Skylines Metro 4 | Simulation | Shared media mesh | $9 | Uncommon | isometric miniature workspace or city; violet & electric cyan |
| `FS4-013` | Silent Agent Nightfall | Stealth | Shared media mesh | $28 | Common | masked silhouette beneath searchlights; forest green & gold |
| `FS4-014` | Starfighter Nova 4 | Space Combat | Shared media mesh | $55 | Common | starfighters bank through an asteroid field; warm red & cream |
| `FS4-015` | Atlas Expedition | Exploration | Shared media mesh | $32 | Scarce | wide horizon with map markers; silver & deep purple |
| `FS4-016` | Party Mix Fourth | Party | Shared media mesh | $45 | Common | four distinct mascot characters in a lively collage; turquoise & sunset orange |
| `FS4-017` | Midnight Streets IV | Beat-em-up | Shared media mesh | $18 | Common | street fighters against an urban skyline; lime & charcoal |
| `FS4-018` | Architecture World 4 | Building | Shared media mesh | $38 | Common | modular structures growing across a grid; saffron & teal |
| `FS4-019` | Tactical Ops Resurgence | Tactical Action | Shared media mesh | $14 | Uncommon | squad silhouettes over a targeting-grid display; black & neon magenta |
| `FS4-020` | Kart Smash World Tour | Kart Racing | Shared media mesh | $30 | Common | small racing machines sliding through corners; blood orange & black |
| `FS4-021` | Rogue Worlds: Outlands | Roguelike | Shared media mesh | $105 | Rare | maze entrance with relics and randomized doorways; sky blue & white |
| `FS4-022` | The Glasshouse Mystery | Mystery | Shared media mesh | $30 | Uncommon | detective board, clues, and a dramatic shadow; cobalt & coral |
| `FS4-023` | Runeblade Ascendant | Action RPG | Shared media mesh | $50 | Common | armored hero confronting a towering guardian; amber & navy |
| `FS4-024` | Pinball Dimension 4 | Pinball | Shared media mesh | $20 | Common | ball, bumpers, and glowing score indicators; violet & electric cyan |

### Funstation 5 (`FS5`) — 19 games to create

**Game format:** FS5 Game Disc  |  **Reused hardware:** 1 shared full-size disc model.

| SKU | New game title | Genre | PCB profile | Grade-8 reference value | Rarity | Label / loading-screen art direction |
|---|---|---|---|---:|---|---|
| `FS5-006` | Funland Infinite Horizons | Platformer | Shared media mesh | $18 | Common | hero leaping across layered platforms; saffron & teal |
| `FS5-007` | Void Phantom: Ascension | Arcade Shooter | Shared media mesh | $45 | Uncommon | pixel projectile streaks over hostile silhouettes; black & neon magenta |
| `FS5-008` | Prism Protocol VR | Puzzle | Shared media mesh | $17 | Scarce | floating geometric tiles and a glowing solution path; blood orange & black |
| `FS5-009` | Titan Arena V | Fighting | Shared media mesh | $30 | Common | two rivals face off in an arena; sky blue & white |
| `FS5-010` | Mapmaker of the Far Realms | Exploration | Shared media mesh | $60 | Common | wide horizon with map markers; cobalt & coral |
| `FS5-011` | Empire: New Dawn | Strategy | Shared media mesh | $25 | Common | top-down tactical map with colored factions; amber & navy |
| `FS5-012` | Bassline Revolution V | Rhythm | Shared media mesh | $50 | Common | pulsing equalizer bars and note trails; violet & electric cyan |
| `FS5-013` | The Wintermere Incident | Survival Horror | Shared media mesh | $24 | Uncommon | single flashlight beam in an ominous corridor; forest green & gold |
| `FS5-014` | Metropolis 5 Architect | Building | Shared media mesh | $47 | Uncommon | modular structures growing across a grid; warm red & cream |
| `FS5-015` | Agent Nightshade: Eclipse | Stealth | Shared media mesh | $18 | Uncommon | masked silhouette beneath searchlights; silver & deep purple |
| `FS5-016` | Starlight Armada Five | Space Combat | Shared media mesh | $41 | Uncommon | starfighters bank through an asteroid field; turquoise & sunset orange |
| `FS5-017` | Deepwater Expedition | Exploration | Shared media mesh | $8 | Common | wide horizon with map markers; lime & charcoal |
| `FS5-018` | Living Room Party Deluxe | Party | Shared media mesh | $28 | Common | four distinct mascot characters in a lively collage; saffron & teal |
| `FS5-019` | Riot Street 5 | Beat-em-up | Shared media mesh | $55 | Common | street fighters against an urban skyline; black & neon magenta |
| `FS5-020` | Tactical Strike: Blackout | Tactical Action | Shared media mesh | $22 | Common | squad silhouettes over a targeting-grid display; blood orange & black |
| `FS5-021` | Super Kart Galaxy | Kart Racing | Shared media mesh | $53 | Uncommon | small racing machines sliding through corners; sky blue & white |
| `FS5-022` | Rogue Circuit | Roguelike | Shared media mesh | $18 | Common | maze entrance with relics and randomized doorways; cobalt & coral |
| `FS5-023` | The Marble Door | Mystery | Shared media mesh | $38 | Common | detective board, clues, and a dramatic shadow; amber & navy |
| `FS5-024` | Sword of Embers: Reign | Action RPG | Shared media mesh | $14 | Uncommon | armored hero confronting a towering guardian; violet & electric cyan |

### Sbox 1 (`SB1`) — 24 games to create

**Game format:** SB1 Game Disc  |  **Reused hardware:** 1 shared full-size disc model.

| SKU | New game title | Genre | PCB profile | Grade-8 reference value | Rarity | Label / loading-screen art direction |
|---|---|---|---|---:|---|---|
| `SB1-001` | Boxwood Platform Panic | Platformer | Shared media mesh | $21 | Uncommon | hero leaping across layered platforms; forest green & gold |
| `SB1-002` | Alien Box Attack | Arcade Shooter | Shared media mesh | $66 | Rare | pixel projectile streaks over hostile silhouettes; warm red & cream |
| `SB1-003` | Street Heat Motorway | Racing | Shared media mesh | $17 | Scarce | angled track with speeding vehicles; silver & deep purple |
| `SB1-004` | Legends of the First Box | Role-playing | Shared media mesh | $30 | Common | fantasy party beneath a monumental landmark; turquoise & sunset orange |
| `SB1-005` | Brain Puzzle Unlocked | Puzzle | Shared media mesh | $71 | Uncommon | floating geometric tiles and a glowing solution path; lime & charcoal |
| `SB1-006` | Combat Xtreme | Fighting | Shared media mesh | $30 | Uncommon | two rivals face off in an arena; saffron & teal |
| `SB1-007` | Island of the Lost Engineer | Adventure | Shared media mesh | $50 | Common | explorer at the entrance to a mysterious location; black & neon magenta |
| `SB1-008` | Sunday Soccer Night | Sports | Shared media mesh | $24 | Uncommon | stadium spotlights and mid-action sports equipment; blood orange & black |
| `SB1-009` | Civilization of Sprockets | Strategy | Shared media mesh | $47 | Uncommon | top-down tactical map with colored factions; sky blue & white |
| `SB1-010` | Box Beats Party | Rhythm | Shared media mesh | $15 | Common | pulsing equalizer bars and note trails; cobalt & coral |
| `SB1-011` | The Dark Warehouse | Survival Horror | Shared media mesh | $35 | Common | single flashlight beam in an ominous corridor; amber & navy |
| `SB1-012` | Industrial City Manager | Simulation | Shared media mesh | $8 | Common | isometric miniature workspace or city; violet & electric cyan |
| `SB1-013` | Undercover Agent Brick | Stealth | Shared media mesh | $28 | Common | masked silhouette beneath searchlights; forest green & gold |
| `SB1-014` | Starhunter Alpha | Space Combat | Shared media mesh | $55 | Common | starfighters bank through an asteroid field; warm red & cream |
| `SB1-015` | Lost Planet Survey | Exploration | Shared media mesh | $22 | Common | wide horizon with map markers; silver & deep purple |
| `SB1-016` | Four Player Box Bash | Party | Shared media mesh | $65 | Scarce | four distinct mascot characters in a lively collage; turquoise & sunset orange |
| `SB1-017` | Suburb Street Fight | Beat-em-up | Shared media mesh | $21 | Uncommon | street fighters against an urban skyline; lime & charcoal |
| `SB1-018` | Construction Crew One | Building | Shared media mesh | $55 | Scarce | modular structures growing across a grid; saffron & teal |
| `SB1-019` | Steel Squad Combat | Tactical Action | Shared media mesh | $17 | Scarce | squad silhouettes over a targeting-grid display; black & neon magenta |
| `SB1-020` | Kart Crushers One | Kart Racing | Shared media mesh | $52 | Rare | small racing machines sliding through corners; blood orange & black |
| `SB1-021` | Rogue Dungeon Classic | Roguelike | Shared media mesh | $60 | Common | maze entrance with relics and randomized doorways; sky blue & white |
| `SB1-022` | The Odd Evidence | Mystery | Shared media mesh | $25 | Common | detective board, clues, and a dramatic shadow; cobalt & coral |
| `SB1-023` | Knightfall Unplugged | Action RPG | Shared media mesh | $50 | Common | armored hero confronting a towering guardian; amber & navy |
| `SB1-024` | Pinball Box Classic | Pinball | Shared media mesh | $20 | Common | ball, bumpers, and glowing score indicators; violet & electric cyan |

### Sbox 2 (`SB2`) — 24 games to create

**Game format:** SB2 Game Disc  |  **Reused hardware:** 1 shared full-size disc model.

| SKU | New game title | Genre | PCB profile | Grade-8 reference value | Rarity | Label / loading-screen art direction |
|---|---|---|---|---:|---|---|
| `SB2-001` | Platform Trouble 2 | Platformer | Shared media mesh | $21 | Uncommon | hero leaping across layered platforms; forest green & gold |
| `SB2-002` | Alien Box Attack II | Arcade Shooter | Shared media mesh | $38 | Common | pixel projectile streaks over hostile silhouettes; warm red & cream |
| `SB2-003` | Midnight Drift 2 | Racing | Shared media mesh | $12 | Common | angled track with speeding vehicles; silver & deep purple |
| `SB2-004` | Legends of the Second Box | Role-playing | Shared media mesh | $44 | Scarce | fantasy party beneath a monumental landmark; turquoise & sunset orange |
| `SB2-005` | Puzzle Lock 2 | Puzzle | Shared media mesh | $105 | Rare | floating geometric tiles and a glowing solution path; lime & charcoal |
| `SB2-006` | Combat Xtreme Reloaded | Fighting | Shared media mesh | $44 | Rare | two rivals face off in an arena; saffron & teal |
| `SB2-007` | Island of the Broken Compass | Adventure | Shared media mesh | $50 | Common | explorer at the entrance to a mysterious location; black & neon magenta |
| `SB2-008` | Super League Soccer 2 | Sports | Shared media mesh | $24 | Uncommon | stadium spotlights and mid-action sports equipment; blood orange & black |
| `SB2-009` | War Machine 2002 | Strategy | Shared media mesh | $47 | Uncommon | top-down tactical map with colored factions; sky blue & white |
| `SB2-010` | Beat Box Revolution | Rhythm | Shared media mesh | $15 | Common | pulsing equalizer bars and note trails; cobalt & coral |
| `SB2-011` | Horror at Hollow Mill | Survival Horror | Shared media mesh | $41 | Uncommon | single flashlight beam in an ominous corridor; amber & navy |
| `SB2-012` | Metro Manager 2002 | Simulation | Shared media mesh | $8 | Common | isometric miniature workspace or city; violet & electric cyan |
| `SB2-013` | Agent Brick Returns | Stealth | Shared media mesh | $28 | Common | masked silhouette beneath searchlights; forest green & gold |
| `SB2-014` | Starhunter Beta | Space Combat | Shared media mesh | $55 | Common | starfighters bank through an asteroid field; warm red & cream |
| `SB2-015` | Deep Space Colonist | Exploration | Shared media mesh | $22 | Common | wide horizon with map markers; silver & deep purple |
| `SB2-016` | Party Box 2 | Party | Shared media mesh | $45 | Common | four distinct mascot characters in a lively collage; turquoise & sunset orange |
| `SB2-017` | Backstreet Blitz | Beat-em-up | Shared media mesh | $21 | Uncommon | street fighters against an urban skyline; lime & charcoal |
| `SB2-018` | Factory Lines 2 | Building | Shared media mesh | $38 | Common | modular structures growing across a grid; saffron & teal |
| `SB2-019` | Squad Commander 2 | Tactical Action | Shared media mesh | $14 | Uncommon | squad silhouettes over a targeting-grid display; black & neon magenta |
| `SB2-020` | Kart Crushers 2 | Kart Racing | Shared media mesh | $44 | Scarce | small racing machines sliding through corners; blood orange & black |
| `SB2-021` | Crypt Rogue II | Roguelike | Shared media mesh | $60 | Common | maze entrance with relics and randomized doorways; sky blue & white |
| `SB2-022` | The Missing Witness | Mystery | Shared media mesh | $25 | Common | detective board, clues, and a dramatic shadow; cobalt & coral |
| `SB2-023` | Swords of Steelgate | Action RPG | Shared media mesh | $50 | Common | armored hero confronting a towering guardian; amber & navy |
| `SB2-024` | Pinball Box Double | Pinball | Shared media mesh | $20 | Common | ball, bumpers, and glowing score indicators; violet & electric cyan |

### Sbox 720 (`SB720`) — 24 games to create

**Game format:** SB720 Game Disc  |  **Reused hardware:** 1 shared full-size disc model.

| SKU | New game title | Genre | PCB profile | Grade-8 reference value | Rarity | Label / loading-screen art direction |
|---|---|---|---|---:|---|---|
| `SB720-001` | Seven-Twenty Skaters | Platformer | Shared media mesh | $26 | Uncommon | hero leaping across layered platforms; silver & deep purple |
| `SB720-002` | Alien Breach 720 | Arcade Shooter | Shared media mesh | $45 | Common | pixel projectile streaks over hostile silhouettes; turquoise & sunset orange |
| `SB720-003` | Apex Drift 720 | Racing | Shared media mesh | $18 | Common | angled track with speeding vehicles; lime & charcoal |
| `SB720-004` | Ironclad Frontier: Beginnings | Role-playing | Shared media mesh | $420 | Grail | fantasy party beneath a monumental landmark; saffron & teal |
| `SB720-005` | Puzzle Horizon 720 | Puzzle | Shared media mesh | $12 | Common | floating geometric tiles and a glowing solution path; black & neon magenta |
| `SB720-006` | Arena Mayhem 720 | Fighting | Shared media mesh | $30 | Common | two rivals face off in an arena; blood orange & black |
| `SB720-007` | Zombie Harvest Origins | Adventure | Shared media mesh | $105 | Rare | explorer at the entrance to a mysterious location; sky blue & white |
| `SB720-008` | Super League 720 | Sports | Shared media mesh | $30 | Uncommon | stadium spotlights and mid-action sports equipment; cobalt & coral |
| `SB720-009` | Galactic Empire 720 | Strategy | Shared media mesh | $59 | Uncommon | top-down tactical map with colored factions; amber & navy |
| `SB720-010` | Turntable Heroes | Rhythm | Shared media mesh | $29 | Scarce | pulsing equalizer bars and note trails; violet & electric cyan |
| `SB720-011` | Dead Night Shift | Survival Horror | Shared media mesh | $40 | Common | single flashlight beam in an ominous corridor; forest green & gold |
| `SB720-012` | Downtown City Planner | Simulation | Shared media mesh | $18 | Uncommon | isometric miniature workspace or city; warm red & cream |
| `SB720-013` | Agent Shadowbox 720 | Stealth | Shared media mesh | $35 | Common | masked silhouette beneath searchlights; silver & deep purple |
| `SB720-014` | Starfarer: First Contact | Space Combat | Shared media mesh | $9 | Uncommon | starfighters bank through an asteroid field; turquoise & sunset orange |
| `SB720-015` | Desert Excavation 720 | Exploration | Shared media mesh | $28 | Common | wide horizon with map markers; lime & charcoal |
| `SB720-016` | Seven-Twenty Party | Party | Shared media mesh | $80 | Scarce | four distinct mascot characters in a lively collage; saffron & teal |
| `SB720-017` | Underground Brawl 720 | Beat-em-up | Shared media mesh | $22 | Common | street fighters against an urban skyline; black & neon magenta |
| `SB720-018` | Mega Factory 720 | Building | Shared media mesh | $45 | Common | modular structures growing across a grid; blood orange & black |
| `SB720-019` | Strike Force 720 | Tactical Action | Shared media mesh | $21 | Uncommon | squad silhouettes over a targeting-grid display; sky blue & white |
| `SB720-020` | Kart Crushers 720 | Kart Racing | Shared media mesh | $38 | Common | small racing machines sliding through corners; cobalt & coral |
| `SB720-021` | Rogue City 720 | Roguelike | Shared media mesh | $12 | Common | maze entrance with relics and randomized doorways; amber & navy |
| `SB720-022` | Detective Dead End | Mystery | Shared media mesh | $44 | Scarce | detective board, clues, and a dramatic shadow; violet & electric cyan |
| `SB720-023` | Steelblade 720 | Action RPG | Shared media mesh | $60 | Common | armored hero confronting a towering guardian; forest green & gold |
| `SB720-024` | Pinball X720 | Pinball | Shared media mesh | $30 | Uncommon | ball, bumpers, and glowing score indicators; warm red & cream |

### Sbox 10 (`SB10`) — 24 games to create

**Game format:** SB10 Game Disc  |  **Reused hardware:** 1 shared full-size disc model.

| SKU | New game title | Genre | PCB profile | Grade-8 reference value | Rarity | Label / loading-screen art direction |
|---|---|---|---|---:|---|---|
| `SB10-001` | Boxwood Legends Ten | Platformer | Shared media mesh | $20 | Common | hero leaping across layered platforms; warm red & cream |
| `SB10-002` | Alien Breach X | Arcade Shooter | Shared media mesh | $70 | Rare | pixel projectile streaks over hostile silhouettes; silver & deep purple |
| `SB10-003` | Apex Drift Ten | Racing | Shared media mesh | $15 | Common | angled track with speeding vehicles; turquoise & sunset orange |
| `SB10-004` | Ironclad Frontier 2 | Role-playing | Shared media mesh | $35 | Common | fantasy party beneath a monumental landmark; lime & charcoal |
| `SB10-005` | Hex Logic 10 | Puzzle | Shared media mesh | $12 | Scarce | floating geometric tiles and a glowing solution path; saffron & teal |
| `SB10-006` | Arena Mayhem X | Fighting | Shared media mesh | $33 | Uncommon | two rivals face off in an arena; black & neon magenta |
| `SB10-007` | Zombie Harvest 2 | Adventure | Shared media mesh | $55 | Common | explorer at the entrance to a mysterious location; blood orange & black |
| `SB10-008` | Blitz Arena 2024 | Sports | Shared media mesh | $26 | Uncommon | stadium spotlights and mid-action sports equipment; sky blue & white |
| `SB10-009` | Starfarer: Frontier | Strategy | Shared media mesh | $45 | Common | top-down tactical map with colored factions; cobalt & coral |
| `SB10-010` | Beat Box X | Rhythm | Shared media mesh | $21 | Uncommon | pulsing equalizer bars and note trails; amber & navy |
| `SB10-011` | Dead Night Shift 2 | Survival Horror | Shared media mesh | $66 | Rare | single flashlight beam in an ominous corridor; violet & electric cyan |
| `SB10-012` | Downtown Planner X | Simulation | Shared media mesh | $12 | Common | isometric miniature workspace or city; forest green & gold |
| `SB10-013` | Agent Blackbox | Stealth | Shared media mesh | $35 | Uncommon | masked silhouette beneath searchlights; warm red & cream |
| `SB10-014` | Galaxy Assault X | Space Combat | Shared media mesh | $71 | Uncommon | starfighters bank through an asteroid field; silver & deep purple |
| `SB10-015` | Explorer of New Earth | Exploration | Shared media mesh | $30 | Uncommon | wide horizon with map markers; turquoise & sunset orange |
| `SB10-016` | Party Box X | Party | Shared media mesh | $50 | Common | four distinct mascot characters in a lively collage; lime & charcoal |
| `SB10-017` | Street Rumble X | Beat-em-up | Shared media mesh | $24 | Uncommon | street fighters against an urban skyline; saffron & teal |
| `SB10-018` | Mega Factory X | Building | Shared media mesh | $40 | Common | modular structures growing across a grid; black & neon magenta |
| `SB10-019` | Strike Force Ten | Tactical Action | Shared media mesh | $18 | Uncommon | squad silhouettes over a targeting-grid display; blood orange & black |
| `SB10-020` | Kart Crushers X | Kart Racing | Shared media mesh | $41 | Uncommon | small racing machines sliding through corners; sky blue & white |
| `SB10-021` | Rogue Machine X | Roguelike | Shared media mesh | $9 | Uncommon | maze entrance with relics and randomized doorways; cobalt & coral |
| `SB10-022` | Detective Night Market | Mystery | Shared media mesh | $28 | Common | detective board, clues, and a dramatic shadow; amber & navy |
| `SB10-023` | Steelblade: Reforged | Action RPG | Shared media mesh | $65 | Uncommon | armored hero confronting a towering guardian; violet & electric cyan |
| `SB10-024` | Pinball Universe X | Pinball | Shared media mesh | $22 | Common | ball, bumpers, and glowing score indicators; forest green & gold |

### Sbox S (`SBS`) — 24 games to create

**Game format:** SBS Game Disc  |  **Reused hardware:** 1 shared full-size disc model.

| SKU | New game title | Genre | PCB profile | Grade-8 reference value | Rarity | Label / loading-screen art direction |
|---|---|---|---|---:|---|---|
| `SBS-001` | Short Box Adventure | Platformer | Shared media mesh | $26 | Scarce | hero leaping across layered platforms; forest green & gold |
| `SBS-002` | Space Invader S | Arcade Shooter | Shared media mesh | $66 | Rare | pixel projectile streaks over hostile silhouettes; warm red & cream |
| `SBS-003` | Apex Drift: Street Edition | Racing | Shared media mesh | $14 | Uncommon | angled track with speeding vehicles; silver & deep purple |
| `SBS-004` | Ironclad Frontier Compact | Role-playing | Shared media mesh | $35 | Uncommon | fantasy party beneath a monumental landmark; turquoise & sunset orange |
| `SBS-005` | Pocket Puzzle Planet S | Puzzle | Shared media mesh | $87 | Scarce | floating geometric tiles and a glowing solution path; lime & charcoal |
| `SBS-006` | Arena Quickplay S | Fighting | Shared media mesh | $30 | Uncommon | two rivals face off in an arena; saffron & teal |
| `SBS-007` | Zombie Harvest: Side Streets | Adventure | Shared media mesh | $50 | Common | explorer at the entrance to a mysterious location; black & neon magenta |
| `SBS-008` | Blitz Arena S | Sports | Shared media mesh | $24 | Uncommon | stadium spotlights and mid-action sports equipment; blood orange & black |
| `SBS-009` | Starfarer: Outpost | Strategy | Shared media mesh | $40 | Common | top-down tactical map with colored factions; sky blue & white |
| `SBS-010` | Rhythm Rush S | Rhythm | Shared media mesh | $15 | Common | pulsing equalizer bars and note trails; cobalt & coral |
| `SBS-011` | After Midnight Shelter | Survival Horror | Shared media mesh | $35 | Common | single flashlight beam in an ominous corridor; amber & navy |
| `SBS-012` | Little City Sandbox | Simulation | Shared media mesh | $9 | Uncommon | isometric miniature workspace or city; violet & electric cyan |
| `SBS-013` | Agent Side Mission | Stealth | Shared media mesh | $28 | Common | masked silhouette beneath searchlights; forest green & gold |
| `SBS-014` | Satellite Squadron S | Space Combat | Shared media mesh | $55 | Common | starfighters bank through an asteroid field; warm red & cream |
| `SBS-015` | Lost Station S | Exploration | Shared media mesh | $22 | Common | wide horizon with map markers; silver & deep purple |
| `SBS-016` | Couch Co-op Carnival | Party | Shared media mesh | $45 | Common | four distinct mascot characters in a lively collage; turquoise & sunset orange |
| `SBS-017` | Street Brawl S | Beat-em-up | Shared media mesh | $26 | Scarce | street fighters against an urban skyline; lime & charcoal |
| `SBS-018` | Modular City Builder | Building | Shared media mesh | $45 | Uncommon | modular structures growing across a grid; saffron & teal |
| `SBS-019` | Strike Squad S | Tactical Action | Shared media mesh | $14 | Uncommon | squad silhouettes over a targeting-grid display; black & neon magenta |
| `SBS-020` | Mini Kart Legends | Kart Racing | Shared media mesh | $30 | Common | small racing machines sliding through corners; blood orange & black |
| `SBS-021` | Rogue Byte S | Roguelike | Shared media mesh | $87 | Scarce | maze entrance with relics and randomized doorways; sky blue & white |
| `SBS-022` | Detective Minute Mystery | Mystery | Shared media mesh | $30 | Uncommon | detective board, clues, and a dramatic shadow; cobalt & coral |
| `SBS-023` | Knightlight S | Action RPG | Shared media mesh | $50 | Common | armored hero confronting a towering guardian; amber & navy |
| `SBS-024` | Pinball Anywhere | Pinball | Shared media mesh | $20 | Common | ball, bumpers, and glowing score indicators; violet & electric cyan |

### Sbox One X (`SB1X`) — 19 games to create

**Game format:** SB1X Game Disc  |  **Reused hardware:** 1 shared full-size disc model.

| SKU | New game title | Genre | PCB profile | Grade-8 reference value | Rarity | Label / loading-screen art direction |
|---|---|---|---|---:|---|---|
| `SB1X-006` | Boxwood Hyperjump | Platformer | Shared media mesh | $24 | Uncommon | hero leaping across layered platforms; black & neon magenta |
| `SB1X-007` | Alien Breach: Extinction | Arcade Shooter | Shared media mesh | $47 | Uncommon | pixel projectile streaks over hostile silhouettes; blood orange & black |
| `SB1X-008` | Puzzle Horizon Infinite | Puzzle | Shared media mesh | $15 | Common | floating geometric tiles and a glowing solution path; sky blue & white |
| `SB1X-009` | Arena Mayhem Ultimate | Fighting | Shared media mesh | $35 | Common | two rivals face off in an arena; cobalt & coral |
| `SB1X-010` | Rise of the Broken Compass | Adventure | Shared media mesh | $8 | Common | explorer at the entrance to a mysterious location; amber & navy |
| `SB1X-011` | Age of the Iron Empires | Strategy | Shared media mesh | $28 | Common | top-down tactical map with colored factions; violet & electric cyan |
| `SB1X-012` | Bassline Rebellion X | Rhythm | Shared media mesh | $55 | Common | pulsing equalizer bars and note trails; forest green & gold |
| `SB1X-013` | The Signal Below | Survival Horror | Shared media mesh | $38 | Rare | single flashlight beam in an ominous corridor; warm red & cream |
| `SB1X-014` | Megacity Architect X | Building | Shared media mesh | $45 | Common | modular structures growing across a grid; silver & deep purple |
| `SB1X-015` | Agent Shadowbox: Final Hour | Stealth | Shared media mesh | $32 | Rare | masked silhouette beneath searchlights; turquoise & sunset orange |
| `SB1X-016` | Galaxy Assault One X | Space Combat | Shared media mesh | $45 | Uncommon | starfighters bank through an asteroid field; lime & charcoal |
| `SB1X-017` | Beyond the Polar Sea | Exploration | Shared media mesh | $12 | Common | wide horizon with map markers; saffron & teal |
| `SB1X-018` | Party Box One X | Party | Shared media mesh | $35 | Uncommon | four distinct mascot characters in a lively collage; black & neon magenta |
| `SB1X-019` | Suburb Street Fight X | Beat-em-up | Shared media mesh | $87 | Scarce | street fighters against an urban skyline; blood orange & black |
| `SB1X-020` | Strike Force One X | Tactical Action | Shared media mesh | $25 | Common | squad silhouettes over a targeting-grid display; sky blue & white |
| `SB1X-021` | Kart Crushers Infinite | Kart Racing | Shared media mesh | $72 | Scarce | small racing machines sliding through corners; cobalt & coral |
| `SB1X-022` | Rogue Sector 9 | Roguelike | Shared media mesh | $20 | Common | maze entrance with relics and randomized doorways; amber & navy |
| `SB1X-023` | The Last Witness | Mystery | Shared media mesh | $40 | Common | detective board, clues, and a dramatic shadow; violet & electric cyan |
| `SB1X-024` | Blades of Steelgate X | Action RPG | Shared media mesh | $26 | Rare | armored hero confronting a towering guardian; forest green & gold |

### Bintendo Pyramid (`PYRAMID`) — 24 games to create

**Game format:** Bintendo Mini-Disc  |  **Reused hardware:** 1 mini disc model.

| SKU | New game title | Genre | PCB profile | Grade-8 reference value | Rarity | Label / loading-screen art direction |
|---|---|---|---|---:|---|---|
| `PYRAMID-001` | Pyramid Plumber Quest | Platformer | Shared media mesh | $28 | Common | hero leaping across layered platforms; lime & charcoal |
| `PYRAMID-002` | Starlight Duck Defender | Arcade Shooter | Shared media mesh | $55 | Common | pixel projectile streaks over hostile silhouettes; saffron & teal |
| `PYRAMID-003` | Kart of the Sphinx | Racing | Shared media mesh | $32 | Scarce | angled track with speeding vehicles; black & neon magenta |
| `PYRAMID-004` | Pyramid of the Lost Crown | Role-playing | Shared media mesh | $315 | Grail | fantasy party beneath a monumental landmark; blood orange & black |
| `PYRAMID-005` | Tomb Tile Puzzle | Puzzle | Shared media mesh | $18 | Common | floating geometric tiles and a glowing solution path; sky blue & white |
| `PYRAMID-006` | Sandstorm Fighter | Fighting | Shared media mesh | $38 | Common | two rivals face off in an arena; cobalt & coral |
| `PYRAMID-007` | The Secret Pyramid Chamber | Adventure | Shared media mesh | $14 | Uncommon | explorer at the entrance to a mysterious location; amber & navy |
| `PYRAMID-008` | Desert Cup Soccer | Sports | Shared media mesh | $30 | Common | stadium spotlights and mid-action sports equipment; violet & electric cyan |
| `PYRAMID-009` | Tiny Pharaoh Tactics | Strategy | Shared media mesh | $71 | Uncommon | top-down tactical map with colored factions; forest green & gold |
| `PYRAMID-010` | Dance of the Scarab | Rhythm | Shared media mesh | $25 | Common | pulsing equalizer bars and note trails; warm red & cream |
| `PYRAMID-011` | The Mummy Next Door | Survival Horror | Shared media mesh | $50 | Common | single flashlight beam in an ominous corridor; silver & deep purple |
| `PYRAMID-012` | Ancient City Builder | Simulation | Shared media mesh | $35 | Rare | isometric miniature workspace or city; turquoise & sunset orange |
| `PYRAMID-013` | Agent Sphinx 007ish | Stealth | Shared media mesh | $70 | Rare | masked silhouette beneath searchlights; lime & charcoal |
| `PYRAMID-014` | Sands of the Solar Fleet | Space Combat | Shared media mesh | $15 | Common | starfighters bank through an asteroid field; saffron & teal |
| `PYRAMID-015` | Temple Map Explorers | Exploration | Shared media mesh | $35 | Common | wide horizon with map markers; black & neon magenta |
| `PYRAMID-016` | Pyramid Party Deluxe | Party | Shared media mesh | $9 | Uncommon | four distinct mascot characters in a lively collage; blood orange & black |
| `PYRAMID-017` | Cairo Street Brawlers | Beat-em-up | Shared media mesh | $28 | Common | street fighters against an urban skyline; sky blue & white |
| `PYRAMID-018` | Build a Wonder | Building | Shared media mesh | $121 | Very Rare | modular structures growing across a grid; cobalt & coral |
| `PYRAMID-019` | Desert Commando | Tactical Action | Shared media mesh | $32 | Scarce | squad silhouettes over a targeting-grid display; amber & navy |
| `PYRAMID-020` | Pharaoh Kart Frenzy | Kart Racing | Shared media mesh | $45 | Common | small racing machines sliding through corners; violet & electric cyan |
| `PYRAMID-021` | Rogue Tomb Raiders | Roguelike | Shared media mesh | $21 | Uncommon | maze entrance with relics and randomized doorways; forest green & gold |
| `PYRAMID-022` | The Sphinx Files | Mystery | Shared media mesh | $38 | Common | detective board, clues, and a dramatic shadow; warm red & cream |
| `PYRAMID-023` | Sword of the Sun Temple | Action RPG | Shared media mesh | $12 | Common | armored hero confronting a towering guardian; silver & deep purple |
| `PYRAMID-024` | Pinball of the Ancients | Pinball | Shared media mesh | $30 | Common | ball, bumpers, and glowing score indicators; turquoise & sunset orange |


## 5A. VERSION 3 ADDITIONS — 700 MORE GAME RELEASES TO CREATE

This is a **supplemental creation list**: add these 25 new game SKUs to *each* of the 28 media families already listed in Section 5. Do not replace or rename the 696 Version 2 records. These 700 SKUs are all **Needs Created**, so the combined creation backlog is 1,362, with 34 **Already Created** names preserved. Each family now has 49 or 53 native titles. Existing 45 cartridge PCB meshes, disc/card meshes, printed factory revisions and board fault profiles are unchanged. Reused game names on different platforms are intentional ports.

The main machine-readable list is `Bench_Tech_Game_Library_1396_SKUs_Expanded.csv`, which has all 1,396 entries, not just this supplement.


### Bintendo Entertainment System (`BES`) — 25 additional titles, 53 total

**Native media:** BES Game Pak. **Base game media mesh:** Existing 5 cartridge PCB layouts and fixed silkscreen revisions.

| SKU | Additional game title | Genre | PCB / printed factory revision | Grade-8 reference | Rarity | Label and boot-art seed |
|---|---|---|---|---:|---|---|
| `BES-029` | Plumber Panic: The Lost Valve | Platformer | `BES-V1.483` | $38 | **Common** | Plumber Panic:  Lost Valve: towering platforms, animated hazards and a small determined hero; electric yellow / deep indigo |
| `BES-030` | Robo Raccoon Rumble | Platformer | `BES-V2.216` | $10 | **Common** | Robo Raccoon Rumble: towering platforms, animated hazards and a small determined hero; sky blue / aubergine |
| `BES-031` | Starlight Skater | Platformer | `BES-V3.734` | $34 | **Scarce** | Starlight Skater: towering platforms, animated hazards and a small determined hero; silver / violet |
| `BES-032` | The Sorcerer's Lunchbox | Action Adventure | `BES-V4.106` | $36 | **Common** | Sorcerer's Lunchbox: hero confronting the central artifact or enemy; ice blue / charcoal |
| `BES-033` | Dungeons and Doughnuts | Action Adventure | `BES-V1.117` | $31 | **Common** | Dungeons  Doughnuts: hero confronting the central artifact or enemy; electric yellow / deep indigo |
| `BES-034` | Ninja Garden Patrol | Simulation | `BES-V3.734` | $9 | **Common** | Ninja Garden Patrol: cutaway miniature world with controllable systems; rose / cobalt |
| `BES-035` | Motor City Moped Madness | Racing | `BES-V2.216` | $22 | **Common** | Motor City Moped Madness: leaning racing machines on a dramatic bend; moss green / antique ivory |
| `BES-036` | Pixel Pirates of Port Soggy | Platformer | `BES-V3.734` | $56 | **Uncommon** | Pixel Pirates  Port Soggy: towering platforms, animated hazards and a small determined hero; moss green / antique ivory |
| `BES-037` | Dr. Button's Virus Panic | Action Adventure | `BES-V4.106` | $79 | **Scarce** | Dr. Button's Virus Panic: hero confronting the central artifact or enemy; moss green / antique ivory |
| `BES-038` | Ghosts in the Attic | Survival Horror | `BES-V1.117` | $78 | **Scarce** | Ghosts   Attic: ominous abandoned location illuminated by one lamp; ice blue / charcoal |
| `BES-039` | Caveman Karaoke | Rhythm | `BES-V1.483` | $53 | **Scarce** | Caveman Karaoke: booming sound waves, stage lights, and musical controls; lime / navy |
| `BES-040` | Steel Beetle Brigade | Action Adventure | `BES-V2.216` | $69 | **Scarce** | Steel Beetle Brigade: hero confronting the central artifact or enemy; silver / violet |
| `BES-041` | The Great Gravy Escape | Action Adventure | `BES-V3.734` | $117 | **Very Rare** | Great Gravy Escape: hero confronting the central artifact or enemy; silver / violet |
| `BES-042` | Moonbase Custodian | Space Combat | `BES-V4.106` | $39 | **Common** | Moonbase Custodian: ships threading through glowing debris and laser fire; amber / obsidian |
| `BES-043` | Castle of the Nine Keys | Action Adventure | `BES-V1.117` | $10 | **Common** | Castle   Nine Keys: hero confronting the central artifact or enemy; neon cyan / purple |
| `BES-044` | Paper Airplane Squadron | Strategy | `BES-V3.734` | $12 | **Common** | Paper Airplane Squadron: miniature armies on a map with a commander silhouette; moss green / antique ivory |
| `BES-045` | Quest for the Brass Key | Role-playing | `BES-V4.106` | $22 | **Common** | Quest   Brass Key: a party facing a mysterious citadel; jade / parchment |
| `BES-046` | Tiny Submarine Commander | Strategy | `BES-V3.734` | $42 | **Common** | Tiny Submarine Commander: miniature armies on a map with a commander silhouette; scarlet / steel gray |
| `BES-047` | Jackpot Jungle | Pinball | `BES-V4.106` | $44 | **Uncommon** | Jackpot Jungle: chrome balls, bumpers and exaggerated scoring lights; lime / navy |
| `BES-048` | Dragon Lantern Legacy | Role-playing | `BES-V3.734` | $76 | **Rare** | Dragon Lantern Legacy: a party facing a mysterious citadel; ice blue / charcoal |
| `BES-049` | Professor Zap's Puzzle Lab | Puzzle | `BES-V1.483` | $23 | **Common** | Professor Zap's Puzzle Lab: clever maze elements and an impossible-looking solution; amber / obsidian |
| `BES-050` | The Clockwork Cabbage | Action Adventure | `BES-V2.216` | $275 | **Grail** | Clockwork Cabbage: hero confronting the central artifact or enemy; amber / obsidian |
| `BES-051` | Toadstool Tournament | Party | `BES-V3.734` | $13 | **Common** | Toadstool Tournament: eccentric group of characters in chaotic competition; jade / parchment |
| `BES-052` | Starship Lunch Rush | Space Combat | `BES-V4.106` | $35 | **Common** | Starship Lunch Rush: ships threading through glowing debris and laser fire; electric yellow / deep indigo |
| `BES-053` | Midnight Train to Nowhere | Action Adventure | `BES-V1.117` | $38 | **Common** | Midnight Train  Nowhere: hero confronting the central artifact or enemy; burnt orange / midnight teal |


### Bintendo 64 (`B64`) — 25 additional titles, 53 total

**Native media:** B64 Game Pak. **Base game media mesh:** Existing 5 cartridge PCB layouts and fixed silkscreen revisions.

| SKU | Additional game title | Genre | PCB / printed factory revision | Grade-8 reference | Rarity | Label and boot-art seed |
|---|---|---|---|---:|---|---|
| `B64-029` | Robo Raccoon Rumble 64 | Platformer | `B64-V2.041` | $105 | **Very Rare** | Robo Raccoon Rumble 64: towering platforms, animated hazards and a small determined hero; scarlet / steel gray |
| `B64-030` | Thunder Kart World Tour | Kart Racing | `B64-V2.508` | $59 | **Uncommon** | Thunder Kart World Tour: cartoon machines drifting through a spectacular turn; lime / navy |
| `B64-031` | Space Plumber Revolution | Space Combat | `B64-V2.508` | $38 | **Scarce** | Space Plumber Revolution: ships threading through glowing debris and laser fire; lime / navy |
| `B64-032` | Dinosaur Island Derby | Exploration | `B64-V3.842` | $18 | **Common** | Dinosaur Island Derby: forbidden entrance surrounded by travel gear and unknown symbols; electric yellow / deep indigo |
| `B64-033` | The Legend of Crumb Lake | Role-playing | `B64-V3.842` | $66 | **Rare** | Legend  Crumb Lake: a party facing a mysterious citadel; silver / violet |
| `B64-034` | Agent 00-Noodle | Stealth | `B64-V2.041` | $31 | **Common** | Agent 00-Noodle: cloaked figure among security beams; moss green / antique ivory |
| `B64-035` | Galaxy Goat Racers | Racing | `B64-V2.508` | $57 | **Uncommon** | Galaxy Goat Racers: leaning racing machines on a dramatic bend; ice blue / charcoal |
| `B64-036` | Jumbo Jetpack Junior | Action Adventure | `B64-V3.129` | $32 | **Common** | Jumbo Jetpack Junior: hero confronting the central artifact or enemy; sky blue / aubergine |
| `B64-037` | Castle of the Nine Keys 64 | Action Adventure | `B64-V3.842` | $9 | **Common** | Castle   Nine Keys 64: hero confronting the central artifact or enemy; sky blue / aubergine |
| `B64-038` | Funky Forest Football | Sports | `B64-V1.204` | $24 | **Common** | Funky Forest Football: athletes framed by huge arena floodlights; neon cyan / purple |
| `B64-039` | Harvest Moonshine Ranch | Simulation | `B64-V3.842` | $24 | **Uncommon** | Harvest Moonshine Ranch: cutaway miniature world with controllable systems; sky blue / aubergine |
| `B64-040` | Witchwood Wonderworld | Action Adventure | `B64-V2.508` | $33 | **Common** | Witchwood Wonderworld: hero confronting the central artifact or enemy; sky blue / aubergine |
| `B64-041` | Kart Smash: Double Trouble | Kart Racing | `B64-V2.508` | $49 | **Uncommon** | Kart Smash: Double Trouble: cartoon machines drifting through a spectacular turn; amber / obsidian |
| `B64-042` | Snowboard Yetis 64 | Action Adventure | `B64-V3.842` | $19 | **Uncommon** | Snowboard Yetis 64: hero confronting the central artifact or enemy; electric yellow / deep indigo |
| `B64-043` | Monster Ranch Vacation | Simulation | `B64-V3.842` | $71 | **Scarce** | Monster Ranch Vacation: cutaway miniature world with controllable systems; amber / obsidian |
| `B64-044` | Zero Gravity Paintball | Action Adventure | `B64-V2.041` | $121 | **Very Rare** | Zero Gravity Paintball: hero confronting the central artifact or enemy; lime / navy |
| `B64-045` | Kingdom of Cardboard 64 | Role-playing | `B64-V3.842` | $41 | **Uncommon** | Kingdom  Cardboard 64: a party facing a mysterious citadel; rose / cobalt |
| `B64-046` | Professor Zap 3D | Action Adventure | `B64-V3.129` | $35 | **Common** | Professor Zap 3D: hero confronting the central artifact or enemy; moss green / antique ivory |
| `B64-047` | Canyon Thunder Rally | Racing | `B64-V2.508` | $24 | **Common** | Canyon Thunder Rally: leaning racing machines on a dramatic bend; scarlet / steel gray |
| `B64-048` | Alien Bowling League | Sports | `B64-V1.204` | $38 | **Common** | Alien Bowling League: athletes framed by huge arena floodlights; neon cyan / purple |
| `B64-049` | Bongo Beats Bonanza | Rhythm | `B64-V2.041` | $33 | **Common** | Bongo Beats Bonanza: booming sound waves, stage lights, and musical controls; silver / violet |
| `B64-050` | Steel Beetle Battle 64 | Fighting | `B64-V2.508` | $10 | **Common** | Steel Beetle Battle 64: two rivals squaring off under a neon sign; silver / violet |
| `B64-051` | Knight School Dropout | Role-playing | `B64-V3.842` | $154 | **Collector** | Knight School Dropout: a party facing a mysterious citadel; electric yellow / deep indigo |
| `B64-052` | Jungle Gem Collectors | Exploration | `B64-V3.842` | $13 | **Common** | Jungle Gem Collectors: forbidden entrance surrounded by travel gear and unknown symbols; rose / cobalt |
| `B64-053` | The Haunted Kart Garage | Kart Racing | `B64-V2.508` | $30 | **Common** | Haunted Kart Garage: cartoon machines drifting through a spectacular turn; desert gold / royal blue |


### Vega Exodus (`VEGA`) — 25 additional titles, 53 total

**Native media:** Vega Cartridge. **Base game media mesh:** Existing 5 cartridge PCB layouts and fixed silkscreen revisions.

| SKU | Additional game title | Genre | PCB / printed factory revision | Grade-8 reference | Rarity | Label and boot-art seed |
|---|---|---|---|---:|---|---|
| `VEGA-029` | Robo Raccoon Rumble | Platformer | `VEGA-V1.622` | $20 | **Common** | Robo Raccoon Rumble: towering platforms, animated hazards and a small determined hero; moss green / antique ivory |
| `VEGA-030` | Chrome Ninja Vengeance | Stealth | `VEGA-V2.174` | $33 | **Scarce** | Chrome Ninja Vengeance: cloaked figure among security beams; moss green / antique ivory |
| `VEGA-031` | Streets of Rumble II | Action Adventure | `VEGA-V2.906` | $23 | **Common** | Streets  Rumble II: hero confronting the central artifact or enemy; neon cyan / purple |
| `VEGA-032` | Hedgepig Spin Dash | Platformer | `VEGA-V3.318` | $29 | **Common** | Hedgepig Spin Dash: towering platforms, animated hazards and a small determined hero; rose / cobalt |
| `VEGA-033` | Blood Moon Brawlers | Fighting | `VEGA-V2.174` | $80 | **Scarce** | Blood Moon Brawlers: two rivals squaring off under a neon sign; scarlet / steel gray |
| `VEGA-034` | Sega-ish Sea Serpents | Action Adventure | `VEGA-V1.622` | $33 | **Common** | Sega-ish Sea Serpents: hero confronting the central artifact or enemy; sky blue / aubergine |
| `VEGA-035` | Neon Noodle Fighters | Fighting | `VEGA-V2.174` | $28 | **Common** | Neon Noodle Fighters: two rivals squaring off under a neon sign; rose / cobalt |
| `VEGA-036` | The Fourth Dragon Road | Role-playing | `VEGA-V2.906` | $24 | **Common** | Fourth Dragon Road: a party facing a mysterious citadel; lime / navy |
| `VEGA-037` | Armored Ant Assault | Action Adventure | `VEGA-V3.318` | $46 | **Uncommon** | Armored Ant Assault: hero confronting the central artifact or enemy; rose / cobalt |
| `VEGA-038` | Quantum Rollerblades | Action Adventure | `VEGA-V1.095` | $55 | **Uncommon** | Quantum Rollerblades: hero confronting the central artifact or enemy; ice blue / charcoal |
| `VEGA-039` | Fists of the Thunder Dojo | Fighting | `VEGA-V2.174` | $41 | **Common** | Fists   Thunder Dojo: two rivals squaring off under a neon sign; jade / parchment |
| `VEGA-040` | Desert Viper Rally | Racing | `VEGA-V2.174` | $75 | **Scarce** | Desert Viper Rally: leaning racing machines on a dramatic bend; silver / violet |
| `VEGA-041` | Supermarket Samurai | Fighting | `VEGA-V2.174` | $29 | **Uncommon** | Supermarket Samurai: two rivals squaring off under a neon sign; ice blue / charcoal |
| `VEGA-042` | Mars Colony Mutiny | Strategy | `VEGA-V2.906` | $20 | **Common** | Mars Colony Mutiny: miniature armies on a map with a commander silhouette; rose / cobalt |
| `VEGA-043` | Steel Beetle Brigade | Action Adventure | `VEGA-V1.095` | $29 | **Common** | Steel Beetle Brigade: hero confronting the central artifact or enemy; amber / obsidian |
| `VEGA-044` | Arcade Knights of Vesta | Role-playing | `VEGA-V2.906` | $86 | **Very Rare** | Arcade Knights  Vesta: a party facing a mysterious citadel; ice blue / charcoal |
| `VEGA-045` | Crystal Falcon Quest | Role-playing | `VEGA-V3.318` | $103 | **Very Rare** | Crystal Falcon Quest: a party facing a mysterious citadel; neon cyan / purple |
| `VEGA-046` | Castle of the Nine Keys | Action Adventure | `VEGA-V2.906` | $25 | **Uncommon** | Castle   Nine Keys: hero confronting the central artifact or enemy; ice blue / charcoal |
| `VEGA-047` | Laser Dolphin Squadron | Strategy | `VEGA-V3.318` | $27 | **Common** | Laser Dolphin Squadron: miniature armies on a map with a commander silhouette; lime / navy |
| `VEGA-048` | Boombox Battle City | Fighting | `VEGA-V1.095` | $21 | **Uncommon** | Boombox Battle City: two rivals squaring off under a neon sign; amber / obsidian |
| `VEGA-049` | Meteor Mayhem Deluxe | Action Adventure | `VEGA-V1.622` | $35 | **Common** | Meteor Mayhem Deluxe: hero confronting the central artifact or enemy; moss green / antique ivory |
| `VEGA-050` | Haunted Hallway Heroes | Survival Horror | `VEGA-V2.174` | $13 | **Common** | Haunted Hallway Heroes: ominous abandoned location illuminated by one lamp; burnt orange / midnight teal |
| `VEGA-051` | Jetboard Rush 16 | Racing | `VEGA-V2.174` | $64 | **Uncommon** | Jetboard Rush 16: leaning racing machines on a dramatic bend; burnt orange / midnight teal |
| `VEGA-052` | Cyber-Samurai Voltage | Fighting | `VEGA-V3.318` | $169 | **Collector** | Cyber-Samurai Voltage: two rivals squaring off under a neon sign; scarlet / steel gray |
| `VEGA-053` | Shadow of the Pixel King | Platformer | `VEGA-V1.095` | $15 | **Common** | Shadow   Pixel King: towering platforms, animated hazards and a small determined hero; moss green / antique ivory |


### Paltari Family Console (`PALT`) — 25 additional titles, 53 total

**Native media:** Paltari Cartridge. **Base game media mesh:** Existing 5 cartridge PCB layouts and fixed silkscreen revisions.

| SKU | Additional game title | Genre | PCB / printed factory revision | Grade-8 reference | Rarity | Label and boot-art seed |
|---|---|---|---|---:|---|---|
| `PALT-029` | Robo Raccoon Rumble | Platformer | `PALT-V1.052` | $17 | **Common** | Robo Raccoon Rumble: towering platforms, animated hazards and a small determined hero; rose / cobalt |
| `PALT-030` | Cosmic Pigeon Patrol | Space Combat | `PALT-V1.771` | $23 | **Common** | Cosmic Pigeon Patrol: ships threading through glowing debris and laser fire; rose / cobalt |
| `PALT-031` | Frogger? I Hardly Know Her | Platformer | `PALT-V2.409` | $28 | **Common** | Frogger? I Hardly Know Her: towering platforms, animated hazards and a small determined hero; jade / parchment |
| `PALT-032` | Paddle Duel Deluxe | Action Adventure | `PALT-V2.955` | $17 | **Common** | Paddle Duel Deluxe: hero confronting the central artifact or enemy; desert gold / royal blue |
| `PALT-033` | The Last Space Turnip | Space Combat | `PALT-V1.771` | $39 | **Common** | Last Space Turnip: ships threading through glowing debris and laser fire; rose / cobalt |
| `PALT-034` | Burger Blaster 2600 | Action Adventure | `PALT-V1.052` | $73 | **Scarce** | Burger Blaster 2600: hero confronting the central artifact or enemy; rose / cobalt |
| `PALT-035` | Asteroids of Unusual Size | Space Combat | `PALT-V1.771` | $47 | **Scarce** | Asteroids  Unusual Size: ships threading through glowing debris and laser fire; moss green / antique ivory |
| `PALT-036` | Moon Miner Mabel | Action Adventure | `PALT-V2.409` | $19 | **Uncommon** | Moon Miner Mabel: hero confronting the central artifact or enemy; ice blue / charcoal |
| `PALT-037` | Ski Slope Stampede | Action Adventure | `PALT-V2.955` | $21 | **Common** | Ski Slope Stampede: hero confronting the central artifact or enemy; ice blue / charcoal |
| `PALT-038` | Bat Cave Batters | Exploration | `PALT-V0.921` | $30 | **Common** | Bat Cave Batters: forbidden entrance surrounded by travel gear and unknown symbols; neon cyan / purple |
| `PALT-039` | Neon Tank Invaders | Action Adventure | `PALT-V1.052` | $37 | **Common** | Neon Tank Invaders: hero confronting the central artifact or enemy; scarlet / steel gray |
| `PALT-040` | Cannonball Caravan | Action Adventure | `PALT-V1.771` | $62 | **Uncommon** | Cannonball Caravan: hero confronting the central artifact or enemy; sky blue / aubergine |
| `PALT-041` | Cave Ants and Aliens | Space Combat | `PALT-V1.771` | $25 | **Common** | Cave Ants  Aliens: ships threading through glowing debris and laser fire; moss green / antique ivory |
| `PALT-042` | Robot Vacuum Rebellion | Action Adventure | `PALT-V2.955` | $93 | **Rare** | Robot Vacuum Rebellion: hero confronting the central artifact or enemy; scarlet / steel gray |
| `PALT-043` | Cosmic Catcher Deluxe | Space Combat | `PALT-V1.771` | $35 | **Common** | Cosmic Catcher Deluxe: ships threading through glowing debris and laser fire; ice blue / charcoal |
| `PALT-044` | Galaxy Granny Escape | Space Combat | `PALT-V1.052` | $74 | **Rare** | Galaxy Granny Escape: ships threading through glowing debris and laser fire; electric yellow / deep indigo |
| `PALT-045` | The Great Pixel Heist | Stealth | `PALT-V1.771` | $56 | **Uncommon** | Great Pixel Heist: cloaked figure among security beams; jade / parchment |
| `PALT-046` | Missile City Survivor | Action Adventure | `PALT-V2.409` | $149 | **Collector** | Missile City Survivor: hero confronting the central artifact or enemy; burnt orange / midnight teal |
| `PALT-047` | Undersea Oxygen Quest | Role-playing | `PALT-V2.955` | $15 | **Common** | Undersea Oxygen Quest: a party facing a mysterious citadel; neon cyan / purple |
| `PALT-048` | Radioactive Raccoon | Platformer | `PALT-V0.921` | $34 | **Common** | Radioactive Raccoon: towering platforms, animated hazards and a small determined hero; lime / navy |
| `PALT-049` | The Haunted Dot Matrix | Survival Horror | `PALT-V1.052` | $65 | **Scarce** | Haunted Dot Matrix: ominous abandoned location illuminated by one lamp; neon cyan / purple |
| `PALT-050` | One Paddle to Rule Them | Action Adventure | `PALT-V1.771` | $24 | **Common** | One Paddle  Rule Them: hero confronting the central artifact or enemy; scarlet / steel gray |
| `PALT-051` | Saturn Rings Raceway | Racing | `PALT-V1.771` | $20 | **Common** | Saturn Rings Raceway: leaning racing machines on a dramatic bend; neon cyan / purple |
| `PALT-052` | Spooky Space Sheriff | Space Combat | `PALT-V2.955` | $22 | **Common** | Spooky Space Sheriff: ships threading through glowing debris and laser fire; lime / navy |
| `PALT-053` | Meteor Pitfall Escape | Action Adventure | `PALT-V0.921` | $27 | **Common** | Meteor Pitfall Escape: hero confronting the central artifact or enemy; moss green / antique ivory |


### Dream Boy / Pocket / Color (`DB`) — 25 additional titles, 53 total

**Native media:** Dream Boy Game Pak. **Base game media mesh:** Existing 5 cartridge PCB layouts and fixed silkscreen revisions.

| SKU | Additional game title | Genre | PCB / printed factory revision | Grade-8 reference | Rarity | Label and boot-art seed |
|---|---|---|---|---:|---|---|
| `DB-029` | Crystal Caper Chronicles | Role-playing | `DB-V3.207` | $90 | **Rare** | Crystal Caper Chronicles: a party facing a mysterious citadel; rose / cobalt |
| `DB-030` | Pocket Beast Collectors Blue | Platformer | `DB-V2.078` | $17 | **Common** | Pocket Beast Collectors Blue: towering platforms, animated hazards and a small determined hero; sky blue / aubergine |
| `DB-031` | Dream Boy Camera Caper | Action Adventure | `DB-V2.615` | $46 | **Uncommon** | Dream Boy Camera Caper: hero confronting the central artifact or enemy; lime / navy |
| `DB-032` | Kingdom of the Button Mages | Role-playing | `DB-V2.615` | $33 | **Uncommon** | Kingdom   Button Mages: a party facing a mysterious citadel; moss green / antique ivory |
| `DB-033` | Moonlit Quest: Origins | Role-playing | `DB-V3.207` | $30 | **Uncommon** | Moonlit Quest: Origins: a party facing a mysterious citadel; desert gold / royal blue |
| `DB-034` | Blockfall DX | Action Adventure | `DB-V1.319` | $15 | **Common** | Blockfall DX: hero confronting the central artifact or enemy; moss green / antique ivory |
| `DB-035` | Tiny Dungeon Accountant | Action Adventure | `DB-V2.078` | $37 | **Common** | Tiny Dungeon Accountant: hero confronting the central artifact or enemy; silver / violet |
| `DB-036` | Super Frog Walker | Platformer | `DB-V2.615` | $11 | **Common** | Super Frog Walker: towering platforms, animated hazards and a small determined hero; lime / navy |
| `DB-037` | Pocket Puzzlemancer | Puzzle | `DB-V3.207` | $11 | **Common** | Pocket Puzzlemancer: clever maze elements and an impossible-looking solution; lime / navy |
| `DB-038` | Cartoon Crypt Keeper | Action Adventure | `DB-V1.033` | $27 | **Common** | Cartoon Crypt Keeper: hero confronting the central artifact or enemy; scarlet / steel gray |
| `DB-039` | Garden Gnome Gladiators | Simulation | `DB-V3.207` | $38 | **Common** | Garden Gnome Gladiators: cutaway miniature world with controllable systems; ice blue / charcoal |
| `DB-040` | The Lost Moonberry | Action Adventure | `DB-V2.078` | $21 | **Uncommon** | Lost Moonberry: hero confronting the central artifact or enemy; amber / obsidian |
| `DB-041` | Kart Smash Mini | Kart Racing | `DB-V2.078` | $11 | **Common** | Kart Smash Mini: cartoon machines drifting through a spectacular turn; lime / navy |
| `DB-042` | Princess of Pebble Peak | Action Adventure | `DB-V3.207` | $31 | **Common** | Princess  Pebble Peak: hero confronting the central artifact or enemy; desert gold / royal blue |
| `DB-043` | Detective Ducksworth | Mystery | `DB-V3.207` | $29 | **Common** | Detective Ducksworth: magnifying glass, photo board, and clues; burnt orange / midnight teal |
| `DB-044` | Ghost Train Pocket | Survival Horror | `DB-V1.319` | $63 | **Scarce** | Ghost Train Pocket: ominous abandoned location illuminated by one lamp; lime / navy |
| `DB-045` | Mini Monster Hotel | Action Adventure | `DB-V2.078` | $23 | **Uncommon** | Mini Monster Hotel: hero confronting the central artifact or enemy; amber / obsidian |
| `DB-046` | Tinker Town Express | Action Adventure | `DB-V2.615` | $29 | **Common** | Tinker Town Express: hero confronting the central artifact or enemy; burnt orange / midnight teal |
| `DB-047` | Mystic Lantern Lake | Action Adventure | `DB-V3.207` | $31 | **Common** | Mystic Lantern Lake: hero confronting the central artifact or enemy; jade / parchment |
| `DB-048` | Captain Coffee Bean | Action Adventure | `DB-V1.033` | $26 | **Common** | Captain Coffee Bean: hero confronting the central artifact or enemy; silver / violet |
| `DB-049` | Bug Catcher Brigade | Action Adventure | `DB-V1.319` | $14 | **Common** | Bug Catcher Brigade: hero confronting the central artifact or enemy; scarlet / steel gray |
| `DB-050` | Little Dragon Egg | Role-playing | `DB-V2.615` | $37 | **Common** | Little Dragon Egg: a party facing a mysterious citadel; desert gold / royal blue |
| `DB-051` | Deep Sea Dream Diver | Action Adventure | `DB-V2.615` | $36 | **Common** | Deep Sea Dream Diver: hero confronting the central artifact or enemy; moss green / antique ivory |
| `DB-052` | Castle of the Nine Keys Pocket | Platformer | `DB-V3.207` | $62 | **Uncommon** | Castle   Nine Keys Pocket: towering platforms, animated hazards and a small determined hero; scarlet / steel gray |
| `DB-053` | The Final Jellybean | Platformer | `DB-V1.033` | $174 | **Collector** | Final Jellybean: towering platforms, animated hazards and a small determined hero; electric yellow / deep indigo |


### Dream Boy Advance / SP / Micro (`DBA`) — 25 additional titles, 53 total

**Native media:** Dream Boy Advance Game Pak. **Base game media mesh:** Existing 5 cartridge PCB layouts and fixed silkscreen revisions.

| SKU | Additional game title | Genre | PCB / printed factory revision | Grade-8 reference | Rarity | Label and boot-art seed |
|---|---|---|---|---:|---|---|
| `DBA-029` | Crystal Caper Chronicles | Role-playing | `DBA-V3.449` | $43 | **Uncommon** | Crystal Caper Chronicles: a party facing a mysterious citadel; ice blue / charcoal |
| `DBA-030` | Critter Catchers Emerald | Action Adventure | `DBA-V2.208` | $70 | **Scarce** | Critter Catchers Emerald: hero confronting the central artifact or enemy; silver / violet |
| `DBA-031` | Metro Hunter: Corrosion | Action Adventure | `DBA-V3.071` | $186 | **Collector** | Metro Hunter: Corrosion: hero confronting the central artifact or enemy; lime / navy |
| `DBA-032` | Moonlit Quest III | Role-playing | `DBA-V3.071` | $11 | **Common** | Moonlit Quest III: a party facing a mysterious citadel; desert gold / royal blue |
| `DBA-033` | Turbo Kart Fever Advance | Kart Racing | `DBA-V2.208` | $23 | **Uncommon** | Turbo Kart Fever Advance: cartoon machines drifting through a spectacular turn; burnt orange / midnight teal |
| `DBA-034` | Mecha Beetle Academy | Action Adventure | `DBA-V1.566` | $39 | **Uncommon** | Mecha Beetle Academy: hero confronting the central artifact or enemy; silver / violet |
| `DBA-035` | Pocket Monster Mechanic | Platformer | `DBA-V2.208` | $24 | **Common** | Pocket Monster Mechanic: towering platforms, animated hazards and a small determined hero; electric yellow / deep indigo |
| `DBA-036` | Dragon Orchard Reborn | Role-playing | `DBA-V3.071` | $27 | **Common** | Dragon Orchard Reborn: a party facing a mysterious citadel; sky blue / aubergine |
| `DBA-037` | Secret Ninja Grocery | Stealth | `DBA-V3.449` | $33 | **Common** | Secret Ninja Grocery: cloaked figure among security beams; moss green / antique ivory |
| `DBA-038` | Mystery of Dusty Harbor | Mystery | `DBA-V1.114` | $70 | **Scarce** | Mystery  Dusty Harbor: magnifying glass, photo board, and clues; amber / obsidian |
| `DBA-039` | The Final Jellybean DX | Platformer | `DBA-V1.566` | $31 | **Common** | Final Jellybean DX: towering platforms, animated hazards and a small determined hero; sky blue / aubergine |
| `DBA-040` | Starlight Skater Advance | Platformer | `DBA-V2.208` | $86 | **Rare** | Starlight Skater Advance: towering platforms, animated hazards and a small determined hero; neon cyan / purple |
| `DBA-041` | Forest of the Paper Wizard | Role-playing | `DBA-V3.449` | $33 | **Common** | Forest   Paper Wizard: a party facing a mysterious citadel; silver / violet |
| `DBA-042` | Cosmic Cannon Advance | Space Combat | `DBA-V3.449` | $31 | **Common** | Cosmic Cannon Advance: ships threading through glowing debris and laser fire; silver / violet |
| `DBA-043` | Tactical Toad Command | Strategy | `DBA-V1.114` | $9 | **Common** | Tactical Toad Command: miniature armies on a map with a commander silhouette; jade / parchment |
| `DBA-044` | Dungeons and Doughnuts Advance | Action Adventure | `DBA-V1.566` | $34 | **Scarce** | Dungeons  Doughnuts Advance: hero confronting the central artifact or enemy; burnt orange / midnight teal |
| `DBA-045` | Pixel Pirate's Revenge | Platformer | `DBA-V2.208` | $35 | **Scarce** | Pixel Pirate's Revenge: towering platforms, animated hazards and a small determined hero; sky blue / aubergine |
| `DBA-046` | Magic Paintbrush Panic | Action Adventure | `DBA-V3.071` | $106 | **Rare** | Magic Paintbrush Panic: hero confronting the central artifact or enemy; lime / navy |
| `DBA-047` | Garden Wars: The Tulip Front | Simulation | `DBA-V3.449` | $42 | **Scarce** | Garden Wars:  Tulip Front: cutaway miniature world with controllable systems; sky blue / aubergine |
| `DBA-048` | Super Mini Rally Cup | Racing | `DBA-V1.114` | $65 | **Uncommon** | Super Mini Rally Cup: leaning racing machines on a dramatic bend; lime / navy |
| `DBA-049` | Aquarium Tycoon Pocket | Simulation | `DBA-V3.449` | $16 | **Common** | Aquarium Tycoon Pocket: cutaway miniature world with controllable systems; neon cyan / purple |
| `DBA-050` | Castle of the Nine Keys Advance | Action Adventure | `DBA-V2.208` | $35 | **Common** | Castle   Nine Keys Advance: hero confronting the central artifact or enemy; amber / obsidian |
| `DBA-051` | Clockmaker's Rebellion | Action Adventure | `DBA-V3.071` | $56 | **Uncommon** | Clockmaker's Rebellion: hero confronting the central artifact or enemy; desert gold / royal blue |
| `DBA-052` | Detective Ducksworth Returns | Mystery | `DBA-V3.449` | $59 | **Uncommon** | Detective Ducksworth Returns: magnifying glass, photo board, and clues; jade / parchment |
| `DBA-053` | Rocket Squirrel Zero | Action Adventure | `DBA-V1.114` | $26 | **Common** | Rocket Squirrel Zero: hero confronting the central artifact or enemy; lime / navy |


### Button Lite (`BUTTON`) — 25 additional titles, 49 total

**Native media:** Button Lite 6-pin Game Card. **Base game media mesh:** Existing 5 cartridge PCB layouts and fixed silkscreen revisions.

| SKU | Additional game title | Genre | PCB / printed factory revision | Grade-8 reference | Rarity | Label and boot-art seed |
|---|---|---|---|---:|---|---|
| `BUTTON-025` | Thumbzilla Goes Shopping | Action Adventure | `BUTTON-V1.407` | $57 | **Uncommon** | Thumbzilla Goes Shopping: hero confronting the central artifact or enemy; scarlet / steel gray |
| `BUTTON-026` | Six Pins to Stardom | Action Adventure | `BUTTON-V1.953` | $30 | **Scarce** | Six Pins  Stardom: hero confronting the central artifact or enemy; moss green / antique ivory |
| `BUTTON-027` | Tappy Turtle Tournament | Party | `BUTTON-V2.305` | $39 | **Common** | Tappy Turtle Tournament: eccentric group of characters in chaotic competition; moss green / antique ivory |
| `BUTTON-028` | Pocket Puzzlemancer Lite | Puzzle | `BUTTON-V2.824` | $41 | **Uncommon** | Pocket Puzzlemancer Lite: clever maze elements and an impossible-looking solution; jade / parchment |
| `BUTTON-029` | Miniature Meteor Maze | Puzzle | `BUTTON-V1.011` | $53 | **Uncommon** | Miniature Meteor Maze: clever maze elements and an impossible-looking solution; desert gold / royal blue |
| `BUTTON-030` | One Button Samurai | Fighting | `BUTTON-V1.407` | $38 | **Uncommon** | One Button Samurai: two rivals squaring off under a neon sign; amber / obsidian |
| `BUTTON-031` | Bee-Bop Balloon Race | Racing | `BUTTON-V1.953` | $31 | **Common** | Bee-Bop Balloon Race: leaning racing machines on a dramatic bend; amber / obsidian |
| `BUTTON-032` | Tiny Ghost Elevator | Survival Horror | `BUTTON-V2.305` | $31 | **Uncommon** | Tiny Ghost Elevator: ominous abandoned location illuminated by one lamp; silver / violet |
| `BUTTON-033` | Pico Penguin Parade | Party | `BUTTON-V2.824` | $87 | **Very Rare** | Pico Penguin Parade: eccentric group of characters in chaotic competition; jade / parchment |
| `BUTTON-034` | Speedy Snack Snatcher | Action Adventure | `BUTTON-V1.011` | $19 | **Uncommon** | Speedy Snack Snatcher: hero confronting the central artifact or enemy; silver / violet |
| `BUTTON-035` | Tap to Defuse | Action Adventure | `BUTTON-V1.407` | $51 | **Scarce** | Tap  Defuse: hero confronting the central artifact or enemy; desert gold / royal blue |
| `BUTTON-036` | Moon Mouse Rescue | Action Adventure | `BUTTON-V1.953` | $51 | **Uncommon** | Moon Mouse Rescue: hero confronting the central artifact or enemy; sky blue / aubergine |
| `BUTTON-037` | Lucky Lantern Tap | Action Adventure | `BUTTON-V2.305` | $10 | **Common** | Lucky Lantern Tap: hero confronting the central artifact or enemy; scarlet / steel gray |
| `BUTTON-038` | Pixel Pet Parade | Party | `BUTTON-V2.824` | $40 | **Uncommon** | Pixel Pet Parade: eccentric group of characters in chaotic competition; neon cyan / purple |
| `BUTTON-039` | Doodle Dungeons | Action Adventure | `BUTTON-V1.011` | $9 | **Common** | Doodle Dungeons: hero confronting the central artifact or enemy; burnt orange / midnight teal |
| `BUTTON-040` | Little Rocket Ranch | Simulation | `BUTTON-V2.305` | $40 | **Common** | Little Rocket Ranch: cutaway miniature world with controllable systems; burnt orange / midnight teal |
| `BUTTON-041` | Color Cube Crusher | Puzzle | `BUTTON-V1.953` | $15 | **Common** | Color Cube Crusher: clever maze elements and an impossible-looking solution; burnt orange / midnight teal |
| `BUTTON-042` | The Tap Detective | Mystery | `BUTTON-V2.305` | $37 | **Common** | Tap Detective: magnifying glass, photo board, and clues; burnt orange / midnight teal |
| `BUTTON-043` | Alien Lunch Counter | Space Combat | `BUTTON-V1.953` | $118 | **Very Rare** | Alien Lunch Counter: ships threading through glowing debris and laser fire; electric yellow / deep indigo |
| `BUTTON-044` | Mini Bunker Blitz | Action Adventure | `BUTTON-V1.011` | $29 | **Common** | Mini Bunker Blitz: hero confronting the central artifact or enemy; ice blue / charcoal |
| `BUTTON-045` | Micro Maze Architect | Simulation | `BUTTON-V2.824` | $34 | **Common** | Micro Maze Architect: cutaway miniature world with controllable systems; desert gold / royal blue |
| `BUTTON-046` | Tiny Beach Volleyball | Sports | `BUTTON-V1.953` | $13 | **Common** | Tiny Beach Volleyball: athletes framed by huge arena floodlights; lime / navy |
| `BUTTON-047` | Starfish Spin-Out | Action Adventure | `BUTTON-V2.305` | $42 | **Common** | Starfish Spin-Out: hero confronting the central artifact or enemy; rose / cobalt |
| `BUTTON-048` | The Last Red Button | Action Adventure | `BUTTON-V2.824` | $58 | **Uncommon** | Last Red Button: hero confronting the central artifact or enemy; lime / navy |
| `BUTTON-049` | Frog Prince Pocket | Platformer | `BUTTON-V1.011` | $25 | **Common** | Frog Prince Pocket: towering platforms, animated hazards and a small determined hero; neon cyan / purple |


### Retrobit RB35 (`RB35`) — 25 additional titles, 49 total

**Native media:** Retrobit microSD Game Card. **Base game media mesh:** Existing shared disc/card geometry; no new board model per title.

| SKU | Additional game title | Genre | PCB / printed factory revision | Grade-8 reference | Rarity | Label and boot-art seed |
|---|---|---|---|---:|---|---|
| `RB35-025` | Robo Raccoon Retro Anthology | Collection | `Shared media mesh` | $23 | **Common** | Robo Raccoon Retro Anthology: rows of retro game cases and pixelated arcade trophies; moss green / antique ivory |
| `RB35-026` | Pixel Pirates Greatest Hits | Platformer | `Shared media mesh` | $59 | **Uncommon** | Pixel Pirates Greatest Hits: towering platforms, animated hazards and a small determined hero; silver / violet |
| `RB35-027` | Pocket Puzzlemancer Collection | Collection | `Shared media mesh` | $10 | **Common** | Pocket Puzzlemancer Collection: rows of retro game cases and pixelated arcade trophies; scarlet / steel gray |
| `RB35-028` | The CRT Classics Pack | Collection | `Shared media mesh` | $21 | **Uncommon** | CRT Classics Pack: rows of retro game cases and pixelated arcade trophies; burnt orange / midnight teal |
| `RB35-029` | Arcade After Dark | Action Adventure | `Shared media mesh` | $21 | **Common** | Arcade After Dark: hero confronting the central artifact or enemy; lime / navy |
| `RB35-030` | Eight-Bit Kitchen Catastrophe | Action Adventure | `Shared media mesh` | $21 | **Common** | Eight-Bit Kitchen Catastrophe: hero confronting the central artifact or enemy; electric yellow / deep indigo |
| `RB35-031` | Retro Rally Legends | Racing | `Shared media mesh` | $57 | **Scarce** | Retro Rally Legends: leaning racing machines on a dramatic bend; desert gold / royal blue |
| `RB35-032` | Forgotten Dungeon Archives | Action Adventure | `Shared media mesh` | $25 | **Uncommon** | Forgotten Dungeon Archives: hero confronting the central artifact or enemy; desert gold / royal blue |
| `RB35-033` | Moonbase Custodian Legacy | Space Combat | `Shared media mesh` | $17 | **Common** | Moonbase Custodian Legacy: ships threading through glowing debris and laser fire; ice blue / charcoal |
| `RB35-034` | Portable Pinball Museum II | Pinball | `Shared media mesh` | $17 | **Common** | Portable Pinball Museum II: chrome balls, bumpers and exaggerated scoring lights; desert gold / royal blue |
| `RB35-035` | Old School Monster Mash | Action Adventure | `Shared media mesh` | $23 | **Common** | Old School Monster Mash: hero confronting the central artifact or enemy; moss green / antique ivory |
| `RB35-036` | The Thirteen Arcade Mysteries | Action Adventure | `Shared media mesh` | $35 | **Common** | Thirteen Arcade Mysteries: hero confronting the central artifact or enemy; amber / obsidian |
| `RB35-037` | Chronicles of the Lost Save | Role-playing | `Shared media mesh` | $10 | **Common** | Chronicles   Lost Save: a party facing a mysterious citadel; electric yellow / deep indigo |
| `RB35-038` | Legend of the Cartridge King | Role-playing | `Shared media mesh` | $26 | **Common** | Legend   Cartridge King: a party facing a mysterious citadel; burnt orange / midnight teal |
| `RB35-039` | Fantasy Football Bits | Sports | `Shared media mesh` | $57 | **Uncommon** | Fantasy Football Bits: athletes framed by huge arena floodlights; burnt orange / midnight teal |
| `RB35-040` | Micro Defender Collection | Collection | `Shared media mesh` | $25 | **Uncommon** | Micro Defender Collection: rows of retro game cases and pixelated arcade trophies; scarlet / steel gray |
| `RB35-041` | Retro Railway Rivals | Action Adventure | `Shared media mesh` | $9 | **Common** | Retro Railway Rivals: hero confronting the central artifact or enemy; electric yellow / deep indigo |
| `RB35-042` | Chiptune Champion Mix | Rhythm | `Shared media mesh` | $20 | **Common** | Chiptune Champion Mix: booming sound waves, stage lights, and musical controls; rose / cobalt |
| `RB35-043` | Warehouse Puzzle Pack | Puzzle | `Shared media mesh` | $42 | **Common** | Warehouse Puzzle Pack: clever maze elements and an impossible-looking solution; amber / obsidian |
| `RB35-044` | Tiny Tank Turbo Trilogy | Action Adventure | `Shared media mesh` | $51 | **Uncommon** | Tiny Tank Turbo Trilogy: hero confronting the central artifact or enemy; neon cyan / purple |
| `RB35-045` | Castle of the Nine Keys: Anthology | Collection | `Shared media mesh` | $65 | **Uncommon** | Castle   Nine Keys: Anthology: rows of retro game cases and pixelated arcade trophies; rose / cobalt |
| `RB35-046` | Dragon Lantern Classics | Collection | `Shared media mesh` | $22 | **Common** | Dragon Lantern Classics: rows of retro game cases and pixelated arcade trophies; lime / navy |
| `RB35-047` | Night of the Analog Zombies | Survival Horror | `Shared media mesh` | $14 | **Common** | Night   Analog Zombies: ominous abandoned location illuminated by one lamp; moss green / antique ivory |
| `RB35-048` | Retro Kart Time Trials | Kart Racing | `Shared media mesh` | $36 | **Common** | Retro Kart Time Trials: cartoon machines drifting through a spectacular turn; amber / obsidian |
| `RB35-049` | The Pixel Time Capsule | Mystery | `Shared media mesh` | $153 | **Collector** | Pixel Time Capsule: magnifying glass, photo board, and clues; sky blue / aubergine |


### Bintendo Pocket Joy Advance (`PJOY`) — 25 additional titles, 49 total

**Native media:** Pocket Joy Mini Cartridge. **Base game media mesh:** Existing 5 cartridge PCB layouts and fixed silkscreen revisions.

| SKU | Additional game title | Genre | PCB / printed factory revision | Grade-8 reference | Rarity | Label and boot-art seed |
|---|---|---|---|---:|---|---|
| `PJOY-025` | Crystal Caper Chronicles | Role-playing | `PJOY-V4.008` | $22 | **Common** | Crystal Caper Chronicles: a party facing a mysterious citadel; rose / cobalt |
| `PJOY-026` | Twin Screen Monster Ranch | Simulation | `PJOY-V3.146` | $33 | **Common** | Twin Screen Monster Ranch: cutaway miniature world with controllable systems; desert gold / royal blue |
| `PJOY-027` | Pocket Beast Collectors Platinum | Platformer | `PJOY-V3.146` | $35 | **Common** | Pocket Beast Collectors Platinum: towering platforms, animated hazards and a small determined hero; desert gold / royal blue |
| `PJOY-028` | Stylus of the Lost Kingdom | Role-playing | `PJOY-V3.146` | $46 | **Uncommon** | Stylus   Lost Kingdom: a party facing a mysterious citadel; scarlet / steel gray |
| `PJOY-029` | Tap Detective Academy | Mystery | `PJOY-V4.008` | $34 | **Scarce** | Tap Detective Academy: magnifying glass, photo board, and clues; jade / parchment |
| `PJOY-030` | Twin Screen Plumbers II | Platformer | `PJOY-V2.079` | $29 | **Common** | Twin Screen Plumbers II: towering platforms, animated hazards and a small determined hero; desert gold / royal blue |
| `PJOY-031` | Kart Smash: Touch Circuit | Kart Racing | `PJOY-V2.491` | $42 | **Common** | Kart Smash: Touch Circuit: cartoon machines drifting through a spectacular turn; amber / obsidian |
| `PJOY-032` | Chef Chaos Cooking School | Action Adventure | `PJOY-V3.146` | $10 | **Common** | Chef Chaos Cooking School: hero confronting the central artifact or enemy; lime / navy |
| `PJOY-033` | Garden Gnome Detectives | Simulation | `PJOY-V4.008` | $82 | **Scarce** | Garden Gnome Detectives: cutaway miniature world with controllable systems; neon cyan / purple |
| `PJOY-034` | Moonlit Quest: Twin Moons | Role-playing | `PJOY-V3.146` | $20 | **Common** | Moonlit Quest: Twin Moons: a party facing a mysterious citadel; moss green / antique ivory |
| `PJOY-035` | Double Trouble Dragon Tamer | Role-playing | `PJOY-V4.008` | $41 | **Common** | Double Trouble Dragon Tamer: a party facing a mysterious citadel; rose / cobalt |
| `PJOY-036` | Professor Zap's Touch Lab | Puzzle | `PJOY-V2.491` | $65 | **Uncommon** | Professor Zap's Touch Lab: clever maze elements and an impossible-looking solution; sky blue / aubergine |
| `PJOY-037` | Robot Pet Rescue Center | Action Adventure | `PJOY-V3.146` | $53 | **Rare** | Robot Pet Rescue Center: hero confronting the central artifact or enemy; moss green / antique ivory |
| `PJOY-038` | Fashion Disaster Simulator | Simulation | `PJOY-V3.146` | $15 | **Common** | Fashion Disaster Simulator: cutaway miniature world with controllable systems; jade / parchment |
| `PJOY-039` | Time Traveler's Two Screens | Action Adventure | `PJOY-V1.223` | $18 | **Common** | Time Traveler's Two Screens: hero confronting the central artifact or enemy; lime / navy |
| `PJOY-040` | Doodle Dungeon Architect | Simulation | `PJOY-V3.146` | $63 | **Scarce** | Doodle Dungeon Architect: cutaway miniature world with controllable systems; ice blue / charcoal |
| `PJOY-041` | Touch the Haunted Door | Survival Horror | `PJOY-V2.491` | $34 | **Common** | Touch  Haunted Door: ominous abandoned location illuminated by one lamp; burnt orange / midnight teal |
| `PJOY-042` | Pocket Sports Carnival | Sports | `PJOY-V3.146` | $58 | **Scarce** | Pocket Sports Carnival: athletes framed by huge arena floodlights; burnt orange / midnight teal |
| `PJOY-043` | Secret Agent Fingerprint | Stealth | `PJOY-V4.008` | $30 | **Scarce** | Secret Agent Fingerprint: cloaked figure among security beams; sky blue / aubergine |
| `PJOY-044` | Ghost Camera Chronicles | Survival Horror | `PJOY-V1.223` | $175 | **Collector** | Ghost Camera Chronicles: ominous abandoned location illuminated by one lamp; desert gold / royal blue |
| `PJOY-045` | Robo Raccoon Mini Mix | Platformer | `PJOY-V2.079` | $18 | **Uncommon** | Robo Raccoon Mini Mix: towering platforms, animated hazards and a small determined hero; scarlet / steel gray |
| `PJOY-046` | The Great Sandwich Trials | Action Adventure | `PJOY-V2.491` | $13 | **Common** | Great Sandwich Trials: hero confronting the central artifact or enemy; jade / parchment |
| `PJOY-047` | Mystic Maze Stylus | Puzzle | `PJOY-V3.146` | $21 | **Common** | Mystic Maze Stylus: clever maze elements and an impossible-looking solution; amber / obsidian |
| `PJOY-048` | Bento Battle Academy | Fighting | `PJOY-V4.008` | $37 | **Uncommon** | Bento Battle Academy: two rivals squaring off under a neon sign; moss green / antique ivory |
| `PJOY-049` | Pirate Map Mystery DS | Mystery | `PJOY-V4.008` | $22 | **Common** | Pirate Map Mystery DS: magnifying glass, photo board, and clues; desert gold / royal blue |


### Homey Sinnusus (`SINN`) — 25 additional titles, 49 total

**Native media:** Sinnusus Retro Cartridge. **Base game media mesh:** Existing 5 cartridge PCB layouts and fixed silkscreen revisions.

| SKU | Additional game title | Genre | PCB / printed factory revision | Grade-8 reference | Rarity | Label and boot-art seed |
|---|---|---|---|---:|---|---|
| `SINN-025` | Crystal Caper Chronicles | Role-playing | `SINN-V3.017` | $9 | **Common** | Crystal Caper Chronicles: a party facing a mysterious citadel; moss green / antique ivory |
| `SINN-026` | Neon Wanderer Color | Action Adventure | `SINN-V1.748` | $40 | **Common** | Neon Wanderer Color: hero confronting the central artifact or enemy; moss green / antique ivory |
| `SINN-027` | Legend of the Rusted Bell | Role-playing | `SINN-V3.017` | $24 | **Common** | Legend   Rusted Bell: a party facing a mysterious citadel; silver / violet |
| `SINN-028` | Homey Heroes Assemble | Action Adventure | `SINN-V3.017` | $26 | **Common** | Homey Heroes Assemble: hero confronting the central artifact or enemy; sky blue / aubergine |
| `SINN-029` | Tiny Ninja Neon Strike | Stealth | `SINN-V0.876` | $25 | **Common** | Tiny Ninja Neon Strike: cloaked figure among security beams; lime / navy |
| `SINN-030` | Pocket Galaxy Commander | Space Combat | `SINN-V1.312` | $12 | **Common** | Pocket Galaxy Commander: ships threading through glowing debris and laser fire; lime / navy |
| `SINN-031` | Sinnusus Sword Saga | Role-playing | `SINN-V3.017` | $22 | **Uncommon** | Sinnusus Sword Saga: a party facing a mysterious citadel; desert gold / royal blue |
| `SINN-032` | Cyber Samurai Pocket | Fighting | `SINN-V2.541` | $29 | **Common** | Cyber Samurai Pocket: two rivals squaring off under a neon sign; moss green / antique ivory |
| `SINN-033` | Moonlight Motorcycle | Racing | `SINN-V1.748` | $41 | **Common** | Moonlight Motorcycle: leaning racing machines on a dramatic bend; moss green / antique ivory |
| `SINN-034` | Mystery of the Tiny Forest | Mystery | `SINN-V0.876` | $29 | **Common** | Mystery   Tiny Forest: magnifying glass, photo board, and clues; silver / violet |
| `SINN-035` | Pixel Pet Chaos | Platformer | `SINN-V1.312` | $42 | **Scarce** | Pixel Pet Chaos: towering platforms, animated hazards and a small determined hero; amber / obsidian |
| `SINN-036` | Jellybean Journey Color | Platformer | `SINN-V1.748` | $39 | **Common** | Jellybean Journey Color: towering platforms, animated hazards and a small determined hero; sky blue / aubergine |
| `SINN-037` | Cartoon Castle Crisis | Action Adventure | `SINN-V2.541` | $32 | **Common** | Cartoon Castle Crisis: hero confronting the central artifact or enemy; desert gold / royal blue |
| `SINN-038` | Haunted Submarine Quest | Survival Horror | `SINN-V3.017` | $11 | **Common** | Haunted Submarine Quest: ominous abandoned location illuminated by one lamp; lime / navy |
| `SINN-039` | Robo Raccoon Pocket Rumble | Platformer | `SINN-V0.876` | $8 | **Common** | Robo Raccoon Pocket Rumble: towering platforms, animated hazards and a small determined hero; amber / obsidian |
| `SINN-040` | Dragon Lantern Color | Role-playing | `SINN-V2.541` | $56 | **Uncommon** | Dragon Lantern Color: a party facing a mysterious citadel; burnt orange / midnight teal |
| `SINN-041` | Monster Truck Pocket | Platformer | `SINN-V1.748` | $57 | **Uncommon** | Monster Truck Pocket: towering platforms, animated hazards and a small determined hero; silver / violet |
| `SINN-042` | Ancient Rune Runner | Platformer | `SINN-V2.541` | $28 | **Common** | Ancient Rune Runner: towering platforms, animated hazards and a small determined hero; silver / violet |
| `SINN-043` | Solar Skater 16 | Space Combat | `SINN-V1.748` | $74 | **Scarce** | Solar Skater 16: ships threading through glowing debris and laser fire; ice blue / charcoal |
| `SINN-044` | Pocket Opera Star | Platformer | `SINN-V0.876` | $12 | **Common** | Pocket Opera Star: towering platforms, animated hazards and a small determined hero; scarlet / steel gray |
| `SINN-045` | Island Architect Color | Simulation | `SINN-V3.017` | $67 | **Scarce** | Island Architect Color: cutaway miniature world with controllable systems; sky blue / aubergine |
| `SINN-046` | Mecha Mantis Attack | Action Adventure | `SINN-V1.748` | $31 | **Common** | Mecha Mantis Attack: hero confronting the central artifact or enemy; lime / navy |
| `SINN-047` | The Last Viking Lunch | Action Adventure | `SINN-V2.541` | $159 | **Collector** | Last Viking Lunch: hero confronting the central artifact or enemy; amber / obsidian |
| `SINN-048` | Retro Reef Explorer | Exploration | `SINN-V3.017` | $39 | **Common** | Retro Reef Explorer: forbidden entrance surrounded by travel gear and unknown symbols; rose / cobalt |
| `SINN-049` | Mister Mystery Color | Mystery | `SINN-V3.017` | $13 | **Common** | Mister Mystery Color: magnifying glass, photo board, and clues; ice blue / charcoal |


### Bintentendo Game Orb (`GORB`) — 25 additional titles, 49 total

**Native media:** Game Orb Optical Game Disc. **Base game media mesh:** Existing shared disc/card geometry; no new board model per title.

| SKU | Additional game title | Genre | PCB / printed factory revision | Grade-8 reference | Rarity | Label and boot-art seed |
|---|---|---|---|---:|---|---|
| `GORB-025` | Thunder Kart World Tour | Kart Racing | `Shared media mesh` | $49 | **Uncommon** | Thunder Kart World Tour: cartoon machines drifting through a spectacular turn; burnt orange / midnight teal |
| `GORB-026` | Orbit Knights: Crystal Fall | Role-playing | `Shared media mesh` | $13 | **Common** | Orbit Knights: Crystal Fall: a party facing a mysterious citadel; moss green / antique ivory |
| `GORB-027` | Pyramid of a Thousand Stars | Action Adventure | `Shared media mesh` | $33 | **Common** | Pyramid   Thousand Stars: hero confronting the central artifact or enemy; jade / parchment |
| `GORB-028` | Cosmic Plumber: Gravity Shift | Space Combat | `Shared media mesh` | $82 | **Scarce** | Cosmic Plumber: Gravity Shift: ships threading through glowing debris and laser fire; burnt orange / midnight teal |
| `GORB-029` | Mystic Marble Mania | Action Adventure | `Shared media mesh` | $19 | **Uncommon** | Mystic Marble Mania: hero confronting the central artifact or enemy; sky blue / aubergine |
| `GORB-030` | Balloon Battle Galaxy | Fighting | `Shared media mesh` | $29 | **Scarce** | Balloon Battle Galaxy: two rivals squaring off under a neon sign; silver / violet |
| `GORB-031` | The Legend of the Star Kettle | Role-playing | `Shared media mesh` | $16 | **Common** | Legend   Star Kettle: a party facing a mysterious citadel; sky blue / aubergine |
| `GORB-032` | Robo Raccoon Rumble Orb | Platformer | `Shared media mesh` | $11 | **Common** | Robo Raccoon Rumble Orb: towering platforms, animated hazards and a small determined hero; silver / violet |
| `GORB-033` | Sea Serpent Safari | Action Adventure | `Shared media mesh` | $41 | **Common** | Sea Serpent Safari: hero confronting the central artifact or enemy; sky blue / aubergine |
| `GORB-034` | Space Karaoke Deluxe | Rhythm | `Shared media mesh` | $12 | **Common** | Space Karaoke Deluxe: booming sound waves, stage lights, and musical controls; lime / navy |
| `GORB-035` | Dance Party Orbit | Rhythm | `Shared media mesh` | $11 | **Common** | Dance Party Orbit: booming sound waves, stage lights, and musical controls; desert gold / royal blue |
| `GORB-036` | Star Pilot: Lost Fleet | Action Adventure | `Shared media mesh` | $29 | **Uncommon** | Star Pilot: Lost Fleet: hero confronting the central artifact or enemy; jade / parchment |
| `GORB-037` | Castle of the Nine Keys Orb | Action Adventure | `Shared media mesh` | $56 | **Uncommon** | Castle   Nine Keys Orb: hero confronting the central artifact or enemy; desert gold / royal blue |
| `GORB-038` | Galactic Garden Wars | Simulation | `Shared media mesh` | $30 | **Common** | Galactic Garden Wars: cutaway miniature world with controllable systems; rose / cobalt |
| `GORB-039` | Agent Double-O Orbit | Stealth | `Shared media mesh` | $30 | **Common** | Agent Double-O Orbit: cloaked figure among security beams; desert gold / royal blue |
| `GORB-040` | Pinball Galaxy Remastered | Pinball | `Shared media mesh` | $44 | **Uncommon** | Pinball Galaxy Remastered: chrome balls, bumpers and exaggerated scoring lights; scarlet / steel gray |
| `GORB-041` | Crystal Caper Chronicles HD | Role-playing | `Shared media mesh` | $16 | **Common** | Crystal Caper Chronicles HD: a party facing a mysterious citadel; burnt orange / midnight teal |
| `GORB-042` | Paper Planet Racers | Racing | `Shared media mesh` | $20 | **Uncommon** | Paper Planet Racers: leaning racing machines on a dramatic bend; lime / navy |
| `GORB-043` | Monkey Moonbase Mayhem | Space Combat | `Shared media mesh` | $37 | **Common** | Monkey Moonbase Mayhem: ships threading through glowing debris and laser fire; burnt orange / midnight teal |
| `GORB-044` | Tornado Tennis 3000 | Sports | `Shared media mesh` | $24 | **Common** | Tornado Tennis 3000: athletes framed by huge arena floodlights; desert gold / royal blue |
| `GORB-045` | Ghost Station Omega | Survival Horror | `Shared media mesh` | $52 | **Uncommon** | Ghost Station Omega: ominous abandoned location illuminated by one lamp; burnt orange / midnight teal |
| `GORB-046` | Deep Blue Dungeons | Action Adventure | `Shared media mesh` | $26 | **Common** | Deep Blue Dungeons: hero confronting the central artifact or enemy; jade / parchment |
| `GORB-047` | Tiny Robot Sports League | Sports | `Shared media mesh` | $68 | **Scarce** | Tiny Robot Sports League: athletes framed by huge arena floodlights; lime / navy |
| `GORB-048` | Fantasy Football Galaxy | Sports | `Shared media mesh` | $55 | **Uncommon** | Fantasy Football Galaxy: athletes framed by huge arena floodlights; ice blue / charcoal |
| `GORB-049` | Nova Wings Championship | Action Adventure | `Shared media mesh` | $182 | **Collector** | Nova Wings Championship: hero confronting the central artifact or enemy; scarlet / steel gray |


### Swamarami All-In-One (`SWAMA`) — 25 additional titles, 49 total

**Native media:** Swamarami SD Game Pack. **Base game media mesh:** Existing shared disc/card geometry; no new board model per title.

| SKU | Additional game title | Genre | PCB / printed factory revision | Grade-8 reference | Rarity | Label and boot-art seed |
|---|---|---|---|---:|---|---|
| `SWAMA-025` | Nine Hundred Games for Nine Bucks | Action Adventure | `Shared media mesh` | $64 | **Rare** | Nine Hundred Games  Nine Bucks: hero confronting the central artifact or enemy; amber / obsidian |
| `SWAMA-026` | Mega Retro Mystery Bundle | Mystery | `Shared media mesh` | $29 | **Common** | Mega Retro Mystery Bundle: magnifying glass, photo board, and clues; neon cyan / purple |
| `SWAMA-027` | Bootleg Kart Madness | Kart Racing | `Shared media mesh` | $41 | **Common** | Bootleg Kart Madness: cartoon machines drifting through a spectacular turn; silver / violet |
| `SWAMA-028` | Not Quite Plumber Bros | Platformer | `Shared media mesh` | $16 | **Common** | Not Quite Plumber Bros: towering platforms, animated hazards and a small determined hero; ice blue / charcoal |
| `SWAMA-029` | Budget Dragon Legends | Role-playing | `Shared media mesh` | $80 | **Scarce** | Budget Dragon Legends: a party facing a mysterious citadel; rose / cobalt |
| `SWAMA-030` | The Unlicensed Universe | Action Adventure | `Shared media mesh` | $20 | **Common** | Unlicensed Universe: hero confronting the central artifact or enemy; sky blue / aubergine |
| `SWAMA-031` | Cartridge Crusher Collection | Collection | `Shared media mesh` | $39 | **Uncommon** | Cartridge Crusher Collection: rows of retro game cases and pixelated arcade trophies; sky blue / aubergine |
| `SWAMA-032` | Totally Original Ninja Pack | Stealth | `Shared media mesh` | $20 | **Common** | Totally Original Ninja Pack: cloaked figure among security beams; sky blue / aubergine |
| `SWAMA-033` | Pixel Raccoon Mega Mix | Collection | `Shared media mesh` | $61 | **Uncommon** | Pixel Raccoon Mega Mix: rows of retro game cases and pixelated arcade trophies; neon cyan / purple |
| `SWAMA-034` | Discount Dungeon Party | Rhythm | `Shared media mesh` | $15 | **Common** | Discount Dungeon Party: booming sound waves, stage lights, and musical controls; burnt orange / midnight teal |
| `SWAMA-035` | Arcade Almost-Classic | Action Adventure | `Shared media mesh` | $35 | **Common** | Arcade Almost-Classic: hero confronting the central artifact or enemy; rose / cobalt |
| `SWAMA-036` | The Game Called Game | Action Adventure | `Shared media mesh` | $16 | **Common** | Game Called Game: hero confronting the central artifact or enemy; lime / navy |
| `SWAMA-037` | Retro Puzzle Grab Bag II | Puzzle | `Shared media mesh` | $33 | **Common** | Retro Puzzle Grab Bag II: clever maze elements and an impossible-looking solution; moss green / antique ivory |
| `SWAMA-038` | Thirty Fighting Guys | Fighting | `Shared media mesh` | $54 | **Uncommon** | Thirty Fighting Guys: two rivals squaring off under a neon sign; sky blue / aubergine |
| `SWAMA-039` | Offbrand Astro Patrol | Action Adventure | `Shared media mesh` | $26 | **Common** | Offbrand Astro Patrol: hero confronting the central artifact or enemy; scarlet / steel gray |
| `SWAMA-040` | Robo Raccoon Rumble: Budget Edition | Platformer | `Shared media mesh` | $19 | **Common** | Robo Raccoon Rumble: Budget Edition: towering platforms, animated hazards and a small determined hero; amber / obsidian |
| `SWAMA-041` | Tiny Kart Ultimate Remix | Kart Racing | `Shared media mesh` | $57 | **Uncommon** | Tiny Kart Ultimate Remix: cartoon machines drifting through a spectacular turn; jade / parchment |
| `SWAMA-042` | Cheap Thrills Pinball | Pinball | `Shared media mesh` | $50 | **Uncommon** | Cheap Thrills Pinball: chrome balls, bumpers and exaggerated scoring lights; silver / violet |
| `SWAMA-043` | Fake Space Rangers | Space Combat | `Shared media mesh` | $19 | **Common** | Fake Space Rangers: ships threading through glowing debris and laser fire; rose / cobalt |
| `SWAMA-044` | The Lost Save Collection | Collection | `Shared media mesh` | $44 | **Uncommon** | Lost Save Collection: rows of retro game cases and pixelated arcade trophies; scarlet / steel gray |
| `SWAMA-045` | Mystery Cartridge Compilation | Collection | `Shared media mesh` | $25 | **Uncommon** | Mystery Cartridge Compilation: rows of retro game cases and pixelated arcade trophies; burnt orange / midnight teal |
| `SWAMA-046` | Supreme Soccer Bargain | Sports | `Shared media mesh` | $35 | **Common** | Supreme Soccer Bargain: athletes framed by huge arena floodlights; desert gold / royal blue |
| `SWAMA-047` | Alien Microwave Attack | Space Combat | `Shared media mesh` | $57 | **Uncommon** | Alien Microwave Attack: ships threading through glowing debris and laser fire; rose / cobalt |
| `SWAMA-048` | All Stars But Not Those Stars | Action Adventure | `Shared media mesh` | $48 | **Uncommon** | All Stars But Not Those Stars: hero confronting the central artifact or enemy; lime / navy |
| `SWAMA-049` | The 400-in-1 That Has 12 Games | Collection | `Shared media mesh` | $23 | **Common** | 400--1 That Has 12 Games: rows of retro game cases and pixelated arcade trophies; jade / parchment |


### DiscJockie 1 (`DJ1`) — 25 additional titles, 49 total

**Native media:** DJ1 Game Disc. **Base game media mesh:** Existing shared disc/card geometry; no new board model per title.

| SKU | Additional game title | Genre | PCB / printed factory revision | Grade-8 reference | Rarity | Label and boot-art seed |
|---|---|---|---|---:|---|---|
| `DJ1-025` | Dungeon Accountant Deluxe | Action Adventure | `Shared media mesh` | $19 | **Common** | Dungeon Accountant Deluxe: hero confronting the central artifact or enemy; jade / parchment |
| `DJ1-026` | Street Skater 1998 | Platformer | `Shared media mesh` | $53 | **Uncommon** | Street Skater 1998: towering platforms, animated hazards and a small determined hero; desert gold / royal blue |
| `DJ1-027` | Panicsonnet Sound Clash | Rhythm | `Shared media mesh` | $32 | **Scarce** | Panicsonnet Sound Clash: booming sound waves, stage lights, and musical controls; amber / obsidian |
| `DJ1-028` | Midnight on Neon Boulevard | Action Adventure | `Shared media mesh` | $15 | **Common** | Midnight on Neon Boulevard: hero confronting the central artifact or enemy; rose / cobalt |
| `DJ1-029` | Space Truckers CD | Space Combat | `Shared media mesh` | $11 | **Common** | Space Truckers CD: ships threading through glowing debris and laser fire; silver / violet |
| `DJ1-030` | Zombie Lunch Break | Survival Horror | `Shared media mesh` | $20 | **Common** | Zombie Lunch Break: ominous abandoned location illuminated by one lamp; ice blue / charcoal |
| `DJ1-031` | Nitro Raceway '99 | Racing | `Shared media mesh` | $34 | **Common** | Nitro Raceway '99: leaning racing machines on a dramatic bend; moss green / antique ivory |
| `DJ1-032` | King of the Dance Pad | Rhythm | `Shared media mesh` | $71 | **Rare** | King   Dance Pad: booming sound waves, stage lights, and musical controls; sky blue / aubergine |
| `DJ1-033` | Quest for the Crystal Receipt | Role-playing | `Shared media mesh` | $34 | **Common** | Quest   Crystal Receipt: a party facing a mysterious citadel; desert gold / royal blue |
| `DJ1-034` | Fighter's Folly | Fighting | `Shared media mesh` | $42 | **Common** | Fighter's Folly: two rivals squaring off under a neon sign; desert gold / royal blue |
| `DJ1-035` | Cosmic Castle 3D | Space Combat | `Shared media mesh` | $13 | **Common** | Cosmic Castle 3D: ships threading through glowing debris and laser fire; amber / obsidian |
| `DJ1-036` | The Motel at Road's End | Survival Horror | `Shared media mesh` | $40 | **Common** | Motel at Road's End: ominous abandoned location illuminated by one lamp; amber / obsidian |
| `DJ1-037` | Spy Agent Overreaction | Stealth | `Shared media mesh` | $36 | **Common** | Spy Agent Overreaction: cloaked figure among security beams; sky blue / aubergine |
| `DJ1-038` | Lost Aquarium Explorer | Exploration | `Shared media mesh` | $37 | **Common** | Lost Aquarium Explorer: forbidden entrance surrounded by travel gear and unknown symbols; jade / parchment |
| `DJ1-039` | Garden of Forgotten Gods | Simulation | `Shared media mesh` | $108 | **Very Rare** | Garden  Forgotten Gods: cutaway miniature world with controllable systems; jade / parchment |
| `DJ1-040` | The Great Metro Chase | Action Adventure | `Shared media mesh` | $28 | **Common** | Great Metro Chase: hero confronting the central artifact or enemy; lime / navy |
| `DJ1-041` | Disco Detective | Mystery | `Shared media mesh` | $31 | **Common** | Disco Detective: magnifying glass, photo board, and clues; ice blue / charcoal |
| `DJ1-042` | Swordmaster of Nowhere | Role-playing | `Shared media mesh` | $39 | **Common** | Swordmaster  Nowhere: a party facing a mysterious citadel; electric yellow / deep indigo |
| `DJ1-043` | Cartoon Carnage CD | Action Adventure | `Shared media mesh` | $27 | **Common** | Cartoon Carnage CD: hero confronting the central artifact or enemy; lime / navy |
| `DJ1-044` | The Lost Arcade Tape | Action Adventure | `Shared media mesh` | $163 | **Collector** | Lost Arcade Tape: hero confronting the central artifact or enemy; ice blue / charcoal |
| `DJ1-045` | Thunder Kart World Tour | Kart Racing | `Shared media mesh` | $11 | **Common** | Thunder Kart World Tour: cartoon machines drifting through a spectacular turn; moss green / antique ivory |
| `DJ1-046` | Dragon Lantern Legacy | Role-playing | `Shared media mesh` | $10 | **Common** | Dragon Lantern Legacy: a party facing a mysterious citadel; silver / violet |
| `DJ1-047` | Moonbase Custodian 3D | Space Combat | `Shared media mesh` | $13 | **Common** | Moonbase Custodian 3D: ships threading through glowing debris and laser fire; jade / parchment |
| `DJ1-048` | Monster Soccer Championship | Sports | `Shared media mesh` | $31 | **Common** | Monster Soccer Championship: athletes framed by huge arena floodlights; electric yellow / deep indigo |
| `DJ1-049` | Spooky Mansion V | Action Adventure | `Shared media mesh` | $23 | **Common** | Spooky Mansion V: hero confronting the central artifact or enemy; desert gold / royal blue |


### DiscJockie 2 (`DJ2`) — 25 additional titles, 49 total

**Native media:** DJ2 Game Disc. **Base game media mesh:** Existing shared disc/card geometry; no new board model per title.

| SKU | Additional game title | Genre | PCB / printed factory revision | Grade-8 reference | Rarity | Label and boot-art seed |
|---|---|---|---|---:|---|---|
| `DJ2-025` | Dungeon Accountant Deluxe | Action Adventure | `Shared media mesh` | $26 | **Common** | Dungeon Accountant Deluxe: hero confronting the central artifact or enemy; silver / violet |
| `DJ2-026` | Street Skater 2002 | Platformer | `Shared media mesh` | $21 | **Common** | Street Skater 2002: towering platforms, animated hazards and a small determined hero; silver / violet |
| `DJ2-027` | Kart Anarchy Underground | Kart Racing | `Shared media mesh` | $34 | **Uncommon** | Kart Anarchy Underground: cartoon machines drifting through a spectacular turn; sky blue / aubergine |
| `DJ2-028` | Night Shift at the Aquarium | Survival Horror | `Shared media mesh` | $10 | **Common** | Night Shift at  Aquarium: ominous abandoned location illuminated by one lamp; electric yellow / deep indigo |
| `DJ2-029` | Space Truckers: Outer Limits | Space Combat | `Shared media mesh` | $41 | **Uncommon** | Space Truckers: Outer Limits: ships threading through glowing debris and laser fire; silver / violet |
| `DJ2-030` | The Crimson Dragon Scroll | Role-playing | `Shared media mesh` | $35 | **Uncommon** | Crimson Dragon Scroll: a party facing a mysterious citadel; jade / parchment |
| `DJ2-031` | Monster Mansion: Director's Cut | Survival Horror | `Shared media mesh` | $31 | **Scarce** | Monster Mansion: Director's Cut: ominous abandoned location illuminated by one lamp; ice blue / charcoal |
| `DJ2-032` | Ghost Transit Authority | Survival Horror | `Shared media mesh` | $45 | **Scarce** | Ghost Transit Authority: ominous abandoned location illuminated by one lamp; ice blue / charcoal |
| `DJ2-033` | Spy Agent: Terminal Error | Stealth | `Shared media mesh` | $52 | **Scarce** | Spy Agent: Terminal Error: cloaked figure among security beams; burnt orange / midnight teal |
| `DJ2-034` | Dragon Lantern Legacy | Role-playing | `Shared media mesh` | $20 | **Common** | Dragon Lantern Legacy: a party facing a mysterious citadel; neon cyan / purple |
| `DJ2-035` | Urban Chaos: Mall Escape | Action Adventure | `Shared media mesh` | $52 | **Uncommon** | Urban Chaos: Mall Escape: hero confronting the central artifact or enemy; neon cyan / purple |
| `DJ2-036` | Tactical Typhoon Delta | Strategy | `Shared media mesh` | $56 | **Uncommon** | Tactical Typhoon Delta: miniature armies on a map with a commander silhouette; silver / violet |
| `DJ2-037` | Road Rage Delivery Service | Racing | `Shared media mesh` | $15 | **Common** | Road Rage Delivery Service: leaning racing machines on a dramatic bend; rose / cobalt |
| `DJ2-038` | Formula Furious 2 | Racing | `Shared media mesh` | $96 | **Rare** | Formula Furious 2: leaning racing machines on a dramatic bend; burnt orange / midnight teal |
| `DJ2-039` | Crystal Caper Chronicles HD | Role-playing | `Shared media mesh` | $61 | **Uncommon** | Crystal Caper Chronicles HD: a party facing a mysterious citadel; ice blue / charcoal |
| `DJ2-040` | Rogue Planet Syndicate | Action Adventure | `Shared media mesh` | $38 | **Scarce** | Rogue Planet Syndicate: hero confronting the central artifact or enemy; jade / parchment |
| `DJ2-041` | Bounty Hunter's Day Off | Action Adventure | `Shared media mesh` | $33 | **Common** | Bounty Hunter's Day Off: hero confronting the central artifact or enemy; neon cyan / purple |
| `DJ2-042` | Kung Fu Karaoke 2 | Rhythm | `Shared media mesh` | $34 | **Uncommon** | Kung Fu Karaoke 2: booming sound waves, stage lights, and musical controls; burnt orange / midnight teal |
| `DJ2-043` | Deadly Diner Midnight | Survival Horror | `Shared media mesh` | $95 | **Very Rare** | Deadly Diner Midnight: ominous abandoned location illuminated by one lamp; lime / navy |
| `DJ2-044` | Sands of the Forgotten King | Action Adventure | `Shared media mesh` | $45 | **Scarce** | Sands   Forgotten King: hero confronting the central artifact or enemy; scarlet / steel gray |
| `DJ2-045` | Future Basketball Association | Sports | `Shared media mesh` | $24 | **Common** | Future Basketball Association: athletes framed by huge arena floodlights; scarlet / steel gray |
| `DJ2-046` | Pirates of Paper Bay | Exploration | `Shared media mesh` | $29 | **Uncommon** | Pirates  Paper Bay: forbidden entrance surrounded by travel gear and unknown symbols; burnt orange / midnight teal |
| `DJ2-047` | Echoes of the Old Clock | Action Adventure | `Shared media mesh` | $28 | **Common** | Echoes   Old Clock: hero confronting the central artifact or enemy; lime / navy |
| `DJ2-048` | Racing Legends: Nitro City | Role-playing | `Shared media mesh` | $20 | **Common** | Racing Legends: Nitro City: a party facing a mysterious citadel; amber / obsidian |
| `DJ2-049` | Nightfall Samurai | Fighting | `Shared media mesh` | $30 | **Uncommon** | Nightfall Samurai: two rivals squaring off under a neon sign; scarlet / steel gray |


### DiscJockie 3 (`DJ3`) — 25 additional titles, 49 total

**Native media:** DJ3 Game Disc. **Base game media mesh:** Existing shared disc/card geometry; no new board model per title.

| SKU | Additional game title | Genre | PCB / printed factory revision | Grade-8 reference | Rarity | Label and boot-art seed |
|---|---|---|---|---:|---|---|
| `DJ3-025` | Nebula Drift: Overdrive | Racing | `Shared media mesh` | $83 | **Rare** | Nebula Drift: Overdrive: leaning racing machines on a dramatic bend; electric yellow / deep indigo |
| `DJ3-026` | Thunder Kart World Tour HD | Kart Racing | `Shared media mesh` | $31 | **Common** | Thunder Kart World Tour HD: cartoon machines drifting through a spectacular turn; burnt orange / midnight teal |
| `DJ3-027` | Midnight Cyberpunk Boulevard | Action Adventure | `Shared media mesh` | $40 | **Common** | Midnight Cyberpunk Boulevard: hero confronting the central artifact or enemy; scarlet / steel gray |
| `DJ3-028` | Chronicles of Ashen Valor | Role-playing | `Shared media mesh` | $35 | **Common** | Chronicles  Ashen Valor: a party facing a mysterious citadel; ice blue / charcoal |
| `DJ3-029` | Dragon Lantern: Reawakening | Role-playing | `Shared media mesh` | $39 | **Common** | Dragon Lantern: Reawakening: a party facing a mysterious citadel; rose / cobalt |
| `DJ3-030` | Deep Space Dishwasher | Space Combat | `Shared media mesh` | $62 | **Uncommon** | Deep Space Dishwasher: ships threading through glowing debris and laser fire; electric yellow / deep indigo |
| `DJ3-031` | Night Shift at the Aquarium II | Survival Horror | `Shared media mesh` | $30 | **Common** | Night Shift at  Aquarium II: ominous abandoned location illuminated by one lamp; sky blue / aubergine |
| `DJ3-032` | The Lost Kingdom Protocol | Role-playing | `Shared media mesh` | $36 | **Common** | Lost Kingdom Protocol: a party facing a mysterious citadel; silver / violet |
| `DJ3-033` | Frostbound Colony | Strategy | `Shared media mesh` | $19 | **Common** | Frostbound Colony: miniature armies on a map with a commander silhouette; amber / obsidian |
| `DJ3-034` | Mecha Samurai Wars | Fighting | `Shared media mesh` | $42 | **Common** | Mecha Samurai Wars: two rivals squaring off under a neon sign; jade / parchment |
| `DJ3-035` | Tidal Rally: Horizon Coast | Racing | `Shared media mesh` | $38 | **Common** | Tidal Rally: Horizon Coast: leaning racing machines on a dramatic bend; lime / navy |
| `DJ3-036` | Resident Scarecrow: Return | Survival Horror | `Shared media mesh` | $41 | **Uncommon** | Resident Scarecrow: Return: ominous abandoned location illuminated by one lamp; scarlet / steel gray |
| `DJ3-037` | Wrecking Ball Racing | Action Adventure | `Shared media mesh` | $12 | **Common** | Wrecking Ball Racing: hero confronting the central artifact or enemy; neon cyan / purple |
| `DJ3-038` | Dungeon Accountant: Audit Day | Action Adventure | `Shared media mesh` | $15 | **Common** | Dungeon Accountant: Audit Day: hero confronting the central artifact or enemy; rose / cobalt |
| `DJ3-039` | Billionaire City Builder | Simulation | `Shared media mesh` | $51 | **Scarce** | Billionaire City Builder: cutaway miniature world with controllable systems; sky blue / aubergine |
| `DJ3-040` | Ironclad Frontier: Director's Cut | Strategy | `Shared media mesh` | $60 | **Scarce** | Ironclad Frontier: Director's Cut: miniature armies on a map with a commander silhouette; ice blue / charcoal |
| `DJ3-041` | Ghost Protocol Omega | Survival Horror | `Shared media mesh` | $29 | **Common** | Ghost Protocol Omega: ominous abandoned location illuminated by one lamp; amber / obsidian |
| `DJ3-042` | Space Truckers: Warp Nine | Space Combat | `Shared media mesh` | $11 | **Common** | Space Truckers: Warp Nine: ships threading through glowing debris and laser fire; ice blue / charcoal |
| `DJ3-043` | Cursed Cathedral 3D | Action Adventure | `Shared media mesh` | $53 | **Uncommon** | Cursed Cathedral 3D: hero confronting the central artifact or enemy; neon cyan / purple |
| `DJ3-044` | Retro Knights in Space | Role-playing | `Shared media mesh` | $25 | **Common** | Retro Knights  Space: a party facing a mysterious citadel; silver / violet |
| `DJ3-045` | Starship Laundry Commander | Space Combat | `Shared media mesh` | $41 | **Common** | Starship Laundry Commander: ships threading through glowing debris and laser fire; rose / cobalt |
| `DJ3-046` | Apex Drift: Championship | Racing | `Shared media mesh` | $29 | **Scarce** | Apex Drift: Championship: leaning racing machines on a dramatic bend; amber / obsidian |
| `DJ3-047` | Robo Raccoon Rumble HD | Platformer | `Shared media mesh` | $42 | **Common** | Robo Raccoon Rumble HD: towering platforms, animated hazards and a small determined hero; scarlet / steel gray |
| `DJ3-048` | The Great Orbital Heist | Space Combat | `Shared media mesh` | $12 | **Common** | Great Orbital Heist: ships threading through glowing debris and laser fire; neon cyan / purple |
| `DJ3-049` | Solar Storm 2049 | Space Combat | `Shared media mesh` | $36 | **Common** | Solar Storm 2049: ships threading through glowing debris and laser fire; moss green / antique ivory |


### DiscJockie Pocket (`DJP`) — 25 additional titles, 49 total

**Native media:** DJ Pocket Mini Game Disc. **Base game media mesh:** Existing shared disc/card geometry; no new board model per title.

| SKU | Additional game title | Genre | PCB / printed factory revision | Grade-8 reference | Rarity | Label and boot-art seed |
|---|---|---|---|---:|---|---|
| `DJP-025` | Moonlit Quest Pocket Disc | Role-playing | `Shared media mesh` | $31 | **Uncommon** | Moonlit Quest Pocket Disc: a party facing a mysterious citadel; silver / violet |
| `DJP-026` | Laser Lunchbox Heroes | Action Adventure | `Shared media mesh` | $12 | **Common** | Laser Lunchbox Heroes: hero confronting the central artifact or enemy; desert gold / royal blue |
| `DJP-027` | Pocket Dragon Squadron | Role-playing | `Shared media mesh` | $30 | **Common** | Pocket Dragon Squadron: a party facing a mysterious citadel; electric yellow / deep indigo |
| `DJP-028` | MiniDisc Monster Mayhem | Action Adventure | `Shared media mesh` | $19 | **Common** | MiniDisc Monster Mayhem: hero confronting the central artifact or enemy; electric yellow / deep indigo |
| `DJP-029` | Super Pocket Racer 2 | Racing | `Shared media mesh` | $72 | **Scarce** | Super Pocket Racer 2: leaning racing machines on a dramatic bend; silver / violet |
| `DJP-030` | Beach Volleyball Compact | Sports | `Shared media mesh` | $19 | **Common** | Beach Volleyball Compact: athletes framed by huge arena floodlights; lime / navy |
| `DJP-031` | Undersea Ruins Portable | Exploration | `Shared media mesh` | $39 | **Uncommon** | Undersea Ruins Portable: forbidden entrance surrounded by travel gear and unknown symbols; ice blue / charcoal |
| `DJP-032` | Tiny Kart Turbo Disc | Kart Racing | `Shared media mesh` | $41 | **Common** | Tiny Kart Turbo Disc: cartoon machines drifting through a spectacular turn; lime / navy |
| `DJP-033` | Secret Agent Pocket Signal | Stealth | `Shared media mesh` | $35 | **Scarce** | Secret Agent Pocket Signal: cloaked figure among security beams; lime / navy |
| `DJP-034` | Zombie Pocket Picnic | Survival Horror | `Shared media mesh` | $11 | **Common** | Zombie Pocket Picnic: ominous abandoned location illuminated by one lamp; silver / violet |
| `DJP-035` | Pirate Radio Adventures | Exploration | `Shared media mesh` | $23 | **Uncommon** | Pirate Radio Adventures: forbidden entrance surrounded by travel gear and unknown symbols; rose / cobalt |
| `DJP-036` | Ninja Taxi Delivery | Stealth | `Shared media mesh` | $63 | **Uncommon** | Ninja Taxi Delivery: cloaked figure among security beams; desert gold / royal blue |
| `DJP-037` | Ghost Train MiniDisc | Survival Horror | `Shared media mesh` | $30 | **Scarce** | Ghost Train MiniDisc: ominous abandoned location illuminated by one lamp; electric yellow / deep indigo |
| `DJP-038` | Mecha Beetle Pocket | Platformer | `Shared media mesh` | $10 | **Common** | Mecha Beetle Pocket: towering platforms, animated hazards and a small determined hero; sky blue / aubergine |
| `DJP-039` | Pocket Puzzle Panic 3D | Puzzle | `Shared media mesh` | $20 | **Common** | Pocket Puzzle Panic 3D: clever maze elements and an impossible-looking solution; electric yellow / deep indigo |
| `DJP-040` | Starship Sandwich Mission | Space Combat | `Shared media mesh` | $12 | **Common** | Starship Sandwich Mission: ships threading through glowing debris and laser fire; scarlet / steel gray |
| `DJP-041` | Hero of the Lost USB | Action Adventure | `Shared media mesh` | $31 | **Common** | Hero   Lost USB: hero confronting the central artifact or enemy; jade / parchment |
| `DJP-042` | The Clockwork Seas | Action Adventure | `Shared media mesh` | $335 | **Grail** | Clockwork Seas: hero confronting the central artifact or enemy; lime / navy |
| `DJP-043` | Jockie Jam Session | Action Adventure | `Shared media mesh` | $75 | **Rare** | Jockie Jam Session: hero confronting the central artifact or enemy; sky blue / aubergine |
| `DJP-044` | Pocket Castle Defense | Platformer | `Shared media mesh` | $57 | **Scarce** | Pocket Castle Defense: towering platforms, animated hazards and a small determined hero; burnt orange / midnight teal |
| `DJP-045` | The Pirate Planet Pocket | Platformer | `Shared media mesh` | $31 | **Common** | Pirate Planet Pocket: towering platforms, animated hazards and a small determined hero; desert gold / royal blue |
| `DJP-046` | Crystal Reef Rescue | Action Adventure | `Shared media mesh` | $20 | **Common** | Crystal Reef Rescue: hero confronting the central artifact or enemy; scarlet / steel gray |
| `DJP-047` | Alien Basketball Pocket | Sports | `Shared media mesh` | $28 | **Common** | Alien Basketball Pocket: athletes framed by huge arena floodlights; sky blue / aubergine |
| `DJP-048` | Moonbase Custodian Mini | Space Combat | `Shared media mesh` | $38 | **Uncommon** | Moonbase Custodian Mini: ships threading through glowing debris and laser fire; scarlet / steel gray |
| `DJP-049` | Tiny Ghost Detective | Survival Horror | `Shared media mesh` | $39 | **Common** | Tiny Ghost Detective: ominous abandoned location illuminated by one lamp; lime / navy |


### Funstation 1 (`FS1`) — 25 additional titles, 49 total

**Native media:** FS1 Game Disc. **Base game media mesh:** Existing shared disc/card geometry; no new board model per title.

| SKU | Additional game title | Genre | PCB / printed factory revision | Grade-8 reference | Rarity | Label and boot-art seed |
|---|---|---|---|---:|---|---|
| `FS1-025` | Dungeon Accountant Deluxe | Action Adventure | `Shared media mesh` | $11 | **Common** | Dungeon Accountant Deluxe: hero confronting the central artifact or enemy; silver / violet |
| `FS1-026` | Resident Scarecrow: Origins | Survival Horror | `Shared media mesh` | $88 | **Very Rare** | Resident Scarecrow: Origins: ominous abandoned location illuminated by one lamp; scarlet / steel gray |
| `FS1-027` | Fantasy Fable VII-ish | Role-playing | `Shared media mesh` | $49 | **Uncommon** | Fantasy Fable VII-ish: a party facing a mysterious citadel; desert gold / royal blue |
| `FS1-028` | Kart Club 1997 | Kart Racing | `Shared media mesh` | $50 | **Scarce** | Kart Club 1997: cartoon machines drifting through a spectacular turn; electric yellow / deep indigo |
| `FS1-029` | Knightfall Mountain | Role-playing | `Shared media mesh` | $58 | **Scarce** | Knightfall Mountain: a party facing a mysterious citadel; silver / violet |
| `FS1-030` | Soccer Fever International | Sports | `Shared media mesh` | $41 | **Common** | Soccer Fever International: athletes framed by huge arena floodlights; scarlet / steel gray |
| `FS1-031` | Zombie Museum Escape | Collection | `Shared media mesh` | $12 | **Common** | Zombie Museum Escape: rows of retro game cases and pixelated arcade trophies; jade / parchment |
| `FS1-032` | Dance Floor Thunder | Rhythm | `Shared media mesh` | $35 | **Common** | Dance Floor Thunder: booming sound waves, stage lights, and musical controls; lime / navy |
| `FS1-033` | Pixel Detective: Dark City | Survival Horror | `Shared media mesh` | $25 | **Uncommon** | Pixel Detective: Dark City: ominous abandoned location illuminated by one lamp; desert gold / royal blue |
| `FS1-034` | Mecha Rampage Arena | Action Adventure | `Shared media mesh` | $48 | **Scarce** | Mecha Rampage Arena: hero confronting the central artifact or enemy; desert gold / royal blue |
| `FS1-035` | Pirates of Dusty Bay | Exploration | `Shared media mesh` | $34 | **Common** | Pirates  Dusty Bay: forbidden entrance surrounded by travel gear and unknown symbols; burnt orange / midnight teal |
| `FS1-036` | The Crystal Crown Mystery | Mystery | `Shared media mesh` | $30 | **Scarce** | Crystal Crown Mystery: magnifying glass, photo board, and clues; desert gold / royal blue |
| `FS1-037` | Battle of the Paper Tanks | Fighting | `Shared media mesh` | $71 | **Rare** | Battle   Paper Tanks: two rivals squaring off under a neon sign; silver / violet |
| `FS1-038` | Ninja Grocery Rampage | Stealth | `Shared media mesh` | $90 | **Very Rare** | Ninja Grocery Rampage: cloaked figure among security beams; moss green / antique ivory |
| `FS1-039` | Space Truckers CD | Space Combat | `Shared media mesh` | $34 | **Common** | Space Truckers CD: ships threading through glowing debris and laser fire; sky blue / aubergine |
| `FS1-040` | Midnight Racing: Redline | Racing | `Shared media mesh` | $32 | **Common** | Midnight Racing: Redline: leaning racing machines on a dramatic bend; desert gold / royal blue |
| `FS1-041` | Castle of the Nine Keys 3D | Action Adventure | `Shared media mesh` | $23 | **Common** | Castle   Nine Keys 3D: hero confronting the central artifact or enemy; ice blue / charcoal |
| `FS1-042` | Monster Ranch Tycoon | Simulation | `Shared media mesh` | $12 | **Common** | Monster Ranch Tycoon: cutaway miniature world with controllable systems; desert gold / royal blue |
| `FS1-043` | Dragon Lantern Legacy | Role-playing | `Shared media mesh` | $11 | **Common** | Dragon Lantern Legacy: a party facing a mysterious citadel; desert gold / royal blue |
| `FS1-044` | Final Castle Saga | Action Adventure | `Shared media mesh` | $23 | **Common** | Final Castle Saga: hero confronting the central artifact or enemy; scarlet / steel gray |
| `FS1-045` | Ghost Motel 1999 | Survival Horror | `Shared media mesh` | $89 | **Rare** | Ghost Motel 1999: ominous abandoned location illuminated by one lamp; ice blue / charcoal |
| `FS1-046` | Retro Wrestling League | Sports | `Shared media mesh` | $14 | **Common** | Retro Wrestling League: athletes framed by huge arena floodlights; burnt orange / midnight teal |
| `FS1-047` | The Great Island Expedition | Exploration | `Shared media mesh` | $51 | **Uncommon** | Great Island Expedition: forbidden entrance surrounded by travel gear and unknown symbols; burnt orange / midnight teal |
| `FS1-048` | Panicsonnet Rhythm Festival | Rhythm | `Shared media mesh` | $15 | **Common** | Panicsonnet Rhythm Festival: booming sound waves, stage lights, and musical controls; neon cyan / purple |
| `FS1-049` | Mystery of Blue Harbor | Mystery | `Shared media mesh` | $40 | **Uncommon** | Mystery  Blue Harbor: magnifying glass, photo board, and clues; sky blue / aubergine |


### Funstation 2 (`FS2`) — 25 additional titles, 49 total

**Native media:** FS2 Game Disc. **Base game media mesh:** Existing shared disc/card geometry; no new board model per title.

| SKU | Additional game title | Genre | PCB / printed factory revision | Grade-8 reference | Rarity | Label and boot-art seed |
|---|---|---|---|---:|---|---|
| `FS2-025` | Dungeon Accountant Deluxe | Action Adventure | `Shared media mesh` | $43 | **Uncommon** | Dungeon Accountant Deluxe: hero confronting the central artifact or enemy; silver / violet |
| `FS2-026` | Thunder Kart World Tour | Kart Racing | `Shared media mesh` | $13 | **Common** | Thunder Kart World Tour: cartoon machines drifting through a spectacular turn; moss green / antique ivory |
| `FS2-027` | Resident Scarecrow: The Second Shift | Survival Horror | `Shared media mesh` | $11 | **Common** | Resident Scarecrow:  Second Shift: ominous abandoned location illuminated by one lamp; lime / navy |
| `FS2-028` | Fantasy Fable X-ish | Role-playing | `Shared media mesh` | $11 | **Common** | Fantasy Fable X-ish: a party facing a mysterious citadel; moss green / antique ivory |
| `FS2-029` | Shadow of the Tin Colossus | Action Adventure | `Shared media mesh` | $9 | **Common** | Shadow   Tin Colossus: hero confronting the central artifact or enemy; jade / parchment |
| `FS2-030` | Dance Floor Fever 2004 | Rhythm | `Shared media mesh` | $62 | **Scarce** | Dance Floor Fever 2004: booming sound waves, stage lights, and musical controls; amber / obsidian |
| `FS2-031` | Dragon Lantern Legacy | Role-playing | `Shared media mesh` | $11 | **Common** | Dragon Lantern Legacy: a party facing a mysterious citadel; lime / navy |
| `FS2-032` | Street Skater: Grind City | Platformer | `Shared media mesh` | $26 | **Common** | Street Skater: Grind City: towering platforms, animated hazards and a small determined hero; neon cyan / purple |
| `FS2-033` | Battlefield of Paper Soldiers | Fighting | `Shared media mesh` | $29 | **Common** | Battlefield  Paper Soldiers: two rivals squaring off under a neon sign; moss green / antique ivory |
| `FS2-034` | Deep Ocean Discovery | Rhythm | `Shared media mesh` | $24 | **Uncommon** | Deep Ocean Discovery: booming sound waves, stage lights, and musical controls; neon cyan / purple |
| `FS2-035` | Moonlight Ninja Revenge | Stealth | `Shared media mesh` | $23 | **Common** | Moonlight Ninja Revenge: cloaked figure among security beams; lime / navy |
| `FS2-036` | The Lost Kingdom Protocol | Role-playing | `Shared media mesh` | $41 | **Common** | Lost Kingdom Protocol: a party facing a mysterious citadel; scarlet / steel gray |
| `FS2-037` | Future Soccer Academy | Sports | `Shared media mesh` | $37 | **Common** | Future Soccer Academy: athletes framed by huge arena floodlights; silver / violet |
| `FS2-038` | Mecha Beetle Revolution | Action Adventure | `Shared media mesh` | $16 | **Common** | Mecha Beetle Revolution: hero confronting the central artifact or enemy; silver / violet |
| `FS2-039` | Alien Attack: Final Wave | Space Combat | `Shared media mesh` | $35 | **Common** | Alien Attack: Final Wave: ships threading through glowing debris and laser fire; moss green / antique ivory |
| `FS2-040` | Royal Road Rally | Racing | `Shared media mesh` | $25 | **Common** | Royal Road Rally: leaning racing machines on a dramatic bend; neon cyan / purple |
| `FS2-041` | Ghost Mansion Remake | Survival Horror | `Shared media mesh` | $58 | **Uncommon** | Ghost Mansion Remake: ominous abandoned location illuminated by one lamp; lime / navy |
| `FS2-042` | Detective Blacklake | Mystery | `Shared media mesh` | $50 | **Uncommon** | Detective Blacklake: magnifying glass, photo board, and clues; sky blue / aubergine |
| `FS2-043` | Pixel Pirates: Grand Voyage | Platformer | `Shared media mesh` | $46 | **Uncommon** | Pixel Pirates: Grand Voyage: towering platforms, animated hazards and a small determined hero; lime / navy |
| `FS2-044` | The Last Subway Station | Action Adventure | `Shared media mesh` | $38 | **Common** | Last Subway Station: hero confronting the central artifact or enemy; moss green / antique ivory |
| `FS2-045` | Robo Raccoon Rumble 2 | Platformer | `Shared media mesh` | $53 | **Rare** | Robo Raccoon Rumble 2: towering platforms, animated hazards and a small determined hero; desert gold / royal blue |
| `FS2-046` | Tactical Robot Command | Strategy | `Shared media mesh` | $29 | **Common** | Tactical Robot Command: miniature armies on a map with a commander silhouette; silver / violet |
| `FS2-047` | Mansion of a Thousand Doors | Action Adventure | `Shared media mesh` | $385 | **Grail** | Mansion   Thousand Doors: hero confronting the central artifact or enemy; amber / obsidian |
| `FS2-048` | Pirate Kart Grand Prix | Kart Racing | `Shared media mesh` | $31 | **Uncommon** | Pirate Kart Grand Prix: cartoon machines drifting through a spectacular turn; scarlet / steel gray |
| `FS2-049` | Clockwork Kingdom Quest | Role-playing | `Shared media mesh` | $10 | **Common** | Clockwork Kingdom Quest: a party facing a mysterious citadel; jade / parchment |


### Funstation 3 (`FS3`) — 25 additional titles, 49 total

**Native media:** FS3 Game Disc. **Base game media mesh:** Existing shared disc/card geometry; no new board model per title.

| SKU | Additional game title | Genre | PCB / printed factory revision | Grade-8 reference | Rarity | Label and boot-art seed |
|---|---|---|---|---:|---|---|
| `FS3-025` | Nebula Drift: Overdrive | Racing | `Shared media mesh` | $26 | **Common** | Nebula Drift: Overdrive: leaning racing machines on a dramatic bend; lime / navy |
| `FS3-026` | Crown of Embers: Prelude | Role-playing | `Shared media mesh` | $31 | **Common** | Crown  Embers: Prelude: a party facing a mysterious citadel; burnt orange / midnight teal |
| `FS3-027` | Nightfall Ranger: Origins | Action Adventure | `Shared media mesh` | $105 | **Rare** | Nightfall Ranger: Origins: hero confronting the central artifact or enemy; scarlet / steel gray |
| `FS3-028` | Dragon Lantern: Reawakening | Role-playing | `Shared media mesh` | $15 | **Common** | Dragon Lantern: Reawakening: a party facing a mysterious citadel; moss green / antique ivory |
| `FS3-029` | Undead Motel 3 | Survival Horror | `Shared media mesh` | $71 | **Rare** | Undead Motel 3: ominous abandoned location illuminated by one lamp; amber / obsidian |
| `FS3-030` | Ironclad Frontier | Strategy | `Shared media mesh` | $74 | **Rare** | Ironclad Frontier: miniature armies on a map with a commander silhouette; desert gold / royal blue |
| `FS3-031` | Tidal Rally: Horizon Coast | Racing | `Shared media mesh` | $57 | **Uncommon** | Tidal Rally: Horizon Coast: leaning racing machines on a dramatic bend; silver / violet |
| `FS3-032` | The Wolf of Wall Street Fighter | Fighting | `Shared media mesh` | $32 | **Uncommon** | Wolf  Wall Street Fighter: two rivals squaring off under a neon sign; lime / navy |
| `FS3-033` | Thunder Kart World Tour HD | Kart Racing | `Shared media mesh` | $33 | **Common** | Thunder Kart World Tour HD: cartoon machines drifting through a spectacular turn; desert gold / royal blue |
| `FS3-034` | Zombie Harvest: The Outbreak | Survival Horror | `Shared media mesh` | $34 | **Common** | Zombie Harvest:  Outbreak: ominous abandoned location illuminated by one lamp; moss green / antique ivory |
| `FS3-035` | Cosmic City Skylines | Simulation | `Shared media mesh` | $16 | **Common** | Cosmic City Skylines: cutaway miniature world with controllable systems; electric yellow / deep indigo |
| `FS3-036` | Detective Noir: Cold Harbor | Mystery | `Shared media mesh` | $25 | **Common** | Detective Noir: Cold Harbor: magnifying glass, photo board, and clues; ice blue / charcoal |
| `FS3-037` | Knight of the Last Light | Survival Horror | `Shared media mesh` | $25 | **Uncommon** | Knight   Last Light: ominous abandoned location illuminated by one lamp; burnt orange / midnight teal |
| `FS3-038` | Galactic Warfare Delta | Strategy | `Shared media mesh` | $27 | **Common** | Galactic Warfare Delta: miniature armies on a map with a commander silhouette; neon cyan / purple |
| `FS3-039` | The Hollow Mountain Curse | Action Adventure | `Shared media mesh` | $56 | **Scarce** | Hollow Mountain Curse: hero confronting the central artifact or enemy; neon cyan / purple |
| `FS3-040` | Tower of the Lost Magi | Action Adventure | `Shared media mesh` | $60 | **Uncommon** | Tower   Lost Magi: hero confronting the central artifact or enemy; rose / cobalt |
| `FS3-041` | Shadow Sprint Ultra | Action Adventure | `Shared media mesh` | $33 | **Uncommon** | Shadow Sprint Ultra: hero confronting the central artifact or enemy; silver / violet |
| `FS3-042` | Fantasy Fable XIII-ish | Role-playing | `Shared media mesh` | $44 | **Uncommon** | Fantasy Fable XIII-ish: a party facing a mysterious citadel; scarlet / steel gray |
| `FS3-043` | Robo Raccoon Rumble HD | Platformer | `Shared media mesh` | $60 | **Rare** | Robo Raccoon Rumble HD: towering platforms, animated hazards and a small determined hero; jade / parchment |
| `FS3-044` | Deep Sea Survival 3 | Action Adventure | `Shared media mesh` | $58 | **Uncommon** | Deep Sea Survival 3: hero confronting the central artifact or enemy; desert gold / royal blue |
| `FS3-045` | Mecha Beetle Armageddon | Action Adventure | `Shared media mesh` | $39 | **Common** | Mecha Beetle Armageddon: hero confronting the central artifact or enemy; scarlet / steel gray |
| `FS3-046` | Starship Cargo Wars | Space Combat | `Shared media mesh` | $56 | **Uncommon** | Starship Cargo Wars: ships threading through glowing debris and laser fire; rose / cobalt |
| `FS3-047` | Little Big Cardboard Planet | Action Adventure | `Shared media mesh` | $194 | **Collector** | Little Big Cardboard Planet: hero confronting the central artifact or enemy; sky blue / aubergine |
| `FS3-048` | Storm Riders Championship | Action Adventure | `Shared media mesh` | $8 | **Common** | Storm Riders Championship: hero confronting the central artifact or enemy; amber / obsidian |
| `FS3-049` | The Last Sandwich of Us | Action Adventure | `Shared media mesh` | $20 | **Common** | Last Sandwich  Us: hero confronting the central artifact or enemy; neon cyan / purple |


### Funstation 4 (`FS4`) — 25 additional titles, 49 total

**Native media:** FS4 Game Disc. **Base game media mesh:** Existing shared disc/card geometry; no new board model per title.

| SKU | Additional game title | Genre | PCB / printed factory revision | Grade-8 reference | Rarity | Label and boot-art seed |
|---|---|---|---|---:|---|---|
| `FS4-025` | Nebula Drift: Overdrive | Racing | `Shared media mesh` | $24 | **Common** | Nebula Drift: Overdrive: leaning racing machines on a dramatic bend; neon cyan / purple |
| `FS4-026` | Crown of Embers: Forgotten Kings | Role-playing | `Shared media mesh` | $22 | **Common** | Crown  Embers: Forgotten Kings: a party facing a mysterious citadel; silver / violet |
| `FS4-027` | Nightfall Ranger: Blackout | Action Adventure | `Shared media mesh` | $77 | **Rare** | Nightfall Ranger: Blackout: hero confronting the central artifact or enemy; scarlet / steel gray |
| `FS4-028` | Tidal Rally: Horizon Coast | Racing | `Shared media mesh` | $17 | **Common** | Tidal Rally: Horizon Coast: leaning racing machines on a dramatic bend; lime / navy |
| `FS4-029` | Resident Scarecrow: Return | Survival Horror | `Shared media mesh` | $24 | **Common** | Resident Scarecrow: Return: ominous abandoned location illuminated by one lamp; lime / navy |
| `FS4-030` | The Hollow Moon Chronicles | Role-playing | `Shared media mesh` | $29 | **Common** | Hollow Moon Chronicles: a party facing a mysterious citadel; silver / violet |
| `FS4-031` | Blitz Arena: Legacy | Action Adventure | `Shared media mesh` | $55 | **Scarce** | Blitz Arena: Legacy: hero confronting the central artifact or enemy; electric yellow / deep indigo |
| `FS4-032` | The Last Sandwich of Us II | Action Adventure | `Shared media mesh` | $30 | **Common** | Last Sandwich  Us II: hero confronting the central artifact or enemy; moss green / antique ivory |
| `FS4-033` | Frostbound Colony | Strategy | `Shared media mesh` | $13 | **Common** | Frostbound Colony: miniature armies on a map with a commander silhouette; burnt orange / midnight teal |
| `FS4-034` | Mecha Samurai Wars | Fighting | `Shared media mesh` | $34 | **Uncommon** | Mecha Samurai Wars: two rivals squaring off under a neon sign; sky blue / aubergine |
| `FS4-035` | Neon City Heist | Stealth | `Shared media mesh` | $10 | **Common** | Neon City Heist: cloaked figure among security beams; rose / cobalt |
| `FS4-036` | Rocket League of Extraordinary Goats | Action Adventure | `Shared media mesh` | $64 | **Uncommon** | Rocket League  Extraordinary Goats: hero confronting the central artifact or enemy; neon cyan / purple |
| `FS4-037` | Gothic Garden Simulator | Simulation | `Shared media mesh` | $37 | **Common** | Gothic Garden Simulator: cutaway miniature world with controllable systems; neon cyan / purple |
| `FS4-038` | Castle of the Nine Keys HD | Action Adventure | `Shared media mesh` | $10 | **Common** | Castle   Nine Keys HD: hero confronting the central artifact or enemy; neon cyan / purple |
| `FS4-039` | Space Truckers: Warp Nine | Space Combat | `Shared media mesh` | $28 | **Common** | Space Truckers: Warp Nine: ships threading through glowing debris and laser fire; lime / navy |
| `FS4-040` | Infinite Thunder Raceway | Racing | `Shared media mesh` | $73 | **Scarce** | Infinite Thunder Raceway: leaning racing machines on a dramatic bend; amber / obsidian |
| `FS4-041` | Ghost Signal: Deep Space | Survival Horror | `Shared media mesh` | $31 | **Uncommon** | Ghost Signal: Deep Space: ominous abandoned location illuminated by one lamp; ice blue / charcoal |
| `FS4-042` | Pirate Kingdoms Online | Role-playing | `Shared media mesh` | $31 | **Scarce** | Pirate Kingdoms Online: a party facing a mysterious citadel; rose / cobalt |
| `FS4-043` | Zombie Harvest: Dead City | Survival Horror | `Shared media mesh` | $59 | **Uncommon** | Zombie Harvest: Dead City: ominous abandoned location illuminated by one lamp; amber / obsidian |
| `FS4-044` | Echoes of the Old Clock | Action Adventure | `Shared media mesh` | $20 | **Common** | Echoes   Old Clock: hero confronting the central artifact or enemy; ice blue / charcoal |
| `FS4-045` | Starship Salvage Society | Space Combat | `Shared media mesh` | $42 | **Common** | Starship Salvage Society: ships threading through glowing debris and laser fire; ice blue / charcoal |
| `FS4-046` | Swords of Duskfall | Role-playing | `Shared media mesh` | $32 | **Common** | Swords  Duskfall: a party facing a mysterious citadel; lime / navy |
| `FS4-047` | Detective Noir: Red Letter | Mystery | `Shared media mesh` | $12 | **Common** | Detective Noir: Red Letter: magnifying glass, photo board, and clues; sky blue / aubergine |
| `FS4-048` | Thunder Kart World Tour HD | Kart Racing | `Shared media mesh` | $19 | **Common** | Thunder Kart World Tour HD: cartoon machines drifting through a spectacular turn; sky blue / aubergine |
| `FS4-049` | Robo Raccoon Rumble HD | Platformer | `Shared media mesh` | $26 | **Common** | Robo Raccoon Rumble HD: towering platforms, animated hazards and a small determined hero; ice blue / charcoal |


### Funstation 5 (`FS5`) — 25 additional titles, 49 total

**Native media:** FS5 Game Disc. **Base game media mesh:** Existing shared disc/card geometry; no new board model per title.

| SKU | Additional game title | Genre | PCB / printed factory revision | Grade-8 reference | Rarity | Label and boot-art seed |
|---|---|---|---|---:|---|---|
| `FS5-025` | Crown of Embers: Ashes Reborn | Role-playing | `Shared media mesh` | $34 | **Uncommon** | Crown  Embers: Ashes Reborn: a party facing a mysterious citadel; moss green / antique ivory |
| `FS5-026` | Nightfall Ranger: The Reckoning | Action Adventure | `Shared media mesh` | $73 | **Scarce** | Nightfall Ranger:  Reckoning: hero confronting the central artifact or enemy; rose / cobalt |
| `FS5-027` | Pitch Perfect Soccer 26 | Sports | `Shared media mesh` | $62 | **Rare** | Pitch Perfect Soccer 26: athletes framed by huge arena floodlights; lime / navy |
| `FS5-028` | Tidal Rally 6 | Racing | `Shared media mesh` | $26 | **Common** | Tidal Rally 6: leaning racing machines on a dramatic bend; electric yellow / deep indigo |
| `FS5-029` | Hunters of the Hollow Moon II | Action Adventure | `Shared media mesh` | $19 | **Uncommon** | Hunters   Hollow Moon II: hero confronting the central artifact or enemy; jade / parchment |
| `FS5-030` | The Last Sandwich of Us III | Action Adventure | `Shared media mesh` | $38 | **Common** | Last Sandwich  Us III: hero confronting the central artifact or enemy; burnt orange / midnight teal |
| `FS5-031` | Resident Scarecrow: Final Harvest | Survival Horror | `Shared media mesh` | $40 | **Common** | Resident Scarecrow: Final Harvest: ominous abandoned location illuminated by one lamp; electric yellow / deep indigo |
| `FS5-032` | Nebula Drift: Overdrive | Racing | `Shared media mesh` | $21 | **Common** | Nebula Drift: Overdrive: leaning racing machines on a dramatic bend; moss green / antique ivory |
| `FS5-033` | Blitz Arena 2027 | Action Adventure | `Shared media mesh` | $29 | **Uncommon** | Blitz Arena 2027: hero confronting the central artifact or enemy; desert gold / royal blue |
| `FS5-034` | Mecha Samurai Wars II | Fighting | `Shared media mesh` | $37 | **Common** | Mecha Samurai Wars II: two rivals squaring off under a neon sign; rose / cobalt |
| `FS5-035` | Dragon Lantern: Reawakening | Role-playing | `Shared media mesh` | $27 | **Common** | Dragon Lantern: Reawakening: a party facing a mysterious citadel; burnt orange / midnight teal |
| `FS5-036` | Cosmic City Skylines 2 | Simulation | `Shared media mesh` | $42 | **Uncommon** | Cosmic City Skylines 2: cutaway miniature world with controllable systems; jade / parchment |
| `FS5-037` | Night Shift at the Aquarium III | Survival Horror | `Shared media mesh` | $41 | **Common** | Night Shift at  Aquarium III: ominous abandoned location illuminated by one lamp; ice blue / charcoal |
| `FS5-038` | Starship Laundry Commander 2 | Space Combat | `Shared media mesh` | $60 | **Scarce** | Starship Laundry Commander 2: ships threading through glowing debris and laser fire; electric yellow / deep indigo |
| `FS5-039` | Pirate Kart Grand Prix HD | Kart Racing | `Shared media mesh` | $8 | **Common** | Pirate Kart Grand Prix HD: cartoon machines drifting through a spectacular turn; silver / violet |
| `FS5-040` | Frostbound Colony: Aftermath | Strategy | `Shared media mesh` | $61 | **Uncommon** | Frostbound Colony: Aftermath: miniature armies on a map with a commander silhouette; rose / cobalt |
| `FS5-041` | Ghost Protocol Omega | Survival Horror | `Shared media mesh` | $27 | **Uncommon** | Ghost Protocol Omega: ominous abandoned location illuminated by one lamp; rose / cobalt |
| `FS5-042` | Supermarket Samurai: Reboot | Fighting | `Shared media mesh` | $33 | **Common** | Supermarket Samurai: Reboot: two rivals squaring off under a neon sign; ice blue / charcoal |
| `FS5-043` | Mystery of the Vanishing City | Mystery | `Shared media mesh` | $104 | **Rare** | Mystery   Vanishing City: magnifying glass, photo board, and clues; neon cyan / purple |
| `FS5-044` | Ironclad Frontier: Definitive | Strategy | `Shared media mesh` | $28 | **Common** | Ironclad Frontier: Definitive: miniature armies on a map with a commander silhouette; moss green / antique ivory |
| `FS5-045` | Dungeons and Doughnuts Ultimate | Action Adventure | `Shared media mesh` | $39 | **Common** | Dungeons  Doughnuts Ultimate: hero confronting the central artifact or enemy; burnt orange / midnight teal |
| `FS5-046` | Royal Road Rally Reborn | Racing | `Shared media mesh` | $40 | **Common** | Royal Road Rally Reborn: leaning racing machines on a dramatic bend; amber / obsidian |
| `FS5-047` | Robo Raccoon Rumble Next | Platformer | `Shared media mesh` | $60 | **Uncommon** | Robo Raccoon Rumble Next: towering platforms, animated hazards and a small determined hero; neon cyan / purple |
| `FS5-048` | Bounty Hunter's Day Off II | Action Adventure | `Shared media mesh` | $10 | **Common** | Bounty Hunter's Day Off II: hero confronting the central artifact or enemy; ice blue / charcoal |
| `FS5-049` | Chronicles of Ashen Valor II | Role-playing | `Shared media mesh` | $14 | **Common** | Chronicles  Ashen Valor II: a party facing a mysterious citadel; ice blue / charcoal |


### Sbox 1 (`SB1`) — 25 additional titles, 49 total

**Native media:** SB1 Game Disc. **Base game media mesh:** Existing shared disc/card geometry; no new board model per title.

| SKU | Additional game title | Genre | PCB / printed factory revision | Grade-8 reference | Rarity | Label and boot-art seed |
|---|---|---|---|---:|---|---|
| `SB1-025` | Dungeon Accountant Deluxe | Action Adventure | `Shared media mesh` | $60 | **Uncommon** | Dungeon Accountant Deluxe: hero confronting the central artifact or enemy; moss green / antique ivory |
| `SB1-026` | Ironclad Frontier: Classic | Strategy | `Shared media mesh` | $43 | **Uncommon** | Ironclad Frontier: Classic: miniature armies on a map with a commander silhouette; burnt orange / midnight teal |
| `SB1-027` | Kart Anarchy 2001 | Kart Racing | `Shared media mesh` | $14 | **Common** | Kart Anarchy 2001: cartoon machines drifting through a spectacular turn; burnt orange / midnight teal |
| `SB1-028` | Intergalactic Sandwich Wars | Strategy | `Shared media mesh` | $64 | **Uncommon** | Intergalactic Sandwich Wars: miniature armies on a map with a commander silhouette; ice blue / charcoal |
| `SB1-029` | Midnight Combat Command | Fighting | `Shared media mesh` | $28 | **Common** | Midnight Combat Command: two rivals squaring off under a neon sign; desert gold / royal blue |
| `SB1-030` | The Ancient Robo Revolt | Action Adventure | `Shared media mesh` | $29 | **Common** | Ancient Robo Revolt: hero confronting the central artifact or enemy; silver / violet |
| `SB1-031` | Starship Cargo Runners | Space Combat | `Shared media mesh` | $17 | **Uncommon** | Starship Cargo Runners: ships threading through glowing debris and laser fire; sky blue / aubergine |
| `SB1-032` | Brawler Street Championship | Fighting | `Shared media mesh` | $17 | **Common** | Brawler Street Championship: two rivals squaring off under a neon sign; desert gold / royal blue |
| `SB1-033` | Ghost Transit Authority | Survival Horror | `Shared media mesh` | $36 | **Common** | Ghost Transit Authority: ominous abandoned location illuminated by one lamp; ice blue / charcoal |
| `SB1-034` | Rainbow Six-ish: Paint Squad | Strategy | `Shared media mesh` | $41 | **Common** | Rainbow Six-ish: Paint Squad: miniature armies on a map with a commander silhouette; amber / obsidian |
| `SB1-035` | Alien Detective Agency | Mystery | `Shared media mesh` | $15 | **Common** | Alien Detective Agency: magnifying glass, photo board, and clues; amber / obsidian |
| `SB1-036` | Thunder Kart World Tour | Kart Racing | `Shared media mesh` | $26 | **Common** | Thunder Kart World Tour: cartoon machines drifting through a spectacular turn; jade / parchment |
| `SB1-037` | Medieval Office Simulator | Simulation | `Shared media mesh` | $17 | **Common** | Medieval Office Simulator: cutaway miniature world with controllable systems; moss green / antique ivory |
| `SB1-038` | Knight's Lunch Break | Role-playing | `Shared media mesh` | $38 | **Common** | Knight's Lunch Break: a party facing a mysterious citadel; lime / navy |
| `SB1-039` | Deep Ocean Discovery | Rhythm | `Shared media mesh` | $12 | **Common** | Deep Ocean Discovery: booming sound waves, stage lights, and musical controls; electric yellow / deep indigo |
| `SB1-040` | Road Rage Delivery Service | Racing | `Shared media mesh` | $29 | **Common** | Road Rage Delivery Service: leaning racing machines on a dramatic bend; scarlet / steel gray |
| `SB1-041` | Jungle Commandos Alpha | Strategy | `Shared media mesh` | $32 | **Uncommon** | Jungle Commandos Alpha: miniature armies on a map with a commander silhouette; silver / violet |
| `SB1-042` | Blitz Arena: Classic | Action Adventure | `Shared media mesh` | $35 | **Uncommon** | Blitz Arena: Classic: hero confronting the central artifact or enemy; desert gold / royal blue |
| `SB1-043` | Tactical Teapot Operations | Strategy | `Shared media mesh` | $52 | **Scarce** | Tactical Teapot Operations: miniature armies on a map with a commander silhouette; neon cyan / purple |
| `SB1-044` | Underground Street Soccer | Sports | `Shared media mesh` | $75 | **Scarce** | Underground Street Soccer: athletes framed by huge arena floodlights; lime / navy |
| `SB1-045` | The Lost Kingdom Protocol | Role-playing | `Shared media mesh` | $18 | **Common** | Lost Kingdom Protocol: a party facing a mysterious citadel; burnt orange / midnight teal |
| `SB1-046` | Panicsonnet Music Revolution | Rhythm | `Shared media mesh` | $32 | **Uncommon** | Panicsonnet Music Revolution: booming sound waves, stage lights, and musical controls; silver / violet |
| `SB1-047` | Space Truckers CD | Space Combat | `Shared media mesh` | $19 | **Common** | Space Truckers CD: ships threading through glowing debris and laser fire; electric yellow / deep indigo |
| `SB1-048` | Zombie Harvest: Origins | Survival Horror | `Shared media mesh` | $14 | **Common** | Zombie Harvest: Origins: ominous abandoned location illuminated by one lamp; rose / cobalt |
| `SB1-049` | Highway Patrol Pursuit | Racing | `Shared media mesh` | $30 | **Common** | Highway Patrol Pursuit: leaning racing machines on a dramatic bend; electric yellow / deep indigo |


### Sbox 2 (`SB2`) — 25 additional titles, 49 total

**Native media:** SB2 Game Disc. **Base game media mesh:** Existing shared disc/card geometry; no new board model per title.

| SKU | Additional game title | Genre | PCB / printed factory revision | Grade-8 reference | Rarity | Label and boot-art seed |
|---|---|---|---|---:|---|---|
| `SB2-025` | Dungeon Accountant Deluxe | Action Adventure | `Shared media mesh` | $63 | **Uncommon** | Dungeon Accountant Deluxe: hero confronting the central artifact or enemy; rose / cobalt |
| `SB2-026` | Ironclad Frontier II | Strategy | `Shared media mesh` | $8 | **Common** | Ironclad Frontier II: miniature armies on a map with a commander silhouette; silver / violet |
| `SB2-027` | Apex Drift: Old School | Racing | `Shared media mesh` | $32 | **Uncommon** | Apex Drift: Old School: leaning racing machines on a dramatic bend; ice blue / charcoal |
| `SB2-028` | Zombie Harvest: Quarantine | Survival Horror | `Shared media mesh` | $41 | **Common** | Zombie Harvest: Quarantine: ominous abandoned location illuminated by one lamp; electric yellow / deep indigo |
| `SB2-029` | Starfarer Legacy: Prologue | Space Combat | `Shared media mesh` | $48 | **Scarce** | Starfarer Legacy: Prologue: ships threading through glowing debris and laser fire; ice blue / charcoal |
| `SB2-030` | Blitz Arena: Championship | Action Adventure | `Shared media mesh` | $18 | **Common** | Blitz Arena: Championship: hero confronting the central artifact or enemy; sky blue / aubergine |
| `SB2-031` | Alien Bathroom Invasion | Space Combat | `Shared media mesh` | $45 | **Uncommon** | Alien Bathroom Invasion: ships threading through glowing debris and laser fire; ice blue / charcoal |
| `SB2-032` | Road Rage Delivery Service 2 | Racing | `Shared media mesh` | $14 | **Common** | Road Rage Delivery Service 2: leaning racing machines on a dramatic bend; desert gold / royal blue |
| `SB2-033` | Thunder Kart World Tour | Kart Racing | `Shared media mesh` | $37 | **Common** | Thunder Kart World Tour: cartoon machines drifting through a spectacular turn; electric yellow / deep indigo |
| `SB2-034` | Tactical Typhoon Delta | Strategy | `Shared media mesh` | $69 | **Scarce** | Tactical Typhoon Delta: miniature armies on a map with a commander silhouette; silver / violet |
| `SB2-035` | Ghost Signal: Silent Hilltop | Survival Horror | `Shared media mesh` | $13 | **Common** | Ghost Signal: Silent Hilltop: ominous abandoned location illuminated by one lamp; amber / obsidian |
| `SB2-036` | Crown of Embers: Prelude | Role-playing | `Shared media mesh` | $41 | **Common** | Crown  Embers: Prelude: a party facing a mysterious citadel; amber / obsidian |
| `SB2-037` | Space Truckers: Outer Limits | Space Combat | `Shared media mesh` | $37 | **Common** | Space Truckers: Outer Limits: ships threading through glowing debris and laser fire; sky blue / aubergine |
| `SB2-038` | Ninja Grocery Rampage | Stealth | `Shared media mesh` | $35 | **Common** | Ninja Grocery Rampage: cloaked figure among security beams; neon cyan / purple |
| `SB2-039` | Mecha Beetle Revolution | Action Adventure | `Shared media mesh` | $106 | **Very Rare** | Mecha Beetle Revolution: hero confronting the central artifact or enemy; scarlet / steel gray |
| `SB2-040` | Bounty Hunter's Day Off | Action Adventure | `Shared media mesh` | $44 | **Uncommon** | Bounty Hunter's Day Off: hero confronting the central artifact or enemy; desert gold / royal blue |
| `SB2-041` | Mystery of Black Hollow | Mystery | `Shared media mesh` | $86 | **Rare** | Mystery  Black Hollow: magnifying glass, photo board, and clues; silver / violet |
| `SB2-042` | The Last Robot Stand | Action Adventure | `Shared media mesh` | $53 | **Rare** | Last Robot Stand: hero confronting the central artifact or enemy; amber / obsidian |
| `SB2-043` | Fortress of the Paper King | Action Adventure | `Shared media mesh` | $24 | **Common** | Fortress   Paper King: hero confronting the central artifact or enemy; burnt orange / midnight teal |
| `SB2-044` | Underwater Bowling League | Sports | `Shared media mesh` | $22 | **Common** | Underwater Bowling League: athletes framed by huge arena floodlights; silver / violet |
| `SB2-045` | Dragon Lantern Legacy | Role-playing | `Shared media mesh` | $39 | **Common** | Dragon Lantern Legacy: a party facing a mysterious citadel; silver / violet |
| `SB2-046` | Escape from Retail Hell | Action Adventure | `Shared media mesh` | $60 | **Scarce** | Escape from Retail Hell: hero confronting the central artifact or enemy; ice blue / charcoal |
| `SB2-047` | Swords and Sandwiches II | Role-playing | `Shared media mesh` | $41 | **Common** | Swords  Sandwiches II: a party facing a mysterious citadel; rose / cobalt |
| `SB2-048` | Jungle Firestorm Assault | Exploration | `Shared media mesh` | $29 | **Common** | Jungle Firestorm Assault: forbidden entrance surrounded by travel gear and unknown symbols; electric yellow / deep indigo |
| `SB2-049` | Urban Football Underground | Sports | `Shared media mesh` | $15 | **Common** | Urban Football Underground: athletes framed by huge arena floodlights; sky blue / aubergine |


### Sbox 720 (`SB720`) — 25 additional titles, 49 total

**Native media:** SB720 Game Disc. **Base game media mesh:** Existing shared disc/card geometry; no new board model per title.

| SKU | Additional game title | Genre | PCB / printed factory revision | Grade-8 reference | Rarity | Label and boot-art seed |
|---|---|---|---|---:|---|---|
| `SB720-025` | Ironclad Frontier: Lost Frontiers | Strategy | `Shared media mesh` | $42 | **Common** | Ironclad Frontier: Lost Frontiers: miniature armies on a map with a commander silhouette; jade / parchment |
| `SB720-026` | Apex Drift 720: Afterburn | Racing | `Shared media mesh` | $17 | **Uncommon** | Apex Drift 720: Afterburn: leaning racing machines on a dramatic bend; desert gold / royal blue |
| `SB720-027` | Zombie Harvest: The Outbreak | Survival Horror | `Shared media mesh` | $130 | **Very Rare** | Zombie Harvest:  Outbreak: ominous abandoned location illuminated by one lamp; scarlet / steel gray |
| `SB720-028` | Starfarer Legacy: First Contact | Space Combat | `Shared media mesh` | $56 | **Uncommon** | Starfarer Legacy: First Contact: ships threading through glowing debris and laser fire; burnt orange / midnight teal |
| `SB720-029` | Blitz Arena: Blackout | Action Adventure | `Shared media mesh` | $29 | **Scarce** | Blitz Arena: Blackout: hero confronting the central artifact or enemy; neon cyan / purple |
| `SB720-030` | The Hollow Mountain Curse | Action Adventure | `Shared media mesh` | $22 | **Common** | Hollow Mountain Curse: hero confronting the central artifact or enemy; desert gold / royal blue |
| `SB720-031` | Thunder Kart World Tour HD | Kart Racing | `Shared media mesh` | $31 | **Common** | Thunder Kart World Tour HD: cartoon machines drifting through a spectacular turn; scarlet / steel gray |
| `SB720-032` | Robo Raccoon Rumble HD | Platformer | `Shared media mesh` | $72 | **Rare** | Robo Raccoon Rumble HD: towering platforms, animated hazards and a small determined hero; sky blue / aubergine |
| `SB720-033` | Ghost Protocol Omega | Survival Horror | `Shared media mesh` | $52 | **Scarce** | Ghost Protocol Omega: ominous abandoned location illuminated by one lamp; rose / cobalt |
| `SB720-034` | Space Truckers: Warp Nine | Space Combat | `Shared media mesh` | $26 | **Uncommon** | Space Truckers: Warp Nine: ships threading through glowing debris and laser fire; silver / violet |
| `SB720-035` | Tidal Rally: Horizon Coast | Racing | `Shared media mesh` | $30 | **Common** | Tidal Rally: Horizon Coast: leaning racing machines on a dramatic bend; amber / obsidian |
| `SB720-036` | Crown of Embers: Prelude | Role-playing | `Shared media mesh` | $29 | **Common** | Crown  Embers: Prelude: a party facing a mysterious citadel; neon cyan / purple |
| `SB720-037` | Nightfall Ranger: Origins | Action Adventure | `Shared media mesh` | $65 | **Uncommon** | Nightfall Ranger: Origins: hero confronting the central artifact or enemy; electric yellow / deep indigo |
| `SB720-038` | Mecha Beetle Armageddon | Action Adventure | `Shared media mesh` | $29 | **Common** | Mecha Beetle Armageddon: hero confronting the central artifact or enemy; moss green / antique ivory |
| `SB720-039` | Deep Space Dishwasher | Space Combat | `Shared media mesh` | $31 | **Common** | Deep Space Dishwasher: ships threading through glowing debris and laser fire; lime / navy |
| `SB720-040` | Tactical Robot Command | Strategy | `Shared media mesh` | $18 | **Common** | Tactical Robot Command: miniature armies on a map with a commander silhouette; ice blue / charcoal |
| `SB720-041` | Frostbound Colony | Strategy | `Shared media mesh` | $34 | **Common** | Frostbound Colony: miniature armies on a map with a commander silhouette; lime / navy |
| `SB720-042` | Disco Detective HD | Mystery | `Shared media mesh` | $29 | **Common** | Disco Detective HD: magnifying glass, photo board, and clues; electric yellow / deep indigo |
| `SB720-043` | Clockwork Kingdom Quest | Role-playing | `Shared media mesh` | $98 | **Rare** | Clockwork Kingdom Quest: a party facing a mysterious citadel; electric yellow / deep indigo |
| `SB720-044` | Ninja Grocery Rampage 3 | Stealth | `Shared media mesh` | $17 | **Common** | Ninja Grocery Rampage 3: cloaked figure among security beams; lime / navy |
| `SB720-045` | Street Skater: Grind City | Platformer | `Shared media mesh` | $47 | **Uncommon** | Street Skater: Grind City: towering platforms, animated hazards and a small determined hero; jade / parchment |
| `SB720-046` | Royal Road Rally | Racing | `Shared media mesh` | $16 | **Common** | Royal Road Rally: leaning racing machines on a dramatic bend; rose / cobalt |
| `SB720-047` | Resident Scarecrow: Return | Survival Horror | `Shared media mesh` | $34 | **Common** | Resident Scarecrow: Return: ominous abandoned location illuminated by one lamp; lime / navy |
| `SB720-048` | Moonlit Quest: Reborn | Role-playing | `Shared media mesh` | $79 | **Scarce** | Moonlit Quest: Reborn: a party facing a mysterious citadel; amber / obsidian |
| `SB720-049` | The Last Sandwich of Us | Action Adventure | `Shared media mesh` | $46 | **Uncommon** | Last Sandwich  Us: hero confronting the central artifact or enemy; ice blue / charcoal |


### Sbox 10 (`SB10`) — 25 additional titles, 49 total

**Native media:** SB10 Game Disc. **Base game media mesh:** Existing shared disc/card geometry; no new board model per title.

| SKU | Additional game title | Genre | PCB / printed factory revision | Grade-8 reference | Rarity | Label and boot-art seed |
|---|---|---|---|---:|---|---|
| `SB10-025` | Nebula Drift: Overdrive | Racing | `Shared media mesh` | $65 | **Uncommon** | Nebula Drift: Overdrive: leaning racing machines on a dramatic bend; rose / cobalt |
| `SB10-026` | Ironclad Frontier: Black Horizon | Strategy | `Shared media mesh` | $19 | **Uncommon** | Ironclad Frontier: Black Horizon: miniature armies on a map with a commander silhouette; jade / parchment |
| `SB10-027` | Apex Drift X: Prologue | Racing | `Shared media mesh` | $34 | **Scarce** | Apex Drift X: Prologue: leaning racing machines on a dramatic bend; amber / obsidian |
| `SB10-028` | Zombie Harvest 4 | Survival Horror | `Shared media mesh` | $32 | **Common** | Zombie Harvest 4: ominous abandoned location illuminated by one lamp; amber / obsidian |
| `SB10-029` | Starfarer Legacy: The Rift | Space Combat | `Shared media mesh` | $33 | **Scarce** | Starfarer Legacy:  Rift: ships threading through glowing debris and laser fire; moss green / antique ivory |
| `SB10-030` | Blitz Arena: Legends | Role-playing | `Shared media mesh` | $12 | **Common** | Blitz Arena: Legends: a party facing a mysterious citadel; desert gold / royal blue |
| `SB10-031` | Crown of Embers: Exile | Role-playing | `Shared media mesh` | $78 | **Rare** | Crown  Embers: Exile: a party facing a mysterious citadel; lime / navy |
| `SB10-032` | Nightfall Ranger: Blackout | Action Adventure | `Shared media mesh` | $17 | **Common** | Nightfall Ranger: Blackout: hero confronting the central artifact or enemy; ice blue / charcoal |
| `SB10-033` | Tidal Rally 6 | Racing | `Shared media mesh` | $39 | **Uncommon** | Tidal Rally 6: leaning racing machines on a dramatic bend; rose / cobalt |
| `SB10-034` | Frostbound Colony: Aftermath | Strategy | `Shared media mesh` | $15 | **Common** | Frostbound Colony: Aftermath: miniature armies on a map with a commander silhouette; rose / cobalt |
| `SB10-035` | Mecha Samurai Wars | Fighting | `Shared media mesh` | $17 | **Common** | Mecha Samurai Wars: two rivals squaring off under a neon sign; sky blue / aubergine |
| `SB10-036` | Undersea Empire Rising | Strategy | `Shared media mesh` | $25 | **Common** | Undersea Empire Rising: miniature armies on a map with a commander silhouette; scarlet / steel gray |
| `SB10-037` | Resident Scarecrow: Final Harvest | Survival Horror | `Shared media mesh` | $29 | **Common** | Resident Scarecrow: Final Harvest: ominous abandoned location illuminated by one lamp; neon cyan / purple |
| `SB10-038` | Robo Raccoon Rumble Next | Platformer | `Shared media mesh` | $17 | **Common** | Robo Raccoon Rumble Next: towering platforms, animated hazards and a small determined hero; sky blue / aubergine |
| `SB10-039` | Ghost Signal: Deep Space | Survival Horror | `Shared media mesh` | $48 | **Uncommon** | Ghost Signal: Deep Space: ominous abandoned location illuminated by one lamp; scarlet / steel gray |
| `SB10-040` | The Last Sandwich of Us II | Action Adventure | `Shared media mesh` | $23 | **Uncommon** | Last Sandwich  Us II: hero confronting the central artifact or enemy; amber / obsidian |
| `SB10-041` | Storm Riders Championship | Action Adventure | `Shared media mesh` | $127 | **Very Rare** | Storm Riders Championship: hero confronting the central artifact or enemy; moss green / antique ivory |
| `SB10-042` | Space Truckers: Warp Nine | Space Combat | `Shared media mesh` | $32 | **Uncommon** | Space Truckers: Warp Nine: ships threading through glowing debris and laser fire; amber / obsidian |
| `SB10-043` | Dungeon Accountant: Audit Day | Action Adventure | `Shared media mesh` | $32 | **Common** | Dungeon Accountant: Audit Day: hero confronting the central artifact or enemy; neon cyan / purple |
| `SB10-044` | Mystery of the Vanishing City | Mystery | `Shared media mesh` | $54 | **Uncommon** | Mystery   Vanishing City: magnifying glass, photo board, and clues; rose / cobalt |
| `SB10-045` | Robot Uprising: Deluxe | Action Adventure | `Shared media mesh` | $49 | **Uncommon** | Robot Uprising: Deluxe: hero confronting the central artifact or enemy; sky blue / aubergine |
| `SB10-046` | Deep Ocean Discovery II | Rhythm | `Shared media mesh` | $31 | **Common** | Deep Ocean Discovery II: booming sound waves, stage lights, and musical controls; burnt orange / midnight teal |
| `SB10-047` | Ninja Grocery Rampage 4 | Stealth | `Shared media mesh` | $29 | **Uncommon** | Ninja Grocery Rampage 4: cloaked figure among security beams; rose / cobalt |
| `SB10-048` | Royal Road Rally Reborn | Racing | `Shared media mesh` | $22 | **Common** | Royal Road Rally Reborn: leaning racing machines on a dramatic bend; sky blue / aubergine |
| `SB10-049` | Chronicles of Ashen Valor II | Role-playing | `Shared media mesh` | $36 | **Common** | Chronicles  Ashen Valor II: a party facing a mysterious citadel; scarlet / steel gray |


### Sbox S (`SBS`) — 25 additional titles, 49 total

**Native media:** SBS Game Disc. **Base game media mesh:** Existing shared disc/card geometry; no new board model per title.

| SKU | Additional game title | Genre | PCB / printed factory revision | Grade-8 reference | Rarity | Label and boot-art seed |
|---|---|---|---|---:|---|---|
| `SBS-025` | Nebula Drift: Overdrive | Racing | `Shared media mesh` | $31 | **Uncommon** | Nebula Drift: Overdrive: leaning racing machines on a dramatic bend; electric yellow / deep indigo |
| `SBS-026` | Apex Drift: Compact Series | Racing | `Shared media mesh` | $25 | **Common** | Apex Drift: Compact Series: leaning racing machines on a dramatic bend; burnt orange / midnight teal |
| `SBS-027` | Starfarer Legacy: Side Mission | Space Combat | `Shared media mesh` | $10 | **Common** | Starfarer Legacy: Side Mission: ships threading through glowing debris and laser fire; amber / obsidian |
| `SBS-028` | Zombie Harvest: Pocket Edition | Survival Horror | `Shared media mesh` | $27 | **Common** | Zombie Harvest: Pocket Edition: ominous abandoned location illuminated by one lamp; electric yellow / deep indigo |
| `SBS-029` | Blitz Arena: Arcade Circuit | Action Adventure | `Shared media mesh` | $20 | **Common** | Blitz Arena: Arcade Circuit: hero confronting the central artifact or enemy; burnt orange / midnight teal |
| `SBS-030` | Robot Uprising: Deluxe | Action Adventure | `Shared media mesh` | $29 | **Scarce** | Robot Uprising: Deluxe: hero confronting the central artifact or enemy; ice blue / charcoal |
| `SBS-031` | Deep Ocean Discovery II | Rhythm | `Shared media mesh` | $18 | **Common** | Deep Ocean Discovery II: booming sound waves, stage lights, and musical controls; burnt orange / midnight teal |
| `SBS-032` | Storm Riders Championship | Action Adventure | `Shared media mesh` | $34 | **Common** | Storm Riders Championship: hero confronting the central artifact or enemy; electric yellow / deep indigo |
| `SBS-033` | Space Truckers: Warp Nine | Space Combat | `Shared media mesh` | $27 | **Common** | Space Truckers: Warp Nine: ships threading through glowing debris and laser fire; neon cyan / purple |
| `SBS-034` | Mecha Samurai Wars | Fighting | `Shared media mesh` | $57 | **Uncommon** | Mecha Samurai Wars: two rivals squaring off under a neon sign; ice blue / charcoal |
| `SBS-035` | Robo Raccoon Rumble Next | Platformer | `Shared media mesh` | $46 | **Uncommon** | Robo Raccoon Rumble Next: towering platforms, animated hazards and a small determined hero; burnt orange / midnight teal |
| `SBS-036` | Tidal Rally: Horizon Coast | Racing | `Shared media mesh` | $53 | **Uncommon** | Tidal Rally: Horizon Coast: leaning racing machines on a dramatic bend; scarlet / steel gray |
| `SBS-037` | Crown of Embers: Forgotten Kings | Role-playing | `Shared media mesh` | $40 | **Common** | Crown  Embers: Forgotten Kings: a party facing a mysterious citadel; ice blue / charcoal |
| `SBS-038` | Frostbound Colony | Strategy | `Shared media mesh` | $12 | **Common** | Frostbound Colony: miniature armies on a map with a commander silhouette; sky blue / aubergine |
| `SBS-039` | Resident Scarecrow: Return | Survival Horror | `Shared media mesh` | $26 | **Common** | Resident Scarecrow: Return: ominous abandoned location illuminated by one lamp; ice blue / charcoal |
| `SBS-040` | Mystery of the Vanishing City | Mystery | `Shared media mesh` | $27 | **Common** | Mystery   Vanishing City: magnifying glass, photo board, and clues; moss green / antique ivory |
| `SBS-041` | Dungeon Accountant: Audit Day | Action Adventure | `Shared media mesh` | $30 | **Common** | Dungeon Accountant: Audit Day: hero confronting the central artifact or enemy; sky blue / aubergine |
| `SBS-042` | Chronicles of Ashen Valor | Role-playing | `Shared media mesh` | $34 | **Common** | Chronicles  Ashen Valor: a party facing a mysterious citadel; ice blue / charcoal |
| `SBS-043` | Ghost Signal: Deep Space | Survival Horror | `Shared media mesh` | $8 | **Common** | Ghost Signal: Deep Space: ominous abandoned location illuminated by one lamp; rose / cobalt |
| `SBS-044` | Pirate Kart Grand Prix HD | Kart Racing | `Shared media mesh` | $11 | **Common** | Pirate Kart Grand Prix HD: cartoon machines drifting through a spectacular turn; rose / cobalt |
| `SBS-045` | Ninja Grocery Rampage 4 | Stealth | `Shared media mesh` | $10 | **Common** | Ninja Grocery Rampage 4: cloaked figure among security beams; sky blue / aubergine |
| `SBS-046` | Castle of the Nine Keys HD | Action Adventure | `Shared media mesh` | $28 | **Common** | Castle   Nine Keys HD: hero confronting the central artifact or enemy; jade / parchment |
| `SBS-047` | Night Shift at the Aquarium II | Survival Horror | `Shared media mesh` | $41 | **Uncommon** | Night Shift at  Aquarium II: ominous abandoned location illuminated by one lamp; moss green / antique ivory |
| `SBS-048` | The Last Sandwich of Us II | Action Adventure | `Shared media mesh` | $18 | **Uncommon** | Last Sandwich  Us II: hero confronting the central artifact or enemy; electric yellow / deep indigo |
| `SBS-049` | Bounty Hunter's Day Off II | Action Adventure | `Shared media mesh` | $20 | **Common** | Bounty Hunter's Day Off II: hero confronting the central artifact or enemy; burnt orange / midnight teal |


### Sbox One X (`SB1X`) — 25 additional titles, 49 total

**Native media:** SB1X Game Disc. **Base game media mesh:** Existing shared disc/card geometry; no new board model per title.

| SKU | Additional game title | Genre | PCB / printed factory revision | Grade-8 reference | Rarity | Label and boot-art seed |
|---|---|---|---|---:|---|---|
| `SB1X-025` | Ironclad Frontier: Siegefall | Strategy | `Shared media mesh` | $20 | **Common** | Ironclad Frontier: Siegefall: miniature armies on a map with a commander silhouette; scarlet / steel gray |
| `SB1X-026` | Apex Drift X2 | Racing | `Shared media mesh` | $23 | **Common** | Apex Drift X2: leaning racing machines on a dramatic bend; desert gold / royal blue |
| `SB1X-027` | Zombie Harvest 4 | Survival Horror | `Shared media mesh` | $8 | **Common** | Zombie Harvest 4: ominous abandoned location illuminated by one lamp; scarlet / steel gray |
| `SB1X-028` | Starfarer Legacy: New Dawn | Space Combat | `Shared media mesh` | $21 | **Common** | Starfarer Legacy: New Dawn: ships threading through glowing debris and laser fire; amber / obsidian |
| `SB1X-029` | Blitz Arena 2027 | Action Adventure | `Shared media mesh` | $39 | **Common** | Blitz Arena 2027: hero confronting the central artifact or enemy; neon cyan / purple |
| `SB1X-030` | Nebula Drift: Overdrive | Racing | `Shared media mesh` | $29 | **Common** | Nebula Drift: Overdrive: leaning racing machines on a dramatic bend; electric yellow / deep indigo |
| `SB1X-031` | Crown of Embers: Ashes Reborn | Role-playing | `Shared media mesh` | $41 | **Uncommon** | Crown  Embers: Ashes Reborn: a party facing a mysterious citadel; jade / parchment |
| `SB1X-032` | Nightfall Ranger: The Reckoning | Action Adventure | `Shared media mesh` | $79 | **Scarce** | Nightfall Ranger:  Reckoning: hero confronting the central artifact or enemy; neon cyan / purple |
| `SB1X-033` | Tidal Rally 6 | Racing | `Shared media mesh` | $24 | **Common** | Tidal Rally 6: leaning racing machines on a dramatic bend; rose / cobalt |
| `SB1X-034` | Hunters of the Hollow Moon II | Action Adventure | `Shared media mesh` | $72 | **Scarce** | Hunters   Hollow Moon II: hero confronting the central artifact or enemy; ice blue / charcoal |
| `SB1X-035` | Mecha Samurai Wars II | Fighting | `Shared media mesh` | $17 | **Common** | Mecha Samurai Wars II: two rivals squaring off under a neon sign; neon cyan / purple |
| `SB1X-036` | Resident Scarecrow: Final Harvest | Survival Horror | `Shared media mesh` | $33 | **Common** | Resident Scarecrow: Final Harvest: ominous abandoned location illuminated by one lamp; ice blue / charcoal |
| `SB1X-037` | Ghost Protocol Omega | Survival Horror | `Shared media mesh` | $33 | **Scarce** | Ghost Protocol Omega: ominous abandoned location illuminated by one lamp; scarlet / steel gray |
| `SB1X-038` | Frostbound Colony: Aftermath | Strategy | `Shared media mesh` | $12 | **Common** | Frostbound Colony: Aftermath: miniature armies on a map with a commander silhouette; scarlet / steel gray |
| `SB1X-039` | The Last Sandwich of Us III | Action Adventure | `Shared media mesh` | $37 | **Common** | Last Sandwich  Us III: hero confronting the central artifact or enemy; jade / parchment |
| `SB1X-040` | Robo Raccoon Rumble Next | Platformer | `Shared media mesh` | $8 | **Common** | Robo Raccoon Rumble Next: towering platforms, animated hazards and a small determined hero; rose / cobalt |
| `SB1X-041` | Dungeon Accountant: Audit Day | Action Adventure | `Shared media mesh` | $40 | **Common** | Dungeon Accountant: Audit Day: hero confronting the central artifact or enemy; moss green / antique ivory |
| `SB1X-042` | Space Truckers: Warp Nine | Space Combat | `Shared media mesh` | $32 | **Common** | Space Truckers: Warp Nine: ships threading through glowing debris and laser fire; amber / obsidian |
| `SB1X-043` | Ninja Grocery Rampage 4 | Stealth | `Shared media mesh` | $10 | **Common** | Ninja Grocery Rampage 4: cloaked figure among security beams; sky blue / aubergine |
| `SB1X-044` | The Great Orbital Heist | Space Combat | `Shared media mesh` | $198 | **Collector** | Great Orbital Heist: ships threading through glowing debris and laser fire; silver / violet |
| `SB1X-045` | Cosmic City Skylines 2 | Simulation | `Shared media mesh` | $57 | **Uncommon** | Cosmic City Skylines 2: cutaway miniature world with controllable systems; lime / navy |
| `SB1X-046` | Thunder Kart World Tour HD | Kart Racing | `Shared media mesh` | $57 | **Scarce** | Thunder Kart World Tour HD: cartoon machines drifting through a spectacular turn; rose / cobalt |
| `SB1X-047` | Pirate Kingdoms Online | Role-playing | `Shared media mesh` | $32 | **Uncommon** | Pirate Kingdoms Online: a party facing a mysterious citadel; sky blue / aubergine |
| `SB1X-048` | Royal Road Rally Reborn | Racing | `Shared media mesh` | $28 | **Common** | Royal Road Rally Reborn: leaning racing machines on a dramatic bend; scarlet / steel gray |
| `SB1X-049` | The Clockwork Seas | Action Adventure | `Shared media mesh` | $37 | **Uncommon** | Clockwork Seas: hero confronting the central artifact or enemy; scarlet / steel gray |


### Bintendo Pyramid (`PYRAMID`) — 25 additional titles, 49 total

**Native media:** Bintendo Mini-Disc. **Base game media mesh:** Existing shared disc/card geometry; no new board model per title.

| SKU | Additional game title | Genre | PCB / printed factory revision | Grade-8 reference | Rarity | Label and boot-art seed |
|---|---|---|---|---:|---|---|
| `PYRAMID-025` | Pyramid Plumbers: Tomb Rush | Platformer | `Shared media mesh` | $43 | **Uncommon** | Pyramid Plumbers: Tomb Rush: towering platforms, animated hazards and a small determined hero; electric yellow / deep indigo |
| `PYRAMID-026` | Thunder Kart World Tour | Kart Racing | `Shared media mesh` | $23 | **Common** | Thunder Kart World Tour: cartoon machines drifting through a spectacular turn; rose / cobalt |
| `PYRAMID-027` | The Legend of the Sandy Trifecta | Role-playing | `Shared media mesh` | $30 | **Common** | Legend   Sandy Trifecta: a party facing a mysterious citadel; burnt orange / midnight teal |
| `PYRAMID-028` | Mummy Kart Madness | Kart Racing | `Shared media mesh` | $20 | **Uncommon** | Mummy Kart Madness: cartoon machines drifting through a spectacular turn; scarlet / steel gray |
| `PYRAMID-029` | Robo Raccoon Rumble Orb | Platformer | `Shared media mesh` | $11 | **Common** | Robo Raccoon Rumble Orb: towering platforms, animated hazards and a small determined hero; neon cyan / purple |
| `PYRAMID-030` | Crystal Caper Chronicles HD | Role-playing | `Shared media mesh` | $20 | **Common** | Crystal Caper Chronicles HD: a party facing a mysterious citadel; amber / obsidian |
| `PYRAMID-031` | Pharaoh's Last Pizza | Action Adventure | `Shared media mesh` | $16 | **Common** | Pharaoh's Last Pizza: hero confronting the central artifact or enemy; burnt orange / midnight teal |
| `PYRAMID-032` | Sandstorm Samurai | Fighting | `Shared media mesh` | $14 | **Common** | Sandstorm Samurai: two rivals squaring off under a neon sign; sky blue / aubergine |
| `PYRAMID-033` | Solar Sphinx Soccer | Sports | `Shared media mesh` | $50 | **Uncommon** | Solar Sphinx Soccer: athletes framed by huge arena floodlights; amber / obsidian |
| `PYRAMID-034` | Nile River Ninja | Stealth | `Shared media mesh` | $107 | **Rare** | Nile River Ninja: cloaked figure among security beams; scarlet / steel gray |
| `PYRAMID-035` | Tomb Raiders of the Lost Lunch | Action Adventure | `Shared media mesh` | $17 | **Common** | Tomb Raiders   Lost Lunch: hero confronting the central artifact or enemy; neon cyan / purple |
| `PYRAMID-036` | Hieroglyphic Hero Quest | Role-playing | `Shared media mesh` | $47 | **Scarce** | Hieroglyphic Hero Quest: a party facing a mysterious citadel; silver / violet |
| `PYRAMID-037` | The Great Pyramid Heist | Stealth | `Shared media mesh` | $17 | **Common** | Great Pyramid Heist: cloaked figure among security beams; moss green / antique ivory |
| `PYRAMID-038` | Anubis Goes Bowling | Sports | `Shared media mesh` | $31 | **Common** | Anubis Goes Bowling: athletes framed by huge arena floodlights; burnt orange / midnight teal |
| `PYRAMID-039` | Chronicles of the Sun Jewel | Role-playing | `Shared media mesh` | $32 | **Common** | Chronicles   Sun Jewel: a party facing a mysterious citadel; moss green / antique ivory |
| `PYRAMID-040` | Ghosts of Giza Plaza | Survival Horror | `Shared media mesh` | $24 | **Common** | Ghosts  Giza Plaza: ominous abandoned location illuminated by one lamp; jade / parchment |
| `PYRAMID-041` | Desert Dragon Derby | Role-playing | `Shared media mesh` | $17 | **Common** | Desert Dragon Derby: a party facing a mysterious citadel; rose / cobalt |
| `PYRAMID-042` | Mystic Marble Mania | Action Adventure | `Shared media mesh` | $59 | **Rare** | Mystic Marble Mania: hero confronting the central artifact or enemy; scarlet / steel gray |
| `PYRAMID-043` | Treasure Trap Builders | Simulation | `Shared media mesh` | $26 | **Common** | Treasure Trap Builders: cutaway miniature world with controllable systems; scarlet / steel gray |
| `PYRAMID-044` | Mummy's Moonlight Mystery | Mystery | `Shared media mesh` | $87 | **Rare** | Mummy's Moonlight Mystery: magnifying glass, photo board, and clues; lime / navy |
| `PYRAMID-045` | The Sphinx Files II | Exploration | `Shared media mesh` | $37 | **Common** | Sphinx Files II: forbidden entrance surrounded by travel gear and unknown symbols; silver / violet |
| `PYRAMID-046` | Sarcophagus Kart Cup | Kart Racing | `Shared media mesh` | $26 | **Common** | Sarcophagus Kart Cup: cartoon machines drifting through a spectacular turn; electric yellow / deep indigo |
| `PYRAMID-047` | The Crown of Golden Sand | Role-playing | `Shared media mesh` | $395 | **Grail** | Crown  Golden Sand: a party facing a mysterious citadel; neon cyan / purple |
| `PYRAMID-048` | Oasis Tower Tactics | Strategy | `Shared media mesh` | $19 | **Common** | Oasis Tower Tactics: miniature armies on a map with a commander silhouette; silver / violet |
| `PYRAMID-049` | Pyramid Pinball Party | Pinball | `Shared media mesh` | $17 | **Common** | Pyramid Pinball Party: chrome balls, bumpers and exaggerated scoring lights; neon cyan / purple |


## 6. Per-title file/metadata template for Claude

For every game SKU, generate a record matching this shape (example fictional **new** game):

```json
{
  "sku": "BES-005",
  "status": "Needs Created",
  "title": "Turtle Town Tumble",
  "platform_id": "BES",
  "media_format_id": "BES_GAME_PAK",
  "pcb_layout_id": "BES-V1.117",
  "genre": "Platformer",
  "condition": "untested",
  "estimated_resale_value_usd": 18,
  "label_art_asset": "assets/games/bes/turtle-town-tumble/label.png",
  "loading_screen_asset": "assets/games/bes/turtle-town-tumble/loading.png",
  "metadata_asset": "assets/games/bes/turtle-town-tumble/metadata.json",
  "asset_completion": {
    "label": false,
    "loading_screen": false,
    "thumbnail": false,
    "game_data": false,
    "test_boot": false
  },
  "repairable_pcb_fault_inheritance": "Existing Faults from Fault Catalog"
}
```

**Implementation note:** This JSON is an illustrative schema and does not assume the current Bench Tech codebase uses these exact property names. Map the fields to existing schemas; do not introduce unnecessary duplicate registries. Cartridge `pcb_layout_id` is null for optical and SD-only games. `label_art_asset` and `loading_screen_asset` paths are generated consistently from the SKU and title slug.

### Media visual-asset templates

| Asset | Reusable base | Unique fields |
|---|---|---|
| Cartridge label | Connector-family shell UV and printable label region | Title, logo, genre illustration, rating parody, manufacturer mark, edition number, condition wear |
| Cartridge PCB | One of the 5 connector-family PCB designs | Save data/content identity, faults, optional game-specific chip decal; no new mesh per game |
| CD/DVD/Blu-ray | Same full-size disc mesh | Printed face texture, format mark, ring text, SKU, scratches/condition, game-specific readable/authentication metadata |
| Mini-CD/mini-DVD | Same mini-disc mesh | Disc label texture, mini format identifier, game art, condition |
| SD/microSD | Shared matching card mesh | Tiny printed label, title ID, filesystem content/image, wear/condition |
| Loading/title screen | Standard aspect-ratio-safe splash template per hardware generation | Game title, scene motif in table above, visual palette, studio parody logo, load animation/cue |
| Game info | Shared item/detail UI | Genre, era, description, suggested price, rarity, platform, format, boot-state and save-state |

### Disc visual generation rule

Game titles must not require fresh disc topology. The **same full-size mesh** supports all full-size discs. The **same mini-disc mesh** supports all mini discs. `media_technology` selects CD/DVD/BD/UHD-BD compatibility and simulated read speeds/density; `platform_id` gates authorization/boot; `label_asset` selects the unique printed design. A player testing an FS1 CD in an FS5 optical drive does not automatically imply that game is supported: firmware/platform compatibility is a separate rule.

### Save and repair expectations

- V4 battery-backed games must model backup voltage, battery-tab solder integrity, SRAM retention and a test after battery replacement. Preserve battery-backed save loss logic where relevant.
- V2 dual-ROM games can feature a broken address select trace or failed graphics ROM without making the whole game entirely invisible.
- V3 enhanced games can boot but display corrupted sprites/graphics when mapper or enhancement components fail.
- V5 game/save-flash carts can boot but fail to save or load correctly. Do not portray a nonvolatile EEPROM as requiring a battery.
- Disc games can exhibit scratched/dirty reads, intermittent scene loads, laser focus retries and console-side drive faults. Distinguish media vs optical drive during diagnosis.
- SD cards can exhibit CRC errors, corrupted index data or failed reads; a sealed flash card is not expected to offer routine solder-level chip repairs.

## 7. Compatibility and creation checklist

### Implementation milestones

- [ ] Reconcile the 34 Already Created SKUs with actual game content; preserve title spelling and the 24 existing provided prices.
- [ ] Implement 9 cartridge connector families and 5 PCB meshes/layouts per family (45 reusable PCB assets).
- [ ] Implement solder-tab battery-backed SRAM on V4, with realistic battery orientation and save-retention checks.
- [ ] Implement shared full-size disc mesh for CD, DVD and BD games and shared mini-disc mesh for mini-CD and mini-DVD.
- [ ] Implement shared full-size SD and microSD card meshes and card-read/test logic.
- [ ] Create 1,362 new game SKUs (the prior 662 plus 700 additional releases), with one title, genre, provisional value, unique label and loading screen each.
- [ ] Populate item library, inventory/shop, game media inspection and test-console workflows.
- [ ] Add media-to-platform compatibility tests and native boot/valid-disc checks.
- [ ] Apply **Existing Faults from Fault Catalog** to every cartridge PCB instance, with additional cartridge/media fault profiles.
- [ ] Confirm Game Orb reads its own mini-disc family and Pocket Joy cartridges separately; do not clone game SKUs.
- [ ] Confirm Bintendo Pyramid reads **Bintendo Mini-Disc** and has its own game SKUs.
- [ ] Confirm DiscJockie 1/2, Funstation 1/2, and Sbox 1/2 are CD-based; later models DVD/BD-based.
- [ ] Do not create separate 3D disc geometries per title or PCB layouts per title.

## 8. Audit totals by family — Version 3

| Console/media family | Already Created | Previous Needs Created | New V3 | Total Needs Created | Total |
|---|---:|---:|---:|---:|---:|
| Bintendo Entertainment System | 4 | 24 | 25 | 49 | 53 |
| Bintendo 64 | 4 | 24 | 25 | 49 | 53 |
| Vega Exodus | 4 | 24 | 25 | 49 | 53 |
| Paltari Family Console | 4 | 24 | 25 | 49 | 53 |
| Dream Boy / Pocket / Color | 4 | 24 | 25 | 49 | 53 |
| Dream Boy Advance / SP / Micro | 4 | 24 | 25 | 49 | 53 |
| Button Lite | 0 | 24 | 25 | 49 | 49 |
| Retrobit RB35 | 0 | 24 | 25 | 49 | 49 |
| Bintendo Pocket Joy Advance | 0 | 24 | 25 | 49 | 49 |
| Homey Sinnusus | 0 | 24 | 25 | 49 | 49 |
| Bintentendo Game Orb | 0 | 24 | 25 | 49 | 49 |
| Swamarami All-In-One | 0 | 24 | 25 | 49 | 49 |
| DiscJockie 1 | 0 | 24 | 25 | 49 | 49 |
| DiscJockie 2 | 0 | 24 | 25 | 49 | 49 |
| DiscJockie 3 | 0 | 24 | 25 | 49 | 49 |
| DiscJockie Pocket | 0 | 24 | 25 | 49 | 49 |
| Funstation 1 | 0 | 24 | 25 | 49 | 49 |
| Funstation 2 | 0 | 24 | 25 | 49 | 49 |
| Funstation 3 | 0 | 24 | 25 | 49 | 49 |
| Funstation 4 | 0 | 24 | 25 | 49 | 49 |
| Funstation 5 | 5 | 19 | 25 | 44 | 49 |
| Sbox 1 | 0 | 24 | 25 | 49 | 49 |
| Sbox 2 | 0 | 24 | 25 | 49 | 49 |
| Sbox 720 | 0 | 24 | 25 | 49 | 49 |
| Sbox 10 | 0 | 24 | 25 | 49 | 49 |
| Sbox S | 0 | 24 | 25 | 49 | 49 |
| Sbox One X | 5 | 19 | 25 | 44 | 49 |
| Bintendo Pyramid | 0 | 24 | 25 | 49 | 49 |
| **TOTAL** | **34** | **662** | **700** | **1,362** | **1,396** |

> **Handoff rule:** The 34 `Already Created` games retain their original SKUs. The previous 662 `Needs Created` SKUs remain unchanged. The 700 newly appended SKUs all carry `Needs Created`. Shared names across platforms are separate native media releases; one base game identity may be reused, but not the same inventory instance or media-compatible SKU. Every cartridge PCB continues to inherit **Existing Faults from Fault Catalog**.
