# Bench Tech — TO-CREATE List: Disc Consoles, Bintendo Pyramid, and Unique Controllers

**STATUS: IMPLEMENTATION HANDOFF FOR CLAUDE — CREATE NEW ASSETS; NOT A LIST OF EXISTING GAME TITLES**

This is a **to-create checklist** for hardware and repairable electronics to add to Bench Tech. It is intentionally not a reprint of the complete current console library. A system appearing as a controller-only task means **create a controller for the already-listed system; do not duplicate the console**.

## Scope and counts

- **15 console/handheld build entries**: DiscJockie 1, 2, 3, Pocket; Funstation 1–4; Sbox 1, 2, 720, 10, S, One X; and **Bintendo Pyramid**.
- **14 living-room systems within the console build entries**, plus **one handheld (DiscJockie Pocket)**.
- **21 unique stand-alone controller designs to create**: 14 for newly specified home consoles, plus seven controller-only tasks for previously listed home systems (BES, B64, Vega Exodus, Paltari, Funstation 5, Game Orb, Swamarami).
- **41 console repairable PCBs/sub-boards** described (38 from the fourteen previous entries + 3 for Bintendo Pyramid); **21 individual controller PCBs** additional, for **62 PCB assets** in this handoff.
- **No new games are requested in this phase.** Preserve all existing game titles, platforms, values, and media ownership.

## Non-negotiable implementation rules

1. **This is the creation queue**. Make the 15 console/handheld assets and the 21 controller assets. Do not mark an item as already created merely because a console name or a game for it exists in the catalog. Reuse or extend actual existing models where found; do not create conflicting duplicates.
2. **Bintendo Pyramid is NEW AND MUST BE CREATED**. It uses proprietary **Bintendo Mini-Disc**, not the DJ Pocket mini disc or Bintentendo Game Orb optical disc. It requires its own unique console case, drive, PCBs, repair jobs, and controller.
3. **One unique controller per non-handheld console**. No shared shell meshes, duplicated PCB outlines, or recolored-only controller copies across models. Controller silhouette, PCB outline, footprints, connector positioning, button layout, and internal routing must differ recognizably. Different cosmetic variants *of the same controller* may share the exact same electronics.
4. **Case color variants are available for EVERY controller**. Colors are cosmetic SKUs, not new devices, PCB models, fault lists, or new compatibility types. Materials, decals and colors may vary, but interior electronics, screw layout and input coordinates remain compatible with that controller model.
5. **Six size classes only**: XS / S / M / L / XL / XXL. Never require real-world board dimensions. Density classes: Sparse / Medium / High / Very high / Extreme.
6. **Fault inheritance**: Every console board and every controller PCB must include the literal text `Existing Faults from Fault Catalog`. Add the entry-specific faults below on top of the existing catalog; do not replace or rewrite the catalog.
7. Make diagnosis grounded in simulated circuitry: power rails, oscilloscope measurements, continuity, data paths, controller input detection, audio/video output, mechanical disc operation and realistic cause/effect. Avoid random faults disconnected from circuit behavior.
8. Keep separate native media IDs, case asset IDs, disc/cartridge mesh IDs, PCB IDs, controller IDs and save data. Media incompatibility is not automatically an electronics fault.
9. No invented hardware certification requirements for consumer consoles. Disc drives can include aligned calibration or firmware pairing where the fictional design specifically calls for it.

## A. Consoles and handheld — TO CREATE

| Done | ID | Create asset | Media | Stand-alone controller task |
|---|---|---|---|---|
| - [ ] | `DJ-01` | **DiscJockie 1** | DJ1 Game Disc | Yes — unique controller below |
| - [ ] | `DJ-02` | **DiscJockie 2** | DJ2 Game Disc | Yes — unique controller below |
| - [ ] | `DJ-03` | **DiscJockie 3** | DJ3 Game Disc | Yes — unique controller below |
| - [ ] | `DJ-P` | **DiscJockie Pocket** | DJ Pocket Mini Game Disc | No: integrated handheld controls |
| - [ ] | `FS-01` | **Funstation 1** | FS1 Game Disc | Yes — unique controller below |
| - [ ] | `FS-02` | **Funstation 2** | FS2 Game Disc | Yes — unique controller below |
| - [ ] | `FS-03` | **Funstation 3** | FS3 Game Disc | Yes — unique controller below |
| - [ ] | `FS-04` | **Funstation 4** | FS4 Game Disc | Yes — unique controller below |
| - [ ] | `SB-01` | **Sbox 1** | SB1 Game Disc | Yes — unique controller below |
| - [ ] | `SB-02` | **Sbox 2** | SB2 Game Disc | Yes — unique controller below |
| - [ ] | `SB-720` | **Sbox 720** | SB720 Game Disc | Yes — unique controller below |
| - [ ] | `SB-10` | **Sbox 10** | SB10 Game Disc | Yes — unique controller below |
| - [ ] | `SB-S` | **Sbox S** | SBS Game Disc | Yes — unique controller below |
| - [ ] | `SB-1X` | **Sbox One X** | SB1X Game Disc | Yes — unique controller below |
| - [ ] | `BPY-01` | **Bintendo Pyramid** | Bintendo Mini-Disc | Yes — unique controller below |

### A1. Individual console specifications

#### - [ ] DJ-01 — DiscJockie 1

- **Hardware type:** Home console.
- **Case / physical identity:** Wide, low-profile rectangular shell with a slightly raised central disc lid and front-mounted wired-controller sockets.
- **Native game media:** DJ1 Game Disc — full-size CD-style optical disc.
- **Compatibility rule:** Native DJ1 discs only unless a specific backward-compatibility rule is added later.
- **PCB build count:** 2 repairable PCB assets:
  - **Main logic PCB** — Size **L**; shape **Wide rectangle with two clipped rear corners**; component density **Medium**. **Component placement and layout:** Central CPU and separate GPU, RAM banks to the right, BIOS ROM near the rear edge, audio DAC and AV encoder grouped at rear connectors, low-voltage regulation along one side; controller ports on front edge. **Fault inheritance:** `Existing Faults from Fault Catalog`.
  - **Optical servo PCB** — Size **S**; shape **Long narrow rectangle with offset ribbon-cable tab**; component density **Sparse**. **Component placement and layout:** CD pickup preamp and control IC, spindle and sled motor drivers, limit-switch header, laser and mechanism flex connectors. **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional mechanical / electronic faults:** Worn tray/lid interlock, weak laser emission, sled-gear binding, spindle motor stall, aged capacitors near AV and voltage rails, cracked front controller-port solder joints, damaged optical flex.
- **Final test / repair acceptance:** Boot splash, both controller ports, audio/video output, cold and warm disc reads, seek-speed test, 30-minute loaded play test.

#### - [ ] DJ-02 — DiscJockie 2

