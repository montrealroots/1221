# Brief 19, The Agent: The Relationship, His Interest, The Agreement And Its End, 2026-10-21

The agent's part of brief 19's second wave: G1 to G8, W3, A2, and the playthroughs V5 to V9 with V15's saves. It was
built on `b19-agent` from `692edccd` in eight commits, head `19a3ed2f`, and merged into the working branch after the
showcase. (Its builder couldn't write this file from its own clone; the coordinator committed it from the builder's
report, unchanged in substance.) Every rule names its research source or is an ASSUMPTION said where a player reads it.
Every word and decision of the agent's is fictional, and every message of his says so.

**The limits held.**
- The game uses only his name, the agency, the New York office, the legit department, its published fields, and the
  published policy, quoted through `agencyOf(agent).policy.quote`.
- Nothing from him arrives unasked. His office's answers are scheduled by the player's own send; a referral's notice
  comes from the casting office (`refType: 'pro-referral'`); the follow-up comes from the School.
- No line claims he attended or saw anything ("the game doesn't say he was there").
- No engine file names him. A guard test finds no address, link or phone number in any notice of his.

## Status By Item

| Item | Status |
|---|---|
| G1 | Fixed And Verified: the notice shows once, then sits behind Read The Notice Again; the fictional line is on the panel and on every notice of his |
| G2 | Fixed And Verified: every stage; an unsolicited send refused in the agency's own words; referrals tested on TEST SETUP engagements |
| G3 | Fixed And Verified: a request, a meeting, a pass, no answer; a meeting missed, moved once or kept |
| G4 | Fixed And Verified: waits of a year or six months, something new needed, decisions through the `pro.agent` and `pro.roster` deciders |
| G5 | Fixed And Verified: a reload-and-jump guard notes each event once |
| G6 | Fixed And Verified: seven factors, a gate of four, a capped chance; Why It Went This Way |
| G7 | Fixed And Verified for representation; the opportunities and pay it changes are the work loop's and the pay's |
| G8 | Fixed And Verified: ends by its term, by agreement, by Equity's 90 days and by SAG-AFTRA's 151 and 91 days, and says what stays owed |
| W3 | Fixed And Verified, waiting on integration's call |
| A2, F4 (the agent's half), V5 to V9, V15 (the agent's saves) | Fixed And Verified |

## What's Built (line numbers at the builder's head)

**`src/engine/systems/proagent.ts`:**
- Nine commands, registered in `registerProAgent` (:932): `pro.agent_notice`, `pro.agent_check`, `pro.ask_referral`,
  `pro.send_materials`, `pro.supply_material`, `pro.ask_to_move`, `pro.accept_agreement`, `pro.decline_agreement`,
  `pro.end_agreement`. Each has a refusal the screen reads (`checkRefusal` :515, `referralRefusal` :545, `sendRefusal`
  :571, `endRefusal` :676, and the rest).
- Eight scheduled kinds: `pro.agent_reply`, `_silence`, `_request_due`, `_meeting`, `_decision`, `_offer_lapse`,
  `_term_end`, `_follow_up`. The meeting is a commitment (`requiresPlayer`, `travelMinutes` 120 from New Haven or 30 in
  New York, `locationId` New York, an hour); the reply, the silence and the decision are hidden from the calendar.
- `defineStop` for the meeting (:910): Ask To Move, once, `carry-on`.
- `interestOf` (:292), `chancesFor` (:381), `drawOf` (:391), `caseKeys` (:443), `answer` (:771), `offerAgreement` (:834),
  `coveredDays` (:646), `stillOwed` (:698), `scheduleShowcaseFollowUp` (:859).

**Deciders:** `pro.agent` and `pro.roster` in `src/engine/decided.ts`; every declared input moves the outcome under the
sweep.

**`src/ui/career/RepresentationPane.tsx`:** his panel and the notice, How To Reach Him, Your Materials For Him, The
Meeting, Why It Went This Way (`ui.career-reasons`, open state kept per viewer), The Agreement, History With His Office.

