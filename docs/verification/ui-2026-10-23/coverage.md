# Brief 23's Coverage, Screen By Screen

The owner's brief is in `../briefs-2026-10-16/23-complete-slates-desktop-and-landscape-only-mobile-ui.txt`. Its checks,
written before any change, are in `criteria.md`. Each screen's state before the work is in `inventory.md`. This file
says, screen by screen, what each issue was, what changed, how it was checked on a desktop and on a phone on its side,
which images show it, and what remains.

- **Tested commit:** `208dbf1f`. The app was built from it (`vite build`) and walked by `app/capture.mjs`: eight lives,
  nine sizes, 1,912 steps. The before walk was the app built from `main` at `ebac1923`.
- **Emulation:** "phone" means Playwright's Chromium with touch, no hover and the phone's screen size. **No physical
  phone was used**, and nothing here is said to have been tested on one. "Keyboard" means Playwright's key presses, not
  a person at a keyboard, and no screen reader was run.
- **The measures** are the walk's, defined in `app/capture.mjs` (`measure()`). Both walks were measured with the same
  script, so their numbers compare (`after/audit-summary.json`, `before/audit-summary-remeasured.json`).

## The Walk's Measures, Before And After

Each cell is before → after, the number of steps at that size where the measure found anything. The before walk is
`ebac1923`'s app, measured again with the after walk's script (`before/audit-summary-remeasured.json`, 2,040 steps; the first
before walk, `before/audit-summary.json`, measured with the script as it stood at the start). On `ebac1923` a phone held
upright played the game in a portrait layout, so its 390×844 row walks every screen. After, the game is behind Rotate Your
Phone To Play there, and the row is the turn suite's 32 steps.

| Size | Steps | Page wider | Past its card | Cut, no way to read | Cut, titled | Squeezed | Clipped | Touch target under 44 | Tab half-shown, no cue | Dialog not fitting | Bar height | Rail shown | Rotate screen |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1280×720 | 224 → 232 | 0 → 0 | 0 → 0 | 0 → 0 | 8 → 8 | 8 → 0 | 0 → 0 | not asked | 0 → 0 | 0 → 0 | 56 → 56 | 224 → 232 | 0 → 0 |
| 1440×900 | 224 → 232 | 0 → 0 | 0 → 0 | 0 → 0 | 7 → 7 | 4 → 0 | 0 → 0 | not asked | 0 → 0 | 0 → 0 | 56 → 56 | 224 → 232 | 0 → 0 |
| 1920×1080 | 224 → 232 | 0 → 0 | 0 → 0 | 0 → 0 | 7 → 7 | 4 → 0 | 0 → 0 | not asked | 0 → 0 | 0 → 0 | 56 → 56 | 224 → 232 | 0 → 0 |
| 1024×768 | 224 → 232 | 0 → 0 | 0 → 0 | 0 → 0 | 8 → 8 | 19 → 0 | 0 → 0 | not asked | 0 → 0 | 0 → 0 | 56 → 56 | 224 → 232 | 0 → 0 |
| 760×900 | 224 → 232 | 1 → 0 | 1 → 0 | 0 → 0 | 8 → 8 | 20 → 0 | 0 → 0 | not asked | 0 → 0 | 0 → 0 | 56 → 56 | 0 → 0 | 0 → 0 |
| 667×375 phone | 232 → 240 | 232 → 0 | 232 → 0 | 0 → 0 | 8 → 8 | 25 → 0 | 0 → 0 | 232 → 0 | 48 → 0 | 0 → 0 | 56 → 48 | 8 → 8 | 0 → 0 |
| 844×390 phone | 232 → 240 | 0 → 0 | 0 → 0 | 0 → 0 | 8 → 8 | 8 → 0 | 0 → 0 | 232 → 0 | 0 → 0 | 0 → 0 | 56 → 48 | 8 → 8 | 0 → 0 |
| 932×430 phone | 224 → 240 | 0 → 0 | 1 → 0 | 0 → 0 | 8 → 8 | 25 → 0 | 0 → 0 | 224 → 0 | 48 → 0 | 0 → 0 | 56 → 48 | 224 → 8 | 0 → 0 |
| 390×844 phone | 232 → 32 | 11 → 0 | 0 → 0 | 0 → 0 | 0 → 0 | 70 → 0 | 0 → 0 | 232 → 0 | 168 → 0 | 0 → 0 | 106 → 48 | 8 → 0 | 0 → 8 |

