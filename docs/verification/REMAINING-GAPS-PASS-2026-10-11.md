# The Remaining In-Scope Gaps, 2026-10-11

**The brief:** "Finish SLATE's Remaining In-Scope Gaps And Verify Completion", from `main` at `086d00ca`. Its bar is
the acceptance checklist written before the engine changed: `REMAINING-GAPS-CHECKLIST-2026-10-11.md`. This records,
item by item, what was built, where, the sources and assumptions, how it was tested, and what was found.

**The engine tested** is commit `a023d4d7`, src tree `80e9f4d0`, tree `5adf7481`. The lives, scenarios, variety, the
grid and the built app ran on it. Later commits change documents and the acceptance tool's strictness only; the gate
ran on the final commit (§7).

**What wasn't done, and stays the owner's:** the 16 deferred items stay deferred. No removed system came back; no
parental leave; no credit score or property system was made to give a lien a consequence. Nothing was deployed.

---

## 1. Requirements And Where Each Is

| Checklist | What it is now | Where | Held by |
|---|---|---|---|
| A1 Indiana and Marion County, the District, Oklahoma | Taxed by their own rules by year; withheld by WH-4, D-4 and OW-2; filed, paid, refunded and collected by their own authorities. Marion County's tax is on Indiana's return, collected by its DOR. The District is its own authority. | `content/tax.ts` (`US-IN`, `US-IN-indianapolis`, `US-DC`, `US-OK`); `systems/withholding.ts`; `content/statetax.ts` (`us-in`, `us-dc`, `us-ok`); `systems/taxreturn.ts` (`benefitOut`, nonresidents, `localBy`) | `tests/tax-places.test.ts` |
| A2 local taxes | New York City's tax in all five boroughs; Philadelphia's Wage Tax, Columbus's income tax and Portland's SHS and PFA taxes, each collected by the city as its own authority; Denver's OPT withheld and shown, not owed on the return | `content/tax.ts` (`LOCAL_TAX`, `localRate`, `DENVER_OPT`); `content/statetax.ts` (`us-pa-philadelphia`, `us-oh-columbus`, `us-or-portland`); `systems/earnings.ts` | `tests/tax-places.test.ts` |
| A3 an omission caught | Every US city's state and local tax is a rule or a confirmed none (`NO_LOCAL_TAX`, 32 cities); every authority has its letters, plan, lien and sources; no engine code moves a person or pays them elsewhere; the countries without a rule are counted, at most 231 | `content/tax.ts` | `tests/tax-coverage.test.ts` |
| B1 liens | Every researched authority's, by its steps: a notice of intent where it sends one, filing and recording with its fee, payment, release on its own or on request, a release fee, a lien a plan asks, withdrawal of one filed in error with its fee back. The IRS's notice of federal tax lien at $10,000 at the LT11, released in 30 days, withdrawn on Form 12277 | `content/statetax.ts` (`lien` on each); `systems/statetax.ts` (`stateLienStep`, `fileStateLien`, `stateLienPaid`, `releaseStateLien`, `lienInError`, `tax.lien_release`, `tax.lien_dispute`); `systems/taxreturn.ts` (`FEDERAL_LIEN`, `tax.federal_lien_withdraw`); `ui/components/LienPanels.tsx` | `tests/liens-and-arrangements.test.ts`, `tests/liens-step-skip.test.ts`, `tests/tax-places.test.ts`; built app (§5) |
| B2 Pennsylvania's extended plan | Asked over $50,000 or with a plan in force; decided in 14 days on a statement made from the player's own last 90 days; approved, or declined with collection going on; replaces a plan in force; a missed payment ends it, by the rule found; paid off, it ends paid | `content/statetax.ts` (`plan.long`); `systems/statetax.ts` (`statePlanRefusal`, `financialStatement`) | `tests/liens-and-arrangements.test.ts` |
| B3 Louisiana's down payment | Offered at 20%, never required: the secretary's "may" has no published criterion. Up to $49,999.99 over 60 months; a formal agreement above | `content/statetax.ts` (`us-la`) | same |
| B4 New Mexico's longer plans | 13 to 72 months only as its long-term agreement, filing its lien | `content/statetax.ts` (`us-nm`) | same |
| B5 Oregon's three years unfiled | 100% of each year's tax where three years running have tax and no return of the player's own, checked six months after the third's due date, held to the tax net of penalties charged; waived 70%, 50% or 25% by when their own return came, asked within a year of full payment | `content/statetax.ts` (`threeYear`); `systems/statetax.ts` (`threeYearCheck`, `chargeThreeYear`, `waiverRefusal`, `tax.request_waiver`) | same |
| B6 Massachusetts | The doubling is the commissioner's discretion with no published criterion: its letter says it may, and that SLATE's DOR doesn't. Oklahoma's 25% on a refused demand likewise | `content/statetax.ts` (`us-ma`, `us-ok`) | same |
| C1 what the screen says | Each authority's panel: what's owed and its parts, the lien's name, status, trigger, amount, where it's recorded, dates and history; each action with why it's refused (`WhyNot`); the toast saying what changed | `ui/workspaces/PapersWorkspace.tsx`, `ui/components/LienPanels.tsx` | built app (§5) |
| C2 agreement, nothing twice | The budget and Home counted a state's own assessment twice; they don't (`unassessedBalance`). A payoff ends the plan. Each step runs once | `systems/spending.ts`, `ui/screens/Home.tsx`, `systems/statetax.ts` | `tests/liens-and-arrangements.test.ts`, `tests/liens-step-skip.test.ts` |
| D UI journeys | All seven, at 1440 and 390 (§5) | `tools/acceptance-ui.mjs`; `tools/scenarios.ts` (`rehearsal`, `lien`, `missed-plan`) | §5 |
| E engines | 100/100 at full preparation; histories and relationships; variety | — | the gate's mastery and evaluation tests; §6 |
| F saves and time | Saves written at `086d00ca` open with nothing charged or filed after the fact, open again the same, and play on. Stepped and skipped agree | `tests/fixtures/old-nonfiler-086d00ca.json.gz`, `old-state-plan-086d00ca.json.gz` | `tests/save-migration.test.ts`, `tests/liens-step-skip.test.ts` |

