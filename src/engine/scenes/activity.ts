/**
 * An ordinary thing you do with your time, played out.
 *
 * Rest, a nap, a run, reading, writing, rehearsing, errands. You decide how
 * long, you see what it will cost and where it lands on your day, you do it,
 * and you see what it did. The activity itself is `life.do_activity`, the
 * same command the button used to call: the scene is the decision around it,
 * and the same rules apply whether it is played or skipped.
 *
 * Cooking keeps its own flow (a recipe and a pantry), and the gym has a
 * scene of its own with a building in it.
 */

import { CommandError } from '../core/simulation';
import { MS_MINUTE, formatDuration, formatTime } from '../core/time';
import { formatMoney } from '../core/money';
import { costOfLiving } from '../content/tax';
import { ACTIVITY_BY_ID, readiness, type ActivityDef } from '../systems/life';
import { bathroomFor } from '../systems/places';
import { defineScene, unknownStep, type SceneChoice, type SceneRuntime } from '../systems/scenes';
import type { SceneSession } from '../domain/model';
import type { Simulation } from '../core/simulation';

function activityOf(session: SceneSession): ActivityDef {
  const def = ACTIVITY_BY_ID[String(session.context['activityId'])];
  if (!def) throw new CommandError('That activity is no longer available.');
  return def;
}

function minutesOf(session: SceneSession): number {
  const value = Number(session.context['minutes']);
  if (!Number.isInteger(value) || value < 1 || value > 1440) throw new CommandError('Choose a whole number of minutes.');
  return value;
}

function boundsOf(def: ActivityDef): { min: number; max: number } {
  return { min: def.variableDuration?.min ?? def.minutes, max: def.variableDuration?.max ?? def.minutes };
}

function quote(sim: Simulation, def: ActivityDef): number {
  return def.cost ? Math.round(def.cost * costOfLiving(sim.player.currentLocationId)) : 0;
}

const OPENERS: Record<ActivityDef['category'], string> = {
  rest: 'You find somewhere to stop. How long you give it decides how much of the day is left afterwards.',
  care: 'A few minutes on yourself. It’s never wasted.',
  food: 'You’re going to eat. Decide how long you want it to take.',
  fitness: 'You make room for training. A shorter session leaves more in the tank for what comes next; a longer one does more, and costs more energy to do it.',
  leisure: 'Time that’s yours. Decide how much of it to spend.',
  social: 'Company. Decide how long you’re out.',
  chores: 'The unglamorous kind of afternoon. Decide how much of it to give.',
  transport: 'Time you don’t get back. Decide how much.',
  creative: 'Work, on your own terms. Decide how long you sit with it.',
};

function describeEffects(effects: Record<string, number>): string {
  const names: Record<string, string> = {
    energy: 'energy', stress: 'stress', morale: 'morale', fitness: 'fitness', condition: 'condition',
    nourishment: 'hunger', hygiene: 'freshness', sleepDebt: 'sleep debt',
  };
  const parts = Object.entries(effects)
    .filter(([key, delta]) => names[key] && Math.abs(delta) >= 0.5)
    .map(([key, delta]) => `${names[key]} ${delta > 0 ? 'up' : 'down'} ${Math.abs(Math.round(delta))}`);
  return parts.length > 0 ? parts.join(', ') + '.' : 'Nothing you’d notice.';
}

function durationChoices(def: ActivityDef, session: SceneSession): SceneChoice[] {
  const { min, max } = boundsOf(def);
  const planned = minutesOf(session);
  const choices: SceneChoice[] = [
    { id: 'planned', label: `Keep It At ${formatDuration(planned * MS_MINUTE)}`, aliases: ['keep', 'planned', 'as planned', 'continue'] },
  ];
  if (min !== max) {
    const mid = Math.round((min + max) / 2 / 5) * 5;
    if (min !== planned) choices.push({ id: 'short', label: `Keep It Short · ${formatDuration(min * MS_MINUTE)}`, aliases: ['short', 'quick', 'take it easy', 'brief'] });
    if (mid !== planned && mid !== min && mid !== max) choices.push({ id: 'middle', label: `Somewhere In Between · ${formatDuration(mid * MS_MINUTE)}`, aliases: ['middle', 'medium', 'between', 'half'] });
    if (max !== planned) choices.push({ id: 'long', label: `Make A Proper Job Of It · ${formatDuration(max * MS_MINUTE)}`, aliases: ['long', 'longer', 'proper', 'all of it'] });
  }
  return choices;
}

