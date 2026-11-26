# VALENCY — Stage 3C Modular Audio Architecture

## 1. Architectural Design & Preservation Guarantees
The Stage 3C audio system separates **scene-to-track configuration** (`src/presentation/audioConfig.js` → `Valency.AudioConfig`) from **playback, crossfading, volume scaling, and persistence** (`src/ui/sound.js` → `Valency.Sound`).

### Non-Negotiable Preservation Rules Enforced
1. **All existing menu, battle, tutorial, and Scientist soundtracks are preserved untouched:**
   - `main_menu` (`menu` alias) → `#bgm-menu` → `assets/audio/menu-theme.wav`
   - `classic_ai` (`vs_ai` alias) → `#bgm-vs_ai` → `assets/audio/ai-battle-theme.wav`
   - `tutorial` → `#bgm-tutorial` → `assets/audio/tutorial-theme.wav`
   - `pass_and_play` & `scientist_{lavoisier,mendeleev,pauling,curie,proctor}` → existing `<audio>` drop-in slots + procedural Web Audio synth fallbacks.
   - `assets/audio/lightning.wav` remains preserved on disk (`UNASSIGNED_DISK_ASSETS`) without silent reassignment.
2. **Zero silent reassignment of unrelated music to Frontier scenes:**
   - All 12 Frontier & Collective scene entries explicitly declare `status: 'UNASSIGNED_FALLBACK'` and `silentIfMissing: true`.
   - Entering an unassigned Frontier scene smoothly fades out the outgoing track and remains cleanly silent without console errors or unrelated music bleed.

## 2. Scene-to-Music Manifest Categories
| Category | Scene IDs | Default Status |
|---|---|---|
| Core Menu / Battle / Tutorial | `main_menu`, `classic_ai`, `tutorial`, `pass_and_play` | `EXISTING_FILE` / `SYNTH_FALLBACK` |
| Academy | `academy_menu`, `academy_story`, `scientist_{lavoisier,mendeleev,pauling,curie,proctor}` | `PRESERVED_MENU_DEFAULT` / `SYNTH_FALLBACK` / `UNASSIGNED_FALLBACK` |
| Frontier Exploration & Safe Zones | `frontier_hub`, `frontier_exploration`, `frontier_settlement`, `frontier_laboratory`, `frontier_expedition` | `UNASSIGNED_FALLBACK` |
| Frontier Combat & Stingers | `frontier_encounter_standard`, `frontier_encounter_elite`, `frontier_encounter_rogue_scientist`, `frontier_victory`, `frontier_defeat` | `UNASSIGNED_FALLBACK` |
| Anomaly & Collective | `frontier_anomaly_discovery`, `collective_story` | `UNASSIGNED_FALLBACK` |

## 3. Centralized Audio Manager Capabilities (`Valency.Sound`)
- **Unified Scene Router:** `V.Sound.requestScene(sceneId, options)` (with backwards-compatible `V.Sound.setMusicMode(mode)`).
- **Smooth Configurable Crossfades:** Per-element fade timers prevent overlapping tracks or volume glitches during rapid tab/screen transitions (`0 ms`, `200 ms`, `350 ms`, `600 ms`).
- **Independent Volume Controls:** `setMusicVolume(0..1)` scales both HTML `<audio>` elements and procedural synth music; `setSfxVolume(0..1)` scales all Web Audio SFX independently.
- **Persistent Settings:** Saved automatically to `localStorage['valency_audio_settings_v1']` (`musicEnabled`, `soundEnabled`, `musicVolume`, `sfxVolume`, `fadeDurationMs`), accessible from the **🎛 Audio** button on Desktop & Mobile menus and in-match toolbars.
- **Browser Autoplay & Missing-File Resilience:** Handles `NotAllowedError` via `#menu-audio-prompt` + pointer/key gesture unlock, and degrades missing files gracefully to synth fallback (where defined) or silence (for unassigned scenes).

## 4. How to Add Future Frontier Music Tracks (Configuration Only)
When new Frontier compositions are created, attach them via `Valency.AudioConfig.registerSceneTrack(...)` (or add a matching `<audio>` element / manifest URL) without modifying any Frontier or gameplay controller:
```js
Valency.AudioConfig.registerSceneTrack('frontier_hub', {
  customUrl: 'assets/audio/frontier-hub-theme.m4a',
  silentIfMissing: false,
  defaultVolume: 0.40,
});
```
Each manifest entry also pre-declares `alternateVariants`, `intensityLayers`, `ambientLoop`, and `motifId` slots for future layered adaptive music.

## 5. Reference Inventory & Remaining Audio Roadmap
See `docs/STAGE_3C_ASSET_INVENTORIES.md` for the full Audio Asset Inventory and prioritized 9-item Remaining Audio Roadmap.
