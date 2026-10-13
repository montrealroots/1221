# Every Touched Feature, Traced

Written by `tools/trace.ts` from the guide's registry and the tests; don't edit it by hand. 27 entries in the four
areas the connected-journey pass of 2026-10-12 rebuilt, each traced Action → Preconditions → Costs → State → Consumer →
Feedback → History → Later consequence. The words are the guide's own, which carry the rules' figures; every entry's
claims were checked against the engine by a second reader when it was written.

**Unconsumed** (a row nothing reads): none.
**Read Only** (screens and looks, changing nothing): `start.home`, `start.find`, `productions.casting`, `productions.nights`, `craft.profile`, `craft.work`, `craft.identity`.
**Untested** (a command no test drives): none.

## Getting Started

Where you are, the guide itself, and how to find anything.

### Home And Where You Are (`start.home`)

- **Action:** `ui.where`, `look.day`, `look.place`, `look.region`, `look.country`, `look.currency`, `look.season`, `look.daylight`, at Home, The Where You Are Panel (`/home`). Opens: From the guide’s first chapter, “Your Life, Hour By Hour”.
- **Preconditions:**
  - Home is always there, from the first moment of a life.
  - The Guide And This Help first: Each underlined word opens once the guide’s chapter for it has been read.
- **Costs:**
  - Time: None: reading Home and opening words moves no clock
  - Money: None
- **State (what changes at once):**
  - The world stays as it was: Home and its words show it, they don’t move it.
- **Consumer (what reads it):**
  - The Clock: Play And Pause, immediate: The local time shown is the clock’s moment, so it moves as the clock does.
- **Feedback (how to read what comes back):**
  - The line under the town says whether you’re home or away, and how far from home time.
  - A word that isn’t underlined yet opens once its chapter of the guide has been read.
- **History (kept in the record):**
  - (none)
- **Later consequence:**
  - As the clock moves the time, the season and the daylight move with it.
- **Tested by:** a screen or a look; the UI journeys (`tools/acceptance-ui.mjs`)

### The Guide And This Help (`start.guide`)

- **Action:** `tutorial.read`, at The top bar’s Guide button; How This Works on every panel; ? or / anywhere (`/home`). Opens: Always.
- **Preconditions:**
  - The guide is always there. A life made with “I Know SLATE” at its creation has every part open from the start, and the chapters are there to read in any order.
  - The Clock: Play And Pause first: The clock starts paused on a guided life, and “The Clock” opens Play.
- **Costs:**
  - Time: None: the clock holds while a chapter or an entry is open
  - Money: None
- **State (what changes at once):**
  - Reading a chapter opens what it names: its buttons, its panels and its underlined words.
  - Opening the reference changes nothing.
- **Consumer (what reads it):**
  - Home And Where You Are, immediate: Reading a chapter opens Home’s panels and the underlined words it names.
  - The Calendar, immediate: “What’s Coming” opens the calendar and the dialog that asks when something wants you.
- **Feedback (how to read what comes back):**
  - Locked on a button means its chapter hasn’t been read; pressing it opens the guide at that chapter.
  - In an entry, an estimate is marked as one; every other figure is the rule the game runs on.
- **History (kept in the record):**
  - (none)
- **Later consequence:**
  - What a chapter opens stays open for the rest of the life.
- **Tested by:** `tutorial.read`: `tests/defects-g3-1.test.ts`, `tests/defects-r8-1.test.ts`, `tests/guide-examples-craft.test.ts`, `tests/trace-commands.test.ts`

### Finding Your Way (`start.find`)

- **Action:** , at The Menu Down The Left, The Breadcrumbs, The Browser’s Address (`/home`). Opens: Always; a destination joins the menu once its chapter is read.
- **Preconditions:**
  - A screen whose chapter hasn’t been read opens as Locked, with the chapter that opens it.
  - The Guide And This Help first: A place joins the menu once its chapter is read.
- **Costs:**
  - Time: None
  - Money: None
- **State (what changes at once):**
  - Moving between screens changes nothing in the world. A screen keeps its tab while you’re elsewhere.
- **Consumer (what reads it):**
  - (none)
- **Feedback (how to read what comes back):**
  - The number beside Home is the notices and questions waiting in What Needs You.
- **History (kept in the record):**
  - (none)
- **Later consequence:**
  - (none)
- **Tested by:** a screen or a look; the UI journeys (`tools/acceptance-ui.mjs`)

## Coursework And Partners

Preparing scenes, table work, partners, feedback and notes, and rehearsing a problem through.

### Preparing Coursework (`coursework.prepare`)

- **Action:** `school.prepare`, `look.assignment`, at School, Coursework, Each Piece Of Work Set (`/workspace/school?tab=coursework`). Opens: From the guide’s chapter “Drama School”, once a course has set work: at one of its meetings, or for the first-year fall courses at orientation’s session on the courses.
- **Preconditions:**
  - Work set and open. A course sets its next piece at a meeting when none of its own is open and the term still holds the meeting it would be due at.
  - What a step builds on: Learn Lines needs the scene read to 30%, and Rehearse Alone the lines learned to 25%.
  - A step in a studio or on your feet: energy of 25 or more and no injury that stops training. A studio or the library also needs New Haven and orientation’s tour behind you.
  - New feedback on the piece read, and anything your partner has asked about it answered.
  - Free for the step’s length: at nothing else, and due at nothing before it would end. Learn Lines is checked for the scene’s own length, 45, 75 or 105 minutes, the time it takes.
  - Orientation Week first: The tour opens the studios and the library to your steps, and the session on the courses sets the first-year fall’s first work.
- **Costs:**
  - Time: Each step its own. In Scene Study: Read The Scene, 40 minutes; Learn Lines, 45, 75 or 105 by the scene’s length; Rehearse Alone, 60; Work On The Note, 60; Rehearse With Your Partner, a rehearsal of 90 minutes agreed with them (an estimate)
  - Money: None
  - Your Body: Desk work counts as activity at 1.5 METs, a step that needs a studio or your feet at 2.5. Rehearse Alone is on your feet, so it counts at the higher figure (an estimate)
- **State (what changes at once):**
  - The clock moves on by the step’s minutes, and its part rises by its share of what’s left. A part at 97% or more has nothing more to gain from it.
  - A step that trains a skill trains it at 25% of a class meeting’s weight, for at most 3 such steps on one piece.
  - While it still moves the work, a step practices the ability it calls on: knowing the scene your focus, lines your memory, a step at the table your imagination, a note your adaptability.
  - A step of rehearsal, Rehearse Alone and the steps like it, rehearses in the way you chose to play the scene, where you chose one. A daily step counts once a day.
- **Consumer (what reads it):**
  - How You’ll Play A Scene, immediate: Each step of rehearsal rehearses in the way you chose to play the scene.
  - The Player Profile, immediate: A step trains its skill for up to 3 steps a piece, and practices the ability it calls on.
  - Feedback And Your Notes, scheduled: At the meeting it’s due, the preparation is read and the showing gives its band and its note.
  - Your Standing And Classes, evaluation: The term’s evaluation reads each piece’s band: with 3 or more due, 50% unready or not shown falls short.
  - How You Are, evaluation: Readiness sets how far each step moves its part, and your condition at the meeting is read in the showing.
  - Your Work So Far, history: Each showing is kept on your record, where Your Work So Far reads your strengths and what keeps holding you back.
- **Feedback (how to read what comes back):**
  - A part’s figure is how far it’s prepared. Weighs is its share when the showing chooses its note; the result reads the parts through the dimensions they bear on. Put First’s part weighs more in both, and the line beside it says why it was chosen.
  - At 90% a part is complete for the showing.
  - A scene you’ve worked before says so, and asks for the other part, or for another reading at the table.
  - Work Shown keeps the last twelve pieces and how each went: its band, or “Not Shown”, “Excused, Not Shown” or “Lapsed At Term’s End”.
- **History (kept in the record):**
  - Your Work So Far: Each showing is kept on your record, where Your Work So Far reads your strengths and what keeps holding you back.
- **Later consequence:**
  - At nine on the day it’s due the course meets, and the work is shown once in place of the meeting’s ordinary growth: the course’s skills grow 85% of an ordinary meeting’s for Unready, 100% for Working, 110% for Strong and 120% for Exceptional.
  - Away with an excuse (called in sick, in hospital or laid up), it moves to the course’s next meeting, or is excused if none is left. Away without one, it’s Not Shown and never taken later; it counts as unready at the term’s evaluation, and a partner’s trust falls 12.
  - At the term’s evaluation, with 3 or more pieces due, 50% or more of them unready or not shown falls short, and 50% or more Strong or better is noted.
  - Work a course revises comes back to be shown again at its next meeting, with the note to take; work in rounds is shown a round at a time. Work still open when the term’s classes end lapses.
- **Tested by:** `school.prepare`: `tests/approaches.test.ts`, `tests/defects-g10-1.test.ts`, `tests/defects-g28-1.test.ts`, `tests/defects-g8-10.test.ts`, `tests/defects-g8-9.test.ts`, `tests/guide-examples-coursework.test.ts`, `tests/journey-school-year.test.ts`, `tests/journey-three-students.test.ts`, `tests/mastery-integration.test.ts`, `tests/partners.test.ts`, `tests/school-journey-gaps.test.ts`, `tests/trace-commands.test.ts`, `tests/traits-connected.test.ts`

### Table Work (`coursework.table`)

