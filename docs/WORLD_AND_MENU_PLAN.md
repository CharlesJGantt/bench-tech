# Bench Tech: start menu, shop scenes, workbench and storefront (planning notes, 2026-10-26)

Status: **planning only. Nothing here is built.** These are your requests, written down so they are not lost.

## 1. Start menu (after the loading screen)
- Shown after the loading screen: **Begin a new game**, **Load a saved game**, **Delete saved games**.
- Needs **multiple save slots** (today the game has one save, `benchtech.save.v2`, plus the separate `?review` save).
  A slot list with name, day, cash, reputation, location and last played; confirm before delete.
- Needs background art for the menu: **Codex creates it** (to be requested).
- Related existing pieces: the loading screen (`src/ui/splash.ts`), "Start a new career (day 1)" button, the tutorial
  prompt for brand-new players, the music popup.

## 2. Scenes for each shop location (all assets built in Blender)
The room around the workbench becomes a real scene per location: **home garage lab**, **small storefront**, **mall shop**
(the three locations the career already has). Moving location changes the scene.

Assets to build in Blender (`env_*` items, built by `tools/blender/`):
- Room shells for the three locations: walls, floor, ceiling, windows, doors, lighting
- **Wall posters:** game art reused as posters (the loading screens / labels from the library); **Codex makes console,
  phone and electronics advertisement art** for the walls
- **Waiting area for rush customers** (chairs, small table, magazines)
- **POS system** (register, card reader, receipt printer)
- **Display cases and video game racks** (see section 4)
- Shelving and storage for parts, a store-room door, signage, a counter

## 3. Workbench upgrades
- **Start on the same desk** every career. Better benches (new Blender models) are **bought as the shop earns money**.
- Each bench tier gives **small perks** (ideas, to be decided together): bigger work area, a built-in parts drawer that
  shows stock, a lit magnifier arm, an ESD mat with less static risk, a fume extractor that keeps flux fumes down, a
  second monitor with the service sheet, a tool rack that keeps the iron tip clean, a tilt rotary board holder.
- Purchase happens in the Office; the bench model is swapped in the scene; perks feed the existing sim (heat, cleaning
  speed, drawer capacity, ...). The old bench could be sold.

## 4. Storefront view (looks only)
- A view of the **display cases and video game racks** in the shop. Aesthetics only for now.
- The racks can show the **actual stock** (the games for sale, with their cartridge / disc labels from the game library
  art) and the repaired devices listed for sale.
- A button or camera move from the bench to the shop floor; back again.

## 5. Stretch goal after Steam (part of a DLC): walk around the shop
- The tech **walks around the shop and deals with customers who come in** (a real shop-floor mode).
- Explicitly **after the Steam launch**, as DLC. Not part of the launch scope.

## Open questions to settle before building
- How many bench tiers, and what each tier costs and gives.
- Whether the scenes also change with day / night, and whether the garage can be decorated.
- Camera: fixed camera angles per view (bench, shop floor, waiting area) or free look.
- Which of the wall art is Codex-made (ads for consoles, phones, electronics) and which is reused game art.
- Save slot count and what the menu shows for each slot.
