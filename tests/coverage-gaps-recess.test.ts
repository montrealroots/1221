/**
 * The summer recess (`school.recess`): the calendar's dates decide it (`recessStart`, `classPeriod`, `termStart`), and
 * the notice reminds. Played from creation through the first spring with the student doing nothing of their own:
 * nothing of the school's wants them between the recess and the fall term, no class meets in it, and the notice comes
 * on the recess's day. No second recess flag exists to make the notice look mechanical.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { RECESS_KIND, classPeriod, coursesOn, recessStart, summerOf, termStart } from '@/engine/systems/school';

const NH = 'America/New_York';

describe('the summer recess', () => {
  it('is a stretch the school asks nothing of the student, by the calendar’s dates, and the notice says so on its day', () => {
    const sim = createSave(1, 'gap-recess', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    const from = instantFromZoned({ ...recessStart(1), hour: 0 }, NH);
    const until = instantFromZoned({ ...termStart(2).date, hour: 0 }, NH);
    while (sim.now < from + 2 * MS_DAY) sim.advanceTo(Math.min(from + 2 * MS_DAY, sim.now + 12 * MS_HOUR));
    const recess = sim.universe.scheduled.find((i) => i.kind === RECESS_KIND)!;
    expect(recess.at).toBe(instantFromZoned({ ...recessStart(1), hour: 9 }, NH));
    expect(recess.status).toBe('done');
    expect(sim.universe.notifications.some((n) => n.title === 'The Summer Is Yours' && n.at >= recess.at)).toBe(true);
    expect(summerOf(sim.player, sim.now)).toEqual({ from, until });
    // The school's own calls on the student in the summer: none (the Summer Cabaret is the student's to join).
    const asked = sim.universe.scheduled.filter((i) => i.kind.startsWith('school.') && i.kind !== 'school.summer' && i.kind !== 'school.stipend' && i.requiresPlayer && i.at >= from && i.at < until);
    expect(asked).toEqual([]);
    // No class meets between the spring's last class day and the fall term.
    const last = classPeriod(1).to;
    for (let t = instantFromZoned({ ...last, hour: 12 }, NH) + MS_DAY; t < until; t += MS_DAY) {
      const d = new Date(t);
      expect(coursesOn({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() })).toEqual([]);
    }
  }, 180_000);
});