- **Hardware type:** Home console.
- **Case / physical identity:** Tall tapered rectangular case with a front-loading disc tray, horizontal LED strip and separate front accessory bay.
- **Native game media:** DJ2 Game Disc — full-size DVD-style optical disc.
- **Compatibility rule:** Native DJ2 discs; no assumed DJ1 compatibility.
- **PCB build count:** 3 repairable PCB assets:
  - **Main logic PCB** — Size **L**; shape **Wide rectangle with notch for drive chassis**; component density **High**. **Component placement and layout:** CPU/GPU, RAM clusters, DVD interface, flash firmware, audio/video encoders, USB and network transceivers, densely packed regulators and wide front-panel connector. **Fault inheritance:** `Existing Faults from Fault Catalog`.
  - **Optical drive PCB** — Size **S**; shape **Elongated irregular strip**; component density **Medium**. **Component placement and layout:** DVD laser driver, tray and spindle motor drivers, optical sled feedback, tray-position switch inputs and flex connectors. **Fault inheritance:** `Existing Faults from Fault Catalog`.
  - **Power PCB** — Size **M**; shape **Long rectangular board with mains isolation gap**; component density **Sparse**. **Component placement and layout:** Primary switching supply, transformer, rectifier, feedback optocoupler, output filtering and standby rail. **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional mechanical / electronic faults:** Bad DVD reads, tray belt fatigue, spindle-start failures, power-supply capacitor degradation, optical ribbon tears, failed standby rails, cracked AV and USB connectors.
- **Final test / repair acceptance:** Low-voltage pre-check, standby/startup rails, tray cycling, controller enumeration, sustained DVD read, restart after heat soak.

#### - [ ] DJ-03 — DiscJockie 3

- **Hardware type:** Home console.
- **Case / physical identity:** Low black wedge enclosure with a recessed slot-loading optical drive and aggressive side cooling vents.
- **Native game media:** DJ3 Game Disc — high-density Blu-ray-style optical disc.
- **Compatibility rule:** Native DJ3 discs only unless separately implemented.
- **PCB build count:** 3 repairable PCB assets:
  - **Performance mainboard** — Size **XL**; shape **Asymmetrical rectangle with broad fan-side chamfer**; component density **Very high**. **Component placement and layout:** High-performance SoC, surrounding high-speed memory, flash, HDMI, Ethernet, USB, multi-phase VRMs concentrated beside SoC and extensive labeled test pads. **Fault inheritance:** `Existing Faults from Fault Catalog`.
  - **Optical drive PCB** — Size **S**; shape **L-shaped strip with curved inside corner**; component density **Medium**. **Component placement and layout:** High-density disc servo and laser interface, disc-authentication controller, spindle/eject drivers, position sensing. **Fault inheritance:** `Existing Faults from Fault Catalog`.
  - **Power PCB** — Size **M**; shape **Stepped rectangle with separated mains area**; component density **Medium**. **Component placement and layout:** High-current switch-mode conversion, standby supply, current sensing and protected output harnesses. **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional mechanical / electronic faults:** Processor power rail shorts, MOSFET/driver faults, HDMI protection/retimer faults, high-temperature memory faults, optical drive pairing/authentication errors, eject sensor failure.
- **Final test / repair acceptance:** Current-limited power up, power-sequencing scope captures, HDMI/audio/network checks, verified drive pairing, multiple game-disc read and thermal validation.

#### - [ ] DJ-P — DiscJockie Pocket

- **Hardware type:** Handheld console.
- **Case / physical identity:** Wide portable console with integrated left and right control clusters, central display and rear snap-shut miniature-disc compartment.
- **Native game media:** DJ Pocket Mini Game Disc — proprietary mini optical disc.
- **Compatibility rule:** Not compatible with full-size DiscJockie discs or Bintendo Mini-Disc.
- **PCB build count:** 2 repairable PCB assets:
  - **Integrated handheld mainboard** — Size **M**; shape **Wide rounded hourglass-shaped board**; component density **High**. **Component placement and layout:** Compact gaming SoC, RAM, flash, LCD flex, audio amplifier, headphone socket, integrated controls, charging IC, battery protection and low-profile DC-DC converters. **Fault inheritance:** `Existing Faults from Fault Catalog`.
  - **Mini-disc servo PCB** — Size **XS**; shape **Short crescent with narrow pickup-tail extension**; component density **Medium**. **Component placement and layout:** Miniature pickup interface, spindle and sled drivers, lid-closed switch, short fine-pitch ribbon and laser control. **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional mechanical / electronic faults:** Miniature disc-door latch damage, pickup misalignment, spindle wear, weak battery or charge input, display flex tearing, button membrane failure, moisture damage.
- **Final test / repair acceptance:** Integrated controls, display/backlight, speakers, charging/discharge, lid interlock, continuous mini-disc playback and sleep/wake; no separate controller asset.

#### - [ ] FS-01 — Funstation 1

- **Hardware type:** Home console.
- **Case / physical identity:** Flat light-gray slab with a circular flip-top CD lid and two front memory/controller bays.
- **Native game media:** FS1 Game Disc — full-size CD-style optical disc.
- **Compatibility rule:** Native FS1 discs.
- **PCB build count:** 2 repairable PCB assets:
  - **Main logic PCB** — Size **L**; shape **Rectangle with two circular screw-clearance bites**; component density **Medium**. **Component placement and layout:** CPU, GPU, RAM, audio DAC, BIOS ROM, AV output, power regulators and two controller/memory interfaces. **Fault inheritance:** `Existing Faults from Fault Catalog`.
  - **CD drive PCB** — Size **S**; shape **Plain rectangle with slim rear flex tongue**; component density **Sparse**. **Component placement and layout:** Optical pickup signal conditioning, sled and spindle drivers, lid microswitch and ribbon interface. **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional mechanical / electronic faults:** Lid switch intermittency, aged pickup, failed spindle driver, damaged memory-card pins, cracked AV connector, regulator drift.
- **Final test / repair acceptance:** Display output, controller and card detection, audio, repeat disc load/seek, pickup seek calibration where appropriate.

#### - [ ] FS-02 — Funstation 2

- **Hardware type:** Home console.
- **Case / physical identity:** Tall rectangular tower usable vertically or horizontally, front DVD tray, distinctive stepped front grille.
- **Native game media:** FS2 Game Disc — DVD-style optical disc.
- **Compatibility rule:** Native FS2 discs; backward-compatibility must be explicitly modeled if desired.
- **PCB build count:** 3 repairable PCB assets:
  - **Main logic PCB** — Size **L**; shape **Long stepped rectangle with front-bay cutout**; component density **High**. **Component placement and layout:** CPU, video chip, RAM, BIOS, DVD I/O, USB, memory interfaces, rear AV circuitry and regulator zones. **Fault inheritance:** `Existing Faults from Fault Catalog`.
  - **DVD mechanism PCB** — Size **S**; shape **Narrow strip with forked end**; component density **Medium**. **Component placement and layout:** DVD laser control, tray motor and spindle drivers, sled feedback and flex connectors. **Fault inheritance:** `Existing Faults from Fault Catalog`.
  - **Power PCB** — Size **M**; shape **Slim rectangle with isolated AC side**; component density **Sparse**. **Component placement and layout:** Transformer, switch controller, output rectification, electrolytic banks and standby regulator. **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional mechanical / electronic faults:** Tray gear/sliding rail damage, lens contamination, optical ribbon fracture, USB controller failure, unstable supply rails, worn fan connector.
- **Final test / repair acceptance:** Tray cycle, disc seek, controller and accessory tests, both orientations, thermal stability.

#### - [ ] FS-03 — Funstation 3

