# Bench Tech
## Hybrid Electronics Repair & Troubleshooting Game Concept

**Working Title:** Bench Tech  
**Genre:** Electronics Repair Simulator / Diagnostic Puzzle / Light Business Simulation  
**Core Design:** Accessible electronics repair gameplay that gradually develops into realistic component-level circuit troubleshooting and microsoldering.

---

## 1. High-Level Concept

*Bench Tech* is an electronics repair and troubleshooting game built around the fantasy of becoming exceptionally good at diagnosing and repairing electronics.

The player begins with a cheap soldering iron, a basic multimeter, a small workbench, and limited knowledge. Customers bring in broken electronics ranging from simple toys and controllers to consoles, laptops, audio equipment, industrial electronics, and sophisticated circuit boards.

The fundamental gameplay loop is:

**Diagnose → Repair → Verify**

Early repairs are intentionally approachable. A player does not need to understand MOSFETs, buck converters, power rails, or circuit theory to begin playing.

As the player progresses, assistance is gradually removed and the electronics become increasingly realistic. Eventually, the player must interpret schematics, trace power rails, use oscilloscopes, inject voltage into shorted rails, investigate communication buses, identify unknown components, repair damaged PCB traces, and perform microsoldering and BGA work.

The goal is not simply to create a soldering simulator.

The goal is to make the player feel like they are **learning how to think like an electronics repair technician**.

---

## 2. Design Philosophy

The game should operate on several principles:

1. **Accessible at the beginning**
2. **Increasingly realistic as the player progresses**
3. **Diagnosis is more important than parts swapping**
4. **Measurements should provide meaningful evidence**
5. **Failures should produce electrically consistent symptoms**
6. **Repair technique should matter**
7. **Better equipment provides capabilities rather than arbitrary stat boosts**
8. **Player knowledge becomes the primary progression system**
9. **Procedural faults should prevent repairs from becoming memorization exercises**
10. **The game should be entertaining to watch other people play**

A knowledgeable electronics hobbyist should recognize real troubleshooting techniques, while a player with no electronics experience should be able to learn those techniques through gameplay.

---

# 3. Core Gameplay Loop

Every repair follows three broad stages:

## Diagnose

The player receives a device and customer complaint.

They can:

- Read the repair ticket
- Question the customer where appropriate
- Perform visual inspection
- Disassemble the device
- Examine the PCB
- Measure resistance
- Check continuity
- Measure voltages
- Test diodes
- Inspect signals
- Check current consumption
- Inject voltage
- Use thermal imaging
- Inspect components under a microscope
- Consult schematics
- Search component information and datasheets
- Develop and test diagnostic hypotheses

## Repair

Once the player believes they have identified the problem, they perform the appropriate repair.

Possible repairs include:

- Connector replacement
- Wire repair
- Switch replacement
- Fuse replacement
- Through-hole component replacement
- SMD component replacement
- IC replacement
- Trace repair
- Pad repair
- Jumper installation
- Corrosion cleanup
- BGA rework
- Reballing
- Mechanical repairs
- Cable replacement

## Verify

Repairing the suspected fault does not automatically complete the job.

The player must verify the repair.

Verification could include:

- Power-on testing
- Current consumption
- Functional testing
- Voltage measurements
- Signal measurements
- Load testing
- Thermal testing
- Inspection of solder joints
- Reassembly testing

A repair can appear successful but fail later if workmanship is poor.

---

# 4. Early-Game Experience

Early jobs should provide immediate satisfaction.

Example:

## Bluetooth Speaker — $35

**Customer complaint:**  
"It only charges if I hold the cable sideways."

The player disassembles the speaker and performs visual inspection.

Early-game assistance may highlight suspicious areas after sufficient inspection.

The USB connector visibly moves.

The player:

1. Removes the PCB
2. Applies flux
3. Resolders or replaces the connector
4. Cleans the PCB
5. Reassembles the speaker
6. Tests charging

**REPAIR SUCCESSFUL**

The player receives:

- Payment
- Reputation
- Experience
- Potential customer review

This teaches the basic repair loop without requiring electronics knowledge.

---

# 5. Player Progression

Progression should represent increasing knowledge and technical capability rather than arbitrary RPG statistics.

A possible progression structure:

| Level | Typical Work | Player Learns |
|---|---|---|
| **1: Parts Swapper** | Cables, switches, connectors, batteries | Disassembly, soldering, visual inspection |
| **2: Bench Tech** | Broken joints, diodes, capacitors, regulators | Multimeter fundamentals |
| **3: Board Repair** | Shorts, power rails, corrosion, damaged traces | Schematics and systematic diagnosis |
| **4: Microsoldering** | QFN, tiny passives, pad repair, jumpers | Microscope and hot-air work |
| **5: Expert Diagnostics** | BGA, multilayer boards, intermittent faults | Advanced troubleshooting |

