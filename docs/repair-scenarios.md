# Repair scenarios from the research videos

Distilled from 22 repair-video transcripts (Oct 2026). Everything here is **summarised in our own words**, with **parody names only**. The transcripts themselves stay out of the repo. Use this as the menu when designing new boards and fault variants.

**Tiers** (same as the game): ★ easy / visible · ★★ needs measuring · ★★★ expert.
**In game?** ✅ already modelled · 🟡 partly · ❌ not yet.

Parody names used below: *Funstation 4 / 4 Pro / 5 / 5 Pro* (home consoles), *Sbox One S / Series S / Series X* (home consoles), *Button / Button Lite / Button OLED / Button 2* (hybrid handhelds) with *Grip* controllers, *DualPulse* (console controller), *Rogue Pal* (handheld gaming PC), *Retrobit RB35* (cheap emulation handheld), *Play Kid / Pocket / Color / Advance / Advance SP / Micro / Light* (retro handhelds), *DuoScreen / Lite / i / i XL / 3D / 3D XL / 2D / 2D XL* (dual-screen handhelds), *Game & Clock* (LCD game), *Critter Mini* (rare tiny handheld), *Galaxy Raid* (1979 cocktail arcade), *SoundHalo* (Wi-Fi smart speaker), *ThermiHub* (smart heating hub), *VoltMax 1000* (12 V → mains inverter).

---

## 1. Home consoles (Funstation / Sbox)

### 1.1 HDMI port — the bread-and-butter job ✅
- **Customer says:** "No picture", "picture cuts out when I touch the cable", or the port is visibly bent.
- **What the tech sees:** a bent outer shell, a tongue pushed in, or pins cracked off at the board. Sometimes the port is fine from the front but **9 pins have loose joints** behind it.
- **Variants:**
  - **Shell bent, pins fine (★):** it still works, but the port gets replaced anyway.
  - **Cracked joints (★★):** reflow the pins only, no new port needed.
  - **Legs snapped off inside the board holes (★★):** the broken legs must be cleared out of the holes first.
  - **Previous swap was misaligned (★★):** two pins nearly touching, so the picture and even power-on are intermittent. Fix by lifting and reseating the *same* port.
  - **A tiny cap next to the port knocked off during removal (★★):** pull a replacement from a donor board.
- **Fix:** lots of hot air from underneath (very thick boards, 480 °C at full airflow), then tin the pads with leaded solder so the old lead-free melts lower. Seat the new port with only a light tap, let the solder wick up the legs, then wiggle-test each pin with a pick.
- **Twists:**
  - **Too much flux in the port** dries into a film inside it, causing intermittent picture after the repair and a warranty comeback weeks later. The Sbox ports sit high on long legs, so they're immune.
  - **Hidden ground anchor tabs** keep the port stuck even when the pins look molten.
  - **Pace:** a good tech does it in about 30 minutes, which is the core of a profitable repair shop.

### 1.2 White light, no picture, port is fine → HDMI encoder/retimer chip 🟡
- **Diagnosis:** check each HDMI pin in diode mode against the known-good values, and check the small filter parts near the port (a pF cap, a 100 nF cap, a 5.6 V zener and a 27 k resistor). Shorts on the encoder chip also change the standby current draw (see §8).
- **Fix:** replace the encoder chip (★★★). Some techs harvest one from a dead board, since several model generations share the same chip family.

### 1.3 "No power" that isn't
Many "no power" listings turn out to be something else:
- **Power light so dim the owner thought it was dead (★):** the Funstation 4 Pro LED is very faint.
- **Broken tactile power button on the board (★★):**
  - The replacement is a small switch soldered next to plastic, so heat it from underneath only.
  - The ordered pack of 5 arrived as 1, and it wasn't quite the right size. It also failed again just before sale, so it had to be redone.
- **Dead or corrupt storage drive (★★):**
  - Symptoms: beep-on/beep-off, or an error code on screen (E106-style).
  - The drive *reads fine on a PC* but the console rejects it. Swap the drive and reinstall the system software from USB.
  - On a low-value console the 1 TB drive can be worth more than the console itself.
- **A software update or factory reset fixes it (★):** an Sbox that shut off after 30 seconds, and another stuck at "preparing 50%" with E200, both came good after a full reset and update.

### 1.4 Overheating — three beeps and shut down
- **Dust and pet hair clogging the heatsink and PSU vents (★):**
  - Strip right down, brush and vacuum, clean the case.
  - Also check the liquid metal for a **dry spot** (unspread area on the processor or heatsink) and re-spread it.
- **Fan connector torn off the board by a previous opener (★★):**
  - The fan never spins, so it overheats within minutes.
  - Scrape the solder mask to make new anchor pads, run a jumper wire for the missing trace, then solder on a new connector.