**Help:** the chapter Representation (`src/engine/content/tutorial.ts` :465) and four How This Works entries,
`career.agent`, `career.agent-answers`, `career.reasons` and `career.agreement` (`src/engine/content/guide/career.ts`
:269, :327, :365, :400).

## By Item: Tests, Mutations, What A Player Reads

**G1, the notice.** A callout stands above everything until I've Read This; then the notice sits behind Read The Notice
Again. "Fictional: his words and decisions here are invented." heads the panel and ends every notice of his (`tell`
:174). Tests: `pro-agent` "his panel holds the notice…"; the screen's "G1…"; the journey "GUARD: … hears nothing from
him…". Mutations M1, M30, M41.

**G2 and V5, the stages, the routes, an incomplete submission and its remedy.** The check is refused with
`materialsCheck(…, 'representation', …)`'s words while headshots or a résumé are missing; a referral comes from a
finished engagement judged Strong or better, once per job; an unsolicited send is refused with the agency's quote; each
step is noted once under a stable key. Tests: the journey "the check refuses an incomplete submission…" (saved and
loaded at each step, `breaches` empty); `pro-agent` "offers a referral only from a finished job…"; the screen's "G2 and
V5…". Mutations M2, M3, M4, M5, M39, M42. What a player reads:

> You have no headshots, and every submission starts with one. Press Book A Headshot Session on the Career screen’s
> Portfolio tab. …

> Stewart Talent’s page for New York legit submissions says: “We do not accept unsolicited submissions at this time.”
> The game keeps to it: …

> Pennick Casting has referred you to Jordan Parente’s office at Stewart Talent, from your work as Nell in A House On
> Calder Street. …

**G3, his office's answers.** A request for what's missing comes with a date; sent, the answer follows a week later; not
sent, his office decides on what it had, and the miss goes on record as a problem. A meeting at the office or by video;
missed, it closes the approach; it can be moved once. A pass. No answer: Waiting after two weeks, a no after six. Tests:
the journey's "no answer…", "a request for more…", "slept through, the meeting is missed…". Mutations M14, M15, M16,
M34, M35, M37, M38.

> Six weeks have gone by since you sent your materials to Jordan Parente’s office at Stewart Talent, with no answer. In
> the game no answer by then means no. A new approach can come from April 15, 2027, …

**G4 and V6, no persistence exploit.** After a pass, a year's wait; after no answer, or a declined or lapsed offer, six
months. Something new is needed: a credit, a better reel, a referral, the training's standing, or the showcase. Draws
are keyed by person, agent, approach number and step. Tests: the journey "passed; a year’s hold…; nothing new refused; a
new credit lets the next approach through"; `pro-agent` "GUARD: a reload before the answer gives the same answer…".
Mutations M6, M7, M8, M12, M18.

**G5 and V15, the history.** The journey's GUARD replays the same days with a reload at every step and a long jump: ten
kinds are noted, each once, with the same ids, counts and notices as the straight run. Every journey saves and loads at
its transitions (`cross`). Mutations M13, M32.

**G6, interest and the draw.** Seven factors, each a level against a bar the game sets (never his): Your Work, Stage And
Screen, Training And Experience, Fit With His Department, Availability, Room On His List (Assumed), Reliability. The gate
is four at the bar or beyond; the chance comes from the work's band times the room on his list, capped at 0.85; the last
decision's reasons are kept. Tests: `pro-agent` "works out each factor apart…" (a first year falls short of the gate);
"high skill raises the chance and never makes it certain…" (at the top band, over 200 seeds, both answers come; a better
band gives more meetings); the roster draw; the screen's "G6 and G7…". Mutations M9, M10, M11, M27, M28, M31, M33, M40.

