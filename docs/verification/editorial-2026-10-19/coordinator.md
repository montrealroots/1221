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

### From The Papers Area (merged `8b8e820a`)

- **Tutorial** (`content/tutorial.ts`), sent to the tutorial area while it works:
  - line 384, to follow the papers area's rename "Your Conditions" → "Your Long-Term Conditions";
  - lines 445, 480, 481, 483, 485, 495 and 499: "current account" → "checking account".
- **Health** (`systems/health.ts`, lines 1822, 2173 and 2441): "current account" → "checking account". Sent to the
  health area while it works.
- **Money:** if "Savings Covers The Current Account" is renamed, `FROM_CURRENT` in `guide/papers.ts`, line 94, moves
  with it.
- **Frame:** if Go There is renamed, `guide/papers.ts` names it in its overview and in `day.needs`.
- **The owner's to decide:**
  - **Dead content:** `licensepaths.ts` and most of `licenses.ts` are read by nothing. Deleting them is a scope call,
    as it was in brief 14.
- **For the coordinator to decide:**
  - **The US passport's fee basis:** it reads "Two separate payments.", a fragment. It's generated, so a fix belongs
    in `tools/build-passports.mjs`.
  - **`residenceRefusal`:** it has no caller.
- **Glossary:** six terms in `papers/glossary.md`: On Its Way, Answered By, Not by direct debit, Your Long-Term
  Conditions, Left Untreated, and "from a secondary source".

### From The Second Material Area (merged `9d52f895`)

- **School** (sent to the school area while it works):
  - `BriefPane.tsx`, line 174, says a brief's arc of beats twice: in the rehearsal sentence and after the Tone line;
  - `PlayingChooser.tsx`, line 46, "N transitions to play", is the count the pane calls "changes of tone between
    beats".
- **The first material area** (sent while it works): material-b's conventions, so the two halves agree:
  - staging notes as instructions to the actor ("your side of the frame");
  - a voice brief's `reader` field names who it is, under the pane's You Speak To;
  - "Recorded alone at a microphone." made a sentence or cut;
  - three of material-a's sentences given in material-b's form.
- **Glossary:** "on your side of the frame", the You Speak To convention, "clowning" in technique notes, and an
  anthology's "story" for a "segment".
- **Engine-speak:** material's hits fell from 120 to 118. The ratchet is lowered once, at the end, from every area's
  counts.

### Renames, To Carry Into The Guide And Tests

| Area | Old | New |
|---|---|---|
| frame | What Is Yours | Your Money |
| frame | Nothing, Scraping, Inherited (family) | Next To Nothing, Scraping By, Inherited Wealth |
| frame | No subdivisions (State Or Region) | None |
| frame | Current Account (where the game has no bank) | Checking Account |
| papers | Your Social Security Card Came | Your Social Security Card Has Arrived |
| papers | A Citizen | A Citizen Of <Country> |
| papers | Not yet | None yet |
| papers | the state plan's Next Payment ("Decided …") | Answered By |
| papers | Paid by you | Not by direct debit |
| papers | Your Conditions | Your Long-Term Conditions |
| papers | Left Alone | Left Untreated |

## Settled
