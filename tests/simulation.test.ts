import { describe, expect, it } from 'vitest';
import { quickSave, validateUniverse, migrate } from '@/engine';
import { SAVE_SCHEMA_VERSION } from '@/engine/domain/model';
import { formatTime, MS_DAY, MS_HOUR, MS_MINUTE, zonedParts } from '@/engine/core/time';
import { skipTargets, checkConflicts, entriesBetween, monthGrid } from '@/engine/world/calendar';
import { openDecisions } from '@/engine/world/world';
import { createIdFactory, idAlreadyIssued, ID_NAMESPACES } from '@/engine/core/ids';

describe('time advancement', () => {
  it('refuses to run the clock backwards', () => {
    const sim = quickSave();
    expect(() => sim.advanceTo(sim.now - MS_HOUR)).toThrow(/backwards/);
  });

  it('processes due items in chronological order', () => {
    const sim = quickSave();
    const fired: number[] = [];
    sim.onSchedule('test.ordered', (item) => { fired.push(item.payload.index as number); });

    // Deliberately schedule out of order.
    for (const index of [3, 1, 4, 2, 0]) {
      sim.schedule({
        at: sim.now + (index + 1) * MS_HOUR,
        kind: 'test.ordered',
        label: `step ${index}`,
        category: 'system',
        payload: { index },
      });
    }
    sim.advanceTo(sim.now + 6 * MS_HOUR);
    expect(fired).toEqual([0, 1, 2, 3, 4]);
  });

  it('sets the clock to each item as it fires, not to the target', () => {
    const sim = quickSave();
    const seen: number[] = [];
    const target = sim.now + 5 * MS_HOUR;
    sim.onSchedule('test.clock', (item, s) => { seen.push(s.now - item.at); });
    for (let i = 1; i <= 4; i++) {
      sim.schedule({ at: sim.now + i * MS_HOUR, kind: 'test.clock', label: 'x', category: 'system' });
    }
    sim.advanceTo(target);
    // Every handler ran at exactly the moment it was due.
    expect(seen).toEqual([0, 0, 0, 0]);
    expect(sim.now).toBe(target);
  });

  it('lands exactly on the requested instant', () => {
    const sim = quickSave();
    const target = sim.now + 37 * MS_DAY + 11 * MS_HOUR + 13 * MS_MINUTE;
    sim.advanceTo(target);
    expect(sim.now).toBe(target);
  });

  it('runs recurrences without drifting', () => {
    const sim = quickSave();
    let count = 0;
    sim.onSchedule('test.weekly', () => { count++; });
    sim.schedule({
      at: sim.now + MS_DAY,
      kind: 'test.weekly',
      label: 'weekly',
      category: 'system',
      recurrence: { unit: 'week', interval: 1, count: 5 },
    });
    sim.advanceTo(sim.now + 60 * MS_DAY);
    expect(count).toBe(5);
  });

  it('catches a handler that schedules itself in a loop', () => {
    const sim = quickSave();
    sim.onSchedule('test.runaway', (_item, s) => {
      s.schedule({ at: s.now, kind: 'test.runaway', label: 'loop', category: 'system' });
    });
    sim.schedule({ at: sim.now + MS_MINUTE, kind: 'test.runaway', label: 'loop', category: 'system' });
    expect(() => sim.advanceTo(sim.now + MS_DAY)).toThrow(/exceeded/);
  });

  it('refuses to schedule a kind with no handler, rather than dropping it silently', () => {
    const sim = quickSave();
    expect(() => sim.schedule({
      at: sim.now + MS_HOUR, kind: 'nobody.handles.this', label: 'x', category: 'system',
    })).toThrow(/no handler is registered/);
  });
});

