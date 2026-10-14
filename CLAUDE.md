# Bench Tech

Browser electronics-repair game. PlayCanvas engine (npm) + Vite + TypeScript. Design doc: `Bench_Tech_Game_Concept.md`; plan: `ROADMAP.md`.

## Commands
- `npm run dev` — dev server (http://localhost:5173)
- `npm test` — vitest (sim + fault generator invariants)
- `npm run typecheck` / `npm run build`
- `npm run routes` — re-route every board into `src/render/routes/*.json` (required after adding/changing a device layout, footprint or the router; a geometry test fails while the cache is stale). It also clears `node_modules/.vitest-cache`, which otherwise keeps a stale list of route files.
- `npm run models` — rebuild `public/models/parts.glb` from `tools/blender/*.py` via headless Blender 5.2 (override path with `BLENDER`)

## Architecture
- `src/sim/` — **no PlayCanvas imports**. Pure, unit-tested.
  - `solver.ts` nonlinear DC nodal solver (Newton + line search, pseudo-transient fallback). Elements only implement `eval()` (currents into terminals). Boards with ≥64 nodes are reordered (reverse Cuthill–McKee) and factored with banded LU; Newton also stops when KCL holds to ~1 pA; the fallback has an iteration budget (some faulty boards have no steady state). `tests/perf.test.ts` holds the speed budget (a 313-part synthetic board).
  - `elements.ts` behavioral models (diode, MOSFET, limited source, buck w/ foldback, LDO).
  - `blocks/` reusable sub-circuits (`core.ts`: `device()` expands placed blocks + a device's own parts into a DeviceDef; plain-numbered refs, block nets namespaced `<blockId>_<net>`, block fault variants included automatically; `power.ts`: input, buck and LDO rails; `usb.ts`: USB input and Li-ion charger + battery; `hdmi.ts`: HDMI output with retimer, ESD, +5 V feed and hot-plug level shifter). All devices are built from blocks; placements can pin refs/layout and switch block faults off (`faults: false`) where a device has its own. New devices should be built from blocks; see `docs/blocks-design.md`.
  - `parts.ts` catalog, `board.ts` DeviceDef types, `devices/*.ts` one file per device (layout, firmware, externals, functional test, fault variants; registry in `devices/index.ts`), `footprints.ts` pad geometry.
  - `circuit.ts` board state → netlist, operating point + MCU firmware loop, multimeter, thermal/stress damage, functional (customer) test.
  - `scope.ts` oscilloscope view derived from the DC operating point (switching, ripple from high-ESR caps, data/audio presence). ESR meter is a `measure()` mode.
  - `corrosion.ts` liquid-damage crust per pad (`CompState.corr`): series R / leakage in the netlist, no-wet at the microscope, daily spread, whole-board treatment, render speckles.
  - `enclosure.ts` the case: items with prerequisites, tools, teardown mistakes, reassembly issues; `enclosures.ts` per-device cases (attached in `devices/index.ts`). Jobs carry `Job.enclosure`; `tests/enclosure.test.ts` opens and closes every device.
  - `contacts.ts` oxide on connector contacts (`CompState.oxide`/`brightened`): contact resistance at the mating side, scrubbing (pink eraser / magic sponge) and Pad-Bright; `ui/contacts.ts` is the scrubbing station.
  - `devices/retro.ts` retro helpers: `cartridge()` builds a console's cart board (one design, many `titles`; `Job.title`), `testCart()` / `consoleSlot()` externals, `cx()` for parts with floating NC pins. Generic `logic` chips (ROMs, lockout, video, RF) are a part kind with a `LogicSpec`.
  - Carts: `ui/teststation.ts` (needs a `tc-<console>` test console tool); untested carts that fail come back next day for 10 % (`cartHomeFailure`).
  - `faults.ts` tiered fault variants + job generator (seeded). `repair.ts` repair actions + evaluation.
- `src/business/` — pure economy: `economy.ts` (prices, supplies, rent, electricity, ad tiers, starting stock, salvage-only parts) and `shop.ts` (ledger/P&L, stock new+used, supplier orders, rush buys, customer queue, warranty comebacks, marketplace listings, flip projects, scrap/salvage, `endDay`). Tested in `tests/business.test.ts`.
- `src/sim/persist.ts` — JSON save format for boards/jobs (devices by id, Infinity joints as -1). Whole game saves to localStorage `benchtech.save.v2`.
- `src/game/` — `Session` (active work on the bench or idle; start/pause/return/give-up/list/scrap; bench power, instruments, lagged temps, IPA, log; supplies + electricity usage) and `explain.ts` (guided plain-language readings).
- `src/rework/model.ts` — hands-on rework physics per pad (temperature, solder, flux, IPA/dissolved/white residue, heat damage, bridges incl. hidden whiskers/balls, corrosion crust/sludge, cleaning liquids); `bridgeVisible()`/`maxZoom()` are the microscope visibility rules; `applyRework()` writes joints, lifted pads and solder bridges (as `bridge` jumpers = real shorts) back to the board. No DOM.
- `src/render/` — PlayCanvas scene (`scene.ts`, board flip, net highlight), procedural PCB textures (`boardArt.ts`, top + bottom), and `router.ts` (two-layer grid A* autorouter: Steiner trees, 45°, rip-up-and-retry). Routes are pre-built and cached by layout hash (`routeCache.ts`; bump `ROUTER_VERSION` when router rules change). Copper is generated from the same netlist the sim solves; `tests/geometry.test.ts` proves connectivity and no foreign contact.
- `src/ui/` — DOM HUD, shop office (`office.ts`), rework microscope station (`rework.ts`, stock-backed parts tray), jumper heat-bar minigame, modals, schematic, audio.
- `?debug` URL flag shows live net voltages on hover and the hidden fault on the ticket.

## Conventions
- **Never use real product/brand names.** Parody names only (Funstation 5, Sbox One X, Button…). Fictional part numbers too.
- Faults must stay approachable: every variant has a tier (1 easy/visible → 3 expert). Default jobs never exceed the reputation-unlocked tier; tier 3 is never default.
- New devices must pass `tests/devices.test.ts` (healthy board passes, routes cleanly, parts fit).
- Every fault variant must pass `tests/faults.test.ts`: produces a symptom, canonical repair returns the board to "fixed".
- 3D items come from Blender scripts (mm units, item = Empty named `pkg_*` / `tool_*` / `env_*` at origin). Runtime-driven child names: `*_lens`, `*_lcd`, `*_dial`, `*_disp_*`.
- Board layout coordinates: mm, x right, y down; world = (x − w/2, height, y − h/2).
