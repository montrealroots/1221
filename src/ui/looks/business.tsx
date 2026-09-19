/**
 * SLATE — the family business, opened.
 *
 * The Family Business page is a set of nouns: a company, an arm of it, a
 * register it is on, a guild it has signed with, a policy it carries, a right
 * it holds, a post somebody sits in, a thing on the slate. Every one of them
 * is a real record with a real body behind it, so every one of them opens onto
 * what it actually is, what it cost, what it binds the company to and what it
 * would break if it went away.
 *
 * Nothing here invents. The bodies are real, the mechanisms are real, and
 * where a figure is SLATE’s own rather than a legislated one the provenance
 * line at the foot of the level says so.
 */

import type { Simulation } from '@/engine';
import type {
  Company, GuildId, Holding, Policy, PolicyKind, Post, PostRole, Registration,
  RegistryId, Signature,
} from '@/engine/domain/company';
import {
  FORM_BY_ID, GLOBAL_RULE_ONE, GUILDS, GUILD_BY_ID, INCORPORATION_NOTE, POLICIES,
  POLICY_BY_ID, REBATE, REGISTRIES, REGISTRY_BY_ID, ROLES,
} from '@/engine/content/incorporation';
import {
  americanArm, capabilitiesOf, companiesOf, companyCash, holdingsOf, parentCompany,
  policiesOf, postFacts, postsOf, registrationsOf, signaturesOf, whereItStands,
  whyNotInsure, whyNotRegister, whyNotSign,
} from '@/engine/world/company';
import { GROUP_ROLES } from '@/engine/content/sugar';
import { useGame } from '@/app/game-context';
import { formatMoney } from '@/engine/core/money';
import { formatDate, formatRelative } from '@/engine/core/time';
import { Stat } from '@/ui/components/primitives';
import { defineLook, type Way } from './registry';
import { at } from './subject';
import { isAre, said, spokenList, toStart } from './words';

const moneyOf = (cents: number): string => formatMoney(cents, { cents: false });

/** Whoever is in a post, for a line that names them. */
const whoIs = (sim: Simulation, post: Post): string | undefined => {
  const person = post.personId ? sim.universe.people[post.personId] : undefined;
  return person ? person.displayName || person.firstName : undefined;
};

// ---------------------------------------------------------------------------
// The company
// ---------------------------------------------------------------------------

/**
 * What the legal form means for this company, rather than in general.
 *
 * `FormFacts.what` was written for somebody choosing a form, and the `hf.` entry
 * says what it says because that is true of the form: far more share capital, a
 * real board, audited accounts, "and the form a company takes when outside money
 * comes in at scale". Every share of the sugar group is held by two parents, and
 * this look printed that sentence one line above their names. An Icelandic hf. is
 * under no obligation to list, a 1946 cane group at this size takes the form for
 * the capital and the board and the audit, and the page was telling a player
 * about outside money that has never once come in.
 *
 * So the claim is cut, and only where it is false: a company whose whole cap
 * table is people, holding a form whose blurb makes the claim. Read off
 * `ownerships` rather than hardcoded against the sugar group, so it follows the
 * world — sell a share to somebody outside the family and the form’s own
 * sentence comes back by itself, which is the point of reading rather than
 * asserting. A private company’s blurb never makes the claim and is returned
 * untouched, because an ehf. is private by definition and has nothing to explain.
 */
const RAISING = /,? and the form a company takes when outside money comes in at scale\.?$/;

function firmOwnership(company: Company, form: { what: string }): string {
  if (!RAISING.test(form.what)) return form.what;
  const held = company.ownerships.reduce((sum, one) => sum + one.percent, 0);
  const allPeople = company.ownerships.every((one) => one.holderKind === 'person');
  if (held < 100 || !allPeople) return form.what;
  return `${form.what.replace(RAISING, '.')} Every share of it is held inside the family, `
    + 'and a company of this form is under no obligation to list — the share capital, the board '
    + 'and the audited accounts are the reasons to be one.';
}

