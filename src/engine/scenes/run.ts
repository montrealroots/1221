/**
 * Going for a run, played out.
 *
 * Where — a park or a beach near you, or the streets outside — and how hard.
 * The weather is what it is. The run itself is `life.do_activity`; getting
 * to the park is `go.to` on foot, which is its own small warm-up.
 */

import { CommandError, type Simulation } from '../core/simulation';
import { MS_MINUTE, formatDuration, formatTime } from '../core/time';
import type { SceneSession } from '../domain/model';
import { placesIn, type Place } from '../content/places';
import { bathroomFor, placesNear } from '../systems/places';
import { weatherAt } from '../systems/weather';
import { readiness } from '../systems/life';
import { defineScene, unknownStep, type SceneChoice, type SceneRuntime } from '../systems/scenes';

const PACE: readonly { id: string; label: string; aliases: string[]; factor: number; note: string }[] = [
  { id: 'easy', label: 'Easy Jog', aliases: ['easy', 'jog', 'slow'], factor: 1.0, note: 'Conversation pace. The kind you can do tomorrow too.' },
  { id: 'steady', label: 'Steady', aliases: ['steady', 'normal', 'medium'], factor: 1.0, note: 'Honest work. You will know you did it.' },
  { id: 'hard', label: 'Hard Intervals', aliases: ['hard', 'intervals', 'fast', 'sprints'], factor: 0.7, note: 'Shorter and much worse. Fitness likes it; the rest of you does not.' },
];

function num(session: SceneSession, key: string): number {
  return Number(session.context[key] ?? 0);
}

function routePlace(session: SceneSession): Place | undefined {
  const id = session.context['route'];
  if (!id || id === 'streets') return undefined;
  return placesIn(session.locationId).find((p) => p.id === String(id));
}

function describe(effects: Record<string, number>): string {
  const parts: string[] = [];
  if (Math.abs(effects['stress'] ?? 0) >= 1) parts.push(`stress down ${Math.abs(Math.round(effects['stress'] ?? 0))}`);
  if ((effects['fitness'] ?? 0) >= 0.5) parts.push(`fitness up ${Math.round((effects['fitness'] ?? 0) * 10) / 10}`);
  if (Math.abs(effects['energy'] ?? 0) >= 1) parts.push(`energy down ${Math.abs(Math.round(effects['energy'] ?? 0))}`);
  if ((effects['morale'] ?? 0) >= 1) parts.push(`morale up ${Math.round(effects['morale'] ?? 0)}`);
  return parts.length > 0 ? parts.join(', ') + '.' : 'Nothing you would notice.';
}

