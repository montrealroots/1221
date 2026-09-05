/**
 * SLATE — what is actually said in the room.
 *
 * A horror room does not talk like a comedy room. The note a director gives on
 * a procedural is not the note they give on a two-hander about a marriage, and
 * the thing the writer says after a good read on a superhero picture is not
 * what they say after a good read on a period piece.
 *
 * So none of it is a fixed line. Everything spoken here is composed the same
 * way the trade press is composed: a frame, a subject that belongs to this
 * kind of picture, and a tail, drawn from banks that never repeat inside one
 * audition. The counts are multiplied out by `dialogueCombinations`, and the
 * test suite holds the total above ten thousand.
 */

import type { Rng } from '../core/rng';

// ---------------------------------------------------------------------------
// Which room this is
// ---------------------------------------------------------------------------

export type RoomRegister =
  | 'horror' | 'comedy' | 'drama' | 'action' | 'thriller' | 'scifi' | 'fantasy'
  | 'crime' | 'romance' | 'family' | 'period' | 'musical' | 'western' | 'superhero'
  | 'teen' | 'biopic';

const REGISTER_OF: Readonly<Record<string, RoomRegister>> = {
  horror: 'horror', 'psychological horror': 'horror', slasher: 'horror', supernatural: 'horror',
  comedy: 'comedy', satire: 'comedy', 'romantic comedy': 'comedy', mockumentary: 'comedy', sitcom: 'comedy', workplace: 'comedy',
  drama: 'drama', melodrama: 'drama', 'coming of age': 'drama', 'social realism': 'drama',
  action: 'action', adventure: 'action', 'martial arts': 'action', disaster: 'action', war: 'action',
  thriller: 'thriller', mystery: 'thriller', espionage: 'thriller', noir: 'thriller', conspiracy: 'thriller',
  'science fiction': 'scifi', 'sci-fi': 'scifi', cyberpunk: 'scifi', 'space opera': 'scifi', dystopian: 'scifi',
  fantasy: 'fantasy', 'fairy-tale': 'fantasy', 'sword and sorcery': 'fantasy', mythology: 'fantasy',
  crime: 'crime', heist: 'crime', 'true-crime': 'crime', procedural: 'crime', legal: 'crime', gangster: 'crime',
  romance: 'romance', 'romantic drama': 'romance',
  family: 'family', animation: 'family', children: 'family', 'children’s': 'family',
  historical: 'period', biography: 'biopic', epic: 'period', 'period drama': 'period',
  musical: 'musical', concert: 'musical', dance: 'musical',
  western: 'western',
  superhero: 'superhero', 'comic book': 'superhero',
  teen: 'teen', 'high school': 'teen', 'young adult': 'teen',
};

/** The register a picture's genres put the room in. */
export function registerFor(genres: readonly string[]): RoomRegister {
  for (const genre of genres) {
    const hit = REGISTER_OF[genre.toLowerCase()];
    if (hit) return hit;
  }
  return 'drama';
}

// ---------------------------------------------------------------------------
// The universal banks
// ---------------------------------------------------------------------------

/** What somebody says when you come through the door. */
export const GREETINGS: readonly string[] = [
  'Come in, come in. Thanks for waiting.',
  'Hi. Sorry we are running behind.',
  'There you are. Bag anywhere.',
  'Hello. You found us all right?',
  'Come on in. Ignore the camera.',
  'Hi — good to see you again.',
  'Thanks for coming in on short notice.',
  'Right, whenever you are ready.',
  'Hello. Have you got the new pages?',
  'Come through. Do you want water?',
  'Hi. We have got you for about ten minutes.',
  'There she is. Or he is. Whoever we said.',
  'Take your time. We are not in a rush, whatever it looks like.',
  'Hello — sorry, one second, we are just resetting.',
  'Good. Good. Come in, sit, stand, whatever you want.',
  'Hi. You are reading for the one at the airport, yes?',
];

