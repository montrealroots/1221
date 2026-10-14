# Every Attribute, From The Code

Phase 1 of the owner's brief "Perfect The Attributes, Genres, And Their Integration Through Demonstrable Gameplay".
Written from `attributes-matrix.json`, which was read from the code at `6808cfc7`. The effects come from `baseline.json`
(`npx vite-node tools/ag-baseline.ts`). They are the change in the whole, in points, when the even actor (every ability 50,
every technique 50, fully prepared, readiness 100, no draw) gains +10 on one ability. They are measured over 427 pieces:
298 briefs, 56 class scenes, 30 nights, 30 castings and 13 coursework templates not judged as scenes.

The code has **12 abilities** (`ABILITY_DEFS`, `content/abilities.ts:36-133`) and **17 techniques** (`TECHNIQUES`, `abilities.ts:148-151`). There are 27 practice exercises, one for every ability but stamina (a workout) and discipline (a day kept), and one for every technique. They are read by 13 task profiles across 6 dimensions.

## Rules Common To All

- **scale**: 0 to 100 on one scale; stamina is full at ceilingAt(age).fitness (attributes.ts:155), every other ability at 100; a technique counts as mastered at 90 (abilities.ts:160) and is read as min(1, level/90) (evaluation.ts:266)
- **deliberateGain**: abilityGain, attributes.ts:201-207: max(0.42*w*f*max(0,1-L/reach)^1.5, 0.42*w*f*max(0.25, 1-L/100)) points an hour; reach 100 for practice
- **ordinaryGain**: develop with deliberate:false toward reachOf (school.ts:950): a craft skill's ceiling (admission + 26, CEILING school.ts:876), the kin's mean for listening, imagination, focus, adaptability, 100 for the rest
- **classGain**: grow, school.ts:991: craft[skill] += 0.42*w*focus*max(0,1-L/ceiling)^1.5 (sessionGain school.ts:905); no same-day halving, no discipline lift, never past the ceiling
- **sameDay**: each repeat of one source on one target the same day keeps half (DEVELOPMENT.repeat 0.5, attributes.ts:281), develop path only
- **dailyCap**: practice.exercise refused at 4 hours a day (practice.ts:61, PRACTICE.dailyHours content/practice.ts:138)
- **disciplineLift**: every develop gain x (1 + 0.1*(discipline-50)/50), attributes.ts:280; not applied to grow or nudge
- **dayFocus**: focusAt = clamp(readiness/80 * hourFit, 0.3, 1.2), school.ts:910-929: the day's focus, a different thing from the Focus ability; every step and session reads it, no ability does
- **evaluation**: an ability's term is level/full inside a dimension's weighted mean (evaluation.ts:259-284); abilities a task does not read change nothing (tests/briefs.test.ts:88, tests/evaluation.test.ts:138)
- **conditionReach**: fatigue under readiness 60, the flu, an injury and a concussion reach the dimensions their task names (evaluation.ts:344-356); no ability changes how a condition reaches the work, except stamina's drain inside a piece (piece.ts:276) and composure and adaptability's recovery after a slip (piece.ts:257, 297)
- **decay**: none, but stamina: held 3 days after a workout, then -0.18 a day to 35 (life.ts:84, 103, 974)

## Summary

| Ability | Pieces Moved | Mean Effect Of +10 | Spread (cv) | Specialist Ahead Where It Reads Most | Specialist Ahead Elsewhere | Flags |
|---|---|---|---|---|---|---|
| Emotional Depth | 421 of 427 | +1.24 | 0.24 | 211 of 211 | 205 of 216 | near-universal bonus; duplicate mechanic; misleading description |
| Presence | 417 of 427 | +0.28 | 0.44 | 3 of 263 | 0 of 164 | shallow contribution; duplicate mechanic |
| Listening And Responsiveness | 418 of 427 | +1.06 | 0.34 | 219 of 219 | 143 of 208 | near-universal bonus; misleading description |
| Imagination | 424 of 427 | +0.69 | 0.2 | 139 of 225 | 2 of 202 | flat bonus; misleading description |
| Focus | 423 of 427 | +0.44 | 0.49 | 29 of 270 | 0 of 157 | misleading description / name collision; shallow contribution |
| Memory | 416 of 427 | +0.3 | 0.25 | 1 of 332 | 0 of 95 | misleading description; shallow contribution |
| Adaptability | 418 of 427 | +0.5 | 0.36 | 45 of 222 | 0 of 205 | misleading description; shallow contribution |
| Composure | 417 of 427 | +0.3 | 0.3 | 1 of 271 | 0 of 156 | shallow contribution; misleading description; duplicate mechanic |
| Vocal Expression | 298 of 427 | +0.39 | 0.64 | 80 of 169 | 0 of 258 | specialist only partly rewarded; duplicate mechanic |
| Physical Expression | 298 of 427 | +0.36 | 0.62 | 62 of 168 | 0 of 259 | specialist only partly rewarded; duplicate mechanic |
| Discipline | 386 of 427 | +0.18 | 0.49 | 4 of 252 | 0 of 175 | misleading description; misleading description; partly unread; shallow contribution |
| Stamina | 390 of 427 | +0.33 | 0.57 | 10 of 245 | 0 of 182 | inconsistent reading; misleading description; shallow contribution |

"Where it reads most" means the pieces where the ability's +10 effect is at or above the median of its nonzero effects. A specialist has 85 on the ability and the other eleven lowered evenly, to keep the sum of 600.

