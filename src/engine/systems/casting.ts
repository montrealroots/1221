/**
 * SLATE — Casting and the acting career.
 *
 * The full path: a breakdown goes out, people submit, some get a self-tape, some
 * get a room, a few get a callback, one gets a chemistry read or a screen test,
 * and one gets an offer. The player is scored the same way as everyone else,
 * and can lose to a better candidate.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Audition, AuditionStage, Id, Person, Project, Role } from '../domain/model';
import { clamp, remap } from '../core/rng';
import { addDays, ageOn, formatDate, formatTime, instantFromZoned, zonedParts, MS_DAY } from '../core/time';
import { applyRate, formatMoney, formatMoneyCompact, type Money } from '../core/money';
import { buildFactors, type AuditFactor } from '../core/audit';
import { effectiveAttributes, systemModifier } from '../domain/attributes';
import { readiness } from './life';
import { AGENCIES } from '../content/industry';
import { STUDIOS, type Studio, type StudioFormat } from '../content/studios';
import { effectiveStudio } from './studio-state';
import { NETWORKS, type Network } from '../content/networks';
import { quickReception } from './critics';
import { generateCharacterName, generatePersonName } from '../content/names';
import { CITIES } from '../content/geography';
import { recordCredit } from './film';
import { titleCaseLabel } from '../core/text';
import { ageOf, isPeopleLoaded, peopleInRole } from '../content/people';
import { countryIdForRecord, ensureRealPerson, personForRecord } from './real-people';

export function registerCasting(sim: Simulation): void {
  sim.onSchedule('cast.audition', (item) => runAudition(sim, item.payload.auditionId as Id));
  // The player's note of a decision day. The decision itself is cast.decide_role.
  sim.onSchedule('cast.decision_due', () => {});

  sim.onSchedule('cast.decide_role', (item) => decideRole(sim, item.payload.roleId as Id));
  sim.onSchedule('world.project_progress', (item) => advanceBackgroundProject(sim, item.payload.projectId as Id));
  sim.onSchedule('cast.opportunity_scan', () => {
    generateOpportunities(sim);
    sim.schedule({ at: addDays(sim.now, 5, sim.homeZone), kind: 'cast.opportunity_scan', label: 'Casting Breakdowns', category: 'career', priority: 72 });
  });

  // --- Creating roles ------------------------------------------------------

  sim.onCommand<{ projectId: Id; characterName: string; billing: Role['billing']; description: string; requirements?: { attributeId: string; weight: number }[]; ageRange?: [number, number]; shootDays?: number; payLow?: Money; payHigh?: Money }, { roleId: Id }>(
    'cast.create_role',
    (p, { sim: s }) => {
      const project = s.universe.projects[p.projectId];
      if (!project) throw new CommandError('No such project.');

      const scale = project.budget > 0 ? project.budget : 5_000_000_00;
      const billingShare: Record<Role['billing'], number> = {
        lead: 0.055, supporting: 0.016, featured: 0.005, day_player: 0.0008, voice: 0.004, cameo: 0.002,
      };
      const midpoint = Math.round(scale * billingShare[p.billing]);

      const role: Role = {
        id: s.nextId('role'),
        saveId: s.universe.meta.id,
        projectId: project.id,
        characterName: p.characterName,
        billing: p.billing,
        description: p.description,
        requirements: p.requirements ?? defaultRequirements(project, p.billing),
        ageRange: p.ageRange ?? [22, 55],
        shootDays: p.shootDays ?? (p.billing === 'lead' ? 42 : p.billing === 'supporting' ? 18 : p.billing === 'featured' ? 6 : 1),
        payLow: p.payLow ?? Math.round(midpoint * 0.6),
        payHigh: p.payHigh ?? Math.round(midpoint * 1.6),
        status: 'open',
        shortlistIds: [],
        auditionIds: [],
      };
      s.universe.roles[role.id] = role;
      s.emit('cast.role_created', { roleId: role.id, projectId: project.id, billing: p.billing });
      return { roleId: role.id };
    },
  );

  sim.onCommand<{ roleId: Id; closesInDays?: number; candidateCount?: number }, { roleId: Id; candidates: number; decidesAt: number }>(
    'cast.open_casting',
    (p, { sim: s }) => {
      const role = s.universe.roles[p.roleId];
      if (!role) throw new CommandError('No such role.');
      if (role.status !== 'open') throw new CommandError('That role is already being cast.');
      const project = s.universe.projects[role.projectId];
      if (!project) throw new CommandError('No such project.');

      role.status = 'casting';
      const poolSize = p.candidateCount ?? clamp(Math.round(remap(project.packageValue, 0, 100, 6, 40) * (role.billing === 'lead' ? 0.6 : 1.4)), 4, 60);

      // Build a candidate pool of real people who persist in the world.
      for (let i = 0; i < poolSize; i++) {
        const candidate = ensureCandidate(s, role, i);
        submitAudition(s, role, candidate, false);
      }

      const decidesAt = addDays(s.now, p.closesInDays ?? 24, s.homeZone);
      role.decidesAt = decidesAt;
      // The world's own bookkeeping. Somebody else's casting is not on your
      // calendar; submitting for the role is what puts the decision there.
      s.schedule({
        at: decidesAt,
        kind: 'cast.decide_role',
        label: `Casting Decision — ${role.characterName} In ${project.title}`,
        category: 'system',
        payload: { roleId: role.id },
        priority: 38,
        refType: 'role', refId: role.id,
      });

      s.emit('cast.casting_opened', { roleId: role.id, projectId: project.id, candidates: poolSize });
      return { roleId: role.id, candidates: poolSize, decidesAt };
    },
  );

  // --- The player's side ---------------------------------------------------

  sim.onCommand<{ roleId: Id }, { auditionId: Id; stage: AuditionStage }>(
    'cast.submit',
    (p, { sim: s }) => {
      const role = s.universe.roles[p.roleId];
      if (!role) throw new CommandError('That role is no longer available.');
      if (role.status !== 'casting') throw new CommandError('Casting on that role is closed.');
      const player = s.player;

      if (auditionsFor(s, role).some((a) => a.personId === player.id)) {
        throw new CommandError('You have already submitted for that.');
      }

      const age = ageOn(player.birthInstant, s.now, s.homeZone);
      if (age < role.ageRange[0] - 4 || age > role.ageRange[1] + 6) {
        throw new CommandError(`They are looking for ${role.ageRange[0]} to ${role.ageRange[1]}. You are ${age}.`);
      }

      const audition = submitAudition(s, role, player, true);
      // Now it is your business: the decision date goes on your calendar.
      if (role.decidesAt && role.decidesAt > s.now) {
        const project = s.universe.projects[role.projectId];
        s.schedule({
          at: role.decidesAt,
          kind: 'cast.decision_due',
          label: `Casting Decision — ${role.characterName} In ${project?.title ?? 'A Project'}`,
          category: 'career',
          payload: { roleId: role.id },
          priority: 39,
          refType: 'role', refId: role.id,
        });
      }
      return { auditionId: audition.id, stage: audition.stage };
    },
  );

  sim.onCommand<{ auditionId: Id; prepHours?: number }, { performanceScore: number; advanced: boolean; feedback: string }>(
    'cast.perform_audition',
    (p, { sim: s }) => {
      const audition = s.universe.auditions[p.auditionId];
      if (!audition) throw new CommandError('No such audition.');
      if (!audition.isPlayer) throw new CommandError('That is not your audition.');
      if (audition.decidedAt) throw new CommandError('That audition is already resolved.');

      const player = s.player;
      const prep = clamp(p.prepHours ?? 0, 0, 24);
      if (prep > 0) {
        s.advanceTo(s.now + prep * 60 * 60 * 1000);
        player.wellbeing.energy = clamp(player.wellbeing.energy - prep * 3.5, 0, 100);
        const gain = prep * 0.5;
        player.attributes['preparation'] = clamp((player.attributes['preparation'] ?? 30) + gain * 0.2, 0, 100);
      }

      const result = scoreAudition(s, audition, prep);
      audition.performanceScore = result.performance;
      audition.fitScore = result.fit;
      audition.totalScore = result.total;

      s.audit({
        kind: 'cast.audition_performed', subjectType: 'audition', subjectId: audition.id,
        question: 'How did that audition go?',
        summary: result.performance > 75 ? 'One of your better rooms.' : result.performance > 55 ? 'Solid work.' : 'It did not come together.',
        factors: result.factors,
        score: result.total,
        outcome: `${Math.round(result.total)}`,
      });

      player.attributes['audition_technique'] = clamp((player.attributes['audition_technique'] ?? 20) + 0.6, 0, 100);
      player.wellbeing.stress = clamp(player.wellbeing.stress + 6, 0, 100);

      const feedback = result.performance > 78
        ? 'They asked you to stay and read another scene. That is a good sign.'
        : result.performance > 58
          ? 'Professional, prepared and in the mix.'
          : result.performance > 38
            ? 'It was fine. Fine is not what gets you the part.'
            : 'You were not ready and everyone in the room knew it.';

      s.emit('cast.audition_performed', { auditionId: audition.id, roleId: audition.roleId, score: result.total });
      return { performanceScore: Math.round(result.performance), advanced: true, feedback };
    },
  );

  sim.onCommand<{ roleId: Id; personId: Id; amount?: Money; accept?: boolean }, { contractId?: Id; accepted: boolean }>(
    'cast.accept_offer',
    (p, { sim: s }) => {
      const role = s.universe.roles[p.roleId];
      if (!role || role.status !== 'offer_out') throw new CommandError('There is no live offer on that role.');
      if (role.castPersonId !== p.personId) throw new CommandError('That offer is not for you.');
      const project = s.universe.projects[role.projectId];
      if (!project) throw new CommandError('No such project.');
      const person = s.universe.people[p.personId];
      if (!person) throw new CommandError('No such person.');

      s.resolveDecision('role', role.id);
      if (p.accept === false) {
        role.status = 'casting';
        role.castPersonId = undefined;
        s.emit('cast.offer_declined', { roleId: role.id, personId: p.personId });
        return { accepted: false };
      }

      const fee = p.amount ?? negotiatedFee(s, role, person);
      const payer = project.ownerCompanyId ?? project.createdById;
      const result = s.execute<{ contractId: Id }>({
        kind: 'film.execute_contract',
        payload: {
          kind: 'acting',
          projectId: project.id,
          partyAId: payer,
          partyAKind: project.ownerCompanyId ? 'company' : 'person',
          partyBId: person.id,
          partyBKind: 'person',
          title: `${project.title} — ${role.characterName}`,
          compensation: fee,
          milestones: [
            { label: 'On Execution', fraction: 0.15, dueInDays: 0 },
            { label: 'On Commencement Of Principal Photography', fraction: 0.55, dueInDays: 45 },
            { label: 'On Completion Of Services', fraction: 0.30, dueInDays: 45 + role.shootDays * 2 },
          ],
          backendPoints: role.billing === 'lead' ? 0.02 : undefined,
          backendKind: role.billing === 'lead' ? 'net' : undefined,
          obligations: [
            { label: 'Publicity Days', kind: 'publicity', dueInDays: 400 },
            { label: 'Exclusivity During Principal Photography', kind: 'exclusivity' },
          ],
          exclusivityMonths: Math.max(2, Math.round(role.shootDays / 12)),
        },
      });
      if (!result.ok) throw new CommandError(result.error ?? 'The contract could not be executed.');

      role.status = 'cast';
      role.contractId = result.value?.contractId;
      if (!project.castIds.includes(person.id)) project.castIds.push(person.id);
      recordCredit(s, project, person.id, 'cast', role.characterName);
      project.attachments.push({ personId: person.id, role: role.billing === 'lead' ? 'lead' : 'cast', attachedAt: s.now, confirmed: true });
      if (!person.creditIds.includes(project.id)) person.creditIds.push(project.id);

      // Booking a job changes a career.
      const bump = role.billing === 'lead' ? 12 : role.billing === 'supporting' ? 6 : 2;
      person.reputation.industryDemand = clamp(person.reputation.industryDemand + bump, 0, 100);
      person.quote = Math.max(person.quote, Math.round(fee * 0.9));
      if (person.careerTrack === 'none' || person.careerTrack === 'civilian') person.careerTrack = 'actor';

      s.remember({
        category: 'career',
        title: `Cast as ${role.characterName} in ${project.title}`,
        detail: `${role.billing.replace(/_/g, ' ')} role, ${role.shootDays} shoot days, ${formatMoney(fee)}.`,
        refs: [{ type: 'project', id: project.id }, { type: 'role', id: role.id }, { type: 'person', id: person.id }],
        significance: role.billing === 'lead' ? 85 : role.billing === 'supporting' ? 60 : 35,
        public: false, amount: fee,
      });
      s.emit('cast.role_filled', { roleId: role.id, projectId: project.id, personId: person.id, fee, billing: role.billing });
      return { contractId: result.value?.contractId, accepted: true };
    },
  );

  sim.onCommand<{ agencyId: string }, { signed: boolean; reason?: string }>(
    'cast.seek_representation',
    (p, { sim: s }) => {
      const agency = AGENCIES.get(p.agencyId);
      if (!agency) throw new CommandError('No such agency.');
      const player = s.player;

      const standing = player.reputation.professionalReputation * 0.4
        + player.reputation.industryDemand * 0.35
        + player.reputation.publicFame * 0.25;

      const rng = s.rng('representation', player.id, agency.id);
      const { factors, score } = buildFactors([
        { label: 'Your Standing', detail: `Reputation, demand and profile average to ${Math.round(standing)} out of 100.`, weight: 0.44, value: standing / 100 },
        { label: 'Credits', detail: `${player.creditIds.length} credit${player.creditIds.length === 1 ? '' : 's'} on record.`, weight: 0.24, value: clamp(player.creditIds.length / 8, 0, 1) },
        { label: 'Their Threshold', detail: `${agency.name} generally signs at ${agency.signingThreshold} out of 100.`, weight: -0.26, value: agency.signingThreshold / 100 },
        { label: 'Networking', detail: `Your networking reads ${Math.round(player.attributes['networking'] ?? 0)} out of 100.`, weight: 0.14, value: (player.attributes['networking'] ?? 0) / 100 },
        { label: 'Their Client List', detail: 'Whether they already represent someone in your lane.', weight: 0.12, value: rng.float(0, 1), knowable: false },
      ]);

      const probability = clamp(score * 1.2 - 0.05, 0.01, 0.95);
      const roll = rng.next();
      const signed = roll < probability;

      s.audit({
        kind: 'cast.representation_decided', subjectType: 'person', subjectId: player.id,
        question: `Why did ${agency.name} sign me, or not?`,
        summary: signed ? `${agency.name} signed you.` : `${agency.name} passed. ${standing < agency.signingThreshold ? 'You are below where they sign.' : 'They liked you and their list is full.'}`,
        factors, seed: `representation|${player.id}|${agency.id}`, roll, probability, score,
        outcome: signed ? 'signed' : 'passed',
      });

      if (!signed) return { signed: false, reason: `${agency.name} passed.` };

      const type = agency.type;
      if (type === 'agency') {
        player.representation.agentId = ensureAgentPerson(s, agency.id);
        player.representation.agencyName = agency.name;
        player.representation.agentCommission = agency.commission;
      } else if (type === 'management') {
        player.representation.managerId = ensureAgentPerson(s, agency.id);
        player.representation.managerCommission = agency.commission;
      } else if (type === 'law') {
        player.representation.lawyerId = ensureAgentPerson(s, agency.id);
      } else {
        player.representation.publicistId = ensureAgentPerson(s, agency.id);
      }
      player.representation.signedAt = s.now;

      s.remember({
        category: 'career',
        title: `Signed with ${agency.name}`,
        detail: `${agency.type === 'agency' ? 'Agency' : agency.type === 'management' ? 'Management' : agency.type === 'law' ? 'Legal' : 'Publicity'} representation at ${Math.round(agency.commission * 100)}%.`,
        refs: [{ type: 'person', id: player.id }],
        significance: 62, public: false,
      });
      s.emit('cast.representation_signed', { personId: player.id, agencyId: agency.id, type: agency.type });
      return { signed: true };
    },
  );
}

// ---------------------------------------------------------------------------
// Mechanics
// ---------------------------------------------------------------------------

/** How many unreleased pictures anybody takes at once before they are busy. */
const ACTOR_AT_ONCE = 3;

