# Brief 14's Receipt: The Player's Language

Written by `receipt.py` from the pass's records on `15421228`, nothing typed: the brief's section 10, in its order. The brief itself is `../briefs-2026-10-16/14-complete-player-facing-language-and-tutorial-overhaul.txt`; how the pass was worked is `README.md`; what crossed areas is `coordinator.md`.

**What this is and isn’t.** Every number here is a count a tool made or a test checked. The interface journeys pressed the controls a player presses at 1440 and 390 wide and read what came back. None of it is a judgment of how the game reads to a person, and nothing here is human usability approval: that’s what `PLAYTEST.md` is for, and only the owner can give it.

## 1. The Style Guide And The Glossary

`docs/STYLE.md`, "Talking to the player", written before any text changed and revised as the areas found what it missed. Its parts:

- Each kind of text has its own job
- Tutorials and help teach a task
- Text built from parts
- Repetition says what changed
- Comments aren't player text

`docs/GLOSSARY.md`, one name for one thing, assembled from the areas’ own glossaries:

| Section | Terms |
|---|---|
| Core | 44 |
| In-World Material: Briefs, Readings And Class Scenes | 10 |
| School | 23 |
| Profile, Abilities, Genres And Advice | 25 |
| Money | 16 |
| Papers And Taxes | 29 |
| Health, Body And Time | 25 |
| Start, Home, Notices And Controls | 8 |
| The Guide And Help | 10 |

## 2. The Inventory, With Statuses

`tools/text-inventory.mjs` finds every string in `src/` a player can see and groups it into the sources a writer reads as one. `docs/text/INVENTORY.md` is the checklist it writes; `docs/text/statuses/` holds each area's statuses against a hash of the text.

|  | Sources | Strings | Words | Rewritten And Verified | Reviewed And Retained | Pending | Blocked | Engine-Speak Hits |
|---|---|---|---|---|---|---|---|---|
| At the start (`d82d38d0`) | 3894 | 31397 | 463488 | 0 | 0 | 3894 | 0 | 758 |
| Now (`15421228`) | 4151 | 34202 | 550968 | 1285 | 2866 | 0 | 0 | 332 |

The start counted TypeScript alone; the JSON the game shows joined the inventory during the pass (224 sources). The engine-speak ratchet (`docs/text/engine-speak.json`) stands at 332; it may fall and may not rise.

Engine-speak by kind, at the start and now. The pattern counts a word; each hit left is in a source an area read and kept. Most are a "take" in a self-tape's sense, which the glossary allows; the code and file names in `content/attributes-matrix.ts`, which writes the documentation and no screen; and words in their ordinary sense, a body's weight in creation, a safe's dial and hand signals in a brief's scene:

| Kind | At the start | Now |
|---|---|---|
| a take, for any judged work | 172 | 152 |
| SLATE’s estimate, inside a sentence | 140 | 7 |
| a file name | 75 | 34 |
| a code name | 59 | 58 |
| a dimension | 56 | 10 |
| a dial | 40 | 11 |
| a choice rehearsed in | 39 | 1 |
| draws on | 37 | 3 |
| work reads it | 27 | 1 |
| a weight | 26 | 19 |
| a signal | 18 | 18 |
| refused, with no reason or next step | 17 | 6 |
| worked out from | 14 | 0 |
| a segment | 14 | 8 |
| what something reads | 10 | 0 |
| a command | 4 | 1 |
| the engine | 3 | 3 |
| the part most often short | 3 | 0 |
| the standing falls a step | 2 | 0 |
| as SLATE reads it | 1 | 0 |
| reads it as | 1 | 0 |

By the area whose status names each source:

| Area | Rewritten And Verified | Reviewed And Retained | Pending | Blocked |
|---|---|---|---|---|
| frame | 137 | 350 | 0 | 0 |
| health | 59 | 112 | 0 | 0 |
| json | 149 | 75 | 0 | 0 |
| material | 101 | 893 | 0 | 0 |
| money | 255 | 425 | 0 | 0 |
| papers | 232 | 233 | 0 | 0 |
| profile | 92 | 374 | 0 | 0 |
| school | 221 | 396 | 0 | 0 |
| tutorial | 39 | 8 | 0 | 0 |

## 3. Coverage By Subsystem

