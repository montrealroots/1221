# The School Area: Batches

Brief 15's school area (`../prompts/school.md`). Each batch is a few files read whole, with the interaction around
them, then rewritten or kept, its tests and tools moved to the new words, its checks run and its statuses marked with
`tools/text-inventory.mjs --mark2 … --by school`.

Three tools in this folder print what the player reads, from the game's own code:
- `render.mts` → `rendered.txt`: the dynamic sentences of coursework, feedback, the limits and the term, in each
  variant, and a played term's notices (brief 14's script, run again on this pass's words, with more cases).
- `screens.mts` → `screens.txt`: the Coursework tab rendered on the server inside the game's own provider, for a life
  played to late September.
- `guide.mts` → `guide-*.txt`: How This Works entries printed field by field with their figures filled in.

## Batch 1: Feedback, The Notes, The Term's Warning, Incompletes And The Coursework Tab

### Sources Reviewed

All of `systems/coursework.ts` (40 sources), `systems/evaluation.ts` (7, one new: `pointsWords`),
`systems/courserecord.ts` (9), `ui/components/CourseworkPane.tsx` (13, one new: `timesWords`), `systems/classmates.ts`
(26), `systems/playreading.ts` (8) and `ui/components/ClassMoments.tsx` (1); and six How This Works entries whose quotes
of these refusals changed, read whole: `coursework.prepare`, `coursework.table`, `coursework.approach`,
`coursework.class`, `productions.plays` and `school.repeat`. 110 sources: 53 rewritten, 57 kept.

### Rewritten

- **The teacher's note** (`chiefLimit`, `conditionWords`, the new `pointsWords`, `show`, `feedbackWords`, `noteText`):
  the working reference's example 2 throughout. The quality and the ability in lower case ("your vocal expression held
  back your execution"), the cost in whole points out of 100, problem first and then the next step ("When it does come
  together, here's what to try next."). A card's part name is quoted as a name ("“Lines” wasn’t complete"); a task's
  own words stay bare ("Learning the lines wasn’t complete"). A note that comes back counts in words to the ninth time,
  says when it was last given, and still says "it's still there", not "it hasn't moved": a recurring note can have
  risen a little, short of `LEARNING.better`.
- **Setting a piece** (`setWork`): the reference's example 3, with "Start with X: this piece puts it first, so it
  counts for more when you show it." after the due date.
- **The showing's notices** (`meetingWeight`, `sinceLast`, `reshownWords`): full sentences for up, down and the same
  band; a piece shown again says its band against the first showing's ("It was Working this time, after Unready the
  first time"); Still There counts the time as an ordinal and says what to do next.
- **A Word On Your Coursework** (`termWarning`): what happened, then what it means against the term review, then the
  cause and what to do. The remedy for the partner part named Rehearse With Your Partner, a step the card never shows as
  a button; it now says "ask your partner for an evening under Rehearsing With, at least two hours ahead, or Run It With
  A Reader" (`remedyWords`), the same on the card's Still to finish and Due Soonest.
