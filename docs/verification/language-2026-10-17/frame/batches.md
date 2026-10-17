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

## Batch 2: The Shared Controls

**Sources (54, in 11 files):** `src/ui/shell/TimeControls.tsx` (the top bar, On The Way, Sleep, the stop at a
commitment, Skip To Event, Advance and Look After Yourself), `GameShell.tsx`, `LifeEnded.tsx`, `destinations.ts`,
`sections.ts`, `src/ui/workspaces/WorkspaceRouter.tsx`, `cell.ts`, `src/ui/components/primitives.tsx`,
`src/ui/looks/Look.tsx`, `registry.ts`, and `src/app/game-context.tsx`'s ROUTE_LABELS.

**What changed:**
- **On The Way** said "the school’s calls and classes you go to"; it now says what every stop offers in its own
  buttons' words, Go and Stand Here always, Skip It on a plan of your own, Call It Off on a partner's rehearsal.
- **The stop at a commitment** said "The school’s, not yours to skip" over every stop that isn't a plan or a partner's
  rehearsal, and those include a doctor's appointment, a paper visit, therapy, a welfare check and a study session
  (`requiresPlayer` in `appointments.ts`, `papervisits.ts`, `therapy.ts`, `leave.ts`, `classmates.ts`). It now says only a
  plan of your own can be skipped. "this is what wanted you" is "this needs you now". The late call-off's toast says
  what it costs: the partner's trust, which `school.cancel_rehearsal` moves when it's under a day ahead.
- **Sleep**: its button said "Sleep 1 Hours"; it agrees now. Its stat label is Title Case; its warnings contract and say
  small numbers in words.
- **Skip To Event**: "processed in order" and "What this jump costs" are said in a player's words.
- **The rail**: the Menu button's accessible name was "Toggle Navigation"; it's its word, Menu. Each destination's
  description names what's behind it (Money named one of its five tabs, Papers four of five, School five of six).
  The breadcrumb for School, where a notice's Go There gives no label, was "Your School"; it's School, as the rail says.
- **A Life, Ended**: "Wages, before tax and commission": no commission has been taken since the agent went with the
  career. A straight apostrophe in its last line is the house's.
- **A locked screen** says the reader's action ("It opens once you read “Your Bank” in the guide.") and keeps the
  chapter's lead as its own sentence. Its button stays Read About It, the guide's own word for it everywhere.
- **The save indicator**: "Save Failed — Retry" is "Save Failed: Try Again".

**Kept:** the Advance menu's items, Look After Yourself's chips and toast, the tab labels, the wellbeing labels, Not now,
Sources And Estimates, Close, No Such Screen, a calendar cell's accessible name (each plain and accurate, said in its
status); internal errors and CSS values.

**Meaning-sensitive:** On The Way's choices were checked against DueNow's buttons; the stop's line against every kind
that sets `requiresPlayer`; the late call-off against `school.cancel_rehearsal` (`late` is under `MS_DAY`, and a stop is
at the hour); "before tax" against `earnings.ts` (acting's and work-study's gross pay).

**Tests and tool matchers updated:** `tests/evidence-g01-life` (You’d Wake At; You’d sleep through one commitment),
`whynot-time` (the empty Skip To Event), `evidence-g29-ui` (the sleep button's finder now takes Hour or Hours; the
locked screen), `evidence-g31-ui` (the locked screens, their leads now asserted too), `evidence2-b03` (Wages, before
tax). `tools/playthroughs-ui.mjs` (On The Way's sentence; the stop's "needs you now"), `tools/acceptance-ui.mjs` (On The
Way), `tools/rail-check.mjs` (the Menu button by either name). New in `tests/language-frame-ui.test.ts`: On The Way for
one and two, the stop for a plan and for the world's own visit, a partner's rehearsal played to its hour and called off
(its toast, and the trust lower), Skip To Event, and Sleep at one hour.

**Checks:** tsc 0, eslint 0, title-case 0, label-sweep 0, plural-check 0, voice-check 0, tics 0, spelling 0, typos 0,
text-inventory 0, doc-refs 0, deciders 0. Tests: `whynot-time`, `evidence-g01-life`, `evidence-g29-ui`,
`evidence-g31-ui`, `evidence2-b03`, `evidence-g04-life`, `defects-g4-2`, `help-mechanics`, `defects-g7-1`, `interface`,
`cohesion`, `evidence-g33-ui`, `evidence2-b01`, `language-frame-ui`: 14 files, 223 tests, all pass.

