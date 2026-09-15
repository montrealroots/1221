/**
 * SLATE — the family business, and what it is allowed to do.
 *
 * Nine separate subjects — forming a company, registering for tax, opening a
 * bank account, signing with a guild, buying insurance, holding rights,
 * papering agreements, employing people, developing material — are one system,
 * and this is the seam that makes them one.
 *
 * The seam is a CAPABILITY. Every one of those nine is only interesting
 * because of a door it opens: VAT registration matters because a production
 * buys enormously and reclaims a fifth of it, an American subsidiary matters
 * because Global Rule One will not let you near an American performer without one,
 * and errors and omissions cover matters because no distributor takes delivery
 * without a certificate. So the company does not have a list of features. It
 * has a list of things it may and may not do, and each thing it may not do
 * names exactly what is standing in the way.
 *
 * That is the whole design. A screen shows the doors. Every shut door says
 * which single missing piece of paper shuts it. Nothing else needs inventing:
 * the drama is that a family with money and land and their own sound stages
 * still cannot cast an American until somebody files in Delaware.
 */

import type { Simulation } from '../core/simulation';
import type { Id, SaveUniverse } from '../domain/model';
import type { Money } from '../core/money';
import type {
  Company, CompanyForm, GuildId, Hold, Holding, Policy, PolicyKind, Post,
  Project, Provenance, Registration, RegistryId, RoleId, Signature,
} from '../domain/company';
import {
  FORM_BY_ID, GLOBAL_RULE_ONE, GUILD_BY_ID, POLICY_BY_ID, REGISTRY_BY_ID, ROLE_BY_ID,
} from '../content/incorporation';
import { ESTATE_CITY_ID, HOUSE, studioName } from '../content/estate';
import { addMonths, instantFromZoned, type Instant } from '../core/time';
import { estateCity } from '../content/estate';
import { GROUP } from '../content/sugar';

// ---------------------------------------------------------------------------
// Reading the world
// ---------------------------------------------------------------------------

const all = <T>(table: Record<Id, T> | undefined): T[] => Object.values(table ?? {});

/** The parent. There is exactly one, and it is Icelandic. */
export function parentCompany(universe: SaveUniverse): Company | undefined {
  return all(universe.companies).find((one) => one.trade === 'film' && !one.parentId && !one.dissolvedAt);
}

/** The American arm, where one has been formed. */
export function americanArm(universe: SaveUniverse): Company | undefined {
  return all(universe.companies).find((one) => one.trade === 'film' && one.jurisdiction === 'us' && !one.dissolvedAt);
}

/** Every company the family holds, parent first. */
/**
 * The film companies: the production company and any arm of it.
 *
 * Not every company in the save. The sugar group is in here too and has
 * nothing to do with making anything — it is where the money comes from, not
 * what it is spent on, and every capability, registry and guild question on
 * this page means the film side.
 */
export function companiesOf(universe: SaveUniverse): Company[] {
  return all(universe.companies)
    .filter((one) => !one.dissolvedAt && one.trade === 'film')
    .sort((a, b) => (a.parentId ? 1 : 0) - (b.parentId ? 1 : 0));
}

export const registrationsOf = (universe: SaveUniverse, companyId?: Id): Registration[] =>
  all(universe.registrations).filter((one) => !one.endedAt && (!companyId || one.companyId === companyId));

export const signaturesOf = (universe: SaveUniverse, companyId?: Id): Signature[] =>
  all(universe.signatures).filter((one) => !one.endedAt && (!companyId || one.companyId === companyId));

export const policiesOf = (universe: SaveUniverse, companyId?: Id): Policy[] =>
  all(universe.policies).filter((one) => !one.lapsedAt && (!companyId || one.companyId === companyId));

export const holdingsOf = (universe: SaveUniverse, companyId?: Id): Holding[] =>
  all(universe.holdings).filter((one) => !companyId || one.companyId === companyId);

export const postsOf = (universe: SaveUniverse, companyId?: Id): Post[] =>
  all(universe.posts).filter((one) => !companyId || one.companyId === companyId);

export const projectsOf = (universe: SaveUniverse, companyId?: Id): Project[] =>
  all(universe.projects).filter((one) => !one.shelvedAt && (!companyId || one.companyId === companyId));

