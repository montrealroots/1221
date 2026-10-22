# Brief 20, The Benefits Area

Written down by the coordinator from the benefits area's report as it returned it (2026-10-22): the harness wouldn't let
the area write this file itself. The words are the area's but for this note and the one on the lien's source.

- **Clone and commit:** `b20-benefits`, from `c4832549`; everything in `80622ee9`: the code (`systems/unemployment.ts`,
  `statetax.ts`, `taxreturn.ts`, `content/guide/taxes.ts`, `ui/workspaces/PapersWorkspace.tsx`), five test files
  (`tests/b20-benefits-{tax,unemployment,safetynet,reach,time}.test.ts`, setup in `tests/fakes/b20-benefits.ts`), the rows,
  `mutations/benefits.json` and `.txt`, and the text statuses (`docs/text/statuses/papers.json`,
  `docs/text/second-pass/papers.json`). No stash; nothing pushed.

## Rows And Promises

57 rows, every one read against the code (`readAt: c4832549`); 47 mechanics and 10 presentation, each notice with its
purpose.
- **Implemented And Verified:** 35 of the 43 in scope.
- **Implemented, Verification Incomplete:** 8, none reachable by a current life: `tax.amend` and `tax.amended`;
  `tax.lien_dispute`; `tax.request_waiver` and `tax.three_year` (Oregon's rules); `benefits.desempleo_month`, which only a
  save from before 2026-10-09 can reach (none is in `tests/fixtures`, and the record had called it verified on a claim
  typed in by hand); the notices from `taxreturn#settleUkYears` (UK wages) and `taxreturn#amendState`.
- **Explicitly Deferred:** 14, the five pension commands and their five payments, `benefits.ei_register`,
  `benefits.ja_week`, `benefits.uc_period` and `universalcredit#close`'s notice, each citing the owner's scope reset of
  2026-10-09 as the completion matrix records it.
- **Promises:** 20 of 20 Implemented And Verified, each with the `file:line` that keeps it and a test.

## The Comparisons

Each a test the gate runs, through commands and the clock.
1. **Work-study:** two F-1 students, one taking 8 more shifts (`school.take_shift`). Her 1040-NR shows +$736 of wages and
   +$88.32 of federal tax (12%); Connecticut's tax $7.03 against $3.35; her refund $241.24 against $329.56, posted to
   checking once, 70 days after filing. No leak: a twin who moved her savings into checking files the same return.
2. **The career's pay:** The Winter Ledger, $10,026 of wages, $848.03 withheld ($766.99 payroll tax, $81.04 New York's).
   The return puts New York's tax at $81.50, so $0.46 is owed and taken from checking when she files. The twin who didn't
   work has no return. No leak: a more skilled twin has the same record and return.
3. **Filing:** the heir owes $1,351.47. On time, that's all; 85 days late, +$555.27 of penalties and +$31.00 of interest.
   Never filed: the late notice at the due date, and from the next day each day ends at +4×stressGain stress and
   −2×moraleSwing morale against the twin who paid. The IRS's CP2566 a year after the due date, its assessment 120 days
   later, with a $643.12 penalty and interest.
4. **A plan:** $23.62 a month kept up, four payments 30 days apart and no letters. Missed: CP523 on 2 March, the plan ends
   on 1 April, the LT11 on 23 May and the levy 30 days after.
5. **Unemployment's base period:** two runs worked in New York give a claim of $314 a week, $8,164 at most; the twin who
   didn't work is refused, "$1,800.00 for $45.00"; a more skilled twin gets $314 too. The 2027 return's unemployment line
   is $8,164.
6. **A week worked while claiming:** four shoot days → $0; two → $235.50.
7. **SNAP:** a graduate paid $4,456 in November and $3,342 in December gets $0 each month, over the $2,660 gross limit;
   her twin gets $306 each month. No leak: more work-study leaves SNAP the same.
8. **A pension** (the rows deferred; the age and record set by hand): 35 years of work → $2,079 a month; 20 years →
   $1,507; +$100,000 in the bank → still $2,079.

Also measured: a state plan in force holds that state's letters back (the twin with none is billed 30 days after the due
date), and a later year's tax more than two payments under a plan brings CP523, then a revision or the plan's end.

## Defects

