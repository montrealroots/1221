/**
 * SLATE — the work a course sets between its meetings (from 2026-10-07): an
 * assignment, the material it's on, how it's prepared, and what the teacher
 * looks for when it's shown (`systems/coursework.ts`).
 *
 * What's sourced and what isn't:
 * - The courses, their codes, years, terms and teachers are the Yale
 *   Bulletin's (`content/school.ts`). What each course's work is here is
 *   SLATE's reading of its title and description: the school publishes its
 *   courses, not its assignments.
 * - The scenes are from plays long in the public domain, and what each says
 *   about its play (who is in the scene, where, when and what has just
 *   happened) is what the play itself says. Which choices a reading of the
 *   scene supports, and why the others don't, is SLATE's reading of the text;
 *   it's a simulation rule, written to be checkable against the play.
 * - Every number below (how long a step takes, how much of a preparation it
 *   moves, how much each part of it weighs in a showing) is SLATE's
 *   estimate. Nothing published measures them.
 * - Feedback a course gives is the game's, written for the simulation, and
 *   shown as simulated: no teacher's words are quoted or invented as theirs.
 */

import type { Skill } from './school';

/** The parts of a preparation SLATE keeps, each 0 to 1. */
export type PrepDim = 'familiarity' | 'memorization' | 'interpretation' | 'rehearsal' | 'partner' | 'revision';
export const PREP_DIMS: readonly PrepDim[] = ['familiarity', 'memorization', 'interpretation', 'rehearsal', 'partner', 'revision'];

/** What a step needs to be done at all, beyond time: a partner present, a room at school, clothes to move in, a phone that records. */
export type Need = 'partner' | 'studio' | 'moveClothes' | 'phone' | 'library';

/**
 * A step of preparation: what it's called, how long it takes, which part of
 * the preparation it moves and by how much of what's left (so a step done
 * again moves it less, and a part at 1 isn't moved at all), whether it counts
 * once a day (daily practice), what it needs, and what has to be in place
 * first (the studio and the library are known from orientation's tour). A step may also train a skill a little (`trains`), counted for at most
 * `ESTIMATE.trainingSteps` steps an assignment (`systems/coursework.ts`).
 */
export interface Activity {
  id: string;
  label: string;
  minutes: number;
  dim: PrepDim;
  /** The share of what's left of the part that one step moves, at an ordinary readiness. */
  gain: number;
  daily?: boolean;
  needs?: readonly Need[];
  requires?: { dim: PrepDim; at: number; why: string };
  trains?: Skill;
}

/** A question a reading of the material answers, and the answers on offer: some the text supports, some it cuts against, and why. */
export interface Question { id: 'circumstances' | 'relationship' | 'objective' | 'obstacle' | 'tactic'; label: string }
export interface Option { id: string; text: string; supported: boolean; why?: string }

/** A part in a scene: who, and the character-specific answers. */
export interface Role {
  name: string;
  objective: readonly Option[];
  obstacle: readonly Option[];
  tactic: readonly Option[];
}

/**
 * A two-person scene from a public-domain play: the play, its writer and
 * year, where in it, what happens, and the shared readings (where and when,
 * and what the two are to each other). `size` is how much there is to learn,
 * SLATE's reading of the scene's length, scaling how long learning it takes.
 */
export interface Scene {
  id: string;
  play: string;
  by: string;
  year: number;
  where: string;
  summary: string;
  /** Prose drama, or verse (heightened language), which a classical course asks for. */
  language: 'prose' | 'verse';
  size: 'short' | 'medium' | 'long';
  circumstances: readonly Option[];
  relationship: readonly Option[];
  roles: readonly [Role, Role];
}

export const QUESTIONS: readonly Question[] = [
  { id: 'circumstances', label: 'Given Circumstances' },
  { id: 'relationship', label: 'The Relationship' },
  { id: 'objective', label: 'Your Objective' },
  { id: 'obstacle', label: 'The Obstacle' },
  { id: 'tactic', label: 'A Choice To Play' },
];

const yes = (id: string, text: string): Option => ({ id, text, supported: true });
const no = (id: string, text: string, why: string): Option => ({ id, text, supported: false, why });

