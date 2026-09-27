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
| Personality axes nothing consults | 3 | 7 |

The first two are the player. The family was the only thing that made a person after
boot, so `person` has no `nextId` call and `people` is filled only by
bootstrap, which writes the player by hand. They are counted honestly and they
are not dead words; the tool says so beside the check. The three axes are
openness, extraversion and agreeableness, set on the Dispositions & Traits
step and read by nothing; the step says so, and they are below. Risk
tolerance was a fourth until the card read it, and this table said four
until 2026-09-25.

The tool counts writers. The One Rule asks for readers, which is stricter, so
the true arrears are larger than this table and the rest of this page is the
part the tool cannot see.

---

## Dead: declared, and nothing reads it

- **The wellbeing model decides nothing outside the body and the workout.**
  Every dial now decides something (`tests/wellbeing-bites.test.ts`): fitness
  sets how far rest mends condition and what a workout costs; condition sets
  how much a night puts back, where morale settles, and readiness; morale sets
  how much stress a night clears; hygiene under fifty and hunger under twenty
  wear on the mood; and readiness sets what a workout builds. Eating, a
  shower, a workout and an hour unwinding (`life.look_after`) are how a player
  moves them. But all of that is the body deciding things about the body.
  Readiness had one reader outside it, in the audition room, and the room is
  gone: nothing a character does in the world yet goes better or worse for
  how they are.
- **Until those readers, fitness and morale couldn't be moved.** Fitness
  moved condition only on a body the nights were wearing down: a rested
  night pushed condition to the age's ceiling far faster than fitness's
  drift, so on six- or eight-hour nights eight weeks of workouts left it at
  99.8, trained or not. And morale reached a hundred on any life with decent
  nights and stayed there. Rest mends only as far as fitness lets it now, and
  the nights bring morale back toward where the body has it settle, so on a
  half year of eight-hour nights a player who eats, showers, trains and
  unwinds ends at condition 99.7 and morale 100 against 91 and 85.9 for one who
  only sleeps.
- **Three of the seven dispositions are kept and read by nothing.** Openness
  waits on travel, and extraversion and agreeableness on other people. Risk
  tolerance was a fourth until the card: over 65 it starts autopay on the
  minimum. The Dispositions & Traits step says so beside the sliders, and
  `tools/wired.mjs` counts them.
