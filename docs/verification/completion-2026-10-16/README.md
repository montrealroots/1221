# Brief 11: The Frozen Baseline And Its Open Rows, 2026-10-16

The owner's "Finish The Current Build Against A Fixed Checklist" (`../briefs-2026-10-16/11-finish-the-current-build-against-a-fixed-checklist.txt`, kept verbatim). This folder holds the checklist the pass works to, frozen before any of its work.

## The Baseline

`baseline.json` is every row of the completion matrix as it stood at `main`'s `0e7ff7c2` (#37's merge), with its stable id, its acceptance criteria (the row's goal, preconditions and validation), its status and its evidence. The figures were read from the matrix, not assumed: they are the ones the brief lists.

| Status | Rows |
|---|---|
| Implemented And Verified | 530 |
| Implemented, Verification Incomplete | 63 |
| Partially Implemented | 0 |
| Not Implemented | 4 |
| Blocked Externally | 0 |
| Decision Required | 11 |
| **In scope** | **608** |
| Explicitly Deferred, outside the denominator | 27 |
| All rows | 635 |

The original denominator, 608, is kept for comparison throughout. Completion against it counts only rows Implemented And Verified: a row this pass moves to Explicitly Deferred as a record is reported apart, and doesn't count as closed.

## The 78 Open Rows, Classified

`classification.json` gives each its category, the reason and the action. In short:

| Category | Rows | Action |
|---|---|---|
| Verification incomplete: actionable | 38 | verified through commands and the screens, with regression tests |
| Gameplay or a design question within the approved intent: actionable | 8 | implemented within the approved intent; any clarification documented first |
| Decision 4's protected rows, unchanged | 23 | none: kept exactly as authorized, in the original totals |
| A superseded historical criterion | 3 | administrative |
| A duplicate of another requirement | 2 | administrative |
| A historical record of a process step | 4 | administrative |

**The actionable portion is 46 rows**, the verification and gameplay rows. The exclusions are decision 4's 23 (its twelve audit rows, its three decision rows, and the banking area's eight items for the same eight bank commands) and the 9 administrative rows, each listed below with its reason.

### Verification incomplete: actionable

