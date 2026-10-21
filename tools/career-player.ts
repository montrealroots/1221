/**
 * SLATE — the players the professional career's playthroughs play (from 2026-10-21, brief 19's V1, A1, L1 and V16;
 * docs/verification/career-2026-10-20/playthroughs/). Every part of the career was tested apart, each with what it
 * couldn't reach put in by hand; these play the parts together the way a player meets them, through public commands
 * and the clock only.
 *
 * - **The hours** are `tools/policy.ts`'s attentive player's: what the Look After Yourself menu puts first and urgent,
 *   cover kept at noon, the evening's coursework at eight in New Haven, a free hour on the School's work, and to bed at
 *   the hour the Sleep dialog suggests. Out of school a free hour from ten is spent on the craft, as the Player
 *   Profile's What To Work On suggests (`practiceHour`): an actor between jobs keeps training.
 * - **The clock** is moved as the top bar moves it (`go`): every commitment on the way stops it and Go is pressed
 *   (`answerStop`, `world/clock.ts`), as tests/pro-work.test.ts's `played` does, unless the player's `stop` answers it
 *   another way (Ask To Move at a meeting). Nothing a command or the clock would set is set by hand.
 * - **The career** is what an actor does with it, in a free waking hour from nine to ten at night (`graduatingActor`,
 *   `unsignedActor`): the showcase's scenes, the faculty's two; headshots and a résumé once the School has posted
 *   recorded work, and the reel cut from it then, or only once the School's follow-up has come (`reel`); an approach
 *   through the follow-up, its check and its send; what his office asks for, made and sent; the agreement accepted, or
 *   declined (`agreement`); Join SAG-AFTRA once a first SAG-AFTRA principal job makes it possible (`joinSag`); the sides
 *   prepared until they're ready (a practice brief's complete marks) and a self-tape taped then, or with less than
 *   eight hours left; an audition in person said to clash moved, where casting can move it; an offer accepted from What
 *   Needs You, or declined there where it can't be taken; the part prepared, unless the player leaves it (`prepare`);
 *   the résumé brought up to date when What's Missing says it's behind (`resume`). The unsigned actor submits to every
 *   open call that will take them.
 *
 * Each step a player takes, each stop and each notice or question raised is kept in the order it happened
 * (`Transcript`), for the record.
 */
import type { Simulation } from '../src/engine/core/simulation';
import type { ScheduledItem } from '../src/engine/core/scheduler';
import { MS_HOUR, formatDateTime, zonedParts } from '../src/engine/core/time';
import { answerStop, type Answer } from '../src/engine/world/clock';
import { suggestedSleep, occupiedAt } from '../src/engine/systems/life';
import { schoolEnded } from '../src/engine/systems/school';
import { AGENTS } from '../src/engine/content/agents';
import { BRIEF } from '../src/engine/systems/briefs';
import { showcaseOptions } from '../src/engine/systems/proshowcase';
import { checkRefusal, offeredAgreement, relationOf, sendRefusal, supplyRefusal } from '../src/engine/systems/proagent';
import { currentOf, headshotRefusal, materialsCheck, reelRefusal, reelSources, resumeRefusal, type PartPrep } from '../src/engine/systems/pro';
import { AUDITION_KIND, WORK, acceptRefusal, clashesAt, moveRefusal as moveRoundRefusal, prepareRefusal, projectOf, roundToCome, submitRefusal, tapeRefusal, tripMinutes } from '../src/engine/systems/projobs';
import { joinSagRefusal } from '../src/engine/systems/propay';
import { evening, freeHour, keepCovered, lookAfter, practiceHour } from './policy';

/** What the player met, in order: each notice as it came, each question raised, each stop and each step they took. */
export interface Transcript { seen: Set<string>; lines: string[] }

/** A transcript from now: the notices and questions already in the save are the past, not read again. */
export function transcriptFrom(sim: Simulation): Transcript {
  return { seen: new Set([...sim.universe.notifications.map((n) => `${n.id}@${n.at}`), ...Object.keys(sim.universe.decisions)]), lines: [] };
}

/** The notices and the questions in What Needs You the player hasn't seen yet, added in the order the game raised them. */
export function readNotices(sim: Simulation, t: Transcript | undefined): void {
  if (!t) return;
  for (const n of sim.universe.notifications) {
    // A notice said again word for word while the last is unread is brought up to now (`notify`): read again then.
    const key = `${n.id}@${n.at}`;
    if (t.seen.has(key)) continue;
    t.seen.add(key);
    t.lines.push(`${formatDateTime(n.at, sim.zone)} | NOTICE | ${n.title} | ${n.body}`);
  }
  for (const d of Object.values(sim.universe.decisions)) {
    if (t.seen.has(d.id)) continue;
    t.seen.add(d.id);
    t.lines.push(`${formatDateTime(d.createdAt, sim.zone)} | WHAT NEEDS YOU | ${d.title} | ${d.detail} | ${d.actions.map((a) => a.label).join(', ')}`);
  }
}

