# Brief 12’s Completion Receipt

Written by `receipt.py` from brief 11’s frozen baseline (the matrix at `main`’s `0e7ff7c2`), its classification, brief 12’s results and the matrix as it stands. Nothing here is typed.

- **Against the original full baseline:** 561 of 608 (92.2%) rows in scope Implemented And Verified (at the baseline, 530 of 608).
- **The 46 actionable rows, each in one category:** closed 35; superseded 0; scope resolution 1; research assumption 2; remaining 8.
- **Outside them:** decision 4’s 23 rows, unchanged; brief 11’s 9 administrative rows.
- **The matrix’s own count:** 561 of 599 rows in scope Implemented And Verified (93.6%); 29 Implemented, Verification Incomplete, 0 Partially Implemented, 0 Not Implemented, 0 Blocked Externally, 9 Decision Required, 36 Explicitly Deferred.

## The Actionable Rows

| Row | Group | At The Baseline | Now | Category | By |
|---|---|---|---|---|---|
| `health.enroll` | Life, Health And Time | Implemented, Verification Incomplete | Implemented, Verification Incomplete | scope resolution | docs/verification/resolution-2026-10-17/health-result.json |
| `l-actor` | Creation, Profile, Home And The Looks | Implemented, Verification Incomplete | Implemented And Verified | closed | brief 11 |
| `tax.s8.f1_status` | Remaining Area: tax | Implemented, Verification Incomplete | Implemented And Verified | closed | brief 11 |
| `tax.s8.ssn` | Remaining Area: tax | Implemented, Verification Incomplete | Implemented And Verified | closed | brief 11 |
| `tax.s8.opt` | Remaining Area: tax | Implemented, Verification Incomplete | Implemented And Verified | closed | brief 11 |
| `tax.s8.license` | Remaining Area: tax | Implemented, Verification Incomplete | Implemented And Verified | closed | brief 11 |
| `tax.s8.visas_authorizations` | Remaining Area: tax | Implemented, Verification Incomplete | Implemented And Verified | closed | brief 11 |
| `coverage09.4-fold` | Brief 09 Area: coverage | Implemented, Verification Incomplete | Implemented And Verified | closed | brief 11 |
| `coverage09.5-journeys-fold` | Brief 09 Area: coverage | Implemented, Verification Incomplete | Implemented And Verified | closed | brief 11 |
| `coverage09.6-journeys-followup-fold` | Brief 09 Area: coverage | Implemented, Verification Incomplete | Implemented And Verified | closed | brief 11 |
| `genres.4-kept` | Brief 09 Area: genres | Implemented, Verification Incomplete | Implemented And Verified | closed | brief 11 |
| `genres.6-table` | Brief 09 Area: genres | Implemented, Verification Incomplete | Implemented And Verified | closed | brief 11 |
| `genres.7-measured` | Brief 09 Area: genres | Implemented, Verification Incomplete | Implemented And Verified | closed | brief 11 |
| `judge.coverage-row` | Brief 09 Area: judge | Implemented, Verification Incomplete | Implemented And Verified | closed | brief 11 |
| `advice.harness` | Brief 10 Area: advice | Implemented, Verification Incomplete | Implemented And Verified | closed | brief 11 |
| `advice.F2` | Brief 10 Area: advice | Implemented, Verification Incomplete | Implemented And Verified | closed | brief 11 |
| `advice.F2A10-a` | Brief 10 Area: advice | Implemented, Verification Incomplete | Implemented And Verified | closed | brief 11 |
| `advice.F2A10-c` | Brief 10 Area: advice | Implemented, Verification Incomplete | Implemented, Verification Incomplete | remaining | nothing yet |
| `advice.F2A10-f` | Brief 10 Area: advice | Decision Required | Decision Required | remaining | nothing yet |
| `advice.F2A10-h` | Brief 10 Area: advice | Decision Required | Decision Required | remaining | nothing yet |
| `advice.tests` | Brief 10 Area: advice | Implemented, Verification Incomplete | Implemented And Verified | closed | brief 11 |
| `advice.heldout` | Brief 10 Area: advice | Implemented, Verification Incomplete | Implemented, Verification Incomplete | remaining | nothing yet |
| `advice.harness-hospital` | Brief 10 Area: advice | Implemented, Verification Incomplete | Implemented And Verified | closed | brief 11 |
| `ST3-R.e` | Brief 10 Area: judge | Implemented, Verification Incomplete | Implemented And Verified | closed | brief 11 |
| `ST6-R.a` | Brief 10 Area: judge | Decision Required | Decision Required | remaining | nothing yet |
| `ST6-R.c` | Brief 10 Area: judge | Decision Required | Decision Required | remaining | nothing yet |
| `ST6-R.e` | Brief 10 Area: judge | Decision Required | Decision Required | remaining | nothing yet |
| `ST6-R.g` | Brief 10 Area: judge | Decision Required | Decision Required | remaining | nothing yet |
| `H4-R.e` | Brief 10 Area: judge | Implemented, Verification Incomplete | Implemented And Verified | closed | brief 11 |
| `L3-R.a` | Brief 10 Area: judge | Implemented, Verification Incomplete | Implemented And Verified | closed | brief 11 |
| `L3-R.b` | Brief 10 Area: judge | Implemented, Verification Incomplete | Implemented And Verified | closed | brief 11 |
| `L3-R.e` | Brief 10 Area: judge | Implemented, Verification Incomplete | Implemented And Verified | closed | brief 11 |
| `judge.together` | Brief 10 Area: judge | Implemented, Verification Incomplete | Implemented And Verified | closed | brief 11 |
| `judge.tests` | Brief 10 Area: judge | Implemented, Verification Incomplete | Implemented And Verified | closed | brief 11 |
| `ST6-R.bPrime` | Brief 10 Area: judge | Decision Required | Implemented And Verified | closed | brief 11 |
| `A1` | Brief 10 Area: judge | Implemented, Verification Incomplete | Implemented And Verified | closed | brief 11 |
| `stamina.A1` | Brief 10 Area: stamina | Implemented, Verification Incomplete | Implemented And Verified | closed | brief 11 |
| `A4` | Criteria: The Attributes | Implemented, Verification Incomplete | Implemented And Verified | closed | brief 11 |
| `A5` | Criteria: The Attributes | Implemented, Verification Incomplete | Implemented And Verified | closed | brief 11 |
| `T1` | Criteria: The Attributes | Implemented, Verification Incomplete | Implemented And Verified | closed | brief 11 |
| `O3` | Criteria: The Attributes | Implemented, Verification Incomplete | Implemented And Verified | closed | brief 11 |
| `F1` | Criteria: The Attributes | Implemented, Verification Incomplete | Implemented And Verified | closed | brief 11 |
| `F3` | Criteria: The Attributes | Implemented, Verification Incomplete | Implemented And Verified | closed | brief 11 |
| `L1` | Criteria: Long-Term Continuity | Decision Required | Implemented And Verified | closed | brief 11 |
| `KS-ct-idcard` | Known Shortfalls And Missing Tests | Implemented, Verification Incomplete | Implemented And Verified | research assumption | docs/verification/resolution-2026-10-17/research-result.json |
| `KS-passport-fees` | Known Shortfalls And Missing Tests | Implemented, Verification Incomplete | Implemented And Verified | research assumption | docs/verification/resolution-2026-10-17/research-result.json |

