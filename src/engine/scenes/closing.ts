/**
 * Closing day: the table, the numbers, the pen.
 *
 * Page one of the folder is what the purchase costs today: the price, the
 * deposit already paid, the down payment or the whole price, the appraisal
 * gap if there is one, the closing costs, and what that leaves to bring.
 * Sign and the money moves through the property system's own closing;
 * ask for three more days once; or walk away and leave the deposit with
 * the seller, because that is what the contract says. Signed, the keys
 * are yours and you can go straight there.
 *
 * The short version signs if the money is there, asks for the days if it
 * is not and can, and otherwise says how short you are.
 */

import type { Simulation } from '../core/simulation';
import { formatDate } from '../core/time';
import { formatMoney } from '../core/money';
import type { SceneSession } from '../domain/model';
import type { ClosingOutcome } from '../systems/property';
import {
  MOVING_DAY_DAYS, POSTPONE_DAYS, canPostpone, closerFor, closerSays, closingNumbers, offerOf, propertyOfOffer, roomsFor,
} from '../systems/purchase';
import { defineScene, unknownStep, type SceneChoice } from '../systems/scenes';


function str(session: SceneSession, key: string): string {
  const value = session.context[key];
  return value === null || value === undefined ? '' : String(value);
}

function factsFor(sim: Simulation, offerId: string) {
  const offer = offerOf(sim, offerId);
  const n = closingNumbers(sim, offer);
  const facts = [
    { label: 'Price', value: formatMoney(n.price) },
    { label: 'Deposit Paid', value: formatMoney(n.earnestPaid) },
    { label: n.financed ? 'Down Payment' : 'All Cash', value: formatMoney(n.downPayment) },
  ];
  if (n.appraisalGap > 0) facts.push({ label: 'Appraisal Gap', value: formatMoney(n.appraisalGap) });
  facts.push({ label: 'Closing Costs', value: formatMoney(n.closingCosts) });
  facts.push({ label: 'Cash To Close', value: formatMoney(n.cashToClose) });
  facts.push({ label: 'You Have', value: formatMoney(n.available) });
  if (n.monthlyPayment) facts.push({ label: 'Monthly Payment', value: formatMoney(n.monthlyPayment) });
  if (n.appraisal) facts.push({ label: 'Appraised At', value: formatMoney(n.appraisal) });
  return facts;
}