- **Extreme filth:** a dead mouse inside one unit, and a power supply caked in something wet. The PSU got swapped "to be safe" before selling.
- **Optional extras:** a scratched-up shell, a stripped stand screw hole (swap the metal plate from a donor).

### 1.5 Power-supply-side faults 🟡
- **12 V present at the board connector, fuses good, standby rails all good, still dead (★★★):**
  - Points to the I/O controller ("south bridge"), the firmware chip, or other chips that can't be fixed.
  - Blown caps near the Ethernet jack suggest a **lightning strike through the network cable**. This one was declared unfixable.
- **Coil whine / buzzing (customer complaint, not a fault):**
  - It came from a film capacitor in the PSU. There's no fix.
  - **Game idea:** a "can't fix, explain it to the customer" outcome.

### 1.6 Beep-on, beep-off → read the error log (★★★) ❌
- Solder wires to the board's **serial debug pads**, read the error code, and look it up.
- **APU ↔ RAM communication error:**
  - Inspect the processor die for cracks, which means game over if found.
  - Then swap RAM chips one at a time on a **preheater** (it stops the board warping). Each new chip is reballed with a stencil, then the code is re-checked.
  - Hours of work. This one got written off as a sunk cost and kept for a livestream.
- **Pro model, RAM bank 3 (★★★):**
  - The Pro uses a **faster RAM speed grade** than the standard model, so a donor chip from a normal board won't do. The chip was ordered from abroad, a two-week wait.
  - After fitting it a *new, unknown* code appeared. The tech's own solder joint was bad; a reflow brought it to safe mode.
  - The system software then needed reinstalling **several times** before it booted.
- **"Blue light of death"** (pulses, never turns white): all rails fine. It's the APU, RAM or SSD controller, which is the hardest class.
- **Paired chips:** the processor and the disc-drive controller chip are **locked to their board**. If one dies, the board is a parts donor.

### 1.7 Disc drive faults ✅ (mechanical, no soldering)
- **Takes the disc but won't spin up or read (★):** replace the laser assembly. Clean the loading rollers while you're in there.
- **Grinding noises, won't load or eject (★★):**
  - The manual eject screw only turns one way, so the drive motor has failed.
  - Harvest the motor/gear assembly from a donor drive by desoldering two wires.

### 1.8 Self-inflicted damage (the tech breaks something) ❌
- **Ripping the PSU's 5 V board connector off while removing the power supply:**
  - The pads and ground anchors come up with it.
  - Rebuild with wick braid as anchor pads plus thick wire, conformal-coat it, then solder the connector back on.
  - Verify every pin in diode mode before powering on.
- **Plugging an arcade board stack together upside down:**
  - 12 V and −5 V go where they shouldn't, frying a rare clock line driver and two counter chips.
  - Weeks of waiting for parts followed.
- **Breaking a controller's button ribbon while replacing a stick:** SL/SR buttons and LEDs stop working, so the rail assembly has to be replaced.

---

## 2. Hybrid handhelds (Button family)

### 2.1 Won't charge / no power — read the USB meter first ✅🟡
A USB-C power meter between charger and device is the first test.
- **Healthy:** voltage jumps 5 V → 15 V (fast-charge negotiation), current rises, then settles.
- **Stuck at 5 V, never 15 V:** the port or its negotiation pins are bad.
- **Current climbs to about 95 mA, cuts out, repeats:** something is shorting during power-up. Unplugging the daughterboard stops the loop, which proves the fault is on that board.
- **15 V at 0.48 A, no display, no shorts anywhere:** the fault is under the main chips. Swap the board.
- **15 V, then 0.05 A, then 0 A, battery at 0 V:**
  - Shorts in several places. Moving the charge chip over from a donor didn't help (the charge chips aren't sold), so it was declared not yet fixable.

### 2.2 Liquid damage at the USB-C port (★★) 🟡
- Corrosion **inside the port** bridged two pins, got hot and charred the board under it.
- **Fix:**
  - Remove the port.
  - Scrape the char back to clean copper; it was only surface damage.
  - Retin the pads and fit a new port. Both ports on the Button 2 had to be replaced.
- **Twists:**
  - The board is thin and flexes, and heat builds up there.
  - The port must be pushed **down and back** onto the pads. It took three attempts before every pin landed.
  - Dust inside the port can look like corrosion, which is a red herring.

### 2.3 Sound but black screen ✅
- **Backlight connector corroded (liquid came in through a vent):**
  - The shielding saved the main board.
  - Fix by moving the board into a donor shell/screen, and swap the shielding too.
- **Corroded backlight connector shorting the rail (Button Lite) (★★):**
  - An eaten trace and a shorted pin.
  - Fix: replace **both** backlight connectors with donor parts, jumper the trace, coat it.
  - The home button nearby was also corroded. Lesson: just replace the daughterboard.

