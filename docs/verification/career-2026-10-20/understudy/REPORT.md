# D6, The Understudy's Part (Brief 18's U1, Done For The Career), 2026-10-21

**Status: Fixed And Verified.** Branch `b19-understudy`, head `ef512f61`, merged into the working branch. (Its builder
couldn't write this file from its own clone; the coordinator committed it from the builder's report, unchanged in
substance.)

## What Was Wrong
The Rep's casting gave an understudy a lead written for them, or nothing. An Enemy Of The People has no lead for an
actress, and Mrs Warren's Profession none for an actor. So such a student understudied "An Understudy In The Company".
Played on seed us-86 before the fix (`sequence-before.txt`):
- the casting notice named nobody: "You'll also understudy in Yale Rep's An Enemy Of The People";
- the calendar read "On Call", with no part;
- sent on, she was told "You're On Tonight At Yale Rep" and "An actor you cover is out";
- each night was judged as the play's lead (difficulty 0.3, on stage 75% of the playing);
- the milestone and the credit read "An Understudy In The Company".

## What's Built
- **`school.ts:2319` `coveredPart`:** the biggest part the play writes for them or for either, so a lead, else a
  supporting part, else a featured one. That gives Petra Stockmann for an actress in Enemy and Frank Gardner for an actor
  in Mrs Warren's. Labeled SLATE's estimate: the Rep doesn't publish understudy assignments.
- **`:2335` `partSizeOf`:** a casting's own size, else the covered part's size in its play, else a lead's (The Seagull's
  Nina and Konstantin). It's read from the play, never stored, so there's no new save field and the schema stays at 94.
- **`:2993` (the casting):** an understudy is cast to `coveredPart`.
- **`:3012` / `:1201` `onCallFor`:** the calendar reads "On Call For Petra Stockmann".
- **`:3098` / `:1208` `coverWhy`:** the notice adds "Its leads are written for actors, so the part you cover is a
  supporting one."
- **Judged at the covered part's size:** the night in `reckonNight` (`:3646`), the hours on stage (`:3833`), the evening
  of a night on call booked before 2026-09-28 (`:3818`), and the part's piece and A Night Now (`workpieces.ts:116`,
  `:122`).
- **Casting tab** (`SchoolWorkspace.tsx:490`): "Petra Stockmann (Understudy), A Supporting Part".
- **Guide** (`productions.ts:282`, `:640`): the Yale Rep and How Hard rows now say what's true.
- **One-time mark:** `nameTheCover` (`school.ts:1726`, `index.ts:282`, `:451`).

## Through The Run (seed us-86, after; the test plays the same life)
- **Casting:** `school.rep` role Petra Stockmann, size supporting.
- **Notice:** "You'll also understudy Petra Stockmann in Yale Rep's An Enemy Of The People: … Its leads are written for
  actors, so the part you cover is a supporting one."
- **Calendar:** all 14 nights on call are named for the part.
- **Preparation:** A Night Now at 0.2 difficulty, 50% on stage.
- **The call:** "You're On Tonight As Petra Stockmann", and the curtain on the calendar reads "…: You're On As Petra
  Stockmann".
- **The night:** judged at 0.2, size supporting, with a supporting part's stage hours.
- **Feedback:** "You played Petra Stockmann through for the director today…"; the director's note; the milestone "Petra
  Stockmann, An Enemy Of The People".
- **Credit:** `{production: "Yale Rep's October Production", role: "Petra Stockmann", kind: "understudy", year: 2027,
  wentOn: 1}`.
- No notice she reads keeps a word of the company's cover.

## A Save From Before (`nameTheCover`, once)
- **Nothing of its run judged, run still open:** the casting is given the part, and the player is told once: "Your
  Understudy Part: Petra Stockmann. You understudy Petra Stockmann in Yale Rep's An Enemy Of The People. Its leads are
  written for actors, so the part you cover is a supporting one. Your calls are on your calendar as before." The before
  game's own save from 31 August 2027, opened on the fix, plays exactly like a new life (nights 46.4 and 47.5).
