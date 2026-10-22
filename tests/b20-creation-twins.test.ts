/**
 * Brief 20, the creation area (docs/verification/audit-2026-10-21/areas/creation): each choice creation makes that
 * should change play, played as twins. Two lives alike in everything but the one choice, from the same seed, through
 * the commands and the clock, and then the difference the choice should make where it's relevant, by its size or its
 * direction, and no difference where it isn't, as equality.
 *
 * PLAYER JOURNEYS: a new life as creation makes it (`newLifeConfig`, the choices the screens set), born in New York unless
 * a test says where, Ada Cole, she/her, at Yale in New Haven from 7:30 AM Monday 24 August 2026, begun as `SlateApp`'s
 * `start` begins it (`paused: true`), with "I Know SLATE." (`tutorial: false`) where a test issues commands the guide would
 * lock until its chapter. A life outside the School, which creation never makes, is a test's or a tool's
 * (`defaultConfig`), and is said to be wherever one is used. The seeds are this file's, b20-c-*, chosen before any ran,
 * for nothing they draw.
 *
 * TEST SETUP, said again where it's done: the calendar's commitments that want the player canceled before an hour the
 * test measures, and the dials set alike in every twin before one.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createSave, loadSave, refreshMeta } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Account } from '@/engine/core/ledger';
import { DEFAULT_CITY_ID, FAMILIES, atSchool, defaultConfig, newLifeConfig, newLifeFrom, withFamily, type NewSaveConfig, type StartingWealth } from '@/engine/world/bootstrap';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { BRIEF_BY_ID } from '@/engine/content/briefs';
import { CITIES } from '@/engine/content/geography';
import { BIRTHDAY_KIND } from '@/engine/systems/birthdays';
import { chanceOfEndingYear } from '@/engine/systems/mortality';
import { bmiOf } from '@/engine/systems/body';
import { weatherAt } from '@/engine/systems/weather';
import { monthGrid } from '@/engine/world/calendar';
import { projectOf } from '@/engine/systems/projobs';
import { chapterFor } from '@/engine/world/tutorial';
import { CHAPTERS } from '@/engine/content/tutorial';
import { YALE_DRAMA } from '@/engine/content/school';
import { addCountryHolidays } from '@/engine/content/holidays';
import { US_STATUS_KIND } from '@/engine/systems/permission';
import { SUMMER_KIND } from '@/engine/systems/school';
import { courseworkOf } from '@/engine/systems/coursework';
import { PREP_DIMS } from '@/engine/content/coursework';
import { genresOfPlay } from '@/engine/content/plays';
import type { ScheduledItem } from '@/engine/core/scheduler';

/** An instant in New Haven on Eastern Daylight Time (UTC−4), worked out here, not by the engine. */
const EDT = (year: number, month: number, day: number, hour: number, minute = 0): number => Date.UTC(year, month - 1, day, hour + 4, minute);
/** Ada, as Identity leaves her: born in New York, named, she/her; everything else as a new life begins. */
const ada = (extra: Partial<NewSaveConfig> = {}): NewSaveConfig => ({ ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });
/** A life begun as `SlateApp` begins it, with "I Know SLATE." chosen unless the config says otherwise. */
const begun = (seed: string, config: NewSaveConfig): Simulation => createSave(1, seed, { ...config, tutorial: config.tutorial === true, paused: true });
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
/** TEST SETUP: nothing on the calendar that wants the player, canceled by hand. */
function clearCalendar(sim: Simulation): void {
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
}
const mine = (sim: Simulation, kind: Account['kind']) => Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && a.kind === kind && !a.closedAt);
const balanceOf = (sim: Simulation, kind: Account['kind']) => mine(sim, kind).reduce((n, a) => n + a.balance, 0);
/** The parts posted to the actor in the career, each by its project and the Monday it was posted. */
const postings = (sim: Simulation) => (sim.player.pro?.opportunities ?? []).map((o) => `${o.projectId}@${o.postedAt}`).sort();
/** The same brief taped cold on the first morning, through `brief.choose` and `practice.self_tape`: its judged result. */
function tapedCold(sim: Simulation, briefId = 'brief-drama'): number {
  clearCalendar(sim);
  const b = BRIEF_BY_ID[briefId]!;
  expect(sim.execute({ kind: 'brief.choose', payload: { brief: b.id, reading: b.readings[0]!.id } }).ok).toBe(true);
  const r = sim.execute<{ overall: number }>({ kind: 'practice.self_tape', payload: { genre: b.kinds[0], brief: b.id } });
  expect(r.ok, r.error).toBe(true);
  return r.value!.overall;
}

