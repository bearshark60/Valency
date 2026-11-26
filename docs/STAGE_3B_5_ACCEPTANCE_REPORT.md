# VALENCY — Stage 3B.5 Live Browser Frontier Acceptance Report

**Result:** **PASS** — Verified live in Desktop (`1280×860`) and Mobile (`390×844` & `320×568`) browsers at `http://localhost:8080` with **0 JS console errors**.

## 1. Desktop Acceptance (`http://localhost:8080/index.html`, `1280×860`)

| Test Case | Status | Observed Live-Browser Result |
| --- | :---: | --- |
| Home Menu & Frontier Entry (`#menu-btn-frontier`) | **PASS** | Both `#menu-btn-story` (Academy) and `#menu-btn-frontier` ("Chapter 1: The Elemental Frontier") rendered above the fold (`482.4×69.6px`). |
| Fresh Profile Reset Confirmation (`#btn-frontier-reset` → `#btn-freset-ok`) | **PASS** | Confirmation modal displayed; confirming reset cleanly to `Credits: 100`, `Research Data: 0`, `Location: Hearth Settlement & Field Lab`, `Equipped: None`, `Deck (120)`, `Clues (0/5)`. |
| Regional Exploration & Route Discovery | **PASS** | `int_hearth_briefing` → travel to `Caloric Thermal Vent` → `int_scan_vent_anomaly` (`Research Data: 15`, unlocked `Convergence Relay Station` & `The Conservation Crucible`) → travel to `Convergence Relay Station` → `int_recover_convergence_log` (`Research Data: 35`, `Credits: 140`). |
| Investigation Log (`🔍 Clues`) | **PASS** | Displayed all 3 categories (`SCIENTIFIC`, `HISTORICAL`, `INTELLIGENCE`) with `3/5` discovered entries. |
| Collection & Deck Manager (`🃏 Deck`) | **PASS** | Permanent collection `120` copies (`✓ Legal`); `[data-fdeck-adj="el_O:-1"]` updated Deck Size `120 → 119` (`✓ Legal`); `+1` restored `120`. *(Minor UX fix queued for Phase E: update the `🃏 Deck` tab pill to mirror live active deck count rather than permanent total copies.)* |
| Scientist Equipment Safe-Zone Guard (`🧬 Scientists`) | **PASS** | All 4 SVG portraits (`54×54px`) loaded cleanly; Lavoisier showed `🔒 Locked`; non-safe location (`Convergence Relay Station`) displayed the safe-zone restriction banner. |
| Expedition Branching, Battle Transition & Failure Model | **PASS** | Entered `The Conservation Crucible` → took Branch B (`Fractured Spectrograph Bench`: permanent `+25` Research Data to `60`, Clues `4/5`, unsecured `+30` Credits) → advanced to `Thermal Calibration Sentinel` → launched canonical battle → played Turn 1 → conceded → `☣ Expedition Failed` reported `Outcome: FAILED`, `Lost Unsecured Rewards: 30 Unsecured Reagent Credits`, and `All permanent rewards preserved!`. |
| Reload Save Persistence | **PASS** | Reloaded `http://localhost:8080/index.html`: permanent `Research Data: 60` and `Clues (4/5)` persisted; unsecured `30` credits remained lost (`Credits: 140`); active expedition was cleared; location returned to `Hearth Settlement & Field Lab`. |
| Expedition Withdrawal & Temporary Card Cleanup | **PASS** | Launched 2nd expedition → took Branch A (`Emergency Reagent Cache`: `2x el_O, 1x inst_EXOTHERMIC_SURGE` temporary + `35` unsecured credits) → clicked `#btn-fwithdraw` → temporary cards and unsecured credits discarded cleanly (`Credits: 140`, permanent `120` copies untouched). |

## 2. Mobile Acceptance (`http://localhost:8080/mobile.html`)

| Viewport | Status | Measurements & Evidence |
| --- | :---: | --- |
| **`390×844`** | **PASS** | `bodyWidth: 375.2px` (0 horizontal overflow); all 5 Frontier Hub tabs switched cleanly (`maxRight <= 351.4px`, `0` clipped controls). |
| **`320×568`** | **PASS** | `bodyWidth: 304.8px` (0 horizontal overflow); all 5 tabs, Region actions, 4 Scientist portraits (`54×54px`), Deck `+`/`−` controls, and Investigation Log rendered cleanly (`overflowBtns: []`). Host-verified screenshot: `browser_evidence/42126cee-df45-45c9-9181-b64429c8f69a/final_step_45.png`. |