- **Action:** `school.choose`, at School, Coursework, Table Work On A Scene (`/workspace/school?tab=coursework`). Opens: From the guide’s chapter “Drama School”, on any open piece with a scene and a part of yours in it, once the scene is read to 30%.
- **Preconditions:**
  - The scene read to 30%: table work is done on a text you know.
  - A piece with a scene and your part in it, still open.
  - 10 minutes free.
  - Preparing Coursework first: The scene read to 30% with Read The Scene opens the questions.
- **Costs:**
  - Time: 10 minutes a question, and 10 more for each answer changed (an estimate)
  - Money: None
- **State (what changes at once):**
  - The answer is kept, and the clock moves on 10 minutes.
  - The table work’s figure on the panel moves with it.
- **Consumer (what reads it):**
  - Your Class, scheduled: A partner may come to class with another reading of a question you’ve answered, and ask you to keep yours, take theirs or try both.
  - Feedback And Your Notes, evaluation: The showing reads your answers as the table work, and a reading the text cuts against can be its note.
  - Rehearsing With A Partner, evaluation: A reading held apart from your partner’s leaves the scene together at 90% agreement until both are tried.
- **Feedback (how to read what comes back):**
  - The figure under the course’s name for it (Table Work in Scene Study, Scansion And Table Work in Heightened Text Scene) is the table work as the showing will read it.
  - After the showing, “What it rests on” marks a supported reading, and “What cuts against it” one the text doesn’t bear.
  - For a scene that came back, “Your reading differs from last time’s.” or “Your reading is last time’s so far.” says whether it’s another reading yet.
  - Which readings the text supports is SLATE’s reading of each play, written to be checked against it.
- **History (kept in the record):**
  - (none)
- **Later consequence:**
  - In class, your partner may read one of your answered questions another way, and ask: Keep Your Reading, Try Theirs and Try Both Next Rehearsal.
  - At the showing, the table work is read as one part of the preparation by each dimension it bears on, a dimension held back by the least prepared of its parts; its weight only chooses the note.
  - A note on a reading is taken when the work is shown again with an answer the text supports.
  - A scene you come back to that asks for another reading reads your answers against last time’s.
- **Tested by:** `school.choose`: `tests/defects-g8-9.test.ts`, `tests/guide-examples-coursework.test.ts`, `tests/journey-school-year.test.ts`, `tests/journey-three-students.test.ts`

### How You’ll Play A Scene (`coursework.playing`)

- **Action:** `school.choose_playing`, at School, Coursework, How You’ll Play It (`/workspace/school?tab=coursework`). Opens: From the guide’s chapter “Drama School”, on any open piece with a scene in it.
- **Preconditions:**
  - An open piece with a scene in it: work with no scene has nothing to play one way or another.
  - A choice different from the one standing: the button stays gray until it is.
  - Preparing Coursework first: A choice counts once it’s rehearsed in, and the steps of rehearsal, Rehearse Alone among them, are what rehearse it in, with the rehearsals kept with your partner.
- **Costs:**
  - Time: None to choose; it’s rehearsed in by the steps of rehearsal and the rehearsals kept with your partner
  - Money: None
  - A Change Of Mind: Keeps 50% of what was rehearsed in (an estimate)
- **State (what changes at once):**
  - “Chosen: rehearsed in to …%.” A first choice starts at 0%; the same choice again keeps all of it; a different one keeps 50%.
  - Leaving every axis open takes the choice away.
  - The sides chosen are kept on your record of how you play.
- **Consumer (what reads it):**
  - Rehearsing With A Partner, scheduled: A rehearsal kept with your partner rehearses the choice in too, as a step of rehearsal does.
  - Feedback And Your Notes, evaluation: The showing reads the choice: its lean, the abilities it draws on, and how far it’s rehearsed in.
  - Your Work So Far, history: Every side chosen and shown is kept, and Your Work So Far names one you choose most of the time.
- **Feedback (how to read what comes back):**
  - Fully Prepared is the expected result with no draw, every part complete and a good day: what the choice can reach, not where the work stands now.
  - “Doesn’t fit:” under a side says the scene doesn’t take it, and why.
  - “Your choice now is rehearsed in to …% (complete at 90%)” is how far along it is.
  - With nothing chosen, the work is read by its own genre and material alone.
- **History (kept in the record):**
  - Your Work So Far: Every side chosen and shown is kept, and Your Work So Far names one you choose most of the time.
- **Later consequence:**
  - Each step of rehearsal rehearses it in by 90% of that step’s own share, of what’s left, and keeps doing so after its own part is complete, until the choice reaches 90%. A rehearsal kept with your partner does the same, by 90% of its own share.
  - The showing reads it with the rest of the preparation, and Your Work So Far names a side you choose most of the time as a habit.
- **Tested by:** `school.choose_playing`: `tests/defects-g8-10.test.ts`, `tests/defects-g8-15.test.ts`, `tests/guide-examples-coursework.test.ts`, `tests/trace-commands.test.ts`

### Feedback And Your Notes (`coursework.feedback`)

- **Action:** `school.read_feedback`, at School, Coursework, Feedback, Work Shown And Your Notes (`/workspace/school?tab=coursework`). Opens: From the guide’s chapter “Drama School”, once a piece has been shown.
- **Preconditions:**
  - A piece shown. Mark As Read needs new feedback on a piece still open.
- **Costs:**
  - Time: None: reading it moves no clock
  - Money: None
- **State (what changes at once):**
  - Mark As Read marks it read, and the steps on the piece open again.
- **Consumer (what reads it):**
  - Another Way At A Note, immediate: A note open and given 3 times, on a part a piece prepares, opens another way at it on that piece.
  - Preparing Coursework, scheduled: Work the course revises comes back open, due at its next meeting, with the note to take.
  - The Player Profile, immediate: The band sets what the meeting grows the course’s skills by, 85% of an ordinary meeting for Unready to 120% for Exceptional.
  - Your Standing And Classes, evaluation: The term’s evaluation counts the bands: with 3 or more pieces due, 50% or more unready or not shown falls short.
  - Rehearsing With A Partner, evaluation: Under a paired piece, the scene together reads your partner’s preparation, timing, readings and any slip, apart from your band.
  - Your Work So Far, history: Each showing is on the record, and a note still open after 3 times shows in Your Work So Far as one that keeps coming back.
  - Your Standing And Classes reads it, evaluation: The term’s coursework, as shown, is read at the evaluation: with 3 or more pieces due, 50% or more unready or not shown falls short.
  - Table Work reads it, evaluation: The showing reads your answers as the table work, and a reading the text cuts against can be its note.
  - How You’ll Play A Scene reads it, evaluation: The showing reads the choice: its lean, the abilities it draws on, and how far it’s rehearsed in.
  - Rehearsing With A Partner reads it, evaluation: The showing’s scene together reads their preparation, timing, agreement and reliability, apart from your band.
  - Working A Problem Through reads it, evaluation: The showing reads the scene with each part’s own work and every discovery kept.
  - The Director’s Notes reads it, history: Notes still open when the run closes go into the coursework’s ledger, and the next work can ask for them.
  - The Nights reads it, history: At the closing, the notes still open go into the coursework’s ledger for the next work.
- **Feedback (how to read what comes back):**
  - The heading reads “Feedback:”, the band, the score of 100 and the kind of note: A New Note, Still There, Better, Not Yet, or The Next Step.
  - Still There names the day it was last given and the course; Better, Not Yet gives the figure then and now.
  - “It didn’t come together today:” on work with its preparation in place says what held it back on the day, the condition or the craft, before the next step.
  - The Scene Together, under a paired piece, is the scene with your partner’s part in it. The band is your own work.
  - Your Notes leaves out the steps beyond the work, and lists open notes first.
- **History (kept in the record):**
  - Your Work So Far: Each showing is on the record, and a note still open after 3 times shows in Your Work So Far as one that keeps coming back.
- **Later consequence:**
  - Work a course revises is shown again at its next meeting. Taken, that meeting grows your craft 110% of an ordinary one; not yet, 95%. Its second band stands for the term.
  - A note open and given three times opens another way at it on any open piece that prepares its part. Given more often still, its notice says “Still There:”, at most once in 7 days.
  - Work in rounds is shown a round at a time, each reading its own parts; a note on a part is taken at a later round that reads that part.
  - The term’s evaluation reads each piece’s band, the second for one shown again. Not there to show it again, without an excuse, it counts as unready.
- **Tested by:** `school.read_feedback`: `tests/classmate-moments.test.ts`, `tests/guide-examples-coursework.test.ts`, `tests/journey-school-year.test.ts`, `tests/journey-three-students.test.ts`

### Another Way At A Note (`coursework.approach`)

- **Action:** `school.approach`, at School, Coursework, A Note That Keeps Coming Back (`/workspace/school?tab=coursework`). Opens: From the guide’s chapter “Drama School”, on an open piece, once a note on a part it prepares has been given 3 times and is still open.
- **Preconditions:**
  - A note open and given 3 or more times, on a part this piece prepares; a note on a reading counts as one on the table work.
  - The piece open, with no way chosen for it yet.
  - For Put It First, a part this work can put first. For Work On It With Your Partner, a partner still willing to work with you, on a note other than the work with your partner.
  - For A Targeted Drill or Work On It With Your Partner on the table work, a piece with a step of its own at the table, or with no scene: on Scene Study and the courses read like it the table work is your answers alone, and neither moves them.
  - Feedback And Your Notes first: It opens once a note has been given 3 times on the same part and is still open.
- **Costs:**
  - Time: None to choose. A Targeted Drill adds a step of 30 minutes, once a day (an estimate)
  - Money: None
