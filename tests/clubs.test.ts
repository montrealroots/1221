/**
 * Clubs (`systems/clubs.ts`, from 2026-10-03): parkrun, running clubs and
 * leagues, each meeting weekly at its own day and time; gone to where you're
 * in town and free, with its exercise and someone from it met.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY, instantFromZoned, zonedParts } from '@/engine/core/time';
import { clubById, membershipsOf, nextMeeting } from '@/engine/systems/clubs';
import { contactsOf } from '@/engine/systems/people';
import { inSaveMoney } from '@/engine/systems/banking';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const NY = 'America/New_York';

describe('a club', () => {
  it('meets at its own hour, parkrun at Brooklyn Bridge at eight in summer and nine in winter', () => {
    const club = clubById('parkrun-brooklyn-bridge')!;
    const june = nextMeeting(club, instantFromZoned({ year: 2027, month: 6, day: 1, hour: 12 }, NY));
    expect([zonedParts(june, NY).weekday, zonedParts(june, NY).hour]).toEqual([6, 8]);
    const jan = nextMeeting(club, instantFromZoned({ year: 2027, month: 1, day: 4, hour: 12 }, NY));
    expect([zonedParts(jan, NY).weekday, zonedParts(jan, NY).hour]).toEqual([6, 9]);
  });

  it('is gone to each week in town: its run, and someone from it met and seen again', () => {
    const sim = life('us-ny-newyork', 'club-parkrun');
    const p = sim.player;
    sim.must({ kind: 'club.join', payload: { clubId: 'parkrun-brooklyn-bridge' } });
    expect(sim.execute({ kind: 'club.join', payload: { clubId: 'parkrun-brooklyn-bridge' } }).error).toBe('You’re in it.');
    sim.advanceBy(15 * MS_DAY);
    const m = membershipsOf(p)[0]!;
    expect(m.went).toBeGreaterThanOrEqual(1);
    const friend = contactsOf(p).find((c) => c.id === m.contactId)!;
    expect(friend.met).toMatchObject({ how: 'club', what: 'Brooklyn Bridge parkrun' });
    expect(friend.hours).toBeCloseTo(m.went * 31 / 60, 6);
    expect(friend.lastSeen).toBeDefined();
    // Away, the week's run is missed.
    const went = m.went;
    p.currentLocationId = 'uk-eng-london';
    sim.advanceBy(8 * MS_DAY);
    expect(m.went).toBe(went);
  });

  it('a league takes its season’s fee and ends with its season', () => {
    const sim = life('us-ny-newyork', 'club-league');
    const p = sim.player;
    const r = sim.must<{ paid: number }>({ kind: 'club.join', payload: { clubId: 'volo-ny-kickball' } });
    expect(r.paid).toBe(inSaveMoney(sim, 135_00, 'USD'));
    sim.advanceBy(50 * MS_DAY);
    expect(membershipsOf(p)).toEqual([]);
    expect(sim.execute({ kind: 'club.join', payload: { clubId: 'parkrun-bushy' } }).error).toBe('Bushy parkrun is joined in London.');
  });

  it('a week-by-week league charges at each game: GO Mammoth, £11.10', () => {
    const sim = life('uk-eng-london', 'club-weekly');
    expect(sim.must<{ paid: number }>({ kind: 'club.join', payload: { clubId: 'go-mammoth-netball' } }).paid).toBe(0);
    sim.advanceBy(8 * MS_DAY);
    const weeks = Object.values(sim.universe.transactions).filter((t) => t.memo === 'GO Mammoth Netball, the week');
    expect(weeks.length).toBe(membershipsOf(sim.player)[0]!.went);
    expect(weeks.length).toBeGreaterThanOrEqual(1);
  });
});
