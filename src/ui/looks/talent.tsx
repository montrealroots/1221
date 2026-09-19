/**
 * SLATE — production-facing talent profile.
 *
 * The ordinary person look answers "how are they?". This answers the production
 * question: "what have they done, what do they cost, what are they good at and
 * when are they free?" Keeping those as separate looks stops a career database
 * from swallowing the life simulator.
 */

import { formatMoney } from '@/engine/core/money';
import { formatDate } from '@/engine/core/time';
import { TRAIT_BY_ID } from '@/engine/domain/attributes';
import { talentProfile, type TalentEngagement } from '@/engine/production/talent';
import { Stat } from '@/ui/components/primitives';
import { defineLook, type Way } from './registry';
import { at } from './subject';

const money = (cents: number): string =>
  cents > 0 ? formatMoney(cents, { cents: false }) : 'No Quote Yet';

const engagementLine = (one: TalentEngagement, zone: string): string => {
  if (one.releasedAt !== undefined) return `${one.role} · released after the deal`;
  if (one.from !== undefined && one.to !== undefined) {
    return `${one.role} · ${formatDate(one.from, zone)} to ${formatDate(one.to, zone)}`;
  }
  return one.role;
};

defineLook('talent', {
  gone: 'That career is no longer in the talent database.',
  resolve: (sim, id) => talentProfile(sim, id),
  seeds: (sim) => Object.values(sim.universe.people)
    .filter((person) => person.isPlayer || person.careerTrack === 'actor')
    .slice(0, 12)
    .map((person) => person.id),
  look: (profile, { sim }) => {
    const { person } = profile;
    const title = person.stageName?.trim() || person.displayName;
    const credits = profile.credits;
    const commitments = profile.commitments;
    const ways: Way[] = [];
    const seen = new Set<string>();

    for (const one of [...commitments, ...credits]) {
      if (!one.projectId || seen.has(one.projectId)) continue;
      seen.add(one.projectId);
      ways.push({
        to: at('project', one.projectId),
        label: one.title,
        detail: engagementLine(one, sim.homeZone),
      });
    }

    ways.push({
      to: at('person', person.id),
      label: 'Life Profile',
      detail: 'Health, readiness, relationships and the rest of the person behind the career',
    });
    ways.push({
      to: at('reputation', person.id),
      label: 'Industry Standing',
      detail: 'Fame, appeal, reliability, demand, prestige and controversy',
    });

    const quote = Math.max(...Object.values(profile.currentQuoteCents).map((value) => value ?? 0));
    const rep = person.reputation;
    const current = commitments.find((one) => one.active);
    const next = commitments.find((one) => !one.active);

    return {
      name: title,
      kind: `${person.performerTitle === 'actress' ? 'Actress' : 'Actor'} Career Profile`,
      parent: at('person', person.id),
      summary: current
        ? `${title} is working on ${current.title} now, with ${commitments.length} live commitment${commitments.length === 1 ? '' : 's'} on the calendar.`
        : next
          ? `${title} is clear today and next committed to ${next.title} from ${formatDate(next.from ?? sim.now, sim.homeZone)}.`
          : `${title} has no acting commitment currently holding the calendar.`,
      body: (
        <>
          <div className="grid grid-4">
            <Stat label="Age" value={profile.age} note="At the current world date" />
            <Stat label="Based" value={profile.location} note={person.pronouns} />
            <Stat label="Acting" value={`${profile.actingRating}/100`} note="Across the full acting sheet" />
            <Stat label="Demand" value={`${Math.round(rep.industryDemand)}/100`} note="How wanted they are now" />
            <Stat label="Professional Reputation" value={`${Math.round(rep.professionalReputation)}/100`} note="What hiring rooms think of the work" />
            <Stat label="Public Fame" value={`${Math.round(rep.publicFame)}/100`} note="How widely the name is known" />
            <Stat label="Highest Known Fee" value={money(profile.compensation.highestFeeCents)} note="From signed acting engagements in this save" />
            <Stat label="Current Quote Ceiling" value={money(quote)} note="Highest current quote across the four role sizes" />
          </div>

          <h4>Performance Read</h4>
          <div className="table-wrap">
            <table className="table">
              <tbody>
                {profile.axes.map((axis) => (
                  <tr key={axis.id}>
                    <td className="nowrap">{axis.label}</td>
                    <td className="small nowrap">{axis.value}/100</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h4>Top Skills</h4>
          <div className="table-wrap">
            <table className="table">
              <tbody>
                {profile.topSkills.map((skill) => (
                  <tr key={skill.id}>
                    <td>{skill.name}</td>
                    <td className="small nowrap">{skill.group}</td>
                    <td className="small nowrap">{skill.value}/100</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ),
      facets: [
        {
          id: 'career',
          label: 'Career',
          body: (
            <>
              <div className="grid grid-3">
                <Stat label="Known Engagements" value={profile.engagements.length} note="Signed work, including released pay-or-play deals" />
                <Stat label="Completed Credits" value={credits.length} note="Work that actually reached the performance" />
                <Stat label="Known Acting Pay" value={money(profile.compensation.knownCareerCents)} note="Only compensation this save can prove" />
              </div>
              {profile.engagements.length === 0 ? (
                <p className="small muted">No signed acting work is on this record yet.</p>
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <tbody>
                      {profile.engagements.map((one) => (
                        <tr key={one.id}>
                          <td>{one.title}</td>
                          <td className="small nowrap">{one.role}</td>
                          <td className="small nowrap">{money(one.feeCents)}</td>
                          <td className="small">{engagementLine(one, sim.homeZone)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ),
        },
        {
          id: 'availability',
          label: 'Availability',
          body: commitments.length === 0 ? (
            <p className="small">Nothing currently on this acting calendar.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <tbody>
                  {commitments.map((one) => (
                    <tr key={one.id}>
                      <td>{one.title}</td>
                      <td className="small nowrap">{one.role}</td>
                      <td className="small nowrap">
                        {one.from === undefined ? 'Start not set' : formatDate(one.from, sim.homeZone)}
                      </td>
                      <td className="small nowrap">
                        {one.to === undefined ? 'End not set' : formatDate(one.to, sim.homeZone)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ),
        },
        {
          id: 'rates',
          label: 'Quotes',
          body: (
            <div className="grid grid-4">
              <Stat label="Lead" value={money(profile.currentQuoteCents.lead ?? 0)} note="Current quote" />
              <Stat label="Supporting" value={money(profile.currentQuoteCents.support ?? 0)} note="Current quote" />
              <Stat label="Guest" value={money(profile.currentQuoteCents.guest ?? 0)} note="Current quote" />
              <Stat label="Day Player" value={money(profile.currentQuoteCents.day ?? 0)} note="Current quote" />
            </div>
          ),
        },
        {
          id: 'traits',
          label: 'Traits',
          body: person.traits.length === 0 ? (
            <p className="small muted">No acting traits are on this record.</p>
          ) : (
            <p className="small">
              {person.traits
                .map((id) => TRAIT_BY_ID[id]?.name ?? id.replace(/_/g, ' '))
                .join(' · ')}
            </p>
          ),
        },
      ],
      ways,
      provenance: 'Everything here is derived from this save’s people, contracts, projects, auditions and career state. The production rebuild stores no second copy of the person.',
    };
  },
});