**Screens:** the dialogs are read under the real provider in tests; GameShell, the rail's descriptions (their `title`)
and the breadcrumbs are left Pending for the built app's walk at the area's end.

## Batch 3: Startup, The Save Slots And Saving

**Sources (40, in 9 files):** `src/ui/startup/StartupSequence.tsx`, `src/ui/saves/SaveSlots.tsx`,
`src/engine/persistence/adapter.ts`, `local.ts`, `base44.ts`, `src/app/SlateApp.tsx`, `src/app/game-context.tsx`
(GameProvider), `src/main.tsx`, `src/engine/index.ts` (openSlot, migrate, validateUniverse and the rest), and
`src/engine/decided.ts`.

**What changed:**
- **A save that couldn't be written** said "The save couldn’t be written: <the storage's own message>". Every failure
  now says what the slot holds: the slot's own key is written last and whole (`LocalSaveAdapter.save`), so it still
  holds what it held before. Full storage says what to free; anything else says to try again, its message in the
  console. On the server, "will sync when the connection returns" promised a sync the adapter doesn't run; what's true
  is that the next save writes the whole save again, and that's said.
- **A damaged save** said "That save didn’t pass validation: <the first problem> (and n more)." It now says the save is
  damaged and can't be opened, and the way on (Restore Backup, where there's one); the check's words are behind What’s
  Wrong With It. It makes no claim that the slot is unchanged: `openSlot` may have brought it forward first, keeping a
  backup.
- **The slots**: "Three slots, Three separate lives" (a capital mid-sentence); an empty slot says to press New Save;
  "Schema" is "Save Format", "Updates On Load" "Updated When Opened"; the delete confirmation names Restore Backup as the
  way back, where there is one.
