# Brief 20, The Creation Area

Written down by the coordinator from the creation area's report as it returned it (2026-10-22): the harness wouldn't let
the area write this file itself. The words are the area's but for this note.

**Clone:** `b20-creation`, from `12c04ee1`; nothing pushed, the stash never used.

## Commits

- `653b250a`: the twin tests, the no-leak tests, the abilities test, the looks test, the copy fix with its test, the
  corrected `livesWhereBorn` comment and `tests/creation.test.ts`, and the mutation list.
- `b3e2ecb0`: the 93 rows read against the code; the mutation runs; one test strengthened after a survivor; three traits
  measured another way; three mutations added.
- `dd5c80b3`: the comments that pointed at this report point at the row `create.livesWhereBorn` instead.

New test files: `tests/b20-creation-{twins,personality,noleak,abilities,looks,copy}.test.ts`. Changed: `tests/creation.test.ts`
and `tests/language-frame-ui.test.ts`.

## Rows By Status

93 rows: **92 Implemented And Verified**, **1 Implemented, Verification Incomplete** (`create.livesWhereBorn`); 78
mechanics, 15 presentation. None seeded (`effects.mjs --todo creation` lists nothing, `--check` names no problem in
`creation.json`); all read at `12c04ee1`. The area has no promises.

**The interests are out of scope at the owner's word:** the owner took them out on 2026-10-10, and they aren't restored.

## The Comparisons

Each is a test the gate runs, with the same seed in each pair.

- **Starting means (`wealth`).** The first morning's checking, savings, card balance and credit score:

  | Means | Checking | Savings | Card | Score |
  |---|---|---|---|---|
  | Nothing | $43 | $0 | no card | 520 |
  | Scraping | $1,348 | $326 | −$913 | 610 |
  | Modest | $5,217 | $7,065 | −$457 | 690 |
  | Comfortable | $19,565 | $45,652 | $0 | 748 |
  | Wealthy | $92,391 | $413,043 | $0 | 795 |
  | Inherited | $260,870 | $2,608,696 | $0 | 812 |

  At 10 AM the four with need receive +$13,318.50, and the wealthy and inherited pay −$1,882. On 11 October autopay clears
  the scraping $913 and the modest $457. What mustn't differ, and doesn't, for all six to 2 November: classmates,
  attributes and the career's postings.
- **Pronouns and title.** Every part posted is written for the life's title or for either: actresses were posted Ivy and
  Hester Vane, actors Felix and Tobias Marsh, and the parts for either on the same Mondays to both. she/her against
  they/them billed as an actress gives the same save to the byte, but for the pronouns themselves, and he/him against
  they/them billed as an actor the same. The same cold self-tape is judged 20.4 for an actress and an actor.
- **Birthplace.** New York: a US citizen, no visa, no status check. London or Toronto: that country's passport, an F-1
  ending 31 May 2029 and sixty days, and one `documents.us_status` check on the clock.
- **Where the life begins.** Every life a player makes begins in New Haven at 7:30 AM on 24 August 2026, in US dollars,
  even where a draft named something else. The engine's start elsewhere, which only tests and tools reach: a New York life
  gets dollars at Chase, Labor Day on 7 September and New York's weather; a London life pounds at Barclays, the summer bank
  holiday on 31 August and London's weather.
- **Height and weight** (175 cm at 62 kg and at 95 kg). The body is as given, and 300 cm is drawn as if nothing were given.
  The cold self-tape is judged 20.8 for both. After 14 morning workouts, 62 → 61.491 kg and 95 → 94.222 kg. The year's
  chance of death 0.000713 at a BMI of 20.08 against 0.001034 at 30.77.
- **Birth date.** The birthday is on the calendar on its own date; on 3 November 2026 the notice reads "Happy Birthday: 27:
  You're 27 today."
- **Loved genres.** At the Summer Cabaret's first *Miss Julie* rehearsal a drama lover gets +1.5 morale and −1.5 stress
  against a lover of westerns; a comedy lover's hour equals the westerns lover's, and the westerns lover's a life that
  loves nothing.
- **The tutorial.** In a guided life `life.look_after` is refused until its chapter is read, in order, and then works; "I
  Know SLATE" refuses nothing. Both start paused.
