# Brief 19's Commands, Read Against The Standard, 2026-10-21

An independent audit of the 22 commands brief 19 added, which the completion matrix called Implemented, Verification
Incomplete ("No audit row has read it against the standard"). They were read against `7bbab80f`, with the core, the
showcase, the agent, the pay and the work loop merged and joined, by a reader who wrote none of the code and none of its
tests. The standard is `docs/GAMEPLAY-COVERAGE.md`'s, which `tools/coverage.mjs` writes and holds. Branch `b19-audit`,
commits `74e7c17e` (the mutations), `2d999179` (the rows) and `abd1aef7` (a correction), merged into the working branch.
(Its auditor couldn't write this file from its own clone; the coordinator committed it from the audit's report,
unchanged in substance.) Nothing in `src/` or `tests/` changed.

Read again the same day against `a483247d`, once V1's journeys had landed (The Second Reading, below): five of the nine
rows the first reading left partial were verified on the played journeys, and four stayed partial, two for the gaps their
first reviews named, only partly closed, and two for readers that reading found no test reading. Read a third time
against `c01e06f4`, once tests had been written for those four (The Third Reading, below): the four are verified, and
`pro.cut_reel`, verified by the first reading, was partial for a reader no test read. Read a fourth time against
`9c3e6fa5` (The Fourth Reading, below): `pro.cut_reel` is verified, so all 22 are. The sections after the fourth are the
earlier readings', kept as they were but for the words a later one falsified.

## The Fourth Reading, Against `9c3e6fa5`

The coordinator merged the third reading (`ded6f820`), and `9c3e6fa5` answered what it found unread. It changed one
thing under `src/`, Equity's employment check (`workingNow`, `proagent.ts:689`), and added tests. The clone was brought
to `9c3e6fa5` by a merge (it fast-forwarded). The third round's survivors were run again on the new tests, and the check
was put back as it was (`mutations.txt`, Round Four; `mutations4-list.json`, `mutations4.json`). All four were killed.

- **`pro.cut_reel`: verified.** A year after a pass, the same reel is refused as nothing new. A reel cut through the
  command from the same brief, prepared and taped again through its commands, comes out a band higher and is the only
  thing new, and the send is no longer refused (`journey-agent`). The test starts from that file's introduction written
  by hand, which only sets the reader up, as for the other rows. R8 run again (S1) was killed.
- **`pro.ask_referral`: verified, its recorded refusals now read.** It's refused during the pass's year and again while
  the next approach is under way, each in its words. R10 run again (S3) was killed.
- **`pro.end_agreement`: verified, its recorded refusal now read.** A twin of life A, from its played save between her two
  shoot days, is refused Equity's ending in its words through the command, and the agreement stays in force; once the
  job is finished, the 90 days' words come instead. R9 run again (S2) and the check as it was (S4) were each killed.

**The employment check, against S27.** It's right. S27 says "You may not terminate if you are currently employed", and
an actor is employed under the contract between a job's work days as on them. The check had read only a work day's own
hours. The clock passes a work day whole once the player goes at its stop, and doesn't stop inside one, so no command was
ever sent inside those hours and no player could meet the refusal. It holds now from the first work day until the
engagement is finished or canceled (`finished`). That's an assumption, said at the check: the employment begins on the
first work day, not at the booking, which for a stage run is its first rehearsal. One thing near it isn't modelled. S29
also extends the 90 days while the actor is employed, and the count doesn't: it runs from the last offer whatever
employment followed (`endRefusal`). So once a long run ends, an actor may end the agreement sooner than S29 allows. That
is recorded in the row and not fixed.

**Anything else that reads a work day's own hours.** Nothing a player can't reach. Every other reader of a work day's
span is read by the clock at an item's own time, which the clock does run inside the span:
- the School's `present()` through `awayAt`, at a class or a call;
- an audition missed for a shoot day (`workDayAt`, at the audition);
- the School's excused days (`school.ts`, at the item).

The rest read the days ahead (`bookedClash`, `availabilityOf`, `sagWorkRefusal`) or count them (`coveredDays`,
`engagementDaysIn`). No command's refusal reads `present()`, `awayAt` or `workDayAt` at its own moment.

