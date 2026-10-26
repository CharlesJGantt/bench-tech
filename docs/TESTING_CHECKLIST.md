# Bench Tech: testing checklist (2026-10-26)

You have never playtested a game this thoroughly, so this list is built to be complete. **Nothing here is approved yet.**

Three files work together:
- **This file** explains what to test and the order.
- **`Bench_Tech_Test_Tracker.csv`** is the spreadsheet (open in Excel / Google Sheets / Gridcraft): one row per thing to test, with a Status column and notes columns. 495 rows.
- **`Bench_Tech_Test_Games.csv`** is one row per game title (1,396) for label, loading-screen and media approval.
- **`TEST_LOG.md`** is the running notes file **I update** with test results, issues and rework you report.

## Status tags (use these exactly)
- **NOT TESTED**: nobody has looked yet
- **PASS**: you tested it and approve it
- **FAIL**: tested, something is wrong (put the problem in Issues found)
- **REWORK**: being fixed (I am working on it, or it waits on art / a decision)
- **BLOCKED**: cannot test yet (needs something else built or finished first)
- **NOT BUILT**: the feature does not exist yet; the row is a reminder of what to test once it does
- **N/A**: does not apply

## How to test (suggested order)
1. Start with **TEST_LOG.md section 12 (general)**: does the game start, save, load and run without errors?
2. Open the game with `?review` (a separate save with $10,000, top reputation, every tool and one waiting job for every device). Go through **DEV** rows one device at a time.
3. Then repairs (REP), tools (TL3), office menus (OFF), buying and selling (TRD), calls (CAL), store-room (DON).
4. Consoles (CON) and media (MED) need the test lab and the finished art: leave those until Codex is done.
5. When you find something, tell me the ID and what is wrong; I will log it and set the status.

## What each area covers

| Area | Rows | What it covers |
|---|---|---|
| Repairables: design review (built) | 34 | Every device already in the game: density, layout, PCB shape and size, screen size and placement, buttons / switches / ports / battery placement, case shape and design, screw shape and design, disassembly steps, case colour, logo and silkscreen placement, case fitment and alignment, and whether the button, screen, port, speaker and battery-compartment holes are right. |
| Repairables: design review (planned: review when built) | 197 | The same review for every device still to be built (the rows start as NOT BUILT). |
| Consoles and handhelds: test lab boot sequence and art | 32 | For every console and handheld: powers on with a status light; boot process with console-specific screens; OS load; known-good game boots and shows its loading screen. Also the new console art, power / boot / initial loading screens (Codex). **The console boot sequence in the test lab is not built yet** (today the test station only shows whether a title screen appears). |
| Game media: approval per platform and cartridge PCB layout | 64 | Cartridge look, label placement, disassembly, PCB layout and components, edge finger count; disc label placement and the centre hole not covered; SD and microSD cards. |
| Tools: every visible tool with a 3D model | 16 | Every tool with a 3D model, one by one. |
| Tools: tools that have no 3D model yet | 15 | Tools without a model; decide if they need one. |
| Office: every menu | 12 | Every office tab and button. |
| Buying and selling: every type | 22 | Every way to buy and sell. |
| Repair processes: every one | 35 | Every repair process in the game. |
| Store-room and donor boards: actually use them | 8 | Use a donor board for real: desolder parts, remove cases, replace broken things. |
| Reballing / BGA (NEXT to build: design in REBALLING_DESIGN.md) | 9 | Reballing and BGA work do not exist yet; devices are about to include BGA chips, so it is the next feature to build. These rows define what it must cover. |
| Locations, bench, storefront, employees | 10 | Locations and staff exist; bench upgrades, scenes and the storefront view do not. |
| Calling the customer: every scenario | 10 | Every call option, including the planned one where the customer refuses a pricey part and stops the repair (buy it for spares, or return it). |
| Things you may have missed | 31 | Start menu, saves, tutorials, sound, window sizes, browsers, performance, settings, accessibility, naming and licences, economy balance, error cases, Steam readiness. |

Plus the per-game file: 1,396 rows (label art, loading screen, media look, disc centre hole, boot-to-game check).

## Added to the to-do list because of this
- **Console art** and **console power / booting / initial loading screens** for every console (Codex art tasks).
- **Test lab boot sequence** for every console and handheld: status light, console-specific boot screens, OS load, then the known-good game and its loading screen.
- **Approval pass** for every repairable, every cartridge and disc, every tool model and office menu (this checklist).
- **Reballing** (BGA) does not exist: needs to be defined and built.
- **Stop repair / Finish repair** as customer call scenarios (decide whether they are wanted).
- Tutorial steps for newer mechanics, bench upgrades, location scenes and the storefront (already on the list).
