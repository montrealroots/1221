# Awards and critics, as a costed specification

**This was a specification and it is now a build.** It was written as one
deliberately — awards are a feature rather than a fix, and the deliverable was what
it would cost and what it would buy, in numbers, so that whether to build it was a
decision somebody could actually take. That decision was taken and the answer was
yes, so the section below records what landed against what was proposed.

Everything marked MEASURED was run on the build it was written against. Everything
marked PROPOSED was the design; read it against the BUILT section for what the
implementation did differently and why.

---

## BUILT. What this document specified is in the tree.

All three pieces, in the order this document set out, and its central instruction
was followed: **piece three was not skipped.** Prestige came back with two readers
written in the same commit as its writers, because the warning here was that
"piece two on its own produces exactly the defect this document opens by
describing".

- **Piece one — conduct moves controversy.** Already built, with the seven dials.
  `whatTheWeekTook` raises it on a week worked below `spentAt` and `forgetsYou`
  decays it. Both readers this document named are live.
- **Piece two — a season, and nominations off work that exists.** `world/awards.ts`.
  Five named a year, one wins, judged on what is on the screen and the form, and
  **never on the budget** — money buys scale and a campaign and does not buy the
  opinion.
- **Piece three — the readers.** `remembersYou` takes prestige as a fourth term
  (`THOUGHT_WELL_OF`, smaller than `KNOWN_OF` because an office fills parts and
  fame sells tickets, larger than `REMEMBERED` because an award reaches offices
  that have never met you). The sale prices it through `CAST_MOVES.prestige`,
  one-sided where the others are two-sided, because prestige starts at nought for
  everybody.

**`askFor` was the third candidate and is deliberately refused.** This document
put the closest measured analogue — flooring the fee at the quote — at ×2.32 to
×3.56 of lifetime acting income. That is not a term, it is a different economy, and
adding it on the strength of an analogy would be the largest unmeasured change this
project has ever made. It stays available, unbuilt, with the number written down.

**The ceremony is still refused, as §5 asked.** No academies, no categories, no
juries, no red carpet. `content/awards.ts` is a hundred and twenty lines.

**And the build found a defect this document could not have predicted**, because it
is about the shape of the save rather than about awards. A season reading
`universe.projects` sees the family's own slate — and in a played career the player
acts almost entirely for other people, in productions that book the lot, which are
`Booking` rows with no cast records and no delivery. So the first version moved
prestige for the company's pictures and never once for the player's own work, and
`tools/dials.mjs` said so immediately: twenty-five played years, "one value, 0".

`theSeasonForPerformances` is the answer. A won audition already records `wants`
and `played`; `howFarOff` between them is the same figure the room itself was
decided on, read again a year later by people who have now seen it. So the season
names performances as well as pictures, and the dial moves in the career this game
is actually about.

---

## 1. What is already here, and it is stranger than "nothing"

The honest starting point is not an empty field. It is two fields that are each
half-connected, in opposite directions, and neither of them has ever moved in a
played save.

### `Reputation.prestige` — written by many, read by none

MEASURED, over twenty-five years run through `playABusiness`: of 146 people in
the save, **87 carry a non-zero prestige**, up to 28. `world/bootstrap.ts` gives
it out as `stage * stage * 30`, and `world/casting.ts` gives generated people
`clamp(standing * 0.3 - 6 + roll * 10, 0, 100)`.

And **nothing reads it.** Not one system, not one screen, not one decision. It
is the purest example on the page of a word with writers and no readers, which
is a shape The One Rule does not even have a name for — it is not decoration
sold as depth, it is bookkeeping nobody opens.

The player's own prestige is **0 after twenty-five played years**, on every
instrument. `tools/dials.mjs` has reported it as "one value, 0" since it was
built, and that is why it counts against the blessed floor of 8.

### `Reputation.controversy` — read by two live mechanisms, written by nobody

The mirror image, and the more interesting half.

Two things in this build already consume controversy, and both are real:

1. **It shuts a casting office.** `theOfficeFills` drops any candidate with
   `controversy >= TOO_HOT`, where `TOO_HOT = 55`, under a comment saying an
   office with no authority to go over the band also has no appetite for
   explaining a booking to anybody.
2. **It takes up to 38% off what a picture sells for.** `world/selling.ts`
   computes `cold = 1 - (controversy / 100) * CAST_MOVES.controversy`, with
   `CAST_MOVES.controversy = 0.38`, fed from `castsControversy(sim, project)` —
   the controversy of the people actually in it. `engine/decided.ts` registers
   it as its own axis of the sale decision, subtracted rather than blended,
   under a comment saying it is not a quality of the work.

