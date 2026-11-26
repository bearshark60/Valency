# VALENCY — Stage 3D.3 Production Character Animation QA Report

**Characters Evaluated:** Frontier Lavoisier (`SCI-LAV-001`) & Institute Lavoisier (`SCI-LAV-001-INST`)  
**Scope:** Full-resolution 13-layer painterly artwork inspection, live animation quality & personality differentiation, complete match lifecycles (both Lavoisier variants), Desktop (`1280×860`) & Mobile (`390×844`, `320×568`) performance, asset loading & reduced-motion behavior.

---

## 1. Full-Resolution Artwork Inspection & Visual Defects Found & Fixed

Every separated RGBA PNG (`assets/characters/<id>/layers/01_background.png` – `13_hair_front.png`) was inspected at full resolution on a high-contrast magenta/slate alpha checkerboard alongside a 1:1 `Source Master vs. Neutral Composite vs. Blink+Gaze+Brow+Tilt Stress Test`.

### Six Real Defects Identified on Initial Pass — All Fixed Without Simplifying Artwork
| # | Severity | Defect Observed at 1:1 Resolution | Root Cause | Resolution Applied & Visually Re-Verified |
|---:|---|---|---|---|
| 1 | **Critical** | Wide-eyed / bleached sclera & lost upper lash line on neutral composite vs. serene hooded gaze in `source_master.png` | `Fill-ScleraPatch` artificially brightened sclera (`+28`) and over-expanded onto the upper lash line | Replaced with `Fill-ScleraNatural` (true corner sclera sampling, zero brightening, tightened inner eye aperture preserving the painting's real upper lashes) + soft `eyeTopShadow` SVG gradient inside eye clips |
| 2 | **Critical** | Dark rectangular navy blocks extending above shoulders on `02_body_clothing.png` | Hardcoded `$y -ge 720` rectangular torso envelope captured perimeter dark-navy background | Replaced with perimeter BFS flood-fill (`Compute-BackgroundMask`) + 3×3 neighborhood anti-aliased alpha feather |
| 3 | **Critical** | Institute `03_hair_rear.png` sliced Lavoisier's lower chin & mouth onto the non-rotating rear-hair layer | Wide central horizontal ellipse (`rx: 188`) overlapped lower face | Restricted Institute `03_hair_rear.png` strictly to left/right nape ribbon boxes (`x=280..344` & `552..616`) outside the jaw perimeter |
| 4 | **Moderate** | `13_hair_front.png` grabbed warm forehead skin; `12_jaw_lower.png` overlapped the lower lip | Oversized generic ellipses | Added hairline face-core exclusion + cool-silver hue filter on `13_hair_front.png`; lowered `12_jaw_lower.png` strictly below the lower-lip shadow (`cy=608/610, ry=36`) |
| 5 | **Moderate** | Flat 2-stop gradient upper eyelids (`07/08_lid_*_upper.png`) looked synthetic during blinks | Procedural gradient fill instead of painted texture | Replaced with `Save-NaturalPaintedEyelid` sampling Lavoisier's **actual painted upper-eyelid skin pixels** + delicate dark lash edge |
| 6 | **Subtle** | Faint vertical interpolation streaks on `04_face_head.png` under mouth & brows | 1D vertical-only edge interpolation | Upgraded to `Inpaint-Ellipse2D` (weighted vertical + horizontal smooth perimeter blend) |

### Residual Minor Observation (Transparently Noted)
- On Frontier Lavoisier's `02_body_clothing.png` left outer shoulder edge (`y ≈ 630`), a very faint dark-navy pixel edge from the painting's analytical balance scale remains at near-background luminance; it blends invisibly against `01_background.png` during breathing motion and causes zero visible seam in Studio or battle.

---

## 2. Animation Quality & Personality Evaluation

| Behavior | Frontier Lavoisier (`SCI-LAV-001`) | Institute Lavoisier (`SCI-LAV-001-INST`) | QA Verdict |
|---|---|---|---|
| **Idle Breathing & Head Movement** | Slow organic `5.2s` torso breathing + subtle layered head sway around `(412, 650)` | Tighter, calmer `5.8s` breathing + restrained symmetrical sway around `(448, 646)` | **Pass** — distinct calm vs. archival cadence |
| **Natural Blinking & Eye Tracking** | Skin-matched painted upper lids close smoothly over moving real slate-blue irises; `28%` chance of subtle `58ms` right-lid lag | Exact bilaterally synchronized blinks + narrower steady gaze focus | **Pass** — subtle uncanny contrast without caricature |
| **All 8 Restrained Expressions** | `neutral`, `thoughtful`, `amused`, `explaining`, `concerned`, `disappointed`, `irritated`, `instability` verified live on Studio controls | Matching calm institutional variants; `instability` remains serenely stable (`0` drift) | **Pass** — dignified 18th-century gentleman restraint |
| **Speaking Cadence** | Subtle mouth/jaw syllable cadence (`💬 Speaking: On`) synchronized in Encounter Intro dialogue | Smooth symmetrical lecturing cadence | **Pass** |
| **Reconstruction Instability** | Traces exact painted cheek/temple seam `(562,444)→(496,608)` + brief right-eye micro-desync & faint telemetry reticle | Permanently disabled (`allowReconstructionGlitch: false`, `layer_mech_crystal` empty) | **Pass** — communicates Frontier vs. Institute lore immediately |

---

## 3. Actual Full-Match Gameplay Evaluation (Desktop & Mobile)

Both Lavoisier variants were played through complete match lifecycles (`Intro → Live Battle → Multiple Consecutive Turns → Battle Reactions → Match Completion Modal → Exit Cleanup`):

- **Academy Institute Lavoisier (`ch0_m2_lavoisier`, Desktop `1280×860`):**
  - Pre-match VS Intro mounted `sci_lav_001_institute` (`PRODUCTION_PAINTERLY`).
  - Opponent header mounted `#battle-opp-animated-portrait` (`sci_lav_001_institute`), **`#opponent-zone .mini-avatar` count = `0`** across Turn 1 (`CO +10 SP` vs. AI `HF +8 SP`) and Turn 3.
  - Post-battle examination modal rendered cleanly; returning to Main Menu left **`#battle-opp-animated-portrait` count = `0`** (zero orphaned rigs).
- **Frontier Lavoisier (`enc_rogue_lavoisier`, Desktop `1280×860` & Mobile `390×844` / `320×568`):**
  - Pre-battle Encounter Intro stepped cleanly through dialogue lines; battle header mounted `#battle-opp-animated-portrait` (`sci_lav_001_frontier`, `PRODUCTION_PAINTERLY`) with **`#opponent-zone .mini-avatar` count = `0`**.
  - Verified live battle-reactive expression shift (`neutral` → `thoughtful`) across consecutive turns (`NO +11 SP` vs. AI `HBr +8 SP` / `SrH₂ +4 SP`), live head transform animation across `650ms`, and dead-center circular framing on Mobile (`42×42`, zero overlap at `390×844` & `320×568`).
  - Post-battle Frontier Outcome modal rendered cleanly; returning to Main Menu left **`#battle-opp-animated-portrait` count = `0`**.
- **Non-Animated Fallback (`Classic Dr. Mendeleev`):** Confirmed `#opponent-zone .mini-avatar` count = `1`, `#battle-opp-animated-portrait` count = `0`.

> **Evidence Format Note (Honest Capability Disclosure):** The built-in browser test environment captures static host-verified PNG screenshots and DOM/transform telemetry rather than `.mp4`/`.webm` video files. Live animation continuity was verified via multi-timestamp transform deltas (`T=0` vs. `T=600–650ms` in `Full Motion` vs. exact zero-delta freeze over `500ms` in `Reduced Motion` & `Off`), 1:1 blink/motion stress composites, and live Desktop/Mobile gameplay screenshots.

---

## 4. Performance, Asset Loading & Memory Evaluation

| Metric | Measured Value | Assessment |
|---|---|---|
| **Frontier Layer Footprint (`13` RGBA PNGs)** | `1,797.6 KB` total (`02_body_clothing.png` 839 KB, `04_face_head.png` 470 KB, `13_hair_front.png` 203 KB, facial micro-layers 5–63 KB each) | Crisp full-res detail; zero PNGs loaded on Main Menu (on-demand via SVG `<image>` mount) |
| **Institute Layer Footprint (`13` RGBA PNGs)** | `2,103.4 KB` total | On-demand mount only |
| **Mobile Page Load (`mobile.html`, `390×844`)** | Cold load `1,130 ms` / SW v7 reload `737 ms`; `26/26` PNG layer requests HTTP `200`, **`0` failed PNGs** | Fast cold start because character PNGs defer until Studio or battle mount |
| **Multi-Instance Performance (Studio: 2 Concurrent 16-Layer Rigs)** | Single shared `requestAnimationFrame` loop; smooth dual-rig animation at `390×844` & `1280×860`, **`0` console errors** | Scales cleanly; auto-pauses when `document.hidden` |
| **Reduced Motion & Off Modes** | `cancelAnimationFrame` stops RAF immediately (`T=0` vs `T=500ms` transform strictly unchanged at `0.00`) | Zero background CPU/battery draw when reduced or disabled |
| **Memory & DOM Cleanup** | `clearOpponentRig()` destroys rig, cancels RAF if count reaches `0`, and removes DOM container (`#battle-opp-animated-portrait` count = `0` post-exit) | Verified zero leaked DOM nodes or orphaned RAF loops |
| **Offline PWA (`sw.js` v7)** | Network-first with offline cache fallback; precaches lightweight shell/SVG manifests (`valency-mobile-pwa.zip` excludes archival `production/` & `concepts/`) | Prevents stale cached JS while staying offline-capable on iOS |
| **Future Lazy-Loading Plan (4+ Scientists)** | Documented in `docs/SCIENTIST_PRODUCTION_STANDARD.md` §5: WebP (lossless alpha) conversion (`~65–75%` smaller), runtime SW caching for `assets/characters/*/layers/*`, and briefing-screen pre-warming | Ready for Mendeleev, Pauling & Curie without bloating initial PWA install |
