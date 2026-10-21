# Brief 19, The App: The Built App At Both Widths From The Keyboard (V17), The Career's Words Read Together (T1), And The Merges' Screen Defects, 2026-10-21

This part walked the joined game's new surfaces together on the built app, read the career's words in the order a
player meets them, and fixed what the merges left on screen. Branch `b19-app`, from the joined head `7bbab80f`, in
commits `4db2646f`, `3f7e51eb`, `674e9089`, `1d9c5a76`, `7112d3a8`, `4c1db01e`, `9968cc0f`, `8bac3141`, `2cc42ad3`,
`c35dacf4` (this folder) and `92473dcc` (the test run), merged into the working branch after the audit. (Its worker
couldn't write this file from its own clone; the coordinator committed it from the worker's report, unchanged in
substance.)

**An automated walk isn't a person's look.** What follows says what the walk checked and what it found; it doesn't call
the interface approved.

## Status

| Item | Status | What's Left |
|---|---|---|
| V17 | The automated half holds at both widths on all 52 surfaces (below) | The criterion also names a person's look at desktop and mobile: the owner's |
| T1 | Read on every new surface and in one played life's notices; 17 things fixed at their source, each marked in both passes under the area that holds it; budgets unchanged | What's left, each with why, below |
| Defect 1, the stop's third button at 390 | Fixed And Verified | |
| Defect 2, the calendar's legend for the career | Fixed And Verified | |
| Defect 3, a classmate called Jordan beside the agent | Checked on three played last terms: they never land side by side; the agent's titles name whose office now | |
| Found by the walk: two choosers on one screen sharing radio groups | Fixed And Verified | |

## How The Walk Was Made

**The saves are played** (`make-saves.ts`, its log `make-saves.log`): one life, Ada Cole, born in New York, from her
first day at Yale (August 24, 2026), seed `app-walk-102`. The clock moves to the last term's first day six hours at a
time, as the showcase's journey moves it; from then on every commitment is stopped at and gone to with Go
(`answerStop`). Every career step is her own command: she prepares and tapes a camera brief, makes headshots, a résumé
and a reel, presses Check Your Materials and Send Your Materials after the School's follow-up, keeps the meeting,
accepts the agreement, prepares the sides and the part, tapes a self-tape, submits to every open call, and accepts the
offer. His office's answers, the postings and casting are the game's own draws. TEST SETUP, as the showcase journey's:
the body kept fed and rested, and every open piece of coursework prepared each midnight. The seed is the first of four
whose first approach to his office draws low enough for a meeting and an offer, found the way `../agent/make-saves.ts`
found its own; the life is played whole from it.

The life, as it went: in the final term the faculty chose her scenes; New York's showcase on April 30 and May 1, 2029,
Los Angeles's on May 8. The School's follow-up on May 11 passed on his office's request to meet, and she sent her
materials that day; the meeting was set for May 25 at Stewart Talent's New York office. The degree came on May 21,
Equity's $600.00 down taken. She kept the meeting, he offered on May 30, and she accepted. On her own submission she
taped for Jess in Static On Route 9, a fictional SAG-AFTRA Ultra Low Budget film, offered through him at scale plus ten
and accepted on June 8; his auditions for Nell, Desk Clerk and Wren booked nothing. The four shoot days ran July 2 to 5;
$1,130.80 was paid into Stewart Talent's client trust account on July 12 and passed on on July 17, less $102.80
commission. `breaches` was empty at every save.

One thing the TEST SETUP leaves short: it prepares a piece's steps but answers no Table Work, so her showcase scenes came
out Unready. The walk reads screens and their words, which that doesn't touch.

The nine saves (`last-term`, `after-new-york`, `follow-up`, `meeting`, `offered`, `audition`, `offer`, `work-day`,
`paid`) are 1.6 MB each and aren't committed: `make-saves.ts` writes them again, the same to the byte, in 16 seconds.

**The walk** (`app-walk.mjs`): `npm run build`, the clone's `dist/` served on port 4187 (`served.txt`: the page served is
`dist/index.html`, build `assets/index-C42mdylw.js`, at `8bac3141`; `2cc42ad3` after it changed one help sentence the
walk doesn't open); Chromium by Playwright at 1440 by 900 and 390 by 844. Each surface is reached as a keyboard reaches
it: a control focused and Enter pressed, tabs moved with the arrow keys (selection and focus checked to move with them),
a menu's items reached by Tab. Each surface is read (`walk/<width>/NN-surface.txt`) and pictured (`.jpg`), and held to:
no page or console error; no sideways scroll; every control named and reachable by Tab (Tab pressed from the top, or
into a dialog, until it comes round, and every visible enabled control it didn't reach listed; a radio group one stop,
judged in its own table); the focus ring drawn on every control Tab reached; every grayed control saying why, in its
title and in words in its panel. Nothing that commits is pressed: the stop is closed with Escape (Stand Here), and the
guide's chapters and entries are only read.

