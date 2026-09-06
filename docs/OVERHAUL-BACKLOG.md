# The Living Text World Overhaul — Backlog

Every requirement in the cumulative directive, numbered so it can be traced,
with its state in this tree. States mean exactly one thing each:

- **Done** — built, wired to a screen, tested, in this branch.
- **Partial** — built to a stated depth; the gap is written next to it.
- **Not started** — nothing in the tree yet.
- **Blocked** — cannot be finished here; the dependency is named.

Nothing is marked Done because its landing page works. The connected
scenario the directive asks for first is Done and walked in a browser; the
rest of the overhaul is not, and this file says where each piece stands.
Reconcile it against `docs/COVERAGE-MATRIX.md` and the command registry
before any delivery claim.

## A. Foundations (must hold under everything)

| Id | Requirement | State | Where |
| --- | --- | --- | --- |
| A1 | `Simulation.execute/must` is the only mutation boundary; no money, ownership, relationship or clock mutation in React | Done | `src/engine/core/simulation.ts`; every workspace calls `run()` |
| A2 | One authoritative clock, `advanceTo`, seeded named random streams | Done | `src/engine/core/time.ts`, `rng(stream, …)` |
| A3 | Ledger in integer minor units, balanced, retry-safe purchases | Done | `src/engine/core/ledger.ts`; `ledger.audit()` asserted in tests |
| A4 | Stable entity ids across every feature | Done | `src/engine/core/ids.ts` |
| A5 | New state inside `SaveUniverse` with versions and migrations; older saves survive | Done (schema 32) | `src/engine/domain/model.ts`, `migrate()` in `src/engine/index.ts` |
| A6 | Scene text describes committed facts only | Done | `SceneRuntime.commit` is the only way a scene changes the world |
| A7 | Existing validation gate kept green | Done | `npm run validate`, `node tools/cohesion.mjs` |
| A8 | Cloud persistence of the new fields exercised live on Base44 | Blocked | Needs deployment credentials; codec covered by tests only |

## B. Interaction architecture

| Id | Requirement | State | Where / gap |
| --- | --- | --- | --- |
| B1 | Content-driven `SceneDefinition` with typed context, entities, place, participants, availability, time, quoted costs, effects, interruptions, follow-ups | Partial | `src/engine/systems/scenes.ts`: `available`, `start`, `view`, `choose`, `summarise`, `resume`, `placeBound`. Interruptions are engine-level (leaving the city or place); per-scene interruption sources (a call, a changed price) are not declared per definition yet. |
| B2 | Discover → inspect → discuss → plan → review → act → outcome → follow up, domain-specific | Partial | Gym, meal, run, wellbeing, the dealership and the date follow it. Property, banking, social and film do not have scenes yet (C-rows). |
| B3 | Detailed play and Skip To The End on the same rules | Done | `scene.quick`, `summarise()` |
| B4 | One foreground scene, resumable, survives save/reload | Done | `activeScene`, `scene.resume`; tests/scenes.test.ts |
| B5 | Interruption on travel, appointments, messages, availability, funds, reload, leaving | Partial | Leaving the city/place and reload are handled; a due appointment or an incoming message does not yet interrupt a scene. |
| B6 | Step revision tokens and per-operation idempotency keys; two tabs | Done / Partial | Revisions and keys are in; two tabs are refused at the server by clock and playtime (`base44/shared/guard.js`), not by an in-memory revision, and that is not exercised in a browser. |
| B7 | Structured NPC memory distinct from transcripts | Done | `src/engine/systems/memory.ts`; trainers, car salespeople and the people you date read and write it: goals, preferences, meetings, what you drove, what you walked away from, what you bought, what you talked about, what you promised and whether you kept it, the time you did not come. |
| B8 | NPCs with independent goals and availability | Partial | Existing world tiers and schedules; no per-NPC goal loop. |
| B9 | Free text → validated structured intent; ambiguity asks; unsupported says so; never silent success | Done (offline) | `src/engine/systems/intent.ts`; no language model, no network. |
| B10 | AI provider adapter with server-side secrets, timeouts, budgets, offline fallback | Not started | No provider is wired; every scene is deterministic. |

