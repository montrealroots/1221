# Brief 19, The Pay: Payments, Commission And Wages (D7), Work Eligibility And OPT (D8), The Unions, The Work Tab, 2026-10-21

Built on `b19-pay` from `692edccd`, in commits `75b2ce05`, `e95bdab5`, `33cfa2ca`, `b7303dd2`, `50bd7bee` and `705f2a4a`,
and merged into the working branch. (Its builder couldn't write this file from its own clone; the coordinator committed
it from the builder's report, unchanged in substance.) It meets the other builders only through the core's data and
`schedulePay`. Every rule names its research file and source id in `src/engine/systems/propay.ts`'s header, or is marked
ASSUMPTION there and said as estimated where a player reads it. The engagements and agreements in its tests are TEST
SETUP, written the way the work and agent systems write them (`tests/fakes/career-work.ts`).

## Status By Item

| Item | Status | What's left |
|---|---|---|
| D7 | Fixed And Verified (the pay's side) | The game reaches it once the work loop's acceptance calls `schedulePay` |
| D8 | Fixed And Verified | The work loop's acceptance asks `workEligibilityRefusal` |
| V11, the payment half | Fixed And Verified | The engagements are TEST SETUP until integration |
| V13 | Fixed And Verified | |
| V14 | Fixed And Verified | |
| V15, the pay's save points | Fixed And Verified | |
| G8, what an ended agreement leaves owed | The pay's share done | The agent's system ends agreements |
| J2, the payment and commission stages | The pay's share done | |
| J6, banking and papers | The pay's share done | |
| T1 and T2 | The pay's share done | |

## D7: Payment And Commission

**Built** (`propay.ts`):
- **Promised, then paid once.** `schedulePay` (:533) puts each payment on the clock under `pro.pay.payday`, unless it's
  deferred, already received, already in trust or already scheduled. The payday handler, `payDue` (:449), pays only a
  payment with nothing received and nothing in trust; that guard makes it once only. Deferred pay is shown and never
  posted.
- **Where the money goes.** `owedAgreement` (:259) decides who's owed commission, in order: the engagement's own
  agreement; the agreement in force on the day the contract was made (the payments' `promisedAt`, read through
  `activeAgreement`); or Equity's tail (an offer conveyed during the term and accepted within 60 days of it, after the
  term; S30 ¶4). Owed commission, the gross less tax and dues goes into `trustAccount` (:426), an escrow account of the
  player's held by the agency, which net worth shows as held for you in your agency's client trust account; `release`
  (:500) passes it on three business days later, less commission (SAG-AFTRA's S1 rule, applied to all covered work as an
  ASSUMPTION). No commission owed, the pay goes straight to the account the player's payments go to (`payeeAccount`).
  Every movement is a `sim.post`, in the save's currency.
- **Commission, only when owed** (`commissionOn`, :326): none on unrepresented work, none on work the agreement doesn't
  cover (`coveredWork`: stage, film and television in the US); Equity's 5% on a weekly salary of $525 or less and 10%
  above it (S28); SAG-AFTRA's lesser of 10% of the gross or what the pay is over scale (S3), so an offer at scale plus
  ten (`negotiatedAmount`, :364) leaves the actor scale and gives the agent the ten; any other covered work 10%, New
  York's cap (GBL §185(8)); still owed after the agreement ends on contracts made during its term (S29), and the text
  says so.
- **Wages, reported as wages:** category `salary`, the memo carrying the hours (eight a day, an ASSUMPTION) that
  `workedBetween` reads; `recordWages` gets the employer, the tax withheld for each authority, the commission, the dues
  and the town the work was done in.
- **Withholding** (`withholdingOn`, :388), on the year's wages so far, the way the Summer Cabaret stipend is withheld:
  federal tax and FICA (an F-1 nonresident alien pays no FICA, S14, and has the standard deduction added back); the work
  state's own tax on wages earned there (New York's, for a nonresident; S46); New York City's from its residents only
  (S46, S47). Connecticut's isn't withheld on New York work: the game's tax code doesn't say when an out-of-state
  employer withholds it, so the tax return settles it, and the return already gives Connecticut's credit for New York's
  tax.
