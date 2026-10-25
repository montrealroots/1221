/**
 * Brief 27, K4 (2026-10-24): the chemistry read and the screen test, Part 9's "Chemistry reads. Screen tests." and the
 * supplement's loop 15 ("Callback, Chemistry Read, Or Screen Test"). Held here: the slate adds a chemistry read to a
 * lead's casting in professional screen work and to a supporting part in a romance, and a screen test to a feature's lead,
 * by rule; a feature's lead is taken through every round by the clock, each judged as its own task (a chemistry read
 * reads listening to the actors already cast, a screen test the camera and the composure to hold it), each said, each
 * kept; a chemistry read slept through lapses the part, said; casting's draw for each cut is its own.
 *
 * PLAYER JOURNEYS: a graduate played by the clock and the commands a player sends (tests/fakes/career-world.ts); TEST
 * SETUP, said where it's done: the skilled actor's levels, the part's genres known, and the submission on the record as
 * the agent's would leave it, with casting's answer on the clock.
 */
import { describe, expect, it } from 'vitest';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import type { ProjectTemplate } from '@/engine/content/careerwork';
import { genreState } from '@/engine/systems/engagement';
import { attributesOf } from '@/engine/systems/attributes';
import { keepProject, productionsOf } from '@/engine/systems/slate';
import type { Opportunity } from '@/engine/systems/pro';
import { REPLY_KIND, ROUND_WORDS, chanceOf, fitOf, roundMinutes, roundToCome, roundsOf, travels, writtenFor } from '@/engine/systems/projobs';
import { graduate, notices, played, playRound, prepareAll, reload, skilled } from './fakes/career-world';

const WEEK = 7 * MS_DAY;

/** TEST SETUP: the part's own genres known, as `skilled` knows the fixed parts'. */
function knows(sim: ReturnType<typeof graduate>, t: ProjectTemplate): void {
  for (const g of t.genres) genreState(sim.player, g).familiarity = 95;
}

/**
 * A feature's lead near New Haven with a chemistry read and a screen test, each of whose cuts the game's own draw passes
 * for a Strong round at this actor's fit: read from the draw as casting reads it, never forced.
 */
function featureLead(sim: ReturnType<typeof graduate>): { t: ProjectTemplate; week: number } {
  for (let w = 1; w < 400; w += 1) {
    const week = sim.now + w * WEEK;
    for (const p of productionsOf(sim, week)) for (const t of p.parts) {
      if (!t.stages.test || !t.stages.chemistry || travels(sim.player, t) || !writtenFor(t, sim.player)) continue;
      keepProject(sim.player, t);
      knows(sim, t);
      const fit = fitOf(sim.player, t).fit;
      const cuts = [...roundsOf(t).slice(1), 'final'] as const;
      if (cuts.every((c) => sim.rng('pro.casting', t.id, week, c).next() < chanceOf('strong', fit, t.kind, c as never))) return { t, week };
    }
  }
  throw new Error('no feature lead whose draws pass');
}

/** TEST SETUP: the submission on the record as the agent's would leave it, and casting's answer on the clock an hour on. */
function submitted(sim: ReturnType<typeof graduate>, t: ProjectTemplate, week: number): Opportunity {
  const o: Opportunity = { id: `test-${t.id}`, projectId: t.id, via: 'open', status: 'submitted', postedAt: week, submitBy: week + WEEK, history: [], counts: {} };
  sim.player.pro!.opportunities.push(o);
  sim.schedule({ at: sim.now + MS_HOUR, kind: REPLY_KIND, label: `Casting Answers: ${t.role.part}`, category: 'career', priority: 40, refType: 'pro.opportunity', refId: o.id, payload: { personId: sim.player.id, opportunityId: o.id } });
  return o;
}

/** A round in person played: the sides prepared, then the clock to the round's end and casting's answer after it. */
function inPerson(sim: ReturnType<typeof graduate>, o: Opportunity): void {
  prepareAll(sim, { opportunityId: o.id });
  const r = roundToCome(o)!;
  played(sim, r.at + roundMinutes(r) * 60_000 + MS_HOUR);
}

