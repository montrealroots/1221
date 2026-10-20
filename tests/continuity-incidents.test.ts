/**
 * What the class remembers (from 2026-10-20, the owner's brief 17, section 6: "Use stable incident identity and
 * resolution state where appropriate. A bounded presentation history must not erase whether an actual incident was
 * resolved."). A classmate's apology covers every rehearsal they've missed with you since their last, marked on each
 * rehearsal (`missesOwed`), so no apology comes again for them however much of the classmate's history has been let go;
 * a new miss is owed a new one. How often they've asked for help is counted on them, beyond their last 20 moments, and
 * the last answer is the newest. A save from before is marked from what it holds (`migrate`).
 *
 * Until then an apology was due while a classmate's misses outnumbered the apologies among their last 20 moments, one a
 * miss: brief 16's regressing student heard Nadia apologize for two missed rehearsals on 2026-10-08 ("It’s the second
 * rehearsal they’ve missed with you") and again for the same two on 2027-09-30. And the last request was read from the
 * end of a list kept newest first, so "you helped them last time" could be about the oldest.
 */
import { describe, expect, it } from 'vitest';
import { createSave, migrate } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { MS_DAY } from '@/engine/core/time';
import { missesOwed, momentsOf, personOf, wayOf, type Moment, type MomentKind } from '@/engine/systems/classmates';
import { courseworkOf, mateRecord, type Assignment } from '@/engine/systems/coursework';
import type { Classmate } from '@/engine/systems/school';

const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });

/** To the first open piece with a partner: the class met, the work set. */
function toPartneredWork(sim: Simulation): Assignment {
  for (let d = 0; d < 40; d += 1) {
    sim.advanceTo(sim.now + MS_DAY);
    const a = courseworkOf(sim, sim.player)?.assignments.find((x) => x.status === 'open' && x.partner !== undefined);
    if (a) return a;
  }
  throw new Error('no partnered piece in the first forty days');
}

/**
 * TEST SETUP: every classmate but one with nothing to bring (their priority the work's, too little trust to invite you,
 * no bond to encourage you), and nothing to dispute (the pieces' answers cleared); the one under test met a month ago,
 * with the priority given. So a moment the class days bring is theirs, and of the kind under test.
 */
function alone(sim: Simulation, i: number, priority: 'craft' | 'career' | 'people' | 'home'): Classmate {
  sim.player.school!.classmates.forEach((m, j) => {
    mateRecord(m).trust = 0;
    m.bond = 0;
    personOf(m).priority = j === i ? priority : 'craft';
  });
  const mate = sim.player.school!.classmates[i]!;
  mateRecord(mate).met = sim.now - 30 * MS_DAY;
  for (const a of courseworkOf(sim, sim.player)!.assignments) a.answers = {};
  return mate;
}

/**
 * The class days as the game brings them, a day at a time, kept rested and awake (TEST SETUP), each moment answered so
 * the next can come: the moments that came, as they came.
 */
function moments(sim: Simulation, days: number, answer: Record<string, string> = { apology: 'accept', help: 'no' }): Moment[] {
  const cw = courseworkOf(sim, sim.player)!;
  const seen = new Set(momentsOf(cw).map((m) => m.id));
  const got: Moment[] = [];
  for (let h = 0; h < days * 12; h += 1) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(sim.now + 2 * 3_600_000);
    for (const m of momentsOf(cw)) {
      if (seen.has(m.id)) continue;
      seen.add(m.id);
      got.push({ ...m });
    }
    for (const m of momentsOf(cw).filter((x) => x.status === 'open')) sim.execute({ kind: 'school.respond', payload: { momentId: m.id, choice: answer[m.kind] ?? 'no' } });
  }
  return got;
}

