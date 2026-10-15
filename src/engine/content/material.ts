/**
 * SLATE — what a piece of material asks, read from the material itself (from 2026-10-10; `systems/material.ts`).
 *
 * Until then a work's demands came from its genres: every comedy leant responsiveness and execution, every play tagged
 * a farce asked for physical comedy, The Importance of Being Earnest among them, though its comedy is verbal. A
 * genre is a family resemblance, not a specification, and the brief of 2026-10-10 asked for the material to say what
 * it needs. So each scene a course can set and each play a production can cast has a profile here: what its text and
 * its staging ask, each feature with the reason the text gives. A work with a profile is read by it and by nothing
 * genre-wide; a work with none (a self-tape of a genre, with no script in the game) still reads its genre's researched
 * demands, said as genre-wide and uncertain (`content/demands.ts`).
 *
 * The features, each 0 (none asked) to 3 (the material is built on it):
 * - `timing`: exactness of rhythm, cue pick-up and the placing of a line or a beat;
 * - `physical`: the body's work the scene stages: a struggle, a fall, business, a dance;
 * - `partner`: how much the scene is played off the other person, line by line;
 * - `vocal`: size, range or sustained demand on the voice (a song, a lament, a speech over a storm);
 * - `improvisation`: freedom the material leaves to invent in the moment;
 * - `language`: everyday prose, heightened prose (wit, rhetoric, period style) or verse;
 * - `tones`: the scene's tones in order; a change from one to the next is a transition it asks to be played;
 * - `turns`: the emotional reversals within it, beyond its tone changes.
 *
 * `techniques` are the learned techniques the material itself asks, beyond its template's or its play's own
 * (`Template.reads`, `Play.reads`): only what the text requires (a song sung, a verse speech, a dialect written into
 * the lines). `allows` constrains how it can be played (`content/approaches.ts`), only where the text forces it.
 *
 * The levels are SLATE's reading of each text, recorded so they can be argued with; the features and their reasons
 * are what the material establishes, the numbers are not research (docs/research/attributes/
 * research-practice-material.json says what the pedagogy does and doesn't support).
 */

import type { Skill } from './school';

export type Tone = 'comic' | 'grave' | 'lyric' | 'grotesque';
export type Level = 0 | 1 | 2 | 3;
export type Feature = 'timing' | 'physical' | 'partner' | 'vocal' | 'improvisation';
export type Circumstance = 'concealment' | 'intimacy' | 'address' | 'confrontation';
export type Axis = 'pace' | 'scale' | 'structure';
export type AxisValue = 'measured' | 'driven' | 'restrained' | 'expansive' | 'set' | 'open';

export interface MaterialProfile {
  /** A scene's id, or a play's title. */
  id: string;
  title: string;
  /** `voice`: recorded alone at a microphone, a practice brief's narration or animated part (from 2026-10-12). */
  medium: 'stage' | 'camera' | 'voice';
  language: 'everyday' | 'heightened' | 'verse';
  timing: Level;
  physical: Level;
  partner: Level;
  vocal: Level;
  improvisation: Level;
  tones: readonly Tone[];
  turns: number;
  /**
   * A practice brief's beats, in order, each with the tones it plays (from 2026-10-12; `content/briefs/`). Where they're
   * given, a transition is a change of tones from one beat to the next and `turns` isn't read, and a beat with two
   * tones is one held two ways at once (`blendsOf`), which asks something different from a change.
   */
  beats?: readonly { tones: readonly Tone[] }[];
  /**
   * A practice brief's length and what rides on it (from 2026-10-16, `briefMaterial`), which what a piece demands reads
   * (`DEMAND_EFFECT`, `content/approaches.ts`). A scene's and a play's aren't given: a scene is a class scene's length,
   * and a play's night is read as a whole evening by its own task.
   */
  size?: 'short' | 'medium' | 'long';
  stakes?: 0 | 1 | 2 | 3;
  techniques?: Partial<Record<Skill, number>>;
  allows?: Partial<Record<Axis, readonly AxisValue[]>>;
  /**
   * What the scene's circumstances ask of its scale (from 2026-10-16, docs/verification/stage-2026-10-16/), each 0 to
   * 3 as the features are: what a character hides (`concealment`), how private the exchange is (`intimacy`), how far it's
   * spoken to many (`address`), and how far the conflict is brought out loud (`confrontation`). Read from the text,
   * each with its reason; until then a stage scene had no signal for restraint, and every one came out expansive.
   */
  circumstances?: Partial<Record<Circumstance, Level>>;
  /** Why, feature by feature, from the text. */
  why: Partial<Record<Feature | Circumstance | 'language' | 'tones' | 'turns' | 'techniques' | 'allows', string>>;
}

const m = (p: Omit<MaterialProfile, 'medium' | 'improvisation'> & Partial<Pick<MaterialProfile, 'medium' | 'improvisation'>>): MaterialProfile => ({ medium: 'stage', improvisation: 0, ...p });

