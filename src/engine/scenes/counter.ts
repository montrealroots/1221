/**
 * The call: the seller came back with a number.
 *
 * Your agent rings with the counter. Take it, come back with a number of
 * your own (the lender's refusal sits on any line the money will not
 * carry), or walk away and have the deposit back. Every answer is the
 * property system's own command; this only puts a voice on it.
 *
 * The short version takes the counter if the money carries it, otherwise
 * splits the difference, otherwise walks.
 */

import { CommandError, type Simulation } from '../core/simulation';
import { formatMoney } from '../core/money';
import type { SceneSession } from '../domain/model';
import { preview, speak } from '../dialogue/library';
import { MAX_SELLER_COUNTERS } from '../systems/property';
import { agentOfOffer, counterAcceptRefusal, counterChoices, offerOf, personTone, propertyOfOffer } from '../systems/purchase';
import { defineScene, unknownStep, type SceneChoice } from '../systems/scenes';

function str(session: SceneSession, key: string): string {
  const value = session.context[key];
  return value === null || value === undefined ? '' : String(value);
}

function agentLine(sim: Simulation, session: SceneSession, result: 'open' | 'accepted' | 'countered' | 'walked', amount?: number, record = false): string {
  const offer = offerOf(sim, str(session, 'offerId'));
  const who = agentOfOffer(sim, offer);
  const ctx = {
    result,
    flags: (offer.counterRounds ?? 0) >= MAX_SELLER_COUNTERS ? ['second'] : [],
    tone: who ? personTone(who.person) : undefined,
    vars: { first: who?.person.firstName ?? 'Your agent', counter: formatMoney(offer.counterAmount ?? offer.amount), amount: formatMoney(amount ?? offer.amount) },
  };
  const query = { section: 'property', purpose: 'call', beat: 'counter' };
  return (record ? speak(sim, query, ctx, `${offer.id}:${result}`) : preview(sim, query, ctx, `${offer.id}:${result}`)).text;
}

