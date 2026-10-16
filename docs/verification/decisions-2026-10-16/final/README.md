# Brief 10's Criteria On The Tested Commit, 2026-10-16

The judge area measured every criterion of section 5 on the integrated code, `167f996b` (`../integrated/after/`). After
that, at the owner's word, a genre's row on the Player Profile came to say Mastered (`567d27dd`). The change set a field on
a brief's record and added a one-time step on opening, in two files the measurements read (`src/engine/systems/briefs.ts`,
`src/engine/index.ts`). So the measurements were made again here on `567d27dd`, the tested commit.

They ran in a clone of the branch at that commit, through `../measure.sh <this folder> <part>`, every part but the two
mutation runs, in five lanes beside the long runs (`../../integration-2026-10-16/runs-10/`). Every exit is 0
(`exits.txt`). Its first line says one file was uncommitted: this folder, before its outputs were in it.

**Every output is byte for byte the same as `../integrated/after/`'s**: all 33 files the two folders share, from the
stage's ST3 and ST6 to the attribute criteria, the H4-R indirect probe, the eight journeys and their L3 traces, the four
monotonicity parts and their merge, L3-R, the genre signatures, identity and audit. The Mastered marks a brief and
judges nothing.

`figures.json` is `../../integration-2026-10-16/integrated-09/figures.py` read from these outputs, the same as
`../integrated/after/figures.json`. `../../integration-2026-10-16/criteria.py` reads it for the completion matrix, the
measurement's commit `567d27dd`.

The mutation runs (`../integrated/after/mutations.json`, `test-mutations.json`) weren't made again. They break the judge's
rules in a copy and read whether a measurement or `tests/decisions-judge.test.ts` catches each. Every file they edit
(`../mutations.json`, `../test-mutations.json`: the approaches, interpretation, piece, workload, evaluation, attributes
and school sources) is the same on `567d27dd` as on `167f996b`, and so is the test file.
