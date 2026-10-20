# Brief 17: The Final Comprehensive Writing And Continuity Pass, 2026-10-20

The owner's "Final Comprehensive Writing And Continuity Pass"
(`../briefs-2026-10-16/17-final-comprehensive-writing-and-continuity-pass.txt`, kept verbatim):
- every reachable surface that shows text read where a player meets it, with a coverage matrix that says so;
- the mechanical phrasing removed, each speaker made recognizable, and the substance varied, not only the opening;
- a classmate's apology kept on the misses it's for, so a resolved incident doesn't come back;
- the first view of each surface saying what matters, what to do, what it costs and by when;
- the tutorials followed as a new player;
- the result tested against brief 16 on the same seeds.

## Where It Started

- **The branch:** `claude/peaceful-hamilton-59zdbb` at `dffc6ea0`. That is `main` at `bbb82253` with the handoff's
  account of that merge. There was no stash and one worktree.
- **What was merged, from Git.** `origin/main` is `bbb82253`, a merge commit whose second parent is `9b45b0ee`: #45,
  brief 16, merged at the owner's "Both.". `dffc6ea0`, the handoff's account of it, is not on `main`. Nothing is
  deployed. The handoff said so already; this pass found nothing in it stale on that.
- **The tested commit** is `ecd961cc`. Every measurement after and every final run was made on its game: on it, but
  the advice's last play, made on `a683f9ea`, which adds to it two tools put right, a test of one and records, nothing in `src/`
  (The Final Runs, below). The gate ran last, on `3fe960df`, which holds the records (The Gate, below).

## The Coverage Matrix

`docs/text/SURFACES.md`, written by `tools/surfaces.mjs` from `docs/text/surfaces/*.json`, is the matrix the brief asks
for in section 2. Each of its 265 rows is a surface a player can reach, and says:
- where the player meets it;
- the sources it draws on (each a source of `tools/text-inventory.mjs`);
- the states it's met in, from the brief's list (first use, repeated, success, setback, empty, locked, overdue, error,
  confirmation, warning, notification, recommendation, forecast, explanation, teacher, director, classmate, history,
  returning, assembled, and the rest);
- what reading it in context found, and what changed (Revised), or why it was kept as it was (Kept);
- the evidence, each a test, a walk or a source that opens from the repository.

4,230 of 4,230 sources are claimed: 127 surfaces revised and 138 kept. From this pass, `tools/surfaces.mjs --check` is
the gate's twenty-first check. It fails:
- a source no row claims;
- a row whose source is gone;
- a state the brief doesn't list, or an outcome that isn't Revised or Kept;
- a Kept row with no reason;
- evidence that isn't there;
- a `SURFACES.md` that isn't the matrix as it stands.

