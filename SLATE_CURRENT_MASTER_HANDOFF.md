# SLATE — CURRENT MASTER HANDOFF

**Written:** 2026-09-17
**Written on:** Windows 11, `C:\Users\sande\Downloads\1221-GIT` (PowerShell 5.1, Node v24.20.0, npm 11.19.0)
**Purpose:** transfer SLATE from Claude Account 1 (Apple) to Claude Account 2 (Google) with zero prior conversation history.
**Author's constraint while writing:** no application code modified, no commit, no push, no stash applied/popped/dropped, no worktree merged, workflow not resumed.

---

## ⚠️ READ THIS BOX FIRST — FIVE PREMISES IN THE HANDOFF REQUEST ARE WRONG

The request that produced this file was written from the memory of a session that ran on a **different machine** (a Linux remote environment at `/home/user/1221`). This file was written on **Windows** at `C:\Users\sande\Downloads\1221-GIT`. Those are two different clones, and five stated premises do not survive contact with this machine.

| Premise in the request | Reality here | Evidence |
|---|---|---|
| "`dc52d64` is reported as local and remote HEAD" | `dc52d64` is **remote** HEAD only. **Local HEAD is `4e720c9`.** `dc52d64` was not even an object in this clone until I fetched. | CONFIRMED BY GIT |
| "main checkout is currently clean" | Working tree has **one untracked file** (`SLATE-CURRENT-CLEANUP-FULL-CONTEXT.txt`) and **one stash**. Tracked files are unmodified. | CONFIRMED BY GIT |
| "nothing is currently unpushed" | True, but the meaningful fact is the opposite direction: local is **0 ahead, 87 behind** the remote. | CONFIRMED BY GIT |
| "the work is preserved under `.claude/worktrees/wf_cc2a6ca8-f9d-*`" | **There is no `.claude` directory on this machine at all.** Zero workflow worktrees exist here. | CONFIRMED BY GIT + filesystem |
| "four started sections had commits in their own worktrees; one remained at base" | The session's own `git worktree list` shows **three** worktrees with commits and **two** at base. The "four / one" split was an error I made in the session's closing message. | CONFIRMED BY CURRENT SESSION (transcript) |

**The single most important consequence:** the paused workflow's five in-flight worktrees, its three worktree commits, its script, its journal and its cached agent results existed **only on the Linux machine**. They are **not on the remote** and **not on this machine**. They are, as far as this clone can prove, **unrecoverable**. See §8 and §20.

**The good news:** all nineteen commits of the cleanup, and 87 commits total, are safe on the remote at `dc52d64`. Nothing committed is lost. See §2.

---

## ✅ ACCOUNT 2 VERIFICATION — 2026-09-17 — `dc52d64` IS NOW LOCAL HEAD, FULLY VALIDATED

Account 2 (Google) picked this handoff up the same day it was written, on the same machine and checkout described above. Everything below is the result of Account 2 independently re-deriving every claim in this file against the live repository — not trusting the text above — before touching anything, then, on explicit instruction, fast-forwarding and validating. **No application code was modified. No commit. No push.**

**Independent verification, before any action was taken:** every git-state claim in the box above and in §2, §7, §8, §9, §10 was re-checked from a cold read (`git rev-parse HEAD`, `git ls-remote`, `git status --short`, `git stash list`, `git worktree list`, `git cat-file -t` on the three lost worktree commit hashes, `git merge-base --is-ancestor`, a diff of the stash against its parent). **Every claim held exactly as written — zero discrepancies found.** This included the corrected "three worktree commits / two at base" figure and the confirmation that `a67f5c5`, `653ca3d`, and `ae94910` are not valid objects in this clone or on the remote.

**What Account 2 then did, in order, all with explicit go-ahead:**

1. **Protected everything first.** Created `teleport-stash-backup` pointing at `227fa5a` (still present, untouched), and copied `SLATE-CURRENT-CLEANUP-FULL-CONTEXT.txt`, `SLATE_CURRENT_MASTER_HANDOFF.md`, and `PROJECT_HANDOFF.md` out to `%USERPROFILE%\slate-backup\` before doing anything that could remove `PROJECT_HANDOFF.md` from the working tree.
2. **Fast-forwarded.** `git merge --ff-only origin/claude/slate-cleanup-e4apmx`. Clean fast-forward, no conflicts, no orphaned work. **Local HEAD is now `dc52d64f69ea501829d2b276366ebffb4e1c7d07`** on branch `claude/slate-cleanup-e4apmx`, matching remote exactly (0 ahead / 0 behind).
3. **Installed and validated:** `npm ci` succeeded. `npm run typecheck` → **exit 0**. `npm run test` → **exit 0, 45 test files, 1,253 tests, all passing** — matching the number this file claimed for the Linux session's own last gate run. `npm run gate` → **first run failed, exit 1**, on the `voice-check` step only (41 uncontracted forms found against a budget of 40; every other one of the 14 checks, including typecheck/lint/test, passed).
4. **Diagnosed the gate failure rather than accepting or dismissing it.** Confirmed `voice-check.mjs` only scans `.ts`/`.tsx` (so the untracked handoff files were not the cause), then found this machine's Git for Windows has `core.autocrlf=true` set at the **system** level (`C:/Program Files/Git/etc/gitconfig`), with no repo `.gitattributes` to override it, and that tracked source files were checked out with **CRLF** line endings even though the blobs stored in git are pure LF (confirmed via `git cat-file -p` and `git show`). `voice-check.mjs` includes a line-position-sensitive regex (a `NOT_BEFORE_CLAUSE_END` lookahead) that miscounts by exactly one match under CRLF — consistent with 41 vs. the correct 40.
5. **Fixed it, scoped to this repo only.** Set `core.autocrlf false` in `.git/config` (**local scope only** — the system-level default of `true` was left untouched, so this does not affect any other repository on this machine). Getting already-checked-out files to actually pick up the new setting required `git rm --cached -r .` followed by `git reset --hard HEAD` — a plain `git checkout` / `git checkout-index -f` **did not** rewrite the files despite the corrected config (a known git quirk: checkout can skip rewriting a path it considers already up to date, even after a line-ending setting changes; unstaging first forces the rewrite). Verified via raw byte inspection (`.NET ReadAllBytes`, independent of any shell's own text-mode handling) that the working tree is now genuinely LF-only, byte-identical in content to the git blobs.
6. **Re-ran voice-check and the full gate.** `node tools/voice-check.mjs --check` → **40 places, exit 0** (down from 41 — confirms the theory exactly). Full `npm run gate` re-run → **exit 0**, all 14 checks passing, including `wired.mjs` (51 declared dead words, matching `docs/UNWIRED.json`), `dials.mjs` (8 dials nothing moves over a played 25-year career, matching the blessed baseline), and `deciders.mjs` (all 16 registered draws correctly owned).

**Conclusion: the gate-1 result was a Windows-checkout artifact (CRLF vs. the LF the code was authored and validated in on Linux), never a regression in the code at `dc52d64`.** The code itself is exactly as green as this file already claimed. **Do not re-litigate the voice-check budget or re-investigate this CRLF issue** — it is diagnosed, fixed at the repo-local config level, and confirmed by re-running the exact check that failed.

**What is unchanged and still true:** `stash@{0}` (commit `227fa5aaccca381835257824988fd616147ad51c`, short `227fa5a`) and the `teleport-stash-backup` ref pointing at it remain **completely untouched** — no apply, pop, drop, or clear. The recovery gaps in §20 are **unchanged and still gaps**: the three paused-workflow worktree commits (`a67f5c5`, `653ca3d`, `ae94910`) and the `wf_cc2a6ca8-f9d` run cache (script + journal + cached agent results) remain confirmed absent from this machine and the remote, and remain recoverable only if the original Linux environment is still reachable. Nothing done today changes that assessment.

**What today's session did NOT do, and has not started:** none of the nine open UNBITTEN sections (house rot, company money, note magnitude, who-is-free, tax engine, production calendar, save dead shapes, three one-way money rules, awards-as-specification) has been touched, built, measured, or landed. **All nine remain fully open exactly as §7 describes.** Today was validation only — no application code was written or changed, nothing was committed, nothing was pushed. Harmless untracked scratch files (`gate.log`, `gate2.log`, `gate.exit`, `gate2.exit`, `test.log`, `test.exit`, `typecheck.log`) were left in the working tree from this validation; they are not gitignored but are not referenced by anything and can be deleted freely.

**Account 2 status: has sufficient context to continue independently, without Account 1.** The handoff has now survived two independent verification passes — Account 1's own self-correction while writing it, and Account 2's from-scratch re-derivation of every claim plus a real fast-forward and full gate run. **The first UNBITTEN section was house rot** (`property.condition` in `src/engine/systems/life.ts` has exactly one writer, a daily subtraction, and nothing that ever raises it — measured this cleanup as half the cause of the career-wide reliability collapse; the recommended order is: read the section's live code and the corresponding page in `docs/UNBITTEN.md`, verify the page against current code since it is demonstrably stale in places, build, measure paired over 25 years and multiple seeds, mutation-test, gate, then commit that one section on its own).

---

## ✅ ACCOUNT 2 — ALL NINE UNBITTEN SECTIONS WORKED, 2026-09-17

**Branch `claude/slate-cleanup-e4apmx` is nine commits past `dc52d64`.** Gate exit 0 on every one of them before it was committed, 1,272 tests, 47 files, dead-word floor 51 and dials 8 both unmoved. One section per commit, each independently droppable.

| # | Section | Commit | What it was |
|---|---|---|---|
| 1 | house rot | `0c91616` | Built `life.upkeep` — the second direction for a dial with one writer |
| 2 | who-is-free | `f854485` | `freeToWork` delegates the player to the diary |
| 3 | save dead shapes | `5213162` | 199 lines across eight record shapes deleted |
| — | *business instrument* | `d558a9b` | `playABusiness` — **prerequisite**, see below |
| 4 | tax engine | `676ac27` | Costed income tax; deleted the vehicle fee tables |
| 5 | three one-way money rules | `9e741fd` | Quote proven dead for the player; interest freeze explained |
| 6 | note magnitude | `dc99c92` | Measured: two identical buttons and one that never wins |
| 7 | awards | `30e175e` | `docs/AWARDS.md` — a costed specification, not a build |
| 8 | production calendar | `692a82f` | Two of three claims already fixed |
| 9 | company money | in `d558a9b` | Unmeasurable until the instrument existed |

### The instrument is the part to read first

`tests/played.ts` played the acting career and nothing else, so **every company claim on `docs/UNBITTEN.md` was unmeasurable** — over twenty-five years of `playACareer` the company's cash account never leaves nought, because the player never options anything. `playABusiness` runs the pipeline with the game's own commands.

**It found two bugs in itself before it found anything in the game, and both returned clean-looking rows of zeroes rather than failing.** The first bound errors-and-omissions cover before optioning material, which the engine correctly refuses, so it made nought pictures for twenty-five years on every seed. The second read `companies[0]` — Sugar Land, the sugar estate, not the pictures company — and watched an account that does not exist. Either would have shipped as a confident finding. `tests/instrument.test.ts` holds both shut.

### What the page got wrong

**Four of the eight entries checked were wrong or stale, and almost always in the direction of being less alarming than the truth.**

- The company overdraft is **−€9,875,275**, six to ten times the −€761,000 recorded, and reachable in **week 35**. "Goes negative silently" is false: `sayIfItWentUnder` notifies.
- **Corporation tax does not exist** — there is no corporate rate table at all. It was recorded as "inert", which is a different and much smaller job.
- The room's second decision is **worse** than "four buttons, three decoys": there are three buttons, `touch` and `good` split six seeds 3–3 within noise, and `far` wins nothing.
- Airdates, the booking board, and the estate screen's "blame" copy had **already been fixed** by earlier work.

### Unbuilt on purpose — these are the owner's

1. **Whether income tax charges.** Costed: **34.0% effective, €605,928 of a €1,781,243 career**, six seeds. The machinery exists and is correct; it only has to be wired.
2. **Whether the family's patience is finite.** The overdraft above is the number.
3. **Whether `far` pays off anywhere**, and whether `touch`/`good` get pulled apart.
4. **Whether `prestige` gets a reader or gets deleted** — `docs/AWARDS.md` §3, piece three.
5. **Whether the player's fee is floored at their quote.** `person.quotes` is written 96–115 times a career and **read by nothing**; wiping it leaves a career bit-identical. It was **kept against The One Rule** because it is the input this decision needs. If the answer is no, delete it.
6. **What the seed is deciding in the business.** The same pipeline ends a career holding between **€129,000 and €197 million** and gets **7 to 36 pictures** made, on seed alone.

### Also true

- `universe.history` has **one writer** (the sleep command) and holds **nought rows** after twenty-five played years, because a career that only acts never presses Sleep. No screen reads it. The audit trail's shape, with a writer that works.
- `core.autocrlf=false` is set **local to this repo only**; the system default is untouched. Without it `voice-check` miscounts by one and the gate fails on a CRLF artifact.
- Git identity is set repo-locally to `Claude <noreply@anthropic.com>`, matching all 87 prior commits.

---

# 1. SLATE PROJECT IDENTITY

**SLATE is an actor-and-actress life simulator.** The player is the *talent* — not the studio boss, not the booker. That single choice is the project's thesis, because every reference game in the genre puts the player on the buying side.

**Evidence:** CONFIRMED BY CODE (`README.md`, `docs/DEPTH.md` at `dc52d64`).

### The premise is structural, not cosmetic

"Actor" and "actress" are two names for one craft and SLATE treats them as equals: neither is the default, neither is the special case, every label about a person uses their own word. This is not a title-screen line — the premise is stored in `SaveUniverse.premise`, mirrored onto `meta.performerTitle` and onto the `performer_title` / `premise` columns of the `SlateSave` row; `validateUniverse` fails a save that lost it, `migrate` writes it into older saves, and `base44/shared/guard.js` refuses a server write without it. `tests/premise.test.ts` holds the test that matters most: two saves built identically apart from the title come out the same in **every number** and differ only in **words**.

### The depth standard

From `docs/DEPTH.md` (885 lines): SLATE must be a **deeper simulation than *Total Extreme Wrestling* and *The Movies* combined**, with *Hollywood Mogul* as a third reference for the film *business*. Sixteen axes, a stated build order, and a measured distance between the bar and where the build is.

### THE ONE RULE (the project's governing law)

> **A declared word with nothing that reads it is worse than no word at all.**

This is first in `docs/DEPTH.md` because it is the failure the project is most exposed to: the cheapest way to fake depth is to declare the vocabulary without building the systems — a field per axis, a modifier key per effect, an id namespace per noun. It reads deep to anyone scrolling the source and plays as nothing.

### THE FALSIFIABILITY TEST (how every fix is judged)

> Change an input. Does the **outcome** change, or only the **sentence**?

If only the sentence changes, the thing is decoration and must be said to be decoration. Every fix is additionally required to be shown to bite: move the input, watch the outcome move, and prove a test would have caught its absence.

### Simulation philosophy (all CONFIRMED BY CODE via `README.md`)

- **One clock.** Exactly one world clock and one path that moves it: `Simulation.advanceTo`. Real-time play, sleeping and skipping all route through it, so the world cannot be in two times at once. Time is a UTC instant plus an IANA zone; wall-clock arithmetic goes through `engine/core/time`, which handles the spring-forward gap and autumn overlap explicitly. **Nothing reads `Date.now()`** — lint fails the build if it tries.
- **Money comes from transactions.** Balances are derived, never set. `Ledger.post` refuses a transaction whose postings do not sum to zero and refuses fractional cents, so conservation is structural. `Ledger.audit()` recomputes every balance from postings and reports drift.
- **Outcomes are deterministic.** Every draw comes from a named, seeded stream; the same save replays to the same universe. Draw ownership is enforced by `tools/deciders.mjs` and `src/engine/decided.ts`.
- **Failure is transactional.** A command that throws restores the universe exactly as it was, writing old values back into existing objects so a reference taken before a command is still the right object after.
- **A long save stays loadable.** Records that grow every tick have retention rules; `tests/endurance.test.ts` holds it.

### UI philosophy

Single-page React app. The **entire simulation runs in the browser**; the server is only the authority on what may be stored. It plays with no backend at all (local storage) and gains server-checked persistence on Base44. The UI is built around **"looks"** — a uniform drill-down system (`src/ui/looks/`) where any subject resolves to a page with named "ways" out of it, so the world is navigable rather than menu-driven. Prose is load-bearing: comments and player-facing copy state mechanisms and numbers, and are gate-enforced for voice, spelling, title case and habit budgets.

### Major functional domains (as they exist at `dc52d64`)

1. Character creation + geography/world map + portraits
2. Home hub, calendar, weather, time controls
3. The performer's career: auditions, the audition room, casting, roster memory
4. The family business: company, incorporation, registrations, guilds, policies, posts
5. The lot: sound stages, bookings, overhead, utilisation, rate card
6. Production: development, greenlight, plans, periods, crew, trouble, inventory/cutting rooms
7. Selling: windows, the waterfall, buyers
8. Money: ledger, finance, tax content, VAT reclaim, the Icelandic rebate, sugar-estate income
9. Life/wellbeing: readiness, sleep, condition, ageing, maturity, standing, family bonds
10. Persistence: local + Base44 adapters, migration, validation

---

# 2. CURRENT REPOSITORY IDENTITY

| Field | Value | Evidence |
|---|---|---|
| Full local path | `C:\Users\sande\Downloads\1221-GIT` | CONFIRMED BY GIT |
| GitHub repository | `https://github.com/yvcbcjhsy7-prog/1221.git` | CONFIRMED BY GIT (`git remote -v`) |
| Remote name | `origin` (fetch and push identical) | CONFIRMED BY GIT |
| Current branch | `claude/slate-cleanup-e4apmx` | CONFIRMED BY GIT |
| **Current LOCAL HEAD** | **`4e720c9bec3cd5b5c69015862345fcbf1888202c`** — "Make the nine doors a rule instead of a description", dated **2026-09-12 19:02:27 -0500** | CONFIRMED BY GIT |
| **Current REMOTE HEAD (branch)** | **`dc52d64f69ea501829d2b276366ebffb4e1c7d07`** — "Six dead words on a person, and one question kept because somebody answers it" | CONFIRMED BY GIT (`git ls-remote`) |
| Upstream tracking | `origin/claude/slate-cleanup-e4apmx` | CONFIRMED BY GIT |
| **Ahead / behind** | **0 ahead, 87 behind** | CONFIRMED BY GIT (`git rev-list --left-right --count`) |
| Fast-forwardable? | **Yes.** `4e720c9` is a verified ancestor of `dc52d64` | CONFIRMED BY GIT (`git merge-base --is-ancestor` → true) |
| Local `main` | `0d7dc7a` (2026-09-10) — "Merge pull request #13 from yvcbcjhsy7-prog/claude/slate-cleanup-e4apmx" | CONFIRMED BY GIT |
| Remote `main` | `4df027d593d8c9dfabb4ce574275fa7a2ba2f1d3` — also ahead of local | CONFIRMED BY GIT |
| Clean / dirty | **Tracked files clean. One untracked file. One stash.** | CONFIRMED BY GIT |
| Untracked file | `SLATE-CURRENT-CLEANUP-FULL-CONTEXT.txt` (205,415 bytes, 3,268 lines) | CONFIRMED BY GIT |
| Worktrees | **One** — the main checkout only | CONFIRMED BY GIT (`git worktree list`) |
| Stashes | **One** — `stash@{0}` = `227fa5aaccca381835257824988fd616147ad51c` | CONFIRMED BY GIT |

