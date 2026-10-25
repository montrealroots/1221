/**
 * SLATE — offers and auditions, the actor's side of them (from 2026-10-25, the owner's brief 27: Part 9's "Selecting an
 * approach ... Responding to direction ... Alternate takes", Part 10's "negotiation through representation", Area B's
 * "Recasting where justified", and the supplement's loops 10, 13, 14 and 18). The work loop (`systems/projobs.ts`) lends
 * this module its steps (`OfferHooks`) and calls it at the moments it decides; every rule here is the game's ASSUMPTION,
 * said where it's defined, since nothing in the research register publishes any of them.
 *
 * **Negotiation through representation** (loop 18; `TERMS`). Until this day the agent could ask once for a fifth more on
 * the pay, and the answer was a raise or none. Now the actor chooses what the agent asks about, once an offer: the pay; on
 * a recurring part, one more guaranteed episode; and on SAG-AFTRA work, the promotional film paid at the actor's own day,
 * where the contract pays it less (`promoTerm`, `systems/workflow.ts`): unpaid on work of $25,000 or more, which the
 * agreement leaves to bargain (N13 §18.B(5)), and a day performer's minimum below it, which the agreement sets as the
 * least it pays (§18.B(3)), so more is the parties' to agree. No part the game offers today is paid $25,000 or more, so
 * in play it's the second. The production answers the next afternoon as before, and
 * the answer is one the loop names: raised, kept, a trade-off (more pay for one guaranteed episode fewer; one more episode
 * for no raise on the option; the promotional film at the agreement's minimum rather than the actor's own day), or the
 * offer withdrawn, a small chance and more for a bigger ask. Each answer changes the offer's terms (`episodes`, `promo`,
 * `optionRaise`, `amount`), which `datesOf`, `promisedPay`, `contractFor`, `renewFromOption` and `promoSession` read.
 * Without an agent nobody negotiates: Part 10 says "through representation", and `askMoreRefusal` says so.
 *
 * **A self-tape's takes** (loop 13; `TAKES`). Record A Take tapes one, judged on its own draw at the moment it starts,
 * an hour and the energy of a desk hour; more within the due date, at most `TAKES.perDay` a day and the School's eight
 * kept (`BRIEF.takesKept`); and Send This Take sends the one the actor picks, judged as it was recorded (`replay`), which
 * is what casting reads. Only the take sent goes on the work record, so taping more isn't free practice.
 *
 * **How you play it, and casting's direction** (Part 9, loop 14; `NOTE`). The actor chooses a way of playing the sides, as
 * a brief has one (`Playing`, `content/approaches.ts`), rehearsed by Rehearse It On Your Feet; every round reads it,
 * against the part's own register (`sceneOfPart`). At an audition or a callback in person, played some way, casting
 * gives a direction where the part asks for another way on one aspect, from what the part asks, never drawn: the clock
 * stops ten minutes in, and the actor follows it, playing that side unrehearsed and reaching for adaptability, or keeps
 * their choice, playing against what casting asked. The rest of the read is judged with the answer, and casting's cut
 * reads that read.
 *
 * **Conditional offers, changed requirements, recasting** (loop 10, Area B; `CONDITIONAL`, `REWRITE`, `RECAST`). A
 * casting office that cast the actor before, the work Strong, may offer them a lead on one condition, the screen test
 * or chemistry read still to come: accepted, the dates are held and nothing is booked or promised; the round decides,
 * firm (booked through the work loop's own acceptance) or fallen away. A part's requirement may change at casting's cut
 * (the playing ages, or a technique it now needs at a level), and the actor still in the running is checked again. A part
 * the actor lost or let go may be recast weeks before its first day, the actor it cast having left it, and posted again.
 *
 * **Withdrawing and rescheduling** (loop 14; `NOTICE`, `RESCHEDULE`). Withdraw From The Part leaves a part in progress.
 * With a day's notice or more before a round in person, casting holds nothing against it; with less, or by not turning
 * up at all (asleep, or somewhere else, but not ill), the casting office remembers (`noShows`), and for two years its
 * cuts are half as likely to go the actor's way and it offers them nothing without an audition. A chemistry read or a
 * screen test is set around other people's days, so asking to move it goes to the production, which answers the next
 * afternoon and grants it at a chance, more where the actor has a clash on the calendar to give as the reason.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { ScheduledItem } from '../core/scheduler';
import type { Person } from '../domain/model';
import { MS_DAY, MS_HOUR, addDays, ageOn, dateKey, formatDate, formatTime, formatWeekdayDate, instantFromZoned, zonedParts, type Instant } from '../core/time';
import { formatMoney, type Money } from '../core/money';
import { spokenList } from '../core/text';
import { RATES, minimumOn, projectById, type ProjectTemplate } from '../content/careerwork';
import { AXES, APPROACH_EFFECT, MISFIT } from '../content/approaches';
import type { Axis, AxisValue } from '../content/material';
import { GENRE_REGISTER } from '../content/genre-register';
import { EVALUATION, TASK_PROFILES, type Dimension, type TaskProfile } from '../content/tasks';
import { TECHNIQUE_LABEL, type AbilityId } from '../content/abilities';
import type { Skill } from '../content/school';
import { agentById } from '../content/agents';
import { PROMO } from '../content/workflows';
import { seriesById } from '../content/series';
import { activeAgreement, ensurePro, finished, type AuditionRound, type Engagement, type Opportunity, type ProEventKind, type ProId } from './pro';
import { BAND_LABEL, type Band } from './coursework';
import { bandOfQuality, chiefLimit, evaluate, replay, type EvalContext, type Evaluation } from './evaluation';
import { BRIEF } from './briefs';
import { choose, materialContext, rehearseChoice, sidesOf, type Playing } from './material';
import { axisSuitability, type Scene } from './interpretation';
import { requirementOfRole, SELF_TAPE } from './engagement';
import { ENGAGEMENT } from '../content/engagement';
import { offSick } from './school';
import { defineStop } from '../world/clock';
import { promoFor } from './workflow';
import { overtimeOf, paysOvertime } from './contracts';
import {
  AUDITION_KIND, CASTING, NEGOTIATE, NEGOTIATE_KIND, OFFER_KIND, ROUND_WORDS, WORK, acceptRefusal, agrees, askedAmount, auditionContext, castingAs, clashesAt, counted,
  datesOf, fitOf, nextRound, overtimeHours, payTermsOf, postingTimes, projectOf, roundMinutes, roundToCome, tapeRefusal, tripMinutes,
  type Round, type WorkDay,
} from './projobs';
import { visibilityOf } from './awards';

const NY = 'America/New_York';
const MIN = 60_000;
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const r3 = (x: number) => Math.round(x * 1000) / 1000;
const dayAt = (t: Instant, hour: number): Instant => { const p = zonedParts(t, NY); return instantFromZoned({ year: p.year, month: p.month, day: p.day, hour, minute: 0 }, NY); };
const weekday = (t: Instant): number => zonedParts(t, NY).weekday;

// ---------------------------------------------------------------------------------------------------------------------
// The rules, every one an ASSUMPTION: the game's, since no source in the research register gives any of them
// ---------------------------------------------------------------------------------------------------------------------

/** A professional self-tape's takes: at most three recorded a day, and the School's eight kept for a round (`BRIEF.takesKept`). */
export const TAKES = { perDay: 3 } as const;

/**
 * Casting's direction in the room: given ten minutes into an audition or a callback in person, on the aspect the part's
 * register leans on most (a suitability gap of a tenth or more) where the actor's choice plays the other way or none.
 * Followed, the read reaches for adaptability as well, half a weight on responsiveness: taking a direction on the spot.
 */
export const NOTE = { afterMinutes: 10, least: 0.1 } as const;
const NOTE_INPUTS: Partial<Record<Dimension, readonly { ability: AbilityId; weight: number }[]>> = { responsiveness: [{ ability: 'adaptability', weight: 0.5 }] };

/**
 * Negotiation's further answers: the offer withdrawn at a quarter of the ask's share of the offer's worth, at most one in
 * ten (a fifth more pay, 5%; a recurring part's third guaranteed episode of two, 10%; a promotional film's day of ten, 2.5%);
 * and, where the production won't give what's asked and there's something to trade, a trade-off four times in ten.
 */
export const TERMS = { withdraw: { perShare: 0.25, most: 0.1 }, trade: 0.4 } as const;

/**
 * A conditional offer: a lead from a casting office that cast the actor before, the work Strong or better, comes as an
 * offer on the condition of its last round (the screen test, or the chemistry read where it has none) half the time it
 * reaches them; and the round goes their way at a chance by its band, higher than a cold final decision since the
 * production has already chosen them.
 */
export const CONDITIONAL = { chance: 0.5, met: { unready: 0.1, working: 0.45, strong: 0.75, exceptional: 0.9 } as Readonly<Record<Band, number>> } as const;

/** A part's requirement changed at casting's cut, one part in ten: its playing ages moved six to twelve years, or a technique it asks at 50. */
export const REWRITE = { chance: 0.1, shift: [6, 12] as const, level: 50 } as const;

/** A part recast: one in eight of those the actor lost or let go, if its first day is three weeks off or more; open five days. */
export const RECAST = { chance: 0.12, leadDays: 21, submitDays: 5 } as const;

/** A day's notice before a round in person makes a withdrawal one with notice; a casting office remembers less for two years, and its cuts halve. */
export const NOTICE = { hours: 24, rememberDays: 730, kept: 20, cut: 0.5 } as const;

/** Asking to move a chemistry read or a screen test: granted four times in ten, three for a test, three more with a clash to give; the answer the next afternoon at three; the same hour on one of the next three weekdays. */
export const RESCHEDULE = { chance: { chemistry: 0.4, test: 0.3 } as Readonly<Record<'chemistry' | 'test', number>>, clash: 0.3, answerHour: 15, days: 3 } as const;

