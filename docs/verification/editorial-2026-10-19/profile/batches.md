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

## Batch 3: Practice, Notes, Studying A Genre, Your Work So Far

**Sources read (44):** `content/practice.ts` (30: the exercises, each exercise's design, the tiers and the focuses),
`systems/practice.ts` (6), `systems/learning.ts` (4), `systems/engagement.ts` (3), `systems/artistry.ts` (1). About
2,400 words.

**The interaction read whole:** an exercise from its button in the Practice column, its challenge and tier, the Focus
control and its line, the preview, Practice An Hour, what the hour found, the four-hour refusal; a note that keeps coming
back and the four other ways at it; the teacher's next step once a piece holds together; Your Work So Far's lines.

**Rewritten:** the preview's "It’s more or less than an ordinary hour because" (also an idiom for "about") is "Compared
with an ordinary hour:", and "The higher it is" is "The higher your level"; what the hour found at full ("Steady or not,
it’s full"); the seven next steps a teacher gives beyond the work, each as instructions, not a heading and a colon, the
shape the working reference's example 2 gives the note; Put It First's "the work" (the piece); a habit on Your Work So
Far ("You tend to play it driven: 4 of your 5 choices of pace"), and taking direction's zero ("you answered none"); one
exercise's description.

**Kept, and why:** the other 29 exercises' descriptions; all 27 exercise designs, each a concrete studio task in three
tiers (each with its own reason in `docs/text/second-pass/profile.json`); the tiers and the five focuses; the refusals
(the hospital, asleep and at-a-commitment ones are shared word for word with six other systems in other areas, so they
stay as they are here: see the report); past mastery; the note subjects; a study's film. An exercise's `source` line is
shown nowhere but the maintainers' attributes matrix, so its "SLATE’s own drill" was left as a developer's note.

**Meaning-sensitive, and how each was held:** the preview's factors are each a factor the hour's formula multiplies by,
in the same order (`terms`); nothing in a next step's advice moved, only its punctuation and two verbs.

**Tests and tool matchers updated:** `tests/evidence-g18-school.test.ts` (Put It First, three places),
`tests/evidence2-b11.test.ts` (the habit twice, taking direction twice), `tests/defects-g8-15.test.ts` (the habit),
`tests/evidence-g23-school.test.ts` (taking direction), `tests/variety.test.ts` (at full, a regex as narrow as before),
`tests/guide-examples-craft.test.ts` (the regex the guide's quote is found by); the guide's quote of the habit in
`content/guide/craft.ts` (marked in batch 5).

**Checks:** `npx tsc -b --noEmit` 0. eslint on the 11 changed files 0. `npx vitest run` on the 30 files that read
practice, notes, the ways at a note, studying and Your Work So Far: 418 of 420 at first, the two failures assertions on
the old words (the guide's quoted habit, the full line), then those two files 16 of 16, exit 0. title-case, label-sweep,
plural-check, voice-check, tics (no count moved), spelling, typos, doc-refs, deciders and guide-quotes 0; text-inventory
1 before marking.

**Screens verified:** `b3-practice.txt` (from `render-practice.ts.txt`): the Focus control's lines; the preview at five
tier and focus pairs, tired, and after two hours; four hours pressed through the command and the fifth refused; what the
hour found in every focus and gap, a tier below and above, past mastery and at full; the four ways at a note; the seven
next steps as a note says them; Your Work So Far on adv-t-10. `b3-looks.txt`: the ability looks again, for the changed
exercise line.


## Batch 4: A Genre's Conventions, How Its Scenes Are Played, And A Way Of Playing It

**Sources read (345):** `content/genres.ts` (149, each genre's conventions), `content/genre-register.ts` (149, how its
scenes are played), `content/contemporary.ts` (29, the contemporary plays), `content/film-genres.ts` (1, the names),
`systems/register.ts` (3), `content/interpretation.ts` (8), `content/approaches.ts` (2), `systems/interpretation.ts` (2),
`systems/interpretation-read.ts` (2). About 7,100 words.

**The interaction read whole:** a genre from the Genres table into its look (its summary, what it asks, Its
conventions, How its scenes are played and where that comes from, the research's small print, the source), for every
one of the 149; then, in a brief, the ways of playing it with why each suits the scene or works against it; then what a
take's look and The Last Take say the way it was played did.

**Rewritten:**
- **Fifteen conventions** (absurdist, chanbara, cosmic horror, dance, grindhouse, holiday, isekai, kaiju, kitchen sink,
  medical drama, mumblecore, political drama, psychological thriller, slapstick, yakuza): a straight apostrophe or
  quotation mark in each, now the house's ("that season’s traditions", "Kaiju (‘strange beast’) eiga"). No word moved.
- **Three registers.** Action's "Its chases and fights are staged techniques" named neither: "Its chases are stunt work
  and its fights stage combat". Anthology's "each segment is a drama" (a segment is the engine's word for a beat): "each
  story is a drama". Docudrama's "the real people are its staged transformation": "by actors who must become the real
  people".
- **What the way you played it did** (`grainWords`, on The Last Take; `takeGrainWords`, on a kept take), all six
  variants. "It gave the take 1.1 points (+1.5 on the believability, -0.4 on the connection). What your abilities and
  techniques cost it, apart from that: 4.2 points." is "and added 1.1 points to the take (+1.5 to believability, −0.4 to
  connection). Apart from that, your abilities and techniques cost it 4.2 points.", with a minus sign for the hyphen; the
  kept take's "which gave it 1.1 points; your abilities and techniques cost it 4.2." is two sentences, the second saying
  points.

**Kept, and why (each source's reason is in `docs/text/second-pass/profile.json`):** the other 134 conventions, each a
plain definition paraphrasing its source, which a rewrite would drift from; the other 146 registers, each a sentence on
what the genre's scenes turn on, followed by where that comes from; the 29 contemporary plays, catalog facts as their
publishers give them; the genre names; a concern's sentence, where a register comes from, and the note beside a take's
chief limit (`register.ts`); the reasons a way of playing suits a scene, the three axes and the six ways, and the For
It and Against It labels.

**Meaning-sensitive, and how each was held:**
- **The two grain sentences** print the same fields in the same places (`g.points`, `g.ability`, each dimension's
  points); a negative now prints its magnitude after a minus sign, and zero prints bare, as before.
  `tests/interpretation.test.ts` reads both openings and their figures, its regexes moved to the new words and no
  looser.
- **Action's register** is what action's research names ("fights, chases, shootouts and stunt work") and the School's
  Stage Combat technique; the concerns it explains (command, tension) didn't move.
- **Docudrama's register** keeps the sense the garbled clause had, that the real people are played by actors who must
  become them, beside its conventions (historical events, recent and controversial).

**Tests and tool matchers updated:** `tests/interpretation.test.ts` (the two grain regexes);
`tools/acceptance-ui.mjs` and `tools/playthroughs-ui.mjs` (the kept take's grain line, found by its new words).

**Checks:** `npx tsc -b --noEmit` 0. eslint on the four changed `.ts` files 0 (the two `.mjs` tools aren't in the
project's lint, which is `.ts` and `.tsx`; both parse with `node --check`). `npx vitest run` (two forks) on the 23
files that read the genres, their looks, the registers, the ways of playing and the grain: 710 of 710, exit 0; after
the action and docudrama registers moved, the six genre-look files again, 67 of 67, exit 0. title-case, label-sweep,
plural-check, voice-check, tics (no count moved), spelling, typos, doc-refs, deciders and guide-quotes 0;
text-inventory 1 before marking.

**Screens verified:** `b4-genres.txt` (from `render-genres.ts.txt`): every genre's look on a new life, all 149, and the
six grain variants. It was printed once batches 6 and 7 had rebuilt the research's small print, so it shows theirs too.


## Batch 5: The Guide's Chapter "You As An Actor"

**Sources read (19):** `content/guide/craft.ts`, every entry (The Player Profile, Practice, Genres, Preparing A Brief, A
Reading And A Way To Play It, Who Reads With You, Taping A Brief, A Piece Of Work, Explained, Your Work So Far), the
connections between them by kind, and the names its examples use. About 10,400 words.

**The interaction read whole:** each entry as the guide shows it, field by field (where, short, steps, needs, costs,
reads, now, later, interpret, unavailable, mistakes, next, connections, example), against the screen it describes as
batches 1 to 4 left it.

**Rewritten:**
- **The Player Profile:** it opened "The Player Profile is you as an actor." and never said how to open it; it now says
  what the Profile shows and that P or Player Profile on the menu opens it, names Readiness Today, uses the advice's
  "judged again as you are now", and its First Line value says what the advice now says ("led the advice on what to
  train", "with where to find it", "worth your time"). Its quote of the empty state is the game's.
- **Practice:** its short gives the first thing to press (the exercise in the Practice column, a Tier and a Focus,
  Practice An Hour), and where the exercises come from moves to its end; its step says "how it compares with an
  ordinary hour", as the preview now does.
- **Genres, Preparing A Brief, A Reading And A Way To Play It:** each short says where its control is (Study It beside a
  genre, Open Its Brief, Your Reading and How You’ll Play It in the brief), and "Before a take" is "Before you tape a
  brief". The Genres example quotes the genre look's new summary.
- **Who Reads With You:** "Your own take uses none of it." had no clear "it": "Your own result counts nothing the reader
  brings.", here and in its connection.
- **A Piece Of Work, Explained:** "worked out again" is "judged again", three times, as the piece's foot line now says.
- **Your Work So Far:** its quote of a habit is the game's new line.
- **The connections:** Readiness Today's; practice's ("uses what practice grew at its new level" had two subjects for
  "its"); the genre's ("read by its interpretation", the formula's shape, is "it counts toward the take’s
  interpretation").

**Kept, and why:** Taping A Brief, which walks a take from Tape It to The Last Take with every figure its example plays;
the prerequisite, immediate and history connections, each one short sentence with its figure; the chapter's opening and
locked lines; the readers' names and the ways a reader plays the other part.

**Meaning-sensitive, and how each was held:** every figure in the guide is computed from the rules it describes, and
`tests/guide-examples-craft.test.ts` plays each worked example through the commands and checks its words.
"Counts nothing the reader brings" is `sharedOf`, worked out beside your own result and never changing it. The genre's
connection is the Interpretation quality's preparation list, which reads the genre (`content/tasks.ts`).

**Tests and tool matchers updated:** none in this batch; the guide's quotes moved with batches 1 to 3, where their
tests did.

**Checks:** `npx tsc -b --noEmit` 0. eslint on `craft.ts` 0. `npx vitest run` on the five files that read the guide
(`guide-examples-craft`, `guide`, `help-mechanics`, `tutorial`, `language-dynamic`): 85 of 85, exit 0, before and again
after the last three connections moved. guide-quotes 0, 580 of 580 quotes found in the game; the other checks 0;
text-inventory 1 before marking.

**Screens verified:** `b5-guide.txt` (from `render-guide.ts.txt`): the nine entries field by field, as the guide draws
them.


## Batches 6 And 7: The Research's Small Print On Each Genre

**Sources read:** `content/genre-demands.json`, one source a genre: in batch 6, Absurdist to Historical Fiction (65
genres, about 13,700 words); in batch 7, Holiday to Zombie (84 genres, about 13,700 words). Each holds what the
genre's look shows of the research: what it asks of an actor (the claim), why each requirement is applied, where it
belongs to a strand and not the whole genre, what its source says in its own words and how sure the research is, and
what's still uncertain. The file is built by `tools/build-attribute-content.mjs` from the research
(`docs/research/attributes/research-genre-demands.json`) and the edits in `genre-demands-words.txt`, so every change
here is a "- old" and "+ new" pair in that file's brief 15 block, and the JSON is the builder's output.

**The interaction read whole:** a genre's look from What it asks of an actor down to Still uncertain, for every genre,
in a print of exactly those fields (21,652 words as the look shows them), then each applied genre's Why it’s applied
lines.

**Rewritten:**
- **Batch 6 (eight genres).** Action Comedy's uncertainty began "The tool that read the page summarized it", how the
  research was done: "The page was read through an automatic summary, and its remarks on Jackie Chan may be the
  summary’s own". A plural possessive outside a quotation takes the house's apostrophe in Action Comedy's claim, Art
  House's (twice), Conspiracy Thriller's, Dance's source line and its why line, Docufiction's and Documentary's source
  lines, Gangster's uncertainty and Giallo's source line.
- **Batch 7 (seven genres).** "Isn't applied" and "wasn't applied", the builder's words, are "the research didn't
  name", the phrase the other genres' small print already uses: Political Drama's, and Horror's, whose semicolon list
  is two sentences. Mystery's "the researcher’s own reading" (a person the player never meets) is "an unsourced
  reading". Social Realism's and Vampire's "returned no text when opened", a fetch's report, is "showed no text when
  opened". Possessives as above in Slice Of Life's and Yakuza's claims and Social Realism's source line.

**Kept, and why:** the other 134 genres' small print, and everything else in the fifteen: each is the research's own
careful claim, its source quoted in the source's words, its confidence and what it couldn't settle, and a plainer
sentence would claim more than the research found. The quotations keep the straight marks the research recorded them
in; batch 4's conventions took the house's marks only for glosses ("‘strange beast’"), never for a source's words.

**Meaning-sensitive, and how each was held:** no claim, confidence, requirement or tag moved: the edits touch the
claim, source and uncertainty sentences only, and the builder writes the tags, the confidences and the strands from the
research as before (`node tools/build-attribute-content.mjs`: 149 genres, 396 edits, the 18 changed lines all in those
three fields and the one why line). Before the brief 15 block was added, the builder reproduced the committed JSON
exactly. "The research didn't name it" keeps "considered" where the research did consider it (Political Drama).

**Tests and tool matchers updated:** none; no test or tool quotes these sentences.

**Checks (one run for both batches, after the one rebuild):** `npx tsc -b --noEmit` 0. `npx vitest run` on the 15
files that read the genre looks, the demands, their coverage and their dates (`looks`, `language-genre-look`,
`genre-identity-screens`, `genre-identity`, `genre-coverage`, `remaining-genres`, `defects-g30-1`, `evidence2-b08`,
`briefs-content`, `guide-examples-craft`, `decisions-judge`, `engagement`, `evidence-g27-ui`, `language-data-dates`,
`remaining-judge`): 646 of 646, exit 0. The other checks as in batch 4's run, 0; text-inventory 1 before marking.

**Screens verified:** `b4-genres.txt`, printed after the rebuild: every genre's look, its small print included.

## The Area's End, Finished By The Coordinator

The area was stopped at 18:48 on 2026-10-19, during its walk at 390 of the built app after its last fixes, and couldn't
be resumed. The coordinator finished it from this clone, as it stood.

**What the walk at 1440 found, and the fixes the area made before it was stopped:**
- **Your Work So Far's evidence** repeated the figure its line had just given: Range's was "Kinds of work on your
  record: 9". It now names the kinds. On the nonfiler save at 1440, Range reads "9 kinds of work judged, 4 genres
  worked in, 8 of 12 kinds of material met. From: A Scene Shown, A Written Analysis, Movement Work, Voice Work, An
  Improvisation, Partnered Physical Work, A Night On Stage, A Clown Turn and A Song." Taking Direction's "Worked 5,
  answered 4" reads "From: 9 notes given, 5 worked on and 4 answered." The habit line's "Takes of briefs: N" reads "N
  takes of briefs", but no walked save has enough takes to show it (`systems/artistry.ts`).
- **The advice's forecast assumptions** said "taped" of every piece, but the pieces are every kind of work judged: a
  class showing and a night on stage as well as a tape. "Fully prepared when taped" is "fully prepared". "Taped
  underprepared and count as taped" is "underprepared and are counted as they were". "Counted as taped" is "counted as
  it was" (`systems/next-steps.ts`). `tests/decisions-advice.test.ts` gained an assertion on the words. A mutation back
  to "taped underprepared but counts" fails it (`b8-assume-mut`, exit 1). Restored, it passes (exit 0).
- **The tests that read both** (`decisions-advice`, `defects-g8-11`, `defects-g8-14`, `defects-g8-15`, `defects-r8-1`,
  `evidence-g23-school`, `evidence-g26-school`, `evidence-g32-ui`, `evidence2-b11`, `guide-examples-craft`,
  `remaining-genres`, `advice`, `language-dynamic`): 13 files, 245 of 245. eslint on the four files: 0. The build: 0.
- **The walk:** `after-1440/`, on that build, six saves, 25 screens each, none failed. The walk at 390 stopped three
  saves in. It isn't kept here. The coordinator's final walk covers both widths.

**What the coordinator did:**
- **Batches 6 and 7's marks.** The area's marking script (one status a genre, 149 of them, each reason naming its
  genre, its finding and its confidence) had written 8 when the area stopped. The coordinator ran it whole.
- **Three sources no batch had read.** The coordinator read them:
  - The composure panel (`ui/components/AttributesPanel.tsx`) is Rewritten. "How fast it moves here is estimated."
    became "How fast it changes in the game is estimated.", money-data's form for a source's "here". Composure can move
    either way, so the line says "changes", not "grows".
  - The Profile's abilities table and the genres table (`ProfileWorkspace.tsx`, `AbilitiesPanel` and `GenresPanel`)
    are Retained. Each heading and column names what it holds. The two paragraphs under them say how an ability grows,
    where it stops and why, and how a genre's brief, Familiarity and Mastered work. Each says it once, with the press
    to make.
- **The walk fixes' two sources** were marked Rewritten again (`identityOf`, `assumesOf`), on the tests above.
- **Batches 4 to 6's examples** were checked before they were added. Each one's earlier words are at the base, and its
  new words are in the code or in the area's rendered print (`b4-genres.txt`, `b5-guide.txt`).

**Checks on the area's final words, run by the coordinator in this clone:**
- Typecheck: 0. eslint on every `.ts` and `.tsx` the area changed: 0.
- The gate's text checks, all but the completion matrix: 0 each. `text-inventory --todo2 profile`: 0 Pending.
- The tests the area touched, plus every genre, advice, attribute, ability, look, practice, interpretation, approach,
  craft, identity, mastery, demand, register, engagement and judge file: 43 files, 591 of 591.

The whole suite and the walk at both widths run on the merged tree, with every area's words together.
