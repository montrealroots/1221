/**
 * SLATE — every genre accounted for (from 2026-10-10): what each uses of the mechanics all genres share, what it asks
 * past them and on what evidence, what it belongs to where the research found a demand that isn't the genre's, and
 * what reads it. Written to `docs/GENRE-COVERAGE.md` by `tools/genre-coverage.ts`, and held there by
 * `tests/genre-coverage.test.ts`, which also plays every genre through `genre.study` and `practice.self_tape`.
 */

import { FILM_GENRES } from './film-genres';
import { GENRE_DEFS } from './genres';
import { DEMAND_LABEL, DEMAND_TECHNIQUE, GENRE_DEMANDS, applied, genreTags } from './demands';
import { TECHNIQUE_LABEL } from './abilities';
import { EVALUATION } from './tasks';
import { THESIS_PLAYS, SHAKESPEARE_PLAYS, REP_PLAYS, SUMMER_PLAYS } from './plays';
import { SCENES } from './coursework';
import { BRIEFS, briefsOf } from './briefs';
import { GENRE_REGISTER } from './genre-register';
import { CONCERNS } from './concerns';

/**
 * Why an entry the research holds at medium or high confidence asks no technique past the shared ones: SLATE's
 * reading of each claim against the fixed vocabulary (`DemandTag`), said so, rather than a tag made up to fill a count.
 */
export const NO_TECHNIQUE: Readonly<Record<string, string>> = {
  domestic_drama: 'Psychologically real, ensemble acting is what all the work reads (Believability, Connection); it names no technique of its own.',
  drama: 'Truthful acting under the given circumstances is the core every task reads; no technique of its own.',
  gangster: 'A tough, physically marked manner and hard-boiled dialogue are a register, not a technique in the vocabulary.',
  medical_drama: 'Procedural business and jargon are learned for a production with its advisers: preparation for the material, not a technique.',
  melodrama: 'An exaggerated register is a choice of style; Heightened Language is verse and rhetoric, which the claim doesn’t name.',
  police_procedural: 'Procedure taught for a production (cuffing, clearing a house) is preparation for the material, not a technique.',
  road_movie: 'Side-by-side dialogue in a car is staging; it asks no technique past a scene’s.',
  silent_film: 'Mime and gesture are Physical Expression, an ability every movement task reads; no technique tag fits (Clown is comic).',
  costume_drama: 'Period movement and deportment are taught, but no tag in the vocabulary is movement of a period; Heightened Language was removed for not fitting.',
  period_drama: 'Period speech, bearing and manners from one series’ advisers; Heightened Language was removed for not fitting.',
};

const PLAYS = [...THESIS_PLAYS, ...SHAKESPEARE_PLAYS, ...REP_PLAYS, ...SUMMER_PLAYS];
const cell = (s: string) => s.replace(/\|/g, '/').replace(/\s+/g, ' ').trim();

