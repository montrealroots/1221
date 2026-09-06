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
| A5 | New state inside `SaveUniverse` with versions and migrations; older saves survive | Done (schema 36) | `src/engine/domain/model.ts`, `migrate()` in `src/engine/index.ts` |
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
| C4 | Buy and furnish a home | Done (viewing to moving in) / Partial (selling) | Stages 5 and 7. `src/engine/systems/viewings.ts`, `src/engine/systems/purchase.ts`, scenes `property.viewing`, `property.counter`, `property.inspection`, `property.closing`, `property.movein`; tests/viewing.test.ts (13), tests/purchase.test.ts (24). The showing (stage 5). Then the seller's answer: a counter is a call from your agent with the number, and you take it, come back with a number between the two (the lender's refusal on any line the money will not carry) or walk away; the seller comes back at most twice; a counter you do not answer in two days is withdrawn with the deposit back. The inspection happens on its day and the report asks: walk the house with the inspector if you are in the city, or read it anywhere; every finding in the inspector's voice by severity; decide in the room — proceed, ask for money off by the property system's own rule, or walk with the deposit; silence for four days waives the contingency and says so. A financed purchase is appraised a week before closing; a gap you can carry goes on the table, one you cannot ends the purchase with the deposit back. Closing day asks: sit at the table (page one of the folder: price, deposit paid, down payment, appraisal gap, closing costs, cash to close, what you have, the monthly payment), sign remotely, or ask for three more days once; sign and the money moves through the property system's own closing, or walk away and the deposit stays with the seller; a table you never come to costs the deposit too. Signed, the keys are yours: move in today, or moving day asks three days on. Every home from the market has the rooms the listing described; moving in is a scene that ends the old lease, picks how the house should feel, and furnishes room by room (bare, comfortable, properly) as one priced commit per room through the furnishing rule, so a retry cannot buy a sofa twice. **Gap:** selling a home you own is still a command without a scene; the counter conversation is one round of numbers, not a haggle. |
| C5 | Create social content with audience reactions | Done (scene and reactions) / Partial (consequences) | Stage 5. `src/engine/scenes/compose.ts`, `settleReactions` in `src/engine/systems/media.ts`, tests/compose.test.ts (8). Composing asks the format the platform takes, the angle, the hook and how long you will give it, projects the quality before anything is written, and publishes through `social.create_post` with the craft as a bounded bonus on the same quality rule; nothing exists until the review says publish, and a format the platform does not take is refused by the command whatever the scene says. A day after publishing the audience answers on its own: a band (hit, fine, flop) read from the post's numbers, three comments in the register of the format, a one-line summary, a notification and an event, settled once. The short version publishes a proper post with the safe angle and hook. Consequences on relationships and career beyond followers, momentum and deals are Not started. |
| C6 | Prepare for and carry out a film/TV obligation | Blocked (dependency) | There is no production or shoot-day pipeline in this tree to hang a call-sheet scene on: `work.project` is a script-read calculator and the company engine (task 38) that would put the player on a call sheet is still being built. A scene here would be a facade over nothing, so none is claimed. It follows the company engine. |
| C7 | Interruptions, failures and subsequent visits in each | Partial | C1 (too tired, no pass, closed, displaced, walked out, second visit), C2 (closed lot, lowball refused, final price, under water, no funds, walked away and called back, cooling-off, second visit), C3 (late, not coming, stood up, cancelled on the day, left early, a promise broken), C4 (lapsed, skipped, away in another city, no money for any offer, thanked and left, a second visit greeted as one, a missed one held against you; a counter left unanswered, the seller's two rounds, a lender's refusal on a number, an inspection walked or read from another city, walked away from, waived by silence; an appraisal you can and cannot carry; a closing you are short at, delayed once, walked from, or never came to; a lender that declines at the table) and C5 (not enough energy for the long version, a format the platform refuses, start again, a flop) have them. C6 follows its journey. |

## D. Feature areas