- **Hardware type:** Home console.
- **Case / physical identity:** Bulged polished shell with a front optical slot, heavy internal metal shielding and large rear exhaust.
- **Native game media:** FS3 Game Disc — Blu-ray-style optical disc.
- **Compatibility rule:** Native FS3 discs.
- **PCB build count:** 3 repairable PCB assets:
  - **Main performance PCB** — Size **XL**; shape **Large polygon with curved front relief**; component density **Very high**. **Component placement and layout:** CPU and graphics subsystem, RAM, NAND, HDMI/video I/O, Ethernet and USB sections, multi-rail regulator banks and densely distributed test points. **Fault inheritance:** `Existing Faults from Fault Catalog`.
  - **Blu-ray mechanism PCB** — Size **S**; shape **Thin irregular boomerang**; component density **Medium**. **Component placement and layout:** Laser controller, position sensing, slot load/eject motors, drive interface and optical flex. **Fault inheritance:** `Existing Faults from Fault Catalog`.
  - **Power PCB** — Size **M**; shape **Trapezoid with isolated mains corner**; component density **Medium**. **Component placement and layout:** High-output supply, standby, power monitoring, filtering and harness connectors. **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional mechanical / electronic faults:** GPU/processor power failures, overheated regulators, HDMI port and ESD faults, degraded optical pickup, feed-roller wear, corrupted firmware.
- **Final test / repair acceptance:** Power sequence, video mode changes, wired/wireless controller, disc verification, 30-minute rendering workload and thermal readings.

#### - [ ] FS-04 — Funstation 4

- **Hardware type:** Home console.
- **Case / physical identity:** Two-tier slanted case with sharp diagonal side seam and narrow front optical slot.
- **Native game media:** FS4 Game Disc — high-capacity Blu-ray-style optical disc.
- **Compatibility rule:** Native FS4 discs.
- **PCB build count:** 3 repairable PCB assets:
  - **Main logic PCB** — Size **XL**; shape **Broad rectangle with triangular edge recess**; component density **Very high**. **Component placement and layout:** Gaming SoC, GDDR ring, SSD interface, HDMI, USB, wireless module, fan control, multi-phase CPU/GPU VRMs and diagnostic pads. **Fault inheritance:** `Existing Faults from Fault Catalog`.
  - **Drive interface PCB** — Size **S**; shape **Narrow asymmetric T**; component density **Medium**. **Component placement and layout:** High-density disc pickup, controller and authentication interface, eject detection, motor drivers. **Fault inheritance:** `Existing Faults from Fault Catalog`.
  - **Power PCB** — Size **M**; shape **Elongated chamfered rectangle**; component density **Medium**. **Component placement and layout:** Switch-mode rails, sense resistors, power protection and thermal monitoring. **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional mechanical / electronic faults:** Shorted VRM MOSFETs, broken HDMI connector, USB ESD IC shorts, SSD connector damage, fan tach faults, disc feed-roller slip, drive-pairing mismatch.
- **Final test / repair acceptance:** HDMI/USB/network, multiple load tests, native disc validation, fan control, cold/heat soak restart.

#### - [ ] SB-01 — Sbox 1

- **Hardware type:** Home console.
- **Case / physical identity:** Bulky cross-ribbed dark shell with top-side emblem and a large front DVD tray.
- **Native game media:** SB1 Game Disc — DVD-style optical disc.
- **Compatibility rule:** Native SB1 discs.
- **PCB build count:** 3 repairable PCB assets:
  - **Main system PCB** — Size **L**; shape **Near-square with cruciform mounting cutouts**; component density **Medium**. **Component placement and layout:** CPU, GPU, memory, firmware flash, storage I/O, Ethernet, DVD interface, controller connectors and regulator stages. **Fault inheritance:** `Existing Faults from Fault Catalog`.
  - **DVD PCB** — Size **S**; shape **Tall thin rectangle with inset screw slots**; component density **Sparse**. **Component placement and layout:** DVD pickup/servo controller, spindle and tray drivers, tray status sensing. **Fault inheritance:** `Existing Faults from Fault Catalog`.
  - **Power PCB** — Size **M**; shape **Simple long rectangle**; component density **Sparse**. **Component placement and layout:** AC-DC supply, standby circuit, output harness and high-voltage isolation. **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional mechanical / electronic faults:** Clock capacitor leakage, front socket damage, hard-drive interface faults, tray belt failure, aged power capacitors, disc read failures.
- **Final test / repair acceptance:** Clock and save retention, controller enumeration, storage boot, optical read, audio/video and supply ripple.

#### - [ ] SB-02 — Sbox 2

- **Hardware type:** Home console.
- **Case / physical identity:** Large rounded-square shell with front-recessed optical tray and angled circular power emblem.
- **Native game media:** SB2 Game Disc — DVD-style optical disc.
- **Compatibility rule:** Native SB2 discs only by default.
- **PCB build count:** 3 repairable PCB assets:
  - **Main system PCB** — Size **L**; shape **Rectangular with offset front tab**; component density **High**. **Component placement and layout:** CPU/GPU section, RAM banks, HDMI and legacy video, firmware flash, USB/network ICs, storage connector and stepped regulators. **Fault inheritance:** `Existing Faults from Fault Catalog`.
  - **DVD PCB** — Size **S**; shape **Long slim board with staggered edges**; component density **Medium**. **Component placement and layout:** Optical-drive controller, laser amplifier, tray and spindle driver, limit sensors. **Fault inheritance:** `Existing Faults from Fault Catalog`.
  - **Power PCB** — Size **M**; shape **Long rectangle with keyed connector notch**; component density **Sparse**. **Component placement and layout:** Primary switch-mode circuit, standby converter, filter capacitors and rail monitoring. **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional mechanical / electronic faults:** Video-output failure, weak standby power, optical pickup degradation, bad storage detection, damaged USB connectors, cooling faults.
- **Final test / repair acceptance:** Storage, boot, optical drive, video/audio, controller sync, rail measurements and fan telemetry.

#### - [ ] SB-720 — Sbox 720

- **Hardware type:** Home console.
- **Case / physical identity:** Tall curved white shell with removable side panels and a front DVD tray; optional red warning LED ring.
- **Native game media:** SB720 Game Disc — DVD-style optical disc.
- **Compatibility rule:** Native SB720 discs.
- **PCB build count:** 3 repairable PCB assets:
  - **Main high-performance PCB** — Size **XL**; shape **Wide rectangular board with three stepped mounting shoulders**; component density **High**. **Component placement and layout:** Graphics and CPU assemblies, distributed memory ICs, NAND, HDMI/Ethernet, thermal monitoring, fan headers and heavy multi-phase regulation. **Fault inheritance:** `Existing Faults from Fault Catalog`.
  - **DVD servo PCB** — Size **S**; shape **Offset C-shaped strip**; component density **Medium**. **Component placement and layout:** DVD spindle/laser control, tray switch network, disc motor drivers and connectors. **Fault inheritance:** `Existing Faults from Fault Catalog`.
  - **Power PCB** — Size **M**; shape **Square-ended rectangular board**; component density **Medium**. **Component placement and layout:** High-current output stages, converter control and monitoring. **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional mechanical / electronic faults:** Thermal faults and intermittent processor connections, failed VRM phase, optical tray jams, GPU power instability, console-overheat faults, HDMI solder cracking.
- **Final test / repair acceptance:** GPU stress, temperature-controlled fan run, repeated startup, disc test and steady supply ripple analysis.

#### - [ ] SB-10 — Sbox 10