// ---------------------------------------------------------------------------------------------------------------------
// Starting means
// ---------------------------------------------------------------------------------------------------------------------

describe('the family, and the means it starts with', () => {
  /** Each family, chosen on Genres & Background's select (`withFamily`), on one seed. */
  const families = () => Object.fromEntries(FAMILIES.map((w) => [w, begun('b20-c-means', withFamily(ada(), w))])) as Record<StartingWealth, Simulation>;

  it('PLAYER JOURNEY: opens the money each family says, and the term’s first morning pays a student with need the scholarship and has a wealthy one pay the plan; the School, the craft and the career’s postings are the same for all six', () => {
    const lives = families();
    // The profiles' euros at SLATE's 0.92 to the dollar, to the whole dollar (as tests/need-paths.test.ts works them):
    // checking, savings, what the card carries in, and the score.
    const opened: Record<StartingWealth, [number, number, number, number]> = {
      nothing: [43_00, 0, 0, 520],
      scraping: [1_348_00, 326_00, -913_00, 610],
      modest: [5_217_00, 7_065_00, -457_00, 690],
      comfortable: [19_565_00, 45_652_00, 0, 748],
      wealthy: [92_391_00, 413_043_00, 0, 795],
      inherited: [260_870_00, 2_608_696_00, 0, 812],
    };
    for (const w of FAMILIES) {
      const sim = lives[w];
      expect([balanceOf(sim, 'checking'), balanceOf(sim, 'savings'), balanceOf(sim, 'credit_card'), sim.player.credit!.score], w).toEqual(opened[w]);
      // A family with nothing has no card; every other has the bank's own.
      expect(mine(sim, 'credit_card').length, w).toBe(w === 'nothing' ? 0 : 1);
      expect(sim.ledger.audit(), w).toEqual([]);
    }
    // 10 AM: the fall term began at 9, and Yale's need assessment read the family. With need, the living-expense
    // scholarship less the plan's half, $13,318.50, is paid to the bank; with none, the plan's $1,882 is paid from it.
    const before = Object.fromEntries(FAMILIES.map((w) => [w, balanceOf(lives[w], 'checking')]));
    for (const w of FAMILIES) lives[w].advanceTo(EDT(2026, 8, 24, 10));
    for (const w of FAMILIES) {
      const moved = balanceOf(lives[w], 'checking') - before[w]!;
      expect(moved, w).toBe(w === 'wealthy' || w === 'inherited' ? -1_882_00 : 13_318_50);
    }
    // Where it isn't relevant, nothing differs: the classmates admitted with them, the craft and abilities drawn at
    // enrollment, and the parts the career posts over the term's first ten weeks.
    for (const w of FAMILIES) lives[w].advanceTo(EDT(2026, 11, 2, 10));
    const school = (sim: Simulation) => ({ mates: sim.player.school!.classmates.map((m) => [m.name, m.craft]), attrs: sim.player.attrs, postings: postings(sim) });
    for (const w of FAMILIES) expect(school(lives[w]), w).toEqual(school(lives.modest));
    expect(postings(lives.modest).length).toBeGreaterThan(0);
  });

  // Renamed on 2026-10-22 (brief 21): until then “PLAYER JOURNEY: a Scraping family’s card carries $913 into the life and the autopay clears it on 11 October; a Modest one’s $457 likewise, and the Nothing family has no card to pay”; Chase's due day became the 13th.
  it('PLAYER JOURNEY: a Scraping family’s card carries $913 into the life and the autopay clears it on 13 October; a Modest one’s $457 likewise, and the Nothing family has no card to pay', () => {
    const lives = families();
    for (const w of ['scraping', 'modest', 'nothing'] as const) lives[w].advanceTo(EDT(2026, 10, 14, 12));
    const paid = (sim: Simulation) => sim.universe.transactions.filter((t) => t.memo.startsWith('Paid ') && t.postings.some((p) => mine(sim, 'credit_card').some((c) => c.id === p.accountId)))
      .map((t) => t.postings.find((p) => mine(sim, 'credit_card').some((c) => c.id === p.accountId))!.amount);
    expect(paid(lives.scraping)).toEqual([913_00]);
    expect(paid(lives.modest)).toEqual([457_00]);
    expect(balanceOf(lives.scraping, 'credit_card')).toBe(0);
    expect(mine(lives.nothing, 'credit_card')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// The genres loved
// ---------------------------------------------------------------------------------------------------------------------

/** TEST SETUP: the clock moved six hours at a time with the body kept fed, rested and awake, as a player's meals and sleep keep it. */
function tended(sim: Simulation, until: number): void {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
}
/** TEST SETUP: the coursework done each midnight, as a student who prepares keeps it, so the standing stays good (tests/evidence-g28-ui.test.ts's `working`). */
const working = (sim: Simulation): Simulation => {
  sim.onEvent('world.day_rollover', 'test.doTheWork', (_e, { sim: s }) => {
    for (const a of courseworkOf(s, s.player)?.assignments ?? []) if (a.status === 'open' || a.status === 'revising') for (const d of PREP_DIMS) a.prep[d] = Math.max(a.prep[d] ?? 0, 0.95);
  });
  return sim;
};
/** The dials an instant before an item and at it: what the item itself did. */
function across(sim: Simulation, item: ScheduledItem): { morale: number; stress: number } {
  tended(sim, item.at - 1);
  const was = { ...sim.player.wellbeing };
  sim.advanceTo(item.at);
  expect(item.status, item.label).toBe('done');
  return { morale: sim.player.wellbeing.morale - was.morale, stress: sim.player.wellbeing.stress - was.stress };
}

describe('the genres loved', () => {
  it('PLAYER JOURNEY: the Summer Cabaret’s first rehearsal of Miss Julie, a drama, is 1.5 more morale and 1.5 less stress for a lover of drama than for a lover of westerns, which no play is; a lover of comedy and a life loving nothing have the westerns’ hour', () => {
    const loves = (genres: string[]) => {
      const sim = working(begun('b20-c-genre-1', ada({ genres })));
      // The spring term's first day, the company joined through `school.summer_cabaret`.
      tended(sim, Date.UTC(2027, 0, 5, 17));
      const joined = sim.execute({ kind: 'school.summer_cabaret', payload: {} });
      expect(joined.ok, joined.error).toBe(true);
      const first = sim.universe.scheduled.filter((i) => i.status === 'pending' && i.kind === SUMMER_KIND && i.payload.call === 'rehearsal' && i.payload.run === 0).sort((a, b) => a.at - b.at)[0]!;
      const school = sim.player.school as unknown as { summer: { shows: { play: string }[] } };
      return { play: school.summer.shows[0]!.play, hour: across(sim, first) };
    };
    const drama = loves(['drama']);
    const comedy = loves(['comedy']);
    const western = loves(['western']);
    const none = loves([]);
    expect([drama.play, genresOfPlay(drama.play)]).toEqual(['Miss Julie', ['drama', 'tragedy']]);
    expect(drama.hour.morale - western.hour.morale).toBeCloseTo(1.5, 9);
    expect(drama.hour.stress - western.hour.stress).toBeCloseTo(-1.5, 9);
    expect(comedy.hour).toEqual(western.hour);
    expect(western.hour).toEqual(none.hour);
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// Pronouns and the performer's title
// ---------------------------------------------------------------------------------------------------------------------

describe('the pronouns, and actor or actress', () => {
  const four = () => ({
    she: begun('b20-c-title', ada({ pronouns: 'she/her' })),
    theyActress: begun('b20-c-title', ada({ pronouns: 'they/them', performerTitle: 'actress' })),
    he: begun('b20-c-title', ada({ pronouns: 'he/him' })),
    theyActor: begun('b20-c-title', ada({ pronouns: 'they/them', performerTitle: 'actor' })),
  });

  it('PLAYER JOURNEY: changes which of the career’s parts are posted, each written for the title or for either, and the parts for either alike; the pronouns themselves change nothing the title doesn’t', () => {
    const lives = four();
    for (const sim of Object.values(lives)) sim.advanceTo(EDT(2026, 12, 21, 10));
    const posted = (sim: Simulation) => (sim.player.pro?.opportunities ?? []).map((o) => ({ at: o.postedAt, id: o.projectId, for: projectOf(o).role.for }));
    for (const [who, sim] of Object.entries(lives)) {
      const title = sim.player.performerTitle;
      expect(posted(sim).length, who).toBeGreaterThan(2);
      for (const p of posted(sim)) expect([title, 'either'], `${who}: ${p.id}`).toContain(p.for);
    }
    // she/her is an actress and he/him an actor; they/them is what the player picks, and posts as that title does.
    expect(lives.she.player.performerTitle).toBe('actress');
    expect(lives.he.player.performerTitle).toBe('actor');
    expect(postings(lives.theyActress)).toEqual(postings(lives.she));
    expect(postings(lives.theyActor)).toEqual(postings(lives.he));
    // The two titles are posted different parts, and the parts written for either alike.
    expect(postings(lives.she)).not.toEqual(postings(lives.he));
    const either = (sim: Simulation) => posted(sim).filter((p) => p.for === 'either').map((p) => `${p.id}@${p.at}`);
    expect(either(lives.she).length).toBeGreaterThan(0);
    expect(either(lives.he)).toEqual(either(lives.she));
    // Pronouns alone, the title held: the whole life the same to the byte but for the word itself.
    const scrub = (sim: Simulation) => serialise(sim.universe).replace(/"pronouns":"[^"]*"/g, '');
    expect(scrub(lives.theyActress)).toBe(scrub(lives.she));
    expect(scrub(lives.theyActor)).toBe(scrub(lives.he));
  });

  it('PLAYER JOURNEY: judges the same take the same: a brief taped cold on the first morning is the same result for an actress and an actor, and the slot names each by the title', () => {
    const lives = four();
    const results = Object.fromEntries(Object.entries(lives).map(([who, sim]) => [who, tapedCold(sim)]));
    expect(new Set(Object.values(results)).size).toBe(1);
    for (const sim of Object.values(lives)) refreshMeta(sim);
    expect(lives.she.universe.meta.careerLabel).toBe('Actress, Yale Drama Year 1');
    expect(lives.he.universe.meta.careerLabel).toBe('Actor, Yale Drama Year 1');
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// Birthplace and citizenship
// ---------------------------------------------------------------------------------------------------------------------

describe('the place of birth, and the citizenship it decides', () => {
  it('PLAYER JOURNEY: gives a New York birth an American citizen’s papers and no visa, and a London or Toronto birth that country’s passport and an F-1 student visa to the program’s end and its grace, looked at when the status can next change', () => {
    const born = (city: string) => begun('b20-c-born', ada({ homeRegionId: city }));
    const ny = born('us-ny-newyork');
    const london = born('uk-eng-london');
    const toronto = born('ca-on-toronto');
    expect([ny.player.citizenshipId, london.player.citizenshipId, toronto.player.citizenshipId]).toEqual(['us', 'uk', 'ca']);
    const papers = (sim: Simulation) => (sim.player.documents ?? []).map((d) => `${d.kind}:${d.issuer}`).sort();
    expect(papers(ny).some((p) => p.startsWith('visa'))).toBe(false);
    expect(papers(london)).toEqual(['passport:GB', 'visa:US']);
    expect(papers(toronto)).toEqual(['passport:CA', 'visa:US']);
    // The visa runs to the end of May in the class's last year, and the grace after it: 60 days to 30 July 2029.
    const visa = london.player.documents!.find((d) => d.kind === 'visa')!;
    expect(visa.name).toBe('F-1 Student Visa');
    expect(visa.expiresAt).toBe(Date.UTC(2029, 4, 31, 12) + 60 * MS_DAY);
    // A foreign student's status is on the clock; a citizen's isn't.
    const status = (sim: Simulation) => sim.universe.scheduled.filter((i) => i.status === 'pending' && i.kind === US_STATUS_KIND).length;
    expect(status(ny)).toBe(0);
    expect(status(london)).toBe(1);
    expect(status(toronto)).toBe(1);
    // The body creation leaves undrawn is drawn from the birth country's adults: the same seed, a different body.
    expect(london.player.body).not.toEqual(ny.player.body);
    // Where it isn't relevant: the same School, the same class, the same craft.
    expect(london.player.school!.classmates.map((m) => m.name)).toEqual(ny.player.school!.classmates.map((m) => m.name));
    expect(london.player.craft).toEqual(ny.player.craft);
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// Where the life begins
// ---------------------------------------------------------------------------------------------------------------------

describe('where the life begins', () => {
  it('PLAYER JOURNEY: every life creation makes begins in New Haven on the fall term’s first day, whatever a draft said', () => {
    const drafted = newLifeFrom({ ...ada(), startLocationId: 'uk-eng-london', startYear: 2031, startMonth: 3, startDay: 2, school: undefined });
    expect([drafted.startLocationId, drafted.startYear, drafted.startMonth, drafted.startDay, drafted.school]).toEqual([YALE_DRAMA.cityId, 2026, 8, 24, 'yale-drama']);
    const sim = begun('b20-c-where', drafted);
    expect(sim.player.currentLocationId).toBe('us-ct-newhaven');
    expect(sim.now).toBe(EDT(2026, 8, 24, 7, 30));
    expect(sim.universe.meta.currency).toBe('USD');
  });

  it('TEST SETUP lives (a tool’s, outside the School): a start in New York and one in London keep different banks, money, holidays and weather', () => {
    // TEST SETUP: the holiday files the app fetches for a save's countries when it opens (`loadPlacesFor`), read from disk,
    // as tests/evidence-g07-life.test.ts reads them.
    addCountryHolidays('us', readFileSync('public/holidays/us.tsv', 'utf8'));
    addCountryHolidays('uk', readFileSync('public/holidays/uk.tsv', 'utf8'));
    const at = (city: string) => createSave(1, 'b20-c-where', { ...defaultConfig(), homeRegionId: city, startLocationId: city, livesWhereBorn: true, wealth: 'modest', startYear: 2026, startMonth: 8, startDay: 24 });
    const ny = at('us-ny-newyork');
    const london = at('uk-eng-london');
    expect([ny.universe.meta.currency, london.universe.meta.currency]).toEqual(['USD', 'GBP']);
    const bank = (sim: Simulation) => mine(sim, 'checking')[0]!.bankId;
    expect(bank(ny)).toBe('us-chase');
    expect(bank(london)).not.toBe('us-chase');
    expect(CITIES.get(ny.player.currentLocationId)!.countryId).toBe('us');
    // The holidays each keeps: England's summer bank holiday on 31 August, the United States' Labor Day on 7 September.
    const holidays = (sim: Simulation, month: number) => monthGrid(sim, 2026, month).filter((d) => d.inMonth && d.holidays.length).map((d) => d.key);
    expect(holidays(london, 8)).toContain('2026-08-31');
    expect(holidays(ny, 8)).not.toContain('2026-08-31');
    expect(holidays(ny, 9)).toContain('2026-09-07');
    expect(holidays(london, 9)).not.toContain('2026-09-07');
    // The weather is each city's own.
    const weather = (sim: Simulation) => weatherAt(sim, sim.player.currentLocationId);
    expect(weather(ny)).toBeDefined();
    expect(weather(london)).toBeDefined();
    expect(weather(london)).not.toEqual(weather(ny));
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// Height and weight
// ---------------------------------------------------------------------------------------------------------------------

describe('the height and the weight', () => {
  it('PLAYER JOURNEY: reach the body as given, and the same workout each morning for two weeks takes more off a heavier body; the weight raises the year’s chance of its end; the same take is judged the same', () => {
    const body = (weightKg: number) => begun('b20-c-body', ada({ heightCm: 175, weightKg }));
    const light = body(62);
    const heavy = body(95);
    expect(light.player.body).toMatchObject({ heightCm: 175, weightKg: 62, startKg: 62 });
    expect(heavy.player.body).toMatchObject({ heightCm: 175, weightKg: 95, startKg: 95 });
    // Out of creation's range, the body is drawn as if none were given.
    expect(begun('b20-c-body', ada({ heightCm: 300, weightKg: 95 })).player.body).toEqual(begun('b20-c-body', ada()).player.body);
    // The same take on the first morning, whatever the body.
    expect(tapedCold(heavy)).toBe(tapedCold(light));
    // Fourteen mornings, a workout at 7 AM through Look After Yourself (TEST SETUP: the calendar cleared and the dials
    // set alike in both before it).
    for (let d = 1; d <= 14; d += 1) {
      for (const sim of [light, heavy]) {
        sim.advanceTo(EDT(2026, 8, 24 + d, 7));
        clearCalendar(sim);
        Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 70, morale: 70, hygiene: 90 });
        sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
        const r = sim.execute({ kind: 'life.look_after', payload: { action: 'exercise' } });
        expect(r.ok, r.error).toBe(true);
      }
    }
    for (const sim of [light, heavy]) sim.advanceTo(EDT(2026, 9, 8, 1));
    const lost = (sim: Simulation, from: number) => from - sim.player.body!.weightKg;
    expect(lost(light, 62)).toBeGreaterThan(0);
    expect(lost(heavy, 95)).toBeGreaterThan(lost(light, 62));
    // What the weight raises: a body mass index of 31 against 20 is a larger chance of the year ending (`bmiHazard`).
    expect(bmiOf(heavy.player.body!)).toBeGreaterThan(30);
    expect(bmiOf(light.player.body!)).toBeLessThan(21);
    const age = (sim: Simulation) => (sim.now - sim.player.birthInstant) / (365.2425 * MS_DAY);
    expect(chanceOfEndingYear(heavy.player, age(heavy), 'us')).toBeGreaterThan(chanceOfEndingYear(light.player, age(light), 'us'));
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// The date of birth
// ---------------------------------------------------------------------------------------------------------------------

describe('the date of birth', () => {
  it('PLAYER JOURNEY: puts the birthday on the calendar on its own day, and the day says the age turned', () => {
    const june = begun('b20-c-born-on', ada({ birthYear: 2002, birthMonth: 6, birthDay: 14 }));
    const november = begun('b20-c-born-on', ada({ birthYear: 1999, birthMonth: 11, birthDay: 3 }));
    const birthday = (sim: Simulation) => sim.universe.scheduled.find((i) => i.status === 'pending' && i.kind === BIRTHDAY_KIND)!.at;
    expect(birthday(june)).toBe(instantFromZoned({ year: 2027, month: 6, day: 14, hour: 9 }, 'America/New_York'));
    const day = birthday(november);
    expect(day).toBe(instantFromZoned({ year: 2026, month: 11, day: 3, hour: 9 }, 'America/New_York'));
    november.advanceTo(day + MS_HOUR);
    expect(november.universe.notifications.filter((n) => n.at === day).map((n) => `${n.title}: ${n.body}`)).toEqual(['Happy Birthday: 27: You’re 27 today.']);
    // The next one is on the calendar a year on, on the same day.
    expect(birthday(november)).toBe(instantFromZoned({ year: 2027, month: 11, day: 3, hour: 9 }, 'America/New_York'));
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// The guide, the paused clock, the School, and the start date kept
// ---------------------------------------------------------------------------------------------------------------------

describe('the guide, and the clock it starts on', () => {
  it('PLAYER JOURNEY: Guide Me Through It locks a command until its chapter is read, in order; I Know SLATE locks nothing; both begin paused', () => {
    const guided = createSave(1, 'b20-c-guide', { ...ada(), tutorial: true, paused: true });
    const open = createSave(1, 'b20-c-guide', { ...ada(), tutorial: false, paused: true });
    expect(guided.universe.tutorial).toEqual({ read: [] });
    expect(open.universe.tutorial).toBeUndefined();
    expect([guided.universe.preferences.timeSpeed, open.universe.preferences.timeSpeed]).toEqual(['paused', 'paused']);
    // An unguided life made by a tool runs live; a life the screens make never does.
    expect(createSave(1, 'b20-c-guide', ada()).universe.preferences.timeSpeed).toBe('live');
    const chapter = chapterFor('life.look_after')!;
    expect(chapter).toBeDefined();
    const refused = guided.execute({ kind: 'life.look_after', payload: { action: 'eat' } });
    expect(refused.ok).toBe(false);
    expect(refused.error).toContain(`Read “${chapter.title}” in the guide first.`);
    expect(open.execute({ kind: 'life.look_after', payload: { action: 'eat' } }).ok).toBe(true);
    // Read in order up to it, the command goes through.
    for (const c of CHAPTERS.slice(0, CHAPTERS.indexOf(chapter) + 1)) expect(guided.execute({ kind: 'tutorial.read', payload: { chapterId: c.id } }).ok, c.id).toBe(true);
    expect(guided.execute({ kind: 'life.look_after', payload: { action: 'eat' } }).ok).toBe(true);
  });

  it('PLAYER JOURNEY: a life at the School is enrolled there; a tool’s life with the School named somewhere else, or none, isn’t', () => {
    expect(begun('b20-c-school', ada()).player.school?.standing).toBe('good');
    expect(createSave(1, 'b20-c-school', { ...defaultConfig() }).player.school).toBeUndefined();
    expect(createSave(1, 'b20-c-school', { ...defaultConfig(), school: 'yale-drama' }).player.school).toBeUndefined();
    expect(createSave(1, 'b20-c-school', atSchool({ ...defaultConfig(), homeRegionId: 'us-ny-newyork' })).player.school?.standing).toBe('good');
  });

  it('PLAYER JOURNEY: a life saved and opened at its first moment plays the same as one played straight, to the byte, through the fall’s first ten weeks', () => {
    const config = withFamily(ada({ personalityTraits: ['light_sleeper', 'frugal'], genres: ['drama'], heightCm: 168, weightKg: 61 }), 'scraping');
    const straight = begun('b20-c-saved', config);
    const opened = reload(begun('b20-c-saved', config));
    for (const sim of [straight, opened]) sim.advanceTo(EDT(2026, 11, 2, 9));
    expect(serialise(opened.universe)).toBe(serialise(straight.universe));
  });

  it('PLAYER JOURNEY: the clock jumped a week from the first morning pays the term’s scholarship once, as the same week lived an hour at a time does', () => {
    const jumped = begun('b20-c-jump', withFamily(ada(), 'modest'));
    const stepped = begun('b20-c-jump', withFamily(ada(), 'modest'));
    jumped.advanceTo(EDT(2026, 8, 31, 9));
    while (stepped.now < EDT(2026, 8, 31, 9)) stepped.advanceTo(Math.min(EDT(2026, 8, 31, 9), stepped.now + MS_HOUR));
    const paid = (sim: Simulation) => sim.universe.transactions.filter((t) => t.postings.some((p) => p.amount === 13_318_50)).length;
    expect([paid(jumped), paid(stepped)]).toEqual([1, 1]);
    expect(balanceOf(jumped, 'checking')).toBe(balanceOf(stepped, 'checking'));
  });

  it('keeps the start date it was given, at 7:30 in the morning where the life begins, across a save and a load', () => {
    const tool = createSave(1, 'b20-c-date', { ...defaultConfig(), startYear: 2027, startMonth: 2, startDay: 15 });
    expect(tool.now).toBe(instantFromZoned({ year: 2027, month: 2, day: 15, hour: 7, minute: 30 }, CITIES.get(DEFAULT_CITY_ID)!.timeZone));
    expect(reload(tool).now).toBe(tool.now);
    const sim = begun('b20-c-date', ada());
    expect(reload(sim).now).toBe(EDT(2026, 8, 24, 7, 30));
  });
});
