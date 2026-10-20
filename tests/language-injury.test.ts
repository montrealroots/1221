/**
 * An injury's words, from 2026-10-17 (brief 14's health journey, `docs/verification/language-2026-10-17/journeys/`,
 * defect 6). Its notice said nothing of its care where the plan paid it whole, so a player couldn't tell whether there
 * was care or what it cost; and neither the notice nor the injury's look said Call In Sick excuses a day of classes for
 * an injury that limits the work, which `sickRefusal` lets it do and the flu's notice says.
 *
 * The notice comes from `mayHurt` itself, with the chance made certain; the kind and its days are the engine's own
 * draw, and a swim draws only a pulled muscle or a back strain, both of which limit the body. The look is resolved
 * over a state with the injury set on it (TEST SETUP), one kind at a time, since only the kind decides its words.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, formatDate } from '@/engine/core/time';
import { healthOf } from '@/engine/systems/health';
import { injuryKeeps, mayHurt } from '@/engine/systems/injury';
import { INJURY_KIND, type InjuryKind } from '@/engine/content/injury';
import { resolveLook } from '@/ui/looks/registry';
import { at } from '@/ui/looks/subject';
import '@/ui/looks/all';

// From 2026-10-20 (brief 17): until then “Call In Sick, on School, excuses a day of classes while it mends.”, which read
// as one day in all.
const CALL_IN_SICK = 'Each day until then, Call In Sick, on School’s Classes tab, can excuse that day at school.';
/** A new life at the School, as `tests/evidence-g07-life.test.ts` makes one: Yale Health pays a student's care whole. */
const student = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const lastNotice = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title).at(-1)?.body;

describe('an injury’s notice says what its care cost and how a day of classes is excused', () => {
  it('names the care a plan paid whole as costing nothing, and Call In Sick for a student, not for one who has left', () => {
    const sim = student('lang14-injury');
    expect(sim.player.school).toBeDefined();
    const hurt = mayHurt(sim, sim.player, 'swim', 1, sim.now)!;
    const spec = INJURY_KIND[hurt.kind];
    expect(['strain', 'back']).toContain(hurt.kind);
    const body = lastNotice(sim, spec.label)!;
    expect(healthOf(sim.player).bills ?? []).toHaveLength(0);
    expect(body.endsWith(`Its care, ${spec.care === 'urgent' ? 'a visit to urgent care' : 'a doctor’s visit'} and ${spec.therapy === 2 ? 'two' : 'four'} sessions of physical therapy, costs you nothing.`)).toBe(true);
    expect(body).toContain(CALL_IN_SICK);

    // The same draw on a life that has left the School: the care the same, and no Call In Sick to press.
    const left = student('lang14-injury');
    left.player.school!.standing = 'withdrawn'; // TEST SETUP
    const again = mayHurt(left, left.player, 'swim', 1, left.now)!;
    expect(again.kind).toBe(hurt.kind);
    const words = lastNotice(left, spec.label)!;
    expect(words).toContain('costs you nothing.');
    expect(words).not.toContain('Call In Sick');
  });

  it('says an injury that lays you up keeps you from classes, and no Call In Sick beside it', () => {
    const sim = student('lang14-laid-up');
    // An usher's fall draws a broken bone or a concussion often enough: the first minute whose draw lays them up.
    let hurt;
    for (let k = 0; k < 200 && !hurt; k += 1) {
      const drawn = mayHurt(sim, sim.player, 'usher', 1, sim.now + k * 60_000)!;
      if (INJURY_KIND[drawn.kind].offWork) hurt = drawn;
      else healthOf(sim.player).injury = undefined; // TEST SETUP: the next minute's draw
    }
    expect(hurt).toBeDefined();
    const body = lastNotice(sim, INJURY_KIND[hurt!.kind].label)!;
    expect(body).toContain('You’re laid up until then, kept from classes, work and training. What you miss at school is excused.');
    expect(body).not.toContain('Call In Sick');
  });
});

