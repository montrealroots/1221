/**
 * Composing a post: format, angle, hook, effort, review, publish — and a
 * day later, what the audience said.
 *
 * The scene publishes through the social system's own command, so the
 * post gets the same quality rule as the quick form plus the craft chosen
 * here; nothing is written to the world until the review says publish.
 * Reactions arrive on their own a day on, in the band the numbers put the
 * post in, with comments in the register of the format.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { loadAllSections } from '@/engine/dialogue';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, MS_MINUTE } from '@/engine/core/time';
import type { SocialAccount, SocialPost } from '@/engine/domain/model';
import { CRAFT_ANGLES, CRAFT_HOOKS, FORMAT_PROFILE, PLATFORM_BY_ID, craftBonus, formatVibe } from '@/engine/systems/media';
import { activeScene, sceneView } from '@/engine/systems/scenes';

function must<R>(sim: Simulation, kind: string, payload: Record<string, unknown> = {}, idempotencyKey?: string): R {
  const result = sim.execute<R>({ kind, payload, idempotencyKey });
  if (!result.ok) throw new Error(`${kind} refused: ${result.error}`);
  return result.value as R;
}

function attempt<R>(sim: Simulation, kind: string, payload: Record<string, unknown> = {}) {
  return sim.execute<R>({ kind, payload });
}

function aLife(seed = 'compose'): Simulation {
  const sim = quickSave({}, seed);
  sim.execute({ kind: 'co.set_draw', payload: { amount: 0 } });
  sim.player.wellbeing.energy = 100;
  return sim;
}

/** The player's account on a platform, opened if a new life did not come with one. */
function anAccount(sim: Simulation, platform: 'lumen' | 'chatter' | 'streamtube' | 'pulse' = 'lumen'): SocialAccount {
  const existing = Object.values(sim.universe.socialAccounts).find((a) => a.ownerId === sim.player.id && a.platform === platform);
  if (existing) return existing;
  const { accountId } = must<{ accountId: string }>(sim, 'social.create_account', { platform, handle: `slate_${platform}` });
  return sim.universe.socialAccounts[accountId]!;
}

function choose(sim: Simulation, choiceId: string) {
  const scene = activeScene(sim)!;
  return must<{ status: string }>(sim, 'scene.choose', { sceneId: scene.id, revision: scene.revision, choiceId });
}

function postsOf(sim: Simulation, account: SocialAccount): SocialPost[] {
  return Object.values(sim.universe.socialPosts).filter((p) => p.accountId === account.id);
}