- **Hardware type:** Home console.
- **Case / physical identity:** Flat black rectangular case with offset ventilation and a concealed front slot drive.
- **Native game media:** SB10 Game Disc — Blu-ray-style optical disc.
- **Compatibility rule:** Native SB10 discs.
- **PCB build count:** 3 repairable PCB assets:
  - **Integrated system PCB** — Size **XL**; shape **Wide rectangle with two large circular heatsink clearances**; component density **Very high**. **Component placement and layout:** APU, surrounding memory, SSD interface, HDMI, USB/network, embedded security control, VRMs and test-pad grid. **Fault inheritance:** `Existing Faults from Fault Catalog`.
  - **Blu-ray PCB** — Size **S**; shape **L-shaped board with shallow hook**; component density **Medium**. **Component placement and layout:** Blu-ray servo IC, laser and spindle connections, disc sensors and eject control. **Fault inheritance:** `Existing Faults from Fault Catalog`.
  - **Power PCB** — Size **M**; shape **Rectangular with high-voltage/low-voltage partition**; component density **Medium**. **Component placement and layout:** Regulated main supply, standby output, input filter and protection. **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional mechanical / electronic faults:** Power-stage shorts, HDMI IC failures, storage port faults, laser degradation, defective optical-load sensors, wireless module and fan power faults.
- **Final test / repair acceptance:** Boot, storage, native disc, controller connection, network, HDMI and sustained load.

#### - [ ] SB-S — Sbox S

- **Hardware type:** Home console.
- **Case / physical identity:** Compact narrow white case with a vertical perforated black cooling circle and a slim side optical slot.
- **Native game media:** SBS Game Disc — Blu-ray-style optical disc.
- **Compatibility rule:** Native SBS discs.
- **PCB build count:** 2 repairable PCB assets:
  - **Compact mainboard** — Size **L**; shape **Slim dogleg rectangle**; component density **High**. **Component placement and layout:** Compact APU, RAM clusters, storage controller, HDMI/USB, wireless, tightly packed DC-DC stages and fan header. **Fault inheritance:** `Existing Faults from Fault Catalog`.
  - **Low-profile drive PCB** — Size **S**; shape **Thin elongated rectangle with side hook**; component density **Medium**. **Component placement and layout:** Slim optical-drive controller, miniature motors, lid/load sensors and tiny flex connectors. **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional mechanical / electronic faults:** Thermal pad/dust overheating, failed compact buck converters, flex connector fractures, disc feed problems, shorts at rear USB-C/USB ports, fan driver failure.
- **Final test / repair acceptance:** Airflow/fan tach, thermal soak, native optical disc, storage, HDMI and controller connection.

#### - [ ] SB-1X — Sbox One X

- **Hardware type:** Home console.
- **Case / physical identity:** Dense premium low-profile box with textured vent channels, wide rear connectors and flush slot-loader.
- **Native game media:** SB1X Game Disc — ultra-high-capacity optical disc.
- **Compatibility rule:** Native SB1X discs; preserve existing named-game records.
- **PCB build count:** 3 repairable PCB assets:
  - **Premium mainboard** — Size **XXL**; shape **Large wide rectangle with rear I/O peninsula**; component density **Extreme**. **Component placement and layout:** High-performance SoC, GDDR packages, high-current VRM banks, advanced storage, video retimer, Ethernet/USB/wireless sections and numerous test points. **Fault inheritance:** `Existing Faults from Fault Catalog`.
  - **High-capacity disc PCB** — Size **S**; shape **Irregular narrow board with flared middle**; component density **Medium**. **Component placement and layout:** High-density laser controller, disc-authentication link, motor drivers, optical pickup and load sensors. **Fault inheritance:** `Existing Faults from Fault Catalog`.
  - **High-power supply PCB** — Size **L**; shape **Rectangular with large isolated section**; component density **Medium**. **Component placement and layout:** Power-factor correction, AC-DC conversion, current sense, filtering and monitoring. **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional mechanical / electronic faults:** Multiple VRM faults, HDMI retimer failure, high-speed storage rail defects, overheated RAM, optical drive authentication faults, fan control and power input failure.
- **Final test / repair acceptance:** Voltage rails, full boot, controller synchronization, disc verification, intensive rendering stress, thermal limits and energy draw.
- **Preserve existing games:** Ironclad Frontier, Apex Drift X, Zombie Harvest 3, Starfarer Legacy, Blitz Arena 2026. The existence of these game records does NOT complete the console/controller creation tasks.

#### - [ ] BPY-01 — Bintendo Pyramid

- **Hardware type:** Home console.
- **Case / physical identity:** Distinctive low four-sided pyramid case with central raised top section, front mini-disc slot and controller ports recessed beneath the front slope.
- **Native game media:** Bintendo Mini-Disc — proprietary miniature optical game disc.
- **Compatibility rule:** Native Bintendo Mini-Disc only; must NOT be treated as DJ Pocket Mini Game Disc or Game Orb disc.
- **PCB build count:** 3 repairable PCB assets:
  - **Pyramid mainboard** — Size **L**; shape **Wide triangular board with clipped corners and three mounting wings**; component density **High**. **Component placement and layout:** Gaming CPU/GPU, RAM banks fanning away from center, firmware memory at rear point, controller I/O on front edge, audio/video circuits on rear wing, regulators in a corner cluster. **Fault inheritance:** `Existing Faults from Fault Catalog`.
  - **Mini-disc mechanism PCB** — Size **S**; shape **Kite-shaped polygon with one long connector tongue**; component density **Medium**. **Component placement and layout:** Mini optical pickup control, spindle/sled motor driver, disc-presence sensors, laser interface and shielded ribbon connector. **Fault inheritance:** `Existing Faults from Fault Catalog`.
  - **Power and front I/O PCB** — Size **S**; shape **Wide shallow chevron**; component density **Sparse**. **Component placement and layout:** Low-voltage regulation, input protection, power button, indicator LEDs, controller-port support and auxiliary wiring. **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional mechanical / electronic faults:** Mini-disc optical pickup degradation, scratched game media, spindle wobble, drive lid/slot switch failure, fragile drive flex, overheating under pyramid shell, cracked front controller connector, failed power sequencing.
- **Final test / repair acceptance:** Power rails and thermals, both controller ports, AV output, repeated mini-disc boot/seek/load, extended gameplay and warm restart.
- **Mandatory creation note:** This is **not** an existing console and must appear as a to-create item even if the media-family registry already contains Bintendo products. Create a dedicated `BINTENDO_MINI_DISC` media ID and its own miniature disc mesh, case and drive interface. Controller `BPY-CTRL` must be created.

## B. Controller assets — ALL ARE TO CREATE

**Required:** One controller belonging exclusively to each of the **21 non-handheld systems** listed below. Each has a different shell shape **AND a different actual PCB outline**. Make independent Blender/mesh and electrical-repair assets, input mapping, connector or pairing behavior, interactive buttons/joysticks, board diagnostics and controller-specific repair jobs.

**Universal controller asset rule:** Offer color-variant shells for each individual controller. Colors change outer shell materials and inventory SKU only; no electronics change. Every controller includes `Existing Faults from Fault Catalog`, plus the model-specific faults listed here.

### B1. Controller creation checklist