export const NOTE_KIND = 'pro.note';
export const RESCHEDULE_KIND = 'pro.reschedule_answer';

/** What the work loop lends this module (`registerOffers`), its own steps, so what's done here is done the loop's way. */
export interface OfferHooks {
  tell: (sim: Simulation, person: Person, title: string, body: string, importance?: number) => void;
  note: (sim: Simulation, person: Person, o: Opportunity, e: { kind: ProEventKind; words: string; key: string }) => void;
  settle: (sim: Simulation, person: Person, o: Opportunity, status: Opportunity['status'], outcome: string) => void;
  setRound: (sim: Simulation, person: Person, o: Opportunity, which: Round) => AuditionRound;
  finishRound: (sim: Simulation, person: Person, o: Opportunity, r: AuditionRound, idx: number, e: Evaluation) => void;
  makeOffer: (sim: Simulation, person: Person, o: Opportunity) => void;
  holdGone: (o: Opportunity) => string;
}

const CAREER = '/workspace/career';
const lower = (x: string): string => x.charAt(0).toLowerCase() + x.slice(1);
const sideLabel = (side: string): string => APPROACH_EFFECT[side as AxisValue]?.label.toLowerCase() ?? side;

// ---------------------------------------------------------------------------------------------------------------------
// How you play it, and casting's direction (Part 9; loop 14)
// ---------------------------------------------------------------------------------------------------------------------

/**
 * The scene a part's sides are read as: the register of the genre it asks for most (`requirementOfRole`, `GENRE_REGISTER`),
 * as a class scene is read by its genre's (`sceneOfMaterial`). A part with no register leans no way.
 */
export function sceneOfPart(t: Pick<ProjectTemplate, 'id' | 'project' | 'genres'>): Scene {
  const top = [...requirementOfRole(t).needs].sort((a, b) => b.weight - a.weight || a.id.localeCompare(b.id))[0];
  const concerns = top ? GENRE_REGISTER[top.id]?.concerns : undefined;
  return top && concerns?.length ? { genre: top.id, concerns } : {};
}

/** The families' lean on a task's dimensions as factors, so a choice's lean multiplies onto it rather than replacing it (`leanedWeights`). */
function familyFactors(task: TaskProfile, families: readonly string[] = []): Partial<Record<Dimension, number>> {
  const leans = families.map((f) => EVALUATION.familyLean[f]).filter(Boolean);
  const out: Partial<Record<Dimension, number>> = {};
  for (const d of Object.keys(task.dims) as Dimension[]) out[d] = leans.length ? leans.reduce((s, l) => s + (l![d] ?? 1), 0) / leans.length : 1;
  return out;
}

const mergeInputs = (a: Partial<Record<Dimension, readonly { ability: AbilityId; weight: number }[]>>, b: Partial<Record<Dimension, readonly { ability: AbilityId; weight: number }[]>>) => {
  const out: Partial<Record<Dimension, { ability: AbilityId; weight: number }[]>> = {};
  for (const src of [a, b]) for (const [d, xs] of Object.entries(src) as [Dimension, readonly { ability: AbilityId; weight: number }[]][]) {
    const list = (out[d] ??= []);
    for (const x of xs) { const had = list.find((y) => y.ability === x.ability); if (had) had.weight += x.weight; else list.push({ ...x }); }
  }
  return out;
};

/**
 * A round's judgment with the way the sides are played (`auditionContext`'s last step): the choice's lean on the task,
 * the abilities each side draws on, its rehearsal against the part's own mark, and how well it suits the part's register;
 * casting's direction once answered, followed (its side played, reaching for adaptability) or kept against (the
 * dimensions the asked side leans on held to `MISFIT`). A round played with no choice and no direction is judged as it
 * always was, the context returned untouched.
 */
export function approachRead(o: Opportunity, r: AuditionRound, ctx: EvalContext): EvalContext {
  const playing = o.playing;
  const sides = sidesOf(playing);
  const note = r.note?.answer ? r.note : undefined;
  if (!sides.length && !note) return ctx;
  const read = materialContext(ctx.task, undefined, playing, undefined, sceneOfPart(projectOf(o)));
  const fam = familyFactors(ctx.task, ctx.families);
  const lean = Object.fromEntries((Object.keys(ctx.task.dims) as Dimension[]).map((d) => [d, (fam[d] ?? 1) * (read.lean[d] ?? 1)])) as Partial<Record<Dimension, number>>;
  const prep = { ...ctx.prep };
  const required = { ...ctx.required };
  if (sides.length) { prep.approach = playing!.prep; required.approach = read.required; }
  const fit = { ...read.fit };
  if (note?.answer === 'hold') {
    const asked = APPROACH_EFFECT[note.side as AxisValue];
    for (const [d, x] of Object.entries(asked.lean) as [Dimension, number][]) {
      if (x >= 1.1 && ctx.task.dims[d]) fit[d] = { f: Math.min(fit[d]?.f ?? 1, MISFIT), label: `${asked.label}: casting asked for it ${asked.label.toLowerCase()}, and you kept your choice` };
    }
  }
  return { ...ctx, prep, required, lean, inputs: mergeInputs(read.inputs, note?.answer === 'follow' ? NOTE_INPUTS : {}), extraPrep: read.prep, fit, grain: read.grain };
}

/** What a round would come to played a way, fully prepared, on a sufficient day, with no draw: what How You'll Play It shows beside each side. */
export function approachPreview(sim: Simulation, person: Person, o: Opportunity, sides: Omit<Playing, 'chosenAt' | 'prep'>): Evaluation {
  const r: AuditionRound = roundToCome(o) ?? { round: 'audition', form: projectOf(o).stages.audition, at: sim.now, status: 'set' };
  const idx = Math.max(0, (o.rounds ?? []).indexOf(r));
  // A copy played that way and prepared in full, so reading it never touches the save.
  const playing = sidesOf({ ...sides, chosenAt: 0, prep: 1 }).length ? { ...sides, chosenAt: sim.now, prep: 1 } : undefined;
  const copy: Opportunity = { ...o, prep: { interpretation: 1, memorization: 1, rehearsal: 1 }, ...(playing ? { playing } : {}) };
  if (!playing) delete copy.playing;
  const ctx = auditionContext(sim, person, copy, { ...r, ...(r.note ? { note: { ...r.note } } : {}) }, idx);
  return evaluate(sim, person, { ...ctx, prep: Object.fromEntries(Object.keys(ctx.prep).map((k) => [k, k === 'genre' ? ctx.prep[k]! : 1])), condition: { readiness: 100 }, key: `preview:${o.id}`, expected: true });
}

/** Why the way of playing the sides can't be chosen now, or nothing. */
export function chooseRefusal(o: Opportunity | undefined): string | undefined {
  if (!o) return 'There’s no such casting notice.';
  const r = roundToCome(o);
  if (!r || (o.status !== 'audition' && o.status !== 'callback')) return 'There are no sides yet: casting sends them with an audition.';
  if (r.note && !r.note.answer) return 'You’re in the room: answer casting’s direction first.';
  return undefined;
}

/** A way of playing chosen: the same one keeps its rehearsal, another keeps half (`choose`), none clears it. */
export function chooseApproach(sim: Simulation, o: Opportunity, sides: Omit<Playing, 'chosenAt' | 'prep'>): { prep: number } {
  const next = choose(o.playing, sides, sim.now);
  if (sidesOf(next).length) o.playing = next; else delete o.playing;
  return { prep: o.playing?.prep ?? 0 };
}

/** Rehearsal on your feet on the sides rehearses the way they're played too, as a brief's does (`rehearseChoice`). */
export function rehearseApproach(o: Opportunity, gain: number): void {
  rehearseChoice(o.playing, gain);
}

/** Whether the way of playing the sides has rehearsal left to do, so Rehearse It On Your Feet still has work. */
export const approachToRehearse = (o: Opportunity): boolean => sidesOf(o.playing).length > 0 && o.playing!.prep < 0.97;

/**
 * Casting's direction for a part played a way, from what the part asks, never drawn: the aspect whose two sides its
 * register sets furthest apart (`axisSuitability`, a gap of `NOTE.least` or more), where the actor plays the other side
 * or none. A part played every such way already has none: the read was what it asks.
 */
export function noteFor(t: Pick<ProjectTemplate, 'id' | 'project' | 'genres'>, playing: Playing | undefined): { axis: Axis; side: AxisValue } | undefined {
  const scene = sceneOfPart(t);
  if (!scene.concerns?.length) return undefined;
  let best: { axis: Axis; side: AxisValue; gap: number } | undefined;
  for (const axis of Object.keys(AXES) as Axis[]) {
    const [a, b] = axisSuitability(axis, undefined, scene);
    const gap = a.s - b.s;
    if (Math.abs(gap) < NOTE.least) continue;
    const side = gap > 0 ? a.side : b.side;
    if (playing?.[axis] === side) continue;
    if (!best || Math.abs(gap) > best.gap) best = { axis, side, gap: Math.abs(gap) };
  }
  return best ? { axis: best.axis, side: best.side } : undefined;
}

/**
 * At an audition or a callback in person played some way, casting's direction, where it has one (`noteFor`): kept on the
 * round, the clock stopped ten minutes in for the answer (`NOTE_KIND`, with its own choices at the stop), and said. The
 * round is judged at that stop, not now. Returns whether it gave one.
 */
