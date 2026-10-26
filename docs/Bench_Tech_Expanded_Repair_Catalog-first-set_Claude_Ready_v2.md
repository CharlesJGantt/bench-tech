# Bench Tech — New Electronics Repair Catalog Expansion

**Purpose:** Claude/Bench Tech implementation handoff. These are additions to the game's existing electronics library and fault engine, NOT a replacement for existing devices, parts, electronics simulation, procedures, or faults.

## Mandatory implementation rule

**EVERY device and EVERY individually repairable board below must receive the exact inheritance flag:**

`Existing Faults from Fault Catalog`

**Also apply this inheritance rule to every device and variant in the user's already-provided Bench Tech additions**, including Bluetooth speakers, household electronics, appliances, PC motherboards, consumer remotes, key fobs, gaming devices/consoles, phones/tablets, aircraft boards, high-end automotive modules and their subassemblies. Their previously documented detailed faults remain supplemental to the existing catalog. All new devices below use the same rule.

Merge existing applicable faults with each new device-specific fault pool. Never interpret device-specific suggestions as an exhaustive list or replace Claude's existing fault database. Choose plausible existing faults by component population, board technology, exposure, wear and player difficulty. For each case, select one primary root cause by default, optionally a second causally linked issue for advanced jobs; occasional multi-fault challenge jobs are fine. Do not spawn failures in components not present on that specific PCB. Preserve simulated power rails, netlist continuity, test points, measured voltages/currents, state-dependent signals, and the functionality of actual inputs/outputs.

**Difficulty tiers:** T1 Intro, T2 Basic, T3 Intermediate, T4 Advanced, T5 Expert, T6 Legendary. This is separate from estimated payout and manufacturer certification.

### Required PCB size and density taxonomy

These are *relative game asset categories*, **not measurements**. Use the same categories throughout the game, including for the primary board and any separately modeled daughterboards:

| PCB size | Meaning |
|---|---|
| **XS** | Extra Small: miniature board, control button card, charging board, or sensor card |
| **S** | Small: compact handheld, tool controller, or narrow module |
| **M** | Medium: typical standalone electronics controller or mid-size consumer motherboard |
| **L** | Large: full-width appliance-like PCB, substantial controller, or expanded instrument board |
| **XL** | Extra Large: sizable power/control assembly or high-end device motherboard |
| **XXL** | Extra Extra Large: exceptional rack-length, backplane-like, or oversized flagship assembly |

**Population density:** **Sparse** (widely spaced), **Low**, **Moderate**, **Dense**, **Very Dense**, **Extreme** (very tight pitch and crowded both sides). Size and density are independent: a large through-hole board can be sparse; an XS wearable card can be very dense. Describe PCB outline and component placement visually rather than assigning numeric dimensions. **PCB size is the board's game-world footprint, not the product enclosure size.**

**Per-entry presentation contract:** each suggested device below now supplies an explicit **PCB size**, **PCB shape**, **component density**, **layout / placement notes**, components, inherited existing faults, device-specific fault candidates, and diagnostics. Where more than one PCB is actually present, distinguish the board types instead of implying all share the same footprint. Manufacturing process, finish/coating and test-point accessibility are highlighted where they change repair gameplay.

**Important:** All companies, vehicles, certifications, military systems, and secret projects below are fictional. Where designs represent safety-critical or high-energy equipment, use de-energized low-voltage simulated service fixtures and realistic sign-offs, not unsafe live probing of mains, traction batteries, pyrotechnics, or flight-critical systems. The imagined certification mechanics are in-game systems, not claims of real repair authorization. Avoid actual classified specifications. A diagnostic tool should provide component-level symptoms and electrical observations rather than simply reveal the culprit.

## A. Four exotic repair families

### Family EX-01 — USN Poseidon SQS-88 Naval Sonar Array

A fictional ruggedized two-board naval sonar subassembly. Two linked PCB models and one enclosure; external array elements are represented by safe test fixtures. Jobs may involve either board or both. Conformal coating, corrosion-control inspection, sealed connectors, post-repair environmental validation, serialized service records. High payout and expedited return.

### Family EX-02 — USSF Wayfinder Orbital Vehicle

Three interchangeable orbital-platform modules, each independent for diagnostics and repair: power distribution, telemetry, and sensor interface. Fictional 'orbital grade' parts library, high inspection standard, ESD/clean handling, coating restoration, complete simulated acceptance tests.

### Family EX-03 — Project NIGHTGLASS

One deliberately unidentified highly populated PCB with multilayer routing, shields, numerous test points and tightly packed fine-pitch packages. Purpose is left unknown. Player may receive a partial power tree and a symptom log, but no full product manual. Hardest level through trace analysis, rails, heat profiling, controlled rework and QC, not random impossibility.

### Family EX-04 — OuterSpace Y Albatross 11 / GalaxyShip Program

Private space-company parody. Five separate repairable PCBs across two vehicle families. A plausible selection of power conditioning, avionics health monitoring, communications, cabin environmental sensing, and distributed power management. Distinct 3D housings and connectors. Race-against-launch deadlines, urgent couriers, meticulous quality checks, premium parts. No repairs to active explosive/propulsion initiation hardware.

**11 individually repairable board/device entries in this section.**

#### A-01. USN Poseidon SQS-88 — Hydrophone Signal Conditioning Board (T5)

- **PCB size:** **XL** (relative category; no measurements).
- **PCB shape:** Long narrow rectangle with clipped connector-end corners.
- **Component density:** **Dense**.
- **Physical layout / placement:** Eight repeated analog-input channels down one edge; quiet analog area partitioned from ADC/output and regulator area; shield-can footprints and numbered per-channel test pads.
- **Major components / electrical architecture:** Long narrow shielded PCB; analog inputs, protection, low-noise op-amps, instrumentation amplifiers, programmable-gain ICs, anti-alias filters, ADC and differential output.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Water ingress at bulkhead connector, noisy amplifier stage, offset-drift resistor network, damaged filter capacitor, cracked shielding joint.
- **Diagnostic / completion tests:** Signal-injection fixture; measure gain, noise floor, DC offset and ADC samples across channels.
- **Special constraints:** Coated; sealed RF-style can; restricted part selection.

#### A-02. USN Poseidon SQS-88 — Sonar Processing and Interface Board (T5)

- **PCB size:** **XL** (relative category; no measurements).
- **PCB shape:** Wide rectangle with keyed notch and backplane edge.
- **Component density:** **Very Dense**.
- **Physical layout / placement:** FPGA/processor and RAM centered; regulators clustered at power inlet; timing and isolated interface islands; high-density backplane connectors on one edge and shield plates over timing circuits.
- **Major components / electrical architecture:** Dense rectangular multilayer board; MCU, FPGA-like processing package, RAM, flash, clock tree, isolated comms transceivers, multiple DC-DC rails, high-density connectors.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Failed 1.2 V core buck, clock oscillator drift, oxidized backplane connector, interrupted differential data pair, flash integrity fault.
- **Diagnostic / completion tests:** Rail-by-rail startup, clock probing, loopback data capture and paired-board functional check.
- **Special constraints:** Coated; costly fine-pitch work; serialized QA.

#### A-03. USSF Wayfinder — Orbital Power Management Module (T5)

- **PCB size:** **L** (relative category; no measurements).
- **PCB shape:** Stepped rectangle with two mounting ears.
- **Component density:** **Dense**.
- **Physical layout / placement:** Twin mirrored power paths for visual redundancy; wide current-sense tracks, supervisory logic island, e-fuses along outputs and a heavily populated connector edge.
- **Major components / electrical architecture:** Rad-hard-*styled* fictional controller; dual redundant regulators, e-fuse controllers, current shunts, ceramic capacitors, supervisory MCU, connectors, telemetry output.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Regulator undervoltage, failed current-sense amplifier, noisy supervisory reference, intermittently open connector, shorted filter cap.
- **Diagnostic / completion tests:** Isolated low-voltage supply emulator; verify startup sequencing, commanded rails and overcurrent alert.
- **Special constraints:** No energized flight hardware; special approved parts and traceability.

