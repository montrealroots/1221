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
import { MS_DAY } from '@/engine/core/time';
import { healthOf } from '@/engine/systems/health';
import { mayHurt } from '@/engine/systems/injury';
import { INJURY_KIND, type InjuryKind } from '@/engine/content/injury';
import { resolveLook } from '@/ui/looks/registry';
import { at } from '@/ui/looks/subject';
import '@/ui/looks/all';

const CALL_IN_SICK = 'Call In Sick, on School, excuses a day of classes while it mends.';
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
    expect(body).toContain(`Its care, ${spec.care === 'urgent' ? 'a visit to urgent care' : 'a doctor’s visit'} and ${spec.therapy} sessions of physical therapy, costs you nothing.`);
    expect(body.endsWith(CALL_IN_SICK)).toBe(true);

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
    expect(body).toContain('you’re laid up until then, kept from classes, work and training.');
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
    expect(broken).toContain('laid up, kept from classes, work and training');
    expect(broken).not.toContain('Call In Sick');
    expect(summaryOf(student('lang14-look-4'), 'sprain', 'withdrawn')).not.toContain('Call In Sick');
  });
});