**After: 0 of 1,912 steps fail a measure.** Before: 63 screen-and-size pairs did, across the lives, and 2 problems were recorded (the Calendar
reached only from Home, and no Updates on the menu). The before walk found no label cut with no way to read it once a
titled label was counted apart. The month grid's pills are cut, titled, both before and after.

What each measure is:
- **Page wider:** the page pushed past the window, measured with the stylesheet's sideways clipping set aside.
- **Past its card:** text or a control outside its card.
- **Cut, no way to read:** a label cut with an ellipsis that has no title holding its words. A cut label whose title
  holds them, with its day's agenda a press away, is counted apart as **cut, titled** (the month grid's events).
- **Squeezed:** an element's own text set in four or more lines in under 120 pixels.
- **Touch target under 44:** on a phone only, a primary control (a button, a tab, a menu item, a field, a summary)
  under 44 by 44 pixels. A link inside a sentence is excepted, as WCAG 2.5.8 excepts it. So is a word that opens its
  look (a date, a name, a heading), counted apart as a **text link**. On a desktop the 44 pixels aren't asked for.
- **Tab bars half-shown with no cue:** a tab cut at the bar's edge with nothing to say there are more.

## Screen By Screen

Each image is under `captures/before/` and `captures/after/` at the same path, so each pair compares. A `-full` image is the whole page, the main column scrolled a window at a time and joined.

### The Bar (`shell/GameShell.tsx`, `shell/TimeControls.tsx`)

- **Before:** at 667 the bar ran 32 pixels past the window, with Save & Exit cut off unseen and Look After Yourself in
  four lines. Upright it was three rows and 106 pixels tall. Only Play/Pause's own name said whether the clock ran. The
  buttons were 27 pixels tall.
- **Change:** one row, never wrapping:
  - the menu where the rail is a drawer;
  - the screen's name where the brand stands;
  - the date and time, with **Running** or **Paused** in words;
  - Play/Pause, Sleep, Look After Yourself and Advance;
  - the guide and the save on a desktop, which go to the drawer's foot when it's a drawer.

  On a touch screen every control is 44 pixels. In a drawer layout, the screen's name replaces the brand, and the
  buttons keep to one line: at 760 the name had been cut to "Player Pro…" and Look After Yourself took two lines.
  A menu that would cross the window's right edge hangs from its button's right edge instead. At 760, Advance's menu
  had run 167 pixels past the window.
- **Desktop:** walked at 1280, 1440, 1920, 1024 and 760: 56 pixels tall, nothing past the window, no menu past it.
- **Phone on its side:** 48 pixels tall at 667, 844 and 932, one row, every control 44 pixels.
- **Images:** `released/667x375m/home.jpg`, `released/667x375m/advance-menu.jpg`, `released/667x375m/look-after-yourself-menu.jpg`, `released/1440x900/home.jpg`.
- **Remains:** nothing measured.

### The Menu And The Drawer (`shell/destinations.ts`)

- **Before:** at 932×430 the desktop's 232-pixel rail stood beside a 700-pixel page. The Calendar wasn't on it, so on
  the Calendar no place was marked. Home's badge counted notices and questions together (99+ for 500 notices).
- **Change:** a drawer, closed by default and closed on a choice, at 900 wide or narrower and at 500 tall or shorter.
  Every phone on its side gets the drawer.
  - The Calendar and Updates are on it: eight places.
  - Home's badge counts the questions; Updates' counts the unread notices.
  - The place you're on is marked (`aria-current`), and the trail at the page's head ends on the same words.
- **Desktop:** the rail is shown at every desktop size but 760, where it's the drawer. The keyboard check opened each of
  the eight places, and your name at the foot, from the keyboard. The menu marked each, and the trail named it the same.
- **Phone on its side:** the drawer at 667, 844 and 932, its items 44 pixels.
- **Images:** `released/667x375m/navigation-open.jpg`, `released/932x430m/navigation-open.jpg`, `released/760x900/navigation-open.jpg`.
- **Remains:** the trail is the screens visited, not a hierarchy, as it was (`inventory.md`). Its last crumb names the
  screen you're on.

