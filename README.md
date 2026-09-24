# 🎬 SLATE

**A life simulator, at the start of a revamp.**

The build is cut back to six things: the startup screen, character creation,
the geography map behind it, Home, the calendar and the weather. One save is
one universe; there are three of them, and they never see each other.

Everything else that used to be here — the acting career and the character
sheet behind it, the family and the family business, the land they stood on,
and before them the shops, the schools and the phone — has been removed on
purpose. What is left is those six features and the engine underneath them,
kept whole: `docs/COVERAGE-MATRIX.md` lists what is in the build and what was
taken out, and `docs/DEPTH.md` is how whatever comes next is held to account.

SLATE runs as a single-page app. The whole simulation is in the browser, and
the server is the authority on what may be stored. It plays without a backend
at all — saves go to local storage — and gains server-checked persistence when
deployed to Base44.

---

## Running it

```bash
npm install
npm run dev          # http://localhost:5173
npm run validate     # typecheck, lint, and the whole test suite
npm run gate         # validate, then twelve checks on the words, the docs and the ledgers
npm run build        # production bundle into dist/
npm run audit        # build, serve it, and measure the layout in a real browser
```

`npm run gate` is the gate: `npm run validate`, then title case, the label
sweep, plurals, the voice, the tics, the docs' file references, what nothing
reads, the deciders, spelling, typos, the gazetteer and the inventory. It must
exit 0 before anything ships. It said `npm run validate` was the gate, which
left the twelve checks out.

---

## How it is built

**One clock.** There is exactly one world clock, and one path that moves it:
`Simulation.advanceTo`. Real-time play, sleeping and skipping to an event all
go through it, which is why the world cannot be in two times at once. Time is
a UTC instant plus an IANA zone; wall-clock arithmetic goes through
`engine/core/time`, which handles the spring-forward gap and the autumn overlap
explicitly. Nothing anywhere reads `Date.now()` — the lint rules fail the build
if it tries.

**Money comes from transactions.** Balances are never set, only derived.
`Ledger.post` refuses a transaction whose postings do not sum to zero, and
refuses fractional cents, so money conservation is structural rather than
hoped for. `Ledger.audit()` recomputes every balance from the postings and
reports any drift.

**Outcomes are deterministic.** Every draw comes from a named, seeded stream,
and the same save replays to the same universe. That part is live and tested.

The explaining half is built and not yet connected. `src/engine/core/audit.ts`
can record the inputs, weights, rules version, seed, probability, roll and
result behind a decision, mark the factors the player could not have seen
inside as unknowable, and strip those with `redactForPlayer` so the player
learns that something was hidden and never what it was. Nothing calls it:
`sim.audit()` has no callers, and no played save has ever written a single
audit record. This paragraph said otherwise for a while, which was worse than
saying nothing, because it made the axis look finished. It is waiting for the
first system that makes a decision worth explaining.

**Failure is transactional.** A command that throws restores the universe
exactly as it was. The restore writes the old values back into the objects that
are already there rather than swapping in copies, so a reference taken before a
command is still the right object afterwards.

**A long save stays loadable.** Records that grow every tick — answered
decisions, the timeline, the audit trail — have retention rules behind them, so
ten years of the clock does not become an unloadable save. The endurance suite
runs a decade and checks it.

---

## Deploying to Base44

The Base44 side of the app lives under `base44/`, in the layout the platform
expects: `config.jsonc` naming the directories, entity schemas in `entities/`,
one directory per function in `functions/`, and code shared between functions
in `shared/`.

```
base44/
├── config.jsonc
├── entities/
│   ├── SlateSave.json
│   ├── SlateCommandReceipt.json
│   └── SlateOfficialResult.json
├── functions/
│   ├── saveUniverse/entry.js
│   ├── loadUniverse/entry.js
│   ├── recordOfficialResult/entry.js
│   └── clearSlot/entry.js
└── shared/
    └── guard.js
```

### 1. Entities

Each schema carries a row-level security block. Reads are scoped to
`created_by`, which Base44 fills with the signed-in user's email, so one player
can never reach another's rows even by naming them.

| Entity | What it holds | RLS |
| --- | --- | --- |
| `SlateSave` | One row per slot: the serialised universe, its metadata, the previous payload as a backup, and what the server checked when it accepted the write. | create, read, update, delete — all owner-scoped |
| `SlateCommandReceipt` | Receipts for critical commands, keyed by save and idempotency key, so a retry is handed the original result instead of being applied twice. | create and read only; update and delete denied |
| `SlateOfficialResult` | Finalised outcomes, with the inputs, weights, rules version and seed that produced them. Nothing in this build writes one; the entity and its function stand for the ones that will. | create and read only; update and delete denied |