## V17: Each Surface At Each Width

The same 52 surfaces at 1440 and at 390 (`walk/walk-1440.txt`, `walk/walk-390.txt`). On the final build nothing was
found on any of them at either width; on the first build (`walk-before/`) the walk found what the next section fixes.

| Surfaces | Save | What's On Them |
|---|---|---|
| 01 to 05 | last-term | Career's five tabs for a final-term candidate: Overview's The Way You're On with the Bulletin's sentence on early graduation, the empty Portfolio, his panel with the notice unread, Opportunities, Work |
| 06, 07 | follow-up, meeting | Representation after the School's follow-up, and the morning of the meeting with The Meeting panel |
| 08 to 10 | offered | Overview as a graduate; Representation with The Agreement, every term with its basis; Show The Reasons opened by Enter |
| 11 to 14 | audition, offer, work-day | Opportunities with two auditions in progress, then an offer's card, then Booked Work; the Work tab with promised pay and expected commission |
| 15 to 19 | paid | Career's five tabs after pay, his history, Finished Engagements with the commission on its own line |
| 20 to 22 | last-term, after-new-york | School's Coursework with The Actor Showcase (the faculty's options, Choose These Scenes); Terms And Award with Finishing Early; Coursework after New York with how each day went |
| 23, 24 | paid | Papers' Permission To Work with Your Work And Your Permission; Money's Statements with the pay passed on |
| 25 to 27 | meeting, audition, work-day | Advance, This Evening, On The Way, then the stop: at the meeting (with Ask To Move), at an audition, at a shoot day |
| 28 to 31 | meeting, work-day | The Calendar with the career's items, and one opened (the meeting; a shoot day) |
| 32 to 35 | last-term | The guide's Drama School, Your Career, Representation and Finding Work, their The Details opened |
| 36 to 52 | last-term | How This Works: the career goal's 16 entries and The Actor Showcase, each with Show Everything |

Of the brief's "new chapters", three are new (Your Career, Representation, Finding Work); The Actor Showcase is a
paragraph and two details of Drama School, so the walk reads that chapter whole.

**The tutorials' accuracy.** The chapters' and entries' words were read against what the screens showed in the same
walk: every step they give is one the built app has, at the place they name. Two came out false, both fixed below (Your
Career said a grayed button's line says why, and Use This Name had none with the field empty; the stop and the
Calendar's entry said "in its town", which isn't true of the career's commitments). `tools/tutorial-routes.mjs`, run on a
text walk of four saves and its own capture of their menus and dialogs (`tutorial-routes.txt`), found none of the
labels the three career chapters and the career's entries name nowhere; the labels these saves don't show (Submit
Yourself with an open call up, Send What His Office Asked For, Still Owed After An Agreement Ended, Ask The School) are in
the code that draws them, in states this life didn't reach; Accept and Decline The Agreement and The Offer, which the
tool's four saves don't show, are on surfaces 09 and 12; the six labels it found nowhere are other areas'.

## The Defects

### 1. The Stop's Third Button At 390

Measured (`walk/390/25-stop-meeting.txt`): the footer holds How This Works, Stand Here, Ask To Move and Go; without
wrapping they ran 17.3 px past the dialog's left edge (a row too wide for a `justify-content: flex-end` footer spills off
its start), where every other stop, and the meeting's at 1440, stays 25 px inside. `.modal-foot` was a flex row that never
wrapped, while `.btn` is `flex: none` and its own comment asks the slot to wrap around it. **Fixed** in `src/styles/app.css`
(`.modal-foot`, `flex-wrap: wrap`): at 390 the meeting's stop takes two rows, Go on the second, 25 px inside. **Test:**
`tests/pro-app.test.ts`, "lets the stop's buttons go to a second line…" (the rule, its premise and the meeting's third
button); M1 killed. A layout can't be measured in the suite's node environment, so the walk keeps the measurement, as
built and with the wrap taken away.

### 2. The Calendar's Legend For The Career

