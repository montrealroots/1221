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
  const ready = director?.isPlayer ? readiness(director) / 100 : 0.9;

  // Setups an hour: the crew's size, the DP's speed, the director's
  // efficiency, and whether it is a stage (fast) or a location (slow).
  const crewFactor = clamp(0.7 + day.crewCount / 160, 0.7, 1.5);
  const baseRate = (1.1 + c.speed / 90 + d.efficiency / 110) * crewFactor * (day.isStage ? 1.15 : 0.9) * remap(ready, 0.4, 1, 0.8, 1.05);

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
