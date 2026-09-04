/**
 * Television, live.
 *
 * A linear network runs a week built from what the record says was on it; the
 * week airs and every slot gets a number that reads like a real one; the
 * services publish a chart; every May the schedules are decided and the
 * cancellations are explained; a show of the player's gets a night; and the
 * save keeps its own records without ever claiming they are the world's.
 */

import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Id } from '@/engine/domain/model';
import { addDays, parseDateKey, zonedParts, MS_DAY } from '@/engine/core/time';
import { addBroadcastSeries, isBroadcastSeriesLoaded } from '@/engine/content/filmography';
import { NETWORKS } from '@/engine/content/networks';
import { networkState } from '@/engine/systems/studio-state';
import {
  formatRecord, isLinear, recordFor, saveRecords, scheduleOf, seasonOf, slotTime, weekGrid,
} from '@/engine/systems/networks-live';
import { ALL_TIME } from '@/engine/content/records';

const seriesFile = 'public/industry/series-by-broadcaster.tsv';
const shipped = existsSync(seriesFile);
function loadSeries(): void {
  if (!isBroadcastSeriesLoaded() && shipped) addBroadcastSeries(readFileSync(seriesFile, 'utf8'));
}

function boot(seed: string): Simulation {
  loadSeries();
  return quickSave({ wealth: 'inherited' }, seed);
}

describe('a linear network', () => {
  it('runs a week built from what the record says was airing on it', () => {
    if (!shipped) { console.warn('series-by-broadcaster.tsv is not built; schedules not exercised'); return; }
    const sim = boot('net-grid');
    const schedule = scheduleOf(sim, 'nbc');
    expect(schedule, 'NBC has no grid').toBeDefined();
    expect(schedule!.season).toBe(seasonOf(sim));
    // Three hours a night, seven nights, every slot filled.
    expect(schedule!.slots).toHaveLength(21);
    const grid = weekGrid(schedule!);
    expect(grid).toHaveLength(7);
    for (const night of grid) {
      expect(night.slots, night.name).toHaveLength(3);
      expect(night.slots.map((s) => s.start)).toEqual([1200, 1260, 1320]);
    }
    expect(slotTime(1200)).toBe('8 PM');
    expect(slotTime(1290)).toBe('9:30 PM');
    // The best hours carry real programmes, not filler.
    const sunday = grid[0]!.slots;
    expect(sunday.some((s) => s.catalogueQid), 'Sunday is real programming').toBe(true);
    const real = schedule!.slots.filter((s) => s.catalogueQid);
    expect(real.length).toBeGreaterThan(8);
    for (const slot of real) expect(slot.genres.length).toBeGreaterThan(0);
    // A service has no week at all.
    expect(isLinear(NETWORKS.get('netflix-service')!)).toBe(false);
    expect(scheduleOf(sim, 'netflix-service')).toBeUndefined();
    expect(isLinear(NETWORKS.get('hbo')!)).toBe(true);
  });

  it('airs the week and produces ratings a network would recognise', () => {
    if (!shipped) return;
    const sim = boot('net-air');
    scheduleOf(sim, 'nbc');
    sim.advanceTo(addDays(sim.now, 9, sim.homeZone));
    const schedule = scheduleOf(sim, 'nbc')!;
    const rated = schedule.slots.filter((s) => s.viewers !== undefined);
    expect(rated.length, 'the week aired').toBeGreaterThan(15);
    for (const slot of rated) {
      // In thousands: a broadcast hour runs between about half a million and
      // twenty million, and nothing on television does a demo above ten.
      expect(slot.viewers!, `${slot.title} viewers`).toBeGreaterThan(40);
      expect(slot.viewers!, `${slot.title} viewers`).toBeLessThan(30_000);
      expect(slot.demo!, `${slot.title} demo`).toBeGreaterThan(0);
      expect(slot.demo!, `${slot.title} demo`).toBeLessThan(12);
      expect(slot.share!).toBeGreaterThan(0);
      expect(slot.share!).toBeLessThan(60);
      expect(slot.seasonViewers).toBeDefined();
    }
    // Sunday at nine beats Saturday at ten, because that is what television is.
    const sundayNine = schedule.slots.find((s) => s.day === 0 && s.start === 1260 && s.kind === 'series');
    const saturdayTen = schedule.slots.find((s) => s.day === 6 && s.start === 1320 && s.kind === 'series');
    if (sundayNine && saturdayTen) expect(sundayNine.viewers!).toBeGreaterThan(saturdayTen.viewers!);
    expect(sim.universe.airings.length).toBeGreaterThan(0);
    expect(sim.universe.airings.length).toBeLessThanOrEqual(300);
  });

  it('decides the schedule at the upfronts and says why', () => {
    if (!shipped) return;
    const sim = boot('net-upfront');
    scheduleOf(sim, 'nbc');
    // Run to just past the third Monday of May.
    sim.advanceTo(parseDateKey('2026-05-25', sim.homeZone, 12));
    const state = networkState(sim, 'nbc');
    const schedule = state.schedule!;
    expect(schedule.season, 'the new season is announced').toBe('2026-27');
    expect(schedule.renewed.length + schedule.cancelled.length, 'the network decided on its shows').toBeGreaterThan(3);
    expect(schedule.cancelled.length, 'a network cancels something every year').toBeGreaterThan(0);
    // Every cancelled slot was replaced by an order, so the week stays full.
    expect(schedule.slots).toHaveLength(21);
    expect(schedule.ordered.length).toBe(schedule.cancelled.length);
    expect(new Set(schedule.ordered).size, 'no two new shows share a title').toBe(schedule.ordered.length);
    expect(state.seasons?.['2025-26']).toBeDefined();
    expect(sim.universe.trade.some((t) => t.headline.includes('upfronts'))).toBe(true);
    expect(state.news.some((n) => n.title.includes('Schedule Announced'))).toBe(true);
    // A renewed show is a season older; a new one starts at one.
    for (const slot of schedule.slots) {
      if (slot.standing === 'new') expect(slot.season).toBe(1);
    }
  });
});