| Subsystem | Sources | Strings | Words | Rewritten And Verified | Reviewed And Retained | Pending | Blocked | Engine-Speak Hits |
|---|---|---|---|---|---|---|---|---|
| Startup, Save Selection, Character Creation And Onboarding | 320 | 1290 | 13815 | 57 | 263 | 0 | 0 | 7 |
| Tutorials, Guides, Help Panels And Connected-System Explanations | 47 | 432 | 10929 | 39 | 8 | 0 | 0 | 0 |
| Home And Its Retained Actions | 17 | 165 | 781 | 7 | 10 | 0 | 0 | 0 |
| Player Profile, Attributes, Genres, Mastery And Progression | 615 | 3531 | 53667 | 241 | 374 | 0 | 0 | 177 |
| School, Classes, Coursework, Rehearsals, Productions, Assessments And Completion | 617 | 6140 | 65554 | 221 | 396 | 0 | 0 | 11 |
| Money, Banking, Payments, Fees, Holds, Statements And Transactions | 755 | 6520 | 147405 | 255 | 500 | 0 | 0 | 13 |
| Papers, Documents, Applications, Taxes And Status Notices | 465 | 4505 | 55976 | 232 | 233 | 0 | 0 | 3 |
| Health, Treatment, Coverage, Stamina, Energy And Recovery | 101 | 782 | 7963 | 58 | 43 | 0 | 0 | 0 |
| Calendar, Schedules, Time Advancement And Reminders | 82 | 1114 | 9140 | 44 | 38 | 0 | 0 | 0 |
| Notifications, Invitations, Feedback And Generated Messages | 28 | 186 | 1045 | 17 | 11 | 0 | 0 | 0 |
| Buttons, Menus, Tabs, Filters, Placeholders, Empty And Loading States, Confirmations | 40 | 172 | 657 | 12 | 28 | 0 | 0 | 0 |
| In-World Material: Scenes, Plays And Audition Sides, In Their Characters’ Voices | 994 | 9182 | 153657 | 101 | 893 | 0 | 0 | 120 |
| The World: Places, Countries, Weather And Reference Data | 70 | 183 | 30379 | 1 | 69 | 0 | 0 | 1 |

## 4. Before And After

960 pairs in the areas' and passes' `examples.json`, 342 of them marked meaning-sensitive (a rewrite whose meaning had to be checked against the code, not only its words).

| Area or pass | Pairs |
|---|---|
| crossarea | 39 |
| data | 39 |
| editorial | 61 |
| frame | 102 |
| health | 73 |
| json | 52 |
| material | 154 |
| money | 111 |
| papers | 122 |
| profile | 61 |
| school | 87 |
| tutorial | 59 |

| Kind of text | Pairs |
|---|---|
| other | 149 |
| narration | 140 |
| official | 137 |
| tutorial | 133 |
| error | 101 |
| notification | 97 |
| label | 86 |
| feedback | 68 |
| button | 12 |
| empty | 11 |
| confirmation | 9 |
| heading | 9 |
| refusal | 5 |
| accessible | 3 |

Two of each kind of text, from two areas, meaning-sensitive ones first:

- **Button** (tutorial, `src/ui/guide/Help.tsx#HelpProvider`)
  - Before: Back To Help
  - After: Back To Help · Back To School
  - Why: Following Show Me Where and coming back now keeps the player’s place: a second button returns to the screen and tab they left.
- **Button** (crossarea, `src/ui/workspaces/ProfileWorkspace.tsx#JourneyPanel`)
  - Before: Your School
  - After: School
  - Why: The rail, the breadcrumb and the School screen's own eyebrow say School; the button names the destination.
