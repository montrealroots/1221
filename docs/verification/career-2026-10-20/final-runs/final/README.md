# Brief 19's Judge And Acting Measurements On The Tested Commit, 2026-10-21

Brief 19 changed a file the judge's measurements watch: `content/coursework.ts`, where the Actor Showcase became DRAM
793b's own coursework (`fe4e73d1`). So every criterion brief 17 measured was measured again on brief 19's tested commit,
`728b4972`, each part through `../../../decisions-2026-10-16/measure.sh <this folder> <part>`.
- **The lanes:** five lanes of `../runs/runs19.sh`, M1 to M4 and MF, each in its own clone of `728b4972` and all writing
  to this one folder.
- **`exits.txt`:** every part's exit, 23 parts, each 0, each run once.
  - **The first line** counts one file uncommitted in the first lane's clone: that lane's own record of its exits under
    `runs/`, which isn't tracked, as in brief 17.
- **The acting area's measurements** ran in lane J, on the same commit: `st6r2.json` and brief 13's `st6r2-13-c.json`,
  `st6r2-13-e.json` and `st6r2-13-trace.json`.

## What Changed, And What Didn't

- **The figures:** `figures.json` is `../../../integration-2026-10-16/integrated-09/figures.py` read from these outputs.
- **Every number:** all 35 JSON files here are brief 17's (`../../../continuity-2026-10-20/final/`) in every number,
  id and key, nothing explained away (`../numbers-same.py`, `../numbers-same.json`, "final").

So nothing brief 19 changed moved anything the judge measures, and RULESET stays evaluation-11.

`../../../integration-2026-10-16/criteria.py` reads `figures.json` and moves each row brief 17's judge measurement held to
`728b4972`, with its figure beside brief 17's ("the same" where it is), and, the numbers being the same, the judge's
overrides with them.
