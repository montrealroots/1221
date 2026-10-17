# The Cross-Area Pass: Defects The Areas Couldn't Settle Alone

Brief 14 (the owner's "Complete Player-Facing Language And Tutorial Overhaul"), 2026-10-17, on branch `lang14-xcode`
after all eight writing areas were merged (`1c3157d4`). The brief, section 6: "If the sweep reveals a real functional
defect, record it separately, fix it where authorized and necessary, and test the behavior." The areas found five they
couldn't settle inside their own files, listed in `coordinator.md` ("Defects Raised Outside Any One Area's Reach") and
in their `defects.md`. Each is here: what it was, how it was confirmed, the fix, the test, and the mutation run.

The tests are in `tests/language-crossarea.test.ts`. Each fix was shown to matter by putting the code back as it was
once and running its test, which failed; then each claim the test protects was mutated, one mutation at a time, by a
harness that applies it, runs the test file and restores the source byte for byte. A mutation the test doesn't fail
"survived", and each survivor is said here with what it means.

## 1. The live clock stopped without a word when a tick threw

- **What:** `src/app/game-context.tsx`, the real-time tick's `catch`. When a move of the live clock threw, the tick set
  `stopped`, cleared its interval and said nothing. The save's speed stayed `live`, so the top bar kept offering Pause
  on a clock that no longer moved, until a reload or a press of Pause and then Play (frame `defects.md` 1). The Advance
  menu's and Skip To Event's moves already toasted the fault (`CLOCK_FAULT`); the tick's was the one way of moving the
  clock that didn't.
- **Confirmed:** reading the code, then the test below on the code as it was: a reactor of time's passing that throws
  on the fourth second's move left `timeSpeed` at `live` (`expected 'live' to be 'paused'`), with no toast.
  `advanceTo` throws on a reactor's error, on re-entry and on a move backwards; a scheduled item's handler is caught
  inside it, so a reactor is what reaches the tick's `catch` on a played life.
- **Fix:** the `catch` keeps stopping the tick, and now also logs the error to the console, pauses the save through
  `world.set_preferences` (as `halt` pauses it at something that wants the player), toasts `LIVE_CLOCK_FAULT` in the
  negative tone, and bumps the provider's version so the screens read the clock where it stopped. The words are new,
  in the frame area's voice for a clock that threw (`CLOCK_FAULT`), with the bar's own Play named as the way to try
  again: "An error in the game stopped the clock, so it’s paused. Anything that happened before it stopped still
  stands. You can press Play to try again." A repeated failure isn't a loop: the tick doesn't retry on its own, and
  each press of Play is one more try that, failing, pauses again with one more toast. `toast` joined the effect's
  dependencies (it's stable, so the effect runs no more often).
- **Test:** `tests/language-crossarea.test.ts`, "PLAYER JOURNEY: a tick that throws pauses the save, says so once, and
  the top bar offers Play; Play pressed is one more try, a second failure pauses it again with one more toast and no
  loop, and a third press runs the clock". The real `GameProvider` in a real React root with faked timers, as
  `tests/evidence2-b01.test.ts` holds it; the bar drawn under the real provider. It holds: the clock where the throwing
  move left it, a second tick before React draws the pause moving nothing, the screens' `useWorld` reading the stopped
  clock, the save paused, one toast word for word, the error in the console, a minute on nothing moved, the bar saying
  Play and not Pause; Play again failing again, two toasts in all and nothing more a minute on; Play a third time with
  nothing wrong running the clock a second a second with no more toasts.
- **Shown failing without the fix:** the file put back as `1c3157d4` had it: `expected 'live' to be 'paused'`, exit 1.
  With the fix, exit 0. The neighbouring provider tests (`tests/evidence2-b01.test.ts`,
  `tests/language-frame-ui.test.ts`) pass with it, 24 of 24.
- **Mutation run** (eight mutations, all killed):

  | Mutation | Result |
  |---|---|
  | No pause in the `catch` | killed: `expected 'live' to be 'paused'` |
  | No toast | killed: no toast shown |
  | The toast's tone neutral | killed |
  | The frame's other words (`CLOCK_FAULT`) | killed |
  | No `stopped` and no `clearInterval` (the pause's own effect cleanup left to stop it) | killed: the second tick, before React drew the pause, moved the clock a second |
  | No version bump | killed: the screens read the clock a second short of where it stopped |
  | No console line | killed |
  | Keep ticking after a throw: no stop and no pause, only the toast | killed |

- **Text status:** `src/app/game-context.tsx#LIVE_CLOCK_FAULT`, new, marked Rewritten And Verified `--by frame` with the
  test as its evidence. `#GameProvider`'s strings didn't change.