## Emotional Depth

- **Represents:** Reaching real feeling under imaginary circumstances and letting it show (abilities.ts:39).
- **Kept in:** person.craft.emotion (attributes.ts:82)
- **Developed by:**
  - practice.exercise sense-memory (practice.ts:128; content/practice.ts:53): deliberate abilityGain, weight tier*focusFactor, focus = day's focus; transfer to imagination at 0.3 under Variation; 4 h/day; half per repeat same day; matched tier 1, off by one 0.75/0.8, two 0.5
  - class meetings whose course lists emotion (school.ts:3110 grow): 0.42*weight*focus*(1-L/ceiling)^1.5, weight 1 (0.85-1.2 by the last showing's band); ceiling = admission + 26; no halving
  - a performance night (playNight) (school.ts:2154-2161): grow(emotion, focus*nightFactor, 1*scale); ceiling
  - self-tape practice transfer (Variation) (content/practice.ts:121): 0.3 x tier; transfer source halved
- **Read by** (weights are the input's weight against its dimension's total):
  - scene.believability w3 of 4 (tasks.ts:80)
  - song.believability w2 of 3 (tasks.ts:107)
  - partnered.connection w1 of 2 (tasks.ts:128)
  - improvisation.believability w2 of 3 (tasks.ts:137)
  - clown.believability w1 of 2 (tasks.ts:146)
  - camera/tape/tapeOnFeet.believability w3 of 4 (tasks.ts:152,168,184)
  - audition.believability w2 of 3 (tasks.ts:195)
  - performance.believability w3 of 4 (tasks.ts:206)
  - BLEND_EFFECT believability +0.3 a held beat (approaches.ts:97)
  - Restrained believability +1 (approaches.ts:47)
  - brief readings' draws x2 (briefs.ts:318-323)
- **Normalization:** level/100 in each dimension's weighted mean; dimension weights normalized to the task's total
- **Effect of +10** (pieces moved, mean, max):
  - all: 421/427 pieces moved, mean +1.24, cv 0.24
  - brief: 298/298 moved, mean +1.39, max +1.95
  - scene: 56/56 moved, mean +0.9, max +1.1
  - night: 30/30 moved, mean +1, max +1.3
  - casting: 30/30 moved, mean +1.03, max +1.3
  - coursework: 7/13 moved, mean +0.49, max +1.9
- **Specialist against the even actor:** where it reads most, 211 of 211 (mean 3.03); elsewhere, 205 of 216 (mean 0.99). By kind: brief 298/298 (2.53), scene 56/56 (0.78), night 29/30 (0.93), casting 30/30 (1.12), coursework 3/13 (-0.44).
- **Visible:** Player Profile, Attributes And Craft (ProfileWorkspace.tsx:314-356); the ability's look (looks/actor.tsx:90-147); a brief's What The Take Weighs (BriefPane.tsx:168-180); work looks' limits (looks/actor.tsx:250); practice feedback (practice.ts:164-194)
- **With preparation:** believability reads interpretation and memorization prep; capacity is multiplied by prepared (floor 0.35)
- **With genre:** none directly; a brief's genre-known part (prep 'genre') sits on interpretation only
- **With condition:** fatigue reaches believability on every task that reads it; the flu and an injury don't
- **Bounds and mastery:** 0-100, full 100; no decay; at 100 practice says it's full and gains 0
- **Tests:** tests/briefs.test.ts:88 (every brief, every ability: unread changes nothing, read raises); tests/briefs.test.ts:146 (held beat asks depth); tests/development.test.ts:65 (its exercise grows it)
- **Distinct contribution shown by a test:** none that shows emotional depth, and not another ability, changes a named outcome; the per-ability checks are generic loops
- **Flags:**
  - near-universal bonus: moves 421 of 427 pieces and is the largest single effect (+1.24 a +10); its specialist is the best of 13 equal-budget allocations on 268 of 298 briefs and 139 of 149 genres (baseline §1, §2, §3) (tasks.ts:80,152,168,184,206)
  - duplicate mechanic: grown by two formulas: develop (practice, halving, discipline lift) and grow (classes, nights, coursework; no halving, no lift) (attributes.ts:275; school.ts:991)
  - misleading description: develops says 'Scene study and its classes, performing, and the sense-memory exercise': true; affects omits partnered connection and clown (abilities.ts:40-41)

## Presence

- **Represents:** What a house or a camera sees beyond technique (abilities.ts:47).
- **Kept in:** person.attrs.presence; starts drawn 55 to 80 (attributes.ts:129-133)
- **Developed by:**
  - before every house (nerves) (attributes.ts:305-312): +0.0015 of what's left to 100 (nudge, share); no halving, no lift, no source cap
  - a remarkable night (school.ts:3286-3287, ESTIMATE.nights.presence school.ts:582): +0.02 of what's left; none
  - practice.exercise showing-for-classmates (content/practice.ts:62): deliberate; 4 h/day, halving
  - transfer from graded-exposure, clown-practice (Variation) (content/practice.ts:110,115): 0.3; halving
- **Read by** (weights are the input's weight against its dimension's total):
  - scene.connection w1 of 3 (tasks.ts:82)
  - improvisation.connection w1 of 2 (tasks.ts:136)
  - clown.connection w3 of 5 (tasks.ts:143)
  - tape/tapeOnFeet.connection w2 of 3 (tasks.ts:170,186)
  - audition.connection w2 of 2 (tasks.ts:198)
  - performance.connection w2 of 3 (tasks.ts:208)
  - Expansive connection +1 (approaches.ts:48)
- **Normalization:** level/100
- **Effect of +10** (pieces moved, mean, max):
  - all: 417/427 pieces moved, mean +0.28, cv 0.44
  - brief: 298/298 moved, mean +0.25, max +0.45
  - scene: 56/56 moved, mean +0.23, max +0.3
  - night: 30/30 moved, mean +0.49, max +0.6
  - casting: 30/30 moved, mean +0.49, max +0.6
  - coursework: 3/13 moved, mean +0.26, max +1.6
- **Specialist against the even actor:** where it reads most, 3 of 263 (mean -1.42); elsewhere, 0 of 164 (mean -1.87). By kind: brief 0/298 (-1.71), scene 0/56 (-1.66), night 0/30 (-1.05), casting 0/30 (-0.92), coursework 3/13 (-1.36).
- **Visible:** Profile, Attributes And Craft; its look; decided.ts:261 (a decider readout)
- **With preparation:** connection reads partner, blocking or rehearsal prep
- **With genre:** none
- **With condition:** fatigue reaches connection on most tasks
- **Bounds and mastery:** 0-100
- **Tests:** tests/attributes.test.ts:77 (a night read higher with more of it); tests/attributes.test.ts:25 (drawn 55-80)
- **Distinct contribution shown by a test:** tests/attributes.test.ts:77 shows a night rises with presence; nothing shows a specialist in it ahead anywhere
- **Flags:**
  - shallow contribution: +10 moves a piece by 0.28 on average; its specialist (85, others lowered) is ahead of the even actor on 3 of the 263 pieces that read it most, behind on every scene, night and brief (tasks.ts:82,170,198,208)
  - duplicate mechanic: grown by nudge (no halving, no lift) and by develop (practice) (attributes.ts:166, 311; school.ts:3287)

## Listening And Responsiveness

- **Represents:** Taking in a partner and answering what they actually do (abilities.ts:55).
- **Kept in:** person.attrs.listening
- **Developed by:**
  - practice.exercise repetition (partnered) (content/practice.ts:54): deliberate; 4 h/day, halving
  - Live focus on any exercise (practice.ts:112): 0.15 transfer; halving
  - classes in scene or improv (kin) (school.ts:3114): ordinary, weight x 0.5 (CLASS_ABILITY_SHARE); reach = mean ceiling of scene, improv
  - each night (school.ts:3268): ordinary weight 0.5; reach
  - a partner rehearsal kept (coursework.ts:1274): ordinary weight 1; reach
  - coursework partner step (coursework.ts:609 (PREP_ABILITY :562)): ordinary 0.25; reach
- **Read by** (weights are the input's weight against its dimension's total):
  - scene.connection w2, responsiveness w2 (tasks.ts:82,85)
  - partnered responsiveness w2, connection w1
  - improvisation responsiveness w3, connection w1
  - clown connection 1, responsiveness 1
  - tape connection 1, responsiveness 1
  - performance connection 1, responsiveness 2
  - FEATURE_EFFECT timing responsiveness +1/level, partner connection +1/level (approaches.ts:81,83)
  - Open responsiveness +1
  - withholding reader connection +0.5 (briefs.ts:151)
  - a partner slip covered by (listening+adaptability)/2 (briefs.ts:493, coursework.ts:853)
  - a classmate reader's timing 0.5+0.5*(listening+focus)/200 (briefs.ts:484)
- **Normalization:** level/100
- **Effect of +10** (pieces moved, mean, max):
  - all: 418/427 pieces moved, mean +1.06, cv 0.34
  - brief: 298/298 moved, mean +0.89, max +1.3
  - scene: 56/56 moved, mean +1.53, max +1.8
  - night: 30/30 moved, mean +1.48, max +1.8
  - casting: 30/30 moved, mean +1.76, max +2.1
  - coursework: 4/13 moved, mean +0.48, max +2.2
- **Specialist against the even actor:** where it reads most, 219 of 219 (mean 2.31); elsewhere, 143 of 208 (mean 0.19). By kind: brief 242/298 (0.66), scene 56/56 (3.07), night 30/30 (2.76), casting 30/30 (3.37), coursework 4/13 (-0.55).
- **Visible:** Profile; its look; brief weighs; workbook 'holds it back'
- **With preparation:** connection and responsiveness read the partner part, which a partner's attendance gates (coursework.ts:1253)
- **With genre:** none
- **With condition:** fatigue
- **Bounds and mastery:** 0-100
- **Tests:** tests/briefs.test.ts:88; tests/ensemble.test.ts (cover); tests/development.test.ts:65
- **Distinct contribution shown by a test:** none specific
- **Flags:**
  - near-universal bonus: its specialist is the best allocation on all 56 scenes, all 30 nights and all 30 castings (baseline §2) (tasks.ts:82,85,208,211)
  - misleading description: develops omits nights, which grow it every night (school.ts:3268) (abilities.ts:56)

## Imagination

- **Represents:** Inventing a character's world and the specific choices that make the text live (abilities.ts:63).
- **Kept in:** person.attrs.imagination
- **Developed by:**
  - practice.exercise given-circumstances (content/practice.ts:55): deliberate; 4 h/day, halving
  - brief Break It Down (briefs.ts:81, 435): ordinary 0.25 while the part rises; reach (character, script ceilings)
  - coursework interpretation step (coursework.ts:609): ordinary 0.25; reach
  - classes in character or script (school.ts:3114): ordinary x0.5; reach
  - plays.read (playreading.ts:136): 0.25, 0.125 again; fresh only
- **Read by** (weights are the input's weight against its dimension's total):
  - interpretation on every task that has it: scene w3 of 4, written 3 of 6, voice 1 of 2, song 2 of 2, movement 2 of 3, improvisation 3 of 4, camera/tape 2 of 3, audition 2 of 3, performance 2 of 3
  - LANGUAGE heightened +0.5, verse +0.8 (approaches.ts:101-102)
  - BLEND interpretation +0.2
- **Normalization:** level/100
- **Effect of +10** (pieces moved, mean, max):
  - all: 424/427 pieces moved, mean +0.69, cv 0.2
  - brief: 298/298 moved, mean +0.67, max +1.05
  - scene: 56/56 moved, mean +0.72, max +0.9
  - night: 30/30 moved, mean +0.75, max +0.9
  - casting: 30/30 moved, mean +0.7, max +0.9
  - coursework: 10/13 moved, mean +0.87, max +1.9
- **Specialist against the even actor:** where it reads most, 139 of 225 (mean 0.23); elsewhere, 2 of 202 (mean -0.42). By kind: brief 77/298 (-0.16), scene 31/56 (0.1), night 12/30 (-0.08), casting 12/30 (-0.1), coursework 9/13 (0.92).
- **Visible:** Profile; its look; brief weighs
- **With preparation:** interpretation reads interpretation, familiarity, notes and for briefs the genre part
- **With genre:** a brief's genre known is a prep part of interpretation (tasks.ts:169)
- **With condition:** interpretation has no conditions on any task: fatigue, the flu and an injury never reach it
- **Bounds and mastery:** 0-100
- **Tests:** tests/briefs.test.ts:88
- **Distinct contribution shown by a test:** none specific
- **Flags:**
  - flat bonus: the most uniform effect of all twelve (cv 0.20 across 424 of 427 pieces): it adds about the same to everything, which no material changes (tasks.ts interpretation rows)
  - misleading description: affects says 'how fast a part's interpretation is prepared': nothing reads imagination for speed (coursework.ts:592-593 reads traits, genreSpeed, featureSpeed and the day's focus); develops says 'revision of coursework', which trains adaptability (coursework.ts:562) (abilities.ts:64-65)