Early in the game, assistance might explicitly suggest:

> Check the fuse.

Later, the player receives only:

> **Device:** Bench power supply  
> **Customer complaint:** Dead.  
> **Previous repair attempts:** Unknown.

The player must decide how to approach the repair.

The progression therefore occurs primarily inside the player's own understanding.

---

# 6. Circuit Simulation

The circuit simulation could become the defining feature of *Bench Tech*.

The game should not attempt transistor-level SPICE simulation of an entire consumer product. Instead, each device can contain a simplified but electrically meaningful **functional circuit graph** underneath the PCB artwork.

Example:

```text
USB-C
  │
 F1
  │
TVS ─── GND
  │
Q1 MOSFET
  │
5V RAIL
  │
├── 3.3V REGULATOR
├── AUDIO AMP
└── BATTERY CHARGER
```

Each component has properties such as:

- Component type
- Nominal value
- Tolerance
- Voltage
- Resistance
- Connectivity
- Thermal characteristics
- Normal operating state
- Possible failure states

For example:

```text
C17
Normal: 10 µF
Failed: 0.7 Ω short
```

If C17 shorts, the simulation propagates the electrical consequences.

The player might observe:

```text
5V rail resistance to ground: 0.7 Ω
5V rail voltage: 0.42 V
3.3V rail: 0 V
Input current: 2.3 A
C17 temperature: 71°C
```

The game does not need to explicitly script:

> Measure C17.

The failure itself produces evidence.

The player interprets that evidence.

---

# 7. Procedurally Generated Faults

This is one of the most important concepts in the game.

Rather than designing every repair as:

```text
Device #17
Fault #3
Solution: Replace C37
```

devices are constructed from functional circuit blocks.

For example:

```text
12V_INPUT
    ↓
PROTECTION
    ↓
BUCK_5V
    ↓
LDO_3V3
    ↓
MCU
```

The failure generator can then modify the circuit:

```text
C27 = SHORT
```

The simulation propagates the effects through the board.

The result becomes the puzzle.

This allows the same physical device to exhibit many different failures.

For example, a laptop that does not charge could have:

- Failed USB-C connector
- Shorted capacitor
- Failed input MOSFET
- Faulty charging controller
- Broken trace
- Missing enable signal
- Failed current-sense resistor
- Damaged protection circuitry

Each fault produces different evidence.

The player cannot simply memorize:

> Laptop Model X + no charging = replace Q17.

They must diagnose the actual board in front of them.

---

# 8. Multiple and Intermittent Faults

Advanced repairs should introduce more complicated failure combinations.

Possible advanced conditions include:

- Multiple failed components
- Intermittent connections
- Thermal faults
- Cracked solder joints
- Liquid damage
- Corrosion
- Broken vias
- Damaged traces
- Previous repair attempts
- Incorrect replacement components
- Components that fail only under load
- Signals that disappear after heating
- Power rails that collapse intermittently

These create substantially more complex diagnostic puzzles.

---

# 9. Red Herrings

Visual inspection should be useful, but not infallible.

If every visibly suspicious component is defective, troubleshooting becomes a hidden-object game.

Possible red herrings include:

- Flux residue from manufacturing
- Slight PCB discoloration
- Components that appear damaged but test correctly
- Previous legitimate repairs
- Cosmetic scratches
- Unused component footprints
- Slightly crooked components that function normally

Meanwhile, the actual problem might be a cracked 0402 resistor that looks perfectly normal.

The player should learn to:

1. Form a hypothesis
2. Gather evidence
3. Test the hypothesis
4. Revise the diagnosis when necessary

---

# 10. Test Equipment

Test equipment should function as real gameplay tools rather than decorative upgrades.

## Multimeter

Possible functions:

- DC voltage
- AC voltage
- Resistance
- Continuity
- Diode mode
- Current

Measurements are generated from the current simulated circuit state.

## Oscilloscope

Used for:

- Clock signals
- PWM
- Switching regulators
- Ripple
- Communication buses
- Reset signals
- Intermittent signals
- Power sequencing

## Bench Power Supply

Used for:

- Current-limited startup
- Current consumption analysis
- Power injection
- Short detection
- Controlled voltage testing

## Thermal Camera

Used to identify:

- Shorted capacitors
- Failed ICs
- Overloaded regulators
- Excessive current paths
- Unexpected heating

## Microscope

Used for:

- Fine-pitch inspection
- Cracked solder joints
- Corrosion
- Pad damage
- Trace damage
- Tiny components
- Microsoldering

## Logic Analyzer

Used for:

- I2C
- SPI
- UART
- Digital buses
- Communication troubleshooting

## Electronic Load

Used for:

- Power supply testing
- Battery testing
- Regulator testing
- Load-related faults

---

# 11. Equipment as Progression

The player should not buy equipment that simply provides abstract bonuses such as:

> +15% Repair Speed

Equipment should unlock actual diagnostic and repair capabilities.

The player might begin with:

- $12 soldering iron
- Cheap multimeter
- Basic tweezers
- Screwdriver set
- Magnifying glass

Later purchases could include:

- Temperature-controlled soldering station
- Hot-air rework station
- Digital microscope
- Stereo microscope
- Bench power supply
- Oscilloscope
- Thermal camera
- Logic analyzer
- Electronic load
- PCB preheater
- Fume extraction
- BGA rework equipment

Better equipment makes difficult repairs possible, but owning an oscilloscope does not automatically tell the player what waveform they should expect.

The player still needs knowledge.

---

# 12. Soldering Mechanics

Soldering should be skill-based without becoming intentionally frustrating.

Possible variables include:

- Tip temperature
- Tip size
- Dwell time
- Solder quantity
- Flux
- Wetting
- Contact area
- Component temperature
- Mechanical strength

Possible mistakes include:

- Cold joints
- Excess solder
- Insufficient solder
- Bridges
- Overheated components
- Burned PCB material
- Lifted pads
- Damaged traces

The goal is to reward good technique without turning mouse control into the primary difficulty.

---

# 13. Microsoldering Mechanics

Advanced repairs can introduce:

- 0402 components
- 0201 components
- Fine-pitch ICs
- QFN packages
- USB-C connectors
- HDMI connectors
- Pad reconstruction
- Trace repair
- Jumper wires
- BGA removal
- BGA replacement
- Reballing

Hot-air mechanics could include:

- Temperature
- Airflow
- Distance
- Heating time
- Preheating
- Thermal mass

Too much airflow could physically move tiny nearby components.

A misplaced 0201 component could disappear from the work area entirely.

---

# 14. Repair Quality

A repair should not be considered good simply because the device powers on.

Each repair can have hidden or visible quality characteristics.

Examples:

- Electrical conductivity
- Mechanical strength
- Solder wetting
- Component alignment
- Thermal damage
- Flux contamination
- Pad integrity

A poor repair might initially pass testing.

The customer leaves.

Several in-game days later:

> **CUSTOMER RETURN: Device failed again.**

The player may need to perform a warranty repair and suffer a reputation penalty.

This makes workmanship mechanically important.

---

# 15. Player-Caused Damage

Mistakes should have consequences.

Examples:

- Bridging test points with a probe
- Reverse polarity
- Installing the wrong component
- Installing a polarized component backwards
- Excessive soldering temperature
- Excessive hot-air temperature
- Excessive hot-air airflow
- Ripping a pad
- Damaging a trace
- Breaking a ribbon connector
- Stripping a screw
- Losing tiny components
- Applying excessive voltage
- Shorting power rails

A $70 repair could become a $240 motherboard replacement because of a careless mistake.

---

# 16. Previous Repair Attempts

Some customer devices should have been worked on previously.

The repair ticket might say:

> "My cousin tried fixing it."

Opening the device could reveal:

- Missing screws
- Incorrect screws
- Screws driven into the PCB
- Excessive flux
- Lifted pads
- Missing capacitors
- Crooked connectors
- Incorrect replacement parts
- Broken traces
- Poor jumper wires
- Damaged solder mask
- Excessive solder
- Cold joints

The player must determine:

1. What originally failed?
2. What did the previous repair attempt damage?
3. What must now be restored?

These jobs can create particularly entertaining streaming moments.

---

# 17. Schematics and Datasheets

Schematics should become increasingly important.

Early devices may include simplified diagrams.

Later devices may include:

- Full schematics
- Partial schematics
- Boardviews
- Block diagrams
- No documentation at all

For undocumented boards, the player may need to reverse-engineer portions of the circuit.

Example:

An unknown industrial controller arrives.

The player identifies an IC marking.

Using an in-game computer, they locate the datasheet.

The IC is identified as a buck regulator.

The player checks:

```text
VIN: 12.1 V
EN: 3.3 V
VOUT: 0 V
```

That creates a diagnostic hypothesis.

The player can then investigate the regulator and surrounding circuitry.

This turns real electronics troubleshooting into puzzle gameplay.

---

# 18. Example Diagnostic Scenario

## Console — No Power

**Customer report:**  
Device beeps briefly and shuts down.

**Previous repair attempt:**  
Yes.

**Potential payout:**  
$180.

The player decides where to begin.

Possible diagnostic steps include:

- Visual inspection
- Input voltage
- Fuse continuity
- Resistance to ground
- Power rail measurements
- Current consumption
- Thermal inspection
- Voltage injection

The game does not tell the player which step is correct.

