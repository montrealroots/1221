# What The Inventory Missed

Brief 15, section 2: "Use the existing inventory as the baseline, but verify that it covers the actual sources. Record
omissions rather than assuming the inventory is exhaustive." This is that check, made before any text changed.

## How It Was Checked

`tools/text-omissions.mjs` reads a walk of the built app, every screen's text, controls, dialogs and placeholders, and
holds each line of four words or more against the inventory (`tools/text-inventory.mjs`). Each line is one of:
- **held:** an inventory string accounts for it, either as a fixed stretch of a template or as part of a longer
  string;
- **outside the inventory:** its words are in a file under `src/` the inventory doesn't read;
- **assembled:** a template built it from values, so no file holds it as written.

It was run twice:
- **on brief 14's final walk** (`../language-2026-10-17/final-walk/`, 816 screens with its capture of the menus and
  dialogs);
- **on a fresh walk of `main` at `bdb23949`,** both widths and all fifteen scenario saves (`before/walk-1440/`,
  `before/walk-390/`, `before/omissions-walk.json`).

| Walk | Lines | Held | Outside the inventory | Assembled |
|---|---|---|---|---|
| Brief 14's final walk and capture, 1440 | 4,793 | 3,753 | 0 | 1,040 |
| `bdb23949`, 1440 and 390 | 3,706 | 3,057 | 0 | 649 |

The first run of the tool found four lines "outside the inventory", all from `content/security.ts`. That data file is
one long JSON string in the inventory, and the tool only looked for an inventory string inside a screen line. It now
looks the other way too, and they're held.

**The assembled lines** were grouped by shape, figures, dates and times set aside. Each group is a label or a template
from the inventory, filled with values:
- a preparation step's "Note priority N; complete at N";
- a pending card line, "Groceries · Pending, posts DATE";
- an ability row, a weather line, a class's code and due date;
- a notice's "It came in N weeks ago. It's second of your N unread notices.".

None holds words from a file the inventory doesn't read.

## The Omissions

The walk only reads what `src/` builds, so the files the page loads from elsewhere were looked at by hand. Three
weren't in the inventory:

| What | Where | What it shows | Now |
|---|---|---|---|
| The page's title and description | `index.html` | The browser tab's "SLATE", and "SLATE - an actor and actress life simulator." where a link to the game is shared | In the inventory as `index.html#head`. The description was rewritten: "SLATE: an actor's life, simulated hour by hour." |
| The holiday names | `public/holidays/*.tsv`, 206 countries | The calendar's observances, in English ("January 1, 2027 New Year's Day.") | In the inventory as `public/holidays#names`, 1,430 distinct names. Kept: they're the names of real observances as the published data spells them. |
| The gazetteer's place names | `public/geo/*.tsv`, 248 countries | The towns in creation's birthplace picker and wherever a place is named | Not inventoried. They're proper names, shown as the data spells them, and there are hundreds of thousands of them: no sentence in them is the game's to write. |

The inventory also leaves out two directories, `geography` and `world-data`, that no longer exist under `src/`, so
nothing hides there.

### One More, Found At The Cross-Area Review

A citation that starts with a web address wasn't in the inventory: `isWords` set aside any string that began with
`http`, so it missed what follows the address too. That's every genre's "Source for its definition" line on the genre
look, "https://www.britannica.com/art/film-noir (Encyclopaedia Britannica; direct fetch blocked)", and 22 other
citations (`school.ts`'s work limits, `lending.ts`'s ChexSystems and French law, `safetynet.ts`'s unemployment and
dental plans, and others). The walk's check missed it too: the screen's line is "Source for its definition: " plus a
value, so it counted as assembled, though the value wasn't one the inventory held.

From brief 15's coordinator on, a bare address is set aside and an address followed by words is read. That brought 21
sources in and gave 139 more new words. Every one was read and marked:
- **The genre lines:** 30 of the 149 said how the research reached a page ("direct fetch returned 403", "also listed",
  "referenced in search results"). They're plain citations now. Brief 15 left the definitions themselves as they were.
- **Two citations** named the research's own files (`research-yale-leave.json`, one of them on the study plan's
  work-study fine print). Two others said "SLATE's estimate". Both kinds are gone.

## What This Can't Show

A walk reads the screens it reaches:
- each rail destination and tab on fifteen saves;
- the first notices on Home;
- in brief 14's capture, the menus and dialogs.

A sentence shown only in a state no save reaches isn't on a walk. Such a sentence is still in the inventory, because
the inventory reads the code. What the walk can't prove is that every such sentence is reached by the code paths the
inventory reads, rather than built somewhere it doesn't look. The areas' own walks after their rewrites, and the
final walk, are run through the same tool again.
