# Bench Tech

A browser electronics-repair game. Customers bring in broken gadgets — desk lamps, speakers, monitors, handheld and home consoles — and you diagnose them with a multimeter, bench supply, oscilloscope and thermal camera, then fix them at the rework microscope with iron, flux, wick and hot air. Between jobs you run the shop: parts and supplies, rent and bills, advertising, flipping broken devices bought online, and a store-room of donor boards.

Every board is a real circuit: a nonlinear DC solver drives the meter readings, the copper is autorouted from the same netlist, and faults (shorted caps, dried-out caps, dead chips, cracked joints, damaged ports…) are generated in difficulty tiers.

All device and brand names are fictional parodies.

## Requirements

- **Node.js 20.19+** (or 22.12+; current LTS recommended) — npm comes with it
- **A modern browser with WebGL 2** — Chrome, Edge or Firefox

That's all you need to play. The 3D models are already built and checked in, so Blender is only needed if you change them (see below).

## Run it

```bash
git clone https://github.com/CharlesJGantt/bench-tech.git
cd bench-tech
npm install
npm run dev
```

Then open http://localhost:5173.

`npm install` pulls in the PlayCanvas engine plus the dev tools (Vite, TypeScript, Vitest). Saves are kept in your browser's local storage, so each browser has its own save; use **New game** in the game to start over.

To host it somewhere, run `npm run build` and upload the `dist/` folder to any static web host.

## Development

- `npm test` — simulator, fault-generator, rework and business tests (vitest)
- `npm run typecheck` / `npm run build`
- `npm run models` — rebuild `public/models/parts.glb` from the Blender scripts in `tools/blender/`. Optional: needs **Blender 5.x**; set the `BLENDER` environment variable to its executable if it is not on your `PATH`.

Built with [PlayCanvas](https://playcanvas.com/) (engine only), Vite and TypeScript. See `ROADMAP.md` for what is done and planned, and `CLAUDE.md` for an architecture overview.
