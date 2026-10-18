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

## Batch 2: The Papers Research, The Papers Guide And The Running Times

### What changed, and how a rebuild keeps it

**Three builders with their research in the repository.** Each now applies `gameDates` on the way in to the fields a
screen shows, the research file keeping its own words, as `build-attribute-content.mjs` applies its words file:

- `tools/build-entry.mjs`: each entry rule's `note`, shown under Going Abroad (`Documents.tsx`, `answer.rule.note`). 74
  notes changed in `content/entry.ts`.
- `tools/build-passports.mjs`: each passport's `feeBasis` and `abroad`, shown under Your Passport. 8 and 3 changed.
- `tools/build-licenses.mjs`: the permit's `idp.issuer`, said in `mayDrive`'s refusal. 1 changed (Britain's).

**The license builder had drifted from its output.** Run on `c74a02e1` before any change, it gave a `licenses.ts` that
dropped New York's MCTD `district` (read by nothing since the licensing system went on 2026-10-09) and put back Mexico
City's descriptive name (said in `mayDrive`'s refusal), both set by hand in `licenses.ts` on 2026-10-06 (`363e8812`,
`f9cf1fe1`). A rebuild for
the dates would have lost them, so the builder now holds both (`DISTRICT`, `NAME`, and the interface's `district`, written
on one line as it was by hand) and gives the committed file: the run after the change differs from `c74a02e1` by the one
issuer's date and nothing else (`git diff`, below). `defects.md` has it.

Each builder was run (`build-entry.txt`, `build-passports.txt`, `build-licenses.txt`, exit 0), and `git diff` of its
output touches only the shown fields: 74 `note`, 8 `feeBasis`, 3 `abroad` and 1 `issuer` lines on each side, nothing else.
The passport and entry builders gave their committed files byte for byte before the change (run on `c74a02e1`: no diff).
Each builder also runs `voice-check --fix` and `spelling --write` after it writes, as before; both changed nothing.