| Done | Controller ID | Console it serves | Shell silhouette | Unique PCB outline |
|---|---|---|---|---|
| - [ ] | `BES-CTRL` | Bintendo Entertainment System | Flat squared-off baton shell with hard rectangular edges | Slim rectangle with four pointed mounting tabs |
| - [ ] | `B64-CTRL` | Bintendo 64 | Three-pronged trident grip with large central analog-stick pod | Three-limbed Y with central circular motor/joystick seat |
| - [ ] | `VEGA-CTRL` | Vega Exodus | Broad boomerang pad with short inward-curved horns | Shallow V with stepped wings |
| - [ ] | `PAL-CTRL` | Paltari Family Console | Long narrow paddle slab with raised circular rotary-control wells | Long rounded bar with two separate circular pot extensions |
| - [ ] | `ORB-CTRL` | Bintentendo Game Orb | Round center pad enclosed by two shallow crescent grip fins | Annular ring with left and right crescent wings |
| - [ ] | `SWAM-CTRL` | Swamarami All-In-One | Asymmetric chunky rectangular brick with one oversized side handhold | Offset inverted T with squared right-hand lobe |
| - [ ] | `DJ1-CTRL` | DiscJockie 1 | Low oval shield with tall shoulder humps and short stubs for grips | Flattened oval with two distinct top humps |
| - [ ] | `DJ2-CTRL` | DiscJockie 2 | Split hexagon shell with sharp angled palm wedges | Segmented six-sided board with opposing diagonal grip tabs |
| - [ ] | `DJ3-CTRL` | DiscJockie 3 | Thin crescent shell with extended low hook grips | Asymmetric crescent with two long downward spurs |
| - [ ] | `FS1-CTRL` | Funstation 1 | Classic narrow twin-wing pad with small bulbous handgrips | Butterfly polygon with mirrored lobes and a rectangular top center |
| - [ ] | `FS2-CTRL` | Funstation 2 | Tall dual-grip pad with extended center notch and scalloped top | Inverted U with a narrow middle bridge and squared shoulder ears |
| - [ ] | `FS3-CTRL` | Funstation 3 | Broad shallow octagonal body with sweeping lower grip flares | Asymmetric octagon with one stepped lower-right wing |
| - [ ] | `FS4-CTRL` | Funstation 4 | Flat angular wing body with a large central touch surface | Long angular scythe outline with a rectangular center cutout |
| - [ ] | `FS5-CTRL` | Funstation 5 | Wide futuristic twin-wing pad with prominent central touch bridge | Double-lobed shield with three scallops along its lower edge |
| - [ ] | `SB1-CTRL` | Sbox 1 | Large thick X-inspired shell with bulky offset palm grips | Four-lobed cross with oversize upper-left extension |
| - [ ] | `SB2-CTRL` | Sbox 2 | Trapezoid body with diagonal upper shoulders and compact lower grips | Slanted trapezoid with a separate tapered right wing |
| - [ ] | `SB720-CTRL` | Sbox 720 | Wide M-shaped controller with outward-swept handles and central illuminated ring | Broad M outline with shallow square center throat |
| - [ ] | `SB10-CTRL` | Sbox 10 | Structured hourglass shell with a thick central spine and textured diagonal grips | Stepped hourglass with squared bottom tips |
| - [ ] | `SBS-CTRL` | Sbox S | Slim capsule-like body with hooked index-finger rests | Narrow capsule with hooked upper-left and lower-right tabs |
| - [ ] | `SB1X-CTRL` | Sbox One X | Premium broad shield pad with tapering underside tail and deep grips | Shield pentagon with narrow lower tail and offset rear tabs |
| - [ ] | `BPY-CTRL` | Bintendo Pyramid | Triangular three-corner pad with sloped face and undercut palm wings | Rounded triangle with a central triangular void and three projecting tabs |

### B2. Detailed controller specifications

#### - [ ] BES-CTRL — Bintendo Entertainment System controller

- **Unique external case shape:** Flat squared-off baton shell with hard rectangular edges.
- **Unique controller PCB:** Size **S**; shape **Slim rectangle with four pointed mounting tabs**; component density **Sparse**.
- **Component placement and electrical design:** D-pad conductive pads left, A/B domes right, Start/Select center, small shift-register IC and front strain relief.
- **Console connection:** Wired proprietary cable. Must be compatible with **Bintendo Entertainment System** using a system-specific supported input protocol.
- **Additional controller faults:** D-pad carbon wear, snapped cable at strain relief, damaged shift register.
- **Case color variants available:** Classic gray; charcoal; cream; other cosmetic shell colors can be added without making a new PCB.
- **Repair and validation:** `Existing Faults from Fault Catalog`. Test the complete button/axis/trigger matrix, continuity, supply or battery behavior, connection handshake and any haptics, motion or audio present. Controller faults must appear as measurable electrical/mechanical symptoms.

#### - [ ] B64-CTRL — Bintendo 64 controller

- **Unique external case shape:** Three-pronged trident grip with large central analog-stick pod.
- **Unique controller PCB:** Size **M**; shape **Three-limbed Y with central circular motor/joystick seat**; component density **Medium**.
- **Component placement and electrical design:** Analog joystick encoder center, D-pad left, face/C-button array right, trigger contacts on lower branches, controller MCU and rear accessory socket.
- **Console connection:** Wired proprietary cable. Must be compatible with **Bintendo 64** using a system-specific supported input protocol.
- **Additional controller faults:** Worn analog encoder, center-stick spring and gears, loose accessory connector.
- **Case color variants available:** Stone gray; translucent smoke; glacier blue; other cosmetic shell colors can be added without making a new PCB.
- **Repair and validation:** `Existing Faults from Fault Catalog`. Test the complete button/axis/trigger matrix, continuity, supply or battery behavior, connection handshake and any haptics, motion or audio present. Controller faults must appear as measurable electrical/mechanical symptoms.

#### - [ ] VEGA-CTRL — Vega Exodus controller

- **Unique external case shape:** Broad boomerang pad with short inward-curved horns.
- **Unique controller PCB:** Size **S**; shape **Shallow V with stepped wings**; component density **Sparse**.
- **Component placement and electrical design:** Directional membrane left, six face-button pads right, Start center, serial controller IC and rear cable anchor.
- **Console connection:** Wired proprietary cable. Must be compatible with **Vega Exodus** using a system-specific supported input protocol.
- **Additional controller faults:** Sticky button contacts, fractured cable, damaged traces at sharp wing bend.
- **Case color variants available:** Graphite; arcade white; translucent violet; other cosmetic shell colors can be added without making a new PCB.
- **Repair and validation:** `Existing Faults from Fault Catalog`. Test the complete button/axis/trigger matrix, continuity, supply or battery behavior, connection handshake and any haptics, motion or audio present. Controller faults must appear as measurable electrical/mechanical symptoms.

#### - [ ] PAL-CTRL — Paltari Family Console controller

- **Unique external case shape:** Long narrow paddle slab with raised circular rotary-control wells.
- **Unique controller PCB:** Size **M**; shape **Long rounded bar with two separate circular pot extensions**; component density **Sparse**.
- **Component placement and electrical design:** Two rotary potentiometer footprints, numeric keypad or action-button pads, connector routing along top edge and simple encoder logic.
- **Console connection:** Wired proprietary cable. Must be compatible with **Paltari Family Console** using a system-specific supported input protocol.
- **Additional controller faults:** Scratchy potentiometers, loose rotary shafts, oxidized numeric contact fingers.
- **Case color variants available:** Woodgrain brown; matte black; amber; other cosmetic shell colors can be added without making a new PCB.
- **Repair and validation:** `Existing Faults from Fault Catalog`. Test the complete button/axis/trigger matrix, continuity, supply or battery behavior, connection handshake and any haptics, motion or audio present. Controller faults must appear as measurable electrical/mechanical symptoms.

#### - [ ] ORB-CTRL — Bintentendo Game Orb controller

