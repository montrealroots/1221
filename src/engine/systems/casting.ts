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
import type { Audition, AuditionStage, CharacterArchetype, Id, Person, Project, Role } from '../domain/model';
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
import { costOfLiving } from '../content/tax';
import { recordCredit } from './film';
import { titleCaseLabel } from '../core/text';
import { ageOf, isPeopleLoaded, peopleInRole } from '../content/people';
import { countryIdForRecord, ensureRealPerson, personForRecord, playerControls } from './real-people';
import { archetypeLabel, breakDownScript } from '../content/screenplay';
import { pipelineFor } from '../content/pipelines';
import { quoteMultiplierFor } from './reactive';

export function registerCasting(sim: Simulation): void {
  sim.onSchedule('cast.audition', (item) => runAudition(sim, item.payload.auditionId as Id));
  sim.onSchedule('cast.office_response', (item) => officeResponds(sim, item.payload.auditionId as Id));
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

  sim.onCommand<{ roleId: Id; prefer?: 'tape' | 'in_person' }, { auditionId: Id; stage: AuditionStage; format: 'self_tape' | 'in_person'; policy: Role['auditionPolicy'] }>(
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

      // The office decides what it will take. You can ask for the room or
      // for a tape; you cannot make them see you if they are only taking tapes.
      const policy = auditionPolicyFor(s, role);
      if (p.prefer === 'in_person' && policy === 'tape_only') {
        throw new CommandError('They are only taking tapes on this one. Send a tape or let it go.');
      }
      if (p.prefer === 'tape' && policy === 'in_person_only') {
        throw new CommandError('They want to see people in the room for this one. No tapes.');
      }
      const format: 'self_tape' | 'in_person' = p.prefer === 'tape' ? 'self_tape'
        : p.prefer === 'in_person' ? 'in_person'
          : policy === 'tape_only' ? 'self_tape'
            : policy === 'in_person_only' ? 'in_person'
              : s.rng('audition_format', role.id, player.id).chance(0.55) ? 'self_tape' : 'in_person';

      const audition = submitAudition(s, role, player, true, format);
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
      return { auditionId: audition.id, stage: audition.stage, format, policy };
    },
  );

  // Sending a tape: takes cost time and energy and buy a better one, up to a
  // point. The office gets back to you in its own time, or does not.
  sim.onCommand<{ auditionId: Id; prepHours?: number; takes?: number }, { performanceScore: number; takes: number; note: string; sentAt: number }>(
    'cast.send_tape',
    (p, { sim: s }) => {
      const audition = s.universe.auditions[p.auditionId];
      if (!audition) throw new CommandError('No such audition.');
      if (!audition.isPlayer) throw new CommandError('That is not your audition.');
      if (audition.decidedAt) throw new CommandError('That audition is already resolved.');
      if (audition.format !== 'self_tape' && audition.stage !== 'self_tape') throw new CommandError('That one is in the room, not on tape. Turn up to it.');
      if (audition.tapeSentAt) throw new CommandError('The tape went already. You do not get to send a second one.');
      const role = s.universe.roles[audition.roleId];
      const project = s.universe.projects[audition.projectId];
      if (!role || !project) throw new CommandError('That part is gone.');
      if (role.status !== 'casting') throw new CommandError('Casting on that role is closed.');

      const player = s.player;
      const prep = clamp(p.prepHours ?? 0, 0, 24);
      const takes = clamp(Math.round(p.takes ?? 3), 1, 8);
      if (player.wellbeing.energy < 8) throw new CommandError('You are too tired to put anything good on tape. Sleep first.');

      if (prep > 0) {
        s.advanceTo(s.now + prep * 60 * 60 * 1000);
        player.wellbeing.energy = clamp(player.wellbeing.energy - prep * 3.5, 0, 100);
        player.attributes['preparation'] = clamp((player.attributes['preparation'] ?? 30) + prep * 0.1, 0, 100);
      }
      // Twenty minutes a take, and the best of them is what goes.
      s.advanceTo(s.now + takes * 20 * 60 * 1000);
      player.wellbeing.energy = clamp(player.wellbeing.energy - takes * 2, 0, 100);

      const result = scoreAudition(s, audition, prep);
      const takesLift = Math.min(6, (takes - 1) * 1.5);
      audition.performanceScore = clamp(result.performance + takesLift, 0, 100);
      audition.fitScore = result.fit;
      audition.totalScore = clamp(result.total + takesLift * 0.58, 0, 100);
      audition.tapeSentAt = s.now;
      audition.tapeTakes = takes;
      audition.format = 'self_tape';
      if (audition.scheduledItemId) s.timeline.cancel(audition.scheduledItemId, s.now);
      s.resolveDecision('audition', audition.id);

      const note = audition.performanceScore > 78
        ? `Take ${takes} of ${takes}: the one where it stopped being an audition.`
        : audition.performanceScore > 58
          ? 'A clean tape. Well lit, in frame, the reader off camera where they should be.'
          : audition.performanceScore > 38
            ? 'It is fine. You can hear the reader breathing and you rushed the last beat.'
            : 'You sent it because it was due, not because it was ready.';

      s.audit({
        kind: 'cast.audition_performed', subjectType: 'audition', subjectId: audition.id,
        question: 'How was the tape?',
        summary: note,
        factors: [
          ...result.factors,
          { label: 'Takes', detail: takes === 1 ? 'One take. Brave, or careless.' : `${takes} takes; the best one went.`, weight: 0.1, contribution: takesLift / 100, knowable: true },
        ],
        score: audition.totalScore,
        outcome: `${Math.round(audition.totalScore)}`,
      });
      player.attributes['self_tape_craft'] = clamp((player.attributes['self_tape_craft'] ?? 20) + 0.5 + takes * 0.08, 0, 100);
      player.wellbeing.stress = clamp(player.wellbeing.stress + 3, 0, 100);
      scheduleOfficeResponse(s, audition, role);
      s.emit('cast.audition_performed', { auditionId: audition.id, roleId: audition.roleId, score: audition.totalScore });
      s.emit('cast.tape_sent', { auditionId: audition.id, roleId: audition.roleId, takes });
      return { performanceScore: Math.round(audition.performanceScore), takes, note, sentAt: s.now };
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

      // A callback is a different room from a first read, and is scored as one:
      // whether the note landed, not whether the technique held.
      if (audition.stage === 'callback' && !(audition.rounds ?? []).some((r) => r.stage === 'callback')) {
        const role = s.universe.roles[audition.roleId];
        const project = s.universe.projects[audition.projectId];
        if (!role || !project) throw new CommandError('That part is gone.');
        const round = holdRound(s, audition, role, project, 'callback');
        player.attributes['direction_absorption'] = clamp((player.attributes['direction_absorption'] ?? 20) + 0.5, 0, 100);
        player.wellbeing.stress = clamp(player.wellbeing.stress + 5, 0, 100);
        s.emit('cast.audition_performed', { auditionId: audition.id, roleId: audition.roleId, score: round.score });
        return { performanceScore: Math.round(round.score), advanced: true, feedback: round.note };
      }

      const result = scoreAudition(s, audition, prep);
      audition.performanceScore = result.performance;
      audition.fitScore = result.fit;
      audition.totalScore = result.total;
      if (audition.stage === 'self_tape' || audition.format === 'self_tape') {
        audition.tapeSentAt = s.now;
        audition.tapeTakes ??= 3;
        audition.format = 'self_tape';
        if (audition.scheduledItemId) s.timeline.cancel(audition.scheduledItemId, s.now);
      } else if (audition.stage === 'first_read' && audition.locationId && player.currentLocationId !== audition.locationId) {
        throw new CommandError(`The room is in ${CITIES.get(audition.locationId)?.name ?? 'another city'} and you are not. Get there first.`);
      }
      s.resolveDecision('audition', audition.id);
      {
        const role = s.universe.roles[audition.roleId];
        if (role) scheduleOfficeResponse(s, audition, role);
      }

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
        s.emit('cast.offer_declined', { roleId: role.id, personId: p.personId, amount: p.amount ?? negotiatedFee(s, role, s.universe.people[p.personId]) });
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

  // --- The breakdown: the script's people become parts --------------------

  sim.onCommand<{ projectId: Id; includeDayPlayers?: boolean }, { created: Id[]; skipped: string[] }>(
    'cast.break_down_script',
    (p, { sim: s }) => {
      const project = s.universe.projects[p.projectId];
      if (!project) throw new CommandError('No such project.');
      if (!playerControls(s, project)) throw new CommandError('That is not your picture to break down.');
      const draft = project.currentDraftId ? s.universe.scriptDrafts[project.currentDraftId] : undefined;
      if (!draft) throw new CommandError('There is no draft to break down. Write one first.');

      // A draft written before scripts had scenes gets them now, from its own
      // seeded stream, so an old save is broken down the same way a new one is.
      if (draft.scriptCharacters.length === 0 || draft.scenes.length === 0) {
        const made = breakDownScript(s.rng('breakdown', project.id, draft.version), {
          genres: project.genres, format: project.format, pages: draft.pages,
        });
        draft.scenes = made.scenes;
        draft.scriptCharacters = made.characters;
      }

      const existing = new Set(
        Object.values(s.universe.roles).filter((r) => r.projectId === project.id).map((r) => r.characterName),
      );
      const created: Id[] = [];
      const skipped: string[] = [];
      const sceneCount = Math.max(1, draft.scenes.length);

      for (const character of draft.scriptCharacters) {
        if (character.archetype === 'day_player' && !p.includeDayPlayers) { skipped.push(character.name); continue; }
        if (existing.has(character.name)) { skipped.push(character.name); continue; }

        const billing: Role['billing'] = character.archetype === 'protagonist' || character.archetype === 'deuteragonist' ? 'lead'
          : character.archetype === 'antagonist' || character.archetype === 'love_interest' || character.archetype === 'mentor' || character.archetype === 'foil' ? 'supporting'
          : character.archetype === 'day_player' ? 'day_player'
          : 'featured';
        const sceneNumbers = draft.scenes.filter((scene) => scene.characters.includes(character.name)).map((scene) => scene.number);
        // A part is on set for the days its scenes fall on. Before a schedule
        // exists that is roughly a day for every two scenes, and a lead who is
        // in most of it is there for most of the shoot.
        const shootDays = Math.max(1, Math.ceil(sceneNumbers.length * 0.55));
        const made = s.execute<{ roleId: Id }>({
          kind: 'cast.create_role',
          payload: {
            projectId: project.id,
            characterName: character.name,
            billing,
            description: `${archetypeLabel(character.archetype)}. ${character.description} In ${sceneNumbers.length} of ${sceneCount} scenes, ${character.lineShare}% of the dialogue.`,
            requirements: defaultRequirements(project, billing, character.archetype),
            ageRange: character.ageRange,
            shootDays,
          },
        });
        if (!made.ok || !made.value) { skipped.push(character.name); continue; }
        const role = s.universe.roles[made.value.roleId];
        if (role) {
          role.archetype = character.archetype;
          role.sceneNumbers = sceneNumbers;
        }
        created.push(made.value.roleId);
      }

      s.emit('cast.script_broken_down', { projectId: project.id, roles: created.length });
      return { created, skipped };
    },
  );

  // --- The rooms: callbacks, chemistry reads and screen tests -------------
  //
  // On the player's own picture, casting is a series of rooms rather than one
  // score. Each room is scored on what that room actually tests, and the
  // decision is made on all of them.

  sim.onCommand<{ roleId: Id; personIds: Id[] }, { called: Id[] }>(
    'cast.callback',
    (p, { sim: s }) => {
      const { role, project } = ownRole(s, p.roleId);
      const called: Id[] = [];
      for (const personId of p.personIds) {
        const audition = auditionsFor(s, role).find((a) => a.personId === personId && a.stage !== 'passed');
        if (!audition) continue;
        if ((audition.rounds ?? []).some((r) => r.stage === 'callback')) continue;
        holdRound(s, audition, role, project, 'callback');
        called.push(personId);
      }
      if (called.length === 0) throw new CommandError('Nobody on that list is still in the running for the part.');
      s.emit('cast.callbacks_held', { roleId: role.id, projectId: project.id, count: called.length });
      return { called };
    },
  );

  sim.onCommand<{ roleId: Id; personId: Id; withPersonId: Id }, { score: number; note: string }>(
    'cast.chemistry_read',
    (p, { sim: s }) => {
      const { role, project } = ownRole(s, p.roleId);
      const audition = auditionsFor(s, role).find((a) => a.personId === p.personId && a.stage !== 'passed');
      if (!audition) throw new CommandError('They are not in the running for that part.');
      const partner = s.universe.people[p.withPersonId];
      if (!partner) throw new CommandError('No such person to read with.');
      if (!project.castIds.includes(partner.id)) {
        throw new CommandError(`${partner.displayName} is not cast in ${project.title}. A chemistry read is with somebody who is already in it.`);
      }
      const round = holdRound(s, audition, role, project, 'chemistry_read', partner);
      s.emit('cast.chemistry_read', { roleId: role.id, projectId: project.id, personId: p.personId, withPersonId: partner.id, score: round.score });
      return { score: round.score, note: round.note };
    },
  );

  sim.onCommand<{ roleId: Id; personIds: Id[] }, { tested: Id[]; cost: Money }>(
    'cast.screen_test',
    (p, { sim: s }) => {
      const { role, project } = ownRole(s, p.roleId);
      const candidates = p.personIds
        .map((id) => auditionsFor(s, role).find((a) => a.personId === id && a.stage !== 'passed'))
        .filter((a): a is Audition => Boolean(a))
        .filter((a) => !(a.rounds ?? []).some((r) => r.stage === 'screen_test'));
      if (candidates.length === 0) throw new CommandError('Nobody on that list can be tested: they are out, or they have been tested already.');

      // A screen test is a shooting day in miniature — a stage, a camera, a
      // crew — and it is paid for out of the picture.
      const cost = Math.round(28_000_00 * costOfLiving(project.productionLocationIds[0] ?? s.player.currentLocationId) + candidates.length * 6_500_00);
      const accountId = project.financingIds.find((id) => s.ledger.availableFunds(id) >= cost)
        ?? (project.ownerCompanyId ? s.universe.companies[project.ownerCompanyId]?.cashAccountId : undefined)
        ?? s.player.primaryAccountId;
      if (!accountId || s.ledger.availableFunds(accountId) < cost) {
        throw new CommandError(`A screen test for ${candidates.length} costs ${formatMoney(cost)}, and there is not that much to hand.`);
      }
      s.expense(accountId, cost, `${project.title} — screen tests, ${role.characterName}`, 'production', { refType: 'project', refId: project.id });
      project.spent += cost;

      for (const audition of candidates) holdRound(s, audition, role, project, 'screen_test');
      s.emit('cast.screen_tested', { roleId: role.id, projectId: project.id, count: candidates.length, cost });
      return { tested: candidates.map((a) => a.personId), cost };
    },
  );

  sim.onCommand<{ roleId: Id; personId: Id }, { offered: boolean; fee: Money }>(
    'cast.choose',
    (p, { sim: s }) => {
      const { role, project } = ownRole(s, p.roleId);
      const audition = auditionsFor(s, role).find((a) => a.personId === p.personId && a.stage !== 'passed');
      if (!audition) throw new CommandError('They are not in the running for that part.');
      const person = s.universe.people[p.personId];
      if (!person) throw new CommandError('No such person.');
      if (project.castIds.includes(person.id)) throw new CommandError(`${person.displayName} is already in this picture.`);

      // Everybody else is told no, and the one chosen is made the offer.
      for (const other of auditionsFor(s, role)) {
        if (other.id === audition.id || other.stage === 'passed') continue;
        other.stage = 'passed';
        other.decidedAt = s.now;
        other.feedback = 'They went another way.';
      }
      audition.stage = 'offer';
      audition.decidedAt = s.now;
      audition.totalScore = decisionScore(audition);
      role.status = 'offer_out';
      role.castPersonId = person.id;
      role.decidesAt = undefined;
      s.resolveDecision('role', role.id);

      const fee = negotiatedFee(s, role, person);
      if (person.isPlayer) {
        // Casting yourself in your own picture is a decision, not a negotiation.
        s.execute({ kind: 'cast.accept_offer', payload: { roleId: role.id, personId: person.id, amount: fee, accept: true } });
        return { offered: true, fee };
      }
      const rng = s.rng('npc_offer', role.id, person.id);
      const wanted = person.quote > 0 ? person.quote : fee;
      const accepts = fee >= wanted * 0.85 || rng.chance(0.45);
      if (accepts) {
        s.execute({ kind: 'cast.accept_offer', payload: { roleId: role.id, personId: person.id, amount: fee, accept: true } });
      } else {
        audition.stage = 'passed';
        audition.feedback = 'Passed on the offer. The money was the problem.';
        role.status = 'casting';
        role.castPersonId = undefined;
        s.notify({
          category: 'career', title: `${person.displayName} passed on ${role.characterName}`,
          body: `The offer on ${project.title} was ${formatMoney(fee)}; they wanted nearer ${formatMoney(wanted)}. The part is open again.`,
          importance: 58, route: '/workspace/projects',
        });
      }
      s.emit('cast.chosen', { roleId: role.id, projectId: project.id, personId: person.id, accepted: accepts });
      return { offered: accepts, fee };
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

/**
 * What a part asks of an actor: the genre's own attributes, the billing's, and
 * — when the part came from a breakdown — the archetype's. A mentor needs
 * gravitas and a comic relief needs timing whatever the genre is.
 */
function defaultRequirements(project: Project, billing: Role['billing'], archetype?: CharacterArchetype): { attributeId: string; weight: number }[] {
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
  const byArchetype: Partial<Record<CharacterArchetype, string[]>> = {
    protagonist: ['charisma', 'emotional_truth', 'stamina'],
    deuteragonist: ['chemistry', 'ensemble_blending', 'emotional_truth'],
    antagonist: ['menace', 'restraint', 'charisma'],
    love_interest: ['chemistry', 'romance', 'vulnerability'],
    mentor: ['stillness', 'restraint', 'subtext'],
    foil: ['comedy_timing', 'subtext', 'ensemble_blending'],
    confidant: ['ensemble_blending', 'active_listening', 'subtext'],
    comic_relief: ['comedy_timing', 'improvisation', 'physical_comedy'],
    ensemble: ['ensemble_blending', 'take_consistency'],
    day_player: ['cold_reading', 'take_consistency'],
  };
  const forPart = archetype ? byArchetype[archetype] ?? [] : [];

  // A cartoon is cast on the voice and nothing else: nobody is looking at the
  // camera awareness of somebody in a booth. A documentary is not cast at all
  // in this sense — a contributor is judged on whether they will talk.
  const pipeline = pipelineFor(project);
  if (pipeline.kind === 'animation' || pipeline.kind === 'stop_motion') {
    const voice = ['voice_over', 'vocal_range', 'resonance', 'diction', 'emotional_truth', 'vocal_stamina', 'improvisation'];
    const flavour = (attrs ?? []).filter((a) => ['comedy_timing', 'menace', 'singing', 'dry_comedy', 'romance', 'drama'].includes(a));
    const combined = [...new Set([...voice.slice(0, billing === 'lead' ? 5 : 4), ...flavour, ...forPart.slice(0, 1)])];
    return combined.map((attributeId, i) => ({ attributeId, weight: Number((1 - i * 0.08).toFixed(2)) }));
  }
  if (pipeline.kind === 'documentary' || pipeline.kind === 'unscripted') {
    const contributor = ['interview_poise', 'emotional_truth', 'charisma', 'discretion', 'improvisation'];
    return contributor.map((attributeId, i) => ({ attributeId, weight: Number((1 - i * 0.1).toFixed(2)) }));
  }

  const combined = [...new Set([...forPart, ...(attrs ?? []), ...core])];
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
    wellbeing: { energy: rng.int(55, 95), stress: rng.int(10, 55), sleepDebt: 0, morale: rng.int(45, 85), condition: rng.int(70, 96), fitness: rng.int(40, 90), travelFatigue: 0, nourishment: 75, hygiene: 80 },
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

function submitAudition(sim: Simulation, role: Role, person: Person, isPlayer: boolean, format?: 'self_tape' | 'in_person'): Audition {
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

    const chosen = format ?? (rng.chance(0.55) ? 'self_tape' : 'in_person');
    audition.format = chosen;
    audition.stage = chosen === 'self_tape' ? 'self_tape' : 'first_read';
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
      detail: `${project?.title ?? 'A project'}, ${role.billing.replace(/_/g, ' ')}. ${audition.stage === 'self_tape' ? `Tape due ${formatDate(at, sim.homeZone)}. Send it before then; the office will get back to you in its own time.` : `${formatDate(at, sim.homeZone)} at ${formatTime(at, sim.homeZone)} in ${CITIES.get(locationId)?.name ?? 'town'}. Be in the city, be in the room.`} Preparation is the whole game.`,
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

  // A tape that never went is a tape that never went.
  if (audition.isPlayer && audition.stage === 'self_tape' && !audition.tapeSentAt) {
    audition.stage = 'passed';
    audition.decidedAt = sim.now;
    audition.feedback = 'The tape was never sent. They cast from the tapes they had.';
    person.reputation.reliability = clamp(person.reputation.reliability - 3, 0, 100);
    sim.resolveDecision('audition', audition.id);
    sim.notify({
      category: 'career', title: `Tape never sent: ${role.characterName}`,
      body: 'The due date passed with nothing from you. They moved on.',
      importance: 58, route: '/workspace/casting',
    });
    return;
  }

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

  if (audition.stage === 'callback' && !(audition.rounds ?? []).some((r) => r.stage === 'callback')) {
    const project = sim.universe.projects[audition.projectId];
    if (project) holdRound(sim, audition, role, project, 'callback');
  } else if (audition.totalScore === undefined) {
    const result = scoreAudition(sim, audition, 0);
    audition.performanceScore = result.performance;
    audition.fitScore = result.fit;
    audition.totalScore = result.total;
    if (audition.isPlayer) scheduleOfficeResponse(sim, audition, role);
  }

  sim.resolveDecision('audition', audition.id);
  sim.emit('cast.audition_completed', { auditionId: audition.id, score: audition.totalScore });
}

// ---------------------------------------------------------------------------
// The office gets back to you
// ---------------------------------------------------------------------------

/** What an office will take from actors submitting for a part. Decided once per part. */
export function auditionPolicyFor(sim: Simulation, role: Role): NonNullable<Role['auditionPolicy']> {
  if (role.auditionPolicy) return role.auditionPolicy;
  const rng = sim.rng('audition_policy', role.id);
  const roll = rng.float(0, 1);
  role.auditionPolicy = roll < 0.4 ? 'tape_only' : roll < 0.85 ? 'either' : 'in_person_only';
  return role.auditionPolicy;
}

/** Puts the office's answer on the calendar: days out, never the same day. */
function scheduleOfficeResponse(sim: Simulation, audition: Audition, role: Role): void {
  if (!audition.isPlayer || audition.officeResponse) return;
  if (sim.timeline.pending().some((i) => i.kind === 'cast.office_response' && i.refId === audition.id)) return;
  const rng = sim.rng('office_response_when', audition.id);
  const days = audition.format === 'self_tape' ? rng.int(4, 21) : rng.int(3, 14);
  const at = addDays(sim.now, days, sim.homeZone);
  // If the part decides first, the decision is the answer.
  if (role.decidesAt && role.decidesAt <= at) return;
  sim.schedule({
    at, kind: 'cast.office_response',
    label: `Casting Office — ${role.characterName}`,
    category: 'career', payload: { auditionId: audition.id },
    priority: 42, refType: 'audition', refId: audition.id,
  });
}

const OFFICE_CALLBACK = [
  'They loved the tape. They want to see you in the room — details to follow.',
  'The director watched it twice. Can you come in?',
  'Good news: you are on the callback list. Hold the dates.',
  'They responded to the stillness in the second scene. Callback.',
  'Casting called your rep. They want you back in with the director.',
  'You are through to the next round. Producer session, in person.',
  'The office said "that is the closest anyone has come". Callback.',
  'They are bringing in four people. You are one of them.',
];
const OFFICE_HOLD = [
  'They are holding you. No decision yet; do not book anything on those dates.',
  'Casting asked for your availability for the shoot dates. That means you are still in it.',
  'You are pinned. Nothing more than that, but nothing less.',
  'The office says you are "in the mix". They are seeing more people this week.',
  'They asked whether you would consider the smaller part if it came to that.',
  'Still in it. They liked the read; they are not sure about the age.',
  'No news, which in this office is good news. You have not been released.',
  'They wrote back to say the tape "landed". Nothing since.',
];
const OFFICE_PASS = [
  'Thank you for the tape. They are going another way on this one.',
  'They loved the work and it is not going to be you. Both are true.',
  'The role went in a different direction. They hope to see you for something else.',
  'Casting released you. The note was kind and short.',
  'They cast an offer-only name over everyone who read. It happens.',
  'Not this time. The director felt it needed somebody older.',
  'They passed. The reader said you were the best of the day, for what that is worth.',
  'A polite no. Keep the office on your list; they remember tapes.',
];

/**
 * The office's answer to a tape or a read, days later. Where you stand in the
 * field decides it: the top is called back, the middle is held, the rest are
 * released — or, some of the time, simply never hear, which is also an answer.
 */
function officeResponds(sim: Simulation, auditionId: Id): void {
  const audition = sim.universe.auditions[auditionId];
  if (!audition || !audition.isPlayer || audition.decidedAt || audition.officeResponse) return;
  if (audition.totalScore === undefined) return;
  const role = sim.universe.roles[audition.roleId];
  const project = sim.universe.projects[audition.projectId];
  if (!role || !project || role.status !== 'casting') return;

  const field = auditionsFor(sim, role).filter((a) => a.stage !== 'passed');
  for (const other of field) {
    if (other.totalScore === undefined && !other.isPlayer) {
      const result = scoreAudition(sim, other, 0);
      other.performanceScore = result.performance;
      other.fitScore = result.fit;
      other.totalScore = result.total;
    }
  }
  const ranked = field.filter((a) => a.totalScore !== undefined).sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0));
  const rank = Math.max(1, ranked.findIndex((a) => a.id === audition.id) + 1);
  const share = rank / Math.max(1, ranked.length);
  const rng = sim.rng('office_response', audition.id);

  let kind: NonNullable<Audition['officeResponse']>['kind'];
  if (share <= 0.2 || rank === 1) kind = 'callback';
  else if (share <= 0.5) kind = 'hold';
  else kind = rng.chance(0.65) ? 'pass' : 'silence';

  const pick = (bank: string[]) => bank[rng.int(0, bank.length - 1)]!;
  const player = sim.universe.people[audition.personId];
  if (kind === 'callback') {
    const note = pick(OFFICE_CALLBACK);
    audition.officeResponse = { at: sim.now, kind, note };
    if (audition.stage !== 'callback') {
      const when = sim.rng('callback_schedule', audition.id);
      const target = addDays(sim.now, when.int(3, 7), sim.homeZone);
      const parts = zonedParts(target, sim.homeZone);
      const at = instantFromZoned({ year: parts.year, month: parts.month, day: parts.day, hour: when.int(10, 17) }, sim.homeZone);
      audition.stage = 'callback';
      audition.scheduledAt = at;
      const item = sim.schedule({
        at, kind: 'cast.audition',
        label: `Callback — ${role.characterName}`,
        category: 'career', payload: { auditionId: audition.id },
        priority: 36, refType: 'audition', refId: audition.id,
        requiresPlayer: true, locationId: audition.locationId, durationMinutes: 60,
      });
      audition.scheduledItemId = item.id;
      sim.requireDecision({
        urgency: 70, category: 'career',
        title: `Callback: ${role.characterName}`,
        detail: `${project.title}. ${note} ${formatDate(at, sim.homeZone)} at ${formatTime(at, sim.homeZone)} in ${CITIES.get(audition.locationId ?? '')?.name ?? 'town'}.`,
        route: '/workspace/casting', dueAt: at, refType: 'audition', refId: audition.id,
      });
    }
    sim.notify({ category: 'career', title: `Callback: ${role.characterName}`, body: `${project.title}. ${note}`, importance: 70, route: '/workspace/casting', refType: 'audition', refId: audition.id });
    if (player) player.wellbeing.morale = clamp(player.wellbeing.morale + 6, 0, 100);
  } else if (kind === 'hold') {
    const note = pick(OFFICE_HOLD);
    audition.officeResponse = { at: sim.now, kind, note };
    sim.notify({ category: 'career', title: `On hold: ${role.characterName}`, body: `${project.title}. ${note}`, importance: 52, route: '/workspace/casting', refType: 'audition', refId: audition.id });
  } else if (kind === 'pass') {
    const note = pick(OFFICE_PASS);
    audition.officeResponse = { at: sim.now, kind, note };
    audition.stage = 'passed';
    audition.decidedAt = sim.now;
    audition.feedback = note;
    sim.notify({ category: 'career', title: `Released: ${role.characterName}`, body: `${project.title}. ${note}`, importance: 46, route: '/workspace/casting', refType: 'audition', refId: audition.id });
    if (player) player.wellbeing.morale = clamp(player.wellbeing.morale - 3, 0, 100);
  } else {
    // Nothing. The decision day will close it, and the silence is on the record.
    audition.officeResponse = { at: sim.now, kind, note: 'No reply. Offices do not always send the no.' };
  }
  sim.remember({
    category: 'career',
    title: kind === 'silence' ? `No word from casting on ${role.characterName}` : `Casting got back to you on ${role.characterName}`,
    detail: `${project.title}. ${audition.officeResponse.note}`,
    refs: [{ type: 'project', id: project.id }],
    significance: kind === 'callback' ? 40 : 22, public: false,
  });
  sim.emit('cast.office_responded', { auditionId: audition.id, roleId: role.id, kind });
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

  // Nobody is cast off one read. The first time a decision day comes round,
  // the top of the list is called back — the player gets a real room on the
  // calendar for it — and the decision is made ten days later on both.
  if (!role.callbacksAt && holdWorldCallbacks(sim, role, project, auditions)) return;

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
  // What they think of you is in the number, and nobody says so out loud.
  return Math.max(role.payLow, Math.round(negotiation * quoteMultiplierFor(sim, person)));
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
    wellbeing: { energy: 70, stress: 55, sleepDebt: 4, morale: 70, condition: 78, fitness: 55, travelFatigue: 10, nourishment: 70, hygiene: 80 },
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
  // nobody proofread, so each brief is used once per production. The same goes
  // for the character names: two people called Ellis in one film is a mistake,
  // not a coincidence.
  const usedBriefs = new Set<string>();
  const usedNames = new Set(
    Object.values(sim.universe.roles)
      .filter((role) => role.projectId === project.id)
      .map((role) => role.characterName),
  );
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
        characterName: (() => {
          const chosen = generateCharacterName(rng, (name) => usedNames.has(name));
          usedNames.add(chosen);
          return chosen;
        })(),
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


// ---------------------------------------------------------------------------
// The rooms
// ---------------------------------------------------------------------------

/** A part on a picture the player controls, still open to be cast. */
function ownRole(sim: Simulation, roleId: Id): { role: Role; project: Project } {
  const role = sim.universe.roles[roleId];
  if (!role) throw new CommandError('No such part.');
  const project = sim.universe.projects[role.projectId];
  if (!project) throw new CommandError('No such project.');
  if (!playerControls(sim, project)) throw new CommandError('That is not your picture to cast.');
  if (role.status !== 'casting') throw new CommandError(`${role.characterName} is not being cast right now.`);
  return { role, project };
}

/** How much each room weighs in the decision. The later rooms tell you more. */
const ROUND_WEIGHT: Partial<Record<AuditionStage, number>> = {
  submitted: 0.6, self_tape: 0.7, first_read: 1, callback: 1.3, chemistry_read: 1.4, screen_test: 1.8,
};

/** The score a decision is made on: every room, the later ones counting more. */
export function decisionScore(audition: Audition): number {
  const rounds = audition.rounds ?? [];
  if (rounds.length === 0) return audition.totalScore ?? 0;
  let total = 0;
  let weight = 0;
  for (const round of rounds) {
    const w = ROUND_WEIGHT[round.stage] ?? 1;
    total += round.score * w;
    weight += w;
  }
  return weight > 0 ? Number((total / weight).toFixed(1)) : audition.totalScore ?? 0;
}

/**
 * One room, scored on what that room tests.
 *
 * A first read is technique and fit. A callback is whether the note landed.
 * A chemistry read is the two of them together. A screen test is whether they
 * hold up with the camera on and the studio in the room. The first read's
 * score is kept as the first round, so a decision always has the whole
 * history under it.
 */
function holdRound(sim: Simulation, audition: Audition, _role: Role, project: Project, stage: AuditionStage, partner?: Person): { score: number; note: string } {
  const person = sim.universe.people[audition.personId];
  if (!person) throw new CommandError('No such person.');
  if (audition.totalScore === undefined) {
    const first = scoreAudition(sim, audition, 0);
    audition.performanceScore = first.performance;
    audition.fitScore = first.fit;
    audition.totalScore = first.total;
  }
  audition.rounds ??= [];
  if (audition.rounds.length === 0) {
    audition.rounds.push({ stage: audition.stage === 'submitted' ? 'first_read' : audition.stage, at: audition.submittedAt, score: Number((audition.totalScore ?? 0).toFixed(1)), note: 'The first read.' });
  }

  const sheet = effectiveAttributes(person.attributes, person.traits);
  const fit = audition.fitScore ?? 50;
  const rng = sim.rng('round', audition.id, stage);
  const ready = person.isPlayer ? readiness(person) : 78 + rng.normal(0, 8);
  const noise = rng.normal(0, 7 * systemModifier(person.traits, 'auditionVariance'));

  let score: number;
  let note: string;
  switch (stage) {
    case 'callback': {
      const absorption = sheet['direction_absorption'] ?? 30;
      const preparation = sheet['preparation'] ?? 30;
      const cold = sheet['cold_reading'] ?? 30;
      score = clamp(fit * 0.3 + absorption * 0.3 + preparation * 0.2 + cold * 0.1 + ready * 0.1 + noise, 0, 100);
      note = absorption > 65 ? 'Took the note and came back with a different performance.' : absorption > 45 ? 'Adjusted, some of the way.' : 'Gave the same read again, which is not what a callback is for.';
      break;
    }
    case 'chemistry_read': {
      const mine = ((sheet['chemistry'] ?? 35) + (sheet['chemistry_reads'] ?? 35)) / 2;
      const theirs = partner ? (effectiveAttributes(partner.attributes, partner.traits)['chemistry'] ?? 35) : 50;
      const listening = sheet['active_listening'] ?? sheet['ensemble_blending'] ?? 40;
      score = clamp(mine * 0.4 + theirs * 0.2 + listening * 0.2 + fit * 0.1 + ready * 0.1 + noise, 0, 100);
      note = score > 70 ? `Something happened in the room with ${partner?.displayName ?? 'the other actor'}.` : score > 50 ? 'Perfectly competent together, which is not the same as chemistry.' : 'Nothing between them, and everybody in the room could see it.';
      break;
    }
    case 'screen_test': {
      const composure = sheet['screen_test_composure'] ?? 30;
      const camera = sheet['camera_awareness'] ?? 35;
      const consistency = sheet['take_consistency'] ?? 40;
      score = clamp(composure * 0.35 + camera * 0.25 + consistency * 0.2 + fit * 0.1 + ready * 0.1 + noise, 0, 100);
      note = score > 72 ? 'The camera likes them, and the studio saw it.' : score > 52 ? 'Fine on camera. Nobody in the room was surprised either way.' : 'Smaller on camera than in the room.';
      break;
    }
    default: {
      score = clamp((audition.totalScore ?? 50) + noise, 0, 100);
      note = 'Read again.';
    }
  }

  const round = { stage, at: sim.now, score: Number(score.toFixed(1)), note };
  audition.rounds.push(round);
  audition.stage = stage;
  audition.totalScore = decisionScore(audition);

  if (person.isPlayer) {
    sim.audit({
      kind: 'cast.round_held', subjectType: 'audition', subjectId: audition.id,
      question: `How did the ${stage.replace(/_/g, ' ')} go?`,
      summary: note,
      factors: [
        { label: 'What The Room Tested', detail: stage === 'callback' ? 'Whether a note changes the performance.' : stage === 'chemistry_read' ? 'The two of you together.' : 'Holding up with the camera on.', weight: 0.6, contribution: score * 0.6, knowable: true },
        { label: 'How You Were On The Day', detail: `Readiness at ${Math.round(ready)}%.`, weight: 0.1, contribution: ready * 0.1, knowable: true },
      ],
      score, outcome: `${Math.round(score)}`,
    });
  }
  void project;
  return round;
}


/**
 * The callback round on a part the world is casting.
 *
 * The four strongest reads are called back. Each is scored in the callback
 * room; the player, if among them, gets an appointment rather than a score
 * — the room runs when they turn up to it. Returns true when a round was
 * held, which means the decision waits.
 */
function holdWorldCallbacks(sim: Simulation, role: Role, project: Project, auditions: Audition[]): boolean {
  const alreadyIn = new Set(project.castIds);
  const ranked = auditions
    .filter((a) => a.stage !== 'passed' && a.totalScore !== undefined && !alreadyIn.has(a.personId))
    .sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0));
  if (ranked.length < 2) return false;

  const called = ranked.slice(0, Math.min(4, ranked.length));
  role.callbacksAt = sim.now;
  for (const audition of ranked.slice(called.length)) {
    audition.stage = 'passed';
    audition.decidedAt = sim.now;
    audition.feedback = 'Not called back.';
    if (audition.isPlayer) {
      sim.notify({
        category: 'career', title: `No callback: ${role.characterName}`,
        body: `${project.title}. ${called.length} people were called back and you were not one of them.`,
        importance: 40, route: '/workspace/casting',
      });
    }
  }

  const decidesAt = addDays(sim.now, 10, sim.homeZone);
  role.decidesAt = decidesAt;
  for (const audition of called) {
    if (audition.isPlayer) {
      // A real appointment: the callback is scored when the player is in it.
      const rng = sim.rng('callback_schedule', audition.id);
      const target = addDays(sim.now, rng.int(3, 7), sim.homeZone);
      const parts = zonedParts(target, sim.homeZone);
      const at = instantFromZoned({ year: parts.year, month: parts.month, day: parts.day, hour: rng.int(10, 17) }, sim.homeZone);
      audition.stage = 'callback';
      audition.scheduledAt = at;
      const item = sim.schedule({
        at, kind: 'cast.audition',
        label: `Callback — ${role.characterName}`,
        category: 'career', payload: { auditionId: audition.id },
        priority: 36, refType: 'audition', refId: audition.id,
        requiresPlayer: true, locationId: audition.locationId, durationMinutes: 60,
      });
      audition.scheduledItemId = item.id;
      sim.requireDecision({
        urgency: 70, category: 'career',
        title: `Callback: ${role.characterName}`,
        detail: `${project.title}. They want to see you again — ${formatDate(at, sim.homeZone)} at ${formatTime(at, sim.homeZone)}. A callback is about whether the note lands.`,
        route: '/workspace/casting', dueAt: at, refType: 'audition', refId: audition.id,
      });
    } else {
      holdRound(sim, audition, role, project, 'callback');
    }
  }

  sim.schedule({
    at: decidesAt, kind: 'cast.decide_role',
    label: `Casting Decision — ${role.characterName} In ${project.title}`,
    category: 'system', payload: { roleId: role.id }, priority: 38,
    refType: 'role', refId: role.id,
  });
  sim.emit('cast.callbacks_held', { roleId: role.id, projectId: project.id, count: called.length });
  return true;
}