The two append-only entities deny `update` and `delete` outright rather than
scoping them to the owner. That is the difference between history that is not
meant to change and history that cannot be changed: no client, signed in as
anyone, can rewrite a finalised result.

### 2. Backend functions

The browser never writes a save directly. It sends the universe to
`saveUniverse`, which checks, and only then stores.

| Function | Enforces |
| --- | --- |
| `saveUniverse` | Signed in; slot is 1–3; payload parses, is within size, and is in a format this build reads; every transaction balances and the whole ledger sums to zero; no record belongs to another save; the world clock and playtime have not gone backwards; the previous payload is kept as a backup. Idempotent on a retry. |
| `loadUniverse` | Reads scoped to the caller by row-level security. With no slot, returns what is in all three. |
| `recordOfficialResult` | Writes a finalised result once. A second write returns what is already stored rather than changing it. |
| `clearSlot` | Moves the payload aside as a backup and marks the slot cleared. Nothing is destroyed outright. |

The checks themselves live in `base44/shared/guard.js`, which is plain, pure
JavaScript and is covered by `tests/server-guards.test.ts`.

What the guards deliberately are not is a re-simulation. They catch a corrupt
or cross-contaminated write, a stale tab overwriting newer progress, and a
retry being applied twice. A player editing their own save can still make their
own game strange; that is a different problem from a bad write landing in
storage.

Two things worth knowing about the platform's shape, because both are easy to
get wrong and neither fails until the first real save:

- **Functions are reached by name.** `base44.functions.invoke("saveUniverse",
  payload)` — not as a property. The function's JSON arrives on `.data`, and a
  non-2xx reply is *thrown*, with the body on `error.response.data`. The
  adapter handles all three, and `tests/base44-adapter.test.ts` holds it to
  that protocol against a stand-in client.
- **Backend functions build their own client.** `createClientFromRequest(req)`
  reads the auth headers Base44 injects; there is no app id or token to pass,
  and no environment variable to set.

### 3. Configuration

`base44/config.jsonc` points at the entity and function directories and names
the site output. The Vite build writes to `dist/` at the repository root, one
level above the config file, so `site.outputDirectory` is `../dist`. If the
platform resolves site paths from the project root rather than from the config
file, that becomes `./dist` — it is the one path worth confirming on a first
deploy.

The client picks its storage at startup: backend functions if the deployment
exposes them, direct entity access if not, and local storage if there is no
Base44 client at all. Every Base44 write is also mirrored locally, so a
connection dropping mid-session never costs progress.

### 4. What could not be verified from here

The SDK surface above was checked against Base44's published documentation in
September 2026: the function layout and `export default async function (req)`
handler, `createClientFromRequest`, `functions.invoke` and its response shape,
the `create`/`read`/`update`/`delete` RLS keys, and the built-in `created_by`
field. Two things are **not** documented and are therefore not relied on:

- **Unique indexes.** Base44's entity schema documentation does not describe
  index or unique-constraint syntax, so the schemas declare none. Idempotency
  and write-once are enforced by the functions reading before they write, which
  is correct under normal use but is not an atomic guarantee against two
  genuinely simultaneous requests for the same key. If Base44 does support
  unique constraints, adding one on `(save_id, idempotency_key)` and
  `(save_id, kind, subject_id)` would close that window.
- **`additionalProperties`.** Not documented as supported, so it is not used.

---

## Testing

```bash
npm test
```