A beginner may replace the power connector immediately.

An experienced player might first measure resistance across the primary power rail.

---

# 19. Stream-Friendly Gameplay

One of the major design goals should be making *Bench Tech* entertaining to watch.

A good repair naturally creates a story:

1. Device arrives
2. Player forms an initial theory
3. Evidence contradicts the theory
4. Player investigates further
5. A clue appears
6. The fault is discovered
7. Repair is attempted
8. Device is tested
9. Success or failure is revealed

Example:

A streamer receives a controller that will not power on.

They replace the USB connector.

It still does not work.

Viewers suggest checking the fuse.

The fuse is good.

The player measures the 5V rail:

```text
0.3 V
```

Current consumption:

```text
1.8 A
```

There is probably a short.

The player injects voltage.

Nothing is obviously hot.

They apply IPA to the board.

The IPA evaporates rapidly around one capacitor.

The player removes the capacitor.

Resistance returns to normal.

The controller boots.

That discovery produces the type of satisfying moment that works particularly well on stream.

Because faults can be procedural, another player repairing the same device might encounter an entirely different problem.

---

# 20. Business Simulation

The business layer should support the repair gameplay rather than dominate it.

Possible systems include:

- Repair payments
- Parts costs
- Consumables
- Tool purchases
- Rent
- Reputation
- Customer reviews
- Turnaround time
- Expedited repairs
- Warranty returns
- Parts inventory
- Job acceptance and rejection

Eventually, players could naturally specialize in areas such as:

- Game consoles
- Retro electronics
- Computers
- Audio equipment
- Mobile devices
- Industrial electronics
- Test equipment

Specialization should emerge through equipment, knowledge, inventory, and reputation rather than abstract skill-tree bonuses.

---

# 21. Possible Device Categories

Potential repair jobs include:

## Beginner

- Toys
- Flashlights
- Bluetooth speakers
- Controllers
- Small radios
- Simple power supplies
- USB devices
- Cables

## Intermediate

- Game consoles
- Computer peripherals
- Amplifiers
- Monitors
- Laptop power systems
- Battery chargers
- Bench equipment

## Advanced

- Laptops
- Graphics cards
- Industrial controllers
- Test equipment
- Complex audio equipment
- Embedded systems
- Multilayer boards
- High-density consumer electronics

---

# 22. Difficulty and Accessibility

The game should support players who simply want a satisfying repair experience while also providing significant depth for technically minded players.

Possible assistance options include:

### Guided Mode

- Suggested diagnostic steps
- Highlighted measurement points
- Simplified schematics
- Tool recommendations
- Explanation of readings

### Standard Mode

- Limited hints
- Normal schematics
- Player-directed troubleshooting

### Expert Mode

- Minimal assistance
- Realistic measurements
- Sparse documentation
- Complex failures
- Multiple faults
- Red herrings
- Previous repair damage

The underlying circuit can remain consistent across modes while the amount of assistance changes.

---

# 23. Educational Potential

Although *Bench Tech* should primarily be a game, it could naturally teach:

- Voltage
- Current
- Resistance
- Ohm's law
- Continuity
- Diodes
- Capacitors
- Resistors
- MOSFETs
- Regulators
- Power rails
- Short circuits
- Signal tracing
- Schematics
- Datasheets
- Soldering
- Hot-air rework
- Microsoldering
- Troubleshooting methodology

Players learn because understanding these concepts helps them solve repairs.

The game should avoid feeling like a textbook or formal electronics course.

---

# 24. Why the Hybrid Approach Matters

A fully realistic electronics simulator would appeal to a relatively small technical audience.

A completely simplified repair game risks becoming repetitive and shallow.

The hybrid design allows *Bench Tech* to begin as an approachable repair game and gradually reveal deeper systems.

A player might begin by learning:

> Broken connector = replace connector.

Later they learn:

> No power does not necessarily mean the power connector is defective.

Eventually they think:

> Input voltage is present and the enable signal is high, but this regulator has no output. I need to determine whether the regulator itself failed or whether something downstream is pulling the rail down.

That transformation is the core player journey.

---

# 25. Why Procedural Circuit Faults Matter

Procedural failures solve several important game-design problems.

## Replayability

The same device can fail differently each time.

## Streaming

Players and viewers cannot simply memorize every repair.

## Developer Playability

Even the developer may not immediately know which fault the generator selected.

## Learning

Players must understand diagnostic principles instead of memorizing scripted solutions.

## Content Expansion

New devices can reuse existing functional circuit blocks and failure systems.

The developer creates the electrical system.

**The failure generator creates the puzzle.**

---

# 26. Initial Prototype

The first prototype should be intentionally small.

Do **not** begin by building:

- A complete 3D repair shop
- Hundreds of devices
- A full business simulation
- Multiplayer
- Large equipment catalogs
- BGA simulation
- Advanced oscilloscope systems

