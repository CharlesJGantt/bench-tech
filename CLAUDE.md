# Bench Tech

Browser electronics-repair game. PlayCanvas engine (npm) + Vite + TypeScript. Design doc: `Bench_Tech_Game_Concept.md`; plan: `ROADMAP.md`.

## Commands
- `npm run dev` — dev server (http://localhost:5173)
- `npm test` — vitest (sim + fault generator invariants)
- `npm run typecheck` / `npm run build`
- `npm run routes` — re-route every board into `src/render/routes/*.json` (required after changing a device layout, footprint or the router; a geometry test fails while the cache is stale)
- `npm run models` — rebuild `public/models/parts.glb` from `tools/blender/*.py` via headless Blender 5.2 (override path with `BLENDER`)

## Architecture
- `src/sim/` — **no PlayCanvas imports**. Pure, unit-tested.
  - `solver.ts` nonlinear DC nodal solver (Newton + line search, pseudo-transient fallback). Elements only implement `eval()` (currents into terminals). Boards with ≥64 nodes are reordered (reverse Cuthill–McKee) and factored with banded LU; Newton also stops when KCL holds to ~1 pA; the fallback has an iteration budget (some faulty boards have no steady state). `tests/perf.test.ts` holds the speed budget (a 313-part synthetic board).
  - `elements.ts` behavioral models (diode, MOSFET, limited source, buck w/ foldback, LDO).
  - `parts.ts` catalog, `board.ts` DeviceDef types, `devices/*.ts` one file per device (layout, firmware, externals, functional test, fault variants; registry in `devices/index.ts`), `footprints.ts` pad geometry.
  - `circuit.ts` board state → netlist, operating point + MCU firmware loop, multimeter, thermal/stress damage, functional (customer) test.
  - `scope.ts` oscilloscope view derived from the DC operating point (switching, ripple from high-ESR caps, data/audio presence). ESR meter is a `measure()` mode.
  - `faults.ts` tiered fault variants + job generator (seeded). `repair.ts` repair actions + evaluation.
- `src/business/` — pure economy: `economy.ts` (prices, supplies, rent, electricity, ad tiers, starting stock, salvage-only parts) and `shop.ts` (ledger/P&L, stock new+used, supplier orders, rush buys, customer queue, warranty comebacks, marketplace listings, flip projects, scrap/salvage, `endDay`). Tested in `tests/business.test.ts`.
- `src/sim/persist.ts` — JSON save format for boards/jobs (devices by id, Infinity joints as -1). Whole game saves to localStorage `benchtech.save.v2`.
- `src/game/` — `Session` (active work on the bench or idle; start/pause/return/give-up/list/scrap; bench power, instruments, lagged temps, IPA, log; supplies + electricity usage) and `explain.ts` (guided plain-language readings).
- `src/rework/model.ts` — hands-on rework physics per pad (temperature, solder, flux, IPA/dissolved/white residue, heat damage, bridges); `applyRework()` writes joints, lifted pads and solder bridges (as `bridge` jumpers = real shorts) back to the board. No DOM.
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
