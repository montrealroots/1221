# Brief 15: The Money Area

Read `prompts/common.md` first: it's how every area works. This is what's yours.

## Your Clone

- **The clone:** `/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad/e15-money`, on its branch `ed15-money`, from the pass's baseline commit. Work only there.
- **Your area id** for `--by`, your folder and your status file: `money` (`docs/verification/editorial-2026-10-19/money/`, `docs/text/second-pass/money.json`).
- **Your port** for the built app: 4285.

## What's Yours

255 sources and 53,353 words in 37 files, all Pending in the second pass at the start. Each file, biggest first (sources, words):

- `src/engine/content/cards.ts`: 2 sources, 21,027 words
- `src/engine/content/guide/money.ts`: 26 sources, 19,763 words
- `src/engine/systems/lending.ts`: 32 sources, 1,467 words
- `src/ui/bank/BankLending.tsx`: 2 sources, 1,337 words
- `src/ui/bank/BankCard.tsx`: 5 sources, 1,068 words
- `src/ui/looks/money.tsx`: 15 sources, 874 words
- `src/ui/workspaces/BankWorkspace.tsx`: 9 sources, 671 words
- `src/engine/systems/bankmoves.ts`: 17 sources, 649 words
- `src/ui/bank/BankMoves.tsx`: 1 source, 623 words
- `src/engine/systems/credit.ts`: 13 sources, 525 words
- `src/engine/systems/banking.ts`: 14 sources, 511 words
- `src/engine/systems/accountlife.ts`: 17 sources, 454 words
- `src/ui/bank/BankStatements.tsx`: 8 sources, 446 words
- `src/engine/systems/security.ts`: 10 sources, 340 words
- `src/ui/bank/BankSecurity.tsx`: 2 sources, 334 words
- `src/ui/looks/bank.tsx`: 3 sources, 333 words
- `src/ui/bank/BankCardOffers.tsx`: 1 source, 306 words
- `src/engine/systems/cash.ts`: 5 sources, 291 words
- `src/engine/systems/payments.ts`: 9 sources, 253 words
- `src/engine/systems/cardlife.ts`: 9 sources, 248 words
- `src/ui/bank/BankAccountLife.tsx`: 2 sources, 203 words
- `src/engine/systems/homeaccount.ts`: 7 sources, 197 words
- `src/engine/systems/cardoffers.ts`: 6 sources, 183 words
- `src/ui/bank/BankPayments.tsx`: 2 sources, 181 words
- `src/engine/systems/roundups.ts`: 5 sources, 165 words
- `src/ui/bank/RoundUps.tsx`: 1 source, 155 words
- `src/ui/bank/BankCash.tsx`: 1 source, 143 words
- `src/engine/systems/spending.ts`: 10 sources, 126 words
- `src/engine/core/ledger.ts`: 1 source, 118 words
- `src/ui/bank/feeWords.ts`: 1 source, 101 words
- `src/engine/systems/routing.ts`: 5 sources, 94 words
- `src/engine/systems/obligations.ts`: 2 sources, 77 words
- `src/engine/systems/statements.ts`: 6 sources, 51 words
- `src/engine/content/currency.ts`: 2 sources, 18 words
- `src/engine/systems/banknumber.ts`: 1 source, 13 words
- `src/engine/systems/earnings.ts`: 2 sources, 6 words
- `src/engine/core/money.ts`: 1 source, 2 words

## What To Watch For

**What's yours:** the Money screen and its bank panels (`ui/bank/`, `BankWorkspace.tsx`, the bank and money looks), the banking systems (moving money, payments, cards and their lifecycle, lending, credit, statements, round-ups), the card research data (`content/cards.ts`), and the How This Works entry `guide/money.ts`. The banks' own research data is the money-data area's.

**From the working reference:** example 4 (an account blocked after a switch), and "Wages are paid into an open current or savings account of yours." in the table.

**Checking account:** the glossary's word from this brief. Most of the game's 425 uses of "current account" are in your files. Change every one a player reads, including labels. The id `checking` stays, and so does a bank's own product name.

**Voice:** a bank: professional and exact. Keep every amount, fee, rate, date and condition. Pending is never available. An estimate is labelled one, at the foot. Don't make a consequence more certain than the code makes it.

**Interactions to read whole:**

- moving money, refused for what's available and for a pending payment, then done;
- a card payment pending, then posted, and its statement;
- a card's autopay short, the late fee and the notice;
- opening and closing an account;
- a limit raised;
- borrowing.

**Decision 4:** its banking items are words only.