/** Whether the family is on a given register anywhere. */
export const onRegister = (universe: SaveUniverse, registry: RegistryId): Registration | undefined =>
  registrationsOf(universe).find((one) => one.registry === registry);

/** Whether anybody in the group has signed with a guild. */
export const signedWith = (universe: SaveUniverse, guild: GuildId): Signature | undefined =>
  signaturesOf(universe).find((one) => one.guild === guild);

/** Whether the group carries a policy. */
export const carries = (universe: SaveUniverse, kind: PolicyKind): Policy | undefined =>
  policiesOf(universe).find((one) => one.kind === kind);

/** Whether a post exists and somebody is in it. */
export const filled = (universe: SaveUniverse, role: RoleId): Post | undefined =>
  postsOf(universe).find((one) => one.role === role && one.personId !== undefined);

/** What the company has in the bank, across every account it owns. */
export function companyCash(universe: SaveUniverse): Money {
  const ids = new Set(companiesOf(universe).map((one) => one.id));
  return Object.values(universe.accounts)
    .filter((account) => ids.has(account.ownerId) && !account.closedAt && account.kind === 'company_cash')
    .reduce((sum, account) => sum + account.balance, 0);
}

// ---------------------------------------------------------------------------
// What it may do, and what is in the way
// ---------------------------------------------------------------------------

export type CapabilityId =
  | 'trade' | 'reclaim_vat' | 'employ_here' | 'employ_americans'
  | 'own_material' | 'insure_a_shoot' | 'claim_rebate' | 'deliver' | 'greenlight';

/**
 * One thing standing between the company and a door.
 *
 * `fixKind` and `fixId` say what sort of thing would clear it, so a screen can
 * open onto the fix rather than describing it. The engine names the thing; it
 * does not know how a screen addresses one.
 */
export interface Blocker {
  need: string;
  how: string;
  fixKind?: 'registry' | 'guild' | 'policy' | 'arm' | 'role' | 'holding' | 'money';
  fixId?: string;
}

export interface Capability {
  id: CapabilityId;
  /** The world's word for it, Title Case. */
  label: string;
  /** What it lets the company do, in a sentence. */
  what: string;
  /** Why it is shut, where it is shut. */
  because: string;
  can: boolean;
  blockers: Blocker[];
}

const needRegistry = (universe: SaveUniverse, registry: RegistryId): Blocker | undefined => {
  if (onRegister(universe, registry)) return undefined;
  const facts = REGISTRY_BY_ID[registry];
  return { need: facts.label, how: `Register with ${facts.body}.`, fixKind: 'registry', fixId: registry };
};

const needGuild = (universe: SaveUniverse, guild: GuildId): Blocker | undefined => {
  if (signedWith(universe, guild)) return undefined;
  const facts = GUILD_BY_ID[guild];
  return { need: `${facts.label} Signature`, how: `Sign the ${facts.agreement} with ${facts.body}.`, fixKind: 'guild', fixId: guild };
};

const needPolicy = (universe: SaveUniverse, kind: PolicyKind): Blocker | undefined => {
  if (carries(universe, kind)) return undefined;
  const facts = POLICY_BY_ID[kind];
  return { need: facts.label, how: `Bind ${facts.label.toLowerCase()} cover.`, fixKind: 'policy', fixId: kind };
};

const needRole = (universe: SaveUniverse, role: RoleId): Blocker | undefined => {
  if (filled(universe, role)) return undefined;
  const facts = ROLE_BY_ID[role];
  return { need: facts.label, how: `Put somebody in as ${facts.said}.`, fixKind: 'role', fixId: role };
};

/** What a picture must have behind it before anybody will let one be made. */
export const GREENLIGHT_FLOOR: Money = 50_000_00;

/**
 * Every door, open or shut, in the order a company walks through them.
 *
 * Read from the world every time. Nothing here is stored, because a
 * capability is not a fact about the company — it is an answer about the
 * company, and the moment a registration lapses the answer changes without
 * anybody having to remember to change it.
 */
