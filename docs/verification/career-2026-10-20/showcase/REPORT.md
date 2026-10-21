# Brief 19, The Showcase: The Actor Showcase, The Degree's Way Into The Career, And No Early Degree, 2026-10-21

The showcase part of brief 19's second wave: W1 and W2, the School's side of A1, and A5 with V4. It was built on
`b19-showcase` from `692edccd` in four commits (`fe4e73d1`, `8534f276`, `ae81b5a8`, `8d59e3cf`) and merged into the
working branch. (Its builder couldn't write this file from its own clone; the coordinator committed it from the
builder's report, unchanged in substance.)

Every rule names its research file and source id, or is marked ASSUMPTION. The research file is
`docs/research/career-2026-10-20/yale.md`; its sources are B27 (the Bulletin 2026–2027), B26 (2025–2026), and SC25 and
SC26 (the School's showcase pages). Nothing here names, promises or mentions an agent's attendance, interest or
follow-up. The showcase is said to be presented to "agents, managers and casting directors", as the Bulletin says, and
that's all.

## Status By Item

| Item | Status | What's left |
|---|---|---|
| W1 | Fixed And Verified | |
| W2 | Fixed And Verified | |
| A1 (the School's side) | Fixed And Verified for the School's side | The career's side (the follow-up, W3, and the work) is the other builders'; V1 plays it whole |
| A5 | Fixed And Verified | |
| V4 | Fixed And Verified | |

## Found First

DRAM 793b, Actor Showcase, was already in the catalog (`src/engine/content/school.ts:236`), meeting three times a week in
the last spring, and its scene template in the coursework (`SHOWCASE_SCENE`, `src/engine/content/coursework.ts`). Since
the scope reset:
- the course set a drawn class scene every fortnight, shown in class and then again with the note taken;
- nothing followed its classes: the term review at five on the last class day settled it with the rest, and Commencement
  came three weeks later;
- the template's notes still said "in front of agents there's no second take" and "shown to the industry";
- `systems/school.ts` said the last spring "ended in the Actor Showcase for the agents until the career went".

The game has Incompletes (`systems/courserecord.ts`): a course passed short only of excused absences is Incomplete; it's
made up in sessions within a month, and the deadline can be extended once by another month; one not made up becomes
Permanent. So the Bulletin's rule reads Incompletes as they are: a fall Incomplete given its extra month is the one that
can still be open at the spring's fourth week.

## W1: The Showcase In The Last Term, At Each Year's Own Dates, With Its Eligibility

**Built** (`src/engine/systems/proshowcase.ts`):
- **`beginShowcase` (:328).** The School's term handler calls it for the program's last term
  (`src/engine/systems/school.ts:3448`); an older save's first opening calls it once (`showcase.begun`,
  `src/engine/index.ts`). It fixes the course's options, puts the fourth week's check, the rehearsal calls and the three
  days on the calendar, and sends a notice. It begins nothing once the last day is past.
- **`showcaseCalendar` (:156).** Every date comes from the term's own calendar, never a year's: New York on the first
  Monday after the last day of classes and the Tuesday after it, Los Angeles on the Tuesday a week later. This follows
  SC26 (in 2026, New York April 27 and 28 and Los Angeles May 5, after classes ended April 24 and before Commencement on
  May 18, B26 p.6), and SC25 the same pattern. For the class of 2029 it gives April 30, May 1 and May 8, after classes
  end on April 27 and before Commencement on May 21.
- **Each day is one School call from New Haven, with the trip inside its hours (`travelMinutes: 0`).** ASSUMPTION, said
  in the code and on the panel's source line. The hours are SC26's showings: New York Monday 1 PM to 11 PM (the 5 PM and
  7:30 PM showings); New York Tuesday 9 AM to 5 PM (the 1 PM showing); Los Angeles Tuesday 9 AM to 9 AM the next day (the
  flight out, the 1 PM, 4:30 PM and 7 PM Pacific showings, and the overnight flight home). Los Angeles's call first ran
  from 7 AM; it moved to 9 AM because a life played on without the clock stopping was often still asleep at seven, and
  the header comment says so.
- **Eligibility (`decide`, :411).** The Bulletin (B27 p.26): a student with an outstanding Incomplete "must satisfy the
  course requirements by the fourth week of their final semester and before course DRAM 793b, Actor Showcase, begins".
  Read as: enrolled in the last term (the program's term alone settles it; a leave adds its terms to the offset, and an
  additional term comes after the sixth); and no course Incomplete when the fourth week ends, read as its Friday at five
  (ASSUMPTION).
- **A student kept out:** the calls come off the calendar, and the course is settled at the review with the rest; its
  classes set their work as they always had. The reason is given in the notice, the refusal and the panel.
- **A student who is in but hasn't chosen:** the faculty choose for them (`facultyChoice`).

**What a player reads** (`screens/sequence-last-term.txt`, `screens/panel-*.txt`, `walk/*.txt`):

> Your last term ends with the Actor Showcase: two scenes you choose and rehearse, which the Bulletin says are presented
> to agents, managers and casting directors. You play them in New York on April 30 and May 1, and in Los Angeles on
> May 8. Choose your two scenes by Friday, February 2, 2029, under The Actor Showcase on the School's Coursework tab. To
> take part, you need every Incomplete made up by then.

> Tuesday, May 8, 2029, from 9 AM to the next morning, for the showings at 1 PM, 4:30 PM and 7 PM Pacific time.

> Acting III was still incomplete at the end of the term's fourth week, and the Bulletin keeps a student with an
> Incomplete outstanding out of the Actor Showcase. Its calls are off your calendar, and Actor Showcase is settled at the
> term review with your other courses. Make up what's still incomplete on the Standing And Craft tab: an Incomplete
> still open at Commencement keeps you out of it too, and holds the degree.

**Tests** (`tests/pro-showcase.test.ts`):
- "the last term begins its showcase…": 2029's check, eight rehearsal calls and three days, each a School call from New
  Haven with `travelMinutes: 0`, and the notice word for word.
- "a student a year behind after a year's leave has the showcase at 2030's own dates…": a personal leave asked, the
  return noticed, registered back, then 2030's April 29, April 30 and May 7, after classes end April 26 and before
  Commencement May 20.
- "an Incomplete still open at the end of the fourth week keeps her out…; made up in time, the same student is in…":
  both ways from one life, the make-up sessions run through the command. Kept out, her classes set their scenes after
  the fourth week; in, the course's work is the faculty's two scenes alone.

## W2: Scenes Chosen, Prepared, Scheduled, Performed, Judged And Recorded

**Built:**
- **The options and the faculty's note** (`offer` :251, `showcaseOptions` :278). Four scenes of the course's kind (prose
  two-handers), each in either part, ranked by the judge's own fully prepared forecast for this actor (`sceneForecast`,
  the preview How You'll Play It uses), then ten points for a genre known (the better of familiarity and work in it),
  then five for a scene shown Strong or better before. Every figure is an ASSUMPTION; the Bulletin says only that faculty
  assist. The note on each is read from the record: its genre and how well the student knows it, its forecast, and any
  part played in it before and how that came out. A written analysis (Table Work's course) counts as no part played. The
  part shown before is listed first, and it's the one the faculty choose.
- **The choice** (`school.choose_showcase`, `registerShowcase` :564, refusal `choiceRefusal` :358): two different scenes
  from the options, before the scenes are chosen, in the last term; each refusal in the player's words, and the panel's
  "Not now" reads the same function. Each scene becomes a piece of DRAM 793b's coursework (`setScenes`), due at the first
  showcase day, its partner the classmate the student has worked with least (`partnerFor`, no random draw), so its
  steps, Table Work, way of playing and Shown Today are the coursework's own. While the showcase is on, the course's
  class meetings set no drawn scene (`setWork`, `src/engine/systems/coursework.ts:427`); a piece due after the classes
  doesn't lapse at the review (`lapseTerm`, `:1631`).
- **The course's rehearsals on the School's calendar** (`rehearse` :449): rehearsal calls Tuesday to Friday at three,
  three hours, over the last two weeks of classes (the School's rehearsal hours, `SCHOOL_SEASON`; the span an
  ASSUMPTION). A call kept works both scenes on their feet with the partners, by the steps' own gains at the call's
  focus; a call missed counts as a missed call (the tally, the casting pool's count) and a missed meeting of the course.
- **Each day** (`perform` :469): each scene is judged by the existing judge (`judgeWork`, through the coursework's `show`
  and `reshow`, `src/engine/systems/coursework.ts:1602`) with its preparation, the day's condition and the scene's
  demands. The first day a scene is played it's shown with the course's note (the coursework's own feedback, in the
  course's voice); the next day it's played and judged again; in Los Angeles it's shown again with the note taken. Each
  performance is kept in `person.work` and the journey (`recordWork`, under its own key) and in `pro.showcase` (`scenes`
  with `chosenAt`, `prep`, `role`, `assignmentId` and `by`; `performed` with `city`, `at`, `band`, `overall` and `scene`).
- **A day missed** has the consequence the course gives a missed call: a call missed in the School's record (`tally`,
  which the Player Profile's reliability reads) and a meeting of DRAM 793b missed, and the scenes aren't seen there. A
  scene played at no showcase day counts as a piece not shown, and a course with half its pieces not shown isn't passed.
  So DRAM 793b is held past the term review (`showcaseHolds` :191, `settleCourses`' `held`,
  `src/engine/systems/courserecord.ts:99`) and settled after the last day (`endShowcase` :512); if the School ends first,
  on what it had (`settleHeldShowcase` :543, from `setStanding`, `src/engine/systems/school.ts:2007`). A day missed ill or
  hurt is excused.
- **The screen** (`src/ui/career/SchoolShowcase.tsx`, at the top of the School's Coursework tab from the last term's
  first day, `src/ui/workspaces/SchoolWorkspace.tsx:75`): the days and rehearsal calls, and Taking Part; the faculty's
  options with their notes, and Choose These Scenes behind its guide chapter; then the scenes and a table of how each day
  went; and a way to the Career once the School is over.

**What a player reads** (the built app, `walk/`):

> Office Hours is a drama, a genre you know a little. Fully prepared, it would come to about 61 of 100 for you, Working.
> You play Lorraine, opposite Priya. You played Lorraine in it for Acting I on April 5, 2027, and it came out Unready.
> The faculty would choose this one.

> Choose These Scenes — Not now: Choose two different scenes.

> You played your two scenes at the showcase in New York. The Father in Office Hours: Working, 62 of 100. Lorraine in
> Bed Fourteen: Working, 61 of 100. The faculty's notes are on each scene's card on the Coursework tab. Work on them
> before Los Angeles, where they're shown again with the note taken. You play them again in New York on May 1.

> You weren't at the School's call for the showcase in New York, so your scenes weren't seen there. It counts as a
> missed call, and as an unexcused absence from Actor Showcase. Your scenes are next due in New York on May 1.

**Tests:** a choice refused before the last term, of the wrong count, of a scene the course didn't offer and of one
scene twice, leaving the save as it was; the faculty's options on the Coursework tab; two GUARDs on the options (a genre
known; a scene shown Strong before, in its second part, listed first, with Table Work counting as no part played); the
falsifiability test (the same scenes on the same seed, prepared fully against left, come out more than ten points and a
band apart); the rehearsal calls (what they add, and what missing one costs); a day missed (a missed call of the course;
excused when ill; every day missed and neither the course nor the degree passed); a save and a load between New York and
Los Angeles with nothing judged twice; leaving the School between the review and New York; an older save in its last
term opening onto it once (before the fourth week, after it, and after Los Angeles).

## A1: The School's Side, From The Last Term To The Morning After Commencement

"PLAYER JOURNEY: from the last term's first day to the morning after Commencement…" plays it by the clock, choosing Go at
every stop: the scenes chosen on the first day, then read and answered at the table; the fourth week; the eight
rehearsal calls; the term review settling every course but Actor Showcase; New York's two days and Los Angeles's day,
each judging both scenes; the course passed after Los Angeles; Commencement. Its notices, in the order read: Spring Term
2029 Begins; The Actor Showcase; You're In The Actor Showcase; In Good Standing; The Actor Showcase In New York (twice);
The Actor Showcase In Los Angeles ("… You passed Actor Showcase."); Your MFA Is Conferred. The morning after: standing
graduated, Equity dated at the degree; The Way You're On a graduate's; the showcase's record as it was after Los
Angeles; the six performances in the work record and the journey, the pieces done; `breaches` empty. The full sequence
is in `screens/sequence-last-term.txt`.

## A5 And V4: No Early Degree, Said Where A Player Looks

The Bulletin: "on rare occasions the faculty of David Geffen School of Drama may reduce the residency requirement, but in
no case below a minimum of two years" (B27 p.21), with no criteria, no way to ask, and no Acting case.
`EARLY_DEGREE` (`src/engine/systems/proshowcase.ts:127`, its rule at `:119`) says so in two places:
- **The School's Terms And Award tab**, in the Finishing Early panel, for a student still enrolled (`EarlyDegree`,
  `src/ui/workspaces/SchoolWorkspace.tsx:897`), in full.
- **The candidate's line in the Career's The Way You're On** (`pathwayOf`, `src/engine/systems/pro.ts`), without its last
  sentence, since that line already says when the degree comes. The built app's walk read it saying so twice in one
  paragraph; the version first written is kept in `screens/early-degree-first-written.txt`.

The Drama School chapter's details say it too. No accelerated degree is made: the degree belongs to the sixth term, at
Commencement.

> Graduating early isn't a route the game offers. The Bulletin says that "on rare occasions the faculty of David Geffen
> School of Drama may reduce the residency requirement, but in no case below a minimum of two years," and publishes no
> criteria for it and no way to ask. So the MFA comes at Commencement after your sixth term.

**Test:** "says the Bulletin's sentence, and that the game offers no early degree, on the School's Terms And Award and in
the Career's The Way You're On; and no degree comes before the sixth term": both screens rendered and read; the Career
says "after your sixth term" once; the sixth term is the first with a degree.

## The One Call Integration Wires

The comment `// Integration (brief 19, W3): the School's follow-up is scheduled here.` is in `endShowcase`
(`src/engine/systems/proshowcase.ts:519`), the one place where the showcase's last day has been judged, played or
missed, after Actor Showcase is settled. `scheduleShowcaseFollowUp(sim, person, after)` goes there, `after` the last
`at` in `sc.performed` or `sc.missed`, or `sim.now`.

## The Built App, Walked

`npm run build` exited 0; `vite preview` served it on port 4181, the served page matching the build's `dist/index.html`;
Chromium driven by Playwright. Two saves from a played last term (seed `showcase-final`): the term's first day, and the
morning after New York, each opened from the save slot with Continue. The walk read the Coursework tab; ticked two parts
of one scene (the button stayed greyed, "Choose two different scenes"); ticked two scenes (enabled, pressed); read Your
Scenes, Terms And Award's Finishing Early and the Career; and read the performance table after New York. No console
errors. The text is in `walk/`.

## Assumptions (The Game's, Said Where They Apply)

- Each showcase day is one School call from New Haven with its trip inside its hours (`travelMinutes: 0`), around SC26's
  showings, Los Angeles's from 9 AM.
- The course's rehearsals are rehearsal calls at the School's hours, three hours each, over the last two weeks of
  classes.
- "By the fourth week" is read as by its Friday at five.
- The faculty offer four scenes in either part, ranked by the forecast, then a known genre (ten points), then a scene
  shown Strong before (five); they choose their first two for a student who hasn't.
- A showcase scene's partner is the classmate the student has worked with least, the first in the class among equals.
- A student kept out by an Incomplete isn't failed for the showcase (the Bulletin doesn't say what becomes of the course);
  their classes set work as before.
- An older save opened after the fourth week is read as its record stands then; one opened after Los Angeles begins
  nothing.

## Mutations

All 36 killed (`mutations.txt`). The first run killed 33 of 35; each survivor was answered with a test: M14 (the part
shown before listed first: the GUARD's scene had been shown in its first part, so the scene's own order was the same; it
uses a second-part scene now) and M25 (no class scene while the showcase is on: its journey chose on day one; the
Incomplete journey, where the faculty choose, now asserts the course's work is the two scenes alone). M36, the rule's
other half (a student kept out gets class scenes), was added then. Five guards found unreachable were taken out, each
said in a past-tense comment: in `beginShowcase`, a leave, an additional term, a second beginning and no craft; in
`perform`, a performance kept twice.

## Checks Run (On The Builder's Clone, `8d59e3cf`)

- `npx tsc -b --noEmit`: exit 0. `npx eslint` on the 20 changed code files: exit 0.
- Vitest, one worker, on the 182 files importing changed modules: 180 passed and 2 failed (`pro-showcase` ran while its
  source and tests were mid-edit, and `scope-school` on the old expectation before its update). On the final tree, those
  2 and the 32 the batch ran before the last source changes, 34 files and 822 tests, passed; after the last test edits,
  `pro-showcase` (15), `pro-screen` and `guide`, 34 tests, passed.
- The gate's chain without the suite, output and exit read from files: exit 0. Voice-check 38 of 40, tics' "isn't …
  it's" 8 of 8, "Nothing" openers 0 of 0, all unchanged; the text inventory holds, second pass Pending 0; guide quotes
  578 of 578; surfaces 285, 4,369 of 4,369 sources claimed; the completion matrix holds at 527 of 641.
- `npm run build`: exit 0.

## Shared Files Touched

- **Engine:** `systems/pro.ts` (`ShowcaseRecord`'s optional `options`, `outstanding` and `missed`, and on its entries
  `role`, `assignmentId`, `by` and `scene`; `pathwayOf`'s candidate line); `systems/school.ts` (`present` and
  `missedCallsOut` exported, the term handler's `beginShowcase`, the review's held course, `setStanding`'s
  `settleHeldShowcase`, the rewritten comment); `systems/coursework.ts` (`reshow` exported, `setWork`, `lapseTerm`);
  `systems/courserecord.ts` (`settleCourses`' optional `held`); `engine/index.ts` (`registerShowcase`, the
  `showcase.begun` opening step); `content/coursework.ts` (`SHOWCASE_SCENE`'s comment, deliverable and two notes);
  `content/tutorial.ts` (the Drama School chapter's paragraph, two details, `opens` and `names`); `content/guide/index.ts`
  (the entry joined, and the Coursework And Partners lead).
- **Screen:** `ui/workspaces/SchoolWorkspace.tsx` (the panel on Coursework, Finishing Early on Terms And Award).
- **Tools:** `tools/text-inventory.mjs` (the career subsystem takes `content/guide/showcase.ts`; an AREAS2 rule gives the
  three new files the area `career-showcase`).
- **Tests changed to what the game now does, each with when and why:** `tests/guide.test.ts` ("showcase" off the list of
  removed features, the rest kept); `decisions-arion`, `genre-mastered`, `remaining-banking`, `scope-health` (the opening
  steps end at `showcase.begun`); `scope-school` (a repeated last year's Actor Showcase is passed after Los Angeles, not
  at its review).
- **Regenerated:** `docs/COVERAGE-MATRIX.md`, `DEVMAP`, `TRACEABILITY`, `CAPABILITIES.md`, `GAMEPLAY-COVERAGE.md`,
  `TRACE.md`, the completion matrix, `docs/text/INVENTORY.md`, `inventory.json`, `SURFACES.md`, and the handoff's
  completion line.
- **Added to:** `docs/capabilities.json` (`school-showcase`, Implemented); `docs/verification/review-2026-10-13/capabilities.json`
  (the builder's reading, partial); `docs/text/statuses/` and `second-pass/` (`career-showcase.json`, and the career,
  school and tutorial files for their sources); `docs/text/surfaces/career-showcase.json`.

## For Integration

- **The record:** `pro.showcase.performed` holds one entry per scene per day played; `city` is a city's id
  (`us-ny-newyork`, `us-ca-losangeles`); `missed` holds the days missed; `eligible` is false for a student kept out, who
  has no performances.
- **The calendar:** the showcase's School calls hold New York Monday 1 PM to 11 PM, Tuesday 9 AM to 5 PM, and Los
  Angeles Tuesday 9 AM to 9 AM the next day, at priority 32 with `travelMinutes: 0`. The work loop's bookings will meet
  them.
- **Opening steps:** `ONCE_ON_OPENING` ends with `showcase.begun`, after `pro.begun`; another step goes after it, and the
  tests pinning the list each name it.
- **Classmate names:** a classmate can be named Jordan (the School's name list, `GIVEN_ACTOR`), and his "Jordan Asks To
  Rehearse" notices can land near the showcase's; where the agent's first notice lands is worth a look.

## After The Merge

- `tests/cohesion.test.ts` failed from the showcase's merge on: it reads the source for `kind:` beside each kind put on
  the clock, and `beginShowcase`'s helper took the kind as its second argument. Neither the builder's batch nor the
  coordinator's run of the merge read that file. Fixed at the agent's merge, the helper taking a named `kind:`
  (`../agent/REPORT.md`, The Merge).
- The follow-up (W3) is wired at `endShowcase`'s comment, and the full journey here holds it.

