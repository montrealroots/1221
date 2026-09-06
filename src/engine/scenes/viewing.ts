/**
 * A house, viewed.
 *
 * You go over. The agent is at the door. You walk the rooms in whatever
 * order you like and each one shows you what its condition is; you ask
 * the agent the things an agent will answer; and you either put a number
 * on the table or thank them and go. The offer is the property system's
 * own command, with the same lender and the same earnest money as the
 * quick form; this only asks in the right order.
 *
 * The short version walks every room, asks nothing, offers nothing.
 */

import { CommandError, type Simulation } from '../core/simulation';
import { formatTime } from '../core/time';
import { formatMoney } from '../core/money';
import type { Id, SceneSession } from '../domain/model';
import { NEIGHBOURHOODS } from '../content/geography';
import { preview } from '../dialogue/library';
import {
  QUESTIONS, agentKnows, agentOf, agentTone, conditionBand, listingOf, offerChoices, propertyOf, roomsOf, viewable,
} from '../systems/viewings';
import { defineScene, unknownStep, type SceneChoice } from '../systems/scenes';

function str(session: SceneSession, key: string): string {
  const value = session.context[key];
  return value === null || value === undefined ? '' : String(value);
}

function seenRooms(session: SceneSession): string[] {
  return str(session, 'seen').split(',').filter(Boolean);
}

function listingOfSession(sim: Simulation, session: SceneSession) {
  const listing = listingOf(sim, str(session, 'listingId'));
  return { listing, property: propertyOf(sim, listing) };
}

