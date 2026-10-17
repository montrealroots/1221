/**
 * SLATE — a performance’s workload (from 2026-10-16, the owner’s brief 10, decision 5; `systems/workload.ts` works it).
 *
 * Until then a night’s load on stamina was 0.6 and 0.12 for each level of the body’s and the voice’s work it stages,
 * clamped at 1 (`PIECE.load.night`, `loadOf`), whatever the play’s length and the part’s size: The Bear, A Marriage
 * Proposal, Riders To The Sea and Salomé, each a play in one act, were loaded as whole evenings, and a featured part as
 * its lead (docs/verification/integration-2026-10-16/h4.md, the follow-up’s section 2). A call held 150 minutes at the
 * School and 180 at the Rep whatever the play, and a performance took 10 energy flat (`ESTIMATE.energy.performance`).
 * The owner authorized a workload that reads the production’s running time, the actor’s participation, the physical and
 * vocal intensity, the breaks and recovery, and the starting condition and stamina, with coefficients that are SLATE’s
 * design choices unless research sizes them.
 *
 * **The running times.** A play has no one running time: each figure below is one production’s, as its theater or a
 * listing of it published it (read 2026-10-16, its source beside it), or SLATE’s estimate where nothing is published,
 * said so (`basis`). The total includes its breaks. Where a listing gives an interval and not its length, it’s taken as
 * 20 minutes, the length the RSC’s and the Globe’s listings give (`assumedBreak`), SLATE’s reading. Where a listing names
 * no interval, there’s none. A break falls at an even share of the playing time (one at its middle, two at its thirds),
 * SLATE’s placing: the acts’ lengths aren’t kept.
 *
 * **The coefficients** (`WORKLOAD`). Each is marked: the body’s step from the 2024 Adult Compendium of Physical
 * Activities (`BODY.met`), the rest SLATE’s design, balanced by tests/decisions-stamina.test.ts and the played runs in
 * docs/verification/decisions-2026-10-16/stamina/, not an exact science of acting.
 */

import { BODY } from './body';
import type { PartSize } from './plays';

/** A production’s running time: the whole, its breaks in it, and where the figure comes from. */
export interface RunningTime {
  /** The whole evening from the curtain up to the curtain down, its breaks included, in minutes. */
  minutes: number;
  /** Each break’s minutes, in order: an interval, a short pause. None for a play run straight through. */
  breaks: readonly number[];
  /** `production`: a cited production’s published figure. `estimate`: SLATE’s, where none is published. */
  basis: 'production' | 'estimate';
  /** The figure’s basis in words: the production, its theater and year, or why it’s SLATE’s. */
  from: string;
  /** Where it was read, for a production’s figure. */
  source?: string;
  read?: string;
  /** The interval’s length isn’t published, and is taken as 20 minutes. */
  assumedBreak?: true;
}

const READ = '2026-10-16';
const at = (minutes: number, breaks: readonly number[], from: string, source: string, assumedBreak = false): RunningTime => ({ minutes, breaks, basis: 'production', from, source, read: READ, ...(assumedBreak ? { assumedBreak: true as const } : {}) });

/**
 * The plays the catalog stages (`content/plays.ts`), by title: every one a production’s published figure. Each said as
 * the listing says it; where two of a production’s listings differ, the theater’s own.
 */
