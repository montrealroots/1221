# L1 After Brief 10: A Regression, Traced To The Advice

L1 (`../../attributes-genres-2026-10-16/acceptance-criteria.md`): repeated feedback changes or is acted on. The top
recommendation each week of a 120-day played term (`tools/brief-journeys.ts`, beginner and specialist, seed `bj-0`) runs
at most 4 weeks on one target without its input rising 5 points.

Section 5 of brief 10's criteria (`../criteria.md`) holds every attribute criterion on the integrated code, and a
criterion that held before the brief and fails after it is a regression, fixed or reported with its cause. L1 held
before brief 10 and fails after it. The close-out found it on 2026-10-16, when it read the judge area's final
measurement (`../integrated/after/`) against brief 09's (`../../integration-2026-10-16/integrated-09/`). The judge area
had measured the journeys but not this figure.

## The Figure At Each Point

The longest run of one target, then the weekly sequence (day: target @ its level). Every file is the journey's own
`--write` output, read by `recommendations`:

| Code | Profile | Longest | Sequence |
|---|---|---|---|
| `c9cba9c8`, brief 09 integrated | specialist | 4 | 7:adaptability@50, 14:adaptability@50, 21:focus@50, 28:focus@50, 35:focus@50, 42:focus@50, 49:vocal@51, 56:physical@52, 63:focus@52, 70:focus@52, 77:physical@53, 84:vocal@52, 91:focus@53, 98:focus@54, 105:adaptability@52, 112:adaptability@54, 119:adaptability@56 |
| `c9cba9c8` | beginner | 3 | 7:imagination@57, 14:imagination@57, 21:focus@54, 28:imagination@58, 35:vocal@52, 42:physical@55, 49:vocal@52, 56:focus@55, 63:vocal@53, 70:focus@55, 77:vocal@54, 84:vocal@54, 91:vocal@54, 98:focus@56, 105:focus@57, 112:composure@47, 119:composure@50 |
| The judge area's clone after its first phase, no advice change (`../judge/`) | specialist | 4 | as `c9cba9c8`, week for week |
| The same | beginner | 3 | as `c9cba9c8`, week for week |
| `84db36b7`, the advice area on the branch, before the judge's and the stamina's (this folder) | specialist | **8** | 7:adaptability@50, 14:adaptability@50, 21:focus@50, 28:focus@50, 35:vocal@50, 42:focus@50, 49:vocal@51, 56:focus@51, 63:focus@52, 70:focus@52, 77:focus@52, 84:focus@52, 91:focus@53, 98:focus@54, 105:focus@55, 112:adaptability@54, 119:adaptability@56 |
| `84db36b7` | beginner | **6** | 7:imagination@57, 14:imagination@57, 21:focus@54, 28:focus@54, 35:vocal@52, 42:focus@54, 49:vocal@52, 56:focus@55, 63:imagination@60, 70:focus@55, 77:focus@55, 84:focus@56, 91:focus@56, 98:focus@57, 105:focus@58, 112:composure@47, 119:composure@50 |
| `39380191`, the four areas together (`../integrated/before/`) | specialist | 8 | as `84db36b7`, week for week |
| `39380191` | beginner | 6 | as `84db36b7`, week for week |
| `167f996b`, the final code (`../integrated/after/`) | specialist | 8 | as `84db36b7` to day 105; then 112:adaptability@52, 119:adaptability@55 |
| `167f996b` | beginner | 6 | 7:imagination@57, 14:imagination@57, 21:focus@54, 28:focus@54, 35:vocal@52, 42:focus@54, 49:vocal@52, 56:focus@55, 63:focus@55, 70:focus@55, 77:focus@55, 84:focus@56, 91:focus@56, 98:composure@46, 105:composure@47, 112:composure@49, 119:composure@52 |

The specialist's eight weeks of focus, days 56 to 105, saw it rise from 51 to 55. The beginner's six, days 56 to 91,
saw it rise from 55 to 56. Each run is past 4 weeks with its input short of 5 points, so L1 is not met.

## The Cause

The advice area's changes to What To Improve Next (`94aa2490` and `6cb456e3`, on the branch by `84db36b7`) moved the
figure on their own; which of the two, or both, wasn't measured. The journeys at `84db36b7` were measured on 2026-10-16, after the fact:

```
npx vite-node tools/brief-journeys.ts -- --profile specialist --seed bj-0 --days 120 --write journey-specialist-bj-0-84db36b7.json
npx vite-node tools/brief-journeys.ts -- --profile beginner --seed bj-0 --days 120 --write journey-beginner-bj-0-84db36b7.json
```

Both exited 0, in 26 seconds each, in a clone checked out at `84db36b7`. They read what the four areas' code reads,
week for week. The judge's first phase alone read what brief 09 read. The changes after `84db36b7` (the judge's,
the stamina's) moved only the last weeks.

Where brief 09's advice named vocal or physical expression for a week between weeks of focus, the advice now names focus.
The advice now grows the hours as the engine does, reads the work at full precision, and works the days' discipline once
across every recent piece. F2-A10 measured it on 120 fresh held-out cases on the final code
(`../advice/final/`): its first-named input is the one whose training brings the most.

The journeys' student never trains the named input. `tools/brief-journeys.ts` tapes briefs and reads the weakness only to
pick a brief that shows it (`nextBrief`). So focus rises only through the work, about a point every two weeks, and
the right advice stays right for longer than L1 allows.

## Why It Wasn't Fixed

Naming another input after 4 weeks would name one whose training brings less, and that is what F2-A10 (b) fails. No fix
moves L1 back without moving the advice off the best input. L1's own words, "changes or is acted on," describe a
player who acts. F2-A10 (h) measures that player: after 20 sessions of the advised exercise, the trained input's gain
falls on every case, and the first-named changes wherever another leads.

So L1 is counted not met and put to the owner (`docs/verification/integration-2026-10-16/criteria.py`, the L1 row,
Decision Required). The question and the recommendation are there.