#### A-04. USSF Wayfinder — Telemetry and Communications Module (T5)

- **PCB size:** **M** (relative category; no measurements).
- **PCB shape:** Shielded rectangular card with beveled upper corners.
- **Component density:** **Very Dense**.
- **Physical layout / placement:** RF front end under removable shield at upper edge; processor/clock island centered; interface transceivers, filters and compact power section around opposite edges.
- **Major components / electrical architecture:** Multilayer shielded PCB; processor, digital interface transceivers, RF front-end model, filtering, temperature-compensated reference clock and local regulators.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Drifted reference oscillator, missing RF-enable line, cracked feedthrough connector, failed 3.3 V regulator, noisy power filtering.
- **Diagnostic / completion tests:** Simulated RF link fixture, clock measurement, telemetry packet loopback, rail and impedance checks.
- **Special constraints:** No real operational military communication specifications.

#### A-05. USSF Wayfinder — Attitude Sensor Interface Module (T5)

- **PCB size:** **L** (relative category; no measurements).
- **PCB shape:** Irregular main board with three wing-like sensor-card sockets.
- **Component density:** **Dense**.
- **Physical layout / placement:** Main ADC/reference and MCU zones arranged around three sensor connector blocks; colored labels for redundant data channels; alignment marks for precision sensor mounting.
- **Additional board geometry:** Three **XS** rectangular sensor daughtercards (Very Dense), mounted at distinct orientations, plus the L main board; expose board-specific pads and connector faults.
- **Major components / electrical architecture:** Three small sensor daughtercards plus main board represented as one repair assembly; IMU-style sensors, precision references, ADCs, isolators, MCU, redundant data outputs.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Loose sensor connector, reference-voltage instability, broken sensor supply trace, failed line-driver and drifting input filter.
- **Diagnostic / completion tests:** Sensor stimulus simulator; compare digital samples, references and redundant output channels.
- **Special constraints:** No real spacecraft navigation/control parameters.

#### A-06. Project NIGHTGLASS — Unidentified System Board NX-000 (T6)

- **PCB size:** **XXL** (relative category; no measurements).
- **PCB shape:** Asymmetrical polygon with cutouts, irregular keying and multilayer mounting tabs.
- **Component density:** **Extreme**.
- **Physical layout / placement:** Several BGA/stacked packages form a nearly uninterrupted central region; regulators crammed under shield edges, test pads on both faces, serpentine fine-pitch escape routing and blind sections of the power tree.
- **Major components / electrical architecture:** Unusually dense irregular black 10+ layer *fictional* PCB; multiple BGA packages, stacked-memory-style packages, small regulator islands, fine-pitch logic, oscillators, shields, over 100 labeled test pads.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Buried power-rail short, fractured BGA connection, marginal oscillator, two faults on separate rails, corrosion under RF shield, missing pull-up in boot network.
- **Diagnostic / completion tests:** Thermal camera, current-limited bench supply, microscope, advanced scope, rail map, logic analyzer, stepwise isolation.
- **Special constraints:** No product identity; partial schematic only; optional 2-stage fault; maximum QC and payout.

#### A-07. OuterSpace Y Albatross 11 — Launch Avionics Power Conditioner (T5)

- **PCB size:** **M** (relative category; no measurements).
- **PCB shape:** Rectangular rugged card with clipped corners and large input connector notch.
- **Component density:** **Dense**.
- **Physical layout / placement:** Protection/filter section isolated from DC-DC islands by keep-outs; copper-heavy entry area; sequencer and telemetry MCU along the opposite edge with easy-to-probe rail points.
- **Major components / electrical architecture:** Rugged compact card; wide-input front-end, EMI input filter, protected buck stages, supervisors, current sensing and telemetry MCU.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Shorted switching FET, failed supervisory rail, cracked high-current terminal, filter capacitor leakage.
- **Diagnostic / completion tests:** Current-limited DC bus simulator; ripple, rail ramp and trip checks.
- **Special constraints:** No active propulsion/pyro circuits; flight-doc sign-off.

#### A-08. OuterSpace Y Albatross 11 — Vehicle Health Monitor (T5)

- **PCB size:** **L** (relative category; no measurements).
- **PCB shape:** Tall rectangular card with twin backplane connectors.
- **Component density:** **Very Dense**.
- **Physical layout / placement:** Rows of ADC/multiplexer input channels, precision reference pocket, MCU/memory island and isolation gap separating field I/O from digital backplane; silkscreen test matrix.
- **Major components / electrical architecture:** Dense card with MCU, precision multi-channel ADC, sensor excitation outputs, isolated interfaces, onboard nonvolatile event memory.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Leaky ADC input protection, damaged multiplexer channel, open excitation resistor, broken board-to-board cable header.
- **Diagnostic / completion tests:** Simulated sensor bench; channel-by-channel known-value check and event replay.
- **Special constraints:** Coated and multi-step functional acceptance.

#### A-09. OuterSpace Y Albatross 11 — Range Telemetry Transceiver (T5)

- **PCB size:** **M** (relative category; no measurements).
- **PCB shape:** Narrow rectangle with RF shield tabs and coax cutout.
- **Component density:** **Very Dense**.
- **Physical layout / placement:** Synthesizer and filter sections shielded in separate compartments; oscillator away from switching regulator; coax launch on short edge and digital packet interface opposite.
- **Major components / electrical architecture:** Shielded RF/digital sections; baseband MCU, synthesizer-style components, reference oscillator, analog filtering and low-voltage RF model.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Bad reference oscillator, failed LDO for RF front end, detached coax connector, damaged output-match passive.
- **Diagnostic / completion tests:** RF test enclosure; generic signal and packet-path diagnostic fixture.
- **Special constraints:** Fictional RF parameters only.

#### A-10. OuterSpace Y GalaxyShip — Cabin Environment Controller (T4)

- **PCB size:** **L** (relative category; no measurements).
- **PCB shape:** Elongated rectangle with rounded cable-side corners.
- **Component density:** **Moderate**.
- **Physical layout / placement:** Output FETs/relays and connector banks grouped along bottom; MCU, sensor ADCs and filtered low-voltage supplies above; large readable silkscreen and accessible component leads.
- **Major components / electrical architecture:** Mixed-signal main PCB; MCU, isolated CAN-style interface, sensor inputs, fan drivers, relays, power filtering and keyed connectors.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Moisture-corroded connector, stuck fan MOSFET, drifting temperature-sense divider, failed communications transceiver.
- **Diagnostic / completion tests:** Safe HVAC/sensor simulator; temperature feedback and controlled-output tests.
- **Special constraints:** Coated; lower complexity than avionics.

#### A-11. OuterSpace Y GalaxyShip — Distributed Power Node (T5)

- **PCB size:** **XL** (relative category; no measurements).
- **PCB shape:** Asymmetric broad rectangle with notched power-terminal edge.
- **Component density:** **Dense**.
- **Physical layout / placement:** Protected output channels replicated across wide perimeter; fat power traces, e-fuses and current sensors at each branch; dual supervisor/regulator islands in center.
- **Major components / electrical architecture:** Large irregular PCB; protected low-voltage load switches, redundant regulators, e-fuses, monitors, MCU, output terminal arrays.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Burned output-switch FET, current shunt drift, failed housekeeping regulator, cracked solder on terminal lug, intermittent voltage-sense path.
- **Diagnostic / completion tests:** Safe current-limited loads; channel-by-channel switch and trip tests.
- **Special constraints:** Premium parts and complete documentation.

## B. Electric vehicle electronics — six modules from four parody manufacturers