describe('composing a post', () => {
  beforeAll(async () => {
    await loadAllSections();
  });

  it('craft is a bounded bonus on the same quality rule, and an unknown craft is refused', () => {
    const sim = aLife();
    const account = anAccount(sim);
    expect(craftBonus(undefined)).toBe(0);
    for (const angle of CRAFT_ANGLES) for (const hook of CRAFT_HOOKS) {
      expect(craftBonus({ angle: angle.id, hook: hook.id })).toBe(angle.bonus + hook.bonus);
    }
    expect(() => craftBonus({ angle: 'nope', hook: 'plain' })).toThrow();
    const plain = must<{ projectedQuality: number }>(sim, 'social.create_post', { accountId: account.id, format: 'photo', title: 'Plain', effortMinutes: 60 });
    const crafted = must<{ projectedQuality: number }>(sim, 'social.create_post', { accountId: account.id, format: 'photo', title: 'Crafted', effortMinutes: 60, craft: { angle: 'take', hook: 'cold' } });
    expect(crafted.projectedQuality).toBeGreaterThanOrEqual(plain.projectedQuality);
    expect(crafted.projectedQuality - plain.projectedQuality).toBeLessThanOrEqual(8);
    expect(attempt(sim, 'social.create_post', { accountId: account.id, format: 'photo', title: 'Bad', effortMinutes: 60, craft: { angle: 'take', hook: 'nope' } }).ok).toBe(false);
  });

  it('the scene asks format, angle, hook and effort in order, projects before publishing, and publishes through the social command', () => {
    const sim = aLife();
    const account = anAccount(sim);
    const platform = PLATFORM_BY_ID[account.platform];
    const energyBefore = sim.player.wellbeing.energy;
    const before = sim.now;
    must(sim, 'scene.start', { definitionId: 'social.compose', input: { accountId: account.id }, refType: 'account', refId: account.id });
    let scene = activeScene(sim)!;
    expect(scene.node).toBe('format');
    const format = sceneView(sim, scene);
    expect(format.choices.map((c) => c.id)).toEqual(platform.formats.map((f) => `format:${f}`));
    expect(format.eyebrow).toContain(`@${account.handle}`);
    choose(sim, 'format:photo');
    expect(activeScene(sim)!.node).toBe('angle');
    expect(sceneView(sim, activeScene(sim)!).choices.map((c) => c.id)).toEqual([...CRAFT_ANGLES.map((a) => `angle:${a.id}`), 'back']);
    choose(sim, 'angle:behind');
    expect(activeScene(sim)!.node).toBe('hook');
    choose(sim, 'back');
    expect(activeScene(sim)!.node).toBe('angle');
    choose(sim, 'angle:take');
    choose(sim, 'hook:question');
    scene = activeScene(sim)!;
    expect(scene.node).toBe('effort');
    const effort = sceneView(sim, scene);
    const options = effort.choices.filter((c) => c.id.startsWith('effort:'));
    expect(options.length).toBeGreaterThanOrEqual(2);
    for (const o of options) {
      const minutes = Number(o.id.slice(7));
      expect(minutes).toBeGreaterThanOrEqual(FORMAT_PROFILE.photo.minMinutes);
      expect(minutes).toBeLessThanOrEqual(FORMAT_PROFILE.photo.maxMinutes);
    }
    const proper = options.find((o) => o.label === 'Do It Properly')!;
    choose(sim, proper.id);
    scene = activeScene(sim)!;
    expect(scene.node).toBe('review');
    const review = sceneView(sim, scene);
    const projected = review.facts!.find((f) => f.label === 'Projected Quality')!.value;
    expect(projected).toMatch(/^\d+ \/ 100$/);
    expect(postsOf(sim, account)).toHaveLength(0);
    expect(sim.now).toBe(before);
    choose(sim, 'publish');
    scene = activeScene(sim)!;
    expect(scene.node).toBe('done');
    const posts = postsOf(sim, account);
    expect(posts).toHaveLength(1);
    const post = posts[0]!;
    expect(post.format).toBe('photo');
    expect(post.topic).toBe('industry');
    expect(post.title).toMatch(/^A Take On The Business — /);
    expect(post.effortMinutes).toBe(Number(proper.id.slice(7)));
    expect(`${post.quality} / 100`).toBe(projected);
    expect(sim.now - before).toBe(post.effortMinutes * MS_MINUTE);
    expect(sim.player.wellbeing.energy).toBeLessThan(energyBefore);
    // The post goes up as the clock next moves; the scene committed it, the scheduler publishes it.
    expect(post.status).toBe('draft');
    sim.advanceTo(sim.now + MS_MINUTE);
    expect(post.status).toBe('published');
    expect(sim.timeline.pending().some((i) => i.kind === 'social.reactions' && i.refId === post.id)).toBe(true);
    const done = sceneView(sim, scene);
    expect(done.title).toBe('Out Of Your Hands');
    expect(done.canLeave).toBe(false);
    choose(sim, 'finish');
    expect(activeScene(sim)).toBeUndefined();
  });

  it('starting again from the review publishes nothing', () => {
    const sim = aLife();
    const account = anAccount(sim, 'chatter');
    must(sim, 'scene.start', { definitionId: 'social.compose', input: { accountId: account.id }, refType: 'account', refId: account.id });
    choose(sim, 'format:text');
    choose(sim, 'angle:personal');
    choose(sim, 'hook:plain');
    const effort = sceneView(sim, activeScene(sim)!).choices.find((c) => c.id.startsWith('effort:'))!;
    choose(sim, effort.id);
    choose(sim, 'rethink');
    expect(activeScene(sim)!.node).toBe('format');
    expect(postsOf(sim, account)).toHaveLength(0);
    must(sim, 'scene.leave', { sceneId: activeScene(sim)!.id, revision: activeScene(sim)!.revision });
    expect(activeScene(sim)).toBeUndefined();
    expect(postsOf(sim, account)).toHaveLength(0);
  });

  it('a format the platform does not take is not offered, and cannot be forced', () => {
    const sim = aLife();
    const account = anAccount(sim, 'pulse');
    must(sim, 'scene.start', { definitionId: 'social.compose', input: { accountId: account.id }, refType: 'account', refId: account.id });
    const format = sceneView(sim, activeScene(sim)!);
    expect(format.choices.map((c) => c.id)).not.toContain('format:photo');
    const scene = activeScene(sim)!;
    // The runtime only takes a choice the view offered.
    expect(attempt(sim, 'scene.choose', { sceneId: scene.id, revision: scene.revision, choiceId: 'format:photo' }).ok).toBe(false);
    // And the social command is the authority on formats, scene or no scene.
    const direct = attempt(sim, 'social.create_post', { accountId: account.id, format: 'photo', title: 'Forced', effortMinutes: 60 });
    expect(direct.ok).toBe(false);
    expect(direct.error).toMatch(/does not support/);
    expect(postsOf(sim, account)).toHaveLength(0);
  });

  it('the short version publishes a proper post with the safe angle and hook', () => {
    const sim = aLife();
    const account = anAccount(sim, 'streamtube');
    const quick = must<{ status: string; lines: string[] }>(sim, 'scene.quick', { definitionId: 'social.compose', input: { accountId: account.id }, refType: 'account', refId: account.id });
    expect(quick.status).toBe('completed');
    expect(quick.lines.some((l) => /^Published\. Quality \d+ out of 100/.test(l))).toBe(true);
    const posts = postsOf(sim, account);
    expect(posts).toHaveLength(1);
    expect(posts[0]!.format).toBe(PLATFORM_BY_ID.streamtube.formats[0]);
    expect(posts[0]!.topic).toBe('work');
    expect(posts[0]!.effortMinutes).toBeGreaterThanOrEqual(FORMAT_PROFILE[posts[0]!.format].minMinutes);
  });

  it('the scene is only for accounts that are yours', () => {
    const sim = aLife();
    const other = Object.values(sim.universe.people).find((p) => !p.isPlayer)!;
    const { accountId } = must<{ accountId: string }>(sim, 'social.create_account', { platform: 'lumen', handle: 'not_yours', ownerId: other.id });
    const refused = attempt(sim, 'scene.start', { definitionId: 'social.compose', input: { accountId } });
    expect(refused.ok).toBe(false);
    expect(refused.error).toMatch(/not yours/);
    expect(attempt(sim, 'scene.start', { definitionId: 'social.compose', input: { accountId: 'acct_nope' } }).ok).toBe(false);
  });

  it('a day on, the audience says what it thought, in the band the numbers put it in', () => {
    const sim = aLife();
    const account = anAccount(sim, 'lumen');
    const { postId } = must<{ postId: string }>(sim, 'social.create_post', { accountId: account.id, format: 'photo', title: 'A Day', effortMinutes: 120, craft: { angle: 'personal', hook: 'question' } });
    const post = sim.universe.socialPosts[postId]!;
    expect(post.reactions).toBeUndefined();
    sim.advanceTo(sim.now + 23 * MS_HOUR);
    expect(post.reactions).toBeUndefined();
    sim.advanceTo(sim.now + 2 * MS_HOUR);
    expect(post.reactions).toBeDefined();
    const reactions = post.reactions!;
    expect(['hit', 'fine', 'flop']).toContain(reactions.band);
    if (reactions.band === 'flop') expect(post.quality).toBeLessThan(40);
    if (reactions.band === 'hit') expect(post.viral || post.quality >= 65).toBe(true);
    expect(reactions.comments.length).toBeGreaterThanOrEqual(1);
    expect(reactions.comments.length).toBeLessThanOrEqual(3);
    expect(new Set(reactions.comments).size).toBe(reactions.comments.length);
    expect(reactions.summary.length).toBeGreaterThan(10);
    expect(formatVibe(post.format)).toBe('photo');
    expect(sim.universe.notifications.some((n) => n.title === `"${post.title}" A Day On` && n.refId === post.id)).toBe(true);
    // Settled once; a second day does not settle it again.
    const settledAt = reactions.at;
    sim.advanceTo(sim.now + MS_DAY);
    expect(post.reactions!.at).toBe(settledAt);
  });

  it('a post that never publishes gets no reactions', () => {
    const sim = aLife();
    const account = anAccount(sim, 'chatter');
    const { postId } = must<{ postId: string }>(sim, 'social.create_post', { accountId: account.id, format: 'text', title: 'Later', effortMinutes: 30, scheduledFor: sim.now + 3 * MS_DAY });
    const post = sim.universe.socialPosts[postId]!;
    expect(post.status).toBe('scheduled');
    sim.advanceTo(sim.now + 2 * MS_DAY);
    expect(post.reactions).toBeUndefined();
    sim.advanceTo(sim.now + 2 * MS_DAY + MS_HOUR);
    expect(post.status).toBe('published');
    expect(post.reactions).toBeDefined();
  });
});
