/**
 * SLATE — scenes played out to a house, for scene study (from 2026-10-16, brief 09), from plays in the public domain,
 * each in the edition named.
 *
 * Why these were added. Until 2026-10-16 every one of the catalog's 60 class scenes and 30 plays was played off a
 * partner at level 2 or 3, and none was played to many with the partner barely there. So what a piece demands of
 * presence with little to play off (`DEMAND_EFFECT.solo`, `content/approaches.ts`) reached no scene and no night, only
 * the taped briefs, and presence's specialist came out ahead of an even actor on none of the 60 scenes
 * (docs/verification/integration-2026-10-16/h4.md, brief 09's section). The owner's brief 09 (section 2, H4) asked for
 * in-scope material where an ability is underrepresented, presence above all, read from public-domain texts as the
 * four drama scenes of `scenes-public.ts` were. Three of these are speeches to a crowd or an army, each answered by a
 * second part that speaks to the same many and hardly to the first; the fourth is a play within a play, performed as
 * it was rehearsed before a court that answers every line. Their profiles (`content/material.ts`) were read from the
 * same texts and committed before any measurement of how they come out. No existing scene was changed.
 *
 * The editions, read on Project Gutenberg on 2026-10-16:
 * - Shakespeare, Julius Caesar (1599) and Henry V (1599), the PG Shakespeare Team's texts:
 *   https://www.gutenberg.org/ebooks/1522 and https://www.gutenberg.org/ebooks/1521.
 * - Sophocles, Oedipus, King of Thebes, tr. Gilbert Murray (1911): https://www.gutenberg.org/ebooks/27673. The play is
 *   the catalog's Oedipus Tyrannus, whose other scene is Jebb's (`content/scenes-greek.ts`); this one is Murray's, as
 *   the Greek scenes from Euripides and Aeschylus are. `year` is the translation's.
 * - Shakespeare, A Midsummer Night's Dream (1595), the PG Shakespeare Team's text: https://www.gutenberg.org/ebooks/1514.
 *
 * Each is two parts. Where others speak (the citizens, the lords, the suppliants, the court and the mechanicals who play
 * Wall, Lion and Moonshine), a class scene gives their lines to the room, as Antigone's gives the Chorus's; each
 * scene's comment says where it starts and ends. The readings paraphrase the texts and quote only a phrase, as the rest
 * of the bank does, and every `why` names what in the text it rests on.
 *
 * Considered and left out: Henry V's "Once more unto the breach" (3.1) and the Chorus's prologues, each one voice with
 * no second part; Coriolanus before the people (3.3), where the tribunes and the citizens share the scene among a dozen
 * voices; Montjoy's embassy in Henry V's 4.3, a third part, which the scene here ends before; and Scapin's sack scene
 * (Molière, The Impostures of Scapin, 3.2, tr. Charles Heron Wall, Gutenberg #8776), read as a long set score for
 * discipline: it's played off its partner line by line, in one tone, so it isn't a scene played out to a house, and a
 * scene was profiled by its changes of tone, so its five turns would have been two parts
 * (docs/verification/integration-2026-10-16/h4.md). From evaluation-10, later the same day, a scene is cut at its turns
 * too, and the sack scene was added in `content/scenes-scored.ts`.
 *
 * Only the types come from `coursework.ts`: it imports this file, so a value import back would be circular. The two
 * helpers are local copies of its own.
 */

import type { Scene, Option } from './coursework';

const yes = (id: string, text: string, why?: string): Option => ({ id, text, supported: true, ...(why ? { why } : {}) });
const no = (id: string, text: string, why: string): Option => ({ id, text, supported: false, why });

