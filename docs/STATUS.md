# Bench Tech: status (2026-10-25)

949 tests pass. 34 devices (goal for Steam: 60-100). All work below is committed and pushed. Not verified by eye in the
browser: the preview pane is hidden, so 3D never redraws there; everything has been checked by tests, typecheck and
loading the game without console errors.

## Completed

### Foundation (earlier sessions)
- Circuit simulator, fault generator with difficulty tiers, device blocks (power, USB, HDMI), 34 parody devices
- Soldering / rework physics at the microscope, corrosion, connector oxide and scrubbing, cartridge test station
- Case teardown and reassembly (screws, clips, adhesive, shields, heatsinks, fans, ribbons) and the mistakes you can make
- Shop economy: ledger, supplies, parts stock, supplier orders, marketplace, flip projects, donor boards, advertising
- Autorouted PCB copper, procedural board art, Blender-built parts and shells, save / load

### This chat: polish and presentation
- Guided tutorial (63 steps, click lock-out, "how to interact" wording) with a narrated voice (63 clips checked
  against the text) and a second tutorial walking through the Office
- Loading screen (art, glowing bar, phrases, easter egg), soundtrack with mute, shuffle, volume, collapsible panel
  and a first-time hint popup
- Game & Clock device rework (bigger PCB and case, controls, clock/game screen, speaker holes, labels, TMWB logo and
  URL on its silkscreen), review save (`?review`) with one job per device
- Office and HUD layout fixes, "completed" jobs list, taller / larger Office text

### This chat: business
- Quotes scale with device value and fault tier; fitted parts billed at 1.5x on top
- Services: overheating clean + re-paste, customer charger/cable accessory jobs (sell a new one), case repair jobs,
  hard reset, console drive re-image or replace, scratched disc buffing station
- Sales rework: auction with reserve and bidding, buy-it-now, storefront; listing window with forecast; Sales
  tracker tab (channel totals, 14-day profit chart, every sale); selling fees
- Shop progression: garage, small storefront, mall (rent, fit-out, reputation, traffic, extra customers); storefront
  sales need a shop window
- Employees: storefront 1, mall 2; levels with wages and repairs per day, raises, daily work report, Staff tab

### This chat: new tools and supplies
- Air blower, swabs, IPA wipes, tweezers, pick tool, pen grinder, UV lamp, USB power meter, USB port tester, disc
  buffer, drive imager; repair wire (3 gauges), UV solder mask (4 colours), Kapton tape, disc polish
- Blender bench props for all of them (lying on the mat once owned; the USB meter has a live display) plus a
  glass-crack decal

### This chat: repairs and faults
- Trace and pad repair: pen grinder prep, wire gauge, UV mask sealing; faults for lifted pad, scratched trace,
  corroded-away pads (tier 3), ripped-off port
- USB meter: boot pull, settle, charge ramp; fluctuation with no battery; brown-out on a short; fast-charge
  negotiation (5/9/15/20 V); charger and cable comparison; charge counter and battery capacity test; prompt-to-boot
  bench-supply curve
- USB faults: shorted surge clamp, shorted charger IC, clogged port, bent USB contacts; HDMI clogged and bent
- Look-into-the-port window (2D) with tweezers, pick, blower and swab cleaning
- Cracked screens with a crack decal; broken case parts to replace; torn ribbon cables (fit a new one)
- Fuses: one-shot thermal fuse (replace) and stuck PPTC polyfuse on the microSD supply (heat reset with hot air and
  Kapton tape; hot-air heat bar; a revived fuse is flagged as not to spec)
- Docs and CLAUDE.md kept current; `docs/fault-ideas-from-transcripts.md` holds the transcript-derived ideas

## Needs to be created / worked on

### Next-up candidates (already scoped in chat)
1. **MyPhone-style device with a wireless-charging coil**: adds the coil fault and moves toward the device goal
2. **BIOS settings service job** (secure boot off gives "please select boot device"), from the S2E71 video
3. **Fault ideas from the transcripts** (docs): failed noise filter (charging + HDMI, needs a part on the boards and
   re-routing), fast-charge negotiation fault (PD controller), faulty dock, BIOS reflash with a programmer, CPU hot
   spot at boot, backlight-only failure, bad SD card tripping the fuse again, the second polyfuse (1.8 V), a
   fuse that comes back because the heat source remains, fuses hidden under tape / putty, bimetal thermal switch that
   resets on cooling, a one-month warranty option for borderline fixes
4. **HDD / SSD** beyond the console drive job (laptop drives, handheld storage, drive hardware in the parts list)

### Content (Steam goal: 60-100 devices; 34 now)
- Ideas: SoundHalo, Funstation 5 power / main / Pro, Sbox One X main, Button main, Ding, VoltMax, laptops, MyPhones;
  later phases: intermittents, BGA work, mains power supplies
- TMWB logo and URL on more boards as they are polished (only the Game & Clock has them)
- Retro consoles (BES, B64, Vega, Paltari) still use a generic translucent case; controller grips and recessed buttons
- Blender models for replacement screens and case parts; a real 3D port interior for the port window (it is 2D)

### Business and progression
- Second and third shop locations run by staff (stretch goal)
- Balance pass: wages, rents, fit-out costs, service job frequencies, auction behaviour, staff failure rates
- Review save (`?review`) cannot yet pick a specific fault variant, so the new faults are hard to inspect on demand

### Tutorial and onboarding
- Tutorial script review (every step says exactly how to interact); reworded steps are silent until the voice is
  re-recorded (`npm run voice`, then `npm run voice:verify`): waiting on your OK
- The tutorial does not cover the new mechanics (USB meter, port window, trace repair, services, staff)
- Browser autoplay blocks music and voice until the first click

### Quality, tooling and risks
- Visual check of all the new 3D (props, crack decals, case cracks) in a visible browser window
- The full test suite takes 2-3 minutes; the generic fault variants run fewer seeds to keep it down
- The repo history holds an old set of broken music files (about 56 MB)
- Heat reset timing: the hot-air reset uses the soldering heat bar, not a real temperature setting (the video used
  200 °C slowly, 300-400 °C at once)
