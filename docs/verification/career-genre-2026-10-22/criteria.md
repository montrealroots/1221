# Brief 22: Finish The Three Remaining Career And Genre Issues, Its Criteria

The owner's brief 22 (`../briefs-2026-10-16/22-finish-the-three-remaining-career-and-genre-issues.txt`, kept verbatim),
given 2026-10-22, turned into items here before any fix, as briefs 20's and 21's were. Each item is **Open** until the
game does it and a test the gate runs fails without it, or, for a record, until the record is there. Nothing is closed
by moving it out of the count or narrowing what it asks. Where this file chooses a rule the brief leaves to SLATE, it
says so and why, and the choice is the owner's to overrule.

## The Starting Point

- **Tested from:** `main` at `46822660` (#53: brief 21 merged as #52, `d7239165`, and the handoff's account of it), on
  `claude/peaceful-hamilton-59zdbb`, level with `main`, then `69996adb` (the brief kept verbatim, nothing else). No
  uncommitted work, no stash, one worktree. Nothing deployed.
- **The gate there:** brief 21's receipt gate, on `4b9cda04`, whose `src`, `tests`, `tools` and `package.json` are
  `69996adb`'s (`git diff --stat b34e6f92 69996adb` over them is empty): exit 0, 482 of 482 test files, 5,547 of 5,547
  tests, all 22 checks (`../genre-banking-2026-10-22/final-runs/runs/gate-receipt.txt`). Reused, as the brief allows.
- **The matrix there:** 632 of 658 rows in scope Implemented And Verified; 21 Implemented, Verification Incomplete; 5
  Decision Required; 40 Explicitly Deferred. This brief's two: **Genre Audit** (Decision Required, its question in
  `../genre-banking-2026-10-22/final-runs/judge-moved.json`) and **genres.7-measured** (Implemented, Verification
  Incomplete, waiting on it). The other open rows are other areas' and stay as they are.
- **Out of scope, at the owner's word:** new immigration categories, unrelated career systems, the UI redesign, and
  real-show, director, festival or awards expansion.

## What The Code Did Before Any Fix (read 2026-10-22)

**Permission to work.** `usWorkAuthorized(person, at)` (`systems/permission.ts`) is a citizen, or a US permit valid and
in force. It's read:
- at acceptance, for each work day's start (`acceptRefusal`, `systems/projobs.ts`), and kept on the engagement as
  `eligibilityRead` at each date's noon (`systems/propay.ts`);
- nowhere after: not at a rehearsal, a performance, a shoot day, a payday or the finish.

OPT's days without work are counted **weekly** (`OPT_WEEK_KIND`): every seven days from the permit's start, seven less
the days touched by any engagement not called off (`daysWorkedIn`), booked or worked, future days included once they
come. Past 90 the permit is canceled at the week's end, the status with it, and "OPT Ended" is sent; nothing is done
about work booked ahead. So:
- a day booked counts as worked whether or not the work began, and a booking alone stops the count only on its own
  days;
- a 91st day mid-week is found up to six days late;
- an engagement called off after it began loses its worked days from the count;
- work booked when permission ends goes on, every day of it judged, practiced, credited and paid.

This is brief 21's recorded failure: b20-4 (British, on an F-1, then OPT) worked 48 days of The Winter Ledger as Hester
Vane after its OPT ended on 6 September 2029 (`../genre-banking-2026-10-22/final-runs/runs/README.md`).

