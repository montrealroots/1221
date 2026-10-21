/**
 * Brief 19's playthroughs (V1, A1, L1, V16 and J6, 2026-10-21): the lives tests/journey-career.test.ts and
 * tests/journey-career-older.test.ts play, played again here to write down what the player met, and the seed searches
 * that chose life A's and life B's seeds. The players are `tools/career-player.ts`'s; nothing a command or the clock
 * would set is set here, but for the TEST SETUP that brings a new life to its last term's first morning, which the
 * tests do the same way (played by the clock six hours at a time, the body kept fed and rested and the coursework
 * prepared each midnight, then saved and opened again so that hook goes with the session that set it).
 *
 *   npx vite-node docs/verification/career-2026-10-20/playthroughs/play.ts -- lives OUTDIR
 *   npx vite-node docs/verification/career-2026-10-20/playthroughs/play.ts -- seeds-a FROM TO OUTDIR
 *   npx vite-node docs/verification/career-2026-10-20/playthroughs/play.ts -- seeds-b FROM TO OUTDIR
 *
 * `lives` writes, to OUTDIR, the transcript of each life in the order the player met it (each notice and question as
 * it came, each stop and how it was answered, each command pressed): `life-a-v1-21.txt`, `life-b-v1-7.txt` (the seeds
 * the searches chose again on a43b4f8f, 2026-10-21, with the fictional agent, the parts written for an actor, an actress
 * or either, and commitments whose trips meet no longer both gone to; v1-12 and v1-5 until then),
 * `v16-graduate.txt` (the J01 save from 8283f80c, 4 August 2029, played to its first paid job) and `v16-mid-term.txt`
 * (the same life's save from 1 March 2029, played to its degree). `seeds-a` and `seeds-b` append one JSON line a seed
 * to OUTDIR/seeds-a.jsonl or OUTDIR/seeds-b.jsonl, each saying where that seed's life went and why.
 */
import { gunzipSync } from 'node:zlib';
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createSave, loadSave } from '../../../../src/engine';
import type { Simulation } from '../../../../src/engine/core/simulation';
import { MS_DAY, MS_HOUR, formatDateTime, instantFromZoned } from '../../../../src/engine/core/time';
import { newLifeConfig } from '../../../../src/engine/world/bootstrap';
import { deserialise, serialise } from '../../../../src/engine/persistence/adapter';
import { stopChoices } from '../../../../src/engine/world/clock';
import { PREP_DIMS } from '../../../../src/engine/content/coursework';
import { AGENTS } from '../../../../src/engine/content/agents';
import { projectById } from '../../../../src/engine/content/careerwork';
import { courseworkOf } from '../../../../src/engine/systems/coursework';
import { SHOWCASE_COURSE } from '../../../../src/engine/systems/proshowcase';
import { MEETING_KIND, relationOf } from '../../../../src/engine/systems/proagent';
import { graduatingActor, playTo, readNotices, transcriptFrom, unsignedActor, type Player } from '../../../../tools/career-player';

const zone = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour, minute: 0 }, zone);
const AGENT = AGENTS[0]!;
const SEED_A = 'v1-21';
const SEED_B = 'v1-7';
const cross = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
const fixture = (name: string): Simulation => loadSave(deserialise(gunzipSync(readFileSync(`tests/fixtures/${name}.json.gz`)).toString('utf8')) as never);

/** TEST SETUP: a new life to the first morning of its last term, Monday 8 January 2029 at seven, as the test makes it. */
function lastTermMorning(seed: string): Simulation {
  const sim = createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
  sim.onEvent('world.day_rollover', 'test.doTheWork', (_e, { sim: s }) => {
    for (const a of courseworkOf(s, s.player)?.assignments ?? []) {
      if ((a.status !== 'open' && a.status !== 'revising') || a.course === SHOWCASE_COURSE) continue;
      for (const d of PREP_DIMS) a.prep[d] = Math.max(a.prep[d] ?? 0, 0.95);
    }
  });
  const until = at(2029, 1, 8, 7);
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
  return cross(sim);
}

