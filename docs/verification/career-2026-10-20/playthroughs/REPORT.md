# Brief 19, The Playthroughs: The Joined Career Played As A Player Plays It (V1, A1, L1, V16, J6), 2026-10-21

Branch `b19-play`, from `7bbab80f`, in commits `e308a830`, `0db6aade`, `5daaeed8` and `0099d518`, merged into the working
branch after the audit and the built-app walk. (Its worker couldn't write this file from its own clone; the coordinator
committed it from the worker's report, unchanged in substance.) Every life was played through public commands and the
clock only, each commitment stopping the clock and answered as the top bar answers it (`answerStop`). Nothing a command
or the clock would set was set by hand, but the labeled TEST SETUP that brings a new life to its last term's first
morning. The players live in `tools/career-player.ts` (new). Every project, company and casting office is the game's;
his notices carry his fictional line; nothing claims anything of him beyond the game's data, and nothing contacts anyone
outside the game.

## Status By Item

| Item | Status |
|---|---|
| V1 | Fixed And Verified (seed v1-12) |
| A1 | Fixed And Verified |
| L1 | Fixed And Verified |
| V16 | Fixed And Verified (the graduate's save and the mid-term save) |
| J6 | Fixed And Verified (five gaps fixed with tests; five defects recorded for their areas) |

## The Record

- `transcripts/`: every notice, question, stop (with its answer) and button press, in order: `life-a-v1-12.txt`,
  `life-b-v1-5.txt`, `v16-graduate.txt`, `v16-mid-term.txt`. `play.ts lives` wrote them on the worker's head, and they
  were unchanged when written again.
- `seeds.txt`: seeds v1-0 to v1-39 for both lives, where each went and why.
- `play.ts`: plays the four lives again; its `seeds-a` and `seeds-b` modes are the searches.
- `mutations.txt`: 24 mutations, all killed.

## V1: A Graduating Student Into The Career

**Seed v1-12**, found by playing forty lives: the first whose follow-up brought a request to meet, whose meeting brought
an offer, and whose breakdowns brought a SAG-AFTRA role paid that year. Its showcase and the monologues its reel was cut
from were Working, so the work stood near the bar; five of the seven factors stood at the bar or beyond (four are
needed), and his list's room was beyond it. The follow-up's chance was 0.15 × 1.25 = 0.1875, its draw 0.053; at the
decision the chance was 0.4375 and the draw 0.042.

The life, from `transcripts/life-a-v1-12.txt`:

| When (2029) | What happened |
|---|---|
| Jan 8 | The faculty's two scenes chosen |
| Apr 17 to 27 | Eight rehearsal calls |
| Apr 28 | Headshots ($700.00), a résumé, and a reel cut from the monologues filmed Apr 27 ($250.00) |
| Apr 30, May 1, May 8 | The showcase in New York and Los Angeles, Working, 61 to 62 of 100 |
| May 11 | The follow-up: his office asks to meet her; she checks and sends her materials |
| May 18 | A meeting is set for May 25 at 11 AM, two hours each way |
| May 21 | Commencement; Equity joined, $600.00 down |
| May 25 | Ask To Move at the meeting's stop; moved to June 1 |
| Jun 1 | Meeting kept |
| Jun 6 | Agreement offered; Accept The Agreement |
| Jun 11 to 19 | Submitted for Nell; audition in person; not called back |
| Jun 25 to Jul 5 | Submitted for Desk Clerk in The Calloway Files; sides prepared and taped; offered $1,542.20 a day for two days; accepted |
| Jul 30 to 31 | Shoot days; Join SAG-AFTRA ($3,244.07) |
| Aug 2 | In trust: $3,084.40 gross, $235.95 withheld, $48.58 dues |
| Aug 7 | Paid on: $2,799.87 held, less $280.40 commission, so $2,519.47 into her checking |
| Nov 1 | Equity's $88.00 and SAG-AFTRA's $123.07 dues taken; End It By Agreement |

Commission was only what's over scale: ($1,542.20 − $1,402.00) × 2 = $280.40.

**Tests** (`tests/journey-career.test.ts`), each opening the save made at its transition: "saves and opens the life at
each of its 22 transitions…"; "A1, the School's side played…"; "the School's follow-up passes on…"; "through him…";
"Join SAG-AFTRA after…"; "End It By Agreement…"; "L1: …".

**Twins** (the falsifiability test): sides prepared against taped cold, 59.4 Working against 22.5 Unready; a booked part
prepared against left alone, each shoot day higher by more than five and a band up; a night's sleep against a night
awake, lower tired, the work record naming fatigue.

**Life B, seed v1-5:** the reel cut only after the follow-up, which brought no request to meet; his office asked for an
up-to-date résumé, made and sent; a meeting kept, then the agreement declined and held six months.

## The Audit's Partial Rows: Which Test Closes Which

| Row | Test that closes it |
|---|---|
| `pro.ask_referral` | `journey-career-older.test.ts`: "PLAYER JOURNEY: Ask For A Referral, from the director of the student film her work in was judged Strong: his office's notice read, her materials checked, the referral asked for and her materials sent through it, and his office's answer, a request for a reel" |
| `pro.agent_check`, `pro.send_materials` | `journey-career.test.ts`: "the School's follow-up passes on his office's request to meet; Check Your Materials and Send Your Materials; …" |
| `pro.supply_material` | Life B's "PLAYER JOURNEY: … his office asks for an up-to-date résumé, made and sent with Send What His Office Asked For…" (a résumé, not a reel) |
| `pro.ask_to_move`, `pro.accept_agreement` | "the School's follow-up passes on … moved a week with Ask To Move at its stop, and kept; … accepted with Accept The Agreement" |
| `pro.decline_agreement` | Life B's "PLAYER JOURNEY: … his offer declined with Decline The Agreement, held six months" |
| `pro.end_agreement` | "End It By Agreement ends the agreement that day, says what it leaves owed, and his breakdowns stop coming" |
| A role through him, booked, worked and paid with commission | "through him: … the pay into Stewart Talent's client trust account and on to her less $280.40 commission, and the credit on her résumé" |
| `pro.join_sag` | "Join SAG-AFTRA after her first SAG-AFTRA principal job began: refused before it with its reason, $3,244.07 taken once, SAG-AFTRA's working dues taken from that job's pay, and half a year's base dues taken at the November billing beside Equity's" (a network SAG-AFTRA part through him) |
| `pro.prepare` | "the same booked network part: its preparation done to ready against not at all, judged on its two shoot days, comes out higher each day, and a band higher" |
| The sides | "the same SAG-AFTRA self-tape: its sides prepared to ready … against taped cold, comes out higher, and a band higher" |

## A1

The degree's way into the career plays whole: scenes chosen, rehearsal calls, the portfolio, the showcase in both
cities, the follow-up, and Commencement with Equity; the test checks the notices in the order the player met them.

## L1

`outside` reads her whole life outside the professional record, part by part: identity, abilities, genres, School,
briefs, work and journey, papers, health, body, money (every account and transaction), place, alerts, the calendar
outside the career's, and other systems' notices and questions. Each career command, the first two of each kind, is
compared against a twin moved to the same moment without it; each career item on the clock against two twins played in
the same steps, one with the item called off. What each step may write is listed in `MAY`: 24 kinds were watched, and
none wrote outside its allowance. From start to end: identity unchanged to the byte; School credits, reviews and earlier
courses unchanged; classmates and briefs kept; the work record and journey only grew; abilities, techniques and genres
never lower; earlier earnings, papers, accounts and transactions as posted. Mutation M14 (telling the watcher a work day
may not touch genres) was killed, so the watcher sees what a step writes.

## V16

**The graduate:** `journey-j01-degree-8283f80c` (J01 at `8283f80c`; 4 August 2029). The record built once, Equity dated
at the degree; a second opening builds nothing again; she's told once what Equity is owed, and nothing is charged for a
past date (on November 1 the $600.00 down and $88.00 dues were taken). Played unsigned: an audition in person for Theo in
Paper Moons on August 27, booked; Last Bus To Eastview booked; paid straight to checking with no commission ($250.00
gross, $19.13 withheld, $230.87 net). Then a referral from Paper Moons' director, her student film judged Strong; his
office asked for a reel.

**The mid-term save:** a new fixture, `journey-j01-last-term-8283f80c` (1 March 2029), opens onto the showcase once, with
the faculty's two scenes and 11 calls on the calendar; nothing outside the record changed but the showcase's own pieces;
played to the degree.

**Tests:** `tests/journey-career-older.test.ts`, its five V16 tests.

## J6: Where The Career Touches The Rest Of The Game

Paths under `src/` and `src/engine/`; line numbers at the worker's head.

| Part | Where the career reads or writes it | Held through play by | Drill-down |
|---|---|---|---|
| Calendar | Meetings (`proagent.ts:814`); auditions (`projobs.ts`); work days; showcase calls (`proshowcase.ts:342`); Ask To Move (`proagent.ts:910`); the legend row (`world/calendar.ts`); an entry's trip and cost (`ui/looks/day.tsx:198–205, 589, 661, 676`, new) | The J6 calendar tests (`journey-career-older.test.ts`); the meeting entry (`journey-career.test.ts`) | The Calendar's entry look; the guide's The Calendar |
| School | Showcase attendance (`proshowcase.ts:580`); `awayAt` (`projobs.ts:478`, now with the meeting at `:505`), read by `school.ts` `present`; the outside-work request (`:1428`); unapproved work (`:1140`) | A1; V16 mid-term; `pro-work.test.ts` A3 and V12, the meeting GUARD among them | The School screen's Standing and Classes tabs |
| Attributes and genres | `fitOf` (`:328`); preparation (`:1170`); a day's work is practice in its genres (`:1295`, new); showcase growth (`proshowcase.ts:463, 633`) | "through him…"; the twins | The genre look, Work In It (`ui/looks/actor.tsx:187`) |
| Health and readiness | Meeting presence (`proagent.ts:829`); `there` (`projobs.ts:950`); condition and focus in judging (`:926, :1052, :1170`); preparation refused when injured (`:657`); exertion (`:1280`) | The readiness twin | The work look names fatigue |
| Banking | Headshots and reel (`pro.ts:966, 998`); pay through trust or direct; dues and the SAG-AFTRA fee (`propay.ts:611, 741`) | "through him…", Join SAG-AFTRA, V16 | Money's statements; the Work tab |
| Papers | Permission to work (`projobs.ts:724, 772`; `propay.ts:220`; `pro.ts:685`); `recordWages` (`propay.ts:492`) | L1; `propay.test.ts` | Papers; the Work tab |
| Classmates | Showcase scene partners (`proshowcase.ts:394`) | L1 (classmates kept) | Coursework |
| Profile | `recordWork` (`projobs.ts:939, 1287`); credits; `profileOf` (`pro.ts:741`) | "through him…" (credit, résumé); V16 | The work look; Career's Profile |

**Fixed, each with a test that fails without it:**
1. **A professional day's work wasn't practice in its genres.** It is now (`projobs.ts:1295`); the words on what builds
   Work In It name shoot days (`actor.tsx:187`, `tutorial.ts:424`, `guide/craft.ts:500, 515`, the glossary).
2. **The calendar had no Career row, and career entries said "nothing takes you there".** Meetings, auditions and work
   days carry their own trip, and their handlers never ask the town: each entry says the trip is part of it and what
   missing it costs, as its handler has it; a trip of none (the showcase's calls, which leave from the School) still asks
   for New Haven; the guide's The Calendar says the same. (The built-app walk gave the Career row the same day; the two
   met at the merge and one row was kept.)
3. **An audition in person inside a booked day's hours was gone to and judged.** It's missed now (`workDayAt`,
   `projobs.ts:525`, read at `:1222`); a day already missed frees her, as `awayAt` already read it. Two GUARDs.
4. **Commission read scale from the 2026–27 rate in a later year** ($308.44 where $280.40 was right). `minimumOn`
   (`careerwork.ts:104`) gives the minimum for the work's date. GUARD in `propay.test.ts`.
5. **A meeting at his office didn't take a student out of class** (found by the built-app walk). `awayAt` reads the
   meeting's hour and the trip each way, unexcused. GUARD in `pro-work.test.ts`, with a twin of the same day without the
   meeting.

**Recorded, not fixed by the playthroughs** (each settled on the working branch the same day, after the merge; the
mutations are I9 to I15 in `../integration/mutations.txt`):

| Defect | Evidence | Area | What Became Of It |
|---|---|---|---|
| One missed work day under an agreement counts twice against reliability, once as material not sent | `projobs.ts:1102, 1104` note it on the engagement and the relation; `proagent.ts:365–366` count both | agent, work | Fixed: a request let pass is its own kind, `request-missed`, and reliability counts it, missed auditions he set up and job problems once each (`tests/pro-agent.test.ts`, its GUARD and a twin) |
| A role she has already played is posted to her again ten weeks later and booked again (two Desk Clerk credits) | `life-a-v1-12.txt`, lines 300–461 and 466–575 | work | Fixed: `postingsAt` skips a project with an engagement not canceled or a credit for the part (`tests/pro-work.test.ts`, its GUARD) |
| Low Budget, Ultra Low Budget and LORT minimums stay at their 2026–27 figures in 2029 | `minimumOn` returns `rate.amount` for every rate but SAG-AFTRA's day rate | pay | Fixed for Low Budget and Ultra Low Budget, priced at 65% and 20% of the year's day performer minimum as their rate sheets set them (S33, S32); LORT, the Off-Broadway estimate and the non-union rate stay at the figure on file, said as an assumption at `minimumOn`, since no later LORT minimum was read (`tests/pro-core.test.ts`) |
| An understudy's School credit reads "went on 1 time" | `pro.ts:656` | core | Fixed: "went on once", "twice", "three times" (`tests/pro-core.test.ts`) |
| The profile's "School Journey" panel keeps that title for a graduate in the career | `ProfileWorkspace.tsx:546` | profile | Kept: the panel is the record of the School years, its parts and its half-years' work, which a graduate still has; the career's record is the Career workspace's Profile tab |

Not a career defect: the attentive player never answers the bank's dormancy question, so each life's untouched Chase
Savings went to the state's unclaimed-property office in September 2029 (`life-a-v1-12.txt`, line 465).

## Checks (On The Worker's Clone)

- `npx tsc -b --noEmit`: 0; an independent typecheck (`tsc -p tsconfig.app.json` with its own build info): 0. (`tsc -b`
  writes its build info through a clone's `node_modules` symlink into the shared `node_modules/.tmp`, so the second was
  run to be sure.)
- `npx eslint` on the changed files: 0.
- vitest, one worker: 65 files importing the changed modules, 1,060 of 1,062 (two failures, straight apostrophes in
  `day.tsx`'s comments and `t.genres` read in `projobs.ts`, both fixed and their files passing again); the text and guide
  batch, 53 files (its one failure, the guide's "manager", reworded, and `guide.test.ts` passing); after the meeting fix,
  14 files, 195 of 195; the new journeys, `journey-career` (11 tests, about 172 seconds), `journey-career-older` (8),
  `pro-work` (32).
- The gate's chain without the suite: exit 0, read from a file (contractions 38, "Nothing" openers 0 of 0, guide quotes
  582 of 582, surfaces 306 with 0 problems).

## Shared Files Touched

`src/engine/systems/projobs.ts` (`workDayAt`, `awayAt`'s meeting, a work day's genre practice, `rateOn`, imports from
`proagent.ts` that add a link to an existing import cycle, all tests passing with it); `src/engine/systems/propay.ts`
(`scaleOf`); `src/engine/content/careerwork.ts` (`minimumOn`); `src/engine/world/calendar.ts` (the Career row);
`src/ui/looks/day.tsx`; text in `guide/day.ts`, `guide/craft.ts`, `tutorial.ts`, `ui/looks/actor.tsx` and
`docs/GLOSSARY.md`; text status files for frame, profile, tutorial and career-work; `tsconfig.app.json` (includes
`tools/career-player.ts`); `tests/propay.test.ts` (one GUARD) and `tests/pro-work.test.ts` (three GUARDs). New:
`tools/career-player.ts`, `tests/journey-career.test.ts`, `tests/journey-career-older.test.ts`, the fixture
`tests/fixtures/journey-j01-last-term-8283f80c.json.gz`, and this folder's files.

## The Merge (2026-10-21, The Last Of The Wave)

- **Conflicts:** the calendar's Career row, which the built-app walk and these playthroughs each gave (one kept, the walk's,
  whose list says more; its comment says both found it); the Calendar's How This Works entry, the two sentences for the
  same rule joined and its three lines each taken where it's truer; the frame's text statuses, merged by key, and the
  two joined sources printed (`../integration/calendar-text.ts` and its `.txt`), read and marked again; generated files
  rebuilt with their tools.
- **The whole suite on the merged tree:** 421 files, 5,070 tests: 4 failed in 3 files, each a test pinning one branch's
  words where the merged game says the other's or the joined text (the legend's list, the Equity down payment's name, the
  commission over scale without its amount first, the Calendar's help). Each was brought to what the game says, with a
  comment saying when and why; the three files, 35 tests, pass.
