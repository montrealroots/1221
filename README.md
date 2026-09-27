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
| `creation`, `portrait`, `citizenship` | The creation steps and what they put in the save, the body a life starts with, a save from before the job engine went, the headshot frame, and the citizenship a place of birth gives. |
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
| `household` | Rent and bills on the first, food with each day's meals, paid from checking, then the card, then owed; a day eaten thin when it can't be paid; owing weighing on somebody; the card's statement, minimum, interest, grace period and late fees; and the record that prices it. |
| `cards` | The bank's own card: its name and bank, a rate priced within the bank's range by the record and repriced on the statement, the country's caps, the minimum with interest and a floor, the late fee, the days to the due date, a charge card taken in full, the yearly fee in the card's month, the card staying behind on a switch, an older save's card tied to its bank, and the table's own shape. |
| `statements` | Each entry with the balance after it, periods that meet, Germany's quarterly closing of fees and interest, a statement's sums, the card's statement and what paying only the minimum takes, the year's interest net of a term deposit's principal, and each alert. |
| `payments` | A new life paying the country's usual way with savings unlinked, an older save running as it ran, rent that bounces and is never put on a card, savings drawn only where linked, rent by hand and paid ahead, a check cashed, bounced and stopped, bills on a card with and without room, the day on the credit card, standing orders and payments set for a date, and a SEPA direct debit taken back. |
| `cardlife` | Applying for the bank's card and being declined, closing it, moving the statement day, a limit lowered and raised, never raised unasked, going over the limit in the US and its fee three cycles at most, a hardship plan, missed payments suspending the card and six charging it off, a bounced autopay, the US late-fee cap, British set-off and persistent debt, and the US first-year fee cap. |
| `interest` | The grace period kept, lost back to the spending's day and regained with trailing interest, daily compounding to the cent, the rate held from opening, the US penalty rate's notice and its cure at exactly six, Britain's 28 days, a credit balance, and the average daily balance. |
| `cash` | ATM fees at the bank's own machines and others', the daily limit and the counter free of it, the counter's fee, Britain's Post Office, a cash advance's fee, minimum, grace-free interest and limit, payments split to the dearer balance by the US and British rules, paying in, the day's groceries in cash, and Germany's monthly savings limit. |
| `accountlife` | A term deposit renewing at Chase for the same term twice with ten days' grace, its penalty capped at the term's interest but a week's at least in its first week, paid out on the holder's word, moved into CommBank's savings, Deutsche Bank's three months' notice, one refused early where the bank allows none but its cooling-off, a renewed Irish one no longer new, the interest forfeited as SLATE's estimate, a penalty bigger than the interest at Citi, which doesn't cap it, interest taken during the term, RBC's withdrawal fee, Bank of America's round-ups, TD's dormancy and reactivation, interest stopped while dormant, unclaimed money gone and claimed back, Germany's none, and a new account cancelled in Canada's fourteen days. |
| `cardoffers` | Bank of Ireland's and KB Kookmin's cards reached, Chase's 0% for fifteen months and the card's own rate after, nothing charged on a balance carried during it, the rate ended sixty days late, the warning counting it, a balance moved from Chase to Citi after switching for Citi's fee at 0% for eighteen months, one refused where the limit won't take it or at the same bank, NatWest's money transfer at its own rate, a Chase plan's month and fee in the minimum and no interest on it, a payment split by rate with a US minimum to the cheapest and a plan last, and Chase's rewards cycle by cycle. |
| `security` | A locked card taking nothing new but still paying its bills, a locked debit card's shopping on the credit card and the counter still paying out, BBVA México's fee and SLATE's estimated days, Chase's rush, Lloyds' none, Santander Spain's free stolen card and paid lost one, bills declined on a replaced card until they have the number and not at Chase, a card reissued before it expires, Bank of America's new account number, Britain's banks stopping their share of fraud, the US's $50, $500 and everything, a refund, Japan's none, and a report past the law's days. |
| `pending` | A debit card payment held against the available balance at once and posted in the bank's days, the posted balance beside it, a statement's pending mark gone once posted, the credit card held too, a direct debit not, two business days within Chase's three and five, at once in Japan, and two where a bank doesn't say. |
| `school` | A new life beginning as a first-year actor in New Haven on 24 August 2026 from a wealthy family with no birthplace chosen for it, New Haven's HUD rent, a draft put at the school, no school without it or away from New Haven; the admitted class, the player ahead in every area; tuition met for all, living costs only on need (the health plan from a wealthy student's bank, $13,318.50 paid to one in need); the Bulletin's class days, holidays and recesses, and each term's fifteen meetings a week; classes grown in when there and awake, missed when away, excused by calling in sick only when unwell; Saturday work-study paid on Fridays as wages, and elective evenings to fifty hours; understudying The Seagull or a School project, the casting pool lost to missed calls and a missed performance's breach; each evaluation's steps to dismissal and back, and the MFA after six terms. The Yale Cabaret, a show a term clear of recesses and casting, refused on academic warning, growing the actor and going on the résumé; the Yale Summer Cabaret, its company in the spring for the summer, three shows, a weekly stipend on the return, and a missed performance ending it. Casting by year and standing into the School season (Carlotta, the theses, the Hughes Festival, Shakespeare Repertory) on its dates, with a Yale Rep assignment once a year for a student in good standing; summers open to work, a job ending before the fall term, a stay in another city. |
| `career` | The showcase in New York and Los Angeles on the estimated 2029 dates, a showing's reading and the agencies whose bars it clears; signing only on a standing offer; the business from the Monday after school; each agency's weekly auditions for the parts its reach sends, and submissions for the ones that take them; the booking odds against each part's bar; missed auditions and a year with nothing booked ending the representation, and leaving on SAG-AFTRA's terms; a booking offered days after and lapsing in two; a job's days and paydays; scale plus 10%, Equity's 5% rehearsal commission and working dues, and withholding that sums to the year's tax; SAG-AFTRA's eligibility, thirty days and initiation fee, Equity's on the first contract, and the dues each May and November; moving city; the school's later years' costs and Yale Rep casting. |
| `safetynet` | Off-Broadway's and a series regular's minimums, a season's workweeks and its pay by the episode; a day player's and a weekly performer's overtime and the money break; managers' offers, commission beside an agent and without one, leaving after a year, the auditions they add and the agencies they find; residuals for a network rerun, syndication, streaming years and a hit, and a film's cast pool, scheduled and paid as wages; Yale's cover to July, SAG-AFTRA's and Equity-League's earned cover, the marketplace's enrollment windows and premiums, and California's uncovered months; New York's and California's monetary tests, weekly benefits, partial weeks, waiting week and a claim paid as income; the return's deadlines, tax, payroll, withholding, California's exemption of benefits, the performing artist deduction, the premium tax credit, California's penalty, late penalties, refunds and what's owed. |
| `worklife` | Commercials' session fees, commissioned at scale, and their cycles by where they ran; voice sessions; about a third of travelling jobs sent to Atlanta, Chicago or New Orleans, flown out and home, travel days and meal allowance paid, and wages sourced there; a series' option, its pickup at 4% more or its cancellation, exclusivity, and a picked-up season releasing what clashes; Medicaid and the Essential Plan by last month's income, enrolled any time, ended at renewal without the work; COBRA back to the day, with New York's 75%; illness at an adult's rates, each plan's share and the uninsured's charity, a stay keeping them from work, bills due in 30 days, and medical debt reported only as the bureaus and states allow; part-year and nonresident state returns, Georgia's small-wage exemption, the home state's credit, and New York City's months. |
| `arrears` | What `docs/UNBITTEN.md` carried, settled: a day of work in a loved medium, genre or place lifting mood and easing stress and leaving the craft alone; an audition in the room taken by extraversion, a day away by openness, a rehearsal by agreeableness; offers filed under a genre by medium; Resilient's illness, Homebody's and Restless's nights away, Night Owl's and Early Riser's calls, and Keeps Accounts' receipts on the return; a US charge-off's ChexSystems report, the banks that turn it away and the second-chance account; France's letter at a month past the limit, notice at sixty days, loan offer at three months and close two months on; NatWest's 35 days' notice to break a fixed term. |
| `costs` | A casting site paid a year and renewed unless stopped, a paid submission seen twice as often, Backstage's five more, stale headshots costing a fifth of auditions, a kit and a coach, a class billed monthly that grows acting against a life without it, and the costs itemized in New York; insulin capped at the makers' $35 and at nothing on New York's regulated plans from 2025; diabetes and arthritis kept up and left alone; stand-alone dental in New York, California and at Yale; medical prices grown by the index; Yale Health's copays. |
| `carried` | Canada's 23% and the UK's 20% withheld abroad, the US credit for it, and Canada's back under its treaty; Connecticut's tax against its instructions' worked examples; New York's itemized job costs above 2% of income; meal penalties on a fifth of shooting days; each plan's prescription copays and brand deductible, and what it pays of the dentist and the optician; conditions drawn at a young adult's rates, their monthly care and its lapse, depression left alone weighing on morale, and asthma left alone doubling emergencies. |
| `livelihood` | What was left open after the money system: a notice at two months owed and eviction to a sofa that sleeps badly, a room again once there's a deposit, moving's deposit and the rest of the month, two months' deposit for a poor record, and the card's limit raised and cut by the record. |
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
