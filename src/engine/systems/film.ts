/**
 * SLATE — Film and television: one canonical project, all the way through.
 *
 * There is exactly one Project record per film or series. Writing, development,
 * packaging, greenlight, financing, casting, production, post, marketing,
 * distribution, results and awards all point at that same record. There is no
 * separate copy of a movie living inside each department.
 */

import { countryOfCity, primaryLanguageOf } from '../content/geography';
import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type {
  Contract, Id, Project, ProjectFormat, ProjectPhase, Rights, ScriptDraft,
} from '../domain/model';
import { PROJECT_PHASE_ORDER } from '../domain/model';
import { clamp, remap } from '../core/rng';
import { addDays, addMonths, addYears, formatDate, MS_DAY } from '../core/time';
import { applyRate, formatMoney, formatMoneyCompact, type Money } from '../core/money';
import { buildFactors } from '../core/audit';
import { BUYERS, GENRE_APPETITE, GENRE_BUDGET_INDEX, type Buyer } from '../content/industry';
import { generateTitle } from '../content/titles';
import { normaliseTitle, titleTaken } from '../content/filmography';
import { canonicalGenre, genre, runtimeBandOf } from '../content/genres';
import { rating } from '../content/ratings';
import { filmIncentive } from '../content/tax';
import { systemModifier } from '../domain/attributes';
import { activeDeal, adjustStanding, standingWith } from './studio-state';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function phaseIndex(phase: ProjectPhase): number {
  return PROJECT_PHASE_ORDER.indexOf(phase);
}

export function advancePhase(sim: Simulation, project: Project, phase: ProjectPhase): void {
  if (project.phase === phase) return;
  project.phase = phase;
  project.phaseHistory.push({ phase, enteredAt: sim.now });
  sim.emit('project.phase_changed', { projectId: project.id, phase, title: project.title });
}

export function requirePhase(project: Project, minimum: ProjectPhase, action: string): void {
  if (phaseIndex(project.phase) < phaseIndex(minimum)) {
    throw new CommandError(
      `${project.title} is still at ${project.phase.replace(/_/g, ' ')}. You cannot ${action} until it reaches ${minimum.replace(/_/g, ' ')}.`,
    );
  }
}

/** Every person attached to a project in any capacity. */
export function attachmentsOf(project: Project): { personId: Id; role: string }[] {
  return project.attachments.filter((a) => a.confirmed).map((a) => ({ personId: a.personId, role: a.role }));
}

/**
 * The single number every downstream result derives from. Script, direction,
 * cast, crew, production execution and post all feed it, weighted the way they
 * actually matter.
 */
export function computeFinalQuality(sim: Simulation, project: Project): number {
  const draft = project.currentDraftId ? sim.universe.scriptDrafts[project.currentDraftId] : undefined;
  const script = draft?.quality ?? project.scriptQuality;

  const director = project.directorId ? sim.universe.people[project.directorId] : undefined;
  const directing = director
    ? (director.skills['visual_language'] ?? 20) * 0.3 + (director.skills['actor_direction'] ?? 20) * 0.3
      + (director.skills['tone_control'] ?? 20) * 0.25 + (director.skills['post_vision'] ?? 20) * 0.15
    : 35;

  const cast = project.castIds.map((id) => sim.universe.people[id]).filter(Boolean);
  const castQuality = cast.length > 0
    ? cast.reduce((s, p) => {
        const person = p!;
        const craft = (person.attributes['emotional_truth'] ?? 30) * 0.4
          + (person.attributes['charisma'] ?? 30) * 0.25
          + (person.attributes['take_consistency'] ?? 30) * 0.2
          + (person.attributes['drama'] ?? 30) * 0.15;
        return s + craft;
      }, 0) / cast.length
    : 32;

  const shootDays = project.shootDayIds.map((id) => sim.universe.shootDays[id]).filter((d) => d?.status === 'complete');
  const production = shootDays.length > 0
    ? shootDays.reduce((s, d) => s + (d?.footageQuality ?? 50), 0) / shootDays.length
    : 50;

  const postTasks = project.postTaskIds.map((id) => sim.universe.postTasks[id]).filter((t) => t?.status === 'complete');
  const post = postTasks.length > 0
    ? postTasks.reduce((s, t) => s + (t?.quality ?? 50), 0) / postTasks.length
    : 45;

  // Money buys production value, with sharply diminishing returns.
  const budgetIndex = GENRE_BUDGET_INDEX[project.genres[0] ?? 'drama'] ?? 1;
  const expectedBudget = 30_000_000_00 * budgetIndex;
  const resourceFactor = remap(Math.log10(Math.max(1, project.budget / expectedBudget) + 1), 0, 0.6, 0.86, 1.10);

  const raw = script * 0.34 + directing * 0.20 + castQuality * 0.18 + production * 0.15 + post * 0.13;
  return clamp(Math.round(raw * resourceFactor), 1, 100);
}