**Corrected besides.** The rows' citations of `proagent.ts` were carried to `9c3e6fa5` (26 of 170 cited lines had moved
six, below the check's longer comment), and `pro.end_agreement`'s Reads says the check as it now stands. The capabilities'
limits and this reader's readings say the refusals are read and `pro.cut_reel` is verified.

**Tallies.**

- Coverage: 321 verified and 1 partial before; 322 verified and 0 partial after. Unresolved 12, deferred 16, legacy 3
  and informational 8, unchanged.
- The completion matrix: 548 of 658 (83.2%), 106 Implemented, Verification Incomplete before; 549 of 658 (83.4%), 105
  after.
- The registry: 69 capabilities, Partial 11, Implemented 36, Verified 3, unchanged.

**Defects:** none open in the game's code. The employment check was the third reading's finding, fixed in `9c3e6fa5` by
the coordinator.

**Checks run for it** (each exit read from a file):

- The twelve test files the rows cite, at `9c3e6fa5` with one worker: 157 of 157 passed in 346 seconds, exit 0.
- `tests/audit-pipeline.test.ts`, `tests/evidence-g34-ui.test.ts`, `tests/evidence2-b13.test.ts`: 26 of 26, exit 0.
- The gate's chain without the suite (21 checks), on the tree as committed: exit 0. No TypeScript changed here.

## The Third Reading, Against `c01e06f4`

The coordinator merged the second reading (`3ee267a1`), and `c01e06f4` added tests for what it found missing. Nothing
under `src/` changed. The clone was brought to `c01e06f4` by a merge (it fast-forwarded). The same reader read each new
test, assertion by assertion, and ran the second round's survivors again on them rather than trusting the record of
them (`../integration/mutations.txt`, I16 to I21). Then, as the second reading had recommended, the thirteen rows the
first reading verified were read again through their Downstream, reader by reader, with a mutation wherever reading
found no test (`mutations.txt`, Round Three; `mutations3-list.json`, `mutations3.json`). Seven of ten were killed.

| Command | At `a483247d` | At `c01e06f4` | What Holds It Now, Or What's Still Missing | Mutations |
|---|---|---|---|---|
| `pro.ask_referral` | partial | verified | A year after a pass, the same record is refused as nothing new; a referral asked through the command from a job his office had already considered is the one thing new, and the next approach is taken (`journey-agent`). Recorded, not deciding: its refusals while an approach is under way or held are read by no test | R2 (Q15 again) killed; R10 survived |
| `pro.supply_material` | partial | verified | His office asks on the clock for new headshots and an up-to-date résumé; the send is refused in each one's words while it stands, then taken once both are remade through their commands (`journey-agent`) | R3, R4 (Q16, Q17 again) killed |
| `pro.end_agreement` | partial | verified | A twin of life A, from its played save the day the shoot wrapped, ends the agreement through the command before the pay, the notice saying the commission is still owed, and is played on to the pay: $280.40 through the trust account, as in the life that kept him. Recorded, not deciding: Equity's refusal while covered work goes on is read by no test | R5, R6 killed; R9 survived |
| `pro.join_sag` | partial | verified | Life A's résumé, made after she joined, reads SAG-AFTRA and not SAG-AFTRA Eligible | R1 (Q14 again) killed |
| `pro.cut_reel` | verified | partial | His office's Your Work reads the reel's best band (R7 killed in both lives and two screen tests). Missing: a better reel counted as something new after a decision, which the pass's notice promises, is read by no test | R7 killed; R8 survived |

**What the new tests set by hand, and why it doesn't decide.** Each `journey-agent` test starts from that file's
introduction written by hand: a referral from a finished Off-Broadway job. These rows' journeys are played elsewhere
(`journey-career-older` asks for a referral from a played job; life B plays a request supplied), so the stand-in only
sets a reader up, as the second reading counted it for `pro.send_materials`' pass and no answer. The second job finished
by hand is The Winter Ledger, a run V11's journey books from an open call. The headshots dated three years back are
time, which only waiting reaches; this audit counts that as setup, as it counts Commencement brought forward. So the
request for headshots is the engine's own, made on the clock from that record, though no played life keeps its headshots
two years, and the row says so. The ending's twin opens a played save and plays on, and nothing in it is set by hand.

