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

The disease is already here, and it was found by measurement. The second column
is where each row stood when the ledger was written; the third is where it
stands now, and the only direction it is allowed to move:

| Declared | Read, at the start | Read now |
|---|---|---|
| 125 id namespaces | 17 | 20 |
| 54 trait modifier keys | 7 | 7 |
| 18 higher-is-worse guards | 12 | 12 |
| 7 reputation axes | 0 | 6 |
| 7 personality axes | 4 | 4 |
| 813 acting attributes | 0 | 19 |

The two rows that moved, moved for one reason: casting. Nineteen attributes are
read as three axes that go three different places. Nineteen of eight hundred
and thirteen is not a boast — it is a first reader on the largest unwired thing
in the build, and the other seven hundred and ninety-four are still a promise.

The reputation row said seven for a day, and that was wrong, so it is worth
saying how: `tools/wired.mjs` counts a dial as wired when something **moves**
it, and all seven are moved. The One Rule is stricter — it asks what **reads**
one to decide something. On the day it was corrected, three did.

Six do now, and each one goes somewhere different. `publicFame` decides whether
a name can go off, and whether a production that has never met you thinks of
you. `industryDemand` decides whether a part is beneath somebody.
`controversy` decides what a picture takes and who an office will touch.
`audienceAppeal` decides what a picture takes by a second route, and is the one
axis on this list a performer earns rather than arrives with — the only way to
get one is to have been in things people watched. `reliability` decides how far
a shoot runs past its wrap date, and falls on everybody who was on one that
did. `professionalReputation` is what a hire is worth.

**`prestige` is still read by nothing, on purpose.** Every honest reader for it
is a reader something else already has: put it on the sale and it is
`audienceAppeal` under another name; put it on who gets called and it is
`publicFame`. It is awards-and-critics standing and there are no awards and no
critics, so it stays a declared word until there are. Inventing the seventh
reader to finish the row would be the disease this page is about, performed on
the page about the disease.

Writing a number is not wiring it, and a tool that measures writers will say a
thing is finished before it is.

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
   that turned bad. *Today: the performing side is at zero.*
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
    cost apart from P&A, territory by territory, and what a performer sees of it.
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

**The lot's axis is finished and its answer is that the lot cannot be made to
pay.** How many people ring is earned now — off the crew in the country, off
what the rooms did over three years, and off what the lot spends being known —
and a player who sells it hard runs at 30/100 of a full month against a
break-even of 62. That is the ceiling, and it is not a tuning failure. Break
even needs the two big rooms let, only the handful of foreign features Iceland
gets in a year can fill them, and winning all of them is winning a dozen
projects. The research says the same thing about real lots: a stage business
at 65% occupancy yields three or four per cent on what it cost to build against
a required yield of six and a half, so the asset is worth less than the build
on the day it opens. Studio lots are justified by trading income, by the land,
and by an owner who wants the capacity — which is this family exactly, and is
the frame the game should put it in.

What is left on it is a decision rather than a defect: whether the player can
build a small stage. Four rooms and the smallest is bigger than four of the ten
enquiry shapes need, which is most of why it is empty.

**The lot has no small stage, and that is most of why it is empty.** Four rooms
and the smallest is bigger than four of the ten enquiry shapes need. The
ordinary Icelandic commercial and the ordinary Icelandic documentary — 40 of the
101 weight between them — are turned away because the only room that will hold
them costs well over half of everything they were going to spend in the country.
Nobody designed that; it fell out of pricing the whole hold against the budget.
It is also the research's own warning about phase one, arriving from the other
direction, and the obvious lever for a player: build a small one.

The order mattered and was nearly got wrong. Making demand respond to the world
first would have produced a better-looking lot and an equally inert one, because
`familyCovers` topped the company's cash to zero every month with no cap and no
failure state: the marginal cost of every lever was zero, so the best play was
whatever you liked, decided in month one and never revisited. A perfect demand
model on top of an infinite backstop is still a fixed outcome, only flattering.
So the downside came first.

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

Rank 1 was already built as a feature, so the test was run in reverse: the
unscripted season was written as build two and required to add no new engine
concepts. **It needed four.** That list is the answer, and two of them are now
fixed.