export function capabilitiesOf(sim: Simulation): Capability[] {
  const u = sim.universe;
  const arm = americanArm(u);
  const material = holdingsOf(u);
  const chainBreaks = material.filter((one) => !one.chainComplete);
  const cash = companyCash(u);

  const of = (
    id: CapabilityId, label: string, what: string, because: string,
    blockers: (Blocker | undefined)[],
  ): Capability => {
    const real = blockers.filter((one): one is Blocker => one !== undefined);
    return { id, label, what, because, can: real.length === 0, blockers: real };
  };

  return [
    of('trade', 'Exist At All',
      'Hold land, sign anything, and be a company instead of a family with an idea.',
      'A company that isn’t registered isn’t a company, and nothing else on this page can begin.',
      [needRegistry(u, 'is_companies')]),

    of('reclaim_vat', 'Reclaim The Tax',
      'Claim back the value added tax on everything the company buys, which for a production is a fifth of the spend.',
      'Without a VAT number the tax on every purchase is simply a cost.',
      [needRegistry(u, 'is_vat')]),

    of('employ_here', 'Employ Anybody',
      'Put an Icelandic cast or crew member on a payroll, withhold their tax and pay their pension.',
      'Nobody can be paid a wage by a company that isn’t registered to pay one.',
      [needRegistry(u, 'is_employer')]),

    of('employ_americans', 'Hire Americans',
      'Cast an American performer, or employ an American writer or director.',
      GLOBAL_RULE_ONE,
      [
        arm ? undefined : {
          need: 'An American Arm',
          how: 'Form a subsidiary in Delaware for the guilds to sign with.',
          fixKind: 'arm', fixId: 'us',
        },
        arm ? needRegistry(u, 'us_ein') : undefined,
        needGuild(u, 'sag_aftra'),
      ]),

    of('own_material', 'Have Something To Make',
      'Hold the rights to a story, so there’s something for all of this to be for.',
      'A production company with no material is an address and a bank account.',
      [material.length > 0 ? undefined : {
        need: 'Anything At All',
        how: 'Option or buy the rights to something.',
        fixKind: 'holding', fixId: '',
      }]),

    of('insure_a_shoot', 'Insure A Shoot',
      'Put a crew on a stage with cover for the people, the equipment and everybody else’s property.',
      'No location, no hire company and no financier lets a foot of film be shot uninsured.',
      [needPolicy(u, 'general_liability'), needPolicy(u, 'workers_comp'), needPolicy(u, 'production_package')]),

    of('claim_rebate', 'Claim The Reimbursement',
      'Apply for the Icelandic production reimbursement on everything spent in Iceland.',
      'The claim is audited, and an audit needs books somebody kept properly from the first day.',
      [needRegistry(u, 'is_companies'), needRegistry(u, 'is_vat'), needRole(u, 'accountant')]),

    of('deliver', 'Deliver A Picture',
      'Hand a finished film to a distributor and be paid for it.',
      'Delivery fails on paperwork far more often than on film, and errors and omissions cover is the paperwork it fails on.',
      [
        needPolicy(u, 'errors_omissions'),
        chainBreaks.length === 0 ? undefined : {
          need: 'A Clean Chain Of Title',
          how: `Close the gap on ${chainBreaks[0]!.title}.`,
          fixKind: 'holding', fixId: chainBreaks[0]!.id,
        },
      ]),

    of('greenlight', 'Greenlight Something',
      'Say yes to a picture and start spending real money on it.',
      'A picture needs material to be of, a head of production to run it, a payroll to put a crew on, cover over the floor and money behind it — all of it true at once, before anybody says yes rather than after.',
      [
        material.length > 0 ? undefined : { need: 'Material', how: 'Option or buy something first.', fixKind: 'holding', fixId: '' },
        needRole(u, 'production'),
        // A crew is put on a payroll from the first week of prep, so a company
        // that cannot employ anybody cannot start a picture. This used to be
        // listed two doors up and checked nowhere, which let a production hire
        // twenty-four people through a door marked shut.
        needRegistry(u, 'is_employer'),
        // And nobody lets a foot of film be shot uninsured. The production
        // package alone was the old requirement; the other two are the ones a
        // location and a hire company actually ask for.
        needPolicy(u, 'general_liability'),
        needPolicy(u, 'workers_comp'),
        needPolicy(u, 'production_package'),
        cash >= GREENLIGHT_FLOOR ? undefined : {
          need: 'Money In The Company',
          how: 'The company needs something behind it before it can commit to a picture.',
          fixKind: 'money', fixId: String(GREENLIGHT_FLOOR),
        },
      ]),
  ];
}

