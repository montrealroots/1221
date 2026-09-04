/**
 * SLATE — a shooting day, by the hour.
 *
 * A day is not a dice roll. It is a crew call, a first setup, a rate of setups
 * an hour that depends on who is lighting it and who is directing it, takes
 * that depend on who is in front of the camera, a meal that has to happen by
 * the sixth hour or the crew goes onto penalty, exteriors that cannot be shot
 * after the sun goes down, a company move that eats an hour, and a wrap that
 * either comes on time or does not.
 *
 * The sun is real: sunrise and sunset come from the NOAA calculation for the
 * location and the date, which is why a February exterior in London has six
 * fewer hours to work with than a June one.
 *
 * What the day produces is footage, scene by scene, with a quality that comes
 * from the people who made it and the time they were given — not from a
 * single roll against the script.
 */

import type { Simulation } from '../core/simulation';
import type { CallSheet, HourEntry, Id, Person, Project, ScriptDraft, ShootDay } from '../domain/model';
import { clamp, remap } from '../core/rng';
import type { Rng } from '../core/rng';
import { MS_HOUR, addDays, formatTime, instantFromZoned, zonedParts } from '../core/time';
import { sunTimes } from '../core/sun';
import { CITIES, cityTimeZone } from '../content/geography';
import { effectiveAttributes, systemModifier } from '../domain/attributes';
import { readiness } from './life';
import { shootDayWeather } from './weather';

// ---------------------------------------------------------------------------
// Who is doing the work, and how good they are at it
// ---------------------------------------------------------------------------

/** The director's craft on the floor, 0-100, from whichever sheet they carry. */
export function directorCraft(director: Person | undefined): { efficiency: number; actors: number; vision: number } {
  if (!director) return { efficiency: 42, actors: 40, vision: 40 };
  const s = director.skills;
  // A real director carries a derived sheet; the player and generated crew
  // carry the profession's skills. Read whichever is there.
  const efficiency = s['coverage'] ?? s['pace'] ?? s['shot_efficiency'] ?? s['coverage_planning'] ?? 40;
  const actors = s['actor_direction'] ?? 40;
  const vision = s['visual_authorship'] ?? s['staging'] ?? s['visual_language'] ?? 40;
  return { efficiency, actors, vision };
}

/** The cinematographer's craft, 0-100. Absent means a competent hire nobody named. */
export function dpCraft(dp: Person | undefined): { speed: number; light: number; night: number } {
  if (!dp) return { speed: 50, light: 50, night: 45 };
  const s = dp.skills;
  return {
    speed: s['coverage_speed'] ?? s['camera_operation'] ?? s['cinematography'] ?? 50,
    light: s['lighting_design'] ?? s['composition'] ?? s['cinematography'] ?? 50,
    night: s['night_work'] ?? s['natural_light'] ?? s['cinematography'] ?? 45,
  };
}

/** The kit on the picture, 0-100. A production with nothing assigned is on a standard rental package. */
export function kitQuality(sim: Simulation, project: Project): number {
  const assigned = Object.values(sim.universe.equipment).filter((e) => e.assignedToProjectId === project.id);
  const cameras = assigned.filter((e) => e.category === 'camera');
  const lenses = assigned.filter((e) => e.category === 'lens');
  if (cameras.length === 0 && lenses.length === 0) return 70;
  const best = (list: typeof assigned) => list.reduce((m, e) => Math.max(m, e.qualityRating * (e.condition / 100)), 0);
  const camera = cameras.length > 0 ? best(cameras) : 70;
  const lens = lenses.length > 0 ? best(lenses) : 70;
  return clamp(Math.round(camera * 0.55 + lens * 0.45), 30, 100);
}

// ---------------------------------------------------------------------------
// Boarding: scenes into days
// ---------------------------------------------------------------------------

export interface BoardedDay {
  scenes: ShootDay['scenes'];
  isStage: boolean;
  night: boolean;
  plannedPages: number;
  setups: number;
}

/** How many setups a scene takes to cover, by how the director wants it shot. */
export function setupsFor(pages: number, complexity: number, coverage: 'lean' | 'standard' | 'thorough'): number {
  const base = pages * 2.2 + complexity * 1.2;
  const mult = coverage === 'lean' ? 0.7 : coverage === 'thorough' ? 1.4 : 1;
  return Math.max(1, Math.round(base * mult));
}

/**
 * Boards a script onto days.
 *
 * Grouped the way a first AD groups them: interiors together on stage, day
 * exteriors together, night exteriors on their own days with a late call.
 * Within a group, scenes with the same setting run back to back so the
 * company is not moving every hour. Each day takes scenes until it has the
 * pages a crew can do, and a set piece that would overrun a day gets the day.
 */