**Note:** I ran exactly one write-adjacent git operation while producing this file: `git fetch origin`. It updates remote-tracking refs only — it does not move branches, touch the working tree, commit, push, or affect the stash. It was necessary to prove that the 25 local commits visible in `git log` are contained in the remote rather than a divergent line at risk of being lost. That proof is the "0 ahead / 87 behind" row above.

Other remote branches present (14 `base44/setup-*` automation branches plus `claude/base44-app-code-zzeh07`) are unrelated to this work.

---

# 3. CURRENT ARCHITECTURE

*Describing `dc52d64` (remote HEAD) — the authoritative code. The local checkout is 87 commits behind this.* **Evidence: CONFIRMED BY CODE via `git show dc52d64:...`.**

**689 tracked files.** Breakdown: `src/engine` 78 · `src/ui` 36 · `src/app` 2 · `tests` 48 · `tools` 26 · `docs` 16 · `base44` 14 · `public` 454 (gazetteer data).

```
src/
  main.tsx                    React entry
  app/
    SlateApp.tsx              top-level app shell + routing
    game-context.tsx          React context: the live Simulation, command dispatch, toasts
  styles/app.css              all styling
  engine/                     THE SIMULATION — no React, no DOM
    index.ts                  public engine API: quickSave, createSave, loadSave,
                              migrate, validateUniverse, registerAllSystems
    decided.ts                the decider registry (every named rng stream + what it reads)
    core/
      simulation.ts           Simulation: the clock, commands, schedule, snapshots/rollback
      scheduler.ts            ScheduledItem + the advance loop
      time.ts                 UTC instant + IANA zone arithmetic (DST-aware)
      rng.ts                  seeded streams (rngFor), clamp, remap
      ledger.ts               double-entry ledger; postings must sum to zero
      money.ts                Money = integer cents
      ids.ts                  namespaced id factory (ID_NAMESPACES, 20 entries)
      audit.ts                HISTORY ONLY — the audit/explainability half was deleted
      deciders.ts             the sweep that proves a decider reads its declared inputs
      events.ts, taste.ts, text.ts, performer.ts, realclock.ts, sun.ts
    domain/                   record shapes
      model.ts                SaveUniverse and most records
      company.ts              company/project/role/post/policy shapes
      attributes.ts           attribute sheet (base + exceptions fold)
      citizenship.ts          passports (work-permit rule deleted)
    content/                  authored tables and constants (29 files)
      audition.ts casting.ts crew.ts lot.ts making.ts selling.ts incorporation.ts
      tax.ts rebate.ts sugar.ts lifespan.ts (87 lines, 2 exports) prodigy.ts
      personality-traits.ts geography.ts world-data.ts holidays.ts climate.ts ...
    world/                    the systems that mutate the universe (21 files)
      bootstrap.ts            builds a new universe
      audition.ts             the audition room, roster memory, being cast
      casting.ts              parts, offers, quotes, seating people
      company.ts              incorporation, registrations, guilds, policies, posts
      lot.ts                  stages, bookings, overhead, the family's cover
      making.ts               development, greenlight, periods, the cut
      selling.ts              buyers, windows, the waterfall
      diary.ts                ONE answer to "what has the player, and until when"
      crew.ts periods.ts plans.ts rebate.ts vat.ts standing.ts sugar.ts
      trouble.ts inventory.ts maturity.ts family.ts place.ts calendar.ts world.ts
    systems/
      life.ts                 daily rollover, sleep, readiness, wellbeing
      finance.ts              money systems
      weather.ts              weather per day
    persistence/
      adapter.ts              the persistence interface
      local.ts                localStorage adapter (no backend needed)
      base44.ts               Base44 adapter (server-checked)
  ui/
    looks/                    THE DRILL-DOWN SYSTEM (16 files)
      Look.tsx registry.ts subject.ts all.ts index.ts words.ts
      business.tsx estate.tsx money.tsx family.tsx day.tsx place.tsx
      plans.tsx standing.tsx weather.tsx wellbeing.tsx attention.tsx
    workspaces/               the task surfaces
      AuditionsWorkspace.tsx BusinessWorkspace.tsx CalendarWorkspace.tsx
      WorkspaceRouter.tsx cell.ts fix.ts
    screens/Home.tsx          the hub
    creation/                 CharacterCreation + LocationPicker + WorldMap + portraits
    shell/                    GameShell, TimeControls, destinations
    saves/SaveSlots.tsx       three isolated save slots
    startup/StartupSequence.tsx
    components/primitives.tsx
tests/    45 *.test.ts + doors.ts + played.ts + fakes/base44-sdk.ts
tools/    26 .mjs gate tools and builders
docs/     16 files — DEPTH, UNBITTEN, ARREARS, COVERAGE-MATRIX, DRILL-DOWN,
          ROOM, STYLE, BASE44, UNWIRED.json, drill-down-research.json,
          research/{KINDS,LIFESPAN,LOT,PIPELINE,STAGE,README}.md
base44/   config.jsonc + 3 entities + 4 functions + shared/guard.js
public/   454 files — the world gazetteer (per-country city data) + map topojson
walk-tmp.mjs   STRAY 49-line Playwright scratch script at repo root (see §14)
```

### Data flow

```
player action
  → React (workspaces / looks) calls run(kind, payload) from game-context
  → Simulation.execute(command)        snapshot taken; handler mutates universe
  → on throw: universe restored in place; CommandResult.ok = false → toast
  → on success: events dispatched, schedule re-armed
time moves
  → Simulation.advanceTo(target)       the ONLY path that moves the clock
  → due ScheduledItems run their handlers in priority order
  → a handler that throws is caught, marked 'missed', and NOTIFIED
     (it is NOT written to engineFailures — see §14, this hid a whole
      system failing for an entire measurement run)
money
  → sim.income / sim.expense → Ledger.post (must sum to zero)
  → balances always derived, never stored
persistence
  → adapter.save(universe) → local storage OR Base44 function
  → Base44 guard.js refuses a write missing the premise
  → on load: migrate() then validateUniverse()
```

### Testing & gating

`npm run gate` is the whole bar — 14 checks, and it includes `npm run validate` (typecheck + lint + full suite). The prose tools are part of the gate and they do fail builds: `title-case`, `label-sweep`, `plural-check`, `both-titles`, `voice-check` (uncontracted-form budget, currently 40), `tics` (habit budgets), `doc-refs`, `wired` (dead-word floor, held against `docs/UNWIRED.json`), `dials` (dials nothing moves, plays a 25-year career), `deciders`, `spelling` (British→American), `typos`, `geo-check`, `inventory`.

