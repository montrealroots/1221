# Every Touched Feature, Traced

Written by `tools/trace.ts` from the guide's registry and the tests; don't edit it by hand. 50 entries in the four
areas the connected-journey pass of 2026-10-12 rebuilt, and from 2026-10-20 the career's (brief 19), each traced Action →
Preconditions → Costs → State → Consumer → Feedback → History → Later consequence. The words are the guide's own, which
carry the rules' figures; the four areas' entries' claims were checked against the engine by a second reader when they
were written, and the career's by the tests that drive each of its commands.

**Unconsumed** (a row nothing reads): none.
**Read Only** (screens and looks, changing nothing): `start.home`, `start.find`, `productions.casting`, `productions.nights`, `craft.profile`, `craft.work`, `craft.identity`, `career.overview`, `career.reasons`, `career.pay`, `career.commission`, `career.reference`.
**Untested** (a command no test drives): none.

## Getting Started

Home, how the guide and this help work, and finding your way around.

### Home And Where You Are (`start.home`)

- **Action:** `ui.where`, `look.day`, `look.place`, `look.region`, `look.country`, `look.currency`, `look.season`, `look.daylight`, at Home, The Line Under The Greeting (`/home`). Opens: From the guide’s first chapter, “Your Life, Hour By Hour”.
- **Preconditions:**
  - Home is there from your first moment in the game.
  - The Guide And This Help first: A word becomes a link once you’ve read the guide chapter that covers it.
- **Costs:**
  - Time: None: reading Home and opening words doesn’t move the clock
  - Money: None
- **State (what changes at once):**
  - Home only shows the world. Reading it changes nothing.
- **Consumer (what reads it):**
  - The Clock: Play And Pause, immediate: The local time is the game’s clock, so it moves when the clock does.
- **Feedback (how to read what comes back):**
  - Your town, pressed, says it’s your home, and how many people live there.
  - Daylight gives today’s sunrise and sunset, and how many hours of daylight that makes.
- **History (kept in the record):**
  - (none)
- **Later consequence:**
  - As the clock moves the time, the season and the daylight move with it.
- **Tested by:** a screen or a look; the UI journeys (`tools/acceptance-ui.mjs`)

### The Guide And This Help (`start.guide`)

- **Action:** `tutorial.read`, at Guide, How This Works, And ? Or / On Any Screen (`/home`). Opens: Always.
- **Preconditions:**
  - The guide is always there. If you chose “I Know SLATE” when you made your character, everything is open from the start, and you can read the chapters in any order.
  - The Clock: Play And Pause first: With the guide, the clock starts paused, and reading “The Clock” opens Play.
- **Costs:**
  - Time: None: the clock waits while a chapter or an entry is open
  - Money: None
- **State (what changes at once):**
  - Reading a chapter opens what it names: its buttons, its panels and its underlined words.
  - Opening How This Works changes nothing.
- **Consumer (what reads it):**
  - Home And Where You Are, immediate: Reading a chapter opens Home’s panels and the underlined words it names.
  - The Calendar, immediate: “What’s Coming” opens the calendar, and the dialog that asks what to do when a commitment comes up.
- **Feedback (how to read what comes back):**
  - Locked on a button means you haven’t read its chapter yet. Press it to open the guide at that chapter.
  - In an entry, an estimate says it’s estimated. Every other figure is the rule the game uses.
- **History (kept in the record):**
  - (none)
- **Later consequence:**
  - What a chapter opens stays open from then on.
- **Tested by:** `tutorial.read`: `tests/b20-craft-promises.test.ts`, `tests/b20-creation-twins.test.ts`, `tests/b20-guide-chapters.test.ts`, `tests/b20-guide-promises.test.ts`, `tests/b20-guide-wiring.test.ts`, `tests/defects-g3-1.test.ts`, `tests/defects-r8-1.test.ts`, `tests/evidence-g02-life.test.ts`, `tests/evidence-g29-ui.test.ts`, `tests/evidence-g31-ui.test.ts`, `tests/evidence-g32-ui.test.ts`, `tests/evidence-g33-ui.test.ts`, `tests/guide-examples-craft.test.ts`, `tests/help-mechanics.test.ts`, `tests/trace-commands.test.ts`

### Finding Your Way (`start.find`)

- **Action:** , at The Menu And The Breadcrumb (`/home`). Opens: Always. A place joins the menu once you’ve read its chapter.
- **Preconditions:**
  - A screen whose chapter you haven’t read opens as Locked, and names the chapter to read.
  - The Guide And This Help first: A place joins the menu once you’ve read its chapter.
- **Costs:**
  - Time: None
  - Money: None
- **State (what changes at once):**
  - Moving between screens changes nothing in the world. A screen keeps its tab while you’re elsewhere.
- **Consumer (what reads it):**
  - (none)
- **Feedback (how to read what comes back):**
  - The number beside Home is the questions waiting in What Needs You. Recent Updates, on Home, says how many notices you haven’t read.
- **History (kept in the record):**
  - (none)
- **Later consequence:**
  - (none)
- **Tested by:** a screen or a look; the UI journeys (`tools/acceptance-ui.mjs`)

## Coursework And Partners

Preparing the pieces your classes set, table work, how you’ll play a scene, your teachers’ notes, rehearsing with a partner, your classmates, working a problem through and the Actor Showcase.

### Preparing Coursework (`coursework.prepare`)

- **Action:** `school.prepare`, `look.assignment`, at School, Coursework (`/workspace/school?tab=coursework`). Opens: From the guide’s chapter “Drama School”, once a course has set a piece: at one of its classes, or for the first-year fall courses at orientation’s session on the courses.
- **Preconditions:**
  - A piece set and open. A course sets its next piece at one of its classes when none of its own is open and the term still has the class it would be due at, a set number of classes later (four for Scene Study in Acting I). Where the work has them, the piece comes with a scene, your part and a partner from the class.
  - For a step that builds on another: Learn Lines needs the scene read to 30%, and Rehearse Alone the lines learned to 25%.
  - For a step in a studio or on your feet: energy of 25 or more and no injury that stops training. A studio or the library also needs orientation’s tour behind you.
  - New feedback on the piece read, and anything your partner has asked about it answered.
  - Free time for the step’s length: at nothing else, and due nowhere before it would end. Learn Lines is checked for the scene’s own length, 45, 75 or 105 minutes, the time it takes.
  - Orientation Week first: The tour opens the studios and the library for your steps, and the session on the courses sets the first-year fall’s first pieces.
- **Costs:**
  - Time: Each step its own. In Scene Study: Read The Scene, 40 minutes; Learn Lines, 45, 75 or 105 by the scene’s length; Rehearse Alone, 60; Work On The Note, 60; Rehearse With Your Partner, a rehearsal of 90 minutes agreed with them (an estimate)
  - Money: None
  - Your Body: Desk work counts as activity at 1.5 METs, and a step that needs a studio or your feet at 2.5. Rehearse Alone is on your feet, so it counts at the higher figure (an estimate)
- **State (what changes at once):**
  - The clock moves on by the step’s minutes, and its part rises by its share of what’s left. A part at 97% or more has nothing more to gain from it.
  - A step that trains a skill trains it at 25% of a class’s weight, for at most 3 such steps on one piece.
  - While it still moves the piece, a step practices the ability it calls on: knowing the scene your focus, lines your memory, a step at the table your imagination, a note your adaptability.
  - A rehearsal step, Rehearse Alone and the steps like it, also rehearses the way you chose to play the scene, if you chose one. A daily step counts once a day.
- **Consumer (what reads it):**
  - How You’ll Play A Scene, immediate: Each rehearsal step rehearses the way you chose to play the scene.
  - The Player Profile, immediate: A step trains its skill for up to 3 steps a piece, and practices the ability it calls on.
  - Feedback And Your Notes, scheduled: In the class it’s due, the preparation is judged and the showing gives its band and its note.
  - Your Standing And Classes, evaluation: The term’s review counts each piece’s band: once 3 or more are due, 50% Unready or not shown is short.
  - How You Are, evaluation: Readiness sets how far each step moves its part, and your condition in class counts in the showing.
  - Your Work So Far, history: Each showing is kept on your record, where Your Work So Far reads your strengths and what keeps holding you back.
- **Feedback (how to read what comes back):**
  - A part’s figure is how far it’s prepared. Note Priority is how much the part counts when the teacher picks what to note; the result reads each part through the qualities it affects. The part put first counts for more in both, and the line beside it says why it was chosen.
  - At 90% a part is complete for the showing. Below it, the qualities it affects are held back: a part at nothing holds them to 35% of themselves, whatever its Note Priority.
  - Shown Today is how the showing would judge it with the luck of the day taken out, and you as rested as you could be. It moves when a part does, and the band beside the figure says what it would earn. It’s a forecast, not a result.
  - A scene you’ve worked before says so, and asks for the other part, or for another answer at the table.
  - Work Shown keeps your last twelve pieces and how each went: its band, or Not Shown, Excused, Not Shown, or Not Shown Before The Term Ended; and for a piece shown again, Note Taken or Note Not Taken with the band it was shown again at, or Not Shown Again, Counted Unready. Coursework This Term on Standing And Craft counts the term’s pieces as the review will.
- **History (kept in the record):**
  - Your Work So Far: Each showing is kept on your record, where Your Work So Far reads your strengths and what keeps holding you back.
- **Later consequence:**
  - At nine on the day it’s due the course meets, and the piece is shown once, in place of the class’s usual growth: the course’s skills grow 85% of a usual class’s for Unready, 100% for Working, 110% for Strong and 120% for Exceptional.
  - If you’re away with an excuse (called in sick, in hospital or laid up), it moves to the course’s next class, or is excused if none is left. Away without one, it’s Not Shown and can’t be shown later: it counts as due and Unready at the term’s review, a course with half or more of its pieces due not shown isn’t passed, and a partner’s trust falls 12. Its notice says so, with the course’s count so far.
  - Once 6 of the term’s pieces have been due and 35% or more of them were Unready or not shown, as the review counts them, A Word On Your Coursework comes, once. It’s a warning, not the term review: it says how many, the day the faculty review the term and what the review would do to your standing if the term ends short, then what they were short on (the part most often unfinished on two or more of them with the steps that work on it, or that every part of each was unfinished, or that each was short on a different part). The review’s notice says what they were short on the same way.
  - At the term’s review, once 3 or more pieces are due, 50% or more of them Unready or not shown is short, and 50% or more Strong or better is noted.
  - A piece the course revises comes back to be shown again at its next class, with the note to take; a piece in rounds is shown a round at a time. A piece still open when the term’s classes end lapses.
- **Tested by:** `school.prepare`: `tests/approaches.test.ts`, `tests/attributes-phase-2a.test.ts`, `tests/attributes-phase-2b.test.ts`, `tests/b20-craft-bite.test.ts`, `tests/b20-craft-promises.test.ts`, `tests/b20-creation-personality.test.ts`, `tests/b20-guide-chapters.test.ts`, `tests/defects-g10-1.test.ts`, `tests/defects-g28-1.test.ts`, `tests/defects-g8-10.test.ts`, `tests/defects-g8-9.test.ts`, `tests/evidence-g07-life.test.ts`, `tests/evidence-g09-life.test.ts`, `tests/evidence-g18-school.test.ts`, `tests/evidence-g19-school.test.ts`, `tests/evidence-g20-school.test.ts`, `tests/evidence-g22-school.test.ts`, `tests/evidence-g23-school.test.ts`, `tests/evidence-g24-school.test.ts`, `tests/evidence2-b03.test.ts`, `tests/evidence2-b07.test.ts`, `tests/evidence2-b08.test.ts`, `tests/evidence2-b10.test.ts`, `tests/guide-examples-coursework.test.ts`, `tests/journey-school-year.test.ts`, `tests/journey-three-students.test.ts`, `tests/mastery-integration.test.ts`, `tests/partners.test.ts`, `tests/pro-showcase.test.ts`, `tests/remaining-09-coverage.test.ts`, `tests/remaining-school.test.ts`, `tests/school-journey-gaps.test.ts`, `tests/table-work-unread.test.ts`, `tests/trace-commands.test.ts`, `tests/traits-connected.test.ts`

### Table Work (`coursework.table`)

- **Action:** `school.choose`, at School, Coursework, Table Work (`/workspace/school?tab=coursework`). Opens: From the guide’s chapter “Drama School”, on any open piece with a scene and a part of yours in it, once the scene is read to 30%.
- **Preconditions:**
  - The scene read to 30%, with Read The Scene.
  - An open piece with a scene and your part in it.
  - 10 minutes free.
  - Preparing Coursework first: Reading the scene to 30% with Read The Scene opens the questions.
- **Costs:**
  - Time: 10 minutes a question, and 10 more for each answer you change (an estimate)
  - Money: None
- **State (what changes at once):**
  - Your answer is kept, and the clock moves on 10 minutes.
  - The table work’s figure on the card moves with it.
- **Consumer (what reads it):**
  - Your Class, scheduled: A partner may come to class with another answer to a question you’ve answered, and ask you to keep yours, take theirs or try both.
  - Feedback And Your Notes, evaluation: The showing counts your answers as the table work, and an answer the text doesn’t support can be its note.
  - Rehearsing With A Partner, evaluation: An answer that differs from your partner’s leaves the scene together at 90% agreement until you’ve tried both.
- **Feedback (how to read what comes back):**
  - The figure under the course’s name for it (Table Work in Scene Study, Scansion And Table Work in Heightened Text Scene) is the table work as the showing will count it.
  - After the showing, each answer says “Why the text supports it” or “Why the text doesn’t support it”.
  - For a scene you’ve come back to, “Your answers differ from last time’s.” or “So far your answers match last time’s.” says whether you’ve found another reading yet.
  - Which answers the text supports is the game’s own judgment of each play, written so you can check it against the text.
- **History (kept in the record):**
  - (none)
- **Later consequence:**
  - In class, your partner may answer one of your questions another way, and you choose between Keep Your Reading, Try Theirs and Try Both Next Rehearsal.
  - When the piece is shown, the table work is one part of the preparation, and each quality it affects is held back by the least prepared part. Its Note Priority only decides what the note is about.
  - You put a note about an answer right when this piece, shown again, or a later one answers that question the way the text supports.
  - If you come back to a scene and are asked to read it another way, your answers are compared with last time’s.
- **Tested by:** `school.choose`: `tests/b20-craft-promises.test.ts`, `tests/defects-g8-9.test.ts`, `tests/evidence-g18-school.test.ts`, `tests/evidence-g24-school.test.ts`, `tests/evidence2-b07.test.ts`, `tests/evidence2-b08.test.ts`, `tests/guide-examples-coursework.test.ts`, `tests/integration-mastery.test.ts`, `tests/journey-school-year.test.ts`, `tests/journey-three-students.test.ts`, `tests/pro-showcase.test.ts`, `tests/table-work-unread.test.ts`

### How You’ll Play A Scene (`coursework.playing`)

- **Action:** `school.choose_playing`, at School, Coursework, How You’ll Play It (`/workspace/school?tab=coursework`). Opens: From the guide’s chapter “Drama School”, on any open piece with a scene in it.
- **Preconditions:**
  - An open piece with a scene in it: a piece with no scene has nothing to play one way or another.
  - A choice different from the current one: the button stays grayed until it is.
  - Preparing Coursework first: A choice pays off once it’s rehearsed, and the rehearsal steps, Rehearse Alone among them, are what rehearse it, with the rehearsals kept with your partner.
- **Costs:**
  - Time: None to choose. It’s rehearsed by the rehearsal steps and the rehearsals kept with your partner
  - Money: None
  - A Change Of Mind: Keeps 50% of what was rehearsed (an estimate)
- **State (what changes at once):**
  - “Chosen. You’ve rehearsed this way of playing it to … so far.” A first choice starts at 0%; the same choice again keeps all of it; a different one keeps 50%.
  - Leaving every aspect open takes the choice away.
  - The ways you choose are kept on your record of how you play.
- **Consumer (what reads it):**
  - Rehearsing With A Partner, scheduled: A rehearsal kept with your partner rehearses the choice too, as a rehearsal step does.
  - Feedback And Your Notes, evaluation: The showing counts the choice: what it favors, the abilities it uses, and how far it’s rehearsed.
  - Your Work So Far, history: Every way you choose and show is kept, and Your Work So Far names one you choose most of the time.
- **Feedback (how to read what comes back):**
  - Fully Prepared is the expected result with no luck either way, every part complete and a good day: what the choice can reach, not where the piece stands now.
  - “Doesn’t fit:” under a way says the scene doesn’t take it, and why.
  - The Scene names each way Suits The Scene, Either Way or Works Against The Scene, and the two or three things in the scene it rests on, for it or against it. It isn’t a verdict on the way: one you do well can still beat one that suits the scene better, and the result says what the way’s fit gave or cost apart from what your abilities cost.
  - “You’ve rehearsed your current choice to …% so far (it’s complete at …%)” is how far along it is, against the scene’s own mark.
  - With nothing chosen, the piece is judged by its own genre and material alone.
- **History (kept in the record):**
  - Your Work So Far: Every way you choose and show is kept, and Your Work So Far names one you choose most of the time.
- **Later consequence:**
  - Each rehearsal step rehearses the choice by 90% of that step’s own share of what’s left, and keeps doing so after its own part is complete, until the choice is complete at the scene’s own mark. A rehearsal kept with your partner does the same, by 90% of its own share.
  - The showing counts it with the rest of the preparation, and Your Work So Far names a way you choose most of the time as a habit.
- **Tested by:** `school.choose_playing`: `tests/b20-craft-promises.test.ts`, `tests/defects-g8-10.test.ts`, `tests/defects-g8-15.test.ts`, `tests/guide-examples-coursework.test.ts`, `tests/remaining-09-coverage.test.ts`, `tests/remaining-school.test.ts`, `tests/stage-interpretation.test.ts`, `tests/trace-commands.test.ts`

### Feedback And Your Notes (`coursework.feedback`)

- **Action:** `school.read_feedback`, at School, Coursework, Feedback, Work Shown And Your Notes (`/workspace/school?tab=coursework`). Opens: From the guide’s chapter “Drama School”, once a piece has been shown.
- **Preconditions:**
  - A piece shown. Mark As Read needs new feedback on a piece still open.
- **Costs:**
  - Time: None: reading it moves no clock
  - Money: None
- **State (what changes at once):**
  - Mark As Read marks the feedback read, and the steps on the piece open again.
