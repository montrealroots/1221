# Depth

The standard this game is held to, and how it is checked.

## The Standard

SLATE has to be a deeper simulation than *Total Extreme Wrestling* and
*The Movies* combined.

That is not a slogan. It is a bar with two halves, and the halves come from
two different games because no single game has ever held both.

**TEW** (Adam Ryland, Grey Dog Software) is the deepest entertainment-industry
simulation ever built. Hundreds of people, each a full record. Backstage
relationships that form and decay whether or not you are in the room.
Popularity tracked by region, separately from respect, separately from
reliability. Contracts with downside guarantees, per-appearance fees and
expiry. And an industry that signs, books, rises and fails on its own clock
while you sleep.

**The Movies** (Lionhead, 2005) is the best film game. A lot you build and walk
across, where adjacency costs shoot minutes. Stars as objects that age, gain
weight, get difficult and go to rehab. And the picture actually being made
rather than costed.

**Hollywood Mogul** (Carey DeVuono) is the third reference and the deepest film
*business* sim: rights, chain of title, negative cost apart from P&A, and a
release that runs theatrical, then home, then pay, then free, then library, in
every territory separately.

Each fell short somewhere the others did not, and all three fell short in the
same place: **the player is the buyer.** The studio boss, the booker, the
person who wrote the schedule. SLATE's player is the talent, which opens an
axis none of them can reach and closes none of theirs.

## The One Rule

**A declared word with nothing that reads it is worse than no word at all.**

This is first because it is the failure this project is most exposed to. SLATE
is aiming at depth beyond anything in its genre, and the cheapest way to fake
that is to declare the vocabulary without building the systems: a field for
every axis, a modifier key for every effect, an id namespace for every noun. It
reads as a deep game to anybody scrolling the source and it plays as nothing.

The disease is already here, and it was found by measurement:

| Declared | Read by something |
|---|---|
| 123 id namespaces | 17 |
| 54 trait modifier keys | 7 |
| 18 higher-is-worse guards | 12 |
| 7 reputation axes | 0 |
| 7 personality axes | 4 |
| 813 acting attributes | 0 |

`tools/wired.mjs` walks the declared vocabulary, finds what nothing reads, and
holds the count against `docs/UNWIRED.json`. It does not demand zero — content
written a little ahead of its system is normal, and the acting sheet was
written first on purpose. It forbids the number going **up**. `--check` fails
the gate.

### The Falsifiability Test

Every axis below has to survive one question, asked the same way each time:

> **Change one input by a little. Does the outcome change, or only the prose?**

Move one Industry attribute by ten points and the shortlist has to come out
different. If only the sentence explaining the result changes, it is a slot
machine with an essay attached, and the essay is the tell.

Delete `src/engine/content/geography.ts` and the audience model has to break.
If only the labels change, the 170,911 cities were decoration.

**This one is not left to good intentions.** A decider — anything that turns
the state of the world into an outcome the player did not choose — registers in
`src/engine/decided.ts` saying what it decides and every input it reads.
`tests/deciders.test.ts` then sweeps each declared input from one end of its
range to the other across six worlds, and fails if the outcome never moves.
There is no hand-written sensitivity test to write weakly; the sweep is
generic, so the only way to pass is for the inputs to matter.

`tools/deciders.mjs --check` closes the other half: a file in the engine that
gets hold of the random number generator and is owned by no decider fails the
gate. Randomness is where slot machines live, so that is where the rule sits.

Two deciders are registered today, `weather.day` and `family.born`, which are
the only two things in the build that decide anything. **When casting lands, it
lands here, and it cannot land without proving its inputs matter.**

## Where We Stand

Measured on a booted save, not read off the source.

**The world is unusually deep. The career does not exist.** Real time and
timezones, NOAA sunrise and sunset including polar day and polar night, hourly
weather, 170,911 cities, 206 holiday calendars, a double-entry ledger that
refuses to balance wrong, a real tax engine, a family with bonds that move, and
a company with registries, guilds, cover, rights and nine derived capabilities.

Against that: 15 commands, 2 scheduled kinds, 3 events, 0 event listeners.
Three people in the world, still three after sixty years. No auditions, roles,
scripts, shoots, credits, agents, casting directors, producers or crew. No
rival companies, no audience, no box office.

Three findings are defects rather than gaps, and all three are live:

- **The simulation reaches a fixed point in thirty days.** Fitness has no
  source of income — its only write in the codebase is a subtraction — so it
  slides from 50 to 0 in 277 days and stays there. The autopilot night sleeps
  at 95% quality, which always clears the restful threshold, so morale climbs
  to 100 and pins while its only counterweight waits on a nourishment floor the
  same autopilot prevents. Four of the nine dials are constants by day thirty.
- **The ageing model can never fire.** Because fitness is already at zero, the
  age ceiling clamp binds on 0 of 27,375 days. Eight authored bands, each with
  its own prose, are dead arithmetic. `src/engine/content/lifespan.ts` is 540
  lines with 2 of its 28 exports wired.
- **Every attribute on every person is 100.** All 813, seeded to the ceiling.
  The craft sheet is not merely unread; it is uninformative even if read. And
  no look, workspace or screen displays it during play.

One structural constraint had to be settled before the population system, and
it has been. A person was 30,536 bytes of JSON, 93% of it 813 copies of the
same number, and a thousand people cost a 20MB save and **63ms of
`structuredClone` on every command**, because the engine snapshots the universe
before each one. The sheet is now a base and its exceptions: a thousand people
cost 1.1MB and 8.2ms. That is what makes a TEW-sized roster possible at all.

## The Sixteen Axes

Eight from TEW's side, eight from film's. Each is a bar, not a feature.

### From TEW

1. **Population depth.** Everybody the player can meet is simulated to the
   player's fidelity. *Today: three people, no name corpus.*
2. **A social graph without the player.** NPC-to-NPC ties that form, decay and
   matter off-screen. *Today: six edges maximum, collapsing to a constant
   inside a year.*
3. **Reputation as a multi-axis economy.** Separate by market, by tier, and by
   what is being judged, on separate clocks. *Today: seven fields, no movers.*
4. **Contracts and options as real objects.** Terms, exclusivity, holdbacks,
   pay-or-play, options the other side holds, and being locked into something
   that turned bad. *Today: the actor side is at zero.*
5. **An industry that runs without you.** Parts cast whether or not you read
   for them. *Today: structurally absent — the save has no table that could
   hold one.*
6. **Incomplete information.** The gap between what is true and what the player
   is told. TEW cannot do this: there, the player has god-view of their own
   promotion. *Today: `src/engine/core/audit.ts` is a complete, correct,
   unused layer.*
7. **Ageing and the career curve.** What you can play at forty as a consequence
   of what you did at twenty-five. *Today: written, and unreachable.*
8. **Consequence memory that compounds.** Old decisions as the reason a door is
   shut now. *Today: zero records after five simulated years.*

### From Film

9. **The unit of work, and a resolution function that spends the craft sheet.**
   The take, the setup, the day. The largest single consumer of finished dead
   code in the repository.
10. **The work as a persisting object.** A picture is re-judged for decades; a
    match is consumed the night it airs.
11. **Casting: the market for a person.** Breakdowns, submissions, callbacks,
    chemistry reads, and the offer that never comes with no reason given.
12. **Rights, windows and the life of a picture.** Chain of title, negative
    cost apart from P&A, territory by territory, and what an actor sees of it.
13. **An audience and a market that judges.** Founded on real geography, real
    populations and real holiday calendars, with critics as a different
    population from the audience.
14. **The lot as an operating asset.** Not a workshop that only ever serves
    you: stages with day rates, tenants, occupancy and a crew base.
15. **The body as the instrument.** Training, injury, weight, vocal damage, the
    casting band — the voluntary half as well as the involuntary one.
16. **Unions, publicity and awards.** Scale, meal penalties, turnaround, Global
    Rule One; press as compellable labour; a season with a campaign and a
    budget.

### And Typecasting

The one the reference games cannot express at all, and the defining mechanic of
an acting career: the industry's **categorical** picture of you, which lags
what you can actually do. The set of parts you are offered as a function of the
parts you took. Playing against type as possible, costly, and able to fail. A
career trapped in a genre the player never chose.

It goes last, because it can only be *measured* from an accumulated record. It
cannot be a field.

## Open Questions

Two things are known to be imperfect and are left that way deliberately, so
that a future session changes them as a decision rather than by accident.

**An unrecouped picture stops accruing interest after its last receipt.**
`splitIt` is a pure function of the receipt list and takes no notion of now, so
once the final window has paid, what is still owed freezes even as years pass.
That is defensible — the split describes what the receipts did, not what is
owed today — but it understates a long-dead picture's debt. Fixing it means
passing the current instant in and giving up the purity several tests rely on.

