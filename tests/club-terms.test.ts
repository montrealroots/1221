/**
 * Each club's own terms (`ClubTerms` in `content/clubs.ts`, `leavingBack` and
 * `calledOff` in `systems/clubs.ts`, from 2026-10-05, read from each
 * provider's page in `research-club-terms.json`): what leaving gives back of
 * a season paid ahead, step by step; a credit held with a provider and paid
 * toward its next club; a meeting called off made up or credited by the
 * club's rule; and a season booked to start weeks ahead.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { inSaveMoney } from '@/engine/systems/banking';
import { aheadFor, calledOff, canceledFor, clubById, creditWith, leavingBack, meetingsAhead, membershipsOf, nextMeeting, type Membership } from '@/engine/systems/clubs';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const join = (sim: Simulation, clubId: string, ahead = 0) => sim.must<{ paid: number; first: number }>({ kind: 'club.join', payload: { clubId, ahead } });
const mine = (sim: Simulation, clubId: string) => membershipsOf(sim.player).find((m) => m.clubId === clubId)!;
const backPosted = (sim: Simulation, memo: string) => sim.universe.transactions.filter((t) => t.memo === memo).flatMap((t) => t.postings).filter((q) => q.accountId === sim.player.primaryAccountId).reduce((n, q) => n + q.amount, 0);

describe('leaving, by the provider’s own terms', () => {
  it('Trinity Sport: all of it back with a week’s notice before the course, nothing after', () => {
    const sim = life('ie-lei-dublin', 'terms-trinity');
    const { paid } = join(sim, 'trinity-sport-swim', 2);
    const r = sim.must<{ back: number; credit: number }>({ kind: 'club.leave', payload: { clubId: 'trinity-sport-swim' } });
    expect(r).toMatchObject({ back: paid, credit: 0 });
    expect(backPosted(sim, 'Adult Swimming, back on leaving')).toBe(paid);
    // Joined to start this week, the notice can't be given: nothing back.
    join(sim, 'trinity-sport-swim');
    expect(sim.must<{ back: number }>({ kind: 'club.leave', payload: { clubId: 'trinity-sport-swim' } }).back).toBe(0);
  });

  it('Toronto: pro-rated by the classes left up to the third, less C$14.13', () => {
    const sim = life('ca-on-toronto', 'terms-toronto');
    const club = clubById('toronto-st-lawrence-swim')!;
    const { paid, first } = join(sim, club.id);
    sim.advanceTo(first + 3 * MS_DAY);
    const season = meetingsAhead(club, first - 1, club.seasonWeeks!);
    const left = season.filter((x) => x > sim.now).length;
    const fee = inSaveMoney(sim, 1413, 'CAD');
    expect(leavingBack(sim, club, mine(sim, club.id)).back).toBe(Math.round((paid * left) / season.length) - fee);
    // From the third class on, nothing.
    sim.advanceTo(season[2]! + MS_DAY);
    expect(leavingBack(sim, club, mine(sim, club.id)).back).toBe(0);
  });

  it('Kensington: in full five days before, then less a class, then less two, then nothing', () => {
    const sim = life('ca-bc-vancouver', 'terms-kensington');
    const club = clubById('vancouver-kensington-swim')!;
    const { paid, first } = join(sim, club.id, 2);
    const each = Math.round(paid / club.seasonWeeks!);
    const second = first + 7 * MS_DAY;
    const back = () => leavingBack(sim, club, mine(sim, club.id)).back;
    expect(back()).toBe(paid);
    sim.advanceTo(first - 2 * MS_DAY);
    expect(back()).toBe(paid - each);
    sim.advanceTo(first + MS_DAY);
    expect(back()).toBe(paid - each);
    sim.advanceTo(second - 3 * MS_DAY);
    expect(back()).toBe(paid - 2 * each);
    sim.advanceTo(second + MS_DAY);
    expect(back()).toBe(0);
  });

  it('the New Haven YMCA: back less $10 until it starts; Volo, a week-paid league and Bulldog: nothing', () => {
    const sim = life('us-ct-newhaven', 'terms-ymca');
    const club = clubById('ymca-new-haven-swim')!;
    const { paid, first } = join(sim, club.id);
    expect(leavingBack(sim, club, mine(sim, club.id)).back).toBe(paid - inSaveMoney(sim, 1000, 'USD'));
    sim.advanceTo(first + MS_DAY);
    expect(leavingBack(sim, club, mine(sim, club.id)).back).toBe(0);
    join(sim, 'bulldog-tennis-clinic', 1);
    expect(leavingBack(sim, clubById('bulldog-tennis-clinic')!, mine(sim, 'bulldog-tennis-clinic')).back).toBe(0);
    join(sim, 'new-haven-pickleball');
    expect(leavingBack(sim, clubById('new-haven-pickleball')!, mine(sim, 'new-haven-pickleball')).why).toMatch(/^Paid by the week/);
    const ny = life('us-ny-newyork', 'terms-volo');
    join(ny, 'volo-ny-kickball', 3);
    expect(ny.must<{ back: number; credit: number }>({ kind: 'club.leave', payload: { clubId: 'volo-ny-kickball' } })).toMatchObject({ back: 0, credit: 0 });
  });

  it('Barnsdall: a year’s credit less the lab fee, paid toward its next class, gone after the year', () => {
    const sim = life('us-ca-losangeles', 'terms-barnsdall');
    const club = clubById('barnsdall-painting')!;
    const { paid } = join(sim, club.id);
    const lab = inSaveMoney(sim, 3000, 'USD');
    expect(sim.must<{ back: number; credit: number }>({ kind: 'club.leave', payload: { clubId: club.id } })).toMatchObject({ back: 0, credit: paid - lab });
    expect(creditWith(sim.player, 'barnsdall', sim.now)).toBe(paid - lab);
    // Joined again: the credit first, the bank only the lab fee's worth.
    const before = sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
    join(sim, club.id);
    expect(before - sim.universe.accounts[sim.player.primaryAccountId!]!.balance).toBe(lab);
    expect(creditWith(sim.player, 'barnsdall', sim.now)).toBe(0);
    // A credit not used within the year is gone.
    sim.player.clubCredits = [{ provider: 'barnsdall', amount: 5_000, from: club.name, until: sim.now + 365 * MS_DAY }];
    expect(creditWith(sim.player, 'barnsdall', sim.now + 366 * MS_DAY)).toBe(0);
  });
});

describe('a meeting called off, by the club’s own rule', () => {
  const member = (sim: Simulation, clubId: string): Membership => { join(sim, clubId); return mine(sim, clubId); };

  it('Volo makes up two a season, a week on each, and credits a game past them, toward any Volo league', () => {
    const sim = life('us-ny-newyork', 'off-volo');
    const club = clubById('volo-ny-kickball')!;
    const m = member(sim, club.id);
    const until = m.until!;
    expect(calledOff(sim.player, club, m)).toBe('a week added on to the season');
    expect(calledOff(sim.player, club, m)).toBe('a week added on to the season');
    expect(m.until).toBe(until + 14 * MS_DAY);
    expect(calledOff(sim.player, club, m)).toBe('a game’s credit, past the make-ups it guarantees');
    expect(m.until).toBe(until + 14 * MS_DAY);
    expect(creditWith(sim.player, 'volo', sim.now)).toBe(Math.round(m.paid! / club.seasonWeeks!));
  });

  it('GO Mammoth adds a week each time; New Haven’s pickleball only past the second; a club with no rule, nothing', () => {
    const ldn = life('uk-eng-london', 'off-mammoth');
    const go = clubById('go-mammoth-netball')!;
    const m = member(ldn, go.id);
    const until = m.until!;
    for (let i = 0; i < 3; i += 1) calledOff(ldn.player, go, m);
    expect(m.until).toBe(until + 21 * MS_DAY);
    const nh = life('us-ct-newhaven', 'off-pickle');
    const pickle = clubById('new-haven-pickleball')!;
    const p = member(nh, pickle.id);
    const end = p.until!;
    expect(calledOff(nh.player, pickle, p)).toBeUndefined();
    expect(calledOff(nh.player, pickle, p)).toBeUndefined();
    expect(calledOff(nh.player, pickle, p)).toBe('a week added on to the season');
    expect(p.until).toBe(end + 7 * MS_DAY);
    const dub = life('ie-lei-dublin', 'off-firmballs');
    const fives = clubById('firmballs-spawell-fives')!;
    expect(calledOff(dub.player, fives, member(dub, fives.id))).toBeUndefined();
  });

  it('a thunderstorm on a Volo game adds its week on, and says so', () => {
    const sim = life('us-ny-newyork', 'club-storm');
    const club = clubById('volo-ny-kickball')!;
    let at = nextMeeting(club, sim.now);
    let storm: number | undefined;
    for (let i = 0; i < 300 && storm === undefined; i += 1) { if (canceledFor(sim, club, at)) storm = at; at = nextMeeting(club, at); }
    expect(storm).toBeDefined();
    // Joined to have the storm in its season.
    sim.advanceTo(storm! - 10 * MS_DAY);
    join(sim, club.id);
    const m = mine(sim, club.id);
    const until = m.until!;
    sim.advanceTo(storm! + 2 * 3_600_000);
    expect(m.log?.find((l) => l.at === storm)?.note).toBe('A thunderstorm: a week added on to the season');
    expect(m.until).toBe(until + 7 * MS_DAY);
  });
});

describe('a season booked ahead (from 2026-10-05)', () => {
  it('starts weeks on: nothing to go to before it, its meetings answered from its start', () => {
    const sim = life('ie-lei-dublin', 'ahead-trinity');
    const club = clubById('trinity-sport-tennis')!;
    const { first } = join(sim, club.id, 3);
    expect(first - sim.now).toBeGreaterThan(21 * MS_DAY);
    const m = mine(sim, club.id);
    expect(m.seasonFrom).toBe(first);
    expect(aheadFor(club, m, sim.now)[0]).toBe(first);
    expect(m.until).toBe(first + (club.seasonWeeks! - 1) * 7 * MS_DAY);
    // A week before it starts, there's nothing to set out for.
    sim.advanceTo(first - 7 * MS_DAY);
    expect(sim.execute({ kind: 'club.go', payload: { clubId: club.id } }).error).toMatch(/^It meets|^Its season starts/);
    expect(sim.execute({ kind: 'club.join', payload: { clubId: 'parkrun-fairview', ahead: 1 } }).error).toBe('It meets every week: it starts when you join.');
    expect(sim.execute({ kind: 'club.join', payload: { clubId: 'trinity-sport-swim', ahead: 5 } }).error).toBe('From this week to 4 weeks on.');
  });
});

describe('a course in the actor’s craft (from 2026-10-05)', () => {
  it('grows the skill it trains by a session at the readiness they come with, a share of one where they came late', async () => {
    const { ceilingOf, evenCraft, focusOf, sessionGain } = await import('@/engine/systems/school');
    const sim = life('us-ny-newyork', 'course-singing');
    sim.player.craft = evenCraft(40);
    const club = clubById('hb-singing-voice-1')!;
    expect(club.trains).toBe('singing');
    const { first } = join(sim, club.id);
    sim.advanceTo(first - 2 * 3_600_000, { stopOnPlayerRequired: true });
    const craft = sim.player.craft;
    const before = { ...craft };
    // Checked in at the start: a whole session.
    const r = sim.execute({ kind: 'club.go', payload: { clubId: club.id, by: 'foot' } });
    expect(r.ok, r.error).toBe(true);
    expect(craft.singing).toBeGreaterThan(before.singing);
    for (const k of Object.keys(before) as (keyof typeof before)[]) if (k !== 'singing') expect(craft[k]).toBe(before[k]);
    expect(craft.singing - before.singing).toBeLessThanOrEqual(sessionGain(before.singing, 1.2, 1, ceilingOf(craft, 'singing')) + 1e-9);
    expect(focusOf(sim.player)).toBeGreaterThan(0);
    // Every course names a skill an actor's craft has.
    const { SKILLS } = await import('@/engine/content/school');
    const skills = new Set(SKILLS.map((x) => x.id));
    const { CLUBS } = await import('@/engine/content/clubs');
    const courses = CLUBS.filter((c) => c.trains);
    expect(courses.length).toBe(39);
    for (const c of courses) expect(skills.has(c.trains!)).toBe(true);
    expect(new Set(courses.map((c) => c.trains))).toEqual(new Set(['singing', 'voiceover', 'combat', 'accents', 'screen']));
  });

  it('Voice Academy NYC makes up one missed class, a week on, and not a second', async () => {
    const { madeUpFor } = await import('@/engine/systems/clubs');
    const sim = life('us-ny-newyork', 'course-makeup');
    const club = clubById('voice-academy-secrets-of-singing')!;
    join(sim, club.id);
    const m = mine(sim, club.id);
    const until = m.until!;
    expect(madeUpFor(club, m)).toBe(true);
    expect(m.until).toBe(until + 7 * MS_DAY);
    expect(madeUpFor(club, m)).toBe(false);
    expect(madeUpFor(clubById('hb-singing-voice-1')!, member2(sim))).toBe(false);
  });

  it('reads each school’s own schedule: 80% back 14 business days ahead, a deposit kept, Actors Gym’s steps, a credit for two months', () => {
    const la = life('us-ca-losangeles', 'course-voa');
    const voa = clubById('voiceover-academy-intro')!;
    const { paid, first } = join(la, voa.id, 4);
    // Four weeks ahead is past 14 business days: 80% back.
    expect(leavingBack(la, voa, mine(la, voa.id)).back).toBe(Math.round(paid * 0.8));
    la.advanceTo(first - 15 * MS_DAY);
    expect(leavingBack(la, voa, mine(la, voa.id)).back).toBe(0);
    const ny = life('us-ny-newyork', 'course-stella');
    const stella = clubById('stella-adler-film-tv-1')!;
    const s = join(ny, stella.id, 1);
    const deposit = inSaveMoney(ny, 30_000, 'USD');
    expect(leavingBack(ny, stella, mine(ny, stella.id))).toMatchObject({ back: s.paid - deposit, credit: 0 });
    ny.advanceTo(s.first + MS_DAY);
    expect(leavingBack(ny, stella, mine(ny, stella.id))).toMatchObject({ back: 0, credit: Math.round(s.paid * 0.75) - deposit });
    const nh = life('us-ct-newhaven', 'course-actors-gym');
    const gym = clubById('actors-gym-film-tv')!;
    const g = join(nh, gym.id, 2);
    const back = () => leavingBack(nh, gym, mine(nh, gym.id)).back;
    expect(back()).toBe(g.paid - inSaveMoney(nh, 2_500, 'USD'));
    nh.advanceTo(g.first - 3 * MS_DAY);
    expect(back()).toBe(Math.round(g.paid * 0.75));
    nh.advanceTo(g.first + MS_DAY);
    expect(back()).toBe(Math.round(g.paid * 0.5));
    nh.advanceTo(g.first + 8 * MS_DAY);
    expect(back()).toBe(Math.round(g.paid * 0.25));
    nh.advanceTo(g.first + 15 * MS_DAY);
    expect(back()).toBe(0);
    const combat = life('us-ny-newyork', 'course-nycssc');
    const ssc = clubById('nyc-stage-screen-combat')!;
    const c = join(combat, ssc.id, 2);
    const left = combat.must<{ credit: number }>({ kind: 'club.leave', payload: { clubId: ssc.id } });
    expect(left.credit).toBe(c.paid);
    expect(creditWith(combat.player, 'nyc-stage-screen-combat', combat.now + 59 * MS_DAY)).toBe(c.paid);
    expect(creditWith(combat.player, 'nyc-stage-screen-combat', combat.now + 62 * MS_DAY)).toBe(0);
  });
});

/** A membership in HB's singing course, for a club whose terms make nothing up. */
function member2(sim: Simulation): Membership {
  if (!membershipsOf(sim.player).some((m) => m.clubId === 'hb-singing-voice-1')) join(sim, 'hb-singing-voice-1');
  return mine(sim, 'hb-singing-voice-1');
}
