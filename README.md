# Bench Tech

A browser electronics-repair game. Customers bring in broken gadgets — desk lamps, speakers, monitors, handheld and home consoles — and you diagnose them with a multimeter, bench supply, oscilloscope and thermal camera, then fix them at the rework microscope with iron, flux, wick and hot air. Between jobs you run the shop: parts and supplies, rent and bills, advertising, flipping broken devices bought online, and a store-room of donor boards.

Every board is a real circuit: a nonlinear DC solver drives the meter readings, the copper is autorouted from the same netlist, and faults (shorted caps, dried-out caps, dead chips, cracked joints, damaged ports…) are generated in difficulty tiers.

All device and brand names are fictional parodies.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

## Development

- `npm test` — simulator, fault-generator, rework and business tests (vitest)
- `npm run typecheck` / `npm run build`
- `npm run models` — rebuild `public/models/parts.glb` from the Blender scripts in `tools/blender/` (needs Blender 5.x; set `BLENDER` to its path if it is not on `PATH`)

Built with [PlayCanvas](https://playcanvas.com/) (engine only), Vite and TypeScript. See `ROADMAP.md` for what is done and planned, and `CLAUDE.md` for an architecture overview.
