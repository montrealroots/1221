# Brief 13's Judge And Acting Measurements On The Tested Commit, 2026-10-17

The acting area's comments on `grainOf` and `briefs.ts`, and the journeys area's five fixes, changed files the judge's
measurements watch. So every criterion brief 11 measured was measured again on the tested commit, `7e7a3af6`, through
`../../decisions-2026-10-16/measure.sh <this folder> <part>`, every part but the two mutation runs. They ran in five
lanes of the scratchpad's `runs13.sh`, M1 to M4 and MF, each in its own clone of `7e7a3af6`. `exits.txt` holds every
part's exit, and each is 0.

MF, the monotonicity merge and L3-R, first ran in its own clone, which held none of M1 to M4's outputs. The merge exited
1, reading a `mono-0.json` that wasn't there, and L3-R ran on nothing. The four lanes' outputs were then gathered into
MF's folder, their `exits.txt` lines with them under M1's first line, and both parts were run again there. Both exited 0,
and those are the two last lines of `exits.txt`. The first line counts one file uncommitted: the run's own output folder,
which `measure.sh` counts as untracked.

**Every output brief 11's final measurements made** (`../../completion-2026-10-16/final/`) **is byte for byte the same
here:** all 31 of the JSON outputs both folders make, and the genre audit. They cover:
- the stage's ST3 and ST6, and the attribute criteria;
- the H4-R indirect probe;
- the eight journeys and their L3 traces;
- the four monotonicity parts and their merge, 363,432 checks on 797 pieces, no fall;
- L3-R;
- the genre signatures, identity and audit.

So nothing brief 12 or brief 13 changed moved anything the game judges, and RULESET stays evaluation-11.
`figures.json` is `../../integration-2026-10-16/integrated-09/figures.py` read from these outputs.
`../../integration-2026-10-16/criteria.py` reads it, and it moves each row brief 11's judge measurement held to
`7e7a3af6`. An area item that has no figure of its own moves only because every shared output is the same.

The acting area's measurements ran again in lane J, on the same commit:
- `st6r2.json` (brief 12's ST6-R2) is byte for byte `../../resolution-2026-10-17/acting/st6r2.json`.
- `st6r2-13-c.json` and `st6r2-13-e.json` are byte for byte `../acting/`'s, which the area ran on `c66db54a`.
- `st6r2-13-trace.json` gives the area's `../acting/trace.json` in every key: the ten readings at ±0.01, the boundary,
  the 65 pairs, the window and the dependency map.

So ST6-R2.c's verdict, c21 to c43 all met, and ST6-R2.e's, (e1) met and (e2) and (e3) not met as written, are
those of the tested commit.

The mutation runs weren't made again. The acting area ran ST6-R2's on its own code (`../acting/mutations.json`, h1 to
h14 killed, on `423dc68c`). No file those mutations edit has changed since, and neither has the test file they run.
