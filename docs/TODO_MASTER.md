# Bench Tech: master to-do list (2026-10-26)

Every request and idea from this whole chat that is **not yet built**, task by task, grouped by area. Built work is in
`STATUS.md`; device-by-device lists are in `DEVICE_BACKLOG.md` (this file points there instead of repeating 240 devices);
games and art are in `GAME_LIBRARY.md`; the menu / scenes plan is in `WORLD_AND_MENU_PLAN.md`; fault ideas from videos are
in `fault-ideas-from-transcripts.md`.

Marks: **[ ]** not started, **[~]** partly built, **[wait]** waiting on something outside the code (Codex art, your OK).
Each task has where it came from in brackets.

---

## A. Game consoles, controllers and media (new documents)
1. [ ] Create the **15 console / handheld entries** (DiscJockie 1, 2, 3, Pocket; Funstation 1-4; Sbox 1, 2, 720, 10, S, One X;
   Bintendo Pyramid) with their **41 boards**: main logic, optical drive / servo, power. [console list]
2. [ ] Build the **disc drive boards and mechanisms** (CD, DVD, Blu-ray, mini-disc): pickup, spindle, sled, tray / slot load,
   eject sensor, authentication / pairing, ribbons; the drive faults (dirty lens, tray belt, feed roller, spindle stall, weak laser).
3. [ ] Bring **Funstation 5** (only an HDMI section exists) and **Sbox One X** (only a power board) up to their full entries:
   main board, disc drive, power supply; plus the Funstation 5 power / standby section (current-draw pattern, enable to power-good
   chain, lightning damage) and a Funstation 5 Pro, Sbox One X main board. [earlier lists]
4. [ ] **Bintendo Pyramid** with its own **Bintendo Mini-Disc** (not the DJ Pocket mini disc, not the Game Orb disc), own case, drive,
   boards and controller. [console list]
5. [ ] **21 unique controllers**, one per non-handheld console, each with a different shell silhouette AND PCB outline:
   BES, B64, Vega, Paltari, Game Orb, Swamarami, DJ1, DJ2, DJ3, FS1, FS2, FS3, FS4, FS5, SB1, SB2, SB720, SB10, SBS, SB1X, Pyramid.
   [console list] (The built DualPulse, Sbox pad and Button Grip stay.)
6. [ ] **Case colour variants for every controller** (cosmetic SKUs, same electronics). [console list]
7. [ ] **15 media formats** with their own ids, meshes and compatibility checks (DJ1/2/3 discs, DJ Pocket mini disc, FS1-4 discs,
   SB1/2/720/10/S/1X discs, Bintendo Mini-Disc); media incompatibility is not an electronics fault. [console list]
8. [ ] Controller connection behaviour per console (wired protocols, wireless pairing, charging) and the controller tests
   (button / axis / trigger matrix, handshake, haptics, motion, audio). [console list]
9. [ ] The **Bintentendo Game Orb** (spherical console, round PCB, takes discs and Pocket Joy carts, disc drive servo card). [your list]
10. [ ] **Swamarami All-In-One** (cheap, many cart connectors, SD card slot, poor solder, flux corrosion). [your list]
11. [ ] **Bintendo Pocket Joy Advance** (two LCD screens, game pin fingers) and **Pocket Joy cartridges**. [your list]
12. [ ] **Homey Sinnusus** retro colour handheld and **its carts**. [your list]
13. [ ] **Phantic Racing Wheel** and **Phantic Racing Pedal Box** boards. [your list]
14. [ ] Replace the **generic translucent case** on the retro consoles (BES, B64, Vega, Paltari) with proper ones; **controller grips
    and recessed buttons**. [earlier loose end]
15. [ ] **VoltMax**, Button main board and other earlier-planned console / handheld boards. [earlier lists]

## B. Game library, media and artwork
16. [wait] **Art from Codex**: it reused assets, only about 25-30 titles have correct stylised typography; it is redoing the art over
    the next few days. Do not touch the art until you say it is finished. [your latest message]
17. [ ] Run the art optimizer (`tools/build-game-art.py`) once the art is finished; decide the shipped image sizes (about 460 MB raw).
18. [ ] Show each title's **loading screen** at the cart / disc test station.
19. [ ] **Label art on the 3D cartridge, disc and SD meshes** (Blender models need label slots; discs are round with a hub hole).
20. [ ] **Condition grades, per-copy appraisal and unique copy ids** (the CSV columns are empty), **rarity and collector values** in
    the shop, marketplace and sales.
21. [ ] Games for every platform whose hardware does not exist yet (Pocket Joy, Sinnusus, Game Orb, Swamarami, DiscJockie, Funstation 1-4,
    Sbox 1-S, Pyramid): jobs, marketplace items, test stations. [library]
22. [ ] Game names in use on **Button Lite** (6-pin card) and **Retrobit RB35** (microSD).
23. [ ] **Marketplace lots of working games** to buy and sell from the storefront next to repaired devices. [message 111]
24. [ ] Decide how the full 49-53 title lists change cart job frequency and values.
25. [ ] **Posters on the shop walls** from game art; **Codex-made console, phone and electronics ad art** for the walls. [latest]

