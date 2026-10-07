/**
 * School work carried into the profession (from 2026-10-07): the Actor
 * Showcase's scene, chosen and rehearsed in class, read at the showcase
 * beside the craft and the thesis (`showcaseSceneSeen`), with no offer
 * promised; and a partner kept faith with or stood up in coursework, carried
 * into the bond the class is known by after the degree (`knowTheClass`).
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { breaches } from '@/engine/core/invariants';
import type { Simulation } from '@/engine/core/simulation';
import { templateFor } from '@/engine/content/coursework';
import { BONDS, bondMove, evenCraft } from '@/engine/systems/school';
import { PARTNER_KIND, WORK, courseworkOf, openFor, setWork, type Assignment, type Band } from '@/engine/systems/coursework';
import { SHOWCASE_KIND, SHOWCASE_SCENE_POINTS, careerOf, showcaseSceneSeen } from '@/engine/systems/career';
import { contactsOf, knowTheClass } from '@/engine/systems/people';

const zone = 'America/New_York';
const at = (month: number, day: number, hour = 9, year = 2026) => instantFromZoned({ year, month, day, hour }, zone);
const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const tended = (sim: Simulation, until: number) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);

/** The showcase scene set as the course sets it, in the final spring. */
const showcaseScene = (sim: Simulation): Assignment => {
  setWork(sim, sim.player, 'DRAM 793b', { year: 2029, month: 2, day: 6 });
  return courseworkOf(sim, sim.player)!.assignments.find((a) => a.template === 'showcase-scene')!;
};
/** A showing of it, as the class saw it. */
const shownAs = (a: Assignment, band: Band, at: number) => { a.status = 'done'; a.shown = { band, score: 0, at, parts: { prep: 0, craft: 0, ready: 0 }, strengths: [] }; };
/** The showcase in New York, an hour from now, the actor there and awake. */
const showcaseNow = (sim: Simulation) => {
  sim.player.currentLocationId = 'us-ny-newyork';
  sim.schedule({ at: sim.now + MS_HOUR, kind: SHOWCASE_KIND, label: 'Actor Showcase, New York', category: 'school', priority: 30, requiresPlayer: true, durationMinutes: 150, locationId: 'us-ny-newyork', payload: { personId: sim.player.id, cityId: 'us-ny-newyork' } });
  tended(sim, sim.now + 2 * MS_HOUR);
  return careerOf(sim.player).showcases.at(-1)!.score;
};

describe('the showcase scene', () => {
  it('is the Actor Showcase’s work: a scene with a partner, chosen in the final spring', () => {
    expect(templateFor('DRAM 793b', 'spring')?.id).toBe('showcase-scene');
    const sim = life('co-set');
    const a = showcaseScene(sim);
    expect(a).toMatchObject({ course: 'DRAM 793b', status: 'open' });
    expect(a.sceneId).toBeDefined();
    expect(a.partner).toBeDefined();
    // Nothing shown yet, nothing read.
    expect(showcaseSceneSeen(sim.player)).toBeUndefined();
  });

  it('reads at the showcase as it last went in class: ordinary work as before, unready less, strong more; the same save twice', () => {
    const sim = life('co-read');
    tended(sim, at(8, 29, 20));
    const a = showcaseScene(sim);
    const base = reload(sim);
    const working = reload(sim);
    const strong = reload(sim);
    const unready = reload(sim);
    const missed = reload(sim);
    const of = (x: Simulation) => courseworkOf(x, x.player)!.assignments.find((y) => y.id === a.id)!;
    shownAs(of(working), 'working', working.now);
    shownAs(of(strong), 'strong', strong.now);
    shownAs(of(unready), 'unready', unready.now);
    of(missed).status = 'missed';
    // The revision's band, where there was one, is what it last was.
    of(strong).revision = { dueOn: '2029-02-20', before: 0, band: 'exceptional' };
    const scores = [base, working, strong, unready, missed].map(showcaseNow);
    expect(scores[1]).toBeCloseTo(scores[0]!, 10);
    expect(scores[2]! - scores[0]!).toBeCloseTo(SHOWCASE_SCENE_POINTS.exceptional, 10);
    expect(scores[3]! - scores[0]!).toBeCloseTo(SHOWCASE_SCENE_POINTS.unready, 10);
    expect(scores[4]! - scores[0]!).toBeCloseTo(SHOWCASE_SCENE_POINTS.unready, 10);
    expect(breaches(strong.universe)).toEqual([]);
  });

  it('promises nothing: an exceptional scene from an actor whose craft no agency’s bar reaches brings no offer', () => {
    const sim = life('co-nothing');
    tended(sim, at(8, 29, 20));
    sim.player.craft = evenCraft(15);
    shownAs(showcaseScene(sim), 'exceptional', sim.now);
    showcaseNow(sim);
    expect(careerOf(sim.player).offers).toEqual([]);
    expect(careerOf(sim.player).agencyId).toBeUndefined();
    // Seen, and turned down: not missed.
    expect(sim.universe.notifications.filter((n) => n.title === 'No Offers From New York')).toHaveLength(1);
  });
});

describe('partners, after school', () => {
  it('a rehearsal kept warms the classmate’s bond, one missed cools it, and the class is known by it after the degree', () => {
    const sim = life('co-bond');
    tended(sim, at(8, 28, 13));
    const a = openFor(sim, sim.player, 'DRAM 103a/b')!;
    const mate = sim.player.school!.classmates[a.partner!]!;
    const b0 = mate.bond ?? 0;
    sim.must({ kind: 'school.ask_partner', payload: { assignmentId: a.id, at: at(8, 29, 19) } });
    tended(sim, at(8, 29, 21));
    const r = openFor(sim, sim.player, a.course)!.rehearsals[0]!;
    // Kept, warmer; not come by them, nothing of yours to warm or cool.
    expect(mate.bond ?? 0).toBeCloseTo(b0 + (r.status === 'kept' ? bondMove(sim.player, WORK.bond.kept) : 0), 10);
    const b1 = mate.bond ?? 0;
    // Away for the next.
    sim.must({ kind: 'school.ask_partner', payload: { assignmentId: a.id, at: at(8, 30, 15) } });
    sim.player.currentLocationId = 'us-ny-newyork';
    tended(sim, at(8, 30, 17));
    expect(openFor(sim, sim.player, a.course)!.rehearsals[1]!.status).toBe('missedByYou');
    expect(mate.bond).toBeCloseTo(b1 + bondMove(sim.player, WORK.bond.missed), 10);
    expect(sim.universe.scheduled.filter((i) => i.kind === PARTNER_KIND && i.status === 'pending')).toEqual([]);
    // Stood up enough over three years to be a rival: known as one after.
    mate.bond = BONDS.rival + 1;
    sim.must({ kind: 'school.ask_partner', payload: { assignmentId: a.id, at: at(8, 30, 19) } });
    tended(sim, at(8, 30, 21));
    expect(mate.bond).toBeLessThanOrEqual(BONDS.rival);
    knowTheClass(sim, sim.player, sim.player.school!.classmates);
    expect(contactsOf(sim.player).find((c) => c.name === mate.name)!.rival).toBe(true);
    expect(breaches(sim.universe)).toEqual([]);
  });
});
