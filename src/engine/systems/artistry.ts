/**
 * SLATE — the actor the work so far shows (from 2026-10-12).
 *
 * The owner's brief of 2026-10-12 asked for an artistic identity read from history: strengths, recurring weaknesses,
 * familiar and unfamiliar material, habitual interpretations, versatility, response to direction, reliability and
 * collaboration; informing feedback, recommendations and opportunities with inspectable evidence; never a duplicate
 * reward; updated as the work goes on; and not a stereotype made of early choices.
 *
 * So it's read, never stored, from what the game already keeps:
 * - the work record, the last 160 pieces judged (`person.work`), for strengths;
 * - the journey's tallies for life (`Journey.limits`, `.direction`, `.together`, `systems/evaluation.ts`);
 * - the experience record (`systems/experience.ts`): the material met and practised, and the ways of playing chosen;
 * - a brief's takes and their readings, the notes ledger of the coursework, the school's calls kept and missed, and
 *   the partners stood up.
 *
 * Each line says what it rests on, and it's said only once there's enough of it (`ARTISTRY.least`); before that the
 * work so far is called early. It adds nothing to any result: a strength is the abilities' and techniques' already,
 * and the owner's rule of 2026-09-24 holds (a preference changes how much somebody gets out of a thing, never how good
 * they are at it). It's read by the Player Profile and by the brief suggestions (an unfamiliar material, a way not
 * usually played, a weakness that recurs for life). Until 2026-10-12 this said recommendations read it too, as what to
 * work on, which they never did: What To Work On read the work record's limits alone (`recommendations`).
 *
 * From later on 2026-10-12, as the owner's brief asked, the weakness that recurs for life (`recurring`) informs
 * recommendations and a director's feedback as well, in words and order, never in points:
 * - What To Work On (`recommendations`, on the Player Profile and a brief's pane) says on its recommendation how many
 *   pieces it has held back for life, with what that rests on, and puts it first where it's within half a point of the
 *   top (`RECOMMEND.recurringWithin`). An input at full or under the floor isn't brought back.
 * - A director's note on the craft whose problem is a limit on it (`limit:`, `systems/production.ts` `noteText`) says
 *   it's held back that many of the actor's pieces before this.
 * Every figure in both stays what it was without it (`tests/defects-r8-1.test.ts`).
 */

import type { Person } from '../domain/model';
import { BRIEF_BY_ID } from '../content/briefs';
import { DIMENSION_LABEL, TASK_PROFILES, type Dimension } from '../content/tasks';
import { AXES, APPROACH_EFFECT } from '../content/approaches';
import { ADJUSTMENTS, type AdjustmentId } from '../content/workbook';
import type { Axis, AxisValue } from '../content/material';
import { FEATURE_LABEL, EXPERIENCE } from './experience';
import { journeyOf } from './evaluation';
import { LEARNING, noteSubject } from './learning';

export const ARTISTRY = {
  /** How many pieces judged before anything is named a pattern, and how many choices before a habit. */
  least: 6, habitAt: 5,
  /** A dimension this far over the actor's own mean, across the pieces that read it, is a strength. */
  strongBy: 4,
  /** A habit is a side chosen this share of the time on its axis. */
  habitShare: 0.7,
  /** The pieces a strength is read across: the latest. */
  recent: 40,
} as const;

/** One line of the identity, with what it rests on. */
export interface Line { label: string; line: string; evidence: string[] }

export interface Identity {
  /** Pieces judged for life, and whether there's enough to name patterns. */
  pieces: number;
  early: boolean;
  strengths: Line[];
  weaknesses: Line[];
  familiar: Line[];
  unfamiliar: string[];
  habits: Line[];
  versatility: Line;
  direction?: Line;
  reliability?: Line;
  collaboration?: Line;
  /**
   * The weakness that recurs most for life: its target and label, the pieces it has held back and the points of the whole
   * it cost them in all, the last it held back, and its evidence as What Keeps Holding It Back says it. Read by
   * the brief suggestions, and from later on 2026-10-12 by `recommendations` and a director's craft note on it, which
   * until then didn't read it (this said so then, and kept only the target and the label).
   */
  recurring?: { target: string; label: string; pieces: number; whole: number; last: number; evidence: string[] };
  /** A material feature never met, for a suggestion. */
  untried?: string;
  /** A habit, for a suggestion to play it the other way. */
  habit?: { axis: Axis; side: AxisValue };
}

