/**
 * SLATE — dating: a date from the asking to the walk home.
 *
 * Asking someone out still lives with relationships; this is everything
 * after they say yes. A date is a record on the calendar. When it comes
 * round it asks — play it, do it, or skip it — and left alone it is a
 * standing-up, which the other person remembers. Played, it is a
 * check-in (they are there, or late, or not coming), a handful of moves
 * across the table that the evening answers in their voice, a way of
 * ending it, and a finish that settles what it did to the two of you: the
 * relationship's numbers, a memory, what they now know you talked about,
 * and anything you promised, which they will notice you keep or not.
 *
 * Money moves at the table and at the bar, at the place's prices. Nothing
 * here changes a relationship except through `date.finish`, so the short
 * version and the long version arrive at the same kind of evening by the
 * same rules.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import { clamp } from '../core/rng';
import { MS_DAY, MS_MINUTE, addDays, formatTime } from '../core/time';
import { formatMoney, type Money } from '../core/money';
import type { DateRecord, Id, Person, Relationship } from '../domain/model';
import { buildFactors } from '../core/audit';
import { placesIn, priceOf, type Place } from '../content/places';
import {
  CLOSE_BY_ID, DATE_ACTIVITY_BY_ID, MOVE_BY_ID, chemistryWord, replyFor, toneOf, type CloseMove, type DateActivity, type DateMove, type MoveResult,
} from '../content/dates';
import { addMemory, applyDelta, isRomantic, otherParty, resolveDate, type DatePlan } from './relationships';
import { rememberFact } from './memory';
import { activeScene } from './scenes';

export const EARLY_MINUTES = 60;
export const LATE_MINUTES = 60;
export const LAPSE_GRACE_MINUTES = 60;
export const MAX_BEATS = 5;
export const BEAT_MINUTES = 25;
export const LATE_BY_MINUTES = 20;
export const FOLLOW_UP_DAYS = 3;
export const SHORT_NOTICE_HOURS = 24;
export const DATES_KEPT = 60;

export const NOT_TIME_YET = 'It is not time yet.';
export const NOT_THERE = 'You are not where the date is.';
export const NO_SUCH_DATE = 'There is no date like that.';

type ScheduledItem = NonNullable<ReturnType<Simulation['timeline']['get']>>;

// ---------------------------------------------------------------------------
// Readers
// ---------------------------------------------------------------------------

export function datesOf(sim: Simulation): DateRecord[] {
  return Object.values(sim.universe.dates).sort((a, b) => b.at - a.at);
}

export function upcomingDates(sim: Simulation): DateRecord[] {
  return datesOf(sim).filter((d) => d.status === 'planned' || d.status === 'underway').sort((a, b) => a.at - b.at);
}

export function pastDates(sim: Simulation): DateRecord[] {
  return datesOf(sim).filter((d) => d.status !== 'planned' && d.status !== 'underway');
}

export function dateOf(sim: Simulation, dateId: Id): DateRecord {
  const date = sim.universe.dates[dateId];
  if (!date) throw new CommandError(NO_SUCH_DATE);
  return date;
}

export function dateForItem(sim: Simulation, itemId: Id): DateRecord | undefined {
  return datesOf(sim).find((d) => d.scheduledItemId === itemId);
}

export function partnerOf(sim: Simulation, date: DateRecord): Person {
  const person = sim.universe.people[date.personId];
  if (!person) throw new CommandError('They are no longer in the world.');
  return person;
}

export function relationshipOf(sim: Simulation, date: DateRecord): Relationship {
  const rel = sim.universe.relationships[date.relationshipId];
  if (!rel) throw new CommandError('That relationship is gone.');
  return rel;
}

export function activityOf(date: DateRecord): DateActivity {
  return DATE_ACTIVITY_BY_ID[date.activityId] ?? DATE_ACTIVITY_BY_ID['dinner']!;
}

export function placeOfDate(date: DateRecord): Place | undefined {
  return date.placeId ? placesIn(date.locationId).find((p) => p.id === date.placeId) : undefined;
}

/** Whether the date can be started now, and if not, why. */
export function dateAttendable(sim: Simulation, date: DateRecord): { ok: boolean; reason?: string } {
  if (date.status === 'underway') return { ok: true };
  if (date.status !== 'planned') return { ok: false, reason: `This date was ${date.status.replace('_', ' ')}.` };
  if (sim.player.currentLocationId !== date.locationId) return { ok: false, reason: NOT_THERE };
  if (sim.now < date.at - EARLY_MINUTES * MS_MINUTE) return { ok: false, reason: `It is planned for ${formatTime(date.at, sim.zone)}.` };
  if (sim.now > date.at + (date.durationMinutes + LAPSE_GRACE_MINUTES) * MS_MINUTE) return { ok: false, reason: 'That time has gone.' };
  return { ok: true };
}

