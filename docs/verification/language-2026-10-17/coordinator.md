# What Crosses Areas: The Coordinator's List

The questions the areas raised that no one area could settle, and what was done with each. Kept as they came in;
each says when it was settled and how. Until the integration on 2026-10-17 every item below Settled was listed as
open; the integration's five passes (`crossarea/`, `json/`, `journeys/`, `dynamic/`, and the coordinator's own
commits) settled them.

## Open

- **Dead content.** `licensepaths.ts` is read by nothing, and most of `licenses.ts` reaches no player (papers). Both
  are Reviewed And Retained. Deleting them is a scope call, left to the owner.
- **On The Way before Sunday evening** (`journeys/defects.md` 3). It can't see next week's classes until `planWeek`
  plans the week, so from a Friday it asks nothing and from a Saturday it counts five commitments and stops at ten.
  That's the engine's scheduling, not its words, and it's left as found.

## Settled

- **A refusal's shape for money that isn't there** (the editorial review's batch 1, merged `6d83601a`). Papers said
  "Your bank can’t cover $…, so nothing was charged.", health "It costs …, more than your bank can cover.", and Money's
  refusals had their own words. It's one shape now: what can't pay, the amount, what didn't happen, then the next step.
  It has two variants, each with why in `docs/STYLE.md` (`editorial/batches.md`). Until this close-out it was listed
  as open, given to the editorial review.
- **Energy and condition in Core** (2026-10-17, `6dff8679`). Only sleep restores energy, and an injury doesn't lower
  condition. The health area found both; the Core entries say so.
- **One word for a commitment; the Sleep dialog's labels; School and Your School; the term's review; the mood and
  morale; audience and house; charity and financial assistance; an estimated exchange rate** (the cross-area words
  pass, `ce8b26e6` to `49c744f4`, merged with this list). Each is said one way on the screens and in the guide, and
  `docs/GLOSSARY.md` gives it.
- **Disposition lines.** Creation's and the Player Profile's read the same for the same disposition (the frame and
  profile areas).
- **Quotes across areas.** The guide quoted words other areas had rewritten: 74 of 595 quoted sentences, at the
  merge of the eight areas. `tools/guide-quotes.mjs --check` passes now, 577 of 577. One quote the dynamic cases' later
  plural made stale was rewritten at their merge. The guide's labels are on the built app's screens
  (`tools/tutorial-routes.mjs --check`, 760 screens).
- **The Papers screens' faults found by the health area.** "1 days", "HUSKY D: $20.00 of $0.00 paid this year",
  "Worth -$227" and the Marketplace's 246 to 309 words in one block were all fixed by the cross-area words pass. The
  Marketplace now opens on where you stand and two sentences, with the rules in three sections a press away.
- **The guide's `next` on every entry** (the cross-area code pass, `22a3654f`). It's required by the type, and an
  empty one must be named, with its reason, in a batch record (`tests/guide.test.ts`).
- **The Core glossary's additions,** "work in a genre" corrected (nights and self-tapes count, class scenes don't),
  and the eight areas' glossaries assembled in `docs/GLOSSARY.md`, one row for each term (`71706a77`).
- **Rates and SLATE's estimate in money's words; "SLATE’s rate" in creation.** "An estimated exchange rate", from
  the money, frame and cross-area passes.
- **The advice's count.** "your last piece calls on it", and the verb agrees with the count. Both the cross-area words
  pass and the dynamic cases fixed it, and the merge kept the words pass's, which also says the one piece as one
  (`tools/advice.ts` check (g) reads it).
- **The JSON the game shows** (`json/`, merged `d4d2ee01`). All 149 genres were rewritten through the build's word
  list. `home-accounts.json` was shown to reach no screen and is Reviewed And Retained.
- **The live clock that throws; `tax.apply_plan` deciding by words; the 700; the gazetteer's spaces** (the
  cross-area code pass, merged `9b313002`, each with a test that fails without it: `crossarea/defects.md`).
- **The research data's own dates** (the data pass, merged `a5c167ff`). 344 strings in 230 sources say a source's
  date as the game writes one, through each builder's words step, so a rebuild keeps them. The 316 left are each in a
  field no screen reads, in code that's gone, a day the code reads, a document's number, or a quotation. Chase's stray
  space before a semicolon went with them. After that merge, a round-up rule read and checked on one day says it once,
  and a card whose source ends on the day it was read names its terms' day ("Terms as of April 10, 2026").
- **The genre look's small print** (`20f2757e`). The false "only in single examples", the heading that claimed a
  quotation, and the 2,000-character paragraph (`json/defects.md`, D1 to D3).
- **"Left the School"; a duration in words in a sentence; Home's Calendar title on two lines at 390** (`20f2757e`).

## Found At Integration And Fixed There

Each with a test that fails without it, and its mutations, in the commit named.
- The material area's test held words the school area renamed (`243a35bb`).
- The coverage audit's line citations, carried through the brief's test edits by the pipeline that makes the audit
  (`f7fba3e1`, redone through the pipeline in `d5c9509e`).
- The passport's and OPT's grayed buttons said why only in a tooltip (`fa1126d1`).
- An injury's notice said nothing of a care the plan paid, nor of Call In Sick (`961b3f08`).
- A Connecticut ID card in the mail read Being Decided, and a pending replacement showed the lost card's issue date
  (`dcbf4b23`).
- Work On The Note's toast named the part by the engine's id, “revision up 50%”, where a scene's card names no part for
  its revision (`ebdb5577`, `uitools/README.md`). The old toast restored, the note's words dropped, and a named part
  said as “further” each fail a test in `tests/evidence-g24-school.test.ts`.