/** One genre's row, and the counts. */
export function genreCoverage(): string {
  const rows: string[] = [];
  let applying = 0;
  let tags = 0;
  let noTechnique = 0;
  let belongs = 0;
  let low = 0;
  let withBrief = 0;
  for (const g of FILM_GENRES) {
    const d = GENRE_DEMANDS[g.id]!;
    const def = GENRE_DEFS[g.id]!;
    const t = genreTags(g.id);
    if (t.length) { applying += 1; tags += t.length; }
    if (applied(g.id) && !d.tags.length) noTechnique += 1;
    if (d.belongsTo) belongs += 1;
    if (!applied(g.id)) low += 1;
    const lean = def.families.filter((f) => EVALUATION.familyLean[f]).join(', ') || 'none';
    const asks = t.length ? t.map((x) => `${TECHNIQUE_LABEL[DEMAND_TECHNIQUE[x]]} (${DEMAND_LABEL[x]})`).join(', ') : 'none';
    const why = t.length ? (d.basis === 'definition' ? 'by definition (SLATE’s reading)' : 'evidence') : applied(g.id) ? NO_TECHNIQUE[g.id] ?? 'MISSING' : d.belongsTo ? `belongs to ${d.belongsTo}` : d.tags.length ? 'unsupported or single examples' : 'no technical claim found';
    const plays = PLAYS.filter((p) => (p.kinds ?? []).includes(g.id)).map((p) => p.title);
    const scenes = SCENES.filter((s) => plays.includes(s.play)).length;
    // Its brief (from 2026-10-12): what it is, what its scene stages past the medium's own, its readings and its turns.
    const bs = briefsOf(g.id);
    if (bs.length) withBrief += 1;
    const b = bs[0];
    const base = b?.medium === 'voice' ? ['voiceover', 'scene'] : ['screen', 'scene'];
    const staged = Object.keys(b?.techniques ?? {}).filter((k) => !base.includes(k)) as (keyof typeof TECHNIQUE_LABEL)[];
    const held = b ? b.beats.filter((x) => x.tones.length > 1).length : 0;
    const changes = b ? b.beats.slice(1).filter((x, i) => [...x.tones].sort().join() !== [...b.beats[i]!.tones].sort().join()).length : 0;
    const brief = b ? `${b.title} (${b.medium === 'voice' ? 'at a microphone' : 'on camera'}; ${b.readings.length} readings; ${b.beats.length} beats, ${changes} change${changes === 1 ? '' : 's'} of tone, ${held} held two ways${staged.length ? `; stages ${staged.map((k) => TECHNIQUE_LABEL[k]).join(', ')}` : ''})` : 'NONE';
    const kind = t.length ? 'a genre-wide demand, applied' : applied(g.id) ? 'established, no technique of its own' : d.belongsTo ? 'belongs to particular material or a role, not applied' : d.tags.length ? 'uncertain: one example or unsupported, not applied' : 'no demand claimed';
    const reads = [plays.length ? `${plays.length} play${plays.length === 1 ? '' : 's'} (${plays.join(', ')}): casting, nights` : '', scenes ? `${scenes} coursework scene${scenes === 1 ? '' : 's'}` : '', 'its brief, taped'].filter(Boolean).join('; ');
    const develop = ['Study It', 'Open Its Brief', ...[...new Set([...t.map((x) => DEMAND_TECHNIQUE[x] as string), ...staged])].map((x) => `practice ${TECHNIQUE_LABEL[x as keyof typeof TECHNIQUE_LABEL]}`)].join(', ');
    rows.push(`| ${g.label} | ${cell(kind)} | ${lean} | ${cell(asks)} | ${d.confidence} | ${cell(why)} | ${cell(brief)} | ${cell(reads)} | ${cell(develop)} |`);
  }
  const n = FILM_GENRES.length;
  return `# Genre Coverage

Generated by \`tools/genre-coverage.ts\` from the tables (\`content/genre-coverage.ts\`); \`tests/genre-coverage.test.ts\`
holds it to them and plays every genre's brief through \`brief.choose\` and \`practice.self_tape\`.

## Shared by all ${n} of ${n}

Every genre has the same working mechanics, and every one is reachable from the first day:

- **Its brief** (from 2026-10-12, \`content/briefs/\`): an original scene written for SLATE, set out as an actor breaks a
  scene down, with two or more readings it supports. ${withBrief} of ${n} genres have one written for them, ${BRIEFS.length} briefs in
  all; until that day 98 genres had no material of their own, only a self-tape of no scene. It's prepared
  (\`brief.prepare\`), read and played one way (\`brief.choose\`), taped (\`practice.self_tape\`), judged as a taped brief
  and kept with its purpose; a Strong take earns one callback.
- **Familiarity**, from \`genre.study\` (an hour and a half with a play of the kind the game has, or a film of the kind),
  half again the same day. It speeds the preparation of a scene or a part in the genre. For a taped brief, knowing the
  genre is a part of its preparation, the better of familiarity and practice, complete at 90 (at 30 until 2026-10-16),
  and it doesn't also speed the brief's steps. Until brief 21 (2026-10-22) a work of several genres read the best known
  of them, never the sum; from then each counts for its weight in the work, the weights summing to one, a broad genre
  listed beside its own kind counted as that kind, and a related genre credited only along its own line (a kind toward
  its genre at 0.75, a genre toward its kind at 0.5, any other at nothing). From brief 22 (2026-10-22) the weights are
  the material's own, stated by the play, part, scene, project or role (\`content/genre-weights.ts\`), its tags read
  evenly where nothing is stated, and a related genre counts across one direct link only, beside the genre's own
  knowledge (\`resolveGenres\`, \`relevantGenre\`), at 0.65 toward a broad genre and 0.40 toward a kind, measured
  against the 0.75 and 0.5 it kept provisionally (docs/verification/career-genre-2026-10-22/comparisons.md). The same
  reading is part of the preparation of an audition, a self-tape, a shoot day and a night on stage, and of casting's
  fit.
- **Its register** (from 2026-10-16, \`content/genre-register.ts\`): ${Object.keys(GENRE_REGISTER).length} of ${n} genres have
  one, the conventions its scenes are played in, ${Object.keys(CONCERNS).length} concerns among them, one or two a genre,
  each with where it's from. It's read by every take of a brief written for the genre, and it says how well a way of
  playing suits that brief, a class scene of the genre or a play listed under it first. This list left it out until
  the sweep of 2026-10-16. Each genre's register, techniques and stage scenes are in
  \`docs/verification/stage-2026-10-16/genre-audit.md\`.
- **Practice**, from work done in it: rehearsal calls and nights in a play of the kind, a production's rehearsal and
  shoot days, and taped briefs, shared among a work's genres by their weights so two tags don't count twice. A call
  counted none until brief 21 (2026-10-22).
- **Families**: the dimensions a work in it counts for lean by its families (\`EVALUATION.familyLean\`), the mean of
  several and normalized, where a work has no material profile of its own. Every brief, scene and play now has one, so
  its material leans the work instead.
- **Preference** (loving it, on the character sheet) makes a day of work in it a better day. It doesn't speed study,
  practice or the work, and an unloved genre is learned at the same rate.

## What each asks past them

- ${applying} of ${n} genres ask techniques past the shared mechanics, ${tags} in all. Each technique is read once,
  at weight 1, beside the work's own reads and never over one of them, and mastered (90) asks nothing more.
- ${noTechnique} genres are held at medium or high confidence and ask no technique of their own, each for the reason in
  its row.
- ${low} genres are at low confidence and ask nothing past the shared mechanics. Of them, ${belongs} record what the demand
  the research found belongs to (a subgenre, a role, particular material) instead of the genre. Where SLATE has such
  material, a play's own reads carry what it asks; where it has no such role (a suit actor, a final girl), it's
  applied nowhere, and said so on the genre's page.
- ${applying} + ${noTechnique} + ${low} = ${applying + noTechnique + low}.

The review of 2026-10-10 lowered every applied entry that rested on one film, one director, one role or one subgenre
(64 genres and 82 tags were applied before it). The rule and each decision are in
\`docs/research/attributes/research-genre-demands.json\` (\`meta.review\`, and each entry's \`uncertainty\`).

| Genre | Kind Of Demand | Families That Lean The Work | Techniques It Asks | Confidence | On What | Its Brief | Read By | To Develop It |
|---|---|---|---|---|---|---|---|---|
${rows.join('\n')}
`;
}
