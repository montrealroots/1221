# Brief 11’s Completion Receipt

Written by `receipt.py` from `baseline.json` (the matrix frozen at `main`’s `0e7ff7c2`) and the matrix as it stands. Nothing here is typed.

- **Against the original full baseline:** 535 of 608 (87.9%) rows in scope Implemented And Verified (at the baseline, 530 of 608).
- **Of the actionable portion:** 5 of 46 (10.8%) closed by implementation or verification.
- **The matrix’s own count:** 535 of 599 rows in scope Implemented And Verified (89.3%); 53 Implemented, Verification Incomplete, 0 Partially Implemented, 0 Not Implemented, 0 Blocked Externally, 11 Decision Required, 36 Explicitly Deferred. Its denominator is smaller than 608 by the administrative rows, which aren’t progress.
- **Not complete:** decision 4’s rows stay as authorized, and every remaining row is listed below with what it lacks.

## Status Now, Of The Baseline’s Rows

| Status | At The Baseline | Now |
|---|---|---|
| Implemented And Verified | 530 | 535 |
| Implemented, Verification Incomplete | 63 | 53 |
| Partially Implemented | 0 | 0 |
| Not Implemented | 4 | 0 |
| Blocked Externally | 0 | 0 |
| Decision Required | 11 | 11 |
| Explicitly Deferred | 27 | 36 |

## Closed By Implementation Or Verification (5)

| Row | Group | At The Baseline |
|---|---|---|
| `coverage09.4-fold` | Brief 09 Area: coverage | Implemented, Verification Incomplete |
| `coverage09.5-journeys-fold` | Brief 09 Area: coverage | Implemented, Verification Incomplete |
| `coverage09.6-journeys-followup-fold` | Brief 09 Area: coverage | Implemented, Verification Incomplete |
| `genres.4-kept` | Brief 09 Area: genres | Implemented, Verification Incomplete |
| `genres.6-table` | Brief 09 Area: genres | Implemented, Verification Incomplete |

## Administrative Corrections (9), Not Progress

| Row | Group | Category | At The Baseline | Now |
|---|---|---|---|---|
| `tax.s8.residence_naturalization` | Remaining Area: tax | duplicate | Implemented, Verification Incomplete | Explicitly Deferred |
| `tax.s8.jurisdiction` | Remaining Area: tax | historical-record | Implemented, Verification Incomplete | Explicitly Deferred |
| `judge.baseline` | Brief 09 Area: judge | historical-record | Implemented, Verification Incomplete | Explicitly Deferred |
| `judge.stamina-load` | Brief 09 Area: judge | duplicate | Not Implemented | Explicitly Deferred |
| `judge.baseline` | Brief 10 Area: judge | historical-record | Implemented, Verification Incomplete | Explicitly Deferred |
| `ST3.asWritten` | Brief 10 Area: judge | superseded | Not Implemented | Explicitly Deferred |
| `H4.asWritten` | Brief 10 Area: judge | superseded | Not Implemented | Explicitly Deferred |
| `L3.asWritten` | Brief 10 Area: judge | superseded | Not Implemented | Explicitly Deferred |
| `stamina.measure` | Brief 10 Area: stamina | historical-record | Implemented, Verification Incomplete | Explicitly Deferred |

## Remaining In The Actionable Portion (41)

