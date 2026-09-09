/**
 * A post, composed.
 *
 * Pick the format the platform takes, the angle, the hook, and how long
 * you are going to spend on it; see what that projects to before you
 * publish; publish. The post is the social system's own command, with the
 * same quality rule as the quick form plus the craft you chose here. A day
 * later the audience says what it thought, and that arrives on its own.
 *
 * The short version picks the platform's first format, the safest angle
 * and hook, and a proper amount of time.
 */

import { CommandError, type Simulation } from '../core/simulation';
import { clamp } from '../core/rng';
import { MS_MINUTE, formatDate, formatDuration, formatTime } from '../core/time';
import type { PostFormat, SceneSession } from '../domain/model';
import { titleCaseLabel } from '../core/text';
import { CRAFT_ANGLES, CRAFT_HOOKS, FORMAT_PROFILE, PLATFORM_BY_ID, computePostQuality, craftBonus } from '../systems/media';
import { defineScene, unknownStep, type SceneChoice } from '../systems/scenes';

function str(session: SceneSession, key: string): string {
  const value = session.context[key];
  return value === null || value === undefined ? '' : String(value);
}

function num(session: SceneSession, key: string): number {
  return Number(session.context[key] ?? 0);
}

function accountOf(sim: Simulation, session: SceneSession) {
  const account = sim.universe.socialAccounts[str(session, 'accountId')];
  if (!account) throw new CommandError('That account is gone.');
  const platform = PLATFORM_BY_ID[account.platform];
  return { account, platform };
}

function effortChoices(format: PostFormat): { id: string; label: string; minutes: number; detail: string }[] {
  const profile = FORMAT_PROFILE[format];
  const quick = profile.minMinutes;
  const proper = clamp(Math.round(Math.max(quick * 2, 90) / 15) * 15, profile.minMinutes, profile.maxMinutes);
  const all = clamp(Math.min(profile.maxMinutes, Math.max(proper * 2, 240)), profile.minMinutes, profile.maxMinutes);
  const choices = [
    { id: 'quick', label: 'Get It Out', minutes: quick, detail: `${formatDuration(quick * MS_MINUTE)}. Good enough, today.` },
    { id: 'proper', label: 'Do It Properly', minutes: proper, detail: `${formatDuration(proper * MS_MINUTE)}. The version you wouldn’t mind being judged on.` },
    { id: 'all', label: 'Give It Everything', minutes: all, detail: `${formatDuration(all * MS_MINUTE)}. The whole day, and it shows.` },
  ];
  return choices.filter((c, i, arr) => arr.findIndex((o) => o.minutes === c.minutes) === i);
}

function projected(sim: Simulation, session: SceneSession): number {
  const format = str(session, 'format') as PostFormat;
  const angle = str(session, 'angle');
  const hook = str(session, 'hook');
  const minutes = num(session, 'minutes');
  if (!format || !minutes) return 0;
  const craft = angle && hook ? { angle, hook } : undefined;
  return clamp(computePostQuality(sim, sim.player, format, minutes) + craftBonus(craft), 0, 100);
}

