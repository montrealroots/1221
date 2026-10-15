# What To Improve Next, Forecast, 2026-10-16

The owner's brief "Finish Genre Interpretation, Improve Training Advice, And Prove Long-Term Integration", part 2. The
measure was written before it was first run (`criteria.md`); `tools/advice.ts` plays it, through the harness
`tools/advice-harness.ts` that `tests/advice.test.ts` shares. Not merged, not deployed.

## The Cause

F2 (first-named weakness the largest gain) was 303 of 447 (67.8%) on `1bb76ac`. It read the take's first ability or
technique limit, and the advice ranked inputs the same way (`recommendations`, `systems/experience.ts`). Of the 144
misses:

| Cause | Misses | Example (actor 0) |
|---|---|---|
| Split across dimensions | 61 | brief-detective: memory was named (execution 3.4). Focus is read by execution 2.7, consistency 0.7 and interpretation 0.6, 4.0 in all, and +20 on it gave 2.1 against memory's 1.7 |
| Made whole against grown | 46 | brief-alternate_history: emotional depth (at 59) was named for its room to full. Imagination (at 75) gave 1.9 against 1.5 |
| Ties | 20 | the gap was one rounding step (0.1) or less |
| Other non-linearity | 17 | the weakest-dimension share of the whole, and the curve |

Two more things the advice did:
- **Only three limits.** It read only the three costliest limits a piece kept (`recordWork` truncates them). Summing
  every limit an input had was worth 346 of 447 even before forecasting.
- **No cost.** It never weighed what a remedy costs in hours, or the slower growth near full.

## What Changed

- **Two questions, two answers.**
  - **What held a take back most** stays the take's own chief limit, on its line, as it was.
  - **What to improve next is forecast** (`systems/advice.ts`). For each ability and technique the recent work read (all
    of them, not three), the level twenty hours of its exercise would reach on the growth curve practice really follows
    (`abilityGain`, its diminishing returns, the discipline lift). Then the recent work is worked out again
    (`replayAs`), with the player as they are now and with that one input at the level it would reach. The difference,
    weighted to the latest, is what the hours are worth.
- **Read-only and repeatable.** It reads the work records and the levels only, so nothing in the save changes, and the
  same save gives the same advice.
- **Near-ties are said.** Two options within a tenth of a point, or a tenth of the larger, are "about as useful", and
  the first says so ("either is a sound next step"). The recurring weakness goes first only where it's about as useful
  as the top.
- **It moves on.** An input at full drops out, and the next comes first. The forecast reads levels as they are now.
- **The pane says where the answers differ.** Where the chief limit isn't what pays most to train, the brief's pane says
  so and why.
- **One function for every reader.** The pane, the Profile and the tools that play a student all call `adviceFor`.
- **Where there's no forecast**, with no work kept under today's rules, the advice is as it was.

## Results (F2-A, `criteria.md`)

Forty played cases, each a student who taped three briefs through the commands, with every candidate input trained for
twenty days through `practice.exercise` in its own copy of the save, against a baseline copy (`played-cases.json`):

| | Designed (adv-0 to 9) | Held Out (adv-10 to 39) |
|---|---|---|
| The advice's first, the largest realized gain (within a tenth) | **10 of 10** | **30 of 30** |
| The advice as it was | 8 of 10 | 8 of 30 |
| The chief limit as advice | 4 of 10 | 5 of 30 |
| The advice's first was the chief limit | 3 | 5 |
| A near-tie said | 1 | 6 |

- **Without credit for a declared tie**, the advice is still within a tenth of the best in 40 of 40, and names the exact
  best in 37.
- **Forecast against realized**, over 529 candidates, the gains correlate at 0.88. Every realized gain is about a
  quarter of a point above its forecast. That's what any day of practice brings beyond its own target (the discipline
  lift, transfers), the same for every copy, so it doesn't change the order.
- **F2 as written** (`tools/ag-baseline.ts` §8, the chief limit with +20) is still 303 of 447 on this code, reported as
  it was. It measures the chief limit, which now answers what held a take back, not what to train.

## Proof

- **The tests** (`tests/advice.test.ts`, 5):
  - diminishing returns;
  - an input read across dimensions comes before the chief limit, with every input a candidate;
  - an input at full drops out;
  - a near-tie is said;
  - a played case (adv-2), where the advised input's twenty days realized 1.1 points against the chief limit's 0.63,
    with the save unchanged by advising and the advice the same twice.
- **The journey.** `tests/interpretation-journey.test.ts` checks the advice through a reload, and that it moves on once
  the advised input is trained.
- **Mutations.** Six, each killed (`../interpretation-2026-10-16/mutations.json`, A1 to A6): ranked least first; from the
  limits not the forecast; growth without diminishing returns; no tie ever said; an input at full still advised;
  candidates only the kept limits.
- **A defect the tests caught.** Ranking by the rounded figure let the alphabet order two forecasts of 0.82 and 0.80.
  Ranking now uses the forecast's own figure.

## Limits

- The forecast is training. Preparation, a day's condition and a choice that didn't fit keep their own advice, as
  before, ranked beside it by what they cost a piece.
- Twenty hours is SLATE's horizon. A longer one would favor inputs with more room; this one is about the next few weeks.
- A transfer from one exercise to another target isn't forecast. It's the same for every candidate in the played
  measure, which is why the realized gains run about a quarter of a point above the forecasts.
