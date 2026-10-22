# Brief 21's Judge And Acting Measurements On The Tested Commit, 2026-10-22

Brief 21 changed three files the judge's measurements watch: `content/tasks.ts` (a night's interpretation reads the
genre), `systems/briefs.ts` (a taped brief's practice shared among its genres by weight) and `content/plays.ts` (the
Seagull's kinds, `genresOfHolder`). So every criterion brief 19 measured (brief 20 ran no judge lanes, none of its files
being among them) was measured again on brief 21's tested commit, `fd32e869`, each part through
`../../../decisions-2026-10-16/measure.sh <this folder> <part>`.
- **The lanes:** five lanes of `../runs/runs21.sh`, M1 to M4 and MF, each in its own clone of `fd32e869` and all writing
  to this one folder.
- **`exits.txt`:** every part's exit, 23 parts, each 0, each run once. Its first line counts one file uncommitted in the
  first lane's clone: that lane's own record of its exits under `runs/`, which isn't tracked, as in briefs 17 and 19.

## What Changed, And What Didn't

`../numbers-same.py` sets every output here beside brief 19's (`../../../career-2026-10-20/final-runs/final/`), every
number, key and id compared (`../numbers-same.json`, "final"):
- **29 of 35 the same in every number:** the stage, ST3, ST6, H4's indirect, the signatures, the genre identity, the advice
  baseline, the mono runs and the other six journeys.
- **6 moved, each by a taped brief's practice shared by weight:**
  - two journeys' takes: developing bj-0's second-to-last 60.8 to 60.9, specialist bj-1's 61.4 to 61.6;
  - three traces' month means, each by 0.01 to 0.02 (developing bj-0, generalist bj-0, specialist bj-1);
  - `l3r.json`, whose verdict is brief 19's: L3-R met, (b) on 8 journeys, two per profile, (c) growth 1.253 at least.

`figures.json` is `../../../integration-2026-10-16/integrated-09/figures.py` read from these outputs: 35 of 36 figures
the same as brief 19's. The one that moved is the Genre Audit's:
- **What it says:** "helps its own brief in 149 of 149, moves another genre's in 9" (0 before).
- **Why:** brief 21's measure credits a genre's own kind toward it at 0.75 and its broad genre at 0.5. The audit tries
  each genre against the next one alphabetically, and nine of those pairs are a genre and its own kind:
  - action and action comedy, comedy and coming of age, horror and horror comedy, romance and romantic comedy, and
    tragedy and tragicomedy, at half;
  - christmas and comedy, docufiction and documentary, domestic drama and drama, and science fantasy and science
    fiction, at three quarters.
- **What isn't moved:** none of the nine pairs is unrelated, and the other 140 move nothing.
- **Why it's a decision:** the audit's threshold, "leaks into none" (the owner's genre acceptance brief of 2026-10-16),
  and brief 21's "unrelated genres give nothing" read differently here. So the row is Decision Required, its question,
  evidence and recommendation in `../judge-moved.json`.

## What The Matrix Reads From It

`../../../integration-2026-10-16/criteria.py` moves each judge row brief 19 measured to `fd32e869`, its figure beside
brief 19's ("the same" where it is), and the Genre Audit to Decision Required. The four area items the judge's
measurement holds are restated by `../judge.py` from these outputs (`../judge-result.json`), not carried as brief 19's:
- **L3-R.b, verified:** L3-R met, as brief 19's.
- **judge.together, verified:** every part exit 0; what moved is the six above, and L3-R's verdict is brief 19's.
- **advice.F2, verified:** F2 as written fails as before, its line and `ag-baseline.json` brief 19's.
- **genres.7-measured, Implemented, Verification Incomplete:** every genre output brief 19's in every number, but its
  "moves another genre's in 0" waits on the Genre Audit's decision.

RULESET wasn't moved and stays evaluation-11 (`content/tasks.ts`): brief 21 added a part of preparation a night reads, the
genre, under the rule that already read the least of a dimension's parts, so a result kept from before is shown as it was
and a night played from brief 21 on reads the genre.
