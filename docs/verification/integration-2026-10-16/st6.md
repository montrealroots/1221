# ST4 And ST6: Drama On Both Sides, And Strength Against The Grain, 2026-10-16

The owner's brief of this pass, section 3: "For ST4, research and add suitable drama material with genuinely different
circumstances, including public or confrontational scenes where appropriate… For ST6 and H4, investigate the actual
input weights, difficulty, preparation, and opportunity distribution." The criteria are `../stage-2026-10-16/criteria.md`;
the measurements are `tools/interpretation.ts -- --fresh --stage`, kept beside this file (`st3/`).

## ST4: Met

**Before** (`baseline/stage.json`): drama, 25 materials, restrained better-suited on 25 and expansive on 0. Every one was
a private naturalist two-hander, so no drama scene argued for size.

**What was added** (`b2cb6998`, `src/engine/content/scenes-public.ts`). Four drama scenes from public-domain plays, each
a two-person scene read from the translation cited, its table work and its circumstances written down and committed
before any measurement of how it comes out:

| Scene | From | Its Circumstances, From The Text |
|---|---|---|
| `enemy-2` | Ibsen, An Enemy of the People, Act Two (tr. Sharp, 1911) | the brothers having it out (confrontation 3), in his own sitting room with the family sent out (intimacy 1), Peter wanting every word kept from the public (concealment 1) |
| `strife-1` | Galsworthy, Strife, Act One (1909) | Roberts speaking for the men to the whole Board (address 2), every demand refused to his face (confrontation 3) |
| `justice-2` | Galsworthy, Justice, Act Two (1910) | a crowded court, every question asked for the jury (address 3), the defense taken apart (confrontation 2), what he can't remember (concealment 1) |
| `weavers-1` | Hauptmann, The Weavers, Act One (tr. Morison, 1912) | before the weavers waiting with their webs (address 2), insult for threat to the master's face (confrontation 3), a cool business tone over rage (concealment 1) |

