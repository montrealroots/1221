/**
 * SLATE — the actor as the Player Profile opens it (from the connected
 * attributes of 2026-10-09): an ability, a genre, and a piece of finished
 * work. An interest was one too, until the interests went on 2026-10-10.
 *
 * Every figure is read from where the engine keeps it: an ability from its
 * one place (`abilityOf`), its changes from the development history, what it
 * does from the task profiles that read it (`content/tasks.ts`), a piece of
 * work from the evaluation it was judged by, its limits as that evaluation
 * worked them out. Nothing here is computed for the screen alone.
 */

import type { Simulation } from '@/engine';
import type { Person } from '@/engine/domain/model';
import { formatDate } from '@/engine/core/time';
import { ABILITY_DEFS, ABILITY_KIN, DEVELOPMENT, MASTERED, TECHNIQUE_LABEL, type AbilityId } from '@/engine/content/abilities';
import { DIMENSION_LABEL, DIMENSION_MEANS, TASK_PROFILES, type Dimension } from '@/engine/content/tasks';
import { EXERCISES, exerciseFor } from '@/engine/content/practice';
import { GENRE_DEFS } from '@/engine/content/genres';
import { CONCERNS } from '@/engine/content/concerns';
import { concernDraws, concernsOf, concernWords, registerBasisWords } from '@/engine/systems/register';
import { FILM_GENRES, GENRE_BY_ID } from '@/engine/content/film-genres';
import { abilityDef, abilityFull, abilityOf, developmentOf, isAbility, targetId } from '@/engine/systems/attributes';
import { classesGrow, reachOf } from '@/engine/systems/school';
import { EVERYDAY_FITNESS, FITNESS } from '@/engine/systems/life';
import { genreSpeed, playOfGenre } from '@/engine/systems/engagement';
import { chiefLimit, replay, type WorkRecord } from '@/engine/systems/evaluation';
import { DEMAND_LABEL, DEMAND_TECHNIQUE, GENRE_DEMANDS, applied } from '@/engine/content/demands';
import type { Skill } from '@/engine/content/school';
import { Stat } from '@/ui/components/primitives';
import { Segments } from '@/ui/components/WorkThrough';
import { BRIEF_BY_ID } from '@/engine/content/briefs';
import { TEMPLATES } from '@/engine/content/coursework';
import { defineLook, type Way } from './registry';
import { at } from './subject';

const one = (x: number) => x.toFixed(1);
const player = (sim: Simulation): Person | undefined => sim.universe.people[sim.universe.playerId];
const zoneOf = (sim: Simulation) => sim.zone;

/** What a target is called: an ability’s label, or a technique’s. */
export const targetLabel = (t: AbilityId | Skill): string => (isAbility(targetId(t)) ? abilityDef(targetId(t) as AbilityId).label : TECHNIQUE_LABEL[t as Skill]);
/** Where a target opens: an ability’s look, or a technique’s (the school’s skill). */
export const targetSubject = (t: AbilityId | Skill) => (isAbility(targetId(t)) ? at('ability', targetId(t)) : at('skill', t));

/** The tasks and dimensions that read an ability, from the task profiles themselves. */
export function readersOf(id: AbilityId): { task: string; label: string; dims: Dimension[] }[] {
  return Object.values(TASK_PROFILES).map((t) => ({
    task: t.id, label: t.label,
    dims: (Object.entries(t.dims) as [Dimension, NonNullable<(typeof t.dims)[Dimension]>][]).filter(([, s]) => s.inputs.some((i) => 'ability' in i && i.ability === id)).map(([d]) => d),
  })).filter((r) => r.dims.length > 0);
}

/** The latest changes to an id on the development history, newest first. */
export function recentOf(person: Person, id: string, n = 6) {
  return developmentOf(person).history.filter((h) => h.id === id).slice(-n).reverse();
}

/** A kept band, in words: coursework’s and a brief’s (LAMDA’s), and a night’s (from 2026-10-12: until then shown as stored, in lowercase, two vocabularies in one column). */
export const BAND_WORD: Readonly<Record<string, string>> = { unready: 'Unready', working: 'Working', strong: 'Strong', exceptional: 'Exceptional', off: 'An Off Night', solid: 'Solid', remarkable: 'Remarkable' };

