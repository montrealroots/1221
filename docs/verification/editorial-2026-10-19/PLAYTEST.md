# Brief 15's Review Route: Hearing The Game's Voice

A short route for the owner to play by hand, about twenty-five minutes (brief 15, section 12: "a short manual review
route for me"). Brief 14's walkthrough (`../language-2026-10-17/PLAYTEST.md`) checked that each sentence was true. This
one is for the ear. Do the sentences a player meets read as a finished game speaks, in one voice, from the first screen
to a setback and back? It follows the brief's eight journeys (section 11), and it stops on sentences the second pass
rewrote, so you hear the new words where they changed.

**What the automated runs are, and what they aren't.** The final walk read every screen of the built app on fifteen
saves at both widths. The interface journeys pressed the controls a player presses at 1440 and 390 wide. Every phrase
and label this route quotes was looked for in what the built app printed, and, for a state no walk or journey reached,
in the game's code (`playtest-check.py`, `playtest-check.json`). None of that is a judgment of how the game reads to a
person: whether a sentence sounds natural is what this route is for, and only you can say it.

It runs on a local build. Nothing is deployed:

```powershell
npm ci
npm run build
npx vite preview --port 4173
```

Open http://localhost:4173 and play in one browser from start to finish: a save lives in the browser. Try the first
section at phone width too, in the browser's device view at 390 wide.

**As you go, note any sentence that:** sounds like a system rather than a game; you had to read twice; names one thing
two ways; or repeats itself without saying what changed. The page and the sentence are enough.

## 1. A New Life (5 Minutes)

- **New Save**, then each step of creation. On Before Yale, choose a country you lived in and **I Kept An Account
  There**. The line under Your Savings says the choice you made: “Your savings stay at” the bank there, or “Your
  savings move to” Chase.
- **Begin.** The guide opens on its first chapter. Read it and press **I’ve Read It**.
- At 390 wide: the top bar's locked controls say Locked under their names, and the clock stands clear of the guide's
  button.
- **Listen for:** creation's notes in the second person, saying what each choice does in your life, not what it sets.

## 2. Home And What Needs You (3 Minutes)

- Open a notice by its title. Its look says when it came, where it sits among the unread, and “Opening it here doesn’t
  mark it read.”
- **Mark N Read** clears them together.
- **Listen for:** a notice that tells you what happened and what to do next, in that order.

## 3. School: Preparation, A Showing, Feedback (6 Minutes)

- **School → Coursework.** Open a scene. Answer Table Work, choosing one answer the text doesn't support.
- Prepare it, advance to its day, and read the note. It names the answer you chose, then why: “but the text doesn’t
  support it”.
- On a piece that came together, the next note says “It came together. Here’s what to try next.”
- A partner's request ends “Saying no costs nothing.”
- **Listen for:** a teacher's voice in the notes, and the game's plain voice everywhere else.

## 4. Profile: Abilities, Genres, Interpretation, Advice (4 Minutes)

- **Player Profile → What To Work On Next.** Each line says what a weakness did: “cost each piece about” so many points
  off the whole, and what to do about it.
- **Genres:** open a genre's look and read its small print to the end. Its Source line is a citation, with no notes on
  how the research reached the page.
- Open a place from Home's Where You Are. Its tags follow “In short:”.
- **Listen for:** advice that sounds like advice, not a report on a calculation.

## 5. A Setback And Recovery (3 Minutes)

- Advance until you're unwell, or until a visit is booked. The booking notice ends: “Be there then, or press Call It
  Off on Papers, under Health Cover.”
- On a class day, **Call In Sick** says who counts as unwell and what it excuses.
- **Listen for:** a notice that tells you the date and what you can do about it.

## 6. Money With A Restriction Or Pending (2 Minutes)

- **Money → Accounts → Move Money**, more than the account holds. The refusal names what the account has
  “available, so nothing was moved.”
- On **Statements**, a card payment still pending says the day it posts.
- **Listen for:** a refusal with its figure and its way out.

## 7. Papers And A Document On Its Way (1 Minute)

- **Papers → Passport And ID.** A passport you've applied for shows Being Decided with the day it should be ready.
- **Listen for:** the office's own names kept, and the game's sentences around them plain.

## 8. Saving, Leaving And Coming Back (1 Minute)

- **Save & Exit**, then open the slot again. The clock, the notices and their unread marks are where you left them.

## What To Send Back

For each sentence you noted: its page and the words, and, if you like, what you'd have expected it to say. A sentence
that's true but sounds wrong is exactly what this route is for.