### 2.4 Other Button jobs
- **Game cartridges not reading (★):** corroded card-reader pins from a spill. Swap the reader module; it also carries the touch-screen connector, so re-test touch afterwards.
- **Grip controllers:**
  - Stick drift → replace the stick.
  - A "puffy" (swollen) Grip battery.
  - Brittle rail ribbon cables break when opened.
- **Cracked screen (★):** swap the whole front assembly (OLED model).
- **"Water-damaged, won't turn on" → just a flat battery (★):** charge it and it works. A classic no-fault-found.
- **Board fault under the main chips (★★★):** board swap from a known-good donor (labelled "W" for working). The aftermarket battery connector didn't seat on the old board but did on the donor.

---

## 3. Handheld gaming PC (Rogue Pal)

- **"Ghost touch" was really right-stick drift (★):** replace the stick, update drivers and firmware, calibrate both sticks. The seller's fault description was wrong.
- **No power, orange charge light, about 380 mA (★):** the battery is completely flat (0 V). Fit a known-good battery and it boots; a firmware update downloads immediately.
- **Black screen with boot sound, spongy trigger, battery not detected (★★):**
  - **Trigger:** broken plastic; swap from a donor.
  - **Battery:** "not detected" (flashing light); swap.
  - **Screen:** proven by booting with the SSD out (it reaches the setup screen) and then fitting a donor screen.
  - One unit had all three faults.
- **Storage is encrypted to the device:** a cloned SSD won't boot in another unit.

---

## 4. Cheap emulation handheld (Retrobit RB35)

- **Brand new, won't charge (★★★, but a satisfying one):**
  - The USB meter shows 0 A. The battery is fine at 3.5 V and the sense resistor is OK.
  - Using the charge chip's datasheet, the charger input is switched by a P-MOSFET whose gate is held up by a transistor.
  - A tiny **resistor in that bias network is missing or burnt**, probably from a high-power charger.
  - **Proof:** bridging the MOSFET with the meter in current mode starts charging.
  - **The twist:** the correct value is unknown. 10 kΩ does nothing, 2.2 kΩ works, and 3 kΩ was what was in the drawer. It charges at 1.2 A afterwards.
  - The thermal camera showed nothing hot, a good example of "the thermal camera doesn't catch everything".

---

## 5. Controllers (DualPulse)
From a bulk buy of 8:
- **Stick pinned to one side on one axis (★★):** one potentiometer has a corroded/burnt wiper. Replace just that potentiometer, taken off a new stick (one part covers two repairs).
- **No power, missing caps and buttons (★★★):**
  - It draws 0.07 A where a good one draws 1.7 A, and swapping the battery changes nothing.
  - **Reflowing the main BGA chip** (nudge it to confirm the solder balls are molten) brought it back.
  - Then clean the sticks with contact cleaner, and swap the shell and trigger from a donor.
- **Touch-pad button dead (★):** its ribbon is torn. Swap the touch-pad assembly.
- **Trigger not registering (★):** broken return spring; replace the spring.
- **A group of buttons dead (★★):** the conductive membrane's contact bumps are worn flat. Cleaning the ribbon didn't help; replacing the membrane did.
- **Stick has limited travel (★):** dropped, the board is bent and a locating pin is bent. Bend it straight.
- **USB-C smashed, tongue pushed into the case (★★):** transplant the port from a parts board.
- **One of the eight had nothing wrong** (no fault found).

---

## 6. Retro handhelds (Play Kid / DuoScreen / Game & Clock / Critter Mini)

- **Leaked-battery corrosion (★–★★):** the most common retro fault.
  - Treatment: soak in vinegar, scrub, IPA, magic eraser on the contacts.
  - **Rusted battery springs** have to be replaced; re-plating won't stick once rust is under it.
  - On the Play Kid Color the corrosion **ate pads and traces**. Rebuild the fuse and filter section with jumper wires and new parts, and fit a new speaker because its wires had rotted off.
- **Board and screen too far gone (★★):** Play Kid Advance. Fit a replacement board plus screen; it counts as half a fix.
- **Bulged battery → no power (★):** Play Kid Advance SP, and the Micro (lights flash then die). A new battery fixes both. The SP's shell was too scratched to sell, so it was turned into a modded "reshell".
- **Lines or a blank top screen (★):** DuoScreen, Play Kid Light. Replace the screen.
- **DuoScreen i XL no power (★★):** the **top screen** was dead, which stops the unit booting at all. Swap the cheap suspects first, in order: power board → Wi-Fi board → bottom screen → top screen.
- **DuoScreen 3D XL, sound but no displays (★★):** the **camera ribbon** was faulty. Booting with it disconnected proves it. Replacing it means threading a ribbon through the hinge.
- **Dropped DuoScreen Lite (★★):** a loose capacitor was rattling in the case and another had come off its pads. Resolder both and straighten the bent board.
- **L/R buttons "dead" (★):** the ribbon was never plugged back in by a previous opener.
- **Previous repair (★★):**
  - The R-button switch was held on by solder mask and a scrap of wick, **not actually soldered**.
  - Fix: resolder it and add a ground wire.
