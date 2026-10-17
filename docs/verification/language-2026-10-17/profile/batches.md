# Brief 14, The Profile Area: Batches

The area's sources are the inventory's subsystem `profile`: 462 sources, 25,363 words, in 26 files
(`prompts/profile.md`). Each batch below says what it read, what changed and what stayed, where a rewrite could have
changed what's true and how that was checked, the tests and tool matchers it updated, and the checks with their exits.
`b1-looks.txt` and the files after it are the game's own output, printed by playing it.

## Batch 1: The Abilities, Their Looks, And A Piece Of Work

**Sources read (25):** `content/abilities.ts` (12, one per ability), `ui/looks/actor.tsx` (3: the band words, the
development sources and `top`, which holds the ability's, the genre's and a piece of work's looks), `ui/components/
AttributesPanel.tsx` (1), `systems/attributes.ts#alreadyApplied` (1), `content/attributes-matrix.ts` (6),
`content/genre-coverage.ts` (2), `content/reference.ts` (1), `content/demands.ts` (1).

**Rewritten:**
- Every ability's definition, what grows it, what it does, where it started and its source line. Each "what it does"
  is said to the player about their own work ("your believability in everything you perform"), and the engine's words
  went: "how far a step goes" became how much a session gets done, "a house" an audience, "played grave" grave
  material, "a beat held two ways" a beat that plays two tones at once, "a piece played through in parts" a piece judged
  moment by moment. Where it started is said for every life: the old lines for listening, imagination, focus and
  adaptability spoke only of "a life from before it", where `derivedAbilities` gives a new life the same mean. The
  source line is the look's foot line, a sentence: a named source, or "estimated" where the game's own scale is all
  there is (presence, composure). The craft's old names (Emotional Access, Memorization, Voice, Movement) are kept once,
  as what older saves called them, and gone from the source line.
- The ability look's headings: What develops it became How it grows, Where it began Where it started, and Which work
  reads it (the brief's own example) Where it counts. Its stats' notes, its kin ("A related technique"), the stamina
  scale (its "from 2026-10-16" date gone), and the exercise kinds ("An exercise made for the game", not "SLATE's own").
  Its provenance printed "Its sources are in docs/research/…json" for a long source; now every source line prints.
- The genre look: "practice" for the second score became Work In It (the glossary's practice is the player's own
  exercises and self-tapes; this score is nights and self-tapes in the genre, `practiceGenres`), Applied as
  requirements became What a self-tape in it asks, Not applied Why it adds no requirement, "reads" calls for, "draws
  on" calls on. The research's reasons for a requirement had been run into its sentence; they're in the small print now,
  labelled as the research's words. To study it says where to press and what the study reads (`playOfGenre`: the play
  the game has, else a film; the old line offered both). The provenance named a folder of the repository.
- A piece of work's look: its provenance no longer prints the ruleset's id ("evaluation-11 (2026-10-16)"); "90% of 80%"
  is "90% (complete at 80%)"; "leaning to" its genres; Part By Part Moment By Moment (the glossary's word for a
  segment); its way of playing "how you play it".
- The development sources: a class by its name and code ("Class: Play (DRAM 153a)", from `COURSES`), a coursework step by
  the scene's own preparation labels ("Coursework: the choices", `TASK_PROFILES.scene.prepLabel`), where the Profile had
  printed "Class: DRAM 153a" and "Coursework: interpretation".
- The composure panel on School, and the refusal for an action pressed twice ("That’s already done, so nothing was
  charged or changed again.").

**Reviewed and retained:** the band words (the school's own bands, plain); the attributes matrix and the genre coverage,
which write developer documents (`docs/ATTRIBUTES-MATRIX.md`, `docs/GENRE-COVERAGE.md`) and are imported by nothing a
player sees; the registry's two internal errors; the twelve demand labels.

**Meaning-sensitive, and how each was held:**
- Every clause of every ability's "what grows it" and "what it does" is held by its own check in
  `tests/attributes-phase-2b.test.ts` (A4, brief 11), whose GUARD fails a sentence that says anything beyond its
  clauses. Each clause's words in the test were changed to the new words and its check left as it was, so each new clause
  is held by exactly the check that held the old one. Three clauses were made more exact, not looser: emotional depth's
  "Scene study and its classes" (the check reads Acting I, DRAM 103a/b) is "Acting I and the other classes that train
  it"; adaptability's "the improvisation game" (the check reads the Play class and An Improv Session's carry-over) is
  "improvisation, in its classes and in An Improv Session"; focus's "holding movement and partnered physical work steady"
  (the check reads consistency there) is "your consistency in movement work and partnered physical work".
- Where it started, for listening, imagination, focus and adaptability: read against `derivedAbilities` and
  `attributesOf` (a new life without the value gets the mean of its kin, exactly as an older save does). Composure's
  "from 25 to 60, higher the steadier you are" is `composureStart` (25 + 0.35 × stability). Discipline's is the
  creation slider (`CharacterCreation.tsx`, Conscientiousness).
- The genre look's study line was read against `study` in `systems/engagement.ts`: the play of the kind where the game
  has one, otherwise a film. The second score was read against `practiceGenres`' callers: a night of a play of the kind
  (`systems/school.ts`) and a brief's take (`systems/briefs.ts`), never a class scene.
- A piece of work's "rules have changed" line was read against `replay`, which gives nothing for a record kept under
  another ruleset (tests/decisions-stamina.test.ts plays one).

**Tests and tool matchers updated (words only, every assertion as exact as it was):**
`tests/attributes-phase-2b.test.ts` (85 clause words and the look's two headings), `tests/guide-examples-craft.test.ts`
(the look's parts, the work's provenance, Moment By Moment), `tests/decisions-stamina.test.ts` (the old ruleset's
provenance), `tests/defects-g30-1.test.ts` (the Preparation note, the small print's words), `tests/evidence2-b08.test.ts`
(the farce's applied paragraph), `tests/fitness.test.ts`, `tests/evidence-g20-school.test.ts`,
`tests/evidence-g06-life.test.ts` (the refusal, exactly), and `tools/playthroughs-ui.mjs` (its ability look matcher,
`/How it grows\./`). Those last three test files are other areas' (body, school, life); the file the words live in,
`systems/attributes.ts`, is this area's.

**Checks:** `npx tsc -b --noEmit` exit 0; `npx eslint` on the changed `.ts` and `.tsx` files exit 0 (the gate lints
`.ts,.tsx` only; `tools/playthroughs-ui.mjs` carried four lint errors before this pass, none of them on the line
changed); `npx vitest run` on the 14 files holding these words, 270 of 270, exit 0, and again on
`tests/evidence2-b08.test.ts` and `tests/defects-g30-1.test.ts` after the last edit, exit 0; title-case 0, label-sweep 0,
plural-check 0, voice-check 0, tics 0 (somebody 25 to 24), spelling 0, typos 0, text-inventory 0 (engine-speak 758 to
745), doc-refs 0, deciders 0.

**Screens verified:** `b1-looks.txt`, printed by `resolveLook` on a first-year in New York: all twelve ability looks, a
genre look of each kind of demand (applied, applied by definition, belonging to one playwright, low confidence, none),
drama studied and its brief prepared and taped through the commands, that take's own look, a gone work and a gone genre,
a life that never trained, and every kind of development source. The built app's walk comes at the end of the area.

**For the coordinator:**
- The genre look shows the research's own words from `content/genre-demands.json` (each demand's claim, its reasons,
  what the source supports and what's uncertain: "not from my own reading", "Reviewed 2026-10-10"). The inventory reads
  `.ts` and `.tsx` only, so this text, about 200 KB that a player can open, has no source in it. It's generated from
  `docs/research/attributes/research-genre-demands.json` by `tools/build-attribute-content.mjs`, so an edit to the JSON
  would be overwritten. This batch labelled it as the research's words and moved the reasons into the small print; the
  words themselves are untouched.
- The Core glossary's **work in a genre** says class scenes count toward a genre. They don't: `practiceGenres` is called
  for a night of a play of the kind and a brief's take only. This area's words say "nights on stage and self-tapes".
- "An audience" for "a house": this area says audience. The school area may still say house.

## Batch 2: The Player Profile And The Advice

**Sources read (27):** `ui/workspaces/ProfileWorkspace.tsx` (16), `systems/next-steps.ts` (9 at the start, 10 with
`agoOf`), `systems/experience.ts` (2 at the start, 4 with the two pacing lines it now says once).

**Rewritten:**
- The advice's every line, kept to its figures, its conditions and its forecast. A training line was one sentence of
  some ninety words ("20 hours of its exercise would take it from 55 to about 59, worth about 0.8 points a piece on your
  recent work (3 of your last 5 pieces read it; it gains most on …), worked out again with you as you are now, a session
  a day; about 0.4 of it is the discipline 20 days of practice keep, …"); it's four now, and says "forecast" where the
  figure is one: "20 hours of its exercise, a session a day, would take it from 55 to about 59. On your recent work,
  replayed with you as you are now, that’s forecast to be worth about 0.8 points a piece (3 of your last 5 pieces call
  on it; A Voice Sequence would gain most, about +1.3). About 0.4 of it is the discipline 20 days of practice build, …
  Choose Steady to begin; Spaced pays once your last session is a day to a week old." The pacing line names the Focus
  control's own choices.
- What it has done since (`standing`): sentences, not one list joined by semicolons; "first since" became "come first
  since"; "since it was first given" "since the advice first named it"; "the work it reads" "the work it’s forecast on";
  "0 days ago" (a note made the same day) became "today"; "it held back 0" "it held back none"; the other first's line
  opens on its date ("On October 14, 2026, the last time the advice was noted, the first was …").
- What it assumes, the next hour, discipline's part, the verdict on preparation and training, the all-full line and
  the line beside a brief (`heldVersusNext`, which printed "about 1 points"). "Read as if complete" is "counts as fully
  prepared"; "the way you chose to play it, rehearsed in" is "rehearsing how you play it"; the next hour names its tier
  and focus as the controls do and says what it costs before what it adds.
- The Profile: its dispositions, identity, every panel's subtitle and small print, the genre table's second score (Work
  In It, and Studied Or Worked In in its filter), the Today column's "Not held back today" and Current Condition's
  notes, the empty states, the work kept and the history. The first recommendation's parts each sit on a line of their
  own (`LINE`), where they had run on as one paragraph of up to 300 words. An exercise's last session printed its day
  key ("last 2026-09-12"); it's a date now (`dayWords`). Health cover's button said "Papers, Covered"; it says "Papers,
  Health Cover Held".

**Kept:** the panel and column titles, the Mastered chips' figures, the For Work values Sufficient and Held Back, the
milestones, and Work Out, under Look After Yourself (exactly as the stamina row has said it, a place in words).

**Meaning-sensitive, and how each was held:**
- Every figure in the advice is still the engine's, in the same place: brief 12's measures read the advice by its
  words, so `tools/advice-harness.ts` (S3's two openings, the change's parts, what can't be traced) and `tools/advice.ts`
  (what it assumes) were moved to the new words, and `tests/decisions-advice.test.ts`, which plays brief 12's F1 to F6
  and H1 to H6 on tuning cases (the same-case figures, the parts of a change summing with no residual, the standing's
  level and forecast as a fresh forecast gives them), passes on them: 29 of 29.
- "Replayed with you as you are now" for "worked out again with you as you are now": `trainingForecast` judges the
  recent pieces again at the player's levels now, as the old words said.
- "It counts the piece held back most by its own preparation as fully prepared" for "the piece its own preparation
  held back most is read as prepared": the same piece (`f.prepared`), the same assumption.
- "Tiring through the later moments" for "stamina draining through the later parts": the condition limit
  `condition:stamina`, the drain by beat.
- Risk Tolerance's line: read against `riskWords` and `openCredit` (autopay set to the minimum over 65, the statement at
  65 or under). Tiredness on Current Condition: "holds your work back" where it said "the work that reads it": the
  dimensions it reaches are still listed in Today and in the small print.

**Tests and tool matchers updated:** `tests/decisions-advice.test.ts`, `tests/advice.test.ts`,
`tests/defects-r8-1.test.ts`, `tests/attributes-phase-2b.test.ts`, `tests/evidence-g23-school.test.ts`,
`tests/need-paths.test.ts`, `tests/evidence-g27-ui.test.ts`, `tests/evidence-g28-ui.test.ts` (the Profile's lines only;
creation's own words, which are the frame area's, untouched), `tests/evidence-g31-ui.test.ts`,
`tests/evidence-g32-ui.test.ts`, `tests/evidence-g34-ui.test.ts`, `tests/evidence2-b11.test.ts`,
`tests/evidence2-b13.test.ts`, `tests/evidence-g07-life.test.ts`, `tests/ability-mastered.test.ts`,
`tests/guide-examples-craft.test.ts` (the Techniques subtitle it finds the table by). Tools: `tools/advice-harness.ts`,
`tools/advice.ts`, `tools/acceptance-ui.mjs` and `tools/playthroughs-ui.mjs` (the forecast and what-it-assumes matchers).

**Checks:** `npx tsc -b --noEmit` 0; eslint on the changed files 0; `npx vitest run` on the 26 files that hold the
Profile and the advice: 438 of 449 at first, the 11 failures every one an assertion still on the old words, then those
six files 119 of 119, exit 0; the final run after the last fixes is below. title-case 0, label-sweep 0, plural-check 0,
tics 0, spelling 0, typos 0, doc-refs 0, deciders 0; voice-check failed on "How ready you are for work today" (its
contraction would be wrong) and the subtitle was rephrased; text-inventory failed on the three new sources until they
were marked.

**Screens verified:** `b2-advice.txt`, the advice printed on three of brief 12's tuning cases as built and after twenty
sessions of what each names first: every kind of line (a training forecast, a preparation line, the recurring weakness,
the tie, the standing in both shapes, the next hour, what it assumes, the verdict, the line beside a brief). The Profile
itself on the built app's walk, at the end of the area.

**After the last fixes:** `tests/decisions-advice.test.ts`, `tests/defects-r8-1.test.ts`,
`tests/attributes-phase-2b.test.ts` and `tests/advice.test.ts` 79 of 79, exit 0; `tests/evidence-g32-ui.test.ts` 42 of
42 after the subtitle; `tests/evidence-g31-ui.test.ts`'s practice journey with its new assertion of the session's date,
exit 0; voice-check 0 and text-inventory 0 once marked. A test gained one assertion: that journey now holds the line the
day key used to print.

## Batch 3: Practice, Studying A Genre, Your Work So Far

**Sources read (47):** `content/practice.ts` (30: the exercises, each exercise's design, the tiers and the focuses),
`systems/practice.ts` (6), `systems/learning.ts` (4), `systems/engagement.ts` (3), `systems/artistry.ts` (1), and in
`ui/workspaces/ProfileWorkspace.tsx` the new `sleepOwed` and Current Condition's small print again.

**Rewritten:** the preview before an hour ("Less or more because the advanced tier isn’t yours (×0.8); …; you come at 73%
of an ordinary day’s focus; hour 3 on it today keeps 25%" became "It’s more or less than an ordinary hour because the
Advanced tier isn’t your level (×0.8); …; you’re at 73% of a rested day’s focus; hour 3 on it today gives 25% of the
first"); what the hour found ("Rested, the exactness paid." "You were rested, so the exactness paid off."); tier and
focus names as the controls show them; the four-hour refusal ("…: past that, more stops helping. Tomorrow." became "…,
and more stops helping after that. Practice again tomorrow."); three of the Focus choices' lines; the four ways at a
note that keeps coming back (which read "it put first, weighing more when it’s shown"); a study's "a film of its kind";
Your Work So Far's lines and their evidence (one printed a raw key, "The experience record: language:verse"; another
"The journey’s kinds of work"). Sleep owed (below).

**Kept:** the exercises and their designs (plain, in the pedagogy's terms), the tier names, the teacher's advanced
steps, the note subjects, and the refusals shared across seven systems.

**Meaning-sensitive:** the preview's reasons are each a factor the hour's own formula multiplies by (`practicePreview`,
the same `terms`); "gives 25% of the first" is `0.5 ** n` of an hour's gain. Put It First's "counts for more when the work
is shown" is the objective weighing more in the showing (`APPROACHES`' own comment). "Overall" for "for the whole" in a
strength is the mean of every dimension across the pieces, as before.

**Tests updated:** `tests/whynot-profile.test.ts`, `tests/evidence-g20-school.test.ts`, `tests/attributes-phase-2a.test.ts`,
`tests/attributes-phase-2b.test.ts`, `tests/evidence-g31-ui.test.ts`, `tests/evidence-g18-school.test.ts` (school's,
the ways at a note are this area's words), `tests/evidence2-b11.test.ts`, `tests/evidence-g23-school.test.ts`,
`tests/defects-g3-1.test.ts`, `tests/variety.test.ts`; and `tests/evidence-g32-ui.test.ts` gained a test of sleep owed.

**Checks:** tsc 0; eslint 0; vitest on 15 files 234 of 236 with two regexes still on the old words, then those and the
tier casing, 62 of 62, exit 0; `tests/evidence-g32-ui.test.ts` 43 of 43 with the new test; title-case, label-sweep,
plural-check, voice-check, tics, spelling, typos, doc-refs, deciders 0; text-inventory 0 once `sleepOwed` was marked.

**Screens verified:** `b3-practice.txt`: the Focus control's lines, the preview at each tier and focus and tired, two
hours pressed and the third previewed, the four-hour refusal, what the hour found for every focus and gap, a full
target and one past mastery, the four ways at a note, two studies, and Your Work So Far on a played case (adv-t-10).

**From the coordinator:** "Sleep owed 1 hours", found by the health area, fixed and tested (defects.md). The Core
glossary's corrections (energy comes back with sleep alone; an injury doesn't lower condition): nothing in this area's
words said otherwise, and Current Condition's small print no longer calls the day's state "today’s condition".

## Batch 4: The Genres, Their Registers, And How You Play A Scene

**Sources read (349):** `content/genres.ts` (149), `content/genre-register.ts` (149), `content/film-genres.ts` (1),
`content/contemporary.ts` (29), `systems/register.ts` (3), `content/interpretation.ts` (8), `content/approaches.ts`
(2), `systems/interpretation-read.ts` (2), `systems/interpretation.ts` (2), and `systems/engagement.ts`'s study again.

**Rewritten:** thirteen genres' conventions (American spelling of the paraphrase, and military's, which said "no
separate reference definition was found" to the player); five registers (stylized; "not" for "rather than"); the line
every concern says ("The take weighs … more and draws on your …" became "A self-tape in it is judged more on …, and
calls on your …"); where a register comes from ("this is SLATE’s reading of its conventions" became "so this is
estimated from its conventions"); the third band of how well a way of playing suits a scene (Against The Grain became
Works Against The Scene, the glossary's word); the take's account of it ("went against the grain of the scene",
"came to nothing either way"); Expansive's line ("to the house"); "Nothing in the scene leans either way".

**Kept, and why:** the other 136 genres' conventions (each paraphrases the source it names; a rewrite would drift from
it), the other 144 registers (short and specific), the genre names, the contemporary plays' catalog facts, the signal
names on the chooser (A House To Reach is compared by a test and a tool, so it's a key), the axes and Either Way.

**Meaning-sensitive:** "A self-tape in it is judged more on" for "the take weighs": the register leans a taped brief's
dimensions and adds no weight (`GENRE_REGISTER`, `concernWords`); a class scene reads the register for suitability only,
so the line says a self-tape. Nothing the judge reads moved: `genres.ts`'s families, `interpretation.ts`'s affinities and
`approaches.ts`'s effects are untouched, words only.

**Tests updated:** `tests/genre-identity-screens.test.ts`, `tests/interpretation.test.ts`, `tests/decisions-judge.test.ts`,
`tests/genre-coverage.test.ts` (the practice refusal it also asks of a life with no training).

**Checks:** tsc 0, eslint 0; vitest on 13 files 157 of 159 (the two assertions above), then those two files 54 of 54,
exit 0; title-case, label-sweep, plural-check, voice-check, spelling, typos, doc-refs, deciders 0; tics over by one on
the military line's ", which is", rephrased, then 0; text-inventory 0.

**Screens verified:** `b4-genres.txt`, every genre's look on a new life (summary, what it asks, how its scenes are played
and where that comes from, provenance), the ways of playing and the bands.

## Batch 5: The Craft Guide's Nine Entries

**Sources read (19):** `content/guide/craft.ts`: the nine entries (The Player Profile, Practice, Genres, Preparing A
Brief, A Reading And A Way To Play It, Who Reads With You, Taping A Brief, A Piece Of Work, Explained, Your Work So
Far), their connections, and the five consts their words are built from.

**Rewritten:** every entry now has `next` (what to do once it's done, naming the entry that teaches it). Each `short` is
the plain overview the brief asks for first; the Profile's "each figure read from where the game keeps it" and "learned
methods" went, and Choosing A Reading now says the distinction the brief names: choosing a way of playing isn't
rehearsing it. The screens' labels are the new ones throughout: How it grows, Where it started, Where it counts, Work In
It, Studied Or Worked In, Not held back today, Moment By Moment, Pitched at your level. The one fact on What To Work On
Next, some three hundred words, is five facts now (the forecast; what each line says; preparation, said apart; what drops
out; the first line), each keeping its conditions. "Reads", "weighs", "draws on", "dimension", "rehearsed in" and
"worked out again from its own inputs" are said as what the player sees: what the take is judged on, calls on, a
quality, how far you've rehearsed it. Every quoted message is the one the screen now shows (the practice refusals, the
Profile's empty state, the gone piece of work, Early days, a piece at mastery); the refusals of other areas' systems are
quoted as they stand today.

**Kept:** the entries' ids, covers, goals, questions, routes and examples' figures, and every connection's kind. The
questions keep "dimensions" ("What do the six dimensions mean?") as a search phrase a player may type.

**Meaning-sensitive:** the worked examples are played by `tests/guide-examples-craft.test.ts` through the game's
commands, and only their quoted words changed (Moment By Moment gives, Early days: patterns are named once 6 are). The
What To Work On Next facts were read against `recommendations`, `adviceFor` and `standingOf` (batch 2). "Rehearse It On
Your Feet says “There’s nothing more to gain from it now.”" is `prepareRefusal`'s own words at 97%, where the entry had
said only that it was refused.

**Checks:** tsc 0; eslint 0; `tests/guide-examples-craft.test.ts`, `tests/guide.test.ts`, `tests/help-mechanics.test.ts`
and `tests/tutorial.test.ts` 47 of 47, then the first three again after the last edits, 30 of 30; voice-check, tics,
spelling, typos 0; text-inventory over its ratchet by one "the take" from two new next steps, rephrased, then 0 (and the
guide's engine-speak fell from 131 to the taped brief's own "take").

**Screens verified:** `b5-guide.txt`, every entry printed as the rules fill it, in the brief's order of questions.
