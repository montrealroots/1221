/**
 * Brief 27 (2026-10-25), the languages: Part 7's "Languages and accents", Part 9's "Accent, language, movement, and vocal
 * preparation", and the supplement's loop 1 (creation's choices read by the systems after it). Held here: a part of the
 * slate written for a character who speaks a named language as well as English, decided on its own stream by the part's
 * id; what the actor speaks, chosen at creation, read by eligibility (Submit Yourself, an agent's reach, a direct offer),
 * by casting's fit, and by the preparation of the sides and the part; the résumé listing it; and the Opportunities tab
 * saying what the part asks.
 *
 * PLAYER JOURNEYS: graduates' lives from creation's config (`newLifeConfig`, the languages as Genres & Background sends
 * them), played by the clock and the commands a player sends (tests/fakes/career-world.ts). TEST SETUP, said where it's
 * done: a skilled actor's levels, the part's genres known, a conversational twin forked from the fluent life at the
 * posting with only the level changed, and a casting office's finished work put on the record for a direct offer.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, ageOn, dateKey } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { newLifeConfig, type NewSaveConfig } from '@/engine/world/bootstrap';
import { PROJECTS, type ProjectTemplate } from '@/engine/content/careerwork';
import { ENGLISH_ONLY, languagesOf, spokenName, type SpokenLanguage } from '@/engine/content/languages';
import { genreState } from '@/engine/systems/engagement';
import { currentOf, resumeNow, type Engagement, type Opportunity, type WorkUnit } from '@/engine/systems/pro';
import { unitContext } from '@/engine/systems/workflow';
import { TASK_PROFILES } from '@/engine/content/tasks';
import { BRIEF } from '@/engine/systems/briefs';
import { productionsOf, slatePartsAt } from '@/engine/systems/slate';
import {
  CASTING, auditionContext, chanceOf, directOfferFor, eligibilityProblems, fitOf, postingTimes, roundToCome, roundsOf, slateReach, travels, workContext, writtenFor,
} from '@/engine/systems/projobs';
import { LANGUAGE_PREP, PART_LANGUAGE, languageRefusal, languageWords } from '@/engine/systems/speaking';
import { evaluate } from '@/engine/systems/evaluation';
import { GUIDE_BY_ID } from '@/engine/content/guide';
import { CHAPTERS } from '@/engine/content/tutorial';
import { graduate, played, playRound, portfolio, prepareAll, reload, skilled } from './fakes/career-world';

// The Career screen drawn over the save, as tests/b27-voice-demo.test.ts draws it.
const h = vi.hoisted(() => ({ sim: undefined as unknown as import('@/engine/core/simulation').Simulation, tab: 'opportunities' }));
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(key: string, initial: T) => [(key === 'tab:/workspace/career' ? h.tab : initial) as T, () => undefined] as const };
});
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({ get sim() { return h.sim; }, version: 0, run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }), toast: noop } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});
const { WorkspaceRouter } = await import('@/ui/workspaces/WorkspaceRouter');
const { LanguagesCard, ReviewStep, validate } = await import('@/ui/creation/CharacterCreation');
function shown(sim: Simulation, tab: string): string {
  h.sim = sim; h.tab = tab;
  return renderToStaticMarkup(createElement(WorkspaceRouter, { route: '/workspace/career' })).replace(/<!-- -->/g, '').replace(/\stitle="[^"]*"/g, '').replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;/g, '\'').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
}

const NY = 'America/New_York';
const WEEK = 7 * MS_DAY;
/** The seed whose slate has a part in another language near New Haven within twenty weeks of graduating. */
const SEED = 'b27-lang-64';

/** TEST SETUP: the part's own genres known, as `skilled` knows the fixed parts'. */
function knows(sim: Simulation, t: ProjectTemplate): void {
  for (const g of t.genres) genreState(sim.player, g).familiarity = 95;
}

/**
 * The first slate part in another language this life is posted openly within twenty weeks, near enough to work daily,
 * written for them, in their playing ages, whose casting draws pass for a Strong round at the fit given: each read from the
 * game's own draws as the posting and casting read them, never forced.
 */
