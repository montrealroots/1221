# Your Area: A Performance's Workload (Key `stamina`)

Read `common.md` beside this file. Your section of the brief is 4, in full; your criteria are W1 to W10
(`../criteria.md`, section 4), and M1 must hold after your change.

## Where You Work

Your own clone: `/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad/stamina10`, branch
`stamina`, at the commit that added these instructions (the criteria's `2e8e4db3` and the instructions). Commit there; never push. The judge area works in its own clone at the same time, on the
acting criteria, and needs your model to measure H4's stamina, ST3 and L3, so keep your change to the workload and what
reads it, and say in your result every file you changed. Don't edit `content/approaches.ts`, `content/material.ts`, the
scenes, `systems/evaluation.ts`'s weighting, the advice (`systems/advice.ts`) or the banking files.

## What's There Now (Read Before Designing)

- `PIECE.load` and `loadOf` (`content/piece.ts`, `systems/piece.ts`): a night 0.6 and 0.12 a level of the body's and the
  voice's work, clamped at 1; a brief 0.1 to 0.35; a scene 0.15. Eight plays sit at the clamp, four of them one-acts
  (The Bear, A Marriage Proposal, Riders To The Sea, Salomé), loaded as whole evenings: `h4.md`'s follow-up section 2.
- The drain: `PIECE.drain` (0.3) × load × the unit's place × (1 − stamina), on the dimensions whose conditions name
  fatigue (`systems/piece.ts`, around line 341).
- A performance's call holds 180 minutes whatever the play, and takes `ESTIMATE.energy.performance` (10) flat
  (`systems/school.ts`); the day's condition at the curtain is read by the night's judgment (`nightEvaluation`).
- A night's part size (`PartSize`: lead, supporting and so on) is passed to the judgment.

## The Work

1. **Running times (W1).** Every play the catalog stages gets a running time and its basis: a published production's
   running time you can cite (a theatre's page, a published edition's note), or an estimate from its public-domain text
   at a stated speaking rate, labelled as an estimate. A play has no single exact running time: say which you took and
   why. One-acts run as one-acts.
2. **The model (W2 to W9).** Design a bounded, understandable workload from the running time, the actor's participation
   (the part's share of the stage time, by its size or its lines where the catalog holds them), the physical and vocal
   intensity, the breaks (an interval, where the play has one), the starting condition and stamina. Its effect within the
   piece is the drain (stamina protecting, to 0 at 100, so M1 holds); its effect after is the energy and tiredness the
   evening costs, once, and the call holds the clock for the running time and its calls, once. Recovery is counted once.
   A performance judged in its units comes to the same drain and fatigue as the whole processed at once. Write the
   formula and its coefficients in one place, each coefficient marked as SLATE's design choice or quoted from its source,
   and balance them by testing, not by claiming an exact science.
3. **What the player sees (W9).** The night's forecast before the curtain and its result after say the running time,
   the part's share, the intensity, the breaks, the workload, the drain at the end and the energy it costs. The guide's
   and the tutorial's performance lines follow the change (dated, past tense for what's no longer true).
4. **History (W10).** `RULESET` moves (and its ENGINE-MODEL row). A night kept under an earlier ruleset shows as it was.
   A save from before your change opens with its nights as judged, through a one-time step if anything kept needs moving.
5. **Tests**, in `tests/decisions-stamina.test.ts`, played through the commands and the clock where they reach it: a short
   and a long night, an intense one-act against a light full-length play, a night with an interval against one without,
   a run of nights (recovery between them, overnight, counted once), an evening interrupted by a save and a load, and
   twins differing in stamina and in starting condition. Each figure worked by hand from your formula. W7 (segments sum
   to the whole) under 1e-9. Mutations in copies for each clause.
6. **Measure what you move.** After your change: M1 (`tools/ag-baseline.ts`'s mastery section), and as a first look for
   the judge area, H4 (`node tools/ag-criteria.mjs`), ST3 (`npx vite-node tools/interpretation.ts -- --st3 <file>`) and
   L3 (`tools/brief-journeys.ts`), each before and after, into `docs/verification/decisions-2026-10-16/stamina/`.

Your result: `docs/verification/remaining-10/stamina-checklist.json` and `stamina-result.json`, with the formula, its
coefficients and their basis, three worked examples a player could follow (a one-act lead, a full-length supporting
part, a long intense lead with an interval), and the running-time table with every basis.