MEASURED: across 146 people over twenty-five years, **controversy is 0 for every
person at every moment** — minimum 0, maximum 0, non-zero count 0. Every writer
in the build sets it to the literal `0`: `bootstrap.ts`, `casting.ts:470`,
`crew.ts`, `family.ts`.

So a 38% swing on the take of every picture the company ever sells, and a hard
gate on who a casting office will look at, are both **wired end to end and
unreachable by any input**. Not badly tuned. Not rarely triggered. Unreachable.

---

## 2. What that means for the cost of building this

It changes the shape of the job, and it is the reason this specification is
worth more than its page count.

**The expensive half of an awards system is already built.** The usual cost of a
feature like this is the downstream work: deciding what an award *does*, then
threading it through casting, pricing, offers and screens so that it does
something. Here, the downstream is done and waiting:

- a reputation axis the sale price already reads, weighted at 0.38;
- a reputation axis a casting office already refuses on, at 55;
- a decider already registered for the conduct axis, with its own sample and its
  own sweep coverage.

What is missing is only the **source**: the events that would move those two
numbers. That is a much smaller and much better-defined job than "build awards".

---

## 3. PROPOSED — the smallest thing that makes both fields real

Three pieces, in the order they should be built, each shippable alone.

### Piece one: conduct moves controversy

The cheapest, because it needs no new content at all and lights up two live
mechanisms on its first day.

Trouble already happens: `world/trouble.ts` runs a deck of things that go wrong
on a picture, and `somebodyGoesOff` already picks a person it happens to. Give
the ones that are a person's own doing a controversy cost, and give controversy
a decay, so it is a thing somebody recovers from rather than a countdown — the
same correction the ignored-asks ratchet already needed and got.

The moment that lands, both existing readers start deciding: a person over 55
stops being seen by offices, and a cast carrying controversy sells its picture
for less. **No new reader has to be written to make this bite**, which is the
test this project asks of every field.

### Piece two: a season, and nominations off work that exists

A yearly tick that looks at pictures delivered in the window and nominates. The
inputs all exist and none of them is new: `castsAppeal`, `castsReliability`,
the cast's `truth` and `reads` off `shownOf`, the plan, the negative, and the
window the picture sold into.

Prestige moves on a nomination and moves more on a win. Prestige **decays**, for
the same reason controversy must: a career is a thing you keep having, and a
number that only ever rises is the ratchet this project has now found four
times.

### Piece three: give prestige a reader, or delete it

This is the piece that decides whether any of it counts, and it must not be
skipped, because piece two on its own produces exactly the defect this document
opens by describing — more writers for a field nothing reads.

The honest candidates, in the order they cost least:

- **`remembersYou`** already closes a gap toward certainty using fame,
  reliability and rooms read. Prestige is a fourth term of the same kind and the
  function is built to take one.
- **`askFor`** opens at the higher of the band and the quote. A prestige floor
  is the third number in that maximum, and it is the mechanism by which an award
  is worth money rather than a sentence.
- **The sale.** `CAST_MOVES` already carries appeal and spark; prestige is the
  axis a buyer prices for a picture that will be talked about.

---

## 4. What it would be worth, and the honest limit on that estimate

**The controversy half can be costed now, because both its readers are live.**
At the sale, the lever is worth up to 38% of a picture's take, and the business
instrument measures pictures ending a career at between €129,000 and €197
million, so the lever is worth materially more than any other single decision
recorded on the page. At the office, 55 is a wall: above it, a career stops
being offered work by anybody who fills parts without asking.

**The prestige half cannot be costed until piece three is chosen**, and this
document should not pretend otherwise. What it is worth depends entirely on
which reader it is given, and those three options differ by orders of magnitude:
a term in `remembersYou` changes who calls; a floor in `askFor` changes what a
career earns, and the closest measured analogue for that — flooring the fee at
the quote — was measured at ×2.32 to ×3.56 of lifetime acting income.

So: **piece one is costed and cheap. Piece two is cheap and does nothing on its
own. Piece three is the decision, and it is the owner's.**

---

## 5. The thing to refuse

Do not build the festival circuit first. A named-ceremony content table — the
academies, the categories, the voting bodies — is the part that reads as an
awards feature and the part that decides nothing, and this build has already
paid for that mistake twice over in a hundred and five id namespaces and
199 lines of record shapes for a game it is not.

The ceremony is the last thing to build and the easiest. The number that moves
because of it is the whole of the work.
