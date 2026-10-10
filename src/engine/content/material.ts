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
export type Axis = 'pace' | 'scale' | 'structure';
export type AxisValue = 'measured' | 'driven' | 'restrained' | 'expansive' | 'set' | 'open';

export interface MaterialProfile {
  /** A scene's id, or a play's title. */
  id: string;
  title: string;
  medium: 'stage' | 'camera';
  language: 'everyday' | 'heightened' | 'verse';
  timing: Level;
  physical: Level;
  partner: Level;
  vocal: Level;
  improvisation: Level;
  tones: readonly Tone[];
  turns: number;
  techniques?: Partial<Record<Skill, number>>;
  allows?: Partial<Record<Axis, readonly AxisValue[]>>;
  /** Why, feature by feature, from the text. */
  why: Partial<Record<Feature | 'language' | 'tones' | 'turns' | 'techniques' | 'allows', string>>;
}

const m = (p: Omit<MaterialProfile, 'medium' | 'improvisation'> & Partial<Pick<MaterialProfile, 'medium' | 'improvisation'>>): MaterialProfile => ({ medium: 'stage', improvisation: 0, ...p });

/** The scenes a course can set (`content/scenes-*.ts`), by id. */
export const SCENE_MATERIAL: readonly MaterialProfile[] = [
  m({ id: 'seagull-4', title: 'The Seagull', language: 'everyday', timing: 1, physical: 1, partner: 3, vocal: 1, tones: ['grave', 'lyric', 'grave'], turns: 3,
    why: { partner: 'Nina and Konstantin play every line off each other: his pleading, her refusals, her memory of him.', tones: 'She breaks into the lines of his old play ("Men, lions, eagles…") between the present-tense despair.', turns: 'She arrives, collapses, rallies, and leaves; he hopes, is refused, and is left.' } }),
  m({ id: 'dollhouse-3', title: 'A Doll’s House', language: 'everyday', timing: 1, physical: 1, partner: 3, vocal: 1, tones: ['grave'], turns: 2,
    why: { partner: 'Nora and Krogstad bargain line by line over the forged signature.', turns: 'Nora moves from pleading to defiance to fear.' } }),
  m({ id: 'earnest-2', title: 'The Importance Of Being Earnest', language: 'heightened', timing: 3, physical: 0, partner: 2, vocal: 1, tones: ['comic'], turns: 1, techniques: { comedy: 1 },
    why: { timing: 'Wilde’s epigrams land only on an exact rhythm: the joke is in the placing of the inversion.', language: 'Epigrammatic, balanced prose: verbal wit, not physical business.', techniques: 'Its comedy is verbal timing, which comic technique trains.' } }),
  m({ id: 'vanya-2', title: 'Uncle Vanya', language: 'everyday', timing: 1, physical: 0, partner: 3, vocal: 0, tones: ['grave', 'lyric'], turns: 2,
    why: { partner: 'Sonya and Yelena reach each other across the night, a confidence traded for a confidence.', tones: 'Their quarrel softens into a shared longing and a wish for music.' } }),
  m({ id: 'trifles', title: 'Trifles', language: 'everyday', timing: 1, physical: 2, partner: 2, vocal: 0, tones: ['grave'], turns: 1,
    why: { physical: 'Mrs. Hale and Mrs. Peters find the evidence in objects handled on stage: the quilt, the box, the bird.', partner: 'Mrs. Hale and Mrs. Peters come to an unspoken agreement.' } }),
  m({ id: 'julie', title: 'Miss Julie', language: 'everyday', timing: 1, physical: 2, partner: 3, vocal: 1, tones: ['grave'], turns: 3, techniques: { intimacy: 1 },
    why: { partner: 'Julie and Jean shift power with every exchange.', physical: 'Strindberg stages the kiss and the boot-polishing; the bodies carry the class struggle.', techniques: 'Strindberg stages physical intimacy between them.', turns: 'Flirtation, domination, seduction, contempt.' } }),
  m({ id: 'cherry-orchard-4', title: 'The Cherry Orchard', language: 'everyday', timing: 2, physical: 1, partner: 2, vocal: 0, tones: ['comic', 'grave'], turns: 1,
    why: { timing: 'Lopakhin’s proposal never comes: the comedy and the pain are in the pauses and the interruptions.', tones: 'Chekhov called it a comedy; the scene is awkward, funny and heartbreaking at once.' } }),
  m({ id: 'pygmalion-4', title: 'Pygmalion', language: 'heightened', timing: 2, physical: 1, partner: 3, vocal: 1, tones: ['comic', 'grave'], turns: 2,
    why: { partner: 'Eliza and Higgins have it out; she throws his slippers at him.', tones: 'Shaw’s wit turns to Eliza’s real grievance.', language: 'Shavian rhetoric, argued at speed.' } }),
  m({ id: 'playboy-3', title: 'The Playboy Of The Western World', language: 'heightened', timing: 2, physical: 1, partner: 3, vocal: 1, tones: ['comic', 'lyric'], turns: 1, techniques: { accents: 1 },
    why: { language: 'Synge’s rhythmic Hiberno-English is written into the lines.', techniques: 'Its dialect is the text, not an overlay: its music has to be spoken.', tones: 'Christy’s courtship of Pegeen turns from bragging to lyric.' } }),
  m({ id: 'machinal-2', title: 'Machinal', language: 'everyday', timing: 3, physical: 1, partner: 2, vocal: 0, tones: ['grotesque', 'grave'], turns: 1, allows: { structure: ['set'] },
    why: { timing: 'Treadwell writes clipped, repeated phrases in a mechanical rhythm.', allows: 'Expressionist, the text fixes its rhythm on the page; played open it loses the machine the play is about.', tones: 'A comic-grotesque office routine gives way to the Young Woman’s dread.' } }),
  m({ id: 'muchado-4-1', title: 'Much Ado About Nothing', language: 'verse', timing: 2, physical: 0, partner: 3, vocal: 1, tones: ['grave', 'comic', 'grave'], turns: 2, techniques: { classical: 1 },
    why: { language: 'Prose in the church scene, but period wit and rhetoric throughout.', tones: 'Beatrice and Benedick confess their love minutes after the wedding collapses, then "Kill Claudio."', techniques: 'Period text spoken at speed asks classical technique.' } }),
  m({ id: 'romeo-2-2', title: 'Romeo And Juliet', language: 'verse', timing: 1, physical: 1, partner: 3, vocal: 2, tones: ['lyric'], turns: 1, techniques: { classical: 1 },
    why: { vocal: 'At the balcony, sustained lyric verse spoken across a distance.', partner: 'Romeo and Juliet finish each other’s thoughts in shared lines.' } }),
  m({ id: 'macbeth-1-7', title: 'Macbeth', language: 'verse', timing: 2, physical: 0, partner: 3, vocal: 1, tones: ['grave'], turns: 2, techniques: { classical: 1 },
    why: { partner: 'Lady Macbeth turns his refusal around in a rapid exchange.', timing: 'Shared lines leave no pause between "If we should fail?" and "We fail!"' } }),
  m({ id: 'twelfth-1-5', title: 'Twelfth Night', language: 'verse', timing: 2, physical: 0, partner: 3, vocal: 1, tones: ['comic', 'lyric'], turns: 2, techniques: { classical: 1 },
    why: { tones: 'Comedy in the page’s rehearsed speech gives way to the "willow cabin."', turns: 'Olivia’s scorn turns to fascination.' } }),
  m({ id: 'shrew-2-1', title: 'The Taming Of The Shrew', language: 'verse', timing: 3, physical: 2, partner: 3, vocal: 1, tones: ['comic'], turns: 1, techniques: { classical: 1 },
    why: { timing: 'Stichomythic punning: every line is a riposte to the one before.', physical: 'She strikes him; the scene is a wrestling match in words and blows.' } }),
  m({ id: 'scandal-2-1', title: 'The School For Scandal', language: 'heightened', timing: 3, physical: 0, partner: 3, vocal: 1, tones: ['comic'], turns: 1, techniques: { comedy: 1 },
    why: { language: 'Sheridan’s prose comedy of manners, written in balanced, polished retorts.', timing: 'Their marital quarrel is a duel of exact comebacks.' } }),
  m({ id: 'richard3-1-2', title: 'Richard III', language: 'verse', timing: 2, physical: 1, partner: 3, vocal: 2, tones: ['grave', 'grotesque'], turns: 3, techniques: { classical: 2 },
    why: { turns: 'Curses, spitting, the offered sword, the ring: Anne moves from hatred to acceptance in one scene.', vocal: 'Formal curses and rapid stichomythia.', techniques: 'Its rhetoric is built on verse antithesis.' } }),
  m({ id: 'hamlet-3-1', title: 'Hamlet', language: 'verse', timing: 1, physical: 1, partner: 3, vocal: 1, tones: ['grave'], turns: 3, techniques: { classical: 1 },
    why: { turns: 'From the returned gifts to "I loved you once" to "Get thee to a nunnery" to Ophelia alone.' } }),
  m({ id: 'othello-4-3', title: 'Othello', language: 'verse', timing: 1, physical: 1, partner: 2, vocal: 3, tones: ['lyric', 'grave'], turns: 1, techniques: { singing: 1 },
    why: { vocal: 'Desdemona sings the willow song in the scene.', techniques: 'Sung, and it has to be.', tones: 'A sung lament beside the women’s plain talk about husbands.' } }),
  m({ id: 'measure-2-4', title: 'Measure For Measure', language: 'verse', timing: 2, physical: 1, partner: 3, vocal: 1, tones: ['grave'], turns: 3, techniques: { classical: 2 },
    why: { turns: 'Angelo circles, proposes, is understood, threatens.', techniques: 'Dense argued verse, the logic carried on the line.' } }),
  m({ id: 'antigone-441', title: 'Antigone', language: 'heightened', timing: 1, physical: 0, partner: 2, vocal: 2, tones: ['grave'], turns: 1, techniques: { classical: 1 },
    why: { vocal: 'Formal public argument before the palace, sized for an amphitheater.', language: 'Jebb’s formal translation of the agon.' } }),
  m({ id: 'oedipus-300', title: 'Oedipus Tyrannus', language: 'heightened', timing: 2, physical: 0, partner: 3, vocal: 2, tones: ['grave'], turns: 2, techniques: { classical: 1 },
    why: { turns: 'Courtesy, refusal, accusation, counter-accusation.', partner: 'Oedipus drives Teiresias to the truth line by line.' } }),
  m({ id: 'electra-328', title: 'Electra', language: 'heightened', timing: 1, physical: 0, partner: 2, vocal: 2, tones: ['grave'], turns: 1, techniques: { classical: 1 },
    why: { vocal: 'Electra’s mourning at the doors is lament.' } }),
  m({ id: 'medea-446', title: 'Medea', language: 'verse', timing: 1, physical: 0, partner: 3, vocal: 2, tones: ['grave'], turns: 1, techniques: { classical: 1 },
    why: { vocal: 'Medea’s list of what she did for him is a long formal speech.' } }),
  m({ id: 'bacchae-451', title: 'The Bacchae', language: 'verse', timing: 2, physical: 2, partner: 3, vocal: 1, tones: ['grave', 'grotesque'], turns: 1, techniques: { classical: 1 },
    why: { physical: 'Bound, the Stranger has; his curl is cut and his staff taken on stage.', tones: 'A god’s calm evasions make the king absurd.' } }),
  m({ id: 'agamemnon-855', title: 'Agamemnon', language: 'verse', timing: 2, physical: 1, partner: 3, vocal: 2, tones: ['grave'], turns: 2, techniques: { classical: 1 },
    why: { timing: 'Her long speech, then a quick stichomythic exchange she wins.', vocal: 'A formal public greeting before the palace.' } }),
  m({ id: 'hedda-2', title: 'Hedda Gabler', language: 'everyday', timing: 2, physical: 0, partner: 3, vocal: 0, tones: ['grave'], turns: 2,
    why: { timing: 'Two conversations at once: what they say over the album aloud for the inner room, and under it.', partner: 'Every line is pitched to be overheard or not.' } }),
  m({ id: 'arms-1', title: 'Arms And The Man', language: 'heightened', timing: 2, physical: 2, partner: 3, vocal: 0, tones: ['comic'], turns: 2,
    why: { physical: 'A fugitive at a window, a pistol, the search, the chocolate creams.', language: 'Shaw’s argued comic prose.' } }),
  m({ id: 'proposal', title: 'The Proposal', language: 'everyday', timing: 3, physical: 2, partner: 3, vocal: 2, tones: ['comic'], turns: 1, allows: { pace: ['driven'] },
    why: { timing: 'Chekhov’s one-act escalates by quickening exchanges over the meadows.', physical: 'Lomov’s palpitations and collapse.', vocal: 'It ends in shouting.', allows: 'A farce that escalates: played measured it never reaches the quarrel the text writes.' } }),
  m({ id: 'windermere-1', title: 'Lady Windermere’s Fan', language: 'heightened', timing: 3, physical: 0, partner: 2, vocal: 0, tones: ['comic', 'grave'], turns: 1, techniques: { comedy: 1 },
    why: { timing: 'Darlington’s epigrams against her earnestness.', tones: 'Their banter has a serious edge she hasn’t yet understood.' } }),
  m({ id: 'suppressed-2', title: 'Suppressed Desires', language: 'everyday', timing: 2, physical: 0, partner: 3, vocal: 0, tones: ['comic'], turns: 1,
    why: { timing: 'Satire played straight: Henrietta’s faith in analysis turned on herself.' } }),
  m({ id: 'rising-moon', title: 'The Rising Of The Moon', language: 'heightened', timing: 1, physical: 1, partner: 3, vocal: 2, tones: ['comic', 'lyric', 'grave'], turns: 2, techniques: { singing: 1, accents: 1 },
    why: { vocal: 'A ballad singer, singing.', techniques: 'He sings the songs, in the Irish speech Lady Gregory wrote.', tones: 'Banter on the barrel, then the songs of youth, then the reveal.' } }),
  m({ id: 'creditors', title: 'Creditors', language: 'everyday', timing: 2, physical: 1, partner: 3, vocal: 0, tones: ['grave'], turns: 3,
    why: { turns: 'Flattery, memory, seduction, then the revenge revealed.', partner: 'Gustav steers her every line.' } }),
  m({ id: 'anna-christie-1', title: 'Anna Christie', language: 'everyday', timing: 1, physical: 0, partner: 2, vocal: 0, tones: ['grave', 'comic'], turns: 1,
    why: { tones: 'Marthy’s rough humor against Anna’s weariness.' } }),
  m({ id: 'orig-night-desk', title: 'The Night Desk', language: 'everyday', timing: 2, physical: 0, partner: 3, vocal: 0, improvisation: 1, tones: ['comic', 'grave'], turns: 1,
    why: { partner: 'A bargain made line by line across a counter.', tones: 'Comedy in the declined card and the real cold outside.' } }),
  m({ id: 'orig-bed-fourteen', title: 'Bed Fourteen', language: 'everyday', timing: 1, physical: 0, partner: 3, vocal: 0, tones: ['grave'], turns: 2,
    why: { turns: 'The new nurse’s fear, the charge nurse’s judgment, then her own confession.' } }),
  m({ id: 'orig-what-we-keep', title: 'What We Keep', language: 'everyday', timing: 1, physical: 1, partner: 3, vocal: 0, tones: ['comic', 'grave'], turns: 2,
    why: { physical: 'They pack boxes while they argue.', tones: 'Sibling bickering over records until the drawer of postcards.' } }),
  m({ id: 'orig-runway', title: 'Runway', language: 'everyday', timing: 2, physical: 0, partner: 3, vocal: 0, improvisation: 1, tones: ['comic', 'grave'], turns: 1,
    why: { timing: 'Splitting everything to the cent is a comic rhythm of claim and counterclaim.' } }),
  m({ id: 'orig-hundred-questions', title: 'The Hundred Questions', language: 'everyday', timing: 2, physical: 0, partner: 3, vocal: 0, improvisation: 1, tones: ['comic', 'grave'], turns: 1,
    why: { tones: 'A mock interview is funny until she freezes for real.' } }),
  m({ id: 'orig-office-hours', title: 'Office Hours', language: 'everyday', timing: 1, physical: 0, partner: 3, vocal: 0, tones: ['grave'], turns: 1,
    why: { partner: 'A negotiation between two people who want the same thing for the boy.' } }),
  m({ id: 'orig-two-time-zones', title: 'Two Time Zones', language: 'everyday', timing: 2, physical: 0, partner: 3, vocal: 0, tones: ['comic', 'grave'], turns: 2,
    why: { timing: 'Each sells their city in turn, a comic rhythm hiding what neither will say.' } }),
  m({ id: 'orig-the-reception', title: 'The Reception', language: 'everyday', timing: 1, physical: 0, partner: 3, vocal: 0, tones: ['grave', 'comic', 'grave'], turns: 2,
    why: { tones: 'Old jokes over the coffee urn break through the grief, and the grievance under both.' } }),
];

