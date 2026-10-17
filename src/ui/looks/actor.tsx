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
import { workloadWords } from '@/engine/systems/workload';
import { DEMAND_LABEL, DEMAND_TECHNIQUE, GENRE_DEMANDS, applied } from '@/engine/content/demands';
import { COURSES, type Skill } from '@/engine/content/school';
import { Stat } from '@/ui/components/primitives';
import { Segments } from '@/ui/components/WorkThrough';
import { briefKinds } from '@/engine/content/briefs';
import { TEMPLATES } from '@/engine/content/coursework';
import { abilityReaders } from '@/engine/systems/material';
import { defineLook, type Way } from './registry';
import { at } from './subject';

const one = (x: number) => x.toFixed(1);
const player = (sim: Simulation): Person | undefined => sim.universe.people[sim.universe.playerId];
const zoneOf = (sim: Simulation) => sim.zone;

/** What a target is called: an ability’s label, or a technique’s. */
export const targetLabel = (t: AbilityId | Skill): string => (isAbility(targetId(t)) ? abilityDef(targetId(t) as AbilityId).label : TECHNIQUE_LABEL[t as Skill]);
/** Where a target opens: an ability’s look, or a technique’s (the school’s skill). */
export const targetSubject = (t: AbilityId | Skill) => (isAbility(targetId(t)) ? at('ability', targetId(t)) : at('skill', t));