- **Label** (crossarea, `src/ui/workspaces/PapersWorkspace.tsx#HealthPane`)
  - Before: HUSKY D: $20.00 of $0.00 paid this year
  - After: HUSKY D: $20.00 paid this year
  - Why: HUSKY D and Covered Connecticut have no most a year (their plan's outOfPocket is 0: care costs nothing, a prescription its copay), so there is no “of”. A plan with a most still says it: “Yale Health: $0.00 of $9,100.00 paid this year”.
- **Label** (data, `src/engine/content/banks-world-sheets.ts#SHEETS`)
  - Before: Savings Account (instant access, adults; minors 0.20%; table dated 17/04/2025)
  - After: Savings Account (instant access, adults; minors 0.20%; table dated April 17, 2025)
  - Why: Bank of Cyprus’s product name, which becomes the account’s name: 17 can only be the day.
- **Notification** (editorial, `src/engine/systems/coursework.ts#reshownWords`)
  - Before: You showed Heightened Text Scene again on October 31, 2028, and took the note on rehearsal. Rehearsal stayed at 0%.
  - After: You showed Heightened Text Scene again on October 31, 2028, and worked the note on Rehearsal into the revision. Rehearsal stayed at 0%.
  - Why: A note taken by the revision's own work, with the part no further on, read as a contradiction. It says how it was taken.
- **Notification** (frame, `src/engine/core/simulation.ts#FAULT_WHILE_TIME_PASSED`)
  - Before: Something Didn’t Go Through / test.fault failed: boom
  - After: Something Didn’t Go Through / An error in the game stopped something it was doing as time passed, so that didn’t happen. Anything it did before the error still stands, and the clock went on.
  - Why: Mid-advance commands aren't snapshotted (execute's own comment), so the sentence never claims nothing changed; it says the clock went on, as it does.
- **Feedback** (editorial, `src/engine/systems/coursework.ts#show`)
  - Before: Simulated note from Speech And Accents III: It didn’t come together today. Rehearsal wasn’t complete, which cost Execution 16.9 points.
  - After: Simulated note from Speech And Accents III: It didn’t come together today. Drills wasn’t complete, which cost Execution 16.9 points.
  - Why: The teacher names the part the card names; the warning already said “What held most of them back was “Drills””.
- **Feedback** (material, `src/engine/content/scenes-house.ts#HOUSE_SCENES [dream-5-1]`)
  - Before: What cuts against it: That was the night before; Philostrate says the Prologue is addressed, and this is the performance.
  - After: What cuts against it: That was the night before. Philostrate says the Prologue is ready, and this is the performance.
  - Why: 'the Prologue is addressed' is Shakespeare's 'address'd' (ready), which reads to a player as 'spoken to'; said as 'ready', and the semicolon split
- **Official** (data, `src/engine/content/pending.ts#PENDING`)
  - Before: Capital One 360 Checking Key account terms, revised 2/2024 (ecm.capitalone.com/WCM/bank/pdfs/360-checking-pew.pdf); capitalone.com/bank/disclosures/checking-accounts/online-checking-account/ (5/20/2026); capitalone.com/help-center/checking-savings/pending-transactions/; capitalone.com/help-center/credit-cards/card-pending-transactions/; capitalone.com/help-…
  - After: Capital One 360 Checking Key account terms, revised February 2024 (ecm.capitalone.com/WCM/bank/pdfs/360-checking-pew.pdf); capitalone.com/bank/disclosures/checking-accounts/online-checking-account/ (May 20, 2026); capitalone.com/help-center/checking-savings/pending-transactions/; capitalone.com/help-center/credit-cards/card-pending-transactions/; capitalone…
  - Why: Slashed dates in the research’s own sentence, written by hand: 5/20/2026 can only be May 20 (20 is no month), and 2/2024 a month and year. Shown on Statements as the Source line.
- **Official** (editorial, `src/engine/systems/credit.ts#registerCredit`)
  - Before: $270.00 to pay, at least $40.00.
  - After: The statement comes to $270.00, due October 11, 2026. At least $40.00 has to be paid by then.
  - Why: A statement notice with no due date; the date is the one the card's due item is set to.
- **Narration** (frame, `src/ui/workspaces/CalendarWorkspace.tsx#EntryDetail`)
  - Before: This one wants you there. Move the clock to it and it happens.
  - After: You need to be there. The clock stops when it comes round, so you can go.
  - Why: Moving the clock to it doesn't make it happen: the clock stops at it and asks (DueNow: Go or Stand Here).
- **Narration** (health, `src/engine/content/lifespan.ts#AGING`)
  - Before: A week off costs a month back.
  - After: A year now takes more from the body than a whole decade did in the twenties.
  - Why: Nothing in the game costs a month for a week off; the 70s band does take more a year (1.80 fitness, 1.25 condition) than the 20s took in ten (1.2, 0.5).
- **Error** (editorial, `src/engine/systems/health.ts#registerHealth <health.extra_supply>`)
  - Before: It costs more than your bank can cover.
  - After: Your bank can’t cover $125.37 for every condition’s fill, so nothing was filled or charged.
  - Why: One shape for money that isn't there: what can't pay, the amount, and what didn't happen. It named no amount at all, so the player couldn't tell how much to move.