### Tabs (`components/TabBar.tsx`)

- **Before:** School, Money, Career and Papers each drew their own tab list. On a phone the last tab was cut at the
  edge with nothing to say there were more: "Opportuni" at 390, and every bar at 667 and 932.
- **Change:** one tab bar, as WAI-ARIA's Tabs pattern has it: the arrows, Home and End, and only the selected tab in
  the page's tab order. A bar wider than its page scrolls sideways, fades on the side with more and puts a button there,
  and keeps the selected tab in view.
- **Desktop:** none overflows. The keyboard check moved Money's five tabs with the right arrow, End and Home.
- **Phone on its side:** at 667 the six-tab bars overflow and scroll, and none is half-shown with no cue anywhere.
- **Images:** `released/667x375m/school-standing-and-craft.jpg`, `released/667x375m/career-overview.jpg`.
- **Remains:** nothing measured.

### Home: Today (`screens/Home.tsx`)

- **Before:** the date, the time, the town, its zone, the season and the weather in one line. The date was said again
  in the bar, the time again in the bar and in Where You Are, and the weather again in Weather. Two panels as tall as
  How You Are said only that.
- **Change:** Today is the page's head:
  - the date and your calling;
  - the greeting and your name;
  - the time in the town, its region, zone and season;
  - its daylight, once Where You Are's chapter is read;
  - the sky beside it with the five days ahead.

  Each opens its look, so Where You Are's and the Weather's detail is a press away, not repeated in a panel.
- **Desktop and phone:** `tests/b23-pages.test.ts` reads, on a played save, the hour and the town said once in Today,
  and no Where You Are or Weather panel. `tests/evidence-g32-ui.test.ts` (h-head, h-where-weather) reads Today's line
  and each look.
- **Images:** `released/1440x900/home.jpg`, `released/844x390m/home.jpg`, `new/1440x900/home.jpg`.
- **Remains:** nothing.

### Home: What Needs You

- **Before:** the questions, then every unread notice under them, each with its whole text. A graduate's 500 made the
  panel about 4,000 pixels of paragraphs at 390.
- **Change:**
  - The questions come first, the first six with Show All.
  - Then what needs putting right, each line with Open and its screen: what Your Affairs' lines flagged (an overdrawn
    account, no health cover, a return due or late, tax owed, a troubled standing) and what weighed before (unpaid,
    near the limit, a card behind, medical debt, collections, a clash).
  - Notices aren't here.
  - At 1024 a late return's line had been 82 pixels wide, six lines. Its words now keep 14rem, with the buttons
    wrapping under them.
- **Desktop and phone:** `tests/evidence-g32-ui.test.ts`, `tests/evidence3-home.test.ts`, `tests/evidence2-b11.test.ts`
  (h-needs) and `tests/evidence-g33-ui.test.ts` play each line and its button. The walk measured nothing squeezed on
  Home at any size.
- **Images:** `released/1440x900/home.jpg`, `released/1024x768/home.jpg`, `released/844x390m/home.jpg`.
- **Remains:** nothing.

### Home: Up Next, How You Are

- **Before:** the Calendar panel stood at the top, above what needed deciding. How You Are was three meters, and Look
  After Yourself was only in the bar.
- **Change:** Up Next, the next commitment and the five after it, comes after What Needs You. How You Are has the
  summing-up line, the three dials and the first two things Look After Yourself offers, in the engine's own order
  (`lookAfterOptions`), each done as the bar's menu does it.
- **Tests:** `tests/evidence-g32-ui.test.ts` (h-how: a meal eaten from How You Are, the meters moving to the dials'
  figures; h-calendar).
- **Images:** `released/1440x900/home.jpg`, `released/1440x900/home-full.jpg`.
- **Remains:** nothing.

### Home: Recent Updates

- **Before:** none. The notices were in What Needs You.
- **Change:**
  - The four most important unread notices, two lines of each, with Go There and Mark Read.
  - Mark N Read for all of them, and how many more there are, with View All Updates.
  - From the after walk's own finding, a notice that came more than once is one line that says how many earlier ones
    are on Updates. Its Mark Read reads them all, as Updates groups them: two terms' "A Word On Your Coursework" had
    been two of the four lines.
