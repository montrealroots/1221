# 🎬 SLATE

A life and film-industry simulator. One save is one universe; there are three
of them, and they never see each other.

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
npm run build        # production bundle into dist/
```

`npm run validate` is the gate. It must be clean before anything ships.

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

**Outcomes are deterministic and explained.** Every probabilistic decision draws
from a named, seeded stream, and records the inputs, weights, rules version,
seed, probability, roll and result. The same save replays to the same universe.
A decision the player could not have seen inside is marked unknowable, and
`redactForPlayer` strips those before anything reaches the screen: the player
learns that something was hidden, never what it was.

**Failure is transactional.** A command that throws restores the universe
exactly as it was. The restore writes the old values back into the objects that
are already there rather than swapping in copies, so a reference taken before a
command is still the right object afterwards.

**The world runs at tiers.** People close to the player are simulated in full;
the rest get progressively cheaper treatment, and the long tail is not touched
until something makes it relevant. Records that grow every tick — casting
rooms, answered decisions, finished films nobody was involved in — have
retention rules behind them, so a ten-year save does not become an unloadable
one. Credits are denormalised onto projects so a film keeps its billing block
after the world stops individually simulating the day players in it.

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
| `SlateOfficialResult` | Finalised outcomes — award editions, release settlements, contract conclusions — with the inputs, weights, rules version and seed that produced them. | create and read only; update and delete denied |

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
| `smoke` | A universe boots, runs a year, and stays consistent. |
| `time` | Instants, zones, DST gaps and overlaps, leap years, formatting. |
| `money` | Integer cents, rounding, splitting, the ledger, conservation over a simulated year. |
| `simulation` | Advancement order, recurrences, sleep, skip-to-event, the calendar, command idempotency and rollback, migrations, validation. |
| `systems` | Vehicle fitment, post-production dependencies, construction, greenlight authority and rights, tax by jurisdiction, the 88 attributes and 42 traits, relationship bounds. |
| `endurance` | A day, a week, a month, a year, five years and ten: money drift, stranded schedules, corrupt history, duplicated ids, contradictory ownership, runaway prices, unbounded collections, and cost per simulated year. |
| `full-film` | One project from idea to library, proving it stays one project the whole way down. |
| `full-life` | An ordinary life — job, home, car, marriage, child, study, travel — without ever touching the industry. |
| `integrity` | Retries and replays, save isolation, round trips, malformed and hostile input, permission boundaries, what the player is allowed to know. |
| `calibration` | Monte Carlo runs over the probabilistic models: uniformity, monotonicity, spread, reproducibility. |
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
src/engine/systems     life, work, property, vehicles, film, casting, awards, companies
src/engine/world       bootstrap, the world tick, tiering, the Decision Center
src/engine/persistence local, Base44, and the adapter contract between them
src/ui                 startup, saves, character creation, the shell, workspaces
base44/                the platform side: config, entity schemas, functions, shared guards
tests/                 the suites above
```

### On the reference data

Real-world geography is what it is. Everything else — the studios, the awards
bodies, the vehicle catalogue, the economics — is a calibrated simulation, and
every reference record says which it is, in a `source` field reading
`public_reference`, `calibrated_estimate` or `simulated`, alongside a confidence
and a version. Nothing invented is presented as verified fact.
