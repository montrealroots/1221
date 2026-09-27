# What Does Not Bite

A standing list of everything in SLATE that is declared, written, displayed or
believed, and that changes no outcome. It is kept separate from `DEPTH.md`
because that page argues for the standard and this page is the arrears against
it.

The test, which is the project's own: change an input — does the outcome change,
or only the sentence? A thing that fails it is on this page until it passes or
until it is deleted. Both are acceptable endings. Only leaving it alone is not.

Two kinds of failure, and they want different fixes, so they are never mixed:

- **Dead.** Move it across its whole range and nothing observable moves. Either
  wire it or delete it.
- **Unreachable.** The code is correct and general, and nothing in the build can
  reach the input that would exercise it. The fix is usually elsewhere: build
  the thing that would reach it, or assert the contract directly on the function
  and say plainly that no play can get there.

The revamp emptied most of this page. The character sheet, the film career,
the family business and the family were where nearly every entry lived, and
they are gone rather than wired. What follows is what the cut left behind.

---

## The count, as the ratchet has it

From `tools/wired.mjs`, held against `docs/UNWIRED.json`. These may fall. They
may not rise.

| Declared | Nothing reads | Of |
|---|---|---|
| Id namespaces | 1 | 7 |
| Save tables nothing fills | 1 | 9 |
| Personality knobs nothing reads | 0 | 7 |
| Personality axes nothing consults | 0 | 7 |

The first two are the player. The family was the only thing that made a person after
boot, so `person` has no `nextId` call and `people` is filled only by
bootstrap, which writes the player by hand. They are counted honestly and they
are not dead words; the tool says so beside the check. The axes were three
until 2026-09-27: openness, extraversion and agreeableness, read since by a
day's work (`systems/enjoyment.ts`). Risk tolerance was a fourth until the
card read it, and this table said four until 2026-09-25.

The tool counts writers. The One Rule asks for readers, which is stricter, so
the true arrears are larger than this table and the rest of this page is the
part the tool cannot see.

---

## Dead: declared, and nothing reads it

- **Rent is published in nineteen places, and estimated everywhere else.**
  The atlas put a one-bedroom in Mosfellsbær at $3,424 a month, about what it
  says for New York, because its formula stacks Iceland's price level on a
  town-size factor; Iceland's housing agency puts it near 205,000 krónur.
  Rent now reads published figures where there are some (`content/rents.ts`)
  and scales the atlas to them elsewhere in the same country. A country with
  none keeps the atlas's estimate, and the screen says which a town has.
  Food and bills are SLATE's estimates everywhere. The legal floors under
  wages were real and sourced until they went with the job engine on
  2026-09-26.
- **What a trait's cost says about other people is said back, not
  charged.** Each is written for a whole life, and since 2026-09-27 the
  game charges every part of it that touches something it has: stress,
  sleep, the energy a night puts back and a night away (Homebody,
  Restless), hygiene, mood, illness (Resilient), an early call or a late
  performance (Night Owl, Early Riser) and the receipts a return can deduct
  (Keeps Accounts, Chaotic). What's left is about other people, whom SLATE
  doesn't have, and injury, which it doesn't model. The Traits card says so.
- **Some banks' figures weren't found, and a few are given as words.** The
  thirteen countries' waivers are modeled as the banks write them since
  2026-09-25: an average balance, an average across one's accounts at the
  bank, and wages with bills or card payments beside them. In the other 226
  countries (`content/banks-world-sheets.ts`, two research passes), 216
  countries have a sheet, 202 banks an account name and 182 a savings rate.
  The 22 fees the research gave with a waiver in words were shown and not
  charged until 2026-09-25; each is charged now, with its waiver as a rule
  (`content/banks-world-fees.ts`). Three waivers are for someone SLATE
  doesn't have (students, state employees), so those fees are charged in
  full; Swedbank Latvia's exemptions weren't confirmed, so it is charged;
  Clarien's age for a senior isn't published, and 65 is SLATE's estimate.
  A rate given for one tier is paid on every balance (Arion's and
  Íslandsbanki's savings name a range whose tiers weren't found). A bank
  or figure the research couldn't find keeps a plain account with no fee
  and no rate. Iceland's savings ledger codes are from weak sources (05 at
  Landsbankinn, 13 at Arion), and none was found for Íslandsbanki.
- **Some overdraft terms are missing a figure.** BNZ charges its unarranged
  overdraft fee, but its interest is a Personal Overdraft Base Rate plus
  10% and BNZ doesn't publish the base, so none is charged. LCL and Crédit
  Agricole don't publish the rate on an unauthorized overdraft, so they
  charge only their €8 commission. An Icelandic account taken below zero
  by a bank fee, with no overdraft arranged, is charged the arranged rate;
  the rate for an unarranged one wasn't found. The Canadian banks sell
  overdraft protection by the month or by the use; SLATE arranges the
  monthly plan only.
