# The First Built-App Runs, On 6d83601a

Lanes A (the acceptance walk) and UI (brief 13's three playthroughs and brief 14's three journeys) first ran on
`6d83601a`, with the other lanes. Their exits are `../exits-A-first.txt` and `../exits-UI-first.txt`; their logs and traces
are here, as the lanes wrote them.

They failed:
- acceptance at 1440 and 390;
- normal, setback and specialist at both widths;
- banking at both widths.

Document and health passed at both widths. Every failure in the first two groups was a tool reading words brief 14
replaced, or a step that failed because the one before it threw. `../../uitools/README.md` judges each one and records
the matcher it changed; `3c69ec0e` and `2a2e36a7` hold the change. Banking's failure is the engine's week planning,
`journeys-3` in `../../defects.json`, which is left open.

They are kept because they are what the first run showed. The runs that count are lanes A and UI made again from a
clean clone of the commit that moved them here. Its code is `ebdb5577`'s: the tools' fix and the coursework toast's. Their exits are
`../exits-A.txt` and `../exits-UI.txt`, and their outputs are in `../acceptance/`, `../../interface-final/` and
`../../journeys14-final/`.

The first attempt at those runs, at 04:29 on 2026-10-18, was stopped and none of it was kept, for two reasons:
- The first lanes' preview servers were still running. `kill` had stopped `npx` and not the `vite` it started, so the
  new lanes' own servers couldn't bind their ports, and the browsers talked to the `6d83601a` build.
- The clones carried the first lanes' exit records, and the lane script skips a step already recorded as passed, so
  build, saves, document and health would not have run again.

From then on, `../runs14.sh` (the scratchpad's, copied here as it ran) stops a lane whose exit record is from another commit. It starts the preview as `vite` itself
and runs no browser step unless the page served is the lane's own `dist/index.html`.
