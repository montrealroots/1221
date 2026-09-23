# SLATE — Current Master Handoff

**Written:** 2026-09-23, in the Linux cloud container at `/home/user/1221` (bash; PowerShell is not installed there).
**Written for:** the next Claude Code session, running on the owner's Windows machine under PowerShell 7.
**Repository:** `github.com/yvcbcjhsy7-prog/1221`
**Working branch:** `claude/slate-cleanup-e4apmx`
**Verified at:** `36d2cea` ("Fit the new step names, and match Review to them"), the last code commit. Every commit after it on this branch is housekeeping for this handoff: `d0636b8` removes a scratch file, `acf5e10` adds this file, and later commits correct it.

This is the one handoff. The owner's `CLAUDE.md` names `SLATE_CURRENT_MASTER_HANDOFF.md` as the only file that passes between sessions. `PROJECT_HANDOFF.md` was retired in `b6f4061`, and keeping a single file stops two handoffs drifting apart. Earlier versions of this file are on GitHub `main` (as of `46f48f3`, 09-18) and, newer, at `4a00db8` (09-21), which is on no GitHub branch. Both describe the line the owner replaced on 2026-09-22 (see §1), so read them only as history.

When this file and the tree disagree, the tree wins. Correct this file in the same commit.

---

## 0. Read this box first

1. **Work on `claude/slate-cleanup-e4apmx`, not `main`.** Everything described here is on that branch, pushed, and level with GitHub.
2. **`main` and this branch have diverged.** GitHub `main` (`e139e06`, 2026-09-18) carries 67 commits from the line the owner chose to drop, merged through PR #15 and PR #16. Counting the five merge commits for PRs #12 to #16, this branch lacks 72 commits that `main` has. It forked from that line at `dc52d64` (2026-09-16) and has 14 code commits of its own since, plus the handoff commits from 09-23. Merging either way is an owner decision; don't do it on your own (§12).
3. **The Windows clone is probably still on the dropped line.** The previous handoff says the Windows branch matched the remote on 2026-09-21. The remote tip that day was `4a00db8`. **Don't `git pull` there**: it would try to merge about 157 commits of removed game into this branch. Follow §3, which moves the clone over without losing anything.
4. **Schema 83 means two different things.** Here, 83 is "personality restored". On `main`, 83 is the old family-and-film build, and the dropped line went up to 86. This branch and `main` both stamp creation drafts `1.1.0/83`, so a `main` save or draft at 83 opens here as if it were this build's. The dropped line's tip stamps `1.1.0/86`, so this build discards its drafts and refuses its saves as newer. Before playing this build locally, copy out and clear the `slate.*` keys in the browser's localStorage (§3, step 7).
5. **This branch has no `CLAUDE.md`.** The owner's blueprint lives on `main` and on the dropped line. Its standing rules still apply and are summarized in §7. Bringing it onto this branch is an open question for the owner (§12).

---

## 1. Snapshot

| Item | State |
|---|---|
| Branch | `claude/slate-cleanup-e4apmx`, pushed, 0 ahead / 0 behind `origin` |
| Last verified code commit | `36d2cea` (2026-09-22) |
| GitHub `main` | `e139e06` (2026-09-18, "Merge pull request #16"). Diverged; see §0.2. |
| Fork point with `main`'s line | `dc52d64` (2026-09-16, schema 79) |
| The replacement on 2026-09-22 | `abd4727` ("the gut") was pushed over `4a00db8` with the owner's explicit approval. That dropped 157 commits dated 09-17 to 09-21 from three other sessions. 67 of them reached `main` through PRs #15/#16. The other 90 (`46f48f3..4a00db8`) are on no GitHub branch. The owner's words: "destroy those 157 commits, the real work is what we're doing now." |
| Save schema | `SAVE_SCHEMA_VERSION = 83` (`src/engine/domain/model.ts:375`) and `SUPPORTED_SCHEMA_VERSION = 83` (`base44/shared/guard.js:25`). Move both together. |
| App version | `APP_VERSION = '1.1.0'` (`src/engine/world/bootstrap.ts`). `package.json` says `1.0.0`, and the two don't match. |
| Gate | `npm run gate` exits **0**: 28 test files, **478 tests**, and every gate tool. Run on 2026-09-23 at `36d2cea` and again at `d0636b8`. |
| Build | `npm run build` exits **0** (102 modules, JS 670.69 kB / 240.16 kB gzip). |
| Browser walk | A scratch Playwright script (not in the repo) walked all nine pages at 1440 wide against `vite preview`: **0 page errors**, and no `undefined`, `NaN` or `[object Object]` on the eight pages after the start screen. The start screen was only photographed. |
| Working tree | Clean, with everything pushed. |
| Tracked files | 624 at `36d2cea` |

