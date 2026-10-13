# Closing The Verification Gaps, 2026-10-13

The owner's brief of 2026-10-13 ("SLATE: Close The Verification Gaps And Complete The Current Build's Acceptance
Evidence"), done on `claude/verification-gaps` from `main` at `fca00d8f`. This says what was measured, what was fixed,
what stands open and why, with the numbers and where each comes from. The rows themselves, each with its review, its
evidence and its verdict, are `docs/verification/audit/*.json`, drawn as `docs/GAMEPLAY-COVERAGE.md`.

## The Standard Each Row Was Held To

A row is **verified** only where a test in the gate reaches the action as a player does (a command through
`sim.execute`, the clock through `advanceTo`, or the screen rendered), checks the consequence the row says reads the
change, expects what an independent reading of the rule gives (a literal worked from the rule's numbers or a source,
never the engine's own helper), and doesn't pass vacuously. Evidence is recorded by kind: command, render, fixture,
inspection, built-app, long-run. Only command and render evidence that meets all four can make a row verified; a fixture,
the built app or a long run supports a row and can't verify it.

Each row records (`review`): the claim read, every piece of evidence by kind with whether it reaches the action, checks
the consequence and is independent, the UI evidence, the verdict, its disposition, its gaps, and the revision
(`fca00d8f`). Each row the evidence passes touched records (`after`): the tests added (file, title, kind, what each
closes), gaps closed and open, defects found and their fixes, mutations run and killed, the claimed verdict, the
skeptics' checks, and the verdict now.

**Two registries, two units.** `docs/GAMEPLAY-COVERAGE.md` counts *rows*: a command, a scheduled kind, a knob, a panel
(328). `docs/capabilities.json` counts *capabilities*: what a player can do, each grouping several commands (64). They
are reconciled by the 148 commands both name: `tools/capabilities.mjs --check` fails where a capability's status
contradicts its rows' (a capability Implemented with a row unresolved, say), and now passes.

## The Rows: Before And After

| As it stood at `fca00d8f` | Rows | The review found | Now |
|---|---:|---|---|
| Verified, no test read | 134 | 28 verified, 104 partial, 1 unresolved, 1 legacy | **123 verified**, 9 partial, 1 unresolved, 1 legacy |
| Partial | 100 | 94 partial, 3 unresolved, 3 verified | **86 verified**, 11 partial, 3 unresolved |
| Verified, read | 56 | 23 verified, 29 partial, 4 unresolved | 49 verified, 3 partial, 4 unresolved |
| Unresolved | 27 | 16 deferred, 11 unresolved | 16 deferred, 11 unresolved |
| Legacy, informational | 11 | as they were | as they were |
| **All** | **328** | | **258 verified, 23 partial, 19 unresolved, 17 deferred, 3 legacy, 8 informational** |

Denominators: every row of the five audit files (328). "Verified" means the standard above, checked last by an
independent skeptic against the code as it finally stands. Nothing was split, renamed, downgraded or deleted to move a
count; the 16 deferred items stayed deferred, and no removed system was restored.

**The 227 rows the evidence passes worked:** 204 verified; 23 partial, each with a disposition:

| Disposition | Rows | What it means |
|---|---:|---|
| Working, evidence missing | 14 | The behavior is right; a gap stays open because only a fixture reaches it in a gate test (a one-person world, a degree conferred by hand, the forced wealthy family, six terms past a 60-second test) |
| Stale or wrongly grouped claim | 7 | The row's words are the problem: `receipts` grouped with nine live knobs, a choice no played life can make (New Haven has one practice), a claim of `status held to expiry + 60` no played OPT reaches |
| Implementation missing | 2 | The row claims what the engine doesn't do: `health.appointment` (a renewed prescription read only in British Columbia), `c-traits` (`receipts` multiplies nothing) |

Each partial row's open gaps, by name, are in its `after.gapsOpen` and its final check's problems.

## How The Evidence Was Made

- **Round one** (34 groups, `tests/evidence-g01..g34-*.test.ts`): a test file per group of rows, written to close the
  review's gaps; each checked by an independent skeptic, read-only.
- **Round two** (13 batches, `tests/evidence2-b01..b13.test.ts`): the 64 rows still partial, their open gaps and the
  skeptics' problems; each batch checked again.
- **The final check**: every round-two row read again after the fixes, and the eleven rows a later fix touched read once more (`final-checks/` in the session's scratchpad,
  merged as the latest check).
- **Mutations**: each test's claim protected by one to three edits to the engine, run one at a time in copies of the
  tree (never the working tree). Round one: 675 applied, **672 killed**. Round two: 169 applied, **166 killed**. Every
  survivor is recorded with its row and why: two were redundant guards, taken out (a term's accrual guard, `life.sleep`'s
  first busy check); one was a harness that remounted where it meant to re-render, rewritten and then killed; the rest
  are named as gaps (`h-where-weather`'s home city for a student born elsewhere, `bank.close_current` read at the closing
  instant) or equivalent (`card.report`'s rush days, equal to the estimate since Wells Fargo's and Shinhan's went).
- A first run of round two's mutations reported 18 survivors that were the runner's fault: its copies lacked `tools/`,
  which one test file imports, and a baseline that ran nothing was read as a pass. Both were fixed and the 18 run again:
  15 killed.

## Defects Found And Fixed

Every defect below was fixed with a test that failed before it, and the full suite passes on the result. By where it
was found:

- **The review and round one** (commits `73b2a9ec`, `c518e851`, `5989e300`): about 50, among them an appeal that kept what
  was overpaid; a dental plan year read by calendar year; a medical debt paid from an account that can't pay it; the flu
  unseen and never told; a birthday on 29 February; a plan missed in hospital counted kept; a loan charging 19 days for
  20; a term deposit earning its maturity day; a make-up session its month couldn't hold; a second repeat past nine
  semesters; the additional term's days held twice; a withdrawn F-1 student never told her status was ending; a closed
  run not on stage until the next casting.
- **The guide and tutorial audit**: 57 findings, 52 held by its skeptic and fixed where the player reads them. Two were
  defects in the built app: a reload or a link opened Home (the help wrote the address before the game read it), and a
  top-bar menu closed with its focus lost when help opened from it. Skip To Content took the player Home too.
- **Round two and the checks** (commits `27c293a3` and this one): about 90, among them an owed visit that ended the
  doctor for good; make-ups and extensions after the School ended; a moment that never lapsed; SNAP read in UTC, paid to
  the cent, with no least benefit and its time limit put on someone drawing unemployment; interest on the IRS's additions
  (IRC 6601(e)(2)), leap years (Rev. Proc. 95-17), and 21 days' grace on a demand; a card due at 12:01; a due date after
  the next statement judging the wrong one; a plan's payment where the card's minimum was asked; Overdraft Assist's
  business day; OPT's premium days and Yale's working days counted with their holidays (8 CFR 106.4; Yale's published
  holidays); a stipend unpaid on leaving; Connecticut's compensation floor (CGS 31-307(a)); availability judged across a
  week (Regs. Conn. State Agencies §31-235-12); a canceled account paid to the wrong bank; a repeat called off after its
  deadline leaving a student in good standing for good; a private GP billed nothing.
- **Declared words nothing read**, taken out with their words where the guide named them, as the one rule asks: the
  over-limit fee (no card publishes one), refusals no state reaches (a current account, a branch where you live, an
  order into a current account, the New Haven checks, practice refusals, a thirty days run out), `equityWeeks`,
  `withDemands`, `WorkDay.away`, Home's away line.

## The Director's Craft-Note Journey

Reached from a supported student journey: `tools/scenarios.ts --scenario direction` on seed `sc-1` in three resumable
slices, played by the policy through commands alone, stopping at the first morning with a craft note given and not
worked, two ways or more at it, and a call ahead (it stopped on 2027-04-24, breaches 0). In the built app
(`tools/acceptance-ui.mjs`, the direction steps), at **1440 and 390 wide**, each step failing, never skipping, if the
save, the note, its ways or a control is missing: the note on Casting; How This Works, a connected entry and Back, the
tab, note and chosen way as they were and the clock unmoved; a change of how the part is played tried, its evidence
said, kept; Work On The Note refused once worked, in words, a forced press moving nothing; the next call, the change
rehearsed in, the note's outcome and history; Save & Exit and Continue, the try kept; and the note left unanswered,
said again at the next call. All seven pass at both widths.

## Round-Ups

Sixty banks' own pages, terms and fee schedules, each finding read again by a second researcher
(`docs/research/roundups/`: product, jurisdiction, source, effective and checked dates). Twenty banks have the feature,
and each is played as its own sources say (`src/engine/content/roundups.ts`): what a purchase moves, when it moves, what
a short account does, what turning it off or switching banks drops; a choice the bank states no default for is the
player's to make before anything counts. Left out, with the reason: KB Kookmin (only 2020 news describes it), Nationwide
(the member moves the money), four withdrawn. Tested on each bank's own published example, by its days, a short day,
Citi's minimum and cap, off, a switch, a save from before, the ledger, a reload and a long skip; in the built app at
both widths.

## Help And The Tutorial

Reading help runs no command, spends nothing, advances no time, keeps what was typed and the menu it was opened from,
and Show Me Where goes to the entry's own screen and tab and back to the trail. Each rule is held by
`tests/help-mechanics.test.ts` on the real providers, and each test fails when its rule is broken (checked). The guide's
worked examples are played against outcomes worked independently (`tests/guide-examples-*.test.ts`).

## Acceptance

- **The gate** on the final tree: `npm run gate`, exit read from a file: **exit 0**. Typecheck, lint, the full suite
  (317 files, 3,833 tests, all passed) and seventeen checks; `tools/coverage.mjs --check` joined it today.
- **The built app** (`npm run build`, `tools/acceptance-ui.mjs` on the preview): **60 passed, 0 failed, 2 skipped** at
  1440 and the same at 390. The two skips are steps whose state the new life at that point doesn't hold (a way at a
  problem; a part with calls), each played on its own scenario save in the steps after.
- **Long runs**: `tools/lives.ts --seeds 2 --years 1`: breaches 0, unbalanced 0, 11 to 12 reloads a life. Scenario
  saves (direction, roundups, decision and the rest): breaches 0.
- **Migrations**: a save from before each change that moved state opens and goes on (the over-limit count shed, a
  term's notice put on the clock, a guide read to its end); each held by a test.

## Known Limits, Deferred, And The Owner's

- **The federal tax table is 2024's** (10% to $11,600, $14,600 deducted), held for every year (`src/engine/content/tax.ts`).
  2026's ($16,100 deducted, Rev. Proc. 2025-32) isn't in; correcting it re-figures every US return. The late-filing
  least is 2027's $535.
- **Reached only by a fixture in a gate test** (the 14 rows "working, evidence missing"): a second person in the world, a
  degree conferred, a family with need, a marketplace plan's income. The forced wealthy family puts need-based paths
  (conversion of hours, leave aid) out of a new life's reach: whether they move to Unresolved or Deferred is the owner's.
- **The owner's decisions:** the 90-day rule for an undated decision (no raiser leaves one undated); whether a skipped
  shower costs past the day; `companyPart` giving a floored actress a lead; creation's units by birthplace against the
  look's by residence; `receipts`, which multiplies nothing.
- **The 16 deferred items** stay deferred.

## Repository

Branch `claude/verification-gaps`, pushed. Not merged to `main` (the owner's), not deployed.

## Readiness

For the current school-focused build, in the tested scope (a new life at Yale played from creation through its
terms, its money, papers and health, the round-ups, the director's craft notes, help and the tutorial, at 1440 and 390,
across saves and reloads and a year's long runs): **no known failing cases or crashes in the tested scope.** 258 of 328
rows are verified to the standard above; the 23 partial and 19 unresolved rows say what each lacks, and none is a known
defect left unfixed in the played path. It is not complete: the tax table is a year behind, and some paths a played life
reaches only with a fixture are proved only that way.