- **Tests:** `tests/b23-pages.test.ts` (a notice is on Home once, the run pressed read). `tests/evidence2-b11.test.ts`
  (the four most pressing of 159). `tests/evidence-g32-ui.test.ts` (more unread than four, View All Updates).
- **Images:** `released/1440x900/home.jpg`, `graduate/1440x900/home.jpg` (500 notices).
- **Remains:** nothing.

### Your Affairs (Gone From Home)

- **Before:** Money, School and Papers, a line each with a button: the same three places as the rail. At 390 its text
  column was about 60 pixels wide ("Chase Total Checkin / g").
- **Change:** gone from Home at every size. Nothing underneath was deleted: each line went to the head of its own
  screen (`components/Glance.tsx`). What it flagged is under What Needs You.
  - Money's head: Worth, with what's owed.
  - School's head: your place in the class and what's next.
  - Papers' head: your cover, a claim's weekly pay and what the returns ask.
- **Tests:** `tests/b23-pages.test.ts` (no Your Affairs, none of its words). `tests/evidence-g33-ui.test.ts`,
  `tests/evidence2-b12.test.ts` and `tests/evidence3-home.test.ts` (h-money, h-school, h-papers at each screen's head).
  `tests/defects-g12-1.test.ts` (the tutorial's Money chapter against Money's head).
- **Images:** `released/1440x900/money-accounts.jpg`, `released/1440x900/school-standing-and-craft.jpg`, `released/1440x900/papers-tax-returns-full.jpg`.
- **Remains:** nothing.

### Updates (`screens/Updates.tsx`, New)

- **Before:** none. A notice once read was on no screen.
- **Change:** every notice the save keeps, newest first.
  - Unread and All, and About for one kind.
  - A run of the same notice about the same thing is one row with its count, each notice still there to open.
  - Read It All, Go There and Mark Read, and Mark N Read for what the filter shows.
  - Reading one answers nothing, and nothing is deleted.
- **Tests:** `tests/evidence-g32-ui.test.ts`, `tests/evidence2-b11.test.ts`.
- **Images:** `released/1440x900/updates-full.jpg`, `released/844x390m/updates-full.jpg`.
- **Remains:** nothing.

### Player Profile (`workspaces/ProfileWorkspace.tsx`)

- **Before:** 5,170 to 6,400 pixels tall at 1440. Readiness Today sat fifth, under a 149-row genres table. Attributes
  And Craft's Today column was 68 to 85 pixels wide ("Not held back today" in five lines), and It Shapes was five lines
  in 112 pixels.
- **Change:** the page reads summary first, without folding anything away:
  - Identity And Background, then Readiness Today, then the tables.
  - **On This Page** under your name takes you to any of the eight sections and moves the focus there
    (`PageIndex`).
  - The ability table's Today, It Shapes and Last Change cells keep a width they read at, and the table scrolls in its
    own box where the page is narrower.
- **Tests:** `tests/b23-pages.test.ts` (the order, the index against the headings and the guide, a press scrolling and
  focusing; five mutations, all killed).
- **Walk:** nothing squeezed or cut on the Profile at any size.
- **Images:** `released/1440x900/player-profile-full.jpg`, `released/844x390m/player-profile-full.jpg`, `new/1440x900/player-profile-full.jpg`.
- **Remains:** the Profile is still long. It's eight sections of real detail, now each a press away.

### Calendar (`workspaces/CalendarWorkspace.tsx`)

- **Before:** each day's events were pills cut with an ellipsis. Pressing a day opened the plan form, not the day's
  agenda. Next Thirty Days listed 25 of the same rehearsal in a row, and paydays were a green pill among the rest.
- **Change:** the Calendar opens on today's agenda, and choosing a day shows its own, brought into view. A run of the
  same call is one line with its count and its dates, opening into each. A pill keeps its title (a pointer's tooltip),
  and its day's agenda names each entry in full.
- **Walk:** cut labels with no way to read them, none. Cut and titled (the pills), the counts are in the measures above.
- **Images:** `released/1440x900/calendar-full.jpg`, `released/844x390m/calendar-full.jpg`, `booked/1440x900/calendar.jpg`.
- **Remains:** the pills are still cut in the month grid. They're the grid's summary, and the agenda is the detail.

### School (`workspaces/SchoolWorkspace.tsx`)

- **Before:** the tab bar was cut on phones. Term Reviews' Why column was 55 pixels wide at 667, a paragraph in 77
  lines. Course names, the Casting part, Around The Class and the coursework chooser were squeezed to four to six lines
  at 760 and 1024.
- **Change:**
  - School's head says your place in the class and what's next.
  - Term Reviews keeps each review's figures in a row and why under them across the table. On a phone on its side and
    in a narrow window it stacks, each figure named (`stack-table`, the names drawn from `data-label`).
  - Course names, parts and the chooser's choices keep a width they read at, and their tables scroll in their own box.
  - Around The Class has its own scroller.
- **Tests:** `tests/b23-pages.test.ts` (each review's figures and why). The School tests read every one of these
  tables' words unchanged.
- **Walk:** nothing squeezed or past its card at any size.
- **Images:** `released/1440x900/school-standing-and-craft-full.jpg`, `released/667x375m/school-standing-and-craft.jpg`, `developed/1440x900/school-coursework.jpg`.
- **Remains:** nothing measured.

### Career (`workspaces/CareerWorkspace.tsx`, `career/OpportunitiesPane.tsx`, `career/WorkPane.tsx`)

- **Before:** an offer ran as eight labeled paragraphs with Accept at the foot. An engagement's pay was nine
  paragraphs, the same sentence each week. Permission To Work said the reading at acceptance with nothing to say it was
  that, beside "Released".
- **Change:**
  - An offer leads with the part and the project, its dates, its pay, how long it stands, and what matters before
    accepting (OPT, the School), then the answers. The role in full opens below.
  - An engagement leads with its name and status, then its dates, its pay and its next call. The agreement, its
    calendar and its pay open below.
  - The pay is a table (week, promised, due, where it stands, commission), with what's the same each week said once.
  - Permission to work now comes first, and the reading at acceptance is labeled **Eligibility When Accepted** with
    its date.
- **Tests:** `tests/propay-screen.test.ts` (the pay table, promised, deferred and held in trust, Eligibility When
  Accepted).
- **Images:** `released/1440x900/career-work-full.jpg`, `offer/1440x900/career-opportunities-full.jpg`, `released/844x390m/career-work-full.jpg`.
- **Remains:** nothing measured.

### Money (`workspaces/BankWorkspace.tsx`)

- **Before:** the tab bar was cut on phones. What You're Worth opened only from Home's Your Affairs. A card's New
  Limit field was 26 pixels wide on a phone.
- **Change:** Money's head says Worth, its look a press away, and "Your account is overdrawn." when it is. A field and
  its button wrap rather than squeeze the field. Statements' lines scroll in their own box, as before.
- **Images:** `released/1440x900/money-accounts-full.jpg`, `long/1440x900/money-accounts.jpg` (large sums), `released/844x390m/money-accounts.jpg`.
- **Remains:** nothing measured.

### Papers (`workspaces/PapersWorkspace.tsx`, `papers/Documents.tsx`)

- **Before:** the tab bar was cut on phones. The page ran past the window on Passport And ID at 390 and on Permission
  To Work. Your Work And Your Permission's dates were four lines in 116 pixels at 844 and in 87 at 1024.
- **Change:** Papers' head says your cover, a claim's weekly pay, and what the returns and taxes ask. Your Work And Your
  Permission puts where each engagement stands now beside **Eligibility When Accepted**. It stacks on a phone on its
  side and in a narrow window, its dates keep a width they read at on a desktop, and long rules are held to a readable
  line.
- **Tests:** `tests/propay-screen.test.ts` (the table, its stacking labels), `tests/evidence-g33-ui.test.ts` (Papers'
  head).
- **Images:** `released/1440x900/papers-permission-to-work-full.jpg`, `released/844x390m/papers-permission-to-work-full.jpg`, `released/1440x900/papers-tax-returns-full.jpg`.
- **Remains:** nothing measured.

### Menus: Look After Yourself, Advance

- **Before:** at 667 the Advance menu ran 56 pixels past the window, and neither menu had a height limit.
- **Change:** each is held to the window's height and scrolls. Where it would cross the window's right edge, it hangs
  from its button's right edge, and on a narrow phone it's pinned across the window. The keyboard check opened Advance
  on Enter (`aria-expanded`, eight items) and closed it on Escape, with the focus back on Advance.
- **Images:** `released/667x375m/advance-menu.jpg`, `released/667x375m/look-after-yourself-menu.jpg`, `released/1440x900/advance-menu.jpg`.
- **Remains:** nothing measured.

### Dialogs

- **Before:** they fitted at every size, at 84vh, which on a phone with its address bar showing was more than the
  screen.
- **Change:** each is held to the height the browser shows (`dvh`), with tighter padding on a short screen. The
  keyboard check held the focus inside Sleep's dialog for 28 Tabs and Shift+Tabs, closed it on Escape and gave the
  focus back to Sleep.
- **Walk:** none outside the window and every footer in view, at every size.
- **Images:** `released/667x375m/sleep-dialog.jpg`, `released/1440x900/sleep-dialog.jpg`.
- **Remains:** nothing.

### How This Works And The Guide (`guide/Help.tsx`)

- **Before:** it opened at the topic of the How This Works pressed. Its contents put the guide's line first and the
  screen's own entries under it.
- **Change:** the contents put the screen's own entries first, with the guide after them. Every topic is still a press
  away. Its topics are 44-pixel controls on a touch screen.
- **Images:** `released/667x375m/how-this-works.jpg`, `new/1440x900/how-this-works.jpg`.
- **Remains:** nothing.

### Looks (Drill-Downs)

No layout issue was measured before or after. They open inline under what was pressed, and close with one press. A
look's way back is its own close, and the trail's crumbs stay.

### Rotate Your Phone To Play (`shell/turn.tsx`)

See `rotation.md`. On a phone held upright, the rotate screen shows over a frame that is `inert` and swallows input. A
live clock pauses through the same command as Pause, and stays paused until Play, with no catch-up. Nothing unmounts.
- **Tests:** `tests/b23-turn.test.ts`.
- **Walk:** the turn suite at 390×844 for every life, every check true for all 8 lives (`after/turn-checks.json`): the rotate screen shown, the game inert and the focus on it, the clock paused upright, the place, the tab, the scroll and an open menu kept, still paused and said once back on its side, no jump on Play, a dialog and a typed search kept, no rotate screen for the keyboard's shorter window, an already-paused clock left quiet, and Save & Exit turned mid-save reaching the saves.
- **Images:** `released/390x844m/upright-the-clock-was-running.jpg`, `released/390x844m/back-in-landscape-paused.jpg`, `released/390x844m/after-save-and-exit-turned-during-the-save.jpg`; before, the same size played the game upright (`captures/before/released/390x844m/`).
- **Remains:** emulation only, as said above.

### Start, Saves, Creation

These are outside the shell's screens and weren't walked here; briefs 13 and 14 walked them. On an upright phone they
sit behind the rotate screen too.


## Keyboard And Zoom

`app/keyboard.mjs` on the app built from `208dbf1f`, a released engagement's save, at 1440×900 and then at 200% zoom.
The results are in `after/keyboard.json`.

- **Tab from the top:** 70 Tab presses: the skip link first, then the bar, the menu and the page, in that order. Each
  stop had a ring showing, none was covered by the bar (what's on top at its center is it), and none was out of view.
- **The skip link:** first, and Enter on it puts the focus in the page.
- **Where you are:** each of the menu's eight places, and your name at its foot, opened from the keyboard. The menu
  marked each (`aria-current`), and the trail at the page's head ended on the same words. Home has no trail.
- **A menu:** Advance opened on Enter, said so (`aria-expanded`), held its eight items, and closed on Escape with the
  focus back on Advance.
- **A dialog:** Sleep's held the focus inside it for 14 Tabs and 14 Shift+Tabs, closed on Escape and gave the focus
  back to Sleep.
- **A tab bar:** Money's five tabs moved with the right arrow, End and Home, the selected one said (`aria-selected`).
- **200% zoom** (1280×720 read at 640×360, a desktop's fine pointer):
  - the drawer, with the bar's Menu, Play, Sleep, Look After Yourself and Advance;
  - Home's four panels, the menu's eight places and every control Home has at 100% (none lost);
  - the guide and Save & Exit at the drawer's foot;
  - the page no wider than the window, and the page starting below the bar.
- **Not checked:** a screen reader's reading of any of it, and a person's own sense of the order.

## Save Compatibility

`app/save-compat.ts` (`after/save-compat.txt`) loads each of the sixteen saves the walk and the tests open on this
build. That's the three journey saves, the four older saves, brief 22's four OPT saves, brief 22's three walk saves
and brief 23's two. Each is stored at schema 94 and loads at 94, which is the engine's
(`SAVE_SCHEMA_VERSION`, unchanged, as `base44/shared/guard.js`'s `SUPPORTED_SCHEMA_VERSION` is). Each plays a day on
and saves and loads again. The walk opens the older tax-plan save (`older`) at every size. The gate's migration tests
take a save from every schema before 94 up to it, as they did before this brief.

## The Criteria

Each of `criteria.md`'s checks, with what verified it on `208dbf1f`. "Emulated" means the walk's Playwright phone or
keyboard, never a physical phone or a person.

| Id | Status | What verified it |
|---|---|---|
| B1 | Met | Every capture brief 23 names opened (`inventory.md`, before any change) |
| B2 | Met | The before walk, 2,112 steps, its issues and checks (`inventory.md`, `captures/before/`) |
| P1 | Verified, emulated | Walk: Rotate Your Phone To Play shown, the game `inert` and the focus on it, 8 of 8 lives; `tests/b23-turn.test.ts` |
| P2 | Verified | Test: a live clock paused through Pause's command, a minute upright moves nothing; walk: paused upright, 8 of 8 |
| P3 | Verified, emulated | Walk: the screen, its tab, its scroll, an open menu, an open dialog and a typed search kept, 8 of 8 each |
| P4 | Verified | Test: still paused, said once, Play goes on with no catch-up; walk: still paused, said why, no jump, 8 of 8 |
| P5 | Verified | Tests: already paused, no command and nothing said; a stop open across a turn still pending; walk: quiet and kept, 8 of 8 |
| P6 | Verified | Tests: the lock asked once and its refusal let go; no source of the game asks for fullscreen (mutated: killed) |
| P7 | Verified | Tests: the device table (phones, tablets, touch laptops, desktop windows of any width, a page that can't say); walk: no rotate screen at any desktop size, 760 among them |
| P8 | Verified, emulated | Walk: a dialog, a typed form, an open menu, Save & Exit mid-save, the clock running and paused, 8 of 8 each; the keyboard's shorter window shows no rotate screen |
| D1 | Verified | Images at 1280, 1440 and 1920: the sidebar, the dark surfaces, the gold, the type |
| D2 | Verified | One gutter (`--gutter`), one measure, one spacing scale in the stylesheet; walk: nothing past its card |
| D3 | Verified | Images: Home in two columns on a desktop; long prose held to `--measure` |
| D4 | Verified, emulated | Walk: the bar 48 pixels tall, one row, at 667, 844 and 932; the drawer closed but on Navigation Open; the essential controls in the bar |
| D5 | Verified, emulated | Images at 844 and 932: two columns where both read; walk: nothing squeezed, no text shrunk |
| D6 | Verified, emulated | `100dvh`, `viewport-fit=cover`, `env(safe-area-inset-*)` in the stylesheet; `keyboard.mjs`: the address bar shown and hidden on a phone and a desktop, the bar fixed, the page under it, the scroll kept |
| A1 | Verified | `tests/b23-pages.test.ts`: no Your Affairs on Home; walk: none at any size |
| A2 | Verified | Tests (h-money, h-school, h-papers, h-needs): each flag under What Needs You with its screen, each line at its screen's head |
| H1 | Verified | `tests/b23-pages.test.ts`: Today, What Needs You, Up Next, How You Are, Recent Updates, in order |
| H2 | Verified | `tests/b23-pages.test.ts`: the hour and the town once in Today, no Where You Are or Weather panel; each look a press away (h-where-weather) |
| H3 | Verified | `tests/evidence-g32-ui.test.ts` (h-how): Look After Yourself's first two in the engine's order, a meal eaten from How You Are |
| H4 | Verified | Images: aligned columns at 1440; two columns at 844 |
| N1 | Verified | Tests: questions, things to put right and notices in their own places and words on Home and Updates |
| N2 | Verified | Tests: a notice's title, what it's about, when, read or not, Go There, and its whole text on demand (Updates' Read It All) |
| N3 | Verified | Tests and walk: Updates on the menu, every notice newest first, Unread and All, About, Mark Read on one, on those shown and on all |
| N4 | Verified | Tests: marking read answers no question; Dismiss is the player's; nothing deleted |
| N5 | Verified | Tests: a run of one notice about one thing grouped with its count on Updates, and on Home's Recent Updates from the after walk's finding |
| N6 | Verified | `tests/b23-pages.test.ts`: a notice on Home once, none of them a question |
| T1 | Verified | Walk: the bar one row at every size, its secondary controls in the drawer where it's a drawer; keyboard check: the guide and the save there at 200% |
| T2 | Verified | Keyboard check: each place marked and named the same in the trail; the bar names the screen in drawer layouts |
| T3 | Verified | Walk: no tab half-shown with no cue at any size; keyboard check: arrows, Home and End |
| T4 | Verified | Walk and keyboard check: the page starts below the bar, no focused control behind it |
| E1 | Verified | `tests/propay-screen.test.ts`; images of an offer and an engagement at 1440 and 844 |
| E2 | Verified | `tests/propay-screen.test.ts`: the pay table, what's the same each week said once |
| E3 | Verified | `tests/propay-screen.test.ts`: permission now first, Eligibility When Accepted with its date |
| E4 | Verified | Calendar tests and images: today's agenda, a run as one line with its count, paydays and clashes marked |
| E5 | Verified | `tests/b23-pages.test.ts` (Profile, School); Glance tests (Money, Papers); help's own entries first |
| L1 | Verified | One set of tokens in the stylesheet (`--gutter`, `--measure`, `--control`, the spacing scale), used by every screen |
| L2 | Verified | Walk: 1,912 steps, nothing wider, past its card, cut with no way to read, squeezed or clipped; every dialog fitting |
| L3 | Verified | Walk: every wide table in its own scroller with a cue; nothing past its card |
| L4 | Verified | Keyboard check: a ring on every one of 70 stops |
| L5 | Verified | Images: empty states (All Clear, All Read, No Notices Yet), locked buttons and opened sections drawn one way |
| X1 | Verified, emulated | Walk: no primary control under 44 by 44 on any phone step; text links counted apart, as WCAG 2.5.8 excepts them |
| X2 | Verified, emulated | Keyboard check: the order, a dialog's trap and return, Escape closing a menu, `aria-current`, `aria-selected` and `aria-expanded` |
| X3 | Unchanged | The colour tokens weren't changed; their measured AA stands as brief 14 measured it |
| X4 | Verified | `index.html`'s viewport allows zoom; keyboard check at 200%: nothing lost |
| X5 | Verified | The gate: text-inventory, surfaces and guide-quotes, every changed source read and marked |
| V1 to V5 | Verified, emulated | This file: nine sizes, eight lives, viewport and whole-page images, the turn suite |
| R1 | Met | This file |
| R2 | Met | The gate in a clean clone: `README.md` |
| R3 | Met | `README.md`: the tested commit, the images, the results, save compatibility, what remains |
| R4 | Met | Nothing merged or deployed |

## What Remains

- **No physical phone and no screen reader.** Every phone here is emulated. The keyboard is Playwright's.
- **The completion matrix:** 66 rows read Implemented, Verification Incomplete. Brief 23 changed `src` after they were
  measured, and the gate reads a measurement made before what it reads last changed as unmeasured. Brief 23 changed no
  game rule, only the interface and the guide's words, but the final runs that would measure them again weren't made
  here. The owner has asked for them before a merge (brief 22's), and can again.
- **The Profile is long.** Eight sections of real detail. Each is a press away now, and nothing is folded.
- **The month grid's pills are cut,** each with its title, and its day's agenda says every entry in full.
- **On a desktop, controls under 44 pixels:** a mouse isn't held to the touch screen's 44, and the walk counts them only
  on a phone. Text links (a date, a name) under 44 on a phone are counted apart, as WCAG 2.5.8 excepts them.
- **The trail** is the screens visited, as it was, not a hierarchy. Its last crumb names the screen you're on.
- **"Your Affairs"** is still the menu's heading for Money and Papers, a group's name on the menu. The panel of that name
  is gone from Home.
- **Start, the saves and character creation** weren't walked by this brief's walk. Briefs 13 and 14 walked them, and
  on an upright phone they're behind the rotate screen.
