/**
 * SLATE — a scene of many units, for scene study (from 2026-10-16, brief 09's follow-up), from a play in the public
 * domain, in the edition named.
 *
 * Why it was added. From evaluation-10 a class scene is judged in its units, a section for each tone and each turn
 * within it, and what it demands counts those units, so a scene of more than three reads discipline's long score
 * (`DEMAND_EFFECT.beats`, `content/approaches.ts`) as a practice brief's beats do (docs/verification/
 * integration-2026-10-16/h4.md, the follow-up's section). Until then a scene was cut by its tones alone, at most four
 * parts, and discipline's own work among the class scenes was none. Scapin's sack scene was read for it earlier the same
 * day and left out (`content/scenes-house.ts`) because its five turns, in one tone, would have made two parts; under the
 * units they make six. Its profile (`content/material.ts`) was read from the same text and committed before any
 * measurement of how it comes out. No existing scene was changed.
 *
 * The edition, read on Project Gutenberg on 2026-10-16: Molière, The Impostures of Scapin (Les Fourberies de Scapin,
 * 1671), translated into English prose by Charles Heron Wall: https://www.gutenberg.org/ebooks/8776. `year` is the
 * play's, as Chekhov's and Ibsen's are in their translations.
 *
 * Two parts. Every voice Scapin puts on (a Gascon bully, a foreigner, half a dozen soldiers) is one of Scapin's own
 * lines, as the translation's footnote says: "All the parts within inverted commas are supposed to be spoken by the man
 * Scapin is personating; the rest by himself." The reading paraphrases the text and quotes only a phrase, as the rest of
 * the bank does, and every `why` names what in the text it rests on.
 *
 * Considered and left out: the galley scene (2.11), where Scapin talks Géronte out of five hundred crowns, one trick
 * played on one refrain ("What the deuce did he want to go in that galley for?"), which SLATE reads as fewer units than
 * the sack's; and the bravo scene (2.9), which has a third part on stage.
 *
 * Only the types come from `coursework.ts`: it imports this file, so a value import back would be circular. The two
 * helpers are local copies of its own.
 */

import type { Scene, Option } from './coursework';

const yes = (id: string, text: string, why?: string): Option => ({ id, text, supported: true, ...(why ? { why } : {}) });
const no = (id: string, text: string, why: string): Option => ({ id, text, supported: false, why });

export const SCORED_SCENES: readonly Scene[] = [
  {
    // Act Three, Scene Two, from Géronte's "Well! Scapin, and how have we succeeded about my son's mischance?" to his "It
    // is thus that you murder me?", played between Scapin and Géronte.
    id: 'scapin-3-2', play: 'The Impostures of Scapin', by: 'Molière, tr. Charles Heron Wall', year: 1671, where: 'Act Three, Scene Two, a street in Naples: the sack', language: 'prose', size: 'medium', genre: 'comedy', difficulty: 2,
    summary: 'Géronte has paid Scapin five hundred crowns to ransom his son from a Turkish galley, and he told his son that Scapin had betrayed him, which put Scapin on his knees under Léandre’s sword confessing his own tricks. Now Scapin has his revenge. He tells the old man that the brother of Octave’s bride and his friends, men of the sword, hold every street to his house, and that the one way home is in a sack on Scapin’s shoulders. Géronte gets in. Scapin plays a Gascon bully who beats the sack for its master’s sake, then a foreigner who beats it when Scapin won’t show what’s inside, then half a dozen soldiers at once, crying out each time as if the blows fell on him and pushing the old man’s head back in whenever it comes out to complain. As the soldiers are about to strike, Géronte looks out quietly, sees the trick, and Scapin runs.',
    circumstances: [
      yes('street', 'A street in Naples, where Scapin says the swordsmen hold every way to Géronte’s house', 'His enemies “occupy in companies all the thoroughfares leading to your house,” Scapin says, so he can’t get home by the right or the left.'),
      no('house', 'Inside Géronte’s house, behind a barricaded door', 'That’s where Scapin promises to carry him; the scene never gets there.'),
      no('real', 'A real danger from the bride’s brother', 'Every bully is Scapin in disguise: the translation’s footnote gives each line in inverted commas to the man he’s pretending to be.'),
    ],
    relationship: [
      yes('servant', 'Géronte’s son’s servant, who has already tricked him once, and the miser who still trusts him', 'Géronte calls him “my dear Scapin” and asks him to show himself a devoted servant, after the galley.'),
      no('friends', 'Friends who wish each other well', 'Aside, Scapin tells him “you shall pay me for that lie.”'),
      no('strangers', 'Strangers', 'Scapin is Léandre’s servant, and took five hundred crowns from Géronte for the galley.'),
    ],
    roles: [
      {
        name: 'Scapin',
        objective: [
          yes('revenge', 'Pay Géronte back for the lie that put him under Léandre’s sword', 'After the galley he swears to “make him pay in a different money his imposture about me to his son.”'),
          yes('sack', 'Get the old man into the sack and keep him there', '“Get in right to the bottom, and, above all things, be careful not to show yourself and not to move, whatever may happen.”'),
          no('save', 'Save Géronte from his enemies', 'There are none: Scapin invents them, and beats the sack himself.'),
        ],
        obstacle: [
          yes('looks', 'Géronte keeps looking out of the sack', 'He looks out to complain twice, and the third time sees the trick.'),
          yes('bones', 'The blows land on Géronte, and he can feel them', 'He’s sure he felt the blows, he says, and feels them still.'),
          no('silvestre', 'Silvestre’s warning stops him', 'He tells Silvestre he prefers listening to himself.'),
        ],
        tactic: [
          yes('voices', 'Play every enemy himself, each in his own voice', 'A Gascon’s “Vat! I shall not hab de pleasure to kill dis Géronte,” a foreigner’s “Frient, me run like one Dutchman,” and half a dozen soldiers at once.'),
          yes('victim', 'Take the blows on himself, out loud', 'He cries out under every blow as if it fell on him, and after it says his shoulders are “as sore as can be.”'),
          no('fight', 'Fight the bullies off', 'He defends Géronte’s honor in words and lets the stick fall on the sack.'),
        ],
      },
      {
        name: 'Géronte',
        objective: [
          yes('home', 'Get home safe', '“Could you not find out some means of saving me?”'),
          yes('cheap', 'Be saved for as little as a promise', 'He promises Scapin his coat, once it’s “a little more worn.”'),
          no('fight', 'Face the men hunting him', 'He trembles, and gets into the sack.'),
        ],
        obstacle: [
          yes('sack', 'He can’t see out of the sack', 'Inside, he hears the voices and feels the stick; only when he looks quietly out does he see Scapin’s trick.'),
          yes('fear', 'His fear', 'He thinks he sees someone, and trembles while Scapin looks for men coming.'),
          no('suspicion', 'He suspects Scapin from the start', 'He calls the sack a very good idea.'),
        ],
        tactic: [
          yes('trust', 'Put himself in his servant’s hands', '“You may trust me to keep still.”'),
          yes('complain', 'Complain of the blows', '“You should have gone a little farther back, then, to spare me.”'),
          no('pay', 'Pay Scapin well for it', 'He offers a worn coat, later.'),
        ],
      },
    ],
  },
];