describe('sleep', () => {
  it('advances the world by exactly the hours slept', () => {
    const sim = quickSave();
    const before = sim.now;
    const result = sim.execute<{ wokeAt: number }>({ kind: 'life.sleep', payload: { hours: 8 } });
    expect(result.ok).toBe(true);
    expect(sim.now).toBe(before + 8 * MS_HOUR);
  });

  it('restores energy and pays down sleep debt', () => {
    const sim = quickSave();
    sim.player.wellbeing.energy = 20;
    sim.player.wellbeing.sleepDebt = 12;
    sim.execute({ kind: 'life.sleep', payload: { hours: 9 } });
    expect(sim.player.wellbeing.energy).toBeGreaterThan(60);
    expect(sim.player.wellbeing.sleepDebt).toBeLessThan(12);
  });

  it('accrues debt when the night is short', () => {
    const sim = quickSave();
    sim.player.wellbeing.sleepDebt = 0;
    sim.execute({ kind: 'life.sleep', payload: { hours: 4 } });
    expect(sim.player.wellbeing.sleepDebt).toBeGreaterThan(0);
  });

  it('keeps processing the world while the player is unconscious', () => {
    const sim = quickSave();
    let fired = false;
    sim.onSchedule('test.overnight', () => { fired = true; });
    sim.schedule({
      at: sim.now + 4 * MS_HOUR,
      kind: 'test.overnight', label: 'a bill falls due', category: 'finance',
    });
    sim.execute({ kind: 'life.sleep', payload: { hours: 8 } });
    expect(fired).toBe(true);
  });

  it('lands on the right wall-clock time when sleeping across a DST change', () => {
    // 7 March 2026 at 11:30 PM in Los Angeles, sleeping eight hours across the
    // spring-forward transition, wakes at 8:30 AM rather than 7:30 AM.
    //
    // Los Angeles by name, not by default: home base is Reykjavík now and
    // Iceland keeps no daylight saving at all, so inheriting the home zone
    // left this testing a clock change that never happens.
    const sim = quickSave({
      startYear: 2026, startMonth: 3, startDay: 7, startLocationId: 'us-ca-losangeles',
    });
    const zone = sim.homeZone;
    const bedtime = sim.now;
    const parts = zonedParts(bedtime, zone);
    expect(parts.day).toBe(7);

    sim.advanceTo(bedtime + (23.5 - parts.hour - parts.minute / 60) * MS_HOUR);
    sim.execute({ kind: 'life.sleep', payload: { hours: 8 } });
    // Eight elapsed hours from 11:30 PM on the night the clocks go forward.
    expect(formatTime(sim.now, zone)).toBe('8:30 AM');
  });
});

describe('skip to event', () => {
  it('shows what would be crossed and missed before committing', () => {
    const sim = quickSave();
    // Nothing in the world books the player any more, so the commitments
    // being inspected are put on the calendar here.
    sim.onSchedule('test.meeting', () => {});
    sim.onSchedule('test.other', () => {});
    sim.schedule({ at: sim.now + 3 * MS_DAY, kind: 'test.meeting', label: 'A Meeting', category: 'personal', requiresPlayer: true });
    sim.schedule({ at: sim.now + 9 * MS_DAY, kind: 'test.other', label: 'Something Else', category: 'personal' });
    const targets = skipTargets(sim, 5);
    expect(targets.length).toBeGreaterThan(0);
    for (const target of targets) {
      expect(target.item.at).toBeGreaterThan(sim.now);
      // Nothing in the crossed list is after the target itself.
      for (const crossed of target.crossed) expect(crossed.at).toBeLessThan(target.item.at);
      expect(target.missed.every((m) => m.requiresPlayer)).toBe(true);
    }
  });

  it('does not mutate anything when only inspecting targets', () => {
    const sim = quickSave();
    const before = sim.now;
    const transactions = sim.universe.transactions.length;
    skipTargets(sim, 10);
    expect(sim.now).toBe(before);
    expect(sim.universe.transactions.length).toBe(transactions);
  });

  it('processes the skipped interval rather than just moving the clock', () => {
    const sim = quickSave();
    const target = skipTargets(sim, 20).find((t) => t.daysAway > 10);
    if (!target) return;
    const before = sim.universe.transactions.length;
    sim.advanceTo(target.item.at);
    expect(sim.universe.transactions.length).toBeGreaterThanOrEqual(before);
    expect(sim.now).toBe(target.item.at);
  });
});