export function giveNote(sim: Simulation, person: Person, o: Opportunity, r: AuditionRound, idx: number, hooks: OfferHooks): boolean {
  if (r.form !== 'in-person' || (r.round !== 'audition' && r.round !== 'callback') || r.note || !sidesOf(o.playing).length) return false;
  const t = projectOf(o);
  const n = noteFor(t, o.playing);
  if (!n) return false;
  r.note = { axis: n.axis, side: n.side, at: sim.now };
  const at = r.at + NOTE.afterMinutes * MIN;
  sim.schedule({
    at, kind: NOTE_KIND, label: `Casting’s Direction: ${t.role.part}`, category: 'career', priority: 40, requiresPlayer: true, durationMinutes: roundMinutes(r) - NOTE.afterMinutes,
    locationId: t.place.cityId, refType: 'pro.opportunity', refId: o.id, payload: { personId: person.id, opportunityId: o.id, round: idx },
  });
  const e = APPROACH_EFFECT[n.side];
  const yours = o.playing?.[n.axis];
  const words = `Partway through your ${ROUND_WORDS[r.round].noun} for ${t.role.part}, ${t.casting} asked you to play it ${e.label.toLowerCase()}: ${lower(e.words)}${yours ? ` You’d chosen to play it ${sideLabel(yours)}.` : ''}`;
  hooks.note(sim, person, o, { kind: r.round === 'audition' ? 'audition' : 'callback', key: `${r.round}:note`, words });
  if (person.id === sim.universe.playerId) {
    sim.requireDecision({
      urgency: 85, category: 'career', title: `Casting’s Direction For ${t.role.part}`, dueAt: at, route: CAREER, refType: 'pro.note', refId: o.id,
      detail: `${words} Follow The Direction plays the rest of it that way, unrehearsed, and asks you to adapt on the spot. Keep Your Choice plays it as you prepared it, against what casting asked. Go keeps your choice.`,
      actions: [
        { label: 'Follow The Direction', commandKind: 'pro.answer_note', payload: { opportunityId: o.id, follow: true } },
        { label: 'Keep Your Choice', commandKind: 'pro.answer_note', payload: { opportunityId: o.id, follow: false } },
      ],
    });
  }
  return true;
}

/** The round waiting on the actor's answer to casting's direction, if one is. */
export const noteWaiting = (o: Opportunity): AuditionRound | undefined => (o.rounds ?? []).find((r) => r.status === 'set' && r.note && !r.note.answer);

/** Why casting's direction can't be answered now, or nothing. */
export function noteRefusal(o: Opportunity | undefined): string | undefined {
  const r = o ? (o.rounds ?? []).find((x) => x.status === 'set' && x.note) : undefined;
  if (!o || !r) return 'Casting has no direction waiting for you.';
  if (r.note!.answer) return r.note!.answer === 'follow' ? 'You’ve answered: you’re following casting’s direction.' : 'You’ve answered: you’re keeping your choice.';
  return undefined;
}

/** Casting's direction answered: followed, the side taken into the way you play it (its rehearsal halved, `choose`), or kept against. */
export function answerNote(sim: Simulation, person: Person, o: Opportunity, follow: boolean, hooks: OfferHooks): { answer: 'follow' | 'hold' } {
  const r = noteWaiting(o)!;
  const note = r.note!;
  note.answer = follow ? 'follow' : 'hold';
  if (follow) chooseApproach(sim, o, { ...(o.playing?.pace ? { pace: o.playing.pace } : {}), ...(o.playing?.scale ? { scale: o.playing.scale } : {}), ...(o.playing?.structure ? { structure: o.playing.structure } : {}), [note.axis]: note.side });
  sim.resolveDecision('pro.note', o.id, 'career');
  const t = projectOf(o);
  hooks.note(sim, person, o, { kind: r.round === 'audition' ? 'audition' : 'callback', key: `${r.round}:note-answered`, words: follow ? `You played the rest of it ${sideLabel(note.side)}, as ${t.casting} asked.` : `You kept to your choice, against what ${t.casting} asked.` });
  return { answer: note.answer };
}

// ---------------------------------------------------------------------------------------------------------------------
// A self-tape's takes (loop 13)
// ---------------------------------------------------------------------------------------------------------------------

/** The takes of a round recorded on a day, in New York. */
const takesOn = (r: AuditionRound, at: Instant): number => (r.takes ?? []).filter((x) => dateKey(x.at, NY) === dateKey(at, NY)).length;

/** Why a take can't be recorded now, or nothing: the self-tape's own rules (`tapeRefusal`), then the day's takes and those kept. */
export function recordRefusal(sim: Simulation, person: Person, o: Opportunity | undefined): string | undefined {
  const no = tapeRefusal(sim, person, o);
  if (no) return no;
  const r = roundToCome(o!)!;
  if ((r.takes?.length ?? 0) >= BRIEF.takesKept) return `You’ve recorded ${counted(BRIEF.takesKept, 'take')}, as many as you can keep for one self-tape. Send one of them.`;
  if (takesOn(r, sim.now) >= TAKES.perDay) return `You’ve recorded ${counted(TAKES.perDay, 'take')} today, as many as a day allows. Record more tomorrow, or send one.`;
  return undefined;
}

/**
 * A take recorded: judged at the moment it starts, its own draw (the first take's key the round's, as Tape It's always
 * was), then the hour on the clock and a desk hour's energy, and kept with what it was judged from until one is sent.
 */
export function recordTake(sim: Simulation, person: Person, o: Opportunity): { take: number; band: Band; overall: number; evaluation: Evaluation } {
  const r = roundToCome(o)!;
  const idx = o.rounds!.indexOf(r);
  const takes = (r.takes ??= []);
  const ctx = auditionContext(sim, person, o, r, idx);
  const key = takes.length === 0 ? ctx.key : `${ctx.key}:take${takes.length + 1}`;
  const at = sim.now;
  const e = evaluate(sim, person, { ...ctx, key });
  sim.advanceTo(sim.now + SELF_TAPE.minutes * MIN);
  person.wellbeing.energy = clamp(person.wellbeing.energy - ENGAGEMENT.energy.desk, 0, 100);
  const held = chiefLimit(e);
  const band = bandOfQuality(e.overall);
  takes.push({ at, overall: e.overall, band, key, ...(sidesOf(o.playing).length ? { sides: sidesOf(o.playing) } : {}), ...(held ? { held } : {}), kept: { task: e.task, ruleset: e.ruleset, inputs: e.inputs } });
  return { take: takes.length - 1, band, overall: e.overall, evaluation: e };
}

/** Why a take can't be sent now, or nothing. */
export function sendRefusal(sim: Simulation, o: Opportunity | undefined, take: unknown): string | undefined {
  const r = o && roundToCome(o);
  if (!o || !r || r.form !== 'self-tape' || (o.status !== 'audition' && o.status !== 'callback')) return 'There’s no self-tape asked for.';
  if (sim.now >= r.at) return `It was due on ${formatDate(r.at, NY)} at ${formatTime(r.at, NY)}.`;
  if (!r.takes?.length) return 'You haven’t recorded a take yet: press Record A Take first.';
  if (typeof take !== 'number' || !r.takes[take]) return 'There’s no such take.';
  return undefined;
}

/**
 * The take picked, sent: judged again from what it was judged from when it was recorded (`replay`), so casting reads the
 * figure the take showed; then the round finished as Tape It finishes one (`finishRound`). What each take was judged from
 * is dropped once one is sent. A take recorded under other rules than today's is judged again on its own draw.
 */
export function sendTake(sim: Simulation, person: Person, o: Opportunity, take: number, hooks: OfferHooks): { band: Band; overall: number } {
  const r = roundToCome(o)!;
  const idx = o.rounds!.indexOf(r);
  const x = r.takes![take]!;
  const task = x.kept ? TASK_PROFILES[x.kept.task] : undefined;
  const e = (x.kept && task ? replay({ inputs: x.kept.inputs, task: x.kept.task, ...(x.kept.ruleset ? { ruleset: x.kept.ruleset } : {}) }, task) : undefined)
    ?? evaluate(sim, person, { ...auditionContext(sim, person, o, r, idx), key: x.key });
  r.sent = take;
  for (const y of r.takes!) delete y.kept;
  hooks.finishRound(sim, person, o, r, idx, e);
  const t = projectOf(o);
  if (r.takes!.length > 1) hooks.note(sim, person, o, { kind: r.round === 'audition' ? 'audition' : 'callback', key: `${r.round}:sent`, words: `You sent take ${take + 1} of the ${counted(r.takes!.length, 'take')} you recorded for ${t.role.part}.` });
  return { band: r.band!, overall: r.overall! };
}

/** A take in a line: "Take 2, Tuesday, March 3 at 2:00 PM: Strong, 71.4." */
export const takeWords = (x: NonNullable<AuditionRound['takes']>[number], i: number): string => `Take ${i + 1}, ${formatWeekdayDate(x.at, NY)} at ${formatTime(x.at, NY)}: ${BAND_LABEL[x.band]}, ${x.overall.toFixed(1)}.${x.held ? ` ${x.held.charAt(0).toUpperCase()}${x.held.slice(1)}.` : ''}`;

// ---------------------------------------------------------------------------------------------------------------------
// Negotiation through representation (loop 18; Part 10)
// ---------------------------------------------------------------------------------------------------------------------

export type TermItem = 'pay' | 'episodes' | 'promo';
export const termItem = (x: unknown): TermItem => (x === 'episodes' || x === 'promo' ? x : 'pay');

/** A recurring part's guaranteed episodes on an offer: its negotiated count, or the part's own. */
export const guaranteedOf = (o: { offer?: Pick<NonNullable<Opportunity['offer']>, 'episodes'> } | undefined, t: ProjectTemplate): number => (t.schedule.kind === 'episodes' ? o?.offer?.episodes ?? t.schedule.guaranteed : 0);

/** The offer's gross for its days, overtime with it where it's paid, as its contract would estimate it. */
export function offerEstimate(o: Opportunity): Money {
  const offer = o.offer;
  if (offer?.amount === undefined) return 0;
  const days = datesOf(o);
  const units = payTermsOf(o).units;
  const ot = offer.per === 'day' && paysOvertime(offer.rate) ? days.reduce((n, d) => n + overtimeOf(offer.amount!, overtimeHours(d)), 0) : 0;
  return offer.amount * units + ot;
}

