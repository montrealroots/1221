/**
 * SLATE — two public meetings, for scene study (from 2026-10-16, brief 10), from plays in the public domain, each in the
 * edition named.
 *
 * Why these were added. Presence reads most where there's little partner to play off and a house to reach
 * (`DEMAND_EFFECT.solo`, `content/approaches.ts`). Measured on brief 10's criterion H4-R before any change
 * (docs/verification/decisions-2026-10-16/baseline/), presence was the largest input of three pieces in all, the
 * Oedipus scene of `scenes-house.ts`, Major Barbara's night and the clown turn, where the criterion asks five, so that no
 * near tie decides an ability's role. The owner's brief 10 (section 1, H4) asks for justified in-scope material where
 * opportunities are missing. These are two more scenes of the kind `scenes-house.ts` added in brief 09: a speech to many
 * answered by a second part that speaks to the same many and hardly to the first. Both are prose, where those four are
 * verse but the Forum's Brutus. Their profiles (`content/material.ts`) were read from the same texts and committed before
 * any measurement of how they come out. No existing scene was changed.
 *
 * Both were considered on 2026-10-16, in the integration pass, and left out, each said to have no second part to cast
 * (`content/scenes-public.ts`): the meeting in An Enemy of the People because a dozen voices break in, Roberts's speech
 * at the works in Strife because it's one speech to many. Brief 09's house scenes cast such a scene as two speakers to
 * the same crowd and gave the crowd's lines to the room, and each of these has its second speaker: the Mayor, who moves
 * that his brother not be heard, and the Union's man, Harness, whom Roberts answers once he has gone.
 *
 * The editions, read on Project Gutenberg on 2026-10-16:
 * - Ibsen, An Enemy of the People (1882), tr. R. Farquharson Sharp (Everyman's Library, 1911):
 *   https://www.gutenberg.org/ebooks/2446, as `enemy-2` of `scenes-public.ts` is read.
 * - Galsworthy, Strife (first performed 9 March 1909; Duckworth, 1909): https://www.gutenberg.org/ebooks/2908, as
 *   `strife-1` is.
 *
 * Where others speak (Aslaksen in the chair, Hovstad, Billing, the citizens and the drunken man; Thomas, Jago, Rous and
 * the strikers), a class scene gives their lines to the room, as the Forum's gives the Citizens'; each scene's comment
 * says where it starts and ends. The readings paraphrase the texts and quote only a phrase, as the rest of the bank does,
 * and every `why` names what in the text it rests on.
 *
 * Considered and left out: Pillars of Society's fourth act (Bernick before the procession, seven others speaking), and
 * the end of Strife's meeting, where Madge breaks in with Roberts's wife dying: a third part, which the scene here ends
 * before, as Henry V's ends before Montjoy.
 *
 * Only the types come from `coursework.ts`: it imports this file, so a value import back would be circular. The two
 * helpers are local copies of its own.
 */

import type { Scene, Option } from './coursework';

const yes = (id: string, text: string, why?: string): Option => ({ id, text, supported: true, ...(why ? { why } : {}) });
const no = (id: string, text: string, why: string): Option => ({ id, text, supported: false, why });

