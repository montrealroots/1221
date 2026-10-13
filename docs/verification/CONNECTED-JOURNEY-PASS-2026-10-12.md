# The Connected Journey, 2026-10-12

**The brief:** "SLATE: Complete The Tutorial, Acting Depth, Balance, And Connected Player Journey", from `main` at
`0dbe5960`. It counts as complete when every acceptance requirement is implemented and verified. This report goes
requirement by requirement: what was built, where it lives, what holds it, what the measurements showed, what was found
broken and fixed, and what's still short. It claims no score.

- **Branch:** `claude/connected-journey`, from `0dbe5960`.
- **Merged** to `main` at the owner's "Merge it.", by fast-forward from `0dbe5960`. **Not deployed:** that's the owner's,
  after the gate.
- **Saves:** schema 94 is unchanged. Every new field is optional and written on first use.
  - A save from before gets on opening what this pass reads: its life-long limits counted from the work it kept, its
    guide marked finished where it was read to the end, and a body where it had none.
- **Untouched:**
  - the stash (`stash@{0}`);
  - the three worktrees;
  - the untracked files at the root.
- **Kept out, as the brief said:**
  - no removed personal-life or industry system came back;
  - no parental leave;
  - the 16 deferred items stay deferred.

**The tested scope:**

- **The gate** on the final tree (§17): 258 test files and 2,706 tests, typecheck, lint, and the sixteen checks.
- **The built app** (§16), at 1440 and at 390: 46 journeys each, from a new life and from eight scenario saves.
- **The measurement tools**, on held-out seeds:
  - the freshness journeys;
  - the specialist comparison;
  - the catalog balance;
  - the trace.

**No known failing cases or crashes in the tested scope.**

---

## 1. The Completion Map

`docs/verification/CONNECTED-JOURNEY-MAP-2026-10-12.md` was written before any code. It holds the design calls, a plan
for each requirement, a completeness critic's twenty additions and the risks. Each of the sections below says where it
followed the map and where it didn't.

## 2. The Tutorial As A Connected Guide

- **The reference** (`src/engine/content/guide/`): 68 entries in nine goal groups.
  - Each holds what it covers, synonyms, questions, where it is, when it opens, a short explanation, steps, needs,
    costs, what the engine reads, what changes now and later, how to read the result, why it might be unavailable,
    mistakes and recovery, related entries, typed connections and a worked example.
  - Figures are imported from the rules' own constants and written into the words, so a rule change changes the guide.
  - Estimates are marked as estimates.
- **How This Works** opens the entry over the screen, which stays mounted with its tab and any half-typed form
  (`ui/guide/HowItWorks.tsx`, `Help.tsx`). It sits beside every gated control and on the panels.
  `tests/guide.test.ts` fails a gated control whose entry isn't one press away on its own screen.
- **Progressive disclosure:** the short paragraph first; each part behind its own heading; Show Everything opens all.
- **The tutorial's 17 chapters** stay the required onboarding, and open 208 features. They were corrected wherever the
  pass or its defects made them false, and they read their figures from the rules. A chapter never points to a screen a
  later chapter opens.
- **A new life chooses at creation:** Guide Me Through It, or I Know SLATE, which leaves everything open.

## 3. Navigation

**Built:**

- **Finding things:** search over titles, synonyms and questions; contents by goal; cross-links; and a breadcrumb trail
  with Back.
- **Getting there and back:**
  - Show Me Where goes to the entry's screen and tab, and Back To Help returns to the trail.
  - A stable address, `?help=<entry>`, opens help, and `?tab=` reaches a tab.
- **The keyboard:** `?` opens the contents and `/` goes to the search.
- **Help changes nothing:**
  - Reading help runs no command and spends nothing, and it holds the live clock. The dialog says "The clock waits
    while you read."
  - Opening and reading every entry, its lock, search and links against a live life leaves the save the same to the
    byte (`tests/guide.test.ts`). No help code calls a command or moves the clock (the same file).
