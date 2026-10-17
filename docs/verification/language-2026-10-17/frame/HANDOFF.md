# The Frame Area: Where It Stands

Brief 14's frame area, in `scratchpad/l14-frame` on `lang14-frame`. Read `../prompts/common.md` and `../prompts/frame.md`
first; `batches.md` is the record of what's done, `examples.json` the before-and-after pairs, `defects.md` the defects,
`glossary.md` the terms for `docs/GLOSSARY.md`'s section of the same name.

## Done

Every one of the frame's sources has a status (`docs/text/statuses/frame.json`): 486 sources, 131 Rewritten And
Verified and 355 Reviewed And Retained, none Pending or Blocked (`node tools/text-inventory.mjs`, the subsystems start,
home, calendar, notifications and controls). The batches, each committed:

- **Batch 1:** the generic failure (`core/simulation.ts`), What Needs You's commands (`world/world.ts`), the plan
  commands (`world/plans.ts`), the question and notice looks (`ui/looks/attention.tsx`), the provider's clock fault.
- **Batch 2:** the top bar and its dialogs (`TimeControls.tsx`), the shell, A Life, Ended, the locked screen, the rail.
- **Batch 3:** startup, the save slots, the persistence adapters, SlateApp, `engine/index.ts`'s player-facing parts.
- **Batch 4:** Home (`ui/screens/Home.tsx`) and `systems/life.ts` (the summary, the sleep suggestion, slept through).
- **Batch 5:** creation, its pickers and its content.
- **Batch 6:** the Calendar screen; the day, place, weather and plans looks; the names the calendar reads.
- **Batch 7:** the guide's start and day chapters, each entry with `next`; the entry rules' notes, through their builder.
- **The end:** the built app (`after-1440/`, `after-390/`, `render-check.json`, the frame walk's two files), and the
  whole suite (378 files, 4,609 tests; the 3 that asserted old words updated and rerun, exit 0).

## Left

Nothing of the frame's sources is Pending. What's left is for the coordinator:

1. **Defect 1** (`defects.md`): the live clock stops without a word when a tick throws. Not fixed: the fix changes
   what the page does, and is the coordinator's to decide.
2. **Words other areas use that the frame changed:**
   - The guide's body chapter (`guide/body.ts`, health) quotes “You’d wake at”: the Sleep dialog says You’d Wake At,
     and its button "Sleep 1 Hour" at one hour (the table in `batches.md`, For The Coordinator).
   - `content/tutorial.ts` (the tutorial area) and `guide/body.ts` say "something that wants you"; the calendar, its
     looks and the day chapter now say "a commitment" and "you need to be at" (`glossary.md`).
   - The Player Profile's lines for the dispositions differ from creation's new ones (the profile area).
   - "America" (creation's Before Yale, which matches the bank's refusal beside it) and "the United States"
     (everywhere else) are both said.
   - `content/currency.ts`'s `RATES_NOTE`, "Exchange rates are SLATE's calibrated estimates, not a live market." (a
     straight apostrophe, and SLATE as narrator), is the currency look's source line and creation's; the frame says
     "estimated". Money's own "at SLATE’s rate" is the same.
   - The Guide's LockedPanel and Help's "Read About It" against the locked screen's sentence (the button was kept as
     Read About It to match them).
   - "School" on the rail and in the breadcrumbs; "Your School" on the Player Profile's button and the School screen's
     eyebrow.
   - The calendar legend's School row says "each term’s evaluation", as the school titles its entries ("Fall Term
     Evaluation"); the glossary's word is term review. If the school area renames the entries, the legend follows.
   - The Core glossary should carry "question" for a row in What Needs You (a decision, in the code).
3. **The render check's faults, all other areas':** "Sleep owed 1 hours" (Player Profile), "rehearsed together 1
   times" (Coursework), "-$3" on Money.
4. `entry.ts`'s notes keep the research's British spellings ("authorisation"), as an authority's text quoted with its
   source.