### Base44 integration

Deployment target providing server-checked persistence. Three entities (`SlateSave`, `SlateCommandReceipt`, `SlateOfficialResult`), four functions (`saveUniverse`, `loadUniverse`, `clearSlot`, `recordOfficialResult`), and `shared/guard.js` which is the server-side authority. Contract pinned by `tests/base44-contract.test.ts` and `tests/base44-adapter.test.ts`, smoke-tested by `tools/base44-smoke.mjs`, deployed via `npm run base44:deploy`.

---

# 4. COMPLETE IMPORTANT FILE INDEX

*All at `dc52d64`. "Recent work" refers to the 19-commit cleanup of 2026-09-16 (§6).*

## Engine core

| Path | Purpose | State | Dependencies | Recent work | Known risks |
|---|---|---|---|---|---|
| `src/engine/core/simulation.ts` | The clock, command dispatch, snapshot/rollback, schedule loop | Live, central | scheduler, ledger, ids, rng, audit | `audit()` method and `RULES_VERSION` deleted; `APPEND_ONLY_LOGS` narrowed to 3 | A scheduled handler that throws is caught + notified but NOT logged to `engineFailures`; `sim.execute` returns `{ok:true}` when a handler *returns* `{ok:false}` — a real trap, see §14 |
| `src/engine/core/audit.ts` | **History only.** The audit/explainability half was deleted | Live, halved | time | Rewrote as history-only; removed `AuditRecord`, `AuditFactor`, `recordAudit`, `auditFor`, `auditsFor`, `redactForPlayer`, `buildFactors`, `MAX_AUDITS` | **`README.md` still describes the deleted half as present** — README is stale here |
| `src/engine/core/ids.ts` | Namespaced id factory | Live | — | `audit` namespace removed → 20 namespaces | Prose inside counts the namespaces; keep in sync |
| `src/engine/core/deciders.ts` | Proves a decider actually reads its declared inputs | Live, hardened | rng | `sweepOne` rewritten: it pooled all six samples into one set, so an input a decider *entirely ignored* still passed | The fix is load-bearing; do not revert it |
| `src/engine/core/ledger.ts` | Double-entry ledger | Live, stable | money | — | `sim.expense` has **no balance check** (§14) |
| `src/engine/core/time.ts` | UTC+zone arithmetic, DST-aware | Live, stable | — | — | Nothing may read `Date.now()` |
| `src/engine/core/rng.ts` | Seeded streams | Live, stable | — | comment corrected (no longer claims audits) | — |
| `src/engine/decided.ts` | Decider registry | Live | core/deciders | `audition.house` decider added | `tools/deciders.mjs` checks draw ownership at **file** granularity — a new stream in an already-owning file slides under it |

## Engine domain & content

| Path | Purpose | State | Recent work | Known risks |
|---|---|---|---|---|
| `src/engine/domain/model.ts` | `SaveUniverse` + most records | Live | `audits` table removed; `BookingKind` narrowed to `shooting\|prep` | UNBITTEN claims "366 dead lines"; a closure check measured **169 across eight names** and found the named regions contained **live** types (`Structure`, `SoundStage`, `Booking`) — a region-cut breaks the build |
| `src/engine/domain/company.ts` | Company/project/role/post/policy shapes | Live | `Signature.depositCents`, `Holding.optionFeeCents`, `Holding.purchasePriceCents` deleted (written, read by nothing); hands docstring corrected | `Post.monthlyCents` / `Policy.premiumCents` deleted in the wellbeing sweep — verify readers |
| `src/engine/domain/citizenship.ts` | Passports | Live, reduced | `canWorkIn`, `workRefusalFor`, `countryOfCity` deleted — no callers | — |
| `src/engine/content/lifespan.ts` | Age ceilings + recovery | **87 lines, 2 exports** (was 540 / 48) | 43 unreachable exports removed; research preserved verbatim in `docs/research/LIFESPAN.md` | Deleting by import count rather than transitive closure breaks `systems/life.ts` in 3 places |
| `src/engine/content/audition.ts` | Room constants | Live | `OF_THE_ROOM = 0.55` named (was a bare literal); `HOUSE_HOLDS = 0.7` added | `A_WORKING_WEEK.spentAt = 38` is measurably unreachable late-career (§14) |
| `src/engine/content/lot.ts` | Stage rate card, overhead | Live | `RATE_SHARE.hold` deleted — proven unread by a throwing Proxy over 18 played years + the whole suite | — |
| `src/engine/content/personality-traits.ts` | Traits + `systemMods` | Live | 3 traits' copy corrected — they sold a travel penalty the build could not apply | 47 of 53 modifier keys still read by nothing |
| `src/engine/content/tax.ts` | Tax tables | **Correct and almost entirely inert** | — | Read by one place card. Nothing taxes a fee, wage or profit |

## Engine world

| Path | Purpose | State | Recent work | Known risks |
|---|---|---|---|---|
| `src/engine/world/diary.ts` | **The single answer** to "what has the player, and until when" | Live, extended | `heldUntil` added: a part scoped to one part of a title (guest/day) holds fewer weeks than the whole run. Calendar is written FROM this | `whatHasThem` is keyed on the player internally but is called inside a loop over **every** person — drop the `isPlayer` gate and every parent gets credited with the player's shoot days |
| `src/engine/world/audition.ts` | The room, roster memory, being cast | Live, heavily worked | `heldUntil` wired into `takeTheirWeeks`; `theHouse`/`whatTheyKeepAskingFor` added; `OF_THE_ROOM` used; reliability-collapse cause documented | `feeFor` prices a part off the **stage rate card**, not the budget (§14) |
| `src/engine/world/company.ts` | Incorporation, registers, guilds, policies | Live | `form_arm` now writes its own Delaware `us_state` registration — previously unreachable by any route; `COMPANY_TABLES` deleted | Nothing in the company recurs or lapses |
| `src/engine/world/lot.ts` | Stages, bookings, overhead, family cover | Live | `familyCovers` prose corrected with measured numbers; strike-week comment corrected | Past the last rung of `PATIENCE` the family stops paying — day-end balance reaches **−€1,601,071** (§14) |
| `src/engine/world/world.ts` | World tick | Live, extended | The world tick now raises the reimbursement decision; refusal now **throws** so it reaches the player | — |
| `src/engine/world/rebate.ts` | Icelandic rebate | Live | reimbursement deadline now announced | — |
| `src/engine/world/making.ts` | Development → greenlight → periods → the cut | Live | `aWeekOn` docstring corrected (promised a weekly staffing lever that does not exist) | Hands are committed at greenlight; a mid-flight restaff would be a €1.39m exploit without per-week accrual |
| `src/engine/systems/life.ts` | Daily rollover, sleep, readiness | Live | reliability-collapse cause documented in comments | **`property.condition` has exactly one writer and it is a subtraction** — the house rots forever with no repair, and it is half the cause of the career-wide reliability collapse (§14) |

## UI

| Path | Purpose | State | Recent work | Known risks |
|---|---|---|---|---|
| `src/app/game-context.tsx` | Live Simulation + command dispatch + toasts | Live | — | Reads `CommandResult.ok` only; a handler returning `{ok:false}` is invisible here |
| `src/ui/looks/*` (16 files) | The drill-down system | Live | `attention.tsx`, `subject.ts` extended for decisions | A doc comment claimed "not one literal refType written anywhere" — there are 51+ |
| `src/ui/workspaces/fix.ts` | **NEW** — one place answering "what fixes this blocker" | Live | Created in the guild-door work | — |
| `src/ui/workspaces/BusinessWorkspace.tsx` | The family business surface | Live | `Missing` panel now calls `fixFor`; door rules reworked | — |
| `src/ui/workspaces/AuditionsWorkspace.tsx` | The room | Live | sliders seed from the player's own history of a holder; 6 prose patches | Puts a load-bearing default in a React `useState` |
| `src/ui/looks/wellbeing.tsx` | The dials | Live | ninth dial removed; "all eight" → "six of the eight" | — |

## Tests & tools

| Path | Purpose | State | Notes |
|---|---|---|---|
| `tests/played.ts` | **THE instrument against the idle-save trap.** `playACareer(sim, years, opts)` | Live, critical | **Now throws** if a scheduled system failed during the run, naming the handler. Do not defeat this guard — it exists because a broken mutation once silently stopped the whole wellbeing model and the frozen numbers looked like a result |
| `tests/doors.ts` | Door helpers | Live | Importing this or `played.ts` used to pull vitest into `vite-node`; `played.ts` no longer does |
| `tests/decides.test.ts` | **NEW** — prices every company door entry | Live | Created in the guild-door work |
| `tools/dials.mjs` | **NEW** — plays a 25-year career, counts dials nothing moves | Live, in the gate | Range test, not a one-value test. Blessed at **8** |
| `tools/wired.mjs` | Dead-word floor | Live, in the gate | Its old "Dials nothing moves" regex check was retired — a regex can prove a field is *written*, never that a number *moves* |
| `tools/cohesion-walk.mjs` | Screenshot walkthrough | **Has 67 uncommitted lines in the stash** (§9) | — |
| `docs/UNWIRED.json` | Machine baseline for the gate | Live | 51 declared words total. **`docs/UNBITTEN.md`'s own headline table still says 160** — stale |
| `walk-tmp.mjs` (repo root) | Stray Playwright scratch script | **Committed debt** | 49 lines, referenced by nothing, hardcodes a **Linux** browser path `/opt/pw-browsers/...` |

## Documentation

| Path | Purpose | State |
|---|---|---|
| `docs/DEPTH.md` | The standard, The One Rule, the 16 axes, build order | 885 lines. Live and authoritative |
| `docs/UNBITTEN.md` | **The open-work ledger.** What does not bite | 687 lines. **Headline count table is STALE** (says 160 declared words; truth is 51) |
| `docs/ARREARS.md` | The 60-agent audit verdict + what cleared | 3,023 lines. Live |
| `docs/research/LIFESPAN.md` | The lifespan almanac, preserved unwired | 565 lines. New |
| `README.md` | Project front door | **MATERIALLY STALE** — see §13 |
| `PROJECT_HANDOFF.md` | Old handoff | **DELETED at remote** in `b6f4061` "Retire the handoff, keep what was worth keeping". Present on disk only because this checkout is stale. **SUPERSEDED** |

---

# 5. COMPLETE PRODUCT REQUIREMENTS REGISTER

**Honesty rule applied:** nothing is called implemented because it was discussed. Where I could not verify on this machine, it says UNKNOWN.

## IMPLEMENTED AND VERIFIED
*(has code, has tests, and a measured outcome exists)*

- **The premise as a stored fact** — `SaveUniverse.premise`, mirrored to meta + DB columns, validated on load, migrated into old saves, refused server-side without it. `tests/premise.test.ts`, incl. the two-identical-saves-differ-only-in-words test. CONFIRMED BY CODE
- **One clock / `advanceTo`** — single path, DST-aware. `tests/time.test.ts`, `tests/realclock.test.ts`, `tests/calendar.test.ts`. CONFIRMED BY CODE
- **Double-entry ledger with conservation** — postings sum to zero, no fractional cents, balances derived. `tests/money.test.ts`. CONFIRMED BY CODE
- **Determinism / seeded streams / decider ownership** — `tests/deciders.test.ts` (69 tests), `tests/calibration.test.ts`. Hardened this cleanup. CONFIRMED BY CODE
- **Transactional command failure** — snapshot/restore in place. `tests/simulation.test.ts`. CONFIRMED BY CODE
- **Character creation + world map + portraits** — `tests/creation.test.ts`, `tests/portrait.test.ts`, `tests/world-map.test.ts`, `tests/geography.test.ts`. CONFIRMED BY CODE
- **Save slots (3 isolated universes) + persistence + migration** — `tests/persistence.test.ts`, `tests/base44-adapter.test.ts`, `tests/base44-contract.test.ts`, `tests/server-guards.test.ts`. CONFIRMED BY CODE
- **Weather, holidays, calendar** — `tests/weather.test.ts`, `tests/holidays.test.ts`. CONFIRMED BY CODE
- **The audition room** (opening reading, the note, being cast, roster memory, expiry) — `tests/audition.test.ts` (~71 tests). Measured over played careers. CONFIRMED BY CODE + TEST OUTPUT
- **The holder's taste ("the house")** — landed `0033f07`; `HOUSE_HOLDS=0` proven bit-identical by sha256 digest over 4×10-year careers. CONFIRMED BY CODE
- **Part-size-aware calendar (`heldUntil`)** — landed `4f47d91`; paired 6 seeds × 25 years. CONFIRMED BY CODE + TEST OUTPUT
- **The lot as a business** — stages, bookings, overhead, utilisation, rate card. `tests/lot.test.ts`. CONFIRMED BY CODE
- **Production pipeline** — development → greenlight → periods → the cut → delivery. `tests/making.test.ts`, `tests/plans.test.ts`, `tests/inventory.test.ts`, `tests/trouble.test.ts`. CONFIRMED BY CODE
- **Selling: windows + waterfall + buyers** — `tests/selling.test.ts`. CONFIRMED BY CODE
- **The Icelandic rebate + VAT reclaim** — `tests/rebate.test.ts`; VAT measured at ~€690k/3yr idle, €4.05m with a stage built. CONFIRMED BY CODE
- **Company: incorporation, registrations, guilds, policies, posts, capability doors** — `tests/business.test.ts` (70 tests), `tests/decides.test.ts`. CONFIRMED BY CODE
- **Delaware registration reachable** — landed `c2d81ac`; previously unreachable by every route. CONFIRMED BY CODE
- **The Decision Center** — landed `efc1599`; world tick raises the reimbursement, refusal reaches the player. CONFIRMED BY CODE
- **Crew + standing + family bonds + household** — `tests/crew.test.ts`, `tests/standing.test.ts`, `tests/family.test.ts`, `tests/household.test.ts`. CONFIRMED BY CODE
- **The drill-down "looks" system** — `tests/looks.test.ts`, `tests/navigation.test.ts`, `tests/interface.test.ts`, `tests/cohesion.test.ts`. CONFIRMED BY CODE
- **Endurance / long-save loadability** — `tests/endurance.test.ts` (includes a wall-clock ratio assertion; see §14). CONFIRMED BY CODE
- **The gate (14 checks)** — CONFIRMED BY CODE + TEST OUTPUT

