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
| Save slots | Implemented — three slots, each its own universe, with migration and validation on the way in, and a backup that says which world date it holds so restoring and deleting are not blind | `src/ui/saves/SaveSlots.tsx` | `integrity`, `persistence` |
| Character creation | Implemented — identity, whether the player is billed as an actor or an actress, race or ethnicity, citizenship, personality and its traits, the acting instrument, where and when the save starts | `src/ui/creation/CharacterCreation.tsx` | `premise`, `citizenship`, `portrait`, `cohesion` |
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
company and the strike premise), the rota half of work — the branch, the
manager, the cover shift and being let go — and professions, school, university and
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

Fifteen commands and two routes, which is the honest size of what is left.

Three of them are a person deciding something rather than answering
something. `calendar.schedule` puts a thing on the calendar, `calendar.cancel`
takes one off again while there is still time to tell anybody it was with,
and `calendar.skip` is standing at it and not going. They are the first
commands in the build that make the world rather than reply to it, and a plan
they make is an ordinary timeline item — which is why the clock stops at one,
why two at once are flagged, and why being somewhere else when it comes round
is noticed.

The three are priced against each other rather than separately: a day's
notice costs nothing, calling off later costs more the later it is, and not
going at all costs twice what the latest possible call-off does. Ordering
them is what makes choosing between them a choice.

Nine more are the family business, and they are one system rather than
nine: a production company is a list of things it may and may not do, and
each of these opens one of those doors. `company.register` puts it on a
register (Fyrirtækjaskrá, the VAT roll, the employer roll, the IRS),
`company.form_arm` forms the American subsidiary, `company.sign` signs a
guild agreement, `company.insure` binds a policy, `company.option` takes
rights to something, `company.fill_post` puts a person in a post and
`company.develop` puts something on the slate.

The last three are what happens after somebody says yes. `company.greenlight`
turns a title into a schedule: it lays a plan's periods onto real dates,
takes a stage off the lot's own booking board to hold them, and arms the
ticks that walk the picture from prep to wrap to a finished cut.
`company.deliver` files one item on the contractual delivery list, which is
the thing that actually gets a picture paid for — and four of those items
are paperwork no one on the crew makes, so a finished film can sit unpaid
for months because the music cue sheet was nobody's job.

`company.sell` sells the finished thing, and it is the only one of the three
that can pay the company back. A deal is chosen, a ten-year take is reckoned
once and never revised, and the release windows are armed to pay as they open.
What arrives is run through a recoupment waterfall in the order it arrives: a
distributor's fee off the top, then what was spent selling the picture, then
the money that made it, with interest on whatever part of that is still
outstanding. The order is the whole mechanic, and it is why a picture can take
three times its budget and still owe for itself.

The decision underneath them: the parent is an Icelandic `ehf.` and the
American arm is earned. Global Rule One is why — a SAG-AFTRA member may not
work for a producer who has not signed, anywhere on earth — so an Icelandic
company that wants one American actor has to become, in part, an American
company. Nothing else in the build has that shape, and it is the reason the
company is two records rather than one.

Two routes now: `/workspace/calendar` and `/workspace/business`; Home is
served by the shell itself.

Sleeping is the other thing a player does that moves the world
(`life.sleep`). The rest is the Decision Center answering, dismissing and
marking read (`world.take_decision_action`, `world.dismiss_decision`,
`world.mark_read`) and the preferences (`world.set_preferences`).



<!-- inventory:begin -->
Generated by `node tools/inventory.mjs --markdown`. 18 commands, 8 scheduled kinds, 3 events emitted, 0 event listeners, 0 scenes, 2 routes.

### Commands

| System | Kinds | Owner |
| --- | --- | --- |
| calendar | `calendar.cancel` `calendar.schedule` `calendar.skip` | `src/engine/world/plans.ts` |
| company | `company.deliver` `company.develop` `company.fill_post` `company.form_arm` `company.greenlight` `company.insure` `company.option` `company.register` `company.sell` `company.sign` | `src/engine/world/company.ts`, `src/engine/world/making.ts`, `src/engine/world/selling.ts` |
| life | `life.sleep` | `src/engine/systems/life.ts` |
| world | `world.dismiss_decision` `world.mark_read` `world.set_preferences` `world.take_decision_action` | `src/engine/world/world.ts` |

### Scheduled kinds

| System | Kinds | Owner |
| --- | --- | --- |
| life | `life.commitment` `life.day_rollover` | `src/engine/systems/life.ts`, `src/engine/world/plans.ts` |
| lot | `lot.overhead` | `src/engine/world/lot.ts` |
| project | `project.delivery` `project.period` `project.window` | `src/engine/world/making.ts`, `src/engine/world/selling.ts` |
| sugar | `sugar.quota` | `src/engine/world/sugar.ts` |
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

`/workspace/business` · `/workspace/calendar`
<!-- inventory:end -->
