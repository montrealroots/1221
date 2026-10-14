# A Bank Account Kept At Home: Modules 6 And 7, Tax And Screens

On 2026-10-16 the owner decided that an eligible Yale student keeps an account they held in the country they lived in
before Yale, beside the American one. Modules 1 to 5 (`module-1-ledger.md`, `module-2-3.md`, `module-4-5.md`) gave it
its own exact figure, the research as data, the rule, creation, the bank's terms from abroad and payments between the
countries. This record covers module 6, what America's tax makes of it, and module 7, the screens.

## What Was Wrong

When module 5 was finished, `payInterest` recorded a home bank's interest as any bank's: no country, and the tax the
bank's country took at source lost to the return. A US citizen's foreign interest was taxed without its credit; nothing
kept an account's highest figure, so neither FinCEN's FBAR nor Form 8938 could be told. And every screen but Move Money
wrote a home account in dollars: its panel's Balance, its rate's lines and fee in the primary account's bank's money, its
statement, Home's money line, the looks and the alerts.

## What Changed

- `src/engine/systems/earnings.ts`: `recordInterest` took `abroad`, the bank's country and the tax taken at source, and
  kept them by country in `foreignInterest`. `src/engine/systems/banking.ts`: `payInterest` passed them for any bank
  outside America, the tax being the same transaction's posting to Tax On Interest. Term deposits' interest
  (`systems/accountlife.ts`) wasn't given it: no home account can open one (`abroadRefusal`).
- `src/engine/systems/taxreturn.ts` (`figuresFor`): foreign interest on its own term. A nonresident alien's stays off the
  1040-NR (IRC 862(a)(1), 872(a); the research's `us.foreignInterestForF1`), beside the American banks' (IRC 871(i)), as
  `nonresidentFor` already left all interest out. A US person's is on the 1040, and the tax taken at source is credited
  up to the US tax on that interest, the federal tax before credits times the interest over the income: Form 1116's own
  limit for passive income, apart from the wages' (IRC 904(d)(1)). A bank abroad sends no 1099, so the $300 election
  without the form (IRC 904(j)) wasn't taken. Both credits together are held to the tax before them, a guard no played
  life reaches.
- Connecticut, decided by its rules and left as the code had it: its adjusted gross income is the federal one, modified
  (Conn. Gen. Stat. 12-701(a)(19)), the 1040-NR's for a nonresident alien (Form CT-1040's instructions, line 1), and it
  taxes a resident on all of it. So a US citizen's interest from a bank at home is Connecticut income, with no credit for
  the other country's tax, which Connecticut gives only for another state's (12-704(a)); an F-1 student's, off the
  1040-NR, isn't. SLATE already taxed Connecticut on the federal figure (`stateTaxed`), with the year's interest under
  where they lived and no share past the whole: both held, and a comment says why.
- `src/engine/core/ledger.ts`: `Account.peak`, by calendar year, the most the account held at a day's end and what it
  held at the last, in its own money. `systems/banking.ts` writes it each night for a US person's checking and savings
  at a bank outside America, for the day just ended. Nothing else is given it.
- `src/engine/content/homeaccounts.ts`: `US_REPORTS`, the FBAR's $10,000 and its dates, and Form 8938's $50,000 at the
  year's end and $75,000 at any time for an unmarried taxpayer living in America, read from the research's `us` section.
