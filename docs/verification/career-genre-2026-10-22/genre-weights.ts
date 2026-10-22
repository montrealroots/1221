/**
 * Writes brief 22's review of the material's genre weights (`genre-weights.md`, W4): every play with kinds, every
 * project and role, and every scene and part that states its own, each with its tags, what brief 21's first-listed rule
 * made of them, what the material now states, at which level, and why. Brief 21's weights are worked here by its own
 * rule, written out again (the first listed half where there are two or more, the rest sharing the other half, a broad
 * genre beside its own kind folded into the kind), since the game no longer holds it.
 *
 *   npx vite-node docs/verification/career-genre-2026-10-22/genre-weights.ts
 */
import { writeFileSync } from 'node:fs';
import { GENRE_DEFS } from '../../../src/engine/content/genres';
import { GENRE_BY_ID } from '../../../src/engine/content/film-genres';
import { PROJECTS } from '../../../src/engine/content/careerwork';
import { REP_PLAYS, SHAKESPEARE_PLAYS, SUMMER_PLAYS, THESIS_PLAYS } from '../../../src/engine/content/plays';
import { SCENES } from '../../../src/engine/content/coursework';
import { SEAGULL_2027 } from '../../../src/engine/content/school';
import { PLAY_GENRES, PROJECT_GENRES, ROLE_GENRES, SCENE_GENRES } from '../../../src/engine/content/genre-weights';
import { ancestorsOf, requirementOfPlay, requirementOfRole, requirementOfScene, type GenreRequirement } from '../../../src/engine/systems/engagement';

const OUT = 'docs/verification/career-genre-2026-10-22/genre-weights.md';
const label = (g: string) => GENRE_BY_ID[g]?.label ?? g;
const pct = (w: number) => `${Math.round(w * 100)}%`;
const set = (pairs: [string, number][]) => pairs.sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).map(([g, w]) => `${label(g)} ${pct(w)}`).join(', ');
const resolved = (r: GenreRequirement) => set(r.needs.map((n) => [n.id, n.weight]));

/** Brief 21's rule, as it was: the first listed half where there are two or more, the rest sharing the other half, a broad genre beside its own kind folded into it. */
function brief21(genres: readonly string[]): [string, number][] {
  const tags = [...new Set(genres)].filter((g) => GENRE_DEFS[g]);
  if (!tags.length) return [];
  const first = tags.length > 1 ? 0.5 : 1;
  const weight = new Map(tags.map((g, i) => [g, i === 0 ? first : (1 - first) / (tags.length - 1)]));
  const kindsListed = (g: string) => tags.filter((t) => t !== g && ancestorsOf(t).has(g));
  const absorbed = new Set(tags.filter((g) => kindsListed(g).length > 0));
  for (const g of tags) {
    if (!absorbed.has(g)) continue;
    const into = kindsListed(g).filter((t) => !absorbed.has(t));
    for (const t of into) weight.set(t, weight.get(t)! + weight.get(g)! / into.length);
  }
  return tags.filter((g) => !absorbed.has(g)).map((g) => [g, weight.get(g)!]);
}

