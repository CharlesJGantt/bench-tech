# Bench Tech — Console Loading Screen Aspect Ratio Master List

## Scope

This list defines the aspect ratio of **static title / loading screen images and simulated game-output artwork** for every console/handheld in the current Bench Tech list. It does **not** define the physical aspect ratio of cartridge labels, optical-disc labels, or SD labels. Those keep their individual media templates.

**Production rules for Codex:**
- **Retro/CRT systems:** `4:3`, target file dimensions **960 × 720 px**.
- **HD/modern systems:** `16:9`, target file dimensions **960 × 540 px**.
- Keep final outputs as **static WebP assets created before gameplay**. The game reads the appropriate existing file; it does not generate or recompose graphics at runtime.
- Reuse source compositions for cross-platform games if appropriate, but export platform-specific static loading screens at the platform's assigned aspect ratio.
- Crop/reposition into safe title areas rather than stretching one aspect ratio into another. Use a sensible text-safe margin, particularly for 4:3 CRT compositions.
- If a game has both a retro and modern release, create **two static crops** from one source illustration, at `4:3` and `16:9` respectively.
- Retro handhelds listed at `4:3` use that as a **standardized art-production ratio**. Their physical LCD/simulated framebuffer may require a different native ratio; render the static art within that hardware screen without distortion. Dual-screen units need one independently fitted view per LCD, not one flattened image spanning both.

**Catalog total: 32 console models; 23 at 4:3 and 9 at 16:9.**

| Console / Handheld | Art ratio | Screen class | Notes |
|---|---|---|---|
| Bintendo Entertainment System | **4:3** | CRT | Legacy television output |
| Bintendo 64 | **4:3** | CRT | Legacy television output |
| Vega Exodus | **4:3** | CRT | Legacy television output |
| Paltari Family Console | **4:3** | CRT | Legacy television output |
| Dream Boy | **4:3** | Retro handheld target | Standardized title/loading artwork; hardware LCD can differ |
| Dream Boy Pocket | **4:3** | Retro handheld target | Standardized title/loading artwork; hardware LCD can differ |
| Dream Boy Color | **4:3** | Retro handheld target | Standardized title/loading artwork; hardware LCD can differ |
| Dream Boy Advance | **4:3** | Retro handheld target | Standardized title/loading artwork; hardware LCD can differ |
| Dream Boy Advance SP | **4:3** | Retro handheld target | Standardized title/loading artwork; hardware LCD can differ |
| Dream Boy Micro | **4:3** | Retro handheld target | Standardized title/loading artwork; hardware LCD can differ |
| Button Lite | **4:3** | Dual-screen handheld | 4:3 per screen; do not combine two screens into one stretched 4:3 image |
| Retrobit RB35 | **4:3** | Retro handheld | Legacy content target |
| Bintendo Pocket Joy Advance | **4:3** | Dual-screen handheld | 4:3 per screen; separate screen assignments |
| Homey Sinnusus | **4:3** | Retro handheld | Retro handheld content target |
| Bintentendo Game Orb | **4:3** | CRT | Legacy television output, includes optical game discs |
| Swamarami All-In-One | **4:3** | Retro console | Default retro-game presentation for multiple media standards |
| Bintendo Pyramid | **4:3** | CRT mini-disc console | Bintendo Mini-Disc game system |
| DiscJockie 1 | **4:3** | CRT | CD-era console |
| DiscJockie 2 | **4:3** | CRT | CD-era console |
| DiscJockie 3 | **16:9** | HD | Widescreen HD console |
| DiscJockie Pocket | **16:9** | Widescreen handheld | Portable mini-disc console |
| Funstation 1 | **4:3** | CRT | CD-era console |
| Funstation 2 | **4:3** | CRT | CD-era console |
| Funstation 3 | **16:9** | HD | HD console |
| Funstation 4 | **16:9** | HD | HD console |
| Funstation 5 | **16:9** | Modern | Modern widescreen console |
| Sbox 1 | **4:3** | CRT | CD-era console |
| Sbox 2 | **4:3** | CRT | CD-era console |
| Sbox 720 | **16:9** | HD | HD console |
| Sbox 10 | **16:9** | HD | HD console |
| Sbox S | **16:9** | HD | Compact modern console |
| Sbox One X | **16:9** | Modern | Modern widescreen console |

## Suggested metadata keys

In console metadata, store:

```json
{
  "loadingScreenAspectRatio": "4:3",
  "loadingScreenWidth": 960,
  "loadingScreenHeight": 720,
  "staticAssetsOnly": true
}
```

For `16:9`, use `loadingScreenWidth: 960`, `loadingScreenHeight: 540`.

Apply these keys to console models, and use them when producing their games' loading-screen assets. **Do not change the game's fixed rarity, valuation, media format, or PCB revision when applying these image settings.**