export const COMPOSE_SCENE = defineScene({
  id: 'social.compose',
  version: 1,
  title: 'A Post',
  placeBound: false,

  available(sim, input) {
    const account = sim.universe.socialAccounts[String(input['accountId'])];
    if (!account) return { ok: false, reason: 'There’s no account like that.' };
    if (account.ownerId !== sim.player.id) return { ok: false, reason: 'That account isn’t yours to post from.' };
    return { ok: true };
  },

  start(sim, input) {
    const account = sim.universe.socialAccounts[String(input['accountId'])];
    return {
      node: 'format',
      context: { accountId: account?.id ?? '', format: '', angle: '', hook: '', minutes: 0, postId: '', quality: 0, publishesAt: 0 },
      participantIds: [],
      refType: 'account',
      refId: account?.id,
    };
  },

  view(sim, session) {
    const { account, platform } = accountOf(sim, session);
    const eyebrow = `${platform.name} · @${account.handle} · ${account.followers.toLocaleString('en-US')} followers`;
    switch (session.node) {
      case 'format': {
        const choices: SceneChoice[] = platform.formats.map((f) => {
          const profile = FORMAT_PROFILE[f];
          return { id: `format:${f}`, label: titleCaseLabel(f.replace(/_/g, ' ')), aliases: [f.replace(/_/g, ' ')], detail: `${formatDuration(profile.minMinutes * MS_MINUTE)} at least · ceiling ${profile.qualityCeiling}` };
        });
        return { title: 'What Is It?', eyebrow, text: `What ${platform.name} takes. The format sets how long it needs and how good it can be.`, choices, canSkip: true };
      }
      case 'angle': {
        const choices: SceneChoice[] = CRAFT_ANGLES.map((a) => ({ id: `angle:${a.id}`, label: a.label, aliases: a.aliases, detail: a.detail }));
        choices.push({ id: 'back', label: 'A Different Format', aliases: ['back', 'format'] });
        return { title: 'What Is It About?', eyebrow, text: 'The angle is what people remember. It’s also what they argue with.', choices, canSkip: true };
      }
      case 'hook': {
        const choices: SceneChoice[] = CRAFT_HOOKS.map((h) => ({ id: `hook:${h.id}`, label: h.label, aliases: h.aliases, detail: h.detail }));
        choices.push({ id: 'back', label: 'A Different Angle', aliases: ['back', 'angle'] });
        return { title: 'How Does It Open?', eyebrow, text: 'The first second, or the first line. Most people never get past it.', choices, canSkip: true };
      }
      case 'effort': {
        const format = str(session, 'format') as PostFormat;
        const choices: SceneChoice[] = effortChoices(format).map((e) => ({
          id: `effort:${e.minutes}`, label: e.label, aliases: [e.id], detail: e.detail,
          disabled: sim.player.wellbeing.energy - e.minutes / 22 < 5 ? 'You don’t have that in you today.' : undefined,
        }));
        choices.push({ id: 'back', label: 'A Different Hook', aliases: ['back', 'hook'] });
        return { title: 'How Long Will You Give It?', eyebrow, text: 'Time is the one thing that always shows. It costs energy at the same rate.', choices, facts: [{ label: 'Energy', value: `${Math.round(sim.player.wellbeing.energy)}` }, { label: 'Now', value: formatTime(sim.now, sim.zone) }], canSkip: true };
      }
      case 'review': {
        const quality = projected(sim, session);
        const minutes = num(session, 'minutes');
        const angle = CRAFT_ANGLES.find((a) => a.id === str(session, 'angle'));
        const hook = CRAFT_HOOKS.find((h) => h.id === str(session, 'hook'));
        return {
          title: 'Before It Goes Up',
          eyebrow,
          text: `${titleCaseLabel(str(session, 'format').replace(/_/g, ' '))}: ${angle?.label.toLowerCase() ?? 'an angle'}, ${hook?.label.toLowerCase() ?? 'a hook'}, ${formatDuration(minutes * MS_MINUTE)} of work. The projection is yours to read; the audience is the audience.`,
          choices: [
            { id: 'publish', label: 'Publish It', aliases: ['publish', 'post', 'go', 'yes'], tone: 'primary', detail: `${formatDuration(minutes * MS_MINUTE)} now; reactions in a day.` },
            { id: 'rethink', label: 'Start Again', aliases: ['again', 'rethink', 'back'] },
          ],
          facts: [
            { label: 'Projected Quality', value: `${quality} / 100` },
            { label: 'It Will Take', value: formatDuration(minutes * MS_MINUTE) },
            { label: 'Energy After', value: `${Math.max(0, Math.round(sim.player.wellbeing.energy - minutes / 22))}` },
            { label: 'Up By', value: formatTime(sim.now + minutes * MS_MINUTE, sim.zone) },
          ],
          canSkip: true,
        };
      }
      case 'done': {
        return {
          title: 'Out Of Your Hands',
          eyebrow,
          text: `It goes up on ${platform.name} at ${formatTime(num(session, 'publishesAt'), sim.zone)} on ${formatDate(num(session, 'publishesAt'), sim.zone)}. The audience gets a day, and then you hear what it thought.`,
          choices: [{ id: 'finish', label: 'Back To The Day', aliases: ['done', 'ok', 'finish'], tone: 'primary' }],
          facts: [{ label: 'Quality', value: `${num(session, 'quality')} / 100` }, { label: 'Reactions', value: `Tomorrow, ${formatTime(num(session, 'publishesAt'), sim.zone)}` }],
          canSkip: false,
          canLeave: false,
        };
      }
      default:
        throw unknownStep();
    }
  },

  choose(sim, session, choiceId, ctx) {
    switch (session.node) {
      case 'format': {
        if (!choiceId.startsWith('format:')) throw unknownStep();
        session.context['format'] = choiceId.slice(7);
        ctx.go('angle');
        return;
      }
      case 'angle': {
        if (choiceId === 'back') { ctx.go('format'); return; }
        if (!choiceId.startsWith('angle:')) throw unknownStep();
        session.context['angle'] = choiceId.slice(6);
        ctx.go('hook');
        return;
      }
      case 'hook': {
        if (choiceId === 'back') { ctx.go('angle'); return; }
        if (!choiceId.startsWith('hook:')) throw unknownStep();
        session.context['hook'] = choiceId.slice(5);
        ctx.go('effort');
        return;
      }
      case 'effort': {
        if (choiceId === 'back') { ctx.go('hook'); return; }
        if (!choiceId.startsWith('effort:')) throw unknownStep();
        session.context['minutes'] = Number(choiceId.slice(7));
        ctx.go('review');
        return;
      }
      case 'review': {
        if (choiceId === 'rethink') { ctx.go('format'); return; }
        if (choiceId !== 'publish') throw unknownStep();
        publish(sim, session, ctx);
        ctx.go('done');
        return;
      }
      case 'done': {
        if (choiceId !== 'finish') throw unknownStep();
        ctx.finish();
        return;
      }
      default:
        throw unknownStep();
    }
  },

  summarise(sim, session, ctx) {
    const { platform } = accountOf(sim, session);
    if (!str(session, 'format')) session.context['format'] = platform.formats[0] ?? 'photo';
    if (!str(session, 'angle')) session.context['angle'] = 'behind';
    if (!str(session, 'hook')) session.context['hook'] = 'plain';
    if (!num(session, 'minutes')) session.context['minutes'] = effortChoices(str(session, 'format') as PostFormat).find((e) => e.id === 'proper')?.minutes ?? FORMAT_PROFILE[str(session, 'format') as PostFormat].minMinutes;
    if (!str(session, 'postId')) publish(sim, session, ctx);
    ctx.finish();
  },
});

function publish(sim: Simulation, session: SceneSession, ctx: Parameters<NonNullable<ReturnType<typeof defineScene>['summarise']>>[2]): void {
  const angle = CRAFT_ANGLES.find((a) => a.id === str(session, 'angle'));
  const published = ctx.commit<{ postId: string; publishesAt: number; projectedQuality: number }>('publish', {
    kind: 'social.create_post',
    payload: {
      accountId: str(session, 'accountId'),
      format: str(session, 'format'),
      title: `${angle?.label ?? 'A Post'} — ${formatDate(sim.now, sim.zone)}`,
      effortMinutes: num(session, 'minutes'),
      topic: angle?.topic ?? 'general',
      craft: { angle: str(session, 'angle'), hook: str(session, 'hook') },
    },
  });
  session.context['postId'] = published.postId;
  session.context['quality'] = published.projectedQuality;
  session.context['publishesAt'] = published.publishesAt;
  ctx.say(`Published. Quality ${published.projectedQuality} out of 100, by your own reckoning.`);
}