- **State (what changes at once):**
  - The way is kept on the piece, with the note it’s for and the day, and the panel reads “Another Way At It:” and what it does.
  - A Targeted Drill: a new step on the panel, named for the part.
  - Put It First: Put First changes to that part, and its Weighs rises.
- **Consumer (what reads it):**
  - Preparing Coursework, immediate: A Targeted Drill adds a step to the piece, and Put It First changes what it weighs.
  - Rehearsing With A Partner, scheduled: Work On It With Your Partner works the part at the next rehearsal kept with your partner.
  - Your Standing And Classes, evaluation: A Smaller Piece Of It caps the band at Working, and the term’s evaluation counts a Working piece as neither unready nor strong.
- **Feedback (how to read what comes back):**
  - The note it’s for is the one given most often among those the piece can help.
  - “It doesn’t take the note by itself.” means the part still has to stand high enough when it’s shown.
  - Grayed, each way gives its reason under the buttons.
- **History (kept in the record):**
  - (none)
- **Later consequence:**
  - At the showing, a part a note named, at 75% or more, takes the note, however it got there.
  - A Smaller Piece Of It: shown as no better than Working, since less was shown.
  - Work On It With Your Partner: worked once, at the next rehearsal kept.
- **Tested by:** `school.approach`: `tests/approaches.test.ts`, `tests/defects-g8-10.test.ts`, `tests/defects-g8-9.test.ts`, `tests/guide-examples-coursework.test.ts`, `tests/journey-three-students.test.ts`

### Rehearsing With A Partner (`coursework.partners`)

- **Action:** `school.ask_partner`, `school.answer_partner`, `school.cancel_rehearsal`, `look.classmate`, at School, Coursework, Rehearsing With Your Partner (`/workspace/school?tab=coursework`). Opens: From the guide’s chapter “Drama School”, on paired work, once you’ve met your partner at orientation or in class.
- **Preconditions:**
  - Paired work, open, and the partner met: at orientation’s Meeting Your Class, or your first class.
  - A time at least 2 hours ahead, ending before nine on the day it’s due, with nothing else of yours then.
  - For a yes, the partner free then, trusting you enough, and asked a day ahead where they’ve set a boundary.
  - Orientation Week first: A partner you haven’t met can’t be asked; Meeting Your Class, or the first class, meets them.
- **Costs:**
  - Time: 90 minutes on your feet in New Haven, at the time agreed (an estimate)
  - Money: None
  - Their Trust: Starts at 50 of 100. A rehearsal kept, up 4; missed by you, down 12; called off under a day ahead, down 4; their ask left unanswered, down 2. Under 25, they’d rather work alone (an estimate)
  - The Bond: A rehearsal kept, 2 closer; missed by you, 5 further apart; each as your nature takes it (an estimate)
- **State (what changes at once):**
  - Ask: a yes books it as Rehearsal With … on your calendar; a no names their reason, and they remember being asked.
  - Say No to their ask costs nothing; Say Yes books it.
  - Call It Off a day or more ahead, and they take it as moved with notice. Under a day, their trust falls 4, and it counts as a time you let them down until you make amends.
- **Consumer (what reads it):**
  - The Calendar, scheduled: A rehearsal agreed is a commitment on the calendar, and the clock stops at it.
  - Preparing Coursework, scheduled: A rehearsal kept moves the piece’s partner part when it’s held, and an ask of theirs left open holds the piece’s other steps until it’s answered.
  - Your Class, history: A rehearsal missed or called off late is kept against you until you make amends, and two of them can bring a boundary.
  - Feedback And Your Notes, evaluation: The showing’s scene together reads their preparation, timing, agreement and reliability, apart from your band.
  - Your Work So Far, history: Each scene played together is counted, and Your Work So Far gives how they came out on average from the third on.
  - Calling In Sick, scheduled: A rehearsal booked on a day you’ve called in sick is excused, and costs none of their trust.
  - How You’ll Play A Scene, immediate: A rehearsal kept rehearses in the way you chose to play the scene, as a step of rehearsal does.
  - Table Work reads it, evaluation: A reading held apart from your partner’s leaves the scene together at 90% agreement until both are tried.
  - Feedback And Your Notes reads it, evaluation: Under a paired piece, the scene together reads your partner’s preparation, timing, readings and any slip, apart from your band.
- **Feedback (how to read what comes back):**
  - “Trust … of 100 · Came to … of … agreed” is how they stand with you, and how often they’ve come.
  - Their name, on Your Partners, opens them: what the scene together reads of them on each piece you share (their preparation, their timing, whether your readings agree), and what’s happened between you.
  - After a rehearsal they say what held the scene back: not knowing it, being on book, unclear choices, or time on its feet; or that it’s coming together. The choices are read as the showing reads the table work: your answers at the table, and where the course has a step of its own there, that step too. The game’s words, marked simulated.
  - The Scene Together, under the feedback, says how it compared with your own work, and why. Your own result stands as it is.
- **History (kept in the record):**
  - Your Class: A rehearsal missed or called off late is kept against you until you make amends, and two of them can bring a boundary.
  - Your Work So Far: Each scene played together is counted, and Your Work So Far gives how they came out on average from the third on.
- **Later consequence:**
  - Kept: your partner part rises 40% of what’s left at an ordinary focus, the way you chose to play the scene, where you chose one, is rehearsed in by 90% of that share, the evening is practice in listening, trust rises 4 and the bond 2, and they say what held the scene back most.
  - Not there yourself, away or asleep: they waited for you; their trust falls 12, the bond 5, and it waits to be made right.
  - They don’t come: you lose the evening, and they may apologize in class.
  - In hospital, laid up or on a day you’ve called in sick, it’s excused; for partner work in a studio, an injury that stops you training excuses it too. They know you’re ill, and don’t hold it against you.
  - In class, on a day with nothing booked between you, they may ask (40% of such days) for 7 p.m. on one of the next three evenings they’re free. Left unanswered, it lapses, and their trust falls 2.
  - At the showing, a scene together at Strong or better brings you 1 closer, and a slip of theirs you covered earns 2 of their trust.
  - Not there for the showing without an excuse: their trust and the bond fall as for a rehearsal missed.
- **Tested by:** `school.ask_partner`: `tests/commands-kept.test.ts`, `tests/coursework-defects.test.ts`, `tests/defects-g8-10.test.ts`, `tests/defects-r2-1.test.ts`, `tests/guide-examples-coursework.test.ts`, `tests/partners.test.ts`, `tests/school-journey-gaps.test.ts`; `school.answer_partner`: `tests/journey-school-year.test.ts`, `tests/journey-three-students.test.ts`, `tests/partners.test.ts`, `tests/school-journey-gaps.test.ts`; `school.cancel_rehearsal`: `tests/commands-kept.test.ts`, `tests/guide-examples-coursework.test.ts`

### Your Class (`coursework.class`)

- **Action:** `school.respond`, `school.make_amends`, at School, Coursework, Your Class And Your Partners (`/workspace/school?tab=coursework`). Opens: From the guide’s chapter “Drama School”, from the first class you’re at with them.
- **Preconditions:**
  - In class that day, with no other moment from the class waiting on your answer.
  - For Help Now: New Haven, and 45 minutes free now. For Say Yes: the evening still ahead and clear.
  - For Make Amends: something between you to put right, New Haven, and 20 minutes free.
  - Orientation Week first: A classmate brings you something once you’ve met them, at Meeting Your Class or in class.
- **Costs:**
  - Time: Help Now: 45 minutes then and there. Running lines: 60 minutes at 7 p.m. on the evening agreed. Make Amends: 20 minutes. Any other answer takes no time (an estimate)
  - Money: None
- **State (what changes at once):**
  - The answer is kept, and a toast says what came of it. A bond moves as your nature takes it.
  - Make Amends: everything between you so far is marked made right.
- **Consumer (what reads it):**
  - Table Work, immediate: Try Theirs replaces your answer to the question with theirs at once.
  - Rehearsing With A Partner, immediate: An answer can move their trust, which a partner reads when you ask them to rehearse; a boundary asks for a day’s notice.
  - Preparing Coursework, scheduled: An evening of running lines kept moves the lines of the scene you share 20% of what’s left.
  - How You Are, immediate: A word after a hard showing lifts your morale 3.
  - How You Are reads it, evaluation: Readiness sets how much a class or a lab builds that day.
  - Rehearsing With A Partner reads it, history: A rehearsal missed or called off late is kept against you until you make amends, and two of them can bring a boundary.
- **Feedback (how to read what comes back):**
  - Your Class lists what’s waiting with its answer-by time, and the last six moments with how you answered, or Not Answered.
  - Your Partners shows “Ask A Day Ahead (Lifts After … More Kept)” for a boundary, and “Has Stopped Asking You To Run Lines” or “Owes You Lines” where those apply.
  - “One time you let them down, not made right.” counts what Make Amends would put right.
- **History (kept in the record):**
  - (none)
- **Later consequence:**
  - An answer not given in time lapses; only an invitation to run lines costs anything for it.
  - An evening of running lines agreed goes on your calendar as Running Lines With …. Kept, it works the scene you share; with none shared, it works their lines and moves none of yours.
  - Both readings tried at the next rehearsal kept: the scene together reads your readings as one again, and where the course has a step of its own at the table, that step’s half of the table work moves 15% of what’s left. Where the table work is your answers alone, no figure of yours moves.
  - A bond of 25 makes them a friend, 50 a close friend, and −20 or lower a rival.