export function boardScript(
  draft: ScriptDraft,
  castByCharacter: Map<string, Id>,
  options: { pagesPerDay: number; setupsPerDay: number; rng: Rng },
): BoardedDay[] {
  const scenes = draft.scenes.map((scene) => ({
    sceneNumber: scene.number,
    pages: scene.pages,
    description: `${scene.interior ? 'INT' : 'EXT'}. ${scene.setting} — ${scene.timeOfDay.toUpperCase()}. ${scene.purpose}`,
    castIds: scene.characters.map((name) => castByCharacter.get(name)).filter((id): id is Id => Boolean(id)),
    shot: false,
    setups: setupsFor(scene.pages, scene.complexity, 'standard'),
    setupsDone: 0,
    takes: 0,
    complexity: scene.complexity,
    interior: scene.interior,
    timeOfDay: scene.timeOfDay,
    setting: scene.setting,
    needs: scene.needs,
  }));

  type Group = { key: string; isStage: boolean; night: boolean; scenes: typeof scenes };
  const groups: Group[] = [];
  const groupOf = (scene: typeof scenes[number]): Group => {
    const night = scene.timeOfDay === 'night';
    const key = `${scene.interior ? 'int' : 'ext'}|${night ? 'night' : 'day'}`;
    let group = groups.find((g) => g.key === key);
    if (!group) {
      group = { key, isStage: scene.interior, night, scenes: [] };
      groups.push(group);
    }
    return group;
  };
  for (const scene of scenes) groupOf(scene).scenes.push(scene);

  // Interiors first (they are weather-proof and the sets are built), then day
  // exteriors, then nights. Inside a group, by setting.
  groups.sort((a, b) => (a.isStage === b.isStage ? Number(a.night) - Number(b.night) : a.isStage ? -1 : 1));
  for (const group of groups) group.scenes.sort((a, b) => a.setting.localeCompare(b.setting));

  const days: BoardedDay[] = [];
  for (const group of groups) {
    let current: BoardedDay | undefined;
    for (const scene of group.scenes) {
      const fits = current
        && current.plannedPages + scene.pages <= options.pagesPerDay * 1.15
        && current.setups + scene.setups <= options.setupsPerDay * 1.1;
      if (!current || !fits) {
        current = { scenes: [], isStage: group.isStage, night: group.night, plannedPages: 0, setups: 0 };
        days.push(current);
      }
      current.scenes.push(scene);
      current.plannedPages = Number((current.plannedPages + scene.pages).toFixed(1));
      current.setups += scene.setups;
    }
  }
  return days;
}

// ---------------------------------------------------------------------------
// The call sheet
// ---------------------------------------------------------------------------

export function buildCallSheet(sim: Simulation, day: ShootDay, _project: Project, coverage: 'lean' | 'standard' | 'thorough'): CallSheet {
  const city = CITIES.get(day.locationId);
  const zone = city ? cityTimeZone(day.locationId) : sim.homeZone;
  const parts = zonedParts(day.date, zone);
  const night = day.scenes.every((s) => s.timeOfDay === 'night') && day.scenes.length > 0;

  const sun = city ? sunTimes(day.date, city.latitude, city.longitude, zone) : { daylightMinutes: 12 * 60 };
  const crewCall = instantFromZoned({ year: parts.year, month: parts.month, day: parts.day, hour: night ? 17 : 6 }, zone);
  const firstShot = crewCall + 1.5 * MS_HOUR;
  const lunch = crewCall + 6 * MS_HOUR;
  const wrapTarget = crewCall + 12 * MS_HOUR;

  const weather = shootDayWeather(sim, day.locationId, day.date, day.isStage);
  const forecast = day.isStage ? 'On stage. Weather does not apply.'
    : weather.weather ? `${weather.weather.condition}, ${weather.weather.low}${weather.weather.fahrenheit ? '°F' : '°C'} to ${weather.weather.high}${weather.weather.fahrenheit ? '°F' : '°C'}.` : 'No forecast.';

  const castCalls: CallSheet['castCalls'] = [];
  for (const id of day.requiredCastIds) {
    const person = sim.universe.people[id];
    if (!person) continue;
    const scenes = day.scenes.filter((s) => s.castIds.includes(id)).map((s) => s.sceneNumber);
    // Whoever is in the first scene is called first; everybody else later.
    const first = day.scenes[0]?.castIds.includes(id);
    castCalls.push({ personId: id, name: person.stageName ?? person.displayName, at: crewCall + (first ? 0.5 : 2.5) * MS_HOUR, scenes });
  }

  const notes: string[] = [];
  const needs = new Set(day.scenes.flatMap((s) => s.needs ?? []));
  if (needs.has('stunts')) notes.push('Stunt coordinator on set. Safety meeting at call.');
  if (needs.has('animals')) notes.push('Animal handler on set. Quiet on the floor around the animals.');
  if (needs.has('children')) notes.push('Minors working: tutor on set, hours limited by law.');
  if (needs.has('water')) notes.push('Water safety on set. Wetsuits for anybody going in.');
  if (needs.has('intimacy')) notes.push('Intimacy coordinator on set. Closed set for the scene.');
  if (needs.has('weapons')) notes.push('Armourer on set. No live rounds anywhere on the premises.');
  if (needs.has('vfx')) notes.push('VFX supervisor on set for reference and plates.');
  if (needs.has('crowd')) notes.push(`${Math.round(day.crewCount * 1.5)} background artists. Holding area open from call.`);
  if (!day.isStage && sun.sunset && !night) notes.push(`Sunset ${formatTime(sun.sunset, zone)}. Exteriors are done when the light is.`);
  if (night) notes.push('Night shoot. Turnaround protected; do not book the crew for a morning.');

  return {
    crewCall, firstShot, lunch, wrapTarget,
    sunrise: sun.sunrise, sunset: sun.sunset, daylightMinutes: sun.daylightMinutes,
    forecast, castCalls, coverage, notes,
  };
}

