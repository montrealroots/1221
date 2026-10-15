# School Workload: Why An Attentive Student Was Dismissed, And What Changed, 2026-10-16

The owner's brief "Finish School Workload Balance And The Remaining Acting-Engine Shortfalls", parts 1 to 3 and 7. On
`claude/zen-mccarthy-i88ujw`, from `5b27379a`. Not merged, not deployed.

`tools/workload.ts` measures each term of one life, played through the public commands by the policy `tools/lives.ts`
plays (`tools/policy.ts`):
- **Supply.** Every hour of the life, by what took it: sleep, each scheduled item the student was at, each command that
  took time, and the idle hours inside the policy's working hours (from 15:00, from 10:00 at weekends, to 22:00) and
  outside them.
- **Demand.** The hours each piece set in the term takes to complete from nothing at full focus, by its cheapest steps.
- **At the showing.** Each part against what completes it.

"Old" is `5b27379a` with only the tool added (`old-*.json`). "New" is this branch (`new-*.json`). Each pair has the same
seed and profile, and 1.4 years: three full terms and the start of a fourth.

## The Trace, London, Seed `lives-0`, The Third Term (Fall 2027)

| | Old | New |
|---|---|---|
| Pieces set, shown | 46, 46 | 46, 46 |
| Hours to complete them all from nothing | 563 | 563 |
| Of which the partner part | 87 | 87 |
| Hours prepared, by the student's own steps | 560 | 500 |
| Hours rehearsing with the partner | 12 | 52.5 |
| Hours run with a reader | 0 | 32 |
| Idle hours inside working hours | 292 | 292 |
| Sleep | 931 | 931 |
| Classes, calls, shifts | 414, 132, 78 | 414, 132, 78 |
| Unready at the showing | **24 of 46** | **11 of 46** |
| Standing after the term | concern (warning in the fourth, dismissed in the fifth, `../journeys-2026-10-16/`) | good |

**What happened, piece by piece.**
- **The partner part was left at nothing.** A scene's partner part stood at nothing on most scenes: of the 46 pieces, 15
  were shown with the partner part short, and 21 with rehearsal short. Rehearsal is held to the least of the parts it
  reads.
- **What a part at nothing costs.** The showing reads each dimension through the least prepared part it bears on
  (`EVALUATION.prepFloor`, 0.35). So a part at nothing held the dimensions that read it to about a third of themselves,
  whatever else was prepared.
- **It wasn't time.** The term's demand, 563 hours from nothing, fit inside the 864 hours the student spent preparing,
  rehearsing or left idle in working hours. The student had 292 working hours left over, with the same sleep.
- **The policy's own choices.**
  - **It never asked.** Rehearse With Your Partner is asked for (`school.ask_partner`) and kept in the evening. The
    policy skipped every step on the partner part, and rehearsed only when a partner asked.
  - **It never used the reader.** Run It With A Reader, the daily step that works the part without the partner, was
    skipped with them.
  - **It over-prepared the rest.** Each other part went to 0.95, past the 0.9 that completes it.
- **It's not the old line's alone.** The same failure happens on `35d032d` and `1bb76ac`
  (`../journeys-2026-10-16/london-lives-0-*.json`).

## The Classification

| Candidate Cause | Finding |
|---|---|
| A scheduling or engine defect | **No.** Every piece was set, shown and judged by its rules. Nothing was double-booked or lost. Breaches 0 on every run. |
| An unrealistic workload | **No.** Demand was 503 to 582 hours a term, against 863 hours or more prepared, rehearsed or idle in working hours in every old run's term, with no sleep cut. |
| A weak policy | **Yes, the cause.** It never worked the partner part, and over-prepared the rest. |
| Poor player choices | The same thing, for a player: the screen led a player to the same choices (below). |
| Misleading labels and late feedback | **Yes, contributing.** A part's "Weighs 15%" read as "worth 15% of the result". It reached no result: the showing reads the least part (`content/guide/coursework.ts`, 2026-10-12). Nothing said what a piece would come to before the showing. Nothing warned in the term. The review's notice named the count and not the cause. |
| Legitimate consequences | **Yes, for neglect.** A student who prepares nothing is Unready on every piece and dismissed in the third term, before and after (`*-neglect.json`). |

