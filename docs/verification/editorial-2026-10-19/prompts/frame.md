# Brief 15: The Frame Area

Read `prompts/common.md` first: it's how every area works. This is what's yours.

## Your Clone

- **The clone:** `/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad/e15-frame`, on its branch `ed15-frame`, from the pass's baseline commit. Work only there.
- **Your area id** for `--by`, your folder and your status file: `frame` (`docs/verification/editorial-2026-10-19/frame/`, `docs/text/second-pass/frame.json`).
- **Your port** for the built app: 4281.

## What's Yours

487 sources and 25,438 words in 57 files, all Pending in the second pass at the start. Each file, biggest first (sources, words):

- `src/engine/content/entry.ts`: 16 sources, 7,471 words
- `src/engine/content/guide/day.ts`: 15 sources, 5,308 words
- `src/ui/creation/CharacterCreation.tsx`: 23 sources, 1,613 words
- `src/engine/content/guide/start.ts`: 6 sources, 1,302 words
- `src/engine/content/personality-traits.ts`: 37 sources, 1,150 words
- `src/ui/looks/place.tsx`: 11 sources, 1,093 words
- `src/ui/looks/day.tsx`: 14 sources, 953 words
- `src/ui/looks/weather.tsx`: 12 sources, 733 words
- `src/ui/looks/attention.tsx`: 10 sources, 548 words
- `src/engine/decided.ts`: 27 sources, 543 words
- `src/engine/index.ts`: 14 sources, 525 words
- `src/engine/systems/life.ts`: 13 sources, 476 words
- `src/ui/shell/TimeControls.tsx`: 8 sources, 373 words
- `src/ui/screens/Home.tsx`: 4 sources, 305 words
- `src/ui/workspaces/CalendarWorkspace.tsx`: 6 sources, 264 words
- `src/engine/core/simulation.ts`: 4 sources, 224 words
- `src/engine/world/plans.ts`: 7 sources, 212 words
- `src/engine/content/holiday-data.ts`: 1 source, 206 words
- `src/ui/looks/plans.tsx`: 1 source, 174 words
- `src/ui/saves/SaveSlots.tsx`: 3 sources, 169 words
- `src/engine/content/languages.ts`: 154 sources, 165 words
- `src/engine/persistence/local.ts`: 5 sources, 115 words
- `src/ui/creation/LocationPicker.tsx`: 1 source, 115 words
- `src/engine/persistence/base44.ts`: 1 source, 97 words
- `src/ui/startup/StartupSequence.tsx`: 6 sources, 94 words
- `src/engine/content/thunder.ts`: 1 source, 84 words
- `src/ui/creation/PortraitPicker.tsx`: 1 source, 77 words
- `src/app/game-context.tsx`: 5 sources, 76 words
- `src/engine/content/ethnicity.ts`: 9 sources, 73 words
- `src/engine/world/world.ts`: 5 sources, 73 words
- `src/engine/world/calendar.ts`: 2 sources, 73 words
- `src/ui/creation/WorldMap.tsx`: 1 source, 65 words
- `src/engine/world/bootstrap.ts`: 3 sources, 64 words
- `src/ui/shell/LifeEnded.tsx`: 1 source, 64 words
- `src/app/SlateApp.tsx`: 3 sources, 59 words
- `src/ui/shell/GameShell.tsx`: 2 sources, 54 words
- `src/ui/shell/destinations.ts`: 1 source, 54 words
- `src/engine/core/time.ts`: 4 sources, 44 words
- `src/ui/creation/portrait.ts`: 3 sources, 44 words
- `src/engine/world/place.ts`: 3 sources, 34 words
- `src/ui/workspaces/WorkspaceRouter.tsx`: 2 sources, 31 words
- `src/ui/shell/sections.ts`: 15 sources, 30 words
- `src/ui/components/primitives.tsx`: 5 sources, 30 words
- `src/engine/core/events.ts`: 1 source, 29 words
- `src/engine/systems/weather.ts`: 4 sources, 26 words
- `src/ui/creation/world-map.ts`: 2 sources, 22 words
- `src/engine/content/identity.ts`: 1 source, 19 words
- `src/engine/content/climate.ts`: 1 source, 18 words
- `src/engine/persistence/adapter.ts`: 1 source, 15 words
- `src/ui/looks/registry.ts`: 2 sources, 10 words
- `src/engine/systems/seasons.ts`: 1 source, 9 words
- `src/engine/content/holidays.ts`: 1 source, 8 words
- `src/engine/systems/birthdays.ts`: 2 sources, 6 words
- `src/ui/workspaces/cell.ts`: 1 source, 6 words
- `src/main.tsx`: 1 source, 6 words
- `src/ui/looks/Look.tsx`: 3 sources, 5 words
- `src/engine/core/sun.ts`: 1 source, 2 words

## What To Watch For

**What's yours:** startup, the save slots, character creation and its pickers, Home and its panels, the notices' plumbing (`src/engine/world/`), the shared controls, the calendar and the time controls (`ui/shell/TimeControls.tsx`), and the How This Works entries `guide/start.ts` and `guide/day.ts`. The page head in `index.html` and the holiday names are already marked: read them, and mark them again only if you change them.

**From the working reference:** the dialog when the clock stops for a school event (`TimeControls.tsx`: "Only a plan of your own can be skipped…") is yours. The brief's own example says there's no Skip button for school events: the button is Skip It.

**Interactions to read whole:** a new life, from the slots through each creation step to the first Home; moving the clock (Advance, On The Way, the dialog with Go, Stand Here and Skip It, Sleep and its confirmation); a notice opened, read and marked read; Save & Exit, then Continue; deleting a save, refused and confirmed.

**Watch:** creation's explanations of dispositions and traits, which a new player meets before knowing anything; the empty states and Locked panels on the first day; the calendar's day and entry dialogs; time words ("in 2h 30m") read aloud by a screen reader.
