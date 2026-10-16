# The Remaining Integration Gaps: Your Area (2026-10-16, Brief 09)

The owner's brief: `docs/verification/briefs-2026-10-16/09-remaining-integration-gaps-and-completion-evidence.txt`. Read
it whole; your area's file names your section of it. `../prompts/common.md` (the last pass's) applies in full except
where this file changes it. Read `CLAUDE.md` first.

## What Changed From The Last Pass's Rules

- **Mutations are run in copies, never in the tree.** A checkpoint of the last pass (`64e3f82d`) was taken while two
  areas each had a mutation applied in the shared tree. Copy the file or the tree into your scratchpad folder, mutate
  the copy, run the test against it (a copy of the repository with `node_modules` linked, or `vite-node`/vitest pointed at
  the copy), and record each mutation. The tree you work in holds only your intended changes at every moment.
- **Don't touch git** (no add, commit, stash, checkout, reset, restore, clean), unless your area's file says you work in
  your own clone: then commit there, on your clone's branch, in coherent commits with the house's messages (what was
  decided and why; the trailer lines below), and never push.
- **Nothing is closed by being written down.** A requirement documented, classified or given to the owner isn't
  implemented or verified. The statuses this pass uses: Implemented And Verified; Implemented, Verification Incomplete;
  Partially Implemented; Not Implemented; Blocked Externally; Decision Required; Explicitly Deferred. Give each item one,
  in your result, with the evidence that earns it.
- **A genuine decision for the owner** is a product choice the brief and the earlier briefs don't settle, inconsistent
  sources, or something outside the repository. Everything else is implemented. When you report one, say exactly what's
  missing, the evidence, and the resolution you recommend.
- **Criteria are never weakened.** A criterion that measures as not met is reported as measured, beside any corrected
  criterion you propose, which is marked proposed and not counted.

## Where You Are

- The repository: `/home/user/1221`, branch `claude/peaceful-hamilton-59zdbb`, restarted from `main` at `64b69fc7` (#35's
  merge). Other agents work in that tree beside you; edit only what your area needs, and re-read a shared file before each
  edit, changing only your lines with exact replacements.
- Scratch files: `/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad/<your key>/`, or
  `probe/` in the repository (git-ignored).
- Memory is short and the CPU is shared: one test file at a time (`VITEST_MAX_FORKS=1 VITEST_MIN_FORKS=1 npx vitest run
  <file>`), never the whole suite.
- Commit trailer, where you commit:

  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01977Z2bLodCspXyxELfcefM
  ```

## The Result

Write `docs/verification/remaining-09/<key>-checklist.json` before your first code change and `<key>-result.json` after,
in the last pass's shapes (`../prompts/common.md`), each item with its `status` from the seven above as well as its
`disposition`, and `evidence` naming tests by their exact title (`describe > it` as vitest names it). Your final
message: each item's status, every file changed, every check and its exit code, the seeds of every simulation, and what
you found outside your area.
