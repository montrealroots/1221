# Your Area, Second Phase: The Acting Criteria With The Stamina Model In (Key `judge`)

`judge.md` and `common.md` still apply. The stamina area's workload (`content/workload.ts`, `systems/workload.ts`,
`evaluation-11`), the advice area's work and the Arion area's are integrated with yours on
`claude/peaceful-hamilton-59zdbb`. Work in a new clone of it: `/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad/judge10b`,
branch `judge2`, cut from the commit that added this file. Commit there; never push. You're the only area working now.

## What Was Found At The Integration

- The stamina specialist is behind the even actor over the whole night on all 30 plays, even as a lead (the closest,
  Julius Caesar, −0.15), and owns one piece; H4-R (a), (b) and (d) fail for stamina.
- A1 fails for stamina: `tools/ag-baseline.ts` judges a night as a supporting part, which drains by its half of the
  evening (stamina's +10 effect 0.32 where it was 0.63; a lead's 0.50, a featured part's 0.14).
- Memory and composure own briefs alone; H4-R (a) asks two kinds.
- `tools/pieces.ts` now builds a night through `nightPiece` and `runningOf`, as `ag-baseline.ts` does (it called `loadOf`'s
  night, which the model removed).

## The Work, In Order

1. **Measure everything on the integrated code** before changing anything: `docs/verification/decisions-2026-10-16/measure.sh`
   (yours), into `docs/verification/decisions-2026-10-16/integrated/before/`.
2. **Stamina's role.** The brief's section 4 says the workload's coefficients are SLATE's design choices, to be "balanced
   through testing", and that stamina must have "meaningful protective value without making it unlimited energy". You
   may change the workload's coefficients (`content/workload.ts`, `PIECE.drain`) to give it that, and nothing else of the
   model: W1 to W10 must still hold, every test of `tests/decisions-stamina.test.ts` with its figures worked again by hand
   where a coefficient moved (a dated comment saying what it was), and every coefficient's comment saying it's SLATE's
   choice and what testing set it. H4-R for stamina is the target: its own work (five pieces, two kinds) where its
   specialist leads by the median H4-R asks, its benefit after the night shown by twin lives, and A1 met again. Whether
   A1 reads a night at a supporting part or at the parts a night is cast in is the tool's measurement: change it only
   with a stated reason, and report both figures.
3. **Memory's second kind of work: authorized.** A night reads memory by the part's text, its share of the running time
   (the workload's participation), as a brief reads it by its size: a longer part in a longer play is more to hold.
   Measured against H2 (no actor best on more than half of a kind), H5 and the stage criteria first.
4. **Composure's second kind: only with a source.** If published research on performance anxiety shows auditions or
   performances before an audience carry more pressure than class work, read their stakes from that, cited where the rule
   is; measured as memory's is. If no source settles it, leave it and say so.
5. **ST6-R as it stands.** No change without a source; the owner decides on the evidence you gave. Measure it again on the
   integrated code, and write beside it (not counted, proposed) a corrected clause (b) that fails when restraint's draws are
   removed, as the owner's requirement asks, measured.
6. **The ruleset.** `evaluation-11` hasn't left this branch: a change you make to the judge is part of it, its
   ENGINE-MODEL row saying so, rather than a twelfth.
7. **Measure everything again**, into `integrated/after/`, every criterion of section 5, and update
   `docs/verification/remaining-10/judge-result.json`.

Your final message: each criterion clause's status with its figures before and after this phase, every coefficient you
moved with its old and new value and the testing that set it, every commit, every check and test file with its exit
code, and what remains with its cause.
