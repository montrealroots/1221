# Brief 25's Audit Of What Was There, 2026-10-23

What the game already had for each system the brief names, read from the code on `b46ee301` (`main`, #63) before any
change, and what brief 25 does with it. The brief: "Extend existing systems. Do not create duplicate clocks, banks,
player records or parallel career engines." So each new piece names the existing one it extends.

## Starting Point

- **Branch and commit:** `claude/peaceful-hamilton-59zdbb` at `b46ee301`, level with `origin/main` (briefs 23 and 24
  merged in #62 as `a4e6795a`, the handoff's account in #63). No stash, one worktree, nothing uncommitted.
- **The gate on the code it holds:** exit 0 in a clean clone of `8d4139de`, whose `src`, `tests` and `base44` are
  `main`'s: 488 of 488 test files, 5,616 of 5,616 tests, all 22 checks. The completion matrix: 634 of 658.
- **The save schema:** 94, in `SAVE_SCHEMA_VERSION` and the Base44 guard's `SUPPORTED_SCHEMA_VERSION` both.

## A Decision The Brief Reverses

Brief 19 depicted one real agent (Jordan Parente of Stewart Talent) from published facts. On 2026-10-21 the owner had
him swapped for a fictional one ("Let's go ahead and swap in a fictional agent."): Thomas Ashgrove of Halberd Talent.
Every project, company and casting office has been fictional since brief 19. Brief 25 asks for real agencies,
individual agents, shows, films, companies, broadcasters, platforms, directors and performers "wherever their identities
and relationships can be verified", with every message and application simulated. The later brief governs. The
fictional agent stays as he is: saves hold relationships and agreements with him, and the brief says data updates
must not erase history. Real records are added beside him, each fact sourced and each simulated event labeled.

## The Systems, One By One

| System | Where | What it does now | Brief 25 extends it by |
|---|---|---|---|
| Creation and the profile | `src/ui/creation/`, `systems/pro.ts`'s `profileOf` | A life: identity, citizenship from the birthplace, performer title, traits, genres, Before Yale. The Profile reads the professional record. | Nothing new at creation. Citizenship and documents decide work permission abroad. |
| School and graduation | `systems/school.ts`, `systems/proshowcase.ts` | Yale's three years, the showcase, the degree. No early degree (the Bulletin's two-year floor, no way to ask). In-session outside work needs the dean's written approval. | Kept as is (BASE-04, BASE-05). Work abroad in term takes classes away. The School's presence check reads the trip. |
| The career | `systems/pro.ts`, `proagent.ts`, `projobs.ts`, `propay.ts`, `content/careerwork.ts`, `content/agents.ts` | One record (`person.pro`): credits, materials, one fictional agent, eleven fictional project templates in New York City and Hudson, opportunities to booking, work days, pay into trust or direct, commission, unions, outside-work requests. | The same record and the same loop. New projects, places, agreements and agencies are data on it; travel and stays are new fields of it. No second career engine. |
| Attributes and genres | `systems/attributes.ts`, `content/genres.ts`, `content/genre-weights.ts`, `systems/evaluation.ts` | The judged performance: task profiles, genre familiarity with material-specific weights (brief 22), the day's condition. | The same judge. Scene-specific demands for mixed genres extend `requirementOfRole`. |
| Money and banking | `core/money.ts`, `core/ledger.ts`, `systems/banking.ts`, `systems/abroad.ts` | Integer minor units; one ledger; banks by country; payments abroad with each bank's fee, margin and days. | Pay in another currency goes through the ledger and the payments abroad. No second bank. |
| Papers | `systems/documents.ts`, `systems/permission.ts` | Passports, travel authorizations (ESTA, ETA, eTA), visas and permissions to stay or work, with refusals in words. | New permissions (Australia's 408 first) are documents of the same kind. |
| The calendar and Advance | `world/calendar.ts`, `core/scheduler.ts`, `ui/shell/TimeControls.tsx` | Scheduled items with travel minutes and durations; stops for career calls; Sleep and Advance stop at a call that needs the player. | Flights, transfers and check-ins are scheduled items on the same scheduler. |
| The inbox | `SaveUniverse.notifications`, `decisions` | Notices with importance; decisions with actions. | Simulated messages from agents and productions are notices of the same kind. |
| Geography | `content/geography.ts`, `content/world-data.ts`, `world/place.ts` | Cities with IANA zones, coordinates and regions (Sydney is `au-nsw-sydney`, `Australia/Sydney`). `person.currentLocationId` is New Haven for everyone since travel went in the scope reset of 2026-10-09. | Travel for work moves the player between these cities. Ninety-eight reads of `currentLocationId` take it as where the player lives; presence away for work is kept beside it in the career record, so banking, taxes and the rest still read the home. |
| Weather, holidays, self-care | `systems/weather.ts`, `content/holidays.ts`, `systems/body.ts`, `systems/spending.ts` | A city's weather and daylight, holidays by country and region, eating, sleep, recovery. | Weather where the work is; rest after a long trip through the existing condition. |
| Tutorials | `content/tutorial.ts`, `content/guide/` | Every command opened by a chapter (`tests/tutorial.test.ts` fails one that isn't). | A chapter for each new command. |
| Saves | `src/engine/index.ts`'s `migrate`, schema 94 | Older saves brought forward; `GONE_AT_90` drops the old travel's fields (`trip`, `stay`, `journeys`) from saves before 90. | New fields are optional inside `person.pro`, so the schema stays 94 and no migration step is needed. Names the old drop list holds aren't reused. |
| The interface | `src/ui/`, `ui/shell/destinations.ts` | Six places on the menu since brief 24; Career has Overview, Portfolio, Representation, Opportunities, Work. | The same tabs. No new menu place. |

## What Is Not Restored

Housing, vehicle ownership, general shopping, unrelated occupations and parental leave stay out, as the scope reset of
2026-10-09 left them (BASE-08). Travel comes back only as travel for work, inside the career record, with the stay a
production arranges, never a home.