- **Game & Clock faded LCD (★):** the reflector film behind the LCD has degraded. Replace the polariser/reflector stack; some segments stayed weak.
- **Cartridge slot not reading (★):** soda in the slot. Clean the pins, bend low pins up, use contact cleaner.
- **Stripped screws (★):** grind a slot to unscrew, or sacrifice the bottom shell and transfer the serial-number sticker.
- **Critter Mini:** catastrophic corrosion, with components fallen off into the foam. **Unfixable**, and with no donor the rare item is a total loss.

---

## 7. Other electronics

- **SoundHalo smart speaker, dead power supply, previous repairer gave up (★★★):**
  - **Visual and continuity checks:** mains fuse, bridge diodes, sense resistor and MOSFET all fine. A **510 Ω start-up resistor** feeding the switching chip's supply is open; replace it.
  - **Still dead:** inject 18 V at 100 mA straight into the switching chip's supply pin and scope the gate-drive pin: flat. The chip died *because* of the resistor (a cascade failure). Replace it, using low-melt solder to spare the nearby caps.
  - **Result:** outputs of 20 V and 8.5 V appear and the speaker plays.
  - **Safety:** power up through a **dim-bulb tester** so a short just lights a lamp.
- **ThermiHub smart heating hub, slow power light then nothing (★★★):**
  - **Previous owner:** swapped the network chip and left three pins unsoldered because the chip sat high on leftover solder. Hot air, press down, wick the excess, drag-solder the pins.
  - **Real fault:** scoping the board's debug header finds serial output. A terminal shows the operating system **can't mount its SD-card filesystem**.
  - **Fix:** back up the card, repair the filesystem on a PC, refit it, and it boots.
  - **Game idea:** a firmware/storage fault, with a serial console as a diagnostic tool.
- **VoltMax 1000 inverter from e-waste (★★★):**
  - **Start:** the power leads were cut off; reuse the leads from a scrapped unit. Fuses are blown, and the owner had fitted the wrong type.
  - **Testing:** diode-check the MOSFETs in circuit (short), then pull them all and test out of circuit. Three low-side and two high-side MOSFETs are dead. **Replace every MOSFET in a group, not just the dead ones**, because the survivors are stressed.
  - **Before fitting new parts:** check the gate resistors and driver transistors. A voltage reference *looks* shorted in circuit only because a trace links two of its pins. Scope the gate drive with the MOSFETs out first.
  - **Twists:**
    - Replacement MOSFETs are an upgraded equivalent part number.
    - The microcontroller is **copy-protected**: if it dies, the unit is unrepairable.
    - Load test with a grinder on a car battery.
    - Power electronics give no second chance; a mistake goes bang.
- **Galaxy Raid 1979 cocktail arcade, logic board (★★★, multi-session):**
  - **Symptom:** the same 16 lines repeat down the screen. Scope the video counter chips; one has good inputs but bad outputs → replace it into a socket.
  - **Preventive work:** recap the board, replace snapped decoupling caps, clean corroded EPROM legs.
  - **Previous repairs:** one EPROM has a missing leg; a socket was fitted backwards.
  - **Old parts:** the EPROMs need a three-voltage programmer.
  - **Self-inflicted disaster:** the stack was plugged together wrongly (see §1.8), killing a rare line driver (shipped from abroad) and two counters stuck at 2.5 V.
  - **Then:** a line through every sprite (a data-shifter chip), missing explosion sound (the noise-generator chip), and a stuck latch.
  - **Finally:** crackly sound from **worn single-leaf IC sockets**; replace them with dual-leaf sockets.

---

## 8. Diagnostic signatures worth modelling

### Current draw at standby from a bench supply
Funstation 5 board fed 12 V from a lab supply (2 A limit), power not pressed:

| Current | Points to |
|---|---|
| Jumps to 321 mA, settles at 7–10 mA | Healthy standby |
| 0 mA | Firmware chip, fuses, PSU, or a short on 12 V |
| 50 → 15 mA | Short near the I/O controller |
| Stuck at 5 mA | Short at the HDMI encoder |
| 7 → 27 mA | I/O controller |
| Stuck at 7 mA | Power-management chip, crystals (25 MHz / 32 kHz), firmware-chip communication |
| 7 ↔ 12 mA looping | Short on the 1.1 V rail |
| 35 mA steady | Short on the 1.9 V rail |
| 175 or 225 mA → 7–10 | SSD controller |
| 270 mA plus a beep on power | Wi-Fi chip |
| 350 / 315 mA | 3.3 V rail or Wi-Fi |