## Focus

- **Represents:** Holding attention where the work needs it (abilities.ts:71).
- **Kept in:** person.attrs.focus
- **Developed by:**
  - practice.exercise concentration (content/practice.ts:56): deliberate; 4 h/day, halving
  - coursework familiarity step (coursework.ts:562, 609): ordinary 0.25; reach (script, coldReading)
  - classes in script or cold reading (school.ts:3114): ordinary x0.5; reach
  - recall-drill transfer (content/practice.ts:105): 0.3; halving
- **Read by** (weights are the input's weight against its dimension's total):
  - written interpretation 1, execution 2 (tasks.ts:91-92)
  - voice execution 1
  - movement consistency 1
  - partnered consistency 1
  - camera/tape execution 1
  - FEATURE timing execution +1/level
  - Measured interpretation +1
  - a classmate reader's timing (briefs.ts:484)
- **Normalization:** level/100
- **Effect of +10** (pieces moved, mean, max):
  - all: 423/427 pieces moved, mean +0.44, cv 0.49
  - brief: 298/298 moved, mean +0.49, max +1
  - scene: 56/56 moved, mean +0.26, max +0.5
  - night: 30/30 moved, mean +0.33, max +0.6
  - casting: 30/30 moved, mean +0.31, max +0.6
  - coursework: 9/13 moved, mean +0.68, max +2.4