/**
 * A notice's title by its shape, whose office it names read as his: from 2026-10-21 the built-app walk's titles name the
 * agent and his agency ("A Meeting Is Set At Halberd Talent"), where they had said "his office". The transcript keeps
 * the words the player read; the tests compare shapes, so they hold whichever the build says.
 */
export function titleShape(title: string, agent: { name: string; agency: string }): string {
  const office = new RegExp(`${agent.name}[’']s Office`, 'g');
  return title
    .replace(office, 'His Office')
    .replace(new RegExp(`^${agent.name} Offered`), 'He Offered')
    .replace(new RegExp(`^(A Meeting Is Set|You Missed The Meeting) At ${agent.agency}$`), '$1')
    .replace(new RegExp(`^Your Agreement With ${agent.name} Ended$`), 'Your Agreement Ended')
    .replace(/^No Answer From His Office$/, 'No Answer');
}

/** The career business in a free waking hour: true when it took the hour, or any of it. */
export type CareerStep = (sim: Simulation, player: Player) => boolean;

/** A player: their career business, their answer at a stop where it isn't Go, and what they met. */
export interface Player {
  career?: CareerStep;
  stop?: (sim: Simulation, item: ScheduledItem) => Answer;
  transcript?: Transcript;
  /** Called at the start of each hour played, before anything moves: a test's own look at the save, never a change to it. */
  beforeHour?: (sim: Simulation) => void;
}

const said = (sim: Simulation, t: Transcript | undefined, line: string) => t?.lines.push(`${formatDateTime(sim.now, sim.zone)} | ${line}`);

/** The clock moved to `to` as the top bar moves it: stopped at each commitment that wants the player, and answered. */
export function go(sim: Simulation, to: number, player: Player = {}): void {
  let r = sim.advanceTo(to, { stopOnPlayerRequired: true });
  for (let n = 0; r.interruptedBy && n < 50; n += 1) {
    const item = r.interruptedBy;
    readNotices(sim, player.transcript);
    const answer = player.stop?.(sim, item) ?? 'go';
    said(sim, player.transcript, `STOP | ${item.label} | ${answer === 'go' ? 'Go' : answer === 'stand' ? 'Stand Here' : answer.label}`);
    const done = answerStop(sim, { item, wanted: to, sentFrom: r.sentFrom }, answer);
    if (done.refused) said(sim, player.transcript, `REFUSED | ${done.refused}`);
    if (!done.result) return;
    r = done.result;
  }
}

/** A command the player sends, said in the transcript with what came of it. */
export function press(sim: Simulation, t: Transcript | undefined, what: string, kind: string, payload: Record<string, unknown> = {}): boolean {
  const before = sim.now;
  const r = sim.execute({ kind, payload });
  t?.lines.push(`${formatDateTime(before, sim.zone)} | PRESS | ${what} | ${r.ok ? 'done' : `refused: ${r.error}`}`);
  return r.ok;
}

/**
 * One hour of the attentive player (`tools/policy.ts`'s `attentiveHour`, its public commands), the hour's move made by
 * the top bar's rule, and the career's business tried in a free waking hour from nine to ten at night.
 */
export function hour(sim: Simulation, player: Player = {}): void {
  if (sim.universe.meta.endedAt !== undefined) throw new Error(`${sim.player.displayName}’s life ended on ${formatDateTime(sim.universe.meta.endedAt, sim.zone)}.`);
  const p = zonedParts(sim.now, sim.zone);
  const weekend = p.weekday === 0 || p.weekday === 6;
  const awake = (sim.player.awakeSince ?? 0) <= sim.now;
  lookAfter(sim);
  if (p.hour === 12) keepCovered(sim);
  if (p.hour === 20 && sim.player.currentLocationId === 'us-ct-newhaven') evening(sim);
  if (p.hour >= (weekend ? 10 : 15) && p.hour < 22 && freeHour(sim)) return;
  if (player.career && awake && p.hour >= 9 && p.hour < 22 && !occupiedAt(sim, sim.now) && player.career(sim, player)) return;
  const out = sim.player.school !== undefined && schoolEnded(sim.player.school.standing);
  if (out && awake && p.hour >= 10 && p.hour < 22 && practiceHour(sim)) return;
  if ((p.hour >= 23 || p.hour < 5) && awake && sim.execute({ kind: 'life.sleep', payload: { hours: suggestedSleep(sim).hours } }).ok) return;
  go(sim, sim.now + MS_HOUR, player);
}

