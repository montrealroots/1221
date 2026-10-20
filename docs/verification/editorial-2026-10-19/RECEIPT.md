# Brief 15's Receipt: The Natural-Language Editorial Pass

Written by `receipt.py` from the pass's records on `aabfc1b2`, nothing typed: the brief's section 12, in its order. The brief is `../briefs-2026-10-16/15-complete-natural-language-editorial-pass.txt`; how the pass was worked is `README.md`; what crossed areas is `coordinator.md`; the reading of all ten areas together is `crossarea.md`.

**What this is and isn’t.** Every number here is a count a tool made or a test checked. The journeys pressed the controls a player presses at 1440 and 390 wide, and the walk read Home, every destination the rail lists and every tab behind each, on fifteen saves. A green check is no proof of good prose (section 10), and nothing here is human usability approval: the review route, `PLAYTEST.md`, is for the owner’s ear, and only the owner can give it.

## 1. The Second-Pass Inventory, Every Source Accounted For

`tools/text-inventory.mjs` finds every string in `src/`, `index.html` and `public/` a player can see, and groups it into the sources a writer reads as one. Brief 15 gave each a second status apart from brief 14's, so the first pass's history is kept (`docs/text/statuses/`, `docs/text/second-pass/`).

|  | Sources | Strings | Words | Engine-Speak Hits |
|---|---|---|---|---|
| At the start (`bdb23949`) | 4151 | 34202 | 550968 | 332 |
| Now (`aabfc1b2`) | 4177 | 35893 | 566322 | 321 |

| The second pass | Rewritten | Retained | Pending | Blocked |
|---|---|---|---|---|
| Every source | 916 | 3261 | 0 | 0 |

Every source brief 14 kept or rewrote was read again; how the two passes meet:

| First pass (brief 14) | Second pass (brief 15) | Sources |
|---|---|---|
| Pending | Retained | 119 |
| Pending | Rewritten | 910 |
| Reviewed And Retained | Retained | 2415 |
| Rewritten And Verified | Retained | 727 |
| Rewritten And Verified | Rewritten | 6 |

A first-pass Pending here isn't a source brief 14 left unread: brief 14 closed with none. It is one whose words changed after brief 14 read them, which brief 15's rewrites did and so did merges, or one new since (26 more sources than at the start).

By the area whose status names each source:

| Area | Sources | Words | Rewritten | Retained | Pending | Blocked |
|---|---|---|---|---|---|---|
| frame | 490 | 32683 | 75 | 415 | 0 | 0 |
| health | 174 | 38616 | 31 | 143 | 0 | 0 |
| material-a | 508 | 80158 | 91 | 417 | 0 | 0 |
| material-b | 492 | 74122 | 118 | 374 | 0 | 0 |
| money | 261 | 54351 | 102 | 159 | 0 | 0 |
| money-data | 522 | 99446 | 162 | 360 | 0 | 0 |
| papers | 469 | 56353 | 74 | 395 | 0 | 0 |
| profile | 615 | 55712 | 114 | 501 | 0 | 0 |
| school | 599 | 63181 | 123 | 476 | 0 | 0 |
| tutorial | 47 | 11700 | 26 | 21 | 0 | 0 |

By subsystem:

| Subsystem | Sources | Words | Rewritten | Retained | Pending | Blocked | Engine-Speak |
|---|---|---|---|---|---|---|---|
| Startup, Save Selection, Character Creation And Onboarding | 322 | 15647 | 54 | 268 | 0 | 0 | 7 |
| Tutorials, Guides, Help Panels And Connected-System Explanations | 47 | 11700 | 26 | 21 | 0 | 0 | 0 |
| Home And Its Retained Actions | 17 | 786 | 3 | 14 | 0 | 0 | 0 |
| Player Profile, Attributes, Genres, Mastery And Progression | 615 | 55712 | 114 | 501 | 0 | 0 | 176 |
| School, Classes, Coursework, Rehearsals, Productions, Assessments And Completion | 627 | 66199 | 127 | 500 | 0 | 0 | 7 |
| Money, Banking, Payments, Fees, Holds, Statements And Transactions | 761 | 151321 | 260 | 501 | 0 | 0 | 13 |
| Papers, Documents, Applications, Taxes And Status Notices | 469 | 56353 | 74 | 395 | 0 | 0 | 3 |
| Health, Treatment, Coverage, Stamina, Energy And Recovery | 102 | 8119 | 27 | 75 | 0 | 0 | 0 |
| Calendar, Schedules, Time Advancement And Reminders | 83 | 14545 | 13 | 70 | 0 | 0 | 0 |
| Notifications, Invitations, Feedback And Generated Messages | 28 | 1042 | 1 | 27 | 0 | 0 | 0 |
| Buttons, Menus, Tabs, Filters, Placeholders, Empty And Loading States, Confirmations | 40 | 663 | 4 | 36 | 0 | 0 | 0 |
| In-World Material: Scenes, Plays And Audition Sides, In Their Characters’ Voices | 994 | 153738 | 209 | 785 | 0 | 0 | 114 |
| The World: Places, Countries, Weather And Reference Data | 72 | 30497 | 4 | 68 | 0 | 0 | 1 |

The engine-speak ratchet (`docs/text/engine-speak.json`) stands at 321, from 332 at the start; it may fall and may not rise.

**Omissions.** The inventory was checked against the game before any text changed, and again at the cross-area review (`omissions.md`): the page’s title, the holiday names, and every citation that began with a web address were brought in; the gazetteer’s place names are proper names and stay out.

## 2. Representative Before And After, From Every Subsystem

875 pairs in the areas' `examples.json`, each checked against the code. The working reference (`reference.md`) is the eight kinds of text the brief names, with the owner's four examples, rewritten before the areas began.

| Area | Pairs |
|---|---|
| frame | 55 |
| health | 45 |
| material-a | 128 |
| material-b | 261 |
| money | 82 |
| money-data | 56 |
| papers | 45 |
| profile | 66 |
| school | 87 |
| tutorial | 50 |

- **frame** (`src/ui/looks/attention.tsx#top`)
  - Before: The save keeps it until there are more than 500 notices, when the oldest are dropped.
  - After: SLATE keeps your latest 500 notices, so this one stays until 500 newer ones have come in.
  - Why: The rule said as what happens to this notice.
- **frame** (`src/engine/persistence/local.ts#LocalSaveAdapter`)
  - Before: The save couldn’t be written to this device, so the slot still holds what it held before. Try again in a moment.
  - After: SLATE couldn’t save to this device, so nothing in the slot changed. Try again in a moment.
  - Why: What happened and whether anything changed, in plain words; 'still holds what it held before' made the player work it out.
- **health** (`src/engine/systems/health.ts#registerHealth`)
  - Before: title “Appeal Upheld”, body “The plan kept its denial for a checkup, Fair Haven Community Health Care, so the full bill stands.”
  - After: title “Appeal Lost”, body unchanged
  - Why: An appeal “upheld” means one that succeeded. This notice is for the one that failed, and Papers calls the outcome Denial Upheld. “Appeal Lost” is the plain opposite of the notice “Appeal Won” (renames.json).
- **health** (`src/engine/content/guide/body.ts#BODY [scheduled]`)
  - Before: An injury from a run or a workout brings a doctor’s care, and a bill for it.
  - After: An injury from a run or a workout needs care, and you may owe a share of its cost.
  - Why: Not every injury brings a bill: a covered one “costs you nothing” (mayHurt). Care can also be urgent care or the emergency room, not only a doctor.
