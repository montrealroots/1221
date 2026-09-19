/**
 * SLATE — the public commercial run.
 *
 * Distribution accounting and public performance are two different truths.
 * `world/selling.ts` already knows what money the distributor eventually
 * reports through the contractual windows. This module tells the player how
 * the release itself behaved: reviews, word of mouth, opening strength and the
 * weekly theatrical run.
 *
 * The lifetime take is still decided once at sale. Week-by-week grosses are a
 * deterministic decomposition of the theatrical share of that take, so the
 * public box office can never disagree with the accounting underneath it.
 */

import type { Simulation } from '../core/simulation';
import { formatMoneyCompact, type Money } from '../core/money';
import { MS_DAY, type Instant } from '../core/time';
import { clamp } from '../core/rng';
import type { CommercialRun, Project } from '../domain/company';
import { WINDOWS, dealById } from '../content/selling';
import {
  castOn,
  castSpark,
  castsAppeal,
  castsPrestige,
} from '../world/casting';
import { marketingAwareness } from './marketing';

export const COMMERCIAL_RELEASE_KIND = 'production.commercial.release';
export const COMMERCIAL_WEEK_KIND = 'production.commercial.week';
export const THEATRICAL_WEEKS = 12;
const MS_WEEK = 7 * MS_DAY;

export interface CommercialSignals {
  criticScore: number;
  audienceScore: number;
  wordOfMouth: number;
  awareness: number;
}

function middle(value: number | undefined, neutral = 50): number {
  return value === undefined ? neutral : clamp(value, 0, 100);
}

/**
 * The public response to the finished picture.
 *
 * Critics lean toward screenplay and performance truth. Audiences also care
 * about how the cast reads, chemistry and whether they already wanted to see
 * those people. Prestige is deliberately a small critic term rather than a
 * giant multiplier: prior respect can get a picture taken seriously, but it
 * cannot make a bad picture good.
 */
export function commercialSignals(sim: Simulation, project: Project): CommercialSignals {
  const story = middle(project.development?.screenplay.quality);
  const truth = middle(castOn(sim, project, 'truth'));
  const reads = middle(castOn(sim, project, 'reads'));
  const spark = middle(castSpark(sim, project));
  const appeal = middle(castsAppeal(sim, project));
  const prestige = middle(castsPrestige(sim, project), 0);
  const awareness = middle(marketingAwareness(project));

  const criticScore = clamp(Math.round(
    story * 0.40
      + truth * 0.34
      + spark * 0.16
      + prestige * 0.10,
  ), 0, 100);

  const audienceScore = clamp(Math.round(
    story * 0.24
      + truth * 0.24
      + reads * 0.20
      + spark * 0.16
      + appeal * 0.16,
  ), 0, 100);

  // Audience reaction drives the legs; critics move the conversation but do
  // not get to overrule the people actually buying the next week's ticket.
  const wordOfMouth = clamp(Math.round(audienceScore * 0.78 + criticScore * 0.22), 0, 100);

  return { criticScore, audienceScore, wordOfMouth, awareness };
}

/**
 * Breaks one known theatrical total into a twelve-week public run.
 *
 * Awareness makes the release more front-loaded: more people arrive at once.
 * Word of mouth gives it legs: each following week holds more of the previous
 * one. The weights are normalised back to the contractual theatrical total so
 * this display can never mint or lose a euro.
 */
export function weeklyTheatricalPlan(
  totalCents: Money,
  awareness: number,
  wordOfMouth: number,
  weeks = THEATRICAL_WEEKS,
): Money[] {
  const total = Math.max(0, Math.round(totalCents));
  if (total === 0 || weeks <= 0) return [];

  const aware = clamp(awareness, 0, 100);
  const wom = clamp(wordOfMouth, 0, 100);

  const opening = 0.82 + (aware / 100) * 0.46;
  const hold = clamp(0.43 + (wom / 100) * 0.34 - (aware / 100) * 0.04, 0.40, 0.78);

  const weights: number[] = [];
  let weight = opening;
  for (let week = 0; week < weeks; week += 1) {
    weights.push(weight);
    weight *= hold;
  }

  const sum = weights.reduce((n, one) => n + one, 0);
  const out = weights.map((one) => Math.max(0, Math.round(total * one / sum)));

  // Rounding belongs in the last week so every planned public gross adds back
  // to the same theatrical receipt the distributor accounting uses.
  const rounded = out.reduce((n, one) => n + one, 0);
  out[out.length - 1] = Math.max(0, out[out.length - 1]! + total - rounded);
  return out;
}