function defaultRequirements(project: Project, billing: Role['billing']): { attributeId: string; weight: number }[] {
  const genre = project.genres[0] ?? 'drama';
  const byGenre: Record<string, string[]> = {
    action: ['screen_fighting', 'stunt_aptitude', 'physical_presence', 'stamina'],
    comedy: ['comedy_timing', 'improvisation', 'charisma', 'dry_comedy'],
    drama: ['emotional_truth', 'subtext', 'vulnerability', 'drama'],
    horror: ['fear_terror', 'vulnerability', 'reaction_shots', 'stamina'],
    romance: ['chemistry', 'romance', 'charisma', 'vulnerability'],
    thriller: ['menace', 'restraint', 'subtext', 'stillness'],
    'science fiction': ['eyeline_discipline', 'emotional_truth', 'silent_storytelling', 'take_consistency'],
    biography: ['character_construction', 'dialect_acquisition', 'emotional_truth', 'preparation'],
    musical: ['singing', 'dance', 'vocal_range', 'charisma'],
    crime: ['menace', 'subtext', 'restraint', 'drama'],
  };
  const attrs = byGenre[genre] ?? byGenre['drama'] as string[];
  const core = billing === 'lead'
    ? ['charisma', 'emotional_truth', 'camera_awareness', 'take_consistency']
    : ['take_consistency', 'ensemble_blending', 'direction_absorption'];

  const combined = [...new Set([...(attrs ?? []), ...core])];
  return combined.map((attributeId, i) => ({ attributeId, weight: Number((1 - i * 0.08).toFixed(2)) }));
}

