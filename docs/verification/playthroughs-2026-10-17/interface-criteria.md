# Brief 13, Interface: Three Playthroughs Of The Built App, Written Before The Tool (2026-10-17)

Written on `09a37a18`, before `tools/playthroughs-ui.mjs` existed and before any playthrough ran (`prompts/common.md`,
step 1; `prompts/interface.md`, step 1). What was read to write it: the game's source, the two scenario saves' starting
state (their date, abilities, commitments and unread notices, read with a probe), and one new life played by the policy
for 24 days in the engine, for the dates its first weeks fall on. No playthrough step was run on the built app.

## The Owner's Ask, As Written

Brief 13, section 5 (`../briefs-2026-10-16/13-resolve-the-final-acting-clauses-and-validate-through-multiple-playthroughs.txt`):

> 5. Test The Actual Interface Too
>
> Complete at least three distinct multi-step interface playthroughs on the built application, covering both desktop and
> mobile widths overall.
>
> Include:
>
> * A normal student journey.
> * A setback-and-recovery journey.
> * A specialist’s preparation, performance, advice, and training journey.
>
> Exercise navigation, drill-down explanations, unavailable-action reasons, confirmation steps, notifications, and
> save/continue.
>
> Use screenshots or structured traces where supported. Do not substitute engine-only tests for interface verification.
>
> Provide a separate short walkthrough for me to play manually. Automated interface tests must not be described as human
> usability approval.

## How Each Is Played

- **The built app, through its visible controls only:** `npm run build`, served by `npx vite preview` on a port of its
  own (4187), driven by Playwright. Nothing is called on the engine from the tool. A save `tools/scenarios.ts` wrote is
  put in the browser's own store and opened with Continue, as `tools/acceptance-ui.mjs` opens one; that's said as the
  playthrough's starting point.
- **Each playthrough runs at 1440 and at 390 wide, each width a run of its own:** six runs. At 390 the rail is the
  drawer a phone opens from Menu, and every step is the same.
- **One player, in order:** each step starts where the one before left the game. A step that fails is recorded and the
  run goes on, so what came after is seen. A failed step fails the run.
- **The trace:** `interface/<playthrough>-<width>/trace.json`, each step with:
  - its name and which of the six it exercises;
  - what was pressed, in order, by the control's own words;
  - what the screen said: the words the step read, the toast, and a dialog's title;
  - the game's date and hour after it;
  - passed or failed, and why.

  It also holds the starting point, every page or console error, and every screen past the right edge. A few milestone
  screenshots go beside it, small (JPEG, the viewport alone): the milestones, not every step.

## What Exercising Each Of The Six Means

A playthrough exercises one of the six only where a step that passed did all of what's below. The tool records each
step's six, and a run fails where any of the six has no passed step.

- **Navigation:** moving between screens by the rail (on a phone, the drawer), by a tab, and by a notice's Go There. The
  screen arrived at is checked by its address, and a tab by which is selected.
- **A drill-down explanation:** something on the screen opened in place to say more. That's a noun opened into its look,
  or a How This Works opened into its entry. The explanation is read (the look's name and summary, or the entry's
  title), a way further in is followed (a look inside the look, its trail naming where it came from), and it's closed
  with the screen as it was.
- **An unavailable action's reason:** a control the game refuses now, grayed, with the reason in words on the screen
  (not only in a tooltip, which a phone never shows). Pressing it, forced, changes nothing: the clock stays where it was.
- **A confirmation step:** a dialog that asks before something happens. It's answered first the way that leaves things as
  they were (Cancel, or Keep It), checked to have left them so, then, where the journey goes on, the way that goes ahead.
- **A notification:** a notice the game sent, read on Home's What Needs You by its title and its words, which say what
  the journey did or what it must do next. A toast alone doesn't count; it's recorded with each press.
- **Save and continue:** Save & Exit, then Continue from the save slots. The same date and hour come back, and the
  journey's own state is as it was (named in each playthrough's last step).

## Playthrough 1: A Normal Student (`normal`)

**The player:** a new life made through creation in a browser with no saves. Billed as Actress, the first name as
offered, born in New York (typed and picked), everything else as creation offers it: the MFA in Acting at Yale. A new
life begins on Monday 24 August 2026 at 7:30 AM, in orientation week, so the seed (the slot, the name and the moment of
creation) changes the classmates and the scenes, not the calendar. The tool records the seed the save holds.