**Brand families**: Ressla (Tesla parody), VoltzWagen (Volkswagen parody), Riveran (Rivian parody), and Nissin (Nissan parody). These are **six individual modules total** across four brands, not six nearly identical PCBs per manufacturer. Each has its own enclosure, connector geometry and test fixture. EV traction-side cases must be treated as disconnected/isolated on the bench; high-voltage portions are a safe simulation only. Use a fictional vehicle diagnostic tablet with CAN/LIN-like bus messages, DTCs, firmware records and self-tests, not an automatic 'find the fault' button. Include technician isolation verification and module pairing where relevant.

**6 individually repairable board/device entries in this section.**

#### B-01. Ressla Model Why — Battery Management Master Controller (T5)

- **PCB size:** **L** (relative category; no measurements).
- **PCB shape:** Long shallow rectangle with curved end and keyed harness notch.
- **Component density:** **Very Dense**.
- **Physical layout / placement:** Isolated cell-interface connector rows on one side, comms isolation barrier across middle, main MCU and monitor/reference parts on opposite side; many small probe pads.
- **Major components / electrical architecture:** Dense six-layer low-voltage BMS logic PCB; MCU, multiple isolated comms ports, cell-monitor interface, reference, flash, CAN transceiver, balancing command interface, current-sense amplifier.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Failed isolated supply, drifting reference, dead comms transceiver, cracked sense connector, corrupted calibration data.
- **Diagnostic / completion tests:** Isolation-safe cell simulator; check reported cell voltages, temperature readings and DTCs.
- **Special constraints:** Battery remains disconnected; module authorization/pairing step.

#### B-02. Ressla Model Why — Cabin and Body Control Module (T4)

- **PCB size:** **XL** (relative category; no measurements).
- **PCB shape:** Wide trapezoid with stepped connector ridge.
- **Component density:** **Dense**.
- **Physical layout / placement:** Multiple automotive harness plugs on one edge, high-side/low-side switching banks behind them, MCU/flash and comms near the center, heavier output copper near perimeter.
- **Major components / electrical architecture:** Medium-large MCU PCB; protected high-/low-side drivers, relays or solid-state switches, LIN/CAN transceivers, flash, several connectors.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Window output driver FET short, blown low-voltage regulator, water ingress, connector fretting.
- **Diagnostic / completion tests:** Vehicle I/O harness, relay and lamp simulator, diagnostic tablet.
- **Special constraints:** Multiple branch circuits and optional intermittent faults.

#### B-03. VoltzWagen ID.Buzzkill — Onboard Charger Control Board (T5)

- **PCB size:** **M** (relative category; no measurements).
- **PCB shape:** Rectangular daughtercard with isolation-slot cutouts.
- **Component density:** **Very Dense**.
- **Physical layout / placement:** Narrow safe-control side and optically isolated sensing/interface side separated by slots; PWM/controller zone, current monitor area and rows of small headers to simulated power stage.
- **Major components / electrical architecture:** Control daughterboard for separate simulated high-voltage charging power stage; PWM controller, isolated sensing, low-voltage regulation, gate-drive interface, MCU and interlock connectors.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Gate-drive control failure, optoisolator degradation, connector heat damage, missing current-sense reference.
- **Diagnostic / completion tests:** De-energized charger controller emulator; charge-request handshake, enable and protection signal verification.
- **Special constraints:** Do not power live mains or HV power stage on bench.

#### B-04. VoltzWagen ID.Buzzkill — Thermal Management Controller (T3)

- **PCB size:** **L** (relative category; no measurements).
- **PCB shape:** Long rectangle with four rounded corners.
- **Component density:** **Moderate**.
- **Physical layout / placement:** Pump MOSFETs and valve drivers along a heatsink edge; sensor pull-ups and filtering in neat rows, MCU and CAN transceiver toward the central harness connection.
- **Major components / electrical architecture:** Medium automotive PCB; MCU, pump-driver outputs, coolant valve drivers, thermistor networks, CAN and fused supply input.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Corroded coolant-exposed connector, open thermistor input, failed pump MOSFET, cracked current shunt.
- **Diagnostic / completion tests:** Pump/valve and thermistor simulators; observe PWM and temperature feedback.
- **Special constraints:** Entry point to EV work; lower voltage.

#### B-05. Riveran R1Tuff — Motor Inverter Control Board (T5)

- **PCB size:** **L** (relative category; no measurements).
- **PCB shape:** Angular hexagon-like controller with one straight backplane edge.
- **Component density:** **Very Dense**.
- **Physical layout / placement:** DSP/MCU central, six isolated gate-command channels radially arranged, rotor-position input bank at narrow tip, isolated-rail/regulator islands and tight-pitch connectors.
- **Major components / electrical architecture:** Low-voltage logic/control board separate from traction power stage; MCU/DSP, isolated gate-driver control, resolver/Hall interfaces, isolation monitors and CAN.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Missing isolated auxiliary rail, failed gate-driver-interface channel, damaged rotor-sensor input, bad control-board interconnect.
- **Diagnostic / completion tests:** Inverter/rotor emulator; compare commanded and returned drive signals.
- **Special constraints:** Only control PCB on isolated fixture; no real high-voltage work.

#### B-06. Nissin Leaft — DC-DC Converter Control Module (T4)

- **PCB size:** **M** (relative category; no measurements).
- **PCB shape:** Rectangular card with diagonal corner truncations.
- **Component density:** **Dense**.
- **Physical layout / placement:** Gate controller and feedback divider around center; isolation boundary with paired analog feedback circuits; filter capacitors and sealed signal connector on opposing ends.
- **Major components / electrical architecture:** Low-voltage converter control card; controller, feedback references, gate driver, isolated sensing, supervisory logic and sealed connectors.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Open feedback-divider resistor, failed gate driver, dried electrolytic filter capacitor, connector oxidation.
- **Diagnostic / completion tests:** 12 V bus/load simulator; verify regulated output behavior via isolated virtual power stage.
- **Special constraints:** Requires output-load profile and thermal verification.

## C. Cordless tools — eleven controllers with progressive complexity

Use real motor-control patterns: cheapest brushed tools can have a trigger switch/MOSFET and minimal electronics; expensive brushless tools can carry an MCU, 3-phase MOSFET bridge, gate drivers, current shunt, rotor sensors and thermal protection. Do **not** give every drill the same circuit. Add motor-load, trigger-response and battery-pack simulation. Cases must show tool housing, trigger/controls and removable PCBs.

**11 individually repairable board/device entries in this section.**

#### C-01. Haul Freight Warrior 12V Cordless Screwdriver — Trigger PCB (T1)

- **PCB size:** **XS** (relative category; no measurements).
- **PCB shape:** Stubby narrow rectangle tailored to trigger housing.
- **Component density:** **Sparse**.
- **Physical layout / placement:** Large switch/trigger lands, a single conspicuous motor MOSFET, diode and LED near nose, broad solder terminals at battery end; mostly visible serviceable pads.
- **Major components / electrical architecture:** Tiny single-sided PCB; variable trigger input, brushed motor MOSFET, flyback diode, 1–2 LED indicators, battery contact tabs.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Burned switch contact, failed MOSFET, cracked battery tab, open trigger potentiometer.
- **Diagnostic / completion tests:** Bench supply and small brushed-motor dummy load; trigger-to-PWM response.
- **Special constraints:** Beginner-friendly, visible parts.

#### C-02. Ryoban OneMore 18V Brushed Drill — Speed Controller (T2)

- **PCB size:** **S** (relative category; no measurements).
- **PCB shape:** Elongated paddle-shaped rectangle.
- **Component density:** **Low**.
- **Physical layout / placement:** Trigger potentiometer and reversing switch connect at one end; discrete PWM/MOSFET components spaced along body and power tabs at opposite end; mixed THT and SMD.
- **Major components / electrical architecture:** Small mixed THT/SMD board; PWM generator, MOSFET, reverse switch, current-protection element, worklight LED.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Overheated MOSFET solder pad, failed trigger track, broken direction switch, cracked solder at terminals.
- **Diagnostic / completion tests:** Variable trigger simulation, output current, direction and LED tests.
- **Special constraints:** No 3-phase bridge on brushed model.