- **Payday:** `paydayAfter` (:163), the Thursday after the week's work (S5's Thursday, applied to all W-2 work, an
  ASSUMPTION).

**Tests** (`tests/propay.test.ts`; full titles in the file): an unsigned graduate's three weeks Off-Broadway, promised,
paid on Thursdays straight to checking, counted as New York wages; a GUARD that no payment is made twice, across a
reload mid-week, a jump past several due dates and the payday fired twice; a student film's deferred pay; represented
SAG-AFTRA work at scale plus ten, commission exactly $256.60, the pass-on once despite a second item and a reload while
in trust, and net worth's wording while it's held; SAG-AFTRA at scale (no commission) and far above it (the full 10%);
Equity on both sides of $525, $105.10 and $25.00, each to the cent against the postings; unrepresented work, and the
agreement read on the day the contract was made; continuing commission after the agreement ends; the 60-day tail and
uncovered work; New York withholding and the tax return (New York's tax and Connecticut's credit, no New York City tax
for a New Haven resident); New York City tax for a TEST SETUP city resident. The screen's tests
(`tests/propay-screen.test.ts`): the Work tab before payday, in trust and after, and Money's statement line.

**What a player reads** (`played.txt`):

> Bright Harbor Television paid $2,822.60 for The Calloway Files, the week of September 20, 2026, into Stewart Talent’s
> client trust account, less $215.93 withheld for tax. Stewart Talent passes it on to you by October 6, 2026, less
> $256.60 commission.

On the statement:

> The Calloway Files, the week of September 20, 2026: paid on from Stewart Talent’s client trust account, less $256.60
> commission +$2,350.07

## D8: Work Eligibility And OPT

**Built:**
- `usWorkAuthorized` (`permission.ts`:115) counts citizens and US permits in force. A green card is itself a US permit,
  so it already counted; a separate line added for it survived its mutation (M16) and came out. Nothing in it reads
  agreements, so signing with an agent changes nothing.
- `eligibilityRead` (:218) reads every date of an engagement and keeps the result on it (`Engagement.eligibility`);
  `workEligibilityRefusal` (:237) is the refusal the work loop's acceptance asks.
- OPT counts work days: `daysWorkedIn` (`permission.ts`:238) reads the engagements' days; the weekly count adds 7 less
  the days worked to `idleDays` and the days worked to `workedDays`; `optRunsOut` (:254) projects when the days without
  work run out, which Papers' Your US Status reads.
- Rewritten to say what's now true: the OPT approval notice; Papers' OPT panel and its comment; the guide's Permission
  To Work entry; the residence routes that said the game had no record of professional work to show. The 7 tests that
  pinned the old "no work after the degree" notice pin the new words (`evidence-g16-papers` twice, `evidence-g15-papers`,
  `evidence2-b12`, `evidence3-home`, `evidence-g33-ui`, `evidence2-b06`); comments those changes made false, in five test
  files, are rewritten in the past tense.
- Papers' Permission To Work has a new panel, Your Work And Your Permission (`WorkReadPanel`): each engagement with what
  was read for its dates, and on OPT, that it's the list of work SEVP's guidance asks you to keep.

**Tests:** an F-1 student in session can't accept outside acting work, and signing changes nothing; a citizen can,
signed or not; a green card counts; on OPT, twelve days of work move its end two weekly counts later, and once it ends a
later engagement is refused in the refusal's own words; Papers on OPT, the days counted so far and the end date the
booked work moves.

> You can’t accept this work. On an F-1 you can work only on campus while you’re a student. Yale grants CPT, permission
> for outside work during a degree, only for training the whole program requires, and the Acting program has none, so
> outside acting work, paid or unpaid, has to wait for OPT after your degree.

