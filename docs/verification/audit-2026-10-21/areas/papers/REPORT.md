# Brief 20, The Papers Area

The papers area of the owner's brief 20 (`../../criteria.md`, `../INSTRUCTIONS.md`): the `documents.*`, `citizenship.*`
and `health.*` commands and scheduled kinds, the papers looks, the notices the papers and health systems send, and the
promises the guide's Papers and Documents entries make. Worked alone in a clone on branch `b20-papers`.

- **Started from:** `c4832549` (brief 20's D2, on top of its starting point `12c04ee1`).
- **Ended at:** the last commit on `b20-papers` (this report's own), with the code as of `58577aea` and the rows read
  against it.

## The Rows (M1 to M3)

`effects/papers.json`, every row read against the code and none left seeded (`node tools/effects.mjs --todo papers`
lists nothing):

| | Rows | Implemented And Verified | Implemented, Verification Incomplete | Explicitly Deferred |
|---|---|---|---|---|
| Features | 58 | 50 | 2 | 6 |
| The guide's promises | 43 | 37 | 4 | 2 |

So 50 of the 52 features in scope are verified, and 37 of the 41 promises in scope. 43 rows are mechanics, 15
presentation (the four looks and eleven notice rows, each with its purpose).

- **58, not 57:** `health.appeal_decided` is a scheduled kind the code has and the inventory doesn't list (below,
  "Outside My Area"). It has a row of kind `other`, verified.
- **Explicitly Deferred (6), by the owner's scope reset of 2026-10-09 (`docs/REQUIREMENTS.md`):** `documents.naturalize`,
  `documents.residence`, `documents.settle`, `documents.renew_residence`, `citizenship.decided` (the routes to residence
  abroad and the naturalizing they led to went with the career's record and moving abroad), and `health.prepay`
  (England's prescription certificate; every life lives in New Haven, where it's refused). Each command still refuses
  in its own words, and a save that holds such papers keeps them.
- **Implemented, Verification Incomplete (2), because no current life can reach them:** `documents.visit` (only a save
  from before 2026-10-09 holds a visit booked; its handler is tested on visits set up as such a save left them), and
  `notice.systems/health#renewalDue` ("A Prescription Ran Out": only British Columbia's prescriptions run out, and every
  life lives in New Haven).
- **Promises not verified:** two deferred with their features (settling or naturalizing's fee; a naturalized
  citizenship joining the birth one). Four incomplete: each marketplace premium kept for the year's premium tax credit,
  and the Summer Cabaret's stipend as a claim's base-period wages (each half is held, the premiums kept by the clock and
  the stipend paid by the clock, and the return and the claim reading what a test wrote by hand; no test plays either
  through); and two of the Pensions entry's (a pension's income on the return, a payment into the account), which no
  life born about 2002 can claim.
- **Two promise rows share one id**, `promise.documents.passport-id>documents.work` (three connections from Passport And
  ID to Permission To Work), so `tools/effects.mjs --check` reports "named again" twice. Each of the three is read and
  verified on its own claim. The fix is the tool's (below).

## The Comparisons (B1, B3)

Each is a test the gate runs: twins from one seed, alike but for the input, through the commands the screens send and
the clock, with a no-leak side asserted equal.

**Permission to work** (`tests/b20-papers-work.test.ts`). Born in New York (a citizen) against born in London (British,
on an F-1), seeds `b20-papers-work` and `b20-papers-opt`:
- At school, the same offer of two days of outside work in the winter recess (21 and 22 December 2026): the citizen
  takes it, booked with both days; the F-1 student is refused at `pro.accept_offer`, "Your F-1 lets you work only on
  campus while you’re a student, so you can’t work for an employer outside the School. That rules out work on December
  21, 2026.", and nothing in the save changes. No leak: the same roles posted to both (project, moment, way), and the
  School's Take A Shift books both the same four-hour evening.
- After the degree (TEST SETUP: Commencement brought forward to 3 September 2026, the F-1's program end moved to
  1 October): the same October offer, taken by the citizen and refused the graduate ("There’s no permission to work in
  the US among your papers…"). On 1 October at the program's end she's asked Your US Status Is Ending, due 30 November
  at eleven (sixty days of hours, the clocks gone back), with Apply For OPT and its premium button; the citizen is asked
  nothing. Premium pressed on Home: $2,250 once, the question settled. Pending, an offer for 9 November is still
  refused. Decided on the thirtieth federal workday, Monday 16 November (Columbus Day and Veterans Day not counted):
  OPT Approved, November 16, 2026 to November 16, 2027. The same December offer is then hers to take. Saved and opened
  there and played to March against the life played straight: its two days worked counted, 96 days without work, OPT
  Ended and Out Of Status once each on Monday 22 February 2027, the same notices both ways. (The run where she missed
  the shoot, played without stopping at the work day, ended a week earlier, 15 February: the two days worked moved it a
  week.) The April offer is refused her and taken by the citizen, whose papers never moved.

**A passport and an ID** (`tests/b20-papers-ids.test.ts`):
- A British student whose passport runs out on 11 December 2026 (TEST SETUP: its end moved; a life's own runs out two
  to ten years on). Renewed on 1 October: £116.50 from abroad, in dollars once; issued on its day, 22 October, once
  played in steps and once saved, opened and jumped there in one move; the old one canceled. Her twin who let it run
  out is refused on 14 December by a new bank ("needs a valid photo ID…"), the Social Security office ("The office
  asks for your passport…") and the DMV ("…a primary identity document in force…"), nothing charged; Going Abroad says
  a visit needs a passport in force; its page says it ran out. The renewer opens the account, applies for the number,
  and a visit to France reads open. No leak: the F-1 valid and the status held in both, the same standing, the same
  answer from Take A Shift.
- A New Yorker who began with no passport and no license (seed `b20-papers-noid-5`, the sixth of a fixed list, the first
  whose creation drew neither): Connecticut's card applied for on the first morning, $28 once, mailed on the twentieth
  business day, to her birthday seven years on (14 June 2034), REAL ID; arrived once in steps and once after a reload
  and a jump. A new bank then opens her account and refuses her twin, nothing taken.
- An F-1 student who applies for the number on 31 August: the card 21 days after the hour at the office, once across a
  reload; at the same bank on the same Sunday she opens online, the clock unmoved, and her twin without one is sent to a
  branch for an hour. (On the Saturday her work-study shift held her, and the branch was refused her twin for it.)

**Health cover** (`tests/b20-papers-health.test.ts`), four citizens from a Scraping family, seed `b20-papers-care`,
each withdrawn on 9 October 2026 (Yale Health thirty days more): one enrolls (HUSKY D from 1 December), three don't.
The same forced week (TEST SETUP: Monday 16 November's draw forced to a doctor's visit) books all four alike, Fair
Haven, Thursday 10 December at ten. Kept: free under HUSKY D ("There’s nothing to pay."); $183.98 uninsured, due
9 January 2027 and paid from checking that day once, played and saved-and-opened. The third sleeps through it (Sleep,
eight hours from six): "Missed The Doctor", not seen, not billed, owed; Book An Appointment books 4 January, kept and
billed once at 2027's $187.20. The fourth, uninsured, jumps from the booking past the bill's day in one move: kept
once, billed once, paid once. No leak: the same care on the same days for the covered and the bare twin (two emergencies
under Yale Health at $50 each, the same), differing only in this visit; every health notice of all four carries Go
There to Papers.

**A student's Social Security record** (`tests/b20-papers-pension.test.ts`): citizen and F-1 twins, seed
`b20-papers-cabaret`, both in good standing (TEST SETUP: the coursework prepared each midnight) and in the Summer
Cabaret's company from 1 April 2027. The same Fridays, the same $375 a week before tax. The citizen's first week has
$28.69 withheld, 7.65% FICA and nothing else, and her 2027 earns two credits; the F-1 student's has no FICA, only the
$37.50 her nonresident withholding leaves, and earns none.

## The Defects Found And Repaired (D1, T1)

Each failed its test before the repair and passes after; each repair is mutated back and killed.

**P1, an OPT approved before the program ends said to be in force** (`src/ui/looks/papers.tsx`,
`src/ui/papers/Documents.tsx`). Premium processing in the ninety days before the program's end approves OPT weeks
before its first day (`issuedAt` at the end). The engine never took it as in force before then, but its page said
both "It’s in force until November 4, 2027" and "It no longer lets you work anywhere: it’s out of force.", and the Work
tab's row read In Force. Before: `expected 'It’s in force until November 4, 2027,…' not to contain 'It’s in force
until'`. Now it reads Approved, its page says the day it starts and that it doesn't let her work until then, and from
its day it reads In Force. The guide's Permission To Work entry and `docs/GLOSSARY.md` name the status. Test:
`tests/b20-papers-defects.test.ts` P1. Mutations B20-PAPERS-1 and -2.

**P2, therapy on a public holiday** (`src/engine/systems/therapy.ts`). Only the first session was put on a weekday;
every later one, held or missed, came a week on to the minute, so a course begun on Thursday 12 November 2026 met on
Thanksgiving Day. Before: the second session at 1795730400000, 26 November at five. Now every session goes through
`sessionSlot`, which skips weekends and public holidays where the practice is, as the doctor's appointments have since
2026-10-13; Thanksgiving's moves to the Friday. The thirteen test files that play therapy pass with it. Test: P2.
Mutations -3 and -4.

**P3, medical debt on a Connecticut student's credit record** (`src/engine/content/safetynet.ts`, Papers' Health Cover
note, the guide's Health Cover entry). SLATE kept New York and California as the states that bar reporting medical
debt. Connecticut has barred it since 1 July 2024: Public Act 24-6, "An Act Concerning the Reporting of Medical Debt",
signed on 9 May 2024 (the governor's release on portal.ct.gov, read 2026-10-22). Every life lives in New Haven, so every
played life's debt a year unpaid was reported (40 points, "A Medical Debt Is On Your Record") and the guide said it
would "since you live in Connecticut". Before: the notice of 1 October 2027 was there. Now Connecticut is in
`MEDICAL_DEBT.barredIn`: the debt is still owed, counted and a worry until paid, and never reported; Papers and the
guide say so. Four tests that held the report for a New Haven life now hold that it isn't made
(`tests/evidence-g05-life.test.ts`, `tests/evidence-g03-life.test.ts`, `tests/coverage-gaps-life.test.ts`), and the two
that read the reporting rule itself read it for a life in Chicago, a LOCATION FIXTURE (`tests/defects-g8-6.test.ts`,
`tests/coverage-gaps-life.test.ts`). Test: P3. Mutation -21.

**P4, a value written and never read** (`src/engine/systems/health.ts`). `pruneCareLog` folded care older than the log
keeps into `careArchive`, a yearly count nothing read: no screen, no rule, one test. It's no longer written; the log
still keeps everything a cover change, a claim or an appeal can reach. Before: `expected { '2026': { events: 33, …(1) } }
to be undefined`. Test: `tests/finance-paths.test.ts` (the care log). Mutation -22.

Comments the repairs made untrue say what's no longer so, in the past tense. The text sources changed were read and
marked in the second pass (`--mark2 … --by papers`); the text inventory, surfaces and guide-quotes checks hold.

## The Twelve Kinds, And How I Looked (D1)

1. **Values written and never read:** each field the papers and health commands and kinds write (`PersonDocument`,
   `Person.ssn`, `usOutOfStatus`, `naturalized`, every `HealthRecord` field), grepped for its readers. Found
   `careArchive` (P4). `realId` is read only by the document's page, `policeReport` only by New York's free replacement,
   and a kept visit's `prescribedAt` only where a prescription has a term; each is said so in the code or the guide.
2. **Choices that promise a difference and make none:** expedite and premium, Your Doctor, Your Pharmacy, the dental
   plan, the therapist, enrolling or not; each changes what its row says (comparisons above and the rows' tests). None
   found.
3. **Success reported with nothing changed:** each command's return against the state it writes. A police report in New
   Haven changes only its record, which the guide says. None found.
4. **Effects worked out and never applied:** the shares, fees and days each command works out, followed to their
   postings and items. None found.
5. **A notice or tutorial describing what isn't there:** every notice the papers and health systems send, each read
   against the state it reports, and the 43 promises. P1 and P3 found; repaired.
6. **Counted twice:** each fee, bill, premium and arrival counted across reloads and jumps in the tests above. None found.
7. **Time skipping an obligation:** a passport's and a card's arrival, the Social Security card, an appointment and its
   bill, each reached in one jump of the clock, and OPT's weeks played to their end; each happened once. None found.
8. **Save and load:** a reload in the middle of each of the above. None found.
9. **Impossible scheduling or eligibility:** appointments, therapy, paper visits and OPT's days. P2 found; repaired. An
   OPT approved after the program's end starts at the decision's hour, not the day's start; no offer can be accepted
   for that morning (an offer's days are 35 days after its posting, and acceptance before approval is refused), so it's
   left as it is.
10. **A control wired to the wrong command:** every Gated control on Papers' Passport And ID, Permission To Work and
    Health Cover against the command it runs. All match.
11. **A feature only a test's hand can reach:** `documents.visit`, the prescription notice, and the deferred residence
    and certificate commands; each marked for what it is above.
12. **An opportunity offered again against what's done:** OPT, the number, an ID card, a passport, an appeal,
    enrolling, a course of therapy and booking a doctor, each refused a second time in its words. None found.

## The Mutations (T2)

`../../mutations/papers.json`, run with `mutate.py` in this clone (`../../mutations/papers.txt`): **22 run, 22 killed**,
each by an assertion that names the behavior, none a setup error, none survived. They cover permission to work and the
career's acceptance (-5, -6), OPT's weeks and the status question (-7, -8), photo ID, the passport office and issue
(-9 to -12), the banks' branch rule and the number's arrival (-13, -14), the ID card's arrival (-15), cover, the
appointment and the bill (-16 to -18), Social Security credits and FICA (-19, -20), and the four repairs (-1 to -4,
-21, -22). Mutations 1 to 20 were run before P3 and P4; -16 to -18, on `health.ts` and `appointments.ts`, were run again
on the code as it ends, and each was killed again by the same assertion (`../../mutations/papers.txt` holds the first
run).

## Outside My Area

- **The inventory misses `health.appeal_decided`** (`tools/inventory.mjs`, `tools/effects.mjs`): both map a constant's
  name to one kind across the engine, and `leave.ts`'s `APPEAL_KIND` ('school.leave_appeal') takes `health.ts`'s
  ('health.appeal_decided'). Resolve each constant by its own file or import. The row is here as kind `other`.
- **Promise ids collide** (`tools/effects.mjs`): `promise.<entry>><to>` names two or more connections between the same
  entries alike, five rows across areas ("named again"): papers' passport-id>documents.work twice, benefits'
  taxes.return>bank.accounts and taxes.pay>bank.accounts, craft's productions.cabaret>productions.casting. Number them.
- **The tool reads a promise's tests from `evidence.tests`**, where INSTRUCTIONS.md says `tests`: each promise here has
  both.
- **INSTRUCTIONS.md's text-inventory recipe** (`--mark … --by b20-<area>`) fails the check, "claimed by two areas", for
  a source an area's first-pass file already claims. What holds: `--mark2 <source> Rewritten --by <the owning area>`.
- **Tests of other areas changed by P3 and P4:** `tests/evidence-g05-life.test.ts`, `tests/evidence-g03-life.test.ts`,
  `tests/coverage-gaps-life.test.ts`, `tests/defects-g8-6.test.ts` and `tests/finance-paths.test.ts`, each the smallest
  change the corrected rule asks.

## What's Left

- The four promises above wait on a test that plays a marketplace year to its return, or a Summer Cabaret to a claim;
  the pensions' two, on a life old enough to claim, which none is.
- `documents.visit` and the prescription notice stay unreachable by any current life; nothing in the brief's scope
  books a paper visit or gives a New Haven prescription a term.
- The full gate wasn't run here (the coordinator's, T4). What I ran last, on one worker: my five test files and the
  five of other areas' that my repairs touched, 10 files and 93 tests, all passing (47 s); `npx tsc --noEmit -p
  tsconfig.app.json` (exit 0); eslint on every changed `.ts` and `.tsx` file (exit 0); the text inventory (holds, no
  source Pending), surfaces (306 surfaces, 0 problems) and guide-quotes (581 of 581) checks. `tools/effects.mjs --check`
  reports two problems in `papers.json`, the "named again" above, and `EFFECTS.md` not yet written, a generated page
  that's the coordinator's to write.
