/**
 * Brief 21's journeys (J): what the genre and banking changes do over a played life, not a moment.
 *
 * - J1, the School into professional work: J01's degree save (`tests/fixtures/journey-j01-degree-8283f80c.json.gz`, a
 *   life played through its degree at 8283f80c and opened by this build, as tests/journey-career-older.test.ts opens it)
 *   holds the genres its productions taught. Professional casting reads them: a project in a genre it knows, or a kind or
 *   broad genre of one, is fitted higher than for a twin who knows none (TEST SETUP: the record emptied), one in nothing
 *   it knows exactly as high. Played on as an unsigned actor until a project is worked, the work adds practice in that
 *   project's genres.
 * - J2, continuous against reopened: a new student at Chase, the day's spending on the card, played hour by hour by the
 *   attentive player (`tools/career-player.ts`) from 24 August 2026 to 1 April 2027 straight through, and again saved
 *   and reopened (migrated and loaded, as the game opens a slot) on the 1st of each month. They end the same: the genres
 *   learned at the Rep's Seagull, its understudy's calls and the nights she went on, every balance, every posting, every
 *   notice, the card's state. It was written to 1 February, and found there that the student knew no genre: the
 *   Seagull, in no play catalog, taught none (fixed on 2026-10-22, `genresOfHolder`; tests/b21-genre-proof.test.ts
 *   holds it). Its calls run from 19 January and its nights from 5 March, so the life is played to April.
 *
 * Nothing else is set by hand. The seed is arbitrary.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createSave, loadSave, migrate } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { instantFromZoned } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { PROJECTS, projectById } from '@/engine/content/careerwork';
import { fitOf } from '@/engine/systems/projobs';
import { relevantGenre, requirementOfRole } from '@/engine/systems/engagement';
import { playTo, unsignedActor } from '../tools/career-player';

const NY = 'America/New_York';
const at = (y: number, m: number, d: number, h = 9) => instantFromZoned({ year: y, month: m, day: d, hour: h }, NY);
const fixture = (name: string): string => gunzipSync(readFileSync(`tests/fixtures/${name}.json.gz`)).toString('utf8');
/** A slot opened as the game opens it: migrated, then loaded. */
const open = (text: string): Simulation => {
  const universe = deserialise(text) as never as Parameters<typeof migrate>[0];
  migrate(universe);
  return loadSave(universe as never);
};

describe('J1: the School’s genres carried into professional work', () => {
  it('PLAYER JOURNEY: the degree save’s genres are what professional casting reads, a project in none of them fitted as for a twin who knows nothing, and the work played adds practice in the project’s genres', () => {
    const sim = open(fixture('journey-j01-degree-8283f80c'));
    const learned = Object.keys(sim.player.engagement?.byGenre ?? {});
    expect(learned.length).toBeGreaterThan(0);
    // TEST SETUP: the twin knows no genre; everything else is the same life.
    const twin = open(fixture('journey-j01-degree-8283f80c'));
    twin.player.engagement = { byGenre: {} };
    let known = 0;
    let unknown = 0;
    for (const t of PROJECTS) {
      const reading = relevantGenre(sim.player, requirementOfRole(t));
      const [hers, theirs] = [fitOf(sim.player, t), fitOf(twin.player, t)];
      expect(theirs.genre, t.id).toBe(0);
      if (reading.total > 0) {
        known += 1;
        expect(hers.genre, t.id).toBeGreaterThan(0);
        expect(hers.fit, t.id).toBeGreaterThan(theirs.fit);
      } else {
        unknown += 1;
        expect(hers.fit, t.id).toBe(theirs.fit);
      }
    }
    // Both kinds of project are in the catalog, so both sides of the comparison were read.
    expect(known).toBeGreaterThan(0);
    expect(unknown).toBeGreaterThan(0);

    const before = structuredClone(sim.player.engagement?.byGenre ?? {});
    const worked = (s: Simulation) => s.player.pro?.engagements.find((e) => (e.log ?? []).some((l) => l.status === 'worked'));
    playTo(sim, at(2030, 8, 1), { career: unsignedActor() }, (s) => worked(s) !== undefined);
    const e = worked(sim);
    expect(e, 'a project worked within the year').toBeDefined();
    const t = projectById(e!.projectId)!;
    const practice = (id: string, record: typeof before) => record[id]?.practice ?? 0;
    const after = sim.player.engagement!.byGenre;
    const grew = requirementOfRole(t).needs.filter((n) => practice(n.id, after) > practice(n.id, before));
    expect(grew.length, `practice in ${t.genres.join(', ')}`).toBeGreaterThan(0);
  }, 1_200_000);
});

describe('J2: continuous play and play saved and reopened end the same', () => {
  it('PLAYER JOURNEY: a student’s first year to April at Chase, played straight through and reopened on the 1st of each month, ends with the same genres, balances, postings, notices and card', () => {
    const life = () => createSave(1, 'b21-journey-reopen', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', bankId: 'us-chase' });
    const straight = life();
    let reopened = life();
    for (const sim of [straight, reopened]) sim.must({ kind: 'bank.set_payments', payload: { everyday: 'credit' } });
    const firsts = [at(2026, 9, 1), at(2026, 10, 1), at(2026, 11, 1), at(2026, 12, 1), at(2027, 1, 1), at(2027, 2, 1), at(2027, 3, 1), at(2027, 4, 1)];
    playTo(straight, firsts.at(-1)!);
    for (const first of firsts) {
      playTo(reopened, first);
      reopened = open(serialise(reopened.universe));
    }
    const read = (sim: Simulation) => {
      const u = sim.universe;
      return {
        now: sim.now,
        genres: sim.player.engagement?.byGenre,
        accounts: Object.values(u.accounts).map((a) => [a.id, a.balance, a.accrued ?? 0, a.closedAt ?? null]),
        postings: u.transactions.map((t) => [t.at, t.memo, t.postings.map((p) => [p.accountId, p.amount])]),
        notices: u.notifications.map((n) => [n.at, n.title, n.body]),
        credit: sim.player.credit,
      };
    };
    const [a, b] = [read(straight), read(reopened)];
    // The Seagull's kinds, practised at its calls and nights, and nothing else this year taught a genre.
    expect(Object.keys(a.genres ?? {}).sort()).toEqual(['drama', 'tragicomedy']);
    expect(a.genres!.tragicomedy!.practice).toBeGreaterThan(0);
    // Practised by The Seagull's stated weights, tragicomedy 3 and drama 2 (brief 22): drama less. Until brief 22 its
    // two tags were read evenly here (the first listed half of two), and the two were practised alike.
    expect(a.genres!.drama!.practice).toBeGreaterThan(0);
    expect(a.genres!.drama!.practice).toBeLessThan(a.genres!.tragicomedy!.practice);
    expect(a.postings.some(([, memo]) => memo === 'Interest: Chase Savings')).toBe(true);
    expect(b).toEqual(a);
  }, 1_200_000);
});
