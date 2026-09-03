/**
 * SLATE — Awards and festivals.
 *
 * Awards are edition-specific. The 97th Vanguards is a different object from
 * the 98th, with its own eligibility window, its own nominees and its own
 * result. Once an edition is finalised it never changes: history stays stable
 * even as the rules version moves on.
 *
 * Voting is deterministic from modelled inputs, and the audit records only what
 * the player could actually know. Ballots are private.
 */

import { categoryAdmits, performerTitleOf } from '../core/performer';
import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { AwardEdition, AwardNomination, FestivalSubmission, Id, Project } from '../domain/model';
import { clamp, remap } from '../core/rng';
import { addDays, addYears, formatDate, instantFromZoned, zonedParts, MS_DAY } from '../core/time';
import { applyRate, formatMoney, formatMoneyCompact, type Money } from '../core/money';
import { AWARD_BODIES, AWARD_BODY_BY_ID, FESTIVALS, FESTIVAL_BY_ID } from '../content/industry';
import { CITIES } from '../content/geography';

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export function registerAwards(sim: Simulation): void {
  sim.onSchedule('award.nominations', (item) => announceNominations(sim, item.payload.editionId as Id));
  sim.onSchedule('award.ceremony', (item) => holdCeremony(sim, item.payload.editionId as Id));
  sim.onSchedule('award.season_setup', () => {
    setUpSeason(sim, zonedParts(sim.now, sim.homeZone).year + 1);
    sim.schedule({
      at: addYears(sim.now, 1, sim.homeZone),
      kind: 'award.season_setup',
      label: 'Awards Season',
      category: 'system',
      priority: 80,
    });
  });
  sim.onSchedule('fest.decision', (item) => decideFestivalSubmission(sim, item.payload.submissionId as Id));
  sim.onSchedule('fest.screening', (item) => holdScreening(sim, item.payload.submissionId as Id));

  // --- Campaigning ---------------------------------------------------------

  sim.onCommand<{ projectId: Id; bodyId: string; categories: string[]; spend: Money; accountId?: Id }, { nominationIds: Id[]; spent: Money }>(
    'award.campaign',
    (p, { sim: s }) => {
      const project = s.universe.projects[p.projectId];
      if (!project) throw new CommandError('No such project.');
      const body = AWARD_BODY_BY_ID[p.bodyId];
      if (!body) throw new CommandError('No such awards body.');

      const edition = currentEditionFor(s, p.bodyId);
      if (!edition) throw new CommandError(`There is no upcoming ${body.name} edition to campaign for.`);
      if (edition.finalised) throw new CommandError(`The ${ordinal(edition.editionNumber)} ${body.name} is already decided. Finalised history does not change.`);

      const eligible = isEligible(s, project, edition);
      if (!eligible.ok) throw new CommandError(eligible.reason);

      for (const category of p.categories) {
        if (!body.categories.includes(category)) {
          throw new CommandError(`${body.name} does not have a category called "${category}".`);
        }
        if (isPerformanceCategory(category) && !pickNomineeFor(s, project, category)) {
          throw new CommandError(`${project.title} has nobody in its cast that ${category} could go to.`);
        }
      }

      const accountId = p.accountId
        ?? (project.ownerCompanyId ? s.universe.companies[project.ownerCompanyId]?.cashAccountId : undefined)
        ?? s.player.primaryAccountId;
      if (!accountId) throw new CommandError('No account to fund the campaign from.');
      if (s.ledger.availableFunds(accountId) < p.spend) {
        throw new CommandError(`An awards campaign at ${formatMoney(p.spend)} is more than you can currently fund.`);
      }
      s.expense(accountId, p.spend, `${body.shortName} campaign — ${project.title}`, 'marketing', { refType: 'project', refId: project.id });

      // Spend is split across the categories entered.
      const perCategory = Math.round(p.spend / Math.max(1, p.categories.length));
      const ids: Id[] = [];
      for (const category of p.categories) {
        const existing = Object.values(s.universe.awardNominations).find(
          (n) => n.editionId === edition.id && n.category === category && n.projectId === project.id,
        );
        if (existing) {
          existing.campaignSpend += perCategory;
          ids.push(existing.id);
          continue;
        }
        // A campaign entry is not a nomination. It is a submission for consideration.
        const entry: AwardNomination = {
          id: s.nextId('nom'),
          saveId: s.universe.meta.id,
          editionId: edition.id,
          bodyId: body.id,
          category,
          projectId: project.id,
          personId: pickNomineeFor(s, project, category),
          announcedAt: 0,
          campaignSpend: perCategory,
        };
        s.universe.awardNominations[entry.id] = entry;
        ids.push(entry.id);
      }

      s.emit('award.campaign_started', { projectId: project.id, bodyId: body.id, editionId: edition.id, spend: p.spend, categories: p.categories });
      return { nominationIds: ids, spent: p.spend };
    },
  );

  // --- Festivals -----------------------------------------------------------

  sim.onCommand<{ projectId: Id; festivalId: string; year?: number; accountId?: Id }, { submissionId: Id; decisionAt: number; fee: Money }>(
    'fest.submit',
    (p, { sim: s }) => {
      const project = s.universe.projects[p.projectId];
      if (!project) throw new CommandError('No such project.');
      const festival = FESTIVAL_BY_ID[p.festivalId];
      if (!festival) throw new CommandError('No such festival.');
      if (!project.finalQuality) throw new CommandError(`${project.title} is not finished. Festivals need a completed film.`);

      const year = p.year ?? nextFestivalYear(s, festival);
      const existing = Object.values(s.universe.festivalSubmissions).find(
        (f) => f.projectId === project.id && f.festivalId === festival.id && f.year === year,
      );
      if (existing) throw new CommandError(`${project.title} is already submitted to that edition.`);

      // Premiere status is the thing festivals actually police.
      if (festival.premiereRequirement === 'world') {
        const alreadyScreened = Object.values(s.universe.festivalSubmissions).some(
          (f) => f.projectId === project.id && f.status === 'screened',
        );
        if (alreadyScreened || project.releaseId) {
          throw new CommandError(
            `${festival.name} requires a world premiere. ${project.title} has already screened publicly, so it is not eligible.`,
          );
        }
      }

      const fee = Math.round(festival.submissionFee * 100);
      const accountId = p.accountId ?? s.player.primaryAccountId;
      if (!accountId || s.ledger.availableFunds(accountId) < fee) {
        throw new CommandError(`The submission fee is ${formatMoney(fee)}.`);
      }
      s.expense(accountId, fee, `${festival.name} submission — ${project.title}`, 'marketing', { refType: 'project', refId: project.id });

      const festivalDate = instantFromZoned({ year, month: festival.month, day: festival.day, hour: 19 }, s.homeZone);
      const decisionAt = addDays(festivalDate, -70, s.homeZone);

      const submission: FestivalSubmission = {
        id: s.nextId('nom'),
        saveId: s.universe.meta.id,
        festivalId: festival.id,
        year,
        projectId: project.id,
        submittedAt: s.now,
        fee,
        status: 'under_review',
        awardsWon: [],
        acquisitionOffers: [],
      };
      s.universe.festivalSubmissions[submission.id] = submission;

      s.schedule({
        at: Math.max(decisionAt, addDays(s.now, 21, s.homeZone)),
        kind: 'fest.decision',
        label: `${festival.name} decision — ${project.title}`,
        category: 'career',
        payload: { submissionId: submission.id },
        priority: 44,
        refType: 'project', refId: project.id,
      });

      s.emit('fest.submitted', { submissionId: submission.id, festivalId: festival.id, projectId: project.id, year });
      return { submissionId: submission.id, decisionAt, fee };
    },
  );

  sim.onCommand<{ submissionId: Id; offerIndex: number }, { accepted: boolean; amount: Money }>(
    'fest.accept_acquisition',
    (p, { sim: s }) => {
      const submission = s.universe.festivalSubmissions[p.submissionId];
      if (!submission) throw new CommandError('No such submission.');
      const offer = submission.acquisitionOffers[p.offerIndex];
      if (!offer) throw new CommandError('That offer is not on the table.');
      if (offer.accepted) throw new CommandError('That offer has already been accepted.');

      const project = s.universe.projects[submission.projectId];
      if (!project) throw new CommandError('No such project.');

      offer.accepted = true;
      const payee = project.ownerCompanyId
        ? s.universe.companies[project.ownerCompanyId]?.cashAccountId
        : s.universe.people[project.createdById]?.primaryAccountId;
      if (payee) {
        s.income(payee, offer.amount, `${offer.buyerName} — acquisition of ${project.title}`, 'royalty', { refType: 'project', refId: project.id });
      }
      project.distributorName = offer.buyerName;
      project.totalRevenue += offer.amount;

      s.resolveDecision('festival_submission', submission.id);
      s.remember({
        category: 'project',
        title: `${offer.buyerName} acquired ${project.title}`,
        detail: `${formatMoneyCompact(offer.amount)} for ${offer.territories.join(', ')} out of ${FESTIVAL_BY_ID[submission.festivalId]?.name}.`,
        refs: [{ type: 'project', id: project.id }],
        significance: 76, public: true, amount: offer.amount,
      });
      s.emit('fest.acquired', { projectId: project.id, buyerName: offer.buyerName, amount: offer.amount });
      return { accepted: true, amount: offer.amount };
    },
  );
}

