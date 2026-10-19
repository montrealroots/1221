# The Player's Words

One name for one thing (`docs/STYLE.md`, Talking to the player). Each entry gives the word a player sees, what it means
in the game (and the code it names, so a writer can check the meaning), and the words it replaces. A term used by more
than one part of the game is here, in Core, and only the coordinator of a pass changes it. A term only one part uses is
in that part's section. Code identifiers keep their names; only what's shown changes.

Brief 15 (2026-10-19, `docs/verification/briefs-2026-10-16/15-complete-natural-language-editorial-pass.txt`) kept
this file as its standard. Where a row's word was correct but stiff, the second pass changed the row and kept the old
word in Instead Of. The first such change is checking account, below, in Money.

Written 2026-10-17 for the owner's brief 14. Where the game said something else until then, the "Instead Of" column
keeps it. The sections below Core were assembled the same day from each area's `glossary.md`
(`docs/verification/language-2026-10-17/<area>/`), one row for each term: a term two areas both wrote is in Core, or in
the one section whose part of the game owns it, never in both. Where two areas said one thing two ways on screen, the
screens were brought to this file's word (`docs/verification/language-2026-10-17/crossarea/batches.md`).

## Core

| Say | What It Means | Instead Of |
|---|---|---|
| **ability**, **abilities** | One of the twelve, 0 to 100: Emotional Depth, Presence, Listening And Responsiveness, Imagination, Focus, Memory, Adaptability, Composure, Vocal Expression, Physical Expression (the acting abilities), Discipline and Stamina (the general ones) (`ABILITY_DEFS`). The Profile panel that shows them is titled Attributes And Craft. | attribute in prose, dial, input, "what the work reads" |
| **technique**, **techniques** | A craft skill the school trains, 0 to 100 (`TECHNIQUES`). **Mastered** at 90 (`MASTERED`): past that, no piece asks more of it. | skill id, "the craft" as a count |
| **craft**, **overall craft** | Your techniques taken together; overall craft is their average (`meanCraft`). | |
| **genre knowledge** | How well you know a genre: the better of its **Familiarity** (films watched and plays read, `genre.study`) and its **Work In It** (below) (`genreKnown`). | engagement, familiarity and practice as separate scores in prose |
| **practice** | Work you set yourself outside class: an exercise, a self-tape (`practice.exercise`, `practice.self_tape`). | deliberate practice as a term |
| **work in a genre**, **Work In It** | Nights on stage in a play of that genre and self-tapes of its briefs, which count toward its genre knowledge (`practiceGenres`, called by a production's night and a brief's take). Class scenes don't count. Until 2026-10-17 this row said they did; the profile area found `practiceGenres` has no caller in coursework. | genre practice, when it would be confused with practice above |
| **your performance**, **the scene**, **the piece**, **the tape** | What's judged: a piece shown in class, a night on stage, a self-tape. Name the thing itself. | the take (but see take, below), the work, the output |
| **take** | One recording of a self-tape or an audition: the industry's word, kept there and in-world where a scene is about film (a single unbroken take). Never for a class piece or a night on stage. The engine-speak ratchet counts every one, so a source that keeps it says why in its status. "Take a note" is the school's own phrase (School, below), not this. | the take, for a class piece or a night on stage |
| **reader** | Whoever reads the other part for you: off camera for a self-tape, as each brief's staging notes place them, or the voice on a recording; and, on coursework, the reader you Run It With in a scene partner's place. Never the scene partner, a classmate who rehearses with you. The feature label Playing Off The Partner stays the school's. | partner, for a self-tape's reader |
| **reading**, **Your Reading** | A brief's reading: one way of understanding what its scene is about, said as a sentence ("She plays it as …") with the line of the brief it rests on. It isn't how you play it: the reading is what the scene means to you, and how you play it is the scale you choose. A brief asks for both, on one pane, and the two names stay apart. | an interpretation id, a lean, "what it draws on" |
| **what your teacher looks for** and its names (Believability, Connection, Consistency, Responsiveness and the rest as the screen labels them) | The qualities a performance is judged on (`Dimension`, `DIMENSION_LABEL`). | dimension, quality dimension |
| **part of the scene**, **moment** | One of the pieces a scene or a night is judged in (`segment`, `unit`). | segment, unit |
| **prepared**, **how prepared**, **ready** | How far a piece's preparation steps are done (learning the lines, rehearsing on your feet and the rest). | rehearsed in, complete preparation, "the preparation reads" |
| **forecast**, **fully prepared forecast** | What the game expects, always called a forecast and never a result: a piece's Shown Today (how it would do if shown today, on a good day), its fully prepared forecast (every step done), and the advice's forecast of what training is worth (Profile, below). | the forecast as if prepared, "worked out again" |
| **how you play it**, **a way of playing it** | An interpretation chosen for a scene: restrained or expansive and the other choices the scene offers, said in lower case in a sentence ("played set", "measured"). Choosing one isn't rehearsing it: the choice has to be rehearsed before it pays off. | approach, a choice rehearsed in, a side |
| **suits the scene**: **Suits The Scene**, **Either Way**, **Works Against The Scene** | How well a way of playing suits a scene, in three bands (`suitabilityOf`, `GRAIN_LABEL`). | with the grain, against the grain, the grain, Against The Grain |
| **audience** | The people watching a night on stage or a showing. A director's note may still say "before the house does", in their own voice, and the scenes keep their characters' words. | a house, in the game's own words (until 2026-10-17 in the qualities' descriptions, a night's task and the coursework guide) |
| **condition** | The wellbeing measure of how sound your body is. Illness, going hungry, stress over 75 and short nights wear it down, and a night of real rest mends it as far as your fitness allows (`mendsTo`). It sets a night's energy, where morale settles, a sick day's excuse under 55, and the odds of a year being your last. An injury doesn't lower it. Until 2026-10-17 this said injury did; the health area found it doesn't (`life.ts`). Never "a condition you carry": that's **a long-term condition** (Health, below). | what a body is fit for |
| **energy** | What you have left for today. Every waking hour uses some, faster with sleep owed, and only sleep brings it back (`applySleep`): a meal doesn't. Until 2026-10-17 this said food did too. | what the day has left in you |
| **stamina** | An ability: how long you can keep going in a long scene or a night on stage before you tire. It's the same figure as **fitness** on How You Are (Health, below): trained by working out, and falling without it. | |
| **morale** | The wellbeing measure of your mood: meals, workouts, unwinding and good nights lift it; hunger, grime, money trouble and an injury pull it down. The game's prose calls the measure morale wherever it names it, and its look defines it: "Morale is your mood." | mood, for the measure (until 2026-10-17 in creation, the Profile's dispositions, the traits, the wellbeing looks and the body guide) |
| **health** | Illness, injury, long-term conditions, your care and its bills, and your health cover, all on Papers, under Health Cover. Not the same as condition, energy or stamina. | |
| **wellbeing**, **your wellbeing** | The eight measures How You Are and your own page show: Energy, Stress, Sleep Debt, Morale, Condition, Fitness, Nourishment, Hygiene (`DIALS`, `person.wellbeing`). A look of one is kinded Your Wellbeing; one of them, as a common noun, is a **measure**. | dial, the eight dials, One Of Eight |
| **readiness** | How sharp you'll be at today's work: seven of the eight measures, all but fitness, from 5 to 100. It sets what a session builds, and under 60 it costs you in judged work. The look is kinded How Ready You Are Today. | How Well You Would Do Today, the condition judged work meets you in |
| **feedback**, **your teacher's notes** | What the faculty say about a piece once it's shown. It's the school's assessment in the game, written as a teacher would say it (School: a note). | the note's focus, the evaluation found |
| **academic standing** and its names: **good standing**, **academic concern**, **academic warning**, **dismissed** | Where the faculty's term review puts you. Say what the next step down means: "a second term short of what's asked puts you on academic warning." | the standing falls a step |
| **coursework warning** | A notice during a term that too much work is unready or unshown. It isn't the review: the review comes at the term's end. | |
| **term review** | The faculty's decision at the end of each term. The calendar's entry is titled Term Review, Fall Term 2026; the Standing tab's table is Term Reviews; the Calendar legend's School row says "each term's review". | term evaluation, "… Term Evaluation", Evaluations |
| **the clock**, **Play**, **Pause** | The game's clock at the top of the screen, a real control that keeps its name. It runs a minute for every minute on Play and stops on Pause. A new life starts paused. | live, paused (the preference's values) |
| **commitment** | Something on the calendar you need to be at: a class, a call, a shift, a plan of your own. The clock stops at it and asks. Opened, it says A Commitment. | something that wants you, Something You Have To Be At, "two things that want you" |
| **question** | A row in What Needs You with answers on buttons and Dismiss (`DecisionItem`). It closes when answered, when dealt with on its own screen, or by itself within two days after its date. | decision |
| **notice** | Something the game tells you, unread until Mark N Read (`Notification`). An authority's letter arrives as one, under its own code and title (CP14, A Notice Of Noncompliance). Money's **notice period** (Money, below) is another word. | notification in prose |
| **available**, **pending** | Your available balance is what you can spend now. A card payment approved but not yet posted is **pending**: it says the day it posts, and it's already taken off the available balance. Money on its way between accounts has left one and isn't in the other yet, so it isn't available to spend. Never call money on its way in available. | "completed items", "held against the balance" |
| **apply**, **applied**, **issued**, **in hand** | Applying for a document starts it. You hold it only once it's issued and arrives. | |
| **Catch Up**, **Catch Up By** | To make up something missed: an Orientation session, on School's Coursework tab, or a payment plan's missed payment, on Papers, by the date Catch Up By gives. | Caught Up By |
| **payment plan** | An arrangement to pay what's owed over time: a card's plan (The Card's Offers) and the bank's hardship plan, or the IRS's or a state's plan for tax (the IRS's covers federal tax only; each state has its own). Always "payment plan", never "a plan" alone where it could be read as anything. | installment agreement (except as a state's own name), "a plan" alone |
| **estimated** | A figure or a rate the game had to estimate because no source publishes it. Said in the source line at the foot ("The debit card's days are estimated: the bank doesn't say."), as "(estimated)" in a How This Works entry's figures, or in a phrase ("Urgency is estimated"), never as SLATE's inside a sentence. | SLATE's estimate, SLATE's reading, SLATE's design, SLATE's own, SLATE's reckoning, SLATE's calibration, SLATE's climate model, (an estimate) |
| **an estimated exchange rate** | The fixed rate the game converts each currency at, not a live market (`content/currency.ts`): "About $126.58 at an estimated exchange rate" (Money, and creation's home account), "About 1.53 to the US dollar, estimated" (a place), "Exchange rates are estimated, not live market rates." (`RATES_NOTE`). | SLATE's rate, "the game's exchange rate", "at the estimated rate" |
| **in the game**, **the game's** | What the game does where the world's rule isn't published or isn't modeled: "In the game, the plan ends.", "so the game uses three business days", the game's rule. Said as the game's, never SLATE's. | SLATE ends, SLATE doesn't model, SLATE's rule, SLATE's faculty model |
| **Assumed in the game:** | The fine-print label for what the game takes where an office publishes nothing (a passport office's `AbroadTerms.assumed`). | Not confirmed, SLATE's assumption |
| **Source:** | Where a real figure or name comes from, in one line at the foot of what it explains. | |
| **September 26, 2026** | A date, as `formatDate` writes it: the month's name, the day, a comma, the year. A day without a year is "September 30"; a month and year, "September 2026"; a run of days, "August 24 to 28"; a span of months, "January to June 2026". A day kept as a key ('YYYY-MM-DD') is said through `formatDateKey`. A date inside a quotation or a field the screen quotes as the bank's own words stays as its source wrote it. | 2026-09-26, 26 September 2026, 26 Sep 2026, Sept 2026, 2026-09, 9/26/2026, 26.09.2026, 30 September |
| **read October 10, 2026**, **checked October 13, 2026**, **terms as of April 10, 2026** | In a Source line, after the source: the day it was read, the day a rule was checked against it (said once, "read live and checked", where it's the same day), and the day its terms are from where that's another. | read 2026-10-10, checked 2026-10-13, two bare days with nothing to say which is which |
| **15 hours and 59 minutes**, **2 days and 3 hours** | A duration in a sentence (`formatDurationWords`). "15h 59m" and "2d 3h" are a list's, a chip's and a stat's short form, and only there. | That's in 15h 59m. |

## In-World Material: Briefs, Readings And Class Scenes

From the material area (`material/glossary.md`). The reader, a reading and a take are Core's.

| Say | What It Means | Instead Of |
|---|---|---|
| **practice brief**, **brief** | An original scene written for SLATE for a self-tape in a genre, set out as a casting breakdown (`BRIEFS`, `content/briefs/`). Every genre has one or two. | excerpt, sides, "adapted from", "based on the film" (tests/briefs-content.test.ts fails a brief that says so) |
| **an original scene written for SLATE** | The credit line of every original class scene and every brief (`BY`, `scenes-original.ts`), word for word. | |
| **Where And When**, **The Two Of You**, **You Play**, **Reader Plays**, **What You Want**, **What's In The Way** | The brief's breakdown, as the pane heads it: its circumstances, the relationship, your part, the reader's, the objective and the obstacle. Written in the scene's own terms, never the game's. | |
| **the beats** | The scene's turns in order, each with its tones, which the rehearsal sentence under them counts. | segments, units |
| **It rests on** | The line of the brief a reading stands on, said as a sentence of the scene. | evidence, support |
| **It Only Takes: <Set, Open, Measured, Driven, Restrained, Expansive>** | The one way the scene can be played where its text forces it (`allows`), with its reason after it. The reason says so in the same words: "It can only be played set, the same way every time." | "the structure is set", "can't be found anew on the take", "the structure has to stay open" |
| **Techniques It Asks** and the techniques' names | What a brief asks of the craft, named as the School screen names the skills: Stage Combat (stage combat), Improvisation, Voice-Over (voice-over work), On Camera (on-camera work), Classical Text (classical text work), Clown And Mask (clowning), Comedy (comic timing), Character Work, Intimacy (staged intimacy), Singing, Dance, Accents And Dialects, Speech. | combat, improv, improv work, voiceover, voice-led work, screen work, "Classical for", "clown for", a bracketed "(stage combat)" |
| **staged intimacy**, **intimacy coordinator**, **staged fight**, **marked solo**, **at reduced speed**, **called cues**, **replica**, **eyeline**, **off camera**, **on her side of the frame** | How a brief's contact, intimacy or fight is staged safely for a solo self-tape. Industry words, kept, and said in every brief that asks for them. | |
| **class scene** | A scene from a play, public domain to 1930, or an original scene written for SLATE, set for a course's table work (`SCENES`). | excerpt |
| **Why the text supports it** / **Why the text doesn’t support it** | The text’s reason an answer at the Table Work (School) holds, or doesn’t, shown under it once the scene is shown. A reason it doesn’t is the teacher’s note word for word: “<question>: <reason> You played <role> in <play>.” Each is a whole sentence of the play’s facts, written by the material area; the labels are the school’s. | What it rests on, What cuts against it (until the school area’s merge), “Nothing of the kind”, a fragment, “she isn’t in this part” |

## School

From the school area (`school/glossary.md`). Academic standing, the coursework warning, the term review, feedback,
prepared, the forecasts and how you play it are Core's.

| Say | What It Means | Instead Of |
|---|---|---|
| **a piece of coursework** | One assignment a course sets: a scene, a song, a movement score, a written analysis (`Assignment`). The card's title is the course and the piece: "Acting I: Scene Study". | the work, this work (in refusals and notices) |
| **set** (a piece), **due in class** | A course sets a piece in class and it's due at a later class (`setOn`, `dueOn`, the course's meetings). Not "played set", the way of playing a scene (Material). | due at the meeting, its last meeting |
| **show**, **shown**, **show again** | A piece is shown in class on its due day. A piece with a note to take is shown again at the course's next class (`status: 'revising'`). | |
| **the band**: **Unready**, **Working**, **Strong**, **Exceptional** | How a piece came out when shown, from its score of 100 (`BAND_LABEL`, `bandOfQuality`). Always capitalized as the screen shows it. | |
| **Shown Today** | The line on each open piece saying what it would come to if shown today on a good day, and what's holding it back. It's a forecast (`showingForecast`), never a result, and its words are in the present tense. | the forecast, as if it were a result |
| **the parts of a piece** and their names (**Lines**, **Knows The Scene**, **With Your Partner**, Table Work and the rest, as each card labels them) | What a piece's preparation is made of (`t.dims`). Complete at 90%. | dimension, input |
| **still to finish** | The parts of a piece short of complete, each with the steps that work on it (`shortParts`, `remedyWords`). | short of complete |
| **a step** | One of the buttons that prepare a part: Learn The Lines, Read The Scene, Run It With A Reader (`activitiesOf`). | |
| **Table Work**, its questions (**Given Circumstances**, **The Relationship**, **Your Objective**, **The Obstacle**, **A Choice To Play**) and **an answer the text supports** | Answering what a scene's text says before it's played, one question at a time (`QUESTIONS`, `questionsFor`), and whether the play supports your answer (`Option.supported`). More than one answer can be supported. Written for the class scenes by the material area. | a reading the text supports for each question of the Table Work (kept where the reading itself is meant) |
| **a note**, **the note**, **Simulated note from** a course | The teacher's note on a shown piece: what held it back most and what to do next, or, with nothing holding it back, a next step to try. It's the game's simulated feedback and always says so, because the courses' teachers are real people. | the note's focus, "the note (simulated feedback from …)" |
| **take a note**, **Note Taken** | To put right what a note named: the part at 75% or more at a later showing, the choice answered as the text supports, or the note worked into a revision (`resolveNote`, `noteTaken`). A note taken isn't given again unless the part slips back under 45%. | the note is taken (as a passive) |
| **Still There**, **Better, Not There Yet**, **slipped back** | A note given again: unchanged; improved by ten points or more but short; or taken before and back again (`recordNote`). The note says which, and when it was last given. | the same note as on |
| **A Note That Keeps Coming Back**, **Another Way At It** | A note open and given three times or more, and the four other ways to work on it a piece can offer: A Targeted Drill, Put It First, Work On It With Your Partner, A Smaller Piece Of It (`persistentFor`, `APPROACHES`). | |
| **Put … first** | The part a piece asks you to put first: it counts for more when the piece is shown (`objective`, `LEARNING.objectiveWeight`). | weighs more in this showing |
| **Rehearsing With** a partner, **Run It With A Reader** | An evening with your scene partner, asked for at least two hours ahead; or working your own side of it with a reader in their place (`school.ask_partner`, `READER`). | |
| **trust**, **reliability** | How much a classmate trusts you, of 100, and how likely they are to come to a rehearsal they agreed to (`trustOf`, `reliabilityOf`). | |
| **make amends** | Putting right a time you let a classmate down, in person (`school.make_amends`). | |
| **the casting pool** | The students the chair of Acting can cast. Two missed calls in a term take you out of it until a term review finds you in good standing (`ESTIMATE.missedCallsOut`). | |
| **degree not recommended** | Where the faculty don't recommend the degree at the end of the last term (`withheld`). The screen's label is Degree Not Recommended; the notice is The Degree Isn't Recommended. | withheld, in the player's words |
| **Orientation** | The first week's five sessions, each once; one missed can be made up with Catch Up (Core) on the Coursework tab. | |
| **Note Priority** | A part's share when the teacher picks what to note on a piece (`weightsOf`, read by `noteCandidates`). It doesn't change the result: the result is held back by the least prepared part, whatever its share. The card says "Note priority N%", the piece's look "Note Priority". | Weighs; counts for |
| **what counts most**, **the qualities your teacher looks for** | What a way of playing shifts, and what a part's preparation holds back (`Dimension`, `APPROACH_EFFECT.lean`). In a production, the same qualities, judged on the night. | dimension, lean, weight |
| **rehearse a choice**, **how far it's rehearsed** | Choosing how to play a scene isn't rehearsing it: rehearsal steps, partner rehearsals and a production's calls rehearse it, to the scene's own mark (`PLAYING`, `requiredFor`). | rehearsed in |

## Profile, Abilities, Genres And Advice

From the profile area (`profile/glossary.md`). Ability, technique, genre knowledge and Work In It, practice, prepared,
the forecast, how you play it, suits the scene and audience are Core's.

| Say | What It Means | Instead Of |
|---|---|---|
| **how it grows** | What raises an ability or a technique: classes, preparation, nights, practice (`ABILITY_DEFS[].develops`). An ability's look heads it so. | what develops it |
| **where it started** | Where an ability's level came from when your life began: the rest of your training, the average of two techniques, or a disposition you set (`derivedFrom`, `derivedAbilities`). | where it began, "for a life from before it" |
| **where it counts** | The kinds of work an ability is judged in, and what the teacher looks for in each (`abilityReaders`). | which work reads it |
| **how much a session gets done** | How far one sitting of preparation (learning lines, table work, a revision) moves it; an ability speeds it (`stepSpeed`). | how far a step goes |
| **full**, **Mastered** (an ability) | An ability at 100, or stamina at the fittest a body your age can be: no work asks more of it (`atFull`). | work that reads it asks nothing more |
| **classes reach** | Where classes and coursework level off for an ability or a technique; practice takes you past it (`reachOf`). | where ordinary work levels off |
| **Familiarity** | The genre score study builds: films watched and plays read (`genre.study`). Shown beside Work In It (Core). | |
| **What a self-tape in it asks** | The techniques a genre's brief stages, where the research holds it at medium or high confidence (`applied`). | applied as requirements |
| **calls for**, **calls on** | What a genre, a register, a reading or a way of playing asks of your techniques and abilities, and what a self-tape is **judged more on** (`concernWords`, `READER_WAYS`). The advice says how many of your recent pieces call on an ability: "your last piece calls on it", "2 of your last 5 pieces call on it". | reads, draws on, weighs more |
| **moment by moment** | A piece judged in its parts, each with its own result (`segments`). | part by part |
| **complete at** | The preparation that counts as complete for a part of a piece (`required`). | "90% of 80%" |
| **the advice's forecast** | What 20 hours of an exercise would be worth on your recent work, replayed with you as you are now (`trainingForecast`), said as "worth about … a piece". | worked out again with you as you are now |
| **replayed with you as you are now** | Your recent pieces judged again at your levels today, which is how the advice's forecast is made. | worked out again |
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
| **estimated from its conventions** | A genre's register where the research says nothing of how it's played (`basis: 'reading'`). | SLATE's reading of its conventions |

## Money

From the money area (`money/glossary.md`). Available and pending money, the payment plan, estimated, an estimated
exchange rate and the game are Core's.

| Say | What It Means | Instead Of |
|---|---|---|
| **checking account** | The everyday account wages are paid into and spending comes from (`kind: 'checking'`). A bank's own name for it is used beside it (Chase Total Checking, AktivKonto). From 2026-10-19 (brief 15): the game is written in US English, and the owner's own example said checking account. Until then this row said current account, with checking account the word to avoid. | current account, "what you spend from" |
| **primary account** | The checking account money comes from unless you say otherwise: the debit card's everyday purchases, cash from a machine, bills paid by hand, a new standing order or autopay (`primaryAccountId`, `PRIMARY_DOES`). Making another account primary moves nothing already set up. | "the account the day comes out of", "Primary." alone |
| **savings**, **easy-access savings** | A savings account at a bank where you keep a checking account, one per bank. Easy-access, as against a term deposit. | "what you put aside" |
| **term deposit** (and the bank's own name: CD, Fixed-Term Savings) | Money locked away at a fixed rate for the bank's term (`category: 'term'`). | |
| **balance** | What an account holds now, added up from every payment in and out of it. An overdrawn balance is shown with a minus sign (−$3.30) and the word Overdrawn, to the cent; Home's Money line writes a negative worth the same way (−$227). | "the sum of the postings", -$3 |
| **posted balance** | Only the payments that have gone through; the available balance (Core) has pending card payments taken off too. | "completed items" |
| **overdrawn**, **overdraft** | Below zero. The overdraft is what the bank pays past zero, arranged or not, on its terms. | "under", "what's under" |
| **monthly fee**, **waived** | An account's fee and the conditions that cancel it in a month: "waived in any month you keep $1,500 in it all month". | "waived with keeping …", "unless that changes" |
| **minimum payment** | The least a card statement asks to be paid by its due date. | "the least a statement asks" |
| **statement**, **due date** | A card's monthly statement, and the date its payment is due. | |
| **late fee** | What paying less than the minimum by the due date costs. | "a payment short of the minimum costs" |
| **credit record**, **credit score** | The record each month's report keeps, and its figure, scored 300 to 850. The guide says credit score for the figure a bank approves from (620) and prices by, and credit record for what a late payment goes on. | "your record" alone where the card's record could be meant |
| **charged off**, **collections** | A debt the bank stopped pursuing itself and sent to collections; on your record until paid. | |
| **standing order**, **payment set for a date**, **autopay** | A monthly payment of your own into savings; a one-off payment on a day you choose; a card's automatic payment from a checking account. | "scheduled payment" (kept as the notice's title) |
| **notice period** | The months a German savings account needs before it closes, past what a month lets out; the days a bank needs to end a term deposit early. Not a notice (Core). | "the notice ran out" |
| **dormant**, **reactivate** | An account unused for the bank's months is blocked until you press Reactivate. | "untouched … blocked until it's used again" |

## Papers And Taxes

From the papers area (`papers/glossary.md`). Apply, issued, in hand, estimated, Source, the payment plan, in the game and
Assumed in the game are Core's; health cover and its words are under Health.

| Say | What It Means | Instead Of |
|---|---|---|
| **tax return**, **your return**, **the return for 2026** | A year's income tax settled with the IRS and the state, prepared each February 1 (`registerTaxReturn`). | 2026's, the year's return worked out |
| **file**, **File It** | Send the return in. Filing takes any balance from your bank at once (`tax.file`). | |
| **You Owe**, **Your Refund** | The return's last line: tax still to pay, or tax coming back. | Comes Back To You |
| **refund** | Money the IRS or a state pays back, on its own schedule (`RETURN.refundDays`, `refundDays`). | back, comes back |
| **Who It's Owed To** | The split of a year's balance between the IRS and each state (`owedToOf`). | |
| **the IRS**, **Connecticut DRS** and each agency's short name | Who collects. A state's short name is its own (`StateRules.short`), and a state's refusal names it. | the authority, in prose |
| **tax**, **penalties**, **interest** | The three parts of what's owed, in that order on screen (`Part`). | a part, for any of them |
| **a partial payment** | A payment less than all of it, split by the payee's order. | a part |
| **bill**, **letter** | What an authority sends, named by its code and title (CP14, CP501, DRS Bill); it arrives as a notice (Core). | |
| **levy** | An authority taking what you owe from your bank accounts. | |
| **Apply For The Plan**, **A payment missed**, **Declined** | A payment plan's button and its statuses besides Being Decided and In Force (below), the IRS's and a state's alike. | Ask For The Plan, Refused |
| **setup fee**, **revision fee** | The IRS plan's charges (`PLAN.fee`, `PLAN.reviseFee`). | the fee, alone |
| **lowest monthly payment** | What you owe spread over the IRS's longest term, the least a monthly plan takes (`leastMonthly`). | the least a month |
| **lien** and its statuses: **Notice Of Intent Sent**, **Filed**, **Paid: Release To Come**, **Released**, **Asked To Be Withdrawn**, **Withdrawn**, **Not Filed** | A public claim recorded for unpaid tax (`Lien`), filed "when collection reached that stage" or "because the payment plan requires one". | It secured |
| **release**, **withdrawal** | A lien ended once paid, and a lien treated as never filed. Not the same thing. | |
| **amended return** | A correction filed after the return (`tax.amend`). | refigures |
| **the IRS's own return** (Filed by the IRS) | A return the IRS files for you when you don't, which your own replaces (`SUBSTITUTE`). | substitute, in prose |
| **passport**, **ID card**, **driving license** | The papers that prove who you are. A paper counts only once it's issued and arrives. A wait is said in the right number: "Up to 28 days", "1 day". | travel document, in prose; "1 days" |
| **Being Decided**, **In Force** | An application the authority hasn't decided yet, and one granted and in effect: a document's Status on Papers, and a payment plan's, which its panel's subtitle says in sentence case (“Being decided”). Applying is never holding (Core). | With the IRS |
| **Status** (a document's), **Reported Lost**, **Canceled**, **Run Out** | A document's row on Papers, beside Being Decided and In Force. | Standing, for a document |
| **Your Status There** | Where you stand on residence in each country (Residence Abroad). | Where You Stand |
| **permission to work**, **OPT** | A noncitizen's right to work in the US; OPT is an F-1 graduate's (`documents.apply_opt`). | leave to work |
| **US status**, **out of status** | An F-1's lawful stay, and staying past its end (a noncitizen who has stayed past their permission to be in the country). What follows is said as the game's rule. | void, for good, stayed past your status |
| **grace period** | The days of status after permission ends (`STATUS_GRACE_DAYS`). | grace, alone |
| **Social Security number** | The number work-study needs; the game keeps whether you hold one, not the number. | |
| **claim**, **Claim filed** | An unemployment or benefit claim (`benefits.claim`). | Filed, alone |
| **base period**, **waiting week** | The quarters a claim's wages come from, and the first unpaid week. | |
| **claim it**, **You've already claimed it** | Starting a pension. | drawing it |
| **Your bank can't cover $…, so nothing was charged** (or **paid**, **changed**, **moved**) | The one refusal for a fee or payment your accounts can't meet, on Papers, Health Cover, School and Money alike (`docs/STYLE.md`, Errors and unavailable actions). Where you chose the account and the amount, the figure is what it has: "… has only $…, so nothing was moved." Until 2026-10-17 the health area's and Money's were worded their own way (`editorial/batches.md`, batch 1). | … is more than the bank can cover; It costs …, more than your bank can cover; … only has … in it |

## Health, Body And Time

From the health area (`health/glossary.md`) and, for the calendar and the clock, the frame area's. Condition, energy,
stamina, morale, health, wellbeing and readiness are Core's; out of status is Papers'.

| Say | What It Means | Instead Of |
|---|---|---|
| **measure** | One of the eight wellbeing measures, when it needs a common noun: "the measures it moves". | dial |
| **fitness** | How trained your body is: the same figure as Stamina on the Player Profile (`attributes.ts` reads `wellbeing.fitness` for stamina). Work Out and the training classes build it; it holds three days, then falls toward everyday life's 35. Rest doesn't build it. | |
| **sleep debt**, **sleep owed** | Hours of sleep owed: each waking hour adds about a third of one, a night pays it back. The hours a normal day awake adds are said as that, not as owed. The Profile's Current Condition says it in whole hours: "No sleep owed", "1 hour of sleep owed". | on the books, Sleep owed 1 hours |
| **a long-term condition** | Depression, asthma, high blood pressure, diabetes or arthritis (`CONDITION_LABEL`, `health.chronic`): kept up or left untreated on Papers, under Health Cover. Said this way wherever it could be confused with condition, the measure. | a condition you carry, A Condition You Carry, a condition, alone |
| **kept up**, **left untreated** | A long-term condition with its care paid each month, or without it. The buttons are Keep It Up and Let It Go. | kept up / left alone |
| **laid up** | Kept from classes, work and training by an injury (`laidUp`, `offWorkUntil`); the School excuses the absences. | off work |
| **health cover**, **public cover** | A plan that pays toward care, by its program's own name: Yale Health, HUSKY D or Medi-Cal (Medicaid), the Essential Plan, Covered Connecticut, or a marketplace plan (`coverLabel`; This Month on Your Cover). Public cover is the state's programs. | Medicaid, for Connecticut's |
| **the marketplace**, **The Marketplace** | The ACA exchange, and Papers' panel for it: open in open enrollment, or for 60 days around a loss of cover. The panel says where you stand, then a short overview, and its rules behind Who Public Cover Takes, Medicaid's Work Rules From 2027 and Paying For A Marketplace Plan. | |
| **special enrollment** | The 60 days to enroll in the marketplace after losing cover (or before Yale Health's end). Dropping a plan or leaving it unpaid doesn't open them. | |
| **work rules** | From January 1, 2027, what Medicaid (HUSKY D) asks of a month: enough income, time at the School, or an exception (your age, SNAP, a stay in hospital you ask to count) (`PUBLIC_COVER.workEarnings`). | community engagement, engagement, "by 80 hours' work" |
| **a notice of noncompliance** | Medicaid's letter when it can't find the work rules met: 30 days from its receipt to answer, then a denial or the end of cover. | |
| **your share** | What a plan leaves you to pay for a piece of care: "Your share is $187.20". | what the plan leaves |
| **what your plan doesn't cover** | The same, said of a month's care for a long-term condition. | at what the plan leaves |
| **paid this year** | Care And Its Bills' subtitle: what you've paid for care this year, and, for a plan with a most a year, of how much ("$20.00 of $9,100.00 paid this year"). HUSKY D and Covered Connecticut have no most, and say only what's been paid. | "$20.00 of $0.00 paid this year" |
| **medical debt** | A bill unpaid at its due date, owed to Your Providers in the Owed For Medical Care account. | |
| **due on**, **your share is … due on …** | A bill's date (`dueAt`, 30 days after the care): on it the bill is taken from your checking account, with its overdraft and any savings linked to it (`payFromCurrent`), or, if it can't be paid, it becomes medical debt. A notice names the date, as Papers does. | due in 30 days |
| **financial assistance** (a hospital's) | A Connecticut hospital's discount on a bill, by income against the poverty line (`CHARITY`, `health.apply_aid`): taken off an uninsured bill when it's billed, or off a bill you put in for it with Apply For Assistance. The Assistance column says Free Care, N% Off, Over The Limit or Assistance Taken Off. "Charity care" stays among How This Works' search words. | charity, charity care, the hospital's charity, Charity Taken Off |
| **Your Doctor**, **Your Pharmacy**, **The Practice Your Cover Uses**, **Any Pharmacy, At The Typical Price** | The practice and chain care is had at, and the choice before you pick one. | As Your Cover Has It, At The Median |
| **workers' compensation** | What pays an injury at work: its care, and a share of the week's wage while you're laid up. | |
| **happens without you** | Something on the calendar that runs on its own when the clock reaches it (a payday, a statement). | the world handles it |
| **a plan of your own**, **your own plans** | What you put on the calendar yourself (`life.commitment`). Only these can be skipped. | |
| **Go**, **Stand Here**, **Skip It**, **Call It Off** | A stop's answers: go to it; wait with the clock paused; walk away from a plan of your own; call off a plan before it starts, or a partner's rehearsal at its hour, at a cost to their trust. | |
| **clash** | Two commitments at the same time; the calendar flags them. | a collision, wanting you at once |
| **Advance**, **On The Way**, **Skip To Event** | Moving the clock on: the menu's lines; the confirmation listing the commitments the move passes; choosing an event to move to. | jump in the player's sentence (the guide keeps it for a move) |
| **Sleep**, **Hours**, **Now**, **You'd Wake At**, **Sleep N Hours**, **Not Yet** | The Sleep dialog: the slider, the time now and the time you'd wake, and its buttons (Sleep 1 Hour at one hour). "This would count as tonight's sleep." warns of a sleep that stands for the night. | You'd wake at, Sleep 1 Hours |

## Start, Home, Notices And Controls

From the frame area (`frame/glossary.md`). Question, notice, commitment, the clock and estimated are Core's; the
calendar's words are under Health, Body And Time.

| Say | What It Means | Instead Of |
|---|---|---|
| **a life** | One save: a character and their world, in one of the three slots. "That life couldn't be started." | a universe (kept in "This ends that universe."), a save where the character is meant |
| **slot**, **Slot 1** | Where a life is kept on this device or the server; there are three. | |
| **backup** | The copy of a slot kept before it's written over, and Restore Backup, which brings it back. | a checkpoint |
| **save format** | The version of a save's layout, shown as Save Format 94 on a slot. A save made by an older version is updated when opened, a backup kept first. | schema, schema version |
| **What Needs You** | Home's panel of questions and unread notices. | the Decision Center |
| **urgency**, **importance** | A question's and a notice's place in the order, out of 100 (estimated). Overdue questions come first, then the most urgent; notices most important first. | weight, heaviest |
| **School** | The School screen, by the rail's name, the breadcrumb's and the Profile's button to it. | Your School |
| **an error in the game** | A failure the game didn't foresee. The player's sentence says what changed; the detail is a developer's, in the console. | `<command id> failed: <message>` |

## The Guide And Help

From the tutorial area (`tutorial/glossary.md`). Estimated, your wellbeing and a long-term condition are Core's or
Health's.

| Say | What It Means | Instead Of |
|---|---|---|
| **the guide** | The seventeen chapters a new life reads in order, each opening its part of the game (`CHAPTERS`, `content/tutorial.ts`). Opened with **Guide**, at the top of the screen. | onboarding, the tutorial, as a name on screen |
| **chapter** | One part of the guide. Reading it (**I've Read It**) opens that part of the game. | lesson, step |
| **opens**, **open** | What reading a chapter does to a part of the game: its buttons, panels and underlined words start working. A part not open yet says **Locked**. | unlocks, enabled |
| **Locked** | A button or panel whose chapter isn't read. Pressing it opens the guide at that chapter. | a padlock, disabled |
| **The Details** | The figures and finer conditions behind a chapter's steps, folded away. | the fine print, as a chapter's |
| **How This Works** | The help: an entry for every feature, beside its panel, and its contents with **?** and its search with **/**. | the reference, as a name on screen |
| **entry** | One page of How This Works, about one feature. A quote in it is the game's words exactly (`tools/guide-quotes.mjs --check`), and a label it names is one a screen has (`tools/tutorial-routes.mjs --check`). | article, topic |
| **contents** | How This Works' list of entries, by what you're trying to do, with **On This Screen** first. | index |
| **Show Me Where** | Goes to the entry's screen and tab. **Back To Help** returns to the help as it was, and **Back To** a screen returns to the screen and tab you left. | Go There, for help |
| An entry's parts | **Where To Find It**, **When You Can Use It**, **What To Press**, **What You Need First**, **What Happens**, **How It Connects**, **What To Do Next**, **If You Can't**, then **What Decides It** and **A Worked Example**: the brief's eight questions, in its order. | Steps, What It Needs, What The Game Reads, Connected Systems, Why It Might Not Be Available |
| How It Connects' headings | **Comes First**, **Changes Straight Away**, **Changes Later**, **Counts Toward**, **Kept In Your Record**, **Worth Doing With It**. | Needs First, Changes At Once, Changes Later, On The Clock, Read When Work Is Judged, Kept In The Record |
| **the clock waits** | While the guide or How This Works is open, the clock doesn't move. Said under every help page. | the clock holds, paused for help |
