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

## For The Coordinator

- `tools/text-inventory.mjs` counts a source's status against its text's hash, so a sentence another area changes in a
  file of mine (or I in theirs) needs its status again. I changed one test of another area's to hold my words:
  `tests/genre-identity-screens.test.ts` (profile), whose genre pane quotes `chiefLimit`.
