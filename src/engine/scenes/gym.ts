/**
 * The gym, played out.
 *
 * You get there. You get in — with a pass you have, or one you buy at the
 * desk. You decide what the session is for, whether somebody is going to
 * watch your form, and then one block at a time: which exercise, how hard,
 * and whether that was enough. You cool down, you shower if there is one,
 * and you walk out knowing how tomorrow is going to feel.
 *
 * Every number is the fitness system's. This decides what to ask and in what
 * order; `gym.*` decides what it costs and what it does, and the summarized
 * version of this scene runs the same commands with sensible defaults.
 */

import { CommandError, type Simulation } from '../core/simulation';
import { MS_MINUTE, formatDuration, formatTime } from '../core/time';
import { formatMoney } from '../core/money';
import type { Id, SceneSession, WorkoutFocus, WorkoutIntensity } from '../domain/model';
import { INVENTED_NOTE, REAL_NOTE, placesIn, type Place } from '../content/places';
import {
  EXERCISES, FACILITY_LABEL, INTENSITY, gymProfile, hoursLabel, type GymProfile,
} from '../content/fitness';
import { MODE_LABEL, bathroomFor, driveableVehicle, planJourney, type Mode } from '../systems/places';
import {
  TOO_TIRED_TO_TRAIN, WORKOUT_ELSEWHERE, bookedTrainer, classesSoon, isGymOpen, membershipFor, trainersAt, trainingOf,
} from '../systems/fitness';
import { factsOf } from '../systems/memory';
import { readiness } from '../systems/life';
import { defineScene, unknownStep, type SceneChoice, type SceneRuntime } from '../systems/scenes';

const SETS_FOR: Readonly<Record<WorkoutIntensity, number>> = { easy: 2, steady: 3, hard: 4 };

const FOCUS_LABEL: Readonly<Record<Exclude<WorkoutFocus, 'class'>, string>> = {
  strength: 'Strength', cardio: 'Cardio', mobility: 'Mobility',
};

const GOALS: readonly { id: string; label: string }[] = [
  { id: 'stronger', label: 'Get Stronger' },
  { id: 'leaner', label: 'Get Leaner' },
  { id: 'durable', label: 'Stay Injury Free' },
  { id: 'camera', label: 'Look Right On Camera' },
  { id: 'head', label: 'Keep My Head Straight' },
];

function placeOf(session: SceneSession): Place {
  const place = placesIn(session.locationId).find((p) => p.id === String(session.context['placeId']) && p.kind === 'gym');
  if (!place) throw new CommandError('That gym isn’t here any more.');
  return place;
}

function str(session: SceneSession, key: string): string {
  const value = session.context[key];
  return value === null || value === undefined ? '' : String(value);
}

function num(session: SceneSession, key: string): number {
  return Number(session.context[key] ?? 0);
}

function journeyChoices(sim: Simulation, place: Place, open: boolean, profile: GymProfile): SceneChoice[] {
  const modes: Mode[] = ['walk', 'drive', 'taxi', 'transit'];
  const out: SceneChoice[] = [];
  for (const mode of modes) {
    if (mode === 'drive' && !driveableVehicle(sim)) continue;
    const journey = planJourney(sim, place, mode);
    const detail = `${formatDuration(journey.minutes * MS_MINUTE)}${journey.cost > 0 ? ` · ${formatMoney(journey.cost)}` : ''}`;
    out.push(open
      ? { id: `go:${mode}`, label: MODE_LABEL[mode], aliases: [mode, `${mode} there`], detail }
      : { id: `go:${mode}`, label: MODE_LABEL[mode], detail, disabled: `${place.name} is closed. ${hoursLabel(profile.hours)}.` });
  }
  return out;
}

function focusAvailable(profile: GymProfile, focus: Exclude<WorkoutFocus, 'class'>): boolean {
  return EXERCISES.some((e) => e.focus === focus && profile.facilities.includes(e.facility));
}