function languagePart(sim: Simulation, fit: (t: ProjectTemplate) => number): { t: ProjectTemplate; at: number } {
  const p = sim.player;
  for (const at of postingTimes(sim.now, sim.now + 20 * WEEK)) {
    for (const t of slatePartsAt(sim, at)) {
      if (!t.requirements.language || t.series || t.kind.startsWith('animated') || t.access.open !== 'anyone' || travels(p, t) || !writtenFor(t, p)) continue;
      const age = ageOn(p.birthInstant, at, NY);
      if (age + CASTING.playingSpread < t.requirements.ages[0] || age - CASTING.playingSpread > t.requirements.ages[1]) continue;
      if (!(sim.rng('pro.slate_reach', dateKey(at, NY), t.id, 'open').next() < slateReach(sim, p, t, 'open', at))) continue;
      const cuts = [...roundsOf(t).slice(1), 'final'] as const;
      if (cuts.every((c) => sim.rng('pro.casting', t.id, at, c).next() < chanceOf('strong', fit(t), t.kind, c as never))) return { t, at };
    }
  }
  throw new Error('no part in another language');
}

/** A graduate at work: skilled, with headshots, a résumé and a reel, speaking what creation was told. */
function actor(languages: SpokenLanguage[]): Simulation {
  const sim = graduate(SEED, { languages });
  skilled(sim);
  portfolio(sim);
  return sim;
}

const posting = (sim: Simulation, t: ProjectTemplate): Opportunity | undefined => sim.player.pro!.opportunities.find((o) => o.projectId === t.id);

describe('what the actor speaks, from creation', () => {
  it('keeps the languages creation took, through a save and a load, and reads a life with none as English, natively', () => {
    const sim = createSave(1, 'b27-lang-keep', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', citizenshipId: 'us', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', languages: [{ id: 'en', level: 'fluent' }, { id: 'es', level: 'native' }, { id: 'ko', level: 'conversational' }] });
    expect(sim.player.languages).toEqual([{ id: 'en', level: 'fluent' }, { id: 'es', level: 'native' }, { id: 'ko', level: 'conversational' }]);
    const back = loadSave(deserialise(serialise(sim.universe)) as never);
    expect(back.player.languages).toEqual(sim.player.languages);
    // A save made before languages were recorded: no field, read as English, natively.
    delete (back.player as { languages?: unknown }).languages;
    const older = loadSave(deserialise(serialise(back.universe)) as never);
    expect(older.player.languages).toBeUndefined();
    expect(languagesOf(older.player)).toEqual(ENGLISH_ONLY);
  });

  it('cleans a list made straight from the engine to one creation would take', () => {
    const sim = createSave(1, 'b27-lang-clean', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', citizenshipId: 'us', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', languages: [{ id: 'es', level: 'native' }, { id: 'xx', level: 'fluent' }, { id: 'es', level: 'conversational' }, { id: 'en', level: 'conversational' }] });
    expect(sim.player.languages).toEqual([{ id: 'en', level: 'fluent' }, { id: 'es', level: 'native' }]);
  });
});

describe('the slate’s parts in another language', () => {
  it('are decided by the part’s own draw: the same for the same seed, different for another, never a dub or a narration', () => {
    const make = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    const a = make('b27-lang-same');
    const b = make('b27-lang-same');
    const c = make('b27-lang-other');
    const languages = (sim: Simulation) => Array.from({ length: 26 }, (_, w) => productionsOf(sim, sim.now + w * WEEK).flatMap((p) => p.parts).map((t) => `${t.id.split('.').slice(2).join('.')}:${t.requirements.language ?? '-'}`)).flat();
    const all = languages(a);
    expect(languages(b)).toEqual(all);
    expect(languages(c)).not.toEqual(all);
    const parts = Array.from({ length: 26 }, (_, w) => productionsOf(a, a.now + w * WEEK).flatMap((p) => p.parts)).flat();
    const written = parts.filter((t) => t.requirements.language);
    // About the share the game sets, over half a year's parts; never a dub or a documentary's narration.
    expect(written.length / parts.length).toBeGreaterThan(PART_LANGUAGE.share / 2);
    expect(written.length / parts.length).toBeLessThan(PART_LANGUAGE.share * 2);
    expect(written.filter((t) => PART_LANGUAGE.without.includes(t.kind))).toEqual([]);
    expect(written.every((t) => spokenName(t.requirements.language!) !== undefined)).toBe(true);
  });
});