describe('a classmate’s apology, kept on the misses it’s for', () => {
  it('covers every rehearsal missed since the last, comes once for them however much of the classmate’s history is let go, and comes again for a new miss', () => {
    const sim = life('continuity-apology');
    const a = toPartneredWork(sim);
    const i = a.partner!;
    const mate = alone(sim, i, 'craft');
    // TEST SETUP: two rehearsals of this piece they didn't come to, a week and four days ago.
    a.rehearsals.push({ id: 'miss-1', at: sim.now - 7 * MS_DAY, status: 'missedByThem' }, { id: 'miss-2', at: sim.now - 4 * MS_DAY, status: 'missedByThem' });
    mateRecord(mate).stoodUp = 2;
    expect(missesOwed(courseworkOf(sim, sim.player)!, mate, i).map((x) => x.r.id)).toEqual(['miss-1', 'miss-2']);
    const first = moments(sim, 40).filter((m) => m.kind === 'apology');
    expect(first, 'one apology, for both').toHaveLength(1);
    expect(first[0]!.covers).toEqual(['miss-1', 'miss-2']);
    expect(a.rehearsals.filter((r) => r.id.startsWith('miss-')).every((r) => r.apologized !== undefined)).toBe(true);
    // Both misses, by when: neither named as a count it already gave.
    expect(first[0]!.text).toMatch(/ on \w+ \d{1,2} and \w+ \d{1,2}[:.]/);
    expect(first[0]!.text).not.toMatch(/rehearsals they’ve missed with you/);
    // TEST SETUP: the classmate's last 20 moments filled with other things, as a year of class would, so nothing of the
    // apology is left in them; and a year of class days after.
    const p = personOf(mate);
    p.moments = Array.from({ length: 20 }, (_, n) => ({ at: sim.now - n * MS_DAY, kind: 'study' as MomentKind, choice: 'no' }));
    expect(p.moments.some((m) => m.kind === 'apology')).toBe(false);
    expect(moments(sim, 120).filter((m) => m.kind === 'apology'), 'none again for the same misses').toHaveLength(0);
    // A new miss is a new incident, owed its own.
    a.rehearsals.push({ id: 'miss-3', at: sim.now - MS_DAY, status: 'missedByThem' });
    mateRecord(mate).stoodUp = 3;
    const next = moments(sim, 40).filter((m) => m.kind === 'apology');
    expect(next).toHaveLength(1);
    expect(next[0]!.covers).toEqual(['miss-3']);
    expect(next[0]!.text).toMatch(/That’s three rehearsals they’ve missed with you\./);
  }, 120_000);
});

describe('an apology long after the miss', () => {
  it('says how long it’s been, where the miss was weeks or months ago, and nothing of it where it was days', () => {
    const sim = life('continuity-late');
    const a = toPartneredWork(sim);
    const mate = alone(sim, a.partner!, 'people');
    // TEST SETUP: one rehearsal they didn't come to, five months ago, after you'd met.
    mateRecord(mate).met = sim.now - 200 * MS_DAY;
    a.rehearsals.push({ id: 'old-miss', at: sim.now - 150 * MS_DAY, status: 'missedByThem' });
    mateRecord(mate).stoodUp = 1;
    const late = moments(sim, 40).filter((m) => m.kind === 'apology');
    expect(late).toHaveLength(1);
    expect(late[0]!.text).toMatch(/ It’s (?:five|six) months since, and they still wanted to say it\.$/);
    // The same a few days after: no word of time.
    const sim2 = life('continuity-late');
    const a2 = toPartneredWork(sim2);
    const mate2 = alone(sim2, a2.partner!, 'people');
    a2.rehearsals.push({ id: 'new-miss', at: sim2.now - 2 * MS_DAY, status: 'missedByThem' });
    mateRecord(mate2).stoodUp = 1;
    const soon = moments(sim2, 40).filter((m) => m.kind === 'apology');
    expect(soon).toHaveLength(1);
    expect(soon[0]!.text).not.toMatch(/since, and they still wanted to say it/);
  }, 120_000);
});

describe('what a classmate has asked, counted on them', () => {
  it('counts past the last 20, says how the newest request was answered, and says “before” where a save’s count is a floor', () => {
    const sim = life('continuity-asked');
    const a = toPartneredWork(sim);
    const mate = alone(sim, a.partner!, 'career');
    // TEST SETUP: 24 requests for help before, the newest refused and the oldest kept (newest first, as they're kept).
    const p = personOf(mate);
    p.asked = { help: 24 };
    p.moments = [{ at: sim.now - 20 * MS_DAY, kind: 'help', choice: 'no' }, ...Array.from({ length: 18 }, (_, n) => ({ at: sim.now - (40 + n) * MS_DAY, kind: 'study' as MomentKind })), { at: sim.now - 200 * MS_DAY, kind: 'help', choice: 'help' }];
    const help = moments(sim, 40).filter((m) => m.kind === 'help');
    expect(help.length).toBeGreaterThan(0);
    expect(help[0]!.text).toMatch(/ It’s the 25th time they’ve asked, and last time you said you couldn’t\.$/);
    expect(p.asked.help).toBeGreaterThanOrEqual(25);
    // A count begun from a full history is a floor: said as before, with how the last went.
    const sim2 = life('continuity-asked-floor');
    const a2 = toPartneredWork(sim2);
    const mate2 = alone(sim2, a2.partner!, 'career');
    const p2 = personOf(mate2);
    p2.asked = { help: 3 };
    p2.countedSince = sim2.now - 300 * MS_DAY;
    p2.moments = [{ at: sim2.now - 20 * MS_DAY, kind: 'help', choice: 'help' }];
    const floor = moments(sim2, 40).filter((m) => m.kind === 'help');
    expect(floor.length).toBeGreaterThan(0);
    expect(floor[0]!.text).toMatch(/ They’ve asked before, and you helped them last time\.$/);
  }, 120_000);
});