- **Consumer (what reads it):**
  - Another Way At A Note, immediate: A note that’s open and given 3 times, on a part a piece prepares, opens another way to work on it on that piece.
  - Preparing Coursework, scheduled: A piece the course revises comes back open, due at its next class, with the note to take.
  - The Player Profile, immediate: The band sets how much the class grows the course’s skills, from 85% of a usual class for Unready to 120% for Exceptional.
  - Your Standing And Classes, evaluation: The term’s review counts the bands: once 3 or more pieces are due, 50% or more Unready or not shown is short.
  - Rehearsing With A Partner, evaluation: Under a paired piece, the scene together shows your partner’s preparation, timing, answers and any slip, separately from your band.
  - Your Work So Far, history: Each showing is on your record, and a note still open after 3 times shows in Your Work So Far as one that keeps coming back.
  - Your Standing And Classes reads it, evaluation: The review counts the term’s coursework as shown: once 3 or more pieces are due, 50% or more Unready or not shown is short.
  - Table Work reads it, evaluation: The showing counts your answers as the table work, and an answer the text doesn’t support can be its note.
  - How You’ll Play A Scene reads it, evaluation: The showing counts the choice: what it favors, the abilities it uses, and how far it’s rehearsed.
  - Rehearsing With A Partner reads it, evaluation: The showing’s scene together shows their preparation, timing, agreement and reliability, separately from your band.
  - Working A Problem Through reads it, evaluation: The showing judges the scene with each part’s own work and every discovery you kept.
  - The Actor Showcase reads it, evaluation: Each scene’s note comes at its first showcase day, and Los Angeles shows whether you took it.
  - The Director’s Notes reads it, history: Notes still open when the run closes go into your notes from the courses, and the next piece can ask for them.
  - The Nights reads it, history: At the closing, the notes still open go into your notes from the courses for the next piece.
- **Feedback (how to read what comes back):**
  - The heading reads Feedback, the band, the score out of 100 and the kind of note: A New Note, Still There, Better, Not There Yet, Note Taken, or The Next Step.
  - A note given before says when and in which course; one that’s better gives the figure then and now; one that had been taken and has slipped back says when you put it right.
  - A piece whose preparation was in place and still came out under Strong is told what held it back, your condition on the day or your craft, and what to do about it where there’s something to do. Then comes the next step to try.
  - Each course speaks in its own terms: acting of what you want and the other person, voice of breath and sound, movement of the body, and text of the reading. A note given often is said shorter, with what’s still open.
  - The Scene Together, under a paired piece, is the scene with your partner’s part in it. The band is for your own work.
  - Your Notes leaves out the next steps to try, and lists open notes first.
- **History (kept in the record):**
  - Your Work So Far: Each showing is on your record, and a note still open after 3 times shows in Your Work So Far as one that keeps coming back.
- **Later consequence:**
  - Once a later piece is shown with the part a note named at 75% or more, Your Notes marks the note Taken, with the day. It can be given again only if a later piece is shown with that part under 45%.
  - A piece the course revises is shown again at its next class. If you’ve taken the note, that class grows your craft 110% of a usual one; if not, 95%. Its second band is the one that counts for the term.
  - A note that’s open and has been given three times opens another way to work on it, on any open piece that prepares its part. Given more often still, its notice is titled “Still There:”, at most once in 7 days.
  - A piece in rounds is shown a round at a time, each round judging its own parts, so a later round that judges the part a note named can put the note right.
  - The term’s review counts each piece’s band, the second for a piece shown again. If you’re not there to show it again and have no excuse, it counts as Unready.
- **Tested by:** `school.read_feedback`: `tests/classmate-moments.test.ts`, `tests/evidence-g09-life.test.ts`, `tests/evidence-g24-school.test.ts`, `tests/evidence2-b10.test.ts`, `tests/guide-examples-coursework.test.ts`, `tests/journey-school-year.test.ts`, `tests/journey-three-students.test.ts`, `tests/remaining-school.test.ts`

### Another Way At A Note (`coursework.approach`)

- **Action:** `school.approach`, at School, Coursework, A Note That Keeps Coming Back (`/workspace/school?tab=coursework`). Opens: From the guide’s chapter “Drama School”, on an open piece, once a note on a part it prepares has been given 3 times and is still open.
- **Preconditions:**
  - A note that’s open and has been given 3 or more times, on a part this piece prepares; a note about an answer at the table counts as one on the table work.
  - The piece open, with no way chosen for it yet.
  - For Put It First, a part this piece can put first. For Work On It With Your Partner, a partner still willing to work with you, on a note that isn’t already about work with your partner.
  - For A Targeted Drill or Work On It With Your Partner on the table work, a piece with a step of its own at the table, or with no scene: on Scene Study and courses like it the table work is your answers alone, and neither changes them.
  - Feedback And Your Notes first: It opens once a note has been given 3 times on the same part and is still open.
- **Costs:**
  - Time: None to choose. A Targeted Drill adds a step of 30 minutes, once a day (an estimate)
  - Money: None
- **State (what changes at once):**
  - The way is kept on the piece, with the note it’s for and the day, and the card reads “Another Way At It:” and what it does.
  - A Targeted Drill: a new step on the card, named for the part.
  - Put It First: Put First changes to that part, and its Note Priority rises.
- **Consumer (what reads it):**
  - Preparing Coursework, immediate: A Targeted Drill adds a step to the piece, and Put It First changes what counts most in it.
  - Rehearsing With A Partner, scheduled: Work On It With Your Partner works on the part at the next rehearsal kept with your partner.
  - Your Standing And Classes, evaluation: A Smaller Piece Of It caps the band at Working, and the term’s review counts a Working piece as neither Unready nor Strong.
- **Feedback (how to read what comes back):**
  - The note it’s for is the one given most often among those the piece can help.
  - The card’s “It won’t take the note by itself: you still take it at a showing.” means the part still has to be prepared far enough by the time you show the piece.
  - When a way is grayed, its reason shows under the buttons.
- **History (kept in the record):**
  - (none)
- **Later consequence:**
  - When the piece is shown with the part the note named at 75% or more, you’ve put the note right, however the part got there.
  - A Smaller Piece Of It: shown as no better than Working, since less was shown.
  - Work On It With Your Partner: worked once, at the next rehearsal you keep.
- **Tested by:** `school.approach`: `tests/approaches.test.ts`, `tests/defects-g8-10.test.ts`, `tests/defects-g8-9.test.ts`, `tests/evidence-g18-school.test.ts`, `tests/evidence-g22-school.test.ts`, `tests/guide-examples-coursework.test.ts`, `tests/journey-three-students.test.ts`, `tests/remaining-school.test.ts`

### Rehearsing With A Partner (`coursework.partners`)

- **Action:** `school.ask_partner`, `school.answer_partner`, `school.cancel_rehearsal`, `look.classmate`, at School, Coursework, Rehearsing With Your Partner (`/workspace/school?tab=coursework`). Opens: From the guide’s chapter “Drama School”, on paired work, once you’ve met your partner at orientation or in class.
- **Preconditions:**
  - An open piece with a partner, and the partner met: at orientation’s Meeting Your Class, or at your first class.
  - A time at least 2 hours ahead, ending before nine on the day it’s due, with nothing else of yours then.
  - For a yes: the partner free then, trusting you enough, and asked a day ahead if they’ve set a boundary.
  - Orientation Week first: You can’t ask a partner you haven’t met; Meeting Your Class, or your first class, meets them.
- **Costs:**
  - Time: 90 minutes on your feet in New Haven, at the time agreed (an estimate)
  - Money: None
  - Their Trust: Starts at 50 of 100. A rehearsal kept, up 4; missed by you, down 12; called off less than a day ahead, down 4; their request left unanswered, down 2. Under 25, they’d rather work alone (an estimate)
  - The Bond: A rehearsal kept, 2 closer; missed by you, 5 further apart; each as your nature takes it (an estimate)
- **State (what changes at once):**
  - Ask: a yes books it as Rehearsal With … on your calendar; a no gives their reason, and they remember being asked.
  - Saying no to their request costs nothing; saying yes books it.
  - Call It Off a day or more ahead, and they take it as moved with notice. Less than a day ahead, their trust falls 4, and it counts as a time you let them down until you make amends.
- **Consumer (what reads it):**
  - The Calendar, scheduled: A rehearsal you agree goes on your calendar, and the clock stops at it.
  - Preparing Coursework, scheduled: A rehearsal kept moves the piece’s partner part when it’s held, and a request of theirs left open holds the piece’s other steps until you answer.
  - Your Class, history: A rehearsal missed or called off late is held against you until you make amends, and two of them can bring a boundary.
  - Feedback And Your Notes, evaluation: The showing’s scene together shows their preparation, timing, agreement and reliability, separately from your band.
  - Your Work So Far, history: Each scene played together is counted, and Your Work So Far gives how they came out on average from the third on.
  - Calling In Sick, scheduled: A rehearsal booked on a day you’ve called in sick is excused, and costs none of their trust.
  - How You’ll Play A Scene, immediate: A rehearsal kept rehearses the way you chose to play the scene, as a rehearsal step does.
  - Table Work reads it, evaluation: An answer that differs from your partner’s leaves the scene together at 90% agreement until you’ve tried both.
  - Feedback And Your Notes reads it, evaluation: Under a paired piece, the scene together shows your partner’s preparation, timing, answers and any slip, separately from your band.
- **Feedback (how to read what comes back):**
  - “Trust … of 100” is how they stand with you, and “Came to … of … rehearsals agreed” how often they’ve come (“No rehearsals agreed yet” before any).
  - Their name, under Your Partners, opens them: what the scene together showed of them on each piece you share (their preparation, their timing, whether your answers agree), and what’s happened between you.
  - After a rehearsal they say what held the scene back: not knowing it, being on book, unclear choices, or not enough time on its feet; or that it’s coming together. The choices are judged as the showing judges the table work: your answers at the table, and where the course has a step of its own there, that step too. These are the game’s words, labeled simulated.
  - The Scene Together, under the feedback, says how it compared with your own work, and why. Your own result stands as it is.
- **History (kept in the record):**
  - Your Class: A rehearsal missed or called off late is held against you until you make amends, and two of them can bring a boundary.
  - Your Work So Far: Each scene played together is counted, and Your Work So Far gives how they came out on average from the third on.
- **Later consequence:**
  - Kept: your partner part rises 40% of what’s left at an ordinary focus, the way you chose to play the scene, if you chose one, is rehearsed by 90% of that share, the evening is practice in listening, trust rises 4 and the bond 2, and they say what held the scene back most.
  - If you don’t come, away or asleep: they waited for you; their trust falls 12, the bond 5, and it waits to be put right.
  - If they don’t come: you lose the evening, and they may apologize in class. Run It With A Reader works your side of it without them.
  - In hospital, laid up or on a day you’ve called in sick, it’s excused; for partner work in a studio, an injury that stops you training excuses it too. They know you’re ill, and don’t hold it against you.
  - In class, on a day with nothing booked between you, they may ask (on 40% of such days) for 7 p.m. on one of the next three evenings they’re free. If you don’t answer, it lapses, and their trust falls 2.
  - When the piece is shown, a scene together at Strong or better brings you 1 closer, and a slip of theirs you covered earns 2 of their trust.
  - If you’re not there for the showing and have no excuse, their trust and the bond fall as for a missed rehearsal.
- **Tested by:** `school.ask_partner`: `tests/attributes-phase-2b.test.ts`, `tests/b20-craft-promises.test.ts`, `tests/b20-guide-chapters.test.ts`, `tests/commands-kept.test.ts`, `tests/coursework-defects.test.ts`, `tests/defects-g8-10.test.ts`, `tests/defects-r2-1.test.ts`, `tests/evidence-g09-life.test.ts`, `tests/evidence-g18-school.test.ts`, `tests/evidence-g19-school.test.ts`, `tests/evidence-g22-school.test.ts`, `tests/evidence-g24-school.test.ts`, `tests/evidence-g30-ui.test.ts`, `tests/evidence2-b07.test.ts`, `tests/guide-examples-coursework.test.ts`, `tests/partners.test.ts`, `tests/remaining-school.test.ts`, `tests/school-journey-gaps.test.ts`; `school.answer_partner`: `tests/b20-craft-promises.test.ts`, `tests/evidence-g24-school.test.ts`, `tests/journey-school-year.test.ts`, `tests/journey-three-students.test.ts`, `tests/language-frame-ui.test.ts`, `tests/partners.test.ts`, `tests/school-journey-gaps.test.ts`, `tests/time-stops.test.ts`; `school.cancel_rehearsal`: `tests/commands-kept.test.ts`, `tests/evidence-g18-school.test.ts`, `tests/evidence-g24-school.test.ts`, `tests/guide-examples-coursework.test.ts`, `tests/time-stops.test.ts`

### Your Class (`coursework.class`)

- **Action:** `school.respond`, `school.make_amends`, at School, Coursework, Your Class And Your Partners (`/workspace/school?tab=coursework`). Opens: From the guide’s chapter “Drama School”, from the first class you’re at with them.
- **Preconditions:**
  - Being in class that day, with no other moment from the class waiting for your answer.
  - For Help Now: 45 minutes free now. For Say Yes: the evening still ahead and clear.
  - For Make Amends: something between you to put right, and 20 minutes free.
  - Orientation Week first: A classmate brings you something once you’ve met them, at Meeting Your Class or in class.
- **Costs:**
  - Time: Help Now: 45 minutes then and there. Running lines: 60 minutes at 7 p.m. on the evening agreed. Make Amends: 20 minutes. Any other answer takes no time (an estimate)
  - Money: None
- **State (what changes at once):**
  - Your answer is kept, and a message says what came of it. A bond moves as your nature takes it.
  - Make Amends: everything between you so far is marked as put right.
- **Consumer (what reads it):**
  - Table Work, immediate: Try Theirs replaces your answer to the question with theirs at once.
  - Rehearsing With A Partner, immediate: An answer can change their trust, which counts when you ask them to rehearse; a boundary asks for a day’s notice.
  - Preparing Coursework, scheduled: An evening of running lines kept moves the lines of the scene you share 20% of what’s left.
  - How You Are, immediate: A word after a hard showing lifts your morale 3.
  - How You Are reads it, evaluation: Readiness sets how much a class or a lab builds that day.
  - Rehearsing With A Partner reads it, history: A rehearsal missed or called off late is held against you until you make amends, and two of them can bring a boundary.
- **Feedback (how to read what comes back):**
  - Your Class lists what’s waiting with the time to answer by, and the last six moments with how you answered, or Not Answered.
  - Your Partners shows “Wants A Day’s Notice” for a boundary, with how many more rehearsals must be kept before it lifts, and “Has Stopped Asking You To Run Lines” or “Owes You Lines” where those apply.
  - “You let them down once and haven’t made it right.” counts what Make Amends would put right.
- **History (kept in the record):**
  - (none)
- **Later consequence:**
  - An answer not given in time lapses; only an invitation to run lines costs anything for it.
  - An evening of running lines you agree goes on your calendar as Running Lines With …. Kept, it works on the scene you share; with no scene shared, it works on their lines and none of yours.
  - With both readings tried at the next rehearsal you keep, the scene together counts your answers as one again, and where the course has a step of its own at the table, that step’s half of the table work moves 15% of what’s left. Where the table work is your answers alone, none of your figures moves.
  - A bond of 25 makes them a friend, 50 a close friend, and −20 or lower a rival.
- **Tested by:** `school.respond`: `tests/b20-creation-personality.test.ts`, `tests/classmate-moments.test.ts`, `tests/continuity-incidents.test.ts`, `tests/coverage-gaps-classmates.test.ts`, `tests/defects-g8-10.test.ts`, `tests/defects-r2-1.test.ts`, `tests/evidence-g09-life.test.ts`, `tests/evidence-g18-school.test.ts`, `tests/evidence-g22-school.test.ts`, `tests/evidence-g23-school.test.ts`, `tests/evidence-g24-school.test.ts`, `tests/evidence-g30-ui.test.ts`, `tests/evidence2-b07.test.ts`, `tests/evidence2-b10.test.ts`, `tests/evidence3-school.test.ts`, `tests/guide-examples-coursework.test.ts`, `tests/journey-school-year.test.ts`, `tests/journey-three-students.test.ts`, `tests/remaining-school.test.ts`, `tests/repeat-moments.test.ts`, `tests/scope-school.test.ts`, `tests/student-experience.test.ts`; `school.make_amends`: `tests/b20-school-trust.test.ts`, `tests/commands-kept.test.ts`, `tests/defects-g8-10.test.ts`, `tests/evidence-g18-school.test.ts`, `tests/evidence-g24-school.test.ts`, `tests/evidence2-b07.test.ts`, `tests/guide-examples-coursework.test.ts`

### Working A Problem Through (`coursework.workbook`)

- **Action:** `work.identify`, `work.try`, `work.settle`, at School, Coursework, Work It Through (`/workspace/school?tab=coursework`). Opens: From the guide’s chapter “Drama School”: under a scene for class while it’s open, under a practice brief once a reading is chosen, and under a part in a production while its run is to come.
- **Preconditions:**
  - A piece in progress: an open scene for class with its material, a practice brief with a reading chosen, or a part whose run is still to come.
  - Some of the lines learned first: 30% of a brief’s, a scene’s or a part’s.
  - A problem named before you try a way, and any change you tried kept or put back before the next.
  - For a way on your feet, energy of 25 or more and no injury that stops training. For any way, being awake, out of hospital, at nothing else, and free for its minutes.
  - Preparing Coursework first: A scene’s lines learned to 30% let you try a way, and a problem in a part of the preparation is fixed by that part’s own step.
- **Costs:**
  - Time: Work It Slowly, 30 minutes; Run Into It From The One Before, 40 minutes; Play This Part Another Way, 30 minutes; Find Places To Breathe, 45 minutes; Name What You Want In Each Part, 30 minutes; Run It With Your Partner, 45 minutes (an estimate)
  - Money: None
  - Naming And Settling: No time: naming a problem, keeping a change and putting one back move no clock
- **State (what changes at once):**
  - Naming a problem keeps it as the one you’re working on.
  - A way you try takes its minutes and changes the piece, and the try is kept with its figure before and after.
  - Work you do (working a part slowly, running into it, naming what you want, running it with a reader) is kept at once, and a problem it solves leaves the list by itself.
  - Playing a part another way, or finding places to breathe, waits for Keep It or Put It Back. Kept, it’s a discovery. Put back, the piece is as it was, and that way isn’t offered for the problem again.
  - Working on an ability’s problem trains it a little, and running into a part trains your adaptability.
- **Consumer (what reads it):**
  - Feedback And Your Notes, evaluation: The showing judges the scene with each part’s own work and every discovery you kept.
  - Preparing A Brief, evaluation: A brief’s take includes its beats’ own work and the ways you kept, as its forecast did.
  - Who Reads With You, immediate: Run It With Your Partner moves the preparation of a classmate reading a brief with you.
  - The Player Profile, immediate: Working on an ability’s problem trains it a little, and running into a part trains adaptability.
- **Feedback (how to read what comes back):**
  - Before and after are the problem’s own figure: a part’s result for a problem in one part, the last part’s for tiring late, the whole for an ability or a part of the preparation, the scene together for a partner.
  - A try that barely moves its figure tells you something too: the problem may want another way, or its own preparation step.
  - “There’s no way left to work on it here” means its own preparation step works on it, or the ways you tried were put back. A partner not there yet on a scene for class has no way here either: its line ends “Ask … to rehearse it with you.”
  - The tries table keeps the last six, newest first, each Kept, Put back or Waiting.
