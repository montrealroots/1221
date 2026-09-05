/**
 * Eating out, played out.
 *
 * Somewhere near you, or somewhere you have already chosen. You get there,
 * you read the menu, you order what you order, and you pay for it. The order
 * is `place.order`; getting there is `go.to`; the scene is the choosing.
 */

import { CommandError } from '../core/simulation';
import { MS_MINUTE, formatDuration } from '../core/time';
import { formatMoney } from '../core/money';
import type { SceneSession } from '../domain/model';
import {
  INVENTED_NOTE, PLACE_KIND_LABEL, REAL_NOTE, cuisineOf, menuOf, placesIn, priceOf, type Place, type PlaceKind,
} from '../content/places';
import { MODE_LABEL, driveableVehicle, placesNear, planJourney, type Mode } from '../systems/places';
import { defineScene, unknownStep, type SceneChoice } from '../systems/scenes';

const EATING: readonly PlaceKind[] = ['restaurant', 'cafe', 'fast_food', 'bar'];
const MAX_ITEMS = 3;

function placeOf(session: SceneSession): Place {
  const place = placesIn(session.locationId).find((p) => p.id === String(session.context['placeId']));
  if (!place) throw new CommandError('That place is not here any more.');
  return place;
}

function items(session: SceneSession): string[] {
  const raw = String(session.context['items'] ?? '[]');
  try { return JSON.parse(raw) as string[]; } catch { return []; }
}

function tag(place: Place): string {
  return `${PLACE_KIND_LABEL[place.kind]}${cuisineOf(place) ? ` · ${cuisineOf(place)!.name}` : ''} · ${'$'.repeat(place.price)}`;
}

