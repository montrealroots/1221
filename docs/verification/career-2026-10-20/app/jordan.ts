/**
 * Where a classmate called Jordan and the agent, Jordan Parente, meet in what the player reads (brief 19, the app part's
 * third defect, 2026-10-21): a last term played on three seeds, every notice from the term's first day to five weeks
 * after Commencement printed in the order it came, with its importance, and then the unread list as Home's What Needs
 * You orders it (`unreadNotifications`, most important first, then newest) on the morning after the agent's first notice.
 *
 *   npx vite-node docs/verification/career-2026-10-20/app/jordan.ts -- OUT.txt
 *
 * Seeds: `showcase-final` (the showcase journey's, `tests/pro-showcase.test.ts`), and `app-jordan-0` and `app-jordan-2`,
 * the first two of the prefix whose class has an actor called Jordan (the showcase's seed has none; `seeds.ts` in the
 * scratchpad found them by making the life and reading its class).
 *
 * PLAYED: a new life (`createSave` with `newLifeConfig`), Ada Cole, born in New York, at Yale from August 24, 2026; the
 * clock moved six hours at a time to the last term's first day as the showcase journey moves it; then every commitment
 * stopped at and gone to (Go), as the top bar's Go carries the jump on. On the morning after the School's follow-up the
 * player does what its notice says: headshots, a résumé, the check, and Send Your Materials, each by its command.
 * TEST SETUP, as the showcase journey's: the body kept fed, rested and steady as the clock moves; every open piece of
 * coursework prepared each midnight, the showcase's scenes among them. Nothing read is ever marked read, so the unread
 * list is the one a player who reads nothing has.
 */
import { writeFileSync } from 'node:fs';
import { createSave } from '../../../../src/engine';
import type { Simulation } from '../../../../src/engine/core/simulation';
import type { ScheduledItem } from '../../../../src/engine/core/scheduler';
import { MS_DAY, MS_HOUR, formatDateTime, instantFromZoned } from '../../../../src/engine/core/time';
import { newLifeConfig } from '../../../../src/engine/world/bootstrap';
import { answerStop } from '../../../../src/engine/world/clock';
import { unreadNotifications } from '../../../../src/engine/world/world';
import { courseworkOf } from '../../../../src/engine/systems/coursework';
import { PREP_DIMS } from '../../../../src/engine/content/coursework';
import { AGENTS } from '../../../../src/engine/content/agents';

const OUT = process.argv.at(-1)!;
const zone = 'America/New_York';
const at = (y: number, m: number, d: number, h = 9) => instantFromZoned({ year: y, month: m, day: d, hour: h, minute: 0 }, zone);
const AGENT = AGENTS[0]!;
const lines: string[] = [];
const say = (s = '') => { lines.push(s); };

/** TEST SETUP: the coursework done, every part of every open piece prepared each midnight, the showcase's included. */
function working(sim: Simulation): Simulation {
  sim.onEvent('world.day_rollover', 'test.doTheWork', (_e, { sim: s }) => {
    for (const a of courseworkOf(s, s.player)?.assignments ?? []) {
      if (a.status !== 'open' && a.status !== 'revising') continue;
      for (const d of PREP_DIMS) a.prep[d] = Math.max(a.prep[d] ?? 0, 0.95);
    }
  });
  return sim;
}
/** TEST SETUP: rested, fed and steady each time the clock moves. */
const tend = (sim: Simulation) => Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
const play = (sim: Simulation, until: number) => { while (sim.now < until) { tend(sim); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };
/** Played as a player plays: each jump six hours at most, every commitment stopped at and gone to with Go. */
function jump(sim: Simulation, until: number): ScheduledItem[] {
  const stops: ScheduledItem[] = [];
  while (sim.now < until) {
    tend(sim);
    const wanted = Math.min(until, sim.now + 6 * MS_HOUR);
    let r = sim.advanceTo(wanted, { stopOnPlayerRequired: true });
    while (r.interruptedBy) {
      stops.push(r.interruptedBy);
      r = answerStop(sim, { item: r.interruptedBy, wanted, sentFrom: r.sentFrom }, 'go').result!;
    }
  }
  return stops;
}

const isAgents = (t: string, b: string) => t.includes(AGENT.name) || b.includes(AGENT.name) || b.includes(AGENT.fictional);

for (const seed of ['showcase-final', 'app-jordan-0', 'app-jordan-2']) {
  const sim = working(createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' }));
  const jordans = sim.player.school!.classmates.filter((m) => m.name.split(' ')[0] === 'Jordan').map((m) => m.name);
  say(`=========== ${seed}: the class's Jordan ${jordans.length ? jordans.join(', ') : 'none'}`);
  const from = at(2029, 1, 8, 12);
  play(sim, from);
  jump(sim, at(2029, 5, 1, 9));
  // Up to the follow-up and the morning after it.
  let followUp: number | undefined;
  for (let d = at(2029, 5, 1, 9); d < at(2029, 6, 1, 9) && followUp === undefined; d += MS_DAY) {
    jump(sim, d);
    followUp = sim.player.pro?.showcase?.followUp?.at;
  }
  let acted = 'no follow-up came';
  if (followUp !== undefined) {
    jump(sim, followUp + 25 * MS_HOUR);
    const tries = [
      { kind: 'pro.headshots', payload: {} }, { kind: 'pro.update_resume', payload: {} },
      { kind: 'pro.agent_check', payload: {} }, { kind: 'pro.send_materials', payload: {} },
    ].map((c) => { const r = sim.execute(c); return `${c.kind} ${r.ok ? 'done' : `refused: ${r.error}`}`; });
    acted = tries.join('; ');
  }
  say(`The School's follow-up: ${followUp !== undefined ? formatDateTime(followUp, zone) : 'none'}. The morning after: ${acted}.`);
  jump(sim, at(2029, 6, 25, 9));
  const notices = sim.universe.notifications.filter((n) => n.at >= from).sort((a, b) => a.at - b.at);
  const firstAgent = notices.find((n) => isAgents(n.title, n.body));
  say(`The agent's first notice: ${firstAgent ? `${formatDateTime(firstAgent.at, zone)}, "${firstAgent.title}"` : 'none'}`);
  say('');
  say('Every notice naming Jordan, in the order it came, days from the agent\'s first notice:');
  for (const n of notices.filter((x) => `${x.title} ${x.body}`.includes('Jordan'))) {
    const who = isAgents(n.title, n.body) ? 'AGENT' : 'CLASSMATE';
    const days = firstAgent ? ((n.at - firstAgent.at) / MS_DAY).toFixed(1) : '-';
    say(`  ${formatDateTime(n.at, zone)} [${who}, importance ${n.importance}, ${days} days] ${n.title}: ${n.body.slice(0, 220)}`);
  }
  if (firstAgent) {
    // The unread list on the morning after, as What Needs You orders it: nothing was marked read.
    const read = sim.universe.notifications.map((n) => n.read);
    say('');
    say('What Needs You\'s unread notices, as ordered, with the agent\'s first notice and every Jordan among the first twelve:');
    const was = sim.now;
    void was;
    const list = unreadNotifications(sim).filter((n) => n.at <= firstAgent.at + MS_DAY);
    list.slice(0, 12).forEach((n, i) => say(`  ${i + 1}. [${n.importance}] ${formatDateTime(n.at, zone)} ${n.title}`));
    sim.universe.notifications.forEach((n, i) => { n.read = read[i]!; });
  }
  say('');
}
writeFileSync(OUT, `${lines.join('\n')}\n`);
console.log(lines.join('\n'));