- **What follows a charge-off rests on estimates.** A bank closes an
  account left overdrawn for sixty days in a row (SLATE's estimate; a
  French one two months after its notice), and the debt goes to
  collections and costs the record. Since 2026-09-27 a US bank reports it
  to ChexSystems for five years and the next bank reads the report: how
  often one turns it away (85% unpaid, half paid) and the second-chance
  account's $10 a month are SLATE's estimates, since no figure is
  published. France's month's letter and three months' loan offer run; the
  loan is the bank's personal loan at the top of its rates over twelve
  months, SLATE's estimate of the offer, and the solvency check France
  adds from 20 November 2026 isn't made. An account that goes back above
  zero on each payday is never sixty days overdrawn, as at a real bank.
- **Some IBANs outside the thirteen are missing a bank code or a national
  check.** Each is built to its country's registry structure
  (`content/banks-world-iban.ts`): 82 structures, and 321 of 348 banks with
  their own code in place, and since 2026-09-27 Banque Misr's (0002, from
  its own IBAN guide) and Al-Kuraimi's (KRMB, the first letters of its BIC,
  SLATE's estimate). Where a code wasn't found (Burundi, Djibouti, São
  Tomé, Egypt's National Bank and CIB, Yemen's other banks, and a few banks
  elsewhere) that field is drawn: none is published.
  The national check inside the BBAN is built wherever its rule is
  published: Belgium, the French RIB countries, the MOD 97-10 ones
  (Portugal, Serbia, Montenegro, North Macedonia, Slovenia, Timor-Leste,
  Bosnia and Herzegovina, Kosovo) and, since 2026-09-25, Italy and San
  Marino's CIN, Norway, the Czech Republic, Slovakia, Poland, Croatia,
  Estonia, Hungary, Albania and Finland with Åland, each checked against the
  IBAN Registry's example; and since 2026-09-27 Sweden, bank by bank by
  Bankgirot's rules (Swedbank's clearing digit and account by Luhn, SEB's
  and Nordea's by mod 11 over clearing and account, Handelsbanken's by mod
  11 over the account), each against the official examples. Burundi's and
  Djibouti's keys are taken as France's RIB key and São Tomé's as
  Portugal's NIB, SLATE's inference: no rule is published, and each
  registry example checks by it. Denmark with the Faroes and Greenland is
  left with its digits drawn, as no Danish bank publishes a check rule; the
  one that circulates is Norway's. The IBAN's own check always holds.
- **Some cards' terms are SLATE's estimate.** Each bank's card is its own
  (`content/cards.ts`), and the research read 522 of them from the banks'
  terms, a comparison site where the bank's own page was blocked. A bank
  whose card wasn't found (Banorte, ING in Germany, and 326 of the 818
  outside the thirteen), and each term a found card was missing (the
  minimum and the late fee most often), runs on SLATE's estimate of a
  typical American card's, and the bank's screen names which terms are the
  estimate. A charge card that can be spread (Iceland's, Japan's, Korea's,
  Spain's) is a revolving card with autopay on the whole statement. Not
  modeled: Canada's penalty rate after two missed payments in a year (BMO's
  and CIBC's, researched; only the US penalty rate runs, by Reg Z's rules), a late fee set as a share of the payment, Mexico's minimum on
  the limit, and Japan's and Korea's fixed-sum revolving courses. Caps
  left out: Japan's Interest Rate Restriction Act binds cash advances, not
  purchases; Monaco's and Ukraine's figures weren't the law's own; the
  British £12 late fee is regulator guidance, and the United States' after
  2025's ruling wasn't found.
- **Some of what cash costs isn't known.** Another bank's machine's owner
  may add a fee of its own in the US, Canada, Mexico, Britain, Ireland,
  Iceland, France, Germany and Australia; SLATE charges the card's bank's
  fee and says the owner's may come on top, not what it is. A daily limit
  on debit card purchases is published by few of the 60 banks and isn't
  enforced; the daily ATM limit is. A card whose cash advance terms weren't
  found charges SLATE's estimate, 5% or $10 at the purchase rate, and says so.
