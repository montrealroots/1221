# What Crosses Areas: The Coordinator's List

Each area works only in its own files. What it found in another area's, it reported. This list keeps every such item
as it came in, with what was done about it and when. Nothing here is applied until it's settled at a merge.

## Open

### From The Frame Area (merged `6b70f047`)

- **Money:** "Current Account" in three labels the frame area doesn't own:
  - `src/ui/looks/money.tsx`, line 47: 'Current Account' → 'Checking Account';
  - `src/ui/bank/BankStatements.tsx`, line 225: "Any Current Account Under" → "Any Checking Account Under";
  - `src/ui/bank/BankPayments.tsx`, line 86: "Savings Covers The Current Account" → "…The Checking Account". Three
    tests hold it: `tests/defects-r6-1`, `defects-r3b-1` and `evidence-g11-money`.
- **Tutorial:**
  - `content/tutorial.ts`, line 120, to match the clock's stop dialog as the frame area rewrote it ("You can only skip
    a plan of your own, so there's no Skip It button here."). The dialog also stops for appointments and paper visits,
    not only school events.
  - `world/tutorial.ts`, line 89: the working reference's example 8.
- **Health:** `guide/body.ts` quotes "The payment didn't go through." The frame area kept that sentence, because
  nothing reaches it now. If either changes, the quote moves with it.
- **Glossary:** the frame area's `frame/glossary.md` has new rows: a life, in place of the old universe wording;
  marked Clash; when it's time; checks the weather.
- **Kept, though other areas quote them:** "… there isn't the time before it." (other guides and 11 tests), "The
  payment didn't go through." and "You dismissed that question, so it can't be answered from What Needs You."

### Renames, To Carry Into The Guide And Tests

| Area | Old | New |
|---|---|---|
| frame | What Is Yours | Your Money |
| frame | Nothing, Scraping, Inherited (family) | Next To Nothing, Scraping By, Inherited Wealth |
| frame | No subdivisions (State Or Region) | None |
| frame | Current Account (where the game has no bank) | Checking Account |

## Settled
