# Writes docs/text/surfaces/tutorial.json: the tutorial area's rows of brief 17's text coverage matrix.
import json, sys
C = sys.argv[1]
ids = json.load(open(sys.argv[2]))
V = 'docs/verification/continuity-2026-10-20/tutorial'
A, B = f'{V}/after', f'{V}/before'
T = 'tutorial.ts#CHAPTERS'
chap = lambda c: f'src/engine/content/{T} [{c}]'
CH = ['welcome', 'calendar', 'clock', 'advance', 'needs', 'body', 'sleep', 'looking-after', 'plans', 'weather', 'school', 'profile', 'papers', 'documents', 'money', 'bank', 'life']
cfile = lambda i, c: f'{A}/follow-1440/chapter-{i + 1:02d}-{c}.txt'
follow = [{'kind': 'walk', 'ref': f'{A}/follow-1440/log.txt'}, {'kind': 'walk', 'ref': f'{A}/follow-390/log.txt'}]
helpf = [{'kind': 'walk', 'ref': f'{A}/help-follow-1440/log.txt'}, {'kind': 'walk', 'ref': f'{A}/help-follow-390/log.txt'}]
entries = [{'kind': 'walk', 'ref': f'{A}/entries-read-1440/log.txt'}, {'kind': 'walk', 'ref': f'{A}/entries-read-390/log.txt'}]
routes = {'kind': 'run', 'ref': f'{A}/routes.md'}
t = lambda path, name: {'kind': 'test', 'ref': f"{path}: '{name}'"}
rows = []
def row(surface, where, sources, states, outcome, why, evidence, changes=''):
    r = {'surface': surface, 'where': where, 'sources': sources, 'states': states, 'outcome': outcome, 'why': why}
    if changes: r['changes'] = changes
    r['evidence'] = evidence
    rows.append(r)

# --- The guide's frame ---------------------------------------------------------------------------------------------
row('The guide’s dialog: a chapter, I’ve Read It, what it opened, Next and Try It', 'The guide, opened by itself on a new life, from Guide in the top bar or Read on the strip',
    ['src/ui/guide/Guide.tsx#GuideDialog'], ['first use', 'ordinary', 'confirmation', 'locked', 'explanation'], 'Kept',
    'Its callouts say why a chapter can’t be marked read yet and which comes first (“This chapter opens what you pressed. The chapters open in order, so read “Moving Time On” first.”), a chapter read ahead has no I’ve Read It, and after I’ve Read It it lists what opened and offers Try It or Next with the next chapter’s title. help-follow.mjs pressed each of these on a new life and follow.mjs read all seventeen chapters through it.',
    follow + helpf + [t('tests/help-mechanics.test.ts', 'says which comes first when a locked control asks for its chapter')])
row('A locked button, and the refusal behind it', 'Every gated control on a guided life before its chapter is read',
    ['src/ui/guide/Guide.tsx#Gated', 'src/engine/world/tutorial.ts#lockedBecause', 'src/engine/world/tutorial.ts#registerTutorial'], ['locked', 'unavailable', 'error'], 'Kept',
    'A blocked action here says both halves: a locked button keeps its own name with Locked beside it and opens the guide at its chapter, and the engine’s refusal names the chapter to read and the one that comes first. Pressed on the built app, Look After Yourself opened its chapter with the callout.',
    follow + helpf + [t('tests/tutorial.test.ts', 'refuses a command until its chapter is read, and names the chapter')])
row('A locked panel on Home, and Read About It', 'Home on a guided life: each of its eight panels before the chapter that opens it is read',
    ['src/ui/guide/Guide.tsx#LockedPanel'], ['locked', 'first use', 'unavailable'], 'Revised',
    'Each said “This opens when you read “…” in the guide:” and then its chapter’s lead, which is the chapter’s subject and not the panel’s: on a first Home, Where You Are’s ended “how SLATE works, and how to read Home” (the frame editor’s finding).',
    follow + helpf + [t('tests/evidence-g32-ui.test.ts', 'Where You Are and the Weather, locked, say what each shows'), t('tests/evidence-g33-ui.test.ts', 'Money is its LockedPanel until “Money” is read'), t('tests/evidence-g33-ui.test.ts', 'School is its LockedPanel until “Drama School” is read')],
    'Each says what it shows, read from what Home draws in it, and then when it opens: “The town you live in, its local time and its daylight. It opens when you read “Your Life, Hour By Hour” in the guide.”, with Read About It. help-follow.mjs read all eight on a new life on the built app.')
row('The guide strip and the Guide button', 'Under the top bar, and in it, until every chapter is read',
    ['src/ui/guide/Guide.tsx#GuideStrip', 'src/ui/guide/Guide.tsx#GuideButton'], ['ordinary', 'returning'], 'Kept',
    'The strip says where the player is in the guide (Guide · 4 Of 17), the next chapter’s title and lead, and has Read; the top bar’s Guide counts what’s left, Guide (14 Left). Both open the next unread chapter, which is the one thing a player coming back to the game needs to find the place they left.',
    helpf + follow)