Instead, build one fictional PCB.

### Prototype Board

Approximately:

- 30 components
- 5 functional circuit blocks
- Several test points
- A few power rails
- Simple input/output behavior

Possible blocks:

```text
POWER INPUT
    ↓
PROTECTION
    ↓
5V REGULATOR
    ↓
3.3V REGULATOR
    ↓
MCU
    ↓
OUTPUT DEVICE
```

### Prototype Tools

Start with:

- Multimeter
- Soldering iron
- Tweezers
- Visual inspection

Possibly add:

- Bench power supply

### Prototype Failure Modes

Create approximately ten failures, such as:

1. Blown fuse
2. Shorted capacitor
3. Open resistor
4. Failed regulator
5. Broken trace
6. Failed diode
7. Cracked solder joint
8. Shorted MOSFET
9. Damaged connector
10. Incorrect previous repair

The critical question is:

> **Is diagnosing this board fun?**

If the answer is yes, the hardest conceptual part of *Bench Tech* has been validated.

Everything else can grow outward from that foundation.

---

# 27. Long-Term Vision

A mature version of *Bench Tech* could combine:

- Electronics troubleshooting
- Repair simulation
- Microsoldering
- Procedural electrical faults
- Equipment progression
- Schematics and datasheets
- Light shop management
- Customer reputation
- Increasingly difficult devices
- Realistic but approachable electronics concepts
- Stream-friendly diagnostic puzzles

The central fantasy remains simple:

> **Start as someone who can replace a broken connector. Become someone who can diagnose almost anything placed on the bench.**

The player's most important upgrade is not the soldering station, oscilloscope, microscope, thermal camera, or BGA machine.

It is the knowledge they acquire while playing.

---

# 28. Hands-On Interaction & Minigame Systems

Hands-on interaction should be a core design pillar of *Bench Tech*.

The player should not spend most of the game selecting abstract actions such as **Test Voltage**, **Remove Board**, **Replace Component**, or **Power On** from menus. Whenever practical, the player should physically perform the repair and diagnostic actions.

These interactions should feel like parts of one continuous repair workflow rather than a collection of disconnected arcade minigames.

A typical repair might flow like this:

```text
Receive Device
    ↓
Inspect Exterior
    ↓
Choose Tools
    ↓
Disassemble Device
    ↓
Disconnect Cables
    ↓
Remove PCB
    ↓
Visual / Microscope Inspection
    ↓
Connect Diagnostic Equipment
    ↓
Take Measurements
    ↓
Form Diagnostic Hypothesis
    ↓
Perform Repair
    ↓
Clean and Inspect Repair
    ↓
Reconnect Required Hardware
    ↓
Power-Up Test
    ↓
Functional Test
    ↓
Reassemble Device
    ↓
Final Verification
    ↓
Return to Customer
```

The player can make mistakes throughout this process. Those mistakes can create additional faults, damage customer equipment, reduce repair quality, cause warranty returns, or simply waste time.

## 28.1 Disassembly

Disassembly should be interactive.

Possible mechanics include:

- Selecting the correct screwdriver or bit
- Removing screws individually
- Keeping track of screw locations
- Identifying hidden screws
- Releasing plastic clips
- Removing shields
- Removing heatsinks
- Disconnecting batteries
- Disconnecting ribbon cables
- Disconnecting board-to-board connectors
- Removing wiring harnesses
- Removing PCBs in the correct sequence
- Avoiding damage to fragile connectors and cables

Incorrect actions can create additional damage.

Examples:

- Using the wrong screwdriver damages a screw head
- Pulling a ribbon cable without releasing its latch damages the connector
- Excessive force breaks a plastic clip
- Removing a board before disconnecting a cable tears the cable
- Mixing screws creates problems during reassembly
- Installing an overly long screw in the wrong location damages a PCB

## 28.2 Screw and Parts Organization

The workbench can include a repair mat or parts tray.

Players can organize:

- Screws
- Shields
- Connectors
- Springs
- Buttons
- Small brackets
- Replacement components

Poor organization creates realistic risks during reassembly.

The classic repair-shop problem should be possible:

> The device is completely reassembled and one screw remains on the bench.

The player must decide whether to ignore it or disassemble the device again to determine where it belongs.

## 28.3 Reassembly

Reassembly should not simply be an automatic animation.

The player may need to:

- Reinstall the PCB
- Replace shields
- Route wires correctly
- Reconnect ribbon cables
- Reconnect batteries
- Install heatsinks
- Apply thermal compound or thermal pads
- Replace screws in their correct locations
- Reinstall buttons and mechanical parts
- Close clips
- Reinstall enclosure panels

Possible mistakes include:

- Forgotten connectors
- Pinched cables
- Incorrect screw placement
- Missing thermal pads
- Incorrect heatsink installation
- Loose screws
- Missing screws
- Incorrect cable routing

A device can potentially pass a partial bench test and then fail after incorrect reassembly.

## 28.4 Cable and Connector Interaction

Connecting equipment should be a physical interaction.

Examples include:

- Plugging in USB cables
- Connecting barrel-jack power supplies
- Connecting HDMI cables
- Connecting DisplayPort cables
- Connecting speakers
- Connecting batteries
- Attaching bench PSU leads
- Connecting oscilloscope probes
- Connecting multimeter leads
- Connecting logic analyzer leads
- Connecting test fixtures
- Connecting dummy loads

The player should have to identify the correct port, connector, or test point.

Some connectors have orientation requirements. Incorrect connections can produce realistic consequences.

## 28.5 Multimeter Interaction

The multimeter should behave like an actual diagnostic instrument.

The player can:

1. Pick up the meter
2. Connect leads to the correct meter jacks
3. Select the measurement mode
4. Position probes
5. Contact actual PCB points
6. Read the resulting measurement
7. Interpret what the reading means

Possible modes include:

- DC voltage
- AC voltage
- Resistance
- Continuity
- Diode test
- Current

Possible mistakes include:

- Incorrect meter mode
- Leads connected to the wrong jacks
- Probe slips
- Accidentally bridging adjacent points
- Measuring resistance on a powered circuit
- Attempting current measurement incorrectly

Probe placement should matter.

The game should avoid excessive artificial hand instability, but precision should become increasingly important as components become smaller.

## 28.6 Oscilloscope Interaction

Oscilloscope use can become an advanced diagnostic interaction.

The player may need to:

- Connect the probe
- Connect ground
- Select a test point
- Adjust volts per division
- Adjust timebase
- Configure triggering
- Select coupling
- Observe the waveform
- Compare the waveform with expected behavior

Possible diagnostic targets include:

- Clock signals
- PWM
- Switching regulators
- Ripple
- Reset signals
- Crystal oscillators
- Communication buses
- Power sequencing
- Intermittent signals

The challenge is not merely obtaining a waveform. The player must understand whether the waveform is correct.

## 28.7 Bench Power Supply Interaction

The player can physically configure and connect a bench PSU.

Possible actions include:

- Set output voltage
- Set current limit
- Connect positive lead
- Connect ground
- Enable output
- Observe voltage
- Observe current draw
- Adjust current limit
- Inject voltage into a rail

Incorrect voltage injection can damage components.

Current limiting therefore becomes an important gameplay concept rather than simply a visual detail.

## 28.8 Thermal Diagnostic Interaction

Thermal troubleshooting can involve:

- Powering the board
- Scanning with a thermal camera
- Applying IPA
- Applying freeze spray
- Injecting voltage
- Watching for abnormal heating
- Comparing temperatures between components

Example:

```text
5V rail measures 0.8 Ω to ground
        ↓
Set PSU to 1.0 V
        ↓
Set conservative current limit
        ↓
Inject voltage into rail
        ↓
Observe current draw
        ↓
Apply IPA / inspect thermally
        ↓
C37 heats rapidly
        ↓
Test C37
        ↓
Remove C37
        ↓
Measure rail again
```

This transforms short-circuit diagnosis into an interactive process.

## 28.9 Visual Inspection

Visual inspection should be a real diagnostic activity.

The player can:

- Rotate the device
- Change viewing angle
- Use bench lighting
- Use magnification
- Move the PCB under a microscope
- Adjust microscope zoom
- Adjust microscope focus
- Inspect both sides of a board

Possible discoveries include:

- Burned components
- Corrosion
- Cracked solder joints
- Missing components
- Broken connectors
- Lifted pads
- Damaged traces
- Bent pins
- Liquid residue
- Previous repair attempts
- Foreign objects

Visual evidence should sometimes be useful and sometimes misleading.

## 28.10 Soldering Interaction

Soldering should require player participation rather than a simple progress bar.

Possible interactions include:

- Select tip
- Set temperature
- Apply flux
- Position iron
- Heat joint
- Feed solder
- Control dwell time
- Remove solder
- Use solder wick
- Use a solder sucker
- Inspect the completed joint
- Clean flux residue

The simulation can evaluate:

- Wetting
- Solder quantity
- Joint temperature
- Contact area
- Dwell time
- Mechanical strength
- Bridging
- Pad condition

The controls should reward proper technique without deliberately making the mouse difficult to control.

## 28.11 Hot-Air Rework Interaction

Hot-air work can include:

- Select nozzle
- Set temperature
- Set airflow
- Apply flux
- Preheat board
- Move hot-air tool around the component
- Observe solder transition
- Lift component with tweezers
- Clean pads
- Apply solder or paste
- Position replacement component
- Reflow
- Inspect alignment

