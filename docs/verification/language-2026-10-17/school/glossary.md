# The School's Words

For `docs/GLOSSARY.md`, its School section, in its columns. Written by the school area of brief 14 from the screens and
the rules they name. Terms the Core table already has (academic standing, coursework warning, term review, feedback,
prepared, fully prepared forecast, how you play it) aren't repeated here; where this area uses one, it uses it as Core
says.

| Say | What It Means | Instead Of |
|---|---|---|
| **a piece**, **a piece of coursework** | One assignment a course sets: a scene, a song, a movement score, a written analysis (`Assignment`). The card's title is the course and the piece: "Acting I: Scene Study". | the work, this work (in refusals and notices) |
| **set**, **due in class** | A course sets a piece in class and it's due at a later class (`setOn`, `dueOn`, the course's meetings). | due at the meeting, its last meeting |
| **show**, **shown**, **show again** | A piece is shown in class on its due day. A piece with a note to take is shown again at the course's next class (`status: 'revising'`). | |
| **the band**: **Unready**, **Working**, **Strong**, **Exceptional** | How a piece came out when shown, from its score of 100 (`BAND_LABEL`, `bandOfQuality`). Always capitalized as the screen shows it. | |
| **Shown Today** | The line on each open piece saying what it would come to if shown today on a good day, and what's holding it back. It's a forecast (`showingForecast`), never a result, and its words are in the present tense. | the forecast, as if it were a result |
| **the parts of a piece** and their names (**Lines**, **Knows The Scene**, **With Your Partner**, **Table Work** and the rest, as each card labels them) | What a piece's preparation is made of (`t.dims`). Each **counts for** a share of the piece. Complete at 90%. | dimension, input; "weighs" |
| **still to finish** | The parts of a piece short of complete, each with the steps that work on it (`shortParts`, `remedyWords`). | short of complete |
| **a step** | One of the buttons that prepare a part: Learn The Lines, Read The Scene, Run It With A Reader (`activitiesOf`). | |
| **Table Work** and **an answer the text supports** | The questions a scene asks you to decide at the table, and whether the play supports your answer (`questionsFor`, `Option.supported`). More than one answer can be supported. | a reading the text supports for each question of the Table Work (kept where the reading itself is meant) |
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
| **Orientation**, **Catch Up** | The first week's five sessions, each once; one missed can be caught up on the Coursework tab. | |