The failing output before each repair was kept in the session's scratchpad.
- **D-1: a week worked while claiming paid in full.** The weekly certification read only the School's work, so a week of
  four shoot days paid the full $314: before, the week of 13 June posted $314 (should be nothing) and of 20 June $314
  (should be $235.50). `careerWorkIn` counts the career's logged work days at the pay system's eight hours a day, each
  with its day's share of the pay. `tests/b20-benefits-unemployment.test.ts`; mutation 1 killed.
- **D-2: a lien "filed in error" on the tax alone,** the penalties and interest it secured ignored. A played path reached
  it: New York's tax warrant for a late penalty and interest still owed was offered for withdrawal. Before: `expected true
  to be false`. A lien is in error only where the return left nothing owed when it was filed (`owedThen`); the tax
  assessed is kept (`assessedBy.tax`, `substituteTax`); the IRS read the same way. `tests/b20-benefits-reach.test.ts`;
  mutation 2 killed. The area gave 26 CFR 301.6326-1(b)(1) and IRC 6665(a)(2) from memory; the coordinator read the
  regulation (Cornell LII, 2026-10-22): a lien is erroneous where "the tax liability that gave rise to the lien, plus any
  interest and additions to tax associated with said liability, was satisfied prior to the filing of notice of lien".
- **D-3: "1 months"** in New York's one-month plan's notice, its history and the Papers panel; `plural` now. The test and
  the repair were written together, so there's no run before; mutation 3 kills the old words.
- **D-4: a notice said the penalty fell when it didn't:** after her own return replaced an assessment, it said the penalty
  and interest were "reduced in proportion" where they stood. Before: the notice read "…, with the penalty and interest
  reduced in proportion." Fixed for the IRS's notice and a state's. `tests/b20-benefits-tax.test.ts`; mutation 20 killed.
- **D-5: the guide said a New Haven life meets no Catch Up,** where a graduate's New York plan has one. The guide's line
  corrected; `guide-quotes` 0 sentences the game no longer says.

Changed text sources marked in both passes, by `papers`, the area that owns them.

## The Four Rows Called Unreachable, Read Again

- `tax.catch_up_state_plan`: **reachable.** New York's tax on the graduate's work leaves a small balance, and her New York
  plan is missed and caught up in a played life. Verified now.
- `tax.lien_dispute`: reachable, but wrongly (D-2); after the repair no played life reaches it.
- `tax.amend`: not reachable: six months after filing, File The Amendment is still refused, nothing on the record changed.
- `tax.request_waiver`: not reachable: only Oregon has the rule, and every project and life is outside Oregon.
- Also: the federal lien and its withdrawal are reachable (the inherited family's journey in `remaining-09-coverage`).

## Time And Obligations

Three journeys each moved three ways to the same point (one jump, a day at a time, saved and opened in the middle of a
season), the same to the byte each time: the heir from January 2027 to June 2028; an IRS plan's four payments; 17 claim
weeks and SNAP months. No defect.

## Mutations

21 written, 21 killed. Two needed their tests made stronger first, both runs in `benefits.txt`: #4 was first a SETUP
ERROR (the claim's refusal thrown, not asserted); #19 first SURVIVED (no test held a state plan's hold on letters, so the
comparison above was added).

## Checks

The area's five files, 18 tests on one worker; related files, 51 files and 563 tests, and after the later notice changes
11 files and 142 tests again, all passing. `tsc --noEmit -p tsconfig.app.json` exit 0; eslint on the changed files exit 0;
`text-inventory --check` holds; `surfaces --check` 0 problems; `guide-quotes` 0 sentences the game no longer says.

## Outside The Area

- `tools/effects.mjs` gave two promises one id where an entry connects to the same entry twice with different kinds
  (`taxes.return>bank.accounts`, `taxes.pay>bank.accounts`); the check calls them "named again". (Fixed by the coordinator:
  such a pair's ids carry their kinds.)
- Marking text `--by b20-benefits` made two areas claim one source; marked by the owning area, `papers`, as D2 did for
  money.
- Connecticut's and New York's tax on career pay (`propay.ts`): Connecticut's isn't withheld from New York pay, and New
  York's is withheld on New York wages alone, so a working graduate owes a little at filing each year. That follows the
  rules; said so it's known.

## For The Owner

- **Amend The Return…** is a control a played life can never use: whether it should show.
- The lien's rule (D-2) is stricter now, so no played life reaches Filed In Error.
- `benefits.desempleo_month` is paid only from a save made before 2026-10-09, and there's none to test against.
