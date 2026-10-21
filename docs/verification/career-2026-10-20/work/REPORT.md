# Brief 19, The Work Loop: Opportunities To Credit, The Agent's Submissions, The Unsigned Path, Work While Enrolled, A Leaver's Routes, The Tutorial's Job Guard (J1 To J5, A3, A4, D9, F4), 2026-10-21

Branch `b19-work`, built from `692edccd` in commits `ff7d1065`, `38894ad1` and `9c0c7137`, and merged into the working
branch after the pay. (Its builder couldn't write this file from its own clone; the coordinator committed it from the
builder's report, unchanged in substance.) Everything below was tested on `9c0c7137`. Every project, company, casting
office and line of the agent's is fictional, and nothing contacts anyone outside the game. The agent's relationship and
agreement, and the pay, belong to other builders; where this part needs them, its tests build them as labeled TEST
SETUP. The two places integration wires were marked with comments.

## Status By Item

| Item | Status | What's left |
|---|---|---|
| J1 | Fixed And Verified | |
| J2 | Fixed And Verified for the loop's stages | The payment and commission are the pay's (`schedulePay`, wired at the merge) |
| J3 | Fixed And Verified against a TEST SETUP agreement | Run again on the agent's agreement; scale plus ten comes with `negotiatedAmount` (wired at the merge) |
| J4, J5, A3, A4, D9 | Fixed And Verified | |
| F4 | Fixed And Verified for the work half | |
| V2, V3, V10, V12 | Fixed And Verified (played tests) | |
| V11 | First half Fixed And Verified | The payment half is the pay's |
| V13 | The loop's half Fixed And Verified | The pay corrects what `usWorkAuthorized` says for OPT |
| V15 | The loop's transitions verified (V10's and V11's saves at each stage) | The agent's and the pay's are theirs |

## J1: Fictional Opportunities, Posted On A Schedule

- **Built** (`src/engine/systems/projobs.ts`): `post` (:764) makes the opportunities from `content/careerwork.ts`'s seven
  projects; `datesOf`, `payTermsOf` (:282) and `payWords` (:296) give the dates and the pay; `eligibilityProblems` and
  `fitOf` (:325) eligibility and fit. The passage reactor `pro.postings` posts each Monday at 9 AM; the decider
  `pro.posting` (`postingsAt` :396, `src/engine/decided.ts`:567) draws by week, project and route, its inputs
  representation and the postings already on record. `reachOf` (:386) keeps agent-only roles away from unrepresented
  actors. Every card says it's fictional where it's first shown (`OpportunitiesPane.tsx`).
- **Tests** (`tests/pro-work.test.ts`, "J1"): Monday postings with their facts, no re-posting within ten weeks, windows
  lapsing, pay terms by rate, and `reachOf`'s rule.
- **Mutations:** M1 survived the first run (the chance table has no open chance for an agent-only kind) and was killed
  once `reachOf` was asserted directly; M2 killed.

> The film's director posted Theo in Paper Moons.

> Every project, company and casting office here is invented for the game: no real production is casting.

## J2: The Stages

- **Built:** submission (`submitRefusal` :584 and `materialProblems` :575 call `materialsCheck`); the audition, in person
  as a scheduled item with its trip, or a self-tape judged through `evaluate` with the tape profile; a callback where the
  project has one, then the casting decision (`CASTING_KIND` :1183); the offer (`makeOffer` :930, a decision with Accept
  The Offer and Decline The Offer, standing three days); preparation, sides then the part, through `BRIEF.steps`
  (`pro.prepare`); work days, `requiresPlayer` items with their trip, each judged by `evaluate` and recorded with
  `recordWork` (`WORK_DAY_KIND` :1215); a missed day, covered by the stage's understudy, or on a shoot the actor
  replaced; credits, a stage credit at the first night (:1242) and a screen credit at wrap (:1029), released later
  through `releaseScreenCredit`; `keepBounded` after each settle.
- **Tests:** V10 (a student film, saved and loaded at each stage); V11 (a LORT callback and run); "what missing a step
  costs" (four journeys); a late self-tape refused.
- **Mutations:** M18 to M22, M25, M27, M31, M44 and M45, killed.
- **Assumptions:** every `WORK` timing (:105), the `MISSES` allowances, `RELEASE_DAYS`.

## J3: The Agent's Part

- **Built:** while `activeAgreement` holds, his breakdowns bring agent-only roles in his department's published fields
  (`inScope`); `agentTries` (:801) submits where the materials pass, says once what holds a submission back, and tries
  again without repeating itself; his notices pass on answers and offers; `agentId` and `agreementId` are set on the
  opportunity and the engagement; his relationship's history is keyed `opp:<id>:<key>`; his lines are procedural, each
  with the agency's "Fictional: his words and decisions here are invented."
- **Test:** "J3", a PLAYER JOURNEY over seeds.
- **Mutations:** M24 and M29 killed; M23 withdrawn (scale plus ten passed to the pay's `negotiatedAmount`); M46 (`offer.at`)
  and M47 killed; M48 equivalent until the merge.

> Jordan Parente didn't submit you for Jess in Static On Route 9. You have no headshots, and every submission starts
> with one. … Jordan Parente can still submit you until September 14, 2026, once that's put right.

## J4 And F4: The Unsigned Path, And What A Submission Reads

- **Built:** open calls can be pursued without an agent; agent-only roles say why they can't; an Equity members' call
  says what membership takes; playing ages are read with three years either side; what's missing is said in its
  practical words and blocks the submission.
- **Test:** "F4 and J4". **Mutations:** M3 to M5 and M30, killed.

> Pennick Casting takes submissions only from agents, so you can't submit yourself.

> You have no résumé. Press Make Your Résumé on the Career screen's Portfolio tab: it takes an hour, from your record.

## J5: Casting Decided Apart From Quality

- **Built:** `chanceOf` reads the band, the fit and the field, capped at 0.8; availability checked, never drawn
  (`bookedClash` at casting); eligibility checked at acceptance; the field of other actors drawn by `pro.casting`
  (`castingDraw` :414, decided.ts:585).
- **Tests:** "J5": the chance rises with band and fit and never reaches certainty; over 30 seeds a skilled actor loses a
  role and a developing actor books one; another actor cast once availability changes.
- **Mutations:** M6 to M10, killed. **Assumptions:** every `CASTING` figure.

## A3: Work While Enrolled

- **Built:** `inSessionAt` (:429) tells whether a day falls in term; `conditionsFor` (:516) reads six conditions, the
  design's assumptions said in the words; `pro.request_outside_work` is decided by the dean seven days later; unapproved
  work in term brings, through `reportUnapproved` (:1092) and `setStanding`, an academic warning the first time and
  dismissal the second; `awayAt` (:474) makes the School count a student absent (`present()`), and approved work's class
  days are excused; summer is the student's own unless a School call holds them (`schoolCallsOn` :450 reads the School's
  category too); an F-1 student's request is refused, since CPT isn't offered for Acting.
- **Tests:** "A3": V2 approved and worked, refused, unapproved then dismissed, the session calendar; a summer hold; a
  showcase call.
- **Mutations:** M13 to M17, M32 to M34, M50 and M51 killed; M52 survived, and its redundant guard was deleted.

> The Dean Approves Your Outside Work | The chair of Acting recommended your request, and the dean approved it in writing
> … The class days it takes are excused.

## A4 And V3: A Leaver

- **Built:** the School's rule reads only students (`schoolEnded`); training is said by `trainingOf`.
- **Test:** "V3 and A4", from `school.withdraw` to a booked, worked and credited student film.

> You studied acting in the MFA program at the David Geffen School of Drama at Yale University for one term, 2026, and
> didn't complete the degree.

## V12 And V13

- **V12:** an audition against a plan is said to clash, and Ask For Another Time moves it once; classes clash in term; a
  second booking on the same days is refused. Mutations M12, M16 and M26 killed.
- **V13:** an F-1 student in term is refused at acceptance in words, with nothing changed; a citizen is warned, not
  refused. Mutations M11 and M34 killed.

## D9: The Tutorial's Job Guard

`tests/tutorial.test.ts`:108 to 160: `WORK_THE_GAME_HAS`, `WORK_IT_HASNT` and `OFFERS_WORK`, with a fixture test showing
the guard still fails as the old one did. M35 survived, then was killed by "Land a job in a student film."

## The Screen, The Help, The Walk

- **Screen:** `OpportunitiesPane.tsx`: Open Calls, Through An Agent, In Progress, Offers, Booked Work and Settled; every
  control gated and its button grayed with the reason.
- **Help:** the guide entries `career.opportunities`, `career.auditions`, `career.offers` and `career.outside-work`; the
  tutorial's "Finding Work" opens all seven commands.
- **Tests:** `tests/pro-opportunities-screen.test.ts`, 5 tests; mutations M37 to M41 and M49 killed.
- **Walk:** the built app on port 4183, serving the clone's `dist/index.html`, at 1440 and 390, on three played saves; no
  sideways scroll and no errors. It found the techniques reading as four things for two, and two sentences opening in
  lowercase; all three fixed and tested, before and after in `walk/`.

## Runs (On The Builder's Clone, `9c0c7137`)

- `npx tsc -b --noEmit`: exit 0. `npx eslint` on the 17 changed source, test and tool files: exit 0.
- vitest, one worker, 36 files: 648 passed and 1 failed, the `interface.test.ts` calendar.skip failure that came with the
  clock's merge (fixed on the working branch since, `2e4c1b99`). After the last change, 7 files, 221 tests, passed.
- The gate's chain without the suite: exit 0, read from the file. Voice-check 38 of 40; "isn't … it's" 8 of 8; "Nothing"
  openers 0 of 0; the completion matrix 566 of 647.
- Evidence: `mutations.txt` (M1 to M52), `transcripts/`, `walk/`, `runs/`.

## For Integration (As The Builder Left It)

- `schedulePay` at `pro.accept_offer`, right after `e.pay = promisedPay(...)`; keys `<engagementId>:<n>` from 1;
  `promisedAt` the acceptance; `due` noon on the Thursday after each week (ASSUMPTION). Entries are only promised:
  nothing posted, nothing received. A replacement drops unreceived weeks with nothing worked and cuts a day-rate week to
  the days worked, reading the week from the key.
- `negotiatedAmount` in `makeOffer`: the offer stayed at scale, its words reading `offer.amount`; J3 expected $257.00
  until the merge, and $282.70 and "above the … minimum of $257.00" after it. Until then M48 couldn't be killed, and the
  Finding Work chapter's line that the agent asks scale plus ten wasn't yet true.
- `acceptRefusal` (:683) is the one acceptance refusal; the pay's `workEligibilityRefusal` and `sagWorkRefusal` join it.
- Work days carry `refType 'pro.engagement'`, `refId` and `payload.engagementId`; auditions come before any engagement,
  so they carry `refType 'pro.opportunity'` and the opportunity's id.
- `band` is on the stage credit at the first night and the screen credit at wrap; the engagement's `agentId` and
  `agreementId` come from `activeAgreement` at acceptance; `offer.at` is on every offer; the opportunity's `agentId` is
  set at the offer for the actor's own submission while represented too, so "came through him" filters on
  `via === 'agent'`.
- School calls are found by the School's category as well as `school.*` kinds: a summer booking meeting one is refused,
  and an offer in term names it; being away counts as absent through `present()`.
- `sag.eligibleSince` and Equity's `'contract'` are set at a first worked day. No `ONCE_ON_OPENING` step. Only
  `CITIES.get` is used; the Providence gazetteer entry wasn't fixed. Schema 94, optional fields only.

## Shared Files Touched

- `src/engine/systems/pro.ts`: optional fields on `Opportunity` and `Engagement`; the types `PartPrep` and
  `AuditionRound`.
- `src/engine/systems/school.ts`: `present()` reads `awayAt`; the class handler excuses approved work.
- `src/engine/index.ts`: `registerProJobs`.
- `src/engine/decided.ts`: `pro.posting`, `pro.casting`, and the `represent` TEST SETUP.
- `src/engine/content/tutorial.ts`: the "Finding Work" chapter, and the career chapter's last line.
- `src/engine/content/guide/career.ts`: four entries.
- `src/ui/shell/sections.ts` and `src/ui/workspaces/CareerWorkspace.tsx`: the tab.
- `tools/text-inventory.mjs`: the `career-work` area rule.
- Tests: `guide.test.ts`, `tutorial.test.ts`, `evidence-g02-life.test.ts`, `evidence-g32-ui.test.ts`.
- Generated or recorded: COVERAGE-MATRIX, `capabilities.json` and CAPABILITIES.md, `review-2026-10-13/capabilities.json`,
  GAMEPLAY-COVERAGE, DEVMAP, TRACEABILITY, TRACE.md, the completion matrix and the handoff's completion line, the career,
  tutorial and frame text statuses and second pass, SURFACES and INVENTORY.

## The Merge (2026-10-21, The Last Of The Four)

- **Conflicts:** registration; the deciders (the agent's and the work loop's sections, each kept); `Engagement`'s fields
  (the pay's `eligibility`, the loop's `prep`, `log` and `school`); the School's imports; the Career screen's tabs, in the
  design's order: Overview, Portfolio, Representation, Opportunities, Work; the guide's imports and entries; the guide
  test's list; the text tool's areas; the capability rows and text statuses, merged by key from each side's copy; the
  coverage matrix's chapter table, Representation and Finding Work both kept and the rows after them renumbered; and
  generated files rebuilt with their tools.
- **The chapters chained:** Your Career, Representation, Finding Work, Papers; Representation's last line now sends the
  player to Finding Work. Five groupings of the career guide's connections and the three chapters were printed
  (`../integration/merged-career-text.ts` and its `.txt`), read in order and marked again in both passes.
- **Wired:** `schedulePay` where an offer is accepted; `negotiatedAmount` where an offer is made, so an offer through him
  on SAG-AFTRA work is scale plus ten; the pay's `sagWorkRefusal` in `acceptRefusal`. The pay's `workEligibilityRefusal`
  was wired there too and taken out the same day: it refuses only where a date fails `usWorkAuthorized`, the loop's own
  check just before it, so its mutation survived.
- **A mismatch found and fixed:** the pay read a payment's days as the calendar week before its payday, while a run's paid
  weeks start on its first Tuesday, so a week of six nights would have been one day's hours. Each payment now carries
  the days it pays for (`ProPayment.week`, written by `promisedPay`), and the pay reads them first (`weekOf`).
- **Tests the joined game changed, each with when and why:** `journey-agent`'s history guard (a year represented now
  notes the roles he handled, so the 80-event cap rolls the relationship's first steps off; each still counted once);
  `pro-work`'s two graduates (the degree's Equity bill is read before the casting office's answer), J3 (the offer at
  $282.70, played on to the pay passed on with $102.80 commission), the LORT run (paid for each week's own days, 48 hours
  for six nights) and a new GUARD for SAG-AFTRA's 30 days at acceptance; `pro-opportunities-screen` (Representation read
  before Finding Work); `evidence-g02-life` (18 of 20 chapters read).
- **Mutations at the merge:** I4 to I8 in `../integration/mutations.txt`: four killed, one survived and its line removed.
- **Checked:** tsc -b exits 0; the gate's chain without the suite exits 0, read from a file; the whole suite on the joined
  tree, 418 files and 5,039 tests, had 5 failures in 4 files, each above, fixed; those files and the career's others, 17
  files and 349 tests, pass.