/** What the office says to settle you before it starts. */
export const SETTLES: readonly string[] = [
  'Whenever you are ready.',
  'Take a beat. Start when you want.',
  'We will just roll and you go.',
  'Slate first, and then straight into it.',
  'Do not worry about the camera, it is only for the ones who are not here.',
  'If you want to go again after, you can.',
  'It is a long scene, so do not rush the top of it.',
  'Just to us. Not to the lens.',
  'You can hold the sides. Nobody minds.',
  'We are rolling. In your own time.',
  'If you dry, just pick it up. It is fine.',
  'No pressure, though obviously there is some.',
];

/** What the reader is like, which is out of your hands. */
export const READER_LINES: readonly { floor: number; line: string }[] = [
  { floor: 78, line: 'The reader is an actor, and a good one. They give you something to play against and stay out of your way.' },
  { floor: 58, line: 'The reader is competent and flat, which is the standard and is survivable.' },
  { floor: 38, line: 'The reader is the assistant, reading off a phone, and they come in half a beat late every time.' },
  { floor: 18, line: 'The reader is reading their own lines like a train announcement. You are on your own.' },
  { floor: 0, line: 'The reader keeps losing their place. Twice you have to wait while they find it.' },
];

/** What else is happening in the room while you work. */
export const ROOM_NOISE: readonly string[] = [
  'Somebody behind the table is on their phone and not hiding it.',
  'The camera operator adjusts the frame halfway through and nobody stops.',
  'A phone goes off. Nobody claims it.',
  'Two of them lean in and whisper. It could be about anything.',
  'The director has not looked up from the sides once.',
  'Somebody laughs at the wrong moment and then apologises with their hand.',
  'The producer writes something down and underlines it twice.',
  'Somebody at the back is eating lunch out of a plastic tray.',
  'The air conditioning is fighting the room and winning.',
  'Someone comes in, hands over a piece of paper, and leaves.',
  'The casting director mouths a word to the associate and the associate nods.',
  'Everybody behind the table is looking at you. All of them at once.',
  'The monitor is turned slightly away from you, which is deliberate.',
  'Somebody stretches and it reads as boredom and probably is not.',
  'The room is warm and nobody has said anything for eleven seconds.',
  'A chair scrapes. The reader waits for you to carry on.',
];

/** What they ask you afterwards, and it is not always small talk. */
export const SMALL_TALK: readonly string[] = [
  'What else have you got going on?',
  'Are you around in the spring?',
  'Where are you based at the moment?',
  'How long have you been with your agent?',
  'Did you look at the other scene?',
  'Have you worked with any of this team before?',
  'Is that your real accent?',
  'Do you drive?',
  'What did you make of her?',
  'Anything you want to ask us?',
  'We saw you in something. What was it?',
  'Are you happy with that, or do you want another go?',
  'Would you be all right with the hair for this?',
  'How do you feel about six months in one place?',
  'Do you have any dates we should know about?',
  'Was that how you rehearsed it?',
];

/** How they let you out. */
export const GOODBYES: readonly string[] = [
  'That is lovely, thank you.',
  'Great. Thanks so much for coming in.',
  'Thank you — we will be in touch with your agent.',
  'Good. Really good. Thank you.',
  'Thanks. Mind the step on the way out.',
  'Lovely. We have got what we need.',
  'Thank you. Send our best to your agent.',
  'That is us. Thanks for your time.',
  'Perfect. Thank you.',
  'Thanks. We are seeing people all week, so it will be a bit.',
  'Great, thank you. Do you need the pages back?',
  'Thanks very much. Safe home.',
];

// ---------------------------------------------------------------------------
// The banks that belong to a kind of picture
// ---------------------------------------------------------------------------