**The lot's viability finding is not pinned by a test.** Five years across three
seeds gives about ten bookings a year and 21% occupancy against a 62%
break-even, with the family fronting roughly €30m. That was an ad hoc probe, not
a committed test, so a future change could move it silently. It matters because
enquiry volume is hardcoded at one a month and responds to nothing, which makes
that axis inert: no action the player takes can currently change the outcome.

## The Build Order

Dependency, not appetite.

**0. Location becomes mutable.** A prerequisite, not an axis, and about two
days. `currentLocationId` is read in two dozen places and written once, at
bootstrap. Until it moves, nothing about being somewhere can matter.

**Before rank 1, a correction the research forced.** The order below builds the
live-action feature first, and the spine synthesis in `research/KINDS.md` says
that is the wrong first build — not because a feature is hard, but because every
spine primitive gets quietly satisfied by a live-action-shaped special case (the
day, the page, the strip) and the spine is not discovered to be fake until the
fourth form, with nine forms of content authored on top of it. Its
recommendation is a format-led unscripted season first, because it has no script
and no takes and no boundary between production and post, so none of those
assumptions can be hardcoded anywhere.

Rank 1 is already built as a feature. The salvage is to run the test in reverse:
take the unscripted season as the next build and require it to add **no new
engine concepts**. Whatever it needs that `content/making.ts` cannot express is
the list of places this engine is still live-action-shaped. Three are already
known — progress is stored rather than derived and is not runtime-weighted,
`stage` is a single field where the research wants a maturity vector whose
minimum is what "done" means, and the scheduler assumes forward flow where
downstream discovery routinely creates upstream work.

**1. The Title. Done.** A picture with a dated life — prep, shoot, post,
delivered — a unit base city, a budget, and a schedule made of ordinary
scheduled items, laid out from the one number a producer actually chooses. It
holds a stage off the lot's own booking board, spends its budget across its
periods, reads its overrun off how far the schedule was cut below what the
money implies, and is not paid for until a contractual delivery list is
complete. Release and library are still ahead of it, at rank 8.
**This was the foundational thing.** Run every
one of the sixteen axes against it: a person exists because a production needed
them; two people know each other because they were on a title together;
reputation moves on titles released; a contract is an agreement about an
engagement on a title; the call sheet, the casting decision and the residual
statement are all artifacts of one.

**2. People, generated because a title needed them.** A director, a 1st AD, a
script supervisor, a casting office, scene partners. Generated on demand,
persisted, and recurring.

**3. The engagement and the deal.** Person × title × role class × dates × fee ×
billing × exclusivity. This is where TEW's contracts axis and the actor's deal
turn out to be the same record.

**4. The unit of work, declared by the plan.** Not the shoot day. The research
in `research/KINDS.md` is emphatic that there is no single atom: a live-action
feature counts shooting days, a CG feature counts approved seconds at three to
five a week per animator, a documentary counts beats banked and then cut
minutes, an unscripted format counts contributor-days, a multi-camera sitcom
counts one show a week. An engine that names the shooting day forecloses every
other kind permanently. `content/making.ts` carries `Period.unit` for this
reason — what a week of a period produces, and how many of them a week holds —
and nothing downstream may name a shooting day directly.

**5. The union floor over the day.** Membership, eligibility, scale by tier,
call and wrap as real instants, overtime, meal penalty, turnaround.

**6. The body as a second record** — not on the attribute sheet.

**7. Reputation writers, consequence memory, the audit habit.** These are
outputs of ranks 4–6 and cannot precede the events they record.

**8. The picture's afterlife.** Release, windows, territories, the waterfall.

**9. Press, publicity, awards.** Attaches to a release.

**10. The autonomous industry, deepened.**

**11. Typecasting and the ageing arc's bite.** Measured from years of record.

**12. Incomplete information — a discipline, not a phase.** Applied from rank 1
onward. Every roll writes an audit record with `knowable` set honestly.

## Why This Is Achievable

The things SLATE already has that neither reference game did:

- **One clock, one code path.** `advanceTo` is the only way the world moves, it
  refuses to run backwards, it halts on anything that wants the player, and
  scheduling a kind with no handler throws rather than dropping it.
- **Real astronomy, including the cases that break schedules.** A night
  exterior in Reykjavík in June cannot be shot. No entertainment sim has ever
  had a scheduling constraint that is astronomically true.
- **Hourly weather with the production hook already written.**
- **A ledger that refuses to balance wrong** — integer cents, postings summing
  to zero, and an audit that re-derives every balance.
