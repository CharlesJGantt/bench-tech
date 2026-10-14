# Bench Tech — implementation plan (v2 content push)

Covers everything requested on 2026-10-14:
- disassembly;
- corrosion and flux chemistry;
- microscope upgrades;
- solder-bridge faults;
- BGA reballing;
- the failure-mode catalog;
- new diagnostic tools;
- a much larger board catalog with real mains power supplies.

Research sources: `docs/repair-scenarios.md` (sections 1–11).

**Guiding goal:** today a repair mostly means "find the bad resistor or joint". After this push a job should feel like a real bench:
1. Open the device.
2. Triage by power-up behaviour.
3. Follow the power tree and signals with the right instrument.
4. Isolate the fault.
5. Do the rework, which can be anything from a 0402 cap to a reballed BGA.
6. Clean, reassemble, and stress-test.

---

## Phase 0 — Engine headroom (do first; everything else depends on it)

The current engine is fine for the ~40-part boards we have. It will not scale to laptop, console or phone boards with 200–400 parts.

| Item | Why | Approach |
|---|---|---|
| **Sparse solver** | The dense Gaussian elimination is O(n³): a 900-node board is about 100× slower per Newton step | Sparse LU with fixed node ordering (AMD/RCM), with the symbolic factorisation reused between solves. Keep the Newton + line search + pseudo-transient fallback. |
| **Analytic Jacobians** | The per-element finite-difference Jacobian multiplies cost by the number of terminals | Add an optional `stamp()` with exact derivatives to `resistor`, `diode`, `mos` and the sources; keep the finite-difference fallback for exotic elements |
| **Power domains** | Most of a big board is "chip powered or not" | Solve the power tree in detail. Chips become **macro elements**: rails in, enable in, power-good out, current draw, and logic I/O pins with drive strength. No transistor-level chips. |
| **Routing cache** | The A* router takes seconds on 140×86 mm; a laptop board would take minutes | Route at **build time** (`npm run boards`) into `public/boards/<id>.json`, fingerprinted by netlist + layout hash. The runtime loads that and falls back to live routing in dev. The geometry test runs on cached output. |
| **4-layer boards** | Real motherboards. Also enables the "cracked via" fault and "only visible from one side" checks. | Router gets inner layers (shown as greyed copper when flipped). Vias become first-class objects that can be faulted. |
| **Subcircuit blocks** | Hand-placing 300 parts per board is not feasible | Reusable typed blocks with their own fault variants: `UsbCPdInput`, `BuckRail`, `LdoRail`, `LiIonCharger`, `HdmiOut` (port + ESD + retimer), `FlybackSmps`, `LinearPsu7805`, `WifiModule`, `BtModule`, `EcWithBios`, `CartridgeSlot`. A device is mostly a composition of blocks plus a few unique parts; blocks auto-place inside a region and the router connects them. |
| **Board LOD in render** | 300 part meshes plus labels | Instanced meshes per package; text and markings only when zoomed in. |

**Acceptance:**
- A 300-part synthetic board solves its operating point in under 50 ms.
- The fault test suite for all devices stays under 2 minutes.
- Existing devices are migrated to blocks without behaviour change (all current tests pass).

---

## Phase 1 — Bench craft: chemistry, microscope, bridges, cleaning

Small systems that make *every* existing board better right away.

### 1a. Corrosion as a physical layer — ✅ done (`src/sim/corrosion.ts`)
- *As built:* crust is per pad (`CompState.corr`), dominant colour per spill, mottled with the other four. Series R above 0.25 crust, open at 0.95; leakage between neighbouring crusted pins; solder won't wet above 0.25; spreads +0.04/day and creeps onto pads within 5 mm while the job waits in the queue. Evaluation: crust > 0.2 is a comeback. New fault `input-corroded` (cleaning alone fixes it). Bench Liquid tool floods with the kit liquid (corrosion cleaner takes 70% per pass).
- **Data:**
  - Per-pad and per-area `corrosion` (0–1) with a **type mix**: green (copper salts), yellow/white (electrolyte/sulfates), purple-blue (cobalt/oxide tint), black (burnt/sulfide).
  - Corrosion adds series resistance to joints and can **eat traces** (open) or **bridge pins** (leaky short, a few kΩ down to Ω).