| Row | Group | Status at the baseline | Why | Action | Area |
|---|---|---|---|---|---|
| `health.enroll` | Life, Health And Time | Implemented, Verification Incomplete | The duplicate-enrollment refusal and the other gaps the audit row names are tested nowhere | verify through the commands; regression tests | journeys |
| `l-actor` | Creation, Profile, Home And The Looks | Implemented, Verification Incomplete | No test opens the actor look on a migrated save carrying an “interest” source | verify through the look on a migrated save; regression test | journeys |
| `tax.s8.f1_status` | Remaining Area: tax | Implemented, Verification Incomplete | The tax area verified it as it stood and cited no gate test by its title | find or write the gate tests that hold its acceptance, played through the commands | journeys |
| `tax.s8.ssn` | Remaining Area: tax | Implemented, Verification Incomplete | The tax area verified it as it stood and cited no gate test by its title | find or write the gate tests that hold its acceptance, played through the commands | journeys |
| `tax.s8.opt` | Remaining Area: tax | Implemented, Verification Incomplete | The tax area verified it as it stood and cited no gate test by its title | find or write the gate tests that hold its acceptance, played through the commands | journeys |
| `tax.s8.license` | Remaining Area: tax | Implemented, Verification Incomplete | The tax area verified it as it stood and cited no gate test by its title | find or write the gate tests that hold its acceptance, played through the commands | journeys |
| `tax.s8.visas_authorizations` | Remaining Area: tax | Implemented, Verification Incomplete | The tax area verified it as it stood and cited no gate test by its title | find or write the gate tests that hold its acceptance, played through the commands | journeys |
| `coverage09.4-fold` | Brief 09 Area: coverage | Implemented, Verification Incomplete | The audit pipeline’s fold, by-test mapping and regeneration, held by no named gate test | a gate test of the fold and the mapping, and the gate’s coverage check | integration |
| `coverage09.5-journeys-fold` | Brief 09 Area: coverage | Implemented, Verification Incomplete | The audit pipeline’s fold, by-test mapping and regeneration, held by no named gate test | a gate test of the fold and the mapping, and the gate’s coverage check | integration |
| `coverage09.6-journeys-followup-fold` | Brief 09 Area: coverage | Implemented, Verification Incomplete | The audit pipeline’s fold, by-test mapping and regeneration, held by no named gate test | a gate test of the fold and the mapping, and the gate’s coverage check | integration |
| `genres.4-kept` | Brief 09 Area: genres | Implemented, Verification Incomplete | The kept genres’ reasons and the per-genre table are documents held by nothing; genres.7 is a measurement | a gate test that the reasons and the table cover exactly the genres the code keeps alike; genres.7 measured on the tested commit | integration |
| `genres.6-table` | Brief 09 Area: genres | Implemented, Verification Incomplete | The kept genres’ reasons and the per-genre table are documents held by nothing; genres.7 is a measurement | a gate test that the reasons and the table cover exactly the genres the code keeps alike; genres.7 measured on the tested commit | integration |
| `genres.7-measured` | Brief 09 Area: genres | Implemented, Verification Incomplete | The kept genres’ reasons and the per-genre table are documents held by nothing; genres.7 is a measurement | a gate test that the reasons and the table cover exactly the genres the code keeps alike; genres.7 measured on the tested commit | integration |
| `judge.coverage-row` | Brief 09 Area: judge | Implemented, Verification Incomplete | A document’s count of the scenes, corrected once and held by nothing | correct it where it’s fallen behind, and a gate test that the count is the code’s | acting |
| `advice.harness` | Brief 10 Area: advice | Implemented, Verification Incomplete | The harness and its tests exist; no gate test holds the harness’s structure, the hospital fix, or the cases’ split, and the tests are cited by file | gate tests of the harness; the tests cited by title | advice |
| `advice.F2` | Brief 10 Area: advice | Implemented, Verification Incomplete | Measured on the integrated code; no gate test holds them | measured again on the tested commit, the measurement attached | integration |
| `advice.F2A10-a` | Brief 10 Area: advice | Implemented, Verification Incomplete | The harness and its tests exist; no gate test holds the harness’s structure, the hospital fix, or the cases’ split, and the tests are cited by file | gate tests of the harness; the tests cited by title | advice |
| `advice.F2A10-c` | Brief 10 Area: advice | Implemented, Verification Incomplete | Measured on the integrated code; no gate test holds them | measured again on the tested commit, the measurement attached | integration |
| `advice.tests` | Brief 10 Area: advice | Implemented, Verification Incomplete | The harness and its tests exist; no gate test holds the harness’s structure, the hospital fix, or the cases’ split, and the tests are cited by file | gate tests of the harness; the tests cited by title | advice |
| `advice.heldout` | Brief 10 Area: advice | Implemented, Verification Incomplete | Measured on the integrated code; no gate test holds them | measured again on the tested commit, the measurement attached | integration |
| `advice.harness-hospital` | Brief 10 Area: advice | Implemented, Verification Incomplete | The harness and its tests exist; no gate test holds the harness’s structure, the hospital fix, or the cases’ split, and the tests are cited by file | gate tests of the harness; the tests cited by title | advice |
| `ST3-R.e` | Brief 10 Area: judge | Implemented, Verification Incomplete | Met by measurement on the integrated code; no gate test holds the clause | measured again on the tested commit, the measurement attached; gate tests where a clause allows one cheaply | acting |
| `H4-R.e` | Brief 10 Area: judge | Implemented, Verification Incomplete | Met by measurement on the integrated code; no gate test holds the clause | measured again on the tested commit, the measurement attached; gate tests where a clause allows one cheaply | acting |
| `L3-R.a` | Brief 10 Area: judge | Implemented, Verification Incomplete | Met by measurement on the integrated code; no gate test holds the clause | measured again on the tested commit, the measurement attached; gate tests where a clause allows one cheaply | acting |
| `L3-R.b` | Brief 10 Area: judge | Implemented, Verification Incomplete | Met by measurement on the integrated code; no gate test holds the clause | measured again on the tested commit, the measurement attached; gate tests where a clause allows one cheaply | acting |
| `L3-R.e` | Brief 10 Area: judge | Implemented, Verification Incomplete | Met by measurement on the integrated code; no gate test holds the clause | measured again on the tested commit, the measurement attached; gate tests where a clause allows one cheaply | acting |
| `judge.together` | Brief 10 Area: judge | Implemented, Verification Incomplete | Met by measurement on the integrated code; no gate test holds the clause | measured again on the tested commit, the measurement attached; gate tests where a clause allows one cheaply | acting |
| `judge.tests` | Brief 10 Area: judge | Implemented, Verification Incomplete | The tests exist in the gate, cited by their file, not their titles | cite them by title, and run them on the tested commit | acting |
| `A1` | Brief 10 Area: judge | Implemented, Verification Incomplete | A1’s figure is held by a measurement only; stamina.A1 is the same requirement for stamina | a gate test of each ability’s largest effect, and the measurement on the tested commit | attributes |
| `stamina.A1` | Brief 10 Area: stamina | Implemented, Verification Incomplete | A1’s figure is held by a measurement only; stamina.A1 is the same requirement for stamina | a gate test of each ability’s largest effect, and the measurement on the tested commit | attributes |
| `A4` | Criteria: The Attributes | Implemented, Verification Incomplete | Judged by reading the code in phase 2b; no assertion would fail if it stopped holding | gate tests through the commands | attributes |
| `A5` | Criteria: The Attributes | Implemented, Verification Incomplete | Judged by reading the code in phase 2b; no assertion would fail if it stopped holding | gate tests through the commands | attributes |
| `T1` | Criteria: The Attributes | Implemented, Verification Incomplete | Judged by reading the code in phase 2b; no assertion would fail if it stopped holding | gate tests through the commands | attributes |
| `O3` | Criteria: The Attributes | Implemented, Verification Incomplete | Judged by reading the code in phase 2b; no assertion would fail if it stopped holding | gate tests through the commands | attributes |
| `F1` | Criteria: The Attributes | Implemented, Verification Incomplete | Judged by reading the code in phase 2b; no assertion would fail if it stopped holding | gate tests through the commands | attributes |
| `F3` | Criteria: The Attributes | Implemented, Verification Incomplete | Judged by reading the code in phase 2b; no assertion would fail if it stopped holding | gate tests through the commands | attributes |
| `KS-ct-idcard` | Known Shortfalls And Missing Tests | Implemented, Verification Incomplete | Values the tax area couldn’t source, labelled as assumptions; no prior approval makes them authorized assumptions | research the authoritative source; implement and test what it settles, or say what blocks it | research |
| `KS-passport-fees` | Known Shortfalls And Missing Tests | Implemented, Verification Incomplete | Values the tax area couldn’t source, labelled as assumptions; no prior approval makes them authorized assumptions | research the authoritative source; implement and test what it settles, or say what blocks it | research |

