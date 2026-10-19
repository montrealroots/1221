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

## Batch 2: Creation, Its Pickers, The Traits, And Getting Started

**Sources (269, in 13 files):** `src/ui/creation/CharacterCreation.tsx` (24, one of them new: `WEALTH_LABEL`),
`LocationPicker.tsx`, `PortraitPicker.tsx`, `WorldMap.tsx`, `portrait.ts` (3), `world-map.ts` (2),
`src/engine/content/personality-traits.ts` (37), `ethnicity.ts` (9), `identity.ts` (1), `languages.ts` (154),
`src/engine/decided.ts` (27), `src/engine/world/bootstrap.ts` (3), and the How This Works entries in
`src/engine/content/guide/start.ts` (6).

**Read whole:** a new life from New Save through Identity, Dispositions & Traits, Genres & Background, Starting Point
(Your Body, Where It Begins, Your Money, Before Yale) and Review to Begin; the place picker from the map to a town; the
photo picker from an empty frame to a framed photo and each refusal; a trait from its card on creation to its look on
the Player Profile; the three How This Works entries a first-day player opens, through the Help dialog.

**Rewritten (27):**
- **Dispositions,** which a new player meets before knowing anything. The intro is "Your temperament, not your
  talent." Each line says what the slider does in the player's terms, and the three that go either way say so ("whether
  … raises your stress or eases it"). The close leads with what matters: none of them makes you a better or worse actor,
  apart from where Composure and Discipline start.
- **Traits.** A ninety-word sentence became a list of what traits change. The note under it names the Player Profile,
  where a trait opens, instead of "your own page". A gray trait says why in a sentence about the player ("It clashes
  with Early Riser, which you’ve picked.", "You already have four traits, the most you can pick."). Three traits' own
  words changed: Curious's "your reading of a scene" (a brief's reading is another thing in the glossary), Scattered's
  cost, which began "Most of them." as a fragment, and Self Critical's "harshest reader" (a reader is someone else in
  the glossary). A trait's look names what a session of preparation gets done, in the glossary's words.
- **Identity:** the pronoun and They/Them notes, Place Of Birth, and "You’ll be 22 when you start." for "when this life
  begins".
- **Your Body:** "drawn from the averages" (the engine's word for a random draw) is "SLATE picks your height and weight
  at random, around the averages where you were born".
- **The family:** its labels were the ids capitalized, so Review said "Family Nothing, Need Found". They're now Next To
  Nothing, Scraping By, Modest, Comfortable, Wealthy and Inherited Wealth, each in its note's words. The aid callout keeps
  every amount, with one condition to a sentence. A card is "with a $1,630 limit and $913 owed on it", or "and nothing
  owed on it".
- **Starting Point:** What Is Yours is Your Money. Where the game has no bank, "a plain checking account". Before Yale
  asks its question in the player's terms and says, for each choice, where the savings go (a defect, below).
- **Review:** the guide's two choices, "Recommended if you’re new", and "Your life starts with the clock paused. Once
  you press Play, a minute passes in the game for every real minute, and what’s on your calendar happens whether you’re
  watching or not."
- **The pickers:** the place picker's hints for a country with nothing on record, and an empty search that printed empty
  quotes (a defect, below). The map's tooltip for a country with nothing on record. Each photo refusal gives the way out.
- **How This Works, getting started:** Home And Where You Are, The Guide And This Help and Finding Your Way. The owner's
  example ("Some words only become links once you’ve read the guide chapter that covers them."); How This Works by its
  name, not "the reference"; "Home at the top wearing the count" became "Home is at the top, with the number of things
  waiting for you"; the clock "waits", the glossary's word.

**Kept (242):** the step names, the sliders' names and ends, 32 of the 35 traits (each with a reason of its own in
`frame.json`), the wealth notes, the ethnicity categories and their note, the ID cards' official names, the 154
language names, the 27 developer notes in `decided.ts` (no screen imports the file), the storage and file keys, and the
two connection lines under Worth Doing With It.

**Meaning-sensitive, and how each was checked:**
- **Either way.** `enjoyment.ts`: `lean()` is positive above 50 and negative below it, for an audience watching
  (stress, `DISPOSED.room`), new work (morale, `DISPOSED.away`) and a rehearsal (morale, `DISPOSED.rehearsal`). The
  disposition journeys in `tests/evidence-g28-ui.test.ts` measure both sides.