- **Keeps Accounts is said back and nothing more.** It is about what other
  people owe you, and there are no other people. The other three money traits
  declared no knob while nothing spent; since the household they move what
  food costs (`spending`).
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
- **Most of what a trait's cost says is said back, not charged.** Each is
  written for a whole life, and the game charges only the part its knobs
  reach: stress, sleep, the energy a night puts back, hygiene and mood. Early
  Riser's "No use at all after nine at night", every cost about other people,
  and Resilient's illness and injury are not charged, and Early Riser and a
  few others help and cost nothing in play. The Traits card says so.
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
- **What follows a charge-off is only partly there.** A bank closes an
  account left overdrawn for sixty days in a row (SLATE's estimate), and
  the debt goes to collections and costs the record. A real American bank
  also reports it to ChexSystems, and most banks then won't open an account
  for years; SLATE opens one at the next bank, though not the bank that is
  owed, which won't take them back until it is paid. An account that went
  back above zero on each payday was never sixty days overdrawn, as at a real
  bank, so a life that spent more than it earned could run an overdraft for
  years; with no payday since the job engine went on 2026-09-26, one that
  goes under stays under. France's rule that a bank must offer a loan after three months of
  it isn't modeled.
- **The deposit guarantee and the central bank's rate are shown and change
  nothing.** No bank fails in SLATE, so the guarantee is never called on,
  and no bank's rate is set from the central bank's, which SLATE holds at
  the day the research read it. Both are real, sourced facts on the bank
  screen; neither has anything to bite on until banks can fail or rates
  can move.
- **Some IBANs outside the thirteen are missing a bank code or a national
  check.** Each is built to its country's registry structure
  (`content/banks-world-iban.ts`): 82 structures, and 321 of 348 banks with
  their own code in place. Where a code wasn't found (Burundi, Djibouti,
  Egypt, Yemen, São Tomé, and a few banks elsewhere) that field is drawn.
  The national check inside the BBAN is built wherever its rule is
  published: Belgium, the French RIB countries, the MOD 97-10 ones
  (Portugal, Serbia, Montenegro, North Macedonia, Slovenia, Timor-Leste,
  Bosnia and Herzegovina, Kosovo) and, since 2026-09-25, Italy and San
  Marino's CIN, Norway, the Czech Republic, Slovakia, Poland, Croatia,
  Estonia, Hungary, Albania and Finland with Åland, each checked against the
  IBAN Registry's example. Three are left with the digits drawn: Sweden,
  whose check depends on each bank's account type; Denmark with the Faroes
  and Greenland, whose check is set bank by bank; and São Tomé, whose rule
  isn't published and whose registry example and a live central-bank IBAN
  disagree. The IBAN's own check always holds.
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
    evaluation's median and the player's place, and do nothing else, and
    they aren't at the showcase against the player.
  - A student in need is paid a living-expense scholarship that's taxable
    income in the US, and the tax engine collects nothing. The player's
    family rules need out, so their life isn't touched by it.
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
  - Abroad: Canada's elective return and graduated rates, and the UK's
    personal allowance and its payer-by-payer withholding, aren't modeled.
  - The body: obesity isn't modeled, since SLATE keeps no weight; a
    diabetic's supplies and monitors, and Connecticut's $25 insulin cap
    (whether Yale's plan is bound by it is unpublished), aren't either.
    Medical prices grow by one index for all care, not the BLS's own for
    hospitals, doctors, dentists and drugs. Yale's $1,000 cap on
    admission copays isn't kept, since it takes five stays in a year.
  - What the working costs do (a free submission seen half as often,
    Backstage's five more, stale headshots, a kit, a class, a coach) is
    SLATE's estimate; Casting Networks, reels and trade papers aren't
    modeled.
  - A return's states: New York's days-worked allocation inside a job
    isn't counted.
  - Where a job is seen, how it does, a film's television money and its
    cast's units are SLATE's estimate.
- **Some of the banks' research is kept and read by nothing.** Each
  country's deposit guarantee, its central bank's rate, a sentence on how
  money moves there, and the local names for its ways of paying came off
  the bank's screen on 2026-09-26: no bank fails, no rate follows the
  central bank's, and the sentences named ways of paying SLATE doesn't
  have (Zelle, Interac, SPEI, money orders). They wait for what would read
  them.
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
- **Some of a card's offers aren't modeled.** A card's bonus reward
  categories are shown in the bank's words and not paid; SLATE pays the
  base rate on everything. A plan's fee is the most the bank says it
  charges, not the offer it would make on the day, and plans charged as
  interest (Scotiabank's, Bank of Ireland's, the Spanish banks') aren't
  offered. A money transfer is charged the card's balance transfer rate,
  or its purchase rate where that wasn't found. Introductory rates end
  early only by the US rule; a British or Irish card that withdraws its
  offer for a missed payment keeps it. SLATE holds one card at a time, so
  a balance transfer is made only from the card being replaced, and not
  where the new limit won't take it with its fee.
- **NatWest's fixed-term savings asks 35 days' notice to close early.**
  SLATE breaks it at once for its penalty.
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
- **The tax engine is a screen again.** `content/tax.ts` works out income
  and payroll tax on a wage for the place card and Home's Tax On A Wage, and
  nothing is paid through it. The day job withheld through it outside the
  thirteen until 2026-09-26, when the job engine went; its sales, property
  and vehicle rules were read by nothing before that, because nothing is
  bought, owned or driven.
- **An older save's pension fund is kept, and nothing moves it.** The day
  job paid into one in five countries and it grew daily. Both went with the
  job engine on 2026-09-26. A save from before keeps the fund, and net worth
  counts it; nothing adds to it, grows it or pays it out.
- **The gazetteer still carries the film calibration.** Every hand-calibrated
  city has an `industryPresence` figure, and the place card and Home print it
  as Film and Television work. Nothing else reads it. It is reference data, so
  it stayed through the revamp; the revamp decides whether it keeps a reader or
  goes.
- **The crafts and the genres are said back and nothing more.** Creation asks
  for them and the person look prints them, which is what keeps them from being
  a question with no answer. Nothing in the simulation reads either, and
  `tests/cohesion.test.ts` holds that nothing starts to without saying so. The
  general interests are read since 2026-09-24, by `systems/enjoyment.ts`
  alone: Cooking, Fitness, Sport and the evening pastimes lift the mood and
  ease the stress of the hour they go with, and never make anybody better at
  anything. The rest of the general interests (Animals, Cars, Fashion, Nature,
  Politics, Travel) go with nothing a player can do yet.
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

- **What a bank reads from wages.** A fee waived for wages paid in, a
  lender's check for a salary, and New Zealand's interest tax set by the
  saver's income all read the wages the ledger holds (`systems/banking.ts`,
  `systems/lending.ts`). Nothing has paid wages since the job engine went on
  2026-09-26, so a new life never meets them; a save from before has a year
  of them at most. `tests/banking.test.ts` and `tests/bank-fees.test.ts`
  post wages by hand to hold them.

- **The Decision Center has nothing to decide.** Answering, dismissing, closing
  on a date and forgetting are all built and held by `tests/smoke.test.ts`, which
  raises a row by hand. The one thing that raised a row on its own was the
  reimbursement on the family's pictures, and it went with them.

---

## How to work this page

Take a section, not an item. A section is a coherent piece of work: the
wellbeing model is one system and one question — what should a day of being
tired or well change? — and the reference data is a question about what the
revamp means the game to be about.

And every fix on this page has to be shown to bite, by the standard the page is
written against: move the input, watch the outcome move, and prove the test
would have caught its absence.
