# Bench Tech: documentation plan (2026-10-26)

Status: **planning only. Neither document set is written yet.** This is the reminder of what you asked for. Existing notes to build on:
`CLAUDE.md` (architecture and conventions), `docs/blocks-design.md`, `docs/fault-notes.md`, `docs/repair-scenarios.md`,
`docs/implementation-plan.md`, and the planning files `STATUS.md`, `TODO_MASTER.md`, `DEVICE_BACKLOG.md`, `GAME_LIBRARY.md`,
`WORLD_AND_MENU_PLAN.md`, `TESTING_CHECKLIST.md`.

Two completely separate sets, for two audiences:

---

## 1. Internal documentation (for you and for AI agents)
Purpose: anyone (a person or an agent) can open the repo cold and understand how Bench Tech works, where things live, how to extend it
without breaking it, and what the rules and decisions are. Written plainly, current, and kept in step with the code.

Planned contents:
- **Start-here index** for agents (what to read first, the conventions, the do-and-don't list such as parody names only, Blender for 3D, never
  touch the art folder until told, keep the lists current).
- **Architecture:** the layers (sim, blocks, business, game session, rework model, render, UI), the data flow from board state to netlist to solver
  to what the player sees, and what each folder owns.
- **System guides, one per system:** circuit solver and elements; blocks and the device builder; faults and the job generator (tiers, variants,
  generic faults); rework physics; enclosure / teardown; corrosion, contacts, ports, liquid-damage stickers; business economy (orders, market,
  sales, locations, staff, services, quotes); certified work; USB meter and instruments; save format and migrations; rendering and board art;
  routing and the route cache; tutorial, voice, music and loading screens; game library and media.
- **Data reference (generated from the code so it cannot drift):** every device with its boards, parts, nets, variants and tiers; every part and
  footprint; every fault variant with tier and symptom; every supply and tool; every game; the save format.
- **How to add things:** a new device, block, fault variant, part, tool, supply, service job, game / media format, console and controller, Blender
  model, art asset. With the checklists and tests each one must pass.
- **Pipelines:** Blender models (`npm run models`), routes (`npm run routes`), voice (`npm run voice`), games data and art
  (`tools/build-games.py`, `tools/build-game-art.py`), and the review save.
- **Testing:** the test strategy, what each test file protects, how long things take, the player testing plan (`TESTING_CHECKLIST.md`).
- **Decisions log and known issues:** why things are the way they are (for example heat-bar fuse reset, one save today), open questions,
  limitations.
- **Glossary** of the game's and the codebase's terms.

Open choices: where the AI-agent entry file lives (`AGENTS.md` in the repo root next to `CLAUDE.md`?), and whether the generated references are
rebuilt by one command.

---

## 2. Player guide (end-user facing, no back-end, no code)
Purpose: a complete, thorough, well thought-out play guide that a new player or a stuck player can read. It never explains how the game
works internally (no code, no simulation details, no file names).

Planned contents:
- **Getting started:** the first job, the first day, the screen tour, controls and keys, guided mode, saving and loading, the start menu.
- **The shop office, tab by tab:** Overview, Work, Supplies and parts, Store-room, Equipment, Marketplace, Advertising and location, Sales, Staff,
  ending the day, bills (rent, electricity, advertising, wages), the ledger and profit and loss.
- **Buying supplies and components:** what each supply does (solder, low-melt, fluxes, wick, IPA, flux cleaner, corrosion cleaner, thermal paste,
  liquid metal, swabs, wipes, brushes, erasers, Pad-Bright, repair wire, UV mask, Kapton, disc polish, coating, certified items...), ordering and
  delivery speeds, rush buying, special orders, used parts, certified parts and certified consumables (what they are and **when they are required**).
- **The marketplace:** buying broken devices to repair and sell, donor boards, parts-only boards, trends and crazes, what can go wrong
  (pre-repaired, missing parts, unrepairable).
- **Equipment and upgrades:** every tool and what it unlocks, iron tips, nozzles, microscope objectives, test consoles, bench upgrades.
- **Locations, staff and growth:** garage, storefront, mall, rent and fit-out, reputation gates, hiring, raising and letting staff go, what staff
  can and cannot fix; (later) scenes, bench tiers and the storefront.
- **Customers:** quotes, tiers, patience, calling the customer (every call option), holds, warranty comebacks, refunds, cartridge home tests, rush and
  certified customers.
- **Selling what you buy and repair, every scenario:** auction with reserve, buy-it-now, storefront, fees, how long things sit, hidden problems and
  refunds, selling games and media, the sales tracker.
- **Prices and value:** lists of all games with **rarity and base prices**; and **how damage, repairs, damaged labels, scratches and condition change
  the price** (needs the condition-grade and appraisal system to exist first).
- **Every repair, step by step:** teardown and reassembly of each case type, soldering and desoldering with flux and wick, hot air and reflow,
  fitting parts, cleanup, jumper and trace repair, corrosion, contacts, ports and debris, ribbons, screens, batteries, fuses, services, discs and
  drives, certified work (coating removal, analysis, deadline), reballing (when it exists).
- **Finding faults and tracing signals, with every tool:** multimeter (volts, ohms, continuity, diode, ESR), bench power supply and prompt-to-boot,
  USB power meter and capacity test, USB port tester, oscilloscope, thermal camera, **logic analyzer** (**does not exist yet**), microscope, injecting
  voltage, reading a service sheet.
- **Component identification guide:** every part type, its package, markings, how it looks on the board and in the microscope, what it does and how
  it fails, with images from the game.
- **Reference lists:** all devices (with tier, what they are, what they can need), all electrical faults and their symptoms (by family, written so
  they teach without giving away a specific job), all consoles, media and games.
- **Tips by stage, troubleshooting / FAQ, glossary, keyboard shortcuts.**

Open choices: the format (a single Markdown manual, a multi-page site, a PDF for Steam, an in-game help viewer), screenshots from the game, and
whether the guide ships with the game.

---

## 3. Things that must exist before the guide can be finished
- **Logic analyzer tool** (you named it; not built).
- **Condition grades, per-copy appraisal and the damage / scratch / label price rules** (games library work).
- Bench upgrades, location scenes, storefront view, start menu (to document when built).
- Reballing and the test-lab boot sequence.
- The final art and names (labels, consoles), so the lists and pictures are right.

## 4. How we keep them true
- Generate every list (devices, parts, faults, supplies, tools, games and prices) from the code and data into the docs, so they never disagree with the game.
- Re-run the generators and update the guide whenever a feature ships; add "document it" to the checklist for every new feature.
- The player guide is reviewed by you for tone, and play-tested against a fresh save.
