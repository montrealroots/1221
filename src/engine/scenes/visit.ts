/**
 * A visit to a provider: the desk, the wait, the room, the verdict, the
 * desk again.
 *
 * Every commit is the care system's own command: checking in fixes what
 * the desk will charge from the card you hold; the consultation is the
 * exam, and whatever it decides (tests, a prescription, a follow-up) is
 * written by that command and not by this text; paying is paying. The
 * provider is a person who remembers what you came in about.
 *
 * The short version checks in, says the plain reason, and pays.
 */

import { CommandError, type Simulation } from '../core/simulation';
import { formatDate } from '../core/time';
import { formatMoney } from '../core/money';
import type { Appointment, SceneSession } from '../domain/model';
import { preview, speak } from '../dialogue/library';
import { SPECIALTIES, nextOpening } from '../systems/services';
import {
  COMPLAINT_BY_ID, TRAVEL_MINUTES, WAIT_MINUTES, appointmentOf, attendable, complaintsFor, doctorKnows, doctorOf, doctorTone, providerOf, visitCost, type Verdict, type VisitCost,
} from '../systems/care';
import { defineScene, unknownStep, type SceneChoice } from '../systems/scenes';


function str(session: SceneSession, key: string): string {
  const value = session.context[key];
  return value === null || value === undefined ? '' : String(value);
}

function num(session: SceneSession, key: string): number {
  return Number(session.context[key] ?? 0);
}

function deskLine(sim: Simulation, appointment: Appointment, cost: VisitCost, record: boolean): string {
  const doctor = doctorOf(sim, providerOf(sim, appointment));
  const ctx = { flags: [cost.network], facts: doctorKnows(sim, doctor.id), vars: { pay: formatMoney(cost.outOfPocket), carrier: cost.carrier ?? 'your carrier' } };
  const query = { section: 'health', purpose: 'reception', beat: 'desk' };
  return (record ? speak(sim, query, ctx, `${appointment.id}:desk`) : preview(sim, query, ctx, `${appointment.id}:desk`)).text;
}

function askLine(sim: Simulation, appointment: Appointment, record: boolean): string {
  const provider = providerOf(sim, appointment);
  const doctor = doctorOf(sim, provider);
  const ctx = { flags: [provider.specialty], facts: doctorKnows(sim, doctor.id), tone: doctorTone(doctor), vars: { first: doctor.firstName } };
  const query = { section: 'health', purpose: 'ask', beat: 'room' };
  return (record ? speak(sim, query, ctx, `${appointment.id}:ask`) : preview(sim, query, ctx, `${appointment.id}:ask`)).text;
}

function verdictLine(sim: Simulation, appointment: Appointment, verdict: Verdict, wrongDoor: boolean): string {
  const doctor = doctorOf(sim, providerOf(sim, appointment));
  const main = speak(sim, { section: 'health', purpose: 'exam', beat: 'verdict' }, { result: verdict, tone: doctorTone(doctor), vars: { first: doctor.firstName } }, `${appointment.id}:verdict`).text;
  if (!wrongDoor) return main;
  const aside = speak(sim, { section: 'health', purpose: 'exam', beat: 'verdict' }, { flags: ['wrongdoor'], tone: doctorTone(doctor), vars: { first: doctor.firstName } }, `${appointment.id}:wrongdoor`).text;
  return `${aside} ${main}`;
}

function farewellLine(sim: Simulation, appointment: Appointment, result: 'paid' | 'free' | 'billed'): string {
  return speak(sim, { section: 'health', purpose: 'farewell', beat: 'desk' }, { result, vars: { pay: formatMoney(appointment.outOfPocket) } }, `${appointment.id}:farewell`).text;
}