// ---------------------------------------------------------------------------
// Season setup
// ---------------------------------------------------------------------------

/** Creates the editions for a ceremony year. Called once per year. */
export function setUpSeason(sim: Simulation, ceremonyYear: number): void {
  for (const body of AWARD_BODIES) {
    const exists = Object.values(sim.universe.awardEditions).some((e) => e.bodyId === body.id && e.year === ceremonyYear);
    if (exists) continue;

    const ceremonyAt = instantFromZoned({ year: ceremonyYear, month: body.ceremonyMonth, day: body.ceremonyDay, hour: 17 }, sim.homeZone);
    // Television bodies judge a June-to-May window; film bodies the prior year.
    const eligibilityStart = body.kind === 'television'
      ? instantFromZoned({ year: ceremonyYear - 1, month: 6, day: 1 }, sim.homeZone)
      : instantFromZoned({ year: ceremonyYear - 1, month: 1, day: 1 }, sim.homeZone);
    const eligibilityEnd = body.kind === 'television'
      ? instantFromZoned({ year: ceremonyYear, month: 5, day: 31, hour: 23, minute: 59 }, sim.homeZone)
      : instantFromZoned({ year: ceremonyYear - 1, month: 12, day: 31, hour: 23, minute: 59 }, sim.homeZone);

    const nominationsAt = addDays(ceremonyAt, -38, sim.homeZone);
    const baseEdition = body.id === 'vanguard' ? 96 : body.id === 'beacon' ? 76 : body.id === 'continental' ? 82 : 40;

    // A season that was already over when the save began is history, not work.
    // Scheduling it would run seven ceremonies on the player's first morning
    // and stamp last winter's winners with today's date.
    const concluded = ceremonyAt < sim.now;

    const edition: AwardEdition = {
      id: sim.nextId('award'),
      saveId: sim.universe.meta.id,
      bodyId: body.id,
      editionNumber: baseEdition + (ceremonyYear - 2025),
      year: ceremonyYear,
      ceremonyAt,
      nominationsAnnouncedAt: nominationsAt,
      eligibilityStart,
      eligibilityEnd,
      status: concluded ? 'complete' : 'upcoming',
      finalised: concluded,
      ...(concluded ? { predatesSave: true } : {}),
    };
    sim.universe.awardEditions[edition.id] = edition;
    if (concluded) continue;

    sim.schedule({
      // Nominations that would land before the save opened are announced now
      // instead. The ceremony is still ahead, so the season can still run.
      at: Math.max(nominationsAt, sim.now),
      kind: 'award.nominations',
      label: `${ordinal(edition.editionNumber)} ${body.name} nominations`,
      category: 'awards',
      payload: { editionId: edition.id },
      priority: 34,
      refType: 'award_edition', refId: edition.id,
    });
    const item = sim.schedule({
      at: ceremonyAt,
      kind: 'award.ceremony',
      label: `${ordinal(edition.editionNumber)} ${body.name}`,
      category: 'awards',
      payload: { editionId: edition.id },
      priority: 22,
      refType: 'award_edition', refId: edition.id,
      requiresPlayer: false,
      durationMinutes: 240,
    });
    edition.scheduledItemId = item.id;
  }
}

