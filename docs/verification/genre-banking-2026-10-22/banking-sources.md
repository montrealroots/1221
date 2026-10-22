# Brief 21's Banking Sources, Read 2026-10-22

What each of the audit's five banking findings was checked against, what the source says, and what SLATE does with it.
A rule read from the bank, the regulator or the statute is **verified**; one SLATE needs and no source settled is
**SLATE's assumption**, said as such here and on the screens that use it. Where a fetch failed, the search engine's copy
is named as the source, as brief 19's research did.

## B1. A Quoted Yield, And The Rate That Earns It

### The rule

A yield quoted as an APY (US), AER (UK, Ireland), TAE (Spain) or GAT (Mexico) is an effective annual rate: what a year
earns with the interest paid and compounded as the account pays it. A rate quoted as a nominal annual rate (Canada's
"regular" or "posted" rate, Spain's TIN, Germany's "p.a.", France's taux, Japan's 年利, Korea's 연, Iceland's vextir,
Australia's and New Zealand's "p.a.", Argentina's TNA) is the rate a day's interest is worked from, `rate ÷ 365`.

- **Reg DD, Appendix A, Part I** (12 CFR 1030, read through law.cornell.edu): "APY = 100 [(1 + Interest/Principal)^(365/Days
  in term) − 1]". Its examples work daily-compounded rates against their APYs (5% compounded daily for 91 days, then
  5.5%: $26.68 on $1,000, APY 5.39%), and an institution may count a 365- or a 366-day year.
- **AER**, in the banks' own words: "what the interest rate would be if your interest was paid and compounded once each
  year" (Lloyds Bank, Easy Saver page; AIB's rate table says the same).
- **GAT**, Banco de México, Circular 35/2010: the net annual gain "que, para fines informativos y de comparación,
  incorpora los intereses nominales capitalizables", less the account's costs. GAT nominal is before inflation, GAT
  real after (Banorte's brochure gives both).
- **TAE and TIN**, Spain: Sabadell's own conditions give "1% TIN (1.005% TAE)" paid monthly, which is
  12 × ((1.01005)^(1/12) − 1) = 1.000% to the fourth place.

### What SLATE did

Every product's rate ran as a nominal rate: each day `balance × rate ÷ 365` accrued, at full precision, and the whole
cents were posted at the month's end (or in the bank's months, `pays`), the fraction carried. So Capital One's 3.00% APY,
credited monthly, earned (1 + 0.03/12)^12 − 1 = 3.0416% a year.

### What SLATE does from brief 21

Each product's quote has its basis (`Product.quoted`): `'effective'` where its own source names an APY, AER, TAE or GAT;
nominal otherwise. An effective quote is turned into the nominal rate the account's own crediting earns it at:
r = m × ((1 + y)^(1/m) − 1), m the times a year it's credited (12 monthly, 2 half-yearly, 1 yearly). A day's interest is
then `balance × r ÷ 365`, as before, kept at full precision and posted in whole cents at the crediting. Where the terms
compound daily (Wells Fargo), a day's interest is worked on the balance and the interest accrued so far, at
r = 365 × ((1 + y)^(1/365) − 1). A nominal quote is left as it is.

