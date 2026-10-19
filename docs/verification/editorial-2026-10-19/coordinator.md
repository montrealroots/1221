# What Crosses Areas: The Coordinator's List

Each area works only in its own files. What it found in another area's, it reported. This list keeps every such item
as it came in, with what was done about it and when. Nothing here is applied until it's settled at a merge.

## Open

- **For the owner:**
  - **Dead content.** `licensepaths.ts` and most of `licenses.ts` are read by nothing (the papers area). Deleting them
    is a scope call, as it was in brief 14. They stay, read and marked.
  - **`residenceRefusal`** (`systems/documents.ts`) has no caller (the papers area). A function nothing calls is a
    declared word nothing reads, so this is a defect, recorded in the receipt's defects. Removing it is code, not words,
    so it's left for the owner.
- **The engine-speak ratchet** is lowered once, at the end, to every area's counts, after the cross-area review's last
    change.

## Settled

Each item as the area reported it, and what was done.

### From The Frame Area

- **Money's three "Current Account" labels.** The money area renamed them: Checking Account in the money look, Any
  Checking Account Under in Alerts, and Savings Covers The Checking Account in How You Pay. Its three tests moved with
  them. At the money merge, the coordinator carried the last rename into the tutorial's bank chapter and the papers
  guide's `FROM_CURRENT`.
- **The tutorial's two lines.** The tutorial area took both: the clock's stop dialog as the frame area rewrote it, and
  the reference's example 8.
- **"The payment didn't go through."** Frame and health both kept it, so `guide/body.ts`'s quote holds. guide-quotes
  passes, 581 of 581.
- **"What it's known for:"** on the place look (`ui/looks/place.tsx`) stays. The frame area suggested "In short:", but
  the label names what the list is ("What it's known for: theater, film and nightlife."), and "In short:" wouldn't.
- **The glossary rows** are in `docs/GLOSSARY.md`, with every area's.

### From The Papers Area

- **The tutorial's conditions and checking account.** The tutorial area took both.
- **Health's "current account".** The health area changed it to checking account. No player string in `health.ts`
  says current account (the inventory's search, at the cross-area review).
- **`FROM_CURRENT`** moved with money's rename, at the money merge.
- **Go There** wasn't renamed, so the papers guide's overview and `day.needs` are right as they are.
- **The US passport's fee basis** was "Two separate payments.", a fragment. It's now a sentence, through a words
  override in `tools/build-passports.mjs` (`FEE_BASIS_WORDS`). The builder reproduced the file exactly before the
  change, and the rebuild changes that one line.

### From The Second Material Area

- **School's two items** are in: BriefPane says the arc of beats once, and PlayingChooser counts changes of tone. The
  coordinator read the change at the school merge.
- **Material-a's conventions** are in material-a's batch 9.
- **The glossary's terms** are in, with material-b's row for "on your side of the frame".

### Found By The Coordinator

- **The research's fetch reports**, in the source lines a screen shows, are said in a reader's words now. One rule,
  `gameAccess` in `tools/research-dates.mjs`, covers the bank files' shown fields and the genre small print's builder.
  The genres' definition sources were edited by hand: 30 lines, the fetch reports and the research's "also listed" and
  "referenced in search results". Every change is in `coordinator-access.md`. The home accounts' research has the most
  such notes, but no screen shows it: the game's words for each bank are read by hand into `ABROAD` and `READ`
  (`content/homeaccounts.ts`). The passports', entry rules' and licenses' notes reach no screen either.
- **The inventory's omission** of citations that start with a web address is in `omissions.md`. The 160 sources it
  changed were read and marked.
- **Cambodia's currency** is the Riel, through the world generator's `CURRENCY_OVERRIDE` and the table by hand.
- **ING's round-ups** pause on "your checking account".
- **Two sentences one area changed and another's test held**, found when the merges' tests ran:
  - the tutorial's "doesn't tax that interest", which the stale-claims check read as the removed interests;
  - Before Yale's reordered sentence.
  Also: money's cash refusal ("available"), school's term review, and a comment's apostrophe in the money looks. Each
  is fixed in its merge or the commit after it, as each commit message says.

### The Renames, Carried Into The Guide And Tests

No player string in the guide or the tutorial holds an old label (the cross-area review's search). The tests that held
them moved in each area's batches.

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
| money | Savings Covers The Current Account | Savings Covers The Checking Account |
| money | Any Current Account Under | Any Checking Account Under |
| money | …, To Its Closing | …, Until It Closed |

### At The Health Merge

- **Health's Blocked booking notice** (`systems/appointments.ts`, `bookIn`). The health area left it Blocked: it named
  the date and gave no next step, and a test of the papers guide quoted it, which isn't the health area's file. At the
  merge, the coordinator added "Be there then, or press Call It Off on Papers, under Health Cover." to the notice and to
  the guide's quote of it (`guide/papers.ts`, `papers.doctor`). The coordinator also gave `papers.health-cover`'s quote
  the words the papers area had left it. Eight exact assertions in five test files moved with the notice, among them a
  re-booked specialist in `defects-g8-6`. A mutation check showed that `guide-examples-papers` fails when only the notice
  changes. The seven files run: 124 of 124 tests. text-inventory, guide-quotes, traceability, typecheck and lint all hold.
