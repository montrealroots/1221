# Brief 14's Walkthrough: The Game's Words, Read By A Player

A route for the owner to play by hand, about thirty minutes (brief 14, section 9: "a manual route"). Brief 13's
walkthrough (`../playthroughs-2026-10-17/PLAYTEST.md`) played a first fortnight. This one reads it: the words a new
player meets, coursework and its feedback, what the Profile says about abilities and genres, a setback, money that isn't
there, a document on its way, the body's limits, and saving. Each step says what to press, what you should read, and
what to report.

**What the automated runs are, and what they aren't.** The interface journeys pressed the controls a player presses at
1440 and 390 wide and checked that each screen says and does what it claims. The text walk read every screen of the
built app on fifteen saves at both widths for leaked values, broken plurals and raw ids. Every phrase and label this
walkthrough quotes was looked for in what the built app printed, and, for a state no walk or journey reached, in the
game's code (`playtest-check.py`, `playtest-check.json`): none was found nowhere. None of that is a judgment of how the game
reads to a person: whether a sentence is clear, natural, too long, or in the right voice is what this walkthrough is
for, and only you can say it.

It runs on a local build. Nothing is deployed:

```powershell
npm ci
npm run build
npx vite preview --port 4173
```

Then open http://localhost:4173. Play in one browser from start to finish: a save lives in the browser.

**As you go, note any sentence that:** you had to read twice; names something the screen calls by another name; says
what the game does in terms you'd never use (a "dimension", a "segment", a "take" for anything but a tape); promises
something that didn't happen; or repeats itself without saying what changed. The page and the sentence are enough.

## 1. A New Life (5 Minutes)

- **New Save.** On Identity, clear the first name. Continue grays, and the step says what it needs: “Enter a first
  name.” Put a name back.
- Go through each step. Each choice says what it does in the game, not only what it is.
- **Begin.** The top bar shows **Guide (N Left)**. Open it and read the first chapter.
- **Expect:** each chapter says what it's for, where to go, what to press, what you need, what happens, what else it
  affects, what to do next, and what to do if you can't.
- **Report:** a chapter that tells you to press a control you can't find, or a step that lets you through with
  something missing.

## 2. The Clock And What Needs You (4 Minutes)

- **Home → What Needs You.** Open a notice by its title. It says when it came and where it sits among the unread.
- **Advance → Tomorrow Morning.** On The Way names the commitments the clock stops at on the way. Press **Cancel**: the
  clock doesn't move.
- Press **How This Works** beside any panel, read it, and close it. The clock hasn't moved and nothing was done.
- **Report:** a How This Works or a guide link that moved the clock or pressed anything, or a notice that doesn't say
  what to do next.

## 3. Coursework And Its Feedback (6 Minutes)

- **School → Coursework.** Open the Acting I scene. Its card names the play, where the scene is set, and who you play.
- **Shown Today** says what it would come to if you showed it today on a good day, and what holds it back. It's a
  forecast, not a result.
- **How You'll Play It:** read the choices. Below them: “Choosing a way to play it isn’t rehearsing it”.
- **Table Work:** answer the questions. Once the piece is shown, each answer says “Why the text supports it” or why it
  doesn't.
- Prepare it, advance to its day, and read the feedback. It ends “Simulated feedback for Acting I”, and that the words
  are the game's, not the teachers'.
- **Report:** a note that names something the card calls by another name, or feedback that reads like a calculation.

## 4. Abilities, Techniques, Genres And Advice (4 Minutes)

- **Player Profile → Attributes And Craft.** Each ability says what it does in your work.
- **Genres:** a genre the research holds low says “Not established: the research holds it with low confidence”. Open
  one: its small print is three short paragraphs.
- **What To Work On Next:** each line says why, from your recent work.
- **Expect:** abilities, techniques, genre knowledge and practice are four different things, and the screens keep them
  apart.
- **Report:** two of them confused, or advice you couldn't act on.

## 5. A Setback (3 Minutes)

- Leave a piece unprepared and advance past its day.
- **Expect:** a coursework warning during the term, which says what's unready and what to do. The term review comes
  only at the term's end. The warning isn't the review, and the words keep them apart.
- **Report:** a warning that reads like a verdict, or a review that doesn't say what the next step down means.

## 6. Money That Isn't There (4 Minutes)

- **Money → Move Money.** Try to move more than the account holds. The refusal says what can't pay, the amount, and
  that “nothing was moved”.
- Open a statement. Available is what you can spend now; a pending line hasn't settled.
- **Report:** a refusal that doesn't say why or what to do next, or pending money called available.

## 7. A Document On Its Way (3 Minutes)

- A life in Connecticut: **Papers → Passport And ID → Get Non-Driver Identification Card.** The toast says what you
  paid and the day the card comes.
- **Expect:** its row reads **On Its Way**. The grayed Get button says why beside it: “One is already on its way.”
  Applying is not holding it.
- **Report:** a document called held before it arrives, or a reason only in a tooltip.

## 8. The Body's Limits (3 Minutes)

- **Look After Yourself.** Try Work Out late in a long day. If it's refused, the refusal says why.
- Open the Sleep dialog. It says when you'd wake.
- **Expect:** energy, stamina and health are three different things. Only sleep brings energy back, stamina is an
  ability, and health is illness and injury.
- **Report:** any screen that mixes them up.

## 9. Save, Exit And Continue (2 Minutes)

- **Save & Exit.** The slots say what each one holds. **Continue** brings you back where you were.
- **Report:** a slot that doesn't say what it holds, or a life that comes back different.

## What To Send Back

For each thing you report: the step, the screen, the sentence as it reads, and what was wrong with it, in your own
words. That's the evidence a later pass needs. Nothing here has been approved by a person until you say so.
