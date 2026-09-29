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
- **A few words of the traits' costs are said back.** Each is written for
  a whole life, and since 2026-09-27 the game charges every part of it that
  touches something it has: stress, sleep, the energy a night puts back and
  a night away (Homebody, Restless), hygiene, mood, illness (Resilient), an
  early call or a late performance (Night Owl, Early Riser) and the receipts
  a return can deduct (Keeps Accounts, Chaotic). What they said about other
  people was said back until 2026-09-28, when the classmates were there to
  read it: how fast a bond grows (`bondWarmth`: Even Tempered, Disciplined,
  Independent and Guarded slower, Generous and An Open Book faster), how hard
  a slight cuts (`bondWound`: Quick Tempered, Holds Grudges and An Open Book
  deeper, Loyal, Peacemaker and Forgiving less), and what friends in a cast
  are worth, and none (`company`: Needs People and Guarded more, Independent
  less). How much each is is SLATE's estimate. What's left: a visitor seeing
  the mess (Chaotic), people slept through (Sleeps Anywhere) and others
  keeping accounts about you (Keeps Accounts), since nobody visits, sleeps
  beside or owes the player. Injury, which SLATE didn't model, has been
  since 2026-09-28 (`systems/injury.ts`).
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
  full. Since 2026-09-28 Swedbank Latvia's is its price list's, EUR 1.70 and
  free under 26 (it had been EUR 2.00 to everyone), and Arion's and
  Íslandsbanki's savings pay by their rate tables' tiers. Clarien's age for
  a senior is in none of its fee schedule, terms or account pages (checked
  2026-09-28), and 65 is SLATE's estimate. A bank or figure the research
  couldn't find keeps a plain account with no fee and no rate. Iceland's
  savings ledger codes are from weak sources (05 at Landsbankinn, 13 at
  Arion), none was found for Íslandsbanki, and none of the three banks
  publishes them.
