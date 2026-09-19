# The Studio, Designed

What SLATE's studio side should be, decided rather than surveyed. Its companion is
`docs/research/REFERENCE-SURVEY.md`, which records how a mature commercial studio game
behaves; this document says what SLATE does about it.

Every section here makes a call. Where a mechanic is taken, it says why. Where it is
changed, it says what SLATE has that makes the change right. Where it is refused, it
says what would have been lost by taking it. Nothing is presented as a menu.

## The ground this is built on

The production system has been deleted twice and the second teardown was total. What
survives is not a half-built pipeline — it is **a world with no studio in it**:

- **The ledger and the money rules.** A balance is the sum of postings, the household
  and the company never spend the same money twice, and every figure has a provenance.
- **The estate and the lot** — stages, offices, land, and the family's relationship to
  all of it.
- **The family and the household** — a named person with a body, a life, a home, and
  people around them.
- **The sugar group**, quietly funding everything, with its own quota and payroll.
- **Company formation** — incorporation, registrations, guild signatures, insurance,
  VAT and tax, and the capability doors that gate what the company may do.
- **The gazetteer** — 252 countries, 3,865 regions, 170,911 cities, with climate.
- **Story engines** (`content/concept.ts`) — what a television premise *is*, and the
  four refusals that make it bite.
- **Genre mastery**, lifespans, names, ethnicity, interests, personality traits.
- **The calendar, the diary and the scheduler.**
- **The tooling** — the deciders registry and its sweeps, the tic budgets, the claims
  checker, the ledger invariants, the gate.

That last line is the important one. **SLATE's advantage is not its content, it is its
discipline.** The reference game has no equivalent of `sweepDirection`, no falsifiability
standard, and no tool that fails a build for a comment the code contradicts. Whatever
is built below is built under those.

## The premise, and why it is not the same game

The reference game hands the player one of the major studios on day one. SLATE's player
is **a person with a family who has to form a company at all**, and the studio sits
inside a life that continues whether or not the pictures work.

That difference decides several calls below. Where the reference game models a
corporation, SLATE models **a household that owns one**. So:

- The lot is a family estate, not a corporate campus.
- The player holds a credit on the work, not just a balance sheet.
- Failure is not a game-over screen; it is the family carrying the company, and the
  sugar group deciding how long it will keep doing that.

---

# Part 1 — The economic spine

## 1.1 The company's burn gets a clock of its own. This is the first thing to build.

**Decision: the company charges its own standing costs on its own monthly tick,
independent of whether the family owns a lot.**

An earlier draft of this section claimed SLATE's company had never had an operating
cost. **That was wrong, and reading the tree rather than the survey corrected it.**
`chargeThePosts` in `src/engine/world/lot.ts` already reads `monthlyCents` off every
filled role and bills it, with the employer's contribution on top — a post has cost
money since that function was written.

The real defect is subtler and worth stating precisely: **the company's payroll is
charged inside the *lot's* monthly tick**, and that handler returns early when there is
no lot. So a company without an estate staffs itself for nothing, and the nine
capability doors that open when a post is filled open for free.

That file already knows these are two different things. Its own comment, explaining why
the payroll is deliberately excluded from what the lot's month *returns*, says it
outright: *the people in the posts run the company; the rooms are the lot.* The
separation was understood and only the clock was shared.

**So the change is a move, not an invention.** The company gets `company.month`. It
charges the posts and a base administrative figure. The lot keeps charging its rooms,
and keeps the family's cover, because the cover is about carrying the estate.

**What it adds that did not exist:** a standing cost that does not depend on owning
land, so **time costs money from the day the company is formed**. That is what makes a
month of development a real expenditure and a slow writer genuinely more expensive than
a fast one.

**What it reads:** whoever is in post, and a base administrative figure. **A sum of
postings, never a constant** — which the ledger already enforces, and which
`chargeThePosts` already does by itemising every role separately rather than posting
one line saying "payroll."

**Falsifiability:** cut a post and the burn falls; form a company without a lot and it
still burns. Both measurable on a played career, and the second one is the regression
this change exists to fix.

## 1.2 A budget is a product, never a figure