/** The actor's own day on the offer: its day rate, or a fifth of its week. */
export const ownDay = (o: Opportunity): Money => (o.offer?.per === 'week' ? Math.round((o.offer.amount ?? 0) / 5) : o.offer?.amount ?? 0);

/** What an ask asks for, by its term: the pay asked for, the guaranteed episodes asked for, or the promotional film's pay. */
function askedFigure(o: Opportunity, item: TermItem): number {
  const t = projectOf(o);
  return item === 'pay' ? askedAmount(o.offer!.amount!) : item === 'episodes' ? guaranteedOf(o, t) + 1 : ownDay(o);
}

/** The days a recurring part's offer would book with this many guaranteed episodes. */
const daysWith = (o: Opportunity, episodes: number): WorkDay[] => datesOf({ projectId: o.projectId, postedAt: o.postedAt, offer: { ...o.offer!, episodes } });

/**
 * Why the agent can't ask about a term other than the pay, or nothing (`askMoreRefusal` says the rest first: an offer
 * standing, asked once, an agent).
 */
export function termsAskRefusal(o: Opportunity, item: TermItem): string | undefined {
  const t = projectOf(o);
  if (item === 'episodes') {
    if (t.schedule.kind !== 'episodes') return 'Only a recurring part on a series has guaranteed episodes to ask about.';
    const g = guaranteedOf(o, t);
    if (o.offer!.amount === undefined) return 'The pay is deferred, so there’s nothing to ask a further episode’s pay of.';
    if (g >= t.schedule.expected) return `The contract already guarantees every episode it expects you in, ${counted(g, 'episode')}.`;
    const s = t.series ? seriesById(t.series) : undefined;
    if (!s || daysWith(o, g + 1).length < (g + 1) * s.daysEach) return 'The season has no episode left to guarantee you.';
    return undefined;
  }
  if (item === 'promo') {
    if (!promoFor(t)) return 'This work has no promotional film in its contract.';
    if (t.union !== 'sag-aftra') return 'Its contract has the promotional film unpaid, as part of the job: only SAG-AFTRA work leaves its pay to bargain.';
    if (o.offer!.amount === undefined) return 'The pay is deferred, so there’s no day to ask the promotional film be paid at.';
    const least = promoMinimum(o);
    if (offerEstimate(o) < PROMO.bargained && least >= ownDay(o)) return `The agreement already pays the promotional film a day performer’s minimum, ${formatMoney(least, 'USD')}, at least your own day.`;
    return undefined;
  }
  return undefined;
}

/** The share of the offer's worth an ask adds: what a bigger ask risks more of (`withdrawChance`). */
export function askShare(o: Opportunity, item: TermItem): number {
  const t = projectOf(o);
  if (item === 'pay') return NEGOTIATE.ask;
  if (item === 'episodes') return 1 / Math.max(1, guaranteedOf(o, t));
  const units = payTermsOf(o).units * (o.offer?.per === 'week' ? 5 : 1);
  return 1 / Math.max(1, units);
}

/** The chance a production withdraws an offer rather than answer an ask, by the ask's share (`TERMS.withdraw`). */
export const withdrawChance = (share: number): number => r3(Math.min(TERMS.withdraw.most, TERMS.withdraw.perShare * share));

/** Whether the production withdraws its offer when asked (decider `pro.withdraw`): its own draw, by the posting and the term. */
export const withdrawDrawn = (sim: Simulation, projectId: string, postedAt: Instant, item: TermItem, chance: number): boolean => sim.rng('pro.withdraw', projectId, postedAt, item).next() < chance;

/** Whether a production that won't give what's asked offers a trade-off instead (decider `pro.trade`), where there's one to offer. */
export const tradeDrawn = (sim: Simulation, projectId: string, postedAt: Instant, item: TermItem, possible: boolean): boolean => possible && sim.rng('pro.trade', projectId, postedAt, item).next() < TERMS.trade;

/** The chance the production gives what's asked (`NEGOTIATE`): the last round's band, the office's work with the actor before, the actor's visibility. */
export function askChance(sim: Simulation, person: Person, o: Opportunity): number {
  const t = projectOf(o);
  const last = o.rounds?.filter((r) => r.band).at(-1)?.band;
  const worked = o.direct !== undefined || (person.pro?.engagements ?? []).some((e) => finished(e) && projectById(e.projectId)?.casting === t.casting);
  return Math.min(1, (last ? NEGOTIATE.yes[last] : NEGOTIATE.yes.working) + (worked ? NEGOTIATE.worked : 0) + NEGOTIATE.visibility * visibilityOf(person, sim.now));
}

/** Whether the production gives what's asked (decider `pro.negotiate`): the pay on the stream it always had, another term on its own. */
export const askYes = (sim: Simulation, person: Person, o: Opportunity, item: TermItem): boolean =>
  (item === 'pay' ? sim.rng('pro.negotiate', o.projectId, o.postedAt) : sim.rng('pro.negotiate', o.projectId, o.postedAt, item)).next() < askChance(sim, person, o);

/** A day performer's minimum on the work's first day: what the agreement pays a promotional film on work under $25,000 (`promoPay`). */
export const promoMinimum = (o: Opportunity): Money => minimumOn(RATES['sag-tv-day'], dateKey(datesOf(o)[0]?.from ?? 0, NY)) ?? 0;

/**
 * Whether an ask has a trade-off to offer: fewer guaranteed episodes for the pay, no option raise for an episode, and the
 * agreement's minimum for a promotional film the contract would leave unpaid. Below $25,000 the minimum is already paid,
 * so a promotional film there has nothing to trade.
 */
export function tradePossible(o: Opportunity, item: TermItem): boolean {
  const t = projectOf(o);
  if (item === 'pay') return t.schedule.kind === 'episodes' && guaranteedOf(o, t) >= 2;
  if (item === 'episodes') return t.schedule.kind === 'episodes';
  return offerEstimate(o) >= PROMO.bargained && ownDay(o) > promoMinimum(o);
}

/** An ask about a term other than the pay made: the ask kept on the offer, the offer standing a day past the answer, the answer on the clock. */
export function askTerms(sim: Simulation, person: Person, o: Opportunity, item: TermItem, hooks: OfferHooks): { asked: number; answerAt: Instant } {
  const t = projectOf(o);
  const offer = o.offer!;
  const amount = askedFigure(o, item);
  const answerAt = dayAt(addDays(sim.now, 1, NY), NEGOTIATE.answerHour);
  offer.asked = { at: sim.now, amount, answerAt, item };
  const until = Math.max(offer.until, dayAt(addDays(answerAt, 1, NY), WORK.offerHour));
  if (until !== offer.until) {
    offer.until = until;
    const lapse = sim.universe.scheduled.find((i) => i.status === 'pending' && i.kind === OFFER_KIND && i.payload.opportunityId === o.id);
    if (lapse) sim.timeline.reschedule(lapse.id, until);
  }
  sim.schedule({ at: answerAt, kind: NEGOTIATE_KIND, label: `The Answer On ${t.role.part}’s ${item === 'episodes' ? 'Episodes' : 'Promotional Film'}`, category: 'career', priority: 40, refType: 'pro.offer', refId: o.id, payload: { personId: person.id, opportunityId: o.id } });
  const agent = agentById(o.agentId ?? activeAgreement(person, sim.now)?.agentId ?? '');
  const who = agent?.name ?? 'Your agent';
  const words = item === 'episodes'
    ? `${who} asked ${t.casting} to guarantee ${counted(amount, 'episode')} of the season, one more than ${agrees(t, 'its', 'their')} offer.`
    : `${who} asked ${t.casting} to pay the promotional film at your own day, ${formatMoney(amount, 'USD')}, where the contract would ${offerEstimate(o) >= PROMO.bargained ? 'have it unpaid' : `pay a day performer’s minimum, ${formatMoney(promoMinimum(o), 'USD')}`}.`;
  hooks.note(sim, person, o, { kind: 'offer', key: 'asked', words });
  return { asked: amount, answerAt };
}

/** The offer's decision in What Needs You, brought up to its latest version, so it never says one thing while the offer holds another. */
export function reviseDecision(sim: Simulation, o: Opportunity, words: string): void {
  for (const d of Object.values(sim.universe.decisions)) {
    if (d.resolvedAt || d.dismissedAt || d.refType !== 'pro.offer' || d.refId !== o.id) continue;
    d.detail = `${d.detail} Since then: ${words}`;
    if (o.offer) d.dueAt = o.offer.until;
  }
}

/**
 * The production's answer to an ask (the work loop's `NEGOTIATE_KIND`, before its own raise-or-keep of the pay): the offer
 * withdrawn by its draw; for the pay, a trade-off where it won't raise it; for another term, all of it. Returns whether
 * it answered, so the loop's own answer for the pay runs only where it didn't.
 */