## The Unions

- **Equity at the degree.** `setStanding` emits `pro.equity_joined`, and `equityJoined` (:620) bills the initiation fee
  once: $600 down at once, then $600 a year later and $600 two years later (the fee and the down payment Equity's, S27;
  the rest's split an ASSUMPTION). Basic dues of $88 are billed each May and November (S27), on the 1st (ASSUMPTION).
  Each bill is a keyed `UnionBill`, paid from the bank or recorded as owed under Bills Owed if the bank can't cover it,
  never twice. Working dues of 2.5% are taken from Equity pay (taken from the pay an ASSUMPTION).
- **An older graduate's save:** told what's owed and never charged for a past date. On first opening (`equityOnOpening`,
  the `pro.unions` step), any part already past due is billed at the next May or November billing day.
- **SAG-AFTRA:** a first SAG-AFTRA principal role (TV/Theatrical or Low Budget) sets `pro.sag.eligibleSince` on its first
  day; Ultra Low Budget and student films don't count (S20, read only from a search engine's copy). From the 30th day
  after that job began, `sagWorkRefusal` refuses SAG-AFTRA work until the player joins (29 U.S.C. 158(a)(3)).
  `pro.join_sag` charges $3,244.07 (the initiation fee and half a year's dues, from that same copy, and the screen says
  so), then bills dues each May and November; working dues are 1.575%.

**Tests:** Equity's $600 charged once and the dues billed, across a reload; an older graduate told what's owed and
nothing charged at the opening; SAG-AFTRA eligibility, the 30-day rule and joining; Join SAG-AFTRA refused when the bank
can't cover it, nothing charged; settled bills kept to the last twelve.

## The Work Tab

`src/ui/career/WorkPane.tsx`: each engagement, live and finished, with who it's for, where, its status and dates, its
calls, what permission to work read for its dates, and its pay, one line per payment (promised and due, in trust, or
received with gross, withheld, dues and net), the commission on a line of its own; Still Owed After An Agreement Ended;
Your Unions, with Join SAG-AFTRA behind its guide chapter and its reason shown before it's pressed; How This Works on
each panel. Checked on the built app at 1440 and 390 (`screens/`): the page served was the clone's `dist/`, no page
errors, no horizontal overflow, the arrow keys move between tabs, and Sources And Estimates opens with Enter.

## Mutations