Two editions the instructions named were wrong and were corrected from what Project Gutenberg holds (#2446 and #2296
are R. Farquharson Sharp's translations). Considered and left out, each for having no second part to cast: An Enemy of
the People's public meeting, Pillars of Society's fourth act, Frome's speech to the jury, Roberts's speech at the works.
Appended last: a seeded life meets them only once fewer than four earlier scenes fit its draw as well, so no existing
life's scenes moved.

**After** (`st3/stage-restraint-draw.json`, the final engine): drama 29 materials, **restrained better-suited on 25 and
expansive on 4**. `strife-1` (expansive by 1.06), `justice-2` and `weavers-1` (0.81 each) suit size by a band;
`enemy-2` only narrowly (0.06), its privacy and concealment weighing against its quarrel. The 25 private scenes all still
suit restraint, none of their signals touched. Comedy 13 / 15 and tragedy 4 / 16, as before.

## ST6: Not Met

**As written:** a restrained specialist (emotional depth 85, composure 75, focus 75, the rest at 45.6) comes out ahead
playing restrained on at least 25% of the materials where expansive suits better.

| | Before (`ef784ccd`) | After (final engine) |
|---|---|---|
| Expansive specialist, against the grain | 21 of 49 (42.9%) | 21 of 49 (42.9%) |
| Restrained specialist, against the grain | 7 of 34 (20.6%) | **8 of 38 (21.1%)**: two short of a quarter |

**What was found, and changed.** The stage account put it down in part to `APPROACH_EFFECT`: restrained drew on emotional
depth alone, where expansive drew presence 1, vocal 0.5 and physical 0.5, and where the criterion itself named the
restrained specialist strong "in what restrained draws on (emotional depth, then composure and focus)". Restraint draws
on the control that holds the feeling (Stanislavski, "Internal and External Control and the Finishing Touches", An
Actor's Work, tr. Benedetti, 2008, pp. 536–542, quoted at `APPROACH_EFFECT`). So from evaluation-9 it draws composure
0.5 on believability and focus 0.5 on consistency, as much in all as expansive draws, each where the task doesn't read it
already. A first placing of both on consistency changed nothing a test could see (consistency reads composure at half
already) and was caught and corrected (`tests/integration-stage.test.ts`).

**It moved ST6 by nothing.** Measured with each change alone: the new drama scenes took the count from 7 of 34 to 8 of 38
(`enemy-2`, gap 0.06, is a restrained win); the draw, on either placing, moved no case. So the draw was never the cause.

**What holds the restrained specialist back** (`st6-cases` below, exact differences, the final engine):

- **The size of the grain.** Against the grain the even actor loses about 3.7 points for each unit of suitability gap
  (0.06 → 0.36; 1.0 → 3.4; 2.0 → 7.4). The specialist's strength lifts its restrained take by 1.2 to 4.5 points. It
  wins every case with a gap up to 0.5 (`caesar-4-3` by 0.06, which shows as a tie) and none from 0.57.
- **Where the scenes that suit size are.** Of the 38, 29 have a gap of 0.57 or more: Antigone's and Oedipus's public
  defiance, Julius Caesar, Medea, Electra, the Bacchae, Blood Wedding, Woyzeck, The Playboy, Richard III's wooing,
  Strife's boardroom. A restrained Antigone before the palace is a misfit the scene itself argues against.
- **Where each side's draw lands.** Restraint's emotional depth lands on believability, the scene's heaviest dimension
  (weight 3) and one with a technique term in it, so an ability moves it less (the specialist's believability capacity
  0.71 against the even actor's 0.55). Expansive's presence lands on connection, which has no technique term (0.81
  against 0.55). So the expansive specialist's strength carries further, and the grain's cost, scaled by the dimension
  a side leans on, falls on believability for restraint.

**Not done, and why.** Raising restraint's draw past expansive's, or weakening the grain, would let the restrained
specialist beat strong scenes more often. Neither has a source: the draw is now what the research supports and equal to
expansive's, and the grain is measured by I1 to I5, ST1, ST7 and ST8, which hold. ST6 is reported as measured.

**For the owner.** (1) Accept that a restrained specialist rarely carries a scene built on public confrontation, as the
table shows, and keep ST6 as the record of it; (2) or ask for a change with a stated basis: weighing restraint's draw more
than expansive's, or the grain scaled to the dimension's share, each of which moves the interpretation criteria and
would be measured against them first.

## What Else Holds On The Final Engine

`st3/stage-restraint-draw.json`: ST1 restrained 49 / expansive 37 of 89; ST2 75 of 75 rest on the scene; ST5 2,385 of
2,385; ST7 88 of 90; ST8 75 of 75; F1 and F2 hold. I1 at 100 on 8,010, 9,117 and 2,385 checks; I2 24.2%, 20.8%, 32.9%;
I3 spread 1.28, 1.19 and 3.43; I4 the even actor follows suitability on 100%; I5 ≥ 97.8%. ST3 as `st3.md` says.

## Proof

- `tests/integration-stage.test.ts`: drama suits both sides and the 25 before still suit restraint; the court and the
  boardroom suit size for their circumstances, which the screen shows with each reason; a student meets the new scenes
  in Scene Study once the earlier ones are studied; a restrained take rises with focus and composure more than an
  expansive one. Mutations, each killed: restraint drawing emotional depth alone; both its new draws on consistency.

## The Cases (`st6-cases`, the restrained specialist against the grain, exact, the final engine)

| Material | Gap | Even Actor, Restrained − Expansive | Specialist, Restrained − Expansive |
|---|---|---|---|
| muchado-4-1 | 0.04 | −0.06 | +1.16 |
| enemy-2 | 0.06 | −0.36 | +1.23 |
| earnest-2 | 0.12 | −0.31 | +0.88 |
| wayoftheworld-4 | 0.12 | −0.35 | +0.83 |
| stoops-2 | 0.12 | −0.35 | +0.82 |
| hamlet-3-1 | 0.25 | −1.04 | +0.65 |
| orig-runway | 0.31 | −1.17 | +0.70 |
| Much Ado About Nothing | 0.31 | −1.04 | +0.41 |
| caesar-4-3 | 0.50 | −1.91 | +0.06 (a tie as shown) |
| A Midsummer Night’s Dream | 0.57 | −1.81 | −0.08 |
| scandal-2-1 | 0.62 | −1.79 | −0.19 |
| Macbeth, agamemnon-855 | 0.75 | −2.45, −2.58 | −0.25, −0.28 |
| The Winter’s Tale, pygmalion-4, justice-2, weavers-1 | 0.79–0.81 | −2.69 to −3.24 | −0.31 to −0.66 |
| shrew-2-1, proposal, dream-3-2, The Bear, A Marriage Proposal, bacchae-451 | 0.87–0.93 | −2.44 to −2.88 | −0.58 to −0.78 |
| hamlet-3-4, faustus-3, strife-1 | 1.00–1.06 | −3.43 to −3.94 | −0.80 to −0.89 |
| The Playboy, electra-328, medea-446, Major Barbara, An Enemy Of The People | 1.16–1.37 | −3.51 to −4.95 | −1.40 to −1.71 |
| richard3-1-2, Woyzeck, Salomé, Blood Wedding | 1.44–1.75 | −4.76 to −5.60 | −1.92 to −2.54 |
| antigone-441, oedipus-300, Julius Caesar | 2.00 | −6.37 to −7.45 | −2.54 to −3.09 |

## Brief 09: Every Case Traced, And Why Nothing Was Changed (2026-10-16, Later)

The owner's brief 09, section 2: "Investigate why the measured result remains 8/38 rather than meeting the stated target.
Trace individual failing cases through abilities, material, suitability, preparation, and scoring. Implement justified
balance or content corrections. Preserve meaningful expansive acting and scene-specific demands. Do not add an arbitrary
restraint bonus, remove difficult cases, or manufacture a 50/50 split."

**Reproduced first** on `d7127819` (`baseline-09/stage.json`): restrained **8 of 38**, expansive 21 of 49. With the four
scenes played out to a house (`h4.md`, `content/scenes-house.ts`), each suiting size by its circumstances (spoken to
many), the restrained half is **8 of 42** (19.0%); none of the four is a restrained win, and none was taken out.

**The trace** (`st6-09.json`, `npx vite-node tools/interpretation.ts -- --st6 <file>`, added for this): every case of both
halves with each side's suitability and the signals it rests on, the specialist's own side less the other at full
precision, what the grain gave or cost each side, and the specialist's lift (its own side less the other with the grain
at nothing, less the even actor's).

**Preparation** is the same on every case: every part complete, the choice rehearsed in, so it decides none. What does:

1. **The grain isn't what holds the restrained half back.** On its cases the restrained side against the grain loses up
   to 1.74 points and the expansive side with it gains up to 2.64; per unit of suitability gap the swing between them is
   2.04 points on average (1.70 to 2.45, cases a band apart or more), against 2.40 (1.71 to 3.20) on the expansive half's.
   The grain costs the restrained specialist less per unit of gap, not more.
2. **The restrained half's cases are harder: 32 of 42 have a gap of 0.57 or more** (mean 0.93), against 30 of 49 (mean
   0.75) for the expansive half: Antigone's, Oedipus's and Julius Caesar's public defiance and orations, the farces'
   shouting matches, Strife's boardroom, the new speeches to a crowd. Read again against their texts (each `why` in
   `content/material.ts`), none was misread; the tragedies carry their register's Played Large and States At The Limit
   (−0.75 for restraint before the scene says anything), which is what Greek and Shakespearean tragedy asks, and the
   brief rules out changing a genre's register to move a criterion.
3. **The restrained specialist's lift is smaller: 1.15 against 1.57.** Taken apart: the leans give 0.56 and 0.51, the
   same; the draws give **0.52 against 0.94**. Restraint's draw of emotional depth lands on believability, which reads
   emotional depth already as its largest input on every side (1, and 2.5 more for each share of grave), so it adds
   little; expansive's presence lands on connection, which on a partnered scene reads listening as much as presence, so
   it adds much. Composure (0.5) and focus (0.5) add 0.10 and 0.04.
4. **So the restrained specialist's strength shows whichever way it plays.** On every material its better side is ahead
   of an equal-budget even actor's (everything at 50) better side on 91 of 93 as shown (mean +2.03; the expansive
   specialist 73 of 93, +1.02); and playing restrained against the grain, it's ahead of that even actor playing the
   better-suited side on **26 of 42** at full precision (the expansive specialist playing expansive against the grain:
   21 of 49). Its strength carries the harder
   side; what it doesn't do is change which of its own two sides is better, because the feeling it's strong in is read
   on both.

