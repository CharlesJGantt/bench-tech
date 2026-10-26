# Bench Tech: complete status (updated 2026-10-26)

Built from re-reading all 141 of your messages in the chat and checking the code. 965 tests pass; everything below
marked Done is committed and pushed (the game library wiring from 2026-10-26 is committed with this note). Not verified by eye: the preview pane is hidden, so 3D never redraws there. All
3D (props, crack decals) was checked by tests, typecheck and loading the game without console errors only.

**The task-by-task list of everything not yet built is `docs/TODO_MASTER.md`.**

Legend: DONE, PARTIAL (part of what you asked), TODO (not started), NEXT (agreed, about to build).

---

## 1. Core game and simulation (your first messages)
| Request | Status |
|---|---|
| Electronics repair simulator with PlayCanvas (concept doc) | DONE |
| Usable multimeter (one probe, then the next; probes not connected at start) | DONE |
| Real circuit simulation (12 V, 5 V, 3.3 V rails, LEDs light, correct readings) | DONE |
| Real PCB traces from the netlist, traces on every part, flip the board to see the bottom | DONE |
| Microscope part removal / soldering / desoldering physics | DONE |
| Router no longer joins power and ground at connectors | DONE |
| Black components readable | DONE |

## 2. Business layer (messages 14, 15, 17)
| Request | Status |
|---|---|
| Business screen after a job: profit and loss, supplies, reorder, advertising, rent, electricity | DONE |
| Buy broken electronics online to repair and sell; may be pre-repaired, missing parts, or unrepairable (keep it as a donor) | DONE |
| Upgrades: soldering tip shapes, hot-air nozzles, low-melt solder, wick sizes, flux grades | DONE |
| Brush looks like a toothbrush and wears out; wipes and IPA consumed per use | DONE |
| Demand mode: popular devices sell for more; expensive parts ordered in for 1-2 days | DONE |
| Spare-for-parts offer to the customer; next-day delivery option with the customer agreeing | DONE |
| Waiting on a donor board; browse the internet for a donor; store-room of parts-only boards | DONE |
| Misaligned chips visible at the microscope | DONE |
| Wick turns silver per joint and has to be binned | DONE |
| Bugs from message 17 (part resets after leaving the microscope, wick unusable on other boards) | DONE |
| Reset game / reset career on day 1 with a starter pack of parts (messages 49, 51) | DONE |
| Pink pencil eraser, magic sponge, Pad-Bright for scrubbing cartridge contacts (message 52) | DONE |

## 3. Failure modes and tools (messages 17, 25-27)
| Request | Status |
|---|---|
| Read the repair transcripts, extract scenarios; more failure modes | DONE |
| Bad capacitors (ESR meter), fried chips (oscilloscope), damaged ports, bad inductors, transistors, retimers | DONE |
| Voltage injection from the PSU, thermal camera (heat or no heat), diode mode, level-shifter faults | DONE |
| Disassembly of cases (screws, clips, adhesive, shields, heatsinks, ribbons) with mistakes | DONE |
| Corrosion cleaner, flux cleaner; corrosion looks green / yellow / purple / black mottled | DONE |
| Previous-repair faults: solder bridges, hidden whiskers and balls under chips | DONE |
| Microscope upgrades: stronger objectives, ring light, tilt arm | DONE |

## 4. Devices (messages 27, 30, 32, the new device documents, and the Steam goal)
**Built (34):** lamp, Bluetooth speaker, TV backlight board, Sbox One X power board, Button handheld, Button Lite,
Funstation 5 HDMI section, Retrobit RB35, Rogue Pal, Duo handhelds, Game & Clock, Critter mini, arcade board, the six
Dream Boy models, BES, B64, Vega Exodus, Paltari console, DualPulse / Sbox / Button Grip controllers, and the carts for
the retro consoles. Cart test station, working console tools, customer home test, 10 % refund on a failed cart: DONE.

**Everything still to create is itemised in `DEVICE_BACKLOG.md`: roughly 243 devices in all** (the Steam bar is 60-100):

