/**
 * SLATE — Greek tragedy for scene study (from 2026-10-07): six two-person
 * scenes from public-domain translations, for The Greeks (DRAM 293b), a
 * second-year module on classical Greek texts in translation.
 *
 * Each scene was checked against the translation it names, on 2026-10-07:
 * Jebb's Sophocles on Perseus (which says it modernized the English of its
 * Antigone), Murray's
 * Euripides and Aeschylus on Project Gutenberg. `year` is the translation's,
 * since that is the text an actor works from. Line numbers in the ids are the
 * Greek ones. What each scene says about its play is the play's; which
 * readings it supports is SLATE's reading of the text, as in `coursework.ts`.
 *
 * Only the types come from `coursework.ts`: it imports this file, so a value
 * import back would be circular. The two helpers are local copies of its own.
 */

import type { Scene, Option } from './coursework';

const yes = (id: string, text: string, why?: string): Option => ({ id, text, supported: true, ...(why ? { why } : {}) });
const no = (id: string, text: string, why: string): Option => ({ id, text, supported: false, why });

export const GREEK_SCENES: readonly Scene[] = [
  {
    // Perseus, Antigone 441–525. The Chorus speaks once (471–472).
    id: 'antigone-441', play: 'Antigone', by: 'Sophocles, tr. R. C. Jebb', year: 1891, where: 'Before the palace, when the Guard brings her in', language: 'prose', size: 'medium', genre: 'tragedy', difficulty: 3, tradition: 'greek',
    summary: 'The Guard has caught Antigone giving her brother Polyneices burial a second time, against Creon’s edict, and brought her before the king. She admits it and sets the unwritten laws of the gods above his decree; Creon sends for Ismene as her accomplice and swears no woman will rule him while he lives.',
    circumstances: [
      yes('caught', 'Before the palace at Thebes; the Guard has just brought her in, caught at her brother’s body against the king’s edict', 'The Guard has told how they caught her pouring libations on the corpse.'),
      no('tomb', 'The rocky tomb Creon sends her to', 'That comes later in the play; here she has only just been brought in.'),
      no('alone', 'A private interview with no one else to hear', 'The Theban elders stand by and speak, and she says they’d side with her if fear didn’t hold their tongues.'),
    ],
    relationship: [
      yes('kin', 'Uncle and niece, now a king and the subject who broke his first law', 'Creon says she’ll pay whether she’s his sister’s child or nearer still.'),
      no('strangers', 'A king and a stranger he has never met', 'She’s his sister’s child, and he says so.'),
      no('allies', 'Allies who secretly agree about the burial', 'He calls the deed an outrage, and she says none of his maxims please her.'),
    ],
    roles: [
      {
        name: 'Antigone',
        objective: [
          yes('law', 'Stand by the gods’ unwritten laws and own the burial openly', 'She declares the deed and says it wasn’t Zeus who published his edict.'),
          yes('release', 'Meet the death she expects, as a release from her evils', 'She says dying before her time is a gain to one who lives surrounded by evils.'),
          no('mercy', 'Win Creon’s pardon', 'She asks him why he waits to kill her; she never asks for mercy.'),
        ],
        obstacle: [
          yes('power', 'Creon’s power, and his pride in a decree he can’t be seen to bend', 'He says he’s no man if this victory rests with her.'),
          no('ismene', 'Ismene is there, arguing against her', 'Ismene is in the house; Creon has her sent for during the scene.'),
        ],
        tactic: [
          yes('declare', 'Declare it plainly and answer every question without backing down', 'Her first words to him are that she declares it and makes no denial.'),
          yes('turn', 'Turn his charge of folly back on him', 'She tells him it may be a fool who accuses her of folly.'),
          no('deny', 'Deny it and blame the Guard', 'She admits the deed at once.'),
        ],
      },
      {
        name: 'Creon',
        objective: [
          yes('law', 'Make her confess and pay, so his edict stands', 'He asks if she admits or denies it, and says he wants nothing more than her death.'),
          yes('woman', 'Not be beaten by a woman', 'He says he’s no man if she wins this, and that no woman will rule him while he lives.'),
          no('spare', 'Find a way to spare his niece', 'He says she and her sister won’t escape a harsh doom, kin or not.'),
        ],
        obstacle: [
          yes('defiance', 'She won’t bend, and she glories in what she did', 'He calls her exulting in the deed a second outrage.'),
          no('elders', 'The elders have openly taken her side', 'The Chorus calls her the wild child of a wild father; she says they keep silent.'),
        ],
        tactic: [
          yes('question', 'Interrogate her: short questions, one charge at a time', 'He asks briefly if she knew of the edict, then sets one brother against the other.'),
          yes('lecture', 'Lecture her on how the hardest iron snaps', 'He says proud spirits fall, as tempered iron shatters and a small bit tames a horse.'),
          no('plead', 'Appeal to her as family', 'He sets kinship aside: kin or nearer, she won’t escape.'),
        ],
      },
    ],
  },
  {
    // Perseus, Oedipus Tyrannus 300–462. The Chorus speaks once (404–407).
    id: 'oedipus-300', play: 'Oedipus Tyrannus', by: 'Sophocles, tr. R. C. Jebb', year: 1887, where: 'Before the palace at Thebes, in the plague', language: 'prose', size: 'long', genre: 'tragedy', difficulty: 3, tradition: 'greek',
    summary: 'Thebes is dying of plague, and Apollo’s oracle says the slayers of Laius must be found and driven out. Oedipus has sent for the blind prophet Teiresias, who wishes he hadn’t come; pressed and then accused, he names Oedipus as the killer and leaves him with a riddle about his parents.',
    circumstances: [
      yes('plague', 'Thebes in plague; Oedipus has cursed Laius’ killer and sent for the prophet', 'He tells Teiresias that Phoebus named finding the slayers of Laius as the only cure.'),
      no('sphinx', 'The day Oedipus answers the Sphinx and comes to Thebes', 'That was years ago; Oedipus brings it up to mock the prophet who couldn’t answer it.'),
      no('jocasta', 'After Jocasta has told him how Laius died', 'That comes later; here he still wants help finding the killer.'),
    ],
    relationship: [
      yes('seer', 'The king and the city’s old prophet, who serves Apollo and owes Oedipus nothing', 'Teiresias says he lives as Loxias’ servant, not the king’s.'),
      no('enemies', 'Old enemies who have long plotted against each other', 'Oedipus opens by calling him the city’s protector and only savior; the suspicion comes in anger.'),
      no('creon', 'Creon’s hired man and the king he works against', 'Oedipus says so in his rage; Teiresias answers that he’s no client of Creon’s.'),
    ],
    roles: [
      {
        name: 'Oedipus',
        objective: [
          yes('city', 'Get the prophet to name Laius’ killer and save the city', 'He begs him, with all the suppliants, to save the state.'),
          yes('throne', 'Defend his throne against a plot he believes Creon has laid', 'He says Creon has crept on him by stealth and hired this trickster to oust him.'),
          no('silence', 'Send Teiresias away before he can speak', 'He presses him to speak, and orders him out only after the accusation.'),
        ],
        obstacle: [
          yes('refusal', 'Teiresias won’t speak, and when he does he names Oedipus', 'He refuses until anger draws it out of him, then calls Oedipus the land’s defiler.'),
          no('blind', 'Teiresias can’t know what happened because he can’t see', 'His blindness doesn’t bar his knowledge; he tells Oedipus that he’s the one who doesn’t see.'),
        ],
        tactic: [
          yes('entreat', 'Flatter and entreat: the seer who grasps all things, the city’s only savior', 'His opening speech is all praise and appeal.'),
          yes('accuse', 'Accuse and threaten: call him a plotter and a quack', 'He says Teiresias helped plot the murder and is blind in his art.'),
          no('bribe', 'Offer him gold to talk', 'He offers none; he says the man has eyes only for profit, as an insult.'),
        ],
      },
      {
        name: 'Teiresias',
        objective: [
          yes('home', 'Go home without telling what he knows', 'His first wish is to be let go home, and he says he’d never have come had he remembered.'),
          yes('truth', 'Once provoked, tell the king the truth to his face', 'He says Oedipus spurred him to speak against his will, and then holds nothing back.'),
          no('court', 'Win power at Creon’s court', 'Oedipus charges him with it; he answers that he serves Loxias and won’t be enrolled as Creon’s client.'),
        ],
        obstacle: [
          yes('anger', 'The king’s anger and his certainty', 'Oedipus calls him a plotter and threatens him.'),
          no('fear', 'Fear of what the king will do to him', 'He says the king can never destroy him, and leaves without fear of his frown.'),
        ],
        tactic: [
          yes('withhold', 'Refuse, and keep refusing', 'He says he’ll speak no further and tells Oedipus to rage if he likes.'),
          yes('riddle', 'Answer in riddles that cut deeper the more he’s pressed', 'He asks if Oedipus knows who his parents are and says this day will show his birth.'),
          no('soothe', 'Soothe and flatter the king', 'He tells him he’s the accursed defiler of the land.'),
        ],
      },
    ],
  },
  {
    // Perseus, Electra 328–471. The Chorus speaks twice (369–371, 464–465).
    id: 'electra-328', play: 'Electra', by: 'Sophocles, tr. R. C. Jebb', year: 1894, where: 'Before the palace at Mycenae, the first scene of the two sisters', language: 'prose', size: 'long', genre: 'tragedy', difficulty: 2, tradition: 'greek',
    summary: 'Electra has come out to mourn her father at the palace doors once again. Chrysothemis, carrying offerings from their mother to his tomb, urges her to bend to those in power and warns that Aegisthus means to shut her away. When Electra hears the offerings come from Clytemnestra’s fear of a dream, she talks her sister into throwing them away and laying locks of their own hair on the tomb instead.',
    circumstances: [
      yes('doors', 'Before the palace with Aegisthus away in the country; Chrysothemis is on her way to their father’s tomb', 'Electra says he’s in the country, and Chrysothemis comes out with offerings for the dead.'),
      no('news', 'Just after word of Orestes’ death', 'That false report comes later; here Electra still waits for him to keep his promise.'),
      no('listening', 'Aegisthus is in the house and listening', 'He’s away; Chrysothemis says they’ll act on Electra as soon as he comes home.'),
    ],
    relationship: [
      yes('sisters', 'Sisters of one father and mother, who grieve the same death and live it differently', 'Chrysothemis says she grieves too, but those in power must be obeyed.'),
      no('enemies', 'Open enemies', 'They quarrel, but Chrysothemis comes to warn her and leaves to do what she asks.'),
      no('mother', 'Mother and daughter', 'Clytemnestra sends Chrysothemis and never appears in the scene.'),
    ],
    roles: [
      {
        name: 'Electra',
        objective: [
          yes('father', 'Honor her father and keep faith with Orestes, whatever it costs', 'She says she’ll fall, if need be, honoring her father.'),
          yes('enlist', 'Bring her sister over to her side', 'She ends by asking Chrysothemis to help her, and their father, and Orestes.'),
          no('peace', 'Make peace with her mother', 'She calls Clytemnestra his hateful wife and the most audacious of women.'),
        ],
        obstacle: [
          yes('caution', 'Her sister’s caution, which she hears as their mother’s', 'She says all of Chrysothemis’ advice is their mother’s teaching.'),
          no('orestes', 'Orestes has come home and told her to wait', 'She thinks he still delays; he hasn’t made himself known to her.'),
        ],
        tactic: [
          yes('shame', 'Shame her: call her caution cowardice and betrayal', 'She says Chrysothemis hates in word alone and sides with the murderers in deed.'),
          yes('dream', 'Seize on the dream and turn it into a sign', 'At news of the vision she calls on her father’s gods and asks to hear it.'),
          no('intercede', 'Ask Chrysothemis to plead with their mother for her', 'She wants nothing from Clytemnestra and tells her sister to throw the offerings away.'),
        ],
      },
      {
        name: 'Chrysothemis',
        objective: [
          yes('warn', 'Warn her sister in time and save her from being shut away', 'She says she’d not have spoken if she hadn’t heard of the disaster rushing down on Electra.'),
          yes('safe', 'Keep the peace with those in power and live free', 'She says that to live as the freeborn, she must obey those in power.'),
          no('report', 'Report Electra’s words to their mother', 'She asks the women to keep her secret so their mother won’t hear.'),
        ],
        obstacle: [
          yes('will', 'Electra won’t bend, and calls her a coward', 'Electra says such sentiments are for cowards and won’t be persuaded.'),
          no('forbidden', 'Aegisthus has forbidden her to speak to Electra', 'No one forbids it in the scene; he’s away in the country.'),
        ],
        tactic: [
          yes('reason', 'Reason and warn: shorten sail, bend before the strong', 'She says she sails with a shortened sail in evil times and tells Electra to bend before the strong.'),
          yes('yield', 'Give way once the right is plain', 'She says it’s unreasonable for two to argue over a just deed, and agrees to it.'),
          no('threaten', 'Threaten to tell Aegisthus', 'She warns of his plan but makes no threat; she asks for silence herself.'),
        ],
      },
    ],
  },
  {
    // Gutenberg #35451, from Jason’s entrance to his exit (Greek 446–626). The Leader speaks twice.
    id: 'medea-446', play: 'Medea', by: 'Euripides, tr. Gilbert Murray', year: 1906, where: 'Before Medea’s house in Corinth, Jason’s first visit', language: 'verse', size: 'long', genre: 'tragedy', difficulty: 3, tradition: 'greek',
    summary: 'Creon has banished Medea and her sons and granted her one day, and she has already sworn to kill the king, his daughter and Jason. Jason comes to offer money for the exile; she lists everything she did for him, and he answers that she owes her fame to Greece and that his royal marriage was for the children’s good. She refuses his help and sends him back to his bride.',
    circumstances: [
      yes('exile', 'Before her house in Corinth, the day of her banishment, with one day left', 'Creon has given her until the next sunrise, and Jason comes to talk about the exile.'),
      no('gifts', 'After the poisoned gifts have reached the bride', 'That comes later; here Jason’s new bride is alive and well.'),
      no('argo', 'On the Argo, before Jason’s quest is won', 'She looks back on the Argo; the scene is years later in Corinth, with two sons.'),
    ],
    relationship: [
      yes('betrayed', 'Husband and wife, she betrayed by his marriage to the king’s daughter', 'She calls him the comrade whose kiss betrayed her, and says she bore him children.'),
      no('agreed', 'Two people who parted by agreement', 'She calls his marriage a breach of sworn faith, and the Leader says he did wrong.'),
      no('strangers', 'Near strangers', 'She saved his life and fled her father’s house with him.'),
    ],
    roles: [
      {
        name: 'Medea',
        objective: [
          yes('wound', 'Make him feel what he has done', 'She says it will comfort her to clear her heart on him and make him wince to hear.'),
          yes('oath', 'Make him own that he broke his oath', 'She asks if the old gods are dead and the old laws forgotten, and calls him forsworn.'),
          no('help', 'Accept his help for the exile', 'She refuses his money and his letters: gifts from an unholy stem bring no blessing.'),
        ],
        obstacle: [
          yes('reason', 'His cool, reasoned answers, and the royal power behind him', 'He answers her charges point by point from inside the king’s house.'),
          no('afraid', 'She’s afraid of Jason', 'She calls him a coward and mocks him to his face.'),
        ],
        tactic: [
          yes('debt', 'Lay out the debt: everything she did and gave up for him', 'She recites the fire-breathing bulls, the serpent, Pelias and her father’s house.'),
          yes('mock', 'Mock him: the bridegroom’s babes begging their bread', 'She imagines the laughter at his wedding and taunts him as he goes.'),
          no('beg', 'Beg him to take her back', 'She never asks; she sends him to his new bride.'),
        ],
      },
      {
        name: 'Jason',
        objective: [
          yes('justify', 'Justify the marriage and come out the reasonable one', 'He says he’ll show he was wise and her friend, and calls her jealous.'),
          yes('settle', 'Settle her exile decently and be done with it', 'He offers money and letters to friends abroad who will treat her well.'),
          no('lift', 'Get the banishment lifted', 'He says she brought it on herself with her threats against the royal house.'),
        ],
        obstacle: [
          yes('charges', 'Her rage, and that her charges are true', 'The Leader tells him that, for all his subtle speech, betraying her was wrong.'),
          no('king', 'Creon has forbidden him to see her', 'He comes freely, and no such order is given.'),
        ],
        tactic: [
          yes('case', 'Argue it like a case, point by point and coolly', 'He answers her claim to have saved him by crediting the Cyprian, then lists what Greece gave her.'),
          yes('generous', 'Play the generous man she’s too angry to accept', 'He calls the gods to witness that his heart is willing to help.'),
          no('apologize', 'Apologize for the marriage', 'He defends it as wise, made for her sake and the children’s.'),
        ],
      },
    ],
  },
  {
    // Gutenberg #35173, from the guards untying him to his being led off (Greek about 451–518).
    id: 'bacchae-451', play: 'The Bacchae', by: 'Euripides, tr. Gilbert Murray', year: 1906, where: 'Before the castle of Pentheus at Thebes, the Stranger brought in bound', language: 'verse', size: 'medium', genre: 'tragedy', difficulty: 2, tradition: 'greek',
    summary: 'The god Dionysus has come to Thebes in the shape of a man, a Lydian stranger, and Pentheus has had him arrested. Brought in bound, he meets the king’s questions about the god’s rites with calm evasions. Pentheus has his curl cut and his staff taken, and orders him tied up in the stables.',
    circumstances: [
      yes('arrest', 'Before the king’s castle; the guards have brought the Stranger bound, and the women they jailed have escaped', 'The Soldier reports that the prisoned women’s fetters fell away and they’re free in the woods.'),
      no('mountain', 'On Cithaeron among the women', 'That comes later; here he’s a prisoner before the castle.'),
      no('dressed', 'After Pentheus has put on women’s clothes', 'That comes later; here Pentheus is still in command.'),
    ],
    relationship: [
      yes('cousins', 'A king and a prisoner who is secretly the god, and his cousin', 'Dionysus is Semele’s son and Pentheus is Agave’s; Pentheus doesn’t know who stands before him.'),
      no('friends', 'Old friends meeting again', 'Pentheus has never seen him and asks his name and race.'),
      no('servant', 'A master and his loyal servant', 'He’s a prisoner the king ordered caught.'),
    ],
    roles: [
      {
        name: 'Pentheus',
        objective: [
          yes('crush', 'Break the cult by breaking its priest', 'He says the Stranger’s doom is fixed for corrupting Thebes, and has him bound.'),
          yes('learn', 'Find out what the rites are', 'He keeps asking what the emblems are, what good they bring and when the worship is held.'),
          no('join', 'Be initiated', 'He calls the rites craft and rottenness.'),
        ],
        obstacle: [
          yes('calm', 'The Stranger won’t be frightened and won’t answer straight', 'Each question is turned aside, and Pentheus complains that nothing’s answered.'),
          no('guards', 'His guards won’t obey him', 'They cut the hair and bind the prisoner when told.'),
        ],
        tactic: [
          yes('jeer', 'Jeer at his looks: the curls, the white skin', 'He opens by mocking him as a fair shape for a woman’s eye.'),
          yes('strip', 'Strip him of his signs: the hair, the staff', 'He has the curl cut and takes the wand.'),
          no('gentle', 'Reason with him gently', 'He jeers and threatens; the Stranger is the gentle one.'),
        ],
      },
      {
        name: 'Dionysus',
        objective: [
          yes('ruin', 'Draw the king on, toward his ruin', 'He calls Pentheus’ name fore-written to calamity and says the god will come after him.'),
          yes('see', 'Make the king see the god', 'He says the god stands close by, veiled from Pentheus by his own impurity.'),
          no('free', 'Talk his way free', 'He goes to the dungeon unresisting, saying the god will set him loose.'),
        ],
        obstacle: [
          yes('blind', 'The king’s blindness of heart', 'He tells Pentheus he doesn’t know what he does or what man he is.'),
          no('chains', 'The chains can hold him', 'The Soldier says he held out his hands, and the women’s fetters fell off by themselves.'),
        ],
        tactic: [
          yes('calm', 'Stay gentle and unafraid, and answer in riddles', 'Murray’s stage direction has him gentle and unafraid, and each answer turns the question back.'),
          yes('warn', 'Warn him plainly what’s coming', 'His exit lines say the god he denies will come after him for this wrong.'),
          no('rage', 'Rage at the king', 'He stays gentle while Pentheus jeers.'),
        ],
      },
    ],
  },
  {
    // Gutenberg #14417, Clytemnestra’s welcome to her exit into the palace (Greek about 855–974).
    id: 'agamemnon-855', play: 'Agamemnon', by: 'Aeschylus, tr. Gilbert Murray', year: 1920, where: 'Before the palace at Argos, the king’s homecoming', language: 'verse', size: 'medium', genre: 'tragedy', difficulty: 3, tradition: 'greek',
    summary: 'Agamemnon comes home from Troy in his chariot, with Cassandra behind him. Clytemnestra greets him with a long speech about her years of waiting and has her women spread crimson tapestries to the door. He refuses to walk on them like a god; she wears him down in a quick exchange, and he goes in over the cloth, his shoes untied.',
    circumstances: [
      yes('homecoming', 'Before the palace at Argos, Agamemnon still in his chariot, Cassandra silent behind him, the elders watching', 'The stage directions bring him in on a chariot with Cassandra on another, and the elders have just greeted him.'),
      no('aulis', 'At Aulis, before the fleet sails', 'Aulis is ten years past; the elders sing of it, and here he’s home from Troy.'),
      no('murder', 'After the murder in the bath', 'He’s alive, and this is the moment he walks into the house.'),
    ],
    relationship: [
      yes('marriage', 'Husband and wife after ten years apart, and she means to kill him', 'She prays as she follows him in that Zeus will fulfill what she wills, and the murder follows.'),
      no('loving', 'A loving couple at last reunited', 'Her welcome is too much for him, and her prayer that Justice light him home is a threat.'),
      no('strangers', 'Strangers', 'She calls him her lord, and he calls her daughter of Leda.'),
    ],
    roles: [
      {
        name: 'Clytemnestra',
        objective: [
          yes('tread', 'Get him to walk on the crimson', 'She has the women spread it and won’t let his refusal stand.'),
          yes('pride', 'Make him commit the act of pride that turns the gods against him', 'He fears the gods’ envy; she argues the fear away until he treads anyway.'),
          no('warn', 'Warn him of danger in the house', 'Her prayer as she follows him in is for Zeus to fulfill what she wills.'),
        ],
        obstacle: [
          yes('gods', 'His fear of the gods and of the people’s talk', 'He says such honor belongs to gods, and that a people’s murmur has weight.'),
          no('cassandra', 'Cassandra warns him', 'Cassandra is silent through the whole scene.'),
        ],
        tactic: [
          yes('praise', 'Overwhelm him with praise: watchdog, pillar, a spring in the desert', 'Her speech heaps image on image before she calls for the tapestries.'),
          yes('question', 'Question him in short lines until he yields', 'She asks what Priam would have done and tells him that yielding with good will is victory.'),
          no('tears', 'Weep and plead', 'She says her tears are all spent, and she argues line by line.'),
        ],
      },
      {
        name: 'Agamemnon',
        objective: [
          yes('man', 'Be honored as a man, not a god', 'He says treading on the broideries is a danger, worship fit for gods.'),
          yes('inside', 'Get home and inside without a quarrel', 'He gives way at last, if he must, and asks her to treat Cassandra gently.'),
          no('show', 'Make a show of his triumph', 'He refuses the tapestries, and goes in on them only because she constrains him.'),
        ],
        obstacle: [
          yes('wife', 'His wife’s persistence, and his own pride', 'He keeps answering her questions, and she turns each answer her way.'),
          no('elders', 'The elders oppose his return', 'They hail him as sacker of cities.'),
        ],
        tactic: [
          yes('refuse', 'Refuse flatly: he has spoken his purpose', 'He tells her his will won’t falter.'),
          yes('rebuke', 'Rebuke her welcome as too much', 'He tells her not to make him soft or fling herself down as to a barbarous king.'),
          no('accept', 'Accept the honor at once', 'He refuses at length before he yields.'),
        ],
      },
    ],
  },
];