// ---------------------------------------------------------------------------
// Running the day
// ---------------------------------------------------------------------------

export interface DayOutcome {
  hours: HourEntry[];
  /** What the day produced, in whatever unit suits it. */
  output?: ShootDay['output'];
  hoursWorked: number;
  overtimeMinutes: number;
  mealPenalty: boolean;
  completedPages: number;
  footageQuality: number;
  rolledOver: string[];
  cost: number;
  incidents: ShootDay['incidents'];
}

/**
 * The day, one hour at a time.
 *
 * Returns what happened; the caller writes it onto the day and charges it.
 * Everything here is deterministic from the day's own seeded stream.
 */
export function runShootDay(
  sim: Simulation,
  day: ShootDay,
  project: Project,
  rng: Rng,
  present: Id[],
): DayOutcome {
  const sheet = day.callSheet!;
  const plan = day.plan ?? { coverage: sheet.coverage, pushPastTwelve: false, dropScenes: [] };
  const director = project.directorId ? sim.universe.people[project.directorId] : undefined;
  const dp = project.attachments.find((a) => a.role === 'cinematographer');
  const dpPerson = dp ? sim.universe.people[dp.personId] : undefined;

  const d = directorCraft(director);
  const c = dpCraft(dpPerson);
  const kit = kitQuality(sim, project);
  // A director who was on the unit base before the crew was called has had the
  // walk-through, the coffee and the conversation with the DP. It shows.
  const early = director?.isPlayer && director.currentPlaceId === `shoot:${day.id}`;
  const ready = director?.isPlayer ? clamp(readiness(director) / 100 * (early ? 1.08 : 1), 0, 1.2) : 0.9;

  // Setups an hour: the crew's size, the DP's speed, the director's
  // efficiency, and whether it is a stage (fast) or a location (slow).
  const crewFactor = clamp(0.7 + day.crewCount / 160, 0.7, 1.5);
  // A booked stage on a real lot is built for this; the day runs a little faster on it.
  const lotLift = day.lotId ? 1.05 : 1;
  const baseRate = (1.1 + c.speed / 90 + d.efficiency / 110) * crewFactor * (day.isStage ? 1.15 : 0.9) * lotLift * remap(ready, 0.4, 1, 0.8, 1.05);

  const weather = shootDayWeather(sim, day.locationId, day.date, day.isStage);
  const weatherFactor = weather.factor;

  const scenes = day.scenes.filter((s) => !plan.dropScenes.includes(s.sceneNumber));
  const dropped = day.scenes.filter((s) => plan.dropScenes.includes(s.sceneNumber)).map((s) => s.sceneNumber);
  for (const scene of scenes) {
    scene.setups = setupsFor(scene.pages, scene.complexity ?? 2, plan.coverage);
    scene.setupsDone = 0;
    scene.takes = 0;
  }

  const hours: HourEntry[] = [];
  const incidents: ShootDay['incidents'] = [];
  let clock = sheet.crewCall;
  let hour = 0;
  let mealTaken = false;
  let mealPenalty = false;
  let sceneIndex = 0;
  let lastSetting: string | undefined;
  let weatherHeld = 0;
  const hardStop = plan.pushPastTwelve ? 14 : (director?.isPlayer ? 12 : 13);

  hours.push({ at: clock, kind: 'call', setups: 0, takes: 0, note: `Crew call. ${day.crewCount} on the floor. ${sheet.forecast}` });
  clock += MS_HOUR; hour++;
  hours.push({ at: clock, kind: 'blocking', setups: 0, takes: 0, note: `Blocking and first lighting for scene ${scenes[0]?.sceneNumber ?? '—'}.` });
  clock += MS_HOUR; hour++;

  while (sceneIndex < scenes.length && hour < hardStop) {
    const scene = scenes[sceneIndex]!;

    // Meal: by the sixth hour or the crew goes onto penalty.
    if (!mealTaken && hour >= 6) {
      hours.push({ at: clock, kind: 'lunch', setups: 0, takes: 0, note: 'Lunch.' });
      mealTaken = true;
      clock += MS_HOUR; hour++;
      continue;
    }
    if (!mealTaken && hour >= 7) mealPenalty = true;

    // Exteriors need the light. A day exterior after sunset rolls over.
    const isDayExterior = !scene.interior && scene.timeOfDay !== 'night';
    if (isDayExterior && sheet.sunset !== undefined && clock + 0.5 * MS_HOUR > sheet.sunset) {
      hours.push({ at: clock, kind: 'idle', sceneNumber: scene.sceneNumber, setups: 0, takes: 0, note: `Lost the light. Scene ${scene.sceneNumber} rolls to another day.` });
      sceneIndex++;
      clock += MS_HOUR; hour++;
      continue;
    }

    // Weather stops exterior work some of the time; a hold is an hour.
    if (!scene.interior && weatherFactor < 1 && rng.chance((1 - weatherFactor) * 0.9) && weatherHeld < 3) {
      weatherHeld++;
      hours.push({ at: clock, kind: 'weather_hold', sceneNumber: scene.sceneNumber, setups: 0, takes: 0, note: weather.note ?? 'Weather hold.' });
      clock += MS_HOUR; hour++;
      continue;
    }

    // A change of setting is a company move on location, a reset on stage.
    if (lastSetting !== undefined && scene.setting !== lastSetting) {
      const moveHours = day.isStage ? 0.5 : 1;
      hours.push({ at: clock, kind: 'company_move', sceneNumber: scene.sceneNumber, setups: 0, takes: 0, note: day.isStage ? `Reset to ${scene.setting}.` : `Company move to ${scene.setting}.` });
      clock += moveHours * MS_HOUR; hour += moveHours;
      lastSetting = scene.setting;
      continue;
    }
    lastSetting = scene.setting;

    // The hour's work: setups, and the takes inside them.
    const complexityDrag = remap(scene.complexity ?? 2, 1, 5, 1.1, 0.6);
    const nightDrag = scene.timeOfDay === 'night' ? remap(c.night, 20, 90, 0.7, 1) : 1;
    const overtimeDrag = hour >= 12 ? 0.8 : hour >= 10 ? 0.92 : 1;
    const capacity = baseRate * complexityDrag * nightDrag * overtimeDrag * rng.float(0.8, 1.2);
    const remaining = (scene.setups ?? 1) - (scene.setupsDone ?? 0);
    const done = Math.max(0, Math.min(remaining, capacity));
    const wholeSetups = Math.floor(done + (rng.chance(done % 1) ? 1 : 0));

    // Takes per setup: the actors' consistency and the director's hand.
    const cast = scene.castIds.map((id) => sim.universe.people[id]).filter((p): p is Person => Boolean(p) && present.includes(p!.id));
    const consistency = cast.length > 0
      ? cast.reduce((sum, p) => sum + (effectiveAttributes(p.attributes, p.traits)['take_consistency'] ?? 45), 0) / cast.length
      : 60;
    const takesPerSetup = clamp(2.2 + (100 - consistency) / 28 + (100 - d.actors) / 60 + (plan.coverage === 'thorough' ? 0.8 : 0) + rng.normal(0, 0.5), 1, 9);
    const takes = Math.round(wholeSetups * takesPerSetup);

    scene.setupsDone = (scene.setupsDone ?? 0) + wholeSetups;
    scene.takes = (scene.takes ?? 0) + takes;
    hours.push({
      at: clock, kind: hour >= 12 ? 'overtime' : 'shooting', sceneNumber: scene.sceneNumber,
      setups: wholeSetups, takes,
      note: wholeSetups === 0 ? `Scene ${scene.sceneNumber}: lighting. Nothing rolled.` : `Scene ${scene.sceneNumber}: ${wholeSetups} setup${wholeSetups === 1 ? '' : 's'}, ${takes} take${takes === 1 ? '' : 's'}.`,
    });
    clock += MS_HOUR; hour++;

    if ((scene.setupsDone ?? 0) >= (scene.setups ?? 1)) {
      scene.shot = true;
      scene.quality = sceneQuality(sim, scene, cast, d, c, kit, rng, plan.coverage);
      sceneIndex++;
    }

    // Occasional real incidents.
    if (rng.chance(0.035)) {
      const kinds: [string, number, number][] = [
        ['Camera body fault. Second unit body swapped in.', 0.15, 45],
        ['Location neighbour complaint. Sound halted for twenty minutes.', 0.02, 25],
        ['Minor injury on the floor. Work stopped for the safety meeting.', 0.12, 60],
        ['Generator down. Lighting off the truck until it is back.', 0.08, 50],
        ['Lead held in the makeup chair after a continuity problem.', 0.03, 40],
      ];
      const [description, costShare, minutes] = kinds[rng.int(0, kinds.length - 1)]!;
      const costDelta = Math.round(day.dailyBudget * costShare);
      incidents.push({ at: clock, kind: 'incident', description, costDelta, timeDeltaMinutes: minutes });
      clock += minutes * 60_000; hour += minutes / 60;
    }
  }

  // Wrap. Whatever was not shot rolls over.
  const rolledOver = scenes.filter((s) => !s.shot).map((s) => s.sceneNumber).concat(dropped);
  hours.push({ at: clock, kind: 'wrap', setups: 0, takes: 0, note: rolledOver.length > 0 ? `Wrap. Scene${rolledOver.length === 1 ? '' : 's'} ${rolledOver.join(', ')} not shot.` : 'Wrap. Everything on the sheet.' });

  const hoursWorked = Number(((clock - sheet.crewCall) / MS_HOUR).toFixed(1));
  const overtimeMinutes = Math.max(0, Math.round((hoursWorked - 12) * 60));
  const completedPages = Number(scenes.filter((s) => s.shot).reduce((sum, s) => sum + s.pages, 0).toFixed(1));
  const shot = scenes.filter((s) => s.shot);
  const footageQuality = shot.length > 0
    ? clamp(Math.round(shot.reduce((sum, s) => sum + (s.quality ?? 50) * s.pages, 0) / Math.max(0.1, shot.reduce((sum, s) => sum + s.pages, 0))), 0, 100)
    : 0;

  // Money: the day rate, then overtime at time and a half to fourteen hours
  // and double after, and the meal penalty if lunch was late.
  let cost = day.dailyBudget;
  if (overtimeMinutes > 0) {
    const first = Math.min(overtimeMinutes, 120);
    const second = Math.max(0, overtimeMinutes - 120);
    const overtimeCost = Math.round(day.dailyBudget * ((first / 720) * 1.5 + (second / 720) * 2));
    cost += overtimeCost;
    incidents.push({ at: clock, kind: 'overtime', description: `Ran ${(overtimeMinutes / 60).toFixed(1)} hours over twelve. Crew on penalty rate.`, costDelta: overtimeCost, timeDeltaMinutes: overtimeMinutes });
  }
  if (mealPenalty) {
    const penalty = Math.round(day.dailyBudget * 0.04);
    cost += penalty;
    incidents.push({ at: sheet.lunch, kind: 'meal_penalty', description: 'Lunch came after six hours. Meal penalty on the whole crew.', costDelta: penalty, timeDeltaMinutes: 0 });
  }
  for (const incident of incidents) if (incident.kind === 'incident') cost += incident.costDelta;
  if (weatherHeld > 0) incidents.push({ at: sheet.crewCall, kind: 'weather', description: `${weatherHeld} hour${weatherHeld === 1 ? '' : 's'} held for weather.`, costDelta: 0, timeDeltaMinutes: weatherHeld * 60 });

  return { hours, hoursWorked, overtimeMinutes, mealPenalty, completedPages, footageQuality, rolledOver, cost, incidents };
}