describe('the chemistry read and the screen test', () => {
  it('are added by rule: a chemistry read to a lead in professional screen work and a supporting part in a romance, a screen test to a feature’s lead', () => {
    const sim = graduate('b27-rounds-rule');
    let chemistry = 0;
    let test = 0;
    for (let w = 1; w <= 52; w += 1) for (const p of productionsOf(sim, sim.now + w * WEEK)) for (const t of p.parts) {
      if (t.stages.chemistry) {
        chemistry += 1;
        expect(t.role.size === 'lead' || (t.role.size === 'supporting' && t.role.families.includes('romance')), t.id).toBe(true);
        expect(t.medium === 'stage' || ['student-film', 'non-union-short', 'ultra-low-budget', 'animated-series', 'animated-feature', 'dub', 'documentary'].includes(t.kind), t.id).toBe(false);
      }
      if (t.stages.test) {
        test += 1;
        expect([t.role.size, ['low-budget', 'action-feature', 'capture-feature', 'overseas-feature'].includes(t.kind)], t.id).toEqual(['lead', true]);
      }
    }
    expect(chemistry).toBeGreaterThan(0);
    expect(test).toBeGreaterThan(0);
  });

  it('PLAYER JOURNEY: a feature’s lead taken through every round to an offer, each judged as its own task, said and kept; weaker listening reads the chemistry read lower', () => {
    const sim = graduate('b27-rounds-journey');
    skilled(sim);
    const { t, week } = featureLead(sim);
    played(sim, week);
    const o = submitted(sim, t, week);
    played(sim, sim.now + 2 * MS_HOUR);
    // The audition, and a callback where the part has one, on tape or in person as the part has them.
    for (const r of roundsOf(t).filter((x) => x === 'audition' || x === 'callback')) {
      expect(roundToCome(o)!.round).toBe(r);
      if (roundToCome(o)!.form === 'self-tape') playRound(sim, o); else inPerson(sim, o);
    }
    // The chemistry read: in person, an hour, said in its notice.
    const chem = roundToCome(o)!;
    expect([chem.round, chem.form, o.status]).toEqual(['chemistry', 'in-person', 'callback']);
    expect(notices(sim).some((n) => n.startsWith(`A Chemistry Read For ${t.role.part} | `) && n.includes('read with the actors already cast'))).toBe(true);
    // The falsifiability test: a twin whose listening and adaptability are weak, the only thing set between them.
    const twin = reload(sim);
    const ta = attributesOf(twin, twin.player);
    ta.listening = 10;
    ta.adaptability = 10;
    inPerson(sim, o);
    const twinO = twin.player.pro!.opportunities.find((x) => x.id === o.id)!;
    inPerson(twin, twinO);
    expect(chem.status).toBe('done');
    const twinChem = twinO.rounds!.find((r) => r.round === 'chemistry')!;
    expect(twinChem.overall!).toBeLessThan(chem.overall!);
    // Judged as a chemistry read, its own task, and kept on the work record.
    expect(sim.player.work!.find((w) => w.what === `${t.role.part}, ${t.project}: Chemistry Read`)?.task).toBe('chemistry');
    // The screen test, after the cut: five hours in person, said; then casting's final word, an offer.
    played(sim, sim.now + 2 * MS_DAY);
    const test = roundToCome(o)!;
    expect([test.round, test.form]).toEqual(['test', 'in-person']);
    expect(notices(sim).some((n) => n.startsWith(`A Screen Test For ${t.role.part} | `) && n.includes('for five hours'))).toBe(true);
    inPerson(sim, o);
    played(sim, sim.now + 4 * MS_DAY);
    expect(o.rounds!.map((r) => [r.round, r.status])).toEqual(roundsOf(t).map((r) => [r, 'done']));
    expect(o.rounds!.every((r) => r.band && r.casting)).toBe(true);
    expect(o.status).toBe('offered');
    expect(sim.player.work!.find((w) => w.what === `${t.role.part}, ${t.project}: Screen Test`)?.task).toBe('screenTest');
    // Each kept in the history, in the past.
    expect(o.history.map((h) => h.key)).toEqual(expect.arrayContaining(['chemistry:set', 'chemistry:done', 'test:set', 'test:done']));
    expect(o.history.find((h) => h.key === 'chemistry:done')!.words).toMatch(new RegExp(`^Your ${ROUND_WORDS.chemistry.noun} for ${t.role.part} was \\w+\\.$`));
  }, 240_000);

  it('PLAYER JOURNEY: a chemistry read slept through lapses the part, and says so', () => {
    const sim = graduate('b27-rounds-missed');
    skilled(sim);
    const { t, week } = featureLead(sim);
    played(sim, week);
    const o = submitted(sim, t, week);
    played(sim, sim.now + 2 * MS_HOUR);
    for (const r of roundsOf(t).filter((x) => x === 'audition' || x === 'callback')) {
      expect(roundToCome(o)!.round).toBe(r);
      if (roundToCome(o)!.form === 'self-tape') playRound(sim, o); else inPerson(sim, o);
    }
    const chem = roundToCome(o)!;
    expect(chem.round).toBe('chemistry');
    // TEST SETUP: asleep from an hour before it, as a body that hasn't woken is.
    played(sim, chem.at - MS_HOUR);
    sim.player.awakeSince = chem.at + 3 * MS_HOUR;
    sim.advanceTo(chem.at + 2 * MS_HOUR);
    expect(chem.status).toBe('missed');
    expect(o.status).toBe('lapsed');
    expect(o.outcome).toMatch(new RegExp(`^You missed the chemistry read for ${t.role.part} on `));
    expect(notices(sim).some((n) => n.startsWith(`You Missed The Chemistry Read For ${t.role.part} | `))).toBe(true);
  }, 240_000);
});
