# Brief 14: The Health Area

Read `prompts/common.md` first: it's how every area works. This is what's yours.

## Your Clone

- **The clone:** `/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad/l14-health`, on its branch `lang14-health`, from the pass's baseline commit. Work only there.
- **Your area id** for `--by`, your folder and your status file: `health` (`docs/verification/language-2026-10-17/health/`, `docs/text/statuses/health.json`).
- **Your port** for the built app: 4207.

## What's Yours

The inventory's subsystems health, world: 167 sources, 37,071 words, in 20 files. Each file, its sources and its words, biggest first:

- `src/engine/content/world-data.ts`: 4 sources, 29,899 words
- `src/engine/content/guide/body.ts`: 8 sources, 3,341 words
- `src/engine/systems/health.ts`: 45 sources, 1,409 words
- `src/ui/looks/wellbeing.tsx`: 12 sources, 919 words
- `src/engine/content/clinics.ts`: 2 sources, 575 words
- `src/engine/content/geography.ts`: 61 sources, 329 words
- `src/engine/systems/therapy.ts`: 3 sources, 121 words
- `src/engine/core/invariants.ts`: 1 source, 88 words
- `src/engine/systems/appointments.ts`: 6 sources, 83 words
- `src/engine/content/lifespan.ts`: 1 source, 74 words
- `src/engine/content/body.ts`: 3 sources, 54 words
- `src/engine/systems/injury.ts`: 5 sources, 52 words
- `src/engine/systems/clinics.ts`: 2 sources, 30 words
- `src/engine/systems/body.ts`: 2 sources, 23 words
- `src/engine/core/deciders.ts`: 2 sources, 21 words
- `src/engine/content/injury.ts`: 1 source, 20 words
- `src/engine/core/rng.ts`: 1 source, 14 words
- `src/engine/systems/mortality.ts`: 3 sources, 9 words
- `src/engine/content/carevisits.ts`: 4 sources, 8 words
- `src/engine/core/performer.ts`: 1 source, 2 words

A file of yours that another area's tests or tools assert is still yours to change; update those assertions and say so in your batch record.

## What To Watch For

- **Health, stamina, energy and condition** are four things (`docs/GLOSSARY.md`, Core), and the wellbeing look and the
  guide's body chapter say which is which, plainly. "Dials" go.
- **Care, appointments, cover, bills, therapy, injuries and illness:** each notice says what happened, what it means
  for school and work, and what to do. Keep every amount and date.
- **The world's reference data** (`world-data.ts`, `geography.ts` and the rest) is the gazetteer: real names as the
  world spells them. Review what a screen shows, and keep the data.
- **`core/invariants.ts`:** an internal check. Say whether a player can reach its words, and how you know.

**How This Works entries.** An entry in `src/engine/content/guide/*.ts` is a feature's tutorial. Rewrite yours so it answers the
brief's eight questions in order, with the screen's own labels:
- what it's for (`short`);
- where to go (`where`, `available`);
- what to press (`steps`);
- what's needed first (`needs`);
- what happens (`now`, `later`, `costs`, `interpret`);
- how it affects the rest of the game (`connections`, `reads`);
- what to do next (`next`, a new optional field: give every entry one, or `[]` with a reason in your batch record);
- what to do if you can't (`unavailable`, `mistakes`).

Lead with a short plain overview, then the steps, then results, then the deeper explanation and the figures (`reads`,
`example`). Every route and label it gives must exist on the built app: check each against the text walk of your
screens. Figures stay read from the rules' constants, as they are now, never typed into the words. The tutorial area
renames the headings Help shows, so write each field for its question, not for its old heading ("What The Game Reads"
becomes what it affects).
