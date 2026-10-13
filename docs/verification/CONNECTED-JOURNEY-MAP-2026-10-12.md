# The Connected Journey: Completion Map, 2026-10-12

The owner's brief was "SLATE: Complete The Tutorial, Acting Depth, Balance, And Connected Player Journey", from `main`
at `0dbe5960`, worked on `claude/connected-journey`. It asked for the requirements to be mapped against the features
before any code changed. This is that map. It was written from seven parallel readings of the code (the guide and
routing; the screens; evaluation and history; coursework and partners; productions; saves; briefs), each of which cited
file and line, and from my own reading of the evaluation, the brief system, materials and approaches.

Each requirement says what the player can do now and where, what it reads and changes, and which of four kinds the
work is:

- **Exists:** working, and kept;
- **Defect:** declared or shown, but wrong, and fixed with a regression test;
- **Missing connection:** two working parts that should talk to each other and don't;
- **New:** not in the game.

What isn't reopened: the removed personal-life and industry systems, parental leave, and the sixteen deferred items. The
talent, progression, school-difficulty, styling, Title Case, sidebar and mobile-navigation decisions stand.

The completion report (`docs/verification/CONNECTED-JOURNEY-PASS-2026-10-12.md`) answers this map item by item.

---

## 1. The design calls, decided

These decide the shape of everything after them. Each was settled from what the engine already does, so the new work
extends the one evaluation, `judge` in `src/engine/systems/evaluation.ts`, and doesn't run beside it.

1. **A piece of work is judged in segments.** A brief's beats; a scene's tones, in order; a play's movements, two at
   least. Each segment is judged by the same `judge`, with four inputs of its own:
   - its own rehearsal: the general rehearsal, plus focused work on that segment;
   - what its tones lean;
   - how far into the piece it falls, which is where stamina is read;
   - whether a slip in the segment before was recovered from.

   The piece's result is the weighted mean of its segments. Every input enters once:
   - the segment's rehearsal replaces the piece's rehearsal, and isn't added to it;
   - stamina's flat share of consistency is replaced by a drain that grows with position and load.

   At mastery every segment is 100, so the piece is 100. Continuity is read from the segments as a separate figure and
   isn't added to the score.
2. **What a partner contributes is a separate figure.**
   - **Personal execution** is the player's own evaluation. Its partner part reads only what the player did: their
     rehearsals with the partner. A partner's lateness, slip or thin preparation can't lower it.
   - **The shared result** blends each shared dimension (connection, responsiveness, and a little of believability
     and consistency, by how much the material is played off the partner) between the player's figure and the
     partner's contribution. That contribution is built from:
     - the partner's own stored preparation;
     - their timing;
     - whether the two readings agree;
     - an on-the-day slip, drawn from their reliability.

   A coursework band and a night's band read personal execution. A brief's callback and a company's morale read the
   shared result, because each is the scene as somebody else saw it.
3. **Rehearsal is a loop with memory.** It's kept per piece in a workbook:
   1. A problem is identified from the forecast's own segments and limits.
   2. An adjustment is chosen from the ones that problem admits.
   3. Rehearsing it spends time.
   4. The evidence is the forecast of that problem before and after.
   5. The adjustment is kept or revised.

   A kept adjustment is a discovery, which every later forecast, rehearsal and take reads. A revised one is reverted and
   marked tried, so the same adjustment isn't offered for the same problem again.
4. **Direction is a problem somebody else identified.** A director's note, a teacher's note or a callback's note
   names its kind:
   - objective, listening, pacing, behavior, transitions or relationship;
   - or lines, blocking, or a playing axis.

   It names the measure it's about and offers several valid solutions, each a different engine change. Whether it was
   addressed is read from that measure at the next showing, call or take, never from a step count. A later note
   answers that record.
5. **Artistic identity is derived.** It's read from durable tallies and the work record, and each line carries its
   evidence. It's never stored as a second reward and never adds points. It informs which note is given, the
   recommendations and the suggestions.
6. **The guide is a registry, and it runs nothing.** Each player-facing feature gets an entry, keyed by the stable ids
   the game already uses (command kinds, `ui.*`, `look.*`):
   - live values are read from rule constants;
   - connections are typed;
   - destinations are checked.

   Reading help issues no command, writes nothing to the save and moves no clock. The seventeen chapters stay as the
   required onboarding. A new life can skip them, and a finished save stays finished when a chapter is added.