describe('a streaming service', () => {
  it('publishes a chart of what people actually watched', () => {
    if (!shipped) return;
    const sim = boot('net-chart');
    sim.advanceTo(addDays(sim.now, 16, sim.homeZone));
    const charts = sim.universe.streamingCharts.filter((c) => c.serviceId === 'netflix-service');
    expect(charts.length, 'Netflix published a chart').toBeGreaterThan(0);
    const latest = charts[charts.length - 1]!;
    expect(latest.entries.length).toBeGreaterThan(0);
    expect(latest.entries.length).toBeLessThanOrEqual(10);
    for (const entry of latest.entries) {
      expect(entry.hours, `${entry.title} hours`).toBeGreaterThan(0);
      expect(entry.weeks).toBeGreaterThan(0);
    }
    // Ordered by hours, biggest first.
    const hours = latest.entries.map((e) => e.hours);
    expect([...hours].sort((a, b) => b - a)).toEqual(hours);
    expect(sim.universe.streamingCharts.length).toBeLessThanOrEqual(120);
  });
});

describe('a show of your own', () => {
  it('gets a night, airs, and is renewed or cancelled on its number', () => {
    if (!shipped) return;
    const sim = boot('net-mine');
    const made = sim.execute<{ projectId: Id }>({ kind: 'film.create_project', payload: { title: 'The Quiet Ward', format: 'series', genres: ['medical', 'drama'], logline: 'A hospital.' } });
    const project = sim.universe.projects[made.value!.projectId]!;
    project.networkId = 'nbc';
    const placed = sim.execute<{ day: number; start: number }>({ kind: 'net.request_slot', payload: { networkId: 'nbc', projectId: project.id } });
    expect(placed.ok, placed.error).toBe(true);
    const schedule = scheduleOf(sim, 'nbc')!;
    const slot = schedule.slots.find((s) => s.projectId === project.id)!;
    expect(slot, 'it has a slot').toBeDefined();
    expect(slot.yours).toBe(true);
    expect(slot.standing).toBe('new');
    expect(sim.universe.notifications.some((n) => n.title.includes('The Quiet Ward'))).toBe(true);

    sim.advanceTo(addDays(sim.now, 16, sim.homeZone));
    expect(slot.viewers, 'it aired').toBeDefined();
    expect(sim.universe.airings.some((a) => a.yours && a.title === 'The Quiet Ward')).toBe(true);
    const records = saveRecords(sim);
    expect(records.some((r) => r.category === 'viewers' && r.entries.some((e) => e.yours))).toBe(true);

    // A network will not put the same show in two slots.
    const again = sim.execute({ kind: 'net.request_slot', payload: { networkId: 'nbc', projectId: project.id } });
    expect(again.ok).toBe(true);
    expect(schedule.slots.filter((s) => s.projectId === project.id)).toHaveLength(1);
    // And a service does not run a schedule at all.
    const service = sim.execute({ kind: 'net.request_slot', payload: { networkId: 'netflix-service', projectId: project.id } });
    expect(service.ok).toBe(false);
    expect(service.error).toMatch(/does not run a schedule/);
  });
});

