# Brief 17's Final Runs, 2026-10-20

These are brief 16's final runs again, on brief 17's tested code, `ecd961cc`:
- the build, the regenerated scenario saves, and the built app at 1440 and 390;
- the long runs and the mastery plans;
- the advice's fresh set again, and its regression set;
- the acting area's measurements and the judge's (`../final/`);
- the journeys (`../journeys-final/`) and the interface playthroughs (`../interface-final/`), with brief 14's three
  journeys beside them (`../journeys14-final/`).

## Why They Were Made Again

Brief 17 changed the words the feedback, the directors, the classmates, the notices and the Profile say, and one rule of
play the owner authorized: a classmate's apology is kept on the misses it's for (section 6). Both touch files these
measurements watch. So each measurement brief 16 made went stale. Running them again shows two things, held apart:
- the words changed no play (brief 17, section 10: "Gameplay unchanged except for the authorized continuity fix");
- the fix changed play only where a classmate's apology was due (section 10: "The fix explained and tested
  separately").

## How They Ran

They ran in clones of the branch, one per lane, through `runs17.sh`, which is brief 16's `runs16.sh` writing to brief
17's folder. `queue17.sh` ran the lanes four at a time, then the journeys' compare (JRC) and the judge's merge (MF) once
their parts were done, and `collect17.sh` gathered them here.
- **One commit:** every lane ran on `ecd961cc`, from 15:43 to 18:55 UTC.
- **Started again once:** the session stops a background command at two hours, and it stopped the queue's shell two
  hours in with eight lanes not done (C, D, ADVF, ADVR, J, UI, JRC, MF). They were started again by name at 17:52,
  detached (`queue17.sh <commit> "<lanes>"`), and each skipped the steps it had passed. No step has two exit lines. A step the
  stop cut short left none, and ran again in full.
- **The trees:** each lane's `exits-<lane>.txt` starts with its commit and "0 tracked files uncommitted", but the advice's
  and the journeys' (below). The judge's `../final/exits.txt` counts one: its lanes' own `runs/` folder, which isn't
  tracked.
- **Each step's command and exit** is in `exits-<lane>.txt`. All exit 0 but banking's two (below).

**The fix taken out** (`fixoff17.sh`, `fixoff-lanes17.sh`): the lanes whose games have a class in them ran again in
clones of `ecd961cc` with one line of `src/engine/systems/classmates.ts` put back as brief 16 had it
(`../fixoff/students/fix-off.patch`), into `../fixoff/`, and `collect-fixoff17.sh` gathered them. Their exits count
that one file uncommitted. The judge's lanes and the built app's weren't run that way: the judge reads no classmate, and
its outputs are brief 16's byte for byte.

**Two lanes played again,** after the first play was read (Found In The Runs, below), each in both kinds of clone:
- the advice's two lanes, ADVF and ADVR (`advice-again17.sh`), with `tools/advice-harness.ts` reading the Profile's
  standing line as brief 17 words it;
- the journeys, JR1 to JR3 and then JRC (`journeys-again17.sh`), with `tools/journeys.ts`'s check 8 reading a revision
  after a warning, and its recheck leaving the parts it didn't play.

Those are tools, not the game, and their exits count them uncommitted: one file in the tested commit's clones, two in
the counterfactual's. The first play's exits are in `first-play/` (and `../fixoff/runs/first-play/`), every step in them exit 0, with F1's
part 4 log, whose check 8 failed.

`figures.py` reads each figure from these outputs into `figures.json`. `../../integration-2026-10-16/criteria.py` reads
that for the matrix, and `../verify.py` reads the journeys' and the interface's results into
`../verification-result.json`. The gate ran after the runs, on the commit `gate.txt` names on its first line, with only
documents and the two tools above changed in between.

## The Outputs

| Output | Command | Result |
|---|---|---|
| `build.log` | `npm run build` | exit 0 |
| `saves/` | `node tools/scenario-saves.mjs <dir>` | 15 of 15 exit 0 (the saves themselves aren't kept; the built app's walk read them, `../final-walk-new/`) |
| `acceptance/` | `node node_modules/vite/bin/vite.js preview --port 4219`, its page checked as the lane's own build, then `SLATE_BASE=http://localhost:4219 node tools/acceptance-ui.mjs <out> 1440 <saves>`, and the same at 390 | 77 passed, 0 failed, 0 skipped, 0 errors, 0 overflows at each width |
| `lives.jsonl` | `npx vite-node tools/lives.ts -- --why --profile <p> --seed lives-<n> --years 3.2`, a life at a time | 24 lives: 20 graduated, and the 4 dismissed are the autopilot control's (Reykjavík), as in brief 16. With the fix taken out, every life's record is brief 16's in every number; with it, 9 of the 24 differ, none in how it ended (below) |
| `workload-*.json` | `npx vite-node tools/workload.ts -- --seed <s> --profile <p> --years 1.4 --policy <q> --out <file>` | with the fix taken out, brief 16's in every number, seven of eight byte for byte. With it, three differ (below) |
| `plan-*.json` | `npx vite-node tools/mastery.ts -- --mode plan --genre <g> --seed <s> --years 8` | with the fix taken out, brief 16's byte for byte. With it, five of six differ, and one mastery day moves (below) |
| `variety-v-0.json` | `tools/variety.ts --seed v-0 --years 3` | with the fix taken out, brief 16's byte for byte. With it, 2,116 hours of practice where brief 16 had 2,118 |
| `freshness.json` | `tools/freshness.ts --months 4 --seeds fr-0,fr-1` | brief 16's byte for byte, both ways |
| `../advice/` | brief 16's advice batches, fresh and held out, then `--summarize`; `--cases tuning` | brief 16's in every number, with the fix taken out and with it: F2-A 40 of 40, and no case flagged stale, as in brief 16. Only each run's own record differs: its commit, whether its tree was clean, the files it read, its seconds |
| `../final/` | `../../decisions-2026-10-16/measure.sh <out> <part>`, 23 parts in lanes M1 to M4 and MF; the acting area's in lane J | every JSON and Markdown file brief 16's byte for byte (`../final/README.md`) |
| `../interface-final/` | `node tools/playthroughs-ui.mjs <normal\|setback\|specialist> <1440\|390> <saves> <out>`, then `summary.py` | normal 14 of 14, setback 9 of 9, specialist 11 of 11, at each width |
| `../journeys14-final/` | `node tools/playthroughs-ui.mjs <banking\|document\|health> <1440\|390> <saves> <out>` | document 8 of 8 and health 10 of 10 at each width; banking 9 of 10 at each width (below) |
| `../journeys-final/` | `npx vite-node tools/journeys.ts -- --journey <id> --part <n> …`, then `--compare` and `--summarize` | 25 journeys played to the end, all ten checks passed on each, 102 steps each exit 0. Each ends as brief 16's but F2, whose fourth term review, on December 8, 2028, is good where brief 16's was concern: 22 of its 45 pieces Unready where brief 16 had 24. With the fix taken out it's concern again, at 24, and every journey ends as brief 16's |

