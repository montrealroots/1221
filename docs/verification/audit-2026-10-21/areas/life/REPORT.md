# Brief 20, The Life Area: Sleep, Food, Weather, The Day And Its Plans, And Consecutive Work Days (D3), 2026-10-22

Branch `b20-life`, from the starting point `12c04ee1`, in three commits: `8e6a853b` (D3, the bedtime, the work day's
cost, the night on set, the weather's rounding, the plan clash, the Day look and the holiday's name), `5e26b7fe` (F1: a
sleep after the night wears nothing; F12: the slept-through title counts in words; one test strengthened) and `7fc02bfb`
(the second mutation run). (Its worker couldn't write this file from its own clone; the coordinator committed it from
the worker's report, unchanged in substance, with the merge.)

## Rows And Promises

`effects/life.json`: 36 rows, read against the code. 38 were seeded; `life.sleep_started` and `life.woke` went with their
events, which were written and never read. 35 are Implemented And Verified (21 mechanics, 15 looks or notices). One is
Implemented, Verification Incomplete: `notice.core/simulation#top`, the "Didn't Go Through" notice, which only handlers
`tests/simulation.test.ts` registers reach; no current life does.

44 promises: 43 Implemented And Verified. `body.how>productions.nights` is Verification Incomplete: no gate test plays a
School night through the clock at readiness under 60. That one is the School area's to close.

## D3: Consecutive Work Days

Measured on a shoot week (`tests/fakes/shoot-week.ts`): five 7 AM calls in New York, two hours from New Haven, played an
hour at a time.

**Before the repairs:**

| Player | Day 1's Call | Day 5's Call | Judged, Days 1 To 5 |
|---|---|---|---|
| Bed at 11 PM | energy 90.7, debt 2.4, readiness 93.6 | energy 27.9, debt 10.6, readiness 48.6 | 94.5, 94.5, 94.8, 93.2 (tired), 88.8 (tired) |
| Bed at 8 PM | readiness about 95 (energy 91, debt 1.0) | readiness about 95 | about 94.5 |
| Brief 19's scripted player (bed at 11 PM, or before 5 AM) | debt 15.8, readiness 71.9 | debt 67.4, readiness 20.1 | 94.5, 83.8, 76.5, 74.9, 74.1 |

The scripted player's readiness by day was 71.9, 39.1, 24.5, 21.9 and 20.1.

**After:**

| Player | Day 1's Call | Day 5's Call | Judged, Days 1 To 5 | Energy At The Wrap |
|---|---|---|---|---|
| Bed at 11 PM | energy 90.7, readiness 93.6 | energy 26.9, readiness 47.8 | 94.5, 94.5, 94.8, 90.2 (tired), 88.4 (tired) | 48.8, 27.7, 1.5, 0, 0 |
| Bed at the hour the game names (8:00 PM) | energy 91, debt 1.0, readiness 94.8 | readiness 94.9 | 94.5 to 94.8 | 50 every day |
| The scripted player | debt 1.0, condition 97.5, readiness 96.1 | debt 3.5, condition 94.5, readiness 70.9 | 94.5 to 95.0, never tired | not read |

The scripted player's readiness by day is now 96.1, 88.7, 82.5, 77.2 and 70.9.

The brief's three questions:

- **(a) The 11 PM player against the advised one.** The 11 PM player wears down a day at a time, as five-hour nights
  should, and is judged tired from the fourth day. The advised player stays level.
- **(b) Is the bedtime said by the evening before?** It wasn't. From 6 to 8 PM the Sleep dialog said only "A normal
  night.", and from 9 PM that it "isn't time". Now Home's calendar, the day's look and the Sleep dialog say "A full night
  before it, with an hour to get up and two hours to get there, means being asleep by 8:00 PM." (`fullNightBefore`,
  `fullNightWords`). After that hour the dialog says it "needed you asleep by 8:00 PM."
- **(c) Does a shoot day cost less than a School rehearsal?** It did: a shoot day cost nothing beyond its waking hours,
  while a rehearsal call takes 8 energy. Now a work day takes `ESTIMATE.energy.rehearsal` once it's judged, one line in
  the career area's `projobs.ts`, which also reaches a professional stage rehearsal or performance (the same kind of item).

**Decision.** The body's figures were right. The collapse was a short night counted twice. The rules now:

1. A short night's costs (debt, condition and mood) are the night's alone. A sleep after the night is on record adds none
   of them (`applySleep`'s `night` flag).
2. The game names the bedtime for a full night by the evening before.
3. A work day costs a rehearsal's energy.

**The same defect in a played journey** (the older graduate, `tests/journey-career-older.test.ts`): her student film's
three calls were met at readiness 70.7, 37.5 and 23.6 and judged Working. Now they're met at 94.5, 85.4 and 80.8 and
judged Strong. So her referral comes from the film's director on 22 November 2029, not from The Winter Ledger in April
2030. The test, a career-area file, was rewritten to the life it now plays, its comments keeping what it said before.

## The Coordinator's Items

- **The craft area's readiness threshold.** The craft area's 62.1 isn't a night lost: its fixture's `tend` (TEST SETUP)
  reset her by hand at 10 PM to energy 90 and debt 0, so readiness at the showing reflected 14 hours awake from a rested
  start, under the 15.84 hours past which the project's own source (Van Dongen 2003) has lapses rising. A night lost in a
  played life does cost the work: in the shoot fixture, played from her Sunday wake, looked after and kept up all night,
  she met the call at readiness 53.2 and was judged 91.0 against 94.5, the cost named "Readiness At 53, Under 60".
  *Kept, by design:* `sufficientReadiness` 60 is a knee, not a cliff (the fatigue factor is 1 at 60 and falls to 0.6 at
  0), and it sits under the 70 to 95 a rested day reads. Readiness 59.7 cost 0.1; 50.3 cost about 5. **For the owner:** in
  this fixture the knee falls at about 20 hours awake, later than Van Dongen's 15.84. Moving it is the evaluation's call,
  and it wasn't moved.
- **F1 (the journeys).** D3 itself. The first commit took out the debt counted twice, but a nap still paid the night's
  wear (4.2 condition and 7.3 morale, measured). Repaired in the second.
- **F9 (the hungry older saves).** The body's rule as designed, not a disconnection. Hunger wears condition (0.5 an hour)
  and morale. Condition reaches readiness (a factor of 0.7 at 0), the energy a night puts back (0.8 at 0), the year's
  mortality (up to three times as likely, `frailty`) and the sick days a condition under `sickBelow` allows. Weight reaches
  starvation's end. Nothing in the code, the guide or the notices declares that malnutrition brings illness or care, so
  it isn't a declared connection left unread. **For the owner:** whether it should is a new mechanic, not a repair.
- **F12.** "You Slept Through One Commitment", "Two Commitments": the count in words under ten, in figures from ten.
- **The weather's rounding.** `highC` and `lowC` are kept unrounded, and each figure shown rounds once. Before, 384 of a
  year of New Haven's hourly readings fell outside the day's own range: 238 over the high and 146 under the low.

## Comparisons (B1, B3)

- **Sleep, 8 h / 6 h / 3 h:** energy 92.0 / 78.2 / 38.2; debt 0.68 / 1.36 / 8.34; readiness 89.1 / 78.9 / 50.2; a self-tape
  20.3 / 20.3 / 19.5. Six hours scores as eight, both over the knee. Money and fitness the same in all three.
- **A meal:** nourishment 100 against 60.7, readiness 70.0 against 62.6, $5.00 spent; the rest as the twin's.
- **A shower:** stress 12.44 against 15.53; a tenth of the 30.9 hygiene washed off.
- **Unwinding:** stress 4.96 against 15.29, morale 65 against 62.
- **The weather:** a run in fine weather built 0.59 fitness against 0.54 indoors (×1.1) and burned 7.9 kcal/kg against
  2.1; everything else the same.
- **Labor Day:** no classes that day; Friday's and Tuesday's held.
- **Illness and injury:** the flu refuses a workout and makes a sick day excused; a sprain refuses a workout until it
  mends; a fracture's classes are missed and excused; all three lift as the condition passes.
- **A class day slept through:** missed and unexcused, against the twin's attended.
- **A plan of her own:** it holds its hour against a workout, a meal or practice; a shower is still allowed.

## D1: Time

Every advance stops at each commitment. A week in one jump equals jumps to each 7 AM (the serialized state identical),
and minute steps equal one jump; hourly steps keep her up, by design. A save and a load at a stop come out the same.
Groceries are bought once a day over a month. The clash and the Go through a commitment after a night not slept were
found and repaired (below).

## Defects: The Failing Output, The Repair, The Test, The Mutation

1. **A short night counted twice (the debt).** The scripted player's debt reached 67.4 ("expected 67.425 to be less than
   8"). `life.ts` `applySleep`, `life.sleep`. `tests/b20-life-fatigue.test.ts`. B20-LIFE-1.
2. **A short night counted twice (the wear, F1).** Condition fell from 89.1 to 54.4 over the week. `applySleep`
   (`restful`). The fatigue test. B20-LIFE-36.
3. **No bedtime said by the evening before.** `fullNightBefore`, `fullNightWords`, on Home, the Day look and the Sleep
   dialog. `tests/b20-life-screens.test.ts` and the fatigue test. B20-LIFE-2, 5, 32, 33.
4. **A work day cost no energy** ("expected 58 to be close to 50"). `projobs.ts`, one line. The fatigue test. B20-LIFE-3.
5. **A night started at a 7 AM call by Go after a night not slept.** She wrapped at energy 64.4 against the rested
   twin's 50.0 ("expected 64.4 to be less than 50"). `sleepAlone`: no night starts at a commitment she attended that runs
   past the night; a short one inside the night is still lived inside it, as designed. The fatigue test. B20-LIFE-35.
6. **Two plans that clash both kept** (`['done','done','done']`). `plans.ts`, `occupiedAt(…, except)`: the later is
   missed, with a notice. `tests/b20-life-time.test.ts`, `tests/b20-life-looks.test.ts`. B20-LIFE-4.
7. **The weather's hours past the day's high and low** (`[ …(384) ] to deeply equal []`). `weather.ts`.
   `tests/b20-life-looks.test.ts`, and `tests/weather.test.ts` tightened from a degree's slack to none. B20-LIFE-34. Two
   pinned hours in `tests/evidence-g07-life.test.ts` moved: 22 to 21 °C, and 30 to 29 °C at 73% (heat index 33.3, still
   indoors).
8. **The US's Labor Day, named in the dataset's British spelling.** `tools/build-holidays.mjs`, `public/holidays/us.tsv`. B20-LIFE-30, 12.
9. **The Day look's wording:** "kept in United States", and the daylight as a readout ("12h 54m"). `day.tsx`.
   B20-LIFE-16, 31.
10. **Home's "you're not in New York"** under a shoot day that carries its own trip. `Home.tsx` (the guide area found
    it too; the merge kept one repair). B20-LIFE-5.
