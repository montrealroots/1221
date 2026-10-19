# The Working Reference: Brief 15's Voice, On The Game's Own Text

Brief 15, section 4 (`../briefs-2026-10-16/15-complete-natural-language-editorial-pass.txt`). These are real sentences
the game shows today, taken from the code and from a played save on `main` at `bdb23949`. Each has its replacement, the
place it appears, and why it changes. Each replacement was checked against the code that writes or acts on the
original, and that check is named. The areas work from these examples and `docs/STYLE.md`. The owner steers the voice
from them, and the areas don't wait for that.

## The Owner's Four Examples, Checked Against The Game

Brief 15 gave four examples of the voice and asked that each be checked against the game's behavior and terms first.

| The brief's example | Where the original is | What the game does | Used here |
|---|---|---|---|
| "A word stays plain text until the chapter that opens it has been read." → "Some links are locked until you complete the related tutorial." | `content/tutorial.ts`, the guide's first chapter, and `content/guide/start.ts` | An underlined word only works once the guide chapter that covers it is read. Before that it shows as plain text, not as a locked link. | "Some words only become links once you've read the guide chapter that covers them." The screen's name for the tutorial is **Guide** and its parts are chapters (the top bar's Guide button, the Guide dialog). One thing keeps one name, so this says "guide" and not "tutorial". |
| "The school's commitments aren't yours to skip." → "School events don't have a Skip option." | `content/tutorial.ts`, the chapter Moving Time On; `ui/shell/TimeControls.tsx`, the dialog when the clock stops for something | The dialog shows **Skip It** only for a plan of your own (`mine`). For a class, a call or another school event it shows **Go** and **Stand Here**. | "You can't skip school events, so there's no Skip It button for them. Press Go, or Stand Here to wait." The button's own label, Skip It, replaces "a Skip option". |
| "This life was begun without the guide." → "You started without the tutorial." | `world/tutorial.ts`, the refusal when a chapter is read in a life that has no guide | A life created without the guide has every part open from the start. | "You started without the guide, so everything is already open." "Guide", for the reason above. |
| "Checking is short." → "You don't have enough available money in your checking account." | Not found word for word. Its kind: the round-ups' "When the account is short: …" and the refusals that name an account and what it has | The refusals name the account and what it holds. Pending card payments aren't available to spend. | The shape kept, in plain words: "Chase Total Checking has only $40.50 available, so nothing was moved." The everyday account is a **checking account** from now on, not a "current account" (Glossary, below). |

## The Eight Kinds Of Text

### 1. A Tutorial: The Guide's First Chapter

- **Where:** `src/engine/content/tutorial.ts`, chapter 1, "Your Life, Hour By Hour". It's the first thing a new player
  reads, over Home with everything locked.
- **Before:** "A word stays plain text until the chapter that opens it has been read. A panel that isn't open yet says
  Locked and names its chapter, and its Read About It button takes you there."
- **After:** "Some words only become links once you've read the guide chapter that covers them. A panel you can't use
  yet says Locked and names the chapter to read. Press its Read About It button to go straight there."
- **Why:**
  - It was a passive sentence about the game's state ("stays … until … has been read"). The new one is about what the
    player sees and does.
  - It names the control to press.
- **Checked:**
  - **Read About It:** on each locked panel, as the walk of the first day shows; it opens the guide at that panel's
    chapter (`ui/screens/Home.tsx`, `Gated`).

### 2. Instructor Feedback: A Showing That Didn't Come Together

- **Where:** a notice after a piece is shown. `systems/coursework.ts`, line 1150, builds the text, and
  `systems/evaluation.ts`, `chiefLimit`, builds the middle sentence.
- **Before:** "Simulated note from Voice I: It didn't come together today. Your Vocal Expression held back Execution by
  25.7 points. Once it does, here's a next step to try. Make one moment exact: choose where it starts and ends, and
  repeat it the same way twice."
- **After:** "Simulated note from Voice I: It didn't come together today. Your vocal expression held back your
  execution, by 26 points out of 100. When it does come together, try this next: make one moment exact. Choose where it
  starts and ends, and repeat it the same way twice."