/** The plays a production casts (`content/plays.ts`), by title. Their techniques are the play's own `reads`. */
export const PLAY_MATERIAL: readonly MaterialProfile[] = [
  m({ id: 'Hedda Gabler', title: 'Hedda Gabler', language: 'everyday', timing: 2, physical: 1, partner: 3, vocal: 1, tones: ['grave'], turns: 2, why: { partner: 'Ibsen’s naturalism is played in what is withheld between people.' } }),
  m({ id: 'The Importance Of Being Earnest', title: 'The Importance Of Being Earnest', language: 'heightened', timing: 3, physical: 1, partner: 2, vocal: 1, tones: ['comic'], turns: 1, why: { timing: 'Verbal comedy, depending on exact delivery; it asks no slapstick.' } }),
  m({ id: 'Woyzeck', title: 'Woyzeck', language: 'everyday', timing: 1, physical: 3, partner: 2, vocal: 1, tones: ['grotesque', 'grave'], turns: 2, why: { physical: 'Fragmentary scenes of a body used up: the experiments, the knife.', tones: 'The Doctor and the Captain are grotesques; Woyzeck’s end is tragedy.' } }),
  m({ id: 'Three Sisters', title: 'Three Sisters', language: 'everyday', timing: 2, physical: 0, partner: 3, vocal: 0, tones: ['comic', 'grave', 'lyric'], turns: 3, why: { tones: 'Chekhov’s mixture: the name day’s comedy, the fire, the departure.' } }),
  m({ id: 'Blood Wedding', title: 'Blood Wedding', language: 'heightened', timing: 1, physical: 2, partner: 2, vocal: 2, tones: ['lyric', 'grave'], turns: 2, why: { vocal: 'Lorca’s songs and verse passages.', physical: 'A flight and a fight in the forest.' } }),
  m({ id: 'The Cherry Orchard', title: 'The Cherry Orchard', language: 'everyday', timing: 2, physical: 1, partner: 2, vocal: 0, tones: ['comic', 'grave'], turns: 2, why: { tones: 'A comedy, Chekhov said, about losing everything.' } }),
  m({ id: 'Major Barbara', title: 'Major Barbara', language: 'heightened', timing: 2, physical: 0, partner: 2, vocal: 1, tones: ['comic', 'grave'], turns: 1, why: { language: 'Shaw’s debate, argued at length.' } }),
  m({ id: 'Spring Awakening', title: 'Spring Awakening', language: 'everyday', timing: 1, physical: 2, partner: 3, vocal: 1, tones: ['lyric', 'grave', 'grotesque'], turns: 3, why: { tones: 'Adolescent lyricism, tragedy, and the grotesque adults.' } }),
  m({ id: 'Twelfth Night', title: 'Twelfth Night', language: 'verse', timing: 2, physical: 1, partner: 3, vocal: 2, tones: ['comic', 'lyric', 'grave'], turns: 2, why: { vocal: 'Feste’s songs.', tones: 'Revelry, longing, and Malvolio’s cruelty.' } }),
  m({ id: 'Measure For Measure', title: 'Measure For Measure', language: 'verse', timing: 2, physical: 0, partner: 3, vocal: 1, tones: ['grave', 'comic'], turns: 3, why: { tones: 'A problem play’s grave bargain beside Vienna’s low comedy.' } }),
  m({ id: 'The Winter’s Tale', title: 'The Winter’s Tale', language: 'verse', timing: 1, physical: 1, partner: 2, vocal: 2, tones: ['grave', 'comic', 'lyric'], turns: 3, why: { tones: 'Jealous tragedy, the sheep-shearing’s comedy, the statue’s wonder.' } }),
  m({ id: 'Macbeth', title: 'Macbeth', language: 'verse', timing: 2, physical: 2, partner: 2, vocal: 2, tones: ['grave'], turns: 2, why: { physical: 'Battles and the final combat are staged.' } }),
  m({ id: 'As You Like It', title: 'As You Like It', language: 'verse', timing: 2, physical: 1, partner: 3, vocal: 1, tones: ['comic', 'lyric'], turns: 1, why: { partner: 'Rosalind’s wooing of Orlando in disguise.' } }),
  m({ id: 'Much Ado About Nothing', title: 'Much Ado About Nothing', language: 'verse', timing: 3, physical: 1, partner: 3, vocal: 1, tones: ['comic', 'grave'], turns: 2, why: { timing: 'A merry war of wit.', tones: 'At the church the comedy turns the comedy grave.' } }),
  m({ id: 'A Doll’s House', title: 'A Doll’s House', language: 'everyday', timing: 1, physical: 2, partner: 3, vocal: 0, tones: ['comic', 'grave'], turns: 3, why: { physical: 'Nora’s tarantella.', tones: 'Nora’s play-acting gives way to the reckoning.' } }),
  m({ id: 'Uncle Vanya', title: 'Uncle Vanya', language: 'everyday', timing: 2, physical: 1, partner: 3, vocal: 0, tones: ['comic', 'grave'], turns: 2, why: { physical: 'Vanya fires the pistol and misses.' } }),
  m({ id: 'Tartuffe', title: 'Tartuffe', language: 'verse', timing: 3, physical: 2, partner: 3, vocal: 1, tones: ['comic'], turns: 1, why: { language: 'Alexandrine couplets in translation.', physical: 'Orgon under the table while Tartuffe seduces Elmire.' } }),
  m({ id: 'An Enemy Of The People', title: 'An Enemy Of The People', language: 'everyday', timing: 1, physical: 1, partner: 2, vocal: 2, tones: ['grave'], turns: 2, why: { vocal: 'A public meeting: Stockmann addresses a hostile crowd.' } }),
  m({ id: 'The Playboy Of The Western World', title: 'The Playboy Of The Western World', language: 'heightened', timing: 2, physical: 2, partner: 3, vocal: 1, tones: ['comic', 'grotesque', 'grave'], turns: 2, why: { physical: 'The loy, the races, the second "killing".', tones: 'Comedy turns savage when the father comes back.' } }),
  m({ id: 'Mrs Warren’s Profession', title: 'Mrs Warren’s Profession', language: 'heightened', timing: 1, physical: 0, partner: 3, vocal: 1, tones: ['grave'], turns: 2, why: { partner: 'Mother and daughter argue the economics of virtue.' } }),
  m({ id: 'Miss Julie', title: 'Miss Julie', language: 'everyday', timing: 1, physical: 2, partner: 3, vocal: 1, tones: ['grave'], turns: 3, why: { physical: 'The midsummer dance, the kiss, the razor.' } }),
  m({ id: 'Trifles', title: 'Trifles', language: 'everyday', timing: 1, physical: 2, partner: 2, vocal: 0, tones: ['grave'], turns: 1, why: { physical: 'The case is solved through objects handled.' } }),
  m({ id: 'The Bear', title: 'The Bear', language: 'everyday', timing: 3, physical: 3, partner: 3, vocal: 2, tones: ['comic'], turns: 2, allows: { pace: ['driven'] }, why: { physical: 'The duel with pistols, the shouting, the furniture.', allows: 'Chekhov’s "joke in one act" accelerates to a duel; played slow it stalls.' } }),
  m({ id: 'A Marriage Proposal', title: 'A Marriage Proposal', language: 'everyday', timing: 3, physical: 2, partner: 3, vocal: 2, tones: ['comic'], turns: 1, allows: { pace: ['driven'] }, why: { timing: 'The quarrels over the meadows and the dogs escalate by speed.', allows: 'As The Proposal’s scene: measured, it loses its escalation.' } }),
  m({ id: 'Riders To The Sea', title: 'Riders To The Sea', language: 'heightened', timing: 1, physical: 1, partner: 2, vocal: 3, tones: ['grave', 'lyric'], turns: 1, allows: { scale: ['restrained'] }, why: { vocal: 'Maurya’s keening.', allows: 'Synge’s grief is stillness: the keening is held, not displayed.' } }),
  m({ id: 'Salomé', title: 'Salomé', language: 'heightened', timing: 1, physical: 3, partner: 2, vocal: 2, tones: ['lyric', 'grotesque'], turns: 2, why: { physical: 'The dance of the seven veils.', language: 'Wilde’s incantatory, repetitive prose.' } }),
];

export const MATERIAL_BY_ID: Readonly<Record<string, MaterialProfile>> = Object.fromEntries([...SCENE_MATERIAL, ...PLAY_MATERIAL].map((p) => [p.id, p]));

/** A camera's material for a self-tape of a genre: the medium alone is known (`systems/engagement.ts`). */
export const SELF_TAPE_MATERIAL: MaterialProfile = m({
  id: 'self-tape', title: 'A Self-Tape', medium: 'camera', language: 'everyday', timing: 1, physical: 0, partner: 1, vocal: 0, tones: ['grave'], turns: 1, allows: { scale: ['restrained'] },
  why: { allows: 'A close shot magnifies: what reads at the back of a house reads as too much in a frame (Caine, Acting in Film, 1990; research-practice-material.json).', partner: 'A reader off camera, not a scene partner.' },
});
