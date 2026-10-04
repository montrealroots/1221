/**
 * Going to a club by hand (`systems/clubs.ts`, from 2026-10-03): the clock
 * stops at the time to set out, a trip there on foot, by transit or by car,
 * checked in, the session, staying after, and home; meetings answered ahead,
 * missed, canceled for a storm and renewed; automatic going only where it's
 * the preference, on a trip's rules; and all of it kept across a save.
 */
import { describe, expect, it } from 'vitest';
import { loadSave, quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { CLUB_CLOSE_KIND, CLUB_DUE_KIND, canceledFor, clubById, legTo, meetingsAhead, membershipsOf, nextMeeting } from '@/engine/systems/clubs';
import { contactsOf } from '@/engine/systems/people';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { runErrands, transitFare } from '@/engine/systems/trips';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const memoCount = (sim: ReturnType<typeof life>, memo: string) => Object.values(sim.universe.transactions).filter((t) => t.memo === memo).length;

describe('going to a club by hand', () => {
  it('joined asking, the clock stops at the time to set out, and nothing is gone to on its own', () => {
    const sim = life('us-ny-newyork', 'club-ask');
    sim.must({ kind: 'club.join', payload: { clubId: 'parkrun-brooklyn-bridge' } });
    const club = clubById('parkrun-brooklyn-bridge')!;
    const m = membershipsOf(sim.player)[0]!;
    expect(m.attend).toBe('ask');
    const meeting = nextMeeting(club, sim.now);
    const stop = sim.advanceTo(meeting + MS_DAY, { stopOnPlayerRequired: true });
    expect(stop.interruptedBy?.kind).toBe(CLUB_DUE_KIND);
    expect(stop.interruptedBy!.at).toBe(meeting - Math.round(legTo(club, 'foot').minutes * 60_000) - 10 * 60_000);
    // Carried on without going: missed, and nobody met.
    sim.advanceTo(meeting + MS_DAY);
    expect(m.went).toBe(0);
    expect(m.missed).toBe(1);
    expect(m.log?.[0]).toMatchObject({ at: meeting, what: 'missed' });
    expect(m.contactId).toBeUndefined();
  });

  it('set out on foot: there, waiting, the run, home, and someone from it met', () => {
    const sim = life('us-ny-newyork', 'club-go-foot');
    sim.must({ kind: 'club.join', payload: { clubId: 'parkrun-brooklyn-bridge' } });
    const club = clubById('parkrun-brooklyn-bridge')!;
    const meeting = nextMeeting(club, sim.now);
    sim.advanceTo(meeting + MS_DAY, { stopOnPlayerRequired: true });
    const r = sim.must<{ at: number; minutes: number }>({ kind: 'club.go', payload: { clubId: club.id, by: 'foot' } });
    expect(r.at).toBe(meeting);
    expect(r.minutes).toBeCloseTo(31, 6);
    const m = membershipsOf(sim.player)[0]!;
    expect(m.went).toBe(1);
    expect(m.log?.[0]).toMatchObject({ at: meeting, what: 'went' });
    // Home again a walk after the run's end.
    expect(sim.now).toBe(meeting + 31 * 60_000 + Math.round(legTo(club, 'foot').minutes * 60_000));
    expect(sim.player.trip).toBeUndefined();
    expect(contactsOf(sim.player).find((c) => c.id === m.contactId)?.met).toMatchObject({ how: 'club' });
    // The meeting's own moment, passed, doesn't count it twice.
    sim.advanceBy(2 * MS_DAY);
    expect(m.went).toBe(1);
    expect(m.missed).toBeUndefined();
    expect(sim.execute({ kind: 'club.go', payload: { clubId: club.id } }).error).toMatch(/set out within 3 hours/);
  });

  it('by transit, a fare each way at the town’s own fare', () => {
    const sim = life('us-ny-newyork', 'club-go-transit');
    sim.must({ kind: 'club.join', payload: { clubId: 'nyrr-open-run-morningside' } });
    const meeting = nextMeeting(clubById('nyrr-open-run-morningside')!, sim.now);
    sim.advanceTo(meeting - 60 * 60_000);
    sim.must({ kind: 'club.go', payload: { clubId: 'nyrr-open-run-morningside', by: 'transit' } });
    expect(memoCount(sim, 'New York’s transit, a ride')).toBe(2);
  });

  it('too late to get there by halfway is refused, and a late arrival takes part for what’s left', () => {
    const club = clubById('waltons-guitar')!;
    const sim = life('ie-lei-dublin', 'club-late');
    sim.must({ kind: 'club.join', payload: { clubId: club.id } });
    const meeting = nextMeeting(club, sim.now);
    sim.advanceTo(meeting + 25 * 60_000);
    expect(sim.execute({ kind: 'club.go', payload: { clubId: club.id, by: 'foot' } }).error).toMatch(/past halfway/);
    const sim2 = life('ie-lei-dublin', 'club-late');
    sim2.must({ kind: 'club.join', payload: { clubId: club.id } });
    sim2.advanceTo(meeting + 5 * 60_000);
    const r = sim2.must<{ minutes: number }>({ kind: 'club.go', payload: { clubId: club.id, by: 'foot' } });
    expect(r.minutes).toBeLessThan(60);
    expect(membershipsOf(sim2.player)[0]!.log?.[0]?.note).toMatch(/^Late/);
  });

  it('staying after meets one more of the club each time', () => {
    const sim = life('uk-eng-london', 'club-stay');
    sim.must({ kind: 'club.join', payload: { clubId: 'parkrun-battersea' } });
    const club = clubById('parkrun-battersea')!;
    let at = nextMeeting(club, sim.now);
    for (let i = 0; i < 3; i += 1) {
      sim.advanceTo(at - 60 * 60_000);
      sim.must({ kind: 'club.go', payload: { clubId: club.id, by: 'foot', stayAfter: true } });
      at = nextMeeting(club, sim.now);
    }
    const m = membershipsOf(sim.player)[0]!;
    expect(m.went).toBe(3);
    expect(m.met?.length).toBe(3);
    expect(contactsOf(sim.player).filter((c) => c.met?.how === 'club').length).toBe(4);
  });

  it('answered not going: no moment to set out, and it’s marked declined; answered going and not gone, it’s said', () => {
    const sim = life('us-ny-newyork', 'club-rsvp');
    sim.must({ kind: 'club.join', payload: { clubId: 'parkrun-brooklyn-bridge' } });
    const club = clubById('parkrun-brooklyn-bridge')!;
    const [first, second] = meetingsAhead(club, sim.now, 2);
    sim.must({ kind: 'club.rsvp', payload: { clubId: club.id, at: first, going: false } });
    expect(sim.execute({ kind: 'club.rsvp', payload: { clubId: club.id, at: first! + 1, going: true } }).error).toBe('That isn’t one of its next meetings.');
    const stop = sim.advanceTo(first! + MS_DAY, { stopOnPlayerRequired: true });
    expect(stop.interruptedBy?.kind === CLUB_DUE_KIND && stop.interruptedBy.payload.meetingAt === first).toBe(false);
    sim.advanceTo(first! + MS_DAY);
    const m = membershipsOf(sim.player)[0]!;
    expect(m.log?.[0]).toMatchObject({ at: first, what: 'declined' });
    expect(m.missed).toBeUndefined();
    sim.must({ kind: 'club.rsvp', payload: { clubId: club.id, at: second, going: true } });
    sim.advanceTo(second! + MS_DAY);
    expect(m.missed).toBe(1);
    expect(sim.universe.notifications.some((n) => n.title === 'Missed')).toBe(true);
  });

  it('on its own by transit pays the fares there and back', () => {
    const sim = life('us-ny-newyork', 'club-auto-transit');
    sim.must({ kind: 'club.join', payload: { clubId: 'parkrun-brooklyn-bridge', attend: 'always', by: 'transit' } });
    sim.advanceBy(8 * MS_DAY);
    const m = membershipsOf(sim.player)[0]!;
    expect(m.went).toBeGreaterThanOrEqual(1);
    expect(memoCount(sim, 'New York’s transit, there and back')).toBe(m.went);
    const paid = Object.values(sim.universe.transactions).find((t) => t.memo === 'New York’s transit, there and back')!;
    expect(paid.postings.filter((x) => x.amount > 0).reduce((n, x) => n + x.amount, 0)).toBe(2 * transitFare(sim, 'us-ny-newyork')!);
  });

  it('an outdoor club doesn’t meet in a thunderstorm, and an indoor one does', () => {
    const sim = life('us-ny-newyork', 'club-storm');
    const kickball = clubById('volo-ny-kickball')!;
    let at = nextMeeting(kickball, sim.now);
    let found: number | undefined;
    for (let i = 0; i < 300 && found === undefined; i += 1) { if (canceledFor(sim, kickball, at)) found = at; at = nextMeeting(kickball, at); }
    expect(found).toBeDefined();
    expect(canceledFor(sim, clubById('ymca-cross-island-swim')!, found!)).toBeUndefined();
  });

  it('a season renewed at its end runs another, its fee paid again; renewed by hand, it runs on', () => {
    const sim = life('us-ny-newyork', 'club-renew');
    sim.must({ kind: 'club.join', payload: { clubId: 'volo-ny-kickball', attend: 'always', renew: true } });
    sim.advanceBy(50 * MS_DAY);
    expect(membershipsOf(sim.player).length).toBe(1);
    expect(memoCount(sim, 'Volo Kickball, a season renewed')).toBe(1);
    const sim2 = life('us-ny-newyork', 'club-renew-hand');
    sim2.must({ kind: 'club.join', payload: { clubId: 'volo-ny-kickball' } });
    const until = membershipsOf(sim2.player)[0]!.until!;
    expect(sim2.must<{ until: number }>({ kind: 'club.renew', payload: { clubId: 'volo-ny-kickball' } }).until).toBe(until + 6 * 7 * MS_DAY);
    expect(sim2.execute({ kind: 'club.renew', payload: { clubId: 'parkrun-brooklyn-bridge' } }).error).toBe('You aren’t in it.');
  });

  it('kept across a save: the answer given, the moment to set out, and going after loading', () => {
    const sim = life('us-ny-newyork', 'club-save');
    sim.must({ kind: 'club.join', payload: { clubId: 'parkrun-brooklyn-bridge', by: 'transit' } });
    const club = clubById('parkrun-brooklyn-bridge')!;
    const [first] = meetingsAhead(club, sim.now, 1);
    sim.must({ kind: 'club.rsvp', payload: { clubId: club.id, at: first, going: true } });
    const back = loadSave(deserialise(serialise(sim.universe)) as never);
    const m = membershipsOf(back.player)[0]!;
    expect(m.rsvp?.[String(first)]).toBe('going');
    expect(m.by).toBe('transit');
    const stop = back.advanceTo(first! + MS_DAY, { stopOnPlayerRequired: true });
    expect(stop.interruptedBy?.kind).toBe(CLUB_DUE_KIND);
    back.must({ kind: 'club.go', payload: { clubId: club.id, by: 'transit' } });
    expect(m.went).toBe(1);
    back.advanceTo(first! + MS_DAY);
    expect(m.went).toBe(1);
    expect(m.missed).toBeUndefined();
  });

  it('automatic going needs a way there that works', () => {
    const sim = life('us-ny-newyork', 'club-set');
    sim.must({ kind: 'club.join', payload: { clubId: 'parkrun-brooklyn-bridge' } });
    expect(sim.execute({ kind: 'club.set', payload: { clubId: 'parkrun-brooklyn-bridge', attend: 'always', by: 'car', vehicleId: 'nope' } }).error).toBe('That isn’t a car you own.');
    sim.must({ kind: 'club.set', payload: { clubId: 'parkrun-brooklyn-bridge', attend: 'always', by: 'foot' } });
    expect(membershipsOf(sim.player)[0]!.attend).toBe('always');
    expect(sim.universe.scheduled.some((i) => i.status === 'pending' && i.kind === CLUB_DUE_KIND)).toBe(false);
  });
  it('a membership from before, its meeting with no end on the calendar, carries on week to week', () => {
    const sim = life('us-ny-newyork', 'club-old');
    sim.must({ kind: 'club.join', payload: { clubId: 'parkrun-brooklyn-bridge', attend: 'always' } });
    const m = membershipsOf(sim.player)[0]!;
    // As a save from before had it: no attend, and only the meeting itself scheduled.
    delete m.attend; delete m.by;
    for (const i of sim.universe.scheduled) if (i.status === 'pending' && i.kind === CLUB_CLOSE_KIND) sim.timeline.cancel(i.id, sim.now);
    sim.advanceBy(22 * MS_DAY);
    expect(m.went).toBeGreaterThanOrEqual(3);
  });

  it('errands by transit pay the town’s fare for each leg', () => {
    const sim = life('ca-on-toronto', 'errand-transit');
    const before = sim.now;
    sim.must({ kind: 'errand.go', payload: { to: 'shopping', by: 'transit' } });
    sim.must({ kind: 'errand.go', payload: { to: 'home' } });
    expect(sim.now - before).toBe(2 * 30 * 60_000);
    expect(Object.values(sim.universe.transactions).filter((t) => t.memo === 'Toronto’s transit, a ride').length).toBe(2);
  });
  it('set to go on its own and gone to by hand instead: gone once, not missed, and not gone again', () => {
    const sim = life('us-ny-newyork', 'club-both');
    sim.must({ kind: 'club.join', payload: { clubId: 'parkrun-brooklyn-bridge', attend: 'always' } });
    const club = clubById('parkrun-brooklyn-bridge')!;
    const meeting = nextMeeting(club, sim.now);
    sim.advanceTo(meeting - 60 * 60_000);
    sim.must({ kind: 'club.go', payload: { clubId: club.id, by: 'foot' } });
    const m = membershipsOf(sim.player)[0]!;
    expect(m.went).toBe(1);
    expect(m.missed).toBeUndefined();
    // Gone on its own at the start, it can't be gone to again before halfway.
    const sim2 = life('us-ny-newyork', 'club-both');
    sim2.must({ kind: 'club.join', payload: { clubId: club.id, attend: 'always' } });
    sim2.advanceTo(meeting + 5 * 60_000);
    expect(membershipsOf(sim2.player)[0]!.went).toBe(1);
    expect(sim2.execute({ kind: 'club.go', payload: { clubId: club.id, by: 'foot' } }).error).toBe('That meeting’s been and gone.');
  });
  it('a meeting as a stop on a run of errands, checked in as Set Out would, and refused off its day', () => {
    const sim = life('ca-on-toronto', 'club-errand');
    sim.must({ kind: 'club.join', payload: { clubId: 'parkdale-roadrunners' } });
    const club = clubById('parkdale-roadrunners')!;
    expect(sim.execute({ kind: 'errand.go', payload: { to: 'errand', by: 'foot' } }).ok).toBe(true);
    expect(sim.execute({ kind: 'club.check_in', payload: { clubId: club.id } }).error).toBe('It isn’t meeting now.');
    sim.must({ kind: 'errand.go', payload: { to: 'home' } });
    const meeting = nextMeeting(club, sim.now);
    sim.advanceTo(meeting - 2 * 60 * 60_000);
    const r = runErrands(sim, { by: 'transit', stops: [{ kind: 'club.check_in', payload: { clubId: club.id }, leg: 'errand' }] });
    expect(r).toEqual({ done: 1 });
    expect(membershipsOf(sim.player)[0]!.went).toBe(1);
    expect(sim.player.trip).toBeUndefined();
  });
});
