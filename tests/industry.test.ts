/**
 * The business outside the player's career (`systems/industry.ts`, from
 * 2026-10-08): one project from an audition through the offer, the booking,
 * the production, the credit and the release, never two; its company's rule
 * for where its episodes are seen; performers who are somebody, with
 * commitments, never in two parts at once, recast when the dates move; a
 * classmate's job a part in a project; a project called off; what's kept and
 * what leaves the record; the player's lists and ratings; and all of it
 * through a save. What isn't a command or the engine's own schedule is
 * marked SETUP.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave, quickSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import { breaches } from '@/engine/core/invariants';
import type { Simulation } from '@/engine/core/simulation';
import { ROLES } from '@/engine/content/career';
import { COMPANIES } from '@/engine/content/industry';
import { afterlife, beginCareer, breakdownsOf, careerOf, represent, workDays, type Audition, type Booking } from '@/engine/systems/career';
import { productionOf } from '@/engine/systems/companies';
import { INDUSTRY, INDUSTRY_WEEK_KIND, RESEARCH, openPart, pitchRefusal, KNOWN, afterlifeRule, attachAudition, cancelProject, castPerformer, industryOf, industryWeek, knownEdge, newProject, projectById, projectFor, workedFor } from '@/engine/systems/industry';
import { classmateBooked } from '@/engine/systems/rivals';
import { evenCraft } from '@/engine/systems/school';

const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
const role = (id: string) => ROLES.find((r) => r.id === id)!;
/** SETUP: an actor living in New York, the career begun. */
function actor(seed: string): Simulation {
  const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);
  sim.player.craft = evenCraft(75);
  beginCareer(sim, sim.player);
  return sim;
}
/** SETUP: an audition the week brought, put on its project as the week does, and booked: the offer comes by the engine's own schedule. */
function booked(sim: Simulation, roleId: string): { audition: Audition; booking: Booking } {
  const career = careerOf(sim.player);
  const audition: Audition = { id: `a${(career.seq += 1)}`, roleId, at: sim.now + 2 * MS_DAY, mode: 'tape', cityId: 'us-ny-newyork', status: 'booked' };
  attachAudition(sim, audition);
  career.auditions.push(audition);
  sim.schedule({ at: sim.now + 60_000, kind: 'career.offer', label: 'An Offer', category: 'system', priority: 20, payload: { personId: sim.player.id, auditionId: audition.id } });
  sim.advanceTo(sim.now + 2 * 60_000);
  const booking = career.bookings.find((b) => b.projectId === audition.projectId)!;
  return { audition, booking };
}
/** SETUP: the body kept going while the clock runs, up before each call. */
function live(sim: Simulation, until: number): void {
  for (;;) {
    const next = sim.universe.scheduled.filter((x) => x.kind === 'career.work' && x.status === 'pending' && x.at < until).sort((a, b) => a.at - b.at)[0];
    const to = next ? next.at - 60_000 : until;
    while (sim.now < to) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 }); sim.advanceTo(Math.min(to, sim.now + 6 * MS_HOUR)); }
    if (!next) return;
    sim.player.awakeSince = sim.now;
    sim.advanceTo(next.at + 60_000);
  }
}

