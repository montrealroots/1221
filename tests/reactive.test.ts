/**
 * The industry as something that happens with or without you.
 *
 * People remember how they were treated and act on it months later. Rivals
 * sign the person you were about to offer the part to. One controversial
 * casting runs through the decision centre, the picture, the studio, the
 * reviews, the opening and the rest of the cast.
 */

import { describe, expect, it } from 'vitest';
import { quickSave, validateUniverse } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Id, Person, Project, Role } from '@/engine/domain/model';
import {
  addControversy, audienceFatigue, castingCascade, controversyFactor, controversyReviewPenalty,
  dispositionOf, fatigueFactor, favour, grudgeWeight, heatSummary, liveGrudges, quoteMultiplierFor,
  slight, standingWith, willReadFor,
} from '@/engine/systems/reactive';
import { standingWith as studioStanding } from '@/engine/systems/studio-state';

const MS_DAY = 86_400_000;

function aWorld(seed: string): { sim: Simulation; run: <R>(k: string, p?: Record<string, unknown>) => R; try: <R>(k: string, p?: Record<string, unknown>) => { ok: boolean; error?: string; value?: R } } {
  const sim = quickSave({ wealth: 'inherited' }, seed);
  const run = <R>(kind: string, payload: Record<string, unknown> = {}): R => {
    const result = sim.execute<R>({ kind, payload });
    if (!result.ok) throw new Error(`${kind} refused: ${result.error}`);
    return result.value as R;
  };
  const attempt = <R>(kind: string, payload: Record<string, unknown> = {}) => sim.execute<R>({ kind, payload });
  sim.execute({ kind: 'sandbox.toggle', payload: { enabled: true } });
  run('sandbox.add_funds', { amount: 900_000_000_00 });
  return { sim, run, try: attempt };
}

const somebody = (sim: Simulation): Person => Object.values(sim.universe.people).find((p) => !p.isPlayer)!;

describe('what people privately think', () => {
  it('gives everybody an ego and a loyalty, made once and kept', () => {
    const { sim } = aWorld('disposition');
    const person = somebody(sim);
    const first = dispositionOf(sim, person);
    expect(first.ego).toBeGreaterThan(0);
    expect(first.ego).toBeLessThanOrEqual(100);
    expect(first.loyalty).toBeGreaterThan(0);
    expect(dispositionOf(sim, person)).toBe(first);
    expect(standingWith(sim, person)).toBeGreaterThan(20);
    // Nothing about it is shown as a number anywhere the player looks.
    expect(person.disposition).toBeDefined();
  });

  it('remembers a slight, weighs it by ego, and lets it fade', () => {
    const { sim } = aWorld('slight');
    const proud = somebody(sim);
    const humble = Object.values(sim.universe.people).find((p) => !p.isPlayer && p.id !== proud.id)!;
    dispositionOf(sim, proud).ego = 95;
    dispositionOf(sim, humble).ego = 15;
    const before = standingWith(sim, proud);
    slight(sim, proud, 'Offered a third of the quote.', 20);
    slight(sim, humble, 'Offered a third of the quote.', 20);
    expect(grudgeWeight(sim, proud)).toBeGreaterThan(grudgeWeight(sim, humble));
    expect(standingWith(sim, proud)).toBeLessThan(before);
    expect(liveGrudges(sim, proud)[0]!.reason).toMatch(/quote/);

    // And a favour is remembered too.
    const other = Object.values(sim.universe.people).find((p) => !p.isPlayer && p.id !== proud.id && p.id !== humble.id)!;
    const neutral = standingWith(sim, other);
    favour(sim, other, 'Paid above the quote and gave them the credit they asked for.', 20);
    expect(standingWith(sim, other)).toBeGreaterThan(neutral);
    // What they cost you follows what they think of you.
    expect(quoteMultiplierFor(sim, proud)).toBeGreaterThan(quoteMultiplierFor(sim, other));
  });

  it('acts on it later — a refusal, a price, or a story somebody tells', () => {
    const outcomes = new Set<string>();
    for (let i = 0; i < 8; i++) {
      const { sim } = aWorld(`acting-${i}`);
      const person = somebody(sim);
      person.reputation.publicFame = i % 2 === 0 ? 80 : 10;
      const quoteBefore = person.quote;
      slight(sim, person, 'A lowball, and then another one.', 40);
      slight(sim, person, 'Recast without a call.', 30);
      // Nobody does anything the same week.
      sim.advanceTo(sim.now + 5 * MS_DAY);
      expect(willReadFor(sim, person).ok).toBe(true);
      sim.advanceTo(sim.now + 120 * MS_DAY);
      const disposition = person.disposition!;
      if (disposition.refusingUntil) outcomes.add('refusal');
      if (person.quote > quoteBefore) outcomes.add('price');
      if (sim.universe.history.some((h) => /said something/.test(h.title))) outcomes.add('talk');
      expect(disposition.grudges.some((g) => g.actedOnAt)).toBe(true);
    }
    expect(outcomes.size, 'everybody did the same thing about it').toBeGreaterThan(1);
  });

  it('will not read for you while it is raw, and reads again once it has passed', () => {
    const { sim } = aWorld('refusal');
    const person = somebody(sim);
    person.reputation.publicFame = 5;
    const disposition = dispositionOf(sim, person);
    disposition.refusingUntil = sim.now + 30 * MS_DAY;
    expect(willReadFor(sim, person).ok).toBe(false);
    expect(willReadFor(sim, person).reason).toMatch(/not reading/i);
    sim.advanceTo(sim.now + 60 * MS_DAY);
    expect(willReadFor(sim, person).ok).toBe(true);
  });
});

