# Brief 24: SLATE's UI Alignment, Home Spacing And Navigation Cleanup, 2026-10-23

The owner's brief 24 (`../briefs-2026-10-16/24-finish-slates-ui-alignment-home-spacing-and-navigation-cleanup.txt`, kept
verbatim) asked for four changes and their verification on the built app:
1. contextual help lined up the same way everywhere;
2. a compact Home on a phone held on its side, at 667×375, 844×390 and 932×430;
3. a compact All Clear in What Needs You;
4. Calendar and Updates off the sidebar and the drawer, reached from Home, each with a way back.

Its checks were written before any change (`criteria.md`), from brief 23's tested build. This is the receipt.

**Emulated, not held.** Every "phone" here is Playwright's Chromium with touch, no hover and a phone's screen size. No
physical phone was used. "Larger text" is the browser's own default text size set through the DevTools protocol
(`Page.setFontSizes`), as a player's setting sets it, and "200%" is a 1280×720 window laid out at 640×360. No screen
reader was run.

## The Tested Commit

`05060742` on `claude/peaceful-hamilton-59zdbb`, the last change to `src`. Brief 22's browser lanes were played on it.
The turn suite was made on `23b8a77a`'s build, and the after pictures, the help audit, the checks, the keyboard and the
walk on `1a87be4c`'s. `src` differs from the tested commit's in three places, none of which changes what those measured
draw:
- `shell/turn.tsx`, a scroll kept while the phone is on its side, which acts only when a phone turns upright (the turn
  suite was made with it);
