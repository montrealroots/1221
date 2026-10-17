# What Crosses Areas: The Coordinator's List

The questions the areas raised that no one area could settle, and what was done with each. Kept as they came in;
each says when it was settled and how.

## Open

- **One word for a commitment.** The frame area says "a commitment" and "you need to be at". `content/tutorial.ts`
  and the health area's `guide/body.ts` still say "something that wants you". Align them once both are merged.
- **The Sleep dialog's labels,** quoted by the health area's body chapter. The frame area renamed "You’d wake at"
  to "You’d Wake At", and the button reads "Sleep 1 Hour" at one hour (frame `batches.md`, For The Coordinator).
  Align the chapter at the health merge.
- **"School" and "Your School."** The rail and breadcrumbs say School. The Profile's button and the School screen's
  eyebrow say Your School. Put to the school area; settle at its merge.
- **Term review or term evaluation.** The glossary says term review, but the school's calendar entries are titled
  "… Term Evaluation", and the Calendar legend follows the entries. Put to the school area.
- **Disposition lines.** Creation's were rewritten (frame). The Player Profile's must read the same for the same
  disposition. Put to the profile area.
- **Rates and SLATE's estimate in money's words.** `content/currency.ts` `RATES_NOTE` and money's "at SLATE’s rate".
  Put to the money area.
- **Quotes across areas.**
  - The money guide quotes the papers area's old banking-abroad refusals. They now read "What … charges … isn’t
    known to the game."
  - `guide/papers.ts` quotes the health area's refusals at lines 315, 334, 339–344, 454 and 479. The health area
    changed line 375 in that file, to match its new HUSKY D line.
  - `tests/guide-examples-*.test.ts` holds each quote to the live words, so the merged suite finds any left behind.
- **The papers guide's quotes of health's words.** `guide/papers.ts` quotes the health area's notices and refusals at
  lines 315, 331, 333, 334, 339–342, 344, 345, 348, 349, 426, 453, 454, 456 and 457, and they no longer match
  (health `batches.md`, batch 2). Lines 375 and 479 are kept in step by `tests/guide-examples-papers.test.ts`.
  The others aren't tested, so they're aligned by hand after every area is merged.
- **Found by the health area on Papers' screens** (merged; the papers area had finished):
  - "1 days" on Passport And ID (Canada's faster passport);
  - "HUSKY D: $20.00 of $0.00 paid this year";
  - "charity", where the button and the new refusals say financial assistance;
  - the Marketplace paragraph, 246 to 309 words in one block at 390 wide.
- **Found by the health area on Home:** "Worth -$227" in the money line.
- **The guide's `next` on every entry.** Once every area is merged, `tests/guide.test.ts` asks it of each entry, as
  the tutorial area proposed. An entry with none says why in its area's batch record (papers: `documents.residence`,
  `papers.pensions`).
- **The Core glossary's additions:**
  - "question", a row in What Needs You (frame);
  - "In the game, …" for the game's own rule where the real one isn't published or modeled, and "Assumed in the
    game:" as a fine-print label (papers);
  - "take", "reader" and "reading" (material). A brief's reading is not a class scene's way of playing it, and the
    two names stay apart.
- **A refusal's shape for money that isn't there.** Papers wrote "Your bank can’t cover $…, so nothing was
  charged/paid/changed." Money's own refusals should agree.

- **From the money area:**
  - "SLATE’s rate" is left in `CharacterCreation.tsx` (frame). Papers' `abroad.ts` now says "the game’s exchange rate".
  - `spending.ts` keeps "You can’t afford it.", "past its payment ceiling" and "The Day’s Spending", because the
    health area's `guide/body.ts` quotes them.
  - The limit review's 700 is a literal in both `cardlife.ts` and the guide's prose. A shared constant would keep them
    in step.
  - Glossary terms for Money: "an estimated exchange rate", "credit score" against "credit record", "payment plan",
    and "the game" in place of SLATE.
- **From the profile area:**
  - Core's "work in a genre" counts class scenes, but `practiceGenres` counts only nights and brief takes. Correct
    Core.
  - "Audience" against "house": the profile area uses audience throughout.
  - Creation says "mood" where the wellbeing screens say Morale.
  - The school's `PlayingChooser` says "with the grain of the scene" (put to the school area).
  - The advice's "1 of your last 1 piece calls on it" is held by `tools/advice.ts` check (g)'s match on
    `${pieces} of `.
- **The JSON the game shows** wasn't in the inventory: `genre-demands.json` (149 genres) and `home-accounts.json`
  (75 entries). The inventory reads them now, listed Pending, and a json area reviews them through their builders.

## Defects Raised Outside Any One Area's Reach

- **The live clock stops silently when a tick throws** (frame `defects.md` 1). The top bar keeps showing Pause on a
  clock that no longer moves. It's in `game-context.tsx`'s real-time tick. Read it at integration; fix it if it's
  small and certain, with a test.
- **`tax.apply_plan` decides by its refusal's words** (papers). The plan's decision tests `planRefusal` against
  `/payment plan|application/`, so a change to those words would change what the decision does. The papers area kept
  them. Making the decision read the plan's state is a code change, and it's weighed at integration.
- **Dead content.** `licensepaths.ts` is read by nothing, and most of `licenses.ts` reaches no player (papers). Both
  are Reviewed And Retained. Deleting them is a scope call, left to the owner.
- **The gazetteer's stray spaces:** a trailing one in Bonaire's name, a leading one in Curacao's capital (health).

## Settled

- **Energy and condition in Core** (2026-10-17, `6dff8679`). Only sleep restores energy, and an injury doesn't lower
  condition. The health area found both; the Core entries say so.