- **History (kept in the record):**
  - (none)
- **Later consequence:**
  - Every later forecast and performance of the piece includes what you kept: the take of a brief, the showing of a scene, a night of a part.
  - What You’ve Found lists each part played its own way and how far it’s rehearsed, places to breathe you’ve found, and each try kept that moved its figure half a point or more.
- **Tested by:** `work.identify`: `tests/b20-craft-productions.test.ts`, `tests/b20-craft-promises.test.ts`, `tests/defects-g8-11.test.ts`, `tests/defects-g8-9.test.ts`, `tests/determinism-played.test.ts`, `tests/guide-examples-coursework.test.ts`, `tests/guide-examples-craft.test.ts`, `tests/remaining-09-coverage.test.ts`, `tests/workbook.test.ts`; `work.try`: `tests/b20-craft-productions.test.ts`, `tests/b20-craft-promises.test.ts`, `tests/defects-g8-11.test.ts`, `tests/defects-g8-9.test.ts`, `tests/determinism-played.test.ts`, `tests/guide-examples-coursework.test.ts`, `tests/guide-examples-craft.test.ts`, `tests/remaining-09-coverage.test.ts`, `tests/workbook.test.ts`; `work.settle`: `tests/defects-g8-13.test.ts`, `tests/defects-r8-1.test.ts`, `tests/determinism-played.test.ts`, `tests/direction-mastery.test.ts`, `tests/direction.test.ts`, `tests/evidence-g19-school.test.ts`, `tests/evidence-g23-school.test.ts`, `tests/guide-examples-productions.test.ts`, `tests/rehearsal-notes-history.test.ts`, `tests/remaining-09-coverage.test.ts`, `tests/workbook.test.ts`

### The Actor Showcase (`coursework.showcase`)

- **Action:** `school.choose_showcase`, at School, Coursework, The Actor Showcase (`/workspace/school?tab=coursework`). Opens: In your last spring term, from its first day, once you’ve read the guide’s chapter “Drama School”.
- **Preconditions:**
  - To be in your last spring term, enrolled in it: not on leave, and not in an additional term.
  - Every Incomplete made up by the end of the term’s fourth week, its Friday at five. One still open then keeps you out.
  - Two different scenes from the options, each in one of its parts.
  - Repeating, Extra Terms And Incompletes first: An Incomplete still open at the end of the term’s fourth week keeps you out of the showcase.
- **Costs:**
  - Time: None to choose. Each rehearsal call takes three hours; New York’s days ten hours and eight hours, and Los Angeles’s a day and a night, each with its trip (an estimate)
  - Money: None: the School takes you
- **State (what changes at once):**
  - Your two scenes become pieces of Actor Showcase’s coursework, due in New York, each with a partner from your class.
- **Consumer (what reads it):**
  - Preparing Coursework, immediate: Your two scenes become pieces of coursework, each prepared with its own steps.
  - Feedback And Your Notes, evaluation: Each scene’s note comes at its first showcase day, and Los Angeles shows whether you took it.
  - The Career Screen, history: How each scene went at each showcase day stays on your professional record.
- **Feedback (how to read what comes back):**
  - A forecast is what a scene would come to fully prepared on a good day. It’s a forecast, not a result.
  - Each day’s band is how that scene came out that day: Unready, Working, Strong or Exceptional, with its score of 100.
  - A showcase day missed counts as a missed call and an unexcused absence from Actor Showcase, and your scenes aren’t seen there. Ill, you’re excused.
- **History (kept in the record):**
  - The Career Screen: How each scene went at each showcase day stays on your professional record.
- **Later consequence:**
  - At the end of the term’s fourth week, the School reads your Incompletes. With none, you’re in, and the faculty choose two scenes for you if you haven’t.
  - At the first showcase day, each scene is shown and gets the faculty’s note. It’s played again the next day, and in Los Angeles it’s shown again with the note taken.
  - Actor Showcase is settled after Los Angeles, not at the term review. A course with half its pieces not shown isn’t passed, and the degree needs every course passed.
- **Tested by:** `school.choose_showcase`: `tests/journey-career.test.ts`, `tests/pro-app.test.ts`, `tests/pro-showcase.test.ts`

## Productions And Casting

Being cast, learning a part, the director’s notes, how you’ll play a part, the nights, the Cabaret and plays to read.

### Casting (`productions.casting`)

- **Action:** , at School, Casting, Why This Cast (`/workspace/school?tab=casting`). Opens: From the guide’s chapter “Drama School”. The chair casts as each term begins, from the first spring.
- **Preconditions:**
  - A place in the casting pool: two missed calls in a term take you out of it until a term review finds you in good standing. A rehearsal, a run-through or a lab missed without an excuse takes you out when it brings the count there; a missed performance counts toward it, and is a grave breach as well.
  - A first-year is first cast in the spring; the first fall has Drama 50 and no production.
  - For Yale Rep, good standing: an understudy in the first spring and in the second and third years’ falls, or, as a third-year with acting at 77 or more, a part in the Rep’s company in place of a School production.
  - Your Standing And Classes first: Only a student in the casting pool is cast, and only one in good standing goes to Yale Rep; two missed calls take you out until a term review finds you in good standing.
- **Costs:**
  - Time: None to be cast. A School production calls you Tuesday to Friday from three for six hours through its rehearsal weeks, and plays at eight. A Rep understudy rehearses Wednesday and Friday from three to six and is on call at every performance; a company member rehearses Tuesday to Saturday from three to nine (an estimate)
  - Money: None: casting is part of the program, and unpaid
- **State (what changes at once):**
  - The cast list goes up as the term begins: every rehearsal call and performance goes on your calendar, from the first call, and a notice names your part.
  - When the list goes up, a lead of your own lifts your morale 2, a friend’s lead 0.5, and a rival’s adds 1.5 stress, each by your nature.
  - Each classmate in your cast comes 10 closer for the weeks you share, or 12 less close where a lead written for either of you went to the other, by your warmth or how much a slight hurts you.
  - The runs the chair read are marked as read: the next casting reads what you play after this one, with this read counting 50% as much as it does now.
- **Consumer (what reads it):**
  - Learning A Part, immediate: Being cast puts every rehearsal call on your calendar with its stage, and opens the part’s rehearsal process.
  - The Calendar, scheduled: Each call and performance goes on your calendar, and the clock stops at it.
  - The Nights, evaluation: The part’s size and stage set how hard each night is: a lead harder than a featured part, and the Rep harder than the School.
  - Rehearsing With A Partner, immediate: The cast list changes bonds: a classmate in your cast comes 10 closer, or 12 less close where a lead went between you.
  - How You Are, immediate: When the list goes up, your own lead lifts morale 2, a friend’s 0.5, and a rival’s adds 1.5 stress.
  - The Nights reads it, evaluation: The chair reads what each night delivered at the next casting; a night missed counts as nothing.
  - Cabaret And Summer Cabaret reads it, evaluation: A Cabaret or Summer run counts 50% of a School production’s in what the chair reads you delivered.
- **Feedback (how to read what comes back):**
  - The read decides it: a higher fit can lose a lead to a balance of 4 points between a lead last time and a featured part.
  - Delivered at 100% means every night came fully prepared, on a good enough day: tiredness, the flu, an injury or a concussion that day count as less delivered. Tiring late in the play, and a slip carried into the next movement, don’t, since the fit and the night’s luck already count them. A night missed without an excuse (not in hospital, laid up or called in sick) counts as nothing delivered.
  - Fit uses the same abilities a night does, so the work that grows them raises it, and so does knowing the play’s genres. Who you are as an actor plays no part in it.
  - A part called In The Company means no part written for you was left when your read came up.
  - Why This Cast shows the production you’re in; Around The Class shows the whole class, the Rep’s company included.
- **History (kept in the record):**
  - (none)
- **Later consequence:**
  - The School and the Rep never call you to two places at once: a School rehearsal gives way to a Rep rehearsal, performance or run-through, and ends where a Rep night on call begins; a Rep night on call gives way to your own School performance, and a School performance to a Rep performance in a role.
  - On call, the Rep calls you three hours before each curtain, at five for an evening and at eleven for a Sunday matinee. Most nights you aren’t needed; on about 2% of them you go on, and the performance goes on your calendar.
  - An understudy plays one run-through for the director, on the dark Monday of the run’s second week.
  - When a run ends, the classmates in it grow from its rehearsals and nights, and their own run is judged and kept as their Last Run.
- **Tested by:** a screen or a look; the UI journeys (`tools/acceptance-ui.mjs`)

### Learning A Part (`productions.part`)

- **Action:** `school.learn_part`, `school.review_blocking`, at School, Casting, The Rehearsal Process (`/workspace/school?tab=casting`). Opens: From the guide’s chapter “Drama School”, while a part you’re cast in has calls to come: a School production, Yale Rep, a Cabaret show or a Summer Cabaret show.
- **Preconditions:**
  - A part you’re cast in, with its run still to come.
  - For Catch Up The Blocking, a blocking or technical call missed and not yet caught up.
  - A free hour: not at something already, and nothing you’re expected at within it.
  - Casting first: Only a part you’re cast in, with its run to come, has lines and blocking to learn.
- **Costs:**
  - Time: An hour each, on the clock
  - Money: None
- **State (what changes at once):**
  - Learn The Part: the clock moves on an hour and Lines rises, and a message says where it stands.
  - Catch Up The Blocking: one fewer Missed To Catch Up, and Blocking rises.
  - Each call you come to moves the lines and the blocking as above, and keeps up your discipline, a quarter of a session’s worth.
- **Consumer (what reads it):**
  - The Director’s Notes, immediate: A missed blocking call, or lines under 70% after the off-book call, is what the next note asks for first.
  - The Nights, evaluation: The lines and the blocking are a night’s preparation, against what keeping every call gives you.
  - Your Standing And Classes, evaluation: Each call kept or missed counts in the attendance the term’s review counts.
  - The Player Profile, immediate: An hour on the part trains memory the first three times for each part; an hour with the book does every time.
- **Feedback (how to read what comes back):**
  - Lines under 70% after the off-book call bring a note to get off book, each director in their own words: in the Carlotta Festival Of New Plays, “Get off book: once the lines are in you, the scene can start.”
  - Growth From A Night is how much a night grows your craft, 100% for keeping every call and no more. It doesn’t change the night’s result.
  - A Night Now is a forecast of what a night would come to if it opened now, with no luck either way. The Part Now, Movement By Movement shows each movement’s own blocking against what it needs.
  - Blocking set at a call you were excused from is still a gap, and Missed To Catch Up counts it.
- **History (kept in the record):**
  - (none)
- **Later consequence:**
  - From the first work-through rehearsal, the director gives a note at each one, and the lines and the blocking come first.
  - The dress rehearsal is played through as a night with no audience, and its band shows under the process: “The dress rehearsal: Solid.”
  - Each night counts the lines and the blocking as preparation, the blocking movement by movement with any work on each.
  - A School or Rep call you miss counts against the term’s attendance, and two in a term take you out of the casting pool.
- **Tested by:** `school.learn_part`: `tests/attributes-phase-2b.test.ts`, `tests/defects-g8-11.test.ts`, `tests/defects-g8-13.test.ts`, `tests/defects-r8-1.test.ts`, `tests/direction-mastery.test.ts`, `tests/direction.test.ts`, `tests/evidence-g07-life.test.ts`, `tests/evidence-g19-school.test.ts`, `tests/evidence-g20-school.test.ts`, `tests/evidence-g23-school.test.ts`, `tests/guide-examples-productions.test.ts`, `tests/journey-school-production.test.ts`, `tests/rehearsal-notes-history.test.ts`; `school.review_blocking`: `tests/defects-g8-11.test.ts`, `tests/defects-g8-13.test.ts`, `tests/defects-r8-1.test.ts`, `tests/direction-mastery.test.ts`, `tests/direction.test.ts`, `tests/evidence-g19-school.test.ts`, `tests/evidence-g23-school.test.ts`, `tests/guide-examples-productions.test.ts`, `tests/journey-school-production.test.ts`, `tests/rehearsal-notes-history.test.ts`

### The Director’s Notes (`productions.notes`)

- **Action:** `school.work_note`, at School, Casting, The Rehearsal Process, The Director’s Last Note (`/workspace/school?tab=casting`). Opens: From the guide’s chapter “Drama School”, from a production’s first work-through rehearsal. An understudy’s rehearsals bring no notes.
- **Preconditions:**
  - A note given and not yet settled: the next call settles it either way.
  - For a craft note: being awake and out of hospital, 30% of the part learned, free now with the way’s own minutes clear of anything you’re expected at, and, for a way on your feet, energy of 25 or more and no injury that stops training. For any other note: free now, with an hour clear.
  - For a craft note, a way to work on it not already tried and put back, and no change waiting to be kept or put back.
  - Learning A Part first: A note comes at a work-through call you come to; one on the lines or the blocking comes first while either is short.
- **Costs:**
  - Time: A note on the craft: the way’s own time, 30 to 45 minutes. Any other note: an hour (an estimate)
  - Money: None
- **State (what changes at once):**
  - A craft note: the way is tried on the part, its time spent, and its figure before and after kept on the note. The note shows Worked On.
  - A way that changes how a movement is played, or places to breathe, waits to be kept or put back.
  - Any other note: an hour on it. A note on the lines moves them 30% of what’s left, and one on the blocking moves it 50% of what’s left and closes one missed call’s gap where one is open, as Catch Up The Blocking does.
  - Each craft note and each request of the director’s, given and answered, is counted for life, and each craft note worked with the way you used.
- **Consumer (what reads it):**
  - Working A Problem Through, immediate: A craft note’s ways are Work It Through’s, and working on one is a try kept in the part’s workbook.
  - The Nights, evaluation: The share of notes taken is part of a night’s preparation, and of Growth From A Night.
  - Your Work So Far, history: Each note on the craft given, worked on and answered counts for life in Taking Direction, with the way you reach for most; a note on the weakness your work keeps coming back to names it, with its count.
  - Feedback And Your Notes, history: Notes still open when the run closes go into your notes from the courses, and the next piece can ask for them.
  - The Player Profile, immediate: Working on a note trains adaptability, and a note taken makes that call grow you 10% more.
- **Feedback (how to read what comes back):**
  - A note is on what most needs it now: a blocking call missed, the lines after the off-book call, the blocking short, or else something the part’s own forecast shows, put as a director would put it (what you want, listening, pacing, the physical life, a change, a relationship) and placed in the play.
  - The note names its place, “in the second half”, “by the close”; a note on the whole part says “the whole play”.
  - The words come from what holds the place back most, by the quality it costs: believability or interpretation is “I don’t know what you want…”, connection “Who are they to you…?”, responsiveness “You’re not taking what they give you…”, execution “The physical life … isn’t clean yet”, consistency “It sags in…”. Tiring named as a problem of its own is “You’re spent by…”, and a turn into a movement “The change into … lurches”. A movement held back most by tiring is given “It sags in…”, a note on its pacing.
  - “Still:” is the same note again, not answered. “Better since the last note.” means it was answered, and more is asked.
  - A craft note on an ability or technique your work keeps coming back to, the one Your Work So Far names, ends “It’s your … again: it’s held back … of your pieces before this.” The words change; the note, its figure and what answers it stay the same.
  - Under the note, the figure before, after and at the next call says whether the change held.
- **History (kept in the record):**
  - Your Work So Far: Each note on the craft given, worked on and answered counts for life in Taking Direction, with the way you reach for most; a note on the weakness your work keeps coming back to names it, with its count.
  - Feedback And Your Notes: Notes still open when the run closes go into your notes from the courses, and the next piece can ask for them.
- **Later consequence:**
  - At the next call the note is settled, Taken or Not Taken, with its figure then kept beside it, and a change still waiting is kept and played at that call.
  - Once another note comes, the settled one moves under The Director’s Notes So Far, below the last note: each earlier note with what came of it, and the way it was worked with its figure before, after and at the next call.
  - At the next work-through, if the same note comes again: “Better since the last note.” if it was taken, and “Still:” if it wasn’t; either way, if you worked on it a way, the way you tried with its figure then and now.
  - When the run closes, the notes still open go into your notes from the courses: what you want as the choices, listening and a relationship as the work with your partner, lines as the lines, a skill as that skill, the rest as rehearsal on your feet. A note on the director’s request stays with the part.
  - Looking Back, at the closing, counts the notes you took and those you worked on that didn’t move.
- **Tested by:** `school.work_note`: `tests/attributes-phase-2b.test.ts`, `tests/b20-craft-productions.test.ts`, `tests/defects-g8-11.test.ts`, `tests/defects-g8-13.test.ts`, `tests/defects-r8-1.test.ts`, `tests/direction-mastery.test.ts`, `tests/direction.test.ts`, `tests/evidence-g19-school.test.ts`, `tests/evidence-g23-school.test.ts`, `tests/guide-examples-productions.test.ts`, `tests/journey-school-production.test.ts`, `tests/rehearsal-notes-history.test.ts`

### How You’ll Play A Part (`productions.playing`)

- **Action:** `school.choose_part_playing`, at School, Casting, How You’ll Play It (`/workspace/school?tab=casting`). Opens: From the guide’s chapter “Drama School”, while a part you’re cast in has calls to come.
- **Preconditions:**
  - A part you’re cast in, with calls still to come.
  - A choice that differs from your current one: the button is grayed until it does.
  - Casting first: Only a part you’re cast in, with calls to come, can be chosen how to play.
- **Costs:**
  - Time: None: choosing takes no time, and the calls rehearse it
  - Money: None
- **State (what changes at once):**
  - The choice is kept on the part, with as much of the earlier rehearsal as a change keeps, and a message says how far it’s rehearsed.
  - Leaving every aspect open clears the choice.
  - The ways you choose are kept among your habits.
- **Consumer (what reads it):**
  - Learning A Part, scheduled: Each call after the read-through rehearses the choice, 27% of what’s left.
  - The Director’s Notes, immediate: A choice against the director’s request is the note at the next work-through.
  - The Nights, evaluation: Each night counts the choice: what it favors, the abilities it uses, and how far it’s rehearsed.
  - Your Work So Far, history: The ways you choose are kept as habits in Your Work So Far.
- **Feedback (how to read what comes back):**
  - Fully Prepared shows what a way can reach with everything complete; A Night Now, above it, shows the part as it stands today.
  - At full ability every way that fits reaches 100. Below it, a way that uses what you do well shows you at your best.
  - “Doesn’t fit:” under a way gives the reason: the play’s own, or “The director has asked for it …”.
  - “You’ve rehearsed your current choice to …% so far (it’s complete at …%)” is how far the calls have taken it, against the play’s own mark.
- **History (kept in the record):**
  - Your Work So Far: The ways you choose are kept as habits in Your Work So Far.
