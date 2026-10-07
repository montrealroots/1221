/**
 * SLATE — classical scenes for coursework (from 2026-10-07): two-person
 * scenes of heightened text, Shakespeare's verse and prose and an
 * eighteenth-century comedy's prose, which `content/coursework.ts` adds to
 * its SCENES.
 *
 * Who is in each scene, where and when, and what has happened before it were
 * checked against the play's text (shakespeare.mit.edu for Shakespeare,
 * standardebooks.org for Sheridan). Which readings the text supports, and why
 * the others don't, is SLATE's reading, written to be checked against the
 * play. Years are the play's first performance as commonly dated.
 *
 * The helpers are local: a runtime import from `./coursework` would be
 * circular, since that file imports this one.
 */

import type { Scene, Option } from './coursework';

const yes = (id: string, text: string, why?: string): Option => ({ id, text, supported: true, ...(why ? { why } : {}) });
const no = (id: string, text: string, why: string): Option => ({ id, text, supported: false, why });

export const CLASSICAL_SCENES: readonly Scene[] = [
  {
    id: 'twelfth-1-5', play: 'Twelfth Night', by: 'William Shakespeare', year: 1601, where: 'Act One, Scene Five, Olivia’s house', language: 'verse', size: 'medium', genre: 'comedy', difficulty: 2,
    summary: 'Viola, disguised as the page Cesario, brings Duke Orsino’s suit to Olivia, who is mourning her brother and won’t hear him. Alone with the messenger, Olivia unveils, refuses Orsino again and falls for Cesario; once the page has gone, she sends Malvolio after him with a ring she says he left.',
    circumstances: [
      yes('gate', 'Olivia’s house, the page let in after standing at the gate; Olivia veiled, her women sent out so they can talk alone'),
      no('shore', 'The coast of Illyria, Viola newly ashore from the wreck', 'That’s the second scene; by now she has been serving Orsino as Cesario.'),
      no('court', 'Orsino’s court, with music playing', 'Orsino stays at home and sends Cesario to Olivia’s house in his place.'),
    ],
    relationship: [
      yes('strangers', 'Strangers: a lady in mourning and a duke’s page, who is a woman in disguise'),
      no('old-flame', 'Former lovers', 'They have never met; Olivia sees Cesario for the first time here.'),
      no('household', 'Mistress and servant of the same house', 'Cesario serves Orsino, not Olivia.'),
    ],
    roles: [
      {
        name: 'Viola',
        objective: [
          yes('deliver', 'Deliver Orsino’s suit and win Olivia for him', 'She has learned a speech for it and won’t leave until she’s spoken it.'),
          yes('see', 'See the woman Orsino loves, and judge her for herself', 'She asks to see Olivia’s face, and then tells her she’s too proud.'),
          no('win-self', 'Win Olivia for herself', 'In the scene before, she says that whoever she woos, she would herself be Orsino’s wife.'),
        ],
        obstacle: [
          yes('loves-orsino', 'She loves Orsino, and is pleading his love to another woman'),
          yes('refused', 'Olivia has refused Orsino already and has sworn to mourn her brother'),
          no('locked-out', 'Olivia won’t admit her at all', 'Olivia lets her in and sends her women away.'),
        ],
        tactic: [
          yes('speech', 'Stand on the speech she has learned, and insist on being heard'),
          yes('willow', 'Speak as if she were the lover herself: a willow cabin at Olivia’s gate', 'Asked what she would do, she answers with how she would woo.'),
          no('purse', 'Take Olivia’s purse and plead no more', 'She refuses it, and tells Olivia she’s no paid messenger.'),
        ],
      },
      {
        name: 'Olivia',
        objective: [
          yes('refuse', 'Turn Orsino down again and be rid of his messengers', 'She says plainly that she can’t love him, and he should send no more.'),
          yes('keep', 'Keep this messenger talking, and bring him back', 'She adds, “Unless, perchance, you come to me again,” and sends the ring after him.'),
          no('accept', 'Accept Orsino at last', 'She refuses him outright.'),
        ],
        obstacle: [
          yes('station', 'Her mourning, and a messenger who is only a servant: she has to ask his parentage'),
          no('listening', 'Malvolio is listening at the door', 'She sends her women out; Malvolio comes only when she calls him at the end.'),
        ],
        tactic: [
          yes('mock', 'Mock the speech and the messenger, to keep her distance'),
          yes('unveil', 'Unveil, and list her own beauty as a joke', 'She itemizes her face as if in a will: two lips, indifferent red.'),
          no('faint', 'Faint, so he’ll stay', 'She stays in command, and sends Malvolio with the ring instead.'),
        ],
      },
    ],
  },
  {
    id: 'shrew-2-1', play: 'The Taming of the Shrew', by: 'William Shakespeare', year: 1592, where: 'Act Two, Scene One, Baptista’s house in Padua', language: 'verse', size: 'medium', genre: 'comedy', difficulty: 1,
    summary: 'Petruchio has come to Padua to marry money and settles Katherine’s dowry with her father before he has met her. Left alone with her, he praises every insult as if it were a kindness, and when the others return he announces they’ll marry on Sunday, whatever she says.',
    circumstances: [
      yes('padua', 'Baptista’s house, the same day Katherine has tied up her sister and broken a lute over her music teacher’s head'),
      no('wedding-day', 'The wedding day, with Petruchio late and strangely dressed', 'That’s the third act; here they meet for the first time.'),
      no('country', 'Petruchio’s country house, after the wedding', 'That’s the fourth act; this is her father’s house in Padua.'),
    ],
    relationship: [
      yes('match', 'Strangers whose match is settled before they meet: the dowry is agreed with her father'),
      no('sweethearts', 'Old sweethearts', 'They meet for the first time in this scene.'),
      no('tutor', 'Music teacher and pupil', 'That’s Hortensio in disguise; Petruchio comes as a suitor.'),
    ],
    roles: [
      {
        name: 'Katherine',
        objective: [
          yes('rid', 'Get rid of him, and make a fool of him for coming', 'She calls him a movable and tells him to go.'),
          yes('best', 'Best him in the exchange and have the last word', 'She answers him pun for pun, and strikes him when the words run out.'),
          no('marry', 'Secure the match before Bianca is married first', 'She swears she’ll see him hanged on Sunday first.'),
        ],
        obstacle: [
          yes('him', 'He won’t be insulted: he takes every blow as a compliment and won’t let her go'),
          no('father', 'Her father is in the room', 'They’re alone until Baptista comes back.'),
        ],
        tactic: [
          yes('wit', 'Turn his words back on him: the stool, the wasp, the sting'),
          yes('strike', 'Strike him', 'She does, and he warns he’ll cuff her if she does it again.'),
          no('weep', 'Weep, so he’ll pity her', 'She fights him word for word and doesn’t ask for pity.'),
        ],
      },
      {
        name: 'Petruchio',
        objective: [
          yes('wed', 'Get her consent, or something he can call it, and a wedding day', 'He tells her father they’ve agreed on Sunday.'),
          yes('tame', 'Show her she’s met her match', 'He tells her he’s the man born to tame her.'),
          no('love-first', 'Fall in love before he commits', 'He came for the dowry and settled it before he met her.'),
        ],
        obstacle: [
          yes('her', 'Her temper and her tongue, and the whole town’s word that she’s a shrew'),
          no('rival', 'Another suitor wants her', 'Every other suitor is after Bianca.'),
        ],
        tactic: [
          yes('contrary', 'Praise her for the opposite of everything she does', 'His plan, alone before she comes: if she rails, he’ll tell her she sings as sweetly as a nightingale.'),
          yes('wordplay', 'Match her pun for pun, and win on the bawdy ones'),
          no('retreat', 'Leave when she insults him, and come back when she’s calmer', 'He doesn’t give an inch, and won’t let her leave.'),
        ],
      },
    ],
  },
  {
    id: 'scandal-2-1', play: 'The School for Scandal', by: 'Richard Brinsley Sheridan', year: 1777, where: 'Act Two, Scene One, Sir Peter Teazle’s house', language: 'verse', size: 'short', genre: 'comedy', difficulty: 1,
    summary: 'A few months into their marriage, Sir Peter Teazle, an old bachelor who married a young country girl, tries to curb his wife’s spending in London. Lady Teazle won’t be curbed; she mocks his memories of her country life and leaves for Lady Sneerwell’s, and alone he finds she charms him most when she’s plaguing him.',
    circumstances: [
      yes('london', 'Their house in London, a few months married; she’s on her way out to Lady Sneerwell’s'),
      no('country', 'Her father’s house in the country, during the courtship', 'He brings that life up to her; they’re in London now.'),
      no('screen', 'Joseph Surface’s library, behind the screen', 'That’s the fourth act.'),
    ],
    relationship: [
      yes('married', 'Newly married: an old bachelor and the young country wife he chose'),
      no('father', 'Father and daughter', 'He’s her husband.'),
      no('suitor', 'A suitor and the lady he’s courting', 'They’re already married.'),
    ],
    roles: [
      {
        name: 'Lady Teazle',
        objective: [
          yes('way', 'Have her own way in everything, and the money for it', 'She tells him she ought to have her own way in everything, and means to.'),
          yes('fashion', 'Be a woman of fashion, and have him accept it', 'She says women of fashion in London are accountable to nobody after they are married.'),
          no('leave', 'Leave him', 'She wants his money and his indulgence; she never threatens to go.'),
        ],
        obstacle: [
          yes('purse', 'He holds the purse, and remembers where she came from'),
          no('rival', 'Another woman has his attention', 'There’s no other woman; all his attention is on her.'),
        ],
        tactic: [
          yes('mock', 'Mock him: the one thing left he can make her is his widow'),
          yes('cool', 'Stay cool while he loses his temper'),
          no('cry', 'Cry until he gives in', 'She laughs at him and leaves.'),
        ],
      },
      {
        name: 'Sir Peter Teazle',
        objective: [
          yes('authority', 'Assert a husband’s authority and stop the spending', 'He asks, “So a husband is to have no influence, no authority?”'),
          yes('fond', 'Win some sign that she cares for him', 'Alone after, he admits she never looks so well as when she’s doing all she can to plague him.'),
          no('quiet', 'Have a quiet morning', 'He opens the quarrel himself: “I’ll not bear it!”'),
        ],
        obstacle: [
          yes('fond', 'He’s fond of her, and she knows it'),
          no('overheard', 'The servants are listening', 'They’re alone the whole scene.'),
        ],
        tactic: [
          yes('remind', 'Remind her what she was: the tambour, the curate, the spinet'),
          yes('bluster', 'Bluster and swear'),
          no('gift', 'Buy peace with a present', 'He won’t pay for flowers in winter, let alone more.'),
        ],
      },
    ],
  },
  {
    id: 'richard3-1-2', play: 'Richard III', by: 'William Shakespeare', year: 1593, where: 'Act One, Scene Two, a street in London', language: 'verse', size: 'long', genre: 'tragedy', difficulty: 3,
    summary: 'Lady Anne follows the body of King Henry the Sixth, her father-in-law, toward burial at Chertsey, cursing the man who killed him and her husband. Richard, who did it, stops the bearers and woos her over the coffin; by the end she has taken his ring.',
    circumstances: [
      yes('bier', 'A London street, Anne following King Henry’s body to Chertsey with its bearers and guards'),
      no('throne', 'The palace, after Richard’s coronation', 'Richard isn’t king yet; that’s the fourth act.'),
      no('battle', 'The field at Tewkesbury', 'Tewkesbury is behind them: her husband died there, and Henry is on his way to burial.'),
    ],
    relationship: [
      yes('enemy', 'Widow and murderer: he killed her husband and her husband’s father'),
      no('kin', 'Brother and sister', 'She’s the widow of Henry’s son; Richard is of the rival house of York.'),
      no('allies', 'Old allies in mourning', 'She curses him as the killer.'),
    ],
    roles: [
      {
        name: 'Lady Anne',
        objective: [
          yes('drive', 'Drive him off and bury her dead in peace', 'She calls him a devil and tells him to be gone.'),
          yes('own', 'Make him own what he’s done', 'She presses him until he grants that he killed the king.'),
          no('marry', 'Marry him', 'She opens by cursing any wife he ever takes; the ring is where she ends.'),
        ],
        obstacle: [
          yes('him', 'He won’t be cursed off: he answers every curse with praise and every charge with an excuse'),
          no('alone', 'She’s alone, with no one to call', 'The bearers and the guards are with her.'),
        ],
        tactic: [
          yes('curse', 'Curse him, and call on heaven and earth to strike him dead'),
          yes('scorn', 'Meet his wit with scorn, line for line'),
          no('flatter', 'Flatter him so she can get away', 'She spits at him.'),
        ],
      },
      {
        name: 'Richard',
        objective: [
          yes('win', 'Win her, here, over the body', 'He means to marry Warwick’s youngest daughter, and she goes wearing his ring.'),
          yes('prove', 'Prove to himself he can do the impossible', 'Alone after, he gloats that he won her with nothing on his side but the devil and dissembling looks.'),
          no('repent', 'Ask her pardon and mean it', 'He tells us after that he’ll have her, but won’t keep her long.'),
        ],
        obstacle: [
          yes('dead', 'The body between them, and her certainty that he killed them both'),
          no('clarence', 'Clarence has forbidden it', 'Clarence is in the Tower and knows nothing of it.'),
        ],
        tactic: [
          yes('beauty', 'Blame her beauty for the murders', 'He tells her, “Your beauty was the cause of that effect.”'),
          yes('sword', 'Hand her his sword and bare his breast: kill him or forgive him'),
          no('threat', 'Threaten her', 'He offers her his life to take, and she lets the sword fall.'),
        ],
      },
    ],
  },
  {
    id: 'hamlet-3-1', play: 'Hamlet', by: 'William Shakespeare', year: 1600, where: 'Act Three, Scene One, a room in the castle', language: 'verse', size: 'short', genre: 'tragedy', difficulty: 3,
    summary: 'Polonius sets his daughter in Hamlet’s way with a book of devotions and hides with the King to watch. Ophelia tries to give back Hamlet’s gifts; he tells her he loved her once, then that he didn’t, and orders her to a nunnery, leaving her to mourn the noble mind she thinks is overthrown.',
    circumstances: [
      yes('watched', 'A room in the castle at Elsinore, the King and her father hidden to watch'),
      no('private', 'A meeting she arranged herself', 'Her father and the King set it up, and they’re listening.'),
      no('play', 'The night of the play, before the court', 'The play is to come that night; this is earlier, in private.'),
    ],
    relationship: [
      yes('former', 'Lovers, or nearly: she has refused his letters and his visits on her father’s orders'),
      no('engaged', 'An engaged couple', 'They’ve promised each other nothing; her father forbade the courtship.'),
      no('strangers', 'Strangers', 'He has given her letters and gifts, which she brings back.'),
    ],
    roles: [
      {
        name: 'Ophelia',
        objective: [
          yes('return', 'Give back his gifts, as she’s been set to, and end it cleanly', 'She has brought his remembrances to return.'),
          yes('reach', 'Reach him: find the man who courted her', 'She asks how he’s been these many days, and prays heaven to help him.'),
          no('trap', 'Trap him into confessing his plans', 'She was told to be seen reading; it’s her father and the King who are fishing.'),
        ],
        obstacle: [
          yes('watchers', 'Her father and the King listening, and a Hamlet she can’t read'),
          no('queen', 'The Queen is in the room', 'Gertrude leaves before they meet.'),
        ],
        tactic: [
          yes('formal', 'Keep it formal and polite: a lady returning gifts'),
          yes('lie', 'Lie for her father when Hamlet asks where he is', 'She answers, “At home, my lord.”'),
          no('rage', 'Rage at him for his cruelty', 'She prays for him instead.'),
        ],
      },
      {
        name: 'Hamlet',
        objective: [
          yes('test', 'Find out whether she’s honest with him', 'He asks, “Are you honest?” and then, “Where’s your father?”'),
          yes('free', 'Cut her loose and send her away from all of it', 'He asks why she would be a breeder of sinners, and tells her to get to a nunnery.'),
          no('woo', 'Win her back', 'He tells her he loved her not.'),
        ],
        obstacle: [
          yes('trust', 'He can’t trust her or anyone at court, and she has been sent'),
          no('ghost', 'The Ghost appears and interrupts', 'The Ghost comes later, in the Queen’s closet.'),
        ],
        tactic: [
          yes('wound', 'Wound her: deny he ever loved her'),
          yes('mad', 'Play mad, and let any listener hear it', 'After the Ghost, he warned his friends he might put an antic disposition on.'),
          no('tender', 'Take the gifts back gently', 'He says he never gave her anything.'),
        ],
      },
    ],
  },
  {
    id: 'othello-4-3', play: 'Othello', by: 'William Shakespeare', year: 1604, where: 'Act Four, Scene Three, the castle in Cyprus', language: 'verse', size: 'short', genre: 'tragedy', difficulty: 2,
    summary: 'After the supper for Lodovico, Othello orders Desdemona to bed and to dismiss Emilia. While Emilia helps her undress, Desdemona sings the willow song her mother’s maid Barbary died singing, and asks whether there are women who would deceive their husbands.',
    circumstances: [
      yes('bed', 'Night in the castle in Cyprus, hours after Othello called her a whore; she has been ordered to bed, her wedding sheets on it'),
      no('venice', 'Venice, before the voyage', 'They’re in Cyprus; Venice is the first act.'),
      no('morning', 'Morning, the household waking', 'It’s night, and she’s getting ready for bed.'),
    ],
    relationship: [
      yes('mistress', 'A lady and her waiting-woman, who is Iago’s wife'),
      no('sisters', 'Sisters', 'Emilia is her attendant, married to Iago.'),
      no('strangers', 'Near strangers', 'Emilia came with her from Venice and has defended her to Othello that day.'),
    ],
    roles: [
      {
        name: 'Desdemona',
        objective: [
          yes('obey', 'Do as her husband bids, and be ready for him', 'She sends Emilia away because he wants it, and she won’t displease him now.'),
          yes('understand', 'Understand what she’s accused of, and whether such women exist', 'She asks Emilia, “Wouldst thou do such a deed for all the world?”'),
          no('leave', 'Plan to leave him', 'She says her love so approves him that even his frowns have grace in them.'),
        ],
        obstacle: [
          yes('dread', 'A dread she can’t name: the song won’t leave her, and she talks of shrouds'),
          no('proof', 'Othello has shown her his proof', 'He has shown her nothing; she doesn’t know what he thinks he’s seen.'),
        ],
        tactic: [
          yes('song', 'Sing, to keep the fear at arm’s length'),
          yes('talk', 'Make small talk: Lodovico is a proper man'),
          no('accuse', 'Blame Othello aloud', 'When Emilia wishes she had never seen him, Desdemona says she wouldn’t wish it.'),
        ],
      },
      {
        name: 'Emilia',
        objective: [
          yes('comfort', 'Comfort her and get her to bed'),
          yes('wake', 'Make her see husbands as they are', 'She argues that husbands who stray teach their wives to.'),
          no('report', 'Find out what to report to Iago', 'She doesn’t know his plot; she argues for wives against husbands.'),
        ],
        obstacle: [
          yes('innocence', 'Desdemona’s innocence: she can’t believe any woman would do it'),
          no('listening', 'Othello is listening', 'He has gone out walking with Lodovico.'),
        ],
        tactic: [
          yes('joke', 'Joke: for the whole world, who wouldn’t?'),
          yes('argue', 'Argue it out: wives have sense like their husbands'),
          no('silent', 'Keep her opinions to herself', 'She says her piece at length.'),
        ],
      },
    ],
  },
  {
    id: 'measure-2-4', play: 'Measure for Measure', by: 'William Shakespeare', year: 1604, where: 'Act Two, Scene Four, Angelo’s house in Vienna', language: 'verse', size: 'long', genre: 'drama', difficulty: 3,
    summary: 'Isabella comes back, as Angelo told her to, for his answer on her brother, sentenced to die for getting Juliet with child. Angelo, who can’t keep his mind on his prayers, offers Claudio’s life for her body; she threatens to expose him, he asks who would believe her, and he gives her until tomorrow to answer.',
    circumstances: [
      yes('house', 'Angelo’s house the day after her first plea, as he appointed, with Claudio sentenced to die'),
      no('prison', 'The prison, with Claudio', 'That’s the third act; here she’s alone with Angelo.'),
      no('convent', 'The convent, before she hears of her brother', 'That’s the first act; she has left it to plead for him.'),
    ],
    relationship: [
      yes('judge', 'Judge and petitioner: he holds her brother’s life, and she’s a novice who has come to ask for it'),
      no('lovers', 'Secret lovers', 'He met her for the first time the day before.'),
      no('officers', 'Fellow officers of the Duke', 'She’s a novice of Saint Clare; he’s the Duke’s deputy.'),
    ],
    roles: [
      {
        name: 'Isabella',
        objective: [
          yes('save', 'Save her brother’s life', 'It’s what she came for.'),
          yes('soul', 'Keep her chastity and her soul, whatever it costs Claudio', 'Alone at the end, she says, “More than our brother is our chastity.”'),
          no('expose', 'Trap Angelo and expose him', 'She threatens it only after he’s spoken, and he points out no one would believe her.'),
        ],
        obstacle: [
          yes('power', 'His power: he has the law and the reputation, and no one would believe her'),
          no('duke', 'The Duke is watching', 'The Duke is elsewhere in disguise and isn’t in this scene.'),
        ],
        tactic: [
          yes('argue', 'Argue mercy and law with him, point by point'),
          yes('plain', 'Refuse to understand until he speaks plainly', 'She asks him to speak the former language, and he says, “Plainly conceive, I love you.”'),
          no('bargain', 'Bargain for better terms', 'She would wear the marks of keen whips as rubies first.'),
        ],
      },
      {
        name: 'Angelo',
        objective: [
          yes('have', 'Have her, with Claudio’s life as the price'),
          yes('deniable', 'Have her without ever saying it, so it can be denied', 'He puts it first as a question in argument, and says it plainly only when she won’t understand.'),
          no('pardon', 'Pardon Claudio freely', 'He says Claudio must die unless she yields.'),
        ],
        obstacle: [
          yes('virtue', 'Her virtue, and his own picture of himself as a man beyond temptation'),
          no('law', 'The law won’t let him pardon', 'He is the law here, and it’s his to bend.'),
        ],
        tactic: [
          yes('hypothetical', 'Put it as a hypothetical, to test her'),
          yes('threaten', 'Threaten Claudio with a lingering death'),
          no('beg', 'Plead on his knees', 'He commands, and gives her until tomorrow to answer.'),
        ],
      },
    ],
  },
];