## C. Connected journeys the directive names

| Id | Journey | State | Where / gap |
| --- | --- | --- | --- |
| C1 | Calendar plan → venue → gym pass → workout with choices → wellbeing → saved follow-up | Done | `docs/IMMERSION-COVERAGE.md`; walked in the browser; 53 tests |
| C2 | Inspect and purchase a car, then insure, collect and use it | Done | Stage 2. `src/engine/systems/dealership.ts`, `src/engine/scenes/dealer.ts`, tests/dealership.test.ts (21). Every city has three lots as places; a salesperson made on the first deal who remembers you; look it over (findings are levers), test drive, offers in rounds against a floor that is never shown, trade-in that comes off what you owe and moves the old car off the books, delivery as a calendar item with the car not in hand until it arrives, agreed repairs done free and on the record, cash / finance / lease through the existing loan book and bills, insurance quoted and bought from the same chair, walking away remembered with a callback when you were close, cooling-off, expiry, a second visit that is a second visit; Skip To The End on the same rules. Use, service, modify and resale are the existing garage. |
| C3 | Arrange and attend a date | Done | Stage 3. `src/engine/systems/dating.ts`, `src/engine/content/dates.ts`, `src/engine/scenes/date.ts`, tests/dating.test.ts (13). Asking names an activity and a place; the date is a record on the calendar that asks when it comes round; left alone it is a standing-up they remember for a year; played, it is getting ready (a shower, a gift), getting there, a check-in where they are there, late or not coming, up to five moves across the table answered in their own voice (warm, dry or guarded), an ending (the walk, the kiss the evening has or has not earned, a promise), and a finish that is the only thing that changes the relationship — its seven dimensions, a memory, facts about what you talked about and promised, and a follow-up three days later that notices whether you called. Cancel with or without notice, move it, leave early. The short version is the same evening with the safe moves. |
| C4 | Buy and furnish a home | Not started as a scene | Existing commands cover shortlist → showing → offer → counter → inspection → close → furnish (`prop.*`, tests/property). Needed: a viewing scene with rooms and questions, an agent who remembers, moving day. |
| C5 | Create social content with audience reactions | Not started as a scene | Existing: `social.create_post`, deals, earnings. Needed: composing as a scene, reactions over simulation time, consequences on relationships and career. |
| C6 | Prepare for and carry out a film/TV obligation | Not started as a scene | Existing production pipeline. Needed: a call-sheet day as a scene. |
| C7 | Interruptions, failures and subsequent visits in each | Partial | C1 (too tired, no pass, closed, displaced, walked out, second visit), C2 (closed lot, lowball refused, final price, under water, no funds, walked away and called back, cooling-off, second visit) and C3 (late, not coming, stood up, cancelled on the day, left early, a promise broken) have them. C4–C6 follow with their journeys. |

## D. Feature areas