- **Tested by:** `school.respond`: `tests/classmate-moments.test.ts`, `tests/coverage-gaps-classmates.test.ts`, `tests/defects-g8-10.test.ts`, `tests/defects-r2-1.test.ts`, `tests/guide-examples-coursework.test.ts`, `tests/journey-school-year.test.ts`, `tests/journey-three-students.test.ts`, `tests/student-experience.test.ts`; `school.make_amends`: `tests/commands-kept.test.ts`, `tests/defects-g8-10.test.ts`, `tests/guide-examples-coursework.test.ts`

### Working A Problem Through (`coursework.workbook`)

- **Action:** `work.identify`, `work.try`, `work.settle`, at School, Coursework, Work It Through Under A Scene (`/workspace/school?tab=coursework`). Opens: From the guide’s chapter “Drama School”: under a scene for class while it’s open, under a practice brief once a reading is chosen, and under a part in a production while its run is to come.
- **Preconditions:**
  - A piece in progress: a scene for class with its material, still open; a practice brief with a reading chosen; a part whose run is still to come.
  - Some of the lines learned first: 30% of a brief’s, a scene’s or a part’s.
  - A problem named before a way is tried, and any change tried kept or put back before the next.
  - For a way on your feet, energy of 25 or more and no injury that stops training. For any, awake, out of hospital, at nothing else, and free for its minutes.
  - Preparing Coursework first: A scene’s lines learned to 30% let you try a way at it, and a problem in a part of the preparation is answered by that part’s own step.
- **Costs:**
  - Time: Work It Slowly, 30 minutes; Run Into It From The One Before, 40 minutes; Play This Part Another Way, 30 minutes; Find Places To Breathe, 45 minutes; Name What You Want In Each Part, 30 minutes; Run It With Your Partner, 45 minutes (an estimate)
  - Money: None
  - Naming And Settling: No time: naming a problem, keeping a change and putting one back move no clock
- **State (what changes at once):**
  - Naming a problem keeps it as the one being worked on.
  - A way tried spends its minutes and changes the work, and the try is kept with its figure before and after.
  - Work done (working a part slowly, running into it, naming what you want, running it with a reader) is kept at once, and a problem it solves leaves the list by itself.
  - Playing a part another way, or finding places to breathe, waits on Keep It or Put It Back. Kept, it’s a discovery. Put back, the piece is as it was, and that way isn’t offered for the problem again.
  - Working on an ability’s problem trains it a little, and running into a part trains your adaptability.
- **Consumer (what reads it):**
  - Feedback And Your Notes, evaluation: The showing reads the scene with each part’s own work and every discovery kept.
  - Preparing A Brief, evaluation: A brief’s take reads its beats’ own work and the ways kept, as its forecast did.
  - Who Reads With You, immediate: Run It With Your Partner moves the preparation of a classmate reading a brief with you.
  - The Player Profile, immediate: Working on an ability’s problem trains it a little, and running into a part trains adaptability.
- **Feedback (how to read what comes back):**
  - Before and after are the problem’s own figure: a part’s result for a problem in one part, the last part’s for tiring late, the whole for an ability or a part of the preparation, the work together for a partner.
  - A try that barely moves its figure is evidence too: the problem may want another way, or its own step of preparation.
  - “No way at it is left here” means its own step of preparation answers it, or the ways tried were put back. A partner not there yet on a scene for class has none here either: its line ends “Ask … to rehearse it with you.”
  - The tries table keeps the last six, newest first, each Kept, Put back or Waiting.
- **History (kept in the record):**
  - (none)
- **Later consequence:**
  - Every later forecast and performance of the piece reads what was kept: the take of a brief, the showing of a scene, a night of a part.
  - What You’ve Found lists each part played its own way and how far it’s rehearsed in, places to breathe found, and each try kept that moved its figure half a point or more.
- **Tested by:** `work.identify`: `tests/defects-g8-11.test.ts`, `tests/defects-g8-9.test.ts`, `tests/determinism-played.test.ts`, `tests/guide-examples-coursework.test.ts`, `tests/guide-examples-craft.test.ts`, `tests/workbook.test.ts`; `work.try`: `tests/defects-g8-11.test.ts`, `tests/defects-g8-9.test.ts`, `tests/determinism-played.test.ts`, `tests/guide-examples-coursework.test.ts`, `tests/guide-examples-craft.test.ts`, `tests/workbook.test.ts`; `work.settle`: `tests/defects-g8-13.test.ts`, `tests/defects-r8-1.test.ts`, `tests/determinism-played.test.ts`, `tests/direction-mastery.test.ts`, `tests/direction.test.ts`, `tests/guide-examples-productions.test.ts`, `tests/workbook.test.ts`

## Productions And Casting

Being cast, rehearsal calls, the director’s notes, the nights, and plays to read.

### Casting (`productions.casting`)

- **Action:** , at School, Casting, Why This Cast (`/workspace/school?tab=casting`). Opens: From the guide’s chapter “Drama School”. The chair casts as each term begins, from the first spring.
- **Preconditions:**
  - A place in the casting pool: two missed calls in a term take you out of it until a good evaluation puts you back. A rehearsal, a run-through or a lab missed unexcused takes you out when it brings the count there; a missed performance counts toward it, and is a grave breach besides.
  - A first-year is first cast in the spring; the first fall has Drama 50 and no production.
  - Good standing, for Yale Rep: an understudy in the first spring and in the second and third years’ falls, or, as a third-year at 77 acting or more, a part in the Rep’s company in place of a School production.
  - Your Standing And Classes first: Only a student in the casting pool is cast, and only one in good standing goes to Yale Rep; two missed calls take you out until a good evaluation.
- **Costs:**
  - Time: None to be cast. A School production calls you Tuesday to Friday from three for six hours through its rehearsal weeks, and plays at eight. A Rep understudy rehearses Wednesday and Friday from three to six and is on call at every performance; a company member rehearses Tuesday to Saturday from three to nine (an estimate)
  - Money: None: casting is part of the program, and unpaid
- **State (what changes at once):**
  - The cast list goes up as the term begins: every rehearsal call and performance goes on your calendar, from the first call, and a notice names your part.
  - The list read: a lead of your own lifts morale 2, a friend’s lead 0.5, and a rival’s adds 1.5 stress, each by your nature.
  - Each classmate in your cast comes 10 closer for the weeks shared, 12 less where a lead written for one of you went to the other, by your warmth or how a slight cuts you.
  - The runs the chair read are marked read: the next casting reads what you play after this one, with this read carried at 50% of its weight.
- **Consumer (what reads it):**
  - Learning A Part, immediate: Being cast puts every rehearsal call on the calendar with its stage, and opens the part’s rehearsal process.
  - The Calendar, scheduled: Each call and performance is a commitment on the calendar, and the clock stops at it.
  - The Nights, evaluation: The part’s size and stage set how hard each night is: a lead harder than a featured part, and the Rep harder than the School.
  - Rehearsing With A Partner, immediate: The cast list moves bonds: a classmate in your cast comes 10 closer, 12 less where a lead went between you.
  - How You Are, immediate: The list read: your own lead lifts morale 2, a friend’s 0.5, and a rival’s adds 1.5 stress.
  - The Nights reads it, evaluation: Each night’s delivery is read by the chair at the next casting; a night missed counts at nothing.
  - Cabaret And Summer Cabaret reads it, evaluation: A Cabaret or Summer run counts 50% of a School production’s in the delivery the chair reads.
- **Feedback (how to read what comes back):**
  - Read decides it: a higher fit can lose a lead across a balance of 4 points between a lead last time and a featured part.
  - Delivered at 100% means every night came fully prepared, on a sufficient day: the day’s fatigue, the flu, an injury or a concussion read as less delivered. Tiring late in the play and a slip carried into the next movement don’t, since the fit and the night’s draw read them already. A night missed unexcused, not in hospital, laid up or called in sick, counts as delivered at nothing.
  - Fit reads the same abilities a night does, so the work that grows them moves it. Identity plays no part in it.
  - A part called In The Company means no part written for you was left when your read came up.
  - Why This Cast shows the production you’re in; Around The Class shows the whole class, the Rep’s company included.
- **History (kept in the record):**
  - (none)
- **Later consequence:**
  - The School and the Rep never call you to two places at once: a School rehearsal gives way to a Rep rehearsal, performance or run-through, and ends where a Rep night on call begins; a Rep night on call gives way to your own School performance, and a School performance to a Rep performance in a role.
  - On call, the Rep calls three hours before each curtain, at five for an evening and at eleven for a Sunday matinee. Most nights you aren’t needed; on about 2% of them you go on, and the performance goes on your calendar.
  - An understudy plays one run-through for the director, on the dark Monday of the run’s second week.
  - When a run ends, the classmates in it grow by its rehearsals and nights, and their own run is judged and kept as their Last Run.
- **Tested by:** a screen or a look; the UI journeys (`tools/acceptance-ui.mjs`)

### Learning A Part (`productions.part`)

- **Action:** `school.learn_part`, `school.review_blocking`, at School, Casting, The Rehearsal Process (`/workspace/school?tab=casting`). Opens: From the guide’s chapter “Drama School”, while a part you’re cast in has calls to come: a School production, Yale Rep, a Cabaret show or a Summer Cabaret show.
- **Preconditions:**
  - A part you’re cast in, its run still to come.
  - For Catch Up The Blocking, a blocking or technical call missed and not yet caught up.
  - Free for the hour: not at something already, and nothing you’re expected at within it.
  - Casting first: Only a part you’re cast in has lines and blocking to learn, while its run is to come.
- **Costs:**
  - Time: An hour each, on the clock
  - Money: None
- **State (what changes at once):**
  - Learn The Part: the clock moves on an hour and Lines rises; a toast says where it stands.
  - Catch Up The Blocking: one fewer Missed To Catch Up, and Blocking rises.
  - Each call you come to moves the lines and the blocking as above, and keeps up your discipline, a quarter of a session’s worth.
