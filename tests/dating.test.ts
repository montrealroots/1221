/**
 * Dating: a date from the asking to the walk home.
 *
 * Asking with a place makes a record on the calendar. When it comes round
 * it asks; left alone it is a standing-up the other person remembers.
 * Played, it is a check-in, moves across the table answered in their own
 * voice, an ending, and a finish that is the only thing that changes the
 * relationship — so the short version and the long one arrive by the same
 * rules. Money moves at the place's prices and the ledger stays balanced.
 * Promises made at the door are noticed three days later.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { loadAllSections } from '@/engine/dialogue';
import { loadSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, MS_MINUTE } from '@/engine/core/time';
import type { DateRecord, Person } from '@/engine/domain/model';
import { placesIn } from '@/engine/content/places';
import { DATE_ACTIVITY_BY_ID, MOVES } from '@/engine/content/dates';
import {
  BEAT_MINUTES, FOLLOW_UP_DAYS, LAPSE_GRACE_MINUTES, MAX_BEATS, dateAttendable, dateForItem, datesOf, moveChoices, roundCost, tableCost, upcomingDates,
} from '@/engine/systems/dating';
import { findRelationship } from '@/engine/systems/relationships';
import { factsOf } from '@/engine/systems/memory';
import { activeScene, sceneView } from '@/engine/systems/scenes';

function must<R>(sim: Simulation, kind: string, payload: Record<string, unknown> = {}, idempotencyKey?: string): R {
  const result = sim.execute<R>({ kind, payload, idempotencyKey });
  if (!result.ok) throw new Error(`${kind} refused: ${result.error}`);
  return result.value as R;
}

function attempt<R>(sim: Simulation, kind: string, payload: Record<string, unknown> = {}) {
  return sim.execute<R>({ kind, payload });
}

/** Somebody in the same city, met, known well enough to say yes. */
function someone(sim: Simulation): Person {
  const player = sim.player;
  const other = Object.values(sim.universe.people).find((p) => !p.isPlayer && p.tier !== 'background') ?? Object.values(sim.universe.people).find((p) => !p.isPlayer);
  if (!other) throw new Error('Nobody in the world');
  other.currentLocationId = player.currentLocationId;
  must(sim, 'rel.meet', { personId: other.id });
  const rel = findRelationship(sim, player.id, other.id)!;
  rel.dimensions.familiarity = 70;
  rel.dimensions.affection = 75;
  rel.dimensions.compatibility = 80;
  rel.dimensions.trust = 60;
  other.reputation.reliability = 100;
  return other;
}

function aLife(seed = 'dating'): Simulation {
  const sim = quickSave({}, seed);
  sim.income(sim.player.primaryAccountId!, 20_000_00, 'Test funding', 'other');
  sim.execute({ kind: 'co.set_draw', payload: { amount: 0 } });
  return sim;
}

/** Ask until they say yes (the roll is theirs), for dinner at the first restaurant, at seven tomorrow-ish. */
function arrange(sim: Simulation, other: Person, activityId = 'dinner', hoursAhead = 26): { date: DateRecord; place: string | undefined } {
  const activity = DATE_ACTIVITY_BY_ID[activityId]!;
  const place = placesIn(sim.player.currentLocationId).find((p) => activity.placeKinds.includes(p.kind));
  for (let i = 0; i < 40; i++) {
    const at = sim.now + (hoursAhead + i) * MS_HOUR;
    const result = must<{ scheduledItemId: string; accepted: boolean }>(sim, 'rel.ask_out', { personId: other.id, activityId, at, placeId: place?.id, budget: 120_00 });
    if (result.accepted) {
      const date = dateForItem(sim, result.scheduledItemId)!;
      return { date, place: place?.id };
    }
  }
  throw new Error('They never said yes');
}

function beginning(sim: Simulation, date: DateRecord): void {
  sim.advanceTo(date.at);
  if (date.placeId) must(sim, 'go.to', { placeId: date.placeId, mode: 'taxi' });
}

beforeAll(async () => { await loadAllSections(); });

