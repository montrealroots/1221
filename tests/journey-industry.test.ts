/**
 * A journey through the business (from 2026-10-08), by the public commands
 * `career.pitch`, `career.research_project`, `career.accept`,
 * `industry.view`, `industry.list`, `industry.new_list`, `industry.rate` and
 * `industry.keep_lookup`:
 * a project found in the database, its company looked up, the agent asked to
 * pitch, the audition researched and read, the part booked, the work done,
 * the release, and the credit; the database's one record of it the same at
 * every step, through a save. Which seed's draws go the whole way is found,
 * not fixed: an agent's pitch and an audition are each the decider's, and an
 * audition books about one time in ten, so it can take a hundred seeds.
 */
import { describe, expect, it } from 'vitest';
import { loadSave, quickSave } from '@/engine';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import { breaches } from '@/engine/core/invariants';
import type { Simulation } from '@/engine/core/simulation';
import { beginCareer, careerOf, represent, roleById } from '@/engine/systems/career';
import { evenCraft } from '@/engine/systems/school';
import { industryOf, industryWeek, projectById } from '@/engine/systems/industry';
import { entries, search, withLooked } from '@/engine/world/database';
import { readTitles, screenItems } from '@/engine/world/lookup';
import recorded from './fixtures/lookup-carrie.json';

const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
/** SETUP: the body kept going while the clock runs, up for each call and audition; the offer for one project taken. */
function live(sim: Simulation, until: number, accept?: string): void {
  for (;;) {
    const next = sim.universe.scheduled.filter((x) => x.status === 'pending' && x.requiresPlayer && x.at > sim.now && x.at < until).sort((a, b) => a.at - b.at)[0];
    const to = next ? next.at - 60_000 : until;
    let took = false;
    while (sim.now < to && !took) {
      Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 });
      sim.advanceTo(Math.min(to, sim.now + 6 * MS_HOUR));
      // Taken: the offer for this project, and only it (taking every offer, clashing jobs lost each other's calls). Its
      // calls are new on the calendar, so the next one is looked for again.
      if (accept) for (const b of careerOf(sim.player).bookings) if (b.status === 'offered' && b.projectId === accept) took = sim.execute({ kind: 'career.accept', payload: { bookingId: b.id } }).error === undefined || took;
    }
    if (took) continue;
    if (!next) return;
    // Up and there for it.
    sim.player.awakeSince = sim.now;
    sim.advanceTo(next.at + 60_000);
  }
}

/** A New York actor, signed with Gersh, the business's week run: SETUP, as the career would have it. */
function actor(seed: string): Simulation {
  const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);
  sim.player.craft = evenCraft(85);
  beginCareer(sim, sim.player);
  careerOf(sim.player).headshotsAt = sim.now;
  represent(sim, sim.player, { agencyId: 'gersh', cityId: 'us-ny-newyork', until: sim.now });
  industryWeek(sim, sim.player, 'us-ny-newyork', sim.now);
  return sim;
}

describe('a journey through the business', () => {
  it('found, pitched for, researched, read, booked, worked, released, credited: one project throughout, through a save', () => {
    let done = false;
    for (let n = 0; n < 200 && !done; n += 1) {
      let sim = actor(`ind-journey-${n}`);
      // Found: a part casting through agents that Gersh's reach covers, read in the database.
      const all = entries(sim);
      const pitchable = (x: { roleId: string; status: string; via: string }) => x.status === 'open' && x.via === 'agent' && roleById(x.roleId).tiers.includes(2) && roleById(x.roleId).medium === 'screen';
      const casting = industryOf(sim).projects.find((p) => p.status === 'casting' && p.cityId === 'us-ny-newyork' && p.parts.some(pitchable));
      if (!casting) continue;
      expect(search(all, { text: casting.title, kinds: ['project'] }).rows.some((e) => e.id === casting.id)).toBe(true);
      sim.must({ kind: 'industry.view', payload: { kind: 'project', id: casting.id } });
      if (casting.companyId) sim.must({ kind: 'industry.view', payload: { kind: 'company', id: casting.companyId } });
      const part = casting.parts.find(pitchable)!;
      sim.must({ kind: 'industry.list', payload: { list: 'watchlist', kind: 'project', id: casting.id, on: true } });
      sim.must({ kind: 'career.pitch', payload: { projectId: casting.id, partId: part.id } });
      sim = reload(sim);
      // Answered with the week.
      live(sim, sim.now + 8 * MS_DAY);
      const audition = careerOf(sim.player).auditions.find((a) => a.projectId === casting.id && a.partId === part.id);
      if (!audition) continue;
      if (audition.status === 'ahead') sim.must({ kind: 'career.research_project', payload: { projectId: casting.id } });
      live(sim, sim.now + 21 * MS_DAY, casting.id);
      const booking = careerOf(sim.player).bookings.find((b) => b.projectId === casting.id);
      // A job lost (a call missed, or released by a change of dates) is recast, and the record says so; this journey wants one worked.
      if (!booking || (booking.status !== 'accepted' && booking.status !== 'worked')) continue;
      // Cast: the project's part is theirs, its production the project's title.
      const project = projectById(sim, casting.id)!;
      expect(project.parts.find((x) => x.id === part.id)!.holder).toEqual({ kind: 'player' });
      sim = reload(sim);
      live(sim, Math.max(project.shootUntil, sim.now) + 3 * MS_DAY, casting.id);
      const credit = careerOf(sim.player).credits.find((c) => c.projectId === casting.id);
      if (!credit) continue;
      // Released when its date comes: SLATE's reception drawn, the record the same project.
      const released = projectById(sim, casting.id)!;
      live(sim, Math.max(released.releaseAt, sim.now) + 8 * MS_DAY);
      industryWeek(sim, sim.player, 'us-ny-newyork', sim.now);
      const out = projectById(sim, casting.id)!;
      expect(out.status).toBe('released');
      expect(out.reception).toBeDefined();
      sim.must({ kind: 'industry.rate', payload: { key: `project:${out.id}`, score: 8 } });
      const made = sim.must<{ list: string }>({ kind: 'industry.new_list', payload: { name: 'My Work' } });
      sim.must({ kind: 'industry.list', payload: { list: made.list, kind: 'project', id: out.id, on: true } });
      // And a real film not in SLATE's records, looked up on Wikidata (its answer as recorded) and kept in the save.
      const carrie = readTitles(screenItems(recorded.search).map((x) => x.id), recorded.facts, recorded.cast, recorded.runtime, {});
      sim.must({ kind: 'industry.keep_lookup', payload: { titles: carrie.titles, people: carrie.people, fetched: '2026-10-08' } });
      sim = reload(sim);
      expect(search(entries(sim, withLooked(undefined, industryOf(sim).looked)), { text: 'carrie', kinds: ['title'] }).total).toBe(carrie.titles.length);
      expect(industryOf(sim).ratings[`project:${out.id}`]!.score).toBe(8);
      expect(entries(sim).filter((e) => e.kind === 'project' && e.id === out.id)).toHaveLength(1);
      expect(careerOf(sim.player).credits.filter((c) => c.projectId === out.id)).toHaveLength(1);
      expect(breaches(sim.universe)).toEqual([]);
      done = true;
    }
    expect(done, 'no seed of two hundred went the whole way').toBe(true);
  });
});