- **Drama school runs its three years, and the business follows.** A new
  life begins as a first-year actor at the David Geffen School of Drama at
  Yale, ahead of every classmate in craft; classes, work-study, casting,
  Yale Rep and each term's evaluation read and move it (`systems/school.ts`),
  and the showcase, representation, auditions, jobs, pay and the unions
  take it from there (`systems/career.ts`). Until 2026-09-26 nothing
  followed the MFA, only the first spring went to Yale Rep, and later
  years held at 2026–27's costs. What's still open:
  - Yale Rep's seasons after 2026–27 aren't announced: their productions
    are SLATE's estimate by the slots its seasons keep, unnamed.
  - The fifteen classmates are a name and a craft each: they grow, set the
    evaluation's median and the player's place, and since 2026-09-27 show
    beside the player, an agency taking its best two of the class (SLATE's
    estimate). They aren't cast against the player, and don't come to
    anything after school.
  - A student in need's living-expense scholarship, but for its books, is
    income the year's return taxes since 2026-09-27, and the returns begin
    at enrollment. Until then the tax engine collected nothing on it.
  - Later years' dates aren't published; the terms after 2026–27 are
    SLATE's estimate, and their costs grow at the Bulletins' rates.
  - The bachelor's degree the MFA asks for is taken as read, and only the
    birth year is held to it.
- **The business, and what's between jobs.** Built on 2026-09-27 over
  four rounds: Off-Broadway, series regulars, managers, overtime,
  residuals, union health cover, the marketplace, unemployment and the tax
  return; then commercials and voice, location, later seasons, Medicaid,
  the Essential Plan, COBRA, illness and its bills, part-year returns; then
  work abroad, Connecticut's tax, the states' job-expense deductions, meal
  penalties, recurring roles and the 60% rule, conditions carried, the
  pharmacy, the dentist and the optician, and illness at school; then an
  actor's working costs, diabetes and arthritis, insulin's caps,
  stand-alone dental plans, medical prices grown by the index, Yale
  Health's own cost-sharing, Canada's tax on residuals and the UK's April
  tax year. What's still open:
  - Unpublished: Off-Broadway's categories B and C and every 2027–28 rate;
    the Commercials Contracts' third year; animation's 2026 rate; SAG-AFTRA's
    2027 COBRA rate; New York City's exact 2026 benchmark premium;
    California's 2026 flat penalty and standard deduction; the renewal rate
    of freshman streaming series; how often meal penalties come and how long
    a recurring arc runs. Each holds at its last published figure, or is
    SLATE's estimate, and says so.
  - Abroad: Canada's section 216.1 return and the UK's payer-by-payer
    withholding and settlement are built (2026-09-27), with the tax of
    the province the work was done in (British Columbia's, Ontario's and
    its surtax). What's estimated: the 2026 federal and provincial
    brackets held for later years, and a payer's UK total expected at the
    booking's rate. What isn't modeled:
    an FEU8 agreement to withhold less, and the UK allowance's taper,
    which a US citizen never has to reach.
  - The body: obesity isn't modeled, since SLATE keeps no weight. A type
    2 diabetic's test strips aren't, since most on a generic don't test
    daily. Yale Health is taken as a university's own self-funded plan,
    which Connecticut's $25 insulin and $100 supply caps don't bind: a
    secondary source and an inference, SLATE's estimate. Each kind of
    care's own index grows past August 2026 at its 2019–24 rate, SLATE's
    estimate.
  - What the working costs do (a free submission seen half as often,
    four in ten breakdowns asking for a reel, Backstage's and Casting
    Networks' own listings, stale headshots, a kit, a class, a coach) is
    SLATE's estimate: no site publishes what a reel or a subscription is
    worth. Trade papers aren't modeled: what they'd tell an actor, SLATE
    has no news to give.
  - Where a job is seen, how it does, a film's television money and its
    cast's units are SLATE's estimate.
- **Some of pending and holds isn't modeled.** The banks publish the most
  a hold lasts before it's released (CommBank's, NAB's and Westpac NZ's
  ten), not how soon a payment usually posts; SLATE posts one in two
  business days, its estimate, never past the bank's most. Until a played
  career showed London's groceries pending ten days each, it posted every
  payment at the bank's most. France's card holds use the card's spending
  limit rather than the account's balance, and SLATE holds the balance. A
  statement's value date is the day of the payment, which Sabadell's three
  days after it isn't. The US banks' nightly posting orders are on record
  and don't decide anything: an item's fee is charged when it's paid.
- **Some of what fraud costs is an estimate or missing.** A case's size
  runs from a quarter of the country's average to seven quarters, SLATE's
  estimate of the spread. Only Britain publishes the share its banks stop;
  elsewhere none is stopped. Canada, Mexico and New Zealand publish a rate
  but no average case, and Japan and Korea no rate, so nobody there meets
  fraud. France's and New Zealand's rates include more than card fraud. A
  card that isn't reported lost is never lost: no country publishes how
  often. Cards last four years where the bank doesn't say, and a
  replacement takes seven business days, SLATE's estimates.
