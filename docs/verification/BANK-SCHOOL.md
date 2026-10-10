# Banking Realism And The School Journey, 2026-10-10

The owner's brief: "Audit And Correct SLATE's Banking Realism And Complete The School Experience Review". The work started on `main` at `a2bf025d`, on branch `claude/bank-school`.

The 16 unresolved items from `docs/verification/COVERAGE-GAPS.md` are deferred, as the brief says, and aren't reopened here. No gap found in this pass was filed under them. Every one found is fixed below, or listed under **Remaining limitations**.

Nothing here is "100% realistic". Each row says where its rule comes from, and what SLATE simplifies.

## The problem as reproduced

`docs/verification/BANKING-SWITCH.md` records it, as measured before any fix (commit `b1c7a94b`):
- A US "Switch Bank" opened the new bank's accounts and moved every penny the same instant.
- It also closed the old accounts and moved the primary account.
- It could be repeated with no time passing: Chase → Bank of America → Chase → Wells Fargo → Chase.

That document now also says what happens instead.

## Sources

- `docs/research/world/research-banking.json`: 55 entries.
  - The five US banks' deposit agreements and help pages.
  - Regulation CC and Regulation E.
  - 31 CFR 1020.220.
  - The CFPB on moving an account.
  - The direct-deposit change lead.
  - The UK's CASS, the EU's Payment Accounts Directive Article 10, Germany, France, Ireland, Australia, Canada and Iceland.
- `docs/research/world/research-banking-intl.json`: 36 entries.
  - Each country's transfer scheme between banks.
  - Each country's switching service and its days.
  - Card delivery.
- `docs/research/world/research-yale-school-facts.json`: 70 claims about the school, each labelled Documented, Simplified, Original SLATE content or Uncertain.
- `docs/verification/school-journey-audit.json`: 32 findings, with file and line evidence and probes, and the 10 stages confirmed complete.

Every entry carries its jurisdiction, the date read (2026-10-10) and its uncertainty.

## Banking: the matrix