/** The tasks and dimensions that read an ability (`abilityReaders`, systems/material.ts): its look’s and the Profile’s. */
export const readersOf = (id: AbilityId): { task: string; label: string; dims: Dimension[] }[] => abilityReaders(id);

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
  // A class by its name and a coursework step by its part’s words (from 2026-10-17, brief 14): until then the course’s
  // code alone and the part’s key, "Class: DRAM 153a", "Coursework: interpretation".
  if (kind === 'class') { const c = COURSES.find((x) => x.code === rest); return c ? `Class: ${c.name} (${c.code})` : `Class: ${rest}`; }
  if (kind === 'prepare') return `Coursework: ${(TASK_PROFILES.scene?.prepLabel?.[rest ?? ''] ?? rest ?? 'preparation').toLowerCase()}`;
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
        summary: `You haven’t trained as an actor, so it’s never been measured. ${def.definition}`,
        body: <p className="small"><strong>How it grows.</strong> {def.develops}</p>,
        provenance: def.source,
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
      ...kin.map((k) => ({ to: at('skill', k), label: TECHNIQUE_LABEL[k], detail: 'A related technique: the classes that grow one grow both' })),
      ...(person.work ?? []).filter((w) => w.inputs.abilities[id] !== undefined).slice(-3).reverse().map((w) => ({ to: at('work', w.inputs.key), label: w.what, detail: `${w.taskLabel}, ${one(w.overall)}: judged with yours at ${one(w.inputs.abilities[id]!)}` })),
    ];
    return {
      name: def.label,
      kind: def.general ? 'A General Ability' : 'An Acting Ability',
      summary: `You’re at ${one(level)} of ${one(full)}${level >= full ? ', full' : ''}: ${def.definition.charAt(0).toLowerCase()}${def.definition.slice(1)}`,
      body: (
        <>
          <div className="grid grid-3">
            <Stat label="Now" value={one(level)} note={level >= full ? 'Full: no work asks more of it' : `${one(full - level)} to full`} />
            <Stat label="Classes Reach" value={classesGrow(id) ? one(reach) : '—'} note={classesGrow(id) ? 'Classes and coursework level off here; practice takes you past it' : id === 'stamina' ? 'No limit from classes: workouts build it, and so do classes that work the body as hard' : id === 'discipline' ? 'Classes don’t build it; practice kept up does' : 'Classes don’t build it; performing in front of people does'} />
            <Stat label="Last Change" value={recent[0] ? `+${recent[0].delta.toFixed(2)}` : 'None Yet'} note={recent[0] ? `${sourceWords(recent[0].source)}, ${formatDate(recent[0].at, zoneOf(sim))}` : `None in your last ${DEVELOPMENT.historyKept} changes`} />
          </div>
          <p className="small"><strong>How it grows.</strong> {def.develops}</p>
          <p className="small"><strong>Where it started.</strong> {def.derivedFrom}</p>
          {/* What it does, in its own sentence, and which work reads it (from 2026-10-17, brief 11, A4): until then What It Does
              was the readers alone, and the ability’s own sentence, corrected against the code in the attributes brief’s
              phase 2, was shown nowhere: every ability has a reader, so the line that fell back to it never did. */}
          <p className="small"><strong>What it does.</strong> {def.affects}</p>
          <p className="small"><strong>Where it counts.</strong> {readers.map((r) => `${r.label}: ${r.dims.map((d) => DIMENSION_LABEL[d].toLowerCase()).join(', ')}`).join('; ')}.</p>
          {exercise && <p className="small"><strong>To practice it.</strong> {exercise.label}: {exercise.how} {exercise.kind === 'slate' ? '(An exercise made for the game.)' : exercise.kind === 'named' ? '(A named exercise from real acting teaching.)' : '(Put together from real practice.)'}</p>}
          {id === 'stamina' && <p className="small"><strong>Its scale.</strong> Stamina is your fitness. Full is the fittest a body your age can be ({one(full)} now). A workout builds it and holds it for {FITNESS.heldDays} days, and so does a class that works the body as hard (Movement Invention, stage combat). After that it falls {FITNESS.perDay} a day toward {EVERYDAY_FITNESS}, as an untrained body’s does. A second workout on the same day builds half as much.</p>}
          {recent.length > 0 && (
            <ul className="small">
              {recent.map((h, i) => <li key={i}>{formatDate(h.at, zoneOf(sim))}: +{h.delta.toFixed(3)}, {sourceWords(h.source)}</li>)}
            </ul>
          )}
        </>
      ),
      ways,
      provenance: def.source,
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
    // A take of a brief retired on 2026-10-16 is still the genre’s (`briefKinds`): until then only a brief offered now was looked up.
    const tapes = (person.work ?? []).filter((w) => w.inputs.key.startsWith(`brief:${person.id}:`) && briefKinds(w.inputs.key.split(':')[2] ?? '').includes(id)).slice(-3).reverse();
    const demand = GENRE_DEMANDS[id];
    return {
      name: GENRE_BY_ID[id]!.label,
      kind: loved ? 'A Genre You Love' : 'A Genre',
      summary: g ? `Familiarity ${one(g.familiarity)}, work in it ${one(g.practice)}. The better of the two is how well you know it: a part in a play of its kind is learned ${Math.round((speed - 1) * 100)}% faster, and it counts as Knowing The Genre when you prepare a brief in it.` : `You haven’t studied it or worked in it yet. ${def.conventions}`,
      body: (
        <>
          <div className="grid grid-3">
            <Stat label="Familiarity" value={one(g?.familiarity ?? 0)} note="Films watched and plays read" />
            <Stat label="Work In It" value={one(g?.practice ?? 0)} note="Nights on stage and self-tapes in it" />
            {/* What it speeds, said (from 2026-10-12: until then "The best of the two, never a cap on the work", beside a
                summary saying a brief in it reads knowing it, so it read as speeding the brief; a brief’s steps read the
                material met before, `prepSpeed`, and never this). */}
            <Stat label="Preparation" value={`${Math.round((speed - 1) * 100)}% Faster`} note="For a scene or a part from a play of its kind, by the better of the two. A brief’s steps speed up with material you’ve met before instead." />
          </div>
          <p className="small"><strong>Its conventions.</strong> {def.conventions}</p>
          {demand && (
            <>
              <p className="small"><strong>What it asks of an actor.</strong> {demand.claim}</p>
              <p className="small"><strong>{applied(id) && demand.tags.length ? 'What a self-tape in it asks.' : 'Why it adds no requirement.'}</strong>{' '}
                {/* A self-tape’s, which every brief in the genre stages (tests/briefs-content.test.ts); the research’s reasons for
                    each go in the small print below (from 2026-10-17, brief 14). Until 2026-10-13 this
                    said “Work in it reads”, and a night of a play of the kind or a class scene from one reads its own
                    material’s techniques instead (`playReads`, `workContext`): a farce’s night read no clown. */}
                {applied(id) && demand.tags.length
                  ? <>A self-tape in it calls for {demand.tags.map((t, i) => <span key={t.tag}>{i ? ', ' : ''}{TECHNIQUE_LABEL[DEMAND_TECHNIQUE[t.tag]]} (yours: {one(person.craft?.[DEMAND_TECHNIQUE[t.tag]] ?? 0)} of {MASTERED})</span>)}.{demand.basis === 'definition' ? ' This follows from how the genre is defined, not from a source that says so.' : ''} A night of a play of its kind, or a class scene from one, calls for its own material’s techniques instead.</>
                  : demand.belongsTo ? `What the research found (${demand.tags.map((t) => DEMAND_LABEL[t.tag]).join(', ') || 'no technique'}) belongs to ${demand.belongsTo}, not to the genre as a whole, so the genre adds no requirement of its own.`
                  : demand.tags.length ? `The research found this only in single examples (${demand.tags.map((t) => DEMAND_LABEL[t.tag]).join(', ')}), with low confidence, so the game doesn’t treat it as a requirement of the genre.` : 'The research found no requirement of its own.'}
              </p>
              <p className="xs dim">{applied(id) && demand.tags.length ? `Why it’s applied, in the research’s words: ${demand.tags.map((t) => t.why).join(' ')} ` : ''}What the research says: {demand.sourceSupports} ({demand.how}; {demand.confidence} confidence). Still uncertain: {demand.uncertainty}</p>
            </>
          )}
          {/* Its register (from 2026-10-16, `GENRE_REGISTER`): what every take of a brief written for it reads. */}
          {concernsOf(id).length > 0 && (
            <>
              <p className="small"><strong>How its scenes are played.</strong> {registerBasisWords(id)}</p>
              <ul className="small">{concernsOf(id).map((c) => <li key={c}>{concernWords(c)}</li>)}</ul>
            </>
          )}
          <p className="small"><strong>To study it.</strong> Press Study It beside it under Genres on your Player Profile. {play ? `You’ll read ${play.title}${play.by ? `, by ${play.by}` : ''}, a play of its kind.` : 'You’ll watch a film of its kind.'} Its brief is finished work: you tape it, and it’s judged beat by beat like any taped brief, on what its own material asks.</p>
          <p className="xs dim">Source for its definition: {def.source}.{demand ? ` Source for what it asks: ${demand.source}.` : ''}</p>
          <p className="small">{loved ? 'You love it, so a day of work in it is a better day. Loving it doesn’t make the work faster or limit it.' : 'Loving a genre makes a day of work in it better. It doesn’t make you better at it.'}</p>
        </>
      ),
      ways: [
        ...(applied(id) ? (demand?.tags ?? []).map((t) => ({ to: at('skill', DEMAND_TECHNIQUE[t.tag]), label: TECHNIQUE_LABEL[DEMAND_TECHNIQUE[t.tag]], detail: `What it asks for: ${DEMAND_LABEL[t.tag]}` })) : []),
        ...[...new Set(concernsOf(id).flatMap(concernDraws))].map((a) => ({ to: at('ability', a), label: ABILITY_DEFS.find((d) => d.id === a)?.label ?? a, detail: `Its scenes call on it: ${concernsOf(id).filter((c) => concernDraws(c).includes(a)).map((c) => CONCERNS[c].label).join(', ')}` })),
        ...tapes.map((w) => ({ to: at('work', w.inputs.key), label: w.what, detail: `${one(w.overall)}, ${formatDate(w.at, zoneOf(sim))}` })),
      ],
      provenance: `Its definition was ${def.how === 'read directly' ? 'read at the source' : 'taken from a search summary'}, and what it asks is held with ${demand?.confidence ?? 'low'} confidence.`,
    };
  },
});

