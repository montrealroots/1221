# Brief 13's Walkthrough: A First Fortnight, A Scene Gone Wrong, And A Specialty Begun

A route for the owner to play by hand, about twenty minutes (brief 13, section 5). Brief 12's walkthrough
(`../resolution-2026-10-17/PLAYTEST.md`) tried each system once. This one plays one life through its first two weeks:
- orientation;
- a scene left unprepared and shown, then its note worked and the scene shown again;
- one ability trained toward a specialty, and a take of a brief before and after.

**What the automated runs are, and what they aren't.** The interface playthroughs (`interface-criteria.md`,
`interface/`) pressed the controls a player presses, at 1440 and at 390 wide, and checked that each screen says and does
what it claims, in order. They aren't a judgment of how the game feels to play. Nothing here has tested whether it's
clear, well paced, rewarding or tedious: that's what this walkthrough is for, and only you can say it.

It runs on a local build. Nothing is deployed:

```powershell
npm ci
npm run build
npx vite preview --port 4173
```

Then open http://localhost:4173. Play in one browser from start to finish: a save lives in the browser.

## 1. A Life With A Leaning (3 Minutes)

- **New Save.** On Identity, clear the first name. Continue grays, and the step lists what it still needs ("A first name
  is needed."). Put a name back, type a birthplace and pick it.
- **Dispositions & Traits:** move **Emotional Stability** to the top, 95. It sets where composure starts: 25 plus 0.35 for
  each point, so 58.3 here, where the middle, 50, gives 42.5.
- **Continue** to Review, then **Begin**. Read the guide's chapters with **Guide (N Left)**: every control opens.
- **Expect:** Player Profile → Attributes And Craft says Composure 58.3.
- **Report:** a Continue that lets a step through with something missing, or a Composure that isn't 58.3.

## 2. Orientation Week (4 Minutes)

- **Home → What Needs You:** Welcome To The Class Of 2029. Press its title: it opens in place, says when it came and its
  place among the unread, and the year reads 2029. Close.
- **Advance → Tomorrow Morning.** On The Way names the 10:00 orientation on the way. **Cancel:** the clock doesn't move.
  Ask again and press **Advance**. The clock stops at the orientation. Press **Go**: you're at Tuesday, 7:00 AM.
- **Each morning, Advance → Tomorrow Morning,** Go at each stop, to Saturday 29 August.
- **Expect:**
  - a notice for each session: Registration And Your Account (the tuition scholarship, Yale Health's charge),
    Meeting Your Class, and the rest;
  - by Saturday, more notices than the panel's six. It says how many more wait, and **Show All N** lists every one. The
    Courses And What They Ask is among them: eight courses set their first work.
- **Report:** a Cancel that moves the clock, a Go that doesn't go, or a notice you can't find.

## 3. The Setback: A Scene Left Alone (5 Minutes)

- **School → Coursework:** eight pieces, each with its day. The Acting I scene is due at the meeting on 8 September.
- **Leave the Acting I scene alone:** press none of its steps, and say No if its partner asks to rehearse. Prepare the
  others, or don't. Advance → Tomorrow Morning each day, Go at each stop, to 9 September.
- **Expect:**
  - its Shown Today line says Unready, what holds it back, and which steps answer it, each day it's left;
  - on 8 September, Home lists "Shown: Scene Study, Unready" (or Working, if a partner's rehearsal carried it), with
    what wasn't there and the note.
- **Report:** a scene shown better than its Shown Today said the day before, or a note that names nothing.

## 4. The Recovery: The Note Worked, Then The Next Scene (4 Minutes)

- **Go There** from the notice: Coursework shows the scene, "To Show Again", with its Feedback, the band and the score
  out of 100. Its steps are grayed: "There's new feedback on this: read it first."
- **Mark As Read,** then **Work On The Note**, twice, before the next meeting, the next morning.
- **Advance → Tomorrow Morning** past the meeting.
- **Expect:**
  - Home lists The Note Was Taken, or The Note Wasn't Taken Yet, which says what's still there;
  - the scene's band hardly moves: taking the note is worth a tenth of its score, so a scene shown Unready stays
    Unready. Played in the engine on this route, it was shown at 22 of 100 and the note taken the next day, still
    Unready, after an evening's lines as well.
- **The recovery that counts is the next scene,** which Acting I sets the same morning. Prepare it a step or two each
  day, and say Yes to its partner.
- **Expect:** its Shown Today climbs every day a step is done. In the automated normal student's runs, a scene worked
  each day went from about 21 to Working, past 50, in about a week, and was shown Working.
- **Report:**
  - steps that stay grayed after Mark As Read;
  - a note worked on and called not taken, with no reason given;
  - a Shown Today that doesn't climb on a day you worked the scene.

## 5. A Specialty Begun: Composure Trained (5 Minutes)

Do this on Sunday 6 September, or a Saturday afternoon once the work-study shift is done, when no class is on.

- **Player Profile → Genres → Nordic Noir → Open Its Brief.** Its register is restraint and tension.
  - Break It Down and Learn The Lines, then choose a reading and **Read It This Way**.
  - How You'll Play It: The Scene marks one side of the scale as suiting it. Choose that side and **Play It This Way**.
  - Rehearse It On Your Feet, then **Tape It**. Note the figure.
- **Back on the Profile, Composure's row → its exercise, Graded Exposure… → Practice An Hour,** four times.
  - Each hour says its gain, about half the one before: the same exercise again the same day gives half. Played in the
    engine on this route, four hours took Composure from 58.3 to 58.6.
  - The fifth is grayed with the reason under it: "You've practiced 4 hours today: past that, more stops helping.
    Tomorrow."
- **Press Composure's name:** its look says where you are, what develops it, and the hours just practiced.
- **Advance → Tomorrow Morning,** four hours again. Then back to the brief: Rehearse It On Your Feet and Tape It.
- **Expect:**
  - the second take above the first, its row saying "Better prepared or better able";
  - What To Work On names what would help most now. It needn't be composure: it's forecast from your last work, and
    says what its forecast assumes.
- **Report:**
  - an hour that says a gain and leaves the ability where it was;
  - a take that doesn't say what the way of playing gave;
  - advice that changes with no reason given.

The automated specialist's run played the same steps on a save with four abilities set at 90 by hand (TEST SETUP),
which a new life can't reach in a weekend. Here you're beginning a specialty, not playing a finished one.

## 6. Save, Exit And Continue (1 Minute)

- **Save & Exit.** On the slot, press **Delete**: Confirm Deletion says it ends that universe, and whether a backup is
  kept. Press **Keep It**, then **Continue**.
- **Expect:** the same day and hour. The scene's feedback, the brief's two takes and Composure's hours are as they were.
- **Report:** anything different after Continue.

## What To Report

For anything that surprised you, report:
- the step, what you pressed, what you expected and what you saw;
- the date and hour on the game's clock;
- the browser and the window's width.

And, for this walkthrough above all: where it felt slow, unclear, unfair or pointless, even where it did what it said.
That's the judgment no automated run makes.
