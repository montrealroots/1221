# Brief 25's Checkpoint

The state of the work, kept so a session that's interrupted can pick it up. The register (`register.json`, checked by
`node tools/career-register.mjs --check`) is the requirement-by-requirement truth; this says where the work is.

## Starting Point (2026-10-23)

- **Brief:** `docs/verification/briefs-2026-10-16/25-master-career-build-command-and-global-acting-career-research-dossier.txt`,
  copied from the session's transcript, every byte as sent (144,813 bytes; the dossier's Sections 1 to 29 with it).
- **Branch:** `claude/peaceful-hamilton-59zdbb`, from `b46ee301` (`main`, #63), level with `origin/main`. No stash, one
  worktree, nothing uncommitted.
- **Gate on that code:** exit 0 on `8d4139de` in a clean clone (488 of 488 test files, 5,616 of 5,616 tests, 22 checks).
- **Audit:** `audit.md`. The brief reverses the owner's choice of 2026-10-21 of fictional agents and projects only; the
  fictional agent and every save's history with him stay.

## Modules

| # | Module | State |
|---|---|---|
| 0 | Starting point, register, sources, checker | Done: `f341b3b1` |
| 1 | The overseas engagement: Sydney, travel, presence, stay, permission, work, pay, return | Done in this commit (W1 to W12; see below) |
| 2 | The real industry catalog and simulated roles drawn from it | Waiting |
| 3 | Real agencies and agents in the representation engine | Waiting |
| 4 | Contracts, options, episode guarantees, payment states, residuals, renewal and cancellation | Waiting |
| 5 | Distinct production workflows | Waiting |
| 6 | Weekly charts, festivals, awards and the anonymous field | Waiting |
| 7 | The time loop's deadlines, drill-downs, tutorials, balance seeds, playthroughs, the final gate | Waiting |

## Blockers Met

| What | Tried | Affects | Fallback |
|---|---|---|---|
| The ATO's foreign-resident withholding pages (S28) | curl with a browser's user agent, WebFetch, the ATO's public content API: each HTTP 403, 2026-10-23 | Australian tax on pay for work in Australia (GEO-06, GEO-19) | The indexed summary is kept in `sources.json` as an excerpt and not used as a verified rule. Australian tax is shown as not worked out by the game, never as nil. |
| The 408 visa's charge and processing time (S01) | The page read in full on 2026-10-23; both are loaded by the department's estimator tools, not in the page | What the visa costs and how long it takes | Shown as not known to the game. Any time the game takes for a decision is its labeled assumption. |

## Module 1, As Built (2026-10-23)

- **The countries** (`content/jurisdictions.ts`): Australia verified (the 408 from S01, the 444 from N02, each verified
  condition holding the page's own words, each assumption saying so); the UK, New Zealand, Canada, France, Japan and
  India partly researched; the other 244 unsupported. `COUNTRIES.md` is generated from it (`npx vite-node
  tools/countries.mjs --write`), and `tests/career-world-countries.test.ts` holds both to `sources.json`.
- **The trip** (`systems/worktrip.ts`): legs by car and by air through a hub, in each town's own zone; the hotel; where
  the player is, derived from the legs (`whereAt`); the visa applied for from the engagement and decided ten days on;
  the first flight refused without it, and the production's release; a missed flight out calls the whole trip off, a
  missed flight home is rebooked a day later.
- **The work**: Harbor Line, a fictional studio feature in Sydney, for an actress or an actor, open to self-tapes and
  outside an agent's agreement. Its days are Sydney's 7 AM; permission on each is Australia's; pay is the existing
  payroll's, recorded as income earned in Australia, without commission.
- **The screens**: the offer's warning; the Work tab's The Trip To Sydney (permission, Apply For The Visa, the legs, the
  hotel, What The 408 Visa Asks, what isn't in the game yet); the trip's steps in What Happened; Papers lists the visa,
  and its Your Work And Your Permission reads Australia's rule for the work.
- **Defects found by its tests and fixed**: Papers read the US rule for work in Sydney ("You're a US citizen, so you can
  work for any employer in the US."); after a missed flight out the legs home still ran and said the player was back;
  a missed flight's history lowercased place names; SAG-AFTRA eligibility was announced at a first day the player never
  worked (since brief 19, for local work too), and is now read from the first day worked.
- **What adding a project changed**: life A's career (tests/journey-career.test.ts), whose opportunity ids shifted, so
  casting's keyed draws fell otherwise: she was offered and paid for Jess in Static On Route 9 in the summer of 2029.
  The test says so; the rest of her journey is as it was.
- **Left for later, each a register row**: flight delays and missed connections (T24, T25), a stay extended (T26),
  weather (T31), allowances and per diem, Australian tax (GEO-19, blocked on S28), jet lag (GEO-13), the five partly
  researched countries' rules.

## Next Concrete Action

Module 2: the real industry catalog with field-level provenance (Part 3, Part 4), and simulated roles drawn from it,
its criteria written before any code.
