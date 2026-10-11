# The Limitations Pass

**Brief:** "Complete and finish all limitations": the seven limitations §6 of
`docs/verification/ACCEPTANCE-PASS-2026-10-11.md` left. The 16 deferred items stayed deferred, as the earlier briefs
said. No removed system was restored, and parental leave wasn't added.

**Started from** `claude/acceptance-pass` at `98ae1e0b`. The work is on branch `claude/limitations`. It isn't merged
and isn't deployed. Schema 94 is unchanged.

**The engine source tested is tree `64d0ece5`, at commit `fdc31377`.** The lives, the scenarios, the balance grid and
the variety audit ran on it. The commit after it, `160e8f7d`, changes one screen (`PapersWorkspace.tsx`) and the tools;
the built app and the gate ran on that.

---

## 1. The Limitations, And What Became Of Each

| Limitation | Now | Held by |
|---|---|---|
| A first class's Rep and Cabaret parts weren't played. | Closed. In a third-year fall, a class's actors at the Rep's bar play in its company and in no School production, as the student's own class's do. Every class has a Cabaret show a term (§2). | `tests/journey-class-left-behind.test.ts` |
| Classes stopped when the student left the School. | Closed. After a dismissal or a withdrawal, the class the student was in is kept and followed to its degree, and so is a first class a year ahead. | Same; `tools/scenarios.ts withdraw` |
| State collection was researched for three states. | Closed for every state a life can owe: fifteen. | `tests/state-tax-states.test.ts` |
| A state never assessed a non-filer. | Closed. Each researched state sends its letters, assesses, and collects; the student's own return replaces the assessment. | Same; `tools/scenarios.ts nonfiler` |
| A refund paid only its own state. | Closed where agreements are published: New York's, California's and Connecticut's partners. | `tests/state-tax-states.test.ts` |
| The content was finite: 42 scenes, 26 plays, 27 exercises. | Enlarged, and still finite: 56 scenes, 30 plays, 27 exercises (§4). | `tests/scenes.test.ts`; `tools/variety.ts` |
| Older saves' credits kept the year they were written down. | Closed. They're dated once on opening by their terms' casting notices, and the résumé shows the year. | `tests/credits-dated.test.ts` |

The acceptance pass said an old save's résumé "may show one production a year late". That was wrong when it was
written: nothing read a credit's year, so the résumé never showed it. It shows it now.

---

## 2. The Classes

**The class left behind.** On a dismissal or a withdrawal, the class is copied as the student knew it, and the copy is
followed (`leaveClassBehind`):

- A term left partway plays on from the next class day not yet had. Its casts already made run to their ends, into
  the class's record.
- A student on a leave, or between classes after a repeat, left the class at their last term with it. It's followed
  from there.
- A degree, or a degree withheld, leaves no class behind: the class finishes with the student.

Measured on two seeds, the class left ends that spring within 0.002 of the class a student stayed with. Replaying the
term's class days put it about 0.8 ahead. The test fails if the days are replayed.

**The Cabaret.** A class's show (`cabaretCompany`, decider `school.cabaret_mates`):

- one a term, in a week drawn three weeks into the term, clear of a recess;
- each classmate free of their production's calls that week joins at 0.35, at most four. Both numbers are SLATE's
  estimate: the Bulletin publishes neither.
- A classmate in a show is called that week's evenings, not a cast's afternoons all term.

**Found on the way, and fixed:**

1. **A copied class grew past its ceilings until a reload.** A copy loses its ceiling binding; it's bound again now.
2. **A class played forward used its academic term's calendar, not its own.** A class a year behind got the year
   before's days and recesses.
3. **The Rep company's run was judged under its label,** "…: The Run Ends", not its name.
4. **A refused command merged records that share a name.** `restoreObject` matched every record with a name to the
   last live one with it:
   - after any refused command, two years' Carlotta productions became one object, and the earlier record was lost;
   - so would a classmate in both a School production and a Cabaret show.

   The n-th record with a key is now the n-th. `tests/restore-same-names.test.ts` fails on the old matching.