London's share crossed the review's mark before the other profiles did. That's this seed's draw of scenes and partners
on the same policy, not where the student was born: on seed `lives-0`, New York and Mexico City were 22 of 46 in the
same term (`old-new-york-lives-0`, `old-mexico-city-lives-0`).

## What Changed

The game:
1. **Shown Today** (`showingForecast`, `CourseworkPane`). Each open piece says what it would come to shown today on a
   good day, with no draw, by the showing's own judge. It says what holds it back most, and each part short of complete
   with the steps that answer it (`shortParts`, `remedyWords`).
2. **The labels.** A part's figure reads "Weighs N%; complete at 90%".
3. **A Word On Your Coursework** (`termWarning`). Once 6 of a term's pieces have been shown, and 35% or more of them
   were Unready (the review's 50% less a margin of 15 points), a notice comes, once a term. It says:
   - how many were Unready;
   - the part most often short on them, and the steps that answer it;
   - how many pieces are still to come;
   - the day the faculty reviews the term.
4. **The review names the cause.** The term's notice of concern now names the part most often short on the Unready
   pieces, and what answers it.
5. **Due Soonest** (`urgentWork`). The open work is listed soonest due first, and two due the same day by which would
   come out lower. Due Soonest names up to three pieces still short.
6. **The guide and the tutorial** say all of the above (`coursework.prepare`, the school chapter).

The policy (`tools/policy.ts`), the stand-in for a reasonable player:
- **The partner part.** It asks the partner for an evening at least the required hours ahead, and runs it with a reader
  where nothing is booked.
- **Every other part** is prepared to what completes it, 0.9, not 0.95.

**Not changed:**
- the review's mark (50%), the band thresholds, and what completes a part;
- `prepFloor`;
- starting attributes;
- any preparation the student didn't do.

A student who neglects the work is warned in the first term and dismissed in the third, as before.

## The Matched Runs (`*.json` beside this file)

Unready of shown in each of the first three terms, and the standing at the end (1.4 years):

| Profile, Seed | Old | New |
|---|---|---|
| London, lives-0 | 16/47, 12/45, 24/46: concern | 9/47, 4/45, 11/46: good |
| London, lives-1 | 12/47, 10/45, 24/46: concern | 5/47, 4/45, 15/46: good |
| London, lives-2 | 15/47, 14/45, 24/46: concern | 5/47, 7/45, 12/46: good |
| London, lives-3 | 13/47, 12/45, 23/46: concern | 5/47, 3/45, 9/46: good |
| New York, lives-0 | 15/47, 9/45, 22/46 | 9/47, 0/45, 7/46: good |
| Mexico City, lives-0 | 15/47, 9/45, 22/46 | 9/47, 0/45, 9/46: good |
| Scraping, Los Angeles, lives-0 | 15/47, 9/45, 22/46 | 9/47, 0/45, 9/46: good |
| London, lives-0, neglect | 47/47, 45/45, 46/46: dismissed | the same: dismissed, warned in the first term |

- **The hours moved, and the total didn't.** In every new run the student spent 77 to 142 hours a term with the partner
  or a reader. Their own steps on the other parts took 76 to 148 fewer hours, since nothing went past 0.9. Sleep was
  within 6 hours of the old run's, and the idle working hours within 30.
- **The scraping student kept the same school hours.** The policy takes its shifts and pays its bills in the hours
  outside the school's, so money didn't take hours from the coursework here. Money's own pressures are in the 24 lives
  (`../journeys-2026-10-16/`).
- **Breaches 0, in every run.**

## Remaining

- **Scenes are still Unready in the new runs**, 9 to 15 of 46 in the third term. They're short on rehearsal and the
  partner part where a partner couldn't come in time and a reader's daily step didn't cover it. That's under the
  review's mark, and what a player answers by asking earlier: Due Soonest and Shown Today say when.
- **The policy is one player.** A player who asks for every evening a week ahead would do better than it; one who
  ignores the warning will fare as the old runs did.