- **Consumer (what reads it):**
  - The Director’s Notes, immediate: A missed blocking call, or lines under 70% past the off-book call, is what the next note asks for first.
  - The Nights, evaluation: The lines and the blocking are a night’s preparation, against what every call makes.
  - Your Standing And Classes, evaluation: Each call kept or missed is counted in the attendance the term’s evaluation reads.
  - The Player Profile, immediate: An hour on the part trains memory the first three times for each part; an hour with the book does every time.
- **Feedback (how to read what comes back):**
  - Lines under 70% past the off-book call bring the note “Be off book: the lines aren’t there yet, and the scene can’t start until they are.”
  - Growth From A Night is how much a night grows your craft, 100% for every call kept and no more. It doesn’t change the night’s result.
  - A Night Now is what a night would come to if it opened now, with no draw. The Part Now, Movement By Movement shows each movement’s own blocking against what it asks.
  - Blocking set at a call you were excused from is still a gap, and Missed To Catch Up counts it.
- **History (kept in the record):**
  - (none)
- **Later consequence:**
  - From the first work-through rehearsal, the director gives a note at each one, and the lines and the blocking come first.
  - The dress rehearsal is played through as a night with no house, and its band shows under the process: “The dress rehearsal: Solid.”
  - Each night reads the lines and the blocking as preparation, the blocking movement by movement with any work on each.
  - A School or Rep call missed counts against the term’s attendance, and two in a term take you out of the casting pool.
- **Tested by:** `school.learn_part`: `tests/defects-g8-11.test.ts`, `tests/defects-g8-13.test.ts`, `tests/defects-r8-1.test.ts`, `tests/direction-mastery.test.ts`, `tests/direction.test.ts`, `tests/guide-examples-productions.test.ts`, `tests/journey-school-production.test.ts`; `school.review_blocking`: `tests/defects-g8-11.test.ts`, `tests/defects-g8-13.test.ts`, `tests/defects-r8-1.test.ts`, `tests/direction-mastery.test.ts`, `tests/direction.test.ts`, `tests/guide-examples-productions.test.ts`, `tests/journey-school-production.test.ts`

### The Director’s Notes (`productions.notes`)

- **Action:** `school.work_note`, at School, Casting, The Rehearsal Process, The Director’s Last Note (`/workspace/school?tab=casting`). Opens: From the guide’s chapter “Drama School”, from a production’s first work-through rehearsal. An understudy’s rehearsals bring no notes.
- **Preconditions:**
  - A note given and not yet settled: the next call settles it either way.
  - For a craft note: awake and out of hospital, 30% of the part learned, free now with the way’s own minutes clear of anything you’re expected at, and, for a way on your feet, energy of 25 or more and no injury that stops training. Any other note: free now, with an hour clear.
  - For a craft note, a way at it not already tried and put back, and no change waiting to be kept or put back.
  - Learning A Part first: A note comes at a work-through call you come to; one on the lines or the blocking comes first while either is short.
- **Costs:**
  - Time: A note on the craft: the way’s own time, 30 to 45 minutes. Any other note: an hour (an estimate)
  - Money: None
- **State (what changes at once):**
  - A craft note: the way is tried on the part, its time spent, and its evidence kept on the note, the figure before and after. The note shows Worked On.
  - A way that changes how a movement is played, or places to breathe, waits to be kept or put back.
  - Any other note: an hour on it. A note on the lines moves them 30% of what’s left, and one on the blocking moves it 50% of what’s left and closes one missed call’s gap where one is open, as Catch Up The Blocking does.
  - Each craft note and each request of the director’s, given and answered, is counted for life, and each craft note worked with the way you used.
- **Consumer (what reads it):**
  - Working A Problem Through, immediate: A craft note’s ways are Work It Through’s, and working one is a try kept in the part’s workbook.
  - The Nights, evaluation: The share of notes taken is part of a night’s preparation, and of Growth From A Night.
  - Your Work So Far, history: Each note on the craft given, worked and answered counts for life in Taking Direction, with the way you reach for most; a note on the weakness your work keeps coming back to names it, with its count.
  - Feedback And Your Notes, history: Notes still open when the run closes go into the coursework’s ledger, and the next work can ask for them.
  - The Player Profile, immediate: Working a note trains adaptability, and a note taken makes that call’s growth 10% more.
- **Feedback (how to read what comes back):**
  - The note names its place, “in the second half”, “by the close”; a note on the whole part says “the whole play”.
  - The words come from what holds the place back most, by the quality it costs: believability or interpretation is “I don’t know what you want…”, connection “Who are they to you…?”, responsiveness “You’re not taking what they give you…”, execution “The physical life … isn’t clean yet”, consistency “It sags in…”. Tiring named as a problem of its own is “You’re spent by…”, and a turn into a movement “The change into … lurches”. A movement held back most by tiring is given “It sags in…”, a note on its pacing.
  - “Still:” is the same note again, unanswered. “Better since the last note.” means it was answered, and more is asked.
  - A craft note on an ability or technique your work keeps coming back to, the one Your Work So Far names, ends “It’s your … again: it’s held back … of your pieces before this.” The words change, and the note, its figure and what answers it stay as they are.
  - Under the note, the figure before, after and at the next call says whether the change held.
- **History (kept in the record):**
  - Your Work So Far: Each note on the craft given, worked and answered counts for life in Taking Direction, with the way you reach for most; a note on the weakness your work keeps coming back to names it, with its count.
  - Feedback And Your Notes: Notes still open when the run closes go into the coursework’s ledger, and the next work can ask for them.
- **Later consequence:**
  - At the next call the note is settled, Taken or Not Taken, its figure then kept beside it, and a change still waiting is kept and played at it.
  - At the next work-through, where the same note comes again: “Better since the last note.” if it was taken, with what you tried and its figures, and “Still:” if it wasn’t.
  - When the run closes, the notes still open go into the coursework’s ledger: what you want as the choices, listening and a relationship as the work with your partner, lines as the lines, a skill as that skill, the rest as rehearsal on its feet. A note on the director’s request stays with the part.
  - Looking Back, at the closing, counts the notes taken and those answered in the work.
- **Tested by:** `school.work_note`: `tests/defects-g8-11.test.ts`, `tests/defects-g8-13.test.ts`, `tests/defects-r8-1.test.ts`, `tests/direction-mastery.test.ts`, `tests/direction.test.ts`, `tests/guide-examples-productions.test.ts`, `tests/journey-school-production.test.ts`

### How You’ll Play A Part (`productions.playing`)

- **Action:** `school.choose_part_playing`, at School, Casting, How You’ll Play It (`/workspace/school?tab=casting`). Opens: From the guide’s chapter “Drama School”, while a part you’re cast in has calls to come.
- **Preconditions:**
  - A part you’re cast in, with calls still to come.
  - A choice that differs from the one you have: the button is grayed until it does.
  - Casting first: Only a part you’re cast in, with calls to come, can be chosen how to play.
- **Costs:**
  - Time: None: the choice takes no time, and the calls rehearse it in
  - Money: None
- **State (what changes at once):**
  - The choice is kept on the part, with what was rehearsed in before it as a change keeps it, and the toast says how far it’s rehearsed in.
  - Leaving every axis open clears the choice.
  - The sides you choose are kept among your habits.
- **Consumer (what reads it):**
  - Learning A Part, scheduled: Each call after the read-through rehearses the choice in, 27% of what’s left.
  - The Director’s Notes, immediate: A choice against the director’s request is the note at the next work-through.
  - The Nights, evaluation: Each night reads the choice: what it leans on, what it draws on, and how far it’s rehearsed in.
  - Your Work So Far, history: The sides you choose are kept as habits in Your Work So Far.
- **Feedback (how to read what comes back):**
  - Fully Prepared shows what a way can reach with everything complete; A Night Now, above it, shows the part as it stands today.
  - At full ability every side that fits reaches 100. Below it, a side that leans on what you do well shows you better.
  - “Doesn’t fit:” under a side gives the reason: the play’s own, or “The director has asked for it …”.
  - “Your choice now is rehearsed in to …% (complete at 90%)” is how far the calls have taken it.
- **History (kept in the record):**
  - Your Work So Far: The sides you choose are kept as habits in Your Work So Far.
- **Later consequence:**
  - Each call after the read-through rehearses it in further.
  - At a work-through, a choice against the director’s request is the note, “I want it …”, and it’s taken at the next call if the choice has changed.
  - Each night reads it: what it leans on, what it draws on, and how far it’s rehearsed in.
  - Work It Through offers a movement played another way only on an axis the whole part leaves open.
- **Tested by:** `school.choose_part_playing`: `tests/defects-g8-11.test.ts`, `tests/defects-g8-12.test.ts`, `tests/defects-g8-15.test.ts`, `tests/guide-examples-productions.test.ts`, `tests/trace-commands.test.ts`

### The Nights (`productions.nights`)

- **Action:** , at School, Casting, Your Nights (`/workspace/school?tab=casting`). Opens: From the guide’s chapter “Drama School”, from the first performance of a part you’re cast in.
- **Preconditions:**
  - A part you’re cast in, its performance on your calendar. An understudy plays only when sent on, and at the run-through.
  - In New Haven, awake, out of hospital and not laid up at the curtain. In hospital, laid up or with the day called in sick, the night is covered and excused.
  - Learning A Part first: The lines and the blocking at what every call makes, and never under 70%, complete a night’s preparation.