export function answerAsk(sim: Simulation, person: Person, o: Opportunity, hooks: OfferHooks): boolean {
  const offer = o.offer!;
  const asked = offer.asked!;
  const item = asked.item ?? 'pay';
  const t = projectOf(o);
  const agent = agentById(o.agentId ?? '')?.name ?? 'your agent';
  const until = `It stands until ${formatDate(offer.until, NY)} at ${formatTime(offer.until, NY)}.`;
  if (withdrawDrawn(sim, o.projectId, o.postedAt, item, withdrawChance(askShare(o, item)))) {
    asked.answer = 'withdrawn';
    sim.timeline.cancelFor('pro.offer', o.id, sim.now);
    const words = `Asked ${item === 'pay' ? `for ${formatMoney(asked.amount, 'USD')} a ${offer.per}` : item === 'episodes' ? 'for another guaranteed episode' : 'to pay the promotional film'}, ${t.casting} withdrew ${agrees(t, 'its', 'their')} offer for ${t.role.part} rather than negotiate. The part goes to another actor.`;
    const gone = hooks.holdGone(o);
    hooks.note(sim, person, o, { kind: 'offer', key: 'answered', words });
    hooks.settle(sim, person, o, 'withdrawn', words);
    hooks.tell(sim, person, `The Offer For ${t.role.part} Is Withdrawn`, `${words}${gone}`, 75);
    return true;
  }
  const yes = askYes(sim, person, o, item);
  if (item === 'pay' && yes) return false;
  const traded = !yes && tradeDrawn(sim, o.projectId, o.postedAt, item, tradePossible(o, item));
  if (item === 'pay' && !traded) return false;
  let words: string;
  if (item === 'pay') {
    // The pay raised for one guaranteed episode fewer.
    const g = guaranteedOf(o, t);
    offer.amount = asked.amount;
    offer.episodes = g - 1;
    offer.units = payTermsOf(o).units;
    words = `${castingAs(t)} won’t pay ${formatMoney(asked.amount, 'USD')} a day for ${counted(g, 'episode')}, but ${agrees(t, 'offers', 'offer')} it for ${counted(g - 1, 'episode')}: the pay is raised, and the contract guarantees one episode fewer. ${until}`;
  } else if (item === 'episodes') {
    const g = guaranteedOf(o, t);
    offer.episodes = g + 1;
    offer.units = payTermsOf(o).units;
    if (traded) offer.optionRaise = 0;
    words = yes
      ? `${castingAs(t)} agreed to guarantee ${counted(g + 1, 'episode')} of the season, as ${agent} asked, each paid at ${formatMoney(offer.amount!, 'USD')} a day. ${until}`
      : traded
        ? `${castingAs(t)} will guarantee ${counted(g + 1, 'episode')}, as ${agent} asked, if ${agrees(t, 'its', 'their')} option on you for next season carries no raise: the same day rate, not more. ${until}`
        : `${castingAs(t)} kept ${agrees(t, 'its', 'their')} offer at ${counted(g, 'guaranteed episode')}, where ${agent} asked for ${counted(g + 1, 'episode')}. ${until}`;
  } else {
    const least = promoMinimum(o);
    const unpaid = offerEstimate(o) >= PROMO.bargained;
    if (yes) offer.promo = asked.amount;
    else if (traded) offer.promo = least;
    words = yes
      ? `${castingAs(t)} agreed to pay the promotional film at your own day, ${formatMoney(asked.amount, 'USD')}, as ${agent} asked. ${until}`
      : traded
        ? `${castingAs(t)} won’t pay the promotional film at your own day, but ${agrees(t, 'agrees', 'agree')} to a day performer’s minimum for it, ${formatMoney(least, 'USD')}, where the contract would have it unpaid. ${until}`
        : `${castingAs(t)} kept the promotional film ${unpaid ? 'unpaid' : `at a day performer’s minimum, ${formatMoney(least, 'USD')}`}, where ${agent} asked for ${formatMoney(asked.amount, 'USD')} for it. ${until}`;
  }
  asked.answer = yes ? 'raised' : traded ? 'traded' : 'kept';
  if (yes || traded) offer.version = (offer.version ?? 1) + 1;
  hooks.note(sim, person, o, { kind: 'offer', key: 'answered', words });
  hooks.tell(sim, person, yes ? `The Offer For ${t.role.part} Is Improved` : traded ? `A Trade-Off On ${t.role.part}` : `The Offer For ${t.role.part} Stands`, words, 70);
  reviseDecision(sim, o, words);
  return true;
}

/** The answer an ask came to, in a sentence on the offer's card, or nothing while it's still to come. */
export function askAnswerWords(o: Opportunity): string | undefined {
  const asked = o.offer?.asked;
  if (!asked?.answer) return undefined;
  return o.history.find((h) => h.key === 'answered')?.words;
}

/** What a contract says of a promotional film whose pay the agent bargained for: above the agreement's minimum, or where it would be unpaid. */
export const bargainedPromoWords = (amount: Money, estimate: Money): string => `Around its release, the production may call you for ${counted(PROMO.hours, 'hour')} to appear in a promotional film about it, on a weekday clear of your other work. ${estimate >= PROMO.bargained ? 'Paid $25,000 or more for the work, its pay was yours to bargain' : 'Paid less than $25,000 for the work, you’re paid at least a day performer’s minimum for it, and more is yours to bargain'}, and your agent bargained ${formatMoney(amount, 'USD')} for it.`;

// ---------------------------------------------------------------------------------------------------------------------
// Conditional offers (loop 10, loop 19)
// ---------------------------------------------------------------------------------------------------------------------

/** The latest finished work for a casting office, judged Strong or better, with its band: what a direct or conditional offer stands on. */
export function castBefore(person: Person, t: ProjectTemplate): { e: Engagement; band: Band } | undefined {
  const pro = person.pro;
  if (!pro) return undefined;
  return pro.engagements
    .filter((e) => finished(e) && e.status !== 'canceled' && e.promo?.status !== 'missed' && projectById(e.projectId)?.casting === t.casting)
    .map((e) => ({ e, band: pro.credits.find((c) => c.engagementId === e.id)?.band }))
    .filter((x): x is { e: Engagement; band: Band } => x.band === 'strong' || x.band === 'exceptional')
    .sort((a, b) => (b.e.finishedAt ?? 0) - (a.e.finishedAt ?? 0))[0];
}

/** Whether a lead reaching the actor comes as an offer on condition (decider `pro.conditional`), by its week and the part. */
export const conditionalDrawn = (sim: Simulation, week: Instant, partId: string): boolean => sim.rng('pro.conditional', dateKey(week, NY), partId).next() < CONDITIONAL.chance;

/** Whether the round a conditional offer stands on goes the actor's way (decider `pro.conditional`), at its band's chance. */
export const conditionMetDrawn = (sim: Simulation, projectId: string, postedAt: Instant, band: Band): boolean => sim.rng('pro.conditional', projectId, postedAt, 'met').next() < CONDITIONAL.met[band];

/**
 * Whether a lead reaching the actor comes as an offer on condition, and of which round (`CONDITIONAL`): a slate lead with
 * a chemistry read or a screen test, from a casting office that cast them before, the work Strong or better, which
 * remembers no no-show of theirs, by its own draw.
 */
export function conditionalOfferFor(sim: Simulation, person: Person, t: ProjectTemplate, at: Instant): { engagementId: ProId; words: string; round: 'chemistry' | 'test' } | undefined {
  if (!t.slate || t.role.size !== 'lead' || !(t.stages.chemistry || t.stages.test)) return undefined;
  const before = castBefore(person, t);
  if (!before || remembers(person, t.casting, at) || !conditionalDrawn(sim, at, t.id)) return undefined;
  const was = projectById(before.e.projectId)!;
  return { engagementId: before.e.id, words: `${castingAs(t)} cast you as ${was.role.part} in ${was.project}, where your work was ${BAND_LABEL[before.band]}.`, round: t.stages.test ? 'test' : 'chemistry' };
}

/** A part just posted made an offer on condition, where it comes as one: the work loop's `makeOffer` with the condition on it. */
export function offerOnCondition(sim: Simulation, person: Person, t: ProjectTemplate, o: Opportunity, at: Instant, hooks: OfferHooks): boolean {
  const c = conditionalOfferFor(sim, person, t, at);
  if (!c) return false;
  o.direct = { engagementId: c.engagementId, words: c.words };
  o.condition = { round: c.round };
  hooks.makeOffer(sim, person, o);
  return true;
}

/** An offer's condition, in the sentences its notice and card say, or nothing. */
export function conditionWords(o: Pick<Opportunity, 'condition' | 'projectId'>): string {
  if (!o.condition) return '';
  const t = projectOf(o);
  const noun = ROUND_WORDS[o.condition.round].noun;
  return ` It’s offered on one condition: the ${noun} with ${t.casting} goes your way. Accepting it now holds your dates and sets the ${noun}; nothing is booked or paid until it goes your way, and the offer falls away if it doesn’t.`;
}

/**
 * A conditional offer accepted (the work loop's `pro.accept_offer`, before it books anything): the condition's round set,
 * which holds the dates (`setRound`), and nothing booked or promised. Nothing where the offer has no condition left.
 */
export function acceptOnCondition(sim: Simulation, person: Person, o: Opportunity, hooks: OfferHooks): { conditional: true; round: Round; at: Instant } | undefined {
  if (!o.condition || o.condition.accepted) return undefined;
  const t = projectOf(o);
  o.condition.accepted = sim.now;
  sim.timeline.cancelFor('pro.offer', o.id, sim.now);
  sim.resolveDecision('pro.offer', o.id, 'career');
  const noun = ROUND_WORDS[o.condition.round].noun;
  hooks.note(sim, person, o, { kind: 'accepted', key: 'condition:accepted', words: `You accepted ${t.role.part} in ${t.project} on its condition, the ${noun}.` });
  const r = hooks.setRound(sim, person, o, o.condition.round);
  return { conditional: true, round: r.round, at: r.at };
}

/**
 * The round a conditional offer stands on, decided (the work loop's casting decision on it): met, the offer is firm and
 * booked through the loop's own acceptance on the terms accepted; not met, or the booking refused by then, it falls away,
 * said. Returns whether it decided.
 */