describe('one project from audition to credit', () => {
  it('the audition’s project is the offer’s, the booking’s, the production’s and the credit’s: one identity, its parts cast with people', () => {
    let sim = actor('ind-one');
    const { audition, booking } = booked(sim, 'costar');
    const project = projectById(sim, audition.projectId)!;
    expect(project.touched).toBe(true);
    expect([booking.projectId, booking.partId]).toEqual([audition.projectId, audition.partId]);
    sim.must({ kind: 'career.accept', payload: { bookingId: booking.id } });
    for (const x of sim.universe.scheduled) if (x.kind === 'career.schedule_change' && x.status === 'pending') sim.timeline.cancel(x.id, sim.now);
    const production = productionOf(sim.player, booking.id)!;
    expect([production.projectId, production.title]).toEqual([project.id, project.title]);
    const mine = project.parts.find((x) => x.id === booking.partId)!;
    expect(mine.holder).toEqual({ kind: 'player' });
    expect(production.slots[0]!.part).toBe(mine.name);
    // The other parts: performers from the pool, by name, committed over the job's dates.
    const others = production.slots.slice(1);
    expect(others.length).toBeGreaterThan(0);
    for (const slot of others) {
      if (slot.performer.kind !== 'company') continue;
      const part = project.parts.find((x) => x.id === slot.partId)!;
      const id = (slot.performer as { id?: string }).id;
      expect(part.holder).toEqual({ kind: 'performer', id });
      const who = industryOf(sim).performers.find((p) => p.id === id)!;
      expect(who.commitments.some((c) => c.projectId === project.id && c.partId === part.id)).toBe(true);
    }
    // Somebody in each part, never one performer in two.
    const held = project.parts.flatMap((x) => (x.holder?.kind === 'performer' ? [x.holder.id] : []));
    expect(new Set(held).size).toBe(held.length);
    sim = reload(sim);
    live(sim, workDays(careerOf(sim.player).bookings.find((b) => b.id === booking.id)!).at(-1)!.at + 2 * MS_DAY);
    const credit = careerOf(sim.player).credits.at(-1)!;
    expect(credit.projectId).toBe(project.id);
    // One project, never a second for the same job.
    expect(industryOf(sim).projects.filter((p) => p.parts.some((x) => x.holder?.kind === 'player'))).toHaveLength(1);
    expect(breaches(sim.universe)).toEqual([]);
  });

  it('a project casting in the town with the part still open is the one a second audition joins; another part, another project', () => {
    const sim = actor('ind-join');
    const a = projectFor(sim, role('costar'), 'us-ny-newyork', sim.now + MS_DAY, 'x1');
    const again = projectFor(sim, role('costar'), 'us-ny-newyork', sim.now + 2 * MS_DAY, 'x2');
    expect(again.project.id).toBe(a.project.id);
    for (const x of a.project.parts) if (x.roleId === 'costar') x.status = 'cast'; // SETUP: its co-star parts went to somebody.
    const third = projectFor(sim, role('costar'), 'us-ny-newyork', sim.now + 2 * MS_DAY, 'x3');
    expect(third.project.id).not.toBe(a.project.id);
  });
});

describe('a company’s rule', () => {
  it('where a television job’s episodes are seen: a streamer’s on its service at its size, a broadcaster’s on its channels, nobody’s as drawn', () => {
    const sim = actor('ind-rule');
    const p = newProject(sim, role('guest-hour'), 'us-ny-newyork', sim.now, 'r1');
    const streaming = COMPANIES.find((c) => c.release === 'streaming' && c.streamer)!;
    const broadcaster = COMPANIES.find((c) => c.release === 'broadcast')!;
    p.companyId = streaming.id; // SETUP: the company is the input.
    expect(afterlifeRule(sim, p.id)).toEqual({ network: false, size: streaming.streamer!.size });
    p.companyId = broadcaster.id;
    expect(afterlifeRule(sim, p.id)).toEqual({ network: true });
    delete p.companyId;
    expect(afterlifeRule(sim, p.id)).toEqual({});
    // And the residual follows it: the same job, made for each.
    const job = (companyId?: string) => {
      const s = actor('ind-rule-job');
      const q = newProject(s, role('guest-hour'), 'us-ny-newyork', s.now, 'r2');
      if (companyId) q.companyId = companyId; else delete q.companyId;
      const b = { id: 'rb1', roleId: 'guest-hour', cityId: 'us-ny-newyork', starts: s.now, units: 1, rehearsalWeeks: 0, status: 'worked', dueAt: s.now, offeredAt: s.now, worked: 1, owed: 0, projectId: q.id } as Booking;
      careerOf(s.player).bookings.push(b);
      return afterlife(s, s.player, b, s.now)!;
    };
    expect(job(streaming.id)).toMatchObject({ kind: 'svod', size: streaming.streamer!.size });
    expect(job(broadcaster.id).kind).toBe('network');
  });

  it('a producer who’s worked with the actor reads them warmer: the edge is the company’s, not every company’s', () => {
    const sim = actor('ind-known');
    const mine = newProject(sim, role('costar'), 'us-ny-newyork', sim.now, 'k1');
    const theirs = newProject(sim, role('costar'), 'us-ny-newyork', sim.now, 'k2');
    mine.companyId = 'netflix'; theirs.companyId = 'bbc'; // SETUP
    expect(knownEdge(sim, mine.id)).toBe(1);
    workedFor(sim, mine.id);
    expect(knownEdge(sim, mine.id)).toBe(KNOWN.edge);
    expect(knownEdge(sim, theirs.id)).toBe(1);
    expect(industryOf(sim).worked.netflix!.jobs).toBe(1);
  });
});

