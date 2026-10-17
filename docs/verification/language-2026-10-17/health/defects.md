# Defects The Health Area Found

Brief 14, 2026-10-17. Functional faults found while reading the health area's sources, apart from the writing.

## Fixed, Inside The Area

1. **"1 hours" on your own page.** The Sleep Debt way printed `${n} hours on the books` for any n, so one hour read
   "1 hours". Found reading `wellbeing.tsx`. Now `plural()`; read at 0, 3, 5 and 14 hours in `render-after-1.txt`.
2. **"a citizen of United States".** The person look printed a country's bare name after "a citizen of". Found in the
   before render. Now `theCountry()`, as `bodyUnits` already did; asserted in `tests/scope-people.test.ts`,
   `tests/evidence-g33-ui.test.ts` and `tests/evidence2-b12.test.ts` (United Kingdom and United States).
3. **A type 2 diabetes told type 1's risk.** The condition look's untreated line said "type 1 makes an emergency 4
   times likelier" to every diabetes, where `illnessWeek` raises emergencies for type 1 only. It now reads the type
   (`render-after-1.txt`, type 1 lapsed and type 2 untreated).
4. **Readiness at its ceiling said something held it back.** `readiness` clamps at 100, so a measure short of its best
   took nothing off a shown 100, and the look said "100, and nourishment is what's costing you". It now says the day
   is as good as it gets, with what's short of its best; the measures still open from it. Found in the before render
   (the dir1 and dir2 saves). Display only: `dragsOn` and the figure are unchanged.

## For The Coordinator

5. **"Sleep owed 1 hours" on the Player Profile.** `src/ui/workspaces/ProfileWorkspace.tsx:491`,
   `` note={`Sleep owed ${Math.round(w.sleepDebt)} hours`} ``: the profile area's source (subsystem profile), not
   health's. The same fault as 1. Suggested: `` `${plural(Math.round(w.sleepDebt), 'hour')} of sleep owed` `` with
   `plural` from `@/engine/core/text`, which reads "1 hour of sleep owed". Note that a day awake adds sleep debt as it
   goes (about a third of an hour each hour), so the wellbeing look calls the normal day's hours "about what a normal
   day awake adds", not owed; "owed" for every figure, as the Profile says, is what `wellbeing.tsx` stopped saying on
   2026-10-12.
6. **The person look's summary, and Home's How You Are line, say "dial".** `wellbeingSummary` in
   `src/engine/systems/life.ts` (the home area's): "Holding up, and no dial is far enough out to be worth naming."
   Found in `render-after-1.txt`. Suggested: "Holding up, with nothing far enough out to name." (or any wording without
   "dial").
7. **Stray spaces in the gazetteer's country table.** `src/engine/content/world-data.ts:42`, `COUNTRY_TABLE`, which
   `rows()` splits on tabs without trimming: Bonaire's name is `"Bonaire, Saint Eustatius and Saba "` (a space after
   it), Curacao's capital is `" Willemstad"` (a space before it), and Heard Island's dialling code is `" "`. Found by a
   script that read every field of the table for a leading or trailing space, while marking world-data for batch 3
   (its status reason names this file). What a player meets: a sentence that ends on Bonaire's name has a space before
   its stop ("a citizen of Bonaire, Saint Eustatius and Saba ."), and a select or list shows the trailing space.
   Curacao's capital is mostly hidden by the place look, which finds the city by `CITIES.byName` (`normalise` trims)
   and shows the city's own name; anything that prints `country.capital` itself prints the leading space. Not fixed
   here: the gazetteer is kept as its source spells it, and the fix (trimming each field in `rows()`, or the three
   fields) changes the parse of all three tables, countries, regions and cities, so it's for the coordinator to place.
   Suggested: `const rows = (table: string) => table.split('\n').map((line) => line.split('\t').map((f) => f.trim()));`
   with a test that `WORLD_COUNTRIES` has no field with a leading or trailing space.
   **Fixed** on 2026-10-17 by the cross-area pass (`crossarea/defects.md`, 4), as suggested: the parse trims every field,
   in the generated file and in the builder's template. What's above was true until then.