export const SCENES: readonly Scene[] = [
  {
    id: 'seagull-4', play: 'The Seagull', by: 'Anton Chekhov', year: 1896, where: 'Act Four', language: 'prose', size: 'long',
    summary: 'Two years after she left with Trigorin, Nina comes in from the storm to Konstantin’s study. She has been acting in the provinces and lost her child; he still loves her and begs her to stay.',
    circumstances: [
      yes('storm', 'A stormy autumn night, two years on; she has come in secret, and the household is at dinner next door'),
      no('lake', 'A still summer evening by the lake, before Konstantin’s play', 'That’s the first act; by the fourth, two years have passed and it’s a wet autumn night.'),
      no('wedding', 'The morning after Nina and Trigorin are married', 'Trigorin never marries her; he has gone back to Arkadina.'),
    ],
    relationship: [
      yes('first-love', 'First loves; he still loves her, and she still loves Trigorin'),
      no('strangers', 'Near strangers meeting again', 'They grew up as neighbors and were in love before the play begins.'),
      no('rivals', 'Two writers competing for the same theater', 'Nina is an actress, not a writer, and nothing in the scene is about competing.'),
    ],
    roles: [
      {
        name: 'Nina',
        objective: [
          yes('hold-on', 'Be understood, and to hold on to her calling as an actress'),
          no('marry', 'Win Konstantin back and stay with him', 'He asks her to stay and she refuses; she leaves into the night.'),
          no('money', 'Borrow money for the journey', 'Money isn’t what she comes for; nothing in the scene asks for it.'),
        ],
        obstacle: [
          yes('trigorin', 'She still loves Trigorin, and she’s exhausted and close to breaking'),
          no('family', 'Her father has forbidden the visit', 'Her father’s house is closed to her, but it isn’t what stops her here.'),
        ],
        tactic: [
          yes('memory', 'Steady herself by going back to the old lines of his play'),
          no('flirt', 'Flirt, to see if he still wants her', 'She knows he does; her trouble is herself, not his feelings.'),
          yes('confess', 'Tell him the truth of the two years plainly'),
        ],
      },
      {
        name: 'Konstantin',
        objective: [
          yes('stay', 'Make her stay, or take him with her'),
          no('send', 'Get her out before his mother sees her', 'He is the one who keeps her there and begs her to stay.'),
          no('forget', 'Show her he has got over her', 'He tells her outright that he can’t stop loving her.'),
        ],
        obstacle: [
          yes('her-love', 'She loves Trigorin, not him, and she has a life she means to go back to'),
          no('success', 'His success as a writer keeps him too busy', 'His stories are published, but he says he has no faith and no calling.'),
        ],
        tactic: [
          yes('plead', 'Plead, and to offer her everything he has'),
          yes('listen', 'Hold back and let her speak, hoping she’ll come round'),
          no('mock', 'Mock her acting career', 'Nothing in his lines does; he follows her career and cares for her.'),
        ],
      },
    ],
  },
  {
    id: 'dollhouse-3', play: 'A Doll’s House', by: 'Henrik Ibsen', year: 1879, where: 'Act Three, the last scene', language: 'prose', size: 'long',
    summary: 'Helmer has read Krogstad’s letter, raged at Nora, then forgiven her once the bond came back. Nora changes out of her costume, sits him down for their first serious talk in eight years, and leaves.',
    circumstances: [
      yes('night', 'Late at night after the costume party, the danger just over and Helmer relieved'),
      no('christmas', 'Christmas Eve, as the tree is brought in', 'That’s the first act; this is the night after the dance, two days later.'),
      no('morning', 'The next morning, after a night’s sleep', 'It’s the same night; she changes out of her costume and doesn’t go to bed.'),
    ],
    relationship: [
      yes('marriage', 'Husband and wife of eight years who have never spoken as equals'),
      no('equals', 'Partners who have always shared everything', 'Nora says they have never once had a serious talk.'),
      no('rivals', 'Two people competing for Krogstad’s favor', 'Krogstad is the threat, not a prize.'),
    ],
    roles: [
      {
        name: 'Nora',
        objective: [
          yes('see', 'Make him see their marriage as it has been, and to leave on her own terms'),
          no('forgive', 'Be forgiven and put things back as they were', 'He forgives her; it’s she who won’t go back.'),
          no('punish', 'Make him pay for his anger', 'She is past anger; she’s calm and clear.'),
        ],
        obstacle: [
          yes('habit', 'Eight years of being his doll, and his certainty that she’s a child'),
          no('money', 'She has no money for the journey', 'Money isn’t what keeps her; she leaves with what she has.'),
        ],
        tactic: [
          yes('reckon', 'Sit him down and settle accounts, calmly'),
          yes('return', 'Give back his ring and take back her own'),
          no('tears', 'Weep until he gives in', 'She is dry-eyed and certain; the tears were earlier.'),
        ],
      },
      {
        name: 'Helmer',
        objective: [
          yes('keep', 'Keep her, and to keep the life they had'),
          no('divorce', 'Be rid of her for the scandal', 'He forgives her as soon as the bond is returned and begs her to stay.'),
          no('money', 'Find out where the money went', 'He has the letter; the money isn’t the question now.'),
        ],
        obstacle: [
          yes('changed', 'She has changed in a night and he doesn’t understand her'),
          no('krogstad', 'Krogstad is still threatening them', 'The bond has come back; that danger is over.'),
        ],
        tactic: [
          yes('reason', 'Reason with her, and appeal to her duty to husband and children'),
          yes('promise', 'Promise he can change'),
          no('laugh', 'Laugh it off as a joke', 'He tries to make light of it once and she won’t let him.'),
        ],
      },
    ],
  },
  {
    id: 'earnest-2', play: 'The Importance of Being Earnest', by: 'Oscar Wilde', year: 1895, where: 'Act Two, the garden', language: 'prose', size: 'medium',
    summary: 'Gwendolen arrives at the Manor House and meets Cecily, whom she takes for a guest. Each learns the other believes she’s engaged to Ernest Worthing, and tea becomes a war of manners.',
    circumstances: [
      yes('garden', 'A summer afternoon in the Manor House garden, tea about to be served'),
      no('ballroom', 'A London ball, in front of everyone', 'It’s a private garden in the country, with only the butler and footman about.'),
      no('wedding', 'The day after a double wedding', 'Neither is married; each believes she’s engaged.'),
    ],
    relationship: [
      yes('strangers', 'Strangers who become rivals in a minute, each perfectly polite'),
      no('sisters', 'Sisters who have quarreled before', 'They have never met before this scene.'),
      no('old-friends', 'Old school friends', 'They meet here for the first time.'),
    ],
    roles: [
      {
        name: 'Cecily',
        objective: [
          yes('claim', 'Defend her claim to Ernest, with perfect sweetness'),
          no('give-up', 'Give Ernest up graciously', 'She produces her diary to prove her prior claim.'),
          no('friend', 'Make a friend and nothing more', 'The friendship ends as soon as Ernest is mentioned.'),
        ],
        obstacle: [
          yes('gwendolen', 'Gwendolen has a prior claim, and the manners of town'),
          no('aunt', 'Her aunt is watching from the window', 'Her guardian is away; it’s the two of them.'),
        ],
        tactic: [
          yes('sugar', 'Fight with the tea: sugar in it, cake instead of bread and butter'),
          yes('diary', 'Prove her engagement from her diary'),
          no('shout', 'Shout her down', 'The comedy is that neither raises her voice.'),
        ],
      },
      {
        name: 'Gwendolen',
        objective: [
          yes('assert', 'Assert her prior claim and put the country girl in her place'),
          no('leave', 'Get away from the house quickly', 'She stays and fights the tea through.'),
          no('ally', 'Make Cecily an ally against Ernest', 'That comes later, when the men are found out; not in this scene.'),
        ],
        obstacle: [
          yes('cecily', 'Cecily is young, pretty and has a diary with dates in it'),
          no('mother', 'Lady Bracknell has forbidden her to marry', 'Her mother does, but Lady Bracknell isn’t what she faces here.'),
        ],
        tactic: [
          yes('freeze', 'Freeze her out with town manners'),
          yes('diary', 'Match her diary with her own'),
          no('cry', 'Break down in tears', 'She stays composed; that’s the joke.'),
        ],
      },
    ],
  },
  {
    id: 'vanya-2', play: 'Uncle Vanya', by: 'Anton Chekhov', year: 1898, where: 'Act Two, at night', language: 'prose', size: 'medium',
    summary: 'In the small hours, after the storm, Sonya and her young stepmother Yelena make up after months of coldness and drink to it. Sonya confides she loves the doctor, Astrov.',
    circumstances: [
      yes('night', 'The middle of a sleepless night in the dining room, the storm passing'),
      no('picnic', 'A sunny afternoon picnic', 'It’s past one in the morning, after a storm.'),
      no('funeral', 'The day of the Professor’s funeral', 'The Professor is alive, and complaining in the next room.'),
    ],
    relationship: [
      yes('step', 'A young stepmother and her stepdaughter, cold for months, now reconciling'),
      no('sisters', 'Sisters who have always been close', 'They have barely been speaking.'),
      no('rivals-open', 'Open rivals for Astrov', 'Sonya loves Astrov; Yelena doesn’t admit to anything, and they make up.'),
    ],
    roles: [
      {
        name: 'Sonya',
        objective: [
          yes('hope', 'Find out, from someone who might know, whether she has any hope with Astrov'),
          no('quarrel', 'Pick a fight with Yelena', 'She is the one who offers peace.'),
          no('leave', 'Persuade Yelena to leave the estate', 'Nothing in the scene asks her to go.'),
        ],
        obstacle: [
          yes('plain', 'She believes she’s plain, and Astrov hardly notices her'),
          no('father', 'Her father has forbidden her to marry', 'He hasn’t; he hasn’t thought about it at all.'),
        ],
        tactic: [
          yes('confide', 'Confide in her, as a friend at last'),
          yes('ask', 'Ask her plainly whether she’s happy'),
          no('accuse', 'Accuse her of flirting with Astrov', 'She makes peace first, and confides.'),
        ],
      },
      {
        name: 'Yelena',
        objective: [
          yes('peace', 'Make peace, and not to be so alone in the house'),
          no('astrov', 'Win Astrov for herself tonight', 'Whatever she feels, here she praises him to Sonya.'),
          no('money', 'Ask Sonya for money', 'Money doesn’t come into it.'),
        ],
        obstacle: [
          yes('boredom', 'Her own boredom and unhappiness, and Sonya’s mistrust of her'),
          no('husband-gone', 'Her husband has left her', 'He is in the next room.'),
        ],
        tactic: [
          yes('toast', 'Drink to friendship'),
          yes('music', 'Ask for music, to break the gloom'),
          no('order', 'Order her about as a stepmother', 'She asks to be friends instead.'),
        ],
      },
    ],
  },
  {
    id: 'trifles', play: 'Trifles', by: 'Susan Glaspell', year: 1916, where: 'The one act, the Wright kitchen', language: 'prose', size: 'medium',
    summary: 'While the men search the farmhouse for a motive for John Wright’s murder, Mrs. Hale and Mrs. Peters, the sheriff’s wife, find the dead canary in Minnie Wright’s sewing box, and decide what to do with it.',
    circumstances: [
      yes('kitchen', 'A cold winter morning in the dead man’s kitchen, the men upstairs looking for evidence'),
      no('trial', 'The courtroom during Minnie’s trial', 'The play is in the kitchen, before any trial.'),
      no('party', 'A quilting party at the Hales’ farm', 'They’re in the Wright house, gathering things for Minnie in jail.'),
    ],
    relationship: [
      yes('neighbors', 'Two farm women who barely know each other, coming to understand one another'),
      no('friends', 'Lifelong friends', 'They hardly know each other; that’s part of the scene.'),
      no('enemies', 'Old enemies', 'Nothing says they are; they come to the same side.'),
    ],
    roles: [
      {
        name: 'Mrs. Hale',
        objective: [
          yes('protect', 'Protect Minnie, and make up for not visiting her'),
          no('convict', 'Help the men find the motive', 'She hides what they find.'),
          no('leave', 'Get home as soon as she can', 'She stays and does the work they came for.'),
        ],
        obstacle: [
          yes('law', 'Mrs. Peters is married to the law, and the men could come down at any moment'),
          no('weather', 'The snow has closed the road', 'They came by the road and will leave by it.'),
        ],
        tactic: [
          yes('remind', 'Remind Mrs. Peters what Minnie’s life was'),
          yes('hide', 'Hide the box before the men see it'),
          no('report', 'Tell the county attorney straight away', 'She does the opposite.'),
        ],
      },
      {
        name: 'Mrs. Peters',
        objective: [
          yes('torn', 'Do right, and find out what right is: the law, or Minnie'),
          no('arrest', 'Make the arrest herself', 'That’s her husband’s work, not hers.'),
          no('gossip', 'Have something to tell the neighbors', 'She says almost nothing; she keeps it.'),
        ],
        obstacle: [
          yes('married', 'She is married to the sheriff, and the law is the law'),
          no('fear', 'She is afraid of Mrs. Hale', 'She is uneasy, not afraid of her.'),
        ],
        tactic: [
          yes('remember', 'Remember what it was to lose something and have no one'),
          yes('law', 'Fall back on the law, and see if it holds'),
          no('accuse', 'Accuse Mrs. Hale of hiding evidence', 'In the end she helps hide it.'),
        ],
      },
    ],
  },
  {
    id: 'julie', play: 'Miss Julie', by: 'August Strindberg', year: 1888, where: 'Midsummer Eve, the kitchen', language: 'prose', size: 'long',
    summary: 'On Midsummer Eve the Count’s daughter comes down to the kitchen and draws her father’s valet, Jean, into a game of command and seduction that crosses the line between master and servant.',
    circumstances: [
      yes('midsummer', 'Midsummer Eve in the manor kitchen, the Count away and the servants dancing in the barn'),
      no('winter', 'A dark winter morning, the Count at breakfast upstairs', 'It’s Midsummer Eve, with the Count away.'),
      no('wedding', 'Julie’s wedding night', 'Her engagement has just been broken off.'),
    ],
    relationship: [
      yes('mistress', 'The Count’s daughter and her father’s valet, both testing the line between them'),
      no('equals', 'Two equals of the same class', 'Class is the whole game between them.'),
      no('siblings', 'Brother and sister', 'They’re mistress and servant.'),
    ],
    roles: [
      {
        name: 'Julie',
        objective: [
          yes('command', 'Command him, and to provoke him past the point of obeying'),
          no('marry', 'Marry Jean tonight', 'Nothing so settled; it’s a game until it isn’t.'),
          no('punish', 'Have him dismissed', 'She draws him in, not out.'),
        ],
        obstacle: [
          yes('class', 'Her rank, and Jean’s knowing exactly where it ends'),
          no('kristin', 'Kristin has locked her out of the kitchen', 'Kristin goes off to bed; the kitchen is theirs.'),
        ],
        tactic: [
          yes('order', 'Order him to dance, to kiss her shoe'),
          yes('tease', 'Tease him about his manners and his French'),
          no('beg', 'Beg him to leave her alone', 'She is the one pursuing.'),
        ],
      },
      {
        name: 'Jean',
        objective: [
          yes('rise', 'Rise above his station, through her if he must'),
          no('serve', 'Only to serve her as he would any evening', 'He has ambitions, and says so.'),
          no('leave', 'Get away from the house tonight', 'He stays, and stays in the game.'),
        ],
        obstacle: [
          yes('rank', 'Her rank, and what the Count would do if he knew'),
          no('debt', 'He owes Julie money', 'Nothing says he does.'),
        ],
        tactic: [
          yes('flatter', 'Flatter her and let her think she leads'),
          yes('warn', 'Warn her she’s playing with fire'),
          no('quit', 'Resign his post on the spot', 'He holds the post and the advantage.'),
        ],
      },
    ],
  },
  {
    id: 'cherry-orchard-4', play: 'The Cherry Orchard', by: 'Anton Chekhov', year: 1904, where: 'Act Four, the emptied house', language: 'prose', size: 'short',
    summary: 'On the day the family leaves the estate Lopakhin has bought, everyone arranges for him to be alone with Varya so he can propose at last. They talk about something she has lost and the weather, and he’s called away.',
    circumstances: [
      yes('departure', 'An October morning, the house emptied and the carriages waiting; the orchard is already being cut down'),
      no('ball', 'The night of the ball, while the auction is on in town', 'That’s the third act; this is the day they leave.'),
      no('spring', 'A May dawn as the family arrives', 'That’s the first act.'),
    ],
    relationship: [
      yes('expected', 'Two people everyone expects to marry, who have never said a word of it to each other'),
      no('engaged', 'An engaged couple settling the date', 'He has never proposed; this is the chance, and it passes.'),
      no('enemies', 'Enemies since the sale', 'Nothing between them is hostile; it’s unsaid.'),
    ],
    roles: [
      {
        name: 'Varya',
        objective: [
          yes('hear-it', 'Hear him ask, without asking him to'),
          no('refuse', 'Refuse him before he can ask', 'She waits for him to ask, and weeps when he doesn’t.'),
          no('estate', 'Get the estate back from him', 'The sale is done; she’s packing.'),
        ],
        obstacle: [
          yes('silence', 'Neither of them can say it, and there’s no time left'),
          no('mother', 'Her mother has forbidden the match', 'Lyubov wants it, and arranged this moment.'),
        ],
        tactic: [
          yes('busy', 'Look for something in the luggage, to have something to do'),
          yes('wait', 'Wait, and give him every chance'),
          no('propose', 'Propose to him herself', 'She doesn’t; that’s the scene.'),
        ],
      },
      {
        name: 'Lopakhin',
        objective: [
          yes('ask', 'Ask her, at last, as he promised'),
          no('avoid-all', 'Get out of the house without a word to anyone', 'He agreed to ask her, and comes in to do it.'),
          no('gloat', 'Gloat over buying the estate', 'He did that the night before; now he can barely speak.'),
        ],
        obstacle: [
          yes('himself', 'Himself: he can’t find the words, and someone calls him away'),
          no('varya-no', 'She has told him no before', 'He has never asked her.'),
        ],
        tactic: [
          yes('small-talk', 'Talk about the weather and the journey, to get there sideways'),
          yes('business', 'Take refuge in business and plans'),
          no('declare', 'Declare his love at length', 'He never gets to it.'),
        ],
      },
    ],
  },
  {
    id: 'pygmalion-4', play: 'Pygmalion', by: 'Bernard Shaw', year: 1913, where: 'Act Four, the Wimpole Street laboratory', language: 'prose', size: 'medium',
    summary: 'After the triumph at the ambassador’s party, Higgins and Pickering congratulate themselves and go up to bed without a word to Eliza. Left with Higgins, she throws his slippers at him and asks what is to become of her.',
    circumstances: [
      yes('after-party', 'Midnight, back from the party where she passed as a duchess; the bet is won'),
      no('market', 'Covent Garden in the rain, where they first met', 'That’s the first act.'),
      no('lesson', 'The first morning of lessons', 'The lessons are over; the test was tonight.'),
    ],
    relationship: [
      yes('maker', 'Teacher and pupil who have lived together for months, he treating her as his experiment'),
      no('engaged', 'An engaged couple', 'Nothing of the kind has been said, and she won’t marry him.'),
      no('father', 'Father and daughter', 'Her father is Doolittle, the dustman.'),
    ],
    roles: [
      {
        name: 'Eliza',
        objective: [
          yes('acknowledged', 'Be acknowledged, and to know what is to become of her now'),
          no('thank', 'Thank him for everything', 'She throws his slippers at him.'),
          no('money', 'Be paid for her work', 'She’s asking what she is now, not for wages.'),
        ],
        obstacle: [
          yes('indifference', 'His indifference: to him the experiment is over'),
          no('pickering', 'Pickering has turned against her', 'Pickering is kind to her; he just goes to bed.'),
        ],
        tactic: [
          yes('slippers', 'Throw the slippers, and make him see her'),
          yes('return-jewels', 'Give back the jewels, so he has to ask why'),
          no('flatter', 'Flatter him for the triumph', 'She is furious with him.'),
        ],
      },
      {
        name: 'Higgins',
        objective: [
          yes('peace', 'Have his peace, and find his slippers'),
          no('propose', 'Ask her to marry him', 'He suggests she might marry some other man, not him.'),
          no('apologize', 'Apologize', 'He doesn’t, and loses his temper instead.'),
        ],
        obstacle: [
          yes('her-rage', 'Her rage, which he doesn’t understand and won’t admit he caused'),
          no('mother', 'His mother is in the room', 'They’re alone.'),
        ],
        tactic: [
          yes('reason', 'Reason with her coolly, as if she’s tired and overexcited'),
          yes('lose-temper', 'Lose his temper when she gets to him'),
          no('comfort', 'Comfort her tenderly', 'Not his way, and not tonight.'),
        ],
      },
    ],
  },
  {
    id: 'playboy-3', play: 'The Playboy of the Western World', by: 'J. M. Synge', year: 1907, where: 'Act Three, the shebeen', language: 'prose', size: 'medium',
    summary: 'After Christy wins every race on the strand, he and Pegeen are left alone in the shebeen and court in Synge’s high Mayo talk, planning to marry, before Christy’s father, whom he claimed to have killed, comes back.',
    circumstances: [
      yes('after-races', 'Evening in Flaherty’s shebeen after the races, the two alone for a moment'),
      no('first-night', 'The night Christy first arrives', 'That’s the first act; by now he’s the hero of the place.'),
      no('wake', 'The wake for Christy’s father', 'His father isn’t dead, and comes back.'),
    ],
    relationship: [
      yes('courting', 'A young man and woman courting in earnest, each a little dazzled by the other'),
      no('married', 'Husband and wife', 'They’re only now planning to marry.'),
      no('cousins', 'Cousins', 'He is a stranger to the place.'),
    ],
    roles: [
      {
        name: 'Pegeen',
        objective: [
          yes('have-him', 'Have him, and a life bigger than the shebeen'),
          no('send', 'Send him on his way', 'She wants him to stay and marry her.'),
          no('shawn', 'Keep Shawn Keogh as her match', 'She wants Christy, not Shawn.'),
        ],
        obstacle: [
          yes('father-match', 'Her father has promised her to Shawn Keogh'),
          no('church', 'The priest has forbidden it', 'The priest is a threat offstage, not what stops her here.'),
        ],
        tactic: [
          yes('tease', 'Tease him, and make him say it better'),
          yes('plan', 'Plan the marriage out loud'),
          no('cold', 'Be cold, to cool him off', 'She warms to him in this scene.'),
        ],
      },
      {
        name: 'Christy',
        objective: [
          yes('win', 'Win her for good, with the best talk in Mayo'),
          no('flee', 'Get out before his father finds him', 'He thinks his father is dead and buried.'),
          no('confess', 'Confess he didn’t kill his father', 'He believes he did.'),
        ],
        obstacle: [
          yes('doubt', 'His own doubt that a girl like Pegeen would have him'),
          no('widow', 'The Widow Quin is watching', 'They’re alone for this.'),
        ],
        tactic: [
          yes('poetry', 'Woo her with the talk he’s found in himself'),
          yes('boast', 'Boast of the day he’s had'),
          no('threaten', 'Threaten Shawn', 'Shawn isn’t here; the scene is courtship.'),
        ],
      },
    ],
  },
  {
    id: 'machinal-2', play: 'Machinal', by: 'Sophie Treadwell', year: 1928, where: 'Episode Two, At Home', language: 'prose', size: 'short',
    summary: 'At home in the evening, the Young Woman tells her mother that her employer, Mr. Jones, wants to marry her; she doesn’t love him and is afraid. Her mother asks about his money and wants the match.',
    circumstances: [
      yes('home', 'Evening at home in a cramped city flat after work, the garbage to go out'),
      no('office', 'The office, in front of the other clerks', 'That’s the first episode; this is at home.'),
      no('wedding', 'The wedding night', 'She hasn’t said yes yet.'),
    ],
    relationship: [
      yes('mother', 'A daughter and the mother she lives with and supports'),
      no('sisters', 'Two sisters', 'It’s her mother.'),
      no('landlady', 'Lodger and landlady', 'It’s her mother.'),
    ],
    roles: [
      {
        name: 'Young Woman',
        objective: [
          yes('understood', 'Be understood: that she wants love, not only security'),
          no('accept', 'Be told to accept him and get it over with', 'She wants the opposite: for someone to understand why she can’t.'),
          no('leave', 'Move out tonight', 'Nothing in the scene plans it.'),
        ],
        obstacle: [
          yes('mother-sense', 'Her mother’s hard practical sense, and their poverty'),
          no('jones-here', 'Mr. Jones is in the room', 'He isn’t; they talk about him.'),
        ],
        tactic: [
          yes('plead', 'Plead with her to understand'),
          yes('lash-out', 'Lash out, when she isn’t heard'),
          no('reason-calm', 'Lay out a calm plan', 'She is too frightened to be calm.'),
        ],
      },
      {
        name: 'Mother',
        objective: [
          yes('secure', 'See her daughter married and secure'),
          no('refuse-jones', 'Talk her out of marrying Jones', 'She wants the match.'),
          no('alone', 'Be left in peace', 'She keeps at it.'),
        ],
        obstacle: [
          yes('daughter-fear', 'Her daughter’s fear, which she can’t make sense of'),
          no('money', 'Jones has no money', 'He is well off; that’s her point.'),
        ],
        tactic: [
          yes('practical', 'Be practical: what does he earn?'),
          yes('chores', 'Keep on with the chores, so it isn’t a scene'),
          no('tender', 'Hold her and let her cry', 'Not this mother; that’s the scene’s cruelty.'),
        ],
      },
    ],
  },
  {
    id: 'muchado-4-1', play: 'Much Ado About Nothing', by: 'William Shakespeare', year: 1599, where: 'Act Four, Scene One, the church', language: 'verse', size: 'medium',
    summary: 'Hero has been shamed at the altar and left for dead. Alone in the church, Beatrice and Benedick confess their love, and Beatrice asks him to kill Claudio.',
    circumstances: [
      yes('church', 'The church, minutes after the wedding broke apart and the others left'),
      no('masque', 'The masked ball in the first act', 'That’s earlier; this is after the failed wedding.'),
      no('garden', 'Leonato’s orchard, overheard', 'The overhearing scenes are in the garden; this is in the church.'),
    ],
    relationship: [
      yes('sparring', 'Old sparring partners, each tricked into love, now saying it outright'),
      no('married', 'A married couple', 'They aren’t married yet.'),
      no('enemies', 'Sworn enemies', 'They have sworn not to marry, not to hate each other.'),
    ],
    roles: [
      {
        name: 'Beatrice',
        objective: [
          yes('avenge', 'Have Hero avenged, and to know if his love will act'),
          no('marry-now', 'Marry Benedick before the day is out', 'She asks for Claudio’s death, not a wedding.'),
          no('mock', 'Win the battle of wits', 'Her wit gives way to grief and fury here.'),
        ],
        obstacle: [
          yes('man', 'She is a woman and can’t challenge Claudio herself; and Claudio is Benedick’s friend'),
          no('law', 'The law forbids duels', 'The law doesn’t come into it.'),
        ],
        tactic: [
          yes('demand', 'Demand it in three words, and refuse anything less'),
          yes('scorn', 'Scorn the men who talk and don’t act'),
          no('flatter', 'Flatter him into it', 'She shames him into it.'),
        ],
      },
      {
        name: 'Benedick',
        objective: [
          yes('win', 'Comfort her and win her, whatever it costs'),
          no('flee', 'Get out of the church before he’s asked anything', 'He stays and declares himself.'),
          no('defend', 'Defend Claudio’s honor', 'He comes to doubt Claudio and agrees to challenge him.'),
        ],
        obstacle: [
          yes('friend', 'Claudio is his friend, and she asks for his life'),
          no('prince', 'The Prince has ordered him away', 'No order comes in this scene.'),
        ],
        tactic: [
          yes('swear', 'Swear by his sword that he loves her'),
          yes('test', 'Ask if she truly believes Claudio wronged Hero'),
          no('joke', 'Answer with a joke, as always', 'He tries a jest and finds it doesn’t serve.'),
        ],
      },
    ],
  },
  {
    id: 'romeo-2-2', play: 'Romeo and Juliet', by: 'William Shakespeare', year: 1597, where: 'Act Two, Scene Two, the orchard', language: 'verse', size: 'long',
    summary: 'After the Capulets’ feast, Romeo climbs into the orchard and hears Juliet at her window speak of her love; they exchange vows and agree to marry.',
    circumstances: [
      yes('night', 'The night of the feast, in the Capulet orchard, Juliet at her window and the Nurse calling'),
      no('day', 'Midday in the square of Verona', 'It’s night, in the orchard below her window.'),
      no('tomb', 'The Capulet tomb', 'That’s the last act.'),
    ],
    relationship: [
      yes('new', 'Lovers who met hours ago, from families at war'),
      no('betrothed', 'A long-betrothed couple', 'They met that evening at the feast.'),
      no('cousins', 'Cousins', 'He is a Montague, she a Capulet.'),
    ],
    roles: [
      {
        name: 'Juliet',
        objective: [
          yes('sure', 'Be sure of him: that he loves her truly and means marriage'),
          no('send', 'Send him away for good', 'She calls him back three times.'),
          no('test-wit', 'Best him in wordplay', 'She asks him to stop swearing and speak plainly.'),
        ],
        obstacle: [
          yes('name', 'His name, her family, and the danger if he’s found'),
          no('nurse-out', 'The Nurse has locked the window', 'The Nurse calls her in; nothing is locked.'),
        ],
        tactic: [
          yes('plain', 'Ask him to speak plainly and not swear by the moon'),
          yes('plan', 'Make a plan: a messenger tomorrow, and a time'),
          no('coy', 'Play hard to get', 'She says she should have been more strange, and isn’t.'),
        ],
      },
      {
        name: 'Romeo',
        objective: [
          yes('win', 'Win her love and her promise'),
          no('escape', 'Escape the orchard unseen', 'He risks being found to stay.'),
          no('rosaline', 'Talk about Rosaline', 'Rosaline is forgotten.'),
        ],
        obstacle: [
          yes('feud', 'The feud: if her kinsmen find him they’ll kill him'),
          no('rival', 'Paris is with her', 'She is alone at her window.'),
        ],
        tactic: [
          yes('praise', 'Praise her, and swear'),
          yes('dare', 'Make light of the danger for her sake'),
          no('threaten', 'Threaten her family', 'He would give up his name for her.'),
        ],
      },
    ],
  },
  {
    id: 'macbeth-1-7', play: 'Macbeth', by: 'William Shakespeare', year: 1606, where: 'Act One, Scene Seven, outside the feast', language: 'verse', size: 'medium',
    summary: 'With Duncan at supper under his roof, Macbeth decides to go no further with the murder. Lady Macbeth finds him and turns him back.',
    circumstances: [
      yes('feast', 'Night at Inverness, Duncan at supper in the hall, Macbeth having left the table'),
      no('battle', 'The battlefield after the victory', 'That’s the first scenes; this is the night of Duncan’s visit.'),
      no('after', 'The morning after the murder', 'Duncan is still alive at supper.'),
    ],
    relationship: [
      yes('partners', 'A husband and wife who have been partners in everything, now divided'),
      no('strangers', 'Near strangers', 'She calls him her dearest partner of greatness.'),
      no('master', 'Master and servant', 'They’re husband and wife.'),
    ],
    roles: [
      {
        name: 'Lady Macbeth',
        objective: [
          yes('steel', 'Steel him to do it tonight'),
          no('stop', 'Talk him out of it', 'She talks him back into it.'),
          no('confess', 'Confess the plot to Duncan', 'The opposite.'),
        ],
        obstacle: [
          yes('conscience', 'His conscience, and his fear of failing'),
          no('guards', 'The guards are awake', 'She plans to drug them; they aren’t the problem here.'),
        ],
        tactic: [
          yes('shame', 'Shame his courage and his love'),
          yes('plan', 'Show him the plan is sure'),
          no('plead', 'Plead tearfully', 'She shames and commands; she doesn’t plead.'),
        ],
      },
      {
        name: 'Macbeth',
        objective: [
          yes('stop', 'Stop it here, and keep the honors he has'),
          no('hurry', 'Get it done quickly', 'He has decided to proceed no further.'),
          no('flee', 'Flee the castle', 'He stays, and is turned.'),
        ],
        obstacle: [
          yes('her', 'Her will, and her contempt for a man who won’t act'),
          no('witches', 'The witches have warned him off', 'They have done the opposite.'),
        ],
        tactic: [
          yes('reason', 'Reason: he’s his kinsman, his king and his guest'),
          yes('fear', 'Ask what happens if they fail'),
          no('laugh', 'Laugh it off', 'He means every word.'),
        ],
      },
    ],
  },
];

