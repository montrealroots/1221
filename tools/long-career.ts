/**
 * SLATE — long careers (from 2026-10-25, the owner's brief 27, F: "Long careers beyond the original catalog"; loop 55:
 * "Run representative complete journeys across different formats and circumstances, not only the happy path").
 *
 * Opens one of the journey J01's saves (`tests/fixtures/journey-j01-*-8283f80c.json.gz`, written by a build from before
 * brief 19, so the save is brought forward as any older save is) and plays it on by `tools/career-player.ts`: the attentive
 * player's hours, every commitment stopped at and answered with Go, and the career's business through public commands
 * only. To what the player tool's actors do, this adds what an actor does with the rest of the career brief 27 built:
 * - a reel cut from released screen work, cut again when the record moves past it, and a voice demo mixed;
 * - after the degree, an agent at Stewart Talent approached by a referral from a finished job, what the office asks for
 *   sent, and an agreement offered accepted;
 * - SAG-AFTRA joined once a first principal job makes it possible;
 * - the agent asked for more on an offer, once, where an agent represents the actor;
 * - an Emmy entry and an Actor Awards submission for each eligible credit while it's open and the bank can pay;
 * - for each nomination, Go To The Ceremony where it's clear, Watch From Home where it isn't, the remarks prepared in the
 *   evenings before the show, and Go Up And Accept at the moment to go up.
 * Nothing is set by hand. At the end it reads what the career reached from the save, checks the save's invariants
 * (`breaches`, money among them) and that every page Productions And People lists opens, and prints one JSON summary.
 *
 *   npx vite-node tools/long-career.ts -- --save degree|last-term --years 4 [--out <file>] [--transcript <file>] [--keep <file.json.gz>]
 *     [--from <file.json.gz>] [--until-invited]
 *
 * `--keep` writes the played save, gzipped, for the built app's walks to open. `--from` plays on from a save `--keep`
 * wrote, with `--save`'s player. `--until-invited` ends the run at the first invitation to a ceremony still to answer,
 * before it's answered, so a walk can answer it in the built app (`docs/verification/career-universe-2026-10-24/walk/ceremony.mjs`).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync, gzipSync } from 'node:zlib';
import { loadSave } from '../src/engine';
import type { Simulation } from '../src/engine/core/simulation';
import { MS_DAY, formatDate, zonedParts } from '../src/engine/core/time';
import { deserialise, serialise } from '../src/engine/persistence/adapter';
import { breaches } from '../src/engine/core/invariants';
import { formatMoney, saveCurrency } from '../src/engine/core/money';
import { netWorth } from '../src/engine/systems/finance';
import { stopChoices } from '../src/engine/world/clock';
import { projectById } from '../src/engine/content/careerwork';
import { DEMO, REEL, activeAgreement, currentOf, demoRefusal, demoSources, materialsCheck, reelRefusal, reelSources } from '../src/engine/systems/pro';
import { AGENTS } from '../src/engine/content/agents';
import { checkRefusal, offeredAgreement, referralRefusal, referrersOf, relationOf, sendRefusal, supplyRefusal } from '../src/engine/systems/proagent';
import { askMoreRefusal } from '../src/engine/systems/projobs';
import { joinSagRefusal } from '../src/engine/systems/propay';
import { entryRefusal } from '../src/engine/systems/awards';
import { actorSubmitRefusal } from '../src/engine/systems/actorawards';
import { SPEECH_KIND, nominationsOf, prepareRemarksRefusal, rsvpBy } from '../src/engine/systems/ceremony';
import { pageOf, refIndex } from '../src/engine/systems/reference';
import { graduatingActor, playTo, press, transcriptFrom, unsignedActor, type CareerStep, type Player } from './career-player';

const arg = (name: string, fallback: string) => { const i = process.argv.indexOf(`--${name}`); return i >= 0 ? process.argv[i + 1]! : fallback; };
const which = arg('save', 'degree');
const years = Number(arg('years', '4'));
const out = arg('out', '');
const transcriptOut = arg('transcript', '');
const keepOut = arg('keep', '');
const from = arg('from', `tests/fixtures/journey-j01-${which}-8283f80c.json.gz`);
const untilInvited = process.argv.includes('--until-invited');

const raw = gunzipSync(readFileSync(from)).toString('utf8');
const sim: Simulation = loadSave(deserialise(raw) as never);
const startedAt = sim.now;

/**
 * The portfolio kept up as a working actor keeps it (the player tool's unsigned actor makes headshots and a résumé and
 * no more): a reel cut from released screen work once there's any, cut again when the record has moved past it, and a
 * voice demo mixed from voice recordings, so screen and voice casting take a submission. True when it took time.
 */
