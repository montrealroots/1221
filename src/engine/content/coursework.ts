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
import { CLASSICAL_SCENES } from './scenes-classical';
import { MODERN_SCENES } from './scenes-modern';
import { GREEK_SCENES } from './scenes-greek';
import { ORIGINAL_SCENES } from './scenes-original';
import { PUBLIC_SCENES } from './scenes-public';
import { HOUSE_SCENES } from './scenes-house';
import { SCORED_SCENES } from './scenes-scored';

/** The parts of a preparation SLATE keeps, each 0 to 1. */
export type PrepDim = 'familiarity' | 'memorization' | 'interpretation' | 'rehearsal' | 'partner' | 'revision';
export const PREP_DIMS: readonly PrepDim[] = ['familiarity', 'memorization', 'interpretation', 'rehearsal', 'partner', 'revision'];

/**
 * What a step needs to be done at all, beyond time: a partner present, a room at school, the library, or a body with
 * the energy to work on its feet. Until 2026-10-09 a step on its feet needed clothes to move in and a recorded take a
 * phone that records, which the wardrobe and the phones kept; both went in the scope reset, and a step needing them
 * was let through every time. On its feet, it asks the energy it always did; a take is recorded on whatever phone
 * a student has, which SLATE doesn't keep.
 */
export type Need = 'partner' | 'studio' | 'feet' | 'library';

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
/** An answer: supported by the text or cut against by it, and why either way (for a supported one, what it rests on). */
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
  /**
   * Modern prose drama, or classical heightened text, which a classical
   * course asks for. 'verse' is the classical side, Shakespeare's prose
   * included: Much Ado's church scene is prose, and the course takes it for
   * its period and its wit, not its meter.
   */
  language: 'prose' | 'verse';
  size: 'short' | 'medium' | 'long';
  /** What kind of play it is, by its own tradition (Chekhov called The Cherry Orchard a comedy; SLATE files a scene by what it plays as). */
  genre: 'comedy' | 'drama' | 'tragedy';
  /**
   * How much a scene asks of an actor, 1 to 3 (SLATE's reading: its length,
   * how far its feeling travels, how much its language asks). Work is matched
   * to where an actor is (`scenesFor` in `systems/coursework.ts`).
   */
  difficulty: 1 | 2 | 3;
  /** A tradition a course asks for by name: The Greeks' tragedies and comedies in translation. */
  tradition?: 'greek';
  /**
   * An original scene written for SLATE (from 2026-10-08), set now: plays after
   * 1930 are under copyright and aren't reproduced, and nothing is invented and
   * put to a real playwright (research-contemporary-material.json). Shown as
   * SLATE's own. Every other scene is from a public-domain play.
   */
  origin?: 'original';
  /** An original scene's given facts, the text its readings rest on (a public-domain scene's text is its play). */
  facts?: readonly string[];
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

/** A reading the text supports; `why`, where given, is what in the text it rests on (a second defensible reading of the same question says its own). */
export const yes = (id: string, text: string, why?: string): Option => ({ id, text, supported: true, ...(why ? { why } : {}) });
export const no = (id: string, text: string, why: string): Option => ({ id, text, supported: false, why });