describe('a part in another language, played', () => {
  it('PLAYER JOURNEY: a fluent speaker is posted the part, auditions and is booked; a twin who speaks English alone is posted it and refused, with the reason; both kept through a load', () => {
    // Which part: found on the monolingual life, whose slate is the bilingual one's, the seed being the same.
    const mono = actor([{ id: 'en', level: 'native' }]);
    const found = languagePart(mono, (t) => { knows(mono, t); return fitOf({ ...mono.player, languages: [{ id: 'en', level: 'native' }, { id: t.requirements.language!, level: 'fluent' }] }, t).fit; });
    const { t, at } = found;
    const name = spokenName(t.requirements.language!)!;
    const fluent = actor([{ id: 'en', level: 'native' }, { id: t.requirements.language!, level: 'fluent' }]);
    knows(fluent, t);
    // The résumé lists the language, and the monolingual one's lists none; the Portfolio tab's profile says each.
    expect(currentOf(fluent.player.pro, 'resume')!.contains).toContain(`Language: ${name}, fluent`);
    expect(currentOf(mono.player.pro, 'resume')!.contains.some((l) => l.startsWith('Language:'))).toBe(false);
    expect(shown(fluent, 'portfolio')).toContain(`Languages English, native ${name}, fluent`);
    expect(shown(mono, 'portfolio')).toContain('Languages English, native Headshots');

    played(fluent, at + MS_HOUR);
    played(mono, at + MS_HOUR);
    const o = posting(fluent, t)!;
    const theirs = posting(mono, t)!;
    // Both posted it, openly, the same Monday.
    expect([o.via, o.postedAt, theirs.via, theirs.postedAt]).toEqual(['open', at, 'open', at]);
    // The monolingual twin is refused, and the card says why.
    const refusal = `The character speaks ${name} as well as English, and you don’t speak ${name}.`;
    expect(mono.execute({ kind: 'pro.submit', payload: { opportunityId: theirs.id } }).error).toBe(refusal);
    expect(eligibilityProblems(mono.player, theirs, mono.now)).toContain(refusal);
    expect(shown(mono, 'opportunities')).toContain(`The Language The character speaks ${name} as well as English. You don’t speak ${name}, so you can’t be put up for it.`);
    expect(theirs.status).toBe('open');

    // The fluent speaker submits, auditions and is offered the part, then accepts it.
    expect(shown(fluent, 'opportunities')).toContain(`The character speaks ${name} as well as English. Your ${name} is fluent, so it needs no preparation of its own.`);
    fluent.must({ kind: 'pro.submit', payload: { opportunityId: o.id } });
    played(fluent, fluent.now + 3 * MS_DAY);
    for (let n = 0; n < roundsOf(t).length && roundToCome(o); n += 1) {
      if (roundToCome(o)!.form === 'self-tape') playRound(fluent, o);
      else { prepareAll(fluent, { opportunityId: o.id }); played(fluent, roundToCome(o)!.at + 2 * MS_HOUR); }
    }
    for (let k = 0; k < 10 && o.status !== 'offered'; k += 1) played(fluent, fluent.now + MS_DAY);
    expect(o.rounds!.every((r) => r.band === 'strong' || r.band === 'exceptional')).toBe(true);
    expect(o.status).toBe('offered');
    fluent.must({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } });
    const e = fluent.player.pro!.engagements.find((x) => x.projectId === t.id)!;
    expect(e.status).toBe('booked');
    // A fluent speaker's part has no language part to prepare.
    expect(e.prep!.language).toBeUndefined();

    // Kept through a save and a load: the languages, and the part's language as it was posted.
    const back = reload(fluent);
    expect(back.player.languages).toEqual(fluent.player.languages);
    expect(back.player.pro!.projects![t.id]!.requirements.language).toBe(t.requirements.language);
    expect(back.player.pro!.engagements.find((x) => x.projectId === t.id)!.status).toBe('booked');
  }, 600_000);

  it('PLAYER JOURNEY: a conversational speaker can be submitted, but the part takes more preparation: Work On Your … is read by the tape, and casting reads the fit lower', () => {
    const fluent = actor([{ id: 'en', level: 'native' }, { id: 'cmn', level: 'fluent' }]);
    const { t, at } = languagePart(fluent, (x) => { knows(fluent, x); return fitOf({ ...fluent.player, languages: [{ id: 'en', level: 'native' }, { id: x.requirements.language!, level: 'fluent' }] }, x).fit; });
    const name = spokenName(t.requirements.language!)!;
    knows(fluent, t);
    played(fluent, at + MS_HOUR);
    // TEST SETUP: the twin, the same life at the posting with only the part's language spoken conversationally.
    const talk = reload(fluent);
    talk.player.languages = [{ id: 'en', level: 'native' }, { id: t.requirements.language!, level: 'conversational' }];
    const native = reload(fluent);
    native.player.languages = [{ id: 'en', level: 'native' }, { id: t.requirements.language!, level: 'native' }];
    fluent.player.languages = [{ id: 'en', level: 'native' }, { id: t.requirements.language!, level: 'fluent' }];
    // Casting's fit: native, then fluent, then conversational. The falsifiability test: only the level moves it.
    const fits = [native, fluent, talk].map((s) => fitOf(s.player, t).fit);
    expect(fits[0]!).toBeGreaterThan(fits[1]!);
    expect(fits[1]!).toBeGreaterThan(fits[2]!);
    // The character speaks both, so the weaker counts: native in the part's language and fluent in English reads as fluent.
    const englishFluent = reload(fluent);
    englishFluent.player.languages = [{ id: 'en', level: 'fluent' }, { id: t.requirements.language!, level: 'native' }];
    expect(fitOf(englishFluent.player, t).fit).toBe(fits[1]);
    // A part in English alone reads none of it.
    const english = productionsOf(fluent, at).flatMap((p) => p.parts).find((x) => !x.requirements.language)!;
    expect(new Set([native, fluent, talk].map((s) => fitOf(s.player, english).fit)).size).toBe(1);

    const o = posting(talk, t)!;
    expect(shown(talk, 'opportunities')).toContain(`Your ${name} is conversational, so the part takes more preparation: press Work On Your ${name} with the sides, and again with the part if you’re cast.`);
    expect(talk.execute({ kind: 'pro.submit', payload: { opportunityId: o.id } }).error).toBeUndefined();
    for (let k = 0; k < 20 && !roundToCome(o); k += 1) played(talk, talk.now + 6 * MS_HOUR);
    const r = roundToCome(o)!;
    expect(r.form).toBe('self-tape');
    prepareAll(talk, { opportunityId: o.id });
    // The step, on the tab beside the others, where it stands, and refused to a fluent speaker with the reason.
    expect(shown(talk, 'opportunities')).toContain(`Work On Your ${name} (60 Minutes)`);
    expect(shown(talk, 'opportunities')).toContain(`your ${name} 45%`);
    const fl = reload(talk);
    fl.player.languages = [{ id: 'en', level: 'native' }, { id: t.requirements.language!, level: 'fluent' }];
    expect(fl.execute({ kind: 'pro.prepare', payload: { opportunityId: o.id, step: 'language' } }).error).toBe(`Your ${name} is fluent, so the part’s ${name} needs no work of its own.`);
    expect(shown(fl, 'opportunities')).not.toContain(`Work On Your ${name}`);

    // The falsifiability test: a twin who tapes without working on the language, and one who works on it until complete.
    const cold = reload(talk);
    for (let n = 0; n < 8 && (o.prep?.language ?? LANGUAGE_PREP.start) < LANGUAGE_PREP.complete; n += 1) {
      talk.must({ kind: 'pro.prepare', payload: { opportunityId: o.id, step: 'language' } });
      played(talk, talk.now + 12 * MS_HOUR);
    }
    expect(o.prep!.language!).toBeGreaterThanOrEqual(LANGUAGE_PREP.complete);
    expect(talk.now).toBeLessThan(r.at - 3 * MS_HOUR);
    const coldO = posting(cold, t)!;
    expect(coldO.prep?.language).toBeUndefined();
    // Both taped as the evening it's due comes round, so the day's condition is alike.
    const due = r.at - 3 * MS_HOUR;
    played(talk, due);
    played(cold, due);
    talk.must({ kind: 'pro.tape_audition', payload: { opportunityId: o.id } });
    cold.must({ kind: 'pro.tape_audition', payload: { opportunityId: coldO.id } });
    const warm = o.rounds!.find((x) => x.round === 'audition')!;
    const unworked = coldO.rounds!.find((x) => x.round === 'audition')!;
    expect(warm.overall!).toBeGreaterThan(unworked.overall!);
    expect(unworked.held).toMatch(/^Working on the part’s language wasn’t complete/);
    // The language's preparation is read by the tape and nothing else set between the two.
    expect(auditionContext(cold, cold.player, coldO, unworked, 0).prep.language).toBe(LANGUAGE_PREP.start);
    expect(auditionContext(talk, talk.player, o, warm, 0).prep.language).toBe(o.prep!.language);
    // Casting reads the tape's band, so the unworked language cost the twin some of its chance.
    for (let k = 0; k < 10 && o.status === 'audition'; k += 1) played(talk, talk.now + MS_DAY);
    for (let k = 0; k < 10 && coldO.status === 'audition'; k += 1) played(cold, cold.now + MS_DAY);
    expect(warm.casting!.chance).toBeGreaterThan(unworked.casting!.chance);

    // Booked, the part starts from half the language work done on the sides, as the rest of its preparation does, and
    // Work On Your … goes on with the part, two hours a session.
    expect([o.status, coldO.status]).toEqual(['offered', 'offered']);
    talk.must({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } });
    cold.must({ kind: 'pro.accept_offer', payload: { opportunityId: coldO.id } });
    const e = talk.player.pro!.engagements.find((x) => x.projectId === t.id)!;
    const coldE = cold.player.pro!.engagements.find((x) => x.projectId === t.id)!;
    expect(e.prep!.language).toBeCloseTo(LANGUAGE_PREP.start + (o.prep!.language! - LANGUAGE_PREP.start) / 2, 2);
    expect(coldE.prep!.language).toBe(LANGUAGE_PREP.start);
    expect(shown(talk, 'opportunities')).toContain(`Work On Your ${name} (120 Minutes)`);

    // Why It Went This Way, under the settled role, gives the techniques alone and says the language apart, naming the
    // weaker of the actor's two. The falsifiability test: only the levels change, and only the language's sentence moves.
    // Until the review of 2026-10-25's first cut the techniques' figure had the language folded in: 93% for a fluent
    // speaker whose techniques were all mastered, and less for a conversational one.
    const twin = (languages: SpokenLanguage[]) => { const s = reload(talk); s.player.languages = languages; return shown(s, 'opportunities'); };
    const lang = t.requirements.language!;
    const techniques = 'your techniques are 100% of the way to what the part asks at mastery.';
    const head = `${techniques} Its character speaks ${name} as well as English`;
    expect(shown(talk, 'opportunities')).toContain(`${head}. Your ${name} is conversational, which suits it about half as well as a native speaker of both would.`);
    expect(twin([{ id: 'en', level: 'native' }, { id: lang, level: 'fluent' }])).toContain(`${head}. Your ${name} is fluent, which suits it nearly as well as a native speaker of both would.`);
    expect(twin([{ id: 'en', level: 'fluent' }, { id: lang, level: 'native' }])).toContain(`${head}. Your English is fluent, which suits it nearly as well as a native speaker of both would.`);
    expect(twin([{ id: 'en', level: 'fluent' }, { id: lang, level: 'fluent' }])).toContain(`${head}. Your ${name} and your English are both fluent, which suits it nearly as well as a native speaker of both would.`);
    expect(twin([{ id: 'en', level: 'native' }, { id: lang, level: 'native' }])).toContain(`${head}, and you speak both natively, which suits it best.`);
    expect(twin([{ id: 'en', level: 'native' }])).toContain(`${head}, and you don’t speak ${name}, which lowers your fit.`);
    // A role settled for a part in English alone (TEST SETUP: the settled role pointed at one of the fixed parts, which
    // carry no language): the line ends with the techniques.
    const plain = reload(talk);
    plain.player.pro!.opportunities.find((x) => x.id === o.id)!.projectId = PROJECTS.find((x) => !x.requirements.language)!.id;
    const alone = shown(plain, 'opportunities');
    expect(alone).toContain(techniques);
    expect(alone).not.toContain('Its character speaks');
    expect(alone).not.toContain('undefined');

    const before = e.prep!.language!;
    const worked = talk.execute({ kind: 'pro.prepare', payload: { engagementId: e.id, step: 'language' } });
    expect(worked.error).toBeUndefined();
    expect((worked.value as { minutes: number }).minutes).toBe(LANGUAGE_PREP.minutes * 2);
    expect(e.prep!.language!).toBeGreaterThan(before);
    // It goes so far and no further, as every step does: a session a day until it's done all it can.
    let last: string | undefined;
    for (let n = 0; n < 14 && !last; n += 1) {
      played(talk, talk.now + 22 * MS_HOUR);
      last = talk.execute({ kind: 'pro.prepare', payload: { engagementId: e.id, step: 'language' } }).error;
    }
    expect(last).toBe('You’ve done all this step can do.');
    expect(e.prep!.language!).toBeGreaterThanOrEqual(0.97);
  }, 600_000);
});

