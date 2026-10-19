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