- **"Above 65".** `credit.ts` starts autopay on the minimum where risk tolerance is `> CARRIES_A_BALANCE` (65).
- **"Picks … at random, around the averages".** `systems/body.ts` draws height and body mass index from the birth
  country's adult mean and spread when either is missing (`decided.ts`, `body.draw`).
- **Before Yale.** `splitOf` keeps the savings at home unless `savingsAtHome === false`. It gives the account kept there
  its fees to graduation where `feesToGraduation` is above zero, from the savings or the checking account.
- **The aid.** The amounts are `termAccount`'s, unchanged; each condition is the one the old sentence named.
- **I’ve Read It only on the next chapter.** `world/tutorial.ts` refuses any other ("Read “…” first. The chapters open
  in order.").

**Tests and tool matchers updated** (each as exact as before; no title changed): `tests/language-frame-ui.test.ts`,
`creation.test.ts`, `evidence-g27-ui.test.ts`, `evidence-g28-ui.test.ts`, `evidence-g29-ui.test.ts` (Your Money),
`evidence-g33-ui.test.ts` (Curious), `evidence3-person.test.ts`, `evidence3-lifepapers.test.ts`, `need-paths.test.ts`,
`portrait.test.ts`, `guide-examples-start-day-body.test.ts` (start.home's result), `evidence2-b10.test.ts`,
`evidence2-b12.test.ts`, `home-account-creation.test.ts`. No tool matcher held these words.

**Tests added** (`tests/language-frame-ui.test.ts`, "creation’s pickers and Before Yale, said in words"): the place
picker's variants; the map's tooltip and each photo refusal; a trait's look for five traits and two descriptions on
Traits; creation's header, a restored draft, every disposition, the traits' list, the family's card both ways, the
guide's choices, Before Yale's three refusals and the town with no bank; and Before Yale's line for each choice, which
fails on the old line.

**Evidence tool:** `render-help.mjs` (this folder) draws a How This Works entry through the real Help dialog over
`GameProvider` and `GuideProvider`, opened as an address naming it opens it, and writes its text; `help-b2.txt` holds
the three getting-started entries.

**Checks:** tsc 0, eslint 0, title-case 0, label-sweep 0, plural-check 0, voice-check 0, tics 0, spelling 0, typos 0,
text-inventory 0 once marked (1 before: the new `WEALTH_LABEL` and 26 sources Pending, which the marks settle),
doc-refs 0, deciders 0, guide-quotes 0. `npx vitest run` on the 23 files that hold these words: 23 files, 443 tests,
exit 0, after the fixes above (the first run found 12 assertions holding the old words in strings split across lines).

**Defects:** two, fixed with tests (`defects.md` 1 and 2).

## Batch 3: Home, What Needs You, The Shell And Looking After Yourself

**Sources (71, in 15 files):** `src/ui/screens/Home.tsx` (4), `src/ui/looks/attention.tsx` (10),
`src/engine/world/world.ts` (5), `src/engine/core/events.ts` (1), `simulation.ts` (4), `src/engine/world/place.ts` (3),
`src/ui/shell/GameShell.tsx` (2), `destinations.ts` (1), `sections.ts` (15), `src/ui/components/primitives.tsx` (5),
`src/ui/workspaces/WorkspaceRouter.tsx` (2), `cell.ts` (1), `src/ui/looks/Look.tsx` (3), `registry.ts` (2),
`src/engine/systems/life.ts` (13).

**Read whole:** the first Home of a new life, every panel Locked and then each one open; a question answered,
dismissed and opened on its own; a notice opened, Go There, and Mark N Read; No Questions Waiting with something still
owed; a Locked screen reached from the rail; the Look After Yourself menu from its lines to the toast; How You Are's
summary at each threshold.

**Rewritten (5; the question's look and the notice's are one source, `attention.tsx#top`):**
- **A question opened:** "the game checks every two days" and "the save keeps it" were the engine's bookkeeping. Now:
  "If you don’t, it closes by itself within two days after its date, March 3, 2027. You can still open it here for 180
  days after it closes." A closed one, "You can still open it here until …". One gone, "so there’s nothing left to
  open".
- **A notice opened:** "SLATE keeps your latest 500 notices, so this one stays until 500 newer ones have come in." and,
  gone, "SLATE keeps only your latest 500 notices, and this one was older."
- **No Questions Waiting:** "A tax return is past its due date and not filed yet. You owe $174, including the penalty so
  far." for "… unfiled: $174, with its penalty so far."
- **A Locked screen:** "Read “Your Bank” in the guide to open it.", the step first, as the guide's own locked sentences
  put it.
- **How You Are:** "Feeling low, though the day itself is going fine." for "Flat. The work is fine, the feeling isn’t."
- **Look After Yourself:** "Indoors, since the weather’s no good for a run".

**Kept (66; the commit message said 65 and 6 rewritten, counting the two looks apart):** the shell's labels, the rail and its lines, the tab names, the fault sentences (each already says what
happened, what changed and the way on), What Needs You's refusals, the question look's state sentences, the place
labels, the background items' labels, Home's money and papers lines, and Look After Yourself's refusals. Three of the
kept lines are quoted elsewhere and read well enough to stay: "… starts at 9:00 AM: there isn’t the time before it."
(quoted by two other areas' guide entries and eleven tests), "The payment didn’t go through." (a refusal nothing reaches
now; the body guide quotes it), and "You dismissed that question, so it can’t be answered from What Needs You."

**Meaning-sensitive, and how each was checked:**
- **"Within two days after its date".** `expireDecisions` runs at the world tick, scheduled every two days
  (`world.ts`), and closes a question past its date.
- **"You can still open it here for 180 days".** The decision look resolves a closed question until
  `FORGOTTEN_AFTER_DAYS` after it closed, and says "gone" after.
- **"Stays until 500 newer ones have come in".** The save keeps the latest `NOTICES_KEPT` (500).
- **The tax line's figure.** `troubles`' `return_late` amount is the balance with the penalty so far (the test's $174
  is $165.60 and 5%).

**Tests updated** (each as exact as before; no title changed): `tests/language-frame.test.ts` (the two looks, five
sentences), `evidence-g33-ui.test.ts` and `evidence-g32-ui.test.ts` (the tax line, and How You Are),
`evidence-g31-ui.test.ts` and `evidence-g29-ui.test.ts` (the Locked screens), `defects-g4-1.test.ts` and
`evidence-g07-life.test.ts` (the indoor workout). No tool matcher held these words.

**Checks:** tsc 0, eslint 0, title-case 0, label-sweep 0, plural-check 0, voice-check 0, tics 0, spelling 0, typos 0,
text-inventory 0 once marked, doc-refs 0, deciders 0, guide-quotes 0. `npx vitest run` on the seven files that hold
these words: 7 files, 172 tests, exit 0.

## Batch 4: Moving The Clock, The Calendar, The Day's Looks, And How This Works For The Day

**Sources (92, in 18 files):** `src/ui/shell/TimeControls.tsx` (8), `src/ui/workspaces/CalendarWorkspace.tsx` (6),
`src/engine/world/plans.ts` (7), `src/ui/looks/plans.tsx` (1), `src/engine/world/calendar.ts` (2),
`src/engine/core/time.ts` (4), `sun.ts` (1), `src/ui/looks/day.tsx` (14), `place.tsx` (11), `weather.tsx` (12),
`src/engine/systems/weather.ts` (4), `seasons.ts` (1), `birthdays.ts` (2), `src/engine/content/holidays.ts` (1),
`holiday-data.ts` (1), `thunder.ts` (1), `climate.ts` (1), and the six How This Works entries in
`src/engine/content/guide/day.ts` (15).

**Read whole:** moving the clock from the top bar: Advance and each line, On The Way with one commitment and two, the
stop with Go, Stand Here and Skip It for a plan, the stop for a class or an appointment, the stop for a partner's
rehearsal with Call It Off, Sleep with its suggestion and its warnings, Skip To Event with nothing, one and several on
the way; the Calendar screen from the month to a day, Put Something On It and its refusals, an entry and Call It Off;
the day, entry, place, region, country, currency, weather and plans looks for six lives (a New Haven student in the
fall and in February, Longyearbyen at both solstices, Sydney and London); and each of the day's How This Works
entries, through the Help dialog.

**Rewritten (15):**
- **The stop, for anything but a plan of your own:** the reference's own example, made true of every stop it shows
  for. It shows for a class or a call, and also for an appointment or a paper visit, so it says "You can only skip a
  plan of your own, so there’s no Skip It button here. Press Go, or Stand Here to wait. It happens the next time the
  clock moves, and you’re there if you’re awake and in the right city."
- **On The Way:** "passes one commitment. The clock stops at it so you can choose: press Go, or Stand Here to wait.
  You can also skip a plan of your own, or call off a rehearsal with a partner, though at short notice that costs
  their trust."
- **The Calendar screen:** "the public holidays where you are", "marked Clash" (the chip's own word), and "when it’s
  time" for "when it comes round", in the plan form and an entry.
- **How This Works for the day:** each entry's overview now leads with what the player does. The Clock starts "Press
  Play at the top of the screen to start the clock". Moving Time On starts "Press Advance in the top bar". Your Own
  Plans starts "To put a plan of your own on the calendar, press Open Calendar on Home". The engine's bookkeeping came
  out where a player read it: "the world’s next look" became "within two days after that date", "the save forgets"
  became "you can still open it", "A draw from your save’s own seed" became "A random draw, fixed for each town and day
  in your save", and Work Out "reads" the weather became "checks". Semicolon chains became one fact to a sentence.
- **The looks:** a place with no tax table names the figure, Tax On A Wage, not "the tile below"; a country's towns
  "show up", not "are loaded"; Your Own Plans' source line says "marked".

**Kept (77):** the plan form's refusals and notices (each names the obstacle and the next step, and three are quoted
by the guide), the Sleep dialog, Skip To Event, the Advance and Look After Yourself menus, the calendar legend, the
day, weather and most of the place looks (sentences true at the moment, with their figures labeled as estimated), the
time and weather words, the source lines, and the day entries' connection lines that already read plainly.

**Meaning-sensitive, and how each was checked:**
- **"There’s no Skip It button here."** `DueNow` shows Skip It only where `item.kind === PLAN_KIND`, and Call It Off
  only for `PARTNER_KIND`; this line shows for neither.
- **"It happens the next time the clock moves."** Stand Here closes the dialog without running the item; the next
  advance runs it with the player present if `present` finds them awake and in its city.
- **"Within two days after that date".** `expireDecisions` at the two-day world tick.
- **"A night is only slept for you on a move of more than an hour."** `MAX_STEP_MS` (30 minutes) for the live clock;
  the coasting night is for a jump over an hour (`COASTING_*`, `systems/life.ts`).
- **"Yale Health’s assessment is the only commitment you can be at from a hospital bed."** The entry's own header
  records it, from `systems/leave.ts`.

**Tests and tool matchers updated** (each as exact as before; no title changed): `tests/language-frame-ui.test.ts`
(On The Way for one and two, the stop for a plan and for a visit, the Calendar's subtitle),
`evidence-g01-life.test.ts` (the plan form), `evidence-g02-life.test.ts` (an entry), `defects3-50-70.test.ts` (What
Needs You's later lines); `tools/playthroughs-ui.mjs`'s two On The Way checks, `/passes \w+ commitments?\. The clock
stops at (?:it|each one) so you can choose/` for `/passes \w+ commitments?, and the clock stops at each one\./`.

**Evidence:** `help-b4.txt` (the six day entries through the Help dialog, by `render-help.mjs`) and `looks-b4.txt` (the
looks for six lives, by brief 14's `../../language-2026-10-17/frame/render-looks.mjs`).

**Checks:** tsc 0, eslint 0, title-case 0, label-sweep 0, plural-check 0, voice-check 0, tics 0 (after one fix: a
sentence of the calendar entry opened on "Nothing"), spelling 0, typos 0, text-inventory 0 once marked, doc-refs 0,
deciders 0, guide-quotes 0. `npx vitest run` on the 19 files that hold these words: 19 files, 260 tests, exit 0.

## Batch 5: The Entry Rules Under Going Abroad

**Sources (16, in 1 file):** `src/engine/content/entry.ts`, 15 destinations and the research's uncertainties: 7,471
words, of which the screen shows each citizen's note and source under Papers, Passport And ID, Going Abroad
(`ui/papers/Documents.tsx`, the fine print under the country picked), and an authorization's or a visa's name inside a
refusal (`systems/documents.ts`, `mayEnter`). `processing`, `statedDate`, `passport.rule`, `authority` and
`ENTRY_UNCERTAIN` reach no screen (grep for each reader).

**How it was worked:** the file is generated (`tools/build-entry.mjs`) from the research, which keeps its own words.
The 38 distinct notes were rewritten once each in `tools/entry-notes.mjs`, keyed by the note as the generator leaves
it, and the generator runs it last, so regenerating gives the same words. 210 notes in the file changed.

**Rewritten (15):** each destination's notes, as sentences: agencies by name where their initials stood alone (US
Customs and Border Protection, Japan's foreign ministry), British spellings American ("authorization"), "see
uncertain" (a pointer at a list no screen shows) replaced by saying in the note what wasn't confirmed, and the
semicolon lists split. Every figure, date, program, form and fee is kept: 90 days in any 180, subclass 444, USD
80.90, NZD 100, the Appendix ETA National List's sections.

**Kept (1):** `ENTRY_UNCERTAIN`, the research's own list of what it couldn't confirm, which no screen shows.

**Meaning-sensitive, and how each was checked:** each rewrite was read against its research note side by side (the
map holds both), for every number, date and condition. Where the research hedged ("see uncertain"), the note says the
detail wasn't confirmed. Authorization names, which `documents.ts` matches against a held document's name, weren't
touched.

**Tests:** `tests/language-frame.test.ts`, "keeps a note’s first word whole…" (Japan's note, updated) and a new test,
"says each rule in sentences, with no pointer to a list the player can’t see and no agency by its initials alone",
which reads every note and fails on the research's shorthand.

**Checks:** tsc 0, eslint 0, title-case 0, label-sweep 0, plural-check 0, voice-check 0, tics 0, spelling 0, typos 0,
doc-refs 0, deciders 0, guide-quotes 0, and `node tools/entry-notes.mjs` 0 (no note left in the research's words).
text-inventory failed once, on engine-speak: batch 4's weather overview had said "It’s worked out from your town’s
climate", one "worked out from" over the ratchet's none, which batch 4's checks didn't show because they read the
inventory's exit while its sources were still Pending. It now says "It comes from your town’s climate, the season and
a little chance", the entry was drawn again (`help-b4.txt`) and marked again, and the inventory holds, engine-speak
back at 332. `npx vitest run tests/language-frame.test.ts`: 8 tests, exit 0.

## The End Of The Area

**Every source has a second-pass status.** `node tools/text-inventory.mjs --todo2 frame`: 0 Pending. The frame area
now holds 490 sources (the 487 at the start, `WEALTH_LABEL` new in batch 2, and the page head and the holiday names
marked before this pass): Rewritten 75, Retained 415, Pending 0, Blocked 0. Of the 488 this pass read, 74 were
rewritten (12, 27, 5, 15 and 15 by batch) and 414 kept, each with its reason in `docs/text/second-pass/frame.json`.
Engine-speak is at 332, where it started.

**The whole suite, once** (`npx vitest run`): 391 files, 4,723 tests, exit 0, in 35 minutes on the shared machine
(the baseline's 4,713 and the frame's ten new tests). It began after batch 5's notes were in, and before batch 5's
one-sentence fix to the weather entry, which no test reads.

**The built app**, built in this clone (`npm run build`, exit 0) and served on port 4281, the page checked to be this
build (`curl -sf http://localhost:4281/ | cmp - dist/index.html`, exit 0), stopped by its process id after:
- **The text walk** (`tools/text-walk.mjs`) of three scenario saves (decision, missed-plan, rehearsal) at 1440 and
  390: 25 screens each, exit 0 (`after-1440/`, `after-390/`).
- **The render check** (`tools/text-render-check.mjs after-1440 after-390`): 28,808 strings read, 0 faults, exit 0.
- **The frame walk** (`frame-walk.mjs`, this folder: brief 14's taken further) at 1440 and 390 (`walk/`): the startup
  sequence over a save from this version, one marked newer and one marked older; Before You Continue; the slots;
  Delete Slot 1? and Keep It; Continue on the newer save; creation from Identity to Review; Home; the Advance menu; On
  The Way for a week; the Sleep dialog; the Calendar. 15 screens each, none overflowing the page's width, none failed.
  Every rewritten sentence those screens can show was found on them: the newer and older warnings, the delete
  dialog's two lines, the refused newer save, creation's header, the dispositions, the traits' list, Your Money, the
  family labels, the guide's choices and the paused clock, On The Way for five commitments, and the Calendar's
  subtitle. The damaged-slot warning isn't on these screens (no slot was damaged), and is held by its test.
- **At 390,** the delete dialog, On The Way and the dispositions read without clipping or a button past the edge
  (`walk/frame-390-delete.png`, `-on-the-way.png`, `-creation-dispositions-traits.png`, and the startup warnings,
  the slots, the Review and the Sleep dialog beside them).

**Not exercised on the built app:** the damaged and unreadable slots (their tests hold them), a server's save failures
(Base44 isn't deployed here), the Before Yale variants (their test renders them), the place picker's empty country,
the stop dialog itself (the walk stops at On The Way, and the stop's two variants are rendered by their tests), the
day entries' and the getting-started entries' Help dialogs (drawn by `render-help.mjs` through the real dialog), and
Going Abroad's fine print (its test reads every note).
