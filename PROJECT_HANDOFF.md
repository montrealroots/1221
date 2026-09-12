# PROJECT_HANDOFF.md

**This is the permanent shared handoff between two separate Claude Code accounts working on this repository. Read this file in full before doing anything else. Update it before your session ends or before switching accounts — see section 10.**

Last updated: 2026-09-12, by the session that rebuilt rank 8 ("the picture's afterlife") from the transcript spec. That work is complete and verified in the working tree and is **not yet committed** — see sections 5, 8 and 9.

Two things a reader should know before anything else:
- **`npm run gate` now passes on Windows: exit 0, 37 test files, 770 passing, 1 todo, 0 failures.** It did not before this session — six of the twelve custom tools and 14 tests were failing on path separators and line endings alone. That whole class of breakage has been fixed at the source (see section 3). The gate is a usable bar on either platform now.
- **Verify this file's claims against the code.** The previous revision asserted a timeline bug had been fixed and committed; it had not, and the bug was still live on disk. Requirement #14 now records that lesson.

---

## 1. PROJECT OVERVIEW

**SLATE** is an actor-and-actress life simulator (`package.json` description: "SLATE - an actor and actress life simulator"). The player is the **talent** — not the studio boss, not the booker, not the producer. That single choice is the game's stated point of differentiation from every reference game in its genre.

The design standard the project holds itself to (`docs/DEPTH.md`) is explicit: **SLATE must be a deeper simulation than *Total Extreme Wrestling* and *The Movies* combined**, judged against three named reference games:
- **TEW** (Total Extreme Wrestling) — the deepest entertainment-industry sim ever built: full-record people, backstage relationships that evolve off-screen, popularity tracked by region, contracts with real terms, an industry with its own clock.
- **The Movies** (Lionhead, 2005) — the best film game: a walkable lot, aging/weight/difficulty stars, a picture actually being made rather than abstracted into a cost.
- **Hollywood Mogul** — the deepest film *business* sim: rights, chain of title, negative cost apart from P&A, sequential release windows by territory.