describe('who can be put up for it', () => {
  it('an agent doesn’t put up a client who doesn’t speak the language, and a casting office doesn’t offer it to them without an audition', () => {
    const sim = graduate('b27-lang-agent', { languages: [{ id: 'en', level: 'native' }] });
    // A part in another language near New Haven for an actress, open to agents.
    let found: { t: ProjectTemplate; at: number } | undefined;
    for (const at of postingTimes(sim.now, sim.now + 40 * WEEK)) {
      const t = slatePartsAt(sim, at).find((x) => x.requirements.language && x.access.agent && !x.series && writtenFor(x, sim.player) && x.role.size !== 'lead' && ageOn(sim.player.birthInstant, at, NY) + CASTING.playingSpread >= x.requirements.ages[0] && ageOn(sim.player.birthInstant, at, NY) - CASTING.playingSpread <= x.requirements.ages[1]);
      if (t) { found = { t, at }; break; }
    }
    const { t, at } = found!;
    const speaks = reload(sim);
    speaks.player.languages = [{ id: 'en', level: 'native' }, { id: t.requirements.language!, level: 'conversational' }];
    expect(slateReach(sim, sim.player, t, 'agent', at)).toBe(0);
    expect(slateReach(speaks, speaks.player, t, 'agent', at)).toBeGreaterThan(0);
    expect(languageRefusal(sim.player, t)).toBeDefined();
    expect(languageRefusal(speaks.player, t)).toBeUndefined();

    // TEST SETUP: the same casting office's finished work on the record, judged Strong, on a day its draw offers directly.
    for (const s of [sim, speaks]) {
      const e = { id: 'pro_test_done', projectId: t.id, opportunityId: 'x', role: 'A Part', status: 'finished', finishedAt: at - 30 * MS_DAY, days: [], pay: [], history: [], counts: {} } as unknown as Engagement;
      s.player.pro!.engagements.push(e);
      s.player.pro!.credits.push({ id: 'credit_test', kind: 'screen', project: t.project, role: 'A Part', company: t.company, year: 2026, medium: 'film', status: 'released', at: at - 30 * MS_DAY, engagementId: e.id, band: 'strong' } as never);
    }
    const other = { ...t, id: `${t.id}.other`, role: { ...t.role, size: 'supporting' as const } };
    const day = Array.from({ length: 60 }, (_, i) => at + i * WEEK).find((d) => speaks.rng('pro.direct', dateKey(d, NY), other.id).next() < 0.5)!;
    expect(directOfferFor(speaks, speaks.player, other, day)).toBeDefined();
    expect(directOfferFor(sim, sim.player, other, day)).toBeUndefined();
  }, 300_000);
});