The rows were built by eight editors in clones, one area each, and the coordinator:
- material `cf3d9153`, school `96a20937`, money `e37e0bf3`, health `46d335d4`, profile `c233293c`, frame `b48dec2e`,
  papers `c341062e`, tutorial and help `e51ec780` (each a merge of its area's branch);
- the coordinator's own rows, `docs/text/surfaces/coordinator.json`: the feedback, the notes, Rehearsing With, the
  class, the directors and the term warning.

Each editor read their surfaces in the order a player meets them: on the built app of `bbb82253` and of their branch,
at 1440 and 390, on the fifteen scenario saves (`evidence/b17/walk-before/`), and in the baseline runs' transcripts.
Their walks and notes are in this folder, one subfolder an area.

## What Changed

### The Feedback, In Five Voices (Sections 3 To 5)

`src/engine/systems/feedback.ts` composes a showing's feedback from the record, by situation, in the course's voice.
- **Five course voices**, one a course (`VOICE_OF`): direct, warm, exacting, patient and brisk. Two first-year courses of
  one discipline never share one. Each voice has its own way to acknowledge a move, to say a note comes back, to frame a
  next step and to stop. `tests/feedback-voices.test.ts` holds that no two voices share a whole message or a first
  sentence for the same facts.
- **The rule said as a rule:** a note given before says where its part stands and what puts it right ("It's at 50%. A
  piece shown with it at 75% or more puts the note right."), never "the note is taken at 75%".
- **The situations the brief names:**
  - a first breakthrough (a first Strong) and a best, acknowledged and left there;
  - progress continuing, said as a run, counted at its milestones and told without its count between them;
  - a strength maintained;
  - partial improvement, with the part's figures then and now;
  - a repeated problem, the second, the third and a note given often, each its own way;
  - a problem resolved and later recurring, with the day it was put right, "earlier today" where it was;
  - a strong result despite a recorded difficulty, where the day cost two points or more;
  - preparation complete but a skill or the day holding it back, said with what builds it, and counted when it holds
    piece after piece.
- **No new lesson after every success.** A first Strong, a best and a strong piece despite the day stop at the
  acknowledgment. A part left unfinished is answered by the steps that finish it, not a step beyond it. Until this pass
  every message carried a step: "Meanwhile, try this:" after what held the piece back.
- **Said once:** every move names the new band; the band and a day are said once in a message; a part is named in prose
  by what it is ("your lines"), never by its card's label ("the note on Built On").

### The Directors, The Teachers' Term Notes, The Class (Section 4)

- **Directors:** three voices, plain, exacting and encouraging, one per production for its whole run
  (`directorVoiceFor`), and its closing note in the same voice. What came of the last note is said each voice's way, never
  with two colons in a sentence. The guide quotes each production's director in their own voice.
- **Teachers' term notes:** each course's teacher writes its own, in its course's voice (`TEACHERS_NOTE`).
- **Classmates:** each asks for help, to study, or to run lines in a way of their own, the same way each time
  (`wayOf`), and the class doesn't share one. What they've asked is counted on them (`asked`), so "the third time
  they've asked" survives the moments the save lets go, and "you helped them last time" is the newest answer, not the
  oldest.

### An Apology, Once For Its Misses (Section 6, The Authorized Fix)

Brief 16 found Nadia apologizing on October 8, 2026 for two missed rehearsals and again for the same two on September 30,
2027. An apology was due while a classmate's misses outnumbered the apologies among their last 20 moments, and those
moments fall away.
- **The incident has an identity now:** each missed rehearsal is a `PartnerRehearsal` with its own id, and an apology
  records the misses it covers (`Moment.covers`) and marks each (`apologized`). `missesOwed` is the misses since the last
  apology, so one apology covers all of them and none comes again for them, however much of the classmate's history
  the save lets go. A new miss is owed a new apology.
- **A late apology says so:** four weeks or more after the last miss it's for, it says how long it's been, in the
  classmate's own manner.
- **Existing saves:** a save from before is marked once on opening (`school.missesMarked`, `src/engine/index.ts`):
  - each miss before an apology the save keeps is marked as covered by it;
  - where a classmate's 20 moments are full, a miss older than all of them is taken as covered, since its apology
    would otherwise come a year late, which is the defect itself;
  - a miss after the last apology stays owed.
  The schema is unchanged at 94: the fields are optional and the marker says the save was read.
- **Held by** `tests/continuity-incidents.test.ts` (six describes, the migration among them), each claim run with it
  taken out and failed.

### What A Screen Says First (Section 8)

Each editor put what matters, what to do, its cost and its deadline before the button that commits it. For example:
- **Money:** a card's rate, yearly fee and limit before Apply For This Card; what breaking a term deposit costs before
  Put It Away; the day money sent to another bank arrives before Move It; the day the bank closes an account left
  overdrawn, while there's time.
- **Papers:** File It says it pays what's owed from the bank, before it's pressed; a plan behind says what was missed
  beside Catch Up; Get on Your ID says its fee; the IRS's and Connecticut's next steps are said with about when.
- **School:** the term review says what fell short first, with its minimum; several Incompletes from one review are one
  notice; the first week goes below the work once it's done, so Due Soonest leads the Coursework tab.
- **Health:** an injury says what it keeps you from and the day it mends before the bill; a denied claim's notice says
  the bill's own figure.
- **The frame:** the stop says what to press, that the clock waits paused, and only then why there's no Skip It; How You
  Are says a hospital stay, the flu or an injury before the lines that say all's well.
- **The Profile:** the advice card says what the record shows of its recommendation now ("led for three weeks"), so a
  card that stands isn't the Sunday before's word for word.

Nothing that costs, closes or can't be undone is behind a disclosure. What's folded away is the working.

### The Tutorials, Followed (Section 9)

`tutorial/README.md` has the run in full. The guide's seventeen chapters and How This Works' 70 entries were followed
from their entry points at 1440 and 390, before and after, by four scripts:
- the chapters read word for word, and each step done where it says;
- every locked control, every Show Me Where, the ways back, and the clock while help is open;
- every entry read word for word with Show Everything open;
- every label a chapter or an entry names, found on a screen or in the code.

The after runs:
- 251 of 251 checks at 1440 and 254 of 254 at 390;
- 323 of 323 and 323 of 323;
- 70 of 70 entries word for word at each width;
- no label found nowhere.

The fixes include Finding Your Way's example (it pressed a breadcrumb Home never has) and Drama School's missing "how
a note is put right".

### Found In The Final Runs, And Put Right

The first runs on `35b47aab`, read and measured against the baseline, found three things the earlier measures hadn't:
- **Whole messages said again:** 39 of 3,090 against brief 16's 7. Most were one teacher's message, said again a year
  later from the same teacher's second-year course, further back than the memory reached.
- **A course's opening repeated within its last five:** 350 against 229. A course's last five went further back than
  its discipline's last eight, which the memory read.
- **Eight sentences opening on "Nothing"**, which the house standard's `tools/tics.mjs` budgets at none, and a note put
  right earlier the same day said by that day's date.

Put right in `feedback.ts`:
- **The memory:** `pick` reads everything the student was told (`heard.all`) and the course's own last five
  (`heard.own`), from the save's feedback as before. A whole message said before, by any course, and an opening of the
  course's own last five come after every true way that wasn't. Where every way has been, the least lately said comes
  back.
- **More ways:** a second way where a voice had one opening, for a second note, a third, a note given often and the same
  band twice running; a third way for strong despite the day.
- **The words:** "earlier today" for the same day, and the eight "Nothing" openers turned round.

The full gate had last run on brief 16's merge. Run again on `35b47aab`, it found plural-check failing on four
ordinals, and five other checks behind:
- the British "favour" twice;
- `DEVMAP.md` and `TRACEABILITY.md` behind the code;
- three audit rows citing test lines the money editor's edits had moved by one;
- the inventory's marks for the words above.

Each was put right before the tested commit.

## The Measures, Before And After

The same 24 students on the same seeds, before on `bbb82253`'s game (brief 16 as merged) and after on `ecd961cc`'s, each
measured by the tested commit's `tools/voices.ts --summarize`, so both sides are counted one way. `measures.md` is the
whole table, written by `measures.py` from `before/summary.json` and `after/summary.json`, with each measure's
definition from the summary itself.

**The students** (`runs/voices17.sh`):
- brief 16's seven and brief 17's four, on two seeds for fourteen months each: attentive, underprepared, improving,
  regressing, skilled, under pressure (the flu and an injury), practicing as the Profile suggests, tired, distant, and
  one who tries every approach;
- three of them for twenty-six months on a third seed;
- a new life's first four months.

**The window** is the same speaker's last five messages in one run: a course for a showing, a production's director, a
classmate, a notice's category, the Profile's card.

**The normalizing:** a sentence's opening and structure are compared with dates, figures, quotes and names taken out,
and its structure with ordinals and counts too.

| Measure | Before | After |
|---|---|---|
| **A showing’s feedback**, 3,090 messages a side | | |
| Said before word for word in the same run | 7 (0.2%) | 8 (0.3%) |
| First sentence said in one of the same course’s last five | 229 (7.4%) | 253 (8.2%) |
| Distinct first sentences | 448 | 421 |
| Body said in the course’s last five, of the messages with one | 565 of 3,090 (18.3%) | 312 of 2,761 (11.3%) |
| Sentence structures said in the course’s last five | 2,770 of 9,691 (28.6%) | 2,685 of 9,669 (27.8%) |
| Messages every sentence of which was said in the course’s last five | 202 (6.5%) | 296 (9.6%) |
| Showings with a sentence another course said | 2,999 (97.1%) | 2,665 (86.2%) |
| One course’s sentences another said, the mean share | 0.215 | 0.126 |
| **A director’s note**, 291 a side: word for word; first sentence in the last five | 17; 45 | 3; 30 |
| **A classmate’s moment**, 1,138 and 1,137: word for word; first sentence in the last five | 19; 192 | 0; 166 |
| **A notice**, 9,698 and 9,697: word for word; first sentence in the last five | 61; 179 | 45; 246 |
| **The Profile’s advice card**, 1,620 and 1,619: word for word | 778 (48.0%) | 144 (8.9%) |
| **Claims against the record**, wrong: a band’s move, a best, a first Strong, a run, a note’s count | 0 of 1,677 | 0 of 1,398 |
| A classmate’s “last time”, wrong | 7 of 139 | 0 of 142 |
| A partner’s miss and a request for help, counted wrong | 0 of 306 | 0 of 314 |
| A message read again after a save and a load, different | 0 of 40,663 | 0 of 40,666 |

**What's better.**
- Bodies repeated fell by almost half.
- Courses sound less alike: 97% of showings had a sentence another course said, 86% now.
- The directors and the class repeat themselves less, and the classmates never word for word.
- The advice card said the Sunday before's card word for word half the time. It now says what the record shows of its
  recommendation.
- No claim checked against the record is wrong. Brief 16's seven wrong "last time"s are gone.

**What isn't, and why.** Two measures are worse than brief 16's, and both are read in `justified.json` (written by
`justified.py`), which splits each repeat by why it might repeat:

| | Before | After |
|---|---|---|
| First sentence in the course’s last five | 229 | 253 |
| … on a note or limit the course gave in its last five | 175 (144 saying it’s the same) | 204 (162) |
| … a one-sentence acknowledgment of a Strong piece | 0 | 4 |
| … neither | 54 | 45 |
| Every sentence said in the course’s last five | 202 | 296 |
| … on a note or limit the course gave in its last five | 190 (159 saying it’s the same) | 251 (219) |
| … a one-sentence acknowledgment | 0 | 4 |
| … neither | 12 | 41 |

- **Most of the rise is the same limit holding piece after piece**, now said as the same thing. Brief 16 gave every
  such message a different step beyond after the finding ("Meanwhile, try this: …", the phrase the brief names), so its
  messages differed by their steps. Brief 17 says the finding and stops, and a sentence like "Same as on September 25,
  2026: your composure held back your consistency by 27 points out of 100." counts as said lately when the course said it
  last week. The brief asks for that: "If the same advice remains correct, acknowledge its continuity."
- **The rest that rose** (12 to 41) are mostly a limit said fresh after another note came between, and a note counted
  ("Rehearsal: 21 notes now") that the regex doesn't read as continuity.
- **Two places have too few ways** and are left for the owner (What Was Found And Not Changed, below): the patient
  voice says a choice note put right and slipped again two ways (30 of the 253), and the exacting voice counts a note
  given often one way ("Note 14 on rehearsal.", 14).
- **The notices' openings** rose by 67. Most are a partner who doesn't come, whose notice now says the count in a sentence
  of its own ("It’s the second time they haven’t come."), so every miss opens the same way. The notices are the same; their
  first sentences are counted differently.

**Changed in the measuring, said here.** Brief 16's `voices.ts` keyed a run's exact repeats by its scenario alone, so two
seeds of one scenario counted each other's feedback: 298 for the baseline, where within a run it's 7. It keys by the
scenario and the seed now. Every figure above, both sides, is the fixed tool's.

**The baseline's runs** (`before/`) were made on `bbb82253`'s game with `tools/voices.ts` as it stands at `ecd961cc`
(`before/exits.txt`: one tracked file changed, that one), so they record what brief 17's tool records: a production's
notes in the ledger, the moments' ids. The game's code is `bbb82253`'s. The first baseline, with brief 16's tool, is
`evidence/b17/before/`, which the coverage matrix's rows cite.

## Evidence That A Resolved Incident Doesn't Return

`incidents.py` reads every run in order, from what each student was told: each classmate's "… Didn’t Come" notices and
their apologies (`incidents.json`).

| | Before | After |
|---|---|---|
| Rehearsals a partner didn’t come to | 412 | 415 |
| Apologies | 230 | 224 |
| … with no miss since that classmate's last apology: an apology again for misses already apologized for | 9 | 0 |
| … 28 days or more after the last miss they're for | 101, none saying so | 103, every one saying how long it's been |
| … sooner | 120, none saying it was late | 121, none saying it was late |
| Classmates owed an apology when the run ended | 63 | 59 |

- **The nine repeats before:** Nadia's in the regressing student's run, September 30, 2027, for the two rehearsals she'd
  apologized for on October 8, 2026, which brief 16 found, and eight more like it. All nine are in four runs.
- **After,** none comes again. A new miss is owed a new apology, and gets one: the after side has 224 apologies, each
  for a miss since the classmate's last.
- **Brief 16's measure** (`voices.ts`, `apologiesBeyondMisses`) counted apologies against every miss before them, so an
  apology repeated for two misses still counted as two of two, and it found none of the nine. `incidents.py` counts
  them against the misses since the last apology.
- **The migration** of a save from before is held by `tests/continuity-incidents.test.ts` ("a save from before brief 17,
  opened"). The fifteen scenario saves written on `bbb82253` open on the tested build and are walked at both widths
  (On The Built App, below).

## The Same Game

`same-play.py` compares the 24 runs before and after event by event, every word aside (`same-play.json`). It compares
every showing's day, course, piece, band and kind of note; every director's note and classmate's moment by day and
speaker; the advice by day and what it recommends; every notice by day and title; each run's reloads and last day.

- **20 of the 24 runs are the same event for event**, and their notices the same days and titles.
- **The other 4 first differ on the day of an apology brief 16 repeated:**
  - attentive (26 months) on November 30, 2026;
  - distant (26 months) on October 8, 2027;
  - regressing (seed v16-0) on September 30, 2027;
  - regressing (seed v17-1) on August 30, 2027.

  Each of those class days brought another moment in its place: in the two long runs a study invitation, in seed
  v17-1's a request for help, and in seed v16-0's an apology another classmate owed for their own misses. Everything
  before it is the same in all four.
- **What the fix changed downstream:** a different moment moves a classmate's trust and the day's stress a little.
  - In the two long runs, 5 of the 179 showings after the day were judged a band apart, and 3 of 98.
  - In the two regressing runs, none of 11 and none of 20.
  - Moments after the day: 68 and 70, 43 and 41, 8 and 8, 10 and 9.
- **Unexplained:** 0. Renamed notice titles are read as the notices they are (`RENAMED` in the script, each with its
  editor). Incompletes from one review are one notice now, which changes how many notices a day holds in one run.

**The fix taken out, to show it's the only change to play** (`runs/fixoff17.sh`, `fixoff/students/`). The tested commit
was run again with one line put back as brief 16 had it (`fix-off.patch`): an apology is a candidate again while a
classmate's misses outnumber the apologies among their last 20 moments. Nothing else changed, and the words stayed brief
17's.
- **Against brief 16** (`same-play-words.json`): all 24 runs are the same event for event, with the same notices on the
  same days and the same reloads and last days. None of the words brief 17 changed moved any play.
- **Against the tested commit** (`same-play-fix.json`): the same four runs differ, from the same four days. The fix is
  the whole of the difference.
- **The other lanes:** the same was done for the lanes whose games have a class in them (`runs/fixoff-lanes17.sh`): the
  journeys, the lives, the workloads and plans, and the advice (The Final Runs, below).

## Before And After, From Play

`examples.md` (written by `examples.py` from `before/` and `after/`, never typed) sets 47 events side by side, each one
day of one student before and after, found in the runs by what the before side said:
- the brief's own examples ("the note is taken at 75%", "A fourth time for the note on …", "At Unready, this is the
  part that fell shortest", "Meanwhile, try this");
- a card label as a prose subject, a part named twice, and Strong despite a day that cost a point;
- the class speaking, and the directors.

For example, from the approaches student's run on seed v16-0, January 13, 2027, Acting I:
- **Before:** "You came in prepared, but your focus held back your execution by 11 points out of 100. Classes build it,
  and so does Circles Of Attention, in the Practice column on your Player Profile. Meanwhile, try this: Go back to the
  words. …"
- **After:** "You were prepared. Your focus held back your execution by 11 points out of 100. Classes build it, and so
  does Circles Of Attention, in the Practice column on your Player Profile."

**Consecutive transcripts** (`transcripts.md`, written by `transcripts.py` from `after/`, never typed):
- the first ten showings of one course in each of the five voices, for two students;
- a production's director through its run;
- a classmate across a run: their requests, their misses, their apology for four misses at once, and the misses after
  it, still owed.

`after/transcript.md` is everything every student was told, in order, and `before/transcript.md` the same for the
baseline.

## On The Built App, Desktop And Mobile

`runs/walk17.sh` ran on a clone at `ecd961cc`, on its own build, served by vite itself (`final-walk/exits.txt`, every step
exit 0 but the render check's, below). It opened the fifteen scenario saves written on `bbb82253` (`saves-before/` in the
session, the before walk's), so both walks read the same lives.

- **Every screen's text** at 1440 and 390 (`tools/text-walk.mjs`, `final-walk/walk-1440/`, `walk-390/`), set beside the
  before walk by `walk-compare.py` (`walk-compare.json`). At each width:
  - 360 screens on both sides, 259 of them saying something different;
  - 629 lines only before and 668 only after, of about 37,800;
  - lines of four sentences or more 277 before, 253 after.
- **No control was renamed.** The 12 screens whose buttons differ are How You Are's line, which names an injury and the
  day it mends where it said "Rested, steady and ready for a real day.", and a withdrawn student's Classes and Terms
  And Award, which no longer list courses and terms after the School ended.
- **The rendered text** (`tools/text-render-check.mjs`, `final-walk/render-*.json`): one fault at each width, the same
  as before: "The note on On Its Feet is still open after six notes…", a doubled word, on the lien save's Coursework tab.
  It's feedback delivered on `bbb82253` and kept in the save as delivered, which brief 17 asks for: delivered feedback
  is never rerolled. The tested commit says no such sentence (the runs, above).
- **The saves the tested commit wrote** (`final-walk-new/`): lane A's fifteen scenario saves, written on `ecd961cc`
  (`saves-exits.txt`, 15 of 15 exit 0), walked the same way at both widths. Their feedback is the tested commit's own,
  and the rendered text has no fault: 0 of 68,846 strings at 1440, and 0 at 390. Their folded details: 184 on 30
  screens at each width, 0 failures.
- **Every folded detail, from the keyboard** (`tools/details-check.mjs`, `final-walk/details/`): on each save's
  Coursework tab and Player Profile, 184 disclosures on 30 screens at each width. Every one has words to name it, is
  reached by Tab, opens on Enter and closes on Enter again. Nothing runs past the right edge. 0 failures at 1440 and 0 at
  390.
- **Desktop and mobile examples** (`shots/`): the Player Profile, with What To Work On Next shut and with Why This
  Recommendation open, and the Coursework tab of a second-year student (Due Soonest first, the first week below the work)
  and of a rehearsal save, each at 1440 and 390; and `fresh-*`, the same two Coursework tabs on the saves the tested
  commit wrote, with its feedback, Your Notes and Your Class.

**Read by eye** on the screenshots and walks:
- the advice card reads as a short first view, with its working below the disclosure;
- a phone-width Coursework tab leads with what's due, its cost shown today, and what finishes each part;
- the Profile's Dispositions line is still one list of seven clauses, dense at 390, and is listed for the owner below;
- Your Notes keeps "Taken" as a note's status, the actor's word for acting on a note; what puts a note right is said in
  the feedback's own words ("A piece shown with it at 75% or more puts the note right."), where brief 16 said "the note
  is taken at 75%".

## The Final Runs

`runs/README.md` has each output, its command and its result, and `final/README.md` the judge's. Every one ran in
clones of `ecd961cc`, but the advice's last play, in clean clones of `a683f9ea`, whose game is `ecd961cc`'s. Each
step's exit is written to `runs/exits-<lane>.txt`, every one 0 but banking's two (below).

- **The judge** (`final/`): all 37 JSON and Markdown outputs are brief 16's byte for byte, so the 36 figures are, and
  RULESET stays evaluation-11.
- **The built app,** on the saves the tested commit wrote:
  - the acceptance walk 77 of 77 at each width, with no errors and no overflows;
  - brief 13's playthroughs at each width: normal 14 of 14, setback 9 of 9, specialist 11 of 11 (`interface-final/`);
  - brief 14's journeys (`journeys14-final/`): document 8 of 8 and health 10 of 10. Banking is 9 of 10 at each width:
    its step 8 is brief 14's `journeys-3`, the engine's week planning, left for the owner, and it fails as brief 16's did.
- **The long runs:** 24 lives, 20 graduated and the autopilot control's 4 dismissed, as in brief 16. With the fix, 9
  lives differ, and none ended otherwise or on another day. Three workloads each have one fewer piece Unready in their
  fourth term. One plan masters slapstick on December 29, 2030, a day after brief 16's December 28, and with the fix
  taken out it's the 28th again.
- **The advice:** brief 16's in every number, with the fix and without it; F2-A 40 of 40.
- **The journeys** (`journeys-final/`): brief 13's 25, played to the end, all ten checks passed on each. Each ends as
  brief 16's but F2: its fourth term review, on December 8, 2028, is good, where brief 16's was concern, with 22 of its
  45 pieces Unready where brief 16 had 24. With the fix taken out it's concern again, at 24.

**The words and the fix, held apart** (`numbers-same.py`, `numbers-same.json`):
- **Brief 16's runs against the fix taken out:** every number the same, the judge's 35 files and the runs' 17 identical, the
  advice's and the journeys' differing only in each run's own record, the notices' counts and the counts of words. Every
  day and title brief 16's journeys had is kept; what's had more is notices that now differ from the one before, and
  what's had fewer is Incompletes, now one notice a review. None of the words brief 17 changed moved any play.
- **The fix taken out against the tested commit:** 10 of the runs' 17 files differ (the lives, five plans, variety and three
  workloads), none of the advice's, and 20 of the 25 journeys. Each journey first differs on a classmate's day, with
  everything before it the same. The fix is the whole of the difference.

**What the runs found in the tools, not the game** (`runs/README.md`, Found In The Runs). Each tool was put right and
its lanes played again on the tested commit's game:
- **The journeys' check 8** failed F1 in its fourth term: "the warning counted 13, the review 12". A piece shown Unready
  before the warning was revised to Working after it, and the review reads a revision's band. Both were true when said.
  The check now allows the warning to exceed the review by such pieces, and only by them.
- **The advice harness's S3** read 1,836 Profile cards as stale for their words alone, because the profile editor
  names an aim that took over ("Adaptability is still at 34"). It reads that too now.
- **The journeys' recheck,** run for the corrected check 8, wrote each journey's first three parts again without what
  they'd counted at their end. It leaves them now, and the journeys were played again from the start, so every part's
  output is the one its play wrote.
- **The advice's second play** recorded a tree that wasn't clean, since the harness fix wasn't yet committed, and the
  advice's rows ask for a clean one. Its lanes were played a third time from `a683f9ea`, which holds the fix.

## The Gate

`npm run gate` ran in a clean clone of `3fe960df`, the commit that holds these records (`final-checks/gate17.sh`), its
exit written to a file, never read through a pipe (`runs/gate.txt`, `final-checks/`):
- **exit 0**: 405 of 405 test files and 4,867 of 4,867 tests passed, none skipped;
- every one of the twenty-one checks holding, the coverage matrix's among them ("265 surfaces; 4230 of 4230 sources
  claimed; 0 problems"), and the completion matrix last;
- the build exit 0, in the same clone.

Between the tested commit and `3fe960df`, nothing in `src/`, `base44/` or the package files changed. After it, only
documents changed: the gate's figures folded in, which moved INT-gate's row and the matrix's line from 611 to 612.
Until then this said the gate hadn't run.

## Tests

Brief 17 added seven test files and changed 87. The full suite ran on the working tree before the tested commit: 4,864
of 4,866 tests passed in 405 files. The 2 that failed were `audit-pipeline`'s, which found the audit edited by hand; it
was regenerated through its pipeline and that file's 4 tests passed. Brief 16's gate ran 398 files and 4,781 tests;
brief 17's ran 405 and 4,867, every one passing (The Gate, above).

New:
- `feedback-voices.test.ts` (12 tests): every situation in every voice, true to its facts; no two voices sharing a
  message or a first sentence; a day once; the memory; earlier today; the directors.
- `continuity-incidents.test.ts` (6): the apology kept on its misses, the late apology, the counts kept on the
  classmate, each classmate's way, the migration, and the moments list untouched.
- `editorial17-coordinator.test.ts` (1), `editorial17-money.test.ts` (18), `editorial17-papers.test.ts` (5),
  `editorial17-school.test.ts` (13), `language-care17.test.ts` (4): the editors' claims.

Changed after the final runs were read: `decisions-advice.test.ts` gained a guard for the advice harness's S3, which
reads a standing that names its input at the level it says and still finds one that says another. Run with S3's new
reading taken out, it fails.

**Mutations.**
- The coordinator's claims, run with each taken out: 13 of 13 fail a test (`coordinator/mutations.txt`, by
  `coordinator/mutate17.py`).
- The feedback's earlier mutations are in `coordinator/mutations-earlier.txt`. Its first, a first Strong given a step,
  failed no test: the guard it mutated was redundant, settled by an earlier one, and was removed. Its "a day said
  twice" also failed none, so cases were added until it did.
- The editors' are in their folders (`health/mutations.txt`, `tutorial/mutations.txt`), and the money and papers
  editors' in their commits.

## What Was Found And Not Changed (For The Owner)

These are mechanics or rules, and this was a writing pass (the brief: "Do not introduce a new factual interpretation
merely to improve the sentence"). Each editor's report has its detail.
- **Money:**
  - A US card's missed-payment notices count the payments missed, while the mechanics run a cycle off Reg Z's sixty
    days and the FFIEC's 180.
  - A card's first year's yearly fee can be skipped.
  - No notice warns before an account left overdrawn is closed, beyond the day said while there's time.
- **Papers:**
  - Catch Up is offered for a plan put in default by new tax, where CP523 asks for a revision.
  - California counts a new balance as a missed payment, and tells it as the bank failing to pay.
  - A 1040-NR return lists an interest line.
  - Brief 16's two reports stand: the short-term plan's penalty rate, and the missed state plan's figures.
- **Health:**
  - The flu holds back more than the Profile says.
  - No notice says an injury has mended or the flu has passed.
  - The fitness look's words below 35 don't match what the game does there.
- **The frame and the tutorial:**
  - Skip It and Call It Off do different things to a jump.
  - Sleep at 7:15 suggests 8 hours.
  - Tomorrow Morning pressed at 2 AM skips to the next day.
  - The Sleep dialog doesn't hold the clock.
- **School:** an understudy "in the company" goes on in no named part.
- **The Profile:**
  - The fatigue label comes from one piece.
  - The milestone detail stores band keys.
  - Fine's summary is always "Sources And Estimates".
  - Identity And Background's Dispositions line is one sentence of seven clauses, each a trait, its figure and what it
    moves, dense at 390. It was read and kept by the profile editor, since each clause says what the game does with the
    trait; splitting it is a layout change, left for the owner.
- **The feedback's words:**
  - the patient voice says a choice note put right and slipped again two ways, which repeat within a course's last five
    (30 of 253);
  - the exacting voice counts a note given often one way ("Note 14 on rehearsal.", 14 of 253).
  More ways would cut those repeats; they're true as they are, and changing the engine after the tested commit would
  have meant every final run again.
- **The coordinator:** an apology can come months after the miss. Its timing is unchanged, since the apology's chance is
  the classmate's; its words now say how long it's been.
- **The gazetteer:** ASCII names (Aland Islands, Curacao, Riels).
- **The glossary:** rows suggested for blocking, understudy and off book.

## What's Automated, What's Read, What's Judged

- **Automated:** the tests hold each claim, and the gate holds the rest. The runs measure repetition and check claims
  against the record. The walks read the built app's screens and open its details from the keyboard. Automated
  interface tests are not human usability approval.
- **Read in order, by the editors and the coordinator:** every surface in the matrix, where it's met; the transcripts
  of the baseline and the after-runs; the examples. Reading in order found the defects listed under What Changed, which
  no measure had.
- **Judged, not measured:** that the five voices read as five teachers, that a classmate reads as a person, and that a
  first view is easy to follow. Those are the coordinator's and the editors' judgment. The measures say what repeats
  less and what is still said the same way. They don't say the writing is good. Nothing here claims perfect writing, no
  bugs, or that the game is never repetitive. `PLAYTEST.md` is a thirty-minute route for the owner to judge it.

## How It Ended

- **The tested commit** is `ecd961cc`: its game is what every final run played, the advice's last play on `a683f9ea`,
  which changed nothing in `src/`. The gate's commit and result are under The Gate, above.
- **Merged:** no. Nothing of brief 17 is in `main`, which is at `bbb82253`, and no pull request is open for it (read
  from GitHub on 2026-10-20). Merging is the owner's.
- **Deployed:** no. Base44 deployment waits for the owner and the gate (rule 14).
- **The matrix:** **Completion, by the matrix:** 612 of 636 rows in scope Implemented And Verified (96.2%); 20 Implemented, Verification Incomplete, 0 Partially Implemented, 0 Not Implemented, 0 Blocked Externally, 4 Decision Required, 40 Explicitly Deferred. The same 612 rows as brief 16's close.
- **What's left** is under What Was Found And Not Changed, above, and in the handoff's section 4.
- **To judge it by playing:** `PLAYTEST.md`, a thirty-minute route: the first week, the teachers each in their own
  voice, the class and an apology for its misses, what a screen says first, a save and a load, and a save from before.