/** The one sentence a screen leads with. */
export function whereItStands(sim: Simulation): string {
  const doors = capabilitiesOf(sim);
  const open = doors.filter((one) => one.can);
  const shut = doors.filter((one) => !one.can);
  if (shut.length === 0) return 'Everything is in place. What happens next is a decision now, not a permission.';
  if (open.length === 0) return 'None of it is in place yet. The company exists on paper and can do nothing else.';
  return `This one can do ${open.length} of the ${doors.length} things a production company has to `
    + `be able to do. Next up is ${shut[0]!.label.toLowerCase()}.`;
}

// ---------------------------------------------------------------------------
// Building it at boot
// ---------------------------------------------------------------------------

/**
 * When the family formed the company.
 *
 * Before the lot, because you cannot build a sound stage through a company
 * that does not exist yet. The house went up in 2024 and they moved on at the
 * start of 2025, so the company is a January 2024 thing and the buildings are
 * what it did first.
 */
export const FOUNDED = { year: HOUSE.yearBuilt, month: 1, day: 8 } as const;

/** A registry number shaped like the real thing. Deterministic, not random. */
function numberFor(registry: RegistryId, seed: number): string {
  const digits = String(100_000 + (seed % 899_999));
  switch (registry) {
    // An Icelandic kennitala is ten digits, written with a dash.
    case 'is_companies': return `${digits.slice(0, 6)}-${String(1000 + (seed % 8999)).slice(0, 4)}`;
    case 'is_vat': return String(10_000 + (seed % 89_999));
    case 'is_employer': return `L-${digits}`;
    case 'us_state': return `${5_000_000 + (seed % 999_999)}`;
    case 'us_ein': return `${10 + (seed % 89)}-${digits.slice(0, 7)}`;
  }
}

/**
 * The company the family already has, on the first morning of a save.
 *
 * Not a blank. They formed it, they built through it and they have been paying
 * to keep it standing for two years — so it is registered, it is on the VAT
 * register, it has a bank account and it has whoever the player said runs it.
 *
 * And that is all. No American arm, no guild anywhere, no cover beyond the
 * buildings, no rights to anything and nothing on the slate. It is a real
 * company that has never made a thing, which is exactly the position this
 * whole game starts from.
 */
/**
 * The business the family was already in, put into the save before the one
 * this game is about.
 *
 * It exists as a real record rather than as a sentence because the production
 * company is funded out of it, and money coming from somewhere the player
 * cannot open is exactly what this game is not allowed to have. Whoever asks
 * where the money for an empty stage comes from gets an answer with a number
 * on it.
 *
 * It is a public limited company rather than a private one — an hf. rather
 * than an ehf. — because a group this size with foreign subsidiaries is, and
 * because the two forms are already modeled and the difference should mean
 * something.
 */
export function foundTheSugarGroup(sim: Simulation): Company {
  const u = sim.universe;
  const player = u.people[u.playerId]!;
  const zone = estateCity().timeZone;
  const foundedAt = instantFromZoned({ year: GROUP.since, month: 4, day: 1, hour: 9, minute: 0 }, zone);
  const group: Company = {
    id: sim.nextId('company'),
    saveId: u.meta.id,
    name: GROUP.name,
    legalName: GROUP.legalName,
    form: 'hf',
    trade: 'sugar',
    jurisdiction: 'is',
    ownerships: ownersOf(u, player.id),
    locationId: GROUP.locationId,
    remit: GROUP.remit,
    foundedAt,
  };
  u.companies[group.id] = group;
  return group;
}

/** The sugar group, if the save has one. */
export function theSugarGroup(sim: Simulation): Company | undefined {
  return Object.values(sim.universe.companies).find((c) => c.legalName === GROUP.legalName);
}