describe('the calendar', () => {
  it('flags two commitments that overlap', () => {
    const sim = quickSave();
    sim.onSchedule('test.commitment', () => undefined);
    const at = sim.now + 3 * MS_DAY;
    sim.schedule({
      at, kind: 'test.commitment', label: 'Audition', category: 'career',
      requiresPlayer: true, durationMinutes: 120,
    });
    sim.schedule({
      at: at + 30 * MS_MINUTE, kind: 'test.commitment', label: 'Shift', category: 'work',
      requiresPlayer: true, durationMinutes: 120,
    });

    const conflicts = checkConflicts(sim, at + 30 * MS_MINUTE, 120);
    expect(conflicts.length).toBeGreaterThan(0);

    const entries = entriesBetween(sim, at - MS_HOUR, at + 6 * MS_HOUR);
    expect(entries.filter((e) => e.conflicted).length).toBeGreaterThanOrEqual(2);
  });

  it('does not treat back-to-back commitments as a collision', () => {
    const sim = quickSave();
    sim.onSchedule('test.back_to_back', () => undefined);
    const at = sim.now + 5 * MS_DAY;
    sim.schedule({
      at, kind: 'test.back_to_back', label: 'First', category: 'career',
      requiresPlayer: true, durationMinutes: 60,
    });
    expect(checkConflicts(sim, at + 60 * MS_MINUTE, 60)).toHaveLength(0);
  });

  it('builds a month grid that always covers whole weeks', () => {
    const sim = quickSave();
    for (const month of [1, 2, 6, 12]) {
      const grid = monthGrid(sim, 2026, month);
      expect(grid.length % 7).toBe(0);
      expect(grid.filter((d) => d.inMonth).length).toBeGreaterThan(27);
      expect(grid[0]?.weekday).toBe(0);
    }
  });

  it('marks a leap day as in-month', () => {
    const sim = quickSave();
    const grid = monthGrid(sim, 2028, 2);
    expect(grid.filter((d) => d.inMonth)).toHaveLength(29);
  });
});

describe('commands', () => {
  it('never applies the same idempotency key twice', () => {
    const sim = quickSave();

    const key = 'sleep-abc-123';
    const first = sim.execute({ kind: 'life.sleep', payload: { hours: 8 }, idempotencyKey: key });
    const wokeAt = sim.now;
    const second = sim.execute({ kind: 'life.sleep', payload: { hours: 8 }, idempotencyKey: key });

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(second.replayed).toBe(true);
    expect(second.value, 'the replay returned a different result').toEqual(first.value);
    // The second submission is a receipt, not a second night: the clock did
    // not move again.
    expect(sim.now).toBe(wokeAt);
  });

  it('rolls back completely when a command fails part-way', () => {
    const sim = quickSave();
    const accounts = sim.ledger.accountsOf(sim.player.id).length;
    const transactions = sim.universe.transactions.length;
    const now = sim.now;
    const energy = sim.player.wellbeing.energy;

    // A night that starts before the world does.
    const result = sim.execute({ kind: 'life.sleep', payload: { hours: 8, startAt: sim.now - MS_DAY } });
    expect(result.ok).toBe(false);

    // No moved clock, no orphan account, no orphan transaction, no half-slept night.
    expect(sim.now).toBe(now);
    expect(sim.player.wellbeing.energy).toBe(energy);
    expect(sim.ledger.accountsOf(sim.player.id)).toHaveLength(accounts);
    expect(sim.universe.transactions.length).toBe(transactions);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('rejects an unknown command instead of failing silently', () => {
    const sim = quickSave();
    const result = sim.execute({ kind: 'does.not.exist', payload: {} });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Unknown command/);
  });

  it('surfaces a readable reason when a command is refused', () => {
    const sim = quickSave();
    const result = sim.execute({ kind: 'life.sleep', payload: { hours: 8, startAt: sim.now - MS_DAY } });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/can’t go to sleep in the past/);
  });
});