/** How the director sets the scene up, in the language of this kind of picture. */
export const SCENE_FRAMES: Readonly<Record<RoomRegister, readonly string[]>> = {
  horror: ['She has heard it twice already and told herself it was nothing.', 'This is the last normal conversation anybody in this film has.', 'He knows the house is wrong and has decided to stay anyway.', 'Nobody in this scene believes her, including her.', 'Everything before this has been a warning she did not take.', 'The thing is in the room with you the whole scene. Do not look at it.', 'They are being watched and they are pretending not to know.', 'This is the scene where the audience decides whether to care when she dies.'],
  comedy: ['He thinks this is going extremely well. It is not.', 'Everybody in this scene wants to leave and nobody will say so.', 'She is the only sane person here, and she is wrong about that.', 'It is a disaster and he is the last to notice.', 'Play it completely straight. The scene is funny; you do not have to be.', 'The lie has got away from him and he is still adding to it.', 'They are both being polite and both furious.', 'This is a man explaining something to somebody who already knows it.'],
  drama: ['They have had this argument before, several times, and this is the last one.', 'Nothing is said here that either of them means.', 'He came to apologise and cannot get the first sentence out.', 'She has already decided to leave before the scene starts.', 'This is the most ordinary Tuesday of their lives and it ends the marriage.', 'Neither of them raises their voice. That is the point.', 'He is asking for money and cannot say the word.', 'It is a scene about a kettle and it is not about a kettle.'],
  action: ['You have thirty seconds before it starts again and you both know it.', 'He is hurt and hiding it from everyone in the room.', 'This is the calm one, and it has to earn the next twenty minutes.', 'She is planning the way out while she is talking.', 'Everybody here has done this before. Nobody is frightened. That is what is frightening.', 'He is giving an order he knows is going to get somebody killed.', 'The adrenaline has gone and the shaking has started.', 'You are lying to keep them moving.'],
  thriller: ['One of you is lying and the audience should not be sure which.', 'She knows and is waiting to see whether he says it.', 'Everything in this conversation is a second conversation.', 'He is being recorded and has just worked that out.', 'You are buying time and you are running out of it.', 'Neither of them can leave the room first.', 'This is the scene where the audience realises they have been watching the wrong person.', 'He is telling the truth and nobody in the film will believe him.'],
  scifi: ['Explain the impossible thing as if you have known it your whole life.', 'She is the only one in the room who understands what has just been said.', 'This technology is as boring to them as a kettle is to us.', 'He is talking to something that is not a person and is being polite about it.', 'It is first contact and the room is not built for it.', 'The rules of this world are strange and you were born in it.', 'She is defending a decision that has killed people and she is right.', 'This is a briefing, and everybody in it is already dead.'],
  fantasy: ['Say the impossible name as if it is somebody you grew up with.', 'The oath matters here. Words bind people in this world.', 'She is the last one who remembers how it used to be.', 'He is a king and he is exhausted and he cannot say so.', 'This is a scene about duty and it must not sound like one.', 'The magic costs something and it has already cost you.', 'You are being asked for something you cannot give.', 'It is an ordinary conversation between two people who could level a city.'],
  crime: ['Nobody in this room says what they mean and everybody understands.', 'He is being told he is finished and it takes four minutes to get there.', 'This is business. It is only business until it stops being.', 'She is a lawyer and she is asking a question she knows the answer to.', 'He is confessing and he thinks he is negotiating.', 'The threat is never made out loud.', 'Two professionals, one problem, and one of them is not going home.', 'It is an interview room and you have been in a lot of them.'],
  romance: ['They have not admitted it to themselves yet, let alone each other.', 'He is saying goodbye and pretending it is a hello.', 'It is the last five minutes before everything changes.', 'She is trying to be funny because the alternative is crying.', 'Neither of them touches. That is the scene.', 'They have known each other eleven years and this is the first honest conversation.', 'He is being kind and it is worse than if he were cruel.', 'This is the one where the audience should hold their breath.'],
  family: ['Play it for the child in the audience and the parent behind them at once.', 'He is being brave and he is nine.', 'She is explaining a hard thing simply and getting it slightly wrong.', 'The stakes are enormous and the scene is about a bicycle.', 'Nothing here should ever be arch. Mean it.', 'He is the grown-up and he does not know what to do either.', 'It is warm, and it must not be sweet.', 'The whole family is in the room and only one person is telling the truth.'],
  period: ['Everything is said in the room and the important thing is said in the corridor.', 'She cannot say no and is finding a way to say no.', 'Manners are the weapon here.', 'He is ruined and the room has not been told yet.', 'It is 1911 and neither of them has ever been alone with anybody.', 'The letter changes everything and neither of you mentions the letter.', 'They are talking about the weather and negotiating a marriage.', 'A servant is present the whole time. Play as if they are furniture, and know they are not.'],
  musical: ['The dialogue is the run-up. Land the last line where the song can start.', 'She is the only one in the room not performing.', 'It is the scene before the number and the audience must want the number.', 'Speak it on the rhythm without singing it.', 'He is auditioning inside the film, which is a different thing.', 'The company is behind you and this is your one line alone.', 'The joke lands on the beat or it does not land.', 'It is a love scene and neither of them can sing it yet.'],
  western: ['Say less than you want to. Say it slower than you want to.', 'He has come a very long way to say this.', 'The gun is on the table the whole scene and nobody looks at it.', 'She owns the land and every man in the room is deciding whether that counts.', 'This is a scene about water rights and it is a scene about murder.', 'Two men who like each other, and one of them has to do something about the other.', 'The town has already decided. This is the formality.', 'He is old and it is the first time he has looked it.'],
  superhero: ['The suit is ridiculous and you are going to make the audience believe it.', 'She has powers and a landlord.', 'Play the loss under it. That is the only thing holding this up.', 'He is making a joke because the alternative is thinking about it.', 'It is a briefing about the end of the world and it must be funny.', 'You are the smartest person in the room and the loneliest.', 'The city is watching. So is your mother.', 'The line is enormous. Throw it away.'],
  teen: ['Everything in this scene matters more than anything has ever mattered.', 'He is performing being fine in front of the one person who can tell.', 'It is a corridor conversation and it decides the rest of the year.', 'She is far cleverer than the scene lets her be.', 'Nobody says the thing. They talk about a party instead.', 'It is the first time either of them has been honest and they hate it.', 'Play the age, not the idea of the age.', 'They are seventeen and they are right about everything.'],
  biopic: ['This is the version of him nobody photographed.', 'Do not do the impression. Do the person.', 'She is being interviewed and lying by omission.', 'It is the moment before the thing everybody knows about.', 'He is famous inside the scene and it has cost him this room.', 'You are playing somebody real and the room will forgive an inaccuracy before it forgives a cartoon.', 'This is the private argument behind the public statement.', 'Everybody watching knows how this ends. He does not.'],
};

