# The Frame Area's Defects

Functional defects found while rewriting the frame's words, apart from the writing. Each says what, where and how it
was found, and whether it was fixed here.

## 1. The live clock stops without a word when a move of it throws

- **Where:** `src/app/game-context.tsx`, the real-time tick's `catch` (`// A handler threw; stop ticking rather than
  looping on the error.`).
- **What:** when `advanceBy` throws on a live tick, the tick stops for good (`stopped = true`, the interval cleared) and
  nothing tells the player. The clock reads Pause's opposite (Play is offered only while paused, and the preference is
  still `live`), so the top bar shows Pause on a clock that no longer moves, until the page is reloaded or Pause and
  Play are pressed, which re-runs the effect.
- **How found:** reading the provider's three ways of moving the clock for the generic failure's words (batch 1). The
  Advance menu's and Skip To Event's moves toast the fault; the tick's doesn't.
- **Not fixed here:** the fix (a toast, and the speed set to paused through `world.set_preferences` so the bar says
  Play) changes what the page does, and a test of it needs the real provider in a React root with a faked window and
  timers (as `tests/evidence2-b01.test.ts` holds one). It's for the coordinator to decide; the words it would say are
  `CLOCK_FAULT`'s.