Potential mistakes include:

- Excessive temperature
- Insufficient heating
- Excessive airflow
- Heating neighboring components
- Moving nearby passives
- Damaging plastic connectors
- Lifting pads
- Misaligning the replacement component

Tiny components can realistically be blown away if airflow is excessive.

## 28.12 Microsoldering Interaction

Microsoldering should increase precision requirements while retaining usability.

Possible activities include:

- Microscope positioning
- Zoom and focus
- 0402 replacement
- 0201 replacement
- Fine-pitch IC work
- QFN rework
- USB-C connector replacement
- HDMI connector replacement
- Pad reconstruction
- Trace scraping
- Jumper-wire installation
- Solder mask application
- Fine enamel-wire work

Advanced jobs can combine multiple microsoldering techniques.

## 28.13 Trace and Pad Repair

Damaged boards can require reconstruction.

The player might:

1. Inspect the damaged area
2. Determine where the original trace connected
3. Scrape solder mask
4. Tin exposed copper
5. Rebuild a pad
6. Install jumper wire
7. Anchor the repair
8. Verify continuity
9. Inspect under magnification

This can become one of the most advanced skill-based repair activities.

## 28.14 Cleaning Interaction

Cleaning should have a practical purpose.

Possible tools include:

- IPA
- Flux remover
- Brushes
- Cotton swabs
- Lint-free wipes
- Compressed air

Cleaning can reveal:

- Corrosion
- Damaged traces
- Poor solder joints
- Residue hiding component markings

Cleaning after soldering can also improve final repair quality and inspection.

## 28.15 Power-Up Testing

Powering the repaired device should be an actual moment of tension.

The player may need to:

- Reconnect the battery
- Plug in the power adapter
- Connect the bench PSU
- Connect AC power
- Attach required peripherals
- Enable the PSU
- Press the power button

The game can then expose:

- Current draw
- Indicator LEDs
- Fan behavior
- Display behavior
- Startup sounds
- Error codes
- Thermal behavior
- Smoke or component failure when something has gone badly wrong

The player should have the option to shut power down immediately if the readings look dangerous.

## 28.16 Functional Testing

A device merely powering on does not mean it has been repaired.

Different device classes can have specific functional tests.

### Game Console

- Connect HDMI
- Connect controller
- Insert or launch game
- Test USB ports
- Test networking
- Observe temperature
- Run under load

### Audio Amplifier

- Connect source
- Connect speakers or dummy load
- Verify channels
- Measure output
- Test controls
- Listen for distortion

### Power Supply

- Measure output voltage
- Attach electronic load
- Increase load
- Observe regulation
- Measure ripple
- Test protection behavior

### Controller

- Connect to test system
- Test buttons
- Test triggers
- Test analog sticks
- Test vibration
- Test charging
- Test wireless connection

### Laptop

- Connect charger
- Verify charging
- Boot system
- Test display
- Test ports
- Test keyboard
- Test battery operation
- Apply CPU/GPU load
- Monitor thermals

Functional testing can uncover secondary faults that were not part of the initial customer complaint.

## 28.17 Tool Handling Philosophy

Hands-on mechanics should create involvement without becoming tedious simulations of every finger movement.

The guiding principle should be:

> **The player performs the meaningful technical decisions and actions, while the game abstracts repetitive physical motions that do not add interesting decisions.**

For example, the player should choose the screwdriver bit and identify which screws to remove, but they should not necessarily need to manually rotate the mouse twenty times for every screw.

Likewise, soldering should require proper heat, positioning, flux, and solder application without becoming a frustrating hand-stability simulator.

## 28.18 Difficulty Scaling for Hands-On Systems

Assistance can decrease with difficulty.

### Guided

- Correct tools suggested
- Test points highlighted
- Probe snapping
- Screw locations remembered
- Connector warnings
- Recommended temperatures shown

### Standard

- Limited hints
- Moderate probe assistance
- Player manages tools and parts
- Most mistakes possible

### Expert

- Minimal highlighting
- Little or no probe snapping
- Realistic equipment setup
- Wrong meter settings matter
- Incorrect power connections matter
- Parts organization matters
- Reassembly errors matter
- Diagnostic documentation may be incomplete

This allows casual players and electronics enthusiasts to use the same underlying game systems.

---

# 29. Selected Engine Direction: PlayCanvas

The current engine direction for *Bench Tech* is **PlayCanvas**, with the game designed primarily as a browser-native 3D experience.

This choice is based on the needs of the project rather than assuming prior hands-on coding familiarity. The previous game was created in PlayCanvas through AI-assisted development, with Claude handling the code. *Bench Tech* is expected to use a similarly AI-assisted development workflow.

