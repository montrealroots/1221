# The Long Journeys On The New Implementation, 2026-10-16

The owner's brief "Finish Genre Interpretation, Improve Training Advice, And Prove Long-Term Integration", part 5. Every
run here was played on the code after the interpretation, advice and notes changes (the engine of `939e4fbc`; the
commits since change the guide, the tools and words, not what these runs read), in a scratch copy of the tree, through
the public commands, with each save written and read back as the tools do. Each file beside this one is a run's own
output.

## Graduation-Length Lives

`npx vite-node tools/lives.ts -- --years 3.2`: the six profiles, four seeds each (`lives-0` to `lives-3`), played
attentively (or on autopilot, or practicing) to 3.2 years. `lives.jsonl`. Played four times over by mistake (the
single-life flag is `--why`), and the four outputs were byte-identical: the lives are deterministic.

| Profile | Graduated | Breaches | Unbalanced | Errors | Reloads |
|---|---|---|---|---|---|
| New York, attentive | 4 of 4 | 0 | 0 | 0 | 152 |
| Mexico City, attentive | 4 of 4 | 0 | 0 | 0 | 152 |
| London, early riser and curious, attentive | **0 of 4**: dismissed | 0 | 0 | 0 | 152 |
| Reykjavik, autopilot | 0 of 4: dismissed, as on 2026-10-10 | 0 | 0 | 0 | 152 |
| New York, practicing | 4 of 4 | 0 | 0 | 0 | 151 |
| Scraping, the flu and an injury, attentive | 4 of 4 | 0 | 0 | 0 | 152 |

**London's dismissal is a real failure, and it predates this brief:**
- **How it unfolds.** Good, good, concern in the third term, warning in the fourth, dismissed in the fifth, with
  attendance at 100% and craft growing ahead of the class every term.
- **The terms' own notices.** "24 of the 46 pieces due in class were unready or not shown", then 26 of 46 and 24 of 45,
  and two productions that fell short.
- **It's not this branch.** The same life (`--why --seed lives-0 --profile "london, …"`) takes the identical path on
  `main` at `35d032d`, before any genre work, and on `1bb76ac` (`london-lives-0-35d.json`, `-base.json`, `-new.json`).
- **It isn't London alone.** Every attentive profile has most class scenes unready: 87 of 113 in New York, 90 of 113 in
  Mexico City, 57 of 113 for the student who practices. London's share is a little worse, and crosses the standing's
  threshold.
- **What it is.** It's coursework balance, outside this brief (which asks not to expand unrelated systems). It's
  recorded in the handoff and queued as its own task. The run of 2026-10-10 (`docs/verification/REPORT.md`) had London
  graduating, so it came in between: phase 2b's rebalancing is the first place to look.
- **Superseded the same day.** The owner's next brief took it up (`../workload-2026-10-16/`). The cause wasn't phase
  2b's rebalancing: the play policy never worked a scene's partner part, and the game didn't say what that cost. Played
  again on that code, London graduated on 4 of 4 seeds (`after-workload/`), and again on evaluation-8
  (`../stage-2026-10-16/runs/lives.jsonl`), where 20 of the 24 lives graduated and the four dismissed were the
  autopilot control's.

## The Played Mastery Plans

`npx vite-node tools/mastery.ts -- --mode plan --genre <id> --seed <seed> --years 8`: a student who trains, in turn,
everything the genre's brief reads, studies the genre and prepares the brief, tapes every thirty days, and tapes through
the command once everything is full. `plan-*.json`.

| Genre | Seed | First Tape | Graduated | Everything Full | Payoff Tapes | Breaches |
|---|---|---|---|---|---|---|
| Nordic noir | m-0 | 57.6 | 2029-05-21 | 2029-12-11 | 100, 100, 100 (mastery) | 0 |
| Nordic noir | m-1 | 58.2 | 2029-05-21 | 2029-12-18 | 100, 100, 100 | 0 |
| Social realism | m-0 | 60.2 | 2029-05-21 | 2029-12-11 | 100, 100, 100 | 0 |
| Social realism | m-1 | 59.9 | 2029-05-21 | 2029-12-18 | 100, 100, 100 | 0 |
| Musical | m-0 | 56.4 | 2029-05-21 | 2030-11-01 | 100, 100, 100 | 0 |
| Slapstick | m-0 | 58.7 | 2029-05-21 | 2031-01-15 | 100, 100, 100 | 0 |

- **The former pair, mastered.** Nordic noir and social realism, once one of the seven identical pairs, both reach 100
  on every payoff tape, on two seeds.
- **They start apart.** Their tapes on the way differ from the first: 57.6 against 60.2 on seed m-0, for the same
  student.
- **The genres with demanding technique take longest.** Musical (song and voice) and slapstick (timing and the body)
  reach full later.

## Repetition, Stale Advice, Bottlenecks And Dominant Strategies

