# VALENCY — Stage 2.5 Acceptance Testing Report

**Verdict:** **ACCEPTED** — Stable, demonstrably playable Academy Licensure prototype verified end-to-end in live Desktop (`1280×860`) and Mobile (`390×844` & `320×568`) browser sessions plus all automated integration and regression suites.

**Scope Guardrails Verified:** Chapter 1 not implemented; collectible Scientist Cards remain inactive (`activeInGameplay: false`, `collectibleCardAwarded: false`); zero new card abilities; Stability Point scoring and core rules engine untouched.

---

## 1. Live Desktop Acceptance — Legitimate Lavoisier Victory & Save Integrity (`http://localhost:8080/index.html`, `1280×860`)

| Acceptance Check | Result | Verified Evidence |
| --- | :---: | --- |
| Fresh Story Mode save via UI Reset Confirmation | **PASS** | `#btn-story-reset` opened `"Confirm Campaign Reset"` modal; `#btn-reset-confirm` reset to `0 / 6 Missions` with Mission 2 locked. |
| Registration Day → Reload Persistence | **PASS** | Completed Mission 1 via `#btn-complete-reg`, reloaded browser, verified `1 / 6 Missions`, Mission 1 `✓ Cleared`, Mission 2 `Ready`. |
| Legitimate Match Victory vs. Antoine Lavoisier | **PASS** | Won via normal UI turns on Turn 11 (`28 / 25 SP` vs. Lavoisier `22 / 25 SP`) using legal syntheses (`NaH`, `CaTe`, `BrF`, `H₂`), shields (`He`, `Rn`), and events (`Ionization Surge`, `Electrolysis`, `Chain Reaction`, `Distillation`, `Synthesis Accelerator`, `Exothermic Surge`). |
| Examination Passed Screen, Competencies & Research Challenge | **PASS** | Modal `🎓 Examination Passed — Lavoisier – The Conservation Principle` showed `Honors Licensure` (`85% Overall`), `Synthesis 100%`, `Stability 83%`, `Defensive 87%`, `Tactical 64%`, all 4 criteria of `The Mass-Balance Ledger` met, `★ Antoine Lavoisier — Research Challenge Commendation`, and both Stage One & Stage Two unlock banners. |
| Unlocked Research Archive Inspection + Reload Persistence | **PASS** | `#btn-story-archive-open` displayed Lavoisier's unlocked Biography, 4 Historical Discoveries, `Honors Licensure (85%)`, `★ STAGE TWO UNLOCKED — Future Scientist Card Eligible` (`scard_lavoisier`), and simulation disclaimer. Full browser reload preserved `2 / 6 Missions`, Mission 2 `✓ Cleared`, Mission 3 (`Mendeleev`) `Ready`, and unlocked Archive. |
| Replay Worse Result (Non-Downgrade Protection) | **PASS** | Replayed Mission 2 and conceded (`☣ Examination Failed`, `51%`, `Not Yet Certified`); Story Hub retained `Honors Licensure (85%)`, `★ Stage 2 Eligible`, cumulative `Honors Licensure`, and unlocked Archive entries. |
| Reset Save Confirmation + Cancellation | **PASS** | `#btn-story-reset` → `#btn-reset-cancel` left all progress intact (`2 / 6 Missions`, `1/4 Stage 1`, `1/4 Stage 2`, `Honors Licensure`). |
| Console Errors | **PASS** | **0** JS console errors. |

---

## 2. Live Mobile Acceptance (`http://localhost:8080/mobile.html`, `390×844` & `320×568`)

Initial mobile pass identified two narrow-viewport layout defects:
1. Topbar turn pill clipped the `SYNTHESIS` badge by `6px` at `390px` and truncated `"T1 • Your Tur"` / hid the phase badge at `320px`.
2. Inside the `320px` Element Card Inspector, the `4e⁻¹` bond badge clipped against the adjacent text panel and squeezed the 8 octet dots.

**After CSS/topbar polish, re-verification passed 100% on BOTH viewports with 0 JS console errors:**