export const CLOSING_SCENE = defineScene({
  id: 'property.closing',
  version: 1,
  title: 'Closing Day',
  placeBound: false,

  available(sim, input) {
    const offer = sim.universe.propertyOffers[String(input['offerId'])];
    if (!offer) return { ok: false, reason: 'There’s no offer like that.' };
    if (offer.buyerId !== sim.player.id) return { ok: false, reason: 'That isn’t your purchase.' };
    if (offer.status !== 'accepted') return { ok: false, reason: 'That purchase isn’t open to close.' };
    return { ok: true };
  },

  start(sim, input) {
    const offer = offerOf(sim, String(input['offerId']));
    return {
      node: 'table',
      context: { offerId: offer.id, result: '', lastNote: '', monthly: 0 },
      participantIds: [closerFor(sim, offer).id],
      refType: 'offer',
      refId: offer.id,
    };
  },

  view(sim, session) {
    const offer = offerOf(sim, str(session, 'offerId'));
    const property = propertyOfOffer(sim, offer);
    const closer = closerFor(sim, offer);
    const facts = factsFor(sim, offer.id);
    switch (session.node) {
      case 'table': {
        const n = closingNumbers(sim, offer);
        const choices: SceneChoice[] = [
          { id: 'sign', label: 'Sign', aliases: ['sign', 'yes', 'close'], tone: 'primary', detail: `${formatMoney(n.cashToClose)} leaves your account today.`, disabled: n.shortfall > 0 ? `You are ${formatMoney(n.shortfall)} short.` : undefined },
        ];
        if (canPostpone(offer)) choices.push({ id: 'postpone', label: `Ask For ${POSTPONE_DAYS} More Days`, aliases: ['postpone', 'days', 'delay'], detail: 'The seller allows it once.' });
        choices.push({ id: 'walk', label: 'Walk Away', aliases: ['walk', 'leave'], detail: `The deposit of ${formatMoney(offer.earnestMoney)} stays with the seller.` });
        return {
          title: 'Closing Day',
          eyebrow: `${property.addressLine} · ${closer.displayName}, escrow`,
          text: str(session, 'lastNote') || closerSays(sim, offer, 'open', 'open'),
          choices,
          facts,
          canSkip: true,
        };
      }
      case 'confirm': {
        return {
          title: 'Walk Away?',
          eyebrow: property.addressLine,
          text: `${formatMoney(offer.earnestMoney)} stays with the seller and the house goes back on the market. Nothing else follows you out of the room.`,
          choices: [
            { id: 'walk', label: 'Walk Away And Lose The Deposit', aliases: ['walk', 'yes', 'lose it'], tone: 'danger' },
            { id: 'back', label: 'Back To The Table', aliases: ['back', 'no'] },
          ],
          facts,
          canSkip: false,
        };
      }
      case 'keys': {
        const resident = sim.player.residenceId === property.id;
        return {
          title: 'The Keys',
          eyebrow: property.addressLine,
          text: str(session, 'lastNote'),
          choices: [
            { id: 'movein', label: 'Move In Today', aliases: ['move in', 'today', 'go there'], tone: 'primary', detail: resident ? undefined : 'Two hours. The old lease ends today.', disabled: resident ? 'You already live there.' : undefined },
            { id: 'later', label: 'Not Yet', aliases: ['later', 'not yet', 'no'], detail: `Moving day is in ${MOVING_DAY_DAYS} days; it will ask.` },
          ],
          facts: [
            { label: 'Yours Since', value: formatDate(sim.now, sim.zone) },
            { label: 'Rooms', value: `${roomsFor(sim, property.id).length}` },
            ...(Number(session.context['monthly']) > 0 ? [{ label: 'Monthly Payment', value: formatMoney(Number(session.context['monthly'])) }] : []),
          ],
          canSkip: false,
          canLeave: false,
        };
      }
      case 'done': {
        const result = str(session, 'result');
        return {
          title: result === 'home' ? 'Home' : result === 'postponed' ? 'Three More Days' : result === 'walked' ? 'Walked' : result === 'failed' ? 'It Did Not Close' : 'Done',
          eyebrow: property.addressLine,
          text: str(session, 'lastNote'),
          choices: [{ id: 'finish', label: 'Back To The Day', aliases: ['done', 'ok', 'finish'], tone: 'primary' }],
          facts: result === 'postponed' ? [{ label: 'Closing Now', value: formatDate(offer.closingAt ?? sim.now, sim.homeZone) }] : undefined,
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
    const property = propertyOfOffer(sim, offer);
    switch (session.node) {
      case 'table': {
        if (choiceId === 'sign') {
          const outcome = ctx.commit<ClosingOutcome>('close', { kind: 'prop.close', payload: { offerId: offer.id } });
          if (outcome.closed) {
            session.context['monthly'] = outcome.monthlyPayment ?? 0;
            const line = closerSays(sim, offer, 'signed', 'signed', true);
            session.context['lastNote'] = line;
            ctx.say(line, closerFor(sim, offer).id);
            ctx.go('keys');
          } else {
            session.context['result'] = 'failed';
            const line = `${closerSays(sim, offer, 'failed', 'failed', true)} ${outcome.detail}`;
            session.context['lastNote'] = line;
            ctx.say(line, closerFor(sim, offer).id);
            ctx.go('done');
          }
          return;
        }
        if (choiceId === 'postpone') {
          ctx.commit('postpone', { kind: 'prop.postpone_closing', payload: { offerId: offer.id } });
          session.context['result'] = 'postponed';
          const line = closerSays(sim, offer, 'postponed', 'postponed', true);
          session.context['lastNote'] = line;
          ctx.say(line, closerFor(sim, offer).id);
          ctx.go('done');
          return;
        }
        if (choiceId === 'walk') { ctx.go('confirm'); return; }
        throw unknownStep();
      }
      case 'confirm': {
        if (choiceId === 'back') { ctx.go('table'); return; }
        if (choiceId !== 'walk') throw unknownStep();
        ctx.commit('walk', { kind: 'prop.walk_from_closing', payload: { offerId: offer.id } });
        session.context['result'] = 'walked';
        const line = closerSays(sim, offer, 'walked', 'walked', true);
        session.context['lastNote'] = line;
        ctx.say(line, closerFor(sim, offer).id);
        ctx.go('done');
        return;
      }
      case 'keys': {
        if (choiceId === 'movein') {
          ctx.commit('movein', { kind: 'prop.move_in', payload: { propertyId: property.id } });
          session.context['result'] = 'home';
          const line = `You drive there with the keys on the seat beside you. ${roomsFor(sim, property.id).length} rooms, and the boxes to follow. Moving in properly is on the Property page when you’re ready.`;
          session.context['lastNote'] = line;
          ctx.say(line);
          ctx.go('done');
          return;
        }
        if (choiceId === 'later') {
          session.context['result'] = 'keys';
          ctx.finish();
          return;
        }
        throw unknownStep();
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
    if (offer.status !== 'accepted') { ctx.finish(); return; }
    const n = closingNumbers(sim, offer);
    if (n.shortfall <= 0) {
      const outcome = ctx.commit<ClosingOutcome>('close', { kind: 'prop.close', payload: { offerId: offer.id } });
      if (outcome.closed) {
        session.context['result'] = 'signed';
        ctx.say(closerSays(sim, offer, 'signed', 'signed', true));
        ctx.say(`${formatMoney(outcome.cashPaid)} paid at the table. The keys are yours; moving day is in ${MOVING_DAY_DAYS} days.`);
      } else {
        session.context['result'] = 'failed';
        ctx.say(`${closerSays(sim, offer, 'failed', 'failed', true)} ${outcome.detail}`);
      }
    } else if (canPostpone(offer)) {
      ctx.commit('postpone', { kind: 'prop.postpone_closing', payload: { offerId: offer.id } });
      session.context['result'] = 'postponed';
      ctx.say(`You are ${formatMoney(n.shortfall)} short. ${closerSays(sim, offer, 'postponed', 'postponed', true)}`);
    } else {
      ctx.say(`You are ${formatMoney(n.shortfall)} short at the table and the seller has already waited once. Find it, or the deposit is theirs.`);
    }
    ctx.finish();
  },
});