- **Specialist against the even actor:** where it reads most, 29 of 270 (mean -0.62); elsewhere, 0 of 157 (mean -1.65). By kind: brief 25/298 (-0.8), scene 0/56 (-1.59), night 0/30 (-1.71), casting 0/30 (-1.6), coursework 4/13 (0.17).
- **Visible:** Profile; its look
- **With preparation:** none: the day's focus (readiness) drives every step, never this ability
- **With genre:** none
- **With condition:** fatigue reaches the dimensions it sits in
- **Bounds and mastery:** 0-100
- **Tests:** tests/briefs.test.ts:88
- **Distinct contribution shown by a test:** none
- **Flags:**
  - misleading description / name collision: affects says 'How far a step of preparation goes'; the steps read focusAt (readiness x hour), never the Focus ability (coursework.ts:582-593, briefs.ts:418-424, practice.ts:118). Two different things share the word 'focus' on screen (abilities.ts:73; school.ts:910-929)
  - shallow contribution: its specialist is ahead on 29 of the 270 pieces that read it most, behind on every scene, night and casting (baseline §2)

## Memory

- **Represents:** Learning lines and blocking and keeping them under pressure (abilities.ts:79).
- **Kept in:** person.craft.memorization
- **Developed by:**
  - practice.exercise recall-drill (content/practice.ts:57): deliberate; 4 h/day, halving
  - brief Learn The Lines (briefs.ts:82, 435): ordinary 0.25; reach
  - coursework lines step (coursework.ts:609): ordinary 0.25; reach
  - school.learn_part, review_blocking (production.ts:529, 541): ordinary 0.25, the first 3 per part; reach
  - rehearsal calls (rehearse) (school.ts:2164-2168): grow memorization w1; ceiling