defineLook<Company>('firm', {
  gone: 'That company was wound up, and whatever it held went somewhere else.',
  resolve: (sim, id) => (id ? sim.universe.companies[id] : parentCompany(sim.universe)),
  seeds: (sim) => companiesOf(sim.universe).map((one) => one.id),
  look: (company, { sim }) => {
    const form = FORM_BY_ID[company.form];
    const isParent = !company.parentId;
    const doors = isParent ? capabilitiesOf(sim) : [];
    const open = doors.filter((one) => one.can);
    const arm = americanArm(sim.universe);
    const owners = company.ownerships
      .map((one) => sim.universe.people[one.holderId]?.firstName ?? sim.universe.companies[one.holderId]?.name)
      .filter((name): name is string => name !== undefined);

    const ways: Way[] = [];
    if (isParent) {
      for (const door of doors) {
        ways.push({
          to: at('door', door.id),
          label: door.label,
          detail: door.can
            ? `It can, and here’s what made that true`
            : `It can’t — ${spokenList(door.blockers.map((one) => one.need.toLowerCase()))}`,
        });
      }
      if (arm) {
        ways.push({
          to: at('firm', arm.id),
          label: arm.legalName,
          detail: 'The American arm, and the only thing here a guild will sign with',
        });
      }
      for (const holding of holdingsOf(sim.universe, company.id)) {
        ways.push({
          to: at('holding', holding.id),
          label: holding.title,
          detail: holding.chainComplete
            ? `${holding.hold === 'option' ? 'Optioned' : 'Owned'}, and the paper behind it’s clean`
            : 'The paper behind it’s broken, and that stops any delivery',
        });
      }
      // The slate used to open onto each picture. The drill-down behind a picture
      // went with the production system, so there is nothing to open onto yet.
      ways.push({
        to: at('rebate'),
        label: REBATE.label,
        detail: `${Math.round(REBATE.share * 100)}% of what a production spends here, back from the state`,
      });
    } else {
      ways.push({
        to: at('firm', company.parentId!),
        label: sim.universe.companies[company.parentId!]?.legalName ?? 'The Parent',
        detail: 'Who owns this one, and everything else the family holds',
      });
    }

    return {
      name: company.legalName,
      kind: isParent ? 'The Family Business' : 'An Arm Of It',
      parent: isParent ? at('estate') : at('firm', company.parentId!),
      summary: isParent
        ? whereItStands(sim)
        : `${company.formedFor ?? 'An arm of the Icelandic company.'} It has no staff and no money of its own.`,
      body: (
        <>
          <p className="small">
            {firmOwnership(company, form)}{' '}
            {isParent
              ? `It was formed on ${formatDate(company.foundedAt, sim.homeZone)}, before the stages went up, `
                + 'because you can’t build a sound stage through a company that doesn’t exist yet.'
              : `It was formed on ${formatDate(company.foundedAt, sim.homeZone)}, and it exists for one reason.`}
          </p>
          <p className="small">
            {owners.length > 0
              ? `${toStart(spokenList(owners))} ${isAre(owners.length)} behind it. `
              : ''}
            {company.remit}
          </p>
          {isParent && <p className="xs dim">{INCORPORATION_NOTE}</p>}
          <div className="grid grid-3">
            <Stat label="Form" value={form.suffix} note={form.label} />
            <Stat
              label="Registered In"
              value={company.jurisdiction === 'is' ? 'Iceland' : 'The United States'}
              note={company.jurisdiction === 'is' ? 'Where the family lives' : 'Where the guilds are'}
            />
            {isParent
              ? <Stat label="Doors Open" value={`${open.length}/${doors.length}`} note="Of what a production company must do" />
              : <Stat label="Owned By" value="The Parent" note="Wholly. That’s what makes it useful" />}
          </div>
        </>
      ),
      ways,
      provenance: 'The forms, the bodies and the order of it are real. Every figure is SLATE’s own.',
    };
  },
});

// ---------------------------------------------------------------------------
// One door
// ---------------------------------------------------------------------------

interface Door { id: string }

