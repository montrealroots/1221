/**
 * A date, played out.
 *
 * Before you go: get ready, take something, get there. Then they are there,
 * or late, or not coming. Then the table: a handful of moves, each answered
 * in their voice, with the evening warming or cooling as it goes. Then the
 * way it ends — the walk, the kiss, the promise — and what it did to the
 * two of you, which is the dating system's to decide and this scene's to
 * ask about in the right order.
 *
 * The short version is the same evening with the safest moves: turn up,
 * ask, listen, tell them something, call it a night.
 */

import type { Simulation } from '../core/simulation';
import { MS_MINUTE, formatDuration, formatTime } from '../core/time';
import { formatMoney, type Money } from '../core/money';
import type { DateRecord, Id, SceneSession } from '../domain/model';
import type { Place } from '../content/places';
import { chemistryWord, type MoveResult } from '../content/dates';
import { MODE_LABEL, driveableVehicle, planJourney, type Mode } from '../systems/places';
import {
  MAX_BEATS, activityOf, closeChoices, dateAttendable, dateOf, moveChoices, partnerOf, placeOfDate, relationshipOf, roundCost, tableCost,
} from '../systems/dating';
import { giftableAssets } from '../systems/relationships';
import { factsOf } from '../systems/memory';
import { ACTIVITIES } from '../systems/life';
import { defineScene, unknownStep, type SceneChoice } from '../systems/scenes';

function str(session: SceneSession, key: string): string {
  const value = session.context[key];
  return value === null || value === undefined ? '' : String(value);
}

function num(session: SceneSession, key: string): number {
  return Number(session.context[key] ?? 0);
}

function dateOfSession(sim: Simulation, session: SceneSession): DateRecord {
  return dateOf(sim, str(session, 'dateId'));
}

function journeyChoices(sim: Simulation, place: Place): SceneChoice[] {
  const modes: Mode[] = ['walk', 'drive', 'taxi', 'transit'];
  const out: SceneChoice[] = [];
  for (const mode of modes) {
    if (mode === 'drive' && !driveableVehicle(sim)) continue;
    const journey = planJourney(sim, place, mode);
    out.push({ id: `go:${mode}`, label: MODE_LABEL[mode], aliases: [mode, `${mode} there`], detail: `${formatDuration(journey.minutes * MS_MINUTE)}${journey.cost > 0 ? ` · ${formatMoney(journey.cost)}` : ''}` });
  }
  return out;
}

function atHome(sim: Simulation): boolean {
  return !sim.player.currentPlaceId;
}

function whatTheyRemember(sim: Simulation, personId: Id): string {
  const facts = factsOf(sim, personId, { aboutId: sim.player.id });
  const promise = facts.find((f) => f.kind === 'promise');
  const stood = facts.find((f) => f.kind === 'event' && /never came/.test(f.text));
  const good = facts.find((f) => f.kind === 'event' && /good evening/.test(f.text));
  if (stood) return ` They haven’t forgotten the time you didn’t come.`;
  if (promise && /Did not/.test(promise.text)) return ` They remember what you said last time, and what you did.`;
  if (good) return ` Last time was good, and they say so.`;
  return '';
}

