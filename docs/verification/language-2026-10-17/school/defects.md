# Defects The School Area Found

Brief 14's school area. Each is what, where and how found. None changed a rule, a figure or a save's shape: each was a
sentence that said something untrue or ungrammatical, fixed in its assembly, with the test that holds the new words
named. No functional defect (one that changes an outcome) was found in this area's sources so far.

## Text Defects, Fixed

1. **“You and Sofia had rehearsed together 1 times.”** `systems/coursework.ts` `noteText`, the note on the partner part:
   the count was printed bare, so one rehearsal read “1 times” and none read “0 times”. Found by printing the note at 0,
   1, 2 and 3 kept rehearsals (`render.mts`). Now “once”, “twice”, “3 times”, and “hadn’t rehearsed together” at none.
   The same for the reader's evenings. Held by `rendered.txt` and `tests/evidence-g24-school.test.ts`.
2. **“The choices wasn’t complete, which cost the believability 47.3 points.”** `systems/evaluation.ts` `chiefLimit`
   with `content/tasks.ts`'s preparation labels: a plural label as the subject of “wasn’t”. Found on the before walk's
   Coursework tab (workload save, the song's Shown Today). The labels are now subjects a verb agrees with (“Making your
   choices”, “Learning the lines”, “Taking the director’s notes”, “Breaking down the text for your reading”). The ids
   and the figures are unchanged.
3. **A forecast in the past tense.** The same `chiefLimit` said “wasn’t complete, which cost” on Shown Today and on a
   brief's taped-now line, which are forecasts. It takes a tense from 2026-10-17; the forecasts pass `now`.
4. **“… so the 1 calls still to come are off.”** `systems/school.ts` `leaveCabaret`: bare count. Now “the one call still
   to come is off” at one.
5. **“1 courses gave you their first work now.”** `systems/coursework.ts` `orient`, the session on the courses: bare
   count. Now “One course gave you its first piece now” at one.
6. **A note taken and back again read as never taken.** `feedbackWords` said “The same note as on …: it’s still there”
   of a note the ledger had marked taken (`resolvedOn`) and that had slipped back under 45%. It now says “You’d put this
   right on {day}, but it has slipped back.” Found by playing a term in `render.mts`, where the lines were taken at a
   revision and short again on the next piece.
7. **“Trifles, The one act, the Wright kitchen: you play …”** A scene's place opens on a capital in the material
   (`where`), and was printed mid-sentence in the set-work notice and on the assignment card. Now lowercased at the
   join where it opens on “The” and a lowercase word (`whereWords`); the material is left as it is.
8. **“Ethan won’t rehearse before 7 or past 22.”** `mateBusy` printed the hours as raw numbers. Now “before 7 in the
   morning or after 10 at night”, from `WORK.rehearsal`.

9. **A notice of concern named the wrong next step before the last term.** `setStanding` said “If your next term review
   finds you short again, the next step is an academic warning” (and before brief 14, “Remedy it by the end of next
   term, or it becomes an academic warning”) to every student given a concern. A concern given at the second-to-last
   term's review is followed by the last term, where `evaluate` steps a short term at concern to the degree not
   recommended, not to a warning. Found by reading `evaluate` behind the sentence for this pass. The notice now reads
   the step from `shortTermWords(school, school.termsBegun)`, the same function the coursework warning uses, so it
   says “the faculty would not recommend your degree” there. No rule moved. Held by
   `tests/evidence-g21-school.test.ts` (a concern before the last term) and `tests/school-journey-gaps.test.ts` (a
   concern in it).
10. **“… and nothing says when you’ll be.”** An accidental run of `tools/voice-check.mjs --fix` over the whole tree
   contracted a sentence-final “will be” in `leave.ts`'s assessment finding, “How You’ll Play It is” into “How You’ll
   Play It’s” in two guides, “a show there is” into “a show there’s” and “How rested you are when” into “How rested
   you’re when”. Each was rewritten so neither form is needed; the same run's changes to sixteen files of other areas
   (among them a Shakespeare quotation in `scenes-classical.ts`, and “a license past it’s renewed” in `identity.ts`)
   were reverted unseen by anyone else. The tool's `--fix` rewrites every file when given none: it isn't safe to run
   whole-tree during this pass, where each area owns its files.
11. **The guides quoted refusals the game no longer says.** Sixty-nine of the quotations in the school, coursework and
   productions entries' “If you can't” lists were the words before batches 1 to 3 (“Today’s classes have been and gone;
   calling in sick now excuses nothing.”, “Orientation is behind you.”, “Read already.”, “SLATE’s faculty don’t approve
   year N a second time.” and the rest). Each was set against its refusal in the code and replaced with the current
   words; `tests/guide-examples-productions.test.ts` asserts the Summer Cabaret's.

## For The Coordinator

- `tools/text-inventory.mjs` counts a source's status against its text's hash, so a sentence another area changes in a
  file of mine (or I in theirs) needs its status again. I changed one test of another area's to hold my words:
  `tests/genre-identity-screens.test.ts` (profile), whose genre pane quotes `chiefLimit`.
- `src/ui/bank/RoundUps.tsx` (the money area's) heads the round-ups notes “What The Bank Leaves Open, And What SLATE
  Leaves Out” and prefixes each `notHere` line “Not in SLATE:”. The notes themselves (`content/roundups.ts`, which the
  inventory gives to this area) now say “the game” where they said SLATE; the heading and prefix are the money area's
  to change, so the panel may read “Not in SLATE: … purchases in the game aren’t refunded” until they do.
- Other areas' tests that hold this area's words, changed with them: `tests/decisions-advice.test.ts` and
  `tests/defects-g30-1.test.ts` (the preparation labels, read by `next-steps.ts` and the work look),
  `tests/briefs.test.ts`, `tests/defects-r8-1.test.ts` and `tests/defects-g3-1.test.ts` (a brief suggested for a
  weakness), `tests/decisions-stamina.test.ts` (the workload line), `tests/need-paths.test.ts` (the guide's Need).
- `src/engine/systems/next-steps.ts` and `src/ui/looks/actor.tsx` (profile's) keep their own fallback label for a way of
  playing, “The way you chose to play it”; `evaluation.ts`'s is “Rehearsing the way you chose to play it”. Both read
  as subjects; they differ only in wording.
- **`docs/TRACEABILITY.md`** quotes each command's refusals; `node tools/traceability.mjs --write` was run here and
  changed only the School's rows (eight lines, each a refusal now in new words). Regenerate it at merge after the other
  areas' rows.
- **`node tools/completion-matrix.mjs --check` exits 1 in this clone**: regenerated, the matrix would move 85 rows from
  Implemented And Verified to Verification Incomplete, since the files they read changed after their measurements
  (this pass edits the words in them). The matrix and the master handoff's completion line weren't regenerated here:
  it's a decision for the merge, not a school-area one.
- **PlayingChooser and the suitability bands**: batch 3 already says “it suits the scene, so it asks less” and “it goes
  against the scene, so it asks more” (the baseline said “with the grain of the scene”). The guides and the chooser's
  The Scene column read `GRAIN_LABEL`, so they take the profile area's “Works Against The Scene” at merge.
