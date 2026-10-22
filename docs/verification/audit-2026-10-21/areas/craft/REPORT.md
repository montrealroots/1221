# Brief 20, The Craft Area: Coursework, Craft And Productions

Started from `12c04ee1` on `b20-craft`. Ended at the commit that adds this report, on the same branch. No source file
changed: no defect was confirmed in the area, so the work is the reading, the tests and the mutations.

What was read: the 144 promises in `docs/verification/audit-2026-10-21/effects/craft.json` (the guide's Coursework, Craft
and Productions entries, each a connection one entry makes to another). The craft file has no `rows`; the features
themselves are other areas' rows (school, guide), and the comparisons below reach them through the commands and the clock.

## The Promises

**144 of 144 Implemented And Verified.** None in any other status. Each says what keeps it (`holds`, with `file:line`), the
tests that show it, `readBy: craft` and `readAt: 12c04ee1`; none is seeded (`node tools/effects.mjs --todo craft` lists
nothing, and `--check` reports no problem in `craft.json`).

- 54 name a test written here (`tests/b20-craft-*.test.ts`), where no test the gate runs held the connection as the player
  reaches it, or held less than the promise says.
- 90 rest on tests the gate already ran; each was read for an assertion of the consequence the promise names, reached by
  the command or the clock, before it was kept.
- 22 name the mutations that break them (`mutations`), all killed.

No promise was found that the code doesn't keep, so no guide sentence changed and no player text changed (nothing to mark
again in the text inventory).

## The Tests Written

All through creation's own config (`createSave` with `newLifeConfig`), the commands as the screens send them, and the
clock. `tests/fakes/craft-life.ts` holds what a comparison holds by hand and says so: `tend` (both twins rested and fed
alike as the clock moves), `clearDay` (the clock's commitments cancelled, only in tests at commands alone and never across
a production), `setAbility` (the input a comparison changes), `live` (a day lived: tended, an evening's own commands, to
bed at eleven for eight hours; from `upFrom` nobody tends them and the clock moves an hour at a time, so they stay up).

| File | Tests | What it holds |
|---|---|---|
| `tests/b20-craft-bite.test.ts` | 16 | B1 on a take: eight abilities, genre study (take and scene step), each part of preparation, a night up and the flu, practice and a brief's steps growing only what they train |
| `tests/b20-craft-clock.test.ts` | 12 | B3 on a showing, the feedback and its revision, a night on stage and the casting, all through the clock; a week's jump and a save across a showing |
| `tests/b20-craft-noleak.test.ts` | 4 | Race and ethnicity, the background, the portrait and a loved genre reach no judgment |
| `tests/b20-craft-advice.test.ts` | 2 | What To Work On Next follows the state, and acting on it moves what it says |
| `tests/b20-craft-promises.test.ts` | 19 | The promises no gate test held as played (coursework, workbook, identity, briefs, the Carlotta Festival, plays read, material practised, Reliability) |
| `tests/b20-craft-productions.test.ts` | 6 | Notes worked, attendance, a part's size, how the part is played, Work It Through on a part, the director's request |
| `tests/b20-craft-screens.test.ts` | 2 | Where It Would Show Next beside a brief, and a showing opened from the record, from the real components |

Run on one worker (`--pool=forks --poolOptions.forks.singleFork=true`): 7 files, 61 tests, all passed.

## The Comparisons, With The Figures

Every pair below is one seed, the same commands and the same clock, alike but for the input named. A take is out of 100;
a showing's score is the course's 0 to 1.

### 1. Attributes

**A take** (brief-absurdist, prepared read, lines twice, rehearse; taped 29 August 2026 at 14:00), each ability at 20
against 90:

| Ability | At 20 | At 90 | Preparation |
|---|---|---|---|
| Emotional depth | 49.7 | 53.1 | the same |
| Presence | 49.5 | 51.6 | the same |
| Composure | 49.0 | 53.8 | the same; nothing else the take reads differs (asserted) |
| Adaptability | 48.0 | 53.3 | the same |
| Focus | 44.1 | 56.6 | the same |
| Imagination | 45.3 | 55.7 | the breakdown 0.599 against 0.737 (imagination speeds its own step) |
| Memory | 50.4 | 51.7 | the lines 0.719 against 0.834 |
| Listening | 47.0 | 53.8 | the rehearsal 0.627 against 0.736 |