/** What a development source is, in words. */
export function sourceWords(source: string): string {
  const [kind, rest] = source.split(':') as [string, string | undefined];
  if (kind === 'practice') return EXERCISES.find((e) => e.id === rest)?.label ?? 'Practice';
  if (kind === 'class') return `Class: ${rest}`;
  if (kind === 'prepare') return `Coursework: ${rest}`;
  if (kind === 'interest') return 'An interest, from before they were removed';
  if (kind === 'workout') return rest === 'run' ? 'A run' : 'A workout';
  if (kind === 'read' || kind === 'research') return 'Reading a play';
  // A skill grown into another, a brief’s preparation, the nerves of a performance, and working a problem through had no
  // words until 2026-10-12, and showed as their raw keys.
  if (kind === 'transfer') return 'Carried over from a related skill';
  if (kind === 'brief') return `A practice brief: ${rest === 'interpretation' ? 'the breakdown' : rest === 'memorization' ? 'the lines' : rest ?? 'its preparation'}`;
  if (kind === 'workbook') return 'Working a problem through';
  if (kind === 'nerves') return 'The nerves of a performance';
  // A production’s rehearsal call, a lab and its showing, and a coursework activity had none until 2026-10-13, and showed
  // as "rehearsal", "lab" and "coursework" (found by the review of that day).
  // The Yale Cabaret’s said by its name since later that day; it showed as its key, “cabaret”, found by its evidence pass.
  if (kind === 'rehearsal') return rest === 'summer' ? 'A rehearsal call: the Summer Cabaret' : rest === 'cabaret' ? 'A rehearsal call: the Yale Cabaret' : rest ? `A rehearsal call: ${rest}` : 'A rehearsal call';
  if (kind === 'lab') return rest === 'showing' ? 'A lab’s showing' : 'A lab';
  if (kind === 'coursework') return `Coursework: ${TEMPLATES.flatMap((t) => t.activities).find((a) => a.id === rest)?.label ?? 'an activity'}`;
  return ({ 'practice-day': 'A day of practice kept', call: 'A call answered', night: 'A night on stage', 'partner-rehearsal': 'Rehearsing with a partner', 'learn-part': 'Learning the part', blocking: 'The blocking book', 'work-note': 'A director’s note worked', 'self-tape': 'A self-tape' } as Record<string, string>)[kind] ?? kind;
}

// ---------------------------------------------------------------------------
// An ability
// ---------------------------------------------------------------------------

interface TheAbility { id: AbilityId; person: Person }

