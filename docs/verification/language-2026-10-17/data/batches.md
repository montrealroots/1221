# Brief 14: The Research Data's Dates And Punctuation

The record of `prompts/data.md`, on the branch `l14-data`, from `c74a02e1`. The dynamic cases had found (`dynamic/defects.md`,
Recorded And Left) about 306 strings in the inventory that print a date as their research wrote it, "2026-09-26" or
"8 April 2026", in a source line or a note under what it explains, where the rest of the game writes "September 26, 2026";
and a space before a semicolon in Chase's card source.

## How It Was Found

`node tools/text-inventory.mjs --show "*"` printed every string the game can show; a scan read each for an ISO day or
month, a day before its month (with a year or without), a short month ("Apr 2026", "Sept 2026", "Aug 7, 2026") and a
slashed or dotted day. At `c74a02e1` that was 638 strings in 318 sources, more than the dynamic cases' 306, because the
scan read short months, slashed days and days without a year too. Each was then read where a screen shows it, so a date
that only a comment, a key or a test reads was left alone: the fields of each data file were walked, every reader of each
field found with `grep`, and each field kept or changed by what its readers do with it (`readers-*.txt`).

## The Rules Applied

- **The game's form** is `formatDate`'s: "September 26, 2026". A day without a year is "September 30"; a month and year
  is "September 2026"; a run of days is "August 24 to 28"; a span of months "January to June 2026"; a reading day
  "read October 10, 2026". Each date keeps its value: only its order and its month's spelling change.