describe('arranging', () => {
  it('asking with a place makes a record that the calendar item points at', () => {
    const sim = aLife();
    const other = someone(sim);
    const { date, place } = arrange(sim, other);
    expect(date.status).toBe('planned');
    expect(date.placeId).toBe(place);
    expect(date.personId).toBe(other.id);
    expect(date.durationMinutes).toBe(DATE_ACTIVITY_BY_ID['dinner']!.minutes);
    const item = sim.timeline.get(date.scheduledItemId)!;
    expect(item.refType).toBe('date');
    expect(item.refId).toBe(date.id);
    expect(upcomingDates(sim).map((d) => d.id)).toEqual([date.id]);
    expect(dateAttendable(sim, date).ok).toBe(false);
    expect(dateAttendable(sim, date).reason).toMatch(/planned for/);
  });

  it('refuses a place that is not for that kind of evening, and a time that has gone', () => {
    const sim = aLife();
    const other = someone(sim);
    const gym = placesIn(sim.player.currentLocationId).find((p) => p.kind === 'gym')!;
    expect(attempt(sim, 'rel.ask_out', { personId: other.id, activityId: 'dinner', at: sim.now + MS_DAY, placeId: gym.id }).error).toMatch(/not somewhere for dinner/);
    expect(attempt(sim, 'rel.ask_out', { personId: other.id, activityId: 'dinner', at: sim.now - 1 }).error).toMatch(/has not gone/);
    expect(attempt(sim, 'rel.ask_out', { personId: other.id, activityId: 'skydiving', at: sim.now + MS_DAY }).error).toMatch(/not a way/);
  });

  it('can be moved, and canceling on the day costs more than canceling with notice', () => {
    const sim = aLife();
    const other = someone(sim);
    const a = arrange(sim, other, 'coffee', 30).date;
    const later = a.at + 3 * MS_HOUR;
    must(sim, 'date.reschedule', { dateId: a.id, at: later });
    expect(a.at).toBe(later);
    expect(sim.timeline.get(a.scheduledItemId)!.at).toBe(later);
    const rel = findRelationship(sim, sim.player.id, other.id)!;
    const before = rel.dimensions.affection;
    must(sim, 'date.cancel', { dateId: a.id });
    expect(a.status).toBe('cancelled');
    expect(sim.timeline.get(a.scheduledItemId)!.status).toBe('cancelled');
    expect(rel.dimensions.affection).toBe(before - 1);

    const b = arrange(sim, other, 'coffee', 30).date;
    sim.advanceTo(b.at - 2 * MS_HOUR);
    const mid = rel.dimensions.affection;
    const { shortNotice } = must<{ shortNotice: boolean }>(sim, 'date.cancel', { dateId: b.id });
    expect(shortNotice).toBe(true);
    expect(rel.dimensions.affection).toBe(mid - 4);
    expect(factsOf(sim, other.id, { kind: 'event', aboutId: sim.player.id }).some((f) => /on the day/.test(f.text))).toBe(true);
  });
});

describe('when it comes round', () => {
  it('asks, with actions the engine handles, and left alone is a standing-up they remember', () => {
    const sim = aLife();
    const other = someone(sim);
    const { date } = arrange(sim, other);
    const rel = findRelationship(sim, sim.player.id, other.id)!;
    const affection = rel.dimensions.affection;
    sim.advanceTo(date.at);
    const decision = Object.values(sim.universe.decisions).find((d) => d.refType === 'date' && d.refId === date.id && !d.resolvedAt);
    expect(decision).toBeDefined();
    expect(decision!.actions.map((a) => a.label)).toEqual(['Play It Out', 'Just Do It', 'Skip It']);
    const commands = new Set(sim.commandKinds());
    for (const action of decision!.actions) expect(commands.has(action.commandKind), action.commandKind).toBe(true);
    sim.advanceTo(date.at + (date.durationMinutes + LAPSE_GRACE_MINUTES + 1) * MS_MINUTE);
    expect(date.status).toBe('stood_up');
    expect(rel.dimensions.affection).toBeLessThan(affection);
    expect(rel.memories.some((m) => m.kind === 'stood_up')).toBe(true);
    expect(factsOf(sim, other.id, { kind: 'event', aboutId: sim.player.id }).some((f) => /never came/.test(f.text))).toBe(true);
    expect(sim.universe.notifications.some((n) => /Stood/.test(n.title))).toBe(true);
    expect(Object.values(sim.universe.decisions).find((d) => d.refId === date.id)!.resolvedAt).toBeDefined();
  });

  it('is a standing-up straight away if you are in another city', () => {
    const sim = aLife();
    const other = someone(sim);
    const { date } = arrange(sim, other);
    sim.player.currentLocationId = 'uk-eng-london';
    sim.advanceTo(date.at);
    expect(date.status).toBe('stood_up');
  });

  it('will not start long before its time, and starts inside an hour of it', () => {
    const sim = aLife();
    const other = someone(sim);
    const { date } = arrange(sim, other);
    expect(attempt(sim, 'date.attend', { dateId: date.id, mode: 'play' }).error).toMatch(/planned for/);
    sim.advanceTo(date.at - 30 * MS_MINUTE);
    expect(dateAttendable(sim, date).ok).toBe(true);
  });
});

