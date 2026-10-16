/**
 * SLATE — drama played in public or fought out loud, for scene study (from 2026-10-16), from plays first published or
 * performed by 1930, in English or in an English translation of that time, each named.
 *
 * Why these were added. Until 2026-10-16 every one of the catalog's 25 drama scenes and plays was a private, naturalist
 * two-hander (Ibsen, Chekhov, Strindberg, Glaspell and the original scenes), each read in what it hides, and none was a
 * meeting, a trial or an open quarrel (docs/verification/stage-2026-10-16/README.md, ST4). The owner's brief of that day
 * (docs/verification/briefs-2026-10-16/08-complete-integration-and-acceptance-pass.txt, section 3) asked for drama with
 * genuinely different circumstances, public or confrontational where the text is, without forcing equal outcomes. These
 * four were chosen for what their texts are. Their profiles (`content/material.ts`) were read from the same texts and
 * written before any measurement of how they come out. No existing scene was changed.
 *
 * The editions, read on Project Gutenberg on 2026-10-16:
 * - Ibsen, An Enemy of the People (1882), tr. R. Farquharson Sharp (Everyman's Library, 1911):
 *   https://www.gutenberg.org/ebooks/2446. The brief named Eleanor Marx-Aveling's translation of 1888 at that number;
 *   the text there is Sharp's, and it's the one these readings rest on.
 * - Galsworthy, Strife (first performed 9 March 1909; Duckworth, 1909): https://www.gutenberg.org/ebooks/2908.
 * - Galsworthy, Justice (first performed 21 February 1910; Duckworth, 1910): https://www.gutenberg.org/ebooks/2911.
 *   Galsworthy called it a tragedy, as Strindberg called Miss Julie one. SLATE files a scene by what it plays as, and
 *   Justice plays as naturalist prose drama, as Miss Julie and Riders to the Sea do.
 * - Hauptmann, The Weavers (1892), tr. Mary Morison, in The Dramatic Works of Gerhart Hauptmann, Volume I, ed. Ludwig
 *   Lewisohn (1912): https://www.gutenberg.org/ebooks/9971. Lewisohn's preface says his translators' dialect was made
 *   to conform to a common English he invented to be no region's, so the weavers' speech asks no accent.
 *
 * Each is a two-person scene in a room with others in it. Where a third voice puts in a line or two (a director, the
 * judge, the manager), a class scene cuts it or gives it to the room, as Antigone's does with the Chorus's one line
 * (`content/scenes-greek.ts`); each scene's comment says where. The readings paraphrase the translations and quote only
 * a phrase, as the rest of the bank does, and every `why` names what in the text it rests on.
 *
 * Considered and left out:
 * - An Enemy of the People's fourth act, the public meeting. Stockmann speaks to a crowd and a dozen voices break in:
 *   there are no two parts to cast.
 * - Pillars of Society's fourth act (Gutenberg #2296, also Sharp's translation; the brief named William Archer's),
 *   Bernick before the townspeople. A confession to a procession, with seven others speaking.
 * - Frome's speech to the jury in Justice, and Roberts's to the strikers at the works in Strife's second act: speeches
 *   to many, with no second part.
 *
 * Only the types come from `coursework.ts`: it imports this file, so a value import back would be circular. The two
 * helpers are local copies of its own.
 */

import type { Scene, Option } from './coursework';

const yes = (id: string, text: string, why?: string): Option => ({ id, text, supported: true, ...(why ? { why } : {}) });
const no = (id: string, text: string, why: string): Option => ({ id, text, supported: false, why });