- **Unique external case shape:** Round center pad enclosed by two shallow crescent grip fins.
- **Unique controller PCB:** Size **M**; shape **Annular ring with left and right crescent wings**; component density **Medium**.
- **Component placement and electrical design:** Analog stick module toward left ring, action-buttons in right arc, shoulder switches at upper rim, MCU and accessory connector at ring base.
- **Console connection:** Wired proprietary cable. Must be compatible with **Bintentendo Game Orb** using a system-specific supported input protocol.
- **Additional controller faults:** Stick drift, shoulder microswitch damage, circular PCB cracks around central screws.
- **Case color variants available:** Pearl white; cosmic black; electric purple; other cosmetic shell colors can be added without making a new PCB.
- **Repair and validation:** `Existing Faults from Fault Catalog`. Test the complete button/axis/trigger matrix, continuity, supply or battery behavior, connection handshake and any haptics, motion or audio present. Controller faults must appear as measurable electrical/mechanical symptoms.

#### - [ ] SWAM-CTRL — Swamarami All-In-One controller

- **Unique external case shape:** Asymmetric chunky rectangular brick with one oversized side handhold.
- **Unique controller PCB:** Size **M**; shape **Offset inverted T with squared right-hand lobe**; component density **Sparse**.
- **Component placement and electrical design:** Inexpensive button matrix, generic microcontroller, minimal protection, cheap cable connector and large unmasked copper pads.
- **Console connection:** Wired generic USB or house-specific plug. Must be compatible with **Swamarami All-In-One** using a system-specific supported input protocol.
- **Additional controller faults:** Cold joints, lifted pads, contamination-induced leakage, failing buttons, cable tug damage.
- **Case color variants available:** Off-white; bargain blue; neon green; other cosmetic shell colors can be added without making a new PCB.
- **Repair and validation:** `Existing Faults from Fault Catalog`. Test the complete button/axis/trigger matrix, continuity, supply or battery behavior, connection handshake and any haptics, motion or audio present. Controller faults must appear as measurable electrical/mechanical symptoms.

#### - [ ] DJ1-CTRL — DiscJockie 1 controller

- **Unique external case shape:** Low oval shield with tall shoulder humps and short stubs for grips.
- **Unique controller PCB:** Size **M**; shape **Flattened oval with two distinct top humps**; component density **Medium**.
- **Component placement and electrical design:** Twin analog stick footprints low center, D-pad left, four face buttons right, shoulder contacts and controller IC behind center.
- **Console connection:** Wired proprietary connector. Must be compatible with **DiscJockie 1** using a system-specific supported input protocol.
- **Additional controller faults:** Stick potentiometer wear, shoulder contact damage, solder fractures at cable anchor.
- **Case color variants available:** Smoke black; silver; ruby; other cosmetic shell colors can be added without making a new PCB.
- **Repair and validation:** `Existing Faults from Fault Catalog`. Test the complete button/axis/trigger matrix, continuity, supply or battery behavior, connection handshake and any haptics, motion or audio present. Controller faults must appear as measurable electrical/mechanical symptoms.

#### - [ ] DJ2-CTRL — DiscJockie 2 controller

- **Unique external case shape:** Split hexagon shell with sharp angled palm wedges.
- **Unique controller PCB:** Size **M**; shape **Segmented six-sided board with opposing diagonal grip tabs**; component density **Medium**.
- **Component placement and electrical design:** Stick modules on offset diagonals, D-pad and face-button membrane zones, four shoulder/trigger switches, controller MCU and USB-style charging/data port.
- **Console connection:** Wired USB or proprietary connector. Must be compatible with **DiscJockie 2** using a system-specific supported input protocol.
- **Additional controller faults:** Loose USB connector, broken shoulder switch, thumbstick jitter, torn membrane.
- **Case color variants available:** Midnight; cobalt; burnt orange; other cosmetic shell colors can be added without making a new PCB.
- **Repair and validation:** `Existing Faults from Fault Catalog`. Test the complete button/axis/trigger matrix, continuity, supply or battery behavior, connection handshake and any haptics, motion or audio present. Controller faults must appear as measurable electrical/mechanical symptoms.

#### - [ ] DJ3-CTRL — DiscJockie 3 controller

- **Unique external case shape:** Thin crescent shell with extended low hook grips.
- **Unique controller PCB:** Size **M**; shape **Asymmetric crescent with two long downward spurs**; component density **High**.
- **Component placement and electrical design:** Dual sticks, analog triggers, face controls, motion sensor, Bluetooth/RF controller, charge IC and battery plug.
- **Console connection:** Wireless with charging port. Must be compatible with **DiscJockie 3** using a system-specific supported input protocol.
- **Additional controller faults:** Charging IC failure, RF pairing fault, trigger sensor drift, damaged battery connector.
- **Case color variants available:** Obsidian; frost white; chrome blue; other cosmetic shell colors can be added without making a new PCB.
- **Repair and validation:** `Existing Faults from Fault Catalog`. Test the complete button/axis/trigger matrix, continuity, supply or battery behavior, connection handshake and any haptics, motion or audio present. Controller faults must appear as measurable electrical/mechanical symptoms.

#### - [ ] FS1-CTRL — Funstation 1 controller

- **Unique external case shape:** Classic narrow twin-wing pad with small bulbous handgrips.
- **Unique controller PCB:** Size **M**; shape **Butterfly polygon with mirrored lobes and a rectangular top center**; component density **Sparse**.
- **Component placement and electrical design:** D-pad, geometric action-button pads, Start/Select, shoulder buttons, simple scan IC and wired cable.
- **Console connection:** Wired proprietary cable. Must be compatible with **Funstation 1** using a system-specific supported input protocol.
- **Additional controller faults:** Membrane wear, fatigued shoulder switches, bad cable solder anchor.
- **Case color variants available:** Light gray; smoke; clear red; other cosmetic shell colors can be added without making a new PCB.
- **Repair and validation:** `Existing Faults from Fault Catalog`. Test the complete button/axis/trigger matrix, continuity, supply or battery behavior, connection handshake and any haptics, motion or audio present. Controller faults must appear as measurable electrical/mechanical symptoms.

#### - [ ] FS2-CTRL — Funstation 2 controller

- **Unique external case shape:** Tall dual-grip pad with extended center notch and scalloped top.
- **Unique controller PCB:** Size **M**; shape **Inverted U with a narrow middle bridge and squared shoulder ears**; component density **Medium**.
- **Component placement and electrical design:** Twin sticks, D-pad, face buttons, pressure-sensitive face inputs if modeled, shoulder/trigger switches and controller MCU.
- **Console connection:** Wired proprietary cable. Must be compatible with **Funstation 2** using a system-specific supported input protocol.
- **Additional controller faults:** Analog-stick wear, stuck pressure pads, shoulder spring failure, damaged plug.
- **Case color variants available:** Charcoal; ice blue; crimson; other cosmetic shell colors can be added without making a new PCB.
- **Repair and validation:** `Existing Faults from Fault Catalog`. Test the complete button/axis/trigger matrix, continuity, supply or battery behavior, connection handshake and any haptics, motion or audio present. Controller faults must appear as measurable electrical/mechanical symptoms.

#### - [ ] FS3-CTRL — Funstation 3 controller