---

## 2. What SLATE is right now

SLATE is an actor-and-actress life simulator at the start of a revamp. On 2026-09-22 the owner cut it to a person, a place, a calendar, the weather and money. Everything else was deleted instead of wired: the character sheet, the film career, casting and auditions, the family business, the family, and the land, house and security.

From the player's side:

1. **Startup.** Six loading stages, then the save slots. The footer reads "Version 1.1.0 · Schema 83".
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

The engine registers 8 commands, 3 scheduled kinds and 1 route. `tools/inventory.mjs --check` holds `docs/COVERAGE-MATRIX.md` to exactly that.

---

## 3. First steps on the Windows machine (PowerShell 7)

Each step below says what it does. Run them in order and read the output. Stop and ask the owner if anything differs from what is expected.

**Before anything: this file isn't on that disk yet.** The Windows working tree holds the old line's `SLATE_CURRENT_MASTER_HANDOFF.md` and `CLAUDE.md`. Their git procedures, including `git pull` and `git reset --hard origin/claude/slate-cleanup-e4apmx`, **must not be followed**: after the 09-22 replacement they would merge the dropped line into this one or throw it away. After Step 2's fetch, read this version with `git show origin/claude/slate-cleanup-e4apmx:SLATE_CURRENT_MASTER_HANDOFF.md`.

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
git log --oneline 36d2cea..origin/claude/slate-cleanup-e4apmx   # expect only handoff commits: d0636b8, acf5e10 and later corrections to this file
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

Git refuses a switch that would overwrite an untracked file. That refusal is safe; ask the owner before moving the file. Switching takes the old line's tracked files off the disk, including the old `CLAUDE.md` and handoff, and they stay on `archive/pre-gut-line`. The stash isn't touched, because it doesn't belong to a branch.

After the switch, `SLATE-CURRENT-CLEANUP-FULL-CONTEXT.txt` shows as `??`, because this line's `.gitignore` doesn't list it. Leave it, and never run `git add -A` or `git add .` in this clone. To hide it again without a commit: `Add-Content .git\info\exclude 'SLATE-CURRENT-CLEANUP-FULL-CONTEXT.txt'`.

**Step 5: Install and verify.** Read the exit code from the command, not from a pipe.
```powershell
node -v; npm -v      # the previous handoff recorded Node v24.20.0 and npm 11.19.0 there, where the old line's gate passed. This line was verified on Node 22.22.2 and npm 10.9.7 only.
npm ci
npm run gate *> "$env:TEMP\slate-gate.txt"; "gate exit=$LASTEXITCODE"
Select-String -Path "$env:TEMP\slate-gate.txt" -Pattern 'Test Files|Tests ' -CaseSensitive
npm run build; "build exit=$LASTEXITCODE"
```
Expect gate exit 0 and **478 tests in 28 files**. A different number means something differs between the machines. Investigate it before building anything.

**Step 6: Run it.**
```powershell
npm run dev          # http://localhost:5173
# or, for the built bundle:
npm run preview      # http://localhost:4173 (run it in a second terminal; it blocks)
```