function theatricalTarget(project: Project): Money {
  const deal = project.dealId ? dealById(project.dealId) : undefined;
  const theatrical = WINDOWS.find((one) => one.id === 'theatrical');
  if (!deal || !theatrical || deal.reach <= 0) return 0;
  return Math.max(0, Math.round((project.takeCents ?? 0) * deal.reach * theatrical.share));
}

export function buildCommercialRun(sim: Simulation, project: Project): CommercialRun {
  const signals = commercialSignals(sim, project);
  const target = theatricalTarget(project);
  return {
    ...signals,
    theatricalTargetCents: target,
    plannedWeeklyCents: weeklyTheatricalPlan(
      target,
      signals.awareness,
      signals.wordOfMouth,
    ),
    weeks: [],
  };
}

/**
 * Arms the release after a sale.
 *
 * Idempotent by design: a retry of the sale command cannot schedule a second
 * theatrical run because `sellIt` itself refuses a second sale, and this also
 * refuses to overwrite an already-built public run.
 */
export function armCommercialRun(sim: Simulation, project: Project): void {
  if (project.commercial || project.releasedAt === undefined) return;
  project.commercial = buildCommercialRun(sim, project);

  sim.schedule({
    at: project.releasedAt,
    kind: COMMERCIAL_RELEASE_KIND,
    label: project.title + ': Release',
    category: 'business',
    priority: 64,
    payload: { projectId: project.id },
    refType: 'project',
    refId: project.id,
  });

  for (let index = 0; index < project.commercial.plannedWeeklyCents.length; index += 1) {
    sim.schedule({
      at: project.releasedAt + index * MS_WEEK,
      kind: COMMERCIAL_WEEK_KIND,
      label: project.title + ': Box Office Week ' + (index + 1),
      category: 'business',
      priority: 65,
      payload: { projectId: project.id, week: index + 1 },
      refType: 'project',
      refId: project.id,
    });
  }
}

function openRelease(sim: Simulation, project: Project): void {
  const run = project.commercial;
  if (!run || run.openedAt !== undefined) return;
  run.openedAt = sim.now;

  const body = run.theatricalTargetCents > 0
    ? 'Critics are at ' + run.criticScore + '/100 and audiences are at '
      + run.audienceScore + '/100. The theatrical run is now live.'
    : 'Critics are at ' + run.criticScore + '/100 and audiences are at '
      + run.audienceScore + '/100. This release has no theatrical box-office run.';

  sim.notify({
    category: 'business',
    title: project.title + ' Is Out',
    body,
    importance: 70,
    refType: 'project',
    refId: project.id,
  });

  if (run.plannedWeeklyCents.length === 0) run.completedAt = sim.now;
}

function recordWeek(sim: Simulation, project: Project, week: number): void {
  const run = project.commercial;
  if (!run || week < 1 || week > run.plannedWeeklyCents.length) return;
  if (run.weeks.some((one) => one.week === week)) return;

  const grossCents = run.plannedWeeklyCents[week - 1] ?? 0;
  const prior = run.weeks.reduce((n, one) => n + one.grossCents, 0);
  run.weeks.push({
    week,
    at: sim.now,
    grossCents,
    cumulativeCents: prior + grossCents,
  });
  run.weeks.sort((a, b) => a.week - b.week);

  if (week === 1) {
    sim.notify({
      category: 'business',
      title: project.title + ': Opening Week',
      body: formatMoneyCompact(grossCents) + ' at the box office. Word of mouth is '
        + run.wordOfMouth + '/100.',
      importance: 72,
      refType: 'project',
      refId: project.id,
    });
  }

  if (week === run.plannedWeeklyCents.length) {
    run.completedAt = sim.now;
    const total = run.weeks.reduce((n, one) => n + one.grossCents, 0);
    sim.notify({
      category: 'business',
      title: project.title + ': Theatrical Run Complete',
      body: 'The twelve-week run closes at ' + formatMoneyCompact(total) + '.',
      importance: 60,
      refType: 'project',
      refId: project.id,
    });
  }
}

export function registerCommercial(sim: Simulation): void {
  sim.onSchedule(COMMERCIAL_RELEASE_KIND, (item, s) => {
    const project = s.universe.projects[String(item.payload?.projectId ?? '')];
    if (!project || project.shelvedAt) return;
    openRelease(s, project);
  });

  sim.onSchedule(COMMERCIAL_WEEK_KIND, (item, s) => {
    const project = s.universe.projects[String(item.payload?.projectId ?? '')];
    const week = Number(item.payload?.week ?? 0);
    if (!project || project.shelvedAt || !Number.isFinite(week)) return;
    recordWeek(s, project, Math.round(week));
  });
}
