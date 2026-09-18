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
import type { Account } from '../core/ledger';
import { formatMoney, type Money } from '../core/money';
import type {
  Company, CompanyForm, GuildId, Hold, Holding, Policy, PolicyKind, Post, PostRole,
  Project, Provenance, Registration, RegistryId, RoleId, Signature,
} from '../domain/company';
import {
  FORM_BY_ID, GLOBAL_RULE_ONE, GUILD_BY_ID, POLICY_BY_ID, REGISTRY_BY_ID, ROLE_BY_ID,
  WILL_TAKE_A_POST,
} from '../content/incorporation';
import { ESTATE_CITY_ID, HOUSE, studioName } from '../content/estate';
import { bondFor, standingWord } from './standing';
import { MS_DAY, addMonths, formatDate, instantFromZoned, type Instant } from '../core/time';
import { estateCity } from '../content/estate';
import {
  BOARD_SEATS, GROUP, GROUP_OPENING_BALANCE, GROUP_REGISTRIES, GROUP_ROLES, GROUP_ROLE_BY_ID,
} from '../content/sugar';

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

/**
 * What the company holds the rights to, now.
 *
 * `expiresAt` is the date an option's term runs to and it was read by nothing.
 * An option whose date went by a decade ago stayed in this list, went on opening
 * `own_material`, `deliver` and `greenlight`, and `company.develop` would still
 * stamp a brand-new project `optioned` off it — which is why the ledger entry
 * called "an option you forgot to exercise" named a mistake this build did not
 * let a player make.
 *
 * It is read by `runTheClock`, which stamps `lapsedAt` when a term runs out, and
 * this filters on that. Stamped rather than derived on the way past, for the
 * reason `Policy.lapsedAt` is: a clock with no argument cannot be given one
 * without changing every caller, and an optional `now` would have made this a
 * guard that trips for the one caller that remembers to pass it. A lapse is also
 * a dated event a screen can name, which a silent absence is not.
 *
 * The way to beat the clock is the greenlight, which exercises the option —
 * buying the rights outright is what a producer does at the moment they commit.
 * So a picture in production can never lose its material, and an option nobody
 * greenlit runs out, which is the mistake the entry is actually about.
 */
export const holdingsOf = (universe: SaveUniverse, companyId?: Id): Holding[] =>
  all(universe.holdings).filter((one) => !one.lapsedAt && (!companyId || one.companyId === companyId));

export const postsOf = (universe: SaveUniverse, companyId?: Id): Post[] =>
  all(universe.posts).filter((one) => !companyId || one.companyId === companyId);

export const projectsOf = (universe: SaveUniverse, companyId?: Id): Project[] =>
  all(universe.projects).filter((one) => !one.shelvedAt && (!companyId || one.companyId === companyId));

/**
 * The film side's own ids, which is what "anywhere" means in the four below.
 *
 * It has to mean that. Every one of these four answers a question about whether
 * a door on the capability page is open, and the sugar group is not behind any
 * of those doors — it is on the company register and the VAT register and the
 * employer register, because it has traded since 1946 and pays three thousand
 * one hundred people, and none of that is standing that a film company can
 * borrow. Unscoped, `onRegister(u, 'is_employer')` finds the group's
 * registration and the production company's Employ People Here door opens for
 * nothing, which would be a gate that reports itself satisfied by a fact about
 * a different company in a different trade.
 */
const filmIds = (universe: SaveUniverse): Set<Id> =>
  new Set(companiesOf(universe).map((one) => one.id));

/** Whether the film side is on a given register anywhere. */
export const onRegister = (universe: SaveUniverse, registry: RegistryId): Registration | undefined => {
  const ours = filmIds(universe);
  return registrationsOf(universe).find((one) => one.registry === registry && ours.has(one.companyId));
};

/** Whether anybody on the film side has signed with a guild. */
export const signedWith = (universe: SaveUniverse, guild: GuildId): Signature | undefined => {
  const ours = filmIds(universe);
  return signaturesOf(universe).find((one) => one.guild === guild && ours.has(one.companyId));
};

/** Whether the film side carries a policy. */
export const carries = (universe: SaveUniverse, kind: PolicyKind): Policy | undefined => {
  const ours = filmIds(universe);
  return policiesOf(universe).find((one) => one.kind === kind && ours.has(one.companyId));
};

/** Whether a post exists on the film side and somebody is in it. */
export const filled = (universe: SaveUniverse, role: RoleId): Post | undefined => {
  const ours = filmIds(universe);
  return postsOf(universe).find((one) => one.role === role && one.personId !== undefined
    && ours.has(one.companyId));
};

/**
 * What a post is, whichever company it is at.
 *
 * Two role tables, one `Post` record, so the lookup has to try both. Written
 * once here rather than at each screen that prints a post, because the version
 * where each caller reaches into `ROLE_BY_ID` directly is the version that
 * throws the day somebody opens the sugar group's page.
 */
export interface PostFacts {
  label: string;
  said: string;
  what: string;
  without: string;
  monthlyCents: Money;
}

