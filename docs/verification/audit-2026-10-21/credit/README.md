# D2: The Credit Limit's Growth

Criteria item D2 (`../criteria.md`): every played life's card limit rose a fifth every six months with no ceiling,
found by brief 19's playthroughs (life A's Chase card $194,736 by October 2029) and left for the owner then, because it
belonged to banking and brief 18 was paused. The owner named it in brief 20: "Explicitly investigate the previously
recorded uncapped credit-limit growth ... Use justified rules and measured comparisons; do not adjust numbers simply to
make a test pass."

## What It Was

`systems/credit.ts`, the statement's six-monthly review: a score of 700 or more and no late payment in a year raised the
limit a fifth, and nothing else was read. `card.request_limit` (`systems/cardlife.ts`) raised a fifth for the same record
and any money at all in the bank, and could be asked again at once.

Measured on `340ce7ae` before any change (`limits.ts`, `before.jsonl`): each of creation's six starting means from seed
`b20-credit`, played six years by the playthroughs' TEST SETUP clock (six hours at a time, the body kept fed and rested,
the coursework prepared each midnight; it takes no work and no benefit, so a life with little money starves before the
six years are out, and the record stops there).

| Means | Opening limit | Six years on (or where the life ended) | Raises | Income, the last twelve months |
|---|---|---|---|---|
| Nothing | no card | — | — | — |
| Scraping | $1,630 | $1,403, 1 January 2027 (starved) | 1 | $1,656 |
| Modest | $6,522 | $1,579, 10 June 2028 (starved; cut after late payments) | 7 | $2,070 |
| Comfortable | $21,739 | $18,703, 10 January 2031 (starved) | 11 | $0 |
| Wealthy | $65,217 | **$484,566**, 24 August 2032 | 11 | $0 |
| Inherited | $163,043 | **$1,211,424**, 24 August 2032 | 11 | $0 |

