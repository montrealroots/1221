# Your Area: The Acting Criteria (Key `judge`)

Read `common.md` beside this file. Your section of the brief is 1, in full; your criteria are ST3-R, ST6-R, H4-R and
L3-R, and M1 (`../criteria.md`, section 1), and every criterion section 5 lists must hold after your change.

## Where You Work

Your own clone: `/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad/judge10`, branch
`judge`, at the commit that added these instructions (the criteria's `2e8e4db3` and the instructions). Commit there; never push. The stamina area builds a performance's workload in its own clone at
the same time (`PIECE.load`, `loadOf`, the plays' running times, a night's call and energy in `systems/school.ts`): don't
edit those. When its work is integrated, the launching session brings it into your clone and tells you; H4-R's stamina
parts, ST3-R and L3-R are measured finally after that.

## The Order

1. **The measurements, exactly as the criteria say,** before anything in the judge changes: ST3-R (a) to (e) on
   `tools/interpretation.ts -- --st3`; ST6-R (a) to (g) on `-- --st6`; H4-R (a) to (e) on `tools/ag-baseline.ts` and
   `tools/ag-criteria.mjs`; L3-R (a) to (e) on `tools/brief-journeys.ts` (the fixed set of 24 committed before it's run,
   four profiles on two seeds) and a catalog-wide monotonicity sweep; M1. Each criterion's "it catches what it should"
   clause is a set of mutations run in a copy, and each must fail. Commit the tools, then measure on the engine as it was before your changes (`2e8e4db3`'s)
   into `docs/verification/decisions-2026-10-16/baseline/`.
2. **Profiles and budgets.** The criteria require equal budgets, printed with the results. A lead to check first:
   `tools/interpretation.ts` builds the restrained specialist as `actor({ emotionalDepth: 85, composure: 75, focus: 75 },
   fill(235))` with `fill = (n) => (600 - n) / 8`, which spreads the rest over 8 abilities where 9 are left, unless
   `actor` sets one apart; if the specialist's budget isn't the even actor's, every ST6 figure so far compared unequal
   budgets. Find out, fix the tool if it's wrong (a dated comment saying what it did), and say what it changes.
3. **Fix what fails**, each change justified as the criteria require:
   - ST6-R: where (b) fails, how restraint is read, from a source (restraint's draws are quoted at `APPROACH_EFFECT`);
     no bonus, no difficult case removed, expansive acting kept where it works.
   - H4-R: where an ability lacks five pieces of its own in two kinds, or its specialist's advantage there is short,
     in-scope material or exercises read from public-domain texts or written for SLATE (as `content/scenes-house.ts`
     and `content/scenes-scored.ts` were, each committed before it's measured), or a defect in how the ability is read.
     Stamina's own work waits on the stamina area's model; presence, discipline and the rest don't.
   - L3-R: any regression the sweep or the journeys find.
   Every change to the judge moves `RULESET` and its ENGINE-MODEL row; tests' expected figures are worked from the rule.
4. **Tests**, in `tests/decisions-judge.test.ts`: identical-input consistency, the stage and the close frame differing
   where they should, restrained and expansive interpretations (wins and limits), every ability's contribution on its own
   work, a specialist's and a generalist's development, controlled improvement over time, mastery at 100.
5. **Measured again** after your changes, and again once the stamina model is in: everything section 5 of the criteria
   lists, into `docs/verification/decisions-2026-10-16/judge/`.

Your result: `docs/verification/remaining-10/judge-checklist.json` and `judge-result.json`, each criterion clause an
item, with the original's last figure, the replacement's figure before your changes and after, and any remaining
specialist weakness named with its cause.