| Player goal | Supported steps | Requirements | Authoritative state | Downstream effects | Source or design basis | UI entry | Behavioral evidence | Remaining limitation |
|---|---|---|---|---|---|---|---|---|
| Choose a bank at creation | Pick any bank where you live | None | `primaryAccountId`, the account at that bank | Everything starts there | Unchanged | Creation | Existing creation tests | — |
| Open a current account at another bank | `bank.open_current`; Bank of America applications are decided as `bank.application` | A bank where you live, with no account there and no application pending. You must owe it no charged-off debt and pass the screening report. You need a photo ID in force and must be 18 (where the bank says so). Citi online asks for US citizenship or residence. | A new `Account` at $0 with its own number and date. `awaitingFunds` and `fundBy` where the bank waits on funding. A new card has `plastic.stopped = 'new'`. | No money or history is copied. Primary is unchanged. | Bank of America reviews in 1–2 business days (2 used). Opening deposits are $100 (Bank of America) and $25 (Wells Fargo). Capital One isn't "opened" until funded. Cards: Chase about a week, Bank of America 4–6 business days with a digital card meanwhile, Wells Fargo 5–7 calendar days, Capital One 5–7 business days. Citi's card time is SLATE's estimate. | Money → Accounts → Open An Account At Another Bank | `bank-moves.test.ts`: Capital One, Bank of America with review and deposit, a declined application with its deposit returned, a repeat refused | Identity verification can't fail, beyond a lapsed ID. There's no SSN or ITIN in the model. Online versus branch opening isn't modeled. |
| Keep two banks | Both accounts stay open, each with its own fees, interest, statements and history | — | Each `Account`; `checkingsOf` lists primary first | Month-end fees and interest run per account. Each loan repays from its own bank's account (`checkingAt`). A term deposit matures into its own bank's account. | The banks' own products (`content/banks.ts`) | Your Banks panel and the account cards, each naming its bank | Second-bank journey | — |
| Change the primary account | `bank.set_primary` | An open current account of yours, not one that's closing | `primaryAccountId`. Every instruction is pinned first (`pinInstructions`). | It moves debit purchases, machine cash, bills paid by hand, and the default for anything new. Nothing already set up moves. | SLATE's design: a preference, not a relationship | Make Primary, with what it does stated | The relationship journey. The legacy-save test pins instructions; removing the pinning fails 3 tests. | — |
| Have wages paid elsewhere | `bank.redirect_deposits` | An open everyday account | `PaymentSettings.depositTo` and `depositChange {to, at}` | `payeeAccount` routes wages, the stipend, the living-expense scholarship, benefits (including assistance), refunds and pensions | Takes effect after `DEPOSIT_LEAD`, 14 days. That's SLATE's estimate: Chase says "up to two pay cycles". | Have Wages Paid Here | The relationship journey; the scholarship goes to the wages account, not the new primary | One lead for every payer |
| Move standing orders and autopay | `bank.set_order_source`, `card.set_autopay_from` | An open current account | `StandingOrder.fromId`, `CardState.autopayFrom` | Each pays from its own account. If that account closes, it fails and says so. | SLATE's design. Regulation E's 3-day stop notice isn't kept: the move is the player's own. | What Pays From Where | Relationship journey | — |
| Move money between your banks | `bank.transfer`; arrives as `bank.transfer_arrives` | Funds available in the source. Withdrawal fees and Germany's monthly allowance apply. The sending bank's limits apply. Neither account may be closing. | A person-owned `escrow` account, Money In Transit, counted in net worth | Out at once, in on the day it arrives. Back to the source if the destination has closed. | Chase 3 business days, Wells Fargo 2, Capital One 3. Citi the same day before 12:30 and the next day after. Bank of America is SLATE's estimate of 3. Instant by the country's scheme in GB, IE, DE, FR, ES, IS, KR, MX, AU and NZ. Japan's Zengin is same-day in its core hours. Canada's EFT takes 1 business day. Citi's $10,000 a day and $15,000 a month outbound apply. | Move Money; On Its Way | Net worth is constant at sending; balances are checked before and after arrival; returned to the source; Citi's limit; an instant GB transfer. Making transfers instant fails 3 tests. | Citi's "tenured" limits aren't published, so the lower ones apply throughout. Pull transfers aren't modeled. |
| Close a current account | `bank.close_current`; for Citi, later as `bank.current_closes` | Not your only or primary account. Not overdrawn. No money in transit. Nothing linked (wages, orders, autopay, payments set for a date). No savings beside it. No pending card items, except at Citi, which keeps the account restricted up to 21 days. | `closedAt`, with history kept | Interest and fees are settled. The balance goes by transfer to the account you name. | The banks' agreements: Chase, Bank of America and Wells Fargo won't close with items pending; Citi's 21 days; Wells Fargo bounces recurring payments; Capital One has no fee | Close It, with each reason it can't close yet | Relationship journey; each refusal; history kept | SLATE keeps every life a current account. Closing an account opened under the cooling-off rules is checked against the same links. |
| The bank closes an account | Daily check | — | `closedAt` | Payments into it are redirected (`redirectAway`). Orders from it fail. | Capital One: unfunded after 60 days. Citi: at zero for 90 days. Chase and Wells Fargo give no day count, so they close nothing. | A notification | Unfunded Capital One test | — |
| Use a switching service | `bank.switch`; completes as `bank.switch_complete` | A country with a service | `completeSwitch` moves accounts, orders, wages and autopay | The old accounts close | CASS 7 working days. Ireland 10. Germany 12. France 22. Spain 13 (summed). Iceland 12 (summed, from a translation). New Zealand 5 (secondary source). | Switch Bank, only where a service exists | `lending.test.ts` (GB, IS), `payments.test.ts` (GB), `bank-moves.test.ts` | Korea's service moves debits but not the balance, and Mexico's moves payroll only; neither is run. |
| Switch in the US | Refused, with the steps | — | — | — | CFPB: no US service exists | Open An Account At Another Bank explains the steps | `bank-moves.test.ts`, `lending.test.ts` | — |
| Be paid during the transition | — | — | `depositTo` / `depositChange` | Wages, the scholarship and benefits go to the wages account until the change date | As above | Your Banks says where payments go, and from when | Scholarship test; relationship journey | — |
| Downstream systems | — | — | — | Card applications count money at every bank. Medical-debt payments by hand use primary. A medical appeal refund goes to the wages account. ATM cash needs the primary's card to have arrived. Grocery purchases fall to the credit card or cash while it hasn't. | — | — | `cardoffers.test.ts`; the gate | Low-balance alerts watch only the primary account. |

**Exploits tested:**
- Rapid switching: refused in the US; one service switch at a time elsewhere.
- Repeated opening at the same bank, and a second application.
- Sending more than the balance.
- Closing with money in transit.
- A destination closed while money is in transit.
- Changing primary before wages or the scholarship post.
- Duplicate arrivals: each is a scheduled item, run once, and survives a reload in transit.
- Failed applications.
- Save and reload between steps.
- Legacy saves with no instructions.

**Save compatibility:**
- Schema 94 is unchanged.
- Every new field is optional: `awaitingFunds`, `fundBy`, `zeroSince`, `closingAt`, `Plastic.stopped: 'new'`, `StandingOrder.fromId`, `CardState.autopayFrom`, `depositTo` and `depositChange`.
- A save from before pins each instruction to its primary account the first time it's read.
- `SUPPORTED_SCHEMA_VERSION` in `base44/shared/guard.js` is unchanged with it.

## The school, stage by stage

The facts check (`research-yale-school-facts.json`) and the code audit (`school-journey-audit.json`). Commits `014a6d09` and `f7ae89f9`.