- **material-a** (`src/engine/content/scenes-classical.ts#CLASSICAL_SCENES [scandal-2-1]`)
  - Before: That’s the fourth act.
  - After: The screen scene is the fourth act; this one is at home with Sir Peter.
  - Why: This reason is also the teacher's note when the answer is chosen ('Given Circumstances: <reason> You played …'), where the answer isn't repeated, so 'That’s the fourth act' pointed at nothing. It now names the scene it means and says where…
- **material-a** (`src/engine/content/briefs/briefs-a.ts#BRIEFS_A [brief-action]`)
  - Before: Reason, then force, then the relief of making it under, held with the fear of the landing shutter.
  - After: Reason, then force, then relief at having the keys, held together with fear as the shutter lands.
  - Why: 'Making it under' named nothing in the scene: nobody goes under the shutter. The relief is at getting the keys back, and the fear is the shutter landing, which is what the third beat's two tones hold.
- **material-b** (`src/engine/content/briefs/second-a.ts#SECOND_A [brief-christmas-3]`)
  - Before: For the tape he sits in the big chair, and the child is read off camera at the eyeline of a child beside him.
  - After: For the tape, sit in the big chair and play to the reader off camera, at a child’s eyeline beside you.
  - Why: "The child is read off camera at the eyeline of a child" was a passive staging note; it is now the instruction, with the eyeline said once.
- **material-b** (`src/engine/content/briefs/second-c.ts#SECOND_C [brief-giallo-2]`)
  - Before: She mentions the visitor dropped something, a ticket for tonight’s sleeper, berth fourteen, and the reporter takes out her own.
  - After: The concierge mentions the visitor dropped something, a ticket for tonight’s sleeper, berth fourteen, and the reporter takes out her own.
  - Why: "She" in a beat is the player's character everywhere else in the brief; here it was the concierge, so it says so.
- **money-data** (`src/engine/content/accountlife.ts#UNCLAIMED (MX.to)`)
  - Before: after 3 years without movement the balance goes to the bank's 'cuenta global' (90 days' written notice first); after 3 more years there, amounts up to 300 days of minimum wage prescribe to the Beneficencia Pública
  - After: the Beneficencia Pública
  - Why: The field is a destination, printed as "… went to <it> after years unused." and in the bank's question and notice. A clause had been put there, so the screen read "went to after 3 years without movement the balance goes to …". It names the…
- **money-data** (`src/engine/content/banks-thirteen.ts (fr-societe-generale.current.source)`)
  - Before: (€2.55 a month here)
  - After: (€2.55 a month in the game)
  - Why: "(€2.55 a month here)" left the player to guess where "here" was. It's the game's monthly share of a quarterly fee, and says so.
- **money** (`src/ui/workspaces/BankWorkspace.tsx#BankWorkspace`)
  - Before: You can take out €2,000 more this month without notice.
  - After: You can take out €1,999.50 more this month without notice.
  - Why: Defect m1's third instance: the hint rounded the allowance left to whole euros, more than Move It would then let out.
