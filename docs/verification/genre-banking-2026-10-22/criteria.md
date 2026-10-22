# Brief 21: Genre Integration And Banking Correctness, Its Criteria

The owner's brief 21 (`../briefs-2026-10-16/21-complete-genre-integration-and-banking-correctness.txt`, kept verbatim),
given 2026-10-22, turned into items here before any fix, as brief 20's were. Each item is **Open** until the game does
it and a test the gate runs fails without it, or, for a record, until the record is there. Nothing is closed by moving
it out of the count or narrowing what it asks.

## The Starting Point

- **Tested from:** `main` at `e50865df` (#51: brief 20 merged as #50, `e78659ba`, and the handoff's account of it), on
  `claude/peaceful-hamilton-59zdbb`, level with `main`. No uncommitted work, no stash, one worktree. Nothing deployed.
- **The gate there:** brief 20's, on `fdf6897e`, whose `src` is `e50865df`'s: exit 0, 479 of 479 test files, 5,481 of
  5,481 tests, all 22 checks (`../audit-2026-10-21/final-runs/runs/gate-receipt.txt`). Reused, as the brief allows: the
  source it ran on is unchanged.
- **Out of scope, at the owner's word:** the UI redesign, the OPT policy decisions, and the systems deferred before.

## What The Code Did Before Any Fix (read 2026-10-22)

Genre knowledge is kept per genre as familiarity (studied) and practice (worked in), each 0 to 100
(`systems/engagement.ts`); a genre counts as known by the better of the two. Where it reached play:

| Path | Task | Genre read? | How |
|---|---|---|---|
| A practice self-tape (the School's briefs) | `tape`, `tapeOnFeet`, `camera` | yes | `genreKnown`: the best of the brief's kinds, a part of preparation gating interpretation (`partFloor` 0.75) |
| A professional self-tape (audition, callback) | `tape` | yes | `fitOf(...).genre`: the best of the project's genres |
| A professional in-person audition, callback | `audition` | **no** | |
| A shoot day | `camera` | yes | `fitOf(...).genre`, the best of the project's genres |
| A night on stage, professional or the School's | `performance` | **no** | |
| A professional rehearsal day | none judged | **no** | the part's preparation moves at a School call's rates, genre not read |
| A School class scene, a play's lines | `scene`, production | speed only | `genreSpeed`: the best of the play's kinds speeds preparation by at most a sixth |
| School casting | `castFit` | **no** | each student read as if prepared, genre not read |
| Professional casting's chance | `fitOf` | yes | the best of the project's genres, half of the fit |

Banking, the money area's findings (`../audit-2026-10-21/areas/money/REPORT.md`, For The Owner):

- savings rates quoted as an APY or AER run as nominal rates (`banking.ts`: `earning × rate / 365` a day, credited
  monthly), so Capital One's 3.00% APY pays about 3.04%;
- a US card's penalty rate and the end of its introductory rate at the second missed due date, about 30 days late
  (`credit.ts`, `SUSPEND_AFTER`), where Reg Z §1026.55(b)(4) asks 60;
- the charge-off at the sixth missed due date, about 150 days (`CHARGE_OFF_AFTER`), where its own comment and the FFIEC
  say 180;
- a card's due date the statement date plus the bank's days (`dueAt`), so Chase's moves between the 10th and the 11th;
- a standing order made on its day whatever the weekday (`payments.ts`, `nextOn`).

## G. Genres

- **G1. Relevant genres from the material, weighted.** Each judged piece reads the genres of its own material: a
  project's, a play's, a scene's, a brief's. Each tag has a weight for its importance: explicit where the material says
  so, else a documented default. Weights are normalized to 1, so more tags never add to what's available.
- **G2. Duplicates and close relations count once.** A tag listed twice, or a subgenre listed beside its parent, is one
  requirement, and the same expertise isn't credited twice across them.
- **G3. Unrelated expertise gives nothing.** A genre that shares nothing with the material's adds 0, however well known.
- **G4. Monotone and bounded.** Relevant knowledge is 0 to 1; raising any relevant genre never lowers it; mastering one
  relevant genre gives its weighted share; mastering all gives the most.
- **G5. Every path the brief names reads it:** School casting, the professional in-person audition and callback, the
  self-tapes, rehearsals, shoot days, and stage performances. Working connections kept, missing ones repaired.
- **G6. Counted once for each effect.** Genre isn't added twice for one effect (preparation's speed and a second bonus
  for the same thing). Separate contributions (the work's quality, casting's reading of suitability, the speed of
  preparation) are each named and documented, with what each moves.
- **G7. The foundation stays.** Attributes and techniques, preparation, the role's demands, health and fatigue still
  matter as before; what a player loves stays apart from what they know (enjoyment only).
- **G8. No guarantees.** High relevant mastery improves suitability or quality, other things equal; it doesn't make a
  part posted, a casting certain, or an agent's answer yes.
- **G9. Said truly.** The guide, the tutorials and the screens' explanations describe the mechanics as they are, in the
  game's words.

## B. Banking

- **B1. Yields converted, not run as nominal.** Each savings and term product's quoted rate has its basis (APY, AER,
  nominal, or unknown) and the compounding its terms give; the daily accrual is worked out from them so the product
  yields its quoted rate, with precision kept and rounding at the posting. A product already right stays as it is,
  with the evidence.