All three put the player as buyer/boss. SLATE puts the player as talent, which is the axis none of them have and is why typecasting (the industry's lagging categorical view of an actor, separate from what they can actually do) is called out as the one mechanic no reference game can express.

**The One Rule**, stated first in `docs/DEPTH.md` because it's the failure mode the project is most exposed to: **"A declared word with nothing that reads it is worse than no word at all."** Dead/unwired vocabulary is treated as an active liability, not neutral scaffolding — see `tools/inventory.mjs`, `docs/UNWIRED.json`, and the ratchet history in the commit log (e.g. `2d82f4a Ratchet the dead vocabulary: 169 declared words nothing reads`).

### Architecture

- **Runtime**: TypeScript, React 18, Vite, `react-router-dom`. Deployed via Base44 (`base44/` directory, `npm run base44:deploy`).
- **Simulation core** (`src/engine/`):
  - `src/engine/core/` — primitives: `Money` (integer cents), `ids`, time.
  - `src/engine/domain/` — the data model. `domain/model.ts` is the `Universe`/`Project`/etc. shape; `domain/company.ts` is the company/production-house record.
  - `src/engine/content/` — **declarative data**: what exists in the world (stage specs, deal terms, periods, sugar-quota rules, geography). Content files are the "what," world files are the "how."
  - `src/engine/world/` — **simulation logic** that operates on content against a live `Simulation`/`Universe`. This is where state changes happen.
  - `src/engine/systems/`, `src/engine/persistence/` — supporting engine layers.
  - `src/engine/decided.ts` — the **decider registry**: every stochastic/derived decision in the sim (e.g. "would a production book this stage," "what does a finished picture take") is registered here as a `defineDecider`, with a declared `reads` (what inputs matter) and `decide` function, and `sample`. `tools/deciders.mjs` gates on every decider proving its declared inputs actually matter (see section 4).
  - `src/engine/index.ts` — wires every world module's `register*` function into the sim and lists recurring world processes.
- **UI** (`src/ui/`): `looks/` (per-entity detail views, e.g. `looks/business.tsx` renders a production/company), `screens/`, `shell/`, `creation/`, `startup/`, `saves/`, `workspaces/`, `components/`.
- **Docs** (`docs/`):
  - `docs/DEPTH.md` — the standard above, plus **The Build Order**, a dependency-ordered (not appetite-ordered) list of 12 ranks the engine is built up through. This is the authoritative roadmap. See section 4.
  - `docs/research/` — four large research documents (see section 3) capturing real-world industry data the content files are checked against.
  - `docs/COVERAGE-MATRIX.md`, `docs/DRILL-DOWN.md`, `docs/STYLE.md`, `docs/BASE44.md`, `docs/UNWIRED.json` — supporting standards/reference docs.
- **Tests** (`tests/`): 36 test files, Vitest.
- **Tools** (`tools/`): a large custom lint/gate suite beyond typecheck/eslint/vitest — see section 7.

---

## 2. CURRENT IMPLEMENTATION STATE

Everything below is verified against the actual files on disk in this repository (branch `claude/slate-cleanup-e4apmx`, HEAD `6f57b23`), not just the transcript.

### Working systems

- **The Title (DEPTH.md rank 1 — marked "Done")**: a picture (`Project`) has a dated life driven by `content/making.ts` + `world/making.ts`:
  - `content/making.ts` defines `Period` (prep/shoot/post/delivery-style phases) as **data, not an enum**. Each `Period` carries a `spends` share of budget and a `unit: { one, many, aWeek }` describing what a week of that period produces and how many units a week holds. This is a deliberate architecture decision — see section 4.
  - `world/making.ts` (~28KB) lays a plan's periods onto real calendar dates from a single producer-chosen number (shoot length in weeks), books a stage off the **same booking board** a paying outside tenant uses (`world/lot.ts`), spends the budget across periods as time passes, computes overrun proportionally when a schedule is compressed below what the budget implies, and gates payment behind a contractual delivery checklist (`DELIVERY` elements in `content/making.ts` — e.g. a music cue sheet nobody on the crew is assigned to produce, so a finished film can sit unpaid).
  - Registered via `registerMaking(sim)` in `src/engine/index.ts`.
  - Decider: `decideSlip` (`world/making.ts`) — registered in `decided.ts`.
  - Tests: `tests/making.test.ts` (~24KB), including a regression test that a schedule slip leaves `sim.universe.scheduled` sorted (see section 6 for the bug this guards against).
- **The Lot as a business** (feeds DEPTH.md rank 14, "the lot as an operating asset"): `content/lot.ts` + `world/lot.ts`.
  - Four physical stages (`STAGES` in `content/lot.ts`): Askja (6,000 m², 30 m clear, €90,000/week), Lón (3,200 m², 18 m clear, water tank, €82,000/week), Stage 3 and Stage 4 (2,000 m² each, 18 m clear, €43,000/week each, interconnecting doors).
  - `THE_RATE_CARD.benchmarkPerSqmWeek = 23` (€/m²/week, 2026 money) — sourced from Lambert Smith Hampton's 2018 UK studio market review (see section 3, "the rate card fix").
  - `OVERHEAD` (`content/lot.ts`): monthly fixed costs, largest line is a 1%-of-build-cost sinking fund (€200,000/month) plus property tax (€176,000/month, "Fasteignaskattur") and others.
  - `BUILD_COST_CENTS = €240,000,000` — SLATE's own derived figure, anchored to a real UK new-build benchmark (£430–577/sq ft) and explicitly adjusted for Iceland (scarce labor, imported structural materials priced in euros, cheap geothermal power, stable ground). Held in euros deliberately, not króna, because the steel/acoustic liner are euro-priced and a four-year build should carry FX risk as a live risk, not a footnote.
  - `breakEvenShare(sim)` (`world/lot.ts`): the load-bearing number for the whole lot bet — monthly overhead ÷ (sum of all stage week-rates × weeks/month if every stage were full every week). Currently derives to **~62% occupancy** (see section 3 — this used to be a false 33%).
  - `wouldBook(sim, need, from)` (`world/lot.ts`): the booking decision. Weighs a production's crew-import penalty (flying an international crew to Iceland) against the Icelandic production incentive rebate tiers. Registered as a decider.
  - `CLAIMS` (`content/lot.ts`): the lot's truthful superlatives, each stated with the specific measure it's checked against (e.g. "largest sound stage in Europe by volume," checked against Korda Stage 6's published figure) — a deliberate house rule against unverifiable claims (see section 4).
  - Registered via `registerLot`/`buildTheLot` in `index.ts`.
- **The Sugar business** (`content/sugar.ts` + `world/sugar.ts`): a second, separate family business line with its own monthly quota mechanic (`decideQuota` in `decided.ts`, `seedTheQuota` in `index.ts`). Kept explicitly distinct from the lot's finances (see commit `806c00d`, "say which business is which").
- **Company/production model** (`domain/company.ts`, `world/company.ts`): companies, holdings, postings, projects. `foundTheCompany`, `foundTheSugarGroup`, `companiesOf`, `holdingsOf`, `postsOf`, `projectsOf`, `registerCompanyCommands`, `whereItStands`.
- **Family/estate/geography/incorporation/citizenship/household/standing/taste/portrait/holidays/weather/calendar/navigation/persistence** — pre-existing systems from before the current cleanup arc; not touched by the work this handoff concerns, and not audited in this pass. Their test files exist and are listed in section 7.
- **UI**: `src/ui/looks/business.tsx` renders a production's/company's detail view, including (as of the current HEAD) the schedule, delivery checklist, and lot-booking status. It does **not yet** render anything about sale/waterfall economics — that UI code was written in the prior session but never committed (section 5).

### Important files map

| File | Role |
|---|---|
| `docs/DEPTH.md` | Authoritative standard + build order. Read this before planning any new engine work. |
| `docs/research/README.md` | Index of the four research docs, and an honest account of what's incomplete in each. |
| `docs/research/{STAGE,LOT,PIPELINE,KINDS}.md` | Raw research corpus (2,392+ items), quoted verbatim from source operators/standards. Exempted from `tools/spelling.mjs` Americanization. |
| `src/engine/content/{making,lot,sugar}.ts` | Declarative data for title-life, lot economics, sugar business. |
| `src/engine/world/{making,lot,sugar,company}.ts` | Simulation logic operating on the above. |
| `src/engine/decided.ts` | Every stochastic/derived decision in the sim, as `defineDecider`s. |
| `src/engine/index.ts` | Wires every world module into the running `Simulation`. |
| `tests/{making,business}.test.ts` | Cover the title-life and lot/business systems respectively. |
| `tools/deciders.mjs`, `tools/inventory.mjs`, `tools/wired.mjs`, `tools/spelling.mjs` | Custom gate tools — see section 7. |

---

## 3. COMPLETED WORK

All of the following is **committed and pushed** to `origin/claude/slate-cleanup-e4apmx`, currently at HEAD `6f57b23`. Gate (typecheck + lint + tests + all custom tools) was green as of this commit, per its own commit message.

### Features completed

1. **A greenlit picture walks its own calendar** (rank 1 extension, commits `1a3b3f0`, `01570a0`):
   - `content/making.ts` + `world/making.ts` created from scratch.
   - `company.greenlight` lays a plan's periods onto real dates from one producer-chosen number (shoot length).
   - The picture books a stage off the **same booking board** a paying outside tenant uses — this is called out in the prior session and in this handoff as the single fact that must never regress (see section 4): if the family's own productions stop competing for lot capacity like anyone else, the lot becomes scenery and the entire reason for building it as a business disappears.
   - Budget is spent across periods as time passes.
   - Overrun is read off the schedule (give €20m six weeks of shoot but only pay for four, and it runs over proportionally) rather than being an independent random roll.
   - A finished cut is not the same as a delivered, payable picture — a contractual delivery checklist (`DELIVERY` in `content/making.ts`) must be complete first, and at least one delivery item (a music cue sheet) is nobody's assigned job, so a finished film can sit unpaid indefinitely. This is intentional, not a bug.
   - **Design decision embedded in the code**: `Period.unit` (a `{one, many, aWeek}` triple) exists specifically so the engine never hardcodes "the shoot day" as the unit of work. This was validated against research showing a CG-animated feature has no principal photography at all (no call sheet, no locations, no weather) and counts approved seconds per week instead.

2. **Research corpus landed** (commit `6f57b23`): four exhaustive research documents (`docs/research/STAGE.md`, `LOT.md`, `PIPELINE.md`, `KINDS.md`), 2,392+ items, each sourced or explicitly marked as an estimate. `docs/research/README.md` states exactly what's complete and what isn't (see section 6). `tools/spelling.mjs` updated to exempt `docs/research/` from Americanization, because those files are verbatim quotations of operators/standards/trade practice and editing a quotation is editing a source, not applying house style.

3. **Three real modeling faults found by cross-checking content against research, and fixed** (commits `09666ed`, `d283545`, `6f57b23`):
   - **Stage rate card was ~2× the real market rate.** The published UK benchmark (Lambert Smith Hampton, 2018) is £1.25–1.50/sq ft/week for a prestige stage; SLATE's rates were the equivalent of £2.41–3.54. This mattered more than an ordinary wrong number because `breakEvenShare` (overhead ÷ full-lot earnings) is directly downstream of it — the false rate made break-even read 33% when the honest figure is **~62%**. Fixed by halving the rate card to the benchmark-derived €23/m²/week baseline. The overhead side was checked too and found to have no competing benchmark (it was already derived line-by-line), so the correction is one-sided and intentional.
   - **The "goes to Budapest" refusal in `wouldBook` was unreachable code.** The function weighed a hardcoded crew-import penalty of 0.22 against Iceland's production-incentive rebate tiers, and the penalty lost to both tiers unconditionally — every enquiry that found a free stage booked it, regardless of economics. The real import uplift researched is 25–40%. Fixed at the midpoint so only productions large enough to qualify for the higher rebate tier find Iceland worth it economically — which is what that tier exists to select for.
   - **Every modeled enquiry was foreign**, when research shows ~82% of Iceland's incentive-claiming productions are domestic. The enquiry mix was corrected to be predominantly domestic.

4. **`docs/DEPTH.md` build order corrected to match research** (commit `6f57b23`): rank 4 previously read "The shoot day and the take. The atom." `docs/research/KINDS.md` demonstrates there is no single atom across production kinds (live-action counts shoot days, CG animation counts approved seconds/week/animator, documentary counts banked-then-cut minutes, unscripted counts contributor-days, multi-cam counts one show a week). Naming the shoot day in the engine would foreclose every other kind permanently. Rank 4 is now **"The unit of work, declared by the plan,"** matching `Period.unit`. Rank 1 is marked "Done."

### Bugs found and fixed during this work

- **Timeline corruption on schedule slip.** `world/making.ts`'s slip logic mutated `scheduled item.at` directly instead of calling the sim's own `sim.timeline.reschedule(id, at)`. The timeline is held sorted and walked by a forward-only scan cursor, so writing `at` in place leaves the list unsorted, which surfaces as an event firing out of order, silently, potentially much later in a run.

  **CORRECTION (2026-09-12, this session):** an earlier version of this handoff claimed this fix was committed at `6f57b23`. **It was not.** The bug was still present on disk at `6f57b23` (`item.at += by`, formerly at `world/making.ts:502-503`); the fix had been part of the same uncommitted batch as the selling work and was lost with it. It has now been genuinely fixed — the slip filters the affected items and calls `sim.timeline.reschedule` on each — and that fix is in the working tree described in section 5, not yet committed. Treat this as a worked example of requirement #14 below: verify a handoff claim against the code before relying on it.
- No other code-level bugs found in the committed work. (Two further bugs were found and fixed in the *uncommitted* selling/waterfall work — see section 5.)

### Tests completed

- `tests/making.test.ts` — full coverage of the title-life system, including the timeline-sort regression test above.
- `tests/business.test.ts` — extended for the lot-refusal and rate-card fixes (commit `d283545`).
- Per the `6f57b23` commit message: 737 tests green, plus typecheck/lint/gate, all by exit status, at the time of that commit.

---

## 4. REQUIREMENTS AND DECISIONS

These are standing rules. **Any future session, on either account, must preserve them** unless the user (the human running these two accounts) explicitly overrides one in a future conversation — in which case, record the override here.

1. **The player is the talent, not the studio boss.** This is the foundational differentiator from every reference game (TEW, The Movies, Hollywood Mogul) and must not drift toward a management-sim framing.
2. **"A declared word with nothing that reads it is worse than no word at all."** (`docs/DEPTH.md`, "The One Rule.") Never add a type, field, or content entry that nothing in the engine reads. `tools/inventory.mjs --check` and `tools/wired.mjs --check` are part of the gate specifically to enforce this; do not weaken or bypass them.
3. **The Build Order in `docs/DEPTH.md` is dependency-ordered, not appetite-ordered.** It exists because later ranks genuinely depend on earlier ones (e.g. reputation-writers, rank 7, are outputs of ranks 4–6 and cannot precede the events they record). **Deviating from it should be a conscious, stated decision, not default momentum.** Note: the prior session's unfinished "selling/waterfall" work (section 5) is rank 8 ("The picture's afterlife"), started immediately after rank 1 without first doing ranks 2–7 (people generated by productions, the engagement/deal record, the unit-of-work resolution function, the union floor, the body record, reputation writers). This was done on a terse user instruction ("Just resume with what we been doing") rather than a deliberate re-ordering decision. **Flag this to the user explicitly before continuing rank 8 work**, so the skip is a decision rather than an accident.
4. **Periods are data, never an enum.** (`content/making.ts` `Period.unit`.) Nothing downstream of the plan may name "the shoot day" or any other kind-specific unit directly — it must go through the period's declared `unit`. This was validated against real research (CG animation has no shoot days at all) and is treated as load-bearing, not stylistic.
5. **The family's own productions must compete for lot capacity exactly like an outside paying tenant, using the same booking board.** This is called out as the single fact that, if it regresses, turns the lot into scenery and removes the entire reason it was built as a business. Any future change to booking/scheduling must preserve this.
6. **Every claim the game states about itself must be checkable.** (`content/lot.ts` `CLAIMS`.) Superlatives ("largest in Europe by volume") must ship with the specific measure and the specific competitor figure they're checked against, sourced from that competitor's own published data. Never state an unverifiable superlative flatly.
7. **Real-world research data (`docs/research/`) is quoted verbatim and is exempt from house style.** `tools/spelling.mjs` skips `docs/research/` because those documents quote operators, standards bodies, and trade press who spell things their own way (mostly British/European). Editing a quotation to match house style is editing a source. The house style (American spelling) governs only what *SLATE itself* says — its content files, its UI text, its docs prose outside `docs/research/`.
8. **Deciders must prove their declared inputs matter.** (`src/engine/decided.ts`, `tools/deciders.mjs --check`.) Every `defineDecider` declares a `reads` map of which simulation inputs feed the decision; the gate tool checks this isn't decorative. When adding a new decider, make sure at least one test exercises a case where changing a declared input changes the outcome — the project has an explicit house test for this pattern (see the waterfall test described in section 5: "if changing a term does not change who gets paid what in a downside case, the model is decoration").
9. **Money is an ordered waterfall applied to a cash-account, not a lookup.** (Applies to the interrupted selling/waterfall work in section 5, but is a durable modeling principle for any future money system in this project.) Recoupment tiers must be computed by walking receipts *in the order they arrive*, because interest on an unrecouped negative accrues on the outstanding balance between receipts and cannot be derived from a lump total. A flat interest charge against the original principal for the picture's whole life is wrong and was caught as a real bug (turned a €20m debt into a fictitious €47m).
10. **Only store the minimum fact; recompute everything else.** (Also from the selling work.) The project's project record was designed to store *only which windows have paid* (`windowsPaid: string[]`) and recompute gross-to-date/tier-shares/company-take from that plus the deal terms every time, specifically so a derived figure can never drift out of sync with the receipts that produced it. Apply this pattern to any future stateful money or scheduling system: prefer recomputation from a minimal log over storing derived totals.
11. **`npm run typecheck` must be run via `npm run typecheck` (i.e. `tsc -b --noEmit`), never a bare `npx tsc --noEmit`.** The root `tsconfig.json` uses `files: []` with project references; a bare `tsc --noEmit` silently compiles nothing and an exit 0 from it means nothing. This tripped up the prior session directly (it discovered a whole new file, `making.ts`, wasn't being typechecked at all because of this).
12. **Never commit with `--no-verify`, never force-push, never amend a pushed commit.** Standard repo hygiene per the global Claude Code instructions this project's sessions operate under; nothing project-specific overrides this.
13. **Attribution**: commits from a Claude Code session in this repo should end with the session's own `Co-Authored-By`/`Claude-Session` trailer lines, matching whatever the active session's system reminder specifies. (Do not copy a trailer from a *different* session's commit — each account/session has its own session URL.)
14. **Verify this file against the code before relying on it.** Added after a concrete failure: section 3 claimed a timeline bug was fixed and committed when the bug was still on disk (see section 3's correction note). A handoff is a snapshot written by a session that may have been cut off mid-task. When a claim here matters to what you are about to build, check the actual file. Two minutes of `grep` beats building on a fiction.
15. **A regression test must be shown to fail without the fix.** House rule already implied by requirement #8 and by the project's own "if changing a term does not change the outcome, the model is decoration" standard, recorded here because it caught a real miss: the first version of the timeline-sort regression test passed even with the bug deliberately reintroduced, because one picture slipping alone never crosses another scheduled item. A test that cannot fail is decoration. Reintroduce the bug, watch the test go red, then restore the fix.

---

## 5. CURRENT UNCOMMITTED / IN-PROGRESS WORK

**Status as of 2026-09-12 (this session): rank 8 has been rebuilt from the transcript spec and is complete and working in the working tree. It is NOT yet committed.** The user asked to "start back up right where we left off"; the build-order deviation in requirement #3 was surfaced to them first and they chose to continue rank 8 rather than backfill ranks 2–7, so that skip is now a recorded decision rather than an accident.

Everything below exists on disk and passes. `SLATE-CLEANUP-FULL-CONTEXT.txt` can be deleted once this is committed — its only remaining value was as the spec for this rebuild.

### What was built, and what each piece does

| File | What it does |
|---|---|
| `src/engine/content/selling.ts` (new, ~235 lines) | Declarative data. `TIERS` — the waterfall's four tiers in paid order: `fee`, `marketing`, `negative`, `net`. `DEALS` — three deals that *fail differently* rather than being three sizes of one: `studio` (fee 0.325, spendsOnSelling 0.85, upFront 0, reach 1, keepsNet 0.5), `streamer` (an outright buyout: fee 0, marketing 0, upFront 1.2, reach 0, keepsNet 1), `agent` (fee 0.2, spendsOnSelling 0.15, reach 0.55, keepsNet 0.9). `WINDOWS` — five release windows whose `share` values sum to exactly 1: theatrical (week 0, .34), home (week 2.5 — the 17-day window, .26), pay (week 39, .22), free TV (week 130, .12), library tail (week 260, .06). Plus `INTEREST_A_YEAR = 0.1`, `RELEASE_WEEKS = 12`, and `ultimateFor(negativeCents)`. |
| `src/engine/world/selling.ts` (new, ~275 lines) | The engine. `splitIt(receipts, deal, negativeCents)` walks dated `Receipt[]` (`{weeksOut, cents}`) in arrival order, accruing interest only on the outstanding balance between consecutive receipts and stopping the moment the negative is covered (requirement #9). `standingOf(project)` rebuilds the receipt list from `windowsPaid` and recomputes everything (requirement #10). Also `grossSoFar`, `decideTake`/`Prospects`, `dealsOnTheTable`, `sellIt`, `whereTheMoneyStands`, `tiersFor`, `registerSelling`, and the `project.window` scheduled kind. |
| `src/engine/domain/company.ts` (edited) | Five new optional fields on `Project`: `dealId`, `soldAt`, `releasedAt`, `takeCents`, `windowsPaid` — `windowsPaid` being the only stored money fact. |
| `src/engine/index.ts` (edited) | `registerSelling(sim)` wired alongside the other `register*` calls. |
| `src/engine/decided.ts` (edited) | The `selling.take` decider, reading `budget` and `deal`. The sweep in `tests/deciders.test.ts` passes: both declared inputs genuinely move the bucketed outcome. |
| `tests/selling.test.ts` (new, 29 tests) | All passing. Includes the research's own bar (a fee change and a marketing change must each move a *downside* outcome), the 3×-budget rule-of-thumb test, a test that interest does not run on the whole negative forever, a conservation test (every tier's take sums to the gross across every deal × age × gross combination), and a test that a buyout never pays twice. |
| `tests/making.test.ts` (edited, +1 test) | Regression test for the timeline bug. **Note:** it greenlights *two* interleaved pictures deliberately — one picture slipping alone never crosses another scheduled item, so a single-picture version of this test passes even with the bug present. See requirement #15. |
| `src/ui/looks/business.tsx` (edited) | "Where The Money Went" (every tier's take plus what is still outstanding) and "The Windows" (paid / not yet) on the production detail view, shown once `dealId` is set. The look's summary line switches to `whereTheMoneyStands` for a sold picture. |
| `docs/COVERAGE-MATRIX.md` (edited) | Prose paragraph for `company.sell`, plus the generated inventory block hand-updated (17→18 commands, 7→8 scheduled kinds, `company.sell` and `project.window` rows). **Hand-edited because `tools/inventory.mjs` cannot run on Windows — see section 6. Regenerate with `node tools/inventory.mjs --markdown` on Linux to confirm it matches.** |

### The two bugs from the lost work, both reintroduced as fixes and pinned by tests

1. **Interest on the full original negative for the picture's whole life** (which turned a €20m negative into a fictitious €47m) — avoided by building `splitIt` to walk dated receipts from the start. Pinned by "charges interest on what is outstanding, not on the whole negative forever."
2. **An outright sale reporting a waterfall split it does not have** — `whereTheMoneyStands` returns early for `deal.reach === 0`. Pinned by "does not describe a split an outright sale does not have."

On the `keepsNet` polarity the old handoff warned about: the correct semantic is **the share of the surviving net that the seller's company keeps**, and `streamer.keepsNet = 1` is right because a buyout's fixed price is owed to nobody else. The prior handoff's prose ("keeps net proceeds entirely with the buyer") described it backwards. The test `lets a picture recoup on a deal with no fee and no marketing to repay` pins it: an outright sale at 1.2× the negative must return exactly 1.2× to the company.

### The cross-platform repair (second half of this session)

The gate was unrunnable on Windows. Since the user works from a Windows machine and the other account works from Linux, that made the project's own bar for "done" unreachable from one of the two accounts. Fixed at the source rather than worked around, and every fix is platform-neutral — forward slashes and `\r?\n` behave identically on Linux, so nothing here is a Windows special case.

| File | Fix |
|---|---|
| `tools/spelling.mjs`, `tools/typos.mjs`, `tools/plural-check.mjs`, `tools/wired.mjs`, `tools/deciders.mjs` | Each `walk()` now builds `` `${dir}/${name}` `` instead of `join(dir, name)`, so discovered paths match the forward-slash allowlists, exemptions and `drawnIn` values these tools compare against. The now-unused `node:path` imports were removed. |
| `tools/inventory.mjs` | Stopped deriving a base directory from `import.meta.url` — on Windows `new URL('..').pathname` gives `/C:/…`, which `join` turned into a path with a drive letter in the middle and crashed `readdirSync`. Now uses repo-relative paths like every other tool. Its `--check` also compares the matrix block as content rather than bytes, because a CRLF checkout made the comparison fail no matter what the block said. |
| `src/engine/content/geography.ts`, `src/engine/content/holidays.ts` | **A real runtime bug, not a test artifact.** Both `.tsv` loaders split on `'\n'`, so on a checkout with CRLF endings a carriage return stayed stuck to the last field of every row — the *place kind* for cities, and the region code or holiday type for holidays. Now split on `/\r?\n/`. This corrupted live game data on any Windows checkout with `core.autocrlf=true`, which is the default here. |
| `tests/geography.test.ts` | Reads its data files with `/\r?\n/`. |
| `tests/interface.test.ts` | `walk()` emits forward slashes, so `BRAND_FILES` matches and the clapper brand mark is stripped in the five files allowed to carry it. |
| `tests/cohesion.test.ts` | Normalizes the entries from `readdirSync(..., { recursive: true })`, which come back with backslashes on Windows. |
| `tests/premise.test.ts` | Normalizes `fileURLToPath` output, so `core/performer.ts` — the one module allowed to spell the performer titles out — is exempted as intended rather than flagged. |

Each repaired tool was then **canary-tested to confirm it still detects real violations** rather than silently scanning nothing: a file carrying `colour`/`teh` was caught by `spelling` and `typos`, and a `${n} thing` interpolation was caught by `plural-check`. A tool that passes because it examines nothing is the exact failure mode this project exists to prevent, so this check matters more than the green exit code.

### Verified, and how

- **`npm run gate` — exit 0.** Typecheck, lint, 37 test files / 770 tests passing / 1 todo / 0 failures, then all twelve custom tools clean. This is the project's own full bar for done, and it is now met on Windows as well as Linux.
- The suite grew from 738 tests to 771 (+29 selling, +1 making regression, +3 from the new decider's sweep), and the 14 pre-existing Windows failures went to zero.
- A **live save-probe** was run (handoff step 3h) across all three deals and a never-recouping picture. The ledger agreed with the waterfall to the cent in every case (`banked === split.toTheCompanyCents`), `validateUniverse` stayed sound throughout, and the 3× rule showed up unprompted: a picture taking 2.83× its negative still left €2.0m unrecouped.
- The timeline regression test was verified to **fail** with the bug deliberately reintroduced, then pass with it restored.

---

## 6. KNOWN ISSUES

- **RESOLVED (2026-09-12): the gate could not pass on Windows at all, and now does.** Full write-up in section 3 under "The cross-platform repair." Summary of what was wrong, kept because it explains why earlier handoff revisions could not report a green gate: every tool built paths with `path.join` (backslashes on Windows) and compared them against allowlists written with forward slashes, so `inventory.mjs` and `wired.mjs` crashed outright, `spelling.mjs` reported 261 false British spellings in the exempt research docs, `typos.mjs` flagged its own dictionary, `plural-check.mjs` flagged 13 allowlisted lines, and `deciders.mjs` called every decider stale. Fourteen tests failed for the same reason plus CRLF. All fixed at the source; `npm run gate` is exit 0 on Windows.

- **The lot has no demonstrated path to viability, by design/finding, not by bug.** With the corrected (honest) rate card and booking logic, a simulated run across five years and three seeds produced ~10 bookings/year, ~21% occupancy against the corrected ~62% break-even, and the family fronting ~€30m. Worse: enquiry volume is currently **hardcoded at one a month and responds to nothing** — that axis is inert, so nothing the player does can currently change the outcome. This is a real, load-bearing finding, not a defect to quietly patch. The research (`docs/research/LOT.md`) names the real-world answer studios use for exactly this problem: a **master lease** (e.g. Netflix's 14-stage, 10-year Shepperton deal in 2019; Amazon's 9 stages in 2022), with the documented counter-risk of over-concentration in one counterparty ("no single counterparty above 40% of revenue" is the kind of guardrail real operators use). This is flagged as new scope requiring an explicit decision from the user before building, not something to build unprompted.
- **`docs/research/PIPELINE.md` and `docs/research/KINDS.md` are incomplete.** Two rounds of usage-limit kills during research generation left them partial:
  - `PIPELINE.md`: only 7 of 20 planned domains landed. Covers development → screenplay → genre/format/rating → characters → breakdown → budgeting → casting, then stops dead exactly where the crew comes on set. Missing: crew/departments, production design, costume, locations, camera, lighting, on-set sound, the shoot day itself, effects, post-picture, post-sound, marketing, and a planned final "engines" synthesis that was meant to answer cross-cutting questions directly (e.g. camera-department specifics).
  - `KINDS.md`: 8 of 13 planned kind-breakdowns landed. Missing: VFX tentpole, micro-budget, returning series, short form, and a spine synthesis.
  - `docs/research/README.md` documents this precisely and states the missing agents can be resumed from the same run IDs with only the missing agents costing anything (nothing already captured needs to be re-run) — but confirm this is still true; workflow run IDs/caches may have expired since (the export shows a resets-Thursday weekly limit was hit around 2026-09-14 11:00 UTC-ish, and this recovery is happening 2026-09-12, so check current date against that before assuming caches are warm).
- **RESOLVED (2026-09-12): the selling/waterfall work has been rebuilt** and is described in section 5. It was written from the transcript as a specification rather than retyped, and every constant and polarity was re-derived against the tests.
- **An unrecouped negative stops accruing interest after the last receipt, by construction.** `splitIt` is a pure function of the receipt list and takes no "now," so once the final window has paid, `stillOwedCents` freezes even if years pass. The live probe shows this plainly: a never-recouping picture reads the same outstanding balance at week 260 and week 520. This is defensible (the split describes what the receipts did, not what is owed today) and matches how the subsystem was specified, but it means the outstanding figure shown to a player understates a long-dead picture's debt. **Flagged as a design question, not patched** — fixing it would mean passing the current instant into `splitIt` and giving up its purity, which several tests rely on.
- **No test currently exists for the lot's structural finding** (10 bookings/year, 21% occupancy, inert enquiry volume) as a pinned regression — it was an ad hoc multi-seed probe run live, not a committed test. If this finding matters for future decisions (e.g. whether to build the master-lease mechanic), consider whether it should be pinned as a test so a future change can't silently alter it unnoticed.
- **RESOLVED: `node_modules` is now installed** (`npm install`, exit 0, 2026-09-12). Note that npm skipped `esbuild`'s postinstall script with a warning; this turned out not to matter, as Vite and Vitest both run fine.
- **Base44 deployment (`base44/`) and its tests (`tests/base44-*.test.ts`) were not reviewed in this recovery pass** and are not known to be affected by any of the above; flagged here only so a future session doesn't assume they were checked.

---

## 7. TESTING STATE

### Commands

- `npm install` — required first in any fresh clone/environment (see section 6).
- `npm run typecheck` — `tsc -b --noEmit`. **Do not** run bare `npx tsc --noEmit`; see requirement #11 in section 4 — it silently compiles nothing under this repo's project-references setup.
- `npm run lint` — `eslint . --ext .ts,.tsx --max-warnings=0`.
- `npm run test` — `vitest run`, 36 test files.
- `npm run validate` — typecheck + lint + test, in that order.
- `npm run gate` — `validate` plus a chain of custom tools, in order: `title-case.mjs --check`, `label-sweep.mjs`, `plural-check.mjs`, `voice-check.mjs --check`, `tics.mjs --check`, `doc-refs.mjs --check`, `wired.mjs --check`, `deciders.mjs --check`, `spelling.mjs`, `typos.mjs`, `geo-check.mjs` (via `vite-node`), `inventory.mjs --check`. **This is the full bar for "done" on any change to `src/`, `tests/`, or `docs/`.**
- `npm run base44:contract` / `npm run base44:smoke` — Base44 integration checks, separate from the main gate.

### Last known-good state

Commit `6f57b23` claimed **typecheck clean, 737 tests passing, gate green, lint clean** on Linux. When re-checked on Windows on 2026-09-12 it did not reproduce — 14 tests failed and 6 of the 12 custom tools failed or crashed, all on path separators and CRLF. That has since been fixed at the source (section 3).

### Current state in the working tree (2026-09-12, Windows)

**`npm run gate` — exit 0.** Specifically:

- `npm run typecheck` — clean.
- `npm run lint` — clean.
- `npx vitest run` — **37 test files, 771 tests: 770 pass, 1 todo, 0 fail.**
- All twelve custom tools clean: `title-case`, `label-sweep`, `plural-check`, `voice-check`, `tics`, `doc-refs`, `wired`, `deciders`, `spelling`, `typos`, `geo-check`, `inventory`.
- `tools/deciders.mjs` specifically confirms `src/engine/world/selling.ts (line 217) → selling.take`, and `tools/inventory.mjs --check` confirms the matrix matches the code at 18 commands and 8 scheduled kinds.

---

## 8. GIT STATE

- **Current branch**: `claude/slate-cleanup-e4apmx`. **Two commits ahead of `origin` — NOT yet pushed.**
- **Main branch**: `main` (for eventual PRs).
- **HEAD**: `9d11f97` — "Give a delivered picture a buyer, and make its money walk the waterfall."
- **New this session** (both with a green gate, committed 2026-09-12):
  1. `677bbd5` Make the gate run on a machine that spells its paths the other way — the cross-platform repair.
  2. `9d11f97` Give a delivered picture a buyer, and make its money walk the waterfall — rank 8, plus the timeline fix.
- **Author identity**: this repo has no `user.name`/`user.email` configured, and the config was deliberately left alone. Both commits were made with per-command `-c user.name=Claude -c user.email=noreply@anthropic.com`, matching every prior commit's author on this branch. A future session committing here will need the same flags.
- **10 commits ahead of `main`**, oldest to newest:
  1. `7e9b285` Move the family land to Mosfellsbær, and stop calling it vast
  2. `998cf87` Make the lot a business: four stages, a monthly bill, and somebody booking
  3. `775c779` Fix the broken typecheck I pushed, and separate fittings from labels
  4. `806c00d` Put the sugar behind the money, and say which business is which
  5. `6ebe892` Make the sugar quota a thing that keeps happening
  6. `1a3b3f0` Give a picture a life past greenlit
  7. `01570a0` Make a greenlit picture walk its own calendar
  8. `09666ed` Halve the stage rates to what stages actually let for
  9. `d283545` Make the lot's refusal possible, and most of its work Icelandic
  10. `6f57b23` Land the research, and correct the build order it contradicts *(HEAD)*
- **Working tree as of 2026-09-12, end of this session — rank 8 is built but NOT committed.** Nothing has been committed or pushed by this session. Modified and new files:
  - New: `src/engine/content/selling.ts`, `src/engine/world/selling.ts`, `tests/selling.test.ts`
  - Modified for rank 8: `src/engine/domain/company.ts`, `src/engine/index.ts`, `src/engine/decided.ts`, `src/ui/looks/business.tsx`, `docs/COVERAGE-MATRIX.md`
  - Modified for the timeline bug: `src/engine/world/making.ts`, `tests/making.test.ts`
  - Modified for the cross-platform repair: `tools/spelling.mjs`, `tools/typos.mjs`, `tools/plural-check.mjs`, `tools/wired.mjs`, `tools/deciders.mjs`, `tools/inventory.mjs`, `src/engine/content/geography.ts`, `src/engine/content/holidays.ts`, `tests/geography.test.ts`, `tests/interface.test.ts`, `tests/cohesion.test.ts`, `tests/premise.test.ts`
  - Untracked: `PROJECT_HANDOFF.md` (this file), `SLATE-CLEANUP-FULL-CONTEXT.txt` (now safe to delete — the work it recorded has been rebuilt)
- **The gate is green (exit 0), so this is committable.** Consider landing it as two commits — rank 8, and the cross-platform repair — since they are independent changes and the tooling fix is worth its own entry in the log.
- **No stashes.** No other local branches with unmerged work.

---

## 9. EXACT NEXT STEPS

1. **Push the two commits** (`677bbd5`, `9d11f97`) to `origin/claude/slate-cleanup-e4apmx`. They were deliberately left unpushed: pushing is a shared-state action and the user had not been asked. Nothing else blocks it — the gate is green at `9d11f97`.

2. **Run `npm run gate` once from the Linux account** to confirm the cross-platform repair did not regress anything there. It should not — every change uses forward slashes and `/\r?\n/`, both of which behave identically on Linux — but the repair touched twelve shared files and has only been observed green on Windows so far.

3. **Consider whether the CRLF data-parsing bug deserves a wider sweep.** Two `.tsv` loaders were splitting on `'\n'` and corrupting their last field on a CRLF checkout (section 3). Nothing else in `src/` splits on a bare `'\n'` to parse a data file today, but any future loader should use `/\r?\n/`.

4. **The production-process research is the largest piece of unfinished work and the user has asked about it directly.** `docs/research/PIPELINE.md` holds 7 of 20 planned domains and stops dead at casting, exactly where the crew would come on set — camera, lighting, production design, costume, locations, on-set sound, the shoot day, effects, post and marketing are all missing. `KINDS.md` holds 8 of 13. Worse: the "425 processes / 762 distinct roles" enumeration the prior session quoted to the user (the basis for "playing your mother for business and your father for production is not a mode switch") **was never landed in the repo at all** — no such dataset exists under `docs/`. Its workflow completed in the same minute the weekly limit hit, and the only trace is a few sentences of prose in `SLATE-CLEANUP-FULL-CONTEXT.txt`. Re-running it is likely necessary; check whether the run IDs in `docs/research/README.md` are still warm before assuming anything can be resumed cheaply.

5. **Separately, raise the lot-viability finding with the user** (section 6): 21% occupancy against 62% break-even, with enquiry volume inert. Get an explicit decision on whether to build the master-lease mechanic the research recommends, before spending effort on it unprompted — it is new scope.

6. **Ranks 2–7 are still unbuilt** and rank 8 now sits on top of them. Per requirement #3 this was a deliberate, user-approved skip, not an accident — but the dependency debt is real and the next engine work should probably be rank 2 rather than rank 9.

7. **Before ending any future session or switching accounts, update this file** — see section 10.

---

## 10. ACCOUNT HANDOFF RULE

**This repository is worked on by two separate Claude Code accounts, alternating.** Each account has its own conversation history, its own context window, and — critically — **no visibility into the other account's conversation**. The only thing that survives a switch between accounts is what is actually committed to this repository, and specifically this file.

**Rule: `PROJECT_HANDOFF.md` must be updated, and the update must be accurate as of the moment you stop, before ending a session or switching accounts.** In practice this means:

- Before you stop working (hit a usage limit, finish a task, or are told to switch accounts), update every section of this file that your work has changed — especially section 5 (uncommitted/in-progress work), section 6 (known issues), section 8 (git state), and section 9 (exact next steps). If you are stopping mid-task the way the prior session did, section 5 must describe precisely what's half-built and section 9 must say exactly where to resume — do not leave the next session to reconstruct this from a raw transcript export again.
- If you commit code, update section 3 (completed work) and remove/adjust the corresponding entry in section 5.
- If you find a new bug, add it to section 6 immediately — don't wait until the end of a session to write it down, in case the session ends unexpectedly (as the prior one did, mid-gate-run, with no final status recorded).
- If the user gives a new standing instruction, requirement, or correction, add it to section 4 as a durable rule, not just to your own working memory — the other account will never see your conversation, only this file and the actual code.
- Treat this file as higher-priority to keep current than any other documentation in the repo, because it is the *only* channel between the two accounts.
- When you open a fresh session on this repository, **read this file in full before doing anything else** — including before re-reading old transcript exports, which should be treated as secondary/historical once this file exists and is current.