- **Rendering:**
  - Procedural mottled decal (noise-blended green/yellow/purple/black crust) on the PCB texture and over pads in the microscope.
  - It gets duller as it's dissolved and leaves a grey **sludge** until scrubbed off.
- **Spreading (progressive damage):** an un-cleaned liquid-damaged board gains corrosion each in-game day, so leaving a job to wait has a cost.

### 1b. New consumables — ✅ done
- *As built:* the microscope Liquid tool (6) applies the kit's cleaning liquid. Unknown flux: IPA ×0.08 clean rate; flux remover ×5 on it (×1.5 on normal flux); corrosion cleaner is a poor flux solvent (×0.6).
| Supply | Use | Rate | Price |
|---|---|---|---|
| **Corrosion cleaner** | Dissolves corrosion → sludge | Same as IPA | IPA × 1.4 |
| **Flux cleaner** | Removes flux about 1.5× faster than IPA; strips **factory/unknown flux** (hard baked residue from other repairers) that IPA barely touches | Same as IPA | IPA × 1.6 |

- **Flow:** apply corrosion cleaner → wait (it fizzes) → scrub with the brush → **IPA rinse** → wipe.
- If the sludge is left behind it dries back to a crust and still conducts a little (leakage in MΩ), creating a "clean it properly" fault mode.
- New residue type **`unknown-flux`**: amber, glassy, from previous repairers. It resists IPA (×0.25) but responds to flux cleaner.

### 1c. Microscope upgrades (Equipment tab) — ✅ done
- *As built:* wheel zoom (anchored at the cursor), right-drag pan, 0 resets. Max zoom: stock 1.5× of the fitted view, 1.0× objective 2.5×, 2.0× objective 4×. Ring light (L) and tilting arm (T) are Tools-tab purchases; tilt draws the part see-through. `bridgeVisible()` in the rework model is the visibility rule.
| Item | Effect |
|---|---|
| Stock 0.7× objective | Today's view; 0603 is comfortable |
| **1.0× / 2.0× objectives** | Zoom ceiling ×1.5 / ×3; required to see 0402/0201 joint cracks and fine-pitch bridges |
| **0.5× Barlow** | Wider field for big connectors and shields |
| **Ring light** | Reveals hairline cracks and dull joints (raises the detection threshold) |
| **Angled / tilt view** | Lets you see *under* gull-wing pins and the edge balls of a BGA: hidden bridges, head-in-pillow joints |