export const PUBLIC_SCENES: readonly Scene[] = [
  {
    // Sharp's Act Two, from Peter Stockmann's "Good morning" to Petra throwing the door open. Mrs. Stockmann takes Petra
    // out as he comes in, so the brothers are alone until the end; the rest of the act, with the family in, isn't set.
    id: 'enemy-2', play: 'An Enemy of the People', by: 'Henrik Ibsen, tr. R. Farquharson Sharp', year: 1882, where: 'Act Two, the brothers alone in the doctor’s sitting room', language: 'prose', size: 'long', genre: 'drama', difficulty: 3,
    summary: 'Dr. Stockmann has found that the water of the town’s Baths is poisoned by the filth from Molledal, and sent his report to his elder brother Peter, the Mayor and chairman of the Baths Committee. Peter comes to the house to answer it. He counts the cost, asks him to withhold the report, and then, as his chief, orders him to refute it in public and forbids him any opinion on the Baths. The doctor shouts, stops himself, and his daughter throws open the door.',
    circumstances: [
      yes('report', 'Late morning in the doctor’s sitting room, the day after he sent the Mayor his report; his wife takes Petra out as Peter comes in', 'Peter says he received the report yesterday after office hours, and Mrs. Stockmann says “Come along, Petra” and goes into the next room.'),
      no('meeting', 'The public meeting where the doctor speaks to the town', 'That’s the fourth act; here the report has gone no further than the Mayor and the newspaper.'),
      no('office', 'The Mayor’s office at the town hall', 'Peter comes to his brother’s house; he wrote that he would come up himself about midday.'),
    ],
    relationship: [
      yes('brothers', 'Brothers, the elder his chief: Peter got him his post at the Baths and has helped him with money', 'Peter reminds him he has him to thank for his appointment as medical officer, and that he helped to improve his financial position.'),
      no('strangers', 'Two officials who barely know each other', 'They’re brothers, and call each other Peter and Thomas.'),
      no('allies', 'Allies, working together to put the Baths right', 'Peter says the report hasn’t convinced him, and asks him to withhold it.'),
    ],
    roles: [
      {
        name: 'Dr. Stockmann',
        objective: [
          yes('act', 'Make his brother act on the report, and quickly', 'He means to bring it before the Committee, since something must be done in the matter, and quickly.'),
          yes('credit', 'Be owned as right, and as the man who first saw what the Baths could be', 'He says he was the first to see the town could be a watering-place, and fought for it single-handed for years.'),
          no('reward', 'Win something for himself out of the discovery', 'He asks for a sewer and new conduits, and nothing for himself.'),
        ],
        obstacle: [
          yes('chief', 'The cost, and his brother’s authority over him', 'Peter puts the work at fifteen or twenty thousand pounds and two years, and tells him an officer under the Committee has no right to an opinion of his own.'),
          yes('temper', 'His own temper, which his brother counts on', 'Peter calls him pugnacious and cantankerous, and once he has shouted he has to control himself.'),
          no('doubt', 'He isn’t sure of his findings yet', 'He says he waited until he was absolutely certain, and he is.'),
        ],
        tactic: [
          yes('plain', 'Call it what it is: poison', 'He asks whether there’s any other way to describe water that’s poisonous whether you drink it or bathe in it.'),
          yes('expose', 'Tell his brother to his face what he sees through', 'He says it was Peter’s doing that the Baths and the conduits were built where they are, and that’s the blunder he won’t acknowledge.'),
          no('deal', 'Agree to let it be patched up quietly', 'When Peter offers improvements “consistently with a reasonable expenditure,” he calls it trickery: a fraud, a lie, a crime towards the public.'),
        ],
      },
      {
        name: 'Peter Stockmann',
        objective: [
          yes('quiet', 'Keep the report from the Committee and every word of it from the public', 'He says the report must be withheld, and nothing of the affair must come to the ears of the public.'),
          yes('recant', 'Make him take it back in public, once it can’t be hushed up', 'He says the doctor will find, after further investigation, that it isn’t as dangerous as he imagined, and say so publicly.'),
          no('repair', 'Have the conduits relaid at once', 'He says the water supply is an established fact and must be treated as such.'),
        ],
        obstacle: [
          yes('press', 'The newspaper already knows, and his brother won’t be quieted', 'The doctor tells him the People’s Messenger knows, and that he means to be free to speak on any subject under the sun.'),
          no('proof', 'The report has been shown to be wrong', 'He says only that it hasn’t convinced him; the doctor tells him he knows it very well and won’t acknowledge it.'),
        ],
        tactic: [
          yes('cost', 'Reason from the cost: the money, the two years, the rival towns', 'He puts it at fifteen or twenty thousand pounds and two years, while the towns nearby draw the visitors away.'),
          yes('rank', 'Pull rank, as his chief', '“I forbid it—I, your chief; and if I forbid it, you have to obey.”'),
          no('shout', 'Shout him down', 'It’s the doctor who shouts; Peter keeps to the language of his office.'),
        ],
      },
    ],
  },
  {
    // Act One, from the men's coming in to Roberts's "Good day, gentlemen!", played between Roberts and Anthony. The
    // directors, the manager, the secretary, the Union's man and the committee each put in a line or two (most of them
    // before Anthony's "Attend to me, Roberts!"), which a class scene cuts or gives to the room.
    id: 'strife-1', play: 'Strife', by: 'John Galsworthy', year: 1909, where: 'Act One, Roberts before the Board', language: 'prose', size: 'medium', genre: 'drama', difficulty: 3,
    summary: 'The strike at the Trenartha Tin Plate Works has lasted all winter, and the Board has come down from London to meet the men’s committee. Roberts, the men’s leader, makes the Board speak first, and answers the old Chairman, John Anthony, that if there’s to be one master it’ll be the men. Then, before the directors, the Union’s man and his own committee, he tells Anthony the men are starving and will die before they give way, and Anthony refuses every demand on the paper.',
    circumstances: [
      yes('board', 'Noon on February 7th, the manager’s dining room set out as a Board table; the directors, the Union’s man and the men’s committee are all in the room', 'Roberts says the men will stand in the presence of the Board, and men and directors listen throughout as though to words they wouldn’t have spoken themselves.'),
      no('alone', 'A private word between the two of them', 'Every word is said before the Board and the committee, and Roberts goes out with his men.'),
      no('settled', 'The end of the day, when the strike is settled', 'That’s the last act, at five o’clock, and the settlement is made over both their heads.'),
    ],
    relationship: [
      yes('enemies', 'Old antagonists: the Chairman who has beaten the men four times, and the workman with a grievance over his own discovery', 'Roberts tells him he has fought them down four times, and the Board knows the grievance: a discovery the Company paid him seven hundred for.'),
      no('friends', 'Old friends fallen out over the strike', 'Roberts says that from the time he remembers anything, Anthony has been an enemy to every man in his works.'),
      no('allies', 'Allies against the Union', 'Anthony won’t have the Union settle it, and Roberts has nothing but shame for the Union that dropped the men.'),
    ],
    roles: [
      {
        name: 'Roberts',
        objective: [
          yes('grant', 'Have the demands granted, every one', 'He says there isn’t one sentence on the paper the men can do without.'),
          yes('never', 'Make the Board see the men will never give way', 'He tells them the men will starve sooner than give way, and that the Chairman is fighting the last fight he’ll ever fight.'),
          no('compromise', 'Find terms both sides can live with', 'He says the men won’t give way the least part of an inch; compromise is what the Union’s man expects, not Roberts.'),
        ],
        obstacle: [
          yes('will', 'A will as fixed as his own', 'Asked whether he means the refusal, Anthony says, “I do.”'),
          yes('men', 'His own men waver, and the Union has dropped them', 'He turns sharply on the men for a movement among them, and says more shame to the Union for not supporting them.'),
          no('gagged', 'He isn’t allowed to speak his mind', 'Anthony tells him, “Go on, Roberts; say what you like!”'),
        ],
        tactic: [
          yes('bite', 'Bite: give the Board its own meetings back, and thank it for its gracious hearing', 'He mimics their meetings: refer it to the manager, can we squeeze them a little more?'),
          yes('warn', 'Warn the old man to his face', 'He steps forward: “ye’re fighting the last fight ye’ll ever fight!”'),
          no('beg', 'Beg the Board for terms', 'He makes the Board speak first, and calls the demands what a just man should ask and a just man give.'),
        ],
      },
      {
        name: 'Anthony',
        objective: [
          yes('master', 'Make the men come in on the Board’s terms', '“There can only be one master, Roberts.”'),
          yes('hear', 'Have Roberts say his piece, and answer it once', 'He tells him he’s there to speak for the men as Anthony is for the Board: “Now then, what is it?”'),
          no('settle', 'Settle the strike today', 'He refuses every demand and adjourns the meeting to five o’clock.'),
        ],
        obstacle: [
          yes('match', 'A man as unbending as himself', 'Roberts answers his “one master” with “Then, be Gad, it’ll be us,” and the two stare at one another.'),
          yes('board', 'His own Board wants to settle, and stirs at every word', 'At the refusal a director gets up and goes to the fire with a movement of disgust.'),
          no('union', 'The Union is backing the men', 'The Union has withdrawn its support, and Roberts says more shame to it.'),
        ],
        tactic: [
          yes('few', 'Say as little as he can, and say it flat', '“The Board has nothing to say.” Asked if he means the refusal: “I do.”'),
          yes('rope', 'Let him run on', '“Go on, Roberts; say what you like!”'),
          no('haggle', 'Haggle over the demands one by one', 'He reads the paper and refuses it whole.'),
        ],
      },
    ],
  },
  {
    // Act Two, from Cleaver's rising to cross-examine to Falder's last answer to him. The judge puts two questions of his
    // own and Frome makes one point, which a class scene cuts or gives to the room.
    id: 'justice-2', play: 'Justice', by: 'John Galsworthy', year: 1910, where: 'Act Two, the Assizes, the cross-examination', language: 'prose', size: 'short', genre: 'drama', difficulty: 2,
    summary: 'Falder, a junior clerk of twenty-three, altered a check his employers drew for nine pounds to ninety, to take the woman he loves away from a husband who beats her. His counsel has pleaded a moment of madness, and Falder has told the jury he remembers nothing of the four minutes it took. Counsel for the Crown rises to cross-examine him.',
    circumstances: [
      yes('court', 'A foggy October afternoon at the Assizes, the court crowded with barristers, reporters and jurymen; Falder in the witness-box, the judge above', 'The court is crowded with barristers, solicitors, reporters, ushers and jurymen, and Falder has just turned to the jury to tell them what happened.'),
      no('office', 'The solicitors’ office the morning the check is found out', 'That’s the first act, in July; this is the trial, in October.'),
      no('cell', 'His cell, after the sentence', 'That’s the third act; the jury hasn’t given its verdict.'),
    ],
    relationship: [
      yes('crown', 'The Crown’s counsel, an old advocate, and the prisoner in the box', 'The play calls Cleaver an old advocate, and he has just closed the case for the Crown.'),
      no('defender', 'His own counsel, drawing his story out of him', 'That’s Frome, who sits down as Cleaver rises.'),
      no('employer', 'The clerk and the solicitor he worked for', 'Falder clerked for James and Walter How, who gave their evidence before this; Cleaver he meets only in court.'),
    ],
    roles: [
      {
        name: 'Falder',
        objective: [
          yes('believed', 'Be believed: he doesn’t remember altering the check', 'Asked whether he remembers altering it, he says faintly, “No, sir.”'),
          yes('morning', 'Make them see what that morning was', 'He says he was half frantic all that morning, and then that he was haunted.'),
          no('deny', 'Deny that he altered it', 'He has admitted it; his defense is that he wasn’t himself when he did it.'),
        ],
        obstacle: [
          yes('counterfoil', 'The counterfoil he altered days later, and the clerk suspicion could have fallen on', 'He admits he altered it on the Wednesday morning, and that it was no accident.'),
          no('ruth', 'The woman he loves has spoken against him', 'She gave evidence for him; his counsel says she came to court at the risk of her life.'),
        ],
        tactic: [
          yes('brief', 'Answer as truly and as briefly as he can', 'His answers shrink as the questions come: “No,” faintly; “Yes,” almost inaudibly.'),
          yes('sullen', 'Hold on, and answer back once', 'Sullenly, he says he meant to write when he got out there, and would have paid the money back.'),
          no('fight', 'Fight back and turn on the Crown', 'He never raises his voice; he answers faintly and very low.'),
        ],
      },
      {
        name: 'Cleaver',
        objective: [
          yes('ordinary', 'Show the jury an ordinary forgery, stripped of romance', 'He asks whether, divested of the romantic glamour his friend is casting over it, this is anything but an ordinary forgery.'),
          yes('deliberate', 'Show that what came after was done on purpose', 'He makes him admit the counterfoil was altered days later, and that it was no accident.'),
          no('mercy', 'Win him a lighter sentence', 'He prosecutes for the Crown; the plea for mercy is the defense’s.'),
        ],
        obstacle: [
          yes('pity', 'The jury’s pity: the bruised woman, the boy of twenty-three', 'Frome has put her bruises and his youth before them.'),
          no('silent', 'The prisoner won’t answer', 'He answers every question, however faintly.'),
        ],
        tactic: [
          yes('facts', 'Take him through it a fact at a time: the running, the counterfoil, the nine pounds', 'He fastens on the running, then the counterfoil, then the nine pounds Falder remembered to take back.'),
          yes('light', 'Treat the defense as a joke', '“Queer sort of accident, wasn’t it?” he says cheerfully.'),
          no('bully', 'Shout him down', 'His sharpest words are “Now, now!” and “Come”; it’s the judge who demands “yes or no!”'),
        ],
      },
    ],
  },
  {
    // Act One, from Becker's "it's not pay" to Dreissiger's "Do you want me to come and help you?", when a child faints
    // and the room turns away. Pfeifer, the manager, has a handful of lines and the cashier one, which a class scene cuts
    // or gives to the room; Becker's retort to Pfeifer goes with them.
    id: 'weavers-1', play: 'The Weavers', by: 'Gerhart Hauptmann, tr. Mary Morison', year: 1892, where: 'Act One, pay day at Dreissiger’s', language: 'prose', size: 'short', genre: 'drama', difficulty: 1,
    summary: 'At noon on a sultry day in the forties, the weavers wait shoulder to shoulder at the manufacturer Dreissiger’s house in Peterswaldau to have their webs weighed and paid for. Becker, a young, powerfully built weaver from Bielau, is paid one and threepence and says aloud it’s a beggar’s wage. The manager fetches Dreissiger, and before the crowd the two have it out until Becker is turned off; he won’t go until his pay is put into his hand.',
    circumstances: [
      yes('payday', 'Noon on a sultry day at the end of May, in the room where the webs are weighed and paid for; the weavers wait their turn, shoulder to shoulder', 'The clock is on the stroke of twelve, and the crowd can be seen through the glass door, waiting.'),
      no('stormed', 'The day the weavers break into Dreissiger’s house', 'That’s the fourth act; here they still bring their webs in and take what they’re paid.'),
      no('private', 'A word in private in Dreissiger’s office', 'The manager calls him out of the office into the room full of weavers, and he warns them all.'),
    ],
    relationship: [
      yes('master', 'The manufacturer, and a young weaver who won’t be told to hold his tongue', 'The manager tells Dreissiger that Becker says he won’t be told to hold his tongue.'),
      no('known', 'Old acquaintances who have clashed before', 'Dreissiger has to ask whether he’s the man.'),
      no('ringleader', 'The ringleader of last night’s march, caught and charged', 'Dreissiger only asks whether he was one of the pack, and threatens the justice if it happens again.'),
    ],
    roles: [
      {
        name: 'Becker',
        objective: [
          yes('pay', 'Be paid fairly, and say aloud that this isn’t pay', '“That’s what you might give to a beggar; it’s not pay.”'),
          yes('man', 'Stand as a man in front of the master', '“This is the man. And that’s a man too!”'),
          no('work', 'Keep his work at any price', '“It’s all the same to me whether I starve at my loom or by the roadside.”'),
        ],
        obstacle: [
          yes('power', 'Dreissiger can take his work away with a word', 'Dreissiger tells his clerks, “That man gets no more work from us.”'),
          no('unheard', 'He has no one to hear him', 'He speaks to those standing near without lowering his voice, and the weavers stir as he’s turned off.'),
        ],
        tactic: [
          yes('defy', 'Hold his ground, and give insult for threat', 'He tells Dreissiger a real manufacturer has four stomachs like a cow and teeth like a wolf.'),
          yes('letter', 'Insist on his due, to the letter', '“Not without my pay,” twice, until the money is put in his hand: “Everything in proper order.”'),
          no('back-down', 'Back down once Dreissiger roars', '“I’m not deaf,” he says, holding his ground. “My hearing’s quite good yet.”'),
        ],
      },
      {
        name: 'Dreissiger',
        objective: [
          yes('silence', 'Silence him in front of the others', '“Hold your tongue this moment, sir, or …”'),
          yes('warning', 'Warn the whole room through him', '“Well, I give you all warning,” he says, of the song sung under his windows last night.'),
          no('hear', 'Hear out his complaint about the pay', 'He never answers it; he asks only whether Becker was one of the pack.'),
        ],
        obstacle: [
          yes('nerve', 'Becker won’t be cowed, with the weavers looking on', 'Becker holds his ground, and won’t go until the money is put in his hand.'),
          yes('temper', 'His own temper, and his breath', 'The play makes him asthmatic; he trembles, roars, and has to control himself.'),
          no('police', 'The police are on Becker’s side', 'Dreissiger threatens to send for the police himself.'),
        ],
        tactic: [
          yes('cool', 'Turn cool and businesslike', 'He controls himself and asks, in an apparently cool business tone, whether Becker was one of the pack.'),
          yes('threat', 'Threaten: the police, the justice, his work', 'He says another word and he sends for the police, and tells the clerks the man gets no more work.'),
          no('reason', 'Reason with him over the price of a web', 'He gives no reason; he flings the money on the table.'),
        ],
      },
    ],
  },
];
