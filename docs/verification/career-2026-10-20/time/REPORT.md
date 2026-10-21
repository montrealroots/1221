# Brief 19's Time Area: The Stop, Tomorrow Morning, The Sleep Dialog And One Week's On The Way (D1 To D5)

Brief 18's S1 to S5 (`../../gaps-2026-10-20/criteria.md`), done for the career as brief 19's D1 to D5 (`../criteria.md`):
the career's auditions, meetings and work days stop the clock; an early call mustn't be jumped past; sleep must be
suggested around the next commitment and its trip; a dialog open while one comes due mustn't let it pass; a week's jump
must name what it stops at. Branch `b19-time`, from `2fc6493d`. Everything below was tested on the tree of the commit
that adds this file.

**Found first,** on the built app at 1440 and 390 (`before/walk-1440.txt`, `before/walk-390.txt`, saves from
`make-saves.ts`, walk `time-walk.mjs`) and in brief 14's banking journey (`before/banking-1440.log`,
`before/banking-390.log`: 9 of 10 at each width):
- At a plan of your own the stop offered Skip It and said nothing of what it does; pressed, the jump carried on. Call It
  Off on a partner's rehearsal ended the jump, also unsaid. A refused Skip It closed the stop and left the jump there.
- At 2:00 AM Tomorrow Morning read "7:00 AM · August 29, 2026", a day and five hours on, and ran past Friday's ten
  o'clock to stop there.
- At 7:15 AM, up from eight hours, Sleep suggested "A normal night." and 8 hours, to 3:15 PM.
- With Play on, the Sleep dialog's Now went from 11:00 PM to 11:01 PM in 65 seconds open.
- One Week from Friday 5:30 PM asked nothing, ran to Monday's classes and stopped there (step 8).

## D1: What Each Answer At The Stop Does To The Jump

**Built.** `src/engine/world/clock.ts` (new):
- A registry: a scheduled kind declares what its stop offers beyond Go and Stand Here (`StopChoice` :32, `defineStop`
  :52, `stopChoices` :58): a label, the command (also the feature its button is gated by), the payload from the item,
  `then` ('carry-on' or 'stay'), what it does, what On The Way calls it, a toast. A kind that declares nothing offers Go
  and Stand Here, as every one but these two did. A plan of your own declares Skip It (`calendar.skip`) and a partner's
  rehearsal Call It Off (`school.cancel_rehearsal`) (:105-122). A career system declares its own from its own module,
  e.g. `defineStop('pro.meeting', [{ label: 'Ask To Move', command: 'pro.ask_to_move', payload: (item) => ({ … }),
  then: 'carry-on', does: 'asks to move the meeting', ahead: 'ask to move a meeting' }])`.
- One rule for the jump (`carryOnTo` :73): Go goes through the commitment's hours and carries the jump on to where it was
  headed (its end, if later); a choice that goes through carries the jump on to where it was headed, stopping again at
  the next commitment; Stand Here ends it at the stop, paused. A refused choice changes nothing: the stop stays open and
  the refusal is said (`refusalOf` :80 reads a throw and `{ ok: false, error }` alike). `answerStop` :92 is the engine's
  half, for tests and journeys.
- The stop (`DueNow`, `src/ui/shell/TimeControls.tsx` :320) draws the kind's choices gated by their commands, says what
  each does to the jump before it's pressed, and runs it (`choose` :344). On The Way names only the choices of what it
  lists, and that the clock carries on after them (`choicesAhead` :70).

**What a player reads** (`after/walk-1440.txt`, `after/walk-390.txt`):
> Skip It marks your plan missed, at no cost but the plan, and the clock carries on to August 28, 2026 at 7:00 AM,
> stopping at the next commitment on the way. Stand Here keeps the clock paused here, and Meet Sam At The Station starts
> the next time it moves.

> Moving the clock to Tomorrow Morning (August 28, 2026 at 7:00 AM) passes two commitments. The clock stops at each one
> so you can choose: press Go to be there and carry on, or Stand Here to stop the clock there. You can also skip a plan
> of your own, and the clock then carries on.

A partner's rehearsal: "Call It Off calls the rehearsal off, and the clock carries on to …, stopping at the next
commitment on the way." A refused Skip It keeps the stop and toasts "That’s already over: it was kept, missed or called
off."