defineLook<Door>('door', {
  gone: 'That isn’t one of the things a company has to be able to do.',
  resolve: (sim, id) => (capabilitiesOf(sim).some((one) => one.id === id) ? { id } : undefined),
  seeds: (sim) => capabilitiesOf(sim).map((one) => one.id),
  look: ({ id }, { sim }) => {
    const door = capabilitiesOf(sim).find((one) => one.id === id)!;
    const company = parentCompany(sim.universe);

    const ways: Way[] = [];
    for (const blocker of door.blockers) {
      if (blocker.fixKind === 'registry') {
        ways.push({
          to: at('register', blocker.fixId!),
          label: blocker.need,
          detail: blocker.how,
        });
      } else if (blocker.fixKind === 'guild') {
        ways.push({ to: at('guild', blocker.fixId!), label: blocker.need, detail: blocker.how });
      } else if (blocker.fixKind === 'policy') {
        ways.push({ to: at('cover', blocker.fixId!), label: blocker.need, detail: blocker.how });
      } else if (blocker.fixKind === 'role') {
        ways.push({ to: at('role', blocker.fixId!), label: blocker.need, detail: blocker.how });
      }
    }
    if (company) {
      ways.push({
        to: at('firm', company.id),
        label: company.legalName,
        detail: 'Whose door this is, and the other eight things the company has to be able to do',
      });
    }

    return {
      name: door.label,
      kind: door.can ? 'Something It Can Do' : 'Something It Can’t Do Yet',
      parent: company ? at('firm', company.id) : undefined,
      summary: door.can
        ? `${door.what} Nothing is in the way of this one.`
        : `${door.what} It can’t, yet.`,
      body: (
        <>
          <p className="small">{door.because}</p>
          {door.blockers.length > 0 && (
            <p className="small">
              {`What’s in the way: ${spokenList(door.blockers.map((one) => one.need.toLowerCase()))}. `}
              {door.blockers.length === 1
                ? 'One thing, and the whole door turns on it.'
                : `${toStart(said(door.blockers.length, 'thing'))}, and all of them have to be true at once.`}
            </p>
          )}
        </>
      ),
      ways,
    };
  },
});


/**
 * Take the thing this page describes.
 *
 * Until this existed, a register, a guild, a policy and the American arm could
 * be reached through exactly one control anywhere in the build: a chip inside a
 * shut capability door, which is a fix-what-is-broken affordance being used as
 * the only shop. Three of the four signable guilds, one register, two policies
 * and one company form are never named by any blocker, so forty-odd lines of
 * authored content apiece — the deposit, the agreement, what it binds you to —
 * could not be bought by any route a player could walk.
 *
 * The page that already prints every one of those facts is where the offer
 * belongs. The chip stays as what it should have been all along: a shortcut to
 * a page that exists anyway.
 *
 * The refusal is the line under the button rather than a tooltip on it, and it
 * comes from the same function the command calls, so the screen cannot say yes
 * to something the engine will refuse.
 */
function Take(
  { label, kind, payload, whyNot }:
  { label: string; kind: string; payload: Record<string, unknown>; whyNot: string | undefined },
) {
  const { run } = useGame();
  return (
    <div className="row gap-2" style={{ marginTop: 'var(--s2)' }}>
      <button className="btn btn-sm" disabled={whyNot !== undefined} onClick={() => run(kind, payload)}>
        {label}
      </button>
      {whyNot !== undefined && <span className="xs dim">{whyNot}</span>}
    </div>
  );
}
// ---------------------------------------------------------------------------
// A register
// ---------------------------------------------------------------------------

/** A register, whether or not the company is on it. */
interface Register { id: string; on?: Registration }

defineLook<Register>('register', {
  gone: 'There’s no such register.',
  resolve: (sim, id) => {
    if (!REGISTRY_BY_ID[id as RegistryId]) return undefined;
    return { id, on: registrationsOf(sim.universe).find((one) => one.registry === id) };
  },
  seeds: () => REGISTRIES.map((one) => one.id),
  look: ({ id, on }, { sim }) => {
    const facts = REGISTRY_BY_ID[id as RegistryId];
    const company = on ? sim.universe.companies[on.companyId] : undefined;

    return {
      name: facts.label,
      kind: facts.body,
      parent: at('firm', company?.id ?? parentCompany(sim.universe)?.id ?? ''),
      summary: on
        ? `The company has been on it since ${formatDate(on.since, sim.homeZone)}, unbroken.`
        : `The company isn’t on it. ${facts.why}`,
      body: (
        <>
          <p className="small">{facts.what}</p>
          <p className="small">{facts.why}</p>
          <div className="grid grid-3">
            <Stat label="Its Number" value={on ? on.number : 'None'} note={on ? facts.body : facts.required ? 'And it has to have one' : 'Not on it yet'} />
            <Stat label="What It Costs" value={facts.cost === 0 ? 'Nothing' : moneyOf(facts.cost)} note="To get on it" />
            <Stat
              label="Files Every"
              value={facts.filesEveryMonths === 0 ? 'Never' : said(facts.filesEveryMonths, 'month')}
              note={facts.filesEveryMonths === 0 ? 'No filing to keep up' : 'What the body asks for'}
            />
          </div>
          {!on && (
            <Take
              label={`Register With ${facts.body}`}
              kind="company.register"
              payload={{ registry: id }}
              whyNot={whyNotRegister(sim, id as RegistryId)}
            />
          )}
        </>
      ),
      // A date on the record, said as one. This was labelled 'When It’s Next
      // Due' and printed a countdown beside it, which twenty years into a save
      // read as a filing overdue by two decades: the date is written once when
      // the registration is and no clock in this build ever moves it or acts
      // on it. The cadence beside it, in the stat above, is what the body
      // actually wants.
      ways: on && on.nextDueAt
        ? [{
          to: at('day', ''),
          label: 'The Filing Date On Record',
          detail: `${formatDate(on.nextDueAt, sim.homeZone)}, written with the registration and not moved since.`,
        }]
        : [],
      provenance: 'Body and mechanism are real. The fee is SLATE’s own estimate.',
    };
  },
});

