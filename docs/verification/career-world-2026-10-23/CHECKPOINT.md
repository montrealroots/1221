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
| 0 | Starting point, register, sources, checker | Done in this commit |
| 1 | The overseas engagement: Sydney, travel, presence, stay, permission, work, pay, return | Next |
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

## Next Concrete Action

Module 1's criteria (`criteria.md`, section 1), written before any code; then the jurisdiction registry, the work trip
and the Sydney project in the career record.
