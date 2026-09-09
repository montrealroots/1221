# SLATE Coverage Matrix

What the game covers, feature by feature, reconciled against the code that
carries it. Every row says one of three things, and nothing is promoted
because its landing page works:

- **Implemented** — built, on screen, held by tests.
- **Partial** — built to a stated depth; the gap is named in the row.
- **Not built** — nothing in the tree.

SLATE is an actor and actress life simulator, and it holds the two titles as equals.
That premise is carried by every save rather than only stated on a screen: see
the row for it below.

This build is a deliberate cut-down. Everything that used to sit behind these
screens — the shops, the studios, the schools, the phone,
the people — was removed on purpose. What is left is six things and the engine
they need. Nothing below claims otherwise.

## What is in the build

| Feature | State | Where it lives | Held by |
| --- | --- | --- | --- |
| The premise | Implemented — every save states that SLATE is an actor and actress life simulator, carries both titles as equals, records which one the player holds and whether they stated it, and is validated on load and refused by the server without it | `src/engine/domain/model.ts`, `src/engine/core/performer.ts`, `base44/shared/guard.js` | `premise` |
| Startup sequence | Implemented — the mark, the storage it picks, the schema it reads, and the slots it hands on | `src/ui/startup/StartupSequence.tsx` | `persistence`, `base44-adapter` |
| Save slots | Implemented — three slots, each its own universe, with migration and validation on the way in | `src/ui/saves/SaveSlots.tsx` | `integrity`, `persistence` |
| Character creation | Implemented — identity, whether the player is billed as an actor or an actress, heritage, citizenship, personality and its traits, the acting instrument, height and weight, where and when the save starts | `src/ui/creation/CharacterCreation.tsx` | `premise`, `citizenship`, `portrait`, `cohesion` |
| The geography map | Implemented — every country drawn from the projected world map, 170,911 cities behind it, loaded a country at a time | `src/ui/creation/WorldMap.tsx`, `src/engine/content/geography.ts` | `geography`, `world-map` |
| Portrait | Implemented — a headshot cropped to a fixed frame and carried on the person | `src/ui/creation/PortraitPicker.tsx` | `portrait` |
| Home | Implemented — the day, where you are, what needs you, what happens next, how you are, the weather, money, standing and the household | `src/ui/screens/Home.tsx` | `interface`, `navigation`, `smoke` |
| Calendar | Implemented — the month, the next thirty days, collisions, and the observances of the country you are standing in | `src/ui/workspaces/CalendarWorkspace.tsx`, `src/engine/world/calendar.ts` | `calendar`, `holidays` |
| Weather | Implemented — a climate model per city from season, latitude and the kind of place it is, with a week ahead | `src/engine/systems/weather.ts` | `weather` |
| Time controls | Implemented — live play, sleeping, and skipping to an event with what it would cross shown first | `src/ui/shell/TimeControls.tsx` | `simulation`, `realclock` |
| Wellbeing and sleep | Partial — the model, the night, and the day that passes unattended. There is nothing else to spend a day on any more | `src/engine/systems/life.ts` | `simulation`, `smoke`, `endurance` |
| Money | Partial — a ledger that conserves, the accounts a life starts with, and net worth derived from them. Nothing bills, earns or charges | `src/engine/core/ledger.ts`, `src/engine/systems/finance.ts` | `money`, `endurance` |
| Server-checked persistence | Implemented — the guards between a browser and storage, and the client that speaks the platform's protocol | `base44/`, `src/engine/persistence/` | `server-guards`, `base44-adapter`, `base44-contract` |

## What was taken out

Removed wholesale, with their screens, their content and their tests: the film
and television half (casting, shoots, pictures, festivals, cinemas, the
company and the strike premise), work and professions, school, university and
exams, athletics and fitness, health and insurance, property beyond a place to
sleep, vehicles, shopping and the whole catalogue, dining, going out, fashion,
jewellery, wardrobe and costume, travel and journeys, relationships and dating,
the phone and its four apps, social and video, scenes and the dialogue library,
the recall, the tutorial, Go Anywhere and the help panel.

Their save collections are gone from `SaveUniverse` with them. A save written
by an older build still opens — `migrate` creates anything missing and leaves
what it does not read untouched — but the screens that showed those things are
not coming back in this build.

## The engine, as it now stands

Five commands and one route, which is the honest size of what is left. Sleeping
is the one thing a player does that moves the world (`life.sleep`); the rest is
the Decision Center answering, dismissing and marking read
(`world.take_decision_action`, `world.dismiss_decision`, `world.mark_read`) and
the preferences (`world.set_preferences`). The only workspace behind a route is
`/workspace/calendar`; Home is served by the shell itself.

<!-- inventory:begin -->
Generated by `node tools/inventory.mjs --markdown`. 5 commands, 2 scheduled kinds, 3 events emitted, 0 event listeners, 0 scenes, 1 routes.

### Commands

| System | Kinds | Owner |
| --- | --- | --- |
| life | `life.sleep` | `src/engine/systems/life.ts` |
| world | `world.dismiss_decision` `world.mark_read` `world.set_preferences` `world.take_decision_action` | `src/engine/world/world.ts` |

### Scheduled kinds

| System | Kinds | Owner |
| --- | --- | --- |
| life | `life.day_rollover` | `src/engine/systems/life.ts` |
| world | `world.tick` | `src/engine/world/world.ts` |

### Events emitted

| System | Kinds | Owner |
| --- | --- | --- |
| life | `life.sleep_started` `life.woke` | `src/engine/systems/life.ts` |
| world | `world.day_rollover` | `src/engine/systems/life.ts` |

### Event listeners

| System | Kinds | Owner |
| --- | --- | --- |

### Scenes

| Scene | Owner |
| --- | --- |

### Routes

`/workspace/calendar`
<!-- inventory:end -->
