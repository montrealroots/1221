# SLATE Production Rebuild — Canonical Migration Plan

Branch: `slate-production-rebuild`

## Purpose

Replace SLATE's current production pipeline with a new, original production engine that preserves the useful behavioral depth of the reference game while remaining a SLATE-native implementation.

This is a clean-room implementation boundary:

- We may reproduce gameplay ideas, causal relationships, workflow stages, categories of decisions, and system behavior.
- We do not copy the reference game's decompiled source, authored text, artwork, data tables, layouts, or proprietary implementation.
- All runtime code, terminology, UI composition, formulas, data models, and player-facing text in SLATE are original.

## Current SLATE Production Surface

The existing production implementation is spread across these primary engine modules:

- `src/engine/world/company.ts`
  - company setup, registrations, guild/signatory state, insurance, rights/options, staffing, development
  - current commands: `company.register`, `company.form_arm`, `company.sign`, `company.insure`, `company.option`, `company.fill_post`, `company.develop`
- `src/engine/world/making.ts`
  - greenlight, schedule periods, stage booking, production progress, delivery, overruns, post capacity
  - current commands: `company.greenlight`, `company.deliver`, `company.restaff`
- `src/engine/world/casting.ts`
  - role creation, breakdowns, performer discovery, sessions, offers, engagements, release/recast, contributor boards
  - current commands: `company.cast`, `company.breakdown`, `company.board`, `company.session`, `company.release`
- `src/engine/world/crew.ts`
  - production staffing and timed crew engagements
- `src/engine/world/selling.ts`
  - buyer offers, sale, windows, revenue splits and receipts
  - current command: `company.sell`
- `src/engine/world/awards.ts`
  - annual eligibility, recognition, nominations/wins, prestige feedback
- `src/engine/world/audition.ts`
  - actor-facing audition flow, notes, callbacks/room history and working state
  - current commands: `life.go_up`, `life.take_note`
- `src/engine/content/making.ts`
  - production-plan configuration and delivery requirements
- `src/engine/domain/company.ts`
  - the current `Project`, `Role`, `Seat`, company and production-domain records
- `src/engine/index.ts`
  - system registration boundary
- `src/ui/looks/business.tsx`
  - company/project production UI
- `src/ui/workspaces/AuditionsWorkspace.tsx`
  - actor-facing audition UI

The current `Project` record already carries significant state: stage, rights, budget/spend, plan, parts, schedule periods, delivery deadline, stage booking, crew, roles, cast, contributor boards, sale/release data, receipts, and rebate state. The rebuild must migrate these concepts intentionally rather than deleting them blindly.

## Reference-Mechanic Inventory To Preserve Behaviorally

The recovered reference package confirms the following functional areas are part of the target behavior set.

### Project / Source Development

- source material acquisition and project creation
- project type and format selection
- story/genre/audience attributes
- role construction and role difficulty
- screenplay lock/unlock state
- writer hiring and rewrite/development work
- pitch meetings and inbound project opportunities
- project list/status management
- project cancellation with financial consequences
- franchise, sequel, reboot and rerelease paths

### Production Planning

- explicit pre-production, production and post-production phases
- production attributes and production-design choices
- runtime / episode-count / format implications
- shoot-location decisions
- parental/rating-content implications
- production locking before greenlight
- greenlight gate
- schedule consequences
- budget consequences
- test screenings and re-editing before release

### Talent / Actor System

The actor/talent experience is part of the rebuild target, not an optional extra.

Functional equivalents must include:

- searchable talent database
- actor, director and writer categories
- talent profile / bio pages
- core identity, age/home/representation information
- skill and specialty attributes
- salary / quote information
- star/rating/reputation information
- awards history
- prior-work / career-history information
- availability / work-schedule information
- willingness / interest state
- friendship / prior relationship state where applicable
- actor/director/writer-specific attribute views
- role requirements and role-fit information
- open casting calls
- audition pools
- audition preparation and audition resolution
- hiring / offers / negotiation
- contract setup
- pay-or-play consequences
- sequel/option contract terms
- refusal / not-interested outcomes
- talent death/retirement lifecycle where enabled
- career results feeding later salary, rating, demand and awards

