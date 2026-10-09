/**
 * SLATE — the actor as the Player Profile opens it (from the connected
 * attributes of 2026-10-09): an ability, an interest, a genre, and a piece of
 * finished work.
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
import { ABILITY_DEFS, ABILITY_KIN, MASTERED, TECHNIQUE_LABEL, type AbilityId } from '@/engine/content/abilities';
import { DIMENSION_LABEL, DIMENSION_MEANS, TASK_PROFILES, type Dimension } from '@/engine/content/tasks';
import { EXERCISES, exerciseFor } from '@/engine/content/practice';
import { INTEREST_DEFS, RECOVERY, phaseOf } from '@/engine/content/engagement';
import { GENRE_DEFS } from '@/engine/content/genres';
import { ALL_INTERESTS, FILM_GENRES, GENRE_BY_ID, INTEREST_BY_ID } from '@/engine/content/interests';
import { abilityDef, abilityFull, abilityOf, developmentOf, isAbility, levelOf, targetId } from '@/engine/systems/attributes';
import { reachOf } from '@/engine/systems/school';
import { genreSpeed, playOfGenre, restOf, satiationNow } from '@/engine/systems/engagement';
import { chiefLimit, replay, type WorkRecord } from '@/engine/systems/evaluation';
import { DEMAND_LABEL, DEMAND_TECHNIQUE, GENRE_DEMANDS, applied } from '@/engine/content/demands';
import type { Skill } from '@/engine/content/school';
import { Stat } from '@/ui/components/primitives';
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

/** What a development source is, in words. */
export function sourceWords(source: string): string {
  const [kind, rest] = source.split(':') as [string, string | undefined];
  if (kind === 'practice') return EXERCISES.find((e) => e.id === rest)?.label ?? 'Practice';
  if (kind === 'class') return `Class: ${rest}`;
  if (kind === 'prepare') return `Coursework: ${rest}`;
  if (kind === 'interest') return INTEREST_BY_ID[rest ?? '']?.label ?? 'An interest';
  if (kind === 'read' || kind === 'research') return 'Reading a play';
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
            <Stat label="Classes Reach" value={one(reach)} note="Where ordinary work levels off; practice goes past it" />
            <Stat label="Last Change" value={recent[0] ? `+${recent[0].delta.toFixed(2)}` : 'None Yet'} note={recent[0] ? `${sourceWords(recent[0].source)}, ${formatDate(recent[0].at, zoneOf(sim))}` : 'Nothing has moved it since the history began'} />
          </div>
          <p className="small"><strong>What develops it.</strong> {def.develops}</p>
          <p className="small"><strong>Where it began.</strong> {def.derivedFrom}</p>
          <p className="small"><strong>What it does.</strong> {readers.length ? readers.map((r) => `${r.label}: ${r.dims.map((d) => DIMENSION_LABEL[d].toLowerCase()).join(', ')}`).join('; ') : def.affects}.</p>
          {exercise && <p className="small"><strong>To practice it.</strong> {exercise.label}: {exercise.how} {exercise.kind === 'slate' ? '(SLATE’s own exercise.)' : exercise.kind === 'named' ? '(A named exercise of real pedagogy.)' : '(A composite of real practice.)'}</p>}
          {id === 'stamina' && <p className="small"><strong>Its scale.</strong> Stamina is your fitness, full at the most a body your age can be brought to ({one(full)} now): at full fitness it counts as full. A workout builds it; without one it falls 0.18 a day toward 35, as an untrained body’s does. Rest doesn’t lower it.</p>}
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
// An interest
// ---------------------------------------------------------------------------

interface TheInterest { id: string; person: Person }

defineLook<TheInterest>('interest', {
  gone: 'That isn’t one of the interests.',
  resolve: (sim, id) => {
    const p = player(sim);
    return p && INTEREST_DEFS[id] && INTEREST_BY_ID[id] ? { id, person: p } : undefined;
  },
  seeds: () => ALL_INTERESTS.map((i) => i.id),
  look: ({ id, person }, { sim }) => {
    const def = INTEREST_DEFS[id]!;
    const s = person.engagement?.byInterest[id];
    const rest = restOf(person, id, sim.now);
    const familiarity = s?.familiarity ?? 0;
    const sat = satiationNow(s, sim.now);
    const develops = targetLabel(def.develops);
    return {
      name: INTEREST_BY_ID[id]!.label,
      kind: rest.loved ? 'An Interest You Love' : 'An Interest',
      summary: s?.sessions
        ? `${s.sessions === 1 ? 'Once' : `${s.sessions} times`} so far, the last on ${formatDate(s.lastAt!, zoneOf(sim))}: ${phaseOf(familiarity).toLowerCase()}, at ${one(familiarity)} familiarity.`
        : `You haven’t spent an hour on it yet. ${def.definition}`,
      body: (
        <>
          <div className="grid grid-3">
            <Stat label="Familiarity" value={one(familiarity)} note={`${phaseOf(familiarity)} (Hidi & Renninger’s phases)`} />
            <Stat label="An Hour Now" value={def.recovery ? `−${rest.stress} Stress` : 'Work, Not Rest'} note={def.recovery ? `${rest.morale > 0 ? `+${rest.morale} morale, ` : ''}${Math.round(sat * 100)}% satiated${rest.loved ? ', loved' : ''}` : 'A trade studied, not a rest'} />
            <Stat label="It Grows" value={develops} note={`Now ${one(levelOf(sim, person, def.develops))}, toward its reach`} />
          </div>
          <p className="small"><strong>The hour.</strong> {def.activity}</p>
          <p className="small"><strong>To an actor.</strong> {def.actorUse}</p>
          {def.recovery && <p className="small"><strong>As rest.</strong> {RECOVERY[def.recovery].source}. Satiation halves every two days without it; loving it makes the hour better rest and no better practice.</p>}
          {def.notes && <p className="xs dim">The researcher’s caveat: {def.notes}</p>}
          <p className="xs dim">{def.activitySource ? `The activity: ${def.activitySource}. ` : 'The activity is done at home, and no source names a place. '}{def.actorUseSource ? `Its use: ${def.actorUseSource}.` : 'Its use to an actor has no source: SLATE’s reading.'}</p>
        </>
      ),
      ways: [{ to: targetSubject(def.develops), label: develops, detail: 'What an hour of it grows' }],
      provenance: `From docs/research/attributes/research-interests.json, at ${def.confidence} confidence.`,
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
    const tapes = (person.work ?? []).filter((w) => w.inputs.key.startsWith(`tape:${person.id}:${id}:`)).slice(-3).reverse();
    const demand = GENRE_DEMANDS[id];
    return {
      name: GENRE_BY_ID[id]!.label,
      kind: loved ? 'A Genre You Love' : 'A Genre',
      summary: g ? `Familiarity ${one(g.familiarity)} and practice ${one(g.practice)}: work in it is prepared ${Math.round((speed - 1) * 100)}% faster.` : `You haven’t studied it or worked in it yet. ${def.conventions}`,
      body: (
        <>
          <div className="grid grid-3">
            <Stat label="Familiarity" value={one(g?.familiarity ?? 0)} note="Watched, read and studied" />
            <Stat label="Practice" value={one(g?.practice ?? 0)} note="Work done in it: nights, self-tapes" />
            <Stat label="Preparation" value={`${Math.round((speed - 1) * 100)}% Faster`} note="The best of the two, never a cap on the work" />
          </div>
          <p className="small"><strong>Its conventions.</strong> {def.conventions}</p>
          {demand && (
            <>
              <p className="small"><strong>What it asks of an actor.</strong> {demand.claim}</p>
              <p className="small"><strong>{applied(id) && demand.tags.length ? 'Applied as requirements.' : 'Not applied.'}</strong>{' '}
                {applied(id) && demand.tags.length
                  ? <>Work in it reads {demand.tags.map((t, i) => <span key={t.tag}>{i ? ', ' : ''}{TECHNIQUE_LABEL[DEMAND_TECHNIQUE[t.tag]]} (you: {one(person.craft?.[DEMAND_TECHNIQUE[t.tag]] ?? 0)} of {MASTERED})</span>)}: {demand.tags.map((t) => t.why).join(' ')}</>
                  : demand.tags.length ? `The research found it only in single examples (${demand.tags.map((t) => DEMAND_LABEL[t.tag]).join(', ')}), at low confidence, so it isn’t treated as the genre’s convention.` : 'The research found nothing it asks past what all screen work does.'}
              </p>
              <p className="xs dim">The research, in its own words: {demand.sourceSupports} ({demand.how}; {demand.confidence} confidence). Uncertain: {demand.uncertainty}</p>
            </>
          )}
          <p className="small"><strong>To study it.</strong> {play ? `Read ${play.title}${play.by ? `, by ${play.by}` : ''}, a play of the kind the game has, or watch a film of the kind.` : 'Watch a film of the kind.'} A self-tape in it is finished work, judged as a camera scene leaning to its families ({def.families.join(', ')}).</p>
          <p className="xs dim">Its definition’s source: {def.source}.{demand ? ` Its demands’ source: ${demand.source}.` : ''}</p>
          <p className="small">{loved ? 'You love it: a day of work in it is a better day. Loving it doesn’t speed the work or cap it.' : 'Loving a genre makes a day of work in it better; it doesn’t make you better at it.'}</p>
        </>
      ),
      ways: [
        ...(applied(id) ? (demand?.tags ?? []).map((t) => ({ to: at('skill', DEMAND_TECHNIQUE[t.tag]), label: TECHNIQUE_LABEL[DEMAND_TECHNIQUE[t.tag]], detail: `What it asks for: ${DEMAND_LABEL[t.tag]}` })) : []),
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
    return {
      name: w.what,
      kind: w.taskLabel,
      summary: `Judged ${one(w.overall)} of 100${w.band ? `, ${w.band}` : ''}, on ${formatDate(w.at, zoneOf(sim))}.${chief ? ` ${chief}.` : w.mastery ? ' Everything it asked was met: the most it can be.' : ''}`,
      body: (
        <>
          <div className="grid grid-3">
            {dims.map(([d, q]) => <Stat key={d} label={DIMENSION_LABEL[d]} value={one(q)} note={DIMENSION_MEANS[d]} />)}
          </div>
          {w.limits.length > 0 && (
            <ul className="small">
              {w.limits.map((l, i) => <li key={i}>{l.label}: {l.by} points off the {DIMENSION_LABEL[l.dimension].toLowerCase()}</li>)}
            </ul>
          )}
          <p className="xs dim">Judged with readiness {Math.round(w.inputs.condition.readiness)}{w.inputs.condition.ill ? ', the flu' : ''}{w.inputs.condition.injured ? ', an injury' : ''}; difficulty {w.inputs.difficulty.toFixed(2)}; preparation {Object.entries(w.inputs.prep).map(([k, v]) => `${k} ${Math.round(v * 100)}% of ${Math.round((w.inputs.required[k] ?? 1) * 100)}%`).join(', ') || 'not read'}{w.inputs.families.length ? `; leaning to ${w.inputs.families.join(', ')}` : ''}.</p>
        </>
      ),
      ways: abilities.map((a) => ({ to: at('ability', a), label: abilityDef(a).label, detail: `Read at ${one(w.inputs.abilities[a]!)}` })),
      provenance: again ? `Judged under ${w.ruleset}; worked out again from its own inputs, ${one(again.overall)}.` : `Judged under ${w.ruleset}, before results kept their levels (2026-10-10), so it isn’t worked out again.`,
    };
  },
});

/** For a list: a mastered technique against MASTERED. */
export const masteredOf = (level: number) => level >= MASTERED;