export const RUNNING_TIMES: Readonly<Record<string, RunningTime>> = {
  // The directors’ thesis productions.
  'Hedda Gabler': at(160, [20], 'National Theatre, the Lyttelton, to March 2017 (Ivo van Hove, in Patrick Marber’s version): 2 h 40; its listing names no interval, and National Theatre Live’s screening gives one of 20 minutes', 'https://officiallondontheatre.com/show/hedda-gabler-373526/'),
  'The Importance Of Being Earnest': at(165, [20], 'National Theatre, Max Webster’s production at the Noël Coward Theatre, to January 2026: 2 h 45 with an interval', 'https://officiallondontheatre.com/show/the-importance-of-being-earnest-111449914/', true),
  'Woyzeck': at(90, [], 'Vesturport’s production at the Barbican, 2005 and 2006: 1 h 30, no interval named', 'https://officiallondontheatre.com/show/woyzeck-73965/'),
  'Three Sisters': at(170, [20], 'Shakespeare’s Globe, the Sam Wanamaker Playhouse: 2 h 50 with an interval', 'https://www.shakespearesglobe.com/whats-on/three-sisters/', true),
  'Blood Wedding': at(120, [15], 'Royal Central School of Speech and Drama, 2022: 2 h with a 15-minute interval', 'https://www.cssd.ac.uk/events/blood-wedding'),
  'The Cherry Orchard': at(158, [20], 'National Theatre, in Andrew Upton’s version, as National Theatre Live filmed it: 2 h 38 with a short interval, its length not given', 'https://www.ntathome.com/the-cherry-orchard-audio-description', true),
  'Major Barbara': at(195, [20], 'Shaw Festival, 2025, the Royal George Theatre: about 3 h 15 with one intermission', 'https://www.stage-door.com/3/news/2025-News/Entries/2025/5/niagara-on-the-lake-major-barbara-begins-previews-at-the-shaw-festival-on-june-1.html', true),
  'Spring Awakening': at(120, [20], 'Landestheater Eisenach, as a school’s report of an April 2026 performance gives it: about two hours, a pause after the second act. The thinnest basis in the table: no theater’s own figure for the play, not the musical, was found', 'https://www.salzmannschule.de/images/Aktuell/Bericht%20Theater.pdf', true),
  'Ghosts': at(140, [20], 'Riksteatret, the Norwegian Touring Theatre (Bentein Baardson), from 31 August 2017: 2 h 20 with an interval', 'https://sceneweb.no/en/production/74856/Ghosts', true),
  'The Wild Duck': at(140, [20], 'Norwegian Ibsen Company, 2024, in Bergen and at the Coronet in London: 140 minutes with the interval', 'https://sceneweb.no/en/production/100461/The_Wild%20Duck', true),
  // The Shakespeare Repertory Projects.
  'Twelfth Night': at(174, [20], 'RSC, 2024–25, the Royal Shakespeare Theatre: 2 h 54 with a 20-minute interval', 'https://www.rsc.org.uk/twelfth-night'),
  'Measure For Measure': at(165, [20], 'RSC, 2019–20 (Gregory Doran), at the Barbican: 2 h 45 with an interval', 'https://www.barbican.org.uk/node/111731', true),
  'The Winter’s Tale': at(190, [20, 5], 'Shakespeare’s Globe, 2022: about 3 h 10 with one 20-minute interval and one 5-minute pause', 'https://www.shakespearesglobe.com/whats-on/the-winters-tale-2022/'),
  'Macbeth': at(153, [20], 'RSC, 2018 (Polly Findlay), at the Barbican: 2 h 33 with the interval', 'https://www.londontheatre.co.uk/show/macbeth-rsc-barbican-2018', true),
  'As You Like It': at(150, [20], 'Shakespeare’s Globe, 2023: about 2 h 30 with a 20-minute interval', 'https://www.shakespearesglobe.com/whats-on/as-you-like-it-2023'),
  'Much Ado About Nothing': at(150, [20], 'Shakespeare’s Globe, 2026: about 2 h 30 with a 20-minute interval', 'https://www.shakespearesglobe.com/whats-on/much-ado-about-nothing/'),
  'Julius Caesar': at(150, [15], 'Shakespeare’s Globe, 2022 (Diane Page): 2 h 30 with a 15-minute interval, as the Globe’s visual story for it gives it', 'https://cdn.shakespearesglobe.com/uploads/2022/08/Visual-_Story_Julius-Ceasar_2022.pdf'),
  'A Midsummer Night’s Dream': at(170, [20], 'RSC, 2024, the Royal Shakespeare Theatre: 2 h 50 with a 20-minute interval', 'https://www.rsc.org.uk/a-midsummer-nights-dream'),
  // Yale Rep’s classics.
  'A Doll’s House': at(150, [20], 'Nordland Teater’s 1995 production: 2 h 30 with an interval', 'https://sceneweb.no/en/production/51624/A_Doll%27s%20House', true),
  'Uncle Vanya': at(150, [20], 'Harold Pinter Theatre, 2020 (Conor McPherson’s version): 2 h 30 with the interval', 'https://www.londontheatredirect.com/play/uncle-vanya-harold-pinter-theatre-tickets', true),
  'Tartuffe': at(160, [20], 'Teatr Narodowy, Warsaw, from 25 March 2006 (Jacques Lassalle): 2 h 40 with one interval', 'https://www.narodowy.pl/en,whats_on,performances,79,tartuffe_or_the_impostor.html', true),
  'An Enemy Of The People': at(135, [20], 'Duke of York’s Theatre, 2024 (Thomas Ostermeier, Duncan Macmillan’s version): 2 h 15 with the interval', 'https://officiallondontheatre.com/show/an-enemy-of-the-people-111442452/', true),
  'The Playboy Of The Western World': at(150, [15], 'National Theatre, 2024, the Lyttelton: 2 h 30 with one interval, 15 minutes as National Theatre Live’s listing gives it', 'https://www.londontheatre.co.uk/show/44282'),
  'Mrs Warren’s Profession': at(105, [], 'Garrick Theatre, 2025: about 1 h 45, no interval', 'https://officiallondontheatre.com/show/mrs-warrens-profession-111447745/'),
  // The Summer Cabaret’s short and chamber plays.
  'Miss Julie': at(90, [], 'Åbo Svenska Teater’s 2024 production: about 1 h 30, no intermission, as Strindberg’s preface asks', 'https://abosvenskateater.fi/?p=2213'),
  'Trifles': at(35, [], 'Sam Bass Community Theatre, 2020: about 35 minutes', 'https://ctxlivetheatre.com/productions/20201016-trifles-by-sam-bass-community-theatre/'),
  'The Bear': at(55, [], 'OVO’s 2025 production at the Roman Theatre, St Albans: one act, 55 minutes, no interval', 'https://ovo.org.uk/shows/the-bear'),
  'A Marriage Proposal': at(25, [], 'Camden Fringe, 2025, at the Hen and Chickens Theatre (Alexandra Shelest): 25 minutes', 'https://www.thereviewshub.com/camden-fringe-2025-the-proposal-hen-chickens-theatre-london/'),
  'Riders To The Sea': at(25, [], 'Druid’s 2025 production, the Mick Lally Theatre, Galway: an estimated 25 minutes', 'https://www.druid.ie/productions/riders-to-the-sea'),
  'Salomé': at(75, [], 'RSC, 2017, the Swan Theatre: 75 minutes, no interval', 'https://www.britishtheatreguide.info/news/rsc-revives-wildes-one-act-7848'),
};

