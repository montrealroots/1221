# The Frame Area's Batches

Brief 14's frame area (`../prompts/frame.md`): start, creation, the save slots, Home, notices, the shared controls, the
calendar and the clock. 475 sources and 25,084 words at the start, in 57 files. Each batch below says what was read,
what changed and what stayed, where a rewrite could have changed what's true and how that was checked, the tests and
tool matchers it updated, the checks with their exits, and the screens read.

The checks are run by `scratchpad/frame/checks.sh` (tsc, eslint on the files changed, title-case, label-sweep,
plural-check, voice-check, tics, spelling, typos, text-inventory, doc-refs, deciders), each exit read from a file.

## Batch 1: The Generic Failure, Notices And What Needs You

**Sources (37, in 7 files):** `src/engine/core/simulation.ts` (Simulation, and the three fault sentences it now
holds), `src/engine/core/events.ts` (EventBus), `src/engine/world/world.ts` (the decision and preference commands),
`src/engine/world/plans.ts` (the plan form's refusals, Skip It, Call It Off and the missed-plan notice),
`src/engine/world/place.ts` (the capital labels), `src/ui/looks/attention.tsx` (a question and a notice opened, every
part), `src/app/game-context.tsx` (CLOCK_FAULT, useGame). Two guide quotes of these refusals in `guide/day.ts`, and
the calendar's own fallback in `CalendarWorkspace.tsx`, were brought into line the same day; those files' sources are
marked in their own batches.

**What changed:**
- **The generic failure** (`simulation.ts`). A command that threw an error the game didn't foresee said
  `<command id> failed: <internal message>` in the player's toast. Now: "That didn’t go through because of an error in
  the game. It changed nothing and charged you nothing, so you can carry on from here." The id and message go to a new
  `CommandResult.detail` (never shown) and, in the browser, the console. `must()` throws the detail as a plain `Error`,
  so a developer's caller still sees it and an outer command still says the fault, not the detail.
- **Mid-advance** (a command the game gave itself while the clock moved): no snapshot is taken there (`execute`'s own
  comment), so the sentence never claims nothing changed: "An error in the game stopped something it was doing as time
  passed, so that didn’t happen. Anything it did before the error still stands, and the clock went on." A refusal in the
  world's own words (a `CommandError`) is still said as it is, under "Something Didn’t Go Through".
- **A calendar item whose handler threw:** was "A Scheduled Event Could Not Be Processed / 'Label' failed: message".
  Now titled "<Label> Didn’t Go Through", saying it shows as missed (its status is `missed`, which the calendar shows as
  Missed) and that what it did before the error stands; a background item (`category: 'system'`, labelled World
  Simulation) is said as "something it does in the background".
- **The clock that threw** (`game-context.tsx`): the toast was the engine's exception text. Now `CLOCK_FAULT`, the
  exception to the console.
- **What Needs You's commands** (`world.ts`): a decision is a question to the player, so "No such decision." is "That
  question isn’t in What Needs You any more."; "That’s been done already." says both ways a question is settled (an
  answer, or `expireDecisions` past its date); the preference refusals no longer print a raw key or `paused or live`.
- **Plans** (`plans.ts`): each refusal names the limit (read from `FURTHEST_AHEAD_DAYS` and `SHORTEST_MINUTES`) or the
  next step by the control's label (Call It Off, on the Calendar). The missed-plan notice says the plan "was in" a place
  (it wanted nothing) and its consequence: nothing but the notice reads a missed plan of the player's own.
- **A question and a notice opened** (`attention.tsx`): rewritten throughout. Gone: "the machinery that keeps the days
  running", "They’re the doing; this is the reading", "Something You Were Told", the developer's note about what no
  notice names yet. The urgency bands claimed places in the order the sort doesn't give ("nothing but an overdue thing
  sits above it", "it will keep for a day"); each is a word now, and the order is said once, as `openDecisions` sorts.
  "Here or on its own screen" said a look could answer a question; a look never acts, so it says Home.

**Kept:** EventBus's errors and Simulation's internal ones (a developer's, reaching the player only as the fault
sentences now); World Simulation (a background item's label no calendar surface shows); the capital labels; "There’s
nowhere by that name on the map." (plain, and only a command reaches it).

**Meaning-sensitive, and how each was checked:**
- "Nothing was changed" is said only where `restoreUniverse` ran: the top-level path. The mid-advance path and the
  calendar item's handler run without a snapshot (read in `execute` and `advanceTo`), so their sentences say what did
  happen stands. Both held by tests that check the state: the top-level fault's change to energy and its notice are
  gone after it (`tests/simulation.test.ts`).
- "within two days": an open question past its date closes at the next world tick, scheduled every two days
  (`world.ts`, `addDays(sim.now, 2)`); the figure is the look's `TICK_DAYS`.
- "If it comes up again while it’s open, its urgency can only go up": `requireDecision` keeps `Math.max` of the two.
- "deal with it on its own screen": every raiser of a question (the idle account, the tax return, the US status)
  resolves it from its own screen's command (`accountlife.ts`, `taxreturn.ts`, `permission.ts`).
- "Missing a plan of your own costs nothing else": `PLAN_KIND` is read only by the calendar's own screens and this
  notice (grep).

**Tests and tool matchers updated** (each assertion as exact as before; test titles unchanged): the refusals' exact
strings in `tests/evidence-g02-life`, `evidence-g04-life`, `evidence-g29-ui`, `evidence-g32-ui`, `evidence-g33-ui`,
`evidence-g34-ui`, `evidence2-b01`, `life-fixes`, `coverage-gaps-life`, `defects-g6-1`, `plans`; the unknown command's
`/Unknown command/` now asked of `detail` in `integrity` (twice), `simulation` and `defects-g9-1`, with the player's
sentence asserted exactly beside it. The notice look's kind in `evidence-g32-ui`. In `tools/playthroughs-ui.mjs`, the
notice look's kind (`notice`), its summary's regex, and its figures (`About`, `Importance`). New: two tests in
`tests/simulation.test.ts` for the fault paths, `tests/language-frame.test.ts` (the two looks in every variant) and
`tests/language-frame-ui.test.ts` (the provider's toasts, under the real `GameProvider`).

**Checks:** tsc 0, eslint 0, title-case 0, label-sweep 0, plural-check 0, voice-check 1 then 0 (one "it is" in the new
look words, rephrased), tics 1 then 0 (four sentences opening "Nothing", one tacked-on "which is"; all rephrased),
spelling 0, typos 0, text-inventory 1 then 0 (eleven new sources marked, two gone pruned), doc-refs 0, deciders 0.
Tests: `tests/simulation`, `plans`, `integrity`, `defects-g9-1`, `defects-g6-1`, `life-fixes`, `evidence2-b01`,
`coverage-gaps-life`, `evidence-g02-life`, `evidence-g04-life`, `evidence-g29-ui`, `evidence-g32-ui`,
`evidence-g33-ui`, `evidence-g34-ui`, `tutorial`, `looks`, `language-frame`, `language-frame-ui`: all pass.

**Screens:** the notice and question looks are read in tests here; on the built app at the area's end (the text walk's
Home and its opened notices).
