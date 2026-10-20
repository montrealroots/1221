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
- **For the owner, from money-data's defects (3, 7 to 10).** Each changes what the game charges or does, which brief 15
  doesn't do (section 9). For two of them (Claim It Back, and Australia's unclaimed money), the words state the law and
  the game does otherwise. That gap is the defect, and the words weren't bent to match the game:
  - card replacement fees where the bank's own words say otherwise;
  - Claim It Back where the country's law says the money can't be claimed;
  - Australia's unclaimed money taken at any balance, where the law takes A$500 or more;
  - term deposit penalties estimated where a bank publishes its rule;
  - BMO's notice period, which may run the other way.

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
- **"What it's known for:"** on the place look (`ui/looks/place.tsx`) is "In short:". The coordinator first kept it,
  then read the health area's report (its defects, 6): a city's tags are adjectives as often as things, and "What it's
  known for: no daylight saving, desert and affordable." made one a thing. "In short:" suits both, as Home's place line
  does.
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

### Read Again In The Areas' Defects, At The Cross-Area Review

The areas' defects files hold what each left to the coordinator. Each item is settled here:
- **A Table Work note named the reason, not the answer** (material-a's defects, 3; school's file). It now reads
  "Given Circumstances: you answered “The night of the ball, while the auction is on in town,” but the text doesn’t
  support it. That’s the third act; this is the day they leave." The comma sits inside the quotation marks, as US
  English writes it, and the full stop doesn't end on the answer. `tests/material-words.test.ts` holds every scene's
  unsupported answers in that form, and two school tests play a term to the note.
- **The glossary's charged off row** said "on your record until paid" (money's m2). It says the record keeps it for its
  country's years, paid or not.
- **A free rush said "costs $0.00 more"** (money-data's defects, 4; Citi and Resona). It says "costs nothing more",
  which is true whether or not the card itself costs something. `tests/language-money.test.ts` draws a Citi life's Your
  Cards, and the test fails with the old words.
- **The weather's picture on Home** (the tutorial area's report) is the one exception `systems/weather.ts` keeps on
  purpose, beside the word and hidden from a screen reader. `docs/STYLE.md`'s Pictures now says so. The code was right.
- **At 390 wide**, two faults (the tutorial area's report, with screenshots):
  - the top bar squeezed a locked control's Locked one letter to a line, and the clock ran over Guide;
  - the guide dialog left a long chapter about 250 pixels to read in.

  `src/styles/app.css`: a locked time control says Locked under its name; under 480 pixels the guide and Save & Exit
  take a row of their own; and at the guide's phone width the chapter scrolls with the dialog. Checked on the built app
  at 390 (`coordinator-phone/`).
- **Left Alone** was already Left Untreated (the papers area). **Current account in a term deposit's end** was already
  checking account (the money area).

### Read Across The Areas, On The Integrated Code

Searches of every source at once, for what separate batches say two ways:
- **Where to press.** "On Papers, under Health Cover" is the game's usual way to send a player somewhere: 48 sentences
  give the screen, then the tab or the panel. Six give it the other way round, "under Genres on your Player Profile",
  and those stay: both orders are plain English, and the nearer name comes first where it's the one to look for. One
  notice named the same control differently from another. The leave's "Your Appointment Is Outside Yale Health" said
  "call it off under Your Doctor on Papers", a panel's name, where the booking notice says "press Call It Off on
  Papers, under Health Cover". It now says the latter. The journey test that holds it fails with the old words.
- **The research's straight apostrophes.** 112 sat in the bank files' shown fields ("the central bank's", "l'usure"),
  beside the game's own. The genre research already had the house's. `houseApostrophe` in `tools/research-dates.mjs`
  does what the attribute builder does, and `--write` rewrote 79 fields. Everything else with straight apostrophes is
  either unshown research (the home accounts' notes, the dead licenses, the passports' notes) or a name as it's
  published (holidays, places).
- **"Your Profile"** in five sentences and **"your Player Profile"** in fifteen: the short form is the menu's word, used
  where the sentence has just said School, and stays.

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

### In The Final Runs

The final runs on `c3478f9e` found what the cross-area review hadn't (`uitools/README.md`):
- **The interface tools.** Seven matchers in `tools/acceptance-ui.mjs` and `tools/playthroughs-ui.mjs` still looked for
  brief 14's words. Each was moved to brief 15's, at least as closely as before (`e5fdacb7`).
- **The coursework warning** ran to 121 words in one block on the health journey, past the playthroughs' wall of text.
  At its longest it reached 144. It is 119 now, held by a test that builds that longest case (`e5fdacb7`).
- **Shown Today's figure.** The school area had written it in whole points, and a trial found a day's step that left
  "about 52 of 100" where it was. It went back to a tenth, as a brief's Taped Now writes its own, and kept the area's
  "of 100" (`d6f6527a`).

Every lane then ran again on `d6f6527a` (`runs/README.md`).