# --- The chapters ----------------------------------------------------------------------------------------------------
KEPT = {
    'welcome': ('Read in the guide dialog on a new life, it names every control the first screen has, in the order a player meets them: the line under the greeting, the underlined words, Locked and Read About It, I’ve Read It, Next, Try It and Later, How This Works and the ? and / keys, Save & Exit and Continue. follow.mjs pressed each where it says, and it ends on why the clock is paused and what to read next.', ['first use', 'explanation', 'locked']),
    'clock': ('Play and Pause are named as the button shows them, saying what a press does, the real-time minute is said plainly, and the one exception, Sleep running through commitments, says where its list is. On the built app Play became Pause and a minute of real time moved the clock from 7:30 to 7:31 AM.', ['first use', 'ordinary', 'explanation']),
    'needs': ('It says what What Needs You holds with real examples, names the clearing button by its counted label (Mark 3 Read), and says what Dismiss leaves standing, a tax return still due, which brief 15 pressed on decision.json. An answer that can’t be done is said to keep the question with its reason.', ['notification', 'ordinary', 'empty', 'unavailable']),
    'body': ('Energy, stress and readiness each get a sentence of what they are, the distinctions the style guide asks for (condition, fitness, energy and health) are said apart, and Readiness’s “up to three” is what the follow found when it pressed it. The traits and a long-term condition are behind The Details.', ['first use', 'explanation', 'details']),
    'sleep': ('The Sleep dialog’s range comes from the rule, half an hour to 14 hours, its suggestion, its button’s own label (Sleep 8 Hours) and Not Yet are named, and the grayed Sleep at a commitment says where the reason is. The follow read “You’re at Meeting Your Class until 1:00 PM.” in the top bar, and a night took energy from 31 to 100.', ['ordinary', 'unavailable', 'explanation']),
    'looking-after': ('The five lines are named as the menu shows them, the order (Needed Now, Most Worth It) is explained by what costs more every hour, the groceries bought by themselves are said with what follows when there’s no money, and a grayed line is said to carry its reason. Pressed, the first line toasted “Eat A Meal: done at …”.', ['ordinary', 'unavailable', 'explanation', 'details']),
    'plans': ('It walks Open Calendar, a day, Put Something On It, the form’s three fields by their labels and Put It On in order, then Call It Off and when a plan is missed. The follow put Lunch With Sam on and called it off exactly so.', ['ordinary', 'confirmation', 'explanation']),
    'weather': ('Short and concrete: where the panel is, what pressing a day opens, and the two things weather changes in the game (whether a workout is a run, and the flu’s weeks), with the thunderstorm counts behind The Details.', ['ordinary', 'explanation', 'details']),
    'papers': ('Each control is placed on its tab (Your Doctor and Book An Appointment on Health Cover, Enroll under The Marketplace, File A Claim and SNAP’s Apply on Unemployment, File It on Tax Returns), the game’s own booking of a doctor’s visit is said before Book An Appointment, and enrolling is kept apart from being covered, as the glossary asks. The figures and the other countries are behind The Details.', ['first use', 'ordinary', 'details', 'explanation']),
    'money': ('It says what the Money line shows and what net worth means, then what moves the credit score up and down as a list a player can act on, and that the score is seen only when a life is made. Pressing Your Affairs opened what the chapter says it would.', ['first use', 'explanation']),
    'life': ('It opens your own page from the two places that open it, says what a birthday changes, and that death is a yearly chance the game never announces, without drama. It ends by saying how to read any chapter again.', ['ordinary', 'explanation']),
}
REVISED = {
    'advance': ('Each Advance line is named with its time as the menu shows it, and On The Way with its Advance and Cancel is explained before the first stop. But it said only that the clock stops at each commitment on the way, not what the stop’s answers do to the jump (the frame editor’s finding): Go carries it on, and Stand Here ends it there with the clock paused (`onGo` and `clearStandingAt`, `TimeControls.tsx`).',
                '“The clock still stops at each commitment to ask what you want to do: Go takes you to it and carries the jump on afterwards, and Stand Here ends the jump there, with the clock paused.”',
                ['ordinary', 'confirmation', 'details', 'explanation'], [t('tests/help-mechanics.test.ts', 'Stand Here ends the jump at the commitment with the clock paused, and Go carries it on')]),
    'calendar': ('Said in one sentence, who’s at a commitment needed rereading (“You’re there if you’re awake and out of hospital, and, for anything but your own care, in its town and not laid up by an injury; if not, you miss it.”), and it was wrong: it kept a player laid up from a plan of their own and from orientation, which `world/plans.ts` and the orientation’s own check never ask.',
                 'The sentence became a paragraph of its own: “You miss a commitment if you’re asleep or in hospital when it starts. An injury that lays you up also keeps you from classes, calls, performances, work-study shifts and an office appointment for your papers, though not from your doctor, your therapist, orientation or a plan of your own.”',
                 ['first use', 'ordinary', 'unavailable', 'explanation'], [t('tests/guide-chapter-facts.test.ts', 'keeps you from a class, and not from a plan of your own, orientation or your own care'), t('tests/guide-chapter-facts.test.ts', 'is said so: the injury keeps you from classes')]),
    'school': ('It said the note was “under Feedback on the piece”, which only a piece the course revises shows (the rest are under Work Shown), and nothing of how a note is put right, one of the things brief 17 names for the tutorial to teach.',
               'One sentence became three paragraphs’ worth: the note says what held the piece back; it comes as a notice and stays under Work Shown, or under Feedback on a piece the course will see again, where Work On The Note or the part’s steps before the next class take it; “Otherwise, a note stays open until a later piece, in any course, is shown with the part it named at 75% or more, or, for a note on an answer at the table, answers that question the way the text supports.” The 75% is `LEARNING.enough`. And two words a new player meets here are said in plain words where they first come (the material editor’s finding): “usually as an understudy, ready to go on if an actor can’t”, and “Blocking is where you move on stage, set at the early calls.”',
               ['first use', 'teacher', 'repeated', 'explanation'], [t('tests/guide-chapter-facts.test.ts', 'is said with its figure: a later piece, in any course'), t('tests/guide-chapter-facts.test.ts', 'a note on a part, given in one course, is put right in another'), t('tests/remaining-school.test.ts', 'the guide says whose each rule is')]),
    'profile': ('“Practice past 4 hours a day stops counting” said a fifth hour would run and count for nothing, where `practiceRefusal` refuses it and Practice An Hour is grayed out with the reason under it: a blocked action said as something else.',
                '“After four hours of practice in a day, more stops helping, so Practice An Hour is grayed out until tomorrow, with the reason under it.” And where the chapter first names them, a self-tape is “a scene you record yourself, as an actor does for a casting” and a brief’s beats “the moments where the scene turns” (the material editor’s finding: terms a new player meets unexplained).',
                ['ordinary', 'unavailable', 'explanation'], [t('tests/guide-chapter-facts.test.ts', 'refuses the hour past the day’s limit')]),
    'bank': ('Each paragraph is one control in the screen’s own words (Move Money’s From, To, Amount and Move It; Autopay’s button that says which and switches; Pay Card In Full turning into Pay What You Can), and the follow moved $10 at once between two Chase accounts and found every tab and button it names. But The Details said a US card’s introductory rate ends, and its penalty rate comes, with “a payment sixty days late”, where the game’s own late notice calls that moment thirty days late (the money editor’s finding).',
             '“In the US two payments missed in a row end any introductory rate, and where the card has a penalty rate, it applies after 45 days’ notice until six payments in a row are on time.”: the second due date missed in a row, `credit.missed >= 2`, which is what the game does.',
             ['ordinary', 'warning', 'overdue', 'details', 'explanation'], [t('tests/guide-chapter-facts.test.ts', 'ends it at the second payment missed in a row, not the first'), t('tests/guide-chapter-facts.test.ts', 'never sixty days late')]),
    'documents': ('The words were clear, but the F-1’s sixty days, OPT’s twelve months and its 90 days without work were typed copies of the rules, which the style guide says go stale.',
                  'The three figures are read from `STATUS_GRACE_DAYS.f1` and `WORK_RULES.opt` now; the player reads “for 60 days after your program ends” where it said “sixty days”, and the rest is as it was.',
                  ['ordinary', 'explanation'], [t('tests/tutorial.test.ts', 'gives every chapter an id of its own, a title, words and something to open')]),
}
for i, c in enumerate(CH):
    title = {'welcome': 'Your Life, Hour By Hour', 'calendar': 'What’s Coming', 'clock': 'The Clock', 'advance': 'Moving Time On', 'needs': 'What Needs You', 'body': 'How You Are', 'sleep': 'Sleep', 'looking-after': 'Looking After Yourself', 'plans': 'Your Own Plans', 'weather': 'Weather', 'school': 'Drama School', 'profile': 'You As An Actor', 'papers': 'Cover, Benefits And Returns', 'documents': 'Passports And ID', 'money': 'Money', 'bank': 'Your Bank', 'life': 'A Whole Life'}[c]
    src = [chap(c)] + (['src/engine/content/tutorial.ts#hoursOf'] if c == 'sleep' else [])
    ev = [{'kind': 'walk', 'ref': cfile(i, c)}] + follow
    where = f'The guide, chapter {i + 1} of 17, read in order on a new life or opened from Guide at any time'
    if c in KEPT:
        why, states = KEPT[c]
        row(f'The guide: “{title}”', where, src, states, 'Kept', why, ev)
    else:
        why, changes, states, tests = REVISED[c]
        row(f'The guide: “{title}”', where, src, states, 'Revised', why, ev + tests, changes)