export function decideCondition(sim: Simulation, person: Person, o: Opportunity, r: AuditionRound, hooks: OfferHooks): boolean {
  const t = projectOf(o);
  if (!o.condition?.accepted || o.condition.outcome || r.round !== o.condition.round || nextRound(t, r.round)) return false;
  const band = r.band ?? 'working';
  const yes = conditionMetDrawn(sim, o.projectId, o.postedAt, band);
  r.casting = { at: sim.now, chance: CONDITIONAL.met[band], fit: fitOf(person, t).fit, yes };
  const noun = ROUND_WORDS[r.round].noun;
  if (!yes) {
    o.condition.outcome = 'failed';
    const words = `Your ${noun} for ${t.role.part} didn’t go your way, so the offer on that condition fell away: ${t.casting} cast another actor.`;
    const gone = hooks.holdGone(o);
    hooks.note(sim, person, o, { kind: 'passed', key: 'condition:failed', words });
    hooks.settle(sim, person, o, 'passed', words);
    hooks.tell(sim, person, `The Offer For ${t.role.part} Falls Away`, `${words}${gone}`, 75);
    return true;
  }
  o.condition.outcome = 'met';
  o.status = 'offered';
  o.offer!.until = Math.max(o.offer!.until, sim.now + MS_HOUR);
  const no = acceptRefusal(sim, person, o);
  if (no) {
    const words = `Your ${noun} for ${t.role.part} went your way, but the booking couldn’t be made: ${lower(no)}`;
    const gone = hooks.holdGone(o);
    hooks.note(sim, person, o, { kind: 'problem', key: 'condition:refused', words });
    hooks.settle(sim, person, o, 'lapsed', words);
    hooks.tell(sim, person, `The Offer For ${t.role.part} Falls Away`, `${words}${gone}`, 80);
    return true;
  }
  sim.execute({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } });
  hooks.tell(sim, person, `${t.role.part} Is Yours`, `Your ${noun} went your way, so the offer you accepted on that condition is firm: you’re booked as ${t.role.part} in ${t.project}. Booked Work has the days.`, 85);
  return true;
}

// ---------------------------------------------------------------------------------------------------------------------
// A changed requirement (loop 10)
// ---------------------------------------------------------------------------------------------------------------------

/** What a part requires of the actor now: its playing ages and techniques, as casting changed them where it did. */
export function requirementsOf(o: Pick<Opportunity, 'rewrite'>, t: ProjectTemplate): { ages: readonly [number, number]; skills: Partial<Record<string, number>> } {
  const skills: Partial<Record<string, number>> = { ...(t.requirements.skills ?? {}) };
  if (o.rewrite?.skill) skills[o.rewrite.skill.skill] = Math.max(skills[o.rewrite.skill.skill] ?? 0, o.rewrite.skill.level);
  return { ages: o.rewrite?.ages ?? t.requirements.ages, skills };
}

/** How a part's requirement changes at casting's cut, if it does (decider `pro.rewrite`): the ages moved, or a technique it now asks. */
export function rewriteDrawn(sim: Simulation, t: ProjectTemplate, postedAt: Instant): { ages?: readonly [number, number]; skill?: { skill: Skill; level: number } } | undefined {
  const r = sim.rng('pro.rewrite', t.id, postedAt);
  if (r.next() >= REWRITE.chance) return undefined;
  const asks = Object.entries(t.role.techniques).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0) || a[0].localeCompare(b[0]));
  if (r.next() < 0.5 || !asks.length) {
    const by = r.int(REWRITE.shift[0], REWRITE.shift[1]) * (r.next() < 0.5 ? -1 : 1);
    const [lo, hi] = t.requirements.ages;
    const from = Math.max(18, lo + by);
    return { ages: [from, Math.max(from + 4, hi + by)] };
  }
  return { skill: { skill: asks[0]![0] as Skill, level: REWRITE.level } };
}

/**
 * A part's requirement changed at casting's cut (the work loop's casting decision on a round with another to come): the
 * change kept and said, and the actor checked again, released where they no longer meet it. Returns whether they were.
 */
export function rewriteAt(sim: Simulation, person: Person, o: Opportunity, r: AuditionRound, hooks: OfferHooks): boolean {
  const t = projectOf(o);
  if (!t.slate || o.rewrite || o.condition?.accepted || !nextRound(t, r.round)) return false;
  const change = rewriteDrawn(sim, t, o.postedAt);
  if (!change) return false;
  const what = change.ages
    ? `rewrote ${t.role.part} for actors who play ${change.ages[0]} to ${change.ages[1]}, where it had asked for ${t.requirements.ages[0]} to ${t.requirements.ages[1]}`
    : `changed what ${t.role.part} asks: ${skillWords(change.skill!.skill)} at ${change.skill!.level} now`;
  o.rewrite = { at: sim.now, ...change, words: `${castingAs(t)} ${what}.` };
  const req = requirementsOf(o, t);
  const age = ageOn(person.birthInstant, sim.now, NY);
  const out = change.ages ? (age + CASTING.playingSpread < req.ages[0] || age - CASTING.playingSpread > req.ages[1]) : (person.craft?.[change.skill!.skill] ?? 0) < change.skill!.level;
  if (out) {
    const words = `${castingAs(t)} ${what}, and you no longer fit it, so ${agrees(t, 'it', 'they')} released you from ${t.role.part}: ${change.ages ? `at ${age} you’re outside that` : `yours is at ${Math.round(person.craft?.[change.skill!.skill] ?? 0)}`}.`;
    const gone = hooks.holdGone(o);
    hooks.note(sim, person, o, { kind: 'problem', key: 'rewrite', words });
    hooks.settle(sim, person, o, 'withdrawn', words);
    hooks.tell(sim, person, `${t.project} Changes ${t.role.part}`, `${words}${gone}`, 75);
    return true;
  }
  const words = `${castingAs(t)} ${what}. You still fit it, so you’re still in the running.`;
  hooks.note(sim, person, o, { kind: 'callback', key: 'rewrite', words });
  hooks.tell(sim, person, `${t.project} Changes ${t.role.part}`, words, 60);
  return false;
}

/** A technique as a sentence names it, lower case, as `eligibilityProblems` says one. */
const skillWords = (s: string): string => TECHNIQUE_LABEL[s as Skill]?.toLowerCase() ?? s;

// ---------------------------------------------------------------------------------------------------------------------
// Recasting (Area B)
// ---------------------------------------------------------------------------------------------------------------------

/** Whether a posting is one a recast could come back to: a part the actor lost at casting's word, or one they never went for. */
const recastable = (o: Opportunity): boolean => !o.recast && ((o.status === 'passed' && (o.rounds ?? []).some((r) => r.casting && !r.casting.yes && r.casting.chance > 0)) || (o.status === 'lapsed' && !o.rounds?.length));

/** Whether a part is recast (decider `pro.recast`), by its posting: once, the first Monday after the actor's part in it settled. */
export const recastDrawn = (sim: Simulation, projectId: string, postedAt: Instant, leadDays: number): boolean => leadDays >= RECAST.leadDays && sim.rng('pro.recast', projectId, postedAt).next() < RECAST.chance;

/**
 * A Monday's recasts: each slate part the actor lost or let go, settled before that Monday and not after the one before,
 * whose first day is three weeks off or more, recast by its draw and posted again, the way it came the first time (an
 * agent's breakdown while an agreement is in force, or an open posting where the office takes those).
 */
export function recastsAt(sim: Simulation, person: Person, at: Instant, hooks: OfferHooks): void {
  const pro = person.pro;
  if (!pro) return;
  for (const o of [...pro.opportunities]) {
    if (!recastable(o) || o.resolvedAt === undefined || o.resolvedAt >= at || o.resolvedAt < at - 7 * MS_DAY) continue;
    const t = projectById(o.projectId);
    if (!t?.slate || pro.opportunities.some((x) => x.recast?.from === o.id)) continue;
    const first = datesOf(o)[0]?.from ?? at;
    if (!recastDrawn(sim, o.projectId, o.postedAt, Math.floor((first - at) / MS_DAY))) continue;
    const agreement = activeAgreement(person, at);
    const via = o.via === 'agent' && agreement && t.access.agent ? 'agent' : t.access.open ? 'open' : undefined;
    if (!via) continue;
    const n: Opportunity = {
      id: sim.nextId('pro'), projectId: t.id, via, status: 'open', postedAt: o.postedAt, submitBy: addDays(at, RECAST.submitDays, NY), history: [], counts: {},
      recast: { from: o.id, at }, ...(via === 'agent' ? { agentId: agreement!.agentId, agreementId: agreement!.id } : {}),
    };
    pro.opportunities.push(n);
    const words = `${castingAs(t)} recast ${t.role.part} in ${t.project}: the actor ${agrees(t, 'it', 'they')} cast left the part, so ${agrees(t, 'it', 'they')} posted it again before its first day, ${formatDate(first, NY)}.`;
    hooks.note(sim, person, n, { kind: 'opportunity', key: 'recast', words });
    hooks.tell(sim, person, `${t.role.part} Is Recast`, `${words} ${via === 'agent' ? `${agentById(agreement!.agentId)?.name ?? 'Your agent'} can submit you again until ${formatDate(n.submitBy, NY)}.` : `You can submit yourself again until ${formatDate(n.submitBy, NY)}, on the Opportunities tab.`}`, 70);
  }
}

/** A part posted again by a recast, in a sentence on its card. */
export const recastWords = (o: Pick<Opportunity, 'recast' | 'projectId'>): string | undefined => {
  if (!o.recast) return undefined;
  const t = projectOf(o);
  return `${castingAs(t)} recast it: the actor ${agrees(t, 'it', 'they')} cast left the part, and casting decides it afresh.`;
};

/** Casting's draw keyed for a recast as well, so the part recast is decided afresh rather than as the first casting was. */
export const recastKey = (o: Partial<Pick<Opportunity, 'recast'>>): string[] => (o.recast ? ['recast'] : []);

// ---------------------------------------------------------------------------------------------------------------------
// Withdrawing, no-shows and rescheduling (loop 14)
// ---------------------------------------------------------------------------------------------------------------------

/** Whether a casting office remembers a no-show or a late withdrawal of the actor's at a moment (`NOTICE.rememberDays`). */
export const remembers = (person: Person, casting: string, at: Instant): boolean =>
  (person.pro?.noShows ?? []).some((x) => x.casting === casting && x.at <= at && at - x.at < NOTICE.rememberDays * MS_DAY);