/** Creates or reuses a persistent NPC actor for a casting pool. */
function ensureCandidate(sim: Simulation, role: Role, index: number): Person {
  const project = sim.universe.projects[role.projectId];
  const rng = sim.rng('candidate_pool', role.id, index);

  // Reuse existing actors in the world before inventing new ones — but not
  // anyone already carrying a full slate. Somebody shooting three things does
  // not read for a fourth, and without that the same handful of names end up
  // in everything the world makes.
  const load = new Map<Id, number>();
  for (const other of Object.values(sim.universe.projects)) {
    if (other.phase === 'released' || other.phase === 'library' || other.phase === 'shelved') continue;
    for (const id of other.castIds) load.set(id, (load.get(id) ?? 0) + 1);
  }
  const pool = Object.values(sim.universe.people).filter(
    (p) => !p.isPlayer && p.careerTrack === 'actor' && !p.aliveUntil
      && (load.get(p.id) ?? 0) < ACTOR_AT_ONCE,
  );
  if (pool.length > 24 && rng.chance(0.6)) {
    return rng.pick(pool);
  }

  const name = generatePersonName(rng);
  const cityId = project?.productionLocationIds[0] ?? sim.player.currentLocationId;
  const calibre = rng.float(0.15, role.billing === 'lead' ? 0.95 : 0.72);

  const attributes: Record<string, number> = {};
  for (const req of role.requirements) {
    attributes[req.attributeId] = clamp(Math.round(calibre * 100 + rng.normal(0, 12)), 3, 99);
  }
  for (const key of ['charisma', 'emotional_truth', 'take_consistency', 'camera_awareness', 'audition_technique', 'preparation', 'reliability', 'punctuality']) {
    attributes[key] ??= clamp(Math.round(calibre * 92 + rng.normal(0, 14)), 3, 99);
  }

  const age = rng.int(role.ageRange[0], role.ageRange[1]);
  const person: Person = {
    id: sim.nextId('person'),
    saveId: sim.universe.meta.id,
    isPlayer: false,
    firstName: name.first,
    lastName: name.last,
    displayName: `${name.first} ${name.last}`,
    pronouns: 'they/them',
    birthInstant: sim.now - age * 365.25 * MS_DAY,
    homeRegionId: cityId,
    citizenshipId: 'us',
    currentLocationId: cityId,
    personality: {
      openness: rng.int(30, 90), conscientiousness: rng.int(30, 92), extraversion: rng.int(35, 95),
      agreeableness: rng.int(25, 88), emotionalStability: rng.int(25, 88),
      ambition: rng.int(50, 98), riskTolerance: rng.int(30, 90),
    },
    interests: [], goals: [], lifestyle: 'comfortable',
    background: 'Working actor',
    attributes,
    traits: [],
    skills: {},
    wellbeing: { energy: rng.int(55, 95), stress: rng.int(10, 55), sleepDebt: 0, morale: rng.int(45, 85), condition: rng.int(70, 96), fitness: rng.int(40, 90), travelFatigue: 0, nourishment: 75 },
    reputation: {
      publicFame: clamp(Math.round(calibre * 70 + rng.normal(0, 14)), 0, 96),
      audienceAppeal: rng.int(35, 88),
      professionalReputation: clamp(Math.round(calibre * 88 + rng.normal(0, 10)), 5, 97),
      reliability: rng.int(45, 95),
      prestige: clamp(Math.round(calibre * 72 + rng.normal(0, 16)), 0, 95),
      industryDemand: clamp(Math.round(calibre * 82 + rng.normal(0, 14)), 2, 96),
      controversy: rng.chance(0.12) ? rng.int(20, 60) : rng.int(0, 12),
    },
    careerTrack: 'actor',
    representation: {},
    quote: Math.round(role.payLow + (role.payHigh - role.payLow) * calibre),
    creditIds: [], nominationIds: [],
    creditScore: rng.int(620, 810),
    tier: 'background',
    greenlightAuthority: 0,
    createdAt: sim.now,
  };
  sim.universe.people[person.id] = person;
  return person;
}

/**
 * The candidates for one role. Reads the role's own index, so cost is
 * proportional to the people in that room rather than to every audition the
 * save has ever recorded.
 */