7. **The save schema stays at 94.** The new state is optional, created lazily through accessors, capped by a
   `*_KEPT` constant, and named off every shed list. This is the practice every pass since 94 has followed.
   `RULESET` moves to `evaluation-3`, and a result kept under an older ruleset says so instead of claiming to be
   reproduced.

---

## 2. The tutorial as a connected guide (brief §2)

**Now.** There are 17 chapters in `src/engine/content/tutorial.ts`, read strictly in order, which open 203 ids: 151
command kinds, 35 looks and 17 screen ids. A locked control says "Locked" and opens its chapter. Once a feature is
open, nothing links it to any explanation. The looks are inline drill-downs into live data and have no address.

**Defects found.**

- Line 47 promises a "/" search that doesn't exist.
- Line 193 gives the genre as complete at familiarity 60, when the engine reads 30 and counts practice too.
- Line 214 names two wheelchair controls removed in schema 91.
- 'Pay What’s Owed' is labeled 'Pay' on screen.
- The workspaces other than the Profile render while locked, by a hash link, the 'c' key, 'Go There', or the Profile's
  Money and Papers buttons.
- A locked Profile is a dead end with no way into the guide.
- The h, c and p keys act behind an open dialog.
- The Modal neither traps focus nor returns it.
- Escape closes every stacked modal at once.
- 'Skip To Content' replaces the route.
- Two chapters' counts include ids removed from older saves.
- `ui.skip` is a gate that can never close.
- `kept.ts`, `subject.ts`, `simulation.ts:566` and `tests/navigation.test.ts` each make a present-tense claim the code
  contradicts.
- The capability row `kept-context` is Verified by a tool that looks for a rail that's gone.
- `genre.study` and fourteen bank and coursework calls succeed silently.

**Plan.**

- **New:** `src/engine/content/guide/`, an entry per player-facing feature. Each entry holds:
  - the stable ids it covers, and a goal group;
  - synonyms and questions;
  - where: a route, a tab and a panel;
  - when it's available;
  - a short and a full explanation;
  - steps, requirements, and costs, read live;
  - what the engine reads;
  - what changes now and what changes later;
  - how to read the result;
  - why it might be unavailable, drawn from the real refusal functions;
  - common mistakes and recovery;
  - related entries and a worked example.
- **New:** a "How This Works" control on every Panel and beside every gated control. It opens the entry over the screen,
  so forms and tabs stay mounted, and closing it returns focus to where it was.
- **Defect fixes:** the lines and claims above, each in the past tense where a comment was falsified.

**Tests.**

- Registry completeness: every on-screen feature id, every command and every look has exactly one entry.
- Link and destination integrity.
- An entry naming a removed feature fails.
- Prose values match their constants.
- The worked examples, run as real commands on an isolated save.
- A UI journey: open help from a control, follow two cross-links, go back, and return to the same tab with a typed
  draft intact.

## 3. Navigation (brief §3)

**Now.** Hash routes cover Home and the five workspaces (`src/app/game-context.tsx:228-262`). Tabs, looks and chapters
have no address. There's no search and no contents by goal. The `back`, `recent` and `favourites` state is unread.

**Plan.**

- **New:** a help overlay with:
  - search over names, questions and synonyms;
  - contents grouped by the player's goal;
  - a breadcrumb trail, with Back inside help;
  - cross-links;
  - stable links (`#/workspace/school?help=school.coursework`), parsed and stripped by the route reader;
  - "Show Me Where", which goes to the exact tab through `useKept` and keeps the overlay's trail.
- **New:** tabs routable from a link (`?tab=`), so a notice's "Go There" lands on its tab.
- **Defects:**
  - shortcuts are suppressed while any dialog is open;
  - the live clock holds while help is open, and says so;
  - the Modal gets a focus trap, initial focus, focus return, and stack-aware Escape;
  - chapter titles are readable on phones;
  - lock reasons reach touch and keyboard users.
- **New:** "I Know SLATE" at character creation, which creates the life unguided. The required onboarding stays the
  seventeen chapters, and every chapter can be previewed out of order. A finished save stays open when a chapter is
  added.