/** Played hour by hour to `until`, or until `stop` says the moment has come; the notices read as they come. */
export function playTo(sim: Simulation, until: number, player: Player = {}, stop?: (sim: Simulation) => boolean): void {
  while (sim.now < until && !stop?.(sim)) {
    player.beforeHour?.(sim);
    hour(sim, player);
    readNotices(sim, player.transcript);
  }
}

/** The sides or the part, ready: each part at a practice brief's complete mark, rehearsal at its most (`BRIEF.complete`). */
export const ready = (prep: PartPrep | undefined): boolean => !!prep && prep.interpretation >= BRIEF.complete.interpretation && prep.memorization >= BRIEF.complete.memorization && prep.rehearsal >= BRIEF.complete.mostRehearsal;
const STEPS = [['read', 'interpretation'], ['lines', 'memorization'], ['rehearse', 'rehearsal']] as const;
const short = (prep: PartPrep | undefined, part: keyof PartPrep) => (prep?.[part] ?? 0) < (part === 'rehearsal' ? BRIEF.complete.mostRehearsal : BRIEF.complete[part]);

/** How an actor goes about the work: what they prepare, when they update the résumé. */
export interface Ways {
  /** The sides before an audition, and the part once booked: prepared to ready, or left. */
  sides?: boolean;
  part?: boolean;
  /** A self-tape taped once the sides are ready; or left for the player to tape at a moment of their own. */
  tape?: boolean;
  /** The résumé brought up to date whenever What's Missing says it's behind, or only when it's asked for. */
  resume?: 'when-behind' | 'when-asked';
}

/** The work every actor does on their own: the sides, the tapes, the offers, the part, the résumé. True when it took time. */
function ownWork(sim: Simulation, t: Transcript | undefined, ways: Ways): boolean {
  const person = sim.player;
  const pro = person.pro!;
  const before = sim.now;
  for (const o of pro.opportunities) {
    const r = roundToCome(o);
    if (!r || (o.status !== 'audition' && o.status !== 'callback')) continue;
    // An audition in person said to clash with the calendar is moved, as its notice says, where casting can move it.
    if (r.form === 'in-person' && !moveRoundRefusal(sim, person, o)) {
      const trip = tripMinutes(person.currentLocationId, projectOf(o).place.cityId);
      const own = sim.universe.scheduled.find((i) => i.status === 'pending' && i.kind === AUDITION_KIND && i.payload.opportunityId === o.id);
      if (clashesAt(sim, person, r.at - trip * 60_000, WORK.auditionMinutes + 2 * trip, own?.id).length) press(sim, t, `Ask For Another Time for ${o.projectId}`, 'pro.move_audition', { opportunityId: o.id });
    }
    if (ways.sides !== false && !ready(o.prep) && r.at - sim.now >= 8 * MS_HOUR) {
      for (const [step, part] of STEPS) {
        if (short(o.prep, part) && !prepareRefusal(sim, person, { opportunity: o }, step)) {
          press(sim, t, `Prepare the sides (${step}) for ${o.projectId}`, 'pro.prepare', { opportunityId: o.id, step });
          if (sim.now > before) return true;
        }
      }
    }
    if (ways.tape !== false && r.form === 'self-tape' && !tapeRefusal(sim, person, o)) { press(sim, t, `Tape It for ${o.projectId}`, 'pro.tape_audition', { opportunityId: o.id }); return sim.now > before; }
  }
  for (const d of Object.values(sim.universe.decisions)) {
    if (d.resolvedAt !== undefined || d.refType !== 'pro.offer') continue;
    const o = pro.opportunities.find((x) => x.id === d.refId);
    if (!o || o.status !== 'offered') continue;
    const no = acceptRefusal(sim, person, o);
    press(sim, t, `${no ? 'Decline' : 'Accept'} The Offer for ${o.projectId}${no ? ` (${no})` : ''}`, 'world.take_decision_action', { decisionId: d.id, actionIndex: no ? 1 : 0 });
  }
  for (const e of ways.part === false ? [] : pro.engagements) {
    if (e.status !== 'booked' && e.status !== 'working') continue;
    for (const [step, part] of STEPS) {
      if (short(e.prep, part) && !prepareRefusal(sim, person, { engagement: e }, step)) {
        press(sim, t, `Prepare the part (${step}) for ${e.projectId}`, 'pro.prepare', { engagementId: e.id, step });
        if (sim.now > before) return true;
      }
    }
  }
  if (ways.resume !== 'when-asked' && currentOf(pro, 'resume') && materialsCheck(person, 'screen', sim.now).some((x) => x.kind === 'resume' && x.problem === 'behind') && !resumeRefusal(sim, person)) {
    press(sim, t, 'Update Your Résumé', 'pro.update_resume');
    return sim.now > before;
  }
  return false;
}