**Game use:** a bench supply readout that settles into a pattern, plus a "boot current" guide in the service sheet.

### Other techniques
- **Power button:** it pulls a 3.3 V standby line low. No 3.3 V means no sign of life at all.
- **Enable vs power-good:** each regulator needs **EN** in, and outputs a **PG** signal that becomes the next stage's EN.
- **Isolating a shorted rail:**
  - Lift the inductor to split the rail, then measure which side holds the short.
  - On multi-phase supplies, lift each phase's coil in turn, then inject voltage to find the hot MOSFET.
  - The RAM rail's coil should read about 40 Ω to ground; much lower means a RAM fault.
- **Low-impedance rails** beep in continuity mode (about 1 Ω) without being shorted. Big rails fool beginners.
- **Coin-cell battery found flat:** something on its line (often the I/O controller) is leaking.
- **USB power switches:** check EN, IN and OUT.
- **Unmarked fuses:** they carry codes you look up to order the right one.
- **USB-C meter:** 5 → 15 V negotiation, plus the current curve, separates "dead port", "board fault" and "flat battery".
- **Serial debug port:** error codes (consoles) or boot logs (Linux devices).
- **Datasheet hunting:** read the marking code → find the chip → follow pins with continuity.
- **Known-good comparison:** a working board of the same model is the best reference for diode readings and current draw.

---

## 9. Cross-cutting patterns (game mechanics)

### What a board can hide
- **No fault found:** surprisingly common, about 1 in 4 of a liquidation lot. Sellers label things "no power" when it's a flat battery, a dim LED, a bad cable or a needed update. The tech must still test thoroughly before reselling, or risk an unknown fault coming back.
- **Lying listings:**
  - "Never opened" — but the warranty sticker is broken, the screws are chewed, the thermal compound is wrong, and there's dried liquid.
  - A forged "unopened" sticker hiding a claimed retimer swap that was never done.
  - **Game idea:** inspect on arrival, then open a dispute and **negotiate a partial refund**.
- **Previous-repair damage:**
  - Bad joints and parts left unsoldered.
  - Wrong-length screws punching into the multi-layer board.
  - Cables left unplugged, connectors torn off, the wrong fuse fitted.
- **Liquid damage:** usually local (near a port or vent). Shielding often protects the main board. The water-indicator sticker helps triage. Some boards are a "nope", total loss.
- **Battery-leak corrosion** on anything retro with AA cells.
- **Cascade failures:** one small part dies and takes a chip with it. Fixing the first finds nothing; the tech has to dig deeper.

### The tech's own mistakes
- **Over-fluxing** causes comebacks.
- **Heavy-handed disassembly** tears connectors.
- **Mis-plugging** boards destroys parts.
- Each is a skill risk that should scale with care, not luck.

### Parts and logistics
- **Waiting on parts:**
  - Rare chips ship from abroad over weeks.
  - Sellers short-ship (ordered 5, got 1), or send the wrong size.
  - Model-specific parts (Pro RAM grade) can't come from donors of the base model.
- **Donor economy:**
  - Write a unit off and keep it for parts.
  - Label donor boards as tested working.
  - One written-off unit's screen fixes the next one.
  - Several Grip rails, trigger plastics, shells, drive motors and lasers came from donors.
- **Unrepairable classes:** paired processor or drive chip, copy-protected microcontroller, BGA RAM with no codes, total corrosion. These become **sell-as-faulty** (recover part of the cost) or donors.

### Selling and warranty
- **Selling math:**
  - Platform fee about 9%, plus postage and packaging time.
  - **Estimated vs actual sale price:** often a few pounds under.
  - Low-value consoles take 2 hours for about £20 of profit, so they're not worth it unless bought cheap in bulk.
  - Profit per hour is the real metric.
  - Full boxed sets sell for more.
  - New devices sell fast during hype.
  - Fixing for customers beats flipping; customer updates matter as much as skill.
- **Warranty edge cases:**
  - A buyer reports a failure 3 months later and has opened it themselves (sticker gone).
  - The platform's return window has closed.
  - Refund anyway to protect your reputation, or refuse?
  - A policy decision: stop selling repairs with a high comeback rate (that power-chip swap failed in 4 of 5).

---

## 10. Candidate new boards (ranked for the game)

