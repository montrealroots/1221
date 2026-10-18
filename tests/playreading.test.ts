/**
 * Real plays from 2000 on (from 2026-10-08): their facts are the research's,
 * none is played, and each is read with a library's copy and researched,
 * which works the text craft the audition room reads. A read again knows the
 * last one.
 */
import { createSave,loadSave } from '@/engine';
import { CONTEMPORARY_PLAYS } from '@/engine/content/contemporary';
import { SCENES } from '@/engine/content/coursework';
import type { Simulation } from '@/engine/core/simulation';
import { MS_HOUR,instantFromZoned } from '@/engine/core/time';
import { deserialise,serialise } from '@/engine/persistence/adapter';
import { PLAYREADING,partFor,playById,studiesOf } from '@/engine/systems/playreading';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { readFileSync } from 'node:fs';
import { describe,expect,it } from 'vitest';

const zone = 'America/New_York';
const at = (month: number, day: number, hour = 9, year = 2026) => instantFromZoned({ year, month, day, hour, minute: 0 }, zone);
const life = (seed: string, title: 'actor' | 'actress' = 'actress') => {
  const sim = createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
  sim.player.performerTitle = title;
  return sim;
};
const tended = (sim: Simulation, until: number) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
type Fact = { name?: string; source: string; quote: string };
const rights = JSON.parse(readFileSync('docs/research/world/research-contemporary-plays-rights.json', 'utf8')) as { plays: { id: string; licensor: { us: (Fact & { name: string }) | null; uk: (Fact & { name: string }) | null } | null; firstPublished: { year: number; publisher: string; edition: string; source: string; quote: string } | null }[] };
const research = JSON.parse(readFileSync('docs/research/world/research-contemporary-plays.json', 'utf8')) as { retrieved: string; plays: { id: string; title: string; playwright: string; premiere: { year: number; date?: string; venue: string; source: string; quote: string }; cast: { text: string } | null; setting: { period: string } | null; publication: { year: number; publisher: string } | null }[] };