const r1 = (x: number) => Math.round(x * 10) / 10;

export function identityOf(person: Person): Identity {
  const j = person.journey ?? journeyOf({ ...person } as Person);
  const pieces = Object.values(j.totals ?? {}).reduce((a, t) => a + (t?.n ?? 0), 0);
  const early = pieces < ARTISTRY.least;
  const work = [...(person.work ?? [])].sort((a, b) => a.at - b.at).slice(-ARTISTRY.recent);

  // Strengths: a dimension the actor's work comes out higher in than their own mean, across the pieces that read it.
  const strengths: Line[] = [];
  if (!early && work.length >= ARTISTRY.least) {
    const mean = work.reduce((a, w) => a + w.overall, 0) / work.length;
    const byDim = new Map<Dimension, { sum: number; n: number; best: { what: string; q: number }[] }>();
    for (const w of work) for (const [d, q] of Object.entries(w.dims) as [Dimension, number][]) {
      const x = byDim.get(d) ?? { sum: 0, n: 0, best: [] };
      x.sum += q; x.n += 1; x.best.push({ what: w.what, q });
      byDim.set(d, x);
    }
    for (const [d, x] of byDim) {
      if (x.n < ARTISTRY.least) continue;
      const m = x.sum / x.n;
      if (m - mean >= ARTISTRY.strongBy) strengths.push({ label: DIMENSION_LABEL[d], line: `Your ${DIMENSION_LABEL[d].toLowerCase()} runs ahead of the rest: ${r1(m)} on average across ${x.n} pieces, against ${r1(mean)} overall.`, evidence: x.best.sort((a, b) => b.q - a.q).slice(0, 3).map((b) => `${b.what}: ${r1(b.q)}`) });
    }
    strengths.sort((a, b) => a.label.localeCompare(b.label));
  }

  // Recurring weaknesses, for life: what has held the most pieces back, by the points of the whole it cost.
  const weaknesses: Line[] = [];
  let recurring: Identity['recurring'];
  if (!early) {
    const ranked = Object.entries(j.limits ?? {}).filter(([, t]) => t.n >= 3).sort((a, b) => b[1].whole - a[1].whole);
    for (const [k, t] of ranked.slice(0, 3)) {
      const [kind, what] = k.split(':') as [string, string];
      const line: Line = { label: t.label, line: `${t.label} has held back ${t.n} pieces, about ${r1(t.whole / t.n)} points off the whole each.`, evidence: [`${kind === 'ability' ? 'An ability' : kind === 'technique' ? 'A technique' : kind === 'preparation' ? 'Preparation' : kind === 'condition' ? 'The day' : 'The choice'}, ${r1(t.whole)} points in all`] };
      weaknesses.push(line);
      if (!recurring && (kind === 'ability' || kind === 'technique')) recurring = { target: what, label: t.label, pieces: t.n, whole: r1(t.whole), last: t.last, evidence: line.evidence };
    }
    // And the class's notes that keep coming back, open and given as often as the coursework calls one persistent, named
    // as the class names them (`noteSubject`). Until 2026-10-12 the line and its evidence printed the ledger's own key:
    // "A note on memorization", "The class’s notes: dim:memorization".
    const ledger = (person.school as { coursework?: { notes?: { key: string; status: string; given: number }[] } } | undefined)?.coursework?.notes ?? [];
    const back = ledger.filter((n) => n.status === 'open' && n.given >= LEARNING.persistent).sort((a, b) => b.given - a.given)[0];
    if (back) weaknesses.push({ label: 'A Note That Keeps Coming Back', line: `The same note has been given ${back.given} times and is still open: ${noteSubject(back.key)}.`, evidence: [`The class’s notes: ${noteSubject(back.key)}`] });
  }

  // Familiar and unfamiliar material: the features met and practised, and those never.
  const features = person.experience?.features ?? {};
  const familiar: Line[] = Object.entries(features)
    .map(([f, x]) => ({ f, n: x.met + x.practiced, best: x.best }))
    .filter((x) => x.n >= EXPERIENCE.fullAt && FEATURE_LABEL[x.f])
    .sort((a, b) => b.n - a.n)
    .slice(0, 4)
    .map((x) => ({ label: FEATURE_LABEL[x.f]!, line: `${FEATURE_LABEL[x.f]}: met or practiced ${x.n} times${x.best !== undefined ? `, best ${r1(x.best)}` : ''}.`, evidence: ['Your experience record'] }));
  const unfamiliar = Object.keys(FEATURE_LABEL).filter((f) => !((features[f]?.met ?? 0) + (features[f]?.practiced ?? 0))).map((f) => FEATURE_LABEL[f]!);
  const untried = Object.keys(FEATURE_LABEL).find((f) => !((features[f]?.met ?? 0) + (features[f]?.practiced ?? 0)));

  // Habits: the side of an axis chosen most of the time, once there are enough choices; and the readings' lean.
  // A habit is counted from the choices alone (from 2026-10-12), each side counted once as it's newly chosen
  // (`chooseBrief`); what was shown played that way is its evidence. Until then the choices and the showings were
  // summed, so one choice taped once counted two toward the five the Profile says a habit is named from, and every press
  // of the same choice counted again: a save from before keeps the choices it counted that way.
  const habits: Line[] = [];
  let habit: Identity['habit'];
  const chosen = person.experience?.approaches ?? {};
  for (const axis of Object.keys(AXES) as Axis[]) {
    const [a, b] = AXES[axis].values;
    const na = chosen[a]?.chosen ?? 0;
    const nb = chosen[b]?.chosen ?? 0;
    const n = na + nb;
    if (n < ARTISTRY.habitAt) continue;
    const [side, k] = na >= nb ? [a, na] : [b, nb];
    if (k / n >= ARTISTRY.habitShare) {
      habits.push({ label: `${APPROACH_EFFECT[side].label} ${AXES[axis].label}`, line: `You tend to play it ${APPROACH_EFFECT[side].label.toLowerCase()}: ${k} of your ${n} choices of ${AXES[axis].label.toLowerCase()}.`, evidence: [`Ways chosen: ${APPROACH_EFFECT[a].label} ${na}, ${APPROACH_EFFECT[b].label} ${nb}`, `Shown in work: ${APPROACH_EFFECT[a].label} ${chosen[a]?.shown ?? 0}, ${APPROACH_EFFECT[b].label} ${chosen[b]?.shown ?? 0}`] });
      habit ??= { axis, side };
    }
  }
  const takes = Object.entries(person.briefs ?? {}).flatMap(([id, r]) => r.takes.map((t) => ({ id, reading: t.reading })));
  if (takes.length >= ARTISTRY.habitAt) {
    const lean = new Map<Dimension, number>();
    for (const t of takes) {
      const reading = BRIEF_BY_ID[t.id]?.readings.find((x) => x.id === t.reading);
      const top = reading ? (Object.entries(reading.lean) as [Dimension, number][]).sort((x, y) => y[1] - x[1])[0] : undefined;
      if (top) lean.set(top[0], (lean.get(top[0]) ?? 0) + 1);
    }
    const [d, n] = [...lean.entries()].sort((x, y) => y[1] - x[1])[0] ?? [];
    if (d && n && n / takes.length >= ARTISTRY.habitShare) habits.push({ label: `Readings Toward ${DIMENSION_LABEL[d]}`, line: `The readings you choose lean toward ${DIMENSION_LABEL[d].toLowerCase()}: ${n} of ${takes.length} takes.`, evidence: [`${takes.length} takes of briefs`] });
  }

  // Versatility: kinds of work, genres worked in, features met.
  const kindIds = Object.entries(j.totals ?? {}).filter(([, t]) => (t?.n ?? 0) > 0).map(([k]) => k);
  const kinds = kindIds.length;
  // Its evidence names the kinds, where it was “Kinds of work on your record: 4”, the figure the line had just given
  // (from 2026-10-19, brief 15).
  const kindNames = kindIds.map((k) => TASK_PROFILES[k]?.label ?? k);
  const named = kindNames.length > 1 ? `${kindNames.slice(0, -1).join(', ')} and ${kindNames.at(-1)}` : kindNames[0] ?? 'Your work record';
  const genres = Object.values(person.engagement?.byGenre ?? {}).filter((g) => (g.practice ?? 0) > 0).length;
  const met = Object.keys(FEATURE_LABEL).length - unfamiliar.length;
  const versatility: Line = { label: 'Range', line: `${kinds} kinds of work judged, ${genres} genres worked in, ${met} of ${Object.keys(FEATURE_LABEL).length} kinds of material met.`, evidence: [named] };

  // Response to direction, for life.
  let direction: Line | undefined;
  const dir = j.direction;
  if (dir && dir.given >= 3) {
    const way = (Object.entries(dir.ways) as [AdjustmentId | 'callback', number][]).sort((a, b) => b[1] - a[1])[0];
    const wayLabel = way ? (way[0] === 'callback' ? 'a callback taken as asked' : ADJUSTMENTS[way[0] as AdjustmentId]?.label.toLowerCase() ?? way[0]) : undefined;
    direction = { label: 'Taking Direction', line: `Of ${dir.given} notes and requests on your craft, you answered ${dir.answered || 'none'}${wayLabel ? `. The way you reach for most: ${wayLabel} (${way![1]})` : ''}.`, evidence: [`${dir.given} notes given, ${dir.worked} worked on and ${dir.answered} answered`] };
  }

  // Reliability: calls kept, partners not stood up. The calls are the whole program's, the terms before this one's
  // (`SchoolRecord.callsBefore`) with this term's, from 2026-10-12: until then this term's tally alone was read, so the
  // line started again with each term and was gone until six more calls were made.
  let reliability: Line | undefined;
  const school = person.school as { tally?: { calls: number; answered: number }; callsBefore?: { calls: number; answered: number } } | undefined;
  const calls = school?.tally ? (school.callsBefore?.calls ?? 0) + school.tally.calls : 0;
  const answered = school?.tally ? (school.callsBefore?.answered ?? 0) + school.tally.answered : 0;
  const mates = person.school?.classmates ?? [];
  const missedByYou = mates.reduce((a, m) => a + ((m as { missedByYou?: number }).missedByYou ?? 0), 0);
  const kept = mates.reduce((a, m) => a + ((m as { kept?: number }).kept ?? 0), 0);
  if (calls >= ARTISTRY.least) reliability = { label: 'Reliability', line: `${answered} of ${calls} calls answered; ${kept} rehearsals with a partner kept${missedByYou ? `, ${missedByYou} missed by you` : ''}.`, evidence: [`The school’s record of calls; your partners’ records`] };

  // Collaboration: work played with others.
  let collaboration: Line | undefined;
  const tog = j.together;
  if (tog && tog.n >= 3) collaboration = { label: 'Playing With Others', line: `${tog.n} pieces played with a partner, a reader or a company came to ${r1(tog.sum / tog.n)} together on average${tog.slips ? `; of ${tog.slips === 1 ? 'the 1 slip' : `${tog.slips} slips`} by the others, you covered ${tog.covered === 0 ? 'none' : tog.covered === tog.slips ? (tog.slips === 1 ? 'it' : 'all of them') : tog.covered}` : ''}.`, evidence: [`${tog.n} scenes, takes and nights with others`] };

  return { pieces, early, strengths, weaknesses, familiar, unfamiliar, habits, versatility, ...(direction ? { direction } : {}), ...(reliability ? { reliability } : {}), ...(collaboration ? { collaboration } : {}), ...(recurring ? { recurring } : {}), ...(untried ? { untried } : {}), ...(habit ? { habit } : {}) };
}