# --- How This Works' frame -------------------------------------------------------------------------------------------
row('How This Works: the dialog, its trail, search and Close', 'Over any screen: How This Works on a panel, ? for the contents, / to search',
    ['src/ui/guide/Help.tsx#HelpProvider', 'src/ui/guide/Help.tsx#HelpDialog', 'src/ui/guide/Help.tsx#pageLabel', 'src/ui/guide/Help.tsx#HINT', 'src/ui/guide/Help.tsx#Results', 'src/engine/content/guide/index.ts#SEARCH_EXAMPLES'],
    ['first use', 'ordinary', 'empty', 'explanation'], 'Kept',
    'Its footer says the clock waits while you read, and it does: help-follow.mjs kept the help open 65 seconds with the clock on Play and the clock stayed at 7:30 AM, then moved once it closed. The trail names each page and goes back, an empty search suggests two searches that find entries, and a search with no match says to try fewer or different words or go back to Contents.',
    helpf + [t('tests/help-mechanics.test.ts', 'with the help open a minute passes and the clock and the save don’t move'), t('tests/guide.test.ts', 'suggests only searches that find an entry')])
row('How This Works: the contents', 'The help’s first page, from ? anywhere, or Contents in its trail',
    ['src/ui/guide/Help.tsx#Contents', 'src/ui/guide/Help.tsx#SCREEN_NAME', 'src/ui/guide/Help.tsx#screenName', 'src/ui/guide/Help.tsx#EntryLink'] + [i for i in ids if i.startswith('src/engine/content/guide/index.ts#GOALS')],
    ['first use', 'ordinary', 'locked', 'returning'], 'Kept',
    'It opens with On This Screen, the entries for the screen the help was opened over, then nine groups whose leads name their entries in the order they’re listed; an entry a guided life can’t use yet says Locked beside it, and the callout says how many chapters are read with Open The Guide. A player coming back finds the screen they’re on first.',
    helpf + [t('tests/help-mechanics.test.ts', 'opens the contents with Casting’s entries first')])