| Id | Area | State | Where / gap |
| --- | --- | --- | --- |
| D1 | World: explore, enter, talk, inspect, services, return with consequences | Partial | Places, journeys, visits, orders, rooms, Right Here actions, Work Out / Eat Here / Look At The Cars. The dealership is the first place where talking to the person there is the scene; restaurants, shops and the rest are not yet. |
| D2 | Calendar: entity-specific detail and owning-system actions; plans; invitations; RSVPs; preparation; distinct states | Partial | Detail and actions Done (plan, appointment, bill, flight, observance, date — play, do, skip, cancel, move). Invitations and RSVPs between people beyond a date, and travel preparation prompts, Not started. |
| D3 | Wellbeing: playable activities with choices, resources, time, results, routines | Done | `wellbeing.activity` scene; cooking keeps its recipe flow; readiness includes soreness. Routines (a recurring plan) Not started. |
| D4 | Gyms: search, facilities, hours, passes, memberships, classes, trainers, check-in, changing rooms, workouts, progression, rests, recovery, renewal, cancellation | Done | `src/engine/systems/fitness.ts`, `src/engine/content/fitness.ts`, `src/engine/scenes/gym.ts` |
| D5 | Gyms: every relevant real gym worldwide, with coverage reporting | Blocked | 25 real gyms in 13 cities, labelled; everywhere else SLATE's own, labelled. A worldwide venue catalogue needs a licensed data feed. Coverage is reported as 13 cities in the help panel, read from the data. |
| D6 | Health: providers, appointments, check-in, consultation, tests, treatment, prescriptions, costs, insurance, follow-up | Partial | Book / reschedule / cancel with conflict checks. The consultation scene Not started. |
| D7 | Relationships and the in-game Raya | Not started (Raya) | Persistent relationships exist (`rel.*`). Raya — onboarding, profiles, discovery, matches, conversations, privacy, membership — is a separate implementation; nothing claims parity. |
| D8 | Banking: accounts, cards, premium products, statements, pending/posted, scheduled payments, fees, limits, interest, debt; international/offshore with FX | Partial | Accounts, transfers, bills, loans, credit and tax exist. Payment instruments, statements, pending vs posted, premium products, multi-currency and FX Not started. |
| D9 | Property: 100 distinct real homes per market with provenance; full lifecycle | Blocked (data) / Partial (lifecycle) | Lifecycle commands exist through closing, furnishing, renting and selling. Real listings need a licensed feed; procedural homes are labelled SLATE's. |
| D10 | Vehicles: 100 distinct real vehicles per market; full lifecycle | Blocked (data) / Done (lifecycle) | Dealership, inspection, test drive, negotiation, financing, trade-in, delivery, registration fees, insurance, use, service, modification and resale are all built (C2). Real per-market inventory with provenance needs a licensed feed; the catalogue is SLATE's models and the listings say so. |
| D11 | Shopping: 100 real branded products per category; basket, checkout, delivery, returns, use | Blocked (data) / Partial (flow) | Purchase, return, wardrobe, outfits, sell exist. Real catalogues need a feed; variants are not counted as products. |
| D12 | Insurance: real providers, full applicable coverage, quotes → claims → settlements | Partial | Quote, purchase, claim, renewal exist on simulated lines. Real provider identities Not imported. |
| D13 | YouTube / Instagram / X / Twitch as distinct in-game platforms with parity checklists | Not started | Four fictional platforms exist. No parity claim is made. |
| D14 | Travel: documents, seating, baggage, check-in, connections, delays, local transport, changed plans | Partial | Plan, book, charter, hotels, drive, arrival, time zones. Journey stages Not started. |
| D15 | History workspace left as-is | Done | Only its tab label was re-cased (Why Did This Happen?), per the global tab cleanup. |
| D16 | Film/TV and every other system get the same treatment | Not started as scenes | Existing pipelines untouched by this batch. |

## E. Interface renewal and editorial