- **Error** (frame, `src/engine/core/simulation.ts#FAULT_ROLLED_BACK`)
  - Before: school.attend failed: Cannot read properties of undefined (reading 'x')
  - After: That didn’t go through because of an error in the game. It changed nothing and charged you nothing, so you can carry on from here.
  - Why: The toast showed a command id and an internal message. The player reads that it didn’t happen and that nothing changed; the id and message go to result.detail and the console.
- **Refusal** (school, `src/engine/content/coursework.ts#learn`)
  - Before: Read it first: lines are learned from a scene you know.
  - After: Read the scene first: you learn lines from a scene you know.
  - Why: “It” named nothing on the card; the reason is said to the player.
- **Tutorial** (crossarea, `src/engine/content/guide/craft.ts#CRAFT [craft.genre]`)
  - Before: A take held back most by an ability a concern asks for says so: “Composure held back the consistency by 4.2 points: Nordic Noir’s Feeling Held In asks for it”.
  - After: A tape held back most by an ability one of those concerns asks for says so: “Your … held back … by … points: …’s … asks for it.”, as when your Composure held back Consistency by 4.2 points and Nordic Noir’s Feeling Held In asks for it.
  - Why: `chiefLimit` now says “Your Composure held back Consistency by 4.2 points”; the quote keeps what the code writes whole, and the example is said in prose.
- **Tutorial** (frame, `src/ui/creation/CharacterCreation.tsx#PersonalityStep`)
  - Before: How you lean, not what you can do. Each of them does something: Emotional Stability sets how quickly stress arrives and how quickly it clears, Conscientiousness sets how well the nights go, Ambition adds to how quickly every stress arrives, work’s and money’s alike, and Risk Tolerance over 65 starts your card’s autopay on the minimum, so a balance is carrie…
  - After: How you lean, not what you can do. Each one shapes a part of your life: [a list] Emotional Stability: how quickly stress builds and how quickly it clears, and where your Composure starts. … Risk Tolerance: over 65, your card’s autopay starts on the minimum payment, so you carry a balance. Extraversion: how being watched as you perform, by an audience or a c…
  - Why: A wall of mechanics, made a short overview and a list. Each line says what the code moves, and 'affects' where the lean works both ways (enjoyment.ts: lean() is negative under 50); 65 is read from CARRIES_A_BALANCE.
- **Confirmation** (frame, `src/ui/shell/TimeControls.tsx#TimeControls`)
  - Before: Advancing to One Week (February 18, 2027 at 8:10 PM) comes to 1 commitment on the way. The clock stops at each. A plan of your own you can skip; the school’s calls and classes you go to, or stand where you are and the clock waits, and a rehearsal with a partner you go to or call off, which they’ll mind at short notice.
  - After: Moving the clock to One Week (February 18, 2027 at 8:10 PM) passes one commitment, and the clock stops at each one. At each, you can go, or press Stand Here and the clock waits. A plan of your own can also be skipped, and a rehearsal with a partner called off, though at short notice that costs their trust.
  - Why: Says what each stop offers in the stop's own button labels, as DueNow draws them; 'the school’s calls and classes' left out the doctor's appointments and paper visits that stop the clock too.
- **Confirmation** (papers, `src/ui/papers/Documents.tsx#DocumentList`)
  - Before: Reported stolen, it’s canceled for good, even if it turns up, with any visa or authorization issued on it (the F-1 status holds).
  - After: If you report it stolen, it’s canceled for good, even if it turns up, along with any visa or travel authorization issued on it. An F-1 status you hold continues.
  - Why: A confirmation says what pressing will do, before it’s done.
- **Empty** (frame, `src/ui/shell/TimeControls.tsx#SkipDialog`)
  - Before: You’ve got nothing scheduled ahead of you.
  - After: There’s nothing on your calendar ahead of you.
  - Why: Names the calendar, where the player sees what's ahead.
- **Empty** (money, `src/ui/bank/BankStatements.tsx#CardStatementView`)
  - Before: The card went unused and unpaid in this period.
  - After: The card wasn’t used or paid in this period.
  - Why: Plain words for an empty statement

## 5. The Tutorials’ Routes, Verified On The Built App