#### C-03. Feewalt 20V Brushless Drill — BLDC Control Board (T3)

- **PCB size:** **S** (relative category; no measurements).
- **PCB shape:** Rounded triangle with three motor-lead corners.
- **Component density:** **Dense**.
- **Physical layout / placement:** Six MOSFETs grouped into three half-bridge pairs against cooling edge; MCU/gate driver centered; Hall sensor, NTC, trigger and LED connector at vertices.
- **Major components / electrical architecture:** Triangular controller; MCU, six power MOSFETs, 3-phase gate driver, Hall inputs, shunt, NTC, LED circuit.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Shorted half-bridge MOSFET, open Hall connector, overheating solder joint, bad regulator.
- **Diagnostic / completion tests:** 3-phase motor emulator, current and hall sequence checks.
- **Special constraints:** Current-limited startup.

#### C-04. Makyta XDT-99 Impact Driver — Controller (T3)

- **PCB size:** **S** (relative category; no measurements).
- **PCB shape:** Round disk with two flattened connector edges.
- **Component density:** **Dense**.
- **Physical layout / placement:** Three-phase power section wraps perimeter near motor; MCU and gate driver near center; mode-switch pads and current-sense parts grouped behind trigger connector.
- **Major components / electrical architecture:** Compact circular board; MCU, MOSFET inverter, gate drivers, impact-mode selector, speed feedback.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Damaged high-side driver, selector switch contact damage, current shunt drift.
- **Diagnostic / completion tests:** Simulated impact load pulses; commanded speed/current response.
- **Special constraints:** High peak-load fault profiles.

#### C-05. StillWockee Fuelish Impact Wrench — Torque Logic PCB (T4)

- **PCB size:** **M** (relative category; no measurements).
- **PCB shape:** Wide irregular polygon with broad heat-spreader edge.
- **Component density:** **Very Dense**.
- **Physical layout / placement:** Six large MOSFET footprints and substantial bus copper spread across one side; dense MCU/gate driver/measurement cluster at other, heavy battery terminals and mode-button PCB pads.
- **Major components / electrical architecture:** High-current thick-copper board; 3-phase bridge, MCU, gate-drive IC, current shunt, NTC, mode-select buttons, connector.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** MOSFET overheating, thermistor open, board warp cracked via, trigger connector intermittent.
- **Diagnostic / completion tests:** Torque emulator; log overcurrent and temperature flags.
- **Special constraints:** Difficult heat-dissipation diagnosis.

#### C-06. Ridgebit 18V Oscillating Multi-tool — Drive PCB (T3)

- **PCB size:** **S** (relative category; no measurements).
- **PCB shape:** Long slim strip with angled end.
- **Component density:** **Dense**.
- **Physical layout / placement:** Power-switching components at motor-facing tip; fine-pitch speed encoder and controller near thumb dial; mounting slots and vibration-prone connectors at two ends.
- **Major components / electrical architecture:** Long slender board; BLDC controller, mode dial, speed sensor, gate driver, power stage.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Broken mode encoder, capacitor fracture due vibration, phase MOSFET open, dry solder on motor lead.
- **Diagnostic / completion tests:** Frequency/speed control across multiple load profiles.
- **Special constraints:** Vibration exposure.

#### C-07. Feewalt 60V Flex Saw — Circular Saw Controller (T4)

- **PCB size:** **L** (relative category; no measurements).
- **PCB shape:** Trapezoid with one long reinforced terminal edge.
- **Component density:** **Moderate**.
- **Physical layout / placement:** Oversized switching footprints on heat-sink side, substantial current shunts and board-to-motor connections; smaller interlock/braking/logic cluster opposite, strong isolation between areas.
- **Major components / electrical architecture:** Large high-current board; reinforced copper bus, BLDC bridge, safe-disconnect switch, electronic brake, MCU and thermistors.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Failed brake path, shorted power stage, thermal damage on terminal, missing interlock signal.
- **Diagnostic / completion tests:** Blade-inertia motor/braking emulator, safe stop verification.
- **Special constraints:** Battery disconnected before handling.

#### C-08. Haul Freight Herplease Reciprocating Saw — Control Board (T2)

- **PCB size:** **S** (relative category; no measurements).
- **PCB shape:** Long narrow curved-edge rectangle.
- **Component density:** **Low**.
- **Physical layout / placement:** High-current FET and flyback/brake path separated from trigger input and status LEDs; two rugged motor solder tabs; deliberately sparse layout with big joints.
- **Major components / electrical architecture:** Narrow PCB; brushed-motor PWM, MOSFET, trigger assembly and braking control.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Motor output FET failure, broken trigger, vibration-loosened connector, worn battery terminals.
- **Diagnostic / completion tests:** Brushed load + brake test.
- **Special constraints:** More vibration faults than electronic complexity.

#### C-09. Makyta Brushless Angle Grinder — Safety Controller (T4)

- **PCB size:** **M** (relative category; no measurements).
- **PCB shape:** Near circular sector with motor-spindle clearance notch.
- **Component density:** **Dense**.
- **Physical layout / placement:** Six inverter power switches on arc perimeter, IMU/kickback electronics tucked in protected inner zone, MCU/brake circuitry behind safety-switch connector.
- **Major components / electrical architecture:** Circular/high-current PCB; 3-phase inverter, kickback sensor, brake controller, NTC, MCU and large power connectors.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Kickback sensor fault, failed low-side FET, heat-damaged DC link, loosened connector.
- **Diagnostic / completion tests:** Inertia emulator, brake and protection trip tests.
- **Special constraints:** Require protection tests before completion.

#### C-10. Ryoban 18V String Trimmer — Motor Controller (T3)

- **PCB size:** **S** (relative category; no measurements).
- **PCB shape:** Rounded rectangle with sealed connector tongue.
- **Component density:** **Moderate**.
- **Physical layout / placement:** Three phase-drive groups at motor end, buck/regulator and MCU farther from moisture entry, weatherproof edge header and exposed corrosion-prone potting boundary.
- **Major components / electrical architecture:** Weather-exposed BLDC board; MCU, low-voltage buck, driver, MOSFETs, Hall/sensorless sensing and connector seals.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Wet connector oxidation, corrosion at potting boundary, shorted phase FET, overheating regulator.
- **Diagnostic / completion tests:** Wet-condition inspection and variable-load motor test.
- **Special constraints:** Outdoor corrosion bias.

#### C-11. Feewalt PowerStack-ish Battery Pack — BMS Board (T4)

- **PCB size:** **S** (relative category; no measurements).
- **PCB shape:** Thin narrow rectangle with cell-tap comb edge.
- **Component density:** **Dense**.
- **Physical layout / placement:** Cell-monitor and balancing resistors run alongside tap pads; protection FETs on heat-spreader end, dual NTC/header points and identification EEPROM by pack connector.
- **Major components / electrical architecture:** Five-series-cell-style pack supervisor; sense leads, balancing FETs/resistors, NTC, protection MOSFETs, pack-identification data.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Cell-tap lead broken, failed balancing FET, thermistor detached, connector tab cracked.
- **Diagnostic / completion tests:** Cell simulator only; balancing and shutdown tests.
- **Special constraints:** Never show live cell pack shorting or unsafe battery manipulation.

## D. Gaming peripherals — eleven individual devices

These are especially useful T1–T4 repairs because many failures are visible, and input-specific interactive tests are easy to build. All game controllers should have distinctive input-test screens with switches, axes, encoders, cameras or audio outputs depending on the product.

**11 individually repairable board/device entries in this section.**

#### D-01. Pwnage ViperLite USB Gaming Mouse (T1)

- **PCB size:** **S** (relative category; no measurements).
- **PCB shape:** Long thin mouse-shaped outline with narrowing front nose.
- **Component density:** **Moderate**.
- **Physical layout / placement:** Optical sensor centered over base opening; left/right microswitch pads forward, scroll wheel encoder in midsection, USB strain relief and MCU near nose; LED along rear.
- **Major components / electrical architecture:** Compact PCB; USB MCU, optical sensor, scroll encoder, tactile switches, LEDs, USB cable.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Double-clicking microswitch, scroll encoder bounce, torn USB cable pad, dirty sensor window.
- **Diagnostic / completion tests:** Mouse movement, click and scroll test panel.
- **Special constraints:** Mechanical wear priority.

