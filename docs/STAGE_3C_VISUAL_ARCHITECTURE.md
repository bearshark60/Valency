# VALENCY — Stage 3C Modular Visual Architecture

## 1. Architectural Separation
The Stage 3C visual presentation layer is strictly decoupled from gameplay rules (`src/engine/gameEngine.js`), AI (`src/engine/ai.js`), Story progression (`src/story/*`), and Elemental Frontier state (`src/frontier/*`). All theme switching, styling tokens, and asset swaps operate purely through configuration:

- **Design Tokens & Theme Palettes:** `src/styles/theme-tokens.css` (loaded before `main.css` and `mobile.css`).
- **Visual Registry, Asset Manifest & Component Helpers:** `src/presentation/visualTheme.js` (`window.Valency.Visual`).

## 2. Four Visual Theme Identities
Applied dynamically via `document.body.dataset.visualTheme` and `document.body.dataset.visualScene` whenever `V.Visual.applyScene(sceneId)` runs:

| Theme ID | Display Label | Visual Direction | Primary Screens / Scenes |
|---|---|---|---|
| `academy` | Valency Academy | Institutional scientific prestige, clean teal/sky glassware tones, structured order | `main_menu`, `academy_hub`, `academy_exam` |
| `frontier` | The Elemental Frontier | Science-fantasy exploration, crystalline cyan/emerald aura, amber anomalies | `frontier_hub`, `frontier_region`, `frontier_expedition`, `frontier_encounter` |
| `laboratory` | Field Research Laboratory | Experimental spectrograph telemetry, controlled teal/cobalt preparation bench | `classic_battle`, `tutorial`, `frontier_settlement`, `frontier_laboratory` |
| `collective` | The Collective | Repeating violet/indigo geometric symmetry, calm intelligent control | `collective_anomaly` (Investigation Log / Convergence Evidence) |

## 3. Centralized Asset Manifest & Zero-Broken-Link Guarantee
`V.Visual.ASSET_MANIFEST` categorizes all graphical slots into `portraits`, `events`, `icons`, and `scenes`:
- **Verified Existing Assets (`status: 'EXISTING'`):** 5 Scientist SVG portraits, 18 Event SVG illustrations, and 3 PNG app icons — every path is asserted on disk by `tests/stage3c_presentation_test.js`.
- **Unbuilt Roadmap Slots (`status: 'ROADMAP_PLACEHOLDER'` or `'CSS_PROCEDURAL'`):** Explicitly declare `path: null` so the application never renders broken image elements or guessed filenames.

## 4. How to Replace or Add Graphical Assets (Configuration Only)
1. **Replace an existing SVG/PNG in place** using the same path, OR
2. **Override via configuration** at runtime or in `ASSET_MANIFEST` without editing any UI controller:
   ```js
   Valency.Visual.setAssetOverride('portraits', 'lavoisier', 'assets/portraits/lavoisier_highres.png');
   Valency.Visual.setAssetOverride('scenes', 'bg_frontier_hub', 'assets/scenes/frontier_hub.webp');
   ```
3. Reusable helpers (`V.Visual.renderPortrait`, `V.Visual.renderThemePill`, `V.Visual.renderResourcePill`) automatically resolve manifest entries and overrides across Story Mode and Frontier screens.

## 5. Reference Inventories & Roadmaps
See `docs/STAGE_3C_ASSET_INVENTORIES.md` for the complete Graphical Asset Inventory and prioritized 9-item Graphical Asset Roadmap.