- **Help never runs a command.** It's tested: opening, searching and following every link leaves the save
  byte-identical and the clock unmoved.

## 4. Connected systems in every entry (brief §4)

**Plan.** Each entry carries typed connections. A connection's kind is one of:

- prerequisite;
- immediate effect;
- scheduled consequence;
- evaluation input;
- historical record;
- optional related action.

Each connection has a target entry and a reason. Evaluation inputs are generated from `TASK_PROFILES`,
`materialContext` and the piece's segment inputs, so they can't drift. Costs and thresholds are read from the constants
(`BRIEF`, `WORK`, `PROCESS`, `EVALUATION`, `PRACTICE` and the rest) at render. A connection with no target fails the
registry test, and an estimate is labeled as one.

## 5. A maintainable registry (brief §5)

**Plan.**

- **Stable feature ids:** the existing ones (command kinds, `ui.*`, `look.*`), plus a few panel ids where a display has
  no command.
- **Gate checks** (`tests/guide.test.ts`):
  - every id on screen has an entry;
  - every connection and related id resolves;
  - every route and tab exists;
  - every command an entry names is registered;
  - every worked example runs on a throwaway `createSave` simulation that is never handed to an adapter.
- **Isolation:** the examples never touch the live save. A test checks that after an example has run, the live save's
  JSON is unchanged.

## 6. The specialist question (brief §6)

**What the reading found** (to be re-measured, not taken on trust):

- A taped brief's base reads no physical, vocal or stamina ability.
- `emotionalDepth` carries weight 3 in believability, which is weighted 3 and leant 1.2 by the camera.
- The body's techniques are read by few briefs (combat 14, dance, singing and clown 3 each), while `screen` and `scene`
  are read by 144.
- The 0.25 weakest-dimension term costs the body specialist about −3.0 on every brief, because responsiveness, which no
  body input reaches, sits on listening and adaptability at 48.75.
- "Body" bundles presence and stamina, which a take barely reads.
- Separated:
  - physical-only leads on 23 of the 33 briefs built on physical work;
  - vocal-only leads on 11 of 22 vocal briefs, and on 4 of 5 voice briefs.

**Plan.**

- **Rewrite** `tools/brief-balance.ts` section 1:
  - single-demand specialists (physical, vocal, stamina, presence);
  - ability allocation and technique allocation measured apart;
  - shared against specialized competence;
  - by medium and by load;
  - the weakest term's contribution reported on its own;
  - equal budgets;
  - matched profiles that differ only in the specialty.
- **Then decide each under-reward with a falsifiability check:**
  - presence on camera;
  - staged techniques diluted by the medium's base;
  - the weakest term on dimensions the material barely weighs;
  - stamina, now read through the piece's drain.

  A real under-reward is corrected in the model, and a genuine weakness is explained on screen. No genre bonus.
- **Validate** across the catalog, coursework, productions, auditions, callbacks and school outcomes.

## 7. Situations per genre (brief §7)

**Now.** One brief per genre, 149, with 302 readings. The listed axes have no data:

- stakes, partner behavior, difficulty, structure beyond four beats, scale, and extra preparation.

**Plan.**

- **Declared target:** at least two meaningfully different playable situations per genre, so at least 298 briefs.
  Each new one is a new premise, not a renamed one.
- **New fields, each with a consumer:**

  | Field | Read by |
  |---|---|
  | `stakes` | the take's difficulty |
  | `readerPlays` (how the other part is played: steady, pressing, withholding or unpredictable) | the partner contribution and the slip |
  | `structure` (beat count and shape) | the segments |
  | `scale` | the lines' minutes and the stamina load |

- **Content tests:** two briefs of a genre must differ in relationship, objective and obstacle, and in at least two of:
  - medium;
  - feature levels;
  - tone sequence;
  - beat count;
  - stakes;
  - partner behavior;
  - staged techniques.

  Some actor's best reading must differ between them.
- **Authorship is labeled:** the material is original, the research facts are cited, and the sizes are SLATE's.

## 8. Persistent rehearsal (brief §8)

**Now.** Preparation is a few scalars per piece. Nothing identifies a problem, keeps a discovery, or carries an
unresolved note to the next session. `Take.prep`, `experience.approaches` and `experience.materials` are written and
never read.

