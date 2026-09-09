/**
 * A shop, played out.
 *
 * You walk in, somebody says something or does not, you work along the rail,
 * you pick things up, you take the ones that need it into a fitting room, and
 * then you either go to the counter or you put it all back. The floor
 * remembers whether you buy or whether you only ever look. The money is
 * `shop.purchase` underneath, the same engine every other purchase uses, so
 * the tax, the receipt and the thing you end up owning are all the real ones.
 */

import { CommandError, type Simulation } from '../core/simulation';
import { MS_MINUTE, formatDuration } from '../core/time';
import { formatMoney } from '../core/money';
import type { SceneSession } from '../domain/model';
import { placesIn, type Place } from '../content/places';
import { REAL_RETAILER_NOTE } from '../content/brands';
import { REAL_GOODS_NOTE } from '../content/goods';
import { preview, speak } from '../dialogue/library';
import { MODE_LABEL, driveableVehicle, placesNear, planJourney, type Mode } from '../systems/places';
import {
  FITTING_MINUTES, VERDICT_LABEL, aislesAt, assistantAt, branchSize, frontTableAt, notCarriedAt,
  retailerAt, stockAt, standingAt, standingFlags, toneOf, verdictNote, visitOf, type Verdict,
} from '../systems/retail';
import { categoryLabel } from '../core/text';
import { defineScene, unknownStep, type SceneChoice } from '../systems/scenes';

/** How dear a thing has to be before the floor treats it as an occasion. */
const DEAR = 60_000;

/** How much of a basket makes the counter slow down and wrap it properly. */
const BIG_BASKET = 150_000;

function placeOf(session: SceneSession): Place {
  const place = placesIn(session.locationId).find((p) => p.id === String(session.context['placeId']));
  if (!place) throw new CommandError('That shop isn’t here any more.');
  return place;
}

function visitFor(sim: Simulation, session: SceneSession) {
  const id = String(session.context['visitId'] ?? '');
  if (!id) throw new CommandError('You aren’t in there yet.');
  return visitOf(sim, id);
}

function say(
  sim: Simulation, purpose: string, beat: string,
  ctx: { flags?: string[]; result?: string; move?: string; tone?: ReturnType<typeof toneOf>; vars?: Record<string, string> },
  salt: string, record: boolean,
): string {
  const query = { section: 'retail', purpose, beat };
  return (record ? speak(sim, query, ctx, salt) : preview(sim, query, ctx, salt)).text;
}

function shopsHere(sim: Simulation): Place[] {
  return placesIn(sim.player.currentLocationId).filter((p) => Boolean(p.retailerId));
}

function tagOf(place: Place): string {
  const retailer = retailerAt(place);
  return retailer ? `${'$'.repeat(Math.max(1, Math.min(4, Math.round(retailer.tier * 0.8))))} · ${retailer.categories.slice(0, 3).join(', ')}` : 'Shop';
}