11. **The nap's reasons said a nap adds to the debt.** The reasons and the guide's line rewritten and marked.
12. **Two events written and never read.** Taken out.
13. **F12's title.** B20-LIFE-37.

## The Twelve Kinds, And How Each Was Looked For

1. Values written and never read: the emits and fields searched; the two events above went.
2. Choices that promise a difference and make none: the twins. Six hours of sleep is eight for the work, the stated knee.
3. Success reported with nothing changed: the clashing plan's "done".
4. Effects worked out and never applied: the bedtime existed only as the dialog's reason at bedtime.
5. Notices or tutorials describing behavior that isn't there: the nap's reason and the guide's line.
6. Charged twice or rewarded wrongly: the short night's debt and wear, and the night credited on set.
7. Time skipping an obligation: a week, a morning and minute jumps compared; groceries over a month. None found.
8. A save and a load dropping or replaying a consequence: a save at a stop, then a load. None found.
9. Impossible scheduling: the plan clash. The School's classes handler still doesn't read `occupiedAt`; the School
   area's.
10. A control wired to the wrong command: Sleep, Look After Yourself, Skip It and Call It Off. None found.
11. A feature only a test's hand reaches: the "Didn't Go Through" notice, and the Sleep dialog's `startAt`.
12. An opportunity offered again against what's done: the bedtime's advice after the night was slept, repaired with a
    `lastSleptAt` guard.

## Mutations

37, in `mutations/life.json`, both runs in `mutations/life.txt`. The first run (1 to 35): 34 killed and one survived,
B20-LIFE-28: at 2 PM the reading equals the day's high once both round from one figure, so a look that showed the high
read the same. The second run: 28 killed once the test read the look at 9 AM too; 36 and 37 killed. No setup errors.

## Outside The Area

- `projobs.ts` (the career area's), one line, the work day's energy.
- Test files of other areas changed: `tests/journey-career-older.test.ts` (the referral, rewritten),
  `tests/journey-career.test.ts` (life A's presses moved from 10:00 to 10:20), `tests/evidence-g08-life.test.ts` (the
  morale knob's fixture now makes its four hours the night, as TEST SETUP), `tests/evidence-g07-life.test.ts`,
  `tests/weather.test.ts`, `tests/language-dynamic.test.ts`, `tests/sleep-commitments.test.ts`,
  `tests/evidence-g04-life.test.ts`.
- Other areas' files: `Home.tsx`, `TimeControls.tsx`, and second-pass marks in the frame, health and career files.
- For other areas: the School's classes handler doesn't read `occupiedAt`; and in the old older graduate's life, The
  Winter Ledger's thirty-odd performances were each judged at readiness 60.7, an observation for the career area that
  wasn't looked into.

## What's Left

- The Sleep dialog still sleeps from now: `startAt` exists, and no screen offers it.
- The School night's fatigue promise is unverified (the School area's).
- The "Didn't Go Through" notice is reached only by tests.
- Not measured: a long commitment in the small hours inside a night already paid; a jump of more than an hour cut short
  by an early call, which pays a whole night.
