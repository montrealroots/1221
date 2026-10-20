# Brief 18's Plan, Paused Before Any Fix, 2026-10-20

The owner paused brief 18 at 22:28 UTC ("Actually save and put a pause on all of this. I want to move on to something
else."), after the starting point and the criteria (`../criteria.md`) and before any fix. Nine area workers had begun,
one an area, each in its own clone of `32962d82` on a branch of its own, and were stopped while still reading: none had
changed or committed anything, so there was no work of theirs to keep. What's kept here is the plan, so a session that
takes brief 18 up again starts where this one stopped.

- **`preamble.md`:** the instructions every area worker was given: where to work, what a fix is here (the cause fixed at
  its source, a test that fails with the fix taken out, text marked in the inventory and the coverage matrix, no
  randomness in the words, saves that still open, sources recorded for every rule from law or a bank), and what to
  report. Its placeholders (CLONE, BRANCH, AREA, PORT) were each worker's own.
- **The areas,** one worker each, with the criteria they own:
  - **writing** (W1 to W3): `src/engine/systems/feedback.ts`; brief 17's `justified.py`, `measures.md` and its runs.
  - **profile** (P1 to P4): `src/ui/workspaces/ProfileWorkspace.tsx` and what it draws.
  - **terms** (T1 to T3): the acting terms where they're met, `docs/GLOSSARY.md`, the gazetteer's and the currencies'
    display names, the guide's quotes.
  - **time** (S1 to S5): the stop's Skip It and Call It Off, Tomorrow Morning, the Sleep dialog's suggestion and its
    clock, and banking's step 8 (brief 14's `journeys-3`), which is the Advance menu's One Week.
  - **health** (H1 to H3): the flu's effects as the Profile says them, the recovery notices, the fitness look below 35.
  - **bank cards** (B1, B2, B4, B5): missed payments, the first year's fee, liability, replacement fees.
  - **bank accounts** (B3, B6 to B9): `systems/accountlife.ts` and `content/accountlife.ts`: the overdrawn account's
    warning, Claim It Back, Australia's A$500, term deposit penalties, BMO's notice.
  - **papers** (X1 to X5): CP523's revision, California's new balance, the 1040-NR's interest, the short-term plan's
    penalty, the state plan's figures.
  - **understudy** (U1): the part an understudy covers, from casting to feedback.
- **The final runs,** drafted from brief 17's and not yet run: `runs18.sh`, `queue18.sh`, `collect18.sh`,
  `voices18.sh` and `walk18.sh`, each brief 17's with brief 18's folder. Every lane brief 17 ran was to run again on
  the integrated commit, each difference from brief 17's traced to the fix that makes it.

The baseline needs no new run: `main` at `469f8448` plays brief 17's tested game (`ecd961cc`), so brief 17's final runs
are brief 18's before.
