# Bench Tech: condition, appraisal and restoration of items you buy and sell (spec notes, 2026-10-26)

Status: **not built; this records your requirements.** It also feeds the player guide ("how damage, repairs, damaged labels and scratches affect
the price") and the game library tasks (condition grades, per-copy appraisal).

## Scope
- Applies to **items the player buys and sells** (games, discs, cartridges, SD cards, devices bought from the marketplace and flipped).
- It does **not** apply to what **customers pay** for their own repairs (those stay quotes, parts and fees).

## What makes an item worth less (and must be visible on the item)
- **Damaged labels must look damaged.** Examples you gave: price stickers stuck over the label, **permanent marker marks and wording** written on it,
  scratches, tears, scuffs, fading.
- **Cases:** scratched, **yellowed**, **chipped corners**, **missing screws**, dirty and grimy.
- **Repairs change the price too:** a repair may not restore an item to factory condition. For example **pad and trace repairs with copper wire make the
  repair fragile and always add extra UV solder mask to the PCB** (a visible patch). Other repairs that are not original (replaced parts, non-original screws,
  a re-glued case, a polyfuse revived with heat, reballed chips) also count.
- Plus what the library already has: **rarity** (Common to Grail) and the reference value, and a **condition grade** per copy (the library CSV has empty columns
  for condition grade at acquisition, grade multiplier, appraised value and a unique copy id).

## Trace and pad repair: the finish
Once a trace or pad repair is complete, the damaged area is **coated in UV-cured solder mask and then cured with the UV lamp**. (Today a repair wire is sealed one
wire at a time; the finished repair should show a visible mask patch over the damaged area, and that patch is what lowers the resale price.)

## Restoration: how the player cleans things up
| Problem | Fix | Notes |
|---|---|---|
| Yellowed case plastic | **Electro-Bright**, a plastics cleaning liquid (a new supply) | works on yellowing |
| Sticker over a label (price sticker) | **Hot air gun on its lowest setting**, low heat | **prolonged heat discolours or singes the label** (a timing / heat risk) |
| Permanent marker on a label or case | **A light application of IPA** | light touch; heavy rubbing can harm the label |
| Dirt and grime | **A light application of IPA** | |
| Scratches, chipped corners, missing screws | partly fixable (spare screws, polish) or permanent | a price effect that stays |
| Fragile copper-wire repair, extra UV mask | **cannot be undone**; the item sells for less | |

## Ideas to settle together
- The price formula: reference value x rarity x condition grade x originality (repairs) x completeness (missing screws), with limits.
- The grades (the CSV mentions a "grade 8 reference value"; define the scale and the multipliers).
- Where the player sees condition: a condition description on marketplace listings, a photo-style view of the item, the label and case art showing the damage.
- The assets: damaged-label art (stickers, marker writing, scuffs, tears) and case-wear materials are art and Blender tasks (Codex for label art; Blender for the 3D case wear).
- A cleaning workflow in the game (tools, supplies, heat risk, rubbing) with the same feel as the repair processes.
- How condition changes over time (for example items yellow while stored, dust in the store-room).
