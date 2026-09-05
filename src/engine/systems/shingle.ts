/**
 * SLATE — the company.
 *
 * The player founds one production company and runs it for the whole game.
 * Every decision the game asks about finally resolves to something this
 * company did: what it optioned, what it greenlit, what it paid, who it hired
 * and what it put out.
 *
 * The strike is what makes it interesting. There is nobody else commissioning,
 * so everybody will work for you and every buyer needs you — and every rate
 * you set becomes the rate, every failure is the industry's only failure, and
 * there is nobody else to blame for what does not get made.
 *
 * Overhead is the clock. It is charged every month whether anything is
 * shooting or not, and a company that cannot pay it stops being a company.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Company, Id } from '../domain/model';
import type { Money } from '../core/money';
import { formatMoney } from '../core/money';
import { clamp } from '../core/rng';
import { addDays } from '../core/time';
import { titleCaseLabel } from '../core/text';
import { SHINGLE_BY_ID, REMIT_BY_ID } from '../content/shingle';
import { FOUNDER_ATTRIBUTES, HIGHER_IS_WORSE } from '../content/founder';
import { SYSTEM_HIGHER_IS_WORSE } from '../domain/attributes';
import { MONOPOLY, OPENING_BRIEF, OPENING_LINE, STRIKE_IS_FICTION } from '../content/strike';

/** The company the player runs, if they have opened one yet. */
export function playerCompany(sim: Simulation): Company | undefined {
  const id = sim.universe.playerCompanyId;
  return id ? sim.universe.companies[id] : undefined;
}

/** The company, or a refusal. Used by every command that needs one. */
export function requireCompany(sim: Simulation): Company {
  const company = playerCompany(sim);
  if (!company) throw new CommandError('You have not opened a company yet.');
  if (company.dissolvedAt) throw new CommandError(`${company.name} is closed.`);
  return company;
}

/**
 * What the founder is worth on one axis, traits included.
 *
 * The producer's instrument, not the actor's. Anybody without one reads at
 * zero rather than at some default, because a person with no producing
 * experience is not an average producer.
 */
export function founderScore(sim: Simulation, attributeId: string, personId?: Id): number {
  const person = sim.universe.people[personId ?? sim.universe.playerId];
  if (!person?.founder) return 0;
  const base = person.founder[attributeId] ?? 0;
  let value = base;
  for (const traitId of person.founderTraits ?? []) {
    const mod = FOUNDER_TRAIT_MODS[traitId]?.[attributeId];
    if (mod) value += mod;
  }
  // The prodigy holds every trait there is. For anybody else each one is paid
  // for somewhere; for them it is not, so nothing drags the sheet off the
  // ceiling it started on.
  const floor = person.prodigy ? Math.min(base, 100) : 0;
  return clamp(value, floor, 100);
}

// Built once from the content so the hot path is not filtering an array.
import { FOUNDER_TRAITS } from '../content/founder';
const FOUNDER_TRAIT_MODS: Readonly<Record<string, Readonly<Record<string, number>>>> =
  Object.fromEntries(FOUNDER_TRAITS.map((t) => [t.id, t.attributeMods ?? {}]));

/** A system multiplier from the founder's traits, multiplied together. */
export function founderModifier(sim: Simulation, key: string, personId?: Id): number {
  const person = sim.universe.people[personId ?? sim.universe.playerId];
  const worseWhenHigher = SYSTEM_HIGHER_IS_WORSE.has(key) || HIGHER_IS_WORSE.has(key);
  let out = 1;
  for (const traitId of person?.founderTraits ?? []) {
    const mod = FOUNDER_TRAITS.find((t) => t.id === traitId)?.systemMods?.[key];
    if (mod === undefined) continue;
    // Same rule as the attribute floor: a trait never costs the prodigy.
    if (person?.prodigy && (worseWhenHigher ? mod > 1 : mod < 1)) continue;
    out *= mod;
  }
  return out;
}

/**
 * How many projects the company can carry before the work suffers.
 *
 * The shape sets the floor and the founder's delegation raises it. A hands-on
 * producer with a studio still cannot personally be on four sets at once.
 */
