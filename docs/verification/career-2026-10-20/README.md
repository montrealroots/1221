# Brief 19: Professional Career Foundation And The First Individual Agent, 2026-10-20 To 2026-10-21

The owner's "Professional Career Foundation And The First Individual Agent"
(`../briefs-2026-10-16/19-professional-career-foundation-and-the-first-individual-agent.txt`, kept verbatim): the step
from drama student to professional actor, with one real agent in depth and one complete playable career loop. Brief 18
stays paused but for the items this needed (D1 to D9).

## Where It Started

- **The branch:** `claude/peaceful-hamilton-59zdbb` at `c9769be0`: `main` at `469f8448` (#47) with brief 18's paused
  records. The game had no career: the owner's scope reset of 2026-10-09 removed the industry, the agencies and the
  School's way into them, and this brief is the owner's word to build a new beginning, not the old engine restored.
- **The criteria first:** `criteria.md` (60 items, each Open until the game does it and a test fails without it),
  `design.md` (binding: the agent's limits, the pathways, the record, the agreement, the work loop, who builds what) and
  the research in `../../research/career-2026-10-20/`, each fact with its source, the date it was read and its words.
- **The tested commit** is `728b4972`. Every final run was made on its game. After it came documents, the journeys tool's
  check 2 (`9afb8548`), and nothing under `src/`.

## What Was Built

Each part in its own clone and branch, merged with its report:

| Part | What It Is | Report |
|---|---|---|
| The understudy's part (D6, brief 18's U1) | an understudy covers a named part, from casting to credit | `understudy/REPORT.md` |
| The clock (D1 to D5, brief 18's S1 to S5) | each stop's own choices; Tomorrow Morning the next seven; Sleep from the hour and the next commitment; the dialogs holding the clock; On The Way foreseeing | `time/REPORT.md` |
| The core | the professional record, the agent's data, the work's data, the portfolio (headshots, résumé, reel) with provenance | `core/REPORT.md` |
| The showcase (W1, W2, A5) | the Actor Showcase as DRAM 793b's own, at each year's dates; no early degree, as the Bulletin says | `showcase/REPORT.md` |
| The agent (G1 to G8, W3, A2) | the relationship with Jordan Parente's office, his interest factor by factor, the agreement and its end, the School's follow-up | `agent/REPORT.md` |
| The pay (D7, D8) | payments promised then paid once, commission only when owed, wages with their withholding, permission to work and OPT, the unions, the Work tab | `pay/REPORT.md` |
| The work loop (J1 to J5, A3, A4, D9) | from a posting to a credit, the agent's submissions, the unsigned path, work while enrolled, a leaver's routes | `work/REPORT.md` |

The agent is a real person, Jordan Parente of Stewart Talent's New York legit department, depicted only from what's
published and marked fictional wherever he speaks ("Fictional: his words and decisions here are invented."). Every
project, company and casting office is invented. Nothing contacts anyone outside the game.

## How It Was Verified

- **Played as a player plays it** (`playthroughs/REPORT.md`): two lives from the last term's first morning through the
  showcase, the follow-up, Commencement, the meeting, the agreement and a paid job, and an older graduate's save and a
  mid-term save carried on into the career (V1, A1, L1, V16, J6), every notice, stop and press written down
  (`playthroughs/transcripts/`, played again on `a483247d` once the defects below were settled).
- **The built app** (`app/REPORT.md`): the career's 52 surfaces walked at 1440 and 390 from the keyboard, each held to no
  errors, no sideways scroll, every control named and reached, and its words read in the order a player meets them (V17's
  automated half, T1). An automated walk isn't a person's look, and V17 waits on the owner's.
- **Audited by a reader who wrote none of it** (`audit/REPORT.md`): the 22 career commands read against the standard,
  four times. The first reading verified 13 and left 9 partial; the second, once the played journeys landed, 18; the
  third and fourth, against tests written for each gap they named, all 22. Each gap is in its row, rewritten in the past
  tense once closed.
- **Mutation-tested:** each part's `mutations.txt`, the audit's four rounds (`audit/mutations*.json`), and the
  integration's, I1 to I27 (`integration/mutations.txt`). Where a mutation survived, the code it showed redundant went
  (I6) or a test was added that kills it (I12, and the audit's Q14 to Q17 and R8 to R10).
- **The owner's route** (`PLAYTEST.md`): forty minutes from the last term to the first pay, on saves made by playing one
  life, its setup checked on a build (`playtest-check.mjs`, `playtest-check.txt`).

## What The Verification Found And Fixed

On the working branch after the parts merged, each with its test and mutation:
- reliability counted a missed work day twice, once as material not sent (`request-missed`, I9);
- a role played was posted to the actor again and booked twice (I10, I11);
- Low Budget and Ultra Low Budget pay stayed at their 2026–27 figures in 2029; they follow the contract year at the rate
  sheets' shares now (I13, I15). LORT stays at the figure read, an assumption said at `minimumOn`;
- an understudy's School credit read "went on 1 time" (I14);
- Equity's ending with no offer could never be refused for work going on, the check reading only a work day's hours
  the clock passes whole; it holds for the whole employment now, as S27 says (I23, I24);
- Equity's 90 days weren't extended by the days employed, as S29 says; they are now, and the refusal says by how many
  (I26, I27);
- the journeys tool's check 2 read both showcase scenes' records for each (a tool, not the game; `9afb8548`).

Found outside the career, not changed: every played life's credit card limit rose 20% every six months with no ceiling
(life A's to $194,736), which belongs to banking and paused brief 18 (`playthroughs/REPORT.md`).

## The Final Runs

`final-runs/runs/README.md`. Brief 17's lanes again on `728b4972`, each step exit 0, compared with brief 17's file by file
(`final-runs/numbers-same.json`):
- **The judge's outputs:** all 35 brief 17's in every number (`final-runs/final/README.md`).
- **The advice:** brief 17's in every number; F2-A 40 of 40, and F2-A10's rows close as before.
- **The built app:** 77 of 77 at each width; brief 13's three interface playthroughs every step at each width; brief 14's
  three journeys every step, banking's step 8 passing where brief 17's failed it.
- **The long runs:** 24 lives, 20 graduated and the autopilot control's 4 dismissed, as before, breaches 0; the mastery
  plans 6 of 6 at 100, each a few days sooner. Most differences start in the last term brief 19 changed; two lives'
  monthly records first differ earlier, in November 2027 and June 2028 (`final-runs/runs/README.md`).
- **The journeys:** brief 13's 25, played to the end, all ten checks passed in each, each ending as brief 17's, once the
  journeys tool's check 2 read each showcase scene's own record (`9afb8548`, `a9654e24`).

## The Gate

`npm run gate` in a clean clone of `a6b82e07`, the commit that holds every final run's record, its exit read from the
file it wrote (`final-runs/runs/gate.txt`): **exit 0**. 421 of 421 test files and 5,080 of 5,080 tests passed, none
skipped, then all 21 checks, the completion matrix last. After it came documents only: this receipt, the gate's own
figure folded in, the criteria's V18 and the handoff.

## Completion

- **Brief 19's criteria** (`criteria.md`): 59 of 60 Fixed And Verified. V17 is blocked on the owner: its automated half
  holds, and the person's look at desktop and mobile it also names is theirs.
- **The completion matrix:** 634 of 658 rows in scope Implemented And Verified (96.3%); 20 Implemented, Verification
  Incomplete, 0 Partially Implemented, 0 Not Implemented, 0 Blocked Externally, 4 Decision Required, 40 Explicitly
  Deferred. The 20 are earlier briefs' rows: twelve commands no current life can reach and eight banking decisions for the
  owner. It read 566 of 636 before brief 19's core merged; the parts' new rows, the audit's four readings and the final
  runs moved it (the handoff's top section has each step).

Test counts aren't a claim that the career is finished or right: they say what was checked. What wasn't is said above
and in each report.

## What's Left, And Whose It Is

- **V17's person's look** at desktop and mobile: the owner's. `PLAYTEST.md` is the route.
- **The real agent:** written permission, or a fictional agent in his place (one data entry): the owner's.
- **The card limits** compounding with no ceiling: banking's, in paused brief 18.
- **Brief 18** stays paused, its nine areas not begun; brief 19 did its D1 to D9.
- **Nothing is merged or deployed.** Merging to `main` and any Base44 deployment wait on the owner, after the gate.