- **Kept as the source wrote it:** anything in quotation marks (a quotation is the source's); a web address, a domain's
  path and a file's name; a date fused into a document's or a law's number ("Décision n°19 du 29/12/2025/CM/UMOA",
  CIBC's form "12404-2026/09", "Ley 33/2003", TD's "599186 (0326)", BMO's "50463589 (04/25)"); a date written in another
  language's words ("Fassung Juli 2026", "tarifario_Mayo_2026"); and the fields a screen presents as the bank's own words
  ("In the bank's words:", "The bank's plans, in its words:"), Santander's "by 31/01/2027" among them.
- **A day the code reads is data.** It stays as it is, and a screen that shows it formats it there (`formatDateKey`, new
  in `core/time.ts`): a card's and a product's `asOf`, a round-up rule's `checked`.
- **A slashed day is written by hand**, never by a rule: "6/14/2026" is June 14 in America and nothing in Europe, and
  "7/2021" is as often a law's number as a month. Only one whose value is certain was changed: a part over 12, or a
  month and a four-figure year after a document's name. A dotted day ("23.09.2026") is Europe's, day first, and the
  rule reads it only with a four-figure year, so a version number ("18.1.8.22") and an item ("12.3.10") are left.

## Batch 1: The Bank Research

### What changed, and how a rebuild keeps it

**The five files made by scripts that were never in the repository** (`probe/gen-cards.cjs` and the rest, and their inputs
`probe/more/*.jsonl`): `content/cards.ts`, `accountlife.ts`, `cash.ts`, `pending.ts`, `security.ts`, each a
`JSON.parse("…")` of its generator's output. Their generators can't run here, so the change is made in the generator's
own form and as a step that follows it: `tools/research-dates.mjs --write` parses each export, applies `gameDates` and
`noSpaceBefore` to the fields a screen shows (`GENERATED`), applies the hand-written slashed dates (`BY_HAND`, each of
which must be found exactly once, or already be the new text), and writes `JSON.stringify(JSON.stringify(data))` back
inside the `JSON.parse`, the form the generator wrote (the tool refuses a file not in that form). Regenerating one of the
five is followed by `node tools/research-dates.mjs --write`; without `--write` it lists what it would change and exits 1
if anything would, so a regeneration that dropped the step shows. 449 fields changed:

| File | Export | Fields changed | Fields read |
|---|---|---|---|
| `cards.ts` | `CARDS` | 88 | `source` (the Cards tab's fine print) |
| `cards.ts` | `CARD_LAW` | 79 | `law`, `source` (a capped term: "<law> caps …. Source: …") |
| `accountlife.ts` | `ACCOUNT_LIFE` | 69 | `source`, `dormancyWords`, `penaltyWords`, `maturityWords` (Your Accounts Over Time) |
| `accountlife.ts` | `UNCLAIMED` | 15 | `source`, `to` (the question, the ledger line and the panel), `claimBack` |
| `cash.ts` | `CASH` | 60 | `source` (Payments And Cash) |
| `pending.ts` | `PENDING` | 60 | `source`, `pendingWords`, `postingOrder`, `valueDating` (a statement), `paymentHoldWords` (the card) |
| `security.ts` | `SECURITY` | 64 | `source`, `replaceWords` (Your Cards) |
| `security.ts` | `FRAUD_LAW` | 14 | `source`, `debitWords` ("The law on the debit card: …") |

`generated-diff.mjs` proves nothing else moved: for every value of every export, at `c74a02e1` and now, a value that
differs must be one of those fields and equal the step applied to its old text; every number, key, id and other field
must be the same. Its output is `generated-diff.txt` (exit 0). Mutation-tested: a card's returned-payment fee moved by a
cent made it exit 1 naming the field.

**The space before a semicolon.** 38 of Chase's and other cards' sources (and three country laws) joined an address and
the next part with " ; " (`…/LGC61498.html ; minimum-payment formula from …`). `noSpaceBefore` takes the space out,
outside a quotation, in the same step. No other stray space before punctuation was found in the same data: the inventory
held four in `passports.ts` (French titles, "Passeport d'un majeur : première demande", not shown: `sources[].statedDate`)
and two in `home-accounts.json` (French titles, not shown), and one in `content/guide/money.ts` ("Kept At … : £… In …",
a quoted label pattern, the money area's guide, not data), all left.

**The hand-kept bank research:** `content/banks-thirteen.ts` (46 literals), `banks-lending.ts` (40), `roundups.ts` (19),
`banks-world-sheets.ts` (38: 35 by the step, 2 dotted days, and Bank of Cyprus's "table dated 17/04/2025" by hand),
`banks-world-fees.ts` (2), `bankopening.ts` (3) and `systems/accountlife.ts`'s `unclaimedLaw` (1). These files are their
own source (`banks-world-sheets.ts` was generated by a `probe/` script on 2026-09-25 that isn't in the repository, and has
been edited by hand since), so the change is in them. `apply-hand.mjs` applied `gameDates` to each string literal by its
raw text, leaving a literal that is a date and nothing else (data), and listed every change; each was read by hand before
it was written. By hand besides: "Clarity Statement 08/2026" ("Clarity Statement, August 2026").

**The screens.** `formatDateKey` (`core/time.ts`) writes a day kept as a key the game's way. `BankWorkspace.tsx`
formats a product's `asOf` in its Source line, `RoundUps.tsx` a rule's `checked`, and `BankCard.tsx` a card's `asOf`,
said once where the source already ends on that same day (`sourceAndDay`): 45 cards had read "…/terms/, 2026-09-26,
2026-09-26." Where the two days differ (40 cards: the day the page was read, then the day of the terms), both stay.

### What was kept, and why

- `asOf` (cards, products, `banks-world.ts`'s), `checked` (round-ups), `changes[].from` (a rate's change, read by
  `BankWorkspace.tsx` as `next.from > dateKey(…)`, a comparison): data. `tests/cards.test.ts` holds each card's `asOf`
  to `^\d{4}-\d{2}-\d{2}$`.
- `rewardsWords` and `planWords` (cards): the screen says "In the bank's words:" and "The bank's plans, in its words:".
- `avgLossBasis` (security), `penalty`'s other fields, and every field no screen reads: no screen reads them.
- `content/home-accounts.json` (113 strings with dates): no screen shows any of its prose. `homeaccounts.ts` reads
  `kept`, `closesWithNoticeDays` and the official source's title and address into `HomeTerms.source`, and the read day into
  `HomeTerms.asOf`; nothing reads either of those two, and what the screens say of a bank abroad is hand-written in
  `homeaccounts.ts` (`READ`, `ABROAD`). The builder's own comment says it's "the research quoted". Left, with its builder.
- `banks-world-iban.ts`'s sources ("added 2026-09-27"): `banks.ts` reads only the code.
- The URLs and document numbers in the generated files' shown fields (`left-generated.mjs` lists every one left).

### Meaning-sensitive changes

Every slashed or dotted day: each one's value was read from the digits, and changed only where it's certain. 6/14/2026
and 5/20/2026 can only be June 14 and May 20; 17/04/2025 only April 17; a dotted day is a European one, day first; a month
with a four-figure year after a document's name ("Agreement 08/2026") is that month. Each is in `BY_HAND` or was edited by
hand and read in the diff. A span ("Jan-Jun 2026") became "January to June 2026", the same six months. "Sept" is
September. No figure, id or key moved (`generated-diff.txt`; the hand-kept files' diff touches only string literals'
dates).

### Nothing reads them back

`readers-bank.txt`, generated by `grep` over `src/`: every comparison, parse, sort or key on a `source`, and on each word
field, anywhere in the code. The only one on a research field is `BankWorkspace.tsx`'s `/no published rate/i.test(product.source)`,
which no date touches. Each field's readers interpolate it into words (a Source line, a notice, the ledger memo
"Unclaimed, to …", `person.unclaimed[].to`, which only the panel prints). A world sheet's `name` becomes a new account's
name; no code compares an account's name with a product's (`index.ts`'s one comparison is with "<institution> Credit
Card"). `core/invariants.ts`'s `b.law` is an invariant's law, not a card's.

### Tests and tool matchers

- New: `tests/language-data-dates.test.ts`, four tests: every shown field of the five generated files, and of the
  hand-kept bank research, has no date left for the step and none slashed or dotted outside a number; a New York student
  at Chase reads Accounts, Cards, Payments And Cash, Your Cards, Borrowing and Statements, each source line's day the
  game's way and said once, its value the data's; a student at Bank of America reads Your Accounts Over Time, the
  round-up rule's day read and checked. Mutation-tested: the doubled card day back, a product's raw `asOf` back, and one
  research date back to "24 September 2026" each failed it.
- Updated, as exactly: `tests/roundups.test.ts` "the panel" held `` `Source: ${rule.source}, checked ${rule.checked}.` ``
  and holds `` `… checked ${formatDateKey(rule.checked)}.` ``. Its title is unchanged.
- No built-app tool matched these words (`acceptance-ui.mjs`, `playthroughs-ui.mjs` searched for each changed date's
  context: none).

### Checks

`batch1-tests.txt`: the 62 test files that import a changed bank file, `core/time.ts`'s test and the new one, 860 of 860
(exit 0). `npx tsc -b --noEmit` 0. `npx eslint` on every changed file 0 (`batch1-eslint.txt`). `title-case --check`,
`label-sweep`, `plural-check`, `voice-check --check`, `tics --check`, `spelling`, `typos`, `doc-refs --check`,
`deciders --check`, `inventory --check`, `text-inventory --check`, `vite-node tools/geo-check.mjs`: each 0.
`node tools/research-dates.mjs` after the write: "0 fields would be rewritten", exit 0.

### Statuses

133 sources re-marked Rewritten And Verified, each by the area whose file held it (115 money, 18 school: the round-ups),
after its last edit, by `mark.mjs` through `tools/text-inventory.mjs --mark`, the evidence naming the test and keeping the
area's own review of the rest of the source after it. `text-inventory --check`: Pending 0.
