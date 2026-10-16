# Brief 10: The Approved Acting, Advice, Banking And Stamina Decisions, 2026-10-16

The owner's "Implement The Approved Acting, Advice, Banking, And Stamina Decisions"
(`../briefs-2026-10-16/10-approved-acting-advice-banking-and-stamina-decisions.txt`, kept verbatim), worked on
`claude/peaceful-hamilton-59zdbb` from `main` at `44dcd973` (#36's merge). Every criterion was written and committed before
any change (`criteria.md`, `2e8e4db3`). Four areas worked it, each from instructions written before its work
(`prompts/`), each writing its checklist before its code and its result after (`../remaining-10/`):

- the judge, in two clones, its second phase after the others were integrated;
- the advice and the stamina, each in its own clone;
- Arion, in the shared tree.

Each clone's commits came onto the branch by cherry-pick or fast-forward. **The tested code is `9c40be73`'s.** It holds the
four areas and, at the owner's word later that day, the Mastered of a genre's row and of an ability's (section 8). It also
holds a fix the built app's acceptance run found on the way (section 8).

- **The gate passed on `d9b631ba`,** which differs from `9c40be73` in no file under `src`, `tools` or `tests`.
- **The build and the built app** ran on `9c40be73`.
- **The long runs and the advice's held-out set** ran on `57b64401`, whose engine is the same.
- **The criteria** were measured on `567d27dd` (`final/`), and no file they read differs.

The runs are in `../integration-2026-10-16/runs-10/`. Nothing is merged or deployed.

## Every Decision, And Its Status

The completion matrix (`../integration-2026-10-16/COMPLETION-MATRIX.md`, `tools/completion-matrix.mjs --check`, in the
gate) is the record; this is its summary.

| Decision | What it asked | Status |
|---|---|---|
| 1 | The acting criteria: replacements written and justified first, the originals kept, the intended play implemented | ST3-R, H4-R, L3-R and M1 met; **ST6-R** met on (b), (d), (f), not on (a), (c), (e), (g): **Decision Required**, with (b′) proposed |
| 2 | F2-A adopted, F2 kept; the proof broadened past 40 cases, tuning apart from held out | F2-A10 met on (a) to (e), (g), (i) on 120 fresh held-out cases, run again on the final code; **(f)** and **(h)** **Decision Required** |
| 3 | Arion's card fee: the timing researched, a labelled configurable assumption where unknown, the full lifecycle tested | Implemented And Verified as specified (AR0 to AR8); Arion's real timing **unverified**, labelled |
| 4 | Left completely unchanged | Unchanged: its twelve audit rows and three decision rows as brief 09 left them, held by the matrix's check |
| 5 | Stamina: running time, participation, intensity, breaks, recovery, condition and stamina | Implemented And Verified (W1 to W10) |
| Together | Validated on the integrated code; the gate, the build, the built app, the long runs; no criterion changed after | Every criterion of section 5 holds but one: **L1 regressed**, traced to decision 2's advice, **Decision Required** (section 5 below) |

**Completion, by the matrix:** **Completion, by the matrix:** 530 of 608 rows in scope Implemented And Verified (87.1%); 63 Implemented, Verification Incomplete, 0 Partially Implemented, 4 Not Implemented, 0 Blocked Externally, 11 Decision Required, 27 Explicitly Deferred.

## 1. The Acting Criteria

`criteria.md` section 1 compared ST3′, ST6′, H4′ and L3′ (brief 09's proposals), wrote ST3-R, ST6-R, H4-R and L3-R, and
justified each threshold before any tuning. The originals are kept as measured, each superseded by its replacement
(the matrix's ST3, ST6, H4 and L3 rows, Explicitly Deferred by the owner's decision 1, the G1 precedent). M1 (mastery at
100) holds throughout.

The judge's changes, each under `evaluation-11` (brief 10's ruleset, its ENGINE-MODEL row):

- **Phase 1.** Two public meetings read from public-domain texts (Sharp's *An Enemy of the People*, IV; Galsworthy's
  *Strife*, II.2), presence's own work, committed before they were measured. A tool defect fixed: the restrained
  specialist's budget was 645.6, against the even actor's 600 (`fill = (600 − n)/8` where nine abilities were left), so
  every ST6 figure until then compared unequal budgets.
- **Phase 2**, on the integrated code (`judge-2.md`):
  - The full drain went from 0.3 to 0.4, SLATE's choice set by testing on H4-R's 797 pieces, and `WORKLOAD.full` to 4/3
    of the anchor's, so no night short of it drains more.
  - A night's text is read by the part's time on stage (`PART_TEXT`), memory's second kind of work.
  - A night before a house reads stakes 1.5 (`NIGHT_STAKES`), composure's second kind. Four studies give the direction:
    Fredrikson & Gunnarsson 1992; Yoshie et al. 2009; Harmat & Theorell 2010; Latané & Harkins 1976. The size is
    SLATE's.

| Criterion | The original's last figure | Before (`44dcd973`) | Final (`167f996b`'s code, `integrated/after/`) |
|---|---|---|---|
| ST3-R (a) to (e) | ST3 178 of 189 | met | **met**; the largest part apart 0.0239, stamina's 0.0227; 6 of 6 mutations killed |
| ST6-R (a) | ST6 9 of 42 | 3 of 42 | **2 of 44, not met** (the deeper drain cost the restrained specialist The Way of the World's fourth scene) |
| ST6-R (b), (d), (f) | | met | **met**: 96 of 96; 41 of 44 behind; 24 of 50 |
| ST6-R (c), (e), (g) | | not met | **not met**: (c) abilities 0 against −0.0545, circumstances 9.1%; (e) 2 source works; (g) `st6-no-draws` survives |
| ST6-R (b′), proposed | | | 96 of 96, and killed when restraint's draws are removed (0 of 96): what (g) asks of (b) |
| H4-R (a) to (e) | H4 1 of 12 | not met: (a) 8 of 12, (b) 11 of 12, (d) 12 of 13 | **met**: 12 of 12 with five pieces of their own in two kinds; 12 of 12 ahead (stamina 37 of 37, median 0.807); 0 of 6,378 ahead on another's; energy after a night 94.275 at stamina 20, 96.15 at 80; 5 of 5 mutations |
| L3-R (a) to (e) | L3 65.5 → 64.3 | met | **met**: 24 pieces, 8 journeys, growth 1.253 to 3.266, 68 falls, every one stamina's; 363,432 monotonicity checks, no fall |
| M1 | | met | **met**: 4,560 briefs, 67 scenes, 30 nights, 30 castings, 13 coursework pieces, all at 100 |
| A1 | | met | broke at the stamina model's integration (0.32), **met** again: stamina's briefs 0.53, scenes 0.54 |

**ST6-R is the owner's.** The cause is measured: a whole reads every dimension a little, and a quarter of it is the
weakest. For the restrained specialist that's connection and responsiveness (listening, presence and adaptability at
40.56): one strength doesn't erase an unrelated weakness, which H4-R (c) asks. No correction was found with a source
behind it. The judge recommends (b′) in (b)'s place. As written, **ST6 holds on the final code at its floor to the case**
(restrained 11 of 44, 25%), superseded all the same.