- **Costs:**
  - Time: A School performance at eight, two and a half hours; Yale Rep evenings at eight and Sundays at two, three hours; a Cabaret show an hour and a half; a Summer Cabaret night two and a half hours (an estimate)
  - Money: None
  - The Body: 10 energy; a stage’s risk of injury at the School, the Rep and the Summer Cabaret; and nerves, 6 stress before the curtain by your nature, less the more composure you have (an estimate)
- **State (what changes at once):**
  - The night’s band is kept on the run, and the night in your work.
  - Morale: Strong or Remarkable lifts it 3, Off takes 3, by the night together where there’s a company and by your own night where there isn’t. A Remarkable night of your own adds a little presence.
  - Before a School or Rep curtain, friends in the cast lift your morale, a point each up to 3, by how much you need company; a cast with none weighs on you if you need it. A third-year in the Rep’s company has the class’s others asked in listed as the cast; an understudy sent on plays with none of the class.
  - Your craft grows by the night, the scene, feeling and voice and what the play asks, scaled by Growth From A Night; listening grows, and the play’s kinds of play are practiced.
  - The night’s delivery, its preparation and the day’s condition, goes into the run record the next casting reads.
- **Consumer (what reads it):**
  - Your Standing And Classes, evaluation: A run with 3 or more nights by the term’s evaluation is read: mostly off falls short.
  - Casting, evaluation: Each night’s delivery is read by the chair at the next casting; a night missed counts at nothing.
  - A Piece Of Work, Explained, history: Each night is kept in your work, judged movement by movement, with what held it back.
  - Your Work So Far, history: The nights with a company count toward Playing With Others in Your Work So Far.
  - How You Are, immediate: A night Strong or better, the night together where there’s a company, lifts morale 3, an Off one takes 3, and nerves add stress before the curtain.
  - The Player Profile, immediate: A night grows the scene, feeling, voice and what the play asks, scaled by Growth From A Night, and listening with them.
  - Feedback And Your Notes, history: At the closing, the notes still open go into the coursework’s ledger for the next work.
  - How You Are reads it, evaluation: A night on stage is judged with your readiness at its hour as the condition you came in.
  - Your Standing And Classes reads it, evaluation: A run’s nights are read at the term’s evaluation once it has had 3.
  - Casting reads it, evaluation: The part’s size and stage set how hard each night is: a lead harder than a featured part, and the Rep harder than the School.
  - Learning A Part reads it, evaluation: The lines and the blocking are a night’s preparation, against what every call makes.
  - The Director’s Notes reads it, evaluation: The share of notes taken is part of a night’s preparation, and of Growth From A Night.
  - How You’ll Play A Part reads it, evaluation: Each night reads the choice: what it leans on, what it draws on, and how far it’s rehearsed in.
  - Cabaret And Summer Cabaret reads it, evaluation: Each show is a night judged as any other, kept on the run and in your work.
- **Feedback (how to read what comes back):**
  - Your own night is the evaluation of your work, and a partner’s slip can’t lower it. The night together can come out above or below it.
  - The Nights Together gives their average, the slips in the company, and how many you covered.
  - For the director’s note and the term’s evaluation, an Off night counts -1, Solid 0, Strong 1 and Remarkable 2.
  - Open a night in your work, and Part By Part shows each movement: its result, its own rehearsal, Tiring or Holding, and a slip or what cost it most. Continuity is read from the movements and isn’t added to the night.
- **History (kept in the record):**
  - A Piece Of Work, Explained: Each night is kept in your work, judged movement by movement, with what held it back.
  - Your Work So Far: The nights with a company count toward Playing With Others in Your Work So Far.
  - Feedback And Your Notes: At the closing, the notes still open go into the coursework’s ledger for the next work.
- **Later consequence:**
  - At the closing the run is kept among your milestones, and the director’s note comes: how the nights went on average, and the skill the play asks that’s weakest in you, to work on.
  - Looking Back, once, counts the calls answered, the notes given and taken, the dress, and the nights with the company; what’s still open goes with you into class.
  - At the term’s evaluation, a run with 3 or more nights is read: mostly off falls short of the program’s standards, and strong work is noted.
  - The next casting reads your delivery across the runs since the last one.
- **Tested by:** a screen or a look; the UI journeys (`tools/acceptance-ui.mjs`)

### Cabaret And Summer Cabaret (`productions.cabaret`)

- **Action:** `school.cabaret`, `school.summer_cabaret`, at School, Casting, The Yale Cabaret And The Yale Summer Cabaret (`/workspace/school?tab=casting`). Opens: From the guide’s chapter “Drama School”: the Cabaret in any term, the Summer Cabaret in the spring of the first and second years.
- **Preconditions:**
  - For the Cabaret: a student of the School, off academic warning, not on a leave, the term begun, no Cabaret show this term yet, a week that fits, and not cast at the School and the Rep both in the weeks it would rehearse and play.
  - For the Summer Cabaret: good standing, not on a leave, the spring of the first or second year, by April 30, and not in this summer’s company already.
  - Your Standing And Classes first: Academic warning bars the Cabaret and takes you out of a show under way; the summer company takes good standing.
  - Casting first: A Cabaret week has to miss every casting call and night on call; with the School and the Rep both calling in its weeks, you can’t take one.
- **Costs:**
  - Time, The Cabaret: 9 weekday evenings from 6 p.m., five hours each, then 5 shows of an hour and a half: Thursday at eight, Friday and Saturday at eight and eleven (an estimate)
  - Time, The Summer: For each of three shows, Tuesday to Saturday afternoons from 1 p.m. for the three weeks before it, five hours each, but for an afternoon when another show plays its Saturday matinee; evenings at eight, dark on Mondays, and Saturday matinees at two (an estimate)
  - Money: The Cabaret is unpaid. The Summer Cabaret pays $375 a week on Fridays at five, from the first rehearsal week to the week after the closing, with federal and Connecticut tax withheld, and FICA too unless you’re a nonresident on an F-1 (an estimate)
- **State (what changes at once):**
  - Joining the Cabaret: your part, and every evening and show on your calendar at once.
  - Joining the summer company: its three plays named with your part in each, and every afternoon and night of the three on your calendar.
- **Consumer (what reads it):**
  - The Calendar, immediate: Joining puts every evening, call and show on the calendar at once.
  - Learning A Part, immediate: Each show has its own rehearsal process, lines, blocking and notes, under its panel.
  - The Nights, evaluation: Each show is a night judged as any other, kept on the run and in your work.
  - Casting, evaluation: A Cabaret or Summer run counts 50% of a School production’s in the delivery the chair reads.
  - Your Affairs And What You’re Worth, scheduled: The summer stipend lands in your account each Friday at five, $375 a week before tax.
  - Your Tax Return, history: The summer stipend is wages on the year’s return, its tax withheld already.
- **Feedback (how to read what comes back):**
  - Performed counts the Cabaret shows played of 5, with the calls still ahead beside it.
  - The summer panel lists each show with the nights played, and once the company has let you go its subtitle says “The company let you go”.
  - A day called in sick excuses a Cabaret evening or show and a Summer Cabaret call, as hospital or being laid up does: the blocking an evening sets without you is still a gap to catch up, a show missed so isn’t held against the run record, and the summer company keeps you.
- **History (kept in the record):**
  - Your Tax Return: The summer stipend is wages on the year’s return, its tax withheld already.
- **Later consequence:**
  - Each evening and show is answered as a call is: lines, blocking and notes as for any part, and each show a night.
  - The closing night played puts the show among your credits.
  - The summer stipend is paid each Friday at five, tax withheld, and counted as wages on the year’s return.
  - Put on academic warning, on a leave or out of the School during a Cabaret show, the calls still to come are called off and not held against you; what you played stays.
  - Hurt on a Summer Cabaret stage, workers’ compensation pays the care; kept off it, Connecticut’s 75% of the stipend after tax as well, nothing for the first three days unless you’re off more than six. For the days it keeps you off, the stipend stops, the compensation paid in its place. Laid up by anything else, the company covers the nights and the stipend goes on.
- **Tested by:** `school.cabaret`: `tests/defects-g8-1.test.ts`, `tests/defects-g8-14.test.ts`, `tests/school.test.ts`, `tests/student-experience.test.ts`; `school.summer_cabaret`: `tests/defects-g8-1.test.ts`, `tests/defects-g8-11.test.ts`, `tests/defects-g8-13.test.ts`, `tests/defects-g8-14.test.ts`, `tests/guide-examples-productions.test.ts`, `tests/school.test.ts`

### Plays To Read (`productions.plays`)

- **Action:** `plays.read`, `plays.research`, at School, Coursework, Plays To Read (`/workspace/school?tab=coursework`). Opens: From the guide’s chapter “Drama School”. A copy is lent once orientation’s tour has shown you the library.
- **Preconditions:**
  - At school and in New Haven, with orientation’s tour done or orientation behind you.
  - Free for the read’s time.
  - For Research It: read first, and not researched yet.
  - Orientation Week first: The tour shows you the Haas Arts Library, where every copy is borrowed.
- **Costs:**
  - Time: Read It: 120 minutes, 60 for a short play or a monologue; read again, 75% of that. Research It: 90 minutes (an estimate)
  - Money: None: the library lends it
- **State (what changes at once):**
  - The clock moves on the read’s time, and the note is kept with the play, its last 6.
  - Read It becomes Read It Again, the Read column counts the reads, and Research It appears.
  - Research It: the play shows Researched, and the note gives its first production, first edition and who licenses it.
- **Consumer (what reads it):**
  - The Player Profile, immediate: A read trains script analysis and imagination, and research script analysis again, each kept on the development history.