- **One overdraft rate is missing.** BNZ charges its unarranged overdraft
  fee, but its interest is a Personal Overdraft Base Rate plus 10%, and BNZ
  publishes the base in none of its fee guide, overdraft pages or terms
  (checked 2026-09-28), so none is charged. Since 2026-09-28: LCL's
  unauthorized overdraft is charged the 21.02% of its own tariff guide, and
  Crédit Agricole's the usury ceiling it charges by law, 23.39% (July
  2025's, the latest SLATE has); and a Canadian overdraft can be paid for by the use where TD, Scotiabank, BMO
  and CIBC sell it so ($5, once a day at TD and CIBC), RBC selling only the
  month. An Icelandic account taken below zero by a bank fee, with no
  overdraft arranged, is charged the arranged rate: none of the three banks
  publishes a rate for an unarranged overdraft, only a flat fee on a debit
  posted without funds (Landsbankinn's 900 kr to 2,600 kr by its size), and
  SLATE's Icelandic banks decline any debit that would do that, as their
  card and bill payments do.
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
  check.** Checked again on 2026-09-28: no bank or central bank publishes
  them, and the IBAN Registry's examples name no bank. Each is built to its country's registry structure
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
  left with its digits drawn, as no Danish bank publishes a check rule (and
  Oracle's validation spec says there is none); the one that circulates is
  Norway's. Yemen has used IBANs since December 2024, by the Central Bank in
  Aden's announcement. The IBAN's own check always holds.
- **Some cards' terms are SLATE's estimate.** Each bank's card is its own
  (`content/cards.ts`), and the research read 522 of them from the banks'
  terms, a comparison site where the bank's own page was blocked. A bank
  whose card wasn't found (Banorte, ING in Germany, and 326 of the 818
  outside the thirteen), and each term a found card was missing (the
  minimum and the late fee most often), runs on SLATE's estimate of a
  typical American card's, and the bank's screen names which terms are the
  estimate. A charge card that can be spread (Iceland's, Japan's, Korea's,
  Spain's) is a revolving card with autopay on the whole statement. Since
  2026-09-27 Canada's penalty rates run (RBC's, BMO's and CIBC's, after two
  missed minimums in twelve months; twelve on time takes them off, which is
  SLATE's estimate for RBC), as do the late fees 31 banks set as a share of
  the minimum, the balance or what went unpaid (`content/latefees.ts`),
  Citi's lower first late fee, and Mexico's minimum of 1.25% of the limit.
  Banks whose late fee is a share of nothing the terms name (Equity and
  NCBA in Kenya, QNB, Republic Bank Suriname, Absa Uganda, Bank of Bhutan)
  keep a flat figure or SLATE's estimate. Since 2026-09-28 a revolving
  course asks its bank's own minimum (`content/revolving.ts`): MUFG's ¥5,000
  a ¥100,000, SMBC's ¥5,000 of principal and the interest, Shinhan's and KB
  Kookmin's 10% to 30% by the credit grade, where the grades fall against
  SLATE's record being its estimate; the other Japanese cards' courses
  weren't read and ask the estimated minimum. Caps left out: Japan's Interest Rate
  Restriction Act binds cash advances, not purchases; Monaco's and
  Ukraine's figures weren't the law's own; the British £12 late fee is the
  OFT's 2006 threshold of intervention, not a cap. Since 2026-09-28 every US
  card is held to the Reg Z safe harbor, $30 a first late fee and $41 a
  repeat within six cycles, the CFPB's $8 rule having been vacated in April
  2025.
- **Some of what cash costs isn't known.** Another bank's machine's owner
  may add a fee of its own; since 2026-09-28 it's charged at the published
  average in the US ($3.22, Bankrate 2025) and Australia (A$2.63, the RBA's
  last, 2017). Elsewhere no average is published (Canada's regulator gives
  $1.50 to $5.00, LINK only that a fifth of Britain's machines charge), and
  SLATE charges the card's bank's fee and says the owner's may come on top,
  not what it is. A daily limit
  on debit card purchases is published by few of the 60 banks (Chase's,
  Citi's and Capital One's $5,000; none of Britain's or Canada's) and
  isn't enforced, since SLATE's debit card buys only the day's food, which
  no limit reaches; the daily ATM limit is. A card whose cash advance terms weren't
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
    estimate). This said they weren't cast against the player and came to
    nothing after school; since 2026-09-28 they work, are in the room for
    the player's auditions and make the trades (`systems/rivals.ts`), and a
    part one takes from the other sets them apart as a lead taken at school
    does. Since that day each has a presence of their own, drawn as the
    player's is, where every one had been read at an ordinary 50.
  - A student in need's living-expense scholarship, but for its books, is
    income the year's return taxes since 2026-09-27, and the returns begin
    at enrollment. Until then the tax engine collected nothing on it.
  - Later years' dates aren't published; the terms after 2026–27 are
    SLATE's estimate, and their costs grow at the Bulletins' rates.
  - The bachelor's degree the MFA asks for is taken as read, and only the
    birth year is held to it.
  - A student ending the last term on concern or warning still takes the
    degree, SLATE conferring it on any standing short of dismissal, which
    the Standing tab says. The Bulletin (2026–27) sets no bar either: the
    degree goes by the faculty's vote to those who complete the program,
    and a warning not remedied in its time "may lead to dismissal". Whether
    the faculty would vote it is SLATE's reading.
  - How often an understudy is sent on is SLATE's estimate; since
    2026-09-27 a night on call holds the evening on the calendar and is
    called off when not needed.
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
  - Unpublished: Off-Broadway's categories B and C and every 2027–28 rate
    (Equity keeps the rulebook behind its members' portal); animation's
    rate from July 2026, the successor agreement's tables not yet out;
    SAG-AFTRA's 2027 COBRA rate (its Board set only 2027's earned
    eligibility premiums in August); New York City's exact 2026 benchmark
    premium (NY State of Health posts it with the year's 1095-A forms; 2025's
    was $880.24, and the state approved 7.1% more on average for 2026);
    California's 2026 flat penalty and standard deduction, which the FTB
    hadn't published by 28 September 2026; how
    often meal penalties come and how long a recurring arc runs. Each holds
    at its last published figure, or is SLATE's estimate, and says so. Since
    2026-09-28 the Commercials Contracts' third year is the contract's
    ratified 3% on the second's, its rate sheet not yet out, and a new
    streaming series is renewed at the middle of Luminate's 48% to 55%.
  - Abroad: Canada's section 216.1 return and the UK's payer-by-payer
    withholding and settlement are built (2026-09-27), with the tax of
    the province the work was done in (British Columbia's, Ontario's and
    its surtax). What's estimated: the 2026 federal and provincial
    brackets held for later years, and a payer's UK total expected at the
    booking's rate. Since 2026-09-28 a job in Canada can have Form T1287
    filed for it before the work, and the producer withholds the
    election's tax on its net instead of 23%; and a British or EEA citizen
    keeps the UK's personal allowance, tapered past £100,000, a US citizen
    having none, as HMRC's treaty list says.
  - The body: since 2026-09-28 a body has a height and a weight, and the
    weight follows what's eaten against what's spent (see "A body is partly
    SLATE's estimate"). A type
    2 diabetic's test strips aren't bought, as the ADA's Standards of Care
    (2026) don't advise routine testing for someone not on insulin, and
    about one in seven buys enough to test twice a day (JAMA Internal
    Medicine, 2018). Yale Health is taken as a university's own self-funded plan,
    which Connecticut's $25 insulin and $100 supply caps don't bind: a
    secondary source and an inference, SLATE's estimate. Each kind of
    care's own index grows past August 2026 at its 2019–24 rate, SLATE's
    estimate.
  - What the working costs do (a free submission seen half as often,
    four in ten breakdowns asking for a reel, Backstage's and Casting
    Networks' own listings, stale headshots, a kit, a class, a coach) is
    SLATE's estimate: no site publishes what a reel or a subscription is
    worth. The trade news of the class after Yale (Deadline and Playbill
    on a classmate's booking, `systems/rivals.ts`) is shown on the Career
    screen, and since 2026-09-28 a friend's booking lifts the mood and a
    rival's stings (`RIVALS.friendNews`, `rivalNews`).
  - Where a job is seen, how it does, a film's television money and its
    cast's units are SLATE's estimate.
  - Connecticut (2026-09-27): unemployment, HUSKY D, Covered Connecticut
    and Access Health CT are built. What's estimated: New Haven's 2026 and
    2027 benchmark premiums, grown from 2025's published grid, and 2027's
    $45 minimum benefit, by the statute's index. Since 2026-09-28 the
    state's 2026 Temporary Premium Assistance is on the return: what the
    expired enhanced credits would have paid, in full from 100% to 200% of
    the poverty line and half over 400% to 500%; it's 2026's only, and no
    2027 design is published. Since that day a claim is filed with the
    state the base period's wages were mostly earned in, as an interstate
    claim is, and where the claimant lives only when that state isn't one
    SLATE pays in or the wages predate their state being kept. And a
    Connecticut patient's hospital bill takes Yale New Haven's own charity:
    free to 250% of the poverty line, 67% off to 550%, for the uninsured,
    as a hospital screens a patient paying for themselves, and for an
    insured one on an application before the bill is due (Apply For
    Assistance), as the policy asks.
- **Some of pending and holds isn't modeled.** The banks publish the most
  a hold lasts before it's released (CommBank's, NAB's and Westpac NZ's
  ten), not how soon a payment usually posts; SLATE posts one in two
  business days, its estimate, never past the bank's most. Until a played
  career showed London's groceries pending ten days each, it posted every
  payment at the bank's most. Settled on 2026-09-27: a French standard
  debit card pays against its payment ceiling, not the balance, and past
  it declines (`FRENCH_CARDS`; LCL's and Société Générale's are set in
  each contract, and SLATE takes their floors, its estimate); Sabadell's
  three-day value date is its BS Card Mastercard's, a card SLATE doesn't
  issue, and its debit card's is the purchase day, as SLATE's statement
  has it; and the US banks' posting order decides the order of items at
  the same moment (Wells Fargo's lowest first, so the month's bills before
  the rent), with their small-item waivers (Chase's $5, Wells Fargo's $10,
  Bank of America's $1) and Bank of America's two fees a day. What's left:
  a French card's withdrawal ceilings, and the order of checks by number
  at Bank of America, which SLATE's one check a month never tests. Since
  2026-09-27 a card's bank holds back the credit a payment from another
  bank frees for its published days (Chase's 15, Capital One's 9, CIBC's
  7, TD's and Scotiabank's 5, SMBC's 2); a payment from its own bank isn't
  held, which is SLATE's reading of "up to".
- **Some of what fraud costs is an estimate or missing.** A case's size
  runs from a quarter of the country's average to seven quarters, SLATE's
  estimate of the spread. Only Britain publishes the share its banks stop;
  elsewhere none is stopped. Since 2026-09-28 Mexico's average case is
  CONDUSEF's 2025 claims of possible fraud, MXN 4,285 a claim, and fraud is
  met there. Canada and New Zealand publish a rate but no average case
  (Canada's regulator only that 36% of Canadians said in 2024 they'd had a
  card number misused, over no stated period; New Zealand's banks only
  card fraud and account takeover together), and Japan and Korea no case
  count to divide their losses by (Japan's ¥51 billion in 2025 over 320
  million cards), so nobody there meets fraud. France's and New Zealand's rates include more than card fraud. A
  card that isn't reported lost is never lost: no country publishes how
  often. Cards last four years where the bank doesn't say, and a
  replacement takes seven business days, SLATE's estimates.
- **Some of a card's offers aren't modeled.** Since 2026-09-27 a card's
  bonus is paid on groceries and recurring bills, the two things a card
  buys in SLATE, for the seven cards whose bonus names either (Bank of
  America's, RBC's, TD's, Scotiabank's, BMO's, CIBC's, Santander
  Mexico's), read by hand from the bank's words; a bonus on something a
  card doesn't buy here (dining, drugstores, fuel, travel) would pay the
  base rate anyway. Since 2026-09-28 Santander Mexico's 4% on telecoms is
  paid on the phone and internet's share of the bills, INEGI's 4.8 of 19.5
  of what isn't energy. Since that day a Korean card's discount on the
  phone bill is paid as its terms tie it to last month's spending: KB's My
  WE:SH 10% to ₩5,000 after a ₩400,000 month, Shinhan's 처음 10% in points
  to 5,000, 10,000 or 20,000 after ₩300,000, ₩500,000 or ₩1,000,000, on
  Korea's phone and internet share of the bills (the National Data Office's
  2025 survey). Their other categories (restaurants, convenience stores,
  streaming) are things SLATE's card doesn't buy. A
  plan's fee is the most the bank says it charges, not the offer it would
  make on the day; since 2026-09-28 plans charged as interest or a fee by
  their length are offered at the banks' own terms (`content/plans.ts`):
  Bank of Ireland's, Scotiabank's, CaixaBank's and BBVA's, Santander
  Spain's rate not being on its page. A money transfer is charged the card's balance transfer rate,
  or its purchase rate where that wasn't found. Introductory rates end
  early by the US rule and, since 2026-09-28, at Barclaycard's one missed
  minimum, as its terms say; Bank of Ireland's terms have no such clause,
  and the other British and Irish cards' weren't read for it. Until 2026-09-28 SLATE held one
  card at a time; now a person holds one from each bank in the country
  that issues one, each with its own statement, due date, minimum, plans,
  transfers and rewards, the day's spending on the everyday card, and the
  record reading what's used of all their limits together. A balance
  transfer moves the balance of a card held at another bank, and isn't
  made where the new limit won't take it with its fee. SLATE's estimates:
  that a month paid as agreed counts once however many cards report it,
  each a share, while a late payment on any card is the whole mark (the
  scoring models aren't published); and one card from each bank, since
  SLATE has each bank's one card. Not modeled: the length of the credit
  history a new card shortens, and an issuer's own limits on how many
  cards it opens in a year.
- **Some of an account's life is SLATE's estimate or missing.** Where a
  bank words its early-withdrawal penalty other than in days of interest
  (a rate cut in France, a share in Spain), SLATE forfeits the interest so
  far and says it's an estimate; Spanish law caps a penalty at the interest
  earned (Banco de España), so there it's the most a bank may take. Since
  2026-09-28 MUFG's is its own rule, the ordinary deposit's rate in the
  first six months and 70% of the posted rate after, never below it. A bank that has
  its holder choose how a term deposit ends at opening and names no default
  is paid out by default. Korea's banks' lower after-maturity rate is taken
  as the bank's easy-access savings rate. Three banks' maturity terms
  weren't found (Arion, Crédit Agricole, Santander Spain) and pay out. An
  empty, unused account that the bank may close is never closed: the banks
  say they may, not when.
- **The attributes’ scales are SLATE’s estimates.** Presence,
  composure, reputation and recognition (`systems/attributes.ts`, since
  2026-09-27) each change an outcome, and every figure in them is SLATE’s:
  the trades publish no scale for an actor’s presence, nerves, standing or
  name value. Presence is drawn once and grows only slowly; how much it moves
  an audition (six points of a part’s bar at the extremes, half on tape) and
  a showing (a fifth of it) is an estimate. Nerves are read before auditions,
  performances, the showcase and days on set, not before classes, rehearsals
  or the booth. Since 2026-09-28 recognition comes when the work is seen,
  by its audience (`FILM_ROAD`): television when it airs, a network or a
  streaming service by its size, a hit twice; a film at its premiere or its
  release. How much each audience is worth is SLATE's estimate, and a show's
  ratings aren't modeled, only its outlet and whether it's a hit. The
  overscale recognition earns is a single multiple of scale, not a
  negotiated quote. Of other people's attributes only the classmates'
  presence is kept, drawn as the player's is, since 2026-09-28; until then
  they were read at an ordinary 50. The ways to build them on purpose (an improv course, a casting
  director workshop, a publicist, a festival premiere) are priced at SLATE’s
  estimate of what the trade quotes, and what each adds is SLATE’s. An
  independent film gets into Tribeca one time in five, and half the rest
  play the Brooklyn Film Festival; the others go straight to streaming, all
  SLATE's estimate. Until 2026-09-28 every film premiered at Tribeca.
- **The 21 skills' weights are SLATE's estimates.** The skills themselves are
  the conservatories' and the business's (`content/school.ts`, since
  2026-09-27), and each is read by an outcome. What isn't published: how much
  each part reads each skill (`READS`, `GENRE_READS`), the fifth an
  audition reads its own, which skills each Yale course trains, read from its
  title and description, and the scale. Voice-over has no course at Yale, and
  grows only in the booth. A genre is read, and since 2026-09-28 a part's own
  demands as a breakdown names them (a song, a fight, a dance, an accent, an
  intimate scene; `PART_DEMANDS`), read at the audition and grown on the
  job; how often a breakdown asks each is SLATE's estimate. Nobody's skills
  but the player's and the classmates' are kept.
- **How far an actor grows is fitted, and partly SLATE's estimate.** Since
  2026-09-28 each skill grows toward where it began and 26 points more
  (`CEILING` in `systems/school.ts`), the headroom fitted so that experience
  correlates .49 with skill in the first three years and .15 past twelve, as
  McDaniel, Schmidt and Hunter found across 16,058 workers (1988); it agrees
  with practice explaining about a fifth of performance in the performing
  arts (Macnamara, Hambrick and Oswald, 2014). SLATE's estimates: the 0-100
  scale itself and a session's rate, which no study measures in points; the
  population the fit is drawn over (SLATE's own admits, a lognormal spread of
  work); and a save from before, whose skills keep their levels and grow to
  the average admit's ceiling, 74, at most.
- **Parts past sixty are partly SLATE's estimate.** Since 2026-09-28 a part
  drawn for an actor sixty or older is kept at the share of parts written for
  that age (`AGE_ON_SCREEN`): film 0.48 and television 0.42 of a younger
  actor's, from USC Annenberg's counts of speaking characters (10.7% of the
  100 top films of 2016, 9.4% of the most popular series of 2016-17, against
  19.9% of the population). SLATE's estimates: the stage and on-camera
  commercials take the two's middle, a voice isn't thinned, and the share
  holds past eighty; none of these is counted apart in anything published.
- **An agency's renewal is SLATE's choice.** Rule 16(g) sets the term (a year,
  then up to three) and when a renewal may be signed, and SLATE follows it
  (`AGENCY_TERM`). Whether an agency offers to renew is its own business,
  and SLATE has it renew a client it booked work for in the term and let the
  rest run out. Since 2026-09-28 a commercial agent can be signed beside the
  theatrical one (`systems/commercial.ts`), left on the commercials
  contract's own rule ($4,000 from commercials in 91 days); which agencies
  sign whom, how many auditions each sends and its renewal are SLATE's
  estimate.
- **The weather decides the bills' energy and the flu's weeks, and nothing
  else.** Since 2026-09-27 (`systems/seasons.ts`), a month's bills carry its
  heating and cooling by the home's degree days, from the EIA's 2020 survey,
  and the flu comes in the town's cold weeks, or its wet ones where it's warm
  all year, keeping its 8.9% a year (Tamerius et al., 2013). Holidays that
  day too: the Federal Reserve's by a US bank's business days and
  SAG-AFTRA's by a shoot (`content/usholidays.ts`), and since 2026-09-28
  every other bank's by its country's and its customer's region's public
  and bank holidays (`content/bankdays.ts`), from the holiday files a save
  now loads with its places; a country whose file can't be fetched keeps
  weekends only. Since that day a US town's year of energy is its state's
  household spending against the nation's (the EIA's RECS 2020, Table
  CE3.6.ST), and air conditioning's ownership by country is each home's
  own (`content/homes.ts`), read by its bills. What's estimated: the
  energy share of SLATE's bills and the degree-day rates outside the US.
  What isn't modeled: a year's energy by the climate outside the US (a
  Reykjavík flat costs what a Los Angeles one does in a year, only paid in
  other months), since SLATE's climate normals miss measured degree days by
  too much to price, Los Angeles's 1,025 cooling to ASHRAE's 373; and
  humidity, which Minor et al. (2022) found shortens sleep at its highs and
  more at its lows, but put no figure to.
- **Some of the machinery is built and nothing in play uses it.** Found
  by the dead-word audit of 2026-09-27; what was plainly dead went that day
  (six preferences, `Booking.weeksPaid`, the rail's locked path, the
  place profile's weather, and about thirty helpers used nowhere), and
  these are kept, each with its reason:
  - Settled later that day: the scheduler's recurrences and the engine's
    command receipts went (the server's save key, which a retry needs,
    stays); a loan's term, a hardship plan's start, a penalty's notice, a
    home's date, a claim's base period and close, an evaluation's reason,
    a return's income tax and interest, the pronouns and the citizenship,
    and a calendar entry's booking and settling are shown; a casting's term
    decides whether the Casting tab shows it; and the save's
    `migrationInProgress`, `backupAvailable` and `lastPlayedAt`, a
    transaction's references, an option's booking, the school's id and a
    fraud's transaction went.
  - Content researched for features not built went on 2026-09-27: the
    airports (`nearestAirport`), the neighbourhoods, a city's home price,
    vehicle fees, and cashier's check and money order fees. A bank's
    payment hold on freed credit is read since that day, and its
    posting-order words, the maturity, dormancy, replacement, credit-card
    and refund wording, and the countries' claim-back words are shown.
  - Every source is shown since 2026-09-27: roles' on the Career screen,
    thunder's on the weather look, a published rent's on the place look and
    at creation, and the bank's, the laws' and the research's on the Bank
    screen.
- **A body is partly SLATE's estimate.** Since 2026-09-28 every person has a
  height and a weight (`systems/body.ts`), drawn from the birth country's
  adults (NCD-RisC's heights and bands of body mass index) or given at
  creation; the weight follows the day's eating against what the day spent
  (Mifflin–St Jeor's resting energy, the Compendium's MET values), at Hall's
  pace (Lancet 2011), which with a slowing rest gives the 0.29 kg a year the
  cohorts measure; meals out add the USDA's 134 kcal; a heavier body meets
  diabetes, high blood pressure and arthritis more (the CDC's and Olmsted
  County's onset, Guh's ratios) and dies sooner (the Global BMI Mortality
  Collaboration's bands). SLATE's estimates: the middle of the sexes'
  resting constants, since it keeps no sex; height's spread outside Japan's
  survey; a sedentary day's 1.4; what a broke day eats; how an appetite
  leans (Indulgent, Disciplined); that a working day is eaten back and a
  workout isn't. Not modeled: new asthma and depression by weight, whose
  yearly onset isn't published; a casting's reading of a body, which the
  business does and SLATE leaves out.
- **Injury is partly SLATE's estimate.** Since 2026-09-28 a run, a workout,
  a swim, a stage, a set and an ordinary day each bring an injury at their
  published rate (`systems/injury.ts`: Videbæk's runners, Keogh's lifters,
  the BLS's performing arts and film, Mattiussi's dancers, the NHIS's
  everyday causes), mended in the clinical times, off work for a broken bone
  or a concussion, and at work paid by workers' compensation at New York's
  and California's 2026 rates. SLATE's estimates: which injury each cause
  brings, a stunt's rate (none is published), and a production's cover
  outside the two states, taken as New York's.
- **Tax owed is collected, partly by SLATE's estimate.** Since 2026-09-28 a
  balance left owing after filing grows by the IRS's underpayment interest,
  7% a year compounded daily (the fourth quarter of 2026), and the
  late-payment penalty, and is collected as the IRS collects: CP501, CP503,
  the CP504 notice of intent to levy and the LT11 final notice about five
  weeks apart, then 30 days on a levy on the bank accounts
  (`systems/taxreturn.ts` `COLLECTION`). SLATE's estimates: the rate held at
  2026's; a levy again each quarter while anything is owed; the bank's
  21-day hold not kept. Since 2026-09-28 too, a return never filed that
  owes is filed by the IRS a year after it was due (the CP2566 notice), theirs
  to replace for 120 days, then assessed with the late-filing penalty and the
  interest and collected (`SUBSTITUTE`); the year and the 120 days, and the
  IRS reaching SLATE's own figures, are SLATE's estimates. Not modeled: a
  levy on wages or on a pension, and a refund forfeited for a return never
  filed in three years.
- **The pension is partly SLATE's estimate.** Since 2026-09-28 the
  SAG-Producers Pension Plan (`systems/pension.ts`) credits a year of covered
  earnings at the minimum, vests at ten credits or five without a break, and
  pays monthly from 65, as the Plan's pages say. The minimum, $20,000, and
  the 2% a year adds are the Plan's current figures (its Summary Plan
  Description, unchanged by its notices of August 2025 and July 2026); this
  said they were held at 2012's, which they are only in that 2012 set them. A
  production counts to the Plan's $232,000 ceiling and, since 2026-09-28, a
  television episode to $25,000 a half hour and $35,000 an hour; an early
  start from 55 with ten credits is a quarter of a percent less a month under
  65, and the pension is on the year's return, all as the Plan's pages say.
  Since 2026-09-28 it is held to the law's ceiling, IRC section 415(b):
  the lesser of $290,000 (IRS Notice 2025-67) and the best three years in a
  row. SLATE's estimates: the figure held at 2026's, and not reduced for a
  start before 62, as the law reduces it.
  The Activity Test binds only who had five to nine credits at the end of
  1998, which no life SLATE begins did. SLATE's estimate: a Permanent Break
  as five years in a row without a credit. An older save's pension fund from the
  day job, which nothing moved from 2026-09-26, is paid out at 65.
- **Homes are partly SLATE's estimate.** Since 2026-09-28 homes are bought by offer, owned, let, kept up,
  borrowed against and sold (`systems/homes.ts`). A US town's typical value
  is Zillow's; England's Stamp Duty Land Tax, Scotland's Land and Buildings
  Transaction Tax with its Additional Dwelling Supplement, Wales's Land
  Transaction Tax with its higher rates, each nation's council tax bands,
  shares and average Band D, the
  Homeowners Protection Act's mortgage insurance rule, the 2025 act's cap on
  state and local taxes, the $750,000 interest cap, the $250,000 exclusion,
  the long-term gain brackets, the passive loss allowance, depreciation
  recaptured at up to 25% (§1250), a let home's held losses freed on its sale
  (§469(g)) and the exclusion cut for years owned before living in it
  (§121(b)(5)) are law. The starting rates are Freddie Mac's and
  Moneyfacts' for September 2026, and since 2026-09-28 they move month by
  month, and a mortgage can be refinanced at them. What a home's fixtures add
  to its rent and price is ApartmentAdvisor's regression where it measured
  one. The rest is SLATE's estimate: how rates wander, refinancing's closing
  costs, down payments and closing and selling
  costs by country, a foreign town's prices from its rent, how sellers answer
  offers and how long homes sit, what each renovation costs and returns, how
  often parts fail and weather damages, how tenants behave, and the premium
  of the fixtures no study priced (a washer alone, wall units, a terrace or
  yard, a home gym). A rented flat's rent stays the published one whatever
  it has inside, so that creation and play show the same cost of living.
- **Living in a home is partly SLATE's estimate.** Since 2026-09-28 every
  home has fixtures that everyday life reads (`systems/dwelling.ts`): a bath,
  a dishwasher, the laundry, air conditioning, somewhere outside, a gym. The
  shares by country are the national surveys' (RECS, ONS, Destatis, INSEE,
  INE, ISTAT, Statistics Canada, the ABS, Japan's Cabinet Office, Gallup
  Korea, INEGI, IBGE); laundry prices the Coin Laundry Association's; the
  heat's cost to sleep Minor et al.'s; claims the Triple-I's; delivery
  LendingTree's; cleaning time the American Time Use Survey's. Since
  2026-09-28 the bills read them too: the summer's cooling as far as the air
  conditioning runs, and each load's electricity by the DOE's and EIA's
  figures at 2026's price; and renters insurance covers a renter's things
  against a burglary (the FBI's rate) or a fire in the building, at each
  state's average premium (Insurance Information Institute). SLATE's
  estimates: bathtubs and balconies (no survey counts them), a wardrobe of two
  weeks, how untidy a day makes a home and what a mess weighs, a rack drying
  overnight, what a gym builds over a workout at home, what's lost in a
  burglary or a fire, and how much less wall units cool than central air.
  Since 2026-09-28 a washer's load counts the hot water it draws, about 90%
  of its energy (ENERGY STAR), priced as electricity whatever heats it.
- **Papers are partly SLATE's estimate, and a border isn't checked yet.**
  Since 2026-09-29 a person holds a passport, travel authorizations, visas,
  a driver's license and an International Driving Permit
  (`systems/documents.ts`, `systems/licensing.ts`; docs/WORLD.md, stage 1).
  The fees, days, terms, entry rules, license steps, waits and most pass
  rates are the authorities' own. SLATE's estimates: how many days ahead a
  step is booked; a test's pass rate where nobody publishes one (the mean of
  the published rates of its kind); a course's price, the middle of the
  prices published; France's passport days; a few license terms the
  authority's pages didn't give, marked `yearsEstimated`. `mayEnter` decides
  entry, and since 2026-09-29 a job abroad asks it at the offer and on the
  travel day, and a home abroad asks the right to live there; until then a
  production abroad moved the actor with no check. Permission to work is
  asked since 2026-09-29 as well (`systems/permission.ts`), and journeys of
  the player's own don't exist (stage 2). SLATE's estimates in permission to
  work: USCIS's and IRCC's standard processing times, which neither
  publishes as one figure (OPT 90 days, an O-1 90 and the union's opinion
  15, a Canadian permit 30); what counts as a day at work on OPT (inside a
  job's span, SLATE's reading of twenty hours a week for work that comes in
  engagements); and which of the O-1's six kinds of evidence the career can
  show (a lead, a known name, a critical role, high pay; a record of
  commercial success and critics' recognition aren't kept per actor). An
  approved O-1 or OPT stands in for the consulate's visa stamp (DS-160,
  $205) its holder would travel on. Someone whose permission has ended isn't
  made to leave: they can't work, move into a home or buy one to live in,
  and nothing enforces more.
  `mayDrive` decides driving, and nothing drives yet (stage 3). A license's
  probation and points aren't kept, since SLATE has no driving offenses.
- **`SlateOfficialResult`** and the `recordOfficialResult` function that writes
  it: nothing in the build produces an official result. It's a Base44 entity
  and a deployed function, so taking it out is a deployment and waits for the
  owner. (`search()`, the five record shapes with no table and the history
  categories for systems long gone were taken out on 2026-09-25.)

## Settled on 2026-09-28, by wiring or deletion

The crafts: the thirty that were trades an actor's jobs don't do are each
met where the work puts an actor beside them (`CRAFTS_AT` and the genre's,
in `systems/enjoyment.ts`): a set's camera, lighting, makeup, costume,
sound, script supervisor, director, producers and designers; a series's
showrunner and writers; a location; a stage's and a rehearsal room's; a
booth's, an animated series's and a video game's motion capture; the
genre's stunts, creature effects, choreography, puppetry and more; the
casting room at an audition or a workshop; improvisation at an improv
class; and the finished work at its premiere, on air or streaming, with the
festival and the reviews. Film History and Film Preservation are an evening
with the old films. One loved craft lifts a day, however many are there,
under the owner's rule: mood and stress, never how good anybody is.
`tests/crafts.test.ts` holds that every craft is met somewhere.

The tax engine: every part of it is charged. Its income and payroll tax
since the career (acting wages withheld through it, each year's return
worked out with it); its sales tax since 2026-09-27 on the goods the work
buys (the day's food is groceries, which the states SLATE taxes a life in
exempt); its property tax since homes were bought, an owned home's
assessed value at the engine's rate for the town. Its vehicle rules went on
2026-09-27, with nothing driven, and this page kept an entry for them after
they had gone. Its tables are in dollars, and money in another currency is
taxed on what it comes to in dollars.

The performer title: this page said nothing read it, which was wrong since
the school's plays were cast (`systems/school.ts`): a part written for an
actor or an actress goes to one, and the title says which the player is.
The creation screen says so now. Parts after school aren't written for
either.

What was kept and only told back, made to count: an agency remembers how a
client left (`takesBack`); a showcase's buzz brings managers for half a year
(`BUZZ`); credits in a city count with its casting (`localEdge`); a loan's
term clears it at its last payment; a grave breach keeps a term short; a
director's note taken reads at the next casting (`LastWork.heeded`); the final
year's leads and reviewed stage work read at the showcase (`thesisSeen`); the
cast list read lifts or stings (`castListRead`); a studio rents for less than a
one-bedroom; where a job has them staying is what they live with there
(`person.stay`); an engine failure is said to the player as it happens. What
only copied the ledger went: a residual's running total and count, a year's
residuals, a claim's weeks paid, the work-study year's hours, and the failure
log.

## Unreachable: correct, and nothing can get there

- **Northern Ireland's license path.** Its steps and fees are set down
  (`content/licensepaths.ts`, `gb-nir`) and `licensingOf` maps Northern
  Ireland's towns to it, but SLATE's list of towns has none in Northern
  Ireland, so no life can stand there to take it. It's reached when the list
  gains Belfast.

Until 2026-09-29 nothing was here, since 2026-09-27. What a bank reads from
wages is reached again by acting pay, and the Decision Center by offers of
representation, management and work and by each year's return.

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
