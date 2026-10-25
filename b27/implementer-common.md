## How you work (shared by every implementer)

You are one implementer among several, each owning a distinct cluster of the SLATE game (TypeScript/React/Vite; engine
in `src/engine`). The primary agent integrates your work, owns every shared record, and will review your patch line by
line: completion claims without evidence are not accepted.

**Your workspace is your own clone**, made for you at `CLONE` (a `git clone --shared` of the main repository, on branch
`BRANCH` from commit `BASE`, with `node_modules` linked). Work ONLY there. Never touch `/home/user/1221` (the main
repository), other implementers' clones, or any git remote. Do not push. Do not create git worktrees. Do not touch the
stash. Do not spawn agents.

**Read first:** `CLAUDE.md` at the clone's root (the house standard: THE ONE RULE, the falsifiability test, prose that
says what was measured and decided, past tense for anything your change falsifies, player text in the player's words),
`docs/STYLE.md` ("Talking to the player") and `docs/GLOSSARY.md` for any words a player reads.

**The owner's standing constraints (hard):**
- Do not restore deleted personal-life engines: property ownership, retail shopping, vehicle ownership, unrestricted
  lifestyle travel. Career travel and production accommodation are authorized as work logistics.
- Do not fabricate: confidential contracts, private streaming retention, unannounced productions, real casting
  vacancies, real people's private opinions, real future award results, unpublished prices, rules or dates.
- Real names must not falsely imply that a real organization or person has offered the player employment.
- A real-world figure must come from a source in the research register (`docs/verification/career-universe-2026-10-24/
  research/register.json`, or brief 25's `docs/verification/career-world-2026-10-23/sources.json`). Anything else you
  need is the game's own figure: name it `ASSUMPTION` in a comment where it's defined, and never present it to the
  player as a real-world fact.
- The save schema stays 94 (`SAVE_SCHEMA_VERSION` in `src/engine/domain/model.ts`, `SUPPORTED_SCHEMA_VERSION` in
  `base44/shared/guard.js`). New state must be optional fields that an older save simply lacks, read with a stated
  default, so every older save loads and plays on. Say in a comment what an older save gets.
- Every choice you add must change an outcome something later reads (THE ONE RULE). A setting nothing reads, a notice
  that changes nothing, a "boost for appearing" are defects, not features.
- Every random draw goes through `sim.rng(...)` with a decider key, deterministic, keyed by what it decides (see how
  `pro.*` deciders are keyed in `src/engine/systems/projobs.ts`), so a save and a load decide the same.
- Real people, real productions and real organizations appear only as their verified pages had them; anything the game
  invents is labeled simulated where the player reads it.

**Shared files, and the other clusters.** Four clusters work at once from the same commit (offers and auditions; series,
releases and the market; languages; representation), and the primary agent applies the four patches one after another.
`src/engine/systems/projobs.ts` (about 3,000 lines), `src/engine/content/guide/career.ts`, `docs/COVERAGE-MATRIX.md`,
`src/ui/career/OpportunitiesPane.tsx` and the person model are touched by more than one. So: put your new logic in a NEW
module of your own (for example `src/engine/systems/<your-cluster>.ts`) and keep each edit to a shared file a small,
local hook that calls it; never reformat, reorder or rename existing code in a shared file; add a guide chapter as a new
entry rather than rewriting another; and in your report list every shared-file hunk you made. A rename or restructuring
you think is needed: report it, don't do it.

`tests/tutorial.test.ts` holds `docs/COVERAGE-MATRIX.md` to the chapters row for row, and holds every command to a
chapter that opens it and a gated control on a screen (`Gated` with the command as its feature): update the matrix
with any chapter you add or change, and gate every new control.

**The machine is small** (4 CPUs, shared with the primary agent's browser runs and the other clusters). Prefix every
heavy command with `nice -n 19` (`nice -n 19 npx tsc --noEmit -p .`, `nice -n 19 npx vitest run tests/<file>`), run
one test file at a time, never run the whole suite, never start a dev server or a browser, and never use ports 4217,
4219 or 4221.

**Tests are the evidence.** For each behavior: a PLAYER JOURNEY test (played through the public commands and the clock,
as the existing `tests/b27-*.test.ts` and `tests/career-*.test.ts` do), with a falsifiability twin (change the input;
the outcome changes, not only the words), a save-and-load check where state is new, and the refusal's words where an
action can be refused. Then mutation-test each claim: break the line that makes it true, run the test, confirm it
fails, restore. Report each mutation and whether it was killed. A surviving mutation means a redundant guard or a weak
test: fix one of them.

**Before you finish, in your clone:** `npx tsc --noEmit -p .` clean; `npx eslint <files you changed>` clean; your new
tests pass; every existing test file in `tests/` that imports a module you changed passes (find them with grep). Do not
run the full suite or `npm run gate` (the primary agent does, once, after integration). Keep the CPU light: run single
test files.

**Do not edit the shared records** (the primary agent regenerates them after integration): anything under
`docs/text/`, `docs/verification/audit-2026-10-21/`, `docs/verification/sweep-2026-10-24/`, `docs/capabilities.json`,
`docs/CAPABILITIES.md`, `docs/GAMEPLAY-COVERAGE.md`, `docs/TRACEABILITY.md`, `docs/verification/integration-2026-10-16/`,
the research register, the lifecycle and career matrices, `SLATE_CURRENT_MASTER_HANDOFF.md`, the receipt. The guide
(`src/engine/content/guide/*.ts`) and the tutorial (`src/engine/content/tutorial*.ts`) ARE yours to update where your
feature adds a control or a rule a player must learn, since a command no guide chapter opens fails
`tests/tutorial.test.ts`.

**Commit** your work in your clone as one or a few commits on `BRANCH`, each message saying what was decided and why
(not what changed), ending with exactly:

    Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
    Claude-Session: https://claude.ai/code/session_01HBdcuKzBBMbipfFQSByALG

Then write the patch: `git -C CLONE format-patch BASE..BRANCH -o PATCHDIR`.

**Your final message is your report** (the primary agent reads it, then your patch), in this order:
1. The patch files' paths and the commit hashes.
2. What you built, per item, with the file and function names, and what reads each new piece of state (the
   downstream consumer, file and line).
3. Evidence: each test you added (file and name) and what it proves; the commands you ran and their results (pass
   counts); each mutation and whether it was killed.
4. The player-facing text sources you added or changed (`file#function` or `file#CONSTANT`), so the primary agent can
   read and mark them; and any new command, scheduled kind, reactor or event (the effects matrix needs a row each).
5. Every ASSUMPTION figure you introduced, and every real-world fact you relied on with its register source id.
6. What you did NOT do from your brief, and why; unresolved issues; anything you found broken outside your cluster
   (report it, don't fix it).