## 2. Sources, Effective Dates, Assumptions

Research came first: `docs/research/world/research-state-tax-in-dc-ok.json`, `research-local-income-taxes.json`,
`research-state-tax-liens-a.json`, `-b.json`, `research-state-tax-arrangements.json`, `research-federal-tax-lien.json`.
Each rule carries its source in its `note` or `source`; what wasn't published is SLATE's and says so (`…Assumed: true`).

| Rule | Effective | Source | SLATE's assumption |
|---|---|---|---|
| Indiana 3.0%, 2.95%, 2.9%, less $1,000 | 2025, 2026, 2027 on | IC 6-3-2-1 | No cut from 2030 assumed |
| Marion County 2.02% | 2025, 2026 | DOR Departmental Notice 1 | 2027 held at 2026's |
| Indiana interest 7%, 6% | 2026, 2027 | DOR Departmental Notice 3 | — |
| The District, 4% to 10.75% | 2022 on | DC Code 47-1806.03 | The $15,000 deduction held after 2025 |
| Oklahoma, six steps; then 0%, 2.5%, 3.5%, 4.5% | 2025; 2026 on | 68 O.S. 2355, HB 2764 | 2026's deduction inferred from the OW-2 tables |
| Philadelphia 3.75/3.74/3.735/3.73% | by July each year | Department of Revenue | The return takes the year's mean |
| Columbus 2.5% | 2025 | Income Tax Division | Held after |
| Portland SHS and PFA | by year's threshold | Revenue Division | The 2028 increase not assumed |
| Denver OPT $5.75 a month at $500 | — | Denver Department of Finance | — |
| Liens, each state | as researched | each state's statute and pages | A dispute decided in 30 days where unpublished |
| IRS notice of federal tax lien | — | IRC 6320, 6321, 6323(j), 6325(a); IRM 5.12.2.6, 5.12.3.9, 5.12.9.9 | Taken at the LT11; withdrawal decided in 30 days; no recording fee charged |
| Pennsylvania's extended plan | — | REV-488 | 60 months; 14 days; approved where the monthly payment fits the statement's net |
| New Mexico long-term agreement | — | NMSA 7-1-21 | — |
| Louisiana's plans | September 2024 | LR 50:1293 | — |
| Oregon's 100% and its waiver | — | ORS 314.400(5); OAR 150-314-0115 | — |