## IMPLEMENTED BUT NOT FULLY VERIFIED

- **Base44 deployment** — code, entities, functions, guard and contract tests all exist; no evidence in this session of an actual deploy against a live Base44 project. UNKNOWN whether currently deployed
- **`npm run audit` (UI audit)** — script exists but its shell form uses `&`, `sleep`, `$?` and `kill %1`: **POSIX-only, will not run in PowerShell**. INFERRED from script text
- **Reliability as a career mechanic** — it is wired and it moves, but it is measurably dead in the back half of every career (§14). CONFIRMED BY TEST OUTPUT

## PARTIALLY IMPLEMENTED

- **The wellbeing model** — 8 dials roll up into `readiness`; `readiness` has 4 readers but its only *outcome* is in the audition room. The dials feed nothing but readiness. CONFIRMED BY CODE
- **Tax** — tables correct; only VAT actually charges. Income tax and corporation tax are inert. CONFIRMED BY CODE
- **The quote ratchet** — live for NPCs; for the **player** the quote is written and read by nothing, and three sentences in the tree claim the opposite mechanic. CONFIRMED BY CODE
- **Ageing** — fires, and the whole effect is the `recovery` column of `AGING`; the `fitness` and `condition` columns are inert. CONFIRMED BY TEST OUTPUT
- **Personality axes** — 4 of 7 are read by nothing, and the creation screen asks the player to set all of them. CONFIRMED BY CODE (`UNWIRED.json`)
- **History log** — has writers and readers, but what it actually records over a played career is UNKNOWN ("a sleep diary" per UNBITTEN)

## SCAFFOLDED / PLACEHOLDER

- **`prestige`** — a `Reputation` field that holds one value (nought) for an entire 25-year career. CONFIRMED BY TEST OUTPUT
- **47 of 53 trait `systemMods` keys** — declared, nothing multiplies through them. CONFIRMED BY CODE
- **`domain/model.ts` dead record shapes** — ~169 lines across 8 names. CONFIRMED BY CODE
- **`walk-tmp.mjs`** — stray committed scratch script. CONFIRMED BY CODE

## DESIGNED / SPECIFIED BUT NOT IMPLEMENTED

- **Awards and critics** — where `prestige` is waiting. Never built
- **Mid-flight cutting-room restaff** — specified, measured, deliberately **not** built (a €1.39m exploit without per-week room accrual first)
- **The monthly company clock** — specified **twice**, did not survive specification either time
- **Fee priced off the picture's budget** — the right fix; wants the payroll balance check first
- **Flooring the player's fee at their quote** — measured at ×2.32–3.56 lifetime acting income. Owner decision, not taken
- **Airdates for broadcast seasons** — `layOut` reads a delivery anchor; nothing supplies real airdates
- **The unscripted contributor cast board** — listed correct-and-unreachable

## UNKNOWN / NEEDS INVESTIGATION

- **Home Hub completeness**, **vehicles**, **travel**, **housing beyond the estate**, **relationships/dating**, **creator economy / social media**, **festivals**, **businesses beyond the lot and the sugar estate**, **tutorial/onboarding**
  These appear in the handoff request's requirement list. I found **no evidence of any of them** in `src/` at `dc52d64`. `README.md` says everything outside a small kept set "has been removed on purpose" and points at `docs/COVERAGE-MATRIX.md` for what is in and what was taken out. **Account 2 must read `docs/COVERAGE-MATRIX.md` before assuming any of these exist or are wanted.** UNKNOWN
- **`tests/maturity.test.ts` / `world/maturity.ts`** — present, purpose not examined this session. UNKNOWN
- **`src/engine/content/genre-mastery.ts`, `interests.ts`, `ethnicity.ts`, `languages.ts`, `reference.ts`** — present, readers not audited this session. UNKNOWN

---

# 6. EVERYTHING THIS CURRENT SLATE CLEANUP COMPLETED

**Session date:** 2026-09-16, on the Linux remote environment `/home/user/1221`.
**Range:** `75733f6` → `dc52d64` = **exactly 19 commits**. CONFIRMED BY GIT.

### What was asked, in order (CONFIRMED BY CURRENT SESSION)

The session began mid-flight on a recorded audit (`docs/ARREARS.md`), then: finish the audit's two room questions → work the remaining arrears decisions → "do all 18 decisions" (actually 21; one already done) → "carry on" → pause → resume → "handle everything under still yours in entirety right now" → "start everything that's unstarted in the unbitten docs" → "pause everything right now".

### The 19 commits, oldest first (CONFIRMED BY GIT)

| # | Commit | What it did |
|---|---|---|
| 1 | `5a5232e` | **An explanation nobody could ask for** — deleted the audit trail: 128 lines, zero writers *and* zero readers, plus the `audit` id namespace and `RULES_VERSION` (which the cut itself orphaned). Proved a pre-cut save still loads, validates clean, and keeps the stale array as inert JSON. No schema bump |
| 2 | `67a57fa` | **A rate for a thing the lot does not sell** — deleted `RATE_SHARE.hold`, proven unread by replacing the table with one that **throws** on `hold` and running 18 played years + the whole suite (`shooting` ~715 reads, `prep` ~115, `hold` 0). Narrowed `BookingKind` in the same commit because `RATE_SHARE[kind]` is typed by it |
| 3 | `6460902` | **Three figures on a record…** — deleted `Signature.depositCents`, `Holding.optionFeeCents`, `Holding.purchasePriceCents` (written, read by nothing; screens read the content row) and `COMPANY_TABLES` (one line in the repo, its own declaration) |
| 4 | `c2d81ac` | **Filed in Delaware, the notification said** — `form_arm` now writes its own `us_state` registration. It was unreachable by every route: the arm has no account and `company.register` charges the registrant, so the player got "no account to pay from" for a filing the parent had already paid for |
| 5 | `bcbf271` | **Five green tests proving a rule nothing asks** — deleted `canWorkIn`, `workRefusalFor`, a duplicate `countryOfCity`, and the 5 tests whose own header admitted nothing called the rule |
| 6 | `fc0568b` | **The gate said nought and the number is eight** — retired `wired.mjs`'s regex "dials" check (a regex can prove a field is *written*, never that a number *moves*) and added `tools/dials.mjs`, which plays a career. Blessed at 8 |
| 7 | `705370e` | **The ageing model fires, and half of it is dead** — corrected `DEPTH.md` + `UNBITTEN.md`. Age costs 2–7 parts and 14–16 points of readiness; the whole effect is `AGING[*].recovery` |
| 8 | `aa1a26a` | **Two comments promising a button that is not there** — `hands` cannot change after greenlight; two comments said weekly |
| 9 | `3f9de93` | **The room prices the cast…** — named `OF_THE_ROOM = 0.55` and said out loud that the picture's budget is not a term |
| 10 | `4f47d91` | **A day player is not spoken for all quarter** — `heldUntil` in the **diary** (not the calendar; scoping the calendar alone is a measured no-op). Paired 6 seeds × 25 yr: parts 571→648, clashes 489→238, earnings €9.36m→€11.33m, weeks held 2136→1358. Deleted two guards no input could trip and pinned the assumption with a test instead |
| 11 | `2c9d856` | **An instrument that refuses to measure a world that stopped** — `playACareer` now throws when a scheduled system failed; `dials.mjs` plays a full 25-year career and watches the last third separately. Blessed at 9. Also gitignored `.claude/worktrees/` |
| 12 | `0f34a6e` | **Why reliability dies, measured one term at a time** — the cause is the **house decaying + the shoot's short nights, jointly**; neither alone. And fitness is **not** it |
| 13 | `efc1599` | **A room nothing ever wrote to** — wired the Decision Center on the world tick; made the refusal **throw** so it reaches the player; killed 3 tests that could not fail |
| 14 | `5056f04` | **A shop with six things in it, and only two of them empty** — priced every company door entry. Binding property cover (€60,000) drops the company under the €50,000 greenlight floor. Only 2 role entries are genuinely inert. Extracted `fix.ts` |
| 15 | `0033f07` | **An office you have been in before wants what it wanted last time** — the house. Also hardened `sweepOne`, which had been passing inputs a decider entirely ignored |
| 16 | `b841af5` | **Nothing in the company ended, and the family stops paying** — corrected every lapse/renew/recur promise; documented the −€1,601,071 day-end balance |
| 17 | `c459c2e` | **The obvious fix to the actor's fee is backwards** — a commit that is purely a refutation. Budget↔lead-pay correlation **+0.934 before, −0.044 after** |
| 18 | `46d785b` | **Five hundred lines of research, and two of them read** — `lifespan.ts` 540→87 lines; research preserved in `docs/research/LIFESPAN.md`; every doc line-reference remapped |
| 19 | `dc52d64` | **Six dead words on a person…** — `travelFatigue`, the skill sheet, `goals`, `lifestyle`, `goatTraits`, person-level `creditScore`. Kept `background` **and gave it a reader**. Fixed a migration that shed 5 of 6 under a comment claiming all 6 |

### Orchestration performed

Three multi-agent workflows: (1) 14 agents on the arrears decisions; (2) 16 agents on 8 remaining items; (3) 4 agents re-doing two items that the first attempt had built **on `main`** — the wrong codebase. A fourth workflow (18 agents, 9 UNBITTEN sections) was launched and then paused (§7, §8).

### Validation at the end

`npm run gate` exit **0**; **1,253 tests**, 45 files. CONFIRMED BY TEST OUTPUT (session transcript) — see §11 for the evidence caveat.

### Self-corrections made during the session (CONFIRMED BY CURRENT SESSION)

Recorded because they are the project's own standard of honesty:

1. Claimed dead `fitness` caused the reliability collapse. **Wrong** — the mutation named a variable out of scope, `dailyRollover` threw every day, the wellbeing model silently stopped, and fitness read its seed of 50 because it was never *decayed*. Retracted; the guard in `played.ts` exists because of this.
2. Claimed `week`/`of` were dead parameters in `whatTheWeekTook`. **Wrong** — they are read in the notification body. The true, narrower claim: read for a *sentence*, never for the *decision*.
3. Claimed `across` was a dead word. **Wrong** — it has four readers in `world/casting.ts`. The true claim: the *diary* never read it.
4. Read `$?` after piping to `tail` — which reports `tail`'s status. The exact mistake the project's gate rule warns against.
5. Told the user "four worktrees had commits… and one still at base" while listing three hashes. Self-contradictory; the git evidence is **three with commits, two at base** (§8).

---

# 7. CURRENT SLATE CLEANUP — EXACT STOPPING POINT

Every line below is labelled. **Where the request's premise is wrong, the correction is given.**