row('How This Works: an entry’s page, Show Everything, Show Me Where and the ways back', 'Any entry, from How This Works on its panel, the contents, a search or a link in another entry',
    ['src/ui/guide/Help.tsx#Entry', 'src/ui/guide/Help.tsx#CONNECTION_HEADING', 'src/ui/guide/HowItWorks.tsx#HowItWorks'],
    ['ordinary', 'locked', 'details', 'explanation'], 'Revised',
    'An entry opens on its summary, Where To Find It, When You Can Use It and Show Me Where, with What To Press open and every other section a press away, and on the built app Show Me Where landed on the stated screen and tab for all 70 entries, with Back To Help and Back To Home working, and with Show Everything pressed every word of every entry was on the page. But one shut feature made the whole entry say it wasn’t open: How You Are’s entry, its panel open from “How You Are” and its own page from “A Whole Life”, told a player using the panel for eleven chapters “This isn’t open yet. Read “A Whole Life” in the guide to open it.”, while the contents marked it open.',
    helpf + entries + [t('tests/help-mechanics.test.ts', 'says only the rest waits on'), t('tests/help-mechanics.test.ts', 'Show Everything and Show Less name what a press does'), t('tests/guide.test.ts', 'sends the player only to a screen and a tab that exist')],
    'An entry part open says “Part of this isn’t open yet. Read “A Whole Life” in the guide to open the rest.”, with Read About It; one wholly shut still says “This isn’t open yet. Read “…” in the guide to open it.” (How You Are’s entry and Passport And ID’s are the two whose features open in two chapters.)')

