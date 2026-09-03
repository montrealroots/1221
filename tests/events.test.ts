/**
 * The industry's real calendar.
 *
 * Every event is a real one under its own name; the dates SLATE has verified
 * are marked with where they came from; a year with nothing verified is
 * projected from the usual pattern and labelled as such; and the rules that
 * do the projecting land within a fortnight of every verified date, which is
 * how a wrong rule would show itself.
 */

import { describe, expect, it } from 'vitest';
import { INDUSTRY_EVENTS, lookupEvent } from '@/engine/content/events-data';
import { eventsOnDay, occurrence, occurrenceTitle, resolveRule, upcomingEvents } from '@/engine/content/events';
import { EDITORIAL } from '@/engine/content/events-rules';
import { monthGrid } from '@/engine/world/calendar';
import { quickSave } from '@/engine';

const dayDiff = (a: string, b: string) => Math.round((Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10)) - Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10))) / 86_400_000);

describe('the list itself', () => {
  it('is large, unique, sourced, and honest about what is projected', () => {
    expect(INDUSTRY_EVENTS.length).toBeGreaterThan(120);
    const ids = new Set<string>();
    for (const e of INDUSTRY_EVENTS) {
      expect(ids.has(e.id), `duplicate id ${e.id}`).toBe(false);
      ids.add(e.id);
      expect(e.sources.length, `${e.id} has no source`).toBeGreaterThan(0);
      expect(e.days).toBeGreaterThan(0);
      // Nothing verified means the entry must say so.
      if (Object.keys(e.known).length === 0) expect(e.sources.includes(EDITORIAL), `${e.id} has no verified date and does not say so`).toBe(true);
      if (e.kind === 'awards') expect((e.categories ?? []).length, `${e.id} lists no awards`).toBeGreaterThan(0);
      if (e.kind === 'festival') expect((e.prizes ?? []).length + (e.sections ?? []).length, `${e.id} lists nothing it does`).toBeGreaterThan(0);
      if (e.kind === 'fan' || e.kind === 'market') expect((e.activities ?? []).length + (e.prizes ?? []).length, `${e.id} lists nothing that happens there`).toBeGreaterThan(0);
    }
  });

  it('projects every verified date within a fortnight of its rule', () => {
    for (const e of INDUSTRY_EVENTS) {
      for (const [year, known] of Object.entries(e.known)) {
        const projected = resolveRule(e.start, Number(year), e.zone, lookupEvent);
        const moved = /postponed|moved/i.test(known.note ?? '');
        expect(Math.abs(dayDiff(projected, known.start)), `${e.id} ${year}: rule says ${projected}, source says ${known.start}`).toBeLessThanOrEqual(e.cadence === 'irregular' || moved ? 366 : 21);
        if (known.end) expect(known.end >= known.start).toBe(true);
        if (known.nominations) expect(known.nominations < known.start, `${e.id} ${year} nominations after the ceremony`).toBe(true);
      }
    }
  });
});

describe('the dates', () => {
  it('reads the verified 2026 dates and marks them verified', () => {
    const oscars = occurrence(lookupEvent('oscars')!, 2026, lookupEvent)!;
    expect(oscars.start).toBe('2026-03-15');
    expect(oscars.nominations).toBe('2026-01-22');
    expect(oscars.verified).toBe(true);
    expect(oscars.edition).toBe(98);
    expect(occurrenceTitle(oscars)).toBe('The 98th Academy Awards');
    const cannes = occurrence(lookupEvent('cannes')!, 2026, lookupEvent)!;
    expect([cannes.start, cannes.end]).toEqual(['2026-05-12', '2026-05-23']);
    expect(occurrence(lookupEvent('sdcc')!, 2026, lookupEvent)!.milestones[0]).toEqual({ label: 'Preview Night', date: '2026-07-22', verified: true });
  });

  it('projects later years from the pattern and says so', () => {
    const oscars28 = occurrence(lookupEvent('oscars')!, 2028, lookupEvent)!;
    expect(oscars28.verified).toBe(false);
    expect(oscars28.start).toBe('2028-03-12'); // the Sunday nearest March 12
    expect(oscars28.edition).toBe(100);
    expect(occurrenceTitle(oscars28)).toBe('The 100th Academy Awards');
    // The Razzies are the day before the Oscars, whatever year it is.
    expect(occurrence(lookupEvent('razzies')!, 2028, lookupEvent)!.start).toBe('2028-03-11');
    // Labor Day 2027 is September 6: Telluride the Friday before, Toronto the Thursday after.
    expect([occurrence(lookupEvent('telluride')!, 2027, lookupEvent)!.start, occurrence(lookupEvent('telluride')!, 2027, lookupEvent)!.end]).toEqual(['2027-09-03', '2027-09-06']);
    expect(occurrence(lookupEvent('tiff')!, 2027, lookupEvent)!.start).toBe('2027-09-09');
    // The European Film Awards: January in even years, December in odd.
    expect(occurrence(lookupEvent('european-film-awards')!, 2027, lookupEvent)!.start.slice(5, 7)).toBe('12');
    expect(occurrence(lookupEvent('european-film-awards')!, 2028, lookupEvent)!.start.slice(5, 7)).toBe('01');
    // D23 is every other year; Star Wars Celebration only when announced.
    expect(occurrence(lookupEvent('d23')!, 2027, lookupEvent)).toBeUndefined();
    expect(occurrence(lookupEvent('d23')!, 2028, lookupEvent)).toBeDefined();
    expect(occurrence(lookupEvent('star-wars-celebration')!, 2028, lookupEvent)).toBeUndefined();
    expect(occurrence(lookupEvent('star-wars-celebration')!, 2027, lookupEvent)!.start).toBe('2027-04-01');
  });

  it('knows what is happening on a day', () => {
    const oscarNight = eventsOnDay(INDUSTRY_EVENTS, '2026-03-15', lookupEvent);
    expect(oscarNight.some((d) => d.occurrence.event.id === 'oscars' && d.phase === 'ceremony')).toBe(true);
    const nominations = eventsOnDay(INDUSTRY_EVENTS, '2026-01-22', lookupEvent);
    expect(nominations.some((d) => d.occurrence.event.id === 'oscars' && d.phase === 'nominations')).toBe(true);
    const cannesDay3 = eventsOnDay(INDUSTRY_EVENTS, '2026-05-14', lookupEvent).find((d) => d.occurrence.event.id === 'cannes')!;
    expect(cannesDay3.detail).toBe('Day 3 Of 12');
    // A December nominations day belongs to January's ceremony.
    expect(eventsOnDay(INDUSTRY_EVENTS, '2025-12-08', lookupEvent).some((d) => d.occurrence.event.id === 'golden-globes' && d.phase === 'nominations')).toBe(true);
  });

  it('lists what is coming, soonest first', () => {
    const next = upcomingEvents(INDUSTRY_EVENTS, '2026-03-02', 30, lookupEvent);
    expect(next.length).toBe(30);
    for (let i = 1; i < next.length; i++) expect(next[i]!.start >= next[i - 1]!.start).toBe(true);
    expect(next.some((o) => o.event.id === 'oscars')).toBe(true);
  });

  it('shows on the month grid', () => {
    const sim = quickSave({}, 'industry-grid');
    const march = monthGrid(sim, 2026, 3);
    const fifteenth = march.find((d) => d.inMonth && d.dayOfMonth === 15)!;
    expect(fifteenth.industry.some((d) => d.occurrence.event.id === 'oscars')).toBe(true);
  });
});
