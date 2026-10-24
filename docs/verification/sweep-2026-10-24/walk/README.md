# The Journeys On The Built App (M10, 2026-10-24)

Brief 26, §7 and §12: "Verify smooth, coherent user journeys on desktop and landscape phone," on the app as built
(`npm run build`, served by `vite preview` on port 4173), with the approved Home, the sidebar, Title Case and the
portrait handling left as they are. Three walks, each a Playwright script that drives the page as a person would and
writes what it saw. Every walk ran on `691556f0` (M9's commit) with the container's Chromium
(`CHROMIUM_PATH=/opt/pw-browsers/chromium`; Playwright's own install isn't there).

## 1. A New Life, From The Start To The Fifth Chapter (`creation.mjs`)

```
SLATE_BASE=http://localhost:4173 node docs/verification/sweep-2026-10-24/walk/creation.mjs docs/verification/sweep-2026-10-24/walk/creation 1440x900
SLATE_BASE=http://localhost:4173 node docs/verification/sweep-2026-10-24/walk/creation.mjs docs/verification/sweep-2026-10-24/walk/creation 844x390m
```

A desktop window (1440×900, a mouse) and a phone on its side (844×390, touch, no hover). The Start → New Save →
Billed As Actress, born in New York → Identity, Dispositions And Traits, Genres And Background, Starting Point, each
Continue → Review → Begin → the guide's first chapter → five chapters read in order (I’ve Read It, Next: …) → Try It →
Play and Pause → Advance's menu → Tomorrow Morning → On The Way → the stop at the first commitment → Stand Here →
Sleep pressed with its chapter unread → Save & Exit → Continue. 27 steps at each size, a screenshot and the page's
state at each (`creation/<size>/NN-<step>.jpg`, `creation/<size>/creation.json`).

The checks, the same at both sizes, every one true:

| Check | What held |
|---|---|
| `startsPaused`, `playLockedAtStart` | The new life opens Paused, with Play, Sleep, Advance, Where You Are and Weather locked. |
| `guideOpensFirst` | The guide is open on chapter 1, "Your Life, Hour By Hour". |
| `whereYouAreOpened` | I’ve Read It on chapter 1 opens Where You Are and nothing else. |
| `chaptersInOrder`, `nextOffered` | Chapters 1 to 5 in the guide's order; each Next is the one after; after five, the strip reads 6 Of 20, How You Are. |
| `upNextOpen`, `needsOpen`, `howStillLocked` | After five chapters Up Next and What Needs You are open panels; How You Are is still a locked panel with Read About It. |
| `playAndPause` | Play runs the clock (Running); Pause stops it (Paused) and the button reads Play again. |
| `advanceLines` | One Hour, This Evening, Tonight, Tomorrow Morning, Next Event, Next Monday, One Week, Choose An Event… |
| `afterAdvance`, `afterOnTheWay`, `stopOffers` | Tomorrow Morning shows On The Way; Advance stops at 10:00 AM at Registration And Your Account, with Go and Stand Here. |
| `sleepStillLocked`, `sleepOpensGuide` | Sleep carries the lock word and, pressed, opens the guide at "Sleep", not the dialog. |
| `resumed` | After Save & Exit and Continue: the same 10:00 AM, Paused, the strip at 6 Of 20, no dialog open. |

No page error, no console error, no step wider than the window, at either size. The script's first run read
`startsPaused` false at both sizes because it asked for a button reading exactly "Play" where the button reads "Play"
and then "Locked" until "The Clock" is read; that was the script's misreading, corrected before the run kept here.

## 2. Every Screen Of Two Played Lives, At Three Sizes (brief 23's `capture.mjs`)

```
TURN_WAIT=10000 SLATE_BASE=http://localhost:4173 node docs/verification/ui-2026-10-23/app/capture.mjs docs/verification/sweep-2026-10-24/walk/capture \
  "long=docs/verification/ui-2026-10-23/app/saves/long.json.gz,offer=docs/verification/ui-2026-10-23/app/saves/offer.json.gz" "1440x900,844x390m,390x844m" "" "<the 29 shots>"
```

Brief 23's two saved lives (`long`, a career of years; `offer`, a life with an offer open) loaded through Your Saves at
1440×900 and 844×390, every screen opened: Home, Player Profile, Calendar, Updates, the School's six looks, Career's
five, Money's five, Papers' five, the Look After Yourself menu, the Advance menu, How This Works and the Sleep dialog;
then at upright 390×844, brief 23's turn suite. 132 entries in `capture/audit.json`, images under
`capture/<life>/<size>/`.

| Life, size | Entries | Page or console problems | Wider than the window | Clipped | Cut without a title | Bleed | Squeezed |
|---|---|---|---|---|---|---|---|
| long, 1440×900 | 30 | 0 | 0 | 0 | 0 | 0 | 0 |
| long, 844×390 | 31 | 0 | 0 | 0 | 0 | 0 | 0 |
| long, 390×844 (turn) | 5 | 0 | 0 | 0 | 0 | 0 | 0 |
| offer, 1440×900 | 30 | 0 | 0 | 0 | 0 | 0 | 0 |
| offer, 844×390 | 31 | 0 | 0 | 0 | 0 | 0 | 0 |
| offer, 390×844 (turn) | 5 | 0 | 0 | 0 | 0 | 0 | 0 |

The turn suite's every line true on both lives: upright with the clock running shows the rotate screen and pauses;
back on its side the place, the menu and the pause are kept, the clock no further on; a dialog and a form survive the
turn (no rotate screen for the keyboard); upright while paused is quiet; a turn during a save still reaches Your Saves.
The counts the audit keeps that aren't problems: `cutTitledCount` (a line shortened with its full words in its title,
which is how long names are shown), `smallCount` (text under the desktop's small size, brief 23's measure of the
desktop's density, 0 on the phone) and `wideTables` (a table that scrolls inside its panel, as Calendar's month does).

## 3. The Cohesion Walk (`tools/cohesion-walk.mjs`)

```
SLATE_URL=http://localhost:4173 SLATE_WALK_SHOTS=0 npx vite-node tools/cohesion-walk.mjs
```

The game as a person meets it at 1280×800: the start, creation end to end, Home, every entry the rail lists and every
tab behind it, the calendar, Save & Exit and back in; leaks (undefined, NaN, null, Invalid Date, a double space, money
in scientific notation), empty headings, error boundaries and a route that doesn't exist on every screen.
**11 screens walked. Nothing broke the thread: no errors, no leaks, every handoff landed.**

The walk itself was stale, and was corrected here, not the game: it hadn't been run since the Windows hygiene commit
of 2026-09-24, before brief 20's creation flow asked where the character was born and before its guide locked the
rail's entries. Run as it stood it never left Identity ("the step would not open: Choose the town or city you were
born in") and reported the four screens it never reached as broken; with the birthplace filled, it pressed your name at
the rail's foot, which is locked until "You As An Actor" is read and opens the guide there, and reported that the rail
still marked Home. It types the birthplace now, reads a `title` that begins "Locked" as a locked entry, and takes the
guide's dialog as the lock's reason; those are its only changes.

## What The Walks Didn't Do

They didn't read chapters 6 to 20 in the browser (the tests on each chapter's row do, and the capture walk shows every
screen those chapters open on two lives that have read them), didn't press Show The Reasons under Why It Went This
Way (held by `tests/pro-representation-screen.test.ts`), and didn't play a stop's Go through a commitment (M9's
`ui.go`, held by `tests/time-stops.test.ts`). The register marks what each walk held with `interactive` in its `by`,
and the rest with inspection and the tests alone.