/** What sitting down costs here, at this place's prices. */
export function tableCost(date: DateRecord): Money {
  const activity = activityOf(date);
  if (activity.tier === 0) return 0;
  const place = placeOfDate(date);
  if (!place) return Math.round(activity.tier * 18_00);
  // Two of whatever the evening is: a coffee each is one line on the bill,
  // dinner for two is two.
  return priceOf(place, { price: activity.tier }) * (activity.tier >= 2 ? 2 : 1);
}

/** What another round costs here. */
export function roundCost(date: DateRecord): Money {
  const place = placeOfDate(date);
  if (!place) return 24_00;
  return priceOf(place, { price: 1 }) * (place.kind === 'cafe' ? 1 : 2);
}

/** The moves on the table right now, with the ones that cannot land closed and the reason why. */
export function moveChoices(sim: Simulation, date: DateRecord): { move: DateMove; disabled?: string }[] {
  const place = placeOfDate(date);
  const funds = sim.player.primaryAccountId ? sim.ledger.availableFunds(sim.player.primaryAccountId) : 0;
  return Object.values(MOVE_BY_ID).map((move) => {
    if (move.spends && !(place && ['restaurant', 'bar', 'club', 'cafe', 'hotel'].includes(place.kind))) return { move, disabled: 'Nothing to order here.' };
    if (move.spends && funds < roundCost(date)) return { move, disabled: `A round here is ${formatMoney(roundCost(date))} and you have ${formatMoney(funds)}.` };
    if (move.needs !== undefined && date.chemistry < move.needs) return { move, disabled: 'Not yet. Read the room.' };
    return { move };
  });
}