export const SCENES: readonly Scene[] = [
  {
    id: 'seagull-4', play: 'The Seagull', by: 'Anton Chekhov', year: 1896, where: 'Act Four', language: 'prose', size: 'long', genre: 'drama', difficulty: 3,
    summary: 'Two years after she left with Trigorin, Nina comes in from the storm to Konstantin’s study. She has been acting in the provinces and lost her child; he still loves her and begs her to stay.',
    circumstances: [
      yes('storm', 'A stormy autumn night, two years on; she has come in secret, and the household is at dinner next door', 'The wind has blown for two days, and she slips in while Arkadina’s party is at supper and asks him to lock the door.'),
      no('lake', 'A still summer evening by the lake, before Konstantin’s play', 'That’s the first act; by the fourth, two years have passed and it’s a wet autumn night.'),
      no('wedding', 'The morning after Nina and Trigorin are married', 'Trigorin never marries her; he has gone back to Arkadina.'),
    ],
    relationship: [
      yes('first-love', 'First loves; he still loves her, and she still loves Trigorin', 'He has stood beneath her window like a beggar all week; she tells him she loves Trigorin even more than she used to.'),
      no('strangers', 'Near strangers meeting again', 'They grew up as neighbors and were in love before the play begins.'),
      no('rivals', 'Two writers competing for the same theater', 'Nina is an actress, not a writer, and nothing in the scene is about competing.'),
    ],
    roles: [
      {
        name: 'Nina',
        objective: [
          yes('hold-on', 'Be understood, and to hold on to her calling as an actress', 'She keeps catching herself, saying she’s a seagull and then that she’s an actress, and says when she thinks of her calling she doesn’t fear life.'),
          yes('not-hated', 'Find out whether he hates her, and sit an hour somewhere warm', '“I was afraid you might hate me,” she tells him, and asks to sit down and talk their hearts out where it’s quiet and warm.'),
          no('marry', 'Win Konstantin back and stay with him', 'He asks her to stay and she refuses; she leaves into the night.'),
          no('money', 'Borrow money for the journey', 'Money isn’t what she comes for; nothing in the scene asks for it.'),
        ],
        obstacle: [
          yes('trigorin', 'She still loves Trigorin, and she’s exhausted and close to breaking', 'She says she loves Trigorin to despair, and that she’s so tired, if she could only rest.'),
          no('family', 'Her father has forbidden the visit', 'Her father’s house is closed to her, but it isn’t what stops her here.'),
        ],
        tactic: [
          yes('memory', 'Steady herself by going back to the old lines of his play', 'Before she runs out she recites the opening of his play, the lines she spoke by the lake two years ago.'),
          no('flirt', 'Flirt, to see if he still wants her', 'She knows he does; her trouble is herself, not his feelings.'),
          yes('confess', 'Tell him the truth of the two years plainly', 'She tells him of Trigorin laughing at her dreams, the child, and acting so badly she didn’t know what to do with her hands.'),
        ],
      },
      {
        name: 'Konstantin',
        objective: [
          yes('stay', 'Make her stay, or take him with her', '“Stay here, Nina, I beseech you, or else let me go away with you.”'),
          no('send', 'Get her out before his mother sees her', 'He is the one who keeps her there and begs her to stay.'),
          no('forget', 'Show her he has got over her', 'He tells her outright that he can’t stop loving her.'),
        ],
        obstacle: [
          yes('her-love', 'She loves Trigorin, not him, and she has a life she means to go back to', 'She tells him she loves Trigorin, and that she leaves for an engagement at Eltz in the morning.'),
          no('success', 'His success as a writer keeps him too busy', 'His stories are published, but he says he has no faith and no calling.'),
        ],
        tactic: [
          yes('plead', 'Plead, and to offer her everything he has', 'He tells her he has cursed her and torn up her photograph, and kissed the ground she walked on.'),
          yes('listen', 'Hold back and let her speak, hoping she’ll come round', 'Once she reaches for her coat his lines shrink to a few words, and she talks out her two years.'),
          no('mock', 'Mock her acting career', 'Nothing in his lines does; he follows her career and cares for her.'),
        ],
      },
    ],
  },
  {
    id: 'dollhouse-3', play: 'A Doll’s House', by: 'Henrik Ibsen', year: 1879, where: 'Act Three, the last scene', language: 'prose', size: 'long', genre: 'drama', difficulty: 3,
    summary: 'Helmer has read Krogstad’s letter, raged at Nora, then forgiven her once the bond came back. Nora changes out of her costume, sits him down for their first serious talk in eight years, and leaves.',
    circumstances: [
      yes('night', 'Late at night after the costume party, the danger just over and Helmer relieved', 'Helmer brings her up from the dance, and she changes out of her costume and says she won’t sleep tonight.'),
      no('christmas', 'Christmas Eve, as the tree is brought in', 'That’s the first act; this is the night after the dance, two days later.'),
      no('morning', 'The next morning, after a night’s sleep', 'It’s the same night; she changes out of her costume and doesn’t go to bed.'),
    ],
    relationship: [
      yes('marriage', 'Husband and wife of eight years who have never spoken as equals', 'She tells him this is the first serious conversation they have had in eight years of marriage.'),
      no('equals', 'Partners who have always shared everything', 'Nora says they have never once had a serious talk.'),
      no('rivals', 'Two people competing for Krogstad’s favor', 'Krogstad is the threat, not a prize.'),
    ],
    roles: [
      {
        name: 'Nora',
        objective: [
          yes('see', 'Make him see their marriage as it has been, and to leave on her own terms', 'She tells him he never loved her, only thought it pleasant to be in love with her, and that she has been his doll-wife.'),
          yes('stand-alone', 'Go and educate herself, alone', 'She tells him she must stand quite alone to understand herself, and that he isn’t the man to help her.'),
          no('forgive', 'Be forgiven and put things back as they were', 'He forgives her; it’s she who won’t go back.'),
          no('punish', 'Make him pay for his anger', 'She is past anger; she’s calm and clear.'),
        ],
        obstacle: [
          yes('habit', 'Eight years of being his doll, and his certainty that she’s a child', '“You talk like a child,” he tells her, and insists that before all else she’s a wife and a mother.'),
          no('money', 'She has no money for the journey', 'Money isn’t what keeps her; she leaves with what she has.'),
        ],
        tactic: [
          yes('reckon', 'Sit him down and settle accounts, calmly', 'She sits him down across the table and tells him this is a settling of accounts.'),
          yes('return', 'Give back his ring and take back her own', 'She gives him back his ring, asks for hers, and leaves the keys.'),
          no('tears', 'Weep until he gives in', 'She is dry-eyed and certain; the tears were earlier.'),
        ],
      },
      {
        name: 'Helmer',
        objective: [
          yes('keep', 'Keep her, and to keep the life they had', 'He forbids her to go, then begs her to wait until tomorrow, or to live there like brother and sister.'),
          yes('understand', 'Make sense of what’s happened to her', 'He calls her ill and delirious, then asks what he has done to forfeit her love.'),
          no('divorce', 'Be rid of her for the scandal', 'He forgives her as soon as the bond is returned and begs her to stay.'),
          no('money', 'Find out where the money went', 'He has the letter; the money isn’t the question now.'),
        ],
        obstacle: [
          yes('changed', 'She has changed in a night and he doesn’t understand her', '“You alarm me, Nora!—and I don’t understand you,” he says to her cold, set face.'),
          no('krogstad', 'Krogstad is still threatening them', 'The bond has come back; that danger is over.'),
        ],
        tactic: [
          yes('reason', 'Reason with her, and appeal to her duty to husband and children', 'He asks whether her most sacred duties aren’t to husband and children, then appeals to her religion and her conscience.'),
          yes('promise', 'Promise he can change', '“I have it in me to become a different man,” he tells her.'),
          no('laugh', 'Laugh it off as a joke', 'He tries to make light of it once and she won’t let him.'),
        ],
      },
    ],
  },
  {
    id: 'earnest-2', play: 'The Importance of Being Earnest', by: 'Oscar Wilde', year: 1895, where: 'Act Two, the garden', language: 'prose', size: 'medium', genre: 'comedy', difficulty: 2,
    summary: 'Gwendolen arrives at the Manor House and meets Cecily, whom she takes for a guest. Each learns the other believes she’s engaged to Ernest Worthing, and tea becomes a war of manners.',
    circumstances: [
      yes('garden', 'A summer afternoon in the Manor House garden, tea about to be served', 'Merriman lays tea in the garden “as usual,” and the servants’ presence holds both their tongues.'),
      no('ballroom', 'A London ball, in front of everyone', 'It’s a private garden in the country, with only the butler and footman about.'),
      no('wedding', 'The day after a double wedding', 'Neither is married; each believes she’s engaged.'),
    ],
    relationship: [
      yes('strangers', 'Strangers who become rivals in a minute, each perfectly polite', 'They introduce themselves and vow to be great friends a minute before Ernest’s name comes up.'),
      no('sisters', 'Sisters who have quarreled before', 'They have never met before this scene.'),
      no('old-friends', 'Old school friends', 'They meet here for the first time.'),
    ],
    roles: [
      {
        name: 'Cecily',
        objective: [
          yes('claim', 'Defend her claim to Ernest, with perfect sweetness', 'She says she’ll never reproach her dear boy with any entanglement once they’re married.'),
          no('give-up', 'Give Ernest up graciously', 'She produces her diary to prove her prior claim.'),
          no('friend', 'Make a friend and nothing more', 'The friendship ends as soon as Ernest is mentioned.'),
        ],
        obstacle: [
          yes('gwendolen', 'Gwendolen has a prior claim, and the manners of town', 'Gwendolen’s own diary has Ernest proposing to her yesterday afternoon at 5.30, and she looks Cecily over through a lorgnette.'),
          no('aunt', 'Her aunt is watching from the window', 'Her guardian is away; it’s the two of them.'),
        ],
        tactic: [
          yes('sugar', 'Fight with the tea: sugar in it, cake instead of bread and butter', 'She puts four lumps in Gwendolen’s tea and has her handed a huge slice of cake.'),
          yes('diary', 'Prove her engagement from her diary', '“Ernest proposed to me exactly ten minutes ago,” she says, and shows her diary.'),
          no('shout', 'Shout her down', 'The comedy is that neither raises her voice.'),
        ],
      },
      {
        name: 'Gwendolen',
        objective: [
          yes('assert', 'Assert her prior claim and put the country girl in her place', 'She calls Cecily presumptuous and says it’s her duty to rescue Ernest from any foolish promise with a firm hand.'),
          yes('size-up', 'Find out who this girl is, and what she is to Ernest', 'She examines Cecily through a lorgnette and asks whether she’s here on a short visit.'),
          no('leave', 'Get away from the house quickly', 'She stays and fights the tea through.'),
          no('ally', 'Make Cecily an ally against Ernest', 'That comes later, when the men are found out; not in this scene.'),
        ],
        obstacle: [
          yes('cecily', 'Cecily is young, pretty and has a diary with dates in it', 'Cecily is his ward, lives in the house, and has a diary that makes her claim ten minutes old.'),
          no('mother', 'Lady Bracknell has forbidden her to marry', 'Her mother does, but Lady Bracknell isn’t what she faces here.'),
        ],
        tactic: [
          yes('freeze', 'Freeze her out with town manners', 'She hates crowds, she says, and can’t understand how anybody who is anybody exists in the country.'),
          yes('diary', 'Match her diary with her own', 'She produces her own diary: he asked her yesterday at 5.30, and the announcement will be in the Morning Post.'),
          no('cry', 'Break down in tears', 'She stays composed; that’s the joke.'),
        ],
      },
    ],
  },
  {
    id: 'vanya-2', play: 'Uncle Vanya', by: 'Anton Chekhov', year: 1898, where: 'Act Two, at night', language: 'prose', size: 'medium', genre: 'drama', difficulty: 2,
    summary: 'In the small hours, after the storm, Sonya and her young stepmother Yelena make up after weeks of coldness and drink to it. Sonya confides she loves the doctor, Astrov.',
    circumstances: [
      yes('night', 'The middle of a sleepless night in the dining room, the storm passing', 'Yelena opens the window on the storm’s passing, and the Professor is still sitting up in the drawing room.'),
      no('picnic', 'A sunny afternoon picnic', 'It’s past one in the morning, after a storm.'),
      no('funeral', 'The day of the Professor’s funeral', 'The Professor is alive, and complaining in the next room.'),
    ],
    relationship: [
      yes('step', 'A young stepmother and her stepdaughter, cold for weeks, now reconciling', 'Yelena asks how much longer Sonya means to sulk at her, after weeks of not speaking.'),
      no('sisters', 'Sisters who have always been close', 'They have barely been speaking.'),
      no('rivals-open', 'Open rivals for Astrov', 'Sonya loves Astrov; Yelena doesn’t admit to anything, and they make up.'),
    ],
    roles: [
      {
        name: 'Sonya',
        objective: [
          yes('hope', 'Find out, from someone who might know, whether she has any hope with Astrov', 'She has sounded Astrov out about a “younger sister,” and now asks Yelena whether she likes the doctor and begs her to talk of him.'),
          yes('friends', 'Make friends with Yelena at last', '“I have long wanted to make friends, but somehow, I was ashamed to,” she says.'),
          no('quarrel', 'Pick a fight with Yelena', 'She is the one who offers peace.'),
          no('leave', 'Persuade Yelena to leave the estate', 'Nothing in the scene asks her to go.'),
        ],
        obstacle: [
          yes('plain', 'She believes she’s plain, and Astrov hardly notices her', 'Alone before Yelena comes in, she says it’s terrible to be plain, and that she knows she is.'),
          no('father', 'Her father has forbidden her to marry', 'He hasn’t; he hasn’t thought about it at all.'),
        ],
        tactic: [
          yes('confide', 'Confide in her, as a friend at last', 'She tells Yelena she still hears Astrov’s voice and sees his face in the dark window.'),
          yes('ask', 'Ask her plainly whether she’s happy', '“Tell me truly, as a friend, are you happy?” she asks.'),
          no('accuse', 'Accuse her of flirting with Astrov', 'She makes peace first, and confides.'),
        ],
      },
      {
        name: 'Yelena',
        objective: [
          yes('peace', 'Make peace, and not to be so alone in the house', 'She asks Sonya to stop sulking and be friends, and confesses she’s unhappy herself.'),
          no('astrov', 'Win Astrov for herself tonight', 'Whatever she feels, here she praises him to Sonya.'),
          no('money', 'Ask Sonya for money', 'Money doesn’t come into it.'),
        ],
        obstacle: [
          yes('boredom', 'Her own boredom and unhappiness, and Sonya’s mistrust of her', 'She calls herself futile in music, in love and in her husband’s house, and says Sonya’s suspicious eyes have punished her since the marriage.'),
          no('husband-gone', 'Her husband has left her', 'He is in the next room.'),
        ],
        tactic: [
          yes('toast', 'Drink to friendship', 'She fills one glass for them both to seal the friendship.'),
          yes('music', 'Ask for music, to break the gloom', 'She wants to play, and sends Sonya to ask her father, who says no.'),
          no('order', 'Order her about as a stepmother', 'She asks to be friends instead.'),
        ],
      },
    ],
  },
  {
    id: 'trifles', play: 'Trifles', by: 'Susan Glaspell', year: 1916, where: 'The one act, the Wright kitchen', language: 'prose', size: 'medium', genre: 'drama', difficulty: 1,
    summary: 'While the men search the farmhouse for a motive for John Wright’s murder, Mrs. Hale and Mrs. Peters, the sheriff’s wife, find the dead canary in Minnie Wright’s sewing box, and decide what to do with it.',
    circumstances: [
      yes('kitchen', 'A cold winter morning in the dead man’s kitchen, the men upstairs looking for evidence', 'It went to zero the night before, and the men go upstairs and out to the barn while the women wait in the kitchen.'),
      no('trial', 'The courtroom during Minnie’s trial', 'The play is in the kitchen, before any trial.'),
      no('party', 'A quilting party at the Hales’ farm', 'They’re in the Wright house, gathering things for Minnie in jail.'),
    ],
    relationship: [
      yes('neighbors', 'Two farm women who barely know each other, coming to understand one another', 'Mrs. Hale has to ask whether Mrs. Peters was raised round there; she never knew Minnie until the day before.'),
      no('friends', 'Lifelong friends', 'They hardly know each other; that’s part of the scene.'),
      no('enemies', 'Old enemies', 'Nothing says they are; they come to the same side.'),
    ],
    roles: [
      {
        name: 'Mrs. Hale',
        objective: [
          yes('protect', 'Protect Minnie, and make up for not visiting her', 'She slips the box under the quilt pieces, tells the men the cat got the bird, and wishes aloud she had come over.'),
          yes('understand', 'Find out what happened in this house, and why', 'She asks what Minnie was so nervous about, reading the half-wiped table and the bad sewing.'),
          no('convict', 'Help the men find the motive', 'She hides what they find.'),
          no('leave', 'Get home as soon as she can', 'She stays and does the work they came for.'),
        ],
        obstacle: [
          yes('law', 'Mrs. Peters is married to the law, and the men could come down at any moment', 'The county attorney reminds them a sheriff’s wife is married to the law, and the men come down the stairs more than once.'),
          no('weather', 'The snow has closed the road', 'They came by the road and will leave by it.'),
        ],
        tactic: [
          yes('remind', 'Remind Mrs. Peters what Minnie’s life was', 'She tells Mrs. Peters about Minnie Foster singing in the choir in a white dress with blue ribbons.'),
          yes('hide', 'Hide the box before the men see it', 'When the box won’t fit in Mrs. Peters’s bag, Mrs. Hale snatches it into her coat pocket.'),
          no('report', 'Tell the county attorney straight away', 'She does the opposite.'),
        ],
      },
      {
        name: 'Mrs. Peters',
        objective: [
          yes('torn', 'Do right, and find out what right is: the law, or Minnie', 'She insists the law has got to punish crime, then tries to hide the box herself.'),
          yes('errand', 'Do the errand she came for, and keep out of what isn’t hers', 'She says she doesn’t think they ought to touch things, and keeps at wrapping the apron and shawl for the jail.'),
          no('arrest', 'Make the arrest herself', 'That’s her husband’s work, not hers.'),
          no('gossip', 'Have something to tell the neighbors', 'She says almost nothing; she keeps it.'),
        ],
        obstacle: [
          yes('married', 'She is married to the sheriff, and the law is the law', '“A sheriff’s wife is married to the law,” the county attorney says, and she answers, “Not—just that way.”'),
          no('fear', 'She is afraid of Mrs. Hale', 'She is uneasy, not afraid of her.'),
        ],
        tactic: [
          yes('remember', 'Remember what it was to lose something and have no one', 'She remembers the boy who killed her kitten with a hatchet, and the stillness after her first baby died in Dakota.'),
          yes('law', 'Fall back on the law, and see if it holds', '“The law has got to punish crime, Mrs Hale,” she says, pulling herself back.'),
          no('accuse', 'Accuse Mrs. Hale of hiding evidence', 'In the end she helps hide it.'),
        ],
      },
    ],
  },
  {
    id: 'julie', play: 'Miss Julie', by: 'August Strindberg', year: 1888, where: 'Midsummer Eve, the kitchen', language: 'prose', size: 'long', genre: 'drama', difficulty: 3,
    summary: 'On Midsummer Eve the Count’s daughter comes down to the kitchen and draws her father’s valet, Jean, into a game of command and seduction that crosses the line between master and servant.',
    circumstances: [
      yes('midsummer', 'Midsummer Eve in the manor kitchen, the Count away and the servants dancing in the barn', 'Jean has driven the Count to the station, and the servants are dancing in the barn.'),
      no('winter', 'A dark winter morning, the Count at breakfast upstairs', 'It’s Midsummer Eve, with the Count away.'),
      no('wedding', 'Julie’s wedding night', 'Her engagement has just been broken off.'),
    ],
    relationship: [
      yes('mistress', 'The Count’s daughter and her father’s valet, both testing the line between them', 'She orders him to sit, and he answers that it wouldn’t be proper in her presence.'),
      no('equals', 'Two equals of the same class', 'Class is the whole game between them.'),
      no('siblings', 'Brother and sister', 'They’re mistress and servant.'),
    ],
    roles: [
      {
        name: 'Julie',
        objective: [
          yes('command', 'Command him, and to provoke him past the point of obeying', 'She makes a game of orders, then cuffs him when he takes her at her word.'),
          yes('step-down', 'Step down from her rank, if only for the night', 'She tells him she’s stepping down, and describes her dream of longing to fall from the top of a column.'),
          no('marry', 'Marry Jean tonight', 'Nothing so settled; it’s a game until it isn’t.'),
          no('punish', 'Have him dismissed', 'She draws him in, not out.'),
        ],
        obstacle: [
          yes('class', 'Her rank, and Jean’s knowing exactly where it ends', 'Jean tells her the people will always say she fell, never that she stepped down on purpose.'),
          no('kristin', 'Kristin has locked her out of the kitchen', 'Kristin goes off to bed; the kitchen is theirs.'),
        ],
        tactic: [
          yes('order', 'Order him to dance, to kiss her shoe', 'She has him kneel to drink her health and kiss her shoe.'),
          yes('tease', 'Tease him about his manners and his French', 'She mocks his French and asks whether he learned his way with words at the theater.'),
          no('beg', 'Beg him to leave her alone', 'She is the one pursuing.'),
        ],
      },
      {
        name: 'Jean',
        objective: [
          yes('rise', 'Rise above his station, through her if he must', 'He dreams of climbing a tall tree to rob the nest where the golden eggs lie.'),
          yes('keep-place', 'Keep his place, and his name with the other servants', 'He breaks off the game in case anyone sees them, and says he’s tired of playing and has the Count’s boots to do.'),
          no('serve', 'Only to serve her as he would any evening', 'He has ambitions, and says so.'),
          no('leave', 'Get away from the house tonight', 'He stays, and stays in the game.'),
        ],
        obstacle: [
          yes('rank', 'Her rank, and what the Count would do if he knew', 'He stops the game in case anyone sees them, and keeps going back to the Count’s boots.'),
          no('debt', 'He owes Julie money', 'Nothing says he does.'),
        ],
        tactic: [
          yes('flatter', 'Flatter her and let her think she leads', 'He tells her he loved her as a boy, a story he later admits he took from a newspaper.'),
          yes('warn', 'Warn her she’s playing with fire', 'He asks if she doesn’t know it’s dangerous to play with fire.'),
          no('quit', 'Resign his post on the spot', 'He holds the post and the advantage.'),
        ],
      },
    ],
  },
  {
    id: 'cherry-orchard-4', play: 'The Cherry Orchard', by: 'Anton Chekhov', year: 1904, where: 'Act Four, the emptied house', language: 'prose', size: 'short', genre: 'drama', difficulty: 1,
    summary: 'On the day the family leaves the estate Lopakhin has bought, everyone arranges for him to be alone with Varya so he can propose at last. They talk about something she has lost and the weather, and he’s called away.',
    circumstances: [
      yes('departure', 'An October morning, the house emptied and the carriages waiting; the orchard is already being cut down', 'It’s October with three degrees of frost, the luggage is piled up, and the axes are already at the trees.'),
      no('ball', 'The night of the ball, while the auction is on in town', 'That’s the third act; this is the day they leave.'),
      no('spring', 'A May dawn as the family arrives', 'That’s the first act.'),
    ],
    relationship: [
      yes('expected', 'Two people everyone expects to marry, who have never said a word of it to each other', 'Lyubov tells Lopakhin she always hoped to marry Varya to him and can’t understand why they keep apart.'),
      no('engaged', 'An engaged couple settling the date', 'He has never proposed; this is the chance, and it passes.'),
      no('enemies', 'Enemies since the sale', 'Nothing between them is hostile; it’s unsaid.'),
    ],
    roles: [
      {
        name: 'Varya',
        objective: [
          yes('hear-it', 'Hear him ask, without asking him to', 'She comes in when she’s called and stays, and weeps into a bundle of clothes the moment he’s gone.'),
          yes('composure', 'Keep her dignity, and let none of it show', 'She weeps only once he has gone, and is “not crying now” when her mother comes in.'),
          no('refuse', 'Refuse him before he can ask', 'She waits for him to ask, and weeps when he doesn’t.'),
          no('estate', 'Get the estate back from him', 'The sale is done; she’s packing.'),
        ],
        obstacle: [
          yes('silence', 'Neither of them can say it, and there’s no time left', 'They talk of the Ragulins, Kharkov and the frost, with pauses between, until a voice calls him away.'),
          no('mother', 'Her mother has forbidden the match', 'Lyubov wants it, and arranged this moment.'),
        ],
        tactic: [
          yes('busy', 'Look for something in the luggage, to have something to do', 'She keeps searching the luggage for something she packed herself and can’t remember.'),
          yes('wait', 'Wait, and give him every chance', 'She answers each remark in a line and stays, leaving the next word to him.'),
          no('propose', 'Propose to him herself', 'She doesn’t; that’s the scene.'),
        ],
      },
      {
        name: 'Lopakhin',
        objective: [
          yes('ask', 'Ask her, at last, as he promised', '“Let’s get it over, once and for all,” he tells Lyubov, and waits for Varya alone.'),
          yes('escape', 'Get through the minute and away to his train without saying it', 'Called from the door, he goes “as if he has long been waiting to be called.”'),
          no('avoid-all', 'Get out of the house without a word to anyone', 'He agreed to ask her, and comes in to do it.'),
          no('gloat', 'Gloat over buying the estate', 'He did that the night before; now he can barely speak.'),
        ],
        obstacle: [
          yes('himself', 'Himself: he can’t find the words, and someone calls him away', 'He tells Lyubov he doesn’t understand it himself, and alone with Varya he gets no further than the weather.'),
          no('varya-no', 'She has told him no before', 'He has never asked her.'),
        ],
        tactic: [
          yes('small-talk', 'Talk about the weather and the journey, to get there sideways', 'He tells her that last year the snow was already falling, and now it’s sunny with three degrees of frost.'),
          yes('business', 'Take refuge in business and plans', 'He tells her he’s off to Kharkov by this train with a lot of business, and has taken on Epikhodov.'),
          no('declare', 'Declare his love at length', 'He never gets to it.'),
        ],
      },
    ],
  },
  {
    id: 'pygmalion-4', play: 'Pygmalion', by: 'Bernard Shaw', year: 1913, where: 'Act Four, the Wimpole Street laboratory', language: 'prose', size: 'medium', genre: 'comedy', difficulty: 2,
    summary: 'After the triumph at the ambassador’s party, Higgins and Pickering congratulate themselves and go up to bed without a word to Eliza. Left with Higgins, she throws his slippers at him and asks what is to become of her.',
    circumstances: [
      yes('after-party', 'Midnight, back from the party where she passed as a duchess; the bet is won', 'The clock strikes twelve as they come in, and Higgins says that but for his bet he’d have chucked it two months ago.'),
      no('market', 'Covent Garden in the rain, where they first met', 'That’s the first act.'),
      no('lesson', 'The first morning of lessons', 'The lessons are over; the test was tonight.'),
    ],
    relationship: [
      yes('maker', 'Teacher and pupil who have lived together for months, he treating her as his experiment', 'She asks whether her clothes are kept for the next girl he picks up to experiment on.'),
      no('engaged', 'An engaged couple', 'Nothing of the kind has been said, and she won’t marry him.'),
      no('father', 'Father and daughter', 'Her father is Doolittle, the dustman.'),
    ],
    roles: [
      {
        name: 'Eliza',
        objective: [
          yes('acknowledged', 'Be acknowledged, and to know what is to become of her now', '“What’s to become of me?” she asks him, again and again.'),
          yes('own-back', 'Hurt him as he has hurt her', 'When he says she has wounded him to the heart, she’s glad: she has got a little of her own back.'),
          no('thank', 'Thank him for everything', 'She throws his slippers at him.'),
          no('money', 'Be paid for her work', 'She’s asking what she is now, not for wages.'),
        ],
        obstacle: [
          yes('indifference', 'His indifference: to him the experiment is over', '“What does it matter what becomes of you?” he answers.'),
          no('pickering', 'Pickering has turned against her', 'Pickering is kind to her; he just goes to bed.'),
        ],
        tactic: [
          yes('slippers', 'Throw the slippers, and make him see her', 'She hurls the slippers at him one after the other, with all her force.'),
          yes('return-jewels', 'Give back the jewels, so he has to ask why', 'She hands over the jewels and the Brighton ring, nagging him “to provoke a further supply” of feeling.'),
          no('flatter', 'Flatter him for the triumph', 'She is furious with him.'),
        ],
      },
      {
        name: 'Higgins',
        objective: [
          yes('peace', 'Have his peace, and find his slippers', 'He came down for his slippers, and says he can go to bed at last without dreading tomorrow.'),
          no('propose', 'Ask her to marry him', 'He suggests she might marry some other man, not him.'),
          no('apologize', 'Apologize', 'He doesn’t, and loses his temper instead.'),
        ],
        obstacle: [
          yes('her-rage', 'Her rage, which he doesn’t understand and won’t admit he caused', 'He tells her the irritation is purely subjective, low spirits and imagination.'),
          no('mother', 'His mother is in the room', 'They’re alone.'),
        ],
        tactic: [
          yes('reason', 'Reason with her coolly, as if she’s tired and overexcited', 'He tells her to go to bed like a good girl and sleep it off, and reminds her of the florist’s shop.'),
          yes('lose-temper', 'Lose his temper when she gets to him', 'He flings the ring into the fireplace and says she’s made him lose his temper.'),
          no('comfort', 'Comfort her tenderly', 'Not his way, and not tonight.'),
        ],
      },
    ],
  },
  {
    id: 'playboy-3', play: 'The Playboy of the Western World', by: 'J. M. Synge', year: 1907, where: 'Act Three, the shebeen', language: 'prose', size: 'medium', genre: 'comedy', difficulty: 2,
    summary: 'After Christy wins every race on the strand, he and Pegeen are left alone in the shebeen and court in Synge’s high Mayo talk, planning to marry, before Christy’s father, whom he claimed to have killed, comes back.',
    circumstances: [
      yes('after-races', 'Evening in Flaherty’s shebeen after the races, the two alone for a moment', 'Pegeen hustles the crowd out to the tug-of-war, leaving her alone with Christy after he’s won every prize.'),
      no('first-night', 'The night Christy first arrives', 'That’s the first act; by now he’s the hero of the place.'),
      no('wake', 'The wake for Christy’s father', 'His father isn’t dead, and comes back.'),
    ],
    relationship: [
      yes('courting', 'A young man and woman courting in earnest, each a little dazzled by the other', 'She says no girl would meet his like for eloquence, and he calls her an angel’s lamp.'),
      no('married', 'Husband and wife', 'They’re only now planning to marry.'),
      no('cousins', 'Cousins', 'He is a stranger to the place.'),
    ],
    roles: [
      {
        name: 'Pegeen',
        objective: [
          yes('have-him', 'Have him, and a life bigger than the shebeen', 'She says she has her gowns bought ready, so she can wed him and not wait at all.'),
          yes('sure', 'Make sure he means it, and won’t leave her for a girl at home', 'She backs away from his proposal, saying all know he’ll be starting to some girl in his own townland.'),
          no('send', 'Send him on his way', 'She wants him to stay and marry her.'),
          no('shawn', 'Keep Shawn Keogh as her match', 'She wants Christy, not Shawn.'),
        ],
        obstacle: [
          yes('father-match', 'Her father has promised her to Shawn Keogh', 'Her father comes in from the wake with Shawn, and the dispensation for that match has come.'),
          no('church', 'The priest has forbidden it', 'The priest is a threat offstage, not what stops her here.'),
        ],
        tactic: [
          yes('tease', 'Tease him, and make him say it better', '“And it’s that kind of a poacher’s love you’d make?” she asks him, playfully.'),
          yes('plan', 'Plan the marriage out loud', 'They’ll tell her father once he’s slept, she says, “for he’s peaceful then.”'),
          no('cold', 'Be cold, to cool him off', 'She warms to him in this scene.'),
        ],
      },
      {
        name: 'Christy',
        objective: [
          yes('win', 'Win her for good, with the best talk in Mayo', 'He asks for her promise to wed him in a fortnight as the crowning prize of the day.'),
          no('flee', 'Get out before his father finds him', 'He thinks his father is dead and buried.'),
          no('confess', 'Confess he didn’t kill his father', 'He believes he did.'),
        ],
        obstacle: [
          yes('doubt', 'His own doubt that a girl like Pegeen would have him', 'When he asks, she backs away, sure he’ll be off to some girl in his own townland, and he has to talk her round.'),
          no('widow', 'The Widow Quin is watching', 'They’re alone for this.'),
        ],
        tactic: [
          yes('poetry', 'Woo her with the talk he’s found in himself', 'He talks of pacing Neifin in the dews of night and the light of seven heavens in her heart.'),
          yes('boast', 'Boast of the day he’s had', 'Taking his prizes, he tells the crowd it was little beside the day he struck his one single blow.'),
          no('threaten', 'Threaten Shawn', 'Shawn isn’t here; the scene is courtship.'),
        ],
      },
    ],
  },
  {
    id: 'machinal-2', play: 'Machinal', by: 'Sophie Treadwell', year: 1928, where: 'Episode Two, At Home', language: 'prose', size: 'short', genre: 'drama', difficulty: 2,
    summary: 'At home in the evening, the Young Woman tells her mother that her employer, Mr. Jones, wants to marry her; she doesn’t love him and is afraid. Her mother asks about his money and wants the match.',
    circumstances: [
      yes('home', 'Evening at home in a cramped city flat after work, the garbage to go out', 'Her mother keeps at the potatoes on her plate and tells her she isn’t too good to take out the garbage.'),
      no('office', 'The office, in front of the other clerks', 'That’s the first episode; this is at home.'),
      no('wedding', 'The wedding night', 'She hasn’t said yes yet.'),
    ],
    relationship: [
      yes('mother', 'A daughter and the mother she lives with and supports', '“Does he know you’ve got a mother to support?” is her mother’s first question about him.'),
      no('sisters', 'Two sisters', 'It’s her mother.'),
      no('landlady', 'Lodger and landlady', 'It’s her mother.'),
    ],
    roles: [
      {
        name: 'Young Woman',
        objective: [
          yes('understood', 'Be understood: that she wants love, not only security', 'She tries to tell her mother that when he puts his fat hands on her, her blood turns cold.'),
          yes('love-real', 'Find out whether love is real, and whether her mother ever felt it', '“But Ma—didn’t you love Pa?” she asks, and her mother has forgotten.'),
          no('accept', 'Be told to accept him and get it over with', 'She wants the opposite: for someone to understand why she can’t.'),
          no('leave', 'Move out tonight', 'Nothing in the scene plans it.'),
        ],
        obstacle: [
          yes('mother-sense', 'Her mother’s hard practical sense, and their poverty', 'Asked about love, her mother asks whether it will clothe her, feed her or pay the bills.'),
          no('jones-here', 'Mr. Jones is in the room', 'He isn’t; they talk about him.'),
        ],
        tactic: [
          yes('plead', 'Plead with her to understand', '“Don’t you see?” she keeps asking about his hands.'),
          yes('lash-out', 'Lash out, when she isn’t heard', 'Called crazy once too often, she cries that she’ll kill her.'),
          no('reason-calm', 'Lay out a calm plan', 'She is too frightened to be calm.'),
        ],
      },
      {
        name: 'Mother',
        objective: [
          yes('secure', 'See her daughter married and secure', 'She lights up at “Vice-President!” and says love won’t pay the bills.'),
          no('refuse-jones', 'Talk her out of marrying Jones', 'She wants the match.'),
          no('alone', 'Be left in peace', 'She keeps at it.'),
        ],
        obstacle: [
          yes('daughter-fear', 'Her daughter’s fear, which she can’t make sense of', 'All she can make of her daughter’s fear is that she’s crazy.'),
          no('money', 'Jones has no money', 'He is well off; that’s her point.'),
        ],
        tactic: [
          yes('practical', 'Be practical: what does he earn?', 'Her first questions are whether her daughter is in trouble and whether he knows about the mother to support.'),
          yes('chores', 'Keep on with the chores, so it isn’t a scene', 'She keeps on about the potatoes and the garbage while her daughter tries to talk.'),
          no('tender', 'Hold her and let her cry', 'Not this mother; that’s the scene’s cruelty.'),
        ],
      },
    ],
  },
  {
    id: 'muchado-4-1', play: 'Much Ado About Nothing', by: 'William Shakespeare', year: 1599, where: 'Act Four, Scene One, the church', language: 'verse', size: 'medium', genre: 'comedy', difficulty: 2,
    summary: 'Hero has been shamed at the altar and left for dead. Alone in the church, Beatrice and Benedick confess their love, and Beatrice asks him to kill Claudio.',
    circumstances: [
      yes('church', 'The church, minutes after the wedding broke apart and the others left', 'Benedick finds her still weeping after the others have gone, and she says she’ll weep a while longer.'),
      no('masque', 'The masked ball in the first act', 'That’s earlier; this is after the failed wedding.'),
      no('garden', 'Leonato’s orchard, overheard', 'The overhearing scenes are in the garden; this is in the church.'),
    ],
    relationship: [
      yes('sparring', 'Old sparring partners, each tricked into love, now saying it outright', 'He tells her he loves nothing in the world so well as her, and asks if that isn’t strange; she answers in kind.'),
      no('married', 'A married couple', 'They aren’t married yet.'),
      no('enemies', 'Sworn enemies', 'They have sworn not to marry, not to hate each other.'),
    ],
    roles: [
      {
        name: 'Beatrice',
        objective: [
          yes('avenge', 'Have Hero avenged, and to know if his love will act', 'Told to bid him do anything for her, she answers, “Kill Claudio.”'),
          no('marry-now', 'Marry Benedick before the day is out', 'She asks for Claudio’s death, not a wedding.'),
          no('mock', 'Win the battle of wits', 'Her wit gives way to grief and fury here.'),
        ],
        obstacle: [
          yes('man', 'She is a woman and can’t challenge Claudio herself; and Claudio is Benedick’s friend', '“O that I were a man!” she cries, wishing she had any friend who would be a man for her sake.'),
          no('law', 'The law forbids duels', 'The law doesn’t come into it.'),
        ],
        tactic: [
          yes('demand', 'Demand it in two words, and refuse anything less', '“Kill Claudio” is all she asks, and she won’t be friends without it.'),
          yes('scorn', 'Scorn the men who talk and don’t act', 'She tells him manhood is melted into courtesies, and men are only turned into tongue.'),
          yes('go', 'Make to leave, and let him hold her back', '“You kill me to deny it. Farewell,” she says, and he has to beg her to tarry.'),
          no('flatter', 'Flatter him into it', 'She shames him into it.'),
        ],
      },
      {
        name: 'Benedick',
        objective: [
          yes('win', 'Comfort her and win her, whatever it costs', 'He swears he loves her and asks her to bid him do anything for her.'),
          no('flee', 'Get out of the church before he’s asked anything', 'He stays and declares himself.'),
          no('defend', 'Defend Claudio’s honor', 'He comes to doubt Claudio and agrees to challenge him.'),
        ],
        obstacle: [
          yes('friend', 'Claudio is his friend, and she asks for his life', 'When she says “Kill Claudio,” his first answer is “Ha! not for the wide world.”'),
          no('prince', 'The Prince has ordered him away', 'No order comes in this scene.'),
        ],
        tactic: [
          yes('swear', 'Swear by his sword that he loves her', '“By my sword, Beatrice, thou lovest me.”'),
          yes('test', 'Ask if she truly believes Claudio wronged Hero', '“Think you in your soul the Count Claudio hath wronged Hero?” he asks, and only then agrees.'),
          no('joke', 'Answer with a joke, as always', 'He tries a jest and finds it doesn’t serve.'),
        ],
      },
    ],
  },
  {
    id: 'romeo-2-2', play: 'Romeo and Juliet', by: 'William Shakespeare', year: 1597, where: 'Act Two, Scene Two, the orchard', language: 'verse', size: 'long', genre: 'tragedy', difficulty: 2,
    summary: 'After the Capulets’ feast, Romeo climbs into the orchard and hears Juliet at her window speak of her love; they exchange vows and agree to marry.',
    circumstances: [
      yes('night', 'The night of the feast, in the Capulet orchard, Juliet at her window and the Nurse calling', 'Romeo has climbed the high orchard walls, and the Nurse keeps calling Juliet from within.'),
      no('day', 'Midday in the square of Verona', 'It’s night, in the orchard below her window.'),
      no('tomb', 'The Capulet tomb', 'That’s the last act.'),
    ],
    relationship: [
      yes('new', 'Lovers who met hours ago, from families at war', 'She has heard fewer than a hundred words from him, and the orchard is death to a Montague.'),
      no('betrothed', 'A long-betrothed couple', 'They met that evening at the feast.'),
      no('cousins', 'Cousins', 'He is a Montague, she a Capulet.'),
    ],
    roles: [
      {
        name: 'Juliet',
        objective: [
          yes('sure', 'Be sure of him: that he loves her truly and means marriage', '“Dost thou love me?” she asks, then tells him to send word tomorrow if his purpose is marriage.'),
          yes('keep-him', 'Keep him there as long as she can', 'She calls him back after good night, then says she has forgotten why, “Remembering how I love thy company.”'),
          no('send', 'Send him away for good', 'She comes back to the window twice after saying good night, and calls him back.'),
          no('test-wit', 'Best him in wordplay', 'She asks him to stop swearing and speak plainly.'),
        ],
        obstacle: [
          yes('name', 'His name, her family, and the danger if he’s found', 'She tells the night it’s only his name that’s her enemy, and tells him her kinsmen will murder him if they see him.'),
          no('nurse-out', 'The Nurse has locked the window', 'The Nurse calls her in; nothing is locked.'),
        ],
        tactic: [
          yes('plain', 'Ask him to speak plainly and not swear by the moon', '“O, swear not by the moon, the inconstant moon.”'),
          yes('plan', 'Make a plan: a messenger tomorrow, and a time', 'She’ll send someone at nine tomorrow to learn where and when he’ll perform the rite.'),
          no('coy', 'Play hard to get', 'She says she should have been more strange, and isn’t.'),
        ],
      },
      {
        name: 'Romeo',
        objective: [
          yes('win', 'Win her love and her promise', 'He asks for “the exchange of thy love’s faithful vow for mine.”'),
          no('escape', 'Escape the orchard unseen', 'He risks being found to stay.'),
          no('rosaline', 'Talk about Rosaline', 'Rosaline is forgotten.'),
        ],
        obstacle: [
          yes('feud', 'The feud: if her kinsmen find him they’ll kill him', 'Juliet tells him the place is death if any of her kinsmen find him there.'),
          no('rival', 'Paris is with her', 'She is alone at her window.'),
        ],
        tactic: [
          yes('praise', 'Praise her, and swear', 'He swears by the blessed moon that tips the fruit-tree tops with silver.'),
          yes('dare', 'Make light of the danger for her sake', '“There lies more peril in thine eye Than twenty of their swords.”'),
          no('threaten', 'Threaten her family', 'He would give up his name for her.'),
        ],
      },
    ],
  },
  {
    id: 'macbeth-1-7', play: 'Macbeth', by: 'William Shakespeare', year: 1606, where: 'Act One, Scene Seven, outside the feast', language: 'verse', size: 'medium', genre: 'tragedy', difficulty: 3,
    summary: 'With Duncan at supper under his roof, Macbeth decides to go no further with the murder. Lady Macbeth finds him and turns him back.',
    circumstances: [
      yes('feast', 'Night at Inverness, Duncan at supper in the hall, Macbeth having left the table', 'Servants carry dishes past, and she asks why he has left the chamber when Duncan has almost supped.'),
      no('battle', 'The battlefield after the victory', 'That’s the first scenes; this is the night of Duncan’s visit.'),
      no('after', 'The morning after the murder', 'Duncan is still alive at supper.'),
    ],
    relationship: [
      yes('partners', 'A husband and wife who have been partners in everything, now divided', 'He broke the enterprise to her first, she reminds him, and she lays out the plan as theirs.'),
      no('strangers', 'Near strangers', 'His letter calls her his dearest partner of greatness.'),
      no('master', 'Master and servant', 'They’re husband and wife.'),
    ],
    roles: [
      {
        name: 'Lady Macbeth',
        objective: [
          yes('steel', 'Steel him to do it tonight', '“Screw your courage to the sticking-place, And we’ll not fail.”'),
          yes('oath', 'Hold him to what he swore', 'She says she would have dashed out her own baby’s brains had she so sworn as he has done to this.'),
          no('stop', 'Talk him out of it', 'She talks him back into it.'),
          no('confess', 'Confess the plot to Duncan', 'The opposite.'),
        ],
        obstacle: [
          yes('conscience', 'His conscience, and his fear of failing', 'He tells her they’ll proceed no further in this business, then asks what if they fail.'),
          no('guards', 'The guards are awake', 'She plans to drug them; they aren’t the problem here.'),
        ],
        tactic: [
          yes('shame', 'Shame his courage and his love', '“Art thou afeard?” she asks, and says he’ll live a coward in his own esteem.'),
          yes('plan', 'Show him the plan is sure', 'She lays it out: the chamberlains drunk asleep, Duncan unguarded, and the guilt put on his officers.'),
          no('plead', 'Plead tearfully', 'She shames and commands; she doesn’t plead.'),
        ],
      },
      {
        name: 'Macbeth',
        objective: [
          yes('stop', 'Stop it here, and keep the honors he has', 'He tells her Duncan has honored him of late, and he has bought golden opinions he’d wear while they’re new.'),
          no('hurry', 'Get it done quickly', 'He has decided to proceed no further.'),
          no('flee', 'Flee the castle', 'He stays, and is turned.'),
        ],
        obstacle: [
          yes('her', 'Her will, and her contempt for a man who won’t act', 'She asks whether the hope he dressed himself in was drunk, and counts his love by it.'),
          no('witches', 'The witches have warned him off', 'They have done the opposite.'),
        ],
        tactic: [
          yes('reason', 'Reason: he’s his kinsman, his king and his guest', 'Alone, he weighs the double trust of kinsman, subject and host; to her, he speaks of the honors he has won.'),
          yes('fear', 'Ask what happens if they fail', '“If we should fail?”'),
          no('laugh', 'Laugh it off', 'He means every word.'),
        ],
      },
    ],
  },
  ...CLASSICAL_SCENES,
  ...MODERN_SCENES,
  ...GREEK_SCENES,
  ...ORIGINAL_SCENES,
  // The public and confrontational drama of 2026-10-16 (`content/scenes-public.ts`), last. A scene is drawn from the
  // first four unstudied ones nearest the difficulty that suits (`setWork`, `systems/coursework.ts`), and `scenesFor`
  // sorts stably, so these come into a draw only once fewer than four of the scenes before them fit it as well.
  ...PUBLIC_SCENES,
  // Scenes played out to a house (from 2026-10-16, brief 09; `content/scenes-house.ts`), last, for the same reason: a
  // seeded life meets them only once fewer than four of the scenes before them fit its draw as well.
  ...HOUSE_SCENES,
  // A scene of many units (from 2026-10-16, brief 09's follow-up; `content/scenes-scored.ts`), last, for the same reason.
  ...SCORED_SCENES,
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
  /** A scene with a partner in modern prose, in classical text, from the Greek tragedies (The Greeks, by the Bulletin), or none. */
  material: 'scene' | 'verse-scene' | 'greek-scene' | 'none';
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
  /**
   * Work shown in rounds, each at its own meeting, each reading only its parts
   * of the preparation, and the note of one round to be taken in the next
   * (spring Acting I's simulated rehearsals, from 2026-10-08). `gap` is how
   * many of the course's meetings after the round before it.
   */
  rounds?: readonly { label: string; dims: readonly PrepDim[]; gap: number }[];
}