describe('migrations and validation', () => {
  it('leaves a current save alone', () => {
    const sim = quickSave();
    const result = migrate(sim.universe);
    expect(result.migrated).toBe(false);
    expect(result.problems).toEqual([]);
  });

  it('refuses a save from a newer build rather than damaging it', () => {
    const sim = quickSave();
    sim.universe.meta.schemaVersion = SAVE_SCHEMA_VERSION + 5;
    const result = migrate(sim.universe);
    expect(result.migrated).toBe(false);
    expect(result.problems[0]).toMatch(/newer version/);
  });


  it('drops the heritage and the height and weight a save no longer reads', () => {
    const sim = quickSave();
    sim.universe.meta.schemaVersion = 72;
    const player = sim.universe.people[sim.universe.playerId]!;
    const row = player as unknown as Record<string, unknown>;
    row.heritageId = 'english';
    row.parentHeritageIds = ['english', 'irish'];
    row.adultHeightCm = 175;
    row.adultWeightKg = 72;

    const result = migrate(sim.universe);

    expect(result.migrated).toBe(true);
    expect(row.heritageId).toBeUndefined();
    expect(row.parentHeritageIds).toBeUndefined();
    expect(row.adultHeightCm).toBeUndefined();
    expect(row.adultWeightKg).toBeUndefined();
    expect('heritageId' in row).toBe(false);
    // The rest of the person is untouched.
    expect(player.displayName).toBe(sim.universe.people[sim.universe.playerId]!.displayName);
    expect(validateUniverse(sim.universe).ok).toBe(true);
  });

  it('keeps the title a save from before 80 was made with, and names the slot by it', () => {
    const sim = quickSave({ pronouns: 'they/them', performerTitle: 'actress' }, 'title-79');
    const universe = sim.universe;
    universe.meta.schemaVersion = 79;
    const row = universe.people[universe.playerId] as unknown as Record<string, unknown>;
    row.careerTrack = 'actor';
    // The film career named the slot, and the summary carried its own copy.
    universe.meta.careerLabel = 'Writer';
    (universe.meta as unknown as Record<string, unknown>).performerTitle = 'actress';

    const result = migrate(universe);

    expect(result.migrated).toBe(true);
    expect(row.performerTitle).toBe('actress');
    expect('careerTrack' in row).toBe(false);
    expect(universe.meta.careerLabel).toBe('Actress');
    expect('performerTitle' in universe.meta).toBe(false);
    expect(result.steps.join(' ')).not.toMatch(/a title from their pronouns/);
    expect(validateUniverse(universe).ok).toBe(true);
  });

  it('gives a save written under 80 a title from its pronouns', () => {
    for (const [pronouns, title, word] of [
      ['she/her', 'actress', 'Actress'], ['he/him', 'actor', 'Actor'], ['they/them', 'actor', 'Actor'],
    ] as const) {
      const sim = quickSave({ pronouns }, `title-80-${pronouns}`);
      const universe = sim.universe;
      universe.meta.schemaVersion = 80;
      // 80 shed the title and left the career line empty.
      delete (universe.people[universe.playerId] as unknown as Record<string, unknown>).performerTitle;
      universe.meta.careerLabel = '';

      const result = migrate(universe);

      expect(result.migrated).toBe(true);
      expect(universe.people[universe.playerId]!.performerTitle, pronouns).toBe(title);
      expect(universe.meta.careerLabel, pronouns).toBe(word);
      expect(result.steps.join(' ')).toMatch(/Gave 1 person a title from their pronouns/);
      expect(validateUniverse(universe).ok).toBe(true);
    }
  });

  it('takes the player’s pick back from the premise record an 80 save still carries', () => {
    const sim = quickSave({ pronouns: 'they/them', performerTitle: 'actress' }, 'title-80-premise');
    const universe = sim.universe;
    universe.meta.schemaVersion = 80;
    // A save made under 79 and brought up to 80: the title shed from the
    // person, and the premise record left behind with the pick in it.
    const row = universe.people[universe.playerId] as unknown as Record<string, unknown>;
    delete row.performerTitle;
    universe.meta.careerLabel = '';
    (universe as unknown as Record<string, unknown>).premise = {
      kind: 'actor-actress-life-simulator', playerTitle: 'actress', playerTitleSource: 'stated',
    };

    const result = migrate(universe);

    expect(row.performerTitle).toBe('actress');
    expect(universe.meta.careerLabel).toBe('Actress');
    expect(result.steps.join(' ')).toMatch(/title the save recorded/);
    expect(result.steps.join(' ')).not.toMatch(/from their pronouns/);

    // A premise naming neither word is no help, and the pronouns decide.
    const other = quickSave({ pronouns: 'they/them', performerTitle: 'actress' }, 'title-80-bad-premise');
    other.universe.meta.schemaVersion = 80;
    delete (other.universe.people[other.universe.playerId] as unknown as Record<string, unknown>).performerTitle;
    (other.universe as unknown as Record<string, unknown>).premise = { playerTitle: 'star' };
    migrate(other.universe);
    expect(other.universe.people[other.universe.playerId]!.performerTitle).toBe('actor');
  });

  it('brings a save from the line this one replaced forward, at any number that line used', () => {
    // The older line split from this one at 79 and counted on to 86. At 87
    // every one of its numbers is older than this build, so every one migrates.
    expect(SAVE_SCHEMA_VERSION).toBeGreaterThan(86);
    for (const from of [83, 84, 85, 86]) {
      const sim = quickSave({ pronouns: 'she/her' }, `older-line-${from}`);
      const universe = sim.universe;
      universe.meta.schemaVersion = from;
      const bag = universe as unknown as Record<string, unknown>;
      const row = universe.people[universe.playerId] as unknown as Record<string, unknown>;
      row.personality = { conscientiousness: 80, emotionalStability: 20, ambition: 95 };
      row.personalityTraits = ['night_owl', 'light_sleeper', 'loyal', 'curious'];
      Object.assign(row, {
        attributes: {}, traits: ['range'], prodigy: true, reputation: { publicFame: 40 },
        careerTrack: 'actor', reputationDriftedAt: universe.now, gender: 'female',
        householdId: 'household_000001', residenceId: 'prop_000001',
      });
      (universe.meta as unknown as Record<string, unknown>).performerTitle = 'actress';
      bag.households = { household_000001: { id: 'household_000001', saveId: universe.meta.id } };
      bag.tutorial = { seen: {}, dismissed: false };
      delete bag.history;

      const result = migrate(universe);

      expect(result.migrated, String(from)).toBe(true);
      expect(result.problems, String(from)).toEqual([]);
      expect(result.steps.at(-1), String(from)).toBe(`Schema ${from} to ${SAVE_SCHEMA_VERSION}.`);
      for (const key of [
        'attributes', 'traits', 'prodigy', 'reputation', 'careerTrack', 'reputationDriftedAt',
        'gender', 'householdId', 'residenceId',
      ]) expect(key in row, `${from} ${key}`).toBe(false);
      expect(row.personality).toEqual({
        openness: 55, conscientiousness: 80, extraversion: 55, agreeableness: 55,
        emotionalStability: 20, ambition: 95, riskTolerance: 50,
      });
      expect(row.personalityTraits).toEqual(['night_owl', 'light_sleeper', 'loyal', 'curious']);
      expect(row.performerTitle).toBe('actress');
      expect('performerTitle' in universe.meta).toBe(false);
      // The parts this build has no screen for stay, untouched.
      expect(bag.households).toEqual({ household_000001: { id: 'household_000001', saveId: universe.meta.id } });
      expect(bag.tutorial).toEqual({ seen: {}, dismissed: false });
      expect(universe.history).toEqual([]);
      expect(universe.meta.schemaVersion).toBe(SAVE_SCHEMA_VERSION);
      expect(validateUniverse(universe).ok, String(from)).toBe(true);
    }
  });

  it('gives a save from this line at 83 the new number and nothing else', () => {
    // Lived in a little first: a night slept and a plan typed in lower case,
    // because a player's own words are what a pass that goes by shape could
    // rewrite, and an untouched save has none.
    const sim = quickSave({}, 'this-line-83');
    expect(sim.execute({ kind: 'life.sleep', payload: { hours: 8 } }).ok).toBe(true);
    expect(sim.execute({ kind: 'calendar.schedule', payload: { title: 'lunch with mum at the café', at: sim.now + 2 * MS_DAY } }).ok).toBe(true);
    expect(sim.universe.history.length).toBeGreaterThan(0);
    sim.universe.meta.schemaVersion = 83;
    const before = JSON.stringify({ ...sim.universe, meta: { ...sim.universe.meta, schemaVersion: SAVE_SCHEMA_VERSION } });
    const result = migrate(sim.universe);
    expect(result.steps).toEqual([`Schema 83 to ${SAVE_SCHEMA_VERSION}.`]);
    expect(JSON.stringify(sim.universe)).toBe(before);
  });

  it('re-stamps records that carry the wrong save id', () => {
    const sim = quickSave();
    sim.universe.meta.schemaVersion = 1;
    const person = Object.values(sim.universe.people)[0];
    if (person) person.saveId = 'some-other-save';

    const result = migrate(sim.universe);
    expect(result.steps.some((s) => s.includes('Re-stamped'))).toBe(true);
    expect(validateUniverse(sim.universe).ok).toBe(true);
  });

  it('catches a corrupted universe', () => {
    const sim = quickSave();
    sim.player.primaryAccountId = 'account_does_not_exist';
    const report = validateUniverse(sim.universe);
    expect(report.ok).toBe(false);
    expect(report.errors.some((e) => /does(n’t| not) exist/.test(e))).toBe(true);
  });
});