**G7 and V8, the agreement.** Every term is copied in and shown with its basis, A Published Rule or The Game's Own Term.
The offer stands 14 days, then lapses. Accepting sets `accepted`, `signedAt` and `endsAt` a year on, and the relation
`represented` with its `agreementId`. Declined or lapsed, the approach is held six months. Tests: the journey "offered
with every term…; accepted…; declined…; let lapse…". Mutations M17, M19, M43.

**G8 and V9, the endings.** By its term, on its own. By agreement (ASSUMPTION: his office agrees to a release). By
Equity's 90 days with no real offer of covered work through him, not while working (S29, S27). By SAG-AFTRA's 151 days
and fewer than ten days' covered work in the last 91 (S2, read directly from its help pages). Covered days are counted by
calendar date. Ending sets `endedAt` and `endedHow` and says what stays owed, the 60-day tail among it. Tests: the
journey's "by its term…", "by agreement…", "by the player under Equity’s 90 days…". Mutations M20, M21, M22, M23, M44,
M45. Equity's four-week condition isn't modeled: the agreement's own words count any real offer.

**W3, the School's follow-up.** Put on the calendar three days after the last performance at 10 AM, once per showcase.
It asks to meet only from the factors, the showcase's band among them, and the draw. A request it passes on stands 30
days, and a send answering it goes straight to a meeting. It writes `pro.showcase.followUp = { at, agents }`, `agents`
the offices that asked. Tests: `pro-agent` "put on once, it comes through the School, never claims he was there…" and
"asks from the factors, the showcase’s band among them…". Mutations M24, M25, M26.

**A2, representation while enrolled.** The journey "a first-year introduced, met and signed is still enrolled in good
standing…": `usWorkAuthorized` and `eligibilityOf` are equal before and after signing. Mutation M29.

## Assumptions (Said Where They Apply)

- Answers come in two weeks; no answer in six weeks means no.
- Material asked for is due in three weeks; the answer after sending it comes in a week.
- Meetings are on a weekday at least a week out, at 11 AM, for an hour; the trip two hours from New Haven or half an
  hour in New York, and by video from elsewhere. A meeting can be moved once, a week on.
- The decision comes five days after a meeting.
- The waits after a pass, no answer or a declined offer; something new needed to approach again.
- The bar for a referral (Strong); the gate of four; the chances and the cap; the roster draw.
- A missed meeting closes the approach.
- The follow-up comes three days after the showcase, and its request stands 30 days; agencies follow the showcase
  through the School.
- A later approach after a route isn't unsolicited.
- His office agrees to a release.

## The Built App (`screens/`)

Walked at 1440 and 390 on the clone's `dist/index.html` (`walk-log.txt`), from saves made by `make-saves.ts` and walked
by `agent-walk.mjs`: the arrow keys reach the Representation tab and it takes the focus; the notice shows once, then sits
behind Read The Notice Again; Why It Went This Way and the agreement open and read in full; On The Way names the meeting
and Ask To Move, and at the stop Ask To Move moved the meeting a week and the clock carried on; no page errors, no
sideways scroll, every button named. Found and fixed on the walk: at 390 the factors' table clipped its reasons, so each
factor is a block now. Still to fix, the clock's: at 390 the stop's footer, with Ask To Move as a third button, runs a
few pixels past the dialog's edge (`TimeControls.tsx`).

## Checks Run (On The Builder's Clone)

- `npx tsc -b --noEmit`: exit 0 (`runs/typecheck.txt`). `npx eslint` on every changed file: exit 0 (`runs/eslint.txt`).
- The gate's chain without the suite: exit 0, read from `runs/checks-exit.txt`. Engine-speak 316, unchanged; guide quotes
  578 of 578; surfaces 4,413 of 4,413 claimed; the completion matrix 566 of 649.
- vitest at one worker, on 67 files that import a changed module or read the chapters, guide, registries or stop: 977 of
  980 passed (`runs/vitest.txt`). Two failures were the builder's and fixed (cohesion, on one-dot kinds; pro-core, on no
  agent named in the engine). One was the branch's, failing at `692edccd` already: `tests/interface.test.ts`, which found
  no screen naming `'calendar.skip'` once the clock moved it into the stop registry. The rerun of 11 files passed 203 of
  204, only that one remaining (`runs/vitest-rerun.txt`).
