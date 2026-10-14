# Finishing The Open Items, 2026-10-14

The owner's brief of 2026-10-14 ("SLATE: Finish The Open Items From The 2026-10-13 Verification Pass"), done on
`claude/verification-gaps` from `0124c32f`. The pass before it is `docs/verification/VERIFICATION-GAPS-2026-10-13.md`,
whose standard this one holds to: a row is verified only where a gate test reaches the action as a player does, checks
the consequence, expects an independent figure and can't pass vacuously, checked last by an independent skeptic.

## The Rows: Before And After

| | At `fca00d8f` (the review) | At `0124c32f` | Now |
|---|---|---|---|
| Verified | 54 | 258 | **271** |
| Partial | | 23 | **11** |
| Unresolved | | 19 | 19 |
| Deferred | | 17 | 16 |
| Legacy, informational | | 3, 8 | 3, 8 |

Every row of the five audit files (328). Of the 134 rows that claimed verified at `fca00d8f` with no test read, 130 are
verified now; of the 100 partial, 91. Nothing was split, downgraded or deleted to move a count; the 16 deferred items
stayed deferred, and one row the owner removed (`trait-receipts`) is deferred with its reason. The knob row was renamed
by the owner's decision that split `receipts` out of it.

**The 11 partial**, each with what it lacks, all of it stated in its row:

| Row | Disposition | What stays open |
|---|---|---|
| school.respond | working, evidence missing | “That evening has passed.” is reached only by a save made before 2026-10-12 |
| school.request_repeat | working, evidence missing | the decision's own refusals: nothing can change the count or add a Fail between asking and deciding |
| school.request_extra_term | working, evidence missing | the same, for the nine-semester and disqualification refusals |
| school.request_conversion | working, evidence missing | the “No Hours To Convert” notice, reached only by a fixture |
| h-money | working, evidence missing | “No account” and “Your Bank”: no played life loses its only current account (a guard, kept and said so) |
| l-person | working, evidence missing | the “they” wording: no command adds a second person, so a test inserts one |
| health.enroll | working, evidence missing | no test reads a share on a bill the clock raises under an approved plan |
| i-stale-claims | working, evidence missing | the prose guard still passes some present-tense passives (“An interest is dropped…”) |
| health.choose_clinic | stale or wrongly grouped claim | New Haven lists one practice, so the choice decides nothing for a played life |
| health.appointment | stale or wrongly grouped claim | a renewed prescription is read only in British Columbia, which no played life reaches |
| documents.apply_ssn | stale or wrongly grouped claim | the lender reads the number only above an income no played life earns |

## What Was Done

1. **The federal tax table by year**, from irs.gov's own Revenue Procedures: 2024's (2023-34), 2025's ($15,750 deducted,
   2024-40 as amended by the One Big Beautiful Bill Act, read in 2025-32) and 2026's ($16,100, 2025-32), held after. On
   a played student with need, 2026's federal tax went from $107.00 to nothing and 2027's fell $196.00; a student with
   no need files neither year under either table; an F-1's 1040-NR is unchanged. Three tests were re-figured by hand,
   each saying what it held before; `tests/federal-tax-years.test.ts` holds each year's figures and a played return.
2. **The family, chosen at creation**: the six levels the engine kept, one rule for need (`needFor`), shown on Review and
   in the guide. The scholarship, the conversion of work-study hours, leave aid and its balance are now played on lives
   made on the creation screen (`tests/need-paths.test.ts`). The marketplace's income line is played on an inherited
   life's interest: no life with need earns over it (work-study tops out near $2,070 a month against $2,282).
3. **The owner's decisions**: the 90-day rule for an undated decision went (the type requires a date; an old save's
   undated row is dated as the rule would have ended it); a skipped shower costs nothing past its day, recorded; an
   actress below the four leads is never cast in one of the company's leads; units are where a person lives, on both
   screens; the receipts knob went with the job costs it multiplied.
4. **The partial rows**, a third round of evidence (`tests/evidence3-{lifepapers,school,home,person}.test.ts`): a
   student played by the clock to her degree in 26 slices across reloads, a second person in the world, the weekly cap
   booked through the button, standing's pace worked from its rule. It found defects, each fixed with the test that
   failed before it: a term deposit's interest at maturity never counted as income; a plan that never began told it had
   ended; an uncovered-from date a month late; Home naming a return owing nothing over one that owes, and saying “is
   due” after the day; “Graduated, graduated”; an understudy's Rep run never closed; the trait and condition looks
   reading the player on another person's look.
5. **Checked**: an independent skeptic per batch, read-only, after the fixes (its verdict is the row's). Mutations in
   copies of the tree: 57 of 57 applied, all killed.

## Acceptance On The Final Revision

- **The gate**, every part on this tree: typecheck and lint exit 0; the suite in three foreground shards (a full run in
  one was twice stopped by the machine's memory), **324 files, 3,940 tests, all passed**; and all seventeen checks exit
  0 (`docs/DEVMAP.md` and `docs/TRACEABILITY.md` regenerated first, behind the new tests).
- **The built app** (`npm run build`; `SLATE_BASE=http://localhost:4181 node tools/acceptance-ui.mjs OUT WIDTH saves`):
  **60 passed, 0 failed, 2 skipped** at 1440 and the same at 390, the director's craft-note and the round-up journeys
  among them. The two skips are steps whose state a new life at that point doesn't hold, each played on its own
  scenario save.
- **Long runs**: `tools/lives.ts --seeds 2 --years 1` (seeds `lives-0`, `lives-1`): breaches 0, unbalanced 0, 11 to 12
  reloads a life. Scenarios replayed on this code (`--scenario nonfiler --years 0.47`, `--scenario roundups --years
  0.1`): breaches 0, unbalanced 0.

## Still Open, And Whose

- The 11 partial rows above. Most need a state play can't reach (a second person; a save from an older build; an income
  no student earns) or an engine change the owner would decide (a second New Haven practice; whether to keep the faculty
  decision's refusals no play reaches, as guards).
- `i-stale-claims`' prose guard can be tightened further; the prose it guards is correct.
- Merging to `main` and any Base44 deployment.

## Repository

Commits `9088e699`, `5f0cba03`, `77f9fdc3` and `1a597fd1`, on `claude/verification-gaps`, pushed, and merged to `main` by fast-forward on the owner's word. Not
deployed.

## Readiness

For the current school-focused build, in the tested scope (a new life at Yale made on the creation screen with any
family, played from creation through its terms to its degree, its money, papers, taxes and health, the round-ups, the
director's craft notes, help and the tutorial, at 1440 and 390, across saves, reloads and a year's long runs): **no
known failing cases or crashes in the tested scope.** 271 of 328 rows are verified to the standard; the 11 partial and
19 unresolved say what each lacks, and none is a known defect left unfixed on the played path. It is not complete:
those rows stand open, each for the reason given.