**Two refusals recorded, not deciding.** R9 and R10 took out refusals the rows' claims name, and every test passed. This
audit decides a row on what reads the command's change, as the first reading did, and a refusal is what the command
reads. So each is a named gap in a verified row, as an unpressed button is, and not a reason for partial. The second
reading kept `pro.supply_material` partial for refusals because its first review had named them as its gap. If the owner
wants every refusal a claim names read by a test, these two rows go back to partial, and the thirteen should be swept for
refusals too, which this reading didn't do.

**The thirteen, reader by reader.** Twelve hold.
- `school.choose_showcase`: the rehearsal calls move both scenes' preparation, each day judges each chosen scene into
  the records, the course is settled and the degree reads it, and the follow-up is put on the clock.
- `pro.set_name`: the profile reads the name after the command, and a résumé is made under it and reads behind on it (M1).
- `pro.headshots` and `pro.update_resume`: `materialsCheck`'s refusals of the check and of a submission, his holding a
  submission while headshots are missing (J3), and now a request for each.
- `pro.agent_notice` and `pro.agent_check`: M5 and M6; the check's words are read in its history.
- `pro.submit`, `pro.tape_audition` and `pro.move_audition`: the reply, the rounds and casting, played. A self-tape not in
  by its time lapses (`pro-work`).
- `pro.accept_offer`: the work days, the pay, the School's `present()` and the warning.
- `pro.request_outside_work`: the dean approves and refuses, each said.
- `pro.decline_offer` holds with a note. Equity's 90 days count an offer through him that was declined (`lastOffer`), and
  that's read only on an offer declined by hand (`journey-agent`), in the shape the command leaves. No test declines an
  offer through him with the command.

`pro.cut_reel` doesn't hold: `caseKeys` counts a better reel as something new (`proagent.ts:466`), and nothing reads it.
Its review is new, against `c01e06f4`, and it's partial.

**Tallies.**

- Coverage: 318 verified and 4 partial before; 321 verified and 1 partial after. Unresolved 12, deferred 16, legacy 3
  and informational 8, unchanged.
- The completion matrix: 545 of 658 (82.8%), 109 Implemented, Verification Incomplete before; 548 of 658 (83.2%), 106
  after.
- The registry: 69 capabilities, Partial 11, Implemented 36, Verified 3, unchanged. `career-representation` and
  `career-pay` are verified in this reading and stay Implemented in the registry for the reason `school-showcase` does.
  `career-portfolio` names `pro.cut_reel` partial.

**Defects:** none in the game's code.

**Checks run for it** (each exit read from a file):

- The twelve test files the rows cite, at `c01e06f4` with one worker: 155 of 155 passed in 348 seconds, exit 0.
- `tests/audit-pipeline.test.ts`, `tests/evidence-g34-ui.test.ts`, `tests/evidence2-b13.test.ts`: 26 of 26, exit 0.
- The gate's chain without the suite (21 checks), on the tree as committed: exit 0. No TypeScript changed.

## The Second Reading, Against `a483247d`

As it stood at `a483247d`; the third reading, above, settled the four rows it left partial.

V1's journeys landed on the working branch (`074f079d`, the playthroughs' merge; `a483247d`, the defects they recorded,
settled), and the same reader read the nine rows the first reading had left partial again the same day, against the tests
the playthroughs' table names (`../playthroughs/REPORT.md`, The Audit's Partial Rows) and anything else that now holds
them. The clone's branch, `b19-audit`, was brought to `a483247d` by a merge (it fast-forwarded). Nothing in `src/` or
`tests/` changed.