**Plan.**

- **New:** a workbook on each brief record, on each coursework assignment, and on each production process, holding the
  problem, the tries, the discoveries and the open notes.
- **Commands:** `work.identify`, `work.try` and `work.settle`.
- **Problem candidates** come from the forecast's segments: the weakest segment, an unworked turn, stamina late in the
  piece, a gap between the player's result and the shared one, a direction misfit, or the top ability or technique
  limit.
- **Adjustments:**
  - work the beat;
  - run into it from the beat before;
  - play this beat another way, which is a segment-level side with its own fit;
  - find places to breathe;
  - run it with the partner or the reader.
- **The evidence** is that problem's measure before and after.
- **No identical loops:** a revised adjustment isn't offered again for the same problem, and a solved problem closes.
- **No random setbacks:** the forecast has no draw.

## 9. Partners and direction (brief §9)

**Now.**

- **Defect (measured by the reading):** a fully mastered student with all their own preparation scores 94.3 to 98.0 on
  paired scenes, because the partner's time-based preparation is blended into the player's own part
  (`src/engine/systems/coursework.ts:592-605`). The shortfall is then given back to the player as a note they can't act
  on.
- **Defect:** the learning objective and "Put It First" change only the note, not the score, though four screens say
  they weigh more.
- **Defect:** a skill note counts as taken after desk revision alone.
- **Defect:** a choice note, once resolved, can't come back.
- **Defect:** any take clears a brief's callback, whether or not it answered the note.
- **Defect:** partner rehearsals skip the activity's own requirements, so a sprained player drills a fight.
- The partner's abilities, trust and history never reach the scene.

**Plan.**

- **Personal and shared figures**, as in §1 above, for:
  - coursework scene partners: stored partner preparation, timing from their abilities, the table-work reading's
    agreement, and reliability;
  - a brief's reader: alone against a recording, or a classmate whose preparation moves when you run it together;
  - a production's company.
- **Notes with kinds and solutions,** and an addressed record read from the measure.
- **Later feedback answers the record:** "The pacing in the second half is there now", or "Still: …, and you tried …".
- **Objectives that really weigh** in the score, through the evaluation's lean.

## 10. Whole-piece evaluation (brief §10)

**Now.** One judgment per piece. The beats only count transitions and blends. A night has no scenes, no stamina across
it, no recovery and no ensemble term.

**Plan.** The segments of §1, kept on the work record so the result replays. The derivation is shown on the work's look:

- each segment's figure;
- its rehearsal, its position and its drain;
- any slip and how it was recovered;
- continuity, read from the segments' spread;
- the shared result, beside the player's own.

Individual, continuity and ensemble figures are kept distinct.

## 11. Artistic identity (brief §11)

**Now.** Nothing describes the actor. The evidence is scattered, and much of it is never read:

- `experience.approaches` and `experience.materials`;
- `DimensionResult.strongest`;
- the notes ledger;
- `MateRecord`;
- `process.notes`, deleted at the next casting.

**Plan.**

- **New:** `src/engine/systems/artistry.ts`, which reads the work record and new durable tallies on the journey. It
  covers:
  - strengths and recurring weaknesses, in whole points per piece;
  - familiar and unfamiliar material, by feature;
  - habitual readings and sides;
  - versatility;
  - response to direction (notes addressed, solutions used);
  - reliability and collaboration.
- Each line carries its evidence, and early choices are discounted until there are enough of them.
- It informs:
  - which note is given;
  - recommendations;
  - brief suggestions, such as the unfamiliar material.
- It's shown on the Profile as "Your Work So Far".

## 12. The mastery contract (brief §12)

**Now.** It's guaranteed on briefs, scenes and nights, but broken in two places:

- the paired scene (§9);
- a production whose rehearsal calls were dropped by the Rep overlap filter after being numbered, so complete
  preparation can't be reached. The reading measured this on seed `of-a`.

**Plan.**

- Fix both, with regression tests.
- Extend the guarantee test to every segmented piece, every reader and partner state, every direction note solved,
  every discovery kept, and every brief.
- Personal 100 stays distinct from the shared result and from casting.

## 13. Every touched feature traced (brief §13)

**Plan.** `docs/verification/connected-journey/TRACE.md` traces each feature this pass touches:

> Action → Preconditions → Costs → State → Consumer → Feedback → History → Later consequence

It's generated where it can be, from the guide registry and the command registry. A row with no consumer is a defect,
and it's fixed or deleted. The write-only fields above are wired or removed:

- `Take.prep`;
- `Showing.parts`;
- `Assignment.steps` and `Assignment.taken`;
- `CLASS.bothGain`;
- `experience.approaches`.

## 14. Freshness (brief §14)

**Plan.** `tools/freshness.ts` plays sustained journeys for a beginner, a developing student, a specialist and a
mastered student, on held-out seeds. It counts:

- repeated material;
- notes that ignore completed work;
- recommendations that don't adapt;
- callback loops;
- identical optimal choices across unrelated work;
- variants with no difference;
- content exhausted;
- whether history changed later experiences.

The finite content is reported in numbers.

## 15. Defensible maths (brief §15)

**Plan.** Property tests:

- bounded scores;
- monotonic in every relevant input;
- normalized leans;
- no duplicate reward from tags or experience;
- deterministic replay, byte for byte, of a played command sequence across a save and a reload;
- uncertainty bounded below mastery and zero at it;
- saves stable;
- familiarity, skill, preparation and preference kept separate.

Expected values are computed independently. Matched strategies are compared on held-out seeds, with sizes and
distributions given. Coefficients are labeled as SLATE's estimates.

## 16. Built-app journeys (brief §16)

**Plan.** `tools/acceptance-ui.mjs`, extended and run at 1440 and 390 on a build of the final tree. It covers:

- opening help, following cross-links, and returning to the same context;
- choosing, inspecting, preparing and interpreting material;
- rehearsing with a partner and a reader;
- answering direction;
- performing and reading the result;
- training a weakness;
- returning to the work;
- saving, exiting, reloading and continuing;
- a refusal, an interruption, a missed commitment, and recovery.

Fixture and scenario setup are labeled. A disabled button is never counted as a success.

## 17. Defects (brief §17)

Every defect in this map is:

1. reproduced first;
2. fixed at its cause;
3. covered by a regression test;
4. followed by a rerun of the journeys it touches.

No test is weakened.

## 18. The report (brief §18)

The completion report goes requirement by requirement. The tutorial, the coverage matrices, the engine model and the
handoff are brought up to date. The branch is pushed. Merging is the owner's, on "Merge it."; deploying is the owner's
too.

---

## What the completeness critic added

An eighth reader went over the seven maps looking for what they'd missed. Each finding below is joined to its
requirement and is reproduced before it's fixed.

1. **Term standing breaks the mastery contract** (§12).
   - Where: `termGrowth` (`src/engine/systems/school.ts:2559-2571`), which scales growth by `room = max(0.01, …)`.
   - A student with every skill at 100 who only attends class is judged to have grown too little. Their standing
     steps toward dismissal.
   - A student above the class's reach with +0.3 growth is judged ahead of the class.
   - No test covers `termGrowth`.
   - Fixed: a skill at its ceiling has nothing left to grow, which isn't a shortfall.
2. **A second casting model** (§6, §11). Cabaret and Summer parts come from `companyPart`, which ranks raw craft. They
   ignore `castFit`, the delivery record and the material.
   - Reconciled: the same fit the chair reads, with the record.
3. **Every life meets the same scenes in the same order** (§7, §14).
   - `setWork` takes `pool[0]`, and `scenesFor` has no draw.
   - The `school.coursework` decider still claims to decide the scene.
   - Fixed: a seeded draw among the scenes not yet worked, swept by the deciders test.
4. **Randomness outside the deciders gate** (§15). The evaluation's `draw` and the callback's hash aren't swept. Any
   new draw for a partner's slip is registered as a decider and swept.
5. **The specialist problem isn't only briefs** (§6). With techniques even, the generalist beats both specialists on
   the School's scenes (0 of 56) and nights (0 of 30). The investigation covers `TASK_PROFILES.scene` and
   `.performance`, the weakest term there, and `castingPerformer`, which counts stamina and discipline as full.
6. **Readings barely matter at a real student's levels** (§7, §15).
   - The best reading beats the worst by 0.03 to 0.07 points for the beginner, the developing student, the advanced
     student and the generalist (BRIEF-BALANCE.md §2).
   - That fails the falsifiability test, and it's fixed in the model, not by adding briefs.