describe('one controversial casting', () => {
  it('runs through the decision centre, the picture, the studio, the reviews and the opening', () => {
    const { sim, run } = aWorld('cascade');
    run('sandbox.max_attributes', {});
    const { companyId } = run<{ companyId: Id }>('co.found', { structure: 'c_corp', kind: 'production', name: 'Halyard Pictures', initialCapital: 200_000_000_00 });
    const { projectId } = run<{ projectId: Id }>('film.create_project', { format: 'feature', genres: ['thriller'], logline: 'A quiet town and a loud secret.', companyId });
    const project = sim.universe.projects[projectId] as Project;
    project.studioId = 'warner';
    const { roleId } = run<{ roleId: Id }>('cast.create_role', { projectId, characterName: 'The Fixer', billing: 'lead', description: 'The one everybody calls.' });
    const role = sim.universe.roles[roleId] as Role;

    const trouble = somebody(sim);
    trouble.reputation.controversy = 85;
    trouble.reputation.publicFame = 70;
    const bystander = Object.values(sim.universe.people).find((p) => !p.isPlayer && p.id !== trouble.id)!;
    bystander.reputation.publicFame = 70;
    dispositionOf(sim, bystander).ego = 80;
    project.castIds.push(bystander.id);

    const standingBefore = studioStanding(sim, 'studio', 'warner');
    castingCascade(sim, project, trouble, role);

    // 1. The picture is carrying it, with the reason on the record.
    expect(project.controversy).toBeGreaterThan(10);
    expect(heatSummary(project).log[0]!.note).toContain(trouble.displayName);
    // 2. It is a decision, with something to do about it.
    const decision = Object.values(sim.universe.decisions).find((d) => d.refId === projectId && !d.resolvedAt)!;
    expect(decision).toBeDefined();
    expect(decision.actions?.map((a) => a.commandKind)).toContain('pr.statement');
    // 3. The studio thinks less of you.
    expect(studioStanding(sim, 'studio', 'warner')).toBeLessThan(standingBefore);
    // 4. The people already in it noticed.
    expect(grudgeWeight(sim, bystander)).toBeGreaterThan(0);
    // 5. The reviews will be harder and the opening smaller.
    expect(controversyReviewPenalty(project)).toBeLessThan(0);
    expect(controversyFactor(project)).toBeLessThan(1);
    // 6. And there is a notification about it in plain words.
    expect(sim.universe.notifications.some((n) => /carrying heat/.test(n.title))).toBe(true);

    // Answering it costs money — the company's, since that is who is paying —
    // and can go either way; saying nothing is free.
    const payingAccount = sim.universe.companies[companyId]!.cashAccountId;
    const spent = sim.ledger.availableFunds(payingAccount);
    const statement = sim.execute<{ heat: number; cost: number }>({ kind: 'pr.statement', payload: { projectId } });
    expect(statement.ok, statement.error).toBe(true);
    expect(statement.value!.cost).toBeGreaterThan(0);
    expect(sim.ledger.availableFunds(payingAccount)).toBe(spent - statement.value!.cost);
    expect(Object.values(sim.universe.decisions).find((d) => d.refId === projectId)!.resolvedAt).toBeDefined();
    expect(validateUniverse(sim.universe).errors).toEqual([]);
  });

  it('leaves a quiet picture alone', () => {
    const project = { controversy: 0 } as Project;
    expect(controversyFactor(project)).toBe(1);
    expect(controversyReviewPenalty(project)).toBe(0);
    expect(heatSummary(project).note).toMatch(/Nothing attached/);
  });

  it('cools if nothing keeps it alight', () => {
    const { sim, run } = aWorld('cooling');
    const { companyId } = run<{ companyId: Id }>('co.found', { structure: 'llc', kind: 'production', name: 'Quiet Co', initialCapital: 20_000_000_00 });
    const { projectId } = run<{ projectId: Id }>('film.create_project', { format: 'feature', genres: ['drama'], logline: 'A slow year in one house.', companyId });
    const project = sim.universe.projects[projectId] as Project;
    addControversy(sim, project, 60, 'Something happened.');
    const before = project.controversy!;
    sim.advanceTo(sim.now + 200 * MS_DAY);
    expect(project.controversy!).toBeLessThan(before);
  });
});