## 2. The Advice

F2-A is the advice's measure and F2 as written stays in the record (68.9% on the final code, not met). The advice now
grows the hours as the engine does, reads the work at full precision, says everything at full, and works the days'
discipline once over every recent piece. F2-A10 was built first, its tuning seeds apart from 150 held-out cases (30 of
F2-A's and 120 fresh, four bands by three stages, genres across the 149).

The held-out set ran once on the advice area's final code. It ran once more on the integrated code, as its instructions
asked (`advice/final/`):

| Clause | Threshold | Final code |
|---|---|---|
| (b) | 80%; each band and stage 70% | 118 of 120 (98.3%); the least band 28 of 30, stage 39 of 40 |
| (c) | 95%; 1.5× random | 120 of 120; 1.965× |
| (d) | 0 | 0; everything at full said 30 of 30 |
| (e) | 80% | 118 of 120 |
| (g) | 100% | 519 of 519 |
| (i) | renamed the same | 120 of 120 |
| (f) | the ladder falls, every case; preparation read as prepared | 30 of 30 first-named; which preparation is the owner's (a genre's familiarity is read as known) |
| (h) | the trained input's gain falls, every case | 113 of 120; the 7 near mastery, each within a thousandth, where the days' discipline lifts the next hours |
| F2-A | | 40 of 40 |

## 3. Arion's Card Year

What a close owes is settled by statute: Iceland's Act 114/2021 on Payment Services, art. 57(4), read in the Official
Journal. A framework contract's regularly charged fees are owed pro rata to its end, and those paid ahead are refunded.
When in the year Arion charges, ahead or behind, isn't stated in its price list, its fee sheet or its terms. So it's a
**labelled, configurable simulation** (`ARION_CARD_YEAR`): paid ahead by default, its other value implemented and tested,
and the label shown on the panel, under Close It, in Other Charges and in the guide.