export const MEETING_SCENES: readonly Scene[] = [
  {
    // Sharp's Act Four, from Aslaksen's "The Mayor will address the meeting" to the crowd's "He is an enemy of the
    // people!", played between Peter Stockmann and Dr. Stockmann. Aslaksen's chairing, Hovstad's and Billing's lines, the
    // citizens' and the drunken man's are the room's; the election of the chairman before it and the ballot after it,
    // which Peter leaves the hall during, aren't set.
    id: 'enemy-4', play: 'An Enemy of the People', by: 'Henrik Ibsen, tr. R. Farquharson Sharp', year: 1882, where: 'Act Four, the public meeting in Captain Horster’s house', language: 'prose', size: 'long', genre: 'drama', difficulty: 3,
    summary: 'No hall in the town will let Dr. Stockmann speak, so Captain Horster has lent him a room, and it’s full: townspeople of every sort, some with whistles. The Mayor, his brother Peter, says he would rather not have spoken, then moves that the meeting not let the Medical Officer read or comment on his report, which would saddle the ratepayers with thousands. The motion has the room. The doctor answers that tonight he won’t speak of the Baths at all: his discovery is that the sources of the town’s moral life are poisoned, and that the most dangerous enemy of truth and freedom is the compact majority. He mocks them, names his brother as a specimen of the kind, and, shouted down, loses his self-control: he would rather ruin his native town than see it flourish on a lie. The room declares him an enemy of the people.',
    circumstances: [
      yes('meeting', 'Evening, a big old-fashioned room with a platform, nearly filled with a crowd of townspeople of all sorts; the newspaper’s man taking it down', 'The room is soon filled, the citizens have brought their whistles, and Billing sits writing for the People’s Messenger.'),
      no('hall', 'The town’s own hall, lent for the lecture', 'Neither the Householders’ Association nor the Citizens’ Club would lend him their hall, nor the Baths theirs.'),
      no('private', 'The two brothers alone', 'They speak to the meeting, through its chairman. The brothers were alone in the second act, in the doctor’s sitting room.'),
    ],
    relationship: [
      yes('brothers', 'Brothers, the Mayor and the Medical Officer of the Baths he chairs', 'Peter speaks of “the close relationship in which, as you all know, I stand to the present Medical Officer of the Baths.”'),
      no('strangers', 'Two citizens who hardly know each other', 'The doctor calls him “my brother Peter” before the room, and Peter denies their pirate ancestor.'),
      no('allies', 'Two officials of the Baths on the same side', 'Peter moves that his brother not be allowed to read his report.'),
    ],
    roles: [
      {
        name: 'Peter Stockmann',
        objective: [
          yes('silence', 'Keep the report from being read or spoken of', 'He moves that the meeting not let the Medical Officer “either to read or to comment on his proposed lecture.”'),
          yes('order', 'Keep the meeting orderly and his own name out of it', 'He begs to be excused the chair, for reasons he leaves the meeting to understand, and asks the chairman whether such expressions can be allowed to pass.'),
          no('reconcile', 'Make peace with his brother before the town', 'He protests against the personal allusions and leaves the hall while the meeting votes.'),
        ],
        obstacle: [
          yes('brother', 'A brother who won’t keep to the subject, and turns the meeting on its leading men', 'The doctor calls the authorities colossally stupid and names his brother Peter as “slow-witted and hide-bound in prejudice.”'),
          yes('blood', 'His own relation to the speaker, which every citizen knows', 'He says he would have preferred not to speak because of it.'),
          no('hostile', 'A meeting against him', 'Several voices cry “No, no! Certainly not!” to the reports being spread abroad.'),
        ],
        tactic: [
          yes('cost', 'Put it as the ratepayers’ money', 'He tells them the doctor’s proposals would cost “at least some thousands of pounds.”'),
          yes('chair', 'Work through the chairman, never to his brother', '“Mr. Chairman, can we allow such expressions to pass?”'),
          no('debate', 'Answer the doctor’s argument point by point', 'He coughs, looks at the ceiling, and calls the pirate “An absurd legend.”'),
        ],
      },
      {
        name: 'Dr. Stockmann',
        objective: [
          yes('truth', 'Make the town hear the truth he has found', '“I have a great revelation to make to you, my fellow-citizens!”'),
          yes('majority', 'Show them that the compact majority is truth’s worst enemy', '“The most dangerous enemy of truth and freedom … is the compact majority.”'),
          no('baths', 'Have his report on the Baths voted through', 'He tells them he has no intention tonight of dealing with all that filth down at the Baths.'),
        ],
        obstacle: [
          yes('room', 'A room that won’t let him speak of the Baths and shouts him down', 'Voices cry “Don’t talk about the Baths! We won’t hear you!”, and a horn is blown amid the uproar.'),
          yes('temper', 'His own temper, which his wife has warned him of', 'She tells him not to lose his temper; he says he knows how to control himself, and loses his self-control at the end.'),
          no('silent', 'He’s forbidden to speak at all', 'The chairman calls on him to address the meeting, and he speaks for most of it.'),
        ],
        tactic: [
          yes('mock', 'Mock them with homely examples', 'Barn-door hens against pheasants, street curs against poodles: the majority’s truths are like “rancid, tainted ham.”'),
          yes('name', 'Name names', 'He names his brother, Hovstad and the People’s Messenger, and the majority itself.'),
          no('flatter', 'Win the room by flattering it', 'He tells them the stupid are in an overwhelming majority all the world over.'),
        ],
      },
    ],
  },
  {
    // Act Two, Scene Two, from Harness's "Well, I've spoken to you straight" to the crowd's shout of "Roberts!", played
    // between Harness and Roberts. The strikers' lines are the room's, Thomas's, Jago's and Rous's speeches from the
    // platform among them; Madge's coming with word that Roberts's wife is dying, after it, is a third part, and isn't set.
    id: 'strife-2-2', play: 'Strife', by: 'John Galsworthy', year: 1909, where: 'Act Two, Scene Two, the meeting outside the works', language: 'prose', size: 'long', genre: 'drama', difficulty: 3,
    summary: 'The strike has lasted all winter and the men are starving. In the failing light outside the works, Harness, the Union’s man, stands on a platform of barrels and tells the crowd straight: they went too far for the moment, the Union will see them through if they cut their demands to the right pattern, and if not he won’t come down again. He fixes his eyes on Roberts, answers the hecklers, and goes. Old Thomas and Rous speak for giving in, and Rous turns his coat in front of them all. Then Roberts goes up, and holds them till they’re dead silent: he has given up more than any man there, Harness has come too late, the fight is against Capital, and they have it on its knees. He asks for a free hand to send the London men home, and the crowd shouts his name.',
    circumstances: [
      yes('works', 'Past four, the light failing, an open muddy space outside the works crowded with workmen; a platform of barrels and boards against the wall', 'The stage directions set it in a gray, failing light, with the bargemen on the towing-path looking on indifferently.'),
      no('board', 'The Board’s table in the manager’s house', 'That was the first act, Roberts before the directors; here it’s the men alone.'),
      no('alone', 'The two men in private', 'Harness never speaks to Roberts, and Roberts answers him to the crowd once he has gone.'),
    ],
    relationship: [
      yes('rivals', 'The Union’s official and the men’s own leader, each wanting the crowd', 'Harness tells them to come in “no matter who advises you against it,” fixing his eyes on Roberts; Roberts says the Union deserted them.'),
      no('allies', 'Two men on the same side', 'Harness wants the demands cut; Roberts wants a free hand to send London home with nothing.'),
      no('master', 'A master and his workman', 'The masters are the London men and the Board; Harness is the Union’s, and Roberts tells the crowd they have little to thank Mr. Harness and the Union for.'),
    ],
    roles: [
      {
        name: 'Harness',
        objective: [
          yes('terms', 'Bring the men in on terms the Union can back', '“Cut your demands to the right pattern, and we’ll see you through.”'),
          yes('away', 'Turn them away from Roberts without naming him', 'He fixes his eyes on Roberts: “no matter who advises you against it.”'),
          no('strike', 'Keep the strike going to the end', 'He tells them they’ve dug a pit for themselves, and asks whether they’ll stay in it.'),
        ],
        obstacle: [
          yes('hunger', 'Men who have starved all winter and suspect the Union', 'They ask what he has done with their subscriptions, and Evans calls him a liar.'),
          yes('roberts', 'The man standing apart against the wall, whom the crowd keeps looking at', 'Many looks are cast at Roberts, who stands alone against the wall.'),
          no('shout', 'A crowd that won’t let him speak', 'He has spoken already when the scene begins: “Well, I’ve spoken to you straight.”'),
        ],
        tactic: [
          yes('straight', 'Speak to them straight, as one who has been through it', '“All that you’ve been through, my friend, I’ve been through.”'),
          yes('choice', 'Put it to them as a choice', '“Hands together, and victory, or the starvation you’ve got now?”'),
          no('plead', 'Plead with them to listen', '“I’ve said my say. Figure it out, my lads; when you want me you know where I shall be.”'),
        ],
      },
      {
        name: 'Roberts',
        objective: [
          yes('hand', 'Have the men give him a free hand against London', '“Give me a free hand to tell them: Go you back to London.”'),
          yes('back', 'Win the crowd back from Harness, Thomas and Rous', '“Mr. Simon Harness is a clever man, but he has come too late.”'),
          no('settle', 'Settle the strike on the Union’s terms', 'Surrendering, he says, is “the work of cowards and traitors.”'),
        ],
        obstacle: [
          yes('turned', 'A crowd turned against him, a fist ready for his jaw', 'They cry “We don’t want to hear you,” and Bulgin elbows towards the platform.'),
          yes('rous', 'His own men turning their coats', 'Rous points at him: “It’s hell fire that’s on that man’s tongue.”'),
          no('easy', 'A crowd already with him', 'He goes up amid cries of “Get down!”'),
        ],
        tactic: [
          yes('silence', 'Hold them with his eyes till they’re silent', 'He probes them with his eyes till they become silent, and pauses, holding out his hand, till they’re utterly silent.'),
          yes('scorn', 'Take each speaker’s words and turn them', '“‘Nature,’ says that old man, ‘give in to Nature.’ I tell you, strike your blow in Nature’s face.”'),
          no('reason', 'Reason with them in the Union’s figures', 'He speaks of Capital, a white-faced, stony-hearted monster, and drops to almost a whisper.'),
        ],
      },
    ],
  },
];