/** The registration record itself, which the page lists by number. */
// ---------------------------------------------------------------------------
// A guild
// ---------------------------------------------------------------------------

interface Guilded { id: string; signed?: Signature }

defineLook<Guilded>('guild', {
  gone: 'There’s no such guild.',
  resolve: (sim, id) => {
    if (!GUILD_BY_ID[id as GuildId]) return undefined;
    return { id, signed: signaturesOf(sim.universe).find((one) => one.guild === id) };
  },
  seeds: () => GUILDS.map((one) => one.id),
  look: ({ id, signed }, { sim }) => {
    const facts = GUILD_BY_ID[id as GuildId];
    const company = parentCompany(sim.universe);
    const arm = americanArm(sim.universe);

    const ways: Way[] = [];
    if (facts.jurisdiction === 'us' && !arm) {
      ways.push({
        to: at('door', 'employ_americans'),
        label: 'Hire Americans',
        detail: 'Which door this guild stands in, and the American arm it wants first',
      });
    }
    if (company) {
      ways.push({ to: at('firm', company.id), label: company.legalName, detail: 'Whose name goes on it' });
    }

    return {
      name: facts.label,
      kind: facts.body,
      parent: company ? at('firm', company.id) : undefined,
      summary: signed
        ? `Signed on ${formatDate(signed.since, sim.homeZone)}, under the ${signed.agreement}.`
        : facts.signable
          ? `Not signed. Which means nobody ${facts.covers.toLowerCase()} covered by it can work for this company.`
          : `There’s nothing to sign. ${facts.what}`,
      body: (
        <>
          <p className="small">{facts.what}</p>
          <p className="small"><strong>What it binds you to. </strong>{facts.binds}</p>
          {facts.jurisdiction === 'us' && <p className="small">{GLOBAL_RULE_ONE}</p>}
          <div className="grid grid-3">
            <Stat label="Covers" value={facts.covers} note={facts.body} />
            <Stat label="Signed" value={signed ? 'Yes' : facts.signable ? 'No' : 'Not A Thing You Sign'} note={signed ? signed.agreement : facts.agreement} />
            <Stat
              label="Deposit"
              value={facts.depositCents === 0 ? 'None' : moneyOf(facts.depositCents)}
              note={facts.depositCents === 0 ? 'They hold none' : 'Held before you shoot'}
            />
          </div>
          {!signed && facts.signable && (
            <Take
              label={`Sign With ${facts.body}`}
              kind="company.sign"
              payload={{ guild: id }}
              whyNot={whyNotSign(sim, id as GuildId)}
            />
          )}
        </>
      ),
      ways,
      provenance: 'The guilds, the agreements and Global Rule One are real. The deposit is SLATE’s own: '
        + 'a real one is set against the cast of a real production, and there isn’t one yet.',
    };
  },
});

// ---------------------------------------------------------------------------
// Cover
// ---------------------------------------------------------------------------

interface Covered { id: string; bound?: Policy }

