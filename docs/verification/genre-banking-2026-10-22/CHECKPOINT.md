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
- G proof (P1): `tests/b21-genre-proof.test.ts` (42 tests) over `tests/setup/genre-proof.ts`, the table written by
  `genre-proof.ts`; it found the School's genre part complete only at 100 (`genrePart` read the known share of 90), fixed.
- B, the banking module: B1 yields converted (`Product.quoted`, `compounds`, `creditsEvery`, `pays`), B2/B3 a US card's
  days past due (`pastDue`, `US_LATE`: 61, 45 after, 150, 180), B4 the charge-off at 180 days, B5 a US due day each
  month (`usDueDay`), B6 standing orders on the next business day in Britain, the EU and the EEA; the Statements tab and
  the card's panel brought to the same due day; the old-save migration (S). Banking proof (P2):
  `tests/b21-banking-proof.test.ts`, 17 tests, which found a payment clearing two minimums (fixed: `towardPastDue`).
- The banking-related tests the rules moved, brought to them with dated notes and hand-worked figures; renamed titles
  repointed in the audit and the surfaces matrix.

- Committed and pushed: `63091d78` (genre proof), `168fabdc` (banking), `22dc917c` (effects citations remapped, 251
  followed and 6 placed by hand; DEVMAP and TRACEABILITY regenerated). The banking-related files on `168fabdc`'s code:
  1,659 of 1,660, the last (the six-miss journey's past-due words) brought to it after: 91 of 91 in the seven files the
  wording reaches. The container restarted during the first full suite on `168fabdc` (killed, no result); rerun.
- After `22dc917c`, uncommitted until the tested commit:
  - The built-app walk (`app/walk.mjs`, three saves from `app/make-saves.ts`) found the card's panel saying "Miss six
    in a row" and "Miss two payments in a row" where the rule is days past due, and the Statements tab dating a US
    card's payment without the 13th; fixed. It passes at 1440 and 390, nothing found.
  - The banking proof found a payment made after a statement clearing a past-due short and the new minimum at once;
    fixed (`towardPastDue`), and a US card's minimum payment due now includes what's past due, as Regulation Z's sample
    statement shows it (`banking-sources.md`). The late notice and the statement say how much of it is past due.
  - J2 (`tests/b21-journeys.test.ts`) found the Rep's 2026–27 Seagull, a first year's only stage work, read and taught
    no genre: it's in no play catalog and its casting names no play. Fixed: `SEAGULL_2027.kinds` (tragicomedy and
    drama, as Uncle Vanya's), read through `genresOfHolder` wherever a School holder's genres are read (calls, nights,
    the lines' speed, a night's genre part and families, enjoyment). Three tests the fix moved, brought to it: g21 (the
    delivery the chair reads, now worked from the runs' unrounded records and held exactly), b08 (its night rule now
    reads the genre part at its 0.75 floor), g27 (her Ilse and his Melchior Gabor, the bond rule checked over both
    casts). Regression tests: three in `tests/b21-genre-proof.test.ts`. J1 and J2 pass (17 s and 24 s).
  - Committed as `59e9c4af`. Full suite there, before the last test fix: 5,544 of 5,545 in 482 files; the one failure,
    language-money's old penalty sentence, 21 of 21 after.
  - P3, 27 mutations (`mutations/`), in a clone of `59e9c4af`: 24 killed, each by an assertion in milliseconds. Three
    survived, and each one's test was too weak:
    - G5: a tag listed twice. `['comedy', 'comedy']` can't tell, since two halves of one genre are its whole; a duplicate
      with another tag between now does.
    - G9: a professional rehearsal day's practice. The film and run tests credit the same genres from shoot days and
      nights; a played test of Calder Street's twenty rehearsal days alone now does.
    - B12: a payment counted toward the past due once. The notice date alone couldn't tell, since 13 November's is the
      oldest either way; the past-due list after 13 December now does.
    All three were killed on the rerun (`mutations/results-rerun.json`).
  - After `59e9c4af`:
    - The tutorial's Your Bank said every card was charged off at six missed payments. It now gives the US days, with a
      test that ties the tutorial and the guide to `US_LATE`.
    - `banking-sources.md` said Citi's and Capital One's 15th "were one day already". It now gives the later day after a
      statement past the 22nd.
    So the tested commit moves to the next one.
  - Not changed, recorded: the class's expected genre record (`classGenres`) counts School productions and never the
    Rep, as before; a class scene of The Seagull (`seagull-4`) still reads no genre speed, since `genresOfPlay` keeps
    to the catalogs and migration 92 reads it (a class scene is outside the paths the brief names).

## Left

- The final runs on the tested commit, then the matrix fold, the gate in a clean clone, the receipt and the handoff.
- The full suite, the effects matrix's file:line citations, devmap and traceability, then the gate in a clean clone and
  the final runs; R: handoff, receipt.

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