/**
 * What the catalog stages without a play it names: Yale Rep’s The Seagull of 2026–27, in Yura Kordonsky’s new version;
 * a festival’s new play (the Langston Hughes and the Carlotta); a Yale Cabaret piece; and the third year’s solo piece,
 * You Are The Creator. Each said as what it is.
 */
export const UNNAMED_RUNNING = {
  seagull: at(140, [20], 'Yale Rep hasn’t published its 2027 production’s running time; this is Teatr Narodowy’s, Warsaw, 2010: 2 h 20 with one interval', 'https://teatr.narodowy.pl/en,whats_on,past_seasons,68,the_seagull.html', true),
  newPlay: { minutes: 100, breaks: [], basis: 'estimate', from: 'Estimated, since no Carlotta or Langston Hughes festival play’s running time is published (searched 2026-10-16): a new play of an hour and forty minutes, run straight through' },
  cabaret: { minutes: 60, breaks: [], basis: 'estimate', from: 'Estimated from the Cabaret’s own format, a show about an hour long, as the Daily Nutmeg describes a Yale Cabaret production (https://dailynutmeg.com/blogs/blog/this-yale-cabaret-play-by-ear, read 2026-10-16), run straight through' },
  solo: { minutes: 20, breaks: [], basis: 'estimate', from: 'Estimated, since the Bulletin doesn’t give a solo piece’s length for You Are The Creator: 20 minutes, the one actor on stage throughout' },
} as const satisfies Record<string, RunningTime>;

/**
 * The workload’s coefficients, in one place. The shape is the dose: work done is time at an intensity, as the
 * Compendium’s MET-hours count the body’s and as voice science counts the voice’s (Titze, Švec and Popolo, Vocal Dose
 * Measures, J Speech Lang Hear Res 2003;46:919–932: a dose grows with the time the voice works and how hard). The sizes
 * are SLATE’s, but for the body’s step.
 */
const SHARE: Readonly<Record<PartSize | 'solo', number>> = { lead: 0.75, supporting: 0.5, featured: 0.2, solo: 1 };
const PER_LEVEL = (BODY.met.rehearsal / BODY.met.acting - 1) / 3;
const RECOVERS = 0.25;