- **Read by** (weights are the input's weight against its dimension's total):
  - scene execution 2 of 6 (tasks.ts:83)
  - camera/tape execution 2 of 5
  - audition execution 1 of 5
  - performance execution 1 of 5
  - Set execution +0.5
- **Normalization:** level/100
- **Effect of +10** (pieces moved, mean, max):
  - all: 416/427 pieces moved, mean +0.3, cv 0.25
  - brief: 298/298 moved, mean +0.34, max +0.55
  - scene: 56/56 moved, mean +0.29, max +0.4
  - night: 30/30 moved, mean +0.18, max +0.3
  - casting: 30/30 moved, mean +0.17, max +0.2
  - coursework: 2/13 moved, mean +0.08, max +0.7
- **Specialist against the even actor:** where it reads most, 1 of 332 (mean -1.36); elsewhere, 0 of 95 (mean -2.04). By kind: brief 0/298 (-1.37), scene 0/56 (-1.46), night 0/30 (-2.23), casting 0/30 (-2.16), coursework 1/13 (-2.02).
- **Visible:** Profile; its look
- **With preparation:** execution reads memorization/lines prep; the steps' speed doesn't read memory
- **With genre:** none
- **With condition:** fatigue and the flu reach execution
- **Bounds and mastery:** 0-100
- **Tests:** tests/briefs.test.ts:88
- **Distinct contribution shown by a test:** none
- **Flags:**
  - misleading description: affects says 'How fast lines are learned': the lines step reads the day's focus, a trait (drills), genreSpeed and featureSpeed, never memory (coursework.ts:592-593, production.ts:527, briefs.ts:423-424) (abilities.ts:81)
  - shallow contribution: its specialist is ahead on 1 of 427 pieces (baseline §2)

## Adaptability

- **Represents:** Taking direction and changing a choice quickly (abilities.ts:87).
- **Kept in:** person.attrs.adaptability
- **Developed by:**
  - practice.exercise adjustments (content/practice.ts:58): deliberate; 4 h/day, halving
  - Live focus; repetition, cold-reading, improv transfers (practice.ts:112; content/practice.ts:102,116,119): 0.15 / 0.3; halving
  - coursework revision step (coursework.ts:562, 609): ordinary 0.25; reach (improv)
  - work a director's note (production.ts:592, 598): ordinary 0.25; reach
  - workbook Run Into It (workbook.ts:270): ordinary 0.25; reach
  - improv classes (school.ts:3114): ordinary x0.5; reach
- **Read by** (weights are the input's weight against its dimension's total):
  - scene responsiveness 2 of 4
  - partnered responsiveness 1 of 3
  - improvisation responsiveness 2 of 6
  - clown responsiveness 2 of 4
  - tape responsiveness 1 of 2
  - performance responsiveness 1 of 3
  - FEATURE improvisation responsiveness +1.2/level
  - TRANSITION believability +0.3
  - Driven responsiveness +1
  - pressing/unpredictable reader +0.5
  - slip recovery (composure+adaptability)/2 (piece.ts:257, 297)
  - partner slip cover
- **Normalization:** level/100
- **Effect of +10** (pieces moved, mean, max):
  - all: 418/427 pieces moved, mean +0.5, cv 0.36
  - brief: 298/298 moved, mean +0.52, max +1.25
  - scene: 56/56 moved, mean +0.46, max +0.7
  - night: 30/30 moved, mean +0.45, max +0.7
  - casting: 30/30 moved, mean +0.45, max +0.7
  - coursework: 4/13 moved, mean +0.2, max +0.8
- **Specialist against the even actor:** where it reads most, 45 of 222 (mean -0.29); elsewhere, 0 of 205 (mean -1.3). By kind: brief 42/298 (-0.67), scene 1/56 (-0.79), night 0/30 (-1.23), casting 0/30 (-1.11), coursework 2/13 (-1.52).
- **Visible:** Profile; its look; brief How They Play It
- **With preparation:** responsiveness reads partner, rehearsal, notes
- **With genre:** none
- **With condition:** fatigue
- **Bounds and mastery:** 0-100
- **Tests:** tests/briefs.test.ts:146 (a change asks adaptability); tests/material.test.ts
- **Distinct contribution shown by a test:** tests/briefs.test.ts:146 shows a tonal change asks adaptability and a held beat depth
- **Flags:**
  - misleading description: affects says 'how fully a note is taken in a revision': noteTaken reads no ability (coursework.ts:996-1016) (abilities.ts:89)
  - shallow contribution: its specialist is ahead on 45 of the 222 pieces that read it most, behind everywhere else (baseline §2)

## Composure

- **Represents:** Holding nerves under the pressure of a house, an audition or a camera (abilities.ts:95).
- **Kept in:** person.attrs.composure; starts 25 + 0.35*emotionalStability (attributes.ts:134)
- **Developed by:**
  - before every house (nerves) (attributes.ts:310): +0.005 of what's left (nudge); none
  - practice.exercise graded-exposure (content/practice.ts:63): deliberate; 4 h/day, halving
  - concentration, showing transfers (content/practice.ts:104,109): 0.3; halving
- **Read by** (weights are the input's weight against its dimension's total):
  - scene consistency 2 of 4
  - song consistency 1 of 3
  - camera/tape consistency 1 of 2
  - audition consistency 2 of 2
  - performance consistency 2 of 4
  - TRANSITION consistency +0.2
  - unpredictable reader +0.3
  - slip recovery
  - stress before a house: 6*(1-composure/100)*stressGain (attributes.ts:308)
