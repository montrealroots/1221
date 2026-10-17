# Brief 11: What Every Area Works To (2026-10-16)

The owner's brief: `docs/verification/briefs-2026-10-16/11-finish-the-current-build-against-a-fixed-checklist.txt`.
Read it whole first, then `CLAUDE.md`, then this folder's `README.md`, `baseline.json` and `classification.json`, then
the handoff's first section. **This is a completion pass, not an expansion.** Your rows are the classification's rows whose
`area` is yours; each ends with one of the owner's seven statuses and the evidence that status needs.

## Where You Work

Your own clone: `/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad/<area>11`, branch
`<area>11`, at the commit that added these instructions, `node_modules` linked. Commit there; never push. Another area
works in its own clone at the same time; the coordinator brings each clone's commits onto the branch.

## What Verifying A Row Means

For each of your rows:

1. Name the exact behavior not yet proved, from the row's acceptance criteria and what the matrix says it lacks
   (`baseline.json`: its `goal`, `preconditions`, `validation`, `evidence`, `missing` or `gap`).
2. Read its current implementation.
3. Exercise it through the public engine command or the drawn screen a player uses, the way the existing played tests do
   (`sim.execute({ kind, payload })`, the screens drawn with `renderToStaticMarkup` under the mocks those tests use).
4. Check what it should change downstream, and that it survives a save and a load (`loadSave(deserialise(serialise(…)))`).
5. Fix any defect it exposes. Each fix fails its test before the fix and passes after.
6. Leave a regression test that would fail if the behavior stopped holding. Extend a useful existing test before writing
   a new file. Label a test as the house does: `PLAYER JOURNEY:` where it's played through the commands,
   `FIXTURE:` and `GUARD:` where it isn't, `TEST SETUP:` said where state is written by hand.
7. Break each new claim in a copy (never the clone's own tree, never the shared tree) and record what caught it. A
   mutation that survives usually means a redundant guard; say which.

A row isn't verified because a function exists, a document describes it, or an unrelated test passes. Where a row's
acceptance can't be held by a test at a cost the gate can carry, say so in your result, and leave its measurement (command,
seeds, output file) for the coordinator to make again on the tested commit.

## What You Don't Do

- **Decision 4's rows are untouched:** the twelve audit rows, its three decision rows, the banking area's eight items for
  the same commands. Don't implement, defer, reclassify, remove or close them. Don't restore a removed system.
- **No new features, no catalog growth, no redesign of working systems, no new acceptance requirements.** Work is added only
  to fix a defect you find or to complete one of your rows. Record each addition in your result with its reason and impact.
- **No criterion changes to make a failure pass.** Where a criterion contradicts the approved design, write the
  clarification in `docs/verification/completion-2026-10-16/clarifications.md` (the criterion, the approved behavior it maps
  to, quoted from the brief or decision that approved it, the clarification, and the earlier result kept), commit it, and
  only then change its test. A proposed criterion isn't approved because it passes.
- **No weakened assertions, no deleted difficult cases, no skipped tests.**
- **The shared records are the coordinator's:** `criteria.py` and `criteria.json`, the handoff, `docs/verification/audit/`,
  `docs/GAMEPLAY-COVERAGE.md` and the pipeline's inputs. Your result says what each should record; the coordinator writes it.
- **Five areas share four processors.** Run one test file at a time, and leave a measurement that takes more than ten
  minutes (the 120-day journeys, F2-A's cases, `measure.sh`) to the coordinator, with its command.

## The House's Rules That Bite Here

- **Changing what the game judges** moves `RULESET` (`src/engine/content/tasks.ts`) to `evaluation-12 (2026-10-16)` and adds
  its row to `docs/ENGINE-MODEL.md`. A save from before opens through a one-time step in `ONCE_ON_OPENING`
  (`src/engine/index.ts`) where its kept data needs moving. The save schema (94, in two places) moves only where a field's
  meaning changes, both places together (CLAUDE.md, Rule 14).
- **Prose is load-bearing.** A comment your change falsifies is part of your change: what's no longer true goes in the past
  tense, dated. A renamed test gets its old and new titles in `docs/verification/pipeline/inputs/renames.json` and a dated
  comment in the test.
- **Tests one file at a time:** `VITEST_MAX_FORKS=1 VITEST_MIN_FORKS=1 npx vitest run <file>`. The setup file
  `tests/setup/ended-life.ts` runs before every file.
- **The container restarts** and loses background processes, keeping files. Run anything long in the foreground in parts,
  each part's output to a file.
- **Before your last commit:**
  - `npm run typecheck`, `npm run lint` and every test file you touched, each exit 0;
  - `node tools/devmap.mjs --write` and `node tools/traceability.mjs --write` where you added a test file;
  - the document checks: `node tools/doc-refs.mjs --check`, `tics.mjs --check`, `voice-check.mjs --check`, `spelling.mjs`,
    `typos.mjs`, `title-case.mjs --check`, `label-sweep.mjs`.
- **Commit trailer:**

```
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01977Z2bLodCspXyxELfcefM
```

## Your Result

`docs/verification/completion-2026-10-16/<area>-result.json`:

```json
{ "area": "<area>", "commits": ["…"], "rows": [ {
    "id": "…", "group": "…", "baselineStatus": "…", "status": "one of the seven",
    "notProved": "what the baseline lacked", "exercised": "how you exercised it",
    "evidence": [ { "file": "tests/….test.ts", "title": "describe > it, exactly as vitest names it", "kind": "player journey | fixture | guard | measurement", "proves": "…" } ],
    "fixes": [ { "summary": "…", "where": "…", "failingTest": "…" } ],
    "mutations": [ { "what": "…", "caughtBy": "…" } ],
    "missing | gap | blocker | decision": "what its status needs, where it isn't verified"
  } ],
  "added": [ { "id": "…", "reason": "…", "impact": "…" } ],
  "defectsFound": [ { "what": "…", "blocksCompletion": true } ],
  "checks": [ { "cmd": "…", "exit": 0 } ] }
```

Every `evidence[].file` is one path in the repository, never a scratchpad path. A rerun of a whole file is `{ "file", "ran" }`
with no title. Your final message: each row's status with its evidence, every commit, every check and test file with its
exit code, every addition and its reason, and what remains and why.
