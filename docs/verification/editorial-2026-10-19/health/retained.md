# A Sample Of What The Health Area Kept

Brief 15, 2026-10-19. Sources kept in the second pass, each with its words and the reason recorded for it, so the reasons
can be judged as well as the rewrites. Every reason is in `docs/text/second-pass/health.json`.

## Batch 1

1. **`src/ui/looks/wellbeing.tsx#DIALS [energy]`.** "82/100. What’s left in you for today. Sleep brings it back."
   - A one-line way into Energy beside its figure: what's left for today, and the one thing that brings it back.
   - It's said in the pronouns of whoever it belongs to ("What’s left in her for today").
2. **`src/ui/looks/wellbeing.tsx#DIALS [morale]`.** "62/100. Your mood. When it’s up, a night clears more of the day’s
   stress."
   - It calls morale your mood, as the glossary does.
   - It gives the effect a player can use, which is what the Morale look then puts a figure on.
3. **`src/ui/looks/wellbeing.tsx#bodyWords`.** "5 ft 7 in and 143 lb, with a body mass index of 22.5, in the healthy
   weight range."
   - It says a body in the units where the person lives.
   - Its WHO range is in words, lowered from the label so it reads as a sentence.
4. **`src/engine/content/lifespan.ts#AGING`.** "Staying fit takes steady work now, as each year lowers what training can
   reach a little more."
   - Each band's line follows the fitness figure.
   - It says in everyday words what age does to training and to a night, true to the band's own rates. At 70: "A year
     now takes more from the body than a whole decade did in the twenties", 1.80 a year against the twenties' 0.12.
5. **`src/engine/content/guide/body.ts#BODY [optional]`.** "Skipping ahead through the night sleeps for you, but it’s a
   poorer night that stops at 74 energy."
   - It's an option with its catch stated.
   - The figure comes from `COASTING_ENERGY_CEILING`.
6. **`src/engine/systems/body.ts#bodyUnits`.** "In feet, inches and pounds, the units of the United States, where you
   live."
   - It says which units a body is shown in, and why, in one sentence.
   - The country takes its article (`theCountry`).

## Batch 2

7. **`src/engine/systems/health.ts#onsetMonth`.** Title "Diagnosed: Asthma"; body "A doctor found it this month. Its care
   starts now, and each month you pay what your plan doesn’t cover. You can see the cost, or stop the care with Let It
   Go, on Papers, under Health Cover."
   - A notification in the brief's order: what happened, what it costs, and where to act, with the button's name.
8. **`src/engine/systems/health.ts#fluMeans`.** "It lasts until December 19, 2026, and it has cost you some condition
   and energy. Work Out waits until it passes, and Call In Sick, on School, excuses a day of classes."
   - It says when the flu ends, what it took, and the two things that change that week.
   - "Work Out waits" is the guide's own phrase for that menu line.
9. **`src/engine/systems/injury.ts#trainingRefusal`.** "Not with a sprained ankle; it has 5 days yet to mend."
   - It sits beside a training button and names the injury and the days left.
   - Four guide entries in three other areas quote it, and it reads as speech, not as an error code.
10. **`src/engine/systems/health.ts#prepayRefusal`.** "Prescriptions are free from age 60."
    - Each of the four refusals of England's prepayment certificate gives one reason, with the figure where there is
      one.
11. **`src/engine/systems/therapy.ts#registerTherapy`.** "After 8 sessions with Yale Mental Health & Counseling, your depression
    has lifted. It no longer needs care, and it no longer takes from your morale."
    - It says what happened and both things that change because of it.
12. **`src/engine/content/clinics.ts#CLINICS`.** "St Thomas' Hospital Emergency Department (A&E)", "Farmacias del Ahorro,
    La Espiga".
    - Real places by their own names and addresses, kept as each publishes them, so a player could find them.
13. **`src/engine/systems/health.ts#hardshipRefusal`.** "None of the months it checked, December 2026, had a stay in
    hospital, the one hardship the game counts."
    - It names the months checked, what was missing, and that the game counts only that hardship.

## Batch 3

14. **`src/engine/content/world-data.ts#COUNTRY_TABLE`.** Cambodia's row: "kh KH Cambodia Phnom Penh AS KHR 16249798 181040 Riels 855 km,fr,en".
    - GeoNames' table as published.
    - Cambodia's place look reads its fields as "The capital is Phnom Penh", the currency title-cased, a calling code
      of "+855" and the languages by name.
    - Each is a real fact kept exact, and the file is generated, not edited. Cambodia's "Riels" is the exception, listed
      in defects.md, 5.
15. **`src/engine/content/geography.ts#CALIBRATED_CITIES [us-az-phoenix]`.** "Phoenix", "America/Phoenix", "no daylight
    saving".
    - The city's name as the gazetteer spells it, and its time zone id, never shown.
    - A true tag, which Home's place line shows as "No Daylight Saving".
    - The place look's sentence around the tags is another area's (defects.md, 6).
16. **`src/engine/core/performer.ts#PERFORMER_NOUN`.** "Actor", "Actress".
    - The word a player chooses at creation to be called, shown on the top bar and the last page of a life.
