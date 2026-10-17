# The Frame Area: Where It Stands

Brief 14's frame area, in `scratchpad/l14-frame` on `lang14-frame`. Read `../prompts/common.md` and `../prompts/frame.md`
first; `batches.md` is the record of what's done, `examples.json` the before-and-after pairs, `defects.md` the defects.

## Done

- **Batch 1** (committed): the generic failure (`core/simulation.ts`), What Needs You's commands (`world/world.ts`), the
  plan commands (`world/plans.ts`), the question and notice looks (`ui/looks/attention.tsx`), the provider's clock fault.
- **Batch 2**: the top bar and its dialogs (`TimeControls.tsx`), the shell, A Life, Ended, the locked screen, the rail.
- **Batch 3**: startup, the save slots, the persistence adapters, SlateApp, `engine/index.ts`'s player-facing parts.
- **Batch 4**: Home (`ui/screens/Home.tsx`) and `systems/life.ts` (the summary, the sleep suggestion, slept through).

## Next

- **Batch 5, creation**: the edits are written in `scratchpad/frame/b5-creation.py` (apply, then update the tests it
  lists: `evidence-g28-ui`, `evidence-g27-ui`, `need-paths`, `evidence2-b11`, `evidence-g09-life`); then
  `personality-traits.ts`, `languages.ts`, `identity.ts`, `ethnicity.ts`, `bootstrap.ts`, the pickers, `portrait.ts`,
  `world-map.ts`.
- **Batch 6, the calendar and the looks**: `CalendarWorkspace.tsx`, `ui/looks/day.tsx`, `place.tsx`, `weather.tsx`,
  `plans.tsx`, `core/time.ts`, `core/sun.ts`, `systems/weather.ts`, `seasons.ts`, `birthdays.ts`, the holiday and
  climate data, `world/calendar.ts`.
- **Batch 7, the guide**: `content/guide/start.ts` and `content/guide/day.ts`, each entry in the eight questions'
  order with a `next`.
- **Batch 8**: `content/entry.ts`, through `tools/build-entry.mjs`.
- **The end**: the built app (`npm run build`, port 4201), the text walk at 1440 and 390, a frame walk of creation, the
  calendar and the dialogs, then mark what's left Pending for it (GameShell, destinations, ROUTE_LABELS, the startup
  stages); the whole suite once; `glossary.md`; the report.
