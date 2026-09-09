/**
 * Eating out, played out.
 *
 * You choose a room, you get there, somebody meets you at the door and either
 * seats you or makes you wait. You read the menu with a server who has an
 * opinion, the kitchen takes as long as it takes, and then there is a bill
 * and the question of what to leave on it. The room remembers all of it: how
 * often you come, what you always order, and what you tipped. The money and
 * the clock are the dining system's commands; the scene is the sitting.
 */

import { CommandError, type Simulation } from '../core/simulation';
import { MS_MINUTE, formatDuration } from '../core/time';
import { formatMoney } from '../core/money';
import type { DiningVisit, SceneSession } from '../domain/model';
import {
  INVENTED_NOTE, PLACE_KIND_LABEL, REAL_NOTE, cuisineOf, menuOf, placesIn, priceOf, type Place, type PlaceKind,
} from '../content/places';
import { preview, speak } from '../dialogue/library';
import { MODE_LABEL, driveableVehicle, placesNear, planJourney, type Mode } from '../systems/places';
import {
  GOOD_TIP, TIP_SHARES, billFor, peakNow, serviceOf, staffOf, standingAt, standingFlags, toneOf, visitOf,
} from '../systems/dining';
import { defineScene, unknownStep, type SceneChoice } from '../systems/scenes';

const EATING: readonly PlaceKind[] = ['restaurant', 'cafe', 'fast_food', 'bar'];
const MAX_ITEMS = 3;

function placeOf(session: SceneSession): Place {
  const place = placesIn(session.locationId).find((p) => p.id === String(session.context['placeId']));
  if (!place) throw new CommandError('That place isn’t here any more.');
  return place;
}

function items(session: SceneSession): string[] {
  const raw = String(session.context['items'] ?? '[]');
  try { return JSON.parse(raw) as string[]; } catch { return []; }
}

function tag(place: Place): string {
  return `${PLACE_KIND_LABEL[place.kind]}${cuisineOf(place) ? ` · ${cuisineOf(place)!.name}` : ''} · ${'$'.repeat(place.price)}`;
}

function visitFor(sim: Simulation, session: SceneSession): DiningVisit {
  const id = String(session.context['visitId'] ?? '');
  if (!id) throw new CommandError('You aren’t in there yet.');
  return visitOf(sim, id);
}

function say(
  sim: Simulation, purpose: string, beat: string,
  ctx: { flags?: string[]; result?: string; move?: string; tone?: ReturnType<typeof toneOf>; vars?: Record<string, string> },
  salt: string, record: boolean,
): string {
  const query = { section: 'dining', purpose, beat };
  return (record ? speak(sim, query, ctx, salt) : preview(sim, query, ctx, salt)).text;
}

/** How the plate landed, from what the room is and what you paid for it. */
function plateResult(sim: Simulation, place: Place, visit: DiningVisit): 'good' | 'fine' | 'poor' {
  const rng = sim.rng('dining_plate', visit.id);
  const score = place.quality + (visit.waitedMinutes > visit.quotedWait + 10 ? -12 : 0) + rng.int(-14, 14);
  return score >= 82 ? 'good' : score >= 52 ? 'fine' : 'poor';
}

/** The dish the server would push tonight: the best thing on the menu they have. */
function recommendation(sim: Simulation, place: Place, visit: DiningVisit): string {
  const menu = menuOf(place);
  if (menu.length === 0) return '';
  const rng = sim.rng('dining_push', visit.id);
  const good = menu.filter((d) => d.nourishment >= 30);
  return rng.pick(good.length > 0 ? good : menu).name;
}

