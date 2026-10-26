# Fault and tool ideas from the repair-video transcripts

Source: `Repair Video Transcripts/USB Meter Transcripts` (reviewed 2026-10-25). Status: **built** / **idea**.

## Built from these videos
- **USB meter** with boot pull, settle and charge ramp; fluctuating current with no battery; brown-out on a hard short; all-zeros = no connection; voltage sag; charge counter (mAh/Wh) and capacity test (battery end of life).
- **Fast-charge negotiation** (5/9/15/20 V; 20 V needs an e-marked cable) and **charger / cable comparison** (old 1 A block, thin cable drops current and voltage).
- **Prompt to boot** on the bench supply: small, growing, settling; a stalled board hangs on a plateau; a dead board draws nothing; a main-rail short pulls the supply limit before the button is pressed.
- **USB port diode tester** (like the Mechanic T-824): red dots for pins that read differently from a healthy board.
- Faults: **shorted charger IC** (the iPhone 16 Pro video), **shorted surge clamp**, **ripped-off port**, plus **customer accessory** jobs (their charger or cable is worn out: sell a new one).

## Ideas not built yet
Charging and power path
- **Failed noise filter / common-mode choke** between the port and the USB/HDMI chip (Switch video): the port reads fine but D+/D- lines and HDMI die together. Needs a filter part in the USB block, so boards must be re-laid and re-routed.
- **PD controller / negotiation failure**: charger offers 20 V but the device stays at 5 V (ROG Ally: 5 V, 90 mA, replaced the PD chip). Needs a functional check for "fast charges".
- **Dock / power-plug adapter faulty** while the console is fine (Switch video: "many cases where the tablet and the supply were fine but the plug adapter was not").
- **Charging-port connector flex or pin damage** on phones (iPhone 16 Pro).
- **Second shorted chip on the same rail** (the iPhone needed two chips replaced; the second was found only after the first came out).
- **Battery connector / data line open** so the phone boots only when the battery is "mimicked" by the supply.

Boot and firmware
- **Corrupted BIOS / firmware** (ROG Ally): powers on, logo hangs or boots very slowly; fix by reflashing the BIOS chip with a programmer (needs a programmer tool and a BIOS image).
- **Bad BIOS chip** vs bad RAM vs bad CPU: same symptom, tested by swapping parts.
- **SSD / NVMe** swapped to rule it out (already on the wishlist: re-image or replace).
- **CPU die short** that shows as a single hot corner on a thermal camera right at boot; **missing core/memory voltage** in the boot sequence.
- **Backlight-only failure** (powers on, no light), reported as a separate Ally fault.
- **Boot loop only when plugged in** (iFixit thread).

Diagnosis tooling
- **Boot cable / DC power supply** with a per-phone boot-current signature table (fingerprints you record yourself).
- **Thermal camera on a shorted rail** while injecting a low voltage (exists as injection + thermal cam; add the rosin / freeze-spray trick).
- **Microsoldering donor-board workflow**: remove a chip from a donor board, then reball and fit it.
- **Diode-mode map per pin** with a board-view / schematic overlay (the XZZ-style tool in the Switch video).
- **Low-melt solder (138 °C)** to loosen lead-free solder before removing a port (Switch video): a supply plus a technique step.
- **Opened-before evidence**: broken warranty stickers, a flipped screw order, a connector left out.