`CALENDAR_LEGEND` had no row for `career`: the career's items were drawn with no color, and an item opened called its
kind "Career" only by the category's own name. **Fixed** (`src/engine/world/calendar.ts`): a Career row with its own
color and a list of what it holds, each checked against what the career files under `career` (auditions and
self-tapes, casting's answers and decisions, an offer's last day, work days, a release, the agent's meeting and what his
office asked for, the School's follow-up, the dean's answer, an agreement's end); paydays and union bills stay under
Money. **Tests:** `tests/pro-app.test.ts`, "gives every category the calendar can hold a row of its own…" (read from the
type itself) and "a first-year's submission to an open call puts the casting office's answer on the calendar, drawn in
the Career color and named Career in the legend"; M2 killed. On the built app surfaces 28 to 31 show it.

### 3. A Classmate Called Jordan Beside The Agent

Checked (`jordan.ts`, `jordan-before.txt`, `jordan-after.txt`) on three played last terms: `showcase-final`, whose class
has no Jordan, and `app-jordan-0` (Jordan Kowalski) and `app-jordan-2` (Jordan Nguyen), the first two seeds whose class
has one; every notice recorded from January 8 to five weeks after Commencement, with What Needs You's unread list in its
own order. On all three the agent's first notice is the School's follow-up on May 11, 2029; the classmate's notices
("Jordan: A Request For Help", "Jordan: Run Lines Together?") came 84, 45 and 30 days before it with many of the School's
between, and none in the five weeks after. They never sat side by side, and every notice of the agent's names him in
full with his agency and ends on the fictional line. But eight of his titles said "His Office" or "He", which in a list
that also holds "Jordan: …" named nobody, and on the enrolled route (a referral while at the School) his notices and a
classmate's can come the same week. So each title now names whose office (`3f7e51eb`): "Jordan Parente's Office Asked To
Meet You", "No Answer From Jordan Parente's Office", "A Meeting Is Set At Stewart Talent", "You Missed The Meeting At
Stewart Talent", "Your Agreement With Jordan Parente Ended" and the rest. The classmates' notices keep the School's way of
naming a classmate, by first name.

### Found By The Walk: Two Choosers Sharing Radio Groups

After New York, Coursework shows the showcase's two scenes, each with How You'll Play It, and both named their radio
groups `axis-pace`, `axis-scale` and `axis-structure`: to the browser one group of each across both cards, so Tab
stopped only in the first card, and the second card's nine choices were reached only by arrow keys running on from the
first (12 radios, 3 stops). **Fixed** (`src/ui/components/PlayingChooser.tsx`, `useId`); `tools/acceptance-ui.mjs`'s
selector now matches a group by its ending. Its Play It This Way button, grayed until a way is picked, said nothing of
why; it now says so in its title and under it. **Tests:** `tests/pro-app.test.ts`, "the last term's showcase scenes,
chosen, draw two choosers…"; M3, M19 and M20 killed.

## T1: The Career's Words, Read Together

Read on every surface above and in the life's notices in order, against `docs/STYLE.md`, `docs/GLOSSARY.md` and Title
Case (notices before and after: `make-saves-before.log`, `make-saves.log`; screens: `walk-before/`, `walk/`). The agent's
lines hold one procedural, fictional voice: each comes from an event the record holds, none congratulates, and the
fictional line ends every one of his.

| What | Where | Why |
|---|---|---|
| His titles name whose office | `proagent.ts`, `tell` and its eight callers | "His Office Passed" named nobody in What Needs You (defect 3) |
| His history says what the check found, in the past | `proagent.ts`, `pro.agent_check` | It had copied the check's own instructions ("Press Update Your Résumé…"), still to do after they were done |
| "Check your materials first." ends in a full stop | `proagent.ts`, two refusals | Shown after the button's name, it gave the line a second colon |
| Accepting, declining and a lapse said without their date | `proagent.ts` | The history line already gives it ("May 30, 2029: You accepted his agreement, on May 30, 2029.") |
| The meeting kept names the agency's office once | `proagent.ts` | "with his office, at its New York office" |
| A round's and an offer's history line in the past | `projobs.ts`, `setRound`, `makeOffer` | "asks for a self-tape" and "offers you … The offer stands until" sat among "submitted" and "was Working", so a settled offer still read as standing |
| Settled says a booking once | `OpportunitiesPane.tsx`, `Settled` | "Jess, Static On Route 9: You accepted Jess in Static On Route 9: four work days" |
| One week's pay said as one | `OpportunitiesPane.tsx`, `BookedCard` | "over one week, each week due" |
| Commission over scale doesn't repeat its amount | `propay.ts`, `commissionOn` | "Commission expected: $102.80. $102.80, what's paid over scale" |
| The Equity down payment named as a part | `propay.ts`, `equityParts` | "Initiation fee, $600.00 down of $1,800.00: $600.00, paid" |
| SAG-AFTRA's line says where you stand | `WorkPane.tsx`, `UnionsPanel` | It and the reason under Join SAG-AFTRA said the same sentence one after the other |
| Days counted in words under ten | `WorkPane.tsx`, `datesWords` | "4 days of work", where the Opportunities tab says "Four shoot days" |
| A new special skill named as one | `pro.ts`, `resumeNow` | "doesn't have … Lady Macbeth … and Singing" |
| What's Next says each button there says what it takes | `CareerWorkspace.tsx`, `OverviewPane` | "Each says its time and cost": Each stood for nothing, and the résumé has no cost |
| Use This Name says why it's grayed | `CareerWorkspace.tsx`, `ProfilePanel` | The guide says a grayed button's line says why; with the field empty it said nothing |
| The stop and the Calendar's help say the career's commitments take the trip as made | `TimeControls.tsx`, `DueNow`; `guide/day.ts`, `day.calendar` | "you're there if you're awake, in its town, …" is false of an audition, a meeting or a work day, whose handlers read no place; "Going takes 30 minutes" said nothing of the two hours each way, which don't move the clock |
| New York's second showcase day says the scenes were played again | `proshowcase.ts` | It opened word for word as the first, under the same title, side by side |

Each source was read again and marked in both passes with `--by` the area that holds it (career-agent, career-work,
career-pay, career, career-showcase, frame, school), the evidence naming this folder's walk or log and the test that
holds the change, each claimed by its surfaces row. Budgets on the final tree: voice-check 38 of 40 (one new sentence,
"is taken as made", was counted and reworded in `2cc42ad3`, which restored it); tics' "isn't … it's" 8 of 8; "Nothing"
openers 0 of 0; engine-speak 316, unchanged; guide quotes 582 of 582.

**Read and left, with why:**
- The pay's notices name Stewart Talent passing on pay, with no fictional line: they report the game's own money, by a
  term The Agreement marks as the game's own ("How Pay Reaches You"), not his words or decisions, which is what the line
  covers. Whether the agency's name there should carry a line of its own belongs with the owner's open decision on the
  real agent.
- An offer's history line keeps "It pays $282.70 a day…": the rate is a standing fact of the contract, so its present
  tense reads true beside "the offer stood until".
- School credits list a production's name, not its play ("Masha, Directors' Thesis Production I"): the School's filed
  credit holds no play, so the fix belongs to the School's record, not to the words.
- "It clashes with Audition: Nell, A House On Calder Street at 11:00 AM.": the calendar's own label set in a sentence, as
  the game does everywhere a clash is said.
- The classmates' notices name a classmate by first name: the School's voice; the agent's side carries his full name in
  every title and body.

## Found And Not Fixed, For Integration

- **The agent's meeting doesn't take a student away from class.** `awayAt` (`systems/projobs.ts`) reads auditions and work
  days, not his meeting, so a referral's meeting in term, at 11 AM in New York, counts the student present at a New Haven
  class the same hour. Every meeting this walk played came after classes ended. Passed to the playthroughs (J6).

## Assumptions

None of the game's rules was added or changed. The walk's own two: a row of buttons in a `flex-end` footer is measured
against both edges; a radio group is judged within its own table.

## Mutations

`mutations.txt`: 20 run, 20 killed (M5 was first written in a form that didn't parse; that run is recorded as invalid and
run again).

## Checks Run (On The Worker's Final Tree)

- `npx tsc -b --noEmit`: exit 0 (`typecheck.txt`). `npx eslint` on the 25 files changed: exit 0 (`eslint.txt`).
- vitest, one worker, on the 104 test files that import a changed module directly or render a screen that draws one
  (`vitest-files.txt`): 104 files, 1,684 tests, exit 0 (`vitest.txt`, `vitest-exit.txt`). A first run, started before the
  last three changes, failed only in `tests/pro-app.test.ts`, then being edited; that run isn't kept.
- The gate's chain without the suite, output and exit read from files: exit 0 (`checks.txt`, `checks-exit.txt`).
- `npm run build`: exit 0 (`build.txt`).

## Shared Files Touched

- `src/styles/app.css` (`.modal-foot` wraps); `src/engine/world/calendar.ts` (the Career legend row and its comment);
  `src/ui/components/PlayingChooser.tsx` (its own radio group names; Play It This Way's reason); `src/ui/shell/TimeControls.tsx`
  and `src/engine/content/guide/day.ts` (the career's commitments at the stop and in the Calendar's help).
- The career's own sources in the table above: `proagent.ts`, `projobs.ts`, `propay.ts`, `pro.ts`, `proshowcase.ts`,
  `OpportunitiesPane.tsx`, `WorkPane.tsx`, `CareerWorkspace.tsx`.
- `tools/acceptance-ui.mjs` (a radio group's selector).
- Tests brought to the new words in the same commits, each with when and why: `journey-agent`, `pro-agent`, `pro-work`,
  `pro-opportunities-screen`, `propay`, `propay-screen`, `pro-showcase`, `language-frame-ui` (a new stop case). New:
  `tests/pro-app.test.ts`.
- Text records for career-agent, career-work, career-pay, career, career-showcase, frame and school, and the surfaces for
  those and time; regenerated `INVENTORY.md`, `inventory.json`, `SURFACES.md`, `docs/DEVMAP.md`, `docs/TRACEABILITY.md`
  and the completion matrix.
