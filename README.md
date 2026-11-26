# VALENCY — Playable Chemistry Card Game Prototype (Unit 1)

A zero-dependency web prototype of **VALENCY**, built core-rules-first so you can playtest the complete 100-card Unit 1 deck right away—and cleanly layer chemistry animations on top next.

## How to Play Immediately
1. Double-click **`index.html`** in Windows Explorer (opens directly in Chrome, Edge, or Firefox—no server or build tools needed).
2. Choose **1P vs. Dr. Mendeleev (AI)** or **2P Local Pass & Play**.
3. Open **`tests.html`** in your browser at any time to run the automated rules verification suite (including a 10-game AI-vs-AI stress test).

## Project Structure
- `index.html` — Main game shell and script entry point.
- `tests.html` — Browser-based automated rules & AI stress-test suite.
- `src/data/cards.js` — Complete 100-card deck (64 bonding elements, 6 Noble Gases, 20 Yellow Instances, 10 Red Events).
- `src/data/compounds.js` — Real chemical compound & diatomic database, Catalyst validator, and Electronegativity Takeover solver.
- `src/engine/gameEngine.js` — Pure turn/phase state machine, SP tracking, Noble Gas shields, Event resolution, and all 9 Element Special Abilities.
- `src/engine/ai.js` — Dr. Mendeleev AI opponent.
- `src/ui/app.js` & `src/styles/main.css` — Card faces (matching the Valency Slides layout), interactive table, Hand Synthesizer Hints, and Periodic Table modal.
