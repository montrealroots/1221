# Brief 12, Advice: F2-A10 (f) And (h) Resolved (2026-10-17)

Read `common.md` first. Your area is `advice`; your clone is `…/scratchpad/advice12`, branch `advice12`.

## The Owner's Resolution (Brief 12, Section 2, Quoted)

> I approve advice that accurately reflects the actual progression model.
>
> A predicted benefit does not have to fall after every training period if discipline, preparation, or another relevant
> factor legitimately increases it. A recommendation may remain the same when its cause remains unresolved.
>
> For F2-A10 (f):
>
> - Separate ability-training benefits from preparation benefits.
> - State what preparation and genre knowledge the forecast assumes.
> - Compare forecasts with actual training results under the same assumptions and budget.
> - Never present an unprepared take as fully prepared without explaining that counterfactual.
> - Show the player whether preparation, ability development, or both deserve attention.
>
> For F2-A10 (h):
>
> - Require the recommendation and its forecast to update correctly after training.
> - Permit an unchanged recommendation when it remains the best justified option.
> - Permit a benefit increase when the engine can attribute it to a legitimate changed input.
> - Require an explanation of that increase.
> - Detect stale recommendations and unexplained forecast changes.
> - Do not rotate to inferior advice merely for variety.
>
> Preserve the original results. Write the clarified criteria before final validation.
>
> Because previous held-out cases have now informed these clarifications, use additional fresh validation cases. Keep the
> earlier set as regression coverage rather than describing it as unseen validation.
>
> Test players who follow advice, ignore it, partially follow it, change their work, and reach mastery.

## Where It Stands

The full record is `docs/verification/completion-2026-10-16/clarifications.md`: F2-A10 (f) and (h), each with brief 11's
clarification and its held-out result. `integration-result.json` there has the rows' decisions.

- Brief 11's clarifications held on tuning seeds but not on the held-out set: (f) 110 of 111, (h) 116 of 120. The cause:
  the forecast is in points of result, and what an ability point is worth is the judge's curve, which the forecast reads
  truly.
- On the held-out set, every case fell, or rose within discipline's lift and said so: 120 of 120.
- The advice already keeps `Forecast.preparation` and `forecastAtDiscipline`, and says how long it has stood and what has
  moved (`src/engine/systems/advice.ts`, `experience.ts`, `next-steps.ts`).
- Tests: `tests/decisions-advice.test.ts`.
- The harness: `tools/advice-harness.ts`, `tools/advice.ts`.

## How To Work It

1. **Write the clarified criteria first,** in `docs/verification/resolution-2026-10-17/advice-criteria.md`, committed
   before any test or code they govern changes:
   - each owner bullet as a measurable clause, with what would fail it;
   - (f) and (h) as written, and brief 11's clarifications with their results, kept beside them;
   - a stale recommendation and an unexplained forecast change, each defined so that a run or a test detects it.
2. **Fresh validation cases.** Add a new set to the harness, stratified as the held-out set is (four bands, three stages,
   ten seeds each), under a seed prefix never run before, e.g. `adv-v-0` to `adv-v-119`.
   - The harness refuses it as it refuses a held-out seed, unless asked for explicitly, and a gate test holds that
     refusal and the split.
   - **Never run a fresh case,** not even one, not in a test or a probe. The coordinator runs the set once, on the tested
     commit.
   - Brief 11's held-out set becomes regression coverage, and the harness, the summary and the docs say so.
   - Make the summary report every clarified clause on the fresh set, by stratum.
3. **Implement what the clauses need and the code lacks.** Then hold each in the gate through the commands and the drawn
   screens:
   - the forecast saying what preparation and genre knowledge it assumes;
   - an unprepared take shown with its counterfactual said;
   - whether preparation, ability development or both deserve attention;
   - a rise explained by the input that changed;
   - a stale recommendation or an unexplained change detected.
4. **The players the owner names,** each played through the commands across a save and a load:
   - one who follows the advice, and one who ignores it;
   - one who partially follows it (some sessions, or another exercise);
   - one who changes their work (another genre, or another kind of piece);
   - one who reaches mastery.

   For each, assert what the recommendation and its forecast do, and what the player is told.
5. **Your result:** `advice.F2A10-f` and `advice.F2A10-h`, each `closed` only where the gate holds every clarified
   clause on tuning seeds and the fresh run is left to the coordinator with its command and the figures that close it.
   Say if anything judged moved.