## 3. Tests

New: `tests/tax-places.test.ts` (15), `tests/tax-coverage.test.ts` (6), `tests/liens-and-arrangements.test.ts` (15),
`tests/liens-step-skip.test.ts` (2), and two in `tests/save-migration.test.ts`. Expected amounts are written out from
the published rates, not computed by the code under test: Indiana's $1,150.50 and Marion County's $787.80 on $40,000,
the District's $1,300, Oklahoma's $1,254.50, New York City's $1,125.75 in Brooklyn as in Manhattan, Philadelphia's
$1,495, Portland's $1,845 on $200,000, Indiana's refund of $1,061.70, Oregon's $500 and its $125 waived.

**Mutation:** twelve mutations of the new rules, each run against the new tests. All twelve fail a test; one first
survived (a lien always in error), and a test was added for it:

- California's lien fee, and the days of its notice of intent;
- the IRS's $10,000;
- New Mexico's 72 months;
- Oregon's waiver share, and its cap;
- the statement's opening balances;
- a lien in error;
- the double count;
- Louisiana's down payment required;
- Marion County's rate;
- the District's deduction.

The fix for a payoff leaving a plan in force was removed and the test failed.

**Step versus skip:** an Indiana balance followed from January 2026 across 1 January 2027, where its interest rate
changes, through its warrant and lien, paid and released: day by day with the save opened every thirty days, and in two
jumps. The lien, the notices and every tax posting agree. Repeated releases, a repeated decision and a payment sent
twice do nothing twice.

**Migration:** two saves written by `tools/scenarios.ts` run from `086d00ca`:

- `nonfiler` on 24 May 2028, Connecticut's assessment paid by levy;
- `state-plan` on 23 February 2028, a plan in force.

Opened, they gain no lien, penalty, letter or posting. Opened again, they're the same. Played on, the IRS's substitute
return comes, and the plan's payments are taken. Schema 94 is unchanged: every new field is optional.

## 4. Bugs Found

Each was reproduced, its cause found, fixed, and given a test that fails without the fix.

1. **Untaxed places.** Indiana, the District and Oklahoma each had a city and no rule, so a life there paid no state
   tax. Cause: no rule, and nothing checked. Test: `tax-coverage`, `tax-places`.
2. **New York City's tax was Manhattan's alone.** It was keyed to Manhattan's city id; Brooklyn, Queens and the Bronx
   matched nothing. Test: `tax-places`.
3. **Local taxes missing:** Philadelphia's, Columbus's, Portland's and Denver's. Test: `tax-coverage`.
4. **Counted twice.** The budget's troubles and Home's "to pay" took a state's own assessment of an unfiled return both
   in what's owed and again in "the return late". Cause: the return's late balance didn't exclude what a state had
   already assessed. Fix: `unassessedBalance`. Test: "count a state's own assessment of an unfiled return once".
5. **The statement counted opening balances as income.** A new wealthy life's statement showed $168,478 a month
   earned, so a long plan would be approved on money never earned. Test: Pennsylvania's extended plan.
6. **A plan in force with nothing owed.** A state balance paid off outside its plan left the plan active until its next
   payment came round. Fix: `applyStatePayment` ends it paid. Test: "Pennsylvania's extended plan once approved".
7. **The acceptance tool passed a plan step with the button absent.** It now requires the button and its confirmation.
8. **The rehearsal step stopped short of the call.** The save is a Saturday and the call a Tuesday afternoon, and three
   mornings didn't reach it. It now takes up to five.

