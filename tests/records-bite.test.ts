/**
 * What was kept and only told back, made to count (2026-09-28): an agency
 * remembers how a client left; a showcase's buzz brings managers; credits
 * in a city count with its casting; a loan's term clears it; a breach keeps
 * a term short; a director's note taken reads at the next casting; the
 * final year's stage work reads at the showcase; a classmate's news moves a
 * friend or a rival; a studio rents for less; and where a job has them
 * staying is what they live with there.
 */

import { describe, expect, it } from 'vitest';
import { createSave, quickSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { MS_DAY } from '@/engine/core/time';
import { CommandError, type Simulation } from '@/engine/core/simulation';
import { BUZZ, LOCAL_CREDIT, beginCareer, careerOf, localEdge, showcaseBuzz, takesBack, thesisSeen } from '@/engine/systems/career';
import { castListRead, castScore, evaluate, evenCraft } from '@/engine/systems/school';
import { classmateBooked } from '@/engine/systems/rivals';
import { ROLES } from '@/engine/content/career';
import { canPay } from '@/engine/systems/household';
import { rentersCouncilTax } from '@/engine/systems/homes';
import { heatLoss, placeOf, stayPlace } from '@/engine/systems/dwelling';
import { lookAfterRefusal } from '@/engine/systems/life';

function pro(seed: string): Simulation {
  const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);
  sim.player.craft = evenCraft(75);
  beginCareer(sim, sim.player);
  return sim;
}

describe('an agency', () => {
  it('won’t take back a client who walked out within two years, or one it let go within a year who hasn’t booked since', () => {
    const sim = pro('takes-back');
    const career = careerOf(sim.player);
    career.ended = { agencyId: 'a', at: sim.now - 400 * MS_DAY, reason: 'left', left: true };
    expect(takesBack(sim, sim.player, 'a')).toBe(false);
    expect(takesBack(sim, sim.player, 'b')).toBe(true);
    career.ended = { agencyId: 'a', at: sim.now - 200 * MS_DAY, reason: 'dropped', left: false };
    expect(takesBack(sim, sim.player, 'a')).toBe(false);
    career.lastBookedAt = sim.now - 10 * MS_DAY;
    expect(takesBack(sim, sim.player, 'a')).toBe(true);
  });
});

describe('a showcase', () => {
  it('brings managers in about the months its chance says for half a year after a strong one, and never without one, after it, or below every bar', () => {
    const sim = pro('buzz');
    const career = careerOf(sim.player);
    const months = Array.from({ length: 400 }, (_, n) => sim.now + (n % 170) * MS_DAY + Math.floor(n / 170) * 60_000);
    const share = () => months.filter((at) => showcaseBuzz(sim, sim.player, at).length > 0).length / months.length;
    // No showcase: nobody calls.
    expect(share()).toBe(0);
    // A strong one: a month in about BUZZ.chance, every bar cleared and the odd manager passing.
    career.showcases.push({ cityId: 'us-ny-newyork', at: sim.now, score: 95 });
    expect(share()).toBeGreaterThan(BUZZ.chance * 0.6);
    expect(share()).toBeLessThan(BUZZ.chance * 1.4);
    // Past half a year, it's over.
    expect(months.map((at) => at + BUZZ.days * MS_DAY).filter((at) => showcaseBuzz(sim, sim.player, at).length > 0)).toHaveLength(0);
    // Below every manager's bar, nobody.
    career.showcases = [{ cityId: 'us-ny-newyork', at: sim.now, score: 10 }];
    Object.assign(sim.player.attrs!, { reputation: 0 });
    expect(share()).toBe(0);
    // Managed already, nobody else.
    career.showcases = [{ cityId: 'us-ny-newyork', at: sim.now, score: 95 }];
    career.managerId = 'e360';
    expect(share()).toBe(0);
  });

  it('reads the final year’s lead parts and stage work beside the day’s', () => {
    const sim = pro('thesis');
    const school = sim.player.school ?? (sim.player.school = { classOf: 2027, history: [], credits: [] } as never);
    school.classOf = 2027;
    school.credits = [{ production: 'A Thesis', role: 'Hamlet', kind: 'thesis', year: 2026, wentOn: 3, size: 'lead' }];
    school.history = [{ term: 5, standing: 'good', attendance: 1, growth: 1, classGrowth: 1, reason: '', work: 1 }];
    expect(thesisSeen(sim.player)).toBeGreaterThan(2);
    school.credits = [];
    school.history = [];
    expect(thesisSeen(sim.player)).toBe(0);
  });
});