export const DATE_SCENE = defineScene({
  id: 'rel.date',
  version: 1,
  title: 'A Date',
  placeBound: false,

  available(sim, input) {
    const date = sim.universe.dates[String(input['dateId'])];
    if (!date) return { ok: false, reason: 'There’s no date like that.' };
    const can = dateAttendable(sim, date);
    return can.ok ? { ok: true } : { ok: false, reason: can.reason };
  },

  start(sim, input) {
    const date = dateOf(sim, String(input['dateId']));
    const place = placeOfDate(date);
    const here = !place || sim.player.currentPlaceId === place.id;
    const node = date.status === 'underway' ? 'beat' : here ? 'meet' : 'prepare';
    return {
      node,
      placeId: here ? place?.id : undefined,
      context: { dateId: date.id, placeId: place?.id ?? '', personId: date.personId, giftAssetId: '', lastReply: '', showed: date.showed ?? '' },
      participantIds: [date.personId],
      refType: 'date',
      refId: date.id,
    };
  },

  view(sim, session) {
    const date = dateOfSession(sim, session);
    const other = partnerOf(sim, date);
    const place = placeOfDate(date);
    const activity = activityOf(date);
    switch (session.node) {
      case 'prepare': {
        const choices: SceneChoice[] = [];
        const shower = ACTIVITIES.find((a) => a.id === 'shower');
        if (shower && atHome(sim)) {
          choices.push({ id: 'shower', label: 'Shower And Get Ready', aliases: ['shower', 'get ready', 'wash'], detail: `${shower.minutes} minutes.`, disabled: sim.player.wellbeing.hygiene >= 85 ? 'You’re ready.' : undefined });
        }
        if (giftableAssets(sim, sim.player.id).length > 0) {
          choices.push({ id: 'gift', label: str(session, 'giftAssetId') ? 'Take Something Else' : 'Take Them Something', aliases: ['gift', 'present', 'bring'] });
        }
        if (place) choices.push(...journeyChoices(sim, place));
        else choices.push({ id: 'go:walk', label: 'Head Out', aliases: ['go', 'head out', 'leave'], tone: 'primary' });
        const gift = str(session, 'giftAssetId') ? sim.universe.assets[str(session, 'giftAssetId')] : undefined;
        return {
          title: `${activity.label} With ${other.firstName}`,
          eyebrow: 'Before you go',
          text: `${formatTime(date.at, sim.zone)}${place ? ` at ${place.name}` : ''}.${whatTheyRemember(sim, other.id)}${gift ? ` You have the ${gift.name} to give them.` : ''}`,
          choices,
          facts: [
            { label: 'When', value: formatTime(date.at, sim.zone) },
            { label: 'Where', value: place?.name ?? 'Wherever you meet' },
            { label: 'Sitting Down', value: tableCost(date) > 0 ? `About ${formatMoney(tableCost(date))}` : 'Nothing' },
            { label: 'Energy', value: `${Math.round(sim.player.wellbeing.energy)}` },
          ],
          canSkip: true,
        };
      }
      case 'gift': {
        const choices: SceneChoice[] = giftableAssets(sim, sim.player.id).slice(0, 6).map((a) => ({ id: `gift:${a.id}`, label: a.name, aliases: [a.name.toLowerCase()], detail: `Worth about ${formatMoney(a.currentValue)}` }));
        choices.push({ id: 'nogift', label: 'Nothing, Actually', aliases: ['nothing', 'no', 'back'] });
        return { title: 'What Would You Take?', eyebrow: 'A gift', text: 'Something of yours, given at the table.', choices, canSkip: false };
      }
      case 'meet': {
        return {
          title: place?.name ?? activity.label,
          eyebrow: `${activity.label} with ${other.firstName}`,
          text: `${place ? place.about : activity.opener}${whatTheyRemember(sim, other.id)}`,
          choices: [{ id: 'checkin', label: place ? 'Go In' : 'Meet Them', aliases: ['go in', 'meet', 'enter', 'sit down'], tone: 'primary', detail: tableCost(date) > 0 ? `${formatMoney(tableCost(date))} to sit down` : undefined }],
          facts: [{ label: 'When', value: formatTime(date.at, sim.zone) }, { label: 'Now', value: formatTime(sim.now, sim.zone) }],
          canSkip: true,
        };
      }
      case 'stoodup': {
        return {
          title: 'Not Coming',
          eyebrow: place?.name ?? activity.label,
          text: `${str(session, 'lastReply')} ${other.firstName} sent a message: something came up, and an apology. They owe you one.`,
          choices: [{ id: 'home', label: 'Go Home', aliases: ['home', 'leave', 'done'], tone: 'primary' }],
          canSkip: false,
          canLeave: false,
        };
      }
      case 'beat': {
        const moves = moveChoices(sim, date);
        const choices: SceneChoice[] = date.beats >= MAX_BEATS ? [] : moves.map(({ move, disabled }) => ({
          id: `move:${move.id}`,
          label: move.id === 'ask' && other.interests[0] ? `Ask About ${other.interests[0].charAt(0).toUpperCase()}${other.interests[0].slice(1)}` : move.label,
          aliases: move.aliases,
          detail: move.spends ? `${formatMoney(roundCost(date))} · ${move.cue}` : move.cue,
          disabled,
          tone: move.id === 'phone' ? 'danger' : undefined,
        }));
        choices.push({ id: 'end', label: date.beats >= MAX_BEATS ? 'It Is Getting Late' : 'Start Saying Goodnight', aliases: ['end', 'goodnight', 'leave', 'done'], tone: date.beats >= MAX_BEATS ? 'primary' : undefined });
        return {
          title: `${other.firstName}`,
          eyebrow: place?.name ?? activity.label,
          text: `${str(session, 'lastReply') || activity.opener}`,
          choices,
          facts: [
            { label: 'How It Is Going', value: chemistryWord(date.chemistry) },
            { label: 'Time', value: formatTime(sim.now, sim.zone) },
            { label: 'Spent', value: formatMoney(date.spent) },
            { label: 'Left', value: `${Math.max(0, MAX_BEATS - date.beats)} move${MAX_BEATS - date.beats === 1 ? '' : 's'}` },
          ],
          canSkip: true,
          leaveLabel: 'Leave Early',
        };
      }
      case 'close': {
        const choices: SceneChoice[] = closeChoices(date).map(({ close, disabled }) => ({ id: `close:${close.id}`, label: close.label, aliases: close.aliases, detail: close.detail, disabled }));
        return {
          title: 'The End Of The Evening',
          eyebrow: `${other.firstName} · ${chemistryWord(date.chemistry)}`,
          text: `${str(session, 'lastReply')} Outside, ${other.firstName} looks at you like the evening is a question.`.trim(),
          choices,
          canSkip: true,
          leaveLabel: 'Leave Without A Word',
        };
      }
      case 'reflect': {
        return {
          title: str(session, 'outcome') === 'good' ? 'A Good Night' : str(session, 'outcome') === 'mixed' ? 'A Night Out' : 'Not That Night',
          eyebrow: `${activity.label} with ${other.firstName}`,
          text: str(session, 'summary'),
          choices: [{ id: 'done', label: 'Back To The Day', aliases: ['done', 'ok', 'finish'], tone: 'primary' }],
          facts: [
            { label: 'It Ended', value: chemistryWord(num(session, 'chemistry')) },
            { label: 'Spent', value: formatMoney(num(session, 'spent')) },
            { label: 'Time', value: formatTime(sim.now, sim.zone) },
            { label: 'Between You', value: `Affection ${Math.round(relationshipOf(sim, date).dimensions.affection)}` },
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
    const date = dateOfSession(sim, session);
    const place = placeOfDate(date);
    switch (session.node) {
      case 'prepare': {
        if (choiceId === 'shower') {
          ctx.commit('shower', { kind: 'life.do_activity', payload: { activityId: 'shower', minutes: 25 } });
          ctx.say('Twenty-five minutes, and you feel like somebody who is going out.');
          return;
        }
        if (choiceId === 'gift') { ctx.go('gift'); return; }
        if (choiceId.startsWith('go:')) {
          if (place) {
            ctx.commit('go', { kind: 'go.to', payload: { placeId: place.id, mode: choiceId.slice(3) } });
            session.placeId = place.id;
          }
          ctx.go('meet');
          return;
        }
        throw unknownStep();
      }
      case 'gift': {
        if (choiceId === 'nogift') { session.context['giftAssetId'] = ''; ctx.go('prepare'); return; }
        if (!choiceId.startsWith('gift:')) throw unknownStep();
        session.context['giftAssetId'] = choiceId.slice(5);
        ctx.go('prepare');
        return;
      }
      case 'meet': {
        if (choiceId !== 'checkin') throw unknownStep();
        const result = ctx.commit<{ showed: 'there' | 'late' | 'no_show'; line: string; cost: Money }>('checkin', { kind: 'date.check_in', payload: { dateId: date.id } });
        session.context['showed'] = result.showed;
        session.context['lastReply'] = result.line;
        if (result.showed === 'no_show') { ctx.say(result.line); ctx.go('stoodup'); return; }
        ctx.say(result.line);
        const giftId = str(session, 'giftAssetId');
        if (giftId) {
          const given = ctx.commit<{ given: boolean }>('gift', { kind: 'rel.give_gift', payload: { relationshipId: date.relationshipId, assetId: giftId } });
          if (given.given) ctx.say('You give it to them before the menus come. They’re surprised, and then they aren’t.');
        }
        ctx.go('beat');
        return;
      }
      case 'stoodup': {
        if (choiceId !== 'home') throw unknownStep();
        ctx.finish();
        return;
      }
      case 'beat': {
        if (choiceId === 'end') { ctx.go('close'); return; }
        if (!choiceId.startsWith('move:')) throw unknownStep();
        const move = choiceId.slice(5);
        const result = ctx.commit<{ result: MoveResult; reply: string; chemistry: number; delta: number; beatsLeft: number }>(`beat:${date.beats}:${move}`, { kind: 'date.beat', payload: { dateId: date.id, move } });
        session.context['lastReply'] = result.reply;
        ctx.say(result.reply, date.personId);
        if (result.beatsLeft <= 0) ctx.go('close');
        return;
      }
      case 'close': {
        if (!choiceId.startsWith('close:')) throw unknownStep();
        const move = choiceId.slice(6);
        const closed = ctx.commit<{ reply: string; accepted: boolean }>(`close:${move}`, { kind: 'date.close', payload: { dateId: date.id, move } });
        ctx.say(closed.reply, date.personId);
        const done = ctx.commit<{ outcome: string; chemistry: number; spent: Money; summary: string }>('finish', { kind: 'date.finish', payload: { dateId: date.id } });
        session.context['outcome'] = done.outcome;
        session.context['chemistry'] = done.chemistry;
        session.context['spent'] = done.spent;
        session.context['summary'] = `${closed.reply} ${done.summary}`;
        ctx.go('reflect');
        return;
      }
      case 'reflect': {
        if (choiceId !== 'done') throw unknownStep();
        ctx.finish();
        return;
      }
      default:
        throw unknownStep();
    }
  },

  summarise(sim, session, ctx) {
    const date = dateOfSession(sim, session);
    const place = placeOfDate(date);
    if (session.node === 'prepare' || session.node === 'gift') {
      if (place && sim.player.currentPlaceId !== place.id) {
        ctx.commit('go', { kind: 'go.to', payload: { placeId: place.id, mode: driveableVehicle(sim) ? 'drive' : 'taxi' } });
        session.placeId = place.id;
      }
      session.node = 'meet';
    }
    if (session.node === 'meet') {
      const result = ctx.commit<{ showed: string; line: string }>('checkin', { kind: 'date.check_in', payload: { dateId: date.id } });
      ctx.say(result.line);
      if (result.showed === 'no_show') { ctx.finish(); return; }
      session.node = 'beat';
    }
    if (session.node === 'beat') {
      const safe = ['ask', 'listen', 'share'];
      for (const move of safe) {
        if (dateOf(sim, date.id).beats >= MAX_BEATS) break;
        const can = moveChoices(sim, date).find((c) => c.move.id === move);
        if (!can || can.disabled) continue;
        const result = ctx.commit<{ reply: string }>(`beat:${date.beats}:${move}`, { kind: 'date.beat', payload: { dateId: date.id, move } });
        ctx.say(result.reply, date.personId);
      }
      session.node = 'close';
    }
    if (session.node === 'close') {
      const closed = ctx.commit<{ reply: string }>('close:night', { kind: 'date.close', payload: { dateId: date.id, move: 'night' } });
      ctx.say(closed.reply, date.personId);
      const done = ctx.commit<{ summary: string }>('finish', { kind: 'date.finish', payload: { dateId: date.id } });
      ctx.say(done.summary);
    }
    ctx.finish();
  },
});