`mutations.txt`: 34, all killed in the end. M16 survived because the line it removed was redundant, and the line came
out. M26 (uncovered work) and M29 (the pass-on's guard) survived until tests reached them, then were killed. M34 checks
that the corrected `cohesion.test.ts` still catches a dead handler.

## Checks Run (On The Builder's Clone, `705f2a4a`)

- `npx tsc -b --noEmit`: exit 0. `npx eslint` on every changed file: exit 0.
- The gate's chain without the suite: exit 0, read from a file (`checks.txt`, `checks-exit.txt`). The text inventory
  holds (engine-speak 316, unchanged); 582 of 582 guide quotes said by the game; surfaces claim 4,384 of 4,384 sources;
  the completion matrix 566 of 641.
- vitest, one worker (`test-runs.txt`): 43 files through graduation and the pinned words, with 5 failures, all from
  renaming an opening step while the batch ran, all passing on rerun; 14 more files, 197 tests, passed; the 334 other
  files importing a changed module, 3,325 tests, with 2 failures, both fixed and passing (`cohesion.test.ts` didn't read
  a three-part kind, `pro.pay.payday`, and its reading was fixed; `looks.test.ts` found two straight apostrophes in
  `money.tsx`'s comments); the pay's own four files, 67 of 67.

## Not Built, And Why

- Equity's 5% rehearsal-period rate at minimum, its rule on per diem, and continuing commission on renewals: no
  engagement in the game has a separate rehearsal rate, per diem or a renewal, so there's nothing for them to read.
- Connecticut withholding on out-of-state work: not researched; the tax return settles it.
- Providence (`us-ri-providence`) isn't in the gazetteer: its pay is counted as earned where the player lives, and the
  Work tab says so.
- Nobody in play lives in New York City, so the city-resident case is tested on a TEST SETUP resident only.

## For Integration

1. The work loop's acceptance calls `schedulePay(sim, person, engagement)`. Each payment's `due` is `paydayAfter(...)`,
   its `key` `<engagement>:<n>`, its `promisedAt` the moment of acceptance (the contract date commission reads);
   `offer.amount` stays per day or week.
2. A represented SAG-AFTRA offer is priced with `negotiatedAmount(...)` (scale plus 10%).
3. The acceptance asks `workEligibilityRefusal` and `sagWorkRefusal`.
4. Calls show on the Work tab when their `refId` or `payload.engagementId` is the engagement's id. The calendar legend has
   no `career` entry; paydays and union bills use Money's.
5. `us-ri-providence`, the regional theatre's town, isn't in the gazetteer; `CITIES.require` throws on it, and the tax
   return goes through that.
6. Every played graduation now charges Equity's $600 down payment; the 33 graduation test files pass with it.
7. `setStanding` emits `pro.equity_joined` when the degree makes the player an Equity member; the opening step
   `pro.unions` runs after `pro.begun`.

## Shared Files Touched

`pro.ts` (the optional fields `ProPayment.inTrust`, `received.dues`, `Engagement.eligibility` and
`ProRecord.unionBills`; the types `EligibilityRead` and `UnionBill`), `permission.ts`, `documents.ts` (`workedDays`),
`school.ts` (the emit), `residence.ts`, `index.ts` (registration and `pro.unions`), `world/calendar.ts`,
`content/tutorial.ts`, `content/guide/career.ts`, `content/guide/documents.ts`, `ui/papers/Documents.tsx`,
`ui/looks/money.tsx`, `ui/shell/sections.ts`, `ui/workspaces/CareerWorkspace.tsx`, `tools/text-inventory.mjs`. Tests
changed: `guide.test.ts`, `cohesion.test.ts`, the 7 OPT-notice tests, the 4 opening-list tests, `need-paths` and
`remaining-09-journeys` (comments only). Generated and data files rebuilt with their tools: `docs/capabilities.json` (a
`career-pay` row), `docs/verification/review-2026-10-13/capabilities.json` (the builder's own reading, verdict partial),
COVERAGE-MATRIX, DEVMAP, TRACEABILITY, TRACE, CAPABILITIES, GAMEPLAY-COVERAGE, the completion matrix and the handoff's
completion line, the text statuses and second-pass files, and `docs/text/surfaces/career-pay.json`.

## The Merge (2026-10-21, After The Agent)

- **Conflicts:** registration and the opening steps (`pro.unions` after the showcase's `showcase.begun`, the four tests
  pinning the list naming both); the Career screen's tabs (Overview, Portfolio, Representation, Work); the guide's
  imports, where the agent's `TEN` (the word "ten") and the pay's `TEN` (the commission's "10%") met, the pay's renamed
  `COMMISSION`; the guide test's list; the text tool's areas; the capability rows and text statuses, merged by key from
  each side's copy; the coverage matrix's chapter table, Representation's row kept and Join SAG-AFTRA added to Your
  Career's; and generated files rebuilt with their tools.
- **Words read again:** the "Your Career" chapter and four of the career guide's groupings of connections had changed on
  both sides. Joined with no word changed, they were printed (`../integration/merged-career-text.ts` and its `.txt`),
  read together and marked again in both passes.
- **Checked on the merge:** tsc -b exits 0; the gate's chain without the suite exits 0, read from a file; 124 test files
  touching the merged code, 1,747 tests, pass.