defineLook<TheAbility>('ability', {
  gone: 'That isn’t one of an actor’s abilities.',
  resolve: (sim, id) => {
    const p = player(sim);
    return p && ABILITY_DEFS.some((d) => d.id === id) ? { id: id as AbilityId, person: p } : undefined;
  },
  seeds: () => ABILITY_DEFS.map((d) => d.id),
  look: ({ id, person }, { sim }) => {
    const def = abilityDef(id);
    if (!person.craft) {
      // A life that never trained: what the ability is, and nothing measured.
      return {
        name: def.label,
        kind: def.general ? 'A General Ability' : 'An Acting Ability',
        summary: `Nobody has measured you in it, since you never trained as an actor. ${def.definition}`,
        body: <p className="small"><strong>What develops it.</strong> {def.develops}</p>,
        provenance: def.source.length < 200 ? `${def.source}.` : 'Its sources are in docs/research/attributes/research-acting-engine.json.',
      };
    }
    const level = abilityOf(sim, person, id);
    const full = abilityFull(sim, person, id);
    const reach = Math.min(full, reachOf(person, id));
    const readers = readersOf(id);
    const exercise = exerciseFor(id);
    const recent = recentOf(person, id);
    const kin = ABILITY_KIN[id] ?? [];
    const ways: Way[] = [
      ...kin.map((k) => ({ to: at('skill', k), label: TECHNIQUE_LABEL[k], detail: 'Its kin in the craft: the classes that grow one grow both' })),
      ...(person.work ?? []).filter((w) => w.inputs.abilities[id] !== undefined).slice(-3).reverse().map((w) => ({ to: at('work', w.inputs.key), label: w.what, detail: `${w.taskLabel}, ${one(w.overall)}: read ${one(w.inputs.abilities[id]!)} of it` })),
    ];
    return {
      name: def.label,
      kind: def.general ? 'A General Ability' : 'An Acting Ability',
      summary: `You’re at ${one(level)} of ${one(full)}${level >= full ? ', full' : ''}: ${def.definition.charAt(0).toLowerCase()}${def.definition.slice(1)}`,
      body: (
        <>
          <div className="grid grid-3">
            <Stat label="Now" value={one(level)} note={level >= full ? 'Full: work that reads it asks nothing more' : `${one(full - level)} to full`} />
            <Stat label="Classes Reach" value={classesGrow(id) ? one(reach) : '—'} note={classesGrow(id) ? 'Where ordinary work levels off; practice goes past it' : id === 'stamina' ? 'Classes don’t build it; workouts do' : id === 'discipline' ? 'Classes don’t build it; practice kept up does' : 'Classes don’t build it; work in front of people does'} />
            <Stat label="Last Change" value={recent[0] ? `+${recent[0].delta.toFixed(2)}` : 'None Yet'} note={recent[0] ? `${sourceWords(recent[0].source)}, ${formatDate(recent[0].at, zoneOf(sim))}` : `None in the latest ${DEVELOPMENT.historyKept} changes kept`} />
          </div>
          <p className="small"><strong>What develops it.</strong> {def.develops}</p>
          <p className="small"><strong>Where it began.</strong> {def.derivedFrom}</p>
          <p className="small"><strong>What it does.</strong> {readers.length ? readers.map((r) => `${r.label}: ${r.dims.map((d) => DIMENSION_LABEL[d].toLowerCase()).join(', ')}`).join('; ') : def.affects}.</p>
          {exercise && <p className="small"><strong>To practice it.</strong> {exercise.label}: {exercise.how} {exercise.kind === 'slate' ? '(SLATE’s own exercise.)' : exercise.kind === 'named' ? '(A named exercise of real pedagogy.)' : '(A composite of real practice.)'}</p>}
          {id === 'stamina' && <p className="small"><strong>Its scale.</strong> Stamina is your fitness, full at the most a body your age can be brought to ({one(full)} now): at full fitness it counts as full. A workout builds it and holds it for {FITNESS.heldDays} days; past that it falls {FITNESS.perDay} a day toward {EVERYDAY_FITNESS}, as an untrained body’s does. A second workout the same day builds half.</p>}
          {recent.length > 0 && (
            <ul className="small">
              {recent.map((h, i) => <li key={i}>{formatDate(h.at, zoneOf(sim))}: +{h.delta.toFixed(3)}, {sourceWords(h.source)}</li>)}
            </ul>
          )}
        </>
      ),
      ways,
      provenance: def.source.length < 200 ? `${def.source}.` : 'Its sources are in docs/research/attributes/research-acting-engine.json.',
    };
  },
});

// ---------------------------------------------------------------------------
// A genre
// ---------------------------------------------------------------------------

interface TheGenre { id: string; person: Person }

