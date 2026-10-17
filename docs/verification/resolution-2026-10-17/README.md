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
