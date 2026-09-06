/**
 * The inspection: what the inspector found, item by item, and what you do
 * about it.
 *
 * The inspection has already happened; the report is a committed fact. You
 * can walk the house with the inspector if you are in the city, or read
 * the report at the kitchen table if you are not. Then you decide in the
 * room: proceed at the price, ask for money off (the seller answers by the
 * property system's own rule), or walk away with the deposit. Silence for
 * four days is a yes, and the scene says so.
 *
 * The short version looks at everything and asks for the findings off the
 * price when they are significant, or proceeds when they are not.
 */

import { CommandError, type Simulation } from '../core/simulation';
import { formatMoney } from '../core/money';
import type { PropertyOffer, SceneSession } from '../domain/model';
import { preview, speak } from '../dialogue/library';
import {
  INSPECTION_DAYS, NOT_HERE, findingsTotal, inspectionSignificant, inspectorFor, offerOf, personTone, propertyOfOffer, reductionChoices,
} from '../systems/purchase';
import { defineScene, unknownStep, type SceneChoice } from '../systems/scenes';

function str(session: SceneSession, key: string): string {
  const value = session.context[key];
  return value === null || value === undefined ? '' : String(value);
}

function seen(session: SceneSession): number[] {
  return str(session, 'seen').split(',').filter(Boolean).map(Number);
}

function severityWord(severity: 'minor' | 'moderate' | 'major'): string {
  return severity === 'major' ? 'Major' : severity === 'moderate' ? 'Moderate' : 'Minor';
}

function meetLine(sim: Simulation, offer: PropertyOffer, here: boolean, record: boolean): string {
  const inspector = inspectorFor(sim, offer);
  const count = offer.inspectionFindings?.length ?? 0;
  const ctx = {
    flags: [here ? (count === 0 ? 'clean' : 'work') : 'report'],
    tone: personTone(inspector),
    vars: { first: inspector.firstName, count: String(count) },
  };
  const query = { section: 'property', purpose: 'inspect', beat: 'meet' };
  return (record ? speak(sim, query, ctx, `${offer.id}:meet`) : preview(sim, query, ctx, `${offer.id}:meet`)).text;
}

function findingLine(sim: Simulation, offer: PropertyOffer, index: number): string {
  const finding = offer.inspectionFindings?.[index];
  if (!finding) return '';
  const inspector = inspectorFor(sim, offer);
  return speak(sim, { section: 'property', purpose: 'inspect', beat: 'walk' }, {
    flags: [finding.severity], tone: personTone(inspector),
    vars: { first: inspector.firstName, item: finding.item, estimate: formatMoney(finding.estimate, { cents: false }) },
  }, `${offer.id}:${index}`).text;
}

function verdictLine(sim: Simulation, offer: PropertyOffer, flag: 'clean' | 'work' | 'reduced' | 'refused' | 'walked', record: boolean): string {
  const inspector = inspectorFor(sim, offer);
  const ctx = { flags: [flag], tone: personTone(inspector), vars: { first: inspector.firstName } };
  const query = { section: 'property', purpose: 'inspect', beat: 'verdict' };
  return (record ? speak(sim, query, ctx, `${offer.id}:${flag}`) : preview(sim, query, ctx, `${offer.id}:${flag}`)).text;
}