/** A casting office's memory of a no-show or a late withdrawal, kept to its bounds. */
function remember(sim: Simulation, person: Person, t: ProjectTemplate, how: 'no-show' | 'late'): void {
  const list = (ensurePro(sim, person).noShows ??= []);
  list.push({ casting: t.casting, projectId: t.id, at: sim.now, how });
  if (list.length > NOTICE.kept) list.splice(0, list.length - NOTICE.kept);
}

/** Casting's lift at a cut, halved where the office remembers a no-show of the actor's (the visibility lift as it was otherwise). */
export const castingLift = (person: Person, t: Pick<ProjectTemplate, 'casting'>, at: Instant, lift: number): number => (remembers(person, t.casting, at) ? (1 + lift) * NOTICE.cut - 1 : lift);

/**
 * A round missed (the work loop's `missRound`): a round in person missed by not turning up, asleep or somewhere else, is a
 * no-show the office remembers; one missed ill or in hospital isn't held against the actor. A self-tape never sent says
 * why where takes were recorded and none sent.
 */
export function rememberMiss(sim: Simulation, person: Person, o: Opportunity, r: AuditionRound, hooks: OfferHooks): void {
  const t = projectOf(o);
  if (r.form === 'self-tape') {
    if (r.takes?.length && r.sent === undefined) hooks.note(sim, person, o, { kind: 'problem', key: `${r.round}:unsent`, words: `You recorded ${counted(r.takes.length, 'take')} for ${t.role.part} and sent none of them.` });
    return;
  }
  if (offSick(person, r.at)) return;
  remember(sim, person, t, 'no-show');
  hooks.note(sim, person, o, { kind: 'problem', key: `${r.round}:no-show`, words: `${castingAs(t)} will remember that you didn’t turn up and didn’t let ${agrees(t, 'it', 'them')} know.` });
}

/** Whether withdrawing now would be with notice: a day or more before the next round in person, or none to come. */
export function withNotice(sim: Simulation, o: Opportunity): boolean {
  const r = roundToCome(o);
  return !r || r.form !== 'in-person' || r.at - sim.now >= NOTICE.hours * MS_HOUR;
}

/** Why the actor can't withdraw from a part now, or nothing. */
export function withdrawRefusal(o: Opportunity | undefined): string | undefined {
  if (!o) return 'There’s no such casting notice.';
  if (o.status === 'offered') return 'Decline the offer instead: you haven’t accepted it, so there’s nothing to withdraw from.';
  if (o.status !== 'submitted' && o.status !== 'audition' && o.status !== 'callback') return 'You’re not in the running for it now.';
  if (noteWaiting(o)) return 'You’re in the room: answer casting’s direction first.';
  return undefined;
}

/** What withdrawing would do, said before it's pressed. */
export function withdrawWarning(sim: Simulation, o: Opportunity): string {
  const t = projectOf(o);
  const r = roundToCome(o);
  if (withNotice(sim, o)) return `Withdrawing now gives ${t.casting} notice${r?.form === 'in-person' ? `, a day or more before your ${ROUND_WORDS[r.round].noun}` : ''}, so ${agrees(t, 'it', 'they')} won’t hold it against you.`;
  return `Your ${ROUND_WORDS[r!.round].noun} is less than a day away, so withdrawing now is late notice: ${t.casting} will remember it as ${agrees(t, 'it remembers', 'they remember')} an actor who doesn’t turn up.`;
}

/** Withdrawn from a part: its rounds off the calendar, settled, said, and remembered by the office where the notice was late. */
export function withdraw(sim: Simulation, person: Person, o: Opportunity, hooks: OfferHooks): { notice: boolean } {
  const t = projectOf(o);
  const notice = withNotice(sim, o);
  sim.timeline.cancelFor('pro.opportunity', o.id, sim.now);
  sim.timeline.cancelFor('pro.hold', o.id, sim.now);
  const words = `You withdrew from ${t.role.part} in ${t.project}${notice ? `, with notice` : `, with less than a day’s notice before your ${ROUND_WORDS[roundToCome(o)!.round].noun}`}.`;
  if (!notice) remember(sim, person, t, 'late');
  const gone = hooks.holdGone(o);
  hooks.note(sim, person, o, { kind: 'ended', key: 'withdrew', words });
  hooks.settle(sim, person, o, 'withdrawn', words);
  hooks.tell(sim, person, `You Withdrew From ${t.role.part}`, `${words}${gone} ${notice ? `${castingAs(t)} won’t hold it against you.` : `${castingAs(t)} will remember it: for two years ${agrees(t, 'its', 'their')} cuts are less likely to go your way, and ${agrees(t, 'it offers', 'they offer')} you nothing without an audition.`}`, 65);
  return { notice };
}

/** The same hour on one of the next weekdays after a round, clear of the calendar and a day ahead at least: where a production could move it. */
export function otherDay(sim: Simulation, person: Person, o: Opportunity, r: AuditionRound): Instant | undefined {
  const t = projectOf(o);
  const away = tripMinutes(person.currentLocationId, t.place.cityId);
  const own = sim.universe.scheduled.find((i) => i.status === 'pending' && i.kind === AUDITION_KIND && i.payload.opportunityId === o.id);
  let day = r.at;
  for (let n = 0; n < RESCHEDULE.days;) {
    day = addDays(day, 1, NY);
    if (weekday(day) === 0 || weekday(day) === 6) continue;
    n += 1;
    if (day - sim.now < NOTICE.hours * MS_HOUR) continue;
    if (!clashesAt(sim, person, day - away * MIN, roundMinutes(r) + 2 * away, own?.id).length) return day;
  }
  return undefined;
}

/** Whether the round clashes with something on the calendar now: the reason a reschedule is justified. */
function clashing(sim: Simulation, person: Person, o: Opportunity, r: AuditionRound): boolean {
  const t = projectOf(o);
  const away = tripMinutes(person.currentLocationId, t.place.cityId);
  const own = sim.universe.scheduled.find((i) => i.status === 'pending' && i.kind === AUDITION_KIND && i.payload.opportunityId === o.id);
  return clashesAt(sim, person, r.at - away * MIN, roundMinutes(r) + 2 * away, own?.id).length > 0;
}

/** The chance the production moves a round (`RESCHEDULE`), its own and more with a clash to give. */
export const rescheduleChance = (round: 'chemistry' | 'test', clash: boolean): number => r3(Math.min(1, RESCHEDULE.chance[round] + (clash ? RESCHEDULE.clash : 0)));

/** Whether the production moves a round when asked (decider `pro.reschedule`), by the posting and the round. */
export const rescheduleDrawn = (sim: Simulation, projectId: string, postedAt: Instant, round: 'chemistry' | 'test', clash: boolean): boolean => sim.rng('pro.reschedule', projectId, postedAt, round).next() < rescheduleChance(round, clash);

/** When the production answers an ask to reschedule: the next afternoon at three, or six hours before the round where that's sooner. */
const rescheduleAnswerAt = (now: Instant, r: AuditionRound): Instant => Math.min(dayAt(addDays(now, 1, NY), RESCHEDULE.answerHour), r.at - 6 * MS_HOUR);

/** Why a chemistry read or a screen test can't be asked to move now, or nothing. */
export function rescheduleRefusal(sim: Simulation, person: Person, o: Opportunity | undefined): string | undefined {
  const r = o && roundToCome(o);
  if (!o || !r || r.form !== 'in-person' || (r.round !== 'chemistry' && r.round !== 'test') || (o.status !== 'callback')) return 'There’s no chemistry read or screen test to reschedule. An audition or a callback moves with Ask For Another Time.';
  if (r.reschedule) return r.reschedule.answer ? `You’ve asked once, and the production ${r.reschedule.answer === 'granted' ? 'moved it' : 'kept the time it gave'}.` : `You’ve asked; the production answers on ${formatWeekdayDate(r.reschedule.answerAt, NY)} at ${formatTime(r.reschedule.answerAt, NY)}.`;
  if (r.at - sim.now < NOTICE.hours * MS_HOUR) return 'It’s less than a day away, and the production needs a day’s notice to reschedule.';
  if (!otherDay(sim, person, o, r)) return 'The production has no other day clear of your calendar in the days it’s seeing actors.';
  return undefined;
}

/** What asking to reschedule would weigh, said before it's pressed: the chance, and the clash that justifies it. */
export function rescheduleWords(sim: Simulation, person: Person, o: Opportunity): string | undefined {
  const r = roundToCome(o);
  if (!r || (r.round !== 'chemistry' && r.round !== 'test') || r.reschedule) return undefined;
  const clash = clashing(sim, person, o, r);
  return `The ${ROUND_WORDS[r.round].noun} is set around other people’s days, so the production decides whether to move it: about ${Math.round(rescheduleChance(r.round, clash) * 10)} in 10, estimated${clash ? ', more for the clash on your calendar' : ''}.`;
}

/** An ask to reschedule made: kept on the round, its answer on the clock. */
export function askReschedule(sim: Simulation, person: Person, o: Opportunity, hooks: OfferHooks): { answerAt: Instant } {
  const r = roundToCome(o)!;
  const t = projectOf(o);
  const answerAt = Math.max(sim.now + MIN, rescheduleAnswerAt(sim.now, r));
  r.reschedule = { at: sim.now, answerAt };
  sim.schedule({ at: answerAt, kind: RESCHEDULE_KIND, label: `The Answer On Moving The ${ROUND_WORDS[r.round].name}`, category: 'career', priority: 40, refType: 'pro.opportunity', refId: o.id, payload: { personId: person.id, opportunityId: o.id, round: o.rounds!.indexOf(r) } });
  hooks.note(sim, person, o, { kind: 'callback', key: `${r.round}:reschedule`, words: `You asked ${t.casting} to move your ${ROUND_WORDS[r.round].noun} for ${t.role.part} from ${formatDate(r.at, NY)} at ${formatTime(r.at, NY)}.` });
  return { answerAt };
}

