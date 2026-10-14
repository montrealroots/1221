# Acceptance Criteria, Written Before Any Tuning

Phase 1 of the owner's brief "Perfect The Attributes, Genres, And Their Integration Through Demonstrable Gameplay",
§3 to §8. Each criterion was written before any of phase 2's tuning. Each has:

- its rationale;
- the measurement that decides it;
- the threshold;
- where the measurement lives (`baseline.md`, with the commands and seeds).

The thresholds are SLATE's judgement of "demonstrable", said as numbers so that a change can be seen to pass or fail.
Phase 2 may not move a threshold to fit a result. A threshold that turns out wrong is changed here first, with the
reason, before the code that would pass it.

Terms used throughout:

- **The pieces.** 427 judged pieces: every brief (298), every class scene (56), every play as a night (30) and as
  casting reads it (30), and every coursework template not judged as a scene (13). Each is judged fully prepared, at
  readiness 100, with no draw, unless the criterion says otherwise (`tools/ag-baseline.ts`).
- **The even actor.** Every ability at 50 and every technique at 50.
- **A specialist.** 85 on one ability, with the other eleven lowered evenly to keep the even actor's 600.
- **The effect of an ability.** The change in the whole when the even actor gains +10 on it.
- **Where it reads most.** The pieces where an ability's effect is at or above the median of its nonzero effects.

## §3 Attributes: Each Distinct, Each Causal, No Universal Bonus, Training That Teaches

| Id | Criterion | Rationale | Measurement | Threshold |
|---|---|---|---|---|
| A1 | Every ability is causal somewhere | An ability that moves nothing a player can see is a declared word with nothing reading it (THE ONE RULE) | The mean effect of +10, by kind of work (baseline §1) | Each of the 12 has at least one kind of work where its mean effect is 0.5 or more |
| A2 | No two abilities do the same job | Two inputs with one effect pattern are one input with two names | Pearson correlation of two abilities' effects across the 427 pieces (baseline §1) | No pair at 0.9 or more |
| A3 | No ability is a universal bonus | An input that raises everything by about the same amount decides who's best everywhere, so specialization stops meaning anything | For each ability, the share of pieces it moves (\|Δ\| ≥ 0.05) and the spread of its effect over them (cv = sd / mean) (baseline §1) | No ability moves 95% or more of the pieces with a cv under 0.30 |
| A4 | What the game says an ability does, it does | Prose here is load-bearing; a false sentence teaches a wrong strategy | Every claim in `ABILITY_DEFS[].develops` and `.affects`, and every on-screen sentence naming an ability's effect, checked against a code path (`attributes-matrix.json`, flags of kind "misleading description") | 0 false claims |
| A5 | Every ability can be developed by an action the player chooses, and says what moved | The player must be able to act on a weakness | An exercise, a workout or a stated daily habit for each, and a feedback line after it (`practice.ts:164-194`) | 12 of 12 |
| T1 | Training communicates its value before and after | A player choosing an hour should know what it buys | The practice control shows the expected gain before the hour; feedback after says the gain, tier, repeat and when work stops reading the level (a technique past 90) | Shown before; said after; past 90 said |
| T2 | Training resists exploits | Repetition without thought must never be the best use of an hour | (a) four hours of one exercise in a day against four different ones, in sessions' worth; (b) a fifth hour refused; (c) an action sent twice lived once; (d) genre practice credited an hour by taping unprepared against preparing (played, `tools/brief-strategies.ts`) | (a) at most half; (b) refused; (c) once; (d) taping unprepared earns no more genre practice an hour than preparing |
| T3 | Caps don't erase progression early | A cap reached in the first quarter of a range makes the rest of it label-only | (a) the deliberate gain an hour at 90 against at 30; (b) the share of each 0 to 100 range that the work it is named for reads: an ability by the work, a technique by the work (read to 90), a genre known by its own taped briefs (read to 30) | (a) at least 25%; (b) every range read over at least 80% of its length |

## §4 Genres: Distinct In Play, Not In Label

| Id | Criterion | Rationale | Measurement | Threshold |
|---|---|---|---|---|
| G1 | A genre's label predicts what its work asks | If a genre's two scenes are no more alike than two genres are, the genre is a label | L1 distance between genre profiles (dimension shares ×10 and the 12 ability effects, the mean of its briefs) against the distance between its own two briefs (baseline §3) | The median distance between genres is at least 1.5× the mean within a genre; at most 15 genres have a neighbour nearer than their own second brief |
| G2 | No two genres differ only in words | A take the engine reads identically under two names is one piece of content | Briefs of different genres identical in every number the engine reads (medium, size, stakes, reader, features, language, staged techniques, beat tones), readings aside (baseline §3) | 0 pairs |
| G3 | Different genres reward different actors | A genre catalog whose every entry is won by one kind of actor offers one strategy | The best of 13 equal-budget actors on each genre's briefs (baseline §3) | No actor best on more than 50% of genres; at least 4 actors best on 10 or more genres each |
| G4 | Every genre offers enough to play | Variety needs more than one scene and more than one reading | Briefs written for each genre; readings for each; the reader's way of playing varied within the catalog | At least 2 briefs and 4 readings for every genre; at least 3 reader behaviours in use |
| G5 | Genre proficiency progresses across its range | Knowing a genre should keep mattering past its first hours | The effect of known from 0 to 100 on the genre's own taped briefs (baseline §5) | A rise from 30 to 100 known still changes something on its own briefs (the take, the time its preparation takes, or what is offered), by an amount the screen shows |