| To create | Count | Where it is listed | Status |
|---|---|---|---|
| **New game consoles and handheld** (DiscJockie 1, 2, 3, Pocket; Funstation 1-4; Sbox 1, 2, 720, 10, S, One X; **Bintendo Pyramid**) | 15 entries, 41 boards | backlog section 2b | TODO |
| **Console controllers** (one unique shell and PCB per non-handheld console, colour variants for each) | 21 | backlog section 2b | TODO |
| **Media formats** (disc, mini-disc and cartridge media ids, meshes, drive behaviour; Bintendo Mini-Disc is its own format) | 15 | backlog section 2b | TODO |
| Disc drive boards for every disc console (including Funstation 5 and Sbox One X, which only have HDMI / power boards) | with the consoles | backlog section 2b | TODO |
| Original list: Bluetooth speakers, baby monitor, remotes, garage openers, key fobs, alarm clocks, irrigation, TV supplies, PC boards, appliance controllers, DVD players, racing rig, Pocket Joy, Homey Sinnusus, Game Orb, Swamarami, phones, tablets, Flipper Pro, Boomer49, avionics, premium cars | 90 boards | backlog section 3 | TODO |
| GPT catalog (naval, orbital, NIGHTGLASS, launch, EV, cordless tools, peripherals, 3D printers, legacy electronics) | 58 | backlog section 4 | TODO (suggestions) |
| Earlier plans: Grapple and Venovo laptops, Ding boards, MyPhone 16-19, SoundHalo supply, Funstation 5 power section and Pro, Sbox One X main board, Button main board, VoltMax | about 25 | backlog section 2 | TODO |
| Retro consoles still use a generic translucent case; controller grips and recessed buttons | | | PARTIAL |

## 5. Tutorial, presentation and sound
| Request | Status |
|---|---|
| Tutorial walkthrough with skip; numbered steps; click lock-out | DONE |
| Tutorial fixes (messages 66, 69, 71: wick with flux first, fuse naming, highlights, iron timing, reflow temperature, cleanup, test, case, return) | DONE |
| Second tutorial for the Office | DONE |
| Narrated voice for the tutorial (63 clips, checked against the text) | DONE |
| Loading screen (12 s, 3 phrases, glitch text, easter egg) | DONE |
| Soundtrack: shuffle, mute, volume, collapsible panel, first-time hint, starts on a random track | DONE |
| Review save with one job for every device (`?review`) | DONE |
| Tutorial script review so every step says exactly how to interact | TODO (your OK needed to re-record voice) |
| Tutorial has no steps for the newer mechanics (USB meter, port view, trace repair, services, staff) | TODO |
| Browser autoplay blocks music and voice until the first click | TODO |

## 6. Game & Clock and board art
Larger PCB and case, controls, clock/game screen, speaker holes, labels, TMWB logo and URL on the silkscreen: DONE.
The logo and URL on the other boards as they are polished: TODO (only the Game & Clock has it).

## 7. Sales (message 110)
Auction with reserve and bidding, buy-it-now, storefront, listing window with forecast, selling fees, Sales tracker tab:
DONE. Buying lots of working games on the marketplace to sell next to repaired devices (message 111): TODO.

## 8. Shop progression (message 113)
Garage, small storefront, mall (rent, fit-out, traffic, extra customers, storefront sales gated): DONE.
Employees (storefront 1, mall 2, wages, daily repairs, raises, Staff tab): DONE.
Second and third locations run by staff (stretch goal): TODO.

## 9. Services and pricing (messages 117-119)
| Request | Status |
|---|---|
| Overheating cleaning and thermal-paste service | DONE |
| Quotes scale with device value and fault difficulty; parts billed on top | DONE |
| Quote breakdown on the ticket and in the debrief | DONE |
| Same breakdown as separate ledger lines | PARTIAL |
| Compressed air blower tool; cleaning swabs, wipes, IPA wipes | DONE |
| More services built: customer accessory (charger / cable), case repair, hard reset, drive re-image or replace, scratched disc buffing station | DONE |