**Tests.** `tests/time-stops.test.ts`, D1: Tomorrow Morning from 9 PM with two plans, one from 11:30 PM to 12:30 AM
across midnight and one at 2 AM, played Go/Go (both kept, the same jump, the night slept), Skip It/Skip It (each missed
and said once, nothing else touched, the jump to seven), Stand Here at the first, and Go then Stand Here at the second; a
refused Skip It leaving the save the same to the byte; Call It Off on a partner's rehearsal (trust lower, the jump carried
on through the plan across midnight to seven); a kind declared in the test with an Ask To Move choice, moved two hours and
stopped at again. `tests/time-controls.test.ts`: the same night pressed on the real top bar under the real provider: On
The Way's words, the stop's words, Skip It on to the second stop, Stand Here, and a refused Skip It. Updated:
`tests/language-frame-ui.test.ts` (On The Way's sentence, now only Skip It where only a plan is on the way, and no Call It
Off), `tests/plans.test.ts` (Skip It's command read from the registry, and the stop running a choice's command),
`tests/tutorial.test.ts` (the registry's commands count as gated while the stop draws them `feature={choice.command}`).

**Status: Fixed And Verified.**

## D2: Tomorrow Morning At 2 AM

**Built.** `nextAtHour` (`world/clock.ts` :143): the next time the clock reads the hour, today's while it's still to come.
Tomorrow Morning, This Evening and Tonight use it, Next Monday `nextMondayAt` :149. Every Advance line gives its weekday,
date and time (`AdvanceMenu`, `TimeControls.tsx` :529).

**What a player reads** at 2:00 AM: "Tomorrow Morning · 7:00 AM · Friday, August 28, 2026" (before: "7:00 AM · August 29,
2026"). Pressed, the clock is at 7:00 AM that Friday with nothing on the way (before: Friday 10:00 AM, stopped at The
Courses And What They Ask).

**Tests.** `tests/time-stops.test.ts` D2 (2 AM, 6:59, 7:00, 11 PM, the night the clocks go back, This Evening, Tonight,
Next Monday, and the journey at 2 AM after a stop); `tests/time-controls.test.ts` (the line's words at 11 PM and 2 AM, and
where it lands). **Status: Fixed And Verified.**

## D3: The Sleep Dialog's Suggestion

**Built.** `suggestedSleep` (`src/engine/systems/life.ts` :1441) and `napNow` (:1508):
- The sleep model as it was: the night's length from stress, depth, the hour, recovery, age and debt, unchanged.
- The player's state and the time: a sleep that would end on a day whose night is already behind it (`lastSleptAt` since
  that day's midnight), from five in the morning (`SMALL_HOURS_END` :1495) and with no real sleep debt (`REAL_DEBT` :1492),
  is a nap. With energy at `SPENT` (25) or more nothing is needed: the dialog starts at the shortest sleep and says why
  (a sleep under six hours adds debt, `applySleep`). Under it, the hours that bring energy back to full, found by
  `applySleep` itself. In the small hours, inside a night nobody chose that's still running, or with real debt, the
  night's suggestion stands. The scripted players (`tools/policy.ts`, `tools/lives.ts`) sleep only at eleven or before
  five, so their lives are unchanged: the `roundups` save and this area's three saves were the same byte for byte on the
  final code.
- The next commitment and its trip: an hour to get up and the item's own `travelMinutes` (a new optional field,
  `src/engine/core/scheduler.ts` :50, kept by `schedule` only where given, `src/engine/core/simulation.ts` :371),
  `travelMinutesOf` (`src/engine/world/calendar.ts` :218), half an hour across town where the item gives none: the hour and
  a half every existing commitment had. A nap that doesn't fit before a commitment is cut to what fits, and says both.
- Any length can still be chosen: the slider is unchanged, half an hour to fourteen hours.

**What a player reads:** at 7:15 AM, "You’ve already slept since midnight, and with your energy at 100 you don’t need
more sleep yet. A sleep under six hours adds to the sleep you owe, so it’s best kept for the night." (half an hour); at
11 PM before a ten o'clock commitment, "A normal night." (8 hours, as before); low in the morning, "You’ve already slept
since midnight, but your energy is down to 18. Seven and a half hours would bring it back to full."; before an audition
a two-and-a-half-hour trip away, "“An Audition” is in 10 hours. Getting up takes an hour, and getting there 2 hours and
30 minutes, so there isn’t time for a full night." (6.5 hours, waking in time to get up and make the trip).

**Tests.** `tests/time-stops.test.ts` D3: the morning and the same evening; a low morning (the nap brings energy to full,
half an hour less doesn't) and that nap cut by a commitment; the trip, the night taken and ending in time; the small
hours after a short sleep and a call; real debt; a night nobody chose still running, at 2 AM and after a stop at 5:15 AM.
Updated where the old moment's premise was the defect (a morning's sleep taken for a night): `tests/personality.test.ts`
(the trait comparison made at bedtime), `tests/defects-g4-2.test.ts` (counted from its hour, at bedtime),
`tests/evidence-g01-life.test.ts` (the 7:30 AM dialog's reason is the nap's, and the Gym still named beside it).
**Status: Fixed And Verified.**