The lifecycle is played through the commands (`tests/decisions-arion.test.ts`, 16 tests):

- the first year's 950 kr, and nothing under 24;
- the renewal on the anniversary by Reykjavík's calendar;
- a close refunding the year's days left: on Wednesday 14 October 2026, 817 kr;
- a short account charged all the same;
- no duplicates;
- save and load;
- 29 February;
- an older save's year taken as paid ahead (`cardYears`, a one-time step on opening).

## 4. Stamina

A night's drain reads its workload (`content/workload.ts`, `systems/workload.ts`):

- the production's running time, from a cited production for 30 of the 30 plays;
- the part's share of it by its size;
- the body's and the voice's intensity;
- its breaks, which give back a share of the drain;
- the day at the curtain;
- stamina, which also spares up to half the evening's energy.

A call holds the running time and the curtain call. Calls a save had booked are timed once on opening (`timeTheCalls`).
W1 to W10 are met (`tests/decisions-stamina.test.ts`, 21 tests). Every coefficient is labelled SLATE's choice or sourced.
The two the judge's second phase moved were worked again by hand in the tests, each with a dated comment
(`../remaining-10/stamina-result.json`, laterChanged).

## 5. Together, And The Regression

Measured on the integrated code (`integrated/after/`, every exit 0) and again on the tested commit (`final/`, every
output it holds byte for byte the same), every criterion of section 5 that held still holds:

- the stage: ST1 (restrained 50, expansive 44 of 96), ST2, ST4, ST5, ST7, ST8, ST9, F1 and F2;
- I1 to I5;
- the attributes: A1 to A3, T2, T3, G3 to G5, M1, M3, O1, O2, H2, H5 and H7;
- L2;
- S1 to S4 on all four samples, and G2;
- the genre audit's isolation, 149 of 149 and 0;
- W1 to W10 and AR1 to AR8 (their tests).

**L1 doesn't.** The week's top recommendation over a 120-day journey runs at most 4 weeks on one input unless that input
rises 5 points. Brief 09 read 4 weeks for the specialist and 3 for the beginner. The final code reads 8 (focus, 51 to 55)
and 6 (focus, 55 to 56).

Traced (`l1/README.md`):

- The judge's first phase alone read 4 and 3.
- `84db36b7`, the advice on the branch without the judge's or the stamina's work, reads 8 and 6.
- The journeys' student never trains the named input, so focus rises only through the work, and the advice keeps naming
  the input F2-A10 finds brings the most.

No fix moves L1 back without naming a worse input, which F2-A10 (b) fails, so it's put to the owner with a
recommendation: read L1 on a journey that follows the advice, as F2-A10 (h) does. Until decided it's counted not met.

## 6. Final Verification