`tools/tutorial-routes.mjs` read every label the guide and How This Works name against the final walk and its capture (`final-walk/routes.md`):

| Outcome | Labels |
|---|---|
| in the code only | 280 |
| nowhere | 0 |
| on a screen | 1155 |
| on its screen | 179 |

`tools/guide-quotes.mjs --check`, now in the gate: 580 quoted sentences in the guide; 580 the game says (5 of them held by the test that plays the example), 0 it no longer says.

Each How This Works entry says what to do next or, where nothing follows, why (`tests/guide.test.ts`). The tutorial area's record of the eight questions per tutorial is `tutorial/routes.md` and `tutorial/batches.md`.

## 6. Dynamic Cases

Sections 7 and 8, held across the game by `tests/language-dynamic.test.ts` (`dynamic/README.md`: each bullet, its generators, its variants and the mutations tried). The tests the pass added, each run in the gate:

| Test file | Tests |
|---|---|
| tests/editorial-class-moments.test.ts | 1 |
| tests/editorial-frame-names.test.ts | 1 |
| tests/editorial-money-refusals.test.ts | 4 |
| tests/editorial-school-words.test.ts | 5 |
| tests/journeys14-idcard-reason.test.ts | 2 |
| tests/language-crossarea-raise.test.ts | 1 |
| tests/language-crossarea.test.ts | 5 |
| tests/language-data-dates.test.ts | 12 |
| tests/language-dynamic.test.ts | 33 |
| tests/language-frame-ui.test.ts | 13 |
| tests/language-frame.test.ts | 7 |
| tests/language-genre-look.test.ts | 2 |
| tests/language-injury.test.ts | 3 |
| tests/language-money.test.ts | 20 |
| tests/material-words.test.ts | 3 |

216 older test files were changed to hold the new words as exactly as they held the old; no test title changed.

## 7. Desktop And Mobile

| Width | Screens walked before | Screens walked after | Strings read before | Faults before | Strings read after | Faults after |
|---|---|---|---|---|---|---|
| 1440 | 350 | 375 | 64513 | 6 | 68812 | 0 |
| 390 | 350 | 375 | 64513 | 6 | 68812 | 0 |


The interface journeys on the final commit (exit 0 is every step passed and every language check clean):

| Journey | Exit |
|---|---|
| normal-1440 | 0 |
| normal-390 | 0 |
| setback-1440 | 0 |
| setback-390 | 0 |
| specialist-1440 | 0 |
| specialist-390 | 0 |
| banking-1440 | 1 |
| banking-390 | 1 |
| document-1440 | 0 |
| document-390 | 0 |
| health-1440 | 0 |
| health-390 | 0 |

- banking-1440, step 8 failed: One Week wasn’t asked first: the clock ran from August 28, 2026 5:30 PM to August 31, 2026 9:00 AM and stopped at “Classes ✕ It’s 9:00 AM on August 31, 2026, and this needs you now. Going takes 6 hours, and the clock moves on to September 4, 2026 at 5:30 PM. Only a plan of your own can be skipped.… That is `journeys-3`, left: On The Way can't see next week's classes before Sunday evening: from a Friday it asks nothing, and from a Saturday it says five commitments and stops at ten
- banking-390, step 8 failed: One Week wasn’t asked first: the clock ran from August 28, 2026 5:30 PM to August 31, 2026 9:00 AM and stopped at “Classes ✕ It’s 9:00 AM on August 31, 2026, and this needs you now. Going takes 6 hours, and the clock moves on to September 4, 2026 at 5:30 PM. Only a plan of your own can be skipped.… That is `journeys-3`, left: On The Way can't see next week's classes before Sunday evening: from a Friday it asks nothing, and from a Saturday it says five commitments and stops at ten

## 8. Defects

Every defect the pass found, one entry each, from every record, and checked against the tree by `defects.py --verify` (`DEFECTS.md`, `defects.json`): 101 in all, 90 fixed and 11 left, each left one with its reason and who it's for. 17 more items the records raised were read and not counted, each with why.

| Kind | Fixed | Left | All |
|---|---|---|---|
| text | 33 | 2 | 35 |
| assembly | 35 | 2 | 37 |
| layout | 7 | 0 | 7 |
| behavior | 3 | 1 | 4 |
| test-or-tool | 7 | 3 | 10 |
| data | 5 | 3 | 8 |