### Gameplay or a design question within the approved intent: actionable

| Row | Group | Status at the baseline | Why | Action | Area |
|---|---|---|---|---|---|
| `advice.F2A10-f` | Brief 10 Area: advice | Decision Required | Repeated advice and two advice clauses (brief 11, section 8): state-aware repeated advice for a player who follows it and one who ignores it; preparation apart from training; a small rise explained | implement within the approved intent; criterion clarifications documented before tests change | advice |
| `advice.F2A10-h` | Brief 10 Area: advice | Decision Required | Repeated advice and two advice clauses (brief 11, section 8): state-aware repeated advice for a player who follows it and one who ignores it; preparation apart from training; a small rise explained | implement within the approved intent; criterion clarifications documented before tests change | advice |
| `ST6-R.a` | Brief 10 Area: judge | Decision Required | ST6-R’s clauses not met: which failures are missing gameplay and which a test that contradicts the approved design (brief 11, section 8) | finish justified implementation; a criterion clarification documented before any test changes; a genuine conflict presented after the rest | acting |
| `ST6-R.c` | Brief 10 Area: judge | Decision Required | ST6-R’s clauses not met: which failures are missing gameplay and which a test that contradicts the approved design (brief 11, section 8) | finish justified implementation; a criterion clarification documented before any test changes; a genuine conflict presented after the rest | acting |
| `ST6-R.e` | Brief 10 Area: judge | Decision Required | ST6-R’s clauses not met: which failures are missing gameplay and which a test that contradicts the approved design (brief 11, section 8) | finish justified implementation; a criterion clarification documented before any test changes; a genuine conflict presented after the rest | acting |
| `ST6-R.g` | Brief 10 Area: judge | Decision Required | ST6-R’s clauses not met: which failures are missing gameplay and which a test that contradicts the approved design (brief 11, section 8) | finish justified implementation; a criterion clarification documented before any test changes; a genuine conflict presented after the rest | acting |
| `ST6-R.bPrime` | Brief 10 Area: judge | Decision Required | ST6-R’s clauses not met: which failures are missing gameplay and which a test that contradicts the approved design (brief 11, section 8) | finish justified implementation; a criterion clarification documented before any test changes; a genuine conflict presented after the rest | acting |
| `L1` | Criteria: Long-Term Continuity | Decision Required | Repeated advice and two advice clauses (brief 11, section 8): state-aware repeated advice for a player who follows it and one who ignores it; preparation apart from training; a small rise explained | implement within the approved intent; criterion clarifications documented before tests change | advice |

