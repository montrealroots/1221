# Brief 14: The Frame Area

Read `prompts/common.md` first: it's how every area works. This is what's yours.

## Your Clone

- **The clone:** `/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad/l14-frame`, on its branch `lang14-frame`, from the pass's baseline commit. Work only there.
- **Your area id** for `--by`, your folder and your status file: `frame` (`docs/verification/language-2026-10-17/frame/`, `docs/text/statuses/frame.json`).
- **Your port** for the built app: 4201.

## What's Yours

The inventory's subsystems calendar, controls, home, notifications, start: 475 sources, 25,084 words, in 57 files. Each file, its sources and its words, biggest first:

- `src/engine/content/entry.ts`: 16 sources, 7,368 words
- `src/engine/content/guide/day.ts`: 15 sources, 5,106 words
- `src/ui/creation/CharacterCreation.tsx`: 23 sources, 1,560 words
- `src/ui/looks/place.tsx`: 11 sources, 1,246 words
- `src/engine/content/guide/start.ts`: 6 sources, 1,243 words
- `src/engine/content/personality-traits.ts`: 37 sources, 1,157 words
- `src/ui/looks/day.tsx`: 14 sources, 1,017 words
- `src/ui/looks/weather.tsx`: 12 sources, 809 words
- `src/ui/looks/attention.tsx`: 8 sources, 780 words
- `src/engine/decided.ts`: 27 sources, 543 words
- `src/engine/index.ts`: 14 sources, 503 words
- `src/engine/systems/life.ts`: 13 sources, 465 words
- `src/ui/shell/TimeControls.tsx`: 8 sources, 349 words
- `src/ui/screens/Home.tsx`: 4 sources, 289 words
- `src/ui/workspaces/CalendarWorkspace.tsx`: 6 sources, 239 words
- `src/engine/content/holiday-data.ts`: 1 source, 206 words
- `src/engine/world/plans.ts`: 5 sources, 203 words
- `src/ui/looks/plans.tsx`: 1 source, 196 words
- `src/engine/content/languages.ts`: 154 sources, 165 words
- `src/ui/saves/SaveSlots.tsx`: 3 sources, 154 words
- `src/ui/creation/LocationPicker.tsx`: 1 source, 103 words
- `src/engine/core/simulation.ts`: 1 source, 100 words
- `src/engine/content/thunder.ts`: 1 source, 84 words
- `src/ui/creation/PortraitPicker.tsx`: 1 source, 76 words
- `src/engine/content/ethnicity.ts`: 9 sources, 75 words
- `src/ui/startup/StartupSequence.tsx`: 6 sources, 74 words
- `src/engine/persistence/base44.ts`: 1 source, 72 words
- `src/engine/persistence/local.ts`: 5 sources, 67 words
- `src/engine/world/calendar.ts`: 2 sources, 66 words
- `src/ui/shell/LifeEnded.tsx`: 1 source, 66 words
- `src/ui/creation/WorldMap.tsx`: 1 source, 65 words
- `src/engine/world/bootstrap.ts`: 3 sources, 64 words
- `src/ui/shell/GameShell.tsx`: 2 sources, 54 words
- `src/ui/shell/destinations.ts`: 1 source, 46 words
- `src/engine/core/time.ts`: 4 sources, 44 words
- `src/ui/creation/portrait.ts`: 3 sources, 44 words
- `src/engine/world/world.ts`: 4 sources, 37 words
- `src/engine/world/place.ts`: 3 sources, 34 words
- `src/ui/components/primitives.tsx`: 5 sources, 30 words
- `src/ui/shell/sections.ts`: 15 sources, 30 words
- `src/engine/core/events.ts`: 1 source, 29 words
- `src/ui/workspaces/WorkspaceRouter.tsx`: 2 sources, 29 words
- `src/engine/systems/weather.ts`: 4 sources, 26 words
- `src/app/game-context.tsx`: 3 sources, 24 words
- `src/ui/creation/world-map.ts`: 2 sources, 22 words
- `src/engine/content/identity.ts`: 1 source, 19 words
- `src/engine/content/climate.ts`: 1 source, 18 words
- `src/engine/persistence/adapter.ts`: 1 source, 16 words
- `src/app/SlateApp.tsx`: 1 source, 15 words
- `src/ui/workspaces/cell.ts`: 1 source, 11 words
- `src/ui/looks/registry.ts`: 2 sources, 10 words
- `src/engine/systems/seasons.ts`: 1 source, 9 words
- `src/engine/content/holidays.ts`: 1 source, 8 words
- `src/engine/systems/birthdays.ts`: 2 sources, 6 words
- `src/main.tsx`: 1 source, 6 words
- `src/ui/looks/Look.tsx`: 3 sources, 5 words
- `src/engine/core/sun.ts`: 1 source, 2 words

A file of yours that another area's tests or tools assert is still yours to change; update those assertions and say so in your batch record.

## What To Watch For

- **Creation and the save slots:** every step's guidance, every disabled Continue's reason, the save, load and backup
  messages, and the quota and failure messages in `src/engine/persistence/`. A save that fails says what was and wasn't
  saved, and what to do.
- **Home:** What Needs You, a question's answers, Mark Read, Dismiss, the six-and-more line, and the day's line under
  the name.
- **Notices in general:** the framework in `src/engine/world/` and `src/ui/looks/attention.tsx`. A notice leads with
  what happened, then what it means, then what to do. The notice texts themselves belong to the area whose system sends
  them.
- **The generic failure:** `src/engine/core/simulation.ts` turns an unexpected error into
  `${command.kind} failed: <message>` and, mid-advance, a notice titled "Something Didn't Go Through". It shows a raw
  command id and an internal message. Say what the player needs: that it didn't happen, that nothing was changed (the
  command's changes are rolled back in the ordinary path; read the code for the mid-advance path before you claim it),
  and what to do. Keep the internal detail where a developer can find it, not in the player's sentence. Its tests
  assert it, so update them as exactly as before.
- **The shared controls:** the rail and its labels (`src/ui/shell/sections.ts`, `destinations.ts`), Play, Pause,
  Advance and its menu, Sleep and its dialog (`TimeControls.tsx`), modals' Close, confirmations, empty and loading
  states, the shared primitives, and every `aria-label`, `alt` and `title`. A control's accessible name is its visible
  label, or says what it does where there's no label.
- **The calendar and the clock:** the Calendar workspace, the day, place and weather looks, the plans look, and the
  guide's day chapter (`guide/day.ts`), which is How This Works for the calendar, the clock and the day. The weather and
  climate notes keep their honesty about being a model, said plainly.
- **`src/engine/content/entry.ts`** is generated by `tools/build-entry.mjs`; don't edit it by hand. Find which of its
  fields reach a screen, review those, and change them through the builder or say why they stay.

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
