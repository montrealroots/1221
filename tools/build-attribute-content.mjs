/**
 * Builds the connected attributes' generated content from the research (from 2026-10-10):
 *
 * - src/engine/content/engagement.ts, from docs/research/attributes/research-interests.json, the review of it
 *   (research-interests-review.json: the 28 low-confidence entries re-researched, their constraints and the named
 *   titles checked), and the corrections and choices below, each with its reason;
 * - src/engine/content/genre-demands.json, from docs/research/attributes/research-genre-demands.json, typed by
 *   src/engine/content/genre-demands.ts.
 *
 * Run: node tools/build-attribute-content.mjs, then node tools/spelling.mjs --write and
 * node tools/voice-check.mjs --fix on the two files, which put the research's wording in the house's spelling.
 */

import { readFileSync, writeFileSync } from 'node:fs';

const json = (p) => JSON.parse(readFileSync(p, 'utf8'));
const asList = (d) => (Array.isArray(d) ? d : Object.values(d));
const q = (s) => JSON.stringify(s ?? '');
const research = asList(json('docs/research/attributes/research-interests.json'));
const review = json('docs/research/attributes/research-interests-review.json');
const interestsSrc = readFileSync('src/engine/content/interests.ts', 'utf8');
const ids = [...interestsSrc.slice(0, interestsSrc.indexOf('export const FILM_GENRES')).matchAll(/of\('([a-z0-9_]+)'/g)].map((m) => m[1]);

// What each interest develops, the kind of rest it is, and whether it's on the feet: chosen one by one from its
// research entry on 2026-10-09 (see the generated file's header).
const MAP = {
  animation: ['physical'], art_direction: ['imagination', 'art'], casting: ['audition'], choreography: ['dance', 'exercise', true],
  cinematography: ['screen'], color_grading: ['imagination'], costume_design: ['classical', 'art'], creature_effects: ['physical', 'art'],
  dialect_coaching: ['accents'], directing: ['script'], editing: ['screen'], film_criticism: ['script', 'detachment'],
  film_festivals: ['emotionalDepth', 'detachment'], film_history: ['character', 'detachment'], film_preservation: ['physical', 'detachment'],
  film_scoring: ['imagination', 'music'], foley: ['listening', 'mastery'], hair_and_makeup: ['character', 'mastery'],
  improvisation: ['improv', 'detachment'], intimacy_coordination: ['composure'], lighting: ['screen'], location_scouting: ['imagination', 'nature', true],
  miniatures: ['focus', 'mastery'], motion_capture: ['physical', undefined, true], music_supervision: ['emotionalDepth', 'music'],
  practical_effects: ['composure'], producing: ['discipline'], production_design: ['scene'], props: ['focus'], puppetry: ['physical', 'mastery'],
  screenwriting: ['script', 'writing'], script_supervision: ['memory'], set_decoration: ['imagination'], showrunning: ['script'],
  sound_design: ['listening', 'detachment'], sound_mixing: ['voiceover'], stage_combat: ['combat', 'exercise', true], storyboarding: ['imagination'],
  stunts: ['stamina', 'exercise', true], title_design: ['screen'], visual_effects: ['imagination'], voice_acting: ['vocal'],
  writers_rooms: ['listening'], animals: ['character', 'nature', true], art: ['imagination', 'art'], cars: ['physical'],
  cooking: ['emotionalDepth', 'mastery'], design: ['physical', 'art'], fashion: ['character', 'art'], film: ['screen', 'detachment'],
  fitness: ['stamina', 'exercise', true], games: ['improv', 'detachment'], history: ['classical'], music: ['singing', 'music'],
  nature: ['composure', 'nature', true], photography: ['focus', 'art'], politics: ['speech'], reading: ['emotionalDepth', 'detachment'],
  sport: ['physical', 'exercise', true], technology: ['screen'], television: ['script', 'detachment'], theatre: ['listening', 'detachment'],
  travel: ['accents'], writing: ['character', 'writing'],
};

// When an hour of it can be had, from the review's sourced constraints only (research-interests-review.json,
// "constraints"). Days are 0 Sunday to 6 Saturday; hours are when it can start, at home time. Where an activity names
// an alternative with no constraint ("or practice singing"), none is set.
const SCREENING = { from: 17, to: 21, minutes: 90, why: 'Films at the Whitney and the Yale Film Archive screen in the evening, at about 7 o’clock; a feature runs 69 to 88 minutes with its introduction.' };
const MUSEUM = { days: [0, 2, 3, 4, 5, 6], from: 10, to: 16, why: 'The Yale galleries and the Peabody are closed on Mondays, and open about ten to five.' };
const ARCHITECTURE = { days: [1, 2, 3, 4, 5, 6], from: 10, to: 16, why: 'The Architecture Gallery is open weekdays and Saturdays, not Sundays.' };
const LIBRARY = { days: [1, 2, 3, 4, 5, 6], from: 10, to: 18, why: 'The Ives Main Library is open Monday to Saturday, from ten.' };
const PARK = { daylight: true, why: 'East Rock Park is closed from sunset to sunrise.' };
const PARTNERED = { partnered: true, why: 'It is played with others: Spolin’s games, and partnered stage work, ask for a partner or a group.' };
const SHOW = { from: 18, to: 21, minutes: 120, costUsd: 1600, why: 'A Yale Cabaret student ticket is $16, for an evening performance.' };
const WHEN = {
  animation: SCREENING, cinematography: SCREENING, color_grading: SCREENING, film_criticism: SCREENING, film_history: SCREENING,
  film_preservation: SCREENING, film: SCREENING, film_festivals: SCREENING,
  art: MUSEUM, art_direction: MUSEUM, costume_design: MUSEUM, fashion: MUSEUM, set_decoration: MUSEUM, creature_effects: MUSEUM,
  production_design: ARCHITECTURE, design: ARCHITECTURE,
  reading: LIBRARY, cars: LIBRARY, miniatures: LIBRARY,
  nature: { ...PARK, minutes: 90, why: 'East Rock Park is closed from sunset to sunrise, and the measured effect was of a 90-minute walk.' },
  location_scouting: PARK, animals: PARK, photography: { daylight: true, why: 'Photographing public places is done by daylight; the Duffy Study Room is by appointment, Tuesday to Friday.' },
  politics: { days: [2], from: 18, to: 20, minutes: 90, why: 'The Yale Political Union debates on Tuesdays at 7 in term: a half-hour keynote, then questions and student speeches.' },
  history: { from: 10, to: 16, why: 'The Beinecke’s exhibition hall is open daily, from noon at weekends.' },
  improvisation: PARTNERED, intimacy_coordination: PARTNERED, games: PARTNERED, writers_rooms: PARTNERED, stage_combat: PARTNERED,
  theatre: SHOW, directing: SHOW, lighting: SHOW,
};

// Corrections the review found (research-interests-review.json, "validation"), each replacing the wording it shows wrong.
const CORRECT = {
  film_festivals: { activity: 'Watch a documentary at an evening Films at the Whitney screening (free, at 320 York St). New Haven’s own documentary festival, NHdocs, ran from 2014 to 2023 and has ended.', activitySource: 'https://whc.yale.edu/films-at-the-whitney' },
  film: { activity: 'Attend a Films at the Whitney or Yale Film Archive 35mm screening at the Whitney Humanities Center (320 York St, in the Humanities Quadrangle), free and open to the public.' },
  film_preservation: { activity: 'Attend a free Yale Film Archive screening and read about the Archive’s preservation work (it holds more than 8,000 film elements and is a member of FIAF).' },
  photography: { activity: 'Photograph public places around New Haven by daylight, or study portraits in the Yale University Art Gallery’s James E. Duffy Study Room (more than 20,000 photographs; free, by written appointment at least three weeks ahead, Tuesday to Friday).' },
  theatre: { activity: 'See a show at the student-run Yale Cabaret (217 Park St, $16 for a student) or a Yale Repertory Theatre production on a discounted student ticket.' },
  choreography: { activity: 'Learn a short combination from a video and break it down with Laban’s effort qualities. Payne Whitney’s group classes need a paid class pass on top of the free membership.' },
  fitness: { actorUse: 'Stamina: conditioning supports the physically demanding movement and combat training in the Yale plan. As rest it is uncertain: Stonerock, Gupta & Blumenthal (2023) find the evidence for exercise against anxiety inconclusive.', actorUseSource: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10674039/' },
  music: { actorUse: 'Singing and tempo-rhythm: the Yale plan includes Singing and Acting Through Song, and Stanislavski’s tempo-rhythm work uses musical impulse. As rest, music interventions reduced stress in de Witte et al.’s (2020) meta-analyses; a 2022 PLOS ONE meta-analysis of listening after a stressor found no significant effect.', actorUseSource: 'de Witte et al. (2020), Health Psychology Review; Adiasto et al. (2022), PLOS ONE' },
  film_scoring: { actorUse: 'Tempo-rhythm and imagination: Stanislavski’s tempo-rhythm work (Building a Character) uses musical impulse to shape inner state and movement. As rest, music interventions reduced stress in de Witte et al.’s (2020) meta-analyses; listening alone after a stressor did not (Adiasto et al. 2022).', actorUseSource: 'Stanislavski, Building a Character (1949); de Witte et al. (2020); Adiasto et al. (2022)' },
  music_supervision: { actorUse: 'Emotional preparation and tempo: musical impulse to shape inner state echoes Stanislavski’s tempo-rhythm exercises. As rest, the evidence is for music interventions (de Witte et al. 2020), not for listening alone (Adiasto et al. 2022).' },
  color_grading: { actorUseSource: 'Michael Chekhov, To the Actor (1953), the chapter on atmosphere' },
  sound_design: { actorUseSource: 'Michael Chekhov, To the Actor (1953), the chapter on atmosphere' },
  storyboarding: { actorUseSource: 'Michael Chekhov, To the Actor (1953), the chapter on imagination and images' },
};

const reviewed = Object.fromEntries((review.low ?? []).map((x) => [x.id, x]));
const confidence = (r) => (['high', 'medium', 'low'].includes(r) ? r : 'low');
const missing = ids.filter((i) => !research.find((r) => r.id === i) || !MAP[i]);
if (missing.length) throw new Error('unmapped or unresearched: ' + missing.join(','));

const rows = ids.map((id) => {
  const r = { ...research.find((x) => x.id === id) };
  const rev = reviewed[id];
  if (rev) {
    // The low entries as re-researched: the review's sources where it found better, its confidence and its uncertainty.
    if (rev.activitySource) r.activitySource = rev.activitySource;
    if (rev.actorUseSource) r.actorUseSource = rev.actorUseSource;
    r.confidence = confidence(rev.confidence);
    r.notes = rev.uncertainty || r.notes;
  }
  Object.assign(r, CORRECT[id] ?? {});
  const [develops, recovery, feet] = MAP[id];
  const when = WHEN[id];
  const fields = [
    `develops: '${develops}'`, recovery ? `recovery: '${recovery}'` : '', feet ? 'feet: true' : '',
    when ? `when: ${JSON.stringify(when)}` : '',
    `definition: ${q(r.definition)}`, `activity: ${q(r.activity)}`, r.activitySource ? `activitySource: ${q(r.activitySource)}` : '',
    `actorUse: ${q(r.actorUse)}`, r.actorUseSource ? `actorUseSource: ${q(r.actorUseSource)}` : '',
    `confidence: '${confidence(r.confidence)}'`, r.notes ? `notes: ${q(r.notes)}` : '',
  ].filter(Boolean);
  return `  ${id}: { ${fields.join(', ')} },`;
});

const engagement = `/**
 * SLATE — what pursuing each interest is, and what it does (from the connected attributes of 2026-10-09), read by
 * \`systems/engagement.ts\`. Generated by \`tools/build-attribute-content.mjs\`: don't edit by hand.
 *
 * From \`docs/research/attributes/research-interests.json\`, as reviewed on 2026-10-10
 * (\`research-interests-review.json\`): the 28 low-confidence entries re-researched (8 rose to medium, 20 stay low),
 * fourteen wrong facts corrected (a festival that has ended, two recovery claims whose sources say otherwise, an
 * address, a ticket price), and the constraints the sources state (\`when\`). No measured study links an actor's
 * interests to better performance (\`research-acting-engine.json\`, topic 9): the link is the conservatories' teaching,
 * so what an interest develops is small and ordinary (\`ENGAGEMENT.weight\`), never past the reach classes level off at.
 *
 * Each interest was given its own effect from its entry, not one bonus for all:
 * - \`develops\`: the ability or technique its actor's use names, grown a little by each session;
 * - \`recovery\`: the kind of rest it is, where research measures one (\`RECOVERY\`);
 * - \`when\`: when and how it can be had, only where a source says so: daylight for the park, the evening for a
 *   screening, a gallery's days, a debate's Tuesday, a partner for a game, a ticket for a show. An interest with none
 *   has no constraint any source states, and none is invented.
 */

import type { AbilityId } from './abilities';
import type { Skill } from './school';

export type Recovery = 'nature' | 'music' | 'art' | 'exercise' | 'mastery' | 'writing' | 'detachment';

/** When an hour of it can be had: by daylight, on these days (0 Sunday), starting between these hours, with a partner, for this long, at this price (US cents). */
export interface When { daylight?: boolean; days?: number[]; from?: number; to?: number; partnered?: boolean; minutes?: number; costUsd?: number; why: string }

export interface InterestDef {
  develops: AbilityId | Skill;
  recovery?: Recovery;
  /** On your feet: refused too tired or hurt. */
  feet?: boolean;
  when?: When;
  definition: string;
  activity: string;
  /** Where the activity is to be had; none for those done at home, which no source names. */
  activitySource?: string;
  actorUse: string;
  actorUseSource?: string;
  confidence: 'high' | 'medium' | 'low';
  /** The researcher's caveat, where there is one: uncertainty, shown as such, never a penalty. */
  notes?: string;
}

export const INTEREST_DEFS: Readonly<Record<string, InterestDef>> = {
${rows.join('\n')}
};

/**
 * What each kind of rest does in an hour, before satiation, from topic 8 of the research, reviewed on 2026-10-10:
 * the stress it eases (points) and the morale it lifts. Switching off and relaxation track lower fatigue most (Bennett,
 * Bakker & Field 2018: −.39 and −.35, correlations), mastery least (−.18); nature lowered cortisol 21.3% an hour past
 * its daily fall (Hunter et al. 2019) and a 90-minute walk lowered rumination (Bratman et al. 2015); music
 * interventions reduced stress at d = .38 to .55 (de Witte et al. 2020), listening alone after a stressor didn't
 * significantly (Adiasto et al. 2022); a brief gallery visit lowered cortisol (Clow & Fredhoi 2006, 28 people);
 * expressive writing has a small positive effect (Frattaroli 2006, r = .075). Exercise was 6 until 2026-10-10, cited to
 * reviews that turned out inconclusive on anxiety (Stonerock et al. 2023): it is 3 since, SLATE's conservative
 * assumption. The points are SLATE's scale for those orders.
 */
export const RECOVERY: Readonly<Record<Recovery, { stress: number; morale: number; source: string }>> = {
  nature: { stress: 8, morale: 2, source: 'Hunter et al. (2019); Bratman et al. (2015)' },
  music: { stress: 5, morale: 2, source: 'de Witte et al. (2020), for music interventions; Adiasto et al. (2022) found listening alone no help' },
  art: { stress: 5, morale: 2, source: 'Clow & Fredhoi (2006)' },
  exercise: { stress: 3, morale: 1, source: 'SLATE’s assumption: the evidence on exercise and anxiety is inconclusive (Stonerock et al. 2023)' },
  mastery: { stress: 2, morale: 4, source: 'Bennett, Bakker & Field (2018), mastery' },
  writing: { stress: 4, morale: 1, source: 'Frattaroli (2006)' },
  detachment: { stress: 5, morale: 2, source: 'Bennett, Bakker & Field (2018), detachment' },
};

/**
 * Engagement's estimates (SLATE's, on the research's shape):
 * - a session is an hour (\`minutes\`) unless its \`when\` says otherwise, and grows its target as a quarter of a class;
 * - familiarity rises a share of what's left each session, half again the same day, through the four phases of
 *   interest Hidi & Renninger (2006) describe (\`PHASES\`); a developed interest sustains itself, so each session adds
 *   less satiation the more familiar it is (\`satiation.familiarityEases\`);
 * - satiation rises with each session and halves every two days without one: enjoyment of a song played again at once
 *   fell by the sixth time (Ratner, Kahn & Kahneman 1999, as Galak et al. report it), and a gap restored it (Galak,
 *   Kruger & Loewenstein 2011);
 * - an interest loved (on the character sheet) is a quarter better an hour of rest, and learns nothing more:
 *   preference isn't expertise;
 * - genre familiarity and practice speed the preparation of work in the genre by at most a sixth (\`genreSpeed\`), the
 *   best of a work's genres and never their sum, and never cap what the work can reach.
 */
export const ENGAGEMENT = {
  minutes: 60,
  weight: 0.25,
  familiarity: 0.06,
  satiation: { perSession: 0.25, halfLifeDays: 2, familiarityEases: 0.5 },
  loved: 1.25,
  energy: { desk: 2, feet: 6 },
  met: { desk: 1.5, feet: 4 },
  genre: { study: 0.08, practice: 0.1, minutes: 90 },
  genreSpeed: 1 / 6,
} as const;

/** Hidi & Renninger's (2006) four phases of interest, by familiarity. */
export const PHASES: readonly { from: number; label: string }[] = [
  { from: 0, label: 'Triggered' },
  { from: 25, label: 'Maintained' },
  { from: 50, label: 'Emerging' },
  { from: 75, label: 'Well Developed' },
];
export const phaseOf = (familiarity: number): string => [...PHASES].reverse().find((p) => familiarity >= p.from)!.label;
`;
writeFileSync('src/engine/content/engagement.ts', engagement);

// The genres' demands: the research's own words, as data the engine imports (content/genre-demands.json), typed by
// content/genre-demands.ts. Kept as JSON, so it is the research quoted, not the game's prose rewritten.
const demands = json('docs/research/attributes/research-genre-demands.json').genres;
const data = Object.fromEntries(demands.map((d) => [d.id, { claim: d.claim, source: d.source, sourceSupports: d.sourceSupports, how: d.how, confidence: confidence(d.confidence), tags: (d.tags ?? []).map((t) => ({ tag: t.tag, why: t.why })), uncertainty: d.uncertainty }]));
writeFileSync('src/engine/content/genre-demands.json', JSON.stringify(data, null, 1) + '\n');
console.log('wrote engagement.ts (' + ids.length + ' interests) and genre-demands.json (' + demands.length + ' genres)');
