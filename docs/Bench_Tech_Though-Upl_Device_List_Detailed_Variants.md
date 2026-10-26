# Bench Tech — Original Device List: Expanded PCB and Variant Specifications

**Deliverable:** Standalone Claude implementation handoff for the **original user-provided device list**. This complements the separate **New Electronics Repair Catalog Expansion** and must be merged, not substituted. This file supplies complete, *distinct* variants for every originally requested multi-variant family and also preserves the original single-model entries.

## Non-negotiable implementation instructions

1. Preserve every existing game device, fault type, electrical model, PCB routing model, diagnostic instrument, minigame, and progression rule. **This file adds content; it must not replace the current database or the other 58-entry expansion.**
2. **EVERY individually repairable entry below must include the literal inheritance field:** `Existing Faults from Fault Catalog`. Device-specific failures are **additional** candidate faults, not a closed list. Choose applicable inherited faults only when a matching component, connector, trace, mechanism or supply is present.
3. Multi-variant families are not merely reskins: instantiate the distinct PCB size, shape, density, components, placement, physical enclosure, repair procedures, tester response and fault selection documented for *each* model.
4. Each fault must drive real simulation effects: changed currents/voltages, continuity, rail sequencing, clock and bus responses, display/audio/output behavior, and diagnostic-tool readings. **Do not reveal culprit directly through a magic diagnostic readout.**
5. Treat separate PCBs and serviceable modules as separate repair jobs where noted. Multiple boards can appear within one customer order; players must isolate which board is at fault before repair when applicable.
6. **Use the exact naming supplied here.** `Panicsonnet` is the approved parody brand. In the separate expansion, preferred parody names are `Ressla`, `StillWockee`, `Herplease`, `Feewalt`, and `Reeality Bender`.
7. Avoid false positives: an unpopulated footprint cannot have a component failure; an IR-only remote does not fail an RF stage; a two-speaker amp cannot have a subwoofer-channel fault; a cartridge cannot have disc-drive faults.
8. No actual vehicle/garage security bypass or cloning workflows. Safety-critical military, aviation, mains appliances, industrial-power and high-voltage repairs use fictional specifications and **de-energized / isolated bench simulations**. JEFFA and the game's mil-spec certification are explicitly fictional. No real military weapon functions or classified designs.

## Relative physical specification system

| PCB size | Game-world relative board footprint (not enclosure) |
|---|---|
| **XS** | Extra small, miniature remote/card/daughterboard |
| **S** | Small, handheld or compact control board |
| **M** | Medium, ordinary standalone PCB |
| **L** | Large, broad mainboard / complex controller |
| **XL** | Extra large, substantial power or control board |
| **XXL** | Extra-extra large, oversized/rack-like/dense large board |

**Component population density:** Sparse / Low / Moderate / Dense / Very Dense / Extreme. Shape and density are independent of size. Do not translate size classes into dimensions. A small densely populated tablet board can be harder than a large sparse appliance PCB.

**Difficulty:** T1 Intro; T2 Basic; T3 Intermediate; T4 Advanced; T5 Expert; T6 Legendary. These tiers reflect repair complexity; certified service/payout fees are handled separately.

### Cross-cutting diagnostic equipment and repair interactions

- IR remote tester for infrared emitters and IR receivers; RF test receiver/transmission meter for RF remotes, key fobs and garage openers. Not every remote has both radios.
- CAN diagnostic pad for luxury automotive modules: request data, read simulated trouble codes and supported measurements, run output tests, checksum firmware, update/reset *after* appropriate physical repairs. No security unlocking or real immobilizer cloning.
- Optical-media bench for DVD/CD-style mechanisms: spindle, sled, pickup, loading gears/belts, tray switches, disc detection, laser-pickup cable, known-good media and playback output.
- Safe isolated appliance/TV power fixture with realistic sense and output channels. Physically hazardous mains and motor/HV nodes are virtualized.
- Aircraft/military premium service mechanic: buy certification, order appropriate approved/traceable parts, carefully remove local conformal coat via grinding pen/remover, respect tighter heat-history limits, clean all flux, inspect, reapply conformal coating, document testing and ship by overnight courier. **Rush turnaround and overnight delivery are mandatory** for every Fessna, Eagle 2000 and USN F28 order. Do not equate game certification with real authorization.
- Premium automotive mechanic: costly replacement parts, expensive finish, gold-finished contact/test pads (rather than physically gold-plated solder joints), coating repair when present, and **Premium + Pretentious Customer Fee** on Scamborgeenee, MeHari and D Wagon Flex. Zeeya is economy priced.

## Variant coverage and detailed asset specifications

## A. Bluetooth Speakers
*4 separate serviceable PCB entries across 1 device families.*

### Bluetooth Speakers (4 repairable PCBs)

#### Yeets Pill Box — Main Audio/Charging PCB — T2

- **PCB size:** **S** (relative only; no measurements).
- **PCB shape:** Long pill/oval silhouette with flattened ends.
- **Component density:** **Dense**.
- **Physical layout / placement:** USB-C and charger cluster on one rounded end; Bluetooth antenna keep-out on the opposite end; center audio amp; tactile switches and two LEDs on a narrow accessible rim.
- **Major components / architecture:** Bluetooth audio SoC/MCU, class-D mono amp, battery charge/protection IC, USB-C receptacle, single speaker connector, Li-ion cell, status LEDs and controls.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Bent USB-C tongue; cracked connector anchor; noncharging battery from charge-IC failure; antenna detuning after a drop; mono amp output short; detached volume button.
- **Diagnostic / completion tests:** USB-C current draw, charging-cycle indicator, paired Bluetooth stream, mono speaker sweep and button/LED test.
- **Special constraints / gameplay:** Protect cell; isolate battery for rework.

#### Marshawn Carry-Round — Main Audio/Control PCB — T3

- **PCB size:** **M** (relative only; no measurements).
- **PCB shape:** Wide rectangle with large jack cutout and two mounting tabs.
- **Component density:** **Moderate**.
- **Physical layout / placement:** SD slot and buttons on upper edge; DC jack/USB-C and power conversion grouped left; BT/MCU centered; stereo class-D output and speaker terminals right.
- **Major components / architecture:** Dual speakers, BT SoC, MCU, SD reader, USB-C input, DC power jack, buck converter, stereo class-D amp, status LEDs, buttons, protection.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Intermittent DC-jack ground; oxidized SD socket; one dead audio channel; noisy switching regulator; cracked speaker terminal; Bluetooth section loses pairing.
- **Diagnostic / completion tests:** Compare DC and USB-C modes, enumerate SD media, verify both speaker channels and pairing.
- **Special constraints / gameplay:** Device enclosure resembles miniature guitar amplifier.

#### JayCon Pocket Beatz — Round Control PCB — T1

- **PCB size:** **XS** (relative only; no measurements).
- **PCB shape:** Circular disc with flattened USB-C notch.
- **Component density:** **Dense**.
- **Physical layout / placement:** Antenna segment at top arc; button dome contacts and LED pads around circumference; power and USB-C board edge; compact amplifier and speaker pads at center.
- **Major components / architecture:** BT/MCU combo IC, small class-D amp, USB-C charger, Li-ion cell, SD-card socket, mono speaker and status LEDs.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Loose USB-C shell; broken edge trace; corroded tact-switch domes; low-output amplifier; charge-path failure; microSD card-detect contact stuck.
- **Diagnostic / completion tests:** Check battery/USB charging, SD read, mono output, LED functions and button response.
- **Special constraints / gameplay:** Low-cost entry-tier build; some solder joints are deliberately marginal.

#### Blok-Buster Jamz Box — Stereo/Sub Mainboard — T4

- **PCB size:** **XL** (relative only; no measurements).
- **PCB shape:** Wide boombox-style rectangle with asymmetrical display bay.
- **Component density:** **Dense**.
- **Physical layout / placement:** Large power/battery zone along lower edge; LCD ribbon at top center; left/right stereo amp islands; separate subwoofer output stage; memory/BT cluster away from power inductors.
- **Major components / architecture:** BT MCU, large Li-ion battery pack interface, BMS/charger, USB-C, SD reader, LCD, stereo amplifier, separate sub amplifier, DSP/equalizer, switches and LEDs.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Failed subwoofer power stage; overheated output inductor; LCD ribbon latch damage; charger MOSFET short; one channel clipping; intermittent SD slot.
- **Diagnostic / completion tests:** Three-channel audio sweep, display test, charging profile, SD readout, battery load and BT streaming.
- **Special constraints / gameplay:** High battery capacity, high service payout.

## B. Household Electronics
*40 separate serviceable PCB entries across 13 device families.*

### Cry-Away Baby Monitor (2 repairable PCBs)

#### Cry-Away Camera/Transmitter — Camera PCB — T3

- **PCB size:** **M** (relative only; no measurements).
- **PCB shape:** Egg-shaped oval with camera cutout.
- **Component density:** **Very Dense**.
- **Physical layout / placement:** Camera lens and image sensor at upper face; Wi-Fi antenna keep-out near rim; SD slot on rear; battery/DC power along bottom; microphone and regulator islands shielded from image data.
- **Major components / architecture:** Camera sensor, image processor/MCU, Wi-Fi radio, antenna, flash, SD interface, microphone, DC input, battery charger and regulators.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Camera FPC not seated; failed image-sensor supply; liquid-damaged mic preamp; Wi-Fi antenna feed crack; SD-card detection failure.
- **Diagnostic / completion tests:** Live video/audio stream, local SD recording, DC and battery modes, Wi-Fi pairing.
- **Special constraints / gameplay:** One half of a paired job; companion receiver may be supplied.

#### Cry-Away Parent Receiver — LCD/Audio PCB — T3

- **PCB size:** **M** (relative only; no measurements).
- **PCB shape:** Vertical oval with flattened LCD aperture.
- **Component density:** **Dense**.
- **Physical layout / placement:** LCD and touch/button flex connectors on front-facing edge; speaker amplifier in lower corner; Wi-Fi MCU centered; antenna and charger separated from audio path.
- **Major components / architecture:** LCD, Wi-Fi SoC/MCU, antenna, speaker, mono amplifier, battery and DC power/charge circuit, buttons, status indicators.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Broken LCD flex latch; no audio from class-D amp; battery swelling fault representation; charger input fault; pairing timeout from failed oscillator.
- **Diagnostic / completion tests:** Paired live video/audio, brightness, speaker volume, battery operation and charger acceptance.
- **Special constraints / gameplay:** Separate repairable PCB; player may diagnose camera versus receiver.

### Universal TV Remotes (4 repairable PCBs)

#### Universal Remote 01 — Basic IR 4-Device — T1

