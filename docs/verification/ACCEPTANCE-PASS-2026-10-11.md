# The Player-Facing Acceptance Pass

**Brief:** "Complete SLATE's Player-Facing Acceptance Pass".

**Started from** `main` at `6568dda1`, the commit the brief reviewed. Nothing newer had landed. The work is on branch
`claude/acceptance-pass`.

**The engine source tested is tree `6fd98a13`, at commit `804bde39`.** Every result below is on it unless it says
otherwise:

- the 18 lives;
- the six scenarios;
- the 48-job balance grid;
- the variety audit;
- the built app at 1440 and 390 wide.

The commits after `804bde39` change only documents and tools, so no result below is invalidated.

---

## 1. Acceptance Journeys And Outcomes

| Journey | How | Outcome |
|---|---|---|
| A second-year leave, and the return into the later class | `tests/journey-second-year-return.test.ts`: year one by the attentive policy, the rest by the player's commands; saved and reopened at each transition | Passed. It found a bug: a credit dated a year late (§3). |
| The same student through to the degree | `tools/scenarios.ts leave-year2`, seed `sc-0` | Conferred. The first class graduated. Nothing paid during the leave. Credits by their own years. 49 reloads, 0 breaches, 0 unbalanced. |
| The year away, a day at a time and at once | Same test | Identical state |
| The built app, a new life through its controls | `tools/acceptance-ui.mjs` at 1440 and 390 | 1440: 21 passed, 1 skipped. 390: 22 passed, 1 skipped. 0 page or console errors, 0 failed requests, 0 screens past the right edge. Reports in `docs/verification/acceptance-ui/`. |
| A director's notes | `tests/journey-school-production.test.ts` | Notes worked are acknowledged and never come back as "Still:"; notes not worked do. |
| Federal and state tax together | `tests/state-tax.test.ts`; scenarios `tax-plan` and `state-plan`; the app, from a save | The IRS plan covers federal tax only. A refund is paid once. Charges start at the due date. The budget's reservation equals the screens' total, which it didn't (§3). |
| Older saves | `tests/save-migration.test.ts`, two saves written at `ff837dfa` | Divided once, to the cent. The estimate is named. Pending events go on. |
| The 18 lives | `node tools/verify.mjs lives` | 15 graduated, the 3 autopilot lives dismissed as before; 0 breaches, 0 unbalanced |
| Five more scenarios | `tools/scenarios.ts`: leave, mandatory leave, UK switch, `tax-plan`, `state-plan` | All 0 breaches, 0 unbalanced |

### The second-year return, in detail

The test checks each of these:

1. **Refusals:** a professional reason, and a medical leave with nothing to recommend it.
2. **The leave:** granted for the second year from the July request, and begun at its term with no classes and no
   student cover.
3. **One request at a time:** a second request is refused, and so is registration while away.
4. **Notice of return:** accepted once.
5. **Nothing for the year away:** no work-study pay, scholarship, enrollment, course record, evaluation, new credit
   or casting.
6. **The first class went on:** its own productions, its own cast.
7. **The class of 2030** brings its spring Carlotta production.
8. **Registration** is done once by command, and Yale Health cover returns.
9. **Old work** keeps its partners by name and its results.
10. **New work** is set with the class joined.
11. **Classes count again.**

### The built app

**On a new life,** the tool drove these through the visible controls:

- creation, with Continue held until each step validates and the birthplace asked for;
- the Guide's 17 chapters, read until nothing is locked;
- Home's decisions;
- Advance, through each commitment on the way;
- Look After Yourself;
- orientation and registration;
- coursework: a step greyed with its reason shown, a partner's request answered, then the step done; a way of playing
  chosen; table work answered;
- the School tab kept across screens;
- practice, with its explanation in its row;
- the development history;
- a transfer refused in the engine's words, then made;
- Papers' five tabs;
- Save & Exit and Continue, back to the same moment.

**From scenario saves:**

- a part paid to Connecticut DRS, and its plan asked for;
- the IRS plan's federal-only cover;
- Your Classes and the evaluations;
- the rehearsal controls.

**On a phone:** the navigation drawer.

**Skipped:** a new student's rehearsal controls, since there's no part in week one. They are checked from the later
save.

---

## 2. Variety, From The Player's Side

| Check | Result |
|---|---|
| Following a director's note changes the later response | Tested. A note worked is acknowledged; one not worked comes back as "Still:". |
| Recommendations stop prescribing resolved weaknesses | Tested (`tests/material.test.ts`). The audit found none made at full, and none stuck. |
| Returning material changes the task where the game says so | Tested (`tests/feedback.test.ts`). A new reading is required, and the same reading is marked down. |
| Partner and cohort history stay consistent | Tested and played: old work keeps its partners by name, new work uses the class joined. |
| Practice feedback explains gains, plateaus, fatigue and alternatives | Gains, a tier moved up, a long run and its slowing (with what a variation hour would carry to), a repeat the same day, a tired day. The last two were added in this pass. |
| Mastery needs no pointless grinding | Only Stamina decays, by researched detraining. Abilities and techniques don't. At full, practice gains nothing and says so. |
| Ordinary routines recur without pretending to be new | The audit counts situations, not text: the same practice situation at most 3 in a row. The pool is finite and is said to be (`docs/ENGINE-MODEL.md` §7). |