**Banking's step 8**, at both widths, asks One Week from a Friday evening and expects On The Way to ask first. It's
brief 14's `journeys-3`, the engine's week planning, which is left for the owner. Brief 17 didn't change it. It fails
as brief 16's did, at the same step, the clock running the same span to the same stop. Only the stop's words differ: it
says what to press first now, and why there's no Skip It after, the frame editor's change.

## What Differs From Brief 16's, And Why

`../numbers-same.py` makes two comparisons (`../numbers-same.json`). Each compares every number, id, key and list
length, and names what may differ.

**The words, with the fix taken out:** brief 16's runs against `../fixoff/`, and brief 16's judge against `../final/`.
Only these may differ:
- the words a player reads;
- each run's own record: its commit, the files it read, its seconds;
- the counts of words (the journeys' continuity, the advice's word measures);
- the journeys' notice counts, in the ways brief 16's README explains. A notice merges into an unread one with the same
  title and body, and one that now says something new no longer merges. Every notice brief 16's run had on a day is on
  that day under the same titles, and only classmates' notices, Ran Lines With and A Late Card Payment are had more
  times. Several Incompletes from one review are one notice now (the school editor's), so Incomplete is had fewer.

**The result:** the judge's 35 JSON files and the runs' 17 are identical in every number. The advice's 31 and the
journeys' 102 differ only as explained: the run's own record, the notices' counts, the continuity's counts of words.
In the 25 journeys every day and title brief 16's had is kept, and the notices had more times are an apology 63 times,
a word after class 10, A Late Card Payment 4, a request for help 1 and Ran Lines With 1. Incomplete is had 18 times
fewer. Nothing is unexplained, and the script exits 0.

**The fix:** `../fixoff/` against these. Each journey's first difference must be on a classmate's day.
- **The lives:** 9 of 24 differ. Every one of the 24 graduated or was dismissed as it was, on the same day.
- **The workloads:** three differ, each in its fourth term: one fewer piece shown Unready of 46 (9 to 8, 8 to 7, 9 to
  8), and the hours spent with partners and at study sessions. The standing and the last day are the same.
- **The plans:** five differ in the evenings a classmate's rehearsal or lines took. Each genre is mastered on the same
  day with the same payoff but one: slapstick on seed m-0, mastered on December 29, 2030, a day after brief 16's
  December 28. With the fix taken out it's December 28 again, so the day is the fix's.

- **The advice:** the same in every number.
- **The journeys:** 20 of 25 differ, each first on a classmate's day, with everything before it the same, and in each
  an apology on that day one side has and the other hasn't. The other five, J07, J08, J15, J16 and J18, are the same in
  every number. F2's fourth term is the one ending the fix moved (above).

`tools/freshness.ts` writes into `docs/verification/connected-journey/`. It ran in its lane's clone, whose tracked files
stayed as they were.

## Found In The Runs

Reading the first play's results found two of the tools' checks wrong, not the game:
- **Check 8 of the journeys** failed F1, the fixed-seed journey, in its fourth term: "the warning counted 13, the review
  12". F1's Heightened Text Scene was shown Unready on November 14, 2028. The coursework warning of the 17th counted it
  with 12 others, and on the 20th it was revised to Working. The term review reads a revision's band (`termTally`), so it
  counted 12. Both were true when they were said. The check now allows the warning to exceed the review by the pieces
  revised above Unready after it, and only by them.
- **The advice harness's S3** read 1,836 Profile cards as stale for their words alone, every figure in them right, so
  H5, which holds a case to no stale read, failed in 133 cases. Where one aim took over from another, brief 17's
  profile editor named it ("Adaptability is still at 34"), so "it" can't be read as the one before. S3 read only "It’s
  still at 34". It reads both now. The first play's counts are in `first-play/advice-s3.txt`; against the second play
  they differ only in those reads, their count and H5.

Each tool was put right and its lanes played again, on the tested commit's game.