| # | Board (parody) | Why it's good | Signature scenarios | New sim / UI needed |
|---|---|---|---|---|
| 1 | **DualPulse controller** | Cheap, common, quick wins; teaches parts-swap repairs | stick-potentiometer drift, trigger spring, torn touch-pad ribbon, worn membrane, USB-C port, BGA reflow for no-charge | Mechanical parts (springs, membranes) as plug-in modules; drift as an analog reading |
| 2 | **Button Lite** | Daughterboard isolation + USB meter story | corroded backlight connector shorting a rail (boot loop at 95 mA), eaten trace, corroded buttons, cartridge reader, flat-battery no-fault-found | A boot-loop current graph on the USB meter; a disconnectable daughterboard |
| 3 | **Funstation 5 (power/standby section)** | The diagnostic-chart board | standby current signatures, missing 3.3 V standby, shorted rail isolation by lifting a coil, Ethernet lightning damage, coin-cell drain | Power-good chain (EN → PG), "lift inductor" action, bench supply current trace |
| 4 | **Retrobit RB35** | The datasheet-detective charging fix | missing MOSFET bias resistor (unknown value: try values), corroded USB-C | A "try a value" resistor kit; datasheet pages in the service sheet |
| 5 | **SoundHalo PSU** | Mains switch-mode power supply with a cascade failure | open start-up resistor → dead switching chip; needs injection + scope; dim-bulb tester | Dim-bulb tester as a safe power mode; mains-side danger flags |
| 6 | **Play Kid Color** | Retro corrosion restoration | battery-leak corrosion (vinegar clean), rusted springs, eaten pads → jumper rebuild, rotted speaker wires | A corrosion-cleaning step (vinegar/IPA) before soldering |
| 7 | **DuoScreen i XL** | Swap-the-suspects diagnostics | a dead top screen stopping boot; camera-ribbon fault; loose caps after a drop | "Boot with X disconnected" tests; modules that block boot when faulty |
| 8 | **VoltMax 1000** | Power electronics, high stakes | shorted MOSFET banks (replace all), blown fuses, gate-driver check, copy-protected microcontroller | Paired-MOSFET wear model; out-of-circuit test station |
| 9 | **Funstation 5 Pro** | Expert endgame + business twist | serial error code → RAM bank; Pro-only RAM grade (long import); bad reflow; repeated software reinstalls; lying listing → partial-refund negotiation | Serial-console error codes; part speed grades; dispute flow |
| 10 | **Galaxy Raid logic board** | Prestige restoration project | counter chips via scope, worn sockets, rare chips from abroad, mis-plug disaster | Logic-signal scope view, socketed chips |

**Smaller additions that fit existing boards:** "No fault found" listings; a flux-in-port comeback on HDMI swaps; wrong-length screw damage; cut-lead e-waste units; a lightning-strike unrepairable variant; a coil-whine "can't fix" ticket; the system-software reinstall step after drive or RAM work.

---

## 11. Failure-mode catalog (beyond the videos)

General bench knowledge of how parts actually die, for new fault variants. Columns:
- **Shows up as:** what the player notices.
- **Caught by:** the tool or test that finds it.
- **Game:** ✅ modelled · ❌ not yet.
- **Effort:**
  - **S:** a parameter or element tweak in the current DC sim.
  - **M:** a new element behaviour or a new tool.
  - **L:** a new system (time, intermittency, firmware).

### 11.1 Passive parts
| Failure | Shows up as | Caught by | Game | Effort |
|---|---|---|---|---|
| Resistor open / burnt | Dead stage, scorch mark | Ω mode, eyes | ✅ | — |
| Resistor **drifted high** (aged carbon film, overheated), e.g. 47 k reads 80 k | Rail slightly wrong, LED dim, regulator output off | Ω vs the marking | ❌ | S (value × factor) |
| Chip resistor **cracked by board flex** | Intermittent; fails when pressed or warm | Ω while flexing, hot air | ❌ | M (intermittent) |
| **Sulfur-corroded** thick-film resistor (polluted air, years) | Slowly goes open; black crust at the ends | Ω, magnifier | ❌ | S + mark |
| Ceramic cap **shorted** | Rail dead or pulled low, part warm | Ω to ground, injection + thermal | ✅ | — |
| Ceramic cap **cracked** (drop, flex, thermal shock) | Intermittent short or open; hairline crack under magnification | Thermal on injection, magnifier | ❌ | S (short) + mark |
| Ceramic cap **lost capacitance** (old high-K) | Ripple, crashes under load | ESR/LCR meter, scope | ❌ | S (like `esr`) |
| Electrolytic **high ESR / dried** | Rail sags and ripples, unit resets | ESR meter, scope | ✅ | — |
| Electrolytic **bulged / vented** | Visible dome, brown crust | Eyes | ✅ (mark) | — |
| Electrolytic **leaked** (old SMD cans) | Electrolyte eats nearby traces and vias → open traces later | Eyes + continuity | ❌ | M (spreading damage) |
| **Tantalum** cap short (often violent) | Burnt black, rail shorted, fuse blown | Eyes, Ω | ❌ | S (new part kind) |
| Inductor open | Rail dead though the regulator switches | Continuity | ✅ | — |
| Inductor **shorted turns / cracked ferrite** | Regulator overheats or current-limits, coil whine | Thermal, scope (wrong ripple) | ❌ | M |
| **Crystal / oscillator** dead, cracked or off-frequency | MCU powered but not running; nothing on outputs | **Scope** (no clock) | ❌ | S (MCU not running + scope) |
| Fuse open; **wrong rating fitted** | Dead / later fire risk | Continuity, marking | ✅ | — |
| **Polyfuse** degraded (higher R after many trips) | Port gives low voltage under load | Ω, voltage under load | ❌ | S |
| **MOV / varistor** shorted after a surge | Input fuse blows instantly | Ω across input | ❌ | S (new kind) |
| **NTC inrush thermistor** cracked open | Dead PSU | Continuity | ❌ | S |
| **Battery NTC** missing/open | Charger refuses to charge ("battery too cold") | Ω on the battery thermistor pin | ❌ | S (charger input) |
| Ferrite bead open | One sub-rail missing | Continuity | ❌ | S |
| Potentiometer / stick **worn wiper** | Drift, jumpy reading | Calibration readout, Ω while moving | ❌ | M (analog input) |