// ---------------------------------------------------------------------------
// The days that are not shoot days
// ---------------------------------------------------------------------------

/**
 * A recording session: one or two actors in a booth, going through lines with
 * the director and an engineer.
 *
 * A voice session is not a shoot day. There is no light to lose and no company
 * to move; what runs out is the voice. An actor with stamina and technique gets
 * through the pages; one without is hoarse by the third hour and the session
 * ends early with half the lines in the can.
 */
export function runVoiceSession(sim: Simulation, day: ShootDay, project: Project, rng: Rng, present: Id[]): DayOutcome {
  const hours: HourEntry[] = [];
  const incidents: ShootDay['incidents'] = [];
  const director = project.directorId ? sim.universe.people[project.directorId] : undefined;
  const d = directorCraft(director);
  const cast = present.map((id) => sim.universe.people[id]).filter((p): p is Person => Boolean(p));
  const planned = day.plannedPages > 0 ? Math.round(day.plannedPages * 22) : 60;

  const start = day.callSheet?.crewCall ?? day.callTime;
  let clock = start;
  let hour = 0;
  let done = 0;
  let quality = 0;
  let weight = 0;

  hours.push({ at: clock, kind: 'call', setups: 0, takes: 0, note: `${cast.map((p) => p.displayName).join(' and ') || 'The cast'} in the booth. Engineer up, director on the talkback.` });
  clock += MS_HOUR; hour++;

  const sheets = cast.map((p) => effectiveAttributes(p.attributes, p.traits));
  const stamina = sheets.length > 0 ? sheets.reduce((sum, a) => sum + (a['vocal_stamina'] ?? 45), 0) / sheets.length : 55;
  const technique = sheets.length > 0 ? sheets.reduce((sum, a) => sum + (a['voice_over'] ?? 40), 0) / sheets.length : 45;
  const truth = sheets.length > 0 ? sheets.reduce((sum, a) => sum + (a['emotional_truth'] ?? 45), 0) / sheets.length : 45;
  const range = sheets.length > 0 ? sheets.reduce((sum, a) => sum + (a['vocal_range'] ?? 45), 0) / sheets.length : 45;

  // Four good hours is a long session. After that the voice goes.
  const hardStop = 6;
  while (hour < hardStop && done < planned) {
    const fatigue = clamp(1 - Math.max(0, hour - 2) * remap(stamina, 20, 95, 0.22, 0.07), 0.25, 1);
    const rate = (10 + technique / 6 + d.actors / 14) * fatigue * rng.float(0.85, 1.15);
    const lines = Math.max(1, Math.round(Math.min(planned - done, rate)));
    const takes = Math.round(lines * clamp(2.4 - technique / 60 + rng.normal(0, 0.4), 1, 6));
    done += lines;
    const hourQuality = clamp(truth * 0.4 + technique * 0.3 + range * 0.15 + d.actors * 0.15 + rng.normal(0, 5), 0, 100) * fatigue;
    quality += hourQuality * lines;
    weight += lines;
    hours.push({
      at: clock, kind: 'shooting', setups: 0, takes,
      note: fatigue < 0.5
        ? `${lines} lines, and you can hear the voice going.`
        : `${lines} lines, ${takes} takes. ${hourQuality > 70 ? 'One of those where the read arrives on the second pass.' : 'Steady work.'}`,
    });
    clock += MS_HOUR; hour++;
    if (fatigue <= 0.3) {
      incidents.push({ at: clock, kind: 'voice_rest', description: 'Called it: the voice needs a day. The rest of the pages roll.', costDelta: 0, timeDeltaMinutes: 0 });
      break;
    }
  }
  hours.push({ at: clock, kind: 'wrap', setups: 0, takes: 0, note: done >= planned ? 'Wrapped the session. Everything in the can.' : `Wrapped ${done} of ${planned} lines. The rest goes on another session.` });

  const hoursWorked = Number(((clock - start) / MS_HOUR).toFixed(1));
  const cost = Math.round(day.dailyBudget * clamp(hoursWorked / 8, 0.35, 1.2));
  for (const person of cast) {
    person.attributes['voice_over'] = clamp((person.attributes['voice_over'] ?? 20) + 0.5, 0, 100);
    person.attributes['vocal_stamina'] = clamp((person.attributes['vocal_stamina'] ?? 30) + 0.3, 0, 100);
  }
  return {
    hours, hoursWorked, overtimeMinutes: 0, mealPenalty: false,
    completedPages: Number((day.plannedPages * (planned > 0 ? done / planned : 0)).toFixed(1)),
    footageQuality: weight > 0 ? clamp(Math.round(quality / weight), 0, 100) : 0,
    rolledOver: done >= planned ? [] : ['lines'],
    cost, incidents,
    output: { unit: 'lines', done, planned },
  };
}

