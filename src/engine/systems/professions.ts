/**
 * SLATE — professions: unlocked with experience, developed by doing the work.
 *
 * Everyone starts as an actor or actress. Industry experience accrues from
 * the work the world already records — auditions, shoot days, shifts, drafts,
 * releases, posts, courses — and is spent to unlock a profession. Once
 * unlocked, a profession earns its own experience from its own work, levels
 * on it, raises every one of its skills at each level, and opens trait slots
 * on the way.
 *
 * Nothing here polls. Every grant is a reaction to an event another system
 * emitted when the work happened, so experience cannot be earned by a UI
 * that says it was. Unlocking and picking traits go through the command bus
 * with idempotency keys, so a retried unlock cannot spend twice.
 */

import { CommandError, type Simulation } from '../core/simulation';
import { clamp } from '../core/rng';
import type { Id, Person } from '../domain/model';
import {
  LEVEL_SKILL_GAIN, PROFESSION_BY_ID, PROFESSIONS, levelFor, traitSlotsAt,
  type ProfessionId,
} from '../content/professions';
import { TRAIT_BY_ID, conflictingTraits } from '../domain/attributes';
import { godMode, logOverride } from './sandbox';

/**
 * What each piece of work is worth. One table, so the economy of experience
 * can be read in one place and argued about.
 */
export const XP = {
  audition: 6,
  auditionStrong: 4,
  shootDayAsCast: 10,
  shiftPerFourHours: 1,
  courseCompleted: 15,
  courseInProfession: 50,
  releaseCredited: 80,
  draftWritten: 25,
  draftQualityWeight: 0.3,
  draftIndustry: 8,
  showrunnerDraft: 20,
  shootDayAsDirector: 12,
  directorIndustry: 4,
  greenlitAsProducer: 60,
  greenlitIndustry: 15,
  greenlitAsExecutive: 40,
  financedAsProducer: 40,
  wrapAsProducer: 50,
  wrapAsDirector: 40,
  wrapAsShowrunner: 60,
  wrapIndustry: 20,
  releaseAsProducer: 80,
  releaseAsDirector: 60,
  releaseAsWriter: 50,
  releaseAsShowrunner: 70,
  postPublished: 6,
  postViral: 10,
  postIndustry: 2,
  dealCompleted: 40,
  quarterClosed: 25,
  quarterProfitable: 15,
  quarterIndustry: 10,
} as const;

const SERIES = new Set(['series', 'limited_series']);

/** The course categories that count toward a profession. */
const COURSE_PROFESSION: Record<string, ProfessionId[]> = {
  writing: ['writer', 'showrunner'],
  directing: ['director'],
  production: ['producer'],
  business: ['executive'],
};

