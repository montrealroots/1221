# G3: integrating a wave's clusters (the primary agent's own sequence)

S=/tmp/claude-0/-home-user-1221/93119f3d-c8d9-5356-8130-0e0fe32e5c95/scratchpad; repo /home/user/1221, branch claude/career-universe.
Wave 1 clones: $S/g-{offers,series,lang,rep}, branches g27-<name> from 4cba6159, patches $S/b27/patches/<name>/.
Wave 2 (after wave 1 is merged): clones $S/g-{awards,festivals,travel,day}, briefs $S/b27/cluster-<name>.md and
implementer-common-w2.md, base = the commit wave 1 was merged at.

Per cluster, in this order (lang, rep, series, offers for wave 1: smallest shared-file footprint first):
1. Read the workflow's final report for the cluster (the fix stage's six-part report) and the reviewer's findings.
2. Read the patch: `git -C $S/g-<name> log --stat 4cba6159..g27-<name>`; diff every engine file whole; skim the tests for
   PLAYER JOURNEY shape, falsifiability twin, save/load, refusal words. Check: schema 94 in both pins; new state optional
   with a stated default; every decider in decided.ts with drawnIn; no real-world figure without a register id; no real
   name offering employment; player text free of engine-speak; falsified comments in the past tense.
3. `git am -3 $S/b27/patches/<name>/*.patch` on the main repo. On conflict: resolve by hand (never drop either side's
   logic), `git am --continue`. Rebase-style: if a later cluster's patch doesn't apply, apply it in its clone on top of
   the integrated commit instead (`git -C clone rebase`), re-export, then am.
4. `nice -n 5 npx tsc --noEmit -p .`; `npx eslint <changed files>`; the cluster's tests; every test file importing a
   changed module (`grep -l` over tests/). Fix what fails here if it's integration (two clusters touching one function);
   send it back to the clone's agent via SendMessage if it's the cluster's own defect.
5. Commit nothing extra between clusters except conflict resolutions folded into the am'd commits.

After the wave:
6. Records, in this order (each tool's own check after it):
   - text-inventory: `node tools/text-inventory.mjs --write`, then `--mark2 <id> Rewritten --by <area> --evidence "…"` for
     each new/changed source the clusters reported (part 4 of each report); engine-speak counts may not rise.
   - surfaces: docs/text/surfaces/*.json rows for new sources, then `node tools/surfaces.mjs`.
   - effects: docs/verification/audit-2026-10-21/effects/*.json rows for every new command, scheduled kind, reactor,
     event and guide promise (part 4), then `node tools/effects.mjs --write`.
   - sweep: docs/verification/sweep-2026-10-24/register/*.json rows, then `node tools/sweep.mjs --write`.
   - citations: `python3 $S/b27/repoint-diff.py <changed src files>` (records restored from HEAD first), then
     `node tools/wiring.mjs --write`.
   - lifecycle: `python3 $S/b27/lifecycle-rows.py` then `node docs/.../lifecycle/lifecycle.mjs`; loops now IAV.
   - `node docs/verification/career-universe-2026-10-24/career-matrix/career-matrix.mjs` (then `--check`);
     capabilities: rows by hand in docs/capabilities.json (a new command must be named by a live row), then
     `node tools/capabilities.mjs --write` (prints CAPABILITIES.md) and `--check`; coverage.mjs `--check`;
     COVERAGE-MATRIX.md already by the clusters (tutorial test).
   - `bash $S/b27/checks.sh` → all 24 pass.
7. README: K3/K4/K5/K6/K7 "not built" paragraphs rewritten in the past tense where a cluster built the thing; a G section
   (what the owner asked on 2026-10-25, the audit's A1–A15 and the 17 reductions, each with where it stands); the defects
   table. CHECKPOINT milestones and next step. Commit, push.

Then G4 (an independent reviewer over the integrated diff, 4cba6159..HEAD, the seven criteria), fixes, then G5.