## §5 The Mastery Guarantee, Executable

| Id | Criterion | Rationale | Measurement | Threshold |
|---|---|---|---|---|
| M1 | Maximum personal work quality under the qualifying conditions (formulas.md §7) is exactly 100 on every judged piece | The guarantee the code and the guide promise | Mastered actor on every brief × reading × fitting way, every scene, night, casting and coursework template; drawn keys at mastery (baseline §4) | Every case 100 and `mastery: true`; 0 drawn cases off 100 |
| M2 | Mastery is reachable through play | A guarantee no played life reaches is a sentence | `tools/mastery.ts --mode plan` in two genres through the public commands | Both reach 100 taped. Not re-run in phase 1: the earlier pass's `docs/verification/briefs/mastery-*.json` stands as prior evidence, to be re-run on phase 2's code |
| M3 | Nobody else can hold a player's own result under 100 when the player has done all the player controls | The owner's requirement that a partner's mistake mustn't lower a mastered player's own result (`systems/ensemble.ts:10-11`) | A mastered actor's own result on each class scene with the partner part at 0 and at 0.45, the partner never or half attending (baseline §4) | 100 in both, or a refused or substitute route to the partner part that the player controls |

## §6 Outcomes Kept Apart

| Id | Criterion | Rationale | Measurement | Threshold |
|---|---|---|---|---|
| O1 | Your own result is invariant to the reader or partner's quality | Personal and ensemble are different questions | A mastered actor's own result on 263 camera briefs with three readers (baseline §4) | Own: sd 0 across readers |
| O2 | The take together is reported apart and moves with the reader | The ensemble result must be real, not decorative | The together result across the same three readers | It differs between readers by at least 5 points on average |
| O3 | Grades and bands read the personal result; casting reads the expected personal; preparation and condition are named as limits, not folded into ability | Separation the player can see | Code reading (formulas.md §6) | Holds for every reader of a result |

## §7 Feedback From Evaluation Evidence

| Id | Criterion | Rationale | Measurement | Threshold |
|---|---|---|---|---|
| F1 | Every note names what the evaluation found | Feedback invented apart from the judgement teaches the wrong thing | Each feedback source traced to its input (formulas.md §5) | Every source reads the evaluation's limits |
| F2 | Acting on the first-named weakness pays more than training at random | Feedback should point at the best next step | +20 on the first ability or technique limit against +20 on the mean read ability, and against an unread one; 6 drawn actors × 1 brief in 4, prep 0.6 (baseline §8) | Named at least 2× the mean read; unread exactly 0; named is the largest gain in at least 80% of cases |
| F3 | Feedback says the condition and the preparation apart from ability | So a player doesn't train an ability to fix a missing step | Recommendations' kinds (`experience.ts:149-210`) | Preparation, condition and fit each have their own words |

## §8 Balance

| Id | Criterion | Rationale | Measurement | Threshold |
|---|---|---|---|---|
| H1 | Relevant growth improves relevant outcomes, and irrelevant growth doesn't | Causality the player can rely on | F2's figures; an unread +20 (baseline §8) | As F2 |
| H2 | No universally dominant allocation | One best build makes every choice of what to train the same choice | Best of 13 equal-budget actors on each piece, by kind (baseline §2) | No actor best on more than 50% of the pieces of any kind with 30 or more pieces |
| H3 | No universally dominant way to spend hours | Same | `tools/brief-strategies.ts`, five ways × 24 hours, matched seeds `bs-0..2` and held-out `bs-10..12` (baseline §10) | No way best on every measure; held-out briefs within 1 point across ways; matched and held-out agree in order |
| H4 | Specialists are advantaged on suitable work | Specializing should pay where the work calls for it | Each specialist against the even actor where its ability reads most (baseline §2) | Ahead on at least 60% of those pieces for at least 10 of 12 abilities |
| H5 | Generalists are useful | Balance shouldn't punish breadth into irrelevance | The even actor against the 12 specialists on each piece (baseline §2) | Ahead of at least half the specialists on at least 50% of pieces; within 1 point of the best on at least 10% |
| H6 | Caps don't erase progression early | As T3 | As T3 | As T3 |
| H7 | Randomness doesn't overwhelm skill, and still exists | Luck should colour a night, not decide who's better | Actors 10 levels apart on 100 briefs × 60 draws each: the better one's share of takes below the worse one's; the spread of one actor's takes (baseline §7) | Better loses under 10% at every level; a developing actor's takes range at least 1 point |

## Long-Term Continuity

| Id | Criterion | Rationale | Measurement | Threshold |
|---|---|---|---|---|
| L1 | Repeated feedback changes or is acted on | A note given for weeks unchanged is noise | The top recommendation each week of a 120-day played term (`tools/brief-journeys.ts`, beginner and specialist, seed `bj-0`): the longest run of one target | At most 4 weeks running without its input rising 5 points |
| L2 | No mindless repetition | Variety and purpose of takes | The same take twice in a row with purpose "again" (same journeys) | 0 |
| L3 | A learning student's work improves over a term | Progression must show in outcomes | Monthly mean of takes (same journeys) | The last month's mean is at or over the first's for every non-mastered profile |