## The Replacement Criteria (0)

| Row | Replaces | Status | Evidence |
|---|---|---|---|

## What Remains

- `advice.F2A10-c` (Brief 10 Area: advice): Implemented, Verification Incomplete: It was measured on 3de26e0b, and what it reads has changed since (src/engine/content/guide/documents.ts, src/engine/content/guide/papers.ts, src/engine/content/passportsabroad.ts, …): measure it again
- `advice.F2A10-f` (Brief 10 Area: advice): Decision Required: F2-A10 (f), as clarified (clarifications.md), said that below three quarters of full the forecast falls as the level rises. On the held-out set, run once on the tested commit (3de26e0b, and the same on 81eadac9), it does on 110 of 111 cases below three quarters: adv-h-1’s vocal, at 32, reads 0.828, 0.899 and 0.764 at its level, a third and two thirds of the way to full. The twenty sessions’ growth
- `advice.F2A10-h` (Brief 10 Area: advice): Decision Required: F2-A10 (h), as clarified (clarifications.md), said the trained input’s forecast at the discipline it had when it was advised falls after the twenty sessions, on every case. On the held-out set, run once on the tested commit (3de26e0b, and the same on 81eadac9), it does on 116 of 120. In the four that didn’t (adv-h-1 vocal at 32, adv-h-22 emotional depth at 27, adv-h-102 memory at 91, adv-h-111 foc
- `advice.heldout` (Brief 10 Area: advice): Implemented, Verification Incomplete: It was measured on 3de26e0b, and what it reads has changed since (src/engine/content/guide/documents.ts, src/engine/content/guide/papers.ts, src/engine/content/passportsabroad.ts, …): measure it again
- `ST6-R.a` (Brief 10 Area: judge): Decision Required: ST6-R (a) asks the restrained specialist (emotional depth 85, composure 75, focus 75, the nine others 40.56, 600 in all) to be ahead of the even actor (every ability 50) playing the better-suited side, against the grain, on a quarter of the 44 materials. Measured, it isn’t (2 of 44), and the sorting brief 11 asked for says why: nothing in the game is missing, and the clause, with (c), (e) and (g)’
- `ST6-R.c` (Brief 10 Area: judge): Decision Required: Rests on ST6-R (a): see its decision. Abilities and circumstances fail only for want of (a)’s wins; preparation and interpretation hold.
- `ST6-R.e` (Brief 10 Area: judge): Decision Required: Rests on ST6-R (a): see its decision.
- `ST6-R.g` (Brief 10 Area: judge): Decision Required: With A1, (g)’s first item is met. Its second and third aren’t caught by the clauses (g) names, and the third by none of ST6-R’s: they rest on what replaces (a) and (c). See ST6-R (a)’s decision.

## Decision 4’s Rows (23), Unchanged

| Row | Group | At The Baseline | Now |
|---|---|---|---|
| `bank.arrange_overdraft` | Money | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `bank.cancel_new` | Money | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `bank.switch` | Money | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `bank.take_overrun_loan` | Money | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `card.money_transfer` | Money | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `bank.switch_complete` | Money | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `bank.cancel_switch` | Money | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `bank.stop_balance_transfer` | Money | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `tax.amend` | Papers | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `tax.catch_up_state_plan` | Papers | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `tax.lien_dispute` | Papers | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `tax.request_waiver` | Papers | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `banking.2.scope` | Brief 09 Area: banking | Decision Required | Decision Required |
| `banking.2.arrange_overdraft` | Brief 09 Area: banking | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `banking.2.cancel_new` | Brief 09 Area: banking | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `banking.2.switch` | Brief 09 Area: banking | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `banking.2.switch_complete` | Brief 09 Area: banking | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `banking.2.cancel_switch` | Brief 09 Area: banking | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `banking.2.stop_balance_transfer` | Brief 09 Area: banking | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `banking.2.take_overrun_loan` | Brief 09 Area: banking | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `banking.2.money_transfer` | Brief 09 Area: banking | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `coverage09.3-unresolved` | Brief 09 Area: coverage | Decision Required | Decision Required |
| `KS-bank-rows-scope` | Known Shortfalls And Missing Tests | Decision Required | Decision Required |

## What The Receipt Found (7)

- health.enroll (Life, Health And Time): called scope resolution, Implemented, Verification Incomplete in the matrix
- F2-A (Criteria: The Attributes): verified at the baseline, Implemented, Verification Incomplete now
- MA5 (Criteria: Mastery Through Play): verified at the baseline, Implemented, Verification Incomplete now
- INT-skipped (Integration): verified at the baseline, Implemented, Verification Incomplete now
- INT-navigation (Integration): verified at the baseline, Implemented, Verification Incomplete now
- INT-long-runs (Integration): verified at the baseline, Implemented, Verification Incomplete now
- INT-gate (Integration): verified at the baseline, Implemented, Verification Incomplete now
