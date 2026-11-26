# VALENCY — 2D Portrait Animation Technology Evaluation (Stage 3D.1)

**Context:** Valency is a zero-build vanilla HTML/CSS/JS web application running over `file://`, local/static HTTP, and an iOS Safari offline-cached Mobile PWA (`dist/valency-mobile-pwa/`, currently `< 1.0 MB` excluding optional WAVs). All portrait animation solutions were evaluated specifically against these architectural constraints rather than adopting a tool blindly.

---

## 1. Candidate Evaluation Matrix

| Criterion | Live2D Cubism (Web SDK) | Spine 2D (`spine-webgl` / `spine-canvas`) | Rive (`@rive-app/canvas`) | Native Layered SVG Rig (`V.CharacterRig`) *(Stage 3D.1 PoC)* |
|---|---|---|---|---|
| **Visual Fidelity (Mesh Warp / Subtle Organic Motion)** | **Best-in-class** for painterly 2.5D head turns, hair physics, eyelid mesh curves | **Excellent** skeletal + free-form mesh deformation (FFD), great for subtle breathing & cloth | **Very Good** vector + raster mesh deformation, crisp vector FX & shader-like blend modes | **Good** crisp multi-layer transform/clip-path/opacity/morph animation; no arbitrary raster mesh warp |
| **Runtime Footprint & Mobile PWA Budget** | Heavy: Core WASM/JS (`~500 KB`) + Cubism Framework + `2–8 MB` textures per character | Moderate: `~260–350 KB` runtime + PNG texture atlas (`~500 KB–2 MB` per character) | Lightweight: `~190–260 KB` WASM + compact `.riv` binary (`~40–300 KB` per character) | **Ultra-light (`~14 KB` JS + `~25–45 KB` layered SVG)**; instant cold load on iOS cellular |
| **Zero-Build / `file://` Offline Compatibility** | **Poor** — requires module bundler/HTTP server for WASM fetch & `.moc3` XHR | **Moderate** — `spine-canvas` works over HTTP, but `.atlas`/`.json` fetch blocked under `file://` CORS | **Poor on `file://`** (WASM fetch requires HTTP/HTTPS), **Excellent on HTTP/PWA** | **100% Native** on `file://`, HTTP, and iOS PWA Service Worker |
| **iOS Safari Mobile Performance** | Risk of WebGL context limits (`<= 8` contexts) when showing multiple portraits in UI lists | Good on `spine-canvas`; WebGL context caution if multiple canvases mount simultaneously | **Excellent** Canvas2D renderer — 60fps on iPhone, no WebGL context exhaustion | **Excellent** GPU-composited CSS/SVG transforms, single shared RAF loop, automatic pause when hidden |
| **State Machine / Expression & Glitch Blending** | Requires custom Cubism parameter blending code (`ParamEyeLOpen`, `ParamAngleX`) | Strong track-based animation mixing (`AnimationState.setAnimation` across tracks) | **Best-in-class** built-in visual State Machine with direct JS inputs (`expression`, `glitchTrigger`) | Clean declarative JS/CSS state machine (`setExpression`, `triggerReconstructionGlitch`, `triggerEncounterTransition`) |
| **Licensing & Authoring Cost** | Proprietary SDK license + paid Cubism Editor Pro for commercial release; revenue-tier agreements | Paid Spine Essential ($69) / Professional ($369, required for mesh deformation) + runtime license | Free Editor + MIT open-source JS runtime; paid team plans optional | **Zero licensing fees**, 100% open source, human-readable version-controlled assets |
| **Integration Complexity in Current Codebase** | High (WASM init, WebGL canvas lifecycle, external asset build step) | Medium-High (atlas packing, HTTP-only asset loading) | Medium (single `<script>` CDN/local WASM bundle + `.riv` state-machine binding) | **Minimal** (drop-in IIFE `src/presentation/characterRigEngine.js`) |

---

## 2. Empirical Integration Findings for Valency
1. **Why we did NOT hard-commit the core codebase to Live2D Cubism right now:**
   - Live2D requires WebGL contexts, proprietary `.moc3` binary authoring in Cubism Editor, commercial SDK licensing terms, and `fetch()` over HTTP (breaking Valency's `file://` offline guarantee).
   - Mounting multiple portraits simultaneously (e.g., Scientist Equipment screen or Institute vs. Frontier comparison) risks WebGL context loss on iOS Safari.
2. **Why Rive is the Recommended Long-Term Upgrade Target (Stage 4+ when hiring/exporting painterly raster/mesh characters):**
   - Rive's MIT Canvas2D runtime avoids iOS Safari WebGL context limits, keeps `.riv` bundles compact for Mobile PWA caching, and maps 1-to-1 to Valency's `expression` / `isSpeaking` / `instability` state inputs.
   - Spine 2D (`spine-canvas`) is a strong runner-up if the art team prefers Photoshop PSD → Spine mesh rigging workflows.
3. **Why Native Layered SVG Rigging (`V.CharacterRig`) is the Right Stage 3D.1 Foundation:**
   - Proves the **complete 16-layer character pipeline, subtle uncanny Frontier animation, Institute hologram contrast, dialogue expression transitions, encounter transition, reduced-motion fallback, and desktop/mobile performance** immediately inside Valency with zero build tooling or binary lock-in.
   - Critically, `V.CharacterRig` exposes a **renderer-agnostic adapter API**:
     ```js
     const rig = Valency.CharacterRig.mount(containerEl, {
       characterId: 'sci_lav_001_frontier',
       size: 'stage',          // 'mini' | 'card' | 'stage'
       expression: 'neutral',
       autoplayTransition: true,
     });
     rig.setExpression('explaining');
     rig.triggerReconstructionGlitch();
     rig.destroy();
     ```
   - When future characters are authored in **Rive (`.riv`)** or **Spine** and hosted over HTTP/PWA, `V.CharacterRig` simply dispatches on `manifest.renderer` (`'svg_rig' | 'rive' | 'spine'`) without changing a single line in `frontierUI.js`, `animations.js`, `app.js`, or `gameEngine.js`.