## 9. Tests, Commands, Commits And Results

- **`npm run gate`** on `15421228`: not run (`final-checks/gate.txt`).
- **`npm run build`**: not run (`final-checks/build.txt`).
- **The final runs**, each step’s exit recorded (`runs/exits-*.txt`, `final-walk/exits.txt`):

| Record | Steps | Not exit 0 |
|---|---|---|
| runs/exits-A.txt | 5 | none |
| runs/exits-ADVF.txt | 13 | none |
| runs/exits-ADVR.txt | 18 | none |
| runs/exits-B.txt | 13 | none |
| runs/exits-C.txt | 13 | none |
| runs/exits-D.txt | 14 | none |
| runs/exits-J.txt | 4 | none |
| runs/exits-JR1.txt | 32 | none |
| runs/exits-JR2.txt | 32 | none |
| runs/exits-JR3.txt | 36 | none |
| runs/exits-JRC.txt | 2 | none |
| runs/exits-JRR.txt | 3 | none |
| runs/exits-M1.txt | 0 | none |
| runs/exits-M2.txt | 0 | none |
| runs/exits-M3.txt | 0 | none |
| runs/exits-M4.txt | 0 | none |
| runs/exits-MF.txt | 0 | none |
| runs/exits-UI.txt | 19 | ui-banking-1440 exit=1 secs=58; ui-banking-390 exit=1 secs=61 |
| final-walk/exits.txt | 8 | none |

Lanes A and UI ran first on `6d83601a`, and those runs are kept as what they showed, superseded by the runs above (`runs/first/README.md`: each failure a tool reading replaced words or a step after one that threw, and banking’s the engine’s week planning):

| First run | Steps | Not exit 0 |
|---|---|---|
| runs/exits-A-first.txt | 4 | acceptance-1440 exit=1 secs=872; acceptance-390 exit=1 secs=720 |
| runs/exits-UI-first.txt | 18 | ui-normal-1440 exit=1 secs=188; ui-normal-390 exit=1 secs=195; ui-setback-1440 exit=1 secs=38; ui-setback-390 exit=1 secs=42; ui-specialist-1440 exit=1 secs=62; ui-specialist-390 exit=1 secs=67; ui-banking-1440 exit=1 secs=58; ui-banking-390 exit=1 secs=61 |

- **Gameplay unchanged.** Every number, id, list length and key in the final runs against brief 13's, words allowed to differ (`numbers-same.py`, `numbers-same.json`). A difference is explained only by the kind of field it's in, with the reason the script gives; one nothing explains fails it:

| Runs | Files | Identical in every number | Differences explained | Unexplained |
|---|---|---|---|---|
| final | 35 | 35 | none | 0 |
| runs | 17 | 16 | 2 (a measure of words: freshness finds a suggestion by its phrases) | 0 |
| advice | 31 | 0 | 61 (the run’s own record: its commit, the files it read, its seconds) | 0 |
| journeys-final | 102 | 1 | 12378 (a count of notices: fewer merge, since a repeated one says what changed (section 8); the events are compared apart); 198 (the run’s own record: its commit, the files it read, its seconds); 870 (a measure of words: the journeys’ continuity counts text); 4 (the OPT check before its fix read the refusal’s old words; J16’s final part, checked again, passes) | 0 |

The pass's commits on the branch, in order (merges carry each area's own):