- `screens/Home.tsx`, What Needs You's line for nothing waiting, which no screen drew once All Clear stood alone;
- the stylesheet's one column for Home under 600 wide (defect 7), a width none of them used (the 200% window is 640). The before pictures and the before audit were made on brief 23's build
(`113765a6`, its `src` `a00f159a`'s).

| Commit | What |
|---|---|
| `cb8b19eb` | The four changes, the guide's and the tutorial's words, the tests, the records; criteria and scripts |
| `1a87be4c` | Larger text gets the drawer as a narrower window does; Home's headings keep their help beside them on a phone |
| `08de921c` | The evidence on the final build, this receipt, the handoff |
| `23b8a77a` | A phone turned upright keeps each scroll as it stood on its side (the walk's turn suite found it) |
| `8ad20c4d` | The playthroughs and the acceptance walk read the game's date from the bar's own date (no `src` change) |
| `4bfb3f33` | What Needs You's line loses words it no longer showed; the acceptance walk reads All Clear as the panel says it |
| `05060742` | Home under 600 wide is one column again (brief 22's UI lane found it at 390) |

## What Changed

### 1. Help, Lined Up By Where It Stands

How This Works is one component (`ui/guide/HowItWorks.tsx`), a small ghost button whose words sit inside 12 pixels of
padding each side. Until this its box was lined up, not its words, so its words stood 13 pixels in from every edge they
lined up with. Now each place it stands has one shared rule (`styles/app.css`, after `.how-it-works`), the offset the
button's own padding (`--ghost-pad`):
- **A card's head** (`Panel`'s `help`): its words end on the card's content edge, on the heading's first line. The margin
  belongs to the actions, on the side a ghost action ends them (`.panel-actions:has(> .btn-ghost:last-child)`). On a
  second row the row starts under the heading's first letter (the head's `space-between` puts a line's one item at its
  start).
- **A section's head** inside a card: `SectionHead` (`components/primitives.tsx`), its label and its help on one
  baseline, in 14 section heads across 8 files that each had a `row-between` of their own (Study Plan, the brief, coursework, rehearsal,
  School, Opportunities and others).
- **Beneath what it explains:** a `.help-below` row, one spacing under the content, its first words on the content's
  left edge: Home's head, the weather, Up Next's own plans, How You Are.
- **In a row of buttons, a dialog's foot, a menu, a sentence:** a button among buttons, as it was.
- **A heading's link** (the words that open its look) is an inline flex box, so a heading that runs to two lines has its
  help beside the first. A button is an inline block, whose baseline is its last line's: School's long coursework titles
  had their help 30 pixels down.

### 2. Home On A Phone On Its Side

Below 500 pixels tall (`SHORT` in `screens/Home.tsx`, the drawer's own height):
- The greeting's line is the town, its zone, the season and the sky now ("· 66°F Overcast"). The time isn't said: the bar
  has the clock.
- The days ahead, the high and low and the daylight fold under **Forecast And Daylight**, which opens them in place and
  says so (`aria-expanded`, `aria-controls`); **Hide The Forecast** folds them again.
- **What Needs You** shows the most pressing question or thing to put right, with all its actions, then "One more
  waiting." or "Two more waiting." and **Show All N**, which shows every one and then **Show The Most Pressing**.
- Two columns from 600 pixels wide, each stacking (What Needs You over How You Are, Up Next over Recent Updates), so Up
  Next starts in the first window at 667. A heading's basis is 8rem there, not 12, so its help stays beside it.
- Space came out, not size: no font and no control is smaller than brief 23's, and every touch target is 44 or more.

On a desktop Home is as it was, the forecast shown.

### 3. All Clear, Compact

With nothing waiting, What Needs You is its head and one All Clear line (`Empty compact`), not a block in the middle of a
card stretched to Up Next's height. How You Are moves up under it. Nothing in the game changes to make it so.

### 4. Calendar And Updates From Home

- **Off the menu and the drawer** (`homeOnly` in `shell/destinations.ts`): the menu is six places, Home, Player Profile,
  School, Career, Money and Papers, and Your Day went with them. On either screen the menu marks Home.
- **Always offered:** Up Next's **Open Calendar**, with plans or none, and Recent Updates' **View All Updates**, unread or
  none.
- **The way back:** **Back To Home** at the head of each (`components/BackToHome.tsx`), where its eyebrow was. A trail of
  Home and the screen alone isn't drawn (it said Home twice); a longer one is.
- **The same screens:** every action, filter and notice kept. The C key and links from other screens still open them.
- **The guide:** Open Calendar opens with "What's Coming", the chapter that opens the calendar. Until now it waited for
  "Your Own Plans", and the menu's Calendar was the way in between, so a guided life would have had no way to the
  calendar for a chapter. "What Needs You" names View All Updates at the foot of Recent Updates. How This Works says the
  same (`content/guide/day.ts`, `start.ts`, `content/tutorial.ts`).
- **The counts:** the number beside Home counts the questions, as it did. The unread count that stood beside Updates is
  Recent Updates' own line.

### Found On The Way, And Fixed

| # | What | Fixed by | Held by |
|---|---|---|---|
| 1 | A card head whose one action was its help took the margin on both sides, and its words ran 11 pixels past the card's edge (the first version of change 1) | The margin on the actions, not the action | the help audit |
| 2 | A two-line heading's help on its second line, 30 pixels down | The heading's link an inline flex box | the help audit |
| 3 | At 667×375 What Needs You's help took a row of its own, and the first thing waiting started cut at the window's foot | Home's heading basis 8rem on a short screen | the pictures, `home-offer-waiting-667x375m.png` |
| 4 | Text at 150% in a 1280 window kept the desktop's bar: Look After Yourself ran to three lines out of it and Save & Exit 5 pixels past the window | The drawer's and the bar's widths in em (`DRAWER_QUERY` and the stylesheet) | `app/checks.mjs` |
| 5 | The first version of 4 left Menu's own rule at 901px: with text at 150% the rail was a drawer with no Menu to open it | Menu's rule the drawer query's complement, in em | `app/checks.mjs` |
| 6 | A phone turned upright and back put four of eight lives' Career Work 63 pixels up the page (300 to 237): at 390 wide the page was shorter once help sat beside its labels, the browser clamped the scroll as the window narrowed, and the turn read it after | `TurnFrame` keeps each scroll as it moves while the phone is on its side, and puts that back | the walk's turn suite, 8 of 8 |
| 7 | In a window under 600 wide Home's cards kept their second column: at 390 the grid was 0 and 342 pixels, What Needs You 2 pixels wide and How You Are 34, its labels split mid-word and its help cut off (`captures/checks/home-grid-390-on-4bfb3f33.jpg`) | The one-column rule as specific as the placements it undoes | brief 22's UI lane at 390; one column of 358 at 390 and 528 at 560 after |

## Measured

### The Help Audit

`app/help-audit.mjs` measured every visible How This Works on Home, the Profile, Calendar, Updates, every tab of School,
Career, Money and Papers, the Look After Yourself and Advance menus and the Sleep dialog, for a new student, an offer
waiting, a released run and a developed student, at 1440×900, 844×390 and 667×375: 1,530 before, 1,482 after (the phone's
folded forecast and its one question hold the rest a press away). Its words' box against the heading's, the edge and the
content above it, before → after:

| Kind | At | Words on the heading's baseline | Right end, less the heading's inset | Left, on a second row or beneath | Space above, beneath |
|---|---|---|---|---|---|
| Card head (358) | 1440 | 0 → 0 | 13 → 1 | none | |
| | 844 | 0 or 30 → 0 | 13 → 1 | 0 to 13 → 0 to 1 (34 → 18 on a second row) | |
| | 667 | 0 or 30 → 0 | 13 → 1 | 13 → 0 to 1 (20 → 52 on a second row) | |
| Section head (37) | all | 0 → 0 | 13 → 1 | | |
| Beneath | 1440 | | | 13 or 362 → 1 | 6.4 or 14.4 → 14.4 |
| | 844 | | | 13 or 192 → 1 | 14.4 or 22.4 → 22.4 |
| | 667 | | | 13 or 433 → 1 | 14.4 or 22.4 → 22.4 |

1 is a rounded pixel. The space above differs by size because a phone's button is 44 tall with its words in the middle.
At 667 more heads wrap than before because Home has two columns there; each wrapped row starts under its heading. The
audit's first after run read a flush card's right end from its head's padding, not the card's; that was fixed in the
script, and both builds were measured again with it (the numbers above).

### Larger Text, The Drawer, The Empty States

`app/checks.mjs`, on the final build:
- **Larger text**, at 125% and 150%, on Home, Calendar, Updates, Money and School at 1280×720 and 844×390: 20 pages, none
  wider than its window, no text cut without a way to read it, every card head's help on its heading's line or on a row
  of its own under it. The same script on brief 23's build: at 150% every one of the five pages at 1280 was 5 pixels
  wider than its window (defect 4), and the rest held (`measured/checks-before.json`).
- **The drawer** at 667, 844 and 932: its nine controls, the six places, your name, Guide and Save & Exit, each brought into
  view by its own scroll, whole, nothing over it, 44 or more tall. Brief 23's had eleven, Calendar and Updates among
  them, each as reachable.
- **The empty states:** with nothing planned, Open Calendar opens the Calendar's No Plans; with every notice read, Updates
  opens on All and its Unread says All Read; Back To Home from each lands on Home. At 1440×900 and 844×390.

### The Keyboard, 200% Zoom And A Changing Height

Brief 23's `../ui-2026-10-23/app/keyboard.mjs` on the final build (`measured/keyboard-after.json`), with the released
run's save:
- Tab from the top reaches Skip To Content first, and Enter on it puts the focus in the page.
- Each of the menu's places (six, and your name, which opens the Profile) opened from the keyboard is marked where you
  are, in the page head's words.
- Advance opens on Enter and closes on Escape with the focus back on it; the Sleep dialog keeps the focus inside it both
  ways round and gives it back to Sleep; Money's tabs move with the arrows, Home and End.
- At 200% (a 1280×720 window laid out at 640×360): the drawer, every section, every place, the bar's five controls and
  the guide and the save at the drawer's foot, no page wider than the window, the page under the bar. Home takes a
  phone's shape there, so the script presses Forecast And Daylight first. One control Home has at 100% isn't there: the
  greeting line's time, which a phone's shape leaves to the bar's clock (M3); the day's look it opened still opens from
  the date above it.
- A changing height, an address bar shown and hidden on a phone on its side and on a desktop: the bar stays put.

### The Walk

Brief 23's `../ui-2026-10-23/app/capture.mjs`, reaching Calendar and Updates from Home now, walked every destination and
every tab, Look After Yourself, Advance, the guide, the Sleep dialog and the drawer, for eight lives: a new student, a
developed one, a graduate, a graduate with an offer standing, booked work, a released engagement, long names and large
sums, and an older save (`measured/walk-summary.json`, its pictures in the scratchpad only):

| Size | Steps | Page wider | Past its card | Cut, no way to read | Cut, titled | Squeezed | Clipped | Phone target under 44 | Tab half-shown, no cue | Dialog not fitting | Bar height |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1280×720 | 232 | 0 | 0 | 0 | 8 | 0 | 0 | not asked | 0 | 0 | 56 |
| 1440×900 | 232 | 0 | 0 | 0 | 7 | 0 | 0 | not asked | 0 | 0 | 56 |
| 1920×1080 | 232 | 0 | 0 | 0 | 7 | 0 | 0 | not asked | 0 | 0 | 56 |
| 667×375 phone | 240 | 0 | 0 | 0 | 8 | 0 | 0 | 0 | 0 | 0 | 48 |
| 844×390 phone | 240 | 0 | 0 | 0 | 8 | 0 | 0 | 0 | 0 | 0 | 48 |
| 932×430 phone | 240 | 0 | 0 | 0 | 8 | 0 | 0 | 0 | 0 | 0 | 48 |

1,416 steps, none failing a measure, no page error, no step it couldn't take. "Cut, titled" is a label shortened with its
whole words on hover and to a screen reader, as on brief 23's walk.

**The turn suite** at 390×844, every life (`measured/turn-checks.json`), on `23b8a77a`: the rotate screen shown, inert,
with the focus on it; a running clock paused upright; the place, the tab and the scroll kept; an open menu, an open
dialog and a typed search kept; still paused and said once on its side again; no jump on Play; no rotate screen for the
keyboard; an already-paused clock left quiet; Save & Exit turned mid-save. 14 checks a life, 8 of 8 lives. On
`1a87be4c` four lives lost 63 pixels of their scroll (defect 6).

## Tests And Mutations

- **New:** in `tests/evidence-g32-ui.test.ts`,
  - Updates and the Calendar, opened from Home, each go back by Back To Home (2 mutants killed: Back To Home sent
    elsewhere, and the Calendar's taken off);
  - Home on a phone on its side, the query matched: the most pressing of two, One more waiting and Show All 2, both
    after it, the sky in the line and no time, the forecast folded and opened (6 mutants killed: the limit, the fold,
    the sky, the time, the daylight, the things to put right).
- **Changed:** tests that read the menu's eight places, Open Calendar's chapter, the Calendar's eyebrow, Home's All Clear
  and the guide's words read them as they are (`navigation`, `evidence2-b10`, `evidence3-home`, `b20-guide-promises`,
  `guide-examples-start-day-body`, `language-frame-ui`). Each kept its claim.
- **Targeted runs:** 24 files, 356 tests, before the commit.

## The Pictures

Normal windows, the size the brief names, each taken with the clock paused (`app/evidence.mjs`):
JPEG copies at quality 85 of the 2× PNGs the scripts wrote.
- `captures/before/` (brief 23's build) and `captures/after/` (`1a87be4c`), the same names:
  - `home-<life>-<size>.jpg`: Home for a new student (All Clear), an offer waiting (questions and things to put right),
    a released run after midnight, a developed student, and nothing planned, at 1280×720, 1440×900, 1920×1080, 667×375,
    844×390 and 932×430, a whole page beside the desktop ones (`-full`);
  - `home-weather-open-<phone>.jpg`: the forecast opened (after only: before, it was never folded);
  - `menu-open-<phone>.jpg` and `menu-open-foot-<phone>.jpg`: the drawer at its top and at its foot;
  - `updates-from-home-*`, `home-back-from-updates-*`, `calendar-from-home-*`, `home-back-from-calendar-*`;
  - `home-all-read-*`: after Mark N Read;
  - `help-<screen>-1440x900.jpg` and `-844x390m.jpg`: the help beside short and long headings on Career, Money, Papers,
    School and the Profile.
- `captures/checks/` (after only): larger text at 125% and 150%, the drawer's foot at each phone size, the empty Calendar
  and Updates.
- `captures/before/evidence.json` and `captures/after/evidence.json` say what each window held.
- `measured/`: the help audit before and after (`help-*.json`, and the summaries in `help-*.log`), the checks before and
  after, and the keyboard's record.
- `captures/pages/` and `captures/pages/mobile/` (after brief 24, at the owner's word): every page, whole, in the order a
  player meets them, at 1440 by 900 and 844 by 390, on the app built from `e39bb609`. Each has its README; brief 23's
  set, the same 67 pages before brief 24, is in `../ui-2026-10-23/captures/pages/`.

## The Gate

In a clean clone of `859bacdb`, the commit holding the final runs' fold, its exit read from its file
(`../career-genre-2026-10-22/final-runs/runs/gate.txt`): 0. 488 of 488 test files, 5,616 of 5,616 tests, none skipped,
and all 22 checks, the completion matrix's last. Its row folded in, the matrix reads 634 of 658, as at brief 22's close.
Run again on `1ba6ac00`, which holds that fold, the same way: exit 0, the same counts, the matrix holding 634
(`../career-genre-2026-10-22/final-runs/runs/gate-receipt.txt`).

## Brief 22's Final Runs

Every lane but the judge's (whose watched files neither brief 23 nor 24 touched), prefix `f24`, each in a clean clone:
the engine's on `cb8b19eb`, whose `src/engine` is the tested commit's, and A, UI and APP on `05060742`, every step exit 0
but JRC's `b19-lives-diff`, which exits 1 as on every commit since brief 19. The record, with the four starts of the
browser lanes that were stopped and why, is in
`../career-genre-2026-10-22/final-runs/runs/README.md` (Played Again On Brief 24's Commits).
- **Against brief 22's close** (`final-runs/compare.py`, `final-runs/numbers-same-22.json`, `text-same-22.json`): every
  number the same, the runs' own records aside, and six save-opening times in the older-save walk. The text outputs
  differ where the screens' words changed, the acceptance walk 77 of 77 at each width as before.
- **What they found in brief 24, and fixed:** defect 7 (Home under 600 wide), and two tools reading words brief 24
  changed (the bar's date, the line over All Clear), which led to a line What Needs You no longer showed.
- **The matrix:** folded by `verify.py`, `advice/close.py` and `criteria.py`, 633 of 658, the 46 rows held again; the
  634th, the gate's, once it had run (below).

## Limits

- No physical phone, no screen reader, no person playing: what's here is what a browser does with a script's presses.
- The help audit reads every help a script reaches on four lives; a help on a screen it doesn't open (a dialog only one
  life meets, a look's own) is read by the walk's pictures alone.
- Larger text was set as the browser's default size. A user style sheet, or an operating system's text scaling that
  scales the whole page, wasn't tried; the second is the 200% zoom.

## Merged, Not Deployed

The brief: "Keep the changes reviewable. Do not merge or deploy without my instruction." Brief 24 went to `main` with
brief 23 at "Perfect, now merge everything." (2026-10-23), in #62, merged as `a4e6795a`, after the gate in a clean clone
of `8d4139de`, the head merged: exit 0, 488 of 488 test files, 5,616 of 5,616 tests, none skipped, and all 22 checks.
Nothing is deployed. The save schema stays 94.