| What the season needed | State |
| --- | --- |
| Periods that run alongside each other, not only after | **Fixed.** `Period.runsWith` |
| A clock anchored at the delivery date, not the start | **Fixed.** `Plan.anchor` |
| "Done" as the minimum of a maturity vector, not one stage | **Fixed.** `Project.maturity` |
| A season as N timelines at different maturities | **Fixed.** `Project.parts` |

The first two were the scheduler being a live-action scheduler wearing a
general name. `layOut` set every period's start to the previous period's end,
which cannot express post beginning on field day one and running months past
wrap — which is simply what an unscripted season is. And `deliverBy` was
derived forward, so a longer shoot delivered later; a broadcast season has its
transmission date agreed against a format document before anybody knows what
the content is, and the work is fitted backward into the room in front of it.
Those are opposite clocks and the engine only had one.

The third is fixed too, and it was the one the season could not fake. A picture
carries six dimensions now — picture, sound, performance, rights, compliance,
conform — each on a ladder the plan names, and `doneShare` takes the **minimum**
across them. Not the average, which would call a finished uncleared episode five
sixths done. A season that is locked, mixed, complete, compliant and accepted
reads 0/100 the moment one contributor withdraws consent, and that is the honest
number: it is worth nothing until somebody signs.

The ladders are data and they differ by form. A picture's cut goes shot,
assembled, cut, locked, graded. A season's goes stringout, paper cut, assembly,
producer's cut, executive's cut, broadcaster's cut, locked — longer, because on
that form the notes are the work and every rung is a person who can send it back
down.

It also surfaced something the single `stage` field had been hiding: no period in
the feature plan advances compliance at all. That is not an oversight. On a
picture the legal work *is* the delivery list — filing the chain of title is what
clears the rights, and the errors and omissions certificate is what gets it
through review — where on a season compliance is a live period running alongside
the cut. Both are now expressible, and `nobodysJob` will name any dimension a
plan never moves.

The fourth is fixed, and with it the progress model. A title owes **parts** —
one for a feature, eight for a season — each with its own maturity vector and
its own runtime in seconds. Progress is runtime-weighted across them and then
minimised across dimensions, so the measure is screen time rather than episode
count: a forty-minute episode that is locked is worth more of a season than a
twenty-minute one, and counting episodes would call them equal.

Seconds of finished screen time is now the engine's native measure, which is
what the research asked for. A producer sets what a picture runs to, and an hour
and nineteen minutes is an ordinary answer rather than a special case.

Parts finish in order where the plan says so. A season's cut advances episode
one weeks before episode eight, and in between the season genuinely sits at
three different rungs at once — which is the difference between eight timelines
and one timeline drawn eight times.

Two real bugs fell out of building it, both from periods being able to run
alongside each other:

- **`finishesBy` returned the last declared period's end, not the latest.** An
  unscripted season declares compliance last and it ends four weeks before the
  cut does, so the work was being called finished four weeks early. Reading the
  last element was right while everything was sequential and became a silent lie
  the moment anything was not.
- **A period could settle twice** — once at the boundary of the period declared
  after it, once at the tick ending the work — and settling posts an expense.
  A season spent ninety-six per cent over its budget before the guard. Pinned
  now by counting postings per period rather than by checking a total, because
  a total only catches it loosely: a season legitimately runs a little over when
  its field slips.

### What is left

Nothing from the port test. The spine now expresses a format-led unscripted
season with no engine concept it did not already need, which is what build two
was for. The research's own acceptance test for build one reads:

> the engine must produce a four-figure shooting ratio, an editor-week
> bottleneck, a legal recut at week 19 and a make-air scramble, with the strings
> "ratio", "editor", "episode" and "compliance" appearing only in data files.

Three of the four are met, and met the way the sentence intends — as output
rather than as content.

**The shooting ratio.** Derived, never set. Every plan says how many hours of
material a week of acquisition banks and how long acquisition runs; the ratio
is that against the runtime owed, divided at the moment somebody asks. The
same two lines of arithmetic give 15:1 for a feature, 10:1 for a drama series
and 1,880:1 for a fixed-rig season, and the test that holds them checks the
answers against published figures rather than against anything in the engine.
Shoot the same runtime for twice as long and the number doubles, because that
is what the number means.

