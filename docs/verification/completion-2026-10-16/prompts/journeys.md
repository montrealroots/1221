# Brief 11, Journeys: School, Money, Papers And Health (2026-10-16)

Read `common.md` first. Your area is `journeys`; your clone is `…/scratchpad/journeys11`, branch `journeys11`.

Brief 11's sections 5 and 6 are yours: the two known defects first, then the rows, each traced through the journey it sits in:
Player Action → Preconditions → State Read → State Changed → Immediate Outcome → Scheduled Consequences → Player Explanation →
Save/Load. Record each trace in your result (`trace` on the row: one line per step, each naming the code and the test that
shows it).

## The Two Defects, First

Each is `added` work in your result (its id below, its reason, its impact), and each has a test that fails before its fix.

### `defect.yale-credit-hold`

A credit that clears an outstanding Yale balance leaves the financial hold. `liftHold` (`src/engine/systems/leave.ts`, about
line 774) lifts the hold only from `payBalance` and a term's aid (`aidOnAccount`); `creditAccount` (about line 788) doesn't
call it, and the comment above `liftHold` says why it was left so: no played life was found to reach a credit under a hold.

- Find every operation that moves the Yale account's balance (`chargeAccount`, `creditAccount`, `payBalance`, the term's aid,
  the late fee, a refund, a reversal), and reconcile the hold after each one that can bring what's owed to nothing.
- Clear only a hold whose own condition is met (`accountOwed(...) <= 0`). Leave every other restriction as it stands: a term
  begun under the hold still asks to register (`mustRegister`), and a degree waiting for an incomplete stays waiting.
- Play it through the commands: a student under a hold, then a credit through whichever player command or scheduled
  consequence gives one (a fee refunded, aid restored on appeal, a rebate). Say which reach one in play. Then check the
  hold is gone, said once, registration open, the diploma conferred where it waited only on the hold, and all of it across
  a save and a load.
- Add the opposite case: a credit that leaves something owed keeps the hold.
- `liftHold`'s comment is falsified by the fix: correct it in the past tense, dated.

### `defect.personality-year`

`tests/personality.test.ts`'s year on autopilot ("no single trait or disposition wears a life down > left on autopilot for a
year, at twenty-five and at sixty", and the year-long cases beside it) is said to end its simulated life about sixteen days
in. Reproduce it first: for each case, the simulated time between the first day and the last day it looked at, and whether
the life ended (and of what), recorded in your result.

- Make each year-long case run a year: assert the elapsed simulated time (at least 365 days from its start), and that the
  life it measures is alive at every day it reads.
- Don't rename a short run, don't disable mortality globally, and don't touch `tests/setup/ended-life.ts`. Where a draw
  of mortality ends a life inside the year, choose the case's seed or its set-up within what the test means to measure,
  and say what you chose and why.
- Keep separate tests for a death and for an ended life's clock. Find the existing ones; add one only where none holds.

## The Rows

| Row | What it lacks at the baseline |
|---|---|
| `health.enroll` (audit) | The duplicate-enrollment refusal and the other gaps its audit row names (`baseline.json`'s `missing`; `docs/verification/audit/` for the row's full text) |
| `l-actor` (audit) | No test opens the actor look on a migrated save carrying an `interest:` source (`tests/migration-94.test.ts` migrates one but doesn't open the look; `src/ui/looks/actor.tsx`'s `sourceWords`) |
| `tax.s8.f1_status` | The F-1's issue, term, grace, end and readers, with no gate test cited by title |
| `tax.s8.ssn` | The SSN's eligibility, application, card and readers, with no gate test cited by title |
| `tax.s8.opt` | OPT (I-765, the EAD): window, fee, decision, term, days without work, status, with no gate test cited by title |
| `tax.s8.license` | A license held from before (identity only since the scope reset), with no gate test cited by title |
| `tax.s8.visas_authorizations` | Visas, travel authorizations and Going Abroad, with no gate test cited by title |

For the `tax.s8.*` items, find the gate tests that already hold each part of the goal, read each one to see it really does,
and cite them by exact title. Write a played test only for a part none holds. A part that's out of the current scope (the
scope reset of 2026-10-09, `docs/REQUIREMENTS.md`) is said so with the line that puts it out.

The two audit rows also need a skeptic's check before the audit moves them. Write yours in the shape of
`docs/verification/pipeline/inputs/final-checks/*.json` (`rows: [{ id, claimed, holds, verdict, problems }]`) as
`docs/verification/completion-2026-10-16/journeys-checks.json`, claiming what your tests show. Don't run the pipeline:
the coordinator has the check read again by someone else and folds it.

## Section 6's Journeys

While you trace your rows, follow the brief's list where they lead: the Yale account's payments, credits, holds and
registration; health eligibility, billing, treatment and school consequences; papers' validity, applications and effects;
time advancing, a repeated command, a reload, an interrupted operation. A defect found there is fixed and recorded as
`added`. Don't write tests for behavior already held by a cited gate test.
