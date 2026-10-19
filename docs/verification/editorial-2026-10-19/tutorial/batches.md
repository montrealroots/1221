# The Tutorial Area's Batches

Brief 15, "Complete Natural-Language Editorial Pass, Including All Retained Text", the tutorial area: the guide's
seventeen chapters (`src/engine/content/tutorial.ts`), the guide's dialog and How This Works (`src/ui/guide/`), the
refusals in `src/engine/world/tutorial.ts`, and the contents' groups (`src/engine/content/guide/index.ts`). Worked in the
clone `scratchpad/e15-tutorial`, on `ed15-tutorial`, from the pass's baseline `6d111b49`. 47 sources, 10,929 words, all
Pending in the second pass at the start.

The before-and-after pairs are in `examples.json`, a sample of what was kept in `retained.md`, the defects in
`defects.md`, the renamed labels in `renames.json`, the words in `glossary.md`, and each chapter's route on the built app
in `routes.md`, from `follow.mjs` (its log and screens in `follow-1440/` and `follow-390/`).

Every check below was run from the clone, its exit read from a file. `checks.sh` in the scratchpad runs them in order:
`tsc -b --noEmit`, `eslint` on the batch's files, then title-case, label-sweep, plural-check, voice-check, tics,
spelling, typos, text-inventory, doc-refs, deciders and guide-quotes.

## Batch 1: The Guide's Dialog, How This Works, The Refusals And The Contents

**Sources (29):** `src/ui/guide/Guide.tsx`, 5 (`Gated`, `LockedPanel`, `GuideStrip`, `GuideButton`, `GuideDialog`);
`src/ui/guide/Help.tsx`, 11; `src/ui/guide/HowItWorks.tsx`, 1; `src/engine/world/tutorial.ts`, 2;
`src/engine/content/guide/index.ts`, 10 (`GOALS` and `SEARCH_EXAMPLES`).

**Rewritten (10):**
- `world/tutorial.ts#registerTutorial`: the working reference's example 8, “You started without the guide, so
  everything is already open.” The other three refusals there were already plain and stay.
- `Guide.tsx#GuideDialog`: what the dialog says once a chapter is read names the button beside it (“Press Try It to go
  and use it”) and where the guide opens next time; the last chapter's line leads with what to do (“To read any chapter
  again, press Guide at the top of the screen.”); What Reading It Opens is What It Opens.
- `Help.tsx#Contents`: “Everything is open on this life. The chapters are there to read in any order.” is “Everything
  is already open. You can read the chapters in any order.”, without the brief's “this life”.
- `Help.tsx#Entry`: the not-open callout is an instruction (“Read “…” in the guide to open it.”) beside its Read About
  It button; Fold It Up is Show Less, and the toggle lost its pressed state (`defects.md`, 1).
- `guide/index.ts#GOALS`: five groups' leads. Coursework And Partners had “the work your classes set” and “feedback”
  for the teacher's notes and left out Your Class; Productions And Casting left out How You’ll Play A Part; Your Craft
  said “a piece of work explained”; Money And The Bank ran out of its entries' order and left out savings and the
  account at home; Papers left out Residence Abroad.

**Kept (19), with reasons in their statuses and a sample in `retained.md`:** Locked; the locked panel's line, which
names the chapter and what the panel will hold; the strip (Guide · 2 Of 17, Read); Guide (N Left); the help's frame
(“The clock waits while you read.”, Back, Close, Search How This Works, its placeholder); How It Connects' six
headings; Contents and Search; Back To Help and Back To the screen left; the empty search's hint and the no-match line;
How This Works; four groups' leads that already named their entries in order; the two searches the hint suggests; and
the refusal for a part not yet open, which names the chapter, the one to read first and where Guide is.

**Meaning-sensitive:** none changes what a control does. The toggle's pressed state was removed: it's an accessibility
fix (`defects.md`, 1), and Show Everything still opens every section and Show Less folds them, which the new test
presses. The GOALS leads were each checked against the group's entries in their order (`entriesOf`, listed with
vite-node).

**Interactions read whole:** a locked panel on Home, its Read About It, the guide opened at that chapter, I’ve Read
It, the Opened page and Try It; a locked control's tooltip and the command's refusal (`lockedBecause`); How This Works
from a panel, ? for the contents, / for the search, a search that finds nothing, an entry not yet open with its
callout and Read About It, Show Everything and Show Less, Show Me Where and Back To Help.

**Tests updated, as exactly as before:** `tests/evidence-g02-life.test.ts` (the no-guide refusal; the contents' line on
a finished guide; What It Opens, present and absent), `tests/evidence-g29-ui.test.ts` (the no-guide refusal),
`tests/help-mechanics.test.ts` (Show Less; the not-open callout; It’s open now after each chapter; the last chapter's
line). **New:** `tests/help-mechanics.test.ts`, 'Show Everything and Show Less name what a press does, with no pressed
state'. No tool matcher named these words (`grep -rnF` over `tools/`).

**Checks:** `tsc` 0, `eslint` 0, title-case 0, label-sweep 0, plural-check 0, voice-check 0, tics 0, spelling 0, typos
0, doc-refs 0, deciders 0, guide-quotes 0; text-inventory 1 until the batch's sources were marked, then only for the
next batch's Pending chapters. `vitest run` on `help-mechanics` (12 tests), then on `evidence-g02-life`, `evidence-g29-ui`,
`guide` and `tutorial` (81 tests): exit 0 each.