- **Later consequence:**
  - Each call after the read-through rehearses it further.
  - At a work-through, a choice against the director’s request is the note, “I want it …”, and the next call marks it Taken if you’ve changed the choice by then.
  - Each night counts it: what it favors, the abilities it uses, and how far it’s rehearsed.
  - Work It Through offers a movement played another way only on an aspect the whole part leaves open.
- **Tested by:** `school.choose_part_playing`: `tests/b20-craft-productions.test.ts`, `tests/defects-g8-11.test.ts`, `tests/defects-g8-12.test.ts`, `tests/defects-g8-15.test.ts`, `tests/guide-examples-productions.test.ts`, `tests/remaining-09-coverage.test.ts`, `tests/trace-commands.test.ts`

### The Nights (`productions.nights`)

- **Action:** , at School, Casting, Your Nights (`/workspace/school?tab=casting`). Opens: From the guide’s chapter “Drama School”, from the first performance of a part you’re cast in.
- **Preconditions:**
  - A part you’re cast in, with its performance on your calendar. An understudy plays only when sent on, and at the run-through.
  - Being in New Haven, awake, out of hospital and not laid up at the curtain. In hospital, laid up or with the day called in sick, the night is covered and excused.
  - Learning A Part first: The lines and the blocking at what keeping every call gives you, and never under 70%, complete a night’s preparation.
- **Costs:**
  - Time: The production’s running time with its intervals, and 5 minutes of curtain call: School curtains at eight, Yale Rep’s evenings at eight and Sundays at two. Twelfth Night as the RSC played it in 2024, 2 h 59; A Marriage Proposal, 30 minutes; a festival’s new play, 1 h 45; a Cabaret piece, 1 h 05. Each play’s figure is one production’s, or estimated where none is published, and the night’s forecast says which (an estimate)
  - Money: None
  - The Body: Energy by the evening’s workload, 5 a unit, less by up to 50% as your stamina is full and more by up to 50% if you come to the curtain tired: a lead in Woyzeck at half stamina, rested, 8. A stage’s risk of injury at the School, the Rep and the Summer Cabaret, for the hours your part is on; and nerves, 6 stress before the curtain by your nature, less the more composure you have (an estimate)
- **State (what changes at once):**
  - The night’s band is kept on the run, and the night in your work.
  - Morale: Strong or Remarkable lifts it 3, Off takes 3, by the night together where there’s a company and by your own night where there isn’t. A Remarkable night of your own adds a little presence.
  - Before a School or Rep curtain, friends in the cast lift your morale, a point each up to 3, by how much you need company; a cast with none weighs on you if you need it. A third-year in the Rep’s company has the classmates asked in with them listed as the cast; an understudy sent on plays with none of the class.
  - Your craft grows from the night (scene work, feeling, voice and what the play asks), scaled by Growth From A Night; listening grows, and you practice the play’s kinds of play.
  - What you delivered that night, your preparation and your condition, goes into the run record the next casting reads.
- **Consumer (what reads it):**
  - Your Standing And Classes, evaluation: A run with 3 or more nights by the term’s review is counted: mostly Off is short.
  - Casting, evaluation: The chair reads what each night delivered at the next casting; a night missed counts as nothing.
  - A Piece Of Work, Explained, history: Each night is kept in your work, judged movement by movement, with what held it back.
  - Your Work So Far, history: The nights with a company count toward Playing With Others in Your Work So Far.
  - How You Are, immediate: A night Strong or better, the night together where there’s a company, lifts morale 3, an Off one takes 3, and nerves add stress before the curtain.
  - The Player Profile, immediate: A night grows scene work, feeling, voice and what the play asks, scaled by Growth From A Night, and listening with them.
  - Feedback And Your Notes, history: At the closing, the notes still open go into your notes from the courses for the next piece.
  - How You Are reads it, evaluation: A night on stage is judged with your readiness at curtain time: under 60, coming in tired costs you.
  - Your Standing And Classes reads it, evaluation: Once a run has had 3 nights, the term’s review counts how they went.
  - Casting reads it, evaluation: The part’s size and stage set how hard each night is: a lead harder than a featured part, and the Rep harder than the School.
  - Learning A Part reads it, evaluation: The lines and the blocking are a night’s preparation, against what keeping every call gives you.
  - The Director’s Notes reads it, evaluation: The share of notes taken is part of a night’s preparation, and of Growth From A Night.
  - How You’ll Play A Part reads it, evaluation: Each night counts the choice: what it favors, the abilities it uses, and how far it’s rehearsed.
  - Cabaret And Summer Cabaret reads it, evaluation: Each show is a night judged like any other, kept on the run and in your work.
  - Your Résumé reads it, history: A School production’s part goes on your résumé once its run has closed.
- **Feedback (how to read what comes back):**
  - A night is judged in the play’s movements: two at least, by its tones in order and each turn within them, and a new play’s two halves. Each movement’s tones shift what counts, and more than three ask discipline to hold the score through them.
  - Your own night is the judgment of your work, and a partner’s slip can’t lower it. The night together can come out above or below it.
  - The Nights Together gives their average, the slips in the company, and how many you covered.
  - For the director’s note and the term’s review, an Off night counts -1, Solid 0, Strong 1 and Remarkable 2.
  - Open a night in your work, and Moment By Moment shows each movement: its result, its own rehearsal, Tiring or Holding, and a slip or what cost it most. Continuity comes from the movements and isn’t added to the night.
- **History (kept in the record):**
  - A Piece Of Work, Explained: Each night is kept in your work, judged movement by movement, with what held it back.
  - Your Work So Far: The nights with a company count toward Playing With Others in Your Work So Far.
  - Feedback And Your Notes: At the closing, the notes still open go into your notes from the courses for the next piece.
- **Later consequence:**
  - At the closing, the director’s note comes: how the nights went on average and, where an ability or technique cost the nights half a point or more each on average, the one that cost them most, to work on. A run with a night played is kept among your milestones; a School or Rep run whose every night went on without you isn’t, and its note, “The run went on without you: …”, shows on the production’s panel as well as in the notices.
  - Looking Back, once, counts the calls answered, the notes given and taken, the dress rehearsal, and the nights with the company; what’s still open comes with you into class.
  - At the term’s review, a run with 3 or more nights is counted: mostly Off is short of what the program asks, and strong work is noted.
  - The next casting reads what you delivered across the runs since the last one.
- **Tested by:** a screen or a look; the UI journeys (`tools/acceptance-ui.mjs`)

### Cabaret And Summer Cabaret (`productions.cabaret`)

- **Action:** `school.cabaret`, `school.summer_cabaret`, at School, Casting, The Yale Cabaret And The Yale Summer Cabaret (`/workspace/school?tab=casting`). Opens: From the guide’s chapter “Drama School”: the Cabaret in any term, the Summer Cabaret in the spring of the first and second years.
- **Preconditions:**
  - For the Cabaret: being a student of the School, not on academic warning or on a leave, the term begun, no Cabaret show this term yet, a week that fits, and not cast at the School and the Rep both in the weeks it would rehearse and play.
  - For the Summer Cabaret: good standing, not being on a leave, the spring of the first or second year, by April 30, and not already in this summer’s company.
  - Your Standing And Classes first: Academic warning keeps you out of the Cabaret and takes you out of a show under way; the summer company takes students in good standing.
  - Casting first: A Cabaret week has to miss every casting call and night on call; with the School and the Rep both calling in its weeks, you can’t take one.
- **Costs:**
  - Time, The Cabaret: 9 weekday evenings from 6 p.m., five hours each, then 5 shows of an hour and a half: Thursday at eight, Friday and Saturday at eight and eleven (an estimate)
  - Time, The Summer: For each of three shows, Tuesday to Saturday afternoons from 1 p.m. for the three weeks before it, five hours each, but for an afternoon when another show plays its Saturday matinee; evenings at eight, dark on Mondays, and Saturday matinees at two (an estimate)
  - Money: The Cabaret is unpaid. The Summer Cabaret pays $375 a week on Fridays at five, from the first rehearsal week to the week after the closing, with federal and Connecticut tax withheld, and FICA too unless you’re a nonresident on an F-1 (an estimate)
- **State (what changes at once):**
  - Joining the Cabaret: your part, and every evening and show on your calendar at once.
  - Joining the summer company: its three plays named with your part in each, and every afternoon and night of the three on your calendar.
- **Consumer (what reads it):**
  - The Calendar, immediate: Joining puts every evening, call and show on your calendar at once.
  - Learning A Part, immediate: Each show has its own rehearsal process, lines, blocking and notes, under its panel.
  - The Nights, evaluation: Each show is a night judged like any other, kept on the run and in your work.
  - Casting, evaluation: A Cabaret or Summer run counts 50% of a School production’s in what the chair reads you delivered.
  - What You’re Worth, scheduled: The summer stipend lands in your account each Friday at five, $375 a week before tax.
  - Your Tax Return, history: The summer stipend is wages on the year’s tax return, with its tax already withheld.
- **Feedback (how to read what comes back):**
  - Performed counts the Cabaret shows played out of 5, with the calls still ahead beside it.
  - The summer panel lists each show with the nights played, and once the company has let you go its subtitle says “The company let you go”.
  - A day called in sick excuses a Cabaret evening or show and a Summer Cabaret call, as hospital or being laid up does: blocking an evening sets without you is still a gap to catch up on, a show missed this way isn’t held against your run, and the summer company keeps you.
- **History (kept in the record):**
  - Your Tax Return: The summer stipend is wages on the year’s tax return, with its tax already withheld.
- **Later consequence:**
  - Each evening and show counts as a call does: lines, blocking and notes as for any part, and each show a night.
  - Playing the closing night puts the show among your credits, and so does missing the closing night, excused or not, once a night of the show has been played; either way the run closes, with the director’s note and Looking Back.
  - The summer stipend is paid each Friday at five, with tax withheld, and counts as wages on the year’s tax return.
  - If you’re put on academic warning, go on a leave or leave the School during a Cabaret show, the calls still to come are called off and not held against you; what you played stays.
  - If you’re hurt on a Summer Cabaret stage, workers’ compensation pays the care and, if you’re kept off it, 75% of the whole stipend as well (Connecticut’s minimum for a week under $473.60, and more than its 75% after tax); nothing for the first three days unless you’re off more than six. For the days it keeps you off, the stipend stops and the compensation is paid in its place. Laid up by anything else, the company covers the nights and the stipend goes on.
- **Tested by:** `school.cabaret`: `tests/b20-creation-personality.test.ts`, `tests/b20-school-attendance.test.ts`, `tests/defects-g8-1.test.ts`, `tests/defects-g8-14.test.ts`, `tests/evidence-g08-life.test.ts`, `tests/evidence-g19-school.test.ts`, `tests/evidence-g22-school.test.ts`, `tests/evidence-g23-school.test.ts`, `tests/evidence-g28-ui.test.ts`, `tests/evidence-g29-ui.test.ts`, `tests/evidence-g34-ui.test.ts`, `tests/evidence2-b03.test.ts`, `tests/evidence2-b10.test.ts`, `tests/remaining-school.test.ts`, `tests/school.test.ts`, `tests/student-experience.test.ts`; `school.summer_cabaret`: `tests/b20-creation-twins.test.ts`, `tests/b20-papers-pension.test.ts`, `tests/decisions-2026-10-14.test.ts`, `tests/defects-g8-1.test.ts`, `tests/defects-g8-11.test.ts`, `tests/defects-g8-13.test.ts`, `tests/defects-g8-14.test.ts`, `tests/defects3-unread.test.ts`, `tests/editorial17-school.test.ts`, `tests/evidence-g15-papers.test.ts`, `tests/evidence-g20-school.test.ts`, `tests/evidence-g21-school.test.ts`, `tests/evidence-g22-school.test.ts`, `tests/evidence-g24-school.test.ts`, `tests/evidence-g27-ui.test.ts`, `tests/evidence2-b02.test.ts`, `tests/evidence2-b05.test.ts`, `tests/evidence2-b06.test.ts`, `tests/evidence2-b08.test.ts`, `tests/evidence2-b12.test.ts`, `tests/guide-examples-productions.test.ts`, `tests/school.test.ts`

### Plays To Read (`productions.plays`)

- **Action:** `plays.read`, `plays.research`, at School, Coursework, Plays To Read (`/workspace/school?tab=coursework`). Opens: From the guide’s chapter “Drama School”. A copy is lent once orientation’s tour has shown you the library.
- **Preconditions:**
  - Being at school, with orientation’s tour done or orientation behind you.
  - Free time for the read.
  - For Research It: the play read first, and not researched yet.
  - Orientation Week first: The tour shows you the Haas Arts Library, where every copy is borrowed.
- **Costs:**
  - Time: Read It: 120 minutes, 60 for a short play or a monologue; read again, 75% of that. Research It: 90 minutes (an estimate)
  - Money: None: the library lends it
- **State (what changes at once):**
  - The clock moves on by the read’s time. A read leaves a note on the play’s form, its published cast and whether there’s a part in it for you, and its setting, and the play keeps its last 6.
  - Read It becomes Read It Again, the Read column counts the reads, and Research It appears.
  - Research It: the play shows Researched, and the note gives its first production, first edition and who licenses it.
- **Consumer (what reads it):**
  - The Player Profile, immediate: A read trains script analysis and imagination, and research trains script analysis again, each kept in your development history.
- **Feedback (how to read what comes back):**
  - Read shows Not Yet, Once, or how many times; Researched shows under it once you’ve researched it.
  - “A part for you” or “No part for you” goes by the published cast’s women and men; neither shows where they aren’t on record, and the Cast column says “Not on record” where the cast isn’t.
  - “It’s too soon after that one to see it fresh.” means no training this time.
  - Your Latest Notes shows the five most recent, one for each play.
- **History (kept in the record):**
  - (none)
- **Later consequence:**
  - The training shows as your craft grows, each step kept in your development history.
- **Tested by:** `plays.read`: `tests/attributes-phase-2b.test.ts`, `tests/b20-craft-promises.test.ts`, `tests/b20-guide-chapters.test.ts`, `tests/evidence-g07-life.test.ts`, `tests/evidence-g19-school.test.ts`, `tests/evidence-g20-school.test.ts`, `tests/evidence-g21-school.test.ts`, `tests/evidence-g22-school.test.ts`, `tests/evidence-g27-ui.test.ts`, `tests/evidence2-b08.test.ts`, `tests/guide-examples-productions.test.ts`, `tests/journey-life.test.ts`, `tests/playreading.test.ts`, `tests/whynot-school.test.ts`; `plays.research`: `tests/b20-guide-chapters.test.ts`, `tests/evidence-g20-school.test.ts`, `tests/guide-examples-productions.test.ts`, `tests/playreading.test.ts`

## Your Craft

Your Player Profile, practice, genres, practice briefs from preparing to taping, how a piece was judged, and your work so far.

### The Player Profile (`craft.profile`)

- **Action:** `ui.profile`, at Player Profile (`/workspace/profile`). Opens: From the guide’s chapter “You As An Actor”: Player Profile on the menu, and your name at its foot.
- **Preconditions:**
  - On a guided life, “You As An Actor” read in the guide.
  - A life that began at drama school.
  - The Guide And This Help first: The profile opens with the guide’s chapter “You As An Actor”.
- **Costs:**
  - Time: None: reading the profile and opening anything on it moves no clock
  - Money: None
- **State (what changes at once):**
  - Opening the profile, a panel or a name changes nothing and moves no clock.
  - Its buttons act: Practice An Hour, Study It, and everything inside an open brief, each with an entry of its own.
- **Consumer (what reads it):**
  - Looking After Yourself reads it, history: The fitness a workout builds is your Stamina on the Player Profile.
  - A Piece Of Work, Explained reads it, history: Each piece judged is kept in School Journey, the latest 160 in full and every one counted.
  - Your Professional Profile reads it, history: Your special skills are your techniques on the Player Profile, at the level it shows.
- **Feedback (how to read what comes back):**
  - Now against Full is how far an ability has to go. Classes Reach is where classes stop taking it; practice carries it the rest of the way.
  - Today says “Not held back today” on a sufficient day; otherwise it names the cause and what your teacher looks for that it holds back.
  - A technique’s Mastered column says Yes at 90, or how far it has to go.
  - In School Journey each half-year row gives each kind of work’s count and its mean, and All Of It the life’s count, mean and best.
  - Identity And Background is shown as you made your character; no ability comes from a name, a portrait, a race or ethnicity, or a gender.
- **History (kept in the record):**
  - (none)
- **Later consequence:**
  - Each figure moves as your life goes on: a class, a step of preparation, an hour of practice, a take, a showing or a night grows what it trains, and Development History lists it.
  - Stamina is the one that falls without use: 0.18 a day toward 35 once 3 days have passed since a workout or a class that trains the body as hard (Acting Intimacy And Combat For The Stage in the spring term, Movement Invention II, Advanced Principles Of Acting Stage Combat and Movement Invention III).
- **Tested by:** a screen or a look; the UI journeys (`tools/acceptance-ui.mjs`)

### Practice (`craft.practice`)

- **Action:** `practice.exercise`, `look.ability`, at Player Profile, The Practice Column (`/workspace/profile`). Opens: From the guide’s chapter “You As An Actor”.
- **Preconditions:**
  - A life in training, awake, out of hospital, free for the hour, and nothing on the calendar wanting you inside it.
  - On your feet (Movement Work, Clown Practice, A Dance Class and Combat Drill): energy at 25 or more, and no injury that limits the body.
  - With a classmate (The Repetition Exercise, A Showing For Classmates, Graded Exposure and An Improv Session), and Live With A Partner: a class to ask.
  - Under 4 hours practiced today.
  - The Player Profile first: Practice is done from the Player Profile, in the row of what it trains.
- **Costs:**
  - Time: 60 minutes
  - Energy: 3 at a desk, 8 on your feet, and 3 more at a tier above your level
  - Money: None
- **State (what changes at once):**
  - The hour passes and its energy is spent.
  - What the exercise trains grows by the hour’s gain, and stops exactly at full.
  - With Variation or Live With A Partner, what it carries over to grows too, under its own line in Development History.
  - The first hour of a day grows discipline once.
  - The exercise’s record keeps the session, its tier and its focus, and the kinds of material it counts as experience of, so material that asks for them prepares faster.
- **Consumer (what reads it):**
  - The Clock: Play And Pause, immediate: Each hour of practice moves the clock 60 minutes and spends its energy.
  - A Piece Of Work, Explained, evaluation: Every piece of work judged afterward is judged with your abilities and techniques where practice left them.
  - Preparing A Brief, immediate: An exercise counts as experience of the material it names, and a brief built on that material prepares faster.
  - Your Work So Far, history: The material an exercise practices is kept in the record that Material You Know reads.