### 11.2 Semiconductors
| Failure | Shows up as | Caught by | Game | Effort |
|---|---|---|---|---|
| Diode / TVS / ESD short or open | Dead rail, blown fuse | Diode mode | ✅ | — |
| Diode **leaky** (Schottky when hot) | Battery drains, rail a bit low, part warm | Diode mode reads low *both ways*, thermal | ❌ | S (parallel R) |
| Zener **drifted** | Clamp voltage wrong → regulator misbehaves | Voltage across it | ❌ | S |
| MOSFET D–S short / open / won't switch | Fuse blows / no output / never turns on | Diode mode, gate vs drain voltages | ✅ | — |
| MOSFET **gate–source leaky** | Driver output loaded and pulled low; FET half-on and hot | Ω gate–source, thermal | ❌ | S |
| MOSFET **degraded (high Rds-on)** | Gets hot under load, output sags only when gaming | Thermal under load, volt drop across it | ❌ | S (Ron × factor) |
| BJT C–E short / B–E open | Driver stuck on or off | Diode mode (two junctions) | ❌ | S (new kind) |
| LED **dim / degraded** | Weak light, rest fine | Eyes, current | ❌ | S |
| One LED **shorted in a string** | Remaining LEDs overdriven, the strip dies sooner | Voltage across the string | ❌ | S |
| **Optocoupler** aged (low gain) | PSU output drifts high or hiccups | Scope / output voltage | ❌ | M (PSU feedback loop) |
| TL431-style reference drifted | PSU output wrong | Voltage at its ref pin | ❌ | M |

### 11.3 Chips
| Failure | Shows up as | Caught by | Game | Effort |
|---|---|---|---|---|
| Regulator dead / input shorted | Rail missing / rail shorted | DC V, Ω | ✅ | — |
| Regulator **failed high** (pass element short) → overvoltage | Downstream chips cooked, a cascade | DC V reads input voltage on the output | ✅ (LDO `blown`) | Add cascade |
| PMIC **one rail missing** | Partial boot | DC V per rail | ❌ | S |
| Missing **enable / power-good** in a sequence | Stops at a stage; the next regulator never starts | DC V on EN/PG pins | 🟡 (Sbox PG) | S |
| Charge IC stuck at precharge (tiny current) | Charges forever, never full | USB meter current | ❌ | S |
| **Current-limit switch tripped / latched** (USB power switch) | Port dead until re-plugged | EN/IN/OUT voltages | ❌ | S |
| MCU dead | Nothing runs | Scope, current | ✅ | — |
| **Firmware corrupted** | Powers, no activity, or a boot loop | Serial log, programmer read fails | ❌ | L (reflash tool, factory image) |
| **Settings/calibration memory corrupt** | Wrong behaviour, e.g. a battery always shows 0 % | Factory reset, log | ❌ | M |
| **BGA cracked balls** | Intermittent; works when pressed or heated; dies when cold | Flex test, freeze spray, hot air | ❌ | L (reflow / reball) |
| Logic output **stuck mid-level** (≈2.5 V) | Garbled data (arcade) | Scope | ❌ | M |
| Amp failed with **DC on its output** | Speaker coil burns again after replacement | DC V across speaker pins | ❌ | S (cascade) |
| **Paired / serialised** chip replaced | Board refuses the new chip | Boot log / error | ❌ | S (flag on part) |