#### D-02. Razerish VenomAir Wireless Gaming Mouse (T3)

- **PCB size:** **S** (relative category; no measurements).
- **PCB shape:** Irregular tapering mouse motherboard.
- **Component density:** **Very Dense**.
- **Physical layout / placement:** Optical sensor hole mid-body; RF and MCU antenna keep-out toward tail, charging block at nose, tight side-button pads and slim battery connector behind wheel.
- **Additional board geometry:** One **XS** narrow button daughtercard (Low) with side switches; main board remains S/Very Dense.
- **Major components / electrical architecture:** Two-board shell; optical sensor, MCU/RF radio, charging PMIC, USB-C, Li-ion cell connector, side buttons.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Bad USB-C solder joint, failed charge controller, antenna disconnect, scroll encoder failure.
- **Diagnostic / completion tests:** Wireless pairing, USB power, input and charge tests.
- **Special constraints:** RF tester can validate basic link.

#### D-03. KeyKing RGB-68 Mechanical Keyboard (T2)

- **PCB size:** **XL** (relative category; no measurements).
- **PCB shape:** Long thin rectangle with regular switch-grid cutouts.
- **Component density:** **Moderate**.
- **Physical layout / placement:** Switch sockets and per-key diodes occupy nearly the entire board; RGB drivers along rows, USB-C/MCU cluster at one end, scan-line vias trace a clear grid.
- **Major components / electrical architecture:** Long PCB; matrix controller, diodes, per-key LED drivers, USB-C and removable switches.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Broken key switch socket, failed row diode, spilled-liquid corrosion, cracked USB-C anchors.
- **Diagnostic / completion tests:** Keyboard matrix visualizer, LED pattern test.
- **Special constraints:** Some failures demand trace jumper.

#### D-04. Clacker Pro Wireless Keyboard (T3)

- **PCB size:** **L** (relative category; no measurements).
- **PCB shape:** Two-part ergonomic keyboard layout with mirrored stepped halves.
- **Component density:** **Dense**.
- **Physical layout / placement:** Each half has a local row/column matrix; charging/RF control on master-half top edge; flex/cable interconnect between halves with spare scan test pads.
- **Additional board geometry:** Master half **L**, stepped (Dense); secondary half **L**, mirror-stepped (Moderate); optional **XS** RF radio daughtercard (Very Dense).
- **Major components / electrical architecture:** Split keyboard PCB plus small RF daughterboard; matrix scanner, battery charger, BLE MCU and LEDs.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Matrix ghosting from failed diode, RF module supply failure, broken flex connector, corrosion under keys.
- **Diagnostic / completion tests:** Matrix tester plus RF link and charging tests.
- **Special constraints:** Two-piece enclosure.

#### D-05. VebCam 1080P Streaming Camera (T3)

- **PCB size:** **XS** (relative category; no measurements).
- **PCB shape:** Square with round lens aperture.
- **Component density:** **Very Dense**.
- **Physical layout / placement:** Image sensor centered behind lens, image processor near back, LDO/clock under metal can edge; small microphone at bottom lip and USB solder anchors at rear.
- **Major components / electrical architecture:** Tiny dense board; CMOS sensor module, image processor, USB interface, local oscillator, LDO, microphone and status LED.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Sensor flex latch damaged, failed sensor supply LDO, dry USB joint, oscillator not starting.
- **Diagnostic / completion tests:** USB enumeration, test-pattern preview, microphone sample.
- **Special constraints:** Lens focus calibration mechanic.

#### D-06. StreamEye 4K Pro Webcam (T4)

- **PCB size:** **S** (relative category; no measurements).
- **PCB shape:** Stacked narrow rectangular camera boards.
- **Component density:** **Extreme**.
- **Physical layout / placement:** Sensor PCB sits behind lens, large ISP/memory board behind it, and a flex/interboard header joins them; fine-pitch camera routing and tightly packed local regulators.
- **Additional board geometry:** Front **XS** square sensor board (Extreme); rear **S** rectangular processing board (Very Dense), each separately inspectable.
- **Major components / electrical architecture:** Dense stacked two-PCB camera; high-resolution sensor, ISP, external memory, USB-C, mic-array and power rails.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Bad sensor rail, failed memory supply, cracked interboard connector, ESD-damaged USB lines.
- **Diagnostic / completion tests:** Power tree, USB high-speed loopback, test video and mic.
- **Special constraints:** Fine pitch and optical alignment.

#### D-07. BoomMic 7.1 USB Gaming Headset (T2)

- **PCB size:** **XS** (relative category; no measurements).
- **PCB shape:** Rounded oval inline-control PCB.
- **Component density:** **Moderate**.
- **Physical layout / placement:** USB/audio DSP and codec at center, tiny amp/output filter at earcup end, thumbwheel and mic-mute switch exposed through shell; strain-relief solder tabs at both ends.
- **Major components / electrical architecture:** Small inline DSP/USB soundcard PCB, DAC/amp, headset drivers, mic input, physical controls.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Broken volume wheel, failed amp, USB strain damage, oxidized mic mute switch.
- **Diagnostic / completion tests:** Audio sweep, mic loopback, distortion test.
- **Special constraints:** Include earcup wire continuity.

#### D-08. HyperLoud Wireless Gaming Headset (T3)

- **PCB size:** **S** (relative category; no measurements).
- **PCB shape:** Curved crescent to fit earcup.
- **Component density:** **Very Dense**.
- **Physical layout / placement:** Audio codec and wireless MCU share dense top surface, amplifier near speaker wires; USB-C charge block and NTC at lower edge, antenna keep-out toward plastic shell.
- **Additional board geometry:** Optional **XS** slender battery/charging daughterboard (Dense) on opposite earcup; primary audio board S/Very Dense.
- **Major components / electrical architecture:** Battery PCB plus audio board; wireless SoC, audio codec, class-D amp, USB-C charge, mic preamp and buttons.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Battery connector loose, charger failure, antenna feed damage, class-D amp failure.
- **Diagnostic / completion tests:** Wireless pairing, charging, audio and mic test.
- **Special constraints:** Separate audio versus RF symptoms.

#### D-09. QuarterMuncher Arcade Stick 8 (T1)

- **PCB size:** **M** (relative category; no measurements).
- **PCB shape:** Wide rectangle with oversized mounting holes.
- **Component density:** **Sparse**.
- **Physical layout / placement:** USB controller and a few passives in center; widely spaced joystick/button headers around perimeter, enormous negative space and clear THT pads for manual soldering.
- **Major components / electrical architecture:** Large sparse PCB; USB HID controller, through-hole headers, 8 arcade microswitch inputs and joystick contacts.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Broken spade/crimp, failed button switch, cracked header solder joint, intermittent joystick direction.
- **Diagnostic / completion tests:** Arcade input grid display and cable wiggle test.
- **Special constraints:** Mechanical diagnosis focused.

#### D-10. FightPaddy Elite Arcade Controller (T3)

- **PCB size:** **L** (relative category; no measurements).
- **PCB shape:** Angular custom arcade-controller silhouette.
- **Component density:** **Dense**.
- **Physical layout / placement:** Analog-axis ADCs near stick sockets, button-matrix traces radiate to edges, encoder and RGB driver clusters, MCU/USB-C toward center-back, many exposed debug points.
- **Major components / electrical architecture:** Custom irregular PCB; MCU, analog stick ADCs, button matrix, USB-C, RGB LEDs, rotary encoders.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Drifting analog axis, matrix trace break, damaged USB-C, encoder bounce, failing voltage reference.
- **Diagnostic / completion tests:** Analog response curves, button matrix, calibration.
- **Special constraints:** More complicated than simple arcade stick.