- **Why:**
  - A teacher names the weakness in plain words and doesn't quote a figure to a tenth.
  - "Once it does" pointed at nothing.
  - The next step follows the problem, so the order is problem, then what to do.
  - "Simulated note" stays: the note is the game's simulation, and the label says so (Truth in the text).
- **Checked:**
  - **The figure:** `l.by` is the points the limit cost on that quality's 0 to 100 scale, so rounding it changes no
    outcome.
  - **The next step:** `noteText` gives the step whatever the band.
  - **Every variant:** each kind of `chiefLimit` (preparation, condition, difficulty, fit, suitability, ability) gets
    the same treatment.

### 3. A Notification: A Piece Set In Class

- **Where:** the notice when a course sets a piece. `systems/coursework.ts`, line 469.
- **Before:** "Trifles, the one act, the Wright kitchen. You play Mrs. Hale, and Zoe Park plays Mrs. Peters. Put Knows
  The Scene first: it counts for more when this piece is shown. It's due in class on September 8, 2026."
- **After:** "Trifles, the one-act, set in the Wright kitchen. You play Mrs. Hale, and Zoe Park plays Mrs. Peters. It's
  due in class on September 8, 2026. This piece weighs Knows The Scene most, so start there."
- **Why:**
  - The order is what's set, when it's due, then what to do first.
  - "Put X first: it counts for more when this piece is shown" made the player work out what "counts for more" meant.
- **Checked:**
  - **What "first" means:** `a.objective` names the preparation step this piece weighs most, and only the weight
    reads it.
  - **Weight and order:** it is a weight, not an order the steps must follow, so "start there" is advice, not a
    rule. The Coursework card shows the same step.

### 4. A Banking Restriction: An Account Left Overdrawn By A Switch

- **Where:** the refusal when you move money out of the old account, or pay from it. `systems/banking.ts`, line 963,
  and `systems/payments.ts`, line 173.
- **Before:** "Barclays Bank Account has been blocked since the switch, except for paying off what it owes."
- **After:** "Barclays Bank Account is blocked until its overdraft is paid off, because it was overdrawn when you
  switched banks. Nothing was moved. Move money into it to clear what it owes, and it closes once it's repaid."
- **Why:**
  - It says what happened: nothing moved.
  - It says why it's blocked and how to fix it.
  - It says what happens next.
- **Checked:**
  - **The block:** `lending.ts`, line 765, sets `switchDebt` only when the old account was overdrawn on the switch
    day.
  - **The close:** the account closes once its balance is back to zero or above (`SWITCH_DEBT_KIND`).
  - **Moving money in:** moving money into it is allowed. Only moving money out of it is refused.
  - **Decision 4:** the switch is decision 4's `bank.switch`. Only its words change.

### 5. A Document Application: A Card Arrives

- **Where:** the notice when a document you applied for is issued. `systems/identity.ts`, line 304.
- **Before:** title "Connecticut Identification Card Arrived", body "It's in your hands and in force from today."
- **After:** title unchanged, body "It's arrived, and you can use it from today."
- **Why:**
  - "In your hands and in force" is official-letter phrasing.
  - The player wants to know they have it and can use it.
- **Checked:** the notice fires when the card is issued (`ID_CARD_KIND`), which sets its status to `valid` and its
  `issuedAt` to today. Papers then shows the card as In Force (`ui/papers/Documents.tsx`, `STATUS_WORD`), so "you can
  use it from today" is exactly true.

### 6. An Attribute Explanation: Listening And Responsiveness

- **Where:** the ability's look on the Player Profile. `content/abilities.ts`, `affects`.
- **Before:** "Your responsiveness and connection in partnered physical work and on stage, more the more the piece
  depends on a partner and on timing; how much an evening rehearsing with a partner or a reader gets done; and how much
  rehearsing a brief on its feet with its reader gets done."