describe('performers', () => {
  it('a performer is never in two parts at once: busy, another is cast or found', () => {
    const sim = actor('ind-busy');
    const a = newProject(sim, role('costar'), 'us-ny-newyork', sim.now, 'b1');
    const first = castPerformer(sim, a, a.parts[0]!, sim.now, sim.now + 10 * MS_DAY, 'one');
    for (let n = 0; n < 30; n += 1) {
      const b = newProject(sim, role('costar'), 'us-ny-newyork', sim.now, `b-${n}`);
      const next = castPerformer(sim, b, b.parts[0]!, sim.now + 2 * MS_DAY, sim.now + 4 * MS_DAY, `two-${n}`);
      expect(next.id).not.toBe(first.id);
    }
    // After their part, they're free again.
    const later = newProject(sim, role('costar'), 'us-ny-newyork', sim.now, 'b-later');
    const free = industryOf(sim).performers.filter((p) => p.cityId === 'us-ny-newyork' && !p.commitments.some((c) => c.until >= sim.now + 20 * MS_DAY));
    expect(free.some((p) => p.id === first.id)).toBe(true);
    void later;
  });
});

describe('a classmate’s job', () => {
  it('is a part in a project in their town, never one the player is reading for', () => {
    const sim = createSave(1, 'ind-class', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    const school = sim.player.school!;
    school.standing = 'graduated'; // SETUP
    const m = school.classmates[0]!;
    m.career = { credits: [] }; // SETUP: their career begun.
    const reading = newProject(sim, role('costar'), 'us-ny-newyork', sim.now + MS_DAY, 'c1');
    reading.touched = true; // SETUP: the player's audition is for it.
    classmateBooked(sim, sim.player, 0, role('costar'), sim.now);
    const credit = m.career.credits.at(-1)!;
    expect(credit.projectId).toBeDefined();
    expect(credit.projectId).not.toBe(reading.id);
    const theirs = projectById(sim, credit.projectId)!;
    expect(theirs.parts.some((x) => x.holder?.kind === 'classmate' && x.holder.i === 0)).toBe(true);
  });
});

describe('a project’s life', () => {
  it('moves by its dates week by week: cast as it shoots, released with SLATE’s reception; called off, canceled with its history', () => {
    let sim = actor('ind-life');
    const p = newProject(sim, role('costar'), 'us-ny-newyork', sim.now + 10 * MS_DAY, 'l1');
    expect(p.status).toBe('casting');
    sim = reload(sim);
    industryWeek(sim, sim.player, 'us-ny-newyork', sim.now);
    const q = projectById(sim, p.id)!;
    q.shootFrom = sim.now - MS_DAY; q.shootUntil = sim.now + 3 * MS_DAY; q.releaseAt = sim.now + 30 * MS_DAY; // SETUP: its dates come.
    industryWeek(sim, sim.player, 'us-ny-newyork', sim.now);
    expect(q.status).toBe('production');
    expect(q.parts.every((x) => x.status !== 'open')).toBe(true);
    q.releaseAt = sim.now - 1; // SETUP
    industryWeek(sim, sim.player, 'us-ny-newyork', sim.now);
    expect(q.status).toBe('released');
    expect(q.reception!.critics).toBeGreaterThanOrEqual(35);
    // Called off: another project, its performers let go.
    const r = newProject(sim, role('costar'), 'us-ny-newyork', sim.now + 10 * MS_DAY, 'l2');
    const who = castPerformer(sim, r, r.parts[0]!, r.shootFrom, r.shootUntil, 'x');
    cancelProject(sim, r.id, 'the money fell through');
    expect([r.status, r.history.at(-1)!.what]).toEqual(['cancelled', 'Called off: the money fell through']);
    expect(who.commitments.some((c) => c.projectId === r.id)).toBe(false);
  });

  it('a project leaves the record a year after it ends unless the save’s records point at it: a credit, a list', () => {
    const sim = actor('ind-keep');
    const gone = newProject(sim, role('costar'), 'us-ny-newyork', sim.now, 'g1');
    const credited = newProject(sim, role('costar'), 'us-ny-newyork', sim.now, 'g2');
    const listed = newProject(sim, role('costar'), 'us-ny-newyork', sim.now, 'g3');
    // Read for once, long ago, and nothing points at it now: the replay of 2026-10-08 kept every one of these for good.
    gone.touched = true; // SETUP
    careerOf(sim.player).credits.push({ roleId: 'costar', year: 2020, cityId: 'us-ny-newyork', projectId: credited.id }); // SETUP
    sim.must({ kind: 'industry.list', payload: { list: 'favorites', kind: 'project', id: listed.id, on: true } });
    for (const p of [gone, credited, listed]) { projectById(sim, p.id)!.status = 'released'; projectById(sim, p.id)!.releaseAt = sim.now - (INDUSTRY.keepUntouchedDays + 1) * MS_DAY; } // SETUP
    industryWeek(sim, sim.player, 'us-ny-newyork', sim.now);
    expect(projectById(sim, gone.id)).toBeUndefined();
    expect(projectById(sim, credited.id)).toBeDefined();
    expect(projectById(sim, listed.id)).toBeDefined();
  });

  it('stays bounded as a life goes on: hundreds of old projects read for leave, and performers’ old commitments with them', () => {
    const sim = actor('ind-bounded');
    for (let n = 0; n < 400; n += 1) {
      const p = newProject(sim, role('costar'), 'us-ny-newyork', sim.now, `b${n}`);
      p.touched = true; // SETUP: each read for once, decades ago.
      const who = castPerformer(sim, p, p.parts[1]!, sim.now - 3000 * MS_DAY, sim.now - 2990 * MS_DAY, 'old');
      void who;
      p.status = 'released';
      p.releaseAt = sim.now - 2000 * MS_DAY;
    }
    // And one the player has a credit on, kept, whose performer's commitment ended years ago: the commitment goes, the project stays.
    const mine = newProject(sim, role('costar'), 'us-ny-newyork', sim.now, 'mine');
    const old = castPerformer(sim, mine, mine.parts[1]!, sim.now - 3000 * MS_DAY, sim.now - 2990 * MS_DAY, 'mine');
    careerOf(sim.player).credits.push({ roleId: 'costar', year: 2018, cityId: 'us-ny-newyork', projectId: mine.id }); // SETUP
    industryWeek(sim, sim.player, 'us-ny-newyork', sim.now);
    const state = industryOf(sim);
    expect(projectById(sim, mine.id)).toBeDefined();
    expect(old.commitments.some((c) => c.projectId === mine.id)).toBe(false);
    expect(state.projects.filter((p) => p.releaseAt < sim.now - 1000 * MS_DAY)).toHaveLength(0);
    expect(state.performers.every((p) => p.commitments.every((c) => c.until > sim.now - INDUSTRY.keepUntouchedDays * MS_DAY))).toBe(true);
  });

  it('the town the player works in hears of a few projects a month, spread over the months ahead', () => {
    const sim = actor('ind-announce');
    const before = industryOf(sim).projects.length;
    industryWeek(sim, sim.player, 'us-ny-newyork', sim.now);
    const announced = () => industryOf(sim).projects.slice(before).filter((p) => p.history[0]!.what.startsWith('Announced'));
    expect(announced()).toHaveLength(INDUSTRY.announcePerMonth);
    // The first casting now, the others in development until their dates.
    expect(announced().map((p) => p.status)).toEqual(['casting', 'development', 'development']);
    expect(announced().every((p) => p.cityId === 'us-ny-newyork')).toBe(true);
    // Once a month: the next week's tick announces nothing more.
    industryWeek(sim, sim.player, 'us-ny-newyork', sim.now + 7 * MS_DAY);
    expect(announced()).toHaveLength(INDUSTRY.announcePerMonth);
  });
});

describe('the player’s own', () => {
  it('lists, a list of their own, ratings of what’s out, and what they looked at, through a save', () => {
    let sim = actor('ind-lists');
    const p = newProject(sim, role('costar'), 'us-ny-newyork', sim.now, 'p1');
    sim.must({ kind: 'industry.list', payload: { list: 'watchlist', kind: 'project', id: p.id, on: true } });
    const made = sim.must<{ list: string }>({ kind: 'industry.new_list', payload: { name: 'Directors To Watch' } });
    expect(sim.execute({ kind: 'industry.new_list', payload: { name: 'directors to watch' } }).error).toBe('You have a list by that name.');
    expect(sim.execute({ kind: 'industry.rate', payload: { key: `project:${p.id}`, score: 8 } }).error).toBe('Only what’s been released can be rated.');
    sim.must({ kind: 'industry.rate', payload: { key: 'title:Q108839994', score: 9 } });
    expect(sim.execute({ kind: 'industry.rate', payload: { key: 'title:Q1', score: 11 } }).error).toBe('A rating is 1 to 10.');
    sim.must({ kind: 'industry.view', payload: { kind: 'project', id: p.id } });
    sim = reload(sim);
    const state = industryOf(sim);
    expect(state.lists.find((l) => l.id === 'watchlist')!.items[0]).toMatchObject({ kind: 'project', id: p.id });
    expect(state.lists.find((l) => l.id === made.list)!.name).toBe('Directors To Watch');
    expect(state.ratings['title:Q108839994']!.score).toBe(9);
    expect(state.viewed[0]).toMatchObject({ kind: 'project', id: p.id });
    expect(projectById(sim, p.id)!.touched).toBe(true);
  });

  it('a save from before the business has its week armed when it’s loaded', () => {
    const sim = actor('ind-old');
    // SETUP: as a save from before: no industry, no week.
    delete (sim.universe as { industry?: unknown }).industry;
    sim.universe.scheduled = sim.universe.scheduled.filter((x) => x.kind !== INDUSTRY_WEEK_KIND);
    const back = reload(sim);
    expect(back.universe.scheduled.some((x) => x.kind === INDUSTRY_WEEK_KIND && x.status === 'pending')).toBe(true);
    expect(breaches(back.universe)).toEqual([]);
  });
});

describe('finding work through the business', () => {
  it('a breakdown is a project’s open part; submitted for, the audition it brings is for that part', () => {
    const sim = actor('ind-breakdown');
    industryWeek(sim, sim.player, 'us-ny-newyork', sim.now);
    const b = breakdownsOf(sim, sim.player).find((x) => x.projectId)!;
    const posted = openPart(sim, b.roleId, 'us-ny-newyork')!;
    expect([b.projectId, b.partId]).toEqual([posted.project.id, posted.part.id]);
    sim.must({ kind: 'career.submit_for', payload: { roleId: b.roleId } });
    expect(careerOf(sim.player).chosen!.at(-1)!.projectId).toBe(posted.project.id);
  });

  it('an agent pitches for a part its reach covers: refused without one, for the wrong work, by offer, or past two a week', () => {
    const sim = actor('ind-pitch');
    const p = newProject(sim, role('costar'), 'us-ny-newyork', sim.now + 14 * MS_DAY, 'pi1');
    const part = p.parts[0]!;
    expect(sim.execute({ kind: 'career.pitch', payload: { projectId: p.id, partId: part.id } }).error).toMatch(/^An agent pitches; you have none/);
    represent(sim, sim.player, { agencyId: 'gersh', cityId: 'us-ny-newyork', until: sim.now }); // SETUP: signed, as the business would have it.
    // A refused command leaves the save as it was, from its own copy: the project is read again.
    const q = projectById(sim, p.id)!;
    const offerOnly = q.parts.find((x) => x.via === 'offer') ?? (() => { const x = { ...part, id: `${q.id}-o`, via: 'offer' as const }; q.parts.push(x); return x; })(); // SETUP where none was drawn
    expect(sim.execute({ kind: 'career.pitch', payload: { projectId: p.id, partId: offerOnly.id } }).error).toMatch(/is cast by offer/);
    // The biggest agency doesn't send its clients to a co-star's day (Role.tiers).
    expect(pitchRefusal(sim, sim.player, p.id, part.id, { tier: 1, name: 'CAA' }, [], false)).toBe('CAA doesn’t send clients to that kind of work.');
    expect(sim.execute({ kind: 'career.pitch', payload: { projectId: p.id, partId: part.id } }).error).toBeUndefined();
    expect(sim.execute({ kind: 'career.pitch', payload: { projectId: p.id, partId: part.id } }).error).toBe('You’re up for it already.');
    const two = newProject(sim, role('costar'), 'us-ny-newyork', sim.now + 14 * MS_DAY, 'pi2');
    const three = newProject(sim, role('costar'), 'us-ny-newyork', sim.now + 14 * MS_DAY, 'pi3');
    sim.must({ kind: 'career.pitch', payload: { projectId: two.id, partId: two.parts[0]!.id } });
    expect(sim.execute({ kind: 'career.pitch', payload: { projectId: three.id, partId: three.parts[0]!.id } }).error).toBe(`${INDUSTRY.pitch.perWeek} pitches a week at most.`);
    // Answered with the week: an audition for the part, or word they're seeing others; either way the pitches are done.
    sim.advanceTo(sim.now + 8 * MS_DAY);
    const pitched = careerOf(sim.player).auditions.filter((a) => a.projectId === p.id || a.projectId === two.id);
    const told = sim.universe.notifications.filter((n) => n.title === 'Your Agent Pitched You');
    expect(pitched.length + told.length).toBe(2);
    expect(careerOf(sim.player).pitches).toBeUndefined();
  });

  it('research takes its time and prepares only for an audition there is', () => {
    const sim = actor('ind-research');
    const p = newProject(sim, role('costar'), 'us-ny-newyork', sim.now + 14 * MS_DAY, 're1');
    expect(sim.execute({ kind: 'career.research_project', payload: { projectId: p.id } }).error).toMatch(/^Research prepares you for an audition, and you have none for /);
    const career = careerOf(sim.player);
    const audition: Audition = { id: 'a-re', roleId: 'costar', at: sim.now + 3 * MS_DAY, mode: 'tape', cityId: 'us-ny-newyork', status: 'ahead', projectId: p.id, partId: p.parts[0]!.id };
    career.auditions.push(audition); // SETUP: the week brought it.
    const t0 = sim.now;
    sim.must({ kind: 'career.research_project', payload: { projectId: p.id } });
    expect(sim.now - t0).toBe(RESEARCH.minutes * 60_000);
    expect(career.auditions.find((a) => a.id === 'a-re')!.researched).toBe(true);
    expect(sim.execute({ kind: 'career.research_project', payload: { projectId: p.id } }).error).toMatch(/already/);
  });
});

describe('dates moved, people with them', () => {
  it('a postponement moves each performer’s commitment; one with another part then gives this one up to somebody free', () => {
    const sim = actor('ind-move');
    const { booking } = booked(sim, 'costar');
    sim.must({ kind: 'career.accept', payload: { bookingId: booking.id } });
    for (const x of sim.universe.scheduled) if (x.kind === 'career.schedule_change' && x.status === 'pending') sim.timeline.cancel(x.id, sim.now);
    const production = productionOf(sim.player, booking.id)!;
    const project = projectById(sim, production.projectId)!;
    const slots = production.slots.filter((s) => s.performer.kind === 'company' && (s.performer as { id?: string }).id);
    expect(slots.length).toBeGreaterThan(1);
    const [busy, free] = slots.map((s) => industryOf(sim).performers.find((p) => p.id === (s.performer as { id: string }).id)!);
    const calls = workDays(careerOf(sim.player).bookings.find((b) => b.id === booking.id)!);
    // SETUP: the first has another part the week after the job as it stands, which a week's postponement runs into.
    busy!.commitments.push({ projectId: 'elsewhere', partId: 'elsewhere-0', from: calls.at(-1)!.at + 2 * MS_DAY, until: calls.at(-1)!.at + 12 * MS_DAY });
    sim.schedule({ at: sim.now + 60_000, kind: 'career.schedule_change', label: 'A Schedule Change', category: 'system', priority: 20, payload: { personId: sim.player.id, bookingId: booking.id, change: 'postpone', x: 0.2 } });
    sim.advanceTo(sim.now + 2 * 60_000);
    const pr = (production.proposals ?? [])[0]!;
    sim.must({ kind: 'career.answer_schedule', payload: { bookingId: booking.id, proposalId: pr.id, accept: true } });
    const after = projectById(sim, project.id)!;
    const theirs = after.parts.find((x) => x.was?.some((w) => w.holder.kind === 'performer' && w.holder.id === busy!.id));
    expect(theirs?.was?.at(-1)?.why).toBe('couldn’t make the new dates');
    expect(theirs!.holder).not.toEqual({ kind: 'performer', id: busy!.id });
    const stayed = after.parts.find((x) => x.holder?.kind === 'performer' && x.holder.id === free!.id);
    expect(stayed).toBeDefined();
    const moved = industryOf(sim).performers.find((p) => p.id === free!.id)!.commitments.find((c) => c.projectId === project.id)!;
    expect(moved.until).toBe(after.shootUntil);
    expect(productionOf(sim.player, booking.id)!.history.some((h) => h.what.startsWith(`${busy!.name} couldn’t make the new dates`))).toBe(true);
    expect(breaches(sim.universe)).toEqual([]);
  });
});