/** The scenes a course can set (`content/scenes-*.ts`), by id. */
export const SCENE_MATERIAL: readonly MaterialProfile[] = [
  m({ id: 'seagull-4', title: 'The Seagull', language: 'everyday', timing: 1, physical: 1, partner: 3, vocal: 1, tones: ['grave', 'lyric', 'grave'], turns: 3,
    circumstances: { intimacy: 2 }, why: { intimacy: 'Konstantin’s study at night, the storm outside: two people who were young together, alone.', partner: 'Nina and Konstantin play every line off each other: his pleading, her refusals, her memory of him.', tones: 'She breaks into the lines of his old play ("Men, lions, eagles…") between the present-tense despair.', turns: 'She arrives, collapses, rallies, and leaves; he hopes, is refused, and is left.' } }),
  // The scene is Nora and Helmer's last (`content/coursework.ts`); until 2026-10-11 its profile described Nora and
  // Krogstad's bargaining in the first act, and the reasons it gave weren't this scene's.
  m({ id: 'dollhouse-3', title: 'A Doll’s House', language: 'everyday', timing: 1, physical: 1, partner: 3, vocal: 1, tones: ['grave'], turns: 2,
    circumstances: { intimacy: 2, confrontation: 1 }, why: { intimacy: 'Husband and wife alone after the party, sitting down to talk.', confrontation: 'A reckoning, but a talk: Nora sits him down and answers each appeal.', partner: 'Nora sits Helmer down for their first serious talk in eight years, and answers each of his appeals in turn.', turns: 'Once the wonderful thing hasn’t happened, Nora moves from waiting to reckoning to leaving; Helmer from forgiveness to pleading.' } }),
  m({ id: 'earnest-2', title: 'The Importance Of Being Earnest', language: 'heightened', timing: 3, physical: 0, partner: 2, vocal: 1, tones: ['comic'], turns: 1, techniques: { comedy: 1 },
    circumstances: { concealment: 2, confrontation: 1 }, why: { concealment: 'The war is waged under the tea-table manners: hostility in perfect politeness.', confrontation: 'It breaks surface once each learns the other is engaged to Ernest.', timing: 'Wilde’s epigrams land only on an exact rhythm: the joke is in the placing of the inversion.', language: 'Epigrammatic, balanced prose: verbal wit, not physical business.', techniques: 'Its comedy is verbal timing, which comic technique trains.' } }),
  m({ id: 'vanya-2', title: 'Uncle Vanya', language: 'everyday', timing: 1, physical: 0, partner: 3, vocal: 0, tones: ['grave', 'lyric'], turns: 2,
    circumstances: { intimacy: 3 }, why: { intimacy: 'The small hours, two women making up and trading a confidence.', partner: 'Sonya and Yelena reach each other across the night, a confidence traded for a confidence.', tones: 'Their quarrel softens into a shared longing and a wish for music.' } }),
  m({ id: 'trifles', title: 'Trifles', language: 'everyday', timing: 1, physical: 2, partner: 2, vocal: 0, tones: ['grave'], turns: 1,
    circumstances: { concealment: 3, intimacy: 2 }, why: { concealment: 'They hide the bird from the men searching upstairs; the agreement is never spoken.', intimacy: 'Two women alone in the kitchen, the men overhead.', physical: 'Mrs. Hale and Mrs. Peters find the evidence in objects handled on stage: the quilt, the box, the bird.', partner: 'Mrs. Hale and Mrs. Peters come to an unspoken agreement.' } }),
  m({ id: 'julie', title: 'Miss Julie', language: 'everyday', timing: 1, physical: 2, partner: 3, vocal: 1, tones: ['grave'], turns: 3, techniques: { intimacy: 1 },
    circumstances: { intimacy: 2, confrontation: 2 }, why: { intimacy: 'The kitchen at night, a seduction.', confrontation: 'Command and contempt, the power changing hands out loud.', partner: 'Julie and Jean shift power with every exchange.', physical: 'Strindberg stages the kiss and the boot-polishing; the bodies carry the class struggle.', techniques: 'Strindberg stages physical intimacy between them.', turns: 'Flirtation, domination, seduction, contempt.' } }),
  m({ id: 'cherry-orchard-4', title: 'The Cherry Orchard', language: 'everyday', timing: 2, physical: 1, partner: 2, vocal: 0, tones: ['comic', 'grave'], turns: 1,
    circumstances: { concealment: 3, intimacy: 2 }, why: { concealment: 'The proposal everyone has arranged is never spoken; they talk of a lost thing and the weather.', intimacy: 'Left alone on purpose, in the emptied house.', timing: 'Lopakhin’s proposal never comes: the comedy and the pain are in the pauses and the interruptions.', tones: 'Chekhov called it a comedy; the scene is awkward, funny and heartbreaking at once.' } }),
  m({ id: 'pygmalion-4', title: 'Pygmalion', language: 'heightened', timing: 2, physical: 1, partner: 3, vocal: 1, tones: ['comic', 'grave'], turns: 2,
    circumstances: { intimacy: 1, confrontation: 3 }, why: { intimacy: 'Late, the two of them left in the laboratory.', confrontation: 'She has it out with him and throws his slippers.', partner: 'Eliza and Higgins have it out; she throws his slippers at him.', tones: 'Shaw’s wit turns to Eliza’s real grievance.', language: 'Shavian rhetoric, argued at speed.' } }),
  m({ id: 'playboy-3', title: 'The Playboy Of The Western World', language: 'heightened', timing: 2, physical: 1, partner: 3, vocal: 1, tones: ['comic', 'lyric'], turns: 1, techniques: { accents: 1 },
    circumstances: { intimacy: 2 }, why: { intimacy: 'Left alone in the shebeen, courting.', language: 'Synge’s rhythmic Hiberno-English is written into the lines.', techniques: 'Its dialect is the text, not an overlay: its music has to be spoken.', tones: 'Christy’s courtship of Pegeen turns from bragging to lyric.' } }),
  m({ id: 'machinal-2', title: 'Machinal', language: 'everyday', timing: 3, physical: 1, partner: 2, vocal: 0, tones: ['grotesque', 'grave'], turns: 1, allows: { structure: ['set'] },
    circumstances: { concealment: 2, intimacy: 2 }, why: { concealment: 'She doesn’t love him and is afraid, and can’t say it to a mother who wants the match.', intimacy: 'Mother and daughter at home in the evening.', timing: 'Treadwell writes clipped, repeated phrases in a mechanical rhythm.', allows: 'Expressionist, the text fixes its rhythm on the page; played open it loses the machine the play is about.', tones: 'A comic-grotesque office routine gives way to the Young Woman’s dread.' } }),
  m({ id: 'muchado-4-1', title: 'Much Ado About Nothing', language: 'verse', timing: 2, physical: 0, partner: 3, vocal: 1, tones: ['grave', 'comic', 'grave'], turns: 2, techniques: { classical: 1 },
    circumstances: { intimacy: 2, confrontation: 2 }, why: { intimacy: 'Alone in the church after the wedding has broken up.', confrontation: '"Kill Claudio": the demand is made outright.', language: 'Prose in the church scene, but period wit and rhetoric throughout.', tones: 'Beatrice and Benedick confess their love minutes after the wedding collapses, then "Kill Claudio."', techniques: 'Period text spoken at speed asks classical technique.' } }),
  m({ id: 'romeo-2-2', title: 'Romeo And Juliet', language: 'verse', timing: 1, physical: 1, partner: 3, vocal: 2, tones: ['lyric'], turns: 1, techniques: { classical: 1 },
    circumstances: { intimacy: 2, concealment: 1 }, why: { intimacy: 'Night, a vow between two people who must not be heard.', concealment: 'He hides in the orchard of his family’s enemy; the Nurse keeps calling.', vocal: 'At the balcony, sustained lyric verse spoken across a distance.', partner: 'Romeo and Juliet finish each other’s thoughts in shared lines.' } }),
  m({ id: 'macbeth-1-7', title: 'Macbeth', language: 'verse', timing: 2, physical: 0, partner: 3, vocal: 1, tones: ['grave'], turns: 2, techniques: { classical: 1 },
    circumstances: { concealment: 3, intimacy: 3 }, why: { concealment: 'Murder planned under the king’s roof, with the supper going on next door.', intimacy: 'Husband and wife alone, outside the feast.', partner: 'Lady Macbeth turns his refusal around in a rapid exchange.', timing: 'Shared lines leave no pause between "If we should fail?" and "We fail!"' } }),
  m({ id: 'twelfth-1-5', title: 'Twelfth Night', language: 'verse', timing: 2, physical: 0, partner: 3, vocal: 1, tones: ['comic', 'lyric'], turns: 2, techniques: { classical: 1 },
    circumstances: { concealment: 2, intimacy: 1 }, why: { concealment: 'Viola disguised as a page; Olivia veiled, then falling for the messenger.', intimacy: 'Olivia sends her women away to hear him alone.', tones: 'Comedy in the page’s rehearsed speech gives way to the "willow cabin."', turns: 'Olivia’s scorn turns to fascination.' } }),
  m({ id: 'shrew-2-1', title: 'The Taming Of The Shrew', language: 'verse', timing: 3, physical: 2, partner: 3, vocal: 1, tones: ['comic'], turns: 1, techniques: { classical: 1 },
    circumstances: { confrontation: 3 }, why: { confrontation: 'A wrestling match in words and blows; she strikes him.', timing: 'Stichomythic punning: every line is a riposte to the one before.', physical: 'She strikes him; the scene is a wrestling match in words and blows.' } }),
  m({ id: 'scandal-2-1', title: 'The School For Scandal', language: 'heightened', timing: 3, physical: 0, partner: 3, vocal: 1, tones: ['comic'], turns: 1, techniques: { comedy: 1 },
    circumstances: { intimacy: 1, confrontation: 2 }, why: { intimacy: 'Husband and wife at home.', confrontation: 'A marital quarrel fought in comebacks.', language: 'Sheridan’s prose comedy of manners, written in balanced, polished retorts.', timing: 'Their marital quarrel is a duel of exact comebacks.' } }),
  m({ id: 'richard3-1-2', title: 'Richard III', language: 'verse', timing: 2, physical: 1, partner: 3, vocal: 2, tones: ['grave', 'grotesque'], turns: 3, techniques: { classical: 2 },
    circumstances: { address: 1, confrontation: 3, concealment: 2 }, why: { address: 'A street, the coffin and its bearers stopped, others standing by.', confrontation: 'Curses, spitting, the sword offered.', concealment: 'Richard woos with a purpose he never shows her.', turns: 'Curses, spitting, the offered sword, the ring: Anne moves from hatred to acceptance in one scene.', vocal: 'Formal curses and rapid stichomythia.', techniques: 'Its rhetoric is built on verse antithesis.' } }),
  m({ id: 'hamlet-3-1', title: 'Hamlet', language: 'verse', timing: 1, physical: 1, partner: 3, vocal: 1, tones: ['grave'], turns: 3, techniques: { classical: 1 },
    circumstances: { concealment: 3, intimacy: 1, confrontation: 2 }, why: { concealment: 'Polonius and the King hide to watch; every line is played for watchers.', intimacy: 'Ophelia alone with him, returning his gifts.', confrontation: '"Get thee to a nunnery" breaks out at her.', turns: 'From the returned gifts to "I loved you once" to "Get thee to a nunnery" to Ophelia alone.' } }),
  m({ id: 'othello-4-3', title: 'Othello', language: 'verse', timing: 1, physical: 1, partner: 2, vocal: 3, tones: ['lyric', 'grave'], turns: 1, techniques: { singing: 1 },
    circumstances: { intimacy: 3, concealment: 1 }, why: { intimacy: 'Two women alone at bedtime, one helping the other undress.', concealment: 'Desdemona’s dread is in the song and the question, not said outright.', vocal: 'Desdemona sings the willow song in the scene.', techniques: 'Sung, and it has to be.', tones: 'A sung lament beside the women’s plain talk about husbands.' } }),
  m({ id: 'measure-2-4', title: 'Measure For Measure', language: 'verse', timing: 2, physical: 1, partner: 3, vocal: 1, tones: ['grave'], turns: 3, techniques: { classical: 2 },
    circumstances: { concealment: 2, intimacy: 2, confrontation: 2 }, why: { concealment: 'Angelo’s offer comes veiled, and "who will believe thee?"', intimacy: 'His own house, the two of them.', confrontation: 'She threatens to expose him.', turns: 'Angelo circles, proposes, is understood, threatens.', techniques: 'Dense argued verse, the logic carried on the line.' } }),
  m({ id: 'antigone-441', title: 'Antigone', language: 'heightened', timing: 1, physical: 0, partner: 2, vocal: 2, tones: ['grave'], turns: 1, techniques: { classical: 1 },
    circumstances: { address: 3, confrontation: 3 }, why: { address: 'Before the palace, the elders of the chorus listening: a public trial.', confrontation: 'She defies the king to his face.', vocal: 'Formal public argument before the palace, sized for an amphitheater.', language: 'Jebb’s formal translation of the agon.' } }),
  m({ id: 'oedipus-300', title: 'Oedipus Tyrannus', language: 'heightened', timing: 2, physical: 0, partner: 3, vocal: 2, tones: ['grave'], turns: 2, techniques: { classical: 1 },
    circumstances: { address: 2, confrontation: 3 }, why: { address: 'Before the palace, the plague-struck city and its elders present.', confrontation: 'Courtesy turns to accusation and counter-accusation.', turns: 'Courtesy, refusal, accusation, counter-accusation.', partner: 'Oedipus drives Teiresias to the truth line by line.' } }),
  m({ id: 'electra-328', title: 'Electra', language: 'heightened', timing: 1, physical: 0, partner: 2, vocal: 2, tones: ['grave'], turns: 1, techniques: { classical: 1 },
    circumstances: { address: 1, intimacy: 1, confrontation: 1 }, why: { address: 'Her mourning is at the palace doors, where it can be heard.', intimacy: 'Two sisters, between themselves.', confrontation: 'She talks her sister out of their mother’s offerings.', vocal: 'Electra’s mourning at the doors is lament.' } }),
  m({ id: 'medea-446', title: 'Medea', language: 'verse', timing: 1, physical: 0, partner: 3, vocal: 2, tones: ['grave'], turns: 1, techniques: { classical: 1 },
    circumstances: { address: 1, confrontation: 3, concealment: 2 }, why: { address: 'Before her house, the women of Corinth by.', confrontation: 'Her list of what she did for him, against his answers.', concealment: 'She has sworn to kill, and keeps it from him.', vocal: 'Medea’s list of what she did for him is a long formal speech.' } }),
  m({ id: 'bacchae-451', title: 'The Bacchae', language: 'verse', timing: 2, physical: 2, partner: 3, vocal: 1, tones: ['grave', 'grotesque'], turns: 1, techniques: { classical: 1 },
    circumstances: { address: 1, confrontation: 2, concealment: 3 }, why: { address: 'Before the castle, the guards bringing him in.', confrontation: 'The king interrogates and punishes.', concealment: 'The god hides who he is behind calm evasions.', physical: 'Bound, the Stranger has; his curl is cut and his staff taken on stage.', tones: 'A god’s calm evasions make the king absurd.' } }),
  m({ id: 'agamemnon-855', title: 'Agamemnon', language: 'verse', timing: 2, physical: 1, partner: 3, vocal: 2, tones: ['grave'], turns: 2, techniques: { classical: 1 },
    circumstances: { address: 3, concealment: 3 }, why: { address: 'A formal public greeting before the palace.', concealment: 'Her welcome hides the murder she has planned.', timing: 'Her long speech, then a quick stichomythic exchange she wins.', vocal: 'A formal public greeting before the palace.' } }),
  m({ id: 'hedda-2', title: 'Hedda Gabler', language: 'everyday', timing: 2, physical: 0, partner: 3, vocal: 0, tones: ['grave'], turns: 2,
    circumstances: { concealment: 3, intimacy: 3 }, why: { concealment: 'Two conversations at once, the real one under cover of the photographs.', intimacy: 'Side by side on the sofa, the others in the next room.', timing: 'Two conversations at once: what they say over the album aloud for the inner room, and under it.', partner: 'Every line is pitched to be overheard or not.' } }),
  m({ id: 'arms-1', title: 'Arms And The Man', language: 'heightened', timing: 2, physical: 2, partner: 3, vocal: 0, tones: ['comic'], turns: 2,
    circumstances: { intimacy: 2, concealment: 2, confrontation: 1 }, why: { intimacy: 'Her bedroom, at night.', concealment: 'She hides the fugitive from the search.', confrontation: 'He mocks the charge she worships.', physical: 'A fugitive at a window, a pistol, the search, the chocolate creams.', language: 'Shaw’s argued comic prose.' } }),
  m({ id: 'proposal', title: 'The Proposal', language: 'everyday', timing: 3, physical: 2, partner: 3, vocal: 2, tones: ['comic'], turns: 1, allows: { pace: ['driven'] },
    circumstances: { confrontation: 3 }, why: { confrontation: 'It ends in shouting over the meadows.', timing: 'Chekhov’s one-act escalates by quickening exchanges over the meadows.', physical: 'Lomov’s palpitations and collapse.', vocal: 'It ends in shouting.', allows: 'A farce that escalates: played measured it never reaches the quarrel the text writes.' } }),
  m({ id: 'windermere-1', title: 'Lady Windermere’s Fan', language: 'heightened', timing: 3, physical: 0, partner: 2, vocal: 0, tones: ['comic', 'grave'], turns: 1, techniques: { comedy: 1 },
    circumstances: { concealment: 2, intimacy: 1 }, why: { concealment: 'Darlington’s compliments carry a warning she doesn’t yet hear.', intimacy: 'Her morning room, the two of them.', timing: 'Darlington’s epigrams against her earnestness.', tones: 'Their banter has a serious edge she hasn’t yet understood.' } }),
  m({ id: 'suppressed-2', title: 'Suppressed Desires', language: 'everyday', timing: 2, physical: 0, partner: 3, vocal: 0, tones: ['comic'], turns: 1,
    circumstances: { intimacy: 2, confrontation: 1 }, why: { intimacy: 'Husband and wife at home at dusk.', confrontation: 'Her own faith turned on her.', timing: 'Satire played straight: Henrietta’s faith in analysis turned on herself.' } }),
  m({ id: 'rising-moon', title: 'The Rising Of The Moon', language: 'heightened', timing: 1, physical: 1, partner: 3, vocal: 2, tones: ['comic', 'lyric', 'grave'], turns: 2, techniques: { singing: 1, accents: 1 },
    circumstances: { concealment: 3, intimacy: 2 }, why: { concealment: 'The ballad singer is the rebel, and hides it until the end.', intimacy: 'Back to back on a barrel, the other police gone.', vocal: 'A ballad singer, singing.', techniques: 'He sings the songs, in the Irish speech Lady Gregory wrote.', tones: 'Banter on the barrel, then the songs of youth, then the reveal.' } }),
  m({ id: 'creditors', title: 'Creditors', language: 'everyday', timing: 2, physical: 1, partner: 3, vocal: 0, tones: ['grave'], turns: 3,
    circumstances: { concealment: 3, intimacy: 2 }, why: { concealment: 'Gustav’s revenge is hidden, and her husband listens next door.', intimacy: 'The hotel parlor, a rendezvous made.', turns: 'Flattery, memory, seduction, then the revenge revealed.', partner: 'Gustav steers her every line.' } }),
  m({ id: 'anna-christie-1', title: 'Anna Christie', language: 'everyday', timing: 1, physical: 0, partner: 2, vocal: 0, tones: ['grave', 'comic'], turns: 1,
    circumstances: { concealment: 2, intimacy: 2 }, why: { concealment: 'Marthy keeps who Anna is to herself; Anna keeps her past from her father.', intimacy: 'The back room, two women talking.', tones: 'Marthy’s rough humor against Anna’s weariness.' } }),
  // From the limitations pass of 2026-10-11, the scenes added then.
  m({ id: 'hamlet-3-4', title: 'Hamlet', language: 'verse', timing: 2, physical: 2, partner: 3, vocal: 2, tones: ['grave'], turns: 3, techniques: { classical: 1, combat: 1 },
    circumstances: { confrontation: 3, intimacy: 1, concealment: 1 }, why: { confrontation: 'Rage, a killing through the arras, the Ghost.', intimacy: 'His mother’s closet.', concealment: 'Polonius hides behind the arras.', physical: 'He runs Polonius through the arras, sits her down by force, and the Ghost enters.', turns: 'Accusation, the killing, the two pictures, the Ghost, her promise.', vocal: 'Rage sustained over long speeches.', techniques: 'A killing through a curtain, staged, and verse driven at full pitch.' } }),
  m({ id: 'caesar-4-3', title: 'Julius Caesar', language: 'verse', timing: 2, physical: 1, partner: 3, vocal: 2, tones: ['grave'], turns: 3, techniques: { classical: 1 },
    circumstances: { confrontation: 3, concealment: 2, intimacy: 2 }, why: { confrontation: 'A quarrel of short, hard exchanges.', concealment: 'Their anger is held down so the armies outside don’t hear.', intimacy: 'Inside the tent, the two of them.', turns: 'Complaint, quarrel, the offered dagger, reconciliation, then Portia’s death told.', partner: 'A quarrel of short, hard exchanges.', vocal: 'Two generals’ anger, held down so the armies outside don’t hear.' } }),
  m({ id: 'caesar-2-1', title: 'Julius Caesar', language: 'verse', timing: 1, physical: 1, partner: 3, vocal: 1, tones: ['grave', 'lyric'], turns: 1, techniques: { classical: 1 },
    circumstances: { intimacy: 3, concealment: 2 }, why: { intimacy: 'Husband and wife in the orchard before dawn.', concealment: 'He hides the conspiracy she asks about.', partner: 'Portia presses and Brutus parries until he gives way.', physical: 'She kneels, and shows the wound in her thigh.' } }),
  m({ id: 'lear-4-7', title: 'King Lear', language: 'verse', timing: 1, physical: 1, partner: 3, vocal: 0, tones: ['lyric', 'grave'], turns: 1, techniques: { classical: 1 },
    circumstances: { intimacy: 3 }, why: { intimacy: 'Quiet: an old man woken to music and his daughter’s kiss.', vocal: 'Quiet: he’s woken with music, and speaks as a man not sure he’s awake.', partner: 'He comes to know her line by line.', tones: 'Grief and tenderness at once.' } }),
  m({ id: 'asyoulike-3-2', title: 'As You Like It', language: 'heightened', timing: 3, physical: 1, partner: 3, vocal: 1, tones: ['comic'], turns: 1, techniques: { comedy: 1 },
    circumstances: { concealment: 2, intimacy: 1 }, why: { concealment: 'Rosalind disguised as Ganymede.', intimacy: 'The forest, the two of them.', timing: 'Rosalind’s prose runs at the speed of her wit, and Orlando has to keep up.', language: 'Shakespeare’s quick comic prose.', techniques: 'A disguise played for comedy, every line a double meaning.' } }),
  m({ id: 'dream-3-2', title: 'A Midsummer Night’s Dream', language: 'verse', timing: 3, physical: 2, partner: 3, vocal: 2, tones: ['comic'], turns: 2, techniques: { comedy: 1, classical: 1 },
    circumstances: { confrontation: 3 }, why: { confrontation: 'Insult answering insult until Hermia goes for her.', timing: 'An escalating quarrel in rhymed verse, insult answering insult.', physical: 'Hermia goes for Helena, and Helena hides behind the men.', turns: 'Friendship recalled, then betrayal, then a brawl over height.' } }),
  m({ id: 'twelfth-2-4', title: 'Twelfth Night', language: 'verse', timing: 1, physical: 0, partner: 3, vocal: 1, tones: ['lyric', 'grave'], turns: 1, techniques: { classical: 1 },
    circumstances: { concealment: 3, intimacy: 2 }, why: { concealment: 'She tells her own love as a sister’s story, in disguise.', intimacy: 'With Orsino after the song.', partner: 'Viola answers Orsino’s boast point for point, telling her love as a sister’s story.', tones: 'Lyric longing under a disguise.' } }),
  m({ id: 'faustus-3', title: 'Doctor Faustus', language: 'verse', timing: 1, physical: 1, partner: 3, vocal: 2, tones: ['grave'], turns: 1, techniques: { classical: 2 },
    circumstances: { confrontation: 1 }, why: { confrontation: 'Faustus’s bravado against the devil’s answers.', vocal: 'Marlowe’s mighty line: Faustus’s bravado against the devil’s grief.', techniques: 'Blank verse at its most rhetorical.', partner: 'Faustus questions; Mephistopheles answers more than he wants to hear.' } }),
  m({ id: 'malfi-1', title: 'The Duchess Of Malfi', language: 'verse', timing: 2, physical: 1, partner: 3, vocal: 1, tones: ['lyric', 'grave'], turns: 2, techniques: { classical: 2 },
    circumstances: { concealment: 3, intimacy: 3 }, why: { concealment: 'A business talk steered to a proposal, the marriage secret.', intimacy: 'Her chamber, her maid behind the arras.', timing: 'She steers a business talk about her will to a proposal, a line at a time.', turns: 'The will, the ring, the proposal, the secret marriage.', techniques: 'Webster’s dense, argued verse.' } }),
  m({ id: 'wayoftheworld-4', title: 'The Way Of The World', language: 'heightened', timing: 3, physical: 0, partner: 3, vocal: 1, tones: ['comic'], turns: 1, techniques: { comedy: 2 },
    circumstances: { concealment: 1, intimacy: 1, confrontation: 1 }, why: { concealment: 'Feeling kept under the terms of a contract.', intimacy: 'The two of them setting the terms.', confrontation: 'Every clause a riposte.', timing: 'The provisos are a contract read aloud as a duel of wit.', language: 'Congreve’s polished Restoration prose.', techniques: 'High comedy of manners: every clause a riposte.' } }),
  m({ id: 'stoops-2', title: 'She Stoops To Conquer', language: 'heightened', timing: 3, physical: 1, partner: 3, vocal: 0, tones: ['comic'], turns: 1, techniques: { comedy: 1 },
    circumstances: { intimacy: 1 }, why: { intimacy: 'A first meeting alone, he unable to look at her.', timing: 'Marlow’s unfinished sentences and Kate’s finishing of them.', physical: 'He can’t raise his eyes to her, and bows himself out.' } }),
  m({ id: 'ghosts-1', title: 'Ghosts', language: 'everyday', timing: 1, physical: 0, partner: 3, vocal: 1, tones: ['grave'], turns: 2,
    circumstances: { concealment: 2, intimacy: 2, confrontation: 2 }, why: { concealment: 'What she kept of her marriage for years, told now.', intimacy: 'The garden room, the pastor and the woman who once fled to him.', confrontation: 'His reproaches and her answers that undo them.', partner: 'His reproaches, and her answers that undo them.', turns: 'From defending herself to telling the whole truth of her marriage.' } }),
  m({ id: 'masterbuilder-1', title: 'The Master Builder', language: 'everyday', timing: 2, physical: 0, partner: 3, vocal: 0, tones: ['comic', 'grave'], turns: 2,
    circumstances: { intimacy: 1, concealment: 1 }, why: { intimacy: 'A stranger come for the promise he made her.', concealment: 'His unease under her playfulness.', partner: 'She leads him back through the day at Lysanger, detail by detail.', tones: 'Her playfulness over his unease.' } }),
  m({ id: 'riders-sea', title: 'Riders To The Sea', language: 'heightened', timing: 1, physical: 1, partner: 2, vocal: 1, tones: ['grave'], turns: 1, techniques: { accents: 1 },
    circumstances: { concealment: 3, intimacy: 3 }, why: { concealment: 'They hide the bundle from their sleeping mother.', intimacy: 'Two sisters whispering in the kitchen.', language: 'Synge’s island speech, written into the lines.', physical: 'The bundle hidden and opened; the stocking’s stitches counted.', techniques: 'The dialect is the text.' } }),
  m({ id: 'orig-night-desk', title: 'The Night Desk', language: 'everyday', timing: 2, physical: 0, partner: 3, vocal: 0, improvisation: 1, tones: ['comic', 'grave'], turns: 1,
    circumstances: { intimacy: 1 }, why: { intimacy: 'Two in the morning across a motel counter.', partner: 'A bargain made line by line across a counter.', tones: 'Comedy in the declined card and the real cold outside.' } }),
  m({ id: 'orig-bed-fourteen', title: 'Bed Fourteen', language: 'everyday', timing: 1, physical: 0, partner: 3, vocal: 0, tones: ['grave'], turns: 2,
    circumstances: { concealment: 3, intimacy: 2 }, why: { concealment: 'What goes in the report, and the mistake she never reported.', intimacy: 'The station in the dead hours.', turns: 'The new nurse’s fear, the charge nurse’s judgment, then her own confession.' } }),
  m({ id: 'orig-what-we-keep', title: 'What We Keep', language: 'everyday', timing: 1, physical: 1, partner: 3, vocal: 0, tones: ['comic', 'grave'], turns: 2,
    circumstances: { intimacy: 2, confrontation: 2 }, why: { intimacy: 'Brother and sister in their father’s apartment.', confrontation: 'They argue over the records.', physical: 'They pack boxes while they argue.', tones: 'Sibling bickering over records until the drawer of postcards.' } }),
  m({ id: 'orig-runway', title: 'Runway', language: 'everyday', timing: 2, physical: 0, partner: 3, vocal: 0, improvisation: 1, tones: ['comic', 'grave'], turns: 1,
    circumstances: { confrontation: 2, concealment: 1 }, why: { confrontation: 'Splitting everything, claim against claim.', concealment: 'The yes already sent by email.', timing: 'Splitting everything to the cent is a comic rhythm of claim and counterclaim.' } }),
  m({ id: 'orig-hundred-questions', title: 'The Hundred Questions', language: 'everyday', timing: 2, physical: 0, partner: 3, vocal: 0, improvisation: 1, tones: ['comic', 'grave'], turns: 1,
    circumstances: { intimacy: 2 }, why: { intimacy: 'A kitchen table on a weeknight, grandmother and grandson.', tones: 'A mock interview is funny until she freezes for real.' } }),
  m({ id: 'orig-office-hours', title: 'Office Hours', language: 'everyday', timing: 1, physical: 0, partner: 3, vocal: 0, tones: ['grave'], turns: 1,
    circumstances: { intimacy: 1, concealment: 1 }, why: { intimacy: 'An empty classroom after the other parents have gone.', concealment: 'What the night shifts cost him, unspoken.', partner: 'A negotiation between two people who want the same thing for the boy.' } }),
  m({ id: 'orig-two-time-zones', title: 'Two Time Zones', language: 'everyday', timing: 2, physical: 0, partner: 3, vocal: 0, tones: ['comic', 'grave'], turns: 2,
    circumstances: { concealment: 3, intimacy: 2 }, why: { concealment: 'Neither will say the one thing the other is waiting for.', intimacy: 'The last night of his visit, her apartment.', timing: 'Each sells their city in turn, a comic rhythm hiding what neither will say.' } }),
  m({ id: 'orig-the-reception', title: 'The Reception', language: 'everyday', timing: 1, physical: 0, partner: 3, vocal: 0, tones: ['grave', 'comic', 'grave'], turns: 2,
    circumstances: { concealment: 2, address: 1, intimacy: 1 }, why: { concealment: 'The grievance under the jokes and the grief.', address: 'A church hall full of mourners.', intimacy: 'Over the coffee urn, the two of them.', tones: 'Old jokes over the coffee urn break through the grief, and the grievance under both.' } }),
];