/** The production's answer to an ask to reschedule (`RESCHEDULE_KIND`): moved by its draw to another day clear of the calendar, or kept, said. */
function answerReschedule(sim: Simulation, person: Person, o: Opportunity, r: AuditionRound, idx: number, hooks: OfferHooks): void {
  if (!r.reschedule || r.reschedule.answer || r.status !== 'set' || (r.round !== 'chemistry' && r.round !== 'test')) return;
  const t = projectOf(o);
  const clash = clashing(sim, person, o, r);
  const to = otherDay(sim, person, o, r);
  const yes = to !== undefined && rescheduleDrawn(sim, o.projectId, o.postedAt, r.round, clash);
  r.reschedule.answer = yes ? 'granted' : 'refused';
  const was = r.at;
  if (yes) {
    const item = sim.universe.scheduled.find((i) => i.status === 'pending' && i.kind === AUDITION_KIND && i.payload.opportunityId === o.id && Number(i.payload.round) === idx);
    if (item) sim.timeline.reschedule(item.id, to!);
    r.at = to!;
    r.reschedule.to = to;
    r.moved = (r.moved ?? 0) + 1;
  }
  const words = yes
    ? `${castingAs(t)} moved your ${ROUND_WORDS[r.round].noun} for ${t.role.part} from ${formatDate(was, NY)} to ${formatWeekdayDate(to!, NY)} at ${formatTime(to!, NY)}.`
    : `${castingAs(t)} couldn’t move your ${ROUND_WORDS[r.round].noun} for ${t.role.part}: it stays on ${formatWeekdayDate(was, NY)} at ${formatTime(was, NY)}. You can still withdraw with notice a day or more before it.`;
  hooks.note(sim, person, o, { kind: 'callback', key: `${r.round}:reschedule-answered`, words });
  hooks.tell(sim, person, yes ? `Your ${ROUND_WORDS[r.round].name} Is Moved` : `Your ${ROUND_WORDS[r.round].name} Stays`, words, 70);
}

// ---------------------------------------------------------------------------------------------------------------------
// Registration: the commands, the direction's stop and its answer, a reschedule's answer, and the Mondays' recasts
// ---------------------------------------------------------------------------------------------------------------------

const located = (sim: Simulation, item: ScheduledItem): { person: Person; o: Opportunity } | undefined => {
  const person = sim.universe.people[String(item.payload.personId)];
  const o = person?.pro?.opportunities.find((x) => x.id === item.payload.opportunityId);
  return person && o ? { person, o } : undefined;
};
const opportunity = (person: Person, id: unknown): Opportunity | undefined => person.pro?.opportunities.find((o) => o.id === id);

/** The stop's choices at casting's direction, declared once for every simulation (`defineStop` throws on a second). */
let stopDeclared = false;

export function registerOffers(sim: Simulation, hooks: OfferHooks): void {
  // Casting's direction answered or not by the time it's due: kept when unanswered, and the round judged with it.
  sim.onSchedule(NOTE_KIND, (item, s) => {
    const at = located(s, item);
    const idx = Number(item.payload.round);
    const r = at?.o.rounds?.[idx];
    if (!at || !r || r.status !== 'set' || !r.note || (at.o.status !== 'audition' && at.o.status !== 'callback')) return;
    if (!r.note.answer) {
      r.note.answer = 'hold';
      s.resolveDecision('pro.note', at.o.id, 'career');
      hooks.note(s, at.person, at.o, { kind: r.round === 'audition' ? 'audition' : 'callback', key: `${r.round}:note-answered`, words: `You kept to your choice, against what ${projectOf(at.o).casting} asked.` });
    }
    hooks.finishRound(s, at.person, at.o, r, idx, evaluate(s, at.person, auditionContext(s, at.person, at.o, r, idx)));
  });
  sim.onSchedule(RESCHEDULE_KIND, (item, s) => {
    const at = located(s, item);
    const idx = Number(item.payload.round);
    const r = at?.o.rounds?.[idx];
    if (at && r) answerReschedule(s, at.person, at.o, r, idx, hooks);
  });
  // The Mondays' recasts, after the week's postings (`registerProJobs` registers this after its own).
  sim.onPassage('pro.recasts', (s, from) => {
    const person = s.universe.people[s.universe.playerId];
    if (!person) return;
    for (const at of postingTimes(from, s.now)) recastsAt(s, person, at, hooks);
  });

  sim.onCommand<{ opportunityId: string; pace?: string; scale?: string; structure?: string }, { prep: number }>('pro.choose_approach', (p, { sim: s }) => {
    const o = opportunity(s.player, p?.opportunityId);
    const no = chooseRefusal(o);
    if (no) throw new CommandError(no);
    const sides: Omit<Playing, 'chosenAt' | 'prep'> = {};
    if (p.pace === 'measured' || p.pace === 'driven') sides.pace = p.pace;
    if (p.scale === 'restrained' || p.scale === 'expansive') sides.scale = p.scale;
    if (p.structure === 'set' || p.structure === 'open') sides.structure = p.structure;
    return chooseApproach(s, o!, sides);
  });
  sim.onCommand<{ opportunityId: string; follow: boolean }, { answer: 'follow' | 'hold' }>('pro.answer_note', (p, { sim: s }) => {
    const o = opportunity(s.player, p?.opportunityId);
    const no = noteRefusal(o);
    if (no) throw new CommandError(no);
    return answerNote(s, s.player, o!, p.follow === true, hooks);
  });
  sim.onCommand<{ opportunityId: string }, { take: number; band: Band; overall: number }>('pro.record_take', (p, { sim: s }) => {
    const o = opportunity(s.player, p?.opportunityId);
    const no = recordRefusal(s, s.player, o);
    if (no) throw new CommandError(no);
    const { take, band, overall } = recordTake(s, s.player, o!);
    return { take, band, overall };
  });
  sim.onCommand<{ opportunityId: string; take: number }, { band: Band; overall: number }>('pro.send_take', (p, { sim: s }) => {
    const o = opportunity(s.player, p?.opportunityId);
    const no = sendRefusal(s, o, p?.take);
    if (no) throw new CommandError(no);
    return sendTake(s, s.player, o!, p.take, hooks);
  });
  sim.onCommand<{ opportunityId: string }, { notice: boolean }>('pro.withdraw', (p, { sim: s }) => {
    const o = opportunity(s.player, p?.opportunityId);
    const no = withdrawRefusal(o);
    if (no) throw new CommandError(no);
    return withdraw(s, s.player, o!, hooks);
  });
  sim.onCommand<{ opportunityId: string }, { answerAt: Instant }>('pro.ask_reschedule', (p, { sim: s }) => {
    const o = opportunity(s.player, p?.opportunityId);
    const no = rescheduleRefusal(s, s.player, o);
    if (no) throw new CommandError(no);
    return askReschedule(s, s.player, o!, hooks);
  });

  if (!stopDeclared) {
    stopDeclared = true;
    defineStop(NOTE_KIND, [
      { label: 'Follow The Direction', command: 'pro.answer_note', payload: (item) => ({ opportunityId: item.payload.opportunityId, follow: true }), then: 'carry-on', does: 'plays the rest of the read the way casting asked, unrehearsed', ahead: 'follow casting’s direction at an audition' },
      { label: 'Keep Your Choice', command: 'pro.answer_note', payload: (item) => ({ opportunityId: item.payload.opportunityId, follow: false }), then: 'carry-on', does: 'plays the rest of the read the way you prepared it', ahead: 'keep your own choice against casting’s direction' },
    ]);
  }
}

/** Every term an offer's agent could ask about now, with why not where it can't be: the offer card's buttons. */
export const TERM_ITEMS: readonly TermItem[] = ['pay', 'episodes', 'promo'];

/** A term's ask as its button names it. */
export function askLabel(o: Opportunity, item: TermItem): string {
  if (item === 'pay') return o.offer?.amount !== undefined ? `Ask For ${formatMoney(askedAmount(o.offer.amount), 'USD')} A ${o.offer.per === 'week' ? 'Week' : 'Day'}` : 'Ask For More';
  if (item === 'episodes') return 'Ask For Another Guaranteed Episode';
  return 'Ask For The Promotional Film Paid';
}

/** A list of the terms on an offer as its card says them, after a negotiation changed any: "Two guaranteed episodes; the promotional film paid $1,283.00." */
export function termsChangedWords(o: Opportunity): string | undefined {
  const offer = o.offer;
  if (!offer) return undefined;
  const t = projectOf(o);
  const out: string[] = [];
  if (offer.episodes !== undefined) out.push(`${counted(offer.episodes, 'guaranteed episode')}`);
  if (offer.optionRaise === 0) out.push('the option on next season at the same day rate');
  if (offer.promo !== undefined) out.push(`the promotional film paid ${formatMoney(offer.promo, 'USD')}`);
  if (!out.length) return undefined;
  return `As negotiated: ${spokenList(out)}${t.schedule.kind === 'episodes' && offer.episodes !== undefined ? `, ${counted(datesOf(o).length, 'shoot day')}` : ''}.`;
}

/** The conditional round's notice words while the condition stands accepted, for the card: what happens next. */
export function conditionStanding(o: Opportunity): string | undefined {
  if (!o.condition?.accepted || o.condition.outcome) return undefined;
  const t = projectOf(o);
  return `You accepted it on its condition: the ${ROUND_WORDS[o.condition.round].noun}. If it goes your way you’re booked on the terms you accepted; if it doesn’t, the offer falls away. ${castingAs(t)} ${agrees(t, 'holds', 'hold')} your dates meanwhile.`;
}

/** What a remembered no-show costs with an office, for the card: said where it applies. */
export function rememberedWords(person: Person, t: ProjectTemplate, at: Instant): string | undefined {
  return remembers(person, t.casting, at) ? `${castingAs(t)} remembers a time you didn’t turn up or withdrew late: ${agrees(t, 'its', 'their')} cuts are half as likely to go your way, estimated.` : undefined;
}