- **PCB size:** **S** (relative only; no measurements).
- **PCB shape:** Long narrow rounded rectangle.
- **Component density:** **Sparse**.
- **Physical layout / placement:** Large carbon-pad key matrix occupies most PCB; microcontroller at one end; IR LED and drive transistor at top; battery contacts at rear edge.
- **Major components / architecture:** 8-bit MCU, IR LED, IR transistor driver, resistor network, crystal/resonator, keypad contacts and battery springs.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Leaked battery electrolyte; cracked IR LED joint; damaged carbon contact pad; broken case-induced trace; missing oscillator startup.
- **Diagnostic / completion tests:** Camera/IR receiver tester confirms pulse train and button scan; check battery current.
- **Special constraints / gameplay:** IR only; no wireless RF.

#### Universal Remote 02 — Learning IR With LCD — T2

- **PCB size:** **M** (relative only; no measurements).
- **PCB shape:** Elongated rectangle with narrow waist.
- **Component density:** **Moderate**.
- **Physical layout / placement:** Keypad matrix below monochrome LCD; IR send and receive diodes at nose; NVM/MCU center; button backlight circuit along edges.
- **Major components / architecture:** Learning-capable MCU, EEPROM/flash, IR emitter, IR receiver, LCD and driver, key matrix, power supply and backlight LEDs.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Learning receiver open; erased stored profile; corroded LCD zebra contacts; LED backlight failure; stuck key row.
- **Diagnostic / completion tests:** IR learn/replay fixture; LCD segments, stored settings and all key rows.
- **Special constraints / gameplay:** IR learning feature distinct from basic unit.

#### Universal Remote 03 — Smart RF/IR Hub Remote — T3

- **PCB size:** **M** (relative only; no measurements).
- **PCB shape:** Stepped elongated outline with RF antenna wing.
- **Component density:** **Dense**.
- **Physical layout / placement:** RF antenna keep-out near top-right; IR emitter array at tip; central MCU/flash; USB-C charge and Li-ion section at bottom; tactile/haptic control islands.
- **Major components / architecture:** BLE/RF transceiver, IR LEDs, MCU, Li-ion charger, haptic motor driver, backlit keys, status display and flash.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Detuned antenna; failed RF regulator; USB-C damage; one IR emitter dead; haptic driver open; stuck button.
- **Diagnostic / completion tests:** Distinct RF link tester plus IR test, USB charging, haptic/display diagnostic and key scan.
- **Special constraints / gameplay:** RF communications differ from IR; use correct test mode.

#### Universal Remote 04 — Premium Touchscreen Control — T4

- **PCB size:** **L** (relative only; no measurements).
- **PCB shape:** Rounded wide rectangle with touchscreen cutout.
- **Component density:** **Very Dense**.
- **Physical layout / placement:** Display/FPC dominate front side; MCU, memory and PMIC tightly centered rear; IR emitters at top; RF antenna in dedicated edge keep-out; charging dock pads at base.
- **Major components / architecture:** Color touch LCD, MCU/application processor, RAM/flash, BLE/RF, IR transmitters, buck/LDO rails, Li-ion charging and dock contacts.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Cracked FPC latch; shorted LCD power rail; intermittent dock charging; false touch response; RF clock failure; corroded side key.
- **Diagnostic / completion tests:** Display/touch calibration, multi-protocol remote test, charging-dock and battery load checks.
- **Special constraints / gameplay:** Premium finish and high component replacement cost.

### Garage Door Openers (2 repairable PCBs)

#### Garage Clicker 01 — Two-Button RF Transmitter — T1

- **PCB size:** **XS** (relative only; no measurements).
- **PCB shape:** Teardrop/keychain rounded rectangle.
- **Component density:** **Low**.
- **Physical layout / placement:** Button contacts centered; RF oscillator/transmitter and antenna trace at top; coin-cell clip at bottom; minimal test pads.
- **Major components / architecture:** Sub-GHz-style RF transmitter IC, encoding MCU, resonator, PCB antenna, two switches and coin-cell holder.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Flattened battery spring; corroded switch contact; cracked antenna trace; damaged oscillator; impact-fractured solder joint.
- **Diagnostic / completion tests:** RF transmission indicator, button response and power consumption on authorized paired fixture.
- **Special constraints / gameplay:** Simulated protocol; no access-code extraction or bypass.

#### Garage Clicker 02 — Wall/Visor Multi-Door Remote — T2

- **PCB size:** **S** (relative only; no measurements).
- **PCB shape:** Rounded rectangular card with three-button edge.
- **Component density:** **Moderate**.
- **Physical layout / placement:** Three tact switches arranged across face; RF encoder with antenna along long edge; status LED near visor mounting slot; battery area opposite transmitter.
- **Major components / architecture:** RF controller, rolling-code-style simulated transmitter, antenna, three buttons, status LED and coin-cell supply.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** One button row stuck; intermittent battery clip; moisture-corroded edge antenna; bad LED transistor; damaged RF output filter.
- **Diagnostic / completion tests:** Authorized pairing simulator recognizes all three channels; RF strength and battery-load checks.
- **Special constraints / gameplay:** Do not implement real rolling-code secrets or pairing bypass.

### Automotive Key Fobs (6 repairable PCBs)

#### Key Fob 01 — Economy 2-Button Remote — T1

- **PCB size:** **XS** (relative only; no measurements).
- **PCB shape:** Small rounded rectangle.
- **Component density:** **Low**.
- **Physical layout / placement:** Two switches on front; coin-cell holder centered reverse; small MCU/RF stage at top; compact printed antenna perimeter.
- **Major components / architecture:** RF remote MCU/encoder, RF output, two tactile switches, coin cell and ESD parts.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Coin-cell drain; damaged switch dome; liquid corrosion; cracked antenna route; cell tab fracture.
- **Diagnostic / completion tests:** RF emission tester, simulated lock/unlock and battery draw.
- **Special constraints / gameplay:** Entry vehicle; no passive entry.

#### Key Fob 02 — Standard 3-Button Remote — T2

- **PCB size:** **XS** (relative only; no measurements).
- **PCB shape:** Asymmetrical keyhead contour.
- **Component density:** **Moderate**.
- **Physical layout / placement:** Three tact switches around central controller; antenna upper rim; battery contacts reverse; LED window on front.
- **Major components / architecture:** RF transceiver/MCU, three switches, status LED, coin cell, antenna and tuning passives.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Broken third button; loose LED; corrosion under IC; antenna matching cap fracture; solder crack after drop.
- **Diagnostic / completion tests:** RF signal, button mapping, LED pulse and sleep current.
- **Special constraints / gameplay:** Lock/unlock/trunk.

#### Key Fob 03 — Flip-Key Remote — T2

- **PCB size:** **S** (relative only; no measurements).
- **PCB shape:** L-shaped outline with pivot clearance.
- **Component density:** **Moderate**.
- **Physical layout / placement:** Mechanical key pivot occupies one corner; PCB antenna along opposite side; micro-switches on reinforced mounting line.
- **Major components / architecture:** Remote IC/MCU, RF resonator, lock/unlock/panic buttons, LED, coin cell and immobilizer transponder emulator.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Pivot impact fracture; worn panic switch; cracked ceramic resonator; cell-clip corrosion; broken transponder interface contact.
- **Diagnostic / completion tests:** RF test and authorized immobilizer emulator response; all button mappings.
- **Special constraints / gameplay:** Physical key mechanism included in disassembly.

#### Key Fob 04 — Smart Proximity Fob — T3

- **PCB size:** **S** (relative only; no measurements).
- **PCB shape:** Rounded diamond with antenna shoulders.
- **Component density:** **Dense**.
- **Physical layout / placement:** LF receive coil interface at one end; RF transmit region at other; MCU/secure-element model central; battery and four keys on reverse.
- **Major components / architecture:** LF wake receiver, RF transceiver, MCU/secure element emulator, four switches, coin cell, antenna and ESD.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Open LF coil trace; excess standby current; damaged RF network; liquid residue short; cracked QFN joint.
- **Diagnostic / completion tests:** Simulated passive entry/wake fixture, remote button test and standby current.
- **Special constraints / gameplay:** Fictional secure credentials; no real key cloning.

#### Key Fob 05 — Luxury Display Key — T4

- **PCB size:** **M** (relative only; no measurements).
- **PCB shape:** Wide rounded rectangle with display window.
- **Component density:** **Very Dense**.
- **Physical layout / placement:** Color LCD/OLED and flex near top; haptic/touch board center; battery/USB charging lower edge; RF and LF networks kept apart.
- **Major components / architecture:** Screen, touch controller, MCU, flash, RF/LF radios, haptics, rechargeable battery, USB-C charger, buttons.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Dead display PMIC rail; touchscreen FPC crack; battery drain; charging port shear; RF antenna detuning; haptic failure.
- **Diagnostic / completion tests:** Screen/touch, charging, remote functions and simulated passive-entry test.
- **Special constraints / gameplay:** Higher payout due to display and paired diagnostics.

#### Key Fob 06 — Ultra-Premium Motion/Remote-Start Key — T4

- **PCB size:** **M** (relative only; no measurements).
- **PCB shape:** Irregular tapered rectangle.
- **Component density:** **Extreme**.
- **Physical layout / placement:** RF antenna islands at both ends; IMU/MCU secure island center; multiple button FPCs; rechargeable cell plus USB-C charging side.
- **Major components / architecture:** RF/LF radios, IMU, MCU, secure storage emulator, display LEDs, USB-C charger, battery and multiple tact inputs.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Corroded IMU; intermittent USB-C CC connection; faulty RF switch; cracked BGA-like controller; high leakage on always-on rail.
- **Diagnostic / completion tests:** RF/IR bench only for interfaces actually present, IMU tilt, remote-start simulated command and standby consumption.
- **Special constraints / gameplay:** RF key with no IR unless this exact asset adds an IR emitter.

### Alarm Clocks (3 repairable PCBs)

#### Alarm Clock 01 — Classic LED — T1

- **PCB size:** **M** (relative only; no measurements).
- **PCB shape:** Wide shallow rectangle.
- **Component density:** **Sparse**.
- **Physical layout / placement:** Four-digit large seven-segment LED display along front edge; button row on top; buzzer and AC/DC conversion at rear.
- **Major components / architecture:** LED display, multiplex driver, simple MCU, alarm buzzer, clock source, buttons, DC input and backup cell.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Dark digit from broken solder; display driver channel failure; backup battery corrosion; drifting oscillator; silent buzzer.
- **Diagnostic / completion tests:** Segment-by-segment test, audible alarm, backup retention and timed run.
- **Special constraints / gameplay:** Simple board, early-game through-hole friendly.

#### Alarm Clock 02 — Dual Alarm LCD — T2

- **PCB size:** **M** (relative only; no measurements).
- **PCB shape:** Trapezoid with front LCD cutout.
- **Component density:** **Moderate**.
- **Physical layout / placement:** LCD/flex at front; dual alarm buttons on upper edge; RTC and coin cell behind display; backlight and piezo in corner.
- **Major components / architecture:** Monochrome LCD, MCU/RTC, battery backup, dual-alarm memory, backlight LED, piezo, DC supply.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Faulty LCD zebra strip; backup voltage loss; stuck snooze switch; noisy backlight driver; RTC crystal intermittent.
- **Diagnostic / completion tests:** LCD contrast, alarm A/B, timekeeping, dimming and backup test.
- **Special constraints / gameplay:** Includes soft rubber snooze bar.