// ---------------------------------------------------------------------------
// A piece of finished work
// ---------------------------------------------------------------------------

interface TheWorkDone { w: WorkRecord; person: Person }

defineLook<TheWorkDone>('work', {
  gone: 'That piece isn’t on your record anymore. The record keeps your latest 160 pieces.',
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
    const partWords = (k: string) => (profile?.prepLabel?.[k] ?? (k === 'approach' ? 'How you play it' : k.replace(/_/g, ' '))).toLowerCase();
    const familyWords = (f: string) => (GENRE_BY_ID[f]?.label ?? f.replace(/_/g, ' ')).toLowerCase();
    const prepared = Object.entries(w.inputs.prep).map(([k, v]) => `${partWords(k)} at ${Math.round(v * 100)}% (complete at ${Math.round((w.inputs.required[k] ?? 1) * 100)}%)`);
    return {
      name: w.what,
      kind: w.taskLabel,
      summary: `Judged ${one(w.overall)} of 100${w.band ? `, ${BAND_WORD[w.band] ?? w.band}` : ''}, on ${formatDate(w.at, zoneOf(sim))}.${chief ? ` ${chief}.` : w.mastery ? ' You met everything it asked, so it couldn’t have scored higher.' : ''}`,
      body: (
        <>
          <div className="grid grid-3">
            {dims.map(([d, q]) => <Stat key={d} label={DIMENSION_LABEL[d]} value={one(q)} note={DIMENSION_MEANS[d]} />)}
          </div>
          {w.limits.length > 0 && (
            <ul className="small">
              {w.limits.map((l, i) => <li key={i}>{l.label}: {l.by} points off {DIMENSION_LABEL[l.dimension].toLowerCase()}{l.whole !== undefined ? `, ${l.whole} off the whole` : ''}</li>)}
            </ul>
          )}
          {again?.piece && <Segments e={again} caption="Moment By Moment" />}
          {/* A night’s workload, from its own record (from 2026-10-16, brief 10, `workloadWords`): what it asked of stamina
              and what it cost. A night kept under evaluation-10 kept none, and shows none. */}
          {workloadWords(w) && <p className="small" data-workload="">{workloadWords(w)} <span className="xs dim">Source for the running time: {w.inputs.piece!.night!.from}.</span></p>}
          <p className="xs dim">Judged with readiness at {Math.round(w.inputs.condition.readiness)}{w.inputs.condition.ill ? ', with the flu' : ''}{w.inputs.condition.injured ? ', with an injury' : ''}{w.inputs.condition.concussed ? ', with a concussion mending' : ''}; difficulty {w.inputs.difficulty.toFixed(2)}; {prepared.length ? `preparation: ${prepared.join(', ')}` : 'preparation not counted'}{w.inputs.families.length ? `; its genres: ${w.inputs.families.map(familyWords).join(', ')}` : ''}.</p>
        </>
      ),
      ways: abilities.map((a) => ({ to: at('ability', a), label: abilityDef(a).label, detail: `Yours was ${one(w.inputs.abilities[a]!)}` })),
      provenance: again ? `Worked out again from what it was judged on, it comes to ${one(again.overall)}.` : w.inputs.levels ? 'The rules have changed since it was judged, so it isn’t worked out again. Its result stands as it was.' : 'It was judged before results kept their details, so it can’t be worked out again.',
    };
  },
});

/** For a list: a mastered technique against MASTERED. */
export const masteredOf = (level: number) => level >= MASTERED;