export const VISIT_SCENE = defineScene({
  id: 'health.visit',
  version: 1,
  title: 'A Visit',
  placeBound: false,

  available(sim, input) {
    const appointment = sim.universe.appointments[String(input['appointmentId'])];
    if (!appointment) return { ok: false, reason: 'There’s no appointment like that.' };
    if (appointment.checkedInAt && appointment.status === 'scheduled') return { ok: true };
    const can = attendable(sim, appointment);
    return can.ok ? { ok: true } : { ok: false, reason: can.reason };
  },

  start(sim, input) {
    const appointment = appointmentOf(sim, String(input['appointmentId']));
    const doctor = doctorOf(sim, providerOf(sim, appointment));
    return {
      node: appointment.checkedInAt ? (appointment.consultedAt ? 'desk' : 'room') : 'arrive',
      context: { appointmentId: appointment.id, complaint: appointment.complaint ?? '', verdict: '', gain: 0, tests: '', rxId: '', followUpDays: 0, lastNote: '', paid: '', before: Math.round(sim.player.wellbeing.condition) },
      participantIds: [doctor.id],
      refType: 'appointment',
      refId: appointment.id,
    };
  },

  view(sim, session) {
    const appointment = appointmentOf(sim, str(session, 'appointmentId'));
    const provider = providerOf(sim, appointment);
    const doctor = doctorOf(sim, provider);
    const spec = SPECIALTIES.find((s) => s.key === provider.specialty);
    const cost = visitCost(sim, appointment);
    const network = cost.network === 'in' ? `In network with ${cost.carrier}` : cost.network === 'out' ? `${cost.carrier} not accepted` : 'No cover';
    const facts = [
      { label: 'Visit', value: formatMoney(cost.cost) },
      { label: 'Insurance', value: network },
      { label: 'You Pay', value: formatMoney(cost.outOfPocket) },
      { label: 'Condition', value: `${Math.round(sim.player.wellbeing.condition)}` },
    ];
    switch (session.node) {
      case 'arrive': {
        return {
          title: provider.name,
          eyebrow: `${spec?.label ?? 'Visit'} · ${formatDate(appointment.at, sim.homeZone)}`,
          text: deskLine(sim, appointment, cost, false),
          choices: [{ id: 'checkin', label: 'Check In', aliases: ['check in', 'desk', 'in'], tone: 'primary', detail: `${TRAVEL_MINUTES} minutes there, ${WAIT_MINUTES} in the chair.` }],
          facts,
          canSkip: true,
        };
      }
      case 'room': {
        const choices: SceneChoice[] = complaintsFor(sim, appointment).map((c) => ({ id: `say:${c.id}`, label: c.label, aliases: [c.id], detail: c.detail }));
        return {
          title: doctor.displayName,
          eyebrow: `${spec?.label ?? 'The room'} · ${appointment.durationMinutes} minutes`,
          text: str(session, 'lastNote') || askLine(sim, appointment, false),
          choices,
          facts,
          canSkip: true,
        };
      }
      case 'verdict': {
        const rx = str(session, 'rxId') ? (sim.universe.prescriptions ?? {})[str(session, 'rxId')] : undefined;
        const after = [
          { label: 'Condition', value: `${session.context['before']} to ${Math.round(sim.player.wellbeing.condition)}` },
          ...(str(session, 'tests') ? [{ label: 'Tests', value: `Results ${formatDate(appointment.resultsAt ?? sim.now, sim.homeZone)}` }] : []),
          ...(rx ? [{ label: 'Prescription', value: `${rx.medication}, ${rx.days} day${rx.days === 1 ? '' : 's'}` }] : []),
          ...(num(session, 'followUpDays') > 0 ? [{ label: 'Follow Up', value: `In ${num(session, 'followUpDays')} days` }] : []),
        ];
        return {
          title: str(session, 'verdict') === 'fine' ? 'Nothing To Worry About' : str(session, 'verdict') === 'tests' ? 'Tests' : 'Treatment',
          eyebrow: doctor.displayName,
          text: str(session, 'lastNote'),
          choices: [{ id: 'desk', label: 'Back To The Desk', aliases: ['desk', 'pay', 'out'], tone: 'primary' }],
          facts: after,
          canSkip: true,
        };
      }
      case 'desk': {
        const funds = sim.player.primaryAccountId ? sim.ledger.availableFunds(sim.player.primaryAccountId) : 0;
        return {
          title: 'The Desk',
          eyebrow: provider.name,
          text: appointment.outOfPocket > 0 ? `${formatMoney(appointment.outOfPocket)} today. The card did ${formatMoney(appointment.insuranceCovered)} of it.` : 'Nothing to pay. The card did all of it.',
          choices: [
            { id: 'pay', label: appointment.outOfPocket > 0 ? 'Pay Now' : 'Say Thank You', aliases: ['pay', 'now', 'thanks'], tone: 'primary', disabled: appointment.outOfPocket > funds ? `You have ${formatMoney(funds)}.` : undefined },
            ...(appointment.outOfPocket > 0 ? [{ id: 'bill', label: 'Ask For A Bill', aliases: ['bill', 'later', 'send it'], detail: 'It sits as an unpaid bill and asks.' }] : []),
          ],
          facts: [{ label: 'You Have', value: formatMoney(funds) }, ...facts],
          canSkip: true,
        };
      }
      case 'done': {
        const days = num(session, 'followUpDays');
        const choices: SceneChoice[] = [];
        if (days > 0 && appointment.followUpAt) choices.push({ id: 'followup', label: 'Book The Follow Up Now', aliases: ['book', 'follow up', 'followup'], tone: 'primary', detail: `${formatDate(nextOpening(sim, provider) > appointment.followUpAt ? nextOpening(sim, provider) : appointment.followUpAt, sim.homeZone)}, or thereabouts.` });
        choices.push({ id: 'finish', label: 'Back To The Day', aliases: ['done', 'ok', 'finish'], tone: days > 0 ? undefined : 'primary' });
        return {
          title: 'Out',
          eyebrow: provider.name,
          text: str(session, 'lastNote'),
          choices,
          facts: [
            { label: 'Condition', value: `${session.context['before']} to ${Math.round(sim.player.wellbeing.condition)}` },
            { label: 'Paid', value: str(session, 'paid') === 'billed' ? `${formatMoney(appointment.outOfPocket)} owed` : formatMoney(appointment.outOfPocket) },
            ...(str(session, 'rxId') ? [{ label: 'To Collect', value: (sim.universe.prescriptions ?? {})[str(session, 'rxId')]?.medication ?? 'A prescription' }] : []),
          ],
          canSkip: false,
          canLeave: false,
        };
      }
      default:
        throw unknownStep();
    }
  },

  choose(sim, session, choiceId, ctx) {
    const appointment = appointmentOf(sim, str(session, 'appointmentId'));
    const provider = providerOf(sim, appointment);
    switch (session.node) {
      case 'arrive': {
        if (choiceId !== 'checkin') throw unknownStep();
        const { cost } = ctx.commit<{ cost: VisitCost }>('checkin', { kind: 'health.check_in', payload: { appointmentId: appointment.id } });
        ctx.say(deskLine(sim, appointment, cost, true));
        ctx.say(speak(sim, { section: 'health', purpose: 'wait', beat: 'room' }, {}, `${appointment.id}:wait`).text);
        session.context['lastNote'] = '';
        ctx.go('room');
        return;
      }
      case 'room': {
        if (!choiceId.startsWith('say:')) throw unknownStep();
        const complaint = COMPLAINT_BY_ID[choiceId.slice(4)];
        if (!complaint) throw new CommandError('That isn’t something to bring here.');
        const doctor = doctorOf(sim, provider);
        ctx.say(askLine(sim, appointment, true), doctor.id);
        const result = ctx.commit<{ verdict: Verdict; gain: number; tests: boolean; prescriptionId?: string; followUpDays: number }>('consult', { kind: 'health.consult', payload: { appointmentId: appointment.id, complaint: complaint.id } });
        session.context['complaint'] = complaint.id;
        session.context['verdict'] = result.verdict;
        session.context['gain'] = result.gain;
        session.context['tests'] = result.tests ? 'yes' : '';
        session.context['rxId'] = result.prescriptionId ?? '';
        session.context['followUpDays'] = result.followUpDays;
        const line = verdictLine(sim, appointment, result.verdict, complaint.id !== 'checkup' && !complaint.fit.includes(provider.specialty));
        session.context['lastNote'] = line;
        ctx.say(line, doctor.id);
        ctx.go('verdict');
        return;
      }
      case 'verdict': {
        if (choiceId !== 'desk') throw unknownStep();
        ctx.go('desk');
        return;
      }
      case 'desk': {
        if (choiceId !== 'pay' && choiceId !== 'bill') throw unknownStep();
        const { paid } = ctx.commit<{ paid: boolean; owed: number }>('pay', { kind: 'health.pay', payload: { appointmentId: appointment.id, bill: choiceId === 'bill' } });
        session.context['paid'] = paid ? 'paid' : 'billed';
        const line = farewellLine(sim, appointment, paid ? (appointment.outOfPocket > 0 ? 'paid' : 'free') : 'billed');
        session.context['lastNote'] = line;
        ctx.say(line);
        ctx.go('done');
        return;
      }
      case 'done': {
        if (choiceId === 'followup') {
          const at = Math.max(appointment.followUpAt ?? sim.now, nextOpening(sim, provider));
          ctx.commit('followup', { kind: 'health.book', payload: { providerId: provider.id, at, kind: 'Follow Up' } });
          ctx.say(`Follow-up booked for ${formatDate(at, sim.homeZone)}.`);
          ctx.finish();
          return;
        }
        if (choiceId !== 'finish') throw unknownStep();
        ctx.finish();
        return;
      }
      default:
        throw unknownStep();
    }
  },

  summarise(sim, session, ctx) {
    const appointment = appointmentOf(sim, str(session, 'appointmentId'));
    const provider = providerOf(sim, appointment);
    if (!appointment.checkedInAt) {
      const { cost } = ctx.commit<{ cost: VisitCost }>('checkin', { kind: 'health.check_in', payload: { appointmentId: appointment.id } });
      ctx.say(deskLine(sim, appointment, cost, true));
    }
    if (!appointment.consultedAt) {
      const complaint = str(session, 'complaint') ? COMPLAINT_BY_ID[str(session, 'complaint')] : undefined;
      const said = complaint ?? complaintsFor(sim, appointment)[0]!;
      const result = ctx.commit<{ verdict: Verdict; gain: number; tests: boolean; prescriptionId?: string; followUpDays: number }>('consult', { kind: 'health.consult', payload: { appointmentId: appointment.id, complaint: said.id } });
      session.context['verdict'] = result.verdict;
      session.context['rxId'] = result.prescriptionId ?? '';
      session.context['followUpDays'] = result.followUpDays;
      ctx.say(`${said.label}. ${verdictLine(sim, appointment, result.verdict, said.id !== 'checkup' && !said.fit.includes(provider.specialty))}`);
    }
    if (!appointment.paidAt) {
      const { paid } = ctx.commit<{ paid: boolean; owed: number }>('pay', { kind: 'health.pay', payload: { appointmentId: appointment.id } });
      session.context['paid'] = paid ? 'paid' : 'billed';
      ctx.say(farewellLine(sim, appointment, paid ? (appointment.outOfPocket > 0 ? 'paid' : 'free') : 'billed'));
    }
    ctx.finish();
  },
});
