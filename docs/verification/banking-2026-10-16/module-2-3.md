# A Bank Account Kept At Home: Modules 2 And 3, The Research And Creation

On 2026-10-16 the owner decided that the Yale and New Haven life stays, and that an eligible student may keep an account
they already held in the country they lived in before Yale, beside the American one. Birthplace alone grants nothing.
Nobody travels or moves. Module 1 (`module-1-ledger.md`) gave an account in another currency its own exact figure. This
record covers module 2, the research as data, and module 3, the rule, creation and the opening.

## What Changed

- `tools/build-home-accounts.mjs` (new) copied what the rule and the screen read of
  `docs/research/banking/home-accounts.json` into `src/engine/content/home-accounts.json`: each bank's retention (kept,
  its conditions, its non-resident fee, its notice, its policy on US persons), its assumptions and its sources, and the
  research's `world.assumptions`. The card, transfer, identification and tax fields stayed in the research.
- `src/engine/content/homeaccounts.ts` (new) typed it as `HOME_TERMS`, read through `homeTerms`, with `addHomeTerms` and
  `resetHomeTerms` for tests. The research's `kept: true` became `keeps`, `false` `closes` (Barclays alone, 60 days, or
  Britain's 90 for an account opened from 28 April 2026), and `conditional` was kept on a condition said in a sentence.
  Confidence was the research's footing: high where the bank says it in its own words, medium where it publishes a price
  for a customer abroad (BNP Paribas, SG, LCL, Deutsche Bank, Sabadell, MUFG, SMBC), low for the rest of the
  conditionals, which rest on "the absence of a published emigration rule, not on a published permission" (the
  research's words). Fees for a customer abroad were read as figures where published. Opening ages were read where the
  research found one (PTSB 18, Kiwibank 16, BBVA México 18) and taken as 16 elsewhere, said on screen as SLATE's. Japan
  Post Bank was refused for its own words: its default is closing, and keeping one needs a proxy in Japan.
- The world's other ~230 countries were refused, not given the research's `world` rules. Those say a bank "may" keep,
  convert, restrict or close the account, and that their transfer fees weren't researched and won't be invented; neither
  says what happens, so neither was a rule SLATE could defend. Every bank there is refused with "SLATE has no research on
  what <bank> does when a customer moves to America."
- `src/engine/systems/homeaccount.ts` (new): `homeAccountRefusal(config, bankId)`, the one rule for the screen and
  `populateWorld`, in the design's order (nothing said; America before Yale; a bank elsewhere, or no usable research; not
  open before Yale; a bank that never opens a US citizen's account). The birthplace is read only in the fifth step, as
  citizenship. `whatFollows` gave the screen's sentences. `splitOf` split the money (design section 5), and
  `openHomeAccounts` opened the current account at nothing and the savings where the split put them, backdated to the
  rule's opening day, `lastUsedBefore` the morning the life starts, `currency` set only where it differs from the save's,
  and the bank's own figure passed as `native`.
- `src/engine/world/bootstrap.ts`: `NewSaveConfig` gained `priorResidence`, `homeBankId` and `savingsAtHome`;
  `createUniverse` set `Person.priorResidence` (`src/engine/domain/model.ts`) from it.
- `src/engine/index.ts`: `populateWorld` split the money and opened the home accounts after the American bank's accounts
  and card, so their ids and numbers were those of a life with none. `loadPlacesFor` brought in the prior residence's
  country and the holidays of every country an account's bank is in.
- `src/engine/content/bankdays.ts`: `daysOfAccount` took the prior residence's region for a bank in that country, where
  the holder doesn't live there now.
- `src/ui/creation/CharacterCreation.tsx`: Starting Point gained Before Yale (I Lived Where I Was Born, Where You Lived,
  Since, I Kept An Account There, Your Bank There with refused banks grayed out and their reasons listed, what follows,
  Your Savings). What Is Yours and Review showed the split, and Review gained Before Yale and Home Bank. `validate`
  refused a refused bank, a time before birth and a time after arrival.
- `src/engine/content/guide/money.ts`: a new entry, `bank.home-account`, "A Bank At Home", said what creation asks and
  why, with its figures from the terms and the split.
- `docs/UNBITTEN.md`: what the screen says follows and nothing carries out yet.

No schema version changed: every new field was optional, and no older save had one.

## How It Was Proved

`tests/home-account-creation.test.ts`, 16 tests, all passing. Every figure was worked by hand from
`content/currency.ts`, as its header shows:

- The terms: 55 entries (the 60 banks less the five American ones), each a real bank with a source, its retention
  mapped from the research, Barclays closing at 60 days, HSBC UK kept, Deutsche Bank conditional at medium, BNP
  Paribas' €15 a month, PTSB's 18 read and Lloyds' 16 assumed. No Italian bank has terms.
- The rule, each step in its words: born in London with nothing said, none; born in London and raised in New York, "You
  lived in America before Yale; your account is the one here."; born in America and never abroad, none; Deutsche Bank
  for a Londoner, an Italian bank and Japan Post Bank refused, each for its reason; living there only after Yale began,
  and a test bank opening from 30, refused; a test bank that never opens a US citizen's account refusing one born in New
  York and not one born in London; HSBC UK offered as kept, Barclays offered with its closing on October 23, 2026 (60
  days from August 24), or November 22 for an account opened in May 2026 (90 days); Deutsche Bank's AktivKonto with its
  medium footing; BNP Paribas' and SG's charges, SG's spared under 25; Lloyds' low footing.
- A life made with `createSave` on `newLifeConfig`: a Modest Londoner at Barclays opened Barclays Bank Account at nothing
  and Everyday Saver holding 558,100p (706,456¢), Chase Total Checking with 521,744¢, together 1,228,200¢, opened
  14 June 2018, used until the start, England's days; a Berliner at Deutsche Bank held €6,499.00 (706,413¢) and
  521,787¢ at Chase. With the savings moved, every American account's id, name, balance and number equaled those of a
  life with nothing kept. A birthplace alone and a refused bank opened nothing. Through a save and a load the figures
  and the prior residence held; ten days played across the month's end paid HSBC UK's interest, the held figure the sum
  of its postings, with `audit` and `breaches` empty and neither account inactive.
- The screen, drawn with react-dom/server: Before Yale with its labels for a Tokyo life, Japan Post Bank disabled with
  its reason, MUFG's condition and ¥300, and ¥1,059,750 kept (706,500 × 150 exactly); the America line and no bank for
  a New York life; Review's Before Yale, Home Bank and $5,217.44; `validate` passing an offered bank and refusing a
  refused one and a time before birth.

`tests/guide-examples-money.test.ts` gained the new entry's play, its figures read from the entry and set against a made
life (16 passing).

Each of these files was run alone (VITEST_MAX_FORKS=1), and every test in it passed: acceptance-contract, accountlife,
arrears, bank-fees, bank-lifecycle, bank-moves-card-line, bank-moves, bankdays, banking-complete, banking, banknumbers,
base44-adapter, base44-contract, cardlife, cardoffers, cards, cash, citizenship, cohesion, coverage-gaps-statements,
creation, cross-journeys, defects3-bank, the five evidence money files, guide, guide-examples-money (after its play was
added), guide-examples-papers, guide-examples-school, guide-examples-start-day-body, home-account-creation,
home-account-ledger, integrity, journey-life, journey-money, lending, migration-92, migration-94, money-fixes,
money-plan-interest, money, pending, persistence, roundups, save-migration, the six scope files, security,
server-guards, several-cards, simulation, smoke, socialsecurity, statements-hardship, statements, tutorial.

Four files failed, none on banking: guide-examples-coursework (a skill at 79 for 80), guide-examples-craft (0.848 for
0.847), guide-examples-productions (the blocking line) and journey-three-students (repeated situations). Each reads the
coursework and abilities that another session was editing in the working tree at the same time (`abilities.ts`,
`coursework.ts`, `practice.ts`, `school.ts` and their guide entries, uncommitted), and none touches a file this module
changed.

`tsc -b --noEmit` and ESLint on every changed file were clean. title-case, label-sweep, plural-check, voice-check,
doc-refs, wired, spelling and typos passed. tics failed by two over its budgets, both from that other session's
`abilities.ts`; none of its hits is in a file this module changed. The full gate wasn't run.

Each mutation was applied to `systems/homeaccount.ts`, run against the new tests, and restored byte for byte:

| Mutation | Result |
|---|---|
| Step 1: the birthplace taken as where they lived | Killed: 3 tests (step 1, step 2's American, a birthplace opening nothing) |
| Step 2 dropped | Killed: 2 tests (step 2, the screen's America line) |
| Step 5 dropped | Killed: 1 test (step 5) |
| The split's leftover dropped from checking | Killed: 3 tests (the Barclays and Deutsche Bank lives, Review's figures) |

One guard was kept that no life reaches: `daysOfAccount` keeps the current region where the holder lives in the bank's
country now, which a Yale life with a home account never does.

## What Modules 4 To 7 Must Know

- Nothing carried out the closing, the charge for a customer abroad or the conditions the screen says
  (`docs/UNBITTEN.md`). `noticeFor` and `closesOn` give the date; `armHomeAccounts` and `bank.home_closes` are module 4's,
  and sending the balance home needs module 5's payment between countries.
- The home current account is a second current account, so Your Banks offers Make Primary and Have Wages Paid Here on
  it, and both work today with no foreign card fee and no refusal. The design's gates (`abroadRefusal`, redirect refused,
  card fees in `chargeForPurchase`) are module 4's.
- `bank.transfer` or closing savings between Barclays and Chase would take Britain's Faster Payments path at once,
  which module 5 must stop before it (`sendBetweenBanks`).
- Interest on home savings is taxed by the bank's own country's resident rule (Germany's 26.375% over the allowance on
  a Flexgeld, for instance), not the non-resident one; and `recordInterest` records it as ordinary interest. Modules 4
  and 6.
- The bank's own monthly fee (Deutsche Bank's €6.90) is charged by `feeFor` in dollars with the native filled in by
  conversion; module 4 should pass the bank's figure as `native`, as `openHomeAccounts` does, since a won or yen account
  drifts by a unit otherwise.
- The research's card, transfer, identification and tax fields, and its `countries` and `us` sections, weren't copied:
  extend `tools/build-home-accounts.mjs` and `HomeTerms` with the figures each module reads, read by hand as `READ` was.
- `Account.peak` still doesn't exist (module 6).
- The bank workspace, statements and Home show a home account's dollar balance as the save shows any; `held` in its
  own money is module 7's.
- `daysOfAccount` and `loadPlacesFor` already follow the prior residence and every held account's bank country, so a
  transfer's business days can count both countries once module 5 asks.