## 10. Repair wishlist (message 111)
| Request | Status |
|---|---|
| Lifted pads, scratched traces, corroded-away pads; pen grinder, copper wire gauges, UV solder mask colours, UV lamp | DONE |
| Ripped-off port (pads torn off by a fall) | DONE |
| Cracked screens; broken cases and plastic parts to replace | DONE |
| Bad customer power adapter, sell a new one | DONE |
| Scratched game discs and a buffing service (disc buffer, polish) | DONE |
| Hard reset | DONE |
| Thermal fuses: one-shot replaced, PPTC polyfuse revived with hot air; Kapton tape masks meltable parts | DONE |
| USB power meter (boot pull, settle, charge ramp, fast-charge voltages, charger and cable comparison, battery capacity) | DONE |
| Torn ribbon cables (fit a new one) | DONE |
| Broken ribbon cable connectors that need replacing | PARTIAL (only a snapped latch from teardown mistakes) |
| Clogged USB and HDMI ports | DONE |
| Clogged power ports (barrel jacks) | TODO |
| Wireless (RFID / Qi) charging coil faults | TODO |
| HDD / SSD replacing or re-imaging | PARTIAL (consoles only) |
| Buy lots of working games for the storefront | TODO |

## 11. Port inspection and liquid damage (messages 136 and the latest)
| Request | Status |
|---|---|
| Look into the USB / HDMI port with tweezers, pick, blower, swabs; debris; bent pins need a new port | DONE |
| Port end view inside the microscope (eyepiece, wheel zoom, ring light on L) reached from the pad view or the component panel | DONE |
| Corrosion crust visible on the port pins; bent and mangled pins visible | DONE |
| Liquid damage indicator stickers on the PCB (beside ports, battery connector, game slot, main chip): white when dry, red where liquid reached; the inspector points at a red one | DONE |
| Real 3D camera tip-up of the board (the end view is a drawn view, not a camera move) | PARTIAL |

## 11b. Certified work (new request: avionics, orbital, military, some automotive)
| Request | Status |
|---|---|
| Certified parts (a higher tier of existing parts at a higher price): certified stock per part, ordered separately at 8x the price, picked in the rework tray, billed at certified prices | DONE |
| Certified consumables that cost a lot more: certified solder (25 g, $120), certified no-residue flux ($95) | DONE |
| Repair analysed and certified before payment: lab fee per analysis, itemised pass / fail report, customer pays only on a pass | DONE |
| Conformal coating: remove around the repair area (pen grinder + remover), put it back (coating + UV lamp), analysis fails if left off | DONE |
| Flux must not be left on the board; stricter heat limit on the joints; uncertified solder / flux recorded as violations | DONE |
| Premium quote, rush deadline (late hand-in pays 40 % less; customer leaves after the deadline), certified jobs excluded from the service jobs | DONE |
| Overnight delivery requirement for rush parts (`CertSpec.overnight`): certified part orders go express while such a job waits | DONE |
| `DeviceDef.cert` flag so any new device can be certified work | DONE |
| The certified devices themselves (Fessna, Eagle, F28, Scamborgeenee, MeHari, D Wagon Flex, Zeeya, NIGHTGLASS, naval, orbital, launch) | TODO (see DEVICE_BACKLOG.md) |
| Radio / IR tester tool for remotes and key fobs; CAN diagnostics pad for engine modules | TODO |
| Extra service fees ("pretentious customer fee") on high-end automotive | TODO |

## 12. USB meter and diagnosis tools (messages 129-132 and the pasted list)
Boot pull / settle / charge ramp, no-battery fluctuation, short brown-out, fast-charge negotiation, charger and cable
comparison, charge counter and capacity test, prompt-to-boot current curve, USB port diode tester, drive imager:
DONE. Shorted charger IC, shorted surge clamp, stuck PPTC fuse: DONE.

## 13. 3D models (rule: use Blender)
Bench props in Blender (tweezers, pick, USB meter with live display, air blower, pen grinder, UV lamp, port tester, disc
buffer, drive imager, Kapton roll), crack decal over screens and cases: DONE.
Blender models for replacement screens, case parts and ribbon cables as separate items: TODO. A real 3D port interior: TODO
(the port view is 2D). Liquid-damage stickers are drawn into the board art (DONE).

