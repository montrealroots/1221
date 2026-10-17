# Brief 14: The Money Area

Read `prompts/common.md` first: it's how every area works. This is what's yours.

## Your Clone

- **The clone:** `/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad/l14-money`, on its branch `lang14-money`, from the pass's baseline commit. Work only there.
- **Your area id** for `--by`, your folder and your status file: `money` (`docs/verification/language-2026-10-17/money/`, `docs/text/statuses/money.json`).
- **Your port** for the built app: 4205.

## What's Yours

The inventory's subsystem money: 678 sources, 97,757 words, in 50 files. Each file, its sources and its words, biggest first:

- `src/engine/content/cards.ts`: 2 sources, 20,876 words
- `src/engine/content/guide/money.ts`: 26 sources, 18,424 words
- `src/engine/content/security.ts`: 2 sources, 14,824 words
- `src/engine/content/accountlife.ts`: 2 sources, 10,483 words
- `src/engine/content/pending.ts`: 1 source, 6,937 words
- `src/engine/content/banks-world-sheets.ts`: 208 sources, 4,797 words
- `src/engine/content/banks-world.ts`: 2 sources, 2,143 words
- `src/engine/content/banks-thirteen.ts`: 63 sources, 2,112 words
- `src/engine/content/cash.ts`: 1 source, 1,480 words
- `src/engine/content/banks-lending.ts`: 52 sources, 1,478 words
- `src/engine/content/homeaccounts.ts`: 7 sources, 1,414 words
- `src/engine/systems/lending.ts`: 32 sources, 1,340 words
- `src/ui/bank/BankLending.tsx`: 2 sources, 1,267 words
- `src/ui/bank/BankCard.tsx`: 4 sources, 910 words
- `src/ui/looks/money.tsx`: 15 sources, 865 words
- `src/engine/content/bankopening.ts`: 2 sources, 625 words
- `src/ui/workspaces/BankWorkspace.tsx`: 9 sources, 561 words
- `src/engine/systems/bankmoves.ts`: 17 sources, 532 words
- `src/ui/bank/BankMoves.tsx`: 1 source, 517 words
- `src/engine/systems/credit.ts`: 13 sources, 473 words
- `src/engine/systems/banking.ts`: 14 sources, 453 words
- `src/engine/systems/accountlife.ts`: 17 sources, 432 words
- `src/ui/bank/BankStatements.tsx`: 8 sources, 418 words
- `src/engine/content/banks-world-fees.ts`: 1 source, 360 words
- `src/ui/looks/bank.tsx`: 3 sources, 330 words
- `src/engine/systems/security.ts`: 10 sources, 299 words
- `src/ui/bank/BankSecurity.tsx`: 2 sources, 292 words
- `src/engine/content/rents.ts`: 1 source, 274 words
- `src/ui/bank/BankCardOffers.tsx`: 1 source, 254 words
- `src/engine/content/banks-world-iban.ts`: 83 sources, 246 words
- `src/engine/systems/payments.ts`: 9 sources, 229 words
- `src/engine/systems/cardlife.ts`: 9 sources, 224 words
- `src/engine/systems/cash.ts`: 4 sources, 219 words
- `src/engine/systems/homeaccount.ts`: 7 sources, 189 words
- `src/ui/bank/BankAccountLife.tsx`: 2 sources, 173 words
- `src/engine/systems/cardoffers.ts`: 6 sources, 169 words
- `src/ui/bank/BankPayments.tsx`: 2 sources, 169 words
- `src/engine/systems/roundups.ts`: 5 sources, 150 words
- `src/engine/systems/spending.ts`: 10 sources, 126 words
- `src/ui/bank/RoundUps.tsx`: 1 source, 123 words
- `src/ui/bank/BankCash.tsx`: 1 source, 121 words
- `src/engine/core/ledger.ts`: 1 source, 118 words
- `src/engine/systems/routing.ts`: 5 sources, 89 words
- `src/ui/bank/feeWords.ts`: 1 source, 78 words
- `src/engine/systems/obligations.ts`: 2 sources, 77 words
- `src/engine/systems/statements.ts`: 6 sources, 46 words
- `src/engine/content/currency.ts`: 2 sources, 20 words
- `src/engine/systems/banknumber.ts`: 1 source, 13 words
- `src/engine/systems/earnings.ts`: 2 sources, 6 words
- `src/engine/core/money.ts`: 1 source, 2 words

A file of yours that another area's tests or tools assert is still yours to change; update those assertions and say so in your batch record.

## What To Watch For

- **Official and banking voice:** clear and professional. Keep every amount, date, deadline, fee, rate and condition
  exactly. Pending is never available. An estimate is called one, in the source line at the foot, not mid-sentence
  (`docs/STYLE.md`, Truth in the text). Don't make a consequence more certain than the code makes it: read the code.
- **Restrictions and pending states:** a hold, a refusal, a declined payment or a frozen card says why, what was and
  wasn't charged, and the next real step.
- **The data files** (`content/cards.ts`, `security.ts`, `accountlife.ts`, `pending.ts`, `banks-world-sheets.ts` and
  the rest) are research data in JSON. Find which fields a screen shows: the source lines, a fee's description, a
  product's name. Review those. A real product or bank name stays as its owner spells it. A field no screen shows is
  Reviewed And Retained, with how you know it isn't shown.
- **Decision 4's banking items** (common.md): words only. Their behavior and matrix status stay exactly as they are.
- **Keys:** `Interest`, `Overdraft Interest`, `Tax On Interest` and the collection account names `lending.ts` matches
  stay as they are.

**How This Works entries.** An entry in `src/engine/content/guide/*.ts` is a feature's tutorial. Rewrite yours so it answers the
brief's eight questions in order, with the screen's own labels:
- what it's for (`short`);
- where to go (`where`, `available`);
- what to press (`steps`);
- what's needed first (`needs`);
- what happens (`now`, `later`, `costs`, `interpret`);
- how it affects the rest of the game (`connections`, `reads`);
- what to do next (`next`, a new optional field: give every entry one, or `[]` with a reason in your batch record);
- what to do if you can't (`unavailable`, `mistakes`).

Lead with a short plain overview, then the steps, then results, then the deeper explanation and the figures (`reads`,
`example`). Every route and label it gives must exist on the built app: check each against the text walk of your
screens. Figures stay read from the rules' constants, as they are now, never typed into the words. The tutorial area
renames the headings Help shows, so write each field for its question, not for its old heading ("What The Game Reads"
becomes what it affects).
