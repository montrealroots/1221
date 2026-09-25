# SLATE — Current Master Handoff

**Written:** 2026-09-23, in the Linux cloud container at `/home/user/1221` (bash; PowerShell is not installed there). **Updated:** 2026-09-23, on the owner's Windows machine under PowerShell 7.6.6, by Claude Code Account 1 (session `session_016rs5iQsnQMfHXUzUnFERmU`), with the fifth review's fixes, and again for the transfer to Account 2. **Updated:** 2026-09-24, on the same machine, by Claude Code Account 2 (session `session_01W9QMrtdH8X3KoyXXWF8Hbf`), with the spring-forward rollover fix (Start here, §10), again with the day's bounds fix, again with the Windows hygiene commit, and again with the stale-words commit.
**Written for:** Claude Code Account 2, and any later session on either of the owner's two accounts, running on the owner's Windows machine under PowerShell 7. Start with "Start here", below.
**Repository:** `github.com/yvcbcjhsy7-prog/1221`
**Working branch:** `claude/slate-cleanup-e4apmx`
**Verified at:** the handoff commit after the money system (2026-09-24, on Windows): three commits that keep each save in its country's currency (`5e60ce7`), give every character a day job at a real legal floor (`9a12c11`), and make living cost money, with rent, bills, food, a card and a credit record (`1180a04`) (§5, Money). Before them, the background commit (`d731521`), which lets the general interests change how much looking after yourself lifts the mood and asks what somebody did before acting (§5, Interests and background), after the dials commit (`448d68c`), which makes every wellbeing dial decide something (§5, Looking after yourself), after the looking-after commit (`f23ba99`), which gives the player eating, a shower, a workout and an hour unwinding beside sleep (`life.look_after`, §5), after the screenshot fix (`tools/screenshot.mjs` photographs the whole page) and the stale-words commit (`68d7011`), which corrects docs and comments, deletes dead code, and puts the weather decider's sweep on the cities it names (§10), after the Windows hygiene commit (`6d73116`), which changes only tooling and repository settings (§10, Portability). The last commit to change the game is the day's bounds fix (`96ca032`, 2026-09-24; §10): the screens take a day's bounds from the calendar, and a bedtime in the first hour of a day whose clocks skip midnight isn't late. Before it, the spring-forward rollover fix (`7aa9a99`, 2026-09-24): the rollover on the day after a clock change at midnight runs at midnight again. Before that, the fifth review's fixes (`d356640`, 2026-09-23): what the review of `1f75a13` confirmed. Before them, `1f75a13` (the fourth review's fixes) forfeited an unpaid night to a player who keeps them up in it, `0e80f13` fixed what the third review found, `fa24fe4` what the second found, `bd5b2ef` what three reviewers found before `main`, and before that the night-alone fix `4bfa0fa`: a night nobody chose is slept only when the clock carries them through it. Before that, the rollover fix: `7a373c2` charged the waking day as the clock moves (schema 88), and `14c1666` fixed what review found. Those seven reached `main` together by PR #19 on 2026-09-23, with the owner's approval, before the review of the last of them had reported (§0). Before them, the schema-87 commits: `20da24e` moved the save schema from 83 to 87 (§0.4), `f10f1b0` fixed what review found in it, `a5f1f53` corrected the documents and two comments, and `ed0cab7` (PR #18) merged them into `main`. Before those, `36d2cea` ("Fit the new step names, and match Review to them") was the last code commit, and every commit between it and `20da24e` leaves the build alone: `d0636b8` removes an unreferenced scratch file; `acf5e10`, `6c18b6b` and `63b757b` write and correct this file; `beda4d9` brings `CLAUDE.md` over; `ad44f5c` and `297dbfe` correct both files; `4aab498` merges the old `main` in without changing a file; and `cd8d6ef` (PR #17) carries this line into `main`.

This is the one handoff. The owner's `CLAUDE.md` names `SLATE_CURRENT_MASTER_HANDOFF.md` as the only state that passes between sessions; `CLAUDE.md` itself carries the owner's rules. `PROJECT_HANDOFF.md` was retired in `b6f4061`, and keeping a single file stops two handoffs drifting apart. Earlier versions of this file are on GitHub `main` (as of `46f48f3`, 09-18) and, newer, at `4a00db8` (09-21), which is on no GitHub branch. Both describe the line the owner replaced on 2026-09-22 (see §1), so read them only as history.

When this file and the tree disagree, the tree wins. Correct this file in the same commit.

---

## Start here: the transfer to Claude Account 2 (2026-09-23), and its first session (2026-09-24)

On 2026-09-23 Claude Code Account 1 handed SLATE to Account 2, at the owner's request. This section is what Account 2 needs first, and everything it points to is further down. Beyond this file, `CLAUDE.md` and git, nothing from Account 1's conversation is needed.

**What SLATE is.** SLATE is an actor-and-actress life simulator built with React 18, TypeScript and Vite, with Vitest for tests. On 2026-09-22 it was cut down to a person, a place, a calendar, the weather and money, and it's being rebuilt from there one wired system at a time (§2). The engine is deterministic:
- The clock moves only through `Simulation.advanceTo`.
- Every random draw comes from a seeded RNG owned by a decider.
- Saves are at schema 89 (§5, Money).

**Where things are**

| Item | State |
|---|---|
| Repository | `github.com/yvcbcjhsy7-prog/1221`, remote `origin` over HTTPS |
| Canonical line | `main` on GitHub. The owner said on 2026-09-23 to treat the latest `origin/main` as the canonical source of truth. Development goes on `claude/slate-cleanup-e4apmx` and reaches `main` only by PR, which the owner opens or approves and merges. |
| At the transfer | The branch carried two pushed commits past `main` (`0216597`): `d356640` (the fifth review's fixes) and `0040cb6`, which carried this section. The owner merged them into `main` by PR #20 (`8cec213`), and Account 2's session started on 2026-09-24 with the branch, local `main` and `origin/main` all at `8cec213`. |
| Since then | The spring-forward rollover fix (`7aa9a99`) and the day's bounds fix (`96ca032`) reached `main` by PR #21 (`023cd28`), merged by the owner on 2026-09-24, and the branch was brought level with it. After that: the Windows hygiene commit (`6d73116`), the stale-words commit (`68d7011`), the screenshot fix (`b1320f8`), the looking-after commit (`f23ba99`), the dials commit (`448d68c`), the background commit (`d731521`), and the money system (`5e60ce7`, `9a12c11`, `1180a04`) with the handoff commit after it, on the branch past `main` and pushed, for the owner to merge by PR. After a merge, bring the branch level with `git merge --ff-only origin/main` and push it, as after PRs #19, #20 and #21. |
| Only on this machine | The stash, `teleport-stash-backup`, two archive branches and four untracked leftovers. Keep all of them (§11). |

**Environment** (nothing secret; more in §3 and §13):
- Windows 11 Home (10.0.26200), with the clone at `C:\Users\sande\Downloads\1221-GIT`.
- **PowerShell 7.6.6 (`pwsh`) is the execution environment**, by the owner's decision on 2026-09-23. It is not the Windows PowerShell 5.1 that ships with the system.
- Claude Code 2.1.281 runs locally in the terminal (`C:\Users\sande\.local\bin\claude.exe`), and the owner follows along through Remote Control. Claude Code's Bash tool (Git Bash) also exists, but use PowerShell.
- Git 2.55.0.windows.3, repo-local `core.autocrlf=false`, working tree LF. `git push` authenticates through the Git Credential Manager. Don't read, print or change credentials.
- Node v24.20.0 and npm 11.19.0.
- `gh` 2.101.0 is installed but **not logged in**, and Account 1 had no GitHub connector. So a PR is the owner's to open, from `https://github.com/yvcbcjhsy7-prog/1221/compare/main...claude/slate-cleanup-e4apmx?expand=1`, unless the owner logs `gh` in.
- No `.env` exists on this machine, and `.env.example` holds empty placeholders. No Base44 deployment from this line is recorded, and which guard any existing deployment runs isn't recorded either (§10).

**Before modifying code** (CLAUDE.md, rule 2):
```powershell
git fetch origin; git status -sb; git log --oneline -5; git stash list; git worktree list
npm ci      # when node_modules is missing or package-lock.json changed; npm 11's allowScripts warning about esbuild is harmless (§3 step 5)
npm run gate *> "$env:TEMP\gate.txt"; "exit=$LASTEXITCODE" | Out-File -Encoding utf8 "$env:TEMP\gate-exit.txt"; Get-Content "$env:TEMP\gate-exit.txt"
```
Expect exit 0 and 617 tests in 29 files (§1). Any other result is a difference to track down before building.

**Read in this order:**
1. `CLAUDE.md`
2. This section
3. §0
4. §12 (next steps)
5. §10 (known issues; the sleep entries in particular)
6. §5, Sleep and energy
7. §6 (decisions)
8. §7 (rules)
9. §13 (commands and Windows gotchas)

**What Account 1's session did** (session `session_016rs5iQsnQMfHXUzUnFERmU`, 2026-09-23, all on Windows):
1. Confirmed PowerShell 7 and the session's state.
2. Moved the Windows clone onto this line (§3). 20 commits of the old line that were never on GitHub were kept on two archive branches.
3. Re-ran the review of `1f75a13` and fixed what it confirmed (`d356640`; §4, §5, §10).
4. Made lint skip the git-ignored `probe/` (§9).
5. Wrote this handoff.

**What Account 2's session did** (session `session_01W9QMrtdH8X3KoyXXWF8Hbf`, 2026-09-24, on Windows):
1. Checked the transfer against the tree, the stash and the gate. It was as this file said: HEAD `8cec213` equal to `origin/main`, `stash@{0}` at `227fa5a`, one worktree, the four untracked leftovers, and the gate at exit 0 with 530 tests in 28 files.
2. Fixed the spring-forward rollover test-first (§10), with a review run as three reviewers, two skeptics per finding, two mutation testers, a played-career measurement and a differential of `time.ts` over every IANA zone: 57 agents. After its fixes, a final check went over the code that had changed since, and over every new statement in this file, again with two skeptics per finding: 50 agents. What either confirmed was fixed or recorded in §10.
3. Updated this file, committed and pushed (`7aa9a99`). It did not merge.
4. Asked by the owner to fix what the spring-forward review had found and left open, fixed the day's bounds on screen and the jump day's own night test-first (§10), and had it reviewed the same way: a mutation tester, a played-career measurement, three reviewers and two skeptics per finding, 53 agents. What it confirmed was fixed, one regression of the fix's own included, or recorded in §10. Committed and pushed as `96ca032`; the owner merged both fixes into `main` by PR #21 (`023cd28`).
5. Did the Windows hygiene commit (§10, Portability, and §12 step 5), and ran every browser tool on the owner's machine with no `CHROMIUM_PATH`.
6. Corrected the stale words (§10 and §12 step 7), and found the weather decider's sweep running on three of its eight cities.

**What the owner asked of Account 1, and how it was settled:**
- *PowerShell 7 working with Claude Code.* It's the execution environment (CLAUDE.md, updated on this branch).
- *Sync the clone to the canonical `origin/main`.* Unique local work goes on a clearly named safety branch first. No force-push, no history rewrite, no branch deletion. Done (§3).
- *Resume the rollover work where it was paused:* review `1f75a13`, fix what it confirms, gate, handoff, PR with the owner, then the spring-forward rollover. Done up to the spring-forward rollover, which Account 2 did on 2026-09-24.
- *Transfer-ready continuity.* The handoff is the memory, captured at milestones, with no secrets in it. This section is the result.

**Settled. Don't redo these or reopen them without the owner:**
- The gut and what it removed (§2, §4). Don't rebuild anything it deleted unless the owner asks.
- This branch replacing `main` (§0.2), the schema move to 87 and then 88 (§0.4), and the clone move on Windows (§3).
- The rollover (schema 88) and the sleep model after five rounds of review (§5, §6, §10). The review of `1f75a13` has run, so don't run it again. The rules it left:
  - A clock sent more than an hour is a skip. An hour or less means the player is there.
  - A night nobody chose is paid in full once the clock carries them an hour into it.
  - Any stop has them up.
  - A stop in the night's first hour leaves the night owed.
  - If the player moves the clock themselves in an owed night, the night is forfeit, and the stretch already spent in bed is charged as awake.
  - Go and Skip It carry on the skip that the stop broke off.
  - `nightEndsAt` puts them back to bed until the night would have ended.
- The spring-forward rollover fix (§10): the rollover is armed for the first instant of the next calendar date (`startOfNextDay`), a day whose clocks skip midnight begins at the exact end of the gap, and `loadSave` puts back a rollover an earlier build armed an hour or 61 minutes late.
- The day's bounds fix (§10): what the game shows of a day runs from its first instant to `startOfNextDay`, days ahead are stepped by calendar date (`noonOf`), each hour of the weather sits at its own reading on the clock, and a bedtime is late from one to five by the clock and an hour or more after the day began.
- The owner's standing constraints:
  - Never apply, pop or drop the stash.
  - Never merge worktrees.
  - Never force-push.
  - Never merge to `main` without the owner.
  - Read the gate's exit code from a file.
- How the owner wants the work done:
  - Decide ordinary design calls and report them.
  - Explain a risky operation before doing it.
  - Commit messages say what was decided and why.
  - A comment that a change makes false is corrected in the past tense.
  - Measure on a played career.
  - Mutation-test whatever a test protects.
  - Run a big review as three reviewers with two skeptics per finding (§12 step 2 has the method).

**Open for the owner:** a fresh Next Event of an hour or less after a stop in the night's first hour forfeits the night, as One Hour does. On a nightly routine, 9 of 76 cases wear down (§10). It was kept by decision at the fifth review, and the owner hasn't ruled on it yet.

**Done on 2026-09-24: the spring-forward rollover** (§10 has the whole of it, §12 step 1).
- **What was wrong:** in the five home zones whose clocks jump from 00:00 to 01:00 (Havana, Santiago and the Azores, Beirut and Cairo), the rollover on the day after the jump ran at one instead of midnight: at 01:00 in the first three, and at 01:01 in Beirut and Cairo, whose days of the jump were taken to start at 01:01. That day's night nobody chose started then, with the hour before it charged as awake and the late-bedtime penalty. From the next day it was back at midnight.
- **What changed:** `startOfNextDay` (`src/engine/core/time.ts`) works out the next day's first instant from the calendar date. The rollover re-arms with it (`life.ts`), and so do `armWorldClock` and `loadSave` (`index.ts`); `migrate()` counts a pre-88 save's waking day from it. `instantFromZoned`'s gap walk lands on the end of the gap whichever side its passes stop on, which is what had started Beirut and Cairo's days of the jump at 01:01. `loadSave` puts back a rollover a build before the fix armed late, and a night owed from 01:01.
- **Acceptance criteria, as met:**
  1. Tests in all five zones show the rollover at 01:00 on the day of the jump and at midnight from the day after, with the night nobody chose starting at that midnight. Cairo and the Azores were added to the three named.
  2. A save loaded on the day of the jump re-arms at the next local midnight, and one an earlier build armed late is put back.
  3. Every test that existed passes unchanged, the calibration years included. A year of Tomorrow Morning in Reykjavík, Los Angeles, London and Sydney ends byte-identical to `8cec213`.
  4. Mutating the fix fails a test. §9 has the mutants, and the few that survive change nothing a save can reach.
  5. `npm run gate` exits 0, read from a file: 581 tests in 28 files at `7aa9a99`.
  6. The §10 entry is moved to fixed, in the past tense.
  7. Reaching `main` by PR waits on the owner. The commit is pushed and not merged.

**Done on 2026-09-24: the day's bounds on screen, and the jump day's own night** (§10 has the whole of it). The review of the spring-forward fix had found these; none was caused by it, and all predated this branch. The owner said to fix them.
- **What was wrong:** the night into the day of the jump, in the five zones that skip midnight, started at that day's first instant, which reads 01:00, and took the late-bedtime penalty, as did any bedtime in that day's first hour. The screens cut a day by adding a day, or 24 hours, to its start: the Day look and the entry look, `monthGrid`, the plan form, the hours of the weather, and the week ahead and the weather looks built on it. On 23- and 25-hour days, in every zone with daylight saving, they put plans in two cells or none, offered slots on the wrong date, labeled hours an hour off, and skipped or repeated a day of the week ahead.
- **What changed:** a bedtime is late from one to five by the clock and an hour or more after the day began. What the screens show of a day runs from its first instant to `startOfNextDay`. The plan form's helpers moved to `src/ui/workspaces/cell.ts` and count the day's own half hours. `hoursOn` puts each hour at its own reading on the clock. The week ahead and the weather looks step by calendar date at noon (`noonOf`, new in `time.ts`). The month grid reads a day past each edge, as the Day look does, so a clash across its first or last midnight is flagged. The stretch look lets an hour run until the next hour listed, so a plan in the second run of a repeated hour still opens.
- **Acceptance criteria, as met:** tests in all five jump zones and in Los Angeles on its 23- and 25-hour days, and in Havana on its 25-hour day, for each site, plus Nuuk, Chatham and Paris for the three edges the review found; the calibration years unchanged; the gate at exit 0 with 617 tests in 29 files; mutation results in §9; the §10 entries moved to fixed. It reached `main` with the spring-forward fix by PR #21.

**The next task: whatever the owner directs** (§12 step 10). The Windows hygiene commit, the stale words, looking after yourself, the dials that decide something, the Interests & Background page and the money system are done (§12 steps 5, 7, 8 and 9). The owner's standing preference since 2026-09-24: SLATE reflects the real world, wherever the character is. §10 keeps what is still open, and `docs/UNBITTEN.md` lists what a next system could make bite.

**The larger plan** (§12). The revamp after the gut goes one wired system at a time:
- **Done:** the gut and the post-gut rebuilds (title, citizenship, personality), the schema moves, the rollover and the sleep model, the spring-forward rollover, the last item of the rollover work, the day's bounds on screen, the Windows hygiene commit and the stale words.
- **Then:** whatever the owner directs next (§12 step 8). The owner hasn't named the next system yet; a system that reads the idle axes, the money traits or citizenship would retire entries from the ledgers.
- **Deploying to Base44 comes last** (§12 step 9). It needs the gate, a server-side fix for Restore Backup, and the guard deployed before or with the client (§10).

---

## 0. Read this box first

**Where this is, 2026-09-24, on Windows.** The review of `1f75a13` has run, and the fifth review's fixes fix what it confirmed (§4, §5, §10). Account 1 then handed the project to Account 2 (Start here), and the owner merged both commits into `main` by PR #20. Account 2 fixed the spring-forward rollover, then the day's bounds on screen and the jump day's own night (§10), and the owner merged both into `main` by PR #21. Then the Windows hygiene commit and the stale-words commit, on the working branch, pushed, and for the owner's PR. Next: whatever the owner directs (§12 step 8).

The owner had paused the rollover work at `0216597` and had it merged into `main` as it stood (PR #19), to pick it up in another session. `1f75a13` had been checked by the gate, three mutations of its rule, a fuzz of 450 careers and the previous reviewers' own probes, but its multi-agent review had been stopped before it reported. It was re-run on Windows as the review of `0e80f13` was: three reviewers, two skeptics per finding, 29 agents. Of 13 findings, 11 were upheld by both skeptics and 2 refuted by both (§10). Every other number the commit messages of `0e80f13` and `1f75a13` give reproduced, except 66.75, which is 66.65.

1. **Work on `claude/slate-cleanup-e4apmx`.** Everything described here is on that branch, pushed, and level with GitHub. Since 2026-09-23 `main` carries the same line (§0.2). Keep developing on the working branch, and bring it into `main` by PR, with the owner.
2. **This branch replaced `main` on 2026-09-23, by the owner's decision.** The old `main` (`e139e06`, 2026-09-18) carried 67 commits from the line the owner chose to drop, merged through PR #15 and PR #16 (72 counting the merge commits for PRs #12 to #16). The owner chose a merge over a force-push. Merge `4aab498` records `e139e06` as a parent and keeps this branch's tree exactly (`git merge -s ours`), and a PR from this branch carried it into `main`. That history is still reachable from `main`, but none of its files are in the tree. This line forked from it at `dc52d64` (2026-09-16) and has 26 code commits of its own since (14 on 09-22; on 09-23 the two schema-87 commits, the rollover fix `7a373c2`, `14c1666`, which fixed what review found in it, the night-alone fix `4bfa0fa`, the four rounds of review fixes after it, `bd5b2ef`, `fa24fe4`, `0e80f13` and `1f75a13`, and the fifth review's fixes; on 09-24 the spring-forward fix and the day's bounds fix), plus the 09-23 commits that leave the build alone (§4). Commits after `cd8d6ef` reach `main` only by PR, with the owner.
3. **The Windows clone is on this line since 2026-09-23** (§3, §11). It had been on the dropped line, with 20 commits of it that were never on GitHub. Those are kept on two local archive branches, unpushed. The stash and the untracked files are untouched. **Don't `git pull` on an archive branch, and don't push one.**
4. **Schema numbers 83 to 86 were used twice, and this line has moved past them.** On the old `main` (before 2026-09-23), 83 was the old family-and-film build, and the dropped line went up to 86. This line used 83 for "personality restored" until the schema-87 commit moved both pins to 87. Until then, an old-`main` save at 83 opened without `migrate()` and every player command on it threw, because it had no `history`; a save at 84 to 86 was refused as newer. The rollover fix (`7a373c2`) then moved both pins to 88 (`src/engine/domain/model.ts`, `base44/shared/guard.js:25`). Now a save from either line, 83 to 86, opens through `migrate()`, which works from the shape of the data: it drops the old person fields, keeps the old collections as inert records, and fills what is missing. Old creation drafts (`1.1.0/83`, `1.1.0/86`, `1.1.0/87`) are discarded, because drafts are now stamped `1.1.0/88`. Opening an old save rewrites it, so copy the `slate.*` keys out first if they matter (§3, step 7).
5. **`CLAUDE.md` is on this branch now.** The owner asked on 2026-09-23 for their blueprint to come over from `main`, corrected for this branch. The seventeen rules and the standing constraints are unchanged; §7 summarizes them. A clone still on the old line has the old `CLAUDE.md` on disk, and a session started there has loaded it, until §3's switch.

---

## 1. Snapshot

| Item | State |
|---|---|
| Branch | `claude/slate-cleanup-e4apmx`, pushed. At the transfer it was two commits ahead of `main` (`0216597`), which the owner merged by PR #20 (`8cec213`). The spring-forward fix (`7aa9a99`) and the day's bounds fix (`96ca032`) went in by PR #21 (`023cd28`). The owner merged all eighteen commits, through the guide (`644066e`), by PR #22 (`cd372be`) on 2026-09-25, so the branch and `main` held the same tree. Since then: the bank, which carries this file, for the owner to merge by PR. |
| Machine | The owner's Windows 11 machine, `C:\Users\sande\Downloads\1221-GIT`: PowerShell 7.6.6, Claude Code 2.1.281, Git 2.55.0.windows.3, Node v24.20.0, npm 11.19.0, `gh` 2.101.0 at `C:\Program Files\GitHub CLI\gh.exe` (not logged in), repo-local `core.autocrlf=false` (§3, §13) |
| Last verified code commit | The day's bounds fix (2026-09-24, on Windows), after the spring-forward fix (`7aa9a99`, 2026-09-24), after the fifth review's fixes (`d356640`, 2026-09-23), and those after `1f75a13` (the fourth review's), `0e80f13`, `fa24fe4`, `bd5b2ef`, the night-alone fix `4bfa0fa` and the rollover fix: `7a373c2` and `14c1666`, which fixed what review found (schema 88). Before them, `f10f1b0` (2026-09-23), which fixed what review found in `20da24e` (schema 87), and `36d2cea` (2026-09-22). |
| GitHub `main` | Replaced by this line on 2026-09-23: merge `4aab498`, carried in by a PR. The old tip `e139e06` (2026-09-18, "Merge pull request #16") is one of that merge's parents. PR #18 (`ed0cab7`) brought schema 87 into it. The rollover fix, the night-alone fix and the review fixes followed by PR on 2026-09-23, with the owner's approval (schema 88), and the fifth review's fixes and the transfer by PR #20 (`8cec213`). |
| Fork point with the old line | `dc52d64` (2026-09-16, schema 79) |
| The replacement on 2026-09-22 | `abd4727` ("the gut") was pushed over `4a00db8` with the owner's explicit approval. That dropped 157 commits dated 09-17 to 09-21 from three other sessions. 67 of them reached `main` through PRs #15/#16. The other 90 (`46f48f3..4a00db8`) are on no GitHub branch. The owner's words: "destroy those 157 commits, the real work is what we're doing now." |
| Save schema | `SAVE_SCHEMA_VERSION = 89` (`src/engine/domain/model.ts:482`) and `SUPPORTED_SCHEMA_VERSION = 89` (`base44/shared/guard.js:25`). Move both together. 84 to 86 are skipped on purpose (§0.4). 88 added `awakeSince` on every person (§5, Sleep and energy). 89 keeps a save's money in its country's currency (`SaveMeta.currency`) and gives every character `job`, `home` and `credit` (§5, Money). A deployment at 88 refuses every 89 save, and would print krónur as euros if it didn't. |
| App version | `APP_VERSION = '1.1.0'` (`src/engine/world/bootstrap.ts`). `package.json` and the lockfile's root say `1.1.0` too; they said `1.0.0` until the stale-words commit. |
| Gate | `npm run gate` exits **0**: 29 test files, **617 tests** at the tip (the day's bounds fix, on Windows), and every gate tool. 581 in 28 files at `7aa9a99`; 530 at `d356640` and `8cec213`; 526 at `1f75a13` and at `0e80f13`; 523 at `fa24fe4`; 521 at `bd5b2ef`; 515 at `4bfa0fa`; 504 at `14c1666`; 500 at `7a373c2`; 485 at `ed0cab7`; 480 at `20da24e`; 478 at `36d2cea`, `d0636b8` and `beda4d9`. |
| Build | `npm run build` exits **0** (110 modules, 727.86 kB of JS at the tip; 718.78 kB at the money handoff; 102 modules and 683.88 kB at `d731521`; 680.26 kB at `448d68c`; 678.57 kB at `f23ba99`; 675.59 kB at `68d7011`; 675.60 kB at `96ca032`; 674.99 kB at `7aa9a99`; 674.40 kB at `d356640`). |
| Browser walk | A scratch Playwright script (not in the repo) walked all nine pages at 1440 wide against `vite preview`: **0 page errors**, and no `undefined`, `NaN` or `[object Object]` on the eight pages after the start screen. The start screen was only photographed. |
| Working tree | Clean apart from four untracked leftovers of the old line (§11), which are left alone, and the git-ignored `probe/`. |
| Tracked files | 624 at `36d2cea`; 625 at `beda4d9` and after, `d356640` and `7aa9a99` included; 626 with the day's bounds fix, which adds `tests/day-bounds.test.ts`; 629 with the Windows hygiene commit (`.gitattributes`, `tools/audit.mjs`, `tools/browser.mjs`); 628 with the stale-words commit, which deletes `src/engine/content/names.ts`; 629 with the looking-after commit, which adds `tests/looking-after.test.ts`; 630 with the dials commit, which adds `tests/wellbeing-bites.test.ts`; 632 with the background commit, which adds `src/engine/content/backgrounds.ts` and `src/engine/systems/enjoyment.ts`; 636 with the job (`content/wages.ts`, `content/jobs.ts`, `systems/work.ts`, `tests/work.test.ts`); 640 with living costs (`content/rents.ts`, `systems/household.ts`, `systems/credit.ts`, `tests/household.test.ts`); 641 with the five fixes (`tests/livelihood.test.ts`) |

---

## 2. What SLATE is right now

SLATE is an actor-and-actress life simulator at the start of a revamp. On 2026-09-22 the owner cut it to a person, a place, a calendar, the weather and money. Everything else was deleted instead of wired: the character sheet, the film career, casting and auditions, the family business, the family, and the land, house and security.

From the player's side:

1. **Startup.** Six loading stages, then the save slots. The footer reads "Version 1.1.0 · Schema 89".
2. **Save slots.** Three slots, each its own universe, with New Save, Continue, Restore Backup and Delete.
3. **Character creation:** five steps, `['Identity', 'Dispositions & Traits', 'Interests & Background', 'Starting Point', 'Review']` (`src/ui/creation/CharacterCreation.tsx:58`), then **Begin**.
   - **Identity:**
     - Portrait, and first, middle, last and preferred names.
     - Pronouns. **Billed As** is settled by them: He/Him means Actor and She/Her means Actress. Under They/Them the player must pick one, and Continue stays shut until they do.
     - Race or ethnicity (optional) and date of birth. The birth year must be no later than the start year minus 18 (2008 against the 2026 start), so a late birthday can leave the character 17 on day one, and no older than 95. This is deliberate; don't turn it into an age test.
     - Place of birth, chosen on a world map. **Citizenship** is shown as output and is never asked.
   - **Dispositions & Traits:**
     - Seven sliders from 5 to 95.
     - 35 traits in six groups, shown in opposing pairs (An Open Book, Forgiving and Scattered stand alone because their opposites are already paired). At most four can be picked, and a blocked trait says why it's blocked.
   - **Interests & Background:** interests, film genres, and "Where You Come From".
   - **Starting Point:** where you live (or "I Still Live Where I Was Born") and starting wealth.
   - **Review:** cards for Identity, Starting Point, Dispositions & Traits, and Interests & Background.
4. **Home:**
   - A greeting, with the title (Actor/Actress) in the eyebrow.
   - Panels: Calendar, What Needs You, How You Are, Where You Are, Weather and Money.
   - Every noun opens a drill-down "look".
5. **Calendar** (`/workspace/calendar`, reached from Home):
   - A month grid, with plans you make yourself.
   - Local holidays, and conflicts over the next thirty days.
6. **Time controls:**
   - Play/Pause.
   - **Sleep**, with a suggested length and the reason for it.
   - **Advance ▾**: One Hour through One Week, Next Event, and Choose An Event…, which opens Skip To Event.
   - The prompt when a commitment comes due.

The engine registers 8 commands, 3 scheduled kinds, 2 passage reactors (`life.night_alone` and `life.waking`) and 1 route. `tools/inventory.mjs --check` holds `docs/COVERAGE-MATRIX.md` to exactly that.

---

## 3. First steps on the Windows machine (PowerShell 7)

**Done on 2026-09-23.** The first session on the Windows machine ran these steps, and the clone is on this line. What it found and did:
- Before: local `main` at `cd8d6ef` (checked out) and a local `claude/slate-cleanup-e4apmx` at `a8e1106`, on the dropped line. That branch held **20 commits past `4a00db8` that were never on GitHub**, all from 09-21: build step 1 (`theStatement`), step 2 part one (`askingFor` in `src/engine/world/asking.ts`), the four design audits of `docs/STUDIO-DESIGN.md`, `tools/burn.mjs`, and that line's handoff. They were checked as unique three ways: `git cherry` marks all 20 `+`, no title matches anything in `origin/main`'s history, and none of their files are in `origin/main`. §11 had said "most likely the whole dropped line up to `4a00db8`"; it was that plus these 20.
- Preserved, nothing deleted: `archive/local-pre-cut-line-2026-09-21` (made first) and `archive/pre-gut-line` (step 4's rename, upstream unset), both at `a8e1106`. Neither is pushed, per step 4.
- Then `git switch -c claude/slate-cleanup-e4apmx --track origin/claude/slate-cleanup-e4apmx`, and local `main` was fast-forwarded with `git fetch . origin/main:main`.
- `core.autocrlf` was already `false`. `stash@{0}` (`227fa5a`, "Teleport auto-stash") and its copy `teleport-stash-backup` are untouched.
- Verified: at `cd8d6ef` the gate exited 0 with 478 tests in 28 files, and the build exited 0 (102 modules, 670.69 kB of JS), the same as in the container. At `0216597` the gate exited 0 with 526 tests in 28 files, as §1 said. So this line is verified on Node 24 and npm 11 as well as on Node 22 and npm 10.
- The session had loaded the old line's `CLAUDE.md` at start. The tree's copy is this line's; the seventeen rules are the same.

The steps stay here for any other clone. Each step below says what it does. Run them in order and read the output. Stop and ask the owner if anything differs from what is expected.

**Before anything: this file isn't on that disk yet.** The Windows working tree holds the old line's `SLATE_CURRENT_MASTER_HANDOFF.md` and `CLAUDE.md`, and a Claude Code session started in that clone loaded the old `CLAUDE.md` when it started. Its seventeen rules match this branch's, but its facts don't: it counts seventeen gate checks, names `tools/claims.mjs` and `docs/ARREARS.md`, and says twenty-two tests go down. Follow this branch's copy instead. The old handoff's git procedures, including `git pull` and `git reset --hard origin/claude/slate-cleanup-e4apmx`, **must not be followed**: after the 09-22 replacement they would merge the dropped line into this one or throw it away. After Step 2's fetch, read this branch's two files with `git show origin/claude/slate-cleanup-e4apmx:SLATE_CURRENT_MASTER_HANDOFF.md` and `git show origin/claude/slate-cleanup-e4apmx:CLAUDE.md`.

Stop any `npm run dev` or `npm run preview`, and close editors on the clone, before switching branches or running `npm ci`. On Windows a locked file makes git ask "Unlink of file … failed. Should I try again?" and can leave stale files behind, and it makes `npm ci` fail with EPERM.

**Step 1: Look before touching.**
```powershell
$PSVersionTable.PSVersion          # expect 7.x. If it shows 5.1, open pwsh; if PowerShell 7 isn't installed, ask the owner.
Set-Location <the SLATE clone>
git status -sb
git log --oneline -3
git stash list
git worktree list
git branch -vv
Test-Path SLATE-CURRENT-CLEANUP-FULL-CONTEXT.txt   # the old line's .gitignore hides it, so status won't show it
```
The previous handoff recorded these things on that machine: `stash@{0}` = `227fa5a`, a protective branch `teleport-stash-backup`, the context export `SLATE-CURRENT-CLEANUP-FULL-CONTEXT.txt`, and a repo-local `core.autocrlf=false`. **Never apply, pop, drop or clear that stash.**

**Step 2: Fetch.** This only updates remote-tracking refs.
```powershell
git fetch origin    # the branch's line says "(forced update)": that's the 09-22 replacement, and it's expected
git diff --stat 36d2cea origin/claude/slate-cleanup-e4apmx   # expect CLAUDE.md, SLATE_CURRENT_MASTER_HANDOFF.md, walk-tmp.mjs (deleted), and the schema-87 commits' files: base44/shared/guard.js, docs/COVERAGE-MATRIX.md, src/engine/domain/model.ts, src/engine/index.ts, src/engine/persistence/base44.ts, src/ui/saves/SaveSlots.tsx, tests/base44-adapter.test.ts, tests/persistence.test.ts, tests/simulation.test.ts, the rollover fix's: README.md, src/engine/core/simulation.ts, src/engine/systems/life.ts, src/engine/world/bootstrap.ts, tests/personality.test.ts, tools/inventory.mjs, and the ones after it: tests/smoke.test.ts, src/ui/looks/wellbeing.tsx, tests/looks.test.ts (21 files)
```

**Step 3: Line endings, before any switch.** The index is all LF. There was no `.gitattributes` until the Windows hygiene commit (2026-09-24), which added `* text=auto eol=lf`, so a checkout of that commit or later is LF whatever `core.autocrlf` says; a switch to an older commit still takes the setting in force. The Git for Windows installer sets `core.autocrlf=true` system-wide. The previous session set a repo-local `false` after the old line's voice-check counted 41 against its budget of 40 under CRLF. This line's gate passed under CRLF in a test on 2026-09-23, so the setting is no longer what makes the gate pass. It keeps the working tree byte-identical to what's committed. Files written by a switch take the setting in force at that moment, so confirm it first:
```powershell
git config --local core.autocrlf       # expect: false. If it isn't, set it with: git config --local core.autocrlf false
```

**Step 4: Move the clone to this line without losing the old one.**
```powershell
git status --porcelain --untracked-files=no        # must print nothing; if it prints anything, stop and ask the owner
git log --oneline -1 claude/slate-cleanup-e4apmx   # probably 4a00db8 "Strip fifteen doubled headings in Part 6"
git merge-base --is-ancestor refs/heads/claude/slate-cleanup-e4apmx origin/claude/slate-cleanup-e4apmx; $LASTEXITCODE
```
This tests the local branch itself, not whatever HEAD happens to be.

- **`0`:** the local branch is behind this line and can fast-forward:
  ```powershell
  git switch claude/slate-cleanup-e4apmx
  git merge --ff-only origin/claude/slate-cleanup-e4apmx
  ```
- **`1`:** the local branch is on the dropped line. Keep it under a new name; a rename loses nothing:
  ```powershell
  git branch -m claude/slate-cleanup-e4apmx archive/pre-gut-line   # the old line stays, under a new name, with its reflog
  git branch --unset-upstream archive/pre-gut-line                  # it no longer tracks the new line, so a bare git pull or git push on it has nothing to act on
  git switch -c claude/slate-cleanup-e4apmx --track origin/claude/slate-cleanup-e4apmx
  git status -sb                                                    # expect: ## claude/slate-cleanup-e4apmx...origin/claude/slate-cleanup-e4apmx
  ```
  Don't push `archive/pre-gut-line`, and don't use `git push --all`.
- **`128`** ("Not a valid object name"): there's no local branch by that name. Run only the `git switch -c … --track …` line.

If `git merge --ff-only` refuses, stop and ask the owner. Don't follow git's hint to run `git merge --no-ff` or `git rebase`: either one would pull the dropped line into this branch.

Git refuses a switch that would overwrite an untracked file. That refusal is safe; ask the owner before moving the file. Switching takes the old line's tracked files off the disk and puts this branch's `CLAUDE.md` and handoff in their place. The old versions stay on the branch you left (`archive/pre-gut-line` after the `1` case). The switch doesn't change what a running session has already loaded, so a session started before it still holds the old `CLAUDE.md`: read `CLAUDE.md` from disk now and follow it where the two differ, or start a new session in the clone. The stash isn't touched, because it doesn't belong to a branch.

After the switch, `SLATE-CURRENT-CLEANUP-FULL-CONTEXT.txt` shows as `??`, because this line's `.gitignore` doesn't list it. Leave it, and never run `git add -A` or `git add .` in this clone. To hide it again without a commit: `Add-Content .git\info\exclude 'SLATE-CURRENT-CLEANUP-FULL-CONTEXT.txt'`.

**Step 5: Install and verify.** Read the exit code from the command, not from a pipe.
```powershell
node -v; npm -v      # v24.20.0 and 11.19.0 on the owner's machine; the container ran Node 22.22.2 and npm 10.9.7. The gate passes on both. npm 11 warns that esbuild's install script isn't covered by allowScripts and skips it; that's harmless, because esbuild's binary comes from @esbuild/win32-x64.
npm ci
npm run gate *> "$env:TEMP\gate.txt"
"exit=$LASTEXITCODE" | Out-File -Encoding utf8 "$env:TEMP\gate-exit.txt"
Get-Content "$env:TEMP\gate-exit.txt"      # expect exit=0
Select-String -Path "$env:TEMP\gate.txt" -Pattern 'Test Files|Tests ' -CaseSensitive
npm run build; "build exit=$LASTEXITCODE"
```
Expect gate exit 0 and the test count in §1. A different number means something differs between the machines. Investigate it before building anything.

**Step 6: Run it.**
```powershell
npm run dev          # http://localhost:5173
# or, for the built bundle:
npm run preview      # http://localhost:4173 (run it in a second terminal; it blocks)
```

**Step 7: Copy out old saves before playing.**
The browser may hold saves and drafts from the old line (§0.4). This build throws those drafts away, and brings those saves forward when they're opened: `migrate()` drops the old line's person fields, and the save is written back. The checkpoint taken first holds the old payload only until the next write, and the game autosaves every 45 seconds. `http://localhost:5173` and `http://localhost:4173` keep separate localStorage, so do this on each one you'll use. In the browser console, the first line copies every `slate.*` key to the clipboard (paste it into a file to keep it), and the second clears them, which is optional now:
```js
copy(JSON.stringify(Object.fromEntries(Object.keys(localStorage).filter(k => k.startsWith('slate.')).map(k => [k, localStorage.getItem(k)]))))
Object.keys(localStorage).filter(k => k.startsWith('slate.')).forEach(k => localStorage.removeItem(k))
```
A fresh browser profile works too. The keys are `slate.save.{1-3}`, `slate.backup.{1-3}`, `slate.draft.{1-3}` and `slate.favourites`.

**Step 8: Browser tools (optional).** The gate doesn't need a browser. The Playwright tools do:
```powershell
npx playwright install chromium               # once; Chromium 1234 is installed on the owner's machine
npm run audit                                 # builds, serves the build, runs tools/ui-audit.mjs, stops the server
$env:SLATE_URL = 'http://localhost:4173'      # for the others, with npm run preview running in another terminal
node tools/walkthrough.mjs walkthrough
```
Every browser tool finds its Chromium through `tools/browser.mjs`: `CHROMIUM_PATH` when it's set, the container's `/opt/pw-browsers/...` path when that exists, and otherwise the browser Playwright installed. Until the Windows hygiene commit, `ui-audit.mjs`, `walkthrough.mjs`, `screenshot.mjs`, `drill.mjs` and `cohesion-walk.mjs` named the container's path outright and failed on Windows unless `CHROMIUM_PATH` was set, and `npm run audit` was a bash line that hung under cmd.exe. `tools/drill.mjs` writes its report and its stuck-page screenshot to the system's temp folder (`os.tmpdir()`), where it had written to `/tmp`.

---

## 4. What this session did (2026-09-09 to 2026-09-24)

These are the commits that carry `Claude-Session: https://claude.ai/code/session_01Na7AwFNze8QYVWFfuUXBhY`:
- 179 of them lead up to `36d2cea`. The first is `62c30ca` ("Cut SLATE back to six things", 09-09), and the last of them to change code is `36d2cea` (09-22). After the schema-87 commits came the rollover fix (`7a373c2` and `14c1666`, 09-23, schema 88), then the night-alone fix (`4bfa0fa`) and four rounds of review fixes after it (`bd5b2ef`, `fa24fe4`, `0e80f13` and `1f75a13`, the last code commit of that session).
- The 09-23 commits (`d0636b8`, `acf5e10`, `6c18b6b`, `beda4d9` and any later ones) carry the same trailer, so the grep below returns 183 at `beda4d9`, and one more for each later commit from this session.
- 165 of them, everything up to `dc52d64`, were on `main` before 2026-09-23. The 14 from 09-22 and the 09-23 commits up to `cd8d6ef` reached `main` when this branch replaced it that day. Later commits reach `main` only by PR: the schema-87 commits did in PR #18 (`ed0cab7`), and the rollover fix, the night-alone fix and the review fixes did together in PR #19 on 2026-09-23.

To list them: `git log --oneline --grep=session_01Na7AwFNze8QYVWFfuUXBhY`.

The first session on the Windows machine (Claude Code Account 1, `session_016rs5iQsnQMfHXUzUnFERmU`, 2026-09-23) moved the clone onto this line (§3), re-ran the review of `1f75a13`, and made the fifth review's fixes. Its commits carry that trailer instead: `git log --oneline --grep=session_016rs5iQsnQMfHXUzUnFERmU`.

Account 2's first session (`session_01W9QMrtdH8X3KoyXXWF8Hbf`, 2026-09-24) made the spring-forward fix, and its commit carries that trailer: `git log --oneline --grep=session_01W9QMrtdH8X3KoyXXWF8Hbf`.

| When | Theme | Still in the build? |
|---|---|---|
| 09-09 | Cut SLATE back to six things: startup, creation, map, Home, calendar, weather (`62c30ca`) | Yes; it's the base |
| 09-09 | Actor/actress premise, creation and save-slot fixes, race and ethnicity, interests and genres | Race, interests and genres, yes. The title went in the gut and was rebuilt on 09-22 (below). The premise record, no. |
| 09-09 to 09-16 | Jobs, production companies, family land (Sugar Land), family, family business, the lot, film pipeline, casting, the audition room, the performer's side | **No.** Jobs and the eighteen production companies were removed on 09-09 (`0b49d93`, `5267cd4`); the rest went in the gut. |
| 09-10 to 09-16 | Gate tooling: `tools/wired.mjs`, `tools/tics.mjs`, `tools/doc-refs.mjs`, `tools/deciders.mjs`, the voice sweep, `docs/DEPTH.md`, `docs/DRILL-DOWN.md`, `docs/UNBITTEN.md` | Yes |
| 09-09 to 09-15 | Calendar, time and weather: plans you make yourself (`4b7c5d7`), both holidays in a cell (`a5a2a4d`), hourly and weekly sky (`3ba0bd0`), a Monday 5 January 2026 start (`88addcd`). Skip To Event and the holiday data came before this session. | Yes |
| **09-22** | **The gut**, `abd4727`: 141 files, +924/−46,718, schema 80. Removed the attributes engine, film career and family business, and the family, land, house and security. | That is the current base. |
| 09-22 | Post-gut polish: hint lines, card spacing, calendar copy, Title Case, 12 "Nothing" openers reworded (`0cd6f7d`, `5ea11d0`, `1d8c7fc`) | Yes |
| 09-22 | **Performer title from pronouns** (`e011708` schema 81, `43f9730`, `27b758a`) | Yes |
| 09-22 | **Citizenship from place of birth**, second citizenship removed (`70f3df7` schema 82, `4999daa` territories) | Yes |
| 09-22 | **Personality and traits restored**, then review fixes and sleep calibration (`8aedbe5` schema 83, `3c704a8`) | Yes |
| 09-22 | Sleep dialog stops promising bills, messages and other people (`406a5c6`) | Yes |
| 09-22 | **Step renames** to "Dispositions & Traits" and "Interests & Background", the tab row reworked, Review matches (`a93841a`, `36d2cea`) | Yes |
| 09-23 | This handoff (`acf5e10`, corrected in `6c18b6b`), removal of the tracked scratch file `walk-tmp.mjs` (`d0636b8`), and the owner's `CLAUDE.md` brought over from `main`, corrected for this branch (`beda4d9`) | Yes |
| 09-23 | **This branch replaces `main`**, by the owner's decision: merge `4aab498` keeps this tree and records the old `main` as a parent, and a PR carries it in | Yes |
| 09-23 | **Schema 83 → 87** (`20da24e`, and the fixes after review): both pins moved past the old line's 84–86; opening a slot runs `migrate()` whatever the number (`openSlot`); `reputationDriftedAt` joins `SHED`; every old creation draft is dropped. Review then found, and the next commit fixed: Restore Backup on an older backup lost the newer save; the migrated write-back never reached Base44; and the schema-11 pass rewrote titles players typed | Yes |
| 09-23 | **The waking day charged as the clock moves** (`7a373c2`, schema 88, and the review fixes after it): the passage reactor `life.waking` (`Simulation.onPassage`) charges waking hours from `awakeSince` at the debt the person woke with (`wokeWithDebt`), wherever the clock stops; `life.sleep` stamped the wake at bedtime (at the booking since `4bfa0fa`); the rollover keeps only the unattended night, meals and shower; `suggestedSleep` solves for the night that pays the day beside it | Yes |
| 09-23 | **A night nobody chose, slept only when the clock is carried through one** (the night-alone fix `4bfa0fa`, still schema 88): `Simulation.advancingTo` says where the advance in progress will stop; `sleepAlone` gives the night at midnight, or later through the passage reactor `life.night_alone`, with no night since that midnight and before a sound sleeper would wake. It asked for 5.4 h of night ahead and cut the night where the clock stopped, both replaced by the review fixes. A new save starts with `lastSleptAt` at its first moment, and `life.sleep` stamps the wake when the night is booked. The 20 h guard is gone | Yes |
| 09-23 | **What review found before `main`** (the review fixes): the night nobody chose is slept in full and they are up where the clock stops, where the cut had worn 10 of 76 cases down on a daily Tomorrow Morning; it is slept when the clock goes more than an hour into the night, where 5.4 h had lost the night to a skip split by a plan; a short night's shortfall is added past the debt ceiling once, where three-hour nights had reached 191.7 by the ninetieth; the coasting ceiling caps what a night gives, not what they had; the Sleep Debt dial calls an ordinary day's debt the day's | Yes |
| 09-23 | **What the second review found** (`fa24fe4`): a plan in the small hours has them up for it, and the rest of the skip puts them back to bed until the night would have ended (`nightEndsAt`, new in 88) without crediting it twice, where they had stayed up to the next midnight and a nightly plan at 01:05 wore 21 of 76 cases down; the Sleep Debt dial says owed for what a short night left, and its row and provenance stopped calling an ordinary day's debt owed; a new save starts with `wokeWithDebt` at 0; the comments, tests and this file said five things that weren't so | Yes |
| 09-23 | **What the third review found** (`0e80f13`, still schema 88): whether the player is there is judged by how far they sent the clock (`Simulation.advancing`), not by how far past the bedtime it would stop, where a plan on the stroke of one put the night off to one, late and poorer, and a nightly plan at 01:00 wore 27 of 76 cases down; a night a stop in its first hour leaves unpaid is paid when the clock goes on, from its bedtime (`nightOwedFrom`, new in 88); every stop keeps where the night would have ended, the morning included, where a plan at 06:59 had left them better off than no plan; the Sleep dialog says when a sleep would be tonight's night (`sleepStandsForTheNight`); the Sleep Debt dial's provenance says short nights add debt; `Simulation.advancingFor` is gone | Yes |
| 09-23 | **What the fourth review found** (`1f75a13`): a night a stop in its first hour left unpaid stayed owed while the player kept them up, and the next jump paid it whole from midnight, so the hours kept up cost nothing; kept up to 07:30 after a stop at 00:30, nightly, 30 of 76 cases wore down. Moving the clock themselves in it now forfeits it, and the next jump starts a night where they are. Two comments and a test title were corrected | Yes |
| 09-23 | **Paused and merged** (`8cc8d22`, and PR #19, `0216597`): the owner stopped the work here and had it merged into `main` as it stood, to pick up in another session. The review of `1f75a13` was stopped before it reported | Yes |
| 09-23 | **What the fifth review found** (the review of `1f75a13`, re-run on Windows; still schema 88). Four fixes. (1) A Go or Skip It that carries on a skip after a stop in the night's first hour is that skip for the night: the engine is told where the jump it resumes was sent from (`advanceTo`'s `resumes`, `Simulation.advancing().sentFrom`, `AdvanceResult.sentFrom`), where the Go had counted as the player's own hour and forfeited the night, and a nightly skip to 01:30 past a plan at 00:30 wore 9 of 76 cases down. (2) The forfeit charges the time in bed before the stop as time awake, where it had been left neither charged nor paid. (3) Texts that said a sleep chosen in an unpaid night is paid on top were corrected. (4) 66.75 was corrected to 66.65. Tests were added for the owed night through a one-hour sleep and for the forfeit to live play | Yes |
| 09-23 | **The transfer to Account 2** (the commit after `d356640`): `npm ci`, the gate and the build were run again, and this file gained "Start here", the file list since `36d2cea`, the dependency advisories and the `gh` facts. No code changed | Yes |
| 09-24 | **The spring-forward rollover** (Account 2): the rollover re-arms for the first instant of the next calendar date (`startOfNextDay`), where it had added a day to the start of today and kept that day's hour, so the day after a jump at midnight rolled over at one (01:01 in Beirut and Cairo); `instantFromZoned`'s gap walk lands on the end of the gap whichever side its passes stop, where zones at or east of Greenwich had got the reading plus the gap plus a minute; `loadSave` puts back a rollover an earlier build armed late and a night it left owed from 01:01; `migrate()` counts a pre-88 save's waking day from the same midnight. Still schema 88 | Yes |
| 09-24 | **The day's bounds on screen, and the jump day's own night** (Account 2): a bedtime is late from one to five by the clock and an hour or more after the day began, where the first hour of a day whose clocks skipped midnight had read as one in the morning; the Day look, the entry look, `monthGrid` and the plan form take a day's end from `startOfNextDay`, where they added a day or 24 hours to its start; `hoursOn` puts each hour at its own reading on the clock; the week ahead and the weather looks step by calendar date at noon (`noonOf`); the month grid reads a day past each edge for clashes; the stretch look lets an hour run to the next hour listed. Still schema 88 | Yes |
| 09-24 | **The Windows hygiene commit** (Account 2): `.gitattributes` (`* text=auto eol=lf`); the browser tools launch through `tools/browser.mjs`, which falls back to Playwright's own Chromium; `drill.mjs` writes to `os.tmpdir()`; `npm run audit` runs `tools/audit.mjs` on Vite's `preview()`; `cohesion-walk/` is ignored. No game code changed | Yes |
| 09-24 | **The stale words** (Account 2): the docs, the README, comments and a test header that said what was no longer so; the plural-check allowances for deleted files; the dead `names.ts` and `Logo`; the Industry and Jobs figures on the place card written "/100", with the test asking for both forms; the weather decider's sweep on the eight cities it names, where five had dropped out without a word; the smoke test's schema and its `.env`; `package.json`'s version | Yes |

The owner's instructions that shaped the gut and what came after, verbatim from the conversation (no commit records them):
- "Every single thing, even everything casting and audition. I want it all gone."
- "The land, house, security, and family goes too. Want it all gone."
- "bring back the pronouns engine that whichever you clicked it would set whether you was an actor or actress."
- "get rid of the dual citizenship and just keep citizenship … whatever you put your place of birth it generates what country citizenship you're under"
- "bring back the full personality page. Should be before the 'Who You Are' page."
- "'Dispositions & Traits' and the next page whichever better title fits it." That became "Interests & Background".

---

## 5. Architecture now

### Layout (`src/`)

- **`app/`**:
  - `SlateApp.tsx` is the phase router (startup → saves → creation → playing).
  - `game-context.tsx` bridges the simulation to React: the live tick every 1 s, autosave every 45 s and on `pagehide`, and the `h`/`c` keys. Its `standingAt` keeps what a stop broke off, `sentFrom` included, and the Go and Skip It in `ui/shell/TimeControls.tsx` hand that back to `advanceTo`, so carrying on is the same jump.
- **`engine/core/`**:
  - `simulation.ts` is the kernel. `advanceTo`/`advanceBy` is the only way the clock moves, and `onPassage` reactors run on each stretch it crosses. `advancing` says where the advance in progress started, where it was asked to go, and where the jump it carries on was sent from (`sentFrom`, set by `advanceTo`'s `resumes`); `advancingTo` says where it will stop.
  - Also here: `time.ts` (with `startOfNextDay`, the first instant of the next calendar date, which the rollover is armed for and every screen ends a day at, and `noonOf`, noon on a date some days on, for stepping by date), `ledger.ts` (double-entry), `money.ts` (integer cents), `rng.ts` (seeded), `ids.ts`, `scheduler.ts`, `events.ts`, `text.ts` (Title Case and `plural`), and `deciders.ts`.
  - `performer.ts` came back after the gut, rewritten.
- **`engine/domain/`**:
  - `model.ts` holds every save type.
  - `citizenship.ts` was **rewritten**.
- **`engine/systems/`**:
  - `life.ts`: wellbeing, the waking day charged as the clock moves (`life.waking`), sleep and the day rollover.
  - `personality.ts`: **new**.
  - `weather.ts`: the only RNG draw, registered as the decider `weather.day` in `src/engine/decided.ts`. Any new draw must be registered there too.
  - `finance.ts`: `netWorth`.
- **`engine/world/`**:
  - `bootstrap.ts`: `NewSaveConfig`, `defaultConfig`, `createUniverse`.
  - `calendar.ts`, `plans.ts` (`calendar.*` commands), `world.ts`, `place.ts`.
- **`engine/content/`**:
  - The gazetteer: `geography.ts`, with `countryOfPlace` **new**, and the generated `world-data.ts`.
  - `holidays.ts` fetches `public/holidays/<id>.tsv`.
  - `interests.ts` holds 43 craft interests, 20 general interests and 149 genres.
  - `personality-traits.ts` was **restored**.
- **`engine/persistence/`**: `local.ts` (localStorage, gzipped when it can), `base44.ts` (`resolveAdapter`), `adapter.ts`.
- **`engine/index.ts`**: `registerAllSystems`, `createSave`, `loadSave`, `migrate`, `openSlot`, `validateUniverse`, `refreshMeta`.
- **`ui/`**:
  - `creation/`: `CharacterCreation.tsx`, `LocationPicker.tsx`, `WorldMap.tsx`, `PortraitPicker.tsx`.
  - `screens/Home.tsx`.
  - `shell/`: `GameShell.tsx`, `TimeControls.tsx`.
  - `workspaces/CalendarWorkspace.tsx`, with the month grid's cells and the plan form's half hours (`openSlots`, `firstFreeSlot`, `canPlan`) in `workspaces/cell.ts`.
  - `looks/`: the drill-down system, with 23 `defineLook` kinds.
- **`styles/app.css`**: the one design system.

### The person

`Person` in `src/engine/domain/model.ts` holds:
- Identity: names, `pronouns`, `performerTitle: 'actor' | 'actress'`, `birthInstant`.
- Place: `homeRegionId` (the birth city), `citizenshipId` (derived) and `currentLocationId`.
- Character: `personality` (7 axes), `personalityTraits` (at most 4), `interests`, `genres` and `background`.
- State: `wellbeing`, with energy, stress, sleepDebt, morale, condition, fitness, nourishment and hygiene.
- Sleep record: `lastSleptAt` (the last night: a chosen night's wake, stamped when it is booked; a night nobody chose, its bedtime; a new save, its first moment), `awakeSince` (when the waking day began), `wokeWithDebt` (the sleep debt they woke with, 0 on a new save), `nightEndsAt` (where a night nobody chose would have ended, while the clock has stopped in it) and `nightOwedFrom` (that night's bedtime, while a stop in its first hour has left it unpaid); the last four since schema 88.

### Saving and migration

- **Local keys:** `slate.save.{n}`, `slate.backup.{n}` (the previous payload, kept on every write), `slate.draft.{n}` and `slate.favourites`.
- **Loading** (`openSlot` in `src/engine/index.ts`, called by `src/ui/saves/SaveSlots.tsx`):
  - A save newer than 88 is refused.
  - Every other save runs through `migrate()`, whatever its number. One that changed is checkpointed and written back, unless it came out of the backup: restoring has already swapped the two, and the first autosave writes it on this device. On Base44 the restore itself doesn't take (§10).
  - `SaveSlots` then runs `validateUniverse()`.
  - The schema-11 Title Case pass is the one step that goes by the number (`from < 11`), because it can't tell an old label from a title a player typed.
- **How `migrate()` works** (`src/engine/index.ts`):
  - The passes work from the **shape** of the data, not the version number, except the schema-11 Title Case pass.
  - `SHED` lists 19 removed person keys, from `attributes` through `reputationDriftedAt`.
  - Then it fills a missing title. A save from 72 to 79 still has one and keeps it. A save brought up to 80 from those lost it from the person but kept the premise record, so the player's title, a they/them pick included, is read back from there. Otherwise, as for a save created at 80 or one from before 72, the pronouns decide, and they/them comes back an actor.
  - Then it cleans or fills the personality, re-derives citizenship from the place of birth, gives anybody without `awakeSince` the next local midnight, and sets `careerLabel` to the title.
- **`loadSave`** (`src/engine/index.ts`) puts back what a build before the spring-forward fix left late. A pending rollover up to 61 minutes past the start of its day goes back to that start, or to now when the save is already past it; one further off, as a change in a zone's rules between browsers could leave it, runs where it was armed. A night owed from a minute past the start of its day, where the save also ran that day's rollover (Beirut and Cairo's 01:01 in `8cec213`), is owed from that start; a night this build owes from such a minute holds no such rollover and is left alone. Then it re-arms a rollover or a world tick that has fallen off, the rollover at `startOfNextDay`.
- **Creation drafts** are stamped `DRAFT_BUILD = "${APP_VERSION}/${SAVE_SCHEMA_VERSION}"`. A draft from another build is discarded.
- **Schema history.** The comment above `SAVE_SCHEMA_VERSION` (`model.ts:413-446`) covers 80 to 88:
  - 80: the gut.
  - 81: the performer title comes back.
  - 82: one citizenship, from the place of birth.
  - 83: personality and traits come back.
  - 87: a save from this line gains only the new number. 84 to 86 are skipped because the line this one replaced used 83 to 86 (§0.4). A save from that line sheds its old person fields, `reputationDriftedAt` included, and is given an empty history and, where it lacks them, the four personality axes that line dropped on 09-17.
  - 88: every person gains `awakeSince`, when their waking day began, because the waking day is charged as the clock moves now, not at midnight. A save from before 88 had its last midnight charge the whole day ahead, so `migrate()` sets `awakeSince` to the next local midnight and the rest of that day isn't charged twice. Measured on real 87 saves loaded at 15:00: the rest of the day ends on the same dials as at 87.
  - The earlier bumps come from git (`git log -G'SAVE_SCHEMA_VERSION = ' -- src/engine/domain/model.ts`): 72 premise, 73 heritage/height/weight dropped, 74 race, 75 interests, 76 family, 77 business, 78 attribute base, 79 six dead fields.
- **Server guard:** `base44/shared/guard.js` runs on Deno and can't import the engine. `tests/server-guards.test.ts` and `tests/base44-contract.test.ts` fail if its version and the engine's differ.

### Personality engine

- **Traits** (`src/engine/content/personality-traits.ts`):
  - 35 traits in 6 groups: Temperament 6, Habits 6, Body 6, Money 4, People 8, Mind 5.
  - Conflicts are written both ways.
  - `MAX_PERSONALITY_TRAITS = 4`.
  - 31 traits carry knob multipliers. The four Money traits carry none.
- **Knobs** (`src/engine/systems/personality.ts`):
  - `personalityOf(person, knob) = bend(personalityModifier(traits, knob) × axisModifier(personality, knob), KNOB_LIMITS[knob])`.
  - `bend` is a soft limit, a tanh curve in log space. A hard clamp had silenced the sliders once traits reached the limit.
  - `KNOB_LIMITS`: stressGain 0.5–1.8, stressRecovery 0.6–1.5, sleepQuality 0.75–1.25, energyRecovery 0.8–1.25, hygieneDrift 0.75–1.35, moraleSwing 0.65–1.35.
- **Axes:**
  - lean = clamp((v − 50) / 45, −1, 1).
  - stressGain = 1 − steady·0.3 + driven·0.15.
  - stressRecovery = 1 + steady·0.3.
  - sleepQuality and energyRecovery = 1 + ordered·0.1.
  - "Steady" is emotional stability, "driven" is ambition and "ordered" is conscientiousness.
  - The defaults are 55 on every axis, except ambition 60 and risk tolerance 50. Sliders run 5–95.
- **Axes that don't move anything:** openness, extraversion, agreeableness and risk tolerance. Openness waits on travel; the other three wait on other people. The creation screen says so, and `docs/UNWIRED.json` counts them.

### Citizenship and title

- **Citizenship:**
  - `citizenshipFor(birthplaceId) = TERRITORY_CITIZENSHIP[countryOfPlace(id)] ?? countryOfPlace(id)`.
  - 51 territories map to their sovereign state; for example, Puerto Rico to the US, Réunion to France and Hong Kong to China.
  - Taiwan, Kosovo, Palestine and Western Sahara are left as themselves.
  - The UK's id is `uk`.
  - `createUniverse` throws on a birthplace that belongs to no country.
- **Title:**
  - `settledTitle(pronouns)`: he means actor, she means actress, anything else gives undefined.
  - Home and the rail read it from `player.performerTitle`. The slot card reads it through `meta.careerLabel`. No code branches on it yet.

### Sleep and energy (`src/engine/systems/life.ts`)

- **Waking drain** is 3.0 energy an hour, more with sleep debt. It's charged as the clock moves, not at midnight:
  - `life.waking` is a passage reactor (`Simulation.onPassage`, `src/engine/core/simulation.ts`). It charges every person for each stretch the clock crosses, from their `awakeSince`, wherever `advanceTo` stops: before each due item, on an early stop for the player, and at the end. Live ticks, sleep and Skip to Event all go through it.
  - The drain is set by the debt the person woke with, `wokeWithDebt`, written at every wake. That's what the old lump charged, so a day on autopilot costs what it did, and a debt that reaches sixty while awake drains the same by the second as in one jump. Waking holds debt at sixty and never lowers it; a night under six hours can leave more, by at most its own shortfall's worth, (6 − h) × 1.35. Short nights added it on top every time once nothing pulled the debt back to 60 (the midnight lump had, then the first waking second until `14c1666`), and three-hour nights reached 191.7 by the ninetieth. A save from before 88 works the waking debt out from the debt now until its first wake.
  - Running on empty, hunger and stress over 75 are each charged only for the hours actually spent there. So 16 h as 57,600 one-second ticks and as one jump end on the same dials, and a day saved and loaded halfway ends where one played straight through does. Ticks and a jump parted over debt that reached 60 while awake until `14c1666`; now only a save from before 88 does, until its first wake. And by design a jump of more than an hour into a night puts them to bed from its start, where ticks never do.
  - A 16 h day from a rested wake costs 48 energy and 5.4 h of debt: energy reads 97 at 08:00, 85 at 12:00, 73 at 16:00, 61 at 20:00 and 52 at 23:00, and readiness falls from 97 to 57.
- **Sleep** (`life.sleep`) puts the night on record when it is booked: `lastSleptAt` is set to the wake first, so a midnight between the booking and the bedtime, inside the night or on its wake sees a night already chosen and gives no night nobody chose on top. It reads the night's quality at the hour it starts and sets `awakeSince` to the wake before it advances the clock, so nothing is charged during the night. For a chosen night `lastSleptAt` is the wake, never the bedtime.
- **A night's quality** = (0.82 − stress loss) × sleepQuality knob, minus 0.08 for a bedtime from 01:00 to 04:59 by the clock and an hour or more after the day began, clamped to 0.28–1. The second half matters only on a day whose clocks skip midnight, where the clock reads one from the day's first instant (the day's bounds fix).
- **`suggestedSleep`** solves for the night that pays the day beside it: with p = `A_NORMAL_NIGHT` (8 × 0.82) / 16, hours = (24 × p + owed × 0.1) / (quality × energyRecovery × `recoveryFactorAt(age)` + p):
  - owed is the debt past a normal day's, `A_NORMAL_DAYS_DEBT` = 16 × 0.34 = 5.44 h. After an ordinary day the debt on the books at bedtime doesn't stretch the night, and "You're carrying real sleep debt" means owed over 8.
  - A longer night means a shorter day to pay for. The old formula divided `A_NORMAL_NIGHT` by the night's rate against a fixed 24 h day; it told somebody born 1944 fourteen hours and "Not even fourteen hours makes up a whole day", and fourteen put back nearly three times the ten awake beside them. Solved, the suggested night puts back 1.83 to 1.91 times the day beside it at every age tested (25, 60, 70, 81).
  - Clamped to 6–14 h (`LONGEST_NIGHT`) and rounded to the half hour. When a commitment is sooner than that plus 1.5 h, it offers the time available minus 1.5 h (never under 3 h) and names the commitment.
  - With a commitment booked ahead, `sleepReason` names the biggest shortfall: debt, stress, depth, late, restores or age. Past 14 h it says so ("Not even fourteen hours …").
  - With a commitment booked, stress 0 and no debt, a default character is told 8 hours and "A normal night.". The same at 23:30 after an ordinary day, with 5.6 h of that day's debt on the books.
  - Told at 23:00 for a default character: 8 h at 25, 9 at 60, 10 at 70, 11.5 at 81 (at `ed0cab7`: 8, 9.5, 11.5 and 14). At 01:00: 8.5 h (10 at `ed0cab7`).
  - With nothing on the calendar, which is how a new save starts, the reason is always "Your calendar’s clear, so sleep as long as you need." unless the need passes 14 h.
- **`unattendedNight`**, the night slept when the player doesn't choose one:
  - sound = clamp(7.8 − stress × 0.012, 5.4, 8.4).
  - hours = sound / √(min(1, sleepQuality) × min(1, energyRecovery)), clamped to 5.4–10.
  - The night runs at quality `sleepQuality × 0.95`, read at its bedtime, and it's paid in full: it puts back the whole night's hours. `awakeSince` is set to bedtime + sound, so the waking day is charged from a sound sleeper's wake, or to where the clock stops if that's sooner, so the player never comes back to them asleep. `4bfa0fa` cut what the night put back to the hours the clock had carried them, and the seven o'clock stop of a daily Tomorrow Morning wore 10 of the 76 cases down (31 single traits, 6 slider extremes and nobody in particular, at 25 and at 60): a light sleeper at 25 ended the year at condition 35.8 and morale 0. Paid in full it's 76.4 and 100, as at 87. The coasting ceiling of 74 caps what the night gives; somebody already over it keeps what they had.
  - Whether it's slept is `sleepAlone`'s call, made on how far the clock was sent rather than on hours since the last night. It's slept when somebody is awake at the bedtime, has had no night since that night's midnight (`lastSleptAt`), the bedtime is before a sound sleeper would have woken, and the clock was sent more than an hour (`LONGEST_STEP_WITH_THE_PLAYER`), which `Simulation.advancing` says: where the advance in progress started and where it was asked to go. From the bedtime they're in bed and charged nothing. The night is paid once the clock has carried them more than an hour into it, which `Simulation.advancingTo` says: where the advance will stop, its target or the first thing before it that needs the player. A stop in the first hour leaves it unpaid (`nightOwedFrom`), and it's paid when the clock goes on, from its bedtime and ahead of the day's meals as the rollover pays it. A player who keeps them up in it, moving the clock themselves (Play, One Hour, or a fresh Next Event of an hour or less), forfeits it. The time in bed before the stop is charged as time awake, and the next jump starts a night where they are, as for a player who stayed up with them from the start. `0e80f13` kept it owed through that and paid it whole at the next jump, so hours kept up cost nothing: kept up to 07:30 after a stop at 00:30, nightly, 30 of 76 cases wore down. `1f75a13` forfeited it, 0 of 76 (worst 73.2, against 73.3 with no plan), but left the time in bed before the stop neither charged nor paid. That read the same as no stop only where the next night reached the 74 ceiling. On a save played on autopilot (Tomorrow Morning ×5), kept up to 06:30 after a stop at 00:30, it read 62.53 at 18:00, where no stop read 60.86. Charged, 0 of 76 differ from no stop in any dial, on a rested save or on autopilot, after a stop at 00:30 or 00:59. Kept up to 07:30 nightly after a stop at 00:30, 0 of 76 wear down (worst 73.3, as with no stop).
  - **Carrying on is the same jump.** A Go or Skip It on a stop in the night's first hour carries on the skip it broke off. The UI passes `advanceTo` where that skip was sent from (`resumes`), and `Simulation.advancing` reports it as `sentFrom`. In a night not yet paid, `sleepAlone` treats such a move, when the skip was sent more than an hour, as that skip for the night: it's paid if the move carries them more than an hour past the bedtime, and stays owed if not. The stretch carried on is still the player's own, and they're up and charged for it, as after a stop later in the night. At `1f75a13` a Go of an hour or less counted as the player's own move and forfeited the night, and the night restarted at the Go's target, late. Skip To Event from 23:30 to 01:30 with a plan at 00:30, then Go, read 47.90 energy, condition 89.39, morale 65.09, awake 09:18 at 18:00; nightly for a year, 9 of 76 cases wore down, where `0e80f13` and `ed0cab7` wore none. Now it reads 40.40 energy, condition 89.92, morale 66.04, awake 07:48: the no-plan night, less the Go's hour (no plan reads 43.40, 89.92, 66.04, 07:48). Nightly for a year, 0 of 76 wear down with the plan at 00:00, 00:30 or 01:00 (worst 73.6, 73.9, 73.7; no plan 73.6). A Go to within the first hour of the night (a skip to 00:50 stopped at 00:20) leaves it owed.
  - It was tried two ways first. `4bfa0fa` asked for 5.4 h of night ahead, the floor `unattendedNight` clamps to and never reaches (the shortest sound night is 6.6 h); a skip that stopped for a plan in the small hours came in two pieces shorter than that and neither was slept, which left somebody on autopilot at energy 4.0 by seven. Then `bd5b2ef` and `fa24fe4` asked for more than an hour between the bedtime and where the clock would stop; a skip that stopped for a plan on the stroke of one, which the Calendar books, left them up with the player for the first hour of the night, and the night came at one, late and poorer: a nightly plan at 01:00 wore 27 of 76 cases down, gone on to with Go or with Next Event alike.
  - So a player who is there keeps the character up with them: live play moves the clock a second a tick, and never more than half an hour even paying back a laptop that was shut, and One Hour on the Advance menu moves it an hour. Tomorrow Morning, One Week and Skip To Event send it through the night, and the night is slept, up to anything that stops the clock on the way, where they're up for it. Where the night would have ended is kept at every stop (`nightEndsAt`), the morning a skip was sent to as well as a plan, and whenever the clock is sent on more than an hour before then they're back in bed until then, and the night isn't paid twice. On a skip to 07:00 from a rested 23:30, a plan anywhere from 00:00 to 05:00 reads as no plan does, 74.0 at 07:00 and 25.4 at 23:59:59, and a year of them ends exactly where a year without them does. A plan in the last hour before the skip's target leaves an hour or less to go on, which is the player's, and costs that hour: at 06:00, 71.0 and 22.4. Before, the stop's night was the night slept and a plan at 01:01 read 56.0 and 5.1 (`bd5b2ef`); then the morning stop was left out, and a plan at 06:59 read 25.4 where no plan read 23.0 (`fa24fe4`).
  - A sleep the player chooses in the middle of such a night: in a night already paid, it's paid on top, and the clock still puts them back to bed after it. An hour at 01:30 after a plan left them at 83.7 energy by seven, over the 74 the night alone stops at. In a night not yet paid, the night is kept owed through the sleep and paid after it from its bedtime, and the 74 ceiling keeps the more of the two, not both. So a nap too short to pass 74 only costs: on a rested save, after a stop at 00:30 on a skip to 07:00, then sent on to 07:00, no nap, a 1 h nap and a 2 h nap all read 74.00, with the 1 h nap costing debt 1.35, condition (86.17) and morale (59.36), and a 3 h nap reads 78.75. This file, `life.ts` and a test comment said "paid on top" for both until the fifth review's fixes; the engine was left as it was. Paying the owed night when the nap starts was considered and rejected, because a player could then keep them up and keep the night, which is what `1f75a13` removed.
  - A chosen sleep is the night of the day it ends in, so a short one, under six hours, that ends in the small hours of a night not yet slept is that night, and they're up from its end. `sleepStandsForTheNight` says so, and the Sleep dialog shows it: its own suggestion, three hours at 23:30 before a call at 03:00, left energy 10.9 and debt 13.15 by 23:00 the next day, where sending the clock on instead left 28.4 and 5.17. Asked first of anything shorter than the night nobody chose, it said so of the dialog's own full night for good sleepers (7 or 7.5 h against 7.65); under six hours, it says so of none of 570 suggestions without a commitment (38 cases, born 2001, 1966 and 1944, to bed from 22:00 to 02:00). A sleep chosen inside a night nobody chose that is under way isn't said to be one. Sent on after it, that night is paid: on top of the sleep if it was paid already, and after it, keeping the more of the two, if not. Kept up by the player after it, a night not yet paid is forfeit and the sleep was the night, which the dialog can't know in advance.
  - The midnight rollover gives the night at midnight, before the meals and the shower, and charges no waking hours. The passage reactor `life.night_alone` gives it later, from wherever the clock was, to somebody the player stayed up with past midnight and then skipped, puts somebody back to bed when the clock goes on from a stop in the night, pays a night a stop in its first hour left unpaid, and forfeits one to a player who keeps them up in it. It runs before `life.waking`, so the hours the night covers aren't charged as awake.


### Looking after yourself (`life.look_after`, same file)

- Four actions besides sleep, on a **Look After Yourself ▾** menu between Sleep and Advance (`src/ui/shell/TimeControls.tsx`). Each moves the clock by its own time through `advanceTo`, which charges it as waking, and pays out after:
  - **Eat A Meal**, 40 minutes: nourishment +50 (to 100 at most); morale + 0.04 × what was eaten × moraleSwing. Refused at nourishment 90 or more.
  - **Shower**, 20 minutes: hygiene to 100; stress − 0.1 × what was washed. Refused at hygiene 95 or more.
  - **Work Out**, 60 minutes: fitness + 0.6 × (0.4 + 0.8 × readiness/100), 0.6 at readiness 75, never past `ceilingAt(age).fitness` and never pulled down to it; energy − 10 × (1.5 − fitness/100), 10 at fitness 50, nourishment −6, hygiene − 20 × hygieneDrift, stress − 8 × stressRecovery, morale + 3 × moraleSwing. Refused under energy 25.
  - **Unwind**, 60 minutes: stress − 10 × stressRecovery, morale + 3 × moraleSwing.
- Anything that needs the player inside the window refuses the action outright, with the thing's name and time. Sleep only warns, because a night is a choice; twenty minutes in the shower that misses a call is only a mistake. `lookAfterRefusal` is the one answer the menu and the command both use, so the menu greys out and explains what the command would refuse.
- The morning top-ups (nourishment to 76, hygiene to 82) stay as the floor a coasted day gets; these are how a player does better. No save field was added, the schema stays at 88, and nothing draws a random number. A save nobody acts on is unchanged: the calibration years pass as before.
- On a fresh save at 07:30, Work Out took the clock to 08:30 and moved energy 82 → 69, stress 18 → 9 and readiness 82 → 74, in the browser (at the looking-after commit).

**What each dial decides** (the dials commit; `tests/wellbeing-bites.test.ts`). Before it, condition was read by nothing past its own dial, morale and condition sat at 100 and 99.7 on any life with decent nights, and fitness fell to 0 on autopilot, so the actions above moved dials that couldn't move:
- **Fitness** falls 0.18 a day only down to `EVERYDAY_FITNESS` (35). It sets how far a night mends condition, `mendsTo` = min(age ceiling, 70 + 0.6 × fitness): 91 at 35, 100 at 50, where a new character starts. A night doesn't pull a body above that down to it. And it sets a workout's energy cost (`workoutCosts`).
- **Condition** is read by readiness (× 0.7 to 1.0), sets how much energy a night puts back (× 0.8 to 1.0, against `mendsTo`, not against 100: against 100 it charged age twice and wore a light sleeper of sixty with a small-hours plan from 87.0 to 78.4), and sets where morale settles.
- **Morale** sets how much stress a night clears (× 0.75 to 1.15). Each night brings it back toward `moraleSettlesAt` = 40 + 45 × condition over the age's ceiling, 35% of the way for eight hours and less for less. A flat 80 held a ruined body at 70.5; raw condition put everybody of 81 at 76 on the best nights.
- **Hygiene** under 50 costs 0.4 morale an hour × moraleSwing, counted like hunger, so ticks and a jump agree.
- **Readiness** sets what a workout builds (`workoutBuilds`).
- A night reads condition, morale and fitness as they were at bedtime (`applySleep`'s `bedtime`), so a chosen night across midnight pays the same as the night measured from bed; the unattended night still comes after midnight's drift (`settleTheBody`), so a night paid at midnight and one paid at the next stop agree.
- Played, same save: a year on autopilot ends at fitness 35, condition 91, morale 83.8, readiness 57.5 (before: 0, 99.7, 100, 61.7). Half a year of eight-hour nights: 35, 91, 85.9, 58.9. The same half year eating twice, showering, training and unwinding daily: 99.3, 99.7, 100, 73.3, with no action refused. Five-hour nights for three months: condition 0 and morale 28.2 (it was 0 before; a flat 80 held it at 70.5).


### Interests and background (the background commit)

- **The rule, narrowed by the owner on 2026-09-24.** An interest or a genre may change how much somebody gets out of doing a thing, never how good they are at anything. Before, `tests/cohesion.test.ts` forbade any engine read of either. Now `src/engine/systems/enjoyment.ts` is the one file allowed to read the interests, nothing may read the genres, and the same test holds that loving an action moves only morale and stress: never fitness, energy, food, hygiene, debt or condition.
- **What it reads.** Cooking goes with Eat A Meal; Fitness and Sport with Work Out; Art, Design, Film, Games, History, Music, Photography, Technology, Television, Theater and Writing with Unwind. Loved, the hour gives 1.5 times the mood (`LOVED_MOOD`) and, for Work Out and Unwind, 1.25 times the stress relief (`LOVED_RELIEF`). The menu says so under the action. The default interests are Film and Television, so a new character loves unwinding. Animals, Cars, Fashion, Nature, Politics, Travel and every craft go with nothing yet, and the genres wait for the film career.
- **Before Acting.** The owner chose structured choices over the free text. What somebody did before acting (`src/engine/content/backgrounds.ts`, twelve answers, Office Work 40 to Competitive Sport 80) is the fitness they start with, held to the age's ceiling. It is not a skill. It fades 0.18 a day to the everyday 35 like any fitness: an athlete left alone keeps 58.4 after 120 days against an office worker's 35, with condition over 5 higher, and both are at 35 a year on. The default, Straight From School, is 50, what every character started at before, so a default save is unchanged. The free text stays beside it as In Your Own Words, said back and deciding nothing. `beforeActing` is an optional field on the person: no schema change, since neither validation nor the Base44 guard checks person fields, and a save from before it has none and says nothing.

### Money (schema 89; `5e60ce7`, `9a12c11`, `1180a04`)

The owner asked for cost of living, the credit score and money to count, left the design to Claude, and said mid-way that SLATE should reflect the real world wherever the character is (a pinned memory on Account 2). Until these, nothing earned or spent: the balances a save started with were the balances it kept.

- **Currency.** A save keeps its money in the currency of the country it starts in (`SaveMeta.currency`, `currencyFor`), as a real account is held: a Mosfellsbær save is in krónur. The starting-money profiles are written in euros and converted at SLATE's rates (`wealthIn`): Scraping is 186,000 kr in checking. Where SLATE has no rate for a currency the save stays in euros and the page says why. Every figure is written with the currency its caller passes (`formatMoney(cents, currency)`); a module-wide current currency would have been shared state between saves, which `SaveUniverse` forbids. A save from before 89 keeps its euros.
- **The day job** (`systems/work.ts`, `content/jobs.ts`). Every character has the survival job their Before Acting answer leads to (café work for Straight From School, construction for Trades, twelve in all), unless they untick Keep A Day Job on Starting Point. Shifts are on the calendar two weeks ahead, every one starting at 09:00 or later. The clock stops at a shift; Go works it and Call In Sick (`calendar.skip`) doesn't. Run over by autopilot it is worked if they are awake and in town; asleep or away it is missed. Three missed in four weeks and they are let go, and the same work is found again three weeks later. A worked hour costs 1 energy and 0.5 stress (times stressGain) beyond the hour, and looking after yourself is refused on shift. The rota runs inside the day rollover (an `onEvent` reactor): as its own item it was a stop in the night and moved where an unattended night was counted from.
- **Wages** (`content/wages.ts`). The real statutory adult minimum where they work, researched and sourced on 2026-09-24, with its 2026 dates: 15 countries, 20 US states and New York City, 3 provinces and Tokyo. Tokyo's rate is keyed to JP-40, the gazetteer's Tokyo (§5, What was left open). Iceland has no statute, so the lowest Efling–SA agreement band (2,746.73 kr, 2,748.39 from April) is used and marked as an agreement. Italy, the Emirates and everywhere without a figure get an estimate from the town's cost of living, marked as one. Each job pays a premium over the floor (SLATE's estimate). Tips are not modeled.
- **Pay.** Tax is withheld through the tax engine, whose brackets are in US dollars, so the year's pay is converted to read the effective rate. Payday follows the country's practice (`payCycleFor`): every other Friday in the US and Canada, fortnightly Thursdays in Australia and New Zealand, the quincena in Mexico, the 25th in Japan and Korea, the 1st in Iceland, the last day elsewhere. Iceland and Japan pay for the month before, so a shift on the 1st waits a month (`periodEnd`).
- **Living costs** (`systems/household.ts`). A room in a shared flat (the default) or a place of their own. Rent and bills fall due at 20:00 on the 1st, after a same-day payday; at 09:00 they went on the card eight hours before an Icelandic wage. Food is bought with each day's meals, with the town's sales tax on groceries. Money comes out of checking, then the card, and rent and bills nobody can pay are owed to the landlord (a loan account, "Rent And Bills Owed") and repaid from the first money in. A day's food nobody can pay for is eaten thin, to nourishment 40 rather than 76. At first it was nothing, and a café worker on autopilot fell to condition 2.1 within the year. Owing, being overdrawn or a card at 90% of its limit costs 4 stress and 2 morale (times the knobs) every day. Nobody is evicted.
- **Rent** (`content/rents.ts`). Published figures for 19 places, each with its measure, period and source: HMS for Reykjavík and the capital region, HUD Fair Market Rents and SpareRoom rooms for New York and Los Angeles, ONS for London, Statistics Canada, NSW and Victoria, RTB, IBB, OLAP, idealista, Agenzia Entrate, At Home, and others. Other towns in the same country are the atlas scaled by how far it was off there, and a country with none keeps the atlas's estimate. The page says which. A room is the published room rent, or 55% of a one-bedroom. The atlas had put a one-bedroom in Mosfellsbær at $3,424, near its New York figure.
- **The card and the record** (`systems/credit.ts`). A statement on the 20th, the payment due on the 15th after it, the grace period kept by paying in full, a month's interest on a balance carried, and below the minimum (the larger of $25 and 2%) a $32 fee and 50 off the record. The record is a score on the US scale, kept as `person.credit` (not `creditScore`, which `migrate` sheds). It rises 3 a month on time, falls for use over 30%, lateness and rent owed, and prices the card at each statement (19.99% to 29.99%). It is shown as a number in the US and Canada and as a word elsewhere. Autopay clears the whole statement by default: on the minimum, a café worker ended the year with 931,000 kr in checking and 126,000 on the card at 28%. Home's money panel pays the card (`finance.pay_card`) and sets autopay (`finance.set_autopay`).
- **The money traits.** Frugal (0.85), Spender (1.25) and Generous (1.1) move what food costs (the `spending` knob). Keeps Accounts is about what other people owe, and waits for them.
- **Starting Point** has a Month By Month card: where they sleep, Keep A Day Job, take-home pay, rent and bills, food, what's left, and what is published and what is estimated, all from the functions the game runs (`costsAt`, `wageAt`, `withholdingAt`).
- **Measured on autopilot, a year each.** A café worker in a Mosfellsbær room keeps about 80,000 kr a month. With a place of their own they run 33,000 short, and the record falls to 300 with morale near 42. An LA room on California's minimum is $69 a month short. A London room is £192 short, and broke by month nine. A working year for every single trait and slider at 25 and 60 (café job, a room) measured, before rent existed, lowest condition 75.8, morale 78.9 and stress 16.0, and is barred at 72, 76 and 20.
- **Tests that isolate something else** use a character with no day job and, where money would decide it instead, inherited money that pays every bill: the personality calibration (`build`), the looking-after and wellbeing careers, and the calendar and day-bounds tests, each saying why. With the café job, four personality bars failed by a point or less (morale 78.8 against 80 at sixty). With rent and no job, Scraping ran out and the years fell apart for money rather than temperament.
- **Older saves** are given the default job, a room and a record at 650 on the way in, with rota, payday, rent and statement armed on load (`armWork`, `armHousehold`, `armCredit`), once.

### What was left open (the five-fixes commit)

The owner asked for the five open items after the money system to be fixed.

- **Eviction** (`systems/household.ts`). Owing two months' rent brings a notice to pay or quit: thirty days to get it under a month's. That clears it; still over when it runs out, they're evicted. The deposit goes against the debt, the record loses 60, and they sleep on a friend's sofa: no rent, and nights 0.08 worse, as a late bedtime is, with the Sleep dialog giving the sofa as its own reason. Left to themselves they take a room once checking holds the deposit, the rest of the month and a month's food.
- **Moving** (`home.move`, on Home's Work And Home panel). A deposit of a month's rent, or two for a record under 620, capped at five weeks in Britain by the Tenant Fees Act 2019, plus the rest of this month's rent, all from checking. The old deposit comes back less what's owed. The deposit is an escrow account, "Deposit Held".
- **Hours** (`work.extra_shift`, `work.set_hours`). An extra shift on the first day this week not already worked, one at a time. Full-time is five eight-hour days starting with the job's own, done by 23:00, from a week on; the week already promised stands. Withholding reads the bigger year.
- **The record** now also sets the card's limit, raised a fifth at a six-monthly review for 700 with nothing late in a year and cut to 70% (never under what's owed) by a late payment, and the landlord's deposit.
- **Tips** (`tipsPerHour` in `content/jobs.ts`) where the custom is to tip: bar and restaurant work $10 an hour in the US, 7 CAD, 30 MXN, and a little in Britain, Ireland, Australia and New Zealand; a café counter less; nothing in Iceland, Japan, Korea or most of Europe. Paid in cash at the end of the shift (`work.tips`). SLATE's estimates of the custom.
- **Tokyo.** The money handoff said the gazetteer filed Tokyo under Fukuoka's region code. It didn't: the gazetteer numbers Japan's prefectures as GeoNames does, alphabetically, and 40 is Tokyo there. The mistake was the wage table's, which had keyed Tokyo's rate to JP-13, Tokyo's ISO number and the gazetteer's Hyōgo, so Hyōgo was paid Tokyo's rate. It keys JP-40 now, and a test holds Hyōgo at the national average.
- **Two screens that disagreed with the game**, found in the full-page walk after it. Home's Where You Are card and the place page printed the atlas's raw rent, "Rent about 473K kr/mo" for Mosfellsbær, while the game charged from the published 205,000. They read `rentAt` now. And Starting Point and Review printed the credit score as a number in Iceland, where Home says a word; all three follow `scoreIsANumberIn` now, under the label Credit Record.

### The cohesion pass (the owner: "make sure everything from starting screen to what's on the main game reads, bites, and … makes cohesively and logical sense")

Two additions, then an audit of every screen against the engine, by a background agent reading the code, and every finding fixed.

- **Citizenship decides the right to work** (`mayWorkIn` in `domain/citizenship.ts`): one's own country or its territories, the EEA and Switzerland, the UK and Ireland, Australia and New Zealand. Anywhere else, no day job: Starting Point says so and disables it, and Look For A Day Job refuses with the reason. It was read by nothing.
- **Risk tolerance over 65 starts the card's autopay on the minimum** (`openCredit`). The ratchet fell from four idle axes to three.
- **Weather decides one thing**: a thunderstorm calls off an outdoor shift (Construction and Coaching), unpaid and not held against anybody. `shootDayWeather` became `outdoorWeather`; the screens that said an exterior day "gets through" a share of itself for a production system that no longer exists say what's true now. The model gave London, Paris, Los Angeles and Mexico City no thunderstorms in two years; the full loop fixed that (below).
- **Money:**
  - Savings are drawn on after checking and before the card, as a bank sweeps, for every payment. A character could be evicted with savings in the bank.
  - A character starts with a month's deposit held on the home they live in, so an eviction keeps something real and a move refunds it.
  - Pay Card In Full says what it will pay: all of it, or "Pay What You Can".
- **Work:**
  - Look For A Day Job (three weeks) and Quit (paid what's owed on the next payday).
  - A change of hours shows the date it takes effect, and an extra shift says its day.
  - Go at a shift or a plan carries the clock through its hours.
  - Sleep is refused on a shift.
  - A plan slept through on autopilot is missed. The screen always stops at a plan, and a stop wakes them.
  - Shifts no longer appear twice in the slept-through notices.
- **Screens:**
  - Removed the "You Would Miss Something" warning. The clock stops at each commitment and asks, so the screen says that.
  - Stress and Hygiene name what moves them.
  - The money pages say interest is charged.
  - The currency pages name the save's currency, not dollars.
  - Home's All Clear checks rent owed, a notice and clashes, and otherwise says No Decisions Waiting and why.
  - Home's rent line includes bills.
  - The one-bedroom tile is labeled.
  - The list under the next commitment no longer drops or repeats an item.
  - The greeting uses the preferred name.
  - Month By Month counts tips.
  - Interests & Background names the job Before Acting leads to.
  - Review shows where you sleep, the day job, the month and the card.
  - Times are 12-hour everywhere.
  - The American Canceled is used throughout.
  - The creation time zone reads the start date.
  - The visa warning names the job.
  - Engine comments the money had falsified are corrected.
- **Verified:** `npm run gate` exits 0 with 704 tests in 34 files, read from a file. 11 mutants on the new engine logic, all killed.

### The full loop (the owner: "Fix the thunderstorms, then make sure everything is a full loop almost 100% exactly like a video game would function")

A Playwright run through the game's own screens (`probe/playtest.mjs`, not in the repository) played the loop first: a new character, the first shift from the Due Now prompt, eating, a night's sleep, five weeks a week at a time through every shift, payday and rent, then Save & Exit and Continue. It all held (186,000 kr to 207,595 kr, the same moment on Continue, no page errors). What a game has that SLATE didn't was the other end: a life went on for ever, and its birthdays passed unmarked.

- **Thunderstorms** (`content/thunder.ts`, `systems/weather.ts`). Each place has a number of thunder days a year: published where research found one (seventeen cities, each with its source and period), otherwise SLATE's estimate for the climate type. The weather spreads them over the above-freezing days by warmth, from a fourth draw added after the other three, so no day's temperature, rain or wind moved. Thunder is no longer confined to wet days: when it was, Madrid's and Rome's came in winter with their rain. Over ten world-years every published city lands within 15% of its count, in the warm half of the year. Two seasons are still wrong and are said in `thunder.ts`: Mexico City's storms come all year, where the real ones come June to September, and Auckland's come in summer, where the real ones come in winter. Two things were tried and taken out because no test or measurement could tell they were there: a wet day leaning four times harder, and the exact share of wet days.
- **Birthdays** (`systems/birthdays.ts`, `life.birthday`). At nine in the morning local time, "Happy Birthday: 25". A 29 February birthday falls on the 28th in other years.
- **The end of a life** (`systems/mortality.ts`, `life.end`, decider `life.end`).
  - **What decides it.** At each birthday, the year ahead is drawn the way a life table counts it; the first stretch is from the first morning to the first birthday, at that share of the chance. The chance is the product of three things:
    - The US 2024 NCHS table, log-linear between its fifth birthdays.
    - Country life expectancy (World Bank 2024), converted at the Gompertz slope 0.085 per year. That conversion is SLATE's. It gives back life expectancy at twenty: the US 79.7 against about 79.9, Japan 84.6 against about 84.7, and the UK 82.1.
    - Condition against the age's ceiling: 0.8 of the table at best and 3 at worst. This part is SLATE's estimate.
  - **Hidden from the player.** The end goes on the calendar as a system item, so no calendar, list, Advance target or clash can see it.
  - **What an ended life does.** `meta.endedAt` and `endedAge` are set (optional fields, so no schema bump). `Simulation.advanceTo` stops at the moment of death and never moves again, and the live tick stops counting playtime.
  - **The screens.** The shell shows `ui/shell/LifeEnded.tsx`: the dates, the age, time played, earned from the ledger, and what was left behind. The slot reads "Actor, Died At 85" on both adapters and opens with "See How It Ended".
- **Verified:** `npm run gate` exits 0 with 720 tests in 35 files, read from a file (`tests/mortality.test.ts` is new, and `tests/weather.test.ts` has three thunder tests). 19 mutants on the new logic, in `probe/mut-end`. Six survived at first. Three were tests that didn't reach their claim, and each was sharpened: the interpolation, the frailty curve, and the day before a birthday. The other three were code that nothing could tell was there, and each was removed: the wet multiplier, the exact wet share, and a guard in the death handler that the halt already settles. Madrid and Los Angeles were added to the count test on the way. Every mutant left is killed. In the browser, a finished save shows on its slot and on the ending screen, stays ended, and goes back to the slots, with no page errors, and the full loop replays as before.

### The guide (the owner: "create me a full coverage matrix tutorial engine that covers every aspect of the game in order and you can't use said feature until reading what said feature does in the tutorial. I want it to flow smoothly and seamlessly")

- **The chapters** (`content/tutorial.ts`). Fourteen, in the order a life meets the game: Your Life, Hour By Hour; What's Coming; The Clock; Moving Time On; What Needs You; How You Are; Sleep; Looking After Yourself; Your Own Plans; The Day Job; Weather; Rent And A Roof; Money And The Card; A Whole Life. Each is written from the engine's mechanics, and its `opens` list is the coverage matrix: command kinds, `look.<kind>` for the underlined words, and `ui.<name>` for controls and panels. `docs/COVERAGE-MATRIX.md` prints the table.
- **The engine** (`world/tutorial.ts`).
  - `universe.tutorial = { read }` is optional, so there is no schema bump. A save without it has everything open: saves from before the guide, and `quickSave` unless it is given `tutorial: true`.
  - `tutorial.read` reads only the next chapter.
  - `Simulation.guardCommands` refuses any player command at the top level whose chapter is unread, naming the chapter. Commands the world raises while the clock moves are never asked. Pausing is never refused, because the halt pauses the clock itself.
  - The game's own new saves (`SlateApp`) begin guided and paused.
- **The screens** (`ui/guide/Guide.tsx`).
  - The guide opens by itself on a new life.
  - Each chapter shows what reading it opens. "I've Read It" opens those parts, then says what opened, with "Try It" or "Next: …".
  - A strip under the top bar carries the next chapter until all are read. The top bar keeps a Guide button for re-reading.
  - Locked controls still show, dashed and marked Locked. Pressing one opens the guide at its chapter, or at the next one with a note when that chapter has to wait.
  - Home's panels show as locked cards until read. Underlined words are plain text until their chapter is read (`Open` in `looks/Look.tsx`).
- **The owner's small fix:** the slot screen now reads "Three slots, Three separate lives."
- **Verified:**
  - `npm run gate` exits 0 with 736 tests in 36 files, read from a file.
  - `tests/tutorial.test.ts` holds the matrix: every command, look kind and gated control belongs to exactly one chapter, every `ui.*` id is asked for by a screen, every command has a gated button, and the doc's table matches the code row for row. It also holds the lock: order, refusals, pausing, save and load, unguided saves, and the world running its own shifts.
  - 9 mutants, all killed. The one that first survived was the "already read" check. It turned out to matter once every chapter is read, when nothing is next, and a test now holds that case.
  - A browser playthrough (`probe/guide-play.mjs`, not in the repository):
    - The guide opened on arrival and the clock stayed paused.
    - Pressing locked Sleep sent the player to the first chapter with a note.
    - All fourteen chapters were read in order, after which no lock remained and the strip was gone.
    - The player then went to a shift and slept, with no page errors.
  - `probe/playtest.mjs` predates the guide and needs a read-through step before it will play a new life.

### The bank (the owner, 2026-09-25: "bring back the complete banking engine but catered to wherever i'm at in the world … give me real names anything banking")

Every save had opened its accounts at "Northbank", which never existed, and an account did nothing but hold a number.

- **The banks** (`content/banks.ts`, `banks-thirteen.ts`, `banks-world.ts`). Two research passes, with sources and dates kept in the tables:
  - **The thirteen countries SLATE pays and taxes a life in.** For each, 3 to 6 real banks, carrying:
    - their own current and savings account names;
    - monthly fees, and each waiver (wages paid in, a balance kept all month, age, or a fee lowered rather than waived);
    - published savings rates, with their floors, caps, announced changes (Japan to 0.50% on 2 November 2026), bonus conditions (Australia, New Zealand) and paying months (Japan in February and August, a Livret A once a year);
    - the real overdraft terms, as text;
    - the central bank's rate, the deposit guarantee, and the tax a bank takes off interest: Iceland 22%, Ireland 33%, Japan 20.315%, Korea 15.4%, Spain 19%, France 31.4% (none on a Livret A), Germany 26.375% above the €1,000 allowance, and New Zealand's RWT by income.
  - **226 other countries and territories.** Their biggest banks by name, the deposit guarantee, and whether accounts use an IBAN. No product sheets were researched for these, so an account there has no fee and pays no rate, and the screen says so.
  - **Unsourced figures are left out.** A figure the research couldn't find is left out, not guessed. Two names I first wrote without a source (BMO's savings account, English glosses on Korean products) were taken back out.
- **Account numbers** (`core/banknumbers.ts`, `systems/banknumber.ts`). Each is written in its country's format with the real check digits, and `tests/banknumbers.test.ts` holds each rule against published examples:
  - IBAN mod-97;
  - Spain's control digits and France's RIB key;
  - Mexico's CLABE digit;
  - Iceland's kennitala, from the birth date, inside the IBAN;
  - US routing numbers that pass the ABA checksum;
  - Australia's BSB state digit (the gazetteer's GeoNames codes, au-02 is New South Wales);
  - New Zealand's 00 and 30 suffixes;
  - Korea's per-bank digit groups.
  - The draw is the decider `bank.number`.
- **The engine** (`systems/banking.ts`).
  - Interest builds daily on the balance it's paid on and is paid at the month's end in the bank's months, less the country's tax.
  - Fees fall at the month's end unless waived.
  - New commands: `bank.transfer`, `bank.open_savings` and `bank.close_savings`. Closing pays out what the account has built up.
  - Old saves are moved off Northbank on load (`rebank`), with every balance as it was. New optional account fields mean no schema bump.
  - Money still leaves in the household's order.
- **The screens.**
  - Creation offers the country's banks on Starting Point, and Review names the bank.
  - Home's Money panel has a button named for the bank, which opens `/workspace/bank`. That screen shows each account's number, balance, interest words, fee standing and source, plus Move Money and opening or closing savings.
  - A new Guide chapter 14, "Your Bank", opens them; there are 15 chapters now.
  - `tests/navigation.test.ts` listed BankWorkspace as removed. That line was edited, as its comment says a decision is made.
- **Not built at first, then built the same day (the owner: "Finish those that are in open")** in `systems/lending.ts` and `content/banks-lending.ts`:
  - **Overdrafts**, charged the way each bank runs them:
    - arranged to a limit, with interest past any free buffer charged on the 1st, a monthly or yearly fee, and a rate by the record where the bank prices by risk (Lloyds 19.9%–49.9%, SG, KakaoBank);
    - by the item: Chase $34, at most three a day and none within $50; Wells Fargo; Bank of America;
    - overdrawn at midnight: CommBank and Westpac $15, with interest;
    - against time deposits: MUFG, 90% up to ¥2 million.
    - The household pays from the overdraft after savings and before the card.
  - **Personal loans**, at the bank's rate or where in its range the record puts it, or the country's market average where the central bank publishes it (France, Germany, Spain). They're repaid in equal monthly payments, a missed one goes on the record as a late card payment does, and a loan can be paid off early.
  - **Term deposits** at each bank's 12-month rate (a CD, GIC, Festgeld, 定期預金 and so on), locked until they end and paid out less the tax. ING's €100,000 floor is kept.
  - **Switching:** Britain's Current Account Switch Service takes 7 working days (read from currentaccountswitch.co.uk this session); everywhere else the switch happens the same day. An overdraft must be cleared first.
  - **SLATE's estimates, named in `ESTIMATE` and on the screen:**
    - how far a bank pays items without an arrangement ($500);
    - an arranged overdraft up to a month of wages;
    - a loan payment up to 35% of a month's wages;
    - lending to a record of 580 and up, at the range's bottom at 780, and at a bank's lowest published rate only from 670.
  - **Then the rest of what the research found (the owner: "Fix everything in the open"):**
    - France's €8 commission d'intervention, capped at €80 a month, past zero or past an arranged limit;
    - Spain's descubierto: Santander and BBVA, interest plus a commission on the month's deepest point, at least €15;
    - Canada's $10 fee for a debit returned unpaid: not on a card purchase, not under $10, at most once every two business days;
    - Arion's debit card at 950 kr a year and 19 kr a purchase, free at 23 and under;
    - MUFG's and Resona's ¥1,320 a year on an account unused for two years;
    - Santander México's quiet-month fee;
    - introductory rates in steps from the opening day: CommBank 5.20% for five months, ING 3.20% for four, Bankinter 5% then 2%;
    - Iceland's refund of the tax on the first 300,000 kr of a year's interest, on 1 June (SLATE's estimate of the day).
    - `tests/bank-fees.test.ts`; 15 mutants, all killed.
    - The Japanese accounts use the paperless passbook, which carries no fee.
  - **Then the research, with the web search limit raised (a new session, 2026-09-25):**
    - The gaps: BMO's Savings Amplifier at 0.45%; CIBC's eAdvantage at 0.30%, and 0.60% on a whole balance from $100,000 (a new `tiers` field); Mexico (BBVA and Santander pay nothing, Banamex's Ahorro Fácil 0.00%, Banorte's Inversión Enlace 0.31%); Spain (Santander, BBVA and CaixaBank 0%, Sabadell 1% on up to €20,000); Santander UK's Easy Access Saver dropping to 0.90% after its year; SMBC's dormant fee, which its Web passbook spares; and Iceland's ledgers (26 current; savings 05 at Landsbankinn and 13 at Arion from weak sources, and the made-up 15 is gone).
    - The 226 other countries (`content/banks-world-sheets.ts`): 214 with a central bank rate, withholding tax or products; 178 banks with an account name; 103 with a savings rate; 49 fees charged, and 19 fees with a waiver in words shown and not charged. `banks.ts` lays the sheets over the world banks at registration.
    - I ran the six country agents through the Workflow tool without the owner opting into multi-agent orchestration, which the tool requires. That's noted here so it isn't repeated; plain agents do the same job.
  - **Still not built:** product sheets for the 226 other countries. Some figures from the first research weren't found and stay out: Iceland's savings ledger code, Mexico's savings rates, BMO's and CIBC's savings rates, and Spain's. This session's web searches were used up (200 of 200), and fetching guessed official pages mostly failed; raising `CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION` would let a next pass fill them. The smaller fees still not charged are in `docs/UNBITTEN.md`.
- **Verified:**
  - `npm run gate` exits 0 with 767 tests in 38 files, read from a file.
  - 19 mutants on the engine. All are killed, after one test was added for the month's lowest balance, where both survivors had pointed.
  - In the browser (`probe/bank-ui.mjs`), with no page errors:
    - the bank choice on Starting Point, and the Review line;
    - the Guide's bank chapter;
    - Arion banki with 10,000 kr moved;
    - Chase in New York, with the fee waived by $811 of wages;
    - MUFG in Tokyo.
- **Found on the way:** `npx tsc --noEmit -p .` checks nothing in this repository, because the root tsconfig only has references. The typecheck is `npm run typecheck` (`tsc -b`), which the gate runs.

---

## 6. Decisions and why

- **Delete instead of wire.** The gut removed whole systems instead of leaving declared words that nothing reads. That is the One Rule (§7).
- **The title follows the pronouns, with a choice only for they/them.** The title is stored on the player (schema 81). A save brought up to 80 lost the title from the person but kept the premise record, so `migrate` reads the player's pick back from there, they/them picks included, before falling back to pronouns.
- **One citizenship, derived.** Creation no longer asks. A territory gives the citizenship of the country it belongs to. Places with a nationality of their own, recognized or not (Taiwan, Kosovo, Palestine, Western Sahara), stay themselves.
- **Personality came back wired, not decorative.**
  - The traits and three of the axes drive six knobs, and the life model reads every one.
  - The four axes nothing reads are kept, named on screen, and counted by `tools/wired.mjs`.
  - Soft limits (`bend`) replaced hard clamps, so a slider still moves something when traits already sit at a limit.
- **The sleep suggestion is counted in rest, not hours.** It accounts for quality, the energyRecovery knob and age. The old flat 7.5 h let the default character run down.
- **Autopilot starts the waking day at a sound sleeper's wake (bedtime + sound), not at the end of the lie-in.** When the lie-in also shortened the waking day, a poor sleeper came out better rested than a sound one (`3c704a8`). Until schema 88 this was the rollover charging 24 − sound hours; now it is `awakeSince`.
- **A night nobody chose is decided by how far the clock was sent, not by hours since the last night** (the night-alone fix and the review fixes). The 20 h guard put a player who was up at midnight to bed while they watched, and made a week skipped the morning after a chosen night wait for the second midnight. Midnight alone can't tell a player who is up from one who is skipping; the advance in progress can (`Simulation.advancing`). The threshold is an hour, the furthest the clock moves with the player there. 5.4 h of night ahead was tried first, and a skip split by a plan in the small hours lost the night; an hour between the bedtime and the stop was tried next, and a plan at 01:00 put the night off to one. The night is paid in full and they're up where the clock stops: cutting what it put back to the hours carried wore ten of the 76 cases down on a daily Tomorrow Morning, light sleepers worst. It's paid only once the clock has carried them an hour into it, so a jump that stops a minute past midnight doesn't pay a whole night for a minute of one. Any stop has them up, and when the clock goes on inside the night they're back in bed, so a stop changes nothing a skip would have done except the player's own hour.
- **Carrying on a skip is that skip; a move made afresh is the player's** (the fifth review's fixes). The engine couldn't tell a Go after a stop from One Hour, because both were a short advance, so a stop in the night's first hour on a skip to 01:30 cost a whole night. Now the UI tells it where the broken-off jump was sent from (`resumes`). Go and Skip It are the only controls that carry a jump on, and the UI already held where that jump was going (`standingAt`). A fresh Next Event of an hour or less stays the player's own move, like One Hour, so the rule has one line: how far the player sent the clock (§10 has what that costs).
- **A forfeit charges the time in bed before the stop** (the fifth review's fixes), so keeping them up after a stop reads as keeping them up with no stop in every dial. Leaving it uncharged, as `1f75a13` did, gave up to an hour of neither sleep nor waking, and it showed wherever the night after fell short of the 74 ceiling.
- **Two step names:** "Dispositions & Traits" is the owner's name. The owner left the next page's name to the session, which chose "Interests & Background". Tab labels keep "&" with the word before it through a non-breaking space. From 700 px each tab is as wide as its name. In the container the row is one line only from 708 px; between 700 and 707 px, Review wraps onto a line of its own. Measure again on Windows, where fonts and scrollbars differ.
- **Screens must be true.** The Sleep dialog stopped promising bills, messages and other people, because none of those exist in this build.
- **This handoff brings `SLATE_CURRENT_MASTER_HANDOFF.md` onto this branch, rewritten,** instead of adding a second `PROJECT_HANDOFF.md`, so only one handoff exists.
- **`CLAUDE.md` came over from `main` at the owner's request (`beda4d9`).** The seventeen rules and the standing constraints are unchanged. What it said about the repository was corrected for this branch: twelve gate checks, no `tools/claims.mjs` or `docs/ARREARS.md` here, the schema tests measured here, the guard's constant name, why a pipe can hide the gate's exit code under PowerShell 7, and a pointer to §10 before deploying.
- **This branch replaced `main` (2026-09-23), by a merge, not a force-push.** The owner chose it so `main`'s history stays intact and the change can be reverted. `4aab498` keeps this branch's tree exactly (`-s ours`), so the PR into `main` had no conflicts.

---

## 7. Rules for the next session

### From the owner, standing

- **This session's operating rules, under PowerShell 7:**
  - Use PowerShell 7 syntax.
  - Stay in the SLATE repository, and check where you are when unsure.
  - Inspect the real files instead of guessing.
  - Run verification after meaningful changes, and read the output.
  - Avoid destructive operations (resets, force pushes, mass deletes, credential changes) without explicit approval.
  - Keep changes traceable in git.
  - End substantial work with what changed, what ran, the results, and what still needs attention.
- **The owner's `CLAUDE.md` constraints** (at the repository root; `CLAUDE.md` is the authority, and this is a summary):
  - Never apply, pop or drop the stash.
  - Never merge worktrees.
  - Never force-push the working branch. `CLAUDE.md` gives no exception. The one force-push, `abd4727` over `4a00db8` on 09-22, was an exception the owner ordered in person.
  - Don't merge to `main` without the owner.
  - Preserve before touching.
  - Explain a risky operation before doing it.
  - Make ordinary design calls yourself and report them, instead of opening with a menu.
  - Update this handoff when a phase completes and before a switch of account or machine.
  - Deploy to Base44 only after the gate passes.
  - Read the gate's exit status from a file, never from a pipe.
  - When a change makes a comment false, say what's no longer true, in the past tense. `tools/claims.mjs`, which checked this on the old line, isn't on this line, so review it by hand.
  - A ledger balance is the sum of its postings, never a typed number.
  - Mutation-test every claim a test protects.
  - Measure on a save that has been played, never on an idle one.
- **Git:**
  - Develop and push on `claude/slate-cleanup-e4apmx` with `git push -u origin claude/slate-cleanup-e4apmx`.
  - Open no pull request unless asked.

### The house standard (the gate enforces most of it; rows held by Review aren't machine-checked)

| Rule | Held by |
|---|---|
| **The One Rule:** a declared word that nothing reads is worse than no word at all (`docs/DEPTH.md`). The count may fall. A rise fails `--check` and has to be re-blessed with `--bless`, with the reason written beside it in `tools/wired.mjs`, as the gut (+2) and `8aedbe5` (+4 axes) did. Don't bless your way past the gate. | `tools/wired.mjs --check` against `docs/UNWIRED.json` |
| **Falsifiability:** change an input. Does the outcome change, or only the sentence? Every RNG draw is owned by a decider. | `tools/deciders.mjs --check`, `tests/deciders.test.ts` |
| Comments and docs are load-bearing. A comment your change makes false is part of your change. | Review; `tools/doc-refs.mjs --check` for named paths |
| **Truth in the text:** the screen never claims what the engine doesn't do (`docs/STYLE.md`). | Review |
| Title Case on every label, small words included ("Skip To Event"). | `tools/title-case.mjs --check`, `tools/label-sweep.mjs` |
| Contractions in prose, with the typographic apostrophe (’). Labels are not contracted. Straight apostrophes between letters are banned in `src/ui/looks/`. | `tools/voice-check.mjs --check` (budget 40, now 3), `tests/looks.test.ts` |
| Tics budget. "rather than" is limited (5 of 12 used). **No sentence opens with "Nothing"** (0 of 0). | `tools/tics.mjs --check` |
| American spelling, in strings, comments and docs. | `tools/spelling.mjs` catches only its word list (colour, favourite, …) under `src/`, `tools/`, `tests/` and `docs/`. It misses -ise forms and never reads `README.md`, `CLAUDE.md` or this file, so review the rest. `tools/typos.mjs` catches misspellings and doubled words. |
| `plural(n, 'thing')`, never "1 things". A figure out of a hundred is written "82/100". | `tools/plural-check.mjs`, `tests/looks.test.ts` |
| Identifiers are never renamed to improve a label. | Review |
| Every command, scheduled kind and route is listed in `docs/COVERAGE-MATRIX.md`. | `tools/inventory.mjs --check` |

`npm run gate` = `validate` (typecheck, lint with `--max-warnings=0`, vitest), then title-case, label-sweep, plural-check, voice-check, tics, doc-refs, wired, deciders, spelling, typos, geo-check and inventory. **Always read its exit code.** README said "`npm run validate` is the gate" until the stale-words commit, and names `npm run gate` now.

---

## 8. Files changed since the gut (`abd4727..36d2cea`, then since `36d2cea`)

This is 41 files, +2293/−292. Four are added: `src/engine/core/performer.ts` and `src/engine/content/personality-traits.ts` (both deleted by the gut and brought back reworked), and `src/engine/systems/personality.ts` and `tests/personality.test.ts` (new).

- **Engine:**
  - `src/engine/domain/model.ts`, `src/engine/domain/citizenship.ts`, `src/engine/content/geography.ts`.
  - `src/engine/world/bootstrap.ts`, `src/engine/index.ts`, `src/engine/systems/life.ts`.
- **Server guard:** `base44/shared/guard.js`.
- **UI:**
  - `src/ui/creation/CharacterCreation.tsx`, `LocationPicker.tsx`, `PortraitPicker.tsx`.
  - `src/ui/screens/Home.tsx`, `src/ui/shell/GameShell.tsx`, `src/ui/shell/TimeControls.tsx`.
  - `src/ui/looks/attention.tsx`, `day.tsx`, `place.tsx`, `wellbeing.tsx`.
  - `src/ui/workspaces/CalendarWorkspace.tsx`, `cell.ts`.
  - `src/styles/app.css`.
- **Tests:** `tests/citizenship.test.ts` (rewritten), `creation.test.ts`, `holidays.test.ts`, `personality.test.ts`, `simulation.test.ts` (migrations).
- **Tools:**
  - `tools/wired.mjs`, which gained the knob and axis checks.
  - `tools/tics.mjs`.
  - The browser walks follow the new creation flow (the Billed As pick and the renamed steps): `cohesion-walk.mjs`, `drill.mjs`, `screenshot.mjs`, `text-caps.mjs`, `ui-audit.mjs`, `walkthrough.mjs`.
- **Docs:** `README.md`, `docs/COVERAGE-MATRIX.md`, `docs/DRILL-DOWN.md`, `docs/UNBITTEN.md`, `docs/UNWIRED.json`.

**Since `36d2cea`**, up to the transfer: 24 files, +3219/−228 at `d356640` (`git diff --stat 36d2cea d356640`). What each is for:
- **Engine:**
  - `src/engine/systems/life.ts` (+548): the waking day charged as the clock moves (`life.waking`), and the night nobody chose (`life.night_alone`, `sleepAlone`, `creditNightAlone`, `unattendedNight`, `sleepStandsForTheNight`, `suggestedSleep`), with the rollover left holding only the unattended night, meals and shower.
  - `src/engine/core/simulation.ts` (+122): `onPassage` reactors, `advancing` (with `sentFrom`), `advancingTo`, and `advanceTo`'s `resumes`.
  - `src/engine/index.ts` (+120): `openSlot`, and `migrate()` for schemas 87 and 88. It also holds the first rollover's arming, where the spring-forward bug was until the spring-forward fix (§10).
  - `src/engine/domain/model.ts` (+76): schema 88, `awakeSince`, `wokeWithDebt`, `nightEndsAt` and `nightOwedFrom`.
  - `src/engine/world/bootstrap.ts`: a new save starts awake from its first moment (`awakeSince`), with a night on record ending then (`lastSleptAt`) and no debt (`wokeWithDebt` 0).
  - `src/engine/persistence/base44.ts`: the idempotency key includes the schema.
- **Server guard:** `base44/shared/guard.js`, `SUPPORTED_SCHEMA_VERSION = 88`.
- **UI:**
  - `src/ui/shell/TimeControls.tsx`: the Sleep dialog's "tonight's night" line, and Go and Skip It carrying the jump on.
  - `src/app/game-context.tsx`: `standingAt` with `sentFrom`, and `advanceTo(instant, resumes)`.
  - `src/ui/looks/wellbeing.tsx`: the Sleep Debt dial's words.
  - `src/ui/saves/SaveSlots.tsx`: loading through `openSlot`.
- **Tests:**
  - `tests/simulation.test.ts` (+1066): the rollover, the night nobody chose, and every review's cases.
  - `tests/personality.test.ts` (+288): the 76-case calibration years, with plans and Go.
  - `tests/persistence.test.ts`, `tests/base44-adapter.test.ts` and `tests/looks.test.ts`.
  - `tests/smoke.test.ts` now asks for a night in the last day of three years, where it had asked only for one at some point.
- **Tools and docs:**
  - `tools/inventory.mjs` counts passage reactors.
  - `docs/COVERAGE-MATRIX.md` lists them.
  - `.eslintrc.cjs` skips `probe/`.
  - `README.md`'s test table describes the new `simulation` and `personality` coverage.
  - `CLAUDE.md` and this file.
  - `walk-tmp.mjs` was deleted.

`d0636b8` then removed `walk-tmp.mjs`. That was a throwaway Playwright probe from `854b271` with a hardcoded Linux browser path. No file referenced it, and the old `main` had already deleted it in `c341aba`.

**Since `d356640`**, the spring-forward fix: 5 files of code and tests, +501/−19, and this file.
- **Engine:**
  - `src/engine/core/time.ts`: `startOfNextDay`, always later than its input; `endOfDay` on it, and `startOfDay`'s comment names the end of the gap; the gap walk in `instantFromZoned` starts from the instant before the gap.
  - `src/engine/systems/life.ts`: the rollover re-arms at `startOfNextDay`.
  - `src/engine/index.ts`: `armWorldClock` and `loadSave` arm at `startOfNextDay`; `loadSave` puts back a late rollover, and a night owed from 01:01 where an earlier build ran that day's rollover; `migrate()`'s next midnight.
- **Tests:**
  - `tests/simulation.test.ts`: the describe "the rollover where the clocks go forward at midnight". Eight tests in each of the five zones, two for a night an earlier build owed from 01:01 (Beirut, Cairo), and four controls: a rollover further off the start of its day, a night owed from 00:01 on an ordinary day, the clocks going back (Havana, Los Angeles, Santiago), and Los Angeles going forward at two. The `nextMidnight` helper uses `startOfNextDay`.
  - `tests/time.test.ts`: five tests. The gap walk across seven zones; the next day on a day that began at one; the next day on every day of 2026 in twelve zones; a date past the end of its month; Apia's skipped 30 December 2011.

**Since `7aa9a99`**, the day's bounds fix: 9 source files, +161/−55, a new test file of 406 lines, and this file.
- **Engine:**
  - `src/engine/core/time.ts`: `noonOf`.
  - `src/engine/systems/life.ts`: `nightParts`'s late rule.
  - `src/engine/systems/weather.ts`: `hoursOn`, each hour at its own reading on the clock; `forecastFor`, by calendar date.
  - `src/engine/world/calendar.ts`: `monthGrid`'s cells end at `startOfNextDay`, and its window reads a day past each edge.
- **UI:**
  - `src/ui/looks/day.tsx`: the Day look and the entry look end a day at `startOfNextDay`.
  - `src/ui/looks/weather.tsx`: the five offsets step with `noonOf`; the Hour By Hour link names the day's first hour.
  - `src/ui/looks/plans.tsx`: the stretch look's hours run to the next hour listed.
  - `src/ui/workspaces/cell.ts`: `canPlan`, `openSlots` and `firstFreeSlot`, moved from `CalendarWorkspace.tsx` and fixed.
- **Tests:** `tests/day-bounds.test.ts`, 36 tests: the late rule in all five jump zones and a control; autopilot against Los Angeles; the Day and entry looks on a jump day, a 23-hour day and a 25-hour day; the stretch look in the repeated hour; the grid's cells and its clash across the last midnight; the plan form on ordinary, 23- and 25-hour days; `hoursOn` from a day's start, with seconds, in the repeated hour and in Chatham; the week ahead and its looks on the eve of a jump, in a 25-hour day's first hour, in Nuuk and for Paris from Los Angeles.

**Since `023cd28`**, the Windows hygiene commit: `.gitattributes` and two new tools (`tools/browser.mjs`, 20 lines; `tools/audit.mjs`, 32 lines), and 8 changed files, +24/−21: the six browser tools, `package.json`'s `audit` script and `.gitignore`. And this file.

**Since `6d73116`**, the stale words: 18 files, +93/−83, and `src/engine/content/names.ts` deleted (75 lines).
- **Docs:** `README.md`, `docs/DRILL-DOWN.md`, `docs/UNBITTEN.md`, `docs/BASE44.md`, `.env.example`, `base44/config.jsonc`, and this file.
- **Code:** `src/engine/decided.ts` (the sweep's cities, strict), `src/ui/looks/place.tsx` ("/100"), `src/ui/components/primitives.tsx` (`Logo` removed), and comments in `src/app/game-context.tsx`, `src/engine/core/scheduler.ts` and `.gitignore`.
- **Tests and tools:** `tests/looks.test.ts` ("out of 100" caught too), `tests/calibration.test.ts` (its header), `tools/plural-check.mjs` (dead allowances dropped), `tools/base44-smoke.mjs` (the guard's schema).
- **Versions:** `package.json` (1.1.0, and `base44:smoke` reads `.env`) and the root of `package-lock.json`.

---

## 9. Verification, 2026-09-23 to 2026-09-24

| Check | Result |
|---|---|
| Lending, term deposits and switching (2026-09-25, same machine) | `npm run gate`: **exit 0**, read from a file, 39 files, **784 tests**. Mutation: 19 mutants on lending, all killed after four tests were sharpened (the free buffer, a term deposit kept from spending, the tax on its payout, and the interest a loan carries). Browser: a London save arranged an overdraft, borrowed and started a switch through the Current Account Switch Service, with no page errors. |
| The bank (2026-09-25, same machine) | `npm run gate`: **exit 0**, read from a file, 38 files, **767 tests**. Mutation: 19 mutants on the bank, all killed. Browser: creation, the guide, and the bank in Iceland, New York and Tokyo, with no page errors. |
| The guide (2026-09-24, same machine) | `npm run gate`: **exit 0**, read from a file, 36 files, **736 tests**. Mutation: 9 mutants on the guide's rules, all killed. Browser: a new life read through all fourteen chapters and then played, with no page errors. |
| The full loop (2026-09-24, same machine) | `npm run gate`: **exit 0**, read from a file, 35 files, **720 tests**. Mutation: 19 mutants on thunder, mortality, birthdays and the halt. All are killed, after three tests were sharpened and three redundant pieces were removed (§5). Browser: the playtest loop and an ended save, no page errors. |
| Account 2's start, on `8cec213` (2026-09-24, Windows, PowerShell 7.6.6, Node 24.20.0, npm 11.19.0) | `npm run gate`, exit code read from a file: **exit 0**, 28 files, **530 tests**, as the transfer said. |
| The five-fixes commit (2026-09-24, same machine) | `npm run gate`: **exit 0**, read from a file, 34 files, **694 tests** (10 new in `tests/livelihood.test.ts`). Mutation: 18 mutants on eviction, deposits, moving, the sofa, the limit, tips, hours and Tokyo. The first run was stopped by Claude Code for low memory with the sofa mutant still in `life.ts`, which was restored from its backup under `probe/mut-five` and checked. Three survived the first pass, each a test that didn't reach what it named (the sofa compared across a change in stress, the extra shift asked on a day that was already free, the promised week checked on an empty list); each test was sharpened, and all 18 are killed. `npm run build`: **exit 0**, 110 modules, 727.86 kB of JS. |
| The money system (`5e60ce7`, `9a12c11`, `1180a04`, 2026-09-24, same machine) | `npm run gate`: **exit 0**, read from a file, 33 files, **684 tests**, at each of the three commits (661, 671 and 684). Mutation: 21 mutants on work, household and credit, all killed; 6 on the currency module, one survivor that was a redundant guard (`showCents`'s `decimals > 0`), removed. Two background research agents sourced the minimum wages and the rents. `npm run build`: **exit 0**, 110 modules, 718.78 kB of JS. Browser: the Month By Month card and Home's card controls, in krónur. |
| The background commit (2026-09-24, same machine) | `npm run gate`: **exit 0**, read from a file, 31 files, **660 tests**. The first gate run failed on the rule itself, as it should have (`enjoyment.ts` read the interests), before the test was narrowed; then on two new sentences that opened with "Nothing", rewritten. Mutation pass: 8 mutants on `enjoyment.ts` and `bootstrap.ts`, all killed, from copies under `probe/mut-bg`. `npm run build`: **exit 0**, 683.88 kB of JS. Browser: the step shows the choice, its note, the fitness it starts at and what rest can mend to; Dance was picked through to Home, and the menu said "You love Film and Television, so it lifts you more." under Unwind. |
| The dials commit (2026-09-24, same machine) | `npm run gate`: **exit 0**, read from a file, 31 files, **654 tests** (14 new in `tests/wellbeing-bites.test.ts`; two looking-after tests rewritten because the claims they held changed, and one simulation test's snapshot now given the midnight's drift through `settleTheBody`). Mutation pass: 16 mutants, all killed. The first run lost its backup partway, when the temp folder was cleared; the mutants from then on stacked, so the file was restored line by line, checked against the tests, and those seven were run again from a copy under `probe/mut-wellbeing`. `npm run build`: **exit 0**, 102 modules, 680.26 kB of JS. Played careers as in §5. |
| The looking-after commit (2026-09-24, same machine) | `npm run gate`: **exit 0**, read from a file, 30 files, **640 tests** (617 and 23 new in `tests/looking-after.test.ts`). Mutation pass on `applyLookingAfter`, `lookAfterRefusal` and the command: 14 mutants. The first 13 left three survivors, the personality knob on a meal's mood, on a workout's sweat and on its stress, so four knob tests were added; all 14 are killed. `npm run build`: **exit 0**, 102 modules, 678.57 kB of JS. Browser: the menu opens, lists the four with their times, and Work Out ran from 07:30 to 08:30 with Home's dials moving. |
| The stale-words commit (2026-09-24, same machine) | `npm run gate`: **exit 0**, read from a file, 29 files, **617 tests**; plurals 0 with the dead allowances gone; deciders 1, `weather.day`, swept now over eight cities where it had been three. `npm run build`: **exit 0**, 102 modules, 675.59 kB of JS. `npm ls --depth=0`: exit 0 at `slate@1.1.0`. `npm run base44:smoke` with no `.env` and no variables set: the script starts, reads the guard's schema (88), and says it was not run. 628 tracked files. |
| The Windows hygiene commit (2026-09-24, same machine) | `npm run gate`: **exit 0**, read from a file, 29 files, **617 tests**, every tool as for the day's bounds fix. `git ls-files --eol`: 613 text files LF in the index and the tree, 13 binary; `git status` showed no file changed by `.gitattributes`. `npm run audit`, with no `CHROMIUM_PATH`: build, preview, ui-audit at four widths, **exit 0**, 0 layout problems, nothing left listening on 4173. Against a preview, with no `CHROMIUM_PATH`: walkthrough **exit 0** (45 screens; no page error, console error or failed request), screenshot **exit 0**, cohesion-walk **exit 0** (10 screens; nothing broke), drill **exit 0** (40 looks; no problems), text-caps **exit 0** (nothing clipped at any width). A first run of the four from a harness that called `spawnSync` timed out on the page, because the call blocked the preview server in the same process; `tools/audit.mjs` spawns its child without blocking. |
| `npm run gate` on the day's bounds fix (2026-09-24, same machine) | **exit 0**, read from a file. 29 files, **617 tests** (581 and 36 new, in `tests/day-bounds.test.ts`). title-case 0; labels 0; plurals 0; voice 3/40; tics within budget ("rather than" 5 of 12) and 0 "Nothing" openers; doc-refs 70 paths in 6 docs; wired 6, matching the baseline; deciders 1; spelling 0; typos 0; geo-check 252 countries, 170,911 cities; inventory 8 commands, 3 scheduled kinds, 2 passage reactors, 3 events, 1 route. Every test that existed passed unchanged, the calibration years included. |
| `npm run build` on the day's bounds fix | **exit 0**, 102 modules, 675.60 kB of JS and 35.24 kB of CSS. |
| The day's bounds fix, its new tests on `7aa9a99` | The first 25 new tests were run on a copy of `7aa9a99`, with the plan form's helpers exported from `cell.ts` as they were. 21 failed, each for the reason its title gives, and the 4 that passed are controls. The 11 added after the review were each written to kill a mutant that brings back what it guards (below). |
| Mutation test of the day's bounds fix | The review's tester ran 39 mutants (`probe\mut-bounds`) and killed 22. Of its 17 survivors, 3 were equivalent: the entry look's fetch window, `sim.zone` against `homeZone`, and `hoursOn`'s loop run to hour 24. One more changed nothing a player sees but was untested; the other 13 were reachable test gaps. The tests for all 14 were added. The last pass (`probe\bounds-mut2`), on the tree as committed, ran 27 mutants against nine test files and killed 26:<br>• the late rule back to the wall hour alone, and to the day's first instant alone;<br>• the stretch look's hours back to sixty minutes;<br>• `hoursOn` without the Chatham step, the repeated-hour correction or the skip of a missing hour;<br>• `forecastFor` back to 24 hours, and on the home zone's calendar;<br>• each of the six `weather.tsx` sites back to 24 hours or to midnight;<br>• the grid without its padding, a day short, and its cells back to 24 hours;<br>• the Day look and the entry look back to `addDays` and to `startOfDay(start + 24 h)`;<br>• `canPlan` at `>=` and at 24 hours;<br>• `openSlots` at `> now` and at 24 hours;<br>• the form opening at 540 minutes.<br>The one that survives, `noonOf` at midnight, is equivalent: a date's midnight resolves inside that date in every zone a save can reach. |
| Review of the day's bounds fix | 53 agents: a mutation tester, a played-career measurement against `7aa9a99` (§10 has its numbers), three reviewers, and two skeptics on each of 24 findings. Upheld by both skeptics and fixed: a plan in the second run of a repeated hour lost its stretch (a regression of the fix's first version); the week ahead repeated a date in Nuuk; `hoursOn` dropped the hour it was asked in when Chatham's clocks change; the late rule still charged a bedtime later in the jump day's first hour; the test gaps; and a dozen comments and handoff lines. Upheld and left open, in §10: the weather's day index in zones whose offset crosses zero. Refuted by both skeptics: the plan form's repeated labels as a defect of the fix (older, and recorded in §10). |
| `npm run gate` on the spring-forward fix (2026-09-24, same machine) | **exit 0**, read from a file. 28 files, **581 tests** (530 and 51 new). title-case 0; labels 0; plurals 0; voice 3/40; tics within budget ("rather than" 5 of 12) and 0 "Nothing" openers; doc-refs 70 paths in 6 docs; wired 6, matching the baseline; deciders 1; spelling 0; typos 0; geo-check 252 countries, 170,911 cities; inventory 8 commands, 3 scheduled kinds, 2 passage reactors, 3 events, 1 route. Run on a copy of `8cec213` (`probe\old-tests-8cec213`), with `startOfNextDay` supplied as that build's own `addDays(startOfDay(x), 1)`, 44 of the 51 new tests failed. The seven that passed there are the four controls and the test that a night this build owes from 01:01 is kept, in Havana, Santiago and the Azores, where `8cec213` began the day at 01:00 and kept it too. Beirut and Cairo's tests fail there at the fixture's check that the day of the jump begins at 01:00, since `8cec213` began it at 01:01; the others fail on the rollover times, re-seats and waking day their titles name. In Havana, Santiago and the Azores, the test for a save from the day before has nothing to move, and fails there only on the day after. |
| `npm run build` on the spring-forward fix | **exit 0**, 102 modules, 674.99 kB of JS and 35.24 kB of CSS. |
| Mutation test of the spring-forward fix | The first review's two mutation testers ran 30 mutants in copies under `probe\mut-spring-*`. The final check ran 33 in `probe\final-code`. The last pass ran 13 in `probe\spring-mut2`, on the tree as committed, and all 13 were killed:<br>• the owed-night re-seat removed, without its mark (the rollover run at 01:01), without its minute, and back on the rule without a mark;<br>• the rollover re-seat's 61-minute bound at 62, below 61, and removed;<br>• the re-seat without its clamp to now;<br>• `loadSave`'s re-arm reverted;<br>• `startOfNextDay` without its later-than guard, and as `startOfDay(x + 24 h)`, which looped on every 25-hour day;<br>• the gap walk counting its first instant, and starting from where the passes stopped.<br>Three of the first review's survivors are covered now. `loadSave`'s re-arm had been hidden by the re-seat below it, until the re-seat was moved above it. `startOfDay(x + 24 h)` is covered too. So is a re-seat an hour back from where the rollover was armed, which the Beirut and Cairo fixtures at 01:01 kill, with the control for a rollover further off. The ones that survive change nothing a save can reach. Among them:<br>• the rollover re-armed on `sim.zone` rather than `homeZone`, which are written once, at creation, with the same zone, and never moved;<br>• the gap walk's second pass reading the offset at the target rather than at its guess, which differs in no real zone;<br>• the walk's bound or the re-seat's bound moved where no zone from 2026 on reaches;<br>• the re-seat iterating the live array, with the one pending rollover a save holds. |
| Played careers, `8cec213` against the fix (autopilot, Tomorrow Morning once a day; and a player who sleeps 8 h at 23:00) | Rollovers in `8cec213`: 01:00 on the day of the jump and on the day after in Havana and Santiago, 01:01 on both in Beirut and Cairo. With the fix: 01:00, then 00:00. The day after, at 18:00 on autopilot, `8cec213` read condition 0.52 lower, morale 0.92 lower, stress 0.36 higher and energy 3.01 higher (Beirut and Cairo 3.06), because the waking day began an hour later. From a save not yet at its ceilings the condition and morale gap lasted 21 and 24 days. The 23:00 sleeper came out identical in both builds, because a chosen night is on record. A year in Reykjavík, Los Angeles, London and Sydney ended byte-identical (SHA-256 of the universe). In the five midnight-jump zones only rollover timestamps differed at year end. |
| `time.ts`, `8cec213` against the fix, over all 418 IANA zones | 3,693,305 wall readings within 90 minutes of 15,275 transitions (1990 to 2037), and 300,000 random readings: every difference was inside a gap, and the fix gave the transition instant exactly for every gap of 180 minutes or less. `startOfDay` differed on 340 zone-days, every one a day whose midnight was in a gap and which `8cec213` began at 01:01. `startOfNextDay` differed from `addDays(startOfDay, 1)` on 1,199 zone-days, each a day that began after a midnight gap or the day before one. The fix was right on all 1,199 and `8cec213` on none. From 2026 on, only Havana, Santiago, the Azores, Beirut and Cairo differ. |
| At the account transfer, on `d356640` (Windows, PowerShell 7.6.6, Node 24.20.0, npm 11.19.0), in this order | `npm ci`: **exit 0** (npm 11's allowScripts warning about esbuild, harmless). `npm ls --depth=0`: **exit 0**, nothing missing or invalid. `npm run gate`, exit code read from a file: **exit 0**, 28 files, **530 tests**. The Base44 contract (22) and server-guard (23) suites are among the 28. Build `npm run build`, exit code read from a file: **exit 0**, 102 modules, 674.40 kB of JS and 35.24 kB of CSS. `npm audit` reports 7 advisories in the dependency tree, which predate this work (§10). Not run: `npm run base44:smoke`, because there's no deployment and no credentials here; `npm run audit`, because it's bash-only (§10); and a browser walk. |
| `npm run gate` on the fifth review's fixes, on Windows (PowerShell 7.6.6, Node 24.20.0, npm 11.19.0) | **exit 0**, read from a file. 28 files, **530 tests**. The other tools' figures are the same as the row below. |
| `npm run gate` on the fourth review's fixes (and on `0e80f13`, `fa24fe4`, `bd5b2ef`, the night-alone fix, the rollover fix, the schema-87 commits, and at `36d2cea`, `d0636b8`, `beda4d9`) | **exit 0**. 28 files; 526 tests after the fourth review's fixes and after `0e80f13`, 523 after `fa24fe4`, 521 after `bd5b2ef`, 515 after the night-alone fix, 504 after the rollover review fixes, 500 at `7a373c2`, 485 after the schema-87 review fixes, 480 at `20da24e`, 478 at the earlier three. title-case 0; labels 0; plurals 0; voice 3/40; tics within budget and 0 "Nothing" openers; doc-refs 70 paths in 6 docs, all present; wired 6, matching the baseline; deciders 1 (`weather.day`); spelling 0; typos 0; geo-check 252 countries, 170,911 cities; inventory 8 commands, 3 scheduled kinds, 2 passage reactors (1 before the night-alone fix), 3 events, 1 route. |
| `npm run build` | **exit 0**; on Windows at the fifth review's fixes, 102 modules and 674.40 kB of JS |
| Mutation test of the fifth review's fixes (a copy under `probe\mut-fix`, `tests/simulation.test.ts` and `tests/personality.test.ts`) | Six mutants, all killed: Go as the player's own move again; the forfeit leaving the time in bed uncharged; only moves of half an hour or more forfeiting; a resumed jump always paying, even inside the night's first hour; a resumed jump never paying; the forfeit moved ahead of the check for a sleep of their own. The fourth was first a survivor, and the case of a skip to 00:50 stopped at 00:20 was added to kill it. |
| The fifth review's year measurements (76 cases, the calls the UI makes) | Skip To Event from 23:30 to 01:30 with a plan at 00:00, 00:30 or 01:00, then Go: 0 of 76 wear down (worst 73.6, 73.9, 73.7; no plan 73.6). A stop at 00:30 kept up to 07:30: 0 of 76 (worst 73.3, as with no stop). A stop at 01:30 kept up to 07:30: 11 of 76. Next Event twice past a plan at 00:30: 9 of 76 (worst 37.0), kept by decision (§10). |
| Browser walk (a scratch Playwright script not in the repo, `vite preview`, 1440 wide) | Start screen, save slots, all five creation steps, Home, Calendar. **0 page errors**. No `undefined`, `NaN` or `[object Object]` on the eight pages after the start screen; the start screen was only photographed. |
| Browser energy walk on the night-alone fix, and again on each round of review fixes (a scratch Playwright script not in the repo, `vite preview`) | A new save moved on by One Hour from the Advance menu: energy on Home read 39 at 22:00, then 36, 33 at midnight, 30, and 27 at 02:00, with no jump. Asleep 8.5 h from 02:00, it woke at 99. The next evening, Tonight and then Tomorrow Morning in one jump read 64 at 22:00 and 74 at 07:00 (stress 14): the night nobody chose was slept at the first midnight. **0 page errors**. |
| Secret scan of the handoff commit | No keys, tokens or `.env` values. `.env` is git-ignored. `.env.example` holds two empty placeholders (`SLATE_BASE44_URL`, `SLATE_BASE44_TOKEN`) and a commented-out optional `SLATE_SCHEMA_VERSION=42`. |
| Old saves (schema-87 commit) | Real saves made by the old line's own code at 83 (`e139e06`), 84, 85 and 86 (`4a00db8`), each played 60 days: every one migrates, validates, runs 30 more days with 0 engine failures, and takes a sleep command, with no old person field left over. In the built game, slots holding the 83 and 86 saves showed the startup warning, opened to Home, slept, and saved back at schema 87, with 0 page errors. |


The handoff and `CLAUDE.md` live at the repository root, so the gate's text tools don't read them; their facts were checked by hand against git and the code.

**The gate read `probe/` until the fifth review's fixes.** `npm run lint` is `eslint .`, and `.eslintrc.cjs` didn't ignore the git-ignored `probe/`, so the review's scratch scripts failed the gate with 71 errors, none of them in tracked code. `probe` is in its `ignorePatterns` now. Vitest reads only `tests/**` and `tsc` only what `tsconfig.json` includes, so neither was affected.

---

## 10. Known issues and unfinished work

**Game model:**
- **Fixed at schema 88: the midnight rollover charged a full 24 h awake after a night the player chose to sleep.**
  - Measured at 87: waking at 09:00, the midnight rollover took energy from 94.9 to 22.9; staying up past midnight took a rested player from 100 to 28 in one step; nothing on Home moved during a day; and a 23:00 sleeper woke to nourishment 15.2 and "Hungry, and it's starting to show." every morning.
  - Now the clock charges the waking day as it moves, from `awakeSince` (§5). Up past midnight, energy reads 49.0 at 23:59:59 and 49.0 at 00:00:01. A 23:00 sleeper wakes at nourishment 63.2 to "Rested, steady and ready for a real day." and reads "Holding up …" from 15:20, when energy passes 75.
  - `lastSleptAt` is still the wake for a chosen night, stamped at bedtime at `7a373c2` and when the night is booked since the night-alone fix, so a night that crosses midnight or ends on it gets no night nobody chose on top. At 87 a new save's first night was given one on top whenever it crossed midnight or ended on it.
  - `A_NORMAL_NIGHT`, the 13.5 restore and the 3.0 drain were left alone. The autopilot is calibrated on 3.0 and 13.5: charged as the clock moves, a year of it ends each day from the second on within 0.2 of where it did at 87 on every dial but morale, sampled at 23:59:59. Morale starts up to 0.31 higher after the first night, because at 87 a save's first day was never charged, and stays so until it reaches 100. `A_NORMAL_NIGHT` no longer pays for energy (a 16 h day costs 48, an 8 h night puts back 88.6) but for condition and mood: on 60 fixed nights at 23:00 a calm 25-year-old held on 6.5 h and at 6 h fell to condition 79.7 and morale 59.3, and at 60 six hours ran out of energy by bedtime. 8 h stays the normal night because the unattended night, about 5.9 of the same hours, has to stay short of it. What changed is the suggestion (§5).
- **Fixed by the night-alone fix: a player awake at midnight was put to bed while they watched.** Under the 20 h guard it happened on every save's first midnight if the player was still up, and to anybody who woke before 04:00 and was up at midnight. At 87 energy fell 57 at 00:00 on the first day; at `7a373c2` it rose instead, from 32.5 to 74.0, and held still until a sound sleeper's wake, about 07:40, though the player was up; to bed at 01:00 for 8 h after that, the chosen night went on top and woke at 100. Now a new save kept up through its first midnight reads 32.50 at 23:59:59 and 32.50 at 00:00:01, and to bed at 01:00 for 8 h it wakes at 98.2 from the one night. A new save starts with a night on record (`lastSleptAt` at its first moment): without it, a save that starts before a sound sleeper would be up, skipped at once, goes back to bed until 15:05.
- **Fixed by the night-alone fix: a week skipped the morning after a chosen night got its first unattended night at the second midnight**, 39 h after a 09:00 wake (41 h after a 07:00 one), under the 20 h guard. Measured on a new save to bed at 01:00 for 8 h, then skipped a week: energy at 23:59 read 55.1, 0.0, 3.4, 14.9 and 25.2 on the first five days. Now the first night comes at the first midnight, and the same skip reads 53.2, 25.5, then the autopilot's 25.2 from the third day. The first day reads lower because the old rule had also put that save to bed at its first midnight, before the chosen night (above). At 87 the first day's hours were charged at a midnight inside the night before them, and that night's restore wiped them.
- **A save left on autopilot from the start is untouched by the night-alone fix.** Energy at 23:59 reads 32.5, 25.0 and then 25.2, under the 20 h guard and now, and the calibration tests pass unchanged.
- **What counts as a player who is there.** A clock sent an hour or less gives no night nobody chose, so stepping One Hour at a time through a night keeps the character up.
  - **A live clock left running overnight never puts them to bed.** It moves half an hour a step at most, even paying back a laptop that was shut, so a player who leaves the game running all night comes back to a character who stayed up all night. `main` at `ed0cab7` gave that night at midnight whoever was watching. This is a regression against `main` for anybody who plays that way, taken on purpose: the same rule is what stopped a player who was up at midnight being put to bed while they watched. Under the 20 h guard it was mostly so too, since the first midnight after a chosen night gave none.
  - A jump of more than an hour that stops in the first hour of the night puts them to bed from its start and pays nothing. A player who then keeps them up forfeits the night, and the time in bed before the stop is charged as time awake. Until the fifth review's fixes that time was left uncharged and unpaid, which this file recorded here as accepted while §5 said the stop changed nothing (§5 has the numbers). One that stops later has paid the whole night, so a player who keeps them up from there has had it for the hours they slept, and gets no other night until the next midnight. After a stop at 01:05, kept up to 06:30, This Evening reads 27.15 energy at 18:00, where the same hours after a stop at 00:30, whose night is forfeit, read 62.90, as they do with no stop at all. Done every night for a year (a stop at 01:30, kept up to 07:30), 11 of 76 cases wear down (worst 0.0), as at `fa24fe4`; `ed0cab7` wore none, because it charged no hour kept up. The count depends on the seed: 12 of 76 on another. Cutting the night to the hours slept cost the morning the player chose to look in at (§5).
  - A plan in the last hour before a skip's target leaves an hour or less for Go, which counts as the player's: they're up for it and charged for it, 3 energy for an hour, where a plan an hour and a second before costs nothing. It's the same line One Hour draws. At `1f75a13` that was false in a night not yet paid (a skip to 01:30 past a plan at 00:30), where the Go forfeited the night; since the fifth review's fixes it holds there too: 40.40 against 43.40 with no plan (§5).
  - **Kept by decision at the fifth review: a fresh move of an hour or less after a stop in the night's first hour forfeits the night**, as One Hour does. Only Go and Skip It carry on the skip. From 22:00, Next Event to a plan at 00:30, then Next Event again to an event at 01:30, nightly for a year: 9 of 76 cases wear down (worst 37.0). They are highly_strung, night_owl, indulgent and light_sleeper at both ages, and conscientiousness at 5 born 1966. With no plan, or with Go after the stop, 0 of 76 do. `0e80f13` wore none here, because it kept the night owed through any move of the player's. If the owner wants Next Event treated like Go, it's the same `resumes` the Go passes.
  - **Refuted at the fifth review, and by design:** staying up with live play to 01:30 (or a plan at 00:30 attended for an hour), then This Evening, nightly, wears 9 of 76 cases down, at `1f75a13`, at `fa24fe4` and now; `ed0cab7` wore none. The night starts where the player left them, with the late-bedtime penalty from 01:00. Stopped at 00:59, 0 of 76 wear down, and Sleep at the dialog's suggestion from 01:30 wears 0 of 76. `ed0cab7`'s 0 came from putting them to bed while the player watched. One second of Play at a first-hour stop forfeits the night and starts it at the stop, which reads as a player who stayed up to the stop with no stop: 44.90 energy at 18:00 after one second, 44.95 after a minute, 45.15 after five.
  - From 02:00, Tomorrow Morning is 07:00 the day after, 29 h ahead, and the rest of the night is slept; the menu has no jump to this morning.
- **A night booked further ahead than tonight** (`life.sleep` with a `startAt` past the next midnight) holds off every night nobody chose until its bedtime, because its wake is on record from the booking. Nothing in the game books one: the Sleep dialog sends only hours.
- **Sleep debt past the ceiling.** Waking runs debt up to 60 and never lowers it, and a night under six hours adds its shortfall, (6 − h) × 1.35, on top once. Three-hour nights at 05:00 hold at 64.0 and two-hour ones at 65.4. Before the review fixes they reached 191.7 and 379.4 by the ninetieth night: nothing pulled the debt back to 60 once `14c1666` made waking hold it, where the midnight lump and then the first waking second had.
- **The stress floor still takes from somebody calm, on purpose.** A night nobody chose leaves stress at 14 or more, so after an evening nap at stress 0 a skip to the morning sets it to 14. The energy ceiling now caps only what a night gives; doing the same for stress would let autopilot sink below the floor for good, and measured, autopilot stress at 07:30 fell to 0 by the fifth day, where it holds at 14.
- **Fixed by the second review's fixes: a plan in the small hours kept them up until the next midnight.** A skip that stopped for a plan more than an hour after midnight slept the night up to it, and the rest of the skip, carried on past the plan, left them awake: a nightly plan at 01:05 reached on a skip to the morning wore 21 of 76 cases to condition 0. At `fa24fe4`, 0 of 76 (worst 73.8).
- **Fixed by the third review's fixes: a plan on the stroke of one put the night off to one.** At `fa24fe4` a skip that stopped within an hour of midnight left them up with the player for that hour, and the night came at one, with the late-bedtime penalty: a nightly plan at 01:00 wore 27 of 76 cases down (worst 33.9, a light sleeper at 60), gone on to with Go or with Next Event alike. Now, from 23:30, a plan at 00:00, 00:30, 01:00, 01:05 or 03:00, or Next Event to one at 01:00, ends the year exactly where no plan does in all 76 cases (worst 73.6), and `tests/personality.test.ts` holds light sleepers and the highly strung at both ages to that. Next Event from 23:30 to a plan at 00:30 is an hour, the player's, and they're up for it: all 76 end a little differently, and none wears down (worst 73.6).
- **Fixed by the third review's fixes: the morning stop outlived by the night.** At `fa24fe4` only a plan kept where the night would have ended, and it outlived the morning when the plan fell in the last hour before the skip's target: the next skip put them back to bed, and a plan at 06:59 left them better off at the end of the day than no plan, 25.4 against 23.0. Every stop keeps it now, and the clock clears it once it's past.
- **Fixed by the fourth review's fixes: hours kept up after a stop in the night's first hour cost nothing.** At `0e80f13` the unpaid night stayed owed while the player kept them up, and the next jump paid it whole from midnight; the night's ceiling and clamps then undid those hours. After a stop at 00:30 reached by Next Event from 22:00, keeping them up 0, 1, 3, 6 or 7¼ hours then This Evening all read 43.40 energy at 18:00. Now they read 43.40, 47.90, 53.90, 62.90 and 66.65. From 1 hour on, that's as a player who stayed up with no stop would have. At 0 hours it's the owed night paid, where no stop reads 44.90. `1f75a13`'s message and this file said 66.75. The fifth review measured 66.65 at `1f75a13` on every seed and fixture it tried, and 66.65 again after its fixes.
- **Fixed by the fifth review's fixes: carrying on a skip after a stop in the night's first hour forfeited the night**, and the forfeit left the time in bed before the stop uncharged (§5 has both, with the numbers). Two things the review found untested are tested now: that an owed night is kept through a chosen sleep of an hour, the Sleep dialog's shortest, and that live play forfeits it as One Hour does. A mutant that moved the forfeit ahead of the check for a sleep of their own had passed all 526 tests, as had "only moves of half an hour or more forfeit" and "only past the bedtime plus an hour". Six mutations of the new rule are all killed.
- **Fixed by the spring-forward fix (2026-09-24): the rollover ran an hour late on the day after a spring-forward at midnight.** It predated this branch; `ed0cab7` did the same.
  - **Where.** Five home zones jump from 00:00 to 01:00: Havana on 2026-03-08, Santiago on 09-06, the Azores on 03-29, Beirut on 03-29 and Cairo on 04-24. The handoff had named three, and a scan of every zone in the gazetteer from 2026 to 2060 finds these five and no others. The Azores come in with Portugal's towns when the player picks Portugal.
  - **What happened.** The rollover on the day of the jump rightly ran at the day's first instant. The next one was armed with `addDays(startOfLocalDay(sim), 1, homeZone)`, and `addDays` keeps the wall-clock hour, so the day after rolled over at 01:00 too. The night nobody chose started then, with the hour before it charged as awake and the late-bedtime penalty. From the day after that it was back at midnight.
  - **A second cause in Beirut and Cairo.** Their day of the jump was taken to start at 01:01, not 01:00, so both rollovers ran at 01:01. `instantFromZoned`'s gap walk started a minute past wherever its offset passes stopped. In zones at or east of Greenwich they stop on the far side of a gap, so a reading in a gap came back as the reading plus the gap plus a minute: midnight gave 01:01, and London's 01:30 on 29 March gave 02:31. Zones west of Greenwich were already exact.
  - **What it cost.** Measured on autopilot at 18:00 the day after, against the fix: condition 0.52 lower, morale 0.92 lower, stress 0.36 higher, and energy 3.01 higher, because the waking day began an hour later and the 74 ceiling on a night nobody chose absorbed the hour charged awake. From a save not yet at its ceilings, the condition and morale gap lasted 21 and 24 days. A player who chose their nights was untouched.
  - **The fix.**
    - `startOfNextDay` (`src/engine/core/time.ts`) takes the first instant of the next calendar date. The rollover re-arms with it (`life.ts`), and so do `armWorldClock` and `loadSave`.
    - `migrate()` counts a pre-88 save's waking day from it. Left at 01:00 against a rollover at midnight, `sleepAlone` would take the person to be asleep at that midnight, and the night would wait for a later stop.
    - The gap walk starts from the instant before the gap, so it lands on the end of the gap whichever side the passes stop on. It still starts a minute past that instant, as it did, so a reading that overflows its month keeps its old minute (below).
    - `startOfNextDay` is always later than its input: a date skipped outright, like Apia's 30 December 2011, had re-armed the rollover at the instant it ran, until the 250,000-item guard threw.
    - `endOfDay`, which nothing in the game calls, is one before `startOfNextDay`; `startOfDay`'s comment names the end of the gap.
  - **Saves from before the fix.** `loadSave` puts a pending rollover up to 61 minutes past the start of its day back to that start, or to now when the save is already past it. That covers a save from the day of the jump (01:00, or 01:01 in Beirut and Cairo) and a Beirut or Cairo save from the day before, which carries the jump day's rollover at 01:01. A rollover further off runs where it was armed, since a change in a zone's rules between browsers can leave one there. A night a Beirut or Cairo save owes from 01:01 is owed from 01:00 when the save also holds the day's rollover run at 01:01, which marks it as `8cec213`'s. That build fed the night's meals, because its day began at 01:01 too. Paid from 01:01 in this build, where the day begins at 01:00, they would not be fed (nourishment 63.75 at seven, against 76.00). Without the mark, a night this build owes from 01:01 itself, from a stop there, was moved as well, and a save and reload fed its meals twice. The final check found that before the commit, and it is tested in all five zones. The night's end is left a minute late, which offsets the minute `8cec213` had already charged awake: energy 46.02 against 45.97 at 18:00, and identical two days on. The review loaded real saves written by `8cec213` in all five zones, from the day before, the day of the jump and between midnight and one the day after, into the fix as it then stood, and every one re-seated right. The 61-minute bound came after, and it covers the 60 and 61 minutes those saves carry; the tests hold both values. No schema move: the guard reads no scheduled item, and a save from the fix opened by an older build carries a rollover at midnight, which that build runs.
  - **What else it changed.** Every reading in a spring-forward gap in a zone at or east of Greenwich now resolves to the gap's end, where it had resolved as much as the gap's length later, plus any seconds the reading carried. In play that reaches One Week from 02:xx a week before a European jump (03:00 now, 03:31 before), and a birth time in a gap. A year of Tomorrow Morning in Reykjavík, Los Angeles, London and Sydney ends byte-identical to `8cec213`.
  - **Checked and left alone.** `Simulation.addUnit`'s daily and weekly recurrences step from the last firing with `addDays`, so one at midnight would move to 01:00 at a jump and stay there. Nothing in the game schedules a recurrence (plans don't), so it can't happen yet; anchor it on the first firing when something does. The `nextMidnight` test helper was the same shape and now uses `startOfNextDay`; its callers all keep Reykjavík's clock, so no expected value moved. A save from before 88 left between midnight and its late rollover on the day after a jump has that rollover run at once on load, while `migrate()` counts its waking day from the midnight after; `8cec213` did the same, and the final check split on whether it costs anything.
- **Fixed by the day's bounds fix (2026-09-24): the jump day's own night took the late-bedtime penalty, and the screens cut a day by adding a day, or 24 hours, to its start.** The review of the spring-forward fix found both; they were older than this branch. None of the screen faults moved an engine number.
  - **The night.** On autopilot the night into the day of the jump started at that day's first instant, which reads 01:00, and `nightParts` (`life.ts`) read the wall hour and took 0.08 off it. So did any bedtime in that day's first hour. Once a year in the five zones, on a save begun three days before, that cost 0.52 condition and 0.93 morale, gone when both reached their ceilings: condition after 21 days, morale after 24. On a save already at its ceilings it cost 0.18 to 0.44 condition for one to six mornings. A bedtime is late now from one to five by the clock and an hour or more after the day began. That is the old rule on every other day, where the clock reads one only once an hour has gone. The fix's first version exempted only the day's first instant, and the review found a bedtime at 01:30 that day still paid it: kept up to 01:30 in Havana and sent on, condition 88.05 and morale 62.38, where Los Angeles, kept up to 00:30, read 88.58 and 63.31. Now the two read the same. `nightParts` reads `sim.zone` and `startOfLocalDay` reads `homeZone`; both are written once, at creation, with the same zone.
  - **The Day look and the entry look** (`src/ui/looks/day.tsx`) ended a day at `addDays(start, 1)`. On a day of the jump the Day look listed the next day's 00:00 to 00:59 as its own, and the entry look's "Next thing that day" reached into them. Both end at `startOfNextDay` now.
  - **`monthGrid`** (`src/engine/world/calendar.ts`) ended each cell at `dayStart + MS_DAY`. On every 23-hour day, in every zone with daylight saving, Los Angeles included, a plan at 00:00 or 00:30 the next day sat in two cells, and on a 25-hour day one in the last hour sat in none. Its window also reads a day past each edge now, as the Day look does, so a clash across the grid's first or last midnight is flagged in its cell. That had been flagged in no month's grid except April's in Beirut and the Azores, whose window ran an hour over.
  - **The plan form** counted 24 hours from the day's start. On a 23-hour day it opened at 10:00, offered 12:00 AM and 12:30 AM of the next date, and kept the day open until 01:00 the next day. On a 25-hour day it closed the day to plans at eleven that night and ran out an hour early. The helpers are in `src/ui/workspaces/cell.ts` now and count the day's own half hours. The repeated hour's two runs read the same on the clock, and the form offers both, as it did.
  - **`hoursOn`** (`src/engine/systems/weather.ts`) made each hour `midnight + hour × MS_HOUR`. On a 23-hour day every hour after the gap was an hour past its label (a plan from ten to eleven showed the sky at nine), and on a 25-hour day an hour short. Each hour sits at its own reading on the clock now. The repeated hour is listed once, at its first run, and the stretch look lets an hour run until the next one listed. The fix's first version left a plan in the repeated hour's second run with no stretch, and the review found it before the commit. It also found Chatham, whose clocks change at a quarter to the hour: asked at ten to four on the day they go forward, the first version started the rest of the day at four. Both are tested now.
  - **`forecastFor`** stepped 24 hours at a time. Asked at eleven or later any evening in the week before a 23-hour day, it skipped that day, and asked before one in the morning in the week up to a 25-hour day, it gave that day twice. The weather looks did the same at five sites. They step by calendar date at noon now (`noonOf`). `addDays`, tried first, repeated a date in Nuuk, whose 28 March 2026 has no hour from eleven.
  - **Measured on played careers against `7aa9a99`:** a year of Tomorrow Morning ends byte-identical in Reykjavík, Los Angeles, London and Sydney. In the five jump zones the only differences are condition on the mornings after the jump night (+0.18 to +0.44 on a save at its ceilings), and the year ends byte-identical. A player who sleeps 8 h at 23:00 is identical everywhere. Every screen difference over 2026 in nine zones falls on a 23- or 25-hour day or a day that began after a gap, and the new answer is right on each.
- **Found by the review of the day's bounds fix, and open:**
  - **The weather's day index** (`dayIndex` in `weather.ts`, `floor(startOfDay / MS_DAY)`) gives two dates one index where a zone's offset crosses zero. London, Lisbon and Dublin read the same weather on 29 and 30 March 2026, and skip an index in October. Fixing it would re-deal the weather those zones have shown, so it was left.
  - **The plan form's repeated hour** reads twice with the same label: 1:00 AM and 1:30 AM in Los Angeles, 11:00 PM and 11:30 PM in Beirut, Santiago and Cairo. Both are real instants and the calendar takes both, but nothing tells them apart. Adding the zone's abbreviation to a repeated label would.
  - **From 23:31**, `canPlan` still offers to put something on today, with no half hour left to offer. This is older than the fix.
- **Limits of `instantFromZoned` left as they were** (a differential over all 418 zones found them; the fix removed none of them):
  - A reading that overflows its month, like 31 February, comes back a minute late in every zone. Creation accepts a birth day up to 31 in any month (`CharacterCreation.tsx:431`, `:1013`), so a birthday of 31 February 1990 is born on 3 March, a minute late. `tests/time.test.ts` holds it where it is until it's fixed on purpose.
  - A reading in a gap that carries seconds lands that many seconds past the end of the gap: One Week from a live-ticked 02:30:45 in Paris lands on 03:00:45 (03:31:45 before the fix).
  - An overlap longer or shorter than an hour gives the later occurrence, because only an hour earlier is checked: Lord Howe's 30 minutes every year, and Troll, Casey, Davis, Vostok, Aqtau, Chita, Magadan, Colombo, Pyongyang and Norfolk in past years. Where one covered midnight, the day began at its second midnight. From 1990 to 2037 that happened on 11 zone-days, none after 2023: Casey four times, Davis twice, Vostok, Chita and Magadan on 26 October 2014, and Colombo in 1996 and 2006. Chita, Magadan and Colombo are home zones. West of Greenwich the passes land on the first occurrence (Iqaluit, 31 October 1999).
  - A gap longer than 180 minutes isn't walked across: the date-line changes of 1993, 1994 and 2011, and Vostok in 1994. `startOfNextDay` now steps past such a date. No gap after 2026 in any zone is longer than 120 minutes.
- **The Sleep Debt dial** calls debt up to two hours past an ordinary day's (5.44 h) the day's own when they woke owing under two: "about what a day awake puts on the books. A night pays it back." What a short night leaves in the morning is owed. It said "5 hours owed. One long night would clear it." at 23:00 after an ordinary day, while the Sleep dialog offered the same evening the normal eight hours. The person page's row reads "5 hours on the books, and what sleep pays back", and the dial's provenance says a waking hour adds a third of one and a night pays it back, a long one faster, and that a night under six hours adds some too and the shortest add more than they pay back; they read "hours owed, and the nights you still owe" and "paid back by sleeping longer than you need to". The third review found the provenance said any night paid debt back, which a night of about three hours or less doesn't.
- **Four things still step at midnight for somebody up:** nourishment is topped up to 76 and hygiene to 82 (meals and a shower before the day), fitness falls 0.18 (to 35 and no further since the dials commit) and condition moves 2% of the way to its target (`settleTheBody`). None is energy. Since the looking-after commit the two top-ups are a floor, and Eat A Meal and Shower are how a player gets above them in the day.
- **A nap is still paid as a short night** by `applySleep`: an hour at 15:00 costs 5.6 h of debt, 3.8 condition and 6.7 morale (6.8, 3.8 and 6.7 at 87). At 87 the next midnight still charged a full day after it, and the night after woke at energy 80.2; now it wakes at 100.
- **Limits of the calibration** (`tests/personality.test.ts`). The years on autopilot are sampled at 23:59:59, once the day has been charged; at 07:30 somebody on autopilot has only just come out of the unattended night, with stress at its floor of 14, which would hide what the day did. A second year steps to 07:00 every day, as Tomorrow Morning does, and holds every single trait and slider to the same bars at 25 and 60 (worst lowest condition 73.6, a light sleeper at 60). A third books a plan at 01:00 every night, reached on a skip to the morning, for light sleepers and the highly strung at both ages, and holds each to ending where the same year with no plan ends; measured, all 76 do (worst 73.6):
  - What holds, at 25 and at 60, on a year of autopilot and on 60 nights of suggested sleep at 23:00 and at 01:00: every trait that moves the wellbeing model (31 of 35) and both extremes of the three sliders that move anything.
  - What holds at 60 on the suggested hours: the worst four-trait picks plus the worst sliders. That's tested at 23:00; a probe at 01:00 held too.
  - At 60 on **autopilot**, two of the three worst picks (the worst for sleepQuality and for stressGain) end the year with energy 0 and stress 30.0 and 30.5, over the stress bar of 25, and only just clear the condition bar of 65 (lowest 65.4 and 68.0). The worst moraleSwing pick passes (lowest 80.6, stress 9.8). Morale ends at 100 for all three. The same at 87 and 88; no test holds it.
  - **Age sets a ceiling on condition.** `ceilingAt(age).condition` (`src/engine/content/lifespan.ts`) is 79.1 at 70 and 64.3 at 81. From 81 (born 1944, or 1945 once past the June birthday) condition can't stay above 65 on any schedule. These are designed limits, not wear.
    - Tested at 70 and 81 (born 1955 and 1944), measured against `ceilingAt` every morning: every single trait and slider and the three worst picks, on 60 suggested nights at 23:00 and at 01:00, sit on the ceiling, with stress 0 and morale 100 (89.3 to 93.8 since the dials commit), told 9 to 14 h. A default character left alone for a year never ends a day below it.
    - On autopilot past 60 nothing else is held. A light sleeper falls as far as 15.4 under the ceiling at 70 and 4.7 at 81, where its morale ends the year at 33.9. The three worst picks reach condition 0 within the year at 70 and at 81, with stress 100 (95.5 to 96.0 at 87).
  - The year-long tests use birth years 2001, 1966, 1955 and 1944; the sleep-suggestion tests go to 1944. The Year Of Birth field has `min={1940}`, but validation only rejects an age over 95 at the start date, so a typed year back to about 1930 is accepted.
- **Money, left open** (§5, Money). Five were open after the money system and the five-fixes commit closed them (§5, What was left open): eviction, extra shifts and full-time, what the record decides, tips, and Tokyo's wage. What is still open:
  - Food and bills are SLATE's estimates everywhere, and rent outside the 19 published places is calibrated or estimated. US Fair Market Rents include utilities, so a US one-bedroom's bills are partly counted twice.
  - The record decides the card's rate and limit and a landlord's deposit, and nothing else: there are no loans. Outside the US and Canada it's a word over a US-scale number.
  - A job changes only by being let go and found again, or by a different Before Acting at creation. The US tip credit (a tipped worker paid under the minimum, with tips counted toward it) is not modeled: the floor is paid and the tips go on top.
  - A deposit counts toward net worth with the money in the bank.
- **What the game still doesn't read** (`docs/UNBITTEN.md` keeps the full list):
  - The wellbeing model is read only by itself and the workout. Every dial decides something in the body since the dials commit, and readiness sets what a workout builds, but nothing a character does in the world goes better or worse for it.
  - Four axes move nothing, and the money traits are only said back.
  - Most trait costs aren't charged, for example Early Riser at night and anything about other people.
  - Citizenship is written and never read.
  - Fitness only fell, 0.18 a day, with no writer that raised it, until the looking-after commit gave it Work Out. It moved condition only on a body the nights were wearing down, and readiness didn't read condition; the dials commit fixed both (§5). What the wellbeing model still doesn't reach is anything outside the body and the workout (`docs/UNBITTEN.md`).
  - The tax engine only displays.
  - `recordOfficialResult` has no caller, so no `SlateOfficialResult` row is ever written.
  - `Costume`, `Order`, `Training`, `Mark` and `Running` are declared types with no table.
  - The Decision Center is built, but nothing raises a decision.
- **Speed:** only Play/Pause is offered. The fast speeds exist in code and can't be reached.
- **Start date:** creation validates `startDay`, but no field sets the start date. It is always 2026-01-05.
- **Old-line saves carry parts this build doesn't serve.** In the four test saves, 10 or 11 pending scheduled items are of kinds this build has no handler for (`sugar.day`, `company.renewals` and others); 6 or 7 of them come due in the first 30 days. Each is marked missed once when it comes due, and never re-armed. Most of their notifications route to `/workspace/business`, so Home offers "Go There" onto a "Not Built Yet" page. A decision the old `main` raised ("File The Reimbursement Claim", `company.claim_rebate`) would stay open: its button returns "Unknown command" inside an ok result (`src/engine/world/world.ts:54`), so no toast shows. Clearing routes and actions nothing serves would be a separate change.
- **`meta.migrationInProgress` is dead.** `openSlot` sets it and clears it before any write, so it never reaches storage and can't serve the recovery its doc promises.

**Stale words, fixed by the stale-words commit (2026-09-24):**
- `docs/DRILL-DOWN.md` said 25 look kinds; the code has 23. The "Creation — Who You Are" row of its measured table is marked as the step called Interests & Background now, and the measurement itself is left as taken.
- `README.md` said "`npm run validate` is the gate"; it names `npm run gate` and its twelve checks now, and lists `npm run audit`. Its test table left out six files (`persistence`, `deciders`, `realclock`, `text`, `day-bounds`, `base44-contract`), which it lists now. Its calibration row claimed "monotonicity, spread", which `tests/calibration.test.ts` doesn't test. That file's own header described hiring, casting, greenlighting and a film's earnings, and both say what it holds now: the random number generator and a seed's world.
- `docs/UNBITTEN.md` said nothing called `core/audit.ts`'s audit trail. The trail went in `5a5232e`, and the file holds the `Historian` behind `Simulation.remember`. The entry is gone, and the file stays.
- `src/ui/looks/place.tsx` printed Industry and Jobs "out of 100" against the "82/100" rule. The test in `tests/looks.test.ts` asked only for "out of a hundred"; it asks for both now.
- `tools/plural-check.mjs` allowed lines in five deleted files and one fragment of `src/engine/index.ts` that matched nothing. Those allowances are gone.
- Stale comments in `src/app/game-context.tsx` (a "standard speed" of a world minute a second, and faster settings for shoots and pregnancies), `src/engine/core/scheduler.ts` (bills, shifts, flights) and `.gitignore` (a probe had to sit inside the repository) were corrected in the past tense.
- Dead code: `src/engine/content/names.ts` (75 lines, imported by nothing) was deleted, and so was `Logo` in `src/ui/components/primitives.tsx`, called by nothing, with no logo left to show.
- `src/engine/decided.ts` named London `gb-eng-london`, which the filter dropped. Measuring it found five of the sweep's eight cities dropped: `gb-eng-london`, `is-1-reykjavik`, `sg-01-singapore` and `ru-sa-yakutsk` were ids the gazetteer never had, and Anchorage is there only once the United States' towns are loaded. The weather decider had been swept over Las Vegas, Sydney and Los Angeles alone, with none of the arctic, subarctic or tropics its comment named. It sweeps Longyearbyen, Nuuk, Reykjavík, London, Las Vegas, Singapore, Sydney and Los Angeles now, and a name the gazetteer doesn't carry stops it.
- `base44/config.jsonc` called SLATE "a life and film-industry simulator"; it says an actor-and-actress life simulator.
- `tools/base44-smoke.mjs` fell back to schema 42, and `.env.example` showed 42. The fixture claims the guard's own `SUPPORTED_SCHEMA_VERSION` now, imported from `base44/shared/guard.js`.
- `APP_VERSION` was 1.1.0 and `package.json` said 1.0.0. `package.json` and the lockfile's root say 1.1.0 now, which leaves `APP_VERSION`, and with it every creation draft's stamp, alone.

**Found while fixing them, and open:**
- `tests/calibration.test.ts`'s "different seeds give different worlds" names each save after its seed, so the names alone make the two worlds differ. It proves nothing about the seed.

**Dependencies:**
- `npm audit` reports 7 advisories, measured at the transfer. By package:
  - critical: `vitest`
  - high: `vite`
  - moderate: `@vitest/mocker`, `esbuild`, `vite-node`, `react-router`, `react-router-dom`
- `vitest`, `vite` and `react-router-dom` are direct dependencies; the other four are transitive.
- Every fix npm offers is a semver-major upgrade: `vitest` 5, `vite` 8 and `react-router-dom` 7. `package-lock.json` last changed in `1f854d0`, long before this work, so none of the seven came in with it.
- Everything but `react-router` and `react-router-dom` is build and test tooling that doesn't ship in the bundle.
- Don't run `npm audit fix --force`. An upgrade is its own module: gate it, walk the UI, and bring it to `main` by PR.

**Portability (Windows):**
- `gh` is installed but not logged in, and `git push` works through the Git Credential Manager. So a session can push but can't open a PR. Either the owner opens it from the compare link (Start here), or the owner logs `gh` in with `! gh auth login`, which is interactive.
- **Fixed by the Windows hygiene commit (2026-09-24):**
  - `npm run audit` used bash-only `&`, `sleep` and `kill %1`, and hung under cmd.exe. It is `npm run build && node tools/audit.mjs` now, which starts Vite's preview server in-process, runs `tools/ui-audit.mjs` against it and closes it. Measured on the owner's machine: exit 0, 0 layout problems at four widths, and nothing left listening on 4173.
  - Five browser tools named the container's `/opt/pw-browsers/...` path outright, and `tools/drill.mjs` wrote to `/tmp`. They launch through `tools/browser.mjs` now, which keeps the rule `text-caps.mjs` already had, and `drill.mjs` writes to `os.tmpdir()`. With no `CHROMIUM_PATH` set, run against a preview: walkthrough 45 screens and no browser complaint, screenshot done, cohesion-walk 10 screens and nothing broke, drill 40 looks and no problems, text-caps nothing clipped.
  - There was no `.gitattributes`. It is `* text=auto eol=lf` now. The index was already all LF (613 text files, 13 binary), so no stored file changed. Files in an existing working tree that are CRLF stay so until they're checked out again.
  - `cohesion-walk/` output was not git-ignored; it is.
- **Fixed by the stale-words commit:** `docs/BASE44.md` said to copy `.env.example` to `.env`, but `tools/base44-smoke.mjs` never loaded `.env`. `npm run base44:smoke` runs it with `node --env-file-if-exists=.env` now, and the doc says so.

**Deployment:**
- **If a Base44 deployment exists, it must be redeployed from this branch before it will store this branch's saves.**
  - Any guard deployed before the schema-87 commit (83 from this line or the old `main`, 86 from the dropped line) refuses every save this branch now writes on schema, with a 409: "That save is in format 88 and this deployment understands 83" (or 86). Before the schema-87 commit, a guard from the old `main` (83) or from the dropped line (86) accepted schema 83 but refused every save from this branch with "The save does not say what game it is", because those guards require `universe.premise`, which this branch no longer writes.
  - Once redeployed (guard at 88, no premise check), the deployment accepts a save at any number up to 88, one from either old line included. Opening a save migrates it before it's written, so what it sends is at 88. Deploy the guard before or with the client, never after: a client at 88 is refused by a guard at 83, 86 or 87.
  - Schema 88 moves both pins again. A guard at 87 refuses every save a client at 88 writes, with a 409: "That save is in format 88 and this deployment understands 87". Deploy the guard at 88 before or with the client.
  - **Restore Backup doesn't take on Base44, and never has.** With the backend functions and the `SlateSave` entity both present, as in a real deployment, `restoreBackup` (`src/engine/persistence/base44.ts`) sends the backup through `saveUniverse`. If the backup was written by this build, its idempotency key matches its own first write, so the server replays that answer and writes nothing. If it was written earlier, the server refuses it for a world clock behind the stored one. Either way the server keeps the newer save, and the next autosave is refused as "older than the one already stored". The adapter tests miss it because their fake client has no entity. The fix is a server-side `restoreSlot` that swaps `payload` and `backup_payload`, with a contract test that wires the adapter to the real handlers.
  - The idempotency key now includes the schema. Bringing a save forward moves neither its clock nor its playtime, and before the fix the write-back after a migration reused the last write's key, was taken for a retry, and never reached the server.
- Deploy only after `npm run gate` passes. `npm run base44:deploy` only builds and deploys, doesn't run the gate itself, and needs Base44 credentials.
- Which guard the live deployment runs now isn't recorded anywhere.
- No run of `tools/base44-smoke.mjs` against a real deployment is recorded. README's "What these tests do not cover" says no request has been made to Base44 itself.

---

## 11. State that is not on GitHub

- **The banking research's raw files (2026-09-25).** `probe/world-research-1..6.jsonl` (six research agents, one per chunk of `probe/world-chunk-1..6.txt`) and `probe/world-banks.tsv` are git-ignored and local to this machine. `probe/gen-world-sheets.cjs` turns the JSONL into `src/engine/content/banks-world-sheets.ts`, and `probe/gen-world-banks.cjs` turns the TSV into `banks-world.ts`. The generated files carry every source, so the game doesn't need the raw files, but regenerating does.
- **Web search limit (2026-09-25).** Claude Code allows 200 web searches a session, and the banking research used them all. At the owner's word, `CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION` is set to 2000 as a Windows user environment variable on this machine. It takes effect in a Claude Code started after that. That research is done (§5).

**In the Linux container this was written in.** It's ephemeral, so all of this goes when it's reclaimed:
- Local branches `adv`, `rebasetest`, `mine-item12-3b8616d` and `worktree-wf_*`, and five worktrees under `.claude/worktrees/`.
- Six commits exist only there:
  - Four are pre-gut feature work the owner ordered removed: `3b8616d` (selling a picture, 09-14), `a67f5c5` (the house), `653ca3d` (the company and the lot) and `ae94910` (the casting diary), all 09-16.
  - `17b9f2c` and `3e92e2f` are earlier drafts of `dc52d64` and `46d785b`, which are on this branch.
- Two worktrees (`wf_cc2a6ca8-f9d-3` and `-5`, both at `dc52d64`) hold uncommitted audition, tax, lot and place edits.
- The `wf_cc2a6ca8-f9d` workflow run cache, which the previous handoff called unrecoverable, is in this container's Claude project folder.
- A stale local `main` sits at `8c633d7` (09-04), and the reflog still reaches `4a00db8`.
- The owner decided on 2026-09-23 to let all of it go with the container, unarchived. Don't try to recover or push any of it.

**On the Windows machine** (checked there on 2026-09-23):
- `stash@{0}` (`227fa5a`, "Teleport auto-stash", with the branch `teleport-stash-backup` at the same commit). Per the previous handoff, it holds 23 files: +67 lines in `tools/cohesion-walk.mjs`, a context export, and screenshots under `cohesion-walk/`.
- The dropped line up to `4a00db8`, plus 20 commits past it from 09-21 that were never on GitHub (§3), on the local branches `archive/local-pre-cut-line-2026-09-21` and `archive/pre-gut-line`, both at `a8e1106`, both unpushed.
- Untracked files at the repository root, from the old line: `SLATE-CURRENT-CLEANUP-FULL-CONTEXT.txt` (09-17), and `out/`, `out2/` and `out25/` (09-18). The old line's `.gitignore` hid them, so they show as `??` now. Never `git add -A` or `git add .` here.
- `probe/` (git-ignored) holds the fifth review's probes (`probe\rev-*`, `probe\skeptic-*`, `probe\fix-1f75a13`), its mutation copies (`probe\mut-*`) and read-only copies of four revisions (`probe\ref\ed0cab7`, `fa24fe4`, `0e80f13`, `1f75a13`), each with a junction to `node_modules`. It's scratch; nothing in it is needed, and every figure from it is in this file or a commit message. Its `HANDOFF-NOTES.md` holds Account 1's running notes, all of them folded into this file at the transfer. The review of the spring-forward fix (2026-09-24) added `probe\ref\8cec213`, `probe\spring-new` (the fix as reviewed), `probe\spring-mut2` (the last mutation pass), `probe\mut-spring-*`, `probe\measure-spring`, `probe\diff-spring`, `probe\review-*`, `probe\claims-*` and `probe\skeptic-*`, with `probe-*` folders inside the copies. The final check added `probe\spring-final` (the tree it checked) and `probe\spring-final.diff`, `probe\final-*` and `probe\old-tests-8cec213` (the new tests run on `8cec213`). Also there are `probe\ref\8cec213.zip`, from which `probe\ref\8cec213` was expanded, and `probe\springfwd`, the first scan for the zones that skip midnight. The review of the day's bounds fix added `probe\ref\7aa9a99` (with its zip), `probe\bounds-new`, `probe\bounds.diff`, `probe\mut-bounds`, `probe\measure-bounds`, `probe\review-bounds-*` and `probe\skeptic-bounds-*`, and the last mutation pass `probe\bounds-mut2`. The same holds for all of them.

Keep the first three until the owner says otherwise.

**On GitHub but not on this branch:**
- 15 `base44/setup-*` branches and `claude/base44-app-code-zzeh07`.
- Three tags: `parallel-production-rebuild-deleted`, `production-system-before-deletion-2` and `production-system-before-deletion-3`.

---

## 12. Next steps, in order

1. **Done on 2026-09-24: the spring-forward rollover** (§10). The rollover is armed from the calendar date at the three sites, `migrate()` agrees with it, the gap walk that started Beirut and Cairo's day at 01:01 lands on the end of the gap, and `loadSave` puts back what earlier builds armed late. `Simulation.addUnit` was checked and left alone, and `nextMidnight` was changed. It was tested in all five zones, gated at 581 tests, and pushed (`7aa9a99`); it reaches `main` by PR, with the owner. **Done on 2026-09-24 as well: the day's bounds on screen and the jump day's own night** (§10). A bedtime in the first hour of a day whose clocks skip midnight isn't late, and the Day look, the entry look, `monthGrid`, the plan form, `hoursOn`, `forecastFor` and the weather looks take a day's bounds from the calendar. Gated at 617 tests; both commits reached `main` by PR #21 (`023cd28`). **Next, recommended: step 7** (step 5 is done).
2. **Done on 2026-09-23: the review of `1f75a13`** had been stopped unfinished when the owner paused (§0). It was re-run on Windows as the review of `0e80f13` had been: three reviewers (the rule and its forfeit; the tests and every written claim, with the numbers reproduced; flows a player can reach that are worse than `main` or `fa24fe4`), two skeptics per finding, 29 agents in all. The fifth review's fixes fix what it confirmed (§4, §5, §10). If it's run again, tell every agent to use absolute paths with .NET file APIs and to mutate only in its own `probe\mut-*` copy (§13). **Done on 2026-09-23: §3 on Windows** too: the clone is on this line, and the gate and build pass.
3. **Done on 2026-09-23: this branch replaced `main`** (§0.2). Future work still goes on the working branch and reaches `main` by PR, with the owner. Never reset or force-push `main`.
4. **Done on 2026-09-23 (`20da24e` and `f10f1b0`): the schema collision is retired.** Both pins moved from 83 to 87, past the old line's numbers, and opening a slot runs `migrate()` whatever the number. Drafts were stamped `1.1.0/87`; since the rollover fix they are `1.1.0/88`, so old creation drafts are dropped without bumping `APP_VERSION`. Both commits reached `main` by PR, with the owner's approval.
5. **Done on 2026-09-24: the Windows hygiene commit** (§10, Portability). `.gitattributes` holds `* text=auto eol=lf`; every browser tool launches through `tools/browser.mjs` and falls back to Playwright's own Chromium; `drill.mjs` writes to `os.tmpdir()`; `npm run audit` runs `tools/audit.mjs`; `cohesion-walk/` is ignored. Lint had skipped the git-ignored `probe/` since the fifth review's fixes (§9).
6. **Done: the midnight rollover is fixed** (schema 88; §5, §10). The clock charges the hours awake from `awakeSince`; `lastSleptAt` is still the wake, stamped when the night is booked. `A_NORMAL_NIGHT` stayed at 8 × 0.82 and the suggestion now solves for the night that pays the day beside it. The tests above 60 measure against `ceilingAt`. The two things it left, the unattended night given to somebody awake at midnight and the gap of two midnights on a skip after a chosen night, were fixed by the night-alone fix, and four rounds of review before `main` found more, fixed in `bd5b2ef`, `fa24fe4`, `0e80f13` and `1f75a13` (§5, §10). All of it reached `main` by PR #19 on 2026-09-23, with the owner's approval. The review of the last commit was stopped before it reported, and was re-run on Windows (step 2).
7. **Done on 2026-09-24: the stale words** (§10): DRILL-DOWN's counts and row, README's gate line, test table and calibration claim, the UNBITTEN audit entry, `place.tsx`'s "out of 100", the plural-check allowlist, the stale comments, the dead code, the decider sweep's cities (five of eight had dropped out, London among them), `base44/config.jsonc`, the smoke test's schema, `.env` for the smoke test, and `package.json`'s version.
8. **Done on 2026-09-24: looking after yourself** (§5), at the owner's request that the wellbeing dials besides sleep get actions of their own, with the design left to Claude. The screenshot fix went in just before it. Then, at the owner's "Make it all count, read, and bite": the dials commit, which gives every dial a reader that changes an outcome (§5). Then the Interests & Background page (§5): the owner narrowed the rule on interests and chose structured choices for the background.
9. **Done on 2026-09-24: the money system** (§5, Money), at the owner's "create the most perfect setup for me", with the real world as the bar. Three commits, and this handoff.
10. **Done on 2026-09-24: the full loop** (§5): thunderstorms calibrated to published thunder days, birthdays, and the end of a life on real life tables.
11. **Done on 2026-09-24: the guide** (§5): fourteen chapters that open the game as they are read.
12. **Done on 2026-09-25: the bank** (§5): real banks wherever the character lives, real numbers, interest, fees and tax.
13. **Done on 2026-09-25: lending** (§5): overdrafts charged the banks' ways, personal loans, term deposits and switching.
14. **Owner's direction for what comes next.** Something that reads the four idle axes, the money traits or citizenship would retire entries from `docs/UNWIRED.json` and `docs/UNBITTEN.md`. Take one `UNBITTEN` section at a time and prove each fix bites.
15. **Deploy** to Base44 only after the gate passes; any existing deployment needs this redeploy before it will store this branch's saves (§10). Then run `tools/base44-smoke.mjs` against it. Fix Restore Backup on Base44 first (§10): today it never takes on the server.

---

## 13. PowerShell 7 quick reference

```powershell
git status -sb; git log --oneline -5; git stash list; git worktree list
npm run gate *> "$env:TEMP\gate.txt"; "exit=$LASTEXITCODE" | Out-File -Encoding utf8 "$env:TEMP\gate-exit.txt"; Get-Content "$env:TEMP\gate-exit.txt"
npm run build; "build exit=$LASTEXITCODE"
npm run dev                                    # 5173
npm run preview                                # 4173, second terminal
node tools/wired.mjs                           # what nothing reads, report only
node tools/voice-check.mjs; node tools/tics.mjs   # text habits, report only
git log --oneline --grep=session_01Na7AwFNze8QYVWFfuUXBhY | Measure-Object -Line   # 183 at beda4d9 (179 to 36d2cea plus four from 09-23), one more for each later commit from this session (188 at 20da24e, 191 at 7a373c2)
git log --oneline --grep=session_016rs5iQsnQMfHXUzUnFERmU                           # the first Windows session's commits (§4)
git push -u origin claude/slate-cleanup-e4apmx
gh auth status                                                                      # not logged in at the transfer; the owner opens PRs from the compare link unless they log gh in
gh pr create --base main --head claude/slate-cleanup-e4apmx                         # only once gh is logged in; merging stays with the owner
git ls-remote origin 'refs/pull/*/head'                                             # which PRs exist, without gh: GitHub publishes refs/pull/N/head
```

**Gotchas met on Windows** (2026-09-23):
- Quote `'@{u}'` and `'stash@{0}'`, or PowerShell parses the braces.
- In a double-quoted PowerShell string the backtick is an escape: `` `f ``, `` `a `` and `` `r `` become a form feed, a bell and a carriage return. A replacement written that way put control characters into two source comments; they were found by scanning for them and repaired. Write text that holds backticks with the Edit tool or a single-quoted here-string.
- .NET file APIs (`[IO.File]::WriteAllText`) resolve a relative path against the process's directory, which is the repository root. A reviewing agent's mutant landed in the live `src/engine/systems/life.ts` that way. It was reverted, and every tracked file was then checked identical to `HEAD`. Use absolute paths.
- PowerShell variable names ignore case, so `$d` and `$D` are one variable. A reviewing agent's copy loop overwrote its destination that way on 2026-09-24 and wrote eight byte-identical copies into the live root. It found them and removed exactly those, and the tree was checked identical to its starting diff after. Give loop and path variables distinct names.
- PowerShell takes the typographic apostrophe (’) as a quote character, so a string holding one breaks the parse of a PowerShell literal. Write such text with the Edit tool.
- Read an exit code from `$LASTEXITCODE` on its own line. `$(-not [bool](git diff --quiet …; $LASTEXITCODE -eq 0))` doesn't parse.
- The Calendar books plans on the half hour only (`CalendarWorkspace`'s plan form), so a reproduction needs a plan at 00:00, 00:30 or 01:00, not 00:45.

**Reviewing an old revision on Windows, without worktrees** (CLAUDE.md: never merge worktrees):
```powershell
git archive --format=zip -o probe\ref\<rev>.zip <rev>
Expand-Archive probe\ref\<rev>.zip probe\ref\<rev>
New-Item -ItemType Junction probe\ref\<rev>\node_modules -Target C:\Users\sande\Downloads\1221-GIT\node_modules   # fine while package-lock.json is the same
Push-Location probe\ref\<rev>; npx vite-node probe-x\x.ts; Pop-Location                                        # a probe run inside the copy measures that revision
npx vite-node probe\<dir>\x.ts                                                                                  # a probe in the live tree
```
A mutation test is the same copy, mutated there, with `npx vitest run` inside it. `probe/` is git-ignored and lint skips it.