**Step 7: Copy out, then clear, old saves before playing.**
The browser may hold saves and drafts from the old line (§0.4). `http://localhost:5173` and `http://localhost:4173` keep separate localStorage, so do this on each one you'll use. In the browser console, the first line copies every `slate.*` key to the clipboard (paste it into a file to keep it), and the second clears them:
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
- 179 of them lead up to `36d2cea`. The first is `62c30ca` ("Cut SLATE back to six things", 09-09) and the last code commit is `36d2cea` (09-22).
- The 09-23 handoff commits carry the same trailer, so the grep below returns 181 or more.
- 165 of them, everything up to `dc52d64`, are also on `main`.
- The 14 from 09-22, and the 09-23 commits, exist only on this branch.

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
| 09-23 | This handoff (`acf5e10` and its corrections), plus removal of the tracked scratch file `walk-tmp.mjs` (`d0636b8`) | Yes |

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
  - `simulation.ts` is the kernel. `advanceTo`/`advanceBy` is the only way the clock moves.
  - Also here: `time.ts`, `ledger.ts` (double-entry), `money.ts` (integer cents), `rng.ts` (seeded), `ids.ts`, `scheduler.ts`, `events.ts`, `text.ts` (Title Case and `plural`), and `deciders.ts`.
  - `performer.ts` came back after the gut, rewritten.
- **`engine/domain/`**:
  - `model.ts` holds every save type.
  - `citizenship.ts` was **rewritten**.
- **`engine/systems/`**:
  - `life.ts`: wellbeing, sleep and the day rollover.
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
- **`engine/index.ts`**: `registerAllSystems`, `createSave`, `loadSave`, `migrate`, `validateUniverse`, `refreshMeta`.
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

### Saving and migration

- **Local keys:** `slate.save.{n}`, `slate.backup.{n}` (the previous payload, kept on every write), `slate.draft.{n}` and `slate.favourites`.
- **Loading** (`src/ui/saves/SaveSlots.tsx`):
  - A save newer than 83 is refused.
  - An older one is backed up, run through `migrate()` and saved.
  - Every save then goes through `validateUniverse()`.
- **How `migrate()` works** (`src/engine/index.ts`):
  - The passes work from the **shape** of the data, not the version number.
  - `SHED` lists 18 removed person keys, from `attributes` through `secondCitizenshipId`.
  - Then it fills a missing title. A save from 72 to 79 still has one and keeps it. A save brought up to 80 from those lost it from the person but kept the premise record, so the player's title, a they/them pick included, is read back from there. Otherwise, as for a save created at 80 or one from before 72, the pronouns decide, and they/them comes back an actor.
  - Then it cleans or fills the personality, re-derives citizenship from the place of birth, and sets `careerLabel` to the title.
- **Creation drafts** are stamped `DRAFT_BUILD = "${APP_VERSION}/${SAVE_SCHEMA_VERSION}"`. A draft from another build is discarded.
- **Schema history.** The comment above `SAVE_SCHEMA_VERSION` (`model.ts:367-374`) covers 80 to 83:
  - 80: the gut.
  - 81: the performer title comes back.
  - 82: one citizenship, from the place of birth.
  - 83: personality and traits come back.
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

- **Waking drain** is 3.0 energy an hour, more with sleep debt.
- **Running on empty** charges stress only for the hours actually spent below energy 15.
- **A night's quality** = (0.82 − stress loss) × sleepQuality knob, minus 0.08 for a bedtime from 01:00 to 04:59, clamped to 0.28–1.
- **`suggestedSleep`** = (`A_NORMAL_NIGHT` (8 × 0.82) + debt × 0.1) / (quality × energyRecovery × `recoveryFactorAt(age)`):
  - Clamped to 6–14 h (`LONGEST_NIGHT`) and rounded to the half hour. When a commitment is sooner than that plus 1.5 h, it offers the time available minus 1.5 h (never under 3 h) and names the commitment.
  - With a commitment booked ahead, `sleepReason` names the biggest shortfall: debt, stress, depth, late, restores or age. Past 14 h it says so ("Not even fourteen hours …").
  - With a commitment booked, stress 0 and no debt, a default character is told 8 hours and "A normal night.".
  - With nothing on the calendar, which is how a new save starts, the reason is always "Your calendar’s clear, so sleep as long as you need." unless the need passes 14 h.