## D4: The Sleep Dialog Holds The Clock

**Built.** `useHeld` (`TimeControls.tsx` :55), the provider's own `hold` as the guide and the reference use it: Sleep, On
The Way and Skip To Event hold the live clock while open. Not Yet or Cancel lets it go on from where it was, the time open
not counted; Sleep moves it as the night does, and the live clock goes on from the wake.

**On the built app:** with Play on, the Sleep dialog's Now stayed at 11:00 PM through 65 seconds open (before: 11:01 PM),
and 65 seconds after Not Yet the clock read 11:01 PM (`after/walk-*.txt`, "The live clock and the Sleep dialog").

**Tests.** `tests/time-controls.test.ts` D4, the real provider with its timers faked: a minute open moves neither the
clock nor the save; Not Yet and five seconds move it five; Sleep moves it the hours and the clock goes on; On The Way and
Skip To Event held and let go. **Status: Fixed And Verified.**

## D5: One Week Asks On The Way First

**Decided: the game was wrong, not the step.** The guide had said all along that a jump which passes a commitment lists
it first ("Moving Time On"), and the stop's own dialog stopped at Monday's classes; On The Way read only the timeline,
and the School puts each week's classes on it at six on the Sunday evening before (`planWeek`, `systems/school.ts`).

**Built.** `onTheWay` (`src/engine/foresight.ts` :37, new): the jump played first on a copy of the save opened from its
own record (`loadSave(structuredClone(…))`), Go answered at every stop, and each stop it makes listed beside what the
calendar holds, those not on it yet marked foreseen. Nothing in the save is touched, and the copy's draws are the save's.
A commitment the clock is standing at, which the next move runs at once, is no longer counted as a stop. The Advance
menu's On The Way uses it (`TimeControls.tsx` :134), and Skip To Event counts and lists the foreseen stops up to a month
ahead. A week from a new life's first Friday evening took 12 to 38 ms.

**What a player reads,** One Week from Friday 5:30 PM (`after/banking-1440/trace.json`, step 8): "Moving the clock to One
Week (September 4, 2026 at 5:30 PM) passes five commitments. The clock stops at each one so you can choose…", then
"Classes — August 31, 2026 at 9:00 AM, not on your calendar yet" for each day, and "What isn’t on your calendar yet goes
on it as the clock moves, before it comes."

**The step, as strict as it was:** `tools/playthroughs-ui.mjs` is unchanged. Banking is **10 of 10 at 1440 and at 390**
(`after/banking-1440.log`, `after/banking-390.log`), on this tree's build served from `dist/` on port 4502, from the
`roundups` save written by `npx vite-node tools/scenarios.ts -- --scenario roundups --seed sc-0`, as `runs17.sh`'s UI lane
writes it.

**Tests.** `tests/time-stops.test.ts` D5 (the five days of classes, and a doctor's visit the week books, foreseen; the save
the same to the byte; the jump stopping at exactly what was listed; the calendar's own listed as held; from the Monday
nothing foreseen); `tests/time-controls.test.ts` D5 (the bar's One Week against the step's own regular expression, the
classes marked, Cancel; Skip To Event counting them). **Status: Fixed And Verified.**

## The Guide