#### D-11. VRaptor Motion Wand (T4)

- **PCB size:** **S** (relative category; no measurements).
- **PCB shape:** Two elongated tapering bars fitted into grip.
- **Component density:** **Very Dense**.
- **Physical layout / placement:** IMU in rigid middle zone, wireless antenna kept clear at top, haptic driver close to motor, charging components and buttons toward hand grip; multiple thin interboard flexes.
- **Additional board geometry:** Two **S** tapered narrow grip boards (Very Dense / Dense) with flex cable, each separately serviceable for connector and trace damage.
- **Major components / electrical architecture:** Two slim PCBs; IMU, MCU, RF transceiver, haptic motor driver, rechargeable cell, optical emitter/receiver style feedback.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** IMU rail noisy, damaged vibration driver, cracked wrist-strap-side solder, USB-C charging fault.
- **Diagnostic / completion tests:** IMU movement emulator, haptic test, tracking packet test.
- **Special constraints:** Complex physical alignment and calibration.

## E. 3D printers — five controllers

Make heater and thermistor behavior physically meaningful. Motors have phase continuity and driver states; MOSFET switching heats bed/hotend load models, and safety faults trigger thermal protection. Keep mains heater switching isolated to a safe simulation.

**5 individually repairable board/device entries in this section.**

#### E-01. Reeality Bender 8-Bit Classic — Mainboard (T2)

- **PCB size:** **L** (relative category; no measurements).
- **PCB shape:** Plain rectangle with large corner mounting holes.
- **Component density:** **Moderate**.
- **Physical layout / placement:** Socketed stepper drivers in row, large bed/heater screw terminals at edge, 8-bit MCU near center, endstop and thermistor header strips along long side.
- **Major components / electrical architecture:** Legacy-style 8-bit MCU, plug-in stepper driver modules, MOSFET heated-bed/hotend outputs, thermistor inputs, USB serial and endstop headers.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Burned bed connector, failed stepper driver module, broken thermistor pin, melted heater-terminal solder.
- **Diagnostic / completion tests:** Stepper jog, thermistor reading, temperature setpoint and endstop tests.
- **Special constraints:** Older mostly through-hole connectors.

#### E-02. Pruska MK4-ish — 32-Bit Motion Controller (T3)

- **PCB size:** **L** (relative category; no measurements).
- **PCB shape:** Rectangular board with triangular key notch.
- **Component density:** **Dense**.
- **Physical layout / placement:** Four or five integrated stepper channels line motor edge; thermal/heater outputs and sensor filters grouped separately; processor, USB and memory near diagnostic LEDs.
- **Major components / electrical architecture:** ARM-class MCU, integrated stepper drivers, motor power rails, heater FETs, thermistor protection, USB, optional EEPROM.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Blown heater FET, stepper driver overheating, intermittent USB, broken endstop input.
- **Diagnostic / completion tests:** Stepper driver diagnostic, PWM heat and sensor plausibility checks.
- **Special constraints:** Repairs require full-axis validation.

#### E-03. BamBoozle Carbon X — CoreXY Mainboard (T4)

- **PCB size:** **XL** (relative category; no measurements).
- **PCB shape:** Large custom hexagonal rectangle with one projecting tongue.
- **Component density:** **Very Dense**.
- **Physical layout / placement:** Several stepper-driver rows, MCU/memory cluster, heaters, fan banks, display/camera interface, dense board-to-board ribbon connectors and a dedicated DC-DC power island.
- **Additional board geometry:** An **XS** rectangular network daughterboard (Very Dense) may mount above main XL board on standoffs.
- **Major components / electrical architecture:** Dense multi-axis controller with MCU, memory, 5+ stepper channels, fans, heaters, display/control and network daughterboard.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Shorted stepper output, failed auxiliary buck, fan driver FET open, bad interboard connector.
- **Diagnostic / completion tests:** Multi-axis homing fixture, fan/heater and communications test.
- **Special constraints:** Higher density and more interconnected symptoms.

#### E-04. Voroneer Toolhead CAN Board (T3)

- **PCB size:** **XS** (relative category; no measurements).
- **PCB shape:** Small rounded rectangle with mounting ear and heater lug cutout.
- **Component density:** **Dense**.
- **Physical layout / placement:** CAN connector next to protection transceiver, MCU in center, hotend MOSFET and fan drivers at edge near heat sink, thermistor/probe headers on far edge.
- **Major components / electrical architecture:** Small board on hotend assembly; CAN transceiver, MCU, thermistor inputs, fan drivers, heater FET, probe connector.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Broken CAN-H connector, failed 5 V regulator, heater driver failure, corrosion from coolant/filament debris.
- **Diagnostic / completion tests:** CAN bus simulator, heater/fan/pin tests.
- **Special constraints:** Compact board near heat and vibration.

#### E-05. Elegoon Saturnish Resin Printer — Main Controller (T4)

- **PCB size:** **L** (relative category; no measurements).
- **PCB shape:** Wide L-shaped controller with FPC connector shelf.
- **Component density:** **Dense**.
- **Physical layout / placement:** LCD FPC latches concentrated on stepped shelf, Z stepper section at base, UV driver and heatsink pads far from MCU/memory; distinctive panel and fan headers.
- **Major components / electrical architecture:** MCU or application processor, display FPC, UV LED power-control stage, Z stepper driver, memory and fans.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Cracked LCD flex latch, dead UV enable FET, failed Z driver, storage controller issue.
- **Diagnostic / completion tests:** UV-load dummy fixture, LCD test pattern, Z motion and endstop.
- **Special constraints:** No UV exposure required for bench test.

## F. Old-school and legacy electronics — fourteen individual devices

Use a mixture of through-hole, early SMD and simple mixed-signal circuitry. These should reward the player for correct oscilloscope, frequency-counter, RF/audio, mechanical and continuity tests. A transmitter should be tested into a simulated/dummy load, never as an uncontrolled transmission.

**14 individually repairable board/device entries in this section.**

#### F-01. DiscManiac 100 Portable CD Player (T2)

- **PCB size:** **S** (relative category; no measurements).
- **PCB shape:** Curved semicircular crescent hugging optical-drive mechanism.
- **Component density:** **Moderate**.
- **Physical layout / placement:** Spindle/sled motor connectors along inner curve, servo controller and DAC near central axis, headphone jack and battery/charging stage on outer arc.
- **Major components / electrical architecture:** Small mixed THT/SMD board; optical pickup flex, spindle and sled motor drivers, servo IC, decoder/DAC, audio amp and battery/DC input.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Cracked pickup flex, sticking sled motor, failed motor driver, bad headphone jack, aged electrolytic.
- **Diagnostic / completion tests:** Disc emulation and servo position, motor test, audio output.
- **Special constraints:** Includes optical lens-cleaning mini task.

#### F-02. SilvaSound CD-300 Hi-Fi Deck (T3)

- **PCB size:** **L** (relative category; no measurements).
- **PCB shape:** Wide rectangular deck board with motor-control peninsula.
- **Component density:** **Moderate**.
- **Physical layout / placement:** Separate motor/servo cluster near disc transport, decoder and audio DAC toward rear RCA outputs, regulator bank near power input, substantial ribbon connector areas.
- **Additional board geometry:** A **S** long narrow front-panel PCB (Low), with transport buttons and LED/display segments, is optional separate repair target.
- **Major components / electrical architecture:** Two-board design: optical servo/decoder PCB plus analog audio/PSU PCB; drawer motor, DAC, remote receiver, display.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Worn tray belt, failed optical pickup, dried filter caps, cold joint on output RCA.
- **Diagnostic / completion tests:** Tray motion, disc-read/status, audio sweep and rail ripple.
- **Special constraints:** Some repairs mechanical before board-level.

#### F-03. Kaysonic StreetBlaster 1986 Boombox (T2)