**Decision: adopt the department engine wholesale.**

```
department total  = monthly rate (set by who is hired into it)
                  × months (set by what the material demands)

phase cost        = Σ of its departments' totals
phase duration    = MAX of its departments' month counts
production budget = Σ of the phases
```

Costs sum; durations take the maximum. Departments inside a phase run **in parallel**,
so one of them is always the critical path — and cutting a department that was never
binding saves money and no time at all.

Three properties follow without further rules: a longer schedule costs more by
construction, heavy demands load the phases that serve them, and a department a picture
does not need **disappears rather than sitting at zero**. That last one is what makes a
small picture feel small.

**Why this and not a budget field:** it satisfies the house rule exactly. A balance is
never a number somebody typed. The reference game passes the falsifiability test three
separate ways on this screen — hire better, demand more, move the start — and SLATE
should be able to say the same.

**What has to be built:** the periods machinery went with the teardown, so this is new
code rather than a generalisation. It needs a department table with rates, a demand
vector on the material, and a schedule that lays phases out as dated consecutive
windows.

## 1.3 Material states its own scale

**Decision: a property carries an approximate budget and a demand vector before anybody
buys it.**

Scale is a fact about the material, not a slider the player sets. An expensive property
is expensive **for a reason the player can read**, and producing under or over what the
material asks for should both have consequences.

This also gives the departments something to read, which is the missing input in §1.2.

## 1.4 Development is cash now; production is a commitment that falls due later

**Decision: charge development costs immediately and above-the-line at the greenlight.**

Optioning material and buying a script are cash out of pocket the moment they happen.
Cast and director salaries fall due when the picture is greenlit, against the production
budget.

That produces a cash-flow shape SLATE has never had: **you can develop several projects
cheaply and be ruined by greenlighting two of them.** The old `production.commit`
charged budget and fees together in one transaction and could not express it.

> Recorded as observed-but-unconfirmed in the survey (§23.4). Build it this way because
> it is the better model, not because it was proven.

---

# Part 2 — Commitment

## 2.1 Locks are a ratchet, not a row of doors

**Decision: locks acquire an order, a reversal price, and a foreclosure relation.**

The old system had three locks — shape, cast, opening — written by `shut()`, never
removed, permanent from the first commitment. The reasoning behind each was sound and
the implementation was the crudest expression of it.

The shape to build:

1. **A lock can be undone**, at a stated price, while nothing downstream depends on it.
2. **Certain locks foreclose named earlier reversals.** Contracting people forces the
   script and the budget to harden, because somebody signing is entitled to have those
   be real.
3. **The foreclosure is announced in advance, by name.** Not "this is permanent" but
   "these two specific doors close."

So reversibility decays as commitment accumulates, at a moment the player chooses.

## 2.2 Every lock is confirmed, and the confirmation is a briefing

**Decision: before any lock, show a prerequisite checklist, what freezes, and the named
reversal.**

The checklist asks rather than blocks — everything has a default, and the game is saying
*these are the things you might regret not considering*. That is a different and more
respectful thing than a required field.

SLATE's refusals were well written and arrived **after** the player tried something they
could not do. The lock that caused it had shut silently at some earlier moment. Turning
that inside out costs nothing: the strings already exist, only the moment is missing.

## 2.3 A project always says what it is waiting for

**Decision: every project carries a single next action, naming the department that
performs it, and the interface shows it everywhere the project appears.**

SLATE has notifications, a decision queue and a conditioned tutorial — far more
machinery than the reference game — and nothing that answers "what is this project
waiting for." This is the cheapest navigation aid available and it removes the need to
teach the pipeline at all.

---

# Part 3 — People

## 3.1 One pool, attribute vectors, temperament separate from capability

**Decision: a person has capability per discipline and temperament as a property of
themselves.**

- **Capability** belongs to the person-in-a-discipline. A writer is rated on story
  axes; a director on genre axes. The same human carries both.
- **Temperament** belongs to the person: keeps to budget, perfectionist, works to the
  script as written, authority, humility.

The old `Talent` record had a standing rung and a reach number — all about *how good*
and *how expensive*, nothing about *what they are like*. Two people at the same price
were interchangeable.

