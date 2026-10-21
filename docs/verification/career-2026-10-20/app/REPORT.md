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
$1,130.80 was paid into Stewart Talent's client trust account on July 12 and passed on to her July 17, less $102.80
commission. `breaches` was empty at every save.

One thing the TEST SETUP leaves short: it prepares a piece's steps but answers no Table Work, so her showcase scenes came
out Unready. The walk reads screens and their words, which that doesn't touch.

The nine saves (`last-term`, `after-new-york`, `follow-up`, `meeting`, `offered`, `audition`, `offer`, `work-day`,
`paid`) are 1.6 MB each and aren't committed: `make-saves.ts` wrote them again, the same to the byte, in 16 seconds,
until `a483247d` priced Ultra Low Budget work by its contract year. Written again on it, the life is the same to the day
but for Jess's pay: $308.00 a day, scale plus ten on 2029's $280.00 minimum, where the walk read $282.70 on 2026's
$257.00; $1,232.00 for the week, $112.00 commission, $1,025.76 to her where she was paid $941.49. The walk's pages
below are the build it read.

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

## Walked Again With The Fictional Agent, 2026-10-21

On 2026-10-21 the owner had a fictional agent, Thomas Ashgrove of Halberd Talent, take the real one's place ("Let's go
ahead and swap in a fictional agent.", `59da1351`), and later that day had each part written for an actor, an actress or
either, with only a part written for the player or for either posted to them ("There should be gender neutral and
different parts for each genders. We need versatility always.", `9c3b7ee8`). His id is in the draws' keys (`rngFor(seed,
'pro.agent', person, agent.id, …)`) and who a part is written for is in what's posted, so each change told the same
seed's story another way, and this walk's saves and pages showed an agent and parts the game no longer has. The life was
played again and the built app walked again on branch `b19-rewalk5` from `63fe7391`, in a clone of its own; `walk/`
stays as the record of what was walked then.

Three walks before this one were made and superseded the same day, each kept in the history and its pages replaced in
`walk-fictional/`. The walk on `59da1351` (seed `app-walk-112`; `e5eed350` here) held at both widths on the same 52
surfaces and found deferred pay said three ways, a part written for a man offered to an actress, the Agreement's ending
term without "through him" and a Calendar entry without the trip its notice promised, which `9c3b7ee8` fixed. The walk
on `9c3b7ee8` (defaults `app-walk-112`, `156`, `311`, `564`; `3431153b` here) held the same, and found an actress judged
at two auditions in person at one hour in two towns, and the actor's part Theo given as a classmate's name, Theo
Sullivan, which `a43b4f8f` fixed ("Two career commitments whose trips meet can't both be gone to; the film's part named
as no classmate is"). The walk on `a43b4f8f` (defaults `app-walk-112`, `156`, `311`, `374`; `246e30bd` here) held the
same, and found the clock running past the second of two auditions set for one hour, missed and said only afterwards,
though On The Way said it stops at each one; `40eab86a` made the stop and On The Way say so. `40eab86a`'s build was
blank on every page ("Cannot access 'Xb' before initialization", `Xb` being the bundle's `MEETING_KIND`): a Set it made
as `projobs.ts` loaded read `MEETING_KIND` across the career systems' import ring before `proagent.ts` had run, which
the suite's module runner didn't show; `63fe7391` reads the kinds when asked, and its suite now loads the bundle in the
build's order.

| Item | Status |
|---|---|
| The seed | `app-walk-112`, the first seed `draws.ts` lists whose life reaches all nine saves; `make-saves.ts`'s defaults are the first four that do, `app-walk-112`, `app-walk-156`, `app-walk-311`, `app-walk-374` |
| V17's automated half | Held at both widths on the same 52 surfaces (`walk-fictional/`) |
| The built app | Loads, with no page error, before a save and after one |
| Two commitments at once | Never: no two she went to meet or fall on one day; each clash's second was missed, saying where she was |
| The stop at a clash | The stop names the clash and says the second is missed and the clock won't stop at it, and the clock does so (`clash-stop.mjs`, `clash-stop.txt`); On The Way still opens by saying it stops at each one |
| The guide's deferred pay | How This Works' entries 45 and 50 give the why, saying "a student film" once a sentence; 48 says who a part is written for |
| Defect 3, asked of him | Nobody in the played life is named Thomas, Ashgrove or anything near either, and no part shares a classmate's name (`ashgrove.ts`, `ashgrove.txt`) |
| A part written for an actor | Never shown to this life: not in its saves, its notices or the walk's pages |
| The route's setup | `playtest-check.mjs` passed on the new saves (`../playtest-check.txt`) |

### The Seed

Played again on `59da1351`, `app-walk-102`'s office passed on May 25, 2029 with no meeting: its first approach drew
0.0996 where the follow-up's factors gave a chance of 0.09. `make-saves.ts` writes each save once, from the first seed
that reaches it, so with the old defaults the owner's command in `../PLAYTEST.md` would have written three saves from
102's life and the rest, if any, from another. `draws.ts` (in the scratchpad, reading the repository's source) listed
`app-walk-71`, `112`, `156`, `311` and `374` as drawing under 0.1 and 0.2 on the first approach, on each commit, since
its draw reads only the seed and his id. On `a43b4f8f` each was played by itself: 71's follow-up drew 0.0903 against the
same 0.09 (Your Work, Training And Experience and Room On His List near the bar), so the School passed on no request and
his office passed on May 25; 112, 156, 311 and 374 each reached all nine with `breaches` empty at every save. The
defaults are those four, in that order, and the header says how they were chosen and what they were on each commit
before. `40eab86a` and `63fe7391` changed what the stop says and when the work's kinds are read, not what's played: on
each, the owner's command, run with no seed, wrote nine saves the same to the byte as on `a43b4f8f`, 112's alone, in
about 30 seconds, and on `40eab86a` the other three seeds' saves were the same to the byte too. Its log is
`make-saves.log`; the real agent's life, which the sections above call `make-saves.log`, was moved to
`make-saves-real-agent.log`.

The life, as it went, the same as on `59da1351` and `9c3b7ee8` to the agreement and the same as on `a43b4f8f`
throughout: in the final term the faculty chose her scenes, The Father in Office Hours and June in Two Time Zones; New
York's showcase on April 30 and May 1, 2029, Los Angeles's on May 8. The School's follow-up on May 11 passed on Thomas
Ashgrove's office's request to meet, and she sent her materials that day; the meeting was set for May 25 at Halberd
Talent's New York office. The degree came on May 21, Equity's $600.00 down taken. She kept the meeting, he offered on
May 30, and she accepted. That day she submitted herself for Hester Vane in The Winter Ledger and Ivy in Paper Moons,
both set for Tuesday, June 5 at 11:00 AM, one in Hudson and one in Brooklyn, a clash, as Ivy's notice said; she went to
Hester Vane's, not called back, and missed Ivy's: "You were at the audition for Hester Vane in Hudson, so you missed the
audition for Ivy on June 5, 2029 at 11:00 AM, and the film's director moved on without you." His submissions in June for
Nell, which came to a callback, and Wren booked nothing, nor did her own for Sam in July or his for Jess in August. On
August 27 his Nell and her second Ivy fell at 11:00 AM again; she went to Nell's, not called back, and missed Ivy's,
said the same way. His submissions that day for Hester Vane and Desk Clerk came to an audition, not called back, and a
self-tape; Desk Clerk in The Calloway Files, fictional network television for Bright Harbor Television under SAG-AFTRA's
TV/Theatrical contract, was offered through him on September 5 at $1,542.20 a day for two days, scale plus ten on
$1,402.00, and accepted. Its shoot days ran October 1 and 2 at a studio in Queens, its principal role making her
eligible to join SAG-AFTRA from October 1. Bright Harbor Television paid $3,084.40 into Halberd Talent's client trust
account on October 4, less $235.95 withheld for tax, and it was passed on to her October 10, less $280.40 commission:
$2,568.05. The nine saves: `last-term` January 8, 2029 at noon, `after-new-york` May 2 at 9 AM, `follow-up` May 11 at 4
PM, `meeting` May 25 at 8 AM, `offered` May 30 at 11 AM, `audition` June 5 at 7 AM, `offer` September 5 at 6 PM,
`work-day` October 1 at 5 AM, `paid` October 11 at 9 AM.

### The Walk

`npm run build` (`walk-fictional/build.txt`), the clone's `dist/` served by `vite preview` on port 4198
(`walk-fictional/served.txt`: the page served is `dist/index.html`, build `assets/index-7un1CKgb.js`, at `63fe7391`).
The page was read first, before a save was put in its slot and after: it loaded with no page error. Then `app-walk.mjs`
at 1440 by 900 and 390 by 844 on the new saves, as above. One change to the walk, made for the walk on `59da1351`: its
Calendar step looked for "Meeting At Stewart Talent", and with Halberd Talent's name on the item it would have found
none and left surface 29 out without a word. It looks for "Meeting At Halberd Talent" now, and says in the walk's list
when an item it looks for isn't there.

| Width | Surfaces | Found | Controls | Reached By Tab | Grayed |
|---|---|---|---|---|---|
| 1440 | 52, the same names in the same order as `walk/` | Nothing, on any | 1,663 | 1,481 of the 1,481 it can | 51, each saying why in its title and its panel |
| 390 | 52, the same | Nothing, on any | 1,507 | 1,325 of the 1,325 it can | 51, the same |

So at both widths, on every surface: no page or console error, no sideways scroll, every control named and reached by
Tab, the focus ring on every one Tab reached, and every grayed control saying why. The stop at the meeting at 390 took
two rows, 25 px inside the dialog; without the footer's wrapping it ran 17.3 px past it, as the first walk measured
(`walk-fictional/390/25-stop-meeting.txt`). Each walk took about 190 seconds.

### What Differed From The First Walk, And Why

Each page's words were set beside the first walk's (`walk/<width>/NN-*.txt`) and the walks' before this one, the agent's
and agency's names counted as one. At every surface the words that differed at 390 were the words that differed at 1440,
but for where a holiday's ✦ fell in the 1440 month grid's comparison against the first walk (30). Against the walk on
`a43b4f8f`, every surface but 26, 45 and 50 read the same word for word, at both widths. What differed, by its cause:

- **The agent.** His name and agency. The fictional line, on ten of the first walk's pages, is on none: his panel's
  notice (surface 03) says he and his agency are invented for the game. The real agency's published words on submissions
  ("We do not accept unsolicited submissions at this time.") became the game's own rule, "His office takes no
  submissions it hasn't asked for." (03, 06, 07, 09, 10, 17, 34, 41); "The game knows nothing of his real list and uses
  none of it." went from the reasons (10); the guide's Representation chapter and The Agent And How To Reach Him say he
  and the agency are invented (34, 41).
- **The life.** The class, the scenes and how they went, the School's credits and what the résumé lacks, the reasons
  (Room On His List near the bar this time: room for one lead aged 30 to 40 and one featured actor; five of seven at the
  bar; an offer about 21%), the roles, offers, booked work and their dates, the stops and the Calendar's items, the pay,
  the unions (SAG-AFTRA open to her, 19) and Money's statement.
- **The fixes of `9c3b7ee8`, `a43b4f8f` and `40eab86a`, where they were found.** The Ending It term says "no real offer
  of covered work through him" (09, 10, 17), and at `paid.json` End It: No Offer In 90 Days is grayed until December 6,
  2029, counting from his last offer and the two days she was employed (17). The Calendar's entries say "Getting there
  takes two hours each way, and the trip is part of it." (29, 31). The offer's card says "Written for an actor or an
  actress." (12), Desk Clerk being the one offer. How This Works gives deferred pay's why, "a student film" once a
  sentence: "Work you've booked. A student film's pay is deferred: it's paid only if the film earns money later, and no
  film in the game does, so it's listed and never paid." and "Deferred pay is shown and never paid: a student film pays
  its actors only if it earns money later, and no film in the game does." (45), "… it's paid only if the film earns
  money later, and no film in the game does, so nothing is paid." (50); deferred pay itself is on none of this life's
  career pages, which booked no student film. Finding Work's entry says "who it's written for", and "you're posted only
  the ones written for you or for either" (48); the Open Calls card shows it from the same lines as the offer's
  (`RoleFacts`), though no walked save had an open call on screen. A clash's second is missed and says where she was, in
  Settled (12, 13, 18: "Ivy, Paper Moons: You were at the audition for Nell in New York, so you missed the audition for
  Ivy on August 27, 2029 at 11:00 AM, and the film's director moved on without you.") and in its notice. And the stop at
  the first of two (26) says "It clashes with Audition: Ivy, Paper Moons at 11:00 AM. Each trip is from home and back,
  so you can be at only one, and it's this one, the first the clock reaches: that one is missed, and the clock won't
  stop at it.", and On The Way "Audition: Hester Vane, The Winter Ledger and Audition: Ivy, Paper Moons clash: each trip
  is from home and back, so you can be at only one. The clock stops only at Audition: Hester Vane, The Winter Ledger,
  and Audition: Ivy, Paper Moons is missed." `clash-stop.mjs` pressed Go at that stop: the clock ran to 6:00 PM with no
  stop at Ivy's, and Settled said it was missed and where she was, as the stop had said (`clash-stop.txt`).
- **Anything else: one sentence.** How This Works: The Agreement (44) says End It: No Offer In 90 Days needs "the days
  you're employed on covered work not counted", which `728b4972` added after the first walk's build (`8bac3141`). It is
  the only difference from the first walk that neither the agent, the life nor the fixes account for. Against the walk
  on `a43b4f8f`, there is none.

This life reaches most of what the first walk read: two auditions in progress at once and On The Way listing both (11,
26), promised pay with commission expected over scale at the work day (14), commission on a finished engagement and a
payday on the Calendar (19, 30). It doesn't reach an audition through him still in progress, which the first walk read
on 11 and 12 and the walk on `9c3b7ee8` on 12: here each of his rounds had settled by the save after it. Nor deferred
pay. It reaches more: SAG-AFTRA open to her, a round missed for another gone to (12, 13, 18) and the 90-day ending
grayed with the days employed counted (17).

She is never at two commitments at once. Of what the nine saves hold, she went to six in person, each away from home two
hours each way as the game reckons it: the meeting on May 25 (9 AM to 2 PM), Hester Vane on June 5 and September 3 and
Nell on June 18 and August 27 (9 AM to 1:30 PM), Nell's callback on June 25 (noon to 4:30 PM). No two meet, and no two
fall on one day. Both clashes, June 5 and August 27, ended with the second missed and its notice saying where she was
(`ashgrove.txt`).

A part written for an actor is never shown to it. The nine saves hold 56 roles: Ivy 13, Hester Vane 11, Jess 14, Sam 13,
Nell 2, Wren 2 and Desk Clerk 1, none of them Callum, Tobias Marsh, Ferris or Felix; no notice of the career names one
of those four; nor does any line of the walk's pages.

Found by reading the new pages, and not fixed:

- **On The Way says two things of a clash that can't both be true.** Its first sentence, as before `40eab86a`, still
  says "passes two commitments. The clock stops at each one so you can choose: press Go to be there and carry on, or
  Stand Here to stop the clock there."; the line `40eab86a` added under it says "The clock stops only at Audition:
  Hester Vane, The Winter Ledger, and Audition: Ivy, Paper Moons is missed." (26, at both widths; `clash-stop.txt`). The
  clock does as the second says. The opening sentence is On The Way's own (`TimeControls.tsx`), and wasn't made to
  agree. Smaller, in the stop's new line: "you can be at only one, and it's this one, the first the clock reaches: that
  one is missed" names the two by "this one" and "that one" where On The Way names them.
- Found on `a43b4f8f` and answered in words by `40eab86a`: the stop at the first of two auditions at one hour said
  nothing of the second, which the clock then ran past; and How This Works' deferred-pay sentences named "a student
  film" twice in one sentence.
- As found on the walks before, and left: a role cast to another actor comes round again after ten weeks
  (`POSTING.againDays`, the game's assumption) and he submits her for it again, so Nell and Wren each came round twice,
  Wren twice in Settled (13, 18) and Nell's first past its eight, and the notices don't say it's a new casting of a part
  already cast; Sam, a part for either, and the classmate Samuel Patel are near; and `jordan.ts` reads
  `AGENT.fictional`, which went with `59da1351`, so run now it would tell his notices only by his name.

### Defect 3, Asked Of Him

`ashgrove.ts` (adapted from `jordan.ts`, which stays as it was) played the walk's life by `make-saves.ts` itself, with
every notice the game was asked to say recorded as it was said, and compared each of the nine saves it wrote with the
walk's: the same to the byte (`ashgrove.txt`). No classmate, teacher or other person the life meets, in a notice or on
the walk's pages, is named Thomas, Ashgrove or anything near either (Tom, Thom, Tomás, Thompson, Ash-, Halberd): the
class is Caleb Brooks, Owen Walsh, Aaliyah Osei, Julian Kowalski, Hannah Rivera, Isaiah Donovan, Lucia Tanaka, Noah
Abara, Elena Reyes, Jordan Park, Zoe Mendez, Sofia Castillo, Imani Nguyen, Theo Sullivan and Samuel Patel; the save's
only person is Ada Cole; and the lists classmates are named from (`systems/school.ts`, `GIVEN_ACTRESS`, `GIVEN_ACTOR`,
`FAMILY`) hold no Thomas and no Ashgrove, so no seed's class can. Of the 957 notices said from the first day to October
11, 2029, 27 name him or his agency, each in full, and no other names anything near either. On the walk's pages 52 lines
at each width name him or Halberd Talent, and none anything else near them. His first notice was sixth of 500 unread at
`follow-up.json`. Of the eleven parts none shares a name with a classmate, in this class or in any of the 100 of
`app-walk-0` to `app-walk-99`, where the walk on `9c3b7ee8` counted a Theo in 64. (The first walk's own life had a
classmate called Jordan Kim, on its surface 20, whose seed `jordan.ts` didn't play.)

### The Route's Setup

`playtest-check.mjs`, as its header says: the build above with the nine saves in `dist/saves`, `npx vite preview --port
4291`. Each of `last-term.json`, `follow-up.json` and `paid.json` opened, Continue went into it, and the Career screen
opened, at January 8, May 11 and October 11, 2029, with no page errors (`../playtest-check.txt`, its first line naming
the build and the day). On `40eab86a`'s build it stopped at the first save, where no Continue was drawn.
`../PLAYTEST.md` still names the real agent, his fictional line, the first walk's folder and commit, and in step 4 a
stop at each audition, which this life's clash doesn't give, as the stop now says; those lines were passed on to be
corrected where that file is kept.

### What The Sections Above Say That Is No Longer True Of The Game

They are the record of then. Since `59da1351` the agent is Thomas Ashgrove of Halberd Talent and invented; no line of
his ends on "Fictional: his words and decisions here are invented." (How The Walk Was Made, T1, Defect 3); the pay's
notices name Halberd Talent, and the owner's open decision on the real agent that "Read and left" defers to was made;
the titles Defect 3 quotes name Thomas Ashgrove's office and Halberd Talent; and the walk's saves are played from
`app-walk-112`, whose life is the one above. Since `9c3b7ee8` Paper Moons's part for an actor isn't posted to an
actress, and since `a43b4f8f` it is Felix, not the Theo the first life auditioned for; and since `a43b4f8f` the first
life's two auditions at 11 AM on June 11, 2029, one in Manhattan and one in Brooklyn, couldn't both be gone to. And one
not from these: the meeting that Found And Not Fixed says didn't take a student from class has taken one since
`5daaeed8`.
