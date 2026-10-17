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

## 2. The IRS's decision on a payment plan read its refusal's words

- **What:** `src/engine/systems/taxreturn.ts`, the `TAX_PLAN_DECIDE_KIND` handler. It set the pending plan's status to
  refused, asked `planRefusal`, set it back, and refused the plan only where the refusal didn't match
  `/payment plan|application/`. The match was meant to skip the refusal that names the plan's own application. That
  was logic keyed on the player's words: a rewording of any refusal the decision can reach would have changed what the
  IRS decided (papers `defects.md` 4).
- **Confirmed:** reading every sentence `planRefusal` can return. With the status flipped, the held-plan sentences
  ("Your application is already with the IRS. …", "You already have a payment plan with the IRS.") can't be reached;
  the four it can reach ("You owe the IRS nothing.", the unfiled return's, the short-term limit's and the Simple
  Payment Plan's) don't match, the last only because the match is case-sensitive and "Payment Plan" is capitalized. So
  with today's words the match never fires, and it never has: `git log -S` finds it first in `7e44117b`, with the
  status flip beside it. Then the words mutation below: a refusal reworded to contain "payment plan" or "application"
  made the old decision approve a plan it should have refused.
- **Fix:** `planRefusal` takes the plan being decided (`deciding`), which is its own application, not a plan held
  against it: `const held = person.taxPlan !== deciding ? person.taxPlan : undefined`. The decision passes its plan
  and refuses on any refusal, with no status flip and no match. The application and the Papers screen call it without
  `deciding`, so they're unchanged. Its strings are unchanged too (the inventory writes a template's expression as
  `{…}`), so no source of text went Pending.
- **Test:** `tests/language-crossarea.test.ts`, describe "the IRS’s decision on a payment plan", pinning every case
  of the decision on a played life (a New Yorker with $60,000 of 2026 wages, her return filed unpaid on 1 February
  2027, $9,614.89 owed), with what the refusal said just before the answer:
  - approved: a monthly plan, its $29 fee charged once, and a short-term one with none, each while the refusal named
    its own application ("Your application is already with the IRS. …");
  - refused, each in its own words and its notice: nothing owed by the answer (paid on Papers in between), a 2025
    return past due and unfiled (FIXTURE), a balance past $50,000 on a monthly plan and past $100,000 on a short-term one
    (FIXTURE: tax added by hand, as a processed amendment would add it), and a $29 fee the emptied bank can't cover;
  - answered nothing: a plan not waiting on the answer (FIXTURE: its status set to refused, or active).
- **Pinned before and after:** the three tests passed on the code as it was (4 of 4 with item 1's) and pass with the
  fix; the nine files that hold the plan (`language-crossarea`, `defects-g8-7`, `finance-paths`, `remaining-tax`,
  `evidence-g17-papers`, `scope-taxpapers`, `guide-examples-papers`, `state-tax`, `defects-g8-8`) pass 121 of 121.
- **Shown failing without the fix:** reverting the fix alone fails nothing, which is what "the same outcomes in every
  case" means: with today's words the old decision and the new agree. What the fix changes is that the outcome no
  longer depends on the words, so it's shown with the words changed:

  | Mutation | Fix in | Fix reverted |
  |---|---|---|
  | "You owe the IRS nothing." reworded "…, so there’s no payment plan to set up." (source and pin) | passes | killed: the plan approved with nothing owed |
  | The unfiled refusal reworded "…File it before your application." (source and pin) | passes | killed: the plan approved with a return unfiled |

- **Mutation run** of the fix (all killed): the decision not naming its plan (every plan refused as its own
  application); `planRefusal` ignoring `deciding` (the same); `planRefusal` taking every plan as the one decided (the
  application no longer refuses a second plan: killed by `tests/evidence-g17-papers.test.ts`, "You already have a
  payment plan with the IRS."); the decision refusing nothing; the decision's pending guard dropped (a plan set refused by
  hand was decided anyway, and approved).
