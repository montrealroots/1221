# Brief 23: SLATE's Desktop And Landscape-Only Mobile Interface, 2026-10-23

The owner's brief 23 (`../briefs-2026-10-16/23-complete-slates-desktop-and-landscape-only-mobile-ui.txt`, kept verbatim)
asked for the interface to be finished on a desktop and on a phone held on its side:
- the phone upright shows Rotate Your Phone To Play, with the clock stopped and nothing lost;
- Home reads around the day, without Your Affairs;
- the notices are told apart from the questions, with an Updates view;
- the bar, the tabs, the dense pages and one layout system;
- accessibility;
- verification at nine sizes across many lives, with the evidence it lists.

Its checks were written before any change (`criteria.md`), from every capture it names and a walk of the app built from
`main` (`inventory.md`). This is the receipt. `CHECKPOINT.md` is the record as the work went, and `coverage.md` is the
screen-by-screen matrix.

**An automated walk isn't a person's play, and emulation isn't a phone.** Every "phone" here is Playwright's Chromium
with touch, no hover and a phone's screen size. No physical phone was used. "Keyboard" is Playwright's key presses, and
no screen reader was run.

## The Tested Commit

`208dbf1f` on `claude/peaceful-hamilton-59zdbb`, from `main` at `ebac1923` (#61), the last change to `src`. The final
walk was made on the app built from it. Later commits change tests and documents only; the gate ran on one of them, its
`src` the same (The Gate, below).

| Commit | What |
|---|---|
| `aabaf9d6` | The brief kept verbatim |
| `323a47c1` | The baseline: every screen walked at nine sizes before any change, its issues and the checks |
| `55543f7c` | Home around the day, Updates, landscape-only phones, the layout system, the dense pages summary first |
| `10a7e916` | The records follow Home's new shape; the Profile summary first; the walk's narrow-window defects fixed |
| `208dbf1f` | Recent Updates groups a repeated notice; the walk's last squeezed and loose controls fixed |

## What Changed

`coverage.md` says it screen by screen. In short:
- **A phone upright:**
  - Rotate Your Phone To Play, and a sentence that SLATE is designed for landscape play.
  - The game under it is `inert`, and a live clock is paused as Pause pauses it.
  - On its side again, the game stays paused until Play, says why once, and adds none of the minutes upright.
  - Nothing unmounts. Orientation lock is asked for once; fullscreen never.

  (`shell/turn.tsx`, `rotation.md`.)
- **Home:** Today (the date, the greeting, the time, the town with its daylight, the sky beside it), What Needs You (the
  questions, then what needs putting right, each with its screen), Up Next, How You Are (with the first two things Look
  After Yourself offers) and Recent Updates (the four most important unread, a repeated notice one line).
- **Your Affairs** went from Home. Nothing was deleted:
  - its lines went to the heads of Money, School and Papers (`components/Glance.tsx`);
  - what they flagged is under What Needs You.
- **Updates,** a screen of its own on the menu: every notice, read and unread, filtered, grouped, marked read, never
  deleted.
- **The bar, the menu, the tabs:**
  - one row, with Running or Paused in words;
  - a drawer at 900 wide or 500 tall;
  - Calendar and Updates on the menu, the place you're on marked;
  - one tab bar that scrolls with a cue and moves with the arrows.
- **The dense pages, summary first:**
  - an offer and an engagement lead with their facts;
  - the pay is a table;
  - Eligibility When Accepted is labeled as that;
  - the Calendar opens on the day's agenda, with a run of one call as one line;
  - the Profile opens on who you are and Readiness Today, with On This Page;
  - School's and Papers' long tables stack on a phone on its side.
- **One layout system:** one gutter, one measure, one control height (44 pixels on a touch screen), tables that scroll in
  their own box, the real screen height (`dvh`), and the notch kept clear.

## The Defects Found On The Way, And Fixed

Beyond the brief's own asks, each found by a test or by the walk. "Walk" means the after walk's measure is what holds it.

| # | Defect | Fix | Held by |
|---|---|---|---|
| 1 | "1 more questions waiting" | One more question waiting; Seven questions waiting | `tests/evidence-g32-ui.test.ts` (more than six questions) |
| 2 | "London has a oceanic climate" | "an oceanic climate" (`aClimate`) | `tests/evidence-g32-ui.test.ts` (h-where-weather) |
| 3 | A student film's pay said "Paid by" when nothing is paid | "Deferred by …: nothing is paid for this work" | `tests/propay-screen.test.ts` |
| 4 | The look-after run hidden from the wiring list behind a hook | The run under each control again | `tools/wired.mjs --check` |
| 5 | Today named no town before the first chapter | The town, zone and season always; the daylight once it's read | `tests/evidence-g32-ui.test.ts` (h-head) |
| 6 | Advance's menu 167 pixels past a 760 window, the page pushed with it | Hung from its button's right edge when it would cross the window | Walk (760) |
| 7 | The bar's name cut to "Player Pro…" at 760; Look After Yourself in two lines | The name where the brand stands in drawer layouts; the bar's buttons on one line | Walk (760) |
| 8 | What Needs You's line 82 pixels wide at 1024, six lines | Its words keep 14rem, the buttons wrap under them | Walk (1024, 760) |
| 9 | Term Reviews' Why 55 pixels wide at 667, 77 lines; course names, parts and the chooser four to six lines at 760 and 1024 | Why under each review's figures, stacking on a phone; readable widths, own scrollers | `tests/b23-pages.test.ts`; walk |
| 10 | Papers' permission dates four lines in 87 to 116 pixels | Stacking on a phone; a readable width on a desktop | `tests/propay-screen.test.ts`; walk |
| 11 | The Profile's It Shapes five lines in 112 pixels at 1440; Readiness Today under 54 genres | Readable widths; Readiness second, with On This Page | `tests/b23-pages.test.ts`; walk |
| 12 | A card's New Limit field 26 pixels wide on a phone | A field and its button wrap, the field keeping 12rem | Walk (Money Cards) |
| 13 | Under 44 pixels on a touch screen: the month arrows (31 wide), the skip link, help's topics, Sleep's slider, tick-box and radio labels | Each at the control's size on a coarse pointer | Walk (touch targets) |
| 14 | Around The Class 163 pixels past its card at 667, once its part had a readable width | Its own scroller | Walk (667, 760, 1024) |
| 15 | Two terms' "A Word On Your Coursework" as two of Recent Updates' four lines | A run is one line, saying how many earlier ones are on Updates; Mark Read reads them all | `tests/b23-pages.test.ts`, `tests/evidence2-b11.test.ts` |

## The Walk

`app/capture.mjs` walked the app built from each commit. The lives:
- a new student and a developed one in their last spring;
- a graduate, and a graduate with an offer standing;
- booked work and a released engagement;
- long names and large sums;
- an older save.

The sizes: 1280×720, 1440×900, 1920×1080, 1024×768 and 760×900 as desktop windows, 667×375, 844×390 and 932×430 as a
phone on its side, and 390×844 as a phone upright. Each step got a viewport image, and whole pages at 1440 and 844.
Before and after were measured with the same script. Each cell is before → after, the steps at that size where the
measure found anything (`after/audit-summary.json`, `before/audit-summary-remeasured.json`):

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

- **After, on `208dbf1f`:** 1,912 steps, none failing a measure, no page error. No primary control is under 44
  pixels on any phone step.
- **The turn suite** at 390×844, for every life (`after/turn-checks.json`), held all of these, 8 of 8:
  - the rotate screen, inert, with the focus on it;
  - the clock paused upright;
  - the place, the tab, the scroll, an open menu, an open dialog and a typed search kept;
  - still paused and said once back on its side;
  - no jump on Play;
  - no rotate screen for the keyboard;
  - an already-paused clock left quiet;
  - Save & Exit turned mid-save.
- **The images:** 134 kept after (`captures/after/`), each beside its before at the same path (`captures/before/`).
  `app/curate.py` chose them.

## Tests And Mutations

- **New:**
  - `tests/b23-turn.test.ts`, 9 tests: the upright phone on the real provider's live clock, a stop across a turn,
    the device table, the lock, no fullscreen.
  - `tests/b23-pages.test.ts`, 6 tests: Home's order with no Your Affairs, the hour and the town said once, a notice
    on Home once with a run pressed read, the Profile's order and index, a press on it, the guide's order, Term
    Reviews.
- **Changed:** every test that read Home's old panels reads where the words are now. Each keeps its claim, and each
  renamed title says what it was. The audit's citations follow through the pipeline's inputs
  (`docs/verification/pipeline/fix-citations-1023.cjs`).
- **Mutations:**
  - **`b23-pages`:** the Profile's old order, no focus after the press, the guide's old order, Why back as a column, a
    section without its id, one row per notice, and Mark Read on the newest only. All 7 killed.
  - **`b23-turn`:** the guard on an already-paused clock, and a call to fullscreen. Both killed.
  - **One survivor:** ranking a run of notices by its most important rather than its newest. A run's notices share
    their importance, so it changed nothing, and the guard went.
  - **The upright phone's own mutations** are in `rotation.md`.

## Keyboard, Zoom And Save Compatibility

- **Keyboard and zoom** (`app/keyboard.mjs`, `after/keyboard.json`), on a released engagement's save:
  - Tab from the top: the skip link, then the bar, the menu and the page, a ring on all 70 stops, none covered.
  - The skip link puts the focus in the page.
  - Each of the eight places is marked on the menu and named the same in the trail.
  - Advance's menu opens on Enter and closes on Escape, with the focus back on Advance.
  - Sleep's dialog holds the focus for 28 presses each way, and gives it back.
  - Money's tabs move with the arrows, Home and End.
  - At 200% nothing on Home is lost, and the guide and Save & Exit are at the drawer's foot.
- **A changing height:** the address bar shown and hidden on a phone on its side and on a desktop. The bar stays at the
  top, the page sits under it to the window's foot, and the scroll is kept.
- **Saves** (`app/save-compat.ts`, `after/save-compat.txt`): the sixteen saves the walk and tests open all load at schema
  94, play a day on, and save and load again. The schema is unchanged.

## The Gate

«GATE»

## The Completion Matrix

**Completion, by the matrix:** 588 of 658 rows in scope Implemented And Verified (89.3%); 66 Implemented, Verification
Incomplete, 0 Partially Implemented, 0 Not Implemented, 0 Blocked Externally, 4 Decision Required, 41 Explicitly Deferred.

It stood at 634 at brief 22's close. Brief 23 changed `src`, so the 46 rows brief 22's final runs measured on the
engine's or the app's whole source read as measured before what they read last changed. Brief 23 changed no game rule:
only the interface, the guide's and the tutorial's words, and the attributes matrix's navigation table. The final runs
that would measure those rows again on `208dbf1f` weren't made here. The owner asked for them before brief 22's merges,
and can again (`../career-genre-2026-10-22/final-runs/runs/`'s scripts).

## What Remains

- **No physical phone and no screen reader.** Every phone is Playwright's emulation, and the keyboard is its key presses.
- **The completion matrix's 66 rows,** above, wait on final runs.
- **The Profile is long,** eight sections of real detail. Each is a press away now, and nothing is folded.
- **The month grid's pills are cut,** each titled, and its day's agenda says every entry in full.
- **On a desktop,** controls under 44 pixels stay: a mouse isn't held to the touch screen's 44.
- **"Your Affairs"** is still the menu's heading for Money and Papers. The panel of that name is gone from Home.
- **Start, the saves and character creation** weren't walked here. Briefs 13 and 14 walked them, and on an upright phone
  they're behind the rotate screen.

## Not Merged, Not Deployed

The brief: "Keep the changes reviewable. Do not merge or deploy without my instruction." Nothing is merged or deployed.
The save schema stays 94, so a deployment of brief 22's line accepts this line's saves.