- **PCB size:** **XL** (relative category; no measurements).
- **PCB shape:** Long flat boombox audio chassis board.
- **Component density:** **Low**.
- **Physical layout / placement:** Large through-hole electrolytics and power/audio amp near speaker terminals; cassette motor and tuning connectors in center, mechanical button pads spanning front edge.
- **Major components / electrical architecture:** Large through-hole audio PCB; AM/FM receiver, cassette motor control, two-channel amp, mechanical switches, power jack.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Cassette belt disintegration, scratchy potentiometer, output-amp failure, battery-contact corrosion.
- **Diagnostic / completion tests:** Radio/audio signal injection and cassette speed test.
- **Special constraints:** Multiple mechanical steps.

#### F-04. Blok-Buster Retro Jammer 1992 Boombox (T3)

- **PCB size:** **XL** (relative category; no measurements).
- **PCB shape:** Long U-shaped boom-box mainboard wrapping tape bay.
- **Component density:** **Moderate**.
- **Physical layout / placement:** Cassette mechanism occupies center void; CD/radio receiver and preamp to left, power amplifier/heatsink to right; controls and equalizer sliders along arms.
- **Additional board geometry:** A **L** long slim top-button/LED board (Low) connects by ribbon, independent from XL U-shaped audio mainboard.
- **Major components / electrical architecture:** Mixed through-hole/SMD; radio tuner, twin cassette decks, EQ IC, stereo power amp, LED VU meters, optional CD subassembly.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Leaking caps, failed amp channel, contact oxidation in source switch, motor-control regulator fault.
- **Diagnostic / completion tests:** Channel balance, motor speed and source select test.
- **Special constraints:** Large shell and multiple modules.

#### F-05. Sonnic TR-9 Pocket Transistor Radio (T1)

- **PCB size:** **XS** (relative category; no measurements).
- **PCB shape:** Plain vertical rectangle with battery clip notch.
- **Component density:** **Sparse**.
- **Physical layout / placement:** Through-hole RF coil and tuning capacitor at top; two or three discrete transistors, resistors and ceramic capacitors across center, speaker and battery terminals at bottom.
- **Major components / electrical architecture:** Classic through-hole AM radio; ferrite antenna, discrete transistor RF/IF/audio stages, variable capacitor, diode detector.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Leaky electrolytic, cracked antenna wire, faulty transistor, oxidized tuning capacitor contact.
- **Diagnostic / completion tests:** AM signal injection, intermediate-frequency/audio checks.
- **Special constraints:** Intro to discrete analog troubleshooting.

#### F-06. Panicsonnet Sunwave FM-12 Transistor Radio (T2)

- **PCB size:** **S** (relative category; no measurements).
- **PCB shape:** Elongated rectangular radio board with bent tuning-dial corner.
- **Component density:** **Low**.
- **Physical layout / placement:** Ferrite antenna coil fixed down one side; AM/FM tuning and detector area center; small audio amplifier/output transformer on opposite side, battery and earphone contacts at end.
- **Major components / electrical architecture:** Simple AM/FM analog front-end; tuning network, IF filter, FM detector IC, audio amplifier and battery clips.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Open IF transformer lead, failed detector IC, cracked tuning potentiometer, corroded battery clip.
- **Diagnostic / completion tests:** RF source, modulation audio output and tuning test.
- **Special constraints:** Calibration-style alignment mini task (generic).

#### F-07. WeatherWise Station 2000 Desk Weather Monitor (T2)

- **PCB size:** **M** (relative category; no measurements).
- **PCB shape:** Wide rectangular display PCB with LCD outline cutout.
- **Component density:** **Low**.
- **Physical layout / placement:** Zebra LCD contacts dominate upper face; sensor ICs and clock/reference near open vents, RF receive module and battery contacts on lower corners, sparse MCU center.
- **Major components / electrical architecture:** LCD PCB; MCU, humidity/temperature IC, barometer module, coin backup battery, segmented LCD, small RF receiver.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Failed humidity-sensor supply, damaged RF antenna connection, poor LCD zebra-strip contact, leaky backup battery.
- **Diagnostic / completion tests:** Sensor-condition emulation, LCD segment check, wireless pairing.
- **Special constraints:** Simulated outdoor sensor feed.

#### F-08. SkyCast Pro 5-in-1 Weather Station (T3)

- **PCB size:** **L** (relative category; no measurements).
- **PCB shape:** Broad stepped main-display board with a narrow top antenna tongue.
- **Component density:** **Moderate**.
- **Physical layout / placement:** Main LCD and memory logger at front, RF/baseband section under shield near antenna tongue, power and backup cell at side, ribbon header to weather sensor attachment.
- **Additional board geometry:** Separate **S** rectangular outdoor transmitter/sensor PCB (Moderate) with multiple exposed weatherproof connectors and a broad antenna keep-out.
- **Major components / electrical architecture:** Main LCD board with RF receiver and logger memory; separate outdoor sensor/transmitter PCB with anemometer/rain interfaces.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Wind sensor connector corroded, water ingress at transmitter, display ribbon loosened, flash logging fault.
- **Diagnostic / completion tests:** Rain/wind/temp stimulus, RF receiver/link and logging test.
- **Special constraints:** Two-piece device, outdoors water exposure.

#### F-09. RoadRage CB-40 Mobile CB Radio (T2)

- **PCB size:** **L** (relative category; no measurements).
- **PCB shape:** Long thin rectangular mobile radio chassis board.
- **Component density:** **Low**.
- **Physical layout / placement:** RF coils/filters and driver/output transistor arranged along metal chassis wall, PLL channel circuits central, microphone/audio and front display headers at nose; mostly through-hole.
- **Major components / electrical architecture:** Through-hole/mixed board; RF receiver and transmitter stages, PLL synthesizer, channel display, mic input and audio amp.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Bad mic cable contact, PLL supply ripple, dirty channel encoder, output transistor failure.
- **Diagnostic / completion tests:** RF dummy load and frequency/channel monitor, receive audio test.
- **Special constraints:** No real on-air transmissions.

#### F-10. TruckTalk CB-88 Deluxe CB Radio (T3)

- **PCB size:** **XL** (relative category; no measurements).
- **PCB shape:** Long large rectangle with extended RF-amplifier edge.
- **Component density:** **Moderate**.
- **Physical layout / placement:** VCO/PLL shielding toward rear, IF filter row through center, RF PA/heatsink on outer lip, power/sensing and antenna socket opposite front-panel ribbon header.
- **Additional board geometry:** Front panel **M** narrow rectangle (Low) with channel display, encoder and controls; XL main RF PCB is separate.
- **Major components / electrical architecture:** Main radio PCB plus front panel; PLL, VCO, IF filters, RF output stage, SWR sensing and S-meter.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Loose antenna socket, drifted reference, burnt output-stage component, damaged panel ribbon.
- **Diagnostic / completion tests:** RF test fixture, modulation and receiver sensitivity test.
- **Special constraints:** Requires alignment verification in fictional test mode.

#### F-11. Hamster HT-2 Dual-Band Handheld Amateur Radio (T3)

- **PCB size:** **S** (relative category; no measurements).
- **PCB shape:** Tall narrow rectangle shaped around handheld battery bay.
- **Component density:** **Very Dense**.
- **Physical layout / placement:** Antenna/matching/RF chain near top socket, synthesizer and RF ICs under shields, MCU/LCD behind keypad area, audio and charging circuits toward lower contacts.
- **Major components / electrical architecture:** Dense SMD dual-band handheld; MCU, display, RF transceiver ICs, antenna path, audio codec, battery management.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Cracked antenna SMA joint, failed VCO supply LDO, speaker amplifier fault, battery contact spring damage.
- **Diagnostic / completion tests:** RF shielded load/link test, squelch, TX/RX and audio verification.
- **Special constraints:** Firmware settings and channel-memory check.

#### F-12. Hamster BasePro-100 Amateur Base Transceiver (T5)