The chapters What's Coming, The Clock, Moving Time On and Sleep (`src/engine/content/tutorial.ts`) and How This Works for
The Calendar, The Clock, Moving Time On (`src/engine/content/guide/day.ts`) and Sleep (`src/engine/content/guide/body.ts`)
say what the game does now: Skip It and Call It Off carry the jump on and a refusal changes nothing; the three dialogs hold
the clock; each line gives its day, and Tomorrow Morning after midnight is that morning's; On The Way lists what isn't on
the calendar yet; the suggestion reads whether the night's behind you, your energy and the trip; a commitment slept
through is missed (Sleep's summary and chapter said it "happens without you"). The removed mistake, "After midnight,
Tomorrow Morning means seven on the next date", is an interpretation of the new behavior now. Each of those sentences is
held beside the behavior it states in `tests/time-controls.test.ts` and `tests/time-stops.test.ts`. Guide quotes: 578,
all said.

## Mutations

`mutations.txt`: 24 mutations, each applied alone and the tests holding its claim run; all 24 killed. M16 (the night
nobody chose still running) survived its first run, where earlier guards settled every case tried, and was killed once
its test gained a stop at 5:15 AM inside such a night.

## Assumptions (SLATE's, said where they apply)

- Getting up takes an hour, and the trip half an hour across town where the item gives none: the hour and a half the game
  kept for everything, split.
- A sleep begun before five in the morning is the night's.
- "No sleep needed yet" is energy at `SPENT` (25) or more, the line under which the game already says to sleep before
  training; real sleep debt is `sleepReason`'s eight hours past a normal day's.
- Skip To Event foresees a month ahead at most; On The Way, as far as the jump goes.

## Checks, On The Final Tree

- `npx tsc --noEmit -p .`: exit 0 (`runs/typecheck.txt`).
- `npx eslint` on every changed `.ts`, `.tsx` and `.mjs` file: exit 0 (`runs/eslint.txt`, `runs/eslint-files.txt`).
- `npx vitest run` on the 91 test files that import a changed module or name the changed words (`runs/vitest-files.txt`),
  `--maxWorkers=1 --minWorkers=1`: 91 files, 1416 tests passed (`runs/vitest.txt`). After it, one wording was added (a
  trip inside a call's own hours, `travelMinutes: 0`, says "Getting up takes an hour", where it would have said "getting
  there less than a minute"); `tests/time-stops.test.ts` holds it, and it and the five files that read the suggestion
  most (`defects-g4-1`, `defects-g4-2`, `evidence-g01-life`, `simulation`, `language-frame`) passed again: 6 files, 201
  tests. Nothing in the game schedules `travelMinutes: 0` yet.
- The gate's checks without the suite (`runs/checks-chain.txt`), read from the file: exit 0 (`runs/checks-exit.txt`,
  `runs/checks.txt`): title case, labels, plurals, voice, tics, doc refs, wired (2 declared words, as before), deciders
  (24, none new), spelling, typos, geography, inventory (158 commands), DEVMAP and TRACEABILITY (regenerated), capabilities,
  coverage, the student matrix, the text inventory (every source read; engine-speak 316, under its ratchet), guide quotes
  (578 of 578), surfaces (271, all 4,236 sources claimed) and the completion matrix.
- The built app: `npm run build` exit 0 (`after/build.txt`); the walks at 1440 and 390, 0 errors; banking 10 of 10 at both,
  on the build before that last wording, which no walk or journey reaches.

## Shared Files Touched

- `src/engine/core/scheduler.ts` (`ScheduledItem.travelMinutes?`, optional; schema 94 stays) and
  `src/engine/core/simulation.ts` (`schedule()` takes it, kept only where given).
- `src/engine/world/calendar.ts` (`GETTING_UP_MINUTES`, `IN_TOWN_MINUTES`, `travelMinutesOf`).
- `src/engine/systems/life.ts` (`suggestedSleep`, `napNow`, `hoursSaid`, `REAL_DEBT`, `SMALL_HOURS_END`).
- `src/engine/content/tutorial.ts`, `src/engine/content/guide/day.ts`, `src/engine/content/guide/body.ts`.
- `tools/devmap.mjs`: a command a `defineStop` names is on the screens that draw the stop's choices.
- Tests: `tests/tutorial.test.ts`, `tests/plans.test.ts`, `tests/language-frame-ui.test.ts`, `tests/personality.test.ts`,
  `tests/defects-g4-2.test.ts`, `tests/evidence-g01-life.test.ts`.
- Text: `docs/text/second-pass/frame.json`, `tutorial.json`, `health.json`; new `docs/text/statuses/time.json` and
  `docs/text/surfaces/time.json`; regenerated `docs/text/inventory.json`, `INVENTORY.md`, `SURFACES.md`.
- Generated: `docs/DEVMAP.md`, `docs/TRACEABILITY.md`, `docs/verification/integration-2026-10-16/COMPLETION-MATRIX.md` and
  `completion-matrix.json`; and the handoff's completion line (`SLATE_CURRENT_MASTER_HANDOFF.md`, line 8), restated to the
  matrix's: 46 rows measured on `engine` or `app` go stale with any change under `src`, so every builder's branch shows it.
- `docs/verification/gaps-2026-10-20/criteria.md`: S1 to S5 marked done in brief 19.

## For Integration

- A career kind declares its stop's choices with `defineStop(kind, choices)` from `world/clock.ts`, once per kind (a second
  throws), at the top level of its own module. The stop draws each as a button gated by its command, so the command needs
  its chapter's `opens` and one guide entry's `covers` as any command does; `tests/tutorial.test.ts` and `tools/devmap.mjs`
  read the declarations. Its `then` decides the jump: 'carry-on' unless the choice should end it there.
- An appointment in another city sets `travelMinutes` when it's scheduled (`sim.schedule({ …, travelMinutes: 120 })`); the
  Sleep suggestion keeps it back. A call with the trip inside its own hours (the showcase's) gives `travelMinutes: 0`.
- On The Way plays the jump on a copy of the save. A handler with effects outside the universe would run them twice;
  none has any.
- Not done: the Calendar screen still shows a week's classes only from the Sunday evening before. On The Way and Skip To
  Event foresee them; the calendar grid doesn't, and that's the School's planning, left as it was.