## C. Start menu, shop scenes, workbench, storefront (planning only so far)
26. [ ] **Start menu** after the loading screen: begin new game, load saved game, delete saved games; needs **multiple save slots**
    (a slot list: name, day, cash, reputation, location, last played; delete confirmation). Codex makes the menu background art.
27. [ ] **Scenes for each location** (garage, small storefront, mall shop): room shells, lighting, windows, doors, storage, signage,
    counter: all built in **Blender**.
28. [ ] **Waiting area for rush customers** (chairs, table, magazines).
29. [ ] **POS system** (register, card reader, receipt printer).
30. [ ] **Display cases and video game racks**, and a **storefront view** (looks only; racks show real stock and game labels).
31. [ ] **Workbench upgrades**: start on the same desk, buy better bench models with small perks as the shop earns money
    (perk ideas to decide: bigger area, parts drawer, lit magnifier arm, ESD mat, fume extractor, second monitor, tool rack, board holder).
32. [ ] Settle the open questions in `WORLD_AND_MENU_PLAN.md` (bench tiers and prices, day / night, camera, which art is Codex-made).
33. [later] **Walk around the shop and serve customers** (post-Steam **DLC**).
34. [ ] **Second and third shop locations** run by hired staff (stretch goal). [message 113]

## D. Devices to create (full lists in `DEVICE_BACKLOG.md`; about 243 devices in all, Steam bar 60-100)
35. [ ] **Bluetooth speakers (4):** Yeets Pill Box, Marshawn Carry-Round, JayCon Pocket Beatz, Blok-Buster Jamz Box.
36. [ ] **Household electronics:** Cry-Away Baby Monitor (camera unit + parent unit, two boards), universal TV remotes (4),
    garage door openers (2), automotive key fobs (6), alarm clocks (3), RainWrangler irrigation controller, LCD TV power supplies (3),
    PC motherboards (4), oven (3), dishwasher (3), washing machine (3), dryer (3) controllers, DVD players (3). [your list]
37. [ ] **Phones and tablets:** Pandroid, MyPhone 16 / 17 / 18 / 19, MySlab Micro / Mini / standard / Mega, Pandroid Slate 7 / standard /
    10 / 12 / 14, Flipper Pro, Boomer49 handset and base. [your lists]
38. [ ] **Laptops:** Grapple Laptop, Venovo Laptop (Wi-Fi chip swap, reflow). [earlier]
39. [ ] **Ding security system boards**; **SoundHalo mains power supply** (dim-bulb tester). [earlier]
40. [ ] **Certified exotic devices:** Fessna Crytation 12 (4 boards), Eagle 2000 JetAir (4), USN F28 T-Rex (6), naval sonar (2), orbital
    modules (3), Project NIGHTGLASS, launch vehicle boards (5), Scamborgeenee Chadventor ECM / TCM / BCM, MeHari F69 ECU / TCM / BCM,
    D Wagon Flex ECM / TCM / BCM, Zeeya Spirit ECM / TCM unimodule, electric-car modules (**your "Electric cars" line was empty: to define**).
41. [ ] **GPT catalog** (58): EV modules, cordless tool controllers (11), gaming peripherals (11), 3D printer boards (5), legacy electronics (14).
42. [ ] Reach **60-100 devices before Steam**; choose the launch set from the 243. [your goal]
43. [ ] Per-device metadata from the new documents: **PCB size class (XS-XXL), density, shape** (store them on the device; no real dimensions).
44. [ ] Decide whether to extend the game's **3 difficulty tiers to the catalog's 6** (T1-T6), and how payout and certification relate.
45. [ ] Later phases: **intermittent faults, BGA work, mains power supplies**. [earlier]

## E. Certified work, premium automotive and tools it needs
46. [ ] **Radio-frequency tester and IR tester** tools for remotes, key fobs and garage openers (RF vs IR distinct; not every remote has both).
47. [ ] **CAN diagnostic pad** for car modules: read trouble codes, supported measurements, output tests, checksum, update / reset firmware;
    depends on rails, transceiver, sensors and firmware state; never auto-solves. No immobilizer cloning.
