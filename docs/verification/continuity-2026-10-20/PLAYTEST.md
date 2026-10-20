# Brief 17's Route: Who Is Speaking, And Whether They Remember

A route for the owner to play by hand, about thirty minutes (brief 17, section 12: "A short playable route for the
owner to verify the result"). Brief 14's walkthrough (`../language-2026-10-17/PLAYTEST.md`) read the game's words. This
one listens to who says them:
- the teachers, each course its own;
- a note that comes back, and what it says the second time;
- the classmates, each asking in a way of their own, and an apology that comes once for the misses it's for;
- what a screen says first, and what a button costs before it's pressed.

Each step says what to press, what you should read, and what to report.

**What the automated runs are, and what they aren't.**
- **The runs:** `tools/voices.ts` played 24 students and counted what repeats (`README.md`, The Measures).
  `incidents.py` read every apology against the misses before it.
- **The built app:** `tools/text-walk.mjs` read every screen of the built app on fifteen saves at 1440 and 390, and
  `tools/details-check.mjs` opened every folded detail from the keyboard.
- **The phrases here:** every phrase and label this route quotes was looked for in what the built app printed and, for a
  state no walk reached, in the game's code (`playtest-check.py`, `playtest-check.json`).
- **What none of that is:** a judgment of how the game reads to a person. Whether a teacher sounds like a teacher, a
  classmate like a person, or a sentence like the game's own voice and not a calculation is what this route is for, and
  only you can say it.

It runs on a local build. Nothing is deployed:

```powershell
npm ci
npm run build
npx vite preview --port 4173
```

Then open http://localhost:4173. Play in one browser from start to finish: a save lives in the browser.

**As you go, note any sentence that:**
- you had to read twice;
- sounds like a form being filled in;
- says the same thing twice in one message;
- calls something by a name the screen doesn't use;
- says what happened before wrongly;
- repeats itself without saying what changed.

The page and the sentence are enough.

## 1. The First Week (5 Minutes)

- **New Save**, then each step of creation, then **Begin**. Read the guide's **Drama School** chapter. It says how a
  note is put right, and where it stays until then.
- **School → Coursework.** Orientation leads the tab: “Your first week, August 24 to 28.”
- **Advance → Tomorrow Morning** until the week is over. At each session the stop says when it is, what going takes,
  and what to press: **Go**, or **Stand Here** to wait with the clock paused. Only a plan of your own can be skipped, and
  the stop says so last, not first.
- **Expect:** once all five sessions are done, **Due Soonest** leads the tab and the first week sits below the work.
  **Your Partners** says “No Rehearsals Yet” for a classmate you haven't rehearsed with.
- **Report:** a tab that opens on something you've already done, or a stop whose choices don't say what each does.

## 2. Teachers, Each Their Own (8 Minutes)

- Prepare a piece in one course, and leave another course's piece half done. Advance to their days: a piece is shown at
  that day's class if you're there.
- Read each piece's feedback, on its card under **Work Shown** and in the notice. Each ends “Simulated feedback for”
  its course, and says the words are the game's, not the teachers'.
- **Expect:**
  - Two teachers sound like two people. Each says what happened to this piece and what to do about it, in its
    discipline's terms. A movement course (Alexander Technique, The Body As Source) works without a text, and never
    talks about lines.
  - A band that moved says the band it moved to.
  - A day is said once in a message.
  - A first Strong, a best, or a piece strong despite a bad day can be acknowledged and left there, with no lesson after
    it.
- Leave the same part unfinished on a second piece in the same course.
  - **Expect:** the second note says where that part stands now and what puts it right, in the teacher's words. It
    doesn't say "the note is taken at", "At Unready, this is the part", or "A fourth time for the note on".
- **Your Notes** lists every note, how often, and Open or Taken.
- **Report:** two courses that sound alike, a note that reads like a calculation, or a note that says something
  happened that didn't.

## 3. Your Class (6 Minutes)

- Play on a few weeks with partnered pieces, rehearsing under **Rehearsing With**, and answer the class's moments as
  they come under **Your Class**.
- **Expect:**
  - A classmate who asks for help again asks the way they asked before, says they've asked before, and remembers your
    last answer rightly.
  - Two classmates ask in different ways.
- If a partner doesn't come:
  - The notice says so. A second miss says “It’s the second time they haven’t come.”
  - Their apology covers every rehearsal they've missed since their last apology, and names the days.
  - It doesn't come again for the same misses, however long you play.
  - Late by four weeks or more, the apology says how long it's been.
- **Report:** an apology that comes twice for the same evening, a classmate who remembers an answer you didn't give, or
  two classmates who sound like one.

## 4. What A Screen Says First (6 Minutes)

- **Player Profile → Attributes And Craft.** What To Work On Next is a short card: what, why now, and what to press.
  Press **Why This Recommendation** with the keyboard (Tab to it, then Enter): the working opens below it, and Enter
  closes it again.
- **Money → Accounts → Open An Account At Another Bank.** Choose a bank. Its terms come before the fields and
  **Apply**: the ID it needs, the deposit that leaves as you apply, and the monthly fee.
- At a bank with term deposits, before **Put It Away**: what breaking the deposit early would cost, or that the bank
  doesn't allow it.
- **Papers → Health Cover → Book An Appointment.** The notice says where and when, the wait, and how to call it off.
- **Expect:** a fee, a deadline or a warning is never only behind a disclosure. What's folded away is the working, not
  the cost.
- **Report:** a cost or a deadline you found only after pressing.

## 5. Save, Exit And Continue (2 Minutes)

- **Save & Exit**, then **Continue**.
- **Expect:** each feedback, note and moment you've read says the same words after the reload. The game doesn't reroll
  what it's already said.
- **Report:** a message that reads differently after Continue.

## 6. If You Have A Save From Before (3 Minutes)

- A save from brief 16 or earlier opens as it was. Its classmates' misses are marked with the apologies the save keeps.
  A miss nobody has apologized for is still owed one, and none already apologized for comes again.
- **Report:** an apology, after Continue, for rehearsals that were apologized for before.

## What To Send Back

For each thing you report: the step, the screen, the sentence as it reads, and what was wrong with it, in your own
words. That's the evidence a later pass needs. Nothing here has been approved by a person until you say so.
