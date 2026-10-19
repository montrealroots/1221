# Brief 15, The Profile Area: Batches

The area's sources are 615 in 27 files (`prompts/profile.md`), every one Pending in the second pass at the start. Each
batch below says what it read, what changed and what stayed, where a rewrite could have changed what's true and how
that was checked, the whole interactions read, the tests and tool matchers it updated, and the checks with their exits.
`b1-looks.txt` and the files after it are the game's own output, printed by playing it (`render-looks.ts.txt` and the
scripts named beside each).

## Batch 1: The Abilities, Their Looks, And A Piece Of Work

**Sources read (27):** `content/abilities.ts` (12, one per ability), `ui/looks/actor.tsx` (3: the band words, the
development sources and `top`, which holds the ability's, the genre's and a piece of work's looks),
`ui/components/AttributesPanel.tsx` (1), `systems/attributes.ts#alreadyApplied` (1), `content/attributes-matrix.ts` (6),
`content/genre-coverage.ts` (2), `content/reference.ts` (1), `content/demands.ts` (1). About 4,100 words.

**The interaction read whole:** an ability from the Attributes And Craft table (its row's Today, It Shapes and Last
Change) into its look (Now, Classes Reach, Last Change, How it grows, Where it started, What it does, Where it counts, To
practice it, the history) and on to a piece of work it was judged in; a genre from the Genres table into its look and
its two buttons, Study It and Open Its Brief; composure on the School screen against its look on the Profile.

**Rewritten:**
- **What it does, all twelve that needed it** (`affects`). Each was one sentence fragment of up to ninety words: a
  semicolon list, its subject often at the end ("…, your consistency"), and "more the more" doing the work of a
  sentence. Each is now short sentences, one effect each, opening on what the ability does for you: "How believable
  you are in everything you perform…", "It matters most when the material is grave.", "It also sets how much you get
  done in an evening rehearsing with a partner or a reader…". Vocal Expression and Physical Expression already read
  that way and kept theirs.
- **How it grows,** for presence, composure and stamina, where three activities were run together by semicolons.
- **Where it started,** for presence ("from 55 to 80 for a student the faculty chose" was the code's comment) and the
  four abilities kept in the craft ("It started with the rest of your training, as your techniques did" named nothing
  the player has seen; they're drawn with the techniques at admission).
- **The genre look:** its summary for a genre studied says a scene or a part from a play of its kind is quicker to
  prepare, where it said a part only; for a genre not yet studied it repeated the conventions the body says a line
  below, and now says what to do. "Its brief is finished work" (a developer's note) is now the way to tape it, Open Its
  Brief. A genre with no requirement says the research found nothing it asks beyond any self-tape, the Genres table's
  own words.
- **A piece of work's look:** "Worked out again from what it was judged on" is "Judged again from its record", and its
  two other variants match. The link from an ability to a piece reads "A Taped Brief, 50.2 of 100, with yours at 57.0".
- **The development history's** "The nerves of a performance" is "Nerves before a performance".
- **Your Composure, on School:** the exercise that trains it is named with where it is (under Attributes And Craft on
  the Player Profile), and the solo showing the ability's own look names is no longer left out.

**Kept, and why (the reasons are in `docs/text/second-pass/profile.json`):** the band words; the refusal for an action
pressed twice; the twelve demand labels; the registry's two developer errors; the attributes matrix and the genre
coverage, which write maintainers' documents no screen imports. In the ability texts: every definition, every source
line, and the How it grows of the nine abilities whose lists were already plain.

**Meaning-sensitive, and how each was held:**
- **Every clause of every ability's How it grows and What it does** is held by its own check in
  `tests/attributes-phase-2b.test.ts` (A4, brief 11), whose GUARD fails a sentence that says anything beyond its
  clauses but "and", "or" and punctuation. Each clause's words in the test were moved to the new words and its check
  left exactly as it was, so the new sentence is held clause by clause by the checks that held the old one. A clause
  now carries its own opening words ("It matters most when the material is grave"), since the GUARD allows nothing
  else between clauses.
- **The working reference's example 6** (listening) said "in scenes with a partner". The clause it rewrites is held by
  `readsIn('listening', 'partnered', …)`, and the Partnered Physical Work task is a fight or a moment of intimacy
  (`content/tasks.ts`). The sentence says "in a fight or an intimacy scene with a partner", as emotional depth's
  already did, so it doesn't claim more than the check holds.
- **Composure** said "a little of your believability when the stakes are high; your believability in any piece you play
  Restrained". The new sentences keep "a little" on the stakes alone and don't put it on the Restrained effect.
- **Presence's start** is `ATTRIBUTES.presence` ({ from: 55, span: 25 }) and the draw `(next() + next()) / 2`, so "most
  often near the middle" is the shape of the draw; classmates are drawn the same way (`presenceFor`).
- **The genre summary** was read against `genreSpeed`'s three callers: a part's lines in a production (twice) and a
  class scene's preparation, where the speed is the larger of the genre's and the material's (`coursework.ts`).
- **The piece's foot line:** `replay` judges the kept inputs again; a record under another ruleset gives none, which
  `tests/decisions-stamina.test.ts` plays.

**Tests and tool matchers updated (words only, every assertion as exact as before):**
- `tests/attributes-phase-2b.test.ts`: 42 clause words.
- `tests/guide-examples-craft.test.ts`: the genre summary's regex, as narrow as before (`/a scene or a part from a play
  of its kind \d+% quicker to prepare/`), the guide's quote of it, and the piece's foot line.
- `tests/decisions-stamina.test.ts`: the old ruleset's foot line, exactly.
- `src/engine/content/guide/craft.ts`: the Genres entry's example quotes the new summary. The guide is this area's,
  and is read whole in batch 5, where it's marked.

**Checks:** `npx tsc -b --noEmit` exit 0. `npx eslint` on the seven changed files, exit 0. `npx vitest run` (two forks)
on the 24 test files that read the abilities, the looks or the composure panel: 396 of 396, exit 0. title-case 0,
label-sweep 0, plural-check 0, voice-check 0, tics 0 (no count moved), spelling 0, typos 0, doc-refs 0, deciders 0,
guide-quotes 0. text-inventory 1 before marking, on the 16 sources whose words changed, and 0 after (but for the
composure panel, below).

**Screens verified:** `b1-looks.txt`, printed by `resolveLook` on a first-year in New York: all twelve ability looks, a
genre look of each kind of demand before any work, drama studied once and its brief taped, that take's own look, two
ability looks after it, a gone work and a gone genre, a life that never trained, and every development source.

**Left for the built app:** `AttributesPanel` is drawn by `tests/evidence-g08-life.test.ts` and `-g29-ui`, which read
its figure and not its paragraph, so it's marked once the School screen is read on the built app at the end of the
area.

## Batch 2: The Player Profile And The Advice

**Sources read (31):** `ui/workspaces/ProfileWorkspace.tsx` (17), `systems/next-steps.ts` (10), `systems/experience.ts`
(4). About 2,300 words, and the advice's every variant as rendered.

**The interaction read whole:** a new life's Profile (nothing judged yet), then the advice as it grows: the first
training line, its standing once it has led a while, the line when another takes over, what moved its forecast, the
next hour, what the forecast assumes, the verdict on preparation and training, the line beside a brief, and the all-full
line; then the Practice control the advice sends the player to, in both tables; the Genres table's suggestion and its
two buttons; Readiness Today against How You Are's Condition.

**Rewritten:**
- **The advice's standing** (`standingOf`), the working reference's example 7, in both shapes. The lead now "has led the
  advice on what to train since …"; when another has taken over, the sentence says what led, until when you last saw
  it, what it has done since it took the lead, and why it moved on ("Emotional depth’s forecast is now the higher, at
  0.84, so it leads now"). Section 8 asks a repeated message to say what the player did, what changed and why it still
  holds or moved on: the hours practiced, the pieces done since and the parts that moved the forecast were already
  there, and now read in that order.
- **Variants that read badly:** an unmoved forecast ("gone from 0.8339 to 0.8339"), one piece counted as "1", a note
  the same day ("since …, today"), "Of the 1 piece". Each has its own shape now (`defects.md`, D2).
- **The training line** (`recommendations`): "judged again as you are now" for "replayed with you as you are now";
  "an hour a day"; "your last 6 pieces all call on it" for "6 of your last 6"; the discipline's share "comes from" it;
  the Focus setting named as the control names it ("Set Focus to Steady to start").
- **The next hour** (`nextOf`) names the Focus setting, the Practice column and the panel, and for a technique the
  Techniques panel (`defects.md`, D1).
- **The verdict** (`attentionSaid`): "worth your time" for "deserve attention", and "would add" for "would bring" and
  "would have brought it".
- **What the forecast assumes** (`assumesOf`): one piece as "it", one genre as "its genre", a comma before the last of
  several.
- **The line beside a brief** (`heldVersusNext`): the two forecasts at two places, so they don't print as a tie the
  sentence then breaks, and its last clause a sentence of its own.
- **The all-full line** (`allFull`): "so more practice wouldn’t improve that work", "stamina isn’t full".
- **The Profile:** the empty state for a life without the school ("This life began outside drama school" was the game
  describing its own state); In your own words; the advice's empty state, leading with when it starts; Risk Tolerance
  with no card ("but you don’t have a card"); the suggested genre ("is worth studying next: …"); the stamina paragraph,
  whose "After that" followed the wrong sentence; Open Its Brief named in the Genres fine print; and **Current Condition
  renamed Readiness Today** (`renames.json`), since Condition is one of the eight wellbeing measures and this panel
  doesn't show it.

**Kept, and why (reasons in `docs/text/second-pass/profile.json`):** the material labels (`FEATURE_LABEL`), the five
parts a change of forecast is said in (`PART_SAID`), the dispositions (creation's own words, the frame area's), sleep
owed, Today's causes, stamina's practice cell, the Practice control's labels, Your Work So Far, Techniques, the filter
box, School Journey and Development History.

**Meaning-sensitive, and how each was held:**
- **Every figure in the advice** is the engine's, in the same place. `tools/advice.ts` was run over the 30 tuning cases
  (`advice/tuning.json`, `advice/tuning.log`): F1 to F6 30 of 30, H1 to H6 30 of 30, 485 reads and 0 stale, 806 changes
  and 0 unexplained, check (g) 136 of 136. Its whole summary is identical to brief 14's run
  (`docs/verification/language-2026-10-17/advice/tuning-final.json`), so no ranking, figure or note moved.
- **"Judged again as you are now"** is `trainingForecast`: the recent pieces judged again at today's levels, with and
  without the trained gain.
- **"Since it took the lead"** is `was.since`, the day the input became first (`noteAdvice`); "when you last saw it" is
  `was.day`, the last day the advice was noted, which happens only where the advice is shown beside what it's for.
- **The working reference's example 7** said "so training it is now worth less". The forecast can fall because the
  work it's forecast on changed as well as the level, and the parts sentence after it says which, so the standing says
  what moved, and doesn't say why in one word.
- **"Worth your time"** keeps the verdict's floor: each side at a tenth of a point a piece or more (`ADVICE_FLOOR`).
- **The panel in the next hour** is what the exercise trains (`isAbility(targetId(e.trains))`), the same test the two
  tables are built on.

**Tests and tool matchers updated (words only, every assertion as exact as before; three added):**
- `tests/decisions-advice.test.ts` (the standing's two shapes, the pieces' count in its three shapes, the discipline's
  share, the verdict's four starts, the preparation and training words, what the forecast assumes, the all-full line,
  the parts sentence), `tests/defects-r8-1.test.ts`, `tests/evidence-g23-school.test.ts` (the training line's regex),
  `tests/language-dynamic.test.ts`, `tests/attributes-phase-2b.test.ts` (the preparation line's regex),
  `tests/evidence-g28-ui.test.ts`, `tests/evidence-g31-ui.test.ts`, `tests/evidence-g32-ui.test.ts`,
  `tests/need-paths.test.ts`.
- **Added:** `tests/advice.test.ts`, the next hour's panel for an ability and a technique (D1, mutation-tested);
  `tests/evidence-g32-ui.test.ts`, the Profile's empty state for a life with no craft.
- **Tools:** `tools/advice-harness.ts` (S3's branch by " when you last saw it, on ", the forecast now by "is now the
  higher, at", the level by "It’s still at", an unmoved forecast by "its forecast is still", the parts sentence by
  "since it took the lead:"); `tools/advice.ts` (F2's genre words in both shapes, F5's verdict starts, (g)'s count with
  "all"); `tools/acceptance-ui.mjs` (the training line's regex, the verdict's "worth your time", the Readiness Today
  heading by role and name); `tools/playthroughs-ui.mjs` (the training line's regex and the verdict).
- `src/engine/content/attributes-matrix.ts` names the Profile's sections, so Readiness Today, and
  `docs/ATTRIBUTES-MATRIX.md` was written again by `tools/attributes-matrix.ts` (one line moved).
- `src/engine/content/guide/craft.ts`: the Profile entry's quote of the empty state and its panel names. Marked in
  batch 5.

**Checks:** `npx tsc -b --noEmit` exit 0. `npx eslint` on the 17 changed `.ts` and `.tsx` files, exit 0. `npx vitest
run` on the 38 files that read the Profile, the advice, the looks or the guide: 609 of 612 at first, the three failures
each an assertion still on the old words (the preparation line twice, the "neither" verdict once), then those three
files 98 of 98, exit 0; `tests/advice.test.ts` 6 of 6 with the new test, which fails with the panel forced back
(mutation, exit 1); `tests/evidence-g32-ui.test.ts`'s p-condition 7 of 7. title-case 0, label-sweep 0, plural-check 0,
voice-check 0, tics 0 (no count moved), spelling 0, typos 0, doc-refs 0, deciders 0, guide-quotes 0 (580 of 580).
text-inventory 1 before marking, on the sources changed.

**Screens verified:** `b2-advice.txt` (from `render-advice.ts.txt`): the advice on four tuning cases (adv-t-0, -5,
-10, -13) as built, after twenty sessions of what each named first, and after a new take and five more sessions: every
shape of the standing (the same lead, another taking over, one led before), an unmoved forecast, one piece and several,
the next hour, what it assumes with one genre and several, the verdict, the line beside a brief. The Profile's stamina
paragraph and Genres fine print, and Readiness Today, are read on the built app at the end of the area, where
`AbilitiesPanel` and `GenresPanel` are marked.