- **`unattendedNight`**, the night slept when the player doesn't choose one:
  - sound = clamp(7.8 − stress × 0.012, 5.4, 8.4).
  - hours = sound / √(min(1, sleepQuality) × min(1, energyRecovery)), clamped to 5.4–10.
  - The night runs at quality `sleepQuality × 0.95`, and the waking day is charged at 24 − sound.
  - That happens only when there's been no deliberate sleep in the last 20 h. After a night the player chose, the rollover charges the full 24 h (see §10).

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
- **Autopilot charges the waking day as a sound sleeper's (24 − sound), not 24 minus the hours actually slept.** When the lie-in also shortened the waking day, a poor sleeper came out better rested than a sound one (`3c704a8`).
- **Two step names:** "Dispositions & Traits" is the owner's name. The owner left the next page's name to the session, which chose "Interests & Background". Tab labels keep "&" with the word before it through a non-breaking space. From 700 px each tab is as wide as its name. In the container the row is one line only from 708 px; between 700 and 707 px, Review wraps onto a line of its own. Measure again on Windows, where fonts and scrollbars differ.
- **Screens must be true.** The Sleep dialog stopped promising bills, messages and other people, because none of those exist in this build.
- **This handoff brings the canonical file onto this branch, rewritten,** instead of adding a second `PROJECT_HANDOFF.md`, so only one handoff exists.

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
- **The owner's `CLAUDE.md` constraints** (on `main`, not on this branch):
  - Never apply, pop or drop the stash.
  - Never merge worktrees.
  - Never force-push the working branch. `CLAUDE.md` gives no exception. The one force-push, `abd4727` over `4a00db8` on 09-22, was an exception the owner ordered in person.
  - Don't merge to `main` without the owner.
  - Preserve before touching.
  - Explain a risky operation before doing it.
  - Make ordinary design calls yourself and report them, instead of opening with a menu.
  - Update this handoff when a phase completes and before a switch of account or machine.
  - Deploy to Base44 only after the gate passes.
  - Read the gate's exit code from the command, never from a pipe.
  - When a change makes a comment false, say what's no longer true, in the past tense. `tools/claims.mjs`, which checked this on `main`, isn't on this branch, so review it by hand.
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
| American spelling, in strings, comments and docs. | `tools/spelling.mjs` catches only its word list (colour, favourite, …) under `src/`, `tools/`, `tests/` and `docs/`. It misses -ise forms and never reads `README.md` or this file, so review the rest. `tools/typos.mjs` catches misspellings and doubled words. |
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

`d0636b8` then removed `walk-tmp.mjs`. That was a throwaway Playwright probe from `854b271` with a hardcoded Linux browser path. No file referenced it, and `main` already deleted it in `c341aba`.

---

## 9. Verification, 2026-09-23

| Check | Result |
|---|---|
| `npm run gate` at `36d2cea`, and again at `d0636b8` | **exit 0**. 28 files, 478 tests passed. title-case 0; labels 0; plurals 0; voice 3/40; tics within budget and 0 "Nothing" openers; doc-refs 69 paths in 6 docs, all present; wired 6, matching the baseline; deciders 1 (`weather.day`); spelling 0; typos 0; geo-check 252 countries, 170,911 cities; inventory 8 commands, 3 scheduled kinds, 3 events, 1 route. |
| `npm run build` | **exit 0** |
| Browser walk (a scratch Playwright script not in the repo, `vite preview`, 1440 wide) | Start screen, save slots, all five creation steps, Home, Calendar. **0 page errors**. No `undefined`, `NaN` or `[object Object]` on the eight pages after the start screen; the start screen was only photographed. |
| Secret scan of the handoff commit | No keys, tokens or `.env` values. `.env` is git-ignored. `.env.example` holds two empty placeholders (`SLATE_BASE44_URL`, `SLATE_BASE44_TOKEN`) and a commented-out optional `SLATE_SCHEMA_VERSION=42`. |

The handoff lives at the repository root, so the gate's text tools don't read it; its facts were checked by hand against git and the code.

---

## 10. Known issues and unfinished work

