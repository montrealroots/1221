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
  wages are real and sourced (`content/wages.ts`).
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
  owed, which won't take them back until it is paid. An account that goes back
  above zero on each payday is never sixty days overdrawn, as at a real
  bank, so a life that spends more than it earns can run an overdraft for
  years. France's rule that a bank must offer a loan after three months of
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
- **The tax engine taxes wages only outside the thirteen.** It was a screen,
  read only by the place card, until the day job withheld through it. Since
  2026-09-25 the thirteen countries' payslips are their own
  (`content/payroll.ts`), and the engine's approximation is the payslip
  everywhere else, and for US states and Canadian provinces the research
  didn't cover. Its sales, property and vehicle rules are still read by
  nothing, because nothing is bought, owned or driven.
- **The year is settled in ten of the thirteen, and not yet in France,
  Mexico or Australia.** Since 2026-09-25 each payday's withholding is
  settled after the tax year (`systems/taxreturn.ts`) on the country's
  own date: the year's real tax on its real pay, the benefit taxed where the
  law taxes it, and the credits a low wage gets only there: the US earned
  income tax credit, with New York's 30% of it less its household credit,
  California's own off its table and Illinois's 20%; the Canada Workers
  Benefit, Ontario's LIFT credit, British Columbia's tax reduction and
  Quebec's work premium; Ireland's rent credit; Spain's minimum-wage
  deduction; New Zealand's independent earner credit; and Korea's year-end
  settlement with February's pay and its earned income credit (근로장려금)
  paid at the end of September, which SLATE applies for on the player's
  behalf. Not modeled: Washington's Working Families Tax Credit, a separate
  application; the Canada Workers Benefit in Quebec, whose own figures
  weren't found, so a Quebec worker gets the work premium alone; British
  Columbia's renter's and sales tax credits; the Canada Workers Benefit's
  advance payments; New York City's own earned income credit; and the
  unemployment benefit's tax outside the US federal return and New York's
  and Illinois's, Canada, Britain's JSA, Ireland, Spain and New Zealand,
  with Germany's raising the rate. Canada's, Ireland's, New Zealand's, Germany's, Spain's and Japan's
  final-return dates are SLATE's estimates where the office names none.
  Church tax in Germany isn't taken, since SLATE doesn't know a character's
  church. Japan's contributions are on the grade of standard remuneration
  the month's pay falls in (Kyōkai Kenpo Tokyo's fiscal 2026 table), set
  from the pay each payday rather than fixed at hiring and each summer.
- **A pension fund grows in five countries and pays nothing out.** What a
  payslip puts into a fund the worker owns (Iceland, New Zealand, Australia,
  Britain, Ireland, Mexico) is theirs and counts in their worth. Since
  2026-09-25 each grows every month by a twelfth of its last published
  year's return (`FUND_RETURNS`): a real return for Iceland, nominal ones
  for the rest, which run ahead of SLATE's prices, since those don't rise.
  Britain's is Nest's, the default scheme, and New Zealand's one default
  provider's (Fisher Funds), after tax at the top rate. Ireland's My Future
  Fund, new in 2026, has published none, so it doesn't grow. Nothing pays a
  fund out, since nobody in SLATE has retired.
