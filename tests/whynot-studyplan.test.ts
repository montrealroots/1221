/**
 * The study plan's panels on the School screen (`src/ui/components/StudyPlanPanels.tsx`) say why a control is refused
 * in words on the screen, not in its title alone, which touch and keyboard users can't reach (the completeness critic of
 * 2026-10-12, docs/verification/CONNECTED-JOURNEY-MAP-2026-10-12.md item 14). Every refused control there already said
 * it as visible text, beside the control or under its group, so none was given a WhyNot; this holds them there. One was
 * said twice: Ask For A Leave…'s refusal stood beside the button and again under the form, and from 2026-10-12 it's
 * said once, under the form.
 *
 * The panels are rendered to markup (react-dom/server) over real saves, as tests/defects-g8-2.test.ts renders them.
 * PLAYER JOURNEYS play through the clock and the commands; TEST SETUP sets a state by hand to reach one rule, and says so.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { healthOf } from '@/engine/systems/health';
import { clearedToReturn, leaveLengths, leaveRefusal } from '@/engine/systems/leave';
import { SHIFT_KIND, conversionRefusal } from '@/engine/systems/school';

const h = vi.hoisted(() => ({ sim: undefined as unknown as import('@/engine/core/simulation').Simulation }));

vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: noop,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

const { LeavePanel, WorkLimitsBlock } = await import('@/ui/components/StudyPlanPanels');

const zone = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, zone);
const student = (seed: string, extra: Record<string, unknown> = {}) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });
/** With need found: a family of no means, as tests/work-limits.test.ts's conversion makes one. */
const onAid = { family: undefined, wealth: 'scraping' };
/** Played by somebody who looks after themselves, as tests/leave.test.ts plays one. */
const tended = (sim: Simulation, until: number) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };

const drawn = (sim: Simulation, panel: FunctionComponent) => { h.sim = sim; return renderToStaticMarkup(createElement(panel)).replace(/<!-- -->/g, ''); };
const unescape = (s: string) => s.replace(/&quot;/g, '"').replace(/&#x27;/g, '\'').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const attribute = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/** What a player reads without hovering anything: the markup with every title attribute taken out, then every tag. */
const onScreen = (html: string) => unescape(html.replace(/\stitle="[^"]*"/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));
const times = (text: string, said: string) => text.split(said).length - 1;
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** The button of that label, as drawn. */
const button = (html: string, label: string) => new RegExp(`<button[^>]*>${escape(label)}</button>`).exec(html)?.[0];

/** The button is drawn refused, with the reason as its title and the same reason on the screen outside every title. */
function refusedOnScreen(html: string, label: string, why: string) {
  const b = button(html, label);
  expect(b, label).toBeDefined();
  expect(b).toContain('disabled=""');
  expect(b).toContain(`title="${attribute(why)}"`);
  expect(times(onScreen(html), why), why).toBe(1);
}
function openOnScreen(html: string, label: string, was: string) {
  const b = button(html, label);
  expect(b, label).toBeDefined();
  expect(b).not.toContain('disabled');
  expect(onScreen(html)).not.toContain(was);
}

describe('A Leave Of Absence says why it’s refused on the screen', () => {
  it('PLAYER JOURNEY: Ask For A Leave… and the lengths that can’t be, a fall term in with nothing a physician would recommend on', () => {
    const sim = student('wn-leave');
    tended(sim, at(2026, 10, 5));
    // The panel's own choice, as it starts: a medical leave, for an illness.
    const no = leaveRefusal(sim, sim.player, 'medical', 'illness')!;
    expect(no).toMatch(/physician’s written recommendation/);
    const html = drawn(sim, LeavePanel);
    refusedOnScreen(html, 'Ask For A Leave…', no);
    // A length that can't be is Not Possible in the list, and said why under the form.
    const shut = leaveLengths(sim, sim.player.school!, 'medical').filter((x) => x.why);
    expect(shut.length).toBeGreaterThan(0);
    const named = ['', 'One', 'Two', 'Three'] as const;
    for (const x of shut) {
      expect(html).toMatch(new RegExp(`<option value="${x.terms}" disabled="">${named[x.terms]} Terms? \\(Not Possible\\)</option>`));
      expect(onScreen(html)).toContain(`${named[x.terms]} term${x.terms === 1 ? '' : 's'}: ${x.why}`);
    }
    // The falsifiability test: with something a physician would recommend a leave on, the button opens and the refusal
    // goes. TEST SETUP: the flu, as tests/leave.test.ts gives it.
    healthOf(sim.player).fluUntil = sim.now + 4 * MS_DAY;
    expect(leaveRefusal(sim, sim.player, 'medical', 'illness')).toBeUndefined();
    openOnScreen(drawn(sim, LeavePanel), 'Ask For A Leave…', no);
  }, 120_000);

  it('PLAYER JOURNEY: Give Notice Of Return, on a medical leave, before a physician would clear the return', () => {
    const sim = student('wn-notice');
    tended(sim, at(2026, 10, 5));
    // TEST SETUP: the flu, as tests/leave.test.ts gives it, so a medical leave can be asked for.
    healthOf(sim.player).fluUntil = sim.now + 4 * MS_DAY;
    const asked = sim.must<{ decideAt: number }>({ kind: 'school.request_leave', payload: { kind: 'medical', reason: 'illness' } });
    tended(sim, asked.decideAt + MS_HOUR);
    expect(sim.player.school!.leave!.status).toBe('on');
    // TEST SETUP: not well, as tests/leave.test.ts makes the student before their notice.
    sim.player.wellbeing.condition = 20;
    const no = clearedToReturn(sim.player, sim.now)!;
    expect(no).toMatch(/not well enough yet/);
    expect(sim.execute({ kind: 'school.return_notice', payload: {} }).error).toBe(no);
    refusedOnScreen(drawn(sim, LeavePanel), 'Give Notice Of Return', no);
    // The falsifiability test: well again, the button opens and the refusal goes.
    sim.player.wellbeing.condition = 90;
    openOnScreen(drawn(sim, LeavePanel), 'Give Notice Of Return', no);
  }, 120_000);
});

describe('Ask For Conversion To Grant Aid says why it’s refused on the screen', () => {
  it('PLAYER JOURNEY: no hours to convert, then assigned hours missed ill, then asked, and to a student with no aid', () => {
    const label = 'Ask For Conversion To Grant Aid';
    const sim = student('wn-convert', onAid);
    tended(sim, at(2026, 10, 2, 8));
    const none = conversionRefusal(sim, sim.player)!;
    expect(none).toMatch(/There are no hours to convert/);
    refusedOnScreen(drawn(sim, WorkLimitsBlock), label, none);
    // Called in sick on a Saturday with an assigned shift, as tests/work-limits.test.ts plays it. TEST SETUP: not well.
    const sat = sim.universe.scheduled.find((i) => i.kind === SHIFT_KIND && i.status === 'pending' && i.payload.elective === false)!;
    tended(sim, sat.at - 2 * MS_HOUR);
    sim.player.wellbeing.condition = 20;
    sim.must({ kind: 'school.call_in_sick', payload: {} });
    tended(sim, sat.at + MS_HOUR);
    // The falsifiability test: hours to convert open the button, and the refusal goes.
    expect(conversionRefusal(sim, sim.player)).toBeUndefined();
    openOnScreen(drawn(sim, WorkLimitsBlock), label, none);
    sim.must({ kind: 'school.request_conversion', payload: {} });
    const asked = conversionRefusal(sim, sim.player)!;
    expect(asked).toBe('Your request is already in for the next processing.');
    refusedOnScreen(drawn(sim, WorkLimitsBlock), label, asked);
    // No aid, a different reason, said the same way.
    const rich = student('wn-rich', { family: 'wealthy' });
    const noAid = conversionRefusal(rich, rich.player)!;
    expect(noAid).toMatch(/students on financial aid/);
    refusedOnScreen(drawn(rich, WorkLimitsBlock), label, noAid);
  }, 120_000);
});
