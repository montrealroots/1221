# Brief 12: What Every Area Works To (2026-10-17)

The owner's brief: `docs/verification/briefs-2026-10-16/12-resolve-the-remaining-decisions-and-complete-the-authorized-build.txt`.
Read it whole first, then `CLAUDE.md`, this folder's `README.md`, the handoff's first section, and
`docs/verification/completion-2026-10-16/RECEIPT.md`. **This is a close-out of the authorized scope: no expansion, no
removed system restored, no completed work restarted.** Your rows are in this folder's `README.md`. Each row's full record
is in `docs/verification/completion-2026-10-16/baseline.json`, with brief 11's work on it in that folder's `*-result.json`.

## Where You Work

Your own clone: `/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad/<area>12`, branch
`<area>12`, at the commit that added these instructions, `node_modules` linked. Commit there; never push. Other areas work
in their own clones at the same time, and the coordinator brings each clone's commits onto the branch. Never touch
`/home/user/1221`, another clone, a stash or a worktree.

## What Closing A Row Means

The owner: "Do not treat approval alone as completed implementation. Supply the necessary code, player-facing
explanations, tests, and evidence." For each row:

1. **Write the criterion first.** Write what will close it, mapped to the brief's words, in
   `docs/verification/resolution-2026-10-17/<area>-criteria.md`, and commit that before any test or code it governs
   changes. Keep the original's words and results beside it.
2. **Exercise it the way a player does.** Use the public engine command (`sim.execute({ kind, payload })`) or the drawn
   screen (rendered with `renderToStaticMarkup` under the mocks the existing tests use), with its downstream effects and
   a save and a load (`loadSave(deserialise(serialise(…)))`).
3. **Fix any defect it exposes.** The fix fails its test before and passes after.
4. **Leave regression tests** that would fail if the behavior stopped holding. Extend a useful existing test before writing
   a new file. Label each as the house does: `PLAYER JOURNEY:`, `FIXTURE:` or `GUARD:`, with `TEST SETUP:` said where
   state is written by hand.
5. **Break each new claim in a copy** (never in your clone's own tree) and record what caught it. A mutation that survives
   usually means a redundant guard; say which.

A row isn't closed because a function exists, a document describes it, or an unrelated test passes. A measurement the gate
can't carry goes in your result as its command, seeds and output file, for the coordinator to make on the tested commit.

## What You Don't Do

- **Decision 4's rows are untouched:** its twelve audit rows, its three decision rows and the banking area's eight items.
- **No new features, no catalog growth, no redesign of working systems.** Work is added only for a concrete defect or a
  necessary dependency, recorded in your result with its reason and impact.
- **No weakened assertions, no deleted difficult cases, no skipped tests,** and no special bonus or convenient example
  chosen to make a criterion pass.
- **The shared records are the coordinator's:** `docs/verification/integration-2026-10-16/criteria.py` and the files it
  writes, the handoff, `docs/verification/audit/`, `docs/GAMEPLAY-COVERAGE.md` and the pipeline's inputs. Your result
  says what each should record.
- **Contact no institution or person,** and send no message on the owner's behalf. Reading public pages is research.
- **Run one test file at a time** (`VITEST_MAX_FORKS=1 VITEST_MIN_FORKS=1 npx vitest run <file>`): four areas share
  four processors. Leave a measurement longer than ten minutes to the coordinator, with its command.

## The House's Rules That Bite Here

- **Changing what the game judges** moves `RULESET` (`src/engine/content/tasks.ts`) to `evaluation-12 (2026-10-17)` and adds
  its row to `docs/ENGINE-MODEL.md`. An older save opens through `ONCE_ON_OPENING` (`src/engine/index.ts`) where its kept
  data needs moving. The save schema (94, in two places) moves only where a field's meaning changes, both places together
  (CLAUDE.md, Rule 14). Say in your result whether anything judged moved.
- **Prose is load-bearing.** A comment your change falsifies is part of your change: what's no longer true goes in the
  past tense, dated. A renamed test gets its old and new titles in `docs/verification/pipeline/inputs/renames.json`.
- **The guide and the tutorial** (`src/engine/content/guide/`, `src/engine/content/tutorial.ts`) say what changed for the
  player.
- **The container restarts** and loses background processes, keeping files. Run anything long in the foreground in parts,
  each part's output to a file.
- **Before your last commit:**
  - `npm run typecheck` (or `npx tsc --noEmit -p tsconfig.app.json`), `npm run lint`, and every test file you touched or
    cite, each exit 0;
  - `node tools/devmap.mjs --write` and `node tools/traceability.mjs --write` where you added a test file or a command;
  - the document checks: `doc-refs.mjs --check`, `tics.mjs --check`, `voice-check.mjs --check`, `spelling.mjs`,
    `typos.mjs`, `title-case.mjs --check`, `label-sweep.mjs`, `plural-check.mjs`;
  - `wired.mjs --check`, `deciders.mjs --check`, `inventory.mjs --check`, `capabilities.mjs --check`.
- **Commit trailer:**

```
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01977Z2bLodCspXyxELfcefM
```

## Your Result

`docs/verification/resolution-2026-10-17/<area>-result.json`:

```json
{ "area": "<area>", "commits": ["…"], "rows": [ {
    "id": "…", "group": "…", "baselineStatus": "…",
    "disposition": "closed | superseded | scope resolution | research assumption | remaining",
    "status": "one of the seven",
    "criterion": "what closes it, and where it's written",
    "exercised": "how you exercised it",
    "evidence": [ { "file": "tests/….test.ts", "title": "describe > it, exactly as vitest names it", "kind": "player journey | fixture | guard | measurement", "proves": "…" } ],
    "fixes": [ { "summary": "…", "where": "…", "failingTest": "…" } ],
    "mutations": [ { "what": "…", "caughtBy": "…" } ],
    "missing | gap | blocker | decision | deferredBy": "what its status needs, where it isn't verified"
  } ],
  "replacements": [ { "id": "new row id", "replaces": "…", "criterion": "…", "status": "…", "evidence": [ … ] } ],
  "added": [ { "id": "…", "reason": "…", "impact": "…" } ],
  "defectsFound": [ { "what": "…", "blocksCompletion": true } ],
  "forTheCoordinator": { "measurements": [ { "cmd": "…", "seeds": "…", "out": "…", "reads": "…" } ], "records": "…" },
  "checks": [ { "cmd": "…", "exit": 0 } ] }
```

Every `evidence[].file` is a repository path. Your final message: each row's disposition and status with its evidence, every
commit, every check and test file with its exit code, every addition with its reason, and what remains and why.