- **Unique external case shape:** Broad shallow octagonal body with sweeping lower grip flares.
- **Unique controller PCB:** Size **M**; shape **Asymmetric octagon with one stepped lower-right wing**; component density **High**.
- **Component placement and electrical design:** Dual analog sticks, D-pad, face buttons, trigger assemblies, accelerometer/gyro, battery and wireless/USB charging circuitry.
- **Console connection:** Wireless with USB charge/data. Must be compatible with **Funstation 3** using a system-specific supported input protocol.
- **Additional controller faults:** Battery and USB wear, gyro failure, Bluetooth fault, trigger sensor errors.
- **Case color variants available:** Jet black; piano white; transparent gray; other cosmetic shell colors can be added without making a new PCB.
- **Repair and validation:** `Existing Faults from Fault Catalog`. Test the complete button/axis/trigger matrix, continuity, supply or battery behavior, connection handshake and any haptics, motion or audio present. Controller faults must appear as measurable electrical/mechanical symptoms.

#### - [ ] FS4-CTRL — Funstation 4 controller

- **Unique external case shape:** Flat angular wing body with a large central touch surface.
- **Unique controller PCB:** Size **L**; shape **Long angular scythe outline with a rectangular center cutout**; component density **High**.
- **Component placement and electrical design:** Capacitive touchpad, two analog sticks, D-pad, face controls, triggers, speaker, microphone, motion sensor, wireless MCU and charging.
- **Console connection:** Wireless with USB charge/data. Must be compatible with **Funstation 4** using a system-specific supported input protocol.
- **Additional controller faults:** Touchpad flex damage, microphone failure, USB port damage, joystick drift, trigger sensor fault.
- **Case color variants available:** Shadow black; arctic white; sunset copper; other cosmetic shell colors can be added without making a new PCB.
- **Repair and validation:** `Existing Faults from Fault Catalog`. Test the complete button/axis/trigger matrix, continuity, supply or battery behavior, connection handshake and any haptics, motion or audio present. Controller faults must appear as measurable electrical/mechanical symptoms.

#### - [ ] FS5-CTRL — Funstation 5 controller

- **Unique external case shape:** Wide futuristic twin-wing pad with prominent central touch bridge.
- **Unique controller PCB:** Size **L**; shape **Double-lobed shield with three scallops along its lower edge**; component density **Very high**.
- **Component placement and electrical design:** Hall or potentiometer sticks, capacitive touch, adaptive trigger motor driver, haptic actuators, speaker/mic, IMU, wireless transceiver and battery management.
- **Console connection:** Wireless with USB-C charge/data. Must be compatible with **Funstation 5** using a system-specific supported input protocol.
- **Additional controller faults:** Adaptive-trigger gear/driver damage, haptic actuator open circuit, charging port failure, touch sensor faults.
- **Case color variants available:** Glacier white; midnight black; galactic purple; other cosmetic shell colors can be added without making a new PCB.
- **Repair and validation:** `Existing Faults from Fault Catalog`. Test the complete button/axis/trigger matrix, continuity, supply or battery behavior, connection handshake and any haptics, motion or audio present. Controller faults must appear as measurable electrical/mechanical symptoms.

#### - [ ] SB1-CTRL — Sbox 1 controller

- **Unique external case shape:** Large thick X-inspired shell with bulky offset palm grips.
- **Unique controller PCB:** Size **M**; shape **Four-lobed cross with oversize upper-left extension**; component density **Medium**.
- **Component placement and electrical design:** Offset left stick, lower D-pad, clustered face buttons, chunky triggers, controller MCU and proprietary front cable socket.
- **Console connection:** Wired proprietary cable. Must be compatible with **Sbox 1** using a system-specific supported input protocol.
- **Additional controller faults:** Trigger wear, cable break, corroded socket, damaged stick module.
- **Case color variants available:** Forest black; army green; silver; other cosmetic shell colors can be added without making a new PCB.
- **Repair and validation:** `Existing Faults from Fault Catalog`. Test the complete button/axis/trigger matrix, continuity, supply or battery behavior, connection handshake and any haptics, motion or audio present. Controller faults must appear as measurable electrical/mechanical symptoms.

#### - [ ] SB2-CTRL — Sbox 2 controller

- **Unique external case shape:** Trapezoid body with diagonal upper shoulders and compact lower grips.
- **Unique controller PCB:** Size **M**; shape **Slanted trapezoid with a separate tapered right wing**; component density **Medium**.
- **Component placement and electrical design:** Offset sticks, D-pad, face buttons, shoulder triggers, central status light and controller MCU.
- **Console connection:** Wired proprietary connector. Must be compatible with **Sbox 2** using a system-specific supported input protocol.
- **Additional controller faults:** Trigger microswitch faults, worn D-pad dome, loose connector and analog drift.
- **Case color variants available:** Slate; lime; white; other cosmetic shell colors can be added without making a new PCB.
- **Repair and validation:** `Existing Faults from Fault Catalog`. Test the complete button/axis/trigger matrix, continuity, supply or battery behavior, connection handshake and any haptics, motion or audio present. Controller faults must appear as measurable electrical/mechanical symptoms.

#### - [ ] SB720-CTRL — Sbox 720 controller

- **Unique external case shape:** Wide M-shaped controller with outward-swept handles and central illuminated ring.
- **Unique controller PCB:** Size **M**; shape **Broad M outline with shallow square center throat**; component density **High**.
- **Component placement and electrical design:** Analog sticks, trigger sensors, directional cluster, buttons, wireless controller, battery contacts and ring LED driver.
- **Console connection:** Wireless via proprietary RF with battery bay. Must be compatible with **Sbox 720** using a system-specific supported input protocol.
- **Additional controller faults:** Battery corrosion, RF desync, ring LED faults, bumper switches, stick potentiometer wear.
- **Case color variants available:** White; black; translucent lime; other cosmetic shell colors can be added without making a new PCB.
- **Repair and validation:** `Existing Faults from Fault Catalog`. Test the complete button/axis/trigger matrix, continuity, supply or battery behavior, connection handshake and any haptics, motion or audio present. Controller faults must appear as measurable electrical/mechanical symptoms.

#### - [ ] SB10-CTRL — Sbox 10 controller

- **Unique external case shape:** Structured hourglass shell with a thick central spine and textured diagonal grips.
- **Unique controller PCB:** Size **M**; shape **Stepped hourglass with squared bottom tips**; component density **High**.
- **Component placement and electrical design:** Dual sticks, triggers, D-pad, face controls, shoulder switches, Bluetooth/RF chip, USB input and regulator network.
- **Console connection:** Wireless with USB connection. Must be compatible with **Sbox 10** using a system-specific supported input protocol.
- **Additional controller faults:** USB port fractures, RF pairing failure, trigger magnet/sensor displacement, bumper damage.
- **Case color variants available:** Carbon; sport blue; desert sand; other cosmetic shell colors can be added without making a new PCB.
- **Repair and validation:** `Existing Faults from Fault Catalog`. Test the complete button/axis/trigger matrix, continuity, supply or battery behavior, connection handshake and any haptics, motion or audio present. Controller faults must appear as measurable electrical/mechanical symptoms.

#### - [ ] SBS-CTRL — Sbox S controller