describe('an injury’s look says what it keeps you from, and Call In Sick where it excuses a day', () => {
  const summaryOf = (sim: Simulation, kind: InjuryKind, standing?: 'withdrawn') => {
    if (standing) sim.player.school!.standing = standing; // TEST SETUP
    healthOf(sim.player).injury = { kind, at: sim.now, until: sim.now + 5 * MS_DAY, ...(INJURY_KIND[kind].offWork ? { offWorkUntil: sim.now + 5 * MS_DAY } : {}) }; // TEST SETUP
    const found = resolveLook(sim, at('condition', 'injury'));
    if (!found || 'gone' in found) throw new Error('the injury didn’t resolve');
    return (found as { summary?: string }).summary!;
  };

  it('says it for a sprained ankle at school, and not for a knock, a broken bone that lays you up, or once you’ve left', () => {
    const sprain = summaryOf(student('lang14-look-1'), 'sprain');
    expect(sprain).toContain('Until then you can’t work out');
    expect(sprain.endsWith(CALL_IN_SICK)).toBe(true);
    expect(summaryOf(student('lang14-look-2'), 'bruise')).not.toContain('Call In Sick');
    const broken = summaryOf(student('lang14-look-3'), 'fracture');
    expect(broken).toContain('laid up until then, kept from classes, work and training');
    expect(broken).not.toContain('Call In Sick');
    expect(summaryOf(student('lang14-look-4'), 'sprain', 'withdrawn')).not.toContain('Call In Sick');
  });
});

/**
 * From 2026-10-20 (brief 17), what an injury keeps you from is said alike by its notice and its look (`injuryKeeps`), each
 * after the day it mends: an injury that lays you up says the classes it keeps you from are excused (`offSick`), and a
 * cut or a knock, which keeps you from nothing (`INJURY_KIND[].limits`), says so. Until then the notice gave its days and
 * no date, the laid-up words left the excused classes out, and a knock's look said only when it mends.
 */
describe('an injury says the day it mends, and what it keeps you from in each kind', () => {
  it('names the day in the notice, the look’s own day, for a swim’s strain', () => {
    const sim = student('lang17-day');
    const hurt = mayHurt(sim, sim.player, 'swim', 1, sim.now)!;
    const body = lastNotice(sim, INJURY_KIND[hurt.kind].label)!;
    const day = formatDate(hurt.until, sim.zone);
    expect(body.startsWith(`It takes ${Math.round((hurt.until - hurt.at) / MS_DAY)} days to mend, until ${day}. Until then you can’t work out, and it holds back the physical side of your work.`)).toBe(true);
    const found = resolveLook(sim, at('condition', 'injury')) as { summary: string };
    expect(found.summary.startsWith(`It mends by ${day}. Until then you can’t work out`)).toBe(true);
  });

  it('says a laid-up student’s classes are excused, and a knock keeps you from nothing, in the look as in the notice', () => {
    const look = (kind: InjuryKind, standing?: 'withdrawn') => {
      const sim = student(`lang17-look-${kind}-${standing ?? 'at'}`);
      if (standing) sim.player.school!.standing = standing; // TEST SETUP
      healthOf(sim.player).injury = { kind, at: sim.now, until: sim.now + 5 * MS_DAY, ...(INJURY_KIND[kind].offWork ? { offWorkUntil: sim.now + 5 * MS_DAY } : {}) }; // TEST SETUP
      return (resolveLook(sim, at('condition', 'injury')) as { summary: string }).summary;
    };
    expect(look('fracture').endsWith('You’re laid up until then, kept from classes, work and training. What you miss at school is excused.')).toBe(true);
    expect(look('fracture', 'withdrawn').endsWith('You’re laid up until then, kept from classes, work and training.')).toBe(true);
    expect(look('bruise').endsWith('It won’t stop you working out or going to class.')).toBe(true);
    expect(look('cut', 'withdrawn').endsWith('It won’t stop you working out.')).toBe(true);
    // The notice says the same of each.
    expect(injuryKeeps('fracture', true)).toBe('You’re laid up until then, kept from classes, work and training. What you miss at school is excused.');
    expect(injuryKeeps('bruise', true)).toBe('It won’t stop you working out or going to class.');
  });
});