**The editor-week bottleneck.** The cutting room converts material into screen
time at a published rate times the hands it has, and the parts come out of it
as its output covers their runtime. Not a timetable with a rate printed beside
it: put one editor on a season the plan staffed with two and the episodes
genuinely arrive half as fast, and some of them do not arrive at all.

**The make-air scramble.** A consequence, not an event. A season whose room
cannot finish in the calendar in front of it is told so in the week the
material overtakes the room, and it is told again if hiring gets it back. At
the staffing each plan assumes, no plan warns; nothing has been tuned to make
the warning fire.

**The legal recut.** Somebody watches the finished work, every week, one part
at a time, and what they find comes off a deck of seven rows the research
names: a compliance note, a note from the people paying, coverage debt, a
rejected master, a withdrawn consent, a gap in the chain, a moment nobody
caught. What a finding costs is written nowhere. It is how many rungs the part
actually fell times everything that was standing on the rung it fell from, so
the same withdrawn consent is free in week two and ruinous in week nineteen —
which is the property the maturity vector was built to have and had never had,
because nothing ever sent a dimension down.

The week nineteen of the research's own sentence now exists, and it exists by
arithmetic rather than by being put there. The weekly tick used to stop when the
cutting room closed; it runs to the delivery date, so the weeks between the work
finishing and the thing going over have something running in them. That gap is
where a lawyer lives.

And the cost lands in the second ledger. A part sent back down owes the cutting
room a share of itself again — the share of the ladder it lost — and the room
pays that down before it cuts anything new, at its own rate with the hands it
has. One editor on a season the plan staffed with three delivers it more than
twenty weeks past air; three delivers it inside a fortnight. Nothing about what
gets found changes between those two runs. Only the room changes.

All four parts of it are met.

As for the strings: the engine carries no form-specific branch at all. No
module under `world/` names a plan id, and what makes a season a season is
entirely in `content/`. The deck is the newest test of that and the sharpest.
Whether a withdrawn consent can happen to a production is not a question about
which plan it is — it is whether some period of that plan carries rights all the
way to cleared while the work is going on. A picture options its material in
prep and files a chain of title, so there is no live consent in it for anybody
to take back; a season's consent is a standing relationship with people who are
still in the room. Same predicate, read off the periods. And how far a note from
above sends a cut back is how many rungs that form stacks above its cutting
room, which is four on a season and two on a picture, read off the ladder. The acceptance test's own phrasing is looser than the
thing it is testing for — `ratioOf` is a function and `unscripted-editor` is a
row in a rate table — so the test held here is the stronger one: that no
mechanism anywhere asks what kind of thing it is working on.



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
billing × exclusivity. This is where TEW's contracts axis and the performer's deal
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

**Both sides of a comparison have to come from the same mechanism.** The first
cutting-room forecast measured work remaining off the rungs the parts sat on,
while the parts were moved up by a timetable that never read the cutting room's
rate. Two mechanisms, calibrated near each other, interfering: the shortfall
sawtoothed across zero every few weeks and every production in the game warned
that it would miss its date by exactly one week. The warning was not wrong
about the arithmetic. It was reporting the gap between two clocks. Staffing
only became a decision when the room's own output became the thing that moved
the parts *and* the thing the forecast was made from.

**A recurring tick laid out in bulk at greenlight goes stale the first time
anything slips.** Twenty weekly items scheduled up front, a two-day overrun,
and the last one now fires two days before the period it was meant to close —
leaving the final episode cut and never released, for the sake of two days. One
item at a time, each deciding when the next is due from the schedule as it
stands today, and the slip takes care of itself.

**A mechanism with no cause is worse than no mechanism.** `knockBack` sat in
the engine for a whole build: written, tested, exported, and called by nothing
except a test that drove it by hand. Every screen that printed a maturity vector
was printing six ladders nobody could fall off. The One Rule is usually read as
being about a field with no reader, but this is the same fault one level up —
a verb with no subject — and it is harder to see, because the tests pass and the
code looks finished.

**Going down needs a way back up, and it has to be the same way it went up.**
A knock-back with no route out is a dead end wearing a setback's clothes, and
the first draft had three: a rejected master struck a delivery element that
`handOver` refuses to file because it comes out of the work; a season's rights
and compliance were moved only by one-shot ticks scheduled at greenlight and
consumed; and the weekly tick stopped the moment the work was done, so a knock
on the final week froze the production for the rest of the save. All three were
fixed by widening what already existed rather than by adding a second
mechanism — the same weekly tick, re-running the same periods, gated on the same
cutting room. Two things moving the same parts is the bug this file already
warns about.