describe('the work reads the language', () => {
  it('a booked part’s night on stage and a day’s take read a conversational speaker’s language preparation, and nobody else’s', () => {
    const sim = graduate('b27-lang-work', { languages: [{ id: 'en', level: 'native' }, { id: 'es', level: 'conversational' }] });
    skilled(sim);
    // A stage part and a screen part in Spanish, as the slate makes them.
    const parts = Array.from({ length: 200 }, (_, w) => productionsOf(sim, sim.now + w * WEEK).flatMap((p) => p.parts)).flat().filter((x) => x.requirements.language === 'es');
    const stage = parts.find((x) => x.medium === 'stage' && x.schedule.kind === 'run')!;
    expect(stage).toBeDefined();
    const night = stage.schedule.kind === 'run' ? stage.schedule.rehearsalWeeks * 5 : 0;
    const booked = (language?: number) => ({ id: 'pro_test', prep: { interpretation: 0.9, memorization: 0.9, rehearsal: 0.9, ...(language !== undefined ? { language } : {}) } }) as unknown as Engagement;
    const judged = (e: Engagement) => evaluate(sim, sim.player, { ...workContext(sim, sim.player, e, stage, night), expected: true }).overall;
    // Short of complete it holds the night back; complete, it doesn't.
    expect(judged(booked())).toBeLessThan(judged(booked(LANGUAGE_PREP.complete)));
    expect(workContext(sim, sim.player, booked(), stage, night).prep.language).toBe(LANGUAGE_PREP.start);
    // A fluent speaker, and a part in English alone, read none of it.
    const fluent = reload(sim);
    fluent.player.languages = [{ id: 'en', level: 'native' }, { id: 'es', level: 'fluent' }];
    expect(workContext(fluent, fluent.player, booked(), stage, night).prep.language).toBeUndefined();
    const english = { ...stage, requirements: { ...stage.requirements, language: undefined } };
    expect(workContext(sim, sim.player, booked(), english, night).prep.language).toBeUndefined();
    // A screen part's take on a shoot day, the way its workflow judges it (`unitContext`), reads it the same way.
    const screen = parts.find((x) => x.medium !== 'stage' && x.schedule.kind === 'shoot')!;
    const unit = { id: 'u1', day: 0, scene: 1, order: 0 } as WorkUnit;
    const take = (s: Simulation, e: Engagement) => unitContext(s, s.player, e, screen, unit, 1, TASK_PROFILES.camera!, {}, BRIEF.complete.genre);
    const takeWhole = (e: Engagement) => evaluate(sim, sim.player, { ...take(sim, e), expected: true }).overall;
    expect(takeWhole(booked())).toBeLessThan(takeWhole(booked(LANGUAGE_PREP.complete)));
    expect(take(fluent, booked()).prep.language).toBeUndefined();
    // And `workContext`'s own day on camera, for a part whose day isn't a night (a shoot day asked of it directly).
    const shot = (e: Engagement) => evaluate(sim, sim.player, { ...workContext(sim, sim.player, e, screen, 0), expected: true }).overall;
    expect(shot(booked())).toBeLessThan(shot(booked(LANGUAGE_PREP.complete)));
    // The words on the card name the language and the actor's level.
    expect(languageWords(sim.player, stage)).toBe('The character speaks Spanish as well as English. Your Spanish is conversational, so the part takes more preparation: press Work On Your Spanish with the sides, and again with the part if you’re cast. A native speaker of both would be a closer fit.');
  });

  it('the résumé lists every language but native English, and a life with none on record lists none', () => {
    const sim = createSave(1, 'b27-lang-resume', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', citizenshipId: 'us', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', languages: [{ id: 'en', level: 'native' }, { id: 'fr', level: 'conversational' }, { id: 'ar', level: 'native' }] });
    const lines = resumeNow(sim.player, sim.now).lines.filter((l) => l.startsWith('Language:'));
    expect(lines).toEqual(['Language: French, conversational', 'Language: Arabic, native']);
    const second = createSave(1, 'b27-lang-resume-2', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', citizenshipId: 'us', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', languages: [{ id: 'en', level: 'fluent' }, { id: 'ja', level: 'native' }] });
    expect(resumeNow(second.player, second.now).lines.filter((l) => l.startsWith('Language:'))).toEqual(['Language: English, fluent', 'Language: Japanese, native']);
    delete (sim.player as { languages?: unknown }).languages;
    expect(resumeNow(sim.player, sim.now).lines.some((l) => l.startsWith('Language:'))).toBe(false);
  });
});

