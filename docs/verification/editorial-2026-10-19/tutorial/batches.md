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