- **Some of a card's offers aren't modeled.** Since 2026-09-27 a card's
  bonus is paid on groceries and recurring bills, the two things a card
  buys in SLATE, for the seven cards whose bonus names either (Bank of
  America's, RBC's, TD's, Scotiabank's, BMO's, CIBC's, Santander
  Mexico's), read by hand from the bank's words; a bonus on something a
  card doesn't buy here (dining, drugstores, fuel, travel) would pay the
  base rate anyway. Santander Mexico's 4% on telecoms isn't paid, as the
  phone's share of the bills isn't known, and a Korean card's discounts
  on conditions of last month's spending aren't modeled. A plan's fee is the most the bank says it
  charges, not the offer it would make on the day, and plans charged as
  interest (Scotiabank's, Bank of Ireland's, the Spanish banks') aren't
  offered. A money transfer is charged the card's balance transfer rate,
  or its purchase rate where that wasn't found. Introductory rates end
  early only by the US rule; a British or Irish card that withdraws its
  offer for a missed payment keeps it. SLATE holds one card at a time, so
  a balance transfer is made only from the card being replaced, and not
  where the new limit won't take it with its fee.
- **Some of an account's life is SLATE's estimate or missing.** Where a
  bank words its early-withdrawal penalty other than in days of interest
  (a reduced rate in Japan, a rate cut in France, a share in Spain), SLATE
  forfeits the interest so far and says it's an estimate. A bank that has
  its holder choose how a term deposit ends at opening and names no default
  is paid out by default. Korea's banks' lower after-maturity rate is taken
  as the bank's easy-access savings rate. Three banks' maturity terms
  weren't found (Arion, Crédit Agricole, Santander Spain) and pay out. An
  empty, unused account that the bank may close is never closed: the banks
  say they may, not when.
- **The tax engine's property and vehicle rules are read by nothing.** Its
  income and payroll tax is paid again since the career: acting wages are
  withheld through it and each year's return is worked out with it
  (`systems/career.ts`, `systems/taxreturn.ts`), and since 2026-09-27 its
  sales tax is on the goods the work buys, a self-tape kit and headshot
  prints. The day's food is taken as groceries, which the states SLATE
  taxes a life in exempt. Property and vehicles wait for something owned or
  driven.
- **An older save's pension fund is kept, and nothing moves it.** The day
  job paid into one in five countries and it grew daily. Both went with the
  job engine on 2026-09-26. A save from before keeps the fund, and net worth
  counts it; nothing adds to it, grows it or pays it out.
- **Most of the crafts, and five general interests, are said back and
  nothing more.** Creation asks for them and the person look prints them.
  Since 2026-09-27 a day of work reads the genres, Voice Acting, and Film,
  Television, Theater and Travel (`systems/enjoyment.ts`), under the
  owner's rule: mood and stress, never how good anybody is. The other
  crafts are trades an actor's jobs don't do, and Animals, Cars, Fashion,
  Nature and Politics go with nothing a player can do yet.
  `tests/cohesion.test.ts` holds that only that file reads them.
- **The performer title is said back and nothing more.** Actor or actress,
  settled by the pronouns or picked under they/them, and printed on Home, the
  rail and the save slot. It is a word and not a stat, so that is all it
  claims to do, but nothing in the simulation reads it either.
- **`SlateOfficialResult`** and the `recordOfficialResult` function that writes
  it: nothing in the build produces an official result. It's a Base44 entity
  and a deployed function, so taking it out is a deployment and waits for the
  owner. (`search()`, the five record shapes with no table and the history
  categories for systems long gone were taken out on 2026-09-25.)

## Unreachable: correct, and nothing can get there

Nothing, since 2026-09-27. What a bank reads from wages is reached again by
acting pay, and the Decision Center by offers of representation, management
and work and by each year's return.

## Settled on 2026-09-27, by deletion

Each was researched or calibrated and read by nothing, and nothing in SLATE
could read it: each country's deposit guarantee and its central bank's rate
(no bank fails and no rate moves), a sentence on how money moves there and
each country's own names for its ways of paying (`content/banks*.ts`,
`content/payments.ts`), and every hand-calibrated town's film-industry and
job-market ratings (`content/geography.ts`). They are in the history, and
their generators no longer write them.

---

## How to work this page

Take a section, not an item. A section is a coherent piece of work: the
wellbeing model is one system and one question — what should a day of being
tired or well change? — and the reference data is a question about what the
revamp means the game to be about.

And every fix on this page has to be shown to bite, by the standard the page is
written against: move the input, watch the outcome move, and prove the test
would have caught its absence.