- **Feedback (how to read what comes back):**
  - What the hour found names the tier against your level (“Pitched at your level”, or that it went easily, or was a struggle), what the focus made of it, what carried over, and how far the level rose and where it stands.
  - “Hour 2 on it today” means a repeat: another exercise would give more.
  - Six or more sessions in a row on one exercise is said, with whether its gains are slowing as it nears full.
  - A technique at 90 or more is said to be past what any work asks: from there to 100 it moves no result, before the hour and after it, and on the technique’s look.
  - Attributes And Craft’s subtitle counts today’s practice against 4 hours.
  - An ability’s look gives Now, Classes Reach and Last Change, how it grows, where it started, what it does, where it counts, and its exercise: one named in real acting teaching, one put together from real practice, or one made for the game.
- **History (kept in the record):**
  - Your Work So Far: The material an exercise practices is kept in the record that Material You Know reads.
- **Later consequence:**
  - Every piece of work judged afterward uses what grew at its new level.
  - Spaced pays a day to a week after the exercise’s last session.
  - Discipline counts toward the consistency of most work and toward how much every gain counts, so days kept up add up.
- **Tested by:** `practice.exercise`: `tests/ability-mastered.test.ts`, `tests/attributes-phase-2b.test.ts`, `tests/b20-craft-advice.test.ts`, `tests/b20-craft-bite.test.ts`, `tests/b20-craft-promises.test.ts`, `tests/b20-creation-looks.test.ts`, `tests/b20-guide-chapters.test.ts`, `tests/b20-life-bite.test.ts`, `tests/decisions-advice.test.ts`, `tests/decisions-judge.test.ts`, `tests/defects-r8-1.test.ts`, `tests/development.test.ts`, `tests/engagement.test.ts`, `tests/evidence-g06-life.test.ts`, `tests/evidence-g07-life.test.ts`, `tests/evidence-g20-school.test.ts`, `tests/evidence-g23-school.test.ts`, `tests/evidence-g24-school.test.ts`, `tests/evidence-g27-ui.test.ts`, `tests/evidence-g31-ui.test.ts`, `tests/evidence-g32-ui.test.ts`, `tests/evidence2-b07.test.ts`, `tests/evidence2-b08.test.ts`, `tests/evidence2-b13.test.ts`, `tests/genre-coverage.test.ts`, `tests/guide-chapter-facts.test.ts`, `tests/guide-examples-craft.test.ts`, `tests/history-continuity.test.ts`, `tests/integration-mastery.test.ts`, `tests/interpretation-journey.test.ts`, `tests/remaining-school.test.ts`, `tests/whynot-profile.test.ts`

### Genres (`craft.genre`)

- **Action:** `genre.study`, `look.genre`, at Player Profile, Genres (`/workspace/profile`). Opens: From the guide’s chapter “You As An Actor”.
- **Preconditions:**
  - Awake, out of hospital, free for the time, and nothing on the calendar wanting you inside it.
  - The Player Profile first: Genres is a panel of the Player Profile.
- **Costs:**
  - Time: 90 minutes
  - Energy: 2
  - Money: None: a play is read, or a film of the kind watched
- **State (what changes at once):**
  - The time passes, energy goes down, and the genre’s familiarity rises.
  - A toast names the genre, the play or film you spent the time with, and the familiarity reached, of 100; the Familiarity column moves with it.
- **Consumer (what reads it):**
  - Taping A Brief, evaluation: Knowing the genre is part of a take’s preparation: it counts toward the take’s interpretation, and is complete at 90%.
  - Preparing Coursework, immediate: A scene from a play of a kind you know is prepared faster, by the better of Familiarity and Work In It.
  - Auditions And Callbacks, evaluation: Knowing the project’s genres is part of an audition’s and a self-tape’s preparation, complete at 90%, and half of how well casting thinks you suit the role.
  - Learning A Part, immediate: A part in a play of a kind you know is learned faster.
  - Your Work So Far, history: The genres you’ve worked in are counted in Range.
- **Feedback (how to read what comes back):**
  - It Asks For names each technique with your level against mastery, or says the research didn’t establish one: “Not established: the research holds it with low confidence”, or “No more than any self-tape asks”.
  - A genre’s look gives Familiarity, Work In It and Preparation: how much faster the better of the two makes a scene or a part from a play of its kind, where a brief’s steps speed up with material you’ve met before instead. It gives what the research found the genre asks, and how sure it is.
  - Knowing The Genre, inside a brief, is the better of the first two against the 90% that completes it. Every brief is in one genre.
  - The Genre Asks, inside a brief, names each of its genre’s concerns: what it asks, what a self-tape in it is judged more on and calls on, and which part of preparation answers it. A tape held back most by an ability one of those concerns asks for says so: “Your … held back … by … points: …’s … asks for it.”, as when your Composure held back Consistency by 4.2 points and Nordic Noir’s Feeling Held In asks for it.
  - “You love it” on a genre’s look means a day of its work is a better day: loving it doesn’t make the work faster or limit it.
- **History (kept in the record):**
  - Your Work So Far: The genres you’ve worked in are counted in Range.
- **Later consequence:**
  - The next take of a brief in the genre uses the new figure.
  - The next step on a scene, or the next lines learned, from a play of the kind goes faster by it.
- **Tested by:** `genre.study`: `tests/b20-craft-bite.test.ts`, `tests/b20-craft-clock.test.ts`, `tests/b20-creation-looks.test.ts`, `tests/b20-guide-chapters.test.ts`, `tests/briefs.test.ts`, `tests/decisions-advice.test.ts`, `tests/defects-g3-1.test.ts`, `tests/defects-r8-1.test.ts`, `tests/engagement.test.ts`, `tests/evidence-g20-school.test.ts`, `tests/evidence-g23-school.test.ts`, `tests/evidence-g31-ui.test.ts`, `tests/evidence-g34-ui.test.ts`, `tests/evidence2-b11.test.ts`, `tests/genre-coverage.test.ts`, `tests/guide-examples-craft.test.ts`, `tests/migration-94.test.ts`

### Preparing A Brief (`craft.brief-prepare`)

- **Action:** `brief.prepare`, at Player Profile, Genres, Open Its Brief (`/workspace/profile`). Opens: From the guide’s chapter “You As An Actor”.
- **Preconditions:**
  - A reading isn’t needed: the steps can come first.
  - Rehearse It On Your Feet: 30% of the lines learned, energy at 25 or more, and no injury that limits the body.
  - Awake, out of hospital, free for the step’s time, and nothing on the calendar wanting you inside it.
  - Genres first: A brief opens from its genre’s row in Genres, with Open Its Brief.
- **Costs:**
  - Break It Down: 30 minutes
  - Learn The Lines: 30 minutes, 50 minutes for a brief of medium length, or 70 minutes for a long one
  - Rehearse It On Your Feet: 45 minutes
  - Money: None
- **State (what changes at once):**
  - The step’s time passes and its part rises; the toast says how far.
  - Break It Down practices imagination and Learn The Lines memory, a little, while the part still rises.
  - Rehearse It On Your Feet also rehearses how you chose to play it, brings a classmate reading with you along, and counts as experience of the brief’s material, so the next step goes a little faster. In a brief built on the body or the voice, it practices that too.
- **Consumer (what reads it):**
  - Taping A Brief, evaluation: The take judges each part of the preparation against what completes it, and rehearsal beat by beat.
  - A Reading And A Way To Play It, immediate: Rehearse It On Your Feet rehearses the way you chose to play it, at 90% of the step’s reach.
  - Who Reads With You, immediate: A classmate reading with you learns it as you rehearse, at 50% of the step’s reach.
  - The Player Profile, immediate: Break It Down practices imagination and Learn The Lines memory, a little each time the part rises.
  - Working A Problem Through reads it, evaluation: A brief’s take includes its beats’ own work and the ways you kept, as its forecast did.
- **Feedback (how to read what comes back):**
  - Preparation shows The Breakdown, The Lines, Rehearsal and Knowing The Genre, each as so much of what completes it; Rehearsal’s against the 50% a beat asks with no turn into it and one tone.
  - A beat a change of tone leads into, or one held two ways at once, asks more rehearsal than the rest.
  - Its Rehearsal, Beat By Beat, is each beat’s own: the brief’s rehearsal, and any work on that beat alone from Work It Through.
  - Past what every beat asks, more rehearsal adds nothing to a take.
- **History (kept in the record):**
  - (none)
- **Later consequence:**
  - The next take judges each part against what completes it; a part left short holds back the qualities that depend on it.
  - Preparation keeps from day to day: it doesn’t fade.
- **Tested by:** `brief.prepare`: `tests/attributes-phase-2b.test.ts`, `tests/b20-craft-advice.test.ts`, `tests/b20-craft-bite.test.ts`, `tests/b20-craft-noleak.test.ts`, `tests/b20-craft-promises.test.ts`, `tests/b20-craft-screens.test.ts`, `tests/briefs.test.ts`, `tests/decisions-advice.test.ts`, `tests/decisions-judge.test.ts`, `tests/defects-g29-1.test.ts`, `tests/defects-g3-1.test.ts`, `tests/defects-g30-1.test.ts`, `tests/defects-g31-1.test.ts`, `tests/defects-g8-11.test.ts`, `tests/defects-r8-1.test.ts`, `tests/determinism-played.test.ts`, `tests/editorial17-school.test.ts`, `tests/engagement.test.ts`, `tests/ensemble.test.ts`, `tests/evidence-g07-life.test.ts`, `tests/evidence-g20-school.test.ts`, `tests/evidence-g23-school.test.ts`, `tests/evidence2-b11.test.ts`, `tests/genre-identity-screens.test.ts`, `tests/genre-identity.test.ts`, `tests/genre-mastered.test.ts`, `tests/genre-reader.test.ts`, `tests/guide-examples-craft.test.ts`, `tests/integration-mastery.test.ts`, `tests/interpretation-journey.test.ts`, `tests/journey-agent.test.ts`, `tests/remaining-09-coverage.test.ts`, `tests/remaining-genres.test.ts`, `tests/workbook.test.ts`

### A Reading And A Way To Play It (`craft.brief-choose`)

- **Action:** `brief.choose`, at Player Profile, Its Brief, Your Reading (`/workspace/profile`). Opens: From the guide’s chapter “You As An Actor”.
- **Preconditions:**
  - An open brief; How You’ll Play It shows once a reading is chosen.
- **Costs:**
  - Time: None: the choice is made at once
  - Money: None
- **State (what changes at once):**
  - A first reading is set. A new one keeps 50% of the breakdown, and the toast says where it stands.
  - A new way of playing it keeps 50% of its rehearsal; the same way chosen again keeps all of it.
  - A side newly chosen counts once in the record your habits are read from. Change The Reading, the same way chosen again, and a side kept while another axis changes count nothing more.
- **Consumer (what reads it):**
  - Preparing A Brief, immediate: A new reading keeps 50% of the breakdown.
  - Taping A Brief, evaluation: The take uses the reading and the way it’s played: what they lean toward, the abilities they call on, and how far the way is rehearsed.
  - Your Work So Far, history: Each side newly chosen, and each take’s reading, is counted toward the habits Your Work So Far names.
- **Feedback (how to read what comes back):**
  - The figure beside each reading and each side is the take fully prepared, on a good day, with no draw: what the choice can reach for you now, against the others.
  - “Doesn’t fit:” under a side says why: the brief’s text forbids it, or the callback has asked for the other.
  - The line under the table gives the take played this way against nothing chosen, and how far you’ve rehearsed the way.
  - At full ability every reading, and every way that fits, reaches 100. Below it, the one that leans on what you do well shows you better.
- **History (kept in the record):**
  - Your Work So Far: Each side newly chosen, and each take’s reading, is counted toward the habits Your Work So Far names.
- **Later consequence:**
  - The next take uses the reading, and the way as far as you’ve rehearsed it by then.
  - Work It Through can play one beat its own way, on an axis the whole leaves open.
- **Tested by:** `brief.choose`: `tests/attributes-complete.test.ts`, `tests/attributes-phase-2b.test.ts`, `tests/b20-craft-advice.test.ts`, `tests/b20-craft-bite.test.ts`, `tests/b20-craft-noleak.test.ts`, `tests/b20-craft-promises.test.ts`, `tests/b20-craft-screens.test.ts`, `tests/b20-creation-abilities.test.ts`, `tests/b20-creation-noleak.test.ts`, `tests/b20-creation-twins.test.ts`, `tests/b20-guide-chapters.test.ts`, `tests/b20-life-bite.test.ts`, `tests/b27-voice-demo.test.ts`, `tests/briefs.test.ts`, `tests/decisions-advice.test.ts`, `tests/decisions-judge.test.ts`, `tests/defects-g29-1.test.ts`, `tests/defects-g3-1.test.ts`, `tests/defects-g30-1.test.ts`, `tests/defects-g31-1.test.ts`, `tests/defects-g6-1.test.ts`, `tests/defects-g8-11.test.ts`, `tests/defects-g8-15.test.ts`, `tests/defects-r8-1.test.ts`, `tests/determinism-played.test.ts`, `tests/editorial17-school.test.ts`, `tests/engagement.test.ts`, `tests/ensemble.test.ts`, `tests/evidence-g20-school.test.ts`, `tests/evidence-g23-school.test.ts`, `tests/evidence-g31-ui.test.ts`, `tests/evidence2-b11.test.ts`, `tests/genre-coverage.test.ts`, `tests/genre-identity-screens.test.ts`, `tests/genre-identity.test.ts`, `tests/genre-mastered.test.ts`, `tests/genre-reader.test.ts`, `tests/guide-examples-craft.test.ts`, `tests/history-continuity.test.ts`, `tests/integration-mastery.test.ts`, `tests/interpretation-journey.test.ts`, `tests/journey-agent.test.ts`, `tests/pro-core.test.ts`, `tests/pro-representation-screen.test.ts`, `tests/remaining-09-coverage.test.ts`, `tests/remaining-genres.test.ts`, `tests/workbook.test.ts`

### Who Reads With You (`craft.brief-reader`)

- **Action:** `brief.reader`, at Player Profile, Its Brief, Read With (`/workspace/profile`). Opens: From the guide’s chapter “You As An Actor”.
- **Preconditions:**
  - A brief on camera: one recorded alone at a microphone has nobody to read with, and the choice isn’t shown.
  - A classmate who trusts you: under 25, they’d rather not.
- **Costs:**
  - Time: None to choose
  - Money: None
- **State (what changes at once):**
  - A new classmate starts with nothing prepared; choosing the one already reading keeps what they have.
  - Choosing the recording, or another classmate, sets the first aside, and what they had prepared goes with them.
- **Consumer (what reads it):**
  - Taping A Brief, evaluation: The take with its reader is what earns a callback; your own result counts nothing the reader brings.
  - Rehearsing With A Partner, immediate: A take with a classmate at Strong or better together adds about 1 to your bond; a slip of theirs you cover at least half of adds 2 to their trust.
  - Your Work So Far, history: Every take with a reader counts toward Playing With Others, with the slips and those you covered.
- **Feedback (how to read what comes back):**
  - “Together it came to …, about what your own work did”, or so much under or over it. Under says why (they came less prepared, your readings were apart, they slipped and whether you covered most of it), then “Your own result stands as it is.”
  - A recording brings 60 to each share of the scene it holds: the take with it comes out under your own where your own work tops 60 there, and over it where it falls short of that.
  - A brief recorded alone at a microphone has no take with a reader and no How They Play It, and its callback reads your own take.
- **History (kept in the record):**
  - Your Work So Far: Every take with a reader counts toward Playing With Others, with the slips and those you covered.
- **Later consequence:**
  - Each take works out the take with the reader beside your own, blending in what the reader brought, most of all in connection and responsiveness, as far as the scene is played off them. Strong, 65 or more, earns a callback where the take wasn’t one itself.
  - With a classmate, a take together at Strong or better adds 1 to your bond, more or less by how warmly you take to people, and a slip of theirs you cover at least half of adds 2 to their trust, and stays in what they remember of you.
  - Every take with a reader counts toward Playing With Others in Your Work So Far.
- **Tested by:** `brief.reader`: `tests/b20-craft-promises.test.ts`, `tests/defects-g31-1.test.ts`, `tests/determinism-played.test.ts`, `tests/ensemble.test.ts`, `tests/evidence-g20-school.test.ts`, `tests/guide-examples-craft.test.ts`, `tests/remaining-09-coverage.test.ts`

### Taping A Brief (`craft.brief-tape`)

- **Action:** `practice.self_tape`, at Player Profile, Its Brief, The Take (`/workspace/profile`). Opens: From the guide’s chapter “You As An Actor”.
- **Preconditions:**
  - A reading chosen, and a life in training.
  - Awake, out of hospital, free for the hour, and nothing on the calendar wanting you inside it.
  - A Reading And A Way To Play It first: A take needs a reading chosen first.
- **Costs:**
  - Time: 60 minutes
  - Energy: 2
  - Money: None
- **State (what changes at once):**
  - The hour passes and energy goes down 2.
  - The take goes on your work record, named for the brief and its reading, and on the brief’s own record, which keeps the last 8.
  - It grows On Camera, or Voice-Over at a microphone, and any technique the scene stages, toward where classes level off, and is practice in the brief’s genres, by how far it was prepared: 15% of a prepared take’s, taped cold.
  - A take that’s the same again (the same reading, played the same way, no better prepared) is worth half as practice, and the same brief again the same day halves the genre’s practice again.
  - The take with its reader is worked out beside your own, and a classmate who read moves with it.
  - A take with its reader at 65 or more (your own take, at a microphone) earns a callback, where it wasn’t one itself: one side of one axis the brief leaves open, said before the next take.
- **Consumer (what reads it):**
  - A Piece Of Work, Explained, history: Each take is kept on your work record, and opens there into how it was judged, beat by beat.
  - Genres, immediate: A take is practice in the brief’s genres, one session’s worth shared among them.
  - The Player Profile, immediate: A take grows On Camera, or Voice-Over, toward where classes level off.
  - Your Work So Far, history: Takes and their readings are read for habits, and a callback answered counts toward Taking Direction.
  - Genres reads it, evaluation: Knowing the genre is part of a take’s preparation: it counts toward the take’s interpretation, and is complete at 90%.
  - Preparing A Brief reads it, evaluation: The take judges each part of the preparation against what completes it, and rehearsal beat by beat.
  - A Reading And A Way To Play It reads it, evaluation: The take uses the reading and the way it’s played: what they lean toward, the abilities they call on, and how far the way is rehearsed.
  - Who Reads With You reads it, evaluation: The take with its reader is what earns a callback; your own result counts nothing the reader brings.
- **Feedback (how to read what comes back):**
  - What a take is for is said plainly: a first take, a callback, another reading, the same reading played another way, better prepared or better able than last time, or the same again, worth half as practice.
  - Beat By Beat gives each beat’s Result, Its Rehearsal against what it asks, Stamina (Holding, or Tiring with how much off) and What Happened: a slip, shaken by the slip before, what cost it most, or As expected.
  - Continuity, under the beats, is how evenly the character held: shown beside the take, never added to it.
  - “Played against the callback’s note: the callback is still yours.” means the note wasn’t answered.
  - Where It Would Show Next suggests up to five, each with why: a callback waiting; the brief you haven’t taped that leans most on the weakness What To Work On names, or on the one your work keeps coming back to where recent work names none (once every brief is taped, the one leaning most); one built on material your work hasn’t met; one taped before that takes it the other way from a habit; the brief of the genre your work knows least, new to you; and a reading of a taped brief you haven’t tried.
  - A weakness no practice brief calls on gets no brief suggested for it, and What To Work On says so: “No practice brief calls on …, so a tape won’t show it and none is suggested for it.”