- `src/engine/systems/abroad.ts`: `foreignAccountsNotice`, said once at Tax Season (`systems/taxreturn.ts`), the
  morning the return is prepared, with or without one: the accounts' highest figures together, each converted at SLATE's
  rate, over $10,000, and the FBAR due 15 April, extended automatically to 15 October, filed with FinCEN and not with the
  return; past 8938's lines, that it goes with the return, or that it doesn't, where there's no return to file. It says
  what SLATE doesn't model: filing either form, the penalties, Treasury's rate for the year's end. Never for an F-1
  student or an account under the line; an overdrawn account counts as nothing. Also `balanceText` (an account's money
  in its own currency with the dollars beside), `chargeWords` and `homeAccountLines` (the panel's lines: the fee for a
  customer abroad, the card's fees here, the closing and its day).
- Screens: `src/ui/workspaces/BankWorkspace.tsx` read each account by its own bank (its fee, rate lines, waivers and
  footing had read the primary account's bank's currency), showed a home account's Balance in its money with "… in
  dollars, at SLATE’s rate" under it, ", Held From Abroad" after its number, its How This Works on `bank.home-account`,
  `homeAccountLines`, Close It's words in its money, and the head line's "… at your other banks, £5,581 of it at HSBC
  UK". `src/ui/bank/BankStatements.tsx` and `systems/statements.ts` (`activity`, `accountStatement`): each line, the
  balance after it and the figures in the bank's money, the dollars under each figure. `src/ui/screens/Home.tsx`: the
  money line adds "and £5,581.00 at HSBC UK". `src/ui/looks/bank.tsx` and `src/ui/looks/money.tsx`: an account's,
  a bank's and a line's figures in both. `src/ui/bank/BankMoves.tsx`: Your Banks. The alerts: the statement notice
  (`systems/banking.ts`), Low Balance and Short For A Payment (`systems/obligations.ts`) and A Large Payment
  (`systems/statements.ts`).
- `src/engine/content/guide/money.ts` (`bank.home-account`): the tax, the reports, and what the screens show, with a
  connection to `taxes.return`. `src/engine/content/tutorial.ts`: two sentences in the `bank` chapter, with a dated
  comment above it.
- `tools/acceptance-ui.mjs`: one step at the end, after the existing ones, no selector of theirs changed.
- `docs/UNBITTEN.md`: the home-account entry says what bit and what's still only said.
- `docs/COVERAGE-MATRIX.md`, `docs/DEVMAP.md`, `docs/TRACEABILITY.md`: regenerated by their tools, which they were
  already behind (module 4's `bank.home_closes`, and another session's attribute tests then uncommitted).

No schema version changed: `peak` and `foreignInterest` are optional and written only from now, and an older save has
neither, which reads as nothing to report.

## How It Was Proved

`tests/home-account-tax.test.ts`, 6 tests, and `tests/home-account-screens.test.ts`, 3 tests, all passing. Each life was
made with `createSave` on `newLifeConfig` with Before Yale's fields and played on the clock, to the 2026 return on
1 February 2027 for the tax; each screen was drawn with react-dom/server. Every figure was worked by hand, as each
file's header shows:

- An F-1 student raised in Tokyo, at SMBC: 54¢, 472¢ and 589¢ of interest, Japan's 8¢, 72¢ and 90¢ taken (15.315%,
  each rounded), recorded as `{ JP: { gross: 1,115, withheld: 170 } }`. The 1040-NR's income was the work-study and the
  scholarship, 1,567,000¢, without the interest, no credit, Connecticut's tax on the same 1,567,000¢; no notice, and no
  `peak` kept.
- A US citizen raised in London, at HSBC UK: 2,625¢ of 2026 interest on the 1040 (1,569,625¢), nothing withheld, no
  credit, Connecticut's tax on the whole (more than on the whole less the interest).
- A wealthy US citizen raised in Tokyo, at SMBC: 65,204¢ of interest, 9,986¢ taken. With $30,000 of wages beside it
  (TEST SETUP), 1,620,804¢ taxed, $1,240 + 12% of $3,808.04, so 169,696¢ before the credit; the credit the lesser of
  9,986¢ and 169,696 × 65,204 / 3,230,804 = 3,424.85, so 3,425¢, and the federal tax 166,271¢. With $250,000, the whole
  9,986¢.
- FBAR: the comfortable citizen's Flexible Saver at most 3,619,903p, $45,821.56 at 0.79, told once on 1 February
  through a reload before it and another after; the modest one's 560,174p ($7,090.81) not. A modest citizen who sent
  $4,000 to HSBC UK and £3,000 back was over $10,000 only for the days between, under it at the year's end, and told.
- Form 8938: the wealthy citizen at SMBC, $413,589 at most and at the year's end, with no return to file, told the form
  goes only with one; the same life with $30,000 of wages, a return made, told it goes with it. A wealthy F-1 student at
  HSBC UK and a comfortable American never abroad: nothing said, nothing kept.
- The screens, a Modest Londoner at HSBC UK with £100 moved to its current account and August played: the panels'
  Balance £5,581.00 / £100.00 with "$7,064.56 in dollars, at SLATE’s rate" / "$126.58", Held From Abroad beside each
  number, the card's 2.75% and the machine's 2.75% and 2% (£1.75 to £5.00), the rate in its words; the head line's
  "£5,… of it at HSBC UK"; Home's "and £5,… at HSBC UK"; the looks (an account's, the bank's, a line's "took £100.00
  ($126.58) out of Flexible Saver"); August's statement in pounds, its interest 139¢ as 110p, each line and the balance
  after it in pounds; the same after a save and a load. The statement notice "£100.00 ($126.58) at the close." and Low
  Balance's "down to £100.00 ($126.58)". BNP Paribas' panel said its €15.00 a month, Barclays' its closing on October 23,
  2026, and only the two Barclays panels said Held From Abroad.

Each mutation was applied, run against the new tests, and restored from a copy of its own
(`scratchpad/m67/bak-banking-67`), compared with `cmp`, identical each time:

| Mutation | Result |
|---|---|
| The F-1 exclusion dropped (foreign interest on the 1040-NR) | Killed: the F-1 at SMBC |
| The credit's cap dropped (the whole tax taken credited) | Killed: the $30,000 case, 9,986¢ for 3,425¢ |
| The FBAR's line at $50,000 | Killed: the comfortable citizen and the modest one who moved money |
| `peak` keeping only the day's figure, not the year's most | Killed: the modest one who moved money |
| The bank screen's Balance in dollars alone | Killed: the screens' test |
| Home's money line in dollars alone | Killed: the screens' test |