**Temperament is the cheapest way to make the pool feel populated**, because every trait
hooks into a system that already exists: keeping to budget reaches overruns,
perfectionism reaches the rewrite counter, working to the script reaches the story
attributes.

Keep the standing ladder. It prices people and moves on results. It should sit **beside**
an attribute vector, not instead of one.

## 3.2 The pool is finite, contested, and dated

**Decision: engagements occupy months; people are unavailable while engaged; rivals hold
people visibly.**

The old `Engagement` recorded who and on what terms and nothing about **when**. Nobody
was ever unavailable and two pictures could engage the same person with no conflict.

Adding a date range is the smallest change that turns a price list into a market. And
because engagement spans differ by role — a director runs longer than a performer — the
contention is role-shaped and emerges without its own system.

**Rivals draw from the same pool**, and when somebody is unavailable the player should
see **which studio has them and until when**. Contention that is invisible is just a
refusal.

## 3.3 A contract is a bundle of terms, only some of which are money

**Decision: contracts carry control rights alongside cash.**

Final cut. Billing position. Pay-or-play. A minimum budget the person will work above.

SLATE modelled only money — a fee, points, a threshold. A term that transfers
**authority** rather than money is a different axis, and it is what makes hiring a great
director a risk rather than an expense. Pay-or-play is what makes killing a project cost
different amounts depending on who is attached.

**Participation is a per-discipline norm, not a free choice.** Directors take points as
standard; writers rarely do. A writer who demands them is a signal about that writer.

## 3.4 The sequel escalator

**Decision: take it. It is the best mechanic in the survey.**

A contract carries a schedule of revenue thresholds, each with the terms that person
receives on a follow-up if the picture reaches it — **agreed at signing, before anyone
knows whether there will be a sequel.**

Three things it does at once: it prices the future at maximum uncertainty, it makes
**success create its own cost**, and it gives the franchise decision real stakes. SLATE's
lineage modelled the audience inheriting from a hit and never modelled the *talent*
inheriting from one.

It also generalises what SLATE half-had: `THRESHOLD_AT` was a single bonus trigger at
one multiple. This is the full form.

## 3.5 Roles are written characters, not ranked slots

**Decision: a role has a name, a type, an age, and demands. Casting is fit, not ranking.**

The old billing rungs were slots with falling weights, and the weight was the whole of
what a rung meant. A typed, written cast changes the problem: a villain is not the
third-most-important person, it is **a different job**.

This is why every other casting mechanic exists — an age band is a fit test, an audition
is fit measured for a specific part, ageing matters because fit decays. None of it can
exist over an ordinal list, because a rung has no properties to fit.

Keep the weights. Hang them off a character.

## 3.6 Three routes to fill a part

**Decision: build all three, because the trade is real.**

| Route | Attention | Time | Player chooses | Yields |
|---|---|---|---|---|
| Approach directly | **consumes the monthly allowance** | immediate | yes | nothing new |
| Open call | free | months, so overhead | yes, afterwards | **fit ratings** |
| Delegate to an agent | free | immediate | **no** | a filled cast |

The three axes worth having are **attention** (a cap on personal consideration),
**information** (an audition reveals fit for a specific part, and is the only thing in
the model that reduces uncertainty), and **delegation** (somebody else decides, faster
and worse).

The old shortlist was drawn on demand with no cap, no delay, nothing to learn and no
delegation — one route with no cost on any axis.

## 3.7 People age, and people die

**Decision: point the existing machinery at the talent pool.**

SLATE already ages its family and already kills people. `world/family.ts` and
`content/lifespan.ts` exist. Nobody ever pointed them at the people the studio hires.

A career then has an arc: too young for the part, right for it, too old, gone — possibly
mid-production, which is a crisis the studio has to survive.

## 3.8 Negotiation

**Decision: the listed salary is an asking price, and an agent will quote against it.**

SLATE modelled the agent as a *rate* — the gap between what the company pays and what
the person receives. That was a fair simplification of a fee. It was not a model of
somebody who **argues**.

Successive rounds, each with its own terms and its own risk of losing the person.

---

# Part 4 — Formats

## 4.1 Film and series are two pipelines, not one with parameters