- `d82d38d0` Brief 14's baseline: the player's-language standard, its glossary, and an inventory of every string the game shows
- `f6f59e48` Brief 14's before, recorded: the built app's screens on every scenario save, and the baseline gate
- `6dff8679` The Core glossary had energy restored by food and condition lowered by injury; neither is so
- `21524e5a` Merge brief 14's tutorial area: the guide's chapters and How This Works written as the tasks they teach
- `9e56e2d8` The completion matrix read again after the tutorial area's merge: its tests changed what rows cite, the count unchanged
- `4f45bf9b` Merge brief 14's frame area: start, the save slots, Home, notices, the shared controls, the calendar and the clock
- `34de266c` DEVMAP, TRACEABILITY and the completion matrix written again after the frame area's merge: the refusal words and the tests they cite moved
- `ff252265` Merge brief 14's material area: the scenes, plays and audition sides read whole, the game's framing words rewritten
- `0d6d2c30` The completion matrix read again after the material area's merge: the scene and brief files the judge's measurements watch changed, so those rows wait for the final runs too
- `8b6635b7` Merge brief 14's papers area: documents, status, taxes and benefits, applying kept apart from holding
- `d6822940` The coordinator's list of what crosses brief 14's areas: words to align, quotes to sync, and the defects no one area could reach
- `d955fa99` Merge brief 14's health area: care, cover, the body's wellbeing, stamina and energy, and the world's reference data
- `8d2c2f04` The coordinator's list gains what the health area found on other areas' screens, and the papers guide's quotes to align
- `f25c4f94` tools/guide-quotes.mjs: every sentence the guide quotes, held to the game's own words
- `ee39705b` Merge brief 14's money area: banking, cards, payments, fees, holds and statements, pending kept apart from available
- `63df00cf` Merge brief 14's profile area: abilities, techniques, genres, mastery, interpretation and the advice
- `bbb3a151` The text inventory reads the JSON the game shows: 224 sources of research text no area had in its list
- `6f9fe51d` The coordinator's list gains the money and profile areas' questions, and the JSON the inventory now reads
- `1c3157d4` Merge brief 14's school area: classes, coursework, feedback, rehearsals, productions, standing and the degree
- `243a35bb` Hold the material area's words test to the words the school area settled
- `8283f80c` Brief 14: the dynamic cases' instructions, written before their work
- `f7fba3e1` Carry the audit's line citations through brief 14's test edits, and the matrix to the school merge
- `fa1126d1` Merge brief 14's journeys: the bank, an ID card on its way and a sprained ankle, at 1440 and 390
- `961b3f08` An injury says what its care cost and that Call In Sick excuses a class day for it
- `9b313002` Merge brief 14's cross-area code pass: the clock that throws, the plan's decision, the 700, the gazetteer and the guide's next
- `dcbf4b23` An ID card in the mail says it's on its way, and nothing pending shows an issue date
- `d4d2ee01` Merge brief 14's json area: the genres' research in the game's words, and the home accounts shown to reach no screen
- `d5c9509e` Merge brief 14's dynamic cases, and carry the audit's citations through the pipeline that makes it
- `bdf457c6` Merge brief 14's cross-area words: the guide quotes what the game says, one word for each thing, and the glossary whole
- `20f2757e` The integration's open words: the genre look's research, Left the School, durations in words, a title on two lines
- `c74a02e1` Brief 14: the research data's dates and the editorial review, their instructions written before their work
- `e84abeb2` The gate holds the standard from here: a changed word is read again, and the guide quotes what the game says
- `a5c167ff` Merge brief 14's research data pass: a source's date as the game writes one, kept through each rebuild
- `7bfc4532` A source line says each of its days once, and which is which; the glossary gives the game's dates in Core
- `6d83601a` Merge brief 14's editorial review: the finished game read as a player meets it, in one voice
- `66754ada` Brief 14's close-out scripts, written before the final runs they read
- `83dce889` Brief 14's defects in one index, every fix checked against the tree
- `b7ad82fd` Brief 14's final walk of the built app on 6d83601a, and the walkthrough for the owner checked against it
- `fc6d03b8` The engine-speak ratchet set at what the pass left, 332 of the 758 it found
- `7e1152de` The journeys' OPT check reads the refusal's new words, so it counts the refusal it was always counting
- `a57fe23c` Brief 14's final runs on 6d83601a: the same game as brief 13's in every number
- `0657e963` Merge the interface tools' new words: brief 13's playthroughs and the acceptance run read the game as it now says it
- `ebdb5577` Work On The Note's toast says what it moved in words, not by the part's internal name
- `edd7be91` Brief 14's first built-app runs kept under runs/first/, and the lanes guarded against what spoiled their rerun
- `15421228` The toast's defect recorded, the refusal's shape settled, and the receipt reading the routes and the first runs apart

## 10. What Remains Unreviewed Or Blocked

- **Unreviewed:** 0 sources Pending, and the gate fails on one. **Blocked:** 0.
- **Left open, each with why, in `coordinator.md`:**
  - Dead content.
  - On The Way before Sunday evening
- **Defects left:** 11, each with why, in `DEFECTS.md`.

## 11. The Manual Walkthrough

`PLAYTEST.md`: a route for the owner to play by hand on a local build, every step with what to expect and what to report.

## Not Yet Finished

- the gate: not run
- the build: not run
