# What Does Not Bite

A standing list of everything in SLATE that is declared, written, displayed or
believed, and that changes no outcome. It is kept separate from `DEPTH.md`
because that page argues for the standard and this page is the arrears against
it.

The test, which is the project's own: change an input — does the outcome change,
or only the sentence? A thing that fails it is on this page until it passes or
until it is deleted. Both are acceptable endings. Only leaving it alone is not.

Two kinds of failure, and they want different fixes, so they are never mixed:

- **Dead.** Move it across its whole range and nothing observable moves. Either
  wire it or delete it.
- **Unreachable.** The code is correct and general, and nothing in the build can
  reach the input that would exercise it. The fix is usually elsewhere: build
  the thing that would reach it, or assert the contract directly on the function
  and say plainly that no play can get there.

The revamp emptied most of this page. The character sheet, the film career,
the family business and the family were where nearly every entry lived, and
they are gone rather than wired. What follows is what the cut left behind.

---

## The count, as the ratchet has it

From `tools/wired.mjs`, held against `docs/UNWIRED.json`. These may fall. They
may not rise.

| Declared | Nothing reads | Of |
|---|---|---|
| Id namespaces | 1 | 7 |
| Save tables nothing fills | 1 | 9 |
| Personality knobs nothing reads | 0 | 6 |
| Personality axes nothing consults | 4 | 7 |

The first two are the player. The family was the only thing that made a person after
boot, so `person` has no `nextId` call and `people` is filled only by
bootstrap, which writes the player by hand. They are counted honestly and they
are not dead words; the tool says so beside the check. The four axes are
openness, extraversion, agreeableness and risk tolerance, set on the
Dispositions & Traits step and read by nothing; the step says so, and they
are below.

The tool counts writers. The One Rule asks for readers, which is stricter, so
the true arrears are larger than this table and the rest of this page is the
part the tool cannot see.

---

## Dead: declared, and nothing reads it

- **The wellbeing model decides nothing outside the body and the workout.**
  Every dial now decides something (`tests/wellbeing-bites.test.ts`): fitness
  sets how far rest mends condition and what a workout costs; condition sets
  how much a night puts back, where morale settles, and readiness; morale sets
  how much stress a night clears; hygiene under fifty and hunger under twenty
  wear on the mood; and readiness sets what a workout builds. Eating, a
  shower, a workout and an hour unwinding (`life.look_after`) are how a player
  moves them. But all of that is the body deciding things about the body.
  Readiness had one reader outside it, in the audition room, and the room is
  gone: nothing a character does in the world yet goes better or worse for
  how they are.
- **Until those readers, fitness and morale couldn't be moved.** Fitness
  moved condition only on a body the nights were wearing down: a rested
  night pushed condition to the age's ceiling far faster than fitness's
  drift, so on six- or eight-hour nights eight weeks of workouts left it at
  99.8, trained or not. And morale reached a hundred on any life with decent
  nights and stayed there. Rest mends only as far as fitness lets it now, and
  the nights bring morale back toward where the body has it settle, so on a
  half year of eight-hour nights a player who eats, showers, trains and
  unwinds ends at condition 99.7 and morale 100 against 91 and 85.9 for one who
  only sleeps.
- **Four of the seven dispositions are kept and read by nothing.** Openness
  waits on travel, and extraversion, agreeableness and risk tolerance on other
  people. The Dispositions & Traits step says so beside the sliders, and
  `tools/wired.mjs` counts them.
- **The money traits are said back and nothing more.** Frugal, Spender,
  Generous and Keeps Accounts declare no knob, because nothing in the game
  spends.
- **Most of what a trait's cost says is said back, not charged.** Each is
  written for a whole life, and the game charges only the part its knobs
  reach: stress, sleep, the energy a night puts back, hygiene and mood. Early
  Riser's "No use at all after nine at night", every cost about other people,
  and Resilient's illness and injury are not charged, and Early Riser and a
  few others help and cost nothing in play. The Traits card says so.
- **The tax engine is a screen.** Real, correct, and read by one thing: the
  place card, which works out what a reference wage would be taxed at and prints
  it. Nothing taxes a wage.
- **The gazetteer still carries the film calibration.** Every hand-calibrated
  city has an `industryPresence` figure, and the place card and Home print it
  as Film and Television work. Nothing else reads it. It is reference data, so
  it stayed through the revamp; the revamp decides whether it keeps a reader or
  goes.
- **The crafts and the genres are said back and nothing more.** Creation asks
  for them and the person look prints them, which is what keeps them from being
  a question with no answer. Nothing in the simulation reads either, and
  `tests/cohesion.test.ts` holds that nothing starts to without saying so. The
  general interests are read since 2026-09-24, by `systems/enjoyment.ts`
  alone: Cooking, Fitness, Sport and the evening pastimes lift the mood and
  ease the stress of the hour they go with, and never make anybody better at
  anything. The rest of the general interests (Animals, Cars, Fashion, Nature,
  Politics, Travel) go with nothing a player can do yet.
- **The performer title is said back and nothing more.** Actor or actress,
  settled by the pronouns or picked under they/them, and printed on Home, the
  rail and the save slot. It is a word and not a stat, so that is all it
  claims to do, but nothing in the simulation reads it either.
- **Citizenship is kept and never read.** The save writes the country of the
  birthplace onto the player, and nothing reads it back: creation says it from
  the birthplace, not from the save, and no screen in the game shows it.
- **`search()` in `content/reference.ts`** is a ranked search over every city
  with no caller. The note on it says it stays only while a way in might be
  built, and this page carries it until one is or it goes.
- **`SlateOfficialResult`** and the `recordOfficialResult` function that writes
  it: nothing in the build produces an official result.
- **Five record shapes in `domain/model.ts` with no table** — `Costume`,
  `Order`, `Training`, `Mark` and `Running` — left by earlier cut-downs, with no
  importer and no writer.
- **`HistoryCategory`** still names categories for systems long gone: career,
  property, vehicle, relationship, family, travel, social, project, company,
  award, education and health.

## Unreachable: correct, and nothing can get there

- **The Decision Center has nothing to decide.** Answering, dismissing, closing
  on a date and forgetting are all built and held by `tests/smoke.test.ts`, which
  raises a row by hand. The one thing that raised a row on its own was the
  reimbursement on the family's pictures, and it went with them.

---

## How to work this page

Take a section, not an item. A section is a coherent piece of work: the
wellbeing model is one system and one question — what should a day of being
tired or well change? — and the reference data is a question about what the
revamp means the game to be about.

And every fix on this page has to be shown to bite, by the standard the page is
written against: move the input, watch the outcome move, and prove the test
would have caught its absence.
