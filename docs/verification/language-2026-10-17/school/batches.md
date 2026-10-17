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