- **Normalization:** level/100
- **Effect of +10** (pieces moved, mean, max):
  - all: 417/427 pieces moved, mean +0.3, cv 0.3
  - brief: 298/298 moved, mean +0.31, max +0.6
  - scene: 56/56 moved, mean +0.25, max +0.4
  - night: 30/30 moved, mean +0.38, max +0.5
  - casting: 30/30 moved, mean +0.37, max +0.5
  - coursework: 3/13 moved, mean +0.15, max +0.8
- **Specialist against the even actor:** where it reads most, 1 of 271 (mean -1.35); elsewhere, 0 of 156 (mean -1.81). By kind: brief 0/298 (-1.51), scene 0/56 (-1.57), night 0/30 (-1.48), casting 0/30 (-1.39), coursework 1/13 (-1.82).
- **Visible:** Profile; its look; School screen AttributesPanel (AttributesPanel.tsx:26-33)
- **With preparation:** consistency reads rehearsal or lines
- **With genre:** none
- **With condition:** fatigue; its own stress effect lowers readiness indirectly
- **Bounds and mastery:** 0-100
- **Tests:** tests/attributes.test.ts:62, 96 (nerves and stress)
- **Distinct contribution shown by a test:** tests/attributes.test.ts:96 (nerves cost less with more)
- **Flags:**
  - shallow contribution: its specialist is ahead on 1 of the 271 pieces that read it most (baseline §2)
  - misleading description: AttributesPanel says it 'grows with every performance' and holds a performance's consistency; it is also practised (graded exposure) and read by scenes, songs, tapes and auditions (AttributesPanel.tsx:28-33)
  - duplicate mechanic: nudge path (no halving, no lift) beside develop (attributes.ts:166, 310)

## Vocal Expression

- **Represents:** A free, supported voice that carries thought and feeling (abilities.ts:103).
- **Kept in:** person.craft.voice
- **Developed by:**
  - practice.exercise voice-work (content/practice.ts:59): deliberate; 4 h/day, halving
  - voice classes; every night (playNight voice w1) (school.ts:3110, 2157): grow; ceiling
  - brief rehearsal where vocal >= 2 and >= physical (briefs.ts:408-411, 435): ordinary 0.25; reach
  - dialect, singing, speech, copy-reading transfers (content/practice.ts:111,124,125,127): 0.3; halving
- **Read by** (weights are the input's weight against its dimension's total):
  - scene execution 1 of 6
  - voice execution 3 of 6, consistency 1 of 3
  - song execution 2 of 4
  - audition execution 1
  - performance execution 1
  - FEATURE vocal execution +2/level, lean +0.25/level (approaches.ts:84)
  - verse execution +0.4
  - Expansive execution +0.5
- **Normalization:** level/100
- **Effect of +10** (pieces moved, mean, max):
  - all: 298/427 pieces moved, mean +0.39, cv 0.64
  - brief: 178/298 moved, mean +0.33, max +1.3
  - scene: 56/56 moved, mean +0.4, max +0.8
  - night: 30/30 moved, mean +0.61, max +1.2
  - casting: 30/30 moved, mean +0.61, max +1.2
  - coursework: 4/13 moved, mean +0.58, max +3.1
- **Specialist against the even actor:** where it reads most, 80 of 169 (mean 0.13); elsewhere, 0 of 258 (mean -2.1). By kind: brief 46/298 (-1.43), scene 11/56 (-1.01), night 10/30 (-0.63), casting 10/30 (-0.49), coursework 3/13 (-0.22).
- **Visible:** Profile; its look
- **With preparation:** execution reads memorization, rehearsal
- **With genre:** only through a brief's vocal level
- **With condition:** the flu reaches execution of voice, song, scene, tape, audition, performance
- **Bounds and mastery:** 0-100
- **Tests:** tests/briefs.test.ts:441, 454 (a feature at 3 makes its ability a real share)
- **Distinct contribution shown by a test:** tests/briefs.test.ts:454
- **Flags:**
  - specialist only partly rewarded: ahead on 80 of the 169 pieces that read it most; 0 of 258 elsewhere (baseline §2)
  - duplicate mechanic: grow and develop (school.ts:991; attributes.ts:275)

## Physical Expression

- **Represents:** A body that's free, specific and readable on stage (abilities.ts:111).
- **Kept in:** person.craft.movement
- **Developed by:**
  - practice.exercise movement-work (on the feet) (content/practice.ts:60): deliberate; 4 h/day, halving, refused tired or injured
  - movement and Alexander classes (school.ts:3110): grow; ceiling
  - brief rehearsal where physical >= 2 (briefs.ts:408-411): ordinary 0.25; reach
  - character-work, dance, combat transfers (content/practice.ts:113,118,126): 0.3; halving
- **Read by** (weights are the input's weight against its dimension's total):
  - scene execution 1 of 6
  - movement execution 3 of 5
  - partnered execution 2 of 5
  - clown execution 2 of 4
  - audition execution 1
  - performance execution 1
  - FEATURE physical execution +1.8/level, lean +0.25/level (approaches.ts:82)
  - Expansive execution +0.5