/** Life A's player: Ask To Move at the meeting's first stop, then Go; Join SAG-AFTRA once it can. */
function lifeAPlayer(): Player {
  let moved = false;
  return { career: graduatingActor({ joinSag: true }), stop: (_s, item) => { if (item.kind !== MEETING_KIND || moved) return 'go'; moved = true; return stopChoices(MEETING_KIND)[0]!; } };
}
const sagThroughHim = (sim: Simulation) => sim.player.pro!.engagements.find((x) => x.agreementId && projectById(x.projectId)?.union === 'sag-aftra' && ['network-drama', 'low-budget'].includes(projectById(x.projectId)!.kind));

const [mode, ...rest] = process.argv.slice(2).filter((a) => a !== '--');
if (mode === 'lives') {
  const out = rest[0] ?? '.';
  mkdirSync(out, { recursive: true });
  const write = (name: string, lines: string[]) => { writeFileSync(`${out}/${name}`, `${lines.join('\n')}\n`); console.log(`${name}: ${lines.length} lines`); };

  // Life A: from the last term's first morning to its first billing as a SAG-AFTRA member, then End It By Agreement
  // (v1-21's billing is 1 May 2030; until 2026-10-21, v1-12's was 1 November 2029, and the play stopped there by name).
  {
    let sim = lastTermMorning(SEED_A);
    const t = transcriptFrom(sim);
    const player = { ...lifeAPlayer(), transcript: t };
    const billed = (s: Simulation) => (s.player.pro!.unionBills ?? []).some((b) => b.key.startsWith('sag-aftra:dues:') && b.settled);
    while (sim.now < at(2030, 6, 1)) {
      playTo(sim, Math.min(at(2030, 6, 1), sim.now + 7 * MS_DAY), player, billed);
      if (billed(sim)) break;
      sim = cross(sim);
    }
    const r = sim.execute({ kind: 'pro.end_agreement', payload: { how: 'agreement' } });
    t.lines.push(`${formatDateTime(sim.now, zone)} | PRESS | End It By Agreement | ${r.ok ? 'done' : r.error}`);
    readNotices(sim, t);
    write(`life-a-${SEED_A}.txt`, t.lines);
  }
  // Life B: the reel cut only once the follow-up has come, the résumé made when asked, the agreement declined.
  {
    let sim = lastTermMorning(SEED_B);
    const t = transcriptFrom(sim);
    const player: Player = { career: graduatingActor({ reel: 'after-follow-up', resume: 'when-asked', agreement: 'decline' }), transcript: t };
    while (sim.now < at(2029, 6, 30) && sim.player.pro!.agreements[0]?.status !== 'declined') {
      playTo(sim, Math.min(at(2029, 6, 30), sim.now + 7 * MS_DAY), player, (s) => s.player.pro!.agreements[0]?.status === 'declined');
      sim = cross(sim);
    }
    readNotices(sim, t);
    write(`life-b-${SEED_B}.txt`, t.lines);
  }
  // V16: the graduate's save from before brief 19, unsigned, to her first job paid.
  {
    let sim = fixture('journey-j01-degree-8283f80c');
    const t = transcriptFrom(sim);
    readNotices(sim, t);
    const player: Player = { career: unsignedActor(), transcript: t };
    const paid = (s: Simulation) => s.player.pro!.engagements.some((e) => e.pay.length > 0 && e.pay.every((p) => p.received));
    while (sim.now < at(2029, 12, 31) && !paid(sim)) { playTo(sim, Math.min(at(2029, 12, 31), sim.now + 7 * MS_DAY), player, paid); sim = cross(sim); }
    write('v16-graduate.txt', t.lines);
  }
  // V16: the same life's save from mid-way through its last term, onto the showcase and to its degree.
  {
    let sim = fixture('journey-j01-last-term-8283f80c');
    const t = transcriptFrom(sim);
    readNotices(sim, t);
    const player: Player = { career: graduatingActor(), transcript: t };
    const graduated = (s: Simulation) => s.player.school?.standing === 'graduated';
    while (sim.now < at(2029, 5, 31) && !graduated(sim)) { playTo(sim, Math.min(at(2029, 5, 31), sim.now + 7 * MS_DAY), player, graduated); sim = cross(sim); }
    readNotices(sim, t);
    write('v16-mid-term.txt', t.lines);
  }
} else if (mode === 'seeds-a' || mode === 'seeds-b') {
  const [from, to, out = '.'] = [Number(rest[0]), Number(rest[1]), rest[2]];
  mkdirSync(out, { recursive: true });
  for (let i = from; i < to; i += 1) {
    const seed = `v1-${i}`;
    const sim = lastTermMorning(seed);
    const file = `${out}/${mode}.jsonl`;
    if (sim.player.school?.standing !== 'good') { appendFileSync(file, `${JSON.stringify({ seed, skipped: sim.player.school?.standing })}\n`); continue; }
    let end = 'until';
    if (mode === 'seeds-a') {
      // Settled when SAG-AFTRA work through him is paid on, or the way to it is closed.
      const player = lifeAPlayer();
      end = 'end-2029';
      while (sim.now < at(2029, 12, 31)) {
        playTo(sim, sim.now + 7 * MS_DAY, player);
        const sc = sim.player.pro!.showcase;
        const rel = relationOf(sim.player, AGENT.id);
        if (!sc) { end = 'no-showcase'; break; }
        if (sc.followUp && !sc.followUp.agents.includes(AGENT.id)) { end = 'not-asked'; break; }
        if (rel && ['passed', 'unanswered', 'declined'].includes(rel.stage)) { end = `relation-${rel.stage}`; break; }
        const e = sagThroughHim(sim);
        if (e && e.pay.every((p) => p.received)) { end = 'sag-paid'; break; }
      }
    } else {
      // Settled when the follow-up asks (not life B), the approach closes, or the offer is declined.
      const player: Player = { career: graduatingActor({ reel: 'after-follow-up', resume: 'when-asked', agreement: 'decline' }) };
      const kinds = () => (relationOf(sim.player, AGENT.id)?.history ?? []).map((e) => e.kind);
      while (sim.now < at(2029, 9, 1)) {
        playTo(sim, sim.now + 3 * MS_DAY, player);
        const sc = sim.player.pro!.showcase!;
        const rel = relationOf(sim.player, AGENT.id);
        if (sc.followUp && sc.followUp.agents.length) { end = 'asked'; break; }
        if (rel && ['passed', 'unanswered'].includes(rel.stage)) { end = rel.stage; break; }
        if (rel?.stage === 'meeting' && !kinds().includes('requested')) { end = 'meeting-without-request'; break; }
        if (rel?.stage === 'declined') { end = 'declined'; break; }
      }
    }
    const rel = relationOf(sim.player, AGENT.id);
    const line = {
      seed, end, at: formatDateTime(sim.now, zone),
      why: rel?.why && { step: rel.why.step, chance: rel.why.chance, n: rel.why.atOrBeyond, levels: rel.why.factors.map((f) => `${f.id}:${f.level}`).join(' ') },
      history: (rel?.history ?? []).map((e) => e.kind), bands: sim.player.pro!.showcase?.performed.map((p) => p.band).join(','),
      bookings: sim.player.pro!.engagements.map((e) => `${e.projectId}@${formatDateTime(e.days[0]!.from, zone)}`),
    };
    console.log(JSON.stringify(line));
    appendFileSync(file, `${JSON.stringify(line)}\n`);
  }
} else {
  console.error('play.ts lives OUTDIR | seeds-a FROM TO OUTDIR | seeds-b FROM TO OUTDIR');
  process.exit(2);
}