export const MEAL_SCENE = defineScene({
  id: 'life.meal',
  version: 2,
  title: 'Eating Out',
  placeBound: true,

  available(sim, input) {
    const wanted = input['placeId'] === undefined ? undefined : String(input['placeId']);
    const here = placesIn(sim.player.currentLocationId).filter((p) => EATING.includes(p.kind) && p.actions.includes('eat'));
    if (here.length === 0) return { ok: false, reason: 'Nowhere to eat in this city that SLATE knows about.' };
    if (wanted && !here.some((p) => p.id === wanted)) return { ok: false, reason: 'That isn’t somewhere you can eat here.' };
    return { ok: true };
  },

  start(sim, input) {
    const placeId = input['placeId'] === undefined ? null : String(input['placeId']);
    const here = placeId !== null && sim.player.currentPlaceId === placeId;
    return {
      node: placeId === null ? 'choose' : here ? 'door' : 'arrive',
      placeId: here ? placeId : undefined,
      context: { placeId, visitId: '', items: '[]', total: 0, note: '', line: '' },
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
      case 'door': {
        const place = placeOf(session);
        const standing = standingAt(sim, place);
        const host = staffOf(sim, place, 'host');
        const counter = serviceOf(place) === 'counter';
        const flags = [...standingFlags(standing), ...(peakNow(sim, place) ? ['peak'] : [])];
        const greeting = counter
          ? say(sim, 'greet', 'counter', { flags, tone: toneOf(host) }, `${place.id}:counter`, false)
          : say(sim, 'greet', 'door', { result: 'seated', flags, tone: toneOf(host) }, `${place.id}:door`, false);
        return {
          title: counter ? 'The Counter' : 'The Door',
          eyebrow: place.name,
          text: `${place.about} ${place.real ? REAL_NOTE : INVENTED_NOTE}\n\n${greeting}`,
          facts: [
            { label: 'On The Door', value: counter ? 'Nobody' : host.displayName },
            { label: 'Standing', value: standing.regular ? 'A Regular' : standing.visits > 0 ? `${standing.visits} Visits` : 'First Time' },
          ],
          choices: [
            { id: 'in', label: counter ? 'Order At The Counter' : 'Ask For A Table', aliases: ['in', 'table', 'order'], tone: 'primary' },
            { id: 'away', label: 'Somewhere Else', aliases: ['leave', 'no', 'away'] },
          ],
          canSkip: true,
        };
      }
      case 'wait': {
        const place = placeOf(session);
        const visit = visitFor(sim, session);
        const host = staffOf(sim, place, 'host');
        const standing = standingAt(sim, place);
        const flags = [...standingFlags(standing), ...(peakNow(sim, place) ? ['peak'] : [])];
        const quote = say(sim, 'greet', 'door', {
          result: 'waiting', flags, tone: toneOf(host),
          vars: { wait: formatDuration(visit.quotedWait * MS_MINUTE) },
        }, `${visit.id}:quote`, false);
        return {
          title: 'A Wait',
          eyebrow: place.name,
          text: quote,
          facts: [{ label: 'Quoted', value: formatDuration(visit.quotedWait * MS_MINUTE) }],
          choices: [
            { id: 'stay', label: 'Wait For It', aliases: ['wait', 'stay', 'yes'], tone: 'primary', detail: `About ${formatDuration(visit.quotedWait * MS_MINUTE)}` },
            { id: 'go', label: 'Do Not Wait', aliases: ['leave', 'go', 'no'], detail: 'They’ll remember it' },
          ],
          canSkip: true,
        };
      }
      case 'menu': {
        const place = placeOf(session);
        const visit = visitFor(sim, session);
        const chosen = items(session);
        const menu = menuOf(place).slice(0, 8);
        const server = sim.universe.people[visit.serverId];
        const standing = standingAt(sim, place);
        const choices: SceneChoice[] = chosen.length < MAX_ITEMS
          ? menu.map((dish, index) => ({ id: `dish:${index}`, label: dish.name, aliases: [dish.name], detail: formatMoney(priceOf(place, dish)) }))
          : [];
        if (chosen.length === 0) {
          choices.push({ id: 'ask', label: 'What Is Good Tonight', aliases: ['ask', 'recommend', 'what is good'] });
        }
        if (chosen.length > 0) choices.push({ id: 'order', label: 'That Is Everything', aliases: ['order', 'done', 'that’s all', 'finished'], tone: 'primary' });
        const running = chosen.reduce((sum, name) => {
          const dish = menu.find((d) => d.name === name);
          return sum + (dish ? priceOf(place, dish) : 0);
        }, 0);
        const seated = String(session.context['line'] ?? '');
        return {
          title: 'The Menu',
          eyebrow: `${place.name} · ${visit.table}`,
          text: chosen.length === 0
            ? `${seated}\n\nYou can order up to ${MAX_ITEMS} things.`
            : `So far: ${chosen.join(', ')} — ${formatMoney(running)}.${chosen.length < MAX_ITEMS ? ' Anything else?' : ''}`,
          facts: [
            { label: 'Your Server', value: server?.displayName ?? 'Somebody' },
            { label: 'Table', value: visit.table },
            ...(standing.usual ? [{ label: 'Your Usual', value: standing.usual }] : []),
            ...(visit.waitedMinutes > 0 ? [{ label: 'You Waited', value: formatDuration(visit.waitedMinutes * MS_MINUTE) }] : []),
          ],
          choices,
          canSkip: true,
        };
      }
      case 'eat': {
        const place = placeOf(session);
        const visit = visitFor(sim, session);
        const bill = billFor(sim, visit, 0);
        return {
          title: 'The Food',
          eyebrow: place.name,
          text: `${String(session.context['line'] ?? '')}`,
          facts: [
            { label: 'On The Table', value: visit.items.map((i) => i.name).join(', ') },
            { label: 'The Food', value: formatMoney(bill.subtotal) },
            ...(bill.serviceCharge > 0 ? [{ label: 'Service', value: formatMoney(bill.serviceCharge) }] : []),
          ],
          choices: [{ id: 'bill', label: 'Ask For The Bill', aliases: ['bill', 'check', 'pay'], tone: 'primary' }],
          canSkip: true,
        };
      }
      case 'bill': {
        const place = placeOf(session);
        const visit = visitFor(sim, session);
        const server = sim.universe.people[visit.serverId];
        const bill = billFor(sim, visit, 0);
        const asked = say(sim, 'bill', 'table', { tone: server ? toneOf(server) : 'dry', vars: { total: formatMoney(bill.total) } }, `${visit.id}:bill`, false);
        return {
          title: 'The Bill',
          eyebrow: place.name,
          text: asked,
          facts: [
            { label: 'The Food', value: formatMoney(bill.subtotal) },
            { label: 'Service', value: formatMoney(bill.serviceCharge) },
          ],
          choices: TIP_SHARES.map((share) => ({
            id: `tip:${Math.round(share * 100)}`,
            label: share === 0 ? 'Leave Nothing' : `Leave ${Math.round(share * 100)} Percent`,
            aliases: [`${Math.round(share * 100)}`, `${Math.round(share * 100)} percent`],
            detail: `${formatMoney(billFor(sim, visit, share).total)} in total`,
            tone: share >= GOOD_TIP && share <= 0.2 ? 'primary' : undefined,
          })),
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
      if (sim.player.currentPlaceId === place.id) { session.placeId = place.id; ctx.go('door'); } else ctx.go('arrive');
      return;
    }

    if (session.node === 'arrive' && choiceId.startsWith('go:')) {
      const place = placeOf(session);
      const mode = choiceId.slice(3) as Mode;
      const trip = ctx.commit<{ note: string }>(`go:${mode}`, { kind: 'go.to', payload: { placeId: place.id, mode } });
      session.placeId = place.id;
      ctx.say(trip.note);
      ctx.go('door');
      return;
    }

    if (session.node === 'door') {
      if (choiceId === 'away') { ctx.finish(); return; }
      if (choiceId === 'in') {
        const place = placeOf(session);
        const host = staffOf(sim, place, 'host');
        const standing = standingAt(sim, place);
        const flags = [...standingFlags(standing), ...(peakNow(sim, place) ? ['peak'] : [])];
        const arrival = ctx.commit<{ visitId: string; quotedWait: number; table: string; service: string }>('arrive', {
          kind: 'dine.arrive', payload: { placeId: place.id },
        });
        session.context['visitId'] = arrival.visitId;
        if (arrival.quotedWait > 0) {
          ctx.say(say(sim, 'greet', 'door', {
            result: 'waiting', flags, tone: toneOf(host),
            vars: { wait: formatDuration(arrival.quotedWait * MS_MINUTE) },
          }, `${arrival.visitId}:quote`, true), host.displayName);
          ctx.go('wait');
          return;
        }
        const greeting = arrival.service === 'counter'
          ? say(sim, 'greet', 'counter', { flags, tone: toneOf(host) }, `${arrival.visitId}:counter`, true)
          : say(sim, 'greet', 'door', { result: 'seated', flags, tone: toneOf(host) }, `${arrival.visitId}:door`, true);
        ctx.say(greeting, host.displayName);
        session.context['line'] = seatLine(sim, place, arrival.table, arrival.visitId, true);
        ctx.go('menu');
        return;
      }
    }

    if (session.node === 'wait') {
      const place = placeOf(session);
      const visit = visitFor(sim, session);
      if (choiceId === 'go') {
        ctx.commit('leave', { kind: 'dine.leave', payload: { visitId: visit.id } });
        ctx.say(say(sim, 'farewell', 'door', { result: 'walked' }, `${visit.id}:walked`, true));
        session.context['note'] = `You didn’t wait at ${place.name}.`;
        session.context['total'] = 0;
        ctx.go('reflect');
        return;
      }
      if (choiceId === 'stay') {
        ctx.say(say(sim, 'wait', 'door', {}, `${visit.id}:stand`, true));
        const seated = ctx.commit<{ waited: number; table: string }>('wait', { kind: 'dine.wait', payload: { visitId: visit.id } });
        if (seated.waited > visit.quotedWait + 10) {
          ctx.say(say(sim, 'wait', 'door', { result: 'over' }, `${visit.id}:over`, true));
        }
        session.context['line'] = seatLine(sim, place, seated.table, visit.id, true);
        ctx.go('menu');
        return;
      }
    }

    if (session.node === 'menu') {
      const place = placeOf(session);
      const visit = visitFor(sim, session);
      const server = sim.universe.people[visit.serverId];
      if (choiceId === 'ask') {
        const dish = recommendation(sim, place, visit);
        ctx.say(say(sim, 'order', 'table', { move: 'recommend', tone: server ? toneOf(server) : 'dry', vars: { suggestion: dish } }, `${visit.id}:push`, true), server?.displayName);
        return;
      }
      if (choiceId.startsWith('dish:')) {
        const dish = menuOf(place)[Number(choiceId.slice(5))];
        if (!dish) throw new CommandError('That isn’t on the menu.');
        const chosen = items(session);
        if (chosen.length >= MAX_ITEMS) throw new CommandError('That’s enough for one sitting.');
        chosen.push(dish.name);
        session.context['items'] = JSON.stringify(chosen);
        return;
      }
      if (choiceId === 'order') {
        const chosen = items(session);
        const standing = standingAt(sim, place);
        const usual = standing.usual && chosen.includes(standing.usual);
        const result = ctx.commit<{ subtotal: number; charged: number; minutes: number }>('order', {
          kind: 'dine.order', payload: { visitId: visit.id, items: chosen },
        });
        ctx.say(say(sim, 'order', 'table', {
          result: 'taken', flags: usual ? ['usual'] : [], tone: server ? toneOf(server) : 'dry',
          vars: { items: chosen.join(', '), usual: standing.usual ?? chosen[0] ?? '' },
        }, `${visit.id}:taken`, true), server?.displayName);

        const plate = plateResult(sim, place, visit);
        const beat = visit.service === 'counter' ? 'counter' : 'table';
        const line = say(sim, 'serve', beat, { result: plate, tone: server ? toneOf(server) : 'dry' }, `${visit.id}:plate`, true);
        ctx.say(line);
        session.context['line'] = line;

        if (visit.service === 'counter') {
          session.context['total'] = result.subtotal;
          session.context['note'] = `${chosen.join(', ')} at the counter.`;
          ctx.go('reflect');
          return;
        }
        ctx.say(say(sim, 'check', 'table', { tone: server ? toneOf(server) : 'dry' }, `${visit.id}:check`, true), server?.displayName);
        ctx.go('eat');
        return;
      }
    }

    if (session.node === 'eat' && choiceId === 'bill') { ctx.go('bill'); return; }

    if (session.node === 'bill' && choiceId.startsWith('tip:')) {
      const place = placeOf(session);
      const visit = visitFor(sim, session);
      const server = sim.universe.people[visit.serverId];
      const share = Number(choiceId.slice(4)) / 100;
      const paid = ctx.commit<{ total: number; tip: number }>(`settle:${choiceId}`, {
        kind: 'dine.settle', payload: { visitId: visit.id, tipShare: share },
      });
      const result = share >= GOOD_TIP ? 'generous' : share > 0 ? 'fair' : 'nothing';
      ctx.say(say(sim, 'tip', 'table', { result, tone: server ? toneOf(server) : 'dry' }, `${visit.id}:tip`, true), server?.displayName);
      const standing = standingAt(sim, place);
      ctx.say(say(sim, 'farewell', 'door', { flags: standingFlags(standing) }, `${visit.id}:out`, true));
      session.context['total'] = paid.total;
      session.context['note'] = `${visit.items.map((i) => i.name).join(', ')}, and ${paid.tip > 0 ? `${formatMoney(paid.tip)} on top` : 'nothing on top'}.`;
      ctx.go('reflect');
      return;
    }

    if (session.node === 'reflect' && choiceId === 'finish') { ctx.finish(); return; }
    throw new CommandError('That isn’t a choice here.');
  },

  summarise(sim, session, ctx) {
    if (session.node === 'choose') {
      const nearest = placesNear(sim, { mode: 'walk', limit: 120 })
        .filter((entry) => EATING.includes(entry.place.kind) && entry.place.actions.includes('eat'))
        .sort((a, b) => a.place.price - b.place.price || a.journey.minutes - b.journey.minutes)[0];
      if (!nearest) throw new CommandError('Nowhere to eat nearby.');
      session.context['placeId'] = nearest.place.id;
      session.node = sim.player.currentPlaceId === nearest.place.id ? 'door' : 'arrive';
    }
    const place = placeOf(session);
    if (session.node === 'arrive') {
      const mode: Mode = driveableVehicle(sim) ? 'drive' : 'walk';
      ctx.commit(`go:${mode}`, { kind: 'go.to', payload: { placeId: place.id, mode } });
      session.placeId = place.id;
      session.node = 'door';
    }
    if (session.node === 'door') {
      const arrival = ctx.commit<{ visitId: string; quotedWait: number }>('arrive', { kind: 'dine.arrive', payload: { placeId: place.id } });
      session.context['visitId'] = arrival.visitId;
      session.node = arrival.quotedWait > 0 ? 'wait' : 'menu';
    }
    if (session.node === 'wait') {
      const visit = visitFor(sim, session);
      ctx.commit<{ waited: number }>('wait', { kind: 'dine.wait', payload: { visitId: visit.id } });
      session.node = 'menu';
    }
    if (session.node === 'menu') {
      const visit = visitFor(sim, session);
      const chosen = items(session);
      if (chosen.length === 0) {
        const menu = menuOf(place);
        const standing = standingAt(sim, place);
        const usual = standing.usual ? menu.find((d) => d.name === standing.usual) : undefined;
        const middle = usual ?? menu[Math.floor(menu.length / 2)] ?? menu[0];
        if (!middle) throw new CommandError('Nothing on the menu.');
        chosen.push(middle.name);
        session.context['items'] = JSON.stringify(chosen);
      }
      const result = ctx.commit<{ subtotal: number }>('order', { kind: 'dine.order', payload: { visitId: visit.id, items: chosen } });
      session.context['total'] = result.subtotal;
      session.node = visit.service === 'counter' ? 'reflect' : 'eat';
      if (visit.service === 'counter') session.context['note'] = `${chosen.join(', ')} at the counter.`;
    }
    if (session.node === 'eat') session.node = 'bill';
    if (session.node === 'bill') {
      const visit = visitFor(sim, session);
      // The default is what a reasonable person leaves, not the cheapest option.
      const paid = ctx.commit<{ total: number; tip: number }>('settle:tip:18', {
        kind: 'dine.settle', payload: { visitId: visit.id, tipShare: GOOD_TIP },
      });
      session.context['total'] = paid.total;
      session.context['note'] = `${visit.items.map((i) => i.name).join(', ')}, and ${formatMoney(paid.tip)} on top.`;
      session.node = 'reflect';
    }
    ctx.say(`${place.name}: ${items(session).join(', ')}. ${formatMoney(Number(session.context['total'] ?? 0))}.`);
  },
});

/** The line the room says as it puts you down somewhere. */
function seatLine(sim: Simulation, place: Place, table: string, salt: string, record: boolean): string {
  if (serviceOf(place) === 'counter') return '';
  const good = ['By The Window', 'On The Terrace', 'At The Bar'].includes(table);
  const bad = ['By The Kitchen Door', 'At The Back'].includes(table);
  const server = staffOf(sim, place, 'server');
  return say(sim, 'seat', 'table', {
    flags: good ? ['good'] : bad ? ['bad'] : [],
    tone: toneOf(server),
  }, `${salt}:seat`, record);
}