/**
 * A week of animation: shots assigned, shots finished.
 *
 * Nobody is waiting on the light. What decides the week is how many animators
 * there are, how hard the shots are, and whether the director's notes arrive
 * before the work is done rather than after.
 */
export function runAnimationBlock(sim: Simulation, day: ShootDay, project: Project, rng: Rng): DayOutcome {
  const hours: HourEntry[] = [];
  const incidents: ShootDay['incidents'] = [];
  const director = project.directorId ? sim.universe.people[project.directorId] : undefined;
  const d = directorCraft(director);
  const dp = project.attachments.find((a) => a.role === 'cinematographer');
  const c = dpCraft(dp ? sim.universe.people[dp.personId] : undefined);
  const planned = Math.max(1, Math.round(day.plannedPages * 4));
  const stopMotion = day.kind === 'stop_motion_unit';

  // Seconds a week for stop motion; shots a week for computer animation.
  const crew = clamp(day.crewCount / (stopMotion ? 6 : 4), 1, 60);
  const perUnit = stopMotion ? 4.2 : 1.6;
  const done = Math.max(1, Math.round(Math.min(planned, crew * perUnit * remap(d.efficiency, 20, 95, 0.8, 1.25) * rng.float(0.8, 1.2))));

  const start = day.callSheet?.crewCall ?? day.callTime;
  hours.push({ at: start, kind: 'call', setups: 0, takes: 0, note: stopMotion ? `${Math.round(crew)} units on the floor.` : `${day.crewCount} on the crew, ${planned} shots assigned.` });
  hours.push({ at: start + 4 * MS_HOUR, kind: 'shooting', setups: done, takes: 0, note: stopMotion ? `${done} seconds in the can this week.` : `${done} shots through animation.` });
  const notes = rng.chance(0.35);
  if (notes) {
    hours.push({ at: start + 6 * MS_HOUR, kind: 'idle', setups: 0, takes: 0, note: 'Dailies with the director. Half of it goes back for another pass.' });
  }
  if (stopMotion && rng.chance(0.18)) {
    incidents.push({ at: start + 5 * MS_HOUR, kind: 'incident', description: 'A puppet was knocked mid-shot. That shot starts again from frame one.', costDelta: Math.round(day.dailyBudget * 0.08), timeDeltaMinutes: 240 });
  }
  hours.push({ at: start + 9 * MS_HOUR, kind: 'wrap', setups: 0, takes: 0, note: done >= planned ? 'The block is finished.' : `${planned - done} ${stopMotion ? 'seconds' : 'shots'} carried into next week.` });

  const kit = kitQuality(sim, project);
  const quality = clamp(Math.round(
    d.vision * 0.3 + c.light * 0.2 + kit * 0.12 + remap(crew, 1, 40, 40, 88) * 0.25 + (notes ? 6 : 0) + rng.normal(0, 5),
  ), 0, 100);
  const cost = day.dailyBudget + incidents.reduce((sum, i) => sum + i.costDelta, 0);
  return {
    hours, hoursWorked: 9, overtimeMinutes: 0, mealPenalty: false,
    completedPages: Number((day.plannedPages * (done / planned)).toFixed(1)),
    footageQuality: quality,
    rolledOver: done >= planned ? [] : [stopMotion ? 'seconds' : 'shots'],
    cost, incidents,
    output: { unit: stopMotion ? 'seconds' : 'shots', done, planned },
  };
}