| Stage | Assessment | Fixed this pass | Basis | Evidence | Remaining limitation |
|---|---|---|---|---|---|
| Admission and arrival | Complete | The class of 16 and the minimum age of 21 are labelled as simplifications | Yale admits 15–17. The Certificate route has no degree requirement. | — | The Certificate route isn't modeled. |
| Money and aid | Complete. The family is always wealthy at creation, so need-based aid is reachable only by a life given need. | The aid model is labelled simplified: no loan or contributions. Scholarship refunds are paid to the wages account. | Bulletin p.182; the aid office | Scholarship routing test | SLATE has no student loan. |
| Calendar | Complete | Four no-class ranges each ran a day too long. Commencement is now the Monday before Memorial Day. | 2026–27 Bulletin; Yale's calendar for 2029 | `school.test.ts` calendar | Season 59's own dates aren't followed. |
| Classes and attendance | Complete | You can now call in sick on any day with something at school, and it excuses the day's shift. | Bulletin p.149 | `school.test.ts` | — |
| Coursework | Complete | Excused at a course's last meeting. A piece not shown, or not shown again, counts as unready. A note isn't "taken" without work. Feedback now matches its band. The read-only button says Mark As Read. Work can't run across a class. On-your-feet work needs you fit, and in-person work needs you out of hospital. | Original SLATE content, labelled | `school-journey-gaps.test.ts`, `school-fixes.test.ts` | Running lines improves the weakest scene, which may be a different partner's. |
| Partners and classmates | Complete | A hospital stay or lay-up excuses a booked rehearsal or study session | `health.ts`'s rule, applied | Hospital journey; the mutation is caught | — |
| Casting and productions | Complete | An excused blocking call leaves a gap to catch up. A rehearsal gives way to a lab showing. Performances are at eight. The casting fine print is corrected. | Bulletin pp.23–25, 146. Carlotta's 2026 curtains. | `casting.test.ts`, `school.test.ts` | Casting every student every term, and Yale Rep once a year, are SLATE's, as labelled. |
| Yale Rep understudy | Complete | A night on call holds the evening against the Cabaret and elective shifts. The guide gives the Sunday matinee's 11 a.m. call. | Bulletin p.146 | Gate | 3 hours from curtain is SLATE's estimate. |
| Cabaret and Summer Cabaret | Complete | Labelled where SLATE invents | Bulletin pp.141, 147–8 | Existing tests | The warning ban is checked only at joining. The chair's approval isn't modeled. |
| Work-study | Complete | 50 elective hours are a minimum, not a cap. Elective shifts are offered only in term. | Bulletin: 200 hours, 150 assigned and 50 elective | `school.test.ts` | Saturday shifts and Friday pay are SLATE's design. |
| Evaluation | Complete | Labelled as SLATE's term-end reading of "regularly"; the floors are SLATE's estimates | Bulletin pp.151–157 | `school-fixes.test.ts` | One evaluation a term. Dismissal without a prior warning comes only through a grave breach. |
| Dismissal | Complete | It now ends the coursework. Yale Health ends with the term paid for. Screens say "Left". | Bulletin, no readmission | Dismissal test; the mutation is caught | — |
| Graduation | Complete | A last term on warning now withholds the degree (new standing `withheld`). A concern still graduates. No "next term" wording in the last term. | Bulletin p.151: recommended by faculty vote | `school-journey-gaps.test.ts` | Per-course passes and a ninth semester aren't modeled. |

## Final verification

- **Gate:** exit 0, read from a file. 138 files, 1,531 tests, and all 15 checks.
- **The 18 lives:** `node tools/verify.mjs lives`, on `3e0f23bb` (tree `e558e728`, 0 uncommitted).
  - 15 graduated, all in good standing every term.
  - The three autopilot lives were dismissed, as the owner kept (#5).
  - Against `bf8918e3`: a London life and the scraping-with-flu-and-injury life no longer drop to a concern in their third term.
  - One job (Mexico City, lives-0) was killed by the batch's own timeout. The runner had counted it as done; it was rerun the same way and passed. `tools/verify.mjs` now keeps a job with an error owed.
- **UI:** the built app at 1440 and 390, on a played student with a second bank, money in transit, a Bank of America application under review and wages moving.
  - No sideways scroll and no overflow.
  - Four faults found were fixed in `3e0f23bb`.
- **Player journeys versus fixtures:** labelled in each test file's header and on each test.

## Remaining limitations

- No SSN or ITIN in the model. A failed identity check beyond a lapsed ID isn't modeled. Online versus branch opening isn't modeled.
- Bank of America's transfer time and Citi's card delivery are SLATE's estimates, and the screen says so.
- Citi's tenured limits are unknown, so the lower ones are kept.
- Korea's and Mexico's partial switching services aren't run; the player does each step.
- Low-balance alerts watch only the primary account.
- From the school audit's low findings, still open:
  - Running lines improves the weakest scene, which may be a different partner's.
  - The Cabaret's warning ban is checked only at joining.
  - Missed labs don't count toward the two-missed-calls rule.
  - Registration and the faculty orientation session change nothing.
  - Some buttons the engine refuses are still offered.
  - Workers' compensation in Connecticut (CGS 31-307) is unverified.
