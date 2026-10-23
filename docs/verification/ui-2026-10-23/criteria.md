# Brief 23's Acceptance Criteria, Written Before Any Change

The owner's brief: `../briefs-2026-10-16/23-complete-slates-desktop-and-landscape-only-mobile-ui.txt`, kept verbatim.
Worked on `claude/peaceful-hamilton-59zdbb`, from `main` at `ebac1923` (#61). Written on 2026-10-23, before any change to
`src`, from the brief, the captures it names (`../career-genre-2026-10-22/captures/`, desktop and phone, every image
opened) and the walk of the app built from `main` (`inventory.md`, `app/capture.mjs`).

Each check has an id, what it asks and how it's verified. A check is met only when what verifies it has run on the
tested commit and says so; "the code was written" meets none of them (rule 7).

How each is verified, in short:
- **walk:** `app/capture.mjs` on the built app: every destination and tab, the menus and dialogs, for each life at each
  size, with a viewport image of each step and its measurement (`audit.json`), before and after.
- **test:** a vitest file the gate runs, named where the check is.
- **image:** a viewport or whole-page image in `captures/`, before and after, looked at.
- **emulation:** Playwright's Chromium with touch, no hover and a phone's screen. It is not a physical phone, and nothing
  here is said to have been tested on one.

## 1. The Baseline (brief §1)

- **B1.** Every capture under `../career-genre-2026-10-22/captures/` opened, desktop and phone, Profile and help among
  them, and what each shows recorded (`inventory.md`, From The Captures).
- **B2.** The current built app walked: every screen, tab, drawer, dialog, menu, tooltip, notice and drill-down
  inventoried with its issues and its acceptance checks (`inventory.md`). The walk's before images and audit are kept.

## 2. Landscape-Only Phones (brief §2)

- **P1.** On a phone held upright, the game shows "Rotate Your Phone To Play" and a sentence that SLATE is designed for
  landscape play, and nothing else can be pressed, tabbed to or read by a screen reader behind it. *walk at 390×844 phone,
  test.*
- **P2.** While the screen shows, the world's clock doesn't move: a live clock is paused through the same command as Pause
  (`world.set_preferences`), and held while it shows. *test (fake timers: no world time passes in a minute upright).*
- **P3.** Back in landscape, everything is as it was: the screen, its tab, an open look or section, an open dialog or
  menu, the main column's scroll, what was typed in a form, and the save. *test and walk.*
- **P4.** Back in landscape the game stays paused until the player presses Play, and says why once. No time passes for
  the minutes spent upright: Play starts from that moment, with no catch-up. *test.*
- **P5.** An already-paused game stays paused and isn't said to have been paused by turning the phone. A stop (Due Now)
  open when it turns is open when it comes back, still waiting on the player. *test.*
- **P6.** Orientation lock is asked for once, where the browser has it, and its refusal is ignored; fullscreen is never
  requested. *test.*
- **P7.** A phone is told from a desktop window by what the device is, not by the window's width: a coarse pointer, no
  hover, and a screen whose short side is 500 CSS pixels or less. Upright is read from the screen's orientation
  (`screen.orientation`, then `window.orientation`), which an on-screen keyboard doesn't change. A desktop window of any
  width, a tablet and a touch laptop never see the rotate screen. Where it can't be told, the game plays in the
  responsive layout it has. The approach is documented (`rotation.md`). *test, walk at 390×844 desktop window.*
- **P8.** Turning the phone during a dialog, a form with typing in it, an open menu, a save in progress, and with the
  clock paused and running: each comes back as it was, no action runs twice and the clock makes no jump. Opening the
  keyboard in landscape doesn't show the rotate screen. *test, walk (emulation).*

## 3. Desktop And Phone Landscape (brief §3)

- **D1.** Desktop keeps its sidebar and its look: the dark surfaces, the gold accent, the type. *image.*
- **D2.** One page gutter and one content width on every screen, cards aligned to them, one spacing scale between and
  within sections. *walk (each screen's main column and card edges), image.*
- **D3.** Two or more columns where they help scanning on desktop (Home, label/value groups), and long prose held to a
  readable measure (about 75 characters). *image.*
- **D4.** Phone landscape: the header is one row no taller than 48 pixels; navigation is a drawer, closed by default, so
  the content has the whole width; essential controls (Play/Pause, Sleep, Look After Yourself, Advance, the menu) stay in
  the bar. *walk at 667×375, 844×390, 932×430.*
- **D5.** Phone landscape uses two columns where both stay readable and one inside a section where not; text is never
  shrunk to fit and pinch-zoom is never needed. *image.*
- **D6.** The layout follows the screen's real height (`100dvh`) and keeps clear of notches and the home bar
  (`env(safe-area-inset-*)`, `viewport-fit=cover`); a changing browser height (the address bar showing and hiding) moves
  nothing under a fixed bar. *walk at a changing height.*

## 4. Your Affairs Off Home (brief §4)

- **A1.** Home has no Your Affairs panel, at any size. *walk, test.*
- **A2.** Money, School and Papers stay in the navigation, and what Your Affairs said needed doing (an overdrawn account,
  no health cover, a return due or late, tax owed, a troubled standing) is on Home as an item under What Needs You that
  opens its screen. Nothing underneath is deleted. *test.*

## 5. Home Around The Day (brief §5)

- **H1.** Home reads, in order: Today (the greeting, the date, the time, where, a compact weather line); What Needs You
  (the questions waiting and what needs doing, with deadlines); Up Next (the next commitment, then the days ahead); How You
  Are (the three dials and the way to Look After Yourself); Recent Updates (the latest notices, and the way to all of
  them). *test, image.*
- **H2.** The date, time, place and weather are said once on Home. The Where You Are and Weather panels' detail is one
  press away (their looks), not repeated in cards. *test.*
- **H3.** How You Are opens Look After Yourself, its first item the engine's own first (`lookAfterOptions`), and adds no
  health rule of its own. *test.*
- **H4.** On desktop the sections sit in aligned columns; on a phone in landscape they use the width in two columns.
  *image.*

## 6. Notices (brief §6)

- **N1.** Questions (with answers to press), what needs doing (a deadline or a state to put right), and notices (what
  happened) are told apart by place and by label on Home and in Updates. *test, image.*
- **N2.** A notice is shown as a summary: its title, who or what it's from, when, whether it's read, and Go There where it
  has a screen. Its whole text opens on demand. *test.*
- **N3.** Updates, a screen of its own named in the navigation, lists every notice the save keeps, newest first, with
  filters (Unread, All; by what it's about) and Mark Read on one notice, on those shown, or on all. *test, walk.*
- **N4.** Nothing is deleted, completed, answered or dismissed to tidy a screen. Read and resolved stay apart: marking a
  notice read answers no question, and a question stays until it's answered, dealt with, dismissed by the player, or
  closes by its date as it always did. *test.*
- **N5.** Notices about the same thing (the same title and subject in a run) are grouped where the save's data says they
  are, with the count, each still openable. *test.*
- **N6.** Home shows no notice twice and repeats nothing a section above it says. *test.*

## 7. The Header And Tabs (brief §7)

- **T1.** The bar holds, in order: the menu (where the rail is a drawer) and the brand; the date and time with Running or
  Paused said in words; the time controls and Look After Yourself; then the guide and the save. It never wraps into
  ragged rows; at narrower widths secondary controls move into the navigation drawer, not onto a second row. *walk at
  every size.*
- **T2.** The screen you're on is marked in the navigation (`aria-current`) and named at the head of the page, the same
  words on desktop and on a phone. *walk.*
- **T3.** A tab bar that doesn't fit scrolls sideways with a visible cue on the side with more, keeps the selected tab in
  view, and keeps its keyboard behavior (arrows, Home, End) and touch scrolling. No tab is shown half-cut with no cue.
  *walk (tab measurement), test.*
- **T4.** Nothing fixed or sticky covers content, an action or a focused field: the main column starts below the bar and
  scrolls under nothing. *walk.*

## 8. Dense Pages (brief §8)

- **E1.** An offer and an engagement each lead with the part and project, the status, the dates, the pay in one line, the
  deadline and the next action; the project, what it asks, the agreement, the schedule, the pay records and the history
  are sections that open. A warning that matters before Accept (OPT, a clash, the School) stays shown above Accept. Every
  detail that was there is still reachable. *test, image.*
- **E2.** The pay for each week is a table (week, amount, due, status) with what's the same for every week said once.
  *test.*
- **E3.** Permission to work: what's true now comes first, and an engagement's reading when it was accepted is labeled
  "Eligibility When Accepted" with its date; a release or a current restriction comes before an earlier approval. *test.*
- **E4.** Calendar: choosing a day shows its agenda, each event with its actions; a run of the same call (rehearsals, a
  run's performances) is one expandable line with its count and dates; paydays, clashes and deadlines are marked so
  they're found at a glance; the next thirty days don't repeat one call thirty times. *test, image.*
- **E5.** Profile, Money, Papers, School and help: a summary first and the detail a press away where a page is long, no
  essential action hidden in a nested section, and help opens on the topic of the place it's opened from, with the whole
  reference still a press away. Drill-downs keep their way back. *test, walk.*

## 9. The Layout System (brief §9)

- **L1.** One set of tokens for gutters, widths, spacing, type sizes, button heights, card edges and icon sizes, used by
  every screen. *source, image.*
- **L2.** On every screen at every size the walk measures: the page no wider than the window (with the stylesheet's
  global sideways clipping removed, so nothing hides it); no text or control past its card; no label cut off with no way
  to read it; no name or balance squeezed into a column of one or two words a line; no fixed height cutting content; a
  dialog and its buttons inside the window. *walk (audit), before and after.*
- **L3.** A genuinely wide table scrolls inside its own box, with a cue, not the page. *walk.*
- **L4.** The keyboard focus ring stays visible on every control, and is not taken for a border. *walk (keyboard).*
- **L5.** Empty, loading, disabled, error and expanded states are drawn the same way everywhere. *image.*

## 10. Accessibility (brief §10)

- **X1.** Primary controls are at least 44 by 44 pixels on a touch screen (a coarse pointer); a link inside a sentence is
  excepted, as WCAG 2.5.8 excepts it. *walk (audit).*
- **X2.** Keyboard: every control reachable in a sensible order, a dialog traps and returns focus, menus close on Escape,
  names and selected states are announced (`aria-current`, `aria-selected`, `aria-expanded`). *test, walk.*
- **X3.** Contrast stays at the tokens' measured AA. *source.*
- **X4.** Zoom isn't disabled, and at 200% browser zoom (a 1280 window read at 640) no action or information is lost.
  *walk.*
- **X5.** New and changed labels are in Title Case and follow `docs/STYLE.md` and `docs/GLOSSARY.md`; every changed
  source of player text is read and marked (`tools/text-inventory.mjs`), its surface row says what changed, and the
  guide says what the screens now do. *gate (text-inventory, surfaces, guide-quotes).*

## 11. Verification (brief §11)

- **V1.** The walk at 1280×720, 1440×900 and 1920×1080; 667×375, 844×390 and 932×430 as a phone; 390×844 upright as a
  phone; and 1024×768 and 760×900 as desktop windows, with a changing height.
- **V2.** The lives: a new student; a developed student; a graduate; an active offer; booked work; a released
  engagement; long names and large sums; long notices and a full notice list; help and the Profile opened out; empty and
  error states; older saves.
- **V3.** Keyboard on desktop and touch on the phones, each said as emulation.
- **V4.** Viewport and whole-page images both.
- **V5.** Turning the phone keeps state, stops time and runs nothing twice (P1 to P8).

## 12. Evidence (brief §12)

- **R1.** A screen-by-screen coverage matrix: the issue, the change, desktop and phone-landscape verification, the images,
  what remains (`coverage.md`).
- **R2.** Targeted tests as the work goes, then the gate in a clean clone, its exit read from its file.
- **R3.** The tested commit; before and after images of Home, navigation, Career, Calendar, Profile, Money, Papers, School,
  help and the dialogs; the rotate screen; the results; save compatibility (every older save opens, the schema stays 94);
  what remains, said plainly.
- **R4.** Nothing merged or deployed without the owner's word.
