# Brief 15's Judge And Acting Measurements On The Tested Commit, 2026-10-20

Brief 15 changed the player's words, and with them files the judge's measurements watch: the coursework, the looks, the
briefs' content and the advice. So every criterion brief 14 measured was measured again on brief 15's tested commit,
`d6f6527a`, every part but the two mutation runs, each through `../../decisions-2026-10-16/measure.sh <this folder>
<part>`.
- **The lanes:** five lanes of `../runs/runs15.sh`, M1 to M4 and MF, each in its own clone of `d6f6527a` and all
  writing to this one folder.
- **`exits.txt`:** every part's exit, 23 parts, each 0.
  - **The first line** counts one file uncommitted in the first lane's clone: that lane's own record of its exits
    under `runs/`, which isn't tracked.
  - **Twice:** M1 to M4's 21 parts are each listed twice, both times exit 0. The container restarted while the lanes
    ran, the queue was started again, and `measure.sh` doesn't skip a part already measured. The files here are the
    second run's.
- **The acting area's measurements** ran in lane J, on the same commit: `st6r2.json` and brief 13's `st6r2-13-c.json`,
  `st6r2-13-e.json` and `st6r2-13-trace.json`. Each is byte for byte brief 14's.

## They Ran First On `c3478f9e`

Every part ran first on `c3478f9e`, each exit 0 (`../runs/first/exits-judge-parts.txt`). Then `e5fdacb7` shortened the
coursework warning in `src/engine/systems/coursework.ts`, which these measurements read, so they ran again on the commit
after it (`../uitools/README.md` says why it changed).

## What Changed, And What Didn't

- **The figures:** `figures.json` is `../../integration-2026-10-16/integrated-09/figures.py` read from these outputs.
  All 36 figures are brief 14's exactly.
- **Byte for byte:** of the 35 JSON outputs both folders make, 27 are brief 14's byte for byte, and so is the genre
  audit. The other eight are the brief journeys (`journey-*.json`). They keep the words a take is told, and brief 15
  changed those words.
- **Every number:** every number, id and key in all 35 is brief 14's (`../numbers-same.py`, `../numbers-same.json`: 35
  of 35 identical in every number, nothing explained away).

So nothing brief 15 changed moved anything the game judges, and RULESET stays evaluation-11.

`../../integration-2026-10-16/criteria.py` reads `figures.json` and moves each row brief 14's judge measurement held to
`d6f6527a`, with its figure beside brief 14's.