| Acceptance Check | `390×844` | `320×568` | Details |
| --- | :---: | :---: | --- |
| Zero horizontal page overflow (`horizScrollDelta = 0`) | **PASS** | **PASS** | `bodyW = 375.2px / 390.4px` at `390px`; `304.8px` at `320px` across Menu, Story Hub, Archive, Briefing, and Match. |
| Turn indicator & Phase badge readability (Phase 2 & 3) | **PASS** | **PASS** | `T1·You SYNTH` (`right=136.7px`, `SYNTH` inside pill with `7.8px` padding, `25.3px` clear gap to Hints button at `320px`; `95.7px` gap at `390px`) and `T1·You DEF` (`40.6px` gap at `320px`). |
| Opponent header alignment | **PASS** | **PASS** | `Simulation: Antoine Lavoisier` sits cleanly on a single line above card backs and `0 / 25 SP`. |
| Story Hub, Mission Cards, Portraits, Briefings, Archive, Reset Confirm | **PASS** | **PASS** | All fit cleanly inside `370.4px` (`390px`) and `284.8px` (`320px`) modal containers with zero clipping. |
| Hints Drawer, Lab Controls Sheet (all 7 buttons) | **PASS** | **PASS** | Open/close cleanly on both viewports. |
| Element Card Inspector (`.vcard-zoom-btn`) | **PASS** | **PASS** | Stacked `.vcard-split` at `<= 380px` renders `SHARES` + `4e⁻¹` side-by-side cleanly with 8 circular octet dots and zero clipping. |
| Live Phase 2 & Phase 3 Controls | **PASS** | **PASS** | `#btn-synthesize`, `#btn-pass-synth`, `#btn-end-turn`, and card selection remain accessible in both phases. |

---

## 3. Narrative & Gameplay Consistency Review (First-Time Player)

Reviewed Registration Day and Lavoisier end-to-end from a first-time player's perspective:
- **Why attending the Academy:** Clear in Registration Day's Story Introduction (Academy licensure required before field deployment).
- **Examination objective:** Clear in both Registration Day and Lavoisier's Mission Briefing (reach `25 SP` while evaluated on 4 competencies).
- **Why historical scientists appear as opponents:** Clarified in Registration Day Registrar dialogue (`src/story/academyChapter.js`) explaining that Academy simulation chambers recreate landmark chemical methods (Lavoisier/conservation, Mendeleev/periodic structure, Pauling/electronegativity, Curie/persistence) as benchmark examiners on the exact same 120-card legal deck.
- **What a victory unlocks:** Clarified explicitly in Registrar dialogue (Stage One unlocks biography, historical discoveries, and exam record; Stage Two records future specialist eligibility).
- **How the Research Challenge relates to the match:** Added explicit clarification in `.briefing-rc` (`src/ui/storyUI.js`) stating it is evaluated automatically during the same examination match—no separate mode required.

---

## 4. Regression Testing Results (All Suites Passed 100%)

- **JS Syntax Audit (`node --check` on all `src/**/*.js`):** **PASS**
- **Stage 2 Real-Match Integration Suite (`tests/stage2_integration_test.js`):** **4 / 4 PASS** — 150 full real games across all 5 opponent configs (`opp_lavoisier`, `opp_mendeleev`, `opp_pauling`, `opp_curie`, `opp_academy_proctor`), 0 rejected engine moves, `legalValidated === true` confirmed post-execution, structured telemetry & `discardProtect` verified.
- **Story System Suite (`verify_story_system.js`):** **8 / 8 PASS** — 160 additional legal matches across the 4 scientists (`opp_lavoisier` 0 unstable staged, 30% win rate vs. 45–55% for Mendeleev/Pauling/Curie).
- **Classic Mode & PDF Card Abilities (`verify_pdf_cards.js`):** **7 / 7 PASS** (50 AI games + all abilities).
- **Unstable Compounds & 2-Second Showcase (`verify_unstable_and_showcase.js`):** **4 / 4 PASS** (50 AI games).
- **Seven-Lesson Interactive Tutorial (`verify_tutorial.js`):** **7 / 7 Lessons PASS**.
- **DOM IDs & Mobile PWA Build (`verify_dom_ids.js`, `verify_mobile_build.js`):** **PASS** + rebuilt `dist/valency-mobile-pwa.zip` (409.5 KB, 49 files).

---

## 5. Changes Made During Stage 2.5
- `src/ui/app.js` — Compact mobile topbar turn indicator (`T1·You` + `Synth`/`Def`/`Done`) so it fits cleanly down to `320px`.
- `src/styles/mobile.css` — Added `@media (max-width: 400px)` compact topbar spacing and `@media (max-width: 380px)` stacked `.vcard-large .vcard-split` layout for narrow Element Card Inspection.
- `src/story/academyChapter.js` & `src/ui/storyUI.js` — Tightened first-time player narrative clarity in Registration Day dialogue and Research Challenge briefing note.
- `dist/valency-mobile-pwa/` & `dist/valency-mobile-pwa.zip` — Rebuilt clean mobile bundle with all Stage 2.5 fixes.

## 6. Remaining Known Limitations
- **Expected Optional Audio 404 Probes:** Browser DevTools logs 404 probes for optional custom scientist audio drop-ins (`assets/audio/lavoisier-theme.*`) until custom files are provided; built-in Web Audio synthesized themes play automatically.
- **Client-Side Persistence Only:** Save state persists locally via browser `localStorage` (`valency_story_progression_v1`) with no remote database/cloud sync yet.
