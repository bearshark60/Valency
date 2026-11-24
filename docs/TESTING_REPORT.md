# VALENCY — Historical Scientist System & Story Mode Testing Report

**Date:** 2026-11-24  
**Runtime:** Node.js v26.13.1 (zero-build VM sandbox mirroring `index.html` script load order)  
**Project Root:** `C:\Users\joshb\.gemini\antigravity\scratch\valency-card-game`

---

## 1. Executive Summary

All automated verification suites and regression suites passed **100%** with zero syntax errors, zero illegal moves, zero rule regressions, and verified strategic differentiation across all four Historical Scientist AI profiles.

| Test Suite | Scope | Result |
| --- | --- | --- |
| JavaScript Syntax Audit (`node --check`) | All `.js` files across `src/data/`, `src/engine/`, `src/story/`, `src/ui/` | **PASS (100%)** |
| Story Mode & Historical Scientist Suite (`verify_story_system.js`) | Profiles, Future Card Guardrails, Fair Play, 160-Match AI Telemetry, Licensure Evaluation, Chapter 0 & Two-Stage Persistence, Classic Parity, `index.html` Wiring | **PASS (8 / 8)** |
| PDF Card & Abilities Regression (`verify_pdf_cards.js`) | 120-card deck, snarky quotes, `CH₄`, `NaCl`, `NH₂Cl`, `H₂`, Catalyst 0-SP, 50 AI matches | **PASS (7 / 7)** |
| Unstable Compounds & 2-Second Showcase Regression (`verify_unstable_and_showcase.js`) | Staging, next-turn stabilization swap, automatic decay, `planAIStep` showcase metadata, 50 AI matches | **PASS (4 / 4)** |
| Interactive Tutorial Regression (`verify_tutorial.js`) | All 7 hands-on guided lessons end-to-end | **PASS (7 / 7)** |
| DOM Integrity Audit (`verify_dom_ids.js`) | All 36 core Menu + Match DOM IDs + `#menu-btn-story` | **PASS (100%)** |

---

## 2. Historical Scientist AI Behavioral Differentiation (160 Full Legal Matches)

Each of the four historical scientist opponent configs (`opp_lavoisier`, `opp_mendeleev`, `opp_pauling`, `opp_curie`) played **40 full legal matches** (160 matches total) against a baseline opponent using the identical shared 120-card deck (`extraStartingCards: 0`, `extraDrawPerTurn: 0`, `hiddenStatBonuses: false`). Every action was validated through `gameEngine.js` and recorded in `state.aiDecisionLog`.

| Opponent Config | Completed Games | Win Rate | Avg Turns | Logged Decisions | Stable Syntheses | Unstable Staged | Unstable Stabilized | EN Takeovers | Noble Shields | Red Events | Yellow Events |
| --- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `opp_lavoisier` | 40 / 40 | 68% | 11.57 | 616 | 108 | **0** | **0** | 39 | 37 | 53 | 41 |
| `opp_mendeleev` | 40 / 40 | 53% | 10.22 | 529 | 77 | 55 | 28 | 20 | 24 | 37 | 35 |
| `opp_pauling` | 40 / 40 | 57% | 11.82 | 636 | 94 | 74 | 34 | 18 | 37 | 53 | 46 |
| `opp_curie` | 40 / 40 | 53% | 10.78 | 589 | 91 | 55 | 24 | 21 | 32 | 53 | 45 |

### Key Behavioral Observations
- **Antoine Lavoisier (`opp_lavoisier`):** Enforced zero-waste mass-conservation discipline—staged **0 unstable compounds** across 40 full matches while executing the highest volume of clean stable syntheses (**108**).
- **Dmitri Mendeleev (`opp_mendeleev`):** Achieved the fastest average match tempo (**10.22 turns**) through structured high-SP synthesis and periodic organization.
- **Linus Pauling (`opp_pauling`):** Exhibited the highest total decision volume (**636 decisions**), aggressive unstable staging/stabilization (**74 staged / 34 stabilized**), and active shield/event tactical pressure (**37 shields, 53 red events, 46 yellow events**).
- **Marie Curie (`opp_curie`):** Operated strictly within legal Unit 1 cards and mechanics (zero invented radioactive rules) with balanced research-focused synthesis (**91 syntheses**, **55 unstable staged / 24 stabilized**) and strong event utilization (**53 red / 45 yellow events**).
- **100% Legal Completion:** All 160 matches terminated cleanly in `GAME_OVER` with `legalValidated === true` on every logged decision.

---

## 3. Compliance & Guardrail Verification Checklist

- [x] **Master Profile Separation:** All 4 scientist profiles (`lavoisier`, `mendeleev`, `pauling`, `curie`) pass `validateScientistProfile()`, include explicit simulation disclaimers, and keep opponent AI weights/configs external via `opponentConfigRef`.
- [x] **Future Collectible Card Guardrails:** `CARD_EXPANSION_FLAGS.ACTIVATED_IN_CLASSIC_MODE === false`, `ACTIVATED_IN_STORY_MODE === false`, `SEPARATE_FROM_MAIN_DECK === true`; all 4 cards enforce `activeInGameplay: false` and `affinityStrength: null`; `buildFullDeck()` remains strictly 120 ordinary cards with 0 scientist card leakage.
- [x] **Fair Opponent Rules:** All 5 opponent configs pass `validateOpponentConfig()` with `0` extra starting cards, `0` extra draws, `hiddenStatBonuses: false`, and `legalMoveValidation: true`.
- [x] **Academy Licensure Evaluation:** Verified `Not Yet Certified`, `Provisional Licensure`, `Standard Licensure`, and `Honors Licensure` tier outputs strictly independent of SP scoring.
- [x] **Chapter 0 & Two-Stage Progression Persistence:** Verified 6-mission unlock sequence (`ch0_m1_registration` → `ch0_m6_final_exam`), Stage One unlock on defeat (without Stage Two), Stage Two unlock on Research Challenge completion (`futureCardEligible: true`, `collectibleCardAwarded: false`), `localStorage` reload persistence, and `Chapter 1: The Frontier` unlock with `molecularInstabilityMysteryDiscovered: true`.
- [x] **Classic Mode & Tutorial Preservation:** Classic `vs_ai`, `pass_and_play`, and all 7 Interactive Tutorial lessons passed with zero regressions.