describe('a classmate’s way of asking', () => {
  it('is their own, the same each time they ask, and the class doesn’t share one', () => {
    const sim = life('continuity-ways');
    const a = toPartneredWork(sim);
    const mate = alone(sim, a.partner!, 'career');
    const asks = moments(sim, 120).filter((m) => m.kind === 'help');
    expect(asks.length).toBeGreaterThanOrEqual(2);
    // The same sentence, but for the count of times asked that follows it.
    const opening = (t: string) => t.split(/(?<=\.) (?=It’s the|They’ve asked)/)[0];
    expect(new Set(asks.map((m) => opening(m.text))).size, asks.map((m) => m.text).join(' | ')).toBe(1);
    expect(asks[0]!.text.startsWith(mate.name.split(' ')[0]!) || asks[0]!.text.includes(` ${mate.name.split(' ')[0]!} `)).toBe(true);
    // Across the class, each kind said more than one way.
    const ways = sim.player.school!.classmates.map((m) => wayOf(m, 'help', 3));
    expect(new Set(ways).size).toBeGreaterThan(1);
  }, 180_000);
});

describe('a save from before brief 17, opened', () => {
  it('marks each miss an apology it keeps covered, takes one from before all it remembers as covered, leaves one after the last owed, and counts what was asked', () => {
    const sim = life('continuity-migrate');
    const a = toPartneredWork(sim);
    const i = a.partner!;
    const u = sim.universe;
    const school = u.people[u.playerId]!.school! as typeof sim.player.school & { missesMarked?: true };
    const mate = school!.classmates[i]!;
    const t = sim.now;
    // TEST SETUP: a save as brief 16 left one: misses unmarked, the marker absent, and the classmate's last 20 moments
    // holding one apology, between the misses.
    delete school!.missesMarked;
    mateRecord(mate).met = t - 400 * MS_DAY;
    a.rehearsals.push(
      { id: 'old', at: t - 300 * MS_DAY, status: 'missedByThem' },
      { id: 'covered', at: t - 30 * MS_DAY, status: 'missedByThem' },
      { id: 'owed', at: t - 5 * MS_DAY, status: 'missedByThem' },
    );
    personOf(mate).moments = [
      { at: t - 10 * MS_DAY, kind: 'apology', choice: 'accept' },
      ...Array.from({ length: 19 }, (_, n) => ({ at: t - (20 + n * 5) * MS_DAY, kind: 'help' as MomentKind, choice: 'help' })),
    ];
    delete personOf(mate).asked;
    const r = migrate(u);
    const by = (id: string) => a.rehearsals.find((x) => x.id === id)!;
    // Before the oldest moment kept (twenty, full): taken as covered then.
    expect(by('old').apologized).toBe(Math.min(...personOf(mate).moments!.map((m) => m.at)));
    expect(by('covered').apologized).toBe(t - 10 * MS_DAY);
    expect(by('owed').apologized).toBeUndefined();
    expect(school!.missesMarked).toBe(true);
    expect(personOf(mate).asked).toEqual({ apology: 1, help: 19 });
    expect(personOf(mate).countedSince).toBeDefined();
    expect(r.steps.join(' ')).toMatch(/Marked 1 missed rehearsal as apologized for/);
    expect(r.steps.join(' ')).toMatch(/Took 1 missed rehearsal from before what the save remembers/);
    // Once: opened again, nothing is marked twice.
    const again = migrate(u);
    expect(again.steps.join(' ')).not.toMatch(/apologized for/);
    expect(missesOwed(courseworkOf(sim, sim.player)!, mate, i).map((x) => x.r.id)).toEqual(['owed']);
    // A new life starts marked, so nothing of this runs for it.
    expect(life('continuity-new').player.school?.missesMarked ?? (sim.player.school as { missesMarked?: true }).missesMarked).toBe(true);
  }, 120_000);
});

describe('momentsOf is the coursework’s own list', () => {
  it('is untouched by the marking', () => {
    const sim = life('continuity-list');
    toPartneredWork(sim);
    expect(Array.isArray(momentsOf(courseworkOf(sim, sim.player)!))).toBe(true);
  });
});