- **Start dates** given by a tool are kept, across a save and a load too.
- **Save and load.** A life saved and opened at its first moment is the same to the byte as one played straight, ten weeks
  on.
- **A jump of a week** pays the scholarship once, as stepping the week hour by hour does.
- **The traits** (the plain twin → the twin with the trait):

  | What was measured | Plain → with the trait |
  |---|---|
  | Stress after 2 hours awake on empty, from 40 | Even Tempered 42.477 → 41.798; Quick Tempered → 43.136; Highly Strung → 43.496; Detached → 42.005; Loyal → 42.856; Independent → 42.097; Guarded → 42.159; Peacemaker → 42.947; Holds Grudges → 42.731; Self Assured → 41.915 |
  | Stress left after 2 hours awake, from 40 | Resilient 39.277 → 39.148; Burns Out → 39.429; Forgiving → 39.208 |
  | Hygiene after 4 hours awake, from 100 | Orderly 93.6 → 94.692; Chaotic → 92.096 |
  | A meal's lift to morale | Sentimental 2 → 2.279; Needs People → 2.354; An Open Book → 2.193; Unshakeable → 1.516 |
  | A meal's cost, cents | Frugal 500 → 429; Spender → 608; Generous → 549 |
  | Energy a night's sleep gives back | Homebody 47.738 → 53.843; Restless → 43.19; Light Sleeper → 39.416; Sleeps Anywhere → 54.694 |
  | Weight after the first midnight, kg | Disciplined 80 → 79.994; Indulgent → 80.009 |
  | Preparation one step moves at 7:30 AM | Early Riser 0.475 → 0.489; Night Owl → 0.423; Curious 0.391 → 0.444; Single Minded 0.282 → 0.32; Scattered 0.482 → 0.548; Self Critical 0.39 → 0.443 |
  | Bond lost when a rehearsal is slept through | Keeps Accounts 3 → 3.294 |

- **The personality axes** (5 against 95):
  - Emotional Stability: stress after 2 hours on empty 43.66 against 41.51; starting composure 26.8 against 58.3.
  - Ambition: stress after 2 hours on empty 41.91 against 42.85.
  - Conscientiousness: energy back from a night 38.27 against 55.89; starting discipline 32.5 against 77.5.
  - Openness and Agreeableness: +3.6 morale at the Cabaret's read-through.
  - Extraversion: +7.2 stress at the Cabaret's first curtain for the introvert.
  - Risk Tolerance: at 50 and 65 the card is cleared; at 80 it pays $40 and carries $873.
- **The abilities** (each at 30, then 90, the same cold self-tape):

  | Ability (brief) | At 30 | At 90 |
  |---|---|---|
  | Emotional Depth (Found Footage) | 19.1 | 23.1 |
  | Presence (Yakuza) | 19.5 | 21.6 |
  | Listening (Yakuza) | 19.4 | 22.0 |
  | Imagination (Dark Fantasy) | 17.9 | 20.7 |
  | Focus (Mystery) | 19.3 | 23.5 |
  | Memory (Caper 2) | 18.5 | 22.1 |
  | Adaptability (Found Footage) | 19.2 | 22.6 |
  | Composure (Biker 2) | 18.1 | 22.8 |
  | Vocal Expression (Dark Fantasy) | 18.4 | 20.5 |
  | Physical Expression (Action) | 18.3 | 21.5 |
  | Discipline (Caper 2) | 18.2 | 21.4 |
  | Stamina (Superhero) | 18.7 | 21.2 |

  With every ability at 30, or every one at 90, the career posts the same parts on the same Mondays to 7 December.
- **No leak** (the whole save equal, the answer itself taken out), each pair played through a self-tape, a meal and the
  clock to 1 December: race and ethnicity (none, two, or Another as "Cornish and Sámi"); the background (empty or
  written); the portrait (none or a headshot); the legal and display names (different names, put as tokens). All four
  pairs equal.
- **The looks.** Each of the six says the engine's own figure, checked before and after a command changes it.
- **Measured, not made a test.** Thirty days of groceries cost $300.00 for a plain student and $257.70 for a frugal one;
  Review's Food Each Month shows $304.17 and $261.24 for a 365/12-day month, so the figure creation shows matches what the
  clock charges.

