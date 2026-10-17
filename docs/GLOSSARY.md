# The Player's Words

One name for one thing (`docs/STYLE.md`, Talking to the player). Each entry gives the word a player sees, what it means
in the game (and the code it names, so a writer can check the meaning), and the words it replaces. A term used by more
than one part of the game is here, in Core, and only the coordinator of a pass changes it. A term only one part uses is
in that part's section. Code identifiers keep their names; only what's shown changes.

Written 2026-10-17 for the owner's brief 14. Where the game said something else until then, the "Instead of" column
keeps it.

## Core

| Say | What It Means | Instead Of |
|---|---|---|
| **ability**, **abilities** | One of the twelve, 0 to 100: Emotional Depth, Presence, Listening And Responsiveness, Imagination, Focus, Memory, Adaptability, Composure, Vocal Expression, Physical Expression (the acting abilities), Discipline and Stamina (the general ones) (`ABILITY_DEFS`). The Profile panel that shows them is titled Attributes And Craft. | attribute in prose, dial, input, "what the work reads" |
| **technique**, **techniques** | A craft skill the school trains, 0 to 100 (`TECHNIQUES`). **Mastered** at 90 (`MASTERED`): past that, no piece asks more of it. | skill id, "the craft" as a count |
| **craft**, **overall craft** | Your techniques taken together; overall craft is their average (`meanCraft`). | |
| **genre knowledge** | How well you know a genre: the better of what you've studied (watching films or reading plays of it) and what you've worked in it (`genreKnown`). | engagement, familiarity and practice as separate scores in prose |
| **practice** | Work you set yourself outside class: an exercise, a self-tape (`practice.exercise`, `practice.self_tape`). | deliberate practice as a term |
| **work in a genre** | Nights on stage, self-tapes and class scenes in that genre, which count toward its genre knowledge. | genre practice, when it would be confused with practice above |
| **your performance**, **the scene**, **the piece**, **the tape** | What's judged: a piece shown in class, a night on stage, a self-tape. Name the thing itself. | the take (except a self-tape or an audition, where "take" is the industry's word), the work, the output |
| **what your teacher looks for** and its names (Believability, Connection, Consistency, Responsiveness and the rest as the screen labels them) | The qualities a performance is judged on (`Dimension`, `DIMENSION_LABEL`). | dimension, quality dimension |
| **part of the scene**, **moment** | One of the pieces a scene or a night is judged in (`segment`, `unit`). | segment, unit |
| **prepared**, **how prepared**, **ready** | How far a piece's preparation steps are done (learning the lines, rehearsing on your feet and the rest). | rehearsed in, complete preparation, "the preparation reads" |
| **fully prepared forecast** | What the game expects the piece would get if every step were done, on a good day. Always called a forecast, never a result. | the forecast as if prepared |
| **how you play it**, **a way of playing it** | An interpretation chosen for a scene: restrained or expansive and the other choices the scene offers. Choosing one isn't rehearsing it: the choice has to be rehearsed before it pays off. | approach, a choice rehearsed in, a side |
| **suits the scene** | The scene favors a way of playing it (`suitabilityOf`, the grain). | with the grain, against the grain, the grain |
| **condition** | How fit your body is for work today, after illness, injury and rest. | |
| **energy** | How much you have left today. Sleep and food bring it back. | |
| **stamina** | An ability: how long you can keep going in a long scene or a night on stage before you tire. It's trained by working out and falls without it. | |
| **health** | Illness, injury and the care you get for them, and your health cover. Not the same as condition, energy or stamina. | |
| **wellbeing** | Energy, stress, sleep debt, nourishment, morale, hygiene, condition and fitness, as the screen labels them. | dials |
| **readiness** | How sharp you are for work today, from your wellbeing. | |
| **feedback**, **your teacher's notes** | What the faculty say about a piece once it's shown. It's the school's assessment in the game, written as a teacher would say it. | the note's focus, the evaluation found |
| **academic standing** and its names: **good standing**, **academic concern**, **academic warning**, **dismissed** | Where the faculty's term review puts you. Say what the next step down means: "a second term short of what's asked puts you on academic warning." | the standing falls a step |
| **coursework warning** | A notice during a term that too much work is unready or unshown. It isn't the review: the review comes at the term's end. | |
| **term review** | The faculty's decision at the end of each term. | |
| **the clock** | The game's clock at the top of the screen. It's a real control and keeps its name. | |
| **commitment** | Something on the calendar you're expected at. The clock stops for it. | |
| **available** and **pending** money | Available is what you can spend now. Pending is money on its way in or out that hasn't settled. Never call pending money available. | |
| **apply**, **applied**, **issued**, **in hand** | Applying for a document starts it. You hold it only once it's issued and arrives. | |
| **estimated** | A figure the game had to estimate because no source publishes it. Said in the source line, not mid-sentence. | SLATE's estimate, SLATE's reading, SLATE's design, SLATE's own |
| **Source:** | Where a real figure or name comes from, in one line at the foot of what it explains. | |

## School

To be written by the school area of brief 14, from the screens and the rules: assignments, showings, notes, the casting
pool, productions, leave and the degree.

## Profile, Abilities, Genres And Advice

To be written by the profile area of brief 14: growth and its limits, the advice and its forecast, genres and
interpretation.

## Money

To be written by the money area of brief 14: accounts, cards, statements, fees, holds and transfers. Decision 4's
banking items keep their behavior and their statuses.

## Papers And Taxes

To be written by the papers area of brief 14: documents, applications, status, taxes and benefits.

## Health, Body And Time

To be written by the areas of brief 14 that hold them: care, cover, the body's wellbeing, the calendar and the clock.

## Start, Home, Notices And Controls

To be written by the frame area of brief 14: creation, the save slots, Home, notices and the controls every screen
shares.
