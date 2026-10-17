/**
 * SLATE — original contemporary scenes for scene study (from 2026-10-08).
 *
 * The Bulletin's Acting I explores "twentieth- and twenty-first-century
 * playwrights", and the rest of the bank stops at 1930: a play published after
 * 1930 is still under US copyright, so its text isn't reproduced here, and
 * SLATE doesn't invent a scene and put it to a real playwright either
 * (`docs/research/world/research-contemporary-material.json`). These eight
 * were written for SLATE, set between 2000 and 2026, and are shown as SLATE's
 * own. None is an adaptation of a play or a film.
 *
 * A public-domain scene's readings rest on its play. These have no play
 * behind them, so each carries `facts`: the given facts its readings rest on,
 * and every `why` names the fact it leans on or the fact it runs into. The
 * scenes hold no dialogue, the same as the rest of the bank.
 *
 * Only the types come from `coursework.ts`: it imports this file, so a value
 * import back would be circular. The two helpers are local copies of its own.
 */

import type { Scene, Option } from './coursework';

const yes = (id: string, text: string, why?: string): Option => ({ id, text, supported: true, ...(why ? { why } : {}) });
const no = (id: string, text: string, why: string): Option => ({ id, text, supported: false, why });

const BY = 'An original scene written for SLATE';

