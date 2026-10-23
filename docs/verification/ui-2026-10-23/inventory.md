# Every Screen Before Brief 23, With Its Issues And Its Checks

Made on 2026-10-23 from two sources, before any change to `src`:
- **The captures** brief 23 names, every image opened: `../career-genre-2026-10-22/captures/` (sixteen pages at 1440,
  each whole) and `captures/mobile/` (the same at 390 upright). They show `main` at `58231c69`, whose `src` is the
  same as `ebac1923`'s, where this work began (`git diff 58231c69 ebac1923 -- src` is empty).
- **The walk** (`app/capture.mjs`) of the app built from that commit: eight lives, nine sizes, 2,112 steps, each with a
  viewport image and its measurements. The sums by size are `before/audit-summary.json`; the images, 185 MB in all, were
  kept outside the repository, and the ones compared with the result are in `captures/before/`.

The checks are `criteria.md`'s ids. "Phone" is Playwright's emulation of one (touch, no hover, the screen's size); no
physical phone was used.

## What The Walk Measured, By Size

| Size | Steps | Page wider than the window | Past its card | Cut label | Squeezed column | Bar height | Rail | Tab bars half-shown, no cue |
|---|---|---|---|---|---|---|---|---|
| 1280×720 | 224 | 0 | 0 | 8 | 13 | 56 | shown | 0 |
| 1440×900 | 224 | 0 | 0 | 7 | 13 | 56 | shown | 0 |
| 1920×1080 | 224 | 0 | 0 | 7 | 13 | 56 | shown | 0 |
| 1024×768 | 224 | 0 | 0 | 8 | 26 | 56 | shown | 0 |
| 760×900 | 224 | 1 | 1 | 8 | 27 | 56 | drawer | 0 |
| 667×375 phone | 232 | **232** (32 to 56 px) | **232** | 8 | **232** | 56 | drawer | **48** |
| 844×390 phone | 232 | 0 | 0 | 8 | 17 | 56 | drawer | 0 |
| 932×430 phone | 224 | 0 | 1 | 8 | 29 | 56 | **shown** (232 of 932) | **48** |
| 390×844 phone, upright | 232 | 11 | 0 | 0 | 90 | **106** | drawer | **168** |

A touch target under 44 by 44 was on every step at every size: about 48 a step on a phone, nearly every button (27 px
tall), the tabs, the rail, the breadcrumbs and the summaries. The page's sideways push was hidden by `html, body {
overflow-x: hidden }`; the walk measured it with that rule set aside.

## The Shell

- **The bar** (`ui/shell/GameShell.tsx`, `TimeControls.tsx`).
  - *Issues:* at 667 the bar is 32 px wider than the window, so Save & Exit is cut off unseen, and Look After Yourself is
    squeezed to four lines. Upright it's three rows and 106 px tall. Nothing says in words whether the clock runs:
    Play/Pause names what a press does. On a desktop the save's state ("Not Saved Yet") and Save & Exit sit beside the
    guide in quiet ghost text.
  - *Checks:* T1, T4, D4, X1.
- **The rail** (`destinations.ts`).
  - *Issues:* at 932×430 the desktop's 232-pixel rail stays beside a 700-pixel page. The Calendar isn't on it, so on
    the Calendar no item is marked as the screen you're on. Home's badge counts questions and notices together (99+ for
    500 notices and no question), and "15 Unread" is said again under the player's name.
  - *Checks:* T2, D4, N1.
- **The drawer** (≤900).
  - *Issues:* closed by default and closed on a choice, as it should be. Its items are 37 px tall, and it has no room
    for the guide and the save, which crowd the bar instead.
  - *Checks:* D4, X1.
- **The breadcrumbs.**
  - *Issues:* they're the trail of screens visited ("Home › Career › Player Profile", "Home › Papers › Career"), which
    reads as a hierarchy that isn't there. Each crumb is 17 px tall.
  - *Checks:* T2 (kept as a trail, said in `coverage.md`), X1.
- **The guide strip, toasts and help's Back.** No layout issue measured. Toasts sit over the page's foot for four
  seconds.
- **Focus.** The gold ring in the captures is the keyboard's (the capture pressed by keyboard), not a border. It's
  drawn by `:focus-visible` and kept (L4).

## Home (`ui/screens/Home.tsx`)

- **The head.**
  - *Issues:* the date, the time, the town, its zone, the season and the weather in one line. The date is said again in
    the bar, the time in the bar and in Where You Are, and the weather again in Weather.
  - *Checks:* H1, H2.
- **Calendar.**
  - *Issues:* the next commitment, then five after it; full width at the top, above what needs deciding.
  - *Checks:* H1 (Up Next, after What Needs You).
- **What Needs You.**
  - *Issues:* the questions, then every unread notice under them, each with its whole text. A new student has 15,
    whose bodies run eight lines each. A graduate has 500 ("Mark 500 Read", "These six are the most important. 494 more
    are unread."), and at 390 upright the panel is about 4,000 px of paragraphs. A notice once read is on no list
    anywhere.
  - *Checks:* N1 to N6, H1.
- **How You Are.**
  - *Issues:* three meters and a line. Look After Yourself is only in the bar.
  - *Checks:* H3.
- **Where You Are and Weather.**
  - *Issues:* the time, the town and the weather again, in two panels as tall as How You Are.
  - *Checks:* H2.
- **Your Affairs.**
  - *Issues:* Money, School and Papers, a line each with a button, the same three destinations as the rail. At 390 its
    text column is about 60 px wide: "Chase Total Checkin / g", "$90,429. / 00." (brief 22's phone captures).
  - *Checks:* A1, A2.

## Updates

There was no screen for notices. A notice could be opened as a look from Home's list while it was unread, and once read
it was in the save and on no screen. *Checks:* N3, N4, N5.

## Player Profile (`workspaces/ProfileWorkspace.tsx`, `components/AttributesPanel.tsx`)

- **Issues:**
  - The page is 5,170 px tall at 1440 and two parts of 4,400 at 390.
  - Attributes And Craft's Today column is 68 to 85 px wide, so "Not held back today" takes four or five lines.
    Practice's text is cut at the card's edge ("Work Out, under Look After Y").
  - Dispositions is one run-on paragraph.
  - Genres is a 149-row table, 16 at a time.
  - Development History is a list of 400.
- **Checks:** E5, L2, L3.

## Calendar (`workspaces/CalendarWorkspace.tsx`)

- **Issues:**
  - Each day's events are pills cut with an ellipsis ("The Winter Ledger: Rehe…"); the walk measured eight cut on every
    size.
  - Pressing a day opens Put Something On, the plan form, not the day's agenda.
  - Next Thirty Days lists every call one by one: 25 of the same "The Winter Ledger: Rehearsal" in a row (brief 22's
    capture 11).
  - Paydays are a green pill among the rest.
- **Dialogs:** Put Something On (a form) and an entry's dialog.
- **Checks:** E4, L2.

## School (`workspaces/SchoolWorkspace.tsx`): Standing And Craft, Classes, Coursework, Casting, Shifts And Pay, Terms And Award

- **Issues:**
  - The tab bar is 6 tabs; at 667 and 932 phone and upright it's cut mid-label with no cue (the old fade was only at
    640 or narrower).
  - Squeezed columns: Standing's term table ("Spring Term 2027" in 68 px; "You came to 100% of the classes…" in 55 px),
    Classes' "Fall And Spring", Terms' "Living-Expense Scholarship", Casting's "Much Ado About Nothing".
  - In Coursework, a concern's line takes 69 px and eight lines.
- **Checks:** T3, L2, L3, E5.

## Career (`workspaces/CareerWorkspace.tsx`, `career/OpportunitiesPane.tsx`, `career/WorkPane.tsx`)

- **Issues:**
  - The tab bar is cut at "Opportuni" at 390 with no cue.
  - Offers run as eight labeled paragraphs (The Project, The Part, What It Asks, When And Where, Pay, The Audition, the
    deadline, the OPT warning), with Accept The Offer at the foot (brief 22's capture 6).
  - An engagement is a column of labeled facts. Its pay is nine paragraphs, each "The week of …: $1,114.00 promised by
    Harrow Point Repertory Theater, due …. It isn't paid until then… Commission expected: none. No commission: you
    weren't represented…", the same sentence nine times (capture 10).
  - Permission To Work says "Read August 16, 2029: On OPT you can work…", the reading when it was accepted. After the
    release it stands beside "Released" with nothing to say it's no longer true.
- **Checks:** E1, E2, E3, T3.

## Money (`workspaces/BankWorkspace.tsx`): Accounts, Cards, Payments And Cash, Borrowing, Statements

- **Issues:**
  - The tab bar is cut at 667 and 932.
  - Statements' lines scroll sideways in their own box (`statement-lines`), as they should.
  - What You're Worth (the net-worth look) opened only from Home's Your Affairs heading.
- **Checks:** T3, A2 (the net-worth look kept), E5.

## Papers (`workspaces/PapersWorkspace.tsx`): Tax Returns, Health Cover, Unemployment, Passport And ID, Permission To Work

- **Issues:**
  - The tab bar is cut at 667 and 932.
  - The page is wider than the window on Passport And ID at 390 upright, and on Permission To Work on three steps.
  - Health Cover's dates are squeezed at 932.
  - Your Work And Your Permission lists each engagement with "Read <date>: …", the reading at acceptance, not labeled
    as such, under the current status.
  - Long paragraphs of rules run the card's full width (about 170 characters a line at 1440).
- **Checks:** E3, E5, D3, T3.

## Menus

- **Look After Yourself** and **Advance** (`TimeControls.tsx`).
  - *Issues:* at 667 the Advance menu runs 56 px past the window. At 620 or narrower both are pinned across the window.
    Neither has a height limit, so on a phone on its side a long menu runs below the window.
  - *Checks:* L2, D6.

## Dialogs

- **The dialogs:** Sleep, Due Now (a stop), Skip To Event, On The Way, Put Something On, an entry, How This Works and
  the Guide (`Modal`).
  - *Issues:* all fit at every size walked (the walk measured none outside the window and every footer in view). Their
    height is 84vh, which on a phone with its address bar showing is more than the screen shown. Focus is trapped and
    returned (`Modal`).
  - *Checks:* L2, X2, D6.
- **How This Works.**
  - *Issues:* it opens at the topic of the How This Works pressed (the captures' Genres and Permission To Work). Pressed
    from the bar (the ? key or Guide), it opens at the contents.
  - *Checks:* E5.

## Looks (Drill-Downs)

There are 36 kinds (`ui/looks/`), opened inline under what was pressed, nested, each closing with one press. The dotted
underline marks each way in. No layout issue was measured; at 390 a deep chain steps in half as far. *Checks:* E5, L2.

## Tooltips

Rail items' `title`, a locked control's reason, and `Term`'s explanation. A phone never shows a `title`, and every one
that says why a control is grayed has its words on the page too (brief 15's `WhyNot`). *Checks:* X2.

## Start, Saves, Creation, Life Ended

Outside the game's shell, these weren't walked by the before walk; brief 13's and 14's walks cover them at 1440 and 390.
On a phone upright they're behind the rotate screen too (P1). *Checks:* P1, L2.