describe('the guide, where it explains fit and eligibility', () => {
  it('names the character’s other language beside the genres, the techniques, the ages and the union, and says the fit in words, not figures', () => {
    // Until the review of 2026-10-25's first cut, Auditions gave the fit as genres and techniques alone, Finding Work's
    // eligibility and refusals left the language out, the tutorial's résumé had no languages, and Languages showed the
    // fit's figures ("a fluent one 80% as well").
    const languages = GUIDE_BY_ID['career.languages']!;
    const fit = languages.reads.find((r) => r.label === 'Casting’s Fit')!.value;
    expect(fit).toContain('A native speaker of both suits it best, a fluent one nearly as well and a conversational one about half as well');
    expect(fit).not.toMatch(/\d/);
    expect(GUIDE_BY_ID['career.auditions']!.reads.find((r) => r.label === 'The Role’s Fit')!.value).toContain('how well you speak that and English');
    const finding = GUIDE_BY_ID['career.opportunities']!;
    expect(finding.reads.find((r) => r.label === 'Eligibility')!.value).toContain('a language its character speaks besides English');
    expect(finding.unavailable).toContain('The character speaks another language as well as English, and you don’t speak it.');
    expect(CHAPTERS.find((c) => c.id === 'career')!.body.join(' ')).toContain('special skills and the languages you speak besides native English');
  });
});