export function registerProfessions(sim: Simulation): void {
  // --- Unlocking ------------------------------------------------------------

  sim.onCommand<{ professionId: ProfessionId }, { professionId: ProfessionId; remainingXp: number }>(
    'profession.unlock',
    (p, { sim: s }) => {
      const def = PROFESSION_BY_ID[p.professionId];
      if (!def) throw new CommandError('There is no such profession.');
      const player = s.player;
      const professions = (player.professions ??= {});
      if (professions[def.id]) throw new CommandError(`You are already a ${def.name.toLowerCase()}.`);

      const missing = def.requires.filter((id) => !professions[id]);
      if (missing.length > 0) {
        throw new CommandError(`${def.name} needs ${missing.map((id) => PROFESSION_BY_ID[id].name).join(' and ')} first.`);
      }

      // God mode opens it for nothing, and says so rather than quietly
      // pretending the experience was there.
      const xp = player.industryXp ?? 0;
      const free = godMode(s);
      if (!free && xp < def.unlockXp) {
        throw new CommandError(`${def.name} takes ${def.unlockXp.toLocaleString('en-US')} XP to unlock. You have ${xp.toLocaleString('en-US')}.`);
      }
      if (free && xp < def.unlockXp) {
        logOverride(s, `Opened ${def.name} for nothing. It costs ${def.unlockXp.toLocaleString('en-US')} XP and you had ${xp.toLocaleString('en-US')}.`);
      }

      player.industryXp = free ? xp : xp - def.unlockXp;
      professions[def.id] = { unlockedAt: s.now, xp: 0, traitIds: [] };

      s.remember({
        category: 'career',
        title: `Became A ${def.name}`,
        detail: `${player.displayName} unlocked ${def.name} with ${def.unlockXp.toLocaleString('en-US')} XP of industry experience.`,
        refs: [{ type: 'person', id: player.id }],
        significance: 70, public: false,
      });
      s.notify({
        category: 'career',
        title: `You are now a ${def.name}`,
        body: `${def.earnedBy} Every level raises all of its skills, and a trait slot is open now.`,
        importance: 70, route: '/workspace/character',
      });
      s.emit('profession.unlocked', { personId: player.id, professionId: def.id });
      return { professionId: def.id, remainingXp: player.industryXp };
    },
  );

  // --- Picking a trait for a profession --------------------------------------

  sim.onCommand<{ professionId: ProfessionId; traitId: string }, { traitId: string; slotsUsed: number }>(
    'profession.pick_trait',
    (p, { sim: s }) => {
      const def = PROFESSION_BY_ID[p.professionId];
      if (!def) throw new CommandError('There is no such profession.');
      const player = s.player;
      const progress = player.professions?.[def.id];
      if (!progress) throw new CommandError(`You are not a ${def.name.toLowerCase()} yet.`);

      const trait = TRAIT_BY_ID[p.traitId];
      if (!trait || trait.profession !== def.id) throw new CommandError(`That is not a ${def.name.toLowerCase()}'s trait.`);
      if (progress.traitIds.includes(trait.id)) throw new CommandError(`You already hold ${trait.name}.`);

      // God mode opens every slot. The traits that contradict each other still
      // contradict each other, because that is a rule of the world rather than
      // a gate on the player.
      const slots = traitSlotsAt(levelFor(progress.xp));
      if (!godMode(s) && progress.traitIds.length >= slots) {
        throw new CommandError(`Every ${def.name.toLowerCase()} trait slot is taken. The next opens at a higher level.`);
      }
      if (godMode(s) && progress.traitIds.length >= slots) {
        logOverride(s, `Took ${trait.name} with no ${def.name.toLowerCase()} slot open for it.`);
      }
      const conflicts = conflictingTraits(progress.traitIds, trait.id);
      if (conflicts.length > 0) {
        throw new CommandError(`${trait.name} cannot be held with ${conflicts.map((id) => TRAIT_BY_ID[id]?.name ?? id).join(', ')}.`);
      }

      progress.traitIds.push(trait.id);
      s.remember({
        category: 'career',
        title: `${def.name}: ${trait.name}`,
        detail: `${player.displayName} took on ${trait.name}. ${trait.description}`,
        refs: [{ type: 'person', id: player.id }],
        significance: 40, public: false,
      });
      return { traitId: trait.id, slotsUsed: progress.traitIds.length };
    },
  );

  // --- Acting work: industry experience ---------------------------------------

  sim.onEvent('cast.audition_performed', 'professions.xp', (event) => {
    const { auditionId, score } = event.payload as { auditionId: Id; score?: number };
    const audition = sim.universe.auditions[auditionId];
    const player = sim.player;
    if (!audition || audition.personId !== player.id) return;
    grantIndustryXp(sim, player, XP.audition + ((score ?? 0) >= 70 ? XP.auditionStrong : 0));
  });

  sim.onEvent('prod.day_shot', 'professions.xp', (event) => {
    const { projectId, shootDayId } = event.payload as { projectId: Id; shootDayId: Id };
    const day = sim.universe.shootDays[shootDayId];
    const project = sim.universe.projects[projectId];
    const player = sim.player;
    if (!day || !project) return;
    if (day.requiredCastIds.includes(player.id)) grantIndustryXp(sim, player, XP.shootDayAsCast);
    if (project.directorId === player.id && player.professions?.director) {
      grantProfessionXp(sim, player, 'director', XP.shootDayAsDirector);
      grantIndustryXp(sim, player, XP.directorIndustry);
    }
  });

  sim.onEvent('work.shift_worked', 'professions.xp', (event) => {
    const { personId, hours } = event.payload as { personId: Id; hours: number };
    const player = sim.player;
    if (personId !== player.id) return;
    grantIndustryXp(sim, player, Math.max(1, Math.round((hours / 4) * XP.shiftPerFourHours)));
  });

  sim.onEvent('edu.completed', 'professions.xp', (event) => {
    const { enrollmentId, courseId } = event.payload as { enrollmentId: Id; courseId: Id };
    const enrollment = sim.universe.enrollments[enrollmentId];
    const course = sim.universe.courses[courseId];
    const player = sim.player;
    if (!enrollment || !course || enrollment.personId !== player.id) return;
    grantIndustryXp(sim, player, XP.courseCompleted);
    for (const id of COURSE_PROFESSION[course.category] ?? []) {
      if (player.professions?.[id]) grantProfessionXp(sim, player, id, XP.courseInProfession);
    }
  });

  // --- Making things: profession experience -----------------------------------

  sim.onEvent('film.draft_written', 'professions.xp', (event) => {
    const { projectId, draftId, quality } = event.payload as { projectId: Id; draftId: Id; quality: number };
    const draft = sim.universe.scriptDrafts[draftId];
    const project = sim.universe.projects[projectId];
    const player = sim.player;
    if (!draft || !project || !draft.writerIds.includes(player.id)) return;
    grantIndustryXp(sim, player, XP.draftIndustry);
    if (player.professions?.writer) {
      grantProfessionXp(sim, player, 'writer', Math.round(XP.draftWritten + clamp(quality, 0, 100) * XP.draftQualityWeight));
    }
    if (player.professions?.showrunner && SERIES.has(project.format)) {
      grantProfessionXp(sim, player, 'showrunner', XP.showrunnerDraft);
    }
  });

  sim.onEvent('project.greenlit', 'professions.xp', (event) => {
    const { projectId } = event.payload as { projectId: Id };
    const project = sim.universe.projects[projectId];
    const player = sim.player;
    if (!project) return;
    if (producesIt(sim, project.id, player) && player.professions?.producer) {
      grantProfessionXp(sim, player, 'producer', XP.greenlitAsProducer);
      grantIndustryXp(sim, player, XP.greenlitIndustry);
    }
    if (ownsTheCompany(sim, project.ownerCompanyId, player) && player.professions?.executive) {
      grantProfessionXp(sim, player, 'executive', XP.greenlitAsExecutive);
    }
  });

  sim.onEvent('film.financing_arranged', 'professions.xp', (event) => {
    const { projectId } = event.payload as { projectId: Id };
    const player = sim.player;
    if (producesIt(sim, projectId, player) && player.professions?.producer) {
      grantProfessionXp(sim, player, 'producer', XP.financedAsProducer);
    }
  });

  sim.onEvent('prod.wrapped', 'professions.xp', (event) => {
    const { projectId } = event.payload as { projectId: Id };
    const project = sim.universe.projects[projectId];
    const player = sim.player;
    if (!project) return;
    let involved = false;
    if (producesIt(sim, project.id, player) && player.professions?.producer) {
      grantProfessionXp(sim, player, 'producer', XP.wrapAsProducer); involved = true;
    }
    if (project.directorId === player.id && player.professions?.director) {
      grantProfessionXp(sim, player, 'director', XP.wrapAsDirector); involved = true;
    }
    if (project.writerIds.includes(player.id) && SERIES.has(project.format) && player.professions?.showrunner) {
      grantProfessionXp(sim, player, 'showrunner', XP.wrapAsShowrunner); involved = true;
    }
    if (involved || project.castIds.includes(player.id)) grantIndustryXp(sim, player, XP.wrapIndustry);
  });

  sim.onEvent('film.released', 'professions.xp', (event) => {
    const { projectId } = event.payload as { projectId: Id };
    const project = sim.universe.projects[projectId];
    const player = sim.player;
    if (!project) return;
    if (player.creditIds.includes(project.id) || project.castIds.includes(player.id)) {
      grantIndustryXp(sim, player, XP.releaseCredited);
    }
    if (producesIt(sim, project.id, player) && player.professions?.producer) {
      grantProfessionXp(sim, player, 'producer', XP.releaseAsProducer);
    }
    if (project.directorId === player.id && player.professions?.director) {
      grantProfessionXp(sim, player, 'director', XP.releaseAsDirector);
    }
    if (project.writerIds.includes(player.id)) {
      if (player.professions?.writer) grantProfessionXp(sim, player, 'writer', XP.releaseAsWriter);
      if (player.professions?.showrunner && SERIES.has(project.format)) {
        grantProfessionXp(sim, player, 'showrunner', XP.releaseAsShowrunner);
      }
    }
  });

  // --- The channel ------------------------------------------------------------

  sim.onEvent('social.post_published', 'professions.xp', (event) => {
    const { accountId, viral } = event.payload as { accountId: Id; viral?: boolean };
    const account = sim.universe.socialAccounts[accountId];
    const player = sim.player;
    if (!account || account.ownerId !== player.id) return;
    grantIndustryXp(sim, player, XP.postIndustry);
    if (player.professions?.creator) {
      grantProfessionXp(sim, player, 'creator', XP.postPublished + (viral ? XP.postViral : 0));
    }
  });

  sim.onEvent('social.deal_completed', 'professions.xp', (event) => {
    const { dealId } = event.payload as { dealId: Id };
    const deal = sim.universe.brandDeals[dealId];
    const player = sim.player;
    if (!deal || deal.personId !== player.id) return;
    if (player.professions?.creator) grantProfessionXp(sim, player, 'creator', XP.dealCompleted);
  });

  // --- The company ------------------------------------------------------------

  sim.onEvent('company.quarter_closed', 'professions.xp', (event) => {
    const { companyId, profit } = event.payload as { companyId: Id; profit: number };
    const player = sim.player;
    if (!ownsTheCompany(sim, companyId, player)) return;
    grantIndustryXp(sim, player, XP.quarterIndustry);
    if (player.professions?.executive) {
      grantProfessionXp(sim, player, 'executive', XP.quarterClosed + (profit > 0 ? XP.quarterProfitable : 0));
    }
  });
}

