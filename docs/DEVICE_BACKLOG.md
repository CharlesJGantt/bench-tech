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

## 3. Your new list
### Bluetooth speakers (reuse the BoomPuck blocks: USB-C, charger, battery, BT chip, MCU, amp, buttons, LEDs)
| Device | Notes |
|---|---|
| Yeets Pill Box | Mid-tier, pill shaped, one speaker, modest battery, small board |
| Marshawn Carry-Round | Guitar-amp styled, two speakers, SD slot, DC power jack and supply |
| JayCon Pocket Beatz | Entry level, round, one speaker, SD slot, USB-C charging |
| Blok-Buster Jamz Box | High end, boom-box style, two speakers + small subwoofer, large Li-ion, LCD, SD slot |

### Household electronics
| Device | Notes |
|---|---|
| Cry-Away Baby Monitor | Two boards: parent unit (LCD, speaker, DC + battery, Wi-Fi, antenna) and camera unit (camera module, SD) |
| Universal TV remote | 3-4 variants: corrosion, impact damage, bad traces, cap / chip faults. Needs an IR / RF tester tool |
| Garage door opener | 1-2 variants, same failures as remotes |
| Automotive key fobs | 3-6 variants, more functions with car prestige; dead coin cell, corrosion, broken traces. Needs the RF / IR tester |
| Alarm clocks | 2-3 variants: large 7-segment or LCD |
| Irrigation controller | 8 zones, relays, transistors, MCU, many connectors; liquid damage and lightning burn-out |
| LCD TV power supplies | 2-3 variants: bad caps, failed controllers |
| PC motherboards | 3-4 variants, dense, test points, regulators, BIOS chip and battery, mounting-hole joints (hard tier) |
| Oven / dishwasher / washing machine / dryer controllers | 2-4 variants: relays and common electronics faults |
| DVD players | 2-3 variants: researched common DVD faults (laser, tray, belts) + electronics faults |

### Gaming devices and games
| Device | Notes |
|---|---|
| Phantic Racing Wheel (controller board) | Worn inputs, microswitches, connectors |
| Phantic Racing Pedal Box (controller board) | Worn inputs, microswitches, connectors |
| Bintendo Pocket Joy Advance | Handheld with 2 LCD screens, game pin fingers |
| Bintendo Pocket Joy cartridges | Common cartridge faults |
| Homey Sinnusus | Retro colour LCD handheld, controls left and right |
| Homey Sinnusus carts | Common cart failures |
| Bintentendo Game Orb | Spherical console, round PCB, takes discs and Pocket Joy carts; needs a disc drive (dirty lens, debris) |
| Swamarami All-In-One | Cheap retro clone: all carts, SD card, multiple cart connectors, poor soldering, flux left on board |

### Phones and tablets
| Device | Notes |
|---|---|
| Pandroid | Phone variant: same faults as MyPhone plus USB faults |
| MySlab, Mini, Micro, Mega | Tablet family: larger screens, more RAM, SD slots |
| Pandroid Slate 7 / 10 / 12 / 14 | Same electronics, larger screens and more RAM |
| Flipper Pro | Flip phone: USB mini, small LCD, small battery |
| Boomer49 | 1990s cordless phone: through-hole, basic faults |

### Exotic electronics (certified work: see the certification system in STATUS.md)
| Device | Notes |
|---|---|
| Fessna Crytation 12 | 4 avionics boards, JEFFA-certified PCB, conformal coating, certified parts and consumables only, certification before payment, rush + overnight always |
| Eagle 2000 JetAir | 4 avionics boards, same rules |
| USN F28 T-Rex 12th-gen Fighter | 6 avionics boards, military-spec PCB, same rules |
| Scamborgeenee Chadventor ECM / TCM / BCM | Trapezoid and rhombus boards, many MCUs, test points, CAN diagnostic port, conformal coating, gold-plated joints, premium + "pretentious customer" fee |
| MeHari F69 ECU / TCM / Body control | Odd-shaped boards, same traits |
| D Wagon Flex | Circular boards, same traits |
| Zeeya Spirit ECM / TCM unimodule | Simple square board, no coating, cheap, normal turnaround; needs the CAN diagnostics pad |
| Electric cars | (your list ends here: to be defined) |

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
Built 34. Earlier plans about 25. Your new lists about 60 (counting variants). The GPT catalog 58. Roughly **180
devices** in all, far past the Steam bar, so the order matters.

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