| Claim | Verdict | Evidence |
|---|---|---|
| Main checkout is currently clean | **PARTLY WRONG.** Tracked files clean; **one untracked file** (`SLATE-CURRENT-CLEANUP-FULL-CONTEXT.txt`) and **one stash** | CONFIRMED BY GIT |
| Nothing is currently unpushed | **TRUE** (0 ahead). But local is **87 behind** | CONFIRMED BY GIT |
| `dc52d64` is local and remote HEAD | **HALF WRONG.** Remote HEAD **yes**. Local HEAD is **`4e720c9`** | CONFIRMED BY GIT |
| Paused work did not modify the main checkout because agents used separate worktrees | **TRUE on the Linux machine.** Irrelevant here — this machine has no worktrees and never ran the workflow | CONFIRMED BY CURRENT SESSION + CONFIRMED BY GIT (worktree list) |
| The paused workflow had 5 of 9 sections started | **CONFIRMED** — 5 worktrees existed (`wf_cc2a6ca8-f9d-1` … `-5`) | CONFIRMED BY CURRENT SESSION (`git worktree list` output in transcript) |
| Four started sections had commits; one remained at base | **WRONG.** **Three** had commits; **two** were at base `dc52d64` | CONFIRMED BY CURRENT SESSION |
| Worktree commits `a67f5c5`, `653ca3d`, `ae9d910` | **Two of three hashes confirmed; the third is a typo.** The transcript shows **`ae94910`**, not `ae9d910`. **None of the three exists in this clone or on the remote** | CONFIRMED BY CURRENT SESSION + CONFIRMED BY GIT (`git cat-file -t` → not present for all three, and for `ae9d910`) |
| "the fourth commit visible/recoverable from the workflow/worktree state" | **DOES NOT EXIST.** There were only three non-base commits. The 4th and 5th worktrees were both sitting at base `dc52d64` | CONFIRMED BY CURRENT SESSION |
| One additional started worktree had no landed commit yet | **TWO** had no commit (`-3` and `-5`, both at `dc52d64`) | CONFIRMED BY CURRENT SESSION |
| Work preserved under `.claude/worktrees/wf_cc2a6ca8-f9d-*` | **NOT ON THIS MACHINE.** No `.claude` directory exists. Those paths were `/home/user/1221/.claude/worktrees/...` on Linux | CONFIRMED BY GIT + filesystem |
| None of the half-verified paused work has been read/landed into main | **CONFIRMED.** No commit in `4e720c9..dc52d64` follows `dc52d64`, and the branch tip is `dc52d64` | CONFIRMED BY GIT |
| Workflow resume run ID is `wf_cc2a6ca8-f9d` | **CONFIRMED** as the ID. **But it is not resumable from this machine** (§17) | CONFIRMED BY CURRENT SESSION |
| Verify the workflow script path | **Path was `/root/.claude/projects/-home-user-1221/56acaf7d-.../workflows/scripts/slate-unbitten-open-sections-wf_cc2a6ca8-f9d.js`** — a **Linux** path. Searched all of `C:\Users\sande\.claude` recursively for `*cc2a6ca8*` and `*slate-unbitten*`: **zero hits.** There is no `projects` directory here | CONFIRMED BY CURRENT SESSION (path) + CONFIRMED BY GIT/filesystem (absent here) |
| Verify the exact resume invocation | The invocation shown in the session was `Workflow({ scriptPath: "…slate-unbitten-open-sections-wf_cc2a6ca8-f9d.js", resumeFromRunId: "wf_cc2a6ca8-f9d" })`. **It cannot succeed here** — neither the script nor the run cache is present | INFERRED from absence of both artifacts |
| The nine sections remain open | **CONFIRMED.** `docs/UNBITTEN.md` at `dc52d64` still carries all nine; no commit after `dc52d64` exists | CONFIRMED BY CODE + CONFIRMED BY GIT |
| Earlier completed work is 19 commits | **CONFIRMED EXACTLY.** `git log --oneline 75733f6..dc52d64` = 19, messages matching the transcript one-for-one | CONFIRMED BY GIT |
| Gate exit 0 | **CONFIRMED BY TEST OUTPUT** (session transcript, final gate run at `dc52d64`). NOT reproducible on this checkout, which is 87 commits behind | CONFIRMED BY TEST OUTPUT |
| 1,253 tests | **CONFIRMED BY TEST OUTPUT** (session transcript: "Test Files 45 passed (45) / Tests 1253 passed (1253)"). Test-file count corroborated: `dc52d64` has 45 `*.test.ts` files | CONFIRMED BY TEST OUTPUT + CONFIRMED BY CODE |

### The nine sections (names preserved exactly as the session described them)

All nine remain open. CONFIRMED BY CODE (`docs/UNBITTEN.md` @ `dc52d64`).

1. **house rot** — `property.condition` has one writer and it is a subtraction; nothing raises it. Half the cause of the career-wide reliability collapse. The screen blames the player for upkeep they have no command for.
2. **company money** — the company can pay the player money it does not have; posts cost nothing and nobody consents; nothing recurs; days end at −€1,601,071 past `PATIENCE`.
3. **note magnitude** — the second of only two decisions in the audition room, allegedly with one right answer in every state, and the tests pin it.
4. **who-is-free** — two functions answer whether the player is free and they disagree; the casting office is a display string, so nine addressable offices are really eight.
5. **tax engine** — correct tables, nothing charged from them except VAT.
6. **production calendar** — a season anchored on an airdate with no airdates; a denominator that cannot move; an invisible booking board.
7. **save dead shapes** — `domain/model.ts` record shapes with no table/importer/writer; whether the history table is really a sleep diary.
8. **three one-way money rules** — the quote ratchet, the collective Icelandic floor, interest that stops at week 260.
9. **awards as specification only** — `prestige` holds one value for a whole career; deliverable is a costed specification, not a built festival circuit.

---

# 8. PAUSED WORKFLOW FORENSICS

**Run ID:** `wf_cc2a6ca8-f9d` · **Design:** 18 agents = 9 sections × (Build → Refute), `isolation: 'worktree'`, effort `high` · **Stopped by:** `TaskStop` on task `wa6f8044g`, cleanly, at the user's instruction.

### ⚠️ These worktrees do not exist on this machine

| Check | Result |
|---|---|
| `git worktree list` here | **One entry only** — the main checkout | CONFIRMED BY GIT |
| `.claude` directory here | **Does not exist** | CONFIRMED BY filesystem |
| `.claude/worktrees` here | **Does not exist** | CONFIRMED BY filesystem |
| `a67f5c5` / `653ca3d` / `ae94910` / `ae9d910` as git objects | **None present**, locally or after fetching the remote | CONFIRMED BY GIT (`git cat-file -t`) |

### What the session transcript records (CONFIRMED BY CURRENT SESSION — the only surviving evidence)

Final `git worktree list` before the pause:

```
/home/user/1221                                      dc52d64 [claude/slate-cleanup-e4apmx]
/home/user/1221/.claude/worktrees/wf_cc2a6ca8-f9d-1  a67f5c5 [worktree-wf_cc2a6ca8-f9d-1]
/home/user/1221/.claude/worktrees/wf_cc2a6ca8-f9d-2  653ca3d (detached HEAD)
/home/user/1221/.claude/worktrees/wf_cc2a6ca8-f9d-3  dc52d64 [worktree-wf_cc2a6ca8-f9d-3]
/home/user/1221/.claude/worktrees/wf_cc2a6ca8-f9d-4  ae94910 [worktree-wf_cc2a6ca8-f9d-4]
/home/user/1221/.claude/worktrees/wf_cc2a6ca8-f9d-5  dc52d64 [worktree-wf_cc2a6ca8-f9d-5]
```

| Worktree | Branch | HEAD | Section | Committed? | Files changed | Tests | Safe to resume | Landed? | Remaining verification |
|---|---|---|---|---|---|---|---|---|---|
| `-1` | `worktree-wf_cc2a6ca8-f9d-1` | `a67f5c5` | UNKNOWN — agent labels were not read before the pause | **Yes** | UNKNOWN | UNKNOWN | **N/A — gone** | **No** | Everything |
| `-2` | detached HEAD | `653ca3d` | UNKNOWN | **Yes** | UNKNOWN | UNKNOWN | **N/A — gone** | **No** | Everything |
| `-3` | `worktree-wf_cc2a6ca8-f9d-3` | `dc52d64` | UNKNOWN | **No — at base** | none | UNKNOWN | **N/A — gone** | n/a | Everything |
| `-4` | `worktree-wf_cc2a6ca8-f9d-4` | `ae94910` | UNKNOWN | **Yes** | UNKNOWN | UNKNOWN | **N/A — gone** | **No** | Everything |
| `-5` | `worktree-wf_cc2a6ca8-f9d-5` | `dc52d64` | UNKNOWN | **No — at base** | none | UNKNOWN | **N/A — gone** | n/a | Everything |

**Which section mapped to which worktree is UNRECOVERABLE.** The session paused before reading any agent result, so no `build:<key>` label was ever tied to a worktree path in the transcript. The workflow's own journal (`journal.jsonl`), which records per-agent labels and return values, lived on the Linux machine and is not here.

**Net loss assessment:** three commits of agent work, plus whatever cached agent results the run had accumulated. Against that: **no verified work is lost** — the session had read nothing, landed nothing, and judged nothing from this run. The nine sections are fully re-runnable from their briefs, which survive verbatim in the exported context (§16). The cost of the loss is compute time, not knowledge.

**I did not modify or merge any of this.** There was nothing here to modify.

---

# 9. GIT STASH INVENTORY

**Exactly one stash.** CONFIRMED BY GIT.

| Field | Value |
|---|---|
| Reference | `stash@{0}` |
| Commit | `227fa5aaccca381835257824988fd616147ad51c` |
| Message | `On claude/slate-cleanup-e4apmx: Teleport auto-stash` |
| Timestamp | **2026-09-17 13:15:45 -0500** (today) |
| Original branch | `claude/slate-cleanup-e4apmx` |
| Base parent | `4e720c9` (the current local HEAD) |
| Index parent | `25e2c32e52c41386d849b3166eec99bfd096e7f2` |
| Untracked parent | **none** — only 2 parents, so `git stash -u` was not used |
| Total files | **23** (22 staged additions + 1 unstaged modification) |
| Purpose | Created automatically by the **teleport** mechanism so the session could move machines / switch branches |

### Contents

| Item | Kind | Size | Staged? | On remote? | Must be restored? |
|---|---|---|---|---|---|
| `tools/cohesion-walk.mjs` | **APPLICATION TOOLING CODE** — modification | **67 lines the remote does not have** | No (working-tree modification) | **NO** | **Decide deliberately — see below** |
| `SLATE-CLEANUP-FULL-CONTEXT.txt` | Prior session context export | 1,503 lines, new file | Yes | No; **not gitignored** | Probably not — superseded |
| `cohesion-walk/` | 22 PNG walkthrough screenshots | ~1.4 MB total, new files | Yes | No; **not gitignored** | Probably not — regenerable |

Screenshot list: `00-startup`, `01-save-slots`, `02-creation-identity`, `03-creation-who-you-are`, `04-creation-my-skills`, `05-creation-starting-point`, `06-creation-your-people`, `07-creation-review`, `08-home`, `14-home-seeded`, `15-business-seeded`, `16-picture` (+2 facets), `17-sold-picture` (+2 facets), `18-crew-person`, `family-business`, `home-resumed`, `save-slots-after-exit`.

### The one item that needs a real decision

`tools/cohesion-walk.mjs` in the stash differs from the remote version by **67 lines that exist nowhere else**. Verified with `git diff --stat 227fa5a:tools/cohesion-walk.mjs origin/claude/slate-cleanup-e4apmx:tools/cohesion-walk.mjs` → `2 insertions(+), 67 deletions(-)` in the stashed→remote direction, i.e. the stash is the larger, later version relative to `4e720c9`.

**Caveat that matters:** the stash was taken against `4e720c9`, and the remote is 87 commits further on. The remote may have re-solved the same problem differently. **Do not assume the stashed version is better** — diff it against `dc52d64` and judge, after fast-forwarding.

### Is it safe to leave stashed for Account 2?

**Yes, with one condition.** Stashes are ordinary git objects and survive indefinitely as long as `refs/stash` is not dropped and `git gc --prune` does not collect an unreachable entry. Risks:

- `git stash drop` / `git stash clear` — **never run these**
- Fast-forwarding to `dc52d64` will make `git stash pop` **conflict**, because the stash's base is 87 commits old. Use `git stash show -p stash@{0} > patch.diff` and apply selectively instead of popping
- To make it durable beyond the stash stack, create a tag or branch pointing at `227fa5a` (a read-only ref creation, no working-tree change): `git branch teleport-stash-backup 227fa5a`

**I did not apply, pop, drop, or alter this stash.** All inspection used `git diff`, `git rev-list`, and `git log -g` against the stash SHA.

---

# 10. CURRENT UNCOMMITTED / UNMERGED / UNLANDED WORK

| Location | Contents | Risk |
|---|---|---|
| **Main working tree** | 1 untracked file: `SLATE-CURRENT-CLEANUP-FULL-CONTEXT.txt` (205,415 bytes, 3,268 lines). Tracked files unmodified | Low — it is the portable session record. **Do not delete** |
| **Staged** | Nothing in the live index | — |
| **Stash `stash@{0}`** | 23 files: `tools/cohesion-walk.mjs` (+67 lines nowhere else), `SLATE-CLEANUP-FULL-CONTEXT.txt`, `cohesion-walk/` ×22 | **Medium** — one real code item |
| **Local branches** | `claude/slate-cleanup-e4apmx` (0 ahead / 87 behind), `main` (behind remote `4df027d`) | Low — nothing local is unique |
| **Commits not on remote** | **None.** `4e720c9` is a verified ancestor of `dc52d64` | None |
| **Workflow worktree commits** | `a67f5c5`, `653ca3d`, `ae94910` — **exist on neither this machine nor the remote** | **Lost** (§8, §20) |
| **Work not yet validated** | All nine UNBITTEN sections; the three lost worktree commits | n/a |
| **Not landed but decided against** | The `spentAt` depth-ramp fix (built, measured working, **deliberately reverted** — it traded away "spent is spent", which two tests protect). Exists only as a description in the transcript | Acceptable — it was rejected on evidence |