export const INSPECTION_SCENE = defineScene({
  id: 'property.inspection',
  version: 1,
  title: 'The Inspection',
  placeBound: false,

  available(sim, input) {
    const offer = sim.universe.propertyOffers[String(input['offerId'])];
    if (!offer) return { ok: false, reason: 'There is no offer like that.' };
    if (offer.buyerId !== sim.player.id) return { ok: false, reason: 'That is not your purchase.' };
    if (offer.status !== 'accepted') return { ok: false, reason: 'That purchase is not open.' };
    if (!offer.inspectionFindings) return { ok: false, reason: 'The inspection has not happened yet.' };
    if (offer.inspectionDecidedAt) return { ok: false, reason: 'That report has been answered already.' };
    return { ok: true };
  },

  start(sim, input) {
    const offer = offerOf(sim, String(input['offerId']));
    return {
      node: 'meet',
      context: { offerId: offer.id, seen: '', here: '', lastNote: '', result: '' },
      participantIds: [inspectorFor(sim, offer).id],
      refType: 'offer',
      refId: offer.id,
    };
  },

  view(sim, session) {
    const offer = offerOf(sim, str(session, 'offerId'));
    const property = propertyOfOffer(sim, offer);
    const findings = offer.inspectionFindings ?? [];
    const total = findingsTotal(offer);
    const inspector = inspectorFor(sim, offer);
    const here = sim.player.currentLocationId === property.locationId;
    const facts = [
      { label: 'Items', value: `${findings.length}` },
      { label: 'About', value: formatMoney(total, { cents: false }) },
      { label: 'Price', value: formatMoney(offer.amount) },
      { label: 'Contingency Ends', value: `${INSPECTION_DAYS} days after the report` },
    ];
    switch (session.node) {
      case 'meet': {
        return {
          title: 'The Inspection',
          eyebrow: `${property.addressLine} · ${inspector.displayName}`,
          text: here ? meetLine(sim, offer, true, false) : `${inspector.firstName} has sent the report. You are not in ${property.addressLine.split(',')[0]}'s city to walk it, but you can read it anywhere.`,
          choices: [
            { id: 'walk', label: 'Walk It With The Inspector', aliases: ['walk', 'inspector', 'with them'], tone: 'primary', detail: 'An hour and a half, room by room.', disabled: here ? undefined : NOT_HERE },
            { id: 'read', label: 'Read The Report Here', aliases: ['read', 'report', 'here'], detail: 'Fifteen minutes with the pages.' },
          ],
          facts,
          canSkip: true,
        };
      }
      case 'findings': {
        const looked = seen(session);
        const choices: SceneChoice[] = findings.map((f, i) => ({
          id: `look:${i}`, label: looked.includes(i) ? `${f.item} Again` : f.item, aliases: [f.item.toLowerCase()],
          detail: `${severityWord(f.severity)} · about ${formatMoney(f.estimate, { cents: false })}`,
        }));
        choices.push({ id: 'decide', label: 'Decide', aliases: ['decide', 'done', 'enough'], tone: 'primary' });
        return {
          title: 'The Report',
          eyebrow: `${looked.length} of ${findings.length} looked at · about ${formatMoney(total, { cents: false })} of work`,
          text: str(session, 'lastNote') || (findings.length === 0 ? 'There is nothing on the list. That happens, and it is worth the fee when it does.' : 'The list, in the order it was written.'),
          choices,
          facts,
          canSkip: true,
        };
      }
      case 'decide': {
        return {
          title: 'What Do You Do?',
          eyebrow: property.addressLine,
          text: verdictLine(sim, offer, findings.length === 0 ? 'clean' : 'work', false),
          choices: [
            { id: 'proceed', label: 'Proceed At The Price', aliases: ['proceed', 'go ahead', 'yes'], tone: findings.length === 0 || !inspectionSignificant(offer) ? 'primary' : undefined, detail: `${formatMoney(offer.amount)} as agreed.` },
            { id: 'ask', label: 'Ask For Money Off', aliases: ['ask', 'money', 'reduce', 'renegotiate'], tone: inspectionSignificant(offer) ? 'primary' : undefined, disabled: findings.length === 0 ? 'There is nothing to ask for.' : undefined, detail: 'The seller answers in the room.' },
            { id: 'walk', label: 'Walk Away With The Deposit', aliases: ['walk', 'leave', 'withdraw'], detail: `${formatMoney(offer.earnestMoney)} comes back to you.` },
            { id: 'back', label: 'Look Again', aliases: ['back', 'again'] },
          ],
          facts,
          canSkip: true,
        };
      }
      case 'ask': {
        const choices: SceneChoice[] = reductionChoices(offer).map((c) => ({ id: `ask:${c.amount}`, label: c.label, aliases: [c.id], detail: `${c.detail} New price ${formatMoney(c.amount)}.` }));
        choices.push({ id: 'back', label: 'Never Mind', aliases: ['back', 'never mind'] });
        return {
          title: 'How Much?',
          eyebrow: property.addressLine,
          text: `The seller has ${formatMoney(total, { cents: false })} of findings in front of them too. A number close to that is easy to refuse and easy to accept; it depends on how badly they want to move.`,
          choices,
          facts,
          canSkip: false,
        };
      }
      case 'done': {
        const result = str(session, 'result');
        return {
          title: result === 'reduced' ? 'Price Reduced' : result === 'refused' ? 'They Said No' : result === 'walked' ? 'Walked Away' : 'Proceeding',
          eyebrow: property.addressLine,
          text: str(session, 'lastNote'),
          choices: [{ id: 'finish', label: 'Back To The Day', aliases: ['done', 'ok', 'finish'], tone: 'primary' }],
          facts: result === 'walked' ? [{ label: 'Deposit', value: `${formatMoney(offer.earnestMoney)} returned` }] : [{ label: 'Price', value: formatMoney(offer.amount) }],
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
      case 'meet': {
        if (choiceId !== 'walk' && choiceId !== 'read') throw unknownStep();
        const here = choiceId === 'walk';
        ctx.commit('walk', { kind: 'prop.inspection_walk', payload: { offerId: offer.id, here } });
        session.context['here'] = here ? 'yes' : '';
        const line = meetLine(sim, offer, here, true);
        session.context['lastNote'] = line;
        ctx.say(line, here ? inspectorFor(sim, offer).id : undefined);
        ctx.go('findings');
        return;
      }
      case 'findings': {
        if (choiceId === 'decide') { session.context['lastNote'] = ''; ctx.go('decide'); return; }
        if (!choiceId.startsWith('look:')) throw unknownStep();
        const index = Number(choiceId.slice(5));
        if (!offer.inspectionFindings?.[index]) throw new CommandError('That is not on the list.');
        const line = findingLine(sim, offer, index);
        const looked = seen(session);
        if (!looked.includes(index)) looked.push(index);
        session.context['seen'] = looked.join(',');
        session.context['lastNote'] = line;
        ctx.say(line, str(session, 'here') ? inspectorFor(sim, offer).id : undefined);
        return;
      }
      case 'decide': {
        if (choiceId === 'back') { ctx.go('findings'); return; }
        if (choiceId === 'ask') { ctx.go('ask'); return; }
        if (choiceId === 'proceed') {
          ctx.commit('decide', { kind: 'prop.inspection_decision', payload: { offerId: offer.id, proceed: true } });
          session.context['result'] = 'proceeded';
          const line = verdictLine(sim, offer, (offer.inspectionFindings?.length ?? 0) === 0 ? 'clean' : 'work', true);
          session.context['lastNote'] = line;
          ctx.say(line, inspectorFor(sim, offer).id);
          ctx.go('done');
          return;
        }
        if (choiceId === 'walk') {
          ctx.commit('decide', { kind: 'prop.inspection_decision', payload: { offerId: offer.id, proceed: false } });
          session.context['result'] = 'walked';
          const line = verdictLine(sim, offer, 'walked', true);
          session.context['lastNote'] = line;
          ctx.say(line, inspectorFor(sim, offer).id);
          ctx.go('done');
          return;
        }
        throw unknownStep();
      }
      case 'ask': {
        if (choiceId === 'back') { ctx.go('decide'); return; }
        if (!choiceId.startsWith('ask:')) throw unknownStep();
        const amount = Number(choiceId.slice(4));
        if (!reductionChoices(offer).some((c) => c.amount === amount)) throw new CommandError('That number is not on the table.');
        const { reduced } = ctx.commit<{ status: string; reduced?: boolean }>('decide', { kind: 'prop.inspection_decision', payload: { offerId: offer.id, proceed: true, renegotiate: amount } });
        session.context['result'] = reduced ? 'reduced' : 'refused';
        const line = verdictLine(sim, offer, reduced ? 'reduced' : 'refused', true);
        session.context['lastNote'] = line;
        ctx.say(line, inspectorFor(sim, offer).id);
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
    const property = propertyOfOffer(sim, offer);
    if (session.node === 'meet') {
      const here = sim.player.currentLocationId === property.locationId;
      ctx.commit('walk', { kind: 'prop.inspection_walk', payload: { offerId: offer.id, here } });
      session.context['here'] = here ? 'yes' : '';
      ctx.say(meetLine(sim, offer, here, true));
      session.node = 'findings';
    }
    const findings = offer.inspectionFindings ?? [];
    const looked = seen(session);
    for (let i = 0; i < findings.length; i++) {
      if (looked.includes(i)) continue;
      looked.push(i);
      ctx.say(findingLine(sim, offer, i));
    }
    session.context['seen'] = looked.join(',');
    if (!offer.inspectionDecidedAt && offer.status === 'accepted') {
      const ask = inspectionSignificant(offer) ? reductionChoices(offer)[0] : undefined;
      if (ask) {
        const { reduced } = ctx.commit<{ status: string; reduced?: boolean }>('decide', { kind: 'prop.inspection_decision', payload: { offerId: offer.id, proceed: true, renegotiate: ask.amount } });
        session.context['result'] = reduced ? 'reduced' : 'refused';
        ctx.say(`You asked for ${formatMoney(offer.amount >= ask.amount ? findingsTotal(offer) : 0, { cents: false })} off. ${verdictLine(sim, offer, reduced ? 'reduced' : 'refused', true)}`);
      } else {
        ctx.commit('decide', { kind: 'prop.inspection_decision', payload: { offerId: offer.id, proceed: true } });
        session.context['result'] = 'proceeded';
        ctx.say(verdictLine(sim, offer, findings.length === 0 ? 'clean' : 'work', true));
      }
    }
    ctx.finish();
  },
});