export const WORKLOAD = {
  /**
   * A part’s share of the playing time it’s on stage, by its size: SLATE’s design, since the catalog keeps no lines and
   * no entrances. A lead is on for most of the evening, a supporting part for half of it, a featured part for a fifth; a
   * solo piece is all of it.
   */
  share: SHARE,
  /**
   * What each level of the body’s work adds to an hour on stage, over acting’s own: the 2024 Adult Compendium of Physical
   * Activities puts an actor on stage at 3.0 METs and a dance performance or rehearsal (03010) at 5.0 (`BODY.met`), so a
   * play built on the body (level 3) is taken at 5.0 and each level a third of the way, 2/9. The voice’s levels take the
   * same step, SLATE’s design: no MET is published for the voice, and the load before counted the two alike.
   */
  perLevel: PER_LEVEL,
  /**
   * The work done so far at which a performance’s drain reaches all of `PIECE.drain`, by an actor with no stamina in good
   * condition. It’s worked out, not typed: the work done at the curtain of the evening the load before put at its most,
   * and rightly, a lead through an ordinary full-length evening (150 minutes with a 20-minute interval at its middle, the
   * catalog’s middle running time) in a play whose body’s and voice’s work come to four levels between them (where the
   * load before, 0.6 and 0.12 a level, reached 1). That is 130 / 60 × 0.75 × (1 + 4 × 2/9) × (1 − 0.25 / 2), about 2.69
   * stage hours at acting’s intensity, where the drain was all of `PIECE.drain`, 0.3, until later on 2026-10-16. SLATE’s
   * design, on the load before’s own anchor; a first draft put it at 3.5, the heaviest lead’s, which left every ordinary
   * lead well short of what the drain was said to reach.
   *
   * From later on 2026-10-16 it’s 4/3 of that, about 3.58, SLATE’s choice set by testing: the full drain went from 0.3 to
   * 0.4 (`PIECE.drain`, which says what testing set it) to give stamina’s specialist work of its own in briefs and scenes,
   * and the anchor’s lead keeps the 0.3 it reached at its curtain. So no night drains more than it did short of the
   * anchor, and a lead whose work by the curtain passes it, in a longer or harder evening, drains more, toward all of 0.4
   * at 3.58 (the heaviest part the catalog holds, a lead in Julius Caesar, is a workload of 3.56). It’s near the first
   * draft’s 3.5 without its fault: at the anchor’s curtain the drain still reaches what it was said to, 0.3. With the
   * anchor at all of 0.4 instead, every night drained a third more, and a played journey’s student who keeps up
   * (tests/remaining-school.test.ts, ur-1) went from good standing to dismissal: two runs’ nights fell to 47.3 to 49.9,
   * where solid is 50, and the faculty read the work as short (docs/verification/decisions-2026-10-16/integrated/after/
   * README.md).
   */
  full: (130 / 60) * SHARE.lead * (1 + 4 * PER_LEVEL) * (1 - RECOVERS / 2) * (4 / 3),
  /** The most a workload can be, whatever a new play were: SLATE’s bound, above every part the catalog holds (3.6 at most, a lead in Julius Caesar). */
  cap: 8,
  /**
   * What a break gives back of the drain so far, for what follows it: a quarter for an interval of 20 minutes or more, a
   * shorter pause in proportion (`recoversFullAt`). SLATE’s design: no study found measures what an interval restores of
   * an actor’s work. The energy the evening costs is the work done, and a break doesn’t take it back (`systems/workload.ts`).
   */
  recovers: RECOVERS,
  recoversFullAt: 20,
  /**
   * How much more the evening asks of somebody who comes to it tired: the drain and the energy it costs times 1 + this ×
   * (1 − readiness / 100), so half again at the least readiness, nothing more at full. SLATE’s design.
   */
  condition: 0.5,
  /**
   * The energy a unit of workload costs after the performance, an hour on stage at acting’s intensity, and the share of it
   * full stamina spares: so a long, demanding lead costs fifteen or so, a featured part or a one-act a few, and full
   * stamina halves it and never takes it to nothing. SLATE’s design, set so an ordinary lead (a workload near 2.5) at half
   * stamina, rested, costs about the 10 a performance took before.
   */
  energy: 5,
  staminaSpares: 0.5,
  /** The curtain call after the curtain comes down, held with the evening: SLATE’s 5 minutes. */
  curtainCall: 5,
} as const;