defineLook<Covered>('cover', {
  gone: 'There’s no such cover.',
  resolve: (sim, id) => {
    if (!POLICY_BY_ID[id as PolicyKind]) return undefined;
    return { id, bound: policiesOf(sim.universe).find((one) => one.kind === id) };
  },
  seeds: () => POLICIES.map((one) => one.id),
  look: ({ id, bound }, { sim }) => {
    const facts = POLICY_BY_ID[id as PolicyKind];
    const company = parentCompany(sim.universe);
    return {
      name: facts.label,
      kind: bound ? 'Cover The Company Carries' : 'Cover It Doesn’t Carry',
      parent: company ? at('firm', company.id) : undefined,
      summary: bound
        // What the paper says, and not what happens next. This read "renewing
        // in eight months", which promised a renewal the build has no clock to
        // perform: cover bound once is carried for the life of the save.
        ? `Bound with ${bound.insurer} to ${moneyOf(bound.limitCents)}, on a term written to `
          + `${formatDate(bound.renewsAt, sim.homeZone)}.`
        : `Not bound. ${facts.why}`,
      body: (
        <>
          <p className="small">{facts.what}</p>
          <p className="small">{facts.why}</p>
          <div className="grid grid-3">
            <Stat label="Bound" value={bound ? 'Yes' : 'No'} note={bound ? bound.insurer : 'Nothing behind it'} />
            <Stat label="Pays Out To" value={moneyOf(facts.limitCents)} note="At most" />
            <Stat
              label="What It Was Written At"
              value={moneyOf(facts.premiumCents)}
              note={facts.standing ? 'A year of a policy a company carries always' : 'A year of a policy a company carries while shooting'}
            />
          </div>
          {!bound && (
            <Take
              label={`Bind ${facts.label}`}
              kind="company.insure"
              payload={{ policy: id }}
              whyNot={whyNotInsure(sim, id as PolicyKind)}
            />
          )}
        </>
      ),
      ways: id === 'errors_omissions'
        ? [{ to: at('door', 'deliver'), label: 'Deliver A Picture', detail: 'Which door this cover stands in' }]
        : [],
      provenance: 'What each policy is for is real. The limits and premiums are SLATE’s own.',
    };
  },
});

// ---------------------------------------------------------------------------
// Material
// ---------------------------------------------------------------------------

defineLook<Holding>('holding', {
  gone: 'The company doesn’t hold those rights any more.',
  resolve: (sim, id) => sim.universe.holdings[id],
  seeds: (sim) => holdingsOf(sim.universe).map((one) => one.id),
  look: (holding, { sim }) => {
    const company = sim.universe.companies[holding.companyId];
    // What the company was trying to make out of it opened onto the picture, and
    // the picture’s drill-down went with the production system.
    const ways: Way[] = [];
    if (company) ways.push({ to: at('firm', company.id), label: company.legalName, detail: 'Who holds it' });

    return {
      name: holding.title,
      kind: holding.hold === 'option' ? 'Optioned' : holding.hold === 'owned' ? 'Owned Outright' : 'Commissioned',
      parent: company ? at('firm', company.id) : undefined,
      summary: holding.chainComplete
        ? 'It’s held, the paper behind it’s clean, and it can be insured and sold.'
        : `The company holds it and the paper behind it isn’t clean. ${holding.chainGap ?? ''}`,
      body: (
        <>
          <p className="small">
            {/* The same lapse promise that stood in the Take An Option modal,
                and the same correction: the agreement carries a term, the term
                is printed below, and no clock in this build runs it out or
                hands the rights back. Saying "owned outright is the only hold
                with no clock on it" was the sharpest version of the lie,
                because there is no clock on either. */}
            {holding.hold === 'option'
              ? 'An option is the right to make it for a while, not ownership of it. The term it was '
                + 'written for is below, and buying it outright is a different and dearer thing.'
              : 'Owned outright. There’s no term on it and nobody to hand it back to.'}
          </p>
          <p className="small">
            <strong>Chain of title. </strong>
            {holding.chainComplete
              ? 'Unbroken. That’s the document set proving the company owns what it’s about to sell, and '
                + 'an insurer reads it before writing errors and omissions cover.'
              : `Broken. ${holding.chainGap ?? 'Something is missing.'} Until it’s closed nothing ships: `
                + 'the insurer stops, so the cover stops, so the distributor stops.'}
          </p>
          <div className="grid grid-3">
            <Stat label="Held Since" value={formatDate(holding.acquiredAt, sim.homeZone)} note={formatRelative(holding.acquiredAt, sim.now)} />
            <Stat
              label="Optioned To"
              value={holding.expiresAt ? formatDate(holding.expiresAt, sim.homeZone) : 'No end date'}
              note={holding.expiresAt ? 'The term on the agreement' : 'Owned outright'}
            />
            <Stat
              label="Chain Of Title"
              value={holding.chainComplete ? 'Clean' : 'Broken'}
              note={holding.chainComplete ? 'It can be insured' : 'It can’t be delivered'}
            />
          </div>
        </>
      ),
      ways,
      provenance: 'Chain of title is the real thing and the real failure mode: delivery goes wrong on '
        + 'paperwork far more often than on film.',
    };
  },
});

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

interface Roled { id: string; post?: Post }