- **Feedback (how to read what comes back):**
  - Read shows Not Yet, Once, or how many times; Researched shows under it once researched.
  - “A part for you” or “No part for you” is by the published cast’s women and men; neither shows where they aren’t on record, and the Cast column says “Not on record” where the cast isn’t.
  - “Too soon after it to see it fresh.” means no training this time.
  - Your Latest Notes shows the five most recent, one for each play.
- **History (kept in the record):**
  - (none)
- **Later consequence:**
  - The training shows as your craft grows, each step kept on the development history.
- **Tested by:** `plays.read`: `tests/guide-examples-productions.test.ts`, `tests/journey-life.test.ts`, `tests/playreading.test.ts`, `tests/whynot-school.test.ts`; `plays.research`: `tests/guide-examples-productions.test.ts`, `tests/playreading.test.ts`

## Your Craft

Practice, techniques, genres, practice briefs, a piece of work explained, and your work so far.

### The Player Profile (`craft.profile`)

- **Action:** `ui.profile`, at Player Profile (`/workspace/profile`). Opens: From the guide’s chapter “You As An Actor”: Player Profile on the menu, and your name at its foot.
- **Preconditions:**
  - On a guided life, “You As An Actor” read in the guide.
  - A life in training: the craft is drama school’s to begin.
  - The Guide And This Help first: The profile opens with the guide’s chapter “You As An Actor”.
- **Costs:**
  - Time: None: reading the profile and opening its words moves no clock
  - Money: None
- **State (what changes at once):**
  - Opening the profile, a panel or a word changes nothing and moves no clock.
  - Its buttons act: Practice An Hour, Study It, and everything inside an open brief, each with an entry of its own.
- **Consumer (what reads it):**
  - Looking After Yourself reads it, history: A workout’s fitness is your Stamina on the Player Profile.
  - A Piece Of Work, Explained reads it, history: Each piece judged is kept in School Journey, the latest 160 in full and every one counted.
- **Feedback (how to read what comes back):**
  - Now against Full is how far an ability has to go. Classes Reach is where classes stop taking it; practice carries it the rest of the way.
  - Today says “Nothing holds it back” on a sufficient day; otherwise it names the cause and the dimensions of work it reaches.
  - A technique’s Mastered column says Yes at 90, or how far it has to go.
  - In School Journey each half-year row gives each kind of work’s count and its mean, and All Of It the life’s count, mean and best.
  - Identity And Background is shown as the character was made; no ability is drawn from a name, a portrait, a race or ethnicity, or a gender.
- **History (kept in the record):**
  - (none)
- **Later consequence:**
  - Each figure moves as the life does: a class, a step of preparation, an hour of practice, a take, a showing or a night grows what it trains, and Development History lists it.
  - Stamina is the one that falls without use: 0.18 a day toward 35 once 3 days have passed since a workout.
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
  - What the exercise trains grows by the hour’s gain, to full at most; arriving at full sets it exactly.
  - With Variation or Live With A Partner, what it carries over to grows too, under its own line in Development History.
  - The first hour of a day grows discipline once.
  - The exercise’s record keeps the session, its tier and its focus, and the material it’s practice in: material that asks it then prepares faster.
- **Consumer (what reads it):**
  - The Clock: Play And Pause, immediate: Each hour of practice moves the clock 60 minutes and spends its energy.
  - A Piece Of Work, Explained, evaluation: Every piece of work judged afterward reads what practice grew at its new level.
  - Preparing A Brief, immediate: An exercise is practice in the material it names, and a brief built on that material prepares faster.
  - Your Work So Far, history: The material an exercise practices is kept in the record that Material You Know reads.
- **Feedback (how to read what comes back):**
  - What the hour found names the tier against your level (“Pitched where you are”, or that it went easily, or was a struggle), what the focus made of it, what carried over, and how far the level rose and where it stands.
  - “Hour 2 on it today” means a repeat: another exercise would give more.
  - Six or more sessions in a row on one exercise is said, with whether its gains are slowing as it nears full.
  - Attributes And Craft’s subtitle counts today’s practice against 4 hours.
  - An ability’s look gives Now, Classes Reach and Last Change, what develops it, where it began, which work reads it, and its exercise, said to be a named exercise, a composite of real practice, or SLATE’s design.
- **History (kept in the record):**
  - Your Work So Far: The material an exercise practices is kept in the record that Material You Know reads.
- **Later consequence:**
  - Every piece of work that reads what grew reads it at its new level.
  - Spaced pays a day to a week after the exercise’s last session.
  - Discipline is read by the consistency of most work, and by how much every gain counts, so days kept up add up.
- **Tested by:** `practice.exercise`: `tests/defects-r8-1.test.ts`, `tests/development.test.ts`, `tests/engagement.test.ts`, `tests/genre-coverage.test.ts`, `tests/guide-examples-craft.test.ts`, `tests/history-continuity.test.ts`, `tests/whynot-profile.test.ts`

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
  - Taping A Brief, evaluation: Knowing the genre is a part of a take’s preparation, read by its interpretation, complete at 30%.
  - Preparing Coursework, immediate: A scene from a play of a kind you know is prepared faster, by the better of familiarity and practice.
  - Learning A Part, immediate: A part in a play of a kind you know is learned faster.
  - Your Work So Far, history: The genres you’ve worked in are counted in Range.
- **Feedback (how to read what comes back):**
  - It Asks For names each technique with your level against mastery, or says the research didn’t establish one: “Not established: the research rests on one example”, or “Nothing past the camera’s own”.
  - A genre’s look gives Familiarity, Practice and Preparation: how much faster the better of the two makes a scene or a part from a play of its kind, where a brief’s steps read the material met before instead. It gives what the research found the genre asks, and how sure it is.
  - Knowing The Genre, inside a brief, is the better of the first two against the 30% that completes it.
  - “You love it” on a genre’s look means a day of its work is a better day: loving it doesn’t speed the work or cap it.
- **History (kept in the record):**
  - Your Work So Far: The genres you’ve worked in are counted in Range.
- **Later consequence:**
  - The next take of a brief in the genre reads the new figure.
  - The next step on a scene, or the next lines learned, from a play of the kind goes faster by it.
- **Tested by:** `genre.study`: `tests/briefs.test.ts`, `tests/defects-g3-1.test.ts`, `tests/defects-r8-1.test.ts`, `tests/engagement.test.ts`, `tests/genre-coverage.test.ts`, `tests/guide-examples-craft.test.ts`, `tests/migration-94.test.ts`

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
  - Rehearse It On Your Feet also rehearses in the way you chose to play it, brings a classmate reading with you along, and counts as practice in the brief’s material, so the next step goes a little faster. In a brief built on the body or the voice, it practices that too.
- **Consumer (what reads it):**
  - Taping A Brief, evaluation: The take reads each part of the preparation against what completes it, and rehearsal beat by beat.
  - A Reading And A Way To Play It, immediate: Rehearse It On Your Feet rehearses in the way you chose to play it, at 90% of the step’s reach.
  - Who Reads With You, immediate: A classmate reading with you learns it as you rehearse, at 50% of the step’s reach.
  - The Player Profile, immediate: Break It Down practices imagination and Learn The Lines memory, a little each time the part rises.
  - Working A Problem Through reads it, evaluation: A brief’s take reads its beats’ own work and the ways kept, as its forecast did.
- **Feedback (how to read what comes back):**
  - Preparation shows The Breakdown, The Lines, Rehearsal and Knowing The Genre, each as so much of what completes it; Rehearsal’s against the 50% a beat asks with no turn into it and one tone.
  - Its Rehearsal, Beat By Beat, is each beat’s own: the brief’s rehearsal, and any work on that beat alone from Work It Through.
  - Past what every beat asks, more rehearsal adds nothing to a take.
- **History (kept in the record):**
  - (none)
- **Later consequence:**
  - The next take reads each part against what completes it; a part short holds back the dimensions that read it.
  - Preparation keeps from day to day: it doesn’t fade.
- **Tested by:** `brief.prepare`: `tests/briefs.test.ts`, `tests/defects-g29-1.test.ts`, `tests/defects-g3-1.test.ts`, `tests/defects-g30-1.test.ts`, `tests/defects-g31-1.test.ts`, `tests/defects-g8-11.test.ts`, `tests/defects-r8-1.test.ts`, `tests/determinism-played.test.ts`, `tests/engagement.test.ts`, `tests/ensemble.test.ts`, `tests/guide-examples-craft.test.ts`, `tests/workbook.test.ts`

### A Reading And A Way To Play It (`craft.brief-choose`)

- **Action:** `brief.choose`, at Player Profile, Its Brief, Your Reading (`/workspace/profile`). Opens: From the guide’s chapter “You As An Actor”.
- **Preconditions:**
  - An open brief; How You’ll Play It shows once a reading is chosen.
- **Costs:**
  - Time: None: the choice is made at once
  - Money: None
- **State (what changes at once):**
  - A first reading is set. A new one keeps 50% of the breakdown, and the toast says where it stands.
  - A new way of playing it keeps 50% of what was rehearsed in; the same way chosen again keeps all of it.
  - A side newly chosen counts once in the record your habits are read from. Change The Reading, the same way chosen again, and a side kept while another axis changes count nothing more.
- **Consumer (what reads it):**
  - Preparing A Brief, immediate: A new reading keeps 50% of the breakdown.
  - Taping A Brief, evaluation: The take reads the reading and the way it’s played: their leans, the abilities they draw on, and the way as rehearsed in.
  - Your Work So Far, history: Each side newly chosen, and each take’s reading, is counted toward the habits Your Work So Far names.