**Decision: plans differ in shape, not only in ratios.**

The old six formats — feature, tv-movie, miniseries, anthology, serial, micro — all ran
the same pipeline with different `parts`, `secondsEach` and `legs`. That is a reasonable
compaction and it hides the real difference:

| | Film | Series |
|---|---|---|
| Gated on a purchased script | **yes** | **no** |
| Pre-production phase | yes | **no** |
| Production phase | yes | yes |
| Post-production phase | yes | **no** |
| Reaches an audience by | a chosen release type | its channel, not a choice |
| The unit | one artefact | **one numbered season of N episodes** |

A film is one artefact made in three sequential phases. A series is N episodes of fixed
length in a single phase, with writing continuous under a showrunner rather than bought
once.

**Total running time is derived** — episodes × minutes each — not entered. Season is a
first-class number, so a series is a repeatable unit and renewal produces the next one.

## 4.2 Format is several orthogonal axes

**Decision: separate what it is, how it reaches people, and how it is made.**

Animation versus live action is not a format — it is a production method that applies to
any format and changes every department's rate. Release type is the player's decision,
not a property of the format row.

Splitting the axes costs tidiness and buys a much larger and more honest decision space.

## 4.3 Franchise status is earned, then declared

**Decision: two states, with a threshold between them.**

A line begins when a picture *qualifies* — and the player then decides whether to declare
it. SLATE's lineage began the moment a follow-up was made, with nothing to earn and no
decision at the gate.

**A universe carries an internal timeline position**, so a picture sits at a point in
story time independent of release order. That makes prequels and interquels
representable, and lets inheritance read the *distance* between this picture and what
the audience already knows.

---

# Part 5 — The market

## 5.1 The audience is demographic, and the rating gates access to it

**Decision: build both halves together or neither.**

Material carries a primary and secondary audience as a sex and an age band. A project
carries a **parental guidance age chosen up front**, which caps every content dimension —
what is permitted, what is already there, and what the rating forbids outright.

Choosing the rating chooses the ceiling. A lower threshold greys out content; a higher
one opens it but narrows who may come. One decision, consequences pulling both ways.

A rating with no demographic model caps content for no reason; a demographic model with
no rating has nothing constraining it.

**Do not copy the dimension list wholesale.** The house rule applies — each one earns its
place only if something reads it. Three that reach the cast, the departments and the
audience are worth more than seven that tint a label.

## 5.2 A campaign has an angle, and the angle must match the picture

**Decision: replace the single campaign figure with an allocation and an angle.**

`campaignCents` was one number multiplying one link. More was always better, limited only
by cash — which is not a decision.

Two changes:

- **Diminishing returns per channel.** Spending twice as much on one channel does not
  reach twice as many people. This alone converts spending into an allocation problem and
  needs no new content, just a curve per channel.
- **An angle that reads the picture's own assets.** Selling on the cast, the director, the
  effects, the franchise, the occasion. An angle the picture cannot support is **weak
  rather than refused**, so the player can be wrong and find out why.

SLATE already has lineages, universes, cast reach and craft standing for an angle to read.

## 5.3 Supply is finite and churns

**Decision: material is a pool that expires and refills, and buying removes it.**

Taking a property removes it from the world. Material becomes unavailable month by month
and new material arrives. So a property you want is not waiting for you, and somebody else
took it.

`company.option` took a right with no pool for it to come out of. Combined with a
contested talent pool, this is a world of finite supply the player competes over rather
than a catalogue they shop from.

## 5.4 Rivals

**Decision: the middle path. Rivals hold a slate, cash and contracts; their pictures are
reckoned by a simplified model.**

The old rivals file said it plainly: they *"have no finances, no talent and no history"*,
deliberately a release habit producing one crowding number, because simulating them
properly would be *"a great deal of machinery to compute a shadow."*

That reasoning was right for what it was doing and wrong for what is wanted now. Rivals
should **contend** — for material, for people, for release weeks — and be visible doing
it. But running the full accumulator six times over is the machinery the old file warned
about.

So: real slates, real cash, real contracts, **simplified reckoning**. The player feels the
contention; the engine does not run six studios.

