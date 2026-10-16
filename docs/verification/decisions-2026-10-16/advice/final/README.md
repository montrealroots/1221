# F2-A10's Held-Out Set On Brief 10's Tested Code, 2026-10-16

The advice area ran its held-out set once, on its own final advice (`../held-out-summary.json`, on `5c06fd7a` and
`a2fcbf8b`). That clone held none of the judge's or the stamina's changes, and both change what a take comes to. The
advice area's instructions asked for the set to be run again on the integrated code
(`../../prompts/advice.md`, Where You Work). Here it was: on `2634283b`, the four areas together, from a clone
of the branch with a clean tracked tree (`clean: true` in every output, as committed in `1de04ba7`). Nothing in the advice
was tuned after the area's run.

The files here now are the same set run again on `57b64401`, the tested commit, whose genre row's Mastered and Table
Work's fix changed two engine files and a screen the advice doesn't read. Every case came out the same, figure for figure,
and so did both summaries; only the commit each file names differs. These say `clean: false`. Each batch rewrote this
folder's own outputs, which were tracked by then, and the tool counts any tracked file changed. No file under `src` or
`tools` was (`exits.txt`'s first line, `0 tracked files uncommitted` when the run began).

```
npx vite-node tools/advice.ts -- --cases adv-0..9 --out adv-0-9.json                      # F2-A's ten tuning cases
npx vite-node tools/advice.ts -- --cases <batch> --held-out --out held-out-<batch>.json   # fifteen batches, adv-10 to adv-h-119
npx vite-node tools/advice.ts -- --summarize held-out-*.json --out held-out-summary.json
npx vite-node tools/advice.ts -- --summarize adv-0-9.json --out adv-0-9-summary.json
```

Every exit is 0 (`exits.txt`). Each batch's log has its cases' one-line results.

## Each Clause, The Area's Run Against This One

The 120 fresh cases (`held-out F2-A10`) unless named. The thresholds are `../../criteria.md` section 2's.

| Clause | Threshold | The area's run | On `2634283b` and `57b64401` |
|---|---|---|---|
| (b) right often enough | 80%; each band and stage 70% | 118 of 120 (98.3%); the least band 28 of 30, stage 39 of 40 | 118 of 120 (98.3%); the least band 28 of 30 (advanced), stage 39 of 40 |
| (c) better than the alternatives | 95% at or above the median; 1.5× random | 120 of 120; 1.984× | 120 of 120; 1.965× |
| (d) improvable | 0 cases | 0; everything at full said, 30 of 30 near mastery | 0; 30 of 30 |
| (e) the real curve | 80% within 0.3 or a quarter | 117 of 120 | 118 of 120 |
| (f) mastery and preparation | the ladder falls on every case | the first-named's falls 30 of 30; every candidate 277 of 287 | 30 of 30; 276 of 287 |
| (g) it says why | 100% | 524 of 524 | 519 of 519 |
| (h) it updates | the trained input's gain falls on every case | fell 111 of 120; changed where another led 51 of 51 | fell 113 of 120; 51 of 51 |
| (i) no hardcoding | renamed the same | 120 of 120 | 120 of 120 |
| F2-A, its 40 cases (`adv-0` to `adv-39`) | | 40 of 40 | 40 of 40: adv-0 to 9, 10 of 10 (`adv-0-9-summary.json`); adv-10 to 39, 30 of 30 (`held-out F2-A`) |

Every verdict is the area's. (f) and (h) stay Decision Required, with the area's questions and evidence
(`../../../remaining-10/advice-result.json`):

- **(f)** asks which preparation a take is read as having. Its ladders still fall on every first-named input near
  mastery (30 of 30); 11 of the 287 candidates' ladders don't.
- **(h)** fails on 7 of the 120, where the area's run failed on 9. Its question is unchanged: whether a rise under a
  hundredth near mastery, where the days' discipline lifts the next hours, is allowed.

Every figure in this table is read from `held-out-summary.json` and `adv-0-9-summary.json`; none was typed from a log.