### Decision 4's protected rows, unchanged

| Row | Group | Status at the baseline | Why | Action | Area |
|---|---|---|---|---|---|
| `bank.arrange_overdraft` | Money | Implemented, Verification Incomplete | One of decision 4’s twelve rows out of a player’s reach, kept exactly as authorized (brief 10 and 11, section 2) | none: unchanged, counted in the original totals | — |
| `bank.cancel_new` | Money | Implemented, Verification Incomplete | One of decision 4’s twelve rows out of a player’s reach, kept exactly as authorized (brief 10 and 11, section 2) | none: unchanged, counted in the original totals | — |
| `bank.switch` | Money | Implemented, Verification Incomplete | One of decision 4’s twelve rows out of a player’s reach, kept exactly as authorized (brief 10 and 11, section 2) | none: unchanged, counted in the original totals | — |
| `bank.take_overrun_loan` | Money | Implemented, Verification Incomplete | One of decision 4’s twelve rows out of a player’s reach, kept exactly as authorized (brief 10 and 11, section 2) | none: unchanged, counted in the original totals | — |
| `card.money_transfer` | Money | Implemented, Verification Incomplete | One of decision 4’s twelve rows out of a player’s reach, kept exactly as authorized (brief 10 and 11, section 2) | none: unchanged, counted in the original totals | — |
| `bank.switch_complete` | Money | Implemented, Verification Incomplete | One of decision 4’s twelve rows out of a player’s reach, kept exactly as authorized (brief 10 and 11, section 2) | none: unchanged, counted in the original totals | — |
| `bank.cancel_switch` | Money | Implemented, Verification Incomplete | One of decision 4’s twelve rows out of a player’s reach, kept exactly as authorized (brief 10 and 11, section 2) | none: unchanged, counted in the original totals | — |
| `bank.stop_balance_transfer` | Money | Implemented, Verification Incomplete | One of decision 4’s twelve rows out of a player’s reach, kept exactly as authorized (brief 10 and 11, section 2) | none: unchanged, counted in the original totals | — |
| `tax.amend` | Papers | Implemented, Verification Incomplete | One of decision 4’s twelve rows out of a player’s reach, kept exactly as authorized (brief 10 and 11, section 2) | none: unchanged, counted in the original totals | — |
| `tax.catch_up_state_plan` | Papers | Implemented, Verification Incomplete | One of decision 4’s twelve rows out of a player’s reach, kept exactly as authorized (brief 10 and 11, section 2) | none: unchanged, counted in the original totals | — |
| `tax.lien_dispute` | Papers | Implemented, Verification Incomplete | One of decision 4’s twelve rows out of a player’s reach, kept exactly as authorized (brief 10 and 11, section 2) | none: unchanged, counted in the original totals | — |
| `tax.request_waiver` | Papers | Implemented, Verification Incomplete | One of decision 4’s twelve rows out of a player’s reach, kept exactly as authorized (brief 10 and 11, section 2) | none: unchanged, counted in the original totals | — |
| `banking.2.scope` | Brief 09 Area: banking | Decision Required | One of decision 4’s three decision rows, kept exactly as authorized | none: unchanged | — |
| `banking.2.arrange_overdraft` | Brief 09 Area: banking | Implemented, Verification Incomplete | The banking area’s item for one of decision 4’s eight bank rows (its disposition “owner decision”): the same requirement as the audit row, covered by decision 4 | none: unchanged | — |
| `banking.2.cancel_new` | Brief 09 Area: banking | Implemented, Verification Incomplete | The banking area’s item for one of decision 4’s eight bank rows (its disposition “owner decision”): the same requirement as the audit row, covered by decision 4 | none: unchanged | — |
| `banking.2.switch` | Brief 09 Area: banking | Implemented, Verification Incomplete | The banking area’s item for one of decision 4’s eight bank rows (its disposition “owner decision”): the same requirement as the audit row, covered by decision 4 | none: unchanged | — |
| `banking.2.switch_complete` | Brief 09 Area: banking | Implemented, Verification Incomplete | The banking area’s item for one of decision 4’s eight bank rows (its disposition “owner decision”): the same requirement as the audit row, covered by decision 4 | none: unchanged | — |
| `banking.2.cancel_switch` | Brief 09 Area: banking | Implemented, Verification Incomplete | The banking area’s item for one of decision 4’s eight bank rows (its disposition “owner decision”): the same requirement as the audit row, covered by decision 4 | none: unchanged | — |
| `banking.2.stop_balance_transfer` | Brief 09 Area: banking | Implemented, Verification Incomplete | The banking area’s item for one of decision 4’s eight bank rows (its disposition “owner decision”): the same requirement as the audit row, covered by decision 4 | none: unchanged | — |
| `banking.2.take_overrun_loan` | Brief 09 Area: banking | Implemented, Verification Incomplete | The banking area’s item for one of decision 4’s eight bank rows (its disposition “owner decision”): the same requirement as the audit row, covered by decision 4 | none: unchanged | — |
| `banking.2.money_transfer` | Brief 09 Area: banking | Implemented, Verification Incomplete | The banking area’s item for one of decision 4’s eight bank rows (its disposition “owner decision”): the same requirement as the audit row, covered by decision 4 | none: unchanged | — |
| `coverage09.3-unresolved` | Brief 09 Area: coverage | Decision Required | One of decision 4’s three decision rows, kept exactly as authorized | none: unchanged | — |
| `KS-bank-rows-scope` | Known Shortfalls And Missing Tests | Decision Required | One of decision 4’s three decision rows, kept exactly as authorized | none: unchanged | — |

