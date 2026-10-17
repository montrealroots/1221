# Brief 12's Player Walkthrough

A route through the built app for the owner to play by hand, about forty minutes (brief 12, section 7). It runs on a
local build. Nothing is deployed:

```powershell
npm ci
npm run build
npx vite preview --port 4173
```

Then open http://localhost:4173. Each step says what to press, what you should see, and what to report if you don't. The
built app's acceptance run played every step on the tested commit, at 1440 and at 390 wide (`runs/acceptance/`). The
step it passed is named in brackets, and the figures quoted are that run's. A life of your own differs in the details,
not in what happens.

## 1. A Character

- **New Save**, then the five steps of creation. Type a birthplace and pick it. Continue stays grayed until a step is
  complete. Then **Begin**.
- **Expect:** Home, with the Guide asking to be read first: 12 controls locked until its chapters are. Read them with
  **Guide (N Left)** and every control opens.
- **To load a life instead:** **Continue** on the start screen opens the last save at the day and hour it was left.
- **Report:** a step that lets you Continue with something missing, or a control still locked after the chapters.
- [creation: five steps, Continue held until each validates, Begin; guide: a new player's controls are locked until its
  chapters are read]

## 2. School, Money, Papers And Health

- **Advance → Next Monday** until term. On the way, each stop (registration, orientation, meeting your class) is a
  dialog that says what it asks.
- **School:** registration and orientation are findable and say what they ask. **Coursework** lists the scenes due.
- **Money → Accounts:** try **Move It** with more than the account holds. It's refused in words. Then move $1, and it's
  sent.
- **Papers:** five tabs open: Tax Returns, Health Cover, Unemployment, Passport And ID, Permission To Work.
- **Health Cover:**
  - Your Cover says **Yale Health**.
  - The Marketplace says that from 2027 Medicaid's work rules are met by a month spent at the School, or by $580 of
    income.
  - Nothing offers hours of work. Jobs went in the scope reset, and brief 12 cut the rule's last work branch.
- **Report:** anything that offers a job or work hours, a tab that doesn't open, or a refusal that gives no reason.
- [advance: Next Monday, to term; school: registration and orientation are findable; money: a transfer refused for more
  than the account holds, then made; papers: its five tabs open; health: Health Cover names the student's cover and
  says the School meets the work rules, offering no work hours]

## 3. Prepare And Perform Work

- **School → Coursework:** a scene's preparation buttons are Read The Scene, Learn Lines and Rehearse Alone.
- **Expect:** each spends its minutes, and the clock and the part's figure both move ("Read The Scene: 40 minutes, Knows
  The Scene up 39%."). A step that waits on something says what, grayed: "Jordan asked to rehearse: answer first."
- **Play It This Way:** choose how to play the scene and rehearse it in. Answer the table work from its list.
- **Report:** a button that spends time and changes nothing, or a grayed one that doesn't say why.
- [coursework: a step of preparation done from its button; a way of playing it chosen and rehearsed in; table work
  answered from its select]

## 4. Compare Acting Choices

- **Player Profile → a genre → Open Its Brief.** Break It Down, Learn The Lines, then **Read It This Way**: choose a
  reading and a side, restrained or expansive. Then Rehearse It On Your Feet and **Tape It**.
- Choose the other side and tape again.
- **Expect:**
  - each take says which side suits the scene ("Expansive suits, Restrained either") and what the way gave;
  - both takes are in the takes table;
  - the side against the scene's grain can still be the better take where it plays to what you do well, and the take
    says which.
- **Work It Through:** name a problem, try a way, read its evidence, then keep it or put it back.
- **Report:** two sides that read the same on a scene that favors one, or a take that doesn't say why it came out as it
  did.
- [brief: broken down, lines learned, a reading chosen and rehearsed; taped, the result read; interpretation: Melodrama
  played the way its scene suits; brief: Work It Through on its beats]

## 5. Follow The Training Advice

- **Read the brief's What To Work On**, or the Player Profile's:
  - the first-named input, and what twenty sessions of practice would bring;
  - what the forecast assumes of your last pieces, which were taped complete and which are read as taped;
  - whether preparation, training or both deserve your attention now.
- **Follow it:** Practice An Hour on the named exercise, with Advance → Tomorrow Morning between sessions, for a few days.
- **Expect:** the advice says how long it has stood and what has moved its forecast since, part by part: the work, your
  genres, your other abilities, its own level and discipline. A forecast that rises says why.
- **Ignore it** for a few days: it keeps naming what brings most and says so. It doesn't switch to something worse for
  variety.
- **Report:** advice that changes with no reason given, advice that doesn't change after the input it named moved, or a
  forecast that rises with no explanation.
- [advice: What To Work On says what its forecast assumes of the work and whether preparation, training or both deserve
  attention; brief: the weakness trained from the brief, an hour of practice; prepared further and taped again, better,
  and the record says why]

## 6. Stamina And Recovery

- **Player Profile:** read Current Condition (Readiness, Energy and Stress, Sleep owed) and the Stamina row under
  Attributes And Craft.
- **Look After Yourself → Work Out**, in the morning before classes. During classes it's refused in words: "You're at
  Classes until 3:00 PM."
- **Expect:** Energy falls (74 to 61 in the run) and Stamina rises (48.4 to 49.1).
- **Advance → Tomorrow Morning:** Energy comes back (74).
- **Report:** a workout that leaves Energy or Stamina where they were, or a night that gives nothing back.
- [stamina and recovery: Work Out spends Energy and builds Stamina on the Profile; a night's sleep gives the Energy back]

## 7. A Financial Or Document Action

- **Papers → Passport And ID → Get Non-Driver Identification Card.**
- **Expect:** "Non-Driver Identification Card, for $28.00; the card comes" a date about four weeks on, "good until" your
  birthday seven years on.
- **The money side:** the transfer in step 2.
- **A character born abroad:** an F-1 student sees on the same panel that a card runs to the end of lawful presence,
  labelled SLATE's assumption, since the state publishes no term. The card itself waits on a Social Security number,
  which work-study applies for, and the button says so.
- **Report:** a charge without a card, or a second card charged while one is on its way.
- [papers: a Connecticut ID card got from Passport And ID, its fee, its mailing and its term said]

## 8. Save, Exit And Continue

- **Save & Exit,** then **Continue**.
- **Expect:** the same day and hour. The card says "One is on its way.", and a brief's takes and preparation are kept.
- **Report:** anything different after Continue.
- [save and exit, then Continue: the same day and hour; the ID card still on its way after Save & Exit and Continue;
  brief: save and exit, Continue: the brief, its takes and its preparation kept]

## What To Report

For anything that surprised you, report:

- the step, what you pressed, what you expected and what you saw;
- the date and hour on the game's clock;
- the browser and the window's width.

A save lives in the browser, so play the route in one browser from start to finish.