| Row | Group | Now | What It Lacks |
|---|---|---|---|
| `health.enroll` | Life, Health And Time | Implemented, Verification Incomplete | Fixed 2026-10-10: an enrollment waiting for its month is refused ‘You’re enrolled from …’ (mayEnroll), through the command across a reload in tests/evidence-g03-life.test.ts. 2026-10-16: HUSKY D kept at renewal through work is held on a FIXTURE (tests/remaining-health-billing.test.ts, wages by hand, as no played life on HUSKY D has any). / The duplicate-enrollment refusal 'You’re enrolled from …'  |
| `l-actor` | Creation, Profile, Home And The Looks | Implemented, Verification Incomplete | None. The header (actor.tsx:1-4) said 'an interest' was among what it opens until the interests went on 2026-10-10; it now says so in the past tense. / None reaches the branch: only a save from before schema 94 carries an 'interest' source. tests/migration-94.test.ts migrates such a save but doesn’t open the actor look. / no test reaches it |
| `tax.s8.f1_status` | Remaining Area: tax | Implemented, Verification Incomplete | the area called it verified as it stands and cites no gate test that holds it |
| `tax.s8.ssn` | Remaining Area: tax | Implemented, Verification Incomplete | the area called it verified as it stands and cites no gate test that holds it |
| `tax.s8.opt` | Remaining Area: tax | Implemented, Verification Incomplete | the area called it verified as it stands and cites no gate test that holds it |
| `tax.s8.license` | Remaining Area: tax | Implemented, Verification Incomplete | the area called it verified as it stands and cites no gate test that holds it |
| `tax.s8.visas_authorizations` | Remaining Area: tax | Implemented, Verification Incomplete | the area called it verified as it stands and cites no gate test that holds it |
| `genres.7-measured` | Brief 09 Area: genres | Implemented, Verification Incomplete | the area called it verified as it stands and cites no gate test that holds it / The criteria that failed before (G1 as written, S2 and S3 as first written, H4, F2 as written, ST3, ST6) fail after as they did; none of them is this area’s, and none is counted met.; S3 revised fell on the held-out samples (82.9% to 81.4%, 82.0% to 81.7%) and holds: the new scenes’ own signals decide more of their sid |
| `judge.coverage-row` | Brief 09 Area: judge | Implemented, Verification Incomplete | the area called it corrected to 65, read from SCENES, with what 2026-10-16 added and cites no gate test that holds it |
| `advice.harness` | Brief 10 Area: advice | Implemented, Verification Incomplete | the area called it implemented and cites no gate test that holds it / TEST SETUP: abilities, techniques and stamina’s fitness drawn within the band and set where each is kept; every calendar hour cleared and the student rested before every command, as F2-A’s set-up does; F2-A’s own adv-N set-up kept exactly as it was, including that it never set the four abilities kept in the craft (it wrote them  |
| `advice.F2` | Brief 10 Area: advice | Implemented, Verification Incomplete | the area called it verified as it stands and cites no gate test that holds it |
| `advice.F2A10-a` | Brief 10 Area: advice | Implemented, Verification Incomplete | the area called it implemented and cites no gate test that holds it |
| `advice.F2A10-c` | Brief 10 Area: advice | Implemented, Verification Incomplete | the area called it verified as it stands and cites no gate test that holds it |
| `advice.F2A10-f` | Brief 10 Area: advice | Decision Required | Which preparation the criterion means. As implemented, a take held back most by its own preparation (lines, breakdown, rehearsal, the way of playing rehearsed in) is read as prepared, and knowing the genre is read as it is known today, since familiarity carries from piece to piece and isn’t prepared for one. Read with the genre’s shortfall completed too (the criterion’s words, any preparation): me |
| `advice.F2A10-h` | Brief 10 Area: advice | Decision Required | The nine held-out cases whose trained input’s forecast didn’t fall are all near mastery, each within a thousandth (the largest rise 0.001). Played on tuning case adv-t-19: imagination alone raised to the level twenty sessions reach lowers its forecast (0.547 to 0.546); discipline alone raised to what the twenty days keep raises it (to 0.549), because discipline’s lift (DEVELOPMENT.disciplineLift)  |
| `advice.tests` | Brief 10 Area: advice | Implemented, Verification Incomplete | the area called it implemented and cites no gate test that holds it |
| `advice.heldout` | Brief 10 Area: advice | Implemented, Verification Incomplete | the area called it implemented and cites no gate test that holds it |
| `advice.harness-hospital` | Brief 10 Area: advice | Implemented, Verification Incomplete | the area called it fixed and cites no gate test that holds it |
| `ST3-R.e` | Brief 10 Area: judge | Implemented, Verification Incomplete | Measured on the integrated code by the committed tools (integrated/after/); no gate test holds this clause itself / verified as it stands |
| `ST6-R.a` | Brief 10 Area: judge | Decision Required | ST6-R (a) asks the restrained specialist (emotional depth 85, composure 75, focus 75, the other nine at 40.56 to keep 600) to beat the even actor (every ability 50) playing the better-suited side, against the grain, on a quarter of 44 materials. Measured at that budget it does on 3. The cause, measured: where restraint suits, with both playing restrained, it's ahead of the even actor on only 13 of |
| `ST6-R.c` | Brief 10 Area: judge | Decision Required | ST6-R (a) asks the restrained specialist (emotional depth 85, composure 75, focus 75, the other nine at 40.56 to keep 600) to beat the even actor (every ability 50) playing the better-suited side, against the grain, on a quarter of 44 materials. Measured at that budget it does on 3. The cause, measured: where restraint suits, with both playing restrained, it's ahead of the even actor on only 13 of |
| `ST6-R.e` | Brief 10 Area: judge | Decision Required | ST6-R (a) asks the restrained specialist (emotional depth 85, composure 75, focus 75, the other nine at 40.56 to keep 600) to beat the even actor (every ability 50) playing the better-suited side, against the grain, on a quarter of 44 materials. Measured at that budget it does on 3. The cause, measured: where restraint suits, with both playing restrained, it's ahead of the even actor on only 13 of |
| `ST6-R.g` | Brief 10 Area: judge | Decision Required | ST6-R (a) asks the restrained specialist (emotional depth 85, composure 75, focus 75, the other nine at 40.56 to keep 600) to beat the even actor (every ability 50) playing the better-suited side, against the grain, on a quarter of 44 materials. Measured at that budget it does on 3. The cause, measured: where restraint suits, with both playing restrained, it's ahead of the even actor on only 13 of |
| `H4-R.e` | Brief 10 Area: judge | Implemented, Verification Incomplete | The mutations ran in copies by tools/judge-mutations.mjs, recorded in integrated/after/mutations.json; no gate test runs them / verified as it stands |
| `L3-R.a` | Brief 10 Area: judge | Implemented, Verification Incomplete | Measured on the integrated code by the committed tools (integrated/after/); no gate test holds this clause itself / verified as it stands |
| `L3-R.b` | Brief 10 Area: judge | Implemented, Verification Incomplete | Measured on the integrated code by the committed tools (integrated/after/); no gate test holds this clause itself / verified as it stands |
| `L3-R.e` | Brief 10 Area: judge | Implemented, Verification Incomplete | Measured on the integrated code by the committed tools (integrated/after/); no gate test holds this clause itself / verified as it stands |
| `judge.together` | Brief 10 Area: judge | Implemented, Verification Incomplete | Measured on the integrated code by the committed tools (integrated/after/README.md); the criteria that fail, ST6-R (a), (c), (e), (g), F2 as written and the four originals, fail as they did / verified as it stands |
| `judge.tests` | Brief 10 Area: judge | Implemented, Verification Incomplete | the area called it implemented and cites no gate test that holds it |
| `ST6-R.bPrime` | Brief 10 Area: judge | Decision Required | Whether ST6-R (b′), the restrained specialist’s lift over the even actor, both restrained, more than 0.05 larger with restraint’s draws than with them taken out, on at least 90% of the materials where both sides fit, replaces (b) as written. ST6-R’s other clauses and its threshold are unchanged, as the owner asked. |
| `A1` | Brief 10 Area: judge | Implemented, Verification Incomplete | Measured by tools/ag-baseline.ts and tools/ag-criteria.mjs on the integrated code; no gate test holds A1’s figure. A night drains as it did by WORKLOAD.full’s design, so A1 is met by briefs and scenes, and read at a lead a night would be 0.487, short of 0.5 / verified as it stands |
| `stamina.A1` | Brief 10 Area: stamina | Implemented, Verification Incomplete | Met on brief 10’s integrated code by the judge area’s second phase (remaining-10/judge-result.json, A1): stamina’s briefs 0.53 and scenes 0.54, its nights 0.334 at a supporting part as the tool reads them (0.487 at a lead, 0.138 featured), measured by tools/ag-baseline.ts and tools/ag-criteria.mjs (decisions-2026-10-16/integrated/after/criteria.txt, a1-nights.json); no gate test holds A1’s figure. |
| `A4` | Criteria: The Attributes | Implemented, Verification Incomplete | Judged by reading the code (phase-2b.md §9), not by a test the gate runs: no assertion would fail if it stopped holding |
| `A5` | Criteria: The Attributes | Implemented, Verification Incomplete | Judged by reading the code (phase-2b.md §9), not by a test the gate runs: no assertion would fail if it stopped holding |
| `T1` | Criteria: The Attributes | Implemented, Verification Incomplete | Judged by reading the code (phase-2b.md §9), not by a test the gate runs: no assertion would fail if it stopped holding |
| `O3` | Criteria: The Attributes | Implemented, Verification Incomplete | Judged by reading the code (phase-2b.md §9), not by a test the gate runs: no assertion would fail if it stopped holding |
| `F1` | Criteria: The Attributes | Implemented, Verification Incomplete | Judged by reading the code (phase-2b.md §9), not by a test the gate runs: no assertion would fail if it stopped holding |
| `F3` | Criteria: The Attributes | Implemented, Verification Incomplete | Judged by reading the code (phase-2b.md §9), not by a test the gate runs: no assertion would fail if it stopped holding |
| `L1` | Criteria: Long-Term Continuity | Decision Required | L1 held before brief 10 and fails after it. On the final code the week’s top recommendation in the 120-day journeys is focus 8 weeks running for the specialist (51 to 55) and 6 for the beginner (55 to 56), where L1 allows 4 without the input rising 5 points; brief 09 read 4 and 3. The advice area’s change moved it on its own (84db36b7 reads 8 and 6; the judge’s first phase alone read 4 and 3). The |
| `KS-ct-idcard` | Known Shortfalls And Missing Tests | Implemented, Verification Incomplete | The tax area’s sources weren’t conclusive on the term and the mailing for a non-citizen; unchanged, and no authoritative source verifies them (tax-result.json) |
| `KS-passport-fees` | Known Shortfalls And Missing Tests | Implemented, Verification Incomplete | Some fees in content/passportsabroad.ts are estimates, marked as assumptions, not verified figures (tax-result.json) |

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

## Rows Not In The Baseline (0)

None: the baseline wasn’t changed.

## What The Receipt Found (0)

Nothing: no baseline row is missing, decision 4’s rows are unchanged, no administrative row is counted verified, and no row verified at the baseline has fallen back.

## Every Baseline Row

| Row | Group | Category | At The Baseline | Now |
|---|---|---|---|---|
| `life.sleep` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `life.look_after` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `life.look_after:eat` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `life.look_after:order` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `life.look_after:wash` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `life.look_after:exercise` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `life.look_after:unwind` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `calendar.schedule` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `calendar.cancel` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `calendar.skip` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `world.dismiss_decision` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `world.mark_read` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `world.set_preferences` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `world.take_decision_action` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `tutorial.read` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `health.appeal` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `health.apply_aid` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `health.book` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `health.cancel_appointment` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `health.choose_clinic` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `health.choose_pharmacy` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `health.dental` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `health.drop` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `health.enroll` | Life, Health And Time | verification | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `health.apply` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `health.request_hardship` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `health.extra_supply` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `health.pay_bill` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `health.prepay` | Life, Health And Time | deferred at the baseline | Explicitly Deferred | Explicitly Deferred |
| `health.therapy` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `health.treat` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `life.birthday` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `life.commitment` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `life.day_rollover` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `life.end` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `world.tick` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `health.appeal_decided` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `health.appointment` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `health.bill` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `health.month` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `health.therapy_session` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `health.week` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `injury.comp` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `energy` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `sleepDebt` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `condition` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `fitness` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `nourishment` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `hygiene` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `stress` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `morale` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `readiness` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `weather/trainingAt` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `seasons/flu` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `holidays` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `injuries` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `chronic` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `body` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `mortality` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `knob:stressGain` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `knob:stressRecovery` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `knob:sleepQuality` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `knob:energyRecovery` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `knob:hygieneDrift` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `knob:moraleSwing` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `knob:spending` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `knob:illnessToll` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `knob:appetite` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `knob:mealMood` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `knob:bondWarmth|bondWound|company|morning|evening|readsAround|drills|skims|revises` | Life, Health And Time | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `bank.add_standing_order` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `bank.arrange_overdraft` | Money | decision-4 | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `bank.borrow` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `bank.break_term` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `bank.cancel_new` | Money | decision-4 | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `bank.cancel_scheduled` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `bank.cancel_standing_order` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `bank.claim_unclaimed` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `bank.close_savings` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `bank.debit_overdraft` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `bank.new_number` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `bank.open_savings` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `bank.open_term` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `bank.pay_collections` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `bank.reactivate` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `bank.repay_loan` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `bank.schedule_payment` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `bank.set_alerts` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `bank.set_payments` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `bank.set_round_ups` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `bank.set_term_end` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `bank.switch` | Money | decision-4 | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `bank.take_overrun_loan` | Money | decision-4 | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `bank.take_term_interest` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `bank.transfer` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `card.apply` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `card.close` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `card.dispute` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `card.lock` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `card.money_transfer` | Money | decision-4 | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `card.plan` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `card.redeem_rewards` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `card.refund_credit` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `card.report` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `card.request_hardship` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `card.request_limit` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `card.set_auto_raise` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `card.set_everyday` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `card.set_over_limit` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `card.set_statement_day` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `cash.deposit` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `cash.withdraw` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `finance.pay_card` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `finance.set_autopay` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `bank.fraud_refund` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `bank.loan_due` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `bank.month_end` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `bank.savings_notice` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `bank.scheduled_payment` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `bank.standing_order` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `bank.switch_complete` | Money | decision-4 | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `card.arrives` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `card.due` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `card.replaced` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `card.statement` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `daily food spending` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `ledger` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `credit score` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `statements` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `bank.open_current` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `bank.set_primary` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `bank.redirect_deposits` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `bank.set_order_source` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `card.set_autopay_from` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `bank.set_loan_repayment` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `bank.close_current` | Money | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `bank.cancel_switch` | Money | decision-4 | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `bank.stop_balance_transfer` | Money | decision-4 | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `documents.apply_idcard` | Papers | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `documents.apply_opt` | Papers | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `documents.apply_passport` | Papers | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `documents.naturalize` | Papers | deferred at the baseline | Explicitly Deferred | Explicitly Deferred |
| `documents.police_report` | Papers | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `documents.renew_residence` | Papers | deferred at the baseline | Explicitly Deferred | Explicitly Deferred |
| `documents.replace_idcard` | Papers | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `documents.replace_license` | Papers | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `documents.report_lost` | Papers | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `documents.residence` | Papers | deferred at the baseline | Explicitly Deferred | Explicitly Deferred |
| `documents.settle` | Papers | deferred at the baseline | Explicitly Deferred | Explicitly Deferred |
| `benefits.assistance` | Papers | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `benefits.claim` | Papers | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `benefits.ei_register` | Papers | deferred at the baseline | Explicitly Deferred | Explicitly Deferred |
| `pension.bienestar` | Papers | deferred at the baseline | Explicitly Deferred | Explicitly Deferred |
| `pension.ie_state` | Papers | deferred at the baseline | Explicitly Deferred | Explicitly Deferred |
| `pension.imss` | Papers | deferred at the baseline | Explicitly Deferred | Explicitly Deferred |
| `pension.social_security` | Papers | deferred at the baseline | Explicitly Deferred | Explicitly Deferred |
| `pension.state` | Papers | deferred at the baseline | Explicitly Deferred | Explicitly Deferred |
| `tax.file` | Papers | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `tax.pay` | Papers | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `citizenship.decided` | Papers | deferred at the baseline | Explicitly Deferred | Explicitly Deferred |
| `documents.decided` | Papers | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `documents.idcard_arrives` | Papers | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `documents.opt_week` | Papers | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `documents.permission` | Papers | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `documents.us_status` | Papers | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `documents.visit` | Papers | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `benefits.assistance_month` | Papers | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `benefits.week` | Papers | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `benefits.desempleo_month` | Papers | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `benefits.ja_week` | Papers | deferred at the baseline | Explicitly Deferred | Explicitly Deferred |
| `benefits.uc_period` | Papers | deferred at the baseline | Explicitly Deferred | Explicitly Deferred |
| `pension.ie_week / pension.bienestar_payment / pension.imss_month / pension.ss_month / pension.state_payment` | Papers | deferred at the baseline | Explicitly Deferred | Explicitly Deferred |
| `tax.season` | Papers | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `tax.due` | Papers | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `tax.substitute` | Papers | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `tax.notice` | Papers | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `tax.refund` | Papers | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `tax.pay_state` | Papers | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `tax.amend` | Papers | decision-4 | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `tax.apply_plan` | Papers | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `tax.revise_plan` | Papers | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `tax.catch_up_plan` | Papers | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `tax.apply_state_plan` | Papers | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `tax.catch_up_state_plan` | Papers | decision-4 | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `tax.lien_release` | Papers | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `tax.lien_dispute` | Papers | decision-4 | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `tax.federal_lien_withdraw` | Papers | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `tax.request_waiver` | Papers | decision-4 | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `documents.apply_ssn` | Papers | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.prepare` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.approach` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.choose` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.choose_playing` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.read_feedback` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.ask_partner` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.answer_partner` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.cancel_rehearsal` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.make_amends` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.respond` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.orientation` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.learn_part` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.choose_part_playing` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.review_blocking` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.work_note` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `work.identify` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `work.try` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `work.settle` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.call_in_sick` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.take_shift` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.buy_ppe` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.cabaret` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.summer_cabaret` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `plays.read` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `plays.research` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `practice.exercise` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `practice.self_tape` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `brief.prepare` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `brief.choose` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `brief.reader` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `genre.study` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.term` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.week` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.classes` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.shift` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.payday` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.call` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.evaluation` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.commencement` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.company` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.lab` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.cabaret (kind)` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.summer` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.stipend` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.recess` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.orientation (kind)` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.partner_ask` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.partner_rehearsal` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.study_session` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.moment` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `abilities+techniques` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `development ledger` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `work records + journey` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `genre familiarity/practice` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `genre demands` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `classmates abilities/craft` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `classmate trust/bonds` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `casting (castFit/castScore)` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `standing/term evaluation` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `notes and feedback` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `preparation dims` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `showing/night bands` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `credits` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `work-study` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.request_leave` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.cancel_leave` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.appeal_leave` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.return_notice` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.reregister` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.buy_affiliate` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.withdraw` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.make_up` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.extend_incomplete` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.request_repeat` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.cancel_repeat` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.request_extra_term` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.pay_balance` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.request_aid_review` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.request_conversion` | School | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `c-names` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `c-displayName` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `c-pronouns` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `c-performerTitle` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `c-birthdate` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `c-birthplace` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `c-citizenship` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `c-race` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `c-portrait` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `c-disp-emotionalStability` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `c-disp-conscientiousness` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `c-disp-ambition` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `c-disp-riskTolerance` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `c-disp-extraversion` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `c-disp-openness` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `c-disp-agreeableness` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `c-traits` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `c-genres` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `c-background` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `c-body` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `c-whereLive` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `c-livesWhereBorn` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `c-wealth` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `c-family` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `c-bank` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `c-startDate` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `c-tutorial` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `trait-stressGain` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `trait-stressRecovery` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `trait-sleepQuality` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `trait-energyRecovery` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `trait-hygieneDrift` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `trait-moraleSwing` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `trait-spending` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `trait-mealMood` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `trait-illnessToll` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `trait-receipts` | Creation, Profile, Home And The Looks | deferred at the baseline | Explicitly Deferred | Explicitly Deferred |
| `trait-bondWarmth-bondWound` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `trait-company` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `trait-appetite` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `trait-morning-evening` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `trait-prep` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `p-identity` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `p-identity-buttons` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `p-traits-line` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `p-abilities` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `p-techniques` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `p-genres` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `p-condition` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `p-journey-history` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `h-head` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `h-calendar` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `h-needs` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `h-how` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `h-where-weather` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `h-money` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `h-school` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `h-papers` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `l-person` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `l-dial-stress` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `l-trait` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `l-actor` | Creation, Profile, Home And The Looks | verification | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `n-decision-tax` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `n-decision-unclaimed` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `n-decision-us-status` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `n-notify` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `n-dismiss-expire` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `i-runtime` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `i-ui-text` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `i-stale-claims` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `i-genres-dispositions-intact` | Creation, Profile, Home And The Looks | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `banking.1` | Remaining Area: banking | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `banking.1.overdraft-interest` | Remaining Area: banking | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `banking.1.standing-orders` | Remaining Area: banking | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `banking.1.pro-rata` | Remaining Area: banking | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `banking.2` | Remaining Area: banking | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `banking.s7.opening` | Remaining Area: banking | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `banking.s7.ownership` | Remaining Area: banking | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `banking.s7.switching` | Remaining Area: banking | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `banking.s7.closure` | Remaining Area: banking | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `banking.s7.funds` | Remaining Area: banking | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `banking.s7.transfers` | Remaining Area: banking | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `banking.s7.rejections` | Remaining Area: banking | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `banking.s7.statements` | Remaining Area: banking | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `banking.s7.features` | Remaining Area: banking | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `banking.s7.school` | Remaining Area: banking | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `banking.s7.holds` | Remaining Area: banking | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `coverage.1-separate-totals` | Remaining Area: coverage | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `coverage.2-i-stale-claims` | Remaining Area: coverage | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `coverage.3-unresolved-rows` | Remaining Area: coverage | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `coverage.4-fold-areas` | Remaining Area: coverage | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `coverage.d-renames-chain` | Remaining Area: coverage | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `coverage.d-fixture-kind` | Remaining Area: coverage | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `coverage.d-evidence-cell` | Remaining Area: coverage | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `coverage.d-stale-claims-walk` | Remaining Area: coverage | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `coverage.5-added-rows` | Remaining Area: coverage | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `coverage.6-savings-notice-played` | Remaining Area: coverage | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `coverage.7-overdraft-home-panel` | Remaining Area: coverage | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `health-billing.1-reprice-plan-part` | Remaining Area: health-billing | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `health-billing.2-husky-d-kept-through-work` | Remaining Area: health-billing | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `health-billing.3-insured-paths-trace` | Remaining Area: health-billing | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `health-eligibility.1-covered-ct-status-barred` | Remaining Area: health-eligibility | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `health-eligibility.2-work-exemptions` | Remaining Area: health-eligibility | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `health-eligibility.3-notice-and-response` | Remaining Area: health-eligibility | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `health-eligibility.4-look-back` | Remaining Area: health-eligibility | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `health-eligibility.5-f1-premium-credit-2026` | Remaining Area: health-eligibility | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `health-eligibility.6-work-test-income` | Remaining Area: health-eligibility | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `health-eligibility.7-renewal-and-decision-notices` | Remaining Area: health-eligibility | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.repeat-room-leave` | Remaining Area: school | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.unreached-refusals` | Remaining Area: school | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.d-appeal-before-begun` | Remaining Area: school | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.continuity` | Remaining Area: school | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.s6.missed-term` | Remaining Area: school | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.d-coursework-shown` | Remaining Area: school | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.s6.journey` | Remaining Area: school | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.s6.policy` | Remaining Area: school | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.s6.dead-ends` | Remaining Area: school | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `school.d-not-registered-hold` | Remaining Area: school | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `tax.early_filing_notices` | Remaining Area: tax | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `tax.ct_filed_in_error` | Remaining Area: tax | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `tax.amend` | Remaining Area: tax | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `tax.catch_up_state_plan` | Remaining Area: tax | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `tax.lien_dispute` | Remaining Area: tax | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `tax.federal_lien_withdraw` | Remaining Area: tax | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `tax.request_waiver` | Remaining Area: tax | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `tax.other_refusals` | Remaining Area: tax | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `tax.s8.inventory` | Remaining Area: tax | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `tax.s8.passport` | Remaining Area: tax | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `tax.s8.idcard` | Remaining Area: tax | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `tax.s8.f1_status` | Remaining Area: tax | verification | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `tax.s8.ssn` | Remaining Area: tax | verification | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `tax.s8.opt` | Remaining Area: tax | verification | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `tax.s8.license` | Remaining Area: tax | verification | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `tax.s8.visas_authorizations` | Remaining Area: tax | verification | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `tax.s8.residence_naturalization` | Remaining Area: tax | duplicate | Implemented, Verification Incomplete | Explicitly Deferred |
| `tax.s8.jurisdiction` | Remaining Area: tax | historical-record | Implemented, Verification Incomplete | Explicitly Deferred |
| `banking.1.pro-rata` | Brief 09 Area: banking | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `banking.1.pro-rata.month-end` | Brief 09 Area: banking | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `banking.1.pro-rata.opening-month` | Brief 09 Area: banking | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `banking.3.homecloses` | Brief 09 Area: banking | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `banking.2.scope` | Brief 09 Area: banking | decision-4 | Decision Required | Decision Required |
| `banking.2.arrange_overdraft` | Brief 09 Area: banking | decision-4 | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `banking.2.cancel_new` | Brief 09 Area: banking | decision-4 | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `banking.2.switch` | Brief 09 Area: banking | decision-4 | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `banking.2.switch_complete` | Brief 09 Area: banking | decision-4 | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `banking.2.cancel_switch` | Brief 09 Area: banking | decision-4 | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `banking.2.stop_balance_transfer` | Brief 09 Area: banking | decision-4 | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `banking.2.take_overrun_loan` | Brief 09 Area: banking | decision-4 | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `banking.2.money_transfer` | Brief 09 Area: banking | decision-4 | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `banking.4.sparkassen-card` | Brief 09 Area: banking | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `banking.5.arion-card` | Brief 09 Area: banking | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `banking.6.fee-schedule` | Brief 09 Area: banking | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `banking.7.redirect-close` | Brief 09 Area: banking | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `banking.8.apostrophes` | Brief 09 Area: banking | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `coverage09.1-brief.prepare` | Brief 09 Area: coverage | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `coverage09.1-brief.choose` | Brief 09 Area: coverage | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `coverage09.1-brief.reader` | Brief 09 Area: coverage | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `coverage09.1-school.choose_playing` | Brief 09 Area: coverage | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `coverage09.1-school.choose_part_playing` | Brief 09 Area: coverage | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `coverage09.1-work.identify` | Brief 09 Area: coverage | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `coverage09.1-work.try` | Brief 09 Area: coverage | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `coverage09.1-work.settle` | Brief 09 Area: coverage | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `coverage09.1-life.look_after` | Brief 09 Area: coverage | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `coverage09.2-hardship-renewal` | Brief 09 Area: coverage | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `coverage09.3-unresolved` | Brief 09 Area: coverage | decision-4 | Decision Required | Decision Required |
| `coverage09.4-fold` | Brief 09 Area: coverage | verification | Implemented, Verification Incomplete | Implemented And Verified |
| `coverage09.5-journeys-fold` | Brief 09 Area: coverage | verification | Implemented, Verification Incomplete | Implemented And Verified |
| `coverage09.6-journeys-followup-fold` | Brief 09 Area: coverage | verification | Implemented, Verification Incomplete | Implemented And Verified |
| `genres.1-count` | Brief 09 Area: genres | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `genres.2-compare` | Brief 09 Area: genres | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `genres.3-animated` | Brief 09 Area: genres | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `genres.3-christmas` | Brief 09 Area: genres | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `genres.3-conspiracy_thriller` | Brief 09 Area: genres | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `genres.3-farce` | Brief 09 Area: genres | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `genres.3-film_noir` | Brief 09 Area: genres | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `genres.3-gothic_horror` | Brief 09 Area: genres | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `genres.3-jukebox_musical` | Brief 09 Area: genres | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `genres.3-new_wave` | Brief 09 Area: genres | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `genres.3-psychological_thriller` | Brief 09 Area: genres | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `genres.3-samurai` | Brief 09 Area: genres | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `genres.3-silent_film` | Brief 09 Area: genres | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `genres.3-sword_and_sorcery` | Brief 09 Area: genres | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `genres.3-tragicomedy` | Brief 09 Area: genres | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `genres.3-yakuza` | Brief 09 Area: genres | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `genres.4-kept` | Brief 09 Area: genres | verification | Implemented, Verification Incomplete | Implemented And Verified |
| `genres.5-saves` | Brief 09 Area: genres | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `genres.6-table` | Brief 09 Area: genres | verification | Implemented, Verification Incomplete | Implemented And Verified |
| `genres.7-measured` | Brief 09 Area: genres | verification | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `genres.8-docs` | Brief 09 Area: genres | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `journeys.known-graduated-school-page` | Brief 09 Area: journeys | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `journeys.x1-yale-payment-savings-hold-registration` | Brief 09 Area: journeys | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `journeys.x2-leave-affiliate-bill` | Brief 09 Area: journeys | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `journeys.x3-withdrawal-health-tax-papers` | Brief 09 Area: journeys | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `journeys.x4-document-expiring` | Brief 09 Area: journeys | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `journeys.played-school` | Brief 09 Area: journeys | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `journeys.played-money` | Brief 09 Area: journeys | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `journeys.played-papers` | Brief 09 Area: journeys | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `journeys.played-health` | Brief 09 Area: journeys | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `journeys.actions` | Brief 09 Area: journeys | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `journeys.d-aid-past-balance` | Brief 09 Area: journeys | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `journeys.d-cover-ended-notice` | Brief 09 Area: journeys | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `journeys.d-medicaid-start` | Brief 09 Area: journeys | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `journeys.d-expired-license-next-step` | Brief 09 Area: journeys | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `journeys.d-lapse-appointment` | Brief 09 Area: journeys | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `journeys.d-lapse-prescription` | Brief 09 Area: journeys | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `journeys.d-hardship-ended-renewal` | Brief 09 Area: journeys | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `journeys.f-mexico-residence` | Brief 09 Area: journeys | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `journeys.f-injury-space` | Brief 09 Area: journeys | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `journeys.f-ended-life-loops` | Brief 09 Area: journeys | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `journeys.d-f1-term-notice` | Brief 09 Area: journeys | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `judge.baseline` | Brief 09 Area: judge | historical-record | Implemented, Verification Incomplete | Explicitly Deferred |
| `judge.ST3` | Brief 09 Area: judge | deferred at the baseline | Explicitly Deferred | Explicitly Deferred |
| `judge.ST6` | Brief 09 Area: judge | deferred at the baseline | Explicitly Deferred | Explicitly Deferred |
| `judge.H4` | Brief 09 Area: judge | deferred at the baseline | Explicitly Deferred | Explicitly Deferred |
| `judge.L3` | Brief 09 Area: judge | deferred at the baseline | Explicitly Deferred | Explicitly Deferred |
| `judge.remeasure` | Brief 09 Area: judge | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `judge.length` | Brief 09 Area: judge | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `judge.stamina-load` | Brief 09 Area: judge | duplicate | Not Implemented | Explicitly Deferred |
| `judge.classes-fitness` | Brief 09 Area: judge | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `judge.coverage-row` | Brief 09 Area: judge | verification | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `advice.harness` | Brief 10 Area: advice | verification | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `advice.F2` | Brief 10 Area: advice | verification | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `advice.F2A10-a` | Brief 10 Area: advice | verification | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `advice.F2A10-b` | Brief 10 Area: advice | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `advice.F2A10-c` | Brief 10 Area: advice | verification | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `advice.F2A10-d` | Brief 10 Area: advice | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `advice.F2A10-e` | Brief 10 Area: advice | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `advice.F2A10-f` | Brief 10 Area: advice | design-or-gameplay | Decision Required | Decision Required |
| `advice.F2A10-g` | Brief 10 Area: advice | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `advice.F2A10-h` | Brief 10 Area: advice | design-or-gameplay | Decision Required | Decision Required |
| `advice.F2A10-i` | Brief 10 Area: advice | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `advice.tests` | Brief 10 Area: advice | verification | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `advice.heldout` | Brief 10 Area: advice | verification | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `advice.harness-hospital` | Brief 10 Area: advice | verification | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `arion.AR0.research` | Brief 10 Area: arion | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `arion.AR0.assumption` | Brief 10 Area: arion | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `arion.AR1.first-charge` | Brief 10 Area: arion | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `arion.AR2.renewal` | Brief 10 Area: arion | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `arion.AR3.close` | Brief 10 Area: arion | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `arion.AR4.refund` | Brief 10 Area: arion | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `arion.AR5.insufficient-funds` | Brief 10 Area: arion | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `arion.AR6.duplicates` | Brief 10 Area: arion | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `arion.AR7.save-and-calendar` | Brief 10 Area: arion | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `arion.AR7.older-save` | Brief 10 Area: arion | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `arion.AR8.verified-as-specified` | Brief 10 Area: arion | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `judge.baseline` | Brief 10 Area: judge | historical-record | Implemented, Verification Incomplete | Explicitly Deferred |
| `judge.budget` | Brief 10 Area: judge | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `ST3-R.a` | Brief 10 Area: judge | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `ST3-R.b` | Brief 10 Area: judge | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `ST3-R.c` | Brief 10 Area: judge | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `ST3-R.d` | Brief 10 Area: judge | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `ST3-R.e` | Brief 10 Area: judge | verification | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `ST3.asWritten` | Brief 10 Area: judge | superseded | Not Implemented | Explicitly Deferred |
| `ST6-R.a` | Brief 10 Area: judge | design-or-gameplay | Decision Required | Decision Required |
| `ST6-R.b` | Brief 10 Area: judge | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `ST6-R.c` | Brief 10 Area: judge | design-or-gameplay | Decision Required | Decision Required |
| `ST6-R.d` | Brief 10 Area: judge | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `ST6-R.e` | Brief 10 Area: judge | design-or-gameplay | Decision Required | Decision Required |
| `ST6-R.f` | Brief 10 Area: judge | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `ST6-R.g` | Brief 10 Area: judge | design-or-gameplay | Decision Required | Decision Required |
| `ST6.asWritten` | Brief 10 Area: judge | deferred at the baseline | Explicitly Deferred | Explicitly Deferred |
| `H4-R.a` | Brief 10 Area: judge | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `H4-R.b` | Brief 10 Area: judge | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `H4-R.c` | Brief 10 Area: judge | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `H4-R.d` | Brief 10 Area: judge | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `H4-R.e` | Brief 10 Area: judge | verification | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `H4.asWritten` | Brief 10 Area: judge | superseded | Not Implemented | Explicitly Deferred |
| `L3-R.a` | Brief 10 Area: judge | verification | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `L3-R.b` | Brief 10 Area: judge | verification | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `L3-R.c` | Brief 10 Area: judge | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `L3-R.d` | Brief 10 Area: judge | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `L3-R.e` | Brief 10 Area: judge | verification | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `L3.asWritten` | Brief 10 Area: judge | superseded | Not Implemented | Explicitly Deferred |
| `M1` | Brief 10 Area: judge | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `judge.together` | Brief 10 Area: judge | verification | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `judge.tests` | Brief 10 Area: judge | verification | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `judge.stamina` | Brief 10 Area: judge | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `judge.memory` | Brief 10 Area: judge | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `judge.composure` | Brief 10 Area: judge | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `ST6-R.bPrime` | Brief 10 Area: judge | design-or-gameplay | Decision Required | Decision Required |
| `A1` | Brief 10 Area: judge | verification | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `stamina.W1` | Brief 10 Area: stamina | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `stamina.W2` | Brief 10 Area: stamina | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `stamina.W3` | Brief 10 Area: stamina | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `stamina.W4` | Brief 10 Area: stamina | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `stamina.W5` | Brief 10 Area: stamina | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `stamina.W6` | Brief 10 Area: stamina | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `stamina.W7` | Brief 10 Area: stamina | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `stamina.W8` | Brief 10 Area: stamina | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `stamina.W9` | Brief 10 Area: stamina | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `stamina.W10` | Brief 10 Area: stamina | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `stamina.M1` | Brief 10 Area: stamina | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `stamina.measure` | Brief 10 Area: stamina | historical-record | Implemented, Verification Incomplete | Explicitly Deferred |
| `stamina.A1` | Brief 10 Area: stamina | verification | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `ST1` | Criteria: The Stage | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `ST2` | Criteria: The Stage | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `ST3` | Criteria: The Stage | deferred at the baseline | Explicitly Deferred | Explicitly Deferred |
| `ST4` | Criteria: The Stage | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `ST5` | Criteria: The Stage | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `ST6` | Criteria: The Stage | deferred at the baseline | Explicitly Deferred | Explicitly Deferred |
| `ST7` | Criteria: The Stage | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `ST8` | Criteria: The Stage | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `ST9` | Criteria: The Stage | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `Stage F1` | Criteria: The Stage | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `Stage F2` | Criteria: The Stage | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `I1` | Criteria: Interpretation | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `I2` | Criteria: Interpretation | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `I3` | Criteria: Interpretation | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `I4` | Criteria: Interpretation | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `I5` | Criteria: Interpretation | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `A1` | Criteria: The Attributes | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `A2` | Criteria: The Attributes | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `A3` | Criteria: The Attributes | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `T2` | Criteria: The Attributes | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `T3` | Criteria: The Attributes | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `G3` | Criteria: The Attributes | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `G4` | Criteria: The Attributes | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `G5` | Criteria: The Attributes | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `M1` | Criteria: The Attributes | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `M3` | Criteria: The Attributes | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `O1` | Criteria: The Attributes | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `O2` | Criteria: The Attributes | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `H2` | Criteria: The Attributes | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `H5` | Criteria: The Attributes | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `H7` | Criteria: The Attributes | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `H4` | Criteria: The Attributes | deferred at the baseline | Explicitly Deferred | Explicitly Deferred |
| `F2` | Criteria: The Attributes | deferred at the baseline | Explicitly Deferred | Explicitly Deferred |
| `F2-A` | Criteria: The Attributes | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `G1` | Criteria: The Attributes | deferred at the baseline | Explicitly Deferred | Explicitly Deferred |
| `A4` | Criteria: The Attributes | verification | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `A5` | Criteria: The Attributes | verification | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `T1` | Criteria: The Attributes | verification | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `O3` | Criteria: The Attributes | verification | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `F1` | Criteria: The Attributes | verification | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `F3` | Criteria: The Attributes | verification | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `L1` | Criteria: Long-Term Continuity | design-or-gameplay | Decision Required | Decision Required |
| `L2` | Criteria: Long-Term Continuity | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `L3` | Criteria: Long-Term Continuity | deferred at the baseline | Explicitly Deferred | Explicitly Deferred |
| `MA1` | Criteria: Mastery Through Play | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `MA2` | Criteria: Mastery Through Play | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `MA3` | Criteria: Mastery Through Play | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `MA4` | Criteria: Mastery Through Play | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `MA6` | Criteria: Mastery Through Play | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `MA7` | Criteria: Mastery Through Play | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `MA5` | Criteria: Mastery Through Play | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `MA8` | Criteria: Mastery Through Play | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `S1` | Criteria: The Genres | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `S2` | Criteria: The Genres | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `S3` | Criteria: The Genres | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `S4` | Criteria: The Genres | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `Genre Audit` | Criteria: The Genres | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `INT-determinism` | Integration | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `INT-time` | Integration | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `INT-duplicates` | Integration | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `INT-migration` | Integration | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `INT-missed-term` | Integration | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `INT-skipped` | Integration | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `INT-navigation` | Integration | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `INT-long-runs` | Integration | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `INT-gate` | Integration | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `KS-matrix-gate` | Known Shortfalls And Missing Tests | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `KS-degree-text` | Known Shortfalls And Missing Tests | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `KS-genres-54` | Known Shortfalls And Missing Tests | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `KS-bank-rows-scope` | Known Shortfalls And Missing Tests | decision-4 | Decision Required | Decision Required |
| `KS-homecloses` | Known Shortfalls And Missing Tests | verified at the baseline | Implemented And Verified | Implemented And Verified |
| `KS-ct-idcard` | Known Shortfalls And Missing Tests | verification | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
| `KS-passport-fees` | Known Shortfalls And Missing Tests | verification | Implemented, Verification Incomplete | Implemented, Verification Incomplete |