## Defects

1. **Repaired: the Generous line.** Dispositions & Traits said Frugal, Spender and Generous each change "what your food
   costs and how much a meal lifts you"; Generous has no `mealMood`, so it doesn't change the lift. The failing test on the
   old words (`tests/b20-creation-copy.test.ts`): `expected [ 'Frugal', 'Generous', 'Spender' ] to deeply equal [
   'Frugal', 'Spender' ]`. The words: "for Frugal, Spender and Generous, what your food costs, and for Frugal and Spender
   how much a meal lifts you." `tests/language-frame-ui.test.ts` quotes the line and was brought up to date; the source was
   marked Rewritten in the second pass, by `frame`, the area that owns it. Mutation B20-CREATION-31 puts the old words back
   and is killed.
2. **Not repaired, for the owner: `livesWhereBorn`** is written and never read in any life a player can make. Creation
   always starts at the School (`newLifeConfig` and `newLifeFrom` both apply `atSchool`); Where You Live, I Still Live
   Where I Was Born and What You Are Starting With are drawn only where `config.school` is unset, which never happens for
   a player; and the engine never reads the field. The field's comment and `tests/creation.test.ts`, which asserted those
   controls as if a player saw them, now say they're unreachable. Taking the field out would touch every area's
   `quickSave(... livesWhereBorn: true)` and `decided.ts`, so it was left.
3. **Weak tests found by mutation, now stronger.** B20-CREATION-2 survived: the conscientiousness twin measured only the
   energy a night gives back, so its reading of sleep's quality wasn't held; the test now reads how deep the night was,
   and the rerun killed it. Recording which tests each knob's mutation fails found three more: Unshakeable survived
   mutation 33, its recovery's bonus lowering stress when its gain's reading was taken out, and is measured by morale now
   (killed by 35); Early Riser and Night Owl were measured by a night's sleep, which reads two of their knobs, so taking
   either out alone passed, and are measured by the morning's sharpness now (killed by the new 49).

## Mutations

51, in `../../mutations/creation.json`, results in `../../mutations/creation.txt`: 50 killed on the first run; B20-CREATION-2
survived, then was killed once its test was stronger. No setup errors. They cover the personality axes; every trait
knob's reader; the means and the family; loved genres; the title and the career's postings; the F-1; the body (as given,
a workout's cost, the hazard of death); the tutorial and the paused clock; two deliberate leaks (a body drawn from the
display name, a value keyed on race); the judge reading memory and stamina; the looks; the copy; savings kept at home;
the start date, the currency, the birth date and enrolment; traits and genres kept. For 43 (the start date) and 48 (the
genres kept) the runner's first failure named is a neighbouring test; the tests meant fail too, recorded test by test.

## Outside The Area, Not Changed

- **The career's work days don't read the dispositions or loved genres creation and the guide promise.** Creation says a
  play in a loved genre lifts you, that Extraversion governs performing in front of people and that Agreeableness governs
  a day of rehearsal; the guide says a day of a loved genre's work is a better day. But the `pro.work_day` handler
  (`projobs.ts`, about lines 1357 to 1405) calls neither `enjoyWork` nor `nerves`, so a professional night has no nerves
  (no Extraversion, no composure grown) and no loved genre lifts a shoot day or a night; `enjoyWork(` is called only from
  `systems/school.ts`. Found by reading, not by playing an engagement. (Sent to the career area by the coordinator.)
- One line in each of two of the frame language area's files: the assertion in `tests/language-frame-ui.test.ts`, and its
  entry in `docs/text/second-pass/frame.json`.

## For The Owner

- A start outside the School: bring it back for players, or take out those three Starting Point controls and
  `livesWhereBorn`.
- Not done here: a walk of the built app, the full gate, the career connection above.

## Checks

The eight test files the area added or changed, 129 tests on one worker, pass. `tsc --noEmit -p tsconfig.app.json` exit
0; eslint on the changed files exit 0; `text-inventory --check`, `surfaces --check`, `wired --check` and `doc-refs --check`
pass, `UNWIRED.json` unchanged; `effects.mjs --todo creation` lists nothing. `EFFECTS.md` wasn't written again: that's at
integration.