**Variety, three years** (`tools/variety.ts -- --seed v-0 --years 3`, `variety-v-0.json`): graduated, with 0 breaches and
0 unbalanced.
- **Advice:** 9 distinct top recommendations over 157 weeks. None was given for an input at full, none stuck while its
  input didn't grow, and the longest unresolved was 3 weeks.
- **Practice:** 2,037 hours, each hour's feedback different, and the same situation 3 times in a row at most.
- **Notes:** 33 director's notes, none said again after it was taken, and no note's text twice in a row.
- **Work decisions:** 72 of 157 weeks had no decision about how to do the work beyond practice's own daily choice. That
  was so before, and is said here, not changed.

**Brief journeys, 120 days** (`tools/brief-journeys.ts`, a beginner and a specialist on seeds bj-0 and bj-1,
`bj-*.json`):

| | Notes As Shown, Distinct | Longest Same Note In A Row | Same Note In Another Genre | Weeks, Longest Same Top Advice |
|---|---|---|---|---|
| Beginner, bj-0 | 13 | 2 | 1 | 5 (vocal, rising 52 to 55) |
| Beginner, bj-1 | 10 | 2 | 1 | 3 |
| Specialist, bj-0 | 10 | 2 | 0 | 4 (focus, at 50, where it's still the best) |
| Specialist, bj-1 | 9 | 2 | 0 | 4 |

The advice stays on a target while it's still forecast the most worth training. The longest such stretch, five weeks,
was an input rising every week.

**Strategies, 24 hours each** (`tools/brief-strategies.ts -- --seeds bs-0,bs-1,bs-2`, `strategies.json`): no way of
spending the hours is best on every measure.
- Training gains the most ability (+1.93) and the best held-out briefs (58.21).
- Repeating takes gives the best mean take (53.52).
- Breadth gives the most genre practice (47.61).
- Across the five ways, the held-out briefs lie within half a point of each other (57.76 to 58.21).

## Played Again After The Workload And I3 Changes (Later On 2026-10-16)

`after-workload/` holds the same 24 lives and six mastery plans, played on `0cdbbe0c`: the coursework changes
(`../workload-2026-10-16/`) and I3's (`../interpretation-2026-10-16/i3-review.md`). Each life was its own `--why` run
(`npx vite-node tools/lives.ts -- --why --seed lives-N --profile "<name>" --years 3.2`). The runs above are kept as they
were.

| Profile | Graduated, Before | Graduated, After | Breaches, Unbalanced, Errors | A Term Short, After |
|---|---|---|---|---|
| New York, attentive | 4 of 4 | 4 of 4 | 0, 0, 0 | seed 3: a concern in the fourth term |
| Mexico City, attentive | 4 of 4 | 4 of 4 | 0, 0, 0 | seed 3: a concern in the fourth term |
| London, early riser and curious, attentive | **0 of 4** | **4 of 4** | 0, 0, 0 | seeds 0, 2, 3: a concern in the fourth term |
| Reykjavik, autopilot | 0 of 4 | 0 of 4: concern, warning, dismissed | 0, 0, 0 | the control |
| New York, practicing | 4 of 4 | 4 of 4 | 0, 0, 0 | none |
| Scraping, the flu and an injury, attentive | 4 of 4 | 4 of 4 | 0, 0, 0 | seed 2: concern, then warning, in the third and fourth terms; seed 3: a concern in the fourth |

- **Every concern after the change was a production, not coursework.** Each review names a production that "fell
  short of what the program asks": Major Barbara, Woyzeck, Ghosts (three times), or Carlotta Festival Of New Plays and
  Hedda Gabler. Attendance was at 100% of what was asked, and craft grew ahead of the class.
- **Each student was back in good standing the next term**, and graduated.
- **The scraping student on seed 2** missed three class days excused (the flu and the injury) and had two terms short on
  its productions before it recovered.
- **The mastery plans**, after the change:

  | Genre | Seed | First Tape | Graduated | Everything Full | Payoff Tapes | Breaches |
  |---|---|---|---|---|---|---|
  | Nordic noir | m-0 | 57.5 | 2029-05-21 | 2029-11-17 (was 2029-12-11) | 100, 100, 100 | 0 |
  | Nordic noir | m-1 | 58.2 | 2029-05-21 | 2029-12-01 | 100, 100, 100 | 0 |
  | Social realism | m-0 | 60.2 | 2029-05-21 | 2029-11-17 | 100, 100, 100 | 0 |
  | Social realism | m-1 | 59.9 | 2029-05-21 | 2029-12-01 | 100, 100, 100 | 0 |
  | Musical | m-0 | 56.4 | 2029-05-21 | 2030-10-16 | 100, 100, 100 | 0 |
  | Slapstick | m-0 | 58.1 | 2029-05-21 | 2030-12-29 | 100, 100, 100 | 0 |

  Mastery is still reached on every one, with the same graduation day. Everything comes full 16 to 24 days sooner
  than before on every plan.