export function auditionsFor(sim: Simulation, role: Role): Audition[] {
  const out: Audition[] = [];
  for (const id of role.auditionIds) {
    const audition = sim.universe.auditions[id];
    if (audition) out.push(audition);
  }
  return out;
}

function submitAudition(sim: Simulation, role: Role, person: Person, isPlayer: boolean): Audition {
  const project = sim.universe.projects[role.projectId];
  const audition: Audition = {
    id: sim.nextId('audition'),
    saveId: sim.universe.meta.id,
    roleId: role.id,
    projectId: role.projectId,
    personId: person.id,
    stage: 'submitted',
    submittedAt: sim.now,
    isPlayer,
  };
  sim.universe.auditions[audition.id] = audition;
  role.auditionIds.push(audition.id);

  if (isPlayer) {
    // The player gets a real appointment, at a real place and time.
    const rng = sim.rng('audition_schedule', audition.id);
    const daysOut = rng.int(3, 12);
    const target = addDays(sim.now, daysOut, sim.homeZone);
    const parts = zonedParts(target, sim.homeZone);
    const at = instantFromZoned({ year: parts.year, month: parts.month, day: parts.day, hour: rng.int(10, 17) }, sim.homeZone);
    const locationId = project?.productionLocationIds[0] ?? person.currentLocationId;

    audition.stage = rng.chance(0.55) ? 'self_tape' : 'first_read';
    audition.scheduledAt = at;
    audition.locationId = locationId;

    const item = sim.schedule({
      at,
      kind: 'cast.audition',
      label: `${audition.stage === 'self_tape' ? 'Self-tape due' : 'Audition'} — ${role.characterName}`,
      category: 'career',
      payload: { auditionId: audition.id },
      priority: 36,
      refType: 'audition', refId: audition.id,
      requiresPlayer: audition.stage !== 'self_tape',
      locationId,
      durationMinutes: audition.stage === 'self_tape' ? 90 : 45,
    });
    audition.scheduledItemId = item.id;

    sim.requireDecision({
      urgency: 66, category: 'career',
      title: `${audition.stage === 'self_tape' ? 'Self-tape' : 'Audition'}: ${role.characterName}`,
      detail: `${project?.title ?? 'A project'}, ${role.billing.replace(/_/g, ' ')}. ${formatDate(at, sim.homeZone)} at ${formatTime(at, sim.homeZone)}${audition.stage === 'self_tape' ? '' : ` in ${CITIES.get(locationId)?.name ?? 'town'}`}. Preparation is the whole game.`,
      route: '/workspace/casting',
      dueAt: at,
      refType: 'audition', refId: audition.id,
    });
  }

  sim.emit('cast.audition_submitted', { auditionId: audition.id, roleId: role.id, personId: person.id, isPlayer });
  return audition;
}

interface AuditionResult {
  performance: number;
  fit: number;
  total: number;
  factors: AuditFactor[];
}

function scoreAudition(sim: Simulation, audition: Audition, prepHours: number): AuditionResult {
  const role = sim.universe.roles[audition.roleId];
  const person = sim.universe.people[audition.personId];
  if (!role || !person) return { performance: 0, fit: 0, total: 0, factors: [] };

  const attributes = effectiveAttributes(person.attributes, person.traits);
  const rng = sim.rng('audition_score', audition.id);

  // Fit: how well their instrument matches what the role needs.
  const totalWeight = role.requirements.reduce((s, r) => s + r.weight, 0) || 1;
  const fit = role.requirements.reduce(
    (s, r) => s + (attributes[r.attributeId] ?? 20) * r.weight, 0,
  ) / totalWeight;

  // Performance on the day.
  const technique = audition.stage === 'self_tape'
    ? attributes['self_tape_craft'] ?? 20
    : attributes['audition_technique'] ?? 20;
  const preparedness = clamp((attributes['preparation'] ?? 20) + prepHours * 2.4, 0, 100);
  const ready = person.isPlayer ? readiness(person) : 78 + rng.normal(0, 8);
  const composure = audition.stage === 'screen_test' ? (attributes['screen_test_composure'] ?? 25) : 60;

  const varianceTrait = systemModifier(person.traits, 'auditionVariance');
  const noise = rng.normal(0, 9 * varianceTrait);

  const performance = clamp(
    fit * 0.34 + technique * 0.22 + preparedness * 0.18 + ready * 0.14 + composure * 0.12 + noise,
    0, 100,
  );

  const ageMatch = (() => {
    const age = ageOn(person.birthInstant, sim.now, sim.homeZone);
    if (age >= role.ageRange[0] && age <= role.ageRange[1]) return 1;
    const distance = age < role.ageRange[0] ? role.ageRange[0] - age : age - role.ageRange[1];
    return clamp(1 - distance / 12, 0, 1);
  })();

  const demand = person.reputation.industryDemand;
  const total = clamp(
    performance * 0.58 + fit * 0.16 + demand * 0.12 + person.reputation.professionalReputation * 0.08 + ageMatch * 100 * 0.06,
    0, 100,
  );

  const { factors } = buildFactors([
    { label: 'Fit For The Role', detail: `The part needs ${role.requirements.slice(0, 3).map((r) => r.attributeId.replace(/_/g, ' ')).join(', ')}. You read at ${Math.round(fit)} out of 100 against that.`, weight: 0.32, value: fit / 100 },
    { label: 'Audition Technique', detail: `${audition.stage === 'self_tape' ? 'Self-tape craft' : 'Audition technique'} at ${Math.round(technique)} out of 100.`, weight: 0.20, value: technique / 100 },
    { label: 'Preparation', detail: prepHours > 0 ? `You put ${prepHours} hours into it.` : 'You went in cold.', weight: 0.18, value: preparedness / 100 },
    { label: 'How You Were On The Day', detail: `Energy and stress put you at ${Math.round(ready)}% readiness.`, weight: 0.14, value: ready / 100 },
    { label: 'Age Against The Breakdown', detail: `They wrote it for ${role.ageRange[0]} to ${role.ageRange[1]}.`, weight: 0.08, value: ageMatch },
    { label: 'What You Have Done Before', detail: `Industry demand at ${Math.round(demand)} out of 100.`, weight: 0.12, value: demand / 100 },
  ]);

  return { performance, fit, total, factors };
}

function runAudition(sim: Simulation, auditionId: Id): void {
  const audition = sim.universe.auditions[auditionId];
  if (!audition || audition.decidedAt) return;
  const person = sim.universe.people[audition.personId];
  const role = sim.universe.roles[audition.roleId];
  if (!person || !role) return;

  // Did the player actually turn up?
  if (audition.isPlayer && audition.stage !== 'self_tape' && audition.locationId && person.currentLocationId !== audition.locationId) {
    audition.stage = 'passed';
    audition.decidedAt = sim.now;
    audition.feedback = 'You did not turn up. Casting directors have long memories.';
    person.reputation.reliability = clamp(person.reputation.reliability - 8, 0, 100);
    sim.resolveDecision('audition', audition.id);
    sim.notify({
      category: 'career', title: `Missed audition: ${role.characterName}`,
      body: 'You were not in the city. The room went ahead without you.',
      importance: 68, route: '/workspace/casting',
    });
    return;
  }

  if (audition.totalScore === undefined) {
    const result = scoreAudition(sim, audition, 0);
    audition.performanceScore = result.performance;
    audition.fitScore = result.fit;
    audition.totalScore = result.total;
  }

  sim.resolveDecision('audition', audition.id);
  sim.emit('cast.audition_completed', { auditionId: audition.id, score: audition.totalScore });
}

