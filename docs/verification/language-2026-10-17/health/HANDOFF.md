# Health Area: Finished

Brief 14, 2026-10-17. Every source of the health area (the inventory's subsystems health and world, 170 sources in 20
files) has a final status: 56 Rewritten And Verified, 114 Reviewed And Retained, none Pending or Blocked
(`node tools/text-inventory.mjs`; the statuses are in `docs/text/statuses/health.json`). Nothing of the area is left to
do. This file said where the area stopped between sessions until then; `batches.md` is the record now.

## Where Things Are

- `batches.md`: the three batches (your wellbeing and the body chapter; care, cover, bills, appointments, therapy and
  injuries; the gazetteer and the internal words), each with its sources, its meaning-sensitive changes and how each was
  checked, the tests updated, the checks and their exits, and the built app's walks.
- `examples.json`: 73 before-and-after pairs, verbatim.
- `defects.md`: four fixed in the area, three for the coordinator (5, 6 and the gazetteer's stray spaces, 7).
- `glossary.md`: the area's terms, and what's for the coordinator.
- Evidence: `render.ts` with `render-before.txt` and `render-after-1.txt` (batch 1), `render2.ts` with
  `render-after-2.txt` (batch 2), `notice-saves.ts` and `overflow-390.mjs`, the walks in `after-1440/`, `after-390/`,
  `after-notices-1440/` and `after-notices-390/`, and two screenshots at 390 wide. `batch2-rerun.txt` is the first
  session's rerun of batch 2's tests, 59 failing of 539, before this one fixed them.

## For The Coordinator

- **The papers guide's quotes** (`src/engine/content/guide/papers.ts`, the papers area's). Line 375 holds the new HUSKY
  D line, as kept. The quotes at 315, 331, 333, 334, 339, 340, 341, 342, 344, 345, 348, 349, 426, 453, 454, 456 and 457
  now differ from the health area's words: `batches.md`, batch 2, lists each.
- **The booking notice** (`appointments.ts`, `bookIn`) kept its words because papers.doctor's example quotes them and
  its test holds the two equal. Its rewrite, "…, the usual wait where you live. Be there then, or Call It Off on Papers,
  under Health Cover.", lands with that quote.
- **Defects** 5 (Profile's "Sleep owed 1 hours"), 6 (`wellbeingSummary`'s "dial") and 7 (the gazetteer's stray spaces).
- **Found on other areas' screens:** "1 days" on Papers, Passport And ID (Canada's faster passport); The Marketplace's
  paragraph on Papers, 246 to 309 words in one block at 390 wide; Papers' "charity" beside the button Apply For
  Assistance (`glossary.md`).