---

# Part 6 — The company and the estate

## 6.1 The company has a worth, and can borrow against it

**Decision: add a derived valuation and a single loan facility.**

SLATE's company has cash and no concept of what it is *worth*. A valuation reading the
library, the lot, the slate and the cash gives the studio a size independent of its bank
balance, and other systems can read it.

**One loan at a time.** You cannot stack debt out of trouble, so *when* you borrow matters
as much as whether — the first bad year is survivable, and borrowing through it means the
second one is not.

**The repayment joins the monthly burn**, so debt shortens how long the studio can afford
to develop anything. That ties directly to §1.1.

With overhead, a borrowing capacity and a failure floor, the financial picture is complete.

## 6.2 The estate houses people

**Decision: build bungalows, and let them be the answer to what the lot is for.**

The plan file's Phase D was about the lot losing its purpose once outside tenants were
removed. Housing talent on the estate gives it a second job that is **about people rather
than square footage**, and wires it into the talent market: somebody housed is somebody a
rival finds harder to take.

It fits SLATE better than it fits the reference, because SLATE's lot is a **family estate**.
Somebody living on your land is a different relationship from somebody under contract, and
that difference is SLATE's to exploit.

## 6.3 The player is on the work

**Decision: the player takes a producer credit, and can draw salary and participation.**

The player is a named person with a family, a body, a household and a personal ledger kept
strictly apart from the company's. What SLATE has never done is put that person **on the
work**.

A producer credit per picture, accumulating into a personal filmography separate from the
company's record, costs almost nothing and closes the gap between SLATE's two halves —
which currently touch only through money.

And the player should be able to **draw** from the company: a salary, and participation in
what it earns. The separation already exists; the drawing is the missing half.

## 6.4 Failure

**Decision: keep the family as the failure mechanism, not a game-over.**

The reference game has a bankruptcy warning threshold. SLATE has something better already
half-built: the sugar group, the family's patience, and a grace period. Failure should be
**the family deciding how long to keep carrying this**, which is a story rather than a
screen.

---

# What is refused, and what it would have cost

**Difficulty toggles that switch systems off.** The reference game lets a player disable
the award bias, the release-date bias and the genre bias. SLATE's own standard says a
thing that can be switched off with nothing else changing was decoration. Build them
load-bearing or not at all.

**A global box-office multiplier.** A blunt instrument over the whole model. SLATE has one
figure playing that role and it is derived, measured and documented — re-measured on twelve
played careers when the cast change falsified it. A flat multiplier is what that constant
exists *instead of*.

**Rivals simulated through the full pipeline.** See §5.4.

**The content catalog.** Their properties, their people, their tuning. SLATE needs a
catalogue that fits its own world — a family in a specific country with a specific estate
and a gazetteer behind it — and borrowed content would fit none of that.

**Starting as a major studio.** The whole premise is that you are not one yet.

---

# Build order

Each step is gate-green and committed before the next. Nothing is reported done because
it was written.

1. **The monthly burn.** Smallest change, largest effect, makes every later decision
   weigh something.
2. **Material with a demand vector**, and a pool that churns.
3. **The department engine and the schedule**, laid out as dated phases.
4. **The lock chain**, with order, price and foreclosure, plus confirmations.
5. **People**: attribute vectors, temperament, dated engagements, ageing.
6. **Contracts**: control terms, per-discipline norms, the sequel escalator.
7. **Roles as characters**, and the three casting routes.
8. **The two pipelines**, film and series, as differently-shaped plans.
9. **Rating and demographics**, together.
10. **Campaigns** with angles and saturation.
11. **Valuation, borrowing**, and the estate's bungalows.
12. **The player's credit and drawings.**

## What must be measured, not assumed

Every figure below is derived on a played career, never typed, and re-measured whenever
something upstream changes:

- the monthly burn against the length of a development
- department rates against the schedules they produce
- what a picture returns, across many seeds
- whether a losing year is reachable and how often

The rate constant in the deleted build carried a measurement that a later change
falsified, and the comment was still there saying otherwise. **Re-measure after anything
that changes what a picture draws**, and write the numbers into the constant's docstring
with the date and the method.