- **After:** "How responsive and connected you are in scenes with a partner and on stage. It matters most when a scene
  depends on your partner and on timing. It also sets how much you get done in an evening rehearsing with a partner or
  a reader, and when you rehearse a brief on its feet with its reader."
- **Why:**
  - One list in a sentence fragment, with "more the more" and a semicolon chain, became three plain sentences.
  - Each sentence says one effect.
- **Checked:**
  - **The three effects:** they are the ones the comment above the field cites (`stepSpeed`, `STEP_SPEED`, the
    partner weighting).
  - **Nothing added:** no effect is added or dropped.

### 7. A Repeated Recommendation: The Advice, Seen Again

- **Where:** the advice's standing line on the Player Profile. `systems/next-steps.ts`, `standingOf`, as it rendered on
  a played case (`docs/verification/language-2026-10-17/profile/b2-advice.txt`).
- **Before:** "On October 14, 2026, the last time the advice was noted, the first was composure, as it had since
  September 7, 2026. Since the advice first named it, it has gone from 42 to 47.2 and its forecast from 1.00 to 0.75 a
  piece, and emotional depth's forecast, 0.84, is now the larger."
- **After:** "Composure has been the top recommendation since September 7, 2026, and was still first when you last
  looked, on October 14, 2026. Since it was first recommended, it's grown from 42 to 47.2, so training it is now worth
  less: 0.75 points a piece, down from 1.00. Emotional depth is now worth more, at 0.84, so it's the better choice now."
- **Why:**
  - It says what the player did and what changed since.
  - It says why the advice moved on, as section 8 asks. The old sentence made the player decode "the first",
    "noted" and "the larger".
- **Checked:**
  - **The figures and dates:** the same, from `standingOf`'s inputs.
  - **"The better choice now":** true only where the other forecast is the larger. That is the branch this sentence
    is on.
  - **The harness:** `tools/advice-harness.ts` reads these words (check S3) and moves with them.

### 8. An Error Message: Reading A Chapter With No Guide

- **Where:** a refusal. `world/tutorial.ts`, line 89.
- **Before:** "This life was begun without the guide, so everything is already open."
- **After:** "You started without the guide, so everything is already open."
- **Why:**
  - The owner named it.
  - "This life was begun" is the game describing its own state in the passive.
- **Checked:**
  - **The condition:** the guide's state is absent exactly when the life was created with the guide off.
  - **Reachable or not:** the Guide button isn't shown then, so the refusal is reached only by a command, not by a
    player's press. It still reads naturally.

## More Real Sentences That Fail The Standard, For The Areas

Each of these is in the game today. Each area finds and fixes the rest of its kind.

| Before | After | Kind |
|---|---|---|
| "Only a plan of your own can be skipped. Go, or press Stand Here and the clock waits. Whatever moves the clock next runs this, with you there if you're awake and in the right city." | "You can't skip school events, so there's no Skip It button. Press Go, or Stand Here to wait. It happens the next time the clock moves, and you're there if you're awake and in the right city." | dialog |
| "You showed Scene Study again on September 9, 2026, but the note on With Your Partner isn't taken yet. With Your Partner stayed at 56%. Shown again: Working. It stays open under Your Notes." | "You showed Scene Study again on September 9, 2026, but you haven't taken the note on With Your Partner yet: it's still at 56%. The piece was Working again. The note stays open under Your Notes until you work on it." | repeated notice |
| "(Simulated: the game's summary, not the director's words.)" | "(A summary of your run, not the director's own words.)" | label of a simulation |
| "You share no open scene with Chloe, so you ran their lines. It helped them, but it didn't move your own work." | "You and Chloe don't have a scene together right now, so you ran their lines. It helped them, but not your own preparation." | narration |
| "Wages are paid into an open current or savings account of yours." | "Choose one of your open checking or savings accounts for your wages." | error |
| "Your share is $50.00, due on November 25, 2026, when it's taken from your current account. If it can't be paid then, it becomes medical debt." | "You owe $50.00. It's taken from your checking account on November 25, 2026, and if there isn't enough then, it becomes medical debt." | official |