- **Unique external case shape:** Slim capsule-like body with hooked index-finger rests.
- **Unique controller PCB:** Size **M**; shape **Narrow capsule with hooked upper-left and lower-right tabs**; component density **High**.
- **Component placement and electrical design:** Compact staggered stick and button footprints, trigger sensors, wireless MCU, USB connector and battery monitoring.
- **Console connection:** Wireless with USB connection. Must be compatible with **Sbox S** using a system-specific supported input protocol.
- **Additional controller faults:** Small connector fatigue, shoulder switch wear, power-regulator failure, sticks catching housing.
- **Case color variants available:** Pearl white; mint; graphite; other cosmetic shell colors can be added without making a new PCB.
- **Repair and validation:** `Existing Faults from Fault Catalog`. Test the complete button/axis/trigger matrix, continuity, supply or battery behavior, connection handshake and any haptics, motion or audio present. Controller faults must appear as measurable electrical/mechanical symptoms.

#### - [ ] SB1X-CTRL — Sbox One X controller

- **Unique external case shape:** Premium broad shield pad with tapering underside tail and deep grips.
- **Unique controller PCB:** Size **L**; shape **Shield pentagon with narrow lower tail and offset rear tabs**; component density **Very high**.
- **Component placement and electrical design:** High-accuracy sticks, triggers, swappable accessory contacts, complex haptic drivers, wireless MCU, USB-C and power/charge protection.
- **Console connection:** Wireless with USB-C charge/data. Must be compatible with **Sbox One X** using a system-specific supported input protocol.
- **Additional controller faults:** Haptic driver faults, trigger sensor drift, accessory-pin corrosion, charging IC failure, thumbstick faults.
- **Case color variants available:** Satin black; titanium; crimson red; other cosmetic shell colors can be added without making a new PCB.
- **Repair and validation:** `Existing Faults from Fault Catalog`. Test the complete button/axis/trigger matrix, continuity, supply or battery behavior, connection handshake and any haptics, motion or audio present. Controller faults must appear as measurable electrical/mechanical symptoms.

#### - [ ] BPY-CTRL — Bintendo Pyramid controller

- **Unique external case shape:** Triangular three-corner pad with sloped face and undercut palm wings.
- **Unique controller PCB:** Size **M**; shape **Rounded triangle with a central triangular void and three projecting tabs**; component density **Medium**.
- **Component placement and electrical design:** One central analog stick, D-pad low left, action buttons low right, upper shoulder switches, small MCU and controller interface with triangular connector guard.
- **Console connection:** Wired proprietary cable. Must be compatible with **Bintendo Pyramid** using a system-specific supported input protocol.
- **Additional controller faults:** Cracked traces near the triangle points, loose mini connector, stick wear, worn action-button pads.
- **Case color variants available:** Ivory; pyramid gold; deep indigo; other cosmetic shell colors can be added without making a new PCB.
- **Repair and validation:** `Existing Faults from Fault Catalog`. Test the complete button/axis/trigger matrix, continuity, supply or battery behavior, connection handshake and any haptics, motion or audio present. Controller faults must appear as measurable electrical/mechanical symptoms.

## C. Existing consoles requiring a NEW CONTROLLER asset only

The following systems were part of the discussion but do **not** need a duplicate console merely for this handoff. Their controllers are nevertheless on the **to-create** list in section B:

- [ ] **Bintendo Entertainment System** — build and attach its unique controller asset from Section B; only touch console logic needed for controller compatibility.
- [ ] **Bintendo 64** — build and attach its unique controller asset from Section B; only touch console logic needed for controller compatibility.
- [ ] **Vega Exodus** — build and attach its unique controller asset from Section B; only touch console logic needed for controller compatibility.
- [ ] **Paltari Family Console** — build and attach its unique controller asset from Section B; only touch console logic needed for controller compatibility.
- [ ] **Funstation 5** — build and attach its unique controller asset from Section B; only touch console logic needed for controller compatibility.
- [ ] **Bintentendo Game Orb** — build and attach its unique controller asset from Section B; only touch console logic needed for controller compatibility.
- [ ] **Swamarami All-In-One** — build and attach its unique controller asset from Section B; only touch console logic needed for controller compatibility.

**Handheld exclusions (no detachable controller to create):** DiscJockie Pocket, Dream Boy/Pocket/Color, Dream Boy Advance/SP/Micro, Button Lite, Retrobit RB35, Bintendo Pocket Joy Advance, and Homey Sinnusus. Their buttons are part of the handheld unit itself, not a separate controller asset.

## D. Media registry — CREATE the missing media assets, not games

| Format ID | Media physical style | Systems | Distinctness rule |
|---|---|---|---|
| `DJ1_DISC` | Full-size CD style | DiscJockie 1 | Not FS1 or other platform native media |
| `DJ2_DISC` | Full-size DVD style | DiscJockie 2 | DJ2 native platform ID |
| `DJ3_DISC` | Full-size high-density disc | DiscJockie 3 | DJ3 native platform ID |
| `DJ_POCKET_MINI_DISC` | Mini optical disc | DiscJockie Pocket | Not Bintendo Mini-Disc |
| `FS1_DISC` | Full-size CD style | Funstation 1 | FS1 native platform ID |
| `FS2_DISC` | Full-size DVD style | Funstation 2 | FS2 native platform ID |
| `FS3_DISC` | Full-size Blu-ray style | Funstation 3 | FS3 native platform ID |
| `FS4_DISC` | Full-size high-capacity disc | Funstation 4 | FS4 native platform ID |
| `SB1_DISC` | Full-size DVD style | Sbox 1 | SB1 native platform ID |
| `SB2_DISC` | Full-size DVD style | Sbox 2 | SB2 native platform ID |
| `SB720_DISC` | Full-size DVD style | Sbox 720 | SB720 native platform ID |
| `SB10_DISC` | Full-size Blu-ray style | Sbox 10 | SB10 native platform ID |
| `SBS_DISC` | Full-size Blu-ray style | Sbox S | SBS native platform ID |
| `SB1X_DISC` | Full-size ultra-high-capacity disc | Sbox One X | Preserve existing five titles |
| `BINTENDO_MINI_DISC` | Proprietary mini optical disc | Bintendo Pyramid | Not DiscJockie Pocket or Game Orb disc |

Bintentendo Game Orb already has a distinct optical-disc format and Pocket Joy cartridge interface from the earlier catalog. Do not alias Bintendo Pyramid mini discs to either of those.

## E. Acceptance checklist for Claude

- [ ] All **15 console/handheld** creation entries addressed, including **Bintendo Pyramid**.
- [ ] **21** visibly different, physically and electrically distinct stand-alone controllers created, one per non-handheld system.
- [ ] **DiscJockie Pocket is a handheld** with integrated controls, not a 22nd stand-alone controller.
- [ ] Every controller has **case-color variants**; cosmetic shells share one controller PCB design per model.
- [ ] Board sizes use exactly **XS, S, M, L, XL, XXL** without measurements; shape, density and component placement implemented.
- [ ] Each entry uses **`Existing Faults from Fault Catalog`** and adds only its documented model-specific failures.
- [ ] Disc drive subassemblies support optical, servo, ribbon, spindle, eject and mechanism diagnosis, as applicable.
- [ ] The **Bintendo Mini-Disc** has its own media definition, model, drive behavior and inventory compatibility checks.
- [ ] Existing Funstation 5 and Sbox One X game titles remain unchanged; no new game library generated in this phase.
- [ ] Deliverables available to the game: console meshes, board meshes, circuit/connector mapping, drives, controllers, shell variants, repair faults, and test routines.

---
**Summary:** This file is the **TO-CREATE LIST** Claude should implement now, not an inventory of games or a merged 148-board repair catalog. Preserve existing content. Create the listed hardware and its repairable controllers. Bintendo Pyramid is explicitly included as a new console.