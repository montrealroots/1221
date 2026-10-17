# Brief 12, Acting: ST6-R (a), (c), (e) And (g) Revised (2026-10-17)

Read `common.md` first. Your area is `acting`; your clone is `…/scratchpad/acting12`, branch `acting12`.

## The Owner's Authorization (Brief 12, Section 1, Quoted)

> I approve judging restrained acting by meaningful, explainable gameplay benefits rather than requiring a specialist to
> beat a balanced actor a fixed percentage of the time.
>
> Revise ST6-R (a), (c), (e), and (g) individually around these requirements:
>
> - A valid restrained interpretation must have a measurable contribution from its relevant abilities.
> - Improving those relevant abilities must improve otherwise identical applicable work, except where a documented cap or
>   another legitimate limiting factor prevents an increase.
> - Preparation and scene circumstances must matter in the intended direction.
> - Restrained interpretations must have useful opportunities across varied suitable material.
> - Expansive interpretations must retain their own advantages where appropriate.
> - A specialist's strength must not erase unrelated weaknesses.
> - Tests must fail if restraint's intended ability contributions or circumstance effects are removed.
> - Maximum relevant mastery, full preparation, valid interpretation, and suitable conditions must retain the established
>   maximum-quality guarantee.
>
> Use controlled comparisons and representative existing material. Do not pick only convenient examples or add a special
> bonus to obtain a passing score.
>
> Define and justify replacement criteria before tuning or final validation. Compare the existing proposed replacement
> against this authorization; adopt it only where it fully satisfies these requirements.
>
> Keep the original definitions and results as historical evidence. Mark them superseded with this authorization, not
> retroactively passed. Close each replacement clause only when its own evidence supports it.

## Where It Stands

- **The originals** are in `docs/verification/decisions-2026-10-16/criteria.md` (ST6-R).
- **What brief 10 and brief 11 measured** is in `docs/verification/completion-2026-10-16/acting-result.json`: ST6-R.a's
  decision, the options measured and the sorting.
- **Brief 11 sorted the failures.** No gameplay is missing. Restraint's own abilities decide the restrained take: the
  "twin" with them at the even actor's level loses 3.33 to 8.15 on all 96 materials, and restraint's draws are 0.33 to
  0.90 of the lift. (a)'s 25% is reachable only by what the design rules out.
- **"The existing proposed replacement"** is brief 11's option 2: (a) restated in the restrained choice's own frame,
  restraint the specialist's better choice against the grain, 10 of 44 there, guarded by (b′) and the twin.
- **Already verified clauses** may hold some of the eight requirements, and you may cite them, each as it stands today:
  - (b′) and (d), (f), ST6-R's others;
  - H4-R (c), one strength not erasing an unrelated weakness;
  - ST5 and M1, the maximum-quality guarantee;
  - the twin tests in `tests/decisions-judge.test.ts`.

## How To Work It

1. **Write the replacement criteria first,** in `docs/verification/resolution-2026-10-17/acting-criteria.md`, committed
   before any test or code they govern changes. One replacement for each of (a), (c), (e) and (g): ids `ST6-R2.a`,
   `ST6-R2.c`, `ST6-R2.e`, `ST6-R2.g`. Each gives:
   - the original, quoted, with its results;
   - which of the owner's eight requirements it carries;
   - its measure: actors, budgets, material set, preparation, conditions and threshold, controlled comparisons on
     representative existing material, with how the set is chosen and why it isn't convenient;
   - why its threshold is the right one, worked from the requirement and not from a run;
   - what breaks it: the mutations that must fail it.

   Between them, the four must carry all eight requirements. Where an existing verified clause already carries one, say
   so and cite its test, still checked on the current code. Say exactly where brief 11's option 2 satisfies the
   authorization and where it falls short. Adopt it only where it satisfies it fully.
2. **Then measure and test.** Gate tests for every clause the gate can carry cheaply. Otherwise use
   `tools/interpretation.ts --st6` / `tools/acting-criteria.ts`, extended to the replacements, with the commands left for
   the coordinator's final run.
3. **Tests fail when restraint is removed.** Break each one in a copy: restraint's draws removed, its relevant abilities
   not read, the grain or the scene's circumstances not read, its preparation not read. Record what caught each.
4. **No engine change is expected.** If a replacement clause fails because of a real gameplay defect, fix it within the
   approved design and say so. Never fix it with a bonus, a convenient material set, or a criterion moved after a run. A
   judging change moves RULESET (common.md).
5. **Your result:**
   - Each original (`ST6-R.a` and the others): disposition `superseded`, status Explicitly Deferred, `deferredBy` quoting
     the owner's authorization, its results kept.
   - Each replacement under `replacements`: its status on its own evidence. Closed only when its evidence supports it;
     otherwise Implemented, Verification Incomplete or Decision Required, with exactly what's missing.