- **A real tax and jurisdiction engine**, covering fifteen real film-incentive
  regimes, entirely unwired and therefore free.
- **A capability gate that already refuses and explains itself** — no foot of
  film without cover, no greenlight without material and a filled post.
- **A drill-down engine with a crawl test behind it**, 47 kinds, where ways and
  facets are data rather than markup.
- **`knowable` and `redactForPlayer`** — machinery for being honest in the save
  and incomplete on the screen, structurally unavailable to a game where the
  player is the buyer.
- **Determinism deep enough to re-derive a decision** — save-local monotonic
  ids, named seeded streams, transactional rollback that writes old values back
  into the objects that already exist.

## The Traps

Named so they can be recognized, because each of them looks like progress.

**Every one of the sixteen bars is written as a record shape.** Read them
again. A record with the right fields is precisely what this codebase already
has too much of. A shape is not a system.

**Sixty attribute lookups that all return 100.** The shoot-day bar says "at
least sixty attribute ids are read." That is satisfiable, today, by sixty
lookups returning the same number forever. Break `seedCapability` before
building anything that reads the sheet.

**Seven reputation axes moved by one fudge factor.** Seven fields and no
writers is the current state. Seven fields and a single `bumpReputation(+3)`
called from twelve places is worse: one scalar wearing seven names, claiming a
distinction it does not make. The axes have to be constructed to diverge.

**The call sheet as a curtain over an empty stage.** Partial information is
only structural if the schedule past tomorrow, the other cast's deals and the
distributor's real numbers *exist in the save* and are withheld. Generating the
withheld thing on demand is a curtain with nothing behind it.

**A residual statement is trivially fakeable.** Plausible gross, exhibitor
share, distribution fee and an unrecouped position can be printed in an
afternoon and will look identical on screen to a real one. Only the ledger can
tell the difference.

**Stat cards as set dressing.** "4 Stages · 18,000 sq ft · €12,000/day" as
literal constants photographs as a physical plant and audits to nothing. A
number nobody computes, that no account moves against, and that no stage exists
behind, is a prop.

**Unread state has already drifted into nonsense and nothing caught it.** The
fitness bug ran for months. Anything declared and unread will rot, silently,
and be wrong on the day it is finally connected.

**`StudioPlant` is a warning this codebase already wrote down.** Twelve fields,
stages, day rates, LED volume, water tank, dated tenants, lifetime income,
occupancy — declared, and instantiated nowhere.

**A regression test that cannot fail is decoration.** Written down because it
happened: the first test guarding the timeline-sort bug passed with the bug
deliberately reintroduced, because one picture slipping alone never passes
another scheduled item. Two interleaved pictures make it fail. Reintroduce the
bug, watch the test go red, restore the fix — and only then believe the test.

**`npx tsc --noEmit` compiles nothing here, and exits 0 while doing it.** The
root `tsconfig.json` is `files: []` with project references, so the bare
invocation is a green light that means nothing. This hid a whole engine file
from the typechecker once. Always `npm run typecheck`, which is `tsc -b`.

**Money is a waterfall walked in order, never a lookup against a total.**
Recoupment tiers have to be computed by walking receipts in the order they
arrived, because interest on an unrecouped balance accrues between receipts and
cannot be recovered from a lump sum. Charging it flat against the original
principal for the life of a picture turned a €20m negative into a fictitious
€47m one, and that was caught as a real bug rather than a rounding argument.

**Store the minimum fact and recompute the rest.** A sold picture stores only
which windows have paid; gross to date, what each tier took and what the
company has seen are all recomputed from that and the deal terms every time
anybody asks. A stored derived total is a number that can drift from the
receipts that produced it, and a balance nobody can reconstruct is the one
thing a game about film money is not allowed to show.

## What Holds It In Place

- `tools/wired.mjs --check` — the declared vocabulary against what reads it,
  ratcheted at `docs/UNWIRED.json`. The count may fall. It may not rise.
- `tools/deciders.mjs --check` and `tests/deciders.test.ts` — every draw owned
  by a registered decider, and every decider swept until it proves the inputs
  it named change what it decides.
- `tools/doc-refs.mjs --check` — every file a doc names has to be there, so
  this document cannot start lying the way `docs/STYLE.md` did.
- `tests/cohesion.test.ts` — the existing "everything is wired to something"
  suite, which already proves no schedule handler is dead. It is the template
  the rest of this should follow.
- `tests/looks.test.ts` — crawls the whole drill-down graph, so a reason that
  does not open fails.