| Id | Area | State | Where / gap |
| --- | --- | --- | --- |
| D1 | World: explore, enter, talk, inspect, services, return with consequences | Partial | Places, journeys, visits, orders, rooms, Right Here actions, Work Out / Eat Here / Look At The Cars. The dealership, a house on the market, the inspector at the kerb and the escrow table are the places where talking to the person there is the scene, and each of them remembers you; restaurants, shops and the rest are not yet. |
| D2 | Calendar: entity-specific detail and owning-system actions; plans; invitations; RSVPs; preparation; distinct states | Partial | Detail and actions Done (plan, appointment with play/go/skip, bill, flight, observance, date, showing, inspection, appraisal, closing, moving day — play, do, skip, cancel, move). Invitations and RSVPs between people beyond a date, and travel preparation prompts, Not started. |
| D3 | Wellbeing: playable activities with choices, resources, time, results, routines | Done | `wellbeing.activity` scene; cooking keeps its recipe flow; readiness includes soreness. Routines (a recurring plan) Not started. |
| D4 | Gyms: search, facilities, hours, passes, memberships, classes, trainers, check-in, changing rooms, workouts, progression, rests, recovery, renewal, cancellation | Done | `src/engine/systems/fitness.ts`, `src/engine/content/fitness.ts`, `src/engine/scenes/gym.ts` |
| D5 | Gyms: every relevant real gym worldwide, with coverage reporting | Blocked | 25 real gyms in 13 cities, labelled; everywhere else SLATE's own, labelled. A worldwide venue catalogue needs a licensed data feed. Coverage is reported as 13 cities in the help panel, read from the data. |
| D6 | Health: providers, appointments, check-in, consultation, tests, treatment, prescriptions, costs, insurance, follow-up | Done | Stage 8. `src/engine/systems/care.ts`, `src/engine/scenes/visit.ts`, `src/engine/dialogue/chunks/health.ts`, tests/care.test.ts (12). An appointment coming round asks on Home: play it out, just go, or skip it; an hour of silence is a no-show with the practice's fee that the doctor remembers; being in another city is a missed one. Played, it is the desk (your card in network, out of network, or none, with what that makes the visit cost), the wait, the room where you say what brought you in from what fits the practice and how you are, an exam that ends in nothing, tests or a prescription (by the care system's own rule, with a nudge for the wrong door), the bill paid or sent on as an unpaid bill that asks, and a follow up you can book before you leave. Tests come back two days later on their own, clear or with a follow up to book; a prescription is collected at a pharmacy, paid with the card's share, taken over days as scheduled doses that move condition, sleep or stress, and finishes, or lapses uncollected after two weeks. The doctor is a person who remembers what you came in about. Simulated care, not medical advice; every provider and medication is SLATE's own. |
| D7 | Relationships and the in-game Raya | Not started (Raya) | Persistent relationships exist (`rel.*`). Raya — onboarding, profiles, discovery, matches, conversations, privacy, membership — is a separate implementation; nothing claims parity. |
| D8 | Banking: accounts, cards, premium products, statements, pending/posted, scheduled payments, fees, limits, interest, debt; international/offshore with FX | Partial | Accounts, transfers, bills, loans, credit and tax exist. Payment instruments, statements, pending vs posted, premium products, multi-currency and FX Not started. |
| D9 | Property: 100 distinct real homes per market with provenance; full lifecycle | Blocked (data) / Done (lifecycle to moving in) | Showing, counter, inspection, appraisal, closing, moving in and furnishing are scenes with their asks and clocks (C4); renting and selling are commands. Real listings need a licensed feed; procedural homes are labelled SLATE's. |
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
| F1 | Versioned library: stable id, text, language, speaker role, purpose, section, beat, eligibility, memory conditions, tone, cooldown, follow-ups | Done | `src/engine/dialogue/schema.ts`; chunks in `src/engine/dialogue/chunks/`; `docs/DIALOGUE.md`. A line has no effects. |
| F2 | Seeded selection among eligible variants; per-save exposure tracking | Done | `speak()` filters for what is true (outcome, move, voice, what the speaker knows, flags, chemistry), relaxes only the voice, falls back and says so, chooses seeded and weighted away from what the save has heard; `dialogue.seen` in the save, bounded to 2,000 ids, never the text. `preview()` for views records nothing. |
| F3 | Validation: missing ids, broken branches, unreachable content, normalized and near duplicates | Done | tests/dialogue.test.ts and `node tools/dialogue-check.mjs`: ids unique and placed, follow-ups resolve, every declared expectation covered (reachability by declaration), normalised duplicates fail, near-twins at Jaccard ≥ 0.85 fail, count printed. Editorial review is a person's. |
| F4 | Chunked loading by section; saves carry references, not the library | Done | `loadAllSections()` pulls each section as its own file as the app starts (dynamic import); a scene that speaks first gets the fallback. Saves hold ids and times only. |
| F5 | 100,001 distinct approved entries across a coverage matrix and per-section allocations | Blocked (content production) | **382 distinct entries** in five sections (property 122, dating 112, vehicles 59, health 52, social 37) at the time of writing — `node tools/dialogue-check.mjs` prints today's figure. The gym, meal, run and wellbeing scenes still carry their lines in code and are next to move. The target is a months-long authored programme with a section allocation this tree does not yet carry; nothing is counted from templates, combinations, slot variants or promises. |

## G. Game-wide AI integration

| Id | Requirement | State | Gap |
| --- | --- | --- | --- |
| G1 | Inventory of routes, workspaces, panels, commands, scheduled events, notifications | Done | Read from the code by `node tools/inventory.mjs` and written into `docs/COVERAGE-MATRIX.md`; `--check` fails when the document is behind the code or a command, scene or route has no line in the matrix. 119 commands, 51 scheduled kinds, 117 events, 12 listeners, 8 scenes, 19 routes at the time of writing. |
| G2 | Coverage matrix mapping each interaction to system, commands, events, persistence, UI entry, tests | Done (as a record) | `docs/COVERAGE-MATRIX.md`: every feature area and the subfeatures the directive names, each with its state, the commands and scenes that carry it, where it is on screen, the tests that hold it, and the gap or the dependency by name. Data-blocked items are listed separately from unbuilt ones. |
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
4. Stage 4 — the dialogue library foundation (F1–F4). **Done.** F5 stays blocked on content.
5. Stage 5 — home, social and film journeys (C4–C6). **Done** for C4 (partial, named) and C5; C6 is blocked on the company engine and says so.
6. Stage 6 — the coverage matrix reconciled against the code (G2). **Done.**
7. Stage 7 — the rest of the home journey: the counter call, the inspection, the appraisal, closing day, moving in and furnishing (C4). **Done.**
8. Parked at the player's instruction — the company engine, the strike and the business instrument (tasks 38, 39, 40), and with them C6.
9. Stage 8 — the health visit (D6). **Done.**
10. Next — the travel journey's stages (D14); banking depth (D8); restaurants and shops as conversations (D1); the gym, meal, run and wellbeing lines into the library (F5).

Everything Blocked stays Blocked until its dependency is supplied; it is not
re-labelled to look finished.