- **Feedback (how to read what comes back):**
  - The figure beside each reading and each side is the take fully prepared, on a good day, with no draw: what the choice can reach for you now, against the others.
  - “Doesn’t fit:” under a side says why: the brief’s text forbids it, or the callback has asked for the other.
  - The line under the table gives the take played this way against nothing chosen, and how far the way is rehearsed in.
  - At full ability every reading, and every way that fits, reaches 100. Below it, the one that leans on what you do well shows you better.
- **History (kept in the record):**
  - Your Work So Far: Each side newly chosen, and each take’s reading, is counted toward the habits Your Work So Far names.
- **Later consequence:**
  - The next take reads the reading, and the way as far as it’s rehearsed in by then.
  - Work It Through can play one beat its own way, on an axis the whole leaves open.
- **Tested by:** `brief.choose`: `tests/attributes-complete.test.ts`, `tests/briefs.test.ts`, `tests/defects-g29-1.test.ts`, `tests/defects-g3-1.test.ts`, `tests/defects-g30-1.test.ts`, `tests/defects-g31-1.test.ts`, `tests/defects-g6-1.test.ts`, `tests/defects-g8-11.test.ts`, `tests/defects-g8-15.test.ts`, `tests/defects-r8-1.test.ts`, `tests/determinism-played.test.ts`, `tests/engagement.test.ts`, `tests/ensemble.test.ts`, `tests/genre-coverage.test.ts`, `tests/guide-examples-craft.test.ts`, `tests/history-continuity.test.ts`, `tests/workbook.test.ts`

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
  - Taping A Brief, evaluation: The take with its reader is what earns a callback; your own take reads none of it.
  - Rehearsing With A Partner, immediate: A take with a classmate at Strong or better together adds about 1 to your bond; a slip of theirs you cover at least half of adds 2 to their trust.
  - Your Work So Far, history: Every take with a reader counts toward Playing With Others, with the slips and those you covered.
- **Feedback (how to read what comes back):**
  - “Together it came to …, about what your own work did”, or so much under or over it. Under says why (they came less prepared, your readings were apart, they slipped and whether you covered most of it), then “Your own result stands as it is.”
  - A recording brings 60 to each share of the scene it holds: the take with it comes out under your own where your own work tops 60 there, and over it where it falls short of that.
  - A brief recorded alone at a microphone has no take with a reader and no How They Play It, and its callback reads your own take.
- **History (kept in the record):**
  - Your Work So Far: Every take with a reader counts toward Playing With Others, with the slips and those you covered.
- **Later consequence:**
  - Each take works out the take with the reader beside your own. Strong, 65 or more, earns a callback where the take wasn’t one itself.
  - With a classmate, a take together at Strong or better adds 1 to your bond, more or less by how warmly you take to people, and a slip of theirs you cover at least half of adds 2 to their trust, and stays in what they remember of you.
  - Every take with a reader counts toward Playing With Others in Your Work So Far.
- **Tested by:** `brief.reader`: `tests/defects-g31-1.test.ts`, `tests/determinism-played.test.ts`, `tests/ensemble.test.ts`, `tests/guide-examples-craft.test.ts`

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
  - It grows On Camera, or Voice-Over at a microphone, and any technique the scene stages, toward where classes level off, and is practice in the brief’s genres.
  - A take that’s the same again (the same reading, played the same way, no better prepared) is worth half as practice, and the same brief again the same day halves the genre’s practice again.
  - The take with its reader is worked out beside your own, and a classmate who read moves with it.
  - A take with its reader at 65 or more (your own take, at a microphone) earns a callback, where it wasn’t one itself: one side of one axis the brief leaves open, said before the next take.
- **Consumer (what reads it):**
  - A Piece Of Work, Explained, history: Each take is kept on your work record, and opens there into how it was judged, beat by beat.
  - Genres, immediate: A take is practice in the brief’s genres, one session’s worth shared among them.
  - The Player Profile, immediate: A take grows On Camera, or Voice-Over, toward where classes level off.
  - Your Work So Far, history: Takes and their readings are read for habits, and a callback answered counts toward Taking Direction.
  - Genres reads it, evaluation: Knowing the genre is a part of a take’s preparation, read by its interpretation, complete at 30%.
  - Preparing A Brief reads it, evaluation: The take reads each part of the preparation against what completes it, and rehearsal beat by beat.
  - A Reading And A Way To Play It reads it, evaluation: The take reads the reading and the way it’s played: their leans, the abilities they draw on, and the way as rehearsed in.
  - Who Reads With You reads it, evaluation: The take with its reader is what earns a callback; your own take reads none of it.
- **Feedback (how to read what comes back):**
  - What a take is for is said plainly: a first take, a callback, another reading, the same reading played another way, better prepared or better able than last time, or the same again, worth half as practice.
  - Beat By Beat gives each beat’s Result, Its Rehearsal against what it asks, Stamina (Holding, or Tiring with how much off) and What Happened: a slip, shaken by the slip before, what cost it most, or As expected.
  - Continuity, under the beats, is how evenly the character held: shown beside the take, never added to it.
  - “Played against the callback’s note: the callback is still yours.” means the note wasn’t answered.
  - Where It Would Show Next suggests up to five, each with why: a callback waiting; the brief you haven’t taped that leans most on the weakness What To Work On names, or on the one your work keeps coming back to where recent work names none (once every brief is taped, the one leaning most); one built on material your work hasn’t met; one taped before that takes it the other way from a habit; the brief of the genre your work knows least, new to you; and a reading of a taped brief you haven’t tried.
  - A weakness no practice brief reads is suggested no brief, and What To Work On says so: “No practice brief reads …, so a take won’t show it and none is suggested for it.”
- **History (kept in the record):**
  - A Piece Of Work, Explained: Each take is kept on your work record, and opens there into how it was judged, beat by beat.
  - Your Work So Far: Takes and their readings are read for habits, and a callback answered counts toward Taking Direction.
- **Later consequence:**
  - A callback stays until a take plays it the way its note asks; that take ends the round, and only a take that isn’t a callback earns the next.
  - What held the take back is read by What To Work On Next and by Your Work So Far, and the next suggestions in Where It Would Show Next follow from it.
- **Tested by:** `practice.self_tape`: `tests/attributes-complete.test.ts`, `tests/briefs.test.ts`, `tests/defects-g29-1.test.ts`, `tests/defects-g3-1.test.ts`, `tests/defects-g30-1.test.ts`, `tests/defects-g31-1.test.ts`, `tests/defects-g6-1.test.ts`, `tests/defects-g8-15.test.ts`, `tests/defects-r8-1.test.ts`, `tests/determinism-played.test.ts`, `tests/engagement.test.ts`, `tests/ensemble.test.ts`, `tests/genre-coverage.test.ts`, `tests/guide-examples-craft.test.ts`, `tests/history-continuity.test.ts`, `tests/workbook.test.ts`

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
  - Practice reads it, evaluation: Every piece of work judged afterward reads what practice grew at its new level.
  - Taping A Brief reads it, history: Each take is kept on your work record, and opens there into how it was judged, beat by beat.
- **Feedback (how to read what comes back):**
  - A limit’s points are what that one input cost: its dimension worked out again with it made whole, everything else held. Limits are ranked by what they cost the whole.
  - “Everything it asked was met: the most it can be.” is a piece at mastery.
  - The small line gives what it was judged with: readiness, difficulty, and each part of preparation against what completed it.
  - The provenance says the piece was worked out again from its own inputs, and to what: the same figure, whatever has changed since.
  - What To Work On Next reads these limits across your recent work, and, for the weakness your work keeps coming back to, what it has cost across your work for life.
- **History (kept in the record):**
  - The Player Profile: Each piece judged is kept in School Journey, the latest 160 in full and every one counted.
  - Your Work So Far: Your Work So Far reads the record for strengths, and what held each piece back, kept for life, for what keeps coming back.
- **Later consequence:**
  - A result is kept under the rules it was judged by: a later change to the rules doesn’t rewrite it, and one judged under rules since changed is shown as it was, without working it out again.
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
  - The Player Profile, immediate: What To Work On Next names the weakness your work keeps coming back to with its count for life, and may put it first.
  - Preparing Coursework reads it, history: Each showing is kept on your record, where Your Work So Far reads your strengths and what keeps holding you back.
  - How You’ll Play A Scene reads it, history: Every side chosen and shown is kept, and Your Work So Far names one you choose most of the time.
  - Feedback And Your Notes reads it, history: Each showing is on the record, and a note still open after 3 times shows in Your Work So Far as one that keeps coming back.
  - Rehearsing With A Partner reads it, history: Each scene played together is counted, and Your Work So Far gives how they came out on average from the third on.
  - The Director’s Notes reads it, history: Each note on the craft given, worked and answered counts for life in Taking Direction, with the way you reach for most; a note on the weakness your work keeps coming back to names it, with its count.
  - How You’ll Play A Part reads it, history: The sides you choose are kept as habits in Your Work So Far.
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
  - The first ability or technique in What Keeps Holding It Back is the one your work keeps coming back to. What To Work On Next gives its count for life and puts it first within half a point of the top, and a director’s note on it ends “It’s your … again: it’s held back … of your pieces before this.” Neither moves a figure.
- **History (kept in the record):**
  - (none)
- **Later consequence:**
  - Each line moves as the work goes on: it’s read again from the record each time it’s shown.
  - A weakness that kept coming back stays on the list by what it cost for life, until others have cost more.
- **Tested by:** a screen or a look; the UI journeys (`tools/acceptance-ui.mjs`)