## 14. Ideas from the repair-video transcripts (docs/fault-ideas-from-transcripts.md)
Noise-filter failure (charging + HDMI die together; needs a part on the boards and re-routing), fast-charge negotiation
fault (PD chip), faulty dock, BIOS reflash with a programmer, BIOS settings job, CPU hot spot at boot, backlight-only
failure, bad SD card tripping the fuse again, second polyfuse (1.8 V), fuse that comes back because the heat source
remains, fuses hidden under tape or putty, bimetal switch that resets by cooling, one-month warranty option: all TODO.

## 15. Quality and housekeeping
- Visual check of all the new 3D in a visible browser window: TODO
- Balance pass (wages, rents, fit-out, service frequency, auction behaviour, staff failure rates): TODO
- Review save cannot pick a specific fault, so new faults are hard to inspect on demand: TODO
- Full tests take 2-3 minutes; generic fault variants run fewer seeds to keep it down: ongoing
- The repo history holds an old set of broken music files (about 56 MB): TODO (cleanup optional)
- Hot-air reset uses the soldering heat bar, not a real temperature setting (the video used 200 °C slowly, 300-400 °C at once): TODO
- Interview and pricing questions (messages 107, 114-116) were answered in chat only: nothing to build

## 16. Game library, media and artwork (new documents, 2026-10-26)
Details in `GAME_LIBRARY.md`.
| Item | Status |
|---|---|
| Game library of **1,396 titles on 28 platforms** (CSV + catalog + manifest in `docs/`), 34 original titles kept | DONE (data) |
| Library loaded into the game (`tools/build-games.py` to `src/data/games.json`, `src/sim/games.ts`); retro carts and the Funstation 5 / Sbox One X disc jobs draw their titles from it | DONE |
| Art by **Codex** (labels, discs, SD cards, loading screens; one set per title per console, reused for cross-platform games): 2,792 files; **Codex reused assets in its first pass, so only about 25-30 titles have correct stylised title typography; it is redoing the art over the next few days**; raw art is not in git; **we do not touch the art until it is finished** | WAITING |
| Optimiser that makes small in-game copies of the art (`tools/build-game-art.py`) | WRITTEN, NOT RUN |
| Show each title's loading screen at the cart / disc test station | TODO |
| Label art on the 3D cartridge, disc and SD meshes (Blender models need a label slot) | TODO |
| Condition grades, per-copy appraisal, rarity and collector values in the shop and marketplace | TODO |
| Games for platforms whose hardware does not exist yet (Pocket Joy, Sinnusus, Game Orb, Swamarami, DiscJockie, Funstation 1-4, Sbox 1-S, Pyramid) | TODO with the consoles |
| Game titles for Button Lite and Retrobit RB35 cards in play | TODO |
| Marketplace game lots; storefront game racks | TODO |

## 17. Start menu, shop scenes, workbench upgrades, storefront view (planning, `WORLD_AND_MENU_PLAN.md`)
| Item | Status |
|---|---|
| Start menu after the loading screen: begin new game, load saved game, delete saved games (multiple save slots); background art by Codex | TODO (planning) |
| Scenes for each location (garage, small storefront, mall shop), all assets built in Blender; wall posters from game art plus Codex-made console / phone / electronics ads; waiting area for rush customers; POS system; display cases; game racks | TODO (planning) |
| Start on the same desk; buy better workbench models with small perks as the shop earns money | TODO (planning) |
| Storefront view of display cases and video game racks (looks only; racks show real stock and game labels) | TODO (planning) |
| Walking around the shop and serving customers | LATER: DLC after Steam launch |

## Suggested order (not decided: we are planning)
1. Finish planning: the order of the console wave, the start menu and the shop scenes
2. The new consoles with their disc drives, media and controllers (backlog section 2b), once the art is done enough to use
3. MyPhone with a wireless-charging coil; laptops, Ding boards, SoundHalo supply, Funstation 5 power section
4. Start menu with save slots, workbench upgrades, shop scenes and storefront view
5. Marketplace game lots; broken ribbon connector fault; clogged power ports; drives beyond consoles
6. Tutorial script review and new-mechanic steps (voice re-record when you say so)
7. Second and third locations; balance pass; transcript fault ideas