**Visibility rules:** each defect has a `visibility` (size and whether it's hidden). A defect is shown only if the current magnification, lighting and angle meet its threshold. This is the hook for "only visible under the microscope".

### 1d. Solder-bridge faults (previous repairer) — ✅ done
- *As built:* `Jumper.hidden: 'whisker' | 'ball'`. Whiskers need zoom ≥ 2.5× (or ring light at ≥ 1.5×) and pull back with flux + a molten joint; balls show only tilted and leave when the chip is lifted. Hidden bridges are not drawn on the board and the inspect panel no longer lists bridges as removable wires. HDMI block faults: `prev-port-whisker` (tier 2), `retimer-ball` (tier 3).
- **Visible blobs:** big bridges across HDMI or QFP pins, and solder splashed onto neighbouring parts. Seen on the bench or in the inspect view.
- **Microscope-only bridges:** thin whiskers between fine-pitch pins, or a solder ball under a chip. The board inspect view says nothing; the microscope needs enough magnification, or tilt for under-chip balls.
- Bridges are already real shorts in the sim (`bridge` jumpers). These variants just pre-seed them with the visibility rules. The fix is wick + flux, or drag soldering.

**Acceptance:** each new consumable is used up in rework; corrosion renders in all four colours; bridge variants pass `faults.test.ts`; visibility has unit tests.

---

## Phase 2 — Disassembly and reassembly

**Step 1 — ✅ done:** `src/sim/enclosure.ts` (model) + `src/sim/enclosures.ts` (all six devices) + `src/ui/teardown.ts` (top-down teardown station: tools 1–4, Put back 5, screw mat, paste, drill-out; guided "Open it for me / Close it up for me" and warnings before mistakes). Jobs arrive closed (`Job.enclosure`); probing/soldering/flipping need the case open; the closed case shows as a smoked shell in 3D. Mistakes: snapped clips, cracked cold-pried panels, torn ribbons/wires (module fault), broken latches, long screws punching inner layers (`pcbDamage.screw`, fixed by drilling the via out with the micro drill), heatsinks back on old paste. Torn warranty stickers on intake are a clue. The tutorial lamp arrives open.
**Still to do:** Blender models for shells/screws/shields/heatsinks/fans and a 3D teardown; stripped screws; battery-connected sparks; liquid metal; magnetic screw-map mat; thermal paste affecting temperatures in the sim (today it is a comeback).

### Model
- Each device gets an **enclosure graph**: parts (shells, screws, clips, adhesive panels, shields, heatsink, fan, battery, ribbon cables, daughterboards, thermal compound) with **prerequisites**. For example: shield needs its 6 screws out → heatsink needs the shield off → board lifts once the cables are unplugged.
- **Screws** have a type and length. Putting a **long screw in a short hole** risks punching through inner layers (a real fault: shorted internal traces). Stripped screws need the grind-slot trick or a shell swap.
- **Clips and adhesive:**
  - Prying without heat can break clips (a cosmetic loss in value).
  - Adhesive needs heat (iron plate / hot air) first.
- **Ribbon cables and latches:**
  - Opening the latch the wrong way breaks it.
  - Pulling the cable without opening the latch tears it.
  - Both are real faults that persist.
- **Battery:** disconnect it first; working with it connected risks shorts and sparks (an event).
- **Thermal interface:** paste, putty, pads or liquid metal. A dry spot or wrong compound raises temperature and causes three-beep shutdowns. Liquid-metal spills short components.
- **Warranty sticker:** voided on opening; inspecting it is a clue that someone was there before ("lying listing").

### UX
- An **exploded/teardown view** in 3D: the device sits on the mat, and the player clicks the highlighted removable items. A tool hint appears per item (screwdriver bit, spudger, heat).
- A **screw map** on a magnetic mat; reassembly reads it.
- **Reassembly checklist:** missing screws, unplugged cables and missing pads become faults found in the functional test or as comebacks.

### Content
Enclosures for all existing devices first (the DL-12 lamp gets the simplest), modelled in Blender: shell halves, screws by length, ribbon cables as simple strips.

**Acceptance:** every device can be fully torn down and rebuilt. Teardown mistakes create the listed faults. A board can't be reached without opening it, but **guided mode allows an "open it for me" skip** to keep things approachable.

---

## Phase 3 — Failure modes, intermittents, tools

### 3a. Quick-win faults (from catalog §11)
All are small element or parameter tweaks:
- resistor drift;
- cracked ceramic (short + crack mark);
- lost capacitance;
- tantalum short (new kind, burnt mark);
- MOV short;
- leaky diode;
- MOSFET high Rds-on / leaky gate;
- dead crystal (MCU not running, no clock on the scope);
- missing battery NTC;
- worn tact switch;
- degraded polyfuse;
- flux-residue leakage, cleared only by cleaning;
- tombstoned part and delamination as rework outcomes.

### 3b. Fault bundles (job generator)
The generator picks a **cause** and applies a believable set:
- **Surge:** TVS + fuse, maybe the charger and a scorch.
- **Wrong charger:** TVS, charger, bias resistor.
- **Reverse polarity:** protection diode/FET and fuse.
- **Liquid:** spreading corrosion at the entry point.
- **Drop:** cracked caps, torn connector, cracked BGA, loose parts in the case.
- **Age:** dried caps, fan, cracked hot joints.
- **Cascade:** a small part plus the big part it killed. Fixing only the small part leaves it dead, or kills the new big part.
- **Previous repairer:** bridges, unsoldered parts, wrong screws, unplugged cables.

`faults.test.ts` is extended so canonical repair of the *whole bundle* returns the board to "fixed".

### 3c. Intermittent faults
- **Fault conditions:**
  - `whenHot(°C)`, `whenCold`, `whenFlexed`, `underLoad`, `afterMinutes`.
  - These use the lagged temperature model that already exists, plus new board-flex and load states.
- **Functional test:** gains a **stress phase** (game load for 2 simulated minutes, then a warm-up). The customer test therefore catches what a quick bench check misses.
- **New tools:** **freeze spray** (consumable; drops a part to −20 °C), a **flex/press** action on the board, and the hot-air "warm a suspect" use.

### 3d. Instruments
| Tool | Unlocks |
|---|---|
| **USB-C PD meter** | Live voltage/current graph (5 → 15 V negotiation, boot loops, charge curves) |
| **Bench supply current trace** | Standby current signatures per board (the Funstation chart) |
| **Serial console** | Boot logs / error codes from boards with a debug port |
| **Firmware programmer** | Read/flash BIOS/EC/MCU chips; factory images bought or ripped from donors; copy-protected chips can't be read |
| **LCR meter** | Capacitance/inductance in circuit (replaces the ESR meter later) |
| **Dim-bulb tester** | Safe mains power-up mode: a short lights the bulb instead of exploding |
| **Preheater** | Required for BGA work and big boards; prevents warping and delamination |
| **Known-good reference** | Keep a working board of a model and compare diode/Ω readings side by side |

---

## Phase 4 — BGA work and reballing

### Model
- A BGA is a `PackagedChip` with a ball grid. Ball states: good, cracked (intermittent), missing, bridged, head-in-pillow.
- Board pads can be torn (lifted) from heat/pull, with the same rules as QFP pads.

### Removal and fitting
- **Removal:**
  - Preheater plus top hot air.
  - A **temperature profile** graph (preheat → soak → reflow); the "nudge test" shows the balls are molten.
  - Too fast or too hot warps the board, lifts pads, or cracks the die.
- **Pad prep:** flux + wick to level the pads, then flux cleaner.
- **Fitting:** align to the silkscreen corner marks, reflow, nudge to see it self-centre, then a post-reflow check (X-ray in a later tool tier; for now, a functional test).

### Reballing (the skill ladder)
1. **Manual balling (starter):**
   - Put flux on the chip.
   - Place solder balls one at a time with tweezers (mini-game: a grid of targets, with tremor/precision affected by magnification).
   - Reflow with hot air.
   - It's slow, but it costs only a jar of balls.
2. **Stencil + paste (upgrade):**
   - Clamp the chip and its **model-specific stencil** in a **reballing vise/jig**.
   - Smear paste across the stencil, scrape off the excess, wipe.
   - Heat with hot air until the paste coalesces into balls in each hole.
   - Lift the stencil.
3. **Stencils:**
   - Bought per BGA type (`stencil-<package>`).
   - They have **warp wear**: overheating (too hot or too long) adds warp. A warped stencil gives uneven balls (missing or bridged), and once past its limit it must be replaced.
4. **Supplies:** solder balls (per diameter), solder paste (leaded / lead-free), stencils, a better vise and jig.

**Acceptance:**
- A RAM chip can be removed, reballed (both methods) and refitted on the Funstation 5 Pro variant.
- Stencil warp is persisted.
- Every BGA fault variant has a canonical "reflow" or "reball" repair in tests.

---

## Phase 5 — Mains and big-board electronics

- **Mains input model:** a `MainsSource` (with an optional dim-bulb series lamp), a bridge rectifier, a bulk cap at ~325 V DC, and **danger zones**. Probing the hot side unpowered is fine; powered, it needs the isolation transformer (a tool) or you get a shock event.
- **`FlybackSmps` behavioural block:**
  - Start-up resistor → PWM IC VCC (UVLO).
  - PWM IC drives the primary MOSFET; current-sense resistor.
  - Transformer to secondary rectifiers and output caps.
  - TL431 + optocoupler feedback.
  - **Failure modes:** open start-up resistor, dead PWM IC, shorted MOSFET + sense resistor + IC (cascade), dried output caps (hiccup/ripple), aged opto (overvoltage), shorted secondary diode.
- **`LinearPsu`** (retro): transformer, bridge, big filter caps, 7805-style regulators. Hum/ripple from dried caps on the scope.
- **Multi-rail sequencing:** standby rail → EC/south-bridge → enable → main rails → power-good chain → CPU/APU boot. Driven by the power-domain macros from Phase 0.

---

## Phase 6 — Board catalog

Each board is built from Phase-0 blocks plus unique parts. Every board ships with:
- tiered variants and **cause bundles**;
- a service sheet (power tree + test points + the current signature);
- an enclosure;
- donor/parts value;
- `minReputation`.

### Wave A — quick wins on existing tech (your list + my top 5)
| Board | Highlights |
|---|---|
| **DualPulse controller** (+ controllers for each console: Sbox pad, Button Grips) | stick potentiometer drift, trigger spring, worn membrane, torn touch-pad ribbon, USB-C port, battery, BGA reflow (no charge), liquid damage, wireless-chip swap |
| **Button Lite** | corroded backlight connector → 95 mA boot loop, isolate by unplugging the daughterboard, eaten trace, corroded buttons, card reader, flat-battery no-fault-found |
| **Retrobit RB35** | missing bias resistor of unknown value (try values from a resistor kit), corroded USB-C |
| **BoomPuck** (existing) | add a **BT chip swap** variant (QFN rework) |
| **Retro cartridges** (one per retro console, different game names) | dirty edge connector (IPA + eraser), dead save battery (lost saves; tabbed coin cell), blown resistor, bad caps, corrosion, lockout-chip fault, cracked board edge |

### Wave B — real mains PSUs and the power-tree boards
| Board | Highlights |
|---|---|
| **SoundHalo smart speaker** | flyback SMPS: open start-up resistor → dead PWM IC, dim-bulb power-up, Wi-Fi chip swap |
| **Funstation 5 — power/standby board** | standby current signatures, EN→PG chain, missing 3.3 V standby, rail isolation by lifting a coil, Ethernet lightning (unrepairable), coin-cell drain |
| **Sbox One X — main board** (expanded from the current power board) | HDMI port + retimer, PSU swap, storage drive (E-codes), Wi-Fi module, APU reflow |
| **Ding security doorbell/hub** | outdoor corrosion, Li-ion charging, PIR sensor, camera ribbon, Wi-Fi module swap, firmware reflash |
| **VoltMax 1000 inverter** | shorted MOSFET banks (replace all), gate drivers, fuses, copy-protected MCU (unrepairable class), load test |

### Wave C — full motherboards (needs Phases 0, 2, 4)
| Board | Highlights |
|---|---|
| **Funstation 5 main board** (+ **5 Pro** variant) | HDMI port/encoder, APU dry spot, serial error codes, RAM BGA reball, Pro-only RAM grade (import wait), SSD controller, lying-listing refund dispute |
| **Button main board** (expanded) | PD input, charger, PMIC, BGA reflow, card reader, Wi-Fi, back-light |
| **Grapple laptop** | USB-C PD controller, charging, EC + BIOS chip (reflash), liquid damage (the classic), backlight fuse, keyboard/trackpad flex, CPU VRM short (lift-the-inductor isolation) |
| **Venovo laptop** | DC jack and charger, BIOS corruption (programmer), RAM slots, Wi-Fi card, hinge-cable break (intermittent with lid angle), fan/thermal shutdowns |
| **MyPhone 16 / 17 / 18 / 19** | charge-port flex, battery health, screen + backlight, paired parts (screen/battery "unknown part" warning), stacked logic board, audio IC, Wi-Fi/BT module, liquid damage under shields, BGA reflow; newer models raise difficulty and part cost |

### Wave D — retro and prestige
| Board | Highlights |
|---|---|
| **Dream Boy Color** (+ Dream Boy family) | battery-leak corrosion restoration, rusted springs, jumper rebuild, speaker |
| **Bintendo Entertainment System** | 72-pin-style cartridge connector (clean/replace), lockout chip, RF/composite output, linear PSU, recap |
| **Bintendo 64** | expansion slot, RCP/RAM reflow, cartridge slot, PSU module |
| **Vega Exodus** | linear PSU, video encoder, audio amp recap, cartridge slot |
| **Paltari Family Console** | power switch contacts, RF modulator, joystick ports, recap |
| **DuoScreen i XL** | swap-the-suspects (power board → Wi-Fi board → screens), camera ribbon, loose caps after a drop |
| **Galaxy Raid arcade logic stack** | socketed TTL counters (scope), worn single-leaf sockets, EPROM legs, the mis-plug disaster, rare parts from abroad |

**Naming:** the retro handheld line uses your name, **Dream Boy** (Dream Boy, Dream Boy Pocket, Dream Boy Color, Dream Boy Advance / Advance SP / Micro). "Play Kid" in the research doc is the same family.

### Retro consoles + cartridges (detailed)
**Cartridges:**
- Each console has **one cartridge board design** (its own PCB, edge connector, mask ROM, and sometimes a save RAM + coin cell, a lockout chip, or a cap).
- That board ships under **several game titles** (labels, box art and resale value differ; the board is the same).
- Cartridges show up as cheap customer jobs, marketplace lots ("box of 10 untested carts"), and test media for console repairs. A console with a dirty slot fails *every* cart; a dead cart fails in *every* console.

| Console | Console faults | Cartridge titles (fictional) |
|---|---|---|
| **Dream Boy** (+ Pocket / Color / Advance / SP / Micro) | battery-leak corrosion on contacts and board, rusted springs, vertical lines (LCD ribbon needs re-bonding with the iron), dead speaker, power switch, contrast pot, bulged battery (SP/Micro) | *Blockfall*, *Critter Catchers Red*, *Pocket Plumber Land*, *Moonlit Quest* |
| **Bintendo Entertainment System** | worn 72-pin-style slot → blinking power light (lockout chip can't read the cart): clean or replace the connector; lockout chip dead; 7805 regulator dead/hot; RF modulator dead (AV fine, RF no picture); power jack; reset switch; controller-port pins | *Pipe Brothers*, *Duck Blaster*, *Mega Bolt Man*, *Castle Climber* |
| **Bintendo 64** | internal PSU module (fuse, caps); missing **jumper/expansion pack** → black screen (the classic "nothing wrong" fix); dirty slot; video DAC; RCP/RDRAM reflow; controller ports | *Pipe Brothers 64*, *Kart Smash 64*, *Golden Agent 64*, *Star Pilot 64* |
| **Vega Exodus** | **wrong-polarity adapter** cause bundle (protection diode, burnt trace, regulator); 7805; recap of the audio section; headphone amp; video encoder chip (no colour/picture); region switch; cart slot | *Blur the Hedgepig*, *Streets of Rumble*, *Mortal Tussle*, *Dragon Road* |
| **Paltari Family Console** | oxidised power/difficulty switch contacts (clean), 7805, RF modulator/channel switch, video chip, joystick-port pins, linear-PSU recap, woodgrain cosmetics | *Asteroid Belt*, *Paddle Duel*, *Pit Runner*, *Space Rescue* |

**Cartridge failure modes** (shared by all cart types, chosen per variant):
- **Dirty / oxidised edge connector:** clean with IPA + eraser / fibreglass pen.
- **Corroded contacts:** corrosion cleaner → scrub → IPA (Phase 1).
- **Dead save battery:** saves lost. Replace it with a **tabbed** coin cell; don't solder the bare cell (it's damaged by heat).
- **Leaked save battery:** corrosion around the battery and the save-RAM chip.
- **Bad save RAM:** saves lost even with a new battery.
- **Blown resistor** (save-RAM power path / series resistor).
- **Bad/bulged cap.**
- **Dead lockout / region chip:** works on one console, not another.
- **Dead mask ROM:** unrepairable; donor ROM from a cart of the same title, or sell as faulty.
- **Cracked board edge / lifted connector finger.**
- **Previous repair:** hot-glued battery, wrong battery, bridged pins.
- **Shell problems:** stripped **security screws**, which need a parody "Game-Bit" security driver (an Equipment purchase); broken clips; label damage (cosmetic, lowers value).

### Cartridge (and controller) test station
**How a cart is proven fixed.** A **Test Station** screen sits next to the bench: a shelf of the player's **working test consoles**, cabled to a TV/CRT.
1. Pick the console for that cart type.
2. Insert the cart (drag it into the slot).
3. Press the **console's own power button**.
4. Wait a few seconds while the console boots.
5. If the **game's title screen** appears, the cart is fixed.

**What the screen can show** (driven by the cart's simulated state):

| Screen | Cause |
|---|---|
| Title screen (per-title art, drawn procedurally) | Fixed |
| Black screen | Dead ROM, open power path, cart not seated |
| Garbled / striped graphics, wrong colours | Dirty or corroded edge connector, a cracked finger, a bad data line |
| Blinking power light, console keeps resetting | Lockout chip can't talk to the cart (dirty contacts or a dead lockout chip) |
| Boots, but **"save file lost"** after a power cycle | Dead or leaked save battery, bad save RAM. There's a save test: save → power off → power on. |

**Test consoles:**
- Bought from the Marketplace as **"tested working"** listings (pricier than broken ones), or a console the player has repaired themselves and moved to the test shelf.
- They are real devices: their slot gets dirty with use, and a test console can develop a fault. A bad test console gives false "broken cart" results, so clean the slot and keep a known-good cart as a reference.
- One test console of a type tests every cart of that type, and that type's controllers (controller test: buttons and sticks on screen).

**Without a test console** the player can still repair the cart, but must **return it untested**:
- The customer tests at home.
- If it still doesn't work, they bring it back. The player **refunds 10 % of the quote**, the job reopens, the player fixes it again, and the customer tests again (same loop; reputation dips a little each time).
- If it works, it's paid in full as normal.
- In the UI: "Return untested (customer will try it at home)" vs "Test on the Test Station first".

**Sim:**
- A `ConsoleHost` external attaches to the cart's edge connector: power pins, address/data contact quality, lockout handshake, ROM-alive, save-RAM battery voltage. Its functional test returns the screen outcome above.
- The same host model drives controller tests.
- Title-screen art is generated per title from a palette + logo text (no copyrighted art).

### Controllers (detailed)
Each console gets its own controller board.

| Controller | Failure modes |
|---|---|
| **DualPulse** (Funstation 5) | stick potentiometer drift (replace one pot), trigger spring, adaptive-trigger motor, worn button membrane, torn touch-pad ribbon, USB-C port, swollen battery, main BGA reflow (no charge), **wireless/BT chip replacement** (QFN), liquid damage (sticky buttons + corrosion) |
| **DualPulse 4** (Funstation 4) | **USB-Mini/Micro port**, charging flex ribbon, battery, conductive film, stick drift, light-bar LED |
| **Sbox controller** | AA battery-contact corrosion, bumper tact switches worn, stick drift, USB-C/Micro port, wireless module swap |
| **Button Grips** | stick drift, rail ribbon (SL/SR + LEDs), rail lock spring, puffy battery, wireless chip |
| **Bintendo 64 pad** | worn analog stick (grinding; replace the stick module), Z-trigger switch, cable break near the plug |
| **BES pad** | dirty carbon contacts on the membrane, cable break (intermittent), shift-register chip |
| **Vega Exodus pad** (3/6-button) | membrane dirt, mode switch, cable |
| **Paltari joystick** | worn leaf switches, fire button, broken cable |

### Wireless and reflow work across the catalog
- **BT chip replacement:** BoomPuck (QFN, hot air + pad prep), DualPulse, Button Grips, the Grapple/Venovo laptops.
- **Wi-Fi chip / module replacement:** Ding (soldered module), Button, Sbox, Funstation, laptops (M.2 card swap, *or* a soldered chip on Grapple).
- **Reflow / reball** variants exist on **every console and laptop motherboard** (Funstation 5/5 Pro, Sbox One X, Button, Grapple, Venovo, MyPhone): cracked BGA joints are intermittent and fixed by reflow; a dead chip needs a replacement + reball (Phase 4).

---

## Request checklist (everything asked for, and where it lives)
| Request | Where |
|---|---|
| Disassembly | Phase 2 |
| Corrosion cleaner (green/yellow/purple/black mottled; same rate as IPA; a bit pricier; scrub + IPA after) | Phase 1a/1b |
| Flux cleaner (better than IPA; removes factory/unknown flux) | Phase 1b |
| Previous-repair solder bridges (visible blobs and microscope-only) | Phase 1d |
| Microscope upgrades (higher magnification for small parts) | Phase 1c |
| Funstation, Sbox One X, Button motherboards | Wave B/C |
| Grapple laptop, Venovo laptop | Wave C |
| Ding security system boards | Wave B |
| Retro cartridges (connector cleaning, blown resistors, bad caps, corrosion, …) | Wave D + "Retro consoles + cartridges" above |
| Broken controllers for each console (liquid, joysticks, worn buttons, USB-C/Mini ports, battery, wireless chip) | Wave A + "Controllers" above |
| BT chip replacement on the BT speaker | Wave A + "Wireless and reflow work" |
| Wi-Fi chip replacement; reflow on all console/laptop boards | "Wireless and reflow work" |
| MyPhone 16 / 17 / 18 / 19 | Wave C |
| Dream Boy, Bintendo Entertainment System, Bintendo 64, Vega Exodus, Paltari Family Console + several cartridges each | Wave D + "Retro consoles + cartridges" |
| DualPulse, Button Lite, Funstation 5 power/standby, Retrobit RB35, SoundHalo PSU | Waves A/B |
| Dream Boy Color corrosion, DuoScreen i XL, VoltMax, Funstation 5 Pro, Galaxy Raid | Waves B/C/D |
| Bigger, more complex boards with real mains → DC supplies | Phases 0 + 5 |
| Quick-win faults, cause bundles, intermittent faults, new tools | Phase 3 |
| BGA reballing: tweezers + balls first, then stencil + paste in a vise; per-chip stencils that cost money and warp | Phase 4 |
| Cart testing: Test Station with bought test consoles, insert cart → power button → title screen; otherwise customer tests at home, 10 % refund + refix on failure | "Cartridge (and controller) test station" |
| Router joining power and ground at connectors | **Fixed** (router spacing + pour clearance drawn after ground spokes) |

---

## Phase 7 — Business glue for all of the above
- **Equipment tiers:** microscope objectives/ring light/tilt, preheater, reballing vise, stencils, freeze spray, LCR, USB-C PD meter, serial console, programmer, dim-bulb tester, isolation transformer.
- **Parts:**
  - BGA chips and stencils are special order.
  - Some parts only ship from abroad (5–14 days).
  - Short-shipped or wrong-size orders happen as rare events.
- **Listings and disputes:** inspect on arrival (sticker, screws, liquid) → open a dispute → partial refund negotiation.
- **Selling:** platform fee (~9%), postage time, profit-per-hour readout, boxed-set bonus, warranty comebacks with "customer opened it" edge cases.

---

## Suggested order and milestones
1. **Phase 0** (engine headroom) + migrate existing devices to blocks.
2. **Phase 1** (chemistry, microscope, bridges): immediate improvement to all current boards.
3. **Wave A** boards + **Phase 3a/3b** (quick-win faults and bundles).
4. **Phase 2** (disassembly) for all boards so far.
5. **Phase 5** (mains) + **Wave B**.
6. **Phase 3c/3d** (intermittents + instruments).
7. **Phase 4** (BGA/reball) + **Wave C**.
8. **Wave D** + Phase 7 polish throughout.

Each step ends with:
- all tests green (devices / faults / geometry / business);
- a browser play-through;
- `CLAUDE.md` and `ROADMAP.md` updated;
- a commit.

## Risks and mitigations
- **Content volume:**
  - About 30 boards × 10–20 variants. Blocks with built-in variants carry most of the load.
  - Device files stay data-heavy; shared behaviour lives in blocks.
- **Performance:** Phase 0 is a hard gate. The fault suite gets a time budget so regressions are caught.
- **Approachability:** every new mechanic has a guided-mode assist:
  - auto-open for teardown;
  - suggested magnification;
  - reball "auto-place" at low tiers;
  - nudges that point to the right instrument.
- **Branding:**
  - Every new device, game and chip name is a parody or fictional.
  - The fictional part-number scheme is extended (e.g. `U-CX32xx`, `U-PMIC-…`).
  - A grep check for real brand names runs in CI.
