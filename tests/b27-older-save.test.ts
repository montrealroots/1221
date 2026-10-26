/**
 * A save from before the series cluster, opened on it (brief 27's review of 2026-10-25, S2): it reads the seasons it was
 * told. A series' decisions are worked out from the seed on every asking (`decisionsTo`, `systems/series.ts`), so a change
 * to what a word reads rewrites the past of every save opened after it; the cluster's first cut renewed a series another
 * network had picked up at a chance of the new network's own, and a save told a season was renewed after such a revival
 * read it as canceled once opened, its casting and its options with it.
 *
 * The save is tests/fixtures/old-series-renewal-d0cb4327.json.gz, made on d0cb4327, the tree the cluster was built on,
 * by playing: a graduate of September 2026 (tests/fakes/career-world.ts), a series of the game's kept in her record as the
 * save keeps a slate series, The Harbor Watch (The Calloway Files' figures under an id of its own, its order run out in
 * 2020: canceled in 2022, back in 2025, renewed in 2026 and in 2027), her Desk Clerk in its 2026 season accepted through
 * the command and shot on October 12 and 13, 2026, and the clock played to May 16, 2027, the day after the network's word
 * renewing it, which the save was told. TEST SETUP, said where it was done: SAG-AFTRA membership, the offer on the record
 * as casting's draws would leave one, and the id, g1.test.renewal.72, found by reading the draws: the 2025 revival's own
 * draw (`pickupOf`) falls to another network, and the 2027 word's draw, 0.343, falls between the chance the first cut gave a
 * picked-up series' seasons, one half, and the series' own, 0.47.
 */
import { describe, expect, it } from 'vitest';
import { gunzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { loadSave } from '@/engine';
import { MS_HOUR } from '@/engine/core/time';
import { deserialise } from '@/engine/persistence/adapter';
import { decisionAt, seriesById } from '@/engine/content/series';
import { decisionWords, decisionsTo, networkOf, renewChance, seasonMade } from '@/engine/systems/series';
import type { Simulation } from '@/engine/core/simulation';
import { notices, reload } from './fakes/career-world';

const ID = 'g1.test.renewal.72';
/** The chance the cluster's first cut gave every season after a pickup, the new network's own, in place of the series'. */
const FIRST_CUT_RENEW = 0.5;
const open = (): Simulation => loadSave(deserialise(gunzipSync(readFileSync('tests/fixtures/old-series-renewal-d0cb4327.json.gz')).toString('utf8')) as never);

describe('a save from before the cluster, opened on it', () => {
  it('reads the seasons it was told: the renewal after a pickup stands at the series’ own chance, where the first cut would have read it as canceled', () => {
    const sim = open();
    const s = seriesById(ID)!;
    expect(s).toMatchObject({ title: 'The Harbor Watch', orderedThrough: 2020 });
    // What the save was told, in its own notices: the network's word of May 15, 2027, a renewal.
    const told = notices(sim).find((n) => n.startsWith('The Harbor Watch Is Renewed | On May 15, 2027, the network renewed The Harbor Watch for a season beginning in July'));
    expect(told).toBeDefined();
    const e = sim.player.pro!.engagements.find((x) => x.projectId === `${ID}.desk-clerk`)!;
    expect(e.status).toBe('finished');
    // Read now: the same seasons, the 2025 revival a pickup by another network, and 2027 renewed.
    const all = decisionsTo(sim, s, 2027);
    expect(all.map((d) => `${d.year}:${d.what}`)).toEqual(['2021:renewed', '2022:canceled', '2025:revived', '2026:renewed', '2027:renewed']);
    const back = all.find((d) => d.year === 2025)!;
    expect(back.network).toMatch(/ (Television|Network)$/);
    expect(networkOf(sim, s, 2027)).toEqual({ name: back.network, since: 2025 });
    expect(seasonMade(sim, s, 2026)).toBe(true);
    expect(seasonMade(sim, s, 2027)).toBe(true);
    // The twin the first cut was: 2027's draw falls under the series' own chance and at or over the chance that cut gave a
    // picked-up series, so on that cut this save read its 2027 season as canceled. Neither chance is clamped here.
    const draw = sim.rng('pro.series', ID, 2027).next();
    const own = renewChance(sim, s, 2027);
    const firstCut = own - (s.chance.renew - FIRST_CUT_RENEW);
    expect(own).toBeGreaterThan(0.2);
    expect(own).toBeLessThan(0.9);
    expect(draw).toBeLessThan(own);
    expect(draw).toBeGreaterThanOrEqual(firstCut);
    // Saved and opened again: the same.
    const again = reload(sim);
    expect(decisionsTo(again, seriesById(ID)!, 2027)).toEqual(all);
    // The next word, in the new network's name (brief 27's review, S9), read from the same draws as the decisions are.
    const next = decisionsTo(sim, s, 2028).find((d) => d.year === 2028)!;
    sim.advanceTo(decisionAt(s, 2028) + MS_HOUR);
    expect(decisionWords(sim, s, next)).toContain(`On May 15, 2028, ${back.network} ${next.what} The Harbor Watch`);
    expect(notices(sim, decisionAt(s, 2028)).some((n) => n.startsWith(`The Harbor Watch Is ${next.what === 'renewed' ? 'Renewed' : 'Canceled'} | On May 15, 2028, ${back.network} ${next.what} The Harbor Watch`))).toBe(true);
  }, 300_000);
});
