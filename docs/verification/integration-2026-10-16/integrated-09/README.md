# Brief 09's Criteria On The Integrated Tree, 2026-10-16

The judge area measured its criteria on its own clone (`d7127819` and its commits, `../followup-09/`), and the genre area
on its own (`d7127819` and its commits, `../genres-09/after/`). Neither clone held the other's changes: the genre area
replaced fourteen genres' second briefs, which the I, S, G, H and L figures read, and the judge area cut scenes and plays
into their units (`evaluation-10`) and added Scapin's sack scene, which the stage, M and H figures read. Here they were
measured together, on `c9cba9c8`: the judge's 24 commits cherry-picked onto `a87d84ed`, which held the genre, banking,
coverage and journeys areas' work. The gate passed on that commit first: 368 files, 4,393 tests, none skipped, and all
eighteen checks.

`measure.sh` ran the judge area's commands (`../baseline-09/README.md`), one after another, into this folder; every exit
is 0 (`exits.txt`). `figures.py` reads each criterion's figure from the outputs into `figures.json`, which
`../criteria.py` reads for the completion matrix: no figure here was typed.

## What Moved, And Why

- **The stage (ST1 to ST9, F1, F2):** every figure is the judge clone's. The 124 leaves of `stage.json` differ from
  `../followup-09/stage.json` in 18, every one in I2 or the held-out sample.
- **The attributes (A, T, G3 to G5, M, O, H):** every verdict is the judge clone's, line for line in `criteria.txt`.
  The figures that read briefs moved with the genre area's: A2's highest pair 0.518 → 0.532, G3's most 53 → 50 of 149,
  G5 51.22 → 51.13 at 30 known and 53.86 → 53.74 at 100, M1's brief cases 4,495 → 4,560 (more readings), H2's brief
  count 96 → 94 of 298, O2 93.07 → 93.05; H4 stays 1 of 12 and H4′ 11 of 12, each ability's share a little apart.
- **I2 and the held-out sample's I1, I3, I4, I5:** the genre area's new briefs. Each is what that area measured
  (`../genres-09.md`): I2 pace 26.8%, scale 23.5%, structure 35.6%; the held-out I1 9,378 of 9,378 at 100.
- **S1 to S4 and G2:** `signature.json`, `signature-fresh.json`, `signature-validate.json` and `genre-identity.json`
  are byte for byte the genre area's after (`../genres-09/after/`): the judge's changes reach none of what they read.
- **The genre audit:** the genre area's, but for three genres' counts of class scenes by the side they suit, which the
  judge's new scenes moved: comedy 13 restrained and 15 expansive to 14 and 16, drama 4 expansive to 5, tragedy 16
  expansive to 18. Its isolation is unchanged: 149 of 149, and 0.
- **L1 to L3:** the 120-day journeys played some of the fourteen retired scenes, so they differ from the judge clone's.
  The specialist's last month is 64.3 where it was 64.0, of 13 takes where it was 14; L3′'s controlled curve rises
  from 62.29 to 65.71 (it was 61.62 to 65.17), the beginner's from 54.51 to 57.56, with no fall.

## The Four Not Met As Written

| Criterion | Here | Proposed, not counted |
|---|---|---|
| ST3 | 178 of 189 the same on stage and close; 11 a tenth apart, no rounding defect | ST3′ 189 of 189 (`../st3.md`) |
| ST6 | restrained 9 of 42 against the grain (expansive 22 of 50) | ST6′ 26 of 42 (`../st6.md`) |
| H4 | 1 of 12 (2 of 12 before `evaluation-10`) | H4′ 11 of 12 (`../h4.md`) |
| L3 | the specialist 65.5 → 64.3; the beginner 54.0 → 56.8, met | L3′ 62.29 → 65.71 and 54.51 → 57.56 (`../l3.md`) |

F2 as written still fails (67.6%); F2-A measures the advice in its place, and is measured again with the long runs.