- **Accessibility:**
  - the dialog traps focus, gives it back on closing, and closes one dialog at a time on Escape;
  - shortcuts are ignored while a dialog is open;
  - a phone shows the chapter titles.
  - A disabled control's reason is now said in words on screen, not only in a tooltip, on the Profile, School, Study
    Plan, time controls and Papers screens (the critic's item 14; `tests/whynot-*.test.ts`). On the time controls the
    reason gets a row of its own at the bar's foot. It was first written as an item in the bar, which squeezed it on a
    tablet. Measured on the build at 1180, 900 and 390 wide, Save & Exit stays on screen and nothing scrolls sideways.
- **No dead ends:** a locked screen offers Read About It; an unknown address offers Go Home; the Profile is never
  locked shut.

**In the built app (§16), at both widths:**

- How This Works beside Coursework opened its entry, followed a connected system and came Back. Escape kept the tab and
  gave the focus back, and the clock didn't move.
- `?` and `/` worked, and "partner" found 8 entries.
- Show Me Where went from School to the Bank, and Back To Help returned to the entry.
- A half-typed 12.34 survived opening and closing help.
- At 1440, a minute with help open left the live clock at 6:50 PM, and closed it moved on.

## 4. Connected Systems In Every Entry

- Every entry carries typed connections: prerequisite, immediate, scheduled, evaluation, history or optional. Each has
  a target and a reason.
- There are 356 in all: 96 immediate, 70 optional, 53 prerequisite, 53 evaluation, 49 scheduled, 35 history.
- The reverse, What Leads Here, is read from them.
- `tests/guide.test.ts` fails a connection to an entry that doesn't exist, and an entry with no connection.
- Live values come from the constants, as in §2.

## 5. A Maintainable Registry, Examples Isolated

**Checks** (`tests/guide.test.ts`, 12 tests):

- every feature id (commands, screens, looks) is covered exactly once;
- nothing is covered that the game doesn't have;
- links resolve, routes and tabs exist, and no removed label is named;
- search finds every entry by its own words;
- the save is untouched to the byte.

**Examples** (`tests/guide-examples-*.test.ts`, seven files, one per area):

- Of the 68 worked examples, 67 are played through the commands on a fresh save, and their stated figures and outcomes
  are checked against what the engine then holds.
  - Each file has an isolation test: a separate live save is the same to the byte after its examples run.
- One example isn't played, with its reason: the keyboard and the trail are the interface's, and the tests run with no
  page. It's covered by the built-app journey in §16.
- Verifiers changed example figures in the text and in the engine, to see whether the tests caught it. For example,
  start-day-body caught 26 of 28 changes and craft 75 of 94, every figure in a result included. The weak assertions
  they found were made to read the engine's own state.
- Examples found wrong against the engine were corrected in the text: coursework 3, craft 2, money 1 and papers 1. The
  taxes plan example was rewritten once the engine's plan rate was fixed (§17).

## 6. The Specialist Question

`tools/specialists.ts`, `docs/verification/connected-journey/SPECIALISTS.md`, ENGINE-MODEL §9.

**Measured apart:**

- physical and vocal;
- ability and technique;
- built on it and not;
- the weighted mean and the weakest term.

Every specialist was compared with an even actor of the same budget, fully prepared, with no draw.

**The stated criterion:** on material built on a demand at level 3, the ability it names should carry at least as much
as emotional depth, the task's most-read ability. A staged technique should carry at least as much as the medium's own.

**Measured before:**

- physical carried 13.8% of a brief built on physical work;
- vocal carried 12% of a brief built on the voice;
- emotional depth carried 17%.

**Corrected in the model:**

- physical and vocal effects raised to meet the criterion;
- presence read twice on camera;
- a staged technique at twice the medium's weight.

No genre bonus was added.

**After, across the catalog** (298 briefs; ahead counts pieces built on the specialty):

| Specialty | Briefs | Scenes | Nights | Casting |
|---|---|---|---|---|
| Physical | 58 of 83, +0.63 | 3 of 8, −0.05 | 6 of 14, +0.24 | 13 of 14, +0.5 |
| Vocal | 62 of 73, +1.08 | 12 of 14, +0.24 | 10 of 10, +0.5 | 10 of 10, +0.77 |

**What stands, explained in ENGINE-MODEL §9 and not hidden:**

- A single-ability specialist pays about 0.8 in the weakest term on every piece, for the eleven abilities lowered to
  fund it. On a scene built on physical work that makes them about even.
- The feeling actor leads because every scene is built on feeling.
- Stamina is read once, as the drain, and casting reads it as full by the fairness rule.

## 7. Situations Per Genre

**The declared target:** two meaningfully different playable situations for every genre. Met: 298 briefs, two for each
of the 149 genres, with 648 readings, all original.

**The new data, each with its consumer:**

| Field | Read By |
|---|---|
| `size`, including long, with up to six beats | the lines' minutes and the stamina load |
| `stakes` | a take's difficulty |
| `readerPlays`: steady, pressing, withholding or unpredictable | what the take leans on and draws on |

**Held by:**

- `tests/briefs-content.test.ts`: two briefs of a genre differ in relationship, objective, obstacle and circumstances,
  and on at least two axes.
- `tests/briefs-situations.test.ts`: four actors of the same budget meet the two differently. The difference spreads by
  0.5 to 14.4 points, median 4.2, against the game's own floor for a difference worth naming. In 65 of the 149 genres
  the actors disagree about which of the two suits them better.

A verifier made one genre's two briefs the same, and the test failed.

## 8. Persistent Rehearsal

`content/workbook.ts`, `systems/workbook.ts`, and the commands `work.identify`, `work.try` and `work.settle`, on a
brief, a scene for class and a part.

**The loop:**

1. A problem is named from the work's own forecast, which has no draw.
2. An adjustment is chosen, each a different change.
3. Trying it spends the time and shows the evidence: the problem's figure before and after.
4. A change of how it's played is kept or put back. One put back isn't offered for that problem again, and work done
   is kept.
5. Every later forecast, rehearsal and performance reads what was kept. From this pass, every later rehearsal on the
   feet also rehearses a kept way in further, as it does the whole piece's way of playing.

There are no random setbacks.

**Held by:** `tests/workbook.test.ts`, the defect tests, and the built app (§16): Work It Through on a brief's turn into
its second beat, 47.5 to 51.1, kept.

## 9. Partners And Direction

**The scene together** (`systems/ensemble.ts`) is kept apart from your own result. A partner's preparation, timing,
agreement and reliability blend into the dimensions a partner shares. A partner's slip is drawn from their
reliability, and your listening and adaptability cover part of it.

Your own result is judged as every piece is. With everything mastered it's exactly 100 whatever the partner did
(`tests/ensemble.test.ts`). Until this pass a paired scene stopped at 94 to 98 for a mastered student.

**A brief's reader** (`brief.reader`) is a recording, or a classmate who rehearses it with you. A callback is earned by
the take with its reader. Taped with a classmate on the built app, Nadia Donovan, the take was 51.0.

**Direction:**

- Past the lines and the blocking, a director's note names the part's worst problem: what you want, listening, pacing,
  behavior, transitions or the relationship. It gives its place and figure, and offers the workbook's ways at it.
- A note worked keeps its way and its evidence.
- At the next call it's taken only if the work answered it, or its problem left the forecast. A note left alone is said
  again as still there, and a later note answers what came of the last (`tests/direction.test.ts`).
- With every note worked and its change kept, a mastered actor's part is forecast at exactly 100
  (`tests/direction-mastery.test.ts`). It found 91.9 before kept ways were rehearsed in.

**A classmate can now be opened** from Your Partners: the critic's item 20, `ui/looks/classmate.tsx`. The look shows
their preparation, timing and agreement on the work you share, their reliability and trust, and what's happened between
you.

## 10. Whole-Piece Evaluation

`judgePiece` (`systems/piece.ts`) judges a piece segment by segment: a brief's beats, a scene's tones, a play's
movements.

**Within each segment:**

- its tones lean it;
- its rehearsal includes the work on it;
- stamina is read once, as a drain growing to the end;
- a slip carries into the next segment, less what composure and adaptability recover.

**The whole and continuity:** the whole is the segments' weighted mean. Continuity is shown, never added.

**The derivation is on screen:** a Part By Part table on the work's look, the brief, the scene and the rehearsal
process.

**Held by:** `tests/piece.test.ts` and `tests/connected-properties.test.ts`: bounded, monotonic, normalized, stamina
read once, and no draw at mastery.

## 11. Artistic Identity

**Read from history, never stored** (`systems/artistry.ts`):

- strengths;
- recurring weaknesses for life;
- familiar and unfamiliar material;
- habits;
- versatility;
- response to direction;
- reliability and collaboration.

Each line carries its evidence, and nothing is named before there's enough of it.

**What it informs:**

- **Brief suggestions:** an untried material, a way not usually played, the weakness that recurs. From this pass also
  a brief not yet taped for a weakness, and the genre the work knows least.
- **Recommendations:** the recurring weakness is said, with the pieces it has held back for life, and put first only
  when within half a point of the top.
- **A director's craft note** on that weakness says how many pieces it has held back.
- **The Profile's** Your Work So Far.

**No duplicate reward:** results are identical with and without the identity (`tests/defects-r8-1.test.ts`).

**Counted once:** a piece counts once for what held it back, not once for each dimension. A verifier found 15 counted
against 12 pieces; `tests/journey-limits.test.ts`.

## 12. The Mastery Contract

With full abilities, mastered techniques, complete preparation, a sufficient day and a fitting choice, every piece
comes to exactly 100:

- every brief, reading and fitting way, with a recording or a classmate (`tests/briefs.test.ts`,
  `tests/ensemble.test.ts`);
- paired scenes, whatever the partner (`tests/ensemble.test.ts`);
- nights, over every play's material (`tests/connected-properties.test.ts`);
- with a discovery kept (`tests/workbook.test.ts`);
- a part with its notes worked (`tests/direction-mastery.test.ts`);
- coursework, whatever the objective (`tests/coursework-objective.test.ts`).

Term standing at the ceiling no longer counts a mastered student as falling behind (`tests/term-growth.test.ts`).

## 13. Every Touched Feature Traced

`docs/verification/connected-journey/TRACE.md`, written by `tools/trace.ts`, traces 27 entries:

> Action → Preconditions → Costs → State → Consumer → Feedback → History → Later consequence

- **Its first run** found one row unconsumed (a screen that by rule changes nothing, now listed as read-only) and three
  commands no test drove: `tutorial.read`, `school.choose_playing` and `school.choose_part_playing`. Each is driven now
  (`tests/trace-commands.test.ts`).
- **The check** (`--check`) fails on an unconsumed row or an untested command, and passes.
- **The write-only fields the map named:**
  - `experience.materials` and an approach's best were removed;
  - `Showing.parts` was removed, since only a test read it;
  - `CLASS.bothGain` now moves the interpretation only where a scene's result reads it.
- **Dead controls:** a partner run on a scene that did nothing was removed. Others are listed under §17.

## 14. Freshness

`tools/freshness.ts` and `docs/verification/connected-journey/FRESHNESS.md`: two held-out seeds, nine months of school,
four students each.

**What it found:**

- the same brief offered after every take for a weakness;
- a mastered student steered to 7 old briefs, with 141 never offered.

Both were fixed, and are held in `tests/briefs.test.ts`.

**On the final code:**

| Student | Takes | Briefs | Scenes | Notes |
|---|---|---|---|---|
| Beginner, developing, specialist | 72 to 83 | each a new one | 18, none twice | none repeated after it was answered |
| Mastered | 66 to 76 | 30 to 35 | 18, none twice | none repeated after it was answered |

- For the first three students, 214 to 225 briefs were never offered. The best reading leaned the same way on 29% to
  42% of the briefs taped.
- The mastered student's repeats are one callback each (29 to 34), never two in a row.

## 15. Defensible Maths

- **Properties over drawn cases** (`tests/connected-properties.test.ts`, `tests/plan-rate.test.ts`):
  - bounded;
  - monotonic in work, rehearsal, stamina, load and a partner's preparation;
  - normalized leans;
  - stamina read once;
  - no draw at mastery;
  - the IRS plan rate never falling.
- **Determinism:** a played command sequence replays byte for byte across a save and a reload
  (`tests/determinism-played.test.ts`).
- **Held-out seeds:** freshness and the scenario saves.
- **Coefficients:** every size in ENGINE-MODEL §9 is labeled SLATE's estimate.
- **The catalog balance** (`docs/verification/BRIEF-BALANCE.md`, 298 briefs):
  - an input a brief doesn't read moves it by exactly 0 on all 298 (the tool had counted stamina, the drain, as unread);
  - tags moved 0 of 298 takes;
  - the weakness trained adds 2.63.

## 16. Built-App Journeys

`tools/acceptance-ui.mjs`, extended for this pass, ran on the build of the final tree, at 1440 and 390. Reports are in
`docs/verification/acceptance-ui/connected-2026-10-12/`.

| Width | Passed | Failed | Skipped | Page Or Console Errors | Past The Right Edge |
|---|---|---|---|---|---|
| 1440 | 44 | 0 | 2 | 0 | 0 |
| 390 | 44 | 0 | 2 | 0 | 0 |

**From a new life:**

- creation, the guide's locks, help (§3), the clock, Look After Yourself;
- coursework: preparing, a way of playing, table work;
- the interruption, where an advance stopped at 9:00 AM for a commitment and Stand Here kept it there;
- practice, money (a refusal in the engine's words, then the transfer), papers;
- save and exit, then Continue.

**From the scenario saves** (TEST SETUP marked in `tools/scenarios.ts`):

- **Rehearsal:** Learn The Part and Work On The Note on a Saturday save; then a way of playing chosen and rehearsed in
  at the next call.
- **Brief:** the brief opened, prepared and taped. Then the weakness trained, Work It Through on a beat, a classmate
  reading, and save and reload with every take kept.
- **Tax plan, lien, missed plan, withdrawal, nonfiler, leave:** each journey.

**The two skips, both honest:**

- Work It Through on the new life's scene found no way that could be tried at that hour; it's proven on the brief.
- The new life had no part with calls yet; that's proven on the rehearsal save.

**Saves cut for the journeys:** the rehearsal save at 0.6655 years (a Saturday before the festival's next call) and the
nonfiler save at 1.15 years (Connecticut assessed and not yet levied).

## 17. Defects

Found by the guide's authors and verifiers, by the trace, by freshness, by the critic and by the passes below. Each was
reproduced first, fixed at its cause and given a regression test. Each test was checked by undoing the fix, and was red
until the fix was put back.

**Round one** (`tests/defects-g*`, 31 groups):

- 109 findings confirmed against the tree; 62 excluded, each with its reason (already fixed, out of scope, not a
  defect).
- 108 fixed, 3 not reproduced.
- 11 needed the guide or tutorial, and were settled in the prose rounds.

**Round two** (`tests/defects-r*`) settled what the adversarial verifiers rejected:

- the menu and the command disagreeing on a meal, with a crash paying by card (a 2,448-case property sweep now holds
  them together);
- the partner's words after a rehearsal never improving;
- a card plan fee charged against the bank's own terms;
- a 24-hour time on screen;
- a graduate told they'd never get a number already coming;
- Terms Begun on a leave;
- the identity reaching recommendations and direction (§11).

**Round three:**

- a meal across midnight;
- linked savings stated three ways, now one rule for every payment, a card's autopay included (it bounced with savings
  full);
- the year of study on a leave;
- a Social Security number on its way.

**Found later and fixed:**

- a kept segment way never rehearsed in;
- `countWork` counting a piece per dimension;
- an IRS plan's rate falling mid-month, and a second plan erasing the first's months;
- a first-day body missing;
- the money look pricing a plan at the card's rate.

**Prose:** two rounds brought the tutorial, the reference and the docs in line with the fixed code, each checked
adversarially.

**Tests changed:** where a fix changed what an existing test asserted, the test was changed with its reason in a
comment, never loosened:

- the linked-savings scenarios now move a card's autopay with the primary;
- a direction test checks both halves of its own stated rule;
- the mortality test restores its own premise.

**The gate** ran on the final tree: `npm run gate` exited 0, read from a file. That's 258 test files and 2,706 tests,
then title-case, label-sweep, plural-check, voice-check, tics, doc-refs, wired, deciders, spelling, typos, geo-check,
inventory, devmap, traceability, capabilities and student-matrix.

## 18. This Report, And The Documents

**Brought up to date:**

- the tutorial;
- `docs/COVERAGE-MATRIX.md`;
- `docs/ATTRIBUTES-MATRIX.md`;
- `docs/GENRE-COVERAGE.md`;
- `docs/ENGINE-MODEL.md`, with §8 corrected where the pass made it false, and §9 new: the model, the measurements and
  the limits;
- `docs/UNBITTEN.md`;
- `docs/DEVMAP.md` and `docs/TRACEABILITY.md`;
- the handoff.

**The two registries** were held to one standard: Verified means a gate test drives the command and checks what it
claims.

- `docs/capabilities.json`, `docs/CAPABILITIES.md`: every one of the 156 player commands is now in a live row,
  enforced by `tools/capabilities.mjs --check`.
- `docs/GAMEPLAY-COVERAGE.md`: 190 rows verified, of which 56 (29%) were read against the standard by eye; 100 partial.
- The two agree on the 148 commands both name.
- Under that standard, capabilities' Verified fell from 35 to 5. That's the honest count.

## What's Still Short, Or The Owner's

- **A data question:** which banks belong in `ROUND_UP_AMOUNT` (`content/accountlife.ts`). It needs sources, not a
  guess.
- **The registries:** 134 of the 190 verified rows of `GAMEPLAY-COVERAGE.md` weren't read against the standard by eye.
  The page says so.
- **A craft note in the built app:** a scenario save with a director's craft note isn't reachable without a student who
  does their own work. The craft note's screen path is held by the engine tests.
- **The specialist trade-off** (§6) stands as SLATE's design: a specialist is about even on scenes built on their
  specialty, by the weakest term.