describe('the plays, as facts', () => {
  it('are at least twenty, from 2000 on, one a playwright, each fact the research’s with its page and words', () => {
    expect(CONTEMPORARY_PLAYS.length).toBeGreaterThanOrEqual(20);
    expect(new Set(CONTEMPORARY_PLAYS.map((p) => p.by)).size).toBe(CONTEMPORARY_PLAYS.length);
    expect(research.retrieved).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    for (const p of CONTEMPORARY_PLAYS) {
      const r = research.plays.find((x) => x.id === p.id)!;
      expect(r, p.id).toBeDefined();
      expect(p.premiere.year).toBeGreaterThanOrEqual(2000);
      expect(p.title.toLowerCase()).toBe(r.title.toLowerCase());
      expect([p.by, p.premiere.year, p.premiere.venue, p.premiere.date, p.source]).toEqual([r.playwright, r.premiere.year, r.premiere.venue, r.premiere.date, r.premiere.source]);
      expect(r.premiere.quote.length).toBeGreaterThan(20);
      if (p.cast) expect(p.cast.text).toBe(r.cast!.text.replace(/'/g, '’'));
      const x = rights.plays.find((y) => y.id === p.id)!;
      if (x.firstPublished) expect(p.published).toEqual({ year: x.firstPublished.year, by: x.firstPublished.publisher, acting: /acting/.test(x.firstPublished.edition) });
      else expect(p.published).toBeUndefined();
      const L = x.licensor as { us: Fact | null; uk: Fact | null; agent?: Fact & { name: string }; withheld?: Fact } | null;
      expect(p.licensor?.us).toBe(L?.us?.name);
      expect(p.licensor?.uk).toBe(L?.uk?.name);
      expect(p.licensor?.agent).toBe(L?.agent?.name);
      expect(Boolean(p.licensor?.withheld)).toBe(Boolean(L?.withheld));
      for (const fact of [L?.us, L?.uk, L?.agent, L?.withheld, x.firstPublished]) if (fact) expect([fact.source.startsWith('http'), fact.quote.length > 5]).toEqual([true, true]);
      expect(Boolean(p.setting)).toBe(Boolean(r.setting?.period));
    }
  });

  it('says who licenses each, or that the author’s agent does, or that it isn’t released; and every first edition', () => {
    expect(CONTEMPORARY_PLAYS.filter((p) => !p.published)).toEqual([]);
    // Jerusalem, whose US licensor couldn't be found, was taken out (2026-10-08).
    expect(playById('jerusalem')).toBeUndefined();
    expect(CONTEMPORARY_PLAYS).toHaveLength(29);
    expect(CONTEMPORARY_PLAYS.filter((p) => !p.licensor?.us && !p.licensor?.agent && !p.licensor?.withheld).map((p) => p.id)).toEqual([]);
  });

  it('none is played: no scene SLATE plays is from one, and the contemporary scenes are its own, said so', () => {
    const titles = new Set(CONTEMPORARY_PLAYS.map((p) => p.title.toLowerCase()));
    expect(SCENES.filter((s) => titles.has(s.play.toLowerCase()))).toEqual([]);
    const recent = SCENES.filter((s) => s.year > 1930);
    expect(recent.length).toBeGreaterThan(0);
    expect(recent.every((s) => s.origin === 'original')).toBe(true);
  });

  it('a part for you reads the cast as published: the women and men, the youngest age, or nothing on record', () => {
    const sim = life('pl-fit', 'actor');
    expect(partFor(sim.player, playById('fleabag')!, sim.now, zone)).toBe('no');
    sim.player.performerTitle = 'actress';
    expect(partFor(sim.player, playById('fleabag')!, sim.now, zone)).toBe('yes');
    expect(partFor(sim.player, playById('escaped-alone')!, sim.now, zone)).toBe('no');
    expect(partFor(sim.player, playById('disgraced')!, sim.now, zone)).toBe('unknown');
  });
});

describe('reading one at school', () => {
  it('needs the library known, takes its time, works the text craft, and leaves a note on what was read', () => {
    const sim = life('pl-read');
    expect(sim.execute({ kind: 'plays.read', payload: { playId: 'sweat' } }).error).toBe('You don’t know where the library is yet. The building tour in Orientation shows you.');
    tended(sim, at(9, 5, 18));
    expect(sim.execute({ kind: 'plays.read', payload: { playId: 'nothing' } }).error).toBe('There’s no such play.');
    const before = sim.player.craft!.script;
    const t0 = sim.now;
    const r = sim.must<{ minutes: number; note: string }>({ kind: 'plays.read', payload: { playId: 'sweat' } });
    expect(r.minutes).toBe(PLAYREADING.minutes.full);
    expect(sim.now - t0).toBe(r.minutes * 60_000);
    expect(sim.player.craft!.script).toBeGreaterThan(before);
    expect(r.note).toBe('Sweat, by Lynn Nottage, read through. It reads as a drama, based on interviews with residents. The cast as published: 3 women and 6 men. There’s a part in it for you. It’s set: Reading, Pennsylvania, the time not given.');
    // A monologue is the short read.
    expect(sim.must<{ minutes: number }>({ kind: 'plays.read', payload: { playId: 'fleabag' } }).minutes).toBe(PLAYREADING.minutes.short);
  });

  it('read again knows the last read: too soon trains nothing; a month on it trains less and turns to what wasn’t noticed', () => {
    let sim = life('pl-again');
    tended(sim, at(9, 5, 18));
    const s0 = sim.player.craft!.script;
    sim.must({ kind: 'plays.read', payload: { playId: 'doubt-a-parable' } });
    const firstGain = sim.player.craft!.script - s0;
    tended(sim, at(9, 6, 18));
    const s1 = sim.player.craft!.script;
    const soon = sim.must<{ minutes: number; note: string }>({ kind: 'plays.read', payload: { playId: 'doubt-a-parable' } });
    expect(soon.minutes).toBe(PLAYREADING.minutes.full * PLAYREADING.again);
    expect(soon.note).toMatch(/^You read it again\. Your last read was .*\. It’s too soon after that one to see it fresh\.$/);
    expect(sim.player.craft!.script).toBe(s1);
    sim = reload(sim);
    tended(sim, at(10, 9, 18));
    const s2 = sim.player.craft!.script;
    const later = sim.must<{ note: string }>({ kind: 'plays.read', payload: { playId: 'doubt-a-parable' } });
    expect(sim.player.craft!.script).toBeGreaterThan(s2);
    expect(sim.player.craft!.script - s2).toBeLessThan(firstGain);
    // Everything on record was noticed the first time: it turns to the one noticed longest ago.
    expect(later.note).toMatch(/This time: It reads as a drama\.$/);
    const study = studiesOf(sim.player)['doubt-a-parable']!;
    expect(study.reads).toBe(3);
    expect(study.notes).toHaveLength(3);
    expect(study.noticed.at(-1)).toBe('form');
  });

  it('researched once, after a read, at the library: the first production and edition, and the craft once more', () => {
    let sim = life('pl-research');
    tended(sim, at(9, 5, 18));
    expect(sim.execute({ kind: 'plays.research', payload: { playId: 'the-children' } }).error).toBe('Read the play first. You need questions before you can research it.');
    sim.must({ kind: 'plays.read', payload: { playId: 'the-children' } });
    sim = reload(sim);
    const s0 = sim.player.craft!.script;
    const r = sim.must<{ minutes: number; note: string }>({ kind: 'plays.research', payload: { playId: 'the-children' } });
    expect(r.minutes).toBe(PLAYREADING.minutes.research);
    expect(r.note).toBe('First staged in 2016 at Royal Court Theatre (Jerwood Theatre Downstairs), London. First published 2016, by Nick Hern Books. Licensed for performance in the US by Dramatists Play Service, in the UK by Nick Hern Books (amateur rights).');
    expect(sim.player.craft!.script).toBeGreaterThan(s0);
    expect(sim.execute({ kind: 'plays.research', payload: { playId: 'the-children' } }).error).toBe('You’ve already researched its first production, and there’s nothing more on record to find.');
    expect(reload(sim).player.plays!['the-children']!.researchedAt).toBeDefined();
  });

  it('researched, a play no house licenses names the author’s agent, and one held back says so', () => {
    const sim = life('pl-rights');
    tended(sim, at(9, 5, 18));
    for (const id of ['black-watch', 'fleabag']) sim.must({ kind: 'plays.read', payload: { playId: id } });
    expect(sim.must<{ note: string }>({ kind: 'plays.research', payload: { playId: 'black-watch' } }).note).toBe('First staged in 2006 at Edinburgh Festival Fringe (National Theatre of Scotland production). First published 2007, by Faber & Faber. Its rights are by application to the author’s agent, Casarotto Ramsay & Associates.');
    expect(sim.must<{ note: string }>({ kind: 'plays.research', payload: { playId: 'fleabag' } }).note).toBe('First staged in 2013 at Edinburgh Festival Fringe (then Soho Theatre, London). First published 2013, by Nick Hern Books. Its performing rights aren’t released.');
  });

  // Until 2026-10-13 a test here moved her to New York by hand to reach “A copy is at the Haas Arts Library, in New
  // Haven.”, which went that day: nothing in the game moves a life after it begins.
});