7. **`docs/verification/student-matrix.json`** is a registry skeleton by player goal. The guide's contents follow
   its goals, and its rows are kept in step.
8. **`docs/capabilities.json` corrections:**
   - 52 rows: 27 Verified, 6 Partial, 19 Retired;
   - 43 commands are in no live row, and the "names all of its commands" claim is unchecked;
   - the guide row's limit contradicts `src/app/SlateApp.tsx:48`;
   - the production row contradicts `docs/UNBITTEN.md`.
9. **Traceability is too shallow to feed Connected Systems** as it stands. `school.choose_playing` and
   `school.choose_part_playing` are untested, and ten central commands are in no connected journey.
10. **`docs/GAMEPLAY-COVERAGE.md` already traces 292 features** and overstates. It calls the objective's consumer
    verified. §13 starts from it and corrects it.
11. **The interruption and missed-commitment flow misleads** (§13, §16).
    - The 'On The Way' dialog says you choose whether you go, which is false for the world's commitments.
    - Stand Here leaves a call pending, so it's attended anyway.
    - A partner rehearsal is said to be "not yours to walk away from" while a late cancel works and isn't offered.
    - Sleeping through is the only way to miss a call on purpose.
12. **`src/engine/systems/courserecord.ts:23-24`** says no course is repeated and no semester added. Both have been
    possible since 2026-10-10.
13. **The gate can't test the UI.** Vitest runs in node. The UI claims (help runs nothing, forms survive, focus,
    keyboard, phone width) are tested in `tools/acceptance-ui.mjs` on the built app, and recorded as such.
14. **Refusal reasons reach only a tooltip** on many disabled controls (Profile, School, Study Plan, Sleep, Papers),
    which touch and keyboard users can't reach. Each gets a `WhyNot` line.
15. **The tutorial coverage matcher counts any `feature="…"`.** The help control uses its own prop (`help=`), so it
    can't stand in for a real gated button.
16. **The unread-field ratchet checks only namespaces and tables.** Every new field gets its reader test, and
    `tools/unread.mjs` is run on the end state.
17. **Freshness isn't measured as gameplay.**
    - `tools/freshness.mjs` covers coursework only.
    - `tools/variety.ts` covers no briefs.
    - 47 of 105 weeks hold no work decision.
    - §14 measures takes, notes, callbacks and situations, not distinct strings.
18. **Stale prose in the help that exists:**
    - the person look's readiness line names auditions;
    - `life.ts` names an audition booking roll;
    - the showcase is named in two places;
    - `docs/UNBITTEN.md:168` is stale.
19. **The owner's rule of 2026-09-24:** a preference changes how much somebody gets out of a thing, never how good
    they are at it. Artistic identity adds no quality points, and keeps declared preferences apart from what history
    shows.
20. **Classmates have no look,** so a partner's preparation, reliability and trust have nothing to open into. A
    classmate look is added and given to a chapter.

## Risks, from the readings

- **Tests that pin the current shape:**
  - `tests/tutorial.test.ts` holds the chapter coverage and the COVERAGE-MATRIX table;
  - `tests/navigation.test.ts` regex-parses the routes;
  - `tests/looks.test.ts` crawls every look.

  Help ids must keep those patterns or extend the tests honestly.
- **The evaluation's results move.** Changing it moves BRIEF-BALANCE, every played-life tool, casting in long lives,
  and `tests/journey-school-production.test.ts`. Each moved number is re-measured, not edited.
- **Reserved names.** A new field named on a shed list is wiped on every open: `history`, `training`, `contacts`,
  `favorites`, `goals`, `reputation` and others (`src/engine/index.ts:406-418`, `:601-606`).
- **Rollback at the notification cap.** `notify` splices at 500 while the rollback truncates by length
  (`src/engine/core/simulation.ts:729-750`, `:820`, `:881`), so a refused command at the cap leaks its notice. Real
  careers reach the cap. It's fixed before anything relies on rollback.
- **Snapshot cost** is about 24 ms per command on a 1.36 MB save. The new state is capped and compact.
- **New draws** are keyed on persisted ids and counters only.
