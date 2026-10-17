# Brief 12, Research: What Closes The Two Document Rows (2026-10-17)

Written before any code or test it governs changed. The owner's words are brief 12, section 4
(`../briefs-2026-10-16/12-resolve-the-remaining-decisions-and-complete-the-authorized-build.txt`), quoted in
`prompts/research.md`. The rows are `KS-ct-idcard` and `KS-passport-fees`, both Blocked Externally at the start
(`../completion-2026-10-16/research-result.json`). Brief 11's work on them, its blockers and its fifteen mutations stand
as they were: this pass adds to them and rewrites none.

## The Focused Attempt, 2026-10-17

Every page is in the research records with what it gave (`docs/research/world/research-ct-idcard.json` and
`research-passports-abroad.json`, each with a `brief12` section). A page is **unavailable** where no source publishes the
value, and **blocked** where a source exists and access was refused or failed. A search summary or a secondary site was
used only to find pages, and is recorded as a lead, never as the figure.

- **Japan, settled.** Every `*.us.emb-japan.go.jp` and `mofa.go.jp` page still answered 403 (Akamai), to curl and to
  WebFetch: New York's, Washington's, Seattle's, Nashville's, MOFA's. The fee's own law answered instead, on e-Gov's law
  database (laws.e-gov.go.jp, Japan's Digital Agency):
  - the Passport Act, art. 20-2: an applicant abroad pays the fee a Cabinet order sets;
  - its Enforcement Order (旅券法施行令, Cabinet Order 122 of 1989, as amended by Cabinet Order 177 of 2026, in force
    1 July 2026), art. 5: the fee abroad is set **for each country where the consular officer is posted, in that country's
    currency, by MOFA ordinance**, within 9,200 to 9,400 yen for a ten-year passport on paper and 8,800 to 9,000 online,
    at the Finance Minister's rate;
  - that ordinance (国外における旅券手数料の額を定める省令, MOFA Ordinance 4 of 2006, as amended by MOFA Ordinance 19 of
    2026, promulgated 24 June 2026, in force 1 July 2026), its table's row アメリカ合衆国 (United States), ドル (dollars):
    **62** for a ten-year passport applied for on paper, 60 online, 32 and 30 for an under-18's five-year one. Its
    supplementary provision: applications made before 1 July 2026 keep the fees then in force.

  The fee is the country's, so the consulate whose district holds Connecticut charges what any Japanese post in the United
  States charges, and which consulate that is no longer matters to the figure.
- **New Zealand, partly settled.** passports.govt.nz still answered a Cloudflare challenge (403) to curl and to WebFetch,
  and so did its `robots.txt` and `sitemap.xml`. legislation.govt.nz answered 202 with an empty body and the header
  `x-amzn-waf-action: challenge` (an AWS WAF challenge), in every URL form tried, old and new, and demo.legislation.govt.nz
  the same. The Internet Archive's capture of the costs page exists (its availability API names one of 1 October 2026),
  and the proxy's tunnel to web.archive.org closed mid-exchange every time (`recentRelayFailures`). Read instead, each on
  DIA's or IRD's own site:
  - DIA's proactive release of the 2022 fee review's Cabinet papers (dia.govt.nz), Appendix C: **"Applications lodged
    online (online applications from outside New Zealand do not attract GST)"**, and, under "Additional Fees (online
    applications from outside New Zealand do not attract GST)", the **priority fee "New Zealand or on line"**, set equal
    to the standard fee in each year (2022 $173.04, 2023 $179.13, 2024 $186.96, before GST), London's and Sydney's apart;
  - DIA's proactive release of the 2024 fee review (dia.govt.nz): Cabinet agreed on 10 March 2025 (CAB-25-MIN-0055) "to
    a passport and travel document fee increase of approximately 14.9% from Friday 2 May 2025", the adult fee $215 to
    $247 with GST, and DIA's service standard of "3 working days for urgent passports";
  - DIA's release of 1 May 2025 (dia.govt.nz) and govt.nz's passport page (last updated 26 November 2025): an adult
    passport $247;
  - IRD's tax residency page (ird.govt.nz, last updated 25 June 2026): a New Zealand tax resident becomes a non-resident
    only if they both have no permanent place of abode in New Zealand and are away more than 325 days in any 12-month
    period, the status then backdated to the first of those days.
- **Connecticut, still unavailable.** No source publishes the term of a card the DMV doesn't verify, issued to somebody
  not a citizen:
  - the statutes (cga.ct.gov, its chain completed with GoDaddy's G2 intermediate as brief 11 did): chapters 1 and 246
    hold none of "lawful presence", "limited duration", "limited term", "authorized presence", "period of such person";
    2025's SB 1150, File No. 252, reprints § 1-1h with no such term;
  - **2005's Substitute SB 189**, which would have required exactly this ("restrict the validity of such ... identity
    card to a term limited to coincide with the period of such person's lawful presence"), **failed**: its history ends
    "4/25/2005 (GAE) Motion Failed JF";
  - the DMV's pages read again (Get a non-driver ID: "valid for 7 years", no exception; Renew your non-driver ID: "You
    are not a U.S. citizen. Please make an appointment to renew in person."; Get a driver's license: "Immigration checks
    are only valid for one year", a SAVE check's life, not a card's term);
  - the regulations: § 14-137-64a in the DMV's compilation (revocation once "no longer entitled to be present", no term);
    eRegulations' §§ 1-1h pages still answer "Unable to Access Resource (HTTP: 404)".

## Each Value, And What Closes It

### 1. Japan's fee from the United States: verified

- **Jurisdiction:** Japan. **Service:** a ten-year general passport (一般旅券) applied for on paper at a Japanese embassy
  or consulate in the United States. **Currency:** US dollars. **Amount:** 62. **Effective:** applications from 1 July 2026.
  **Retrieved:** 2026-10-17, MOFA Ordinance 4 of 2006 as amended by MOFA Ordinance 19 of 2026, on laws.e-gov.go.jp.
- **In SLATE:** `PASSPORTS_ABROAD.JP` is US$62, said with its source in its comment and on the screen's fine print; its
  assumption about the fee goes. SLATE's student applies at the consulate, on paper, as its `basis` has said since
  2026-10-16; the online US$60 is named beside it. No faster service from abroad, as before. Its days stay SLATE's
  estimate, outside this row.
- **Closed by:** the drawn Papers screen and `documents.apply_passport` charging US$62 once, the faster service refused,
  a second application refused, issued on its day across a save and a load, the old one canceled then; a FIXTURE holding
  the figure and that Japan's entry no longer calls its fee SLATE's.

### 2. New Zealand's GST from abroad: an assumption

- **Verified:** the fee before GST, NZ$214.78 (NZ$247 with GST at 15%, DIA's 2025 release; the regulations set fees
  before GST, DIA's 2022 papers); that online applications from outside New Zealand don't attract GST (DIA's 2022
  papers); and the residence test that decides it now (IRD).
- **Not settled, and why:** DIA's current statement (search extracts of the blocked costs page: GST isn't charged to "a
  non-resident for New Zealand tax purposes" applying online) turns on the applicant's own tax residence, and that turns
  on a permanent place of abode in New Zealand and 325 days away, which SLATE doesn't hold. No source can publish it for
  SLATE's student: it's **unavailable**, and the page that states the current condition is **blocked**.
- **SLATE's assumption:** GST is charged, NZ$247. One constant, `NZ_FROM_ABROAD.gstCharged` in
  `content/passportsabroad.ts`, true. Its basis: it's the price DIA publishes; whether a student newly arrived in New
  Haven has stopped being resident depends on a home in New Zealand SLATE knows nothing of; and the status quo since
  2026-10-16 holds. Turned off, every New Zealander applying from New Haven pays NZ$214.78.

### 3. New Zealand's urgent fee from abroad: an assumption

- **Verified:** DIA's 2022 schedule set the priority fee for an application lodged in New Zealand or online equal to the
  standard fee; Cabinet's 2025 increase applied to passport and travel document fees alike, about 14.9%; the urgent aim
  of three working days.
- **Not settled, and why:** the 2025 regulations in force (SL 2025/75) are **blocked** (AWS WAF challenge); their
  priority fee was seen only in a search extract, NZ$214.78 "for applications lodged in New Zealand or online".
- **SLATE's assumption:** the urgent fee for an online application from overseas is the standard fee, NZ$214.78 before
  GST, NZ$247 with it, as in 2022's schedule. One constant, `NZ_FROM_ABROAD.urgentBeforeGst`, with GST on it following
  `gstCharged`. SLATE's five days stay as they were.

### 4. Connecticut's term for a non-citizen's card: an assumption

- **Verified, from brief 11, unchanged:** $28, seven years to the first birthday at least seven years on, mailed within
  twenty business days, SAVE's ten federal workdays first for somebody not a citizen, non-verified.
- **Not settled, and why:** **unavailable**. No statute, regulation or DMV page gives a term for the card the DMV doesn't
  verify; the bill that would have tied it to lawful presence failed in 2005.
- **SLATE's assumption:** the card runs to the end of the holder's lawful presence (the program's end at school, OPT's
  printed end on OPT), never past the published seven years to a birthday. One constant,
  `NONCITIZEN_ID.toLawfulPresence` in `systems/identity.ts`, true. Its basis: Connecticut's limited-term REAL ID "must
  align with the expiration date on the individual's legal status document(s)" (the DMV's REAL ID page); § 14-137-64a(c)
  lets the commissioner revoke the card once its holder is "no longer entitled to be present"; and a card that outlives
  the status that let it be issued isn't one SLATE's student could keep. Turned off, the card takes the published seven
  years to a birthday, still non-verified, still after SAVE and the mail.

## Changed Safely

The owner: "Make future correction possible without corrupting existing documents, charges, or histories. Explain what
happens when a rule changes."

- **What's stored, and when.** A card's expiry is written on it when it's applied for (`expiresAt`), and a fee is posted
  to the ledger when the application is made. Nothing recomputes either afterwards: not the card's arrival, not a
  replacement (which keeps the lost card's date), not a load. A passport's term is set when it's issued, from the
  office's years, which no assumption here touches.
- **When a value changes:** a card already issued or on its way keeps the term it was applied for with, a fee already
  charged stands, and the change applies to what's applied for after. A correction to documents already held would need
  its own dated migration on opening (`ONCE_ON_OPENING`, `src/engine/index.ts`), which this pass doesn't make, because
  none of its values was found wrong.
- **Nothing in the save moves.** No field is added or changes its meaning: the schema stays 94 in both places.
  Nothing the game judges moves: `RULESET` stays evaluation-11.

## The Tests That Close Them

Extending `tests/remaining-papers.test.ts`, whose `tax.s8.passport` and `tax.s8.idcard` blocks hold brief 11's evidence.

- **Japan:** `PLAYER JOURNEY:` a Tokyo-born student renews on Papers from New Haven: US$62, no faster service (the
  command refused), a second application refused, charged once, issued on its day across a reload.
- **New Zealand:** `PLAYER JOURNEY:` an Auckland-born student renews faster on Papers: NZ$247 and NZ$247 more, in dollars,
  charged once, the screen naming both assumptions as SLATE's, issued in five days across a reload.
- **New Zealand, changed safely:** `PLAYER JOURNEY:` (`TEST SETUP:` the constant turned off, as a correction would) an
  application charged with GST is issued on its day with nothing charged or refunded and its transaction unchanged, after
  a save and a load; the next application, after the passport is reported lost, is charged NZ$214.78, faster NZ$429.56,
  and the screen says so.
- **Connecticut, labelled:** `PLAYER JOURNEY:` Your ID on Papers tells somebody not a citizen that the card's term is
  SLATE's assumption, and tells a citizen nothing of it.
- **Connecticut, changed safely:** `PLAYER JOURNEY:` (`TEST SETUP:` the constant turned off) a British student's card,
  applied for and come, keeps its 31 May 2029 across a save and a load, its $28 charge and its notices unchanged; a
  second application while it's held is refused; reported lost, the next card applied for runs seven years to her
  birthday, still non-verified, still after SAVE and the mail, $28 again.
- **Connecticut, run out:** `PLAYER JOURNEY:` the card runs out on the program's end, played to it, and with school over
  and no OPT the DMV turns her away with its reason: SLATE has no renewal of a state ID card (none was there, and none is
  added), so a card run out is applied for anew, and somebody whose presence has ended is refused.
- **The FIXTURES** brief 11 left are kept, and the passport one, whose title says Japan's fee is still SLATE's, is
  renamed in `docs/verification/pipeline/inputs/renames.json` with its old title.

Each new claim is broken in a copy of this clone and the catching test recorded: Japan's fee back to 9,300 yen, or at the
online US$60; New Zealand's GST off by default, the constant not read at the command, the urgent fee not following GST;
Connecticut's constant ignored, read again when the card arrives, its being off dropping SAVE or the mail, or marking the
card REAL ID; the screen's label gone.

## What This Pass Doesn't Do

- Doesn't add a renewal of a state ID card, a courier fee, an online application route or a tax-residence model: each
  would be new scope.
- Doesn't touch decision 4's rows, the shared records or the pipeline's inputs other than `renames.json`.
- Doesn't contact the DMV, DIA or any consulate. The DMV's answer in writing would still settle Connecticut's term, and
  DIA's own costs page New Zealand's two values; both are for the owner to authorize.
