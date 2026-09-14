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
  Company, GuildId, Holding, Policy, PolicyKind, Post, Project, Registration,
  RegistryId, RoleId, Signature,
} from '@/engine/domain/company';
import {
  FORM_BY_ID, GLOBAL_RULE_ONE, GUILDS, GUILD_BY_ID, INCORPORATION_NOTE, POLICIES,
  POLICY_BY_ID, REBATE, REGISTRIES, REGISTRY_BY_ID, ROLES, ROLE_BY_ID,
} from '@/engine/content/incorporation';
import {
  americanArm, capabilitiesOf, companiesOf, companyCash, holdingsOf, parentCompany,
  policiesOf, postsOf, projectsOf, registrationsOf, signaturesOf, whereItStands,
} from '@/engine/world/company';
import { DELIVERY, type Element } from '@/engine/content/making';
import { TIERS, WINDOWS, dealById } from '@/engine/content/selling';
import { standingOf, whereTheMoneyStands } from '@/engine/world/selling';
import { departmentById } from '@/engine/content/crew';
import { crewOf, postsFor, standingReads } from '@/engine/world/crew';
import {
  finishesBy, heldUpBy, periodOf, planOf, stillMissing, whereThePictureStands, windowOf,
} from '@/engine/world/making';
import { formatMoney } from '@/engine/core/money';
import { formatDate, formatRelative } from '@/engine/core/time';
import { Stat } from '@/ui/components/primitives';
import { Open } from './Look';
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
      for (const project of projectsOf(sim.universe, company.id)) {
        ways.push({
          to: at('project', project.id),
          label: project.title,
          detail: `On the slate, and ${project.stage === 'idea' ? 'nothing’s behind it yet' : `it’s ${project.stage}`}`,
        });
      }
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
            {form.what}{' '}
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
              note={facts.filesEveryMonths === 0 ? 'No filing to keep up' : 'For as long as it exists'}
            />
          </div>
        </>
      ),
      ways: on && on.nextDueAt
        ? [{
          to: at('day', ''),
          label: 'When It’s Next Due',
          detail: `${formatDate(on.nextDueAt, sim.homeZone)}, ${formatRelative(on.nextDueAt, sim.now)}`,
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
        ? `Bound with ${bound.insurer} to ${moneyOf(bound.limitCents)}, renewing ${formatRelative(bound.renewsAt, sim.now)}.`
        : `Not bound. ${facts.why}`,
      body: (
        <>
          <p className="small">{facts.what}</p>
          <p className="small">{facts.why}</p>
          <div className="grid grid-3">
            <Stat label="Bound" value={bound ? 'Yes' : 'No'} note={bound ? bound.insurer : 'Nothing behind it'} />
            <Stat label="Pays Out To" value={moneyOf(facts.limitCents)} note="At most" />
            <Stat label="A Year Of It" value={moneyOf(facts.premiumCents)} note={facts.standing ? 'Carried always' : 'Carried while shooting'} />
          </div>
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
    const built = projectsOf(sim.universe).filter((one) => one.holdingId === holding.id);
    const ways: Way[] = built.map((project) => ({
      to: at('project', project.id),
      label: project.title,
      detail: 'What the company is trying to make out of it',
    }));
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
            {holding.hold === 'option'
              ? 'An option is the right to make it for a while, not ownership of it. It runs out, and when '
                + 'it does the rights go back to whoever they came from.'
              : 'Owned outright. It’s the only kind of hold with no clock on it.'}
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
              label="Runs Out"
              value={holding.expiresAt ? formatDate(holding.expiresAt, sim.homeZone) : 'Never'}
              note={holding.expiresAt ? formatRelative(holding.expiresAt, sim.now) : 'Owned outright'}
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

defineLook<Project>('project', {
  gone: 'That one came off the slate.',
  resolve: (sim, id) => sim.universe.projects[id],
  seeds: (sim) => projectsOf(sim.universe).map((one) => one.id),
  look: (project, { sim }) => {
    const holding = project.holdingId ? sim.universe.holdings[project.holdingId] : undefined;
    const company = sim.universe.companies[project.companyId];
    const plan = planOf(project);
    const stage = project.stageId ? sim.universe.stages[project.stageId] : undefined;
    const held = heldUpBy(project);
    const deal = project.dealId ? dealById(project.dealId) : undefined;
    const split = standingOf(project);
    const crew = crewOf(sim, project);
    const carries = postsFor(project.budgetCents ?? 0).length;
    const ways: Way[] = [];
    if (holding) ways.push({ to: at('holding', holding.id), label: holding.title, detail: 'Which rights it hangs off' });
    if (company) ways.push({ to: at('firm', company.id), label: company.legalName, detail: 'Who’s making it' });

    return {
      name: project.title,
      kind: project.medium === 'film' ? 'A Film On The Slate' : 'Television On The Slate',
      parent: company ? at('firm', company.id) : undefined,
      summary: project.dealId ? whereTheMoneyStands(project) : whereThePictureStands(sim, project),
      body: (
        <>
          {plan ? (
            <>
              <p className="small">{plan.what}</p>
              <div className="grid grid-3">
                <Stat label="Where It Is" value={periodOf(project)?.label ?? toStart(project.stage)}
                  note={periodOf(project)?.what ?? 'Between periods'} />
                <Stat label="Budget" value={project.budgetCents ? moneyOf(project.budgetCents) : 'Not set'}
                  note={`${moneyOf(project.spentCents)} of it has gone`} />
                <Stat label="Stage" value={stage?.name ?? 'Elsewhere'}
                  note={stage ? 'Held off the lot’s own board' : 'Not on a stage here'} />
              </div>
              <h4>The Schedule</h4>
              <table className="table">
                <tbody>
                  {(project.periods ?? []).map((window) => {
                    const period = plan.periods.find((one) => one.id === window.id);
                    const span = Math.round((window.to - window.from) / (7 * 24 * 60 * 60 * 1000));
                    const units = period ? Math.round(span * period.unit.aWeek) : span;
                    return (
                      <tr key={window.id}>
                        <td>{period?.label ?? window.id}</td>
                        <td className="small">{formatDate(window.from, sim.homeZone)}</td>
                        <td className="small">{formatDate(window.to, sim.homeZone)}</td>
                        <td className="small">{units} {units === 1 ? period?.unit.one : period?.unit.many}</td>
                      </tr>
                    );
                  })}
                  {project.deliverBy === undefined ? null : (
                    <tr>
                      <td>Delivery Due</td>
                      <td className="small" colSpan={2}>{formatDate(project.deliverBy, sim.homeZone)}</td>
                      <td className="small">
                        {finishesBy(project) === undefined ? '' : `${Math.round((project.deliverBy - finishesBy(project)!) / (7 * 24 * 60 * 60 * 1000))} weeks after the work`}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <h4>Who Is On It</h4>
              <p className="small">
                {crew.length === 0
                  ? `Nobody yet. This picture carries ${carries} posts, and they come on over the weeks before the camera does — the money and the design first, the camera late.`
                  : `${crew.length} of ${carries} posts filled. Nobody starts on the first day: a unit production manager is here ten weeks before the camera turns over, a boom operator for one.`}
              </p>
              {/* Six columns of short values. On a phone they get about fifty
                  pixels each and a word like "Production" comes apart across
                  three lines, so the whole table scrolls sideways in its own box
                  rather than being crushed into the width of the page. */}
              {crew.length === 0 ? null : (
                <div className="table-wrap">
                <table className="table">
                  <tbody>
                    {crew.map((seat) => (
                      <tr key={seat.post.id}>
                        {/* The name is the way in, the way every other name in
                            the game is. These people exist in their own right
                            and outlast the picture that hired them. */}
                        <td className="nowrap">
                          <Open subject={at('person', seat.person.id)}>{seat.person.displayName}</Open>
                          {seat.post.head ? ' · Heads the department' : ''}
                        </td>
                        <td className="small nowrap">{seat.post.label}</td>
                        <td className="small nowrap">{departmentById(seat.post.department)?.label ?? seat.post.department}</td>
                        <td className="small nowrap">{seat.post.local}</td>
                        <td className="small nowrap">{standingReads(seat.person.reputation.professionalReputation)}</td>
                        <td className="small nowrap">
                          {formatDate(seat.from, sim.homeZone)} to {formatDate(seat.to, sim.homeZone)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
              <h4>The Delivery List</h4>
              <p className="small">
                A distributor doesn’t pay for a film. It pays for a list, and it pays when the list
                is complete{held.length > 0 ? `. ${held.length === 1 ? 'One item' : `${held.length} items`} on this one ${isAre(held.length)} outstanding` : ', and this one is'}.
              </p>
              <table className="table">
                <tbody>
                  {DELIVERY.map((element: Element) => (
                    <tr key={element.id}>
                      <td>{element.label}</td>
                      {/* A status is two or three words and must not break in
                          half. The column beside it carries prose and will take
                          whatever room is left. */}
                      <td className="small nowrap">
                        {project.delivered.includes(element.id)
                          ? 'Over'
                          : element.by === 'business' ? 'Waiting to be filed' : 'Comes out of the work'}
                      </td>
                      <td className="small">{element.what}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {deal === undefined || split === undefined ? null : (
                <>
                  <h4>Where The Money Went</h4>
                  <p className="small">
                    {deal.what} A picture is paid for in the order below, and the money that made it
                    is third — behind the fee, and behind what was spent selling it.
                  </p>
                  <table className="table">
                    <tbody>
                      {TIERS.map((tier) => (
                        <tr key={tier.id}>
                          <td>{tier.label}</td>
                          <td className="small money">{moneyOf(split.took[tier.id])}</td>
                          <td className="small">{tier.what}</td>
                        </tr>
                      ))}
                      <tr>
                        <td>Still Outstanding</td>
                        <td className="small money">{moneyOf(split.stillOwedCents)}</td>
                        <td className="small">
                          {split.stillOwedCents > 0
                            ? 'What the picture still owes for itself, interest included.'
                            : 'The picture has paid for itself.'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <h4>The Windows</h4>
                  {deal.reach === 0 ? (
                    <p className="small">
                      Nobody licenses this one again. It was bought outright, so there are no windows
                      to open and no statements to read.
                    </p>
                  ) : (
                    <table className="table">
                      <tbody>
                        {WINDOWS.map((window) => (
                          <tr key={window.id}>
                            <td className="nowrap">{window.label}</td>
                            <td className="small nowrap">
                              {project.windowsPaid?.includes(window.id) ? 'Paid' : 'Not yet'}
                            </td>
                            <td className="small">{window.what}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              <p className="small">
                Most things die between being optioned and being packaged, which isn’t a failure of the
                company so much as the shape of the business. A slate exists because of it.
              </p>
              <div className="grid grid-3">
                <Stat label="Where It Is" value={toStart(project.stage)} note="On the way to being made" />
                <Stat label="Spent On It" value={moneyOf(project.spentCents)} note="Gone either way" />
                <Stat label="Rights" value={holding ? 'Held' : 'None'} note={holding ? holding.title : 'Nothing behind it yet'} />
              </div>
            </>
          )}
        </>
      ),
      ways,
      facets: plan === undefined ? undefined : [
        {
          id: 'outstanding',
          label: 'What’s Outstanding',
          body: (
            <p className="small">
              {held.length === 0
                ? `The money isn’t being held up. ${stillMissing(project).length === 0 ? 'Every element is over.' : 'What’s left doesn’t gate the payment.'}`
                : `The money is held until ${spokenList(held.map((one) => one.label))} ${isAre(held.length)} over.`}
            </p>
          ),
        },
        {
          id: 'where',
          label: 'Where It’s Being Made',
          body: (
            <p className="small">
              {stage
                ? `${stage.name}, held from ${formatDate(windowOf(project, plan.periods[0]!.id)?.from ?? project.startedAt, sim.homeZone)}. `
                  + 'It’s a room no paying tenant can have while the picture is in it, which is what owning the stages actually costs.'
                : 'No room on the lot is being held for it.'}
            </p>
          ),
          ways: stage ? [{ to: at('firm', project.companyId), label: 'The Lot', detail: 'Who else is booked on it' }] : undefined,
        },
      ],
    };
  },
});

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

interface Roled { id: string; post?: Post }

defineLook<Roled>('role', {
  gone: 'There’s no such post.',
  resolve: (sim, id) => {
    if (!ROLE_BY_ID[id as RoleId]) return undefined;
    return { id, post: postsOf(sim.universe).find((one) => one.role === id) };
  },
  seeds: () => ROLES.map((one) => one.id),
  look: ({ id, post }, { sim }) => {
    const facts = ROLE_BY_ID[id as RoleId];
    const who = post ? whoIs(sim, post) : undefined;
    const company = parentCompany(sim.universe);
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
              label="A Month Of It"
              value={facts.monthlyCents === 0 ? 'Nothing' : moneyOf(facts.monthlyCents)}
              note={facts.monthlyCents === 0 ? 'Whoever owns it does it' : 'Whether anything shoots or not'}
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