| Id | Requirement | State | Where |
| --- | --- | --- | --- |
| E1 | Remove emoji from every tab, tile, breadcrumb, mobile nav, tooltip and accessible name; no glyph replacements | Done | `src/ui/shell/destinations.ts` (no icon field), Home tiles, Go Anywhere, TimeControls (Play / Pause), weather (a word). Guarded by `tests/interface.test.ts`. The brand clapper stays where it is the brand, never in an accessible name. |
| E2 | Consistent typography, spacing, forms, action labels, detail views, confirmations, receipts, feedback | Partial | Primitives (`Panel`, `Tabs`, `Stat`, `Modal`) and one stylesheet; receipts and confirmations are per-feature and uneven. |
| E3 | Progressive depth; preserved selections, drafts, scene progress; meaningful back navigation | Partial | Scenes persist mid-step; calendar keeps its selected day; breadcrumbs. Draft inputs in forms are not preserved across navigation. |
| E4 | Loading / pending / failure / retry states for asynchronous work; stale responses rejected | Partial | Save indicator has Saving / Saved / Failed — Retry. No asynchronous AI work exists yet (B10). |
| E5 | Narrow layouts usable; keyboard access for every control | Partial | Text caps sweep at 390–1280px; Go Anywhere keyboard list; nested-button in favourites fixed. A full keyboard audit of every modal is not done. |
| E6 | Editorial pass: grammar, spelling, punctuation, capitalisation, terminology; documented convention | Partial | `docs/STYLE.md`; labels enforced by `tools/label-sweep.mjs` and the guard test; two labels re-cased this stage. Prose across help, notifications and errors not yet audited line by line. |
| E7 | Truthful descriptions: unimplemented not shown as done, pending not as posted, simulated not as verified | Done (where it exists) | Locked tiles say Under Construction; calibrations say so; procedural listings are SLATE's. |
| E8 | No renaming of command ids, entity ids, persistence keys for display reasons | Done | Label maps sit between id and screen. |

## F. Dialogue library (100,001 approved entries)

| Id | Requirement | State | Gap |
| --- | --- | --- | --- |
| F1 | Versioned library: stable id, text, language, speaker role, purpose, section, beat, eligibility, memory conditions, tone, cooldown, follow-ups | Not started | Stage 4 builds the schema, loader and validator. |
| F2 | Seeded selection among eligible variants; per-save exposure tracking | Not started | Stage 4. |
| F3 | Validation: missing ids, broken branches, unreachable content, normalized and near duplicates | Not started | Stage 4. |
| F4 | Chunked loading by section; saves carry references, not the library | Not started | Stage 4. |
| F5 | 100,001 distinct approved entries across a coverage matrix and per-section allocations | Blocked (content production) | Scenes today carry a few hundred authored lines in code. The count is reported honestly at each milestone; nothing is counted from templates, combinations or promises. |

## G. Game-wide AI integration

| Id | Requirement | State | Gap |
| --- | --- | --- | --- |
| G1 | Inventory of routes, workspaces, panels, commands, scheduled events, notifications | Done (this stage) | 16 workspaces, 99 commands, 44 schedule kinds, 103 events at the time of writing — see `docs/COVERAGE-MATRIX.md`. |
| G2 | Coverage matrix mapping each interaction to system, commands, events, persistence, UI entry, tests | Partial | Stage 6 fills it feature by feature. |
| G3 | Shared interaction service: director, dialogue, memory, interpreter, simulation | Partial | Scenes + intent + memory are the deterministic half. No director loop, no model. |
| G4 | Backend provider adapter with validation, revision checks, timeouts, budgets, caching | Not started | B10. |

## H. Data honesty

| Id | Requirement | State |
| --- | --- | --- |
| H1 | Real vs fictional with provenance, currency, as-of date, coverage | Done for gyms, places, people; Blocked for the 100-record catalogues (no feed) |
| H2 | No scraping of private app data | Done — none attempted |
| H3 | External data access tracked as concrete dependencies | Done — this file and `docs/IMMERSION-COVERAGE.md` |

## Order of work

1. Stage 1 — this file, the emoji cleanup, the style convention, the guard test. **Done.**
2. Stage 2 — the vehicle journey (C2, D10 lifecycle). **Done.**
3. Stage 3 — the date journey (C3). **Done.**
4. Stage 4 — the dialogue library foundation (F1–F4).
5. Stage 5 — home, social and film journeys (C4–C6).
6. Stage 6 — the coverage matrix reconciled against the code (G2).

Everything Blocked stays Blocked until its dependency is supplied; it is not
re-labelled to look finished.