defineLook<TheGenre>('genre', {
  gone: 'That isn’t one of the genres.',
  resolve: (sim, id) => {
    const p = player(sim);
    return p && GENRE_DEFS[id] && GENRE_BY_ID[id] ? { id, person: p } : undefined;
  },
  seeds: () => FILM_GENRES.map((g) => g.id),
  look: ({ id, person }, { sim }) => {
    const def = GENRE_DEFS[id]!;
    const g = person.engagement?.byGenre[id];
    const loved = (person.genres ?? []).includes(id);
    const speed = genreSpeed(person, [id]);
    const play = playOfGenre(id);
    // Its briefs' takes (from 2026-10-12: until then this looked for keys a self-tape stopped writing when briefs came, and listed nothing).
    const tapes = (person.work ?? []).filter((w) => w.inputs.key.startsWith(`brief:${person.id}:`) && (BRIEF_BY_ID[w.inputs.key.split(':')[2] ?? '']?.kinds ?? []).includes(id)).slice(-3).reverse();
    const demand = GENRE_DEMANDS[id];
    return {
      name: GENRE_BY_ID[id]!.label,
      kind: loved ? 'A Genre You Love' : 'A Genre',
      summary: g ? `Familiarity ${one(g.familiarity)} and practice ${one(g.practice)}: a part in a play of its kind is learned ${Math.round((speed - 1) * 100)}% faster, and a brief in it reads knowing it as part of its preparation.` : `You haven’t studied it or worked in it yet. ${def.conventions}`,
      body: (
        <>
          <div className="grid grid-3">
            <Stat label="Familiarity" value={one(g?.familiarity ?? 0)} note="Watched, read and studied" />
            <Stat label="Practice" value={one(g?.practice ?? 0)} note="Work done in it: nights, self-tapes" />
            {/* What it speeds, said (from 2026-10-12: until then "The best of the two, never a cap on the work", beside a
                summary saying a brief in it reads knowing it, so it read as speeding the brief; a brief’s steps read the
                material met before, `prepSpeed`, and never this). */}
            <Stat label="Preparation" value={`${Math.round((speed - 1) * 100)}% Faster`} note="The better of the two, for a scene or a part from a play of its kind; a brief’s steps read the material met before instead" />
          </div>
          <p className="small"><strong>Its conventions.</strong> {def.conventions}</p>
          {demand && (
            <>
              <p className="small"><strong>What it asks of an actor.</strong> {demand.claim}</p>
              <p className="small"><strong>{applied(id) && demand.tags.length ? 'Applied as requirements.' : 'Not applied.'}</strong>{' '}
                {/* A self-tape’s, which every brief in the genre stages (tests/briefs-content.test.ts). Until 2026-10-13 this
                    said “Work in it reads”, and a night of a play of the kind or a class scene from one reads its own
                    material’s techniques instead (`playReads`, `workContext`): a farce’s night read no clown. */}
                {applied(id) && demand.tags.length
                  ? <>A self-tape in it reads {demand.tags.map((t, i) => <span key={t.tag}>{i ? ', ' : ''}{TECHNIQUE_LABEL[DEMAND_TECHNIQUE[t.tag]]} (you: {one(person.craft?.[DEMAND_TECHNIQUE[t.tag]] ?? 0)} of {MASTERED})</span>)}: {demand.tags.map((t) => t.why).join(' ')}{demand.basis === 'definition' ? ' The genre is defined by it: that’s SLATE’s reading, not a source’s statement.' : ''} A night of a play of its kind, or a class scene from one, reads its own material’s techniques instead.</>
                  : demand.belongsTo ? `What the research found (${demand.tags.map((t) => DEMAND_LABEL[t.tag]).join(', ') || 'no technique'}) belongs to ${demand.belongsTo}, not to the genre as a whole, so work in it asks nothing past what the work itself reads.`
                  : demand.tags.length ? `The research found it only in single examples (${demand.tags.map((t) => DEMAND_LABEL[t.tag]).join(', ')}), at low confidence, so it isn’t treated as the genre’s convention.` : 'The research found nothing it asks past what the work itself reads.'}
              </p>
              <p className="xs dim">The research, in its own words: {demand.sourceSupports} ({demand.how}; {demand.confidence} confidence). Uncertain: {demand.uncertainty}</p>
            </>
          )}
          {/* Its register (from 2026-10-16, `GENRE_REGISTER`): what every take of a brief written for it reads. */}
          {concernsOf(id).length > 0 && (
            <>
              <p className="small"><strong>How its scenes are played.</strong> {registerBasisWords(id)}</p>
              <ul className="small">{concernsOf(id).map((c) => <li key={c}>{concernWords(c)}</li>)}</ul>
            </>
          )}
          <p className="small"><strong>To study it.</strong> {play ? `Read ${play.title}${play.by ? `, by ${play.by}` : ''}, a play of the kind the game has, or watch a film of the kind.` : 'Watch a film of the kind.'} A brief in it is finished work: taped, and judged beat by beat as a taped brief, its own material leaning it.</p>
          <p className="xs dim">Its definition’s source: {def.source}.{demand ? ` Its demands’ source: ${demand.source}.` : ''}</p>
          <p className="small">{loved ? 'You love it: a day of work in it is a better day. Loving it doesn’t speed the work or cap it.' : 'Loving a genre makes a day of work in it better; it doesn’t make you better at it.'}</p>
        </>
      ),
      ways: [
        ...(applied(id) ? (demand?.tags ?? []).map((t) => ({ to: at('skill', DEMAND_TECHNIQUE[t.tag]), label: TECHNIQUE_LABEL[DEMAND_TECHNIQUE[t.tag]], detail: `What it asks for: ${DEMAND_LABEL[t.tag]}` })) : []),
        ...[...new Set(concernsOf(id).flatMap(concernDraws))].map((a) => ({ to: at('ability', a), label: ABILITY_DEFS.find((d) => d.id === a)?.label ?? a, detail: `Its scenes draw on it: ${concernsOf(id).filter((c) => concernDraws(c).includes(a)).map((c) => CONCERNS[c].label).join(', ')}` })),
        ...tapes.map((w) => ({ to: at('work', w.inputs.key), label: w.what, detail: `${one(w.overall)}, ${formatDate(w.at, zoneOf(sim))}` })),
      ],
      provenance: `From docs/research/attributes/: its definition ${def.how === 'read directly' ? 'read at the source' : 'from a search’s summary'}, its demands at ${demand?.confidence ?? 'low'} confidence.`,
    };
  },
});