### A superseded historical criterion

| Row | Group | Status at the baseline | Why | Action | Area |
|---|---|---|---|---|---|
| `ST3.asWritten` | Brief 10 Area: judge | Not Implemented | The original acting criterion as written, superseded by its replacement at the owner’s decision 1 (brief 10); brief 11, section 3: “Superseded acting criteria remain historical evidence. Do not count their historical failures as separate current implementation tasks.” ST6 as written was already recorded so (brief 10’s close-out) | administrative: Explicitly Deferred as historical evidence, its figures kept; not counted as progress | integration |
| `H4.asWritten` | Brief 10 Area: judge | Not Implemented | The original acting criterion as written, superseded by its replacement at the owner’s decision 1 (brief 10); brief 11, section 3: “Superseded acting criteria remain historical evidence. Do not count their historical failures as separate current implementation tasks.” ST6 as written was already recorded so (brief 10’s close-out) | administrative: Explicitly Deferred as historical evidence, its figures kept; not counted as progress | integration |
| `L3.asWritten` | Brief 10 Area: judge | Not Implemented | The original acting criterion as written, superseded by its replacement at the owner’s decision 1 (brief 10); brief 11, section 3: “Superseded acting criteria remain historical evidence. Do not count their historical failures as separate current implementation tasks.” ST6 as written was already recorded so (brief 10’s close-out) | administrative: Explicitly Deferred as historical evidence, its figures kept; not counted as progress | integration |