/**
 * A post at either company.
 *
 * This resolved out of `ROLE_BY_ID` and hung every post off `parentCompany`, so
 * the seven seats at the sugar group opened onto “There’s no such post” and, had
 * they resolved, would have claimed to sit at the film company. Both tables are
 * tried now and the company comes off the post itself, which is where it has
 * always been recorded.
 */
defineLook<Roled>('role', {
  gone: 'There’s no such post.',
  resolve: (sim, id) => {
    if (!postFacts(id as PostRole)) return undefined;
    return { id, post: postsOf(sim.universe).find((one) => one.role === id) };
  },
  seeds: () => [...ROLES.map((one) => one.id), ...GROUP_ROLES.map((one) => one.id)],
  look: ({ id, post }, { sim }) => {
    const facts = postFacts(id as PostRole)!;
    const who = post ? whoIs(sim, post) : undefined;
    const company = post
      ? sim.universe.companies[post.companyId]
      : parentCompany(sim.universe);
    const ways: Way[] = [];
    if (post?.personId) {
      ways.push({ to: at('person', post.personId), label: who ?? 'Them', detail: 'Who is in the post, and how they are' });
    }
    if (company) ways.push({ to: at('firm', company.id), label: company.legalName, detail: 'Where the post sits' });

    return {
      name: facts.label,
      kind: who ? 'A Post That’s Filled' : 'A Post Nobody Holds',
      parent: company ? at('firm', company.id) : undefined,
      summary: who
        ? `${who} is ${facts.said}, and has been since ${post?.filledAt ? formatDate(post.filledAt, sim.homeZone) : 'the company was formed'}.`
        : `Nobody is ${facts.said}. ${facts.without}`,
      body: (
        <>
          <p className="small">{facts.what}</p>
          <p className="small"><strong>Without anybody in it. </strong>{facts.without}</p>
          <div className="grid grid-3">
            <Stat label="Filled" value={who ?? 'Empty'} note={who ? 'In the post' : 'An empty chair runs nothing'} />
            <Stat
              label="What The Job Is Worth"
              value={facts.monthlyCents === 0 ? 'Nothing' : moneyOf(facts.monthlyCents)}
              note={facts.monthlyCents === 0 ? 'Whoever owns it does it' : 'A month of it, at the going rate'}
            />
            <Stat label="Where" value="Sugar Land" note="There’s nowhere else" />
          </div>
        </>
      ),
      ways,
      provenance: 'What each post does is real. What it costs a month is SLATE’s own.',
    };
  },
});

// ---------------------------------------------------------------------------
// The money from the state
// ---------------------------------------------------------------------------

interface Rebate { share: number }

defineLook<Rebate>('rebate', {
  gone: 'There’s no reimbursement scheme to look at.',
  resolve: () => ({ share: REBATE.share }),
  seeds: () => [''],
  look: (_rebate, { sim }) => {
    const door = capabilitiesOf(sim).find((one) => one.id === 'claim_rebate')!;
    const company = parentCompany(sim.universe);
    return {
      name: REBATE.label,
      kind: 'Money Back From The State',
      parent: at('door', 'claim_rebate'),
      summary: `Iceland pays back ${Math.round(REBATE.share * 100)} percent of what a production spends `
        + 'here. That’s the reason anybody shoots in this country.',
      body: (
        <>
          <p className="small">
            The mechanism matters more than the percentage. You apply before you shoot a foot of film, you
            spend, an Icelandic auditor certifies what was spent in Iceland, and the state pays a share of
            it back afterwards. Because it lands afterwards, productions borrow against it. That’s an
            industry of its own.
          </p>
          <p className="small">
            {door.can
              ? 'This company could claim it.'
              : `This company couldn’t claim it: ${spokenList(door.blockers.map((one) => one.need.toLowerCase()))}.`}
          </p>
          <div className="grid grid-3">
            <Stat label="Pays Back" value={`${Math.round(REBATE.share * 100)}%`} note="Of qualifying Icelandic spend" />
            <Stat label="Applied For" value="Before You Shoot" note="Or not at all" />
            <Stat label="Lands" value={said(REBATE.paidAfterMonths, 'month')} note="After delivery, roughly" />
          </div>
        </>
      ),
      ways: [
        { to: at('door', 'claim_rebate'), label: door.label, detail: 'Whether this company could claim it' },
        ...(company ? [{ to: at('firm', company.id), label: company.legalName, detail: 'Who would be applying' }] : []),
      ],
      provenance: REBATE.note,
    };
  },
});

/** Everything the workspace needs to name. */
export const cashOf = companyCash;