/** The frame of a note: how a director opens an adjustment. */
export const NOTE_FRAMES: readonly string[] = [
  'Do it again, but',
  'Same thing, except',
  'Try one where',
  'Give me a version where',
  'This time,',
  'Have another go, and',
  'Keep all that, but now',
  'Forget everything I just said and play it as if',
  'One more, and',
  'Let us try it where',
  'Take it again from the top, but',
  'Do less, and',
  'Same, faster, and',
  'Now do the one where',
];

/** What the note is about, in the language of this kind of picture. */
export const NOTE_SUBJECTS: Readonly<Record<RoomRegister, readonly string[]>> = {
  horror: ['she already knows what is behind the door', 'he has decided not to run', 'the house is listening', 'you have not slept in four days', 'you are trying not to frighten the child', 'you believe absolutely none of it', 'the fear has already happened and this is after', 'you can smell it', 'you are the only one who can hear it', 'you are apologising to it', 'part of you wants it to happen', 'you have accepted that you are going to die tonight', 'you are lying about what you saw', 'the room is colder than it was', 'you are eight years old for one line'],
  comedy: ['it is the funniest thing that has ever happened to you', 'you are the only serious person alive', 'you have absolutely no idea what any of these words mean', 'you are trying very hard to be liked', 'you have already given up', 'you are furious and being polite', 'you think you are enormously charming', 'you have just realised you are wrong and cannot stop', 'you are doing an impression of a confident person', 'nobody has ever laughed at anything you have said', 'you are explaining it to a child', 'you have been awake for thirty hours', 'you are the last person to understand the joke', 'you are enjoying his discomfort enormously', 'you are trying to leave the entire time'],
  drama: ['he is embarrassed rather than angry', 'she has already forgiven him and has not told him', 'you are asking for help and cannot say so', 'this is the fourth time you have had this conversation', 'you love them and you are finished with them', 'you are performing being fine', 'you have already decided and this is the goodbye', 'nothing you say is what you mean', 'you are ashamed', 'you are relieved and it is horrible', 'you are talking to keep them in the room', 'it is the first time you have said any of this out loud', 'you are certain and you are wrong', 'you have been rehearsing this in the car', 'you are looking after them while you do it'],
  action: ['you are badly hurt and hiding it', 'you have done this a hundred times', 'you are terrified and in charge', 'you are lying to keep them moving', 'you know you are not getting out', 'it is boring to you', 'you are angry at them for making you do it', 'the plan has already failed', 'you are protecting somebody who does not know it', 'you enjoy this and you know you should not', 'you are counting the exits while you talk', 'you have not eaten in two days', 'you are giving an order you will regret', 'somebody you love is behind that door', 'you are out of ammunition and pretending otherwise'],
  thriller: ['you know he is lying and you are letting him', 'you are being recorded', 'you are the one who did it', 'you have three minutes', 'you are testing them with every sentence', 'you already have the answer', 'you are frightened of them and hiding it well', 'the truth would kill somebody', 'you are talking to somebody you may have to kill', 'you have been caught and they have not said so yet', 'you are innocent and it does not matter', 'you are trying to make them angry', 'you are stalling and they know', 'somebody is listening on the other side of the wall', 'you have done this to somebody before'],
  scifi: ['none of this is remarkable to you', 'you understood it before anybody else in the room', 'you are talking to a machine and you like it more than the people', 'you are homesick for a place that no longer exists', 'you have done the arithmetic and the answer is bad', 'you are the last of something', 'this is a language you learned as an adult', 'you have been awake for three years', 'you are frightened of what you built', 'you are explaining it to somebody stupid and being kind about it', 'you are not human and are doing it well', 'gravity is wrong here and your body knows it', 'you have seen the future and it is fine, which is worse', 'you are the only one who remembers the original', 'you are lying to a machine'],
  fantasy: ['the oath is binding and you know it', 'you have carried this for a thousand years', 'the name costs you something to say', 'you are royal and it is a chore', 'you have already lost and are being gracious', 'the magic has taken something and it shows', 'you are speaking to somebody who could kill you with a word', 'this is the last time you will see them', 'you are frightened of your own hands', 'you have been asleep for a very long time', 'you are the only one who does not believe in any of it', 'the prophecy is about you and it is wrong', 'you are lying to a god', 'you are older than the building', 'you have come to say goodbye and cannot'],
  crime: ['you are being fired and you have not worked it out', 'this is business and nothing else', 'you are frightened of him and cannot show it', 'you have already decided to kill him', 'you are wearing a wire', 'you have known each other since you were nine', 'you owe them and you cannot pay', 'you are the police and they have not worked that out', 'you are confessing and calling it negotiating', 'you are protecting somebody who does not deserve it', 'you are the smartest person in the room and it will not help', 'you have done this so often it is dull', 'you are telling the truth for the first time in years', 'you are being offered a way out and it is a trap', 'you have already told them everything'],
  romance: ['you have not admitted it to yourself', 'you are saying goodbye and calling it something else', 'you are trying to be funny to stop crying', 'you are certain they do not feel it', 'this is the last five minutes', 'you have loved them for eleven years', 'you are being kind and it is unbearable', 'you are lying about being over it', 'you are asking them to stay without asking', 'you are relieved it is ending', 'you have just realised, mid-sentence', 'you are talking to keep them from leaving', 'you are pretending this is casual', 'you are furious with them for making you feel it', 'you are letting them go and it is the right thing'],
  family: ['you are the grown-up and you have no idea either', 'you are being brave for somebody smaller', 'you are nine and it is enormous', 'you are explaining something hard and simply', 'you are the one who always gets it wrong', 'you are proud and cannot say it', 'you are frightened and pretending it is a game', 'you have been let down and you are being kind about it', 'you have made a promise you cannot keep', 'it is the most important thing that has happened to you', 'you are telling the truth to an adult who will not like it', 'you are homesick and you are at home', 'you have just been forgiven', 'you are trying to make them laugh', 'nobody has ever asked you that before'],
  period: ['you cannot say no and are saying no', 'the servant can hear everything', 'you are ruined and the room does not know', 'you are the cleverest person here and may not show it', 'you have been in love with them for six years', 'the letter is in your pocket', 'you are negotiating a marriage while discussing the weather', 'manners are the only weapon you have', 'you are the only one in the room who has ever worked', 'you are frightened of your father', 'you have decided to disgrace yourself', 'this is the last time you will be in this house', 'you are much older than you look and much tireder', 'the war has already started and nobody has said it', 'you are being insulted very politely'],
  musical: ['the song is about to start and you can feel it coming', 'you cannot sing and are about to have to', 'you are performing even now', 'you are speaking it on the rhythm', 'the whole company is watching you', 'you are auditioning inside the scene', 'this is the last thing you say before the number', 'you are the only one not enjoying this', 'you are covering for somebody who has forgotten their words', 'you are exhausted and radiant', 'the joke has to land on the beat', 'you have done eight shows this week', 'you have just been fired from the show', 'you are in love with the person you are singing at', 'you are giving the note you were given'],
  western: ['say a third of it', 'you have come three hundred miles for this', 'the gun is on the table', 'you have killed somebody and it did not help', 'you are older than you were last year', 'you like him and you will have to do it anyway', 'this is your land and they know it', 'you have not spoken to anybody in nine days', 'you are dying and it is nobody’s business', 'you are the law and there is no law here', 'you are frightened and it does not show', 'you are being run out of town politely', 'the water is the whole argument', 'you have been waiting eleven years for this conversation', 'you are the last one left'],
  superhero: ['the suit is absurd and you mean every word', 'you are grieving under all of it', 'you are making a joke to avoid a feeling', 'you are the smartest and the loneliest person here', 'the whole city can hear you', 'you have saved everybody and lost the one', 'you do not want this and cannot put it down', 'you are frightened of what you can do', 'throw the enormous line away', 'you are twenty-two and you have a landlord', 'you are lying to somebody you love to protect them', 'you have been doing this too long', 'you are the villain and you are entirely right', 'you have just discovered you can do it', 'you are exhausted by being needed'],
  teen: ['it matters more than anything ever has', 'you are performing being fine at the one person who can tell', 'you are far cleverer than you are allowed to be', 'you have not been asked how you are in months', 'you are furious with somebody you love', 'nobody in your life has ever said sorry to you', 'you are terrified of being ordinary', 'you are in love and it is humiliating', 'you are the only person who knows', 'you are trying to be older than you are', 'you have just been humiliated in front of everyone', 'you are right about all of it and nobody will listen', 'you are protecting a parent', 'it is the first time anybody has been kind to you', 'you have decided to leave and told nobody'],
  biopic: ['do not do the impression, do the person', 'you are famous inside this scene and it is lonely', 'this is the version nobody photographed', 'you are lying by leaving things out', 'you know exactly how you will be remembered', 'you are frightened of being found out', 'you are kinder in private than the record says', 'you have just been told and it has not landed', 'you are performing yourself', 'you are drunk and articulate', 'you are the only one in the room who does not know how this ends', 'you have been misquoted and cannot correct it', 'you are being interviewed and hate it', 'you have already decided to go through with it', 'you are grieving in public'],
};

