# The Integration Pass: Your Area (2026-10-16)

`docs/verification/prompts-2026-10-16/remaining-prompt.txt`, carried to this pass's baseline. What changed from it: the
repository, the branch and the scratchpad are this container's; the owner's brief of this pass
(`docs/verification/briefs-2026-10-16/08-complete-integration-and-acceptance-pass.txt`) is added, and each area's own
section of it is named in the area's file; and the judge (evaluation, material, interpretation) is being changed in a
separate checkout at the same time.

## Where You Are

- SLATE at `/home/user/1221`, branch `claude/peaceful-hamilton-59zdbb` (`main` at `ef784ccd` plus this pass's
  documents). Read `CLAUDE.md` first: it applies in full. THE ONE RULE, the falsifiability test, prose load-bearing
  (past tense, with the date 2026-10-16, for what changed; a comment your change falsifies is part of your change),
  curly apostrophes (’) in player-facing text and comments as the files around you use them, American spelling, Title
  Case for labels.
- **Don't touch git**: no add, commit, stash, checkout, reset, restore or clean. The session that launched you commits.
- **Other agents work in this tree beside you**, each on its own area. Edit only what your area needs. Before each edit
  of a shared file (`src/engine/content/guide/*.ts`, `src/engine/content/tutorial.ts`, `src/engine/index.ts`, a shared
  test, `docs/…`), re-read it and change only your lines, with the Edit tool's exact replacement, never by rewriting the
  file.
- **Don't change the judge**: `systems/evaluation.ts`, `systems/piece.ts`, `systems/material.ts`,
  `systems/interpretation.ts`, `content/approaches.ts`, `content/interpretation.ts`, `content/tasks.ts`,
  `content/material.ts`, `content/scenes-*.ts`, `content/plays.ts`, `content/briefs/`. Another session changes them in
  a separate checkout and brings the change in later. A test of yours whose expected figure is a judged result (a band,
  a take, an overall) derives it from the played record or the rule, so the judge's change doesn't silently break it;
  say so in the test.
- Don't restore removed systems (the home and its bills, travel, vehicles, land, the career, shops, the assistant, the
  social life, the rail), add parental leave, or reopen deferred work. Don't inflate completion: never delete a
  requirement, weaken an assertion, hide a control, or move work to Deferred or Informational to close an item.
- Scratch files go in your own folder under `/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad/<your key>/`,
  or under `probe/` in the repository (git-ignored), never elsewhere in the tree.

## First: The Checklist, Before Any Code Change

Read `docs/verification/CURRENT-SCOPE-2026-10-15.md` (its "Still Open"), the master handoff's top section,
`docs/verification/scope/*-result.json` for your rows, the audit rows (`docs/verification/audit/*.json`, found by id),
and the code. Don't assume an earlier reading is right; verify it.

Write `docs/verification/remaining/<key>-checklist.json`: per item `{ id, item (as the brief names it), requirement
(what must be true, with its authority: statute, regulation, guidance, the bank's terms, the school's published policy,
or the project's own rule), currentBehavior (read in the code, with file:line, and reproduced where it's a defect: how),
affectedSystems, plan, acceptance (the named tests and what they assert: command, clock, render, fixture, guard,
static), classification (for a control or refusal no current journey reaches: required reachable behavior | necessary
defensive guard | older-save compatibility | misleading player-facing control | truly redundant code) }`. Write it
whole before your first code change. An item you add later (a defect found on the way) goes in the checklist before its
fix.

## Then: Implement And Prove

- **Research**: authoritative, date-specific sources (WebSearch and WebFetch work from here). Record apart: the enacted
  rule, its effective date, implementation guidance, and SLATE's simulation assumption. Where no authoritative answer
  is found, record the exact uncertainty and implement only defensible behavior, marked as an assumption in a code
  comment; never call an approximation exact, and never call a guessed fee, rule or rate verified or live.
- **Every defect**: reproduce it; add an assertion that fails before the fix (break the fix, run, restore, and say
  which); fix; verify the downstream outcome; boundaries, refusals, repeated actions and duplicate submissions, save and
  load, and time advanced in one jump against the same span in small steps.
- **Tests reach the action as a player does** where play can (`sim.execute` or `must`, `advanceTo`, a rendered screen,
  as `tests/scope-*.test.ts` do). Where play can't (a state current gameplay never produces), test the engine on a
  fixture labelled FIXTURE or TEST SETUP and say precisely why play can't reach it. Never invent jobs, wages or income to
  make a player journey. Defensive guards: keep, test directly, name the test "GUARD:". Expected figures are worked by
  hand from the rule, never from the engine's own helper, and never vacuous.
- **Redundant code**: remove only after confirming no caller and no compatibility purpose; a dated comment where it was.
- **Every changed action** traced: Player Action → Validation → State Change → Immediate Result → Scheduled Or
  Downstream Consequence → Visible Explanation → Persistent History. No duplicate notices, bills, aid, credits or
  settlements on a repeat or a reload. A refusal says why and what the player can do next.
- **The guide and the tutorial**: update the guide's entries (`src/engine/content/guide/*`) and your sentences of the
  tutorial (`src/engine/content/tutorial.ts`, re-read before editing, with a dated comment above what you change) for
  every changed mechanic: what it requires, what it reads, what it changes, its time and money, its refusals, what
  follows, what connects to it, and what to do next. Explanations are built from the engine's own figures where the
  screen shows one, never a second simplified formula.
- **New tests** in `tests/remaining-<key>.test.ts`, with a header in the house voice (read two `tests/scope-*.test.ts`
  headers first). Don't rename or delete an existing test: the audit cites tests by title.
- **Memory is short and the CPU is shared**: run one test file at a time (`VITEST_MAX_FORKS=1 VITEST_MIN_FORKS=1 npx
  vitest run <file>`), never the whole suite. Then `npx tsc -b --noEmit`, `npx eslint <your files>`,
  `node tools/title-case.mjs --check`, `node tools/spelling.mjs`, `node tools/typos.mjs`, `node tools/tics.mjs --check`,
  `node tools/voice-check.mjs --check`, `node tools/wired.mjs --check`, `node tools/plural-check.mjs`,
  `node tools/label-sweep.mjs`, `node tools/doc-refs.mjs --check`. If you add or remove a command or a scheduled kind:
  `node tools/devmap.mjs --write`, `node tools/traceability.mjs --write`, and say so in your result (the inventory and
  capabilities are regenerated at the end). If a check fails on a file outside your area, it isn't yours: say so, and
  don't fix it.
- **Mutations** for the critical assertions (money, eligibility, persistence): one to three per item, applied in the tree
  one at a time, the test run, the file restored byte for byte (check with `git diff <file>` that only your intended
  changes remain), each recorded.

## Finally: The Result

Write `docs/verification/remaining/<key>-result.json`: per item `{ id, before, disposition (fixed | implemented | guard
kept and tested | older-save compatibility kept and tested | control corrected | removed as redundant | verified as it
stands | uncertainty recorded | owner decision), evidence [{file, title, kind, proves}], fixes [{summary, where,
failingTest}], sources [{rule, citation, effective, read}], assumptions [strings], mutations [{file, find, replace,
killed}], rowText {auditRowId: {field: corrected text}} (where an audit row's words change), tutorial, guide,
ownerDecision (only if genuinely needed: the options and their consequences) }`.

Your final message: one line per item with its disposition; every file you changed; every check you ran and its exit;
anything you found outside your area. Don't call an item done that its tests don't show.