| Suite | What it covers |
| --- | --- |
| `smoke` | A universe boots, runs three years, and stays consistent. |
| `time` | Instants, zones, DST gaps and overlaps, leap years, formatting. |
| `money` | Integer cents, rounding, splitting, the ledger, conservation over a simulated year. |
| `simulation` | Advancement order, recurrences, sleep, the waking day charged as the clock moves, skip-to-event, the calendar, command idempotency and rollback, migrations, validation. |
| `calendar`, `holidays` | The month grid, entries between two instants, collisions, and the observances of a country. |
| `weather` | The climate model: normals by latitude and season, the week ahead, the units a country reads it in. |
| `geography`, `world-map` | The gazetteer and the projection drawn from it. |
| `creation`, `portrait`, `citizenship` | The creation steps and what they put in the save, what somebody did before acting and the fitness it starts them with, the headshot frame, and the citizenship a place of birth gives. |
| `personality` | The seven dispositions and the traits: the pairs the page draws, what each one moves, what it says moves nothing, the sleep the game suggests and why, and that it pays the day beside it in the same measure at any age; that no single trait or disposition wears a life down on autopilot or on the suggested hours, at twenty-five or at sixty; and that at seventy and eighty-one the suggested hours hold everybody at what the age allows. |
| `plans`, `looks` | Plans of your own on the calendar, and the drill-down graph crawled end to end. |
| `endurance` | A day, a week, a month, a year, five years and ten: money drift, stranded schedules, corrupt history, duplicated ids, contradictory ownership, unbounded collections, and cost per simulated year. |
| `integrity` | Retries and replays, save isolation, round trips, malformed and hostile input, what the player is allowed to know. |
| `calibration` | The one random source: an even spread, a normal distribution centered where it says, the same stream for the same seed, and the same world from the same seed two years on. |
| `deciders` | Every decider moves its outcome when one of its declared inputs moves across its range. |
| `realclock` | Live time: an hour of world time for an hour of real time, to the millisecond, whatever the ticks, a night away or a backlog. |
| `text` | Title Case as the game writes labels. |
| `persistence` | Saves on this device: packed, a save from before packing still loads, a save that won't read, deleting a slot, and opening one. |
| `looking-after` | Eat, shower, work out and unwind: each spends its own time, moves its dials by what was needed, keeps fitness under its age, raises condition and readiness on any schedule, and refuses what it can't do, a clash with a plan included, without touching the save. |
| `wellbeing-bites` | What each dial decides, with the input changed and the outcome watched: fitness, condition, morale, hygiene and readiness, and played careers on autopilot, looking after yourself, and five-hour nights. |
| `work` | The day job: its shifts, a real legal floor by place and date, the country's payday and pay period, tax withheld, missed and called-in shifts, being let go and finding work again, old saves given the job, and a working year on autopilot for every trait. |
| `household` | Rent and bills on the first, food with each day's meals, paid from checking, then the card, then owed; a day eaten thin when it can't be paid; owing weighing on somebody; the card's statement, minimum, interest, grace period and late fees; and the record that prices it. |
| `day-bounds` | A day is a date on the calendar, not 24 hours: the night into a day whose clocks skip midnight, the Day look, the month grid, the plan form, the hours of the weather and the week ahead, on 23- and 25-hour days. |
| `base44-contract` | The four server functions executed against an in-memory stand-in for the SDK: every guard, ordering rule and error path. |
| `interface`, `navigation`, `cohesion` | The interface is text, every door opens onto something, and the screens agree with the engine. |
| `server-guards` | The server-side checks that stand between a browser and storage. |
| `base44-adapter` | The client speaks the platform's documented protocol: invoke by name, JSON on `.data`, non-2xx thrown, local mirroring, graceful fallback. |

### What these tests do not cover

Reported as unavailable rather than counted as passing:

- **Deployed authentication and authorisation.** Requires a live Base44 app and
  credentials. The guards the functions are built on are tested, and the client
  is tested against a stand-in that mirrors the documented protocol, but no
  request has been made to Base44 itself.
- **Row-level security as enforced by Base44.** The schemas declare it; whether
  the platform applies it as declared can only be confirmed against a
  deployment.
- **Cross-account isolation.** Needs two real accounts. Cross-*save* isolation
  within one account is tested.
- **Browser and device coverage.** The suite runs in Node. Layout, input and
  accessibility behaviour have been built to standard but not verified on real
  hardware.

---

## The shape of the code

```
src/engine/core        the clock, ledger, scheduler, event bus, commands, audit, rng
src/engine/domain      the model: every stateful thing in a universe
src/engine/content     reference data, each record carrying its provenance
src/engine/systems     wellbeing and sleep, the personality, the weather, what a life is worth
src/engine/world       bootstrap, the calendar, the world tick, the Decision Center
src/engine/persistence local, Base44, and the adapter contract between them
src/ui                 startup, saves, character creation, the shell, Home, the calendar
base44/                the platform side: config, entity schemas, functions, shared guards
tests/                 the suites above
```

### On the reference data

Real-world geography is what it is: 252 countries, 3,865 regions and 170,911
cities, with their time zones, and a projected world map drawn from the same
data. Everything else — the climates, the costs of living, the tax tables — is
a calibrated simulation, and every reference record says which it is, in a
`source` field reading `public_reference`, `calibrated_estimate` or
`simulated`, alongside a confidence and a version. Nothing invented is
presented as verified fact.

The weather in particular says so on screen: it is SLATE's climate model for
that city — the season, the latitude and the kind of place it is — and not a
forecast service.