PlayCanvas remains attractive because the game is intended to be:

- Immediately playable in a browser
- Easy to share with players and stream audiences
- Capable of detailed 3D scenes
- Built around interactive objects
- Compatible with JavaScript/TypeScript
- Deployable without requiring a persistent game server
- Hostable using low-cost or free static web infrastructure
- Suitable for a heavily AI-assisted coding workflow

The engine choice can be reevaluated if early prototyping exposes limitations.

## 29.1 Proposed Technical Stack

| System | Initial Direction |
|---|---|
| Game Engine | PlayCanvas |
| Primary Language | TypeScript / JavaScript |
| 3D Asset Creation | Blender |
| Circuit Simulation | Custom TypeScript system |
| Fault Generation | Custom procedural fault system |
| Device Definitions | Data-driven JSON or equivalent |
| Save Data | Local browser storage / IndexedDB initially |
| Multiplayer | None for initial prototype |
| Backend | None required initially |
| Distribution | Browser-first |
| Hosting | Static hosting where practical |
| AI-Assisted Development | Claude or comparable coding agent workflow |

## 29.2 Hybrid 3D / Focused Interaction Design

*Bench Tech* does not necessarily need every activity to occur through unrestricted first-person 3D manipulation.

A hybrid interaction model can provide better usability.

### Workbench View

Full 3D environment for:

- Device placement
- Tool selection
- Disassembly
- Equipment setup
- Cable connections
- General inspection

### Focused PCB View

A controlled close-up view for:

- Probing
- Component inspection
- Soldering
- Hot-air work
- Trace repair
- Microsoldering

### Microscope View

Highly magnified interaction for:

- Fine-pitch components
- 0402 and 0201 parts
- Pad reconstruction
- Jumper wires
- Fine trace repair

### Instrument Views

Dedicated interfaces for:

- Multimeter
- Oscilloscope
- Bench PSU
- Logic analyzer
- Electronic load
- Thermal camera

This approach maintains the physical feeling of a repair bench without requiring every interaction to be implemented as unrestricted physics-based hand manipulation.

## 29.3 Separation of Game and Circuit Simulation

The electrical simulation should be designed as a separate logical system from the 3D presentation.

Conceptually:

```text
PLAYCANVAS PRESENTATION
        │
        ├── Workbench
        ├── Devices
        ├── Tools
        ├── Animations
        ├── UI
        └── Player Interaction
                 │
                 ▼
        GAMEPLAY INTERACTION LAYER
                 │
                 ▼
        CIRCUIT SIMULATION ENGINE
        ├── Components
        ├── Nets
        ├── Functional Blocks
        ├── Measurements
        ├── Fault States
        ├── Thermal Behavior
        └── Power States
                 │
                 ▼
        PROCEDURAL FAULT SYSTEM
```

This separation is important because it allows the electronics simulation to be developed and tested independently of graphics.

It also makes it easier to:

- Add new devices
- Add new faults
- Unit-test electrical behavior
- Generate procedural repair scenarios
- Change rendering or interaction systems later
- Potentially reuse portions of the simulation outside the game

---

# 30. Revised First Prototype

The first prototype should test both the **diagnostic puzzle** and the **hands-on interaction loop**.

The prototype should contain:

## One Device

A small fictional electronic product with:

- Enclosure
- Screws
- One or more connectors
- PCB
- Approximately 20–30 meaningful components
- Several functional circuit blocks
- Several test points

## Basic Workbench

Include:

- Repair mat
- Screwdriver
- Tweezers
- Multimeter
- Soldering iron
- Flux
- Solder
- Cleaning supplies
- Power source

## Initial Interactive Sequence

The player should be able to:

1. Receive the repair ticket
2. Inspect the device
3. Select a screwdriver
4. Remove screws
5. Open the enclosure
6. Disconnect a cable
7. Remove the PCB
8. Inspect the PCB
9. Configure a multimeter
10. Probe real test points
11. Interpret measurements
12. Identify the failed component
13. Apply flux
14. Remove or solder the component
15. Clean the repair
16. Measure the circuit again
17. Reinstall the PCB
18. Reconnect the cable
19. Partially reassemble the device
20. Plug in power
21. Perform a power-up test
22. Perform a functional test
23. Finish reassembly
24. Complete final verification

## Prototype Faults

The first board should support approximately ten faults:

1. Blown fuse
2. Shorted capacitor
3. Open resistor
4. Failed regulator
5. Broken trace
6. Failed diode
7. Cracked solder joint
8. Shorted MOSFET
9. Damaged connector
10. Incorrect previous repair

The prototype succeeds if this complete loop is enjoyable:

> **Open it → inspect it → measure it → understand it → repair it → test it → put it back together.**

If that loop is satisfying with one device and a handful of tools, the core of *Bench Tech* works.