- **Normalization:** level/100
- **Effect of +10** (pieces moved, mean, max):
  - all: 298/427 pieces moved, mean +0.36, cv 0.62
  - brief: 176/298 moved, mean +0.3, max +1.2
  - scene: 56/56 moved, mean +0.32, max +0.6
  - night: 30/30 moved, mean +0.62, max +1.1
  - casting: 30/30 moved, mean +0.63, max +1.2
  - coursework: 6/13 moved, mean +0.61, max +3.1
- **Specialist against the even actor:** where it reads most, 62 of 168 (mean -0.04); elsewhere, 0 of 259 (mean -2.13). By kind: brief 34/298 (-1.52), scene 1/56 (-1.34), night 9/30 (-0.55), casting 13/30 (-0.41), coursework 5/13 (-0.02).
- **Visible:** Profile; its look
- **With preparation:** execution reads rehearsal
- **With genre:** only through a brief's physical level
- **With condition:** an injury reaches execution of movement, partnered, clown, tapeOnFeet, performance
- **Bounds and mastery:** 0-100
- **Tests:** tests/briefs.test.ts:454; tests/briefs.test.ts:466 (injury on a physical brief)
- **Distinct contribution shown by a test:** tests/briefs.test.ts:466
- **Flags:**
  - specialist only partly rewarded: ahead on 62 of the 168 pieces that read it most, mean -0.04 there (baseline §2)
  - duplicate mechanic: grow and develop (school.ts:991)

## Discipline

- **Represents:** Keeping up the daily work (abilities.ts:119).
- **Kept in:** person.attrs.discipline; starts 30 + 0.5*conscientiousness (attributes.ts:122)
- **Developed by:**
  - the first practice hour of a day (practice.ts:149): deliberate, weight 1, focus 1; once a day
  - each rehearsal call answered (production.ts:410): ordinary 0.25; halving
- **Read by** (weights are the input's weight against its dimension's total):
  - scene, voice, song, movement, partnered, camera/tape, performance consistency 1 each
  - written execution 1
  - Set consistency +1
  - every develop gain x(1 +- 0.1) (attributes.ts:280)
  - casting reads it as full (school.ts castingPerformer)
- **Normalization:** level/100
- **Effect of +10** (pieces moved, mean, max):
  - all: 386/427 pieces moved, mean +0.18, cv 0.49
  - brief: 298/298 moved, mean +0.2, max +0.4
  - scene: 49/56 moved, mean +0.11, max +0.2
  - night: 29/30 moved, mean +0.16, max +0.2
  - casting: 0/30 moved, mean +0, max +0
  - coursework: 10/13 moved, mean +0.51, max +1
- **Specialist against the even actor:** where it reads most, 4 of 252 (mean -1.79); elsewhere, 0 of 175 (mean -2.26). By kind: brief 0/298 (-1.9), scene 0/56 (-2.12), night 0/30 (-2.33), casting 0/30 (-2.83), coursework 4/13 (-0.55).
- **Visible:** Profile; its look; guide craft.practice
- **With preparation:** none
- **With genre:** none
- **With condition:** fatigue
- **Bounds and mastery:** 0-100
- **Tests:** tests/development.test.ts; tests/attributes-complete.test.ts:87 (casting full)
- **Distinct contribution shown by a test:** none showing the lift's effect on a played outcome
- **Flags:**
  - misleading description: develops says 'attending every call, and work prepared before it's due': calls grow it (production.ts:410); work prepared early grows nothing (abilities.ts:120)
  - misleading description: affects says 'consistency in every task': audition consistency reads composure only (tasks.ts:199); improvisation, clown, written have no consistency (abilities.ts:121)
  - partly unread: the ±10% lift reaches develop only; classes, nights and coursework training (grow) and presence/composure (nudge) ignore it (attributes.ts:280; school.ts:991)
  - shallow contribution: the smallest evaluation effect (+0.19 a +10); its specialist ahead on 4 of the 252 pieces that read it most (baseline §1-2)

## Stamina

- **Represents:** Lasting through long days, runs of nights and physical work (abilities.ts:127).
- **Kept in:** person.wellbeing.fitness; decay: held 3 days after a workout, then -0.18 a day to 35 (life.ts:84, 103, 974)
- **Developed by:**
  - life.look_after exercise (a workout) (life.ts:469-473, 649, 685): 0.6*remap(readiness,0..100,0.4..1.2) x training (run in fine weather 1.1) x 0.5^repeats; ceilingAt(age).fitness; energy 10*remap(fitness,1.5..0.5)
- **Read by** (weights are the input's weight against its dimension's total):
  - drain inside every piece: f = 1 - 0.3*load*position*(1 - stamina) on every dimension fatigue reaches (piece.ts:276); load 0.1-0.3 a brief, 0.15 a scene, 0.4 a night, +1/6 (0.1 a night) per physical+vocal level (piece.ts:115-120)
  - non-piece coursework consistency: voice 1, song 1, movement 2, partnered 1 (tasks.ts:99,109,118,127)
  - FEATURE physical +0.8, vocal +0.6 consistency: stripped in every piece (piece.ts:181-190); Driven +0.5 consistency, read only by unsegmented coursework
  - sleep's mend: min(age ceiling, 70 + 0.6*fitness) (life.ts:142)
  - casting reads it as full
- **Normalization:** fitness/ceilingAt(age).fitness
- **Effect of +10** (pieces moved, mean, max):
  - all: 390/427 pieces moved, mean +0.33, cv 0.57
  - brief: 297/298 moved, mean +0.37, max +0.83
  - scene: 56/56 moved, mean +0.23, max +0.6
  - night: 30/30 moved, mean +0.43, max +0.7
  - casting: 0/30 moved, mean +0, max +0
  - coursework: 7/13 moved, mean +0.42, max +1.4