**Hand-kept, by `apply-hand.mjs` (each change read before it was written):** `content/passportsabroad.ts` (5, an office's
basis abroad), `visas.ts` (3, a visa's basis), `workload.ts` (4, a production's running time, shown as "Source for the
running time"), `tutorial.ts` (1), `guide/papers.ts` (19 literals with written days), `PapersWorkspace.tsx` (7: the returns' fine
print and its tooltip, the dental plan, the State Pension) and `SchoolWorkspace.tsx` (1, Withdraw's warning). The
applier reads JSX text from this batch on.

**Days built from parts.** The papers guide built three day-first: `dayMonth` ("23 October to 15 January", Connecticut's
open enrollment), `fullDay` ("From 1 January 2027, …", HUSKY D's work rules and the renewals) and the day Enroll opens
("from 2 June"). Each is month first now, as `formatDate` writes it; the notice the guide quotes beside the first already
said "From January 1, 2027". No other day-first date is built from parts in `src/` (`grep` for a day before a month
name in a template, and for `toLocaleDateString` and `en-GB`: none that prints).

### What was kept, and why

- `ENTRY`'s `authorizations[].processing` and `statedDate`, `ENTRY_UNCERTAIN` and `ENTRY_AS_OF`: no screen reads the first
  three; `ENTRY_AS_OF` is data, formatted where it's shown ("Researched September 29, 2026", the dynamic cases').
- `PASSPORTS`' `sources[].statedDate`, `uncertain` and `lost`: the screen prints each source's address and only says
  that some details couldn't be confirmed; `lost` is read by nothing (`documents.ts`'s `rule.lost` is the police's rule).
- `LICENSES`' notes, renewal notes, foreign-license rules and `idp.convention`: read by nothing but the authority, the name
  and the permit's issuer.
- `content/licensepaths.ts` (9 strings): the license-earning path was removed in the scope reset of 2026-10-09; only its
  `LicenseStage` type is imported (`documents.ts`). `content/workrules.ts`'s `feeBasis` ("USCIS G-1055, 09/09/26", a
  form's edition): read by nothing. `systems/homebenefits.ts`'s `CDMX_DESEMPLEO.source` ("8 June 2026"): the screen reads
  its payments and amount only.
- `decided.ts` ("(from 2026-10-10)" in a decider's description): read by `tests/deciders.test.ts` and `tools/deciders.mjs`
  only ("Nothing in the engine imports this"). `content/attributes-matrix.ts` (4): it writes `docs/` Markdown and nothing
  in `src/` imports it.
- `RUNNING_TIMES[].read`: data, and no screen shows it.

### Meaning-sensitive changes

None changed a value. The built days come from the same numbers (`CONNECTICUT_ENROLLMENT.openFrom`, the enrollment's
special days, `PUBLIC_COVER.workFrom`), only their order changed; `guide-examples-papers.test.ts` checks the day Enroll
opens against the game's own `yaleUntil` less 60 days, as before.

### Nothing reads them back

`readers-papers.txt`: each changed field's readers outside its own file. Every one interpolates it into words (Your
Passport's fine print, Going Abroad's, a visa's line, the refusal to drive, Source for the running time). The only
comparisons on fields of these names are on other objects (a document's `issuer` code, a running time's `basis` enum, a
register's `basis`).

### Tests and tool matchers

- Updated, as exactly: `tests/remaining-papers.test.ts` (six `toContain`s of an office's basis abroad: "£116.50 from
  April 8, 2026", "US$62 from July 1, 2026" twice, "from May 2, 2025", "from June 1, 2026", "from May 1, 2026"),
  `tests/guide-examples-papers.test.ts` ("On August 1 a notice says …", "From September 1 its premium …", and "Enrolled
  ahead, from ${MONTHS[o.month - 1]} ${o.day} … begun August 1."), `tests/defects-g8-8.test.ts` ("A return is due April
  15, … due June 15."), `tests/defects-g8-4.test.ts` (its regex, `\(August 1, for a fall term\)`) and
  `tests/evidence2-b13.test.ts` ("From January 1, 2027, some of the month …"). No title changed: two of
  `defects-g8-4.test.ts`'s titles still say "30 September", as titles are cited.
- Added to `tests/language-data-dates.test.ts`: every shown field of the papers research and the running times; the whole
  guide and tutorial (1,000 strings and more) with no date the game doesn't write, and four of the changed sentences
  held whole; and a student's Health Cover and, with a State Pension claimed (TEST SETUP), Benefits, drawn. Mutation-
  tested: an entry note's date put back, `fullDay` put back day first, and the dental line's day put back each failed.
- No built-app tool matched these words.

### Checks

`batch2-tests.txt`: the 83 test files that import a changed file of this batch, and the new one, 1,234 of 1,234 (exit 0).
`npx tsc -b --noEmit` 0; `npx eslint` on every changed `.ts` and `.tsx` 0 (`batch2-eslint.txt`); the eleven language and
inventory checks and `geo-check` 0 each.

### Statuses

35 sources re-marked Rewritten And Verified by their areas (20 papers, 11 frame for the entry rules Going Abroad shows,
3 school, 1 tutorial; the papers guide’s three entries are among the papers’), by `mark.mjs`, after the last edit.

## Batch 3: The Genres' Research

### What changed, and how a rebuild keeps it

`tools/build-attribute-content.mjs` builds `content/genre-demands.json` from `docs/research/attributes/research-genre-demands.json`
and the profile area's words file. Its words step now writes dates the game's way (`gameDates`) in the research's own
sentences (`house`, after the words file's edits and the house's spelling), in its citations (`cited`) and in how each
demand was read (`howWords`, which wrote "reviewed 2026-10-10" itself), never inside a quotation or a web address. The
builder was run (`build-attribute-content.txt`, exit 0, "149 genres, 377 edits", every edit still found once), and the
diff of its output is 30 `how`, 27 `uncertainty` and 7 `source` lines on each side, nothing else. The genre look shows
all three (`ui/looks/actor.tsx`: "What the research says: … (how; confidence)", "Still uncertain: …", "Source for what it
asks: …").

### What was kept, and why

- In the citations, a title in quotation marks and a web address stay as written, the same day in an address among them
  (`/2019-09-11/` beside "(September 11, 2019)").
- `content/home-accounts.json` (113 strings, the most of any file): no screen shows its prose (`readers-genres.txt`, its
  last part). `homeaccounts.ts` reads a bank's `kept`, `closesWithNoticeDays` and its official source's title and address
  into `HomeTerms.source`, and the research's day into `HomeTerms.asOf`, and nothing reads either of those two; what the
  screens say of a bank abroad is written by hand in `homeaccounts.ts`. Its builder (`build-home-accounts.mjs`) was left
  as it is, and gives its committed file.
- The research files under `docs/research/` keep their own dates: the game's words are put on the way in.

### Tests

Added to `tests/language-data-dates.test.ts`: every genre's claim, reasons, what the research says, how it was read,
what's uncertain, what it belongs to and its source; and a first-year opening Horror, Adventure and Absurdist (the genre
look drawn, `resolveLook`). Mutation-tested: one "reviewed October 10, 2026" put back as "2026-10-10" failed both.
No other test held these words (`grep` for each old date's context in `tests/` and `tools/`: one comment).

### Checks

`batch3-tests.txt`: the 9 test files that import the genre research or the actor looks, `tests/engagement.test.ts` and
the new one, 147 of 147 (exit 0). `npx tsc -b --noEmit` 0; `npx eslint` 0; the eleven checks and `geo-check` 0 each.

### Statuses

62 sources re-marked Rewritten And Verified by the json area, whose file held them, by `mark.mjs`, after the builder's run.
