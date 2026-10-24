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
| 1 | The overseas engagement: Sydney, travel, presence, stay, permission, work, pay, return | Done: `6261883e`, `880d4231` (W1 to W12; see below) |
| 2 | The real industry catalog and simulated roles drawn from it | Done in this commit (C1 to C12; see below) |
| 3 | Real agencies and agents in the representation engine | Waiting |
| 4 | Contracts, options, episode guarantees, payment states, residuals, renewal and cancellation | Waiting |
| 5 | Distinct production workflows | Waiting |
| 6 | Weekly charts, festivals, awards and the anonymous field | Waiting |
| 7 | The time loop's deadlines, drill-downs, tutorials, balance seeds, playthroughs, the final gate | Waiting |

## Blockers Met

| What | Tried | Affects | Fallback |
|---|---|---|---|
| The ATO's foreign-resident withholding pages (S28) | curl with a browser's user agent, WebFetch, the ATO's public content API: each HTTP 403, 2026-10-23 | Australian tax on pay for work in Australia (GEO-06, GEO-19) | The indexed summary is kept in `sources.json` as an excerpt and not used as a verified rule. Australian tax is shown as not worked out by the game, never as nil. |
| Cast pages for 9-1-1 (S88) and Abbott Elementary (S86), and Universal's upcoming films (S83) | Each read 2026-10-23: HTTP 200, but the page loads its list in the browser, and its text holds none of it | Characters for those casts; a second studio's slate (CAT-03, CAT-09) | Recorded as unresolved in `CATALOG.md`. 9-1-1's and Abbott Elementary's casts come from their press pages (S80, S109), which name characters; no film from Universal is in the catalog. |
| Amazon MGM Studios' press dossier (S84) | Located, not read | Per-film details beyond the slate's lines | The slate's own line for each film is the record; what it doesn't give is unknown. |
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
- **Measured**: the full suite on `6261883e`, 488 of 490 files and 5,629 of 5,632 tests; its three failures (Harbor
  Line's genre weights unstated, a test's premise that every project is in New York) are fixed in the next commit.
- **Left for later, each a register row**: flight delays and missed connections (T24, T25), a stay extended (T26),
  weather (T31), allowances and per diem, Australian tax (GEO-19, blocked on S28), jet lag (GEO-13), the five partly
  researched countries' rules.

## Module 2, As Built (2026-10-24)

- **The catalog** (`content/catalog.ts`): what thirteen official pages said on 2026-10-23, field by field. Every field
  is a reading (its source, the words it rests on, held to `sources.json` by the test), a conflict kept with both
  sources and the later used (I Play Rocky's release), the game's assumption, or unknown with why; none is a default.
  Four series (9-1-1, Slow Horses, Severance, Abbott Elementary) and the twelve films of Amazon MGM Studios' slate;
  thirteen companies, each named by the role its page gives (producer, in association, broadcaster, streaming
  platform, distributor, studio label), and nothing said of who owns whom; performers credited for the scope their page
  gives; no filming location, none being given. `CATALOG.md` is generated from it (`npx vite-node tools/catalog.mjs
  --write`): 13 pages, 21 titles named, 16 imported, 4 merged, 3 unresolved, 116 of 175 fields unverified.
- **Parts drawn from it** (`content/careerwork.ts`): Reese Pike in 9-1-1 and Casey Marlow in Abbott Elementary, new
  characters in seasons the game imagines, each a co-star for an actor or an actress, through an agent only, at
  SAG-AFTRA's day minimum, cast by the production's casting office, unnamed. The role, the offer and the engagement say
  it's the game's own and that no one at the production is casting it; the role shows the production as its pages had
  it. No part is drawn from a film, from Severance (no season ahead in its pages) or from Slow Horses (the UK's rules
  aren't in the game).
- **Los Angeles** is a trip from home, as Sydney is: the production's flights and hotel, the player away for the whole of
  it, the US rule for permission, no visa. Each day's call is at the shoot's hour on Los Angeles' clock.
- **Casting is keyed by the posting** (the project, when it was posted, the round), not by the opportunity's number in
  the save, so a part added to the game moves no other part's casting. The seeded career journeys moved once with the
  key, and each says in the past tense what it had been.
- **A defect found reading the text, and fixed**: the Opportunities tab's head, its agent-only list, the agreement's
  Who line ("Fictional, as every project in the game is"), the guide, the tutorial and the agent's notice all said every
  project, company and casting office was invented for the game, which the drawn parts made untrue. Each now says which
  it is, and `tests/pro-opportunities-screen.test.ts`, `tests/propay-screen.test.ts` and `tests/career-drawn.test.ts`
  fail on the old words (each mutation run and killed).
- **Measured**: the full gate in the Module 2 clone: 491 of 492 test files and 5,648 of 5,649 tests passed. The one
  failure was the guide's wiring readings, whose handler lines the text fix's comments had moved down six lines in
  `projobs.ts`; recomputed, its two test files pass (44 tests), and so do the gate's 23 checks, which the failure had
  stopped.
- **Left for later, each a register row**: episodes one by one and a casting director or representative in the catalog
  (CAT-01); a second studio's slate (CAT-03, CAT-09); rechecking a fact when a later module puts it to use (PROV-03); a
  real director's fictional offer (PROV-05); a data update that never erases a save's history (PROV-07).

## Next Concrete Action

Module 3: real agencies and individual agents in the representation engine (Part 7), from their own published pages,
with agency-specific routes, its criteria written before any code.
