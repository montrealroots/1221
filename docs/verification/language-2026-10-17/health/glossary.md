# Health, Body And Time: The Health Area's Words

For `docs/GLOSSARY.md`'s "Health, Body And Time" section, in its columns, written by the health area of brief 14 on
2026-10-17 from the screens and the rules. The calendar and the clock are the frame area's.

| Say | What It Means | Instead Of |
|---|---|---|
| **wellbeing**, **your wellbeing** | The eight measures How You Are and your own page show: Energy, Stress, Sleep Debt, Morale, Condition, Fitness, Nourishment, Hygiene (`DIALS`, `person.wellbeing`). A look of one is kinded "Your Wellbeing". | dial, the eight dials, One Of Eight |
| **measure** | One of the eight, when it needs a common noun: "the measures it moves". | dial |
| **energy** | What you have left for today. Every waking hour uses some, faster with sleep owed, and only sleep brings it back (`applySleep`); a meal doesn't. | what the day has left in you |
| **condition** (the measure) | How sound your body is, after illness, hunger, stress over 75 and short nights. A night of real rest mends it as far as fitness allows (`mendsTo`). It sets a night's energy, the mood's settling point, a sick day's excuse under 55, and the odds of a year being your last. An injury doesn't lower it. | what a body is fit for |
| **a long-term condition** | Depression, asthma, high blood pressure, diabetes or arthritis (`CONDITION_LABEL`, `health.chronic`): kept up or left untreated on Papers, under Health Cover. Never "a condition you carry", which sits one press from the Condition measure. | a condition you carry, A Condition You Carry |
| **kept up**, **left untreated** | A long-term condition with its care paid each month, or without it. The buttons are Keep It Up and Let It Go. | kept up / left alone |
| **fitness** | How trained your body is: the same figure as **Stamina** on the Player Profile (`attributes.ts` reads `wellbeing.fitness` for stamina). Work Out and the training classes build it; it holds three days, then falls toward everyday life's 35. Rest doesn't build it. | |
| **stamina** | The ability that is fitness, as the Player Profile names it: how long you keep going in a long scene or a night on stage. | |
| **readiness** | How sharp you'll be at today's work: seven of the eight measures, all but fitness, from 5 to 100. It sets what a session builds, and under 60 it costs you in judged work. The look is kinded "How Ready You Are Today". | How Well You Would Do Today, the condition judged work meets you in |
| **sleep debt**, **sleep you owe** | Hours of sleep owed: each waking hour adds about a third of one, a night pays it back. The hours a normal day awake adds are said as that, not as owed. | on the books |
| **health** | Illness, injury, long-term conditions, your care and its bills, and your health cover, all on Papers, under Health Cover. Not energy, condition or stamina. | |
| **laid up** | Kept from classes, work and training by an injury (`laidUp`, `offWorkUntil`); the School excuses the absences. | off work |
| **your share** | What a plan leaves you to pay for a piece of care: "Your share is $187.20". | what the plan leaves |
| **what your plan doesn't cover** | The same, said of a month's care for a long-term condition. | at what the plan leaves |
| **health cover** | A plan that pays toward care: Yale Health, Medicaid (HUSKY D, Medi-Cal), the Essential Plan or Covered Connecticut, or a marketplace plan. **Public cover** is the state's programs. | |
| **the marketplace** | The ACA exchange: open in open enrollment, or for 60 days around a loss of cover. | |
| **out of status** | A noncitizen who has stayed past their permission to be in the country. | stayed past your status |
| **medical debt** | A bill unpaid at its due date, owed to Your Providers in the Owed For Medical Care account. | |

## To The Coordinator: Core

- **energy.** Core says "Sleep and food bring it back." Only sleep does: `applyLookingAfter` gives a meal nourishment
  and mood, never energy, and `applySleep` (and a skipped-through night, which sleeps) is the one thing that raises it.
  Suggested: "How much you have left today. Only sleep brings it back."
- **condition.** Core says "How fit your body is for work today, after illness, injury and rest." An injury doesn't
  move condition (it weighs on morale and stress, `INJURY.weighs`), and condition changes over nights, not within a
  day. Suggested: "How sound your body is, after illness, hunger, stress and short nights. Rest mends it, as far as
  your fitness allows."
- **"condition" twice.** The game uses the word for the measure and for a long-term illness (Papers' "Your
  Conditions" panel, the papers area's). The health area's text now says "a long-term condition" for the second.
