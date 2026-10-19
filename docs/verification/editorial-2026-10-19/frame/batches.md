# The Frame Area's Batches

Brief 15's frame area (`../prompts/frame.md`): startup, the save slots, creation and its pickers, Home and its panels,
the notices' plumbing, the shared controls, the calendar and the clock, and the How This Works entries in
`guide/start.ts` and `guide/day.ts`. 487 sources and 25,438 words at the start, in 57 files, every one Pending in the
second pass.

Each batch says what was read, what changed and what stayed, where a rewrite could have changed what's true and how
that was checked, the interactions read whole, the tests and tool matchers updated, the checks with their exits, and
the screens read. The checks are run by `scratchpad/frame15/checks.sh` (tsc, eslint on the `.ts` and `.tsx` files
changed, title-case, label-sweep, plural-check, voice-check, tics, spelling, typos, text-inventory, doc-refs,
deciders, guide-quotes), each exit read from its own file.

## Batch 1: Startup, The Save Slots, Saving, And A Life That Ended

**Sources (40, in 10 files):** `src/ui/startup/StartupSequence.tsx` (6), `src/ui/saves/SaveSlots.tsx` (3),
`src/engine/persistence/adapter.ts` (1), `base44.ts` (1), `local.ts` (5), `src/app/SlateApp.tsx` (3),
`src/app/game-context.tsx` (5), `src/main.tsx` (1), `src/ui/shell/LifeEnded.tsx` (1), `src/engine/index.ts` (14).

**Rewritten (12):**
- **The startup warnings.** Each says what was found in a slot and what the player can do, with the player or SLATE
  as the subject: "You can restore its backup from the save slots."; "Slot 2 was saved by a newer version of SLATE, so
  this version won’t open it. That keeps the save safe."; "When you open it, SLATE keeps a backup and then updates
  it."
- **The slots.** The damaged save names the button ("Press Restore Backup to open its backup instead."); an empty
  slot with a backup says "there’s a backup"; a backup with no date is "from an unknown date".
- **Delete Slot N?** "This ends that universe" was the save's internal word for itself. The dialog now names whose
  life goes ("This deletes Alex Rivera’s life from the slot, with everything that happened in it."), or, for a slot
  that can't be read, "This deletes the save in this slot." Its second line names the button to bring it back.
- **Saving failed.** "SLATE couldn’t save to this device, so nothing in the slot changed." and the full-storage
  variant; on Base44, "SLATE couldn’t reach the server while opening that save." and its kin, where the act was the one
  reaching the server ("Loading that save couldn’t reach the server"). The server's steps are said with the slots' own
  words: opening (Continue), deleting (Delete), restoring the backup.
- **A new life that couldn't start:** "Your new life couldn’t be saved, so it hasn’t started." and "Your new life
  couldn’t start because of an error in the game, and nothing was saved to the slot."
- **An ended life:** "The clock won’t run in this save again. It stays in its slot until you delete it, and you can
  start a new life in any empty slot."; the stat notes "From the first day to the last, in game time" and "Their net
  worth at the end".
- **Opening refused:** a newer version's save, and one whose accounts don't add up, each saying "SLATE hasn’t changed
  anything in it" (the tics budget allows no sentence opening on "Nothing", so the first draft's "Nothing in it was
  changed." became this).
- **A life where the game has no bank:** its account is a Checking Account (the glossary's word from brief 15).
- **A home's money returned** on opening a save from before the homes went: "Home deposit returned", "Rent paid ahead,
  returned".

**Kept (28), each with its reason in `docs/text/second-pass/frame.json`:** the stage labels and status words, the
clock's two fault sentences and the provider's fallback, the rail's names, Restart SLATE over "Something went wrong.",
the open failure, the storage sentences that already name the cause and the way out (a compressed save, a browser with
no storage, storage that couldn't be read), the slot card's career line, the background items' labels no calendar
draws, the migration log no screen shows, the developer's diagnosis behind What’s Wrong With It, and the storage keys.

**Meaning-sensitive, and how each was checked:**
- **"When you open it, SLATE keeps a backup and then updates it."** `openSlot` calls `adapter.backup(slot)` and then
  `adapter.save(universe)` when the save migrated and wasn't opened from its backup. The warning is for a slot's own
  save, so the order is true.
- **"SLATE keeps a backup" on delete.** `restorableAfterDelete` is unchanged: a readable save becomes its own backup
  on the way out, and an unreadable one has a backup only if it already had one.
- **"Nothing in the slot changed" on a failed write.** The slot's key is written last and whole
  (`LocalSaveAdapter.save`); the test reads the stored text before and after and finds it the same.
- **"SLATE hasn’t changed anything in it" on a newer save.** `openSlot` returns before `migrate` or any write; the new
  test compares the device's whole store before and after.
- **Accounts that don't add up.** `migrate` pushes the problem when `probe.ledger.audit()` finds any, and `openSlot`
  returns before backing up or saving.
- **"Your new life couldn't be saved, so it hasn't started."** `start` sets the playing phase only after
  `adapter.save` resolves.

**Interactions read whole:** a slot from empty to New Save; Continue on a damaged save, the error, What’s Wrong With
It and Restore Backup; Delete on a readable save and an unreadable one, Keep It and Delete Slot N; a failed save, its
toast and the top bar's Save Failed: Try Again; an older save's warning at startup, then Continue; an ended life's
screen and Back To The Slots.

**Tests and tool matchers updated** (each as exact as before; no title changed):
- `tests/language-frame-ui.test.ts`: the delete dialog (now with the save's own name), the damaged save, the full and
  broken writes and their toast.
- `tests/language-frame.test.ts`: `startFailure`'s two variants.
- `tests/base44-adapter.test.ts`: the connection and the empty reply.
- `tests/evidence-g04-life.test.ts`, `evidence2-b03.test.ts`, `evidence-g08-life.test.ts`: the ended life's words.
- `tools/playthroughs-ui.mjs`: the Confirm Deletion check, `/This deletes (?:.+’s life from the slot|the save in this
  slot)\./` for `/This ends that universe\./`, and `SLATE keeps a backup` for `A backup is kept`.

**Tests added** (`tests/language-frame-ui.test.ts`, "opening and starting, said in words"): the startup stages'
warnings for a damaged slot with and without a backup, a newer and an older save (`STAGES` is exported for it); opening
a newer save and one whose accounts don't add up, word for word, with the store unchanged; a life with no bank and a
home's money returned; an empty slot with a backup, dated and not. Each holds the new words exactly, so each fails on
the old ones.

**Checks:** tsc 0, eslint 0 (on the `.ts` and `.tsx` files; `tools/*.mjs` isn't in `npm run lint`, and
`playthroughs-ui.mjs` has four errors of its own from before), title-case 0, label-sweep 0, plural-check 0,
voice-check 0, tics 0, spelling 0, typos 0, text-inventory 0, doc-refs 0, deciders 0, guide-quotes 0.
`npx vitest run` on the eight files that hold these words: 8 files, 246 tests, exit 0.

**Screens:** the startup sequence and the slots are walked on the built app at the end of the area (below, the built
app), where these words are read at 1440 and 390.
