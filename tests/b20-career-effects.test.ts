/**
 * Brief 20's B1 and B3 for the career: controlled comparisons, both ways, through the commands and the clock
 * (`docs/verification/audit-2026-10-21/criteria.md` B1 and B3; the career area's report). Each plays two or three lives
 * alike in everything but one input, from the same seed and the same save (`twin`), and shows the difference that input
 * should make where it's relevant, and none where it isn't:
 * 1. the sides prepared or not: the audition's judgment; an agreement signed or not, the same judgment;
 * 2. the project's genres known or not: its self-tape and its shoot days; an unrelated genre known or not, the same;
 * 3. an agreement declined, or an approach passed on: what his office does later, and for how long; the open calls, the same;
 * 4. represented or not: the commission (only through the agency's trust account) and the roles that reach the actor;
 *    the work's judgment, its gross pay, what's withheld and the open-only calls, the same;
 * 5. a job judged Strong or Working: a referral from it, or not; the bank balance, no difference;
 * 6. a credit: the résumé, his office's reading of the record, and the part never posted again; every other part's
 *    postings, the same;
 * 7. permission to work (an F-1 graduate on OPT or not): accepting an offer; the roles posted, the audition's judgment
 *    and casting's word, the same;
 * 8. a screen credit's release, on the clock: its footage on a reel then and not before.
 *
 * TEST SETUP, said where it's done, each an input and never the consequence checked: the graduate made by the School's
 * own handlers brought forward; the body tended as the clock moves; for the parts offered, a life at the top of every
 * ability and technique and knowing the projects' genres (`baseLife`, `offeredPart`: seeds of
 * tests/b20-career-skill.test.ts's fixed list whose lives were offered the part, a success-path fixture); the inputs the
 * twins differ in (an agreement signed, a genre's familiarity, the abilities' level, money posted in, an F-1's end brought
 * forward with the degree); a finished job's referral and a seed read from his own draw (`seedWhere`).
 */
import { describe, expect, it } from 'vitest';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, formatDate, zonedParts } from '@/engine/core/time';
import { projectById } from '@/engine/content/careerwork';
import { genreState } from '@/engine/systems/engagement';
import { f1Of } from '@/engine/systems/permission';
import { STARTING, documentsOf } from '@/engine/systems/documents';
import { acceptRefusal, projectOf, roundToCome } from '@/engine/systems/projobs';
import { caseKeys, interestOf, relationOf, sendRefusal } from '@/engine/systems/proagent';
import { resumeBehind } from '@/engine/systems/pro';
import {
  AGENT, SURE, at, baseLife, eng, heldByBoth, offeredPart, opp, played, prepareAll, reel, referredGraduate, represent, seedWhere, setSkill, submitted, tape,
  tended, toCasting, twin, waitFor,
} from './fakes/b20-career';

const zone = 'America/New_York';
const HORROR = ['psychological_horror', 'horror'];
/** TEST SETUP: money posted into the bank from outside the game, as the money area's tests fund a life. */
const fund = (sim: Simulation, cents: number) => sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: sim.player.primaryAccountId!, amount: cents }, { accountId: sim.nominalAccount('income', 'Test').id, amount: -cents }] });
/** Every posting of every part but one, by part, week and way. */
const othersPosted = (sim: Simulation, but: string) => sim.player.pro!.opportunities.filter((o) => o.projectId !== but).map((o) => `${o.projectId}@${o.postedAt}:${o.via}`).sort();
/** The postings of the parts no agent's breakdown brings, by part and week: what representation mustn't touch. */
const openOnly = (sim: Simulation) => sim.player.pro!.opportunities.filter((o) => !projectById(o.projectId)!.access.agent).map((o) => `${o.projectId}@${o.postedAt}`).sort();
const round0 = (sim: Simulation, id: string) => opp(sim, id).rounds![0]!;