export const SHOP_SCENE = defineScene({
  id: 'life.shop',
  version: 1,
  title: 'Going Shopping',
  placeBound: true,

  available(sim, input) {
    const wanted = input['placeId'] === undefined ? undefined : String(input['placeId']);
    const here = shopsHere(sim);
    if (here.length === 0) return { ok: false, reason: 'No shop here that SLATE knows the inside of.' };
    if (wanted && !here.some((p) => p.id === wanted)) return { ok: false, reason: 'That isn’t a shop you can walk around.' };
    return { ok: true };
  },

  start(sim, input) {
    const placeId = input['placeId'] === undefined ? null : String(input['placeId']);
    const here = placeId !== null && sim.player.currentPlaceId === placeId;
    return {
      node: placeId === null ? 'choose' : here ? 'door' : 'arrive',
      placeId: here ? placeId : undefined,
      context: { placeId, visitId: '', spent: 0, note: '', line: '', mirror: '', aisle: '', page: 0, from: '' },
    };
  },

  view(sim, session) {
    switch (session.node) {
      case 'choose': {
        const near = placesNear(sim, { mode: 'walk', limit: 160 })
          .filter((entry) => Boolean(entry.place.retailerId))
          .slice(0, 8);
        return {
          title: 'Where To Shop',
          eyebrow: 'On Foot From Here',
          text: `Every chain here is a real one. ${REAL_RETAILER_NOTE}`,
          choices: near.map(({ place, journey }) => ({
            id: `place:${place.id}`, label: place.name, aliases: [place.name],
            detail: `${tagOf(place)} · ${formatDuration(journey.minutes * MS_MINUTE)} on foot`,
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
          eyebrow: tagOf(place),
          text: `${place.about} ${REAL_RETAILER_NOTE}`,
          choices,
          canSkip: true,
        };
      }
      case 'door': {
        const place = placeOf(session);
        const assistant = assistantAt(sim, place);
        const standing = standingAt(sim, place);
        const retailer = retailerAt(place);
        const flags = [...standingFlags(standing), ...((retailer?.tier ?? 3) >= 5 ? ['luxury'] : [])];
        return {
          title: 'The Door',
          eyebrow: place.name,
          text: `${place.about} ${REAL_RETAILER_NOTE}\n\n${say(sim, 'greet', 'door', { flags, tone: toneOf(assistant) }, `${place.id}:greet`, false)}`,
          facts: [
            { label: 'On The Floor', value: assistant.displayName },
            { label: 'Standing', value: standing.regular ? 'A Regular' : standing.visits > 0 ? `${standing.visits} Visits` : 'First Time' },
          ],
          choices: [
            { id: 'in', label: 'Have A Look', aliases: ['in', 'look', 'browse'], tone: 'primary' },
            { id: 'away', label: 'Not Today', aliases: ['leave', 'no', 'away'] },
          ],
          canSkip: true,
        };
      }
      case 'floor': {
        const place = placeOf(session);
        const visit = visitFor(sim, session);
        const shelf = stockAt(sim, place);
        const assistant = sim.universe.people[visit.assistantId];
        const aisles = aislesAt(sim, place);
        const front = frontTableAt(sim, place);
        const choices: SceneChoice[] = front.slice(0, 6).map((stocked) => {
          const tried = visit.tried.find((t) => t.catalogId === stocked.item.id);
          const held = visit.basket.includes(stocked.item.id);
          return {
            id: `item:${stocked.item.id}`,
            label: stocked.item.name,
            aliases: [stocked.item.name],
            detail: `${formatMoney(stocked.price)} · On The Front Table${tried ? ` · ${VERDICT_LABEL[tried.verdict as Verdict]}` : ''}${held ? ' · In Your Hands' : ''}`,
          };
        });
        for (const aisle of aisles) {
          choices.push({
            id: `aisle:${aisle.category}`,
            label: categoryLabel(aisle.category),
            aliases: [aisle.category, categoryLabel(aisle.category)],
            detail: `${aisle.count} Things`,
          });
        }
        choices.push({ id: 'ask', label: 'Ask What Is Worth Having', aliases: ['ask', 'advice', 'help'] });
        if (visit.basket.length > 0) choices.push({ id: 'counter', label: 'Go To The Counter', aliases: ['counter', 'pay', 'buy'], tone: 'primary' });
        choices.push({ id: 'out', label: 'Leave With Nothing', aliases: ['leave', 'out', 'nothing'] });
        const running = visit.basket.reduce((sum, id) => sum + (shelf.find((x) => x.item.id === id)?.price ?? 0), 0);
        return {
          title: 'The Floor',
          eyebrow: place.name,
          text: String(session.context['line'] ?? '') || say(sim, 'browse', 'floor', { tone: assistant ? toneOf(assistant) : 'dry' }, `${visit.id}:floor`, false),
          facts: [
            { label: 'On The Floor', value: `${shelf.length} Things` },
            { label: 'This Branch', value: branchSize(place) },
            { label: 'In Your Hands', value: visit.basket.length === 0 ? 'Nothing' : `${visit.basket.length}, ${formatMoney(running)}` },
            { label: 'Tried On', value: visit.tried.length === 0 ? 'Nothing' : String(visit.tried.length) },
            // A shelf that is missing something says which arrangement left it
            // off, rather than quietly not having it.
            ...notCarriedAt(place).map((one) => ({ label: 'Not On The Shelf', value: one.why })),
          ],
          choices,
          canSkip: true,
        };
      }
      case 'aisle': {
        const place = placeOf(session);
        const visit = visitFor(sim, session);
        const category = String(session.context['aisle'] ?? '');
        const shelf = stockAt(sim, place, category);
        const page = Number(session.context['page'] ?? 0);
        const PER_PAGE = 10;
        const slice = shelf.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);
        const choices: SceneChoice[] = slice.map((stocked) => {
          const tried = visit.tried.find((t) => t.catalogId === stocked.item.id);
          const held = visit.basket.includes(stocked.item.id);
          return {
            id: `item:${stocked.item.id}`,
            label: stocked.item.name,
            aliases: [stocked.item.name],
            detail: `${stocked.item.brand} · ${formatMoney(stocked.price)}${tried ? ` · ${VERDICT_LABEL[tried.verdict as Verdict]}` : ''}${held ? ' · In Your Hands' : ''}`,
          };
        });
        if ((page + 1) * PER_PAGE < shelf.length) {
          choices.push({ id: 'more', label: 'Further Along The Aisle', aliases: ['more', 'next', 'further'] });
        }
        if (page > 0) choices.push({ id: 'back', label: 'Back Up The Aisle', aliases: ['back up', 'previous'] });
        choices.push({ id: 'floor', label: 'Back To The Floor', aliases: ['floor', 'out', 'back'] });
        return {
          title: categoryLabel(category),
          eyebrow: place.name,
          text: `${shelf.length} things on this aisle. Showing ${page * PER_PAGE + 1} to ${Math.min(shelf.length, (page + 1) * PER_PAGE)}.`,
          facts: [{ label: 'On This Aisle', value: `${shelf.length} Things` }],
          choices,
          canSkip: true,
        };
      }
      case 'item': {
        const place = placeOf(session);
        const visit = visitFor(sim, session);
        const id = String(session.context['itemId'] ?? '');
        const stocked = stockAt(sim, place).find((x) => x.item.id === id);
        if (!stocked) throw new CommandError('That has gone off the floor.');
        const tried = visit.tried.find((t) => t.catalogId === id);
        const held = visit.basket.includes(id);
        const choices: SceneChoice[] = [];
        if (stocked.fittable && !tried) choices.push({ id: 'try', label: 'Try It On', aliases: ['try', 'fitting room'], detail: formatDuration(FITTING_MINUTES * MS_MINUTE) });
        if (!held && tried?.verdict !== 'wrong_size') choices.push({ id: 'take', label: 'Take It', aliases: ['take', 'keep', 'yes'], tone: 'primary', detail: formatMoney(stocked.price) });
        if (held) choices.push({ id: 'drop', label: 'Put It Back', aliases: ['back', 'drop', 'no'] });
        choices.push({ id: 'floor', label: 'Back To The Rail', aliases: ['back', 'rail', 'floor'] });
        return {
          title: stocked.item.name,
          eyebrow: `${place.name} · ${formatMoney(stocked.price)}`,
          text: `${String(session.context['mirror'] ?? '') || String(session.context['line'] ?? '')}`,
          facts: [
            { label: 'Brand', value: stocked.item.brand },
            { label: 'Quality', value: `${stocked.item.quality} / 100` },
            { label: 'The Price', value: 'SLATE’s Own' },
            ...(tried ? [{ label: 'The Mirror', value: VERDICT_LABEL[tried.verdict as Verdict] }] : []),
          ],
          choices,
          canSkip: true,
        };
      }
      case 'counter': {
        const place = placeOf(session);
        const visit = visitFor(sim, session);
        const shelf = stockAt(sim, place);
        const lines = visit.basket.map((id) => shelf.find((x) => x.item.id === id));
        const subtotal = lines.reduce((sum, l) => sum + (l?.price ?? 0), 0);
        return {
          title: 'The Counter',
          eyebrow: place.name,
          text: `${lines.map((l) => l?.item.name ?? 'Something').join(', ')}. Before tax it is ${formatMoney(subtotal)}; the till adds what the state wants. ${REAL_GOODS_NOTE}`,
          facts: [{ label: 'Before Tax', value: formatMoney(subtotal) }],
          choices: [
            { id: 'pay', label: 'Pay For It', aliases: ['pay', 'yes', 'buy'], tone: 'primary' },
            { id: 'floor', label: 'One More Look', aliases: ['back', 'floor', 'wait'] },
          ],
          canSkip: true,
        };
      }
      case 'reflect': {
        const place = placeOf(session);
        return {
          title: 'Out Again',
          eyebrow: place.name,
          text: `${String(session.context['note'] ?? '')}`,
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
        const assistant = assistantAt(sim, place);
        const standing = standingAt(sim, place);
        const retailer = retailerAt(place);
        const flags = [...standingFlags(standing), ...((retailer?.tier ?? 3) >= 5 ? ['luxury'] : [])];
        const entered = ctx.commit<{ visitId: string; shelf: number }>('enter', { kind: 'retail.enter', payload: { placeId: place.id } });
        session.context['visitId'] = entered.visitId;
        ctx.say(say(sim, 'greet', 'door', { flags, tone: toneOf(assistant) }, `${entered.visitId}:greet`, true), assistant.displayName);
        session.context['line'] = say(sim, 'browse', 'floor', { tone: toneOf(assistant) }, `${entered.visitId}:floor`, true);
        ctx.go('floor');
        return;
      }
    }

    if (session.node === 'floor') {
      const place = placeOf(session);
      const visit = visitFor(sim, session);
      const assistant = sim.universe.people[visit.assistantId];
      if (choiceId === 'out') {
        ctx.commit('walk_out', { kind: 'retail.walk_out', payload: { visitId: visit.id } });
        ctx.say(say(sim, 'farewell', 'door', { result: 'empty', tone: assistant ? toneOf(assistant) : 'dry' }, `${visit.id}:empty`, true), assistant?.displayName);
        session.context['note'] = `Nothing from ${place.name} today.`;
        ctx.go('reflect');
        return;
      }
      if (choiceId === 'ask') {
        const shelf = stockAt(sim, place);
        const pick = shelf.filter((x) => !visit.basket.includes(x.item.id)).sort((a, b) => b.item.quality - a.item.quality)[0];
        ctx.say(say(sim, 'advise', 'floor', {
          move: pick ? 'suggest' : 'ask', tone: assistant ? toneOf(assistant) : 'dry',
          vars: { suggestion: pick?.item.name ?? 'the plain one' },
        }, `${visit.id}:advise`, true), assistant?.displayName);
        return;
      }
      if (choiceId === 'counter') { ctx.go('counter'); return; }
      if (choiceId.startsWith('aisle:')) {
        session.context['aisle'] = choiceId.slice(6);
        session.context['page'] = 0;
        ctx.go('aisle');
        return;
      }
      if (choiceId.startsWith('item:')) {
        const id = choiceId.slice(5);
        const handled = ctx.commit<{ name: string; price: number; fittable: boolean }>(`handle:${id}`, {
          kind: 'retail.handle', payload: { visitId: visit.id, catalogId: id },
        });
        const stocked = stockAt(sim, place).find((x) => x.item.id === id);
        const flags = [...(stocked?.featured ? ['featured'] : []), ...(handled.price >= DEAR ? ['dear'] : [])];
        session.context['itemId'] = id;
        session.context['mirror'] = '';
        session.context['line'] = say(sim, 'browse', 'floor', { flags, tone: assistant ? toneOf(assistant) : 'dry' }, `${visit.id}:${id}`, true);
        ctx.go('item');
        return;
      }
    }

    if (session.node === 'aisle') {
      const place = placeOf(session);
      const visit = visitFor(sim, session);
      const assistant = sim.universe.people[visit.assistantId];
      if (choiceId === 'floor') { session.context['line'] = ''; ctx.go('floor'); return; }
      if (choiceId === 'more') { session.context['page'] = Number(session.context['page'] ?? 0) + 1; return; }
      if (choiceId === 'back') { session.context['page'] = Math.max(0, Number(session.context['page'] ?? 0) - 1); return; }
      if (choiceId.startsWith('item:')) {
        const id = choiceId.slice(5);
        const handled = ctx.commit<{ name: string; price: number; fittable: boolean }>(`handle:${id}`, {
          kind: 'retail.handle', payload: { visitId: visit.id, catalogId: id },
        });
        const stocked = stockAt(sim, place).find((x) => x.item.id === id);
        const flags = [...(stocked?.featured ? ['featured'] : []), ...(handled.price >= DEAR ? ['dear'] : [])];
        session.context['itemId'] = id;
        session.context['mirror'] = '';
        session.context['from'] = 'aisle';
        session.context['line'] = say(sim, 'browse', 'floor', { flags, tone: assistant ? toneOf(assistant) : 'dry' }, `${visit.id}:${id}`, true);
        ctx.go('item');
        return;
      }
    }

    if (session.node === 'item') {
      const place = placeOf(session);
      const visit = visitFor(sim, session);
      const assistant = sim.universe.people[visit.assistantId];
      const id = String(session.context['itemId'] ?? '');
      const backTo = String(session.context['from'] ?? '') === 'aisle' ? 'aisle' : 'floor';
      if (choiceId === 'floor') { session.context['line'] = ''; ctx.go(backTo); return; }
      if (choiceId === 'try') {
        ctx.say(say(sim, 'fitting', 'room', { tone: assistant ? toneOf(assistant) : 'dry' }, `${visit.id}:${id}:in`, true), assistant?.displayName);
        const tried = ctx.commit<{ verdict: Verdict; note: string }>(`try:${id}`, {
          kind: 'retail.try_on', payload: { visitId: visit.id, catalogId: id },
        });
        const spoken = say(sim, 'fitting', 'room', { result: tried.verdict, tone: assistant ? toneOf(assistant) : 'dry' }, `${visit.id}:${id}:verdict`, true);
        ctx.say(spoken, assistant?.displayName);
        session.context['mirror'] = `${verdictNote(tried.verdict)} ${spoken}`;
        return;
      }
      if (choiceId === 'take') {
        ctx.commit(`take:${id}`, { kind: 'retail.basket', payload: { visitId: visit.id, catalogId: id, take: true } });
        session.context['line'] = '';
        ctx.go(backTo);
        return;
      }
      if (choiceId === 'drop') {
        ctx.commit(`drop:${id}`, { kind: 'retail.basket', payload: { visitId: visit.id, catalogId: id, take: false } });
        session.context['line'] = '';
        session.context['mirror'] = '';
        ctx.go(backTo);
        return;
      }
      void place;
    }

    if (session.node === 'counter') {
      const place = placeOf(session);
      const visit = visitFor(sim, session);
      const assistant = sim.universe.people[visit.assistantId];
      if (choiceId === 'floor') { ctx.go('floor'); return; }
      if (choiceId === 'pay') {
        const paid = ctx.commit<{ total: number; items: number }>('pay', { kind: 'retail.pay', payload: { visitId: visit.id } });
        const standing = standingAt(sim, place);
        const flags = [...(paid.total >= BIG_BASKET ? ['big'] : []), ...(standing.regular ? ['regular'] : [])];
        ctx.say(say(sim, 'counter', 'till', {
          result: 'paid', flags, tone: assistant ? toneOf(assistant) : 'dry',
          vars: { total: formatMoney(paid.total) },
        }, `${visit.id}:till`, true), assistant?.displayName);
        ctx.say(say(sim, 'farewell', 'door', { result: 'bought', tone: assistant ? toneOf(assistant) : 'dry' }, `${visit.id}:bought`, true), assistant?.displayName);
        session.context['spent'] = paid.total;
        session.context['note'] = `${paid.items} from ${place.name}, ${formatMoney(paid.total)} with tax.`;
        ctx.go('reflect');
        return;
      }
    }

    if (session.node === 'reflect' && choiceId === 'finish') { ctx.finish(); return; }
    throw new CommandError('That isn’t a choice here.');
  },

  summarise(sim, session, ctx) {
    if (session.node === 'choose') {
      const nearest = placesNear(sim, { mode: 'walk', limit: 160 }).filter((e) => Boolean(e.place.retailerId))[0];
      if (!nearest) throw new CommandError('No shop nearby.');
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
      const entered = ctx.commit<{ visitId: string }>('enter', { kind: 'retail.enter', payload: { placeId: place.id } });
      session.context['visitId'] = entered.visitId;
      session.node = 'floor';
    }
    if (session.node === 'item' || session.node === 'aisle') session.node = 'floor';
    if (session.node === 'floor') {
      // The short version looks, does not try anything on, and walks out. It
      // never spends your money on your behalf.
      const visit = visitFor(sim, session);
      if (visit.basket.length > 0) session.node = 'counter';
      else {
        ctx.commit('walk_out', { kind: 'retail.walk_out', payload: { visitId: visit.id } });
        session.context['note'] = `A look round ${place.name}, and nothing bought.`;
        session.node = 'reflect';
      }
    }
    if (session.node === 'counter') {
      const visit = visitFor(sim, session);
      const paid = ctx.commit<{ total: number; items: number }>('pay', { kind: 'retail.pay', payload: { visitId: visit.id } });
      session.context['spent'] = paid.total;
      session.context['note'] = `${paid.items} from ${place.name}, ${formatMoney(paid.total)} with tax.`;
      session.node = 'reflect';
    }
    ctx.say(String(session.context['note'] ?? `${place.name}.`));
  },
});
