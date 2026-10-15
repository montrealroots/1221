# A Director's Note: Tried, Learned, Better, Resolved, 2026-10-16

The owner's brief "Finish Genre Interpretation, Improve Training Advice, And Prove Long-Term Integration", part 4: "a
rehearsal adjustment can count as answering a director's note without changing anything". The work plan had it as one
to review (`docs/verification/WORKPLAN-2026-10-16.md`, "the workbook now counts a way that changes nothing as answering
a note").

## What Was Wrong

- **A way that moved nothing took the note.** `addressed` (`systems/production.ts`) took a craft note worked a way whose
  figure after stood at least at its figure before, less a twentieth of a point. Played through the festival harness of
  `tests/direction.test.ts` on four seeds, all 16 craft notes were taken by a way that moved their figure by 0.0, with the
  problem still in the part's forecast. The next note said "Better since the last note. You tried work it slowly: 53
  then, 53 now", and the night's notes share counted each as taken.
- **The same dead end, again.** Work It Slowly was offered at a problem however often it had moved nothing there: on seed
  `direction-worked`, a note on emotional depth was worked that way four times, 53 to 53 each time.
- **A limit "resolved" while it got worse.** A limit left the workbook's problems when another input overtook it as the
  costliest, and that read as the note answered: emotional depth's note was taken as the part fell from 53.1 to 50.3.

## What Changed

- **Four outcomes** (`NoteOutcome`):
  - **Resolved.** The note's problem is gone (`stillThere`, `systems/workbook.ts`). For a limit, that means its own cost
    on the part has fallen under the 0.5 that names it.
  - **Better.** A way was worked and kept, and the note's own figure stands `WORKBOOK.evidence` (0.5) or more over where
    it was, when tried or at the next call.
  - **Learned.** A way was worked and its evidence kept, and nothing moved.
  - **Unchanged.** It wasn't worked, and the problem is still there.
- **What counts as taken.** Only resolved and better are taken.
- **What a learned note earns.** Half a taken note's credit, in the call's growth and in the notes share a night reads
  (`PROCESS.noteLearned`). The work was done and its evidence kept, and the night's readiness doesn't fall to nothing
  for it, the regression phase 2b recorded. It doesn't claim an improvement it didn't make.
- **The words follow.** The next note says what was tried and its figure at the call, and, where it moved nothing,
  "which didn't move it: worth knowing, and not the answer". The rehearsal screen says Resolved, Taken: Better, Tried:
  Learned From, Not Moved, or Not Taken. The toast after working a way says when it moved nothing, and the closing counts
  the notes learned from apart from those taken.
- **No dead ends.** A way kept that moved its problem's figure by under 0.05 isn't offered at that problem again; one
  that moved a little, a segment rehearsed in by a few tenths, still is.
- **Saves.** Every field is optional. A note from before keeps its `taken` and reads as it did.

## Measured On Seed `direction-worked` (The Festival Harness)

| | Before | After |
|---|---|---|
| Craft notes worked | 4, each taken; Work It Slowly four times, 53 to 53 | learned, learned (a way kept that made it worse, 53.1 to 50.8), better (47.8 to 50.2), better (50.2 to 51.9) |
| Craft notes left alone | 4: unchanged, resolved (as it fell 53.1 to 50.3), unchanged, unchanged | 4, all unchanged |

Tests: `tests/direction.test.ts` (a way that moves nothing is learned from and not taken, says so, survives a reload and
isn't offered again; every taken note rose by the evidence or lost its problem), `tests/journey-school-production.test.ts`
and `tests/evidence-g19-school.test.ts` (rewritten where they had asserted the loophole: that every worked note was taken).