SLATE will present these through original profile pages, menus, dropdowns and data views.

### Casting Mechanics

- project creates roles before performers are attached
- roles have size, requirements and difficulty
- candidate discovery/search
- auditioning
- fit/performance evaluation
- negotiation and contract resolution
- actor can decline
- hired talent affects project performance
- talent scheduling/availability matters
- casting choices persist into career records
- sequel/franchise contract effects can carry forward

### Marketing / Release

- advertising spend and marketing choices
- merchandising / ancillary decisions
- bonus-feature/home-entertainment style decisions where relevant to the format
- theatrical and streaming release paths
- release-date strategy
- test screening / edit loop before release
- market and competition effects

### Commercial Outcome Engine

The reference game uses a staged outcome calculation rather than one flat random roll. SLATE will retain that philosophy with original math.

Factors represented in the target include:

- project/story quality
- production execution
- talent performance
- movie-star / fame contribution
- runtime
- difficulty modifiers
- genre / audience fit
- marketing
- rating / audience restriction
- theater / distribution scale
- foreign/international performance
- negative-event modifiers
- low-performance correction / floors
- ancillary revenue
- final financial result
- talent career records updated from commercial outcome

### Reviews / Awards / Prestige

- critic/review layer
- awards consideration
- categories
- nomination lists
- winners
- project and talent career-history updates
- prestige/reputation feedback
- sequel/franchise value feedback

### Finance / Studio Operation

- studio cash
- personal cash separation where appropriate
- accounting
- project spend/revenue
- loans
- interest / term / payment calculation
- bankruptcy pressure
- monthly progression
- rival-studio activity

### Rival Industry

- rival studios create projects
- rival projects release into the same market
- rival marketing/release strategy
- competition for release windows
- world does not wait for the player

## New SLATE Production Architecture

The replacement will be organized around explicit domains instead of one monolithic production file.

Planned modules:

```
src/engine/production/
  model.ts
  project.ts
  development.ts
  casting.ts
  contracts.ts
  scheduling.ts
  production.ts
  post.ts
  testing.ts
  marketing.ts
  distribution.ts
  commercial.ts
  reviews.ts
  awards.ts
  franchise.ts
  rivals.ts
  migration.ts
  register.ts
  index.ts
```

### Canonical Pipeline

```
source / pitch / original idea
        ↓
development
        ↓
screenplay / package
        ↓
budget + financing
        ↓
roles + key crew
        ↓
casting / auditions / offers / contracts
        ↓
greenlight
        ↓
pre-production
        ↓
principal photography
        ↓
post-production
        ↓
test screening / re-edit
        ↓
marketing + distribution strategy
        ↓
release
        ↓
commercial run
        ↓
reviews + awards
        ↓
profit/loss + reputation + career history
        ↓
sequel / franchise / rerelease opportunities
```

Every transition is server/simulation authoritative and must be traceable through commands, scheduled events and audit/history records.

## Project State Model

The replacement will use a state machine rather than allow arbitrary stage strings.

Initial stage family:

1. `concept`
2. `rights`
3. `development`
4. `screenplay`
5. `packaging`
6. `financing`
7. `casting`
8. `greenlight_ready`
9. `preproduction`
10. `production`
11. `postproduction`
12. `test_screening`
13. `marketing`
14. `distribution`
15. `released`
16. `commercial_run`
17. `awards`
18. `library`

Terminal/side states:

- `shelved`
- `cancelled`
- `failed_delivery`

A stage transition must state:

- requirements
- command that caused it
- time consumed
- money consumed/committed
- scheduled consequences
- generated history entries
- rollback/cancellation consequences

## Actor / Talent Profile Contract

