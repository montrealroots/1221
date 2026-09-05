/**
 * SLATE — scenes.
 *
 * A scene is a situation you are in, with choices in it. You walk into the
 * gym; you decide what to do there; what you decide costs time and money and
 * changes how you feel; you leave, and the world remembers. This is the
 * runtime under every one of them.
 *
 * The rules that keep it honest:
 *
 *  - A definition is trusted code. It says what a scene shows and what each
 *    choice does. The things a choice does are commands: money, time and
 *    every other fact still go through the system that owns them, and a
 *    scene cannot declare a purchase succeeded any more than a button can.
 *  - One scene is in the foreground at a time. It survives navigation, saving
 *    and reloading, and it can be left; leaving keeps everything already
 *    done.
 *  - Every step carries a revision. A stale click, a double click, a replayed
 *    request or a second tab hits a revision the scene has moved past, and
 *    is refused without touching anything.
 *  - Anything a scene commits carries its own idempotency key, so a retry of
 *    the same step returns the same result rather than charging twice.
 *  - A scene started somewhere is played there. Moving city, or leaving the
 *    place, interrupts it; coming back resumes it.
 *  - Typed text resolves to a choice on screen, or is refused as such. There
 *    is no path from prose to an engine command.
 */

import { CommandError, type Command, type Simulation } from '../core/simulation';
import type { Id, SceneSession, SceneState, SceneStatus } from '../domain/model';
import { CITIES } from '../content/geography';
import { placesIn } from '../content/places';
import { rememberFact, type FactSpec } from './memory';
import { resolveIntent, type IntentChoice } from './intent';

// ---------------------------------------------------------------------------
// What a definition looks like
// ---------------------------------------------------------------------------

export interface SceneChoice extends IntentChoice {
  /** A second line under the label: cost, time, what it means. */
  detail?: string;
  tone?: 'primary' | 'danger';
}

export interface SceneFact {
  label: string;
  value: string;
}

export interface SceneView {
  title: string;
  eyebrow?: string;
  text: string;
  choices: SceneChoice[];
  /** Things worth seeing beside the text: the quote, the time, your energy. */
  facts?: SceneFact[];
  /** Whether "skip to the end" is offered here. */
  canSkip?: boolean;
  /** Whether leaving is offered here; default true. */
  canLeave?: boolean;
  leaveLabel?: string;
}

export interface SceneCheck {
  ok: boolean;
  reason?: string;
}

export type SceneContext = SceneSession['context'];
export type SceneInput = Record<string, unknown>;

export interface SceneStart {
  node: string;
  context: SceneContext;
  placeId?: string;
  participantIds?: Id[];
  refType?: string;
  refId?: Id;
}

/** What a definition can do while handling a choice. */
export interface SceneRuntime {
  readonly session: SceneSession;
  /** A line in the transcript. `who` is 'world' unless somebody is speaking. */
  say(text: string, who?: string): void;
  /** Runs a command once. The same key in the same scene replays the result. */
  commit<R>(key: string, command: Command<Record<string, unknown>, R>): R;
  go(node: string): void;
  finish(): void;
  interrupt(reason: string, resumable?: boolean): void;
  /** Something somebody in the scene will remember afterwards. */
  remember(personId: Id, fact: FactSpec): void;
}

export interface SceneDefinition {
  id: string;
  version: number;
  title: string;
  /** Must be played standing where it started. */
  placeBound?: boolean;
  /** Whether it can be started now, and why not. Checked before anything is created. */
  available(sim: Simulation, input: SceneInput): SceneCheck;
  start(sim: Simulation, input: SceneInput): SceneStart;
  view(sim: Simulation, session: SceneSession): SceneView;
  choose(sim: Simulation, session: SceneSession, choiceId: string, ctx: SceneRuntime): void;
  /** The whole scene with sensible defaults, by the same rules. Absent means it cannot be skipped. */
  summarise?(sim: Simulation, session: SceneSession, ctx: SceneRuntime): void;
  /** Extra checks on resuming after an interruption. */
  resume?(sim: Simulation, session: SceneSession): SceneCheck;
}

/** What a definition throws when a saved session sits at a step it does not know. */
export function unknownStep(): CommandError {
  return new CommandError('This scene is at a step this build does not know.');
}

// ---------------------------------------------------------------------------
// The registry
// ---------------------------------------------------------------------------

const REGISTRY = new Map<string, SceneDefinition>();

