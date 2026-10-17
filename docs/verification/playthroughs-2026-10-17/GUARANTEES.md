# Brief 13’s Guarantees (Section 7)

Written by `guarantees.py` from the completion matrix, the final runs on the tested commit and the gate. Nothing here is typed. A guarantee is held when every row it names is Implemented And Verified, as the matrix gives it (a row whose measurement went stale reads as stale), and every figure came out as it says.

- **Held:** 6 of 10.

## Maximum-quality prepared mastery: open

- `M1` (Criteria: The Attributes): Implemented And Verified
- `M1` (Brief 10 Area: judge): Implemented And Verified
- `MA5` (Criteria: Mastery Through Play): Implemented, Verification Incomplete: It was measured on ed24ff3b, and what it reads has changed since (src/engine/content/guide/coursework.ts, src/engine/content/guide/day.ts, src/engine/content/guide/documents.ts, …): measure it again
- `MA6` (Criteria: Mastery Through Play): Implemented And Verified
- `journeys.7-mastery` (Brief 13 Area: journeys): Implemented And Verified
- **the mastery plans (runs13.sh D):** not run

## Relevant attribute improvement without unintended regression: held

- `MA1` (Criteria: Mastery Through Play): Implemented And Verified
- `MA2` (Criteria: Mastery Through Play): Implemented And Verified
- `A5` (Criteria: The Attributes): Implemented And Verified
- `L3-R.d` (Brief 10 Area: judge): Implemented And Verified
- `journeys.7-attributes` (Brief 13 Area: journeys): Implemented And Verified
- **L3-R (d), every ability raised alone on every piece (runs13.sh M3, M4, MF):** 363,432 checks on 797 pieces, 0 falls, worst 0

## Genre-specific benefits without unrelated leakage: held

- `S3` (Criteria: The Genres): Implemented And Verified
- `S4` (Criteria: The Genres): Implemented And Verified
- `genres.7-measured` (Brief 09 Area: genres): Implemented And Verified
- `journeys.7-genres` (Brief 13 Area: journeys): Implemented And Verified

## Specialist opportunities and valid limitations: held

- `H4-R.a` (Brief 10 Area: judge): Implemented And Verified
- `H4-R.b` (Brief 10 Area: judge): Implemented And Verified
- `H4-R.c` (Brief 10 Area: judge): Implemented And Verified
- `H4-R.d` (Brief 10 Area: judge): Implemented And Verified
- `ST6-R2.c` (Brief 12: Replacement Criteria): Implemented And Verified
- `journeys.7-specialists` (Brief 13 Area: journeys): Implemented And Verified
- Beside it, not counted in it: `ST6-R2.e` (Brief 12: Replacement Criteria): Decision Required: {'question': "Should (e2.3), (e3.3) and (e4)'s margins be read on the abilities' part alone, both takes judged with the scene's grain at nothing, with the margins as played kept as the record; and should (e3.5) on stage be read on the size counterparts' own opportunities (varied on every actor) with

## Accurate advice forecasts: open

- `advice.F2A10-b` (Brief 10 Area: advice): Implemented And Verified
- `advice.F2A10-c` (Brief 10 Area: advice): Implemented And Verified
- `advice.F2A10-e` (Brief 10 Area: advice): Implemented And Verified
- `advice.heldout` (Brief 10 Area: advice): Implemented And Verified
- `journeys.7-advice-forecasts` (Brief 13 Area: journeys): Implemented And Verified
- **F2-A’s forty cases (runs13.sh ADVR):** not run

## Stamina’s duration, participation, intensity and recovery: held

- `stamina.W1` (Brief 10 Area: stamina): Implemented And Verified
- `stamina.W2` (Brief 10 Area: stamina): Implemented And Verified
- `stamina.W3` (Brief 10 Area: stamina): Implemented And Verified
- `stamina.W4` (Brief 10 Area: stamina): Implemented And Verified
- `stamina.W5` (Brief 10 Area: stamina): Implemented And Verified
- `stamina.W6` (Brief 10 Area: stamina): Implemented And Verified
- `stamina.W7` (Brief 10 Area: stamina): Implemented And Verified
- `stamina.W8` (Brief 10 Area: stamina): Implemented And Verified
- `stamina.W9` (Brief 10 Area: stamina): Implemented And Verified
- `stamina.W10` (Brief 10 Area: stamina): Implemented And Verified
- `stamina.A1` (Brief 10 Area: stamina): Implemented And Verified
- `journeys.7-stamina` (Brief 13 Area: journeys): Implemented And Verified

## Ledger balance: open

- `journeys.7-ledger` (Brief 13 Area: journeys): Implemented And Verified
- **the long runs (runs13.sh B, C, D):** not run
- **the journeys’ check on money (check 6, the ledger balanced at every reload):** 25 of 25 passed on the tested commit (6 money)

## Save compatibility and historical results: held

- `INT-migration` (Integration): Implemented And Verified
- `INT-determinism` (Integration): Implemented And Verified
- `stamina.W10` (Brief 10 Area: stamina): Implemented And Verified
- `genres.5-saves` (Brief 09 Area: genres): Implemented And Verified
- `journeys.7-save` (Brief 13 Area: journeys): Implemented And Verified
- **the save schema, pinned in two places:** SAVE_SCHEMA_VERSION 94 in src/engine/domain/model.ts, SUPPORTED_SCHEMA_VERSION 94 in base44/shared/guard.js
- **the journeys’ check on save and reload (check 10):** 25 of 25 passed on the tested commit (10 save and reload)

## Decision #4’s unchanged protected rows: held

- **receipt.py, against brief 11’s frozen baseline:** 23 rows, 0 moved

## Nothing advertised as a functioning mechanic is decoration: open

- `A4` (Criteria: The Attributes): Implemented And Verified
- `INT-gate` (Integration): Implemented, Verification Incomplete: It was measured on ac79bf4a, and what it reads has changed since (src/engine/content/guide/coursework.ts, src/engine/content/guide/day.ts, src/engine/content/guide/documents.ts, …): measure it again
- **tools/wired.mjs --check, in the gate:** the gate not run
- **tools/capabilities.mjs --check, in the gate:** the gate not run