48. [ ] **"Pretentious customer fee"** plus premium on Scamborgeenee, MeHari and D Wagon; gold-finished contact / test pads.
49. [ ] **Gold plating on factory joints** and conformal coating on car modules (coating system exists).
50. [ ] **Optical media bench** for DVD / CD mechanisms (spindle, sled, pickup, loading, tray, known-good media, playback).
51. [ ] **Safe isolated appliance / TV power fixture** (sense and output channels), **motor / stepper emulator**, **keyboard / mouse input
    tester**, **bench function generator**, **frequency counter / RF fixture**, **LCR meter**, **audio tester**, **safe environmental
    acceptance fixture** (from the catalog's diagnostic list).
52. [ ] **Multi-board customer orders** (baby monitor pair, cordless phone handset + base, Game Orb mainboard + drive): the player
    isolates which board is at fault first.
53. [ ] **TV PSU vs backlight strips vs TV logic board** diagnosis that distinguishes them.
54. [ ] **Service mechanics as job metadata:** turnaround, part approvals, traceability / serial records, OEM pairing, ESD / inspection
    penalties (partly built: certification, deadlines, rush).
55. [ ] **Progression unlock order by tier** and economy hooks (consumer modest payout, tools medium, automotive high, certified very high).
56. [ ] **NIGHTGLASS**: partial power tree and symptom log, no manual; two-stage fault option.
57. [ ] Rare **rewards that unlock fixtures, adapters, scopes or the coating tools**.

## F. Repair mechanics and faults not built
58. [ ] **Wireless (Qi / RFID) charging coil** faults (needs a device with a coil, e.g. MyPhone). [message 111]
59. [ ] **Broken ribbon cable connectors** replaced at the microscope (only a snapped latch from teardown exists).
60. [ ] **Clogged power ports** (barrel / DC jacks); only USB and HDMI done.
61. [ ] **HDD / SSD replacing and re-imaging** beyond console-class drives (laptops, handhelds, PCs); drive hardware in the parts list.
62. [ ] **Transcript fault ideas:** failed noise filter / common-mode choke (charging + HDMI die; needs a part on the boards and re-routing),
    fast-charge negotiation fault (PD chip), faulty dock, BIOS reflash with a programmer and BIOS settings job (secure boot, boot order),
    CPU hot spot at boot, missing core / memory voltage, backlight-only failure, bad SD card tripping the polyfuse again, second
    polyfuse (1.8 V), a revived fuse that trips again because the heat source remains, fuses hidden under tape or putty, bimetal thermal
    switch that resets by cooling, one-month warranty option for borderline fixes, boot loop only when plugged in, battery connector
    "mimic" boot, donor-chip reball workflow, low-melt 138 °C solder technique, "opened before" evidence.
63. [ ] **Real temperature setting for the hot-air reset** of fuses (200 °C slowly, 300-400 °C at once) instead of the heat bar.
64. [ ] A **real 3D camera tip-up** of the board for the port view (it is a drawn view); a **real 3D port interior** in Blender.
65. [ ] Boot-cable / DC-supply fingerprint table you record yourself; rosin / freeze-spray short finding; diode-mode map with board-view overlay.
66. [ ] A smarter **review save** that can pick a specific fault variant, so new faults are easy to inspect. [mine]

## G. Economy and business
67. [ ] **Quote breakdown as separate ledger lines** (labour and parts). [message 117]
68. [ ] **Balance pass:** wages, rents, fit-out costs, service job frequencies, auction behaviour, staff failure rates, certified prices.
69. [ ] Staff beyond what exists: more staff roles or capacity, specialists for certified work, wage / raise tuning.
70. [ ] Storefront walk-in behaviour tied to the real racks and cases once they exist.

## H. Tutorial, audio, polish
71. [ ] **Tutorial script review**: every step says exactly how to interact (left-click, press and hold, which key). [message 106]
72. [wait] **Re-record the tutorial voice** for the reworded steps (`npm run voice`, then verify); **needs your OK**.
73. [ ] **Tutorial steps for the newer mechanics** (USB meter, port view, trace repair, services, staff, certification).
74. [ ] **Browser autoplay** blocks music and voice until the first click.
75. [ ] **TMWB logo and URL on more boards** as they are polished (only the Game & Clock has it). [you said we would add these later]
76. [ ] **Blender models** for replacement screens, case parts, ribbon cables as separate items; real 3D for any new prop.

## I. Quality and housekeeping
77. [ ] **Visual check in a visible browser window** of all new 3D (bench props, crack decals, case cracks, stickers, port view).
78. [ ] The repo history holds an **old set of broken music files (about 56 MB)**: optional cleanup.
79. [ ] Keep these lists current whenever something is requested, started or finished (`STATUS.md`, `DEVICE_BACKLOG.md`,
    `GAME_LIBRARY.md`, `WORLD_AND_MENU_PLAN.md`, this file).
80. [ ] Tests take 2-3 minutes; keep the generic fault variants on fewer seeds; watch new device counts (every device adds to the
    generic-fault test matrix).

---

## Decisions I need from you (collected from everything above)
- What "Electric cars" in your last device list was going to be.
- Whether to extend the game to 6 difficulty tiers (catalog) or keep 3 and map the catalog tiers.
- Which 60-100 of the roughly 243 devices make the Steam launch set, and which wave to build first.
- Order: the console wave first, or MyPhone / laptops, or the start menu and scenes.
- Bench tier count, prices and perks; scene camera style; save slot count.
- Shipped art image sizes, and whether the art ships inside the game or is downloaded.
- When the art is finished (so the optimizer and the loading screens can be wired in), and when to re-record the voice.
