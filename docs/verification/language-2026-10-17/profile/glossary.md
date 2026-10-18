# Profile, Abilities, Genres And Advice: The Player's Words

For `docs/GLOSSARY.md`'s section of the same name, in its columns. Core terms (ability, technique, genre knowledge,
practice, work in a genre, prepared, how you play it) are the coordinator's and aren't repeated here.

| Say | What It Means | Instead Of |
|---|---|---|
| **how it grows** | What raises an ability or a technique: classes, preparation, nights, practice (`ABILITY_DEFS[].develops`). An ability's look heads it so. | what develops it |
| **where it started** | Where an ability's level came from when your life began: the rest of your training, the average of two techniques, or a disposition you set (`derivedFrom`, `derivedAbilities`). | where it began, "for a life from before it" |
| **where it counts** | The kinds of work an ability is judged in, and what the teacher looks for in each (`abilityReaders`). | which work reads it |
| **how much a session gets done** | How far one sitting of preparation (learning lines, table work, a revision) moves it; an ability speeds it (`stepSpeed`). | how far a step goes |
| **full**, **Mastered** (an ability) | An ability at 100, or stamina at the fittest a body your age can be: no work asks more of it (`atFull`). | work that reads it asks nothing more |
| **classes reach** | Where classes and coursework level off for an ability or a technique; practice takes you past it (`reachOf`). | where ordinary work levels off |
| **Familiarity** | The genre score study builds: films watched and plays read (`genre.study`). | |
| **Work In It** | The genre score nights on stage and self-tapes in it build (`practiceGenres`). Shown beside Familiarity; the better of the two is how well you know the genre. | practice (for a genre) |
| **What a self-tape in it asks** | The techniques a genre's brief stages, where the research holds it at medium or high confidence (`applied`). | applied as requirements |
| **calls for**, **calls on** | What a genre or its scenes ask of your techniques and abilities. | reads, draws on |
| **moment by moment** | A piece judged in its parts, each with its own result (`segments`). | part by part |
| **complete at** | The preparation that counts as complete for a part of a piece (`required`). | "90% of 80%" |
| **an audience** | The people watching a night or a showing. | a house |
| **forecast** (the advice's) | What 20 hours of an exercise would be worth on your recent work, played again with you as you are now (`trainingForecast`). Always called a forecast, said as "worth about … a piece". | worked out again with you as you are now |
| **replayed with you as you are now** | Your recent pieces judged again at your levels today, which is how a forecast is made. | worked out again |
| **comes first**, **since the advice first named it** | How long a recommendation has led the advice, from its note (`Experience.advised`). | has been first, since it was first given |
| **counts as fully prepared** | A piece held back most by its own preparation, taken as if prepared so the forecast is what training is worth (`assumedOf`). | read as if complete, read as prepared |
| **underprepared**, **counts as taped** | A piece taped short of complete preparation, taken as it was taped. | short of it and read as taped |
| **the work it's forecast on** | The recent pieces a forecast is made on: one of the parts a change of forecast is said in (`PART_SAID.work`). | the work it reads |
| **from your record** | What the record kept across all your work shows, said beside a recommendation or a line of Your Work So Far. | from your work for life, the experience record: (a key) |
| **in all** | Across every piece you've done (a weakness's count, the points it cost). | for life |
| **off the whole** | Points a limit or a weakness cost a piece's overall result, the Whole column's. | of the whole |
| **Steady**, **Precision**, **Spaced**, **Variation**, **Live With A Partner** | The Focus control's five ways to spend an hour of practice (`FOCUS`), named as the control names them, capitalized mid-sentence. | steady, spaced (lowercase, as a word) |
| **Foundation**, **Developing**, **Advanced** | The Tier control's three tiers (`TIER.label`), capitalized mid-sentence. | the developing tier |
| **a day of practice kept** | The day's first hour of practice, which grows discipline once (`PRACTICE.disciplineDay`). | the day kept |
| **experience of** (a kind of material) | What an exercise's hour or a piece counts toward in the material record, so material that asks for it prepares faster (`practises`, `features`). | practice in |
| **Works Against The Scene** | The third band of how well a way of playing suits a scene (`GRAIN_LABEL.against`); Suits The Scene and Either Way are the others. | Against The Grain, against the grain of the scene |
| **judged more on**, **calls on** | What a register, a reading or a way of playing leans a self-tape toward, and the abilities it asks for more (`concernWords`, `READER_WAYS`). | weighs more, draws on |
| **estimated from its conventions** | A genre's register where the research says nothing of how it's played (`basis: 'reading'`). | SLATE's reading of its conventions |
| **No sleep owed**, **1 hour of sleep owed** | Sleep debt on Current Condition, in whole hours (`sleepOwed`). | Sleep owed 1 hours |
