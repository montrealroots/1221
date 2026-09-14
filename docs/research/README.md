# The Research

Four questions were asked exhaustively, by a fleet of agents told to verify
everything they could against published sources and to mark as an estimate
anything they could not. What came back is here, whole, in the words it came
back in.

| Document | What it answers | Size |
| --- | --- | --- |
| [STAGE.md](STAGE.md) | Everything a state-of-the-art sound stage needs | 11 domains, 891 items |
| [LOT.md](LOT.md) | Everything a state-of-the-art studio lot needs | 12 domains, 681 items |
| [PIPELINE.md](PIPELINE.md) | Every process in making a picture | 19 domains, 1,178 processes, 516 option spaces, plus the engines synthesis |
| [KINDS.md](KINDS.md) | How that process differs by what you are making | 12 kinds, plus the spine synthesis |

## Nothing is missing

Both fleets ran to completion on 2026-09-14: twenty of twenty pipeline agents
and thirteen of thirteen kind agents, no errors. They had been killed twice by
usage limits before that, and were resumed with their original run ids, which
replays every finished agent from cache and re-runs only the dead ones.

Both syntheses came back, and they are the part worth reading first. `The
Engines Behind It` at the foot of PIPELINE.md answers the cross-cutting
questions directly — what IMAX actually names, what a genre engine is, what a
costume is as an object. `The Spine` at the foot of KINDS.md answers the
architectural one: what is invariant across all twelve kinds, what axes they
vary along, how one engine holds "how far along is this", and which kind to
build first.

### On the crew domain

Domain 8 was hand-written once, by a session that could not run the fleet, and
has been replaced by the fleet's own — fifty-eight processes against fourteen,
covering everything the hand-written one did with one exception. The exception
is carried across verbatim at the foot of the domain and marked as carried: the
IATSE Low Budget tier ceilings, which are published figures the fleet did not
reproduce.

What `src/engine/content/crew.ts` actually reads — the IATSE local numbers, the
Teamsters split, the staggered start weeks — the fleet's version has, and its
bands agree with the shipped code.

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

`../DEPTH.md` sets the order. The spine synthesis contradicts it on the single
most consequential point, and that contradiction is the most valuable thing
either fleet returned.

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

**Rank 1 is done, and was built in the wrong order.** A picture has a dated
life: periods laid onto real dates from the length of the shoot, a stage held
off the lot's own booking board, the budget spent across the periods, an
overrun read off the schedule rather than rolled, and a delivery list that
holds the money until it is complete. All of that works.

But it is a live-action feature, and the spine synthesis is emphatic that the
live-action feature is the wrong thing to build first:

> Build live action first and every spine primitive gets satisfied by a
> live-action-shaped special case — the day, the page, the strip — and you find
> out the spine was fake at form four, with nine forms of content already
> authored on top of it.

Its recommendation is one season of a format-led unscripted series against a
fixed transmission date, because it breaks every assumption a live-action-shaped
engine bakes in, all at once: no script, so no page count or stripboard can be
hardcoded; no takes, so coverage cannot be assumed; no boundary between
production and post, so the scheduler cannot be prep-shoot-post; no director's
cut, so approval must be a configurable chain. Then the live-action feature is
built second **as a pure port that adds zero engine concepts** — and if that
port needs a new subsystem, the spine was wrong and it cost two builds to find
out instead of nine.

SLATE is at the end of build one having built the thing the research says to
build second. That is not fatal and it is not a reason to throw anything away —
`Period.unit` and periods-as-data already avoid the worst of the trap. But the
honest next move is to run the port test in reverse: take the unscripted season
as build two and require it to add no new engine concepts. Whatever it needs
that `making.ts` cannot express is the list of places the spine is currently
live-action-shaped.

Three things the spine names that SLATE does not have at all, in the order they
will hurt:

- **Progress is derived, never stored, and it is runtime-weighted.** The native
  measure is seconds of target runtime; pages, shots, days and cuts are display
  conversions into it. SLATE has no runtime on a picture at all.
- **"Done" is the minimum across a maturity vector**, not a stage. Picture,
  sound, performance, rights, compliance and conform each advance separately,
  and a scene that is beautifully cut and legally uncleared is zero per cent
  done. SLATE has a single `stage` field.
- **The task graph is not acyclic.** Downstream discovery routinely creates
  upstream work. Any scheduler that assumes forward flow can express live-action
  prep and nothing else.

**The missing rank is the option space.** PIPELINE.md contains 516 of them —
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