export const postFacts = (role: PostRole): PostFacts | undefined =>
  (ROLE_BY_ID as Record<string, PostFacts>)[role]
  ?? (GROUP_ROLE_BY_ID as Record<string, PostFacts>)[role];

/**
 * One company's own cash account.
 *
 * There are two now. The sugar group is opened with a fortnight of its payroll
 * in hand at boot, the production company with its two years of family money,
 * and until the group had an account at all a `find` on `kind === 'company_cash'`
 * could only return the one. It cannot any more, and the group is founded first,
 * so anything asking that way silently started reading the cane business — which
 * is the same defect the business instrument shipped once already, reading
 * `companies[0]` and watching an account the pictures company does not own.
 *
 * So the question takes a company. There is no answer to "the company account"
 * in a save with two companies in it.
 */
export function cashAccountFor(universe: SaveUniverse, companyId: Id | undefined): Account | undefined {
  if (!companyId) return undefined;
  return Object.values(universe.accounts)
    .find((one) => one.ownerId === companyId && one.kind === 'company_cash' && !one.closedAt);
}

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
 * Read from the world every time. None of it is stored, because a capability
 * is not a fact about the company — it is an answer about the company, and the
 * answer moves the moment the world does: put somebody in the head of
 * production post and `greenlight` names one fewer thing; spend the company
 * down past the floor and it names one more, with no flag anywhere to set.
 *
 * What moves it is what a player does, and only that. This used to say "the
 * moment a registration lapses the answer changes without anybody having to
 * remember to change it", which was a promise about a clock that does not
 * exist: `world/company.ts` schedules nothing. A registration never lapses, a
 * policy bound in 2026 is still bound in 2046, an option whose term ran out
 * ten years ago still opens `own_material`, and a post that is filled is
 * filled for good.
 *
 * So exactly two of these nine can ever shut again once they are open, and
 * neither shuts through anything ending. `greenlight` shuts when the company
 * falls under `GREENLIGHT_FLOOR`, which on a played career it does a great
 * deal: across five seeds and twenty-five years the money blocker is on that
 * door for between ten and fifteen weeks in a hundred. And `deliver` shuts
 * when a holding with a gap in its
 * chain of title is taken, because the gap is read every time rather than
 * remembered. The other seven are one-way. That is the honest shape of a
 * company with a first day and no subsequent ones, and the measurements
 * behind it are in `docs/ARREARS.md`.
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
        // The order is the point. An underwriter reads the chain of title
        // before writing this cover, so when there is nothing to read — or a
        // gap in what there is — the cover is not the thing in the way. The
        // material is, and naming the cover first put a button on the page
        // that could only ever be refused, in a panel whose whole promise is
        // that a shut door names the single thing keeping it shut. Pressing it
        // was the one way to walk this page and get stuck.
        material.length === 0 ? {
          need: 'Anything At All',
          how: 'Option or buy the rights to something. An underwriter reads the '
            + 'chain of title before writing the cover, and there’s nothing to read.',
          fixKind: 'holding', fixId: '',
        } : undefined,
        chainBreaks.length === 0 ? undefined : {
          need: 'A Clean Chain Of Title',
          how: `Close the gap on ${chainBreaks[0]!.title}.`,
          fixKind: 'holding', fixId: chainBreaks[0]!.id,
        },
        material.length > 0 && chainBreaks.length === 0
          ? needPolicy(u, 'errors_omissions')
          : undefined,
      ]),

    of('greenlight', 'Greenlight Something',
      'Say yes to a picture and start spending real money on it.',
      'A picture needs material to be of, a head of production to run it, a payroll to put a crew on, cover over the floor and money behind it — all of it true at once, before anybody says yes rather than after.',
      [
        material.length > 0 ? undefined : { need: 'Material', how: 'Option or buy something first.', fixKind: 'holding', fixId: '' },
        // A company that is off the register cannot commit to anything, because
        // there is no company to commit. This is what being struck off means, and
        // without it the strike-off was a shut chip on a screen and nothing else:
        // `trade` is the door the company register sits behind and nothing outside
        // this file has ever read it, so a company that had lost its registration
        // went on greenlighting pictures for another twenty-four years.
        needRegistry(u, 'is_companies'),
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
 * something. Public in form and not in ownership: every share is held by the
 * two parents, an Icelandic hf. is under no obligation to be listed, and the
 * form is what a group this size takes for the share capital, the board and the
 * audited accounts. `firmOwnership` in `ui/looks/business.tsx` is what stops
 * the form's own blurb claiming outside money that never came in.
 *
 * Everything below the company record is the part that was missing. The
 * production company was put on its registers, given its own account and given
 * its posts at boot; the group was given a name, a legal form and a cap table
 * and nothing else — so the only company in the save that actually employed
 * anybody had no standing to employ anybody, no account until something asked
 * for one, and nobody named as running it. It has all three now, on the same
 * shapes the film side uses, because a second set of tables for the same idea
 * is how two answers to one question get built.
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

  // The registers. Dated from the founding, because a company that has been
  // trading since 1946 did not register last Tuesday.
  let seed = 11;
  for (const registry of GROUP_REGISTRIES) {
    const registration: Registration = {
      id: sim.nextId('reg'),
      saveId: u.meta.id,
      companyId: group.id,
      registry,
      number: numberFor(registry, foundedAt / 1000 + seed * 7919),
      since: foundedAt,
      nextDueAt: addMonths(u.now, REGISTRY_BY_ID[registry].filesEveryMonths, zone),
    };
    u.registrations[registration.id] = registration;
    seed += 1;
  }

  // Its own money, opened here rather than on demand. `sugarAccount` still
  // opens one lazily so an older save gains it on load, but a save booted today
  // has the account before anything asks, which is the difference between a
  // company that has a bank and one that turns out to have had one all along.
  sim.openAccount({
    id: sim.nextId('account'),
    kind: 'company_cash',
    name: `${group.name} Operating`,
    ownerId: group.id,
    institution: 'Landsbankinn',
    openedAt: foundedAt,
    last4: '1946',
    balance: GROUP_OPENING_BALANCE,
  });

  // Who runs it. The two board seats are the parents', in the order the family
  // generator wrote them; the five salaried posts are filled by the group and
  // are not people this game needs records for, so they are named posts with
  // nobody in them rather than five invented biographies.
  const parents = group.ownerships.map((one) => one.holderId);
  for (const role of GROUP_ROLES) {
    const seat = BOARD_SEATS.indexOf(role.id as typeof BOARD_SEATS[number]);
    const holder = seat >= 0 ? parents[seat] : undefined;
    const post: Post = {
      id: sim.nextId('post'),
      saveId: u.meta.id,
      companyId: group.id,
      role: role.id,
      ...(holder ? { personId: holder, filledAt: foundedAt } : {}),
    };
    u.posts[post.id] = post;
  }

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

  // Every post the company has, and whoever the player said runs what.
  //
  // Two of these existed and four did not. A head of development, a head of
  // production, business affairs and an accountant were conjured by
  // `company.fill_post` at the moment somebody was put in one, which meant the
  // company's own staffing panel listed two seats and the four that decide
  // whether it can greenlight anything were not on it — a vacancy you cannot see
  // is not a decision, it is a thing you find out about from a shut door.
  //
  // They are rows now, empty, each carrying the sentence about what its absence
  // costs. Deliberately still empty: filling the head of production is how the
  // greenlight door opens and is the player's decision to make, so the roster is
  // complete and the choice is untouched. `filled()` asks for a post with
  // somebody in it, so nothing opens by a chair existing, and `fill_post`
  // already reuses an existing row rather than making a second one.
  for (const role of ['principal', 'facility', 'production', 'development', 'business_affairs', 'accountant'] as const) {
    const holder = personRunning(u, role);
    const post: Post = {
      id: sim.nextId('post'),
      saveId: u.meta.id,
      companyId: company.id,
      role,
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
  // Two roles, because the creation step asks about two things: who runs the
  // company and who runs the lot. Everything else is empty at boot and is the
  // player's to fill.
  //
  // This read `role === 'principal' ? 'the company' : 'the lot'`, which was
  // correct while exactly two posts existed and became a trapdoor the moment
  // four more did: every one of them came out as the lot manager, so the head of
  // production was already filled when the save opened and the greenlight door
  // was open before anybody decided anything. Fourteen tests caught it.
  const wanted = role === 'principal' ? 'the company' : role === 'facility' ? 'the lot' : undefined;
  if (!wanted) return undefined;
  return Object.values(universe.people).find((one) => one.estateRole === wanted)?.id;
}

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

/**
 * The seat somebody is in at one company, if they are in one.
 *
 * Scoped to a company, and it has to be. Both parents chair the sugar group and
 * one of them runs the production company, and those are not competing jobs — a
 * family that owns two businesses sits on both boards. Unscoped, this found the
 * mother's seat at the cane group and concluded she was unavailable to the film
 * company she is the principal of.
 *
 * So the rule is one seat per company, not one seat in the world.
 */
export function seatHeldBy(sim: Simulation, personId: Id, companyId?: Id): Post | undefined {
  const at = companyId ?? parentCompany(sim.universe)?.id;
  return Object.values(sim.universe.posts)
    .find((one) => one.personId === personId && one.companyId === at);
}

/**
 * Why whoever is in a seat would not give it up, or nothing if they would.
 *
 * The same question as taking one, asked the other way, and it reads the same
 * number for the same reason: this is a favor, and a favor is something you ask
 * somebody you have kept up with. The player always steps aside for anybody,
 * because nobody has to talk themselves into it.
 */
export function whyNotStepAside(sim: Simulation, personId: Id, role: RoleId): string | undefined {
  if (personId === sim.universe.playerId) return undefined;
  const person = sim.universe.people[personId];
  const facts = ROLE_BY_ID[role];
  if (!person || !facts) return undefined;
  const bond = bondFor(sim.universe, sim.universe.playerId, personId);
  if (!bond || bond.closeness < WILL_TAKE_A_POST) {
    return `${person.firstName} is ${facts.said} and won’t stand down for you. `
      + 'That’s the kind of thing you ask family you’re on better terms with.';
  }
  return undefined;
}

/**
 * Why somebody would not take a post, or nothing if they would.
 *
 * Exported and asked before the offer rather than only inside it, so a screen can
 * say what the answer will be instead of finding out by being refused. The
 * sentence is the one the refusal uses, because there is no second version of
 * this reasoning to disagree with the first.
 */
export function whyNotTakeIt(sim: Simulation, personId: Id, role: RoleId): string | undefined {
  const facts = ROLE_BY_ID[role];
  const person = sim.universe.people[personId];
  if (!facts || !person) return 'There’s nobody to ask.';
  const them = person.firstName;

  // Two people never need asking. You do not ask yourself to do a job, and the
  // principal is whoever the company answers to — the family does not seek its
  // own permission to own the thing it owns. Every other seat is a job somebody
  // agrees to do.
  if (personId === sim.universe.playerId) return undefined;
  if (role === 'principal') return undefined;

  const bond = bondFor(sim.universe, sim.universe.playerId, personId);
  if (!bond) {
    return `You don’t really know ${them}, and wanting to work for you is the first thing this asks.`;
  }
  if (bond.closeness < WILL_TAKE_A_POST) {
    return `${them} says no. You’re ${standingWord(bond.closeness).toLowerCase()} these days, `
      + 'and at that distance this is a favor, not a job.';
  }

  // And nobody is two people. A better seat is worth leaving the one they have;
  // a lesser one is not, and they say which they are keeping.
  const held = seatHeldBy(sim, personId);
  if (held && held.role !== role) {
    const there = postFacts(held.role);
    if (there && there.monthlyCents >= facts.monthlyCents) {
      return `${them} is already ${there.said}, which is the bigger job of the two. `
        + 'You’ll have to ask elsewhere for this one.';
    }
  }
  return undefined;
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
    return refuse(`That costs ${formatMoney(amount, { cents: false })} and the company hasn’t got it.`);
  }
  sim.expense(account.id, amount, purpose, 'company');
  return { ok: true };
}

/** What a thing costs against what the company holds, or nothing if it can. */
function whyNotAfford(sim: Simulation, companyId: Id | undefined, amount: Money): string | undefined {
  if (amount <= 0) return undefined;
  const account = companyId ? purse(sim, companyId) : undefined;
  if (!account) return 'The company has no account to pay from.';
  if (account.balance < amount) {
    return `That costs ${formatMoney(amount, { cents: false })} and the company hasn’t got it.`;
  }
  return undefined;
}

/**
 * Why the company cannot get on a register, or nothing if it can.
 *
 * Asked by the command and asked again by the screen, which is the whole reason
 * it is a function rather than a run of guards inside the handler. Every one of
 * these four things — a register, a guild, a policy, the American arm — used to
 * be reachable through exactly one control: a chip inside a shut capability
 * door, which is a fix-what-is-broken affordance being used as the only shop.
 * Three guilds, a register, two policies and a company form were never named by
 * any blocker, so forty-odd lines of authored content apiece could not be bought
 * at all. The pages that describe them can offer them now, and they ask this.
 */
export function whyNotRegister(sim: Simulation, registry: RegistryId): string | undefined {
  const facts = REGISTRY_BY_ID[registry];
  if (!facts) return 'There’s no such register.';
  if (onRegister(sim.universe, registry)) return `Already on ${facts.body}.`;
  const company = facts.jurisdiction === 'us' ? americanArm(sim.universe) : parentCompany(sim.universe);
  if (!company) {
    return facts.jurisdiction === 'us'
      ? 'There’s no American arm yet, and an American register wants an American company.'
      : 'There’s no company to register.';
  }
  return whyNotAfford(sim, company.id, facts.cost);
}

/** Why the company cannot sign with a guild, or nothing if it can. */
export function whyNotSign(sim: Simulation, guild: GuildId): string | undefined {
  const facts = GUILD_BY_ID[guild];
  if (!facts) return 'There’s no such guild.';
  if (!facts.signable) {
    return `${facts.body} isn’t signed with. Employ people here and the collective agreement covers them.`;
  }
  if (signedWith(sim.universe, guild)) return `Already signed with ${facts.body}.`;
  const company = facts.jurisdiction === 'us' ? americanArm(sim.universe) : parentCompany(sim.universe);
  if (!company) return 'An American guild signs with an American company, and there isn’t one yet.';
  const parent = parentCompany(sim.universe);
  return whyNotAfford(sim, parent ? parent.id : company.id, facts.depositCents);
}

/** Why the company cannot bind a policy, or nothing if it can. */
export function whyNotInsure(sim: Simulation, policy: PolicyKind): string | undefined {
  const facts = POLICY_BY_ID[policy];
  if (!facts) return 'There’s no such cover.';
  if (carries(sim.universe, policy)) return `${facts.label} is already bound.`;
  const parent = parentCompany(sim.universe);
  if (!parent) return 'There’s no company to insure.';
  // The one policy that cannot be bought, only earned.
  if (policy === 'errors_omissions') {
    const holdings = holdingsOf(sim.universe);
    if (holdings.length === 0) {
      return 'An underwriter reads the chain of title before writing this, and there’s nothing to read.';
    }
    const broken = holdings.filter((one) => !one.chainComplete);
    if (broken.length > 0) {
      return `The underwriter read the chain of title on ${broken[0]!.title} and stopped. `
        + `${broken[0]!.chainGap ?? 'There’s a gap in it.'}`;
    }
  }
  return whyNotAfford(sim, parent.id, facts.premiumCents);
}

export function registerCompanyCommands(sim: Simulation): void {
  /** Get on a register. */
  sim.onCommand<{ registry: RegistryId }, Done>('company.register', (payload, { sim: s }) => {
    const no = whyNotRegister(s, payload.registry);
    if (no) return refuse(no);
    const facts = REGISTRY_BY_ID[payload.registry]!;
    const company = (facts.jurisdiction === 'us' ? americanArm(s.universe) : parentCompany(s.universe))!;
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

    // Filing the form IS the Delaware registration, so the record is written
    // here rather than waited for. Before this, `us_state` was on the registry
    // table and unreachable by any route: `company.register` charges the
    // registrant, the arm is opened with no account of its own, and the refusal
    // a player got was 'The company has no account to pay from' — for a filing
    // the parent had already paid for on the line above. The Delaware branch of
    // `numberFor` had never once run.
    const filed: Registration = {
      id: s.nextId('reg'),
      saveId: s.universe.meta.id,
      companyId: arm.id,
      registry: 'us_state',
      number: numberFor('us_state', s.now / 1000 + Object.keys(s.universe.registrations).length * 7919),
      since: s.now,
      nextDueAt: addMonths(s.now, REGISTRY_BY_ID.us_state.filesEveryMonths, s.homeZone),
    };
    s.universe.registrations[filed.id] = filed;

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
    const no = whyNotSign(s, payload.guild);
    if (no) return refuse(no);
    const facts = GUILD_BY_ID[payload.guild]!;
    const company = (facts.jurisdiction === 'us' ? americanArm(s.universe) : parentCompany(s.universe))!;
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
    const no = whyNotInsure(s, payload.policy);
    if (no) return refuse(no);
    const facts = POLICY_BY_ID[payload.policy]!;
    const parent = parentCompany(s.universe)!;
    const paid = payFor(s, parent.id, facts.premiumCents, `${facts.label} premium`);
    if (!paid.ok) return paid;

    const policy: Policy = {
      id: s.nextId('policy'),
      saveId: s.universe.meta.id,
      companyId: parent.id,
      kind: payload.policy,
      insurer: INSURER,
      limitCents: facts.limitCents,
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
      ...(hold === 'option'
        ? { expiresAt: addMonths(s.now, Math.max(1, Math.round(payload.months ?? 18)), s.homeZone) }
        : {}),
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
   *
   * Which nobody had to agree to. This could not fail for any reason that was
   * about the person: it checked the role existed, that the seat was empty and
   * that the name was somebody the save had, and then it put them in the chair.
   * Three reasons to say no now, and every one of them is read off the world.
   *
   * **They barely know you.** No bond at all means somebody the player has never
   * had anything to do with — the sugar group's five executives are in
   * `universe.people` and every one of them could be made head of production.
   *
   * **You stopped keeping up with them.** `closeness` below `WILL_TAKE_A_POST`.
   * This is the one that costs something, because closeness is not a fact about
   * the save, it is a record of what the player did: keeping a plan warms it six,
   * missing one cools it ten, and it drifts toward 60 under one roof or 25 apart.
   * A save opens at 72 and 70 so the family says yes on the first morning; a
   * player who neglects them for years is asking a favor of somebody they
   * stopped seeing, and gets the answer that deserves.
   *
   * **They are already somewhere better.** Nobody can be two people, and this
   * did not think so: `post.personId = person.id` never emptied the seat they
   * already held, so one relative could hold all six posts at once and every
   * door behind them opened. They take the better seat and leave the lesser one,
   * and they decline a seat worth less than the one they are in — by
   * `monthlyCents`, which is the only ordering these roles have.
   *
   * All three are recoverable, on purpose. Warm the bond and ask again.
   */
  sim.onCommand<{ role: RoleId; personId: Id }, Done>('company.fill_post', (payload, { sim: s }) => {
    const facts = ROLE_BY_ID[payload.role];
    if (!facts) return refuse('There’s no such post.');
    const parent = parentCompany(s.universe);
    if (!parent) return refuse('There’s no company to work for.');
    // An occupied seat can be taken, if whoever is in it will step aside.
    //
    // It could not be, and that made the producer's fee unreachable: the fee goes
    // to the principal, a parent holds the principal from the first morning, and
    // "Somebody is already the principal" meant the player could never be the one
    // who gets paid for making the company's pictures. A mechanism nobody can
    // reach is the thing this whole cleanup exists to remove.
    //
    // Stepping aside is the same question as taking a seat, asked the other way,
    // and it reads the same number: somebody close to you does you the favor and
    // somebody you stopped seeing does not. So the chair the fee is attached to is
    // held by a relationship rather than by a rule.
    const sitting = filled(s.universe, payload.role);
    if (sitting && sitting.personId === payload.personId) {
      return refuse(`Somebody is already ${facts.said}.`);
    }
    if (sitting) {
      const no = whyNotStepAside(s, sitting.personId!, payload.role);
      if (no) return refuse(no);
    }

    const person = payload.personId ? s.universe.people[payload.personId] : undefined;
    if (!person) {
      return refuse(payload.personId
        ? 'You don’t know anybody by that name.'
        : `The post of ${facts.said} needs somebody in it. An empty chair runs nothing.`);
    }

    // Whether they say yes, and why not.
    const no = whyNotTakeIt(s, person.id, payload.role);
    if (no) return refuse(no);

    const existing = postsOf(s.universe, parent.id).find((one) => one.role === payload.role);
    const post: Post = existing ?? {
      id: s.nextId('post'),
      saveId: s.universe.meta.id,
      companyId: parent.id,
      role: payload.role,
    };
    // Nobody is two people. Taking this seat leaves the one they were in, and the
    // door behind it shuts — which is the trade the docstring above has always
    // claimed and this never made them pay.
    const held = seatHeldBy(s, person.id);
    if (held && held.id !== post.id) {
      delete held.personId;
      delete held.filledAt;
    }
    post.filledAt = s.now;
    post.personId = person.id;
    s.universe.posts[post.id] = post;
    s.notify({
      category: 'personal',
      title: `${person.firstName} Is ${facts.label}`,
      // What the post does, and what it unshuts. The sentence this replaces
      // said the company was charged `facts.monthlyCents` "a month, every
      // month, whether anything is shooting or not", which was the game
      // telling the player about a standing charge that does not exist:
      // `world/company.ts` schedules nothing and a filled post is never billed
      // at all. The rate still stands on the post's own page as what the job
      // is worth, which is a rate and not a promise.
      //
      // What stands in its place is `whereItStands`, which is the one sentence
      // about this company that is recomputed from the world every time it is
      // asked — so a hire that unshuts a door says so, and a hire that unshuts
      // nothing says that too.
      body: `${facts.what} ${whereItStands(s)}`,
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

      // The rights this is being made off, named or inferred from the title.
      //
      // Only `payload.holdingId` counted, and nothing passes it — so a company
      // that optioned "Hvítserkur" and then developed "Hvítserkur" produced a
      // project with no link to the option it was obviously for. Two effects,
      // both latent until the clock started running: the project sat in `idea`
      // rather than `optioned`, because `stage: holding ? 'optioned' : 'idea'`
      // was a branch nothing could reach; and the greenlight had no holding to
      // exercise, so a picture in production never secured its own rights and
      // the option ran out from under it.
      //
      // Matching on the title is what the player means. It is also the only
      // thing they gave: `company.option` takes a title and `company.develop`
      // takes a title, and the screens never showed an id to pass.
      const holding = payload.holdingId
        ? s.universe.holdings[payload.holdingId]
        : holdingsOf(s.universe, parent.id)
          .find((one) => one.title.toLowerCase() === title.toLowerCase());
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
        ...(holding ? { holdingId: holding.id } : {}),
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

// ---------------------------------------------------------------------------
// The clock nothing in the company had
// ---------------------------------------------------------------------------

export const RENEWALS_KIND = 'company.renewals';

/**
 * Exercising an option, which is what a greenlight is with the money attached.
 *
 * Called from `greenlight`. A producer who commits to a picture buys the rights
 * outright, and this is the moment they do it — so the hold becomes ownership and
 * the term stops mattering. It is also what makes the clock safe to run at all: a
 * picture in production can never lose its material halfway through, because
 * saying yes to it is the thing that secured the rights.
 *
 * It charges nothing, and that is deliberate rather than an oversight. What
 * exercising costs is the purchase price, which this build does not store and has
 * never stored — the docstring on `Holding` says so and says why. Inventing one
 * here would be a figure with no derivation behind it sitting in the middle of
 * every budget in the game. The option fee was paid when the option was taken;
 * what the clock charges a player who lets a term run out is that fee again, and
 * whatever the delay cost them.
 */
export function exerciseTheOption(sim: Simulation, holdingId: Id | undefined): boolean {
  if (!holdingId) return false;
  const holding = sim.universe.holdings[holdingId];
  if (!holding || holding.hold !== 'option' || holding.lapsedAt) return false;
  holding.hold = 'owned';
  delete holding.expiresAt;
  return true;
}

/** How long before a term runs out the company is told about it. */
const WARNED_AT_DAYS = 60;

/**
 * A month of things running out, and the company paying to keep the ones it wants.
 *
 * This is the piece `docs/UNBITTEN.md` called the one substantial thing on the
 * page nobody had managed to build, and the reason it failed twice is worth
 * keeping: both attempts tried to build a general lapsing engine, and every
 * design choice in the scaffolding moved the numbers it was supposed to measure.
 * So this is narrower than that on purpose. Two things end, both of them already
 * carried the date they end on, and both of the filters that hide them already
 * existed with no writer:
 *
 * **An option runs out.** `Holding.expiresAt` is eighteen months by default and
 * was read by nothing. Now the term runs and the rights go back, unless the
 * picture was greenlit, which exercises the option.
 *
 * **Cover has to be renewed.** `Policy.renewsAt` is twelve months out because
 * that is the term an underwriter writes, and `Policy.lapsedAt` was, in the words
 * of its own docstring, the purest example in the file of a guard no reachable
 * input could trip. The premium is charged again, out of the same content figure
 * `company.insure` charges the first time — so a year of cover is now what the
 * engine bills rather than only what the quote describes.
 *
 * Renewal is automatic while the company can pay, and that is the design decision
 * in here. The alternative was a button per policy per year, six of them, which
 * is not a decision a player makes — it is a chore that punishes forgetting to do
 * the obvious thing. Insurers bill you; you pay or you are uncovered. So the
 * consequence lands where consequences in this game belong, on the money: a
 * company that cannot find the premium loses the cover, and the `insure_a_shoot`,
 * `greenlight` and `deliver` doors shut until it can.
 *
 * What is deliberately not here: registrations and guild signatures. `endedAt`
 * filters both and has no writer either, and both are named in the same ledger
 * entry — but a registration lapsing shuts `trade`, which is the door everything
 * else hangs off, and what it should cost to keep a company on the register is a
 * question with an answer nobody has worked out yet. That is the next cut and it
 * should be specified before it is attempted, which is the lesson of the two
 * failures this one is the smaller version of.
 */
export function runTheClock(sim: Simulation): {
  lapsed: number; renewed: number; owed: number; uncovered: number;
  filed: number; struck: number;
} {
  const out = { lapsed: 0, renewed: 0, owed: 0, uncovered: 0, filed: 0, struck: 0 };
  const company = parentCompany(sim.universe);
  if (!company) return out;

  // Options first, because an option that has run out is not cover and is not a
  // bill — it is a thing the company no longer has, and it should say so before
  // anything else on the screen does.
  for (const holding of Object.values(sim.universe.holdings)) {
    if (holding.companyId !== company.id || holding.lapsedAt) continue;
    if (holding.hold !== 'option' || holding.expiresAt === undefined) continue;
    if (holding.expiresAt > sim.now) {
      const days = Math.round((holding.expiresAt - sim.now) / MS_DAY);
      if (days <= WARNED_AT_DAYS) {
        sim.notify({
          category: 'business',
          title: `The Option On ${holding.title} Is Running Out`,
          body: `${days} days left on the term. Greenlight it and the rights are bought outright; `
            + 'let the date go by and they go back, and optioning it again costs what it cost the '
            + 'first time.',
          importance: 65,
        });
      }
      continue;
    }
    holding.lapsedAt = holding.expiresAt;
    out.lapsed += 1;
    sim.notify({
      category: 'business',
      title: `The Option On ${holding.title} Has Run Out`,
      body: 'Nobody said yes to it inside the term, so the rights have gone back. '
        + `${whereItStands(sim)}`,
      importance: 75,
    });
  }

  // And the cover, which is a bill rather than a loss until it cannot be paid.
  for (const policy of Object.values(sim.universe.policies)) {
    if (policy.companyId !== company.id || policy.lapsedAt) continue;
    if (policy.renewsAt > sim.now) continue;
    const facts = POLICY_BY_ID[policy.kind];
    const paid = payFor(sim, company.id, facts.premiumCents, `${facts.label}: Renewal`);
    if (paid.ok) {
      policy.renewsAt = addMonths(policy.renewsAt, 12, sim.homeZone);
      delete policy.graceUntil;
      out.renewed += 1;
      continue;
    }

    // A month to find it. The company is settled to the cent every day by the
    // family, so a premium falling due on any day but the one the monthly wire
    // lands on finds a balance of nought — and taking the cover away for eight
    // thousand euros the sugar has a billion of would be an outcome nobody chose.
    if (policy.graceUntil === undefined) {
      policy.graceUntil = addMonths(policy.renewsAt, 1, sim.homeZone);
      out.owed += 1;
      sim.notify({
        category: 'business',
        title: `${facts.label} Is Due For Renewal`,
        body: `${formatMoney(facts.premiumCents, { cents: false })}, and the company hasn’t got it `
          + `today. The insurer will wait until ${formatDate(policy.graceUntil, sim.homeZone)}. `
          + `${facts.why}`,
        importance: 70,
      });
      continue;
    }
    if (sim.now < policy.graceUntil) continue;

    policy.lapsedAt = policy.graceUntil;
    out.uncovered += 1;
    sim.notify({
      category: 'business',
      title: `${facts.label} Has Lapsed`,
      body: `A month went by and the company never found `
        + `${formatMoney(facts.premiumCents, { cents: false })} for the renewal, so the cover has `
        + `gone. ${facts.why} ${whereItStands(sim)}`,
      importance: 85,
    });
  }

  // And the filings, which is the other half of the entry the last cut deferred.
  //
  // A registration carries `nextDueAt` and its registry carries `filesEveryMonths`.
  // Nothing read either: `Registration.endedAt` had no writer in the engine at all,
  // only a test setting it by hand to prove the filter worked.
  //
  // It was deferred on a real question — a registration lapsing shuts `trade`, the
  // door everything else in this build hangs from, and what it should cost to stay
  // on the register was unanswered. It is not money, and the first version of this
  // got that wrong in a way worth recording: it charged `REGISTRY_BY_ID[...].cost`
  // on every filing, which is the one-off fee for *getting on* the register, so a
  // company paid its formation fee again every year and the measurement came back
  // at EUR 3,120,000 over twenty-five years. A recurring charge built out of a
  // one-off figure is a number that looks researched and is not.
  //
  // What actually gets a company struck off is that nobody filed. In this build the
  // person who would have is the production accountant, whose chair is one of the
  // four that start empty — so the thing keeping the company on the register is the
  // same scarcity everything else runs into: six posts and three relatives.
  //
  // Only the annual company-register filing can fail. VAT files every two months
  // and the employer registration every month, and both are re-dated and nothing
  // else, because inventing a way for them to go wrong would be inventing the
  // mechanic. Twelve months of notice and a month of grace, which is a year and a
  // month to put somebody in a chair.
  for (const registration of Object.values(sim.universe.registrations)) {
    if (registration.companyId !== company.id || registration.endedAt) continue;
    if (registration.nextDueAt === undefined || registration.nextDueAt > sim.now) continue;
    const facts = REGISTRY_BY_ID[registration.registry];

    // Signed by whoever the company answers to. A director signs an annual return,
    // which is what the principal is, and it is the seat that is filled at boot —
    // so a company that has somebody answering for it stays on the register and one
    // that does not comes off it.
    //
    // The first version wanted the accountant, which read well and was wrong for the
    // build: it made a third seat mandatory when there are three relatives in the
    // whole save, and six tests went red on a scarcity invented by a lapsing clock
    // rather than by anything about lapsing. The principal costs nothing new and
    // couples two things that belong together — the chair that pays the producer's
    // fee is the chair that keeps the company alive.
    const keptBy = registration.registry === 'is_companies'
      ? filled(sim.universe, 'principal')
      : true;
    if (keptBy) {
      registration.nextDueAt = addMonths(registration.nextDueAt, facts.filesEveryMonths, sim.homeZone);
      delete registration.graceUntil;
      out.filed += 1;
      continue;
    }

    if (registration.graceUntil === undefined) {
      registration.graceUntil = addMonths(registration.nextDueAt, 1, sim.homeZone);
      out.owed += 1;
      sim.notify({
        category: 'business',
        title: `${facts.label} Is Due And Nobody Answers For The Company`,
        body: `${facts.body} wants the annual return and there’s nobody in the principal’s `
          + `chair to sign it. They’ll wait until ${formatDate(registration.graceUntil, sim.homeZone)}. `
          + `${facts.why}`,
        importance: 85,
      });
      continue;
    }
    if (sim.now < registration.graceUntil) continue;

    registration.endedAt = registration.graceUntil;
    out.struck += 1;
    sim.notify({
      category: 'business',
      title: `Struck Off ${facts.body}`,
      body: 'A year went by with nobody answering for the company and the return went unsigned, '
        + `so the company is off the register. ${whereItStands(sim)}`,
      importance: 95,
    });
  }
  return out;
}

export function registerTheClock(sim: Simulation): void {
  sim.onSchedule(RENEWALS_KIND, () => {
    runTheClock(sim);
    sim.schedule({
      at: addMonths(sim.now, 1, sim.homeZone),
      kind: RENEWALS_KIND,
      label: 'What The Company Has To Renew',
      // A sweep, not a commitment. `upcoming` shows the player everything that is
      // not `system`, described as what they have to be at, and nobody attends a
      // renewal — the notifications are how this reaches anybody.
      category: 'system',
      priority: 8,
    });
  });
  if (!sim.universe.scheduled.some((one) => one.kind === RENEWALS_KIND && one.status === 'pending')) {
    sim.schedule({
      at: addMonths(sim.now, 1, sim.homeZone),
      kind: RENEWALS_KIND,
      label: 'What The Company Has To Renew',
      // A sweep, not a commitment. `upcoming` shows the player everything that is
      // not `system`, described as what they have to be at, and nobody attends a
      // renewal — the notifications are how this reaches anybody.
      category: 'system',
      priority: 8,
    });
  }
}
