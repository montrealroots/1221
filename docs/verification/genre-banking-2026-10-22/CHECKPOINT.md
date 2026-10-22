# Brief 21's Checkpoint

A compact record so an interruption doesn't start the work over: what's done, what's left, what was decided, and the
exact test results. Updated as each module lands; the criteria are `criteria.md`.

## Done

- Starting point read (`main` at `e50865df`, gate reused from `fdf6897e`, the same code); the brief kept verbatim; the
  criteria written before any fix, with what the code did (`6d3d9374`).
- G, the genre module, committed: one measure of a work's genres (`relevantGenre`), read by every path the brief
  names; practice credited by weight and at rehearsals; the guide, the genre's look, the Profile's fine print and the
  coverage document said again and marked; the tests the change moved brought to it with dated notes; the audit's
  citations, the wiring list's handler lines and the effects matrix's new guide promise brought up to date.
- B research written (`banking-sources.md`, committed with the banking module).

## Left

- G: the proof tests (P1) and their mutations.
- B: sources for each banking item; the fixes; what stays as it is, with evidence.
- S, P2, P3, J, R: saves, banking proof, regressions and mutations, journeys, built app, gate, records.

## Decisions

- **The measure** (`systems/engagement.ts`): a work's tags are deduplicated; the first listed carries half where there
  are two or more and the rest share the other half (`ENGAGEMENT.weights.primary`); a broad genre listed beside one of
  its own kinds is absorbed into the kind, which takes its weight. Each requirement is credited the best of what the
  person knows toward it: the genre itself whole, a kind of it 0.75 (`kindToParent`), its broad genre 0.5
  (`parentToKind`), anything else, siblings included, 0. The total is the weighted sum, 0 to 1.
- **No per-role weight field.** No content gives one, and a field only tests set would be a feature only a test's hand
  reaches. The order the lists were written in (main genre first) is the documented default.
- **Where it's read:** a taped brief (as before, single-genre), a professional self-tape and callback (as before, now
  weighed), an audition in person (new), a shoot day (as before, weighed), a professional night on stage (new), a
  School night (new), School casting and the Summer Cabaret's company (new), professional casting's fit (as before,
  weighed), the speed of a class scene, a part's lines and (new) a professional rehearsal day's lines.
- **Separate contributions, named:** the work's quality (the genre part of preparation, gating interpretation at
  `partFloor.genre` 0.75 to complete at 0.9); casting's reading of suitability (half of a professional fit, a part of a
  School fit); the speed of preparation (at most a sixth). The pro rehearsal day speeds the lines only, as a School
  part's are, not the breakdown the day's genre part already reads.
- **Classmates** are read by the class's expected record: each past School production's calls and nights credited as
  the player's would be, shared over the class (`classGenres`), plus the run's own calls for a member of its cast
  (`atOpening`). No save data, no migration.
- **Rehearsal is practice** (found by `remaining-school`'s `ur-1` life, dismissed once nights read the genre): a School
  call and a professional rehearsal day credit one session's practice in the play's genres, as a night does.
- **Practice by weight** in live play; migration 92 keeps its even split, so an old save migrates as it did.
- **Class scenes** keep the speed-only connection: not a path the brief names.
- **The genre's look** reads the genre's own record, not related genres, so it never shows a speed beside "You haven't
  studied it".

## Test Results

- Genre-related files (48), first run: 11 failed of 684. Second run, siblings credited nothing: 10 failed of 684.
  Each traced: five tests held the best-of rule (evidence-g20 ×3, evidence-g23 ×2), one the even split
  (journey-career), one a broad tag's practice (b20-career-effects), three casting outcomes moved by the classmates'
  genre (decisions-2026-10-14, evidence-g24, evidence2-b08); each brought to the rule with a dated note. 68 of 68, 13 of
  13, 1 of 1, 8 of 8 after.
- Full suite, first run (stopped when the rehearsal fix landed): `remaining-school` 9 failed, a crash in `classGenres`
  (a former class's plays dealt for the student's year, fixed) and the `ur-1` dismissal (fixed by rehearsal practice:
  its standing history now the base's notice for notice); `guide-examples-productions` 2 and `looks` 1, to read on the
  next run. remaining-school 33 of 33 after both fixes.
- Full suite, second run (rehearsal practice in): 12 failed of 5,482 in 9 files, 5,470 passed. Each read and settled:
  g23 ×3 (the calls' practice, rewritten to the rule with 1 − 0.95ⁿ worked by hand), guide examples ×3 (the look's new
  words; a complete part now includes the genres), journey-career (the August tape Strong: drama counts half toward a
  police procedural, its genre part 0.23 where it was 0, 66.5 where 64.5), looks (two straight apostrophes in a comment),
  cohesion (`t.genres` read through `projectGenresOf`, as the code's convention keeps `.genres` the loves'), defects-g30-1
  (the look's words), wiring (handler lines moved), genre-coverage (regenerated). Those 11 files and remaining-school,
  163 of 163. Typecheck 0 errors; eslint on the changed files clean; title-case, label-sweep, plural-check, voice-check,
  tics, doc-refs, wired, deciders, spelling, typos, inventory, devmap, traceability, capabilities, coverage,
  student-matrix, text-inventory, guide-quotes, surfaces and effects pass; completion-matrix stale, as every watched row
  is until the final runs.