describe('records', () => {
  it('keeps the best of everything the save has done, capped and ordered', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'records-seed');
    for (let i = 0; i < 15; i++) {
      recordFor(sim, 'opening_weekend', { title: `Picture ${i}`, value: i * 1_000_000_00, yours: i % 2 === 0, note: 'A film.' });
    }
    const list = sim.universe.saveRecords.opening_weekend!;
    expect(list, 'only the top ten are kept').toHaveLength(10);
    expect(list[0]!.title).toBe('Picture 14');
    expect(list.map((r) => r.value)).toEqual([...list.map((r) => r.value)].sort((a, b) => b - a));
    // The same title does not appear twice; its best figure wins.
    expect(recordFor(sim, 'opening_weekend', { title: 'Picture 14', value: 99_000_000_00, yours: true, note: 'Bigger.' })).toBe(true);
    expect(list.filter((r) => r.title === 'Picture 14')).toHaveLength(1);
    expect(list[0]!.value).toBe(99_000_000_00);
    expect(recordFor(sim, 'opening_weekend', { title: 'Picture 14', value: 1, yours: true, note: 'Smaller.' })).toBe(false);
    expect(formatRecord('opening_weekend', 99_000_000_00)).toMatch(/\$99/);
    expect(formatRecord('demo', 1.234)).toBe('1.23');
    expect(formatRecord('viewers', 6_400)).toBe('6.40M');
  });

  it('carries the real all-time records, on their own scales, from the record', () => {
    expect(ALL_TIME.builtFrom).toBeGreaterThan(30_000);
    const gross = ALL_TIME.film.gross;
    expect(gross.length).toBeGreaterThan(20);
    expect(gross[0]!.gross!).toBeGreaterThan(2_000_000_000);
    expect([...gross].sort((a, b) => b.gross! - a.gross!)).toEqual(gross);
    // Every score on its own scale. This is what the emit clamp guarantees.
    for (const entry of ALL_TIME.film.imdb) {
      expect(entry.imdb!, entry.title).toBeGreaterThan(0);
      expect(entry.imdb!, entry.title).toBeLessThanOrEqual(10);
      expect(entry.imdbVotes!).toBeGreaterThanOrEqual(50_000);
    }
    for (const entry of ALL_TIME.television.imdb) {
      expect(entry.imdb!, entry.title).toBeLessThanOrEqual(10);
    }
    for (const entry of ALL_TIME.film.tomatometer) {
      expect(entry.tomatometer!, entry.title).toBeLessThanOrEqual(100);
      expect(entry.tomatometerCount!).toBeGreaterThanOrEqual(60);
    }
    expect(ALL_TIME.film.imdb[0]!.imdb!).toBeGreaterThan(8.9);
    expect(ALL_TIME.television.episodes[0]!.episodes!).toBeGreaterThan(1_000);
    expect(ALL_TIME.franchises[0]!.gross).toBeGreaterThan(10_000_000_000);
    expect(ALL_TIME.franchises[0]!.titles).toBeGreaterThan(5);
    // Every entry names the studios whose catalogue it came from.
    for (const entry of gross.slice(0, 10)) expect(entry.studioIds.length).toBeGreaterThan(0);
  });
});

describe('the television season', () => {
  it('runs from the summer, the way the business counts it', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'season-seed');
    const z = sim.homeZone;
    expect(seasonOf(sim, parseDateKey('2026-09-20', z, 12))).toBe('2026-27');
    expect(seasonOf(sim, parseDateKey('2027-02-10', z, 12))).toBe('2026-27');
    expect(seasonOf(sim, parseDateKey('2026-05-30', z, 12))).toBe('2025-26');
    expect(seasonOf(sim, parseDateKey('2026-06-02', z, 12))).toBe('2026-27');
    void zonedParts(sim.now, z);
    void MS_DAY;
  });
});