## 5. The Built App

`tools/acceptance-ui.mjs` on the build of `a023d4d7`, reports in `acceptance-ui/gaps-2026-10-11/`, with saves written by `tools/scenarios.ts` on the same commit, at
1440 and 390.

| Width | Passed | Failed | Skipped | Errors | Overflows |
|---|---|---|---|---|---|
| 1440 | 30 | 0 | 1 | 0 | 0 |
| 390 | 31 | 0 | 1 | 0 | 0 |

The journeys the brief named, each counted only on its result on screen:

1. **Rehearsal preparation:** Learn The Part, lines 64% to 76%.
2. **A director's note:** Work On The Note, "Worked On", and the button gone.
3. **A creative choice:** chosen, then Tomorrow Morning to the Tuesday call: rehearsed in from 0% to 27%.
4. **Tax:** $10 paid to Connecticut, its plan asked, "$110.93 a month".
5. **A missed payment recovered:** the IRS plan in default, Catch Up, "$84.40 paid", in force after Save & Exit and
   Continue. Connecticut's own plan has no catch-up: its rule on a missed payment wasn't found, so a missed payment ends
   it, as researched.
6. **A lien:** Connecticut's filed, its release greyed with why; paid in full; release asked, "released by May 17, 2027".
   After Save & Exit and Continue it still says so. Weeks on, it's released.
7. **Save & Exit, Continue:** the same day and hour, and steps 5 and 6 after it.

**Skipped:** a new student's rehearsal controls in week one, with no part yet. They're done from the save.

## 6. Engines And Long Runs

- **The 18 lives** (`node tools/verify.mjs lives`): 15 graduated, the 3 autopilot lives dismissed, 0 breaches and 0
  unbalanced. Each is identical, field for field (420 of 420), to its run on `fdc31377`: the tax work changed nothing
  for a student in New Haven whose wages are withheld in full.
- **Variety** (`tools/variety.ts`, seeds v-0 to v-2): identical to `3963fb8c`.
- **Eleven scenarios** (seed `sc-0`), all 0 breaches and 0 unbalanced, in `SCENARIOS-GAPS-2026-10-11.json`. Against
  the limitations pass, the one difference is that Connecticut's lien is filed and paid in `tax-plan` and `nonfiler`.
  It stays paid, not released: Connecticut releases only on request, and the scenario policy doesn't ask.
- **The balance grid** (48 jobs, `node tools/balance-batch.mjs`): all 48 identical to `3963fb8c`; `BALANCE-GRID.md` changed
  only in its revision lines.
- **100/100 at full preparation** is held by the gate's mastery-contract and evaluation tests.

## 7. Gate

`npm run gate`, its exit status read from a file: 0. 165 files and 1,737 tests passed, with all sixteen checks, on src
tree `80e9f4d0`; the final commit changes documents only. A first run was cut short with two tests out of memory: a
`grep` left running by this pass's research held 3.2 GB. It was stopped, and the rerun passed.

## 8. Limitations

- **In play every life is a student in New Haven.** Indiana, the District, Oklahoma and the city taxes are reached by a
  life begun elsewhere through the engine's own saves, and by tests; the built app's journeys are Connecticut's and the
  IRS's.
- **231 countries with cities have no income-tax rule.** No command reaches them in play, and a test counts them.
- **Discretion stays discretion.** Massachusetts's doubling, Oklahoma's 25% on a refused demand, Louisiana's down
  payment, and the liens Louisiana and Massachusetts "may" file for a plan aren't applied.
- **SLATE's own rules, labelled:**
  - a long plan is decided on monthly payment against the statement's net;
  - Pennsylvania's 60 months and 14 days;
  - 30 days to decide a dispute where unpublished;
  - the IRS's withdrawal in 30 days.
- **A lien's effect on credit and property is said, not played.** SLATE has neither, and none was invented.
- **No bug-free claim.** These checks passing doesn't prove there are none.
