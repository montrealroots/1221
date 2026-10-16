# The Owner's Approved Decisions: Your Area (2026-10-16, Brief 10)

The owner's brief: `docs/verification/briefs-2026-10-16/10-approved-acting-advice-banking-and-stamina-decisions.txt`.
Read it whole, then `docs/verification/decisions-2026-10-16/criteria.md`, which holds every criterion you work to. It was
committed (`2e8e4db3`) before any work began, and **you don't change it**: if a criterion proves wrong once measured,
report it in your result with the evidence, and the owner decides. Read `CLAUDE.md` first, and the handoff's first
section. `../../integration-2026-10-16/prompts-09/common.md` (brief 09's) applies in full except where this file
changes it.

## What This Brief Adds To Those Rules

- **Implement, then measure against the criteria as written.** The brief: "Do not stop at revising definitions or
  writing reports. Implement the approved behavior and resolve failures against the newly established criteria. Do not
  change those criteria afterward merely to make failures pass." A criterion not met is reported as not met, with its
  cause, after the fix you could justify.
- **Every coefficient you introduce** is labelled in its comment as SLATE's design choice unless a source sizes it, with
  the source quoted where one does. No weight without a figure behind it is added to move a criterion.
- **Decision 4 is untouched.** The twelve rows out of a player's reach (eight bank commands, `tax.catch_up_state_plan`,
  `tax.lien_dispute`, `tax.request_waiver`, `tax.amend`) and their audit and matrix rows don't change. Don't restore a
  removed system.
- **The container restarts.** It restarted twice in brief 09, and every background process was lost each time, files
  kept. Run anything long in the foreground, in parts you can wait on, and write each part's output to a file as it
  finishes, so a restart costs one part.
- **Citations the completion matrix can find.** In your result, `evidence[].title` is a test's exact title as vitest
  names it (`describe > it`); a piece may be cut with "…". A rerun of a whole file is `{"file": …, "ran": "…"}` with no
  title. `file` is one path that exists in the repository: never a scratchpad path, never two files in one string.
  A test you rename gets its old and new titles in `docs/verification/pipeline/inputs/renames.json`, and a dated comment
  in the test saying what it said and why it changed.
- **Changing what the game judges** moves `RULESET` (`src/engine/content/tasks.ts`) and its row in `docs/ENGINE-MODEL.md`.
  A result kept under an earlier ruleset is shown as it was. A save from before your change opens through a one-time step
  in `ONCE_ON_OPENING` (`src/engine/index.ts`) where its kept data needs moving; the save schema (94, in two places) moves
  only if a field's meaning changes, both places together (CLAUDE.md, Rule 14).
- **The test runner** runs `tests/setup/ended-life.ts` before every file: a loop waiting on an ended life's clock fails
  in a second or two, naming the death. A probe of your own that loops on the clock should stop on `endedAt` too.

## Where You Are

Your area's file says whether you work in your own clone (`/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad/<clone>`,
cut from the commit that added these instructions, `node_modules` linked: commit there, never push) or in the shared tree (`/home/user/1221`: no git
at all). One test file at a time (`VITEST_MAX_FORKS=1 VITEST_MIN_FORKS=1 npx vitest run <file>`). Mutations in copies.
Commit trailer:

```
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01977Z2bLodCspXyxELfcefM
```

## The Result

`docs/verification/remaining-10/<key>-checklist.json` before your first code change (each criterion clause of your area
an item, with how you'll measure it), and `<key>-result.json` after, in brief 09's shapes: each item's `status` from the
seven, `disposition`, `before` and `after` with their figures, `evidence` (exact titles, or measurement files committed
in the repository with their commands), `mutations` (what was broken in a copy and what caught it), and `rowText` for
any audit row whose words change. Your final message: each item's status, every commit (or every file changed), every
check and its exit code, the seeds, and what you found outside your area.
