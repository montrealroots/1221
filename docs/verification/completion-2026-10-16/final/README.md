# Brief 11's Criteria On The Tested Commit, 2026-10-17

Brief 11's areas changed files every judge measurement reads: `src/engine/systems/material.ts` (an ability's readers, for
its look), `src/engine/systems/briefs.ts` (the advice noted as a brief is taped), `src/engine/systems/leave.ts` and the
guide. So every criterion was measured again on the tested commit, `81eadac9`. The measurements ran in a clone at that
commit through `../../decisions-2026-10-16/measure.sh <this folder> <part>`, every part but the two mutation runs, in
three lanes beside the long runs (`../runs/`). Every exit is 0 (`exits.txt`). Its first line counts one file
uncommitted: the run's own output folder.

**Every output is byte for byte the same as brief 10's final measurements** (`../../decisions-2026-10-16/final/`), except
for fields this pass added to two tools:
- `st6.json` has `ST6R.sorting` and `ST6RAtTheBudgetBefore.sorting`, the acting area's sorting of ST6-R's failures
  (`tools/acting-criteria.ts`).
- Each `journey-*.json` has `recommendations.longRuns`, `longestSameMessage` and `longestSameState`, the advice area's
  record of each week's message (`tools/brief-journeys.ts`).

Every field the two folders share is equal. That covers:
- the stage's ST3 and ST6, and the attribute criteria;
- the H4-R indirect probe;
- the eight journeys and their L3 traces;
- the four monotonicity parts and their merge;
- L3-R;
- the genre signatures, identity and audit.

So nothing this pass changed moved anything the game judges, and RULESET stays evaluation-11.

`figures.json` is `../../integration-2026-10-16/integrated-09/figures.py` read from these outputs, the same file as brief
10's. `../../integration-2026-10-16/criteria.py` reads it for the completion matrix, the measurement's commit `81eadac9`.

L1, from the journeys:
- **As written:** the week's top recommendation ran 8 weeks for the specialist and 6 for the beginner on `bj-0`, as on
  brief 10's code, so not met.
- **As clarified** (`../clarifications.md`): on all eight journeys no message repeats from one week to the next
  (`longestSameMessage` 1, `longestSameState` 1), and in every run longer than four weeks each week states something
  new: focus 8 weeks with 7 new states for the specialist, 6 with 5 for the beginner and the developing actor.

The mutation runs weren't made again. They break the judge's rules in a copy and read whether a measurement or
`tests/decisions-judge.test.ts` catches each. The acting area ran the ST6 criterion mutations and 18 test mutations on
its own code (`../acting/`). Of the files those mutations edit, no source file has changed since: the approaches,
coursework, interpretation, piece and evaluation sources. One tool has: `tools/brief-journeys.ts` gained the advice area's
record of each week's message, which reads the journeys and changes nothing they play.
