# Brief 15: The Money Data Area

Read `prompts/common.md` first: it's how every area works. This is what's yours.

## Your Clone

- **The clone:** `/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad/e15-money-data`, on its branch `ed15-money-data`, from the pass's baseline commit. Work only there.
- **Your area id** for `--by`, your folder and your status file: `money-data` (`docs/verification/editorial-2026-10-19/money-data/`, `docs/text/second-pass/money-data.json`).
- **Your port** for the built app: 4286.

## What's Yours

522 sources and 96,515 words in 15 files, all Pending in the second pass at the start. Each file, biggest first (sources, words):

- `src/engine/content/home-accounts.json`: 75 sources, 46,506 words
- `src/engine/content/security.ts`: 2 sources, 14,968 words
- `src/engine/content/accountlife.ts`: 2 sources, 10,567 words
- `src/engine/content/pending.ts`: 1 source, 7,006 words
- `src/engine/content/banks-world-sheets.ts`: 208 sources, 4,811 words
- `src/engine/content/roundups.ts`: 22 sources, 2,463 words
- `src/engine/content/banks-world.ts`: 2 sources, 2,143 words
- `src/engine/content/banks-thirteen.ts`: 63 sources, 2,115 words
- `src/engine/content/cash.ts`: 1 source, 1,540 words
- `src/engine/content/banks-lending.ts`: 52 sources, 1,460 words
- `src/engine/content/homeaccounts.ts`: 7 sources, 1,435 words
- `src/engine/content/bankopening.ts`: 2 sources, 614 words
- `src/engine/content/banks-world-fees.ts`: 1 source, 368 words
- `src/engine/content/rents.ts`: 1 source, 274 words
- `src/engine/content/banks-world-iban.ts`: 83 sources, 245 words

## What To Watch For

**What's yours:** the banks' research data: `banks-*.ts` (fees, IBAN formats, lending, the world's banks and their sheets), `bankopening.ts`, `homeaccounts.ts` and `home-accounts.json`, `security.ts`, `accountlife.ts`, `pending.ts`, `cash.ts`, `rents.ts` and `roundups.ts` (each bank's round-ups into savings). Most of it is kept as one JSON string per file, so one source holds thousands of words.

**Find what a screen shows.** For each field, grep the interface for its name (`ui/bank/`, `ui/looks/money.tsx`, `ui/looks/bank.tsx`, and the systems that build notices from it). Review every shown field. A field no screen shows stays, and its reason says how you know nothing shows it. Brief 14 found `home-accounts.json` reaches no screen: check that it still doesn't.

**Voice:** plain, professional English for a player. Each fee, rule and condition stays exact. A bank's real product names stay as the bank spells them. A sentence quoted from a bank's published terms stays verbatim and is marked as a quote; the game's summary around it is plainly the game's. Source lines stay at the foot. Estimates are labelled.

**Checking account:** the glossary's word from this brief, in the prose you rewrite. The bank's own product names don't change.

**Your examples** should show a shown field before and after, from at least five banks and four kinds of field (a fee, a security rule, an account-life rule, a pending rule, a source line).