- **Partners** (`partnerAsks`, `rehearsalOutcome`, the lapsed ask, `prepareRefusal`'s waits): where to answer, that
  saying no costs nothing, what a no-show means and the two ways on, what an unanswered ask cost.
- **Refusals**: "That piece is finished." for "That work is finished." across `prepareRefusal`, `approachRefusal`,
  `askRefusal`, `school.choose` and `respondRefusal`; the studio and library refusals name Catch Up; Table Work's names
  Table Work; the other refusals given a clear subject.
- **Orientation** (`orient`): the faculty session's semicolon chain as two sentences; course counts in words.
- **Incompletes and Fails** (`courserecord.ts`): the Incomplete's notice names Ask For A Month More; the week's
  reminder offers it only where `extendRefusal` would allow it; "the time to make it up ran out" (it may have been two
  months); the remedy sentences put the player first and the qualification last.
- **The Coursework tab**: forecasts in whole points of 100 ("about 52 of 100"); counts of notes in words; Table Work's
  fine print says "answer" where it meant one; the partner's words labelled as "A summary of your preparation, not
  Theo's own words."
- **Classmates** (`classmates.ts`, `ClassMoments.tsx`): the reference's row 4 ("You and Chloe don't have a scene
  together right now …"), "Your lines for Trifles went from 40% to 55%.", the boundary's lift in words, the word after
  class as encouragement a person would say.
- **Play reading** (`playreading.ts`): "You read Sweat, by Lynn Nottage, all the way through.", "The published cast is
  3 women and 6 men" (a solo play's no longer "1 woman and 0 men"), and the library refusal after the School says you
  can't borrow and why.
- **The six guide entries**: each opening now says what the feature is for and what to press first; "book its make-up
  sessions" (nothing is booked: the button does the session) became "press Make Up A Session"; quotes moved to the new
  words.

### Kept

57 sources, each with its own reason in `docs/text/second-pass/school.json`; a sample is in `retained.md`. Among them:
the bands, Orientation's session names, a classmate's reasons they can't rehearse, the partner's words after a
rehearsal, the classmates' moments and the answer buttons, the course codes.

### Meaning-Sensitive Changes, And How Each Was Checked

- **Put first counts for more.** Read `workContext`: the part put first multiplies the qualities it feeds by
  `LEARNING.objectiveWeight`, so "counts for more when you show it" is true of the result, not only the note. "Most"
  (the reference's word) wasn't used: the weight is relative to the part's own.
- **Points out of 100.** `Limit.by` is the points a limit cost a quality on its 0 to 100 scale (`evaluation.ts`). The
  sentence rounds it; nothing stored changes. Under half a point says "less than a point".
- **Still there, not unmoved.** `recordNote` calls a note recurring when it rose less than `LEARNING.better`, so it
  can have risen.
- **The partner step.** `CourseworkPane` filters the partner's own step out of the card's buttons; `needRefusal` sends
  it to Rehearsing With. The remedy now names that.
- **A no-show.** `rehearsalOutcome`'s `missedByThem` moves none of your trust and none of your preparation: "It isn’t
  held against you, but the scene got no further."
- **An unanswered ask.** `WORK.ask.unanswered` takes 2 of their trust; a declined ask moves nothing.
- **The extension hint.** The week's reminder offers Ask For A Month More only where `extendRefusal` returns nothing,
  the rule that shows the button.
- **The time ran out.** After an extension, the time is two months, so "the month" became "the time".
- **Make Up A Session isn't booked.** `school.make_up` moves the clock by `makeUpMinutes` and counts the session then.
- **The difficulty label.** "How Hard The Piece Is" for "How Hard The Work Is": the label only, its id and kind kept.

### Interactions Read Whole

- A piece set (`setWork`), its steps and each refusal on the card (`prepareRefusal`, Table Work's), Shown Today, the
  showing and its note, the note taken or not at the showing again, Still There, A Word On Your Coursework, then the
  term review's Incomplete and Fail notices. Rendered end to end in `rendered.txt` (a played term) and `screens.txt`
  (the card).
- A partner's request (`partnerAsks`), answered or left (`answerRefusal`, the lapsed notice), the rehearsal, a no-show
  and your own no-show (`rehearsalOutcome`), a class moment, the boundary and Make Amends.
- Reading a play: the tour, the read, read again, research, and the library after the School.

### Tests And Tools Updated

To the new words, as exactly as before (no assertion removed or loosened, no title changed):
`tests/approaches`, `attributes-phase-2b`, `defects-g8-9`, `editorial-school-words`, `editorial-class-moments`,
`evaluation`, `evidence-g18-school`, `evidence-g19-school`, `evidence-g20-school`, `evidence-g21-school`,
`evidence-g22-school`, `evidence-g23-school`, `evidence-g24-school`, `evidence-g26-school`, `evidence-g27-ui`,
`evidence2-b07` (and its doc comment), `evidence2-b09`, `feedback`, `genre-identity`, `genre-identity-screens`,
`interpretation`, `language-dynamic`, `partners`, `playreading`, `remaining-school`, `remaining-school-term`,
`scope-school`, `student-experience`, `table-work-unread`, `whynot-school`, `workload`.

Tool matchers:
- `tools/acceptance-ui.mjs`: the term warning's order and its colon; Shown Today and Due Soonest in whole points of 100;
  "held back your [a-z]" for "held back [A-Z]".
- `tools/playthroughs-ui.mjs`: the same three.
- `tools/brief-journeys.ts`: the points tail it strips from a chief limit.
- `tools/plural-check.mjs`: the Still There ordinal ("for the fourth time") allowed beside the existing one.

### Checks

| Check | Exit |
|---|---|
| `npx tsc -b --noEmit` | 0 |
| `npx eslint` (the changed files) `--max-warnings=0` | 0 |
| `npx vitest run` (the 47 test files above and the guide's) | 0 (every file passed) |
| `node tools/title-case.mjs --check` | 0 |
| `node tools/label-sweep.mjs` | 0 |
| `node tools/plural-check.mjs` | 0 |
| `node tools/voice-check.mjs --check` | 0 |
| `node tools/tics.mjs --check` | 0 |
| `node tools/spelling.mjs` | 0 |
| `node tools/typos.mjs` | 0 |
| `node tools/text-inventory.mjs --check` | 0 (the school area's engine-speak unchanged at 11) |
| `node tools/doc-refs.mjs --check` | 0 |
| `node tools/deciders.mjs --check` | 0 |
| `node tools/guide-quotes.mjs --check` | 0 (581 of 581 said) |

### Screens Verified

`screens.txt`: the Coursework tab of a played life (Orientation, Due Soonest, eight cards with Shown Today, Table Work,
Rehearsing With, Feedback, A Note That Keeps Coming Back). The built app is walked once the area's text is done.

## Batch 2: The Term Review, Standing, Casting, The School's Notices, Productions And The Workload

### Sources Reviewed

All of `systems/school.ts` (57, one new: `registerWay`), `content/school.ts` (32), `systems/production.ts` (7),
`systems/ensemble.ts` (2), `systems/piece.ts` (2), `systems/workload.ts` (4, one new: `minutesWords`),
`content/workload.ts` (2) and `ui/components/RehearsalProcess.tsx` (4); and four of batch 1's sources read again where
"the Standing tab" became the tab's own label (`courserecord.ts`'s three notices, `coursework.ts`'s `orient`). 110
sources: 24 rewritten (with the four read again), 86 kept.

### Rewritten

- **The term review** (`evaluate`): the cause and its steps in the warning's words ("To work on it: ask your partner
  …"), where the remedy had been capitalized into the subject of "works on it" and named a button the card doesn't show;
  "the middle student in your class grew" for "the class’s middle student’s grew".
- **Standing** (`setStanding`): "You’ve been placed on academic warning at a formal meeting …"; what stands after the
  School ends now says what you can still do ("You can still practice, and tape the practice briefs on your Profile,
  outside the School.").
- **The welcome** (`enroll`), **casting** (`cast`: where the calls are and what two missed ones do), **the teachers'
  notes** (two skills where one has its own "and" keep their "in" or "your"), **leaving a Cabaret show** (counts in
  words, and the calls you won't make "don't count as missed").
- **The School's notices** (`registerSchool`): Not Registered and A Shift You Couldn't Work name the real way to
  register (`registerWay`: Register on Standing And Craft after a leave or a hold, otherwise Orientation's registration
  session caught up on the Coursework tab), where they said "Register on the School screen"; You Missed Classes in a
  sentence, with the next step (call in sick before classes start); Sent Home From Work-Study in the refusal shape;
  You Missed A Rehearsal Call says what happened and how many more take you out of the pool, or that you're already out;
  the December conferral and Not Conferred In December in two sentences each; the Summer Is Yours says nothing calls on
  you; the withdrawal's "grace period" and its reason; the Term Begins notice puts tuition first in both branches.
- **Looking Back** (`reflect`): counts in words, "answered in the work" gone, and the working reference's label "(A
  summary of your run, not the director’s own words.)"; RehearsalProcess's The Nights Together in the same words.
- **The scene together** (`sharedWords`): whole points of 100.
- **The workload** (`workloadWords`): what it does to your night first, then how it's worked out; durations as the
  glossary says them in a sentence; the intensity, an intermediate figure, left out.
- **The Standing And Craft tab**, by its label, in the policy line and batch 1's Incomplete and Fail notices.

### Kept

86 sources: the standings, terms, names and the School's real names and sources, the Cabaret's and Summer Cabaret's
refusals, the director's notes in the director's voice, the production's refusals, the workload's sources. A sample is
in `retained.md`.

### Meaning-Sensitive Changes, And How Each Was Checked

- **Where to register.** Read `registered()`, `school.reregister` (StudyPlanPanels' LeavePanel, on Standing And Craft)
  and `orientationRefusal`: `mustRegister` is set after a leave or a hold, and otherwise the only way is Orientation's
  session, which can be caught up while Orientation isn't behind. `registerWay` reads the same flag.
- **The missed call.** `missedCallsOut` returns early when `castable` is false, so the rehearsal-call notice reached
  students already out of the pool; the count left is `missedCallsOut - (calls - answered)`, as the rule reads it.
- **Call in sick before classes.** `sickRefusal` refuses once the day's classes have run.
- **Practice after the School.** `practiceRefusal` and `tapeRefusal` read the craft, not the School.
- **The workload's figures.** Each figure in the sentence is the one it was; the intensity is left out of the words
  only, and the workload is printed to a tenth.
- **Looking Back.** Every note taken counts toward "you took"; the craft notes' separate count only fed the dropped
  clause, so no figure the panel kept is gone.

### Interactions Read Whole

- A term's review from attendance to the notice: the warning before it (batch 1), the review's reason, the standing's
  notice, the Fails and Incompletes, the Cabaret left on a warning (rendered end to end, `rendered.txt` REVIEW lines).
- Registration: the welcome, Orientation's session, Not Registered, a shift that can't be worked, a hold, Register.
- Casting, its calls, a missed call, out of the pool, Not Cast This Term, the director's notes, Looking Back.

### Tests And Tools Updated

`tests/decisions-stamina`, `defects-g31-1`, `defects-g8-12`, `evidence-g16-papers`, `evidence-g19-school`,
`evidence-g21-school`, `evidence-g24-school`, `evidence-g26-school`, `evidence-g33-ui`, `evidence2-b01`, `evidence2-b08`,
`evidence2-b09`, `evidence2-b10`, `evidence3-person`, `evidence3-school`, `language-dynamic`, `need-paths`,
`remaining-09-journeys`, `remaining-school`, `scope-school`. Two of these (`evidence2-b08`'s play-reading note and
`remaining-school`'s check of whose rules the repeat entry names) held batch 1's words and failed after batch 1's
commit, which hadn't run them again after its last guide and play-reading edits; they pass from this batch. No tool
matcher held this batch's words.

### Checks

| Check | Exit |
|---|---|
| `npx tsc -b --noEmit` | 0 |
| `npx eslint` (the changed files) `--max-warnings=0` | 0 |
| `npx vitest run` (84 test files that hold or render these sources, then the four that failed, again) | 0 |
| `title-case`, `label-sweep`, `plural-check`, `voice-check`, `tics`, `spelling`, `typos` | 0 each |
| `node tools/text-inventory.mjs --check` | 0 once marked |
| `doc-refs`, `deciders`, `guide-quotes` | 0 each |

### Screens Verified

`rendered.txt`: the welcome, the teacher's notes, a review that puts you on warning and takes you out of a Cabaret show.
`screens.txt` from batch 1 is unchanged by this batch. The built app is walked at the area's end.

## Batch 3: Leaves, The Yale Account, Repeating And The Degree's Last Steps

Begun before batch 2 was committed, so the two are committed together; each has its own record here.

### Sources Reviewed

All of `systems/leave.ts` (43 sources), and the two school guide entries that quote its refusals, read whole:
`school.leave` and `school.money`. 45 sources: 14 rewritten, 31 kept.

### Rewritten

- **The checking account** (`bankShortWords`): "Your checking account and your savings can’t cover any of it, so nothing
  was paid." for "Your current account and the savings beside it …", the glossary's word from this brief, and the
  refusal's shape (what can't pay, the amount, what didn't happen). It said "the savings beside it"; the payment to Yale
  draws on savings whether linked or not (`fromBankToYale` passes `fromSavings`), so "linked" would have been untrue
  and plain "your savings" is what's so.
- **Where to press** (`startLeave`, `returnFromLeave`, `joinCohort`, `facultyReview`, `offerRepeat`, the dean's
  decision, the additional term, Two Weeks To Give Notice): each names its control on its tab, Give Notice Of Return,
  Register and Appeal To The Dean on Standing And Craft, Ask For An Aid Review on Terms And Award, where they said "on
  the Standing tab", "Tell the registrar" or "ask for its review".
- **Degree not recommended** (`offerRepeat`, `cancelRepeatWarning`): "the faculty won’t recommend the degree", the
  glossary's words, for "the degree is withheld" and "Calling it off withholds the degree".
- **Yale Health** (`considerWelfare`: the assessment's notice as five plain sentences; `tellOutsideTheCover`: the player
  booked it, so it stays there, and what to press to be covered).
- **Counts and ordinals in words** (`leaveLengths`, `billUnsupportedTerm`'s "this is your seventh", the repeat's
  "takes eight terms: two will be billed"), and "pays its Yale Health fee and …" for "meets its … and pays".
- **The two guide entries**: their quotes moved to the new words; "a grace period of 15 days"; "press Register".
- **The courses a leave leaves unfinished** (`startLeave`): "You leave nine courses unfinished, to take again when
  you’re back: Acting I, …, Acting Intimacy And Combat For The Stage and Drama 50: The Theatrical Event." for nine names
  joined by commas before the verb ("…, Drama 50: The Theatrical Event are left unfinished"), found playing the leave
  (`leave.mts`).
- **One count in words** (`countWords`): school.ts's helper is exported and leave.ts uses it, where batch 3 had begun a
  copy of its own; the Standing And Craft tab's repeat panel (batch 4) says its terms with the same one.

### Kept

31 sources: the refusals for leaves, the additional term, a repeat, Affiliate cover, appeals and Register, each naming
its rule and, where there is one, the way out; the assessment's findings; the account's ledger lines.

### Meaning-Sensitive Changes, And How Each Was Checked

- **Savings.** `fromBankToYale` calls `drawFromBank(…, fromSavings = true)`, so the payment reaches savings whatever the
  link; the words say "your savings".
- **Nothing was paid.** Both callers (`payBalanceRefusal` behind Pay From Your Bank, `school.buy_affiliate`) refuse
  after the press, with nothing posted.
- **The controls.** Give Notice Of Return, Register and Appeal To The Dean are in StudyPlanPanels' LeavePanel and
  RepeatPanel, drawn on Standing And Craft (`SchoolWorkspace`); Ask For An Aid Review in YaleAccountPanel, on Terms And
  Award.
- **Not recommended.** `withheld` is the standing the guide and the Standing And Craft tab call Degree Not Recommended.

### Interactions Read Whole

A leave asked, granted, begun, the notice to give, the return and registration; the dean's imposed leave and its appeal;
Yale Health's assessment; a term past six billed, the hold and paying it; the last year's offer to repeat or take an
additional term, and calling a repeat off.

### Tests And Tools Updated

`tests/defects-g8-2` (Affiliate cover's "pays its … and …", and the call-off warning), `defects-r3-1` (the leave
lengths, the count in words from `LEAVE_RULES.maxTerms` as before), `evidence-g25-school`, `evidence-g26-school`,
`evidence2-b09`, `remaining-09-journeys`, `remaining-banking`, `remaining-school`, `school-paths` (the assessment's
"not at any diagnosis") and `student-experience` (Your Degree Isn’t Complete). Each assertion holds the new words as
exactly as it held the old. No tool matcher held this batch's words.

One test failed on batch 2's words, not this batch's: `tests/looks.test.ts` keeps "out of 100" off the screens, and
batch 2's The Nights Together had written it; it reads "averaged 78 of 100" now, as `docs/GLOSSARY.md` writes trust, and
`RehearsalProcess` was marked again with it. The engine's teacher's notes keep "points out of 100", which no rule of the
screens' covers and a sentence says naturally.

### Checks

| Check | Exit |
|---|---|
| `npx tsc -b --noEmit` | 0 |
| `npx eslint` (every changed file) `--max-warnings=0` | 0 |
| `npx vitest run` (38 files that hold or render the leave's words: 5 failed on words not yet moved; then those five and six more touched, 11 files, 168 tests) | 0 |
| `title-case`, `label-sweep`, `plural-check`, `voice-check`, `tics`, `spelling`, `typos` | 0 each |
| `node tools/text-inventory.mjs --check` | 0 once marked |
| `doc-refs`, `deciders`, `guide-quotes` (581 quoted, 581 said) | 0 each |

### Screens Verified

`leave.txt` (`leave.mts`): a medical leave played through commands, its notices as the player reads them: Your Leave
Has Begun, Two Weeks To Give Notice, Back From Your Leave, The Class Of 2030. `guide-b3.txt`: the two guide entries
printed with their figures. The built app is walked at the area's end.

## Batch 4: The School Screen, Its Study Plan Panels, The Brief And How You'll Play It

### Sources Reviewed

The School screen's tabs (`SchoolWorkspace.tsx`, 20 sources), the leave, repeat, Yale account, work limits and classes
panels on them (`StudyPlanPanels.tsx`, 8), the practice brief's pane and the chooser and work-through it shares with the
coursework card (`BriefPane.tsx` 6, `PlayingChooser.tsx` 5, `WorkThrough.tsx` 3), and the school's and a classmate's
own pages (`looks/school.tsx` 4, `looks/classmate.tsx` 1). 47 sources: 14 rewritten, 33 kept. Each tab was read as it
draws for a life in its first spring (`school-tabs.mts`, rendered before and after).

### Rewritten

- **The figures under Your Standing** (`StandingPane`): growth "The middle student in your class grew 0.6", in the term
  review's words, for "The class’s middle: 0.6"; the coursework note as a sentence that says what it counts; and
  Attendance counts lists only what was asked ("35 of 35 class days and 7 of 7 assigned shifts", no "0 of 0 calls").
- **Why This Cast and the casting note** (`CastReadPanel`, `CastingPane`): the chair's read in its order (fit, a fifth
  of it scaled by delivery, then the balance), a run's weight as nights ("counted as 2.5 nights" for "counted ×2.5"),
  "a student who’s cast is expected to play the part" for "a student cast fulfills it", and "judged" for "banded".
- **Lists with their "and"** (`CoursesPanel`, `RepeatPanel`, `LeavePanel`, the play's skills): `spokenList` where names
  were joined by commas alone.
- **The leave, the dean's leave and the repeat** (`StudyPlanPanels`): "counted absent", the appeal in two sentences,
  "the faculty won’t recommend the degree", and "takes eight terms: two would be billed", from batch 3's notices.
- **Withdrawing and the terms** (`WithdrawControl`, `TermsPane`): a fifteen-day grace period; the living scholarship
  "pays its health fee and what the account owes"; tuition "covered in full".
- **The brief's beats, said once** (`BriefPane`, `MaterialDemands`, at material-b's suggestion once that area was
  merged): the rehearsal line under Where It Turns no longer repeats the beats' arc, which What It Asks gives after
  its Tone line (`briefMaterial` passes it as the turns' reason); and that line counts "5 changes of tone to play", the
  pane's own name for the count, for "5 transitions to play".
- **Small ones**: the Cabaret's "Out of the show from {date}, on academic warning", the cap's "turned down" for
  "refused" (an engine-speak hit gone), and How You'll Play It's "the same as with nothing chosen" when the two figures
  are equal.

### Kept

33 sources: the tabs' headers and labels, the timetable, the Cabaret's and Summer Cabaret's panels, the work-study
figures, the plays to read; the brief's reader choice and study line (the pane's forecast stays to a tenth, because
the tape's own result is given to a tenth beside it); the chooser's and the work-through's labels; the school's and a classmate's pages. Their reasons are
in `retained.md`'s sample and the second-pass file.

### Meaning-Sensitive Changes, And How Each Was Checked

- **The chair's read.** `playFit` returns fit × (1 − 0.2 + 0.2 × delivery) + balance (`systems/school.ts`): four fifths
  of the fit stand, a fifth scales with delivery, and the balance is added. The new sentence says that order.
- **Counted as nights.** `readRuns` weighs a run by min(nights, 8) × its source's share (a Cabaret's half), and the
  record before by its own weight × the carry: every weight is nights.
- **Counted absent.** As batch 3: `registerSchool` counts an unregistered class day as an absence.
- **Only what was asked.** The attendance line leaves out a count only when nothing of it was asked (`t.calls`,
  `t.shifts`, `t.classDays` zero); the review's figure is unchanged (`termTally`).

### Interactions Read Whole

Each tab of the School screen in its first spring: Standing And Craft (with the leave, courses, repeat and classes
panels), Classes, Casting (Why This Cast, the run, How You'll Play It), Shifts And Pay, Terms And Award.

### Tests And Tools Updated

`tests/evidence-g19-school` (counted as 2.5 nights), `evidence-g25-school` (the dean's appeal, Register's counted
absent), `evidence-g26-school` and `evidence2-b09` (the repeat panel), `remaining-09-journeys` (the ended coursework
note, "fell short", and its list of present-tense words, "falls short"). No tool matcher held these words.

### Checks

| Check | Exit |
|---|---|
| `npx tsc -b --noEmit` | 0 |
| `npx eslint` (the changed files, and the verification scripts) `--max-warnings=0` | 0 |
| `npx vitest run`: the five files of 47 that render these screens which had finished when the run was narrowed (`attributes-phase-2b`, `remaining-school`, `language-dynamic`, `evidence-g26-school`, `evidence-g24-school`); then 28 files with batch 5's (328 tests); `decisions-advice` in the clone, whose harness reads git (30); and, after material-b's two suggestions, the 10 files that render the brief pane and the chooser (134) | 0 |
| `title-case`, `label-sweep`, `plural-check`, `voice-check`, `tics`, `spelling`, `typos` | 0 each |
| `node tools/text-inventory.mjs --check` | 0 once marked |
| `doc-refs`, `deciders`, `guide-quotes` | 0 each |

The first run of the 47 was stopped partway: at this machine's load it would have taken three hours, and the whole
suite runs at the area's end. Two of its failures were the run's own: `remaining-09-journeys` held the old coursework
note (moved, above), and `decisions-advice`'s harness reads the commit, which the snapshot it ran in didn't have.

### Screens Verified

`school-tabs.txt` (`school-tabs.mts` with `tabs.vite.config.ts`, which reads the kept tab without the subscription a
server render lacks): the six tabs, before and after. `material.txt`: What It Asks.

## Batch 5: The Courses' Pieces, The Scenes And Plays' Material, Briefs And Work It Through

### Sources Reviewed

Every course's piece and the class scenes (`content/coursework.ts`, 68 sources), the scenes' and plays' material and
its reasons (`content/material.ts`, 98), the kinds of work (`content/tasks.ts`, 16), Work It Through's ways and problems
(`content/workbook.ts` 6, `systems/workbook.ts` 12), the brief's steps and refusals (`systems/briefs.ts`, 13), and
`systems/workpieces.ts` (4), `systems/material.ts` (1), `content/concerns.ts` (1) and `content/replacements.ts` (1). 220
sources, read whole: 17 rewritten, 203 kept. Kept sources that share one reason (the scenes, the templates, the
material) were marked together with it; the rewritten ones then each with their own evidence.

### Rewritten

- **Garbled sentences** in the material's reasons: The Bacchae's "Bound, the Stranger has;", Medea's "the women of
  Corinth by", Much Ado's "the comedy turns the comedy grave", A Marriage Proposal's missing "in", and The Seagull's
  "the present-tense despair".
- **Quotations in curly quotes** (`material.ts`, `concerns.ts`): eleven reasons quoted the plays in straight quotes;
  the words are the plays' and stay.
- **A scene's and a template's note** (`coursework.ts`): "Those are the first scenes", and the audition's Lines note,
  "The lines of the two pieces weren’t secure", for "The pieces weren’t secure".
- **Work It Through's problems** (`workbook.ts`): "Your composure costs your connection … points, and the whole piece
  …" for "Your Composure costs Connection … points, … of the whole piece", the labels lowercased mid-sentence as
  batch 1's teacher's note says them, and "of the whole piece", which read as a share, said as the cost it is. The
  preparation, objective and part problems the same way.
- **One spelling**: Stanislavski, as the concerns' other four citations have it.

### Kept

The class scenes (each choice with the line that confirms or rules it out), the courses' pieces and their notes in the
teacher's voice, the material's reasons (from the text's own events), the kinds of work, the brief's steps, reader
styles, purposes and refusals, Work It Through's ways and refusals. The concerns' citations name the project's research
by topic, which the source notes do throughout the game; they stay.

### Meaning-Sensitive Changes, And How Each Was Checked

- **"… points, and the whole piece …".** `Limit.by` is what the limit costs its quality, and `Limit.whole` what it costs
  the overall (`evaluation.ts`); the old "… of the whole piece" put the second figure as if it were a share of the
  first.

### Interactions Read Whole

What It Asks for each rewritten scene and play (`material.mts`), and the Work It Through list as practice briefs build
it, one problem of each kind (`b5.mts`).

### Tests And Tools Updated

None held these words. Evidence for the rewritten reasons and problems is the render (`material.txt`, `b5.txt`): the
inventory refuses a code read as evidence, rightly, and the first marks that gave one were marked again with the
render.

### Checks

| Check | Exit |
|---|---|
| `npx tsc -b --noEmit` | 0 |
| `npx eslint` (the changed files and `b5.mts`, `material.mts`) `--max-warnings=0` | 0 |
| `npx vitest run` (with batch 4's, 28 files: `workbook`, `guide-examples-coursework`, `guide-examples-productions`, `guide-examples-craft`, `defects-g8-9`, `defects-g8-11`, `material-words`, `genre-identity-screens`, `scenes`, `material`, `briefs` among them; 328 tests) | 0 |
| `title-case`, `label-sweep`, `plural-check`, `voice-check`, `tics`, `spelling`, `typos` | 0 each |
| `node tools/text-inventory.mjs --check` | 0 once marked |
| `doc-refs`, `deciders`, `guide-quotes` | 0 each |

### Screens Verified

`material.txt` and `b5.txt`.

## Batch 6: The Guide's School, Coursework And Productions Entries

### Sources Reviewed

The rest of the three guide files: `guide/school.ts` (22 sources, with `school.money` read again), `guide/coursework.ts`
(18) and `guide/productions.ts` (21). 62 marks: 7 rewritten, 55 kept. The entries batches 1 and 3 rewrote were read
again against what batches 2 to 5 changed.

### Rewritten

- **What the game now says, said the same way here**: an unregistered day "counts you absent" (orientation, money, the
  hold's paragraph in standing), "press Register on the Standing And Craft tab", a grace period of 15 days, what stays
  after a dismissal as the notice now says it, and Looking Back's notes "you worked on that didn’t move".
- **Engine-speak gone** (two hits): Calling In Sick's "is refused, because" as "You can’t call in after …: the classes
  have already counted you"; the casting row's "of its weight" and "carried at 50% of its weight" as "counting 50% as
  much as …".

### Kept

55 sources: the entries' steps, conditions, figures, refusals quoted in the game's words, and their worked examples;
the small helpers (months, clock, chapter lines). A guide entry is written to explain a rule; where it was accurate and
plain it stays. Questions and synonyms that say "withheld" stay: a player searches in their own words.

### Meaning-Sensitive Changes, And How Each Was Checked

- **Counting as much as.** `R.weight.cabaret` and `R.carry` are 0.5 (`ESTIMATE.casting.record`), multiplying a run's
  nights and the record before; "counting 50% as much as" is the same arithmetic.

### Interactions Read Whole

The six rewritten entries printed with their figures (`guide-b6.txt`).

### Tests And Tools Updated

None held these words; `guide-quotes` holds every quote the entries make (581 of 581).

### Checks

| Check | Exit |
|---|---|
| `npx tsc -b --noEmit`, `npx eslint` (the two guide files) | 0 |
| `npx vitest run` (`guide-examples-coursework`, `guide-examples-productions`, `guide-examples-craft` in the 28 files above) | 0 |
| the text tools and `text-inventory --check` | 0 each |

### Screens Verified

`guide-b6.txt`. The guide's screens are in the walk at the area's end.