describe('a city’s casting', () => {
  it('counts the credits made there, to five', () => {
    const sim = pro('local');
    const career = careerOf(sim.player);
    expect(localEdge(sim.player, 'us-ny-newyork')).toBe(1);
    for (let n = 0; n < 7; n += 1) career.credits.push({ roleId: 'costar', year: 2026, cityId: 'us-ny-newyork' } as never);
    expect(localEdge(sim.player, 'us-ny-newyork')).toBeCloseTo(1 + LOCAL_CREDIT.per * LOCAL_CREDIT.most, 6);
    expect(localEdge(sim.player, 'us-ca-losangeles')).toBe(1);
  });
});

describe('the school', () => {
  it('reads a director’s note taken at the next casting', () => {
    const craft = evenCraft(70);
    const reads = { voice: 1 };
    expect(castScore({ craft, last: { size: 'supporting', heeded: true } }, reads)).toBeGreaterThan(castScore({ craft, last: { size: 'supporting' } }, reads));
  });
});

describe('the trades', () => {
  it('lift a friend’s mood with their news, and sting with a rival’s', () => {
    const moved = (bond: number) => {
      const sim = createSave(1, `news-${bond}`, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', tutorial: false });
      const school = sim.player.school!;
      school.classmates[0]!.bond = bond;
      school.classmates[0]!.career = { credits: [] };
      const before = { ...sim.player.wellbeing };
      classmateBooked(sim, sim.player, 0, ROLES.find((r) => r.id === 'series-hour')!, sim.now);
      return { morale: sim.player.wellbeing.morale - before.morale, stress: sim.player.wellbeing.stress - before.stress };
    };
    expect(moved(80).morale).toBeGreaterThan(0);
    expect(moved(-80).stress).toBeGreaterThan(0);
  });
});

describe('a shared flat', () => {
  it('splits its council tax among its bedrooms', () => {
    const sim = quickSave({ startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london', livesWhereBorn: true, wealth: 'wealthy' }, 'flatmates');
    sim.player.home = { ...sim.player.home!, kind: 'shared', unit: { type: 'condo', beds: 2, size: 1300, shared: true, fixtures: sim.player.home!.unit!.fixtures } };
    const two = rentersCouncilTax(sim, sim.player);
    sim.player.home.unit = { ...sim.player.home.unit!, beds: 4 };
    expect(rentersCouncilTax(sim, sim.player)).toBe(Math.round(two / 2));
  });
});

describe('away on a job', () => {
  it('lives with what the stay has: a hotel’s bath and air, a sublet room’s own', () => {
    const sim = pro('stay');
    sim.player.wellbeing.hygiene = 40;
    sim.player.currentLocationId = 'us-ca-losangeles';
    sim.player.stay = { kind: 'hotel', cityId: 'us-ca-losangeles' };
    expect(placeOf(sim, sim.player)?.fixtures.bathtub).toBe(true);
    expect(lookAfterRefusal(sim, 'bathe')).toBeUndefined();
    expect(heatLoss(sim, sim.player, sim.now)).toBe(0);
    const unit = { type: 'condo' as const, beds: 2, size: 900, shared: true, fixtures: { bathtub: false, dishwasher: false, laundry: 'none' as const, cooling: 'none' as const, outdoor: 'none' as const, gym: 'none' as const } };
    sim.player.stay = { kind: 'sublet', cityId: 'us-ca-losangeles', unit };
    expect(stayPlace(sim, sim.player).fixtures.bathtub).toBe(false);
    expect(lookAfterRefusal(sim, 'bathe')).toMatch(/staying/);
  });
});

describe('what can be paid', () => {
  it('counts cash in hand', () => {
    const sim = pro('cash');
    const before = canPay(sim, sim.player);
    const wallet = Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && a.kind === 'cash')
      ?? sim.openAccount({ id: 'wallet', kind: 'cash', name: 'Cash', ownerId: sim.player.id, openedAt: sim.now });
    sim.post({ memo: 'cash', category: 'test', postings: [{ accountId: wallet.id, amount: 50_00 }, { accountId: sim.nominalAccount('equity', 'Opening Balances').id, amount: -50_00 }] });
    expect(canPay(sim, sim.player) - before).toBe(50_00);
  });
});

describe('a grave breach', () => {
  it('keeps the term short of good standing, whatever else went well', () => {
    const standingAfter = (breaches: number) => {
      const sim = createSave(1, 'breach', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', tutorial: false });
      sim.advanceBy(30 * MS_DAY);
      const school = sim.player.school!;
      school.standing = 'concern';
      school.tally.breaches = breaches;
      return evaluate(sim, sim.player, 0)?.standing;
    };
    expect(standingAfter(0)).toBe('good');
    expect(standingAfter(1)).not.toBe('good');
  });
});

describe('the term’s growth', () => {
  it('is weighed against the room each had to grow: the class’s best isn’t warned for growing less, and a stalled student still is', () => {
    const standingAfter = (start: number, grown: number) => {
      const sim = createSave(1, 'room-to-grow', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', tutorial: false });
      sim.advanceBy(30 * MS_DAY);
      const p = sim.player;
      const school = p.school!;
      Object.assign(school.tally, { classDays: 10, attended: 10, excused: 0, calls: 0, answered: 0, shifts: 0, worked: 0, breaches: 0 });
      const craft = p.craft as unknown as Record<string, number>;
      for (const k of Object.keys(craft)) craft[k] = start + grown;
      school.tally.craftAtStart = Object.fromEntries(Object.keys(craft).map((k) => [k, start])) as unknown as typeof school.tally.craftAtStart;
      // The class, at 50, each grew two points: a session's gain at 50 is (0.5)^1.5 of the most.
      school.classmates.forEach((m, i) => { const c = m.craft as unknown as Record<string, number>; for (const k of Object.keys(c)) c[k] = 52; school.tally.classAtStart[i] = 50; });
      return evaluate(sim, p, 0)?.standing;
    };
    // At 90 the room is (0.1)^1.5 of the most, about a ninth of the class's: 0.3 points is its pace.
    expect(standingAfter(90, 0.3)).toBe('good');
    expect(standingAfter(90, 0)).not.toBe('good');
    expect(standingAfter(50, 0.3)).not.toBe('good');
  });
});

describe('the cast list', () => {
  it('lifts them for a lead of their own, and stings when a rival has one', () => {
    const read = (list: { name: string; production: string; part: string; size?: 'lead' | 'supporting' | 'featured' }[], bond = 0) => {
      const sim = createSave(1, 'cast-list', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', tutorial: false });
      const school = sim.player.school!;
      school.classmates[0]!.bond = bond;
      school.around = { term: 0, list };
      const before = { ...sim.player.wellbeing };
      castListRead(sim.player);
      return { morale: sim.player.wellbeing.morale - before.morale, stress: sim.player.wellbeing.stress - before.stress, mate: school.classmates[0]!.name };
    };
    expect(read([{ name: 'You', production: 'A Thesis', part: 'Hamlet', size: 'lead' }]).morale).toBeGreaterThan(0);
    const sim = createSave(1, 'cast-list', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', tutorial: false });
    const mate = sim.player.school!.classmates[0]!.name;
    expect(read([{ name: mate, production: 'A Thesis', part: 'Hamlet', size: 'lead' }], -80).stress).toBeGreaterThan(0);
    expect(read([{ name: mate, production: 'A Thesis', part: 'Hamlet', size: 'supporting' }], -80).stress).toBe(0);
  });
});

describe('a failure in the world', () => {
  it('is said to the player as it happens', () => {
    const sim = pro('failure');
    sim.onCommand('test.fail', () => { throw new CommandError('The bank turned it down.'); });
    sim.onSchedule('test.run', (_item, s) => { s.execute({ kind: 'test.fail', payload: {} }); });
    sim.schedule({ at: sim.now + 60_000, kind: 'test.run', label: 'A Try', category: 'system', payload: {} });
    sim.advanceBy(120_000);
    const said = Object.values(sim.universe.notifications ?? {}).some((n) => (n as { title: string; body: string }).title === 'Something Didn’t Go Through' && (n as { body: string }).body === 'The bank turned it down.');
    expect(said).toBe(true);
  });
});
