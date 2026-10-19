/**
 * SLATE — more modern prose scenes for scene study (from 2026-10-07), from
 * plays first published or performed by 1930, in English or in an English
 * translation of that time, each one named. What each says about its play is
 * what the play says, checked against the text; which readings the scene
 * supports is SLATE's reading of it, as in `content/coursework.ts`.
 *
 * Kept apart from `coursework.ts`, which spreads these into `SCENES`; only
 * the types are imported, since a value import from there would be circular.
 */

import type { Scene, Option } from './coursework';

const yes = (id: string, text: string, why?: string): Option => ({ id, text, supported: true, ...(why ? { why } : {}) });
const no = (id: string, text: string, why: string): Option => ({ id, text, supported: false, why });

export const MODERN_SCENES: readonly Scene[] = [
  {
    id: 'hedda-2', play: 'Hedda Gabler', by: 'Henrik Ibsen, tr. Edmund Gosse and William Archer', year: 1890, where: 'Act Two, over the photograph album', language: 'prose', size: 'medium', genre: 'drama', difficulty: 3,
    summary: 'While Tesman and Judge Brack drink punch in the inner room, Hedda sits Lovborg beside her on the sofa with the album of her wedding journey. Under cover of the photographs they go back over their secret comradeship and the night she threatened to shoot him, until Mrs. Elvsted arrives.',
    circumstances: [
      yes('album', 'Late afternoon in the Tesmans’ new house, twilight coming on, her husband and the Judge drinking punch in the next room', 'Tesman comes in twice, and Brack keeps an eye on them from the inner room.'),
      no('alone', 'An evening alone together, the house empty', 'Tesman and Brack are a few steps away, and Tesman comes in with the punch.'),
      no('father', 'An afternoon at General Gabler’s, years ago', 'That’s what they remember; the scene is now, after her marriage to Tesman.'),
    ],
    relationship: [
      yes('comrades', 'Secret confidants years ago, nearly lovers; now a married woman and the man she broke with'),
      no('engaged', 'A couple once engaged, who parted by agreement', 'There was no engagement; she broke with him when their friendship threatened to become something more serious.'),
      no('strangers', 'New acquaintances, introduced by Tesman', 'They knew each other well; he calls her by her maiden name.'),
    ],
    roles: [
      {
        name: 'Hedda',
        objective: [
          yes('find-out', 'Find out what he still feels, and give nothing away herself', 'She asks him nothing outright, then hints at last that her cowardice that evening wasn’t only about the pistol.'),
          yes('peep', 'Look again, through him, into the life she was forbidden', 'She tells him a young girl is glad to have a peep into a world she isn’t allowed to know.'),
          no('affair', 'Start an affair with him again', 'She tells him she won’t hear of any unfaithfulness, and warns him to believe nothing of the sort.'),
        ],
        obstacle: [
          yes('watched', 'Her husband and Brack are a few steps away, and she dreads scandal above everything', 'Asked why she didn’t shoot him, she says she has such a dread of scandal.'),
          no('thea', 'Mrs. Elvsted is in the room with them', 'Thea arrives only at the end, and Hedda closes the album to greet her.'),
          no('dislike', 'She can’t bear the sight of him', 'She offered to keep him company and sat him down beside her.'),
        ],
        tactic: [
          yes('album', 'Hide behind the photographs, talking of the Dolomites whenever Tesman comes near', 'She turns to a view of the Val d’Ampezzo the moment she hears Tesman coming.'),
          yes('distance', 'Hold him off: no “du” between them, and “Mr. Lovborg” within earshot of the others', 'She tells him she won’t talk to him if he keeps saying du to her.'),
          no('confess', 'Tell him openly that she loved him', 'She says she wonders whether there was love at all, and warns him to believe nothing of the sort.'),
        ],
      },
      {
        name: 'Lovborg',
        objective: [
          yes('why', 'Make her say why she married Tesman, and whether she ever loved him', 'He asks how she could throw herself away, then whether there wasn’t a spark of love.'),
          yes('reclaim', 'Have the old intimacy back, if only for a moment', 'He keeps saying her maiden name and asks to say du when they’re alone.'),
          no('punch', 'Join the men at the punch', 'He refuses it; Tesman pours a second glass for Mrs. Elvsted, since Lovborg won’t have any.'),
        ],
        obstacle: [
          yes('married', 'She is married now, and won’t let him speak to her as he used to'),
          no('drunk', 'He’s drunk and can’t keep his head', 'He refuses the punch here; the drinking comes later in the act.'),
          no('rival', 'Tesman is competing with him for the professorship', 'Lovborg has told Tesman he won’t stand in his way, and it isn’t what stands between him and Hedda.'),
        ],
        tactic: [
          yes('memory', 'Take her back to the afternoons at her father’s, the General reading with his back to them', 'He remembers the corner sofa and the illustrated paper they shared.'),
          yes('accuse', 'Accuse her to her face', 'He tells her she’s a coward at heart.'),
          no('scene', 'Make a scene in front of Tesman', 'He speaks softly throughout, and presses her only when Tesman is out of earshot.'),
        ],
      },
    ],
  },
  {
    id: 'arms-1', play: 'Arms and the Man', by: 'Bernard Shaw', year: 1894, where: 'Act One, Raina’s bedroom', language: 'prose', size: 'long', genre: 'comedy', difficulty: 2,
    summary: 'On a November night in 1885, a Swiss officer fleeing with the beaten Serbian army climbs into Raina’s bedroom. Once she has hidden him from the search, she learns he carries chocolate instead of cartridges, hears her betrothed Sergius’s heroic charge described as a fool’s, and puts him under her family’s protection, while he falls asleep.',
    circumstances: [
      yes('night', 'A November night in 1885, firing in the streets, the routed army being hunted through the town'),
      no('spring', 'A spring morning after the peace', 'That’s Act Two, in March 1886; this is the night of the rout.'),
      no('call', 'A formal call in the Petkoffs’ library', 'He comes in through her bedroom window, and she’s in her nightgown.'),
    ],
    relationship: [
      yes('enemies', 'Enemies by the war and strangers until he climbs in: a romantic young woman and a practical soldier'),
      no('engaged', 'An engaged couple', 'Her betrothed is Sergius, whose photograph is on the chest of drawers.'),
      no('old-friends', 'Old friends from before the war', 'They have never met; he has to tell her he’s Swiss.'),
    ],
    roles: [
      {
        name: 'Raina',
        objective: [
          yes('noble', 'Behave as nobly as a heroine, and make him see it', 'She tells him whose house he’s in, the Petkoffs’, and offers him its hospitality with great dignity.'),
          yes('save', 'Save him, once she sees how helpless he is', 'When he makes for the window she stops him: “They’ll kill you.”'),
          no('hand-over', 'Hand him over to the Bulgarian officer', 'She stands by the curtain and sends the search away.'),
        ],
        obstacle: [
          yes('ideals', 'Everything he says about soldiering mocks her ideals, Sergius’s charge included'),
          no('father', 'Her father is in the house', 'Her father is away at Slivnitza, fighting.'),
          no('locked', 'She is locked in and can’t fetch help', 'She opens the door to Louka herself, and goes out at the end to fetch her mother.'),
        ],
        tactic: [
          yes('scorn', 'Scorn him as a chocolate cream soldier, then mother him'),
          yes('grandeur', 'Impress him with her family’s standing: the Petkoffs, the library'),
          no('alarm', 'Call for help and give him up', 'She never raises the alarm; she hides him and covers for him.'),
        ],
      },
      {
        name: 'Bluntschli',
        objective: [
          yes('sleep', 'Stay alive, and get some sleep', 'He says capture only means death, and death is sleep; he hasn’t closed his eyes for thirty-six hours.'),
          yes('shelter', 'Win her protection without making an enemy of her', 'He asks to wait a minute or two, and kisses the hand she offers in pledge of his safety.'),
          no('woo', 'Win her heart away from Sergius', 'He laughs at Sergius’s charge without knowing who Sergius is to her, and courts nothing but sleep.'),
        ],
        obstacle: [
          yes('exhausted', 'He’s starving and worn out, and the waterpipe down to the street is more than he can face'),
          no('loaded', 'His pistol keeps her too frightened to help', 'The pistol isn’t loaded, and he tells her so.'),
          no('door', 'The door is locked from outside', 'He locked it himself, and she unlocks it for Louka.'),
        ],
        tactic: [
          yes('candor', 'Tell her the plain professional truth, however unheroic', 'He admits to the chocolate and tells her nine soldiers out of ten are born fools.'),
          yes('cloak', 'Frighten her at first: keep her cloak, so she won’t call anyone in', 'He says the cloak is a better weapon than the pistol.'),
          no('fight', 'Fight his way out with his sabre', 'He draws it when the knock comes, then lets her hide him; he never fights.'),
        ],
      },
    ],
  },
  {
    id: 'proposal', play: 'The Proposal', by: 'Anton Chekhov, tr. Julius West', year: 1889, where: 'A one-act play, the quarrel over Oxen Meadows', language: 'prose', size: 'short', genre: 'comedy', difficulty: 1,
    summary: 'Lomov, thirty-five, nervous and in evening dress, has come to propose to his neighbor’s daughter Natalya. Before he gets to the point he mentions “my Oxen Meadows,” and she, who doesn’t know why he has come, fights him for the land until they’re shouting and her father comes in.',
    circumstances: [
      yes('visit', 'Haymaking time, in the drawing room of the Chubukovs’ country house; she has been shelling peas and he’s in evening dress and white gloves'),
      no('ball', 'A ball at a neighbor’s house', 'She asks him whether he’s going to a ball; they’re in her father’s house.'),
      no('court', 'The district court, the land case being heard', 'No case is heard; the court is only threatened, once her father joins the quarrel.'),
    ],
    relationship: [
      yes('neighbors', 'Neighbors who have known each other since childhood; he means to marry her, and she doesn’t know it'),
      no('engaged', 'An engaged couple', 'He never gets as far as proposing, and she learns why he came only after he has gone.'),
      no('strangers', 'Strangers meeting for the first time', 'He says the two families have been close since his childhood, and she asks why he hasn’t been to see them for so long.'),
    ],
    roles: [
      {
        name: 'Natalya',
        objective: [
          yes('land', 'Make him admit the Meadows are theirs', 'She says they’re worth little, but she can’t stand unfairness: “ours, ours, ours!”'),
          yes('place', 'Put a presumptuous neighbor in his place', 'His offer to make her a present of the Meadows is what she calls impudent.'),
          no('catch', 'Get him to propose', 'She doesn’t know he has come to propose until her father tells her after Lomov has gone.'),
        ],
        obstacle: [
          yes('stubborn', 'He’s as stubborn as she is, and he has documents'),
          no('father', 'Her father has forbidden the match', 'Her father is delighted, and went to fetch her himself.'),
          no('busy', 'She’s too busy with the peas to listen', 'She sits down with him and offers him lunch; it’s the land that stops her listening.'),
        ],
        tactic: [
          yes('family', 'Throw her family’s three hundred years on the land at him'),
          yes('kindness', 'Shame him with the family’s kindness: the threshing machine they lent him last year'),
          no('charm', 'Charm him out of his claim', 'She calls his behavior impudent and threatens to send her mowers out that day.'),
        ],
      },
      {
        name: 'Lomov',
        objective: [
          yes('propose', 'Get the proposal out before his nerve goes', 'He has made up his mind not to give himself time to think, and starts a speech about the two families.'),
          yes('principle', 'Win the point about the Meadows, on principle', 'He says he doesn’t want the Meadows but is acting on principle.'),
          no('money', 'Borrow money from the family', 'Chubukov suspects that, aside, but Lomov has come to ask for her hand.'),
        ],
        obstacle: [
          yes('nerves', 'His nerves: palpitations, a twitching eyebrow, a foot gone numb, and a woman who contradicts him'),
          no('rival', 'Another suitor has spoken for her first', 'No other suitor is mentioned; her father is sure she’ll consent.'),
          no('deaf', 'She doesn’t hear what he says', 'She hears every word, and interrupts at “my Oxen Meadows.”'),
        ],
        tactic: [
          yes('history', 'Prove it from history: his aunt’s grandmother, her father’s grandfather’s peasants, the bricks'),
          yes('water', 'Steady himself with water from the carafe, and then shout'),
          no('leave', 'Walk out the moment she contradicts him', 'He stays and argues until her father comes in.'),
        ],
      },
    ],
  },
  {
    id: 'windermere-1', play: 'Lady Windermere’s Fan', by: 'Oscar Wilde', year: 1892, where: 'Act One, the morning room', language: 'prose', size: 'short', genre: 'comedy', difficulty: 2,
    summary: 'On the afternoon of her coming of age, Lady Windermere arranges roses and tells Lord Darlington his compliments annoy her. He talks of an imaginary young husband who keeps company with a woman of doubtful character, and asks whether the wife should console herself; she, who has heard nothing yet about her own husband, says such women should never be forgiven.',
    circumstances: [
      yes('birthday', 'Her birthday afternoon, in the morning room at Carlton House Terrace, her ball to be given that night'),
      no('ball', 'The ball itself, late at night', 'The ball is tonight; this is the afternoon, with the carpets about to go down on the terrace.'),
      no('rooms', 'Lord Darlington’s rooms', 'That’s the third act; here he calls on her at home.'),
    ],
    relationship: [
      yes('admirer', 'A young wife of two years and a man of society who admires her more than he should'),
      no('lovers', 'Secret lovers', 'She tells him they can be friends only as long as he doesn’t say extravagant things to her.'),
      no('kin', 'Cousins who grew up together', 'The butler announces him as a caller; they aren’t related.'),
    ],
    roles: [
      {
        name: 'Lady Windermere',
        objective: [
          yes('stop', 'Make him stop the compliments without losing him as a friend', 'She tells him she likes him, and would be sorry to quarrel with him.'),
          yes('principle', 'Hold her ground on right and wrong against his cleverness', 'She tells him she allows of no compromise and no exceptions.'),
          no('learn', 'Find out what he knows about her husband', 'She doesn’t know there’s anything to find out; she hears the rumor from the Duchess afterward.'),
        ],
        obstacle: [
          yes('charm', 'He’s charming, and he turns every serious thing she says into a joke'),
          no('husband', 'Her husband is listening at the door', 'Lord Windermere doesn’t come in until after the Duchess has gone.'),
          no('guests', 'A room full of guests', 'It’s the two of them, with only the butler coming in and out.'),
        ],
        tactic: [
          yes('grave', 'Be grave, and refuse to laugh at his epigrams'),
          yes('busy', 'Busy herself with the roses and the tea, and keep him at a distance'),
          no('flirt', 'Flirt back to keep him interested', 'She tells him the adjective in “fascinating Puritan” was unnecessary.'),
        ],
      },
      {
        name: 'Lord Darlington',
        objective: [
          yes('prepare', 'Prepare her for what she’ll hear about her husband, and offer himself as the friend she’ll need', 'He says she may want a friend some day, and builds an imaginary case of a husband two years married.'),
          yes('serious', 'Make her take him seriously, more than anyone else', 'He tells her he would like her, more than anyone in life, to take him seriously.'),
          no('ball', 'Talk her out of giving the ball', 'He won’t hear of its raining on her birthday, and the carpets go down on the terrace.'),
        ],
        obstacle: [
          yes('puritan', 'Her principles: she allows of no exceptions and no compromise'),
          no('refused', 'She has refused to see him', 'She has him shown up, and says she’s glad he has come.'),
          no('debt', 'He owes her husband money', 'The scene never says so; his joke about being hard up is about compliments.'),
        ],
        tactic: [
          yes('paradox', 'Play the wit, and say serious things as paradoxes that can be taken back'),
          yes('case', 'Put it as a hypothetical case, to say what he can’t say outright'),
          no('tell', 'Tell her plainly what her husband has been doing', 'He keeps it to an imaginary instance; she hears it plainly only from the Duchess.'),
        ],
      },
    ],
  },
  {
    id: 'suppressed-2', play: 'Suppressed Desires', by: 'Susan Glaspell and George Cram Cook', year: 1915, where: 'Scene Two, the studio at dusk', language: 'prose', size: 'short', genre: 'comedy', difficulty: 1,
    summary: 'Two weeks after Henrietta sent her sister Mabel to be psychoanalyzed, her husband Stephen comes home and tells her he has been analyzed too. The doctor read his dream of receding walls as a suppressed desire to be freed from marriage, and Henrietta, the household’s champion of psychoanalysis, can’t argue with it.',
    circumstances: [
      yes('dusk', 'A winter afternoon going dark in their Washington Square studio, her paper for the Liberal Club spread on the table'),
      no('breakfast', 'Breakfast on the first morning of Mabel’s visit', 'That’s Scene One; this is two weeks later.'),
      no('office', 'Dr. Russell’s consulting room', 'Stephen has been there already; he comes home to tell her.'),
    ],
    relationship: [
      yes('married', 'Husband and wife of a few years; she has been reading his every mood as a complex, and he has had enough'),
      no('newlyweds', 'Newlyweds on their first quarrel', 'They have lived in the studio three years, and quarreled about psychoanalysis in Scene One.'),
      no('analyst', 'Analyst and patient', 'Dr. Russell is the analyst; Henrietta is a disciple, not a doctor.'),
    ],
    roles: [
      {
        name: 'Henrietta',
        objective: [
          yes('know', 'Find out what the analysis said', 'She begs him for it: “Stephen, you’ll drive me mad!”'),
          yes('face', 'Keep her dignity, and her faith in psychoanalysis, now that it has turned on her', 'She tells him she leaves him free, and that psychoanalysis has done great things but has also made mistakes.'),
          no('leave', 'Leave Stephen for someone else', 'It’s Stephen’s analysis that says marriage confines him; she asks him to go.'),
        ],
        obstacle: [
          yes('creed', 'Her own creed: she has preached that the unconscious can’t be argued with'),
          no('mabel', 'Mabel is in the room listening', 'Mabel is at Dr. Russell’s; she comes in only after Stephen has gone out.'),
          no('doubt', 'She has lost her faith in psychoanalysis and can’t admit it', 'She says her faith has grown stronger with each new thing she has learned.'),
        ],
        tactic: [
          yes('cross', 'Cross-examine him: did the doctor know he was married to her?'),
          yes('brave', 'Bear it coldly and bravely, and send him off tonight'),
          no('laugh', 'Laugh the analysis off', 'She tells him he should have laughed the doctor down, and doesn’t laugh herself.'),
        ],
      },
      {
        name: 'Stephen',
        objective: [
          yes('turn', 'Turn her own theory back on her until she lets it go', 'He comes in briskly, drags out the telling, and says only that he couldn’t refute the doctor’s arguments.'),
          yes('break', 'Break the news gently, unsure himself what it means', 'He keeps saying the doctor may be wrong, and that he came home to talk it over with her.'),
          no('go', 'Leave her that night', 'When she tells him to go tonight he finds reasons not to: his laundry hasn’t come home.'),
        ],
        obstacle: [
          yes('faith', 'She believes in psychoanalysis, and by its lights a denial is only self-protective lying'),
          no('mabel', 'Mabel is in love with him', 'He doesn’t know that; Mabel tells Henrietta after he has left the room.'),
          no('deaf', 'She won’t listen to a word he says', 'She’s desperate to hear it and keeps urging him on.'),
        ],
        tactic: [
          yes('suspense', 'Draw it out, and make her beg for each word of the diagnosis'),
          yes('sad', 'Play it sad: the view he would miss, how long they have been married'),
          no('mock', 'Mock psychoanalysis openly', 'He says he isn’t sure he’s wholly out of sympathy with it, and defers to her as its disciple.'),
        ],
      },
    ],
  },
  {
    id: 'rising-moon', play: 'The Rising of the Moon', by: 'Lady Gregory', year: 1907, where: 'A one-act play, on the quay once the other police have gone', language: 'prose', size: 'short', genre: 'drama', difficulty: 1,
    summary: 'A police sergeant watches the quay of a seaport town for a rebel who has broken out of jail with a hundred pounds on his head. A ragged ballad singer talks his way into keeping watch with him, sits back to back with him on a barrel, and sings him back to the songs of his youth before he shows who he is.',
    circumstances: [
      yes('quay', 'Moonlight on a seaport quay at assize time, the reward notice pasted on a barrel, steps down to the water where a boat could come in'),
      no('barrack', 'Inside the police barrack', 'It’s the open quay, with steps down to the water.'),
      no('market', 'A market day, the quay crowded', 'It’s night; the sergeant says it’s lonesome with nothing but the moon.'),
    ],
    relationship: [
      yes('hunter', 'Strangers, a policeman and the man he’s hunting, though the sergeant doesn’t know it; two Irishmen who sang the same songs as boys'),
      no('comrades', 'Old comrades from the movement', 'They have never met; the sergeant never saw the man before he broke jail.'),
      no('informer', 'A policeman and his paid informer', 'The man refuses any share of the reward.'),
    ],
    roles: [
      {
        name: 'The Sergeant',
        objective: [
          yes('reward', 'Catch the man, and win the hundred pounds and promotion', 'He reads the reward over and says it’s a pity some honest man shouldn’t be the better of it.'),
          yes('company', 'Have company on a lonely, frightening watch', 'He lets the ragged man stay once the stories of the rebel have scared him.'),
          no('free', 'Help the rebel escape', 'Until the man shows who he is, the sergeant means to take him, and says he won’t let him pass.'),
        ],
        obstacle: [
          yes('heart', 'His own past: he sang the rebel songs once, and part of him is still with them'),
          no('orders', 'His orders are to let the man pass', 'His orders are to watch the steps; he tells the man no one may go down them tonight.'),
          no('drink', 'He has been drinking on duty', 'The play never says so; all he takes is a draw on a pipe.'),
        ],
        tactic: [
          yes('authority', 'Use his authority: move the man on, then keep him there on his own terms'),
          yes('silence', 'Stop the songs, and then correct the line the man gets wrong'),
          no('arrest', 'Arrest the man the moment he sees him', 'He lets him stay and sit beside him; he threatens arrest only when the man sings the signal.'),
        ],
      },
      {
        name: 'The Ragged Man',
        objective: [
          yes('pass', 'Get down the steps to the boat', 'He heads for the steps again and again, and his friends are below with a boat.'),
          yes('convert', 'Win the sergeant over to the side of the country', 'He tells him he was with the people, not the law, as a young man, and may be on their side yet.'),
          no('sell', 'Sell enough ballads for his supper', 'That’s his cover story; he’s the man on the placard.'),
        ],
        obstacle: [
          yes('duty', 'The sergeant is a married man with a family and a duty, and a hundred pounds is a lot of money'),
          no('police', 'Three police are guarding the steps', 'The other two have gone off to put up placards; the sergeant is alone.'),
          no('known', 'The sergeant knows his face', 'The sergeant never saw him, and the placard gives little to go on.'),
        ],
        tactic: [
          yes('fear', 'Frighten him with stories of what the rebel has done, then offer to watch with him'),
          yes('songs', 'Sing him back to the songs of his youth, and to who he was then'),
          no('bribe', 'Bribe him', 'He has nothing to offer; he says he thought to do it with his tongue.'),
        ],
      },
    ],
  },
  {
    id: 'creditors', play: 'Creditors', by: 'August Strindberg, tr. Edwin Björkman', year: 1889, where: 'A one-act play, Tekla and Gustav in the hotel parlor', language: 'prose', size: 'long', genre: 'drama', difficulty: 3,
    summary: 'In a seaside hotel Tekla meets Gustav, the first husband she left, for the first time in years. He flatters her, recalls their marriage in that same room and draws her into a rendezvous at nine, while Adolph, her husband, listens from the next room as Gustav arranged; then Gustav tells her it was his revenge.',
    circumstances: [
      yes('hotel', 'The parlor of a summer hotel by the sea, the room they lived in when they were first married; Adolph is at the keyhole next door'),
      no('home', 'Their old home in town, years ago', 'It’s the hotel; their marriage is over, and she’s married to Adolph now.'),
      no('crowded', 'A dining room full of guests', 'They’re alone but for two lady tourists who look in at the door and the waiter Gustav rings for.'),
    ],
    relationship: [
      yes('former', 'Former husband and wife; she left him for Adolph, and he has come to collect'),
      no('strangers', 'Strangers who meet at the hotel', 'He was her first husband; she still wears the earrings he gave her.'),
      no('siblings', 'Brother and sister', '“Little brother” is what she calls Adolph; Gustav was her husband.'),
    ],
    roles: [
      {
        name: 'Tekla',
        objective: [
          yes('forgiven', 'Be forgiven and admired by the man she left', 'She asks him to stay, asks whether he can forgive her, and says she has never liked exchanging ideas with anyone so much.'),
          yes('conquest', 'Prove she can still make a conquest', 'She tells him her young husband says she can make no more conquests, and then names the hour.'),
          no('reconcile', 'Bring Gustav and Adolph together as friends', 'She speaks of that dream, but what she does is make an assignation with Gustav behind Adolph’s back.'),
        ],
        obstacle: [
          yes('gustav', 'Gustav is cleverer than she is and has planned every move, and she still loves Adolph'),
          no('watched', 'Adolph is in the room with them', 'He has gone out; he listens from the next room, and she guesses it only at the end.'),
          no('career', 'Gustav threatens her career as a writer', 'Her books aren’t what he’s after; he says he came to take her honor, as she took his.'),
        ],
        tactic: [
          yes('flatter', 'Flatter him: his tact, his politeness, his honest nature'),
          yes('share', 'Share memories: the colors he chose for her, the earrings she still wears'),
          no('refuse', 'Refuse him from the start', 'She refuses the farewell at first, then names the hour: “At nine!”'),
        ],
      },
      {
        name: 'Gustav',
        objective: [
          yes('revenge', 'Take back his honor by taking hers', 'He tells her she stole his honor, and he could recover it only by taking hers.'),
          yes('expose', 'Show Adolph what she is, with Adolph listening', 'He arranged for Adolph to watch from the next room, and uses Adolph’s torn photograph of her against her.'),
          no('remarry', 'Win her back as his wife', 'Once she has named the hour he asks for his bill, to leave by the eight o’clock boat.'),
        ],
        obstacle: [
          yes('loyal', 'She still feels for Adolph, and won’t wrong him at first', 'She says it wouldn’t be right to him; she thinks he still loves her.'),
          no('unknown', 'She doesn’t recognize him', 'She knows him at once: “Oh, is it you?”'),
          no('seen', 'He’s afraid of being seen with her', 'He wants it seen; he tells her the world, in two lady tourists, has watched her make up with her first husband.'),
        ],
        tactic: [
          yes('humble', 'Play the humble, insignificant man who has suffered'),
          yes('memory', 'Remind her of their marriage in that same room, then put his arm around her'),
          no('threaten', 'Threaten her openly from the start', 'He opens with apologies and compliments, and shows his hand only once she has agreed.'),
        ],
      },
    ],
  },
  {
    id: 'anna-christie-1', play: 'Anna Christie', by: 'Eugene O’Neill', year: 1921, where: 'Act One, the back room of Johnny-the-Priest’s saloon', language: 'prose', size: 'medium', genre: 'drama', difficulty: 2,
    summary: 'Anna, twenty, comes into a waterfront saloon to meet the father she hasn’t seen since she was a child. Marthy, the woman who has been living with him on his barge, guesses who she is, keeps it to herself, and hears the truth Anna has kept from him: the cousins’ farm, the youngest son, and the house in St. Paul.',
    circumstances: [
      yes('saloon', 'Late afternoon on a fall day in the back room of a saloon near South Street; Anna is off the train from St. Paul, and Chris has gone out to eat and sober up'),
      no('barge', 'Aboard Chris’s coal barge', 'That’s Act Two; Anna hasn’t seen the barge yet.'),
      no('farm', 'The Minnesota farm where Anna grew up', 'She has come east from St. Paul; the farm is what she tells Marthy about.'),
    ],
    relationship: [
      yes('strangers', 'Strangers in a saloon, a young prostitute and an old waterfront woman; Marthy has been living with Anna’s father, and Anna doesn’t know it'),
      no('mother', 'Mother and daughter', 'Marthy is no relation; she has been living with Chris on his barge.'),
      no('old-friends', 'Old friends from the same house in St. Paul', 'They meet here for the first time; Marthy has lived with barge men for twenty years.'),
    ],
    roles: [
      {
        name: 'Anna',
        objective: [
          yes('rest', 'Find out what her father is like, and whether he’ll stake her to a rest', 'She asks Marthy what kind he is, and hopes he’ll stake her to a room and meals till she’s rested.'),
          yes('company', 'Have someone to talk to after two days alone', 'She asks Marthy to come and sit with her; she hasn’t spoken to anyone since the day before yesterday.'),
          no('stay', 'Settle on the barge with her father', 'When she hears he lives on a coal barge she says, “Me? On a dirty coal barge!”'),
        ],
        obstacle: [
          yes('men', 'Her hatred of men, which she expects her father to prove right'),
          no('police', 'The police are after her', 'She served her thirty days, and has been out of the hospital two weeks.'),
          no('rival', 'She knows Marthy is her father’s woman and resents her', 'Anna has no idea; Marthy keeps it to herself and leaves before Chris comes in.'),
        ],
        tactic: [
          yes('hard', 'Come on hard: size Marthy up, and tell her she’s Anna forty years from now'),
          yes('confide', 'Confide in her once a drink has warmed her: the farm, the raid, the hospital'),
          no('nurse', 'Keep up the story that she’s a nurse girl', 'That’s the story she has written to her father; to Marthy she tells the truth.'),
        ],
      },
      {
        name: 'Marthy',
        objective: [
          yes('size-up', 'Find out who the girl is and what she has been', 'She guesses from “St. Paul,” and looks her over until Anna asks what’s wrong with her.'),
          yes('smooth', 'Make things easier for Chris and his girl', 'She tells Anna her father is as good an old guy as ever walked, and tells Chris to treat her right.'),
          no('keep', 'Keep Chris for herself', 'She has already told Chris she’ll pack up and leave the barge before his daughter comes.'),
        ],
        obstacle: [
          yes('secret', 'She can’t say who she is without telling Anna she has been living with her father'),
          no('present', 'Chris is at the table with them', 'Chris has gone out for a meal to sober up, and comes back only at the end.'),
          no('rude', 'Anna won’t talk to her', 'Anna invites her over and buys her a drink.'),
        ],
        tactic: [
          yes('evade', 'Evade, and steer the talk back to Anna'),
          yes('vouch', 'Vouch for Chris: he thinks the world of her'),
          no('lecture', 'Lecture her about her life', 'She lets her talk, and tells her she has only had a run of bad luck with men.'),
        ],
      },
    ],
  },
  // From the limitations pass of 2026-10-11: three more, checked against the texts on Project Gutenberg (Archer's
  // Ghosts, Gosse and Archer's The Master Builder, Synge's Riders to the Sea). Translations are paraphrased, not quoted.
  {
    id: 'ghosts-1', play: 'Ghosts', by: 'Henrik Ibsen, tr. William Archer', year: 1881, where: 'Act One, the garden room at Rosenvold', language: 'prose', size: 'long', genre: 'drama', difficulty: 3,
    summary: 'On the eve of the orphanage’s dedication to her late husband’s memory, Pastor Manders reproaches Mrs. Alving for her books, for once fleeing her marriage to him, and for sending her son away. She answers with what he never knew: her husband died as dissolute as he lived, and she built the orphanage with his money so that her son would inherit nothing from him.',
    circumstances: [
      yes('eve', 'A wet day at Rosenvold, the eve of the orphanage’s dedication; Oswald just home from Paris', 'Manders has come for the dedication, and rain has set in.'),
      no('fire', 'The night the orphanage burns', 'That’s later; here it’s still to be dedicated.'),
      no('wedding', 'The first year of her marriage', 'That’s what they remember; the scene is twenty-odd years on.'),
    ],
    relationship: [
      yes('old-friends', 'Old friends: she once fled her marriage to him, and he sent her home to her duty', 'He calls it the greatest victory of his life that he sent her back.'),
      no('lovers', 'Declared lovers', 'Nothing was ever declared between them.'),
      no('strangers', 'A pastor and a parishioner who barely know each other', 'He was her husband’s friend and has advised her for years.'),
    ],
    roles: [
      {
        name: 'Mrs. Alving',
        objective: [
          yes('truth', 'Make him hear the truth about her marriage', 'She tells him her husband was a profligate to the end.'),
          yes('free', 'Free herself of the lie she has kept up for her son'),
          no('forgive', 'Win his forgiveness for leaving her husband', 'She answers his reproaches; she doesn’t ask to be forgiven.'),
        ],
        obstacle: [
          yes('duty', 'His faith in duty and in appearances'),
          yes('years', 'Years of silence that she has to break'),
          no('oswald', 'Oswald is in the room', 'Oswald has gone out; they hear him only at the end.'),
        ],
        tactic: [
          yes('facts', 'Tell it plainly, fact by fact'),
          yes('turn', 'Turn his reproaches back on him'),
          no('sermon', 'Preach to him', 'He preaches; she tells him what happened.'),
        ],
      },
      {
        name: 'Pastor Manders',
        objective: [
          yes('duty', 'Recall her to her duty', 'He reproaches her for the books she reads and the son she sent away.'),
          yes('respectable', 'Keep the dedication respectable'),
          no('court', 'Court her again', 'He is shocked by any hint of that time.'),
        ],
        obstacle: [
          yes('facts', 'Facts he never knew, which she lays before him'),
          no('bishop', 'The bishop is listening', 'They’re alone.'),
        ],
        tactic: [
          yes('sermon', 'Preach'),
          yes('memory', 'Recall what he did for her, as his triumph'),
          no('laugh', 'Laugh it off', 'He is appalled.'),
        ],
      },
    ],
  },
  {
    id: 'masterbuilder-1', play: 'The Master Builder', by: 'Henrik Ibsen, tr. Edmund Gosse and William Archer', year: 1892, where: 'Act One, Solness’s house', language: 'prose', size: 'long', genre: 'drama', difficulty: 3,
    summary: 'Hilda Wangel, a young stranger with an alpenstock, arrives at the master builder’s house. She reminds Solness of the day ten years ago at Lysanger when he hung the wreath on the church tower he had built, kissed the little girl she was, and promised to come back in ten years and carry her off and give her a kingdom. The ten years are up, and she has come for it.',
    circumstances: [
      yes('arrival', 'Solness’s house, the evening she arrives with her knapsack and alpenstock', 'She has come straight from the mountains.'),
      no('tower', 'The day he climbs the new tower', 'He climbs the new tower in the last act.'),
      no('lysanger', 'The church at Lysanger, ten years ago', 'That’s what she remembers; the scene is now.'),
    ],
    relationship: [
      yes('met-once', 'A girl he met once, ten years ago, at a church’s dedication'),
      no('daughter', 'His daughter', 'She is the district doctor’s daughter from Lysanger.'),
      no('rivals', 'A rival architect', 'His rival is young Ragnar; Hilda is no builder.'),
    ],
    roles: [
      {
        name: 'Hilda',
        objective: [
          yes('kingdom', 'Claim the kingdom he promised her'),
          yes('remember', 'Make him remember'),
          no('job', 'Find work in his office', 'She has come for what he promised, not for work.'),
        ],
        obstacle: [
          yes('forgot', 'He says he doesn’t remember'),
          no('father', 'Her father has come to fetch her', 'She has come alone.'),
        ],
        tactic: [
          yes('detail', 'Give him details until he remembers'),
          yes('demand', 'Demand it outright, as owed'),
          no('weep', 'Weep to move him', 'She laughs and insists.'),
        ],
      },
      {
        name: 'Solness',
        objective: [
          yes('youth', 'Keep this youth near him'),
          yes('understand', 'Understand what she wants of him'),
          no('dismiss', 'Send her away at once', 'He asks her to stay.'),
        ],
        obstacle: [
          yes('memory', 'He doesn’t remember, or says he doesn’t'),
          yes('fear', 'His fear of the young knocking at his door'),
          no('debt', 'His debts', 'The scene never mentions any debts.'),
        ],
        tactic: [
          yes('question', 'Question her'),
          yes('admit', 'Admit he must have thought it, and so it was so'),
          no('refuse', 'Refuse to listen', 'He listens closely.'),
        ],
      },
    ],
  },
  {
    id: 'riders-sea', play: 'Riders to the Sea', by: 'J. M. Synge', year: 1904, where: 'The kitchen of a cottage on an island off the west of Ireland', language: 'prose', size: 'short', genre: 'drama', difficulty: 1,
    summary: 'While their mother sleeps, Nora brings in a bundle the young priest gave her: a shirt and a plain stocking taken off a drowned man in Donegal. Their brother Michael has been lost at sea, and their other brother Bartley means to sail to the horse fair at Galway. The sisters hide the bundle from their mother; later, alone, they open it and know the stocking by Nora’s own stitches.',
    circumstances: [
      yes('kitchen', 'A cottage kitchen on an island off the west of Ireland, their mother asleep within, a wind rising', 'Cathleen is at her work when Nora comes in.'),
      no('wake', 'Michael’s wake, his body brought home', 'He was found and buried far north in Donegal.'),
      no('fair', 'The fair at Galway', 'Bartley is only setting out for it.'),
    ],
    relationship: [
      yes('sisters', 'Sisters, a brother lost at sea and another about to sail'),
      no('strangers', 'Neighbors', 'They’re sisters in the one house.'),
      no('mother', 'Mother and daughter', 'Maurya is their mother, and she’s lying down in the next room.'),
    ],
    roles: [
      {
        name: 'Cathleen',
        objective: [
          yes('know', 'Know whether it’s Michael’s'),
          yes('spare', 'Spare their mother until they’re sure'),
          no('tell', 'Tell their mother at once', 'They hide the bundle in the turf loft.'),
        ],
        obstacle: [
          yes('mother', 'Their mother may wake and come in'),
          no('priest', 'The priest has forbidden them to open it', 'He told them to look.'),
        ],
        tactic: [
          yes('hide', 'Hide it, and keep busy as if nothing has come'),
          yes('compare', 'Compare the cloth with what Michael wore'),
          no('pray', 'Kneel and pray instead of looking', 'They cut the string and look at what is in the bundle.'),
        ],
      },
      {
        name: 'Nora',
        objective: [
          yes('priest', 'Do as the young priest said, and be sure'),
          yes('know', 'Find out whether it’s their brother'),
          no('fair', 'Go to the fair herself', 'She stays home.'),
        ],
        obstacle: [
          yes('fear', 'Her fear of what they’ll find'),
          no('lock', 'The bundle is locked', 'It’s only knotted; they cut the string.'),
        ],
        tactic: [
          yes('stitches', 'Count the stitches of the stocking she knitted'),
          yes('ask', 'Ask her sister what to do'),
          no('burn', 'Burn the bundle', 'They keep it, and keep it hidden.'),
        ],
      },
    ],
  },
];