function trainerLine(sim: Simulation, session: SceneSession): string {
  const player = sim.player;
  const trainer = bookedTrainer(sim, player, str(session, 'placeId'));
  if (!trainer) return '';
  const goal = factsOf(sim, trainer.id, { kind: 'goal', aboutId: player.id })[0];
  const preference = factsOf(sim, trainer.id, { kind: 'preference', aboutId: player.id })[0];
  const remembered = [goal ? `you want to ${goal.text.toLowerCase()}` : '', preference ? preference.text.replace(/\.$/, '').toLowerCase() : ''].filter(Boolean);
  return remembered.length > 0
    ? ` ${trainer.firstName} is with you, and remembers that ${remembered.join(' and ')}.`
    : ` ${trainer.firstName} is with you.`;
}

export const GYM_SCENE = defineScene({
  id: 'fitness.gym',
  version: 1,
  title: 'The Gym',
  placeBound: true,

  available(sim, input) {
    const place = placesIn(sim.player.currentLocationId).find((p) => p.id === String(input['placeId']) && p.kind === 'gym');
    if (!place) return { ok: false, reason: 'Pick a gym in the city you’re in.' };
    if (sim.player.wellbeing.energy < 12) return { ok: false, reason: TOO_TIRED_TO_TRAIN };
    const current = sim.player.training?.current;
    if (current && current.placeId !== place.id) return { ok: false, reason: WORKOUT_ELSEWHERE };
    return { ok: true };
  },

  start(sim, input) {
    const placeId = String(input['placeId']);
    const here = sim.player.currentPlaceId === placeId;
    return {
      node: here ? 'desk' : 'arrive',
      placeId: here ? placeId : undefined,
      context: { placeId, arrived: here, focus: null, exerciseId: null, classId: null, goal: null, blocks: 0, lastNote: '', showered: false, stretched: false, summary: '' },
    };
  },

  view(sim, session) {
    const place = placeOf(session);
    const profile = gymProfile(place);
    const player = sim.player;
    const open = isGymOpen(sim, profile);
    const training = trainingOf(player);

    switch (session.node) {
      case 'arrive': {
        return {
          title: place.name,
          eyebrow: place.real ? 'A Real Gym' : 'A Gym',
          text: `${place.about} ${place.real ? REAL_NOTE : INVENTED_NOTE} ${hoursLabel(profile.hours)}, ${open ? 'and open now' : 'and closed right now'}.`,
          facts: [
            { label: 'Hours', value: hoursLabel(profile.hours) },
            { label: 'Day Pass', value: formatMoney(profile.dayPass) },
            { label: 'Monthly', value: formatMoney(profile.monthly) },
            { label: 'Has', value: profile.facilities.map((f) => FACILITY_LABEL[f]).join(', ') },
          ],
          choices: journeyChoices(sim, place, open, profile),
          canSkip: open,
        };
      }
      case 'desk': {
        const membership = membershipFor(sim, player.id, place.id);
        const choices: SceneChoice[] = membership
          ? [{ id: 'checkin', label: 'Check In', aliases: ['go in', 'enter', 'scan in'], tone: 'primary' }]
          : [
            { id: 'pass:day_pass', label: 'Buy A Day Pass', aliases: ['day pass', 'one day', 'today'], detail: `${formatMoney(profile.dayPass)} · twenty-four hours` },
            { id: 'pass:monthly', label: 'Join For A Month', aliases: ['monthly', 'month', 'join'], detail: `${formatMoney(profile.monthly)} · renews monthly, cancel any time` },
            { id: 'pass:annual', label: 'Join For A Year', aliases: ['annual', 'year', 'yearly'], detail: `${formatMoney(profile.annual)} · renews yearly` },
          ];
        if (!open) {
          for (const c of choices) c.disabled = `${place.name} is closed. ${hoursLabel(profile.hours)}.`;
        }
        return {
          title: 'The Front Desk',
          eyebrow: place.name,
          text: membership
            ? `Your ${membership.product === 'day_pass' ? 'day pass' : membership.product === 'monthly' ? 'monthly membership' : 'annual membership'} gets you in${membership.visits > 0 ? `; this is visit ${membership.visits + 1}` : ''}. ${profile.facilities.map((f) => FACILITY_LABEL[f]).join(', ')} inside.`
            : `You have no pass here. ${profile.calibration === 'calibrated_estimate' ? 'The prices on the wall are SLATE’s calibration, not the chain’s.' : 'The prices are on the wall.'} ${profile.facilities.map((f) => FACILITY_LABEL[f]).join(', ')} inside.`,
          facts: [
            { label: 'Hours', value: hoursLabel(profile.hours) },
            { label: 'Trainers', value: `${Math.max(2, trainersAt(sim, place.id).length)} on the floor` },
            { label: 'Classes', value: profile.classes.length > 0 ? profile.classes.map((c) => c.name).join(', ') : 'None' },
          ],
          choices,
          canSkip: open,
        };
      }
      case 'plan': {
        const soon = classesSoon(sim, profile).filter((c) => c.soon);
        const choices: SceneChoice[] = [];
        for (const focus of ['strength', 'cardio', 'mobility'] as const) {
          if (!focusAvailable(profile, focus)) continue;
          choices.push({ id: `focus:${focus}`, label: FOCUS_LABEL[focus], aliases: [focus, `${focus} work`] });
        }
        for (const slot of soon) {
          const membership = membershipFor(sim, player.id, place.id);
          const free = membership && membership.product !== 'day_pass';
          choices.push({ id: `class:${slot.def.id}`, label: `${slot.def.name} At ${formatTime(slot.startsAt, sim.zone)}`, aliases: [slot.def.id, slot.def.name], detail: `${slot.def.minutes} minutes · ${free ? 'included' : 'drop-in'}` });
        }
        if (!bookedTrainer(sim, player, place.id)) {
          choices.push({ id: 'trainer', label: 'Get A Trainer', aliases: ['trainer', 'coach', 'hire a trainer'], detail: `${formatMoney(profile.trainerHourly)} an hour · half the injury risk, faster gains` });
        }
        if (num(session, 'blocks') > 0) {
          choices.push({ id: 'done', label: 'Finish Up', aliases: ['done', 'finish', 'enough', 'cool down'] });
        }
        const blocks = num(session, 'blocks');
        return {
          title: 'What Is Today For?',
          eyebrow: place.name,
          text: `${blocks === 0
            ? (training.sessions === 0 ? 'Your first session here.' : `Session ${training.sessions + 1}.`)
            : `${blocks} block${blocks === 1 ? '' : 's'} done.`
          } Energy ${Math.round(player.wellbeing.energy)}, readiness ${Math.round(readiness(player))}${training.soreness > 30 ? `, and still sore from last time` : ''}.${trainerLine(sim, session)}`,
          choices,
          canSkip: true,
        };
      }
      case 'trainer': {
        const trainers = trainersAt(sim, place.id);
        const choices: SceneChoice[] = trainers.map((t) => {
          const known = factsOf(sim, t.id, { aboutId: player.id });
          return {
            id: `hire:${t.id}`, label: t.displayName, aliases: [t.firstName, t.lastName],
            detail: known.length > 0 ? `Knows you. ${known[0]!.text}` : `Fitness ${Math.round(t.skills['fitness'] ?? 70)}. New to you.`,
          };
        });
        choices.push({ id: 'back', label: 'Never Mind', aliases: ['back', 'no', 'cancel'] });
        return {
          title: 'The Trainers',
          eyebrow: place.name,
          text: `An hour with a trainer is ${formatMoney(profile.trainerHourly)}. They watch your form, which halves the chance of hurting yourself, and they remember what you told them.`,
          choices,
          canSkip: false,
        };
      }
      case 'goal': {
        return {
          title: 'What Are You Training For?',
          eyebrow: 'Your trainer asks',
          text: 'They’ll build the next sessions around it, and they’ll remember.',
          choices: GOALS.map((g) => ({ id: `goal:${g.id}`, label: g.label, aliases: [g.id] })),
          canSkip: false,
        };
      }
      case 'pick': {
        const focus = str(session, 'focus') as Exclude<WorkoutFocus, 'class'>;
        const options = EXERCISES.filter((e) => e.focus === focus && profile.facilities.includes(e.facility)).slice(0, 6);
        const choices: SceneChoice[] = options.map((e) => {
          const lift = training.lifts[e.id];
          return {
            id: `ex:${e.id}`, label: e.name, aliases: [e.id, e.name],
            detail: lift ? `Best ${lift.best} ${e.unit} · ${e.cue}` : e.cue,
          };
        });
        choices.push({ id: 'switch', label: 'Something Else', aliases: ['switch', 'different', 'change focus'] });
        if (num(session, 'blocks') > 0) choices.push({ id: 'done', label: 'Finish Up', aliases: ['done', 'finish', 'enough'] });
        const last = str(session, 'lastNote');
        return {
          title: FOCUS_LABEL[focus] ?? 'Training',
          eyebrow: place.name,
          text: `${last ? `${last} ` : ''}Energy ${Math.round(player.wellbeing.energy)}. ${num(session, 'blocks')} block${num(session, 'blocks') === 1 ? '' : 's'} so far.${trainerLine(sim, session)}`,
          choices,
          canSkip: false,
        };
      }
      case 'effort': {
        const exercise = EXERCISES.find((e) => e.id === str(session, 'exerciseId'));
        if (!exercise) throw new CommandError('That exercise isn’t here.');
        const choices: SceneChoice[] = (['easy', 'steady', 'hard'] as const).map((level) => {
          const spec = INTENSITY[level];
          const sets = SETS_FOR[level];
          const minutes = Math.round(sets * exercise.minutesPerSet * (level === 'hard' ? 1.15 : 1) + sets - 1);
          const choice: SceneChoice = { id: `go:${level}`, label: spec.label, aliases: [level], detail: `${sets} sets · ${minutes} min · ${spec.note}` };
          if (level === 'hard' && training.soreness > 60) choice.disabled = 'Too sore for that today. Easy or steady.';
          if (level !== 'easy' && player.wellbeing.energy < 25) choice.disabled = 'Not enough in the tank for that. Keep it easy.';
          return choice;
        });
        choices.push({ id: 'back', label: 'Pick Something Else', aliases: ['back', 'different'] });
        return {
          title: exercise.name,
          eyebrow: 'How hard',
          text: exercise.cue,
          choices,
          canSkip: false,
        };
      }
      case 'class': {
        const slot = classesSoon(sim, profile).find((c) => c.def.id === str(session, 'classId'));
        if (!slot) {
          // The class was on when this was opened. Left overnight, it has
          // started without you; a view that throws would take the panel
          // down with it, so this says what happened and offers the floor.
          return {
            title: 'That Class Has Gone',
            eyebrow: place.name,
            text: 'It started without you, or it isn’t on today. The floor is still here.',
            choices: [{ id: 'back', label: 'Pick Something Else', aliases: ['back', 'different', 'ok'], tone: 'primary' }],
            canSkip: false,
          };
        }
        const membership = membershipFor(sim, player.id, place.id);
        const free = membership && membership.product !== 'day_pass';
        return {
          title: slot.def.name,
          eyebrow: `Starts ${formatTime(slot.startsAt, sim.zone)}`,
          text: `${slot.def.about} ${slot.def.minutes} minutes. ${free ? 'Included in your membership.' : 'Drop-in price on the door.'}`,
          choices: [
            { id: 'take', label: 'Take The Class', aliases: ['take', 'join', 'yes'], tone: 'primary' },
            { id: 'back', label: 'Not This Time', aliases: ['back', 'no'] },
          ],
          canSkip: false,
        };
      }
      case 'cooldown': {
        const choices: SceneChoice[] = [];
        if (!session.context['stretched'] && profile.facilities.includes('floor') && player.wellbeing.energy >= 5) {
          choices.push({ id: 'stretch', label: 'Stretch It Out', aliases: ['stretch', 'cool down'], detail: 'Ten minutes. Less soreness tomorrow.' });
        }
        if (!session.context['showered'] && bathroomFor(sim, player)) {
          choices.push({ id: 'shower', label: 'Shower', aliases: ['wash', 'clean up'], detail: 'The changing rooms are right there.' });
        }
        choices.push({ id: 'finish', label: 'Walk Out', aliases: ['finish', 'leave', 'done', 'go'], tone: 'primary' });
        const blocks = num(session, 'blocks');
        return {
          title: 'Cooling Down',
          eyebrow: place.name,
          text: `${blocks === 0 ? 'You did not do much.' : `${blocks} block${blocks === 1 ? '' : 's'}.`} ${training.soreness > 35 ? 'You will feel this tomorrow.' : 'You should be fine tomorrow.'} ${trainerLine(sim, session)}`,
          choices,
          canSkip: false,
        };
      }
      case 'reflect': {
        return {
          title: 'Afterwards',
          eyebrow: place.name,
          text: `${str(session, 'summary')} Readiness is ${Math.round(readiness(player))} now, energy ${Math.round(player.wellbeing.energy)}, fitness ${Math.round(player.wellbeing.fitness)}.`,
          facts: [
            { label: 'Soreness', value: `${Math.round(training.soreness)} / 100` },
            { label: 'Sessions', value: `${training.sessions}` },
            { label: 'Time', value: formatTime(sim.now, sim.zone) },
          ],
          choices: [{ id: 'finish', label: 'Back To The Day', aliases: ['done', 'ok', 'finish'], tone: 'primary' }],
          canSkip: false,
        };
      }
      default:
        throw unknownStep();
    }
  },

  choose(sim, session, choiceId, ctx) {
    const place = placeOf(session);
    const training = trainingOf(sim.player);

    if (session.node === 'arrive' && choiceId.startsWith('go:')) {
      const mode = choiceId.slice(3) as Mode;
      const trip = ctx.commit<{ minutes: number; note: string }>(`go:${mode}`, { kind: 'go.to', payload: { placeId: place.id, mode } });
      session.placeId = place.id;
      session.context['arrived'] = true;
      ctx.say(trip.note);
      ctx.go('desk');
      return;
    }
    if (session.node === 'desk') {
      if (choiceId.startsWith('pass:')) {
        const product = choiceId.slice(5) as 'day_pass' | 'monthly' | 'annual';
        const bought = ctx.commit<{ cost: number }>(`pass:${product}`, { kind: 'gym.buy_pass', payload: { placeId: place.id, product } });
        ctx.say(`${formatMoney(bought.cost)}, and a card with your name on it.`);
      }
      if (choiceId === 'checkin' || choiceId.startsWith('pass:')) {
        ctx.commit('checkin', { kind: 'gym.check_in', payload: { placeId: place.id } });
        ctx.go('plan');
        return;
      }
    }
    if (session.node === 'plan') {
      if (choiceId.startsWith('focus:')) { session.context['focus'] = choiceId.slice(6); ctx.go('pick'); return; }
      if (choiceId.startsWith('class:')) { session.context['classId'] = choiceId.slice(6); ctx.go('class'); return; }
      if (choiceId === 'trainer') { ctx.go('trainer'); return; }
      if (choiceId === 'done') { ctx.go('cooldown'); return; }
    }
    if (session.node === 'trainer') {
      if (choiceId === 'back') { ctx.go('plan'); return; }
      if (choiceId.startsWith('hire:')) {
        const trainerId = choiceId.slice(5) as Id;
        const hired = ctx.commit<{ cost: number; trainerName: string }>(`hire:${trainerId}`, { kind: 'gym.hire_trainer', payload: { placeId: place.id, trainerId, minutes: 60 } });
        ctx.say(`${hired.trainerName}. ${formatMoney(hired.cost)} for the hour.`);
        const knownGoal = factsOf(sim, trainerId, { kind: 'goal', aboutId: sim.player.id })[0];
        ctx.go(knownGoal ? 'plan' : 'goal');
        return;
      }
    }
    if (session.node === 'goal' && choiceId.startsWith('goal:')) {
      const goal = GOALS.find((g) => g.id === choiceId.slice(5));
      session.context['goal'] = goal?.label ?? null;
      ctx.go('plan');
      return;
    }
    if (session.node === 'pick') {
      if (choiceId === 'switch') { ctx.go('plan'); return; }
      if (choiceId === 'done') { ctx.go('cooldown'); return; }
      if (choiceId.startsWith('ex:')) { session.context['exerciseId'] = choiceId.slice(3); ctx.go('effort'); return; }
    }
    if (session.node === 'effort') {
      if (choiceId === 'back') { ctx.go('pick'); return; }
      if (choiceId.startsWith('go:')) {
        const intensity = choiceId.slice(3) as WorkoutIntensity;
        const n = num(session, 'blocks');
        const result = ctx.commit<{ note: string; injured: boolean; progressed: boolean }>(`block:${n}`, {
          kind: 'gym.train_block',
          payload: { placeId: place.id, exerciseId: str(session, 'exerciseId'), sets: SETS_FOR[intensity], intensity, focus: str(session, 'focus') || 'strength' },
        });
        session.context['blocks'] = n + 1;
        session.context['lastNote'] = result.note;
        ctx.say(result.note);
        ctx.go(result.injured ? 'cooldown' : 'pick');
        return;
      }
    }
    if (session.node === 'class') {
      if (choiceId === 'back') { session.context['classId'] = null; ctx.go('plan'); return; }
      if (choiceId === 'take') {
        const result = ctx.commit<{ minutes: number; cost: number }>(`class:${str(session, 'classId')}`, { kind: 'gym.take_class', payload: { placeId: place.id, classId: str(session, 'classId') } });
        session.context['blocks'] = num(session, 'blocks') + 1;
        ctx.say(`${result.minutes} minutes${result.cost > 0 ? ` and ${formatMoney(result.cost)}` : ''}. Done.`);
        ctx.go('cooldown');
        return;
      }
    }
    if (session.node === 'cooldown') {
      if (choiceId === 'stretch') {
        const n = num(session, 'blocks');
        const result = ctx.commit<{ note: string }>(`block:${n}`, { kind: 'gym.train_block', payload: { placeId: place.id, exerciseId: 'stretch', sets: 1, intensity: 'easy' } });
        session.context['blocks'] = n + 1;
        session.context['stretched'] = true;
        ctx.say(result.note);
        return;
      }
      if (choiceId === 'shower') {
        ctx.commit('shower', { kind: 'life.shower', payload: {} });
        session.context['showered'] = true;
        ctx.say('Hot water. You look like a person again.');
        return;
      }
      if (choiceId === 'finish') { finish(session, ctx); return; }
    }
    if (session.node === 'reflect' && choiceId === 'finish') { ctx.finish(); return; }
    void training;
    throw new CommandError('That isn’t a choice here.');
  },

  summarise(sim, session, ctx) {
    const place = placeOf(session);
    const profile = gymProfile(place);
    if (!isGymOpen(sim, profile)) throw new CommandError(`${place.name} is closed. ${hoursLabel(profile.hours)}.`);
    if (session.node === 'arrive') {
      const mode: Mode = driveableVehicle(sim) ? 'drive' : 'walk';
      ctx.commit(`go:${mode}`, { kind: 'go.to', payload: { placeId: place.id, mode } });
      session.placeId = place.id;
      session.node = 'desk';
    }
    if (session.node === 'desk') {
      if (!membershipFor(sim, sim.player.id, place.id)) {
        ctx.commit('pass:day_pass', { kind: 'gym.buy_pass', payload: { placeId: place.id, product: 'day_pass' } });
      }
      ctx.commit('checkin', { kind: 'gym.check_in', payload: { placeId: place.id } });
      session.node = 'plan';
    }
    if (session.node === 'plan' || session.node === 'pick' || session.node === 'effort' || session.node === 'trainer' || session.node === 'goal' || session.node === 'class') {
      const focus = (str(session, 'focus') || 'strength') as Exclude<WorkoutFocus, 'class'>;
      const options = EXERCISES.filter((e) => e.focus === focus && profile.facilities.includes(e.facility)).slice(0, 3);
      for (const exercise of options) {
        if (sim.player.wellbeing.energy < 25) break;
        const n = num(session, 'blocks');
        const result = ctx.commit<{ note: string; injured: boolean }>(`block:${n}`, {
          kind: 'gym.train_block', payload: { placeId: place.id, exerciseId: exercise.id, sets: 3, intensity: 'steady', focus },
        });
        session.context['blocks'] = n + 1;
        ctx.say(`${exercise.name}: ${result.note}`);
        if (result.injured) break;
      }
      session.node = 'cooldown';
    }
    if (session.node === 'cooldown') finish(session, ctx);
    ctx.say(str(session, 'summary'));
  },
});

function finish(session: SceneSession, ctx: SceneRuntime): void {
  const place = placeOf(session);
  const result = ctx.commit<{ summary: string }>('finish', {
    kind: 'gym.finish_workout',
    payload: { placeId: place.id, cutShort: num(session, 'blocks') < 2, goal: str(session, 'goal') || undefined },
  });
  session.context['summary'] = result.summary;
  ctx.go('reflect');
}