- **PCB size:** **XL** (relative category; no measurements).
- **PCB shape:** Deep rectangular main RF board with heat-sink notch.
- **Component density:** **Dense**.
- **Physical layout / placement:** Receiver front-end and IF strip under removable shields, PLL and MCU near digital connector, PA bias/power stage toward heat-sink edge with RF relays and filtered supplies.
- **Additional board geometry:** Second **L** rectangular PA board (Moderate) with high-power transistor footprints and thick output traces; separate front-panel **M** display/control PCB (Low) if modeled.
- **Major components / electrical architecture:** Two-board RF transceiver and power amplifier; synthesizer, receiver filters, IF/demod, driver/PA transistors, bias, heat sensing and front panel.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Failed PA bias component, overheating PA device, missing PLL lock, RF relay contact failure, filter capacitor leakage.
- **Diagnostic / completion tests:** Frequency counter, spectrum-style view, watt/dummy-load fixture and sensitivity check.
- **Special constraints:** Complex calibration and thermal acceptance.

#### F-13. StormGuard WX-1 Emergency Weather Radio (T1)

- **PCB size:** **S** (relative category; no measurements).
- **PCB shape:** Compact rectangle with hand-crank mounting notch.
- **Component density:** **Low**.
- **Physical layout / placement:** Weather-band radio IC/antenna trace at upper end, through-hole LED and audio amp central, rectifier and charge circuit near crank input, spring contacts along side.
- **Major components / electrical architecture:** Small radio PCB; weather-band receiver IC, audio amp, LED flashlight and battery/dynamo charging subcircuit.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Corroded battery clips, failed rectifier diode, broken tune switch, bad charging cap.
- **Diagnostic / completion tests:** Receiver/audio, LED and charge-current test.
- **Special constraints:** Very approachable emergency radio.

#### F-14. StormGuard WX-Alert Deluxe (T3)

- **PCB size:** **M** (relative category; no measurements).
- **PCB shape:** Rectangular emergency-radio logic board with display ledge.
- **Component density:** **Moderate**.
- **Physical layout / placement:** Receiver/shield and antenna at top, decoder MCU and memory midboard, LCD/beeper/alert driver at display ledge, rechargeable/backup supply toward base.
- **Major components / electrical architecture:** Weather receiver module, alert decoding MCU, LCD, backup battery, speaker, charging supply and alarm output.
- **Fault inheritance:** `Existing Faults from Fault Catalog`.
- **Additional device-specific fault candidates:** Receiver sensitivity degraded, alarm driver transistor failed, flash/config corruption, keypad corrosion.
- **Diagnostic / completion tests:** Simulated alert test tone, display, backup supply and audible alert check.
- **Special constraints:** Require successful standby-and-alert validation.

## G. Canonical parody names and naming constraints

| Replace any old draft name | Canonical name for game |
|---|---|
| Tessla | **Ressla** |
| Milwockee | **StillWockee** |
| Hercules-ish | **Herplease** |
| Dawlt / Bawlt | **Feewalt** |
| Crealitty Ender-ish | **Reeality Bender** |
| Panasonic-ish / Pannasonic-ish | **Panicsonnet** |

Do not retain former names in generated device IDs, UI strings, filenames, asset names, localization data or device listings. The left-hand labels above are **migration-only aliases**, not valid display names. Keep this table only in the implementation handoff for find/replace and migration; game UI must use the right-hand names.

## H. Implementation guidelines for Claude

1. **Preserve existing content and geometry metadata:** append these entries with unique IDs. Do not overwrite the existing fault catalog or make new duplicate definitions of generic faults; reference existing IDs where available.
2. **Inherit the exact label at the device level and board level:** `Existing Faults from Fault Catalog`. Individual instances draw from that library PLUS the named special faults.
3. **Use all six PCB size classes:** Store XS, S, M, L, XL or XXL separately from density and shape as device metadata. Do not invent dimensions. Use the layout notes as asset creation requirements, not optional flavor text.
4. **Generate electrically coherent schematics:** all listed parts are functional model components connected into physically valid power, logic, audio/RF, motor or sensor paths. PCB traces and test points must correspond to those circuits. Use subsystem abstractions where the full real device would require hundreds of components, keeping exposed troubleshooting paths real.
5. **Make failures observable:** symptoms -> accessible test points or inputs -> causally linked readings -> faulty part or net -> repair -> final functional test. Do not reveal fault immediately on diagnostic connection.
6. **Difficulty is diagnosis, not sheer component count:** T1–T2 visual and continuity; T3 motor/audio/RF and power sequencing; T4 combined interface and calibration; T5 coating/isolated interfaces/large power trees; T6 partial schematics and deliberate multi-stage investigation.
7. **Realistic source of damage:** remotes and mice fall and wear; tools vibrate and heat cycle; 3D printers overheat terminals; outdoor sensors corrode; old audio suffers belts/contact oxidation/cap aging; EV low-voltage control modules get connector damage and failed power supplies; avionics requires inspection and controlled repair processes.
8. **Diagnostic equipment:** multimeter, current-limited power source, oscilloscope, thermal camera, soldering and rework tools, hot air, microscope, LCR, bench function generator, frequency counter/RF fixture, audio tester, motor/stepper emulator, CAN-style automotive scan tablet, keyboard/mouse input tester, optical drive/laser test fixture, safe simulated environmental acceptance fixture.
9. **Cross-board cases:** allow an external symptom to originate on another board, harness, interconnect or simulated peripheral. One repair job may involve multiple distinct boards, but avoid arbitrary multi-fault chaos except in explicit T5/T6 missions.
10. **Service mechanics:** turnaround, part approvals, traceability, OEM pairing, coating remove/reapply, cleanliness inspection, ESD and inspection penalties and rush shipping should be configurable job metadata. Fictional 'JEFFA' and similar certification labels exist only within the game.
11. **Pass/fail:** repaired board must complete measurable functional tests, not merely pass visual inspection. Reject incorrect components, wrong polarity, shorts, missed coating in protected areas, and unresolved faults. All tests must have readable results.
12. **Avoid unsafe real-world scenarios:** HV EV, mains, high-power RF and flight hardware should be rendered with safe disconnected/virtual test rigs. Keep real-world engineering behaviors at the component/electrical-simulation level, without suggesting unsafe live servicing.
13. **Add progression economy hooks:** lower-tier consumer units offer modest payout and fast turnaround; gaming and tool controllers medium; automotive high; certified aviation, orbital and fictional military work very high, with expensive parts and stricter documentation. Rare rewards can unlock fixtures, adapters, scopes, or the coating-removal tools.

### Possible gameplay unlock sequence

T1: transistor radios, emergency weather radios, budget mouse, arcade stick, brushed screwdriver. T2: CD players, boomboxes, basic keyboards, small printer board, branded drills. T3: headsets, wireless peripherals, complex weather stations, CB sets, BLDC tools, toolhead boards. T4: premium webcam, high-power tools, resin/CoreXY printer, vehicle body/thermal controllers. T5: advanced EV systems, high-power HF radio, protected power electronics, commercial aerospace and military programs. T6: Project NIGHTGLASS capstone with partial documentation and full inspection requirements.

## I. Technical grounding / source links

These are fictional game concepts; engineering archetypes are inspired by public references:

- [Texas Instruments — EV battery-management system overview](https://www.ti.com/applications/automotive/hev-ev-powertrain/hev-ev-battery-management-system-bms/overview.html) (cell monitoring, current sensing, contactor/interlock, isolation)
- [Infineon — cordless power-tool electronics](https://www.infineon.com/application/battery-powered) (MCU, three-phase BLDC bridges, gate drivers, Hall feedback, protection)
- [Duet3D — controller board wiring and diagnostics](https://docs.duet3d.com/en/How_to_guides/Wiring_your_Duet_3) (stepper outputs, fans, heaters, thermistors, connectors)
- [iFixit — optical disc drive troubleshooting](https://www.ifixit.com/Wiki/Optical_Disc_Troubleshooting) (tray/sliding/laser/optical cable problems)
