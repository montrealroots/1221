# Brief 15: The Health Area

Read `prompts/common.md` first: it's how every area works. This is what's yours.

## Your Clone

- **The clone:** `/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad/e15-health`, on its branch `ed15-health`, from the pass's baseline commit. Work only there.
- **Your area id** for `--by`, your folder and your status file: `health` (`docs/verification/editorial-2026-10-19/health/`, `docs/text/second-pass/health.json`).
- **Your port** for the built app: 4288.

## What's Yours

171 sources and 38,342 words in 20 files, all Pending in the second pass at the start. Each file, biggest first (sources, words):

- `src/engine/content/world-data.ts`: 4 sources, 29,899 words
- `src/engine/content/guide/body.ts`: 8 sources, 3,695 words
- `src/engine/systems/health.ts`: 47 sources, 1,716 words
- `src/ui/looks/wellbeing.tsx`: 13 sources, 1,347 words
- `src/engine/content/clinics.ts`: 2 sources, 575 words
- `src/engine/content/geography.ts`: 61 sources, 355 words
- `src/engine/systems/therapy.ts`: 3 sources, 155 words
- `src/engine/content/lifespan.ts`: 1 source, 120 words
- `src/engine/systems/appointments.ts`: 6 sources, 106 words
- `src/engine/systems/injury.ts`: 6 sources, 103 words
- `src/engine/core/invariants.ts`: 1 source, 88 words
- `src/engine/content/body.ts`: 3 sources, 54 words
- `src/engine/systems/clinics.ts`: 2 sources, 32 words
- `src/engine/systems/body.ts`: 2 sources, 23 words
- `src/engine/core/deciders.ts`: 2 sources, 21 words
- `src/engine/content/injury.ts`: 1 source, 20 words
- `src/engine/core/rng.ts`: 1 source, 14 words
- `src/engine/systems/mortality.ts`: 3 sources, 9 words
- `src/engine/content/carevisits.ts`: 4 sources, 8 words
- `src/engine/core/performer.ts`: 1 source, 2 words

## What To Watch For

**What's yours:** illness, injury, care, appointments, prescriptions, bills, health cover and its systems, stamina, energy and the wellbeing looks, and the How This Works entry `guide/body.ts`. The world's reference data (`world` in the inventory) is yours too: places, countries, climate and the rest.

**From the working reference:** in the table, "Your share is $50.00, due on November 25, 2026, when it's taken from your current account. If it can't be paid then, it becomes medical debt."

**Say plainly:** health (illness, injury, care, cover) versus stamina (an ability) versus energy (what's left today) versus condition (a wellbeing measure). The glossary's Core rows say exactly what each is.

**Interactions to read whole:**

- an injury, its notice, Call In Sick, the care, the bill, and the bill paid or turned into debt;
- a doctor's appointment booked, then visited;
- a prescription filled;
- health cover chosen.

**Checking account:** the glossary's word from this brief, where your notices say "current account".

**The world's data:** a place's name is the gazetteer's. Prose about a country or a city (its money, its taxes, its languages) is reviewed like any other text. A real fact stays exact.
