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
