# Brief 11, Advice: Repeated Advice And F2-A10's Remaining Clauses (2026-10-16)

Read `common.md` first. Your area is `advice`; your clone is `…/scratchpad/advice11`, branch `advice11`.

## What The Brief Says (Section 8)

> For repeated advice:
>
> - Test a player who follows the recommendation and a player who ignores it.
> - Advice should respond to actual progress and changing priorities.
> - Correct advice may retain the same target when its cause remains unresolved.
> - The player should receive state-aware explanations, progress, and useful next actions rather than an identical
>   recurring message.
> - Do not rotate to inferior advice merely for variety.
>
> For the remaining advice clauses:
>
> - Separate preparation improvements from ability-training benefits.
> - Compare like-for-like training budgets.
> - Explain small increases in predicted benefit when another relevant factor improves.
> - Preserve diminishing returns where the actual progression model provides them; do not impose a contradictory rule
>   merely to satisfy a slogan.
>
> Document any necessary criterion clarification before changing its test. Map it to the approved behavior and retain the
> earlier result.

## The Rows

| Row | Status | What it lacks |
|---|---|---|
| `L1` Repeated feedback changes or is acted on | Decision Required | the week's top recommendation stays 8 weeks (specialist) and 6 (beginner) on journeys whose student never trains it; L1 allows 4 |
| `advice.F2A10-f` | Decision Required | which preparation the criterion means; diminishing returns near mastery are a thousandth of a point where the engine's practice grows at a constant rate (`DEVELOPMENT.floor`) |
| `advice.F2A10-h` | Decision Required | nine held-out cases whose trained input's forecast rose by up to 0.001, from discipline's lift |
| `advice.harness`, `advice.F2A10-a`, `advice.harness-hospital` | Verification Incomplete | no gate test holds the harness's structure (tuning and held-out seeds apart; four bands, three stages; built through the commands), the hospital fix (adv-h-10, adv-h-57), or the split |
| `advice.tests` | Verification Incomplete | `tests/decisions-advice.test.ts` cited by file, not by title |

Each row's full record is in `baseline.json`; `docs/verification/decisions-2026-10-16/l1/README.md` and
`docs/verification/remaining-10/advice-result.json` hold what brief 10 measured.

## How To Work It

1. **L1: the player who ignores the advice.** The advice keeps naming the input whose training brings most (F2-A10 (b));
   it may keep the same target while its cause stands. What it says must change with the player's state: how long it has
   been the advice, what has moved since it was first given (the input's level, its forecast, the pieces it held back),
   and a useful next action the player can take now (which exercise, where, at what cost). Read where the advice is drawn
   (`src/engine/systems/experience.ts` recommendations, `src/engine/systems/advice.ts`, the screens that show it) and
   make the repeated message state-aware there. No rotation to an inferior input.
2. **L1: the player who follows it.** Played through the commands (twenty sessions of the advised exercise, as F2-A10 (h)
   plays them), the advice moves on, or the input rises.
3. **L1's criterion.** Its words ("changes or is acted on", at most 4 weeks running) contradict F2-A10 (b) on a journey
   whose student never acts. Write the clarification in `clarifications.md` first (common.md): the follower's target moves
   on or the input rises within L1's 4 weeks; the ignorer's target may stay, and its message changes each week with its
   state. Keep brief 10's figures (8 and 6 weeks) as the earlier result. Then make L1's test: both players, through the
   commands, across a save and a load. Leave the 120-day journeys' commands for the coordinator to run again.
4. **F2-A10 (f):** report the predicted gain from preparation apart from the gain from training the ability, each named
   as what it is, on the screen and in the forecast. Compare training on like-for-like budgets (the same hours).
   Diminishing returns are asserted where the progression model gives them (below `DEVELOPMENT.floor`'s level); past it,
   the test holds what the model gives (a constant rate), and the clarification says so.
5. **F2-A10 (h):** where a trained input's forecast rises a little because another factor (discipline's lift) improved,
   the advice says that's why. The test holds both: the explanation shown, and the rise bounded by what discipline's lift
   gives.
6. **The harness rows:** gate tests of the harness's structure, cheap enough for the gate (the seeds apart, the bands and
   stages, a case built through the commands, the hospital case built). Cite the tests in `tests/decisions-advice.test.ts`
   by their exact titles for `advice.tests`.

A change to what the advice says or forecasts is a change to the game's judging only if it moves a result. Say whether
yours does. F2-A's 40 cases and the held-out set's runs are the coordinator's to run again on the tested commit: give
their commands in your result.