**What was considered, and why none was adopted** (each counted on ST6 as the criterion counts it, in the trace):

| Change To Restraint's Draws | ST6, Restrained | ST6, Expansive | Why Not |
|---|---|---|---|
| As built | 8 of 42 | 21 of 49 | |
| The control doubled (composure 1, focus 1) | 10 of 42 | 22 of 49 | a bonus with no size behind it: Stanislavski's chapter names the control, not how much |
| The control in place of emotional depth | 8 of 42 | 21 of 49 | moves nothing |
| Emotional depth on connection instead | 16 of 42 | 30 of 49 | works only through the weakest-dimension term (connection is the restrained specialist's weakest), and makes the scale choice a specialist's on both halves, the grain less; no source puts restraint's feeling on connection |
| Composure on connection instead | 16 of 42 | 28 of 49 | the same: any draw on connection lifts this specialist's weakest dimension |

No circumstance read wrongly was found, no demand that the evidence shows misweighed against restraint (the grain's
cost per unit gap is lower for it), and no source for drawing restraint's craft larger or elsewhere. So nothing in the judge
changed for ST6, and the difficult cases stay.

**ST6 as written: not met**, 8 of 42 (and 8 of 38 on the catalog before the new scenes). Not counted as met.

**ST6′, proposed (not counted):** *strength can carry the harder side* read as the criterion's title says it: each
specialist, playing its own side where the other suits better, comes out ahead of an equal-budget even actor playing the
better-suited side on at least 25% of those materials. Measured: restrained 26 of 42 (61.9%), expansive 21 of 49 (42.9%).

**For the owner.** ST6's second half asks a restrained specialist to beat itself playing expansive, and the judge reads
the feeling it's strong in on both sides (believability, the heaviest dimension, reads emotional depth whichever way a
scene is played), so its side choice moves less than an expansive specialist's. Recommended: keep the judge as it is,
which the interpretation criteria and ST1, ST7 and ST8 hold, and adopt ST6′ in place of ST6's second half; or, if a
restrained specialist should gain more from its own side, say which reading of restraint to adopt (its feeling read on
the connection, its control drawn larger), and it will be measured against I1 to I5 and the stage criteria first.

### After Brief 09's Follow-Up (2026-10-16, Later Still)

Measured again after `evaluation-10` and Scapin's sack scene (`followup-09/`, `h4.md`'s follow-up section): restrained
**9 of 42** (8 before), expansive 22 of 50 (21 of 49; the new scene suits restraint by what it hides). The restrained
specialist's lift as built 1.132 and the expansive's 1.496 (1.145 and 1.571 before); the readings considered above move
as little (`followup-09/st6-cases.json`, `considered`). ST4 and ST7 hold (comedy 14 / 16; 95 of 95). ST6 as written isn't
met; ST6′ is as proposed.