// ---------------------------------------------------------------------------
// A piece of finished work
// ---------------------------------------------------------------------------

interface TheWorkDone { w: WorkRecord; person: Person }

defineLook<TheWorkDone>('work', {
  gone: 'That work isn’t on your record any more: the record keeps the latest 160.',
  resolve: (sim, id) => {
    const p = player(sim);
    const w = p?.work?.find((x) => x.inputs.key === id);
    return w && p ? { w, person: p } : undefined;
  },
  seeds: (sim) => (player(sim)?.work ?? []).map((w) => w.inputs.key),
  look: ({ w }, { sim }) => {
    const dims = Object.entries(w.dims) as [Dimension, number][];
    const chief = chiefLimit(w);
    const abilities = Object.keys(w.inputs.abilities) as AbilityId[];
    const profile = TASK_PROFILES[w.task];
    const again = profile ? replay(w, profile) : undefined;
    // Each part of preparation by the task’s own words, the way of playing it as the limits name it, and each family by
    // its genre’s (from 2026-10-12: until then by their keys, "interpretation 66% of 80%, … approach 49% of 90%;
    // leaning to science_fiction").
    const partWords = (k: string) => (profile?.prepLabel?.[k] ?? (k === 'approach' ? 'The way you chose to play it' : k.replace(/_/g, ' '))).toLowerCase();
    const familyWords = (f: string) => (GENRE_BY_ID[f]?.label ?? f.replace(/_/g, ' ')).toLowerCase();
    const prepared = Object.entries(w.inputs.prep).map(([k, v]) => `${partWords(k)} at ${Math.round(v * 100)}% of ${Math.round((w.inputs.required[k] ?? 1) * 100)}%`);
    return {
      name: w.what,
      kind: w.taskLabel,
      summary: `Judged ${one(w.overall)} of 100${w.band ? `, ${BAND_WORD[w.band] ?? w.band}` : ''}, on ${formatDate(w.at, zoneOf(sim))}.${chief ? ` ${chief}.` : w.mastery ? ' Everything it asked was met: the most it can be.' : ''}`,
      body: (
        <>
          <div className="grid grid-3">
            {dims.map(([d, q]) => <Stat key={d} label={DIMENSION_LABEL[d]} value={one(q)} note={DIMENSION_MEANS[d]} />)}
          </div>
          {w.limits.length > 0 && (
            <ul className="small">
              {w.limits.map((l, i) => <li key={i}>{l.label}: {l.by} points off the {DIMENSION_LABEL[l.dimension].toLowerCase()}{l.whole !== undefined ? `, ${l.whole} of the whole` : ''}</li>)}
            </ul>
          )}
          {again?.piece && <Segments e={again} caption="Part By Part" />}
          <p className="xs dim">Judged with readiness {Math.round(w.inputs.condition.readiness)}{w.inputs.condition.ill ? ', the flu' : ''}{w.inputs.condition.injured ? ', an injury' : ''}{w.inputs.condition.concussed ? ', a concussion mending' : ''}; difficulty {w.inputs.difficulty.toFixed(2)}; {prepared.length ? `preparation: ${prepared.join(', ')}` : 'preparation not read'}{w.inputs.families.length ? `; leaning to ${w.inputs.families.map(familyWords).join(', ')}` : ''}.</p>
        </>
      ),
      ways: abilities.map((a) => ({ to: at('ability', a), label: abilityDef(a).label, detail: `Read at ${one(w.inputs.abilities[a]!)}` })),
      provenance: again ? `Judged under ${w.ruleset}; worked out again from its own inputs, ${one(again.overall)}.` : w.inputs.levels ? `Judged under ${w.ruleset}, rules since changed, so it isn’t worked out again under today’s: what it was is kept as it was.` : `Judged under ${w.ruleset}, before results kept their levels (2026-10-10), so it isn’t worked out again.`,
    };
  },
});

/** For a list: a mastered technique against MASTERED. */
export const masteredOf = (level: number) => level >= MASTERED;
