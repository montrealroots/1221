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
