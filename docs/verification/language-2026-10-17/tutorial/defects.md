# The Tutorial Area's Defects

Brief 14, the tutorial area, 2026-10-17. What was found apart from the voice: a sentence that said something the game
doesn't do, or a control that didn't work as its words said. Each is listed with where it was, how it was found, and
what was done.

## Fixed In This Area

1. **The help's empty search suggested a search that found nothing.** `src/ui/guide/Help.tsx`, `Results`: “Type a
   feature’s name, a word for it, or a question, such as “why is my rehearsal refused”.” `search('why is my rehearsal
   refused')` returns no entry (every word of a query has to be found in an entry, and no entry has "refused" with
   "rehearsal" in its title, synonyms, questions or short). Found by running the example through the guide's own
   `search` while rewriting the hint. Fixed: the examples are `SEARCH_EXAMPLES` in `content/guide/index.ts`, “clock
   stopped” and “how do I pay my card”, and `tests/guide.test.ts`, 'suggests only searches that find an entry', fails
   any that finds nothing (it failed on the old example).

2. **“Looking After Yourself” said the menu marked what you loved.** `src/engine/content/tutorial.ts`, chapter
   `looking-after`: “Something you love lifts you more: the menu says so beside it.” The interests went on 2026-10-10
   (`applyLookingAfter`'s own comment, `systems/life.ts`), and the menu's line (`whyNow`) says nothing of love. Found
   reading the code behind the sentence. Fixed by the rewrite: the sentence is gone. The guard for the interests
   (`tests/evidence2-b13.test.ts`) looks for "interest" and "interests", so it never saw this one.

3. **“You As An Actor” sent the player to a Practice button beside each ability.** Chapter `profile`: “Practice beside
   each one, which says before the hour about how much it will add and why.” The Practice column's control is the
   exercise's own name with an ellipsis (Comic Timing…), which opens its tier, its focus and Practice An Hour
   (`PracticeControl`, `ui/workspaces/ProfileWorkspace.tsx`); Stamina's cell says Work Out, under Look After Yourself,
   and Discipline's says Practice kept up, day after day: neither has an exercise. Found reading the screen's code.
   Fixed by the rewrite, which names the exercise, the tier and focus, and Practice An Hour, and says Stamina is built by
   Work Out.

## For The Coordinator

4. **The glossary says sleep and food bring energy back.** `docs/GLOSSARY.md`, Core, energy: “How much you have left
   today. Sleep and food bring it back.” Only a night's sleep raises energy (`applySleep`, `systems/life.ts:901`, the one
   place `energy` goes up). A meal raises nourishment and morale (`applyLookingAfter`), and hunger costs condition and
   mood, not energy (`applyElapsedWellbeing`). The chapters say “only sleep brings it back”. A Core term, so it's the
   coordinator's to correct.

5. **Where labels written as descriptions.** `tools/tutorial-routes.mjs`, run on this area's build (the text walk at 1440
   and 390 and the capture), found 14 labels in today's entries, which the domain areas are rewriting, on no screen and
   in none of the game's code outside the tutorials. A where label's part reads as a label to a player, who then looks
   for it:
   - `start.find`: Menu Down The Left, Breadcrumbs (the trail's own name is Breadcrumb), Browser’s Address;
     `start.guide`: How This Works on every panel;
   - `day.calendar`: Dialog When The Clock Stops;
   - `coursework.prepare`: Piece Of Work Set; `coursework.table`: Table Work On A Scene; `coursework.workbook`: Work It
     Through Under A Scene;
   - `papers.overview`: Your Affairs On Home Or The Menu, read as Affairs On Home;
   - `taxes.return`: Each Year’s Return Panel; `taxes.plan`: Each State’s Plan; `taxes.lien`: Under The Year A Lien
     Secures;
   - in steps: `papers.benefits`' A Connecticut Claim, and `papers.conditions`' quoted example “Therapy with Yale
     Mental Health & Counseling: 2 of 8 sessions”, which no screen prints that way.
   None is a control that doesn't exist. An earlier run listed Leave The Pace Open (`coursework.playing`,
   `productions.playing`, `craft.brief-choose`) as one: it's real, built as Leave The {axis} Open in
   `PlayingChooser.tsx`, and the tool learned to read a template standing for a word inside a label. The full list, with
   every label that is on a screen or only in the code and the file that writes it, is `routes.md`. The coordinator runs
   the tool again on the merged words.

6. **Generated tables behind the code, and the completion matrix.** This area's tests and refusal words changed
   `docs/DEVMAP.md` and `docs/TRACEABILITY.md` (each cites the test files that drive a command, and the refusal's
   words); both were written again with their own tools and committed. `node tools/completion-matrix.mjs --check`
   fails here as it failed at the baseline (`scratchpad/l14/gate-baseline.txt`): the matrix is behind its sources, and
   written again it would demote 46 rows measured on `7e7a3af6` whose engine code has changed since, the baseline's
   `content/guide/types.ts` among it, from 612 to 566 of 636 Implemented And Verified; decision 4's four Decision
   Required rows don't move. That's the coordinator's, with the handoff's completion line, after the merge: this area
   left the matrix as it found it.