---

# 11. CURRENT TESTING STATE

### Commands (from `package.json` at `dc52d64` — CONFIRMED BY CODE)

```
npm run dev              vite dev server (http://localhost:5173)
npm run build            tsc -b --noEmit && vite build
npm run typecheck        tsc -b --noEmit          ← MANDATORY; root tsconfig is files:[] with project refs
npm run lint             eslint . --ext .ts,.tsx --max-warnings=0
npm run test             vitest run
npm run validate         typecheck && lint && test
npm run gate             validate + 14 more checks   ← THE BAR
npm run base44:contract  vitest run tests/base44-contract.test.ts
npm run base44:smoke     node tools/base44-smoke.mjs
npm run base44:deploy    build + @base44/cli deploy
npm run audit            UI audit — POSIX-ONLY, will not run in PowerShell
```

The gate, in order: `validate` → `title-case --check` → `label-sweep` → `plural-check` → `both-titles` → `voice-check --check` → `tics --check` → `doc-refs --check` → `wired --check` → `vite-node dials.mjs --check` → `deciders --check` → `spelling` → `typos` → `vite-node geo-check.mjs` → `inventory --check`.

### What has actually been run, and where

| Result | Value | Evidence | Where |
|---|---|---|---|
| Full suite | **1,253 passed, 45 files, 0 failed** | CONFIRMED BY TEST OUTPUT (session transcript) | Linux, at `dc52d64` |
| `npm run gate` | **exit 0** | CONFIRMED BY TEST OUTPUT (session transcript; exit status read from a file, not a pipe) | Linux, at `dc52d64` |
| `npm run typecheck` | exit 0 | CONFIRMED BY TEST OUTPUT | Linux, at `dc52d64` |
| Dead-word floor | **51** declared words | CONFIRMED BY CODE (`docs/UNWIRED.json`) | `dc52d64` |
| Dials nothing moves | **8**, blessed | CONFIRMED BY CODE (`docs/UNWIRED.json`) | `dc52d64` |
| **On THIS machine** | **Nothing has been run** | — | — |

### I deliberately did not run the suite here, and this is why

The working tree is at `4e720c9` — **87 commits behind**. A test run here would measure five-day-old code and produce numbers that describe a state nobody is working on, which is worse than no number. Reproducing `1253` / gate-0 requires fast-forwarding to `dc52d64` first, and fast-forwarding rewrites the working tree — which the "do not modify application code" constraint forbids, and which would also make the stash harder to recover cleanly. Account 2 should fast-forward first, then validate (§18).

Toolchain here is ready: **Node v24.20.0, npm 11.19.0, `node_modules` present.**

### Required before landing any paused work

1. `npm run typecheck` — exit 0
2. `npm run test` — 1,253 as the floor (a *fall* needs explaining; a *rise* is new tests)
3. `npm run gate` — exit 0, **status read from a file, never from a pipe to `tail`**
4. For any engine mutation used in a measurement: confirm the mutated tree typechecks, and that no `A Scheduled Event Could Not Be Processed` notification was raised
5. Paired, played-career measurement over **25 years and multiple seeds** — never an idle save, never 10 years for a back-half effect
6. Mutation-test anything claimed to be test-protected: break it, watch it go red

### Regression risks specific to resuming

- **`tests/endurance.test.ts`** asserts a wall-clock *ratio* (`late/early < 3`). It **failed once during this session purely from CPU contention** while agents were running, and passed on re-run. Do not treat it as a code regression without a paired re-run on a quiet machine.
- The **`voice-check` budget is 40** uncontracted forms and the repo sits near it. New prose can push the gate red for style, not correctness.
- `tools/wired.mjs --bless` **merges** rather than overwrites, because `tools/dials.mjs` owns the `"Dials nothing moves"` key in the same file. Blessing from the wrong tool silently clobbers the other's baseline.
- `npm run audit` is POSIX-only and will fail in PowerShell.

---

# 12. CURRENT GIT HISTORY

### The cleanup (19 commits) — see §6 for what each did

`75733f6` → `5a5232e` → `67a57fa` → `6460902` → `c2d81ac` → `bcbf271` → `fc0568b` → `705370e` → `aa1a26a` → `3f9de93` → `4f47d91` → `2c9d856` → `0f34a6e` → `efc1599` → `5056f04` → `0033f07` → `b841af5` → `c459c2e` → `46d785b` → **`dc52d64`** ← remote HEAD

### Immediately before that (present in this stale checkout)

| Commit | Date | What it accomplished |
|---|---|---|
| `4e720c9` | 2026-09-12 | Make the nine doors a rule instead of a description ← **LOCAL HEAD** |
| `deb7d1a` | | Sweep the production screens for text that does not fit |
| `ecec3e6` | | Give the family business somewhere to open into |
| `fa31dc3` | | Let a picture bring its own people into the world |
| `d5c9e53` | | Pick the research back up where it stopped, at the crew |
| `64888e3` | | Correct a claim I made about the research and had not checked |
| `5dfacfa` | | **Write down where this stands, for whichever account opens it next** ← a prior handoff commit |
| `9d11f97` | | Give a delivered picture a buyer, and make its money walk the waterfall |
| `677bbd5` | | **Make the gate run on a machine that spells its paths the other way** ← Windows path compatibility |
| `6f57b23` | | Land the research, and correct the build order it contradicts |
| `d283545` | | Make the lot's refusal possible, and most of its work Icelandic |
| `09666ed` | | Halve the stage rates to what stages actually let for |
| `01570a0` | | Make a greenlit picture walk its own calendar |
| `1a3b3f0` | | Give a picture a life past greenlit |
| `6ebe892` | | Make the sugar quota a thing that keeps happening |
| `806c00d` | | Put the sugar behind the money, and say which business is which |
| `775c779` | | Fix the broken typecheck I pushed, and separate fittings from labels |
| `998cf87` | | Make the lot a business: four stages, a monthly bill, and somebody booking |
| `7e9b285` | | Move the family land to Mosfellsbær, and stop calling it vast |
| `61c4efa` | | Make a decider prove it is deciding something |
| `318aacb` | | Make the attribute sheet a base and its exceptions |
| `924c081` | | Lock in the depth standard |
| `2d82f4a` | | Ratchet the dead vocabulary: 169 declared words nothing reads |
| `d993595` | | Stop the README claiming an explanation layer that never runs |
| `161a210` | | Make the cohesion walk walk the game that exists |
| `b6f4061` | | **Retire the handoff, keep what was worth keeping** ← deleted `PROJECT_HANDOFF.md` |

`main` @ remote `4df027d` includes PR #13 from this branch.

---

# 13. COMPLETE DECISION LOG

### Governing decisions — all still valid

| Decision | Status |
|---|---|
| **THE ONE RULE** — a declared word with nothing that reads it is worse than no word at all | **VALID.** Governs every deletion in the cleanup |
| **THE FALSIFIABILITY TEST** — move the input, watch the outcome, or admit it is decoration | **VALID** |
| **Design decisions belong to the owner** — measure and cost, do not choose | **VALID** |
| **Take a section, not an item** (`docs/UNBITTEN.md`) — 40 singletons is not a task | **VALID.** Shaped the nine sections |
| **Measure on a played career, never an idle save** — the trap produced 5 confident wrong answers | **VALID and now enforced** by `tests/played.ts` |
| **A 25-year horizon, not 10** — the reliability collapse lands at year 12–16 | **VALID and now enforced** by `tools/dials.mjs` |
| **Read the gate's exit status from a file, never from a pipe to `tail`** | **VALID** |
| **Mutation-test every claim a test protects** | **VALID** |
| **Prose is load-bearing; a comment your change falsifies is part of your change** | **VALID** |

### Cleanup decisions

| Decision | Rationale | Status |
|---|---|---|
| **Keep `4f47d91`** (the part-size calendar) despite easing 4 levers at once | It removes an *accident* — `across` had no reader on the calendar side. Tuning back toward an unvalidated baseline is worse than the accident | **VALID** |
| **Refuse the "obvious" fee fix** | Budget↔pay correlation **+0.934 → −0.044**. Floor area *was* the proxy | **VALID.** Recorded in `feeFor`'s docstring, where the next person will stand |
| **Move lifespan research rather than delete it** | The One Rule governs *code*; it does not ask for 300 checkable reference figures to be destroyed | **VALID** → `docs/research/LIFESPAN.md` |
| **Delete the audit trail rather than wire it** | Zero writers *and* zero readers; the room it was for is the honest place to rebuild it | **VALID** |
| **Ship the house at `HOUSE_HOLDS = 0.7`** | Made the room's first decision real; `H=0` proven bit-identical | **VALID** |
| **Do NOT build mid-flight restaff** | Without per-week room accrual it is a measured €1.39m free button | **VALID** |
| **Do NOT build the monthly company clock** | Failed specification twice; 50 lines of unexamined design | **VALID** |
| **Revert the `spentAt` depth-ramp** | Fixed the late career but gave away "spent is spent", which two tests protect | **VALID** — the tests did their job |
| **Keep `background`, give it a reader** | A sentence the player authored is not the same kind of thing as an option list | **VALID** |
| **Bless `Personality axes` at 4 rather than hide the rise** | `openness` only ever multiplied a knob pinned at zero — already inert; the deletion made it *countable* | **VALID** |
| **Gitignore `.claude/worktrees/`** | Whole repo copies the harness creates and removes | **VALID** |

### Decisions the owner has NOT taken (open)

1. Whether the family's patience should be finite (the −€1.6m balance)
2. Whether four dead personality axes get readers or the creation screen stops asking
3. What `A_WORKING_WEEK.spentAt` should be, or whether it should be relative
4. Whether the player's fee should be floored at their quote (×2.32–3.56 lifetime income)
5. Whether income/corporation tax should charge anything
6. Whether awards/critics get built at all

### SUPERSEDED documentation

| Document | Status |
|---|---|
| `PROJECT_HANDOFF.md` (on disk, 49,467 bytes) | **SUPERSEDED — and deleted at the remote** in `b6f4061`. It survives on disk only because this checkout is stale. It will disappear on fast-forward. Do not treat it as current |
| `README.md` @ `dc52d64` | **PARTLY SUPERSEDED.** (a) It describes `core/audit.ts` as able to record decisions with `redactForPlayer` — **that half was deleted** in `5a5232e`. (b) It says the build is "cut back to six things" and mentions auditions/casting/business **zero times**, though those are now the bulk of the game. CONFIRMED BY CODE |
| `docs/UNBITTEN.md` headline count table | **STALE.** Says 160 declared words, `Id namespaces 104 of 125`, `Dials nothing moves 0`. `docs/UNWIRED.json` says **51 total**, `Id namespaces 0`, `Dials 8`, `Personality axes 4`. CONFIRMED BY CODE |
| `SLATE-CLEANUP-FULL-CONTEXT.txt` (in the stash) | Historical. Superseded by `SLATE-CURRENT-CLEANUP-FULL-CONTEXT.txt` |
| `SLATE_MASTER_PROJECT_HANDOFF.md` | **DOES NOT EXIST** anywhere — not on disk, not at `dc52d64`. The request assumed it might |
| `CLAUDE.md` | **DOES NOT EXIST** anywhere. The project's conventions live in `docs/DEPTH.md` and `docs/STYLE.md` |

---

# 14. KNOWN BUGS, RISKS, AND TECHNICAL DEBT

## Confirmed bugs (measured, reproducible, unfixed)

| # | Bug | Measurement | Where |
|---|---|---|---|
| 1 | **The house rots forever with no repair.** `property.condition -= 0.012` daily, one writer, nothing raises it. `sleepQuality` reads it | Half the cause of the career-wide reliability collapse. Hold the house at its start condition and no career reaches nought (ends 94–100) | `systems/life.ts` |
| 2 | **Reliability is dead in the back half of every career** | Reaches 0 at year 12–16, then 84–100% of remaining weeks at nought, clawing back to at most 4–6/100. Cause: the house **and** the shoot's short nights jointly, neither alone | `world/audition.ts`, `systems/life.ts` |
| 3 | **`A_WORKING_WEEK.spentAt = 38` is unreachable late-career.** Its docstring claims "short work keeps somebody reliable" | Mean readiness by third: autopilot 47.7 / 38.9 / 16.7; managing sleep deliberately 49.2 / 47.8 / 35.3. Both below 38 in the last third | `content/audition.ts` |
| 4 | **The company can pay the player money it does not have.** `sim.expense` and `payThePlayer` have no balance check | €877,000 paid from a company holding €117,000 → −€761,000 | `world/casting.ts`, `core/ledger.ts` |
| 5 | **The company runs out of family.** Past the last rung of `PATIENCE` no cover check arrives | Lowest **day-end** balance over 25 played years on the default seed: **−€1,601,071** on 2048-02-01; **18 days** end under water. First decade: no day ends under at all | `world/lot.ts` |
| 6 | **`feeFor` prices a part off the stage rate card, not the picture** | Budget €23,333 → €23,333,333: lead fee **€13,219 at every single one**. Same guest part paid €2,838 (15×) or €1,442 (144×) by which stage was free. **The obvious fix is backwards** (+0.934 → −0.044) | `world/audition.ts` |
| 7 | **Four of seven personality axes are read by nothing**, and the creation screen asks the player to set all of them | `UNWIRED.json`: `Personality axes nothing consults: 4` | `content/personality-traits.ts`, `CharacterCreation.tsx` |
| 8 | **`prestige` holds one value (nought) for an entire career** | `tools/dials.mjs` | `domain/model.ts` |
| 9 | **The player's quote is written and read by nothing**, and three sentences in the tree claim the opposite mechanic | `theyWantYou` bypasses `writeTheQuote`; every `askFor` caller reaches people via `putItOut`, which skips the player | `world/audition.ts`, `world/casting.ts` |
| 10 | **A scheduled handler that throws is caught, marked `missed` and notified — but NOT written to `engineFailures`** | This hid `dailyRollover` throwing every single day for a whole measurement run. Mitigated by the `played.ts` guard, not fixed at source | `core/simulation.ts` |
| 11 | **`sim.execute` returns `{ok:true}` when a handler *returns* `{ok:false}`** | Both places a player can press a button read `CommandResult.ok`. Worked around in the Decision Center by **throwing**; the general trap remains | `core/simulation.ts` |
| 12 | **`tools/deciders.mjs` checks draw ownership at FILE granularity** | A new `sim.rng(...)` in a file that already owns deciders slides under the check | `tools/deciders.mjs` |
| 13 | **`tools/doc-refs.mjs` matches paths only, never line numbers** | Exits 0 while a doc cites a line that has moved | `tools/doc-refs.mjs` |