The new profile must expose at minimum:

- identity and portrait
- performer title / profession
- representation
- age and location
- career status
- acting/directing/writing attributes as applicable
- specialties / genre history
- fame, appeal, professional reputation, prestige, reliability and demand
- quote / recent compensation
- availability calendar
- current commitments
- offers
- auditions and callbacks
- active contracts
- option/sequel obligations
- filmography/credits
- commercial history
- reviews / performance history
- awards / nominations
- relationships with studios, directors, writers and co-stars when data exists
- refusal / conflict history
- career trend/history

Context actions from the profile may include:

- View Full Career
- View Credits
- View Awards
- View Availability
- View Contract
- View Representation
- Invite To Audition
- Offer Role
- Negotiate
- Attach To Project
- Release / Recast when contractually possible
- Compare For Role
- View Prior Work Together

The exact labels and layout are SLATE-original.

## Integration Rules

The new engine must integrate with existing SLATE systems rather than form a parallel minigame:

- canonical world clock and scheduler
- finance ledger
- player wellbeing
- attributes and traits
- reputation
- geography / travel
- relationships
- calendar
- save persistence
- notifications
- tutorial
- deterministic RNG
- command idempotency
- audit/history

Actor performance may be influenced by SLATE-native state such as preparation, fatigue, stress, relationships, reputation, reliability, scheduling pressure and career history. Those additions are SLATE mechanics layered onto the production model.

## Migration Strategy

### Phase 0 — Safety

- Work only on `slate-production-rebuild`.
- Do not delete current production modules until their replacement routes exist.
- Keep `main` untouched until the rebuild passes verification.

### Phase 1 — Inventory

- Map all production commands, scheduled kinds, state records, UI routes and tests.
- Build Current → Replacement mapping.
- Mark each old symbol as: migrate, bridge, retain, or retire.

### Phase 2 — New Domain

- Add new production records and state machine.
- Add compatibility readers for existing saves.
- No old command removed yet.

### Phase 3 — New Mechanics

- Development
- casting/talent/contracts
- production scheduling
- shoot/post
- testing/editing
- marketing/distribution
- commercial outcome
- reviews/awards
- rival studios
- sequel/franchise lifecycle

### Phase 4 — Player UI

- production workspace
- project pages
- actor/talent pages
- casting flow
- production dashboard
- release/commercial results
- reports

### Phase 5 — Cutover

- register new production command/schedule handlers
- migrate existing project data
- route UI to new engine
- retire old handlers only after no readers remain

### Phase 6 — Validation

- unit tests for every stage transition
- contract/casting tests
- deterministic simulation tests
- save migration tests
- finance-ledger conservation tests
- schedule conflict tests
- release/commercial tests
- awards tests
- rival-studio soak tests
- long-range world simulation
- UI/navigation regression
- Base44 verification/deployment checks

## Non-Negotiable Acceptance Criteria

- Existing saves do not silently lose production data.
- No production command mutates state outside the simulation command path.
- No scheduled production event exists without a registered handler.
- Every monetary production event posts to the ledger.
- Every contract has explicit obligations and dates.
- Every performer commitment participates in availability.
- Every project result can explain its major contributing factors.
- Commercial outcomes are deterministic for the same save state and seed.
- Rival projects continue during player inactivity/time skips.
- Actor/talent pages expose the production/career information required to make informed choices.
- Useful existing SLATE production capabilities do not disappear without an explicit replacement.
- No proprietary reference-game code or text is committed to SLATE.

## First Cutover Boundary

The old production registration seam is currently in `src/engine/index.ts`:

- `registerMaking`
- `registerSelling`
- `registerCrew`
- `registerCasting`
- `registerAudition`
- `registerAwards`

These registrations are the eventual cutover point.

The rebuild should replace them behind one SLATE production registrar so `src/engine/index.ts` ultimately depends on one stable production boundary rather than knowing every sub-system.