**Game model:**
- **The midnight rollover charges a full 24 h awake after a night the player chose to sleep.**
  - The cause: `liveTheUnattendedDay` (`src/engine/systems/life.ts:321-345`) is the only caller of `applyElapsedWellbeing`. When its 20 h guard skips the unattended night because the player slept (`lastSleptAt` is stamped at wake, line 153), `sleptHours` stays 0 and the rollover charges all 24 h.
  - Measured: waking at 09:00, the midnight rollover took energy from 94.9 to 22.9, a full day of drain after 15 h awake.
  - The sleep that follows restores it, and a normal night is calibrated as 8 h at quality 0.82 to pay for it.
  - The fix is to charge the hours actually awake since the last wake. **Don't fix it by moving the stamp to bedtime:** a 01:00 bedtime would then be 23 h old at the next midnight and get an unattended night on top of the real one. Recalibrate `tests/personality.test.ts` after.
- **Limits of the calibration** (`tests/personality.test.ts`):
  - What holds, at 25 and at 60, on a year of autopilot and on 60 nights of suggested sleep at 23:00 and at 01:00: every trait that moves the wellbeing model (31 of 35) and both extremes of the three sliders that move anything.
  - What holds at 60 on the suggested hours: the worst four-trait picks plus the worst sliders. That's tested at 23:00; a probe at 01:00 held too.
  - At 60 on **autopilot**, two of the three worst picks (the worst for sleepQuality and for stressGain) end the year with energy 0 and stress about 30, over the stress bar of 25, and only just clear the condition bar of 65 (lowest 65.4 and 68.0). The worst moraleSwing pick passes (lowest 80.6, stress 9.8). Morale ends at 100 for all three. A probe copying the test setup measured this; no test holds it.
  - **Age sets a ceiling on condition.** `ceilingAt(age).condition` (`src/engine/content/lifespan.ts`) is 79.1 at 70 and 64.3 at 81. From 81 (born 1945 or earlier, with the default June birthday) condition can't stay above 65 on any schedule: a year of the suggested hours bottoms out at 64.3, the same as autopilot. From 70 the ceiling is below the suggested-hours bar of 80. These are designed limits, not wear, so a test for older ages has to measure against `ceilingAt`, not a fixed 65 or 80.
  - The year-long tests use birth years 2001 and 1966. Only the sleep-suggestion tests go older (1955 and 1945). The Year Of Birth field has `min={1940}`, but validation only rejects an age over 95 at the start date, so a typed year back to about 1930 is accepted.
- **What the game still doesn't read** (`docs/UNBITTEN.md` keeps the full list):
  - The wellbeing model is read only by itself. Readiness is only displayed, on Home and in its own drill-down, and no decision uses it.
  - Four axes move nothing, and the money traits are only said back.
  - Most trait costs aren't charged, for example Early Riser at night and anything about other people.
  - Citizenship is written and never read.
  - The tax engine only displays.
  - `recordOfficialResult` has no caller, so no `SlateOfficialResult` row is ever written.
  - `Costume`, `Order`, `Training`, `Mark` and `Running` are declared types with no table.
  - The Decision Center is built, but nothing raises a decision.
- **Speed:** only Play/Pause is offered. The fast speeds exist in code and can't be reached.
- **Start date:** creation validates `startDay`, but no field sets the start date. It is always 2026-01-05.

**Stale words to fix:**
- `docs/DRILL-DOWN.md` says 25 look kinds (the code has 23), and one table row still says "Creation — Who You Are".
- `README.md`:
  - It says "`npm run validate` is the gate"; the gate is `npm run gate`.
  - Its test table leaves out five files.
  - Its calibration line claims "monotonicity, spread", which `tests/calibration.test.ts` doesn't test.
- `docs/UNBITTEN.md:97-99` says nothing calls `core/audit.ts`. The decision audit trail went in `5a5232e`. What's left is the `Historian` behind `Simulation.remember`, which every memory goes through. **Don't delete the file.**
- `tests/personality.test.ts:438-440` says the worst picks at sixty on autopilot "end flat". Measured, their morale ends at 100; what they lose is energy (0) and stress (about 30).
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
  - A guard from `main` (83) or from the dropped line (86) accepts schema 83, but it refuses every new save from this branch with "The save does not say what game it is". Those guards require `universe.premise`, which this branch no longer writes.
  - A guard older than 83 refuses on schema.
  - Once redeployed (guard at 83, no premise check), the deployment refuses saves at 84–86 from the dropped line.
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
- All of it was left alone, not archived. Pushing any of it under an `archive/` prefix is possible only if the owner asks.

