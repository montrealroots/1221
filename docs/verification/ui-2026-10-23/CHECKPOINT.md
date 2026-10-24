# Brief 23's Record As The Work Went

- **2026-10-23, the start.** From `main` at `ebac1923`, on `claude/peaceful-hamilton-59zdbb`. The brief saved verbatim
  (`aabaf9d6`).
  - Every capture under `../career-genre-2026-10-22/captures/` opened.
  - The app built from `main` walked: eight lives, nine sizes, 2,040 steps (2,112 here until 2026-10-24, a figure the summary never held; `app/capture.mjs`, `before/audit-summary.json`,
    `captures/before/`).
  - `criteria.md` and `inventory.md` written, before any change to `src`.
- **2026-10-23, the work** (`55543f7c`):
  - Home in the day's order, Your Affairs' lines at the heads of their screens, Recent Updates and Updates.
  - Rotate Your Phone To Play (`rotation.md`).
  - One layout system: the bar, the drawer, the tabs and the tables.
  - The dense pages summary first: an offer and an engagement, the pay as a table, Eligibility When Accepted, the
    Calendar's agenda and runs.
  - The tests that read Home's old panels now read where the words are.
- **The records** (`10a7e916`):
  - The audit cited Home's old panels. Its fixes went through the pipeline's inputs (`fix-citations-1023.cjs`), not the
    generated JSON, which the pipeline test caught when it was hand-edited.
  - The Profile reads summary first, with On This Page. Term Reviews and Your Work And Your Permission stack on a phone
    on its side.
  - Walk probes at the narrow desktop sizes found:
    - the Advance menu 167 pixels past a 760 window;
    - the bar's name cut beside the brand;
    - What Needs You's lines and five School columns squeezed;
    - a 26-pixel field;
    - controls under 44 pixels on a touch screen.

    Each is fixed. `keyboard.mjs` is written.
- **The after walk on `10a7e916`** (1,912 steps) left three steps failing, Around The Class past its card. A test of Home
  on a played save found two terms' coursework words as two of Recent Updates' four rows. Both fixed (`208dbf1f`):
  Recent Updates groups runs as Updates does, and Around The Class has its own scroller. The older saves were loaded:
  sixteen, all at schema 94 (`after/save-compat.txt`).
- **The final walk** on `208dbf1f`, the last change to `src`: 1,912 steps, none failing a measure. The before walk was
  measured again with the same script (63 screen-and-size pairs failing). `keyboard.mjs` gained a changing height. The
  turn test gained a stop across a turn and no fullscreen. `coverage.md`, the receipt and the handoff were written
  (`f3ef939b`).
- **The gate:**
  - On `f3ef939b` it exited 1: the wiring list read Recent Updates' Mark Read as before, so that line was read again
    and written in (`92f09a4b`).
  - On `92f09a4b` it exited 0: 488 test files, 5,613 tests, all 22 checks.
- **Not merged, not deployed.**