**Screens verified (built app, 1440 wide):** the guide's Opened page after each of the seventeen chapters and the last
chapter's line; the help's contents with every group's lead (`follow-1440/help-contents.txt`, screenshot
`02-help-contents.png`); the empty search's hint and the no-match line (`follow-1440/log.txt`, chapter welcome).

## Batch 2: The Guide's First Ten Chapters, Your Day

**Sources (11):** `src/engine/content/tutorial.ts`, `hoursOf` and the chapters Your Life, Hour By Hour; What’s
Coming; The Clock; Moving Time On; What Needs You; How You Are; Sleep; Looking After Yourself; Your Own Plans; and
Weather (`CHAPTERS [welcome]` to `[weather]`), about 2,300 words.

**Rewritten (10):** every chapter. The pattern, chapter by chapter: the first sentence is the first action and its
control (“Press Play, in the top bar, to start the clock”; “To jump ahead instead of waiting, press Advance”; “Press
Open Calendar … to see the whole month”); the engine as a subject went (“the world tells you things”, “a word stays
plain text until the chapter that opens it has been read”); each closing line says which chapter to read next and
why, as an instruction (“Read “Sleep” next, about how your energy comes back.”); and fragments became sentences (“the
top bar says until when”, “its climate, its season and that day’s luck”). Two leads changed: Sleep's “The night, and
what it gives back.” and Weather's “The sky over your town, …”. How You Are's age ceiling and traits moved behind The
Details: they're the figures, not the task.

**Kept (1):** `hoursOf`, which says “half an hour” for the Sleep dialog's shortest sleep and a plural count otherwise.

**Meaning-sensitive, and how each was checked:**
- **What’s Coming, Skip It.** The brief's example said school events have no Skip option. The code (`calendar.skip`
  takes only `PLAN_KIND`; `DueNow` shows Skip It only for `mine`) shows a doctor's appointment, therapy and an office
  visit have none either, so the chapter says only a plan of your own has Skip It, and you can't skip a class “or any
  other commitment”. Played: the clock stopped at Registration And Your Account with Go and Stand Here and no Skip It.
- **What’s Coming, what a commitment is.** It now names an appointment among them: `appointments.ts` schedules one
  with `requiresPlayer`, so the clock stops at it.
- **How You Are, condition.** The old sentence said condition came “after illness, injury and rest”. An injury moves
  stress and morale, not condition (`mayHurt`), so the sentence was wrong (`defects.md`, 2). It now names what wears
  condition down (illness, going hungry, heavy stress, short nights: `life.ts`, `health.ts`) and what mends it (a night
  of real rest, `applySleep`), as the glossary's row does. `tests/guide-chapter-facts.test.ts` measures an injury and
  fails a condition sentence that names injury while it changes nothing.
- **Moving Time On, the times.** “(ten)”, “(seven)” are “(10 p.m.)”, “(7 a.m.)”: the menu's own 10:00 PM and 7:00 AM.
- **What Needs You, Mark Read.** “Clears them from the panel”: the panel draws only unread notices, and Mark N Read
  marks them all (`Home.tsx`). Played: Mark 3 Read left All Clear.
- **Sleep, while at a commitment.** “The top bar says when you’ll be free”: `topbar-why` says “You’re at … until
  1:00 PM.” Played, at Meeting Your Class.

**Interactions read whole:** a new life's first screen, the guide opening by itself, a locked panel and its Read About
It, the links on Home's greeting line and in Where You Are; the Calendar panel, an entry's look, the stop's dialog and
its three buttons, On The Way, Choose An Event's Skip To Event; What Needs You and Mark Read; How You Are, Readiness and
its measures; the Sleep dialog and the grayed Sleep with its reason in the bar; the Look After Yourself menu and its
toast; the Calendar screen, a day, the plan form, Put It On, the plan's dialog and Call It Off; the Weather panel and its
look. Each against the chapter's words and the How This Works entry the frame area owns for it.

**Tests updated:** none held these chapters' old words. **New:** `tests/guide-chapter-facts.test.ts` (two tests).
**Tool matchers:** none named them (`grep -rnF` over `tools/` for each changed sentence's opening words).

**Checks:** `tsc` 0, `eslint` 0, title-case 0, label-sweep 0, plural-check 0, voice-check 0, tics 1 then 0 (a new
sentence opened on “Nothing”, the tic's budget being 0 over; it now says “before you press it”), spelling 1 then 0
(“behaviour” in the new test's comment), typos 0, doc-refs 0, deciders 0, guide-quotes 0, text-inventory 0 for these
sources once marked. `vitest run` on `help-mechanics`, `guide-chapter-facts`, `defects-g1-1`, `tutorial`,
`guide-examples-start-day-body`, `evidence-g34-ui`, `evidence-g33-ui`, `evidence-g32-ui`, `language-data-dates` and
`guide`: 10 files, 167 tests, exit 0.

**Screens verified (built app, 1440 wide, `follow-1440/`):** each chapter read word for word in the guide dialog, its
details opened (`chapter-01-welcome.txt` to `chapter-10-weather.txt`), then followed: 208 checks, 0 failed, no page
errors (`log.txt`, `results.json`). Screens kept: `03-on-the-way.png`, `04-a-commitment-stops-the-clock.png`,
`05-sleep-dialog.png`, `06-sleep-grayed-at-a-commitment.png`, `07-look-after-menu.png`, `08-plan-call-it-off.png`.