- **Startup**: "Saying What Won’t Read" is "Checking Each Save"; a save from an older version says it's updated when
  opened and a backup kept first (`openSlot`'s `adapter.backup` before its save), where it said "A checkpoint is taken
  first"; the warnings name where a backup is restored from.
- **SlateApp**: a new life that couldn't start, or a save that couldn't open, showed the exception's text. A storage
  failure keeps its own words; anything else says it's an error in the game and what to do. The two sentences are
  exported (`startFailure`, `OPEN_FAILURE`) so a test holds them.
- **migrate's problems**: the ledger audit's line left the sentence for the console; the newer-version sentences lost
  their schema numbers.

**Kept:** "That save file is damaged and can’t be read." (plain, held by tests); the storage keys; validateUniverse's
findings (a developer's words, now only behind the disclosure); migrate's step log, which no screen shows; the slot
card's line, which SaveSlots reads back for ", Died At"; account names lending.ts matches; decided.ts, which nothing
in the game imports.

**Meaning-sensitive:** "the slot still holds what it held before" was checked against `LocalSaveAdapter.save` (the
backup key first, then the slot's) and held by a test that reads the slot's text after the failure; the server's
"next save tries again" against `Base44SaveAdapter.save` (no queue; each save is whole). "It hasn’t been changed" is
said only where `migrate` returns a problem before `openSlot` writes.

**Tests and tool matchers updated:** `tests/persistence.test.ts` (/isn’t a SLATE save/), `tests/base44-adapter.test.ts`
(both sentences now held word for word), `tools/playthroughs-ui.mjs` (the delete confirmation's no-backup line). New in
`tests/language-frame-ui.test.ts`: the slots (empty, older, readable and unreadable deletes, a damaged save opened),
the device full and broken (the slot's text unchanged, the provider's toast, Save Failed: Try Again on the top bar), a
browser with no storage or no decompression, and a server down. New in `tests/language-frame.test.ts`: `startFailure`
and `OPEN_FAILURE`.

**Checks:** tsc 0, eslint 1 then 0 (an unused variable in the new test), title-case 0, label-sweep 0, plural-check 0,
voice-check 0, tics 0, spelling 0, typos 0, text-inventory 0, doc-refs 0, deciders 0. Tests: `persistence`,
`base44-adapter`, `simulation`, `save-migration`, `language-frame-ui`, `evidence-g04-life`, `interface`,
`evidence3-person`, `evidence-g28-ui`, `scope-school`, `evidence2-b10`, `base44-contract`: 12 files, 301 tests, all
pass.

**Screens:** the startup sequence's warnings and stage labels are left Pending for the built app's walk (a save from an
older version, and one unreadable, written into the browser before it opens).

## Batch 4: Home And The Day's Own Words

**Sources (27, in 3 files):** `src/ui/screens/Home.tsx` (Home, SchoolLine, PapersLine, partOfDay),
`src/engine/systems/life.ts` (the How You Are summary, sleep and its notice, the sleep suggestion and its reasons, Look
After Yourself's items, details and refusals), and `src/app/SlateApp.tsx`'s two failure sentences.

**What changed:**
- **What Needs You** calls its rows questions, as the guide and the refusals do: "No decision is waiting on you." is
  "No questions are waiting on you.", No Decisions Waiting is No Questions Waiting. Past the sixth question, "N more
  waiting." now says when they appear (each comes up as one above it closes); the notices' line is "N more unread.",
  and "the heaviest first" and Show The Heaviest Six use the word the look uses, important.
- **What weighs:** "Your current account" is "Your account" (the bank's name for it differs by country), "is with
  collections" says whose money and who holds it, and two clashing entries "are at the same time" where they "want you at
  once".
- **The school line**'s alert is two sentences, and its Yale button's breadcrumb is School, as the rail says.
- **How You Are**: "no dial is far enough out to be worth naming" is "with nothing out of the ordinary to worry about".
- **Sleep**: You Slept Through's body was the labels joined by commas; it's a sentence that says they were missed (every
  handler of an item that wants the player finds them asleep: `present`, `presentForCare`, the plan's own check). The
  suggestion's "2.0 hours" is the clock's duration, its straight quotes the house's. "fourteen hours" is read from
  LONGEST_NIGHT.
- **spokenList** moved into `engine/core/text.ts`, so an engine sentence joins a list as a look does; `ui/looks/words.ts`
  re-exports it.

**Kept:** the part of the day's word (held at every boundary, "Good Night" past midnight included), the papers line, the
shared refusals ("Not from a hospital bed.", "<Classes> starts at 9:00 AM: there isn’t the time before it."), Look After
Yourself's items and details.

**Meaning-sensitive:** "so you missed them" was checked against every `requiresPlayer` handler's presence test (school's
`present`, health's `present` and `presentForCare`, the plan's asleep check, coursework's and classmates' `here`). "Each
one comes up here as one above it closes" against `openDecisions` and Home's `slice(0, 6)`.

**Tests and tool matchers updated:** `tests/evidence-g01-life` (the sleep suggestion; You Slept Through's bodies),
`evidence-g04-life`, `evidence2-b11`, `evidence2-b12`, `evidence3-home`, `evidence-g34-ui`, `evidence-g06-life`,
`evidence-g33-ui`, `evidence-g03-life`, `evidence-g32-ui`, `defects-g4-2`; `tools/playthroughs-ui.mjs` (Show The Six Most
Important) and `tools/acceptance-ui.mjs` (No questions are waiting on you.). The guide's day chapter quotes Home's lines
(“N more unread.”, Show The Six Most Important, No Questions Waiting), brought into line the same day. New in
`tests/language-frame.test.ts`: the longest night's two reasons.

**Checks:** tsc 0, eslint 0, title-case 0, label-sweep 0, plural-check 0, voice-check 0, tics 0, spelling 0, typos 0,
text-inventory 1 then 0 (SlateApp's two new sources marked), doc-refs 0, deciders 0. Tests: 20 files, 381 tests, 4
failed and were fixed: three assertions a replacement missed (an earlier pair's text had to land first), and a straight
apostrophe in a comment of `ui/looks/words.ts`, which `tests/looks.test.ts` holds; rerun, `evidence-g32-ui`,
`defects-g4-2` and `looks` pass.

**Screens:** Home is drawn in the tests above; on the built app at the area's end.

## Batch 5: Creation

**Sources (about 270, in 13 files):** `src/ui/creation/CharacterCreation.tsx` (every step, the body, the family, Before
Yale, the bank, Review and the validation), `LocationPicker.tsx`, `PortraitPicker.tsx`, `WorldMap.tsx`, `portrait.ts`,
`world-map.ts`, `src/engine/content/personality-traits.ts` (37), `languages.ts` (154 names), `ethnicity.ts`,
`identity.ts`, and `src/engine/world/bootstrap.ts`'s family lines.

**What changed:**
- **Dispositions and traits** were each one paragraph of mechanics. Dispositions is now a line and a list, one item per
  disposition, saying what it moves as the code does: "affects" where the lean goes both ways (`enjoyment.ts`'s `lean`
  is negative under 50), and Risk Tolerance's threshold read from `CARRIES_A_BALANCE`. Traits is two short paragraphs.
- **Review's last line said the world starts running once the save begins.** Every new life starts with the clock
  paused (`SlateApp`'s `createSave(…, { paused: true })`, guided or not); it says so, and what Play does. Going Out A
  Month is Food Each Month, which is what it counts (`monthOf`).
- **The body**: what's out of range says what to use; "drawn from where you were born" says from the averages there;
  the long note is three sentences.
- **Identity**: the legal name is on your documents, not "a contract" (the career's gone); the They/Them note starts
  with They/Them, where it's drawn; "somebody" is "someone"; "You will be … when the save begins" is "You’ll be … when
  this life begins".
- **Genres and background**: "said back" and "reads it" are "shown on your page" and "uses it".
- **The family**: "Yale finds need" and "finds no need" are full sentences, the amounts unchanged; "a leave begun
  mid-term returns part of the scholarship" says who gives it back.
- **Before Yale**: two sentences, plainly; it keeps "America", the word the bank's own refusal beside it uses (a term
  for the coordinator: the game says both "America" and "the United States").
- **The money**: "at SLATE’s rate" is "at the estimated rate", "(SLATE's estimate)" (with a straight apostrophe)
  "(estimated)".
- **Validation**: "A first name is needed." is "Enter a first name."; over 95 says what to change; a draft with a bad
  start date names the one way out, Start Over on Identity.
- **The location picker**'s load failure showed the fetch's message; it says to reload, and that the answers are kept
  (the draft is saved on every change).
- **Traits**: two costs said "None that SLATE draws" and "there’s one of it"; both are "None", the luck kept.

**Kept:** the step names (the code reads them as keys), the dispositions' ends, every trait's description and cost
but two (in-character lines, written for a whole life), the census's categories, real ID cards' names, the language
names, the map's prompts, the photo refusals, the family lines.

**Meaning-sensitive:** each disposition's line against what reads it (`personality.ts`, `life.ts`, `credit.ts`,
`enjoyment.ts`); the paused clock against `SlateApp.start`; Start Over against `restored && step === 0`; the reload's
kept answers against `saveDraft` on every change.

**Tests updated:** `tests/evidence-g28-ui` (the body's two warnings, the genres' paragraph and a marked genre's title),
`evidence-g27-ui` (left blank, the age, over 95), `need-paths` (the family's line and callouts), `evidence2-b11`,
`evidence-g09-life` (Food Each Month's figure; their header comments say it was Going Out A Month until today),
`evidence-g30-ui`. New in `tests/language-frame-ui.test.ts`: creation drawn step by step.

**Checks:** tsc 0, eslint 0, title-case 0, label-sweep 0, plural-check 0, voice-check 0, tics 0, spelling 0, typos 0,
text-inventory 0, doc-refs 0, deciders 0.

**Tests, batch 5:** 16 files, 308 tests; 9 failed on assertions of the old words this batch had not yet reached (eight in
`evidence-g27-ui` and `evidence-g28-ui`, the dispositions' and Billed As's old sentences; one in `personality`, the
longest night's), each updated as exactly as before; the Profile's own lines in those tests (the profile area's) were
left as they are. Rerun: `evidence-g27-ui`, `evidence-g28-ui`, `personality`, `language-frame-ui`, 4 files, 99
tests, exit 0; then eslint 0 and tsc 0 on the four test files. PortraitPicker was first marked on `tests/portrait.test.ts`,
which doesn't draw it; it was re-marked on `language-frame-ui`'s creation walk, which does.

## Batch 6: The Calendar, The Day, A Place And The Weather

**Sources (about 80, in 17 files):** `src/ui/looks/day.tsx` (a day, an entry and a season opened), `src/ui/looks/place.tsx`
(a place, a region, a country, its money and its daylight), `src/ui/looks/weather.tsx` (the weather, a day, its hours,
an hour and the week), `src/ui/looks/plans.tsx` (your own plans, and the hours one takes),
`src/ui/workspaces/CalendarWorkspace.tsx` (the screen, the plan form, an entry's detail), `src/engine/world/calendar.ts`
(the legend, Skip To Event's travel note), `src/engine/systems/birthdays.ts`, and the names the calendar reads:
`core/time.ts` (weekdays, months, durations, seasons), `core/sun.ts`, `systems/weather.ts` (the conditions),
`systems/seasons.ts`, `world/plans.ts#PLAN_LENGTHS`, `content/climate.ts`, `content/thunder.ts`, `content/holidays.ts`,
`content/holiday-data.ts`.

**What changed:**

- **"Wants you" is "you need to be there"**, and the two kinds an entry opens as are A Commitment and Happens Without
  You (they were Something You Have To Be At and Something The World Handles). Two commitments at once are a **clash**,
  on the screen, its callout, a way's detail and the look's source line, where they were a collision, things landing on
  top of each other, or "both want you".
- **The Calendar screen**: its heading is Your Plans And Commitments (it was "Every Commitment You Have."); an empty day
  says "You have nothing on that day. Press Put Something On It to add a plan.", or "You had nothing on that day." for
  one gone (it was "That day is entirely yours. Put something on it if you want it spoken for."); the plan form says
  "You’ll need to be in New Haven for it" and that the calendar flags the clash; an entry's detail says "You need to be
  there. The clock stops when it comes round, so you can go." (it said "Move the clock to it and it happens", which
  isn't what a stop does: it asks).
- **SLATE as the narrator went from the calendar's looks.** "SLATE’s climate model", "SLATE’s reckoning", "SLATE’s
  calibration", "SLATE can name", "SLATE prices" are "estimated", "a climate model", "on the map", "It’s used in"; the
  forecast's honesty stays, plainly: "It isn’t a real forecast."
- **A place's money said "priced in dollar"** and "SLATE puts it at about 1 to the dollar" for the dollar itself; a
  country's money is "the dollar", the dollar's own line says every exchange rate is quoted against it, and every other
  money is "to the US dollar" (an Australian dollar's line said "1.53 to the dollar"). "English is spoken, in that
  order." for one language; "in the order the country lists them" only for two or more. A currency's countries were
  "at the middle of" their capitals, and Bouvet Island had "0 people, and no capital"; it's "Nobody lives there".
- **The region's count** was "pieces the map cuts" a country into; it's parts it divides it into (the word "states"
  stays out, because the gazetteer's 51 for the United States include the District of Columbia). "one of its one place"
  is "its only place"; "Its towns on your map are Longyearbyen." is "Its one town on your map is Longyearbyen."
- **The weather's flourishes went:** "Not the story today", "Water the air is carrying", "with little patience in
  between", "hard on anything left standing outside", "what it was doing is nobody’s business now". The climates say
  what they're like plainly. The high and low say "Around 3 PM" and "Around 3 AM", where the hourly curve
  (`weather.ts`, one cosine peaking at 15:00) puts them (they said "Mid-afternoon" and "A little before dawn").
- **The light:** "the only difference between two in the afternoon and two in the morning is the color of it" and
  "That gap is the whole difference between living here and living somewhere flat" went; the longest and shortest day
  name the solstice the code reads (June 21 in the north, December 21 in the south).
- **A past day** says "That was winter in New Haven, and the season was nearly over then." (it said "That’s … is
  nearly over"); a day's empty line no longer said "yet" of a day gone.
- **The legend's Personal** said "Time that’s yours."; it says what's drawn in it: "Your own plans, and your birthday,
  appointments and tax dates." (plans, `birthdays.ts`, `appointments.ts`, `taxreturn.ts`).
- **The birthday notice's body** had a straight apostrophe ("You're 24 today."); it's curly.
- **The missed-class cost** says "at the term review", the glossary's word, where it said "the term’s evaluation".

**Kept:** the month and weekday names, the seasons' names, the durations' readout, the weather conditions' names
(they're keys too), the plan lengths, the region words (State, Province, Prefecture, Canton, County, Nation, Region),
the climate names, the thunder counts' citations and the holiday table (data, shown as published), the legend's School
and Money rows (School's "each term’s evaluation" names the calendar entries the school area titles "Fall Term
Evaluation"; if that area renames them, the legend follows), and its World row, never shown (`system` items are kept off
every calendar surface). Skip To Event's travel note is plain already. The holidays' load failure is caught where it's
called and never shown.

**Meaning-sensitive:** "The clock stops when it comes round, so you can go" against DueNow (the live clock pauses at a
`requiresPlayer` item; Advance stops at each); "it’s in the city you’re in when you make it" against `calendar.schedule`
(`locationId` is the player's city); "A country’s towns are loaded once your life has a place in it" against
`loadPlacesFor`; "a life started here keeps its money in euros" against `currencyFor`; the solstices against the daylight
look's `Date.UTC(year, lat >= 0 ? 5 : 11, 21)`; "good to a minute or two" against `sun.ts` (the NOAA calculation);
"Each day’s weather is simulated and blended with the two days before it" against `weather.ts`'s anomaly blend.

**Evidence:** every look in every variant the six lives reach, rendered under the real provider before and after
(`render-looks.mjs`; the after is `looks-after.txt` in this folder), plus the tests below.

**Tests and tool matchers updated** (each as exact as before; titles unchanged): `tests/evidence-g01-life` (the plan
form's note), `evidence-g02-life` (an entry's detail), `evidence-g32-ui` (New Haven, Summer and the sky opened from
Home's head; Tuesday's forecast, now matched as the condition's sentence with its low and high; Daylight's "of
daylight"), `defects3-place` (a place's two summaries), `evidence-g04-life` and `evidence-g27-ui` (the birthday's
apostrophe). Two that batch 5 and batch 2 had missed came up in this batch's run and were brought into line:
`evidence2-b10` (the traits' "how much a slight from one hurts") and `evidence-g08-life` (A Life, Ended's "Wages, before
tax", held to the tile after it as before). New in `tests/language-frame-ui.test.ts`: the Calendar screen (its heading,
a clash, the legend, an empty day ahead and gone).

**Tests, batch 6:** 22 files, 390 tests: 5 failed, each an assertion of the old words (above), each updated; the rerun
of those and the new: 7 files, 146 tests, one failure (the birthday's second assertion, in `evidence-g04-life`, updated
with `evidence-g27-ui`'s, both rerun in batch 7's round).

**Checks:** tsc 0, eslint 0, title-case 0, label-sweep 0, plural-check 0, voice-check 0, tics 0, spelling 0, typos 0,
text-inventory 0, doc-refs 0, deciders 0.

**Screens:** every look in this batch rendered for six lives (`looks-after.txt`); the Calendar screen under the real
provider in the test above; the built app at the area's end.

## Batch 7: The Guide's Start And Day Chapters, And The Entry Rules' Notes

**Sources (37, in 4 files):** `src/engine/content/guide/start.ts` (Home And Where You Are, The Guide And This Help,
Finding Your Way, and their connections), `src/engine/content/guide/day.ts` (The Calendar, The Clock, Moving Time On,
What Needs You, Your Own Plans, The Weather, their connections, and the thunder and run figures' words),
`src/engine/content/entry.ts` (the entry rules, 16 sources), changed through `tools/build-entry.mjs`.

**What changed:**

- **`next` on every entry** (the brief's seventh question), each naming a control that exists: Home And Where You Are
  (the Calendar and Weather panels; the next chapter if something is Locked), The Guide And This Help (the next chapter;
  How This Works), Finding Your Way (? for the contents), The Calendar (Go or Stand Here; Open Calendar on Home), The
  Clock (Play and Pause; Advance), Moving Time On (Sleep before a long move through the night; each stop), What Needs You
  (answer or dismiss before its date; Go There, then Mark N Read), Your Own Plans (Go, or Skip It), The Weather (Work
  Out on a dry, mild day, whose line says whether it'll be a run).
- **"Wants you" is "you need to be at"**, or a commitment, through the day chapter, as the calendar's own words have
  been since batch 6; the entry kinds it names are A Commitment and Happens Without You; the reads' label What Wants You
  is What Needs You There; a clash is a clash, not a collision.
- **"Command" went from the player's sentences:** an answer "does what the same button does on its own screen", its
  cost is "what the same button costs on its own screen", and one that can't be done keeps the question open with the
  reason.
- **"Weight" and "heaviest"** are urgency and importance, the words Home and the looks use: A Question's Urgency, A
  Notice's Importance, "the most urgent", "the most important".
- **Figures said as the code has them:** the high around 3 PM and the low around 3 AM (the hourly curve); "worked out"
  is "calculated" for the season, the daylight and the weather; "SLATE’s weather is a climate model" is "The weather is
  estimated from a climate model"; the thunder count without a published figure is "estimated for a continental
  climate", as the weather's look says it.
- **Home And Where You Are** said Where You Are shows the season and the zone; it shows the town, its region and
  country, Local Time with its zone, and Daylight. The season is in the line under the greeting, and the entry says so.
- **The Guide And This Help** called the chapters "the onboarding" and the reference "what it reads"; the chapters
  "teach the game in order", and an entry says "what it does, what it changes now and later, and what it affects".
- **Your Own Plans:** "moves no dial" is "costs no money and changes nothing in your wellbeing beyond the hours it
  takes" (the plan's handler marks it kept or missed and touches nothing else; the hours are charged as any are).
- **The entry rules' notes:** the builder took "Visa exempt" off the front of "Visa exemption", so Japan's rule for
  thirteen citizenships read "Ion for short-term stay up to 90 days" and "Ion up to 90 days"; it's held to a word's end
  now. "Own nationals." is "You’re one of its citizens.", said to the player who is one. Regenerated by the builder; the
  diff is those 28 lines and nothing else.

**Kept:** every id, cover, goal, question and route; every figure, still read from its constant; the reads' labels but
the four above; the examples' setups and results but the one quoting a plan "wanting you in New Haven"; the synonyms
(search words, which keep "wanted you" for a player who types it). In `entry.ts`, the research's own words, sources and
British spellings (an authority's text quoted, with its source), the authorizations' official names, and
`ENTRY_UNCERTAIN`, which nothing shows.

**Which of entry.ts reaches a screen:** a citizen's rule's `note` and `source` (the Papers screen's travel fine print,
`Documents.tsx`), an authorization's `name`, `fee`, `currency` and `validityYears`, and a rule's `visa` (what's
missing, `systems/documents.ts`), and `ENTRY_AS_OF`. The passport rule's text, `authority`, `processing`,
`statedDate` and `ENTRY_UNCERTAIN` reach none.

**Meaning-sensitive:** the answer's gate against `world.take_decision_action` (the answer's command is held to its own
chapter, as from its screen); "if it can’t be done, the question stays open and the reason shows" against the same
(a refused command leaves the row open and its error on screen); urgency and importance against `openDecisions`'s and
the notices' sorts; the high and low against `weather.ts`'s curve; Where You Are's contents against `Home.tsx`; the
plan's wellbeing against its handler (`world/plans.ts`).

**Tests and tool matchers updated:** `tests/guide-examples-start-day-body.test.ts`: the calendar example's count is
read from "passes one commitment" and turned to a number by the file's own `word`, and the plans example's result is
read as "from 8:00 to 10:00 PM, in New Haven", each still played and compared as before. New in
`tests/language-frame.test.ts`: the entry rules' notes.

**Tests, batch 7:** `guide`, `guide-examples-start-day-body`, `help-mechanics`, `tutorial`, `evidence2-b08`,
`language-frame`, `documents`, `evidence-g04-life`, `evidence-g27-ui` (the last two for batch 6's birthday): 9 files,
125 tests, exit 0.

**Checks:** tsc 0, eslint 0, title-case 0, label-sweep 0, plural-check 0, voice-check 0, tics 0, spelling 0, typos 0,
text-inventory 0, doc-refs 0, deciders 0.

**Screens:** each label the entries name was looked for on the built app's walk (`after-1440`, `after-390`).

## The End: The Built App, The Walks And The Whole Suite

**Built** with `npm run build` (exit 0), served on port 4201, and stopped by the PID holding the port.

**The text walk** at 1440 and 390 on brief 13's fourteen scenario saves (`after-1440/`, `after-390/`): every save 25
screens, none unreachable or failed. Set beside `walk-before-1440` for the frame's screens: the slots' header, the empty
slot's line and Save Format; Home's Calendar line, "No questions are waiting on you.", "N more unread.", How You Are's
last line, Daylight's "of daylight"; the rail's descriptions. Each label the start and day chapters name was looked for
in the walk; those it doesn't reach (Show The Six Most Important, All Clear, No Questions Waiting, "N more waiting.",
Read About It, Keep The Account) are each drawn in a test (`evidence-g32-ui`, `evidence-g33-ui`, `evidence3-home`,
`guide-examples-money`).

**The render check** (`render-check.json`): 128,200 strings, 6 distinct faults, none in the frame's screens: "Sleep owed
1 hours" (the Player Profile, the profile area's), "rehearsed together 1 times" (Coursework, the school area's), and
"-$3" written four ways on Money (the money area's). They're for the coordinator.

**The frame walk** (`frame-walk.mjs`, `frame-walk-1440.json`, `frame-walk-390.json`): what the text walk doesn't reach.
Three slots set in the browser's store, one this version's save, one marked as an older version's, one not a save. The
startup sequence's every stage label, Ready, Before You Continue with "Slot 3: That save file is damaged and can’t be
read." and "Slot 2 was saved by an older version of SLATE. It’s updated when you open it, and a backup of it is kept
first.", Version 1.1.0 · Save Format 94; the slots, with Save Format 93 · Updated When Opened and the unreadable slot;
then the top bar (Not Saved Yet, Save & Exit), the Advance menu, the phone's Menu, and the Calendar by the C key, its
breadcrumb Home › Calendar, its heading Your Plans And Commitments and its legend.

**Found by the walks and fixed:** a calendar cell's accessible name said "One thing on it." and "2 things on it."
side by side (`ui/workspaces/cell.ts`); a count under ten is a word now ("Two things on it."), held in the Calendar
screen's test. The breadcrumbs' names (`ROUTE_LABELS`) are held against the rail's in `tests/language-frame.test.ts`.

**Not reached on screen, and why:** the startup's failure (Startup Stopped, "… failed.", Try Again): the adapter always
answers in a browser with storage; its words are read where they're set.

**The whole suite**, once (`npx vitest run`, its exit read from the file): 378 files, 4,609 tests, 3 failed, each an
assertion of the old words that no batch's own run had reached: `tests/sleep-commitments.test.ts` (You Slept Through's
body is a sentence since batch 4), `tests/defects-g5-1.test.ts` (an entry's "If you aren’t, it’s missed." begins a
sentence since batch 6), `tests/migration-94.test.ts` (an unknown command's player sentence, and its name in `detail`
since batch 1; the test now holds both). Each updated as exactly as before; the three rerun: 3 files, 9 tests, exit
0; eslint 0 and tsc 0 on them.

## For The Coordinator: Labels Other Areas Quote

The guide's body chapter (the health area's) names the Sleep dialog's labels. What batch 2 changed in that dialog
(`src/ui/shell/TimeControls.tsx`, SleepDialog), old to new:

| Old | New |
|---|---|
| You’d wake at | You’d Wake At (a stat label, so Title Case) |
| Sleep 1 Hours (the button, at one hour) | Sleep 1 Hour; at two or more it's still Sleep N Hours |
| This would be tonight’s sleep. You’d be up from …, and the rest of the night wouldn’t be slept. | This would count as tonight’s sleep. You’d be up from …, and you wouldn’t sleep the rest of the night. |
| You would sleep through N commitment(s): | You’d sleep through one commitment: / You’d sleep through two commitments: |

Hours, Not Yet, Needed Now and Most Worth It aren't in the frame's files and weren't changed here. The sleep
warnings in `life.ts` (`suggestedSleep`, `sleepReason`) were reworded in batch 4: “…” in curly quotes, the hours as
a duration ("in 2h 30m", not "in 2.5 hours"), and the longest night's sentence read from `LONGEST_NIGHT`.

`wellbeingSummary`'s last line (`life.ts`, Home's How You Are and the player's own page) said "Holding up, and no
dial is far enough out to be worth naming." Batch 4 rewrote it as "Holding up, with nothing out of the ordinary to
worry about.", so "dial" no longer reaches the player from it.