export function foundTheCompany(sim: Simulation): Company {
  const u = sim.universe;
  const player = u.people[u.playerId]!;
  const zone = estateCity().timeZone;
  const foundedAt = instantFromZoned({ ...FOUNDED, hour: 9, minute: 0 }, zone);
  const surname = player.lastName.trim();
  const form: CompanyForm = 'ehf';

  const company: Company = {
    id: sim.nextId('company'),
    saveId: u.meta.id,
    name: studioName(surname),
    legalName: `${studioName(surname)} ${FORM_BY_ID[form].suffix}`,
    form,
    trade: 'film',
    jurisdiction: 'is',
    ownerships: ownersOf(u, player.id),
    locationId: ESTATE_CITY_ID,
    remit: 'Television and Film, made on the family’s own land.',
    foundedAt,
  };
  u.companies[company.id] = company;

  // On the registers it has to be on to have built anything at all.
  let seed = 1;
  for (const registry of ['is_companies', 'is_vat'] as const) {
    const registration: Registration = {
      id: sim.nextId('reg'),
      saveId: u.meta.id,
      companyId: company.id,
      registry,
      number: numberFor(registry, foundedAt / 1000 + seed * 7919),
      since: foundedAt,
      nextDueAt: addMonths(u.now, REGISTRY_BY_ID[registry].filesEveryMonths, zone),
    };
    u.registrations[registration.id] = registration;
    seed += 1;
  }

  // Its own money, which is not the player's money.
  sim.openAccount({
    id: sim.nextId('account'),
    kind: 'company_cash',
    name: `${company.name} Operating`,
    ownerId: company.id,
    institution: 'Landsbankinn',
    openedAt: foundedAt,
    last4: '2041',
    balance: OPENING_BALANCE,
  });

  // The posts, and whoever the player said runs what.
  for (const role of ['principal', 'facility'] as const) {
    const holder = personRunning(u, role);
    const post: Post = {
      id: sim.nextId('post'),
      saveId: u.meta.id,
      companyId: company.id,
      role,
      monthlyCents: ROLE_BY_ID[role].monthlyCents,
      ...(holder ? { personId: holder, filledAt: foundedAt } : {}),
    };
    u.posts[post.id] = post;
  }

  return company;
}

/** What the company opens with. SLATE's own: two years of a family paying in. */
export const OPENING_BALANCE: Money = 180_000_00;

/** Who owns it. The parents built it, so the parents hold it. */
function ownersOf(universe: SaveUniverse, playerId: Id): Company['ownerships'] {
  const parents = (universe.people[playerId]?.relations ?? [])
    .filter((one) => one.kind === 'mother' || one.kind === 'father')
    .map((one) => one.toId);
  if (parents.length === 0) return [{ holderId: playerId, holderKind: 'person', percent: 100 }];
  const each = Math.floor(100 / parents.length);
  return parents.map((holderId, index) => ({
    holderId,
    holderKind: 'person' as const,
    percent: index === 0 ? 100 - each * (parents.length - 1) : each,
  }));
}

/**
 * Who the Your People step put in charge of what.
 *
 * The estate role a player chose on that page is not decoration: whoever runs
 * the company is the company's principal, and whoever runs the lot manages the
 * facility. A step that only wrote prose now staffs a business.
 */
function personRunning(universe: SaveUniverse, role: RoleId): Id | undefined {
  const wanted = role === 'principal' ? 'the company' : 'the lot';
  return Object.values(universe.people).find((one) => one.estateRole === wanted)?.id;
}

/** For the migration and the validator: the tables the company added. */
export const COMPANY_TABLES = [
  'companies', 'registrations', 'signatures', 'policies', 'holdings', 'posts', 'projects',
] as const;

export type { Instant };

// ---------------------------------------------------------------------------
// Opening a door
// ---------------------------------------------------------------------------

export interface Done {
  ok: boolean;
  id?: Id;
  /** Why not, in the world's words, for a screen to print as it is. */
  error?: string;
}

const refuse = (error: string): Done => ({ ok: false, error });

/** The account the company pays out of, where it has one. */
function purse(sim: Simulation, companyId: Id): { id: Id; balance: Money } | undefined {
  const account = Object.values(sim.universe.accounts)
    .find((one) => one.ownerId === companyId && one.kind === 'company_cash' && !one.closedAt);
  return account ? { id: account.id, balance: account.balance } : undefined;
}

/**
 * Money out of the company, or a reason it cannot go.
 *
 * Everything on this page costs, and all of it comes out of the same account.
 * A company that cannot pay a filing fee cannot file, which is a duller
 * obstacle than a dramatic one and is exactly how it works.
 */