const read: Activity = { id: 'read', label: 'Read The Scene', minutes: 40, dim: 'familiarity', gain: 0.55 };
const learn: Activity = { id: 'learn', label: 'Learn Lines', minutes: 60, dim: 'memorization', gain: 0.32, requires: { dim: 'familiarity', at: 0.3, why: 'Read it first: lines are learned from a scene you know.' }, trains: 'memorization' };
// Rehearse Alone is the scene's time on its feet, as its notes say, so it needs your feet (from 2026-10-12): until then it
// named no need, so it could be done spent, injured or from a hospital bed, and it counted as desk work (`WORK.met`).
const alone: Activity = { id: 'rehearse', label: 'Rehearse Alone', minutes: 60, dim: 'rehearsal', gain: 0.28, needs: ['feet'], requires: { dim: 'memorization', at: 0.25, why: 'Learn some of the lines first.' } };
const withPartner: Activity = { id: 'partner', label: 'Rehearse With Your Partner', minutes: 90, dim: 'partner', gain: 0.4, needs: ['partner'] };
const revise: Activity = { id: 'revise', label: 'Work On The Note', minutes: 60, dim: 'revision', gain: 0.45 };

/**
 * The Actor Showcase's scene (DRAM 793b): the Bulletin's "students choose and
 * rehearse scenes, which are presented to agents, managers, casting directors,
 * and other members of the industry in New York and Los Angeles". Shown in
 * class and again with the note taken. How it last went was read at the
 * showcase (`showcaseSceneSeen` in `systems/career.ts`) until the showcase and
 * the career went on 2026-10-09; this said until 2026-10-10 that it still was. The scenes are SLATE's
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
    // Spring Acting I: the Bulletin's "the second term includes a sequence of simulated rehearsals in order to put those
    // principles and craft into practice". One scene taken through a rehearsal's stages in class, each shown and noted:
    // at the table, then off book and on its feet, then run. How many rounds and what each asks is SLATE's reading.
    // Until 2026-10-08 the spring term set the fall's scene study again.
    id: 'simulated-rehearsal', courses: ['DRAM 103a/b'], only: { 'DRAM 103a/b': 'spring' }, title: 'A Simulated Rehearsal', deliverable: 'A scene taken through a rehearsal in class: at the table, on its feet off book, and run',
    material: 'scene', paired: true,
    dims: {
      familiarity: { label: 'Knows The Scene', weight: 0.15 }, memorization: { label: 'Lines', weight: 0.2 }, interpretation: { label: 'Table Work', weight: 0.2 },
      rehearsal: { label: 'On Its Feet', weight: 0.2 }, partner: { label: 'With Your Partner', weight: 0.25 },
    },
    activities: [read, learn, alone, withPartner],
    reads: { scene: 2, character: 1, emotion: 1 }, dueAfter: 2, revised: false, par: 52,
    rounds: [
      { label: 'At The Table', dims: ['familiarity', 'interpretation'], gap: 0 },
      { label: 'Off Book, On Its Feet', dims: ['memorization', 'rehearsal', 'partner'], gap: 2 },
      { label: 'The Run', dims: ['familiarity', 'memorization', 'interpretation', 'rehearsal', 'partner'], gap: 2 },
    ],
    notes: {
      familiarity: 'At the table the scene wasn’t known well enough yet to question it.',
      interpretation: 'The table work stayed general: what each of you wants, and what’s in the way, needs deciding before it goes on its feet.',
      memorization: 'Off book was the call, and the lines weren’t there; the room waited on them.',
      rehearsal: 'On its feet it hadn’t found a shape yet: the moves were still being invented in front of us.',
      partner: 'The two of you were still finding each other in it.',
    },
  },
  {
    // The Greeks (DRAM 293b): the Bulletin's "second-year scene study continuing to develop embodiment of heightened
    // circumstances and poetic text, centered on scenes from classical Greek texts in translation and/or modern poetic
    // adaptations; students prepare and rehearse scenes for presentation and exploration in class". The scenes are from
    // public-domain translations (Jebb's Sophocles, Murray's Euripides and Aeschylus; research-yale-school-2.json).
    id: 'greek-scene', courses: ['DRAM 293b'], title: 'A Scene From The Greeks', deliverable: 'A scene from a Greek tragedy in translation, prepared, rehearsed and presented in class, then shown again with the note taken',
    material: 'greek-scene', paired: true,
    dims: {
      familiarity: { label: 'Knows The Play', weight: 0.1 }, memorization: { label: 'Lines', weight: 0.2 }, interpretation: { label: 'The Stakes And The Text', weight: 0.25 },
      rehearsal: { label: 'Rehearsal', weight: 0.2 }, partner: { label: 'With Your Partner', weight: 0.25 },
    },
    activities: [
      { id: 'read', label: 'Read The Play', minutes: 90, dim: 'familiarity', gain: 0.5 },
      learn,
      { id: 'voice-text', label: 'Speak The Text Aloud', minutes: 50, dim: 'interpretation', gain: 0.35, requires: { dim: 'familiarity', at: 0.3, why: 'Read the play first.' }, trains: 'classical' },
      alone, withPartner, revise,
    ],
    reads: { classical: 2, voice: 1, emotion: 1 }, dueAfter: 4, revised: true, par: 58,
    notes: {
      familiarity: 'The play around the scene wasn’t known: what has happened before it, and what the gods and the city want, is what it stands on.',
      memorization: 'The text was still being paraphrased, and translated verse falls apart that way.',
      interpretation: 'The stakes were played small: in these plays a choice is life or death, and the language has to carry that size.',
      rehearsal: 'It needed more time on its feet, finding how much stillness the text can hold.',
      partner: 'The two of you weren’t yet in the same argument.',
    },
  },
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
      { id: 'devise', label: 'Devise The Score', minutes: 60, dim: 'interpretation', gain: 0.4, needs: ['studio', 'feet'] },
      { id: 'rehearse-score', label: 'Rehearse The Score', minutes: 45, dim: 'rehearsal', gain: 0.3, needs: ['studio', 'feet'], requires: { dim: 'interpretation', at: 0.3, why: 'Make the score first.' }, trains: 'movement' },
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
      { id: 'learn-fight', label: 'Learn The Choreography', minutes: 40, dim: 'familiarity', gain: 0.45, needs: ['feet'] },
      { id: 'shadow', label: 'Run It Alone, At Half Speed', minutes: 30, dim: 'rehearsal', gain: 0.35, needs: ['feet'], requires: { dim: 'familiarity', at: 0.3, why: 'Learn the choreography first.' }, trains: 'combat' },
      { ...withPartner, label: 'Drill It With Your Partner', minutes: 60, needs: ['partner', 'studio', 'feet'], requires: { dim: 'familiarity', at: 0.4, why: 'Learn the choreography before drilling it together: a sequence isn’t found with a partner at speed.' } },
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
    activities: [read, learn, { id: 'record', label: 'Record A Take', minutes: 45, dim: 'rehearsal', gain: 0.35, requires: { dim: 'memorization', at: 0.4, why: 'Learn the lines before taping: a camera sees eyes on the page.' }, trains: 'screen' }],
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