export const sceneById = (id: string): Scene | undefined => SCENES.find((s) => s.id === id);

/** How much longer learning a scene takes, by its size: SLATE's estimate. */
export const SCENE_SIZE_MINUTES: Readonly<Record<Scene['size'], number>> = { short: 45, medium: 75, long: 105 };

/**
 * What a course's work is: its kind of assignment, the steps that prepare
 * it, how much each part of the preparation weighs when it's shown, what the
 * showing reads in the craft, and what's asked of a partner and of material.
 * `dims` names each part as this course would (a voice teacher's "daily
 * practice" is a scene's "rehearsal"); a part a template doesn't list doesn't
 * count for it. The weights add to 1.
 */
export interface Template {
  id: string;
  courses: readonly string[];
  title: string;
  deliverable: string;
  /** A scene with a partner, a scene of one's own (a monologue or a text), or none. */
  material: 'scene' | 'verse-scene' | 'none';
  paired: boolean;
  dims: Partial<Record<PrepDim, { label: string; weight: number }>>;
  activities: readonly Activity[];
  /** The skills the showing reads, and how much each. */
  reads: Partial<Record<Skill, number>>;
  /** How many of the course's meetings after it's set it's shown. */
  dueAfter: number;
  /** Whether it's taken again, revised, at the next meeting after its feedback. */
  revised: boolean;
  /** How hard the work is against the class's year: what a skill at this level shows as ordinary. */
  par: number;
  /** What a teacher looks for in each part, as feedback names it. */
  notes: Partial<Record<PrepDim, string>>;
  /** The earliest a play may be for a course: Acting I's first term studies twentieth- and twenty-first-century plays (the Bulletin). */
  materialFrom?: Partial<Record<string, number>>;
  /** A course whose terms differ: this work only in that term (Intimacy And Combat's consent work in the fall, combat in the spring, by the Bulletin). */
  only?: Partial<Record<string, 'fall' | 'spring'>>;
  /** Material that is this season's play at Yale Rep (Text And Context, by the Bulletin), not a scene. */
  repPlay?: boolean;
}

