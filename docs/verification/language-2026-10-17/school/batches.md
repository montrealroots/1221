# The School Area's Batches

Brief 14, the school area, in its clone on `lang14-school` from the pass's baseline `d82d38d0`. Each batch: the sources
reviewed, what changed and what stayed, the meaning-sensitive changes and how each was checked, the tests and tool
matchers updated, the checks and their exits, and the screens. Examples, verbatim, are in `examples.json`; the dynamic
sentences in each of their variants are printed from the engine by `render.mts` into `rendered.txt`.

## Batch 1: Feedback, The Notes Ledger, The Term's Warning And Review, And The Coursework Tab

**Sources** (all of each file's sources unless said):
- `src/engine/systems/coursework.ts`: all 41 (37 at the start, and `hourWords`, `sinceLast`, `reshownWords` new).
- `src/engine/systems/evaluation.ts`: all 6 (`conditionWords` new).
- `src/ui/components/CourseworkPane.tsx`: all 12.
- `src/engine/systems/school.ts`: `evaluate`, `setStanding`, `leaveCabaret` and the new `shortTermWords` only; the
  rest of the file is batch 2's.
- `src/engine/content/tasks.ts`: the preparation labels (`COURSEWORK_PREP`, the taped briefs' and a night's), read by
  `chiefLimit`; the file's other sources are a later batch's.
- One sentence each in `src/engine/systems/playreading.ts` (the library before the tour), `briefs.ts` (a step with
  nothing left to give) and `classmates.ts` (an ask over a commitment), made the same words as their coursework twins;
  those files are batch 2's.

**What changed.**
- *Faculty feedback* (`noteText`, `feedbackWords`, `show`): each note is the teacher's on this piece, labelled
  “Simulated note from {course}” in the notice and “Simulated feedback for {course} (taught by …). The words are the
  game’s, not the teachers’.” on the card, because the courses' teachers are real people. Its figure says what it
  measures (“Lines: 45% prepared”). A returning note says where it stands against the ledger: the second time (“You had
  the same note in Acting I on …, and it’s still there”), the third and on (“This is the 4th time you’ve had this note
  (last in … on …)”), better but short (“This has improved since … (22% then, 50% now), but it isn’t there yet”), back
  after it was taken (“You’d put this right on …, but it has slipped back”, new: the ledger's `resolvedOn` was there and
  unsaid), and the step beyond (“It held together. Here’s a next step to try.”).
- *The showing's notice* (`Shown: …`) now opens on how it compares with the course's last piece (“Up from Unready on the
  course’s last piece, shown September 23, 2026.”, “Working again, as on …”, “Down from …”: `sinceLast`), lists the
  parts well prepared in one sentence (“Well prepared: Knows The Scene, Table Work and Rehearsal”, where it was one
  “Lines was there” each), and names an earlier note taken (“You took the earlier note on lines”).
- *A piece shown again* (`reshownWords`): titled by the piece (“Note Taken: Scene Study”, “Note Not Taken Yet: …”) and
  saying the day, the note, how far its part moved (“Lines went from 20% to 50%”, or “stayed at”) and the band. Brief
  13 counted “The Note Was Taken” 31 times in one life, each the same.
- *Still There*: the piece, its band, how many times, that it stays open under Your Notes, and where the other ways
  are, conditionally (“an open piece that works on it offers …”).
- *The coursework warning* (`termWarning`): “So far this term, N of the M pieces …”, the cause in shortCause's three
  cases kept distinct (one part: “What held most of them back was …, unfinished on 3 of the 4 you showed. To work on it,
  use …”; every part: “Every part of each one was unfinished, so it’s the preparation as a whole”; scattered: “Each was
  short on a different part, so there’s no single pattern”), what's still set, then “This is a warning, not the term
  review.”, the review's day, and the actual consequence for this student (below).
- *The term review* (`evaluate`) in sentences: “You came to 100% of the classes, calls and shifts asked of you. Your
  craft grew 0.4 points, and the class’s middle student’s grew 1.6. Allowing for how much room each of you had to grow,
  that’s behind the class.” The coursework, the bands capitalized as the screen shows them, and the same three causes.
- *Standing notices* (`setStanding`): concern says what the next short review does and what returns good standing; the
  warning says it's given at a formal meeting, that the next short review dismisses, and that a student on warning
  can't take part in the Cabaret; a dismissal, that a dismissed student can't return.
- *What held a piece back* (`chiefLimit`) takes a tense: a piece shown says “wasn’t complete, which cost Believability
  12.4 points”, a forecast (Shown Today, and the brief pane's taped-now line, batch 3) says “isn’t complete, which
  costs …”. Conditions are sentences (“Being down with the flu”, “Your stamina running low by the Close”), an ability is
  the player's (“Your Presence held back Connection”), and a way of playing “didn’t suit the scene”, not “against the
  grain”. The preparation labels became subjects a verb agrees with (“Making your choices”, “Learning the lines”,
  “Taking the director’s notes”, “Breaking down the text for your reading”, “Rehearsing the way you chose to play it”).
- *Refusals*: each says the obstacle and the next step by its label (“The building tour in Orientation shows you”,
  “Read it, then press Mark As Read”, “Change an answer under Table Work”, “Ask them for an evening under Rehearsing
  With on this piece”). A partner's hours are said as a person says them (“before 7 in the morning or after 10 at
  night”).
- *The Coursework tab*: Due Soonest and Shown Today in the present (“Shown today, it would come to about 23.5
  (Unready). Still to finish: …”), “Counts for 31%” for “Weighs”, “Skills:” for “Shown for”, zero rehearsals said as
  “No rehearsals agreed yet”, “Better, Not There Yet”, “Note Taken”, the Table Work's “Why the text supports it” and
  “Why the text doesn’t support it”, and the sources line at the foot (“Source: the school’s calendar … are
  estimated.”).

**What stayed.** The four bands' names (`BAND_LABEL`), the orientation sessions' names, Run It With A Reader, the
calendar's Rehearsal With {name}, the partner's words after a rehearsal (`peerNote`, in their voice and already
specific), a partner's ask (`partnerAsks`), the log lines (“Couldn’t rehearse at …: …”), the titles A Word On Your
Coursework, Still There, Not Shown, Shown (tools and the tutorial area's text read them, and each is plain), and every
internal refusal a screen never sends (“There’s no such assignment.”). The prefix `You have ` that `answerRefusal` reads
back from `askRefusal` is kept.

**Meaning-sensitive changes, and how each was checked.**
- *“Your standing falls a step” became the step*: `shortTermWords` reads the student's standing and the term the way
  `evaluate` steps it. `evaluate`'s step is now the one function `stepDown` both use (good to concern, concern to
  warning, warning to dismissal), with the two exceptions `evaluate` has: a term a faculty review already kept at
  warning stays there (“keep you on academic warning”), and a last term at concern steps to the degree not recommended
  (`withheld`). Rendered for all five (`rendered.txt`, “the review, from …”); the review's own tests still pass on the
  same standings (tests/evidence-g21-school.test.ts, tests/scope-school.test.ts, tests/school-fixes.test.ts).
- *The warning's share*: “half” is read from `ESTIMATE.coursework.unready` (0.5), and would print the figure if the rule
  moved.
- *A note back after it was taken*: said only where `recordNote`'s record before was `resolved` with its day; the kind
  stays `recurring`, as the ledger has it.
- *Not Shown*: “A course isn’t passed if half or more of the pieces due in the term weren’t shown” is `settleCourses`'
  rule (`notShown * 2 >= due`), with the course's own count, as before.
- *The concern and the warning*: “If your next term review finds you short” and not “by the end of next term”: a grave
  breach can put a student on warning mid-term, and that term's own review is the next one. “A term that meets what’s
  asked puts you back in good standing” is `evaluate`'s `!short ? 'good'`. “While you’re on warning, you can’t take part
  in the Yale Cabaret” is `cabaretRefusal` and `leaveCabaret`.
- *The notices' identity*: a notice said again word for word while unread is merged (`Simulation.notify`). The new words
  keep each notice as distinct as it was: the reshow's day is in its words (a played life's unread notices stay 159,
  tests/evidence2-b11.test.ts, where without the day five merged), and Excused, Not Shown and Not Shown Again keep a
  body that's the same where it was.