### A duplicate of another requirement

| Row | Group | Status at the baseline | Why | Action | Area |
|---|---|---|---|---|---|
| `tax.s8.residence_naturalization` | Remaining Area: tax | Implemented, Verification Incomplete | The tax area’s item that residence abroad and naturalization stay deferred, as the audit’s own rows (documents.residence, documents.settle, documents.renew_residence, documents.naturalize, citizenship.decided) already are, by the owner’s scope reset of 2026-10-09 | administrative: Explicitly Deferred with the rows it repeats; not counted as progress | integration |
| `judge.stamina-load` | Brief 09 Area: judge | Not Implemented | Brief 09’s question whether a night’s load should read a heavier, sourced account was answered by the owner’s decision 5 (brief 10): a night’s workload by its running time, part, intensity and breaks, verified as W1 to W10 (stamina.W1 to stamina.W10, Implemented And Verified) | administrative: its evidence is W2’s and W3’s gate tests (a longer or harder night drains more); not counted as progress | integration |

### A historical record of a process step

| Row | Group | Status at the baseline | Why | Action | Area |
|---|---|---|---|---|---|
| `tax.s8.jurisdiction` | Remaining Area: tax | Implemented, Verification Incomplete | The tax area’s research record of which office’s rules each papers system follows (tax-result.json); the rules themselves are each row’s own, verified there | administrative: Explicitly Deferred as a research record; not counted as progress | integration |
| `judge.baseline` | Brief 09 Area: judge | Implemented, Verification Incomplete | A record of a process step of its brief (the criteria measured on the engine before any change), its outputs kept; nothing in the current build can re-verify a measurement of an engine that no longer exists | administrative: Explicitly Deferred as a historical record; not counted as progress | integration |
| `judge.baseline` | Brief 10 Area: judge | Implemented, Verification Incomplete | A record of a process step of its brief (the criteria measured on the engine before any change), its outputs kept; nothing in the current build can re-verify a measurement of an engine that no longer exists | administrative: Explicitly Deferred as a historical record; not counted as progress | integration |
| `stamina.measure` | Brief 10 Area: stamina | Implemented, Verification Incomplete | A record of the stamina area’s first look at what moved, before and after its change (brief 10); the current figures are the criteria rows’ and the judge area’s, measured on the tested commit | administrative: Explicitly Deferred as a historical record; not counted as progress | integration |

## Work Added Outside The Baseline

Each recorded with its reason and impact, and kept apart from the baseline's rows:

- **`defect.yale-credit-hold`**: brief 11, section 5, and the handoff’s open list: a credit that clears a held Yale account leaves the hold. A defect fix outside the baseline’s rows.
- **`defect.personality-year`**: brief 11, section 5, and the handoff’s open list: tests/personality.test.ts’s year on autopilot ends 16 days in. A test defect outside the baseline’s rows.

## Amendments

Each change to the classification after it was frozen, said where it was made. The baseline itself is never amended.

- **`judge.stamina-load`'s action** (2026-10-16, when the reconciliation was made). The classification said "its evidence
  is W2’s and W3’s gate tests". It's Explicitly Deferred instead, as a duplicate counted once in stamina.W1 to W10,
  because verifying it by those tests would count one requirement twice among the verified rows. Its category,
  duplicate, is unchanged.