/**
 * A day filming somebody real: an interview, a day out with the camera, or a
 * day in an archive.
 *
 * What you get is what you are given. A subject can be guarded, generous, or
 * not there at all, and the archive either has the footage or it does not.
 */
export function runFactualDay(sim: Simulation, day: ShootDay, project: Project, rng: Rng, present: Id[]): DayOutcome {
  const hours: HourEntry[] = [];
  const incidents: ShootDay['incidents'] = [];
  const director = project.directorId ? sim.universe.people[project.directorId] : undefined;
  const d = directorCraft(director);
  const start = day.callSheet?.crewCall ?? day.callTime;
  const kind = day.kind ?? 'interview';
  const planned = Math.max(10, Math.round(day.plannedPages * 30));
  let clock = start;
  let done = 0;
  let quality = 50;

  if (kind === 'archive') {
    hours.push({ at: clock, kind: 'call', setups: 0, takes: 0, note: 'In the archive. Boxes, tapes, and a catalogue that is only mostly right.' });
    clock += 3 * MS_HOUR;
    const found = Math.round(planned * rng.float(0.35, 1));
    done = found;
    quality = clamp(Math.round(40 + found / Math.max(1, planned) * 45 + rng.normal(0, 8)), 0, 100);
    hours.push({ at: clock, kind: 'shooting', setups: 0, takes: 0, note: `${found} minutes logged. ${found > planned * 0.8 ? 'More than you hoped for.' : 'Less than the catalogue promised.'}` });
    clock += 3 * MS_HOUR;
  } else if (kind === 'verite') {
    hours.push({ at: clock, kind: 'call', setups: 0, takes: 0, note: 'Out with the camera. Nothing is scheduled and that is the point.' });
    clock += MS_HOUR;
    for (let i = 0; i < 5; i++) {
      const something = rng.chance(0.45 + d.vision / 400);
      const minutes = something ? Math.round(planned * rng.float(0.1, 0.3)) : 0;
      done += minutes;
      hours.push({
        at: clock, kind: something ? 'shooting' : 'idle', setups: 0, takes: 0,
        note: something ? `${minutes} minutes worth keeping.` : 'An hour of nothing happening, which is most of this job.',
      });
      clock += MS_HOUR;
    }
    quality = clamp(Math.round(35 + (done / Math.max(1, planned)) * 45 + d.vision * 0.15 + rng.normal(0, 7)), 0, 100);
  } else {
    const subject = present.map((id) => sim.universe.people[id]).find((p): p is Person => Boolean(p));
    const name = subject?.displayName ?? 'The subject';
    hours.push({ at: clock, kind: 'call', setups: 0, takes: 0, note: `Two cameras up, ${name} in the chair, water on the table.` });
    clock += MS_HOUR;
    const trust = clamp(d.actors * 0.5 + (subject ? (subject.attributes['interview_poise'] ?? 40) * 0.2 : 20) + rng.normal(0, 12), 0, 100);
    const openUp = trust > 55;
    for (let i = 0; i < 3; i++) {
      const minutes = Math.round(planned / 3 * (openUp ? rng.float(0.8, 1.2) : rng.float(0.3, 0.7)));
      done += minutes;
      hours.push({
        at: clock, kind: 'shooting', setups: 0, takes: 0,
        note: i === 0 ? 'The warm-up questions, which nobody uses.'
          : openUp ? `${name} stopped performing about forty minutes in. That is the film.`
            : `${name} is giving you the version they have given before.`,
      });
      clock += MS_HOUR;
    }
    quality = clamp(Math.round((openUp ? 68 : 44) + d.actors * 0.2 + rng.normal(0, 8)), 0, 100);
    if (!openUp && rng.chance(0.2)) {
      incidents.push({ at: clock, kind: 'access', description: `${name} asked for a section to be off the record afterwards.`, costDelta: 0, timeDeltaMinutes: 0 });
    }
  }

  hours.push({ at: clock, kind: 'wrap', setups: 0, takes: 0, note: `${done} usable minutes.` });
  const hoursWorked = Number(((clock - start) / MS_HOUR).toFixed(1));
  return {
    hours, hoursWorked, overtimeMinutes: 0, mealPenalty: false,
    completedPages: Number((day.plannedPages * clamp(done / Math.max(1, planned), 0, 1)).toFixed(1)),
    footageQuality: quality,
    rolledOver: [],
    cost: Math.round(day.dailyBudget * clamp(hoursWorked / 9, 0.4, 1.1)),
    incidents,
    output: { unit: 'minutes', done, planned },
  };
}

