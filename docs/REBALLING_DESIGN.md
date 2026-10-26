# Bench Tech: reballing and BGA work (design proposal, 2026-10-26)

Status: **being built (2026-10-26)**. Your answers to the five questions are in section "Decisions" below and override the proposal text.

## Decisions (your answers, 2026-10-26)
1. **Ball maps: both.** Some chips are simple (outer ring carries signals, inner balls are a ground array); some have real ball maps.
   **Laser-cut stainless steel stencils**, one per chip type (about **10 types**). Each stencil has the **ball size and chip code etched on it**. **Stencils
   can warp if over-heated** (then they need replacing). The stencil sits on top of the chip held in the **reballing vise**. Two ways to fill it:
   - **Balls (always works):** thin layer of flux, then pick balls of the correct size from the pile with tweezers and place **one ball in each hole**.
     The balls are the perfect amount every time and melt into perfect bumps on every pad.
   - **Solder paste (fast):** smear paste onto the stencil, scrape the excess off with a scraper. No extra flux needed (the paste has flux in it). **About a 20 %
     chance** that some pads get too little paste (no proper bump) or too much (a **bridge** between pads when the stencil comes off).
   The hot air melts the solder; this is where the stencil can warp if it gets too hot.
2. **Always available, but you must buy the equipment:** **reballing vise $150**, **stencils $40 each** (can be damaged by warping, then replaced), solder balls
   (correct sizes), solder paste and a paste scraper. The balls under a chip are hidden until the chip is off.
