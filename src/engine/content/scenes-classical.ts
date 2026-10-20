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
      no('screen', 'Joseph Surface’s library, behind the screen', 'The screen scene is the fourth act; this one is at home with Sir Peter.'),
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
          yes('win', 'Win her, here, over the body', 'He means to marry Warwick’s youngest daughter, Anne herself, and she goes wearing his ring.'),
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
  // From the limitations pass of 2026-10-11: eleven more, so a student meets fewer scenes again, each checked against
  // its play's text as the rest were (shakespeare.mit.edu; Project Gutenberg for Marlowe, Webster, Congreve and
  // Goldsmith). Lines quoted are the plays' own; the rest is paraphrase.
  {
    id: 'hamlet-3-4', play: 'Hamlet', by: 'William Shakespeare', year: 1600, where: 'Act Three, Scene Four, the Queen’s closet', language: 'verse', size: 'long', genre: 'tragedy', difficulty: 3,
    summary: 'Sent for by his mother after the play, Hamlet comes to her closet. He kills Polonius through the arras, sets the pictures of his father and his uncle side by side, and wrings her heart until the Ghost appears to him, and not to her. She promises to keep what he has said.',
    circumstances: [
      yes('closet', 'The Queen’s private room at night, straight after the play, Polonius hidden behind the arras to listen', 'Polonius tells her to be round with him, and hides.'),
      no('court', 'The court in full session, the King on his throne', 'They’re alone but for Polonius, and the King is at prayer elsewhere.'),
      no('grave', 'The churchyard, at Ophelia’s grave', 'That’s the fifth act; Ophelia is alive here.'),
    ],
    relationship: [
      yes('mother-son', 'Mother and son: she married his father’s brother within a month of the funeral', 'He tells her she’s the Queen, her husband’s brother’s wife, and, would it weren’t so, his mother.'),
      no('lovers', 'Lovers quarrelling', 'She is his mother; his love is Ophelia.'),
      no('strangers', 'A queen and a stranger at court', 'He is her son and Denmark’s prince.'),
    ],
    roles: [
      {
        name: 'Hamlet',
        objective: [
          yes('glass', 'Make her see what she has done', '“You go not till I set you up a glass / Where you may see the inmost part of you.”'),
          yes('bed', 'Part her from Claudius: keep her from his bed', 'He begs her not to go to his uncle’s bed, and to assume a virtue if she has it not.'),
          no('kill', 'Kill his mother', 'He resolves to speak daggers to her but use none, as the Ghost bade him leave her to heaven.'),
        ],
        obstacle: [
          yes('rage', 'His own fury, which runs past what he meant to say until the Ghost comes to whet his blunted purpose'),
          yes('denial', 'She doesn’t know what he means', 'She asks what she has done, that he dares wag his tongue so rudely against her.'),
          no('guards', 'The King’s guards break in', 'Nobody comes; Polonius is already dead behind the arras.'),
        ],
        tactic: [
          yes('pictures', 'Set the two pictures side by side and make her look', 'He shows her the counterfeit presentment of two brothers.'),
          yes('wring', 'Wring her heart: hold her down until she looks inward', 'He sits her down and won’t let her go.'),
          no('gentle', 'Speak gently from the start', 'She cries that his words like daggers enter in her ears.'),
        ],
      },
      {
        name: 'Gertrude',
        objective: [
          yes('rebuke', 'Rebuke him for the play, as Polonius bade her', '“Hamlet, thou hast thy father much offended.”'),
          yes('calm', 'Calm him, and get through to him', 'She calls him gentle son and asks him what he looks at.'),
          no('confess', 'Confess she helped murder the old King', 'She doesn’t know of the murder: “As kill a king!”'),
        ],
        obstacle: [
          yes('cannot-see', 'She can’t see the Ghost, and takes him for mad'),
          yes('spots', 'What he makes her see in herself: black and grained spots in her soul'),
          no('poison', 'She has drunk the poisoned cup', 'She drinks the poisoned cup only in the last scene.'),
        ],
        tactic: [
          yes('command', 'Command him, as his mother and his queen', '“Come, come, you answer with an idle tongue.”'),
          yes('cry-help', 'Cry out for help when she thinks he means to murder her'),
          no('send-king', 'Send for the King at once', 'She promises she has no life to breathe what he has said to her.'),
        ],
      },
    ],
  },
  {
    id: 'caesar-4-3', play: 'Julius Caesar', by: 'William Shakespeare', year: 1599, where: 'Act Four, Scene Three, Brutus’s tent near Sardis', language: 'verse', size: 'long', genre: 'tragedy', difficulty: 3,
    summary: 'In Brutus’s tent before Philippi, Cassius complains that Brutus condemned a man he had written for; Brutus accuses him of an itching palm and of denying him gold to pay his legions. Their quarrel runs until Cassius bares his breast and offers his dagger; reconciled, Brutus tells him Portia is dead.',
    circumstances: [
      yes('tent', 'Brutus’s tent at the camp near Sardis, the two armies outside, their officers sent off so the generals can quarrel unheard', 'Brutus bids them not wrangle before the armies, and they go in.'),
      no('capitol', 'The Capitol on the Ides of March', 'Caesar is dead; this is the war that came after.'),
      no('battle', 'The field at Philippi, mid-battle', 'The battle is to come; they plan the march at the end of the scene.'),
    ],
    relationship: [
      yes('comrades', 'Brothers-in-arms, the two who led the conspiracy, now commanding the armies together', 'Cassius calls him most noble brother, and tells him he loves him not.'),
      no('enemies', 'Open enemies who mean to fight', 'They’re reconciled within the scene and drink together.'),
      no('master', 'A general and his officer', 'They’re equals in command; Cassius says he’s a soldier, older in practice.'),
    ],
    roles: [
      {
        name: 'Brutus',
        objective: [
          yes('honour', 'Hold Cassius to the honor they killed Caesar for', '“Did not great Julius bleed for justice’ sake?”'),
          yes('gold', 'Get the gold he asked for to pay his legions', 'He says he did send to Cassius for gold, which Cassius denied him.'),
          no('break', 'Break with Cassius and fight alone', 'He takes his hand, and they plan the march on Philippi together.'),
        ],
        obstacle: [
          yes('portia', 'Portia is dead, and he carries it unsaid through the quarrel', 'He tells Cassius after: “No man bears sorrow better. Portia is dead.”'),
          yes('temper', 'Cassius’s temper, against his own cold pride'),
          no('mutiny', 'His legions have mutinied', 'The legions haven’t mutinied; the quarrel is over bribes and money.'),
        ],
        tactic: [
          yes('scorn', 'Stand cold against his threats', 'He tells Cassius there’s no terror in them: he’s armed so strong in honesty they pass him by.'),
          yes('shame', 'Shame him with the cause they fought for'),
          no('draw', 'Draw his sword on him', 'Nobody draws; it’s Cassius who offers his own dagger.'),
        ],
      },
      {
        name: 'Cassius',
        objective: [
          yes('wronged', 'Have Brutus own that he has wronged him', '“That you have wrong’d me doth appear in this.”'),
          yes('loved', 'Win back Brutus’s love', 'He says a friend should bear his friend’s infirmities.'),
          no('command', 'Take sole command of the armies', 'He defers to Brutus’s plan for Philippi, against his own judgement.'),
        ],
        obstacle: [
          yes('honesty', 'Brutus is armed so strong in honesty that his threats pass by him'),
          no('caesar', 'Caesar’s ghost is in the tent', 'The ghost comes to Brutus alone, after Cassius has gone.'),
        ],
        tactic: [
          yes('threaten', 'Threaten', '“I may do that I shall be sorry for.”'),
          yes('dagger', 'Bare his breast and offer his dagger: strike, as you did at Caesar'),
          no('bribe', 'Offer Brutus money to drop it', 'It’s Brutus who accuses him of selling offices for gold.'),
        ],
      },
    ],
  },
  {
    id: 'caesar-2-1', play: 'Julius Caesar', by: 'William Shakespeare', year: 1599, where: 'Act Two, Scene One, Brutus’s orchard', language: 'verse', size: 'medium', genre: 'tragedy', difficulty: 2,
    summary: 'Before dawn on the Ides of March, the conspirators just gone, Portia finds Brutus sleepless in his orchard and asks what troubles him. She kneels, reminds him she’s Cato’s daughter, and shows the wound she gave herself in the thigh to prove her constancy; he promises to tell her all, and a knock calls him away.',
    circumstances: [
      yes('orchard', 'Brutus’s orchard before dawn on the Ides, the conspirators just gone into the night', 'She says he stole from their bed and walked about, musing and sighing.'),
      no('capitol', 'The Capitol, Caesar on his way', 'Caesar goes to the Capitol later that morning.'),
      no('tent', 'His tent at Sardis', 'That’s the war after; Portia is dead by then.'),
    ],
    relationship: [
      yes('marriage', 'Husband and wife: she Cato’s daughter, a woman well reputed', 'She says she’s a woman Lord Brutus took to wife.'),
      no('suitor', 'A suitor and the woman he courts', 'They have long been married.'),
      no('conspirators', 'Fellow conspirators', 'She doesn’t know of the plot; that’s what she asks to be told.'),
    ],
    roles: [
      {
        name: 'Portia',
        objective: [
          yes('secret', 'Learn what is troubling him', 'She asks him to tell her why he’s heavy, and who came to him tonight.'),
          yes('wife', 'Be his wife and not his harlot: share his secrets', '“Dwell I but in the suburbs / Of your good pleasure?”'),
          no('stop', 'Stop the murder', 'She doesn’t know what is planned.'),
        ],
        obstacle: [
          yes('silent', 'He won’t tell her, and pleads that he’s unwell'),
          no('caesar', 'Caesar is listening', 'They’re alone; only the knocking interrupts.'),
        ],
        tactic: [
          yes('kneel', 'Kneel to him, by her once-commended beauty and their vows'),
          yes('wound', 'Show him the wound she gave herself, to prove she can keep a secret'),
          no('threaten', 'Threaten to leave him', 'She asks as his wife; she threatens nothing.'),
        ],
      },
      {
        name: 'Brutus',
        objective: [
          yes('protect', 'Keep her out of it, and send her back to bed', 'He tells her he isn’t well in health, and that’s all.'),
          yes('worthy', 'Be worthy of her', '“O ye gods, / Render me worthy of this noble wife!”'),
          no('recruit', 'Recruit her to the plot', 'He promises to tell her, but sends her in as the knocking comes.'),
        ],
        obstacle: [
          yes('knock', 'The knocking: Ligarius has come to join them'),
          yes('plot', 'The plot itself, which isn’t his alone to tell'),
          no('jealousy', 'He suspects her of another man', 'He never suspects her, and there’s no other man in the scene.'),
        ],
        tactic: [
          yes('ill', 'Plead ill health'),
          yes('raise', 'Raise her up and promise the secrets of his heart'),
          no('lie', 'Tell her the conspirators were merchants', 'He doesn’t say who they were; he promises to tell her all.'),
        ],
      },
    ],
  },
  {
    id: 'lear-4-7', play: 'King Lear', by: 'William Shakespeare', year: 1606, where: 'Act Four, Scene Seven, the French camp near Dover', language: 'verse', size: 'medium', genre: 'tragedy', difficulty: 2,
    summary: 'In the French camp near Dover, Lear, asleep in fresh garments after his madness, is woken with music and his daughter Cordelia’s kiss. He takes her for a soul in bliss, kneels to her, and asks her to forgive a foolish, fond old man; she says she has no cause.',
    circumstances: [
      yes('camp', 'A tent in the French camp near Dover, Lear asleep in a chair in fresh garments, music playing, the doctor at hand', 'The doctor has him woken with music.'),
      no('court', 'The court at the start of the play, the kingdom being divided', 'That’s where she was banished; this is after the storm.'),
      no('prison', 'A prison after the battle', 'The battle is still to be fought.'),
    ],
    relationship: [
      yes('father-daughter', 'Father and daughter, parted since he disowned her for saying nothing', 'He says she has some cause to hate him, and her sisters none.'),
      no('king-subject', 'A king and a subject who wronged him', 'She was wronged by him; she kneels for his blessing.'),
      no('strangers', 'A madman and a stranger', 'He comes to know her as his child Cordelia.'),
    ],
    roles: [
      {
        name: 'Cordelia',
        objective: [
          yes('restore', 'Restore him: let her kiss repair the harms her sisters did'),
          yes('known', 'Have him know her', '“Sir, do you know me?”'),
          no('reproach', 'Make him own how he wronged her', '“No cause, no cause.”'),
        ],
        obstacle: [
          yes('mind', 'His wandering mind: he thinks himself in the grave and her a spirit'),
          no('sisters', 'Her sisters are in the tent', 'Goneril and Regan are with their armies; they aren’t here.'),
        ],
        tactic: [
          yes('blessing', 'Kneel, and ask his blessing', 'She asks him to hold his hands in benediction over her.'),
          yes('soft', 'Speak softly, as to a child'),
          no('command', 'Order him to recover his wits', 'She asks; she never commands.'),
        ],
      },
      {
        name: 'Lear',
        objective: [
          yes('where', 'Find out where he is and whether he’s alive', '“Where have I been? Where am I? Fair daylight?”'),
          yes('forgive', 'Be forgiven', '“Pray you now, forget and forgive.”'),
          no('rule', 'Take back his kingdom', 'He asks only to be forgiven, and calls himself a very foolish fond old man.'),
        ],
        obstacle: [
          yes('mind', 'His doubt of his own mind', '“I fear I am not in my perfect mind.”'),
          yes('shame', 'His shame for what he did to her'),
          no('blind', 'He is blind', 'It’s Gloucester who is blinded; Lear sees her.'),
        ],
        tactic: [
          yes('kneel', 'Kneel to her'),
          yes('test', 'Test what is real', 'He tries the prick of a pin to know whether he’s awake.'),
          no('rage', 'Rage at her as he did at the start', 'He is gentle and ashamed.'),
        ],
      },
    ],
  },
  {
    id: 'asyoulike-3-2', play: 'As You Like It', by: 'William Shakespeare', year: 1599, where: 'Act Three, Scene Two, the Forest of Arden', language: 'verse', size: 'medium', genre: 'comedy', difficulty: 2,
    summary: 'In the Forest of Arden, Rosalind, disguised as the youth Ganymede, meets Orlando, who has been hanging verses to her on the trees. She tells him he has none of the marks of a lover, and offers to cure him of love if he will call her Rosalind and come every day to her cottage to woo her.',
    circumstances: [
      yes('forest', 'The Forest of Arden, his verses hung on the trees; she in a youth’s clothes, Celia with her as Aliena', 'She has just read his verses, and Celia has told her who wrote them.'),
      no('wrestling', 'The court, at the wrestling', 'That’s where they met, in the first act; both have fled to the forest since.'),
      no('wedding', 'The wedding at the end', 'The weddings come in the last scene, when she unmasks.'),
    ],
    relationship: [
      yes('disguised', 'In love since the wrestling; he doesn’t know the youth is her', 'He tells the youth that he’s the man so love-shaked.'),
      no('rivals', 'Rivals for the same woman', 'She is the woman he loves.'),
      no('strangers', 'Strangers with no feeling between them', 'Each loves the other; only he doesn’t know who he speaks to.'),
    ],
    roles: [
      {
        name: 'Rosalind',
        objective: [
          yes('test', 'Find out whether he truly loves her', 'She asks if he is the man who hangs odes on hawthorns.'),
          yes('keep', 'Keep him coming back to her', 'She makes him promise to come every day to her cottage.'),
          no('reveal', 'Tell him she’s Rosalind', 'She keeps the disguise to the last act.'),
        ],
        obstacle: [
          yes('disguise', 'She can only speak to him as a boy'),
          yes('heart', 'Her own heart: she’s as much in love as he is'),
          no('father', 'Her father forbids it', 'Her father is in the forest and knows nothing of this.'),
        ],
        tactic: [
          yes('mock', 'Mock him as no true lover', 'He has no lean cheek, no unkempt beard, his hose ungartered not at all.'),
          yes('cure', 'Offer the cure: woo her as Rosalind'),
          no('swoon', 'Swoon to win his pity', 'She swoons later, at the bloody napkin, and not to win him.'),
        ],
      },
      {
        name: 'Orlando',
        objective: [
          yes('prove', 'Prove he truly loves', 'He swears by the white hand of Rosalind that he’s that unfortunate he.'),
          yes('company', 'Keep the clever youth’s company in the forest'),
          no('cure', 'Be cured of love', 'He tells the youth he’d rather not be cured.'),
        ],
        obstacle: [
          yes('absent', 'Rosalind isn’t there, he thinks'),
          no('banished', 'He is under arrest', 'He fled to the forest; he isn’t held.'),
        ],
        tactic: [
          yes('swear', 'Swear to his love'),
          yes('play', 'Play along, and agree to woo the youth as Rosalind'),
          no('fight', 'Challenge the youth', 'He takes the mockery and agrees to the game.'),
        ],
      },
    ],
  },
  {
    id: 'dream-3-2', play: 'A Midsummer Night’s Dream', by: 'William Shakespeare', year: 1595, where: 'Act Three, Scene Two, the wood near Athens', language: 'verse', size: 'medium', genre: 'comedy', difficulty: 2,
    summary: 'In the wood at night both young men have been turned by Puck’s love-juice to woo Helena. Helena believes Hermia is in on a plot to mock her; Hermia believes Helena has stolen Lysander. The two old school friends quarrel, over love and then over their heights, until Helena hides behind the men.',
    circumstances: [
      yes('wood', 'The wood near Athens at night, the young men enchanted by a spell neither woman knows of', 'Lysander and Demetrius both swear love to Helena, who loved Demetrius in vain.'),
      no('court', 'Theseus’s court in Athens', 'That’s the first act; the four have fled to the wood since.'),
      no('wedding', 'The wedding night at the end', 'The wedding night is the fifth act, with the spells undone.'),
    ],
    relationship: [
      yes('friends', 'Friends since childhood, like a double cherry, now each sure the other has betrayed her', 'Helena reminds her of their schooldays and the sampler they worked on one cushion.'),
      no('sisters', 'Sisters', 'They were schoolfellows, not sisters.'),
      no('rivals-always', 'Rivals who never liked each other', 'Helena says they grew together like a double cherry.'),
    ],
    roles: [
      {
        name: 'Helena',
        objective: [
          yes('mock', 'Make them stop mocking her', 'She is sure all three have joined in a scheme to scorn her.'),
          yes('escape', 'Get away, back to Athens', 'She begs them to let her go back with her folly to Athens.'),
          no('lysander', 'Win Lysander', 'She loves Demetrius, and takes Lysander’s vows for scorn.'),
        ],
        obstacle: [
          yes('belief', 'She can’t believe she’s loved'),
          yes('nails', 'Hermia’s fury, and Hermia’s nails', 'Helena was never curst, she says; she has no gift at all in shrewishness.'),
          no('spell', 'She knows of the spell and fears it', 'Neither woman knows of the love-juice.'),
        ],
        tactic: [
          yes('schooldays', 'Remind Hermia of their childhood together'),
          yes('hide', 'Hide behind the men'),
          no('fight', 'Strike Hermia first', 'She runs; it’s Hermia who wants to fight.'),
        ],
      },
      {
        name: 'Hermia',
        objective: [
          yes('lysander', 'Get Lysander back', 'She can’t believe he has left her.'),
          yes('truth', 'Find out what Helena has done', '“You juggler! You canker-blossom! / You thief of love!”'),
          no('demetrius', 'Win Demetrius', 'She has never loved Demetrius; she ran away to marry Lysander.'),
        ],
        obstacle: [
          yes('spell', 'The spell, which she knows nothing of'),
          yes('height', 'She takes Helena’s words as mocking her for being short'),
          no('father', 'Her father is in the wood', 'Egeus is in Athens; he comes with Theseus in the morning.'),
        ],
        tactic: [
          yes('attack', 'Go for her', 'She threatens that her nails can reach unto Helena’s eyes.'),
          yes('demand', 'Demand an answer'),
          no('plead', 'Plead softly with Helena', 'She is furious, not pleading.'),
        ],
      },
    ],
  },
  {
    id: 'twelfth-2-4', play: 'Twelfth Night', by: 'William Shakespeare', year: 1601, where: 'Act Two, Scene Four, Orsino’s palace', language: 'verse', size: 'medium', genre: 'comedy', difficulty: 2,
    summary: 'After Feste’s song, Orsino sends Cesario back to plead with Olivia, and they argue whether a woman can love as deeply as a man. Viola tells him of her father’s daughter, who never told her love but sat like Patience on a monument, smiling at grief.',
    circumstances: [
      yes('palace', 'Orsino’s palace, the old song just sung, the others sent away', 'Orsino sends them off and keeps Cesario by him.'),
      no('olivia', 'Olivia’s house', 'Viola is sent there at the end of the scene.'),
      no('shore', 'The shore after the wreck', 'The shore is the first act, before she disguised herself.'),
    ],
    relationship: [
      yes('master-page', 'Master and page: she loves him, and he doesn’t know she’s a woman', 'She asks what if a lady loved him as he loves Olivia.'),
      no('lovers', 'Declared lovers', 'Nothing is declared until the last act.'),
      no('rivals', 'Rivals for Olivia', 'She woos Olivia for him, not for herself.'),
    ],
    roles: [
      {
        name: 'Viola',
        objective: [
          yes('tell', 'Tell him she loves him without telling it', 'She speaks of her father’s daughter who loved a man as she might love him, were she a woman.'),
          yes('argue', 'Make him see a woman can love as much as a man'),
          no('reveal', 'Tell him she’s a woman', 'She keeps the disguise to the last act.'),
        ],
        obstacle: [
          yes('disguise', 'Her disguise, and his love for Olivia'),
          no('olivia-here', 'Olivia is listening', 'Olivia is at her own house.'),
        ],
        tactic: [
          yes('story', 'Tell it as a sister’s story', '“She never told her love.”'),
          yes('answer', 'Answer his boast point for point'),
          no('refuse', 'Refuse to go to Olivia again', 'She goes: “Sir, shall I to this lady?”'),
        ],
      },
      {
        name: 'Orsino',
        objective: [
          yes('olivia', 'Send Cesario back to win Olivia', 'He gives Cesario a jewel for her and bids him say his love can give no place.'),
          yes('greatest', 'Have his own love called the greatest', 'He says no woman’s heart can hold so much.'),
          no('page', 'Win his page', 'He doesn’t know she’s a woman.'),
        ],
        obstacle: [
          yes('refused', 'Olivia has refused him'),
          yes('mood', 'His own changeable mood, which the song feeds'),
          no('war', 'A war calls him away', 'There’s no war in the play.'),
        ],
        tactic: [
          yes('boast', 'Boast the size of his passion'),
          yes('confide', 'Confide in the boy, as a man of the world', 'He tells Cesario to take a wife younger than himself.'),
          no('order', 'Order Cesario to be silent', 'He listens to the story, and asks if the sister died of her love.'),
        ],
      },
    ],
  },
  {
    id: 'faustus-3', play: 'Doctor Faustus', by: 'Christopher Marlowe', year: 1592, where: 'Scene Three, a grove outside Wittenberg, after the conjuring', language: 'verse', size: 'medium', genre: 'tragedy', difficulty: 3,
    summary: 'Faustus has conjured, and sends the devil away to come back as a Franciscan friar. Mephistopheles tells him he came not at his command but because he heard him rack the name of God; that he serves Lucifer; and that hell is wherever he is. Faustus laughs at it and sends him to offer Lucifer his soul for twenty-four years of service.',
    circumstances: [
      yes('conjured', 'Night in a grove outside Wittenberg, the circle drawn, the devil come at his spells', 'Faustus has just spoken the conjuration in Latin.'),
      no('study', 'His study, the morning he first turns to magic', 'That’s the first scene; by now he has conjured.'),
      no('bond', 'The night the bond is signed in his blood', 'He signs the bond in his blood later; here he only sends the offer.'),
    ],
    relationship: [
      yes('summoner', 'A scholar and the spirit he thinks he has commanded', 'Faustus believes his spells have power; Mephistopheles corrects him.'),
      no('master', 'A master and his bound servant', 'Mephistopheles says he serves Lucifer and may not follow Faustus without leave.'),
      no('old-friends', 'Old friends', 'They meet here for the first time.'),
    ],
    roles: [
      {
        name: 'Faustus',
        objective: [
          yes('command', 'Have Mephistopheles serve him and do whatever he commands'),
          yes('bargain', 'Sell his soul for twenty-four years of power', 'He sends him to Lucifer with the offer.'),
          no('repent', 'Repent', 'He scorns the warning, and bids him learn of Faustus manly fortitude.'),
        ],
        obstacle: [
          yes('leave', 'Mephistopheles serves Lucifer, and can do nothing without his leave'),
          yes('warning', 'The devil’s own warning of what hell is'),
          no('angels', 'The Good and Evil Angels argue with him here', 'They come in other scenes.'),
        ],
        tactic: [
          yes('bravado', 'Laugh the warning off', 'He says this word damnation terrifies not him.'),
          yes('question', 'Question him like a scholar: who is Lucifer, how came he to fall'),
          no('pray', 'Pray', 'His conjuring has just bidden the Trinity farewell, in its Latin.'),
        ],
      },
      {
        name: 'Mephistopheles',
        objective: [
          yes('soul', 'Win his soul for Lucifer', 'He came because he heard Faustus abjure the scriptures, in hope to get his glorious soul.'),
          yes('grief', 'Speak the grief of having lost heaven', '“Why this is hell, nor am I out of it.”'),
          no('save', 'Save Faustus from damnation', 'He serves Lucifer, and carries Faustus’s offer to him.'),
        ],
        obstacle: [
          yes('leave', 'He can do nothing without Lucifer’s leave'),
          yes('own-pain', 'His own torment, which the questions make him speak'),
          no('circle', 'The circle holds him prisoner', 'He says he came of his own accord, not by the spells.'),
        ],
        tactic: [
          yes('plain', 'Tell the plain truth of hell and let Faustus refuse to hear it'),
          yes('plead', 'Beg him to leave these frivolous demands, which strike a terror to his soul'),
          no('fable', 'Say hell is a fable', 'It’s Faustus who calls hell a fable, later; here Mephistopheles says he’s in it.'),
        ],
      },
    ],
  },
  {
    id: 'malfi-1', play: 'The Duchess of Malfi', by: 'John Webster', year: 1613, where: 'Act One, the wooing in the Duchess’s chamber', language: 'verse', size: 'long', genre: 'tragedy', difficulty: 3,
    summary: 'Her brothers have just forbidden the widowed Duchess to marry again. She calls her steward Antonio in to write her will, turns the talk to marriage, puts her wedding ring on his finger, and woos him, since the great must; with her maid Cariola come out from behind the arras as witness, they marry in secret.',
    circumstances: [
      yes('chamber', 'The Duchess’s chamber at Amalfi, her brothers just gone, Cariola hidden behind the arras as a witness', 'She tells Cariola to hide; Cariola comes out at the end.'),
      no('court', 'Before the whole court', 'She sends everyone away; the marriage is secret.'),
      no('prison', 'Her prison, near her death', 'Her imprisonment comes in the fourth act, years later.'),
    ],
    relationship: [
      yes('mistress-steward', 'A widowed duchess and her steward, far below her, who loves her and hasn’t said so', 'He says that ambition, madam, is a great man’s madness.'),
      no('lovers', 'Lovers already secretly married', 'They marry in this scene.'),
      no('brother', 'Brother and sister', 'Ferdinand and the Cardinal are her brothers; Antonio is her steward.'),
    ],
    roles: [
      {
        name: 'The Duchess',
        objective: [
          yes('marry', 'Marry Antonio, in secret'),
          yes('speak', 'Make him understand her, since a great woman must woo first', 'She says the misery of us that are born great: we’re forced to woo.'),
          no('will', 'Only make her will', 'The will is her pretext; she turns it to marriage.'),
        ],
        obstacle: [
          yes('rank', 'His rank, which stops his mouth'),
          yes('brothers', 'Her brothers, who have just forbidden it'),
          no('suitor', 'A suitor waits outside', 'No one waits; she has sent them away.'),
        ],
        tactic: [
          yes('ring', 'Put her ring on his finger'),
          yes('will', 'Dictate her will and lead it to a husband'),
          no('command', 'Order him to marry her', 'She woos; she doesn’t command.'),
        ],
      },
      {
        name: 'Antonio',
        objective: [
          yes('place', 'Keep his place, and not overreach', 'He fears the ambition that would make him look so high.'),
          yes('accept', 'Accept her, once he believes her'),
          no('refuse', 'Refuse her', 'He marries her by the end of the scene.'),
        ],
        obstacle: [
          yes('brothers', 'Her brothers, and what they’d do'),
          yes('disbelief', 'He can’t believe she means it'),
          no('wife', 'He has a wife already', 'He is unmarried.'),
        ],
        tactic: [
          yes('modest', 'Speak modestly of marriage, as a steward should'),
          yes('kneel', 'Kneel, then rise to her'),
          no('boast', 'Boast of his own merit', 'He speaks of his unworthiness.'),
        ],
      },
    ],
  },
  {
    id: 'wayoftheworld-4', play: 'The Way of the World', by: 'William Congreve', year: 1700, where: 'Act Four, the proviso scene', language: 'verse', size: 'medium', genre: 'comedy', difficulty: 3,
    summary: 'At Lady Wishfort’s house Mirabell finds Millamant at her poetry, and the two set the terms of their marriage: she will keep her liberty, lie in bed of a morning, be called no names of fondness, and come to be a wife only by degrees; he that she keep no confidante, wear no masks and no tight stays.',
    circumstances: [
      yes('house', 'Lady Wishfort’s house, Millamant just rid of a clumsy suitor, Mirabell come in on her lines of verse', 'She is repeating Suckling when he enters and caps the line.'),
      no('park', 'St James’s Park', 'The park scene is the second act; this one is at Lady Wishfort’s house.'),
      no('wedding', 'Their wedding', 'They set its terms here; it comes after the last act.'),
    ],
    relationship: [
      yes('lovers', 'Lovers on the point of marriage, each guarding a freedom', 'She says she won’t be called names of fondness after she is married.'),
      no('strangers', 'Strangers meeting', 'He has loved her through the play.'),
      no('married', 'Already married', 'They aren’t married yet: this is the bargain they strike before the wedding.'),
    ],
    roles: [
      {
        name: 'Millamant',
        objective: [
          yes('liberty', 'Keep her liberty in marriage', 'She will be solicited to the very last, and lie abed of a morning as long as she pleases.'),
          yes('accept', 'Accept him on her own terms'),
          no('refuse', 'Refuse him', 'She ends by giving him her hand.'),
        ],
        obstacle: [
          yes('self', 'Her fear of losing herself as a wife'),
          no('aunt', 'Lady Wishfort is listening', 'They’re alone until Mrs. Fainall comes.'),
        ],
        tactic: [
          yes('conditions', 'Set her conditions one by one, with mock gravity'),
          yes('tease', 'Tease him with her airs'),
          no('weep', 'Weep to move him', 'She bargains; she doesn’t weep.'),
        ],
      },
      {
        name: 'Mirabell',
        objective: [
          yes('win', 'Win her'),
          yes('terms', 'Set his own conditions in turn', 'He asks leave to offer conditions too.'),
          no('aunt', 'Win her aunt’s favor', 'That’s his plot elsewhere; here he speaks only to Millamant.'),
        ],
        obstacle: [
          yes('wit', 'Her wit, which won’t be held still'),
          no('rival', 'Her cousin, the country squire, is in the room', 'She has just sent him away.'),
        ],
        tactic: [
          yes('match', 'Match her article for article'),
          yes('accept', 'Grant her terms gracefully, and keep his own'),
          no('threaten', 'Threaten to leave', 'He never threatens; he bargains.'),
        ],
      },
    ],
  },
  {
    id: 'stoops-2', play: 'She Stoops to Conquer', by: 'Oliver Goldsmith', year: 1773, where: 'Act Two, the first meeting', language: 'verse', size: 'medium', genre: 'comedy', difficulty: 2,
    summary: 'Young Marlow, easy with barmaids and helpless with ladies of his own class, meets Kate Hardcastle, the woman his father means him to marry, in a house he takes for an inn. He can’t look at her or finish a sentence; she finishes them for him, and he bows himself out as soon as he can.',
    circumstances: [
      yes('house', 'Mr. Hardcastle’s house, which Marlow takes for an inn; Kate in her finery', 'Tony Lumpkin has told the travelers it’s an inn.'),
      no('alehouse', 'The Three Pigeons alehouse', 'The young men were sent astray at the alehouse, before they reached the house.'),
      no('barmaid', 'Kate dressed as the barmaid', 'She dresses as the barmaid only in the next act: that’s her stoop.'),
    ],
    relationship: [
      yes('suitor', 'The suitor her father chose, meeting her for the first time', 'Sir Charles Marlow has sent his son to court her.'),
      no('old-friends', 'Old friends', 'They have never met.'),
      no('servant', 'A guest and a servant', 'Here she’s a lady: that’s his trouble.'),
    ],
    roles: [
      {
        name: 'Kate Hardcastle',
        objective: [
          yes('see', 'Get the measure of the man she’s meant to marry'),
          yes('draw-out', 'Draw him out of his shyness'),
          no('reject', 'Send him away at once', 'She is amused, and wants to see more of him.'),
        ],
        obstacle: [
          yes('shy', 'His shyness with a lady: he won’t look at her face'),
          no('father', 'Her father forbids the match', 'Her father wants it.'),
        ],
        tactic: [
          yes('lead', 'Lead the talk, and finish his sentences for him'),
          yes('agree', 'Agree with everything he half says'),
          no('barmaid', 'Play the barmaid', 'She plays the barmaid only in the next act.'),
        ],
      },
      {
        name: 'Marlow',
        objective: [
          yes('escape', 'Get out of the interview'),
          yes('sentiment', 'Seem a man of grave sentiment'),
          no('woo', 'Woo her boldly', 'He is bold only with women of lower station.'),
        ],
        obstacle: [
          yes('lady', 'She is a lady, and he can’t look at one'),
          no('rival', 'Hastings is courting her', 'Hastings loves Constance Neville.'),
        ],
        tactic: [
          yes('sentiment', 'Hide in grave sentiments he can’t finish'),
          yes('bow', 'Bow himself out'),
          no('flirt', 'Flirt', 'He flirts only with the barmaid, later.'),
        ],
      },
    ],
  },
];