describe('the evening', () => {
  it('checks in at the place, pays for the table, and moves across it change the evening and the clock', () => {
    const sim = aLife();
    const other = someone(sim);
    const { date } = arrange(sim, other);
    beginning(sim, date);
    const account = sim.player.primaryAccountId!;
    const before = sim.ledger.availableFunds(account);
    const table = tableCost(date);
    expect(table).toBeGreaterThan(0);
    const checked = must<{ showed: string; cost: number }>(sim, 'date.check_in', { dateId: date.id });
    if (checked.showed === 'no_show') {
      expect(date.status).toBe('they_cancelled');
      expect(factsOf(sim, other.id, { kind: 'promise', aboutId: sim.player.id })[0]?.text).toMatch(/Owes/);
      return;
    }
    expect(date.status).toBe('underway');
    expect(checked.cost).toBe(table);
    expect(before - sim.ledger.availableFunds(account)).toBe(table);

    const now = sim.now;
    const chemistry = date.chemistry;
    const beat = must<{ result: string; reply: string; chemistry: number; delta: number; beatsLeft: number }>(sim, 'date.beat', { dateId: date.id, move: 'ask' });
    expect(['good', 'flat', 'bad']).toContain(beat.result);
    expect(beat.reply.length).toBeGreaterThan(10);
    expect(sim.now - now).toBe(BEAT_MINUTES * MS_MINUTE);
    expect(date.chemistry - chemistry).toBe(beat.delta);
    expect(date.topics.length).toBe(1);
    expect(beat.beatsLeft).toBe(MAX_BEATS - 1);

    // A round costs what the place charges.
    const round = roundCost(date);
    const funds = sim.ledger.availableFunds(account);
    must(sim, 'date.beat', { dateId: date.id, move: 'order' });
    expect(funds - sim.ledger.availableFunds(account)).toBe(round);
    expect(date.spent).toBe(table + round);

    // Nothing lands twice: the same key is one move.
    const key = { kind: 'date.beat', payload: { dateId: date.id, move: 'listen' }, idempotencyKey: 'beat:x' };
    expect(sim.execute(key).ok).toBe(true);
    expect(sim.execute(key).replayed).toBe(true);
    expect(date.beats).toBe(3);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('closes what the evening has not earned, and runs out of moves', () => {
    const sim = aLife();
    const other = someone(sim);
    const { date } = arrange(sim, other);
    beginning(sim, date);
    const checked = must<{ showed: string }>(sim, 'date.check_in', { dateId: date.id });
    if (checked.showed === 'no_show') return;
    date.chemistry = 20;
    const choices = moveChoices(sim, date);
    expect(choices.find((c) => c.move.id === 'flirt')!.disabled).toMatch(/Not yet/);
    expect(choices.find((c) => c.move.id === 'deep')!.disabled).toMatch(/Not yet/);
    expect(attempt(sim, 'date.beat', { dateId: date.id, move: 'flirt' }).error).toMatch(/Not yet/);
    expect(attempt(sim, 'date.beat', { dateId: date.id, move: 'skydive' }).error).toMatch(/not a move/);
    for (let i = date.beats; i < MAX_BEATS; i++) must(sim, 'date.beat', { dateId: date.id, move: 'listen' });
    expect(attempt(sim, 'date.beat', { dateId: date.id, move: 'listen' }).error).toMatch(/drawing to its end/);
    date.chemistry = 10;
    expect(attempt(sim, 'date.close', { dateId: date.id, move: 'kiss' }).error).toMatch(/Not tonight/);
    expect(MOVES.length).toBeGreaterThan(6);
  });

  it('finishing is what changes the relationship, and a promise at the door is noticed three days later', () => {
    const sim = aLife();
    const other = someone(sim);
    const { date } = arrange(sim, other);
    const rel = findRelationship(sim, sim.player.id, other.id)!;
    beginning(sim, date);
    const checked = must<{ showed: string }>(sim, 'date.check_in', { dateId: date.id });
    if (checked.showed === 'no_show') return;
    const familiarity = rel.dimensions.familiarity;
    must(sim, 'date.beat', { dateId: date.id, move: 'ask' });
    must(sim, 'date.beat', { dateId: date.id, move: 'share' });
    expect(rel.dimensions.familiarity).toBe(familiarity);
    must(sim, 'date.close', { dateId: date.id, move: 'call' });
    expect(date.promises).toEqual(['call']);
    const done = must<{ outcome: string; summary: string }>(sim, 'date.finish', { dateId: date.id });
    expect(['good', 'mixed', 'poor']).toContain(done.outcome);
    expect(date.status).toBe('attended');
    expect(rel.dimensions.familiarity).toBeGreaterThan(familiarity);
    expect(rel.memories.some((m) => m.kind === 'date')).toBe(true);
    expect(factsOf(sim, other.id, { kind: 'topic', aboutId: sim.player.id }).length).toBeGreaterThanOrEqual(1);
    expect(factsOf(sim, other.id, { kind: 'promise', aboutId: sim.player.id })[0]?.text).toMatch(/would call/);
    expect(sim.universe.scheduled.some((i) => i.kind === 'date.follow_up' && i.status === 'pending' && i.refId === date.id)).toBe(true);
    expect(attempt(sim, 'date.finish', { dateId: date.id }).ok).toBe(false);

    // You did not call.
    const trust = rel.dimensions.trust;
    sim.advanceTo(sim.now + (FOLLOW_UP_DAYS + 1) * MS_DAY);
    expect(rel.dimensions.trust).toBe(trust - 4);
    expect(sim.universe.notifications.some((n) => /Noticed/.test(n.title))).toBe(true);
    expect(factsOf(sim, other.id, { kind: 'event', aboutId: sim.player.id }).some((f) => /Did not/.test(f.text))).toBe(true);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('a promise kept is noticed too', () => {
    const sim = aLife();
    const other = someone(sim);
    const { date } = arrange(sim, other);
    const rel = findRelationship(sim, sim.player.id, other.id)!;
    beginning(sim, date);
    const checked = must<{ showed: string }>(sim, 'date.check_in', { dateId: date.id });
    if (checked.showed === 'no_show') return;
    must(sim, 'date.close', { dateId: date.id, move: 'call' });
    must(sim, 'date.finish', { dateId: date.id });
    sim.advanceTo(sim.now + MS_DAY);
    must(sim, 'rel.interact', { relationshipId: rel.id, interaction: 'chat' });
    const trust = rel.dimensions.trust;
    sim.advanceTo(sim.now + (FOLLOW_UP_DAYS + 1) * MS_DAY);
    expect(rel.dimensions.trust).toBe(trust + 3);
    expect(factsOf(sim, other.id, { kind: 'event', aboutId: sim.player.id }).some((f) => /and did\./.test(f.text))).toBe(true);
  });
});

describe('the scene', () => {
  function pick(sim: Simulation, label: RegExp) {
    const scene = activeScene(sim)!;
    const view = sceneView(sim, scene);
    const choice = view.choices.find((c) => label.test(c.label) && !c.disabled);
    if (!choice) throw new Error(`No choice ${label} at "${view.title}": ${view.choices.map((c) => `${c.label}${c.disabled ? ' (closed)' : ''}`).join(' | ')}`);
    must(sim, 'scene.choose', { sceneId: scene.id, revision: scene.revision, choiceId: choice.id });
  }

  it('walks the whole way: prepare, get there, go in, the table, the door, the morning after', () => {
    const sim = aLife();
    const other = someone(sim);
    const { date } = arrange(sim, other);
    sim.advanceTo(date.at - 30 * MS_MINUTE);
    must(sim, 'date.attend', { dateId: date.id, mode: 'play' });
    const scene = activeScene(sim)!;
    expect(scene.node).toBe('prepare');
    expect(scene.refType).toBe('date');
    const prepare = sceneView(sim, scene);
    expect(prepare.facts!.map((f) => f.label)).toEqual(['When', 'Where', 'Sitting Down', 'Energy']);
    pick(sim, /^(Taxi|Walk|Transit|Drive)$/);
    expect(activeScene(sim)!.node).toBe('meet');
    pick(sim, /^Go In$/);
    if (activeScene(sim)!.node === 'stoodup') {
      pick(sim, /^Go Home$/);
      expect(activeScene(sim)).toBeUndefined();
      expect(date.status).toBe('they_cancelled');
      return;
    }
    expect(activeScene(sim)!.node).toBe('beat');
    const table = sceneView(sim, activeScene(sim)!);
    expect(table.facts!.map((f) => f.label)).toEqual(['How It Is Going', 'Time', 'Spent', 'Left']);
    // No number on screen: the evening is a word.
    expect(table.facts![0]!.value).toMatch(/^(Electric|Warm|Easy|Flat|Cold)$/);
    pick(sim, /^Ask About/);
    pick(sim, /^Let Them Talk$/);
    pick(sim, /^Start Saying Goodnight$/);
    expect(activeScene(sim)!.node).toBe('close');
    pick(sim, /^Say You Will Call$/);
    expect(activeScene(sim)!.node).toBe('reflect');
    expect(date.status).toBe('attended');
    pick(sim, /^Back To The Day$/);
    expect(activeScene(sim)).toBeUndefined();
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('the short version turns up, makes the safe moves and goes home, by the same rules', () => {
    const sim = aLife();
    const other = someone(sim);
    const { date } = arrange(sim, other);
    beginning(sim, date);
    const rel = findRelationship(sim, sim.player.id, other.id)!;
    const familiarity = rel.dimensions.familiarity;
    const command = { kind: 'date.attend', payload: { dateId: date.id, mode: 'summary' }, idempotencyKey: 'attend:1' };
    expect(sim.execute(command).ok).toBe(true);
    expect(sim.execute(command).replayed).toBe(true);
    expect(activeScene(sim)).toBeUndefined();
    if (date.status === 'they_cancelled') return;
    expect(date.status).toBe('attended');
    expect(date.beats).toBeGreaterThanOrEqual(2);
    expect(rel.dimensions.familiarity).toBeGreaterThan(familiarity);
    expect(datesOf(sim)[0]!.outcome).toBeDefined();
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('survives a reload half way through, and leaving early ends it as what it was', () => {
    const sim = aLife();
    const other = someone(sim);
    const { date } = arrange(sim, other);
    beginning(sim, date);
    must(sim, 'date.attend', { dateId: date.id, mode: 'play' });
    pick(sim, /^Go In$/);
    if (activeScene(sim)!.node === 'stoodup') return;
    pick(sim, /^Ask About/);
    const back = loadSave(JSON.parse(JSON.stringify(sim.universe)));
    const scene = activeScene(back)!;
    expect(scene.node).toBe('beat');
    const again = back.universe.dates[date.id]!;
    expect(again.status).toBe('underway');
    expect(again.beats).toBe(1);
    const chemistry = again.chemistry;
    must(back, 'scene.leave', { sceneId: scene.id, revision: scene.revision });
    expect(again.status).toBe('attended');
    expect(again.chemistry).toBe(Math.max(0, chemistry - 10));
    expect(back.ledger.audit()).toEqual([]);
  });
});