const portfolio: CareerStep = (s, player) => {
  const t = player.transcript;
  const person = s.player;
  const pro = person.pro!;
  const before = s.now;
  const reel = reelSources(person, s.now).filter((x) => x.usable).slice(0, REEL.most).map((x) => x.ref);
  const reelBehind = materialsCheck(person, 'screen', s.now).some((x) => x.kind === 'reel');
  if (reel.length && (!currentOf(pro, 'reel') || reelBehind) && !reelRefusal(s, person, reel)) press(s, t, `Cut A Reel (${reel.length})`, 'pro.cut_reel', { pieces: reel });
  const demo = demoSources(person, s.now).filter((x) => x.usable).slice(0, DEMO.most).map((x) => x.ref);
  if (s.now === before && demo.length && !currentOf(pro, 'demo') && !demoRefusal(s, person, demo)) press(s, t, `Mix A Voice Demo (${demo.length})`, 'pro.mix_demo', { pieces: demo });
  return s.now > before;
};

/**
 * An agent approached the way an unsigned actor can after the School (the referral route the real agents at Stewart Talent
 * take, `content/agents.ts`): the notice read, the materials checked, a referral asked for from a finished job judged well
 * enough, the materials sent; what the office asks for made and sent; an agreement offered, accepted. One agent at a
 * time, and none while one represents the actor. True when it took time.
 */
const agents: CareerStep = (s, player) => {
  const t = player.transcript;
  const person = s.player;
  const before = s.now;
  if (activeAgreement(person, s.now)) return false;
  for (const agent of AGENTS.filter((a) => a.routes.includes('referral'))) {
    const rel = relationOf(person, agent.id);
    if (rel && ['sent', 'waiting', 'meeting', 'deciding'].includes(rel.stage)) return false;
    if (offeredAgreement(person, agent)) { press(s, t, `Accept The Agreement (${agent.name})`, 'pro.accept_agreement', { agentId: agent.id }); return s.now > before; }
    if (rel?.stage === 'requested' && !supplyRefusal(s, person, agent)) { press(s, t, `Send What The Office Asked For (${agent.name})`, 'pro.supply_material', { agentId: agent.id }); return s.now > before; }
    const job = referrersOf(s, person, agent).find((r) => !r.why);
    if (!job) continue;
    if (rel?.noticeShownAt === undefined) press(s, t, `I've Read This (${agent.name})`, 'pro.agent_notice', { agentId: agent.id });
    if (!checkRefusal(s, person, agent)) press(s, t, `Check Your Materials (${agent.name})`, 'pro.agent_check', { agentId: agent.id });
    if (!referralRefusal(s, person, agent, job.engagementId)) press(s, t, `Ask For A Referral (${agent.name}, ${job.job})`, 'pro.ask_referral', { agentId: agent.id, engagementId: job.engagementId });
    if (!sendRefusal(s, person, agent)) { press(s, t, `Send Your Materials (${agent.name})`, 'pro.send_materials', { agentId: agent.id }); return s.now > before; }
  }
  return s.now > before;
};

/** What an actor does with the rest of the career, before the player tool's own business. True when it took time. */
const recognition: CareerStep = (s, player) => {
  const t = player.transcript;
  const person = s.player;
  const pro = person.pro!;
  const before = s.now;
  if (pro.sag?.eligibleSince !== undefined && pro.sag.memberSince === undefined && !joinSagRefusal(s, person)) press(s, t, 'Join SAG-AFTRA', 'pro.join_sag');
  if (activeAgreement(person, s.now)) {
    for (const o of pro.opportunities) if (o.status === 'offered' && !askMoreRefusal(s, person, o)) press(s, t, `Ask For More for ${o.projectId}`, 'pro.ask_more', { opportunityId: o.id });
  }
  for (const c of pro.credits) {
    if (!entryRefusal(s, person, c.id)) press(s, t, `Enter Yourself for ${c.project}`, 'pro.award_enter', { creditId: c.id });
    if (!actorSubmitRefusal(s, person, c.id)) press(s, t, `Submit Yourself for ${c.project}`, 'pro.actor_submit', { creditId: c.id });
  }
  for (const n of nominationsOf(person)) {
    if (n.state !== 'nominated') continue;
    if (untilInvited && !n.attend?.rsvp && s.now < rsvpBy(n)) throw new Error(`invited: ${n.id}, to answer by ${formatDate(rsvpBy(n), s.zone)}`);
    if (!n.attend?.rsvp && !press(s, t, `Go To The Ceremony for ${n.id}`, 'pro.ceremony_rsvp', { entryId: n.id, attend: true })) press(s, t, `Watch From Home for ${n.id}`, 'pro.ceremony_rsvp', { entryId: n.id, attend: false });
    const p = zonedParts(s.now, s.zone);
    if (p.hour >= 18 && !prepareRemarksRefusal(s, person, n.id)) { press(s, t, `Prepare Your Remarks for ${n.id}`, 'pro.ceremony_prepare', { entryId: n.id }); if (s.now > before) return true; }
  }
  return s.now > before;
};
const own: CareerStep = which === 'last-term' ? graduatingActor({ joinSag: true, agreement: 'accept' }) : unsignedActor();
const player: Player = {
  career: (s, p) => recognition(s, p) || portfolio(s, p) || (which === 'degree' && agents(s, p)) || own(s, p),
  // The moment to go up: its own choice, Go Up And Accept; every other stop answered with Go.
  stop: (_s, item) => (item.kind === SPEECH_KIND ? stopChoices(SPEECH_KIND)[0]! : 'go'),
  transcript: transcriptFrom(sim),
};

