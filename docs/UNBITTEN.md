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

Both are the player. The family was the only thing that made a person after
boot, so `person` has no `nextId` call and `people` is filled only by
bootstrap, which writes the player by hand. They are counted honestly and they
are not dead words; the tool says so beside the check.

The tool counts writers. The One Rule asks for readers, which is stricter, so
the true arrears are larger than this table and the rest of this page is the
part the tool cannot see.

---

## Dead: declared, and nothing reads it

- **The wellbeing model decides nothing outside itself.** Eight dials move
  every hour and every night, stress sets how well the nights go and the nights
  set the energy, and all of it comes out as readiness on Home. Readiness had
  one reader, in the audition room, and the room is gone. So the dials feed each
  other and a figure on a screen, and no outcome anywhere turns on them.
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
  `tests/cohesion.test.ts` holds that nothing starts to without saying so.
- **The performer title is said back and nothing more.** Actor or actress,
  settled by the pronouns or picked under they/them, and printed on Home, the
  rail and the save slot. It is a word and not a stat, so that is all it
  claims to do, but nothing in the simulation reads it either.
- **`search()` in `content/reference.ts`** is a ranked search over every city
  with no caller. The note on it says it stays only while a way in might be
  built, and this page carries it until one is or it goes.
- **The audit trail is a persisted, empty table.** `core/audit.ts` can record
  what went into a decision and redact what the player could not have known.
  Nothing calls it.
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
