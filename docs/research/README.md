# The Research

Four questions were asked exhaustively, by a fleet of agents told to verify
everything they could against published sources and to mark as an estimate
anything they could not. What came back is here, whole, in the words it came
back in.

| Document | What it answers | Size |
| --- | --- | --- |
| [STAGE.md](STAGE.md) | Everything a state-of-the-art sound stage needs | 11 domains, 891 items |
| [LOT.md](LOT.md) | Everything a state-of-the-art studio lot needs | 12 domains, 681 items |
| [PIPELINE.md](PIPELINE.md) | Every process in making a picture | 8 domains, 439 processes, 177 option spaces |
| [KINDS.md](KINDS.md) | How that process differs by what you are making | 8 kinds |

## What is missing, and why

The pipeline and the kinds are incomplete. A weekly usage limit killed thirteen
of the twenty process agents and four of the twelve kind agents mid-run, along
with all four synthesis agents. What is here is what returned.

Missing from **PIPELINE.md**: production design, costume, locations, camera,
lighting, sound on set, the shoot day itself, effects, post picture, post sound,
and marketing. That is most of production and all of post — the map covers
development, the screenplay, genre and format, characters, breakdown, budgeting
and casting, then crew and departments, and then stops at the point the cameras
are meant to turn over.

Missing from **KINDS.md**: the VFX-led tentpole, the micro-budget feature, the
returning series, and short form.

**Domain 8, crew and departments, was added later and by a different method.**
The agent fleet could not be resumed: the cached re-run promised below was a
facility of the session that ran it, and a later session on a different account
did not have it. So domain 8 was written by hand against named published
sources, and it is deliberately narrower than the seven before it — fourteen
processes against their sixty. It was chosen because rank 2 of the build order
("people, generated because a title needed them") cannot be built without
knowing what posts exist, who hires them, when they start and under whose
agreement. Its sources:

- The **DGA Basic Agreement** summary on `dga.org`, for the producer's duty to
  consult the director on the UPM and the director's right to select the 1st AD.
- **Wrapbook's** guide to the IATSE Low Budget Theatrical Agreement, for the
  five tiers, their ceilings, what counts as production cost, the Ultra Low
  Budget minimum of fifteen shooting days, and the retroactive repricing that
  follows exceeding a ceiling by more than ten per cent.
- The **list of IATSE locals** on Wikipedia, for craft jurisdictions quoted in
  the locals' own wording.
- **Hollywood Teamsters Local 399** (`ht399.org`), for the crafts that are
  Teamsters rather than IATSE — transportation, locations, casting, animal
  handling — and the membership figure.
- **AFCI University's** sample pre-production schedule for a studio feature, for
  the week-by-week staggered start dates.
- **Celtx** and **Assemble**, for crew-size bands by production scale and the
  department hierarchy chart.

Figures from these are as published; nothing in domain 8 is an estimate dressed
as a source, and where a number is a band rather than a figure it says so.

The remaining agents can in principle be re-run where that tooling exists.
Nothing already captured needs re-running.

## What is not missing

The two documents about the physical plant are effectively complete, and they
are the two that had already been quietly wrong in the build. Checking SLATE's
invented numbers against them found three faults in a day:

- **The stage rate card was about double market.** Break-even occupancy is
  overhead divided by what a full lot earns, so an inflated card made the whole
  bet look half as hard as it is. It read 33%. It reads 62%.
- **The refusal in `wouldBook` was unreachable.** The Icelandic rebate was set
  against a guessed import penalty that both rebate tiers beat, so every
  enquiry that found a free room booked and the branch modelling a production
  choosing Budapest could never fire.
- **Every enquiry modelled was foreign**, when four in five projects claiming
  the Icelandic rebate are domestic.

The physical specifications themselves survived contact: the structural
research engineers Askja at exactly the size the game claims — 100 × 60 m,
30 m to the underside of the perms, 60 m clear-span trusses at 10 m centres —
and treats it as buildable, base-isolated, on Mosfellsdalur ground.

## What this changes about the build order

`../DEPTH.md` sets the order and it mostly holds. Two things in it are now
wrong, and one thing is missing.

**Rank 4 is wrong.** It reads "the shoot day and the take. The atom." There is
no single atom. The unit of work is the axis production varies along most, and
assuming one of them forecloses the rest:

| Making | The atom | Progress is counted in |
| --- | --- | --- |
| Live-action feature | The shoot day | Days against a schedule, pages against a day |
| CG animation | The shot | Approved seconds; 3–5 a week per feature animator |
| Documentary | The field day | Beats banked, then cut minutes |
| Unscripted | The contributor-day | Beats banked against story areas |
| Multi-camera sitcom | The show | One a week, posted in four days |
| Commercials | The board | Shots against a one-day board |

So rank 4 becomes **the unit of work, declared by the plan**, not the shoot day.
`content/making.ts` already carries `Period.unit` — what a week of that period
produces and how many of them a week holds — and that field exists precisely so
this stays open. Nothing downstream should ever name a shooting day directly.

**Rank 1 is done.** A picture has a dated life: periods laid onto real dates
from the length of the shoot, a stage held off the lot's own booking board, the
budget spent across the periods, an overrun read off the schedule rather than
rolled, and a delivery list that holds the money until it is complete.

**The missing rank is the option space.** PIPELINE.md contains 171 of them —
every origin a piece of material can have, every rights vehicle, every buyer
type, every genre, every rating. They are the answer to wanting every option at
hand, and they are also the single easiest way to build something that looks
deep and is not. A list of twenty-four origins where the choice changes a label
is worse than four that change what happens next.

So the rule, and it is the One Rule from `../DEPTH.md` applied to content:

> An option earns its place when something reads it. Not when it is plausible,
> not when it is real, and not when the list looks incomplete without it.

The research supports this rather than fighting it, because every process in
PIPELINE.md carries a `decides` line and an `engine` line. The `decides` line is
the option space. The `engine` line is what has to read it. An option with no
engine line behind it is a label, and `tools/wired.mjs` already fails the gate
on declared vocabulary nothing reads.

## How to read the specifications

Items are tiered. **Essential** is the thing not working without it. **Expected**
is what a professional operator has. **State of the art** is what puts a
facility ahead of the ones it competes with.

Two things are worth knowing before treating any figure as fact. The agents were
told to name their source or mark an estimate, and they largely did, but the
marking is theirs and has not been audited line by line — a figure that matters
should be checked before it is built on, the way the rate card was. And every
British spelling in these four files is deliberate: they quote operators,
standards and surveys that spell it their own way, and `tools/spelling.mjs`
skips this directory for that reason. The house style governs what the game
says, not what a source said. Domain 8 of PIPELINE.md is the one stretch of
prose here that is not quoted from anywhere, and it keeps the same British
register as the rest of the document it sits in rather than switching halfway
through; the exemption covers it as a directory either way.