/** The plays a production casts (`content/plays.ts`), by title. Their techniques are the play's own `reads`. */
export const PLAY_MATERIAL: readonly MaterialProfile[] = [
  m({ id: 'Hedda Gabler', title: 'Hedda Gabler', language: 'everyday', timing: 2, physical: 1, partner: 3, vocal: 1, tones: ['grave'], turns: 2, circumstances: { concealment: 3, intimacy: 2 }, why: { concealment: 'What is withheld between people is the play.', intimacy: 'A drawing room, a few people.', partner: 'Ibsen’s naturalism is played in what is withheld between people.' } }),
  m({ id: 'The Importance Of Being Earnest', title: 'The Importance Of Being Earnest', language: 'heightened', timing: 3, physical: 1, partner: 2, vocal: 1, tones: ['comic'], turns: 1, circumstances: { concealment: 2 }, why: { concealment: 'Everyone keeps a Bunbury; the joke is played with complete seriousness.', timing: 'Verbal comedy, depending on exact delivery; it asks no slapstick.' } }),
  m({ id: 'Woyzeck', title: 'Woyzeck', language: 'everyday', timing: 1, physical: 3, partner: 2, vocal: 1, tones: ['grotesque', 'grave'], turns: 2, circumstances: { confrontation: 2 }, why: { confrontation: 'The Captain’s and the Doctor’s abuse, the fight, the knife.', physical: 'Fragmentary scenes of a body used up: the experiments, the knife.', tones: 'The Doctor and the Captain are grotesques; Woyzeck’s end is tragedy.' } }),
  m({ id: 'Three Sisters', title: 'Three Sisters', language: 'everyday', timing: 2, physical: 0, partner: 3, vocal: 0, tones: ['comic', 'grave', 'lyric'], turns: 3, circumstances: { concealment: 2, intimacy: 2 }, why: { concealment: 'Longings kept under the name day’s talk.', intimacy: 'A family’s house, a family’s rooms.', tones: 'Chekhov’s mixture: the name day’s comedy, the fire, the departure.' } }),
  m({ id: 'Blood Wedding', title: 'Blood Wedding', language: 'heightened', timing: 1, physical: 2, partner: 2, vocal: 2, tones: ['lyric', 'grave'], turns: 2, circumstances: { confrontation: 2, address: 1 }, why: { confrontation: 'A flight and a fight in the forest.', address: 'The wedding’s guests and songs.', vocal: 'Lorca’s songs and verse passages.', physical: 'A flight and a fight in the forest.' } }),
  m({ id: 'The Cherry Orchard', title: 'The Cherry Orchard', language: 'everyday', timing: 2, physical: 1, partner: 2, vocal: 0, tones: ['comic', 'grave'], turns: 2, circumstances: { concealment: 2, intimacy: 1 }, why: { concealment: 'Everything that matters is talked around.', intimacy: 'A family’s house, emptied.', tones: 'A comedy, Chekhov said, about losing everything.' } }),
  m({ id: 'Major Barbara', title: 'Major Barbara', language: 'heightened', timing: 2, physical: 0, partner: 2, vocal: 1, tones: ['comic', 'grave'], turns: 1, circumstances: { address: 2, confrontation: 2 }, why: { address: 'The Salvation Army shelter and its meetings.', confrontation: 'Shaw’s debate argued at length.', language: 'Shaw’s debate, argued at length.' } }),
  m({ id: 'Ghosts', title: 'Ghosts', language: 'everyday', timing: 1, physical: 1, partner: 3, vocal: 1, tones: ['grave'], turns: 3, circumstances: { concealment: 3, intimacy: 2 }, why: { concealment: 'Each act turns on what was hidden.', intimacy: 'Long two-handed reckonings.', partner: 'Long two-handed reckonings: Mrs. Alving with Manders, then with Oswald.', turns: 'Each act turns on a revelation, to the last.' } }),
  m({ id: 'The Wild Duck', title: 'The Wild Duck', language: 'everyday', timing: 2, physical: 1, partner: 3, vocal: 0, tones: ['comic', 'grave'], turns: 2, circumstances: { concealment: 2, intimacy: 1 }, why: { concealment: 'A family living on a lie.', intimacy: 'The Ekdal home.', tones: 'Hjalmar’s self-pity is comic until it kills his daughter.' } }),
  m({ id: 'Spring Awakening', title: 'Spring Awakening', language: 'everyday', timing: 1, physical: 2, partner: 3, vocal: 1, tones: ['lyric', 'grave', 'grotesque'], turns: 3, circumstances: { concealment: 2, confrontation: 1 }, why: { concealment: 'What the adults won’t tell the children.', confrontation: 'The school’s and the parents’ verdicts.', tones: 'Adolescent lyricism, tragedy, and the grotesque adults.' } }),
  m({ id: 'Twelfth Night', title: 'Twelfth Night', language: 'verse', timing: 2, physical: 1, partner: 3, vocal: 2, tones: ['comic', 'lyric', 'grave'], turns: 2, circumstances: { concealment: 2, intimacy: 1 }, why: { concealment: 'A disguise at its center.', intimacy: 'Confidences between the lovers and the servants.', vocal: 'Feste’s songs.', tones: 'Revelry, longing, and Malvolio’s cruelty.' } }),
  m({ id: 'Measure For Measure', title: 'Measure For Measure', language: 'verse', timing: 2, physical: 0, partner: 3, vocal: 1, tones: ['grave', 'comic'], turns: 3, circumstances: { concealment: 2, confrontation: 1 }, why: { concealment: 'A disguised duke and a veiled bargain.', confrontation: 'Isabella’s threat to expose Angelo.', tones: 'A problem play’s grave bargain beside Vienna’s low comedy.' } }),
  m({ id: 'The Winter’s Tale', title: 'The Winter’s Tale', language: 'verse', timing: 1, physical: 1, partner: 2, vocal: 2, tones: ['grave', 'comic', 'lyric'], turns: 3, circumstances: { confrontation: 2, address: 1 }, why: { confrontation: 'Leontes’s jealousy breaks out at the court.', address: 'Hermione’s public trial.', tones: 'Jealous tragedy, the sheep-shearing’s comedy, the statue’s wonder.' } }),
  m({ id: 'Julius Caesar', title: 'Julius Caesar', language: 'verse', timing: 2, physical: 2, partner: 2, vocal: 3, tones: ['grave'], turns: 2, circumstances: { address: 3, confrontation: 2 }, why: { address: 'Two orations in the Forum, to a crowd.', confrontation: 'The assassination, and the generals’ quarrel.', vocal: 'Two orations in the Forum, Brutus’s and Antony’s, to a crowd.', physical: 'The assassination and the battle at Philippi are staged.' } }),
  m({ id: 'A Midsummer Night’s Dream', title: 'A Midsummer Night’s Dream', language: 'verse', timing: 3, physical: 2, partner: 2, vocal: 1, tones: ['comic', 'lyric'], turns: 1, circumstances: { confrontation: 2 }, why: { confrontation: 'The lovers’ quarrels in the wood.', timing: 'The lovers’ quarrels and the mechanicals’ play live on exact comic timing.', physical: 'Chases through the wood, and Pyramus and Thisbe’s deaths, played for laughs.' } }),
  m({ id: 'Macbeth', title: 'Macbeth', language: 'verse', timing: 2, physical: 2, partner: 2, vocal: 2, tones: ['grave'], turns: 2, circumstances: { concealment: 2, confrontation: 2 }, why: { concealment: 'A murder planned and hidden.', confrontation: 'Battles and the final combat.', physical: 'Battles and the final combat are staged.' } }),
  m({ id: 'As You Like It', title: 'As You Like It', language: 'verse', timing: 2, physical: 1, partner: 3, vocal: 1, tones: ['comic', 'lyric'], turns: 1, circumstances: { concealment: 2 }, why: { concealment: 'Rosalind’s wooing of Orlando in disguise.', partner: 'Rosalind’s wooing of Orlando in disguise.' } }),
  m({ id: 'Much Ado About Nothing', title: 'Much Ado About Nothing', language: 'verse', timing: 3, physical: 1, partner: 3, vocal: 1, tones: ['comic', 'grave'], turns: 2, circumstances: { confrontation: 2, concealment: 1 }, why: { confrontation: 'A merry war of wit, and the church.', concealment: 'The overheard plots.', timing: 'A merry war of wit.', tones: 'At the church the comedy turns the comedy grave.' } }),
  m({ id: 'A Doll’s House', title: 'A Doll’s House', language: 'everyday', timing: 1, physical: 2, partner: 3, vocal: 0, tones: ['comic', 'grave'], turns: 3, circumstances: { concealment: 2, intimacy: 2 }, why: { concealment: 'Nora’s secret loan and her play-acting.', intimacy: 'A marriage, in its own home.', physical: 'Nora’s tarantella.', tones: 'Nora’s play-acting gives way to the reckoning.' } }),
  m({ id: 'Uncle Vanya', title: 'Uncle Vanya', language: 'everyday', timing: 2, physical: 1, partner: 3, vocal: 0, tones: ['comic', 'grave'], turns: 2, circumstances: { concealment: 2, intimacy: 2, confrontation: 1 }, why: { concealment: 'Love and resentment kept under the household’s routine.', intimacy: 'An estate’s few people.', confrontation: 'Vanya fires the pistol.', physical: 'Vanya fires the pistol and misses.' } }),
  m({ id: 'Tartuffe', title: 'Tartuffe', language: 'verse', timing: 3, physical: 2, partner: 3, vocal: 1, tones: ['comic'], turns: 1, circumstances: { concealment: 3, confrontation: 1 }, why: { concealment: 'A hypocrite’s mask, and Orgon hidden under the table.', confrontation: 'The family against the impostor.', language: 'Alexandrine couplets in translation.', physical: 'Orgon under the table while Tartuffe seduces Elmire.' } }),
  m({ id: 'An Enemy Of The People', title: 'An Enemy Of The People', language: 'everyday', timing: 1, physical: 1, partner: 2, vocal: 2, tones: ['grave'], turns: 2, circumstances: { address: 3, confrontation: 3 }, why: { address: 'A public meeting, to a hostile crowd.', confrontation: 'Stockmann against the town.', vocal: 'A public meeting: Stockmann addresses a hostile crowd.' } }),
  m({ id: 'The Playboy Of The Western World', title: 'The Playboy Of The Western World', language: 'heightened', timing: 2, physical: 2, partner: 3, vocal: 1, tones: ['comic', 'grotesque', 'grave'], turns: 2, circumstances: { confrontation: 2, address: 1 }, why: { confrontation: 'The loy, the second "killing".', address: 'The village gathered to watch.', physical: 'The loy, the races, the second "killing".', tones: 'Comedy turns savage when the father comes back.' } }),
  m({ id: 'Mrs Warren’s Profession', title: 'Mrs Warren’s Profession', language: 'heightened', timing: 1, physical: 0, partner: 3, vocal: 1, tones: ['grave'], turns: 2, circumstances: { concealment: 2, intimacy: 2, confrontation: 2 }, why: { concealment: 'The mother’s trade, kept from the daughter.', intimacy: 'Mother and daughter.', confrontation: 'They argue the economics of virtue.', partner: 'Mother and daughter argue the economics of virtue.' } }),
  m({ id: 'Miss Julie', title: 'Miss Julie', language: 'everyday', timing: 1, physical: 2, partner: 3, vocal: 1, tones: ['grave'], turns: 3, circumstances: { intimacy: 2, confrontation: 2 }, why: { intimacy: 'The kitchen, the two of them.', confrontation: 'The midsummer struggle, the razor.', physical: 'The midsummer dance, the kiss, the razor.' } }),
  m({ id: 'Trifles', title: 'Trifles', language: 'everyday', timing: 1, physical: 2, partner: 2, vocal: 0, tones: ['grave'], turns: 1, circumstances: { concealment: 3, intimacy: 2 }, why: { concealment: 'The women hide the evidence from the men.', intimacy: 'The kitchen, the two of them.', physical: 'The case is solved through objects handled.' } }),
  m({ id: 'The Bear', title: 'The Bear', language: 'everyday', timing: 3, physical: 3, partner: 3, vocal: 2, tones: ['comic'], turns: 2, allows: { pace: ['driven'] }, circumstances: { confrontation: 3 }, why: { confrontation: 'The shouting, and a duel with pistols.', physical: 'The duel with pistols, the shouting, the furniture.', allows: 'Chekhov’s "joke in one act" accelerates to a duel; played slow it stalls.' } }),
  m({ id: 'A Marriage Proposal', title: 'A Marriage Proposal', language: 'everyday', timing: 3, physical: 2, partner: 3, vocal: 2, tones: ['comic'], turns: 1, allows: { pace: ['driven'] }, circumstances: { confrontation: 3 }, why: { confrontation: 'Quarrels over the meadows and the dogs.', timing: 'The quarrels over the meadows and the dogs escalate by speed.', allows: 'As The Proposal’s scene: measured, it loses its escalation.' } }),
  m({ id: 'Riders To The Sea', title: 'Riders To The Sea', language: 'heightened', timing: 1, physical: 1, partner: 2, vocal: 3, tones: ['grave', 'lyric'], turns: 1, allows: { scale: ['restrained'] }, circumstances: { concealment: 2, intimacy: 2 }, why: { concealment: 'The bundle hidden, the grief held.', intimacy: 'A cottage kitchen.', vocal: 'Maurya’s keening.', allows: 'Synge’s grief is stillness: the keening is held, not displayed.' } }),
  m({ id: 'Salomé', title: 'Salomé', language: 'heightened', timing: 1, physical: 3, partner: 2, vocal: 2, tones: ['lyric', 'grotesque'], turns: 2, circumstances: { address: 1, confrontation: 1 }, why: { address: 'Herod’s court watching the dance.', confrontation: 'Her demand for the head.', physical: 'The dance of the seven veils.', language: 'Wilde’s incantatory, repetitive prose.' } }),
];

export const MATERIAL_BY_ID: Readonly<Record<string, MaterialProfile>> = Object.fromEntries([...SCENE_MATERIAL, ...PLAY_MATERIAL].map((p) => [p.id, p]));

/** A camera's material for a self-tape of a genre: the medium alone is known (`systems/engagement.ts`). */
export const SELF_TAPE_MATERIAL: MaterialProfile = m({
  id: 'self-tape', title: 'A Self-Tape', medium: 'camera', language: 'everyday', timing: 1, physical: 0, partner: 1, vocal: 0, tones: ['grave'], turns: 1, allows: { scale: ['restrained'] },
  why: { allows: 'A close shot magnifies: what reads at the back of a house reads as too much in a frame (Caine, Acting in Film, 1990; research-practice-material.json).', partner: 'A reader off camera, not a scene partner.' },
});