- **A night gone on, a run-through played, or the run closed:** the company's cover is kept to the end of the run. Its
  nights were judged as the play's lead, and naming a part now would credit it with nights it never had. That save plays
  exactly as before (42.5 and 43.6).
- Every understudy's calls still to come are renamed for their part. Credits already filed and notices already
  delivered stay as they were.

## The Judge's Figures
- **What moves:** only the nights of an understudy whose covered part isn't a lead: the run-through, a night sent on, a
  night on call booked before 2026-09-28, and A Night Now (difficulty 0.2 instead of 0.3, a share of the evening of 0.5
  instead of 0.75).
- **On us-86:** the Enemy nights went from 42.5 and 43.6 to 46.4 and 47.5, and A Night Now from 37.9 to 41.4. The rest of
  the run's summary is identical.
- **What doesn't move:** an understudy of a lead, The Seagull's understudy, and every other casting.
- **`measure.sh` reads no understudy:** `stage`, `ag`, `genres` and `mono` judge materials only; `indirect` is the first
  spring's festival; `journeys-a` and `journeys-b` end on 22 December 2026, before the first Rep casting on 4 January
  2027; `mutations` and `test-mutations` use those tools and `decisions-judge`. Brief-journeys beginner bj-0 and
  h4-indirect ran byte-identical on the old and new trees (`judge-runs.txt`).
- **Runs that do read understudies:** `journeys.ts`, `lives.ts`, `mastery.ts`, `variety.ts`, `workload.ts`, `voices.ts`
  at 14 months or more, and the multi-year `scenarios.ts` runs. In them only a company understudy's nights move.

## Tests
`tests/understudy-part.test.ts`:
1. `coveredPart` across every Rep play, for an actor and an actress.
2. `partSizeOf`.
3. The PLAYER JOURNEY on us-86, from casting to credit.
4. A save from before with nothing judged: named, told once, counted (1, then 0), calls renamed, played on.
5. A save from before already judged, three ways (gone on, run-through played, closed): kept.
6. A night on call booked before 2026-09-28: costs the covered part's evening.

Mutations: 16 of 16 killed (`mutations.txt`, `mutate.py`). Run with `--maxWorkers=1 --minWorkers=1`: 31 related files
(507 tests) passed, and the 33 files importing workpieces, SchoolWorkspace or the guide and the 10 that read
`universe.opened`. `eslint` exits 0. `tsc` exited 0 as its builder ran it, but the gate's own typecheck, `tsc -b
--noEmit`, failed on test 1's lookup of the sizes bigger than a part (`lead: []` typed as holding nothing); that was
found at the core's merge and the lookup typed there. Every gate check without the suite exits 0 but
`completion-matrix --check`, whose 46 rows measured before `school.ts` and `index.ts` changed now read Verification
Incomplete until they're measured again on the integrated branch.

## Evidence (this folder)
- `sequence-before.txt`, `sequence-after.txt`
- `sequence-save-from-before-unjudged.txt`, `sequence-save-from-before-judged.txt`
- `rendered-casting-before.txt`, `rendered-casting-after.txt`, `rendered-casting-save-from-before-opened.txt`
- `runs/*.json`, `judge-runs.txt`, `mutations.txt`, `mutate.py`

## Assumptions
- **ASSUMPTION (SLATE's estimate):** which part an understudy covers. It extends the earlier estimate, "a lead written
  for them".

## Limits
- A night's work record names the play, as every night's does. The part is carried in its size and difficulty, the run
  record, the milestone and the credit.
- No built-app walk was made of the Casting tab (it was drawn with react-dom/server), and no run line was added to
  `tools/scenario-saves.mjs`; the integration's walks cover the Casting tab.

## Shared Files Touched
`src/engine/index.ts` (`ONCE_ON_OPENING` and its block), `tools/scenarios.ts` (the `understudy` hook),
`src/engine/systems/workpieces.ts` (2 calls), the four tests pinning the opening list (decisions-arion, scope-health,
remaining-banking, genre-mastered), `docs/text/{statuses,second-pass,surfaces}/school.json` and the regenerated
inventory, SURFACES and TRACEABILITY files, and `docs/verification/gaps-2026-10-20/criteria.md` (U1).