export const MEAL_SCENE = defineScene({
  id: 'life.meal',
  version: 1,
  title: 'Eating Out',
  placeBound: true,

  available(sim, input) {
    const wanted = input['placeId'] === undefined ? undefined : String(input['placeId']);
    const here = placesIn(sim.player.currentLocationId).filter((p) => EATING.includes(p.kind) && p.actions.includes('eat'));
    if (here.length === 0) return { ok: false, reason: 'Nowhere to eat in this city that SLATE knows about.' };
    if (wanted && !here.some((p) => p.id === wanted)) return { ok: false, reason: 'That is not somewhere you can eat here.' };
    return { ok: true };
  },

  start(sim, input) {
    const placeId = input['placeId'] === undefined ? null : String(input['placeId']);
    const here = placeId !== null && sim.player.currentPlaceId === placeId;
    return {
      node: placeId === null ? 'choose' : here ? 'menu' : 'arrive',
      placeId: here ? placeId : undefined,
      context: { placeId, items: '[]', total: 0, note: '' },
    };
  },

  view(sim, session) {
    const player = sim.player;
    switch (session.node) {
      case 'choose': {
        const near = placesNear(sim, { mode: 'walk', limit: 120 })
          .filter((entry) => EATING.includes(entry.place.kind) && entry.place.actions.includes('eat'))
          .slice(0, 6);
        return {
          title: 'Where To Eat',
          eyebrow: `Hunger ${Math.round(100 - player.wellbeing.nourishment)} / 100`,
          text: 'The nearest places first. The landmarks are real; the rest are SLATE’s and say so when you get there.',
          choices: near.map(({ place, journey }) => ({
            id: `place:${place.id}`, label: place.name, aliases: [place.name],
            detail: `${tag(place)} · ${formatDuration(journey.minutes * MS_MINUTE)} on foot${place.real ? ' · real' : ''}`,
          })),
          canSkip: true,
        };
      }
      case 'arrive': {
        const place = placeOf(session);
        const modes: Mode[] = ['walk', 'drive', 'taxi', 'transit'];
        const choices: SceneChoice[] = [];
        for (const mode of modes) {
          if (mode === 'drive' && !driveableVehicle(sim)) continue;
          const journey = planJourney(sim, place, mode);
          choices.push({ id: `go:${mode}`, label: MODE_LABEL[mode], aliases: [mode], detail: `${formatDuration(journey.minutes * MS_MINUTE)}${journey.cost > 0 ? ` · ${formatMoney(journey.cost)}` : ''}` });
        }
        return {
          title: place.name,
          eyebrow: tag(place),
          text: `${place.about} ${place.real ? REAL_NOTE : INVENTED_NOTE}`,
          choices,
          canSkip: true,
        };
      }
      case 'menu': {
        const place = placeOf(session);
        const chosen = items(session);
        const menu = menuOf(place).slice(0, 8);
        const choices: SceneChoice[] = chosen.length < MAX_ITEMS
          ? menu.map((dish, index) => ({ id: `dish:${index}`, label: dish.name, aliases: [dish.name], detail: formatMoney(priceOf(place, dish)) }))
          : [];
        if (chosen.length > 0) choices.push({ id: 'order', label: 'That Is Everything', aliases: ['order', 'done', 'that is all', 'finished'], tone: 'primary' });
        const running = chosen.reduce((sum, name) => sum + (menu.find((d) => d.name === name) ? priceOf(place, menu.find((d) => d.name === name)!) : 0), 0);
        return {
          title: 'The Menu',
          eyebrow: place.name,
          text: chosen.length === 0
            ? `${place.about} You can order up to ${MAX_ITEMS} things.`
            : `So far: ${chosen.join(', ')} — ${formatMoney(running)}.${chosen.length < MAX_ITEMS ? ' Anything else?' : ''}`,
          choices,
          canSkip: true,
        };
      }
      case 'reflect': {
        const place = placeOf(session);
        return {
          title: 'Fed',
          eyebrow: place.name,
          text: `${String(session.context['note'] ?? '')} ${formatMoney(Number(session.context['total'] ?? 0))}. Hunger ${Math.round(100 - player.wellbeing.nourishment)} / 100 now.`,
          choices: [{ id: 'finish', label: 'Back To The Day', aliases: ['done', 'ok', 'finish'], tone: 'primary' }],
          canSkip: false,
        };
      }
      default:
        throw unknownStep();
    }
  },

  choose(sim, session, choiceId, ctx) {
    if (session.node === 'choose' && choiceId.startsWith('place:')) {
      session.context['placeId'] = choiceId.slice(6);
      const place = placeOf(session);
      if (sim.player.currentPlaceId === place.id) { session.placeId = place.id; ctx.go('menu'); } else ctx.go('arrive');
      return;
    }
    if (session.node === 'arrive' && choiceId.startsWith('go:')) {
      const place = placeOf(session);
      const mode = choiceId.slice(3) as Mode;
      const trip = ctx.commit<{ note: string }>(`go:${mode}`, { kind: 'go.to', payload: { placeId: place.id, mode } });
      session.placeId = place.id;
      ctx.say(trip.note);
      ctx.go('menu');
      return;
    }
    if (session.node === 'menu') {
      const place = placeOf(session);
      if (choiceId.startsWith('dish:')) {
        const dish = menuOf(place)[Number(choiceId.slice(5))];
        if (!dish) throw new CommandError('That is not on the menu.');
        const chosen = items(session);
        if (chosen.length >= MAX_ITEMS) throw new CommandError('That is enough for one sitting.');
        chosen.push(dish.name);
        session.context['items'] = JSON.stringify(chosen);
        return;
      }
      if (choiceId === 'order') {
        const chosen = items(session);
        const result = ctx.commit<{ total: number; note: string }>('order', { kind: 'place.order', payload: { items: chosen } });
        session.context['total'] = result.total;
        session.context['note'] = result.note;
        ctx.go('reflect');
        return;
      }
    }
    if (session.node === 'reflect' && choiceId === 'finish') { ctx.finish(); return; }
    throw new CommandError('That is not a choice here.');
  },

  summarise(sim, session, ctx) {
    if (session.node === 'choose') {
      const nearest = placesNear(sim, { mode: 'walk', limit: 120 })
        .filter((entry) => EATING.includes(entry.place.kind) && entry.place.actions.includes('eat'))
        .sort((a, b) => a.place.price - b.place.price || a.journey.minutes - b.journey.minutes)[0];
      if (!nearest) throw new CommandError('Nowhere to eat nearby.');
      session.context['placeId'] = nearest.place.id;
      session.node = sim.player.currentPlaceId === nearest.place.id ? 'menu' : 'arrive';
    }
    const place = placeOf(session);
    if (session.node === 'arrive') {
      const mode: Mode = driveableVehicle(sim) ? 'drive' : 'walk';
      ctx.commit(`go:${mode}`, { kind: 'go.to', payload: { placeId: place.id, mode } });
      session.placeId = place.id;
      session.node = 'menu';
    }
    if (session.node === 'menu') {
      const chosen = items(session);
      if (chosen.length === 0) {
        const menu = menuOf(place);
        const middle = menu[Math.floor(menu.length / 2)] ?? menu[0];
        if (!middle) throw new CommandError('Nothing on the menu.');
        chosen.push(middle.name);
        session.context['items'] = JSON.stringify(chosen);
      }
      const result = ctx.commit<{ total: number; note: string }>('order', { kind: 'place.order', payload: { items: chosen } });
      session.context['total'] = result.total;
      session.context['note'] = result.note;
      session.node = 'reflect';
    }
    ctx.say(`${place.name}: ${items(session).join(', ')}. ${formatMoney(Number(session.context['total'] ?? 0))}.`);
  },
});