function decideRole(sim: Simulation, roleId: Id): void {
  const role = sim.universe.roles[roleId];
  if (!role || role.status !== 'casting') return;
  const project = sim.universe.projects[role.projectId];
  if (!project) return;

  const auditions = auditionsFor(sim, role);
  // Score anyone who has not been scored yet, so NPCs are evaluated identically.
  for (const audition of auditions) {
    if (audition.totalScore === undefined && audition.stage !== 'passed') {
      const result = scoreAudition(sim, audition, 0);
      audition.performanceScore = result.performance;
      audition.fitScore = result.fit;
      audition.totalScore = result.total;
    }
  }

  // Nobody plays two parts in the same picture, so anyone already in it is
  // out of the running for this one however well they read.
  const alreadyIn = new Set(project.castIds);
  const ranked = auditions
    .filter((a) => a.stage !== 'passed' && a.totalScore !== undefined && !alreadyIn.has(a.personId))
    .sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0));

  ranked.forEach((a, i) => { a.rank = i + 1; });
  role.shortlistIds = ranked.slice(0, 5).map((a) => a.personId);

  const winner = ranked[0];
  if (!winner) {
    role.status = 'open';
    return;
  }

  // Everyone else is told no, and the player is told why.
  for (const audition of ranked.slice(1)) {
    audition.stage = 'passed';
    audition.decidedAt = sim.now;
    if (audition.isPlayer) {
      const gap = (winner.totalScore ?? 0) - (audition.totalScore ?? 0);
      const result = scoreAudition(sim, audition, 0);
      audition.feedback = gap < 5
        ? 'It came down to you and one other person.'
        : gap < 15
          ? 'You were on the shortlist. They went another way.'
          : 'They had a clearer idea of the part than you gave them.';

      sim.audit({
        kind: 'cast.casting_decided', subjectType: 'audition', subjectId: audition.id,
        question: 'Why did I not get the part?',
        summary: `${audition.rank === 2 ? 'You came second.' : `You finished ${audition.rank} of ${ranked.length}.`} ${audition.feedback}`,
        factors: [
          ...result.factors,
          {
            label: 'The Other People In The Running',
            detail: `${ranked.length - 1} other actors read for this. What they did in their rooms is not something you get to see.`,
            weight: 0.25, contribution: 0, knowable: true,
          },
        ],
        score: audition.totalScore,
        outcome: 'passed',
      });

      sim.notify({
        category: 'career',
        title: `Not cast: ${role.characterName}`,
        body: `${project.title}. ${audition.feedback}`,
        importance: 45, route: '/workspace/casting',
      });
      const player = sim.universe.people[audition.personId];
      if (player) player.wellbeing.morale = clamp(player.wellbeing.morale - 5, 0, 100);
    }
  }

  winner.stage = 'offer';
  winner.decidedAt = sim.now;
  role.status = 'offer_out';
  role.castPersonId = winner.personId;

  const person = sim.universe.people[winner.personId];
  const fee = negotiatedFee(sim, role, person);

  if (winner.isPlayer) {
    const result = scoreAudition(sim, winner, 0);
    sim.audit({
      kind: 'cast.casting_decided', subjectType: 'audition', subjectId: winner.id,
      question: 'Why did I get the part?',
      summary: `You were the strongest read of ${ranked.length}.`,
      factors: result.factors,
      score: winner.totalScore,
      outcome: 'offered',
    });
    const helm = project.directorId ? sim.universe.people[project.directorId] : undefined;
    const alongside = project.castIds
      .filter((id) => id !== winner.personId)
      .map((id) => sim.universe.people[id]?.stageName ?? sim.universe.people[id]?.displayName)
      .filter(Boolean)
      .slice(0, 3);
    sim.requireDecision({
      urgency: 90, category: 'career',
      title: `Offer: ${role.characterName} in ${project.title}`,
      detail: `${titleCaseLabel(role.billing.replace(/_/g, ' '))}, ${role.shootDays} shoot days, ${formatMoney(fee)}.${role.billing === 'lead' ? ' Two points of net.' : ''} ${project.logline}`
        + `${helm ? ` Directed by ${helm.stageName ?? helm.displayName}.` : ''}`
        + `${project.distributorName ? ` For ${project.distributorName}.` : ''}`
        + `${alongside.length > 0 ? ` Alongside ${alongside.join(', ')}.` : ''}`,
      route: '/workspace/casting',
      actions: [
        { label: 'Accept', commandKind: 'cast.accept_offer', payload: { roleId: role.id, personId: winner.personId, accept: true } },
        { label: 'Pass', commandKind: 'cast.accept_offer', payload: { roleId: role.id, personId: winner.personId, accept: false } },
      ],
      dueAt: addDays(sim.now, 5, sim.homeZone),
      refType: 'role', refId: role.id,
    });
  } else {
    // NPCs accept or decline on their own terms.
    const rng = sim.rng('npc_offer', role.id);
    const wanted = person?.quote ?? fee;
    const accepts = fee >= wanted * 0.85 || rng.chance(0.4);
    if (accepts) {
      sim.execute({ kind: 'cast.accept_offer', payload: { roleId: role.id, personId: winner.personId, amount: fee, accept: true } });
    } else {
      winner.stage = 'passed';
      role.status = 'casting';
      role.castPersonId = undefined;
      const next = ranked[1];
      if (next) {
        next.stage = 'offer';
        role.status = 'offer_out';
        role.castPersonId = next.personId;
        if (!next.isPlayer) {
          sim.execute({ kind: 'cast.accept_offer', payload: { roleId: role.id, personId: next.personId, amount: negotiatedFee(sim, role, sim.universe.people[next.personId]), accept: true } });
        }
      }
    }
  }

  sim.emit('cast.role_decided', { roleId: role.id, projectId: project.id, winnerId: winner.personId, candidates: ranked.length });
}

export function negotiatedFee(sim: Simulation, role: Role, person: Person | undefined): Money {
  if (!person) return role.payLow;
  const demand = person.reputation.industryDemand / 100;
  const base = Math.round(role.payLow + (role.payHigh - role.payLow) * demand);
  const quoteFloor = person.quote > 0 ? Math.round(person.quote * 0.85) : 0;
  const negotiation = person.representation.agentId
    ? applyRate(Math.max(base, quoteFloor), 1.12)
    : Math.max(base, quoteFloor);
  void sim;
  return Math.max(role.payLow, negotiation);
}

function ensureAgentPerson(sim: Simulation, agencyId: string): Id {
  const agency = AGENCIES.require(agencyId);
  const existing = Object.values(sim.universe.people).find((p) => p.affiliationId === agencyId && p.industryRole === 'agent');
  if (existing) return existing.id;

  const rng = sim.rng('agent_person', agencyId);
  const name = generatePersonName(rng);
  const id = sim.nextId('person');
  sim.universe.people[id] = {
    id, saveId: sim.universe.meta.id, isPlayer: false,
    firstName: name.first, lastName: name.last, displayName: `${name.first} ${name.last}`,
    pronouns: 'they/them',
    birthInstant: sim.now - rng.int(32, 58) * 365 * MS_DAY,
    homeRegionId: agency.locationId, citizenshipId: 'us', currentLocationId: agency.locationId,
    personality: { openness: 60, conscientiousness: 82, extraversion: 88, agreeableness: 52, emotionalStability: 70, ambition: 92, riskTolerance: 66 },
    interests: [], goals: [], lifestyle: 'lavish', background: `${agency.name}`,
    attributes: {}, traits: [],
    skills: { negotiation: 70 + agency.dealQuality * 0.25, talent_relations: 60 + agency.dealQuality * 0.3, packaging: 55 + agency.dealQuality * 0.35 },
    wellbeing: { energy: 70, stress: 55, sleepDebt: 4, morale: 70, condition: 78, fitness: 55, travelFatigue: 10, nourishment: 70 },
    reputation: { publicFame: 8, audienceAppeal: 50, professionalReputation: agency.dealQuality, reliability: 82, prestige: 40, industryDemand: 60, controversy: 0 },
    careerTrack: 'agent', representation: {}, quote: 0,
    creditIds: [], nominationIds: [], creditScore: 780,
    tier: 'active', industryRole: 'agent', affiliationId: agencyId,
    greenlightAuthority: 0, createdAt: sim.now,
  };
  return id;
}