const t0 = performance.now(); // the tool's own running time, not the game's
const until = startedAt + Math.round(years * 365.25) * MS_DAY;
const yearly: { at: string; credits: number; booked: number; cash: string }[] = [];
let ended: string | undefined;
try {
  for (let at = startedAt; at < until;) {
    const next = Math.min(until, at + 365 * MS_DAY);
    playTo(sim, next, player);
    at = next;
    yearly.push({ at: formatDate(sim.now, sim.zone), credits: sim.player.pro?.credits.length ?? 0, booked: sim.player.pro?.engagements.length ?? 0, cash: formatMoney(netWorth(sim, sim.player.id).cash, saveCurrency(sim.universe)) });
  }
} catch (e) {
  ended = (e as Error).message;
}

const pro = sim.player.pro!;
const count = <T,>(xs: readonly T[], key: (x: T) => string) => xs.reduce<Record<string, number>>((m, x) => { const k = key(x); m[k] = (m[k] ?? 0) + 1; return m; }, {});
const origin = (projectId: string) => { const t = projectById(projectId); return !t ? 'unknown' : t.slate ? 'slate' : t.drawn ? 'drawn' : 'fixed'; };
const historyKeys = pro.engagements.flatMap((e) => e.history.map((h) => h.key ?? ''));
const reloaded = loadSave(deserialise(serialise(sim.universe)) as never);
const index = refIndex(sim, sim.player).flatMap((g) => g.entries);
const unopened = index.filter((e) => !pageOf(sim, sim.player, e.key)).map((e) => e.words);
const summary = {
  save: which,
  commit: process.env.SLATE_COMMIT ?? '',
  from: formatDate(startedAt, sim.zone),
  to: formatDate(sim.now, sim.zone),
  yearsAsked: years,
  ended: ended ?? null,
  seconds: Math.round((performance.now() - t0) / 1000),
  yearly,
  opportunities: { total: pro.opportunities.length, byStatus: count(pro.opportunities, (o) => o.status), byOrigin: count(pro.opportunities, (o) => origin(o.projectId)), direct: pro.opportunities.filter((o) => o.direct).length, held: pro.opportunities.filter((o) => o.hold).length, rounds: count(pro.opportunities.flatMap((o) => o.rounds ?? []), (r) => `${r.round}:${r.status}`) },
  engagements: { total: pro.engagements.length, byStatus: count(pro.engagements, (e) => e.status), byOrigin: count(pro.engagements, (e) => origin(e.projectId)), byFormat: count(pro.engagements, (e) => projectById(e.projectId)?.format ?? 'unknown') },
  happened: count(historyKeys.filter((k) => /^(weather|release|cut|loop|reshoot|promo|replaced|shot-around|missed)/.test(k)), (k) => k.split(':')[0]!),
  credits: { total: pro.credits.length, byStatus: count(pro.credits, (c) => c.status), byMedium: count(pro.credits, (c) => c.medium), withRun: pro.credits.filter((c) => c.run).length, release: count(pro.credits.filter((c) => c.release), (c) => c.release!.kind) },
  awards: { emmys: count(pro.awards ?? [], (a) => a.state), actorAwards: count(pro.guild ?? [], (g) => g.state), festivals: count(pro.festivals ?? [], (f) => f.state), attended: count(nominationsOf(sim.player).filter((n) => n.attend), (n) => `${n.attend!.rsvp}:${n.attend!.outcome ?? 'to come'}:${n.attend!.accepted ?? '-'}`) },
  representation: { agreements: count(pro.agreements, (a) => a.status), relations: Object.fromEntries(Object.entries(pro.relations).map(([k, r]) => [k, r.stage])) },
  unions: { sag: pro.sag?.memberSince !== undefined ? 'member' : pro.sag?.eligibleSince !== undefined ? 'eligible' : 'not eligible' },
  reference: { entries: index.length, yourWork: refIndex(sim, sim.player)[0]!.entries.length, unopened },
  breaches: breaches(sim.universe).map((b) => `${b.law}: ${b.detail}`),
  reloadSame: JSON.stringify(serialise(reloaded.universe)) === JSON.stringify(serialise(sim.universe)),
  transcriptLines: player.transcript!.lines.length,
};
if (transcriptOut) writeFileSync(transcriptOut, `${player.transcript!.lines.join('\n')}\n`);
if (keepOut) writeFileSync(keepOut, gzipSync(serialise(sim.universe)));
const text = `${JSON.stringify(summary, null, 1)}\n`;
if (out) writeFileSync(out, text);
process.stdout.write(text);