3. **Heat: a staged heat bar** (like the soldering bar), not a free temperature graph.
4. **Reflow in place:** the player may try it (flux must be used). **Less than a 50 % chance** to fix the problem.
5. **First BGA devices:** mid-range and modern consoles, phones, tablets, all the exotics and military electronics. (The first BGA in an existing device is the
   Rogue Pal handheld PC's APU; the new consoles, phones and exotic boards bring many more.)

**Revision (2026-10-26, later):** the stencil does not carry one chip code. There are **12 stencil types** (ST-01 to ST-12) in **3 ball sizes**
(0.30, 0.45, 0.60 mm; four stencils per size) and **24 BGA chips** (two per package), so **one stencil fits more than one chip**. Each stencil has its
id, **the chip codes it fits** and the **ball size** etched on it (`bgatypes.ts`). Each chip has its own code (its marking, e.g. RP-Z1 = Rogue Pal APU, ST-05).

**Built so far:** BGA types and footprints, ball-state model with remove / clean / reball (balls or paste, stencil warp) / fit / reflow in place
(`src/rework/bga.ts`), generic faults (cracked, bridged, dead: `bgafaults.ts`), tools and supplies, session actions and the BGA station
(`ui/bga.ts`, opened from a BGA part's panel). Used / donor chips arrive bare; a new chip arrives with its balls. Reflow-only repairs come back
(hidden fault in the evaluation). Still to do: lifted-pad BGA faults repaired with wire through the exposed pads, X-ray / endoscope inspection,
more BGA devices (consoles, phones, tablets, exotics), certified balls and paste, a ball-by-ball close-up.

## What the player can do with a BGA chip
A BGA chip sits on a grid of solder balls under the chip, so the joints cannot be seen or touched. The player's options, cheapest first:

1. **Find that the BGA is the problem.** Evidence the player gathers: symptom (no picture, no boot, random freezes), a chip that runs hot or stays
   cold, rail readings, current draw at boot, a thermal-camera hot spot, and a **reflow-in-place test**. Nothing under the chip is directly visible.
2. **Reflow in place:** heat the chip and board on a profile to re-melt the balls. Often brings a cracked-ball fault back, **but it is a temporary
   fix**: heat cycles bring it back (a warranty comeback). Done wrong it cooks neighbours or lifts the board.
3. **Remove the chip:** board preheated (bottom heater), flux under the edges, hot-air profile (preheat, soak, peak, cool), lift with the vacuum
   pen. Too fast or too hot: popcorning, lifted pads, damaged neighbours, a warped board. Kapton masks the plastic parts nearby.
4. **Clean the pads on the board** (flux, wick, IPA) until flat and bright, with no bridges and no lifted pads; clean the chip too.
5. **Reball the chip:** stencil for that package, tacky flux, solder balls of the right size, reflow to form the balls, release the stencil.
6. **Fit the chip:** a reballed original, a **new** chip (comes with balls), a **used** chip, or a **donor** chip (always needs reballing). Align it
   to the pads, then reflow it on the profile.
7. **Test:** functional test; cracked or cold balls show up as open or intermittent pins; a bridge shows as a short.

## Faults this adds
- **Cracked / cold balls** (heat cycling, a drop): pins open or intermittent. Reflow can fix it for a while; reballing fixes it properly.
- **Lifted pads under the BGA** (bad previous repair, heat): needs pad repair (the existing wire and mask methods, through the pad access).
- **Bridged balls** after a poor reflow (solder volume / misalignment): a short under the chip.
- **Dead BGA chip** (shorted core rail, thermal damage): replace and reball.
- **Popcorned chip** (moisture + a fast heat ramp).
- **A previous repairer's bad reball / reflow** (unevenness, flux left, misalignment).

## Tools, parts and consumables to add
- **BGA preheater** (bottom heater) and a **hot-air station profile display** (live temperature graph), **vacuum pick-up pen**, **board holder**.
- **Stencils** (one per BGA package: a shared list of package sizes), **solder balls** (several diameters; certified balls for certified work),
  **tacky flux** (certified flux paste for certified work), reballing jig, flux-safe wipes (existing).
- **Parts:** BGA chips (SoC / CPU / GPU / RAM / eMMC / PMIC) in the parts catalog, with certified, used and donor versions; the used and donor
  ones arrive without good balls.
- Existing items reused: hot air nozzles, wick, IPA, flux, Kapton, pen grinder, UV mask, microscope.

## How it plays on screen (proposal)
A **BGA station** (like the microscope station): a top view of the chip and board, five stage buttons (Inspect, Remove, Clean, Reball, Fit) and a
**temperature profile bar** with a live graph. When the chip is off, the pad field and the chip's balls are shown as a ball map you inspect and
work on. Colours show good / cracked / cold / bridged / lifted balls once they are exposed. A profile that is too fast, too hot or too long
ends in a visible consequence (popcorn, lifted pads, burnt neighbours).

## How it fits the simulation (recommendation)
- A BGA part gets a **ball grid** (for example 8 x 8 for small chips up to 16 x 16 for big ones: simplified, not a real 400-ball map).
- **Only a ring of outer balls carries signals and power**; the inner balls are a ground array that the board's ground pour covers. That keeps the
  routing and the circuit small but still gives believable BGA behaviour (the corners, edges and centre can fail separately).
- Each ball has a state (good, cracked, cold, bridged, lifted). Cracked or lifted balls become **open joints** on their pins; bridged balls become
  **shorts**; cold balls are **intermittent** (they pass now and fail later), so the existing "comes back later" system applies.
- Everything uses the existing parts, stock, orders, certified work, ledger and saving; the profile and ball states are part of the saved board.

## First build (recommended scope)
1. BGA package definitions and ball-grid pads; two or three BGA parts (SoC, RAM, PMIC); the part kind and rendering of the chip and its balls.
2. The ball-state model and the profile model (pure code with tests), and the BGA station with the five stages.
3. The new tools and consumables, orders, and certified versions.
4. The first faults (cracked balls, lifted pads, bridged balls, dead chip) as generic variants available on any device that has a BGA.
5. Tests; then the first device with a BGA (your new consoles and phones will bring more).

## Questions for you
1. **Detail:** is a simplified ball grid (outer ring signals, inner ground array) acceptable, or do you want closer to a real ball map?
2. **Hidden or visible:** should the balls be invisible until the chip is off (my recommendation), with an inspection tool (endoscope or X-ray
   style) as a later purchase?
3. **Heat profile:** a heat bar with stages (like the soldering bar) or a real temperature slider and graph you control? (I recommend the profile
   graph with a guided mode that shows the target curve.)
4. **Reflow in place:** keep it as a cheap, temporary fix that returns later, or make it fix nothing?
5. **Which device gets the first BGA:** an existing one (Funstation 5 or Sbox One X main board, a handheld) or the first of the new consoles?