#### Alarm Clock 03 — Smart Color Display — T3

- **PCB size:** **L** (relative only; no measurements).
- **PCB shape:** Wide rectangle with speaker reliefs.
- **Component density:** **Dense**.
- **Physical layout / placement:** Large display FPC and touch sensor upper half; speaker/audio lower corner; Wi-Fi antenna clear area; PMIC and memory central.
- **Major components / architecture:** LCD, Wi-Fi/BT SoC, RAM/flash, RTC, audio amp, speaker, USB charge outputs, buttons and clock regulator.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Failed touch ribbon; USB output polyfuse; Wi-Fi rail fault; bad clock reference; speaker amp overheating; poor backlight.
- **Diagnostic / completion tests:** Time sync simulation, alarm playback, touch test, USB load and display sweep.
- **Special constraints / gameplay:** Some app/network behavior abstracted into test fixture.

### Irrigation Controller (1 repairable PCB)

#### RainWrangler 8-Zone Irrigation — Main Controller — T3

- **PCB size:** **L** (relative only; no measurements).
- **PCB shape:** Wide rectangle with eight terminal bays.
- **Component density:** **Moderate**.
- **Physical layout / placement:** Eight repeated output-driver channels and terminal screws along bottom; MCU/display top; sensor ports and surge protectors near external wiring; power inlet isolated.
- **Major components / architecture:** 8 solenoid drivers (relay/triac as design choice), driver transistors, MCU, UI/display, rain sensor input, protection network, supply and connectors.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Moisture bridging terminals; lightning/surge-damaged protector; open zone driver; corroded terminal; lost RTC backup; cracked connector.
- **Diagnostic / completion tests:** Safe low-voltage solenoid emulator on all eight zones, rain sensor response, UI/RTC and per-channel current.
- **Special constraints / gameplay:** No live outdoor mains in repair minigame.

### LCD TV Power Supplies (3 repairable PCBs)

#### LCD TV PSU 01 — Compact LED TV — T3

- **PCB size:** **L** (relative only; no measurements).
- **PCB shape:** Long rectangle with primary/secondary isolation slot.
- **Component density:** **Sparse**.
- **Physical layout / placement:** AC inlet, fuse, common-mode choke and large bulk capacitor left of safety barrier; transformer centered; secondary rectifiers, optocoupler and output connectors right.
- **Major components / architecture:** Isolated SMPS, fuse, bridge rectifier, bulk capacitor, PWM controller, MOSFET, transformer, optocoupler, output capacitors, standby supply.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Open start resistor; swollen output capacitor; shorted MOSFET; damaged optocoupler; cracked transformer lead; standby rail missing.
- **Diagnostic / completion tests:** De-energized inspection then simulated isolated supply: standby voltage, startup, ripple, load regulation and protection.
- **Special constraints / gameplay:** Hazardous real-world mains: in-game isolated power fixture only.

#### LCD TV PSU 02 — Midrange With LED Backlight Driver — T4

- **PCB size:** **XL** (relative only; no measurements).
- **PCB shape:** Broad rectangular board with isolated LED-driver corner.
- **Component density:** **Moderate**.
- **Physical layout / placement:** Primary conversion on left; 12/24 V outputs along lower edge; separate constant-current LED driver with inductor and feedback upper right; control connectors at far side.
- **Major components / architecture:** SMPS plus LED boost driver, PWM ICs, switching MOSFETs, current-sense resistors, bulk electrolytics, optocoupler and feedback network.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Backlight driver shuts down on open-string simulator; failed LED boost FET; dried electrolytic ripple; bad current sense; intermittent enable signal.
- **Diagnostic / completion tests:** Separate power output load and LED-string simulator; standby, brightness/current control and fault feedback.
- **Special constraints / gameplay:** Do not automatically blame PSU for an open LED strip.

#### LCD TV PSU 03 — Premium Large-Panel PFC Supply — T5

- **PCB size:** **XXL** (relative only; no measurements).
- **PCB shape:** Wide irregular board with multiple isolated sections.
- **Component density:** **Dense**.
- **Physical layout / placement:** PFC boost inductor and bulk capacitor dominate one third; dual converters and sinks distributed center; multi-channel LED drivers at far edge; clear creepage barrier and many sense points.
- **Major components / architecture:** Active PFC, LLC-style resonant controller, standby flyback, multiple secondary rails, LED drivers, thermal monitoring, relay and protection.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** PFC startup failure; resonant controller bias loss; leaky optocoupler; cold joint at heat sink; shorted LED-driver MOSFET; output overvoltage trip.
- **Diagnostic / completion tests:** Isolated virtual AC source, PFC/output telemetry, thermal response, backlight load banks and protection verification.
- **Special constraints / gameplay:** Advanced high-energy topology represented safely in simulation.

### PC Motherboards (4 repairable PCBs)

#### PC Motherboard 01 — Entry-Level Office Micro-ATX — T4

- **PCB size:** **XL** (relative only; no measurements).
- **PCB shape:** Micro-ATX-like rectangle with rear I/O notch.
- **Component density:** **Dense**.
- **Physical layout / placement:** CPU socket and 4-phase VRM top; RAM slots beside CPU; chipset below; PCIe and storage along bottom; BIOS coin cell near perimeter; labeled voltage test pads.
- **Major components / architecture:** Chipset, BIOS SPI flash, RTC/battery, CPU socket, VRM MOSFETs/chokes, RAM sockets, USB/SATA/Ethernet interfaces, clock generator.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Shorted Vcore MOSFET; missing BIOS supply; bent RAM socket pin; broken USB connector; cracked trace near mounting hole; bad RTC holder.
- **Diagnostic / completion tests:** ATX supply simulator, POST diagnostic card, rail/clock verification, RAM enumeration and port checks.
- **Special constraints / gameplay:** No actual CPU silicon reballing required for every fault.

#### PC Motherboard 02 — Midrange Gaming ATX — T4

- **PCB size:** **XXL** (relative only; no measurements).
- **PCB shape:** Full ATX rectangular outline.
- **Component density:** **Very Dense**.
- **Physical layout / placement:** Eight-plus VRM phases and two heatsink areas around CPU; four RAM slots; PCIe retimers and NVMe slots lower; LED controller and fan headers along edges.
- **Major components / architecture:** Multi-phase VRM, chipset, BIOS flash, clock tree, RGB driver, PCIe, M.2, fan PWM/tach, USB power switches and audio codecs.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** VRM phase imbalance; corrupted BIOS image; damaged PCIe lane protection; fan-tach line open; RGB header short; leaking filter capacitor.
- **Diagnostic / completion tests:** POST steps, rail sequence, thermal/fan simulation, PCIe/NVMe link and USB/RGB tests.
- **Special constraints / gameplay:** T4 with optional T5 double-root-cause jobs.

#### PC Motherboard 03 — Creator/Workstation E-ATX — T5

- **PCB size:** **XXL** (relative only; no measurements).
- **PCB shape:** Extended rectangle with irregular PCIe clearance cutout.
- **Component density:** **Extreme**.
- **Physical layout / placement:** Large high-phase-count CPU VRM; ECC-like memory slots; dual BIOS/service headers; storage and high-speed interfaces crowded near I/O; many explicit test points.
- **Major components / architecture:** Dense VRM, supervisory MCU, high-speed interfaces, dual flash, USB-C PD controllers, clock buffers, Ethernet and onboard diagnostics.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Faulty VRM controller phase; shorted USB-C PD switch; failed high-speed reference clock; corroded CPU socket pins; intermittent debug header; flash-select failure.
- **Diagnostic / completion tests:** Sequenced power map, POST, workstation memory checks, I/O and thermal load profiles.
- **Special constraints / gameplay:** Requires fine-pitch proficiency and staged diagnostics.

#### PC Motherboard 04 — Compact Mini-ITX Enthusiast — T5

- **PCB size:** **L** (relative only; no measurements).
- **PCB shape:** Square with four mounting holes.
- **Component density:** **Extreme**.
- **Physical layout / placement:** CPU socket dominates center; miniature VRM pressed against top edge; twin RAM slots, M.2 on back; dense stacked I/O and fine-pitch controller islands.
- **Major components / architecture:** Compact VRM, chipset, BIOS flash, Wi-Fi/BT, USB-C, HDMI/display circuitry, power mux, M.2 and fan controls.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Damaged rear M.2 socket; regulator overheating; cracked BGA-area joint; missing Wi-Fi power; USB-C PD short; BIOS boot loop.
- **Diagnostic / completion tests:** Dual-face microscope inspection, rail sequencing, POST, storage/display and network simulation.
- **Special constraints / gameplay:** Small footprint but very hard due to density.

### Oven Controllers (3 repairable PCBs)

#### Oven 01 — Basic Electric Range — T2

- **PCB size:** **M** (relative only; no measurements).
- **PCB shape:** Rectangle with relay ear.
- **Component density:** **Low**.
- **Physical layout / placement:** Large heating relays and screw connectors bottom; keypad/display at front; low-voltage controller along upper edge.
- **Major components / architecture:** MCU, temperature-sensor input, relays, buzzer, seven-segment display and protected DC supply.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Welded heater relay; burned terminal; faulty temperature input resistor; fractured display pin; scorched relay solder joint.
- **Diagnostic / completion tests:** Simulated oven probe and relay load; setpoint, preheat and shutdown behavior.
- **Special constraints / gameplay:** Mains heater loads represented with virtual low-voltage fixture.

#### Oven 02 — Convection Wall Oven — T3

- **PCB size:** **L** (relative only; no measurements).
- **PCB shape:** Stepped rectangle with three connector wings.
- **Component density:** **Moderate**.
- **Physical layout / placement:** Fan and heater relay bank left; ADC temperature sense central; touch display interface to right; power supply isolated rear.
- **Major components / architecture:** Dual temperature ADCs, MCU, fan control, multiple relays, thermistor inputs, display and safety monitor.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Fan triac open; relay-driver transistor fails; thermistor divider drifts; ribbon latch damaged; moisture-corroded door input.
- **Diagnostic / completion tests:** Fan/heater simulator, sensor accuracy, door interlock and fault-code check.
- **Special constraints / gameplay:** Higher service cost from high-current terminals.

#### Oven 03 — Premium Induction/Smart Oven — T4

- **PCB size:** **XL** (relative only; no measurements).
- **PCB shape:** Wide irregular rectangle with heat-sink cutout.
- **Component density:** **Dense**.
- **Physical layout / placement:** Digital UI/MCU zone segregated from induction inverter-control section; isolated sensor connectors and cooling drivers near power edge.
- **Major components / architecture:** MCU, display interface, IGBT/MOSFET gate-driver control, current sensing, isolated feedback, Wi-Fi and fan drivers.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Gate-drive low-voltage rail missing; current-sensor offset; fan PWM fault; display data line broken; temperature safety feedback error.
- **Diagnostic / completion tests:** Low-energy inverter emulator, cooling and sensor stimulus, display/network checks.
- **Special constraints / gameplay:** Actual induction power stage never live in game.