| Bank, product | Quote | Credited, compounded | Source, date | Status |
|---|---|---|---|---|
| Capital One, 360 Performance Savings | 3.00% APY | monthly, monthly; daily balance | capitalone.com disclosure, dated 7/15/2026: "compounded and credited on a monthly basis" | verified |
| Chase, Chase Savings | 0.01% APY | monthly, monthly | chase.com savings page (search engine's copy): compounded and credited monthly on the daily collected balance | verified |
| Bank of America, Advantage Savings | 0.01% (APY) | monthly, monthly | bankofamerica.com savings FAQ and Clarity Statement (search engine's copy): a daily periodic rate, compounded and paid monthly | verified |
| Wells Fargo, Way2Save Savings | 0.01% APY | monthly, daily, 365-day year | wellsfargo.com Way2Save page and consumer disclosures (search engine's copy): "compounded daily and paid monthly" | verified |
| Barclays, Everyday Saver | 1.00% AER | monthly | DepositScout's listing; Barclays' own page read garbled | basis verified, crediting SLATE's assumption |
| Lloyds Bank, Easy Saver | 1.00% AER | once, 12 months after opening | lloydsbank.com Easy Saver page (search engine's copy): "Interest is paid 12 months after you open the account" | verified; the rate SLATE has is its own source's, the page now gives 1.10% |
| NatWest, Flexible Saver | 1.25% AER | monthly | not found | basis from its source, crediting SLATE's assumption |
| HSBC, Flexible Saver | 1.05% AER | monthly | hsbc.co.uk: 1.05% AER / 1.04% gross, "calculated daily and credited to the account monthly", from 12 March 2026 | verified |
| Santander, Easy Access Saver Issue 31 | 2.00% AER, then 0.90% | monthly (its monthly option) | Issue 31 key facts, from 17 July 2026: "2.00% AER/1.98% gross" paid monthly, 2.00% AER/gross yearly | verified |
| Nationwide, Flex Instant Saver | 2.30% AER | once a year | nationwide.co.uk: "2.30% AER/gross", interest "calculated daily and credited once a year" | verified |
| AIB, Demand Deposit Account | 0.25% AER | April and October | aib.ie: interest put in each April and October | verified |
| Bank of Ireland, Demand Deposit Account | 0.10% AER | monthly | not found | basis from its source, crediting SLATE's assumption |
| Banorte, Inversión Enlace | GAT nominal 0.31% | monthly | Banxico Circular 35/2010 for GAT; the crediting not found | basis verified, crediting SLATE's assumption |
| Bankinter, Cuenta Nómina | 5% TAE, then 2% TAE | half-yearly, from opening | bankinter.com's announcement: "la liquidación de intereses … seguirá siendo semestral"; HelpMyCash: 4.94% and 1.99% TIN | verified |

Every other product with a rate (about 220 of 236) quotes a nominal rate or gives no basis. Those whose source names a
nominal basis (Canada, Spain's TIN, Germany, France's Livret A, Japan, Korea, Iceland, Australia, New Zealand, Argentina's
TNA) were right already and are left as they were. Those whose source is a bare URL or a figure with no basis, most of
the world sheets', are run as nominal, **SLATE's assumption**, said in the account's source line.

Nationwide's and Lloyds' yearly crediting, and Bankinter's half-yearly, are counted from the day the account opened
(`Product.credits`); AIB's April and October are calendar months (`pays`). Until brief 21 all four were credited
monthly. Lloyds' Easy Saver becoming a Standard Saver after a year, and Santander's Issue 31 moving to the Everyday
Saver, aren't modelled: the rate after them is the one SLATE already had.

## B2, B3. A US Card's Penalty Rate And The End Of Its Introductory Rate

- **Reg Z §1026.55(b)(4)** (consumerfinance.gov, the current regulation): an increase is allowed "due to the card issuer
  not receiving the consumer's required minimum periodic payment within 60 days after the due date"; (b)(4)(ii) the issuer
  "must reduce" it after "six consecutive required minimum periodic payments" received on time.
- **Comment 55(b)(4)-1**: for a payment due March 15, "the sixtieth day after the due date is May 14"; a payment short on
  May 14 means the exception "would apply beginning on May 15". Example iv.A: not received by May 16, the notice given,
  and the 28% rate applies "On July 1" to the balance and to new transactions.
- **Comment 55(a)-1.i.B**: the §1026.9(g) notice "no earlier than August 15, which is the first day the account became more
  than 60 days' delinquent".
- **§1026.9(g)** (and comment 55(b)(2)): written notice at least 45 days before the increase takes effect.
- **A promotional rate**: comment 55(b)(1)-3.ii.C applies the same (b)(4) exception to a deferred-interest promotion; an
  introductory rate ended early for a delinquency is an increase in rate, so the same 60 days and 45 days' notice hold.

SLATE did it at the second missed due date, about 30 days late, and the introductory rate ended that day with no notice.
From brief 21 a US card's delinquency is counted in days from the due date of the oldest unpaid minimum: from the 61st day
(more than 60 days late, the minimum not received within 60) the notice goes out, and 45 days after it the penalty rate
(on a card whose terms have one: Chase 29.99%, Bank of America 29.99%) and the introductory rate's end both take effect;
six minimums on time in a row take the penalty rate off, as before. Paid up before the 61st day, nothing happens; paid up
after the notice and before the 45 days, the notice stands, as the regulation allows. **SLATE's assumption**: the penalty
rate isn't applied to new transactions earlier (§1026.55(b)(3) would let an issuer, after the first year, with 45 days'
notice, for any reason): no card's terms read here say it does.

**What's past due, and how a payment is counted.** The FFIEC counts an account past due from its contractual due date, so a
payment goes to the oldest minimum still short, and a card is current again only when every minimum past due and the
latest one are paid. **SLATE's reading, not a rule quoted here**: a US statement's minimum payment due takes in what's
past due. Read on 2026-10-22: the CFPB's model statement (Appendix G-18(A), files.consumerfinance.gov,
cfpb_credit-card-penalty-fees_model-forms_g-18-g.pdf) has a "Past Due Amount" line in its account summary beside the
minimum payment due, and an issuer's glossary (creditonebank.com, "minimum payment due") calls the minimum what keeps the
account from being past due; neither says the past-due amount is inside the minimum, and no Reg Z text read does. The
receipt lists it as uncertain. What holds without it is the FFIEC's count from the contractual due date, a payment to the
oldest first. From brief 21 SLATE does that: a payment clears the oldest minimum first (`CardState.pastDue`), what's been paid toward them since the statement
is kept (`towardPastDue`), and the next due date asks its own minimum and what was past due at its statement, which the
statement, the card's panel and autopay on the minimum say and ask. As first written that day a payment that cleared the
oldest minimum also counted toward the next due date's, so $40 paid on the 60th day settled two $40 minimums and the card
was current again; `tests/b21-banking-proof.test.ts` ('counts from the oldest minimum still short') found it, and it
was fixed before anything was committed. **SLATE's assumption**: a hardship plan's payment stands in for what's due, and
met, brings the card current, as SLATE's plans did before; the FFIEC's re-aging asks three payments in a row under a
workout, which SLATE doesn't count.

Canada's penalty rates (two missed minimums in twelve months, `CANADA_PENALTY`, each bank's cost-of-borrowing disclosure)
and the cards whose terms end an offer at one missed payment (`INTRO_ENDS_ON_MISS`, Barclaycard and others outside the
US) are each bank's own published terms and stay as they were.

## B4. The Charge-Off

- **FFIEC Uniform Retail Credit Classification and Account Management Policy** (65 FR 36903, June 12, 2000; OCC Bulletin
  2000-20, June 20, 2000): "open-end credit be charged off when 180 days past due"; closed-end at 120.

SLATE charged a card off at the sixth missed due date in a row, about 150 days past due, while its comment said 180.
From brief 21 a US card is charged off on the 180th day past the due date of the oldest unpaid minimum, counted in days,
if it's still unpaid then. Elsewhere SLATE keeps the sixth missed due date: no country's own rule was read, so it's
**SLATE's assumption**, as it was.

## B5. A US Card's Due Date

- **Reg Z §1026.7(b)(11)(i)(A)**: "The due date disclosed pursuant to this paragraph shall be the same day of the month for
  each billing cycle." Comment 7(b)(11)-6: generally the same numerical date; the last day of the month is allowed.
- **Reg Z §1026.5(b)(2)(ii)(A)**: the statement mailed or delivered at least 21 days before the payment due date.
- **Comment 7(b)(11)-9**: a due date on a day the creditor doesn't take mail (July 4) is still disclosed as that day;
  §1026.10(d) then treats a mailed payment received the next business day as on time. SLATE's payments aren't mailed.

SLATE's due date was the statement date plus the bank's days, so Chase's (21 days after the 20th) fell on the 10th, the
11th or the 13th by the month. From brief 21 a US card's due date is one day each month: the day that keeps at least the
bank's days after the statement in every month, February included. With the statement on the 20th, Chase's 21 days
make it the 13th (24 days after a January statement, 21 after February's, 22 in a leap year); Bank of America's and
Wells Fargo's 25 days the 17th. Citi's and Capital One's, the 15th of the month after, were one day already. A due date
already on a statement in a save stays as it was disclosed. Other countries' cards keep the statement date plus their
days: no rule asking otherwise was read. **Uncertain**: Japan's issuers bill on fixed days (MUFG Card, for one, closes
on the 15th and pays on the 10th), which the cards' recorded sources don't give; SLATE's 25 to 27 days after its own
statement day stand until they're read.

## B6. A Standing Order On A Weekend Or Holiday

- **UK, Payment Services Regulations 2017, reg. 81(5) and (6)** (legislation.gov.uk): a payment order agreed for "a
  specific day" is received that day, and "If the day agreed under paragraph (5) is not a business day for the payer's
  payment service provider, the payment order is deemed to have been received on the first business day thereafter."
- **EU and EEA, Directive (EU) 2015/2366 (PSD2), art. 78(2)** (read through lewik.org's copy): "If the agreed day is not a
  business day for the payment service provider, the payment order received shall be deemed to have been received on the
  following business day." Germany's BGB §675n(2), Iceland's Act no. 114/2021 and the other member states carry it.
- **The banks' own words**: Lloyds Bank, "What is a standing order?" (search engine's copy): "We don't process standing
  orders on a weekend or bank holiday. If a standing order payment is due on a non-working day, we'll make it on the next
  working day." NatWest's guide: "Standing orders might not be paid until the next working day if they fall on a Saturday
  or a Sunday … This can be the case with NatWest." Sparkasse.de: "Banken und Sparkassen führen Buchungen und
  Überweisungen ausschließlich an Bankarbeitstagen durch."

SLATE made each standing order on its date, weekend or holiday. From brief 21 a standing order from a bank in the UK,
the EU or the EEA is made on its date if that's a business day for the paying bank (its country's holidays,
`content/bankdays.ts`), else on the first business day after; the next month's is on its own date again. Elsewhere
(the US, Canada, Mexico, Japan, Korea, Australia, New Zealand and the rest) no bank's or payment system's rule was found
for a transfer between the holder's own accounts, and it's made on its date, **SLATE's assumption**, as before. Chase's
own help pages weren't found; a third party's says Chase queues weekend ACH transfers for Monday, which is for transfers
to another bank, and those already arrive on the sending bank's business days (`sendBetweenBanks`).