**One write in the whole interface skipped the engine, and the test that
caught it was about something else.** Setting the clock speed assigned straight
into `sim.universe.preferences` from a React component, and pausing when the
world stops at you did the same — while `world.set_preferences` sat registered
and called by nothing. It surfaced from a rule about reachability: every command
the engine registers has to be run by something in the interface, and that one
came back as unreachable when it was really being bypassed. The two readings
look identical from the command's end. Both are now the same fix.

**A fixture that stops short takes the rules with it.** The looks suite crawls
a world that options and develops and then stops, so half the project page — the
schedule, the crew, both ledgers, what can come apart — was never once drawn by
a test. Two house rules were being broken in that half and passing. Rule six
says one grid of facts is a look and two is a record: the page had two the
moment anybody said yes to something and three a year later. And the wellbeing
sentence falls through to "Holding up.", which is two words against a rule that
wants a sentence, and it only fires in the middle band a fresh save is never in.
Neither is an edge case; both are what a player sees. A fixture is a claim about
which states are worth checking, and stopping it one command short of the
interesting half is how a suite of seventeen rules enforces them on a page
nobody is looking at.

**A command nothing calls has never really been tested.** `company.greenlight`
has been correct for eight commits and accepted two things that make a picture
impossible, because the only caller was a test suite that passed sensible
arguments. Give it an airdate ten weeks out and it lays the casting, the rig and
the field into weeks that have already happened — twenty-seven ticks scheduled
in the past and never fired — and the picture cannot then be finished,
delivered, sold, greenlit again or shelved, because `Project.shelvedAt` is
declared and written nowhere. One date, and the save carries it forever. The
moment a person can type into a field is the moment every unchecked argument
becomes reachable, so the refusals have to exist before the form does.

**A lever that is always wrong is as inert as a constant.** The first draft of
the selling line bought more calls and lost money at every level: the extra
attention arrived from abroad, and most of what arrives from abroad fails the
rebate's own tier test, so the money bought refusals. It was truthful and it was
a trap — a player learns once never to touch it and the term is a constant
again. What fixed it was not a bigger multiplier but the corpus's own point:
what a desk in Los Angeles buys is not more calls from RÚV. Money moves the
*mix* and not only the count, and the same spend that used to lose twelve
million across a decade now saves five. The waste is still there and is on the
screen, because a lever whose cost is hidden is the same trap facing the other
way.

**A rate card nothing reads is a price list, not a price.** `wouldBook` computed
what the room cost on its third line and then never mentioned it again: the
decision was size, then availability, then the rebate, so every stage on the lot
could have been priced at anything and exactly the same productions would have
booked. Two thirds of `RATE_SHARE` had the same problem — prep and hold rates,
declared, commented, and never asked for, because all three call sites passed
`'shooting'`. A number that is never compared against anything is decoration
however carefully it was derived.

**A correct figure nobody acts on is the same fault as a wrong one.**
`paidInAsShareOfAYear` was written, commented, tested, and read by no screen and
no engine code. Its own comment said that reading the family's money against
what the sugar cleared this year rather than against a flat number "is the only
way the quota is ever felt on this side of the family" — and that was true, and
the quota was still never felt, because the function had no callers. A number
that is right and inert is harder to spot than one that is wrong, because
everything about it looks finished.

**A test that checks the announcement is not testing the mechanism.** The first
draft of the family's patience passed with the mechanism deliberately removed:
the test read a notification, and the notification was emitted from the tick on
the same condition rather than from the code that actually withheld the money.
Two of three tests in that commit had the same shape, and one of them recomputed
the engine's own arithmetic inside the test and checked it against itself.
Reintroduce the fault, watch it go red, and only then believe the test — most of
all when the fault is subtle enough that you wrote the test to catch it.

**Exports nothing reads, in a module written an hour ago.** Five of them, in
the first draft of the inventory ledger: a sentence for a screen, a ledger
listing, a pressure figure, two label helpers. Writing the module is not the
same as wiring it, and a fresh file gets no exemption from the One Rule — the
grep for readers is part of finishing, not part of tidying up later.

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
