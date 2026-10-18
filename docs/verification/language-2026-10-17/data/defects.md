# What The Research Data's Dates Found

Functional defects found while rewriting the research data's dates (`batches.md`), apart from the writing.

## Fixed

| # | What | Where | How found | The fix, and its test |
|---|---|---|---|---|
| 1 | **The license builder had drifted from the file it builds.** Run on `c74a02e1`, `tools/build-licenses.mjs` gave a `licenses.ts` without New York's MCTD `district` (`{ cityIds: ['us-ny-newyork'], perHalfYear: 1 }`, the district's $1 for each half-year a license runs, on a first license, an exchange and a renewal) and with Mexico City's license named by the research's description again. Both had been set into `licenses.ts` by hand on 2026-10-06 (`363e8812`, `f9cf1fe1`), against the file's own "don't edit by hand". Any rebuild of the license research, this pass's for its dates among them, would have dropped the district and put the description back into Mexico City's name, which `mayDrive`'s refusal says ("… issues <name>."). Nothing reads the district since the licensing system went in the scope reset of 2026-10-09 (`bcc30c88`), so no fee hangs on it today; the defect is that the build no longer gave its own output. Batch 2's commit message (`27939a7f`) said a rebuild "would have dropped the district's part of a New York City license's fee": true of the code that read it until 2026-10-09, not of today's. | `tools/build-licenses.mjs`, `content/licenses.ts` | Running every builder whose research is in the repository on the unchanged tree before changing any, and diffing its output with the commit: the entry, passport, home-account and genre builders gave theirs byte for byte; this one didn't. | The builder holds both (`DISTRICT`, `NAME`, the interface's `district`), written as the hand edits wrote them, so its run gives the committed file; with the dates added, its diff against `c74a02e1` is the one permit issuer's date (`build-licenses.txt`, and `git diff` in `batches.md`, batch 2). No test runs a builder, as each writes into `src/`; the run and its diff are the check, as `prompts/data.md` asks. `tests/licensing.test.ts`, which held the MCTD's fee, went with the licensing system on 2026-10-09, so nothing in the suite would have caught the drop. |
| 2 | **A card's fine print said its day twice.** The Cards tab printed `Source: ${terms.source}, ${terms.asOf}.`, and 45 cards' sources already ended on the same day: "…/active-cash/terms/, 2026-09-26, 2026-09-26." | `ui/bank/BankCard.tsx` | Comparing each card's source with its `asOf` while rewriting the day (`peek2.ts` in the batch's work: 85 of the sources end on a day, 45 of them on `asOf`'s). | `sourceAndDay` says the day once where the source already ends on it, and both where they differ (40 cards: the day the page was read, then the day of the terms). `tests/language-data-dates.test.ts` 'says the day a product, a card…' counts Chase's day once on the drawn panel; with the guard taken out it fails (mutation-tested). |

## Recorded And Left

- **A round-up rule's two days.** Round-Ups' fine print reads "Source: …, read live October 13, 2026, checked October 13,
  2026." for most of the eighteen banks: the day the page was read, then the day the rule was checked, the same day. The
  two say different things, so both stay; the money area might say it once ("read and checked October 13, 2026").
- **A card source and its terms' day, where they differ.** 40 cards read "Source: …, September 26, 2026, April 10, 2026.":
  the page read on one day, the terms dated another, with nothing saying which is which. Unchanged in meaning by this
  pass; the money area might name the second ("terms of April 10, 2026").
- **`"Kept At … : £… In …"`** in `content/guide/money.ts`, a quoted label pattern with a space before its colon. The money
  area's guide, not data.