- **Specialist against the even actor:** where it reads most, 10 of 245 (mean -0.96); elsewhere, 0 of 182 (mean -2.12). By kind: brief 7/298 (-1.31), scene 0/56 (-1.67), night 0/30 (-1.3), casting 0/30 (-2.83), coursework 3/13 (-0.79).
- **Visible:** Profile stamina paragraph (ProfileWorkspace.tsx:350); brief beat table 'Tiring: N% off' (WorkThrough.tsx:34-43)
- **With preparation:** none
- **With genre:** only through physical and vocal levels (load)
- **With condition:** it is the body's fitness; the workout is refused injured or spent
- **Bounds and mastery:** 0 to its age ceiling (99.3 at 25)
- **Tests:** tests/fitness.test.ts; tests/connected-properties.test.ts:64 (read once); tests/evaluation.test.ts:70
- **Distinct contribution shown by a test:** tests/connected-properties.test.ts:42 (rises with stamina)
- **Flags:**
  - inconsistent reading: two readings of one ability by the shape of the text: FEATURE_EFFECT physical.consistency stamina 0.8, vocal.consistency stamina 0.6 and Driven's 0.5 are stripped in every piece judged in segments (briefs, nights, castings, class scenes of two tones or more) and read as consistency inputs only by a class scene of one tone (scenePiece returns none under two tones, coursework.ts:701) and by unsegmented coursework played Driven. The same scene's stamina is a consistency input or a late drain depending on how many tones its profile lists (approaches.ts:46,82,84; piece.ts:181-190; coursework.ts:698-706)
  - misleading description: affects says 'Consistency in movement, fights, songs and every night on stage': a night reads it only as the drain, across five dimensions, never as consistency; the ability look and the Profile's It Shapes list it as consistency (abilities.ts:129; looks/actor.tsx:133)
  - shallow contribution: its specialist is ahead on 10 of the 245 pieces that read it most; a short brief's last beat loses at most 3% at stamina 0 (content/piece.ts:56)

## The Techniques

- **Where:** abilities.ts:148-151; read as level/90 sharing the dimension's technique weight by the work's reads (evaluation.ts:259-271)
- **Developed by:** classes, nights and rehearsals (grow, ceiling); coursework steps (grow, 3 per assignment, coursework.ts:602-605); a take's medium technique 0.5 and staged techniques 0.25 (briefs.ts:554-556); one exercise each (content/practice.ts:65-81)
- **Effect of +10 from 50:**
  - screen: 264 pieces, +0.37 (briefs only)
  - scene: 416, +0.45
  - voiceover: 37, +0.06
  - comedy: 38, +0.04
  - combat: 32, +0.04
  - classical: 25, +0.03
  - improv: 18, +0.02
  - singing: 12
  - dance: 9
  - clown: 8
  - character: 7
  - intimacy: 7
  - accents: 6
  - script: 2
  - speech: 2
  - audition: 1
  - coldReading: 1
- **Past 90:** 0 of 427 pieces move between 90 and 100: a technique past mastery is read by nothing, while practice keeps growing it and its feedback says 'rose X, to Y of 100' (practice.ts:183)
- **Flags:**
  - label-only range: levels 90-100 of every technique are read by no evaluation; the technique look shows 'room to grow to {reach}' and nothing about 90 (evaluation.ts:266; looks/school.tsx:310,317)
  - shallow content: audition, cold reading and script move 1 to 2 of 427 pieces each (one coursework template each); accents, character, clown, dance, intimacy, singing, speech under 13 each (baseline §1b)
  - silently dropped reads: template reads naming emotion, voice, movement or memorization (e.g. voice-sequence { voice: 3 }, movement-score { movement: 2 }) are filtered out of the technique term, so the dimension's tech weight vanishes for those templates (evaluation.ts:326; content/coursework.ts:985,1029)

## Across The Attributes

- **duplicate mechanic**: two growth formulas: develop/abilityGain (attributes.ts:201-292) and grow/sessionGain (school.ts:905, 991), the same 0.42*(1-L/c)^1.5 curve, the second without halving, discipline lift or the reach rule for kin abilities
- **duplicate mechanic**: nudge (attributes.ts:166) moves presence and composure by a share of what's left, outside develop's rules
- **name collision**: 'focus' is both an ability (attrs.focus) and the day's readiness factor (focusAt) on every gain and step; GrowthTerms.focus is the latter
- **unused export**: SUFFICIENT in systems/briefs.ts:765, read by nothing, with a comment ('Its sum of reads' weight, for a check') that describes nothing it does
- **label-only text**: ABILITY_DEFS[].affects is never shown (looks/actor.tsx:133 shows the task readers instead, and every ability has some), yet four of its twelve sentences are false (focus, imagination, memory, adaptability)
- **partner gates personal result**: a class scene's own result reads the partner part of preparation, which only rehearsals kept with the partner move (coursework.ts:1253-1277); a mastered actor whose partner never comes is held to 68.2 on their own result (65.7 to 71) (baseline §4)

Correlation of two abilities' effects across the 427 pieces: the highest pair is emotionalDepth / memory at r = 0.549, and none is at 0.9 or more. Each ability's effect pattern is distinct; the problem is size and reach, not overlap.