export const VIEWING_SCENE = defineScene({
  id: 'property.viewing',
  version: 1,
  title: 'A Viewing',
  placeBound: false,

  available(sim, input) {
    const listing = sim.universe.propertyListings[String(input['listingId'])];
    if (!listing) return { ok: false, reason: 'There is no listing like that.' };
    const can = viewable(sim, listing);
    return can.ok ? { ok: true } : { ok: false, reason: can.reason };
  },

  start(sim, input) {
    const listing = listingOf(sim, String(input['listingId']));
    return {
      node: 'arrive',
      context: { listingId: listing.id, seen: '', greeting: '', lastNote: '', offered: '' },
      participantIds: agentOf(sim, listing) ? [agentOf(sim, listing)!.person.id] : [],
      refType: 'listing',
      refId: listing.id,
    };
  },

  view(sim, session) {
    const { listing, property } = listingOfSession(sim, session);
    const who = agentOf(sim, listing);
    const rooms = roomsOf(property);
    const seen = seenRooms(session);
    const hood = property.neighbourhoodId ? NEIGHBOURHOODS.get(property.neighbourhoodId)?.name : undefined;
    const facts = [
      { label: 'Asking', value: formatMoney(listing.askingPrice) },
      { label: 'Size', value: `${property.bedrooms} bed · ${property.bathrooms} bath · ${property.interiorSqft.toLocaleString('en-US')} sq ft` },
      { label: 'Built', value: `${property.yearBuilt}` },
      { label: 'On The Market', value: `${listing.daysOnMarket} days` },
    ];
    switch (session.node) {
      case 'arrive': {
        const greeting = who
          ? preview(sim, { section: 'property', purpose: 'greet', beat: 'door' }, {
            tone: agentTone(who.person), facts: agentKnows(sim, who.person.id).filter((k) => k !== 'met'),
            flags: [agentKnows(sim, who.person.id).includes('met') ? 'returning' : 'first_visit'], vars: { first: who.person.firstName },
          }, session.id).text
          : 'An agent will meet you there.';
        return {
          title: property.addressLine,
          eyebrow: hood ? `${hood} · ${formatTime(sim.now, sim.zone)}` : formatTime(sim.now, sim.zone),
          text: `${property.name.charAt(0).toUpperCase()}${property.name.slice(1)}. ${property.features.length > 0 ? `${property.features.join(', ')}.` : ''} ${greeting}`.replace(/\s+/g, ' ').trim(),
          choices: [{ id: 'go', label: 'Go Over', aliases: ['go', 'over', 'head over'], tone: 'primary', detail: 'Twenty-five minutes.' }],
          facts,
          canSkip: true,
        };
      }
      case 'rooms': {
        const choices: SceneChoice[] = rooms.map((room) => ({
          id: `room:${room.id}`, label: seen.includes(room.id) ? `${room.name} Again` : room.name, aliases: [room.name.toLowerCase(), room.kind],
          detail: seen.includes(room.id) ? 'You have seen it.' : undefined,
        }));
        choices.push({ id: 'ask', label: 'Ask The Agent', aliases: ['ask', 'agent', 'question'] });
        choices.push({ id: 'offer', label: 'Make An Offer', aliases: ['offer', 'number', 'buy'], tone: 'primary', disabled: seen.length === 0 ? 'Look at a room first.' : undefined });
        choices.push({ id: 'leave', label: 'Thank Them And Go', aliases: ['leave', 'go', 'thank'] });
        return {
          title: property.addressLine,
          eyebrow: `${seen.length} of ${rooms.length} rooms seen · ${conditionBand(property)} condition`,
          text: str(session, 'lastNote') || str(session, 'greeting') || 'The door is open.',
          choices,
          facts,
          canSkip: true,
        };
      }
      case 'ask': {
        const choices: SceneChoice[] = QUESTIONS.map((q) => ({ id: `ask:${q.id}`, label: q.label, aliases: q.aliases }));
        choices.push({ id: 'back', label: 'Back To The House', aliases: ['back', 'rooms'] });
        return {
          title: who ? who.person.displayName : 'The Agent',
          eyebrow: who ? who.agent.brokerage : property.addressLine,
          text: str(session, 'lastNote') || `${who?.person.firstName ?? 'The agent'} waits in the hall with the folder.`,
          choices,
          canSkip: false,
        };
      }
      case 'offer': {
        const choices: SceneChoice[] = offerChoices(sim, listing).map((o) => ({
          id: `offer:${o.amount}:${o.financingKind}`, label: o.label, aliases: [o.label.toLowerCase()],
          detail: `${formatMoney(o.amount)} · earnest money ${formatMoney(Math.round(o.amount * 0.01))} today`,
          disabled: o.disabled, tone: o.financingKind === 'cash' ? 'primary' : undefined,
        }));
        choices.push({ id: 'back', label: 'Never Mind', aliases: ['back', 'no', 'never mind'] });
        return {
          title: 'The Number',
          eyebrow: property.addressLine,
          text: `${who?.person.firstName ?? 'The agent'} opens the folder. Asking is ${formatMoney(listing.askingPrice)}. One percent goes down today as earnest money; the rest is the lender's business, or yours.`,
          choices,
          facts,
          canSkip: false,
        };
      }
      case 'done': {
        const offered = str(session, 'offered');
        return {
          title: offered ? 'Offer In' : 'Seen',
          eyebrow: property.addressLine,
          text: str(session, 'lastNote'),
          choices: [{ id: 'finish', label: 'Back To The Day', aliases: ['done', 'ok', 'finish'], tone: 'primary' }],
          facts: offered ? [{ label: 'Offered', value: formatMoney(Number(offered)) }, { label: 'You Will Hear', value: 'Within a day or two' }] : facts,
          canSkip: false,
          canLeave: false,
        };
      }
      default:
        throw unknownStep();
    }
  },

  choose(sim, session, choiceId, ctx) {
    const { listing } = listingOfSession(sim, session);
    switch (session.node) {
      case 'arrive': {
        if (choiceId !== 'go') throw unknownStep();
        const arrived = ctx.commit<{ greeting: string; agentId?: Id }>('arrive', { kind: 'viewing.arrive', payload: { listingId: listing.id } });
        session.context['greeting'] = arrived.greeting;
        session.context['lastNote'] = arrived.greeting;
        ctx.say(arrived.greeting);
        ctx.go('rooms');
        return;
      }
      case 'rooms': {
        if (choiceId === 'ask') { session.context['lastNote'] = ''; ctx.go('ask'); return; }
        if (choiceId === 'offer') { ctx.go('offer'); return; }
        if (choiceId === 'leave') {
          const who = agentOf(sim, listing);
          const line = preview(sim, { section: 'property', purpose: 'offer', beat: 'table' }, { move: 'none', tone: who ? agentTone(who.person) : undefined, vars: { first: who?.person.firstName ?? 'The agent' } }, session.id).text;
          session.context['lastNote'] = line;
          ctx.say(line);
          ctx.go('done');
          return;
        }
        if (!choiceId.startsWith('room:')) throw unknownStep();
        const room = choiceId.slice(5);
        const { note } = ctx.commit<{ note: string }>(`look:${room}:${seenRooms(session).length}`, { kind: 'viewing.look', payload: { listingId: listing.id, room } });
        const seen = seenRooms(session);
        if (!seen.includes(room)) seen.push(room);
        session.context['seen'] = seen.join(',');
        session.context['lastNote'] = note;
        ctx.say(note);
        return;
      }
      case 'ask': {
        if (choiceId === 'back') { ctx.go('rooms'); return; }
        if (!choiceId.startsWith('ask:')) throw unknownStep();
        const question = choiceId.slice(4);
        const { answer } = ctx.commit<{ answer: string }>(`ask:${question}`, { kind: 'viewing.ask', payload: { listingId: listing.id, question } });
        session.context['lastNote'] = answer;
        const who = agentOf(sim, listing);
        ctx.say(answer, who?.person.id);
        return;
      }
      case 'offer': {
        if (choiceId === 'back') { ctx.go('rooms'); return; }
        if (!choiceId.startsWith('offer:')) throw unknownStep();
        const [, amountText, financingKind] = choiceId.split(':');
        const amount = Number(amountText);
        if (!Number.isFinite(amount) || amount <= 0) throw new CommandError('Offer a number.');
        const who = agentOf(sim, listing);
        ctx.commit('offer', { kind: 'prop.make_offer', payload: { listingId: listing.id, amount, financingKind, contingencies: ['inspection'], agentId: who?.agent.id } });
        session.context['offered'] = amount;
        const line = preview(sim, { section: 'property', purpose: 'offer', beat: 'table' }, { tone: who ? agentTone(who.person) : undefined, vars: { first: who?.person.firstName ?? 'The agent' } }, session.id).text;
        session.context['lastNote'] = `${formatMoney(amount)}, ${financingKind === 'cash' ? 'cash' : 'with a mortgage'}. ${line}`;
        ctx.say(session.context['lastNote'] as string);
        ctx.go('done');
        return;
      }
      case 'done': {
        if (choiceId !== 'finish') throw unknownStep();
        ctx.finish();
        return;
      }
      default:
        throw unknownStep();
    }
  },

  summarise(sim, session, ctx) {
    const { listing, property } = listingOfSession(sim, session);
    if (session.node === 'arrive') {
      const arrived = ctx.commit<{ greeting: string }>('arrive', { kind: 'viewing.arrive', payload: { listingId: listing.id } });
      ctx.say(arrived.greeting);
      session.node = 'rooms';
    }
    const seen = seenRooms(session);
    for (const room of roomsOf(property)) {
      if (seen.includes(room.id)) continue;
      const { note } = ctx.commit<{ note: string }>(`look:${room.id}:${seen.length}`, { kind: 'viewing.look', payload: { listingId: listing.id, room: room.id } });
      seen.push(room.id);
      ctx.say(note);
    }
    session.context['seen'] = seen.join(',');
    ctx.say(`You saw it all. ${formatMoney(listing.askingPrice)} asking, ${conditionBand(property)} condition. It is still there if you want it.`);
    ctx.finish();
  },
});