const read: Activity = { id: 'read', label: 'Read The Scene', minutes: 40, dim: 'familiarity', gain: 0.55 };
const learn: Activity = { id: 'learn', label: 'Learn Lines', minutes: 60, dim: 'memorization', gain: 0.32, requires: { dim: 'familiarity', at: 0.3, why: 'Read it first: lines are learned from a scene you know.' }, trains: 'memorization' };
const alone: Activity = { id: 'rehearse', label: 'Rehearse Alone', minutes: 60, dim: 'rehearsal', gain: 0.28, requires: { dim: 'memorization', at: 0.25, why: 'Learn some of the lines first.' } };
const withPartner: Activity = { id: 'partner', label: 'Rehearse With Your Partner', minutes: 90, dim: 'partner', gain: 0.4, needs: ['partner'] };
const revise: Activity = { id: 'revise', label: 'Work On The Note', minutes: 60, dim: 'revision', gain: 0.45 };

/**
 * The Actor Showcase's scene (DRAM 793b): the Bulletin's "students choose and
 * rehearse scenes, which are presented to agents, managers, casting directors,
 * and other members of the industry in New York and Los Angeles". Shown in
 * class and again with the note taken; how it last went reads at the showcase
 * (`showcaseSceneSeen` in `systems/career.ts`). The scenes are SLATE's
 * public-domain ones: which scenes a class chooses isn't published.
 */