/** The tail of a note: the thing they add on the end. */
export const NOTE_TAILS: readonly string[] = [
  'and do not show us you know it.',
  'and take all the pauses out.',
  'and keep it off the face.',
  'and go faster than is comfortable.',
  'and do not help us.',
  'and let it be boring for a second.',
  'and do not land the joke.',
  'and stay in the chair.',
  'and mean every word of it.',
  'and give me nothing at the end.',
  'and let them see it once, briefly.',
  'and play the whole thing to the other person.',
  'and do not perform any of it.',
  'and see what happens.',
];

/** What is said after a read, by how it went. */
export const AFTER_READ: Readonly<Record<'strong' | 'fine' | 'weak', readonly string[]>> = {
  strong: [
    'A beat of quiet, and then: "That was really nice."',
    '"Lovely. That is the part." Said quietly, to the table rather than to you.',
    'The director looks up for the first time.',
    '"Where has she been hiding?" — to the casting director, not quite under their breath.',
    '"Do you want to see anything else, or are we all right?"',
    'Somebody writes for a long time after you stop.',
    '"That is what I have been asking for all day."',
    'The writer laughs at a line that is not funny, because you found something in it.',
    '"Can you do that again exactly like that, so we have it?"',
    'Nobody says anything for a second, and the casting director smiles at the floor.',
  ],
  fine: [
    '"Great, thank you."',
    '"Good. Really good." Which means nothing and everybody in the room knows it.',
    'A nod, and a note taken.',
    '"That is useful, thank you."',
    'Somebody checks the schedule.',
    '"Lovely. We have got that."',
    '"Thanks. Let us try one more thing."',
    'A polite pause and a glance between two of them.',
    '"Nice work." The associate is already looking at the door.',
    '"That is exactly what we asked for." Which is not the same as what they wanted.',
  ],
  weak: [
    '"Thank you." Fast, and final.',
    'Somebody looks at the time.',
    '"Great, thanks." The next name is already on the sheet.',
    'The reader closes the sides before you have finished the last line.',
    'A silence that is not the good one.',
    '"Do you want to take a second and go again?" — kindly, which is worse.',
    'Nobody writes anything down.',
    '"Thank you for coming in." The chairs are already moving.',
    'The casting director looks at you a beat too long, disappointed on your behalf.',
    '"We have got what we need." At four minutes.',
  ],
};