export const ORIGINAL_SCENES: readonly Scene[] = [
  {
    id: 'orig-night-desk', play: 'The Night Desk', by: BY, year: 2026, where: 'The front desk of a motel off the interstate, two in the morning, January 2017', language: 'prose', size: 'short', genre: 'comedy', difficulty: 1, origin: 'original',
    summary: 'A young man stranded by a snowstorm reaches the night desk of a highway motel with a card that keeps getting declined and eleven dollars in his wallet. He bargains, pleads and offers to work off the room; the clerk, who can’t give away the last one, finds another way to keep him out of the snow.',
    facts: [
      'It’s two in the morning, the interstate is closed by snow, and the motel has one room left.',
      'The guest’s card has been declined twice, and he has eleven dollars in cash.',
      'The clerk can’t give a room away; her manager reads the night’s report at seven.',
      'He’s driving to his sister’s wedding, where he’s giving the toast at noon.',
      'The clerk has worked nights at this desk for nine years, and there’s a cot in the back office.',
    ],
    circumstances: [
      yes('storm', 'The middle of a snowy night, the highway shut, one room left and nowhere else to go', 'The interstate is closed by snow and the motel has one room left.'),
      no('checkout', 'A busy morning at checkout, with a line behind him', 'It’s two in the morning; the manager doesn’t read the report until seven.'),
      no('resort', 'A beach resort in high season', 'It’s a motel off the interstate in a January snowstorm.'),
    ],
    relationship: [
      yes('strangers', 'Strangers: a worn-out traveler and the one person awake to decide his night', 'He’s passing through on the way to a wedding, and she has the desk to herself.'),
      no('regular', 'A regular guest and the clerk who knows him', 'He’s on a one-time drive to his sister’s wedding.'),
      no('family', 'Mother and son', 'They met tonight; his family is at the wedding ahead of him.'),
    ],
    roles: [
      {
        name: 'Rosa',
        objective: [
          yes('rules', 'Keep her job and her rules intact without sending a kid back into a blizzard', 'She can’t give a room away and the manager reads the report at seven, but the road is closed.'),
          yes('quiet', 'Get her quiet night back, whatever it takes', 'She has worked nights here for nine years, and he’s the only thing between her and the hours till seven.'),
          no('profit', 'Squeeze the most money out of him', 'He has eleven dollars; there’s no money to squeeze.'),
        ],
        obstacle: [
          yes('report', 'The night’s report goes to her manager at seven, and a free room shows on it', 'Her manager reads the report at seven, and she can’t give the room away.'),
          no('full', 'The motel is full', 'There’s one room left; the trouble is paying for it.'),
        ],
        tactic: [
          yes('test', 'Make him earn it: let him talk and see how far he’ll go', 'She holds the last room and the only cot, so she can afford to hear him out.'),
          yes('deadpan', 'Answer every plea flatly, as if she’s heard it all', 'She has worked nights at this desk for nine years, and his story isn’t new to her.'),
          no('call', 'Call the police to have him removed', 'He’s offering to pay and work, not causing trouble, and the road out is closed.'),
        ],
      },
      {
        name: 'Theo',
        objective: [
          yes('room', 'Get a bed tonight, any bed, so he’s fit to give the toast', 'He’s giving the toast at his sister’s wedding at noon.'),
          yes('dignity', 'Get through this without admitting how broke he is', 'His card has been declined twice and he has eleven dollars; every offer he makes is a way round saying so.'),
          no('complain', 'Get the motel to apologize for its service', 'The declined card is his bank’s doing; the motel has done him no harm.'),
        ],
        obstacle: [
          yes('money', 'He can’t pay: a declined card and eleven dollars', 'His card has been declined twice, and he has eleven dollars in cash.'),
          no('rival', 'Another guest wants the last room', 'He’s the only guest at the desk at two in the morning.'),
        ],
        tactic: [
          yes('bargain', 'Bargain, offering what he has: the eleven dollars, an IOU, his watch', 'He has eleven dollars and needs a room that costs more.'),
          yes('labor', 'Offer to work for it: shovel the lot, mop the lobby', 'The snow is still falling, and he has more time than money.'),
          no('threaten', 'Threaten to write a bad review unless she gives in', 'He needs her goodwill; she holds the only room for miles.'),
        ],
      },
    ],
  },
  {
    id: 'orig-bed-fourteen', play: 'Bed Fourteen', by: BY, year: 2026, where: 'The nurses’ station of a hospital medical floor, four in the morning, 2008', language: 'prose', size: 'medium', genre: 'drama', difficulty: 2, origin: 'original',
    summary: 'A nurse three weeks out of orientation hung the wrong bag of fluid on bed fourteen, and the charge nurse caught it ten minutes later. At the station in the dead hours, the two of them have to decide what goes in the report, and the charge nurse has a mistake of her own she never reported.',
    facts: [
      'The new nurse hung the wrong bag of fluid on bed fourteen; the charge nurse caught it within ten minutes, and the patient is unharmed.',
      'Every error has to be reported before the shift ends at seven.',
      'The new nurse is three weeks out of orientation and already has one report on file.',
      'Twenty years ago the charge nurse made an error of her own and never reported it.',
      'It’s four in the morning, and the two of them are alone at the station.',
    ],
    circumstances: [
      yes('dead-hours', 'The quiet hours before dawn, alone at the station, with the report due by seven', 'It’s four in the morning, they’re alone, and the report is due before the shift ends.'),
      no('crisis', 'The middle of a code, with the patient crashing', 'The patient is unharmed; the error was caught within ten minutes.'),
      no('hearing', 'A disciplinary hearing in the director’s office', 'There’s no hearing yet; the report hasn’t been written.'),
    ],
    relationship: [
      yes('mentor', 'A senior nurse and a beginner she’s responsible for, on the same shift', 'The new nurse is three weeks out of orientation, and the charge nurse runs the floor.'),
      no('friends', 'Old friends who trained together', 'One is three weeks out of orientation; the other made her own error twenty years ago.'),
      no('enemies', 'Rivals for the same promotion', 'Their trouble is one report and what goes in it.'),
    ],
    roles: [
      {
        name: 'Priya',
        objective: [
          yes('keep-job', 'Keep the error off her record, since a second report puts her under review', 'She already has one report on file, three weeks out of orientation.'),
          yes('do-right', 'Find out whether she’s fit to be a nurse at all', 'The patient is unharmed, but she hung the wrong bag, and only the charge nurse caught it.'),
          no('blame', 'Pin the error on the pharmacy', 'She hung the bag herself, and the charge nurse saw it.'),
        ],
        obstacle: [
          yes('rule', 'Every error has to be reported, and the one person who could leave it out is her boss', 'Every error has to be reported before seven, and the charge nurse caught it.'),
          no('patient', 'The patient is threatening to sue', 'The patient is unharmed and, at four in the morning, asleep.'),
        ],
        tactic: [
          yes('confess', 'Own it completely, and hope honesty counts for something', 'She can’t deny it; the charge nurse caught it herself.'),
          yes('plead', 'Plead her case: three weeks in, one mistake, no harm done', 'The patient is unharmed and she’s three weeks out of orientation.'),
          no('lie', 'Insist it was the right bag', 'The charge nurse caught the wrong bag within ten minutes.'),
        ],
      },
      {
        name: 'Lorraine',
        objective: [
          yes('teach', 'Make sure the girl never does it again, whatever the report says', 'The patient is unharmed this time; the next one might not be.'),
          yes('reckon', 'Settle, for herself, the error she never reported', 'Twenty years ago she made an error of her own and never reported it.'),
          no('fire', 'Get the new nurse fired', 'She caught the error and is the one weighing whether to report it.'),
        ],
        obstacle: [
          yes('own-past', 'Her own unreported mistake makes her a hypocrite either way', 'She never reported her own error twenty years ago.'),
          no('time', 'She has no time to talk; the floor is in chaos', 'It’s four in the morning and the two of them are alone at the station.'),
        ],
        tactic: [
          yes('question', 'Question her closely, step by step, before deciding anything', 'The report is due by seven, so there are three hours to decide.'),
          yes('story', 'Tell her the story of her own error, twenty years ago', 'Twenty years ago she made an error of her own and never reported it; the story is hers to tell.'),
          no('ignore', 'Pretend it never happened and walk away', 'She caught it, and the rule says it’s reported by seven.'),
        ],
      },
    ],
  },
  {
    id: 'orig-what-we-keep', play: 'What We Keep', by: BY, year: 2026, where: 'Their late father’s apartment, half packed into boxes, a Saturday in 2012', language: 'prose', size: 'long', genre: 'drama', difficulty: 3, origin: 'original',
    summary: 'A sister and brother clear their father’s apartment the weekend before the keys go back. The argument is over his records, the only thing either of them has asked for, until the brother finds a drawer of every postcard he ever sent home.',
    facts: [
      'Their father died three weeks ago, and the landlord wants the keys back by Sunday.',
      'The sister lives twenty minutes away and drove him to every appointment for his last four years.',
      'The brother flew in from Seattle yesterday and flies back Monday.',
      'The father left no will, and the only thing either of them has asked for is his record collection.',
      'In a kitchen drawer the brother has found every postcard he ever sent home, in order.',
    ],
    circumstances: [
      yes('deadline', 'The last weekend before the keys go back, the apartment half in boxes', 'The landlord wants the keys back by Sunday.'),
      no('funeral', 'The day of the funeral, with guests arriving', 'He died three weeks ago; this is the clearing out.'),
      no('sale', 'Showing the apartment to buyers', 'The landlord wants the keys back; the apartment was never theirs to sell.'),
    ],
    relationship: [
      yes('siblings', 'A sister who stayed and a brother who left, grieving the same man differently', 'She lives twenty minutes away and drove him for four years; he flew in yesterday.'),
      no('close', 'Siblings who talk every day', 'He lives in Seattle and only flew in yesterday.'),
      no('step', 'Stepsiblings who barely know each other', 'He’s their father; both of them grew up with him.'),
    ],
    roles: [
      {
        name: 'Ruth',
        objective: [
          yes('acknowledged', 'Have her brother say out loud what the last four years cost her', 'She drove their father to every appointment for four years.'),
          yes('records', 'Keep the records, the one thing she asked for', 'The only thing either of them has asked for is the record collection.'),
          no('sell', 'Sell everything quickly and split the money', 'She wants the records kept; that’s the fight.'),
        ],
        obstacle: [
          yes('postcards', 'The postcards show the father treasured the son who left', 'Their father kept every postcard Paul sent home, in order, in a kitchen drawer.'),
          no('will', 'The will leaves everything to her brother', 'There’s no will.'),
        ],
        tactic: [
          yes('ledger', 'Count it up: every appointment, every drive', 'She drove him to every appointment for his last four years.'),
          yes('busy', 'Keep packing, and refuse to stop and talk', 'The keys go back Sunday; there’s work that has to get done.'),
          no('lawyer', 'Threaten to bring in a lawyer over the will', 'There’s no will to fight over.'),
        ],
      },
      {
        name: 'Paul',
        objective: [
          yes('belong', 'Prove he was part of his father’s life too', 'The postcards in the drawer are his proof, kept in order.'),
          yes('records-too', 'Take the records home with him, a piece of the father he left', 'He asked for the record collection too.'),
          no('stay', 'Move back home for good', 'He flies back to Seattle Monday.'),
        ],
        obstacle: [
          yes('absent', 'He wasn’t there for the last four years, and she was', 'She drove their father to every appointment; he lived in Seattle.'),
          no('money', 'He can’t afford the flight home', 'His flight back is Monday; money doesn’t come into it.'),
        ],
        tactic: [
          yes('show', 'Show her the postcards and let them speak for him', 'He found every postcard he ever sent home, in order.'),
          yes('joke', 'Joke and reminisce to keep the fight from starting', 'He’s only here till Monday, and the boxes are full of things they both remember.'),
          no('ultimatum', 'Tell her he’s taking everything unless she gives in', 'He asked for the records alone, and so did she.'),
        ],
      },
    ],
  },
  {
    id: 'orig-runway', play: 'Runway', by: BY, year: 2026, where: 'A rented desk in a shared office, after everyone else has gone home, 2015', language: 'prose', size: 'medium', genre: 'comedy', difficulty: 2, origin: 'original',
    summary: 'Two college friends built an app for splitting restaurant bills, and it has four months of money left. One of them has already said yes, by email, to a bigger company that wants to hire them both and shut the app down. The other found out an hour ago, and they end up splitting everything they own, fairly, to the cent.',
    facts: [
      'Their company makes an app for splitting restaurant bills, and it has four months of money left.',
      'A larger company has offered to hire both of them and shut the app down.',
      'One of them has already said yes by email; the other found out an hour ago.',
      'They’ve been friends since their first year of college, and they share an apartment.',
      'Their investors meet them at nine tomorrow morning.',
    ],
    circumstances: [
      yes('after-hours', 'Late at night in an empty shared office, with the investors due at nine', 'The investors meet them at nine tomorrow morning.'),
      no('launch', 'The night of the app’s launch party', 'The app has four months of money left; the launch is long past.'),
      no('boardroom', 'In front of the investors', 'That meeting is tomorrow at nine; tonight it’s the two of them.'),
    ],
    relationship: [
      yes('friends', 'College friends, roommates and business partners, all three at once', 'Friends since their first year of college, they share an apartment.'),
      no('strangers', 'Partners who met through a hiring site', 'They’ve been friends since their first year of college.'),
      no('boss', 'An employer and an employee', 'They’re co-founders; the offer is to hire both of them.'),
    ],
    roles: [
      {
        name: 'Nate',
        objective: [
          yes('forgive', 'Get his friend to forgive him before morning', 'He said yes by email without telling him; the investors meet them at nine.'),
          yes('safe', 'Get them both a paycheck before the money runs out', 'There are four months of money left and the offer hires them both.'),
          no('keep-app', 'Save the app at any cost', 'He accepted an offer that shuts it down.'),
        ],
        obstacle: [
          yes('betrayal', 'He went behind his partner’s back, and they both know it', 'He said yes by email, and his partner found out an hour ago.'),
          no('lawsuit', 'The bigger company is suing them', 'It wants to hire them.'),
        ],
        tactic: [
          yes('math', 'Run the numbers, calmly, as if the decision were arithmetic', 'Four months of money left is a number he can point to.'),
          yes('charm', 'Lean on fifteen years of friendship and the old jokes', 'They’ve been friends since college and still share an apartment.'),
          no('deny', 'Deny he ever sent the email', 'His partner found out an hour ago; the email exists.'),
        ],
      },
      {
        name: 'Leah',
        objective: [
          yes('fair', 'Make him pay for going behind her back, split down to the cent', 'They built an app for splitting bills; he decided alone.'),
          yes('vote', 'Get the yes taken back before nine', 'The investors meet them at nine tomorrow; until then the yes is one email.'),
          no('quit-friends', 'End the friendship and move out tonight', 'They share an apartment; the fight is over the company.'),
        ],
        obstacle: [
          yes('money', 'He’s right about the money: four months', 'The app has four months of money left.'),
          no('investors', 'The investors have already shut the company down', 'The investors meet them tomorrow; they haven’t decided anything.'),
        ],
        tactic: [
          yes('split', 'Divide everything with mock precision: the plant, the stapler, the couch at home', 'The app splits bills; she can split a friendship the same way.'),
          yes('silence', 'Say little and make him fill the quiet', 'He’s the one who has explaining to do.'),
          no('agree', 'Agree to the deal at once', 'She found out an hour ago and is furious he decided alone.'),
        ],
      },
    ],
  },
  {
    id: 'orig-hundred-questions', play: 'The Hundred Questions', by: BY, year: 2026, where: 'A kitchen table on a weeknight, 2018, three days before the interview', language: 'prose', size: 'short', genre: 'comedy', difficulty: 1, origin: 'original',
    summary: 'A grandmother rehearses for her citizenship interview with her teenage grandson playing the officer. She knows every answer on paper and freezes out loud, and he takes the part a little too seriously, while his own history exam goes unstudied.',
    facts: [
      'The grandmother’s citizenship interview is on Thursday, and she has studied the civics questions for a year.',
      'The officer asks up to ten of the hundred questions, and she has to answer six correctly.',
      'She can write every answer, but she freezes when a question is asked out loud.',
      'The grandson has a history exam of his own on Friday and is supposed to be studying for it.',
      'He has started playing the officer with a stern voice and a clipboard.',
    ],
    circumstances: [
      yes('rehearsal', 'A weeknight at the kitchen table, three days before the interview', 'The interview is Thursday, and they’re rehearsing at home.'),
      no('interview', 'At the immigration office, the real interview underway', 'The interview is Thursday; this is a rehearsal with a clipboard.'),
      no('ceremony', 'The oath ceremony, after she’s passed', 'She hasn’t had the interview yet.'),
    ],
    relationship: [
      yes('family', 'Grandmother and grandson, the roles reversed for one evening', 'He’s playing the officer and quizzing her.'),
      no('tutor', 'A paid tutor and his student', 'He’s her grandson, with an exam of his own to study for.'),
      no('officer', 'A real officer and an applicant', 'He has a stern voice and a clipboard, but he’s her grandson.'),
    ],
    roles: [
      {
        name: 'Grandmother',
        objective: [
          yes('out-loud', 'Get the answers out loud the way she can write them', 'She can write every answer but freezes out loud.'),
          yes('his-exam', 'Get him to study for his own exam instead of fussing over hers', 'He has a history exam on Friday.'),
          no('postpone', 'Talk herself into postponing the interview', 'She has studied for a year and the interview is Thursday.'),
        ],
        obstacle: [
          yes('freeze', 'Her own nerves: the words go when someone asks', 'She freezes when a question is asked out loud.'),
          no('ignorance', 'She doesn’t know the material', 'She can write every answer after a year of study.'),
        ],
        tactic: [
          yes('mock', 'Play along with his officer, and mock it to take the fear out', 'He has a stern voice and a clipboard; she can laugh at it.'),
          yes('bargain', 'Trade questions: one of hers for one of his history', 'His exam is Friday, and civics is history too.'),
          no('quit', 'Walk away from the table for the night', 'The interview is Thursday, and she needs six right.'),
        ],
      },
      {
        name: 'Grandson',
        objective: [
          yes('pass', 'Get her through: six of ten, out loud', 'She needs six correct, and she freezes out loud.'),
          yes('avoid', 'Put off studying for his own exam', 'He’s supposed to be studying for Friday, and he’s playing an officer.'),
          no('fail', 'Make her fail so she stays dependent on him', 'He’s rehearsing her, with a clipboard, three days before.'),
        ],
        obstacle: [
          yes('his-own', 'His own exam on Friday, and her catching him avoiding it', 'He has a history exam of his own on Friday.'),
          no('language', 'She doesn’t speak English', 'She has studied the questions for a year and writes every answer.'),
        ],
        tactic: [
          yes('officer', 'Play the officer, stern and by the book', 'He has started playing the officer with a stern voice and a clipboard.'),
          yes('drill', 'Drill her fast until the answers come without thinking', 'She knows the answers; the trouble is saying them when asked.'),
          no('answers', 'Whisper the answers to her', 'At the real interview he can’t; whispering defeats the rehearsal.'),
        ],
      },
    ],
  },
  {
    id: 'orig-office-hours', play: 'Office Hours', by: BY, year: 2026, where: 'An empty chemistry classroom after parent-teacher night, 2024', language: 'prose', size: 'medium', genre: 'drama', difficulty: 2, origin: 'original',
    summary: 'A father who works nights comes to see his son’s chemistry teacher, after the last of the other parents have gone. His son is two points below the grade that keeps him on the basketball team, and the teacher can offer one makeup lab, if the father will make sure it gets done.',
    facts: [
      'The son has a 58 in chemistry, and anything under 60 costs him his place on the basketball team.',
      'He turned in none of the last five lab reports.',
      'The father works nights and missed the two emails the teacher sent.',
      'Final grades go in on Friday, and one makeup lab would bring the grade above 60.',
      'The teacher taught the boy’s older sister, who is at college on a scholarship.',
    ],
    circumstances: [
      yes('after', 'Late in an empty classroom, the other parents gone, Friday’s deadline close', 'Final grades go in Friday, and parent-teacher night is over.'),
      no('game', 'In the stands at a basketball game', 'They’re in the chemistry classroom after parent-teacher night.'),
      no('summer', 'Summer school, the grade already final', 'Final grades don’t go in until Friday; there’s still time.'),
    ],
    relationship: [
      yes('teacher-parent', 'A teacher and a parent who’ve never met, with a boy between them', 'The father missed both emails; this is their first talk.'),
      no('old-friends', 'Old friends catching up', 'He missed the teacher’s emails; they don’t know each other.'),
      no('hostile', 'Long-time enemies from past fights over the sister', 'The teacher taught the sister, who’s now at college on a scholarship.'),
    ],
    roles: [
      {
        name: 'The Father',
        objective: [
          yes('team', 'Keep his son on the team', 'Anything under 60 costs his son his place on the team, and he has a 58.'),
          yes('understand', 'Find out how it got this far without his knowing', 'He missed the two emails, and his son turned in none of five reports.'),
          no('blame-son', 'Get the boy thrown off the team as a lesson', 'He came to save the place on the team.'),
        ],
        obstacle: [
          yes('reports', 'Five missing lab reports, and he didn’t know', 'The son turned in none of the last five lab reports.'),
          no('teacher-hates', 'The teacher has it in for his family', 'She taught his daughter, who’s at college on a scholarship.'),
        ],
        tactic: [
          yes('defend', 'Defend his son, and his own long nights at work', 'He works nights and missed both emails.'),
          yes('humble', 'Admit he missed the emails and ask for help', 'The teacher sent two emails, and he didn’t see either.'),
          no('principal', 'Threaten to go over her head to the principal', 'She’s the one offering the makeup lab.'),
        ],
      },
      {
        name: 'The Teacher',
        objective: [
          yes('commit', 'Get the father to see the makeup lab through', 'One makeup lab brings the grade above 60.'),
          yes('wake-up', 'Make him see that the boy is drifting, team or no team', 'Five missing lab reports are about more than a grade.'),
          no('punish', 'Punish the boy for skipping labs', 'She’s offering a way to pass.'),
        ],
        obstacle: [
          yes('nights', 'The father works nights and can’t watch the boy do the work', 'He works nights and missed both emails.'),
          no('rules', 'School rules forbid makeup work', 'She can offer one makeup lab before Friday.'),
        ],
        tactic: [
          yes('facts', 'Lay out the numbers plainly: 58, five reports, Friday', 'The grade is 58; final grades go in Friday.'),
          yes('sister', 'Bring up the sister, and what she did with the same class', 'She taught the older sister, now at college on a scholarship.'),
          no('flatter', 'Tell him the boy is doing fine', 'The boy has a 58 and five missing reports.'),
        ],
      },
    ],
  },
  {
    id: 'orig-two-time-zones', play: 'Two Time Zones', by: BY, year: 2026, where: 'His girlfriend’s apartment, the last night of his visit, spring 2023', language: 'prose', size: 'medium', genre: 'comedy', difficulty: 2, origin: 'original',
    summary: 'After two years a four-hour flight apart, a couple promised each other at New Year that one of them would move by summer. On the last night of his visit, with a flight at six, she sells her city, he sells his, and neither will say the one thing the other is waiting for.',
    facts: [
      'They’ve been together three years, the last two of them a four-hour flight apart.',
      'She has been offered a promotion that means staying where she is.',
      'He has a lease that ends in June and a job he can do from home three days a week.',
      'At New Year they agreed that one of them would move by summer.',
      'It’s the last night of his visit, and his flight leaves at six in the morning.',
    ],
    circumstances: [
      yes('last-night', 'The last night of a visit, a flight at six, and a summer deadline they set themselves', 'His flight leaves at six; they agreed at New Year one of them would move by summer.'),
      no('first-date', 'The night they first met', 'They’ve been together three years.'),
      no('moving-day', 'Moving day, the truck outside', 'Neither has decided to move yet.'),
    ],
    relationship: [
      yes('couple', 'A long-distance couple, three years in, both afraid to be the one who gives things up', 'They’ve spent two years apart, and now they’ve promised to close the distance.'),
      no('broken-up', 'Exes negotiating a breakup', 'They agreed to move together; this is about who moves.'),
      no('married', 'A married couple of twenty years', 'They’ve been together three years, two of them apart.'),
    ],
    roles: [
      {
        name: 'June',
        objective: [
          yes('him-move', 'Get him to move, without asking him to', 'She has been offered a promotion that means staying, and his lease ends in June.'),
          yes('wanted', 'Hear that he wants to be here, and not only because it’s practical', 'His lease and his job make him the practical one to move; that isn’t what she wants to hear.'),
          no('turn-down', 'Turn the promotion down for his sake', 'The promotion is hers, and it means staying.'),
        ],
        obstacle: [
          yes('fair', 'Asking him to move feels like winning, and she doesn’t want to win', 'They agreed one of them would move, and her promotion tips it.'),
          no('distance', 'The distance has already ended things', 'They’re together, and they made a plan at New Year.'),
        ],
        tactic: [
          yes('sell', 'Sell her city to him like an agent: the light, the food, the rent', 'She wants him here and won’t ask outright.'),
          yes('offer', 'Offer to move herself, half meaning it, to see what he says', 'She has a promotion to lose; the offer tests him.'),
          no('ultimatum', 'Give him an ultimatum before the flight', 'They agreed together; she wants him to choose it.'),
        ],
      },
      {
        name: 'Sam',
        objective: [
          yes('asked', 'Be asked: have her say plainly she wants him there', 'His lease ends in June and he can work from home; he wants a reason besides that.'),
          yes('fair-deal', 'Make sure the choice is fair, and not only convenient', 'His job is flexible, so the move falls on him by default.'),
          no('stay-apart', 'Keep things long distance forever', 'At New Year he agreed one of them would move by summer.'),
        ],
        obstacle: [
          yes('flight', 'The flight at six leaves no time to dodge it', 'His flight leaves at six in the morning.'),
          no('lease', 'He’s locked into a lease for years', 'His lease ends in June.'),
        ],
        tactic: [
          yes('counter-sell', 'Out-sell her: praise his own city as hard', 'She’s selling her city; he can sell his.'),
          yes('call-bluff', 'Accept her offer to move, to see if she means it', 'She has a promotion that means staying.'),
          no('leave', 'Leave for the airport early to avoid it', 'The flight is at six; he’s staying the night.'),
        ],
      },
    ],
  },
  {
    id: 'orig-the-reception', play: 'The Reception', by: BY, year: 2026, where: 'A church hall after a funeral, coffee urns and sandwiches, autumn 2009', language: 'prose', size: 'long', genre: 'drama', difficulty: 3, origin: 'original',
    summary: 'Two men who were once inseparable meet again over the coffee urn at the funeral of the third of them. They haven’t spoken since one stayed away from the other’s wedding, and the dead man’s sister wants one of them to give the eulogy at Saturday’s memorial and needs to know which.',
    facts: [
      'The three of them were inseparable from high school until a falling-out eleven years ago.',
      'One of the two didn’t come to the other’s wedding, and they haven’t spoken since.',
      'The friend who died kept in touch with both and never took a side.',
      'His sister has asked one of them to speak at the memorial on Saturday and wants an answer tonight.',
      'The friend who died was thirty-eight.',
    ],
    circumstances: [
      yes('hall', 'A church hall after the funeral, among mourners, with an answer owed by tonight', 'The sister wants an answer tonight about Saturday’s memorial.'),
      no('wedding', 'At the wedding eleven years ago', 'That’s the cause of the rift; this is the funeral.'),
      no('alone', 'A private dinner, the two of them alone', 'It’s a reception in a church hall, among mourners.'),
    ],
    relationship: [
      yes('estranged', 'Estranged best friends, joined only by the friend they’ve lost', 'They haven’t spoken in eleven years; the dead friend kept up with both.'),
      no('brothers', 'Brothers', 'They’re friends from high school; the sister is the dead man’s.'),
      no('reconciled', 'Friends who made up years ago', 'They haven’t spoken since the wedding.'),
    ],
    roles: [
      {
        name: 'Martin',
        objective: [
          yes('apology', 'Get the apology he’s waited eleven years for', 'His friend didn’t come to his wedding.'),
          yes('eulogy', 'Be the one who speaks on Saturday', 'The sister wants one of them to speak, and he wants it to be him.'),
          no('leave', 'Leave before they have to talk', 'The sister wants an answer tonight.'),
        ],
        obstacle: [
          yes('pride', 'Eleven years of pride; going first feels like losing', 'They haven’t spoken since the wedding.'),
          no('sister', 'The sister has already chosen the other man', 'She has asked for an answer tonight; she hasn’t chosen.'),
        ],
        tactic: [
          yes('polite', 'Stay coldly polite, as if they were strangers', 'They haven’t said a word to each other in eleven years.'),
          yes('memory', 'Bring up the three of them in high school', 'They were inseparable from high school.'),
          no('scene', 'Start a loud fight in the hall', 'It’s a funeral reception, among mourners.'),
        ],
      },
      {
        name: 'Eddie',
        objective: [
          yes('explain', 'Finally explain why he didn’t come', 'He didn’t come to the wedding, and they haven’t spoken since.'),
          yes('give-up', 'Let Martin have the eulogy, as a peace offering', 'The sister wants one of them; giving it away costs him something.'),
          no('mock', 'Make fun of the marriage', 'He’s here to mourn, and the friend who died never took a side.'),
        ],
        obstacle: [
          yes('reason', 'The reason he stayed away may hurt more than the absence did', 'Eleven years have passed, and the dead friend never took a side.'),
          no('stranger', 'Martin doesn’t recognize him', 'They were inseparable from high school.'),
        ],
        tactic: [
          yes('humor', 'Use the old jokes the three of them shared', 'They were inseparable from high school.'),
          yes('straight', 'Say it straight, without excuses', 'Eleven years is long enough to have it ready.'),
          no('deny', 'Claim he was at the wedding', 'He didn’t come, and they both know it.'),
        ],
      },
    ],
  },
];