### Dishwasher Controllers (3 repairable PCBs)

#### Dishwasher 01 — Budget Mechanical/Hybrid — T2

- **PCB size:** **M** (relative only; no measurements).
- **PCB shape:** Tall rectangle with protruding relay tab.
- **Component density:** **Sparse**.
- **Physical layout / placement:** Relays and terminal spades line bottom edge; timer MCU at center; LEDs and button contacts top; wash/rinse connectors split sides.
- **Major components / architecture:** MCU, heater/pump relays, water-level switch inputs, door switch, thermistor and indicator LEDs.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Corroded spade terminals; open pump relay coil; failed float-switch pull-up; leaking electrolytic; bad pushbutton dome.
- **Diagnostic / completion tests:** Safe cycle state machine, relay energize/de-energize, level and door inputs.
- **Special constraints / gameplay:** Moisture exposure likely.

#### Dishwasher 02 — Digital Touch Control — T3

- **PCB size:** **L** (relative only; no measurements).
- **PCB shape:** Long narrow board with display wing.
- **Component density:** **Moderate**.
- **Physical layout / placement:** Membrane keypad/display on long front edge; pump/valve drivers rear; power converters and comm link clustered center.
- **Major components / architecture:** Touch keys, display drivers, MCU, EEPROM, TRIACs or relays, valves, sensor interface and switching supply.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Waterwicked keypad connector; EEPROM corruption; stuck fill valve driver; failed door-latch detection; low-voltage SMPS ripple.
- **Diagnostic / completion tests:** Touch UI, fill/drain stages, heater safety and error-code recovery.
- **Special constraints / gameplay:** Can present two interacting symptoms from one moisture path.

#### Dishwasher 03 — Premium SensorWash — T4

- **PCB size:** **XL** (relative only; no measurements).
- **PCB shape:** Wide U-shaped PCB with connector peninsula.
- **Component density:** **Dense**.
- **Physical layout / placement:** Sensor ADCs and MCU island at U-base; two actuator banks on arms; isolated motor-driver board connector and wireless module on rear edge.
- **Major components / architecture:** MCU, turbidity interface, flow sensor conditioning, load switches, BLDC motor-command interface, wireless SoC and display.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Turbidity sensor bias error; stuck actuator output; oxidized motor-board connector; missing 3.3 V rail; intermittent serial bus.
- **Diagnostic / completion tests:** Simulated water cycle, flow/turbidity tests, motor commands and network UI.
- **Special constraints / gameplay:** Multi-board fault localization; add separate inverter board only if modeled.

### Washing Machine Controllers (3 repairable PCBs)

#### Washer 01 — Basic Top-Loader — T2

- **PCB size:** **L** (relative only; no measurements).
- **PCB shape:** Broad rectangular board with corner mounting ears.
- **Component density:** **Moderate**.
- **Physical layout / placement:** Cycle selector and LED matrix along front; lid/level inputs on side; relay/triac and pump connectors at bottom.
- **Major components / architecture:** MCU, relays/triacs, level-pressure sensing, lid lock circuit, motor control output and supply.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Cracked selector encoder joint; lid-lock sensor input fault; shorted fill valve triac; water ingress at terminal; bad timer oscillator.
- **Diagnostic / completion tests:** Lid/level safety, fill/agitate/drain and motor emulation.
- **Special constraints / gameplay:** Water damage with visible deposits.

#### Washer 02 — High-Efficiency Front-Loader — T4

- **PCB size:** **XL** (relative only; no measurements).
- **PCB shape:** L-shaped board with deep harness notch.
- **Component density:** **Dense**.
- **Physical layout / placement:** Power relay cluster on short leg; main MCU and sensing center; motor-inverter interface plus LCD/control connectors on long leg.
- **Major components / architecture:** MCU, EEPROM, door-lock supply, current sensors, pressure transducer, tach feedback, BLDC inverter-command interface.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Door-lock driver open; corrupt EEPROM cycle data; cracked motor header; noisy pressure rail; motor feedback missing.
- **Diagnostic / completion tests:** Door-lock interlock, pressure steps, motor spin ramp, fault-code and cycle completion.
- **Special constraints / gameplay:** Motor inverter may be separate daughterboard.

#### Washer 03 — Smart Direct-Drive Controller — T5

- **PCB size:** **XXL** (relative only; no measurements).
- **PCB shape:** Large stepped board with twin power cutouts.
- **Component density:** **Very Dense**.
- **Physical layout / placement:** Large inverter driver/heatsink area one side; MCU and memory separated by isolation barrier; high-density sensor harness on opposite edge.
- **Major components / architecture:** Three-phase inverter drive emulator, shunts, gate-driver ICs, MCU, touchscreen header, isolated interface and power supply.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** One drive-phase gate failure; bad shunt amp; intermittent rotor sensor input; SMPS startup fault; communication isolation error.
- **Diagnostic / completion tests:** Current-limited motor emulator, phase balance, speed feedback, safety-stop and UI functions.
- **Special constraints / gameplay:** High-energy areas modeled as safely isolated fixture.

### Clothes Dryer Controllers (3 repairable PCBs)

#### Dryer 01 — Basic Timer/Heater Control — T2

- **PCB size:** **M** (relative only; no measurements).
- **PCB shape:** Long rectangle with exposed connector ledge.
- **Component density:** **Sparse**.
- **Physical layout / placement:** Timer and buttons front edge; heater relay plus motor relay rear; thermostat interface with clearly separated terminal blocks.
- **Major components / architecture:** MCU or timer IC, heater relay, blower/motor relay, thermistor, door input and status LEDs.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Heater relay welded; heat-discolored solder lug; thermistor open; broken door input; degraded supply capacitor.
- **Diagnostic / completion tests:** Drying cycle test with simulated thermostat and drum load.
- **Special constraints / gameplay:** Represent mains and heater with isolated simulated outputs.

#### Dryer 02 — Sensor Dry Digital — T3

- **PCB size:** **L** (relative only; no measurements).
- **PCB shape:** Rectangle with edge notch for moisture sensor.
- **Component density:** **Moderate**.
- **Physical layout / placement:** Moisture-sense front end away from relays; MCU, EEPROM and display middle; motor/heater connectors rear.
- **Major components / architecture:** MCU, humidity/moisture probe conditioner, temperature inputs, fan relay, display and switching supply.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Moisture sensing stuck high; output relay contacts pitted; failing 5 V supply; button matrix stuck; thermal-probe connector corroded.
- **Diagnostic / completion tests:** Wet/dry simulator, heating, air-flow output and display cycle finish.
- **Special constraints / gameplay:** Heating physics handled by game fixture.

#### Dryer 03 — Heat-Pump Smart Dryer — T4

- **PCB size:** **XL** (relative only; no measurements).
- **PCB shape:** Irregular polygon with compressor connector wing.
- **Component density:** **Dense**.
- **Physical layout / placement:** Compressor/fan command zone on far edge; multi-sensor analog zone mid-board; touchscreen and wireless interface upper side; power supply isolated.
- **Major components / architecture:** MCU, compressor-interface driver, fan PWM, multi-NTC ADC, condensate pump switch, Wi-Fi and UI links.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Failed condenser sensor divider; stuck pump MOSFET; compressor command line damage; ESD at control panel; oscillator instability.
- **Diagnostic / completion tests:** Heat-pump process emulator, fan/pump state, sensor readings, UI/network and safe shutdown.
- **Special constraints / gameplay:** Complex scheduling and sensor interplay.

### DVD Players (3 repairable PCBs)

#### DVD Player 01 — Panicsonnet DVD-120 Budget Tray — T2

- **PCB size:** **M** (relative only; no measurements).
- **PCB shape:** Flat rectangle with spindle motor connector notch.
- **Component density:** **Moderate**.
- **Physical layout / placement:** Low-cost MPEG/servo SoC center; analog A/V jacks right; tray/spindle/sled motor headers front; power regulators on left.
- **Major components / architecture:** DVD decoder/servo controller, RAM, flash, spindle/sled/tray motor drivers, laser pickup FPC, RCA outputs and DC supply.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Loose pickup FPC; cracked motor-driver pins; stretched tray belt; tray position switch fault; dusty lens; dead output video capacitor.
- **Diagnostic / completion tests:** Tray open/close, spin/focus sequence, read known disc image and composite/audio output.
- **Special constraints / gameplay:** Optical faults can be mechanical, optical, or electrical.

#### DVD Player 02 — Panicsonnet DVD-500 Progressive — T3

- **PCB size:** **L** (relative only; no measurements).
- **PCB shape:** Wide rectangle with separate analog-output peninsula.
- **Component density:** **Dense**.
- **Physical layout / placement:** Optical-drive connectors line front; main decoder/SDRAM center; analog audio and component-video filters to right; buck supply left and IR input corner.
- **Major components / architecture:** Digital video SoC, RAM, flash, DAC/filter, optical servo electronics, tray and spindle motors, IR remote sensor and display.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Spindle driver intermittent; laser sled gear jam; dead video DAC rail; flickering front display; audio output coupling cap failure.
- **Diagnostic / completion tests:** Known-good disc loading, motor and pickup travel, video/audio output and remote control.
- **Special constraints / gameplay:** Requires distinguishing bad mechanism from bad mainboard.

#### DVD Player 03 — Panicsonnet Home Theater DVD/Audio Combo — T4

- **PCB size:** **XL** (relative only; no measurements).
- **PCB shape:** Large L-shaped board with amplifier heat-sink edge.
- **Component density:** **Very Dense**.
- **Physical layout / placement:** Optical/video SoC main island; multi-channel audio DAC and power amp grouped near heat sink; front display/key matrix ribbon; high-current output connectors rear.
- **Major components / architecture:** DVD servo/decoder, surround DAC, five-channel amp stage, cooling/thermal detection, optical drive, front-panel MCU and supplies.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** One surround channel dead; audio amp overcurrent; dried power cap; bent disc tray gear; pickup ribbon tear; thermal sensor open.
- **Diagnostic / completion tests:** Disc seek/video, surround channel sweep, cooling and front-control tests.
- **Special constraints / gameplay:** High board complexity; mechanical subsystem remains separate asset.

## C. Gaming Devices, Consoles and Cartridges
*9 separate serviceable PCB entries across 5 device families.*

### Phantic Racing Rig (2 repairable PCBs)

#### Phantic Racing Wheel — Motor/Buttons Mainboard — T4