**The steps, in order:**
1. **The save slots,** emptied first: New Save offered.
2. **Creation** *(an unavailable action's reason)*:
   - the first name cleared: Continue grayed, and what the step still needs listed above it;
   - the name back, the birthplace picked, Continue through the five steps, Review naming the choices, Begin.
3. **The guide:** controls locked until its chapters are read, each read with I've Read It, and none locked after.
4. **Home on the first morning** *(a notification; a drill-down)*:
   - What Needs You lists Welcome To The Class Of 2029, its words naming the MFA in Acting;
   - its title opened: a look, Something You Were Told, saying when it came and where it stands among the unread, then
     Close;
   - How You Are's sentence opened into your own look, a way further in (Readiness) followed, the inner look's trail
     naming the outer, and the outer's Close shutting both.
5. **The first advance, refused** *(a confirmation)*: Advance → Tomorrow Morning before the 10:00 orientation. On The
   Way names the orientation on the way, and Cancel leaves the date and the hour as they were.
6. **The first advance, taken** *(a confirmation; a notification)*:
   - Advance → Tomorrow Morning, On The Way's Advance;
   - the clock stops at the orientation: its dialog says what wanted you and offers Go and Stand Here;
   - Go, and the clock on to Tuesday morning;
   - Home lists Registration And Your Account.
7. **The orientation week:** each morning Advance → Tomorrow Morning, each stop gone to, to Friday.
8. **The work set** *(a notification; navigation)*:
   - The Courses And What They Ask arrives on Friday 28 August at 10:00;
   - its Go There opens School, its Coursework tab lists the pieces set, each with the day it's due.
9. **The first step of preparation** *(an unavailable action's reason)*:
   - a step on the Acting I scene, from its own button: its minutes spent, the clock moved and its part's figure up;
   - a step the scene refuses now, grayed, its reason on the card in words; pressed, the clock stays.
10. **To the first showing:**
    - each day every step the scene offers that the game allows, and a partner's request to rehearse answered yes;
    - each stop gone to, until the scene's meeting on Tuesday 8 September;
    - the scene's Shown Today figure recorded each day: it rises on each day a step was done.
11. **The showing** *(a notification; navigation; an unavailable action's reason)*:
    - Home lists "Shown: Scene Study, <band>", its words saying what was there and the note;
    - Go There opens School;
    - the scene's card shows its Feedback, with the band and the score out of 100;
    - **expected:** Working or better, for a scene prepared every day it was open;
    - where the scene goes on to be shown again, its steps refused until the feedback is read ("There's new feedback on
      this: read it first."), Mark As Read, and they open.
12. **Save and exit** *(a confirmation; save and continue)*:
    - Save & Exit, then on the slot Delete: Confirm Deletion asks, saying what it ends and whether a backup is kept;
    - Keep It, and the slot is still there;
    - Continue: the same date and hour, and the scene's feedback as it was.

**Its milestones:** the creation review, Home's first morning with the notice's look open, the first step of
preparation, the showing's notice, and the save slots' Confirm Deletion.

## Playthrough 2: A Setback And Its Recovery (`setback`)

**The player:** the `workload` scenario's save:

```
npx vite-node tools/scenarios.ts -- --scenario workload --seed sc-0 --save <dir>/workload.json
```

A student in the second year's fall who prepared everything but the scenes' partner part, as the policy did until
2026-10-16. The scenario played them through the commands to Wednesday 22 September 2027, 9:30 AM, the day the term's
warning came. No TEST SETUP: the setback is the game's own. Its state when this was written: 3 of the 6 pieces shown
that term Unready, 2 of them short on the partner part, and three open scenes with a partner (due 30 September, 4 October
and 13 October).

**The steps, in order:**
1. **Continued from the slot** *(a notification)*: Home's What Needs You lists A Word On Your Coursework. Its words say:
   - how many of the term's pieces were Unready;
   - the part most often short and what answers it (Run It With A Reader among the remedies);
   - how many pieces are still to be shown;
   - the day the faculty reviews the term, and that half the term's pieces Unready by then lowers the standing.
2. **The warning opened** *(a drill-down)*: its title opened into its look, saying it came today and who sent it; a way
   further in followed where the look offers one; Close.
3. **Go There** *(navigation)*: School opens, at Coursework.
   - Due Soonest lists the work in order, each with its day and its figure today.
   - The first open scene with a partner whose Shown Today names Run It With A Reader is the scene this playthrough
     answers. Its figure and band are recorded: expected Unready.
4. **The remedy, once** *(an unavailable action's reason)*:
   - Run It With A Reader pressed: an hour, and the scene's Shown Today figure rises;
   - pressed again the same day it's refused, grayed, "Done today already: it takes days, not one long session." on the
     card; forced, the clock stays.
5. **Tomorrow, refused once** *(a confirmation)*: Advance → Tomorrow Morning, past the afternoon's classes and the
   evening's call. On The Way lists them, and Cancel leaves the date and the hour as they were.
6. **The days to the scene's meeting:**
   - each morning Advance → Tomorrow Morning, On The Way's Advance and Go at each stop;
   - then Run It With A Reader and every other step the scene offers that the game allows;
   - the scene's Shown Today figure and its parts recorded each day;
   - **expected:** the figure rises on each day a step was done, and is at Working or better (50) by the day before the
     meeting.
7. **The scene shown** *(a notification)*:
   - Home lists "Shown: <the scene's title>, <band>";
   - **expected:** Working or better, where it stood Unready when the warning came;
   - every other piece shown on the way is recorded with its band, with no expectation set: this player answers the
     warning's cause, and their other work is left as the save had it.
8. **Save and exit** *(save and continue)*: Save & Exit, Continue; the same date and hour, the showing's notice and the
   scene's card as they were.

The term's review falls in December, after this playthrough ends: whether the warning and the review agree over a whole
term is the journeys area's (section 4, "Warnings arrive consistently with later evaluations").

**Its milestones:** the warning on Home, the scene's Shown Today before the remedy, the refusal after it, and the
showing's notice.

## Playthrough 3: A Specialist's Preparation, Performance, Advice And Training (`specialist`)

**The player:** the `specialist` scenario's save, a scenario added to `tools/scenarios.ts` for this playthrough:

```
npx vite-node tools/scenarios.ts -- --scenario specialist --seed sc-0 --save <dir>/specialist.json
```

It's the `brief` scenario's student and its Saturday, Saturday 12 September 2026 at 4:05 PM, in the first term, with
**TEST SETUP** on the first morning. That's the specialist's spread `tools/brief-journeys.ts` gives: emotional depth,
composure, imagination and presence at 90; memory, voice, movement, listening, focus, adaptability and discipline at 49.
Everything after is the policy's play through the commands. A new life can't be made a specialist through creation, which
sets composure and discipline alone, so the starting abilities are set by hand and said so.

**The steps, in order:**
1. **Continued from the slot** *(a notification)*: Home's What Needs You lists the first term's showings, "Shown: …",
   one read by its title and words, saying what was there.
2. **The Player Profile** *(navigation; a drill-down)*:
   - Attributes And Craft shows the four strengths at 90.0 and the rest about 49;
   - Composure opened: its look says "You're at 90.0 of 100", what develops it and how to practice it;
   - Close.
3. **Nordic Noir's brief** *(an unavailable action's reason)*: opened from the genres (Nordic Noir's register is
   restraint and tension). It shows The Scene, What The Take Weighs and its readings, and Tape It is grayed with "Choose a
   reading first" on the screen.
4. **Prepared, a way of playing chosen:**
   - Break It Down and Learn The Lines, each spending its minutes;
   - a reading chosen and Read It This Way;
   - How You'll Play It: the side of the scale The Scene marks as suiting it chosen. **Expected:** Restrained.
   - The mark the side asks is said, Play It This Way, Rehearse It On Your Feet.
5. **Taped:**
   - "Taped: <figure>";
   - The Last Take says what the way gave apart from what the abilities and techniques cost, and what held it back;
   - the takes table has one row.
6. **The advice:** What To Work On names what to train, with its forecast in hours and points, what it assumes of the
   work, and whether preparation, training or both deserve attention.
   - **Expected:** what it names first is none of the four strengths at 90. Specialization doesn't erase an unrelated
     weakness.
   - What it names is recorded.
7. **Trained** *(an unavailable action's reason)*:
   - the exercise the advice names opened, from the brief where it's offered there, else from the Profile;
   - Practice An Hour until the day's practice is spent, each hour's gain said;
   - then it's refused, its reason under it in words (the day's four hours, or the energy), and forced, the clock stays.
8. **The week ahead, refused** *(a confirmation)*: Advance → One Week. On The Way lists Monday's labs, and Cancel leaves
   the date and the hour as they were.
9. **Sunday:** Advance → Tomorrow Morning, the exercise practiced again, and the ability it trains higher than at the
   first take (read on its look or in Development History).
10. **Taped again:**
    - prepared further where a step is open, then taped;
    - **expected:** the second take's figure above the first's;
    - the takes table has two rows, the newest's purpose "Better prepared or better able";
    - What To Work On read again and recorded.
11. **Save and exit** *(a confirmation; save and continue)*:
    - Save & Exit, Delete on the slot: Confirm Deletion, Keep It, the slot still there;
    - Continue: the same date and hour, the brief's two takes, its reading chosen and its last take's words as they were.

**Its milestones:** the Profile's abilities, the brief before the take, the first take with its advice, the second take,
and Confirm Deletion.

## Where An Expectation Fails

A step that fails is either a defect in the game or an expectation here that was wrong. A defect is fixed with its test,
an engine test or a drawn screen under the mocks, which fails before the fix and passes after, and the playthrough runs
again. An expectation that was wrong is said so in `interface-result.json`, with why, and isn't changed here: this file
keeps what was expected before the runs.

## The Owner's Walkthrough

`PLAYTEST.md`, beside this, is for the owner to play by hand. It's a different route from brief 12's
(`../resolution-2026-10-17/PLAYTEST.md`), about twenty minutes, from a new life on a local build. It carries a setback
the game gives and its recovery, and a specialist's training. Each step says what to press, what to expect and what to
report. It says plainly that the automated runs aren't a judgment of how the game feels to play.

## What This Doesn't Cover

- **Decision 4's rows:** the bank's cancellations are among the confirmation steps that exist, and none is used here.
- **How the game feels to play:** these runs check that the screens do what they say, in order, at two widths. That's
  not human usability approval. The owner's walkthrough is for that.