export const ACTIVITY_SCENE = defineScene({
  id: 'wellbeing.activity',
  version: 2,
  title: 'An Activity',

  available(sim, input) {
    const def = ACTIVITY_BY_ID[String(input['activityId'])];
    if (!def) return { ok: false, reason: 'Choose an activity that exists.' };
    if (def.id === 'cook') return { ok: false, reason: 'Cooking starts from a recipe. Choose one in Cook Something.' };
    if (def.id === 'gym') return { ok: false, reason: 'Training happens at a gym. Pick one in The City and walk in.' };
    if (def.requiresHome && !sim.player.residenceId) return { ok: false, reason: `${def.name} needs somewhere to live. You don’t have a home yet.` };
    if (sim.player.wellbeing.energy < 8 && (def.perHour.energy ?? 0) < 0) return { ok: false, reason: 'You’re too exhausted for that. Sleep first.' };
    return { ok: true };
  },

  start(_sim, input) {
    const def = ACTIVITY_BY_ID[String(input['activityId'])]!;
    const { min, max } = boundsOf(def);
    const asked = input['minutes'];
    const minutes = asked === undefined ? def.minutes : Number(asked);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) throw new CommandError('Choose a whole number of minutes between 1 and 1440.');
    if (minutes < min || minutes > max) throw new CommandError(`${def.name} takes between ${min} and ${max} minutes.`);
    return { node: 'prepare', context: { activityId: def.id, minutes } };
  },

  view(sim, session) {
    const def = activityOf(session);
    const minutes = minutesOf(session);
    if (session.node === 'prepare') {
      return {
        title: def.name,
        eyebrow: 'Before',
        text: OPENERS[def.category],
        choices: durationChoices(def, session),
        canSkip: true,
      };
    }
    if (session.node === 'review') {
      const cost = quote(sim, def);
      const endsAt = sim.now + minutes * MS_MINUTE;
      const clash = sim.timeline.conflicts(sim.now, minutes)[0];
      const facts = [
        { label: 'Takes', value: formatDuration(minutes * MS_MINUTE) },
        { label: 'Ends', value: formatTime(endsAt, sim.zone) },
        { label: 'Costs', value: cost > 0 ? formatMoney(cost) : 'Nothing' },
        { label: 'Energy Now', value: `${Math.round(sim.player.wellbeing.energy)} / 100` },
      ];
      const begin: SceneChoice = clash
        ? { id: 'begin', label: 'Begin', disabled: `That would run into "${clash.label}" at ${formatTime(clash.at, sim.zone)}. Keep it shorter, or move one of them.` }
        : { id: 'begin', label: 'Begin', aliases: ['start', 'go', 'do it', 'begin the activity'], tone: 'primary' };
      return {
        title: def.name,
        eyebrow: 'Ready',
        text: cost > 0
          ? `${formatDuration(minutes * MS_MINUTE)}, about ${formatMoney(cost)}, done by ${formatTime(endsAt, sim.zone)}. The money and the calendar are checked again the moment you begin; the world keeps moving while you do it.`
          : `${formatDuration(minutes * MS_MINUTE)}, done by ${formatTime(endsAt, sim.zone)}. The calendar is checked again the moment you begin; the world keeps moving while you do it.`,
        facts,
        choices: [
          begin,
          { id: 'reconsider', label: 'Change The Time', aliases: ['back', 'change', 'reconsider', 'different length'] },
        ],
        canSkip: !clash,
      };
    }
    if (session.node === 'reflect') {
      const effects = JSON.parse(String(session.context['effects'] ?? '{}')) as Record<string, number>;
      const spent = Number(session.context['cost'] ?? 0);
      const choices: SceneChoice[] = [];
      if (def.category === 'fitness' && bathroomFor(sim, sim.player)) {
        choices.push({ id: 'shower', label: 'Shower', aliases: ['wash', 'clean up', 'freshen up'], detail: 'Twenty minutes, and you look like a person again.' });
      }
      choices.push({ id: 'finish', label: 'Back To The Day', aliases: ['done', 'finish', 'ok', 'leave it there'], tone: 'primary' });
      return {
        title: def.name,
        eyebrow: 'Afterwards',
        text: `${formatDuration(minutes * MS_MINUTE)}${spent > 0 ? ` and ${formatMoney(spent)}` : ''}. ${describeEffects(effects)} Readiness is ${Math.round(readiness(sim.player))} now.`,
        facts: [
          { label: 'Energy', value: `${Math.round(sim.player.wellbeing.energy)}` },
          { label: 'Stress', value: `${Math.round(sim.player.wellbeing.stress)}` },
          { label: 'Morale', value: `${Math.round(sim.player.wellbeing.morale)}` },
          { label: 'Time', value: formatTime(sim.now, sim.zone) },
        ],
        choices,
        canSkip: false,
      };
    }
    throw unknownStep();
  },

  choose(sim, session, choiceId, ctx) {
    const def = activityOf(session);
    const { min, max } = boundsOf(def);
    if (session.node === 'prepare') {
      if (choiceId === 'short') session.context['minutes'] = min;
      if (choiceId === 'long') session.context['minutes'] = max;
      if (choiceId === 'middle') session.context['minutes'] = Math.round((min + max) / 2 / 5) * 5;
      ctx.go('review');
      return;
    }
    if (session.node === 'review') {
      if (choiceId === 'reconsider') { ctx.go('prepare'); return; }
      if (choiceId === 'begin') { act(sim, session, ctx); return; }
    }
    if (session.node === 'reflect') {
      if (choiceId === 'shower') {
        ctx.commit('shower', { kind: 'life.shower', payload: {} });
        ctx.say('Twenty minutes under hot water. Better.');
        ctx.finish();
        return;
      }
      if (choiceId === 'finish') { ctx.finish(); return; }
    }
    throw new CommandError('That isn’t a choice here.');
  },

  summarise(sim, session, ctx) {
    if (session.node === 'prepare' || session.node === 'review') act(sim, session, ctx);
    const def = activityOf(session);
    const effects = JSON.parse(String(session.context['effects'] ?? '{}')) as Record<string, number>;
    ctx.say(`${def.name}, ${formatDuration(minutesOf(session) * MS_MINUTE)}. ${describeEffects(effects)}`);
  },
});

function act(sim: Simulation, session: SceneSession, ctx: SceneRuntime): void {
  const def = activityOf(session);
  const minutes = minutesOf(session);
  const result = ctx.commit<{ finishedAt: number; effects: Record<string, number>; cost: number }>('act', {
    kind: 'life.do_activity',
    payload: { activityId: def.id, minutes },
  });
  session.context['cost'] = result.cost;
  session.context['effects'] = JSON.stringify(result.effects);
  session.context['finishedAt'] = result.finishedAt;
  ctx.go('reflect');
  void sim;
}