export function currentEditionFor(sim: Simulation, bodyId: string): AwardEdition | undefined {
  return Object.values(sim.universe.awardEditions)
    .filter((e) => e.bodyId === bodyId && !e.finalised && e.ceremonyAt > sim.now)
    .sort((a, b) => a.ceremonyAt - b.ceremonyAt)[0];
}

export function isEligible(sim: Simulation, project: Project, edition: AwardEdition): { ok: true } | { ok: false; reason: string } {
  const body = AWARD_BODY_BY_ID[edition.bodyId];
  if (!body) return { ok: false, reason: 'Unknown awards body.' };

  if (!project.releaseDate) {
    return { ok: false, reason: `${project.title} has no release date, so it is not eligible for anything yet.` };
  }
  if (project.releaseDate < edition.eligibilityStart || project.releaseDate > edition.eligibilityEnd) {
    return {
      ok: false,
      reason: `The ${ordinal(edition.editionNumber)} ${body.name} covers releases between ${formatDate(edition.eligibilityStart, sim.homeZone)} and ${formatDate(edition.eligibilityEnd, sim.homeZone)}. ${project.title} opened ${formatDate(project.releaseDate, sim.homeZone)}.`,
    };
  }

  const isSeries = project.format === 'series' || project.format === 'limited_series';
  if (body.kind === 'film' && isSeries) {
    return { ok: false, reason: `${body.name} is a film body. ${project.title} is television.` };
  }
  if (body.kind === 'television' && !isSeries) {
    return { ok: false, reason: `${body.name} is a television body. ${project.title} is a feature.` };
  }
  const release = project.releaseId ? sim.universe.releases[project.releaseId] : undefined;
  if (body.id === 'vanguard' && release && release.theaterCount === 0) {
    return { ok: false, reason: `${body.name} requires a qualifying theatrical run. ${project.title} did not have one.` };
  }
  return { ok: true };
}