- **History (kept in the record):**
  - A Piece Of Work, Explained: Each take is kept on your work record, and opens there into how it was judged, beat by beat.
  - Your Work So Far: Takes and their readings are read for habits, and a callback answered counts toward Taking Direction.
- **Later consequence:**
  - A callback stays until a take plays it the way its note asks; that take ends the round, and only a take that isn’t a callback earns the next.
  - What held the take back is counted by Your Work So Far; What To Work On Next forecasts every ability and technique the take called on, so what held it back most and what pays most to train can be two things, and the pane says which. The next suggestions in Where It Would Show Next follow from what it names.
- **Tested by:** `practice.self_tape`: `tests/attributes-complete.test.ts`, `tests/attributes-phase-2b.test.ts`, `tests/b20-craft-advice.test.ts`, `tests/b20-craft-bite.test.ts`, `tests/b20-craft-noleak.test.ts`, `tests/b20-craft-promises.test.ts`, `tests/b20-craft-screens.test.ts`, `tests/b20-creation-abilities.test.ts`, `tests/b20-creation-noleak.test.ts`, `tests/b20-creation-twins.test.ts`, `tests/b20-guide-chapters.test.ts`, `tests/b20-life-bite.test.ts`, `tests/b27-voice-demo.test.ts`, `tests/briefs.test.ts`, `tests/decisions-advice.test.ts`, `tests/decisions-judge.test.ts`, `tests/defects-g29-1.test.ts`, `tests/defects-g3-1.test.ts`, `tests/defects-g30-1.test.ts`, `tests/defects-g31-1.test.ts`, `tests/defects-g6-1.test.ts`, `tests/defects-g8-15.test.ts`, `tests/defects-r8-1.test.ts`, `tests/determinism-played.test.ts`, `tests/editorial17-school.test.ts`, `tests/engagement.test.ts`, `tests/ensemble.test.ts`, `tests/evidence-g20-school.test.ts`, `tests/evidence-g23-school.test.ts`, `tests/evidence-g31-ui.test.ts`, `tests/evidence2-b11.test.ts`, `tests/genre-coverage.test.ts`, `tests/genre-identity-screens.test.ts`, `tests/genre-identity.test.ts`, `tests/genre-mastered.test.ts`, `tests/genre-reader.test.ts`, `tests/guide-examples-craft.test.ts`, `tests/history-continuity.test.ts`, `tests/integration-mastery.test.ts`, `tests/interpretation-journey.test.ts`, `tests/journey-agent.test.ts`, `tests/pro-core.test.ts`, `tests/pro-representation-screen.test.ts`, `tests/remaining-09-coverage.test.ts`, `tests/remaining-genres.test.ts`, `tests/workbook.test.ts`

### A Piece Of Work, Explained (`craft.work`)

- **Action:** `look.work`, at Player Profile, School Journey, A Piece Of Work (`/workspace/profile`). Opens: From the guide’s chapter “You As An Actor”.
- **Preconditions:**
  - A piece of work judged: a take, a showing or a night.
  - One of the latest 160 on your record; older ones are counted in School Journey, and no longer open.
- **Costs:**
  - Time: None
  - Money: None
- **State (what changes at once):**
  - Opening it changes nothing.
- **Consumer (what reads it):**
  - The Player Profile, history: Each piece judged is kept in School Journey, the latest 160 in full and every one counted.
  - Your Work So Far, history: Your Work So Far reads the record for strengths, and what held each piece back, kept for life, for what keeps coming back.
  - The Nights reads it, history: Each night is kept in your work, judged movement by movement, with what held it back.
  - Practice reads it, evaluation: Every piece of work judged afterward is judged with your abilities and techniques where practice left them.
  - Taping A Brief reads it, history: Each take is kept on your work record, and opens there into how it was judged, beat by beat.
- **Feedback (how to read what comes back):**
  - A limit’s points are what that one thing cost: its quality judged again with that one thing made whole, everything else the same. Limits are ranked by what they cost the whole.
  - “You met everything it asked, so it couldn’t have scored higher.” is a piece at mastery.
  - The small line gives what it was judged with: readiness, difficulty, and each part of preparation against what completed it.
  - The line at the foot judges the piece again from its record and gives the figure: the same, whatever has changed since.
  - What To Work On Next looks at these limits across your recent work, and, for the weakness your work keeps coming back to, what it has cost across all your work.
- **History (kept in the record):**
  - The Player Profile: Each piece judged is kept in School Journey, the latest 160 in full and every one counted.
  - Your Work So Far: Your Work So Far reads the record for strengths, and what held each piece back, kept for life, for what keeps coming back.
- **Later consequence:**
  - A result is kept under the rules it was judged by: a later change to the rules doesn’t rewrite it, and one judged under rules since changed is shown as it was, without being judged again.
  - Past 160, the oldest piece leaves the record; School Journey keeps counting it.
- **Tested by:** a screen or a look; the UI journeys (`tools/acceptance-ui.mjs`)

### Your Work So Far (`craft.identity`)

- **Action:** , at Player Profile, Your Work So Far (`/workspace/profile`). Opens: From the guide’s chapter “You As An Actor”; its patterns from 6 pieces judged.
- **Preconditions:**
  - 6 pieces of work judged before strengths and weaknesses are named; until then it says Early days.
  - A Piece Of Work, Explained first: Patterns are named once 6 pieces of work have been judged.
- **Costs:**
  - Time: None
  - Money: None
- **State (what changes at once):**
  - Reading it changes nothing.
- **Consumer (what reads it):**
  - The Player Profile, immediate: What To Work On Next names the weakness your work keeps coming back to with its count in all, and may put it first.
  - Preparing Coursework reads it, history: Each showing is kept on your record, where Your Work So Far reads your strengths and what keeps holding you back.
  - How You’ll Play A Scene reads it, history: Every way you choose and show is kept, and Your Work So Far names one you choose most of the time.
  - Feedback And Your Notes reads it, history: Each showing is on your record, and a note still open after 3 times shows in Your Work So Far as one that keeps coming back.
  - Rehearsing With A Partner reads it, history: Each scene played together is counted, and Your Work So Far gives how they came out on average from the third on.
  - The Director’s Notes reads it, history: Each note on the craft given, worked on and answered counts for life in Taking Direction, with the way you reach for most; a note on the weakness your work keeps coming back to names it, with its count.
  - How You’ll Play A Part reads it, history: The ways you choose are kept as habits in Your Work So Far.
  - The Nights reads it, history: The nights with a company count toward Playing With Others in Your Work So Far.
  - Practice reads it, history: The material an exercise practices is kept in the record that Material You Know reads.
  - Genres reads it, history: The genres you’ve worked in are counted in Range.
  - A Reading And A Way To Play It reads it, history: Each side newly chosen, and each take’s reading, is counted toward the habits Your Work So Far names.
  - Who Reads With You reads it, history: Every take with a reader counts toward Playing With Others, with the slips and those you covered.
  - Taping A Brief reads it, history: Takes and their readings are read for habits, and a callback answered counts toward Taking Direction.
  - A Piece Of Work, Explained reads it, history: Your Work So Far reads the record for strengths, and what held each piece back, kept for life, for what keeps coming back.
- **Feedback (how to read what comes back):**
  - Early days, with the count of pieces judged, means patterns aren’t named yet.
  - A strength is your abilities’ and techniques’ already: it’s shown, and adds nothing to a result.
  - Reliability reads every term’s calls together, those before this term kept with this term’s, so it doesn’t start again with a term; it shows once 6 calls have been made.
  - A section with too little behind it isn’t shown.
  - The first ability or technique in What Keeps Holding It Back is the one your work keeps coming back to. What To Work On Next gives its count in all and puts it first where it’s about as useful to train as the top, and a director’s note on it ends “It’s your … again: it’s held back … of your pieces before this.” Neither moves a figure.
- **History (kept in the record):**
  - (none)
- **Later consequence:**
  - Each line moves as the work goes on: it’s read again from the record each time it’s shown.
  - A weakness that kept coming back stays on the list by what it has cost in all, until others have cost more.
- **Tested by:** a screen or a look; the UI journeys (`tools/acceptance-ui.mjs`)

## Your Career

The Career screen, your professional profile and name, headshots, your résumé and your reel.

### The Career Screen (`career.overview`)

- **Action:** `ui.career`, at Career, Overview (`/workspace/career?tab=overview`). Opens: From the guide’s chapter “Your Career”. Career is in the menu under Your Work.
- **Preconditions:**
  - Its chapter in the guide, read: the screen opens with it.
  - Permission To Work first: Permission To Work on the Overview is the same permission Papers shows under Permission To Work.
- **Costs:**
  - Time: None: reading it moves no clock
  - Money: None
- **State (what changes at once):**
  - The screen shows your record and doesn’t move it.
- **Consumer (what reads it):**
  - The Actor Showcase reads it, history: How each scene went at each showcase day stays on your professional record.
- **Feedback (how to read what comes back):**
  - Needed For Any Submission is what a submission can’t go without: headshots and a résumé.
  - Worth Doing is what would help: a reel, newer headshots, or a résumé brought up to date.
  - The Way You’re On says whether you’re completing the degree, have graduated, or left without it. The School’s Bulletin lets the faculty shorten the residency only on rare occasions, never below two years, and publishes no way to ask, so the game offers no early degree.
- **History (kept in the record):**
  - (none)
- **Later consequence:**
  - What’s Missing changes as you make materials, and as your record moves on past them: a new credit, a new skill or new recorded work.
- **Tested by:** a screen or a look; the UI journeys (`tools/acceptance-ui.mjs`)

### Your Professional Profile (`career.profile`)

- **Action:** `pro.set_name`, at Career, Portfolio, Your Profile (`/workspace/career?tab=portfolio`). Opens: From the guide’s chapter “Your Career”.
- **Preconditions:**
  - A name of letters, with spaces, hyphens, apostrophes and periods between them, 40 characters at most.
- **Costs:**
  - Time: None
  - Money: None
- **State (what changes at once):**
  - Your profile shows the new name at once.
- **Consumer (what reads it):**
  - Your Résumé, immediate: Your résumé uses your professional name, and one made under another name reads as behind.
  - The Player Profile, history: Your special skills are your techniques on the Player Profile, at the level it shows.
- **Feedback (how to read what comes back):**
  - Professional credits are paid work and student films, kept for good. Practice, practice briefs and self-tapes are never credits.
  - A special skill marked mastered is at its technique’s top, where no piece asks more of it.
- **History (kept in the record):**
  - The Player Profile: Your special skills are your techniques on the Player Profile, at the level it shows.
- **Later consequence:**
  - A résumé made under your old name reads as behind, and Update Your Résumé makes one under the new name.
- **Tested by:** `pro.set_name`: `tests/b20-guide-chapters.test.ts`, `tests/pro-core.test.ts`

### Headshots (`career.headshots`)

- **Action:** `pro.headshots`, at Career, Portfolio, Headshots (`/workspace/career?tab=portfolio`). Opens: From the guide’s chapter “Your Career”.
- **Preconditions:**
  - Free for the session’s four hours, with nothing on your calendar in that time.
  - Daytime: a session starts between 9 AM and 4 PM.
  - Enough in your bank for the price.
- **Costs:**
  - Time: four hours (an estimate)
  - Money: $700.00 (an estimate)
- **State (what changes at once):**
  - The clock moves on by the session, the price comes out of your bank as a work cost, and your new headshots are on the panel, dated today.
- **Consumer (what reads it):**
  - The Career Screen, immediate: Once you have headshots, What’s Missing stops asking for them, until they’re more than two years old.
  - Your Accounts, immediate: The session’s price comes out of your bank as a work cost.
- **Feedback (how to read what comes back):**
  - Current means they were taken within two years. Out of date means they may not look like you now.
- **History (kept in the record):**
  - (none)
- **Later consequence:**
  - Two years on, they read as out of date, and What’s Missing says so.
- **Tested by:** `pro.headshots`: `tests/b20-agent-ask-lapse.test.ts`, `tests/b20-career-skill.test.ts`, `tests/b20-guide-chapters.test.ts`, `tests/b27-voice-demo.test.ts`, `tests/journey-agent.test.ts`, `tests/journey-career.test.ts`, `tests/pro-agent.test.ts`, `tests/pro-app.test.ts`, `tests/pro-core.test.ts`, `tests/pro-opportunities-screen.test.ts`, `tests/pro-representation-screen.test.ts`, `tests/pro-screen.test.ts`, `tests/pro-work.test.ts`

### Your Résumé (`career.resume`)

- **Action:** `pro.update_resume`, at Career, Portfolio, Résumé (`/workspace/career?tab=portfolio`). Opens: From the guide’s chapter “Your Career”.
- **Preconditions:**
  - Free for an hour.
  - Something on your record it doesn’t have yet, for an update.
- **Costs:**
  - Time: an hour (an estimate)
  - Money: None
- **State (what changes at once):**
  - The clock moves on an hour, and the new résumé is on the panel with what it says.
- **Consumer (what reads it):**
  - The Career Screen, immediate: Once you have a résumé, What’s Missing stops asking for one, until your record moves on past it.
  - The Nights, history: A School production’s part goes on your résumé once its run has closed.
  - Your Unions reads it, history: Your résumé lists your unions once you’re a member.
  - Offers And Booked Work reads it, history: The part goes on your professional credits, and your résumé reads as behind until it has it.
- **Feedback (how to read what comes back):**
  - Up To Date means it has everything on your record. Behind names what it’s missing.
- **History (kept in the record):**
  - The Nights: A School production’s part goes on your résumé once its run has closed.
- **Later consequence:**
  - A part played, a skill grown, a new name, the degree, a union, an Emmy nomination once it’s announced, a win once it’s presented, or a Sundance selection once the festival says so makes it behind, and What’s Missing names what’s new.
- **Tested by:** `pro.update_resume`: `tests/b20-agent-ask-lapse.test.ts`, `tests/b20-career-effects.test.ts`, `tests/b20-career-history.test.ts`, `tests/b20-career-skill.test.ts`, `tests/b20-guide-chapters.test.ts`, `tests/b27-voice-demo.test.ts`, `tests/career-agents.test.ts`, `tests/career-awards.test.ts`, `tests/journey-agent.test.ts`, `tests/journey-career.test.ts`, `tests/pro-agent.test.ts`, `tests/pro-app.test.ts`, `tests/pro-core.test.ts`, `tests/pro-opportunities-screen.test.ts`, `tests/pro-representation-screen.test.ts`, `tests/pro-screen.test.ts`, `tests/pro-work.test.ts`

### Your Reel (`career.reel`)

- **Action:** `pro.cut_reel`, at Career, Portfolio, Reel (`/workspace/career?tab=portfolio`). Opens: From the guide’s chapter “Your Career”.
- **Preconditions:**
  - Something recorded: tape a practice brief on the Player Profile first.
  - Free for two hours.
  - Enough in your bank for the edit.
  - Taping A Brief first: A self-tape of a practice brief is the first recorded work a reel can be cut from.
- **Costs:**
  - Time: two hours (an estimate)
  - Money: $250.00 (an estimate)
- **State (what changes at once):**
  - The clock moves on two hours, the edit comes out of your bank, and the reel shows what’s on it, a line a piece.
- **Consumer (what reads it):**
  - The Career Screen, immediate: Once you have a reel, What’s Missing stops asking for one, and says when newer work came after it.
  - Why It Went This Way reads it, evaluation: Your reel’s best band is part of Your Work, and a reel is part of Stage And Screen.
- **Feedback (how to read what comes back):**
  - A reel of self-tapes only says so: filmed School work or screen work shows more.
  - A night on stage and a class piece aren’t recorded, so they never appear here.
- **History (kept in the record):**
  - (none)
- **Later consequence:**
  - New recorded work after it shows under What’s Missing as worth adding.
- **Tested by:** `pro.cut_reel`: `tests/b20-career-effects.test.ts`, `tests/journey-agent.test.ts`, `tests/journey-career.test.ts`, `tests/pro-core.test.ts`, `tests/pro-representation-screen.test.ts`

### Your Voice Demo (`career.demo`)

- **Action:** `pro.mix_demo`, at Career, Portfolio, Voice Demo (`/workspace/career?tab=portfolio`). Opens: From the guide’s chapter “Your Career”.
- **Preconditions:**
  - A recording of your voice: tape a voice brief on the Player Profile first.
  - Free for two hours.
  - Enough in your bank for the session.
  - Taping A Brief first: A voice brief you’ve taped is the first recording a demo can be mixed from.
- **Costs:**
  - Time: two hours (an estimate)
  - Money: $300.00 (an estimate)
- **State (what changes at once):**
  - The clock moves on two hours, the session comes out of your bank, and the demo shows what’s on it, a line a recording.
- **Consumer (what reads it):**
  - (none)
- **Feedback (how to read what comes back):**
  - Voice casting asks for a demo where screen casting asks for a reel: an animated series, an animated feature, a dub or a narration the game’s slate makes takes no submission without one.
  - A demo holds only what you recorded for the voice, and a reel only what was filmed.
- **History (kept in the record):**
  - (none)
- **Later consequence:**
  - A submission for voice work sends the demo you have then, and keeps saying which one after you mix another.
  - A newer recording of your voice shows on the Voice Demo panel as worth adding.
- **Tested by:** `pro.mix_demo`: `tests/b27-voice-demo.test.ts`

### Agents And How To Reach One (`career.agent`)

- **Action:** `pro.agent_notice`, `pro.agent_check`, `pro.ask_referral`, `pro.send_materials`, at Career, Representation (`/workspace/career?tab=representation`). Opens: From the guide’s chapter “Representation”.
- **Preconditions:**
  - The notice read.
  - Headshots and a résumé: a check refuses without them.
  - For a referral, a finished professional job whose work was judged Strong or better, once for each job.
  - For a send, an introduction: the School’s follow-up or a referral.
  - Headshots first: A check refuses an approach with no headshots, since every submission starts with one.
  - Your Résumé first: A check refuses an approach with no résumé, and a résumé behind your record is one thing an office can ask for.
- **Costs:**
  - Time: None
  - Money: None
- **State (what changes at once):**
  - Sending moves Where You Stand to Materials Sent, and the office’s answer is on the way.
- **Consumer (what reads it):**
  - An Office’s Answers And The Meeting, scheduled: Sending your materials puts the office’s answer on the way, about two weeks on.
  - Why It Went This Way reads it, history: Each answer an office gives keeps its reasons here.
  - The Agreement reads it, history: Accepting, declining and the agreement’s end each go in the agent’s History panel.