export const COUNTER_SCENE = defineScene({
  id: 'property.counter',
  version: 1,
  title: 'The Call',
  placeBound: false,

  available(sim, input) {
    const offer = sim.universe.propertyOffers[String(input['offerId'])];
    if (!offer) return { ok: false, reason: 'There’s no offer like that.' };
    if (offer.buyerId !== sim.player.id) return { ok: false, reason: 'That isn’t your offer.' };
    if (offer.status !== 'countered') return { ok: false, reason: 'There’s no counter to answer.' };
    return { ok: true };
  },

  start(sim, input) {
    const offer = offerOf(sim, String(input['offerId']));
    const who = agentOfOffer(sim, offer);
    return {
      node: 'call',
      context: { offerId: offer.id, result: '', amount: 0, lastNote: '' },
      participantIds: who ? [who.person.id] : [],
      refType: 'offer',
      refId: offer.id,
    };
  },

  view(sim, session) {
    const offer = offerOf(sim, str(session, 'offerId'));
    const property = propertyOfOffer(sim, offer);
    const who = agentOfOffer(sim, offer);
    const counter = offer.counterAmount ?? offer.amount;
    const facts = [
      { label: 'They Want', value: formatMoney(counter) },
      { label: 'You Offered', value: formatMoney(offer.amount) },
      { label: 'Asking Was', value: formatMoney(sim.universe.propertyListings[offer.listingId]?.askingPrice ?? counter) },
      { label: 'Round', value: `${offer.counterRounds ?? 1} of ${MAX_SELLER_COUNTERS}` },
    ];
    switch (session.node) {
      case 'call': {
        const refusal = counterAcceptRefusal(sim, offer);
        return {
          title: who ? `${who.person.firstName} Calling` : 'Your Agent Calling',
          eyebrow: `${property.addressLine}${who ? ` · ${who.agent.brokerage}` : ''}`,
          text: str(session, 'lastNote') || agentLine(sim, session, 'open'),
          choices: [
            { id: 'accept', label: 'Accept The Counter', aliases: ['accept', 'yes', 'take it'], tone: 'primary', detail: `${formatMoney(counter)}. Inspection in five days, closing in a month.`, disabled: refusal },
            { id: 'counter', label: 'Counter Back', aliases: ['counter', 'number', 'come back'], detail: 'A number between the two.' },
            { id: 'walk', label: 'Walk Away', aliases: ['walk', 'no', 'leave it'], detail: 'The deposit comes back to you.' },
          ],
          facts,
          canSkip: true,
        };
      }
      case 'number': {
        const choices: SceneChoice[] = counterChoices(sim, offer).map((c) => ({
          id: `counter:${c.id}`, label: c.label, aliases: [c.id], detail: `${formatMoney(c.amount)}. ${c.detail}`, disabled: c.disabled,
        }));
        choices.push({ id: 'back', label: 'Never Mind', aliases: ['back', 'never mind'] });
        return {
          title: 'Your Number',
          eyebrow: property.addressLine,
          text: `${who?.person.firstName ?? 'Your agent'} waits. Whatever you say goes to the seller tonight and comes back in a day or two${(offer.counterRounds ?? 0) >= MAX_SELLER_COUNTERS ? ', and this time it comes back as a yes or a no' : ''}.`,
          choices,
          facts,
          canSkip: false,
        };
      }
      case 'done': {
        const result = str(session, 'result');
        return {
          title: result === 'accepted' ? 'A House, Then' : result === 'countered' ? 'Back To Them' : 'Walked',
          eyebrow: property.addressLine,
          text: str(session, 'lastNote'),
          choices: [{ id: 'finish', label: 'Back To The Day', aliases: ['done', 'ok', 'finish'], tone: 'primary' }],
          facts: result === 'countered' ? [{ label: 'You Said', value: formatMoney(Number(session.context['amount'])) }, { label: 'You Will Hear', value: 'Within two days' }] : undefined,
          canSkip: false,
          canLeave: false,
        };
      }
      default:
        throw unknownStep();
    }
  },

  choose(sim, session, choiceId, ctx) {
    const offer = offerOf(sim, str(session, 'offerId'));
    switch (session.node) {
      case 'call': {
        if (choiceId === 'accept') {
          ctx.commit('answer', { kind: 'prop.respond_to_counter', payload: { offerId: offer.id, accept: true } });
          session.context['result'] = 'accepted';
          const line = agentLine(sim, session, 'accepted', undefined, true);
          session.context['lastNote'] = line;
          ctx.say(line, agentOfOffer(sim, offer)?.person.id);
          ctx.go('done');
          return;
        }
        if (choiceId === 'counter') { ctx.go('number'); return; }
        if (choiceId === 'walk') {
          ctx.commit('answer', { kind: 'prop.respond_to_counter', payload: { offerId: offer.id, accept: false } });
          session.context['result'] = 'walked';
          const line = agentLine(sim, session, 'walked', undefined, true);
          session.context['lastNote'] = line;
          ctx.say(line, agentOfOffer(sim, offer)?.person.id);
          ctx.go('done');
          return;
        }
        throw unknownStep();
      }
      case 'number': {
        if (choiceId === 'back') { ctx.go('call'); return; }
        if (!choiceId.startsWith('counter:')) throw unknownStep();
        const choice = counterChoices(sim, offer).find((c) => c.id === choiceId.slice(8));
        if (!choice) throw new CommandError('That number isn’t on the table.');
        ctx.commit('answer', { kind: 'prop.respond_to_counter', payload: { offerId: offer.id, accept: false, counterAmount: choice.amount } });
        session.context['result'] = 'countered';
        session.context['amount'] = choice.amount;
        const line = agentLine(sim, session, 'countered', choice.amount, true);
        session.context['lastNote'] = line;
        ctx.say(line, agentOfOffer(sim, offer)?.person.id);
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
    const offer = offerOf(sim, str(session, 'offerId'));
    if (offer.status !== 'countered') { ctx.finish(); return; }
    const who = agentOfOffer(sim, offer);
    if (!counterAcceptRefusal(sim, offer)) {
      ctx.commit('answer', { kind: 'prop.respond_to_counter', payload: { offerId: offer.id, accept: true } });
      session.context['result'] = 'accepted';
      ctx.say(agentLine(sim, session, 'accepted', undefined, true), who?.person.id);
    } else {
      const split = counterChoices(sim, offer).find((c) => !c.disabled);
      if (split) {
        ctx.commit('answer', { kind: 'prop.respond_to_counter', payload: { offerId: offer.id, accept: false, counterAmount: split.amount } });
        session.context['result'] = 'countered';
        session.context['amount'] = split.amount;
        ctx.say(agentLine(sim, session, 'countered', split.amount, true), who?.person.id);
      } else {
        ctx.commit('answer', { kind: 'prop.respond_to_counter', payload: { offerId: offer.id, accept: false } });
        session.context['result'] = 'walked';
        ctx.say(agentLine(sim, session, 'walked', undefined, true), who?.person.id);
      }
    }
    ctx.finish();
  },
});
