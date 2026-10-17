# Brief 12: The Remaining Decisions Resolved, 2026-10-17

The owner's "Resolve The Remaining Decisions And Complete The Authorized Build"
(`../briefs-2026-10-16/12-resolve-the-remaining-decisions-and-complete-the-authorized-build.txt`, kept verbatim). It's a
close-out of the authorized scope, against brief 11's frozen baseline (`../completion-2026-10-16/baseline.json`, 608 rows
in scope), which this pass doesn't change.

## Where It Started

Read on `aeb4c917` (`main` at `9302b29c`, #38's merge, with the handoff's correction for that merge on the branch). No
change landed between the two briefs. The figures are the brief's:
- **Against the frozen baseline:** 567 of 608 Implemented And Verified (93.2%).
- **Of the actionable portion:** 37 of 46 (80.4%).
- **The matrix's own count:** 567 of 599.

`../completion-2026-10-16/receipt.py` found no problems.

The nine actionable rows still open, each with what the owner has now decided:

| Row | At the start | The owner's resolution (brief 12) | Area |
|---|---|---|---|
| `ST6-R.a`, `ST6-R.c`, `ST6-R.e`, `ST6-R.g` | Decision Required | Section 1: each revised around eight stated requirements. The original is superseded with this authorization, not passed, and each replacement is closed only on its own evidence | acting |
| `advice.F2A10-f`, `advice.F2A10-h` | Decision Required | Section 2: the clauses clarified as the brief states them, written before final validation, and validated on fresh cases. Brief 11's held-out set becomes regression coverage | advice |
| `health.enroll` | Implemented, Verification Incomplete | Section 3: the work-hours branch kept as a tested internal safeguard where it's necessary, or removed alone if it isn't. Recorded as a scope resolution | health |
| `KS-ct-idcard`, `KS-passport-fees` | Blocked Externally | Section 4: a focused attempt at the authoritative sources. Failing that, a labeled, configurable SLATE assumption, implemented and verified against its specification | research |

Decision 4's 23 rows (its twelve audit rows, its three decision rows and the banking area's eight items) are unchanged
and untouched.

## How Each Row Is Counted

Each actionable row ends in exactly one of the brief's categories (section 5), and none is counted twice:

- **Closed through implementation or verification:** its own evidence, gate tests cited by title, or a measurement on the
  tested commit.
- **Superseded by this authorization:** an original criterion, kept with its results as historical evidence and
  Explicitly Deferred. Its replacement is a row of its own, closed only on its own evidence.
- **Scope resolution:** a row whose remaining gap the owner resolved by scope. It's closed when what remains in scope is
  verified, and the resolution is recorded.
- **Research assumption:** a simulated behavior verified against its stated specification while its real-world source
  stays unverified. Both facts are kept.
- **Decision 4's unchanged exclusions.**
- **Remaining defect or external limitation.**

Administrative changes aren't counted as gameplay. `../completion-2026-10-16/RECEIPT.md` stays brief 11's receipt; this
folder's receipt reads the same frozen baseline.

## How It's Worked

Four areas work in their own clones from instructions written before their work (`prompts/`): acting, advice, health and
research. The coordinator works the matrix, the receipt, the final validation, the player walkthrough and the handoff.

## Where It Ended

The tested code is `ed24ff3b`. `RECEIPT.md`, by `receipt.py`, gives every row's category and figure; in short:

| Row | Category | On |
|---|---|---|
| `ST6-R.a`, `.c`, `.e`, `.g` | superseded: Explicitly Deferred, their results kept | `acting-result.json` |
| `ST6-R2.a`, `ST6-R2.g` | replacements, verified on their own evidence | `acting-criteria.md`, `acting/` |
| `ST6-R2.c`, `ST6-R2.e` | replacements, Decision Required: each fails as written only at a limit its criteria didn't name, and the criteria say that's reported, not moved | `acting-result.json` |
| `advice.F2A10-f`, `advice.F2A10-h` | closed on the clarified criteria, by the fresh set run once | `advice-criteria.md`, `final-result.json` |
| `advice.F2A10-c`, `advice.heldout` | closed again, by the regression run on the tested commit | `final-result.json` |
| `health.enroll` | scope resolution: the work branch cut at the finding, verified at a second reading | `health-criteria.md`, `health-result.json` |
| `KS-ct-idcard`, `KS-passport-fees` | research assumptions, verified to their specification; Japan's fee a verified fact | `research-criteria.md`, `research-result.json` |

The replacement rows aren't among the 46 actionable rows: they are the superseded rows' replacements, counted apart.

## The Final Validation

On `ed24ff3b`, in clones, every step exit 0 (`runs/README.md`):
- the build;
- the 14 scenario saves, made again;
- the built app at 1440 and 390, 76 of 76 each, with the walkthrough's steps;
- the long runs and mastery plans, byte for byte brief 11's;
- the advice's fresh set once, and its regression set;
- the acting measurement.

The whole suite ran first on `f07fb997` and failed one test, `tests/cohesion.test.ts`, on the advice area's field names.
`ed24ff3b` renamed them, and the runs were made after. The gate ran last, on the commit `runs/gate.txt` names.

## Added Work, Recorded Apart

Each is a defect or a necessary dependency, not new scope:
- **Two stale sentences offered work** (`7d82c09a`): SNAP's time-limit notice and the tutorial's unemployment chapter.
- **merge-review's notes** (`5b94fbd4`): it kept a verified row's open gaps as "Still open" on 43 rows, and repeated
  closed ones.
- **health.enroll's records** (`5b94fbd4`):
  - five test titles still credited "80 hours' work";
  - the area clone's commit hashes;
  - a reload claimed of every path;
  - the guide's "Last Month's Work" label.
- **The advice's field names** (`ed24ff3b`), read by the cohesion guard as a person's genres.
- **The built app's walkthrough steps** (`c1388d1b`, `ed24ff3b`): health cover, stamina and recovery, an ID card across a
  save, and the advice's two new lines.
- **ST6-R2.g's citation of the gate tests** its mutations failed (`f07fb997`).
- **The handoff's stale statements** about main and its pull requests (`f6667eda`).
- **The areas' own defects,** each fixed in its area and listed in its result: the advice's unexplained rise, its unnamed
  prepared take, and its discipline sentence; the health area's dependencies.