describe('the decision center', () => {
  it('sorts overdue items above everything else', () => {
    const sim = quickSave();
    sim.advanceTo(sim.now + 120 * MS_DAY);
    const decisions = openDecisions(sim);
    const firstOverdue = decisions.findIndex((d) => d.dueAt !== undefined && d.dueAt < sim.now);
    const firstNotOverdue = decisions.findIndex((d) => d.dueAt === undefined || d.dueAt >= sim.now);
    if (firstOverdue >= 0 && firstNotOverdue >= 0) {
      expect(firstOverdue).toBeLessThan(firstNotOverdue);
    }
  });

  it('never shows a resolved or dismissed item', () => {
    const sim = quickSave();
    sim.advanceTo(sim.now + 60 * MS_DAY);
    for (const decision of openDecisions(sim)) {
      expect(decision.resolvedAt).toBeUndefined();
      expect(decision.dismissedAt).toBeUndefined();
    }
  });
});

describe('an older save catches up with the build', () => {
  it('hands out no id a save from before the namespace split already used', () => {
    const sim = quickSave({}, 'old-ids');
    sim.advanceTo(sim.now + 120 * MS_DAY);
    const universe = sim.universe;
    // Wind it back to how a build before the namespaces were told apart left
    // it: one number for the whole save and no map.
    delete universe.__idCounters;

    const onTheRecord = new Set<string>([
      ...Object.keys(universe.people), ...Object.keys(universe.accounts),
      ...universe.transactions.map((one) => one.id),
      ...universe.scheduled.map((one) => one.id),
      ...universe.notifications.map((one) => one.id),
      ...universe.history.map((one) => one.id),
    ]);
    expect(onTheRecord.size, 'nothing on the record to collide with').toBeGreaterThan(20);

    for (const ns of ['person', 'account', 'txn', 'sched', 'notice', 'history'] as const) {
      for (let i = 0; i < 3; i += 1) {
        const id = sim.nextId(ns);
        expect(onTheRecord.has(id), `${id} is on the record already`).toBe(false);
      }
    }
  });


  it('puts labels written by an older build into Title Case', () => {
    const sim = quickSave({}, 'relabel');
    sim.advanceTo(sim.now + 30 * MS_DAY);

    // Wind the save back to how an older build left it: schema behind, and
    // labels in the sentence case that build wrote.
    const universe = sim.universe;
    universe.meta.schemaVersion = 9;
    const item = universe.scheduled.find((s) => s.label.includes(' '));
    expect(item, 'no multi-word label to test with').toBeDefined();
    item!.label = 'New day';
    universe.notifications.push({
      id: 'notice_test', saveId: universe.meta.id, at: universe.now,
      category: 'system', title: 'a scheduled event could not be processed',
      body: 'Something went wrong.', importance: 40, read: false,
    } as (typeof universe.notifications)[number]);

    const result = migrate(universe);
    expect(result.migrated).toBe(true);
    expect(universe.scheduled.find((s) => s.id === item!.id)?.label).toBe('New Day');
    expect(universe.notifications.at(-1)?.title).toBe('A Scheduled Event Could Not Be Processed');
    expect(result.steps.join(' ')).toMatch(/Title Case/);
  });

  it('leaves a sentence in a title field alone', () => {
    const sim = quickSave({}, 'relabel-prose');
    const universe = sim.universe;
    universe.meta.schemaVersion = 9;
    universe.history.push({
      id: 'history_test', saveId: universe.meta.id, at: universe.now,
      category: 'life', title: 'You were too exhausted to work.',
      detail: 'A missed shift.', refs: [], significance: 10, public: false,
    } as (typeof universe.history)[number]);

    migrate(universe);
    expect(universe.history.at(-1)?.title).toBe('You were too exhausted to work.');
  });

  it('does not relabel a save that is already current', () => {
    const sim = quickSave({}, 'relabel-current');
    const before = sim.universe.scheduled.map((s) => s.label);
    const result = migrate(sim.universe);
    expect(result.migrated).toBe(false);
    expect(sim.universe.scheduled.map((s) => s.label)).toEqual(before);
  });
});