// ---------------------------------------------------------------------------
// Granting
// ---------------------------------------------------------------------------

/** Industry experience: the currency professions are unlocked with. */
export function grantIndustryXp(sim: Simulation, person: Person, amount: number): number {
  if (amount <= 0) return person.industryXp ?? 0;
  person.industryXp = (person.industryXp ?? 0) + Math.round(amount);
  void sim;
  return person.industryXp;
}

/**
 * Experience in one unlocked profession. Crossing a level raises every one
 * of the profession's skills and tells the player. A profession that is not
 * unlocked earns nothing, whatever the work was.
 */
export function grantProfessionXp(sim: Simulation, person: Person, professionId: ProfessionId, amount: number): number {
  const progress = person.professions?.[professionId];
  if (!progress || amount <= 0) return 0;
  const def = PROFESSION_BY_ID[professionId];

  const before = levelFor(progress.xp);
  progress.xp += Math.round(amount);
  const after = levelFor(progress.xp);

  for (let level = before + 1; level <= after; level++) {
    for (const skillId of def.skillIds) {
      person.skills[skillId] = clamp((person.skills[skillId] ?? 5) + LEVEL_SKILL_GAIN, 0, 100);
    }
    const slotOpened = traitSlotsAt(level) > traitSlotsAt(level - 1);
    sim.remember({
      category: 'career',
      title: `${def.name} Level ${level}`,
      detail: `${person.displayName} reached level ${level} as a ${def.name.toLowerCase()}. Every ${def.name.toLowerCase()} skill rose.${slotOpened ? ' A trait slot opened.' : ''}`,
      refs: [{ type: 'person', id: person.id }],
      significance: 45 + level * 3, public: false,
    });
    if (person.isPlayer) {
      sim.notify({
        category: 'career',
        title: `${def.name} level ${level}`,
        body: `All ${def.skillIds.length} ${def.name.toLowerCase()} skills rose.${slotOpened ? ' A new trait slot is open.' : ''}`,
        importance: 55 + level * 2, route: '/workspace/character',
      });
    }
    sim.emit('profession.levelled', { personId: person.id, professionId, level });
  }
  return progress.xp;
}

// ---------------------------------------------------------------------------
// Who counts as what
// ---------------------------------------------------------------------------

/** Whether the person is attached to the project as a producer. */
function producesIt(sim: Simulation, projectId: Id, person: Person): boolean {
  const project = sim.universe.projects[projectId];
  if (!project) return false;
  return project.attachments.some((a) => a.personId === person.id && /producer/i.test(a.role));
}

/** Whether the person founded the company. */
function ownsTheCompany(sim: Simulation, companyId: Id | undefined, person: Person): boolean {
  if (!companyId) return false;
  const company = sim.universe.companies[companyId];
  return !!company && company.founderId === person.id;
}

/** The professions, for anyone who needs the list without the content import. */
export { PROFESSIONS };
