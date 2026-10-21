# Brief 20: The Functional And Downstream-Effects Audit, Its Criteria

The owner's brief 20 (`../briefs-2026-10-16/20-complete-functional-and-downstream-effects-audit.txt`, kept verbatim),
given 2026-10-21, turned into items here before any fix, as brief 18's and brief 19's were. Each item is **Open** until
the game does it and a test the gate runs fails without it, or, for a record, until the record is there and a check holds
it. An item is never closed by moving it out of the count, by narrowing what it asks, or by calling something decorative
after it was found disconnected.

## The Starting Point

- **Tested from:** `claude/peaceful-hamilton-59zdbb` at `340ce7ae`, which is `main` (#49): brief 19 merged, nothing
  deployed. No uncommitted work, no stash, one worktree. The brief-19 walk clones whose commits the branch didn't hold
  were kept as `refs/preserved/*` in the repository before their scratch copies were deleted for disk space.
- **The baseline gate:** `npm run gate` in a clean clone of `340ce7ae`, its exit read from its file (`baseline/gate.txt`).
- **What the record says is open before this brief** (the handoff's first section and the completion matrix): 634 of 658
  rows in scope Implemented And Verified; 20 Implemented, Verification Incomplete (twelve commands no current life can
  reach, eight banking decisions for the owner); 4 Decision Required; 40 Explicitly Deferred. Brief 18 is paused at the
  owner's word, and its items stay paused but for what this brief names (the credit limit). Brief 19's V17, a person's
  look at desktop and mobile, is the owner's.
- **What stays out:** the personal-life systems the owner took out (the scope reset of 2026-10-09: the homes, the
  travel, the old career's industry) aren't restored, and no new industry is added. A row the owner deferred stays
  Explicitly Deferred, with whose word it was, and isn't counted as verified.

## S. Scope

- **S1. Every existing system is in the audit.** The inventory is built from the code: every command and scheduled kind,
  passage reactor and event the engine registers; every creation field; every dial, ability, personality axis and trait
  the player sees; every look; every screen control the guide names (`ui.*`); every tutorial chapter; every promise the
  guide makes between two entries (its connections); and every notice the engine sends, named by the feature that sends
  it. `tools/effects.mjs --check` fails where the code has one that no row names.
- **S2. Each area named in the brief has its rows:** creation, the player profile, attributes, techniques, genres,
  interests, the School, relationships, money and banking, papers, health, readiness, looking after yourself, weather,
  the calendar, holidays, moving time, tutorials and the career, and whatever else S1 finds.

## M. The Feature-To-Effect Matrix

- **M1. One row a feature, with the brief's nine fields:** where the player meets it; its prerequisites and when it's
  open; the state it reads; what it changes at once; which systems read that change later (each with the file and line);
  when and how the player meets the consequence; what a save and a load keep; the tests and playthroughs that hold it; and
  what's missing. A row says whether it's a mechanic or presentation (a label, navigation, a record), and a presentation
  row says what its purpose is and how that's checked.
- **M2. The owner's seven statuses** (brief 09), and nothing else. Implemented And Verified needs a test the gate runs
  that reaches the feature as a player does and checks the consequence the row claims. The denominator is every row but
  Explicitly Deferred; the totals are written with it.
- **M3. Read, not copied.** A row taken from an earlier record (the completion matrix, the audit's rows) is marked as
  seeded until somebody has read it against this brief's code and said so; the check fails a row still seeded.

## B. Features Read And Bite

- **B1. Controlled comparisons, both ways.** For each kind of input that changes play (attributes, genre experience,
  health, fatigue, preparation, money, eligibility, relationships, earlier decisions), a test the gate runs plays two
  lives alike in everything but that input, from the same seed, and shows the difference it should make where it's
  relevant, and no difference where it isn't.
- **B2. Skill does what it should and no more.** Under controlled conditions the most skilled actor's work is judged
  better than the least skilled's, and skill changes neither which parts are posted to them nor whether the agent's list
  has room.
- **B3. Delayed consequences, through the clock.** Each of these is reached through the clock in a test, not set by hand:
  a missed deadline, recovery, a payment, interest, a fee, attendance, learning, an assessment, career eligibility, an
  audition, the quality of work, a referral, commission, a credit, and a later opportunity.

## D. Disconnections Found And Repaired

- **D1. Each of the brief's twelve kinds searched for**, area by area, with the method and what was found: values written
  and never read, choices that promise a difference and make none, success reported with nothing changed, effects worked
  out and never applied, a notice or tutorial describing behavior that isn't there, a charge, reward, penalty or progress
  counted twice, time skipping an obligation, a save or a load dropping or replaying a consequence, impossible scheduling
  or eligibility, a control wired to the wrong command, a feature only a test's hand can reach, and an opportunity offered
  again against what's already done. Each defect confirmed is repaired where it's in scope, with a test that fails without
  the repair; the repair connects what was disconnected, and never hides it or weakens what it promised.
- **D2. The credit limit's growth.** Every played life's limit rose a fifth every six months with no ceiling (brief 19:
  life A's to $194,736). It's settled on a rule that can be said and sourced, measured before and after on every starting
  means, and the ask for a higher limit held to the same rule, with tests and mutations.
- **D3. Consecutive work days.** Whether back-to-back shoot days tire the actor more than the body's figures justify is
  measured against a player who sleeps as the game advises, and whether the game tells the player what an early call asks
  of the night before. What's found wrong is fixed on a stated rule; what's found right is recorded with the measurement.
- **D4. The known items** (the handoff's): the load-order hazard at coursework's `PARTNER_KIND`; a role posted again ten
  weeks on with no word of the first time; `docs/verification/career-2026-10-20/app/jordan.ts` reading a field taken
  out; the near-name Sam and Samuel Patel; and the dialog count no one traced. Each fixed, or said why not.

## J. Journeys

- **J1. Fixed seeds, chosen before any journey ran:** `b20-1` to `b20-8` for new lives, each with a profile set here
  (below), and brief 19's lives `v1-21` and `v1-7`, and the older saves in `tests/fixtures/`. A seed that fails stays in
  the record with its failure. None is swapped for a kinder one.
- **J2. Creation to the career through the player's own actions:** each new life created, through the School, graduated
  or not, and on into the career, with what happened recorded, the failures with it.
- **J3. The routes:** unsigned and represented; success, failure, delay, decline, interruption and recovery; commitments
  that clash; little money; poor and strong preparation; different genre strengths; fatigue; and a student whose papers
  limit work.
- **J4. Saved and opened at the transitions** (creation, each year's end, graduation, a signing, a first job), and the
  life played straight through against the same life saved and opened: the same state to the byte, and the same outcomes.
- **J5. Coherent throughout:** the School's record, the attributes, the genres, the money (each balance the sum of its
  postings), the papers, the relationships and the credits, checked at each journey's end.
- **J6. The built app, desktop and mobile:** a life made and played on the built app at 1440 and 390 wide, through the
  real buttons, dialogs and pages, from startup through creation, the School and into the career, with captures.

## C. Continuity And Variety

- **C1. Remembered:** decisions, milestones, obligations missed, agreements and past work are kept and read later, each
  with a test.
- **C2. Not contradicted:** no first-time event twice, no opportunity offered again against completed work, and text that
  says what the state is. Ordinary things repeat; where progress should change the experience, it does.
- **C3. Tutorials and the guide true:** every promise the guide makes between entries (S1) is held by a test, or is
  presentation that says no more than the game does.

## T. Test Strength

- **T1. A regression test for every defect fixed.**
- **T2. Mutations across every system,** not only the career: each mutation breaks a connection a test claims to hold, is
  run in a clean clone, and is killed by an assertion that names the behavior, told apart from a setup error. A mutation
  that survives is a finding.
- **T3. Fixtures said for what they are.** A success-path fixture is named TEST SETUP, and balance is judged apart.
- **T4. The full gate after integration,** in a clean clone, its exit read from its file; and again after any later
  change to `src`.

## R. The Report

- **R1. The receipt** (`README.md` here): the tested commit; the matrix and its totals; the defects, their fixes and their
  tests; the journeys, failures included; the comparisons and the mutations; the test totals, failures and skips; the
  built app's evidence; every limitation, deferral and decision for the owner; and how to look for oneself.

## The Fixed Seeds And Their Profiles (J1)

Chosen 2026-10-21, before any journey ran. Each profile is creation's own choices; a journey's player is named with it.

| Seed | Who | Means | Papers | Genres loved | Player |
|---|---|---|---|---|---|
| `b20-1` | she/her, born New York | modest | US citizen | Drama, Comedy | attentive, then represented if offered |
| `b20-2` | he/him, born New York | nothing | US citizen | Thriller | attentive, then unsigned |
| `b20-3` | they/them, actor, born Toronto | scraping | Canadian on an F-1 | Musical | attentive, then whatever comes |
| `b20-4` | she/her, born London | comfortable | British on an F-1 | Period Drama | ignores the coursework's advice |
| `b20-5` | he/him, born Mexico City | modest | Mexican on an F-1 | Horror | neglects the coursework until warned |
| `b20-6` | she/her, born Chicago | wealthy | US citizen | Romance | attentive, declines the agent |
| `b20-7` | he/him, born Los Angeles | scraping | US citizen | Action | misses a course's meetings |
| `b20-8` | they/them, actress, born Dublin | modest | Irish on an F-1 | Comedy, Fantasy | ill in the first term, then attentive |

Where a profile names something creation can't make (a genre not on its list, a city not in its geography), the journey
uses the nearest thing creation offers and the record says which.