- **Feedback (how to read what comes back):**
  - Where You Stand names the step you’re at, and What’s Next says what to do about it.
  - A referral comes from the casting office of a job you’ve finished, never from the agent, and no agent writes to you first.
  - An agent submits you for work and handles its offers, for a commission. Actors also work with managers, who advise on a career, entertainment lawyers, who read contracts, and publicists, who handle the press; none of them is in the game. A casting director works for the production, not for you.
  - The Agencies panel says what each agency brief 25 names says of itself on its own pages: how an actor reaches it, the agents it names, and what the game does with it.
- **History (kept in the record):**
  - (none)
- **Later consequence:**
  - The office answers in about two weeks: a request for more, a meeting or a pass, each as a notice. Or no answer comes, and after six weeks that counts as no.
  - After a pass, the office looks again only after a year; after no answer or a declined offer, six months. Then it looks only at something new: a new credit, a better reel or a referral.
- **Tested by:** `pro.agent_notice`: `tests/b20-career-effects.test.ts`, `tests/b20-career-skill.test.ts`, `tests/b20-guide-chapters.test.ts`, `tests/career-agents.test.ts`, `tests/journey-agent.test.ts`, `tests/journey-career-older.test.ts`, `tests/pro-agent.test.ts`, `tests/pro-representation-screen.test.ts`; `pro.agent_check`: `tests/b20-agent-ask-lapse.test.ts`, `tests/b20-career-effects.test.ts`, `tests/b20-career-skill.test.ts`, `tests/b20-guide-chapters.test.ts`, `tests/career-agents.test.ts`, `tests/journey-agent.test.ts`, `tests/journey-career-older.test.ts`, `tests/journey-career.test.ts`, `tests/pro-agent.test.ts`, `tests/pro-representation-screen.test.ts`; `pro.ask_referral`: `tests/b20-career-effects.test.ts`, `tests/b20-career-skill.test.ts`, `tests/career-agents.test.ts`, `tests/journey-agent.test.ts`, `tests/journey-career-older.test.ts`, `tests/pro-agent.test.ts`, `tests/pro-representation-screen.test.ts`; `pro.send_materials`: `tests/b20-agent-ask-lapse.test.ts`, `tests/b20-career-effects.test.ts`, `tests/b20-career-history.test.ts`, `tests/b20-career-saveload.test.ts`, `tests/b20-career-skill.test.ts`, `tests/b20-guide-chapters.test.ts`, `tests/career-agents.test.ts`, `tests/journey-agent.test.ts`, `tests/journey-career-older.test.ts`, `tests/journey-career.test.ts`, `tests/pro-agent.test.ts`, `tests/pro-representation-screen.test.ts`

### An Office’s Answers And The Meeting (`career.agent-answers`)

- **Action:** `pro.supply_material`, `pro.ask_to_move`, at Career, Representation, The Meeting (`/workspace/career?tab=representation`). Opens: From the guide’s chapter “Representation”.
- **Preconditions:**
  - For a request, what it asked for made by its date.
  - For a move, a meeting not moved before, and not yet started.
- **Costs:**
  - Time: The meeting’s hour, and the trip: two hours from New Haven (an estimate)
  - Money: None
- **State (what changes at once):**
  - What you send goes to the office, and its answer comes about a week later.
  - A moved meeting is on your calendar at its new time.
- **Consumer (what reads it):**
  - Why It Went This Way, evaluation: A meeting kept or missed, and material sent when asked, are read under Reliability.
  - The Clock: Play And Pause, scheduled: A meeting stops the clock like any commitment, and offers Ask To Move at the stop.
- **Feedback (how to read what comes back):**
  - Material sent when asked, and meetings kept, count for you under Reliability; a missed one counts against you.
- **History (kept in the record):**
  - (none)
- **Later consequence:**
  - After a meeting you keep, the office tells you its decision five days later: an offer or a pass.
  - A meeting you miss closes the approach, since a meeting comes before an offer in the game.
- **Tested by:** `pro.supply_material`: `tests/journey-agent.test.ts`, `tests/journey-career.test.ts`; `pro.ask_to_move`: `tests/journey-agent.test.ts`, `tests/journey-career.test.ts`, `tests/pro-representation-screen.test.ts`

### Why It Went This Way (`career.reasons`)

- **Action:** `ui.career-reasons`, at Career, Representation, Why It Went This Way (`/workspace/career?tab=representation`). Opens: From the guide’s chapter “Representation”.
- **Preconditions:**
  - The notice read.
- **Costs:**
  - Time: None: reading it moves no clock
  - Money: None
- **State (what changes at once):**
  - The table opens, and closes with Hide The Reasons.
- **Consumer (what reads it):**
  - Your Reel, evaluation: Your reel’s best band is part of Your Work, and a reel is part of Stage And Screen.
  - Agents And How To Reach One, history: Each answer an office gives keeps its reasons here.
  - An Office’s Answers And The Meeting reads it, evaluation: A meeting kept or missed, and material sent when asked, are read under Reliability.
- **Feedback (how to read what comes back):**
  - None of it is the agent’s own. The bar and the chances are the game’s, and Room On His List is assumed. For a real agent, how likely the office is to take you further is one assumption for every real agent in the game.
  - At The Last Decision is kept as it was, so it reads the same after your record moves on.
- **History (kept in the record):**
  - Agents And How To Reach One: Each answer an office gives keeps its reasons here.
- **Later consequence:**
  - As Things Stand Now changes with your record: a new credit, a better reel, the degree, a meeting kept.
- **Tested by:** a screen or a look; the UI journeys (`tools/acceptance-ui.mjs`)

### The Agreement (`career.agreement`)

- **Action:** `pro.accept_agreement`, `pro.decline_agreement`, `pro.end_agreement`, at Career, Representation, The Agreement (`/workspace/career?tab=representation`). Opens: From the guide’s chapter “Representation”.
- **Preconditions:**
  - For Accept or Decline, an offer still standing.
  - For End It: No Offer In 90 Days, 90 days with no real offer of covered work through the agent, the days you’re employed on covered work not counted, and not while you’re working.
  - For End It: Under Ten Days’ Work, 151 days from signing, and fewer than ten days of covered work in the last 91.
- **Costs:**
  - Time: None
  - Money: Commission on covered work: 10% of gross pay, or 5% on an Equity contract paying $525.00 a week or less
- **State (what changes at once):**
  - Accepting makes the agent yours from today. Declining closes the approach.
- **Consumer (what reads it):**
  - Agents And How To Reach One, history: Accepting, declining and the agreement’s end each go in the agent’s History panel.
- **Feedback (how to read what comes back):**
  - A Published Rule follows the unions’ or New York’s published rules. The Game’s Own Term is the game’s: an agent’s own agreement isn’t published.
- **History (kept in the record):**
  - Agents And How To Reach One: Accepting, declining and the agreement’s end each go in the agent’s History panel.
- **Later consequence:**
  - An offer you don’t answer lapses after its two weeks.
  - When it ends, commission stays owed on contracts you made while it ran, and The Agreement says which.
- **Tested by:** `pro.accept_agreement`: `tests/b20-career-effects.test.ts`, `tests/b20-career-saveload.test.ts`, `tests/career-agents.test.ts`, `tests/journey-agent.test.ts`, `tests/journey-career.test.ts`, `tests/pro-representation-screen.test.ts`; `pro.decline_agreement`: `tests/b20-career-effects.test.ts`, `tests/b20-career-history.test.ts`, `tests/journey-agent.test.ts`, `tests/journey-career.test.ts`; `pro.end_agreement`: `tests/journey-agent.test.ts`, `tests/journey-career.test.ts`, `tests/pro-representation-screen.test.ts`

### Your Work And Its Pay (`career.pay`)

- **Action:** , at Career, Work, Your Engagements (`/workspace/career?tab=work`). Opens: From the guide’s chapter “Your Career”. The Work tab lists work once you’ve booked some.
- **Preconditions:**
  - Work you’ve booked. A student film’s pay is deferred: it’s paid only if the film earns money later, and no film in the game does, so it’s listed and never paid.
  - Permission To Work first: Each engagement’s dates are read against your permission to work when you book it.
- **Costs:**
  - Tax: Withheld from each payment as a paycheck’s is: federal income tax, Social Security and Medicare, and the tax of the state the work is in
  - When It’s Paid: The Thursday after each week’s work, as SAG-AFTRA’s rules give it, for all professional work (an estimate)
  - Through Your Agency: Within three business days of the payday, as SAG-AFTRA’s rules give it for TV and film, for stage work too (an estimate)
- **State (what changes at once):**
  - Accepting work puts each payment on the Work tab as promised. Your accounts don’t change yet.
- **Consumer (what reads it):**
  - Your Accounts, scheduled: Each payment lands in your account on its payday, or from your agency’s trust account a few business days later.
  - Your Tax Return, evaluation: Your tax return reads each payment’s wages, withholding, commission, dues and the town the work was done in.
- **Feedback (how to read what comes back):**
  - Estimated, Earned and Due mean it’s owed and not yet paid: its days still to come, worked, or its payday today. Held For You means the production has paid and your agency holds it. Settled gives the figures as they were posted.
  - Deferred pay is shown and never paid: a student film pays its actors only if it earns money later, and no film in the game does.
  - On an F-1 while you’re a student, outside acting work isn’t open to you: Yale grants CPT only for training the whole program requires, and Acting has none. On OPT after your degree, every day from a job’s first day to its last counts as a day with work, and the days before a booked job begins count as days without work. If your permission to work ends with work still booked, the company releases you: the days you worked are still paid, and the rest are called off.
- **History (kept in the record):**
  - (none)
- **Later consequence:**
  - On its payday, unrepresented, the pay less tax and dues goes into your account, and a notice says so.
  - Represented, it goes into your agency’s client trust account, shown in what you’re worth as held for you, and three business days later comes on to your account less commission.
  - Each payment counts on your tax return as wages, with what was withheld, the commission and the dues.
- **Tested by:** a screen or a look; the UI journeys (`tools/acceptance-ui.mjs`)

### Commission (`career.commission`)

- **Action:** , at Career, Work, each payment’s Commission (`/workspace/career?tab=work`). Opens: From the guide’s chapter “Your Career”. Commission is owed only on work you contracted while represented.
- **Preconditions:**
  - An agreement in force when you made the contract, or an offer your agency passed on in its term that you accepted within 60 days after it ended.
- **Costs:**
  - Covered Work: 10% of the gross, the most New York lets an agency take for an engagement
  - Equity: 5% on a weekly salary of $525.00 or less, 10% above it
  - SAG-AFTRA: Only what’s over scale, up to 10%: at scale plus ten percent you keep scale and your agency takes the ten
- **State (what changes at once):**
  - Accepting work shows the commission it will carry, as expected, under each payment.
- **Consumer (what reads it):**
  - Your Work And Its Pay, immediate: Commission comes off your pay as it passes through your agency’s trust account.
  - Your Tax Return, evaluation: The year’s commission counts toward the performing artist’s deduction the return works out.
- **Feedback (how to read what comes back):**
  - No commission: you weren’t represented when you made the contract, or the work isn’t covered, or it pays SAG-AFTRA scale and nothing over it.
  - Commission is part of what your tax return counts as the cost of your work.
- **History (kept in the record):**
  - (none)
- **Later consequence:**
  - When the pay passes through the trust account, the commission comes off it and your account gets the rest, three business days after the payday.
  - After your agreement ends, a contract you made while it ran still carries commission, whoever represents you then.
- **Tested by:** a screen or a look; the UI journeys (`tools/acceptance-ui.mjs`)

### Your Unions (`career.unions`)

- **Action:** `pro.join_sag`, at Career, Work, Your Unions (`/workspace/career?tab=work`). Opens: From the guide’s chapter “Your Career”. Join SAG-AFTRA opens once you’ve worked a SAG-AFTRA principal role.
- **Preconditions:**
  - For Equity: the degree, or a first day of work under an Equity contract.
  - For SAG-AFTRA: a SAG-AFTRA principal role worked, and the fee in your bank.
- **Costs:**
  - Equity’s Initiation Fee: $1,800.00 within three years: $600.00 when you join, then two parts a year apart. The two parts’ dates are estimated
  - Equity’s Dues: $88.00 each May and November, and 2.5% of Equity pay, taken from it. Taking it from the pay is estimated
  - Joining SAG-AFTRA: About $3,244.07: the initiation fee and half a year’s base dues, then half a year’s dues each May and November, and 1.575% of SAG-AFTRA pay. Read from a search engine’s copy of its pages (an estimate)
- **State (what changes at once):**
  - Join SAG-AFTRA takes its fee from your bank and makes you a member today. Your next SAG-AFTRA work takes its working dues.
- **Consumer (what reads it):**
  - Your Accounts, scheduled: Each union bill comes out of your bank on its day.
  - Your Résumé, history: Your résumé lists your unions once you’re a member.
  - Your Tax Return, evaluation: Dues count toward the cost of your work on the year’s return.
- **Feedback (how to read what comes back):**
  - A bill marked owed is a debt: it’s paid off when money comes in.
  - Ultra Low Budget films and student films don’t count toward SAG-AFTRA eligibility in the game.
- **History (kept in the record):**
  - Your Résumé: Your résumé lists your unions once you’re a member.
- **Later consequence:**
  - Each union bill is taken from your bank on its day. If the bank can’t cover it, it’s owed under Bills Owed and paid off the first day there’s money.
  - Union pay has its working dues taken before it reaches you.
- **Tested by:** `pro.join_sag`: `tests/career-contracts.test.ts`, `tests/journey-career.test.ts`, `tests/propay-screen.test.ts`, `tests/propay.test.ts`

### Finding Work And Submitting (`career.opportunities`)

- **Action:** `pro.submit`, at Career, Opportunities, Open Calls (`/workspace/career?tab=opportunities`). Opens: From the guide’s chapter “Finding Work”.
- **Preconditions:**
  - Headshots and a résumé, made on the Portfolio tab, and a reel where the casting office asks for one.
  - A role that takes your own submission, before its window closes.
  - The role’s playing ages, and Equity membership for an Equity open call.
  - Headshots first: A submission starts with your headshots: without them it can’t be sent.
- **Costs:**
  - Time: None: a submission is sent at once
  - Money: None
- **State (what changes at once):**
  - The role moves to In Progress, with what you sent and when each was made.
- **Consumer (what reads it):**
  - Auditions And Callbacks, scheduled: A submission puts the casting office’s answer on the clock, and the answer sets an audition.
- **Feedback (how to read what comes back):**
  - Open Calls are roles you can submit yourself for. Through An Agent shows the roles an agent brought, which only the agent submits.
  - Each role says it’s fictional, or, for a part drawn from a real production, that the part is the game’s own: no real production is casting.
  - A part comes round again only once the work it was cast for is over, as a new casting of the part, and its card says what came of it the last time. A part you’ve been booked for doesn’t come round again.
- **History (kept in the record):**
  - (none)
- **Later consequence:**
  - Two days on, the casting office answers with an audition in person or a self-tape, and a notice says when and where.
- **Tested by:** `pro.submit`: `tests/b20-guide-chapters.test.ts`, `tests/b27-voice-demo.test.ts`, `tests/career-world-sydney.test.ts`, `tests/pro-app.test.ts`, `tests/pro-opportunities-screen.test.ts`, `tests/pro-work.test.ts`

### Auditions And Callbacks (`career.auditions`)

- **Action:** `pro.prepare`, `pro.tape_audition`, `pro.move_audition`, at Career, Opportunities, In Progress (`/workspace/career?tab=opportunities`). Opens: From the guide’s chapter “Finding Work”, once a casting office has answered a submission.
- **Preconditions:**
  - Free for each step’s time, and awake. Rehearsing on your feet needs some of the lines learned and the energy for it.
  - For a self-tape, an hour free before it’s due.
  - For a new time, a day’s notice, asked once.
- **Costs:**
  - Time: 30 minutes to 45 minutes a step; an hour for a self-tape; an audition in person 30 minutes, a chemistry read an hour and a screen test five hours, with the trip each way (an estimate)
  - Money: None
- **State (what changes at once):**
  - A step moves its part of the preparation on and the clock with it. A self-tape is judged at once and kept on your work record.
- **Consumer (what reads it):**
  - Offers And Booked Work, evaluation: Casting reads your audition’s band, with the role’s fit and the field, when it decides whether to offer you the role.
  - The Calendar, scheduled: An audition in person goes on your calendar with its trip, and stops the clock when it comes.
  - Genres reads it, evaluation: Knowing the project’s genres is part of an audition’s and a self-tape’s preparation, complete at 90%, and half of how well casting thinks you suit the role.
- **Feedback (how to read what comes back):**
  - The band says how good the audition was. Casting’s chance reads the band, the fit and the field together, and even the best audition doesn’t make it certain.
  - Why It Went This Way, under a settled role, shows each part of it.
- **History (kept in the record):**
  - (none)
- **Later consequence:**
  - A day after a first audition casting decides whether to call you back, and three days after the last whether to offer you the role. A notice says which.
  - A lead in screen work, and a supporting part in a romance, has a chemistry read after the callback: the sides played in person with the actors already cast, judged above all on how you listen and answer them. A feature’s lead has a screen test after that: the part filmed on set in costume and makeup, take after take. Casting decides after each whether you go on. Either brings a hold on the part’s dates until it’s cast: Offers And Booked Work says what a hold asks of you.
- **Tested by:** `pro.prepare`: `tests/career-awards-screen.test.ts`, `tests/career-awards.test.ts`, `tests/career-workflows-screen.test.ts`, `tests/career-workflows.test.ts`, `tests/journey-career.test.ts`, `tests/pro-work.test.ts`; `pro.tape_audition`: `tests/journey-career.test.ts`, `tests/pro-work.test.ts`; `pro.move_audition`: `tests/pro-work.test.ts`

### Offers And Booked Work (`career.offers`)

- **Action:** `pro.accept_offer`, `pro.decline_offer`, `pro.ask_more`, `pro.ask_hold`, at Career, Opportunities, Offers (`/workspace/career?tab=opportunities`). Opens: From the guide’s chapter “Finding Work”, once casting makes you an offer.
- **Preconditions:**
  - Permission to work in the US for every day of it, as Papers shows it.
  - No other booking on the same days, and in the summer no School call on them.
  - Permission To Work first: An offer can be accepted only where your permission to work covers every one of its days.
- **Costs:**
  - Time: Each work day’s hours, with the trip each way
  - Energy: 8 a work day, as a School rehearsal call takes, on top of its hours awake (an estimate)
  - Money: None: the work pays you
- **State (what changes at once):**
  - The work days go on your calendar, and the pay for each week is promised, due the Thursday after it. It isn’t paid yet.
- **Consumer (what reads it):**
  - Your Résumé, history: The part goes on your professional credits, and your résumé reads as behind until it has it.
  - The Calendar, scheduled: Accepting puts each work day on your calendar, and each stops the clock for you.
  - Auditions And Callbacks reads it, evaluation: Casting reads your audition’s band, with the role’s fit and the field, when it decides whether to offer you the role.