**On the Windows machine** (per the previous handoff):
- `stash@{0}` (`227fa5a`, with the branch `teleport-stash-backup`). Per the previous handoff, it holds 23 files: +67 lines in `tools/cohesion-walk.mjs`, a context export, and screenshots under `cohesion-walk/`.
- `SLATE-CURRENT-CLEANUP-FULL-CONTEXT.txt`.
- Most likely, the whole dropped line up to `4a00db8`.

Keep all of them until the owner says otherwise.

**On GitHub but not on this branch:**
- `main` (`e139e06`), with `CLAUDE.md` and the old handoff.
- 15 `base44/setup-*` branches and `claude/base44-app-code-zzeh07`.
- Three tags: `parallel-production-rebuild-deleted`, `production-system-before-deletion-2` and `production-system-before-deletion-3`.

---

## 12. Next steps, in order

1. **On Windows, run §3.** Confirm `core.autocrlf=false`, move the clone over without losing the old line, then `npm ci`. Confirm that the gate exits 0 with 478 tests and that the build passes.
2. **Owner decisions.** These come before any merge or deploy:
   - **`main`:** should this branch become `main`? The options:
     - Open a PR from this branch and resolve every conflict in this branch's favor. That needs a merge commit, and the owner's approval.
     - Or leave `main` as the record of the old line.
     - Either way, don't merge, reset or force-push without the owner.
   - **`CLAUDE.md`:** bring the owner's blueprint onto this branch, corrected where it names things that are gone (`tools/claims.mjs`, `docs/ARREARS.md`, "seventeen checks")?
   - **Container leftovers:** archive the §11 commits, or let them go.
3. **Retire the schema collision.** At the next schema bump, jump past the old line's numbers (to 87, for example) and move `base44/shared/guard.js` with it. Every save from either line then runs through the shape-based `migrate()`. Consider bumping `APP_VERSION` too, so old creation drafts are dropped.
4. **Windows hygiene commit:**
   - Add `.gitattributes` (`* text=auto eol=lf`).
   - Make the five browser tools fall back to Playwright's own Chromium, and `drill.mjs` use `os.tmpdir()`.
   - Replace the `audit` script with a Node version.
   - Ignore `cohesion-walk/`.
   - Run the gate.
5. **Fix the midnight rollover** to charge the hours actually awake since the last wake, not by moving the stamp (§10). Recalibrate `A_NORMAL_NIGHT` and the personality calibration tests, and add a test above 60 measured against `ceilingAt`.
6. **Correct the stale words** in §10: DRILL-DOWN counts and row, README gate line, test table and calibration claim, the UNBITTEN audit entry, the "end flat" test comment, `place.tsx` "out of 100", the plural-check allowlist, the stale comments, `decided.ts`'s London id, and `base44/config.jsonc`.
7. **Owner's direction for what comes next.** Something that reads the four idle axes, the money traits or citizenship would retire entries from `docs/UNWIRED.json` and `docs/UNBITTEN.md`. Take one `UNBITTEN` section at a time and prove each fix bites.
8. **Deploy** to Base44 only after the gate passes; any existing deployment needs this redeploy before it will store this branch's saves (§10). Then run `tools/base44-smoke.mjs` against it.

---

## 13. PowerShell 7 quick reference

```powershell
git status -sb; git log --oneline -5; git stash list; git worktree list
npm run gate *> "$env:TEMP\slate-gate.txt"; "gate exit=$LASTEXITCODE"
npm run build; "build exit=$LASTEXITCODE"
npm run dev                                    # 5173
npm run preview                                # 4173, second terminal
node tools/wired.mjs                           # what nothing reads, report only
node tools/voice-check.mjs; node tools/tics.mjs   # text habits, report only
git log --oneline --grep=session_01Na7AwFNze8QYVWFfuUXBhY | Measure-Object -Line   # 181 or more: 179 to 36d2cea plus the handoff commits
git push -u origin claude/slate-cleanup-e4apmx
```
