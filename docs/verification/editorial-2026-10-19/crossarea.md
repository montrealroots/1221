# The Cross-Area Review

Brief 15, section 10: "Inspect all eight major areas again after integration to catch different voices introduced by
separate batches." And section 7: read whole interactions, from the feature's description to the later notice. Ten
areas wrote apart, each in its own clone. This is the coordinator reading them together, once every area was merged.

## How It Was Read

Three ways, each catching what the others can't.

- **On the integrated build.**
  - The fifteen scenario saves were made again on `e0e7831d`, the commit after every merge. Saves made earlier hold
    the notices and notes they were written with, so a walk on them shows a stored sentence's old words.
  - The build was walked at 1440 and 390: every rail destination and tab, 25 screens a save.
  - Whole screens were read in each of the eight areas:
    - Home with a notice open, its notice look, the affairs lines and the weather (frame);
    - the notes a showing leaves, the rehearsal request and the coursework's announcements (school, and the material
      they name);
    - the Player Profile's identity, dispositions and What To Work On Next (profile);
    - the Cards tab with its terms, fees and offers (money);
    - the tax return, the DRS plan and its assessment (papers);
    - Health Cover with its doctor, pharmacy, cover and bills (health);
    - the guide's first chapter at 390 (tutorial).
- **Across every source at once.** The inventory holds every string a player can see, so one search reads all ten
  areas' words together. That's how the seams below were found.
- **In the areas' own records.** Each area's `defects.md`, `batches.md` and report named what it left for another
  area or the coordinator. `coordinator.md` settles every one.

A scan of the walked text for what a reader would trip on (`undefined`, `NaN`, a placeholder, a doubled word, a space
before a stop, "a" before a vowel, two stops) found nothing on the 1440 walk.

## What Was Found, And What Changed

| Where | What the areas had said two ways, or wrong | Now | Commit |
|---|---|---|---|
| The advice (profile) | "cost about 1.8 points off the whole a piece", read on the integrated Profile | "cost each piece about 1.8 points off the whole", in all five forms | `c4b4157b` |
| A leave's notice and the booking notice (school, health) | Call It Off sent "under Your Doctor on Papers" in one and "on Papers, under Health Cover" in the other | the button, the screen and its tab in both | `b23e954e` |
| The bank screens' fine print (money, money-data) | the research's straight apostrophes, 112, beside the game's own | the house's, as the genre research has them | `b23e954e` |
| Research source lines (profile, money, money-data) | "direct fetch returned 403", "timed out", "Wayback snapshot", "also listed" | a page that couldn't be opened, didn't load, the Internet Archive's copy, found too | `9ae25748` |
| The inventory itself | a citation that began with a web address wasn't read, so neither was any genre's Source line | read; 160 sources marked | `9ae25748` |
| The place look (frame) | "What it's known for: … desert and affordable." | "In short: …" | `245c0a7b` |
| A Table Work note (school, material-a) | the reason without the answer it was about | the answer named, then the reason | `245c0a7b` |
| A free rush (money) | "costs $0.00 more" | "costs nothing more" | `245c0a7b` |
| 390 wide (frame, tutorial) | Locked one letter to a line; the clock over Guide; a chapter read in 250 pixels | each fixed in `app.css`, checked on the build (`coordinator-phone/`) | `245c0a7b` |
| The US passport, Cambodia, ING (papers, health, money-data) | a fee basis ending in a fragment; "Riels"; "the current account" | a sentence; the Riel; your checking account | `d64ffaef` |
| Tests across areas | sentences one area rewrote and another's test held: the cash refusal, the term review, Before Yale, the alert, the tutorial's Medicaid lines | each test holds the new words, as exactly as before | the merges, `72fe006d`, `e0e7831d` |

## What Was Read And Kept, And Why

- **Where to press.** 48 sentences give the screen and then the tab ("on Papers, under Health Cover"). Six give the
  nearer name first ("under Genres on your Player Profile"). Both are plain, so neither was forced into the other.
- **"Your Profile"** in five sentences and "your Player Profile" in fifteen: the short form follows a sentence that has
  just named School, as the menu does.
- **SLATE naming itself.** "SLATE keeps a backup", "SLATE couldn't find where your saves are kept". An app speaks of
  itself this way, and the frame area kept it. 228 more are in the home accounts' research, which no screen reads.
- **The weather's picture**, beside its word and hidden from a screen reader, is the game's one deliberate picture.
  `docs/STYLE.md` now says so.
- **"Simulated note from …"** on every note a teacher gives: the game says plainly that the note is its own.
- **The dispositions' line on the Profile** ("Risk Tolerance 50, 65 or under, so your card's autopay began on the
  whole statement"). It's dense, but it's what the number did, said once, where it's read.

## What This Can't Show

The walk reads the screens a rail destination and a tab open on fifteen saves. Dialogs, menus and states no save
reaches are read in the code, by the inventory, and by the areas' renders, not here. A reading by one coordinator
is one reader. Whether the voice meets the owner's ear is the owner's to say: `PLAYTEST.md` is the route for that, and
nothing here is human usability approval.
