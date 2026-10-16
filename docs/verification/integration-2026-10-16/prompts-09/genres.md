# Your Area: The Thin Genres (Key `genres`)

Read `common.md` beside this file. Your section of the brief is section 3, in full.

## Where You Work

Your own clone: `/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad/genres`, branch `genres`,
at `d7127819`. `node_modules` is linked. Commit there; never push. You own the genre briefs
(`src/engine/content/briefs/briefs-*.ts`, `second-*.ts`) and the genre registers where a change needs them. Another agent
changes the judge (`systems/evaluation.ts`, `piece.ts`, `material.ts`, `interpretation.ts`, `content/approaches.ts`,
`content/tasks.ts`, `content/material.ts`, the scenes) in its own clone: don't edit those; if a change you need is
there, say so in your result.

## The Work

1. **The 54 genres** whose two briefs suit the same sides on every axis
   (`docs/verification/integration-2026-10-16/closeout/genre-audit.md`, "Found by the figures"; count them again from
   `tools/genre-audit.ts` on your clone first). For each, compare its two briefs' dramatic circumstances, objectives and
   obstacles, technique demands, preparation actions, valid interpretations (readings), and the feedback and
   consequences a take brings, as the engine reads them, not their wording. Matching preferences alone don't make them
   the same work.
2. **Where two briefs are substantively repetitive**, revise or expand one with original, genre-appropriate material the
   engine reads (its scene and circumstances, its beats and their tones, what it demands, its readings), so the two ask
   different things of the actor. Never a renamed description. Keep the genre's identity: don't push a genre toward a way
   of playing that doesn't suit it to move a statistic. Where the two agree because the genre's conventions agree, keep
   it, and say why.
3. **A per-genre table**, before and after: what changed, what the engine now reads differently (the figures), and the
   test or tool output that shows it; each genre kept as it was with its reason.
4. **Measured again** after the changes: the genre signature S1 to S4 on all four samples (designed, held out, fresh
   designed, fresh held out), G2 (`tools/genre-identity.ts`), the audit (each genre helps its own brief, moves no other),
   M1 (mastery at 100 on every brief and reading, `tools/ag-baseline.ts`'s mastery section, or `tests/` that hold it),
   G3 to G5, and the suite's genre tests. A criterion that held and fails now is fixed or reported with its cause.

New material is original, written for SLATE, or a public-domain text cited by edition; its facts are in the brief as the
existing originals carry them. `docs/GENRE-COVERAGE.md` and any guide text that names a brief's scene follow your change.
Write `docs/verification/integration-2026-10-16/genres-09.md` (the table and the measurements) and
`docs/verification/remaining-09/genres-result.json`.