# --- How This Works' entries -----------------------------------------------------------------------------------------
def entry(file, decl, eid): return f'src/engine/content/guide/{file}#{decl} [{eid}]'
REV = [
    ('start.ts', 'START', 'start.find', 'Finding Your Way', 'Home, the menu and the breadcrumbs',
     'Its worked example pressed H on School and then a School breadcrumb, which Home never shows: going to a screen already in the breadcrumbs cuts them back to it, and Home is the first. help-follow.mjs found no School breadcrumb on Home. It also called the ? key’s page “the guide’s contents”, which is How This Works’, a different thing to a player who has just read the guide.',
     'The example presses P for the Player Profile and then School in the breadcrumbs, and says H instead starts the breadcrumbs again from Home; “the guide’s contents” is “How This Works’ contents”, twice.',
     ['ordinary', 'returning', 'explanation'], [t('tests/help-mechanics.test.ts', 'Finding Your Way’s example, played')]),
    ('body.ts', 'BODY', 'body.sleep', 'Sleep', 'The top bar’s Sleep, and its dialog',
     'Its first view gave the dialog’s range as bare figures, “from 0.5 to 14”, where the chapter and the dialog say half an hour and hours.',
     '“from half an hour to 14 hours”, by a helper reading `SHORTEST_SLEEP` and `LONGEST_NIGHT` (`hoursWords`, new); the rest is as it was.',
     ['ordinary', 'explanation'], [t('tests/guide-examples-start-day-body.test.ts', 'body.sleep: the measured evening')]),
    ('coursework.ts', 'COURSEWORK', 'coursework.table', 'Table Work', 'School, Coursework, Table Work',
     '“A note about an answer is taken when the piece is shown again with an answer the text supports” was the passive the brief asks to translate, and left out a later piece, which puts the note right too when it answers the same question as the text supports (`show`).',
     '“You put a note about an answer right when this piece, shown again, or a later one answers that question the way the text supports.”',
     ['ordinary', 'teacher', 'explanation'], [t('tests/guide-examples-coursework.test.ts', 'reads the answers the text supports')]),
    ('coursework.ts', 'COURSEWORK', 'coursework.feedback', 'Feedback And Your Notes', 'School, Coursework: the feedback notice, Work Shown, a revised piece’s Feedback, Your Notes',
     'Its first view said what a note is and that a note comes back saying whether it’s still there, and nothing of how to put one right; and later it said a note “is marked taken” once its part “has come right”, the phrasing the brief names. Its example said the note was “taken at the next class”.',
     'The summary says “You put one right when a later piece is shown with the part it named at 75% or more, or, for a note on an answer at the table, with that question answered the way the text supports.” Later On says Your Notes marks the note Taken, with the day, and when it can be given again (under 45%); a piece in rounds “can put the note right” at a later round; the example says the next class “counts the note as taken”.',
     ['teacher', 'repeated', 'success', 'history', 'explanation'], [t('tests/guide-examples-coursework.test.ts', 'names the part short by the most of its weight, in its own words, and takes the note on the work done')]),
    ('coursework.ts', 'COURSEWORK', 'coursework.approach', 'Another Way At A Note', 'School, Coursework, A Note That Keeps Coming Back',
     'Its next step read “the a targeted drill”, the label lowercased after an article, and it said a part “takes the note” and “the note is taken once it’s far enough”, which says neither who does it nor how far.',
     '“None of them puts the note right by itself: the part still has to be at 75% or more when the piece is shown.”; “you’ve put the note right, however the part got there”; “Do the work your choice asks for: the drill once a day, the steps on the part, or a rehearsal with your partner, booked under Rehearsing With.”; “at 75% or more when the piece is shown, it puts the note right”.',
     ['repeated', 'teacher', 'recommendation', 'explanation'], [t('tests/guide-examples-coursework.test.ts', 'moves the lines by the drill once a day, takes the note at a showing past enough')]),
    ('productions.ts', 'PRODUCTIONS', 'productions.notes', 'The Director’s Notes', 'School, Casting, The Rehearsal Process',
     'It named a settled note’s status as Taken or Not Taken alone, and told the player to check that it shows Taken, where a note on the craft shows Resolved, Taken: Better or Tried: Learned From, Not Moved (`OUTCOME_WORD`, `RehearsalProcess.tsx`); and it said a craft note left to the calls “is taken only if” its problem has gone.',
     'What To Press names every status a note can show; What To Do Next checks for Taken, or Resolved or Taken: Better on a craft note; the mistake says the next call “marks it Resolved only if its problem has gone from the forecast by then”.',
     ['director', 'repeated', 'explanation'], [t('tests/guide-examples-productions.test.ts', 'has a play for every productions entry, and no other')]),
    ('productions.ts', 'PRODUCTIONS', 'productions.playing', 'How You’ll Play A Part', 'School, Casting, How You’ll Play It',
     'One line said a note on the director’s request “is taken at the next call if the choice has changed”, a passive with no one doing the changing.',
     '“the next call marks it Taken if you’ve changed the choice by then”.',
     ['director', 'explanation'], [t('tests/guide-examples-productions.test.ts', 'has a play for every productions entry, and no other')]),
    ('productions.ts', 'PRODUCTIONS', 'productions.part', 'Learning A Part', 'School, Casting, The Rehearsal Process',
     'Its first view named blocking, and its figures being off book, without saying what either is, which a player who isn’t an actor can’t know (the material editor’s finding).',
     '“You learn a part’s lines and its blocking, where you move on stage, …”; Off Book’s figure opens “Knowing your lines without the script, asked for 40% of the way through the calls”.',
     ['first use', 'ordinary', 'explanation'], [t('tests/guide-examples-productions.test.ts', 'has a play for every productions entry, and no other')]),
    ('productions.ts', 'PRODUCTIONS', 'productions.nights', 'The Nights', 'School, Casting; a night’s look from your work',
     'It sent the player to “Part By Part” in a night’s look, whose heading is Moment By Moment (`ui/looks/actor.tsx`), and its example gave the workload to two places, where the screen gives one (`workloadWords`): the school editor’s two findings, both holding against the code.',
     '“Moment By Moment shows each movement”; the example’s workload is `toFixed(1)`, and tests/guide-examples-productions.test.ts holds it to the same figure as before, now to one place.',
     ['ordinary', 'history', 'explanation'], [t('tests/guide-examples-productions.test.ts', 'has a play for every productions entry, and no other')]),
    ('craft.ts', 'CRAFT', 'craft.profile', 'The Player Profile', 'Player Profile',
     'Its first view put a map of eight panels, one sentence of 70 words with seven semicolons, between how to open the Profile and that looking moves no clock, and called What To Work On Next “what to work on next”; and its figures described the advice card as it was before brief 16 put its reasons behind Why This Recommendation.',
     'The map is a paragraph of its own after those two sentences, and names What To Work On Next by its title and the techniques as “the 17 skills the school trains”. And from the profile editor’s finding, its What Decides It no longer says the advice’s weakness comes “with “From your record:”” or its preparation “on the first line”: The First Line became What The Card Shows, “What to work on, why now, what the record shows of it now, the next hour of its exercise … and the estimate. Why This Recommendation holds the rest: …”, the rest in the order the button opens it, as `AdviceCard` and `adviceSummary` draw it.',
     ['first use', 'recommendation', 'explanation'], [t('tests/guide-examples-craft.test.ts', 'The Player Profile: the ability opens to its look'), t('tests/guide-chapter-facts.test.ts', 'is said so: the record under From Your Record and the rest behind Why This Recommendation'), t('tests/defects-r8-1.test.ts', 'names it with the pieces it has held back for life')]),
    ('craft.ts', 'CRAFT', 'craft.practice', 'Practice', 'Player Profile, the Practice column',
     '“Only 4 hours of practice a day count.” said a fifth hour counts for nothing, where it’s refused and the button grayed out with its reason.',
     '“After 4 hours of practice in a day, more stops helping, and Practice An Hour is grayed out until tomorrow, with the reason under it.”',
     ['ordinary', 'unavailable', 'explanation'], [t('tests/guide-examples-craft.test.ts', 'Practice: an hour, the repeat'), t('tests/guide-chapter-facts.test.ts', 'refuses the hour past the day’s limit')]),
    ('money.ts', 'MONEY', 'bank.card-offers', 'A Card’s Offers', 'Your Bank, Cards, The Card’s Offers',
     'Its first view was one sentence of 75 words, the payment plan and the plan Chase makes free folded into the list of offers in brackets.',
     'The offers are one sentence, moving a balance another, and the payment plan has its own paragraph: “A payment plan pays off part of your purchases in equal monthly amounts, for a fixed monthly fee instead of interest. A plan made at Chase while the card’s introductory rate lasts is free for its whole life.” And The Introductory Rate and A Plan’s Fee say “two payments missed in a row” end the rate, where they said “a payment sixty days late” (the money editor’s finding; `credit.missed >= 2`).',
     ['first use', 'explanation'], [t('tests/guide-examples-money.test.ts', 'has a play for every money entry, and no other'), t('tests/guide-chapter-facts.test.ts', 'never sixty days late')]),
    ('money.ts', 'MONEY', 'bank.card', 'A Credit Card', 'Your Bank, Cards, each card’s panel',
     'It said a US card’s penalty rate comes, and its introductory rate ends, with “a payment sixty days late”, where the game’s own late notice calls that moment thirty days late and both come at the second due date missed in a row; and its first step described the panel as “its terms line by line”, which the money editor’s branch folds away.',
     '“On a US card with a penalty rate, two payments missed in a row bring 45 days’ notice and then that rate, until six payments in a row are on time. Two missed in a row also end any introductory rate.”; the first step names the panel’s figures and “then its terms”, true of the panel as it is and as the money branch draws it, naming nothing the base doesn’t have.',
     ['ordinary', 'overdue', 'warning', 'explanation'], [t('tests/guide-chapter-facts.test.ts', 'ends it at the second payment missed in a row, not the first'), t('tests/guide-examples-money.test.ts', 'has a play for every money entry, and no other')]),
    ('day.ts', 'DAY', 'day.advance', 'Moving Time On', 'The top bar’s Advance menu',
     'Its last step named a stop’s answers, “Go, Stand Here, Skip It on a plan of yours, or Call It Off on a rehearsal with a classmate”, without saying what Go and Stand Here do to the jump (the frame editor’s finding).',
     '“At each stop, answer the dialog: Go to be there and carry the jump on, or Stand Here to end the jump there, with the clock paused. A plan of yours also offers Skip It, and a rehearsal with a classmate Call It Off.”',
     ['ordinary', 'confirmation', 'explanation'], [t('tests/help-mechanics.test.ts', 'Stand Here ends the jump at the commitment with the clock paused, and Go carries it on')]),
    ('taxes.ts', 'TAXES', 'taxes.return', 'Your Tax Return', 'Papers, Tax Returns, each year’s panel',
     'Its first step said each year’s panel shows “Due and its date, or Filed once it’s in”; on the papers editor’s branch a return past its day says it’s late, which those words don’t cover (the papers editor’s finding).',
     '“Each year has a panel headed with the year, and under it the day the return is due, or the day it was filed once it’s in.”, which the panel says on this base (Due …, Filed …, Filed by the IRS …) and on the papers branch.',
     ['ordinary', 'overdue', 'explanation'], [t('tests/guide-examples-papers.test.ts', 'taxes.return: on time costs the balance')]),
    ('papers.ts', 'PAPERS', 'papers.doctor', 'The Doctor And The Pharmacy', 'Papers, Health Cover, Your Doctor',
     'It opened “About twice a year a week brings a doctor’s visit”, the weekly draw and the yearly rate in one clause, which has to be read twice.',
     '“About twice a year you need a doctor, and the game books the visit for you at your doctor’s practice, …”, the rest as it was.',
     ['first use', 'ordinary', 'explanation'], [t('tests/guide-examples-papers.test.ts', 'papers.doctor: a visit slept through is booked again')]),
]
revised_ids = set()
for f, decl, eid, title, where, why, changes, states, tests in REV:
    src = [entry(f, decl, eid)] + (['src/engine/content/guide/body.ts#hoursWords'] if eid == 'body.sleep' else [])
    revised_ids.update(src)
    row(f'How This Works: {title}', where, src, states, 'Revised', why, helpf + entries + [routes] + tests, changes)

