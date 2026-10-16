# Phase 2c's Close-Out: Every Criterion Measured Again On The Final Engine, 2026-10-16

The owner's brief of this pass, sections 3 to 5: attribute phase 2c and close-out, genre depth and differentiation, and
the benchmark and fresh held-out cases verified after the changes. Measured on the engine as it stands after this pass's
three changes to the judge (a result rounded once, the four drama scenes, restraint's draw: `../st3.md`, `../st6.md`),
in the separate checkout that carried them, before the six areas' work came in; the areas don't touch the judge.

## The Attributes (`criteria-before.txt`, `criteria-after.txt`)

`node tools/ag-criteria.mjs` on `../baseline/ag-baseline.json` (`ef784ccd`) and on `ag-baseline.json` (the final
engine), each threshold as `../../attributes-genres-2026-10-16/acceptance-criteria.md` wrote it.

| Criterion | Before | After |
|---|---|---|
| A1, A2, A3 | met (highest correlation 0.536) | met (0.527) |
| T2 (a), T3 (a), techniques past 90 | met | met |
| G3, G4, G5 | met (G5 51.23 → 53.86) | met (51.22 → 53.86) |
| M1 | met: 4,495 brief cases, 56 scenes, 30 nights, 30 castings, 13 coursework at 100; 0 drawn off | met: the same with 60 scenes |
| M3, O1, O2 | met | met |
| H2, H5, H7 | met | met (H5 within a point on 26.9%) |
| **H4** | **1 of 12: not met** | **2 of 12: not met** (`../h4.md`) |
| **F2 as written** | **67.8%: not met** | **67.6%: not met**, superseded for advice by F2-A |

Judged by reading the code, as phase 2b did: A4 (brought to restraint's new draw, the descriptions of composure and
focus saying what a restrained take reads of them), A5, T1, O3, F1, F3. G1 stands replaced by the genre signature.

## Long-Term Continuity (`journey-*-bj-0.json`, `l3-trace-*-bj-0.json`)

L1: the longest run of one recommendation 4 weeks (specialist) and 3 (beginner): met. L2: 0 and 0: met. **L3 as
written: not met** for the specialist (65.5 → 64.1), met for the beginner (54.0 → 56.6); the trace and L3′ in `../l3.md`.
Breaches and unbalanced entries 0 on both.

## The Genres

**The signature** (`signature.json`, `signature-fresh.json`; `tools/genre-signature.ts`, the criteria in
`../../genres-2026-10-16/g1-replacement.md`):

| | Designed Scenes | Held-Out Scenes | Fresh, Designed | Fresh, Held-Out | Before (each) |
|---|---|---|---|---|---|
| S1 (≥ 0.7, every genre) | 0.901, least 0.842 | 0.883, least 0.809 | 0.904, least 0.845 | 0.880, least 0.785 | 0.90, 0.88, 0.90, 0.87 |
| S2 revised (≥ 1.5×) | 1.599 | 1.612 | 1.598 | 1.613 | 1.60, 1.61, 1.60, 1.61 |
| S2: nearest shares a concern (≥ 90%) | 98.7% | 98.7% | 98.7% | 98.7% | 98.7% |
| S3 revised (≥ 80%) | 12,744 of 14,350 (88.8%) | 11,890 of 14,350 (82.9%) | 24,838 of 28,413 (87.4%) | 23,304 of 28,413 (82.0%) | 12,757, 11,887, 24,832, 23,300 |
| S4 (G2: identical briefs across genres) | 0 | | | | 0 |

All hold, on every sample. The original S2 (1.47) and S3 (held out 73.4%, fresh held out 72.3%) are as they were before
their revision ("Revision" in `g1-replacement.md`, defined before it was measured; the work plan's sections 6 and 7);
they're reported as measured, and the revised definitions are what's counted.

**Identity** (`genre-identity.json`, `tools/genre-identity.ts`): no two genres identical in every number a take reads
(G2 = 0). G1 as written still fails (0.955×, 145 genres with a nearer neighbor), as it did; its replacement holds.

**The audit** (`genre-audit.md`, `tools/genre-audit.ts`), every genre (149, counted from the code): knowing a genre
helps its own brief in 149 of 149 and moves another genre's brief in none. Found by the figures, to weigh: 55, down from
56. The one that went is drama's stage scenes all suiting restraint, which ST4 settled. The 54 left are genres whose two
briefs suit the same sides on every axis: their registers agree, which the audit doesn't count a fault, and variation
across the catalog is I2's, which holds (pace 24.2%, scale 20.8%, structure 32.9%).

**Weak genres and subgroups.** Where a genre is weakest is its own table row in `genre-audit.md` (what its register
reads, what its briefs suit, what knowing it is worth). The aggregate holds; the subgroups that don't are the ones named
here: the 54 genres whose two briefs agree on every axis, G1 as written, the original S2 and S3, and on the stage the
restrained specialist against strongly expansive scenes (ST6).

## Mastery

M1 at 100 on every case (above); MA1 to MA4 and MA7 through play (`tests/integration-mastery.test.ts`); MA5 and MA8 with
the long runs and the school area.
