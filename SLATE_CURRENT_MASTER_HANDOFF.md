# SLATE — Current Master Handoff

**Written:** 2026-09-23, in the Linux cloud container at `/home/user/1221` (bash; PowerShell is not installed there).
**Written for:** the next Claude Code session, running on the owner's Windows machine under PowerShell 7.
**Repository:** `github.com/yvcbcjhsy7-prog/1221`
**Working branch:** `claude/slate-cleanup-e4apmx`
**Verified at:** the second review's fixes (2026-09-23), the last code commit (§5, §10). Before them, `bd5b2ef` fixed what three reviewers found before `main`, and before that the night-alone fix `4bfa0fa`: a night nobody chose is slept only when the clock carries them through it. Before that, the rollover fix: `7a373c2` charged the waking day as the clock moves (schema 88), and `14c1666` fixed what review found. Those five reached `main` together by PR on 2026-09-23, with the owner's approval. Before them, the schema-87 commits: `20da24e` moved the save schema from 83 to 87 (§0.4), `f10f1b0` fixed what review found in it, `a5f1f53` corrected the documents and two comments, and `ed0cab7` (PR #18) merged them into `main`. Before those, `36d2cea` ("Fit the new step names, and match Review to them") was the last code commit, and every commit between it and `20da24e` leaves the build alone: `d0636b8` removes an unreferenced scratch file; `acf5e10`, `6c18b6b` and `63b757b` write and correct this file; `beda4d9` brings `CLAUDE.md` over; `ad44f5c` and `297dbfe` correct both files; `4aab498` merges the old `main` in without changing a file; and `cd8d6ef` (PR #17) carries this line into `main`.

This is the one handoff. The owner's `CLAUDE.md` names `SLATE_CURRENT_MASTER_HANDOFF.md` as the only state that passes between sessions; `CLAUDE.md` itself carries the owner's rules. `PROJECT_HANDOFF.md` was retired in `b6f4061`, and keeping a single file stops two handoffs drifting apart. Earlier versions of this file are on GitHub `main` (as of `46f48f3`, 09-18) and, newer, at `4a00db8` (09-21), which is on no GitHub branch. Both describe the line the owner replaced on 2026-09-22 (see §1), so read them only as history.

When this file and the tree disagree, the tree wins. Correct this file in the same commit.

---

## 0. Read this box first

1. **Work on `claude/slate-cleanup-e4apmx`.** Everything described here is on that branch, pushed, and level with GitHub. Since 2026-09-23 `main` carries the same line (§0.2). Keep developing on the working branch, and bring it into `main` by PR, with the owner.
2. **This branch replaced `main` on 2026-09-23, by the owner's decision.** The old `main` (`e139e06`, 2026-09-18) carried 67 commits from the line the owner chose to drop, merged through PR #15 and PR #16 (72 counting the merge commits for PRs #12 to #16). The owner chose a merge over a force-push. Merge `4aab498` records `e139e06` as a parent and keeps this branch's tree exactly (`git merge -s ours`), and a PR from this branch carried it into `main`. That history is still reachable from `main`, but none of its files are in the tree. This line forked from it at `dc52d64` (2026-09-16) and has 21 code commits of its own since (14 on 09-22; on 09-23 the two schema-87 commits, the rollover fix `7a373c2`, `14c1666`, which fixed what review found in it, the night-alone fix `4bfa0fa`, and the two rounds of review fixes after it, `bd5b2ef` and the commit after it), plus the 09-23 commits that leave the build alone (§4). Commits after `cd8d6ef` reach `main` only by PR, with the owner.
3. **The Windows clone is probably still on the dropped line.** The previous handoff says the Windows branch matched the remote on 2026-09-21. The remote tip that day was `4a00db8`. **Don't `git pull` there**: it would try to merge about 157 commits of removed game into this branch. Follow §3, which moves the clone over without losing anything.
4. **Schema numbers 83 to 86 were used twice, and this line has moved past them.** On the old `main` (before 2026-09-23), 83 was the old family-and-film build, and the dropped line went up to 86. This line used 83 for "personality restored" until the schema-87 commit moved both pins to 87. Until then, an old-`main` save at 83 opened without `migrate()` and every player command on it threw, because it had no `history`; a save at 84 to 86 was refused as newer. The rollover fix (`7a373c2`) then moved both pins to 88 (`src/engine/domain/model.ts`, `base44/shared/guard.js:25`). Now a save from either line, 83 to 86, opens through `migrate()`, which works from the shape of the data: it drops the old person fields, keeps the old collections as inert records, and fills what is missing. Old creation drafts (`1.1.0/83`, `1.1.0/86`, `1.1.0/87`) are discarded, because drafts are now stamped `1.1.0/88`. Opening an old save rewrites it, so copy the `slate.*` keys out first if they matter (§3, step 7).
5. **`CLAUDE.md` is on this branch now.** The owner asked on 2026-09-23 for their blueprint to come over from `main`, corrected for this branch. The seventeen rules and the standing constraints are unchanged; §7 summarizes them. A clone still on the old line has the old `CLAUDE.md` on disk, and a session started there has loaded it, until §3's switch.

---

## 1. Snapshot

| Item | State |
|---|---|
| Branch | `claude/slate-cleanup-e4apmx`, pushed, 0 ahead / 0 behind `origin` |
| Last verified code commit | The second review's fixes (2026-09-23), after `bd5b2ef`, the night-alone fix `4bfa0fa` and the rollover fix: `7a373c2` and `14c1666`, which fixed what review found (schema 88). Before them, `f10f1b0` (2026-09-23), which fixed what review found in `20da24e` (schema 87), and `36d2cea` (2026-09-22). |
| GitHub `main` | Replaced by this line on 2026-09-23: merge `4aab498`, carried in by a PR. The old tip `e139e06` (2026-09-18, "Merge pull request #16") is one of that merge's parents. PR #18 (`ed0cab7`) brought schema 87 into it. The rollover fix, the night-alone fix and the review fixes followed by PR on 2026-09-23, with the owner's approval (schema 88). |
| Fork point with the old line | `dc52d64` (2026-09-16, schema 79) |
| The replacement on 2026-09-22 | `abd4727` ("the gut") was pushed over `4a00db8` with the owner's explicit approval. That dropped 157 commits dated 09-17 to 09-21 from three other sessions. 67 of them reached `main` through PRs #15/#16. The other 90 (`46f48f3..4a00db8`) are on no GitHub branch. The owner's words: "destroy those 157 commits, the real work is what we're doing now." |
| Save schema | `SAVE_SCHEMA_VERSION = 88` (`src/engine/domain/model.ts:427`) and `SUPPORTED_SCHEMA_VERSION = 88` (`base44/shared/guard.js:25`). Move both together. 84 to 86 are skipped on purpose (§0.4). 88 added `awakeSince` on every person (§5, Sleep and energy). |
| App version | `APP_VERSION = '1.1.0'` (`src/engine/world/bootstrap.ts`). `package.json` says `1.0.0`, and the two don't match. |
| Gate | `npm run gate` exits **0**: 28 test files, **523 tests** at the tip, and every gate tool. 521 at `bd5b2ef`; 515 at `4bfa0fa`; 504 at `14c1666`; 500 at `7a373c2`; 485 at `ed0cab7`; 480 at `20da24e`; 478 at `36d2cea`, `d0636b8` and `beda4d9`. |
| Build | `npm run build` exits **0** (102 modules). |
| Browser walk | A scratch Playwright script (not in the repo) walked all nine pages at 1440 wide against `vite preview`: **0 page errors**, and no `undefined`, `NaN` or `[object Object]` on the eight pages after the start screen. The start screen was only photographed. |
| Working tree | Clean, with everything pushed. |
| Tracked files | 624 at `36d2cea`, 625 at `beda4d9` and after |

---

## 2. What SLATE is right now

SLATE is an actor-and-actress life simulator at the start of a revamp. On 2026-09-22 the owner cut it to a person, a place, a calendar, the weather and money. Everything else was deleted instead of wired: the character sheet, the film career, casting and auditions, the family business, the family, and the land, house and security.

From the player's side:

1. **Startup.** Six loading stages, then the save slots. The footer reads "Version 1.1.0 · Schema 88".
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

Each step below says what it does. Run them in order and read the output. Stop and ask the owner if anything differs from what is expected.

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

**Step 3: Line endings, before any switch.** The index is all LF, and there's no `.gitattributes`. The Git for Windows installer sets `core.autocrlf=true` system-wide. The previous session set a repo-local `false` after the old line's voice-check counted 41 against its budget of 40 under CRLF. This line's gate passed under CRLF in a test on 2026-09-23, so the setting is no longer what makes the gate pass. It keeps the working tree byte-identical to what's committed. Files written by a switch take the setting in force at that moment, so confirm it first:
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
node -v; npm -v      # the previous handoff recorded Node v24.20.0 and npm 11.19.0 there, where the old line's gate passed. This line was verified on Node 22.22.2 and npm 10.9.7 only.
npm ci
npm run gate *> "$env:TEMP\gate.txt"
"exit=$LASTEXITCODE" | Out-File -Encoding utf8 "$env:TEMP\gate-exit.txt"
Get-Content "$env:TEMP\gate-exit.txt"      # expect exit=0
Select-String -Path "$env:TEMP\gate.txt" -Pattern 'Test Files|Tests ' -CaseSensitive
npm run build; "build exit=$LASTEXITCODE"
```
Expect gate exit 0 and **523 tests in 28 files**. A different number means something differs between the machines. Investigate it before building anything.

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
npx playwright install chromium
$env:CHROMIUM_PATH = node -e "import('playwright').then(p => console.log(p.chromium.executablePath()))"
Test-Path $env:CHROMIUM_PATH                  # expect True
$env:SLATE_URL = 'http://localhost:4173'      # with npm run preview running in another terminal
node tools/walkthrough.mjs walkthrough
```
`tools/ui-audit.mjs`, `walkthrough.mjs`, `screenshot.mjs`, `drill.mjs` and `cohesion-walk.mjs` default to the container's `/opt/pw-browsers/...` path, so on Windows they fail unless `CHROMIUM_PATH` is set. `tools/text-caps.mjs` falls back to Playwright's own browser when that path doesn't exist.

---

## 4. What this session did (2026-09-09 to 2026-09-23)

These are the commits that carry `Claude-Session: https://claude.ai/code/session_01Na7AwFNze8QYVWFfuUXBhY`:
- 179 of them lead up to `36d2cea`. The first is `62c30ca` ("Cut SLATE back to six things", 09-09), and the last of them to change code is `36d2cea` (09-22). After the schema-87 commits came the rollover fix (`7a373c2` and `14c1666`, 09-23, schema 88), then the night-alone fix (`4bfa0fa`) and two rounds of review fixes after it (`bd5b2ef` and the commit after it, the last code commit overall).
- The 09-23 commits (`d0636b8`, `acf5e10`, `6c18b6b`, `beda4d9` and any later ones) carry the same trailer, so the grep below returns 183 at `beda4d9`, and one more for each later commit from this session.
- 165 of them, everything up to `dc52d64`, were on `main` before 2026-09-23. The 14 from 09-22 and the 09-23 commits up to `cd8d6ef` reached `main` when this branch replaced it that day. Later commits reach `main` only by PR: the schema-87 commits did in PR #18 (`ed0cab7`), and the rollover fix, the night-alone fix and the review fixes did together on 2026-09-23.

To list them: `git log --oneline --grep=session_01Na7AwFNze8QYVWFfuUXBhY`.

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
| 09-23 | **What the second review found** (the commit after `bd5b2ef`): a plan in the small hours has them up for it, and the rest of the skip puts them back to bed until the night would have ended (`nightEndsAt`, new in 88) without crediting it twice, where they had stayed up to the next midnight and a nightly plan at 01:05 wore 21 of 76 cases down; the Sleep Debt dial says owed for what a short night left, and its row and provenance stopped calling an ordinary day's debt owed; a new save starts with `wokeWithDebt` at 0; the comments, tests and this file said five things that weren't so | Yes |

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
  - `game-context.tsx` bridges the simulation to React: the live tick every 1 s, autosave every 45 s and on `pagehide`, and the `h`/`c` keys.
- **`engine/core/`**:
  - `simulation.ts` is the kernel. `advanceTo`/`advanceBy` is the only way the clock moves, and `onPassage` reactors run on each stretch it crosses.
  - Also here: `time.ts`, `ledger.ts` (double-entry), `money.ts` (integer cents), `rng.ts` (seeded), `ids.ts`, `scheduler.ts`, `events.ts`, `text.ts` (Title Case and `plural`), and `deciders.ts`.
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
  - `workspaces/CalendarWorkspace.tsx`.
  - `looks/`: the drill-down system, with 23 `defineLook` kinds.
- **`styles/app.css`**: the one design system.

### The person

`Person` in `src/engine/domain/model.ts` holds:
- Identity: names, `pronouns`, `performerTitle: 'actor' | 'actress'`, `birthInstant`.
- Place: `homeRegionId` (the birth city), `citizenshipId` (derived) and `currentLocationId`.
- Character: `personality` (7 axes), `personalityTraits` (at most 4), `interests`, `genres` and `background`.
- State: `wellbeing`, with energy, stress, sleepDebt, morale, condition, fitness, nourishment and hygiene.
- Sleep record: `lastSleptAt` (the last night: a chosen night's wake, stamped when it is booked; a night nobody chose, its bedtime; a new save, its first moment), `awakeSince` (when the waking day began), `wokeWithDebt` (the sleep debt they woke with, 0 on a new save) and `nightEndsAt` (where a night nobody chose would have ended, while a plan in the small hours has them up in it); the last three since schema 88.

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
- **Creation drafts** are stamped `DRAFT_BUILD = "${APP_VERSION}/${SAVE_SCHEMA_VERSION}"`. A draft from another build is discarded.
- **Schema history.** The comment above `SAVE_SCHEMA_VERSION` (`model.ts:394-426`) covers 80 to 88:
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
  - Running on empty, hunger and stress over 75 are each charged only for the hours actually spent there. So 16 h as 57,600 one-second ticks and as one jump end on the same dials, and a day saved and loaded halfway ends where one played straight through does. Ticks and a jump parted over debt that reached 60 while awake until `14c1666`; now only a save from before 88 does, until its first wake. And by design a jump carried more than an hour into a night is slept, where ticks never are.
  - A 16 h day from a rested wake costs 48 energy and 5.4 h of debt: energy reads 97 at 08:00, 85 at 12:00, 73 at 16:00, 61 at 20:00 and 52 at 23:00, and readiness falls from 97 to 57.
- **Sleep** (`life.sleep`) puts the night on record when it is booked: `lastSleptAt` is set to the wake first, so a midnight between the booking and the bedtime, inside the night or on its wake sees a night already chosen and gives no night nobody chose on top. It reads the night's quality at the hour it starts and sets `awakeSince` to the wake before it advances the clock, so nothing is charged during the night. For a chosen night `lastSleptAt` is the wake, never the bedtime.
- **A night's quality** = (0.82 − stress loss) × sleepQuality knob, minus 0.08 for a bedtime from 01:00 to 04:59, clamped to 0.28–1.
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
  - The night runs at quality `sleepQuality × 0.95`, read at its bedtime, and it's slept in full: it puts back the whole night's hours. `awakeSince` is set to bedtime + sound, so the waking day is charged from a sound sleeper's wake, or to where the clock stops if that's sooner, so the player never comes back to them asleep. `4bfa0fa` cut what the night put back to the hours the clock had carried them, and the seven o'clock stop of a daily Tomorrow Morning wore 10 of the 76 cases down (38 single traits, slider extremes and nobody in particular, at 25 and at 60): a light sleeper at 25 ended the year at condition 35.8 and morale 0. Slept in full it's 76.6 and 100 (76.4 and 100 at 87). The coasting ceiling of 74 caps what the night gives; somebody already over it keeps what they had.
  - Whether it's slept is `sleepAlone`'s call, made on where the clock is going rather than on hours since the last night. It's slept when somebody is awake at the bedtime, has had no night since that night's midnight (`lastSleptAt`), the bedtime is before a sound sleeper would have woken, and the clock will carry them more than an hour into the night (`LONGEST_STEP_WITH_THE_PLAYER`). `Simulation.advancingTo` says where the advance in progress will stop: its target, or the first thing before its target that needs the player when it was asked to stop for one (`Simulation.advancingFor`). `4bfa0fa` asked for 5.4 h of night ahead, the floor `unattendedNight` clamps to and never reaches (the shortest sound night is 6.6 h); a skip that stopped for a plan in the small hours came in two pieces shorter than that and neither was slept, which left somebody on autopilot at energy 4.0 by seven.
  - So a player who is there keeps the character up with them: live play moves the clock a second a tick, and never more than half an hour even paying back a laptop that was shut, and One Hour on the Advance menu moves it an hour. Tomorrow Morning, One Week and Skip To Event carry it through the night, and the night is slept, up to a plan that stops the clock on the way, where they're up for it. Where the night would have ended is kept (`nightEndsAt`), and the rest of the skip puts them back to bed until then without crediting the night twice. Without that the stop's night was the night slept: a plan at 01:01 on a skip to the morning read 56.0 at 07:00 and 5.1 at 23:59:59, and now every plan hour reads as no plan does, 74.0 and 23.0. The morning the player chose to stop at isn't a stop like that; they're up from there.
  - The midnight rollover gives the night at midnight, before the meals and the shower, and charges no waking hours. The passage reactor `life.night_alone` gives it later, from wherever the clock was, to somebody the player stayed up with past midnight and then skipped. It runs before `life.waking`, so the hours the night covers aren't charged as awake.

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
- **A night nobody chose is decided by where the clock is going, not by hours since the last night** (the night-alone fix). The 20 h guard put a player who was up at midnight to bed while they watched, and made a week skipped the morning after a chosen night wait for the second midnight. Midnight alone can't tell a player who is up from one who is skipping; the advance in progress can (`Simulation.advancingTo`). The threshold is an hour of night, the furthest the clock moves with the player there. 5.4 h of night ahead was tried first, and a skip split by a plan in the small hours lost the night. The night is credited in full and they're up where the clock stops: cutting what it put back to the hours carried wore ten of the 76 cases down on a daily Tomorrow Morning, light sleepers worst. A plan in the small hours has them up, and the rest of the skip puts them back to bed without crediting the night twice (review fixes).
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

`npm run gate` = `validate` (typecheck, lint with `--max-warnings=0`, vitest), then title-case, label-sweep, plural-check, voice-check, tics, doc-refs, wired, deciders, spelling, typos, geo-check and inventory. **Always read its exit code.** README still says "`npm run validate` is the gate"; that line is out of date (§10).

---

## 8. Files changed since the gut (`abd4727..36d2cea`)

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

`d0636b8` then removed `walk-tmp.mjs`. That was a throwaway Playwright probe from `854b271` with a hardcoded Linux browser path. No file referenced it, and the old `main` had already deleted it in `c341aba`.

---

## 9. Verification, 2026-09-23

| Check | Result |
|---|---|
| `npm run gate` on the second review's fixes (and on `bd5b2ef`, the night-alone fix, the rollover fix, the schema-87 commits, and at `36d2cea`, `d0636b8`, `beda4d9`) | **exit 0**. 28 files; 523 tests after the second review's fixes, 521 after `bd5b2ef`, 515 after the night-alone fix, 504 after the rollover review fixes, 500 at `7a373c2`, 485 after the schema-87 review fixes, 480 at `20da24e`, 478 at the earlier three. title-case 0; labels 0; plurals 0; voice 3/40; tics within budget and 0 "Nothing" openers; doc-refs 70 paths in 6 docs, all present; wired 6, matching the baseline; deciders 1 (`weather.day`); spelling 0; typos 0; geo-check 252 countries, 170,911 cities; inventory 8 commands, 3 scheduled kinds, 2 passage reactors (1 before the night-alone fix), 3 events, 1 route. |
| `npm run build` | **exit 0** |
| Browser walk (a scratch Playwright script not in the repo, `vite preview`, 1440 wide) | Start screen, save slots, all five creation steps, Home, Calendar. **0 page errors**. No `undefined`, `NaN` or `[object Object]` on the eight pages after the start screen; the start screen was only photographed. |
| Browser energy walk on the night-alone fix, and again on each round of review fixes (a scratch Playwright script not in the repo, `vite preview`) | A new save moved on by One Hour from the Advance menu: energy on Home read 39 at 22:00, then 36, 33 at midnight, 30, and 27 at 02:00, with no jump. Asleep 8.5 h from 02:00, it woke at 99. The next evening, Tonight and then Tomorrow Morning in one jump read 64 at 22:00 and 74 at 07:00 (stress 14): the night nobody chose was slept at the first midnight. **0 page errors**. |
| Secret scan of the handoff commit | No keys, tokens or `.env` values. `.env` is git-ignored. `.env.example` holds two empty placeholders (`SLATE_BASE44_URL`, `SLATE_BASE44_TOKEN`) and a commented-out optional `SLATE_SCHEMA_VERSION=42`. |
| Old saves (schema-87 commit) | Real saves made by the old line's own code at 83 (`e139e06`), 84, 85 and 86 (`4a00db8`), each played 60 days: every one migrates, validates, runs 30 more days with 0 engine failures, and takes a sleep command, with no old person field left over. In the built game, slots holding the 83 and 86 saves showed the startup warning, opened to Home, slept, and saved back at schema 87, with 0 page errors. |


The handoff and `CLAUDE.md` live at the repository root, so the gate's text tools don't read them; their facts were checked by hand against git and the code.

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
- **What counts as a player who is there.** A clock that will carry them an hour or less into a night gives no night nobody chose, so stepping One Hour at a time through it keeps the character up. So does a live clock left running with nobody watching, even one paying back a laptop that was shut, at half an hour a step at most. Under the 20 h guard the second was mostly so too, since the first midnight after a chosen night gave none. From 02:00, Tomorrow Morning is 07:00 the day after, 29 h ahead, and the rest of the night is slept; the menu has no jump to this morning.
- **A night booked further ahead than tonight** (`life.sleep` with a `startAt` past the next midnight) holds off every night nobody chose until its bedtime, because its wake is on record from the booking. Nothing in the game books one: the Sleep dialog sends only hours.
- **Sleep debt past the ceiling.** Waking runs debt up to 60 and never lowers it, and a night under six hours adds its shortfall, (6 − h) × 1.35, on top once. Three-hour nights at 05:00 hold at 64.0 and two-hour ones at 65.4. Before the review fixes they reached 191.7 and 379.4 by the ninetieth night: nothing pulled the debt back to 60 once `14c1666` made waking hold it, where the midnight lump and then the first waking second had.
- **The stress floor still takes from somebody calm, on purpose.** A night nobody chose leaves stress at 14 or more, so after an evening nap at stress 0 a skip to the morning sets it to 14. The energy ceiling now caps only what a night gives; doing the same for stress would let autopilot sink below the floor for good, and measured, autopilot stress at 07:30 fell to 0 by the fifth day, where it holds at 14.
- **Fixed by the second review's fixes: a plan in the small hours kept them up until the next midnight.** A skip that stopped for a plan more than an hour after midnight slept the night up to it, and the rest of the skip, carried on past the plan, left them awake: a nightly plan at 01:05 reached on a skip to the morning wore 21 of 76 cases to condition 0. Now 0 of 76 (worst 73.8), held for light sleepers and the highly strung at both ages in `tests/personality.test.ts`.
- **The Sleep Debt dial** calls debt up to two hours past an ordinary day's (5.44 h) the day's own when they woke owing under two: "about what a day awake puts on the books. A night pays it back." What a short night leaves in the morning is owed. It said "5 hours owed. One long night would clear it." at 23:00 after an ordinary day, while the Sleep dialog offered the same evening the normal eight hours. The person page's row reads "5 hours on the books, and what sleep pays back", and the dial's provenance says a waking hour adds a third of one and a night pays it back, a long one faster; they read "hours owed, and the nights you still owe" and "paid back by sleeping longer than you need to".
- **Four things still step at midnight for somebody up:** nourishment is topped up to 76 and hygiene to 82 (meals and a shower before the day), fitness falls 0.18 and condition moves 2% of the way to its target. None is energy.
- **A nap is still paid as a short night** by `applySleep`: an hour at 15:00 costs 5.6 h of debt, 3.8 condition and 6.7 morale (6.8, 3.8 and 6.7 at 87). At 87 the next midnight still charged a full day after it, and the night after woke at energy 80.2; now it wakes at 100.
- **Limits of the calibration** (`tests/personality.test.ts`). The years on autopilot are sampled at 23:59:59, once the day has been charged; at 07:30 somebody on autopilot has only just come out of the unattended night, with stress at its floor of 14, which would hide what the day did. A second year steps to 07:00 every day, as Tomorrow Morning does, and holds every single trait and slider to the same bars at 25 and 60 (worst lowest condition 73.8, a light sleeper at 60). A third books a plan at 01:05 every night, reached on a skip to the morning, for light sleepers and the highly strung at both ages; measured, all 76 hold (worst 73.8):
  - What holds, at 25 and at 60, on a year of autopilot and on 60 nights of suggested sleep at 23:00 and at 01:00: every trait that moves the wellbeing model (31 of 35) and both extremes of the three sliders that move anything.
  - What holds at 60 on the suggested hours: the worst four-trait picks plus the worst sliders. That's tested at 23:00; a probe at 01:00 held too.
  - At 60 on **autopilot**, two of the three worst picks (the worst for sleepQuality and for stressGain) end the year with energy 0 and stress 30.0 and 30.5, over the stress bar of 25, and only just clear the condition bar of 65 (lowest 65.4 and 68.0). The worst moraleSwing pick passes (lowest 80.6, stress 9.8). Morale ends at 100 for all three. The same at 87 and 88; no test holds it.
  - **Age sets a ceiling on condition.** `ceilingAt(age).condition` (`src/engine/content/lifespan.ts`) is 79.1 at 70 and 64.3 at 81. From 81 (born 1944, or 1945 once past the June birthday) condition can't stay above 65 on any schedule. These are designed limits, not wear.
    - Tested at 70 and 81 (born 1955 and 1944), measured against `ceilingAt` every morning: every single trait and slider and the three worst picks, on 60 suggested nights at 23:00 and at 01:00, sit on the ceiling, with stress 0 and morale 100, told 9 to 14 h. A default character left alone for a year never ends a day below it.
    - On autopilot past 60 nothing else is held. A light sleeper falls as far as 15.4 under the ceiling at 70 and 4.7 at 81, where its morale ends the year at 33.9. The three worst picks reach condition 0 within the year at 70 and at 81, with stress 100 (95.5 to 96.0 at 87).
  - The year-long tests use birth years 2001, 1966, 1955 and 1944; the sleep-suggestion tests go to 1944. The Year Of Birth field has `min={1940}`, but validation only rejects an age over 95 at the start date, so a typed year back to about 1930 is accepted.
- **What the game still doesn't read** (`docs/UNBITTEN.md` keeps the full list):
  - The wellbeing model is read only by itself. Readiness is only displayed, on Home and in its own drill-down, and no decision uses it.
  - Four axes move nothing, and the money traits are only said back.
  - Most trait costs aren't charged, for example Early Riser at night and anything about other people.
  - Citizenship is written and never read.
  - Fitness only falls: it drops 0.18 a day and has no writer that raises it (`src/engine/systems/life.ts:397-404` says so). `docs/UNBITTEN.md` doesn't list it.
  - The tax engine only displays.
  - `recordOfficialResult` has no caller, so no `SlateOfficialResult` row is ever written.
  - `Costume`, `Order`, `Training`, `Mark` and `Running` are declared types with no table.
  - The Decision Center is built, but nothing raises a decision.
- **Speed:** only Play/Pause is offered. The fast speeds exist in code and can't be reached.
- **Start date:** creation validates `startDay`, but no field sets the start date. It is always 2026-01-05.
- **Old-line saves carry parts this build doesn't serve.** In the four test saves, 10 or 11 pending scheduled items are of kinds this build has no handler for (`sugar.day`, `company.renewals` and others); 6 or 7 of them come due in the first 30 days. Each is marked missed once when it comes due, and never re-armed. Most of their notifications route to `/workspace/business`, so Home offers "Go There" onto a "Not Built Yet" page. A decision the old `main` raised ("File The Reimbursement Claim", `company.claim_rebate`) would stay open: its button returns "Unknown command" inside an ok result (`src/engine/world/world.ts:54`), so no toast shows. Clearing routes and actions nothing serves would be a separate change.
- **`meta.migrationInProgress` is dead.** `openSlot` sets it and clears it before any write, so it never reaches storage and can't serve the recovery its doc promises.

**Stale words to fix:**
- `docs/DRILL-DOWN.md` says 25 look kinds (the code has 23), and one table row still says "Creation — Who You Are".
- `README.md`:
  - It says "`npm run validate` is the gate"; the gate is `npm run gate`.
  - Its test table leaves out five files.
  - Its calibration line claims "monotonicity, spread", which `tests/calibration.test.ts` doesn't test.
- `docs/UNBITTEN.md:97-99` says nothing calls `core/audit.ts`. The decision audit trail went in `5a5232e`. What's left is the `Historian` behind `Simulation.remember`, which every memory goes through. **Don't delete the file.**
- `src/ui/looks/place.tsx:277-278` print "out of 100" (Industry and Jobs), against the "82/100" rule. The test only catches "out of a hundred".
- `tools/plural-check.mjs` allowlists five deleted files (`scenes/flight.ts`, `systems/relationships.ts`, `workspaces/TravelWorkspace.tsx`, `systems/media.ts`, `systems/wardrobe.ts`) and one fragment, `${people} people` in `src/engine/index.ts`, that no longer matches anything.
- Stale comments:
  - `src/app/game-context.tsx`: "standard speed", shoots, pregnancy.
  - `src/engine/core/scheduler.ts`: bills, shifts, flights.
  - `.gitignore:19-23` says a probe must sit inside the repository for vite-node to resolve `@/engine`. Probes ran fine from a scratch directory with a config that sets the `@` alias.
- Dead code: `src/engine/content/names.ts` (nothing imports it) and `Logo` in `src/ui/components/primitives.tsx:190` (nothing calls it).
- `src/engine/decided.ts:37` lists `gb-eng-london`, but the UK's id is `uk` and London is `uk-eng-london`, so the filter silently drops that city from the decider sweep.
- `base44/config.jsonc` still calls SLATE "a life and film-industry simulator".
- `tools/base44-smoke.mjs:84` falls back to schema 42 when `SLATE_SCHEMA_VERSION` is unset, and `.env.example` shows 42 too. The guard only refuses a schema above its own, so this still passes, but the number is stale.
- `APP_VERSION` is 1.1.0 but `package.json` says 1.0.0.

**Portability (Windows):**
- `npm run audit` uses bash-only `&`, `sleep` and `kill %1`, and hangs under cmd.exe. To replace it, run the steps by hand or add a small `tools/audit.mjs` that uses Vite's `preview()` API.
- Five browser tools hardcode `/opt/pw-browsers/...`, and `tools/drill.mjs:96` and `:217` write to `/tmp`. Set `CHROMIUM_PATH` for now. The fix is to launch Playwright's own browser when the path doesn't exist, as `tools/text-caps.mjs:289-290` does with `existsSync`, and to use `os.tmpdir()` in `tools/drill.mjs`.
- There is no `.gitattributes`. Adding `* text=auto eol=lf` would make every fresh checkout LF. The index is already all LF, so no renormalization is needed. Files in an existing working tree keep CRLF until they're checked out again.
- `docs/BASE44.md` says to copy `.env.example` to `.env`, but `tools/base44-smoke.mjs` never loads `.env`. Use `node --env-file=.env tools/base44-smoke.mjs --slot 3`, or set `$env:` variables.
- `cohesion-walk/` output isn't git-ignored.

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

**In the Linux container this was written in.** It's ephemeral, so all of this goes when it's reclaimed:
- Local branches `adv`, `rebasetest`, `mine-item12-3b8616d` and `worktree-wf_*`, and five worktrees under `.claude/worktrees/`.
- Six commits exist only there:
  - Four are pre-gut feature work the owner ordered removed: `3b8616d` (selling a picture, 09-14), `a67f5c5` (the house), `653ca3d` (the company and the lot) and `ae94910` (the casting diary), all 09-16.
  - `17b9f2c` and `3e92e2f` are earlier drafts of `dc52d64` and `46d785b`, which are on this branch.
- Two worktrees (`wf_cc2a6ca8-f9d-3` and `-5`, both at `dc52d64`) hold uncommitted audition, tax, lot and place edits.
- The `wf_cc2a6ca8-f9d` workflow run cache, which the previous handoff called unrecoverable, is in this container's Claude project folder.
- A stale local `main` sits at `8c633d7` (09-04), and the reflog still reaches `4a00db8`.
- The owner decided on 2026-09-23 to let all of it go with the container, unarchived. Don't try to recover or push any of it.

**On the Windows machine** (per the previous handoff):
- `stash@{0}` (`227fa5a`, with the branch `teleport-stash-backup`). Per the previous handoff, it holds 23 files: +67 lines in `tools/cohesion-walk.mjs`, a context export, and screenshots under `cohesion-walk/`.
- `SLATE-CURRENT-CLEANUP-FULL-CONTEXT.txt`.
- Most likely, the whole dropped line up to `4a00db8`.

Keep all of them until the owner says otherwise.

**On GitHub but not on this branch:**
- 15 `base44/setup-*` branches and `claude/base44-app-code-zzeh07`.
- Three tags: `parallel-production-rebuild-deleted`, `production-system-before-deletion-2` and `production-system-before-deletion-3`.

---

## 12. Next steps, in order

1. **On Windows, run §3.** Confirm `core.autocrlf=false`, move the clone over without losing the old line, then `npm ci`. Confirm that the gate exits 0 with 523 tests and that the build passes.
2. **Done on 2026-09-23: this branch replaced `main`** (§0.2). Future work still goes on the working branch and reaches `main` by PR, with the owner. Never reset or force-push `main`.
3. **Done on 2026-09-23 (`20da24e` and `f10f1b0`): the schema collision is retired.** Both pins moved from 83 to 87, past the old line's numbers, and opening a slot runs `migrate()` whatever the number. Drafts were stamped `1.1.0/87`; since the rollover fix they are `1.1.0/88`, so old creation drafts are dropped without bumping `APP_VERSION`. Both commits reached `main` by PR, with the owner's approval.
4. **Windows hygiene commit:**
   - Add `.gitattributes` (`* text=auto eol=lf`).
   - Make the five browser tools fall back to Playwright's own Chromium, and `drill.mjs` use `os.tmpdir()`.
   - Replace the `audit` script with a Node version.
   - Ignore `cohesion-walk/`.
   - Run the gate.
5. **Done: the midnight rollover is fixed** (schema 88; §5, §10). The clock charges the hours awake from `awakeSince`; `lastSleptAt` is still the wake, stamped when the night is booked. `A_NORMAL_NIGHT` stayed at 8 × 0.82 and the suggestion now solves for the night that pays the day beside it. The tests above 60 measure against `ceilingAt`. The two things it left, the unattended night given to somebody awake at midnight and the gap of two midnights on a skip after a chosen night, were fixed by the night-alone fix, and two rounds of review before `main` found more, fixed in `bd5b2ef` and the commit after it (§5, §10). All of it reached `main` by PR on 2026-09-23, with the owner's approval.
6. **Correct the stale words** in §10: DRILL-DOWN counts and row, README gate line, test table and calibration claim, the UNBITTEN audit entry, `place.tsx` "out of 100", the plural-check allowlist, the stale comments, `decided.ts`'s London id, and `base44/config.jsonc`.
7. **Owner's direction for what comes next.** Something that reads the four idle axes, the money traits or citizenship would retire entries from `docs/UNWIRED.json` and `docs/UNBITTEN.md`. Take one `UNBITTEN` section at a time and prove each fix bites.
8. **Deploy** to Base44 only after the gate passes; any existing deployment needs this redeploy before it will store this branch's saves (§10). Then run `tools/base44-smoke.mjs` against it. Fix Restore Backup on Base44 first (§10): today it never takes on the server.

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
git push -u origin claude/slate-cleanup-e4apmx
```