## Suspected issues (claimed, not yet verified at `dc52d64`)

From `docs/UNBITTEN.md`, all needing re-derivation because **the page is demonstrably stale** (three entries were checked in-session and two were wrong):

- Two functions answer whether the player is free and disagree
- The casting office is a display string → nine addressable offices, two of which are one
- A season anchored on an airdate has no airdates
- The denominator never moves — a cut that cannot run long
- The booking board is invisible to the player
- The history table is a sleep diary
- `stillOwedCents` stops accruing interest at week 260 while the screen says interest is included
- The collective Icelandic fee floor — string on a screen, number missing
- The note's magnitude has one right answer in every state (note: `HOW_FAR` went 4 → 3 options, so "four buttons, three decoys" may already be stale)
- `domain/model.ts` dead lines — page says 366; a closure check said 169 across 8 names

## Deferred work (decided against, with reasons)

- Mid-flight cutting-room restaff (€1.39m exploit without per-week accrual)
- The monthly company clock (failed specification twice)
- The `spentAt` depth-ramp (traded away "spent is spent")
- Flooring the player's fee at their quote (×2.32–3.56 — owner's call)
- Awards/critics (a feature, not a fix)

## Testing gaps

- `README.md` and `docs/UNBITTEN.md`'s count table are both stale and **nothing in the gate catches documentation drift of this kind**
- The gate's dead-word detector never covered company record fields — four dead words were deleted this session and the count did not move
- `npm run audit` is POSIX-only; no Windows equivalent
- `tests/endurance.test.ts` is a wall-clock ratio assertion → flaky under CPU load

## Worktree risks

- **The three paused-workflow commits are gone** (§8, §20)
- The harness creates whole repo copies under `.claude/worktrees/`; they are gitignored, and stale ones consume disk and trip "uncommitted changes" hooks. Prune finished ones with `git worktree remove --force` then `git worktree prune`
- **Agent worktrees were created at `main`, not at the working branch**, in two separate workflows. Four agents each destroyed a full item by building on the wrong codebase and reporting a green gate on it. **Any future agent brief must force `git reset --hard origin/claude/slate-cleanup-e4apmx` and verify the test-file count before reading a single file**

## Stash risks

- `git stash drop` / `clear` / an aggressive `git gc` would destroy the only copy of 67 lines of `tools/cohesion-walk.mjs`
- Popping after a fast-forward will conflict (base is 87 commits old)

## Deployment risks

- Base44 deploy state UNKNOWN; `base44/shared/guard.js` is the server-side authority and a schema change must move with it
- `SAVE_SCHEMA_VERSION` is at 79 after the wellbeing sweep; older saves rely on `migrate()`
- `walk-tmp.mjs` hardcodes a Linux browser path and ships in the repo

## Performance risks

- `tools/dials.mjs` plays a 25-year career inside the gate (~5 s)
- `whatHasThem` loops every project and every audition; it is called **daily**. A linear `sizeById` lookup was moved behind a cheap reject for exactly this reason — do not undo that
- Save size grows with the timeline; retention rules and `tests/endurance.test.ts` guard it

---

# 15. DO-NOT-REDO LIST

**All of this is complete, pushed, and gate-green at `dc52d64`. Re-doing any of it wastes effort and risks regression.**

1. ✅ **The audit trail is deleted** — do not "wire up explainability". It had zero writers *and* zero readers. `RULES_VERSION` and the `audit` id namespace went with it
2. ✅ **`RATE_SHARE.hold` is deleted** and `BookingKind` narrowed — proven unread by a throwing Proxy over 18 played years + the whole suite
3. ✅ **`Signature.depositCents`, `Holding.optionFeeCents`, `Holding.purchasePriceCents`, `COMPANY_TABLES`** are deleted. **Note: signing a guild DOES charge its deposit** — that UNBITTEN entry is stale
4. ✅ **Delaware (`us_state`) registration is reachable** — `form_arm` writes it
5. ✅ **`canWorkIn` / `workRefusalFor` / duplicate `countryOfCity`** are deleted with their 5 tests
6. ✅ **`tools/dials.mjs` exists, plays a 25-year career, watches the last third, blessed at 8** — do not rebuild it, and do not shorten its horizon
7. ✅ **`tests/played.ts` throws when a scheduled system failed** — do not remove or bypass this guard
8. ✅ **`heldUntil` is in the diary** (not the calendar). Scoping the calendar alone is a **measured no-op**
9. ✅ **The house (`HOUSE_HOLDS = 0.7`) is shipped**, with `audition.house` registered and six prose patches
10. ✅ **`sweepOne` in `core/deciders.ts` is hardened** — it used to pass inputs a decider entirely ignored
11. ✅ **The Decision Center is wired** on the world tick (not the greenlight — that placement is wrong), and it is a **reminder, not a decision** (waiting never costs money, measured)
12. ✅ **The company door entries are priced** — property cover (€60,000) shuts the greenlight floor. Only 2 role entries are inert
13. ✅ **`content/lifespan.ts` is 87 lines / 2 exports**; the almanac is `docs/research/LIFESPAN.md`. Delete by **transitive closure**, never by import count
14. ✅ **Six dead person/wellbeing words are deleted** (`travelFatigue`, the skill sheet, `goals`, `lifestyle`, `goatTraits`, person-level `creditScore`). **`background` was KEPT and given a reader** — do not delete it
15. ✅ **`OF_THE_ROOM = 0.55` is named**
16. ✅ **The ageing model's real shape is documented** — it fires; only `AGING[*].recovery` matters
17. ✅ **The "obvious" fee fix is REFUTED and the refutation is in the code** — do not divide the room out of `feeFor`
18. ✅ **The reliability collapse is diagnosed** — the house **and** the shoot's short nights, jointly. **Fitness is NOT the cause** (`readiness` does not read `condition`)
19. ✅ **`.claude/worktrees/` is gitignored**
20. ✅ **`whereTheCrewStands`, `Audition.took`, the euro/dollar currency split, the four rebate-rate spellings, the id-namespace cull** — all landed before this session

**Also do not re-litigate:** the five self-corrections in §6. They are recorded so the same wrong turns are not taken again.

---

# 16. DO-NOT-LOSE LIST

**Things that exist in only one place. Losing any of them loses information.**

| # | Item | Only copy | How to preserve |
|---|---|---|---|
| 1 | **`SLATE-CURRENT-CLEANUP-FULL-CONTEXT.txt`** | Untracked file in this working tree. 205,415 bytes / 3,268 lines. Was the only copy of the nine section briefs | **Backed up at `%USERPROFILE%\slate-backup\`. Deliberately NOT committed — see below.** |

**Why the context export is not in the repository.** Its unique value was the nine
section briefs, and that value is spent: all nine sections have been worked, and
what came of each is in its own commit message, in `docs/UNBITTEN.md` and in
`docs/AWARDS.md`. What is left is a terminal transcript with known mojibake
(§20, gap 12) that nothing and nobody now reads.

This repository spent this session deleting 199 lines of record shapes and 35
lines of tax tables for exactly that property, and `b6f4061` — *Retire the
handoff, keep what was worth keeping* — is the same call made once already. A
205KB artifact with no reader is the thing The One Rule is about, and it does
not stop being that because it is prose rather than code. It is backed up
outside the repo, so nothing is lost; it is simply not carried.

If a future session wants it in the history anyway, commit it deliberately and
say why — do not let it drift in as an untracked file nobody decided about.
| 2 | **`stash@{0}` = `227fa5a`** — `tools/cohesion-walk.mjs` +67 lines that exist nowhere else | The stash stack only | **Never** `stash drop`/`clear`. To make it durable: `git branch teleport-stash-backup 227fa5a` |
| 3 | `SLATE-CLEANUP-FULL-CONTEXT.txt` (1,503 lines) — the **prior** session's export | Inside `stash@{0}` | Same as above |
| 4 | `cohesion-walk/` — 22 walkthrough screenshots (~1.4 MB) | Inside `stash@{0}` | Same as above. Regenerable via `tools/cohesion-walk.mjs` but not for free |
| 5 | **This file** (`SLATE_CURRENT_MASTER_HANDOFF.md`) | Untracked in this working tree | Commit it or back it up |
| 6 | `PROJECT_HANDOFF.md` (49,467 bytes) | On disk **only because this checkout is stale**. Deleted at the remote in `b6f4061`. **It will vanish on fast-forward** | If any of it is still wanted, copy it out **before** fast-forwarding |
| 7 | The **three paused worktree commits** `a67f5c5`, `653ca3d`, `ae94910` | **Nowhere reachable from this machine** | **Already lost** (§20). If the Linux environment is ever reachable again, they could be pushed from there |
| 8 | The workflow **run cache** for `wf_cc2a6ca8-f9d` (script + journal + agent results) | The Linux machine only | **Already lost** (§20) |
| 9 | The knowledge that the **`spentAt` depth-ramp fix works but was rejected**, and why | The transcript / this file only | Preserved in §13 |

---

# 17. EXACT SAFE RESUME PROCEDURE

## ⚠️ The paused workflow CANNOT be resumed from this machine

**Why — all CONFIRMED:**

| Requirement for `resumeFromRunId` | Present here? |
|---|---|
| The workflow script `slate-unbitten-open-sections-wf_cc2a6ca8-f9d.js` | **NO.** Recursive search of `C:\Users\sande\.claude` for `*slate-unbitten*` → zero hits |
| The run journal + cached agent results for `wf_cc2a6ca8-f9d` | **NO.** Recursive search for `*cc2a6ca8*` → zero hits. There is no `projects` directory under `~/.claude` |
| The five agent worktrees | **NO.** No `.claude` directory exists |

The original path was `/root/.claude/projects/-home-user-1221/56acaf7d-87c3-593a-8647-b83e135e5ee1/workflows/scripts/slate-unbitten-open-sections-wf_cc2a6ca8-f9d.js` — a **Linux** path inside the remote environment. Resume caching is **same-session, same-machine**. Attempting `resumeFromRunId: "wf_cc2a6ca8-f9d"` here will fail on an unreadable `scriptPath`.

**Therefore: there is nothing to preserve by "resuming", and nothing to lose by not resuming.** The three worktree commits are already unreachable (§8). What survives — and is sufficient — is the **nine section briefs, verbatim, in `SLATE-CURRENT-CLEANUP-FULL-CONTEXT.txt`**.

## What to do instead: a fresh run from the surviving briefs

**Step 0 — Protect everything first (no working-tree changes).**
```powershell
# Durable ref for the stash, so it cannot be lost to gc or a stray drop
git branch teleport-stash-backup 227fa5a
git branch --list teleport-stash-backup          # expect: teleport-stash-backup