/** A day cutting boards into a story reel. */
export function runStoryReelDay(sim: Simulation, day: ShootDay, project: Project, rng: Rng): DayOutcome {
  const director = project.directorId ? sim.universe.people[project.directorId] : undefined;
  const d = directorCraft(director);
  const start = day.callSheet?.crewCall ?? day.callTime;
  const planned = Math.max(1, Math.round(day.plannedPages * 2));
  const done = Math.max(1, Math.round(Math.min(planned, planned * rng.float(0.6, 1.1) * remap(d.efficiency, 20, 95, 0.8, 1.2))));
  const quality = clamp(Math.round(d.vision * 0.45 + d.actors * 0.15 + 30 + rng.normal(0, 6)), 0, 100);
  void sim;
  return {
    hours: [
      { at: start, kind: 'call', setups: 0, takes: 0, note: 'Story department. Boards on the wall, temp voices, a metronome for a score.' },
      { at: start + 4 * MS_HOUR, kind: 'shooting', setups: done, takes: 0, note: `${done} sequences boarded and cut into the reel.` },
      { at: start + 8 * MS_HOUR, kind: 'wrap', setups: 0, takes: 0, note: 'Screened it for the room. Half of it works, which is a good day.' },
    ],
    hoursWorked: 8, overtimeMinutes: 0, mealPenalty: false,
    completedPages: Number((day.plannedPages * (done / planned)).toFixed(1)),
    footageQuality: quality,
    rolledOver: done >= planned ? [] : ['sequences'],
    cost: day.dailyBudget,
    incidents: [],
    output: { unit: 'sequences', done, planned },
  };
}