**A work's genres.** `genreNeeds(tags)` (`systems/engagement.ts`) dedupes a work's tags, gives the first listed half the
weight where there are two or more (`ENGAGEMENT.weights.primary`) and the rest an even share of the other half, and
absorbs a broad genre listed beside one of its kinds. So the order a list was written in decides the weights: The
Winter's Tale's `['romance', 'tragicomedy', 'fairy_tale']` is romance 0.5 and the others 0.25 each, and listed
tragicomedy first it would be tragicomedy 0.5; Major Barbara's `['comedy', 'satire', 'political_drama']` is satire 0.75
(comedy's half absorbed into it) and political drama 0.25, and listed the other way round political drama 0.5 and
satire 0.5. There's one level only, the work's tags: a professional role reads its project's, a School part its play's,
a class scene its play's (none where the play names no kinds, 43 of the 67 scenes), a taped brief its one genre.

**Transfer.** `relatedness(known, need)`: itself 1; `need` among `known`'s ancestors 0.75; `known` among `need`'s
ancestors 0.5; else 0. Ancestors are read **through any depth**, so 12 genres whose broad genre is itself a kind of
another (`crime`, a kind of `drama`; `satire`, a kind of `comedy`) transfer two steps: Nordic noir known counts toward
drama at 0.75 through crime. Each requirement takes the best single credit (`relevantGenre`), so studying a work's own
genre adds nothing until it passes what a related genre already gives.

**The benchmark.** The Genre Audit (`tools/genre-audit.ts`) asks that knowing a genre "leaks into none": it tries each
genre against the next alphabetically, and since brief 21 nine of those pairs, each a genre and its own kind or broad
genre, move (Decision Required).

## Fixed Before Any Outcome

- **Comparison seeds:** `b22-proof-1` to `b22-proof-8`, chosen here, never replaced.
- **Journeys:** brief 20's eight lives (`b20-1` to `b20-8`, their creation choices and seeds fixed by brief 20's
  criteria) and its seven older saves, played by the same players; brief 13's 25 journeys; brief 19's four lives. The
  international graduate: `b20-4` (British, F-1, OPT), the life that failed.
- **Knowledge levels for comparisons:** 0, 45 and 90 (90 is where a genre counts complete), and 100.

## A: Permission To Work Throughout An Engagement

- **A1, the failure reproduced.** b20-4 played on the starting commit, the same seed and players, in a clean clone:
  the days of work logged worked after its OPT's end counted from the save (48 expected), and a save kept before the end
  (1 September 2029) as a fixture. A test from that fixture that fails on the starting commit.
- **A2, the lifecycle traced.** `authorization-trace.md`: eligibility, the offer accepted, preparation, rehearsals, work
  days, a change of permission, payments, credits and the finish, each with where permission is read before the fix and
  after it.
- **A3, the sources dated.** `authorization-sources.md`: what each says, its date and the date read; what SLATE takes
  from it; what it leaves uncertain.
- **A4, the rule from the record.** Each New York calendar day of OPT, from its first, is a day of employment or of
  unemployment:
  - (a) **a booking isn't employment:** a day before an engagement's first day worked is a day without work, however
    soon the work starts;
  - (b) **employment, not a contract:** a day is employed when it falls inside an engagement that has begun (a day of
    it worked) and hasn't ended (its last day, or the day it was called off), and whose scheduled hours average at least
    20 a week over its span (at least a week); the days between engagements are days without work, and so are the days
    of an engagement that never began;
  - (c) **expiry isn't a breach:** permission running out on its end date ends work there, the status's 60 days of
    grace after it; more than 90 days without employment ends permission and the status at the end of the 91st, no
    grace; the notices say which;
  - (d) **a stop on future work isn't a claim on past pay:** pay for days worked stays owed and is paid on its payday;
    only what wasn't worked is dropped.
  The uncertainty, said in the code and in `authorization-sources.md`: the averaging window (SEVP's "within a month";
  SLATE averages over the engagement, since a performance's record is its two and a half hours on stage and not the
  calls around it); a missed day inside a begun engagement (SLATE: still employed, SEVP 7.1.8's "leave authorized by an
  employer"); DHS, not the school, decides a breach and may act later (7.4.3, 7.4.4), where SLATE ends permission at
  once; no gap between gigs is excused (the 2010 update deleted the ten-day exceptions).
- **A5, counted daily and once.** Each day is counted once it's over, from where the count stopped (kept on the
  permit), so a long advance counts every day, advancing twice never counts a day twice, and a save opened goes on
  where it stood. An older save's weekly count is kept as it was, and the count goes on from the day its weeks reached.
- **A6, the boundary.** Permission ends at the midnight that ends the 91st day without work. A work day beginning then
  or later doesn't happen; one that ended before it stands. A test pins the instant.
- **A7, when permission no longer allows the work** (a breach, an expiry, or any other end, found at the latest at the
  work day): no work happens, and so no judgment, no record of work, no practice, no attendance, no enjoyment, no union
  step and no credit for it; the engagement is called off from then, its days to come taken off the calendar, with a
  notice that says why and what's kept; pay for days worked kept and paid when due; a week with nothing worked owed
  nothing; a stage credit already earned (a night played) kept; no screen credit for a shoot not finished; no penalty or
  claim beyond that, since no agreement in the game and no rule implemented gives one.