- **PCB size:** **L** (relative only; no measurements).
- **PCB shape:** Circular-sector/U-shaped PCB to fit wheel hub.
- **Component density:** **Dense**.
- **Physical layout / placement:** Quadrature/optical position sensor near axis; motor/H-bridge along outer curved edge; multi-button matrix connectors arrayed around rim; USB-C/USB interface at shaft.
- **Major components / architecture:** MCU, USB controller, motor driver, wheel angle sensor, encoder, button matrix, indicator LEDs and connectors.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Worn paddle microswitch; encoder glitch; H-bridge FET failure; broken motor connector; snapped button FPC clip; USB port fracture.
- **Diagnostic / completion tests:** Wheel-position sweep, force-feedback motor simulator, button scan, USB identification and end-stop test.
- **Special constraints / gameplay:** Expose motors and mechanics as separate parts if game supports them.

#### Phantic Racing Pedal Box — Sensor/Interface PCB — T2

- **PCB size:** **S** (relative only; no measurements).
- **PCB shape:** Long narrow rectangle with three pedal cable notches.
- **Component density:** **Moderate**.
- **Physical layout / placement:** Three analog pedal channels side-by-side; reference and protection circuits center; wheel-base/USB cable connector on short edge.
- **Major components / architecture:** MCU, ADC, Hall/potentiometer inputs for throttle/brake/clutch, op-amps, ESD and data connector.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Worn potentiometer track; Hall sensor supply missing; cracked pedal jack; input amplifier offset; cable damage.
- **Diagnostic / completion tests:** Pedal travel and linearity plot for each axis; connector wobble check.
- **Special constraints / gameplay:** Sensor calibration required after repair.

### Bintendo Pocket Joy (2 repairable PCBs)

#### Bintendo Pocket Joy Advance — Dual-Screen Motherboard — T4

- **PCB size:** **L** (relative only; no measurements).
- **PCB shape:** Foldable-console wide rectangle with hinge-side neck.
- **Component density:** **Very Dense**.
- **Physical layout / placement:** Two separate screen FPC sockets near hinge; game cartridge edge connector bottom; MCU/processor/RAM cluster center; charge/USB and audio near shell corner.
- **Major components / architecture:** Handheld SoC, memory, dual-LCD drivers, audio amp, cartridge connector, shoulder switches, charging/protection, gamepad keys.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Cracked hinge LCD ribbon; bent game-cart pin; oxidized power switch; screen-backlight fuse open; shoulder switch failure; charge IC short.
- **Diagnostic / completion tests:** Both LCD images/backlights, cartridge boot, controls, battery charge and stereo audio.
- **Special constraints / gameplay:** Two LCD modules modeled as replaceable parts, not necessarily two full PCBs.

#### Bintendo Pocket Joy Game Cartridge — Standard PCB — T1

- **PCB size:** **XS** (relative only; no measurements).
- **PCB shape:** Tiny rectangle with gold-finger edge.
- **Component density:** **Low**.
- **Physical layout / placement:** ROM/save chip central; gold contacts across bottom; small protection and backup cell footprint on select game releases.
- **Major components / architecture:** ROM flash, optional SRAM/EEPROM save chip, optional coin-cell retention, cartridge PCB edge connector.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Worn/dirty cartridge contacts; lifted edge finger; broken save-battery tab; cracked ROM pin; broken via to data bus.
- **Diagnostic / completion tests:** Cartridge port continuity, title checksum and save/load retention simulation.
- **Special constraints / gameplay:** Different games may use shared board with varying memory populations.

### Homey Sinnusus (2 repairable PCBs)

#### Homey Sinnusus — Wide Retro Handheld Mainboard — T3

- **PCB size:** **L** (relative only; no measurements).
- **PCB shape:** Long horizontal capsule with stepped grip ends.
- **Component density:** **Dense**.
- **Physical layout / placement:** LCD module at center; left and right control pads at ends; cartridge connector top; speakers and power/charging in grip corners.
- **Major components / architecture:** Retro CPU/SoC, RAM/ROM, LCD controller, cartridge bus, buttons, stereo audio amp, battery/power and screen backlight.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Broken D-pad contact; LCD zebra/ribbon issue; cartridge slot corrosion; audio buzz from poor decoupling; failed power regulator.
- **Diagnostic / completion tests:** Color LCD graphics, control mapping, cart insertion, sound and battery load test.
- **Special constraints / gameplay:** Horizontal control arrangement differs from dual-screen unit.

#### Homey Sinnusus Retro Cart — Save Cartridge — T1

- **PCB size:** **XS** (relative only; no measurements).
- **PCB shape:** Narrow rectangular PCB with notched edge connector.
- **Component density:** **Low**.
- **Physical layout / placement:** ROM chip near center; optional save EEPROM or battery SRAM; beveled gold fingers along one short edge.
- **Major components / architecture:** ROM, save EEPROM/SRAM, small decoupling caps, contact fingers and optional backup cell.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Dirty contact fingers; intermittent save line; failed small EEPROM; battery leakage; cracked via near shell screw.
- **Diagnostic / completion tests:** Read ROM signature, write/verify save game and mechanical insert cycles.
- **Special constraints / gameplay:** No disc drive in this device.

### Bintentendo Game Orb (2 repairable PCBs)

#### Bintentendo Game Orb — Spherical Console Mainboard — T4

- **PCB size:** **L** (relative only; no measurements).
- **PCB shape:** Round main PCB with two cutouts and radial mounting points.
- **Component density:** **Very Dense**.
- **Physical layout / placement:** Processor/RAM under center heatsink; cartridge slot along radius; optical drive ribbon at top; USB/controller ports and video outputs on arc edge; DC conversion clustered nearby.
- **Major components / architecture:** Console CPU/GPU-like SoC, RAM, flash/boot ROM, cartridge interface, disk-drive interface, audio/video outputs, regulators and external ports.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Cartridge connector pin fatigue; no power from regulator; cracked video socket; bad thermal interface; damaged optical drive ribbon; BGA-area solder crack.
- **Diagnostic / completion tests:** Boot through cartridge and disc modes, video/audio outputs, controller ports and PSU rail sequence.
- **Special constraints / gameplay:** Round PCB is mandatory; removable optical drive separate asset.

#### Bintentendo Game Orb — Optical Disc Drive Servo Card — T3

- **PCB size:** **S** (relative only; no measurements).
- **PCB shape:** Crescent/sector board that follows disc well.
- **Component density:** **Moderate**.
- **Physical layout / placement:** Laser pickup ribbon socket at inner edge; spindle and sled motor drivers opposite; lid switch and optical sensor at corner.
- **Major components / architecture:** Laser pickup driver, spindle/sled DC motor drivers, hall/limit switches, optical sensor, flex socket, passive filters.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Dirty objective lens; disc-well debris; sticky spindle hub; sled worm-gear wear; failed spindle driver; torn laser flex.
- **Diagnostic / completion tests:** Disc spin, sled home, focus/track acquisition and known-disc read simulation.
- **Special constraints / gameplay:** Mechanical problems coexist with PCB faults; avoid inappropriate solder repair of broken plastic.

### Swamarami All-In-One (1 repairable PCB)

#### Swamarami All-In-One — Multi-Cartridge Motherboard — T3

- **PCB size:** **XL** (relative only; no measurements).
- **PCB shape:** Highly irregular polygon with four connector prongs.
- **Component density:** **Dense**.
- **Physical layout / placement:** Multiple cartridge sockets occupy perimeter; shared bus translation and MCU center; SD card and USB/power on lower edge; many visible flux deposits and poorly supported headers.
- **Major components / architecture:** Low-cost retro SoC, SRAM, multiple incompatible-style cartridge connectors via emulator, SD reader, USB input, video/audio ports, questionable regulator and clock circuit.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Cold joints on every cartridge bank; conductive flux residue; connector damage; power cap ESR high; failed bus mux; SD socket cracked; corroded via.
- **Diagnostic / completion tests:** Each cartridge type recognized individually, SD boot, power ripple and video/audio loopback.
- **Special constraints / gameplay:** Intentionally low-quality manufacture but faults must still be electrically plausible.

## D. Phones and Tablets
*13 separate serviceable PCB entries across 4 device families.*

### Pandroid (1 repairable PCB)

#### Pandroid — Modern Smartphone Logic Board — T5

- **PCB size:** **S** (relative only; no measurements).
- **PCB shape:** Stepped elongated motherboard with stacked shield zones.
- **Component density:** **Extreme**.
- **Physical layout / placement:** Processor and stacked RAM under central shields; PMIC nearby; cameras and display FPCs at edges; USB-C subboard FPC end; RF antenna matching islands upper edge.
- **Major components / architecture:** Smartphone SoC, LPDDR, UFS/eMMC, PMIC, charge controller, cellular/Wi-Fi radios, cameras, audio codec, display/touch and USB-C path.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Broken USB-C subboard connector; corrosion under shield; charging PMIC failure; shorted camera rail; display FPC torn; battery thermistor signal open.
- **Diagnostic / completion tests:** Boot, touch/camera/audio, USB data/charging, RF network emulator and power consumption.
- **Special constraints / gameplay:** Use same shared fault behavior as existing MyPhone; preserve special subboard if modeled.

### MySlab Tablets (4 repairable PCBs)

#### MySlab Micro — Compact Tablet Mainboard — T3

- **PCB size:** **S** (relative only; no measurements).
- **PCB shape:** Short stepped rectangle hugging display corner.
- **Component density:** **Very Dense**.
- **Physical layout / placement:** One RAM and SoC cluster central; USB-C port bottom edge; single camera and display flex at top; compact battery connector to side.
- **Major components / architecture:** Tablet SoC, modest RAM, storage, charge controller, display/touch, Wi-Fi, audio amp, USB-C and compact regulators.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** USB-C anchor shear; FPC latch damage; bad 1.8 V display supply; shorted charge FET; failed Wi-Fi LDO.
- **Diagnostic / completion tests:** Touchscreen/video, speaker, charging/data, Wi-Fi and suspend/wake.
- **Special constraints / gameplay:** Small screen; single RAM package.

#### MySlab Mini — Standard Compact Tablet — T3

- **PCB size:** **M** (relative only; no measurements).
- **PCB shape:** Long thin rectangular board with corner notch.
- **Component density:** **Dense**.
- **Physical layout / placement:** SoC, dual RAM positions and flash under center shield; SD card slot on exposed long edge; camera, speaker and screen FPCs around perimeter.
- **Major components / architecture:** Tablet processor, two RAM packages, eMMC/UFS, microSD, Wi-Fi/BT, PMIC, audio, touchscreen and USB-C.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Oxidized microSD contacts; cracked charging port; camera-connector short; RAM rail droop; one speaker channel dead.
- **Diagnostic / completion tests:** SD detect/read/write, LCD/touch and cameras, charger load and boot test.
- **Special constraints / gameplay:** Increment from Micro: added RAM capacity and microSD.

#### MySlab — Mainstream Tablet — T4

