# Brief 13, Journeys: Complete School Playthroughs, Continuity And Freshness (2026-10-17)

Read `common.md` first. Your area is `journeys`; your clone is `…/scratchpad/journeys13`, branch `journeys13`.

## The Owner's Ask

Brief 13's sections 4 and 6 are yours, whole, and section 7's guarantees where a journey shows them. Quote them in your
criteria as the owner wrote them. In short: at least twelve complete school journeys across several seeds and distinct
player profiles, played through the normal commands and progression, never by assigning outcomes:
- **Expected outcomes are set before each runs.** A deliberate neglect may legitimately end in dismissal; the game must
  explain and apply it. Not every dismissal is a defect, and nobody is forced to graduate. Some journeys recover from a
  setback through gameplay.
- **Ten things are checked on each:**
  1. creation choices affect the intended state;
  2. classes, preparation, rehearsal, interpretation and showings connect;
  3. attributes and genres develop and influence applicable work;
  4. advice responds to progress and changing circumstances;
  5. health, stamina and energy stay distinct and interact correctly;
  6. money, school charges, holds and payments reconcile;
  7. papers and document status affect the appropriate actions;
  8. warnings arrive consistently with later evaluations;
  9. term progression and the school's endpoint work;
  10. saving, exiting, reloading and continuing preserve the journey.
- **Continuity and freshness** across the journeys, not just their final scores.
- **Defects fixed,** each with a regression test and the affected scenarios run again.

## What Exists

- **`tools/lives.ts`:** whole lives through the public commands under four profiles. They are attentive, autopilot,
  practicing, and pressure (scraping money, the flu and an injury), reloading every month. It reports graduation,
  casting, standing, dials, money, breaches, an unbalanced ledger and reloads.
- **Other tools:** `tools/workload.ts` (a policy of preparing or neglecting coursework), `tools/brief-journeys.ts`
  (profiles beginner, developing, specialist and generalist, through briefs), `tools/mastery.ts` (a plan to mastery),
  `tools/advice.ts` with `tools/advice-harness.ts` (following, ignoring and partly following advice),
  `tools/variety.ts` and `tools/freshness.ts`, and `tools/scenarios.ts` (focused saves: leave, withdraw, nonfiler, lien,
  missed-plan, roundups and others).
- **What they found:** brief 11's and brief 12's final runs (`docs/verification/resolution-2026-10-17/runs/`): 24 lives,
  20 graduated, the four dismissed the autopilot control's; every run since the same, byte for byte.

## How To Work It

1. **Write the plan and the expectations first,** in `docs/verification/playthroughs-2026-10-17/journeys-criteria.md`,
   committed before any journey runs.
   - **Each journey:** its profile, seed, duration (a complete school journey runs to the degree or to the end the game
     gives it), and its expected outcome: graduation or dismissal, standing, setbacks and recoveries, what the advice
     should do.
   - **What each of the ten checks reads** in the journey's state, and what would fail it.
   - **The profiles cover the brief's list:**
     - beginners;
     - balanced generalists;
     - specialists with different strengths;
     - highly developed or mastered actors;
     - players who follow the advice, and players who partly follow or ignore it;
     - players with missed work, financial restriction or a health interruption.

     A profile's starting abilities, money or family set by hand is TEST SETUP, said in its name, as the tools say it.
     Everything after creation is played. At least two seeds per kind; at least twelve journeys.
   - **The focused scenarios,** for a financial, document or health branch no complete journey reaches naturally.
2. **The harness.** Reuse `tools/lives.ts` (extend its profiles and its report) where it serves, or a new tool beside it.
   Play through `sim.execute` and the clock, never by writing outcomes. Record per journey, as it goes:
   - the term-by-term state;
   - each warning and the evaluation that followed;
   - each advice read, and whether it moved when its input did;
   - the ledger's balance and the school account;
   - document status and the actions it allowed or refused;
   - each reload, and that the state after it is the state before.
3. **Run them** in parts of under ten minutes, each to a file, under `docs/verification/playthroughs-2026-10-17/journeys/`.
4. **Check each journey against its expectation.** A difference is either a defect (fix it, test it, run the affected
   journeys again) or an expectation that was wrong (say so, and why, without moving the expectation to fit).
5. **Continuity and freshness, across all of them:**
   - completed actions stay completed, and consequences and scheduled events occur once;
   - advice acknowledges what changed, and repeated feedback reflects the current state;
   - different suitable interpretations give understandable differences;
   - exercises and situations vary where the catalog allows;
   - repetition isn't disguised by words alone.

   Record every repeated situation and recommendation, how often, and whether it stays justified. Never rotate the
   advice to an inferior choice to shrink a count.
6. **Defects:** fix concrete ones with a regression test each. Nothing judged moves unless a defect demands it, said in
   your result (RULESET, `docs/ENGINE-MODEL.md`).

## Your Result

`docs/verification/playthroughs-2026-10-17/journeys-result.json`:
- **The playthrough table:** each journey's profile, seed, duration, expected and actual outcome, each of the ten checks
  passed or not with its evidence, and the issues.
- **The focused scenarios,** the same way.
- **The continuity and freshness record,** with the repetition counts and their justification.
- **The defects:** found, fixed, tested, and run again.
- **The commands and seeds,** for the coordinator to repeat on the tested commit.