---

## 3. State Tax

**Researched:** twelve more states, `docs/research/world/research-state-tax-collection-2a.json`, `-2b.json` and
`-2c.json`: Arizona, Colorado, Georgia, Hawaii, Illinois, Louisiana, Massachusetts, North Carolina, New Mexico, Oregon,
Pennsylvania and Ohio.

- With Connecticut, New York and California, that's every state a city puts a life in that taxes income. A test holds
  it.
- New Jersey, Michigan and Utah have tax tables and no city. They stay unresearched, and a balance there would say so.
- Each number is the state's own; where none was found, SLATE's is said beside it.
- Some sources are weaker, each marked in the research files:
  - Massachusetts's pages were read from archived copies;
  - New Mexico's statutes were read on FindLaw;
  - Ohio's Attorney General fee came from search excerpts.

**What the rules can now say:**

- **Interest:**
  - simple by the day;
  - added to the principal each 1 January (Arizona);
  - raised after the first notice (Colorado, unless a plan was asked for; Oregon, whatever);
  - on penalties from a collection step (Ohio).
- **Late payment:**
  - by steps (Illinois, Hawaii);
  - by a dated rule (North Carolina's from July 2027).
- **Late filing:**
  - beside it, or held with it under a combined cap (Arizona, Georgia, Louisiana);
  - with a floor (Pennsylvania);
  - the greater of a share and an amount (Ohio).
- **Charges at a collection step:**
  - Colorado's 15%, Georgia's 20%;
  - Illinois's and Hawaii's fees;
  - Ohio's 10%.
- **Plans:**
  - a least a month (Georgia, Massachusetts);
  - a least owed (Hawaii);
  - a fee waived by income (Louisiana);
  - offered only by the Attorney General once collection reaches it (Ohio).

**A return never filed:**

- Each state's letters come at its days. When a state first acts is SLATE's year where it wasn't found.
- Then its assessment, with its late penalties and what a non-filer's assessment adds:
  - California's 25% demand penalty and $143 fee;
  - Arizona's and Oregon's 25%;
  - Connecticut's $50 floor;
  - Illinois's 2%, at least $250.
- Then collection.
- The student's own return replaces the assessment, its charges falling in proportion, as the IRS's reconsideration
  does here.
- The state's estimate is the return's own figure for it, with what was withheld credited. Connecticut's may leave the
  withholding out; SLATE's doesn't.
- Papers shows the assessment before the return is filed. Until the acceptance run found it, the balance and its Pay
  control were hidden.

**Refunds between states:**

- A refund pays a partner's past-due tax: one it has sent a notice for.
- **New York's partners:** California and Connecticut. Its others SLATE doesn't tax.
- **California's:** New York and Connecticut.
- **Connecticut's:** New York and California, read from its reciprocity law as the states that name it.
- No other state publishes partners, so none trades.

---

## 4. Material

**Fourteen scenes from public-domain plays**, each checked against its text, every reading supported or cut against for
a reason, and each with a full material profile.

Eleven classical:

- Hamlet and Gertrude;
- Brutus and Cassius;
- Portia and Brutus;
- Lear and Cordelia;
- Rosalind and Orlando;
- Helena and Hermia;
- Viola and Orsino;
- Faustus and Mephistopheles;
- the Duchess of Malfi and Antonio;
- Congreve's proviso scene;
- Kate Hardcastle and Marlow.

Three modern:

- Ghosts;
- The Master Builder;
- Riders to the Sea.

Lines are quoted only where the play's own words are certain. Translations are paraphrased.

**Four plays:** Ghosts and The Wild Duck for the thesis productions, Julius Caesar and A Midsummer Night's Dream for the
Shakespeare project. The 27 exercises stay as they are: practice is repetition by design.

**Corrected:** A Doll's House's profile described Nora and Krogstad's first act, not the scene it profiles.

**Variety, three seeds of two years:**

| | Before (42 scenes) | Now (56 scenes) |
|---|---|---|
| Distinct scenes in 46 set | 38 | 44 |
| Met again | 8, each asking something new | 2, each asking something new |

---

## 5. Older Saves

**Credits:** dated once on opening (`redateCredits`):

- Credits are matched in the order they were written to the terms' casting notices, by production and part.
- A Rep company part is matched by production alone, since its notice doesn't name the part.
- Each takes its term's year where that's no later than the year it had and within two.
- A save keeps its last 500 notifications. A credit with no notice left keeps its year, and the résumé says it's "as
  first written down".

**Tax:** old saves gain nothing they didn't have. A return already filed has no non-filer letters. A return past due
and unfiled gets a state's letters on opening, as it gets the IRS's.

---

## 6. Verification

**Gate:**

- On `fdc31377`: 161 files and 1,697 tests passed, with all sixteen checks.
- It found the merged records (§2, item 4) before passing. The final run is in the handoff.

**The 18 lives** (`node tools/verify.mjs lives`), on `fdc31377`:

- 15 graduated, and the 3 autopilot lives were dismissed, as before.
- 0 breaches, 0 unbalanced.

**Eight scenarios** (seed `sc-0`), all 0 breaches, 0 unbalanced. Recorded in
`docs/verification/SCENARIOS-LIMITS-2026-10-11.json`:

| Scenario | Outcome |
|---|---|
| `withdraw` | Withdrew 7 April 2027. The class of 2029 played to its sixth term and graduated: 13 productions, 3 of them Cabaret shows. 35 reloads. |
| `nonfiler` | Connecticut assessed the 2026 return, levied it, and took the student's own in its place. The IRS's substitute was replaced too. 31 reloads. |
| `leave`, `leave-year2`, `mandatory` | Graduated. The first class played to its degree. |
| `tax-plan`, `state-plan`, `switch-uk` | As in the acceptance pass. |

In `leave`, one payment fell inside the leave's terms, as in the acceptance pass: six hours of work-study done before
the leave began on 27 January, paid on the 29th. Hours worked are paid.

**Balance grid** (48 jobs): no target moved in any of its 336 rows. In five rows a strategy was ahead on coursework in
two seeds of three where it had been one, from the scenes dealt.

**Built app** (`tools/acceptance-ui.mjs`), on `160e8f7d`, with saves from the scenarios. Reports are in
`docs/verification/acceptance-ui/limits-2026-10-11/`.

| Width | Passed | Skipped | Errors | Overflows |
|---|---|---|---|---|
| 1440 | 23 | 1 | 0 | 0 |
| 390 | 24 | 1 | 0 | 0 |

- **New steps:** the class left said to go on; Connecticut's assessment and its rules in words.
- **Skipped:** a new student's rehearsal controls, with no part in week one. They're checked from a save.

**Mutation:** every rule this pass added was mutated; each mutation fails a test. Mutations that first survived led to
new tests:

- a term's casts not recast;
- a busy classmate kept out of the Cabaret;
- a state's letters taken off the calendar on filing;
- Pennsylvania's payment order;
- the order, the matching and the bounds of the credits' redating.

---

## 7. What This Doesn't Say

- **The content is still finite.** In two years a student meets 44 of 56 scenes.
- **Some rules are SLATE's estimates, said where they apply:**
  - a state's first letter to a non-filer;
  - payment orders and plan terms not published;
  - how many of a class take a Cabaret show.
- **Not modeled:**
  - liens;
  - Pennsylvania's extended plan;
  - Louisiana's down payment;
  - New Mexico's longer plans;
  - Oregon's 100% for three years unfiled;
  - Massachusetts's discretionary doubling.
- **A gap the brief didn't cover:** SLATE computes no income tax for Indiana, the District of Columbia or Oklahoma,
  which have a city each. Those states do tax income. It's the owner's to decide.
- **No bug-free claim:** a finite set of checks passing doesn't prove there are no bugs.