- **PCB size:** **L** (relative only; no measurements).
- **PCB shape:** Wide stepped rectangle with side-mounted port wing.
- **Component density:** **Very Dense**.
- **Physical layout / placement:** Higher-density SoC/memory under shield; two camera flexes upper region; SD and USB-C on protruding edge; power management and display driver connectors separated.
- **Major components / architecture:** Tablet SoC, several RAM packages, mass storage, optional SD, cameras, PMIC, battery fuel gauge, speaker amplifier and wireless.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** PMIC sequencing fault; USB-C PD issue; display backlight driver open; SD bus ESD short; camera line pulled low.
- **Diagnostic / completion tests:** Boot and memory stress, dual cameras, screen sweep, power/charge profiles and microSD.
- **Special constraints / gameplay:** Larger display and battery connector; more RAM than Mini.

#### MySlab Mega — Large Premium Tablet — T5

- **PCB size:** **XL** (relative only; no measurements).
- **PCB shape:** Wide irregular rectangle with four display tabs.
- **Component density:** **Extreme**.
- **Physical layout / placement:** SoC/large RAM array centrally shielded; dual power stages left and right; display driver and dense ribbon banks at top; USB-C/SD and accessories on lower corners.
- **Major components / architecture:** High-end SoC, multiple RAM packages, high-capacity storage, SD slot, USB-C PD, multiple display rails, cameras, four-speaker-style audio and wireless.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Dead upper display supply; shorted accessory port; damaged RAM package solder; PD negotiation failure; charging FET overheats; speaker amp short.
- **Diagnostic / completion tests:** Multi-rail startup, display/touch, RAM stress, SD transfer, fast-charge model, cameras and speakers.
- **Special constraints / gameplay:** Largest and densest MySlab model.

### Pandroid Slate Tablets (5 repairable PCBs)

#### Pandroid Slate 7 — Entry Compact — T3

- **PCB size:** **S** (relative only; no measurements).
- **PCB shape:** Compact rectangular board with antenna peninsula.
- **Component density:** **Dense**.
- **Physical layout / placement:** Wi-Fi section on protruding side; SoC/RAM center; display FPC top; USB-C, battery connector and speaker bottom.
- **Major components / architecture:** Economy SoC, one RAM package, flash, Wi-Fi/BT, USB-C charge, LCD/touch, camera and audio.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Weak Wi-Fi from antenna feed; charger short; broken display latch; speaker connector damage; failing 3.3 V LDO.
- **Diagnostic / completion tests:** Display/touch, camera, charge and Wi-Fi tests.
- **Special constraints / gameplay:** Smallest Slate; does not inherit nonexistent SD slot.

#### Pandroid Slate — Standard Model — T3

- **PCB size:** **M** (relative only; no measurements).
- **PCB shape:** Stepped rectangle with dual mounting ears.
- **Component density:** **Very Dense**.
- **Physical layout / placement:** SoC and two RAM packages under shield; microSD at side; battery/DC conversion lower half; two camera FPCs upper.
- **Major components / architecture:** Tablet SoC, two RAM packages, flash, SD card, wireless, USB-C, LCD/touch, front/rear cameras and PMIC.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** MicroSD card detect stuck; flex latch damage; battery fuel-gauge error; touch-rail noise; charging connector shear.
- **Diagnostic / completion tests:** SD, both cameras, USB, wireless, graphics and charge tests.
- **Special constraints / gameplay:** Base model for numbered tablets.

#### Pandroid Slate 10 — Performance — T4

- **PCB size:** **L** (relative only; no measurements).
- **PCB shape:** Long rectangle with offset socket notch.
- **Component density:** **Very Dense**.
- **Physical layout / placement:** Extra RAM positions surround SoC; power stage with larger inductor row; SD and USB on opposite ends; dense touchscreen/display connectors across top.
- **Major components / architecture:** Upgraded tablet SoC, 3–4 RAM packages, storage, SD, PMIC, USB-C, Wi-Fi, display and speaker drivers.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Buck inductor cracked; DDR rail unstable; SD differential line open; panel power short; charging thermistor mismatch.
- **Diagnostic / completion tests:** Large-panel power, memory stress, SD, charge and speakers.
- **Special constraints / gameplay:** Higher RAM density than base Slate.

#### Pandroid Slate 12 — Creative — T4

- **PCB size:** **XL** (relative only; no measurements).
- **PCB shape:** Wide L-shaped PCB for camera clearance.
- **Component density:** **Extreme**.
- **Physical layout / placement:** SoC/RAM cluster center; digitizer input and display connectors along long edge; audio near corners; SD/USB-C and power stages isolated on short leg.
- **Major components / architecture:** High-end SoC, RAM array, flash, pen digitizer controller, LCD/touch, SD slot, USB-C, wireless, cameras and multi-amp audio.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Digitizer pen misses zones; USB-C ESD rail short; RAM cold joint; under-shield corrosion; failed display backlight driver.
- **Diagnostic / completion tests:** Pen-grid diagnostic, graphics, camera and multichannel audio, SD and power cycle.
- **Special constraints / gameplay:** Adds stylus/digitizer to standard features.

#### Pandroid Slate 14 — Oversized Flagship — T5

- **PCB size:** **XXL** (relative only; no measurements).
- **PCB shape:** Broad irregular outline with extra ribbon protrusions.
- **Component density:** **Extreme**.
- **Physical layout / placement:** Large RAM array and PMIC bank around SoC; multiple display and touch FPCs across long edge; SD and accessory connectors at sides; dual charging paths.
- **Major components / architecture:** Flagship SoC, highest RAM count, storage, SD, dual USB-C path emulator, large display supplies, cameras, wireless and quad audio.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** One RAM supply collapses under load; ribbon clip cracked; charge-port current path failure; swollen battery sensor connector; SD controller supply missing.
- **Diagnostic / completion tests:** High-load RAM and screen stress, SD, charging on selected port, cameras and wireless.
- **Special constraints / gameplay:** Size refers to PCB footprint, not screen inches.

### Legacy Phones (3 repairable PCBs)

#### Flipper Pro — Classic Clamshell Mobile Phone — T2

- **PCB size:** **S** (relative only; no measurements).
- **PCB shape:** Narrow hinged rectangle with fold-axis notch.
- **Component density:** **Moderate**.
- **Physical layout / placement:** Keypad matrix and modest baseband/PMIC mainboard lower; small LCD flex and earpiece connectors at hinge; Mini-USB/charging at foot.
- **Major components / architecture:** Legacy cellular baseband emulator, small LCD, keypad dome switches, antenna, removable cell, Mini-USB charge, audio codec and battery circuit.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Hinge ribbon split; Mini-USB jack torn; oxidized charging contacts; dead battery; earpiece speaker open; water damage.
- **Diagnostic / completion tests:** Flip-open/close sensor, display, keypad/dial simulation, earpiece/mic and charging.
- **Special constraints / gameplay:** No smartphone-class memory density.

#### Boomer49 — 1990s Cordless Handset PCB — T2

- **PCB size:** **M** (relative only; no measurements).
- **PCB shape:** Long rounded rectangle with antenna tongue.
- **Component density:** **Sparse**.
- **Physical layout / placement:** Through-hole keypad grid dominates front; RF module top; microphone/earpiece connections at ends; NiCd-style battery terminals lower.
- **Major components / architecture:** Legacy analog RF module, encoder/decoder, through-hole resistors/caps, keypad, low-power audio amplifier, charging contacts and battery.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Leaking NiCd pack corrosion; failing electrolytics; broken antenna wire; oxidized charge pads; worn keypad; cracked RF shield solder.
- **Diagnostic / completion tests:** Handset transmit/receive audio with paired base, keypad, battery drain and charging.
- **Special constraints / gameplay:** Vintage THT repair techniques.

#### Boomer49 — Cordless Base/Charging Station PCB — T2

- **PCB size:** **L** (relative only; no measurements).
- **PCB shape:** Broad rectangle with antenna corner.
- **Component density:** **Low**.
- **Physical layout / placement:** Phone-line interface and ring/protection by rear RJ jack; charging cradle pads at front; RF daughter-module socket at side; through-hole PSU central.
- **Major components / architecture:** Line-interface simulator, RF base transceiver, charge regulator, transformer, through-hole electrolytics, cradle contacts and relay.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Corroded spring cradle contacts; dead charge regulator; failed line-protection resistor; dried filter electrolytic; detached antenna mount.
- **Diagnostic / completion tests:** Simulated call/link and audio, cradle-charge current, ring and line status.
- **Special constraints / gameplay:** No direct public telephone network service required.

## E. Original Exotic Electronics
*24 separate serviceable PCB entries across 7 device families.*

### Fessna Crytation 12 — JEFFA Avionics (4 repairable PCBs)

#### Fessna Crytation 12 — Flight Display Interface Card — T5

- **PCB size:** **L** (relative only; no measurements).
- **PCB shape:** Long rectangle with asymmetrical keyed rear edge.
- **Component density:** **Very Dense**.
- **Physical layout / placement:** LCD/video output and LVDS-style connectors grouped at top; processor/RAM center under shielding; three regulators and clock generator at base; coating over all non-mating areas.
- **Major components / architecture:** Graphics/display interface MCU, RAM, display bridge, clock oscillator, DC-DC converters, protected digital I/O and rugged connectors.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Cracked display interface solder; 1.8 V rail short; intermittent oscillator; bad memory-enable pull-up; corrosion at coated edge connector.
- **Diagnostic / completion tests:** Simulated cockpit display image, known test pattern, rail/clock stability, connector flex and checksum.
- **Special constraints / gameplay:** JEFFA game certification; approved/traceable parts; remove and restore coating; controlled heat; clean all flux; paid certification, mandatory rush service and overnight shipping.

#### Fessna Crytation 12 — Engine Sensor Interface — T5

- **PCB size:** **M** (relative only; no measurements).
- **PCB shape:** Tapered rectangle with twin connector shoulders.
- **Component density:** **Dense**.
- **Physical layout / placement:** Precision ADC channels arranged in repeated vertical stripes; reference/regulators enclosed in low-noise island; MCU and serial bus near aft edge.
- **Major components / architecture:** Multi-channel sensor conditioning, ADCs, precision voltage reference, fault-tolerant MCU, transient protection and sealed connectors.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Drifted ADC reference; failed input protection after surge; open sensor excitation trace; cracked channel filter capacitor; intermittent sealed connector pin.
- **Diagnostic / completion tests:** Known-value sensor simulator, channel linearity, noise and range checks, self-test/communication.
- **Special constraints / gameplay:** JEFFA game certification; coating removal/reapplication, controlled heat history, traceable parts, flux-free inspection, paid certification, rush and overnight.

#### Fessna Crytation 12 — Cabin Climate/Pressurization Monitor — T4

- **PCB size:** **L** (relative only; no measurements).
- **PCB shape:** Wide rounded rectangle with cutout along connector side.
- **Component density:** **Moderate**.
- **Physical layout / placement:** Fan/valve relay drivers and external sensors on left; isolated supply middle; MCU, diagnostic LEDs and event flash on right; accessible test pads.
- **Major components / architecture:** MCU, pressure/temperature sensor conditioners, relays/MOSFETs, EEPROM, supervisory IC, connectors and protected regulators.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Welded output relay; supply ripple; pressure-sense input drift; moisture near edge seal; oxidized connector.
- **Diagnostic / completion tests:** Benchtop HVAC pressure/temperature simulator, output relay timing and alarm event logging.
- **Special constraints / gameplay:** JEFFA game certification and fully documented coating/cleaning; high parts cost; paid certification, rush and overnight.

