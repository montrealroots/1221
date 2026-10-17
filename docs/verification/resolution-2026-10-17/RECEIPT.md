# Brief 12’s Completion Receipt

Written by `receipt.py` from brief 11’s frozen baseline (the matrix at `main`’s `0e7ff7c2`), its classification, brief 12’s results and the matrix as it stands. Nothing here is typed.

- **Against the original full baseline:** 564 of 608 (92.7%) rows in scope Implemented And Verified (at the baseline, 530 of 608).
- **The 46 actionable rows, each in one category:** closed 37; superseded 4; scope resolution 1; research assumption 2; remaining 2.
- **Outside them:** decision 4’s 23 rows, unchanged; brief 11’s 9 administrative rows.
- **The matrix’s own count:** 566 of 599 rows in scope Implemented And Verified (94.4%); 28 Implemented, Verification Incomplete, 0 Partially Implemented, 0 Not Implemented, 0 Blocked Externally, 5 Decision Required, 40 Explicitly Deferred.

## The Actionable Rows

| Row | Group | At The Baseline | Now | Category | By |
|---|---|---|---|---|---|
| `health.enroll` | Life, Health And Time | Implemented, Verification Incomplete | Implemented And Verified | scope resolution | docs/verification/resolution-2026-10-17/health-result.json |
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
| `advice.F2A10-f` | Brief 10 Area: advice | Decision Required | Implemented And Verified | closed | docs/verification/resolution-2026-10-17/advice-result.json |
| `advice.F2A10-h` | Brief 10 Area: advice | Decision Required | Implemented And Verified | closed | docs/verification/resolution-2026-10-17/advice-result.json |
| `advice.tests` | Brief 10 Area: advice | Implemented, Verification Incomplete | Implemented And Verified | closed | brief 11 |
| `advice.heldout` | Brief 10 Area: advice | Implemented, Verification Incomplete | Implemented, Verification Incomplete | remaining | nothing yet |
| `advice.harness-hospital` | Brief 10 Area: advice | Implemented, Verification Incomplete | Implemented And Verified | closed | brief 11 |
| `ST3-R.e` | Brief 10 Area: judge | Implemented, Verification Incomplete | Implemented And Verified | closed | brief 11 |
| `ST6-R.a` | Brief 10 Area: judge | Decision Required | Explicitly Deferred | superseded | docs/verification/resolution-2026-10-17/acting-result.json |
| `ST6-R.c` | Brief 10 Area: judge | Decision Required | Explicitly Deferred | superseded | docs/verification/resolution-2026-10-17/acting-result.json |
| `ST6-R.e` | Brief 10 Area: judge | Decision Required | Explicitly Deferred | superseded | docs/verification/resolution-2026-10-17/acting-result.json |
| `ST6-R.g` | Brief 10 Area: judge | Decision Required | Explicitly Deferred | superseded | docs/verification/resolution-2026-10-17/acting-result.json |
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

## The Replacement Criteria (4)

| Row | Replaces | Status | Evidence |
|---|---|---|---|
| `ST6-R2.a` | ST6-R.a | Implemented And Verified | tests/decisions-judge.test.ts ‘ST6-R2: restrained acting judged by what it does for a player (brief 12) > FIXTURE: ST6-R2 (a1) and (a2), a measurable contribution, and restraint’s own: on every piece, for every actor, emotional depth, composure and focus raised together by 10 raise the restrained take by more than 0.05, by more with restraint’s draws than with them taken out, and each one’s own +10 by more with its own draw than without it’; tests/decisions-judge.test.ts ‘ST6-R2: restrained acting judged by what it does for a player (brief 12) > FIXTURE: ST6-R2 (a3), more is better up to the c |
| `ST6-R2.c` | ST6-R.c | Decision Required | tests/decisions-judge.test.ts ‘ST6-R2: restrained acting judged by what it does for a player (brief 12) > FIXTURE: ST6-R2 (c1), preparation in its direction: the choice rehearsed in from nothing to full never lowers the restrained take, half rehearsed it’s behind by more than 0.05 and names the rehearsal, and against the grain it asks more: rehearsed only to 0.9 it’s short exactly where the scene’s mark is over 0.9, which is only where restraint’s suitability is under nothing’; tests/decisions-judge.test.ts ‘ST6-R2: restrained acting judged by what it does for a player (brief 12) > FIXTURE: ST |
| `ST6-R2.e` | ST6-R.e | Decision Required | tests/decisions-judge.test.ts ‘ST6-R2: restrained acting judged by what it does for a player (brief 12) > FIXTURE: ST6-R2 (e1) to (e3), opportunities: wherever the scene favors restraint, restraint is the better choice for the beginner, the even actor, the restrained specialist and the near-master across 6 works and 3 register families or more, no work over a quarter, on stage and on tape; the mirror holds for expansive; and on tape each side’s specialist finds its side the better choice more often than the even actor’; docs/verification/resolution-2026-10-17/acting/st6r2.json ‘npx vite-node t |
| `ST6-R2.g` | ST6-R.g | Implemented And Verified | docs/verification/resolution-2026-10-17/acting/mutations.json ‘VITEST_MAX_FORKS=1 VITEST_MIN_FORKS=1 node tools/judge-mutations.mjs --list docs/verification/resolution-2026-10-17/acting/mutations.list.json --out docs/verification/resolution-2026-10-17/acting/mutations.json, on f17511ac’; docs/verification/resolution-2026-10-17/acting/mutations.list.json ‘the list, written from the criteria’s table, each edit’s text checked to occur once’; tests/decisions-judge.test.ts ‘ST6-R2: restrained acting judged by what it does for a player (brief 12) > FIXTURE: ST6-R2 (a1) and (a2), a measurable contrib |

## What Remains

- `advice.F2A10-c` (Brief 10 Area: advice): Implemented, Verification Incomplete: It was measured on 3de26e0b, and what it reads has changed since (src/engine/content/guide/craft.ts, src/engine/content/guide/documents.ts, src/engine/content/guide/papers.ts, …): measure it again
- `advice.heldout` (Brief 10 Area: advice): Implemented, Verification Incomplete: It was measured on 3de26e0b, and what it reads has changed since (src/engine/content/guide/craft.ts, src/engine/content/guide/documents.ts, src/engine/content/guide/papers.ts, …): measure it again
- `ST6-R2.c` (replacement): Decision Required: Should (c2)’s strict reading name the grain’s hundredth (`grainOf`) beside its floor as a documented limit, and should (c4) read “unrelated” on restrained takes as an ability carrying under the equal budget’s even share (1/12) rather than under a tenth?
- `ST6-R2.e` (replacement): Decision Required: Should (e2) and (e3)’s “more than the even actor” be read only where the even actor’s opportunities fall short of every suitable piece (tape, where both hold), or should R4 and R5 rest on (e1)’s and (e3)’s floors with (d) and (f)?

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

## What The Receipt Found (6)

- F2-A (Criteria: The Attributes): verified at the baseline, Implemented, Verification Incomplete now
- MA5 (Criteria: Mastery Through Play): verified at the baseline, Implemented, Verification Incomplete now
- INT-skipped (Integration): verified at the baseline, Implemented, Verification Incomplete now
- INT-navigation (Integration): verified at the baseline, Implemented, Verification Incomplete now
- INT-long-runs (Integration): verified at the baseline, Implemented, Verification Incomplete now
- INT-gate (Integration): verified at the baseline, Implemented, Verification Incomplete now