/**
 * The world generates opportunities. How many, and how good, depends on who
 * the player is and who represents them.
 */
export function generateOpportunities(sim: Simulation): void {
  const player = sim.universe.people[sim.universe.playerId];
  if (!player) return;
  if (player.careerTrack !== 'actor' && player.creditIds.length === 0 && !player.representation.agentId) return;

  const rng = sim.rng('opportunities', player.id, Math.floor(sim.now / (5 * MS_DAY)));
  const agency = player.representation.agencyName
    ? AGENCIES.all().find((a) => a.name === player.representation.agencyName)
    : undefined;

  const opportunityRate = systemModifier(player.traits, 'opportunityRate');
  const standing = player.reputation.professionalReputation * 0.4 + player.reputation.industryDemand * 0.4 + player.reputation.publicFame * 0.2;
  const expected = remap(standing, 0, 100, 0.25, 3.2)
    * (agency?.opportunityMultiplier ?? 0.7)
    * opportunityRate
    * remap(player.reputation.controversy, 0, 100, 1, 0.45);

  const count = Math.floor(expected) + (rng.chance(expected % 1) ? 1 : 0);
  if (count <= 0) return;

  const openRoles = Object.values(sim.universe.roles).filter(
    (r) => r.status === 'casting' && !auditionsFor(sim, r).some((a) => a.personId === player.id),
  );

  let offered = 0;
  for (const role of openRoles) {
    if (offered >= count) break;
    const project = sim.universe.projects[role.projectId];
    if (!project || project.createdById === player.id) continue;
    const age = ageOn(player.birthInstant, sim.now, sim.homeZone);
    if (age < role.ageRange[0] - 4 || age > role.ageRange[1] + 6) continue;

    // What a real breakdown carries: what it is, who is making it, who is
    // already in it, and what the part pays. Nothing about the other people
    // reading, because that is not something anybody would tell you.
    const director = project.directorId ? sim.universe.people[project.directorId] : undefined;
    const attached = Object.values(sim.universe.roles)
      .filter((r) => r.projectId === project.id && r.status === 'cast' && r.castPersonId)
      .map((r) => sim.universe.people[r.castPersonId!]?.stageName ?? sim.universe.people[r.castPersonId!]?.displayName)
      .filter(Boolean)
      .slice(0, 3);
    const madeBy = project.distributorName ? ` For ${project.distributorName}.` : '';
    const helm = director ? ` Directed by ${director.stageName ?? director.displayName}.` : '';
    const names = attached.length > 0 ? ` Attached: ${attached.join(', ')}.` : '';

    sim.requireDecision({
      urgency: 52, category: 'career',
      title: `Breakdown: ${role.characterName}`,
      detail: `${project.title} — ${project.logline}${helm}${madeBy}${names} ${titleCaseLabel(role.billing.replace(/_/g, ' '))}: ${role.description} Paying ${formatMoney(role.payLow)} to ${formatMoney(role.payHigh)}.`,
      route: '/workspace/casting',
      actions: [{ label: 'Submit', commandKind: 'cast.submit', payload: { roleId: role.id } }],
      refType: 'role', refId: role.id,
    });
    offered++;
  }

  // Casting does not make films. The world commissions its own (systems/
  // zeitgeist), and what is open here is whatever those productions and the
  // player's own have put out to be cast.
  void offered;
}


/**
 * How a part reads on a breakdown, by how big it is. Short, because a real
 * breakdown is short: the size of the part, what it is for, and nothing else.
 */
const ROLE_BRIEFS: Readonly<Record<Role['billing'], readonly string[]>> = {
  lead: [
    'Carries it. On screen in nearly every scene.',
    'The part the whole thing is built around.',
    'First on the call sheet, and there every day of it.',
  ],
  supporting: [
    'Opposite the lead for most of the second half.',
    'The other side of the argument, and not a straw one.',
    'Seven or eight scenes, all of which have to land.',
  ],
  featured: [
    'Three scenes, one of which is the one people quote.',
    'One sequence, and it is the one the trailer uses.',
    'A handful of scenes across the middle of it.',
  ],
  day_player: ['A day on set and two lines that have to be exactly right.'],
  voice: ['Voice only. Booth work, no camera.'],
  cameo: ['One scene, as yourself or near enough.'],
};

/**
 * A production the world commissioned puts its speaking parts out to be cast.
 *
 * Casting does not invent films any more — the world's slate does that (see
 * systems/zeitgeist), and this is what one of those productions does when it
 * needs people. Only work the player could actually be seen for goes out
 * publicly: a breakdown in a city they have never been to is not something
 * their character would ever hear about.
 */
export function openWorldCasting(sim: Simulation, project: Project, rng: ReturnType<Simulation['rng']>): number {
  // A documentary casts nobody; an animated title casts voices, and does that
  // out of the player's sight until the voice career exists.
  if (project.format === 'documentary') return 0;

  const isSeries = project.format === 'series' || project.format === 'limited_series';
  const count = isSeries ? rng.int(3, 6) : project.format === 'short' ? rng.int(2, 3) : rng.int(3, 5);

  let opened = 0;
  // A breakdown that describes two parts in the same words is a breakdown
  // nobody proofread, so each brief is used once per production.
  const usedBriefs = new Set<string>();
  for (let i = 0; i < count; i++) {
    // A series has a pair of regulars at the top of it; a film has the one.
    const billing: Role['billing'] = i === 0 || (isSeries && i === 1) ? 'lead' : i < 3 ? 'supporting' : 'featured';
    // Half of what gets written is for somebody under thirty-two, because
    // half of what gets made is. A slate that only casts forty-year-olds
    // leaves a young actor with nothing to read for.
    const roll = rng.next();
    const low = roll < 0.5 ? rng.int(18, 32) : roll < 0.82 ? rng.int(28, 45) : rng.int(45, 62);
    const briefs = ROLE_BRIEFS[billing];
    const created = sim.execute<{ roleId: Id }>({
      kind: 'cast.create_role',
      payload: {
        projectId: project.id,
        characterName: generateCharacterName(rng),
        billing,
        description: pickBrief(briefs, usedBriefs, rng),
        ageRange: [low, low + rng.int(6, 20)],
      },
    });
    if (!created.ok || !created.value) continue;
    const role = sim.universe.roles[created.value.roleId];
    if (!role) continue;

    // Nothing goes out to be cast with the whole picture empty. A production
    // attaches its names first and casts around them, which is why a breakdown
    // can tell you who you would be working with.
    if (rng.chance(billing === 'lead' ? 0.55 : 0.18) && attachToRole(sim, role, project, rng)) {
      continue;
    }

    const put = sim.execute({
      kind: 'cast.open_casting',
      payload: {
        roleId: role.id,
        // A room, not a stadium. Leads see fewer people and see them longer.
        candidateCount: rng.int(4, billing === 'lead' ? 9 : 13),
        closesInDays: rng.int(16, 40),
      },
    });
    if (put.ok) opened++;
  }
  return opened;
}