#### Fessna Crytation 12 — Communications/Audio Integration — T5

- **PCB size:** **M** (relative only; no measurements).
- **PCB shape:** Stepped rectangular board with RF shield lip.
- **Component density:** **Very Dense**.
- **Physical layout / placement:** Audio codec and isolators to left, communications transceiver section within removable shield at top, MCU and power island to right; coax/jack connectors on narrow face.
- **Major components / architecture:** Audio codec, op-amps, digital communication transceivers, MCU, regulators, RF reference clock and EMI filters.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Open shield ground bond; noisy op-amp; failed codec 3.3 V LDO; damaged connector ferrite; reference oscillator failure.
- **Diagnostic / completion tests:** Generic radio/audio loopback, isolation check, signal-to-noise and communications self-test.
- **Special constraints / gameplay:** JEFFA game certification; traceable stock and clean-room-style QA, recoat; paid certification, mandatory rush and overnight.

### Eagle 2000 JetAir — JEFFA Avionics (4 repairable PCBs)

#### Eagle 2000 JetAir — Primary Flight Computer I/O — T5

- **PCB size:** **XL** (relative only; no measurements).
- **PCB shape:** Stepped square with backplane cutaway.
- **Component density:** **Extreme**.
- **Physical layout / placement:** Dense central processor/FPGAlike region; redundant interface lanes down both sides; independent power regulators in two corners; shielding and conformal coating.
- **Major components / architecture:** Redundant supervisory processors, FPGA-style glue logic, RAM, flash, watchdogs, backplane connectors and protected sensor buses.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** One failed redundant supply; marginal boot flash; bad watchdog oscillator; cracked backplane pin; local short in fine-pitch IC.
- **Diagnostic / completion tests:** Twin-supply power map, boot checks, redundant channel comparison, simulated I/O and full QA record.
- **Special constraints / gameplay:** JEFFA game certification; controlled rework/cleaning/coating; certified replacement parts; paid cert, rush and overnight.

#### Eagle 2000 JetAir — Power Distribution Controller — T5

- **PCB size:** **L** (relative only; no measurements).
- **PCB shape:** Long stepped polygon with output-connector flange.
- **Component density:** **Dense**.
- **Physical layout / placement:** Protected output stages aligned on long edge; shunts and gate drivers between connectors and MCU; isolated telemetry near board rear.
- **Major components / architecture:** DC power conditioning, current sensing, electronic switches, protection comparators, MCU and telemetry transceivers.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Shorted high-side switch; wrong current sense from cracked shunt; protection latch stuck; corroded output header; regulator brownout.
- **Diagnostic / completion tests:** Low-voltage distribution load emulator, overload trip, rail sequencing, fault reporting.
- **Special constraints / gameplay:** JEFFA certified process, coat removal/reapplication, part traceability, flux removal; rush and overnight always.

#### Eagle 2000 JetAir — Navigation Sensor Aggregator — T5

- **PCB size:** **M** (relative only; no measurements).
- **PCB shape:** Hexagonal card with three edge key slots.
- **Component density:** **Very Dense**.
- **Physical layout / placement:** Sensor interfaces radiate from three connector edges; precision reference/ADC at center; MCU and communications cluster on opposite face; small BGA sensor bridge.
- **Major components / architecture:** Precision ADCs, analog multiplexer, reference, MCU, bus transceivers, data storage and shielding.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Intermittent sensor reference; filter capacitor microcrack; bridge ASIC rail absent; damaged clock crystal; board-to-board socket oxidation.
- **Diagnostic / completion tests:** Sensor-input emulator, cross-channel comparison, reference/clock and packet integrity tests.
- **Special constraints / gameplay:** JEFFA certification; thermal process constraints, flux inspection and recoat; rush/overnight.

#### Eagle 2000 JetAir — Cabin Entertainment/Services Hub — T4

- **PCB size:** **XL** (relative only; no measurements).
- **PCB shape:** Flat U-shaped PCB with daughtercard recess.
- **Component density:** **Dense**.
- **Physical layout / placement:** Entertainment/audio controllers on front-facing edge; USB and seat data interfaces around U; power conversion and central MCU at bottom; many modular connectors.
- **Major components / architecture:** MCU, USB hubs, audio amp, Ethernet-style interface, power switch ICs, flash and small daughterboard header.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Burned USB output switch; torn data connector; shorted codec supply; bad input inrush cap; corroded service port.
- **Diagnostic / completion tests:** Device enumeration, cabin I/O simulator, audio playback and overload protection tests.
- **Special constraints / gameplay:** JEFFA game certification for avionics-grade customer contract; approved parts, recoat and traceable QC; rush/overnight.

### USN F28 T-Rex — Mil-Spec Avionics (6 repairable PCBs)

#### USN F28 T-Rex — Mission Power Interface — T5

- **PCB size:** **XL** (relative only; no measurements).
- **PCB shape:** Shielded double-width rectangle with scalloped mounting tabs.
- **Component density:** **Very Dense**.
- **Physical layout / placement:** Redundant protected low-voltage power inputs on left; power FET/monitoring stages across upper edge; clock/MCU logic and output connectors on right.
- **Major components / architecture:** Power sequencers, redundancy supervisors, e-fuses, sense resistors, MCU, data interfaces and rugged connectors.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Dual-rail supervisory mismatch; damaged load switch; shorted transient capacitor; cracked sealed socket; incorrect reset release.
- **Diagnostic / completion tests:** Low-voltage emulator only: power sequencing, redundancy failover, channel loads and logging.
- **Special constraints / gameplay:** Fictional mil-spec certification; controlled heat, coating grind/solvent removal and restoration; approved parts, no flux residue; mandatory rush and overnight.

#### USN F28 T-Rex — Rugged Flight Display Controller — T5

- **PCB size:** **XL** (relative only; no measurements).
- **PCB shape:** Wide angular polygon with display notch.
- **Component density:** **Extreme**.
- **Physical layout / placement:** Two graphics/data processing packages under separate shields; dense RAM/flash bank midline; video output connectors and power stages at edge.
- **Major components / architecture:** FPGAlike display processing, RAM, flash, regulator stages, display serializers, watchdog and interface transceivers.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** One processor core rail short; LCD serializer supply loss; thermal crack at shield edge; memory line open; bad oscillator.
- **Diagnostic / completion tests:** Simulated display patterns, high-frequency clock, voltage/ripple and redundancy checks.
- **Special constraints / gameplay:** Mil-spec game certification; coating and thermal audit; certified parts, rush/overnight; no tactical display functionality details.

#### USN F28 T-Rex — Environmental Sensor Acquisition — T5

- **PCB size:** **L** (relative only; no measurements).
- **PCB shape:** Narrow octagonal panel with opposite connector tabs.
- **Component density:** **Dense**.
- **Physical layout / placement:** Repeating precision analog channels flank central MCU; ADC/reference island away from DC-DC supply; coated sensor connector row along both long sides.
- **Major components / architecture:** Instrumentation amplifiers, filter networks, ADCs, reference IC, MCU, isolated data link and regulators.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Out-of-range reference; ESD input leakage; fractured precision resistor; bad channel multiplexer; coating delamination with trapped moisture.
- **Diagnostic / completion tests:** Generic airframe environmental sensor test fixture, acquisition consistency and interface check.
- **Special constraints / gameplay:** Mil-spec game certification, special stock/heat limits, complete cleaning and conformal restoration; rush/overnight.

#### USN F28 T-Rex — Communication Interface Rack Card — T5

- **PCB size:** **XXL** (relative only; no measurements).
- **PCB shape:** Long rack-length rectangle with double backplane fingers.
- **Component density:** **Very Dense**.
- **Physical layout / placement:** Data serializers and transceiver banks on long top edge; clock distribution spine central; multiple DC-DC and galvanic isolation islands along bottom.
- **Major components / architecture:** High-speed digital interface transceivers, MCU, clock buffers, RAM, isolated supplies and rugged backplane connectors.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Reference clock dropout; bus transceiver short; open backplane contact; fractured filter inductor; regulator instability under traffic.
- **Diagnostic / completion tests:** Bench packet loopback, clock/supply diagnostics and interconnect verification with generic test vectors.
- **Special constraints / gameplay:** No real tactical frequencies, cryptography or operational parameters; mil-spec game service process, rush/overnight.

#### USN F28 T-Rex — Recorder and Diagnostics Module — T5

- **PCB size:** **M** (relative only; no measurements).
- **PCB shape:** Stepped rectangle with removable memory bay.
- **Component density:** **Very Dense**.
- **Physical layout / placement:** Memory/BGA modules centered; logging processor at rear; power-loss hold-up caps and rugged connector by edge; many silkscreened test points.
- **Major components / architecture:** MCU, nonvolatile storage, RAM, supervisory IC, capacitor energy-hold circuit, bus link and clock.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Open memory-enable trace; bad write-protect line; dried hold-up capacitor; corrupted firmware; cracked card socket.
- **Diagnostic / completion tests:** Known-data record/playback, checksum, write endurance simulation, interruption recovery.
- **Special constraints / gameplay:** Mil-spec game certification and traceable media; recoat, thermal audit and flux-free inspection; rush/overnight.

#### USN F28 T-Rex — Cooling and Auxiliary Power Control — T4

- **PCB size:** **L** (relative only; no measurements).
- **PCB shape:** Irregular five-sided board with fan headers all around.
- **Component density:** **Moderate**.
- **Physical layout / placement:** Fan-driver stages around perimeter; thermistor channels/MCU centered; auxiliary protected power connectors clustered under heatsink lip.
- **Major components / architecture:** Thermistors, fan PWM controllers, tach feedback buffers, relay/solid-state outputs, MCU, EEPROM and input protection.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Fan PWM MOSFET short; missing tach pull-up; corroded service connector; thermistor divider drift; cracked supply capacitor.
- **Diagnostic / completion tests:** Fictional fan-bank and sensor emulator, fault response and auxiliary rail overload tests.
- **Special constraints / gameplay:** Mil-spec game certification, coat restoration, approved parts and clean inspection; rush/overnight.

### Scamborgeenee Chadventor — Premium Automotive (3 repairable PCBs)

#### Scamborgeenee Chadventor — ECM — T5

- **PCB size:** **XL** (relative only; no measurements).
- **PCB shape:** Sharp-edged trapezoid with extended apex connector.
- **Component density:** **Extreme**.
- **Physical layout / placement:** High-pin-count MCU and flash centrally; injector/actuator driver banks along broad edge; CAN and sensors on narrower edge; shielded analog island, large pad grid and premium gold-finish accents.
- **Major components / architecture:** Automotive MCU, EEPROM/flash, analog sensor conditioning, CAN transceiver, power FET/driver sections, protected buck converters and diagnostics header.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Corroded conformal edge; failed actuator driver; noisy sensor reference; CAN transceiver short; regulator brownout; socket hairline fracture.
- **Diagnostic / completion tests:** CAN diagnostic pad, safe powertrain signal simulator, commanded outputs, error memory and firmware checksum.
- **Special constraints / gameplay:** Premium parts; gold-finished test pads rather than physically gold-plated solder; coating restoration, Premium + Pretentious Customer Fee.