/**
 * What one scene's footage is worth, 0-100.
 *
 * The director's eye, the DP's light, the actors in it, the kit it was shot
 * on, and how many takes it was given — more takes help up to a point and
 * then the day's exhaustion shows. Thorough coverage buys the edit more.
 */
function sceneQuality(
  sim: Simulation,
  scene: ShootDay['scenes'][number],
  cast: Person[],
  d: ReturnType<typeof directorCraft>,
  c: ReturnType<typeof dpCraft>,
  kit: number,
  rng: Rng,
  coverage: 'lean' | 'standard' | 'thorough',
): number {
  const castCraft = cast.length > 0
    ? cast.reduce((sum, p) => {
        const sheet = effectiveAttributes(p.attributes, p.traits);
        const readyPart = p.isPlayer ? readiness(p) / 100 : 0.9;
        const friction = systemModifier(p.traits, 'crewFriction');
        return sum + ((sheet['emotional_truth'] ?? 45) * 0.45 + (sheet['take_consistency'] ?? 45) * 0.3 + (sheet['camera_awareness'] ?? 45) * 0.25) * readyPart / friction;
      }, 0) / cast.length
    : 55;
  const takesPerSetup = (scene.takes ?? 0) / Math.max(1, scene.setupsDone ?? 1);
  const takesLift = takesPerSetup <= 2 ? -4 : takesPerSetup <= 5 ? Math.min(6, takesPerSetup * 1.5) : 6 - (takesPerSetup - 5) * 1.5;
  const coverageLift = coverage === 'thorough' ? 4 : coverage === 'lean' ? -5 : 0;
  const nightPart = scene.timeOfDay === 'night' ? remap(c.night, 20, 90, -6, 3) : 0;
  void sim;
  return clamp(Math.round(
    d.vision * 0.24 + d.actors * 0.14 + c.light * 0.2 + castCraft * 0.28 + kit * 0.14
    + takesLift + coverageLift + nightPart + rng.normal(0, 5),
  ), 0, 100);
}

/** A day's date at the crew call, for the schedule. */
export function callInstantFor(date: number, zone: string, night: boolean): number {
  const parts = zonedParts(date, zone);
  return instantFromZoned({ year: parts.year, month: parts.month, day: parts.day, hour: night ? 17 : 6 }, zone);
}

export const SHOOT_DAY_MS = 24 * MS_HOUR;
void addDays;