- Mutations: `mutations.txt`, 45 run, 45 killed. A redundant materials check in the send and the referral, which only
  survived, was removed.

## For Integration

- Call `scheduleShowcaseFollowUp(sim, person, lastPerformanceAt)` where the showcase's last performance is judged; the
  showcase doesn't write `followUp` itself.
- The work loop should set `ProCredit.band`, `Engagement.agreementId` and `Opportunity.offer.at` for offers through him:
  the referrals, the 90-day rule and the 151 and 91-day rule all read them.
- The chapters run Your Career, Representation, Papers; the other builders' chapters are chained in at the merge.
- The calendar has no legend row for the career; it falls back to the word "Career".
- The kinds use one dot (`pro.agent_reply`, …): the cohesion test sees only a one-dot kind's constant.

## Shared Files Touched

- **Engine:** `systems/pro.ts` (`RelationStage` gains `'unanswered'`; `AgentRelation` gains `referrals` and `why`;
  `ShowcaseRecord.followUp` documented); `index.ts` (registration); `decided.ts` (two deciders); `content/tutorial.ts`
  (the Representation chapter, and Your Career's last line); `content/guide/career.ts` (four entries and the `Section`
  type).
- **Screens:** `ui/shell/sections.ts`, `ui/workspaces/CareerWorkspace.tsx`.
- **Tools:** `tools/text-inventory.mjs` (the `career-agent` area in `AREAS2`).
- **Tests:** `guide.test.ts` ("agent" and "showcase" off its list); `evidence-g02-life.test.ts` and
  `evidence-g32-ui.test.ts` (the chapter count and order).
- **Docs:** regenerated by their tools (`COVERAGE-MATRIX.md` with Representation inserted as row 14, DEVMAP, TRACEABILITY,
  `TRACE.md`, `CAPABILITIES.md`, `GAMEPLAY-COVERAGE.md`, the completion matrix, the text inventory, `SURFACES.md`);
  added to `capabilities.json` (`career-representation`, Implemented), `review-2026-10-13/capabilities.json` (the
  builder's own reading), the text statuses and second-pass files (`career`, `tutorial`, `frame`, `career-agent`) and
  `surfaces/career-agent.json`; the handoff's completion line.

## The Merge (2026-10-21, After The Showcase)

- **Conflicts:** registration, the tutorial's imports, `ShowcaseRecord` (the showcase's fields and the follow-up's
  comment), the text tool's areas, the guide test's list (now without "showcase" and "agent"), the capabilities rows
  (merged by id from each side), the handoff, and generated files rebuilt with their tools.
- **W3 wired:** `endShowcase` (`src/engine/systems/proshowcase.ts`) calls `scheduleShowcaseFollowUp` from the last day the
  showcase had, only where something was played. The showcase's journey now holds the follow-up three days after Los
  Angeles at ten and the School's notice; its missed-days journey holds that a showcase with nothing played gets none
  (`../integration/mutations.txt`, I1 and I2, killed).
- **An import cycle the wiring made:** the School loads the showcase, which now loads the agent, whose sentences read the
  School's `countWords` as the module loads. `countWords` moved to `src/engine/core/text.ts`, which needs nothing loaded;
  the School still offers it.
- **A test failing since the showcase's merge:** `tests/cohesion.test.ts` read the showcase's two kinds as scheduled
  nowhere, because its helper took the kind as an argument; the helper takes a named `kind:` now. The coordinator's run
  of the showcase's merge hadn't included that file.
- **Checked on the merge:** tsc -b exits 0; the gate's chain without the suite exits 0, read from a file; 63 test files,
  801 tests, pass but the cohesion test, fixed and passing with the showcase's 15.