- **A8, read where the work happens.** Each work day reads permission for the whole day (its start and its end); so
  does acceptance, for every day. Acceptance warns when OPT's days without work would run out before the work begins.
- **A9, before, during and after.** Permission ending before an engagement's first day, during it, and after its last
  day, each tested: work, pay, credits, notices and calendar.
- **A10, authorized work goes on.** A citizen, a green card holder, and OPT within its days: work, pay and credits as
  before; every existing test of them passes.
- **A11, recovery only by a real route.** A released engagement never resumes. New work comes only through casting
  once permission holds again. In the game as it stands nothing restores US permission after a breach (OPT isn't
  granted twice, and the green card's route is refused), said; a green card held (test setup) shows casting reopen and
  the released engagement stay released.
- **A12, three ways of playing.** Continuous play, one long advance, and a save opened in the middle: the same end, the
  same engagements released, the same pay, the same state to the byte.
- **A13, Papers and the guide.** The OPT line counts by the new rule; when the status ends (`optRunsOut`) counts booked
  work only from its first day; the guide and the notices say the rule plainly; each changed text read and marked.

## W: Genre Weights From The Material

- **W1, order removed.** No first-listed half (`ENGAGEMENT.weights.primary` deleted). Every material read in every
  order of its tags comes out the same, to the bit.
- **W2, one resolved set.** Requirements resolve from the most specific level that states them: a class scene, then a
  part or role, then the play or project. A level that states weights states the whole set (no merging). A level with
  tags but no weights reads them evenly: the neutral fallback, for older content. A level with neither inherits. A
  weight set that's invalid (a weight negative or not a number, a genre the game doesn't know, nothing above 0) is
  skipped and the reason kept, falling to that level's tags or the next level. Every reading carries its set, the
  level it came from and whether it was stated or even.
- **W3, no false precision.** A class scene's filed genre (comedy, drama or tragedy, its register's) is coarser than
  its play's kinds, so it's read only where the play names none. Scene weights override only where written. A
  professional audition, callback or self-tape has no sides of its own in the game, so it reads the role's.