#### Scamborgeenee Chadventor — TCM — T5

- **PCB size:** **L** (relative only; no measurements).
- **PCB shape:** Offset rhombus/parallelogram with angled harness side.
- **Component density:** **Very Dense**.
- **Physical layout / placement:** Driver transistors/solenoid outputs along diagonal connector edge; MCU/RAM central; sensor ADC and CAN network separated by guard zone; dense test pad strip.
- **Major components / architecture:** TCM MCU, valve-driver ICs, current sensing, speed sensor filters, CAN transceiver, flash and converters.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Failed solenoid driver; open current shunt; speed input filter damaged; CAN termination damage; moisture by harness seal.
- **Diagnostic / completion tests:** CAN diagnostics, simulated shift/solenoid load, speed-sensor signals, calibration reset and error-code clearing.
- **Special constraints / gameplay:** Costly approved parts; premium gold finish, conformal restoration and Pretentious Customer Fee.

#### Scamborgeenee Chadventor — BCM — T4

- **PCB size:** **XL** (relative only; no measurements).
- **PCB shape:** Broad trapezoid with one rounded lower corner.
- **Component density:** **Dense**.
- **Physical layout / placement:** Multiple low-current lighting/body drivers line wide connector edge; MCU/flash central; CAN plus input protection section opposite; multiple factory test pads.
- **Major components / architecture:** Body MCU, protected output switches, lamp/lock motors simulators, CAN, EEPROM, regulators and 12 V input protection.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Stuck door-lock output; failed lighting high-side switch; corroded CAN connector; shorted LED driver; cracked mounting-tab trace.
- **Diagnostic / completion tests:** CAN diagnostic pad, light/lock/sensor command simulation, firmware reset and current-limit verification.
- **Special constraints / gameplay:** Premium payout plus Pretentious Customer Fee; coating/traceability.

### MeHari F69 — Premium Automotive (3 repairable PCBs)

#### MeHari F69 — ECU — T5

- **PCB size:** **XL** (relative only; no measurements).
- **PCB shape:** Asymmetric wedge with sloped port flange.
- **Component density:** **Extreme**.
- **Physical layout / placement:** MCU and BGA-like flash in dense middle; engine-control driver zone following angled edge; separated analog sensors/communication and fine-pitch diagnostic pads.
- **Major components / architecture:** Automotive MCU, flash/RAM, analog ADCs, driver ICs, 12 V regulator, CAN transceiver and protection.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Power reference drift; damaged driver transistor; corrupted flash; coated via corrosion; cracked diagnostic header; CAN bus latch.
- **Diagnostic / completion tests:** CAN diagnostic pad, safe sensor emulator, actuator I/O, boot and coding checksum tests.
- **Special constraints / gameplay:** Expensive certified-style parts and gold-finished test pads; coating service and Pretentious Customer Fee.

#### MeHari F69 — TCM — T5

- **PCB size:** **L** (relative only; no measurements).
- **PCB shape:** Irregular boomerang/polygon shape.
- **Component density:** **Very Dense**.
- **Physical layout / placement:** Connector pads sweep across concave side; control MCU near inner bend; output drivers along outer edge; precision sense island separated from switching noise.
- **Major components / architecture:** TCM control MCU, transmission solenoid drivers, current sense amps, temperature/speed inputs, flash, CAN and voltage regulation.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Solenoid output driver short; current sense offset; lost CAN wake line; cold solder on harness pin; flash boot error.
- **Diagnostic / completion tests:** Shift sequencing emulator, CAN scan, per-channel current measurement, firmware default restore.
- **Special constraints / gameplay:** Premium and Pretentious Customer Fee, coated board, approved expensive parts.

#### MeHari F69 — Body Control Module — T4

- **PCB size:** **XL** (relative only; no measurements).
- **PCB shape:** Angular diamond with clipped vertices.
- **Component density:** **Dense**.
- **Physical layout / placement:** Body output FETs in grouped banks around edges; MCU/EEPROM center; CAN and power protection adjacent to two harness connector banks; dense labeled TP matrix.
- **Major components / architecture:** Body MCU, CAN transceiver, protected lighting/locking outputs, input sense filters, EEPROM and transient suppression.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Failed lamp driver; intermittent harness crimp; shorted ESD array; standby battery drain; water corrosion in connector bay.
- **Diagnostic / completion tests:** CAN pad, hazard/door/window control simulation, standby draw and reset-to-default test.
- **Special constraints / gameplay:** Premium parts, coating restoration and Pretentious Customer Fee.

### D Wagon Flex — Premium Automotive (3 repairable PCBs)

#### D Wagon Flex — Circular ECM — T5

- **PCB size:** **L** (relative only; no measurements).
- **PCB shape:** True circular board with three mounting notches.
- **Component density:** **Extreme**.
- **Physical layout / placement:** Central MCU/BGA surrounded by concentric sensor and driver sectors; radial test-point ring; protected CAN/power on outer arc; heavy connector arcs on two sides.
- **Major components / architecture:** Powertrain MCU, analog interfaces, CAN, flash, multiple regulated rails, driver ICs, current sensors and radial harness connectors.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Radial trace crack near mounting notch; CAN output low; driver supply short; failed sense reference; moisture under perimeter coating.
- **Diagnostic / completion tests:** CAN diagnostic pad, power/actuator signal fixture, voltage/clock rings and firmware restore.
- **Special constraints / gameplay:** Circular form factor required; premium gold pad finish, coating, high-cost parts and Pretentious Customer Fee.

#### D Wagon Flex — Circular TCM — T5

- **PCB size:** **M** (relative only; no measurements).
- **PCB shape:** Compact circular ring with center mechanical opening.
- **Component density:** **Very Dense**.
- **Physical layout / placement:** Solenoid drivers spaced evenly around rim; MCU at upper arc, CAN diagnostics at lower arc; test pads on inner annular edge; reinforced radial connectors.
- **Major components / architecture:** MCU, solenoid FET bank, current shunt amps, speed sensors, CAN and protected power stages.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** One solenoid FET stuck; fractured radial connector pad; lost speed signal due to open trace; current feedback fault; CAN transceiver dead.
- **Diagnostic / completion tests:** CAN pad, commanded shift outputs, current test and simulated sensor response.
- **Special constraints / gameplay:** Circular annular geometry, coating, premium payout and Pretentious Customer Fee.

#### D Wagon Flex — Circular BCM — T4

- **PCB size:** **L** (relative only; no measurements).
- **PCB shape:** Circular disc with three rectangular connector cutouts.
- **Component density:** **Dense**.
- **Physical layout / placement:** Body-output power switch banks arrayed like clock sectors; ECU communications core at center; LED/relay sense channels outer rim; service test ring.
- **Major components / architecture:** Body MCU, flash, CAN, MOSFET power switches, regulator and sensor inputs, status LEDs and interface connectors.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Damaged outer connector; one high-side switch fails; moisture tracking across test ring; failed standby regulator; bad button-input RC network.
- **Diagnostic / completion tests:** CAN pad, body functions and standby power, firmware reset.
- **Special constraints / gameplay:** Circular PCB mandated; gold-finish look and Pretentious Customer Fee.

### Zeeya Spirit — Economy Automotive (1 repairable PCB)

#### Zeeya Spirit — Combined ECM/TCM Unimodule — T3

- **PCB size:** **M** (relative only; no measurements).
- **PCB shape:** Simple square with four mounting holes.
- **Component density:** **Moderate**.
- **Physical layout / placement:** One MCU and flash center; small paired power/analog driver regions left/right; single CAN/diagnostic socket at bottom; minimal test points and no coating.
- **Major components / architecture:** Automotive MCU, basic flash, small set of sensor inputs, few driver ICs, CAN transceiver, power regulators and connectors.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Cracked connector solder; failed regulator cap; open actuator drive transistor; shorted CAN suppressor; flash corruption.
- **Diagnostic / completion tests:** CAN diagnostic pad, combined simplified engine/transmission controller test, firmware restore and sensor/actuator emulator.
- **Special constraints / gameplay:** Cheap parts, routine turnaround, no coating, ordinary customer fee.

## Implementation acceptance checklist

- [ ] A database entry exists for **each individually repairable board** in this document, with correct category/family/model and board-specific geometry.
- [ ] Every entry has one of the six relative PCB size classifications; no explicit physical measurements introduced.
- [ ] Every entry has a unique physical layout and accurate component and connector population.
- [ ] Every board contains the literal `Existing Faults from Fault Catalog` instruction in its own fault inheritance metadata.
- [ ] Fault candidates from the new expansion and existing catalog are inherited selectively based on actual simulated components.
- [ ] Multi-variant products differ mechanically and electrically, not just via model string or color.
- [ ] All faults produce matching measured electrical behavior and customer symptom descriptions; repairs restore real functionality.
- [ ] The Cry-Away pair and Boomer49 handset/base support two-board fault localization; Game Orb has an independently testable optical-disc subsystem.
- [ ] TV PSU failure is distinguished from external failed backlight strings and TV logic-board symptoms.
- [ ] Fob/garage RF and remote IR testing use correct, distinct instruments/protocol simulations; no security bypass.
- [ ] Conformal coat removal/cleanup/reattachment is required when appropriate, with special aircraft/military certification, rush and overnight requirements.
- [ ] Automotive CAN diagnostic pad behavior depends on current rail, transceiver, sensor and firmware state; it does not auto-solve issues.
- [ ] All original user-provided names and approved parodies are preserved; this is not a replacement for the other 58-entry expansion.

## Technical grounding and fictionalization notes

DVD repair cases include real-world common mechanical and optical faults (tray, spindle motor, sled, pickup, ribbon and dirty lens) as well as board-level power, video and audio faults. TV SMPS cases include standby failures, bulged/dried capacitors and backlight-driver behavior, and explicitly distinguish failed LED strips from a failed power supply. Reference reading: [iFixit optical drive troubleshooting](https://www.ifixit.com/Wiki/Optical_Disc_Troubleshooting), [iFixit Samsung DVD troubleshooting](https://www.ifixit.com/Wiki/Samsung_DVD-P230_Troubleshooting), [iFixit TV power troubleshooting](https://www.ifixit.com/Troubleshooting/Television/TV%2BWill%2BNot%2BTurn%2BOn/489001), [iFixit TV backlight troubleshooting](https://www.ifixit.com/Wiki/TV_Backlight_Issue).

The portrayed aviation approvals, components and model names are **fictional game mechanics**. This is an entertainment asset specification, not a technical service manual for actual aircraft, military platforms, vehicles or mains equipment.
