/**
 * A classmate who asks again says so (from 2026-10-20, the owner's brief 16, "Repetition says what changed"): a request
 * for help, the how-many and how the last was answered; an invitation to run lines, how the last went. Read from the
 * classmate's own record (`moments`), so it's the same after a reload. Until then every request read as the first: seven
 * a year from one classmate, word for word, in brief 16's baseline (docs/verification/voices-2026-10-20/before/).
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { momentsOf, type Moment } from '@/engine/systems/classmates';
import { courseworkOf } from '@/engine/systems/coursework';

const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const ORDINAL = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth'];

describe('a classmate who asks again', () => {
  it('PLAYER JOURNEY: to the second fall, every request for help answered yes and every invitation no, each one after the first from the same classmate says how many and how the last went, the same across a reload (TEST SETUP: kept rested while the clock runs)', () => {
    let sim = life('repeat-moments');
    const answered: Moment[] = [];
    // To the second fall: a kind comes to the classmate who had it longest ago, so each of the class asks once before
    // anyone asks twice.
    const end = instantFromZoned({ year: 2027, month: 12, day: 10, hour: 0 }, sim.zone);
    let reloaded = false;
    while (sim.now < end) {
      Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 });
      sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
      sim.advanceTo(sim.now + 2 * MS_HOUR);
      for (const m of momentsOf(courseworkOf(sim, sim.player)!).filter((x) => x.status === 'open' && (x.kind === 'help' || x.kind === 'study'))) {
        const choice = m.kind === 'help' ? 'help' : 'no';
        if (sim.execute({ kind: 'school.respond', payload: { momentId: m.id, choice } }).ok) answered.push({ ...m });
      }
      if (!reloaded && answered.length >= 3) { sim = loadSave(deserialise(serialise(sim.universe))); reloaded = true; }
    }
    const checked = { help: 0, study: 0 };
    for (const kind of ['help', 'study'] as const) {
      const byMate = new Map<number, Moment[]>();
      for (const m of answered.filter((x) => x.kind === kind)) byMate.set(m.mate, [...(byMate.get(m.mate) ?? []), m]);
      for (const ms of byMate.values()) ms.forEach((m, i) => {
        if (kind === 'help') {
          if (!i) { expect(m.text).not.toMatch(/time they’ve asked/); return; }
          expect(m.text.endsWith(` It’s the ${ORDINAL[i + 1]} time they’ve asked, and you helped them last time.`), m.text).toBe(true);
        } else {
          if (!i) { expect(m.text).not.toMatch(/Last time, you couldn’t\.|They’ve asked before\./); return; }
          // A classmate you ran lines for asks in return, and that's said in its place.
          // In their voice from 2026-10-20 (brief 17): each way a classmate returning the favour says it.
          expect(m.text.endsWith(' Last time, you couldn’t.') || / (?:You ran theirs|They haven’t forgotten you ran theirs)|: you ran theirs/.test(m.text) && m.text.endsWith(' when they were behind.'), m.text).toBe(true);
        }
        checked[kind] += 1;
      });
    }
    expect(reloaded).toBe(true);
    expect(checked.help, 'a classmate asked for help twice').toBeGreaterThan(0);
    expect(checked.study, 'a classmate asked to run lines twice').toBeGreaterThan(0);
  }, 240_000);
});