/** A brief this production has not used yet, or any of them once they are all spent. */
function pickBrief(briefs: readonly string[], used: Set<string>, rng: ReturnType<Simulation['rng']>): string {
  const fresh = briefs.filter((brief) => !used.has(brief));
  const pool = fresh.length > 0 ? fresh : briefs;
  const brief = pool[rng.int(0, pool.length - 1)] ?? 'Casting now.';
  used.add(brief);
  return brief;
}

/**
 * How often a name already on a world production is somebody real, by how big
 * the part is. A lead is where a production spends its name; a featured part
 * almost never is.
 */
const REAL_CAST_CHANCE: Readonly<Record<Role['billing'], number>> = {
  lead: 0.34, supporting: 0.16, featured: 0.05, day_player: 0, voice: 0.10, cameo: 0.22,
};

/**
 * A real actor who could take this part on this production: from the country
 * it is being made in, the age it is written for as their real date of birth
 * has it, and not already booked solid or already in this picture.
 */
function realActorFor(sim: Simulation, role: Role, project: Project, rng: ReturnType<Simulation['rng']>): Person | undefined {
  if (!isPeopleLoaded()) return undefined;
  const countryId = project.productionCountryId;
  if (!countryId) return undefined;

  // Who is already carrying too much, counted once over the slate rather than
  // once per candidate: that scan is quadratic over a long career.
  const load = new Map<Id, number>();
  for (const other of Object.values(sim.universe.projects)) {
    if (other.phase === 'released' || other.phase === 'library' || other.phase === 'shelved') continue;
    for (const id of other.castIds) load.set(id, (load.get(id) ?? 0) + 1);
  }
  const inThis = new Set(project.castIds);

  const candidates = peopleInRole('actor').filter((record) => {
    if (countryIdForRecord(record) !== countryId) return false;
    const age = ageOf(record, sim.now);
    if (age === undefined || age < role.ageRange[0] - 4 || age > role.ageRange[1] + 6) return false;
    const already = personForRecord(sim, record.qid);
    if (!already) return true;
    if (inThis.has(already.id)) return false;
    return (load.get(already.id) ?? 0) < ACTOR_AT_ONCE;
  });
  if (candidates.length === 0) return undefined;

  // Bigger parts go to bigger bodies of work.
  const weights = candidates.map((record) => 1 + (record.creditCount || 1) * (role.billing === 'lead' ? 1.6 : 1));
  let roll = rng.float(0, weights.reduce((a, b) => a + b, 0));
  let chosen = candidates[candidates.length - 1]!;
  for (let i = 0; i < candidates.length; i++) {
    roll -= weights[i]!;
    if (roll <= 0) { chosen = candidates[i]!; break; }
  }
  return ensureRealPerson(sim, chosen.qid);
}

/**
 * Somebody is already in it.
 *
 * This is an attachment rather than a casting decision: no room, no reading,
 * no offer. It is how a production has a name on it before the breakdown goes
 * out, and no money moves because none of it is the player's.
 *
 * Some of the time the name is somebody real, drawn off the roster the same
 * way the player draws one. That is what makes a breakdown worth reading: the
 * picture you are submitting for might have somebody on it you have heard of.
 */
function attachToRole(sim: Simulation, role: Role, project: Project, rng: ReturnType<Simulation['rng']>): boolean {
  if (rng.chance(REAL_CAST_CHANCE[role.billing])) {
    const real = realActorFor(sim, role, project, rng);
    if (real && !project.castIds.includes(real.id)) {
      role.status = 'cast';
      role.castPersonId = real.id;
      role.decidesAt = undefined;
      project.castIds.push(real.id);
      if (!real.creditIds.includes(project.id)) real.creditIds.push(project.id);
      recordCredit(sim, project, real.id, role.billing, role.characterName);
      return true;
    }
  }

  // Nobody plays two parts in the same picture, so a name already on it is
  // passed over. If nobody free turns up, the part goes out to be cast like
  // any other rather than quietly disappearing.
  let person = ensureCandidate(sim, role, rng.int(0, 40));
  for (let attempt = 0; attempt < 6 && project.castIds.includes(person.id); attempt++) {
    person = ensureCandidate(sim, role, rng.int(41, 400));
  }
  if (project.castIds.includes(person.id)) return false;

  role.status = 'cast';
  role.castPersonId = person.id;
  role.decidesAt = undefined;
  project.castIds.push(person.id);
  if (!person.creditIds.includes(project.id)) person.creditIds.push(project.id);
  recordCredit(sim, project, person.id, role.billing, role.characterName);
  return true;
}

/**
 * Which real studio is behind a project the world made on its own: one that
 * makes this kind of thing at this size, preferably where the film is from.
 * The weights are SLATE's; the studios and what they make are the record.
 */