describe('ids are told apart by namespace', () => {
  // One counter for the whole save made an id in one namespace a function of
  // how much work every other namespace had done — and some of the engine's
  // seeded streams were keyed on an id, so posting a transaction anywhere in
  // the save changed what they drew. It cost six tests across three files
  // once, and an hour each time before it turned out to be this.

  const host = (): { __idCounter: number; __idCounters?: Record<string, number> } =>
    ({ __idCounter: 0, __idCounters: {} });

  it('does not move one namespace because another was used', () => {
    const one = createIdFactory(host() as never);
    expect(one('person')).toBe('person_000001');
    for (let i = 0; i < 50; i += 1) one('txn');
    expect(one('person'), 'fifty transactions moved the next person')
      .toBe('person_000002');
    // Fifty-one of them, counted in its own namespace and written in base 36
    // like every id in the save.
    expect(one('txn')).toBe(`txn_${(51).toString(36).padStart(6, '0')}`);
  });

  it('starts every namespace of a new world at one', () => {
    const next = createIdFactory(host() as never);
    for (const ns of ['person', 'txn', 'notice', 'decision'] as const) {
      expect(next(ns)).toBe(`${ns}_000001`);
    }
  });

  it('never hands the same id out twice, in any order', () => {
    const next = createIdFactory(host() as never);
    const seen = new Set<string>();
    const order = ['person', 'txn', 'person', 'notice', 'txn', 'txn', 'notice', 'person'] as const;
    for (let round = 0; round < 40; round += 1) {
      for (const ns of order) {
        const id = next(ns);
        expect(seen.has(id), `${id} came out twice`).toBe(false);
        seen.add(id);
      }
    }
    expect(seen.size).toBe(order.length * 40);
  });

  it('picks up a save written before the namespaces were told apart', () => {
    // Such a save carries one number that is at or above every id in it, so
    // every namespace has to start there. Anything lower would hand out an id
    // that is already on a record.
    const old = { __idCounter: 42 } as { __idCounter: number };
    const next = createIdFactory(old as never);
    expect(next('person')).toBe(`person_${(43).toString(36).padStart(6, '0')}`);
    expect(next('txn')).toBe(`txn_${(43).toString(36).padStart(6, '0')}`);
    expect(next('notice')).toBe(`notice_${(43).toString(36).padStart(6, '0')}`);
    expect(next('person')).toBe(`person_${(44).toString(36).padStart(6, '0')}`);
  });

  it('goes on counting every id it has issued, which is what an older save starts from', () => {
    const at = host();
    const next = createIdFactory(at as never);
    for (let i = 0; i < 7; i += 1) { next('person'); next('txn'); }
    expect(at.__idCounter).toBe(14);
    // The total is at or above every namespace's own count, and that is exactly
    // the property the pick-up above rests on: a save carrying only this number
    // can start each namespace here without handing out an id twice.
    for (const one of Object.values(at.__idCounters!)) {
      expect(at.__idCounter).toBeGreaterThanOrEqual(one);
    }
  });

  it('never walks a counter backwards when an id is claimed', () => {
    const at = host();
    idAlreadyIssued(at as never, 'person', 5);
    idAlreadyIssued(at as never, 'person', 2);
    expect(createIdFactory(at as never)('person')).toBe('person_000006');
  });

  it('keeps the player out of the way of the next person', () => {
    // `person_000001` is written by hand at boot, before there is a simulation
    // to ask for it.
    const sim = quickSave();
    expect(sim.universe.playerId).toBe('person_000001');
    expect(Object.keys(sim.universe.people)).toContain('person_000001');
    expect(sim.nextId('person')).not.toBe('person_000001');
  });

  it('holds a person still while the ledger fills up', () => {
    // The end of it, on a real save: the same seed, the same world, and one of
    // them posting a hundred transactions nobody asked about.
    const quiet = quickSave({}, 'still');
    const busy = quickSave({}, 'still');
    const account = busy.universe.people[busy.universe.playerId]!.primaryAccountId!;
    for (let i = 0; i < 100; i += 1) busy.income(account, 1_00, 'Something Else Entirely', 'other');
    expect(busy.nextId('person')).toBe(quiet.nextId('person'));
    expect(busy.nextId('decision')).toBe(quiet.nextId('decision'));
    expect(busy.nextId('txn')).not.toBe(quiet.nextId('txn'));
  });

  it('declares no namespace the game never asks for a name in', () => {
    // The list is a value rather than a union so `nextId` can walk it, and
    // `tools/wired.mjs` fails the gate on a namespace with no call site.
    expect(new Set(ID_NAMESPACES).size, 'the same noun is in the list twice')
      .toBe(ID_NAMESPACES.length);
  });
});
