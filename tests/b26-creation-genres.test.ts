/**
 * Brief 26 (2026-10-24), the connectivity sweep, creation's Genres step: what creation says a loved genre does is what
 * the game does with it. Until this day `genresRead` was the School's plays' kinds alone, so creation marked the six
 * genres only the career's projects carry (Crime, Horror, Police Procedural, Psychological Horror, Psychological
 * Thriller, Thriller) as "shown on your Player Profile only" while a shoot day of a horror film had been a better day
 * for a lover of horror since brief 20 (tests/b20-career-defects.test.ts). The screen and the engine read one list now.
 */
import { describe, expect, it } from 'vitest';
import { genresRead, lovedInWork } from '@/engine/systems/enjoyment';
import { PROJECTS } from '@/engine/content/careerwork';
import { REP_PLAYS, SHAKESPEARE_PLAYS, SUMMER_PLAYS, THESIS_PLAYS } from '@/engine/content/plays';
import { FILM_GENRES } from '@/engine/content/film-genres';

describe('the genres creation says are read', () => {
  it('are every kind of a School play and every genre of a career project, and nothing else; every one of them is a genre the game has', () => {
    const read = genresRead();
    const plays = new Set([...THESIS_PLAYS, ...SHAKESPEARE_PLAYS, ...REP_PLAYS, ...SUMMER_PLAYS].flatMap((p) => p.kinds ?? []));
    const projects = new Set(PROJECTS.flatMap((p) => p.genres ?? []));
    for (const g of plays) expect(read.has(g), `${g}, a play's kind`).toBe(true);
    for (const g of projects) expect(read.has(g), `${g}, a project's genre`).toBe(true);
    expect([...read].sort()).toEqual([...new Set([...plays, ...projects])].sort());
    const ids = new Set(FILM_GENRES.map((g) => g.id));
    for (const g of read) expect(ids.has(g), g).toBe(true);
  });

  it('include the six the career alone carries, and a work day on a project of one is work in a loved genre', () => {
    const read = genresRead();
    const careerOnly = ['crime', 'horror', 'police_procedural', 'psychological_horror', 'psychological_thriller', 'thriller'];
    for (const g of careerOnly) expect(read.has(g), g).toBe(true);
    // A day on Static On Route 9, a horror film, as `enjoyWork` reads it for a lover of horror and for a lover of westerns.
    const route9 = PROJECTS.find((p) => (p.genres ?? []).includes('horror'))!;
    expect(lovedInWork({ genres: ['horror'] }, { genres: route9.genres })).toEqual(['horror']);
    expect(lovedInWork({ genres: ['western'] }, { genres: route9.genres })).toEqual([]);
    // Western is in no play and no project, so creation marks it as shown only, and the week-long test of an inert genre
    // (tests/traits-connected.test.ts) still has one to live.
    expect(read.has('western')).toBe(false);
  });
});