GROUPS = [
    ('start.ts', 'Getting Started: Home And Where You Are, The Guide And This Help', 'Home, and the help’s Getting Started',
     'Home’s entry says which words open what and that reading changes nothing; the guide’s says the clock waits and that reading changes only which chapters you’ve read, and its worked example is the callout help-follow.mjs found: the guide at the chapter pressed, saying which comes first.',
     ['first use', 'locked', 'explanation'], [t('tests/guide-examples-start-day-body.test.ts', 'start.guide: two chapters read')]),
    ('day.ts', 'Your Day And The Clock: The Calendar, The Clock, Moving Time On, What Needs You, Your Own Plans, The Weather', 'Home’s panels, the top bar and the Calendar screen',
     'Read against the clock’s code: the stop’s Go, Stand Here, Skip It and Call It Off, who can be at a commitment from a hospital bed or laid up (the exceptions the chapter now says too), the hold while help is open, the night slept by itself and What Needs You’s six-and-more. help-follow.mjs measured the hold, and the Sleep dialog not holding the clock, as The Clock’s entry says.',
     ['ordinary', 'notification', 'overdue', 'confirmation', 'unavailable', 'explanation'], [t('tests/guide-examples-start-day-body.test.ts', 'day.calendar: Tomorrow Morning stops at Registration'), t('tests/guide-examples-start-day-body.test.ts', 'day.needs: Dismiss and Mark 2 Read')]),
    ('body.ts', 'Looking After Yourself: How You Are, Looking After Yourself', 'Home’s How You Are, the top bar’s Look After Yourself',
     'How You Are’s three ways into your own page match Home (the line at the top, the panel’s name, your name), and each of Look After Yourself’s thirteen reasons a line is gray says what to do: sleep first, wait until you’re hungry, set The Day’s Spending to In Cash, Then The Debit Card.',
     ['ordinary', 'unavailable', 'explanation'], [t('tests/guide-examples-start-day-body.test.ts', 'body.look-after: Eat A Meal first and Most Worth It')]),
    ('school.ts', 'Staying At School: Standing And Classes, Calling In Sick, Orientation, Leave, Repeating, What You Owe, Work-Study', 'School: Standing And Craft, Classes, Coursework, Terms And Award, Shifts And Pay',
     'Each opens on what the rule means for you (a standing drops a step at the review; a leave needs notice eight weeks ahead; an Incomplete needs its sessions in 30 days), then its buttons by their labels and every refusal in the game’s words; Calling In Sick says what it excuses and what a well student’s press says, which brief 15’s follow saw grayed.',
     ['ordinary', 'warning', 'overdue', 'unavailable', 'history', 'explanation'], [t('tests/guide-examples-school.test.ts', 'Calling In Sick: a first-year’s Monday with the flu')]),
    ('coursework.ts', 'Coursework And Partners: Preparing Coursework, How You’ll Play A Scene, Rehearsing With A Partner, Your Class, Working A Problem Through', 'School, Coursework',
     'Preparing Coursework’s first view says what a step does and how the band sets a class’s growth; the partner and class entries give trust’s figures and each no in the classmate’s own words; the step labels (Read The Scene, Learn Lines, Rehearse Alone) are the cards’, checked against `content/coursework.ts`. The quotes of the coordinator’s words are listed in the report.',
     ['ordinary', 'classmate', 'repeated', 'unavailable', 'explanation'], [t('tests/guide-examples-coursework.test.ts', 'takes the time it says, moves each part to the figure it says')]),
    ('productions.ts', 'Productions And Casting: Casting, Cabaret And Summer Cabaret, Plays To Read', 'School, Casting and Coursework',
     'Casting says who casts and how every student is read before Why This Cast’s columns, the Cabaret says its dates, its pay and who can join, with a refusal in the button’s place, and Plays To Read says why none of its plays is performed: their texts are under copyright.',
     ['ordinary', 'director', 'unavailable', 'explanation'], [t('tests/guide-examples-productions.test.ts', 'has a play for every productions entry, and no other')]),
    ('craft.ts', 'Your Craft: Genres, Preparing A Brief, A Reading And A Way To Play It, Who Reads With You, Taping A Brief, A Piece Of Work, Your Work So Far', 'Player Profile, and a brief’s pane',
     'The brief entries go in the order a tape is made (prepare, choose a reading and a way, choose a reader, tape), each naming the pane’s buttons (Break It Down, Read It This Way, Read With Them, Tape It (60 Min)); “take” is kept for a self-tape only, as the glossary allows. Your Work So Far says it adds nothing to any result.',
     ['ordinary', 'recommendation', 'forecast', 'history', 'explanation'], [t('tests/guide-examples-craft.test.ts', 'Taping A Brief: the take beat by beat')]),
    ('money.ts', 'Money And The Bank: Your Affairs, Accounts, Moving Money, Term Deposits, Keeping An Account, Round-Ups, How You Pay, Cash, Card Security, Overdrafts And Loans, Another Bank, A Bank At Home', 'Home’s Money line and Your Bank’s five tabs',
     'Every fee and condition is in the entry before any button that charges it (a Chase account’s $15 and its waivers, another machine’s $3 plus $3.22, a cash advance’s $10 and 28.49%), bank payments are said by when they run and what happens if an account is short (an order goes in full or not at all; autopay fails whole), and refusals keep the money shape: “… has only … available, so nothing was moved.”',
     ['ordinary', 'warning', 'overdue', 'failure', 'unavailable', 'confirmation', 'explanation'], [t('tests/guide-examples-money.test.ts', 'leaves a live save byte for byte as it was, every example played beside it')]),
    ('papers.ts', 'Papers: Papers, Health Cover, Conditions And Therapy, Unemployment And Assistance, Pensions', 'Papers: Health Cover and Unemployment',
     'Each says first what covers you or pays you and when (Yale Health billed each term; Enroll from 60 days before it ends; a Connecticut claim waits until you’ve left school), keeps enrolling apart from being covered and applying apart from holding, and names Keep It Up and Let It Go as Your Long-Term Conditions shows them.',
     ['ordinary', 'overdue', 'unavailable', 'explanation'], [t('tests/guide-examples-papers.test.ts', 'papers.health-cover: a spring graduate’s cover ends on 1 August')]),
    ('taxes.ts', 'Papers: Your Tax Return, Paying Tax Owed, Payment Plans And Waivers, A Tax Lien', 'Papers, Tax Returns',
     'The return’s entry says the game prepares it each February 1 and File It sends it, with the deadline and what late costs in its first view; what’s owed is said in its three parts in their order on screen, and the levy’s days are said before any letter comes.',
     ['ordinary', 'overdue', 'warning', 'explanation'], [t('tests/guide-examples-papers.test.ts', 'taxes.return: on time costs the balance')]),
    ('documents.ts', 'Papers: Passport And ID, Permission To Work, Residence Abroad', 'Papers, Passport And ID and Permission To Work',
     'Applying is kept apart from holding in the first view (“a paper counts only once it’s issued and arrives”), Report Lost’s two presses are named with what can’t be undone, and each refusal of Get says which document or number to get first. The F-1’s grace and OPT’s days are the rule’s figures.',
     ['ordinary', 'confirmation', 'unavailable', 'explanation'], [t('tests/guide-examples-papers.test.ts', 'documents.passport-id: a stolen ID card reported and replaced')]),
]
claimed = set()
for r in rows: claimed.update(r['sources'])
for f, title, where, why, states, tests in GROUPS:
    src = [i for i in ids if i.startswith(f'src/engine/content/guide/{f}#') and i not in claimed]
    claimed.update(src)
    row(f'How This Works: {title}', where, src, states, 'Kept', why, helpf + entries + [routes] + tests)
left = [i for i in ids if i not in claimed]
assert not left, left
json.dump(rows, open(f'{C}/docs/text/surfaces/tutorial.json', 'w'), ensure_ascii=False, indent=1)
open(f'{C}/docs/text/surfaces/tutorial.json', 'a').write('\n')
print(len(rows), 'rows', sum(len(r['sources']) for r in rows), 'sources claimed', sum(r['outcome'] == 'Revised' for r in rows), 'revised')