// ---------------------------------------------------------------------------
// Composing
// ---------------------------------------------------------------------------

const pick = <T,>(bank: readonly T[], rng: Rng): T => bank[rng.int(0, bank.length - 1)]!;

/** A note from the director, composed for this kind of picture. */
export function noteFor(register: RoomRegister, rng: Rng): string {
  const frame = pick(NOTE_FRAMES, rng);
  const subject = pick(NOTE_SUBJECTS[register], rng);
  const tail = pick(NOTE_TAILS, rng);
  return `${frame} ${subject}, ${tail}`;
}

/** How the director frames the scene before you read it. */
export function sceneFrameFor(register: RoomRegister, rng: Rng): string {
  return pick(SCENE_FRAMES[register], rng);
}

/** What the room says after a read. */
export function afterReadFor(score: number, rng: Rng): string {
  const band = score >= 68 ? 'strong' : score >= 45 ? 'fine' : 'weak';
  return pick(AFTER_READ[band], rng);
}

export function greetingFor(rng: Rng): string { return pick(GREETINGS, rng); }
export function settleFor(rng: Rng): string { return pick(SETTLES, rng); }
export function smallTalkFor(rng: Rng): string { return pick(SMALL_TALK, rng); }
export function goodbyeFor(rng: Rng): string { return pick(GOODBYES, rng); }
export function roomNoiseFor(rng: Rng): string { return pick(ROOM_NOISE, rng); }

/** What the reader is giving you, from how good they are. */
export function readerLineFor(quality: number): string {
  return (READER_LINES.find((r) => quality >= r.floor) ?? READER_LINES[READER_LINES.length - 1]!).line;
}

/**
 * How many distinct things this room can say.
 *
 * Notes multiply out per register; everything else is counted once. The test
 * suite holds the total above ten thousand and checks the notes actually come
 * out distinct rather than merely being able to.
 */
export function dialogueCombinations(): { notes: number; scenes: number; other: number; total: number } {
  const registers = Object.keys(NOTE_SUBJECTS) as RoomRegister[];
  const notes = registers.reduce((sum, r) => sum + NOTE_FRAMES.length * NOTE_SUBJECTS[r].length * NOTE_TAILS.length, 0);
  const scenes = registers.reduce((sum, r) => sum + SCENE_FRAMES[r].length, 0);
  const other = GREETINGS.length + SETTLES.length + SMALL_TALK.length + GOODBYES.length
    + ROOM_NOISE.length + READER_LINES.length
    + AFTER_READ.strong.length + AFTER_READ.fine.length + AFTER_READ.weak.length;
  return { notes, scenes, other, total: notes + scenes + other };
}