- **Some of what employment law gives isn't modeled.** The law where a
  job is (`content/labor.ts`) pays its premiums, overtime, leave, sick
  pay, extra payments, Korea's rest day and severance, and asks its notice;
  since 2026-09-25 a job is also cut, as often as the BLS counts in the US
  and the ONS in Britain (Britain's rate stands in everywhere else, SLATE's
  estimate), with the employer's notice and the redundancy pay the law
  gives. Germany keeps shops, offices and building sites off on Sundays and
  public holidays (ArbZG §9 and §10; Berlin's shop-opening law §3 closes
  shops on both), working a Sunday shift on a free weekday and paying a
  holiday as if worked (EFZG §2); the other lines work them, and which of
  those §10 allows beyond restaurants, care and security wasn't settled.
  Elsewhere a holiday is worked where it's
  rostered, with its premium, so Ireland's and New Zealand's pay for a
  holiday not worked has nothing to pay. Mexico's PTU profit share needs a
  company's profit. Youth rates are Britain's and Ireland's by age, New
  Zealand's starting-out rate and France's reduced SMIC by age and months
  with the employer (France's counts months in the line of work, which SLATE
  takes as months with the employer), and Australia's juniors by the General
  Retail and Fitness awards' shares; the other awards' junior rates weren't
  in the research. New Zealand's alternative holiday for a holiday worked is
  added to the leave to book. The US rate is
  layoffs and discharges together, as JOLTS doesn't part them, so it runs
  above layoffs alone. Iceland's longer notice for older workers, Mexico's
  cap on the seniority premium at twice the minimum wage, Germany's
  optional half a month a year under §1a KSchG, and the tax-free share of
  redundancy pay outside Britain and Ireland aren't modeled; France's
  notice before six months is the common agreement's week. Premiums are the agreement's where
  the research found one: Iceland's Efling–SA tables for café, bar and
  security work and VR–SA's for shop and office work (Commerce Day, a VR
  major holiday, isn't in the shared list); Australia's awards by line on a
  Sunday, and for weekday evenings and nights in fast food, retail, security
  and hospitality, whose late hours are paid in dollars; casual loadings
  aren't, as SLATE's jobs aren't casual. Japan's leave is granted at six
  months and each year after by the MHLW's table, for 80% of the shifts
  attended; the employer's duty to see five days taken isn't modeled. Untaken
  leave lapses by the law in Britain, Ireland and Japan, and is paid out in
  Korea; elsewhere it piles up (Germany's turns on whether the employer
  reminded the worker, and France's and Spain's rules weren't found at a
  source SLATE could reach).
- **Unemployment benefit is the thirteen's, from the record SLATE keeps.**
  Out of work, a claim (`work.claim`, `systems/unemployment.ts`) pays
  the country's benefit by its own formula (`content/unemployment.ts`),
  from each payday's hours and pay since the save began; a character's work
  before it isn't known, so in a save's first year or two many don't
  qualify, as a new entrant wouldn't: Ireland's pay-related benefit and
  Britain's New Style JSA need two years' contributions, and Britain's
  claim falls to Universal Credit. Not modeled: Ireland's means-tested
  Jobseeker's Allowance; Australia's waiting periods, assets test and what
  quitting costs (Services Australia's pages couldn't be reached), and its
  Youth Allowance under 22; Japan's days for somebody quitting after
  April 2025 are the month the research found, unconfirmed; New York's
  high-quarter test is at the state's $16 minimum, not New York City's $17;
  Britain's National Insurance test is at 2024/25's lower earnings limit;
  the regional rate Canada's EI is worked at is September 2026's for all
  three provinces; family supplements and a partner's income; and a
  benefit is taxed only when the year is settled, not as it's paid. Being let go for
  missed shifts is held to be misconduct in the US states whose pages are
  silent on absence. Only the US states the research covered have a
  benefit: New York, California, Texas, Florida, Washington, Illinois and
  Georgia.
- **Work outside the thirteen is simpler, and some of it is missing.** The
  world research (`content/work-world.ts`, 226 countries and territories,
  written when the session's web searches had run out, so from pages fetched
  directly) found 182 minimum wages, 214 paydays, 169 payslips and 181
  statutory leave allowances, and 1,068 employers, almost none of which
  publish a rate: those pay the floor times the job's premium, SLATE's
  estimate. A payslip there is the employee's contributions and one income
  tax scale, without the credits and exemptions the thirteen's have. Every
  figure the research said it recalled, didn't check, or took from general
  knowledge was left out (70 of them), as were tax tables brackets can't
  state (Angola's, El Salvador's), scales missing the credits that make a
  low wage's tax (Sweden, Slovenia, the Netherlands, Turkey's minimum-wage
  exemption), and nominal minimums (Georgia's, Uganda's). Those countries
  have no payslip: their pay is shown before tax, and the work screen says
  so. Brazil's table may predate its 2026 exemption up to R$5,000 a month,
  which a minimum wage is under either way. About 70 of these currencies
  have no exchange rate in SLATE, which matters only to a life that moves
  between currencies. Only annual leave is modeled of these countries' law.
- **An employer's pay is as published in September 2026.** Each rate is
  the one the research found on 2026-09-25, paid from the save's first day,
  so a save that starts in January is paid an April raise early. Where an
  employer publishes none, the occupation's typical pay is used, which is a
  median and runs above what a new hire is paid. Korea's construction,
  New Zealand's office and construction, and some other lines have no
  employer on record, and those pay the typical rate or the estimate.
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