/** A category that goes to a performer rather than to the film or its makers. */
function isPerformanceCategory(category: string): boolean {
  const lower = category.toLowerCase();
  return ['actor', 'actress', 'lead', 'supporting', 'performance'].some((word) => lower.includes(word))
    && !lower.includes('director') && !lower.includes('screenplay') && !lower.includes('writing');
}

/**
 * Who a category goes to.
 *
 * A performance category is named for a title, and the cast is read in that
 * light: the lead first, then the rest, and the first of them the category
 * admits is the nominee. A film whose lead is an actress is not a Best Actor
 * nominee however good it was; if nobody in the cast fits, nobody is named.
 */
function pickNomineeFor(sim: Simulation, project: Project, category: string): Id | undefined {
  const lower = category.toLowerCase();
  if (lower.includes('director')) return project.directorId;
  if (lower.includes('screenplay') || lower.includes('writing')) return project.writerIds[0];
  if (isPerformanceCategory(category)) {
    const leads = project.attachments.filter((a) => a.role === 'lead').map((a) => a.personId);
    for (const id of [...leads, ...project.castIds]) {
      const person = sim.universe.people[id];
      if (person && categoryAdmits(category, performerTitleOf(person))) return id;
    }
    return undefined;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Nominations and voting
// ---------------------------------------------------------------------------

/**
 * Voting strength. Merit dominates, campaign spend matters at the margin, and
 * precursor wins carry real momentum — which is how awards seasons behave.
 */
function votingScore(sim: Simulation, nomination: AwardNomination, edition: AwardEdition): number {
  const project = nomination.projectId ? sim.universe.projects[nomination.projectId] : undefined;
  if (!project) return 0;
  const body = AWARD_BODY_BY_ID[edition.bodyId];

  const quality = project.finalQuality ?? 50;
  const critics = project.criticScore ?? quality;
  const prestigeGenre = project.genres.some((g) => ['drama', 'biography', 'war', 'documentary'].includes(g)) ? 8 : 0;
  const populistPenalty = project.genres.some((g) => ['horror', 'comedy', 'action'].includes(g)) && (body?.prestige ?? 50) > 80 ? -6 : 0;

  // Campaign spend has real but sharply diminishing influence.
  const campaignEffect = remap(Math.log10(nomination.campaignSpend / 100 + 1), 0, 6.5, 0, 14);

  // Precursors: winning the guilds moves the main ceremony.
  const precursorWins = Object.values(sim.universe.awardNominations).filter(
    (n) => n.projectId === project.id && n.won && n.bodyId !== edition.bodyId
      && Math.abs((sim.universe.awardEditions[n.editionId]?.year ?? 0) - edition.year) <= 1,
  ).length;
  const precursorEffect = Math.min(18, precursorWins * 6);

  const nominee = nomination.personId ? sim.universe.people[nomination.personId] : undefined;
  const nomineeStanding = nominee ? nominee.reputation.prestige * 0.6 + nominee.reputation.professionalReputation * 0.4 : 50;

  const rng = sim.rng('voting', edition.id, nomination.id);
  const tasteNoise = rng.normal(0, 7);

  return clamp(
    quality * 0.34 + critics * 0.24 + nomineeStanding * 0.14
    + campaignEffect + precursorEffect + prestigeGenre + populistPenalty + tasteNoise,
    0, 130,
  );
}

function announceNominations(sim: Simulation, editionId: Id): void {
  const edition = sim.universe.awardEditions[editionId];
  if (!edition || edition.status !== 'upcoming') return;
  const body = AWARD_BODY_BY_ID[edition.bodyId];
  if (!body) return;

  edition.status = 'nominated';

  // Everything eligible gets considered, campaigned or not.
  const contenders = Object.values(sim.universe.projects).filter((p) => isEligible(sim, p, edition).ok);
  const entries = Object.values(sim.universe.awardNominations).filter((n) => n.editionId === edition.id);

  for (const category of body.categories) {
    const pool: AwardNomination[] = entries.filter((n) => n.category === category);

    // The world nominates things the player never campaigned for.
    for (const project of contenders) {
      if (pool.some((n) => n.projectId === project.id)) continue;
      const merit = (project.finalQuality ?? 0) * 0.6 + (project.criticScore ?? 0) * 0.4;
      if (merit < 58) continue;
      const rng = sim.rng('auto_nom', edition.id, category, project.id);
      if (!rng.chance(remap(merit, 58, 95, 0.12, 0.8))) continue;
      const personId = pickNomineeFor(sim, project, category);
      if (isPerformanceCategory(category) && !personId) continue;
      const auto: AwardNomination = {
        id: sim.nextId('nom'),
        saveId: sim.universe.meta.id,
        editionId: edition.id,
        bodyId: body.id,
        category,
        projectId: project.id,
        personId,
        announcedAt: 0,
        campaignSpend: 0,
      };
      sim.universe.awardNominations[auto.id] = auto;
      pool.push(auto);
    }

    if (pool.length === 0) continue;

    const ranked = pool
      .map((n) => ({ nomination: n, score: votingScore(sim, n, edition) }))
      .sort((a, b) => b.score - a.score);

    const slots = Math.min(5, ranked.length);
    const nominated = ranked.slice(0, slots);
    const missed = ranked.slice(slots);

    for (const { nomination } of nominated) {
      nomination.announcedAt = sim.now;
      const person = nomination.personId ? sim.universe.people[nomination.personId] : undefined;
      if (person && !person.nominationIds.includes(nomination.id)) person.nominationIds.push(nomination.id);

      const involvesPlayer = nomination.personId === sim.universe.playerId
        || (nomination.projectId && projectInvolvesPlayer(sim, nomination.projectId));
      if (involvesPlayer) {
        const project = nomination.projectId ? sim.universe.projects[nomination.projectId] : undefined;
        sim.notify({
          category: 'awards',
          title: `${body.shortName} nomination: ${category}`,
          body: `${project?.title ?? 'Your work'} is nominated at the ${ordinal(edition.editionNumber)} ${body.name}.`,
          importance: 88, route: '/workspace/awards',
        });
        sim.remember({
          category: 'award',
          title: `Nominated for ${category}`,
          detail: `${ordinal(edition.editionNumber)} ${body.name}${project ? ` for ${project.title}` : ''}.`,
          refs: [
            ...(nomination.projectId ? [{ type: 'project', id: nomination.projectId }] : []),
            ...(nomination.personId ? [{ type: 'person', id: nomination.personId }] : []),
          ],
          significance: 82, public: true,
        });
        if (person) person.reputation.prestige = clamp(person.reputation.prestige + 6, 0, 100);
      }
    }

    // Entries that did not make the cut are removed, not left pending.
    for (const { nomination } of missed) {
      if (nomination.campaignSpend > 0 && projectInvolvesPlayer(sim, nomination.projectId ?? '')) {
        sim.audit({
          kind: 'award.not_nominated', subjectType: 'project', subjectId: nomination.projectId ?? '',
          question: `Why was it not nominated for ${category}?`,
          summary: `It finished outside the ${slots} slots at the ${ordinal(edition.editionNumber)} ${body.name}.`,
          factors: [
            { label: 'The Film Itself', detail: 'Quality and critical standing carry most of the weight.', weight: 0.6, contribution: 0, knowable: true },
            { label: 'Campaign Spend', detail: `${formatMoney(nomination.campaignSpend)} behind this category. Spend helps at the margin and cannot replace the work.`, weight: 0.15, contribution: 0, knowable: true },
            { label: 'The Other Contenders', detail: 'What else was in the year, and what voters privately preferred.', weight: 0.25, contribution: 0, knowable: false },
          ],
          outcome: 'not nominated',
        });
      }
      delete sim.universe.awardNominations[nomination.id];
    }
  }

  sim.emit('award.nominations_announced', { editionId: edition.id, bodyId: body.id, year: edition.year });
}

function holdCeremony(sim: Simulation, editionId: Id): void {
  const edition = sim.universe.awardEditions[editionId];
  if (!edition || edition.finalised) return;
  const body = AWARD_BODY_BY_ID[edition.bodyId];
  if (!body) return;

  edition.status = 'complete';
  const nominations = Object.values(sim.universe.awardNominations).filter((n) => n.editionId === edition.id && n.announcedAt > 0);

  for (const category of body.categories) {
    const inCategory = nominations.filter((n) => n.category === category);
    if (inCategory.length === 0) continue;

    const ranked = inCategory
      .map((n) => ({ nomination: n, score: votingScore(sim, n, edition) }))
      .sort((a, b) => b.score - a.score);

    const winner = ranked[0];
    if (!winner) continue;

    for (const { nomination } of ranked) {
      nomination.won = nomination.id === winner.nomination.id;
      nomination.decidedAt = sim.now;
    }

    const project = winner.nomination.projectId ? sim.universe.projects[winner.nomination.projectId] : undefined;
    const person = winner.nomination.personId ? sim.universe.people[winner.nomination.personId] : undefined;

    // Winning changes a career materially.
    if (person) {
      person.reputation.prestige = clamp(person.reputation.prestige + remap(body.prestige, 40, 100, 6, 22), 0, 100);
      person.reputation.professionalReputation = clamp(person.reputation.professionalReputation + remap(body.prestige, 40, 100, 3, 12), 0, 100);
      person.reputation.industryDemand = clamp(person.reputation.industryDemand + remap(body.prestige, 40, 100, 4, 15), 0, 100);
      person.reputation.publicFame = clamp(person.reputation.publicFame + remap(body.prestige, 40, 100, 2, 9), 0, 100);
      if (body.prestige >= 88) person.quote = Math.round(person.quote * 1.25);
    }
    if (project && body.prestige >= 82) {
      // A major win extends a theatrical run and lifts library value.
      project.totalRevenue += applyRate(project.totalRevenue, 0.06);
    }

    const involvesPlayer = winner.nomination.personId === sim.universe.playerId
      || (winner.nomination.projectId && projectInvolvesPlayer(sim, winner.nomination.projectId));
    if (involvesPlayer) {
      sim.notify({
        category: 'awards',
        title: `You won ${category}`,
        body: `${ordinal(edition.editionNumber)} ${body.name}${project ? ` for ${project.title}` : ''}.`,
        importance: 98, route: '/workspace/awards',
      });
      sim.remember({
        category: 'award',
        title: `Won ${category}`,
        detail: `${ordinal(edition.editionNumber)} ${body.name}${project ? ` for ${project.title}` : ''}.`,
        refs: [
          ...(winner.nomination.projectId ? [{ type: 'project', id: winner.nomination.projectId }] : []),
          ...(winner.nomination.personId ? [{ type: 'person', id: winner.nomination.personId }] : []),
        ],
        significance: 96, public: true,
      });

      sim.audit({
        kind: 'award.won', subjectType: 'nomination', subjectId: winner.nomination.id,
        question: 'Why did this win?',
        summary: `${category} at the ${ordinal(edition.editionNumber)} ${body.name}.`,
        factors: [
          { label: 'The Work', detail: `Quality ${project?.finalQuality ?? '—'} and critics ${project?.criticScore ?? '—'} out of 100.`, weight: 0.55, contribution: 0, knowable: true },
          { label: 'Precursors', detail: 'Guild and critics wins earlier in the season build momentum voters follow.', weight: 0.2, contribution: 0, knowable: true },
          { label: 'Campaign', detail: `${formatMoney(winner.nomination.campaignSpend)} of campaign spend behind it.`, weight: 0.1, contribution: 0, knowable: true },
          { label: 'The Ballots', detail: 'Individual votes are secret. Nobody sees the count.', weight: 0.15, contribution: 0, knowable: false },
        ],
        outcome: 'won',
      });
    } else if (winner.nomination.projectId && nominations.some((n) => projectInvolvesPlayer(sim, n.projectId ?? '') && n.category === category && !n.won)) {
      sim.notify({
        category: 'awards',
        title: `${category} went to ${project?.title ?? 'another film'}`,
        body: `You were nominated at the ${ordinal(edition.editionNumber)} ${body.name} and did not win.`,
        importance: 70, route: '/workspace/awards',
      });
    }

    sim.emit('award.won', {
      editionId: edition.id, bodyId: body.id, category,
      projectId: winner.nomination.projectId, personId: winner.nomination.personId,
    });
  }

  // Finalised history is immutable from here.
  edition.finalised = true;
  sim.emit('award.ceremony_complete', { editionId: edition.id, bodyId: body.id, year: edition.year });
}

function projectInvolvesPlayer(sim: Simulation, projectId: Id): boolean {
  const project = sim.universe.projects[projectId];
  if (!project) return false;
  const playerId = sim.universe.playerId;
  return project.createdById === playerId
    || project.directorId === playerId
    || project.writerIds.includes(playerId)
    || project.producerIds.includes(playerId)
    || project.castIds.includes(playerId);
}

// ---------------------------------------------------------------------------
// Festivals
// ---------------------------------------------------------------------------

function nextFestivalYear(sim: Simulation, festival: (typeof FESTIVALS)[number]): number {
  const parts = zonedParts(sim.now, sim.homeZone);
  const thisYear = instantFromZoned({ year: parts.year, month: festival.month, day: festival.day }, sim.homeZone);
  return thisYear > addDays(sim.now, 90, sim.homeZone) ? parts.year : parts.year + 1;
}

function decideFestivalSubmission(sim: Simulation, submissionId: Id): void {
  const submission = sim.universe.festivalSubmissions[submissionId];
  if (!submission || submission.status !== 'under_review') return;
  const festival = FESTIVAL_BY_ID[submission.festivalId];
  const project = sim.universe.projects[submission.projectId];
  if (!festival || !project) return;

  const quality = project.finalQuality ?? 50;
  const rng = sim.rng('festival', submission.id);

  // Prestige festivals take fewer films and want particular ones.
  const artLean = project.genres.some((g) => ['drama', 'documentary', 'experimental', 'biography'].includes(g)) ? 10 : -6;
  const starDraw = project.castIds.reduce((s, id) => s + (sim.universe.people[id]?.reputation.publicFame ?? 0), 0) / Math.max(1, project.castIds.length);

  const merit = quality + artLean + remap(starDraw, 0, 100, 0, 8);
  const bar = remap(festival.prestige, 40, 100, 48, 86);
  const probability = clamp(remap(merit - bar, -30, 25, 0.02, 0.92), 0.01, 0.94);
  const roll = rng.next();
  const selected = roll < probability;

  submission.decisionAt = sim.now;

  sim.audit({
    kind: 'fest.decision', subjectType: 'project', subjectId: project.id,
    question: `Why did ${festival.name} take it, or not?`,
    summary: selected ? `Selected for ${festival.name}.` : `Not selected for ${festival.name}.`,
    factors: [
      { label: 'The Film', detail: `Quality ${quality} out of 100.`, weight: 0.55, contribution: quality * 0.55, knowable: true },
      { label: 'Programming Taste', detail: artLean > 0 ? 'This kind of film is squarely what they programme.' : 'This is not really their sort of film.', weight: 0.2, contribution: artLean, knowable: true },
      { label: 'Cast Draw', detail: 'Festivals need films that sell tickets and press too.', weight: 0.1, contribution: starDraw * 0.1, knowable: true },
      { label: 'The Rest Of The Slate', detail: 'How many slots were left and what else was submitted.', weight: 0.15, contribution: 0, knowable: false },
    ],
    seed: `festival|${submission.id}`, roll, probability, score: merit,
    outcome: selected ? 'selected' : 'rejected',
  });

  if (!selected) {
    submission.status = 'rejected';
    sim.notify({
      category: 'career', title: `${festival.name} passed on ${project.title}`,
      body: 'Not selected for this edition.',
      importance: 44, route: '/workspace/projects',
    });
    sim.emit('fest.rejected', { submissionId: submission.id, festivalId: festival.id, projectId: project.id });
    return;
  }

  submission.status = 'selected';
  submission.section = quality > 82 ? 'Main Competition' : quality > 68 ? 'Official Selection' : 'Discovery';
  const screeningAt = instantFromZoned(
    { year: submission.year, month: festival.month, day: festival.day + 1, hour: 20 },
    sim.homeZone,
  );
  submission.screeningAt = screeningAt;

  sim.schedule({
    at: screeningAt,
    kind: 'fest.screening',
    label: `${festival.name} — ${project.title} premiere`,
    category: 'career',
    payload: { submissionId: submission.id },
    priority: 26,
    refType: 'project', refId: project.id,
    requiresPlayer: true,
    locationId: festival.locationId,
    durationMinutes: 300,
  });

  sim.notify({
    category: 'career',
    title: `${project.title} selected for ${festival.name}`,
    body: `${submission.section}. Screening ${formatDate(screeningAt, sim.homeZone)} in ${CITIES.require(festival.locationId).name}.`,
    importance: 84, route: '/workspace/projects',
  });
  sim.remember({
    category: 'project',
    title: `${project.title} selected for ${festival.name}`,
    detail: `${submission.section}, ${submission.year} edition.`,
    refs: [{ type: 'project', id: project.id }],
    significance: 68, public: true,
  });
  sim.emit('fest.selected', { submissionId: submission.id, festivalId: festival.id, projectId: project.id, section: submission.section });
}

function holdScreening(sim: Simulation, submissionId: Id): void {
  const submission = sim.universe.festivalSubmissions[submissionId];
  if (!submission || submission.status !== 'selected') return;
  const festival = FESTIVAL_BY_ID[submission.festivalId];
  const project = sim.universe.projects[submission.projectId];
  if (!festival || !project) return;

  submission.status = 'screened';
  const quality = project.finalQuality ?? 50;
  const rng = sim.rng('screening', submission.id);

  // Festival juries.
  const juryScore = clamp(quality + rng.normal(0, 12), 0, 100);
  const wins: string[] = [];
  for (const category of festival.categories) {
    const threshold = category.toLowerCase().includes('audience') ? 72 : 80;
    if (juryScore > threshold && rng.chance(remap(juryScore, threshold, 100, 0.15, 0.7))) {
      wins.push(category);
      if (wins.length >= 2) break;
    }
  }
  submission.awardsWon = wins;

  // Buyers in the room, if the festival has a market.
  if (festival.marketAttached && !project.releaseId) {
    const heat = clamp(quality * 0.6 + juryScore * 0.4 + (wins.length > 0 ? 12 : 0), 0, 110);
    const offerCount = clamp(Math.round(remap(heat, 45, 95, 0, 3)), 0, 3);
    for (let i = 0; i < offerCount; i++) {
      const amount = Math.round(project.totalCost * remap(heat, 45, 100, 0.35, 2.1) * rng.float(0.7, 1.3));
      submission.acquisitionOffers.push({
        buyerName: rng.pick(['Northgate Films', 'Brightline Pictures', 'Tessellate', 'Sable & Fox', 'Crestwood Studios']),
        amount: Math.max(150_000_00, amount),
        territories: rng.chance(0.5) ? ['worldwide'] : ['domestic'],
        at: sim.now,
        accepted: false,
      });
    }
    if (offerCount > 0) {
      const best = submission.acquisitionOffers.reduce((b, o) => (o.amount > b.amount ? o : b));
      sim.requireDecision({
        urgency: 82, category: 'business',
        title: `Acquisition offers for ${project.title}`,
        detail: `${offerCount} offer${offerCount === 1 ? '' : 's'} out of ${festival.name}. Best is ${best.buyerName} at ${formatMoneyCompact(best.amount)} for ${best.territories.join(', ')}.`,
        route: '/workspace/projects',
        actions: submission.acquisitionOffers.map((o, index) => ({
          label: `${o.buyerName} — ${formatMoneyCompact(o.amount)}`,
          commandKind: 'fest.accept_acquisition',
          payload: { submissionId: submission.id, offerIndex: index },
        })),
        dueAt: addDays(sim.now, 6, sim.homeZone),
        refType: 'festival_submission', refId: submission.id,
      });
    }
  }

  // Prestige and press from the premiere itself.
  for (const personId of [...project.castIds, project.directorId].filter(Boolean) as Id[]) {
    const person = sim.universe.people[personId];
    if (!person) continue;
    person.reputation.prestige = clamp(person.reputation.prestige + remap(festival.prestige, 40, 100, 1, 7) + wins.length * 4, 0, 100);
    person.reputation.publicFame = clamp(person.reputation.publicFame + remap(festival.prestige, 40, 100, 0.5, 3), 0, 100);
  }

  if (wins.length > 0) {
    sim.notify({
      category: 'awards',
      title: `${project.title} won at ${festival.name}`,
      body: wins.join(' and ') + '.',
      importance: 90, route: '/workspace/projects',
    });
    sim.remember({
      category: 'award',
      title: `Won ${wins.join(' and ')} at ${festival.name}`,
      detail: `${submission.year} edition, ${submission.section}.`,
      refs: [{ type: 'project', id: project.id }],
      significance: 88, public: true,
    });
  }

  sim.emit('fest.screened', { submissionId: submission.id, projectId: project.id, wins, offers: submission.acquisitionOffers.length });
}

// ---------------------------------------------------------------------------
// Read models
// ---------------------------------------------------------------------------

export function ordinal(n: number): string {
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th';
  return `${n}${suffix}`;
}

/** Award history for a person, newest first. Finalised results never change. */
export function awardHistory(sim: Simulation, personId: Id) {
  return Object.values(sim.universe.awardNominations)
    .filter((n) => n.personId === personId && n.announcedAt > 0)
    .map((n) => ({
      nomination: n,
      edition: sim.universe.awardEditions[n.editionId],
      body: AWARD_BODY_BY_ID[n.bodyId],
      project: n.projectId ? sim.universe.projects[n.projectId] : undefined,
    }))
    .sort((a, b) => (b.edition?.ceremonyAt ?? 0) - (a.edition?.ceremonyAt ?? 0));
}

/** Upcoming ceremonies and their eligibility windows, for the awards workspace. */
export function awardsCalendar(sim: Simulation) {
  return Object.values(sim.universe.awardEditions)
    .sort((a, b) => a.ceremonyAt - b.ceremonyAt)
    .map((edition) => ({
      edition,
      body: AWARD_BODY_BY_ID[edition.bodyId],
      nominations: Object.values(sim.universe.awardNominations).filter((n) => n.editionId === edition.id && n.announcedAt > 0),
      daysAway: Math.round((edition.ceremonyAt - sim.now) / MS_DAY),
    }));
}

export function festivalCalendar(sim: Simulation) {
  const parts = zonedParts(sim.now, sim.homeZone);
  return FESTIVALS.map((festival) => {
    const year = nextFestivalYear(sim, festival);
    return {
      festival,
      year,
      at: instantFromZoned({ year, month: festival.month, day: festival.day }, sim.homeZone),
      city: CITIES.get(festival.locationId),
      submissions: Object.values(sim.universe.festivalSubmissions).filter((f) => f.festivalId === festival.id && f.year === year),
    };
  }).sort((a, b) => a.at - b.at).filter(() => parts.year > 0);
}