function payFor(sim: Simulation, companyId: Id, amount: Money, purpose: string): Done {
  if (amount <= 0) return { ok: true };
  const account = purse(sim, companyId);
  if (!account) return refuse('The company has no account to pay from.');
  if (account.balance < amount) {
    return refuse(`That costs ${(amount / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} and the company hasn’t got it.`);
  }
  sim.expense(account.id, amount, purpose, 'company');
  return { ok: true };
}

export function registerCompanyCommands(sim: Simulation): void {
  /** Get on a register. */
  sim.onCommand<{ registry: RegistryId }, Done>('company.register', (payload, { sim: s }) => {
    const facts = REGISTRY_BY_ID[payload.registry];
    if (!facts) return refuse('There’s no such register.');
    if (onRegister(s.universe, payload.registry)) return refuse(`Already on ${facts.body}.`);

    // An American register wants an American company to put on it.
    const company = facts.jurisdiction === 'us' ? americanArm(s.universe) : parentCompany(s.universe);
    if (!company) {
      return refuse(facts.jurisdiction === 'us'
        ? 'There’s no American arm yet, and an American register wants an American company.'
        : 'There’s no company to register.');
    }
    const paid = payFor(s, company.id, facts.cost, `${facts.label}, ${facts.body}`);
    if (!paid.ok) return paid;

    const registration: Registration = {
      id: s.nextId('reg'),
      saveId: s.universe.meta.id,
      companyId: company.id,
      registry: payload.registry,
      number: numberFor(payload.registry, s.now / 1000 + Object.keys(s.universe.registrations).length * 7919),
      since: s.now,
      nextDueAt: addMonths(s.now, facts.filesEveryMonths, s.homeZone),
    };
    s.universe.registrations[registration.id] = registration;
    s.notify({
      category: 'personal',
      title: `${company.name} Is On ${facts.body}`,
      body: `${facts.label}, number ${registration.number}. ${facts.why}`,
      importance: 45,
    });
    return { ok: true, id: registration.id };
  });

  /** Form the American arm. */
  sim.onCommand<{ form?: CompanyForm }, Done>('company.form_arm', (payload, { sim: s }) => {
    const parent = parentCompany(s.universe);
    if (!parent) return refuse('There’s no parent company to hang an arm off.');
    if (americanArm(s.universe)) return refuse('The American arm already exists.');
    const form: CompanyForm = payload.form ?? 'llc';
    const facts = FORM_BY_ID[form];
    if (!facts || facts.jurisdiction !== 'us') return refuse('That isn’t an American form.');

    const paid = payFor(s, parent.id, facts.formationCost, `Forming ${parent.name} ${facts.suffix}`);
    if (!paid.ok) return paid;

    const arm: Company = {
      id: s.nextId('company'),
      saveId: s.universe.meta.id,
      name: parent.name,
      legalName: `${parent.name} ${facts.suffix}`,
      // An arm of the film company is in the film business, whatever it is
      // formed for. It inherits the trade rather than choosing one.
      trade: parent.trade,
      form,
      jurisdiction: 'us',
      parentId: parent.id,
      formedFor: 'Somewhere for the American guilds to sign, so this family can hire Americans. '
        + 'Filed in Delaware, addressed in Los Angeles, and nobody works at either.',
      ownerships: [{ holderId: parent.id, holderKind: 'company', percent: 100 }],
      locationId: US_ARM_CITY,
      remit: parent.remit,
      foundedAt: s.now,
    };
    s.universe.companies[arm.id] = arm;
    s.notify({
      category: 'personal',
      title: `${arm.legalName} Exists`,
      body: 'An American company, wholly owned by the Icelandic one. It has no staff, no money and no '
        + 'address anybody works at — and it’s the only thing that can sign with an American guild.',
      importance: 55,
    });
    return { ok: true, id: arm.id };
  });

  /** Sign with a guild. */
  sim.onCommand<{ guild: GuildId }, Done>('company.sign', (payload, { sim: s }) => {
    const facts = GUILD_BY_ID[payload.guild];
    if (!facts) return refuse('There’s no such guild.');
    if (!facts.signable) {
      return refuse(`${facts.body} isn’t signed with. Employ people here and the collective agreement covers them.`);
    }
    if (signedWith(s.universe, payload.guild)) return refuse(`Already signed with ${facts.body}.`);

    const company = facts.jurisdiction === 'us' ? americanArm(s.universe) : parentCompany(s.universe);
    if (!company) return refuse('An American guild signs with an American company, and there isn’t one yet.');

    const parent = parentCompany(s.universe);
    const paid = payFor(s, parent ? parent.id : company.id, facts.depositCents, `${facts.body} deposit`);
    if (!paid.ok) return paid;

    const signature: Signature = {
      id: s.nextId('sign'),
      saveId: s.universe.meta.id,
      companyId: company.id,
      guild: payload.guild,
      agreement: facts.agreement,
      since: s.now,
      depositCents: facts.depositCents,
    };
    s.universe.signatures[signature.id] = signature;
    s.notify({
      category: 'personal',
      title: `Signed With ${facts.body}`,
      body: `${facts.agreement}. ${facts.binds}`,
      importance: 60,
    });
    return { ok: true, id: signature.id };
  });

  /** Bind a policy. */
  sim.onCommand<{ policy: PolicyKind }, Done>('company.insure', (payload, { sim: s }) => {
    const facts = POLICY_BY_ID[payload.policy];
    if (!facts) return refuse('There’s no such cover.');
    if (carries(s.universe, payload.policy)) return refuse(`${facts.label} is already bound.`);
    const parent = parentCompany(s.universe);
    if (!parent) return refuse('There’s no company to insure.');

    // The one policy that cannot be bought, only earned.
    if (payload.policy === 'errors_omissions') {
      const broken = holdingsOf(s.universe).filter((one) => !one.chainComplete);
      if (holdingsOf(s.universe).length === 0) {
        return refuse('An underwriter reads the chain of title before writing this, and there’s nothing to read.');
      }
      if (broken.length > 0) {
        return refuse(`The underwriter read the chain of title on ${broken[0]!.title} and stopped. ${broken[0]!.chainGap ?? 'There’s a gap in it.'}`);
      }
    }

    const paid = payFor(s, parent.id, facts.premiumCents, `${facts.label} premium`);
    if (!paid.ok) return paid;

    const policy: Policy = {
      id: s.nextId('policy'),
      saveId: s.universe.meta.id,
      companyId: parent.id,
      kind: payload.policy,
      insurer: INSURER,
      limitCents: facts.limitCents,
      premiumCents: facts.premiumCents,
      boundAt: s.now,
      renewsAt: addMonths(s.now, 12, s.homeZone),
    };
    s.universe.policies[policy.id] = policy;
    return { ok: true, id: policy.id };
  });

  /** Take rights to something. */
  sim.onCommand<{
    title: string; provenance?: Provenance; hold?: Hold;
    optionFeeCents?: Money; purchasePriceCents?: Money; months?: number; chainGap?: string;
  }, Done>('company.option', (payload, { sim: s }) => {
    const parent = parentCompany(s.universe);
    if (!parent) return refuse('There’s no company to hold anything.');
    const title = String(payload.title ?? '').replace(/\s+/g, ' ').trim().slice(0, LONGEST_TITLE);
    if (!title) return refuse('It needs a title.');
    if (holdingsOf(s.universe).some((one) => one.title.toLowerCase() === title.toLowerCase())) {
      return refuse('The company already holds that one.');
    }

    const hold: Hold = payload.hold ?? 'option';
    const fee = Math.max(0, Math.round(payload.optionFeeCents ?? DEFAULT_OPTION_FEE));
    const paid = payFor(s, parent.id, hold === 'option' ? fee : Math.max(fee, Math.round(payload.purchasePriceCents ?? fee)), `Rights to ${title}`);
    if (!paid.ok) return paid;

    const holding: Holding = {
      id: s.nextId('hold'),
      saveId: s.universe.meta.id,
      companyId: parent.id,
      title,
      provenance: payload.provenance ?? 'original',
      hold,
      acquiredAt: s.now,
      chainComplete: !payload.chainGap,
      ...(payload.chainGap ? { chainGap: payload.chainGap } : {}),
      ...(hold === 'option' ? { expiresAt: addMonths(s.now, Math.max(1, Math.round(payload.months ?? 18)), s.homeZone), optionFeeCents: fee } : {}),
      ...(payload.purchasePriceCents ? { purchasePriceCents: Math.round(payload.purchasePriceCents) } : {}),
    };
    s.universe.holdings[holding.id] = holding;
    return { ok: true, id: holding.id };
  });

  /**
   * Put somebody in a post.
   *
   * Somebody, not nobody. A post with an empty chair is exactly as useful as
   * no post at all — which the first draft of this did not think, so it
   * reported a hire, created an empty post and left every door that wanted
   * the role still shut, with nothing on screen to explain why.
   *
   * And the only people this save has are the family, which is the whole
   * constraint: six posts, three relatives, and whoever you put in one is not
   * doing the other thing they were doing.
   */
  sim.onCommand<{ role: RoleId; personId: Id }, Done>('company.fill_post', (payload, { sim: s }) => {
    const facts = ROLE_BY_ID[payload.role];
    if (!facts) return refuse('There’s no such post.');
    const parent = parentCompany(s.universe);
    if (!parent) return refuse('There’s no company to work for.');
    if (filled(s.universe, payload.role)) return refuse(`Somebody is already ${facts.said}.`);

    const person = payload.personId ? s.universe.people[payload.personId] : undefined;
    if (!person) {
      return refuse(payload.personId
        ? 'You don’t know anybody by that name.'
        : `The post of ${facts.said} needs somebody in it. An empty chair runs nothing.`);
    }

    const existing = postsOf(s.universe, parent.id).find((one) => one.role === payload.role);
    const post: Post = existing ?? {
      id: s.nextId('post'),
      saveId: s.universe.meta.id,
      companyId: parent.id,
      role: payload.role,
      monthlyCents: facts.monthlyCents,
    };
    post.filledAt = s.now;
    post.personId = person.id;
    s.universe.posts[post.id] = post;
    s.notify({
      category: 'personal',
      title: `${person.firstName} Is ${facts.label}`,
      body: `${facts.what} It costs the company ${(facts.monthlyCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} a month, every month, whether anything is shooting or not.`,
      importance: 50,
    });
    return { ok: true, id: post.id };
  });

  /** Put something on the slate. */
  sim.onCommand<{ title: string; medium?: Project['medium']; holdingId?: Id }, Done>(
    'company.develop', (payload, { sim: s }) => {
      const parent = parentCompany(s.universe);
      if (!parent) return refuse('There’s no company to develop anything.');
      const title = String(payload.title ?? '').replace(/\s+/g, ' ').trim().slice(0, LONGEST_TITLE);
      if (!title) return refuse('It needs a title.');
      if (payload.holdingId && !s.universe.holdings[payload.holdingId]) {
        return refuse('The company doesn’t hold those rights.');
      }
      if (projectsOf(s.universe).some((one) => one.title.toLowerCase() === title.toLowerCase())) {
        return refuse('That one is already on the slate.');
      }

      const holding = payload.holdingId ? s.universe.holdings[payload.holdingId] : undefined;
      const project: Project = {
        id: s.nextId('project'),
        saveId: s.universe.meta.id,
        companyId: parent.id,
        title,
        medium: payload.medium ?? 'film',
        stage: holding ? 'optioned' : 'idea',
        startedAt: s.now,
        spentCents: 0,
        delivered: [],
        ...(payload.holdingId ? { holdingId: payload.holdingId } : {}),
      };
      s.universe.projects[project.id] = project;
      return { ok: true, id: project.id };
    },
  );
}

/**
 * Where the American arm actually is.
 *
 * Not where it is filed. A production subsidiary is incorporated in Delaware
 * because that is where the paperwork is understood by everybody who will read
 * it, and then it does all of its business somewhere else — which for this one
 * is Los Angeles, because that is where the guilds, the agencies and the
 * lawyers are. The company is a Delaware company with a Los Angeles address,
 * which is the ordinary shape of the thing and not a contradiction.
 */
export const US_ARM_CITY = 'us-ca-losangeles';

/** Who writes the cover. One name, so a screen has something to print. */
export const INSURER = 'Sjóvá';

/** What an option costs when nobody has said. SLATE's own. */
export const DEFAULT_OPTION_FEE: Money = 5_000_00;

/** What a title may run to before it stops being a title. */
export const LONGEST_TITLE = 80;
