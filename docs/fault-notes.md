# Fault research notes

One entry per repair pattern seen in a video/stream. Rough notes are fine — Claude turns these into fault variants, complaints and hints. Write it in your own words (no transcript text).

---

## Example: console — no video output
- **Device class:** home console (parody: Funstation 5)
- **Customer says:** "Powers on, light is blue, but no picture on the TV."
- **First checks the tech did:** inspected HDMI port under microscope; continuity from port pins to the retimer
- **Key evidence:** bent pin / ripped pad on the HDMI port; or port fine but retimer IC hot / data lines shorted
- **Culprit:** HDMI port (most common) or HDMI retimer chip
- **Fix:** replace port (hot air + preheat, careful with nearby plastics) / replace retimer
- **How hard (1–3):** 2 for port, 3 for retimer
- **Previous-repair traps seen:** bridged pins from a bad port swap, missing caps next to the port
- **Source:** (channel / video title, for your reference)

---

## <next entry>
- **Device class:**
- **Customer says:**
- **First checks the tech did:**
- **Key evidence:**
- **Culprit:**
- **Fix:**
- **How hard (1–3):**
- **Previous-repair traps seen:**
- **Source:**

---

## Patterns gathered from the repair-video transcripts (summarised, Oct 2026)
- **Handheld won't charge** — first check whether the USB-C port gets 5 V at all, then follow it through the input MOSFET and current-sense resistor to the charge IC; corrosion inside the port is common. Culprits: port, charge IC, sense resistor, battery. Tier 1–2.
- **Dead battery** — measure the pack with the meter before blaming the board; replace the pack. Tier 1.
- **Liquid damage / corrosion** — green crust near a connector (often the backlight or battery contacts) eats a trace right through; clean with IPA, scrape, bridge the gap with a jumper wire. Tier 2.
- **Ripped power-connector pads** — someone yanked the cable; pads and short trace sections come away with the connector. Fit a new connector and rebuild the missing traces with wire. Tier 2.
- **No picture on a console** — HDMI port pins/pads damaged, or a previously swapped HDMI chip; check the port pins in diode mode against a known-good one. Tier 2–3.
- **Cracked / dead screen** — swap the screen module, mind the fragile ribbon connector latches. Tier 1.
- **Old electrolytic capacitors** — bulged or leaking; recapping fixes odd behaviour on older gear. Tier 1.
- **Shorted rail** — find it with resistance to ground, inject voltage, find the hot part. Tier 2.
- **Sound but black screen (monitor)** — backlight power stage: shorted MOSFET (blown fuse), open current-sense resistor, dead boost IC, cracked joint on the LED strip connector. Tier 2.
- **Business angle** — buying broken lots, fixing the easy ones, stripping the rest for parts; one unit's failed board feeds another's repair.
