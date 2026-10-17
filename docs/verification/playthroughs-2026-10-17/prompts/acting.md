# Brief 13, Acting: ST6-R2.c And ST6-R2.e (2026-10-17)

Read `common.md` first. Your area is `acting`; your clone is `…/scratchpad/acting13`, branch `acting13`.

## The Owner's Resolution

Brief 13's sections 1, 2 and 3 are yours, whole. Quote them in your criteria as the owner wrote them; the brief's file is
verbatim. In short:
- **(c):** a tiny circumstance change may legitimately make no measurable difference because of documented precision, a
  cap or another limiting factor, but never an unexplained change the wrong way;
- **"unrelated":** an unrelated ability is defined from the engine's actual dependency path, not from a cutoff chosen
  because it makes the observed failures disappear;
- **(e):** specialist advantages are compared where the comparison actor has room to improve, without leaving the test
  without meaningful evidence.

## Where It Stands

- **Brief 12's record:** `docs/verification/resolution-2026-10-17/acting-criteria.md` and `acting-result.json`; the
  measurement in `acting/st6r2.json`, made again on the tested commit as `final/st6r2.json`, byte for byte the same.
- **The measure:** `st6r2Cases`, `ST6R2` and `measureST6R2` in `tools/acting-criteria.ts`. The command is
  `npx vite-node tools/interpretation.ts -- --st6r2 <out>/st6r2.json --st6r2-only`.
- **The gate's tests:** `tests/decisions-judge.test.ts`, describe "ST6-R2: restrained acting judged by what it does for a
  player (brief 12)". The parts that held are in the gate; the parts that failed as written aren't asserted.
- **What failed as written:**
  - (c2): 10 of 784 brief readings with restraint's suitability at exactly ±0.01, where `grainOf` rounds the grain to a
    hundredth;
  - (c4): specialists ahead on 65 of 6,344 pairs (1.02% against 1%), all against the grain, the ability carrying between
    1/12 and a tenth of the take's ability effects;
  - (e2) and (e3): on stage the even actor already has every suitable piece, 66 of 66 for restraint and 57 of 57 for
    size.
- **ST6-R's originals** (a), (c), (e) and (g) are superseded and stay so. ST6-R2.a and ST6-R2.g are verified; don't reopen
  them except where your change would falsify them.

## How To Work It

1. **Trace first, before writing anything that decides.** For each of the 10 readings and each of the 65 pairs, follow
   the actual calculation (`systems/interpretation.ts`, `systems/evaluation.ts`, `systems/piece.ts`). Say where a figure
   is rounded for display, where it's quantized inside the engine, and where a genuine gameplay limit stops it. Group the
   65 by a demonstrated common cause, or explain each.
2. **Map the dependency path.** For each ability and each kind of restrained work, say from the code whether it has no
   dependency, a small legitimate one, a direct one, or an indirect one through preparation, condition or progression.
   That map defines "unrelated", and is written before any threshold.
3. **Write the clarified criteria** in `docs/verification/playthroughs-2026-10-17/acting-criteria.md`, and commit them
   before any test, tool change or final measurement. Keep beside them:
   - brief 12's (c) and (e) and their results, word for word;
   - the owner's clarification, quoted;
   - why the previous comparison was unsuitable.

   Define the below-ceiling profiles for (e) and justify every threshold there, before measuring.
4. **Controlled comparisons.**
   - **Single-input:** one ability or one circumstance changed at a time, everything else held, which establishes cause.
   - **Boundaries:** changes immediately below, at and above each relevant boundary.
   - **Equal-budget specialists:** kept apart, because redistributing a budget moves several abilities at once.
   - **For (e):** equal-budget actors under the same preparation and conditions, measured on quality, preparation burden,
     endurance or another established mechanic, across varied existing material. No new material, and no profile chosen
     because it passes.
5. **Fresh validation profiles.** Profiles and seeds beyond those that informed the clarification, named in the criteria
   before they're run, and run once.
6. **Tests that fail on removal.** The gate holds each clause. Mutations show that removing the relevant ability's
   contribution, or the circumstance's effect, fails a test the clause names, recorded as brief 12's `acting/mutations*`
   are.
7. **No change to the scoring engine to satisfy a flawed comparison.** If the trace finds a real defect (a disconnected
   mechanic, a change the wrong way), fix it as a defect, with its test, and say whether anything judged moved (RULESET,
   `docs/ENGINE-MODEL.md`).

## Your Result

`docs/verification/playthroughs-2026-10-17/acting-result.json`:
- **Rows:** ST6-R2.c and ST6-R2.e, group "Brief 12: Replacement Criteria", each closed (Implemented And Verified) only where
  its own acceptance conditions pass, otherwise with its `decision` or `gap`.
- **Brief 12's results** kept as history, not passed retroactively.
- **The trace of the 10 and the 65,** the dependency map, and the ceiling cases with their limits.
- **The measurement commands,** for the coordinator to repeat on the tested commit.