Each of these files was run alone (VITEST_MAX_FORKS=1), and every test in it passed: acceptance-contract, accountlife,
arrears, bank-fees, bank-lifecycle, bank-moves-card-line, bank-moves, bankdays, banking-complete, banking, banknumbers,
base44-adapter, base44-contract, cardlife, cardoffers, cards, carried, cash, citizenship, cohesion, costs,
coverage-gaps-statements, creation, cross-journeys, day-bounds, defects3-50-70, defects3-bank, sixteen defects-g and
defects-r files, the five evidence money files, evidence-g02/03/04/06/07-life, evidence-g15/16/17-papers,
evidence-g23/25-school, evidence-g29/30/33/34-ui, evidence2-b01/b04/b05/b07/b12, evidence3-lifepapers, evidence3-person
(after the change below), federal-tax-years, the guide-examples files for craft, money, papers, school and the start,
guide, hardship-plan-minimum, the six home-account files, integrity, journey-life, journey-money, lending, looks (after
the change below), migration-92, migration-94, money-fixes, money-plan-interest, money, navigation, papers-complete,
papers-fixes, papers-transitions, pending, persistence, playthrough-fixes, roundups, safetynet, save-migration, school,
the six scope files, security, server-guards, several-cards, simulation, smoke, socialsecurity, state-tax-states,
state-tax, statements-hardship, statements, tax-coverage, tax-lifecycle, tax-places, tax, tutorial.

Two failed on this work and were fixed: `looks` found a straight apostrophe in a new comment in `ui/looks/bank.tsx`;
and `evidence3-person`, the check that a sentence naming the removed interests is dated, read "the US tax on that
interest" in three new sentences as naming one, so they say "the interest". The same check was already failing on five
quotations in `content/home-accounts.json` from modules 2 to 5 (a bank's terms on "the customer's legitimate
interests", Australia's "interest earned"); the copied research was set aside as `docs/research/` already is.

Nine failed on another session's work, none on a file this module changed: evidence-g19-school, evidence-g21-school,
evidence-g27-ui, evidence-g32-ui, evidence2-b03, evidence2-b08, evidence2-b11 and evidence3-home (casting, the
abilities' figures, a graduate dismissed), each reading the coursework, abilities and evaluation that session was
editing in the working tree.

`tsc -b --noEmit` and ESLint on every changed file were clean. title-case, label-sweep, plural-check, tics, doc-refs,
wired, spelling, typos, inventory, devmap, traceability, capabilities and student-matrix passed (devmap, traceability,
capabilities and the inventory's matrix after `--write`). voice-check was two over its budget, both in the other
session's `abilities.ts`; coverage failed on the other session's `evidence-g31-ui` test names. The full gate wasn't run.

The built app (`npm run build`, `npx vite preview --port 4181`, `tools/acceptance-ui.mjs` with the scenario saves):
61 passed, 0 failed, 2 skipped at 1440 and at 390, 0 page errors, 0 overflows (`acceptance-1440.json`,
`acceptance-390.json`). The new step made a London-born F-1 in a second slot, ticked I Lived Where I Was Born and I Kept
An Account There from the keyboard (focus and Space), chose HSBC UK, read "Kept At HSBC UK: £326,303 In Flexible Saver",
began, read both currencies on both Held From Abroad panels, moved $100 from Chase with the quote "HSBC UK receives
£71.95 after its £5.00 fee … on Thursday, August 27, 2026", and found Home's line with pounds and dollars; the Before
Yale card and Move Money had nothing past the right edge at 390. The two skips were the existing ones.

## What Is Still Open

- Not modeled, and said so in the notice: filing the FBAR or Form 8938, their penalties, Treasury's year-end rate.
  Schedule B's foreign-account question isn't asked. A US person living abroad (8938's higher lines) or married isn't a
  Yale life.
- A peak is the day's end: money in and out within a day isn't seen.
- SMBC's ¥220 for a customer abroad was charged on the current account, which opens at nothing, so it went overdrawn
  by ¥220 a month (module 4's). Fixed later on 2026-10-16 (`open-defects.md`): it comes from the savings at the bank, or
  it's owed and payments abroad stop, as SMBC's terms say.
- The home savings' statements listed every month back to its backdated opening (2018), each empty. Fixed the same
  day: they start at the month the life began.
- After a reload, Your Banks said "Your everyday card’s autopay pays from it." for Chase where it hadn't before. It was
  looked into the same day: the line was missing before anything pinned the autopay, and is there now from the start.
- The conditions an account is kept on are taken as met (`docs/UNBITTEN.md`).