**Tests updated** (the assertion kept as exact or as narrow as it was; nothing deleted or loosened): approaches,
attributes-phase-2a, attributes-phase-2b, briefs, classmate-moments, commands-kept, defects-g8-9, evidence-g18-school,
evidence-g19-school, evidence-g21-school, evidence-g22-school, evidence-g24-school, evidence-g27-ui, evidence2-b08,
evidence3-school, feedback, genre-identity-screens (the profile area's: its genre pane quotes `chiefLimit`),
genre-mastered, guide-examples-school, interpretation, partners, playreading, remaining-09-coverage,
remaining-09-journeys, remaining-school, remaining-school-term, scope-school, school-fixes, student-experience,
table-work-unread, whynot-school, workload. Three guards that read “unready” lowercase were made to read the capital the
words now use, so they still guard (school-fixes, evidence-g21-school, guide-examples-school), and the graduate's stale
list holds “Nothing is set yet”. One guide example is built from the note's words, so its quote moved with them
(`content/guide/coursework.ts` `NOTE_TEXT`).

**Tool matchers updated:** `tools/acceptance-ui.mjs` (the choice's and the answer's toasts, the warning's count, cause,
remedy and review day, Due Soonest, Shown Today, an ask awaiting an answer, what held a piece back);
`tools/playthroughs-ui.mjs` (the warning, a reader's step done today, what held it back); `tools/journeys.ts` (the
warning's count and its named part).

**Checks** (exit codes): `npx tsc -b --noEmit` 0; `npx eslint` on the changed files 0; title-case 0, label-sweep 0,
plural-check 0, voice-check 0, tics 0 (two over budget on the first run, “, which is short of …” and a sentence opening
on “Nothing”, both rewritten), spelling 0, typos 0, doc-refs 0, deciders 0; text-inventory's engine-speak for the
school subsystem 159 to 152. The test files above, run together: see the batch's last run below.

**Screens.** The Coursework tab is drawn by the tests above (`drawn(sim)` on the workspace: the Orientation panel, a
piece's card, Rehearsing With, Your Partners, the note and Your Notes). The built app's walk is the area's last step.

## Batch 2: The School's Notices, Leave, Courses, Classmates, Briefs And The Work-Through

**Sources:** the rest of `src/engine/systems/school.ts` (all 54 and `shortTermWords`), all of
`src/engine/systems/courserecord.ts` (9), `leave.ts` (43), `classmates.ts` (26), `production.ts` (7), `briefs.ts`
(13), `playreading.ts` (8), `workbook.ts` (12), `workpieces.ts` (4), `ensemble.ts` (2), `piece.ts` (2),
`material.ts` (1), `systems/workload.ts` (3), `content/concerns.ts` (1) and `content/workload.ts` (2).

**What changed.**
- *Refusals* say the obstacle, then what's possible: “You can’t take part in the Cabaret while you’re on academic
  warning.”, “There’s no Cabaret week left this term that’s at least three weeks away and clear of your recesses and
  calls.”, “Today’s classes are over, so calling in sick now wouldn’t excuse anything.”, “It costs $X, and your bank
  can’t cover it. You haven’t been charged.”, “You can ask to repeat a year only at its end, after the spring’s term
  review.” “Evaluation” became “term review” throughout, as the glossary has it.
- *The casting pool*: “Missed calls this term: the chair takes you out of the casting pool to reacquire the
  discipline…” became “You’ve missed two calls this term, so the chair of Acting has taken you out of the casting pool.
  You still play what you’re cast in now, but you won’t be cast again until a term review finds you in good standing.”
  The count is `ESTIMATE.missedCallsOut`'s.
- *Notes from the faculty and directors*: the teachers' term notes name every skill the course trains, as their growth
  is measured over all of them, where they named the first alone; “the room” is “the class”. The director's note on a
  run lost two observations the game doesn't make (“it’s been noticed”, “The part was yours by the second night”).
- *Courses*: a Fail is “You didn’t pass Clown: you came to 7 of the 11 classes you weren’t excused from.” An Incomplete
  names its button (Make Up A Session, on the Standing tab) and Ask For A Month More.
- *Leave*: the six sentences that named SLATE inside them (“SLATE’s estimate”, “SLATE’s faculty model”, “SLATE’s
  office”, “which SLATE can’t play”) say “estimated” or “the decision is the game’s”; two titles that said only
  “Refused” say “Isn’t Granted”, with the reason in the body as before.
- *Partners and classmates*: a missed evening says what it cost (“It cost some of their trust, and they’ll remember it.
  You can make amends under Your Partners.”), a boundary says what to do (“Ask for an evening at least a day ahead.”).
- *A self-tape's refusals and suggestions* and *the play reading*: “Choose a reading first. A self-tape plays the scene
  one way, so decide which before the camera rolls.”; “the genre you know least” for “the genre your work knows least”;
  “You read it again. Your last read was …”.
- *Work It Through* (`workbook.ts`): each problem in plain sentences, the qualities by their screen names, “Working on
  it trains it a little, and playing one part of the scene another way can lean on a different ability.” where it said
  “a segment played another way draws on something else”.
- *An evening's workload* (`workloadWords`): the same figures, said as demands (“Its physical demand is 2 of 3 and its
  vocal demand 1 of 3, an intensity of 1.40, so its workload is …”).
- *Running times*: three sources that opened on “SLATE’s estimate” open on “Estimated”.
- *Lists*: a list whose item has an “and” of its own takes a comma before the last (“speech, and accents and
  dialects”), in the teachers' notes and the strengths of a showing.

**What stayed.** The standings' names and the notices' titles (A Notice Of Academic Concern, Academic Warning and the
rest), ledger memos and account names (Scholarship, Tax Withheld, Wages: statements read them), the classmates' names,
the in-world lines of classmates, directors and partners (in their voices, and already specific), “There’s nothing at
school today to miss.” (the Classes tab compares it, `SchoolWorkspace.tsx`), “Not from a hospital bed.” (the same
refusal in eight systems and five guides), the term-begins notices (plain, and asserted exactly in eleven tests), and
the concerns' words (the genre looks show them; their `principle` lines no screen reads).

**Meaning-sensitive changes, and how each was checked.**
- *Out of the casting pool until a term review finds you in good standing*: `evaluate` sets `castable` where the term
  isn't short, which is where it returns good standing (`!short ? 'good'`); the old words said “a good evaluation”.
- *Teachers' notes over every skill*: `teachersNotes` already measured the mean over `c.skills`; only the naming moved.
  Rendered for ahead, in step and behind (`rendered.txt`).
- *The director's note*: same four bands by the same means (`directorsNote`), rendered; the words lost only what no
  record holds.
- *“You haven’t been charged”* on the protective equipment (“Nothing was charged” at first; the tics check holds sentences opening on “Nothing” at none): `buyPpe` charges only where the bank covers it, and the refusal
  is thrown before it.
- *Leave decisions “the game’s”*: the aid office's and the faculty's decisions in `leave.ts` are the game's own rules
  where the Bulletin sets none, as the comments there say; the words say so without naming SLATE mid-sentence.

**Tests updated:** casting, classmate-moments, decisions-stamina, defects-g8-12, evidence-g18/g19/g20/g21/g22/g23/g24/
g25/g26-school, evidence-g31-ui, evidence2-b07, evidence2-b08, evidence2-b09, evidence3-school, guide-examples-
coursework, guide-examples-productions, leave, need-paths, playreading, remaining-09-journeys, remaining-school,
school, school-everyday, scope-school, whynot-school, whynot-studyplan, and four more of the life files that call the
School's sick and shift refusals (evidence-g05/g06/g07-life, defects-g8-1, defects-g8-14). A literal shared with
another area's code was caught and put back: “Pay something.” is also the tax area's, so the four tax tests a first
pass changed were restored, and only `tests/leave.test.ts` asserts the School's new words. **Tool matchers:**
`tools/acceptance-ui.mjs` (a part's way of playing, “rehearsed to N%”).

## Batch 3: The School Screen, Its Looks And Its Panels

**Sources:** all of `src/ui/workspaces/SchoolWorkspace.tsx` (20), `src/ui/looks/school.tsx` (4), `looks/classmate.tsx`
(1), `src/ui/components/StudyPlanPanels.tsx` (8), `BriefPane.tsx` (6), `PlayingChooser.tsx` (5),
`RehearsalProcess.tsx` (4), `WorkThrough.tsx` (3), `ClassMoments.tsx` (1), and the Coursework card's share again
(`CourseworkPane.tsx`).

**What changed.**
- *The Standing tab* says what the review does in sentences a player can act on: “At the term review, a term falls
  short if your attendance or your growth is under its minimum, if a run on stage went mostly off, if you fail a course,
  or if half or more of your coursework due was Unready or not shown … A term that falls short moves your standing one
  step: from good standing to academic concern, then to academic warning, then to dismissal.” A failed course was
  missing from the list it gave (`evaluate`'s `failedNow`). The figures' notes say “You need 90% or more” where they
  said “90% is the floor”, and the growth figure names the class's middle student.
- *Source lines* (“Fine”) open on “Source:” where a source is named, and say “estimated” where SLATE's estimate was
  named mid-sentence: twenty-two places across the screen and its panels.
- *Choosing a way of playing* (`PlayingChooser`) teaches the brief's distinction: “Choosing a way to play it isn’t
  rehearsing it: once you choose, work on your feet rehearses it.” The rehearsing is said as how far it's gone (“You’ve
  rehearsed your current choice to 40% so far (it’s complete at 90%)”), and suiting the scene replaces the grain (“it
  suits the scene, so it asks less”). The table's “Axis” and “What It Draws On” are “Aspect” and “Abilities It Uses”.
- *The part's share* was “Weighs” and, on batch 1, “Counts for”; it chooses the teacher's note and reaches no result
  (`noteCandidates`, and the look's own source line), so it's “Note priority” on the card and “Note Priority” on the
  look. Batch 1's “Counts for” was wrong in this, and was put right here.
- *The brief pane*: “What The Tape Is Judged On, Read This Way”, its qualities by name, “There’s nothing holding it
  back”, its taped-now line in the present tense (`chiefLimit(now, 'now')`).
- *Work It Through*, *the rehearsal process* and *the class moments*: “Pick one to work on”, “Kept. Everything from now
  on includes it.”, “Ways to work on it”, “A forecast: what a night would come to if it opened now, without good or bad
  luck”.

**What stayed.** Every tab, panel title, button and column heading not named above (they're plain Title Case and the
tutorial area's text names them); the courses table; the casting table's headings; the Yale account table; the plays to
read.

**Meaning-sensitive changes, and how each was checked.**
- *Note Priority*: read from `noteCandidates` (`short = weight × (1 − part)`), which picks the note, and from the
  look's provenance and the guide (“a dimension held back by the least prepared of its parts and never by Weighs”).
  The Put First line still says the part “counts for more when this piece is shown”: the objective leans the result's
  qualities by `LEARNING.objectiveWeight` (`tests/coursework-objective.test.ts`).
- *A failed course in the standing paragraph*: `evaluate`'s `shortOtherwise` includes `failedNow.length > 0`.
- *The grave breach*: `breach` steps a student to warning, or from warning to dismissal, as the paragraph says.
- *“Choosing … isn’t rehearsing it”*: a choice is made at `prep` 0 and rehearsed by work on the feet (`rehearseChoice`).

**Tests updated:** decisions-stamina, defects-g8-3, defects-g8-13, defects-g10-1, defects-r8-1, evidence-g19/g20/g21/
g24/g25/g26-school, evidence2-b08, evidence3-school, leave, remaining-09-journeys, remaining-school-term,
school-everyday. **Tool matchers:** `tools/acceptance-ui.mjs` (casting's way back, a way to work on the note, a part's
choice and its rehearsing, the brief pane's headings, keeping a way), `tools/playthroughs-ui.mjs` (the brief pane),
`tools/captures.mjs` (a choice's rehearsing).

### Batches 2 And 3: What Their Test Run Found, And The Follow-Ups

The batch 2 and 3 run (55 files, 852 tests) failed 23, every one an assertion of the old words in a test the first map
missed: a regex fragment (`/been and gone/`, `/No Cabaret week/`, `/after one term completed/`, `/knows least/`,
`/rehearsal you agree with them/`), a tool's matcher (`tools/acceptance-ui.mjs`'s `/Read it first/`), or another area's
test reading a label of this area's (`decisions-advice`, `defects-g30-1`, `genre-identity-screens`). Each now asserts the
new words as exactly. A search for test literals whose words had left the code (`stale2.py` in the scratch folder: every
string or regex fragment of nine characters or more in `toMatch`, `toContain`, `toBe` and `toEqual` that the baseline's
`src` held and today's doesn't) found four more, in files the run hadn't listed: `defects-g8-10`, `defects-g9-1`,
`remaining-school-term` and `school-journey-gaps`.

Changed in the code with them, each read against what it says:
- *The notice of concern* reads its next step from `shortTermWords(school, school.termsBegun)` (defect 9).
- *A failed course's way on* (`remedy`) is a sentence of its own: “The degree needs every course passed. At the year’s
  end you can ask to repeat the year on the Standing tab.”
- *A brief suggested for a weakness* says what its share is of: “(7% of what its tape is judged on)”, where batch 2
  had “of the tape” and the baseline “of the work”. “A take” was avoided: it's the engine-speak list's.
- *The chooser's small print*: “Each way of playing shifts what counts most in your work toward what it is”, where batch
  3 had “what your teacher looks for”, which isn't true of a part in a production.
- *The Permanent Incomplete and the dismissed Standing tab*: the run's two remaining assertions named words that were
  already right; the tests followed.

Rerun: the 33 failing and affected files, then the 6 left, then 22 more after the guides (below): all passed.

## Batch 4: The School's Content Files

**Sources:** `src/engine/content/coursework.ts` (68), `material.ts` (98), `school.ts` (31), `roundups.ts` (22),
`tasks.ts` (16), `plays.ts` (6), `workbook.ts` (6), `concerns.ts` (1), `replacements.ts` (1), `workload.ts` (2).

**What changed.**
- *The steps' reasons* (`requires.why`, content/coursework.ts, which the judge reads: words only, no figure, id or
  order touched): “Read the scene first: you learn lines from a scene you know.”, “Read the scene first.”, “Read the
  play first. You need questions before you can research it.”, “Agree how you’ll work first: there’s no partner work
  until the boundaries are set.” The play reading's research refusal says the same as the coursework step's.
- *What The School Asks* (`SCHOOL_POLICIES`): “If you’re ill, email your teachers …”, “In the game, press Call In
  Sick …”, “The game counts two missed calls …”, “The steps are a notice of concern, then academic warning, then
  dismissal …”. Two sources' provenance lines lost an internal file name (`research-yale-leave*.json`).
- *Work It Through's ways* (`content/workbook.ts`): “part” for “segment”, as the screen says; “shape” for “fix”.
- *The round-ups' notes* (`content/roundups.ts`) said SLATE inside a sentence fifty-seven times (“SLATE moves nothing”, “SLATE
  drops it”, “SLATE’s reading”); each says “the game”, and the two shared sentences (`OFF`, `DROPPED_UNSAID`) open on
  “In the game”. A Mexican meta is “a goal kept inside the current account”, where it was “a segment”.
- *A self-tape's material*: “(Michael Caine, Acting in Film, 1990)”, without the research file's name.

**What stayed.** The scene and play material (`material.ts`: ninety-seven literary descriptions, plain and specific,
read whole), the plays and their parts (`plays.ts`), the tasks' descriptions and the qualities' meanings (`tasks.ts`,
whose preparation labels batch 1 changed), the concerns (`concerns.ts`: their `principle` lines, with “topic 1” and
the like, are the research record and no screen reads them), the licence replacements (`replacements.ts`), the courses,
skills, labs and faculty (`school.ts`: names and the Bulletin's titles), and the other step reasons (“Learn the song
first.”, “Make the score first.” and the rest: short, and they say what to do).

**Meaning-sensitive changes:** none moved a figure. The round-ups' “the game drops it” sentences say what
`systems/roundups.ts` does, as “SLATE drops it” did.

**Tests updated:** `evidence-g18-school` (Learn Lines' reason, the boundaries), `evidence-g22-school` (research
refused). **Tool matchers:** `tools/acceptance-ui.mjs` (Table Work's reason: “Read the text first”).

## Batch 5: The Three Guides, Rewritten To The Eight Questions

**Sources:** `src/engine/content/guide/school.ts` (25: seven entries), `coursework.ts` (22: eight), `productions.ts`
(22: seven, and `axisFact`).

**What changed.** Every one of the 22 entries:
- *What it's for* (`short`) opens on the purpose in a plain sentence (“Your standing is how the faculty judge each
  term, and it decides whether you stay, whether you’re cast and whether you get your degree.”), then what happens.
- *What to press* (`steps`) names the screen's own labels, read against the code and the built app's text walk: Note
  Priority, Rehearsing With, Shown Today, Still to finish, Mark As Read, Catch Up The Blocking, “Ways to work on it:”,
  Abilities It Uses, Aspect.
- *What to do next* (`next`, new): two or three steps on every entry, each a control or a place on the screen.
- *If you can't* (`unavailable`): sixty-nine quoted refusals set against the code and replaced with today's words
  (defect 11).
- *The engine's words* went: Weighs (now Note Priority, and “What does Note Priority mean?” where the questions asked
  about Weighs), dimensions (the qualities your teacher looks for, or what counts most), “rehearsed in”, “draws on”,
  “leans on”, the draw (luck), meetings (classes), the evaluation (the term review), “SLATE’s rule”, “SLATE’s faculty
  model” and “SLATE’s estimate” (the game’s rule, the game’s model of the faculty, estimated).
- *The worked examples* keep their figures and structure: the tests play them and read their numbers by regex. Their
  words changed only where they said Weighs, “rehearsed in”, “at the meeting” or “evaluation”, and each test's regex
  changed with them (`guide-examples-coursework`: Note Priority under Lines, “count … times as much”, “of a usual one”,
  “it’s at … of the … it needs”; `guide-examples-productions`: “already rehearsed keeps”, “the calls left rehearse it”,
  “counts what it favors as short of preparation”, the Summer Cabaret's refusal).

**What stayed.** Every entry's id, covers, goal, where, related, connections' targets and kinds, and the questions
(but the one about Weighs); every figure, still read from the rules' constants.

**Meaning-sensitive changes, and how each was checked.**
- *Note Priority*: “how much the part counts when the teacher picks what to note”, read from `noteCandidates`; Put
  First “counts for more in both”, read from `LEARNING.objectiveWeight` in `weightsOf` and the result's lean.
- *Whose rules these are* (`school.standing`, `school.repeat`): the same split between the Bulletin and the game, said
  without SLATE; `tests/remaining-school.test.ts` (school.s6.policy) asserts the new words.
- *The degree “isn’t recommended”* where the old words said withheld: `withheld`'s notice is The Degree Isn’t
  Recommended, as the glossary has it.

**Tests updated:** `guide-examples-coursework`, `guide-examples-productions`, `remaining-school` (school.s6.policy),
`need-paths` (the guide's Need).

**Checks:** `npx tsc -b --noEmit` exit 0; eslint on every changed `.ts`/`.tsx` exit 0; title-case, label-sweep,
plural-check, voice-check (38 of 40 after the guides), tics, doc-refs, deciders, spelling and typos all exit 0. The 22
guide-reading and affected test files: 217 tests, all passed after two example regexes followed (rerun 18 of 18).

## The Built App

`npm run build` exit 0; served with `npx vite preview --port 4203 --strictPort`, stopped by its process id. Walked with
`tools/text-walk.mjs` at 1440 and 390 on seven of brief 13's saves (rehearsal, leave, withdraw, workload, brief,
direction, missed-plan: `after-1440`, `after-390`, 25 screens each), and on four saves written again with this code
(`tools/scenarios.ts`, the same seeds and lengths as `tools/scenario-saves.mjs`: rehearsal, leave, withdraw, workload;
`after-new-1440`, `after-new-390`), since a save keeps its notices and its feedback in the words of the day it was
played. `tools/text-render-check.mjs`:
- on brief 13's saves, exit 1, 6 distinct faults: “You and Hannah had rehearsed together 1 times” and “Better than on
  …, not there yet” on the workload save's Coursework tab are that save's stored feedback (defect 1 fixed the words it
  would print now); the rest are other areas' (“Sleep owed 1 hours”; money written “-$3”).
- on the saves written with this code, exit 1, 1 distinct fault, not this area's: “Sleep owed 1 hours” (Player
  Profile).

What the walk found, and what changed for it: “Given 1 time, first September 14, 2026, last September 14, 2026” under
Your Notes (now “Given once, on …”); “What held most of them back was with your partner” in A Word On Your Coursework
and the term review's reason (now the card's label, quoted: “With Your Partner”); Your Standing's subtitle “Evaluation
On …” (now “Term Review On …”); “The running time: Estimated: no Carlotta …” (now “Estimated, since no Carlotta …:”).
Each guide label was set against the walk and the UI code: every one exists (`labels.mts` in the scratch folder).

Screens read: School's Standing And Craft, Classes, Coursework, Casting, Shifts And Pay and Terms And Award on each
save, and Home's notices; at 390 the same words. The walk records words, not layout: `tools/acceptance-ui.mjs`, which
measures overflow at 390, wasn't run in this area.

## The Coordinator's Notes, Answered

- **The term review's calendar entries** were titled “Fall Term 2026 Evaluation” (`registerSchool`, and `rescind` in
  `leave.ts`). They're “Term Review, Fall Term 2026” now: one name for one thing, the glossary's. The label is display
  only (the entry's kind, `school.evaluation`, is what the code reads), and a save keeps its scheduled entries' labels,
  so an old save shows the old title until its next term is scheduled. The Standing tab's table of past reviews,
  “Evaluations”, became “Term Reviews” with it, and the guide, three tests and `tools/acceptance-ui.mjs`'s heading
  matcher followed. The Calendar legend's School row (the frame area's) should say “each term’s review”.
- **“Your School”**: the School screen's eyebrow and its tab list's accessible name say “School”, as the rail and the
  breadcrumbs do. The Profile's button (“Your School”) and `ROUTE_LABELS` in `game-context.tsx` aren't this area's.
- **“You and Hannah had rehearsed together 1 times”** is the workload save's stored feedback, written before this pass.
  `noteText` prints “once”, “twice” and “N times” since batch 1 (defect 1, `rendered.txt`); on the workload save written
  again with this code, the render check finds no such line.

## Statuses

Every source of the area's, marked with `node tools/text-inventory.mjs --mark … --by school` after the last word changed:
213 Rewritten And Verified (a source whose text differs from the baseline's, with the tests and screens that hold it),
402 Reviewed And Retained (read and kept, with why), none Pending or Blocked. `node tools/text-inventory.mjs --check`
exit 0. The area's engine-speak hits went from 90 to 11. What's left: a take where it is one (a practice brief's “The Take”,
“Record A Take” on a camera piece, the take of a brief in two guide lines); a run's weight in casting (“carried at …
of its weight”, which is what it is); four “refused” the matcher reads without the reason that follows them in the same
sentence (“refused, because the classes have already counted you”), one of them Chekhov's Nina (“he hopes, is refused”);
and the movement score's part label “Rehearsed In The Body”, a card label in a file the judge reads.

## The Whole Suite, And The Gate's Checks

`npx vitest run` once over everything (376 files, 4,587 tests): 6 failed, each an assertion of words this pass changed
that the targeted runs hadn't reached (`evidence-g11-money` round-up notes, `genre-identity` “Your Composure held back”,
`looks` the look's provenance over 220 characters, `scenes` “You played Theo in The Night Desk.”, `work-limits` two
conversion refusals) or a test that ran while its source and its assertion were being changed together
(`remaining-school-term`, Term Reviews). Each was fixed (the provenance shortened, the rest asserting the new words) and
its file rerun with nine more the last edits touch: 13 files, 224 tests, then `work-limits` alone, all passed.

The gate's checks on the final tree: `tsc -b --noEmit`, eslint on every changed `.ts`/`.tsx`, title-case, label-sweep,
plural-check, voice-check, tics, doc-refs, wired, deciders, spelling, typos, geo-check, inventory, devmap,
capabilities, coverage, student-matrix and text-inventory all exit 0. `traceability.mjs` exited 1 until
`--write` (the School's rows quote refusals); `completion-matrix.mjs --check` exits 1 (see defects.md, For The
Coordinator).