describe('creation’s Languages, as the player has it', () => {
  type El = { type: unknown; props: Record<string, unknown> };
  /** Every element a component's tree holds, its own children walked. */
  const walk = (node: unknown, out: El[] = []): El[] => {
    if (Array.isArray(node)) { for (const n of node) walk(n, out); return out; }
    if (node && typeof node === 'object' && 'props' in node) { out.push(node as El); walk((node as El).props.children, out); }
    return out;
  };
  /** The card drawn over a config, its controls pressed through their own handlers, and the config each press leaves. */
  const card = (config: NewSaveConfig) => {
    let next = config;
    const setConfig = (u: unknown) => { next = typeof u === 'function' ? (u as (c: NewSaveConfig) => NewSaveConfig)(next) : u as NewSaveConfig; };
    const els = walk(LanguagesCard({ config, setConfig: setConfig as never }));
    const text = renderToStaticMarkup(createElement(LanguagesCard, { config, setConfig: setConfig as never })).replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, '\'').replace(/\s+/g, ' ');
    const pick = (id: string, value: string) => { (els.find((e) => e.type === 'select' && e.props.id === id)!.props.onChange as (e: unknown) => void)({ target: { value } }); return next; };
    const press = (label: string) => { (els.find((e) => e.type === 'button' && e.props.children === label)!.props.onClick as () => void)(); return next; };
    return { text, pick, press };
  };
  const start: NewSaveConfig = { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', citizenshipId: 'us', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' };

  it('lists English to begin with, adds a language from the list at fluent, sets its level, and removes it; English can’t go under fluent or be removed', () => {
    const first = card(start);
    expect(first.text).toContain('Languages');
    expect(first.text).toContain('If you speak it conversationally, the part takes more preparation.');
    expect(first.text).toContain('English Native Fluent Add A Language Choose A Language');
    expect(first.text).not.toContain('Remove English');
    const added = first.pick('language-add', 'ko');
    expect(added.languages).toEqual([{ id: 'en', level: 'native' }, { id: 'ko', level: 'fluent' }]);
    const second = card(added);
    expect(second.text).toContain('Korean Native Fluent Conversational Remove Korean');
    const levelled = second.pick('language-1', 'conversational');
    expect(levelled.languages).toEqual([{ id: 'en', level: 'native' }, { id: 'ko', level: 'conversational' }]);
    expect(card(levelled).press('Remove Korean').languages).toEqual([{ id: 'en', level: 'native' }]);
    // Each choice reaches the life it begins.
    const sim = createSave(1, 'b27-lang-card', levelled);
    expect(sim.player.languages).toEqual([{ id: 'en', level: 'native' }, { id: 'ko', level: 'conversational' }]);
    expect(validate(levelled, 2)).toEqual([]);
  });

  it('stops offering Add A Language at six, and Review says each with how well', () => {
    const six: NewSaveConfig = { ...start, languages: [{ id: 'en', level: 'native' }, ...['es', 'fr', 'de', 'it', 'pt'].map((id) => ({ id, level: 'fluent' as const }))] };
    expect(card(six).text).not.toContain('Add A Language');
    const review = renderToStaticMarkup(createElement(ReviewStep, { config: { ...start, languages: [{ id: 'en', level: 'fluent' }, { id: 'ko', level: 'native' }] }, setConfig: () => undefined })).replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    expect(review).toContain('Languages English (Fluent), Korean (Native)');
  });
});
