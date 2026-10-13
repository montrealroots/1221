# CLAUDE.md — SLATE

Permanent project instructions. The blueprint below is canonical and was
established by the project owner. It applies to all work on SLATE, past and
future, and to **both** of the Claude Code accounts that alternate on this
project. It remains canonical unless the owner explicitly changes it.

This copy was brought over from `main` onto `claude/slate-cleanup-e4apmx` on
2026-09-23, at the owner's request, and corrected where it said things that are
not true on this branch. The seventeen rules and the owner's standing constraints
are unchanged. The one change to the operating model is also the owner's: on
2026-09-23 they made PowerShell 7 the execution environment. Later that day they
had this branch replace `main`. "The old line" below means the commits the gut
replaced on 2026-09-22, up to `4a00db8`. `main` carried part of it until then, and
still has that history, but none of its files.

---

# SLATE Development Blueprint

## The Operating Model

**Claude Code** is the primary reasoning, coding, architecture, debugging and
orchestration layer.

**PowerShell 7** is the primary local execution environment on Windows: `pwsh`, not
the Windows PowerShell 5.1 that ships with the system. Claude Code may use it to
inspect and operate on the real project environment, including:

- files and directories
- Git
- Node and npm
- tests
- builds
- verification scripts
- logs
- Base44 tooling
- deployment tooling
- environment and configuration
- automation
- diagnostics

**Git** is the authoritative safety and version-control layer.

So, in one line each:

| Layer | Owns |
|---|---|
| Claude Code | Reasoning and orchestration |
| PowerShell 7 | Execution and system access |
| Git | Versioning, recovery, audit trail and safety |

## The Rules

1. Work against the real canonical SLATE Git repository, not disposable copies.
2. Inspect current Git state before beginning substantial work.
3. Never assume repository state from conversation memory alone.
4. Break large development work into coherent modules.
5. Validate each substantial module before integrating or moving forward.
6. Run relevant tests, typechecking, linting, verification and regression checks.
7. Never mark work complete solely because code was written.
8. Keep commits coherent and recoverable.
9. Do not perform destructive Git operations unless explicitly justified and safe.
10. Preserve uncommitted work, stashes, branches, worktrees and handoff context
    before operations that could affect them.
11. Update `SLATE_CURRENT_MASTER_HANDOFF.md` whenever a major development phase
    completes and before switching Claude accounts.
12. The repository and verified test results outrank stale conversation
    assumptions.
13. Claude should explain materially risky operations before executing them.
14. Base44 deployment should occur only after the applicable verification gate
    passes.
15. Maintain an auditable trail of important architecture decisions, fixes, tests
    and deployment state.
16. Both Claude Code accounts must follow this same workflow.
17. This workflow remains canonical unless the owner explicitly changes it.

---

# How The Rules Cash Out Here

The rules are the instruction. This section is the concrete form they take in this
repository, so that following them does not require rediscovering the commands
every session.

## Rule 2 And Rule 3 — Look Before Working

Before substantial work, and always after a context compaction or an account
switch:

```powershell
git status -sb            # branch, tracking, and anything uncommitted
git log --oneline -5      # where HEAD actually is
git stash list            # what is held and must not be lost
git worktree list         # what else is checked out
```

A summary of a previous session is a snapshot, not a source of truth. When a
document and the tree disagree, **the tree wins and the document gets corrected** —
rule 12.

## Rule 6 And Rule 7 — What "Done" Means

The verification gate is one command, and it is the bar:

```powershell
npm run gate
```

It runs `npm run validate` (typecheck, lint, the full vitest suite) followed by
seventeen checks: title-case, label-sweep, plural-check, voice-check, tics,
doc-refs, wired, deciders, spelling, typos, geo-check, inventory, devmap,
traceability, capabilities (added 2026-10-08), coverage (added 2026-10-13,
which fails an audit row whose cited test or line doesn't hold, and
`docs/GAMEPLAY-COVERAGE.md` behind the audit) and student-matrix (added
2026-10-10, which fails a matrix row whose cited test or command is gone).
This said sixteen until 2026-10-13, fifteen until 2026-10-10, and fourteen until
2026-10-08, leaving out traceability, which the gate already ran, and sixteen
until 2026-10-09, when catalog-coverage (added 2026-10-03) left the gate with
the catalogs it counted in the owner's scope reset. Read its exit
status **from a file, never from a pipe**. A pipe that stops early, such as
`| Select-Object -First 20`, ends the gate partway and leaves `$LASTEXITCODE`
holding the previous command's code, which can read as a pass:

```powershell
npm run gate *> "$env:TEMP\gate.txt"
"exit=$LASTEXITCODE" | Out-File -Encoding utf8 "$env:TEMP\gate-exit.txt"
```

Code that is written is not work that is finished. Nothing is reported complete
until the gate has passed and the report says what the numbers were.

Two things about measurement in this project, both of which are rule 7 in
practice. Measure on a **played career, never an idle save** — an idle save holds
every number still and the stillness looks like a result. And apply the
falsifiability test to any claim: **change an input; does the outcome change, or
only the sentence?**

## Rule 9 And Rule 10 — What Must Not Be Lost

Standing constraints from the owner, which rules 9 and 10 make permanent:

- **Never** apply, pop or drop the stash.
- **Never** merge worktrees.
- **Never** force-push the working branch.
- **Do not merge to `main` without the owner.**

Before anything that could touch uncommitted work, a stash entry, a branch, a
worktree or the handoff, preserve it first and say what is being preserved.

## Rule 11 And Rule 16 — The Handoff Is The Only Thing That Crosses

Two Claude Code accounts alternate on SLATE, and
`SLATE_CURRENT_MASTER_HANDOFF.md` is the only state that passes between them. It
is updated when a phase completes and before a switch. A handoff that has drifted
from the tree is worse than no handoff, because it sends the next session to
rebuild something that already exists — which has happened. On the old line,
`tools/claims.mjs` was built to catch the same drift in the code's own comments.
This line doesn't have it.

## Rule 13 — Explain Before Acting

A materially risky operation gets a sentence first: what it does, what it could
lose, and why it is the right call. Destructive Git commands, deployments, deletes
and overwrites all qualify.

This does **not** extend to ordinary design and judgement calls. The owner has
said repeatedly that Claude should decide and then report the decision, rather
than opening with a question or a menu of options. Deciding is Claude's job;
destroying or publishing is what gets announced first.

## Rule 14 — Deployment Follows The Gate

Base44 deployment happens only after the applicable verification gate passes.

The save schema version is pinned in **two** places that cannot share a constant,
because the guard runs on Deno and cannot import the engine:
`SAVE_SCHEMA_VERSION` in `src/engine/domain/model.ts` and
`SUPPORTED_SCHEMA_VERSION` in `base44/shared/guard.js`. Move both by hand
together. Moving only the engine's fails 17 tests in
`tests/base44-contract.test.ts` and stops `tests/server-guards.test.ts` from
loading at all; moving only the guard's fails 2. Both were measured on
2026-09-23.

Before deploying, read §10 of `SLATE_CURRENT_MASTER_HANDOFF.md`: a deployment made
from the old line, including `main` as it stood before 2026-09-23, refuses every
new save this line makes.

## Rule 15 — The Auditable Trail

The trail lives in four places, and all four are load-bearing:

- **Commit messages** say what was decided and why, not what changed. The diff
  already says what changed.
- **`SLATE_CURRENT_MASTER_HANDOFF.md`** carries state across accounts.
- **`docs/UNBITTEN.md`** is the open-work ledger: what is declared, written,
  displayed or believed but changes no outcome. `docs/ARREARS.md` was the second
  ledger until the gut (`abd4727`) deleted it.
- **`docs/UNWIRED.json`** is the machine ratchet. Its counts **may fall and may
  not rise.** `tools/wired.mjs --check` fails a rise.

---

# The House Standard

These are the project's own rules, which the blueprint's rules 5, 6 and 7 exist to
enforce. They are not separate from it.

**THE ONE RULE.** A declared word with nothing that reads it is worse than no word
at all.

**THE FALSIFIABILITY TEST.** Change an input. Does the outcome change, or only the
sentence?

**Prose here is load-bearing.** Comments and docs do not describe what a function
does; they say what was measured, what was tried, what was deleted and why. Which
means a comment your change falsifies **is part of your change**. Say what is no
longer true in the past tense — the past tense is how this project keeps its
history. On the old line, `tools/claims.mjs --check` failed the gate on a
present-tense claim that the code contradicted. This line doesn't have it, so here
review holds the line.

**A ledger balance is never a number somebody typed.** It is the sum of postings.

**Mutation-test every claim a test protects.** A surviving mutation usually means a
redundant guard that an earlier clamp already settles.