/** How a graduating actor goes about the career. */
export interface Graduating extends Ways {
  /** The reel cut as soon as there's recorded work, before the showcase; or only once the School's follow-up has come. */
  reel?: 'when-posted' | 'after-follow-up';
  /** The agreement, offered: accepted or declined. */
  agreement?: 'accept' | 'decline';
  /** Join SAG-AFTRA as soon as a first SAG-AFTRA principal job makes it possible. */
  joinSag?: boolean;
}

/**
 * A graduating actor's career business (V1): the showcase's scenes, the portfolio once the School has posted recorded
 * work to cut a reel from, the approach the School's follow-up opens, what his office asks for, the agreement, SAG-AFTRA,
 * and their own work.
 */
export function graduatingActor(how: Graduating = {}): CareerStep {
  return (sim, player) => {
    const t = player.transcript;
    const person = sim.player;
    const pro = person.pro!;
    const before = sim.now;
    const sc = pro.showcase;
    if (sc?.options && !sc.scenes.length && sc.eligible !== false) press(sim, t, 'Choose These Scenes (the faculty’s two)', 'school.choose_showcase', { options: showcaseOptions(sim, person).filter((o) => o.faculty).map((o) => o.id) });
    const usable = reelSources(person, sim.now).filter((x) => x.usable);
    if (usable.length) {
      if (!currentOf(pro, 'headshot')) { if (!headshotRefusal(sim, person)) press(sim, t, 'Book A Headshot Session', 'pro.headshots'); return sim.now > before; }
      if (!currentOf(pro, 'resume')) { if (!resumeRefusal(sim, person)) press(sim, t, 'Make Your Résumé', 'pro.update_resume'); return sim.now > before; }
      if (!currentOf(pro, 'reel') && (how.reel !== 'after-follow-up' || sc?.followUp)) {
        const pieces = usable.slice(0, 4).map((x) => x.ref);
        if (!reelRefusal(sim, person, pieces)) press(sim, t, `Cut A Reel (${pieces.length === 1 ? 'one piece' : `${pieces.length} pieces`})`, 'pro.cut_reel', { pieces });
        return sim.now > before;
      }
    }
    const agent = AGENTS[0]!;
    const rel = relationOf(person, agent.id);
    if (rel?.via && rel.stage === 'introduced') {
      if (!checkRefusal(sim, person, agent)) press(sim, t, 'Check Your Materials', 'pro.agent_check');
      if (!sendRefusal(sim, person, agent)) press(sim, t, 'Send Your Materials', 'pro.send_materials');
    }
    if (rel?.stage === 'requested' && rel.request) {
      // What his office asked for, made on the Portfolio tab, then sent.
      if (rel.request.what.includes('resume') && materialsCheck(person, 'representation', sim.now).some((x) => x.kind === 'resume') && !resumeRefusal(sim, person)) { press(sim, t, 'Update Your Résumé (asked for)', 'pro.update_resume'); return sim.now > before; }
      if (rel.request.what.includes('headshot') && (currentOf(pro, 'headshot')?.made ?? 0) < rel.request.at) { if (!headshotRefusal(sim, person)) press(sim, t, 'Book A Headshot Session (asked for)', 'pro.headshots'); return sim.now > before; }
      if (!supplyRefusal(sim, person, agent)) press(sim, t, 'Send What His Office Asked For', 'pro.supply_material');
    }
    if (offeredAgreement(person, agent)) press(sim, t, how.agreement === 'decline' ? 'Decline The Agreement' : 'Accept The Agreement', how.agreement === 'decline' ? 'pro.decline_agreement' : 'pro.accept_agreement');
    if (how.joinSag && pro.sag?.eligibleSince !== undefined && pro.sag.memberSince === undefined && !joinSagRefusal(sim, person)) press(sim, t, 'Join SAG-AFTRA', 'pro.join_sag');
    return ownWork(sim, t, how) || sim.now > before;
  };
}

/** An unsigned actor's career business (V16): the portfolio, a submission to every open call that takes them, their own work. */
export function unsignedActor(ways: Ways = {}): CareerStep {
  return (sim, player) => {
    const t = player.transcript;
    const person = sim.player;
    const pro = person.pro!;
    const before = sim.now;
    if (!currentOf(pro, 'headshot')) { if (!headshotRefusal(sim, person)) press(sim, t, 'Book A Headshot Session', 'pro.headshots'); return sim.now > before; }
    if (!currentOf(pro, 'resume')) { if (!resumeRefusal(sim, person)) press(sim, t, 'Make Your Résumé', 'pro.update_resume'); return sim.now > before; }
    for (const o of pro.opportunities) if (o.status === 'open' && !submitRefusal(sim, person, o)) press(sim, t, `Submit Yourself for ${o.projectId}`, 'pro.submit', { opportunityId: o.id });
    return ownWork(sim, t, ways) || sim.now > before;
  };
}