| Check | Command | Result |
|---|---|---|
| The gate | `npm run gate`, its exit read from a file | **exit 0 on `d9b631ba`**: 375 files, 4,479 tests, none skipped; typecheck, lint and all eighteen checks, the completion matrix last (and on `fdf4bf1d` before the ability's Mastered: 374 files, 4,477 tests) |
| The build | `npm run build` | exit 0 |
| Scenario saves | `node tools/scenario-saves.mjs <dir>` | 14 of 14 exit 0, each breaches 0, unbalanced 0 |
| The built app, 1440 | `node tools/acceptance-ui.mjs <out> 1440 <saves>` on the build | 72 passed, 0 failed, 0 skipped, 0 errors, 0 overflows |
| The built app, 390 | the same at 390 | 72 passed, 0 failed, 0 skipped, 0 errors, 0 overflows |
| Lives to graduation | `npx vite-node tools/lives.ts -- --why`, 24 lives, 3.2 years | 20 graduated, the 4 dismissed the autopilot control's (Reykjavík); breaches, unbalanced and errors 0 |
| Workload | `npx vite-node tools/workload.ts`, eight lives, 1.4 years | the seven attentive in good standing; the neglected control dismissed; breaches 0 |
| Mastery through play (MA5) | `npx vite-node tools/mastery.ts -- --mode plan`, six plans, 8 years | 6 of 6 at 100 on every payoff tape; slapstick m-0 three days later than brief 09's |
| F2-A, and F2-A10 held out | `npx vite-node tools/advice.ts` | 40 of 40; F2-A10 as section 2 says, the same on `2634283b` and `57b64401` |
| Variety, three years | `npx vite-node tools/variety.ts -- --seed v-0 --years 3` | graduated, breaches 0; 8 distinct top recommendations over 157 weeks (10 on brief 09's), the longest unresolved 2 weeks; the same practice situation 3 in a row at most |
| Freshness | `npx vite-node tools/freshness.ts -- --months 4 --seeds fr-0,fr-1` | no take or scene repeated outside the mastered profile |
| The criteria, together | `measure.sh`, every part, on `167f996b` and again on `567d27dd` | every one that held holds but L1 (section 5); the two measurements byte for byte the same |

`../integration-2026-10-16/runs-10/` keeps every run's output with its command; `integrated/after/` and `final/` the
criteria's; `advice/final/` the advice's.

**Persistence, migration, repeats and interruptions,** each held by tests the gate runs:

- **Persistence.** A save and a load are played through in each area's tests: Arion's year and a close's refund, a
  night's timed call, a brief marked mastered.
- **Migration.** Three one-time steps on opening, each tested on an older build's save and on a second opening that
  changes nothing: `cardYears`, `timeTheCalls`, `briefsMastered`. The save schema stays 94 in the engine and the guard.
- **Repeats.** A card year charged once; a second close refused; a later take at full mastery leaving the brief's mark
  where it was.
- **Interruptions.** A save from before a rule opens under it once (the steps above); a container restart would have
  cost one recorded step of the runs, and none came.

## 7. For The Owner

None of these is counted met, and none was changed without the owner's word:

1. **ST6-R (a), (c), (e) and (g).** The judge recommends adopting (b′) in (b)'s place; (a) is 2 of 44.
2. **F2-A10 (f)**, which preparation a take is read as having, and **(h)**, a rise under a thousandth near mastery.
3. **L1**, regressed with the advice (section 5).
4. **Arion's real timing**, which no source found states. The simulation is labelled and configurable.
5. **The stamina area's A1 question** (a night read at a supporting part or a lead) no longer decides A1, which is met;
   it stays the owner's to change.
6. **The four originals' area rows.**
   - The judge area recorded ST3, H4 and L3 as written as Not Implemented, counted against completion, beside the
     criterion rows the owner's decision made Explicitly Deferred.
   - ST6 as written, which now holds at its floor, is Explicitly Deferred in both places.
   - Whether the other three should be too is the owner's.

Decision 4 is unchanged, its twelve rows Unresolved in the audit and Implemented, Verification Incomplete in the
matrix, its three decision rows Decision Required.

## 8. Outside The Brief: A Genre's And An Ability's Mastered

Asked for by the owner on 2026-10-16, after seeing a mastered career's screens: until then a genre's row on the Player
Profile said nothing of mastery. A genre is marked **Mastered** once one of its briefs is taped at full mastery, the
guarantee's own test (`Evaluation.mastery`), kept on the brief's record past the takes (`BriefRecord.mastered`), read by
`genreMastered`, and drawn as a chip whose title names the brief and the day. A save from before is marked once on
opening from its work record (`briefsMastered`, the sixth one-time step). `tests/genre-mastered.test.ts` plays it
through the commands; seven mutations in a copy each fail it (`567d27dd`).

It touched two engine files the measurements read (`systems/briefs.ts`, `index.ts`), so every measurement was made again
on `567d27dd`. The criteria's outputs came out byte for byte as on `167f996b`, and so did the workload runs and the
mastery plans.

**An ability's Mastered**, asked for next. An ability's row says Mastered at its full, by the game's own rule (`atFull`),
as the Techniques panel marks a technique at 90. Reaching full by practice sets an ability exactly, so the mark comes with
the session that reaches it. Stamina's mark goes when its fitness falls. `tests/ability-mastered.test.ts` plays it
through `practice.exercise`, and four mutations in a copy each fail it (`9c40be73`). It changed a screen and no engine
file, so the build, the built app and the gate ran again.

**Found on the way: Table Work's select.** The built app's acceptance run on `567d27dd` failed one step of 72. Its new
life's first open work was a play not yet read, and Table Work's select took an answer that `school.choose` then refused
("Read it first: table work is done on a text you know."), said only in a toast after the choice. Every earlier run's
life had read its text first. It was there before brief 10, not the Mastered's doing. The fix (`57b64401`) puts it in one
rule (`tableWorkRefusal`), read by the command and the select. The select is grayed, with the reason under its heading.
`tests/table-work-unread.test.ts` plays it, and three mutations in a copy each fail it. The acceptance step answers a
select that's open, and reads the text first where none is. The runs were made once more on `57b64401`.