describe('the world moves without you', () => {
  it('lets a rival sign somebody off your shortlist', () => {
    let lost = false;
    for (let i = 0; i < 6 && !lost; i++) {
      const { sim, run } = aWorld(`rival-${i}`);
      run('sandbox.max_attributes', {});
      const { companyId } = run<{ companyId: Id }>('co.found', { structure: 'c_corp', kind: 'production', name: 'Halyard', initialCapital: 200_000_000_00 });
      const { projectId } = run<{ projectId: Id }>('film.create_project', { format: 'feature', genres: ['drama'], logline: 'Two brothers and a boat.', companyId });
      const { roleId } = run<{ roleId: Id }>('cast.create_role', { projectId, characterName: 'The Elder', billing: 'lead', description: 'The one who stayed.' });
      run('cast.open_casting', { roleId, candidateCount: 8 });
      const role = sim.universe.roles[roleId] as Role;
      const wanted = Object.values(sim.universe.people).filter((p) => !p.isPlayer && p.careerTrack === 'actor').slice(0, 3);
      for (const person of wanted) person.reputation.industryDemand = 96;
      role.shortlistIds = wanted.map((p) => p.id);
      const before = role.shortlistIds.length;
      sim.advanceTo(sim.now + 120 * MS_DAY);
      const after = sim.universe.roles[roleId]?.shortlistIds?.length ?? 0;
      if (after < before || sim.universe.notifications.some((n) => /You lost /.test(n.title))) lost = true;
    }
    expect(lost, 'nobody was ever signed out from under the player in six tries').toBe(true);
  });
});

describe('what the audience has had enough of', () => {
  it('rises with volume, not with quality, and comes back down on its own', () => {
    const { sim, run } = aWorld('fatigue');
    const { companyId } = run<{ companyId: Id }>('co.found', { structure: 'llc', kind: 'production', name: 'Volume Co', initialCapital: 20_000_000_00 });
    expect(audienceFatigue(sim, ['western'])).toBe(0);
    // Twelve of the same thing inside eighteen months.
    for (let i = 0; i < 12; i++) {
      const { projectId } = run<{ projectId: Id }>('film.create_project', { format: 'feature', genres: ['western'], logline: `A rider comes to town, number ${i + 1}.`, companyId });
      const project = sim.universe.projects[projectId] as Project;
      project.releaseDate = sim.now - (i + 1) * 40 * MS_DAY;
    }
    const glut = audienceFatigue(sim, ['western']);
    expect(glut).toBeGreaterThan(50);
    expect(fatigueFactor(glut)).toBeLessThan(1);
    expect(fatigueFactor(glut)).toBeGreaterThan(0.7);
    // Another genre is untouched by it.
    expect(audienceFatigue(sim, ['horror'])).toBe(0);
    expect(fatigueFactor(0)).toBe(1);
    // And it recovers once those releases fall out of the window.
    sim.advanceTo(sim.now + 700 * MS_DAY);
    expect(audienceFatigue(sim, ['western'])).toBeLessThan(glut);
  });
});
