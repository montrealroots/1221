/**
 * SLATE — professions: unlocked with experience, developed by doing the work.
 *
 * Everyone starts as an actor or actress. Industry experience accrues from
 * the work the world already records — shifts, courses, posts and the deals
 * that come off them — and is spent to unlock a profession. Once
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

/**
 * What each piece of work is worth. One table, so the economy of experience
 * can be read in one place and argued about.
 */
export const XP = {
  shiftPerFourHours: 1,
  courseCompleted: 15,
  courseInProfession: 50,
  postPublished: 6,
  postViral: 10,
  postIndustry: 2,
  dealCompleted: 40,
} as const;


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
      if (!def) throw new CommandError('There’s no such profession.');
      const player = s.player;
      const professions = (player.professions ??= {});
      if (professions[def.id]) throw new CommandError(`You’re already a ${def.name.toLowerCase()}.`);

      const missing = def.requires.filter((id) => !professions[id]);
      if (missing.length > 0) {
        throw new CommandError(`${def.name} needs ${missing.map((id) => PROFESSION_BY_ID[id].name).join(' and ')} first.`);
      }

      const xp = player.industryXp ?? 0;
      if (xp < def.unlockXp) {
        throw new CommandError(`${def.name} takes ${def.unlockXp.toLocaleString('en-US')} XP to unlock. You have ${xp.toLocaleString('en-US')}.`);
      }

      player.industryXp = xp - def.unlockXp;
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
        title: `You Are Now A ${def.name}`,
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
      if (!def) throw new CommandError('There’s no such profession.');
      const player = s.player;
      const progress = player.professions?.[def.id];
      if (!progress) throw new CommandError(`You aren’t a ${def.name.toLowerCase()} yet.`);

      const trait = TRAIT_BY_ID[p.traitId];
      if (!trait || trait.profession !== def.id) throw new CommandError(`That isn’t a ${def.name.toLowerCase()}'s trait.`);
      if (progress.traitIds.includes(trait.id)) throw new CommandError(`You already hold ${trait.name}.`);

      const slots = traitSlotsAt(levelFor(progress.xp));
      if (progress.traitIds.length >= slots) {
        throw new CommandError(`Every ${def.name.toLowerCase()} trait slot is taken. The next opens at a higher level.`);
      }
      const conflicts = conflictingTraits(progress.traitIds, trait.id);
      if (conflicts.length > 0) {
        throw new CommandError(`${trait.name} can’t be held with ${conflicts.map((id) => TRAIT_BY_ID[id]?.name ?? id).join(', ')}.`);
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
        title: `${def.name} Level ${level}`,
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



/** The professions, for anyone who needs the list without the content import. */
export { PROFESSIONS };