export function capacityOf(sim: Simulation, company: Company): number {
  const shape = SHINGLE_BY_ID[company.shingle];
  const base = shape?.capacity ?? company.capacity;
  const delegation = founderScore(sim, 'delegation') / 100;
  return Math.max(1, Math.round(base * (0.7 + delegation * 0.6) * founderModifier(sim, 'projectCapacity')));
}

export function registerShingle(sim: Simulation): void {
  /**
   * Opening the doors.
   *
   * Done once, at the start, and it is the only company the player will run.
   * The money comes out of their own account, so a founder who spends
   * everything on premises has nothing left to option anything with — which is
   * a real way to lose before you have started.
   */
  sim.onCommand<
    { name: string; shingle: string; remit: string; strategy?: string; structure?: Company['structure']; capital?: Money },
    { companyId: Id; overhead: Money; capacity: number; spent: Money; capitalised: Money }
  >(
    'co.found',
    (p, { sim: s }) => {
      if (s.universe.playerCompanyId) throw new CommandError('You already have a company.');
      const shape = SHINGLE_BY_ID[p.shingle];
      if (!shape) throw new CommandError('There is no such kind of company.');
      const remit = REMIT_BY_ID[p.remit];
      if (!remit) throw new CommandError('There is no such remit.');
      const name = p.name.trim();
      if (name.length < 2) throw new CommandError('The company needs a name.');

      const player = s.player;
      const account = player.primaryAccountId;
      if (!account) throw new CommandError('You need an account before you can capitalise a company.');
      const balance = s.universe.accounts[account]?.balance ?? 0;
      if (balance < shape.setup) {
        throw new CommandError(
          `Opening ${shape.name.toLowerCase()} costs ${formatMoney(shape.setup)} and you have ${formatMoney(balance)}.`,
        );
      }

      const companyId = s.nextId('company');
      const cashAccount = s.openAccount({
        id: s.nextId('account'),
        kind: 'company_cash',
        name: `${name} — Operating`,
        ownerId: companyId,
        institution: 'Northbank',
        openedAt: s.now,
        last4: String(1000 + (s.counter('company_account') % 9000)),
        balance: 0,
      });

      // What goes in as working capital is a decision, not a sweep. A founder
      // who puts everything they own into the company has no rent money, and
      // the game should let them do that on purpose rather than by default.
      const asked = p.capital ?? Math.max(0, balance - shape.setup);
      const working = clamp(Math.round(asked), 0, Math.max(0, balance - shape.setup));

      s.expense(account, shape.setup, `${name} — opening the doors`, 'business');
      if (working > 0) {
        s.transfer(account, cashAccount.id, working, `Capitalising ${name}`, 'business');
      }

      const company: Company = {
        id: companyId,
        saveId: s.universe.meta.id,
        name,
        legalName: `${name} ${p.structure === 'llc' ? 'LLC' : p.structure === 'c_corp' ? 'Inc.' : 'Ltd.'}`,
        structure: p.structure ?? 'llc',
        kind: shape.id === 'studio' ? 'studio' : 'production',
        ownerships: [{ holderId: player.id, holderKind: 'person', percent: 1 }],
        founderId: player.id,
        headquartersLocationId: player.currentLocationId,
        shingle: shape.id,
        remit: remit.id,
        strategy: p.strategy?.trim() || remit.what,
        cashAccountId: cashAccount.id,
        overhead: shape.overhead,
        capacity: shape.capacity,
        reputation: Math.round(20 + (player.founder?.['reputation_money'] ?? 0) * 0.3),
        standingWithTalent: Math.round(20 + (player.founder?.['reputation_craft'] ?? 0) * 0.4),
        greenlightCeiling: 0,
        valuation: shape.setup,
        foundedAt: s.now,
        registeredIn: player.currentLocationId,
      };
      s.universe.companies[companyId] = company;
      s.universe.playerCompanyId = companyId;

      // Overhead starts immediately and does not stop.
      s.schedule({
        at: addDays(s.now, 30, s.homeZone),
        kind: 'co.overhead',
        label: `${name} — Overhead`,
        category: 'system',
        payload: { companyId },
        priority: 12,
        refType: 'company', refId: companyId,
        recurrence: { unit: 'month', interval: 1 },
      });

      s.remember({
        category: 'career',
        title: `Opened ${name}`,
        detail: `${shape.name}. ${remit.name}. ${formatMoney(shape.setup)} to open the doors and ${formatMoney(shape.overhead)} a month to keep them open. The only production company trading.`,
        refs: [{ type: 'person', id: player.id }, { type: 'company', id: companyId }],
        significance: 95, public: true,
      });
      s.audit({
        kind: 'co.founded', subjectType: 'company', subjectId: companyId,
        question: 'What did opening the company cost me?',
        summary: `${formatMoney(shape.setup)} to open, ${formatMoney(shape.overhead)} a month to run, ${capacityOf(s, company)} projects at a time.`,
        factors: [
          { label: 'The Shape', detail: `${shape.name}. ${shape.what}`, weight: 0.5, contribution: 0.5, knowable: true },
          { label: 'What It Cannot Do', detail: shape.cannot, weight: 0.3, contribution: 0, knowable: true },
          { label: 'The Remit', detail: `${remit.name}. ${remit.what}`, weight: 0.2, contribution: 0.2, knowable: true },
        ],
        outcome: 'open',
      });
      s.emit('co.founded', { companyId, shingle: shape.id, remit: remit.id });
      return { companyId, overhead: shape.overhead, capacity: capacityOf(s, company), spent: shape.setup, capitalised: working };
    },
  );

  /** Overhead, every month, whether anything is shooting or not. */
  sim.onSchedule('co.overhead', (item) => {
    const company = sim.universe.companies[item.payload.companyId as Id];
    if (!company || company.dissolvedAt) return;
    const due = company.overhead;
    const balance = sim.universe.accounts[company.cashAccountId]?.balance ?? 0;

    if (balance >= due) {
      sim.expense(company.cashAccountId, due, `${company.name} — monthly overhead`, 'business');
      return;
    }

    // It could not be paid. This is how a production company actually dies:
    // not a disaster, a month where the rent was not there.
    sim.notify({
      category: 'career',
      title: `${company.name} Could Not Pay Its Overhead`,
      body: `${formatMoney(due)} was due and there is ${formatMoney(balance)} in the account. Put money in, cut the overhead, or the company closes.`,
      importance: 96,
      route: '/workspace/company',
      refType: 'company', refId: company.id,
    });
    sim.requireDecision({
      urgency: 96, category: 'career',
      title: `${company.name} Cannot Make Payroll`,
      detail: `${formatMoney(due)} of overhead is due and the account holds ${formatMoney(balance)}. A company that misses this twice is finished.`,
      route: '/workspace/company',
      refType: 'company', refId: company.id,
    });
    sim.emit('co.overhead_missed', { companyId: company.id, due, balance });
  });

  /**
   * Changing shape.
   *
   * Growing costs the difference and takes a month to be true. Shrinking is
   * free, immediate and costs standing, because everybody can see you did it.
   */
  sim.onCommand<{ shingle: string }, { from: string; to: string; cost: Money }>(
    'co.change_shape',
    (p, { sim: s }) => {
      const company = requireCompany(s);
      const next = SHINGLE_BY_ID[p.shingle];
      if (!next) throw new CommandError('There is no such kind of company.');
      const current = SHINGLE_BY_ID[company.shingle];
      if (!current) throw new CommandError('This company is in a shape the game does not know.');
      if (next.id === current.id) throw new CommandError(`${company.name} is already ${next.name.toLowerCase()}.`);

      const growing = next.setup > current.setup;
      const cost = growing ? next.setup - current.setup : 0;
      if (growing) {
        const balance = s.universe.accounts[company.cashAccountId]?.balance ?? 0;
        if (balance < cost) throw new CommandError(`That costs ${formatMoney(cost)} and the company has ${formatMoney(balance)}.`);
        s.expense(company.cashAccountId, cost, `${company.name} — ${next.name.toLowerCase()}`, 'business');
      } else {
        // Contracting is public and it is read as failure whatever the reason.
        company.reputation = clamp(company.reputation - 8, 0, 100);
        company.standingWithTalent = clamp(company.standingWithTalent - 5, 0, 100);
      }

      const from = current.name;
      company.shingle = next.id;
      company.overhead = next.overhead;
      company.capacity = next.capacity;
      company.kind = next.id === 'studio' ? 'studio' : 'production';

      s.remember({
        category: 'career',
        title: growing ? `${company.name} Grew Into ${next.name}` : `${company.name} Cut Back To ${next.name}`,
        detail: growing
          ? `${formatMoney(cost)} to do it. Overhead is now ${formatMoney(next.overhead)} a month.`
          : `Overhead down to ${formatMoney(next.overhead)} a month. Everybody noticed.`,
        refs: [{ type: 'company', id: company.id }],
        significance: 60, public: true,
      });
      s.emit('co.reshaped', { companyId: company.id, from: current.id, to: next.id, cost });
      return { from, to: next.name, cost };
    },
  );

  /**
   * Setting a rate.
   *
   * With nobody else hiring, whatever the player pays the first writer becomes
   * what a writer is worth. It is the most consequential number in the game
   * and it is set casually, which is the point.
   */
  sim.onCommand<{ craft: string; rate: Money }, { craft: string; rate: Money; note: string }>(
    'co.set_rate',
    (p, { sim: s }) => {
      const company = requireCompany(s);
      if (p.rate < 0) throw new CommandError('A rate cannot be negative.');
      const previous = s.universe.industry.ratesSet[p.craft];
      s.universe.industry.ratesSet[p.craft] = Math.round(p.rate);

      const craft = titleCaseLabel(p.craft.replace(/_/g, ' '));
      const note = previous === undefined
        ? `${craft} is now worth ${formatMoney(p.rate)}, because you said so and there is nobody to argue.`
        : p.rate < previous
          ? `You cut ${craft.toLowerCase()} from ${formatMoney(previous)} to ${formatMoney(p.rate)}. Every one of them knows by Friday.`
          : `You raised ${craft.toLowerCase()} to ${formatMoney(p.rate)}. That is the number everybody will quote back at you.`;

      // Generosity buys standing with the people who work for you and costs
      // the company money it will feel later. Meanness does the reverse.
      if (previous !== undefined && previous > 0) {
        const swing = clamp(((p.rate - previous) / previous) * 40, -25, 25);
        company.standingWithTalent = clamp(company.standingWithTalent + swing, 0, 100);
      }

      s.remember({
        category: 'career',
        title: `Set The Rate For ${craft}`,
        detail: `${formatMoney(p.rate)}. ${MONOPOLY.ratesAreWatched ? 'With no other company hiring, this is now the going rate.' : ''}`,
        refs: [{ type: 'company', id: company.id }],
        significance: 55, public: true,
      });
      s.emit('co.rate_set', { companyId: company.id, craft: p.craft, rate: p.rate, previous });
      return { craft, rate: Math.round(p.rate), note };
    },
  );

  /** Reading the morning brief. Shown once. */
  sim.onCommand<Record<string, never>, { brief: readonly string[]; line: string; disclaimer: string }>(
    'co.read_brief',
    (_p, { sim: s }) => {
      s.universe.industry.briefed = true;
      return { brief: OPENING_BRIEF, line: OPENING_LINE, disclaimer: STRIKE_IS_FICTION };
    },
  );
}

/** For the screen: the company as it stands. */
export function companyView(sim: Simulation) {
  const company = playerCompany(sim);
  if (!company) return undefined;
  const shape = SHINGLE_BY_ID[company.shingle];
  const remit = REMIT_BY_ID[company.remit];
  const cash = sim.universe.accounts[company.cashAccountId]?.balance ?? 0;
  return {
    company,
    shape,
    remit,
    cash,
    capacity: capacityOf(sim, company),
    /** How many months the company can pay its overhead with what it has. */
    monthsOfRunway: company.overhead > 0 ? Math.floor(cash / company.overhead) : Infinity,
    instrument: FOUNDER_ATTRIBUTES.map((attribute) => ({
      ...attribute,
      value: founderScore(sim, attribute.id),
    })),
  };
}