- **money** (`src/engine/systems/banking.ts#registerBanking <bank.transfer>`)
  - Before: Chase Total Checking has only $40.50, so nothing was moved.
  - After: Chase Total Checking has only $40.50 available, so nothing was moved.
  - Why: The figure is the available balance, pending card payments already off it, and the word says so (the reference's banking restriction).
- **papers** (`src/ui/workspaces/PapersWorkspace.tsx#TaxPlanPanel`)
  - Before: Paid by you
  - After: Not by direct debit
  - Why: Every plan payment is taken from your accounts on its day either way; the note beside Each Month said otherwise (defects.md, 9).
- **papers** (`src/ui/workspaces/PapersWorkspace.tsx#ConditionsPanel`)
  - Before: Left alone.
  - After: Care stopped. It’s left untreated from now on.
  - Why: Let It Go’s toast said “left alone”, the word the glossary replaced; it now says what pressing it did and what follows.
- **profile** (`src/ui/looks/actor.tsx#top`)
  - Before: Worked out again from what it was judged on, it comes to 50.2.
  - After: Judged again from its record, it comes to 50.2.
  - Why: "Worked out again from what it was judged on" is the engine's replay described from inside. The other two variants read the same way now: "…so it can’t be judged again. Its result stands."
- **profile** (`src/engine/content/abilities.ts#ABILITY_DEFS [memory]`)
  - Before: It started with the rest of your training, as your techniques did. Older saves called it Memorization.
  - After: It was set with your techniques when the school admitted you. Older saves called it Memorization.
  - Why: "The rest of your training" named nothing the player has seen. The four abilities kept in the craft are drawn with the techniques at admission.
- **school** (`src/ui/workspaces/SchoolWorkspace.tsx#CastReadPanel`)
  - Before: the Yale Cabaret, 5 nights (…%, counted ×2.5)
  - After: the Yale Cabaret, 5 nights (…%, counted as 2.5 nights)
  - Why: "×2.5" was a weight; the weight is nights (a run's nights up to eight, a Cabaret's at half), so it says so.
- **school** (`src/engine/systems/evaluation.ts#chiefLimit`)
  - Before: Your Vocal Expression held back Execution by 25.7 points
  - After: Your vocal expression held back your execution by 26 points out of 100
  - Why: The working reference's example 2: a teacher names the weakness in plain words and doesn't quote a tenth; the quality is "your execution", and "out of 100" says what the points are of.
- **tutorial** (`src/engine/content/tutorial.ts#CHAPTERS [body]`)
  - Before: Condition is how fit your body is for work today, after illness, injury and rest.
  - After: Condition is how sound your body is. Illness, going hungry, heavy stress and short nights wear it down, and a night of real rest mends it.
  - Why: The old sentence was wrong: an injury raises stress and lowers morale but leaves condition alone (defects.md, 2). The new one names what does wear it down, as the glossary does.
- **tutorial** (`src/engine/content/tutorial.ts#CHAPTERS [school]`)
  - Before: A scene pairs you with a classmate. Pick an evening they’re free and press Ask with their name, such as Ask Zoe.
  - After: A scene pairs you with a classmate. To rehearse together, choose a day and a time under Rehearsing With, at least two hours ahead, and press Ask with their name, such as Ask Zoe.
  - Why: It names the panel the controls are on and the rule the card itself states (at least two hours ahead). “Pick an evening they’re free” promised a free-time check the picker doesn't show: the classmate answers yes or no.

## 3. Specific Reasons For Retained Text

Every Retained status carries a reason the tool checks: eight words at least, and none of the brief’s ruled-out reasons ("already reviewed", "grammatically correct", "no flagged words"). Each area’s `retained.md` samples them; two from each area’s statuses:

- **frame**, `src/app/SlateApp.tsx#OPEN_FAILURE`: Says what failed, that an error in the game caused it, and both ways on: Restart SLATE, the button right under it, or the slot’s backup.
- **frame**, `src/app/SlateApp.tsx#SlateApp`: A plain heading over the failure’s own sentence, and Restart SLATE, the one button there, named for exactly what it does: it reloads the game.
- **health**, `src/engine/content/body.ts#BODY`: A citation line of the published studies behind body weight and energy, kept as the sources cite themselves so a reader can look them up.
- **health**, `src/engine/content/body.ts#ONSET`: The citations behind when a long-term condition begins, kept exactly as the CDC report and the papers name themselves, with their links.
- **material-a**, `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [clock]`: Against The Clock makes the shutter the scene's subject in a plain sentence and rests it on the brief's own fact, the timer, with her colleague behind it.
- **material-a**, `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [reason]`: Talking Him Down gives the order the scene is played in, talk first and the fight only when that fails, resting on the offer she makes him in the first beat.
- **material-b**, `src/engine/content/briefs/second-a.ts#SECOND_A [corner]`: Still In His Corner names one playable idea, that she is still coaching him even in the fight, and rests it on two facts the brief states: eight years and the six o’clock job.
- **material-b**, `src/engine/content/briefs/second-a.ts#SECOND_A [champion]`: The Old Champion gives the fight a reason an actor can play, proving she can still win with a bad shoulder, and rests it on her title and the punch she holds back.
- **money**, `src/engine/content/currency.ts#RATES_NOTE`: One sentence saying the exchange rates are estimated, not live market rates, shown where money converts
- **money**, `src/engine/content/currency.ts#SYMBOLS`: Currency symbols as each country writes them, Ft, Rp, Rs, Kz and the rest, before a figure
- **money-data**, `src/engine/content/banks-lending.ts#FR_LOAN`: The market averages used where a country’s banks publish no loan rate: the Banque de France’s, the ECB’s and the Banco de España’s, each named with its month, so Borrowing says whose figure it is.
- **money-data**, `src/engine/content/banks-lending.ts#FR_TERM`: The market averages used where a country’s banks publish no term deposit rate, named as each country names the product (Dépôt à terme, Festgeld, Depósito a plazo fijo) with whose figure it is and its month.
- **papers**, `src/engine/content/guide/documents.ts#NEW_HAVEN`: A time zone name the guide's dates are written in, America/New_York, which the guide never shows as words.
- **papers**, `src/engine/content/guide/documents.ts#SSN_VISIT`: The Social Security visit's length in plain words, an hour, read from the rule's minutes so the guide can't drift from it.
- **profile**, `src/engine/content/approaches.ts#AXES`: The three axes of how you play a scene, Pace, Scale and Structure, and each way of playing in a line that says what it looks like on stage, such as Less shown than felt
- **profile**, `src/engine/content/approaches.ts#APPROACH_EFFECT`: The three axes of how you play a scene, Pace, Scale and Structure, and each way of playing in a line that says what it looks like on stage, such as Less shown than felt
- **school**, `src/engine/content/coursework.ts#QUESTIONS [circumstances]`: The five questions of table work by the names acting teachers use, given circumstances, the relationship, your objective, the obstacle and a choice to play.
- **school**, `src/engine/content/coursework.ts#QUESTIONS [relationship]`: The five questions of table work by the names acting teachers use, given circumstances, the relationship, your objective, the obstacle and a choice to play.
- **tutorial**, `src/engine/content/guide/index.ts#GOALS [start]`: Getting Started names its three entries in their order, Home, the guide and this help, and finding your way, in plain words a new player reads first.
- **tutorial**, `src/engine/content/guide/index.ts#GOALS [day]`: Your Day And The Clock lists its six entries in order, each by the name the player meets on Home: what's coming, the clock, moving time on, what needs you, plans, weather.

## 4. Verified Tutorial Journeys

The tutorial area followed every chapter of the guide on the built app at 1440 and 390, pressing what each says to press (`tutorial/follow-1440`, `follow-390`, `routes.md`). On the tested commit it was followed again:

| Width | Exit | Record |
|---|---|---|
| 1440 | 0 | `final-follow/follow-1440.log` |
| 390 | 0 | `final-follow/follow-390.log` |

`tools/guide-quotes.mjs --check`, in the gate: 584 quoted sentences in the guide; 584 the game says (5 of them held by the test that plays the example), 0 it no longer says.

## 5. Dynamic Text And Repeated Messages

Section 8’s variants (singular and plural, a missing optional part, names, pronouns, dates, amounts, deadlines, changed statuses) are held by `tests/language-dynamic.test.ts` and the areas’ tests, each area’s batch notes recording the variants it read. A repeated note says what changed since the last (`systems/coursework.ts`, `tests/variety.test.ts`). The tests the pass added:

| Test file | Tests |
|---|---|
| tests/editorial-money-screens.test.ts | 7 |
| tests/editorial-money.test.ts | 17 |
| tests/editorial-papers.test.ts | 13 |
| tests/guide-chapter-facts.test.ts | 4 |

135 test files were changed to hold the new words as exactly as they held the old; no behavioral check was loosened.

## 6. Defects, Apart From The Editorial Changes

`DEFECTS.md`, from every area's record and the coordinator's: 74 in all, 66 fixed and 8 left, each left one for the owner with why.

| Kind | Fixed | Left | All |
|---|---|---|---|
| accessibility | 1 | 0 | 1 |
| behavior | 0 | 3 | 3 |
| data | 0 | 3 | 3 |
| layout | 2 | 0 | 2 |
| unwired | 1 | 2 | 3 |
| words | 62 | 0 | 62 |

## 7. The Built Game

| Width | Screens walked before | Screens walked on the tested commit |
|---|---|---|
| 1440 | 375 | 375 |
| 390 | 375 | 375 |

The tested commit's walk, line by line against the inventory (`tools/text-omissions.mjs`, `final-walk/omissions.json`): 3704 lines of four words or more, 3060 held by an inventory string, 644 assembled from values, 0 from a file the inventory doesn't read.

The brief’s eight journeys, each with the runs on the tested commit that press it (exit 0 is every step passed and every language check clean):

| Journey | Runs | How |
|---|---|---|
| New-player onboarding | ui-normal-1440 0, ui-normal-390 0, acceptance-1440 0, acceptance-390 0 | the normal playthrough and the acceptance run, each from the empty slots through creation, the guide and the first days; the guide’s chapters followed on the build (final-follow/) |
| School: preparation, a showing, feedback, improvement | ui-normal-1440 0, ui-normal-390 0 | the normal playthrough: a term’s coursework, its showings and the notes after |
| Attributes, genres, interpretation and advice | ui-specialist-1440 0, ui-specialist-390 0 | the specialist playthrough: the Profile’s strengths, a Nordic Noir brief prepared, a reading chosen and taped, the advice followed, taped again |
| A setback and recovery | ui-setback-1440 0, ui-setback-390 0 | the setback playthrough: the term’s coursework warning, the scene it names short of its partner part, a reader, and the scene shown Working |
| Banking with a restriction or a pending state | ui-banking-1440 1, ui-banking-390 1 | brief 14’s banking journey: a transfer refused for more than the account holds, money moved, a card payment pending, the statement once it posts |
| Papers and a document on its way | ui-document-1440 0, ui-document-390 0 | brief 14’s document journey: a Connecticut ID card applied for, refused again while it’s on its way, then held |
| A health interruption | ui-health-1440 0, ui-health-390 0 | brief 14’s health journey: an injury, Work Out and a class’s step refused for it, its care and cost, the days it mends |
| Saving, exiting and continuing | ui-normal-1440 0, ui-normal-390 0, ui-specialist-1440 0, ui-specialist-390 0, acceptance-1440 0, acceptance-390 0 | every playthrough ends with Save & Exit and Continue, and checks the same moment came back (all but setback also ask Delete and keep the slot); the acceptance run continues twelve of the saves from their slot, and saves and continues with an ID card on its way; the review route asks the owner to do it by hand |

- ui-banking-1440, step 8 failed: One Week wasn’t asked first: the clock ran from August 28, 2026 5:30 PM to August 31, 2026 9:00 AM and stopped at “Classes ✕ It’s 9:00 AM on August 31, 2026, and this needs you now. Going takes 6 hours, and the clock moves on to September 4, 2026 at 5:30 PM. You can only skip a plan of your own, so… That is brief 14's `journeys-3`, left for the owner: On The Way can't see next week's classes before Sunday evening: from a Friday it asks nothing, and from a Saturday it says five commitments and stops at ten
- ui-banking-390, step 8 failed: One Week wasn’t asked first: the clock ran from August 28, 2026 5:30 PM to August 31, 2026 9:00 AM and stopped at “Classes ✕ It’s 9:00 AM on August 31, 2026, and this needs you now. Going takes 6 hours, and the clock moves on to September 4, 2026 at 5:30 PM. You can only skip a plan of your own, so… That is brief 14's `journeys-3`, left for the owner: On The Way can't see next week's classes before Sunday evening: from a Friday it asks nothing, and from a Saturday it says five commitments and stops at ten

Every lane ran first on `c3478f9e`. The engine’s lanes all exited 0 there; lanes A and UI failed on matchers that looked for words brief 15 changed, steps after them, and one wall of text, which the game now fixes (`uitools/README.md`). Those runs are kept in `runs/first/`, and every lane ran again on the commit the table above names.

**Routes not exercised by a run.** Dialogs and states no save reaches are read in the code (the inventory) and by the areas’ renders, not on the build. No run plays a whole degree on the build: brief 13’s twenty-five journeys play it in the engine (`journeys-final/`). The built app is checked in Chromium alone. Whether the voice is natural is the owner’s to judge.

## 8. Tests, Commands, Commits And Outcomes

- **`npm run gate`** on `aabfc1b2`: exit 0, 395 of 395 files and 4771 of 4771 tests (`final-checks/gate.txt`).
- **`npm run build`**: exit 0 (`final-checks/build.txt`).
- **The final runs**, each step’s exit recorded (`runs/exits-*.txt`):

| Record | Steps | Not exit 0 |
|---|---|---|
| runs/exits-A.txt | 6 | none |
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
| runs/exits-M1.txt | 0 | none |
| runs/exits-M2.txt | 0 | none |
| runs/exits-M3.txt | 0 | none |
| runs/exits-M4.txt | 0 | none |
| runs/exits-MF.txt | 0 | none |
| runs/exits-UI.txt | 19 | ui-banking-1440 exit=1 secs=58; ui-banking-390 exit=1 secs=61 |

- **Gameplay unchanged.** Every number, id, list length and key in the final runs against brief 14's, words allowed to differ (`numbers-same.py`, `numbers-same.json`):

| Runs | Files | Identical in every number | Differences explained | Unexplained |
|---|---|---|---|---|
| final | 35 | 35 | none | 0 |
| runs | 17 | 17 | none | 0 |
| advice | 31 | 0 | 61 (the run’s own record: its commit, the files it read, its seconds) | 0 |
| journeys-final | 102 | 4 | 189 (the run’s own record: its commit, the files it read, its seconds); 66 (a measure of words: the journeys’ continuity counts text); 4 (the OPT check before its fix read the refusal’s old words; J16’s final part, checked again, passes) | 0 |

The pass’s commits on the branch, in order (merges carry each area’s own):

- `6d111b49` Brief 15 begins: a second editorial pass over every source, its standard and reference, and the inventory checked against the game
- `56afc098` The inventory checked against the game before the second pass: no line outside it, three omissions found by hand
- `6b70f047` Merge brief 15's frame area: start, the slots, creation, Home, the clock and the calendar, read again and said plainly
- `907eb48a` Brief 15: the coordinator's list begins, with the frame area's items for other areas
- `8b8e820a` Merge brief 15's papers area: documents, taxes, status and benefits, read again and said plainly
- `65c9cffa` Brief 15: the papers area's items for other areas, on the coordinator's list
- `9d52f895` Merge brief 15's second material area: the second set of audition briefs, staging notes made instructions, read again and said plainly
- `d3a8eee6` Brief 15: the second material area's items for other areas, on the coordinator's list
- `58e4402b` Merge brief 15's health area: care, cover, bills, the body and the world's reference data, read again and said plainly
- `badd8b69` Brief 15: health's Blocked booking notice now says what to do next, and the guide quotes it
- `98e6a093` Merge brief 15's tutorial area: the guide's chapters start with what to press, and each was followed on the built app
- `a3edb9c3` Merge brief 15's first material area: the first set of audition briefs and class scenes, staging said as instructions
- `f998489a` Merge brief 15's money area: banking, cards, payments and statements in a checking account's words
- `82586d3f` Merge brief 15's money-data area: the banks' research data, round-ups, rents and the home accounts said plainly
- `e939dd5e` Merge brief 15's school area: classes, coursework, feedback, standing and productions in a teacher's and a player's words
- `72fe006d` Brief 15: two sentences moved by one area and still held by another's check, fixed after the merges
- `d64ffaef` Brief 15's cross-area review, first items: the US passport's fee in sentences, the Riel, and ING's checking account
- `183ef3a2` Merge brief 15's profile area: abilities, genres, the advice and the research's small print, read again and said plainly
- `84bd470d` Brief 15: a comment in the money looks takes the house's apostrophe, as looks.test holds every line there to
- `d788d433` Brief 15's glossary: each area's terms in their part's section, one row a term
- `9ae25748` Brief 15's cross-area review: the research's fetch reports in a reader's words, and the citations the inventory missed
- `245c0a7b` Brief 15's cross-area review, second items: what the areas left the coordinator in their defects, settled
- `e0e7831d` Brief 15: the two tests the whole suite found still holding words their areas changed
- `b23e954e` Brief 15's cross-area review, read across the areas: one control named one way, and the research's apostrophes
- `c4b4157b` Brief 15's cross-area review, on the integrated build: the advice's "off the whole a piece" said as English
- `c3478f9e` Brief 15's cross-area review, written down: how the ten areas were read together, and what that changed
- `688b5e20` Brief 15: the second pass closed, the ratchet lowered, and the scripts the final records are written by
- `a93a2385` STYLE.md says the second pass is closed, and what that asks of a change from here
- `e5fdacb7` Brief 15's final runs on c3478f9e: the interface tools read the new words, and the coursework warning fits its block
- `d6f6527a` Coursework's Shown Today forecast to a tenth again, so a day's work shows on it
- `03901f73` Brief 15's interface tools, written down: each first-run failure judged, seven matchers moved, two things the game fixed
- `61217011` The receipt says what each of the eight journeys presses, and names banking's known step
- `ce4e3b04` Brief 15's interface trials on record: the second trial's results, its scripts, and normal at 390 before and after the tenth
- `2ec167b0` Brief 15's final runs on d6f6527a, gathered: every number brief 14's, the interface passing, banking's known step
- `c92c6fed` Brief 15's final walk, in progress: the 1440 screens of ten of the fifteen saves so far
- `aabfc1b2` Brief 15's final walk and the guide followed on d6f6527a's build, and the handoff's new top section

## 9. The Manual Review Route

`PLAYTEST.md`, about twenty-five minutes. Every phrase and label it quotes was looked for (`playtest-check.py`): 23 on the built app, 5 in the code only, 0 nowhere.

## 10. Writing Guidance And Handoff

`docs/STYLE.md`’s "Speak like a finished game", written before any text changed, and its Pictures section, which now names the weather’s picture as the one exception. `docs/GLOSSARY.md`:

| Section | Terms |
|---|---|
| Core | 44 |
| In-World Material: Briefs, Readings And Class Scenes | 22 |
| School | 40 |
| Profile, Abilities, Genres And Advice | 31 |
| Money | 32 |
| Papers And Taxes | 34 |
| Health, Body And Time | 29 |
| Start, Home, Notices And Controls | 19 |
| The Guide And Help | 14 |

`SLATE_CURRENT_MASTER_HANDOFF.md` carries the pass’s state to the next session.

## 11. What Remains

- **Unreviewed:** 0 sources Pending in the second pass. **Blocked:** 0.
- **Left open, each with why, in `coordinator.md`:**
  - For the owner:
  - The engine-speak ratchet
  - For the owner, from money-data's defects (3, 7 to 10).
- **Defects left:** 8, each for the owner, in `DEFECTS.md`.
