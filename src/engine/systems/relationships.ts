/**
 * SLATE — Relationships, dating, marriage and family.
 *
 * A relationship is seven dimensions and a memory, not a friendship bar.
 * People remember what you did, how long ago, and whether you have made up for
 * it. Private relationships stay private until something makes them public.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type {
  Household, Id, Person, Relationship, RelationshipDimensions, RelationshipMemory, RelationshipType,
} from '../domain/model';
import { clamp, remap } from '../core/rng';
import { addDays, addYears, ageOn, formatDate, nextAnniversary, zonedParts, MS_DAY } from '../core/time';
import { formatMoney, type Money } from '../core/money';
import { buildFactors } from '../core/audit';
import { costOfLiving } from '../content/tax';
import { systemModifier } from '../domain/attributes';
import { CATALOG } from '../content/catalog';

const ROMANTIC: readonly RelationshipType[] = ['dating', 'engaged', 'spouse'];
const FAMILY: readonly RelationshipType[] = ['parent', 'child', 'sibling', 'relative', 'guardian', 'ward'];

export function isRomantic(type: RelationshipType): boolean {
  return ROMANTIC.includes(type);
}

export function isFamily(type: RelationshipType): boolean {
  return FAMILY.includes(type);
}

/** Canonical ordering, so a pair has exactly one relationship record. */
export function relationshipKey(aId: Id, bId: Id): [Id, Id] {
  return aId < bId ? [aId, bId] : [bId, aId];
}

export function findRelationship(sim: Simulation, aId: Id, bId: Id): Relationship | undefined {
  const [x, y] = relationshipKey(aId, bId);
  return Object.values(sim.universe.relationships).find((r) => r.aId === x && r.bId === y && !r.endedAt);
}

export function relationshipsOf(sim: Simulation, personId: Id): Relationship[] {
  return Object.values(sim.universe.relationships).filter(
    (r) => (r.aId === personId || r.bId === personId) && !r.endedAt,
  );
}

export function otherParty(rel: Relationship, personId: Id): Id {
  return rel.aId === personId ? rel.bId : rel.aId;
}

/**
 * A single 0-100 read of how a relationship is doing right now, after memory
 * decay. Conflict is subtracted rather than averaged, because unresolved
 * friction poisons everything else.
 */
export function relationshipStrength(rel: Relationship, now: number): number {
  const d = rel.dimensions;
  const memoryEffect = activeMemoryEffect(rel, now);
  const base =
    d.affection * 0.30 + d.trust * 0.24 + d.respect * 0.16 +
    d.compatibility * 0.14 + d.commitment * 0.16;
  return clamp(base + memoryEffect - d.conflict * 0.55, 0, 100);
}

/** Sum of memory impacts, faded by age. Big events never fully fade. */
export function activeMemoryEffect(rel: Relationship, now: number): number {
  let total = 0;
  for (const m of rel.memories) {
    const ageDays = (now - m.at) / MS_DAY;
    if (m.decayDays <= 0) { total += m.impact; continue; }
    const remaining = Math.max(0, 1 - ageDays / m.decayDays);
    total += m.impact * remaining;
  }
  return clamp(total, -35, 35);
}

export function describeRelationship(rel: Relationship, now: number): string {
  const strength = relationshipStrength(rel, now);
  if (rel.dimensions.conflict > 55) return 'Strained. Something needs saying.';
  if (strength > 85) return 'As close as it gets.';
  if (strength > 70) return 'Genuinely good.';
  if (strength > 50) return 'Solid.';
  if (strength > 32) return 'Cordial, no more than that.';
  if (strength > 15) return 'Cooling off.';
  return 'Barely there.';
}

function freshDimensions(overrides: Partial<RelationshipDimensions> = {}): RelationshipDimensions {
  return {
    familiarity: 8, affection: 22, trust: 20, respect: 25,
    compatibility: 50, commitment: 5, conflict: 0,
    ...overrides,
  };
}