### 11.4 Connectors and mechanics
| Failure | Shows up as | Caught by | Game | Effort |
|---|---|---|---|---|
| Bent, broken or corroded pins; loose port | No contact / intermittent | Magnifier, diode-mode pin check | ✅ | — |
| **Ribbon creased or torn** (hinges, opened by owners) | One function missing; may depend on the lid angle | Continuity while moving | ❌ | M |
| **FPC latch broken** | Cable backs out → intermittent | Eyes | ❌ | S (mark + intermittent) |
| **Weak battery-contact springs / fretting** | Resets when shaken | Ω under wiggle | ❌ | M |
| Tact switch **worn** (high contact R) | Needs a hard press, or double-fires | Ω while pressed | ❌ | S (button R) |
| Speaker coil open / **rubbing** | Silent / distorted | Ω (≈4 Ω), listening | ✅ / ❌ | S |
| **Fan seized** or connector torn | Overheat shutdown | Eyes, thermal | ❌ | M (fan module + thermal shutdown) |
| Swollen battery pushing on the screen | Screen lifting, pressure marks | Eyes | ✅ (mark) | — |

### 11.5 The board itself
| Failure | Shows up as | Caught by | Game | Effort |
|---|---|---|---|---|
| Broken trace, lifted pad | Open | Continuity, magnifier | ✅ | — |
| **Cracked via** (between layers) | Open that only shows from one side | Continuity top vs bottom | ❌ | M |
| **Leakage through flux, dirt or residue** | MCU won't start, ADC reads wrong, oscillator stalls; fixed by *cleaning* | High-MΩ reading where it should be open | ❌ | S (high-R short, cleared by IPA) |
| **Dendrites** from liquid (grow between pins) | Intermittent short that returns | Magnifier, Ω | ❌ | M |
| Carbonised / burnt through | Unrepairable | Eyes, Ω | ✅ | — |
| **Delamination** from overheating during rework | Pads lift easily, bubbles in the board | Eyes | ❌ | S (rework risk) |
| **Tombstoned** part (one end lifted after reflow) | Open | Magnifier | ❌ | S (rework outcome) |
| Solder ball under a chip bridging pins | Short that appears after rework | Ω, X-ray in real life | ❌ | S (rework outcome) |

### 11.6 Causes that produce *bundles* of faults (for the job generator)
Real faults rarely come alone. These root causes should apply a believable *set*:
- **Surge / lightning:**
  - Bundle: TVS short + fuse open, sometimes the charger IC dead and a cap scorched.
  - Through the network port: the PHY chip dead and nearby caps blown.
- **Wrong charger / overvoltage:** input TVS short, charger IC dead, maybe the bias resistor burnt (the Retrobit case).
- **Reverse polarity:** reverse-protection diode or MOSFET shorted, fuse open.
- **Liquid:** corrosion local to where it entered. **It gets worse with time if the board isn't cleaned**, spreading to nearby joints and traces each in-game day it waits.
- **Drop / impact:** cracked ceramic caps, a torn connector, cracked BGA joints, a bent board, parts knocked off and rattling in the case.
- **Heat / age:** dried electrolytics, worn fan, cracked joints on hot parts, degraded LEDs.
- **Cascade:**
  - A small part fails and kills a big one: the open start-up resistor that took out a switching chip, or a shorted MOSFET that damaged its gate driver.
  - **Fixing only the first part leaves the unit still dead**, or it kills the new part.
- **Previous repairer:** bridged pins, unsoldered parts, missing shields, wrong screws punching through layers, cables left unplugged.
- **Owner modifications:** wrong battery, aftermarket parts that don't seat.

### 11.7 Fault *behaviours* (new mechanics that would add a lot)
- **Intermittent faults:** they only fail sometimes. The functional test should run long enough to catch them, and the player needs tools to provoke them:
  - **Thermal:** works cold, fails hot or vice versa. **Freeze spray** and **hot air on a suspect** make the symptom come and go.
  - **Mechanical:** fails when flexed or pressed. Add a "press here" or "flex board" action.
  - **Load-dependent:** fine at idle, fails under load. Add a "stress test" / game-mode load for the functional test.
- **Time-dependent:** works for 20 minutes, then shuts down. Model with the lagged temperature system that already exists.
- **Progressive damage:** corrosion spreads, a cracked joint worsens, a tripped polyfuse degrades. Pressure to act fast.
- **Hidden second fault:** fixing the obvious fault reveals the next one (customer complaint and debrief must handle chains).
- **Wrong-value repairs:** the right package with the wrong value works on the bench and fails in the field.

### 11.8 Tools these failures call for
**Freeze spray** (consumable, intermittents) · **LCR meter** (capacitance and inductance, upgrades the ESR meter) · **programmer / flasher** (firmware) · **serial console** (boot logs, error codes) · **dim-bulb tester / isolation transformer** (mains PSUs) · **preheater** (BGA work, prevents warping and delamination) · **"known-good board" reference** (compare diode readings).