describe('B1 and B3: the career’s inputs, each changed alone', () => {
  it('1. PLAYER JOURNEY: the sides prepared make the self-tape better, by a band; an agreement signed makes it no different', () => {
    const base = baseLife('b20-skill-0');
    const o = waitFor(base, (x) => x.projectId === 'route-nine')!;
    submitted(base, o);
    const prepared = twin(base);
    const cold = twin(base);
    const signed = twin(base);
    prepareAll(prepared, { opportunityId: o.id });
    for (const s of [cold, signed]) played(s, prepared.now);
    represent(signed);
    for (const s of [prepared, cold, signed]) tape(s, opp(s, o.id));
    expect(prepared.now).toBe(cold.now);
    const p = round0(prepared, o.id);
    const c = round0(cold, o.id);
    expect(p.overall!).toBeGreaterThan(c.overall! + 30);
    expect(['strong', 'exceptional']).toContain(p.band);
    expect(['unready', 'working']).toContain(c.band);
    // Not ready, the record says what held it back: the preparation.
    expect(c.held).toMatch(/prepar|break|lines|rehears/i);
    expect(round0(signed, o.id).overall).toBe(c.overall);
    expect(round0(signed, o.id).band).toBe(c.band);
  }, 120_000);

  it('2. PLAYER JOURNEY: knowing the project’s genres makes its self-tape and its shoot days better; an unrelated genre known or not changes neither', () => {
    // At the self-tape: the sides prepared alike, the genre each twin knows set at the split.
    const base = baseLife('b20-skill-0');
    const o = waitFor(base, (x) => x.projectId === 'route-nine')!;
    submitted(base, o);
    prepareAll(base, { opportunityId: o.id });
    const knows = twin(base);
    const new_ = twin(base);
    const other = twin(base);
    for (const g of HORROR) genreState(new_.player, g).familiarity = 0;
    for (const g of ['romantic_comedy', 'comedy', 'romance']) genreState(other.player, g).familiarity = 0;
    for (const s of [knows, new_, other]) tape(s, opp(s, o.id));
    expect(round0(knows, o.id).overall!).toBeGreaterThan(round0(new_, o.id).overall!);
    expect(round0(other, o.id).overall).toBe(round0(knows, o.id).overall);

    // At the shoot: the part prepared through its commands, the genre each twin knows set at the split.
    const offered = offeredPart('b20-skill-0', 'route-nine');
    const id = offered.sim.must<{ engagementId: string }>({ kind: 'pro.accept_offer', payload: { opportunityId: offered.o.id } }).engagementId;
    prepareAll(offered.sim, { engagementId: id });
    const k = twin(offered.sim);
    const n = twin(offered.sim);
    const x = twin(offered.sim);
    for (const g of HORROR) genreState(n.player, g).familiarity = 0;
    for (const g of ['romantic_comedy', 'comedy', 'romance']) genreState(x.player, g).familiarity = 0;
    for (const s of [k, n, x]) played(s, eng(s, id).days.at(-1)!.to + MS_DAY);
    const days = (s: Simulation) => eng(s, id).log!.map((l) => l.overall!);
    expect(days(k)).toHaveLength(4);
    days(k).forEach((q, i) => expect(q).toBeGreaterThan(days(n)[i]!));
    expect(days(x)).toEqual(days(k));
    // And the days themselves are practice in the project's genres (`practiceGenres`), so the twin who didn't know them
    // knows them a little now, and no other genre moved. Until brief 21 (2026-10-22) the practice was split between both
    // tags, horror with it; from then the broad tag listed beside its own kind is one requirement, the kind's, so the
    // practice is psychological horror's and horror itself is where it was, read through its kind (`relatedness`).
    expect(genreState(n.player, 'psychological_horror').practice).toBeGreaterThan(0);
    expect(genreState(n.player, 'horror').practice).toBe(genreState(offered.sim.player, 'horror').practice);
    expect(genreState(n.player, 'romantic_comedy').practice).toBe(genreState(offered.sim.player, 'romantic_comedy').practice);
  }, 180_000);

  it('3. PLAYER JOURNEY: an agreement declined holds his office back six months and an approach passed on a year, each said with its date; the open calls posted are the same either way', () => {
    const seed = seedWhere('b20-effects-declined', (d) => d(1, 'interest') < SURE.meet && d(1, 'offer') < SURE.offer);
    const { sim } = referredGraduate(seed);
    reel(sim);
    tended(sim, at(2026, 9, 4, 10));
    sim.must({ kind: 'pro.send_materials', payload: {} });
    tended(sim, at(2026, 9, 30, 12));
    expect(relationOf(sim.player, AGENT.id)!.stage).toBe('offered');
    const declined = twin(sim);
    const signed = twin(sim);
    declined.must({ kind: 'pro.decline_agreement', payload: {} });
    signed.must({ kind: 'pro.accept_agreement', payload: {} });
    for (const s of [declined, signed]) tended(s, at(2027, 2, 1, 12));
    expect(sendRefusal(declined, declined.player, AGENT)).toBe('You declined his offer on September 30, 2026. In the game his office looks again only after six months, from March 31, 2027, and then only at something new.');
    // Signed, his breakdowns came; declined, none did. The calls no agent brings came the same weeks to both.
    expect(signed.player.pro!.opportunities.filter((o) => o.via === 'agent').length).toBeGreaterThan(0);
    expect(declined.player.pro!.opportunities.filter((o) => o.via === 'agent')).toEqual([]);
    // Over the weeks both records hold (`heldByBoth`): his breakdowns fill the signed life's record sooner.
    const [d3, s3] = heldByBoth(openOnly(declined), openOnly(signed));
    expect(d3.length).toBeGreaterThan(0);
    expect(d3).toEqual(s3);
    // Six months on, the hold is over; something new is still asked for.
    tended(declined, at(2027, 4, 1, 12));
    expect(sendRefusal(declined, declined.player, AGENT)).toMatch(/^His office already looked at everything on your record, on September 30, 2026\./);

    // Passed on at the first answer: held a year, so at the same date the declined life is free of its hold, this one isn't.
    const passSeed = seedWhere('b20-effects-passed', (d) => d(1, 'interest') >= 0.5 && d(1, 'interest') < 0.736);
    const passed = referredGraduate(passSeed).sim;
    reel(passed);
    tended(passed, at(2026, 9, 4, 10));
    passed.must({ kind: 'pro.send_materials', payload: {} });
    tended(passed, at(2026, 9, 30, 12));
    expect(relationOf(passed.player, AGENT.id)!.stage).toBe('passed');
    const passedOn = relationOf(passed.player, AGENT.id)!.stageAt;
    tended(passed, at(2027, 4, 1, 12));
    expect(sendRefusal(passed, passed.player, AGENT)).toBe(`His office passed on ${formatDate(passedOn, zone)}. In the game his office looks again only after a year, from ${formatDate(relationOf(passed.player, AGENT.id)!.cooldown!.until, zone)}, and then only at something new.`);
  }, 180_000);

  it('4. PLAYER JOURNEY: represented when the contract is made, the pay goes through the agency’s trust account less ten percent; unrepresented, straight to the bank with none; the work, the gross and the tax withheld are the same, and so are the calls no agent brings', () => {
    const { sim, o } = offeredPart('b20-skill-1', 'eastview');
    const rep = twin(sim);
    const own = twin(sim);
    represent(rep);
    // Each twin's own engagement: the agreement signed took an id from the record's namespace in one of them.
    const ids = new Map<Simulation, string>([rep, own].map((s) => [s, s.must<{ engagementId: string }>({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } }).engagementId]));
    const job = (s: Simulation) => eng(s, ids.get(s)!);
    for (const s of [rep, own]) {
      played(s, job(s).days.at(-1)!.to + MS_DAY);
      tended(s, job(s).pay[0]!.due + 8 * MS_DAY);
    }
    const r = job(rep).pay[0]!.received!;
    const u = job(own).pay[0]!.received!;
    expect(r.via).toBe('trust');
    expect(u.via).toBe('direct');
    expect(r.gross).toBe(u.gross);
    expect(r.withheld).toBe(u.withheld);
    expect(r.commission).toBe(Math.round(r.gross * 0.1));
    expect(u.commission).toBe(0);
    expect(u.net - r.net).toBe(r.commission);
    // The commission is posted once, to the agency, and only in the represented life.
    const commission = (s: Simulation) => s.universe.transactions.flatMap((t) => t.postings).filter((p) => p.accountId === s.nominalAccount('expense', 'Agent’s Commission').id).reduce((n, p) => n + p.amount, 0);
    expect(commission(rep)).toBe(r.commission);
    expect(commission(own)).toBe(0);
    expect(job(rep).log).toEqual(job(own).log);
    // What reaches the actor after: his breakdowns in the represented life only; the calls no agent brings, the same.
    for (const s of [rep, own]) tended(s, s.now + 20 * 7 * MS_DAY);
    expect(rep.player.pro!.opportunities.filter((x) => x.via === 'agent').length).toBeGreaterThan(0);
    expect(own.player.pro!.opportunities.filter((x) => x.via === 'agent')).toEqual([]);
    const [r4, o4] = heldByBoth(openOnly(rep), openOnly(own));
    expect(r4.length).toBeGreaterThan(0);
    expect(r4).toEqual(o4);
  }, 180_000);

  it('5 and 6. PLAYER JOURNEY: a job judged Strong can refer her and one judged Working can’t; its credit reaches the résumé and his office’s reading, and its part never comes round again, where the other parts come round as they would have', () => {
    const { sim, o } = offeredPart('b20-skill-0', 'route-nine');
    const declined = twin(sim);
    declined.must({ kind: 'pro.decline_offer', payload: { opportunityId: o.id } });
    const id = sim.must<{ engagementId: string }>({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } }).engagementId;
    // The abilities and techniques the twins work at, set at the booking: the top, and three quarters of it.
    const strong = twin(sim);
    const working = twin(sim);
    const richer = twin(sim);
    setSkill(working, 75);
    fund(richer, 10_000_00);
    for (const s of [strong, working, richer]) played(s, eng(s, id).days.at(-1)!.to + MS_DAY);
    const band = (s: Simulation) => s.player.pro!.credits.find((c) => c.engagementId === id)!.band;
    expect(band(strong)).toBe('strong');
    expect(band(working)).toBe('working');
    expect(band(richer)).toBe('strong');
    const ask = (s: Simulation) => {
      s.must({ kind: 'pro.agent_notice', payload: {} });
      s.must({ kind: 'pro.update_resume', payload: {} });
      s.must({ kind: 'pro.agent_check', payload: {} });
      return s.execute({ kind: 'pro.ask_referral', payload: { engagementId: id } });
    };
    expect(ask(strong).ok).toBe(true);
    expect(relationOf(strong.player, AGENT.id)).toMatchObject({ stage: 'introduced', via: { route: 'referral', by: 'Brisbane Hall Casting' } });
    expect(ask(working).error).toBe('A referral needs work judged Strong or better in the game, and your work as Jess was Working.');
    expect(relationOf(working.player, AGENT.id)!.via).toBeUndefined();
    expect(ask(richer).ok).toBe(true);
    expect(relationOf(richer.player, AGENT.id)!.referrals).toEqual(relationOf(strong.player, AGENT.id)!.referrals);

    // The credit, on the résumé made before it, behind until it's updated (`ask` brought it up to date above).
    const fresh = twin(sim);
    played(fresh, eng(fresh, id).days.at(-1)!.to + MS_DAY);
    expect(resumeBehind(fresh.player, fresh.now)).toContain(`Jess in Static On Route 9 (${new Date(eng(fresh, id).days[0]!.from).getUTCFullYear()})`);
    expect(currentResume(strong)).toContain('Jess, Static On Route 9, Dead Air Films, 2026 (not yet released)');
    // His office reads it: a professional credit raises training and experience, and it's something new to consider.
    const factor = (s: Simulation, f: string) => interestOf(s, s.player, AGENT, s.now).factors.find((x) => x.id === f)!.level;
    played(declined, strong.now);
    expect(factor(strong, 'training')).toBe('beyond');
    expect(factor(declined, 'training')).toBe('at');
    expect(caseKeys(strong.player, undefined)).toContain(`credit:${strong.player.pro!.credits.find((c) => c.engagementId === id)!.id}`);
    // The part never comes round again after the credit; declined, it does; every other part, the same weeks in both.
    for (const s of [fresh, declined]) tended(s, o.postedAt + 60 * 7 * MS_DAY);
    // Read from `lastPosted`, which the record keeps past its bound (from 2026-10-24: the slate's postings trim the first
    // posting from both records within the sixty weeks), and the others over the weeks both records hold.
    expect(fresh.player.pro!.lastPosted!['route-nine']!.id).toBe(o.id);
    expect(declined.player.pro!.lastPosted!['route-nine']!.id).not.toBe(o.id);
    const [f6, d6] = heldByBoth(othersPosted(fresh, 'route-nine'), othersPosted(declined, 'route-nine'));
    expect(f6.length).toBeGreaterThan(0);
    expect(f6).toEqual(d6);
  }, 240_000);

  it('7. PLAYER JOURNEY: an F-1 graduate on OPT can accept the part, and one without it can’t, said; the roles posted, the self-tape and casting’s word are the same', () => {
    // TEST SETUP: born in London, an F-1; the F-1's end brought forward with the degree (`graduate` brings Commencement to
    // 3 September 2026), as tests/defects-g24-1.test.ts brings it; the twins split at the degree, one applying for OPT.
    const base = baseLife('b20-skill-0', { homeRegionId: 'uk-eng-london' });
    expect(f1Of(base.player)).toBeDefined();
    f1Of(base.player)!.expiresAt = at(2026, 9, 3, 10) + STARTING.graceDays * MS_DAY;
    fund(base, 5_000_00);
    const onOpt = twin(base);
    const without = twin(base);
    const asked = onOpt.must<{ readyAt: number }>({ kind: 'documents.apply_opt', payload: { premium: true } });
    for (const s of [onOpt, without]) tended(s, asked.readyAt + 3_600_000);
    expect(documentsOf(onOpt.player).find((d) => d.name.includes('OPT'))!.status).toBe('valid');
    expect(documentsOf(without.player).find((d) => d.name.includes('OPT'))).toBeUndefined();
    expect(othersPosted(onOpt, '')).toEqual(othersPosted(without, ''));
    let found: string | undefined;
    for (let week = 0; week < 30 && !found; week += 1) {
      const o = onOpt.player.pro!.opportunities.find((x) => x.status === 'open' && onOpt.now < x.submitBy && ['ultra-low-budget', 'non-union-short', 'student-film'].includes(projectOf(x).kind));
      if (!o) { for (const s of [onOpt, without]) played(s, s.now + 7 * MS_DAY); continue; }
      for (const s of [onOpt, without]) { submitted(s, opp(s, o.id)); prepareAll(s, { opportunityId: o.id }); if (roundToCome(opp(s, o.id))!.form === 'self-tape') tape(s, opp(s, o.id)); toCasting(s, opp(s, o.id)); }
      expect(round0(without, o.id).overall).toBe(round0(onOpt, o.id).overall);
      expect(opp(without, o.id).status).toBe(opp(onOpt, o.id).status);
      if (opp(onOpt, o.id).status === 'offered') found = o.id;
    }
    expect(found).toBeDefined();
    expect(acceptRefusal(onOpt, onOpt.player, opp(onOpt, found!))).toBeUndefined();
    onOpt.must({ kind: 'pro.accept_offer', payload: { opportunityId: found } });
    const refused = without.execute({ kind: 'pro.accept_offer', payload: { opportunityId: found } });
    expect(refused.ok).toBe(false);
    expect(refused.error).toMatch(/^There’s no permission to work in the US among your papers\. .+ That rules out work on \w+ \d+, 20\d\d\.$/);
    expect(opp(without, found!).status).toBe('offered');
    expect(eng(onOpt, opp(onOpt, found!).engagementId!).eligibility).toMatchObject({ authorized: true, basis: 'opt' });
  }, 240_000);

  it('8. PLAYER JOURNEY: a screen credit’s release comes on the clock, said, and its footage goes on a reel then and not before', () => {
    const { sim, o } = offeredPart('b20-skill-0', 'route-nine');
    const id = sim.must<{ engagementId: string }>({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } }).engagementId;
    played(sim, eng(sim, id).days.at(-1)!.to + MS_DAY);
    const credit = sim.player.pro!.credits.find((c) => c.engagementId === id)!;
    expect(credit.status).toBe('shot');
    const footage = `footage:${credit.id}`;
    const released = sim.universe.scheduled.find((i) => i.kind === 'pro.release' && i.status === 'pending' && i.payload.creditId === credit.id)!;
    expect(released).toBeDefined();
    // Before it's out: no footage to cut, and the reel's refusal says the piece isn't recorded work.
    tended(sim, released.at - MS_DAY);
    expect(sim.execute({ kind: 'pro.cut_reel', payload: { pieces: [footage] } }).ok).toBe(false);
    tended(sim, released.at + 2 * 3_600_000);
    expect(credit).toMatchObject({ status: 'released', releasedAt: released.at });
    expect(sim.universe.notifications.filter((n) => n.title === 'Static On Route 9 Is Released')).toHaveLength(1);
    // Out, it's cut into a reel, which then holds the work at its band, for his office and screen casting to read.
    const p = zonedParts(sim.now, zone);
    played(sim, at(p.year, p.month, p.day + (p.hour >= 10 ? 1 : 0), 10));
    sim.must({ kind: 'pro.cut_reel', payload: { pieces: [footage] } });
    const cut = [...sim.player.pro!.materials].filter((m) => m.kind === 'reel').sort((a, b) => b.made - a.made)[0]!;
    expect(cut.pieces).toEqual([expect.objectContaining({ ref: footage, from: 'footage', band: credit.band })]);
    expect(interestOf(sim, sim.player, AGENT, sim.now).factors.find((f) => f.id === 'work')!.words).toContain('your reel');
  }, 240_000);
});

/** The current résumé's lines. */
function currentResume(sim: Simulation): string[] {
  return [...sim.player.pro!.materials].filter((m) => m.kind === 'resume').sort((a, b) => b.made - a.made)[0]!.contains;
}

