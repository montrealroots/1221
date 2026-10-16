# The Integration And Acceptance Pass, 2026-10-16

The owner's brief "Implement SLATE’s Complete Integration And Acceptance Pass"
(`../briefs-2026-10-16/08-complete-integration-and-acceptance-pass.txt`), worked on `claude/peaceful-hamilton-59zdbb` from
`main` at `ef784ccd` (#34's merge). This file was written before any result changed. It records the baseline as it was
measured on that day, the criteria this pass is judged by, and the order the work goes in. The work plan's section 11 is
its checklist.

## The Baseline, Measured On `ef784ccd`

| Check | Command | Result |
|---|---|---|
| The gate | `npm run gate`, its exit read from a file | exit 0; 348 files, 4,192 tests; typecheck, lint and all seventeen checks |
| Coverage | `node tools/coverage.mjs --check` (in the gate) | 328 rows: 285 verified, 2 partial, 14 unresolved, 16 deferred, 3 legacy, 8 informational |
| Capabilities | `node tools/capabilities.mjs --check` (in the gate) | 64: Partial 11, Implemented 31, Verified 3, Retired 19; 156 commands |
| The stage | `npx vite-node tools/interpretation.ts -- --fresh --stage --out <file>` | ST1, ST2, ST5, ST7, ST8, F1 and F2 hold. **ST3** the even actor 159 of 171; **ST4** drama 25 restrained, 0 expansive; **ST6** the restrained specialist 7 of 34 (20.6%) |
| The attributes | `npx vite-node tools/ag-baseline.ts -- --out <file>` | **H4 1 of 12** at 60% or more (emotional depth 86.1%; listening 56.1%, focus 57.2% next; stamina 5.8%, presence 10.3%, discipline 13.2% last). Phase 2b had 3 of 12: the registers, suitability and the stage moved it since. **F2 as written** 303 of 447 (67.8%), under 80% |
| L3 | `npx vite-node tools/brief-journeys.ts -- --profile <p> --seed bj-0 --days 120 --write <file>` | specialist: first month 65.5 (2 takes), last 64.0 (14): **fails**. Beginner 54.0 → 56.9: meets |

`baseline/` keeps each output as it was written.

## What This Pass Is Judged By

Each criterion below is written before the change it judges. A threshold isn't moved to meet a result, a hard case isn't
dropped, and a failure isn't relabeled. Where a criterion turns out contradictory, the contradiction is explained, a
corrected criterion is proposed, and the original is reported as it measured.

### The Criteria Already Written, Measured Again On The Final Code

- **The attributes** (`../attributes-genres-2026-10-16/acceptance-criteria.md`): A1 to A5, T1 to T3, G2 to G5, M1 to M3,
  O1 to O3, F1 to F3, H1 to H7, L1 to L3. G1 stands replaced by the genre signature (work plan section 5); F2 as written
  is reported beside F2-A (`../advice-2026-10-16/criteria.md`), and isn't counted met while it measures under 80%.
- **Interpretation** I1 to I5 (`../interpretation-2026-10-16/criteria.md`).
- **The genre signature** S1 to S4, S3 on every sample (`../genres-2026-10-16/g1-replacement.md`).
- **The stage** ST1 to ST9, F1 and F2 (`../stage-2026-10-16/criteria.md`).

### Added By This Pass

- **ST3-P, the boundary a result is rounded at.** A result kept to a tenth is rounded once, at the end, from parts kept
  at full precision. The parts (a dimension, a segment) are shown rounded, and nothing reads a rounded part to work out
  a whole. Measured on random inputs: the kept whole equals the exact whole rounded once, in every case. ST3's even-actor
  clause is then measured at full precision and as shown, and each difference is put down to its cause.
- **ST4's material.** Drama scenes added to the catalog are public-domain texts, cited by edition, or original exercises.
  Each scene's circumstances are read from its own text and committed before it's measured, as `fe0cca8d` did. The 25
  drama scenes already in the catalog keep their signals.
- **L3's trace.** Each take of the specialist's journey, with its brief, its purpose, its difficulty, its preparation,
  its readiness and the actor's levels, and the same brief judged at the first month's levels and at the last's. The
  decline is put down to its causes before anything changes.
- **Mastery through play** (the brief's section 4), each through the game's commands on twin saves:
  - **MA1.** An ability a piece reads, raised by practice, never lowers the take of the same piece, prepared and played
    the same.
  - **MA2.** An ability it doesn't read, raised the same way, leaves the take as it was.
  - **MA3.** No dimension, segment or whole leaves 0 to 100, on every judged piece the catalog has.
  - **MA4.** An ability read twice by one dimension (the task's and the material's) is counted once, at its summed weight.
  - **MA5.** A played mastery plan reaches 100 on every payoff tape, through the commands.
  - **MA6.** At mastery no draw moves a result off 100.
  - **MA7.** Each shortfall a take has (preparation, a choice that doesn't fit, the day's condition) is named in words.
  - **MA8.** Mastery in the work doesn't stand in for what else the school asks: a mastered student who misses pieces is
    Unready on them, and the term's review counts them.
- **The missed-work term** (the brief's section 6). One term played through the commands and the clock in which pieces
  are missed unexcused and a revision is missed, and later pieces are shown. The warning, Shown Today, the notices and
  the faculty's review count them alike (`termTally`), each comes once, and a reload changes none of it.
- **Every skipped check accounted for.** Every skipped test in the suite, and the built app's two steps skipped since
  2026-10-12: enabled where the state they need can be reached, or the reason said and what it leaves unverified.
- **The six remaining areas.** Each area writes `../remaining/<key>-checklist.json` before any of its code changes, from
  its own brief (`prompts/`, which carry `../prompts-2026-10-16/` to this baseline and add what the owner's brief asks of
  that area), and `<key>-result.json` after.
- **The completion matrix** (`COMPLETION-MATRIX.md`, from `tools/completion-matrix.mjs`): every exposed command, the
  creation selections, the six areas' items, every criterion above, and the integration rows, each with its goal and
  entry, preconditions, state read, decisions, validation and costs, changes and scheduled consequences, the systems it
  reaches, what the player sees, save and load, failure and recovery, where it's implemented, its evidence, and its
  status. `--check` fails a row whose evidence it can't find.

## The Order

1. The areas that don't read the judge (health, banking, papers and tax) are worked alongside the judge's own work, each
   in its own files. School is worked with them; its tests derive any judged figure from the played record.
2. The judge: ST3's rounding, ST4's material, ST6 and H4, L3, then every criterion above measured again.
3. The missed-work term, the skipped steps, and the integration rows.
4. Coverage: the evidence classes and totals, and the audit regenerated.
5. The final gate, the build, the built app at 1440 and 390 from scenario saves written again, and the long runs on the
   final code. The handoff.

## What The Pass Did, And What It Measured (Written After)

Everything above was written before a result changed. This section was written at the pass's end, on the final code
(``f68516b0`, the gate’s; what came after it is documents`), from what the tree and the runs say. Each figure is a measurement, and its file is named.

### The Judge (`st3.md`, `st6.md`, `h4.md`, `l3.md`, `closeout/`)

| Criterion | Before (`ef784ccd`) | After (the final engine) | Counted |
|---|---|---|---|
| ST3-P: a result rounded once | a dimension rounded, then the whole worked from rounded parts | evaluation-9: the whole from exact parts, rounded once; 600 drawn performers and 300 segmented pieces worked by hand (`tests/rounding-once.test.ts`) | **Met** |
| ST3, the even actor the same on stage and close | 159 of 171 | 157 of 171 as shown; every exact difference under 0.021, the even actor's stamina drain on the execution the stage weighs | **Not met**; contradictory as written, ST3′ proposed |
| ST4, drama suits both sides | 25 restrained, 0 expansive | 25 and 4: four public-domain scenes of public conflict (`content/scenes-public.ts`), read from their texts before measurement | **Met** |
| ST6, the restrained specialist against the grain | 7 of 34 | 8 of 38 (21.1%) | **Not met** |
| H4, specialists on their work | 1 of 12 | 2 of 12 | **Not met**; H4′ proposed |
| L3, a learning student's term | specialist 65.5 → 64.0 | 65.5 → 64.1; every take 3.0 to 4.2 higher at the end's levels | **Not met as written**; L3′ proposed |
| F2 as written | 67.8% | 67.6% | **Not met**; superseded for advice by F2-A |
| Every other attribute, interpretation, signature and stage criterion | met | met (`closeout/README.md`) | Met |

Restraint draws composure and focus beside emotional depth from evaluation-9 (Stanislavski, *An Actor's Work*, tr.
Benedetti, 2008, pp. 536–542). It was sourced, mutation-tested, and moved no ST6 case: the draw was never the cause.

### Mastery Through Play

| | Evidence | Result |
|---|---|---|
| MA1, MA2, MA3, MA4, MA7 | `tests/integration-mastery.test.ts`, through `practice.exercise` and the brief commands | met |
| MA5 | six played mastery plans on the final code (`runs/plan-*.json`) | every payoff tape 100, on all six; 0 breaches |
| MA6 | `tests/engine-properties.test.ts` | met |
| MA8 | `tests/integration-mastery.test.ts`: a mastered student who sleeps through two pieces is Unready on both, and the review counts exactly two; the twin missing nothing, none | met; killed by the tally leaving pieces not shown out |

| Plan | First Tape | Graduated | Mastered | Payoff Tapes | Before (`journeys-2026-10-16`) |
|---|---|---|---|---|---|
| Nordic noir, m-0 | 57.5 | 2029-05-21 | 2029-11-18 | 100, 100, 100 | 57.6, 2029-12-11 |
| Nordic noir, m-1 | 58.2 | 2029-05-21 | 2029-12-01 | 100, 100, 100 | 58.2, 2029-12-18 |
| Social realism, m-0 | 60.2 | 2029-05-21 | 2029-11-18 | 100, 100, 100 | 60.2, 2029-12-11 |
| Social realism, m-1 | 59.8 | 2029-05-21 | 2029-12-01 | 100, 100, 100 | 59.9, 2029-12-18 |
| Musical, m-0 | 56.4 | 2029-05-21 | 2030-10-11 | 100, 100, 100 | 56.4, 2030-11-01 |
| Slapstick, m-0 | 58.1 | 2029-05-21 | 2030-12-28 | 100, 100, 100 | 58.7, 2031-01-15 |

### F2-A On The Final Code (`runs/advice-cases.json`)

40 of 40 (designed 10 of 10, held out 30 of 30), against 80%. The advice's first was the exact best in 39 (38 before);
forecast against realized over 529 candidates correlate at 0.894, each realized gain about 0.22 above its forecast; a
near-tie said in 7; the advice's first was the take's chief limit in 9.

### The Six Areas (`../remaining/`)

Each wrote its checklist before its first change and its result after; each mutation was applied alone and restored.

| Area | Items | Dispositions | Mutations Killed |
|---|---|---|---|
| Health, eligibility | 7 | fixed 6, implemented 1 | 18 of 18 |
| Health, billing | 3 | fixed 1, implemented 1, verified 1 | 7 of 8 |
| Banking (with the brief's section 7) | 16 | fixed 7, verified as it stands 7, older-save compatibility 1, owner's decision 1 | 29 of 31 |
| School (with section 6) | 10 | fixed 4, verified as it stands 3, guard kept and tested 2, control corrected 1 | 21 of 22 |
| Tax and papers (with section 8) | 18 | verified as it stands 11, fixed 4, control corrected 2, guard kept and tested 1 | 19 of 20 |
| Coverage | 11 | implemented 6, defects found and fixed 4, reported 1 (the overdraft panel, fixed outside the area in `d31f0a94`) | every one, in copies |

Each surviving mutation is recorded in its result with why it survived (redundant code, removed or kept as a guard).

**Coverage, by how each row is evidenced** (`../../GAMEPLAY-COVERAGE.md`, counted by `tools/coverage.mjs`): 330 rows, two added by this pass for the health area's new commands.

| Class | Rows | Verified | Partial | Unresolved |
|---|---|---|---|---|
| Player Journey | 289 | 287 | 2 | 0 |
| Retained Engine, On Labelled Fixtures | 13 | 0 | 0 | 13 |
| Documentation And Static Checks | 1 | 1 | 0 | 0 |
| Deferred Scope | 16 | | | |
| Older Saves Only | 3 | | | |
| Said Back, Deciding Nothing | 8 | | | |

Verified 288 of the 303 that can be verified (95%), against 285 of 301 at the baseline. What moved: `i-stale-claims`,
verified on the `static` standard the page now defines; `health.apply` added, verified; `health.request_hardship` added,
partial (its renewal branch is played by no test); and `bank.savings_notice`, counted unreachable until found reachable
through this pass's home-country accounts, played (`tests/integration-savings-notice.test.ts`) and verified. The 13
unresolved rows each say, in four parts, what a Yale player meets, what the fixtures test, whether the owner defers it,
and what's unfinished.

### Found Outside The Areas, And Fixed

- **The checkpoint's two mutants** (`64e3f82d`, taken while two areas each had a mutation applied): restored in
  `8538912a`. Nothing else was snapshotted mid-run after it.
- **The IRS's substitute return on a load** (`35e36a6b`): armed where only Connecticut was owed, so a reloaded student was
  told the IRS figured her return at $0.00. Found by the school area's twins.
- **A medical debt the bank can't pay** (`a55a2f0e`): refused with no next step; it says what the account holds and
  names Move Money.
- **Tests the areas' changes left behind** (`7b9e865f`, `b822ec60`): the Evaluations table's new column, a straight
  apostrophe, the guide's chapter table.
- **The matrix's citation check** (`d1452195`): it read `describe > it` titles as missing. Its commit message said 38
  failed; measured on the tree before it, 29 did (25 path-cited, 4 naming no test), corrected in `ed7c2640`.
- **A savings account's close named the wrong account** (`ed685515`): the Bank screen said a Flexgeld at Deutsche Bank
  moved to Chase Total Checking; it goes to the AktivKonto, as the bank's notice says. Found by the coverage area's played
  test.
- **Borrowing at a bank kept from home** (`d31f0a94`): the panels offered an overdraft and a loan the commands refused, in
  HSBC's words for a customer abroad; the offers ask it first now, and the panels say it in place of the controls.
- **Two commands in no capability and no audit row** (`43279163`): `health.apply` and `health.request_hardship` failed the
  gate's capabilities check; each has a row, added through a pipeline route that didn't exist before.
- **The built app's two skipped steps** (`ae9c4abf`): the workbook's ways wait on the lines, which waiting mornings never
  learn; the casting step looked for controls a first-year can't have.

### Found And Left, With Why

- **A home bank's close re-settles its fees on each daily retry** (`systems/abroad.ts`, `homeCloses`): unreachable, since
  no home bank with quarterly fees closes an account. Recorded by the banking area.
- **A life starved past BMI 12 ends**, by design (`tests/body.test.ts`, `tests/evidence-g04-life.test.ts`). A tax probe
  reached it by emptying the bank every month for a year and a half; a player is told "No Money For Food Today" each
  day first.
- **A Connecticut citizen ID card's term and its mailing**: the tax area's sources weren't conclusive; unchanged.
- **Passport fees abroad marked estimated** (`content/passportsabroad.ts`): assumptions, not verified figures.
- **The 13 unresolved rows** stay unresolved: whether the nine bank rows stay so or move to Deferred is the owner's
  decision already open (`../CURRENT-SCOPE-2026-10-15.md`, The Owner's Decisions, 2).
- **`health.request_hardship`'s renewal branch**, a member's renewal notice answered by a hardship: played by no test, and
  its row says partial.
- **Nine commands traced outside the audit** (`brief.choose`, `brief.prepare`, `brief.reader`, `school.choose_playing`,
  `school.choose_part_playing`, `work.identify`, `work.try`, `work.settle`, and `life.look_after`, which the audit keys by
  its actions): each is in `../connected-journey/TRACE.md` or `../../TRACEABILITY.md` and a capability, played by gate
  tests, and stands in the matrix as Implemented, as its capability's limits say. None has an audit row; adding them
  through `../pipeline/inputs/added-rows.json`, each read against the page's standard, is the next coverage work.
- **`tools/completion-matrix.mjs --check` isn't in the gate.** Adding it would change the gate the owner's CLAUDE.md
  describes; it's run by hand here, and holds.

### Every Skipped Check

The suite skips nothing: 0 skipped at the baseline and on the final code. The built app's two steps, skipped on every
run since 2026-10-12, both run and pass at 1440 and 390.

### The Final Verification

| Check | Command | Result |
|---|---|---|
| The gate | `npm run gate`, its exit read from a file | exit 0 on `f68516b0`: 361 files, 4,316 tests, none skipped; typecheck, lint and all seventeen checks (`runs/gate.txt`) |
| The build | `npm run build` | exit 0 |
| Scenario saves | `node tools/scenario-saves.mjs <dir>` | 14 of 14 written, each exit 0, breaches 0, unbalanced 0 |
| The built app, 1440 | `node tools/acceptance-ui.mjs <out> 1440 <saves>` | 72 passed, 0 failed, 0 skipped, 0 errors, 0 overflows |
| The built app, 390 | the same at 390 | 72 passed, 0 failed, 0 skipped, 0 errors, 0 overflows |
| Lives to graduation | `npx vite-node tools/lives.ts -- --years 3.2` | 24 lives, six profiles on four seeds: 20 graduated, the four dismissed the autopilot control's (Reykjavik), as on every run since 2026-10-10; London, New York, Mexico City, the student who practices and the Scraping student with the flu and an injury graduated on 4 of 4 each. Breaches 0, unbalanced 0, errors 0 |
| Workload | `npx vite-node tools/workload.ts -- --seed <s> --profile <p> --years 1.4 --policy <q>` | London on lives-0 to 3, Mexico City, New York and Scraping, attentive, to 1.4 years: all in good standing; London lives-0 neglected, dismissed, as the control is. Breaches 0 |
| Variety, three years | `npx vite-node tools/variety.ts -- --seed v-0 --years 3` | graduated; breaches 0, unbalanced 0. 10 distinct top recommendations over 157 weeks (9 before), none at full, the longest unresolved 2 weeks (3 before); 2,104 hours of practice, each hour's feedback different, the same situation 3 in a row at most; 33 director's notes, none said again after taken; 72 of 157 weeks with no work decision beyond practice's, as before |
| Freshness | `npx vite-node tools/freshness.ts -- --months 4 --seeds fr-0,fr-1` | eight runs, four profiles on two seeds, four months: no take or scene repeated for the beginner, developing and specialist profiles, and no advice kept for an input at full; the mastered profile retapes 0.545 and 0.563 of its takes, each an earned callback (the held-out run before: 0.545, 0.539) |
| The completion matrix | `node tools/completion-matrix.mjs --check` | holds: 467 rows; 349 Verified, 60 Met, 5 Not Met (ST3, ST6, H4, F2 as written, L3), 13 Unresolved, 16 Deferred, 9 Implemented, 2 Partial, 8 Informational, 3 Legacy, 1 Superseded, 1 the owner's decision; none Open |

The scenario saves, the build, the built app and the gate are `f68516b0`'s. The long runs were played on `d1452195`; the code
changed after it only where none of their play reaches (`runs/README.md` says where). `runs/` keeps each output.

### For The Owner

None of these is counted met, and none is changed without your word:

1. **ST3′** (`st3.md`): the even actor's result the same on stage and close on every part, with its stamina not draining.
   ST3 as written asks two different real numbers to show the same tenth.
2. **ST6** (`st6.md`): keep it as the record that a restrained specialist rarely carries a scene built on public
   confrontation; or name a basis for weighing restraint's draw past expansive's, or the grain by the dimension's share.
3. **H4′** (`h4.md`): specialists measured on the work their ability is named for; or give presence, discipline and
   stamina work of their own, as content. H4 and H2 pull against each other on every lever measured.
4. **L3′** (`l3.md`): the same work rises. L3 as written fails a student who earns callbacks.
5. **Germany's month's fee on a close** (`../remaining/banking-result.json`, `banking.1.pro-rata`): BGB § 675h(3) owes it
   pro rata; SLATE charges it whole, and three test titles the audit cites say so.
6. **The 54 genres whose two briefs suit the same sides on every axis** (`closeout/genre-audit.md`): their registers agree,
   which the audit doesn't count a fault; variation across the catalog is I2's, which holds.

Nothing here is merged or deployed.