**What the journeys set by hand, read first.** `tests/journey-career.test.ts` plays two new lives, Ada Cole at Yale,
from the first morning of her last term, Monday 8 January 2029, on into the career. The two and a half years before that
morning are TEST SETUP: played by the clock six hours at a time, the body kept fed and rested and the coursework prepared
each midnight, as `tests/pro-showcase.test.ts` makes its final term. From that morning nothing is set by hand. Every
command goes in as the player sends it (`tools/career-player.ts`'s `press`, which is `execute`, as the buttons are),
every commitment is answered at its stop (`answerStop`), and each transition is saved and opened again. The seeds are
the first of forty whose played life reaches what the tests read: `v1-12`, a SAG-AFTRA role booked and paid within the
year; `v1-5`, a request for more, a meeting and an offer declined. That's a seed found over a list, as several verified
rows' journeys have. `tests/journey-career-older.test.ts` opens journey J01's save from `8283f80c`, a build before brief
19, which J01 played through public commands; from its opening every step is played. None of them writes a career's
state by hand, so each is a played journey under the standard. Where a row's gap was that every journey started from a
stand-in, these close it.

**Mutations, round two** (`mutations.txt`, Round Two; `mutations2-list.json`, `mutations2.json`): the first round's
mutations of the nine rows run again on the played journeys, one more each for the send, the referral's band and the
ending, and four of readers this reading found no test reading. Each was run in a copy of the tree, never the working
tree, with one worker. Fifteen of nineteen were killed: the ten the first round ran again (Q1, Q4 to Q7, Q9 to Q13), the
three new ones (Q2, Q3, Q8), and P1 and P2 scoped to their twins (Q10b, Q11b). The four of readers no test reads (Q14 to
Q17) survived.

| Command | At `7bbab80f` | At `a483247d` | What Holds It Now, Or What's Still Missing | Mutations |
|---|---|---|---|---|
| `pro.ask_referral` | partial | partial | Its named gap closed: asked of a student film the work loop booked and finished (Paper Moons, judged Strong), the route, the band and the director's notice read, her materials sent through it, his office's answer on the clock (`journey-career-older`). Still missing: `caseKeys`' count of a referral as something new after a decision, which the pass's notice promises, is read by no test | Q1, Q2 killed; Q15 survived |
| `pro.send_materials` | partial | verified | From the School's own follow-up in two lives, and on a played referral; his office's answer on the clock each time: a meeting, a request for a résumé, a request for a reel | Q3 killed |
| `pro.supply_material` | partial | partial | Closed in part: a request for a résumé played from the follow-up, made, sent through the command and answered with a meeting. Still missing: its refusals for a résumé still behind and for headshots older than the request are read by no test, the played résumé being made before it's sent, and a request for headshots is never played | Q4 killed; Q16, Q17 survived |
| `pro.ask_to_move` | partial | verified | The meeting the follow-up brought, moved a week at its stop as the top bar answers it, and kept | Q5 killed |
| `pro.accept_agreement` | partial | verified | Accepted through the command, then his breakdowns, his submission with her portfolio, the offer at scale plus ten, the booking under the agreement and the pay through the trust account less $280.40: both its gaps closed | Q6 killed |
| `pro.decline_agreement` | partial | verified | The offer that came of a request supplied and a meeting kept, declined and held 182 days | Q7 killed |
| `pro.end_agreement` | partial | partial | Closed in part: a played agreement ended by agreement through the command, his breakdowns stopping. Still missing: continuing commission after this command. The played ending left nothing still to pay, and the pay's continuing commission is checked only on an agreement ended by hand | Q8 killed |
| `pro.join_sag` | partial | partial | Both its named gaps closed: eligible from a part booked through him, joined, the working dues out of that job's pay and the base dues taken in November. Still missing: the résumé's SAG-AFTRA line for a member is read by no test | Q9, Q12, Q13 killed; Q14 survived |
| `pro.prepare` | partial | verified | Twins from the same saves: the same self-tape prepared against cold, the same booked part prepared against not at all, each higher and a band higher | Q11, Q10b, Q11b killed; Q10 killed through life A's own play |

**Five moved, four stayed.** Each row that moved has a new review in `added-rows.json` against `a483247d`, its `issue`
saying in the past tense why it was partial at `7bbab80f` and what holds it now. Each row that stayed partial says what
closed and exactly what's still missing. The journeys' evidence is in each review, with what they set by hand.

**Two gaps the first reading missed.** This reading went down each row's Downstream reader by reader, and two readers no
test reads came up. `caseKeys` counts a referral as something new for an approach after a decision (`proagent.ts:467`),
which the notice of a pass promises the player; taken out (Q15), every test of the agent and both journeys passed. The
résumé lists SAG-AFTRA for a member (`resumeNow`, `pro.ts:776`), which makes the résumé before it behind; taken out (Q14),
every test of the portfolio, the pay and both lives passed. Each row stays partial for it, though the gap its first
review named is closed. The thirteen rows verified at `7bbab80f` weren't read again this way. Reading them so is
recommended before any of the five capabilities is called Verified.

**Q10, read exactly.** P1 run again on the whole file failed life A's own play before the twin could run: an audition
read with no preparation turned the life off the path its seed was found for, which is how P1 failed at `7bbab80f`. So P1
and P2 were run again scoped to their twins (`mutate-scoped.cjs`: the reader reads no preparation only while a flag the
twin sets in the copy's test is up). Q10b failed the self-tape's twin on its own expectation (the prepared tape 22.5,
not over the cold one's 22.5 plus ten), and Q11b the part's twin (23.2, not over 23.3 plus five).

**Corrected besides.** The 22 rows' source citations were carried from `7bbab80f` to `a483247d` (127 of the 170 cited
lines had moved; each one's text was found again at the new line). `pro.supply_material`'s missed request is said as the
code files it since `a483247d` (`request-missed`, counted once). The notices' titles are said as the app walk left them
(his name or his agency's, `3f7e51eb`). `pro.cut_reel` stays verified, and its row said no test cut a reel from the filmed
monologues or sent a reel with a submission; the journeys do both, so it says so in the past tense, its footage gap kept.
The five capabilities' limits and this reader's readings of them were read again against `a483247d`. `career-work` is
verified in this reading and stays Implemented in the registry for the reason `school-showcase` does.

**Tallies.**

- Coverage (`docs/GAMEPLAY-COVERAGE.md`, 361 items): 313 verified and 9 partial before; 318 verified and 4 partial
  after. Unresolved 12, deferred 16, legacy 3 and informational 8, unchanged.
- The completion matrix: 540 of 658 rows in scope Implemented And Verified (82.0%), 114 Implemented, Verification
  Incomplete before; 545 of 658 (82.8%), 109 after.
- The registry: 69 capabilities, Partial 11, Implemented 36, Verified 3, unchanged; the two registries agree on 180
  commands.

**Defects:** none in the game's code. One record is the coordinator's to settle. The handoff's Still To Do lists the
playthroughs V1 to V18 as still to do; V1 has landed, and this reading changed only the words there about its own rows.

**Checks run for it** (each exit read from a file):

- The twelve test files the rows cite, at `a483247d` with one worker: 152 of 152 passed in 359 seconds, exit 0
  (`journey-career`, `journey-career-older`, `journey-agent`, `pro-agent`, `pro-representation-screen`, `pro-work`,
  `pro-opportunities-screen`, `propay`, `propay-screen`, `pro-core`, `pro-screen`, `pro-showcase`).
- `tests/audit-pipeline.test.ts`, `tests/evidence-g34-ui.test.ts`, `tests/evidence2-b13.test.ts`: 26 of 26, exit 0.
- The gate's chain without the suite (21 checks), on the tree as committed: exit 0. No TypeScript changed, so `tsc` wasn't
  run again.

## What Was Done

- **Read:** each command's handler, its refusal, what it changes, who reads the change, what persists and how the player
  is told (`src/engine/systems/pro.ts`, `proagent.ts`, `projobs.ts`, `propay.ts`, `proshowcase.ts`, the Career and
  School panes), and every test that issues it, assertion by assertion, across the ten career test files.
- **Ran first:** the ten files at `7bbab80f`, before anything changed: 125 tests passed in 63 seconds.
- **Mutated:** 25 mutations, in a copy of the tree, never the working tree (`mutations.txt`, the runner `mutate.cjs`, the
  list `mutations-list.json`, the results `mutations.json`). M1 to M21 mutate what each row says reads its command's
  change, or the change itself: all 21 killed. P1 to P4 mutate a reader the reading found unchecked, to show the gap
  rather than assert it: P2, P3 and P4 survived every test; P1 was killed only through outcomes chosen over lists of seeds
  (below).
- **Rows written:** one per command, added through the pipeline as brief 09's were
  (`docs/verification/pipeline/inputs/added-rows.json`, then its README's regeneration), each with its review of
  2026-10-21: its claim; its evidence by kind (whether each test reaches the action, checks the consequence and expects
  independently, and what it sets by hand); the UI evidence; the verdict; and its gaps. Before the rows went in, the
  pipeline reproduced the committed audit with no difference.
- **Capabilities:** the five brought into line in `docs/capabilities.json`, each Implemented with its verified layer
  Partial, its limits saying what's driven and checked and what isn't, naming every partial row with that word, and four
  stale claims corrected in the past tense. In `docs/verification/review-2026-10-13/capabilities.json` this reading
  replaced the builders', each builder's kept whole as `builder`.
- **Corrected after:** `career-pay`'s limits had said the Hudson run's weeks were each "paid once"; that journey checks
  nine payments received, and that none is paid twice is held by the pay's own GUARD, on an engagement written by hand.
  The words now say which test holds which.
- **Rebuilt:** `docs/GAMEPLAY-COVERAGE.md`, `docs/CAPABILITIES.md`, the completion matrix and the handoff's completion
  line.

## Where The Rows Went, And Why

In the School's area, one block after its last command. The audit's areas are a fixed list in five scripts, not read
from the folder (`tools/coverage.mjs:101` `AREAS`; `tools/capabilities.mjs:83`;
`docs/verification/pipeline/merge-review.cjs:67`; `remaining-fold.cjs:64`; `tools/completion-matrix.mjs:96`). A
`career.json` would be counted by the completion matrix, which reads every file, and held by none of coverage's checks:
rows counted and never read. The School's area is where the actor's work and its record already are (the practice
briefs and self-tapes, the workbook, the work record and journey, the credits), which the career continues and reads.
**Recommended:** a sixth area, The Career, if the owner wants the page to show the career apart; it's a line in each of
the five scripts.

## The Standard, As Applied

- **Verified:** a named test in the gate drives the command through the engine (a command, the clock or the rendered
  screen) and checks what the row says reads the change, expecting what an independent reading of the rule gives.
- **Partial:** the test sets the change by hand, calls a function in place of the command or the clock, or runs on a
  TEST SETUP the row's journey doesn't otherwise reach.

One reading decided nine rows. State the game's own journeys reach, set by hand with the fields the readers read (a
graduate made by Commencement brought forward, a skilled actor's levels, money taken out), is setup, as the page's
standard says. Another part's output written by hand as a stand-in while the parts were built apart (a finished job,
an agreement, an engagement and its pay, a showcase's performances) counts as setup only where some gate test also
reaches that output and goes on to the command. Where every test of the command starts from the stand-in, the row's
journey isn't reached, so the row is partial, its gap named. Each stand-in was checked against what its producer writes
(the work loop's `finish`, `projobs.ts:1040`, leaves a finished engagement with a credit carrying its judged band, what
`referrersOf` reads; `pro.accept_agreement` writes what `activeAgreement` reads): they match on those fields, and that
isn't what makes a row verified.

## Each Command

As the first reading found them at `7bbab80f`. The nine partial rows' second reading is in its own section above.

| Command | Status | Why, In One Line | Mutation |
|---|---|---|---|
| `school.choose_showcase` | verified | The full journey chooses through the command, and each chosen scene is judged at each day, the course settled on them, the follow-up come | M13 killed |
| `pro.set_name` | verified | Set through the command; the profile and a résumé behind on the name read it | M1 killed |
| `pro.headshots` | verified | Four hours and $700.00 on the clock and the bank; a submission and the agent's check refused without them, taken with them | M2 killed |
| `pro.update_resume` | verified | Made from the record in an hour; behind once the name and a credit change; a submission and the check need it | M3 killed |
| `pro.cut_reel` | verified | Cut from taped self-tapes; What's Missing says tapes only and newer work; his office's request reads it (the monologue and footage sources only on state set by hand) | M4 killed |
| `pro.agent_notice` | verified | Every other step refused until it's read, through their commands | M5 killed |
| `pro.agent_check` | verified | Refuses an incomplete approach in `materialsCheck`'s words; a referral and a send wait for it | M6 killed |
| `pro.ask_referral` | partial | Every test asks it of a finished job written by hand, an Off-Broadway part an unrepresented actor couldn't have been seen for | M14 killed on the stand-in |
| `pro.send_materials` | partial | Every send follows an introduction written or scheduled by hand; no test goes on to him from the showcase's own follow-up or a finished open role | M15 killed on the stand-in |
| `pro.supply_material` | partial | Its request comes from that path; every request in a test is for a reel; the button is never rendered | M16 killed on the stand-in |
| `pro.ask_to_move` | partial | Its meeting comes from that path; the stop's choice itself is played and checked | M17 killed on the stand-in |
| `pro.accept_agreement` | partial | Its offer comes from that path, and what accepting changes in later opportunities and pay is checked only on agreements written by hand | M18 killed on the stand-in |
| `pro.decline_agreement` | partial | Its offer comes from that path | M19 killed on the stand-in |
| `pro.end_agreement` | partial | Its agreement comes from that path; the offers and covered days its rules read are written by hand; continuing commission is checked on an agreement ended by hand | M20 killed on the stand-in |
| `pro.join_sag` | partial | Eligibility only from an engagement written by hand (SAG-AFTRA's qualifying work is agent-only); what joining changes afterward is read by no test | M21 killed; P3, P4 survived |
| `pro.submit` | verified | Posted by the clock, refused without the portfolio, then answered with an audition by the clock | M7 killed |
| `pro.prepare` | partial | The preparation is moved through the command, and no test reads it: a work day ignoring the part's survived (P2); the sides' is held only through seed-chosen outcomes (P1) | P1 killed, P2 survived |
| `pro.tape_audition` | verified | An unsigned non-union short taped through the command and offered by casting on the clock (casting's reading of the band asserted on rounds in person, through the same handler) | M8 killed |
| `pro.move_audition` | verified | Moved clear of a plan, judged at the new time, the plan kept | M9 killed |
| `pro.accept_offer` | verified | Unsigned journeys book, work, credit and pay through it by the clock; the represented path only on an agreement written by hand | M10 killed |
| `pro.decline_offer` | verified | Declined on a played offer: nothing booked, its lapse called off, refused again | M11 killed |
| `pro.request_outside_work` | verified | Asked, approved by the dean on the clock, read at acceptance, the class days excused | M12 killed |

13 verified, 9 partial at `7bbab80f`; 18 and 4 at `a483247d`. Each row's fields, its tests by title and its review are in `docs/verification/audit/school.json`,
written from `added-rows.json`, and on `docs/GAMEPLAY-COVERAGE.md` under the School and under Added Since The Review.

### P1, Read Exactly

P1 made an audition's judge read none of the sides' preparation (`auditionContext`). Seven tests of
`tests/pro-work.test.ts` failed (the whole loop, the run, the J3 and leaver journeys, the over-seeds test, two of what
missing a step costs), each because its outcome had been found over a list of seeds with preparation in place, none on
an expectation that preparing raises the band. So the reader was protected, but no test stated the rule's direction, and
the part's preparation (P2) wasn't protected at all, until the journeys' twins (the second reading, Q10b and Q11b).

## Defects

None in the game's code: no command that changes nothing, no reader that never runs, no refusal that says something
untrue. One ordering was checked and is sound: a first SAG-AFTRA job's first day is read by the pay's eligibility item
(priority 30) and the work day (priority 38); lower runs first, so the player is told (You Can Join SAG-AFTRA).

**In the records,** corrected in the capabilities' limits in the past tense: `career-portfolio` said the materials were
read by the Career screen alone until the agent's and the work's systems called `materialsCheck` (both do since the
merge); `school-showcase` said the School's follow-up was to be wired at integration (`endShowcase` puts it on the
calendar); `career-pay` said Providence wasn't in the gazetteer (the company moved to Hudson, which is); `career-work`
said the promised pay would be posted once wired (`pro.accept_offer` calls `schedulePay`).

**In the tests,** each a gap in a row rather than a defect: until V1's journeys every agent journey started from a
finished job written by hand, an Off-Broadway part, which takes submissions only from agents, given to actors nobody
represented (a referral from a student film or a LORT run would read differently in his office's Training and Fit
factors); no test cut a reel from the filmed monologues, and no submission sent a reel, until they did (the second
reading). No test cuts a reel from released footage, and few of the career's buttons are pressed on a rendered screen
(the screen tests render each state and issue the commands through `execute`, as the journeys do).

**In the tools, for the owner:** a capability over rows added after 2026-10-13 can't be called Verified, whatever its rows
say: `tools/capabilities.mjs` and `tools/coverage.mjs` count a row as read only when `review.on` is `2026-10-13` (brief
09's capabilities stand at Implemented for the same reason). `school-showcase` is verified in this reading and
Implemented in the registry for that reason alone, and its limits say so. Reading `review.on === (row.added ??
'2026-10-13')` in both tools would let added rows count; that's a change to the standard's tooling, left to the owner.

## The Capabilities

| Capability | Registry | Verified Layer | First Reading | Second Reading | Its Builder's |
|---|---|---|---|---|---|
| `career-portfolio` | Implemented | Partial (was Implemented) | partial | partial | partial |
| `school-showcase` | Implemented | Partial (was Implemented) | verified | verified | partial |
| `career-representation` | Implemented | Partial (was Implemented) | partial | partial | partial |
| `career-pay` | Implemented | Partial (was Implemented) | partial | partial | partial |
| `career-work` | Implemented | Partial (was Implemented) | partial | verified | partial |

The verified layer had said Implemented, which the registry's `about` doesn't define for that layer; Partial is what it
gives an Implemented capability with a check missing, as brief 09's are.

## The Completion Matrix

- **Before:** 527 of 658 rows in scope Implemented And Verified (80.0%); 127 Implemented, Verification Incomplete.
- **After:** 540 of 658 (82.0%); 114 Implemented, Verification Incomplete. The 22 left the group Commands Traced Outside
  The Audit for School: the 13 verified are Implemented And Verified, the 9 partial Implemented, Verification Incomplete
  with their gaps.
- **After the second reading:** 545 of 658 (82.8%); 109 Implemented, Verification Incomplete. The five rows it verified
  moved to Implemented And Verified.

## What Closes The Partial Rows

As the first reading said it; V1's journeys did each, and the second reading says what's still missing for the four
rows left partial.

- **The seven agent rows:** one journey, V1's, from the showcase's own follow-up or a finished open role in the work loop,
  through `pro.agent_check`, `pro.send_materials`, a request supplied, a meeting moved and kept, an agreement accepted
  through the command, then a role posted through him, booked, worked and paid with commission, and the agreement ended.
- **`pro.join_sag`:** that journey booking a network or Low Budget part, joining, and paid with working dues, with a May
  or November billing.
- **`pro.prepare`:** a twin test, the same booked part prepared fully against not at all, read in its work days' bands.

## Checks Run (Each Exit Read From A File)

- `npx tsc -b --noEmit`: exit 0, at `2d999179`; no TypeScript changed after it.
- `npx eslint tools/coverage.mjs docs/verification/career-2026-10-20/audit/mutate.cjs`: exit 0 (the `.cjs` is outside the
  repository's lint by its ignore pattern; `tools/coverage.mjs` is clean).
- `tests/audit-pipeline.test.ts`, `tests/evidence-g34-ui.test.ts`, `tests/evidence2-b13.test.ts`: 26 of 26 at `abd1aef7`.
  The ten career test files: 125 at `7bbab80f`, before anything changed.
- The gate's chain without the suite (21 checks): exit 0 at `abd1aef7`. Coverage: 361 items, 313 verified, 9 partial, 12
  unresolved, 16 deferred, 3 legacy, 8 informational; the two registries agree on 180 commands.
- The second reading's are under The Second Reading, above.

## Shared Files Touched

- `tools/coverage.mjs`: the page's sentence on the capabilities' later readings names who made each (`by`), where it
  said "by its builder" of every one; a paragraph in its header says when and why.
- `docs/capabilities.json`, `docs/CAPABILITIES.md`: the five career capabilities' layers, limits and two readers' lists.
- `docs/verification/review-2026-10-13/capabilities.json`: the five career readings, each builder's kept as `builder`.
- `docs/verification/pipeline/inputs/added-rows.json`, `docs/verification/audit/school.json`, `docs/GAMEPLAY-COVERAGE.md`:
  the 22 rows.
- The completion matrix, regenerated; the handoff's top section (its completion line, a note of what moved it).
- The second reading touched the same files but `tools/coverage.mjs`, and added `mutate-scoped.cjs`, `mutations2-list.json`
  and `mutations2.json` to this folder and Round Two to `mutations.txt`.

## For Integration

- The rows are generated: change them in `added-rows.json` and run the pipeline (its README), never the audit by hand;
  `tests/audit-pipeline.test.ts` fails otherwise.
- A partial row moves by a new review in `added-rows.json`, its `issue` rewritten in the past tense, and its capability's
  limits change with it, as the second reading moved five once V1's journeys landed.
- The completion line is the matrix's to recompute (`node tools/completion-matrix.mjs`), never merged by hand.