export function compatibilityBetween(a: Person, b: Person): number {
  const pa = a.personality;
  const pb = b.personality;
  const diff = (x: number, y: number) => 1 - Math.abs(x - y) / 100;
  // Similar conscientiousness and stability help; complementary extraversion is fine.
  const shared = a.interests.filter((i) => b.interests.includes(i)).length;
  const value =
    diff(pa.conscientiousness, pb.conscientiousness) * 24 +
    diff(pa.emotionalStability, pb.emotionalStability) * 22 +
    diff(pa.openness, pb.openness) * 18 +
    (1 - Math.abs(pa.extraversion - pb.extraversion) / 200) * 14 +
    diff(pa.agreeableness, pb.agreeableness) * 12 +
    clamp(shared / 4, 0, 1) * 10;
  return clamp(Math.round(value), 5, 98);
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export function registerRelationships(sim: Simulation): void {
  sim.onSchedule('rel.date', (item) => resolveDate(sim, item.payload.relationshipId as Id, item.payload.plan as DatePlan));
  sim.onSchedule('rel.birthday', (item) => celebrateBirthday(sim, item.payload.personId as Id));
  sim.onSchedule('rel.anniversary', (item) => {
    const rel = sim.universe.relationships[item.payload.relationshipId as Id];
    if (!rel || rel.endedAt) return;
    addMemory(sim, rel, { kind: 'anniversary', summary: 'Another year together.', impact: 3, decayDays: 200 });
    sim.notify({ category: 'relationships', title: 'Anniversary', body: `Today marks another year with ${nameOf(sim, otherParty(rel, sim.universe.playerId))}.`, importance: 55, route: '/workspace/relationships' });
    sim.schedule({
      at: addYears(item.at, 1, sim.homeZone), kind: 'rel.anniversary',
      label: 'Anniversary', category: 'family',
      payload: { relationshipId: rel.id }, priority: 70,
      refType: 'relationship', refId: rel.id, requiresPlayer: false,
    });
  });
  sim.onSchedule('rel.wedding', (item) => holdWedding(sim, item.payload.relationshipId as Id, item.payload.budget as Money, item.payload.guests as number));
  sim.onSchedule('rel.drift', () => {
    driftRelationships(sim);
    sim.schedule({ at: addDays(sim.now, 7, sim.homeZone), kind: 'rel.drift', label: 'Relationship Drift', category: 'system', priority: 90 });
  });

  // --- Commands ------------------------------------------------------------

  sim.onCommand<{ personId: Id; type?: RelationshipType; context?: string }, { relationshipId: Id }>(
    'rel.meet',
    (p, { sim: s }) => {
      const player = s.player;
      const other = s.universe.people[p.personId];
      if (!other) throw new CommandError('No such person.');
      const existing = findRelationship(s, player.id, other.id);
      if (existing) return { relationshipId: existing.id };
      const rel = createRelationship(s, player.id, other.id, p.type ?? 'acquaintance', { context: p.context });
      return { relationshipId: rel.id };
    },
  );

  sim.onCommand<{ relationshipId: Id; interaction: InteractionKind; minutes?: number }, { strength: number; note: string }>(
    'rel.interact',
    (p, { sim: s }) => {
      const rel = s.universe.relationships[p.relationshipId];
      if (!rel || rel.endedAt) throw new CommandError('That relationship is not active.');
      const def = INTERACTIONS[p.interaction];
      if (!def) throw new CommandError('Unknown interaction.');

      const player = s.player;
      const other = s.universe.people[otherParty(rel, player.id)];
      if (!other) throw new CommandError('That person is not in this world any more.');

      if (rel.dimensions.familiarity < def.minFamiliarity) {
        throw new CommandError(`You do not know ${other.displayName} well enough for that yet.`);
      }

      const minutes = p.minutes ?? def.minutes;
      s.advanceTo(s.now + minutes * 60_000);

      const rng = s.rng('interaction', rel.id, s.now);
      const receptiveness = clamp(
        0.5 + (rel.dimensions.compatibility - 50) / 180 + (other.personality.agreeableness - 50) / 220 - rel.dimensions.conflict / 260,
        0.1, 0.95,
      );
      const wentWell = rng.next() < receptiveness;
      const scale = wentWell ? 1 : -0.45;

      applyDelta(rel.dimensions, {
        familiarity: def.effects.familiarity ?? 0,
        affection: (def.effects.affection ?? 0) * scale,
        trust: (def.effects.trust ?? 0) * scale,
        respect: (def.effects.respect ?? 0) * scale,
        commitment: (def.effects.commitment ?? 0) * scale,
        // Time spent well together takes a little of the friction out even
        // when clearing the air was not the point of it.
        conflict: wentWell ? -((def.effects.conflictRelief ?? 0) + 1.5) : (def.effects.conflictRisk ?? 2),
      });
      rel.lastInteractionAt = s.now;

      addMemory(s, rel, {
        kind: p.interaction,
        summary: wentWell ? def.goodOutcome : def.badOutcome,
        impact: wentWell ? def.memoryImpact : -def.memoryImpact * 0.6,
        decayDays: def.memoryDecayDays,
      });

      player.wellbeing.stress = clamp(player.wellbeing.stress + (wentWell ? -5 : 4), 0, 100);
      player.wellbeing.morale = clamp(player.wellbeing.morale + (wentWell ? 5 : -4), 0, 100);

      s.emit('rel.interaction', { relationshipId: rel.id, interaction: p.interaction, wentWell });
      return {
        strength: Math.round(relationshipStrength(rel, s.now)),
        note: wentWell ? def.goodOutcome : def.badOutcome,
      };
    },
  );

  sim.onCommand<{ personId: Id; activityId: string; at: number; locationId?: string; budget?: Money }, { scheduledItemId: Id; accepted: boolean; reason?: string }>(
    'rel.ask_out',
    (p, { sim: s }) => {
      const player = s.player;
      const other = s.universe.people[p.personId];
      if (!other) throw new CommandError('No such person.');
      let rel = findRelationship(s, player.id, other.id);
      if (!rel) rel = createRelationship(s, player.id, other.id, 'acquaintance');

      if (rel.dimensions.familiarity < 18) {
        throw new CommandError(`You barely know ${other.displayName}. Spend some time together first.`);
      }
      const exclusiveElsewhere = relationshipsOf(s, other.id).some(
        (r) => r.exclusive && isRomantic(r.type) && r.id !== rel?.id,
      );

      const rng = s.rng('ask_out', rel.id, p.at);
      const { factors, score } = buildFactors([
        { label: 'How Well They Know You', detail: `Familiarity is ${Math.round(rel.dimensions.familiarity)} out of 100.`, weight: 0.26, value: rel.dimensions.familiarity / 100 },
        { label: 'How They Feel About You', detail: `Affection is ${Math.round(rel.dimensions.affection)} out of 100.`, weight: 0.30, value: rel.dimensions.affection / 100 },
        { label: 'Compatibility', detail: 'Underlying fit between the two of you.', weight: 0.18, value: rel.dimensions.compatibility / 100 },
        { label: 'Your Public Profile', detail: 'Fame opens some doors and closes others.', weight: 0.08, value: player.reputation.publicFame / 100 },
        { label: 'Whether They Are Seeing Someone', detail: 'Their situation, which you may not know.', weight: -0.30, value: exclusiveElsewhere ? 1 : 0, knowable: false },
        { label: 'Timing', detail: 'What else is going on in their life.', weight: 0.12, value: rng.float(0, 1), knowable: false },
      ]);

      const probability = clamp(score * 1.2 - 0.12, 0.02, 0.95);
      const roll = rng.next();
      const accepted = roll < probability;

      s.audit({
        kind: 'rel.ask_out_decided', subjectType: 'relationship', subjectId: rel.id,
        question: 'Why did they say yes, or no?',
        summary: accepted
          ? `${other.displayName} said yes.`
          : `${other.displayName} said no. ${rel.dimensions.familiarity < 35 ? 'You do not know each other well enough yet.' : 'The timing was not right.'}`,
        factors, seed: `ask_out|${rel.id}|${p.at}`, roll, probability, score,
        outcome: accepted ? 'accepted' : 'declined',
      });

      if (!accepted) {
        applyDelta(rel.dimensions, { conflict: 2 });
        s.emit('rel.ask_out_declined', { relationshipId: rel.id, personId: other.id });
        return { scheduledItemId: '', accepted: false, reason: 'They said no.' };
      }

      const plan: DatePlan = {
        activityId: p.activityId,
        locationId: p.locationId ?? player.currentLocationId,
        budget: p.budget ?? 90_00,
      };
      const item = s.schedule({
        at: p.at,
        kind: 'rel.date',
        label: `Date with ${other.displayName}`,
        category: 'personal',
        payload: { relationshipId: rel.id, plan: plan as unknown as Record<string, unknown> },
        priority: 45,
        refType: 'relationship', refId: rel.id,
        requiresPlayer: true,
        locationId: plan.locationId,
        durationMinutes: 180,
      });
      s.emit('rel.date_scheduled', { relationshipId: rel.id, at: p.at });
      return { scheduledItemId: item.id, accepted: true };
    },
  );

  sim.onCommand<{ relationshipId: Id; exclusive?: boolean }, { type: RelationshipType }>(
    'rel.define',
    (p, { sim: s }) => {
      const rel = s.universe.relationships[p.relationshipId];
      if (!rel || rel.endedAt) throw new CommandError('That relationship is not active.');
      const strength = relationshipStrength(rel, s.now);
      if (strength < 48) throw new CommandError('It is too early for that conversation. Spend more time together.');
      rel.type = 'dating';
      rel.exclusive = p.exclusive ?? true;
      rel.since = s.now;
      applyDelta(rel.dimensions, { commitment: 22, affection: 6 });
      addMemory(s, rel, { kind: 'defined', summary: 'You agreed you were together.', impact: 8, decayDays: 0 });

      const other = s.universe.people[otherParty(rel, s.player.id)];
      s.remember({
        category: 'relationship',
        title: `Started seeing ${other?.displayName ?? 'someone'}`,
        detail: rel.exclusive ? 'Exclusively.' : 'Not exclusively.',
        refs: [{ type: 'relationship', id: rel.id }, { type: 'person', id: other?.id ?? '' }],
        significance: 55, public: rel.isPublic,
      });
      s.emit('rel.became_partners', { relationshipId: rel.id, exclusive: rel.exclusive });
      return { type: rel.type };
    },
  );

  sim.onCommand<{ relationshipId: Id; ringAssetId?: Id; accountId?: Id }, { accepted: boolean }>(
    'rel.propose',
    (p, { sim: s }) => {
      const rel = s.universe.relationships[p.relationshipId];
      if (!rel || rel.endedAt) throw new CommandError('That relationship is not active.');
      if (rel.type !== 'dating') throw new CommandError('You have to be together before you can propose.');

      const player = s.player;
      const other = s.universe.people[otherParty(rel, player.id)];
      if (!other) throw new CommandError('That person is not here.');

      const ring = p.ringAssetId ? s.universe.assets[p.ringAssetId] : undefined;
      if (p.ringAssetId && !ring) throw new CommandError('You do not own that ring.');
      const ringQuality = ring ? clamp(remap(ring.currentValue, 0, 80_000_00, 0, 1), 0, 1) : 0;

      const monthsTogether = (s.now - rel.since) / (30.44 * MS_DAY);
      const rng = s.rng('propose', rel.id);
      const { factors, score } = buildFactors([
        { label: 'How Strong The Relationship Is', detail: `Overall strength is ${Math.round(relationshipStrength(rel, s.now))} out of 100.`, weight: 0.38, value: relationshipStrength(rel, s.now) / 100 },
        { label: 'How Long You Have Been Together', detail: `${monthsTogether.toFixed(1)} months.`, weight: 0.24, value: clamp(monthsTogether / 24, 0, 1) },
        { label: 'Commitment', detail: `Their commitment reads ${Math.round(rel.dimensions.commitment)} out of 100.`, weight: 0.22, value: rel.dimensions.commitment / 100 },
        { label: 'The Ring', detail: ring ? `${ring.name}.` : 'You proposed without a ring.', weight: 0.08, value: ringQuality },
        { label: 'Unresolved Conflict', detail: `Friction reads ${Math.round(rel.dimensions.conflict)} out of 100.`, weight: -0.20, value: rel.dimensions.conflict / 100 },
        { label: 'Whether They Were Ready', detail: 'What they want for their own life.', weight: 0.14, value: rng.float(0, 1), knowable: false },
      ]);

      const probability = clamp(score * 1.15 - 0.14, 0.03, 0.97);
      const roll = rng.next();
      const accepted = roll < probability;

      s.audit({
        kind: 'rel.proposal_decided', subjectType: 'relationship', subjectId: rel.id,
        question: 'Why did they say yes, or no?',
        summary: accepted
          ? `${other.displayName} said yes.`
          : `${other.displayName} said not yet. ${monthsTogether < 10 ? 'It has not been very long.' : 'Something is unresolved between you.'}`,
        factors, seed: `propose|${rel.id}`, roll, probability, score,
        outcome: accepted ? 'accepted' : 'declined',
      });

      if (!accepted) {
        applyDelta(rel.dimensions, { conflict: 14, commitment: -8 });
        addMemory(s, rel, { kind: 'proposal_declined', summary: 'You proposed and they said not yet.', impact: -12, decayDays: 540 });
        s.emit('rel.proposal_declined', { relationshipId: rel.id });
        return { accepted: false };
      }

      rel.type = 'engaged';
      rel.isPublic = true;
      applyDelta(rel.dimensions, { commitment: 28, affection: 10 });
      addMemory(s, rel, { kind: 'engaged', summary: 'You got engaged.', impact: 18, decayDays: 0 });
      if (ring) {
        ring.provenance.push({ at: s.now, note: `Given to ${other.displayName} as an engagement ring.` });
        ring.ownerId = other.id;
      }

      s.remember({
        category: 'relationship',
        title: `Engaged to ${other.displayName}`,
        detail: ring ? `With ${ring.name}.` : 'No ring, and they said yes anyway.',
        refs: [{ type: 'relationship', id: rel.id }, { type: 'person', id: other.id }],
        significance: 85, public: true,
      });
      s.emit('rel.engaged', { relationshipId: rel.id, personId: other.id, ringAssetId: ring?.id });
      return { accepted: true };
    },
  );

  sim.onCommand<{ relationshipId: Id; date: number; budget: Money; guests: number; venue: string; accountId?: Id }, { scheduledItemId: Id; cost: Money }>(
    'rel.plan_wedding',
    (p, { sim: s }) => {
      const rel = s.universe.relationships[p.relationshipId];
      if (!rel || rel.endedAt) throw new CommandError('That relationship is not active.');
      if (rel.type !== 'engaged') throw new CommandError('You have to be engaged first.');
      if (p.date <= s.now) throw new CommandError('Pick a date in the future.');

      const player = s.player;
      const col = costOfLiving(player.currentLocationId);
      const estimate = Math.round((28_000_00 + p.guests * 320_00) * col * (p.venue === 'destination' ? 1.6 : p.venue === 'estate' ? 1.35 : 1));
      const budget = Math.max(p.budget, Math.round(estimate * 0.4));

      const accountId = p.accountId ?? player.primaryAccountId;
      if (!accountId) throw new CommandError('No account to pay from.');
      const deposit = Math.round(budget * 0.3);
      if (s.ledger.availableFunds(accountId) < deposit) {
        throw new CommandError(`A wedding at this scale needs a deposit of about ${formatMoney(deposit)}.`);
      }
      s.expense(accountId, deposit, 'Wedding deposit', 'personal', { refType: 'relationship', refId: rel.id });

      const item = s.schedule({
        at: p.date,
        kind: 'rel.wedding',
        label: `Wedding — ${nameOf(s, otherParty(rel, player.id))}`,
        category: 'family',
        payload: { relationshipId: rel.id, budget, guests: p.guests },
        priority: 5,
        refType: 'relationship', refId: rel.id,
        requiresPlayer: true,
        durationMinutes: 480,
      });

      s.notify({
        category: 'relationships', title: 'Wedding Booked',
        body: `${formatDate(p.date, s.homeZone)}, ${p.guests} guests, budget ${formatMoney(budget)}.`,
        importance: 70, route: '/workspace/calendar',
      });
      s.emit('rel.wedding_planned', { relationshipId: rel.id, at: p.date, budget, guests: p.guests });
      return { scheduledItemId: item.id, cost: deposit };
    },
  );

  sim.onCommand<{ relationshipId: Id; reason?: string }, { ended: boolean }>(
    'rel.end',
    (p, { sim: s }) => {
      const rel = s.universe.relationships[p.relationshipId];
      if (!rel || rel.endedAt) throw new CommandError('That relationship is already over.');
      const player = s.player;
      const other = s.universe.people[otherParty(rel, player.id)];
      const wasMarried = rel.type === 'spouse';

      rel.endedAt = s.now;
      rel.endReason = p.reason ?? (wasMarried ? 'Divorce' : 'Ended');

      const ended = createRelationship(s, rel.aId, rel.bId, 'ex_partner', {
        dimensions: {
          ...rel.dimensions,
          affection: clamp(rel.dimensions.affection * 0.4, 0, 100),
          commitment: 0,
          conflict: clamp(rel.dimensions.conflict + 25, 0, 100),
        },
      });
      ended.memories = rel.memories.slice(-12);

      if (wasMarried) {
        divideAssets(s, player.id, other?.id ?? '');
        const household = player.householdId ? s.universe.households[player.householdId] : undefined;
        if (household && other) {
          household.memberIds = household.memberIds.filter((m) => m !== other.id);
          household.headIds = household.headIds.filter((m) => m !== other.id);
          household.historyNotes.push({ at: s.now, note: `${other.displayName} moved out.` });
        }
      }

      player.wellbeing.stress = clamp(player.wellbeing.stress + (wasMarried ? 32 : 18), 0, 100);
      player.wellbeing.morale = clamp(player.wellbeing.morale - (wasMarried ? 30 : 16), 0, 100);

      s.remember({
        category: 'relationship',
        title: wasMarried ? `Divorced ${other?.displayName ?? ''}` : `Broke up with ${other?.displayName ?? ''}`,
        detail: rel.endReason,
        refs: [{ type: 'relationship', id: rel.id }],
        significance: wasMarried ? 80 : 45,
        public: rel.isPublic,
      });
      s.emit('rel.ended', { relationshipId: rel.id, wasMarried, personId: other?.id });
      return { ended: true };
    },
  );

  sim.onCommand<{ relationshipId: Id; assetId: Id }, { given: boolean }>(
    'rel.give_gift',
    (p, { sim: s }) => {
      const rel = s.universe.relationships[p.relationshipId];
      if (!rel || rel.endedAt) throw new CommandError('That relationship is not active.');
      const asset = s.universe.assets[p.assetId];
      if (!asset || asset.ownerId !== s.player.id) throw new CommandError('You do not own that.');

      const recipientId = otherParty(rel, s.player.id);
      const recipient = s.universe.people[recipientId];
      asset.ownerId = recipientId;
      asset.acquiredVia = 'gift';
      asset.giftedById = s.player.id;
      asset.provenance.push({ at: s.now, note: `Given to ${recipient?.displayName ?? 'them'}.` });

      const generosity = clamp(remap(asset.currentValue, 0, 20_000_00, 2, 16), 2, 20);
      applyDelta(rel.dimensions, { affection: generosity, trust: generosity * 0.3, familiarity: 2 });
      addMemory(s, rel, {
        kind: 'gift',
        summary: `You gave them ${asset.name}.`,
        impact: generosity * 0.6,
        decayDays: 400,
        refType: 'asset', refId: asset.id,
      });
      s.emit('rel.gift_given', { relationshipId: rel.id, assetId: asset.id, value: asset.currentValue });
      return { given: true };
    },
  );

  sim.onCommand<{ partnerRelationshipId: Id; method: 'birth' | 'adoption'; name?: string }, { childId: Id }>(
    'rel.have_child',
    (p, { sim: s }) => {
      const rel = s.universe.relationships[p.partnerRelationshipId];
      if (!rel || rel.endedAt) throw new CommandError('That relationship is not active.');
      if (!['dating', 'engaged', 'spouse'].includes(rel.type)) {
        throw new CommandError('You need to be in a committed relationship for that.');
      }
      const player = s.player;
      const partner = s.universe.people[otherParty(rel, player.id)];
      if (!partner) throw new CommandError('Your partner is not here.');
      if (relationshipStrength(rel, s.now) < 55) {
        throw new CommandError('The relationship is not in a place for that decision right now.');
      }

      const child = createChild(s, player, partner, p.name, p.method);
      return { childId: child.id };
    },
  );
}

// ---------------------------------------------------------------------------
// Interactions
// ---------------------------------------------------------------------------

export type InteractionKind =
  | 'chat' | 'catch_up' | 'deep_talk' | 'favour' | 'apologise' | 'confront'
  | 'work_together' | 'celebrate' | 'support';

interface InteractionDef {
  name: string;
  minutes: number;
  minFamiliarity: number;
  effects: { familiarity?: number; affection?: number; trust?: number; respect?: number; commitment?: number; conflictRelief?: number; conflictRisk?: number };
  memoryImpact: number;
  memoryDecayDays: number;
  goodOutcome: string;
  badOutcome: string;
  description: string;
}

export const INTERACTIONS: Readonly<Record<InteractionKind, InteractionDef>> = {
  chat: { name: 'Chat', minutes: 20, minFamiliarity: 0, effects: { familiarity: 4, affection: 2 }, memoryImpact: 1, memoryDecayDays: 30, goodOutcome: 'Easy conversation. Nothing heavy.', badOutcome: 'A bit flat. Neither of you had much to say.', description: 'Light, low stakes, builds familiarity.' },
  catch_up: { name: 'Catch up properly', minutes: 90, minFamiliarity: 15, effects: { familiarity: 6, affection: 5, trust: 3 }, memoryImpact: 3, memoryDecayDays: 120, goodOutcome: 'A proper catch-up. You both left it feeling better.', badOutcome: 'You talked past each other for an hour.', description: 'Time and attention, which is what most relationships actually need.' },
  deep_talk: { name: 'Have a real conversation', minutes: 120, minFamiliarity: 35, effects: { familiarity: 5, affection: 7, trust: 9, commitment: 4 }, memoryImpact: 7, memoryDecayDays: 500, goodOutcome: 'You said something true and they heard it.', badOutcome: 'It got heavy and neither of you handled it well.', description: 'The conversation that changes a relationship, in either direction.' },
  favour: { name: 'Ask a favour', minutes: 30, minFamiliarity: 30, effects: { trust: -2, affection: -1, conflictRisk: 4 }, memoryImpact: -2, memoryDecayDays: 180, goodOutcome: 'They helped without making it a thing.', badOutcome: 'They said yes and you could tell it cost them.', description: 'Spends relationship capital. Sometimes it is worth it.' },
  apologise: { name: 'Apologise', minutes: 45, minFamiliarity: 10, effects: { trust: 6, affection: 4, conflictRelief: 22 }, memoryImpact: 5, memoryDecayDays: 300, goodOutcome: 'They accepted it. The air cleared.', badOutcome: 'They were not ready to hear it.', description: 'The only thing that actually clears conflict.' },
  confront: { name: 'Confront them', minutes: 60, minFamiliarity: 20, effects: { respect: 3, conflictRisk: 18, trust: -4 }, memoryImpact: -6, memoryDecayDays: 420, goodOutcome: 'Hard, honest, and probably necessary.', badOutcome: 'It went badly and now it is worse.', description: 'High risk. Occasionally the only honest option.' },
  work_together: { name: 'Work together', minutes: 240, minFamiliarity: 5, effects: { familiarity: 8, respect: 7, trust: 4 }, memoryImpact: 4, memoryDecayDays: 400, goodOutcome: 'You work well together and you both noticed.', badOutcome: 'The working styles did not mesh.', description: 'Builds professional respect faster than anything else.' },
  celebrate: { name: 'Celebrate something', minutes: 180, minFamiliarity: 20, effects: { familiarity: 3, affection: 8, commitment: 3 }, memoryImpact: 6, memoryDecayDays: 700, goodOutcome: 'A genuinely good night.', badOutcome: 'The occasion did not quite land.', description: 'Shared good news becomes a shared memory.' },
  support: { name: 'Be there for them', minutes: 150, minFamiliarity: 25, effects: { trust: 12, affection: 8, commitment: 6 }, memoryImpact: 10, memoryDecayDays: 0, goodOutcome: 'You showed up when it mattered. They will not forget it.', badOutcome: 'You tried, and it was not what they needed.', description: 'Showing up in a hard moment is remembered permanently.' },
};

// ---------------------------------------------------------------------------
// Mechanics
// ---------------------------------------------------------------------------

export function createRelationship(
  sim: Simulation, aId: Id, bId: Id, type: RelationshipType,
  opts: { dimensions?: Partial<RelationshipDimensions>; isPublic?: boolean; context?: string; since?: number } = {},
): Relationship {
  const [x, y] = relationshipKey(aId, bId);
  const a = sim.universe.people[x];
  const b = sim.universe.people[y];
  const compatibility = a && b ? compatibilityBetween(a, b) : 50;

  const rel: Relationship = {
    id: sim.nextId('rel'),
    saveId: sim.universe.meta.id,
    aId: x, bId: y,
    type,
    dimensions: freshDimensions({ compatibility, ...opts.dimensions }),
    isPublic: opts.isPublic ?? isFamily(type),
    exclusive: false,
    since: opts.since ?? sim.now,
    lastInteractionAt: sim.now,
    memories: [],
  };
  sim.universe.relationships[rel.id] = rel;

  if (opts.context) {
    rel.memories.push({
      id: sim.nextId('relmem'), at: sim.now, kind: 'met',
      summary: `You met ${opts.context}.`, impact: 1, decayDays: 0,
    });
  }
  sim.emit('rel.created', { relationshipId: rel.id, aId: x, bId: y, type });
  return rel;
}

export function applyDelta(dims: RelationshipDimensions, delta: Partial<RelationshipDimensions>): void {
  for (const [key, value] of Object.entries(delta) as [keyof RelationshipDimensions, number][]) {
    dims[key] = clamp(dims[key] + value, 0, 100);
  }
}

export function addMemory(
  sim: Simulation, rel: Relationship,
  spec: Omit<RelationshipMemory, 'id' | 'at'> & { at?: number },
): RelationshipMemory {
  const memory: RelationshipMemory = {
    ...spec,
    id: sim.nextId('relmem'),
    at: spec.at ?? sim.now,
  };
  rel.memories.push(memory);
  // Keep permanent memories and the most recent fading ones.
  if (rel.memories.length > 40) {
    const permanent = rel.memories.filter((m) => m.decayDays === 0);
    const fading = rel.memories.filter((m) => m.decayDays !== 0).slice(-25);
    rel.memories = [...permanent, ...fading].sort((a, b) => a.at - b.at);
  }
  return memory;
}

export interface DatePlan {
  activityId: string;
  locationId: string;
  budget: Money;
}

function resolveDate(sim: Simulation, relationshipId: Id, plan: DatePlan): void {
  const rel = sim.universe.relationships[relationshipId];
  if (!rel || rel.endedAt) return;
  const player = sim.universe.people[sim.universe.playerId];
  const other = sim.universe.people[otherParty(rel, sim.universe.playerId)];
  if (!player || !other) return;

  const accountId = player.primaryAccountId;
  let spent = 0;
  if (accountId && sim.ledger.availableFunds(accountId) >= plan.budget) {
    spent = plan.budget;
    sim.expense(accountId, spent, `Date — ${other.displayName}`, 'personal', { refType: 'relationship', refId: rel.id });
  }

  const rng = sim.rng('date', rel.id, sim.now);
  const readinessFactor = clamp(player.wellbeing.energy / 100 * 0.6 + (1 - player.wellbeing.stress / 100) * 0.4, 0.1, 1);
  const effortFactor = spent > 0 ? clamp(remap(spent, 0, 400_00, 0.5, 1.1), 0.5, 1.1) : 0.35;

  const { factors, score } = buildFactors([
    { label: 'How The Two Of You Get On', detail: `Compatibility is ${Math.round(rel.dimensions.compatibility)} out of 100.`, weight: 0.30, value: rel.dimensions.compatibility / 100 },
    { label: 'How Present You Were', detail: `You arrived tired at ${Math.round(player.wellbeing.energy)}% energy.`, weight: 0.26, value: readinessFactor },
    { label: 'Effort And Planning', detail: spent > 0 ? `You spent ${formatMoney(spent)} on the evening.` : 'You did not spend anything on it.', weight: 0.20, value: effortFactor },
    { label: 'Existing Warmth', detail: `Affection is ${Math.round(rel.dimensions.affection)} out of 100.`, weight: 0.24, value: rel.dimensions.affection / 100 },
  ]);

  const roll = rng.next();
  const probability = clamp(score * 1.1, 0.08, 0.95);
  const wentWell = roll < probability;

  applyDelta(rel.dimensions, {
    familiarity: wentWell ? 9 : 4,
    affection: wentWell ? 11 : -3,
    trust: wentWell ? 5 : -1,
    commitment: wentWell ? 4 : 0,
    conflict: wentWell ? -4 : 5,
  });
  rel.lastInteractionAt = sim.now;

  addMemory(sim, rel, {
    kind: 'date',
    summary: wentWell ? `A good evening together.${spent > 0 ? ` You spent ${formatMoney(spent)}.` : ''}` : 'The evening did not land.',
    impact: wentWell ? 7 : -4,
    decayDays: wentWell ? 400 : 250,
  });

  sim.audit({
    kind: 'rel.date_resolved', subjectType: 'relationship', subjectId: rel.id,
    question: 'How did that date go, and why?',
    summary: wentWell ? 'It went well.' : 'It did not go well.',
    factors, seed: `date|${rel.id}|${sim.now}`, roll, probability, score,
    outcome: wentWell ? 'good' : 'poor',
  });

  player.wellbeing.morale = clamp(player.wellbeing.morale + (wentWell ? 10 : -6), 0, 100);
  player.wellbeing.stress = clamp(player.wellbeing.stress + (wentWell ? -8 : 5), 0, 100);
  void plan.activityId;

  sim.notify({
    category: 'relationships',
    title: `Date with ${other.displayName}`,
    body: wentWell ? 'It went well.' : 'It was a difficult evening.',
    importance: 45, route: '/workspace/relationships',
  });
  sim.emit('rel.date_resolved', { relationshipId: rel.id, wentWell, spent });
}

function holdWedding(sim: Simulation, relationshipId: Id, budget: Money, guests: number): void {
  const rel = sim.universe.relationships[relationshipId];
  if (!rel || rel.endedAt) return;
  const player = sim.universe.people[sim.universe.playerId];
  const other = sim.universe.people[otherParty(rel, sim.universe.playerId)];
  if (!player || !other) return;

  const accountId = player.primaryAccountId;
  const remaining = Math.round(budget * 0.7);
  if (accountId && sim.ledger.availableFunds(accountId) >= remaining) {
    sim.expense(accountId, remaining, 'Wedding', 'personal', { refType: 'relationship', refId: rel.id });
  }

  rel.type = 'spouse';
  rel.isPublic = true;
  rel.exclusive = true;
  rel.since = sim.now;
  applyDelta(rel.dimensions, { commitment: 35, affection: 12, trust: 10 });
  addMemory(sim, rel, { kind: 'wedding', summary: `You got married, with ${guests} people there.`, impact: 22, decayDays: 0 });

  // Households merge.
  const household = player.householdId ? sim.universe.households[player.householdId] : undefined;
  if (household) {
    if (!household.memberIds.includes(other.id)) household.memberIds.push(other.id);
    if (!household.headIds.includes(other.id)) household.headIds.push(other.id);
    household.name = `${player.lastName} household`;
    household.historyNotes.push({ at: sim.now, note: `${player.displayName} and ${other.displayName} married.` });
    other.householdId = household.id;
    other.residenceId = player.residenceId;
  }

  sim.schedule({
    at: nextAnniversary(zonedParts(sim.now, sim.homeZone).month, zonedParts(sim.now, sim.homeZone).day, addDays(sim.now, 1, sim.homeZone), sim.homeZone),
    kind: 'rel.anniversary',
    label: 'Wedding Anniversary',
    category: 'family',
    payload: { relationshipId: rel.id },
    priority: 70,
    refType: 'relationship', refId: rel.id,
  });

  player.wellbeing.morale = clamp(player.wellbeing.morale + 22, 0, 100);
  player.reputation.publicFame = clamp(player.reputation.publicFame + (player.reputation.publicFame > 30 ? 2 : 0), 0, 100);

  sim.remember({
    category: 'family',
    title: `Married ${other.displayName}`,
    detail: `${guests} guests. ${formatMoney(budget)} spent.`,
    refs: [{ type: 'relationship', id: rel.id }, { type: 'person', id: other.id }],
    significance: 95, public: true, amount: budget,
  });
  sim.emit('rel.married', { relationshipId: rel.id, spouseId: other.id, budget, guests });
}

export function createChild(sim: Simulation, parentA: Person, parentB: Person, name: string | undefined, method: 'birth' | 'adoption'): Person {
  const rng = sim.rng('child', parentA.id, parentB.id, Object.keys(sim.universe.people).length);
  const firstName = name ?? rng.pick(['Adrian', 'Amara', 'Beatriz', 'Caleb', 'Delphine', 'Elias', 'Fiona', 'Gideon', 'Hana', 'Isla', 'Jonah', 'Kira', 'Leona', 'Micah', 'Nina', 'Oscar', 'Priya', 'Rowan', 'Sofia', 'Theo']);

  const child: Person = {
    id: sim.nextId('person'),
    saveId: sim.universe.meta.id,
    isPlayer: false,
    firstName,
    lastName: parentA.lastName,
    displayName: `${firstName} ${parentA.lastName}`,
    pronouns: 'they/them',
    birthInstant: sim.now,
    homeRegionId: parentA.currentLocationId,
    citizenshipId: parentA.citizenshipId,
    currentLocationId: parentA.currentLocationId,
    residenceId: parentA.residenceId,
    householdId: parentA.householdId,
    personality: {
      openness: clamp(Math.round((parentA.personality.openness + parentB.personality.openness) / 2 + rng.int(-18, 18)), 5, 95),
      conscientiousness: clamp(Math.round((parentA.personality.conscientiousness + parentB.personality.conscientiousness) / 2 + rng.int(-18, 18)), 5, 95),
      extraversion: clamp(Math.round((parentA.personality.extraversion + parentB.personality.extraversion) / 2 + rng.int(-18, 18)), 5, 95),
      agreeableness: clamp(Math.round((parentA.personality.agreeableness + parentB.personality.agreeableness) / 2 + rng.int(-18, 18)), 5, 95),
      emotionalStability: clamp(Math.round((parentA.personality.emotionalStability + parentB.personality.emotionalStability) / 2 + rng.int(-18, 18)), 5, 95),
      ambition: clamp(Math.round((parentA.personality.ambition + parentB.personality.ambition) / 2 + rng.int(-22, 22)), 5, 95),
      riskTolerance: clamp(Math.round((parentA.personality.riskTolerance + parentB.personality.riskTolerance) / 2 + rng.int(-22, 22)), 5, 95),
    },
    interests: [],
    goals: [],
    lifestyle: 'modest',
    background: method === 'adoption' ? 'Adopted' : 'Born into the family',
    attributes: {},
    traits: [],
    skills: {},
    wellbeing: { energy: 90, stress: 5, sleepDebt: 0, morale: 80, condition: 95, fitness: 40, travelFatigue: 0, nourishment: 90 },
    reputation: { publicFame: 0, audienceAppeal: 50, professionalReputation: 0, reliability: 50, prestige: 0, industryDemand: 0, controversy: 0 },
    careerTrack: 'none',
    representation: {},
    quote: 0,
    creditIds: [],
    nominationIds: [],
    creditScore: 0,
    tier: 'active',
    greenlightAuthority: 0,
    createdAt: sim.now,
  };
  sim.universe.people[child.id] = child;

  for (const parent of [parentA, parentB]) {
    const rel = createRelationship(sim, parent.id, child.id, 'parent', {
      dimensions: { familiarity: 100, affection: 92, trust: 88, respect: 60, compatibility: 78, commitment: 100, conflict: 0 },
      isPublic: true,
    });
    rel.reciprocalType = 'child';
  }

  const household = parentA.householdId ? sim.universe.households[parentA.householdId] : undefined;
  if (household) {
    household.memberIds.push(child.id);
    household.dependentIds.push(child.id);
    household.historyNotes.push({ at: sim.now, note: `${child.displayName} joined the household.` });
  }

  // Birthdays, childcare costs and the long climb to adulthood.
  sim.schedule({
    at: nextAnniversary(zonedParts(sim.now, sim.homeZone).month, zonedParts(sim.now, sim.homeZone).day, addDays(sim.now, 1, sim.homeZone), sim.homeZone),
    kind: 'rel.birthday',
    label: `${child.displayName}'s birthday`,
    category: 'family',
    payload: { personId: child.id },
    priority: 70,
    refType: 'person', refId: child.id,
  });

  sim.remember({
    category: 'family',
    title: method === 'adoption' ? `Adopted ${child.displayName}` : `${child.displayName} was born`,
    detail: `Child of ${parentA.displayName} and ${parentB.displayName}.`,
    refs: [{ type: 'person', id: child.id }],
    significance: 98, public: false,
  });
  sim.emit('rel.child_added', { childId: child.id, parentIds: [parentA.id, parentB.id], method });
  return child;
}

function celebrateBirthday(sim: Simulation, personId: Id): void {
  const person = sim.universe.people[personId];
  if (!person) return;
  const age = ageOn(person.birthInstant, sim.now, sim.homeZone);

  // Children grow into their own capabilities as they age.
  if (!person.isPlayer && age <= 22) {
    const rng = sim.rng('growth', person.id, age);
    for (const key of ['story_structure', 'public_speaking', 'fitness', 'cooking', 'driving']) {
      person.skills[key] = clamp((person.skills[key] ?? 0) + rng.float(1, 4), 0, 100);
    }
    if (age === 18) {
      person.careerTrack = 'civilian';
      person.tier = 'active';
      sim.notify({
        category: 'family', title: `${person.displayName} turned 18`,
        body: 'They are an adult now, with their own life to build.',
        importance: 70, route: '/workspace/family',
      });
    }
  }

  const player = sim.universe.people[sim.universe.playerId];
  if (player && personId !== player.id) {
    const rel = findRelationship(sim, player.id, personId);
    if (rel) {
      sim.requireDecision({
        urgency: 48, category: 'family',
        title: `${person.displayName} turns ${age} today`,
        detail: 'Marking it costs almost nothing and is remembered for a long time.',
        route: '/workspace/relationships',
        refType: 'person', refId: person.id,
      });
    }
  }

  sim.schedule({
    at: addYears(sim.now, 1, sim.homeZone),
    kind: 'rel.birthday',
    label: `${person.displayName}'s birthday`,
    category: 'family',
    payload: { personId: person.id },
    priority: 70,
    refType: 'person', refId: person.id,
  });
  sim.emit('rel.birthday', { personId: person.id, age });
}

/** Relationships fade when nothing happens in them. */
function driftRelationships(sim: Simulation): void {
  const player = sim.universe.people[sim.universe.playerId];
  if (!player) return;
  const decayMultiplier = systemModifier(player.traits, 'relationshipDecay');

  for (const rel of Object.values(sim.universe.relationships)) {
    if (rel.endedAt) continue;
    const weeksSince = (sim.now - rel.lastInteractionAt) / (7 * MS_DAY);
    if (weeksSince < 2) continue;
    if (isFamily(rel.type)) continue;

    // Somebody you live with does not become a stranger because you did not
    // make a point of it. Sharing a home is itself contact.
    const household = player.householdId ? sim.universe.households[player.householdId] : undefined;
    const livesWithYou = household !== undefined
      && !household.dissolvedAt
      && household.memberIds.includes(otherParty(rel, player.id));

    const rate = (isRomantic(rel.type) ? 1.5 : 1.0) * decayMultiplier * (livesWithYou ? 0.2 : 1);
    applyDelta(rel.dimensions, {
      affection: -0.6 * rate * Math.min(weeksSince, 8),
      commitment: isRomantic(rel.type) ? -0.5 * rate * Math.min(weeksSince, 8) : 0,
      familiarity: -0.2 * (livesWithYou ? 0.2 : 1) * Math.min(weeksSince, 6),
      // Friction fades. Without this, conflict only ever goes up, and a
      // relationship anybody has argued in enough times is permanently ruined
      // however well it goes afterwards.
      conflict: -1.1 * Math.min(weeksSince, 8),
    });

    // A romantic relationship that has been neglected long enough ends itself.
    // A marriage does not: it takes far longer to reach that point, and when
    // it gets there the player is told, rather than finding out later that the
    // game quietly divorced them.
    const married = rel.type === 'spouse';
    const floor = married ? 8 : 18;
    const patience = married ? 30 : 8;
    if (isRomantic(rel.type) && relationshipStrength(rel, sim.now) < floor && weeksSince > patience) {
      rel.endedAt = sim.now;
      rel.endReason = married ? 'The marriage ended' : 'Drifted apart';
      const other = sim.universe.people[otherParty(rel, player.id)];
      sim.notify({
        category: 'relationships',
        title: `Things ended with ${other?.displayName ?? 'someone'}`,
        body: 'You had not spoken properly in months.',
        importance: 65, route: '/workspace/relationships',
      });
      sim.emit('rel.ended', { relationshipId: rel.id, wasMarried: rel.type === 'spouse', personId: other?.id });
    }
  }
}

/** Splits jointly held value on divorce. Deliberately simple and even. */
function divideAssets(sim: Simulation, aId: Id, bId: Id): void {
  if (!bId) return;
  const accounts = sim.ledger.accountsOf(aId).filter((acct) => acct.balance > 0 && !['mortgage', 'auto_loan'].includes(acct.kind));
  for (const account of accounts) {
    const half = Math.floor(account.balance / 2);
    if (half <= 0) continue;
    const settlement = sim.nominalAccount('expense', 'Divorce settlement');
    sim.post({
      memo: 'Divorce settlement',
      category: 'personal',
      postings: [
        { accountId: account.id, amount: -half },
        { accountId: settlement.id, amount: half },
      ],
    });
  }
}

export function nameOf(sim: Simulation, personId: Id): string {
  return sim.universe.people[personId]?.displayName ?? 'someone';
}

/** Creates a household for a person, if they do not have one. */
export function ensureHousehold(sim: Simulation, person: Person): Household {
  if (person.householdId) {
    const existing = sim.universe.households[person.householdId];
    if (existing) return existing;
  }
  const household: Household = {
    id: sim.nextId('household'),
    saveId: sim.universe.meta.id,
    name: `${person.lastName} household`,
    memberIds: [person.id],
    dependentIds: [],
    headIds: [person.id],
    residenceId: person.residenceId,
    formedAt: sim.now,
    historyNotes: [{ at: sim.now, note: 'Household formed.' }],
  };
  sim.universe.households[household.id] = household;
  person.householdId = household.id;
  return household;
}

export const GIFT_CATEGORIES = ['watch', 'jewelry', 'clothing', 'art', 'accessory'] as const;

export function giftableAssets(sim: Simulation, ownerId: Id) {
  return Object.values(sim.universe.assets).filter(
    (a) => a.ownerId === ownerId && !a.soldAt && (GIFT_CATEGORIES as readonly string[]).includes(a.category),
  ).sort((a, b) => b.currentValue - a.currentValue);
}

void CATALOG;
