# The Dialogue Library

What the world says, kept as data: where it lives, how a line is chosen,
how it is checked, and — honestly — how much of it there is against the
100,001 the directive asks for.

## What a line is

`src/engine/dialogue/schema.ts`. Every entry has a stable id built from its
place (`dating.reply.table.ask.good.1`), the text, its language, who says it
and in what role, the section, purpose and beat it belongs to, the
conditions under which it is true, an optional weight and cooldown, and
optional follow-ups (validated). A line has no effects. It describes what a
validated command has already done; the command decides, and the text
answers.

Conditions are what the world knows at the moment of speaking, never a
roll: the outcome (`good`, `flat`, `bad`; `accepted`, `declined`; `there`,
`late`, `no_show`), the move it answers, the speaker's voice (`warm`,
`dry`, `guarded`, `firm`), what the speaker knows about the player
(`bought`, `walked`, `drove`) and what they must not, a chemistry range,
and flags (`first_visit`, `levers`).

Slots (`{first}`, `{car}`, `{ask}`) are filled at speaking time. A line
that differs from another only in a slot is the same line, and is counted
once.

## Where lines live

`src/engine/dialogue/chunks/<section>.ts`, one chunk per section, each
declaring its lines and its **expectations** — the queries the code will
make of it, written down so coverage can be checked without playing.
Chunks are loaded by `loadAllSections()` as the app starts, as their own
files, so the interface's first bundle carries none of them. A scene that
speaks before its section has arrived gets the fallback that contradicts
nothing, and says it is a fallback.

A save never carries the text. It keeps `dialogue.seen`: which ids it has
heard, how many times, and when — bounded to 2,000 — so a voice does not
repeat itself.

## How a line is chosen

`speak(sim, query, context, salt)` in `src/engine/dialogue/library.ts`:

1. Take the lines for the section, purpose and beat.
2. Keep the ones that are **true** for the context — outcome, move, voice,
   what the speaker knows, flags, chemistry. If the voice leaves nothing,
   relax the voice and keep the rest; never relax the facts.
3. If nothing is left, return the fallback and mark it as one.
4. Drop lines under cooldown while any other qualifies.
5. Choose, seeded on the moment and the salt, weighted away from what this
   save has already heard (weight ÷ (1 + times heard)^1.5).
6. Record the hearing.

`preview()` chooses the same way and records nothing, for text a view
shows before any command has run. Commands speak; views preview.

## How it is checked

`tests/dialogue.test.ts`, also run by `node tools/dialogue-check.mjs` with
the count printed:

- every id unique and placed; text present; language; version; follow-ups
  resolve;
- every expectation a chunk declares is covered by at least one line for
  every combination it names;
- no two lines the same once case, punctuation and slots are set aside;
- near-twins (token-set similarity ≥ 0.85) reported and failing;
- selection filters first, falls back and says so, records and leans away
  from what has been heard, keeps the record bounded, is the same line for
  the same moment, fills its slots, respects cooldowns; a preview records
  nothing.

Editorial review is not automated: voice, originality and whether a line is
right for its beat are read by a person. Nothing is counted as approved
because a script accepted it.

## Voice

Narration is second person, present tense, plain, and knows only what the
character knows. Characters answer in their own register: a warm person
meets you part of the way in words; a dry one has a line for it; a guarded
one gives less than they feel; a firm salesperson says the number and
stops. Editorial cleanup fixes spelling and grammar in narration and
interface text; it does not flatten how a person talks.

## The count, honestly

Run `node tools/dialogue-check.mjs` for today's figure. At the time of
writing the library holds **under three hundred distinct entries** across four
sections (dating, property, vehicles and social), moved out of the code that
used to carry them inline; the scenes for the gym, meals, runs and wellbeing still carry
their lines in code and are next to move.

The directive's target is 100,001 distinct, original, reachable entries.
That is a content-production programme, not an engineering task: at a
careful writer's pace it is many months of authored, reviewed text, and it
needs an allocation across sections, situations, roles, moods and
outcomes that this document does not yet carry. What is built is the
machinery the programme runs on — the schema, the loader, the selection,
the exposure record, the validator, the report — and the discipline that
nothing is counted from templates, combinations, translations, slot
variants or promises. The number reported is the number there is.

## Adding lines

1. Write them in the section's chunk with `line()` or the chunk's helper.
   Give each its place and its conditions; never an effect.
2. If the code will ask for something new, add the expectation to the
   chunk so the validator holds the code to it.
3. `node tools/dialogue-check.mjs`. Fix what it reports.
4. Read them aloud in the voice they belong to.