- **B2. A US card's penalty rate when the law and the card allow:** not before the minimum is 60 days past due
  (§1026.55(b)(4)), after 45 days' notice (§1026.9(g)); only on a card whose terms have a penalty rate; and its end
  after six on-time payments. Other countries' rules as their sources give them.
- **B3. The introductory rate's loss** at the same 60 days on a US card, or as a card's own terms say.
- **B4. The charge-off at 180 days past due** for US open-end credit (FFIEC), counted in days, not due dates; other
  countries as their sources give, the rest said as SLATE's assumption.
- **B5. A US card's due date the same day each month** (§1026.7(b)(11)), at least 21 days after the statement
  (§1026.5(b)(2)(ii)); through short months, leap years and the year's end. Other countries as their terms give.
- **B6. A standing order's date** on a weekend or holiday follows the bank's or payment system's rule, where one is found;
  where none is, the uncertainty is said.
- **B7. Money kept whole.** Accrued, posted, fees, balances and statements agree; transfers and payments conserve money;
  a long jump and a save and a load neither skip nor double a charge, a notice or a payment.

## S. Saves

- **S1. History isn't rewritten.** Posted transactions, statements and balances in a save stay as they were. Corrected
  rules apply from the moment a save is opened, forward.
- **S2. A migration only where needed,** each tested on an older save: school history, career, genre development,
  agreements, credits, balances and transactions kept.
- **S3. Consumers follow:** assessments, casting, work records, feedback, statements, available funds and debt read the
  corrected values.

## P. Proof

- **P1. Genre comparisons:** twins alike but for one genre input, the same seed, at low, medium and maximum relevant
  mastery; a single-genre role; an even two-genre role; a role dominated by one genre; a production of three or more;
  one mastered and one weak; all mastered; high unrelated mastery; duplicate and overlapping tags; School casting and
  each professional path. The contribution shown at the intermediate figure (the genre part, the dimension) and the
  final, over a documented seed set, with the spread reported.
- **P2. Banking with independent expectations:** amounts worked by hand from the sources' figures, dated timelines;
  each account type and compounding convention; payment timing; notice; partial and missed payments and recovery; leap
  years, holidays and weekends; long jumps; save and load. When something should happen and when it mustn't.
- **P3. A regression test for each repaired defect** that fails on the old behavior; deliberate faults (mutations)
  showing the critical tests catch a broken genre connection and a wrong financial calculation.

## J. Journeys And Verification

- **J1. Complete journeys through the player's commands:** the School into professional work; single- and mixed-genre
  work; different expertise and preparation; banking across the corrected deadlines; older saves continued; continuous
  against saved and reopened.
- **J2. The built app:** the affected screens read against the behavior: explanations, amounts, dates, feedback,
  records.
- **J3. Continuity:** no first-time event twice, no completed opportunity again, no generic feedback.
- **J4. The full gate after integration,** in a clean clone, its exit read from its file; again after later changes.

## R. The Report

- **R1.** The tested commit; each defect and its fix; the genre formula, its weights and before and after; banking's
  sources, dates, assumptions and worked examples; save compatibility; journeys and mutations; test totals, failures and
  skips; what's uncertain. The feature-to-effect matrix, tutorials and handoff brought up to date.