The wealthy life's limit passed what it held from October 2029, when its untouched savings, $413,168, went to the state's
unclaimed-property office on 1 September 2029, and went on rising a fifth twice a year on no income. The savings going was
the bank's dormancy rule as built, read by the money area (`areas/money/REPORT.md`): the measurement's clock touches
nothing, and the bank's interest isn't the owner's activity (Conn. Gen. Stat. §3-57a(a)(1)). The player is told twice
first, "Chase Savings Is Dormant" at thirty months and a decision on 1 June 2029, "Chase Is About To Hand Chase Savings
To The State", whose Keep The Account keeps it; and `bank.claim_unclaimed` brings it back
(`tests/b20-money-clock.test.ts`, on the money area's branch).

## The Rule Now

- **Regulation Z §1026.51(a)**, the CARD Act's ability to pay: a bank may "increase any credit limit" only once it has
  considered "the consumer's ability to make the required minimum periodic payments under the terms of the account based
  on the consumer's income or assets and the consumer's current obligations", and the official interpretation applies it
  "whether the consideration is based upon a request of the consumer or is initiated by the card issuer" (comment
  51(a)(1)-3). Its safe harbor works the minimum out on the whole limit, as if used from the first day, at the account's
  current purchase rate (§1026.51(a)(2)(ii)). It names the ratios a bank may use (debt to income, debt to assets, income
  left after debts) and no figure. Read at consumerfinance.gov, 2026-10-21.
- **A quarter of income** is SLATE's estimate on Fulford and Stavins, "Income and the CARD Act's Ability-to-pay Rule in
  the US Credit Card Market" (Federal Reserve Bank of Boston Working Paper 24-3, 2024, Table 3): of the two shares of income
  they took as what a holder has to spare after other obligations, 50% and 25%, the stricter, which they called
  conservative. They found real limits "almost always substantially lower" than either allows, and the rule binding on
  "people with very low or no documentable income or assets": in SLATE, a student.
- **The ask's six months:** Experian, How to Increase Your Credit Limit, "you should be a cardholder for at least six
  months and should not have requested an increase in the past six months." Read 2026-10-21.

So, from `c4832549`:
- **The review** offers a fifth (SLATE's estimate, as before), and the bank gives as much of it as passes either test
  (`limitCarried`): the minimum on the whole new limit at the card's own minimum and current rate, with the other cards'
  minimums on their statements and the loans' payments, within a quarter of the past twelve months' monthly income
  (`monthlyIncome`, the earnings record every paycheck, benefit and interest payment writes); or the new limit and
  everything else owed on cards and loans covered by what's in the bank. Nothing passes, nothing is raised and nothing is
  said.
- **The ask** is held to the same tests, up to a fifth more as before, and waits six months from the card's opening and
  from the last ask or raise (`askRefusal`), which the card's panel says under the button. A lower limit is granted at
  once, as before.
- **The words:** the raise's notice says "your income or savings cover the payments on it"; the decline says "income or
  savings that cover the payments on a higher one"; the guide's card entry says both tests and the wait.

Outside the US the same test is held: Britain's CONC 5.2A and the EU's Consumer Credit Directive (Article 8(2)) ask a
creditworthiness assessment before a significant increase, which the US test stands in for.

## Measured After

The same six lives on `c4832549` (`after.jsonl`):

| Means | Six years on (or where the life ended) | Raises | Before |
|---|---|---|---|
| Scraping | $1,403, 1 January 2027 | 1 | $1,403, 1 |
| Modest | $1,316, 10 June 2028 | 6 | $1,579, 7 |
| Comfortable | $12,246, 10 January 2031 | 9 | $18,703, 11 |
| Wealthy | **$162,280**, 24 August 2032 | 5 | $484,566, 11 |
| Inherited | **$405,703**, 24 August 2032 | 5 | $1,211,424, 11 |

None of these lives earns anything the clock doesn't give it, so each raise was carried by savings: the wealthy life's
stopped at April 2029's $162,280, the last fifth its $491,316 in the bank covered, and none followed once its savings went
to the state. A life that works is carried by its income: `tests/b20-credit-limit.test.ts` plays $2,000 a month review
after review, and the limit rises to $17,147, the most whole dollars whose minimum (1% and a month at 22.99%) fits a
quarter of it, and stays.

## Tests And Mutations

`tests/b20-credit-limit.test.ts`, eight tests:
- income carries a raise, and its twin with none and $500 doesn't;
- savings carry one, and $10,000 less doesn't;
- the ceiling a fixed income sets;
- the ask's wait after an ask, after a review's raise and after a new card;
- a decline in the bank's words, its wait kept across a save and a load;
- a lower limit at once, and the holder's title changing nothing.

Four earlier tests asserted the old words or two asks a minute apart (`tests/cardlife.test.ts`,
`tests/evidence-g12-money.test.ts`, `tests/evidence-g13-money.test.ts`, `tests/language-crossarea-raise.test.ts`). They
assert the new words, and their asks are six months apart by a TEST SETUP that sets the last ask back. What each held is
unchanged.

Ten mutations (`../mutations/d2-credit.json`), run in a clean clone of `c4832549` with `../mutate.py`; all ten were
killed by an assertion (`../mutations/d2-credit.txt`):
- the review's old fifth;
- income never read;
- savings never read;
- a twelfth of one month's income;
- the review's raise not recorded;
- the wait left out;
- a declined ask not counted;
- the ask's income or savings not read;
- the minimum without its interest;
- a new card's six months.

## What's Left, For The Owner

- **Savings count in full.** A holder with no income whose savings cover the whole new limit is raised a fifth. The
  wealthy start's card so reaches $162,280 on a student's income, about 2.5 times its opening. That's the rule's debt to
  assets ratio taken at one: everything owed, the whole limit used, paid from savings. A stricter reading, a product's own
  ceiling on its limit or savings counted at less, has no source here. It's the owner's to decide.
- **The opening limit** (`limitFor`, by the score alone) and the application's money test (anything in the bank) are as
  they were. §1026.51(a) asks the same consideration when an account is opened. Changing the opening limits would move
  every life's first card and every test that reads it, beyond what the owner named. It's recorded here, not changed.
- **A limit never falls when savings do.** A bank may lower a limit; SLATE's does only after a late payment (to 70%,
  never under what's owed). Unchanged.
