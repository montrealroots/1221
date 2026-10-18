/**
 * Course-record defects found by the readings of 2026-10-12, each fixed and held here (`systems/courserecord.ts`):
 * - the module's header said a lab didn't count toward the casting pool's missed calls, that SLATE's three years
 *   didn't reach the Bulletin's nine semesters, and that SLATE modeled no repeated course and no added semester. The
 *   code said otherwise on each: a lab missed without excuse is a call missed, and since 2026-10-10 a year can be
 *   repeated and what's unpassed retaken in an additional term (`systems/leave.ts`), refused past nine semesters;
 * - the Incomplete notice said "a week's each" with a straight apostrophe, where every other school string uses ’.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { instantFromZoned } from '@/engine/core/time';
import { YALE_DRAMA } from '@/engine/content/school';
import { LAB_KIND } from '@/engine/systems/school';
import { LAB_CODES, coursesOf, settleCourses, tellFails } from '@/engine/systems/courserecord';

const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour, minute: 0 }, 'America/New_York');

/** The module's leading comment, its ` * ` gutters taken off and its lines joined, as a reader reads it. */
const header = (): string => {
  const text = readFileSync(join(fileURLToPath(new URL('../src/', import.meta.url)), 'engine', 'systems', 'courserecord.ts'), 'utf8');
  const block = /^\/\*\*([\s\S]*?)\*\//.exec(text)![1]!;
  return block.split('\n').map((l) => l.replace(/^\s*\*\s?/, '').trim()).join(' ').replace(/\s+/g, ' ');
};

describe('the course record’s header, against the code', () => {
  it('doesn’t say a lab is kept out of the casting pool’s missed calls, as a lab missed without excuse is one', () => {
    const sim = life('g9-lab-pool');
    sim.advanceTo(at(2026, 8, 24) + 60_000);
    const lab = sim.universe.scheduled.filter((i) => i.kind === LAB_KIND && i.status === 'pending' && i.payload.personId === sim.player.id).sort((a, b) => a.at - b.at)[0]!;
    const school = sim.player.school!;
    sim.advanceTo(lab.at - 60_000);
    const missed = school.tally.calls - school.tally.answered;
    // TEST SETUP: in New York for the afternoon, unexcused.
    sim.player.currentLocationId = 'us-ny-newyork';
    sim.advanceTo(lab.at + 60_000);
    sim.player.currentLocationId = YALE_DRAMA.cityId;
    // The CALL handler takes them out of the pool on `calls - answered` (`ESTIMATE.missedCallsOut`): the lab is in it.
    expect(school.tally.calls - school.tally.answered).toBe(missed + 1);
    expect(Object.values(coursesOf(school)).find((r) => r.code === LAB_CODES[0])).toMatchObject({ meetings: 1, attended: 0, excused: 0 });
    expect(header()).not.toMatch(/don[’']t count toward the casting pool/);
  });

  it('doesn’t say SLATE has no repeated year or added semester, and names only commands that exist', () => {
    const h = header();
    expect(h).not.toMatch(/SLATE models no repeated course/);
    expect(h).not.toMatch(/three years don[’']t reach/);
    const named = [...new Set([...h.matchAll(/`(school\.[a-z_]+)`/g)].map((m) => m[1]!))];
    expect(named).toEqual(expect.arrayContaining(['school.request_repeat', 'school.request_extra_term']));
    // Each named command is registered: on a first-term save it's refused, never unknown.
    for (const kind of named) {
      const sim = life(`g9-${kind}`);
      const r = sim.execute({ kind, payload: {} });
      expect(r.ok ? '' : (r.detail ?? r.error), kind).not.toMatch(/Unknown command/);
    }
  });
});

describe('the Incomplete notice', () => {
  it('uses a typographic apostrophe, as every school notice does', () => {
    const sim = life('g9-incomplete');
    const school = sim.player.school!;
    // TEST SETUP: a term's courses written onto the record: one ill for half its meetings (an Incomplete), one missed
    // without excuse (a Fail), so both notices are said.
    const courses = coursesOf(school);
    courses['0:DRAM 103a'] = { term: 0, academic: 0, code: 'DRAM 103a', name: 'Acting I', meetings: 8, attended: 4, excused: 4 };
    courses['0:DRAM 113a'] = { term: 0, academic: 0, code: 'DRAM 113a', name: 'Voice I', meetings: 8, attended: 2, excused: 0 };
    const before = sim.universe.notifications.length;
    const settled = settleCourses(sim, sim.player, 0, () => ({ due: 0, notShown: 0 }));
    expect(settled.map((r) => r.result).sort()).toEqual(['fail', 'incomplete']);
    // The Fail is told once the evaluation has settled the standing (`tellFails`, from 2026-10-15; until then
    // `settleCourses` told it), so it's told here as the evaluation tells it, the School not ended.
    tellFails(sim, sim.player, 0, false);
    const said = sim.universe.notifications.slice(before).filter((n) => n.category === 'school');
    expect(said.map((n) => n.title).sort()).toEqual(['Incomplete: Acting I', 'Not Passed: Voice I']);
    const incomplete = said.find((n) => n.title === 'Incomplete: Acting I')!;
    expect(incomplete.body).toContain('each covering a week of the course');
    for (const n of said) expect(`${n.title} ${n.body}`, n.title).not.toContain("'");
  });
});