- **Feedback (how to read what comes back):**
  - Promised pay is what the contract owes you, not money you have yet. A student film’s pay is deferred: it’s paid only if the film earns money later, and no film in the game does, so nothing is paid.
- **History (kept in the record):**
  - Your Résumé: The part goes on your professional credits, and your résumé reads as behind until it has it.
- **Later consequence:**
  - Asked for more, the production answers the next afternoon: it raises the offer to what your agent asked, or keeps its offer, and the offer then stands a day past the answer. How your last round went makes a raise likelier, and so does having worked for its casting office.
  - A casting office that cast you before, where your work was Strong or better, may offer you a later part without an audition, never a lead. The offer says why.
  - A production that asks you to a chemistry read or a screen test holds the part’s dates until it’s cast. A hold isn’t a booking and pays nothing; it asks you to keep those days free. Accepting other work on them lets the hold go and withdraws you from the part. Asked to decide first, the production answers the next afternoon: it offers you the part, likelier the better your last round went, or lets the hold go and casts someone else. Once the part is cast or let go, the hold ends.
  - A stage part goes on your credits at its first night; a screen part when it’s shot, and as released once it comes out, when its footage can go on a reel.
  - A finished production isn’t always out on time. Its distributor may hold the release back months, send a film to streaming instead of cinemas, where it has no weekly chart, or shelve it, so it’s never out: the part stays on your credits as shot, its footage can’t go on a reel, and it has no premiere to enter for an award. The notice says which when the release comes due.
  - Sleep through a shoot day, or miss a second day of a run, and the production replaces you. Laid up or in hospital on a lead or a supporting part, the production shoots around you once, slipping your days a working day each, and the day isn’t paid; a smaller part is recast.
- **Tested by:** `pro.accept_offer`: `tests/b20-benefits-safetynet.test.ts`, `tests/b20-benefits-tax.test.ts`, `tests/b20-benefits-unemployment.test.ts`, `tests/b20-career-defects.test.ts`, `tests/b20-career-effects.test.ts`, `tests/b20-career-history.test.ts`, `tests/b20-career-skill.test.ts`, `tests/b20-guide-screens.test.ts`, `tests/b20-life-fatigue.test.ts`, `tests/b20-papers-work.test.ts`, `tests/b21-genre-proof.test.ts`, `tests/b22-authorization.test.ts`, `tests/b27-audience.test.ts`, `tests/b27-holds.test.ts`, `tests/b27-ill.test.ts`, `tests/b27-offers.test.ts`, `tests/b27-promo.test.ts`, `tests/b27-release.test.ts`, `tests/b27-reshoot.test.ts`, `tests/b27-revival.test.ts`, `tests/b27-slate-screens.test.ts`, `tests/b27-slate.test.ts`, `tests/b27-weather.test.ts`, `tests/career-awards-screen.test.ts`, `tests/career-awards.test.ts`, `tests/career-contracts.test.ts`, `tests/career-drawn.test.ts`, `tests/career-workflows-screen.test.ts`, `tests/career-workflows.test.ts`, `tests/career-world-sydney.test.ts`, `tests/pro-opportunities-screen.test.ts`, `tests/pro-work.test.ts`; `pro.decline_offer`: `tests/b20-career-effects.test.ts`, `tests/b20-career-history.test.ts`, `tests/b20-guide-screens.test.ts`, `tests/pro-work.test.ts`; `pro.ask_more`: `tests/b27-award-effects.test.ts`, `tests/b27-offers.test.ts`; `pro.ask_hold`: `tests/b27-holds.test.ts`

### Work While You’re At The School (`career.outside-work`)

- **Action:** `pro.request_outside_work`, at Career, Opportunities, Open Calls (`/workspace/career?tab=opportunities`). Opens: From the guide’s chapter “Finding Work”, while you’re a student and a role’s days fall in term.
- **Preconditions:**
  - Good standing at the School.
  - A role whose days fall in term, not settled yet.
  - Permission to work outside the School: on an F-1, there’s none while you’re a student.
  - Offers And Booked Work first: An offer in term is accepted on the School’s approval, or against it with the warning said first.
- **Costs:**
  - Time: An hour to talk to the chair and write the proposal (an estimate)
  - Money: None
- **State (what changes at once):**
  - The request is with the chair and the dean, and the role says when the dean decides.
- **Consumer (what reads it):**
  - Your Standing And Classes, immediate: Work in term without approval moves your standing to academic warning, and a second time to dismissal.
- **Feedback (how to read what comes back):**
  - The School’s rule is the Bulletin’s. The fourteen days, ten working days and two class days, and the dean’s week, are the game’s estimates of its words.
- **History (kept in the record):**
  - (none)
- **Later consequence:**
  - A week on, the dean approves or refuses it, and the notice says each condition. Approved, the class days it takes are excused.
- **Tested by:** `pro.request_outside_work`: `tests/pro-work.test.ts`

### Contracts, Residuals And A Series’ Seasons (`career.contracts`)

- **Action:** `pro.ask_pay`, at Career, Work, The Contract (`/workspace/career?tab=work`). Opens: From the guide’s chapter “Finding Work”, once you’ve accepted work.
- **Preconditions:**
  - Work you’ve accepted. Ask About It needs a payment past its payday and still unpaid.
  - Offers And Booked Work first: Accepting an offer makes its contract.
  - Your Unions first: A further episode or an option taken up past SAG-AFTRA’s thirty days needs you to be a member.
- **Costs:**
  - Overtime: On a SAG-AFTRA day, the ninth and tenth hours of work at time and one-half: $481.13 a day on the $1,283 minimum
  - Pension And Health: The producer pays 20.5% of SAG-AFTRA pay on top of it, 19.5% before September 6, 2026. Your pay keeps all of it
  - Per Diem: $60.00 a day for meals on a trip for SAG-AFTRA work, paid when you’re home, apart from your wages
  - A Rerun: All your pay for the time you worked, overtime at straight time, up to $3,668.00 for an hour’s program or $2,578.00 for a half-hour’s, paid within 30 days
- **State (what changes at once):**
  - Accepting puts the contract under The Contract and each payment under Pay as Estimated. Your accounts don’t change.
- **Consumer (what reads it):**
  - Your Work And Its Pay, scheduled: Each payment the contract promised is paid on its payday, and its state says where it stands.
- **Feedback (how to read what comes back):**
  - The overtime, the contribution’s rates, the per diem and the rerun’s share and ceiling are SAG-AFTRA’s agreements’ own, as AMPTP publishes them. The eleven-hour shoot day’s hour for lunch is estimated.
  - When an episode is on the air, whether it’s rerun, the series’ seasons and how late a non-union producer pays, 3 times in ten, by one to four weeks, are the game’s own.
  - A renewal brings no contract by itself: a part in a renewed series comes only through its option or a new casting.
- **History (kept in the record):**
  - (none)
- **Later consequence:**
  - Each payment moves to Earned, Due and Settled as its days and its payday come.
  - Television work under SAG-AFTRA carries residuals: its first telecast is paid for by your pay, and a network rerun in prime time pays again, within 30 days of it.
  - The Calloway Files shoots each season from mid-July to May. From May 2030 the network says each May whether there’s another season. A canceled series stops that day: casting for it closes, and work not yet done is called off with nothing owed. It can come back years later. When it does, its producers say before the new season whether a part you played comes back: a recurring part about six times in ten and a single episode’s about one in four, less the longer it was off. Wanted back, you’re offered the part without an audition, a new contract for the new season; not wanted, the part isn’t offered to you in it.
  - A recurring part guarantees some episodes and is expected in more: a further episode is paid only if the production calls you for it. The option on the next season, at 5% more a day, is taken up or let go by June 30, once.
- **Tested by:** `pro.ask_pay`: `tests/career-contracts.test.ts`

### How Each Kind Of Work Is Done (`career.workflows`)

- **Action:** `pro.work_choice`, at Career, Work, How The Work Is Done (`/workspace/career?tab=work`). Opens: From the guide’s chapter “Finding Work”, once you’ve accepted work.
- **Preconditions:**
  - Work you’ve accepted. A choice about the intimate scene can’t be changed once the scene is shot.
  - Contracts, Residuals And A Series’ Seasons first: The agreements’ rules for a dub, a stunt, an intimate scene and a recall to loop are in the contract.
- **Costs:**
  - Another Take: Energy for the takes you ask for beyond the scene’s own, as many as the production allows in a day
  - A Strained Voice: Voice work raises it and rest eases it, 2 points of 100 an hour. A strained voice holds back what voice work asks of it (an estimate)
  - A Stunt Yourself: A chance of an injury, about 3% for a stunt with the fight rehearsed and up to 15% without, less for a strong body; the double carries none of it (an estimate)
- **State (what changes at once):**
  - A choice is kept on the engagement and read by each day after it.
- **Consumer (what reads it):**
  - Your Work And Its Pay, scheduled: A looping session is paid half a day, on the work’s pay.
  - Charts, Festivals And Awards reads it, evaluation: How a part’s days were judged, and its scenes kept in the edit, are what its entry reads.
- **Feedback (how to read what comes back):**
  - A dub’s pay by its characters and lines, a recall to loop at half a day for four hours, a stunt only with your consent and a coordinator there, an intimate scene only with your written consent, and a promotional film’s day performer’s minimum for work paid less than $25,000 are the SAG-AFTRA agreements’ rules. The takes, the strain, the stunt’s risk and how often pages change are the game’s.
  - There are 10 ways of working in the game: a stage play, single camera, multicamera, the booth, dubbing, performance capture, narration, reenactment, a musical and action.
  - Declining an intimate scene costs you nothing: a body double does it, and the part, the pay and the casting are as they were.
- **History (kept in the record):**
  - (none)
- **Later consequence:**
  - Each judged day plays its scenes, loops, chapters or sequences in takes, the best printed, and leaves a report.
  - Pages revised the night before change some of your lines, and Learn The Lines that evening puts them back.
  - A day out on location is called off the evening before when the forecast where it shoots is thunderstorms, fog, or wind of 40 km/h or more: your days from it slip a working day each, and your flight home with them. A shower is shot through. A SAG-AFTRA day performer is paid the day off; other work pays the days you work. If another booking is in the way, the production shoots that day’s scenes without you, and they’re cut from your part. A studio, a booth, a stage play and a capture stage never stop for the weather.
  - After a screen wrap, the production may recall you to loop: a four-hour session paid half a day. When the work comes out, the edit may cut one of your scenes, about 2 times in ten; the part stays on your credits with its pay.
  - About 2 times in ten, a feature calls you back to reshoot your weakest scenes, a day on its set paid a day, if it was shot within reach of home; a voice part calls you back for a pickup session, four hours in a booth near you. The better take of each is kept. Miss it, and another actor does them, and they’re cut from your part.
  - Around the release, a lead’s production calls you to a promotional film about it about three times in four, and a supporting part’s about one time in three: three hours at a studio near you, on a weekday clear of your other work. Under SAG-AFTRA, work paid less than $25,000 pays a day performer’s minimum for it; otherwise it’s unpaid. Being there makes casting a little likelier to choose you for a while. Miss it, and it’s made without you, and that production’s casting office won’t come straight to you with a part on the strength of that one.
- **Tested by:** `pro.work_choice`: `tests/career-workflows-screen.test.ts`, `tests/career-workflows.test.ts`

### Charts, Festivals And Awards (`career.awards`)

- **Action:** `pro.award_enter`, `pro.watch_ceremony`, `pro.actor_submit`, `pro.ceremony_rsvp`, `pro.ceremony_prepare`, `pro.ceremony_accept`, at Career, Charts And Awards (`/workspace/career?tab=industry`). Opens: From the guide’s chapter “Finding Work”, once you’ve accepted work.
- **Preconditions:**
  - A part on television that’s on the air, or due on it, in the Emmy year: June 1 to May 31.
  - For the Actor Awards, a part in a film or a television program made under a SAG-AFTRA agreement, first shown in the calendar year.
- **Costs:**
  - An Emmy Entry: $125.00 for processing and $100.00 for the entry, the Television Academy’s fees for a performer who isn’t a member
  - An Actor Awards Submission: $200.00 a performance, the guild’s fee
  - Going To The Show: The days of the trip, out ahead and home the morning after; the trip isn’t charged to you
  - Preparing Remarks: 60 minutes each time, each going further the less is left (an estimate)
- **State (what changes at once):**
  - Entering puts the part under Your Recognition as entered, and the fee is taken from your bank.
- **Consumer (what reads it):**
  - How Each Kind Of Work Is Done, evaluation: How a part’s days were judged, and its scenes kept in the edit, are what its entry reads.
- **Feedback (how to read what comes back):**
  - The eligibility year, the fees, the guest rule, the share of the running time and the nomination table are the 78th Emmy Awards’ rules. Sundance’s categories, deadlines and premiere rule are its 2027 festival’s. A later year carries them forward, and says so.
  - The Actor Awards’ eligibility, categories, fee, window, committees, nominee count and final vote are its 33rd Rules & Regulations’. Its show is held in Los Angeles in the game, as its last was, and so are the Emmys’; neither’s rules name a place.
  - How many enter a category, how the votes go, whether a production enters you or submits its film, and whether the festival selects it are the game’s, and no other nominee is ever named. So are a speech’s weights and the week to say whether you’ll go.
  - An agent’s office reads your recognition as a step up in your work, once, however much of it there is. A production you ask for more is likelier to agree by half your visibility, which fades as recognition does.
  - A film’s box office is the production’s, not your pay, and how well your part went doesn’t move it. The published charts are the providers’ own figures, each in its own unit and week.
  - A series’ season audience is the game’s estimate, in viewers an episode for a broadcast series and hours viewed a week for a streaming one, never one as the other. The network reads it, with the season’s reviews and how long the series has run, when it says whether there’s another season: a big audience makes another likelier, never certain.
  - Recognition makes casting a little likelier to choose you, fading over three years, and at most 30% better; so, a little, does a promotional film you appeared in for a release. Neither changes a contract or how your work is judged.
- **History (kept in the record):**
  - (none)
- **Later consequence:**
  - At the nominations, each category has its own field of entries, and the Academy’s table sets how many are nominated: 5 from 20 entries, 6 from 81 entries, 7 from 161 entries, 8 from 241 entries.
  - The winner is settled when the final round of voting ends, and you learn it when the award is presented: guest and voice-over awards at the Creative Arts Emmys, the others at the telecast.
  - A festival’s answer comes about December 1 for its 2027 festival, in Boulder, Colorado.
  - The Actor Awards’ committees, members drawn at random, nominate five in each category, more only for a tie, and of two performances of yours in one category only the one with more votes. Every paid-up member in the US and Canada votes the winner, and a tie gives the award to each tied. The 33rd show is on February 28.
  - At the show, losing changes nothing but the record. Winning in the room, you go up; not going up within half an hour, you say thank you and sit down. Watched from home, a win is accepted without you.
- **Tested by:** `pro.award_enter`: `tests/career-awards-screen.test.ts`, `tests/career-awards.test.ts`; `pro.watch_ceremony`: `tests/b27-ceremony.test.ts`, `tests/career-awards-screen.test.ts`, `tests/career-awards.test.ts`; `pro.actor_submit`: `tests/b27-actor-awards.test.ts`; `pro.ceremony_rsvp`: `tests/b27-ceremony.test.ts`; `pro.ceremony_prepare`: `tests/b27-ceremony.test.ts`; `pro.ceremony_accept`: `tests/b27-ceremony.test.ts`

### Productions And People (`career.reference`)

- **Action:** `ui.career-reference`, at Career, Productions And People (`/workspace/career?tab=reference`). Opens: From the guide’s chapter “Your Career”.
- **Preconditions:**
  - Its chapter in the guide, read.
- **Costs:**
  - Time: None: reading it moves no clock
  - Money: None
- **State (what changes at once):**
  - Reading a page changes nothing: no clock moves and nothing is sent.
- **Consumer (what reads it):**
  - (none)
- **Feedback (how to read what comes back):**
  - A real production’s page holds only what its official pages said on the day the game read them, never all of its work, and says where they didn’t say.
  - A part shows only once it’s been posted to you, and a page shows only your part, never who else is being cast. A part the game drew from a real production is the game’s own, and its page says so.
  - A release held back or shelved shows once you’ve been told, a season’s audience once the season has finished, and a network’s word once it’s said.
  - A real person named on a production’s pages is only that: nothing between you and them happens in the game.
- **History (kept in the record):**
  - (none)
- **Later consequence:**
  - A page grows as your career does: a part posted to you adds its project, a finished season its audience, a network’s word itself, and an ended chart week its figure.
- **Tested by:** a screen or a look; the UI journeys (`tools/acceptance-ui.mjs`)

### Work Abroad (`career.work-abroad`)

- **Action:** `pro.apply_work_visa`, at Career, Work, Your Engagements (`/workspace/career?tab=work`). Opens: From the guide’s chapter “Finding Work”, once you’ve accepted work in another country.
- **Preconditions:**
  - A booking in another country whose rules are in the game: so far, Australia and the United Kingdom.
  - A passport in force until you’re home. Papers shows yours.
  - A visa or an ETA only where you need one: in Australia an Australian needs no visa and a New Zealander is granted one on arrival, and in the UK an Irish citizen needs nothing.
  - Offers And Booked Work first: You apply for it once you’ve accepted the work abroad.
- **Costs:**
  - Time: 10 days for Australia’s decision, a day for a UK ETA, about three weeks for the Creative Worker visa (an estimate)
  - Money: In Australia none: the visa’s charge isn’t in the department’s page. In the UK, £20.00 for an ETA or £340.00 for the Creative Worker visa, from your bank. The production pays for the trip. (an estimate)
- **State (what changes at once):**
  - The visa is pending in Papers, under Permission To Work, tied to this work.
- **Consumer (what reads it):**
  - Permission To Work, immediate: The visa is a permission to work in Papers, pending until the department decides.
- **Feedback (how to read what comes back):**
  - The 408’s conditions come from the department’s page: the game read it on October 23, 2026, last updated September 24, 2026. Its 10 days and the hotel paid by the production are estimated, and so are the flight times, from the distances.
  - The UK’s routes come from GOV.UK’s pages: the game read it on October 24, 2026, last updated September 9, 2026. The ETA’s decision the next day is estimated from its page’s “usually within a day”.
- **History (kept in the record):**
  - (none)
- **Later consequence:**
  - 10 days on, the department grants it, to 28 days after your last work day. At the first flight, without it, you don’t go, and the production releases you with nothing owed.
  - In the UK an ETA is decided the next day and lasts two years or to your passport’s end; the Creative Worker visa in about three weeks, to 28 days after your last work day.
- **Tested by:** `pro.apply_work_visa`: `tests/b27-slate-screens.test.ts`, `tests/career-world-sydney.test.ts`
