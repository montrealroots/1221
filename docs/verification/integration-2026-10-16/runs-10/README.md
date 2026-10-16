# Brief 10's Final Runs, 2026-10-16

The checks section 5 of brief 10's criteria and the brief itself ask for, on the tested code: the build, the scenario
saves, the built app at 1440 and 390, the long runs, the mastery plans and F2-A's 40 cases. They ran on `57b64401`, in a
clone of the branch, in four lanes at once, and the built app again on `9c40be73`. Each step's exit was recorded (`exits-A.txt` to `exits-D.txt`), so a container
restart would cost one step. None restarted, and every step exited 0. `figures.py` reads each figure from
these outputs into `figures.json`, which `../criteria.py` reads for the completion matrix. The gate ran after, on the
commit that holds these (`gate.txt`, its commit on its first line).

They ran three times, and these are the last:

- **On `2634283b`,** the four areas integrated. Every step exited 0, the built app 72 of 72 at each width.
- **On `567d27dd`,** once the genre row's Mastered had moved two engine files. The workloads and the mastery plans came
  out byte for byte as on `2634283b`. The built app at 1440 failed one step of 72. The run's new life was a different
  draw from the first, and its first open work was a play not yet read. Table Work's select took an answer the command
  then refused, a defect older than brief 10, fixed in `57b64401` (`tests/table-work-unread.test.ts`). The runs still
  going were stopped.
- **On `57b64401`,** these. The 24 lives, the workloads, the mastery plans, variety and freshness came out byte for byte
  as the first run's, and the advice case for case (its files differ only in the commit they name).
- **On `9c40be73`,** the build, the saves and the built app once more (`exits-A2.txt`). An ability's row came to say
  Mastered, at the owner's word, which changed a screen and no engine file. So the runs that read only the engine stand on
  `57b64401`, and `build.log`, `saves/` and `acceptance/` are these.

| Output | Command | Result |
|---|---|---|
| `build.log` | `npm run build` | exit 0 |
| `saves/` | `node tools/scenario-saves.mjs <dir>` | 14 of 14 exit 0; breaches 0, unbalanced 0 (the saves, about 10 MB, aren't kept) |
| `acceptance/` | `npx vite preview --port 4183`, then `SLATE_BASE=http://localhost:4183 node tools/acceptance-ui.mjs <out> 1440 <saves>` and 390 | 72 passed, 0 failed, 0 skipped, 0 errors, 0 overflows at each width |
| `lives.jsonl` | `npx vite-node tools/lives.ts -- --why --profile <p> --seed lives-<n> --years 3.2`, a life at a time | 24 lives: 20 graduated, 4 of 4 in each of New York, Mexico City, London attentive, New York practicing and Scraping with the flu and an injury; the 4 dismissed the autopilot control's (Reykjavík), as on every run since 2026-10-10; breaches, unbalanced and errors 0 |
| `workload-*.json` | `npx vite-node tools/workload.ts -- --seed <s> --profile <p> --years 1.4 --policy <q> --out <file>` | the seven attentive in good standing; London lives-0 neglected dismissed, as the control is; breaches 0 |
| `plan-*.json` | `npx vite-node tools/mastery.ts -- --mode plan --genre <g> --seed <s> --years 8` | 6 of 6 at 100 on every payoff tape; graduated; breaches 0. Five mastered on brief 09's day; slapstick m-0 on 28 December 2030, three days after brief 09's 25th |
| F2-A, `../../decisions-2026-10-16/advice/final/` | `npx vite-node tools/advice.ts -- --cases adv-0..9`, and adv-10 to 39 in the held-out set | 40 of 40 |
| `variety-v-0.json` | `npx vite-node tools/variety.ts -- --seed v-0 --years 3` | graduated; breaches 0, unbalanced 0; 8 distinct top recommendations over 157 weeks (10 on brief 09's run), none at full, the longest unresolved 2 weeks; the same practice situation 3 in a row at most (4 on brief 09's) |
| `freshness.json` | `npx vite-node tools/freshness.ts -- --months 4 --seeds fr-0,fr-1` | eight runs: no take or scene repeated for the beginner, developing and specialist profiles |

The lives ran one at a time through `tools/lives.ts --why`, which plays the same life as its default loop and prints its
diagnosis before the life's one JSON line. `lives.jsonl` is those lines in the default loop's order. `tools/freshness.ts`
writes into `docs/verification/connected-journey/`, so its output was copied here and that folder put back as it was.

**Fewer distinct top recommendations** (8 against 10) go with the advice brief 10 adopted. It names the input whose
training brings most, read at full precision, so it changes less from week to week on noise. That's the same cause as
L1's regression (`../../decisions-2026-10-16/l1/README.md`). The variety run's player follows the advice, and the longest
an advice went unresolved stayed 2 weeks.
