# Bench Tech: devices to create (backlog)

Everything below is **not built yet** unless marked Built. The game has 34 devices today. The Steam launch bar is 60-100
devices (see `STATUS.md`); the rest of this list is the long-term pipeline.

How to read it: the GPT catalog (`Bench_Tech_Expanded_Repair_Catalog-first-set_Claude_Ready_v2.md`) is a set of
suggestions, not directives. Its entries are listed here with the IDs it uses. Where the catalog and the real game
disagree (tiers 1-6 against the game's tiers 1-3, the "exact inheritance flag" wording, the size taxonomy), the game
wins: every new device inherits the existing fault library through the generic variants (`devices/index.ts`) plus its
own specific faults, and uses the tier system the game already has.

Rules for every new device: parody names only; every fault variant has a tier, a symptom and a canonical repair; build
from blocks where possible; 3D parts and shells come from Blender; run `npm run routes` after layout changes.

## 1. Built (34)
Lamp, Bluetooth speaker (BoomPuck), TV backlight board, Sbox One X power board, Button handheld + Button Lite + Grip,
Funstation 5 HDMI section, DualPulse, Sbox pad, Retrobit RB35, Rogue Pal, Duo handhelds (3), Game & Clock, Critter
mini, Galaxy Raid arcade, Dream Boy family (6) + carts, BES / B64 / Vega / Paltari + carts.

## 2. Already planned earlier (from your first lists)
- Funstation 5 power / standby section; Funstation 5 Pro; Sbox One X main board; Button main board
- Grapple Laptop, Venovo Laptop (with Wi-Fi chip swaps and reflow)
- Ding security system boards
- MyPhone 16 / 17 / 18 / 19 (with a wireless-charging coil on some)
- SoundHalo mains power supply (dead start-up resistor, dim-bulb tester)
- VoltMax and others; later phases: intermittents, BGA work, mains supplies

## 3. Your original list, itemised (every repairable board)
From `Bench_Tech_Though-Upl_Device_List_Detailed_Variants.md`. Each row is one repairable PCB; products with two or
more boards (baby monitor, cordless phone, Game Orb) are separate jobs and the player has to find which board is at
fault. Every Fessna, Eagle 2000 and F28 order is rush with overnight delivery; Scamborgeenee, MeHari and D Wagon
carry a premium plus a pretentious-customer fee; Zeeya is economy.

### A. Bluetooth Speakers


**Bluetooth Speakers**

| Board | Tier | PCB size | Density | Shape | Special constraints |
|---|---|---|---|---|---|
| Yeets Pill Box — Main Audio/Charging PCB | T2 | S | Dense | Long pill/oval silhouette with flattened ends | Protect cell; isolate battery for rework. |
| Marshawn Carry-Round — Main Audio/Control PCB | T3 | M | Moderate | Wide rectangle with large jack cutout and two mounting tabs | Device enclosure resembles miniature guitar amplifier. |
| JayCon Pocket Beatz — Round Control PCB | T1 | XS | Dense | Circular disc with flattened USB-C notch | Low-cost entry-tier build; some solder joints are deliberately marginal. |
| Blok-Buster Jamz Box — Stereo/Sub Mainboard | T4 | XL | Dense | Wide boombox-style rectangle with asymmetrical display bay | High battery capacity, high service payout. |

### B. Household Electronics


**Cry-Away Baby Monitor**

| Board | Tier | PCB size | Density | Shape | Special constraints |
|---|---|---|---|---|---|
| Cry-Away Camera/Transmitter — Camera PCB | T3 | M | Very Dense | Egg-shaped oval with camera cutout | One half of a paired job; companion receiver may be supplied. |
| Cry-Away Parent Receiver — LCD/Audio PCB | T3 | M | Dense | Vertical oval with flattened LCD aperture | Separate repairable PCB; player may diagnose camera versus receiver. |

**Universal TV Remotes**

| Board | Tier | PCB size | Density | Shape | Special constraints |
|---|---|---|---|---|---|
| Universal Remote 01 — Basic IR 4-Device | T1 | S | Sparse | Long narrow rounded rectangle | IR only; no wireless RF. |
| Universal Remote 02 — Learning IR With LCD | T2 | M | Moderate | Elongated rectangle with narrow waist | IR learning feature distinct from basic unit. |
| Universal Remote 03 — Smart RF/IR Hub Remote | T3 | M | Dense | Stepped elongated outline with RF antenna wing | RF communications differ from IR; use correct test mode. |
| Universal Remote 04 — Premium Touchscreen Control | T4 | L | Very Dense | Rounded wide rectangle with touchscreen cutout | Premium finish and high component replacement cost. |

**Garage Door Openers**

| Board | Tier | PCB size | Density | Shape | Special constraints |
|---|---|---|---|---|---|
| Garage Clicker 01 — Two-Button RF Transmitter | T1 | XS | Low | Teardrop/keychain rounded rectangle | Simulated protocol; no access-code extraction or bypass. |
| Garage Clicker 02 — Wall/Visor Multi-Door Remote | T2 | S | Moderate | Rounded rectangular card with three-button edge | Do not implement real rolling-code secrets or pairing bypass. |

**Automotive Key Fobs**

| Board | Tier | PCB size | Density | Shape | Special constraints |
|---|---|---|---|---|---|
| Key Fob 01 — Economy 2-Button Remote | T1 | XS | Low | Small rounded rectangle | Entry vehicle; no passive entry. |
| Key Fob 02 — Standard 3-Button Remote | T2 | XS | Moderate | Asymmetrical keyhead contour | Lock/unlock/trunk. |
| Key Fob 03 — Flip-Key Remote | T2 | S | Moderate | L-shaped outline with pivot clearance | Physical key mechanism included in disassembly. |
| Key Fob 04 — Smart Proximity Fob | T3 | S | Dense | Rounded diamond with antenna shoulders | Fictional secure credentials; no real key cloning. |
| Key Fob 05 — Luxury Display Key | T4 | M | Very Dense | Wide rounded rectangle with display window | Higher payout due to display and paired diagnostics. |
| Key Fob 06 — Ultra-Premium Motion/Remote-Start Key | T4 | M | Extreme | Irregular tapered rectangle | RF key with no IR unless this exact asset adds an IR emitter. |

**Alarm Clocks**

| Board | Tier | PCB size | Density | Shape | Special constraints |
|---|---|---|---|---|---|
| Alarm Clock 01 — Classic LED | T1 | M | Sparse | Wide shallow rectangle | Simple board, early-game through-hole friendly. |
| Alarm Clock 02 — Dual Alarm LCD | T2 | M | Moderate | Trapezoid with front LCD cutout | Includes soft rubber snooze bar. |
| Alarm Clock 03 — Smart Color Display | T3 | L | Dense | Wide rectangle with speaker reliefs | Some app/network behavior abstracted into test fixture. |

**Irrigation Controller**

| Board | Tier | PCB size | Density | Shape | Special constraints |
|---|---|---|---|---|---|
| RainWrangler 8-Zone Irrigation — Main Controller | T3 | L | Moderate | Wide rectangle with eight terminal bays | No live outdoor mains in repair minigame. |

**LCD TV Power Supplies**

| Board | Tier | PCB size | Density | Shape | Special constraints |
|---|---|---|---|---|---|
| LCD TV PSU 01 — Compact LED TV | T3 | L | Sparse | Long rectangle with primary/secondary isolation slot | Hazardous real-world mains: in-game isolated power fixture only. |
| LCD TV PSU 02 — Midrange With LED Backlight Driver | T4 | XL | Moderate | Broad rectangular board with isolated LED-driver corner | Do not automatically blame PSU for an open LED strip. |
| LCD TV PSU 03 — Premium Large-Panel PFC Supply | T5 | XXL | Dense | Wide irregular board with multiple isolated sections | Advanced high-energy topology represented safely in simulation. |

**PC Motherboards**

| Board | Tier | PCB size | Density | Shape | Special constraints |
|---|---|---|---|---|---|
| PC Motherboard 01 — Entry-Level Office Micro-ATX | T4 | XL | Dense | Micro-ATX-like rectangle with rear I/O notch | No actual CPU silicon reballing required for every fault. |
| PC Motherboard 02 — Midrange Gaming ATX | T4 | XXL | Very Dense | Full ATX rectangular outline | T4 with optional T5 double-root-cause jobs. |
| PC Motherboard 03 — Creator/Workstation E-ATX | T5 | XXL | Extreme | Extended rectangle with irregular PCIe clearance cutout | Requires fine-pitch proficiency and staged diagnostics. |
| PC Motherboard 04 — Compact Mini-ITX Enthusiast | T5 | L | Extreme | Square with four mounting holes | Small footprint but very hard due to density. |

**Oven Controllers**

| Board | Tier | PCB size | Density | Shape | Special constraints |
|---|---|---|---|---|---|
| Oven 01 — Basic Electric Range | T2 | M | Low | Rectangle with relay ear | Mains heater loads represented with virtual low-voltage fixture. |
| Oven 02 — Convection Wall Oven | T3 | L | Moderate | Stepped rectangle with three connector wings | Higher service cost from high-current terminals. |
| Oven 03 — Premium Induction/Smart Oven | T4 | XL | Dense | Wide irregular rectangle with heat-sink cutout | Actual induction power stage never live in game. |

**Dishwasher Controllers**

| Board | Tier | PCB size | Density | Shape | Special constraints |
|---|---|---|---|---|---|
| Dishwasher 01 — Budget Mechanical/Hybrid | T2 | M | Sparse | Tall rectangle with protruding relay tab | Moisture exposure likely. |
| Dishwasher 02 — Digital Touch Control | T3 | L | Moderate | Long narrow board with display wing | Can present two interacting symptoms from one moisture path. |
| Dishwasher 03 — Premium SensorWash | T4 | XL | Dense | Wide U-shaped PCB with connector peninsula | Multi-board fault localization; add separate inverter board only if modeled. |

**Washing Machine Controllers**

| Board | Tier | PCB size | Density | Shape | Special constraints |
|---|---|---|---|---|---|
| Washer 01 — Basic Top-Loader | T2 | L | Moderate | Broad rectangular board with corner mounting ears | Water damage with visible deposits. |
| Washer 02 — High-Efficiency Front-Loader | T4 | XL | Dense | L-shaped board with deep harness notch | Motor inverter may be separate daughterboard. |
| Washer 03 — Smart Direct-Drive Controller | T5 | XXL | Very Dense | Large stepped board with twin power cutouts | High-energy areas modeled as safely isolated fixture. |

**Clothes Dryer Controllers**

| Board | Tier | PCB size | Density | Shape | Special constraints |
|---|---|---|---|---|---|
| Dryer 01 — Basic Timer/Heater Control | T2 | M | Sparse | Long rectangle with exposed connector ledge | Represent mains and heater with isolated simulated outputs. |
| Dryer 02 — Sensor Dry Digital | T3 | L | Moderate | Rectangle with edge notch for moisture sensor | Heating physics handled by game fixture. |
| Dryer 03 — Heat-Pump Smart Dryer | T4 | XL | Dense | Irregular polygon with compressor connector wing | Complex scheduling and sensor interplay. |

**DVD Players**

| Board | Tier | PCB size | Density | Shape | Special constraints |
|---|---|---|---|---|---|
| DVD Player 01 — Panicsonnet DVD-120 Budget Tray | T2 | M | Moderate | Flat rectangle with spindle motor connector notch | Optical faults can be mechanical, optical, or electrical. |
| DVD Player 02 — Panicsonnet DVD-500 Progressive | T3 | L | Dense | Wide rectangle with separate analog-output peninsula | Requires distinguishing bad mechanism from bad mainboard. |
| DVD Player 03 — Panicsonnet Home Theater DVD/Audio Combo | T4 | XL | Very Dense | Large L-shaped board with amplifier heat-sink edge | High board complexity; mechanical subsystem remains separate asset. |

### C. Gaming Devices, Consoles and Cartridges


**Phantic Racing Rig**

| Board | Tier | PCB size | Density | Shape | Special constraints |
|---|---|---|---|---|---|
| Phantic Racing Wheel — Motor/Buttons Mainboard | T4 | L | Dense | Circular-sector/U-shaped PCB to fit wheel hub | Expose motors and mechanics as separate parts if game supports them. |
| Phantic Racing Pedal Box — Sensor/Interface PCB | T2 | S | Moderate | Long narrow rectangle with three pedal cable notches | Sensor calibration required after repair. |

**Bintendo Pocket Joy**

| Board | Tier | PCB size | Density | Shape | Special constraints |
|---|---|---|---|---|---|
| Bintendo Pocket Joy Advance — Dual-Screen Motherboard | T4 | L | Very Dense | Foldable-console wide rectangle with hinge-side neck | Two LCD modules modeled as replaceable parts, not necessarily two full PCBs. |
| Bintendo Pocket Joy Game Cartridge — Standard PCB | T1 | XS | Low | Tiny rectangle with gold-finger edge | Different games may use shared board with varying memory populations. |

**Homey Sinnusus**

| Board | Tier | PCB size | Density | Shape | Special constraints |
|---|---|---|---|---|---|
| Homey Sinnusus — Wide Retro Handheld Mainboard | T3 | L | Dense | Long horizontal capsule with stepped grip ends | Horizontal control arrangement differs from dual-screen unit. |
| Homey Sinnusus Retro Cart — Save Cartridge | T1 | XS | Low | Narrow rectangular PCB with notched edge connector | No disc drive in this device. |

**Bintentendo Game Orb**

| Board | Tier | PCB size | Density | Shape | Special constraints |
|---|---|---|---|---|---|
| Bintentendo Game Orb — Spherical Console Mainboard | T4 | L | Very Dense | Round main PCB with two cutouts and radial mounting points | Round PCB is mandatory; removable optical drive separate asset. |
| Bintentendo Game Orb — Optical Disc Drive Servo Card | T3 | S | Moderate | Crescent/sector board that follows disc well | Mechanical problems coexist with PCB faults; avoid inappropriate solder repair of broken plastic. |

**Swamarami All-In-One**

| Board | Tier | PCB size | Density | Shape | Special constraints |
|---|---|---|---|---|---|
| Swamarami All-In-One — Multi-Cartridge Motherboard | T3 | XL | Dense | Highly irregular polygon with four connector prongs | Intentionally low-quality manufacture but faults must still be electrically plausible. |

### D. Phones and Tablets


**Pandroid**

| Board | Tier | PCB size | Density | Shape | Special constraints |
|---|---|---|---|---|---|
| Pandroid — Modern Smartphone Logic Board | T5 | S | Extreme | Stepped elongated motherboard with stacked shield zones | Use same shared fault behavior as existing MyPhone; preserve special subboard if modeled. |

**MySlab Tablets**

| Board | Tier | PCB size | Density | Shape | Special constraints |
|---|---|---|---|---|---|
| MySlab Micro — Compact Tablet Mainboard | T3 | S | Very Dense | Short stepped rectangle hugging display corner | Small screen; single RAM package. |
| MySlab Mini — Standard Compact Tablet | T3 | M | Dense | Long thin rectangular board with corner notch | Increment from Micro: added RAM capacity and microSD. |
| MySlab — Mainstream Tablet | T4 | L | Very Dense | Wide stepped rectangle with side-mounted port wing | Larger display and battery connector; more RAM than Mini. |
| MySlab Mega — Large Premium Tablet | T5 | XL | Extreme | Wide irregular rectangle with four display tabs | Largest and densest MySlab model. |

**Pandroid Slate Tablets**

| Board | Tier | PCB size | Density | Shape | Special constraints |
|---|---|---|---|---|---|
| Pandroid Slate 7 — Entry Compact | T3 | S | Dense | Compact rectangular board with antenna peninsula | Smallest Slate; does not inherit nonexistent SD slot. |
| Pandroid Slate — Standard Model | T3 | M | Very Dense | Stepped rectangle with dual mounting ears | Base model for numbered tablets. |
| Pandroid Slate 10 — Performance | T4 | L | Very Dense | Long rectangle with offset socket notch | Higher RAM density than base Slate. |
| Pandroid Slate 12 — Creative | T4 | XL | Extreme | Wide L-shaped PCB for camera clearance | Adds stylus/digitizer to standard features. |
| Pandroid Slate 14 — Oversized Flagship | T5 | XXL | Extreme | Broad irregular outline with extra ribbon protrusions | Size refers to PCB footprint, not screen inches. |

**Legacy Phones**

| Board | Tier | PCB size | Density | Shape | Special constraints |
|---|---|---|---|---|---|
| Flipper Pro — Classic Clamshell Mobile Phone | T2 | S | Moderate | Narrow hinged rectangle with fold-axis notch | No smartphone-class memory density. |
| Boomer49 — 1990s Cordless Handset PCB | T2 | M | Sparse | Long rounded rectangle with antenna tongue | Vintage THT repair techniques. |
| Boomer49 — Cordless Base/Charging Station PCB | T2 | L | Low | Broad rectangle with antenna corner | No direct public telephone network service required. |

### E. Original Exotic Electronics


**Fessna Crytation 12 — JEFFA Avionics**

| Board | Tier | PCB size | Density | Shape | Special constraints |
|---|---|---|---|---|---|
| Fessna Crytation 12 — Flight Display Interface Card | T5 | L | Very Dense | Long rectangle with asymmetrical keyed rear edge | JEFFA game certification; approved/traceable parts; remove and restore coating; controlled heat; clean all flux; paid ce |
| Fessna Crytation 12 — Engine Sensor Interface | T5 | M | Dense | Tapered rectangle with twin connector shoulders | JEFFA game certification; coating removal/reapplication, controlled heat history, traceable parts, flux-free inspection, |
| Fessna Crytation 12 — Cabin Climate/Pressurization Monitor | T4 | L | Moderate | Wide rounded rectangle with cutout along connector side | JEFFA game certification and fully documented coating/cleaning; high parts cost; paid certification, rush and overnight. |
| Fessna Crytation 12 — Communications/Audio Integration | T5 | M | Very Dense | Stepped rectangular board with RF shield lip | JEFFA game certification; traceable stock and clean-room-style QA, recoat; paid certification, mandatory rush and overni |

**Eagle 2000 JetAir — JEFFA Avionics**

| Board | Tier | PCB size | Density | Shape | Special constraints |
|---|---|---|---|---|---|
| Eagle 2000 JetAir — Primary Flight Computer I/O | T5 | XL | Extreme | Stepped square with backplane cutaway | JEFFA game certification; controlled rework/cleaning/coating; certified replacement parts; paid cert, rush and overnight |
| Eagle 2000 JetAir — Power Distribution Controller | T5 | L | Dense | Long stepped polygon with output-connector flange | JEFFA certified process, coat removal/reapplication, part traceability, flux removal; rush and overnight always. |
| Eagle 2000 JetAir — Navigation Sensor Aggregator | T5 | M | Very Dense | Hexagonal card with three edge key slots | JEFFA certification; thermal process constraints, flux inspection and recoat; rush/overnight. |
| Eagle 2000 JetAir — Cabin Entertainment/Services Hub | T4 | XL | Dense | Flat U-shaped PCB with daughtercard recess | JEFFA game certification for avionics-grade customer contract; approved parts, recoat and traceable QC; rush/overnight. |

**USN F28 T-Rex — Mil-Spec Avionics**

| Board | Tier | PCB size | Density | Shape | Special constraints |
|---|---|---|---|---|---|
| USN F28 T-Rex — Mission Power Interface | T5 | XL | Very Dense | Shielded double-width rectangle with scalloped mounting tabs | Fictional mil-spec certification; controlled heat, coating grind/solvent removal and restoration; approved parts, no flu |
| USN F28 T-Rex — Rugged Flight Display Controller | T5 | XL | Extreme | Wide angular polygon with display notch | Mil-spec game certification; coating and thermal audit; certified parts, rush/overnight; no tactical display functionali |
| USN F28 T-Rex — Environmental Sensor Acquisition | T5 | L | Dense | Narrow octagonal panel with opposite connector tabs | Mil-spec game certification, special stock/heat limits, complete cleaning and conformal restoration; rush/overnight. |
| USN F28 T-Rex — Communication Interface Rack Card | T5 | XXL | Very Dense | Long rack-length rectangle with double backplane fingers | No real tactical frequencies, cryptography or operational parameters; mil-spec game service process, rush/overnight. |
| USN F28 T-Rex — Recorder and Diagnostics Module | T5 | M | Very Dense | Stepped rectangle with removable memory bay | Mil-spec game certification and traceable media; recoat, thermal audit and flux-free inspection; rush/overnight. |
| USN F28 T-Rex — Cooling and Auxiliary Power Control | T4 | L | Moderate | Irregular five-sided board with fan headers all around | Mil-spec game certification, coat restoration, approved parts and clean inspection; rush/overnight. |

**Scamborgeenee Chadventor — Premium Automotive**

| Board | Tier | PCB size | Density | Shape | Special constraints |
|---|---|---|---|---|---|
| Scamborgeenee Chadventor — ECM | T5 | XL | Extreme | Sharp-edged trapezoid with extended apex connector | Premium parts; gold-finished test pads rather than physically gold-plated solder; coating restoration, Premium + Pretent |
| Scamborgeenee Chadventor — TCM | T5 | L | Very Dense | Offset rhombus/parallelogram with angled harness side | Costly approved parts; premium gold finish, conformal restoration and Pretentious Customer Fee. |
| Scamborgeenee Chadventor — BCM | T4 | XL | Dense | Broad trapezoid with one rounded lower corner | Premium payout plus Pretentious Customer Fee; coating/traceability. |

**MeHari F69 — Premium Automotive**

| Board | Tier | PCB size | Density | Shape | Special constraints |
|---|---|---|---|---|---|
| MeHari F69 — ECU | T5 | XL | Extreme | Asymmetric wedge with sloped port flange | Expensive certified-style parts and gold-finished test pads; coating service and Pretentious Customer Fee. |
| MeHari F69 — TCM | T5 | L | Very Dense | Irregular boomerang/polygon shape | Premium and Pretentious Customer Fee, coated board, approved expensive parts. |
| MeHari F69 — Body Control Module | T4 | XL | Dense | Angular diamond with clipped vertices | Premium parts, coating restoration and Pretentious Customer Fee. |

**D Wagon Flex — Premium Automotive**

| Board | Tier | PCB size | Density | Shape | Special constraints |
|---|---|---|---|---|---|
| D Wagon Flex — Circular ECM | T5 | L | Extreme | True circular board with three mounting notches | Circular form factor required; premium gold pad finish, coating, high-cost parts and Pretentious Customer Fee. |
| D Wagon Flex — Circular TCM | T5 | M | Very Dense | Compact circular ring with center mechanical opening | Circular annular geometry, coating, premium payout and Pretentious Customer Fee. |
| D Wagon Flex — Circular BCM | T4 | L | Dense | Circular disc with three rectangular connector cutouts | Circular PCB mandated; gold-finish look and Pretentious Customer Fee. |

**Zeeya Spirit — Economy Automotive**

| Board | Tier | PCB size | Density | Shape | Special constraints |
|---|---|---|---|---|---|
| Zeeya Spirit — Combined ECM/TCM Unimodule | T3 | M | Moderate | Simple square with four mounting holes | Cheap parts, routine turnaround, no coating, ordinary customer fee. |

## 4. GPT catalog (58 entries; suggestions; its tiers T1-T6 are the catalog's own scale)
### A. Exotic: naval, orbital, NIGHTGLASS, launch (certified work)

| ID | Device | Tier | PCB size | Density |
|---|---|---|---|---|
| A-01 | USN Poseidon SQS-88 — Hydrophone Signal Conditioning Board | T5 | XL | Dense |
| A-02 | USN Poseidon SQS-88 — Sonar Processing and Interface Board | T5 | XL | Very Dense |
| A-03 | USSF Wayfinder — Orbital Power Management Module | T5 | L | Dense |
| A-04 | USSF Wayfinder — Telemetry and Communications Module | T5 | M | Very Dense |
| A-05 | USSF Wayfinder — Attitude Sensor Interface Module | T5 | L | Dense |
| A-06 | Project NIGHTGLASS — Unidentified System Board NX-000 | T6 | XXL | Extreme |
| A-07 | OuterSpace Y Albatross 11 — Launch Avionics Power Conditioner | T5 | M | Dense |
| A-08 | OuterSpace Y Albatross 11 — Vehicle Health Monitor | T5 | L | Very Dense |
| A-09 | OuterSpace Y Albatross 11 — Range Telemetry Transceiver | T5 | M | Very Dense |
| A-10 | OuterSpace Y GalaxyShip — Cabin Environment Controller | T4 | L | Moderate |
| A-11 | OuterSpace Y GalaxyShip — Distributed Power Node | T5 | XL | Dense |

### B. Electric vehicle modules

| ID | Device | Tier | PCB size | Density |
|---|---|---|---|---|
| B-01 | Ressla Model Why — Battery Management Master Controller | T5 | L | Very Dense |
| B-02 | Ressla Model Why — Cabin and Body Control Module | T4 | XL | Dense |
| B-03 | VoltzWagen ID.Buzzkill — Onboard Charger Control Board | T5 | M | Very Dense |
| B-04 | VoltzWagen ID.Buzzkill — Thermal Management Controller | T3 | L | Moderate |
| B-05 | Riveran R1Tuff — Motor Inverter Control Board | T5 | L | Very Dense |
| B-06 | Nissin Leaft — DC-DC Converter Control Module | T4 | M | Dense |

### C. Cordless tool controllers

| ID | Device | Tier | PCB size | Density |
|---|---|---|---|---|
| C-01 | Haul Freight Warrior 12V Cordless Screwdriver — Trigger PCB | T1 | XS | Sparse |
| C-02 | Ryoban OneMore 18V Brushed Drill — Speed Controller | T2 | S | Low |
| C-03 | Feewalt 20V Brushless Drill — BLDC Control Board | T3 | S | Dense |
| C-04 | Makyta XDT-99 Impact Driver — Controller | T3 | S | Dense |
| C-05 | StillWockee Fuelish Impact Wrench — Torque Logic PCB | T4 | M | Very Dense |
| C-06 | Ridgebit 18V Oscillating Multi-tool — Drive PCB | T3 | S | Dense |
| C-07 | Feewalt 60V Flex Saw — Circular Saw Controller | T4 | L | Moderate |
| C-08 | Haul Freight Herplease Reciprocating Saw — Control Board | T2 | S | Low |
| C-09 | Makyta Brushless Angle Grinder — Safety Controller | T4 | M | Dense |
| C-10 | Ryoban 18V String Trimmer — Motor Controller | T3 | S | Moderate |
| C-11 | Feewalt PowerStack-ish Battery Pack — BMS Board | T4 | S | Dense |

### D. Gaming peripherals

| ID | Device | Tier | PCB size | Density |
|---|---|---|---|---|
| D-01 | Pwnage ViperLite USB Gaming Mouse | T1 | S | Moderate |
| D-02 | Razerish VenomAir Wireless Gaming Mouse | T3 | S | Very Dense |
| D-03 | KeyKing RGB-68 Mechanical Keyboard | T2 | XL | Moderate |
| D-04 | Clacker Pro Wireless Keyboard | T3 | L | Dense |
| D-05 | VebCam 1080P Streaming Camera | T3 | XS | Very Dense |
| D-06 | StreamEye 4K Pro Webcam | T4 | S | Extreme |
| D-07 | BoomMic 7.1 USB Gaming Headset | T2 | XS | Moderate |
| D-08 | HyperLoud Wireless Gaming Headset | T3 | S | Very Dense |
| D-09 | QuarterMuncher Arcade Stick 8 | T1 | M | Sparse |
| D-10 | FightPaddy Elite Arcade Controller | T3 | L | Dense |
| D-11 | VRaptor Motion Wand | T4 | S | Very Dense |

### E. 3D printer controllers

| ID | Device | Tier | PCB size | Density |
|---|---|---|---|---|
| E-01 | Reeality Bender 8-Bit Classic — Mainboard | T2 | L | Moderate |
| E-02 | Pruska MK4-ish — 32-Bit Motion Controller | T3 | L | Dense |
| E-03 | BamBoozle Carbon X — CoreXY Mainboard | T4 | XL | Very Dense |
| E-04 | Voroneer Toolhead CAN Board | T3 | XS | Dense |
| E-05 | Elegoon Saturnish Resin Printer — Main Controller | T4 | L | Dense |

### F. Old-school and legacy electronics

| ID | Device | Tier | PCB size | Density |
|---|---|---|---|---|
| F-01 | DiscManiac 100 Portable CD Player | T2 | S | Moderate |
| F-02 | SilvaSound CD-300 Hi-Fi Deck | T3 | L | Moderate |
| F-03 | Kaysonic StreetBlaster 1986 Boombox | T2 | XL | Low |
| F-04 | Blok-Buster Retro Jammer 1992 Boombox | T3 | XL | Moderate |
| F-05 | Sonnic TR-9 Pocket Transistor Radio | T1 | XS | Sparse |
| F-06 | Panicsonnet Sunwave FM-12 Transistor Radio | T2 | S | Low |
| F-07 | WeatherWise Station 2000 Desk Weather Monitor | T2 | M | Low |
| F-08 | SkyCast Pro 5-in-1 Weather Station | T3 | L | Moderate |
| F-09 | RoadRage CB-40 Mobile CB Radio | T2 | L | Low |
| F-10 | TruckTalk CB-88 Deluxe CB Radio | T3 | XL | Moderate |
| F-11 | Hamster HT-2 Dual-Band Handheld Amateur Radio | T3 | S | Very Dense |
| F-12 | Hamster BasePro-100 Amateur Base Transceiver | T5 | XL | Dense |
| F-13 | StormGuard WX-1 Emergency Weather Radio | T1 | S | Low |
| F-14 | StormGuard WX-Alert Deluxe | T3 | M | Moderate |

## 5. How many devices that is
Built 34. Earlier plans about 25. Your original list 90 boards. The GPT catalog 58. Roughly **207 devices** in all, far past the Steam bar, so the order matters.

## 6. Build waves (suggested)
1. **Wave 1, reuse existing blocks (quick):** the four Bluetooth speakers, alarm clocks, universal remotes, garage
   openers, key fobs, baby monitor, LCD TV supplies, cordless-tool trigger boards (C-01, C-02, C-08), mouse and
   keyboard (D-01, D-03), arcade stick (D-09), transistor / weather radios (F-05, F-13).
2. **Wave 2, handhelds, phones and carts:** MyPhone, Pandroid, Flipper Pro, Boomer49, Bintendo Pocket Joy + carts, Homey
   Sinnusus + carts, Swamarami, racing wheel and pedals, tablets.
3. **Wave 3, appliance and PC boards:** irrigation, oven / washer / dryer controllers, DVD players, PC motherboards,
   laptops, Ding boards, SoundHalo supply, Funstation 5 / Sbox One X main boards.
4. **Wave 4, tools, printers, radios, EV:** the rest of sections C, D, E, F and B of the catalog.
5. **Wave 5, certified work:** avionics, orbital, naval, NIGHTGLASS and the high-end automotive modules, once the
   certification system is in.
