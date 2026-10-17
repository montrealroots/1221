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