The variety audit on the final source, seeds v-0, v-1 and v-2, two years each:

- no scene twice in a row, and 8 of 8 scenes met again ask something new;
- no partner twice in a row;
- a recommendation ignored at most one week, never stuck, never made for a target at full;
- feedback never the same twice in a row;
- no note repeated on something just taken without a word;
- 0 breaches, 0 unbalanced.

---

## 3. Bugs Found, Fixes And Regression Tests

1. **A credit was dated a year late.**
   - **Found:** a played run's spring 2027 Carlotta lead was credited in 2028, when the student came back from leave.
     A casting's credit was written at the next casting and dated the year it was written.
   - **Fix:** a credit takes its own production term's year, and a leave credits what was played and closes the
     castings as it begins.
   - **Test:** `tests/journey-second-year-return.test.ts`.
2. **A greyed control's reason was only in its tooltip.**
   - **Found:** a phone never shows the reason, so a row of greyed buttons said nothing. On the first Monday every
     preparation step was greyed because a partner's request had to be answered first, and the reason was invisible.
   - **Fix:** `WhyNot` shows the reasons under a row. It's used for preparation, the rehearsal controls, a class
     moment's choices and another way at a note. A reason is also shown beside orientation's catch-up, a partner's yes,
     making amends, therapy, an extra supply, a lost document, and asking for a leave.
   - **Test:** `tools/acceptance-ui.mjs` fails if greyed preparation shows no reason on the screen.
3. **The budget set aside less tax than the screens showed.**
   - **Found:** the budget summed each balance as last stored, while Home and Papers showed it with today's interest
     and penalty.
   - **Fix:** it reads `owedEverywhere` at the current moment.
   - **Test:** `tests/state-tax.test.ts`.
4. **Practice feedback didn't say why an hour gave less.**
   - **Found:** a repeat the same day and a tired day gave less, unexplained.
   - **Fix:** both are now said, from the numbers that made the hour smaller.
   - **Test:** `tests/variety.test.ts`.
5. **The coverage matrix's count was stale.** It said the guide had sixteen chapters; it has seventeen.

These were checked and are by design, not defects:

- A new life's controls are locked until the Guide's chapters are read. The top bar says Locked, and the Guide opens
  on its own.
- Creation asks for a birthplace and lists what's still needed above Continue.
- Advance stops at each commitment and asks whether to go.

---

## 4. Desktop And Mobile

The built app was checked at 1440 and 390 wide:

- 0 page or console errors;
- 0 failed requests;
- nothing past the right edge on any screen visited;
- the phone's drawer opens, and Home is reachable from it.

The visual style, Title Case, the sidebar and Home are unchanged. The only visual addition is the small dim line of
reasons under a greyed row.

---

## 5. Save Compatibility

- **Schema:** 94, unchanged.
- **Tax:** a save written before federal and state tax were kept apart is divided once, when it's opened:
  - to the cent;
  - the estimate is named on the return;
  - the IRS plan is reduced to federal tax, and its history says so;
  - Connecticut's own notices begin;
  - the plan's pending payment still fires.
- **Leave:** a save written before first classes had productions plays the later ones once each.
- **Credits:** a credit already written keeps the year it was given. Only credits written from now take their
  production's year.

---

## 6. Remaining Limitations, And What The Player Meets

> **Since then:** the limitations pass of 2026-10-11 closed the first five rows and the seventh, and enlarged the content of the sixth, which is still finite (`docs/verification/LIMITATIONS-PASS-2026-10-11.md`). The seventh row's player-facing claim was wrong when it was written: nothing read a credit's year, so the résumé never showed it.

| Limitation | What the player meets |
|---|---|
| A first class's Rep and Cabaret parts aren't played. | Your Classes lists its School productions only. |
| A first class is followed only while the student is at the School. | After a dismissal, withdrawal or degree, the first class stays where it was. |
| State tax rules are researched for Connecticut, New York (with NYC) and California only. | Another state's balance is kept with no penalty, interest, notice or plan, and its panel says so. In play a student lives in Connecticut. |
| A state doesn't assess a non-filer's tax on its own. | A student who never files owes the IRS's substitute assessment only, until they file. |
| Cross-state offsets aren't modeled. | A refund from one state doesn't pay another state's balance. |
| The content is finite: 42 scenes, 26 plays, 27 exercises. | In about two years a student meets most scenes. A scene that comes back asks something new of it. |
| Credits written before this pass keep the year they were given. | An old save's résumé may show one production a year late. |
| The 16 deferred items stay deferred. Removed systems weren't restored, and parental leave wasn't added. | n/a |

---

## 7. Readiness

**Ready, with the limits in §6 stated.** The school-focused experience is coherent and dependable from creation
through graduation, by the evidence above:

- **The journeys:** creation to graduation, a leave in either year and its return, coursework, practice,
  productions, banking, and federal and state tax all play through the player's own commands and controls.
- **The integrity runs:** they hold without breaches or unbalanced ledgers over many reloads.
- **The older saves:** they open and go on.

**What this doesn't say:**

- It doesn't say the game is complete. The pool of material is finite.
- Some rules are SLATE's estimates, and they're said where they apply.
- A finite checklist passing doesn't prove there are no bugs.
