/**
 * The people who make the world's films.
 *
 * An industry is a few hundred people who keep turning up, not a new name for
 * every title. This measures that: the pool is reused, the same director's
 * other work can be found, and nobody is ever in the same picture twice.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { commissionProject } from '@/engine/systems/zeitgeist';
import { otherWorkOf, creditRoleOf, ensureCrewPerson } from '@/engine/systems/industry-people';
import type { Project } from '@/engine/domain/model';
import { MS_DAY } from '@/engine/core/time';

function commissionMany(seed: string, countryId: string, count: number) {
  const sim = quickSave({ wealth: 'inherited' }, seed);
  const made: Project[] = [];
  for (let i = 0; i < count; i++) {
    const project = commissionProject(sim, countryId, `p-${i}`);
    if (project) made.push(project);
  }
  return { sim, made };
}

describe('the people the world works with', () => {
  it('keeps a working pool rather than a fresh name for every title', () => {
    const { sim, made } = commissionMany('crew-pool', 'us', 60);
    expect(made.length).toBe(60);
    const directors = new Set(made.map((p) => p.directorId));
    // Sixty pictures should not be sixty different directors.
    expect(directors.size, `${directors.size} directors for ${made.length} pictures`).toBeLessThan(made.length * 0.7);
    expect(directors.size, 'the whole country has one director').toBeGreaterThan(3);

    for (const id of directors) {
      const person = sim.universe.people[id!];
      expect(person, 'a director who is not a person').toBeDefined();
      expect(person!.industryRole).toBe('director');
      expect(person!.citizenshipId).toBe('us');
      expect(person!.isPlayer).toBe(false);
    }
  });

  it('lets you see what else somebody has made', () => {
    const { sim, made } = commissionMany('crew-history', 'us', 40);
    expect(made.length).toBe(40);
    // Everything in the save, not only what this test asked for: the world was
    // already making things before the first line of it ran.
    const busiest = Object.values(sim.universe.projects)
      .filter((p) => p.directorId)
      .map((p) => p.directorId!)
      .reduce<Record<string, number>>((all, id) => ({ ...all, [id]: (all[id] ?? 0) + 1 }), {});
    const [personId, count] = Object.entries(busiest).sort((a, b) => b[1] - a[1])[0]!;
    expect(count, 'nobody directed more than one thing').toBeGreaterThan(1);

    // Their work is everything they are on, in any capacity — a director who
    // also wrote one is on that one twice over, and it still counts once.
    const theirs = otherWorkOf(sim, personId);
    expect(theirs.length, 'the record lost work they did').toBeGreaterThanOrEqual(count);
    expect(theirs.length).toBe(new Set(theirs.map((p) => p.id)).size);
    for (const project of theirs) {
      expect(creditRoleOf(project, personId), `${project.title} lists them as nothing`).toBeTruthy();
    }
    expect(theirs.filter((p) => p.directorId === personId).length).toBe(count);

    // Asked about one of their own films, the list leaves that one out.
    expect(otherWorkOf(sim, personId, theirs[0]!.id)).toHaveLength(theirs.length - 1);
  });

  it('never puts the same actor in two parts of one picture, however the part was filled', () => {
    const { sim } = commissionMany('crew-cast', 'us', 30);
    // Run the world on for a year so the open parts are decided in a room
    // rather than attached, which is the other way somebody gets into a cast.
    sim.advanceTo(sim.now + 365 * MS_DAY);
    for (const project of Object.values(sim.universe.projects)) {
      expect(new Set(project.castIds).size, `${project.title} cast somebody twice`).toBe(project.castIds.length);
      const cast = Object.values(sim.universe.roles)
        .filter((r) => r.projectId === project.id && r.castPersonId)
        .map((r) => r.castPersonId);
      expect(new Set(cast).size, `${project.title} has one person in two parts`).toBe(cast.length);
    }
  });

  it('gives a country its own people rather than borrowing another country\'s', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'crew-countries');
    const rng = sim.rng('crew-test');
    const korean = ensureCrewPerson(sim, 'director', 'kr', 'kr-11-seoul', rng);
    const french = ensureCrewPerson(sim, 'director', 'fr', 'fr-11-paris', rng);
    expect(korean.citizenshipId).toBe('kr');
    expect(french.citizenshipId).toBe('fr');
    expect(korean.id).not.toBe(french.id);
    // Asked again for the same country, it eventually reuses rather than
    // inventing forever.
    const many = new Set<string>();
    for (let i = 0; i < 40; i++) many.add(ensureCrewPerson(sim, 'director', 'kr', 'kr-11-seoul', sim.rng('crew-test', i)).id);
    expect(many.size, 'forty commissions made forty new Korean directors').toBeLessThan(24);
  });
});