const md: string[] = [
  '# Brief 22: The Material’s Genre Weights, Reviewed',
  '',
  'Written by `genre-weights.ts` from `src/engine/content/genre-weights.ts` and the catalogs. Every weight is **SLATE’s',
  'design choice**, read from the material as the game has it (the play’s story and parts, the scene’s summary, the',
  'breakdown’s words), **not a researched or objective fact**. A set is read as shares of its sum. “Brief 21” is what the',
  'first-listed rule made of the same tags; “Now” is what the game resolves, at the level shown.',
  '',
  '## The Rules',
  '',
  '- **Levels, the most precise first:** a class scene’s own; a part’s or a role’s own; the play’s or the project’s. The',
  '  first level that states a set states all of it. A level with tags and no set reads them evenly (the neutral fallback,',
  '  for older content). A class scene’s filed genre (comedy, drama or tragedy) is read only where its play names none.',
  '- **Invalid weights** (a genre the game doesn’t have, a weight below 0 or not a number, none above 0) are skipped and',
  '  said; the level’s tags or the next level are read.',
  '- **Normalized, bounded, order-free:** shares of the sum, each at most 1, summing to 1, sorted and summed by genre, so',
  '  the order of a list changes nothing; a tag repeated is one; a broad genre beside one of its own kinds is folded into',
  '  the kind.',
  '- **Where nothing more precise exists, nothing more precise is claimed:** a professional audition, callback or',
  '  self-tape has no sides of its own in the game, so it reads the role’s; School casting is of a play, before its parts',
  '  are dealt, so it reads the play’s; a scene without its own reads its play’s.',
  '',
  '## The Plays',
  '',
  '| Play | Tags as listed | Brief 21 | Now (stated) | Register | Why |',
  '|---|---|---|---|---|---|',
];
const plays = [...THESIS_PLAYS, ...SHAKESPEARE_PLAYS, ...REP_PLAYS, ...SUMMER_PLAYS].filter((p) => p.kinds?.length);
for (const p of [...plays, { title: 'The Seagull', kinds: SEAGULL_2027.kinds, parts: [] }]) {
  const stated = PLAY_GENRES[p.title]!;
  md.push(`| ${p.title} | ${p.kinds!.map(label).join(', ')} | ${set(brief21(p.kinds!))} | ${resolved(requirementOfPlay(p.title))} | ${stated.register ? label(stated.register) : '(none, as before)'} | ${stated.why} |`);
}
md.push('', '## The Parts That Ask Otherwise', '', 'Every other part reads its play’s.', '', '| Play | Part | Now (stated, part) | Why |', '|---|---|---|---|');
for (const [title, stated] of Object.entries(PLAY_GENRES)) for (const [part, own] of Object.entries(stated.parts ?? {})) md.push(`| ${title} | ${part} | ${resolved(requirementOfPlay(title, part))} | ${own.why} |`);
md.push('', '## The Class Scenes That Ask Otherwise', '', `${Object.keys(SCENE_GENRES).length} of ${SCENES.length} scenes state their own; ${SCENES.filter((s) => requirementOfScene(s.id).level === 'play').length} read their play’s; ${SCENES.filter((s) => requirementOfScene(s.id).level === 'scene' && !SCENE_GENRES[s.id]).length}, of plays with no kinds, read their filed genre, as no scene did before brief 22 (until then a scene of a play with no kinds read no genre).`, '', '| Scene | Play | The play’s | Now (stated, scene) | Why |', '|---|---|---|---|---|');
for (const [id, own] of Object.entries(SCENE_GENRES)) {
  const scene = SCENES.find((s) => s.id === id)!;
  md.push(`| ${id} (${scene.where}) | ${scene.play} | ${resolved(requirementOfPlay(scene.play))} | ${resolved(requirementOfScene(id))} | ${own.why} |`);
}
md.push('', '## The Professional Projects And Roles', '', `No role asks other than its project (\`ROLE_GENRES\` is empty: ${Object.keys(ROLE_GENRES).length}); each pair of parts is one story from two sides.`, '', '| Project | Roles | Tags as listed | Brief 21 | Now (stated, project) | Why |', '|---|---|---|---|---|---|');
for (const [project, stated] of Object.entries(PROJECT_GENRES)) {
  const roles = PROJECTS.filter((t) => t.project === project);
  md.push(`| ${project} | ${roles.map((t) => t.role.part).join(', ')} | ${roles[0]!.genres.map(label).join(', ')} | ${set(brief21(roles[0]!.genres))} | ${resolved(requirementOfRole(roles[0]!))} | ${stated.why} |`);
}
md.push('', '## What Moved', '');
const moved = [...plays, { title: 'The Seagull', kinds: SEAGULL_2027.kinds }].filter((p) => set(brief21(p.kinds!)) !== resolved(requirementOfPlay(p.title)));
md.push(`${moved.length} of ${plays.length + 1} plays read otherwise than brief 21’s rule read them: ${moved.map((p) => p.title).join('; ')}. Every project reads as before: each states one genre, and its tags were that genre beside its broad genre, which brief 21 folded into it.`);
writeFileSync(OUT, `${md.join('\n')}\n`);
console.log(`wrote ${OUT}: ${plays.length + 1} plays, ${moved.length} moved`);