export const RUN_SCENE = defineScene({
  id: 'life.run',
  version: 1,
  title: 'A Run',

  available(sim) {
    if (sim.player.wellbeing.energy < 15) return { ok: false, reason: 'Not on those legs. Rest first.' };
    return { ok: true };
  },

  start(_sim, input) {
    const asked = input['minutes'] === undefined ? 45 : Number(input['minutes']);
    if (!Number.isInteger(asked) || asked < 20 || asked > 120) throw new CommandError('A run is between twenty minutes and two hours.');
    return { node: 'route', context: { minutes: asked, route: null, pace: null, effects: '{}', ran: 0 } };
  },

  view(sim, session) {
    const player = sim.player;
    const weather = weatherAt(sim, player.currentLocationId);
    const sky = weather ? `${weather.icon} ${weather.temperature}${weather.fahrenheit ? '°F' : '°C'}, ${weather.condition}.` : '';
    switch (session.node) {
      case 'route': {
        const spots = placesNear(sim, { mode: 'walk', limit: 120 })
          .filter((entry) => entry.place.kind === 'park' || entry.place.kind === 'beach')
          .slice(0, 3);
        const choices: SceneChoice[] = spots.map(({ place, journey }) => ({
          id: `route:${place.id}`, label: `Run At ${place.name}`, aliases: [place.name],
          detail: `${formatDuration(journey.minutes * MS_MINUTE)} away on foot${place.real ? ' · real' : ''}`,
        }));
        choices.push({ id: 'route:streets', label: 'The Streets Outside', aliases: ['streets', 'outside', 'here', 'around the block'], detail: 'Out the door and go.' });
        return {
          title: 'Where To Run',
          eyebrow: `${formatDuration(num(session, 'minutes') * MS_MINUTE)} planned`,
          text: `${sky} Energy ${Math.round(player.wellbeing.energy)}, readiness ${Math.round(readiness(player))}.`,
          choices,
          canSkip: true,
        };
      }
      case 'pace': {
        const place = routePlace(session);
        return {
          title: place ? place.name : 'The Streets',
          eyebrow: 'How hard',
          text: place ? `${place.about} ${sky}` : `Out the door. ${sky}`,
          choices: PACE.map((p) => ({
            id: `pace:${p.id}`, label: p.label, aliases: p.aliases,
            detail: `${formatDuration(Math.round(num(session, 'minutes') * p.factor) * MS_MINUTE)} · ${p.note}`,
          })),
          canSkip: true,
        };
      }
      case 'reflect': {
        const effects = JSON.parse(String(session.context['effects'] ?? '{}')) as Record<string, number>;
        const choices: SceneChoice[] = [];
        if (bathroomFor(sim, player)) choices.push({ id: 'shower', label: 'Shower', aliases: ['wash', 'clean up'] });
        choices.push({ id: 'finish', label: 'Back To The Day', aliases: ['done', 'ok', 'finish'], tone: 'primary' });
        return {
          title: 'Done',
          eyebrow: formatTime(sim.now, sim.zone),
          text: `${formatDuration(num(session, 'ran') * MS_MINUTE)}. ${describe(effects)} Readiness is ${Math.round(readiness(player))} now.`,
          choices,
          canSkip: false,
        };
      }
      default:
        throw unknownStep();
    }
  },

  choose(sim, session, choiceId, ctx) {
    if (session.node === 'route' && choiceId.startsWith('route:')) {
      session.context['route'] = choiceId.slice(6);
      ctx.go('pace');
      return;
    }
    if (session.node === 'pace' && choiceId.startsWith('pace:')) {
      const pace = PACE.find((p) => p.id === choiceId.slice(5));
      if (!pace) throw new CommandError('Pick a pace.');
      session.context['pace'] = pace.id;
      run(sim, session, ctx, pace.factor);
      return;
    }
    if (session.node === 'reflect') {
      if (choiceId === 'shower') {
        ctx.commit('shower', { kind: 'life.shower', payload: {} });
        ctx.say('Hot water. Better.');
        ctx.finish();
        return;
      }
      if (choiceId === 'finish') { ctx.finish(); return; }
    }
    throw new CommandError('That is not a choice here.');
  },

  summarise(sim, session, ctx) {
    if (session.node === 'route') session.context['route'] = 'streets';
    if (session.node !== 'reflect') run(sim, session, ctx, 1.0);
    const effects = JSON.parse(String(session.context['effects'] ?? '{}')) as Record<string, number>;
    ctx.say(`${formatDuration(num(session, 'ran') * MS_MINUTE)} on the ${routePlace(session)?.name ?? 'streets'}. ${describe(effects)}`);
  },
});

function run(sim: Simulation, session: SceneSession, ctx: SceneRuntime, factor: number): void {
  const place = routePlace(session);
  if (place && sim.player.currentPlaceId !== place.id) {
    const trip = ctx.commit<{ note: string }>(`go:${place.id}`, { kind: 'go.to', payload: { placeId: place.id, mode: 'walk' } });
    ctx.say(trip.note);
  }
  const minutes = Math.max(20, Math.round(num(session, 'minutes') * factor));
  const result = ctx.commit<{ effects: Record<string, number> }>('run', { kind: 'life.do_activity', payload: { activityId: 'run', minutes } });
  session.context['effects'] = JSON.stringify(result.effects);
  session.context['ran'] = minutes;
  ctx.go('reflect');
}