/** What a project of this shape ought to cost. */
export function suggestedBudget(format: ProjectFormat, genres: string[], scriptQuality: number, episodeCount = 0): Money {
  const genreIndex = genres.reduce((s, g) => s + (GENRE_BUDGET_INDEX[g] ?? 1), 0) / Math.max(1, genres.length);
  const base = format === 'feature' ? 32_000_000_00
    : format === 'short' ? 180_000_00
      : format === 'documentary' ? 2_400_000_00
        : format === 'tv_movie' ? 6_000_000_00
          : format === 'limited_series' ? 9_000_000_00 * Math.max(1, episodeCount || 6)
            : 5_500_000_00 * Math.max(1, episodeCount || 10);
  return Math.round(base * genreIndex * remap(scriptQuality, 30, 95, 0.82, 1.22));
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export function registerFilm(sim: Simulation): void {
  sim.onSchedule('film.pitch_response', (item) => resolvePitch(sim, item.payload.projectId as Id, item.payload.buyerId as string));
  sim.onSchedule('film.option_expiry', (item) => expireRights(sim, item.payload.rightsId as Id));
  sim.onSchedule('film.coverage', (item) => deliverCoverage(sim, item.payload.draftId as Id));
  sim.onSchedule('film.contract_payment', (item) => payContractMilestone(sim, item.payload.contractId as Id, item.payload.index as number));

  // --- Idea and rights -----------------------------------------------------

  sim.onCommand<{ title?: string; format: ProjectFormat; genres: string[]; logline: string; synopsis?: string; companyId?: Id; targetAudience?: string; comparables?: string[]; parentSeriesId?: Id; franchiseId?: Id; contentRating?: string; runtime?: number }, { projectId: Id }>(
    'film.create_project',
    (p, { sim: s }) => {
      if (p.genres.length === 0) throw new CommandError('A project needs at least one genre.');
      const chosen = p.genres.map(canonicalGenre);
      for (const id of chosen) {
        if (!genre(id)) throw new CommandError(`"${id}" is not a genre. Pick from the list.`);
      }
      if (p.contentRating && !rating(p.contentRating)) throw new CommandError(`"${p.contentRating}" is not a certificate any board issues.`);
      if (p.runtime !== undefined && (!Number.isFinite(p.runtime) || p.runtime < 1 || p.runtime > 600)) {
        throw new CommandError('A runtime is between one minute and ten hours.');
      }
      const player = s.player;
      // No two things in the world may share a title, real or made here,
      // unless the new one belongs to the same series or franchise.
      const taken = (candidate: string) => {
        const key = normaliseTitle(candidate);
        return titleTaken(candidate) || Object.values(s.universe.projects).some((other) => normaliseTitle(other.title) === key);
      };
      const requested = p.title?.trim();
      if (requested && taken(requested) && !p.parentSeriesId && !p.franchiseId) {
        throw new CommandError(`"${requested}" is already a film or series. A title has to be its own; give a sequel or a remake a subtitle or a number.`);
      }
      // Named for what it is: a Korean thriller, a network procedural and a
      // family animation are not named alike, and neither are their titles.
      const title = requested || generateTitle(s.rng('title', s.counter('project_title')), {
        genres: chosen, format: p.format, taken,
        franchise: p.franchiseId ? s.universe.franchises[p.franchiseId]?.name : undefined,
      });
      const company = p.companyId ? s.universe.companies[p.companyId] : undefined;
      const productionCountry = countryOfCity(company?.headquartersLocationId) ?? countryOfCity(player.currentLocationId) ?? 'us';

      const project: Project = {
        id: s.nextId('proj'),
        saveId: s.universe.meta.id,
        title,
        format: p.format,
        genres: chosen,
        logline: p.logline,
        contentRating: p.contentRating,
        runtime: p.runtime ?? Math.round((runtimeBandOf(chosen)[0] + runtimeBandOf(chosen)[1]) / 2),
        synopsis: p.synopsis ?? p.logline,
        phase: 'idea',
        phaseHistory: [{ phase: 'idea', enteredAt: s.now }],
        ownerCompanyId: p.companyId,
        createdById: player.id,
        parentSeriesId: p.parentSeriesId,
        franchiseId: p.franchiseId,
        productionCountryId: productionCountry,
        language: primaryLanguageOf(productionCountry),
        attachments: [],
        writerIds: [],
        producerIds: [],
        castIds: [],
        credits: [],
        budget: 0,
        budgetLocked: false,
        spent: 0,
        contingency: 0,
        financingIds: [],
        scriptDraftIds: [],
        targetAudience: p.targetAudience ?? 'General audience',
        comparables: p.comparables ?? [],
        scriptQuality: 0,
        packageValue: 0,
        productionLocationIds: [],
        shootDayIds: [],
        scheduledShootDays: 0,
        completedShootDays: 0,
        postTaskIds: [],
        boxOfficeDomestic: 0,
        boxOfficeInternational: 0,
        streamingHoursViewed: 0,
        totalRevenue: 0,
        totalCost: 0,
        createdAt: s.now,
      };
      s.universe.projects[project.id] = project;

      s.remember({
        category: 'project',
        title: `Started developing ${title}`,
        detail: `${p.format.replace(/_/g, ' ')}, ${p.genres.join(' / ')}. "${p.logline}"`,
        refs: [{ type: 'project', id: project.id }],
        significance: 30, public: false,
      });
      s.emit('project.created', { projectId: project.id, title, format: p.format, genres: p.genres });
      return { projectId: project.id };
    },
  );

  sim.onCommand<{ projectId?: Id; title: string; sourceKind: Rights['sourceKind']; acquisitionKind: Rights['acquisitionKind']; cost: Money; optionMonths?: number; holderId?: Id; holderKind?: 'person' | 'company'; scope?: Partial<Rights['scope']>; accountId?: Id }, { rightsId: Id; expiresAt?: number }>(
    'film.acquire_rights',
    (p, { sim: s }) => {
      const holderId = p.holderId ?? s.player.id;
      const holderKind = p.holderKind ?? (s.universe.companies[holderId] ? 'company' : 'person');

      const accountId = p.accountId ?? (holderKind === 'company'
        ? s.universe.companies[holderId]?.cashAccountId
        : s.universe.people[holderId]?.primaryAccountId);
      if (!accountId) throw new CommandError('No account to pay from.');
      if (p.cost > 0 && s.ledger.availableFunds(accountId) < p.cost) {
        throw new CommandError(`Acquiring those rights costs ${formatMoney(p.cost)} and you cannot cover it.`);
      }
      if (p.cost > 0) {
        s.expense(accountId, p.cost, `Rights — ${p.title}`, 'development', { refType: 'rights', refId: p.projectId });
      }

      const expiresAt = p.acquisitionKind === 'option'
        ? addMonths(s.now, p.optionMonths ?? 18, s.homeZone)
        : undefined;

      const rights: Rights = {
        id: s.nextId('rights'),
        saveId: s.universe.meta.id,
        title: p.title,
        sourceKind: p.sourceKind,
        holderId,
        holderKind,
        acquiredFrom: p.sourceKind === 'original' ? 'Created by you' : 'Rights holder',
        acquisitionKind: p.acquisitionKind,
        cost: p.cost,
        extensionCost: p.acquisitionKind === 'option' ? Math.round(p.cost * 1.5) : undefined,
        acquiredAt: s.now,
        expiresAt,
        extensionsUsed: 0,
        extensionsAllowed: p.acquisitionKind === 'option' ? 2 : 0,
        scope: {
          media: p.scope?.media ?? ['theatrical', 'television', 'streaming', 'home'],
          territories: p.scope?.territories ?? ['worldwide'],
          sequelRights: p.scope?.sequelRights ?? p.acquisitionKind !== 'license',
          remakeRights: p.scope?.remakeRights ?? p.acquisitionKind === 'purchase',
          merchandisingRights: p.scope?.merchandisingRights ?? p.acquisitionKind === 'purchase',
        },
        chainOfTitle: [{ at: s.now, note: `${p.acquisitionKind === 'original' ? 'Created' : p.acquisitionKind === 'option' ? 'Optioned' : p.acquisitionKind === 'purchase' ? 'Purchased' : 'Licensed'} for ${formatMoney(p.cost)}.` }],
        status: 'active',
      };
      s.universe.rights[rights.id] = rights;

      if (p.projectId) {
        const project = s.universe.projects[p.projectId];
        if (project) {
          project.rightsId = rights.id;
          if (project.phase === 'idea') advancePhase(s, project, 'rights');
        }
      }
      if (holderKind === 'company') {
        s.universe.companies[holderId]?.rightsIds.push(rights.id);
      }

      if (expiresAt) {
        s.schedule({
          at: expiresAt,
          kind: 'film.option_expiry',
          label: `Option Expires — ${p.title}`,
          category: 'business',
          payload: { rightsId: rights.id },
          priority: 35,
          refType: 'rights', refId: rights.id,
        });
      }

      s.emit('film.rights_acquired', { rightsId: rights.id, projectId: p.projectId, cost: p.cost, kind: p.acquisitionKind });
      return { rightsId: rights.id, expiresAt };
    },
  );

  sim.onCommand<{ rightsId: Id; accountId?: Id }, { newExpiry: number; cost: Money }>(
    'film.extend_option',
    (p, { sim: s }) => {
      const rights = s.universe.rights[p.rightsId];
      if (!rights) throw new CommandError('No such rights.');
      if (rights.acquisitionKind !== 'option') throw new CommandError('That is not an option.');
      if (rights.extensionsUsed >= rights.extensionsAllowed) {
        throw new CommandError(`You have used all ${rights.extensionsAllowed} extensions on ${rights.title}. The rights will revert.`);
      }
      const cost = rights.extensionCost ?? Math.round(rights.cost * 1.5);
      const accountId = p.accountId ?? s.player.primaryAccountId;
      if (!accountId || s.ledger.availableFunds(accountId) < cost) {
        throw new CommandError(`Extending costs ${formatMoney(cost)}.`);
      }
      s.expense(accountId, cost, `Option extension — ${rights.title}`, 'development', { refType: 'rights', refId: rights.id });

      rights.extensionsUsed += 1;
      rights.expiresAt = addMonths(rights.expiresAt ?? s.now, 12, s.homeZone);
      rights.extensionCost = Math.round(cost * 1.4);
      rights.chainOfTitle.push({ at: s.now, note: `Option extended twelve months for ${formatMoney(cost)}.` });
      s.schedule({
        at: rights.expiresAt, kind: 'film.option_expiry',
        label: `Option Expires — ${rights.title}`, category: 'business',
        payload: { rightsId: rights.id }, priority: 35,
        refType: 'rights', refId: rights.id,
      });
      return { newExpiry: rights.expiresAt, cost };
    },
  );

  // --- Writing -------------------------------------------------------------

  sim.onCommand<{ projectId: Id; label?: string; writerIds?: Id[]; daysSpent?: number }, { draftId: Id; quality: number; pages: number }>(
    'film.write_draft',
    (p, { sim: s }) => {
      const project = s.universe.projects[p.projectId];
      if (!project) throw new CommandError('No such project.');
      if (phaseIndex(project.phase) > phaseIndex('post')) throw new CommandError('That project is past the point of new drafts.');

      const writerIds = p.writerIds ?? (project.writerIds.length > 0 ? project.writerIds : [s.player.id]);
      const writers = writerIds.map((id) => s.universe.people[id]).filter(Boolean);
      if (writers.length === 0) throw new CommandError('A draft needs a writer.');

      const previous = project.currentDraftId ? s.universe.scriptDrafts[project.currentDraftId] : undefined;
      const version = (previous?.version ?? 0) + 1;
      const days = clamp(p.daysSpent ?? (version === 1 ? 45 : 21), 3, 240);

      const rng = s.rng('draft', project.id, version);
      const skillOf = (key: string) => writers.reduce((sum, w) => sum + (w!.skills[key] ?? 0), 0) / writers.length;

      const structure = clamp(skillOf('story_structure') * remap(days, 5, 90, 0.7, 1.15) + rng.normal(0, 7), 0, 100);
      const dialogue = clamp(skillOf('dialogue') * remap(days, 5, 90, 0.75, 1.12) + rng.normal(0, 8), 0, 100);
      const characters = clamp(skillOf('character_writing') * remap(days, 5, 90, 0.75, 1.12) + rng.normal(0, 8), 0, 100);

      // A rewrite improves on the previous draft rather than starting over.
      const rewriteSkill = skillOf('rewriting');
      const base = (structure * 0.36 + dialogue * 0.30 + characters * 0.34);
      const quality = previous
        ? clamp(previous.quality + (base - previous.quality) * clamp(0.25 + rewriteSkill / 220, 0.15, 0.7) + rng.normal(1.5, 3), 0, 100)
        : clamp(base, 0, 100);

      const pages = project.format === 'feature' ? Math.round(rng.int(96, 124))
        : project.format === 'short' ? rng.int(8, 28)
          : rng.int(48, 62);

      const draft: ScriptDraft = {
        id: s.nextId('draft'),
        saveId: s.universe.meta.id,
        projectId: project.id,
        version,
        label: p.label ?? (version === 1 ? 'First draft' : `Draft ${version}`),
        writerIds,
        pages,
        quality: Math.round(quality),
        structure: Math.round(structure),
        dialogue: Math.round(dialogue),
        characters: Math.round(characters),
        writtenAt: s.now,
        notes: previous ? previous.notes.map((n) => ({ ...n, addressed: true })) : [],
        isCurrent: true,
      };
      if (previous) previous.isCurrent = false;
      s.universe.scriptDrafts[draft.id] = draft;
      project.scriptDraftIds.push(draft.id);
      project.currentDraftId = draft.id;
      project.scriptQuality = draft.quality;
      for (const id of writerIds) {
        if (!project.writerIds.includes(id)) project.writerIds.push(id);
        recordCredit(s, project, id, 'writer');
      }

      if (project.phase === 'idea' || project.phase === 'rights') advancePhase(s, project, 'writing');

      // Writing takes months of world time, not an afternoon.
      const writer = s.universe.people[writerIds[0] as Id];
      if (writer?.isPlayer) {
        const prepFactor = systemModifier(writer.traits, 'prepTimeRequired');
        s.advanceTo(addDays(s.now, Math.round(days * prepFactor), s.homeZone));
        writer.wellbeing.stress = clamp(writer.wellbeing.stress + days * 0.22, 0, 100);
        for (const key of ['page_speed', 'dialogue', 'story_structure', 'character_writing']) {
          const current = writer.skills[key] ?? 0;
          writer.skills[key] = clamp(current + remap(current, 0, 100, 2.4, 0.3), 0, 100);
        }
      }

      s.schedule({
        at: addDays(s.now, 12, s.homeZone),
        kind: 'film.coverage',
        label: `Coverage On ${project.title}`,
        category: 'business',
        payload: { draftId: draft.id },
        priority: 62,
        refType: 'draft', refId: draft.id,
      });

      s.emit('film.draft_written', { projectId: project.id, draftId: draft.id, version, quality: draft.quality });
      s.remember({
        category: 'project',
        title: `Finished ${draft.label.toLowerCase()} of ${project.title}`,
        detail: `${pages} pages over ${days} days.`,
        refs: [{ type: 'project', id: project.id }, { type: 'draft', id: draft.id }],
        significance: 25, public: false,
      });
      return { draftId: draft.id, quality: draft.quality, pages };
    },
  );

  // --- Development and packaging ------------------------------------------

  sim.onCommand<{ projectId: Id; personId: Id; role: string; confirmed?: boolean; alreadyAgreed?: boolean }, { attached: boolean; packageValue: number }>(
    'film.attach_talent',
    (p, { sim: s }) => {
      const project = s.universe.projects[p.projectId];
      if (!project) throw new CommandError('No such project.');
      const person = s.universe.people[p.personId];
      if (!person) throw new CommandError('No such person.');
      if (project.attachments.some((a) => a.personId === p.personId && a.role === p.role)) {
        throw new CommandError(`${person.displayName} is already attached as ${p.role}.`);
      }

      // Talent above your level says no. That is the point of a package.
      // Unless they have already been asked and already said yes — an approach
      // that has been answered is not put to them a second time (see
      // systems/real-people), because one question deserves the one answer.
      if (!person.isPlayer && !p.alreadyAgreed) {
        const rng = s.rng('attach', project.id, person.id);
        const draft = project.currentDraftId ? s.universe.scriptDrafts[project.currentDraftId] : undefined;
        const { factors, score } = buildFactors([
          { label: 'The Script', detail: `Currently reads at ${Math.round(draft?.quality ?? project.scriptQuality)} out of 100.`, weight: 0.40, value: (draft?.quality ?? project.scriptQuality) / 100 },
          { label: 'Who Else Is Attached', detail: project.attachments.length > 0 ? `${project.attachments.length} other attachment${project.attachments.length === 1 ? '' : 's'}.` : 'Nobody else yet.', weight: 0.20, value: clamp(project.packageValue / 100, 0, 1) },
          { label: 'Your Standing', detail: `Your professional reputation reads ${Math.round(s.player.reputation.professionalReputation)} out of 100.`, weight: 0.22, value: s.player.reputation.professionalReputation / 100 },
          { label: 'Their Demand', detail: `${person.displayName} is at ${Math.round(person.reputation.industryDemand)} out of 100 for how busy they are.`, weight: -0.18, value: person.reputation.industryDemand / 100 },
          { label: 'What Else They Were Offered', detail: 'Their other options, which you do not see.', weight: 0.15, value: rng.float(0, 1), knowable: false },
        ]);
        const probability = clamp(score * 1.1 - 0.1, 0.02, 0.94);
        const roll = rng.next();
        const said_yes = roll < probability;

        s.audit({
          kind: 'film.attachment_decided', subjectType: 'project', subjectId: project.id,
          question: `Why did ${person.displayName} say yes or no?`,
          summary: said_yes ? `${person.displayName} attached as ${p.role}.` : `${person.displayName} passed.`,
          factors, seed: `attach|${project.id}|${person.id}`, roll, probability, score,
          outcome: said_yes ? 'attached' : 'passed',
        });

        if (!said_yes) {
          s.emit('film.attachment_declined', { projectId: project.id, personId: person.id, role: p.role });
          return { attached: false, packageValue: project.packageValue };
        }
      }

      project.attachments.push({ personId: p.personId, role: p.role, attachedAt: s.now, confirmed: p.confirmed ?? true });
      if (p.role === 'director') project.directorId = p.personId;
      if (p.role === 'writer' && !project.writerIds.includes(p.personId)) project.writerIds.push(p.personId);
      if (p.role === 'producer' && !project.producerIds.includes(p.personId)) project.producerIds.push(p.personId);
      if (p.role === 'showrunner') project.showrunnerId = p.personId;
      recordCredit(s, project, p.personId, p.role);

      recomputePackageValue(s, project.id);
      if (project.phase === 'writing') advancePhase(s, project, 'development');
      s.emit('film.talent_attached', { projectId: project.id, personId: p.personId, role: p.role, packageValue: project.packageValue });
      return { attached: true, packageValue: project.packageValue };
    },
  );

  sim.onCommand<{ projectId: Id; buyerIds?: string[]; askBudget?: Money }, { pitches: { buyerId: string; buyerName: string; respondsAt: number }[] }>(
    'film.pitch',
    (p, { sim: s }) => {
      const project = s.universe.projects[p.projectId];
      if (!project) throw new CommandError('No such project.');
      if (!project.currentDraftId && project.format !== 'series') {
        throw new CommandError('You need at least one draft before you can take it out.');
      }
      if (project.phase === 'released' || project.phase === 'library') throw new CommandError('That project is already out.');

      const player = s.player;
      const ask = p.askBudget ?? suggestedBudget(project.format, project.genres, project.scriptQuality);
      const candidates = (p.buyerIds ?? BUYERS.all().map((b) => b.id))
        .map((id) => BUYERS.get(id))
        .filter((b): b is Buyer => Boolean(b));

      // A company that knows you takes the meeting sooner than one that does not.
      const accessible = candidates.filter((buyer) => {
        const standing = buyer.studioId ? standingWith(s, 'studio', buyer.studioId) : buyer.networkId ? standingWith(s, 'network', buyer.networkId) : 30;
        const access = player.reputation.professionalReputation * 0.4 + player.reputation.publicFame * 0.2
          + project.packageValue * 0.3 + (player.representation.agentId ? 20 : 0) + (standing - 30) * 0.3;
        return access >= buyer.accessDifficulty - 30;
      });
      // Under a first-look or overall deal, the company you signed with sees it
      // first and has its window before anyone else hears a word.
      const television = project.format === 'series' || project.format === 'limited_series' || project.format === 'tv_movie';
      const deal = activeDeal(s, { kind: television ? 'overall' : 'first_look' });
      const dealBuyer = deal ? BUYERS.get(deal.counterpartyId) : undefined;
      if (dealBuyer && !accessible.some((b) => b.id === dealBuyer.id)) accessible.unshift(dealBuyer);
      else if (dealBuyer) { accessible.splice(accessible.findIndex((b) => b.id === dealBuyer.id), 1); accessible.unshift(dealBuyer); }
      if (accessible.length === 0) {
        throw new CommandError(
          'None of those buyers will take the meeting. Build a stronger package, get representation, or start with a smaller company.',
        );
      }

      advancePhase(s, project, 'packaging');
      const pitches: { buyerId: string; buyerName: string; respondsAt: number }[] = [];
      if (deal && dealBuyer) {
        deal.projectsShown++;
        if (dealBuyer.studioId) adjustStanding(s, 'studio', dealBuyer.studioId, 1, `Brought them ${project.title} first, as agreed.`);
        if (dealBuyer.networkId) adjustStanding(s, 'network', dealBuyer.networkId, 1, `Brought them ${project.title} first, as agreed.`);
      }

      for (const buyer of accessible.slice(0, 6)) {
        const exclusive = deal && dealBuyer && buyer.id !== dealBuyer.id ? deal.exclusiveDays : 0;
        const respondsAt = addDays(s.now, exclusive + (deal && dealBuyer && buyer.id === dealBuyer.id ? s.rng('pitch_delay', project.id, buyer.id).int(4, 12) : s.rng('pitch_delay', project.id, buyer.id).int(6, 28)), s.homeZone);
        s.schedule({
          at: respondsAt,
          kind: 'film.pitch_response',
          label: `${buyer.name} Response — ${project.title}`,
          category: 'career',
          payload: { projectId: project.id, buyerId: buyer.id, ask },
          priority: 40,
          refType: 'project', refId: project.id,
        });
        pitches.push({ buyerId: buyer.id, buyerName: buyer.name, respondsAt });
      }

      // Taking meetings costs a day and some nerve.
      s.advanceTo(s.now + 6 * 60 * 60 * 1000);
      player.wellbeing.stress = clamp(player.wellbeing.stress + 8, 0, 100);
      s.emit('film.pitched', { projectId: project.id, buyerIds: pitches.map((x) => x.buyerId), ask });
      return { pitches };
    },
  );

  // --- Greenlight ----------------------------------------------------------

  sim.onCommand<{ projectId: Id; budget: Money; companyId?: Id; force?: boolean }, { greenlit: boolean; reason?: string }>(
    'film.greenlight',
    (p, { sim: s }) => {
      const project = s.universe.projects[p.projectId];
      if (!project) throw new CommandError('No such project.');
      if (project.greenlitAt) throw new CommandError('That project is already greenlit.');
      if (!project.currentDraftId) throw new CommandError('You cannot greenlight without a script.');

      const player = s.player;
      const company = p.companyId ? s.universe.companies[p.companyId] : project.ownerCompanyId ? s.universe.companies[project.ownerCompanyId] : undefined;

      // Authority. A random assistant does not greenlight a $250 million film.
      const sandbox = s.universe.sandbox.enabled && s.universe.sandbox.ignoreAuthority;
      if (!sandbox && !p.force) {
        const employment = company ? Object.values(s.universe.employees).find((e) => e.companyId === company.id && e.personId === player.id && !e.departedAt) : undefined;
        const authority = Math.max(
          player.greenlightAuthority,
          employment?.authority ?? 0,
          company && company.ownerships.some((o) => o.holderId === player.id && o.percent >= 50) ? company.greenlightCeiling : 0,
        );
        if (authority < p.budget) {
          throw new CommandError(
            authority === 0
              ? `You have no greenlight authority. A project of ${formatMoneyCompact(p.budget)} has to be greenlit by someone who does, or by a company you control.`
              : `Your authority stops at ${formatMoneyCompact(authority)}. This is ${formatMoneyCompact(p.budget)}.`,
          );
        }
        if (company && company.greenlightCeiling < p.budget) {
          throw new CommandError(
            `${company.name} cannot support a ${formatMoneyCompact(p.budget)} project. Its ceiling is ${formatMoneyCompact(company.greenlightCeiling)}, set by its cash, credit and track record.`,
          );
        }
      }

      // Rights. You cannot produce what you do not control.
      const rights = project.rightsId ? s.universe.rights[project.rightsId] : undefined;
      if (!rights) {
        throw new CommandError(`${project.title} has no chain of title. Secure the underlying rights before greenlighting.`);
      }
      if (rights.status !== 'active') {
        throw new CommandError(`The rights to ${project.title} are ${rights.status}. They must be active to produce.`);
      }
      if (rights.expiresAt && rights.expiresAt < addMonths(s.now, 6, s.homeZone)) {
        throw new CommandError(`The option on ${project.title} expires ${formatDate(rights.expiresAt, s.homeZone)}. Extend it before committing a budget.`);
      }

      const draft = s.universe.scriptDrafts[project.currentDraftId];
      const rng = s.rng('greenlight', project.id);
      const appetite = project.genres.reduce((sum, g) => sum + (GENRE_APPETITE[g] ?? 45), 0) / project.genres.length;

      const { factors, score } = buildFactors([
        { label: 'Script', detail: `${draft?.label ?? 'Current draft'} reads at ${Math.round(draft?.quality ?? 0)} out of 100.`, weight: 0.30, value: (draft?.quality ?? 0) / 100 },
        { label: 'Package', detail: `Talent attached brings the package to ${Math.round(project.packageValue)} out of 100.`, weight: 0.22, value: project.packageValue / 100 },
        { label: 'Market Appetite', detail: `${project.genres.join(' and ')} currently reads at ${Math.round(appetite)} out of 100 for audience appetite.`, weight: 0.18, value: appetite / 100 },
        { label: 'Budget Against The Material', detail: `${formatMoneyCompact(p.budget)} against a comparable of ${formatMoneyCompact(suggestedBudget(project.format, project.genres, draft?.quality ?? 50))}.`, weight: -0.16, value: clamp(p.budget / Math.max(1, suggestedBudget(project.format, project.genres, draft?.quality ?? 50)) - 1, 0, 1.5) },
        { label: 'Your Track Record', detail: `Professional reputation at ${Math.round(player.reputation.professionalReputation)} out of 100.`, weight: 0.18, value: player.reputation.professionalReputation / 100 },
        { label: 'Company Appetite For Risk', detail: 'What else is on the slate and how exposed it already is.', weight: 0.10, value: rng.float(0.3, 1), knowable: false },
      ]);

      // Whose decision this actually is. When the player controls the company
      // putting up the money, the appetite being modelled is their own, and
      // they have already expressed it by asking. Authority and the company's
      // ceiling still bind — those are checked above — but there is no one else
      // in the room to say no. The dice belong to other people's money.
      const ownControl = company?.ownerships.some((o) => o.holderId === player.id && o.percent >= 50) ?? false;
      const decisionIsTheirs = ownControl || sandbox || p.force === true;

      const probability = decisionIsTheirs ? 1 : clamp(score * 1.15 - 0.05, 0.05, 0.97);
      const roll = rng.next();
      const greenlit = roll < probability;

      s.audit({
        kind: 'film.greenlight_decided', subjectType: 'project', subjectId: project.id,
        question: 'Why was this greenlit, or not?',
        summary: greenlit
          ? ownControl && !sandbox && !p.force
            ? `${project.title} is greenlit at ${formatMoneyCompact(p.budget)}. You control ${company?.name ?? 'the company'}, so this was your call to make, inside its ceiling.`
            : `${project.title} is greenlit at ${formatMoneyCompact(p.budget)}.`
          : `${project.title} was not greenlit. ${(draft?.quality ?? 0) < 60 ? 'The script is the problem.' : 'The numbers did not work at that budget.'}`,
        factors, seed: `greenlight|${project.id}`, roll, probability, score,
        outcome: greenlit ? 'greenlit' : 'passed',
      });

      if (!greenlit) {
        s.emit('film.greenlight_declined', { projectId: project.id, budget: p.budget });
        return { greenlit: false, reason: 'The numbers did not work.' };
      }

      project.budget = p.budget;
      project.contingency = Math.round(p.budget * 0.10);
      project.budgetLocked = true;
      project.greenlitAt = s.now;
      project.greenlitById = player.id;
      if (company) {
        project.ownerCompanyId = company.id;
        if (!company.projectIds.includes(project.id)) company.projectIds.push(project.id);
      }
      advancePhase(s, project, 'greenlight');

      s.remember({
        category: 'project',
        title: `${project.title} is greenlit`,
        detail: `${formatMoneyCompact(p.budget)}${company ? ` at ${company.name}` : ''}.`,
        refs: [{ type: 'project', id: project.id }],
        significance: 78, public: true, amount: p.budget,
      });
      s.emit('project.greenlit', {
        projectId: project.id, budget: p.budget, companyId: company?.id, title: project.title,
      });
      return { greenlit: true };
    },
  );

  // --- Financing -----------------------------------------------------------

  sim.onCommand<{ projectId: Id; sources: { kind: 'company' | 'cofinance' | 'equity' | 'debt' | 'presale' | 'incentive'; amount: Money; name: string; accountId?: Id }[]; productionLocationId?: string }, { funded: Money; gap: Money; incentiveEstimate: Money }>(
    'film.arrange_financing',
    (p, { sim: s }) => {
      const project = s.universe.projects[p.projectId];
      if (!project) throw new CommandError('No such project.');
      if (!project.greenlitAt) throw new CommandError('Finance a project after it is greenlit, not before.');

      const locationId = p.productionLocationId ?? 'us-ca-losangeles';
      if (!project.productionLocationIds.includes(locationId)) project.productionLocationIds.push(locationId);

      const incentive = filmIncentive(locationId, s.now);
      let incentiveEstimate = 0;
      if (incentive && project.budget >= incentive.minimumSpend) {
        const qualified = Math.round(project.budget * 0.62);
        incentiveEstimate = applyRate(qualified, incentive.rate + incentive.localHireUplift);
        if (incentive.perProjectCap > 0) incentiveEstimate = Math.min(incentiveEstimate, incentive.perProjectCap);
      }

      let funded = 0;
      for (const source of p.sources) {
        if (source.kind === 'company') {
          const company = project.ownerCompanyId ? s.universe.companies[project.ownerCompanyId] : undefined;
          const accountId = source.accountId ?? company?.cashAccountId;
          if (!accountId) throw new CommandError('No company account to fund from.');
          if (s.ledger.availableFunds(accountId) < source.amount) {
            throw new CommandError(`${company?.name ?? 'The company'} cannot commit ${formatMoney(source.amount)}. It has ${formatMoney(s.ledger.availableFunds(accountId))}.`);
          }
          const production = s.openAccount({
            id: s.nextId('account'),
            kind: 'production_account',
            name: `${project.title} — production account`,
            ownerId: company?.id ?? s.player.id,
            openedAt: s.now,
            category: 'production',
          });
          s.transfer(accountId, production.id, source.amount, `${project.title} — company financing`, 'production', { refType: 'project', refId: project.id });
          project.financingIds.push(production.id);
          funded += source.amount;
        } else {
          // External money arrives into a production account.
          let production = project.financingIds.map((id) => s.ledger.tryAccount(id)).find(Boolean);
          if (!production) {
            production = s.openAccount({
              id: s.nextId('account'),
              kind: 'production_account',
              name: `${project.title} — production account`,
              ownerId: project.ownerCompanyId ?? s.player.id,
              openedAt: s.now,
              category: 'production',
            });
            project.financingIds.push(production.id);
          }
          s.income(production.id, source.amount, `${source.name} — ${source.kind}`, 'production', { refType: 'project', refId: project.id });
          funded += source.amount;
        }
      }

      const gap = Math.max(0, project.budget + project.contingency - funded - incentiveEstimate);
      if (gap === 0) {
        advancePhase(s, project, 'financing');
        s.notify({
          category: 'project', title: `${project.title} is fully financed`,
          body: `${formatMoneyCompact(funded)} committed${incentiveEstimate > 0 ? `, plus ${formatMoneyCompact(incentiveEstimate)} in ${incentive?.label}` : ''}.`,
          importance: 70, route: '/workspace/projects',
        });
      } else {
        s.requireDecision({
          urgency: 74, category: 'business',
          title: `${project.title} has a financing gap`,
          detail: `${formatMoneyCompact(gap)} short of the ${formatMoneyCompact(project.budget + project.contingency)} needed. Production cannot start until it closes.`,
          route: '/workspace/projects',
          refType: 'project', refId: project.id,
        });
      }

      s.emit('film.financing_arranged', { projectId: project.id, funded, gap, incentiveEstimate, locationId });
      return { funded, gap, incentiveEstimate };
    },
  );

  // --- Contracts -----------------------------------------------------------

  sim.onCommand<{ kind: Contract['kind']; projectId?: Id; partyAId: Id; partyAKind: 'person' | 'company'; partyBId: Id; partyBKind: 'person' | 'company'; title: string; compensation: Money; milestones?: { label: string; fraction: number; dueInDays: number }[]; backendPoints?: number; backendKind?: Contract['backendKind']; obligations?: { label: string; kind: string; dueInDays?: number }[]; exclusivityMonths?: number; startsAt?: number; endsAt?: number }, { contractId: Id }>(
    'film.execute_contract',
    (p, { sim: s }) => {
      const milestones = p.milestones ?? [
        { label: 'On Execution', fraction: 0.2, dueInDays: 0 },
        { label: 'On Commencement', fraction: 0.4, dueInDays: 30 },
        { label: 'On Completion', fraction: 0.4, dueInDays: 120 },
      ];
      const totalFraction = milestones.reduce((s_, m) => s_ + m.fraction, 0);
      if (Math.abs(totalFraction - 1) > 0.001) {
        throw new CommandError('Payment milestones must add up to the whole fee.');
      }

      const contract: Contract = {
        id: s.nextId('contract'),
        saveId: s.universe.meta.id,
        kind: p.kind,
        projectId: p.projectId,
        partyAId: p.partyAId,
        partyAKind: p.partyAKind,
        partyBId: p.partyBId,
        partyBKind: p.partyBKind,
        title: p.title,
        compensation: p.compensation,
        paymentSchedule: milestones.map((m) => ({
          label: m.label,
          amount: Math.round(p.compensation * m.fraction),
          dueAt: addDays(p.startsAt ?? s.now, m.dueInDays, s.homeZone),
          paid: false,
        })),
        backendPoints: p.backendPoints,
        backendKind: p.backendKind,
        bonuses: [],
        obligations: (p.obligations ?? []).map((o) => ({
          label: o.label, kind: o.kind,
          dueAt: o.dueInDays !== undefined ? addDays(s.now, o.dueInDays, s.homeZone) : undefined,
          satisfied: false,
        })),
        exclusivity: p.exclusivityMonths
          ? { category: p.kind, until: addMonths(s.now, p.exclusivityMonths, s.homeZone) }
          : undefined,
        startsAt: p.startsAt ?? s.now,
        endsAt: p.endsAt,
        status: 'executed',
        signedAt: s.now,
        negotiationHistory: [{ at: s.now, byId: s.player.id, note: `Executed at ${formatMoney(p.compensation)}.`, offer: p.compensation }],
      };
      s.universe.contracts[contract.id] = contract;

      contract.paymentSchedule.forEach((milestone, index) => {
        s.schedule({
          at: milestone.dueAt,
          kind: 'film.contract_payment',
          label: `${contract.title} — ${milestone.label}`,
          category: 'finance',
          payload: { contractId: contract.id, index },
          priority: 25,
          refType: 'contract', refId: contract.id,
        });
      });

      s.emit('film.contract_executed', {
        contractId: contract.id, kind: p.kind, projectId: p.projectId,
        compensation: p.compensation, partyBId: p.partyBId,
      });
      return { contractId: contract.id };
    },
  );
}

// ---------------------------------------------------------------------------
// Mechanics
// ---------------------------------------------------------------------------

export function recomputePackageValue(sim: Simulation, projectId: Id): number {
  const project = sim.universe.projects[projectId];
  if (!project) return 0;
  const draft = project.currentDraftId ? sim.universe.scriptDrafts[project.currentDraftId] : undefined;

  let value = (draft?.quality ?? project.scriptQuality) * 0.35;
  for (const attachment of project.attachments) {
    if (!attachment.confirmed) continue;
    const person = sim.universe.people[attachment.personId];
    if (!person) continue;
    const weight = attachment.role === 'director' ? 0.9
      : attachment.role === 'lead' ? 1.0
        : attachment.role === 'showrunner' ? 0.85
          : attachment.role === 'producer' ? 0.35 : 0.4;
    value += (person.reputation.publicFame * 0.4 + person.reputation.prestige * 0.35 + person.reputation.industryDemand * 0.25) * weight * 0.14;
  }

  const appetite = project.genres.reduce((s, g) => s + (GENRE_APPETITE[g] ?? 45), 0) / Math.max(1, project.genres.length);
  value += appetite * 0.12;

  project.packageValue = clamp(Math.round(value), 0, 100);
  return project.packageValue;
}

function resolvePitch(sim: Simulation, projectId: Id, buyerId: string): void {
  const project = sim.universe.projects[projectId];
  const buyer = BUYERS.get(buyerId);
  if (!project || !buyer || project.greenlitAt) return;

  const draft = project.currentDraftId ? sim.universe.scriptDrafts[project.currentDraftId] : undefined;
  const rng = sim.rng('pitch', project.id, buyerId);
  const player = sim.universe.people[sim.universe.playerId];

  const formatFit = buyer.formats.includes(project.format as never) ? 1 : 0;
  const genreWant = project.genres.some((g) => buyer.wants.includes(g)) ? 1 : 0.35;
  const genreAvoid = project.genres.some((g) => buyer.avoids.includes(g)) ? 1 : 0;
  const ask = suggestedBudget(project.format, project.genres, draft?.quality ?? 50);
  const budgetFit = ask >= buyer.budgetFloor && ask <= buyer.budgetCeiling ? 1 : 0.2;
  const appetite = project.genres.reduce((s, g) => s + (GENRE_APPETITE[g] ?? 45), 0) / project.genres.length;
  const standing = buyer.studioId ? standingWith(sim, 'studio', buyer.studioId) : buyer.networkId ? standingWith(sim, 'network', buyer.networkId) : 30;

  const { factors, score } = buildFactors([
    { label: 'The Material', detail: `The draft reads at ${Math.round(draft?.quality ?? 0)} out of 100.`, weight: 0.32, value: (draft?.quality ?? 0) / 100 },
    { label: 'Fit With Their Slate', detail: buyer.wants.some((w) => project.genres.includes(w)) ? `${buyer.name} actively wants ${project.genres.filter((g) => buyer.wants.includes(g)).join(' and ')}.` : `${buyer.name} is not looking for ${project.genres.join(' or ')} right now.`, weight: 0.24, value: genreWant * formatFit },
    { label: 'Budget Band', detail: `They commission between ${formatMoneyCompact(buyer.budgetFloor)} and ${formatMoneyCompact(buyer.budgetCeiling)}. This asks ${formatMoneyCompact(ask)}.`, weight: 0.16, value: budgetFit },
    { label: 'Package', detail: `${project.attachments.length} attachment${project.attachments.length === 1 ? '' : 's'}, package value ${Math.round(project.packageValue)}.`, weight: 0.18, value: project.packageValue / 100 },
    { label: 'Their Prestige Bias', detail: `${buyer.name} weighs prestige at ${buyer.prestigeBias} out of 100 against commercial return.`, weight: 0.10, value: remap(buyer.prestigeBias, 0, 100, appetite / 100, (draft?.quality ?? 50) / 100) },
    { label: 'Genres They Will Not Touch', detail: genreAvoid ? `${buyer.name} does not make ${project.genres.filter((g) => buyer.avoids.includes(g)).join(' or ')}.` : 'Nothing here is a hard no for them.', weight: -0.30, value: genreAvoid },
    { label: 'What Is Already On Their Slate', detail: 'Their internal portfolio and exposure, which is not public.', weight: 0.14, value: rng.float(0, 1), knowable: false },
    { label: 'Your Standing With Them', detail: standing >= 60 ? `${buyer.name} returns your calls. Standing ${Math.round(standing)} out of 100.` : standing <= 15 ? `${buyer.name} remembers what went wrong. Standing ${Math.round(standing)} out of 100.` : `${buyer.name} knows the name and not much more. Standing ${Math.round(standing)} out of 100.`, weight: 0.12, value: standing / 100 },
  ]);

  const riskAdjust = remap(buyer.riskAppetite, 0, 100, -0.12, 0.10);
  const probability = clamp(score * 1.05 + riskAdjust - 0.18, 0.01, 0.88);
  const roll = rng.next();
  const interested = roll < probability;

  sim.audit({
    kind: 'film.pitch_decided', subjectType: 'project', subjectId: project.id,
    question: `Why did ${buyer.name} pass or bite?`,
    summary: interested
      ? `${buyer.name} wants to take ${project.title} forward.`
      : `${buyer.name} passed on ${project.title}.`,
    factors, seed: `pitch|${project.id}|${buyerId}`, roll, probability, score,
    outcome: interested ? 'interested' : 'passed',
  });

  if (!interested) {
    sim.notify({
      category: 'career', title: `${buyer.name} passed`,
      body: `On ${project.title}. ${genreAvoid ? 'It is not a genre they make.' : (draft?.quality ?? 0) < 55 ? 'The script is not there yet.' : 'They liked it and could not make the numbers work.'}`,
      importance: 40, route: '/workspace/projects',
    });
    sim.emit('film.pitch_passed', { projectId: project.id, buyerId });
    return;
  }

  // An offer, with terms.
  const offerBudget = clamp(ask, buyer.budgetFloor, buyer.budgetCeiling);
  const producerFee = Math.round(offerBudget * (player?.reputation.professionalReputation ?? 30) / 100 * 0.035 + 60_000_00);

  sim.requireDecision({
    urgency: 80, category: 'career',
    title: `${buyer.name} wants ${project.title}`,
    detail: `They will commission at ${formatMoneyCompact(offerBudget)} with a producer fee of ${formatMoney(producerFee)}. Accepting hands them the project; you keep your credit and your backend.`,
    route: '/workspace/projects',
    actions: [
      { label: 'Take The Deal', commandKind: 'film.accept_buyer_offer', payload: { projectId: project.id, buyerId, budget: offerBudget, fee: producerFee } },
    ],
    dueAt: addDays(sim.now, 10, sim.homeZone),
    refType: 'project', refId: project.id,
  });
  sim.emit('film.pitch_interested', { projectId: project.id, buyerId, offerBudget, producerFee });
}

function deliverCoverage(sim: Simulation, draftId: Id): void {
  const draft = sim.universe.scriptDrafts[draftId];
  if (!draft || !draft.isCurrent) return;
  const project = sim.universe.projects[draft.projectId];
  if (!project) return;

  const rng = sim.rng('coverage', draft.id);
  const perceived = clamp(draft.quality + rng.normal(0, 9), 0, 100);
  const verdict: 'pass' | 'consider' | 'recommend' = perceived > 78 ? 'recommend' : perceived > 58 ? 'consider' : 'pass';

  const weakest = ([['structure', draft.structure], ['dialogue', draft.dialogue], ['characters', draft.characters]] as [string, number][])
    .sort((a, b) => a[1] - b[1])[0];

  draft.coverage = {
    at: sim.now,
    readerName: 'Story department',
    verdict,
    comments: verdict === 'recommend'
      ? `Strong on every axis. The ${draft.structure > draft.dialogue ? 'structure' : 'dialogue'} is the standout.`
      : verdict === 'consider'
        ? `There is something here. The ${weakest?.[0]} is the weak link and it is fixable.`
        : `Not ready. The ${weakest?.[0]} needs fundamental work before this goes out.`,
  };

  draft.notes.push({
    at: sim.now,
    fromId: sim.universe.playerId,
    note: `Coverage: ${verdict}. ${draft.coverage.comments}`,
    addressed: false,
  });

  sim.notify({
    category: 'project',
    title: `Coverage on ${project.title}: ${verdict}`,
    body: draft.coverage.comments,
    importance: verdict === 'recommend' ? 62 : 44,
    route: '/workspace/projects',
  });
  sim.emit('film.coverage_delivered', { draftId: draft.id, projectId: project.id, verdict });
}

function expireRights(sim: Simulation, rightsId: Id): void {
  const rights = sim.universe.rights[rightsId];
  if (!rights || rights.status !== 'active') return;
  if (rights.expiresAt && rights.expiresAt > sim.now) return;

  const project = Object.values(sim.universe.projects).find((p) => p.rightsId === rights.id);
  if (project?.greenlitAt) {
    // Once in production the rights are exercised and no longer lapse.
    rights.chainOfTitle.push({ at: sim.now, note: 'Option exercised on commencement of production.' });
    rights.expiresAt = undefined;
    return;
  }

  rights.status = 'reverted';
  rights.chainOfTitle.push({ at: sim.now, note: 'Option lapsed. Rights reverted to the underlying holder.' });

  if (project) {
    project.rightsId = undefined;
    project.shelvedReason = 'The option lapsed before the project was set up.';
    if (phaseIndex(project.phase) < phaseIndex('greenlight')) advancePhase(sim, project, 'shelved');
  }

  sim.notify({
    category: 'business',
    title: `The option on ${rights.title} has lapsed`,
    body: project ? `${project.title} cannot proceed without the underlying rights.` : 'The rights have reverted.',
    importance: 72, route: '/workspace/projects',
  });
  sim.emit('film.rights_expired', { rightsId: rights.id, projectId: project?.id });
}

function payContractMilestone(sim: Simulation, contractId: Id, index: number): void {
  const contract = sim.universe.contracts[contractId];
  if (!contract || contract.status !== 'executed') return;
  const milestone = contract.paymentSchedule[index];
  if (!milestone || milestone.paid) return;

  const payerAccount = contract.partyAKind === 'company'
    ? sim.universe.companies[contract.partyAId]?.cashAccountId
    : sim.universe.people[contract.partyAId]?.primaryAccountId;
  const payeeAccount = contract.partyBKind === 'company'
    ? sim.universe.companies[contract.partyBId]?.cashAccountId
    : sim.universe.people[contract.partyBId]?.primaryAccountId;

  const project = contract.projectId ? sim.universe.projects[contract.projectId] : undefined;
  const productionAccount = project?.financingIds.map((id) => sim.ledger.tryAccount(id)).find(Boolean);
  const source = productionAccount?.id ?? payerAccount;

  if (!source || !payeeAccount) return;
  if (sim.ledger.availableFunds(source) < milestone.amount) {
    sim.requireDecision({
      urgency: 86, category: 'business',
      title: `Cannot pay ${contract.title}`,
      detail: `${milestone.label} of ${formatMoney(milestone.amount)} is due and the funding account is short.`,
      route: '/workspace/projects',
      refType: 'contract', refId: contract.id,
    });
    return;
  }

  sim.transfer(source, payeeAccount, milestone.amount, `${contract.title} — ${milestone.label}`, 'contract', { refType: 'contract', refId: contract.id });
  milestone.paid = true;
  milestone.paidAt = sim.now;
  if (project) project.spent += milestone.amount;

  if (contract.paymentSchedule.every((m) => m.paid)) {
    contract.status = 'completed';
  }
  sim.emit('film.contract_payment', { contractId: contract.id, amount: milestone.amount, label: milestone.label });
}

/** Accepting a buyer's offer, exposed as a command for the Decision Center. */
export function registerBuyerOffer(sim: Simulation): void {
  sim.onCommand<{ projectId: Id; buyerId: string; budget: Money; fee: Money }, { greenlit: boolean }>(
    'film.accept_buyer_offer',
    (p, { sim: s }) => {
      const project = s.universe.projects[p.projectId];
      const buyer = BUYERS.get(p.buyerId);
      if (!project || !buyer) throw new CommandError('That offer is no longer on the table.');
      if (project.greenlitAt) throw new CommandError('That project is already set up somewhere.');
      if (!project.rightsId) throw new CommandError(`${project.title} has no chain of title. Secure the rights first.`);

      const player = s.player;
      project.budget = p.budget;
      project.contingency = Math.round(p.budget * 0.1);
      project.budgetLocked = true;
      project.greenlitAt = s.now;
      project.distributorName = buyer.name;
      project.studioId = buyer.studioId;
      project.networkId = buyer.networkId;
      if (buyer.studioId) adjustStanding(s, 'studio', buyer.studioId, 4, `Took their deal on ${project.title}.`);
      if (buyer.networkId) adjustStanding(s, 'network', buyer.networkId, 4, `Took their deal on ${project.title}.`);
      advancePhase(s, project, 'financing');

      // The buyer funds a production account.
      const production = s.openAccount({
        id: s.nextId('account'),
        kind: 'production_account',
        name: `${project.title} — production account`,
        ownerId: project.ownerCompanyId ?? player.id,
        openedAt: s.now,
        category: 'production',
      });
      s.income(production.id, p.budget + project.contingency, `${buyer.name} — production financing`, 'production', { refType: 'project', refId: project.id });
      project.financingIds.push(production.id);

      s.execute({
        kind: 'film.execute_contract',
        payload: {
          kind: 'producing',
          projectId: project.id,
          partyAId: project.ownerCompanyId ?? player.id,
          partyAKind: project.ownerCompanyId ? 'company' : 'person',
          partyBId: player.id,
          partyBKind: 'person',
          title: `${project.title} — producer agreement`,
          compensation: p.fee,
          backendPoints: 0.05,
          backendKind: 'net',
        },
      });

      s.resolveDecision('project', project.id, 'career');
      player.reputation.professionalReputation = clamp(player.reputation.professionalReputation + 6, 0, 100);
      player.reputation.industryDemand = clamp(player.reputation.industryDemand + 8, 0, 100);

      s.remember({
        category: 'project',
        title: `${buyer.name} set up ${project.title}`,
        detail: `${formatMoneyCompact(p.budget)} budget, producer fee ${formatMoney(p.fee)}.`,
        refs: [{ type: 'project', id: project.id }],
        significance: 80, public: true, amount: p.budget,
      });
      s.emit('project.greenlit', { projectId: project.id, budget: p.budget, buyerId: buyer.id, title: project.title });
      return { greenlit: true };
    },
  );
}

/** Projects the player can currently act on, for the workspace list. */
export function activeProjects(sim: Simulation, personId: Id): Project[] {
  return Object.values(sim.universe.projects)
    .filter((p) =>
      p.createdById === personId ||
      p.writerIds.includes(personId) ||
      p.directorId === personId ||
      p.producerIds.includes(personId) ||
      p.castIds.includes(personId) ||
      p.attachments.some((a) => a.personId === personId),
    )
    .sort((a, b) => phaseIndex(b.phase) - phaseIndex(a.phase) || b.createdAt - a.createdAt);
}

export function projectProfitLoss(sim: Simulation, projectId: Id) {
  const project = sim.universe.projects[projectId];
  if (!project) return undefined;
  const release = project.releaseId ? sim.universe.releases[project.releaseId] : undefined;
  const revenue = project.totalRevenue;
  const cost = project.totalCost || project.spent || project.budget;
  return {
    budget: project.budget,
    spent: project.spent,
    revenue,
    cost,
    net: revenue - cost,
    breakeven: revenue >= cost,
    domestic: release?.totalDomestic ?? 0,
    international: release?.totalInternational ?? 0,
  };
}

export const YEAR_MS = 365 * MS_DAY;
void addYears;

/**
 * Writes a credit onto the project. Idempotent per person-and-role, so
 * re-attaching somebody does not double the billing block.
 */
export function recordCredit(
  sim: Simulation,
  project: Project,
  personId: Id,
  role: string,
  characterName?: string,
): void {
  const person = sim.universe.people[personId];
  if (!person) return;
  const existing = project.credits.find((c) => c.personId === personId && c.role === role);
  if (existing) {
    if (characterName) existing.characterName = characterName;
    return;
  }
  project.credits.push({
    personId,
    name: person.stageName ?? person.displayName,
    role,
    ...(characterName ? { characterName } : {}),
  });
}