/** Registers a definition. The same id at the same version is idempotent. */
export function defineScene(def: SceneDefinition): SceneDefinition {
  const prior = REGISTRY.get(def.id);
  if (prior && prior.version !== def.version) {
    throw new Error(`Scene '${def.id}' is defined twice at different versions (${prior.version} and ${def.version}).`);
  }
  REGISTRY.set(def.id, def);
  return def;
}

export function sceneDefinition(id: string): SceneDefinition | undefined {
  return REGISTRY.get(id);
}

export function sceneDefinitions(): SceneDefinition[] {
  return [...REGISTRY.values()];
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export const MAX_TRANSCRIPT_LINES = 80;
export const CLOSED_SESSIONS_KEPT = 40;

function state(sim: Simulation): SceneState {
  return (sim.universe.scenes ??= { version: 2, sessions: {} });
}

/** The scene in the foreground: active, or interrupted and waiting. */
export function activeScene(sim: Simulation): SceneSession | undefined {
  const data = sim.universe.scenes;
  if (!data?.activeId) return undefined;
  const session = data.sessions[data.activeId];
  return session && (session.status === 'active' || session.status === 'interrupted') ? session : undefined;
}

/** What a scene shows right now. A scene whose definition is gone can still be left. */
export function sceneView(sim: Simulation, session: SceneSession): SceneView {
  const def = REGISTRY.get(session.definitionId);
  if (!def || def.version !== session.version) {
    return {
      title: 'Scene Update Needed',
      text: 'This saved scene runs on a definition this build does not have. You can leave it safely; everything it already did stays done.',
      choices: [],
      canLeave: true,
    };
  }
  if (session.status === 'interrupted') {
    return {
      title: def.title,
      eyebrow: 'Interrupted',
      text: session.interruption?.reason ?? 'The scene was interrupted.',
      choices: [],
      canLeave: true,
    };
  }
  return def.view(sim, session);
}

function say(sim: Simulation, session: SceneSession, who: string, text: string): void {
  session.transcript.push({ at: sim.now, who, text });
  if (session.transcript.length > MAX_TRANSCRIPT_LINES) {
    session.transcript = session.transcript.slice(-MAX_TRANSCRIPT_LINES);
  }
  session.updatedAt = sim.now;
}

function trim(data: SceneState): void {
  const closed = Object.values(data.sessions)
    .filter((s) => s.status === 'completed' || s.status === 'abandoned')
    .sort((a, b) => (b.endedAt ?? b.updatedAt) - (a.endedAt ?? a.updatedAt) || b.id.localeCompare(a.id));
  for (const session of closed.slice(CLOSED_SESSIONS_KEPT)) delete data.sessions[session.id];
}

function placeName(cityId: string, placeId: string | undefined): string {
  if (!placeId) return 'where you were';
  return placesIn(cityId).find((p) => p.id === placeId)?.name ?? 'where you were';
}

/** Why the scene cannot continue where the player is now, if it cannot. */
function displaced(sim: Simulation, def: SceneDefinition, session: SceneSession): string | undefined {
  const player = sim.player;
  if (session.locationId !== player.currentLocationId) {
    const here = CITIES.get(player.currentLocationId)?.name ?? 'another city';
    const there = CITIES.get(session.locationId)?.name ?? 'where it started';
    return `You are in ${here} now. This started in ${there}, and it is played there.`;
  }
  if (def.placeBound && session.placeId && player.currentPlaceId !== session.placeId) {
    return `You are no longer at ${placeName(session.locationId, session.placeId)}. Go back to pick this up, or leave it.`;
  }
  return undefined;
}

function close(sim: Simulation, session: SceneSession, status: 'completed' | 'abandoned'): void {
  session.status = status;
  session.endedAt = sim.now;
  session.updatedAt = sim.now;
  const data = state(sim);
  if (data.activeId === session.id) data.activeId = undefined;
  trim(data);
  sim.emit(status === 'completed' ? 'scene.completed' : 'scene.abandoned', {
    sceneId: session.id, definitionId: session.definitionId, committed: session.committed.length,
  });
}

function interrupt(sim: Simulation, session: SceneSession, reason: string, resumable: boolean): void {
  session.status = 'interrupted';
  session.interruption = { at: sim.now, reason, resumable };
  session.revision += 1;
  say(sim, session, 'world', reason);
}

function runtimeFor(sim: Simulation, session: SceneSession): SceneRuntime {
  return {
    session,
    say: (text, who = 'world') => say(sim, session, who, text),
    commit: <R,>(key: string, command: Command<Record<string, unknown>, R>): R => {
      const idempotencyKey = `scene:${session.id}:${key}`;
      const value = sim.must<R>({ ...command, idempotencyKey });
      if (!session.committed.includes(idempotencyKey)) session.committed.push(idempotencyKey);
      return value;
    },
    go: (node) => { session.node = node; },
    finish: () => close(sim, session, 'completed'),
    interrupt: (reason, resumable = true) => interrupt(sim, session, reason, resumable),
    remember: (personId, fact) => { rememberFact(sim, personId, fact); },
  };
}

function current(sim: Simulation, id: Id, revision: number): SceneSession {
  const data = state(sim);
  const session = data.sessions[id];
  if (!session || data.activeId !== id) throw new CommandError('That scene is no longer in front of you.');
  if (!Number.isInteger(revision) || session.revision !== revision) {
    throw new CommandError('The scene has moved on since that was shown. Look at the current choices.');
  }
  return session;
}

function definitionFor(session: SceneSession): SceneDefinition {
  const def = REGISTRY.get(session.definitionId);
  if (!def || def.version !== session.version) {
    throw new CommandError('This scene runs on a definition this build does not have. Leave it; what it did stays done.');
  }
  return def;
}

function begin(sim: Simulation, def: SceneDefinition, input: SceneInput, refs: { refType?: string; refId?: Id }): SceneSession {
  const data = state(sim);
  if (activeScene(sim)) throw new CommandError('Finish or leave the scene you are in first.');
  const check = def.available(sim, input);
  if (!check.ok) throw new CommandError(check.reason ?? 'That is not available right now.');
  const initial = def.start(sim, input);
  const session: SceneSession = {
    id: sim.nextId('scene'),
    saveId: sim.universe.meta.id,
    definitionId: def.id,
    version: def.version,
    revision: 0,
    node: initial.node,
    status: 'active',
    locationId: sim.player.currentLocationId,
    placeId: initial.placeId,
    participantIds: initial.participantIds ?? [],
    startedAt: sim.now,
    updatedAt: sim.now,
    context: initial.context,
    committed: [],
    transcript: [],
    refType: refs.refType ?? initial.refType,
    refId: refs.refId ?? initial.refId,
  };
  data.sessions[session.id] = session;
  data.activeId = session.id;
  say(sim, session, 'world', def.view(sim, session).text);
  trim(data);
  sim.emit('scene.started', { sceneId: session.id, definitionId: def.id });
  return session;
}

function summarise(sim: Simulation, def: SceneDefinition, session: SceneSession): void {
  if (!def.summarise) throw new CommandError('This one has to be played through; there is no short version of it.');
  say(sim, session, 'you', 'You get on with it.');
  def.summarise(sim, session, runtimeFor(sim, session));
  if (session.status === 'active') close(sim, session, 'completed');
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

export interface ChooseResult {
  status: SceneStatus;
  /** Something to tell the player that is not a refusal: an interruption, an unsupported line. */
  message?: string;
  /** Two or three choices the typed text could have meant, by id. */
  ambiguous?: string[];
  unsupported?: boolean;
  help?: boolean;
}

export function registerScenes(sim: Simulation): void {
  state(sim);

  sim.onCommand<{ definitionId: string; input?: SceneInput; refType?: string; refId?: Id }, { sceneId: Id; status: SceneStatus }>(
    'scene.start',
    (p, { sim: s }) => {
      const def = REGISTRY.get(p.definitionId);
      if (!def) throw new CommandError('That scene is not available.');
      const session = begin(s, def, p.input ?? {}, { refType: p.refType, refId: p.refId });
      return { sceneId: session.id, status: session.status };
    },
  );

  sim.onCommand<{ sceneId: Id; revision: number; choiceId?: string; text?: string }, ChooseResult>(
    'scene.choose',
    (p, { sim: s }) => {
      const session = current(s, p.sceneId, p.revision);
      const def = definitionFor(session);
      if (session.status === 'interrupted') {
        return { status: 'interrupted', message: session.interruption?.reason };
      }
      if (session.status !== 'active') throw new CommandError('That scene is over.');

      const away = displaced(s, def, session);
      if (away) {
        interrupt(s, session, away, true);
        return { status: 'interrupted', message: away };
      }

      const view = def.view(s, session);
      let choice: SceneChoice | undefined;
      if (p.choiceId !== undefined) {
        choice = view.choices.find((c) => c.id === p.choiceId);
        if (!choice) throw new CommandError('That is not one of the choices here.');
      } else {
        const text = typeof p.text === 'string' ? p.text : '';
        const intent = resolveIntent(text, view.choices);
        if (intent.kind === 'choice') {
          choice = view.choices.find((c) => c.id === intent.choiceId);
        } else if (intent.kind === 'runtime') {
          if (intent.action === 'help') return { status: 'active', help: true };
          if (intent.action === 'leave') {
            const wasDone = session.committed.length > 0;
            say(s, session, 'you', 'You leave.');
            say(s, session, 'world', wasDone ? 'What you did stays done.' : 'Nothing happened yet.');
            close(s, session, 'abandoned');
            return { status: 'abandoned' };
          }
          if (!def.summarise || view.canSkip === false) {
            return { status: 'active', unsupported: true, message: 'This one has to be played through.' };
          }
          summarise(s, def, session);
          return { status: session.status };
        } else if (intent.kind === 'ambiguous') {
          return { status: 'active', ambiguous: intent.candidates, message: 'That could mean more than one thing. Which?' };
        } else {
          return {
            status: 'active', unsupported: true,
            message: 'That is not something you can do here yet. The choices on screen are what there is.',
          };
        }
      }
      if (!choice) throw new CommandError('That is not one of the choices here.');
      if (choice.disabled) throw new CommandError(choice.disabled);

      say(s, session, 'you', choice.label);
      def.choose(s, session, choice.id, runtimeFor(s, session));
      if (session.status === 'active') {
        session.revision += 1;
        say(s, session, 'world', def.view(s, session).text);
      } else if (session.status === 'completed' || session.status === 'abandoned') {
        session.revision += 1;
      }
      return { status: session.status };
    },
  );

  sim.onCommand<{ sceneId: Id; revision: number }, { status: SceneStatus }>(
    'scene.skip',
    (p, { sim: s }) => {
      const session = current(s, p.sceneId, p.revision);
      const def = definitionFor(session);
      if (session.status !== 'active') throw new CommandError('That scene is not running.');
      const away = displaced(s, def, session);
      if (away) throw new CommandError(away);
      summarise(s, def, session);
      return { status: session.status };
    },
  );

  sim.onCommand<{ definitionId: string; input?: SceneInput; refType?: string; refId?: Id }, { sceneId: Id; status: SceneStatus; lines: string[] }>(
    'scene.quick',
    (p, { sim: s }) => {
      const def = REGISTRY.get(p.definitionId);
      if (!def) throw new CommandError('That scene is not available.');
      if (!def.summarise) throw new CommandError('This one has to be played through; there is no short version of it.');
      const session = begin(s, def, p.input ?? {}, { refType: p.refType, refId: p.refId });
      summarise(s, def, session);
      return { sceneId: session.id, status: session.status, lines: session.transcript.map((l) => l.text) };
    },
  );

  sim.onCommand<{ sceneId: Id; revision: number }, { status: SceneStatus }>(
    'scene.leave',
    (p, { sim: s }) => {
      const session = current(s, p.sceneId, p.revision);
      if (session.status !== 'active' && session.status !== 'interrupted') throw new CommandError('That scene is already over.');
      const wasDone = session.committed.length > 0;
      say(s, session, 'you', 'You leave.');
      say(s, session, 'world', wasDone
        ? 'What you already did — the time, the money, the effects — stays done.'
        : 'Nothing had happened yet.');
      close(s, session, 'abandoned');
      return { status: session.status };
    },
  );

  sim.onCommand<{ sceneId: Id }, { status: SceneStatus }>(
    'scene.resume',
    (p, { sim: s }) => {
      const data = state(s);
      const session = data.sessions[p.sceneId];
      if (!session || data.activeId !== session.id) throw new CommandError('That scene is not waiting for you.');
      if (session.status !== 'interrupted') throw new CommandError('That scene was not interrupted.');
      if (session.interruption && !session.interruption.resumable) {
        throw new CommandError('That scene cannot be picked up again. Leave it; what it did stays done.');
      }
      const def = definitionFor(session);
      const away = displaced(s, def, session);
      if (away) throw new CommandError(away);
      const extra = def.resume?.(s, session);
      if (extra && !extra.ok) throw new CommandError(extra.reason ?? 'You cannot pick that up right now.');
      session.status = 'active';
      session.interruption = undefined;
      session.revision += 1;
      say(s, session, 'world', 'You pick up where you left off.');
      return { status: session.status };
    },
  );
}