- **W4, the material reviewed.** Every material with more than one genre (the 11 roles of 7 projects, the plays with
  kinds and the Rep's Seagull) given weights with a reason, and parts and scenes where the material differs, each
  labelled SLATE's design choice, not a researched fact (`content/genre-weights.ts`, `genre-weights.md`). One genre
  needs no weights. The 298 briefs are one genre each.
- **W5, bounded.** Weights nonnegative, each at most 1, summing to 1; the reading 0 to 1. A tag listed twice adds
  nothing. A broad genre beside one of its own kinds, at any depth, is absorbed into the kind, so one requirement isn't
  counted twice. Two different sets stay different.
- **W6, every consumer.** School and professional casting, a taped brief, a self-tape, an in-person audition, a
  callback, a School call and a professional rehearsal day (practice and the lines' speed), a shoot day, a night on
  stage, a class scene's preparation, the showcase's scenes, the suggestions, and every explanation read the resolved
  set. A test for each that a role's or scene's own set moves it and an inherited one reads the default.
- **W7, counted once.** The genre is part of the work's preparation once (the judgment), part of casting's fit once
  (who casting thinks suits), the speed of preparation (time) and practice (the record): four different effects, none
  read twice, said in the code. No path adds a modifier of its own.
- **W8, foundations hold.** Abilities and techniques stay what the work mostly reads; mastery never lowers its own
  contribution, guarantees no booking (casting's chance is capped), and moves nothing unrelated.
- **W9, older saves.** Castings, credits and briefs kept as tags in saves resolve through the material's own weights
  where the game knows it, evenly otherwise. Every fixture save opens; no migration needed unless a test shows one.
- **W10, explanations.** A casting notice says what the part asks in words ("A domestic drama", "Mostly farce, with
  some romantic comedy", "Tragedy and drama, about evenly"), never a weight or a share; the guide and the tutorial say
  the rule.

## T: Related Genres

- **T1, direct only.** Knowing a genre counts toward another only across one direct link: a kind toward its broad genre
  at 0.75, a broad genre toward its kind at 0.5. Never across two links (the 12 chained kinds), never between kinds of
  one broad genre (siblings), never from an unrelated genre. The full 149 by 149 table tested.
- **T2, familiarity apart from progression.** Reading never writes; practice goes only to the genres the work's
  resolved set names. A related genre helps meet a requirement and earns nothing stored.
- **T3, exact knowledge always counts.** Each requirement is met by the genre's own knowledge and the best related
  credit together, `1 − (1 − own) × (1 − best related)`: whole with the genre itself mastered, never above 1, never
  lower for more of either, and every point of the genre's own study counting, so a specialist's work is never wasted
  on a broad genre known. Brief 21 took the better of the two, under which studying the genre itself added nothing
  until it passed the related credit. SLATE's choice, said in the code.
- **T4, the coefficients evaluated before they're final.** The same actors, conditions, preparation and draws on the
  fixed seeds; at each path the reading, the genre part, the choices' preparation and the whole for: nothing known, an
  unrelated genre at 90, the broad genre at 90 (toward its kind), a kind at 90 (toward its broad genre), the genre
  itself at 90. 0.75 and 0.5 stay if, on the median over the seeds at every path: (K1) nothing = unrelated < broad <
  kind < exact; (K2) the kind's gain is at most 0.85 of the exact genre's, and the broad genre's at most 0.65. Where
  either fails, the coefficient is lowered until both hold, and the reason kept.
- **T5, the criterion superseded, not loosened.** The Genre Audit's "leaks into none" (the owner's genre acceptance
  brief of 2026-10-16) replaced by the owner's words of brief 22: "No unrelated-genre contribution; only documented,
  bounded transfer across approved direct relationships." The tool reports both halves: unrelated moves (must be 0),
  and each related move, its link and that it's below the genre's own gain. The old criterion, brief 21's question and
  this authorization kept in `decision-history.md` and the matrix row's history.
- **T6, reconciled.** The Genre Audit row, genres.7-measured, the tutorial, the guide, the explanations, the completion
  matrix and the feature-to-effect matrix say the approved behavior; the two rows verified only on the new measurement.

## P: Proof

- **P1, authorization tests** (`tests/b22-authorization.test.ts`): A1's regression from the fixture, A4 to A13.
- **P2, weighting tests** (`tests/b22-genre-weights.test.ts`): one genre; two even and uneven; three or more; two
  scenes of one play; a role's own set and an inherited one; tags reordered and repeated; weights missing and invalid;
  a broad genre beside its kind; older saves and every existing material.
- **P3, transfer tests** (`tests/b22-transfer.test.ts`): exact, partial and none; broad to kind and kind to broad;
  unrelated and siblings; several genres known unevenly; no chain; nothing stored; bounded and never falling; nothing
  irrelevant moved.
- **P4, comparisons** (`comparisons.md`, written by `comparisons.ts` from what the tests assert): the fixed seeds, every
  path, the intermediate figures and the whole, so a cap can't hide a broken link.
- **P5, deliberate faults** (`mutations/`): at least the guard removed, a booking counted as employment, the boundary a
  day late, a released engagement's future pay kept, its worked pay dropped, a day counted twice, the first-listed half
  back, a role's or scene's set ignored, a repeat counted, weights not normalized, invalid weights accepted, absorption
  removed, siblings related, chains restored, transfer writing practice, full transfer, transfer summed. Each must fail a
  test the gate runs.

## J: Journeys And The Built App

- **J1:** b20-4 on the tested commit: no work day after permission ends, the notices, the pay, Papers and its coherence
  checks; set beside A1's run.
- **J2:** brief 20's eight lives and seven older saves, brief 13's 25 journeys and brief 19's four lives on the tested
  commit; work, money, papers, development, history and calendar connected; what moved said where it starts.
- **J3:** the built app at 1440 and 390: a casting notice's What It Asks, Papers' OPT line, Booked Work's history of a
  released engagement, the guide's genre and OPT entries; the acceptance walk and brief 21's walk as before.

## R: Delivery

The tested commit; each defect and its fix; the sources, dates and assumptions; the rules with worked examples;
before and after for b20-4; the tests', journeys' and faults' results; what a save keeps and how an older one opens; the
matrices and the handoff; what's left. The full gate in a clean clone, its exit read from a file. No merge and no
deployment without the owner.
