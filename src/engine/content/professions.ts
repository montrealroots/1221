/**
 * SLATE — the professions you grow into.
 *
 * Everyone starts as an actor or actress. The rest of the industry — the
 * writers' room, the director's chair, the producer's desk, the showrunner's
 * season, the executive's slate, the creator's channel — is unlocked with
 * industry experience and then developed by doing the work.
 *
 * Only professions the game can actually exercise are offered. A profession
 * with no work in the world to earn it from would be a progress bar attached
 * to nothing, so agents and crew wait until there is something for them to do.
 *
 * Experience is not a stat the player edits; it is earned by events other
 * systems already emit. Unlocks, trait picks and every level reached are
 * written into history.
 */

import type { SkillDomain } from '../domain/skills';

export type ProfessionId =
  | 'writer' | 'director' | 'producer' | 'showrunner' | 'executive' | 'creator';

export interface ProfessionDef {
  id: ProfessionId;
  name: string;
  blurb: string;
  /** The skill domain most of the profession's skills come from. */
  domain: SkillDomain;
  /** Every skill the profession develops. Levelling up raises all of them. */
  skillIds: readonly string[];
  /** Industry experience spent to unlock it. */
  unlockXp: number;
  /** Professions that must be unlocked first. */
  requires: readonly ProfessionId[];
  /** What earns experience in it, in the player's words. */
  earnedBy: string;
}

export const PROFESSIONS: readonly ProfessionDef[] = [
  {
    id: 'creator',
    name: 'Creator',
    blurb: 'Your own audience, your own schedule, your own risk.',
    domain: 'creator',
    skillIds: ['content_strategy', 'audience_growth', 'editing_software', 'on_camera_hosting'],
    unlockXp: 200,
    requires: [],
    earnedBy: 'Publishing posts and completing brand deals.',
  },
  {
    id: 'writer',
    name: 'Writer',
    blurb: 'Pages, drafts, notes and selling something you made out of nothing.',
    domain: 'writing',
    skillIds: [
      'story_structure', 'dialogue', 'character_writing', 'page_speed', 'rewriting',
      'adaptation', 'world_building', 'pitching', 'episode_breaking', 'room_leadership',
    ],
    unlockXp: 400,
    requires: [],
    earnedBy: 'Writing drafts, and better drafts earn more.',
  },
  {
    id: 'director',
    name: 'Director',
    blurb: 'Vision, a set of two hundred people, and whether the day gets made.',
    domain: 'directing',
    skillIds: [
      'visual_language', 'actor_direction', 'coverage_planning', 'tone_control',
      'set_authority', 'shot_efficiency', 'post_vision',
    ],
    unlockXp: 800,
    requires: [],
    earnedBy: 'Every shoot day you direct, and every film you deliver.',
  },
  {
    id: 'producer',
    name: 'Producer',
    blurb: 'Material, money, talent and the will to hold it all together.',
    domain: 'producing',
    skillIds: [
      'development_instinct', 'packaging', 'budgeting', 'scheduling', 'financing',
      'crisis_management', 'vendor_management', 'post_supervision',
    ],
    unlockXp: 800,
    requires: [],
    earnedBy: 'Greenlights, financing, wraps and releases on projects you produce.',
  },
  {
    id: 'showrunner',
    name: 'Showrunner',
    blurb: 'A room, a season, and a network with opinions.',
    domain: 'writing',
    skillIds: [
      'room_leadership', 'episode_breaking', 'story_structure', 'post_supervision',
      'scheduling', 'talent_relations', 'tone_control',
    ],
    unlockXp: 1400,
    requires: ['writer'],
    earnedBy: 'Drafts and wraps on series you write.',
  },
  {
    id: 'executive',
    name: 'Executive',
    blurb: 'The slate, the market and the authority to say yes.',
    domain: 'executive',
    skillIds: [
      'slate_strategy', 'market_reading', 'negotiation', 'deal_structuring', 'corporate_finance',
      'distribution_strategy', 'marketing_strategy', 'rights_management', 'talent_relations',
    ],
    unlockXp: 1400,
    requires: ['producer'],
    earnedBy: 'Greenlights and closed quarters at a company you own.',
  },
];

export const PROFESSION_BY_ID: Readonly<Record<ProfessionId, ProfessionDef>> = Object.fromEntries(
  PROFESSIONS.map((p) => [p.id, p]),
) as Record<ProfessionId, ProfessionDef>;

/**
 * Cumulative experience at which each level begins. Level one is the unlock;
 * the gaps widen so the tenth level is a career, not a season.
 */
export const LEVEL_XP: readonly number[] = [0, 120, 300, 560, 900, 1350, 1900, 2600, 3400, 4400];

export const MAX_PROFESSION_LEVEL = LEVEL_XP.length;

/** Levels at which a trait slot opens. Four in all, as acting has four. */
export const TRAIT_SLOT_LEVELS: readonly number[] = [1, 3, 6, 9];

/** How much every skill in the profession rises at each new level. */
export const LEVEL_SKILL_GAIN = 2.5;

/** The level a profession is at with this much experience in it. */
export function levelFor(xp: number): number {
  let level = 0;
  for (const threshold of LEVEL_XP) {
    if (xp >= threshold) level++;
    else break;
  }
  return Math.max(1, Math.min(MAX_PROFESSION_LEVEL, level));
}

/** Experience still needed for the next level, or 0 at the top. */
export function xpToNextLevel(xp: number): number {
  const level = levelFor(xp);
  if (level >= MAX_PROFESSION_LEVEL) return 0;
  return Math.max(0, (LEVEL_XP[level] ?? 0) - xp);
}

/** How many trait slots a profession at this level has. */
export function traitSlotsAt(level: number): number {
  return TRAIT_SLOT_LEVELS.filter((at) => level >= at).length;
}