export function closeChoices(date: DateRecord): { close: CloseMove; disabled?: string }[] {
  return Object.values(CLOSE_BY_ID).map((close) => (
    close.needs !== undefined && date.chemistry < close.needs ? { close, disabled: 'Not tonight.' } : { close }
  ));
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export function registerDating(sim: Simulation): void {
  // The asking makes the record: relationships schedules the item and says so.
  sim.onEvent('rel.date_scheduled', 'dating.record', (event, { sim: s }) => {
    const payload = event.payload as { relationshipId: Id; at: number; scheduledItemId?: Id; personId?: Id; plan?: DatePlan };
    if (!payload.scheduledItemId || !payload.personId || !payload.plan) return;
    const item = s.timeline.get(payload.scheduledItemId);
    if (!item) return;
    makeRecord(s, item, payload.relationshipId, payload.personId, payload.plan);
  });

  // When it comes round: ask, unless it is already being played.
  sim.onSchedule('rel.date', (item) => {
    const date = dateForItem(sim, item.id) ?? recordForLegacy(sim, item);
    if (!date) {
      // A date from before records existed: resolved the old way, in one roll.
      resolveDate(sim, item.payload['relationshipId'] as Id, item.payload['plan'] as DatePlan);
      return;
    }
    if (date.status !== 'planned') return;
    const other = partnerOf(sim, date);
    const place = placeOfDate(date);
    if (sim.player.currentLocationId !== date.locationId) {
      standUp(sim, date, 'You were in another city.');
      return;
    }
    const scene = activeScene(sim);
    if (scene && scene.refType === 'date' && scene.refId === date.id) return;
    sim.requireDecision({
      urgency: 62, category: 'personal',
      title: `Time For Your Date With ${other.displayName}`,
      detail: `${activityOf(date).label}${place ? ` at ${place.name}` : ''}, ${formatTime(date.at, sim.zone)}. Leave it and they will be waiting.`,
      route: '/workspace/relationships',
      actions: [
        { label: 'Play It Out', commandKind: 'date.attend', payload: { dateId: date.id, mode: 'play' } },
        { label: 'Just Do It', commandKind: 'date.attend', payload: { dateId: date.id, mode: 'summary' } },
        { label: 'Skip It', commandKind: 'date.skip', payload: { dateId: date.id } },
      ],
      dueAt: date.at + date.durationMinutes * MS_MINUTE,
      refType: 'date', refId: date.id,
    });
    sim.notify({
      category: 'relationships', title: `Date With ${other.displayName}`,
      body: `${formatTime(date.at, sim.zone)}${place ? ` at ${place.name}` : ''}.`,
      importance: 50, route: '/workspace/relationships', refType: 'date', refId: date.id,
    });
    sim.schedule({
      at: date.at + (date.durationMinutes + LAPSE_GRACE_MINUTES) * MS_MINUTE, kind: 'date.lapse',
      label: `Date With ${other.displayName} Lapses`, category: 'system', payload: { dateId: date.id }, priority: 80,
      refType: 'date', refId: date.id,
    });
  });

  // Left alone, they waited and you did not come.
  sim.onSchedule('date.lapse', (item) => {
    const date = sim.universe.dates[item.payload['dateId'] as Id];
    if (!date || date.status !== 'planned') return;
    const scene = activeScene(sim);
    if (scene && scene.refType === 'date' && scene.refId === date.id) {
      sim.schedule({ at: sim.now + LAPSE_GRACE_MINUTES * MS_MINUTE, kind: 'date.lapse', label: item.label, category: 'system', payload: { dateId: date.id }, priority: 80, refType: 'date', refId: date.id });
      return;
    }
    standUp(sim, date, 'You never came.');
  });

  // Three days on: did you do what you said?
  sim.onSchedule('date.follow_up', (item) => {
    const date = sim.universe.dates[item.payload['dateId'] as Id];
    const promise = String(item.payload['promise'] ?? '');
    if (!date || date.status !== 'attended') return;
    const rel = sim.universe.relationships[date.relationshipId];
    const other = sim.universe.people[date.personId];
    if (!rel || rel.endedAt || !other) return;
    const kept = promise === 'call'
      ? rel.lastInteractionAt > (date.closedAt ?? date.at)
      : upcomingDates(sim).some((d) => d.personId === date.personId && d.id !== date.id);
    if (kept) {
      applyDelta(rel.dimensions, { trust: 3, affection: 2 });
      rememberFact(sim, other.id, { kind: 'event', aboutId: sim.player.id, text: promise === 'call' ? 'Said they would call, and did.' : 'Said they would arrange another evening, and did.', weight: 45, sourceKind: 'date', refType: 'date', refId: date.id });
      return;
    }
    applyDelta(rel.dimensions, { trust: -4, affection: -3, conflict: 3 });
    rememberFact(sim, other.id, { kind: 'event', aboutId: sim.player.id, text: promise === 'call' ? 'Said they would call. Did not.' : 'Said they would arrange another evening. Did not.', weight: 55, sourceKind: 'date', refType: 'date', refId: date.id, expiresAt: sim.now + 180 * MS_DAY });
    addMemory(sim, rel, { kind: 'promise_broken', summary: promise === 'call' ? 'You said you would call, and did not.' : 'You said you would arrange another evening, and did not.', impact: -4, decayDays: 180, refType: 'date', refId: date.id });
    sim.notify({
      category: 'relationships', title: `${other.firstName} Noticed`,
      body: promise === 'call' ? `You said you would call after ${activityOf(date).label.toLowerCase()}. It has been ${FOLLOW_UP_DAYS} days.` : `You said you would arrange another evening. Nothing is on the calendar.`,
      importance: 40, route: '/workspace/relationships', refType: 'date', refId: date.id,
    });
  });

  // --- Before the evening ------------------------------------------------------

  sim.onCommand<{ dateId: Id; mode: 'play' | 'summary' }, { sceneId?: Id }>(
    'date.attend',
    (p, { sim: s }) => {
      const date = dateOf(s, p.dateId);
      const can = dateAttendable(s, date);
      if (!can.ok) throw new CommandError(can.reason ?? NOT_TIME_YET);
      s.resolveDecision('date', date.id);
      const result = s.execute<{ sceneId: Id }>({
        kind: p.mode === 'play' ? 'scene.start' : 'scene.quick',
        payload: { definitionId: 'rel.date', input: { dateId: date.id }, refType: 'date', refId: date.id },
      });
      if (!result.ok) throw new CommandError(result.error ?? 'The evening could not start.');
      return { sceneId: result.value?.sceneId };
    },
  );

  sim.onCommand<{ dateId: Id }, { status: DateRecord['status'] }>(
    'date.skip',
    (p, { sim: s }) => {
      const date = dateOf(s, p.dateId);
      if (date.status !== 'planned') throw new CommandError(`This date was ${date.status.replace('_', ' ')}.`);
      s.resolveDecision('date', date.id);
      if (s.now < date.at - SHORT_NOTICE_HOURS * 60 * MS_MINUTE) {
        cancel(s, date, false);
      } else if (s.now < date.at) {
        cancel(s, date, true);
      } else {
        standUp(s, date, 'You decided not to go.');
      }
      return { status: date.status };
    },
  );

  sim.onCommand<{ dateId: Id }, { status: DateRecord['status']; shortNotice: boolean }>(
    'date.cancel',
    (p, { sim: s }) => {
      const date = dateOf(s, p.dateId);
      if (date.status !== 'planned') throw new CommandError(`This date was ${date.status.replace('_', ' ')}.`);
      const shortNotice = s.now >= date.at - SHORT_NOTICE_HOURS * 60 * MS_MINUTE;
      s.resolveDecision('date', date.id);
      cancel(s, date, shortNotice);
      return { status: date.status, shortNotice };
    },
  );

  sim.onCommand<{ dateId: Id; at: number }, { at: number }>(
    'date.reschedule',
    (p, { sim: s }) => {
      const date = dateOf(s, p.dateId);
      if (date.status !== 'planned') throw new CommandError(`This date was ${date.status.replace('_', ' ')}.`);
      if (!(p.at > s.now)) throw new CommandError('Pick a time that has not gone.');
      const clash = s.timeline.conflicts(p.at, date.durationMinutes, date.scheduledItemId)[0];
      if (clash) throw new CommandError(`That clashes with ${clash.label} at ${formatTime(clash.at, s.zone)}.`);
      const rel = relationshipOf(s, date);
      const shortNotice = s.now >= date.at - SHORT_NOTICE_HOURS * 60 * MS_MINUTE;
      s.timeline.reschedule(date.scheduledItemId, p.at);
      date.at = p.at;
      s.timeline.cancelFor('date', date.id, s.now);
      s.resolveDecision('date', date.id);
      if (shortNotice) applyDelta(rel.dimensions, { affection: -1, conflict: 1 });
      const other = partnerOf(s, date);
      rememberFact(s, other.id, { kind: 'event', aboutId: s.player.id, text: `Moved ${activityOf(date).label.toLowerCase()} to ${formatTime(p.at, s.zone)}${shortNotice ? ', at short notice' : ''}.`, weight: shortNotice ? 30 : 15, sourceKind: 'date', expiresAt: s.now + 60 * MS_DAY });
      return { at: p.at };
    },
  );

  // --- The evening itself --------------------------------------------------------

  sim.onCommand<{ dateId: Id }, { showed: 'there' | 'late' | 'no_show'; line: string; cost: Money }>(
    'date.check_in',
    (p, { sim: s }) => {
      const date = dateOf(s, p.dateId);
      if (date.status === 'underway') return { showed: date.showed ?? 'there', line: 'You are already here.', cost: 0 };
      const can = dateAttendable(s, date);
      if (!can.ok) throw new CommandError(can.reason ?? NOT_TIME_YET);
      if (date.placeId && s.player.currentPlaceId !== date.placeId) throw new CommandError(NOT_THERE);
      const other = partnerOf(s, date);
      const rel = relationshipOf(s, date);
      s.resolveDecision('date', date.id);

      // Whether they come is theirs: how reliable they are, and how they feel.
      const rng = s.rng('show', date.id);
      const noShow = 0.04 + (100 - other.reputation.reliability) / 500 + (rel.dimensions.affection < 30 ? 0.08 : 0) - (rel.dimensions.affection > 70 ? 0.03 : 0);
      const roll = rng.next();
      if (roll < noShow) {
        date.showed = 'no_show';
        date.status = 'they_cancelled';
        date.closedAt = s.now;
        s.timeline.cancelFor('date', date.id, s.now);
        applyDelta(rel.dimensions, { conflict: 3, trust: -2 });
        addMemory(s, rel, { kind: 'stood_up_by_them', summary: `${other.firstName} did not come.`, impact: -3, decayDays: 120, refType: 'date', refId: date.id });
        rememberFact(s, other.id, { kind: 'promise', aboutId: s.player.id, text: `Owes ${s.player.firstName} an evening, after not turning up.`, weight: 50, sourceKind: 'date', refType: 'date', refId: date.id, expiresAt: s.now + 60 * MS_DAY });
        s.advanceTo(s.now + 30 * MS_MINUTE);
        s.notify({
          category: 'relationships', title: `${other.firstName} Is Not Coming`,
          body: `A message, twenty minutes after you sat down: "I am so sorry. Something came up. Let me make it up to you."`,
          importance: 45, route: '/workspace/relationships', refType: 'date', refId: date.id,
        });
        s.emit('date.they_cancelled', { dateId: date.id, personId: other.id });
        return { showed: 'no_show', line: 'Half an hour. Then the message.', cost: 0 };
      }
      const late = roll < noShow + 0.2;
      date.status = 'underway';
      date.showed = late ? 'late' : 'there';
      if (late) {
        s.advanceTo(s.now + LATE_BY_MINUTES * MS_MINUTE);
        date.chemistry = clamp(date.chemistry - 3, 0, 100);
      }
      const cost = tableCost(date);
      const accountId = s.player.primaryAccountId;
      if (cost > 0 && accountId) {
        if (s.ledger.availableFunds(accountId) < cost) throw new CommandError(`Sitting down here is ${formatMoney(cost)} and you have ${formatMoney(s.ledger.availableFunds(accountId))}.`);
        s.expense(accountId, cost, `${activityOf(date).label} — ${other.displayName}`, 'personal', { refType: 'date', refId: date.id });
        date.spent += cost;
      }
      s.emit('date.started', { dateId: date.id, personId: other.id, late });
      return {
        showed: date.showed,
        line: late
          ? `${other.firstName} is ${LATE_BY_MINUTES} minutes late and apologises twice. ${activityOf(date).opener}`
          : `${other.firstName} is there first. ${activityOf(date).opener}`,
        cost,
      };
    },
  );

  sim.onCommand<{ dateId: Id; move: string }, { result: MoveResult; reply: string; chemistry: number; delta: number; spent: Money; beatsLeft: number }>(
    'date.beat',
    (p, { sim: s }) => {
      const date = dateOf(s, p.dateId);
      if (date.status !== 'underway') throw new CommandError('The evening is not under way.');
      if (date.beats >= MAX_BEATS) throw new CommandError('The evening is drawing to its end. Decide how it ends.');
      const choice = moveChoices(s, date).find((c) => c.move.id === p.move);
      if (!choice) throw new CommandError('That is not a move you can make.');
      if (choice.disabled) throw new CommandError(choice.disabled);
      const move = choice.move;
      const other = partnerOf(s, date);
      const rel = relationshipOf(s, date);
      const rng = s.rng('beat', date.id, date.beats);

      let spent = 0;
      if (move.spends) {
        const cost = roundCost(date);
        const accountId = s.player.primaryAccountId!;
        s.expense(accountId, cost, `Another round — ${other.displayName}`, 'personal', { refType: 'date', refId: date.id });
        date.spent += cost;
        spent = cost;
      }

      // What it is worth: the move, how the two of you fit, how the evening is
      // going, and the part nobody controls.
      const fit = (rel.dimensions.compatibility - 50) / 10;
      const momentum = (date.chemistry - 50) / 12;
      const interest = move.id === 'ask' && other.interests.length > 0 ? 2 : 0;
      const industry = move.id === 'work' ? (other.careerTrack !== 'civilian' && other.careerTrack !== 'none' ? 5 : -3) : 0;
      const value = move.base + fit + momentum + interest + industry + rng.float(-move.variance, move.variance);
      const result: MoveResult = value >= move.base * 0.6 && value > 0 ? 'good' : value > -2 ? 'flat' : 'bad';
      const delta = Math.round(result === 'good' ? Math.max(3, value) : result === 'flat' ? Math.max(0, value * 0.4) : Math.min(-3, value));
      date.chemistry = clamp(date.chemistry + delta, 0, 100);
      date.beats += 1;
      if (move.topic) {
        const topic = move.id === 'ask' && other.interests[0] ? other.interests[0] : move.topic;
        if (!date.topics.includes(topic)) date.topics.push(topic);
      }
      s.advanceTo(s.now + BEAT_MINUTES * MS_MINUTE);
      const reply = replyFor(move.id, result, toneOf(other), rng);
      s.emit('date.beat', { dateId: date.id, move: move.id, result, chemistry: date.chemistry });
      return { result, reply, chemistry: date.chemistry, delta, spent, beatsLeft: MAX_BEATS - date.beats };
    },
  );

  sim.onCommand<{ dateId: Id; move: string }, { reply: string; accepted: boolean }>(
    'date.close',
    (p, { sim: s }) => {
      const date = dateOf(s, p.dateId);
      if (date.status !== 'underway') throw new CommandError('The evening is not under way.');
      const choice = closeChoices(date).find((c) => c.close.id === p.move);
      if (!choice) throw new CommandError('That is not a way to end the evening.');
      if (choice.disabled) throw new CommandError(choice.disabled);
      const close = choice.close;
      const other = partnerOf(s, date);
      const rel = relationshipOf(s, date);
      const rng = s.rng('close', date.id);
      let reply = '';
      let accepted = true;
      switch (close.id) {
        case 'walk':
          s.advanceTo(s.now + 20 * MS_MINUTE);
          date.chemistry = clamp(date.chemistry + 4, 0, 100);
          reply = rng.pick([`${other.firstName} walks slower than they need to.`, 'Twenty minutes of streets and neither of you hurries.', `At the door ${other.firstName} says thank you like they mean it.`]);
          break;
        case 'kiss': {
          const yes = date.chemistry >= 75 || (isRomantic(rel.type) && date.chemistry >= 60) || rng.chance((date.chemistry - 55) / 40);
          accepted = yes;
          date.chemistry = clamp(date.chemistry + (yes ? 8 : -6), 0, 100);
          reply = yes ? rng.pick(['They kiss you back.', 'Yes. That answers that.']) : rng.pick(['They turn their cheek, kindly. "Not tonight."', 'A hand on your chest. "Not yet."']);
          break;
        }
        case 'call':
        case 'again':
          date.promises.push(close.promise ?? close.id);
          reply = close.id === 'call'
            ? rng.pick([`"Do." ${other.firstName} means it.`, '"You had better."'])
            : rng.pick([`"I would like that." ${other.firstName} lets you arrange it.`, '"Yes. You pick the place."']);
          date.chemistry = clamp(date.chemistry + 2, 0, 100);
          break;
        case 'night':
          reply = rng.pick(['You thank them. They thank you. A cab each.', `${other.firstName} says goodnight at the kerb.`]);
          break;
        default:
          throw new CommandError('That is not a way to end the evening.');
      }
      s.emit('date.closed', { dateId: date.id, move: close.id, accepted });
      return { reply, accepted };
    },
  );

  sim.onCommand<{ dateId: Id; cutShort?: boolean }, { outcome: 'good' | 'mixed' | 'poor'; chemistry: number; spent: Money; summary: string }>(
    'date.finish',
    (p, { sim: s }) => {
      const date = dateOf(s, p.dateId);
      if (date.status !== 'underway') throw new CommandError('The evening is not under way.');
      return finishDate(s, date, p.cutShort ?? false);
    },
  );

  // Leaving a date half way through ends it as what it was.
  sim.onEvent('scene.abandoned', 'dating.abandoned', (event, { sim: s }) => {
    const payload = event.payload as { sceneId?: Id; refType?: string; refId?: Id };
    const session = payload.sceneId ? s.universe.scenes.sessions[payload.sceneId] : undefined;
    const refType = payload.refType ?? session?.refType;
    const refId = payload.refId ?? session?.refId;
    if (refType !== 'date' || !refId) return;
    const date = s.universe.dates[refId];
    if (date && date.status === 'underway') finishDate(s, date, true);
  });
}

// ---------------------------------------------------------------------------
// What an evening does
// ---------------------------------------------------------------------------

function makeRecord(sim: Simulation, item: ScheduledItem, relationshipId: Id, personId: Id, plan: DatePlan): DateRecord {
  const date: DateRecord = {
    id: sim.nextId('date'),
    saveId: sim.universe.meta.id,
    relationshipId,
    personId,
    scheduledItemId: item.id,
    at: item.at,
    durationMinutes: item.durationMinutes ?? activityMinutes(plan.activityId),
    activityId: plan.activityId,
    placeId: plan.placeId,
    locationId: plan.locationId,
    budget: plan.budget,
    status: 'planned',
    chemistry: 50,
    beats: 0,
    spent: 0,
    topics: [],
    promises: [],
  };
  sim.universe.dates[date.id] = date;
  item.refType = 'date';
  item.refId = date.id;
  pruneDates(sim);
  return date;
}

function activityMinutes(activityId: string): number {
  return DATE_ACTIVITY_BY_ID[activityId]?.minutes ?? 150;
}

/** A date scheduled before records existed gets one when it comes round, if its people are still here. */
function recordForLegacy(sim: Simulation, item: ScheduledItem): DateRecord | undefined {
  const relationshipId = item.payload['relationshipId'] as Id | undefined;
  const plan = item.payload['plan'] as DatePlan | undefined;
  const rel = relationshipId ? sim.universe.relationships[relationshipId] : undefined;
  if (!rel || !plan || rel.endedAt) return undefined;
  return makeRecord(sim, item, rel.id, otherParty(rel, sim.player.id), plan);
}

function cancel(sim: Simulation, date: DateRecord, shortNotice: boolean): void {
  const rel = relationshipOf(sim, date);
  const other = partnerOf(sim, date);
  date.status = 'cancelled';
  date.closedAt = sim.now;
  sim.timeline.cancel(date.scheduledItemId, sim.now);
  sim.timeline.cancelFor('date', date.id, sim.now);
  applyDelta(rel.dimensions, shortNotice ? { affection: -4, conflict: 3, trust: -1 } : { affection: -1 });
  addMemory(sim, rel, { kind: 'date_cancelled', summary: shortNotice ? 'You cancelled on the day.' : 'You cancelled, with notice.', impact: shortNotice ? -4 : -1, decayDays: shortNotice ? 120 : 30, refType: 'date', refId: date.id });
  rememberFact(sim, other.id, { kind: 'event', aboutId: sim.player.id, text: shortNotice ? `Cancelled ${activityOf(date).label.toLowerCase()} on the day.` : `Cancelled ${activityOf(date).label.toLowerCase()}, with notice.`, weight: shortNotice ? 40 : 15, sourceKind: 'date', refType: 'date', refId: date.id, expiresAt: sim.now + 90 * MS_DAY });
  sim.emit('date.cancelled', { dateId: date.id, personId: other.id, shortNotice });
}

function standUp(sim: Simulation, date: DateRecord, why: string): void {
  const rel = relationshipOf(sim, date);
  const other = partnerOf(sim, date);
  date.status = 'stood_up';
  date.closedAt = sim.now;
  sim.timeline.cancelFor('date', date.id, sim.now);
  sim.resolveDecision('date', date.id);
  applyDelta(rel.dimensions, { affection: -9, trust: -5, conflict: 9 });
  rel.lastInteractionAt = sim.now;
  addMemory(sim, rel, { kind: 'stood_up', summary: `You did not turn up. ${why}`, impact: -9, decayDays: 365, refType: 'date', refId: date.id });
  rememberFact(sim, other.id, { kind: 'event', aboutId: sim.player.id, text: `Waited at ${placeOfDate(date)?.name ?? 'the place'} and ${sim.player.firstName} never came.`, weight: 70, sourceKind: 'date', refType: 'date', refId: date.id, expiresAt: sim.now + 365 * MS_DAY });
  sim.notify({
    category: 'relationships', title: `You Stood ${other.firstName} Up`,
    body: `${why} They waited. They will remember.`,
    importance: 55, route: '/workspace/relationships', refType: 'date', refId: date.id,
  });
  sim.remember({
    category: 'relationship', title: `Stood ${other.displayName} up`, detail: why,
    refs: [{ type: 'person', id: other.id }, { type: 'relationship', id: rel.id }], significance: 30, public: false,
  });
  sim.emit('date.stood_up', { dateId: date.id, personId: other.id });
}

function finishDate(sim: Simulation, date: DateRecord, cutShort: boolean): { outcome: 'good' | 'mixed' | 'poor'; chemistry: number; spent: Money; summary: string } {
  const rel = relationshipOf(sim, date);
  const other = partnerOf(sim, date);
  const player = sim.player;
  if (cutShort) date.chemistry = clamp(date.chemistry - 10, 0, 100);
  const chemistry = date.chemistry;
  const outcome: 'good' | 'mixed' | 'poor' = chemistry >= 65 ? 'good' : chemistry >= 40 ? 'mixed' : 'poor';

  applyDelta(rel.dimensions, outcome === 'good'
    ? { familiarity: 9, affection: 11, trust: 5, commitment: 4, conflict: -4 }
    : outcome === 'mixed'
      ? { familiarity: 6, affection: 3, trust: 1 }
      : { familiarity: 4, affection: -3, trust: -1, conflict: 5 });
  rel.lastInteractionAt = sim.now;
  date.status = 'attended';
  date.outcome = outcome;
  date.closedAt = sim.now;
  sim.timeline.cancelFor('date', date.id, sim.now);
  sim.resolveDecision('date', date.id);

  const place = placeOfDate(date);
  const summary = outcome === 'good'
    ? `A good evening${place ? ` at ${place.name}` : ''}.${date.spent > 0 ? ` You spent ${formatMoney(date.spent)}.` : ''}${cutShort ? ' You left before the end.' : ''}`
    : outcome === 'mixed'
      ? `An evening that was fine${place ? ` at ${place.name}` : ''}, and no more than fine.${cutShort ? ' You left early.' : ''}`
      : `The evening did not land.${cutShort ? ' You left early, which did not help.' : ''}`;
  addMemory(sim, rel, { kind: 'date', summary, impact: outcome === 'good' ? 11 : outcome === 'mixed' ? 3 : -3, decayDays: outcome === 'good' ? 400 : 200, refType: 'date', refId: date.id });

  // What they now know, and what they will hold you to.
  for (const topic of date.topics) {
    rememberFact(sim, other.id, { kind: 'topic', aboutId: player.id, text: `Talked about ${topic}${place ? ` at ${place.name}` : ''}.`, weight: 25, sourceKind: 'date', refType: 'date', refId: date.id, expiresAt: sim.now + 120 * MS_DAY });
  }
  rememberFact(sim, other.id, {
    kind: 'event', aboutId: player.id,
    text: outcome === 'good' ? `A good evening with ${player.firstName}${place ? ` at ${place.name}` : ''}.` : outcome === 'mixed' ? `An evening with ${player.firstName} that was fine.` : `An evening with ${player.firstName} that did not go well.`,
    weight: outcome === 'good' ? 50 : 35, sourceKind: 'date', refType: 'date', refId: date.id, expiresAt: sim.now + 365 * MS_DAY,
  });
  if (place && outcome === 'good') rememberFact(sim, other.id, { kind: 'preference', aboutId: player.id, text: `Likes ${place.name}.`, weight: 25, sourceKind: 'date' });
  for (const promise of date.promises) {
    rememberFact(sim, other.id, { kind: 'promise', aboutId: player.id, text: promise === 'call' ? `${player.firstName} said they would call.` : `${player.firstName} said they would arrange another evening.`, weight: 45, sourceKind: 'date', refType: 'date', refId: date.id, expiresAt: sim.now + 30 * MS_DAY });
    sim.schedule({
      at: addDays(sim.now, FOLLOW_UP_DAYS, sim.homeZone), kind: 'date.follow_up',
      label: promise === 'call' ? `Did You Call ${other.firstName}?` : `Did You Arrange Another Evening With ${other.firstName}?`, category: 'system',
      payload: { dateId: date.id, promise }, priority: 85, refType: 'date', refId: date.id,
    });
  }

  player.wellbeing.morale = clamp(player.wellbeing.morale + (outcome === 'good' ? 10 : outcome === 'mixed' ? 2 : -6), 0, 100);
  player.wellbeing.stress = clamp(player.wellbeing.stress + (outcome === 'good' ? -8 : outcome === 'mixed' ? -2 : 5), 0, 100);

  const { factors, score } = buildFactors([
    { label: 'How The Two Of You Get On', detail: `Compatibility is ${Math.round(rel.dimensions.compatibility)} out of 100.`, weight: 0.3, value: rel.dimensions.compatibility / 100 },
    { label: 'The Evening Itself', detail: `${date.beats} moves across the table. It ended ${chemistryWord(chemistry).toLowerCase()}.`, weight: 0.5, value: chemistry / 100 },
    { label: 'Whether They Came On Time', detail: date.showed === 'late' ? 'They were late.' : 'They were there.', weight: 0.2, value: date.showed === 'late' ? 0.5 : 1 },
  ]);
  sim.audit({
    kind: 'rel.date_resolved', subjectType: 'relationship', subjectId: rel.id,
    question: 'How did that date go, and why?',
    summary: `${chemistryWord(chemistry)}. ${summary}`,
    factors, seed: `date|${date.id}`, roll: chemistry / 100, probability: clamp(score, 0, 1), score,
    outcome,
  });
  sim.notify({
    category: 'relationships', title: `${activityOf(date).label} With ${other.displayName}`,
    body: summary, importance: 45, route: '/workspace/relationships', refType: 'date', refId: date.id,
  });
  sim.remember({
    category: 'relationship', title: `${activityOf(date).label} with ${other.displayName}`, detail: summary,
    refs: [{ type: 'person', id: other.id }, { type: 'relationship', id: rel.id }], significance: outcome === 'good' ? 35 : 20, public: false, amount: date.spent || undefined,
  });
  sim.emit('rel.date_resolved', { relationshipId: rel.id, wentWell: outcome === 'good', spent: date.spent, dateId: date.id, outcome });
  return { outcome, chemistry, spent: date.spent, summary };
}

function pruneDates(sim: Simulation): void {
  const closed = pastDates(sim);
  for (const stale of closed.slice(DATES_KEPT)) delete sim.universe.dates[stale.id];
}

export { chemistryWord };