**A showing** (the first Scene Study, DRAM 103a/b, shown 8 September through the clock): emotional depth 20 against 90,
prepared the same: 0.545 against 0.569, both Working.

**A night** (the Carlotta Festival's first night, cast alike, both a lead): discipline 20 against 90, which the casting
doesn't read: 48.8 against 57.9, consistency 27.2 against 66.8.

**Casting** (every ability and technique a night reads at 30 against 80): fit 37.4, fifteenth, A Featured Part In A New
Play; against fit 82.5, first, A Leading Part In A New Play.

**Script analysis at Table Work** (DRAM 163b, twins at 30 and 80 from 4 January 2027, prepared the same each evening): shown
0.631 against 0.752.

### 2. Genre experience

- Five sessions of absurdist study against five of western: the absurdist take 54.8 against 53.3, the preparation the same;
  an anthology brief, a third genre, 53.0 and 53.0.
- The first Scene Study (seed `b20c-genre-scene-22`, Trifles, a mystery and a drama): Read The Scene moved 0.6301 after
  three sessions of mystery, 0.6110 after three of western, and 0.6110 after none.
- Material: six hours of Verse Speaking against six of Circles Of Attention: verse practised 6 times against 0, Material You
  Know names verse for the one, the material's speed on a verse brief (brief-anthology-2) 1.028 against 1, and its
  breakdown moved 0.679 against 0.661.
- Casting: drama studied to a familiarity over 20 changes no fit, no read and no part (`castRead` and `casting` equal). See
  For The Owner.

### 3. Preparation

- A take: everything prepared 54.1 (Working); the breakdown left out 39.9 (Unready, its interpretation at 0); the rehearsal
  left out 27.6 (Unready); one lines step fewer 52.8 (the lines 0.672 against 0.782).
- A showing: the lines never learned 0.305 (Unready, memorization 0) against 0.56 (Working) with every part prepared.

### 4. Fatigue, health and readiness

- A take after a night kept up through the clock (from 22:00 on 28 August): readiness 46.9 against 88.5, the take 48.6
  against 52.6; believability 44.6 against 49.1, interpretation 47.3 both (the day reaches the dimensions whose conditions
  name it).
- The flu (TEST SETUP: the flu itself): 51.7 against 54.3; execution 51.1 against 60.2, believability 52.9 both.
- The day set for a take: readiness 89.1 takes 54.1; 67.8 takes 54.1 (over the sufficient mark, 60, costs nothing); 31.5
  takes 45.0.
- A coursework step: readiness 89.7 moves Read The Scene 0.622; 27.3 moves it 0.283.
- A showing, untended from the morning before and kept up through the night: readiness 39.3 against 87.4, 0.466 against
  0.529.
- A showing after one night up with the evening before tended: readiness 62.1 at the meeting, the score 0.56 both. See
  Outside The Area.
- The first night, kept up the night and day before: readiness 34.7 against 84.2, 46.8 against 55.6.
- The cast list read on a tired day: the read and the cast the same (the chair reads everyone at a sufficient day).

### 5. Feedback read against unread

The first Scene Study shown 0.367 for both, its note on the rehearsal. One twin reads it and rehearses; the other leaves it
unread (its steps held until it's read). Rehearsal 0.681 against 0; the revision applied against not; shown again 52.4
against 36.2 (its record, out of 100); the note resolved against open; the course's skills grown at the meeting 0.417 against 0.360.

### 6. Practice and briefs grow what they train, and only that

- An hour of Sense Memory against an hour of the Repetition Exercise at one instant: emotional depth 56.1 to 56.313 against
  56.1; listening 53.9 to 54.124 against 53.9; discipline 57.5 to 57.679 for both; every other ability and every other
  technique equal.
- A brief's breakdown against its lines: imagination 58.4 to 58.420, memory unmoved; memory 59.1 to 59.120, imagination
  unmoved.
- Six plays read against six afternoons not: script analysis 55.525 against 55.411, six `read:` entries against none.

### 7. Casting

Abilities change who is cast (comparison 1: fifteenth and featured against first and the lead). Genre study, a tired day
at the cast list, race and ethnicity, the background, the portrait and a loved genre change nothing in it (asserted equal).

### No leak

Race and ethnicity (black and hispanic, Afro-Dominican), a background text, a portrait and a loved genre (the brief's own),
each against a twin without: the take (51.4 each), the first showing's band, score and strengths, the cast read, the
casting, who's castable and the classmates all equal. The two leak mutations (race into an ability, a loved genre into the
genre part of preparation) moved the take to 52.7 and 52.1 and were caught.

### What To Work On Next

After three days on brief-absurdist the first recommendation is imagination, from 55.35, forecast to 59.00 on its pieces,
0.8 points; reading it changes nothing in the save. Three hours of its exercise, a day apart: imagination 55.35 to 55.98
against unmoved; the advice's forecast now starts at 55.98; the same take again 58.3 against 58.2.

### Productions (the first spring's Carlotta Festival, through the clock)

- Notes: five notes; the worker worked all five, four taken against two; the notes' share in the first night's
  preparation 0.9 against 0.4; adaptability practised five times against none; the night's growth factor 1.052 against 1;
  scene study grown at the night 0.184 against 0.170. The first night itself 52.8 against 52.9. See For The Owner.
- Attendance: two rehearsals missed (TEST SETUP: away in New York for the afternoon) take the spring's review from 1 to
  0.979.
- The part's size: a lead's night is judged at the School's lead difficulty, a featured part's at the featured.
- How the part is played: refused before a part is cast and after the run; chosen driven, counted toward the habits,
  rehearsed at the calls (0.969) and read by the night (53.8 against 54.1 left open; responsiveness 46.3 against 46.9).
- Work It Through on the part: Work It Slowly on the first movement takes its work from 0 to 0.55 and the try from 29.2 to
  29.7.
- The director's request (seed `b20c-direction-1`, asked driven): played measured, it comes back as the note at the first
  work-through, Work It Through refuses it with the reason, and changed to driven the next call takes it.
- The nights' morale: Working nights together (55.1 to 55.9) leave it at 70; strong ones (87.7 to 87.8) 70 to 73; Off ones
  (21.8 to 24.4) 70 to 67, each as the band and the cast company say.

## Defects

None confirmed in the craft area, so nothing repaired. The things found that are said below are measurements, not
disconnections: each does what the code and the guide say.

## D1: The Twelve Kinds

1. **Values written and never read.** Swept the 99 property names the area's nine systems write (`coursework`, `briefs`,
   `production`, `practice`, `artistry`, `evaluation`, `experience`, `workbook`, `workpieces`) for a read anywhere in
   `src` by property access or destructuring. Every one is read; the four read once (`lastExercise` and `lastTier`,
   `practice.ts:195-196`; `notifiedAt`, `coursework.ts:1524`; `partnerWorked`, `coursework.ts:1805`) are each read in a
   decision. `node tools/wired.mjs`: its two (`person`, `people`) aren't this area's. None found.
2. **Choices that promise a difference and make none.** The way a scene is played (the showing's dimensions differ:
   connection 57.7 against 60.8), the way a part is played (the night's), the way through a beat (the axes offered), a
   reader (Playing With Others), the note worked or left (comparison 5, the productions' notes). None found.
3. **Success reported with nothing changed.** An adjustment that doesn't answer the problem is refused ("That doesn’t
   answer the problem you’re working on."), a direction note refused at Work It Through with the reason, the part's playing
   refused before casting and after the run. None found.
4. **Effects worked out and never applied.** The nights' morale asserted against the band and the company on twelve nights
   across three seeds; the night's growth factor in the development record; the revision's `applied` against the score
   shown again. None found.
5. **A notice or tutorial describing what isn't there.** The 144 promises read against the code; the Player Profile's
   chapter lock tested as a guided life meets it. None found.
6. **Counted twice.** Playing With Others counted once a take (three takes, three) and once a night (four nights, four);
   a showing across a week's jump and across a reload kept as one record. None found.
7. **Time skipping an obligation.** A week sent in one advance across the showing brings it due once (shown or missed; the
   test accepts either and doesn't log which); calls and a partner's rehearsal stop the clock. None found.
8. **A save or a load dropping or replaying.** A save opened the night before the showing shows it as the life played
   straight through (the score and the feedback equal, one record); the production comparisons run on reloads of one life
   at the cast list. None found.
9. **Impossible scheduling or eligibility.** The part's playing and the notes refuse where they can't apply; table work
   waits for the scene read. One finding outside the area (three o'clock calls, below).
10. **A control wired to the wrong command.** Swept the 23 commands the area registers (`brief.*`, `practice.*`,
    `genre.study`, `work.*`, the coursework and production `school.*`): each is sent by a screen. Two screens rendered from a
    played life (BriefPane, the work look). I didn't click each control. None found.
11. **A feature only a test's hand can reach.** Every comparison is reached by commands and the clock; what a test sets by
    hand is named where it's used (an ability's level, the flu, a day's wellbeing, an afternoon away, a partner's
    reliability). None found.
12. **An opportunity offered again against what's done.** The beat's ways leave out the axes chosen; What To Work On reads
    the level the practice left; Where It Would Show Next leaves out the brief open; the course sets its next piece after
    a showing, not the one shown. None found.

## The Mutations

23, in `docs/verification/audit-2026-10-21/mutations/craft.json`, run by `mutate.py`, every run kept in `craft.txt`.

First run (1 to 21): 19 killed, 2 SETUP ERROR.

- **B20-CRAFT-18** (an Off night no longer stings): SETUP ERROR, a transform failure. The mutation deleted the `if` line and
  left its `else if` dangling. Rewritten to keep the line and take the sting out of it; second run killed ("expected 70 to
  be close to 67").
- **B20-CRAFT-20** (Playing With Others named from the fourth piece): SETUP ERROR, a TypeError: the test read the line off
  an identity that had none. The test now asserts the identity is there first; second run killed ("expected undefined to
  be defined").

Added after: **B20-CRAFT-22** (practice no longer counts its material) and **B20-CRAFT-23** (Reliability no longer says the
rehearsals missed by you), both killed.

**Final: 23 of 23 killed**, across `coursework.ts` (8), `briefs.ts` (3), `practice.ts` (3), `school.ts` (3), `production.ts`
(2), `artistry.ts` (2), `evaluation.ts` (1) and `content/tasks.ts` (1).

## Outside The Area

- **Life (the body).** One night not slept, after an evening tended, leaves readiness at 62.1 at nine the next morning, over
  the sufficient mark (60): the Scene Study shown that morning scores 0.56 as the rested twin's does. Kept up from the
  morning before instead, readiness is 39.3 and the showing falls (0.466 against 0.529). Whether one sleepless night should
  cost a morning's work is the body's rule to settle.
- **School (calls).** The Carlotta's calls are at three, when classes end. I found no way for a student in New Haven to
  miss one but to be away for the afternoon, which is how the attendance test misses two (in New York, as
  `tests/evidence-g21-school.test.ts` misses one). Whether a call can be skipped is the school's rule to settle.

## For The Owner

- **The chair doesn't read genre experience.** `castFit` (`src/engine/systems/school.ts:2800`) reads each student as if
  preparation were complete, which is its stated rule, so knowing the play's kind changes no fit and no part (measured:
  drama studied past 20, the cast read and the cast equal). Genre experience shows after casting, in learning the part and
  the night's preparation. The brief asks genre experience to make a difference where it's relevant; whether the chair
  should read it is a design call, not changed here.
- **Notes worked past what's needed don't raise the first night.** The worker took four notes to the idle twin's two, a
  share of 0.9 against 0.4, and the night came out 52.8 against 52.9: on this seed the way a worked note offered and was
  kept played the night's interpretation lower. The notes reach the night (mutation 17 is killed on it) and the growth
  after it, but a player who works every note can see a worse night.
- **Six plays read move script analysis about a tenth of a point** (55.525 against 55.411), too little to show at a
  Table Work showing; the comparison there needed the level set (30 against 80).
- **A chosen way of playing can cost points.** Expansive at the first Scene Study, 0.554 against 0.56 left open; driven
  at the first night, 53.8 against 54.1. The choice makes a difference, as the guide says; it isn't always a better one.
- **A loved genre lifts the mood after a rehearsal or a night of its kind**, by the owner's rule of 2026-09-24, and so can
  reach a judgment only where it lifts readiness across the sufficient mark. Not measured on a night.

## What's Left

- The 90 promises kept on the gate's earlier tests have no mutation of their own here.
- I didn't click each control on the screens; the sweep found each command sent by a screen.
- The loved genre's mood on a night wasn't measured.