const SHOWCASE_SCENE: Template = {
  id: 'showcase-scene', courses: ['DRAM 793b'], title: 'Your Showcase Scene', deliverable: 'A scene rehearsed for the industry showcase, shown in class, then again with the note taken',
  material: 'scene', paired: true,
  dims: {
    familiarity: { label: 'Knows The Scene', weight: 0.1 }, memorization: { label: 'Lines', weight: 0.2 }, interpretation: { label: 'Table Work', weight: 0.2 },
    rehearsal: { label: 'Rehearsal', weight: 0.25 }, partner: { label: 'With Your Partner', weight: 0.25 },
  },
  activities: [read, learn, alone, withPartner, revise],
  reads: { scene: 2, audition: 1, character: 1 }, dueAfter: 4, revised: true, par: 62,
  notes: {
    familiarity: 'The scene isn’t known well enough yet to be lived in, and the room will see it.',
    memorization: 'The lines weren’t secure; in front of agents there’s no second take.',
    interpretation: 'The choices weren’t specific enough to show who you are in three minutes.',
    rehearsal: 'It needed more time on its feet before it’s shown to the industry.',
    partner: 'The two of you weren’t playing the same scene yet.',
  },
};

export const TEMPLATES: readonly Template[] = [
  {
    id: 'scene-study', courses: ['DRAM 103a/b', 'DRAM 303a'], title: 'Scene Study', deliverable: 'A scene shown in class, then shown again with the note taken',
    material: 'scene', paired: true,
    dims: {
      familiarity: { label: 'Knows The Scene', weight: 0.1 }, memorization: { label: 'Lines', weight: 0.25 }, interpretation: { label: 'Table Work', weight: 0.2 },
      rehearsal: { label: 'Rehearsal', weight: 0.2 }, partner: { label: 'With Your Partner', weight: 0.25 },
    },
    activities: [read, learn, alone, withPartner, revise],
    reads: { scene: 2, character: 1, emotion: 1 }, dueAfter: 4, revised: true, par: 50, materialFrom: { 'DRAM 103a/b': 1900 },
    notes: {
      familiarity: 'The scene isn’t known well enough yet to be lived in.',
      memorization: 'The lines weren’t secure, so the attention went to remembering, not to the other person.',
      interpretation: 'The choices weren’t specific: what each of you wants, and what’s in the way, needs deciding at the table.',
      rehearsal: 'It needed more time on its feet; the shape of it wasn’t found yet.',
      partner: 'The two of you weren’t playing the same scene yet: it needed time together.',
    },
  },
  {
    id: 'classical-scene', courses: ['DRAM 203a/b', 'DRAM 190a'], title: 'Heightened Text Scene', deliverable: 'A verse scene shown in class, then again with the note taken',
    material: 'verse-scene', paired: true,
    dims: {
      familiarity: { label: 'Knows The Scene', weight: 0.1 }, memorization: { label: 'Lines', weight: 0.25 }, interpretation: { label: 'Scansion And Table Work', weight: 0.25 },
      rehearsal: { label: 'Rehearsal', weight: 0.15 }, partner: { label: 'With Your Partner', weight: 0.25 },
    },
    activities: [read, learn, { id: 'scan', label: 'Scan The Verse', minutes: 50, dim: 'interpretation', gain: 0.35, requires: { dim: 'familiarity', at: 0.3, why: 'Read it first.' }, trains: 'classical' }, alone, withPartner, revise],
    reads: { classical: 2, scene: 1, voice: 1 }, dueAfter: 4, revised: true, par: 55,
    notes: {
      memorization: 'The verse wasn’t secure; the line endings kept getting lost.',
      interpretation: 'The verse wasn’t scanned: the stresses and the antitheses carry the thought, and they weren’t found.',
      rehearsal: 'It needed more time on its feet.',
      partner: 'The two of you weren’t yet in the same scene.',
      familiarity: 'The scene isn’t known well enough yet.',
    },
  },
  {
    id: 'voice-sequence', courses: ['DRAM 113a/b', 'DRAM 213a/b', 'DRAM 313a/b'], title: 'A Voice Sequence', deliverable: 'The breath and resonance sequence shown, then a short text spoken on it',
    material: 'none', paired: false,
    dims: { familiarity: { label: 'The Sequence Learned', weight: 0.3 }, rehearsal: { label: 'Daily Practice', weight: 0.7 } },
    activities: [
      { id: 'learn-sequence', label: 'Learn The Sequence', minutes: 30, dim: 'familiarity', gain: 0.5 },
      { id: 'practice', label: 'Practice The Sequence', minutes: 30, dim: 'rehearsal', gain: 0.3, daily: true, requires: { dim: 'familiarity', at: 0.4, why: 'Learn the sequence first.' }, trains: 'voice' },
    ],
    reads: { voice: 3 }, dueAfter: 4, revised: false, par: 50,
    notes: {
      familiarity: 'The sequence itself wasn’t learned, so the breath was working against it.',
      rehearsal: 'It hadn’t been practiced day by day: a voice opens over days, not in one session.',
    },
  },
  {
    id: 'speech-drill', courses: ['DRAM 123a/b', 'DRAM 223a/b', 'DRAM 323a/b'], title: 'Sound Changes And A Text', deliverable: 'A text transcribed and spoken with the term’s sound changes',
    material: 'none', paired: false,
    dims: { interpretation: { label: 'Transcription', weight: 0.35 }, memorization: { label: 'The Text', weight: 0.2 }, rehearsal: { label: 'Drills', weight: 0.45 } },
    activities: [
      { id: 'transcribe', label: 'Transcribe The Text', minutes: 60, dim: 'interpretation', gain: 0.45, trains: 'speech' },
      { id: 'learn-text', label: 'Learn The Text', minutes: 30, dim: 'memorization', gain: 0.4 },
      { id: 'drill', label: 'Drill The Sounds', minutes: 30, dim: 'rehearsal', gain: 0.3, daily: true, requires: { dim: 'interpretation', at: 0.3, why: 'Transcribe it first, to know which sounds to drill.' }, trains: 'accents' },
    ],
    reads: { speech: 2, accents: 1 }, dueAfter: 4, revised: false, par: 50,
    notes: {
      interpretation: 'The transcription had gaps, and the sounds that weren’t marked weren’t made.',
      memorization: 'The text wasn’t learned, so the eyes were on the page.',
      rehearsal: 'The drills weren’t done enough: the new sounds slipped back under pressure.',
    },
  },
  {
    id: 'movement-score', courses: ['DRAM 133a/b', 'DRAM 233a/b', 'DRAM 273a', 'DRAM 373a', 'DRAM 273b'], title: 'A Movement Score', deliverable: 'A short movement score of your own, shown',
    material: 'none', paired: false,
    dims: { interpretation: { label: 'The Score Made', weight: 0.4 }, rehearsal: { label: 'Rehearsed In The Body', weight: 0.6 } },
    activities: [
      { id: 'devise', label: 'Devise The Score', minutes: 60, dim: 'interpretation', gain: 0.4, needs: ['studio', 'moveClothes'] },
      { id: 'rehearse-score', label: 'Rehearse The Score', minutes: 45, dim: 'rehearsal', gain: 0.3, needs: ['studio', 'moveClothes'], requires: { dim: 'interpretation', at: 0.3, why: 'Make the score first.' }, trains: 'movement' },
    ],
    reads: { movement: 2, dance: 1 }, dueAfter: 4, revised: false, par: 50,
    notes: {
      interpretation: 'The score wasn’t made yet; it was found in the room, which shows.',
      rehearsal: 'The score wasn’t in the body yet: it was being remembered, not done.',
    },
  },
  {
    id: 'alexander-practice', courses: ['DRAM 143a/b', 'DRAM 243a/b', 'DRAM 343a/b'], title: 'Directions In Daily Life', deliverable: 'The lesson’s directions shown in a simple action, in the tutorial',
    material: 'none', paired: false,
    dims: { rehearsal: { label: 'Daily Practice', weight: 0.7 }, familiarity: { label: 'The Directions Understood', weight: 0.3 } },
    activities: [
      { id: 'review', label: 'Review The Lesson', minutes: 20, dim: 'familiarity', gain: 0.5 },
      { id: 'daily', label: 'Practice The Directions', minutes: 20, dim: 'rehearsal', gain: 0.25, daily: true, requires: { dim: 'familiarity', at: 0.3, why: 'Review the lesson first.' }, trains: 'movement' },
    ],
    reads: { movement: 2 }, dueAfter: 4, revised: false, par: 50,
    notes: {
      familiarity: 'The directions weren’t clear yet, so they were done as positions, not thoughts.',
      rehearsal: 'It wasn’t practiced in daily life between lessons. That’s where it takes.',
    },
  },
  {
    id: 'play-game', courses: ['DRAM 153a', 'DRAM 353a', 'DRAM 363a'], title: 'A Game Played Through', deliverable: 'An improvised game played in class',
    material: 'none', paired: true,
    dims: { partner: { label: 'Played Together', weight: 0.6 }, rehearsal: { label: 'Built On', weight: 0.4 } },
    activities: [
      { ...withPartner, label: 'Play The Game With Your Partner', minutes: 60, gain: 0.45 },
      { id: 'build', label: 'Build On What Came Up', minutes: 40, dim: 'rehearsal', gain: 0.35, requires: { dim: 'partner', at: 0.3, why: 'Play it together first: there’s nothing yet to build on.' }, trains: 'improv' },
    ],
    reads: { improv: 2, emotion: 1 }, dueAfter: 3, revised: false, par: 50,
    notes: {
      partner: 'The two of you hadn’t played together, so you were each playing alone.',
      rehearsal: 'The last session wasn’t built on; it started from scratch again.',
    },
  },
  {
    id: 'table-work', courses: ['DRAM 163b', 'DRAM 163a'], title: 'Table Work', deliverable: 'A scene’s given circumstances, relationship and actions presented at the table',
    material: 'scene', paired: false,
    dims: { familiarity: { label: 'Knows The Play', weight: 0.3 }, interpretation: { label: 'The Analysis', weight: 0.5 }, revision: { label: 'Written Up', weight: 0.2 } },
    activities: [
      { ...read, label: 'Read The Play' },
      { id: 'write', label: 'Write It Up', minutes: 60, dim: 'revision', gain: 0.45, requires: { dim: 'interpretation', at: 0.4, why: 'Answer the questions first: there’s nothing to write up yet.' }, trains: 'script' },
    ],
    reads: { script: 3 }, dueAfter: 3, revised: false, par: 50,
    notes: {
      familiarity: 'The play wasn’t read closely enough to back the claims.',
      interpretation: 'The analysis made choices the text doesn’t support.',
      revision: 'It wasn’t written up, so it was explained, not presented.',
    },
  },
  {
    id: 'fight-sequence', courses: ['DRAM 403a/b', 'DRAM 405a/b'], title: 'A Choreographed Sequence', deliverable: 'A short combat sequence shown at speed, safely, with a partner',
    material: 'none', paired: true,
    dims: { familiarity: { label: 'The Choreography Learned', weight: 0.3 }, partner: { label: 'Drilled With Your Partner', weight: 0.5 }, rehearsal: { label: 'Alone', weight: 0.2 } },
    activities: [
      { id: 'learn-fight', label: 'Learn The Choreography', minutes: 40, dim: 'familiarity', gain: 0.45, needs: ['moveClothes'] },
      { id: 'shadow', label: 'Run It Alone, At Half Speed', minutes: 30, dim: 'rehearsal', gain: 0.35, needs: ['moveClothes'], requires: { dim: 'familiarity', at: 0.3, why: 'Learn the choreography first.' }, trains: 'combat' },
      { ...withPartner, label: 'Drill It With Your Partner', minutes: 60, needs: ['partner', 'studio', 'moveClothes'], requires: { dim: 'familiarity', at: 0.4, why: 'Learn the choreography before drilling it together: a sequence isn’t found with a partner at speed.' } },
    ],
    reads: { combat: 2, intimacy: 1 }, dueAfter: 4, revised: false, par: 50, only: { 'DRAM 403a/b': 'spring' },
    notes: {
      familiarity: 'The choreography wasn’t secure, and that’s when a sequence isn’t safe.',
      partner: 'It hadn’t been drilled together, so the timing between you wasn’t shared.',
      rehearsal: 'It hadn’t been run alone at half speed.',
    },
  },
  {
    id: 'intimacy-practice', courses: ['DRAM 403a/b'], title: 'Consent And Intimacy Practice', deliverable: 'A short choreographed moment of intimacy shown, with its boundaries agreed and kept',
    material: 'none', paired: true, only: { 'DRAM 403a/b': 'fall' },
    dims: { familiarity: { label: 'The Practice Learned', weight: 0.3 }, partner: { label: 'Practiced Together', weight: 0.5 }, rehearsal: { label: 'The Score Recalled', weight: 0.2 } },
    activities: [
      { id: 'protocol', label: 'Review The Consent Practice', minutes: 30, dim: 'familiarity', gain: 0.5 },
      { ...withPartner, label: 'Practice The Moment With Your Partner', minutes: 60, needs: ['partner', 'studio'], requires: { dim: 'familiarity', at: 0.5, why: 'Agree how you’ll work first: no partner work without the boundaries set.' } },
      { id: 'score', label: 'Write Out The Score', minutes: 20, dim: 'rehearsal', gain: 0.45, requires: { dim: 'partner', at: 0.3, why: 'Work it with your partner first: there’s no score yet to write out.' }, trains: 'intimacy' },
    ],
    reads: { intimacy: 2, movement: 1 }, dueAfter: 4, revised: false, par: 50,
    notes: {
      familiarity: 'The practice wasn’t yet second nature, so the work kept stopping to check.',
      partner: 'It hadn’t been practiced together, so neither of you could trust the moment.',
      rehearsal: 'The score wasn’t fixed, so it changed from time to time, which isn’t safe.',
    },
  },
  {
    id: 'context-presentation', courses: ['DRAM 873a/b'], title: 'A Play In Its Context', deliverable: 'A short presentation on the season’s play at Yale Rep, its world and its writer',
    material: 'none', paired: false, repPlay: true,
    dims: { familiarity: { label: 'The Play Read', weight: 0.35 }, interpretation: { label: 'Its Context Researched', weight: 0.35 }, revision: { label: 'The Presentation Prepared', weight: 0.3 } },
    activities: [
      { id: 'read-play', label: 'Read The Play', minutes: 90, dim: 'familiarity', gain: 0.55 },
      { id: 'research', label: 'Research It At The Library', minutes: 90, dim: 'interpretation', gain: 0.4, needs: ['library'], requires: { dim: 'familiarity', at: 0.3, why: 'Read the play first: research needs questions.' }, trains: 'script' },
      { id: 'prepare-talk', label: 'Prepare The Presentation', minutes: 60, dim: 'revision', gain: 0.45, requires: { dim: 'interpretation', at: 0.3, why: 'Research it first: there’s nothing yet to present.' } },
    ],
    reads: { script: 3 }, dueAfter: 3, revised: false, par: 50,
    notes: {
      familiarity: 'The play hadn’t been read closely enough to speak to.',
      interpretation: 'The context was thin: who wrote it, when, and for whom, needed research.',
      revision: 'It wasn’t prepared as a presentation, so it wandered.',
    },
  },
  {
    id: 'song', courses: ['DRAM 413a/b', 'DRAM 423a/b'], title: 'A Song Worked Through', deliverable: 'A song sung for the class, acted',
    material: 'none', paired: false,
    dims: { memorization: { label: 'Music And Words Learned', weight: 0.35 }, interpretation: { label: 'What It’s About', weight: 0.25 }, rehearsal: { label: 'Practice', weight: 0.4 } },
    activities: [
      { id: 'learn-song', label: 'Learn The Song', minutes: 45, dim: 'memorization', gain: 0.35, trains: 'singing' },
      { id: 'song-text', label: 'Work The Lyric As Text', minutes: 30, dim: 'interpretation', gain: 0.45 },
      { id: 'sing', label: 'Practice Singing It', minutes: 30, dim: 'rehearsal', gain: 0.3, daily: true, requires: { dim: 'memorization', at: 0.3, why: 'Learn the song first.' } },
    ],
    reads: { singing: 2, emotion: 1 }, dueAfter: 4, revised: false, par: 50,
    notes: {
      memorization: 'The song wasn’t learned, so the singing was reading.',
      interpretation: 'The lyric wasn’t worked as text: it was sung, not said.',
      rehearsal: 'It wasn’t sung enough before it was shown.',
    },
  },
  {
    id: 'self-tape', courses: ['DRAM 463a/b', 'DRAM 473b'], title: 'A Self-Tape', deliverable: 'A scene recorded on your phone and reviewed in class',
    material: 'scene', paired: false,
    dims: { memorization: { label: 'Lines', weight: 0.3 }, interpretation: { label: 'Choices', weight: 0.2 }, rehearsal: { label: 'Takes Recorded', weight: 0.5 } },
    activities: [read, learn, { id: 'record', label: 'Record A Take', minutes: 45, dim: 'rehearsal', gain: 0.35, needs: ['phone'], requires: { dim: 'memorization', at: 0.4, why: 'Learn the lines before taping: a camera sees eyes on the page.' }, trains: 'screen' }],
    reads: { screen: 2, scene: 1 }, dueAfter: 3, revised: false, par: 55,
    notes: {
      memorization: 'The lines weren’t secure, and the lens saw it.',
      interpretation: 'The choices weren’t specific enough for a close shot.',
      rehearsal: 'It needed more takes before the one shown.',
    },
  },
  {
    id: 'clown-turn', courses: ['DRAM 263a/b', 'DRAM 253a'], title: 'A Clown Turn', deliverable: 'A short turn played to the class',
    material: 'none', paired: false,
    dims: { interpretation: { label: 'The Turn Found', weight: 0.4 }, rehearsal: { label: 'Played Through', weight: 0.6 } },
    activities: [
      { id: 'find-turn', label: 'Find The Turn', minutes: 45, dim: 'interpretation', gain: 0.4, needs: ['studio'] },
      { id: 'play-turn', label: 'Play It Through', minutes: 30, dim: 'rehearsal', gain: 0.3, needs: ['studio'], requires: { dim: 'interpretation', at: 0.3, why: 'Find the turn first.' }, trains: 'clown' },
    ],
    reads: { clown: 2, comedy: 1 }, dueAfter: 3, revised: false, par: 55,
    notes: {
      interpretation: 'The turn hadn’t been found: there was nothing simple at its heart yet.',
      rehearsal: 'It hadn’t been played through enough to be free in front of people.',
    },
  },
  {
    id: 'audition-pair', courses: ['DRAM 743b'], title: 'Two Contrasting Monologues', deliverable: 'Two contrasting monologues shown as an audition',
    material: 'scene', paired: false,
    dims: { memorization: { label: 'Lines', weight: 0.35 }, interpretation: { label: 'Choices', weight: 0.25 }, rehearsal: { label: 'Rehearsal', weight: 0.4 } },
    activities: [read, learn, alone],
    reads: { audition: 2, coldReading: 1, scene: 1 }, dueAfter: 4, revised: false, par: 60,
    notes: {
      memorization: 'The pieces weren’t secure.',
      interpretation: 'The two weren’t contrasting enough to show range.',
      rehearsal: 'They needed more rehearsal to land in the room.',
    },
  },
  SHOWCASE_SCENE,
];

export const templateById = (id: string): Template | undefined => TEMPLATES.find((t) => t.id === id);
/** A course's work in a term: the template that lists it, and for a course whose terms differ, the term's. */
export const templateFor = (courseCode: string, term: 'fall' | 'spring'): Template | undefined => TEMPLATES.find((t) => t.courses.includes(courseCode) && (!t.only?.[courseCode] || t.only[courseCode] === term));