# Copy the irreplaceable files OUT of the repo
New-Item -ItemType Directory -Force "$env:USERPROFILE\slate-backup"
Copy-Item SLATE-CURRENT-CLEANUP-FULL-CONTEXT.txt "$env:USERPROFILE\slate-backup\"
Copy-Item SLATE_CURRENT_MASTER_HANDOFF.md        "$env:USERPROFILE\slate-backup\"
Copy-Item PROJECT_HANDOFF.md                     "$env:USERPROFILE\slate-backup\"   # vanishes on fast-forward
```

**Step 1 — Confirm the starting point.**
```powershell
git rev-parse HEAD                                        # expect 4e720c9...
git ls-remote --heads origin claude/slate-cleanup-e4apmx   # expect dc52d64...
git status --short                                        # expect only ?? untracked files
git stash list                                            # expect exactly one
```

**Step 2 — Fast-forward to the real head.** This is the one unavoidable working-tree change, and it is a clean fast-forward (verified ancestor).
```powershell
git merge --ff-only origin/claude/slate-cleanup-e4apmx
git rev-parse HEAD                                        # expect dc52d64...
git status --short                                        # expect clean + untracked
```

**Step 3 — Establish the baseline on real code.**
```powershell
npm ci
npm run typecheck                                         # expect exit 0
npm run test          | Out-File -Encoding utf8 test.log; $LASTEXITCODE
npm run gate          | Out-File -Encoding utf8 gate.log; $LASTEXITCODE
```
Expect **1,253 tests** and **gate exit 0**. Read `$LASTEXITCODE`, **not** a piped `tail`. If either disagrees with those numbers, **stop and investigate before touching anything** — that is a regression, not a starting point.

**Step 4 — Decide the stash, deliberately.** Do not pop it.
```powershell
git stash show -p stash@{0} | Out-File -Encoding utf8 "$env:USERPROFILE\slate-backup\stash.patch"
git diff 227fa5a:tools/cohesion-walk.mjs HEAD:tools/cohesion-walk.mjs
```
Judge whether those 67 lines still add anything now that the remote is 87 commits further on. Apply selectively from the patch if so; otherwise leave the stash and its backup branch alone.

**Step 5 — Re-run the nine sections as a fresh workflow.** Recover the nine briefs verbatim from the exported context:
```powershell
Select-String -Path SLATE-CURRENT-CLEANUP-FULL-CONTEXT.txt -Pattern 'house rot|company money|note magnitude|who-is-free|tax engine|production calendar|save dead shapes|money rules|awards'
```
**Every agent brief must open with a forced base check**, because this failure has already destroyed four items:
```
git fetch origin claude/slate-cleanup-e4apmx
git reset --hard origin/claude/slate-cleanup-e4apmx
ls tests | wc -l        # ~48, NOT ~90
```
Right tree only if vitest reports ~45 files / ~1253 tests. **88 files or 1659 tests means `main` — everything done there is void.**

**Step 6 — Land nothing without the full bar:** typecheck 0, suite ≥ 1253, gate 0 (status from a file), paired played-career measurement over 25 years and multiple seeds, and a mutation showing the protecting test goes red.

---

# 18. EXACT NEXT ACTION FOR ACCOUNT 2

### The very first command

```powershell
git rev-parse HEAD; git ls-remote --heads origin claude/slate-cleanup-e4apmx; git status --short; git stash list; git worktree list
```

### Expected output, exactly

```
4e720c9bec3cd5b5c69015862345fcbf1888202c
dc52d64f69ea501829d2b276366ebffb4e1c7d07  refs/heads/claude/slate-cleanup-e4apmx
?? SLATE-CURRENT-CLEANUP-FULL-CONTEXT.txt
?? SLATE_CURRENT_MASTER_HANDOFF.md
stash@{0}: On claude/slate-cleanup-e4apmx: Teleport auto-stash
C:/Users/sande/Downloads/1221-GIT  4e720c9 [claude/slate-cleanup-e4apmx]
```

### Then inspect, in this order

1. **This file**, completely
2. **`SLATE-CURRENT-CLEANUP-FULL-CONTEXT.txt`**, completely — the nine briefs are in it
3. `docs/DEPTH.md` — the standard and The One Rule
4. `docs/UNBITTEN.md` — the open ledger (**headline count table is stale**)
5. `docs/ARREARS.md` §"Where this stands" — what already cleared
6. `docs/COVERAGE-MATRIX.md` — **required** before assuming any feature exists (§5 UNKNOWN list)

### What must remain unchanged

- **`stash@{0}` / `227fa5a`** — never apply, pop, drop or clear
- The **untracked context export and this handoff** — never `git clean`
- **`origin/claude/slate-cleanup-e4apmx` at `dc52d64`** — never force-push
- **`main`** — do not merge into it without the owner

### How to confirm each thing

| Confirm | Command | Expect |
|---|---|---|
| HEAD | `git rev-parse HEAD` | `4e720c9…` before FF, `dc52d64…` after |
| Remote state | `git ls-remote --heads origin claude/slate-cleanup-e4apmx` | `dc52d64…` |
| Nothing local is unique | `git rev-list --left-right --count HEAD...origin/claude/slate-cleanup-e4apmx` | `0	87` before FF |
| Fast-forward is safe | `git merge-base --is-ancestor HEAD origin/claude/slate-cleanup-e4apmx; $?` | `True` |
| Worktrees | `git worktree list` | **one** line. More means someone started agents |
| Stash | `git stash list` | exactly one, `227fa5a` |
| Stash intact | `git cat-file -t 227fa5a` | `commit` |
| Paused workflow | search `~\.claude` for `*cc2a6ca8*` | **zero hits — it is gone, expected** |

### Before ANY code is merged or committed

1. Fast-forward to `dc52d64` (§17 Step 2)
2. `npm ci`
3. `npm run typecheck` → 0
4. `npm run test` → **1,253** floor
5. `npm run gate` → **0**, status read from a file
6. Only then start work, one section at a time, with the base check in every agent brief

### If validation succeeds

Report the numbers, then pick **one** section. Recommended first: **house rot** — it is measured, it is upstream of the whole late-career collapse, and its screen text is already known to be false. Build → measure paired over 25 years → mutation-test → gate → commit one section per commit.

### If validation fails

**Do not fix forward and do not commit.** Capture `test.log` and `gate.log`, identify the first failing check, and diff against `dc52d64` to prove whether the failure is in the code or in the environment. Two known environment-only failure modes: `tests/endurance.test.ts` is a wall-clock ratio that fails under CPU load (re-run on a quiet machine), and `npm run audit` is POSIX-only and cannot run in PowerShell. A `voice-check` failure is style, not correctness — reword rather than revert.

---

# 19. TWO-ACCOUNT WORKFLOW

**Account 1 = Apple** (originating). **Account 2 = Google** (receiving). Both operate on the same repository: `https://github.com/yvcbcjhsy7-prog/1221.git`.

### Rules

1. **The receiving account reads this handoff and `SLATE-CURRENT-CLEANUP-FULL-CONTEXT.txt` completely, and reports its understanding, before touching code.**
2. **The remote is the shared source of truth.** `origin/claude/slate-cleanup-e4apmx` = `dc52d64`. Always `git fetch` and confirm before starting.
3. **One account works the branch at a time.** Two accounts pushing the same branch will diverge, and this is not hypothetical — this machine sat 87 commits behind for five days without noticing.
4. **Never force-push** the shared branch. All 19 cleanup commits are reachable only from `dc52d64`.
5. **Machine-local state does not transfer.** Agent worktrees, workflow run caches and stashes are per-machine. Anything that must survive a handoff has to be **committed and pushed**, or copied out of the repo. The three lost worktree commits are the direct cost of this.
6. **Hand back the same way:** clean tree, everything pushed, an updated handoff, and an exported context.

### Security

This handoff contains **no** passwords, OAuth codes, tokens, cookies, private login URLs or credential files, and must never be edited to include them. Note that `C:\Users\sande\.claude\.credentials.json` exists on this machine — **do not read, copy, quote or commit it**. `.env.example` is a template only; a real `.env` must stay untracked.

---

# 20. RECOVERY GAPS

**Things that cannot be recovered with certainty, and why.**

| # | Gap | Why | Recoverable? |
|---|---|---|---|
| 1 | **The three paused worktree commits** `a67f5c5`, `653ca3d`, `ae94910` | They were local commits in worktrees on the Linux remote environment, on refs `worktree-wf_cc2a6ca8-f9d-*` that were never pushed. Not objects in this clone; not on the remote | **No** from this machine. Only if that Linux environment is still alive and can push |
| 2 | **Which of the nine sections each worktree held** | The session paused before reading any agent result, so no `build:<key>` label was ever tied to a worktree path. The journal that held the mapping was machine-local | **No.** But it does not matter — all nine briefs survive and all nine are re-runnable |
| 3 | **The `wf_cc2a6ca8-f9d` run cache** (script, journal, cached agent results) | Machine-local to the Linux environment under `/root/.claude/projects/...` | **No** |
| 4 | **Whether any of the three lost commits was actually good** | Never read, never refuted, never gated | **No** |
| 5 | **The identity of the 4th/5th worktrees' sections** | Both were at base `dc52d64` with no commits; nothing distinguished them | **No** |
| 6 | **The "fourth worktree commit"** the request asks for | It does not exist. Three commits, two bases | **N/A — the premise is wrong** |
| 7 | **Exact intermediate agent measurements** from all four workflows | Only figures quoted in the transcript survive; the full structured returns lived in machine-local journals | **Partial** — what is quoted in the transcript and in commit messages |
| 8 | **Whether Base44 is currently deployed**, and against which project | No deploy evidence in this session; `base44/config.jsonc` not inspected for a live project id | **Needs investigation** |
| 9 | **The original intent of the 67 stashed `cohesion-walk.mjs` lines** | The stash message is only "Teleport auto-stash". No commit message, no session record | **Partial** — read the diff and judge |
| 10 | **Whether `docs/COVERAGE-MATRIX.md` still reflects the build** | Not read this session | **Needs investigation** |
| 11 | **The `spentAt` depth-ramp patch itself** | Built, measured, reverted, never committed. Only its description and numbers survive | **No** — but it is re-derivable from §13/§14 |
| 12 | **UTF-8 integrity of the exported context** | The file's box-drawing characters are mojibake (`â–ˆ` etc.), indicating a codepage mismatch at export. Prose is intact and readable | **Cosmetic only** |

---

# 21. RECEIVING ACCOUNT BOOTSTRAP PROMPT

*Paste everything below into a fresh Claude Code session in `C:\Users\sande\Downloads\1221-GIT`.*

---

You are taking over the SLATE project (an actor-and-actress life simulator) from another Claude account. You have **zero** prior conversation history. Do not write or modify any code until you have finished the reading and reporting below.

**Step 1 — Read, completely, in this order:**
1. `SLATE_CURRENT_MASTER_HANDOFF.md` (repository root) — read every section, especially the warning box at the top, §7 (exact stopping point), §8 (paused workflow forensics), §9 (stash), §15 (do-not-redo), §16 (do-not-lose) and §17 (safe resume).
2. `SLATE-CURRENT-CLEANUP-FULL-CONTEXT.txt` (repository root, 3,268 lines) — the full transcript of the previous session. **The nine open work-section briefs are in here verbatim and are the only surviving copy.**
3. `docs/DEPTH.md` — the depth standard, THE ONE RULE, the falsifiability test.
4. `docs/UNBITTEN.md` — the open-work ledger. **Its headline count table is stale; `docs/UNWIRED.json` is the machine truth.**
5. `docs/ARREARS.md` §"Where this stands".
6. `docs/COVERAGE-MATRIX.md` — read before assuming any feature exists.

**Step 2 — Inspect git, and change nothing:**
```powershell
git rev-parse HEAD
git ls-remote --heads origin claude/slate-cleanup-e4apmx
git status --short
git branch -vv
git rev-list --left-right --count HEAD...origin/claude/slate-cleanup-e4apmx
git log --oneline --decorate -20
```

**Step 3 — Inspect the stash WITHOUT applying, popping, dropping or altering it:**
```powershell
git stash list
git log -g --format='%gd %H %ci %gs' refs/stash
git diff --stat 227fa5a^1 227fa5a
```

**Step 4 — Inspect worktrees:**
```powershell
git worktree list
Test-Path .claude/worktrees
```

**Step 5 — Confirm the exact stopping point.** Verify each of these and say CONFIRMED or CONTRADICTED with evidence:
- Local HEAD is `4e720c9`; **remote** HEAD is `dc52d64`; local is 0 ahead / 87 behind and fast-forwardable.
- Tracked files are clean; there are untracked files; there is exactly one stash.
- **No `.claude` directory and no workflow worktrees exist on this machine.**
- The paused workflow `wf_cc2a6ca8-f9d` **cannot** be resumed here — neither its script nor its run cache is present.
- The three worktree commits `a67f5c5`, `653ca3d`, `ae94910` exist neither locally nor on the remote, and are lost.
- The 19 cleanup commits `75733f6..dc52d64` are all present on the remote.

**Step 6 — Preserve all paused work.** Do **not** run `git stash pop/apply/drop/clear`, do **not** `git clean`, do **not** force-push, do **not** delete `SLATE-CURRENT-CLEANUP-FULL-CONTEXT.txt` or `SLATE_CURRENT_MASTER_HANDOFF.md`. Creating a protective ref (`git branch teleport-stash-backup 227fa5a`) is encouraged.

**Step 7 — Report before doing anything else.** Give me:
- current HEAD, remote HEAD, ahead/behind
- clean/dirty state and every untracked file
- stash count and what the stash contains
- worktree count
- whether the paused workflow is resumable here, with evidence
- the nine open sections, named
- what you believe the single highest-value next task is, and why
- anything in the handoff you found **contradicted** by the repository

**Then stop and wait for my instruction.** Do not fast-forward, validate, install, commit, push, or write code until I tell you to.

---

*End of handoff.*
