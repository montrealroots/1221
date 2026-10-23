# Brief 24's Criteria, Written Before Any Change (2026-10-23)

The owner's brief 24, "Finish SLATE's UI Alignment, Home Spacing, And Navigation Cleanup", is kept verbatim at
`docs/verification/briefs-2026-10-16/24-finish-slates-ui-alignment-home-spacing-and-navigation-cleanup.txt`. These are
the checks each change is held to, each with what measures it. "The walk" is brief 23's `../ui-2026-10-23/app/capture.mjs`;
`app/help-audit.mjs` and `app/evidence.mjs` are this brief's, run on the build before and the build after.

The starting point: `113765a6` on `claude/peaceful-hamilton-59zdbb`, its `src` `a00f159a`'s (brief 23 and the Papers fix
its final runs found), clean, no stash, one worktree. The final runs played again on brief 23's commit had every engine
lane the same in every number; the browser lanes were stopped for this brief, to be made on its finished build.

## 1. Contextual Help Alignment

The help action is one component (`ui/guide/HowItWorks.tsx`), a small ghost button whose words sit inside 12 pixels of
padding each side. Its kinds, and where each one's words go:

| Kind | Where its words line up | Measured by |
|---|---|---|
| A card's head (`Panel`'s `help`) | the heading's baseline; their right end on the card's content edge, the heading's own inset mirrored | `help-audit.mjs`: baseline offset 0 (±1), right inset minus heading inset 0 (±1) |
| A card's head on a second row | the heading's left edge | left offset 0 (±1) |
| A section's head (a label, then help) | the label's baseline; the right end on the section's content edge; on a second row, the label's left edge | the same |
| Beneath what it explains | that content's left edge, one spacing above it, the same everywhere | left offset 0 (±1); one value of the space above |
| In a row of buttons, a dialog's foot, a menu, a sentence | a button among buttons, as it was | recorded, not moved |

- **H1** Every card-head and section-head help has its words on the heading's baseline and its right end on the content
  edge, at 1440, 844 and 667, on Home, Career, School, Money, Papers, the Profile, Calendar, Updates and the menus.
- **H2** Every help beneath content has its words on that content's left edge, with one spacing above.
- **H3** On a phone every help's box is at least 44 by 44, and its focus ring shows whole.
- **H4** Shared styles, or shared components where a pattern repeats; no help moved by an offset of its own.

## 2. A Compact Home On A Phone On Its Side

- **M1** At 667×375, 844×390 and 932×430, Home's first window shows the greeting, the day, the town, the current weather
  in a line, and the start of What Needs You and Up Next: the next commitment's name, or the first thing waiting.
- **M2** The days ahead, the high and low and the daylight are a press away, and open in place; on a desktop they're
  shown as they were.
- **M3** The time and the town aren't said twice in the first window (the bar has the clock).
- **M4** Space taken out, not text: no font size or control under brief 23's, every touch target at least 44.
- **M5** Where What Needs You holds more than fits, the first window shows the most pressing item and how many more,
  with the way to them.

## 3. A Compact All Clear

- **E1** With nothing waiting, What Needs You is its head and one short All Clear line, not a card stretched to its
  neighbour's height.
- **E2** How You Are moves up under it; Up Next and Recent Updates keep their column.
- **E3** With questions or things to put right, every one shows with its actions, as before.
- **E4** Nothing in the game changes to make it so: no question dismissed, nothing marked read or put right.

## 4. Calendar And Updates From Home

- **N1** Neither is on the desktop's menu or the phone's drawer.
- **N2** Up Next always has Open Calendar, with plans or none; Recent Updates always has View All Updates, unread or none.
- **N3** Calendar and Updates are the same screens, every action and every notice kept, filters and Read and Unread.
- **N4** Each has a way back to Home on its own page.
- **N5** The guide's chapters and How This Works say how to reach them from Home; a screen a chapter opens is never left
  without a way in. Open Calendar opens with the chapter that opens the calendar ("What's Coming"); until now it waited
  for "Your Own Plans", and the menu's Calendar was the way in between.
- **N6** Links to them from other screens, the C key and Updates' count on Home still work.

## 5. Kept As It Was

- **K1** The palette, the gold, the desktop's menu, phones played on their side only, the rotate screen and its pause.
- **K2** No game rule, no save format: the schema stays 94, and every save brief 23 opened still opens.
- **K3** Keyboard order and focus rings; 200% zoom.
- **K4** "Your Affairs" stays off Home.

## 6. Verified On The Built App

- **V1** The walk at 1280×720, 1440×900, 1920×1080, 667×375, 844×390 and 932×430, for a new student, a developed
  student, a graduate, an offer, a booked run, a released run, a long-named life and an older save: no page wider than
  its window, nothing past its card, no label cut short with no way to read it, no squeezed column, no fixed height
  cutting content, every primary control on a phone at least 44.
- **V2** The turn suite upright: the rotate screen, paused, and back on its side as it was.
- **V3** Keyboard and 200% zoom (`../ui-2026-10-23/app/keyboard.mjs`), with the menu's places now six.
- **V4** Pictures, before and after, by `app/evidence.mjs`: the help beside short and long headings, Home at the three
  phone sizes, desktop Home with nothing waiting and with things waiting, the weather opened, the menu and the drawer,
  Calendar and Updates from Home and back.
- **V5** Looked at, not only measured: each picture read for overlap, clipping and what the first window holds.

## 7. Then

The gate, then brief 22's final runs on the finished commit (every lane but the judge's, whose files this brief doesn't
touch), gathered and compared, folded into the matrix, the gate again on the fold, back to 634; the coverage matrix and
the handoff with what was measured.