export const HOUSE_SCENES: readonly Scene[] = [
  {
    // Act Three, Scene Two, from Brutus's "Then follow me, and give me audience, friends" to Antony's "Now let it work.
    // Mischief, thou art afoot, Take thou what course thou wilt!", played between Brutus and Antony. The Citizens' lines
    // are the room's; Cassius goes before Brutus speaks, and the Servant's news after the crowd has run is cut.
    id: 'caesar-3-2', play: 'Julius Caesar', by: 'William Shakespeare', year: 1599, where: 'Act Three, Scene Two, the Forum', language: 'verse', size: 'long', genre: 'tragedy', difficulty: 3,
    summary: 'Caesar is dead, and the citizens demand to be satisfied. Brutus goes up into the pulpit and gives them his reasons in plain prose: he loved Caesar, but loved Rome more, and slew him for his ambition. They cheer him and would make him Caesar, and he asks them to stay and hear Antony, whom the conspirators have allowed to speak at the funeral, and goes. Antony, speaking under their leave, calls them honourable men until the word turns, comes down to show the crowd Caesar’s mantle and his wounds, and reads them the will, until they run to burn the traitors’ houses.',
    circumstances: [
      yes('forum', 'The Forum on the day of the murder, a throng of citizens demanding reasons; Caesar’s body brought in by Antony while Brutus is speaking', 'The citizens demand to be satisfied, and Antony enters with the body before Brutus has done.'),
      no('senate', 'The Capitol, among the senators', 'That was the scene before; here Brutus goes up into the pulpit before the common people.'),
      no('private', 'A private meeting of the two men', 'Every word is spoken to the crowd, and Brutus departs alone before Antony begins.'),
    ],
    relationship: [
      yes('rivals', 'Two of Caesar’s friends, one his killer and one his mourner, each speaking to the same crowd by the other’s leave', 'Brutus says Antony had no hand in the death and speaks “by our permission”; Antony speaks “under leave of Brutus and the rest.”'),
      no('allies', 'Allies with one cause', 'Once Brutus has gone, Antony turns the crowd against him: “Mischief, thou art afoot.”'),
      no('strangers', 'Strangers to each other', 'Antony was Caesar’s friend, and he tells the crowd Brutus was Caesar’s angel.'),
    ],
    roles: [
      {
        name: 'Brutus',
        objective: [
          yes('reasons', 'Give the people the reasons for Caesar’s death, and be believed', '“Believe me for mine honor”: not that he loved Caesar less, but that he loved Rome more.'),
          yes('consent', 'Have the people own that it was done for them', 'He asks who here is so vile as not to love his country, and pauses for a reply.'),
          no('crown', 'Take Caesar’s place', 'The citizens cry “Let him be Caesar,” and he asks them to stay with Antony and departs alone.'),
        ],
        obstacle: [
          yes('body', 'The body itself, brought in and mourned while he speaks', 'Antony enters with Caesar’s body as Brutus is still giving his reasons.'),
          yes('honour', 'His own honor, which leaves the crowd to Antony', 'He entreats them that not a man depart, save he alone, till Antony has spoken.'),
          no('hostile', 'A crowd that won’t hear him', 'They cry “Live, Brutus! live, live!”'),
        ],
        tactic: [
          yes('balance', 'Reason with them in plain, balanced prose', 'Tears for his love, joy for his fortune, honor for his valour, and death for his ambition.'),
          yes('dare', 'Dare any man there to say he has offended', '“Who is here so base, that would be a bondman? If any, speak; for him have I offended.”'),
          no('tears', 'Move them with tears over the body', 'That’s Antony’s way; Brutus offers them his own death on the same dagger, when Rome needs it.'),
        ],
      },
      {
        name: 'Antony',
        objective: [
          yes('turn', 'Turn the people against the men who killed Caesar', '“Now let it work. Mischief, thou art afoot.”'),
          yes('mourn', 'Make them mourn Caesar as he does', '“You all did love him once, not without cause; What cause withholds you then to mourn for him?”'),
          no('peace', 'Make peace between Rome and the conspirators', 'He stirs the crowd to mutiny, and lets it take what course it will.'),
        ],
        obstacle: [
          yes('crowd', 'A crowd that has just cheered Brutus', 'A citizen warns “’Twere best he speak no harm of Brutus here!” and another says Caesar was a tyrant.'),
          yes('leave', 'The terms he speaks on: to praise Caesar and not blame his killers', '“I come to bury Caesar, not to praise him,” and the noble Brutus is an honourable man.'),
          no('speaker', 'He’s no speaker', 'He tells them he’s “no orator, as Brutus is,” and he’s the orator of the scene.'),
        ],
        tactic: [
          yes('honourable', 'Call them honourable until the word means its opposite', '“For Brutus is an honourable man; So are they all, all honourable men.”'),
          yes('show', 'Show them: the mantle, the wounds, the will', '“Look, in this place ran Cassius’ dagger through,” and then the body itself, marred with traitors.'),
          no('accuse', 'Call the killers murderers outright', 'He leaves that to the crowd: “They were traitors. Honourable men!”'),
        ],
      },
    ],
  },
  {
    // Act Four, Scene Three, from Westmorland's "O that we now had here But one ten thousand of those men in England"
    // to the King's "You know your places. God be with you all!", played between the King and Westmorland. The lords'
    // count of the French before the King comes, and Salisbury's word that they're set to charge, are the room's;
    // Montjoy's embassy after it is a third part, and isn't set.
    id: 'henry5-4-3', play: 'Henry V', by: 'William Shakespeare', year: 1599, where: 'Act Four, Scene Three, the English camp before Agincourt', language: 'verse', size: 'medium', genre: 'drama', difficulty: 2,
    summary: 'On the morning of Agincourt the English lords count the French at three-score thousand, five to one, and fresh. The King comes in on his cousin Westmorland wishing for ten thousand of the men idle in England, and answers him before the whole host: if they’re marked to die they’re enough to do their country loss, and if to live, the fewer men, the greater share of honor. Any man without the stomach for the fight may go, with a passport and crowns for his convoy. Saint Crispin’s day, he tells them, will be remembered with their names to the ending of the world: we few, we happy few, we band of brothers. When the French are set to charge, Westmorland wishes the King and he could fight the battle alone.',
    circumstances: [
      yes('camp', 'The English camp on the morning of the battle, the host gathered; the French three-score thousand, five to one, and fresh', 'Westmorland counts the French at full three-score thousand, and Exeter makes it five to one; besides, they all are fresh.'),
      no('tent', 'A council of war in the King’s tent', 'The lords stand with all the host, and the King bids Westmorland proclaim it through the host.'),
      no('after', 'The evening after the victory', 'The French are about to charge: Salisbury brings word they’re set in their battles.'),
    ],
    relationship: [
      yes('kin', 'The King and his cousin, a lord who will fight beside him', 'He calls him “My cousin Westmorland” and “coz.”'),
      no('rivals', 'Rivals for command of the army', 'Westmorland ends wishing he and the King could fight the battle alone.'),
      no('strangers', 'A king and a soldier he doesn’t know', 'He knows him at once: “What’s he that wishes so? My cousin Westmorland?”'),
    ],
    roles: [
      {
        name: 'King Henry',
        objective: [
          yes('heart', 'Put heart into his army before the battle', 'He bids any man without the stomach for the fight depart, and promises the rest they’ll be remembered.'),
          yes('honour', 'Make the odds a matter of honor, not of fear', '“The fewer men, the greater share of honor.”'),
          no('terms', 'Look for terms with the French', 'When the herald comes, he sends him back with his former answer: no ransom.'),
        ],
        obstacle: [
          yes('odds', 'Five to one, and the French fresh', 'Exeter says there’s five to one; besides, they all are fresh.'),
          yes('wish', 'His own lords’ fear, said as a wish for more men', 'Westmorland wishes for ten thousand of those men in England that do no work today.'),
          no('desert', 'His men refuse to fight', 'Westmorland, who wished for more men, ends wishing he and the King could fight it alone.'),
        ],
        tactic: [
          yes('turn', 'Turn the wish inside out: not one man more', '“God’s will! I pray thee, wish not one man more.”'),
          yes('future', 'Make them see the day as it will be told', '“He that outlives this day, and comes safe home, Will stand a tip-toe when this day is named.”'),
          no('threat', 'Threaten the man who would leave', 'He offers him his passport, and crowns for his convoy put into his purse.'),
        ],
      },
      {
        name: 'Westmorland',
        objective: [
          yes('men', 'Have more men against the odds', '“O that we now had here But one ten thousand of those men in England.”'),
          yes('follow', 'Follow the King into the battle with a whole heart', '“Perish the man whose mind is backward now!”'),
          no('flee', 'Leave the field', 'He wishes the King and he could fight the battle alone.'),
        ],
        obstacle: [
          yes('count', 'The count he has just made himself', 'It was Westmorland who put the French at full three-score thousand.'),
          yes('answered', 'His wish answered before the whole host', '“What’s he that wishes so? My cousin Westmorland? No, my fair cousin.”'),
          no('silenced', 'He isn’t allowed to speak', 'The King asks him outright, “Thou dost not wish more help from England, coz?”'),
        ],
        tactic: [
          yes('wish', 'Say the fear aloud, as a wish', 'He wishes for the men “That do no work today.”'),
          yes('outdo', 'Outdo the King’s own boast', '“Would you and I alone, Without more help, could fight this royal battle!”'),
          no('argue', 'Argue the numbers with the King', 'He doesn’t answer the speech; what he says next is “Perish the man whose mind is backward now!”'),
        ],
      },
    ],
  },
  {
    // Murray's vv. 1–86, from Oedipus's "My children, fruit of Cadmus' ancient tree" to the Priest's "Is that not Creon
    // drawing near?", played between Oedipus and the Priest of Zeus. The suppliants' cry as he comes out is the room's;
    // Creon's coming ends it.
    id: 'oedipus-1', play: 'Oedipus Tyrannus', by: 'Sophocles, tr. Gilbert Murray', year: 1911, where: 'Before the palace at Thebes, the suppliants at the altars', language: 'verse', size: 'short', genre: 'tragedy', difficulty: 2, tradition: 'greek',
    summary: 'Thebes is dying of a plague: blight on the crops and the herds, women dying in childbirth. Suppliants of every age crowd the altars before the palace with olive branches, and when Oedipus comes out to them himself, their Priest speaks for them all. He reminds the king that he came to Thebes a stranger and swept away the Sphinx, and begs him to raise the city again. Oedipus answers that he has wept for them already, and has sent his wife’s brother Creon to Apollo at Delphi to ask what will save the city; he wonders at the delay, and swears before them to do whatever the god shows him, as Creon is seen coming with a laurel wreath.',
    circumstances: [
      yes('plague', 'Before the palace at Thebes in the plague, suppliants of every age crowding the altars with olive branches', 'The Priest tells of the blight on the buds and the herds, the women dying in travail, and a burning god that sweeps the land.'),
      no('summoned', 'An assembly the king has called', 'They have come unbidden; he asks why they press upon him with their branches.'),
      no('private', 'A private audience', 'The whole crowd of suppliants is there, and the Priest speaks as their champion.'),
    ],
    relationship: [
      yes('saviour', 'The king who saved the city once, and the old priest who speaks for it', 'The Priest reminds him he came to Thebes a stranger, knowing no more than they, and swept away the Sphinx.'),
      no('rivals', 'Rivals for the city’s trust', 'The Priest says all the land still holds him its saviour, and begs him to be their Oedipus again.'),
      no('kin', 'Kinsmen', 'He is the priest of Zeus; the king’s kinsman is Creon, his wife’s brother, still on the road from Delphi.'),
    ],
    roles: [
      {
        name: 'Oedipus',
        objective: [
          yes('save', 'Save his city', 'He has sent Creon to ask Apollo what word or deed of his may save it.'),
          yes('answer', 'Answer them himself, before them all', 'He scorned to hear it by message or writing, and came out to them himself, “world-honored Oedipus.”'),
          no('culprit', 'Find the city a culprit', 'He knows nothing yet of the cause; he waits on the god’s word.'),
        ],
        obstacle: [
          yes('delay', 'Creon’s delay: the answer hasn’t come', 'He marvels what delays the journey: it’s beyond all thought.'),
          yes('grief', 'His own grief for them', 'Not one of them, he says, is so stricken to the heart as he.'),
          no('doubt', 'The people doubt him', 'The Priest says all the land still holds him its saviour.'),
        ],
        tactic: [
          yes('share', 'Take their grief as his own', 'Their grief comes to each man for his own loss; his heart weeps for them and himself and all.'),
          yes('vow', 'Bind himself before them', '“Then call me false and traitor, if I flee Back from whatever task God sheweth me.”'),
          no('dismiss', 'Send them home to wait', 'He calls them his children, and answers all of them.'),
        ],
      },
      {
        name: 'The Priest Of Zeus',
        objective: [
          yes('rise', 'Have the king lift the city from its grief', '“Up, O chief Of men, and lift thy city from its grief.”'),
          yes('speak', 'Speak for every age that kneels there', 'He shows him the little ones and the old, the priests and the chosen youths, and the thousands wailing in the market-place.'),
          no('accuse', 'Lay the plague at the king’s door', 'He calls him no god, but the chief of men, and the city’s saviour of old.'),
        ],
        obstacle: [
          yes('god', 'The plague is a god’s', '“A burning and a loathly god hath lit Sudden, and sweeps our land.”'),
          yes('awe', 'The awe of a king the city kneels to', 'He says they kneel before his hearth, though they don’t take him for a god.'),
          no('deaf', 'The king won’t hear them', 'Oedipus asks him to declare their mood, and answers.'),
        ],
        tactic: [
          yes('sphinx', 'Remind him of the Sphinx', 'He came so swift to Thebes and swept away the Sphinx’s song.'),
          yes('warn', 'Warn him how he’ll be remembered', '“Shall they that tell of thee hereafter tell ‘By him was Thebes raised up, and after fell!’”'),
          no('demand', 'Demand it as the city’s right', 'He kneels and prays with the rest.'),
        ],
      },
    ],
  },
  {
    // Act Five, Scene One, the mechanicals' play, from Pyramus's "O grim-look'd night!" to Thisbe's "Adieu, adieu,
    // adieu", played between Bottom as Pyramus and Flute as Thisbe. The Prologue's, Wall's, Lion's and Moonshine's lines
    // and the court's remarks on every one are the room's; Theseus's choosing of the play before it and the Bergomask
    // after it are cut.
    id: 'dream-5-1', play: 'A Midsummer Night’s Dream', by: 'William Shakespeare', year: 1595, where: 'Act Five, Scene One, the mechanicals’ play at the palace of Theseus', language: 'verse', size: 'medium', genre: 'comedy', difficulty: 2,
    summary: 'On his wedding night Theseus chooses “A tedious brief scene of young Pyramus And his love Thisbe; very tragical mirth,” played by hard-handed workmen who have toiled their unbreathed memories with it, against Philostrate’s warning. Bottom plays Pyramus and Flute plays Thisbe, before the Duke, his bride and the court. Pyramus curses the wall that shows him no Thisbe, and stops the play to tell the Duke that “deceiving me” is Thisbe’s cue; the lovers kiss the wall’s hole and agree to meet at Ninny’s tomb. Thisbe is roared off by the Lion, who tears her mantle; Pyramus finds it bloody, stabs himself and dies five times over; Thisbe finds him, mourns his cherry nose and his leek-green eyes, and dies on his sword, while the court jokes at every line.',
    circumstances: [
      yes('wedding', 'The palace of Theseus on his wedding night, the Duke and his court watching the play', 'Theseus chooses it for the hours between supper and bedtime, and he and his court speak over every scene.'),
      no('wood', 'A rehearsal in the wood', 'That was the night before. Philostrate says the Prologue is ready, and this is the performance.'),
      no('alone', 'Two lovers alone at night', 'That’s the story they play; they play it before the whole court.'),
    ],
    relationship: [
      yes('company', 'Two of a company of Athenian workmen, Bottom the weaver and Flute the bellows-mender, playing two lovers', 'Quince cast them in the first act, Flute protesting, “let not me play a woman. I have a beard coming.”'),
      yes('lovers', 'As the play has it, two lovers kept apart by a wall between their fathers’ grounds', 'The Prologue tells how that vile wall did these lovers sunder.'),
      no('rivals', 'Rivals in the company, each playing for the laugh', 'Bottom corrects the Duke in earnest, and Thisbe comes in on her cue as he says she will.'),
    ],
    roles: [
      {
        name: 'Bottom, As Pyramus',
        objective: [
          yes('pat', 'Play Pyramus to the Duke exactly as they rehearsed it', '“You shall see it will fall pat as I told you.”'),
          yes('tears', 'Move the court to tears', 'In the first act he said the part asks some tears in the true performing of it: “let the audience look to their eyes.”'),
          no('laugh', 'Make the court laugh', 'He plays the death in earnest, and when the Duke jokes that the wall should curse again he answers him in earnest: “No, in truth, sir.”'),
        ],
        obstacle: [
          yes('court', 'The court’s jokes at every line', 'Theseus says the wall should curse again, and Demetrius calls it the wittiest partition he ever heard discourse.'),
          yes('wall', 'The play’s own makeshifts: a wall played by a man, the moon by a lantern', 'Wall holds up his fingers for the chink.'),
          no('lines', 'He doesn’t know his lines', 'He knows them, and Thisbe’s cue as well.'),
        ],
        tactic: [
          yes('explain', 'Stop the play to set the Duke right', 'He tells the Duke that “‘Deceiving me’ is Thisbe’s cue,” and that she enters now, to be spied through the wall.'),
          yes('full', 'Play every line at its fullest', '“Thus die I, thus, thus, thus,” and “Now die, die, die, die, die.”'),
          no('wink', 'Wink at the court', 'He corrects the Duke in earnest, and goes on.'),
        ],
      },
      {
        name: 'Flute, As Thisbe',
        objective: [
          yes('cue', 'Come in on the cue and keep to the play', 'She enters on “deceiving me,” as Bottom said she would.'),
          yes('passion', 'End the play with Thisbe’s passion', 'Theseus says, “Here she comes, and her passion ends the play.”'),
          no('stop', 'Stop the play, as Bottom does', 'She plays it through to “Adieu, adieu, adieu,” and never turns to the court.'),
        ],
        obstacle: [
          yes('mocked', 'The court’s mockery', 'Hippolyta hopes she will be brief, and Demetrius weighs which is the better, Pyramus or Thisbe.'),
          yes('woman', 'Playing a woman', 'In the first act he asked not to: “I have a beard coming.”'),
          no('unrehearsed', 'The play was never rehearsed', 'Philostrate saw it rehearsed, and it made his eyes water with laughter.'),
        ],
        tactic: [
          yes('mourn', 'Mourn every feature of the dead', '“These lily lips, This cherry nose, These yellow cowslip cheeks.”'),
          yes('rhyme', 'Keep the rhyme and the meter, whatever the court says', 'Her lament runs in the short rhymed lines his did, to the last “Adieu.”'),
          no('cut', 'Cut it short', 'She plays every stanza, to the sword and “Thus Thisbe ends.”'),
        ],
      },
    ],
  },
];