export function studioForBackgroundProject(rng: ReturnType<Simulation['rng']>, project: Project, sim?: Simulation): Studio | undefined {
  const candidates = STUDIOS.all().filter((s) => s.formats.includes(project.format as StudioFormat) && !project.genres.some((g) => s.avoids.includes(g)) && !(sim && effectiveStudio(sim, s).closing));
  if (candidates.length === 0) return undefined;
  const weights = candidates.map((s) => {
    // A studio's mood in the save sets how much it takes on: a slate cut is a
    // slate cut, an expansion is an expansion.
    let weight = Math.max(1, sim ? Math.max(0.2, effectiveStudio(sim, s).slateSize) : s.slateSize);
    if (s.countryId === project.productionCountryId) weight *= 12;
    else if (s.countryId !== 'us') weight *= 0.1;
    else if (project.productionCountryId && project.productionCountryId !== 'us') weight *= 0.3;
    if (project.genres.some((g) => s.wants.includes(g))) weight *= 2;
    if (project.budget < s.budgetFloor * 0.5 || project.budget > s.budgetCeiling * 1.5) weight *= 0.2;
    if (!s.distributes) weight *= 0.5;
    return weight;
  });
  let roll = rng.float(0, weights.reduce((a, b) => a + b, 0));
  for (let i = 0; i < candidates.length; i++) {
    roll -= weights[i] ?? 0;
    if (roll <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}

/** Which real network commissions a series the world made on its own: one that makes that kind of thing, preferably at home. */
export function networkForBackgroundProject(rng: ReturnType<Simulation['rng']>, project: Project): Network | undefined {
  const candidates = NETWORKS.all().filter((n) => n.formats.includes(project.format as StudioFormat) && !project.genres.some((g) => n.avoids.includes(g)) && !n.status?.includes('closing'));
  if (candidates.length === 0) return undefined;
  const weights = candidates.map((n) => {
    let weight = Math.max(1, n.slateSize);
    if (n.countryId === project.productionCountryId) weight *= 12;
    else if (n.countryId !== 'us') weight *= 0.08;
    else if (project.productionCountryId && project.productionCountryId !== 'us') weight *= 0.25;
    if (project.genres.some((g) => n.wants.includes(g))) weight *= 2;
    if (project.budget < n.budgetFloor * 0.5 || project.budget > n.budgetCeiling * 1.5) weight *= 0.2;
    return weight;
  });
  let roll = rng.float(0, weights.reduce((a, b) => a + b, 0));
  for (let i = 0; i < candidates.length; i++) {
    roll -= weights[i] ?? 0;
    if (roll <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}


function advanceBackgroundProject(sim: Simulation, projectId: Id): void {
  const project = sim.universe.projects[projectId];
  if (!project) return;
  // The moment the player takes it over it stops being background work.
  if (project.createdById === sim.universe.playerId) return;

  const rng = sim.rng('bg_project', project.id, project.phase);
  const isSeries = project.format === 'series' || project.format === 'limited_series';
  const enter = (phase: Project['phase'], inDays: number) => {
    project.phase = phase;
    project.phaseHistory.push({ phase, enteredAt: sim.now });
    sim.schedule({
      at: addDays(sim.now, inDays, sim.homeZone),
      kind: 'world.project_progress',
      label: `${project.title} — ${phase.replace(/_/g, ' ')}`,
      category: 'system',
      payload: { projectId: project.id },
      priority: 94,
      refType: 'project', refId: project.id,
    });
  };

  switch (project.phase) {
    case 'preproduction': {
      // A production that has put roles out and cannot fill them loses its
      // window. A world commission with no roles open has nothing to lose.
      const roles = Object.values(sim.universe.roles).filter((r) => r.projectId === project.id);
      const uncast = roles.filter((r) => r.status !== 'cast' && r.status !== 'closed');
      if (uncast.length > 0 && rng.chance(0.35)) {
        project.phase = 'shelved';
        project.phaseHistory.push({ phase: 'shelved', enteredAt: sim.now });
        project.shelvedReason = 'Could not close its cast before the start date.';
        for (const role of uncast) role.status = 'closed';
        return;
      }
      project.productionStartAt = sim.now;
      enter('production', isSeries ? rng.int(70, 160) : rng.int(28, 70));
      return;
    }

    case 'production': {
      project.productionEndAt = sim.now;
      project.completedShootDays = project.scheduledShootDays || rng.int(18, 65);
      enter('post', isSeries ? rng.int(120, 240) : rng.int(140, 300));
      return;
    }

    case 'post': {
      project.pictureLockedAt = sim.now;
      enter('distribution', rng.int(45, 150));
      return;
    }

    case 'distribution': {
      project.releaseDate = sim.now;
      project.releaseStrategy = project.format === 'series' || project.format === 'limited_series' || project.format === 'tv_movie'
        ? (rng.chance(0.6) ? 'streaming_exclusive' : 'network')
        : project.format === 'short' ? 'festival_only'
        : project.budget >= 15_000_000_00 ? 'wide_theatrical'
        : project.budget >= 3_000_000_00 ? 'limited_theatrical'
        : rng.chance(0.5) ? 'platform' : 'streaming_exclusive';
      project.finalQuality = backgroundQuality(sim, project, rng);
      quickReception(sim, project, sim.rng('world_reception', project.id));
      if (!project.distributorName) {
        const distributor = studioForBackgroundProject(sim.rng('world_studio', project.id), project, sim);
        project.studioId = distributor?.id;
        project.distributorName = distributor?.name ?? 'Self-distributed';
      }
      enter('released', rng.int(60, 120));
      return;
    }

    case 'released': {
      recordBackgroundPerformance(sim, project, rng);
      enter('library', 1);
      return;
    }

    default:
      // 'library' and 'shelved' are terminal; nothing more is scheduled.
  }
}

/** Finished quality, from the script and whoever ended up in it. */
function backgroundQuality(sim: Simulation, project: Project, rng: ReturnType<Simulation['rng']>): number {
  let castStrength = 50;
  const cast = project.castIds.map((id) => sim.universe.people[id]).filter((p): p is Person => Boolean(p));
  if (cast.length > 0) {
    castStrength = cast.reduce((sum, person) => {
      const sheet = effectiveAttributes(person.attributes, person.traits);
      return sum + (sheet['emotional_truth'] ?? 50) * 0.6 + (sheet['take_consistency'] ?? 50) * 0.4;
    }, 0) / cast.length;
  }
  const scale = remap(project.budget, 1_000_000_00, 150_000_000_00, -4, 6);
  return clamp(Math.round(project.scriptQuality * 0.5 + castStrength * 0.35 + scale + rng.normal(0, 7)), 1, 100);
}

/**
 * What the film did. Coarse, but derived from the same things the player's
 * films are: what it cost, how good it is, and how it was received.
 */
function recordBackgroundPerformance(sim: Simulation, project: Project, rng: ReturnType<Simulation['rng']>): void {
  const quality = project.finalQuality ?? 50;
  const reception = (quality * 0.5 + (project.criticScore ?? 50) * 0.25 + (project.audienceScore ?? 50) * 0.25) / 100;
  const isSeries = project.format === 'series' || project.format === 'limited_series';

  project.totalCost = project.budget;

  if (isSeries) {
    // Series do not open; they accumulate viewing.
    project.streamingHoursViewed = Math.round(project.budget / 100 * remap(reception, 0.2, 0.95, 0.4, 9) * rng.float(0.6, 1.5));
    project.totalRevenue = Math.round(project.budget * remap(reception, 0.2, 0.95, 0.5, 2.4) * rng.float(0.7, 1.3));
  } else {
    // A film that lands badly loses real money. Without a genuine lower tail
    // the library fills up with titles that all roughly broke even, which is
    // not what a slate looks like.
    const multiple = remap(reception, 0.2, 0.95, 0.14, 3.8) * rng.float(0.45, 1.7);
    project.boxOfficeDomestic = Math.round(project.budget * multiple * 0.55);
    project.boxOfficeInternational = Math.round(project.budget * multiple * 0.62 * rng.float(0.5, 1.4));
    project.totalRevenue = project.boxOfficeDomestic + project.boxOfficeInternational;
  }

  // The people in it have careers, and this is what moves them.
  const success = clamp(project.totalRevenue / Math.max(1, project.budget), 0, 4);
  for (const personId of [...project.castIds, project.directorId, ...project.writerIds]) {
    if (!personId) continue;
    const person = sim.universe.people[personId];
    if (!person || person.isPlayer) continue;
    if (!person.creditIds.includes(project.id)) person.creditIds.push(project.id);
    person.reputation.publicFame = clamp(person.reputation.publicFame + remap(success, 0.3, 2.5, -1, 7), 0, 100);
    person.reputation.professionalReputation = clamp(person.reputation.professionalReputation + remap(quality, 30, 90, -2, 6), 0, 100);
    person.reputation.industryDemand = clamp(person.reputation.industryDemand + remap(success, 0.3, 2.5, -3, 9), 0, 100);
  }

  sim.remember({
    category: 'project',
    title: `${project.title} opened`,
    detail: `${project.distributorName ?? 'An independent distributor'} released ${project.title}. ${
      isSeries
        ? `${formatMoneyCompact(project.totalRevenue)} in licensing against a ${formatMoneyCompact(project.budget)} budget.`
        : `${formatMoneyCompact(project.boxOfficeDomestic + project.boxOfficeInternational)} worldwide against a ${formatMoneyCompact(project.budget)} budget.`
    } Reviews averaged ${project.criticScore}.`,
    refs: [{ type: 'project', id: project.id }],
    significance: clamp(Math.round(remap(project.totalRevenue, 0, 400_000_000_00, 10, 55)), 10, 55),
    public: true,
  });

  sim.emit('film.released', { projectId: project.id, background: true });
}
