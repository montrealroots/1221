/**
 * SLATE — the people of the industry, and one profile each.
 *
 * Two layers, and the screen says which is which on every panel: what the
 * public record holds (born, from, every credit, every award) and what SLATE
 * derives from it (the attributes). Nobody has scored these people out of a
 * hundred; the numbers are a reading of a body of work, and each one can say
 * which parts of that body produced it.
 */

import { useMemo, useState } from 'react';
import { useGame } from '@/app/game-context';
import { Panel, Empty, Tabs, Meter, Modal, Stat } from '@/ui/components/primitives';
import { titleCaseLabel } from '@/engine/core/text';
import { formatMoneyCompact } from '@/engine/core/money';
import {
  NOT_IN_RECORD, ageIsApproximate, ageOf, allPeople, awardsFor, companiesOf, confidenceOf, creditsFor,
  deriveSheet, franchisesOf, isPeopleLoaded, overallFor, peopleInRole, primaryRole, rolesWithSheets,
  type PersonRecord, type DerivedAttribute,
} from '@/engine/content/people';
import { CRAFT_ROLES, CRAFT_ROLE_LABEL, CRAFT_ROLE_PLURAL, type CraftRole } from '@/engine/content/craft-attributes';
import { PERFORMER_NOUN, splitRecordsByTitle, titleFromGender } from '@/engine/core/performer';
import { approachSummary, historyWith, personForRecord } from '@/engine/systems/real-people';
import { creditRoleOf } from '@/engine/systems/industry-people';
import { formatMoney } from '@/engine/core/money';
import { formatDate } from '@/engine/core/time';
import { liveGrudges, standingWith, willReadFor } from '@/engine/systems/reactive';
import type { Simulation } from '@/engine/core/simulation';
import type { Person } from '@/engine/domain/model';

/** A column in the people list: a craft, or one of the two performer titles. */
type ListRole = CraftRole | 'actress';

const ROLE_TABS: { id: ListRole | 'all'; label: string }[] = [
  { id: 'all', label: 'Everyone' },
  // Actors and actresses are listed apart, the way the business lists them,
  // so neither is a subheading of the other.
  ...CRAFT_ROLES.flatMap((role) => (role === 'actor'
    ? ([{ id: 'actor', label: 'Actors' }, { id: 'actress', label: 'Actresses' }] as { id: ListRole; label: string }[])
    : ([{ id: role, label: CRAFT_ROLE_PLURAL[role] }] as { id: ListRole; label: string }[]))),
];

type Sort = 'rating' | 'name' | 'credits' | 'awards' | 'age';

const SORT_LABEL: Record<Sort, string> = {
  rating: 'Attributes', name: 'Name', credits: 'Credits', awards: 'Awards Won', age: 'Age',
};

/**
 * Where the player stands with somebody, in words.
 *
 * Never a number: what somebody privately thinks is not a stat the player gets
 * to read off a screen. What they can see is what they would be able to tell —
 * that a call gets returned, or that something happened they have not been
 * forgiven for.
 */
function feelingAbout(sim: Simulation, person: Person): string {
  const standing = standingWith(sim, person);
  const grudges = liveGrudges(sim, person);
  const refusing = !willReadFor(sim, person).ok;
  if (refusing) return `They are not reading anything of yours at the moment. ${grudges[0]?.reason ?? ''}`.trim();
  if (grudges.length > 0 && standing < 45) {
    return `Something happened between you that has not gone away: ${grudges[0]!.reason.toLowerCase()} Your calls still get returned, but not quickly.`;
  }
  if (standing >= 70) return 'You have been good to them and they know it. That is worth more than money, and it is also worth money.';
  if (standing >= 58) return 'They would take the call, and they would read it.';
  if (standing >= 45) return 'Nothing between you either way. You are somebody they have heard of.';
  return 'They are cool on you. Whether that is about you or about the business, they have not said.';
}

/**
 * Everybody in one column.
 *
 * Every craft but acting is one list. Acting is two, split on what the record
 * states, and anybody the record does not state is listed with the actors
 * rather than being left out of the building.
 */
function peopleFor(role: ListRole) {
  if (role !== 'actor' && role !== 'actress') return peopleInRole(role);
  const { actors, actresses, unstated } = splitRecordsByTitle(peopleInRole('actor'));
  return role === 'actress' ? actresses : [...actors, ...unstated];
}

export function PeopleTab() {
  const { sim } = useGame();
  const [role, setRole] = useState<ListRole | 'all'>('all');
  const [sort, setSort] = useState<Sort>('rating');
  const [query, setQuery] = useState('');
  const [openQid, setOpenQid] = useState<string | null>(null);
  const [shown, setShown] = useState(60);

  const loaded = isPeopleLoaded();
  const rows = useMemo(() => {
    if (!loaded) return [];
    const base = role === 'all' ? allPeople() : peopleFor(role);
    const q = query.trim().toLowerCase();
    const filtered = q
      ? base.filter((person) => person.name.toLowerCase().includes(q)
        || person.occupations.some((o) => o.toLowerCase().includes(q))
        || franchisesOf(person.qid).some((f) => f.toLowerCase().includes(q)))
      : base;
    return filtered.map((person) => {
      // The two performer columns are the same craft underneath: an actress's
      // sheet is an acting sheet, and is read as one.
      const shownRole: CraftRole = role === 'all' ? primaryRole(person) : role === 'actress' ? 'actor' : role;
      return {
        person,
        role: shownRole,
        overall: overallFor(person, shownRole),
        confidence: confidenceOf(person.evidence[shownRole]),
        credits: creditsFor(person.qid).length || person.creditCount,
        won: awardsFor(person.qid).filter((a) => a.outcome === 'won').length,
        age: ageOf(person, sim.now),
      };
    }).sort((a, b) => {
      if (sort === 'name') return a.person.name.localeCompare(b.person.name);
      if (sort === 'credits') return b.credits - a.credits;
      if (sort === 'awards') return b.won - a.won;
      if (sort === 'age') return (a.age ?? 999) - (b.age ?? 999);
      return b.overall - a.overall || b.credits - a.credits;
    });
  }, [loaded, role, sort, query, sim.now]);

  const open = openQid ? allPeople().find((p) => p.qid === openQid) : undefined;

  if (!loaded) {
    return (
      <Empty
        title="The People Are Still Loading"
        body="Who they are, everything they are on and what they have won comes from the public record, fetched in the background. If it does not arrive, the rest of the game is unaffected."
      />
    );
  }

  return (
    <>
      <Panel
        title="The People"
        subtitle={`${allPeople().length} on the record. What they are is the record; what they are rated is SLATE's reading of it.`}
        actions={(
          <input
            className="search-input" type="search" value={query} placeholder="Name, job or franchise"
            onChange={(e) => { setQuery(e.target.value); setShown(60); }}
            aria-label="Search The People" style={{ width: 220 }}
          />
        )}
        flush
      >
        <div style={{ padding: '0 var(--s4)' }}>
          <Tabs active={role} onChange={(id) => { setRole(id); setShown(60); }} tabs={ROLE_TABS.map((tab) => ({
            id: tab.id,
            label: tab.label,
            badge: tab.id === 'all' ? allPeople().length : peopleFor(tab.id as ListRole).length,
          }))} />
          <div className="row wrap gap-1" style={{ marginBottom: 'var(--s3)' }}>
            <span className="xs dim" style={{ alignSelf: 'center' }}>In order of</span>
            {(Object.keys(SORT_LABEL) as Sort[]).map((option) => (
              <button
                key={option}
                className="chip"
                aria-pressed={sort === option}
                style={sort === option ? { background: 'var(--accent-dim)', color: 'var(--accent-strong)', borderColor: 'var(--accent-line)' } : undefined}
                onClick={() => setSort(option)}
              >
                {SORT_LABEL[option]}
              </button>
            ))}
          </div>
        </div>

        {rows.length === 0 ? (
          <Empty title="Nobody Matches That" body="Try a name, a job, or a franchise they are attached to." />
        ) : (
          <div className="list">
            {rows.slice(0, shown).map((row, index) => (
              <button key={row.person.qid} className="list-item" onClick={() => setOpenQid(row.person.qid)}>
                <div className="mono dim xs" style={{ width: 34, textAlign: 'right', flexShrink: 0 }}>{index + 1}</div>
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="small strong">{row.person.name}</div>
                  <div className="xs dim" style={{ overflowWrap: 'anywhere' }}>
                    {row.person.roles.map((r) => (r === 'actor' ? PERFORMER_NOUN[titleFromGender(row.person.gender) ?? 'actor'] : CRAFT_ROLE_LABEL[r])).join(', ')}
                    {row.age !== undefined && ` · ${row.age}`}
                    {row.credits > 0 && ` · ${row.credits} credit${row.credits === 1 ? '' : 's'}`}
                    {row.won > 0 && ` · ${row.won} won`}
                    {franchisesOf(row.person.qid).slice(0, 2).map((f) => ` · ${f}`).join('')}
                  </div>
                </div>
                <div style={{ width: 128, flexShrink: 0 }}>
                  <Meter
                    label={row.role === 'actor' ? PERFORMER_NOUN[titleFromGender(row.person.gender) ?? 'actor'] : CRAFT_ROLE_LABEL[row.role]}
                    value={row.overall}
                    hint={row.confidence < 40 ? 'thin evidence' : undefined}
                  />
                </div>
              </button>
            ))}
          </div>
        )}
        {rows.length > shown && (
          <div style={{ padding: 'var(--s4)' }}>
            <button className="btn btn-sm" onClick={() => setShown((n) => n + 80)}>
              Show More ({rows.length - shown} Left)
            </button>
          </div>
        )}
      </Panel>

      {NOT_IN_RECORD.length > 0 && (
        <Panel title="Named, And Not In The Record" subtitle="Looked for and not found. Nothing has been invented to fill the gap." flush>
          <div className="list">
            {NOT_IN_RECORD.map((entry) => (
              <div key={entry.name} className="list-item list-static">
                <div className="grow">
                  <div className="small strong">{entry.name}</div>
                  <div className="xs dim">{entry.roles.map((r) => CRAFT_ROLE_LABEL[r]).join(', ')} · {entry.note}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {open && <PersonProfile person={open} onClose={() => setOpenQid(null)} />}
    </>
  );
}

/** Everything on one person: what the record says, and what SLATE makes of it. */
export function PersonProfile({ person, onClose }: { person: PersonRecord; onClose: () => void }) {
  const { sim } = useGame();
  const [role, setRole] = useState<CraftRole>(primaryRole(person));
  const [tab, setTab] = useState<'attributes' | 'filmography' | 'awards' | 'save'>('attributes');
  const [creditFilter, setCreditFilter] = useState('');

  const age = ageOf(person, sim.now);
  const sheets = useMemo(() => rolesWithSheets(person), [person]);
  const sheet = useMemo(() => deriveSheet(person, role), [person, role]);
  const evidence = person.evidence[role];
  const confidence = confidenceOf(evidence);
  const credits = creditsFor(person.qid);
  const awards = awardsFor(person.qid);
  const won = awards.filter((a) => a.outcome === 'won');
  const franchises = franchisesOf(person.qid);
  const companies = companiesOf(person.qid);

  const groups = useMemo(() => {
    const out: { group: string; attributes: DerivedAttribute[] }[] = [];
    for (const attribute of sheet) {
      const existing = out.find((g) => g.group === attribute.group);
      if (existing) existing.attributes.push(attribute);
      else out.push({ group: attribute.group, attributes: [attribute] });
    }
    return out;
  }, [sheet]);

  // Two different things, and the screen never lets them touch. Above this line
  // is the public record. Below it is what happened in this save, which is
  // simulation and is labelled as simulation wherever it appears.
  const inSave = personForRecord(sim, person.qid);
  const history = historyWith(sim, person.qid);
  const saveWork = useMemo(() => {
    if (!inSave) return [];
    return Object.values(sim.universe.projects)
      .filter((project) => project.castIds.includes(inSave.id)
        || project.attachments.some((attachment) => attachment.personId === inSave.id))
      .sort((a, b) => (b.releaseDate ?? b.createdAt) - (a.releaseDate ?? a.createdAt));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inSave, sim, sim.universe.projects]);
  const saveContracts = useMemo(() => {
    if (!inSave) return [];
    return Object.values(sim.universe.contracts).filter((contract) => contract.partyBId === inSave.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inSave, sim]);

  const shownCredits = useMemo(() => {
    const q = creditFilter.trim().toLowerCase();
    return credits.filter((credit) => !q
      || credit.title.toLowerCase().includes(q)
      || credit.roles.some((r) => r.toLowerCase().includes(q))
      || (credit.franchise ?? '').toLowerCase().includes(q)
      || String(credit.year ?? '').includes(q));
  }, [credits, creditFilter]);

  return (
    <Modal title={person.name} onClose={onClose} wide footer={<button className="btn" onClick={onClose}>Close</button>}>
      <div className="xs dim" style={{ marginBottom: 'var(--s2)' }}>
        {person.description || person.occupations.slice(0, 4).map(titleCaseLabel).join(', ')}
      </div>

      <div className="grid grid-2 gap-4" style={{ marginBottom: 'var(--s3)' }}>
        <div>
          <div className="xs dim" style={{ marginBottom: 4 }}>What The Record Holds</div>
          {person.birth || person.birthYear ? (
            <div className="xs" style={{ padding: '2px 0' }}>
              <span className="dim">Born</span> <span className="strong">{person.birth ?? person.birthYear}</span>
              {age !== undefined && (
                <span className="dim"> · {age}{person.death ? ' at death' : ''}{ageIsApproximate(person) ? ' or thereabouts' : ''}</span>
              )}
              {person.bornIn && <span className="dim"> · {person.bornIn}</span>}
              {ageIsApproximate(person) && <span className="dim"> · the record has the year, not the day</span>}
            </div>
          ) : (
            <div className="xs dim" style={{ padding: '2px 0' }}>No date of birth on record.</div>
          )}
          {person.death && <div className="xs" style={{ padding: '2px 0' }}><span className="dim">Died</span> <span className="strong">{person.death}</span></div>}
          {person.citizenship.length > 0 && (
            <div className="xs" style={{ padding: '2px 0' }}><span className="dim">From</span> <span className="strong">{person.citizenship.join(', ')}</span></div>
          )}
          {person.startYear && <div className="xs" style={{ padding: '2px 0' }}><span className="dim">Working since</span> <span className="strong">{person.startYear}</span></div>}
          <div className="xs" style={{ padding: '2px 0' }}>
            <span className="dim">Credits on file</span> <span className="strong">{credits.length}</span>
            <span className="dim"> · awards on file</span> <span className="strong">{awards.length}</span>
          </div>
          {person.memberOf.length > 0 && (
            <div className="xs" style={{ padding: '2px 0', overflowWrap: 'anywhere' }}><span className="dim">Member of</span> {person.memberOf.join(', ')}</div>
          )}
          {person.employers.length > 0 && (
            <div className="xs" style={{ padding: '2px 0', overflowWrap: 'anywhere' }}><span className="dim">Signed to</span> <span className="strong">{person.employers.join(', ')}</span></div>
          )}
        </div>
        <div>
          <div className="xs dim" style={{ marginBottom: 4 }}>Attached To</div>
          {franchises.length === 0 && companies.length === 0 && <div className="xs dim">Nothing on the record ties them to a franchise.</div>}
          {franchises.length > 0 && (
            <div className="row wrap gap-1" style={{ marginBottom: 4 }}>
              {franchises.slice(0, 8).map((name) => <span key={name} className="chip chip-accent">{name}</span>)}
            </div>
          )}
          {companies.length > 0 && (
            <div className="xs dim" style={{ overflowWrap: 'anywhere' }}>
              Turns up most at {companies.map((c) => `${c.name} (${c.titles})`).join(', ')}.
            </div>
          )}
        </div>
      </div>

      {sheets.length > 1 && (
        <div className="row wrap gap-1" style={{ marginBottom: 'var(--s3)' }}>
          <span className="xs dim" style={{ alignSelf: 'center' }}>Rated as</span>
          {sheets.map((option) => (
            <button
              key={option}
              className="chip"
              aria-pressed={role === option}
              style={role === option ? { background: 'var(--accent-dim)', color: 'var(--accent-strong)', borderColor: 'var(--accent-line)' } : undefined}
              onClick={() => setRole(option)}
            >
              {CRAFT_ROLE_LABEL[option]}
            </button>
          ))}
        </div>
      )}

      <Tabs active={tab} onChange={setTab} tabs={[
        { id: 'attributes', label: 'Attributes', badge: sheet.length },
        { id: 'filmography', label: 'Filmography', badge: credits.length },
        { id: 'awards', label: 'Awards', badge: awards.length },
        { id: 'save', label: 'In This Save', badge: saveWork.length },
      ]} />

      {tab === 'attributes' && (
        <>
          <div className="callout callout-accent">
            <div className="xs">
              <span className="strong">These are SLATE's reading, not a published figure.</span> They are derived from what
              this person has made as {CRAFT_ROLE_LABEL[role].toLowerCase()} and how it was received — {evidence
                ? `${evidence.credits} credit${evidence.credits === 1 ? '' : 's'}${evidence.ratedCount > 0 ? `, ${evidence.ratedCount} of them rated (${evidence.rating.toFixed(1)} average)` : ', none of them rated'}${evidence.wins > 0 ? `, ${evidence.wins} award${evidence.wins === 1 ? '' : 's'} won` : ''}`
                : 'no credits on file in this capacity'}.
              {' '}Confidence in the reading: {confidence} out of 100{confidence < 40 ? ', which is thin.' : '.'}
            </div>
          </div>
          {groups.map((group) => (
            <div key={group.group} style={{ marginTop: 'var(--s3)' }}>
              <div className="xs dim" style={{ marginBottom: 4 }}>{group.group}</div>
              <div className="grid grid-2 gap-4">
                {group.attributes.map((attribute) => (
                  <div key={attribute.id} title={attribute.description} style={{ marginBottom: 6 }}>
                    <Meter
                      label={attribute.name}
                      value={attribute.value}
                      hint={attribute.because.length > 0
                        ? `Mostly ${attribute.because.map((b) => b.label.toLowerCase()).join(' and ')}`
                        : 'Nothing in the record moved this either way'}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {tab === 'filmography' && (
        <>
          <div className="row-between" style={{ margin: 'var(--s3) 0' }}>
            <div className="xs dim">
              Every title the record has them on, newest first. A missing rating means nobody has scored it, not that it is bad.
            </div>
            <input
              className="search-input" type="search" value={creditFilter} placeholder="Title, year or capacity"
              onChange={(e) => setCreditFilter(e.target.value)} aria-label="Search The Filmography" style={{ width: 200 }}
            />
          </div>
          {shownCredits.length === 0 ? (
            <div className="xs dim">Nothing matches that.</div>
          ) : (
            <div style={{ maxHeight: 420, overflowY: 'auto' }}>
              {shownCredits.map((credit) => (
                <div key={`${credit.workQid}-${credit.roles.join()}`} className="xs" style={{ padding: '4px 0', borderTop: '1px solid var(--line)', overflowWrap: 'anywhere' }}>
                  <span className="mono dim">{credit.year ?? '—'}</span>{' '}
                  <span className="strong">{credit.title}</span>
                  <span className="dim"> · {credit.roles.map(titleCaseLabel).join(', ')}</span>
                  {credit.franchise && <span className="dim"> · {credit.franchise}</span>}
                  {credit.rating !== undefined && <span className="mono"> · {credit.rating.toFixed(1)}</span>}
                  {credit.boxOffice !== undefined && credit.boxOffice > 0 && (
                    <span className="dim"> · {formatMoneyCompact(Math.round(credit.boxOffice * 100))}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'awards' && (
        <div style={{ marginTop: 'var(--s3)' }}>
          {awards.length === 0 ? (
            <div className="xs dim">No awards on the record.</div>
          ) : (
            <>
              <div className="xs dim" style={{ marginBottom: 4 }}>
                {won.length} won, {awards.length - won.length} nominated. From the public record.
              </div>
              <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                {awards.map((award, i) => (
                  <div key={`${award.award}-${award.forWork}-${i}`} className="xs" style={{ padding: '4px 0', borderTop: '1px solid var(--line)', overflowWrap: 'anywhere' }}>
                    <span className={`chip ${award.outcome === 'won' ? 'chip-positive' : ''}`} style={{ marginRight: 6 }}>
                      {award.outcome === 'won' ? 'Won' : 'Nominated'}
                    </span>
                    <span className="strong">{award.award}</span>
                    {award.forWork && <span className="dim"> · {award.forWork}</span>}
                    {award.year && <span className="mono dim"> · {award.year}</span>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'save' && (
        <div style={{ marginTop: 'var(--s3)' }}>
          <div className="callout callout-accent">
            <div className="xs">
              <span className="strong">Everything on this tab is your save, not the record.</span> What somebody
              charges, what they took, and what it did are all simulation. None of it happened, and none of it is
              a claim about {person.name}.
            </div>
          </div>

          {!inSave ? (
            <div className="xs dim" style={{ marginTop: 'var(--s3)' }}>
              Nothing yet. They come into your world the first time you deal with them, or the first time
              somebody else in it hires them.
            </div>
          ) : (
            <>
              <div className="callout" style={{ marginTop: 'var(--s3)' }}>
                <strong className="small">Where You Stand With Them</strong>
                <p className="xs" style={{ margin: '4px 0 0' }}>{feelingAbout(sim, inSave)}</p>
              </div>

              <div className="grid grid-3 gap-4" style={{ marginTop: 'var(--s3)' }}>
                <Stat
                  label="What They Would Cost"
                  value={formatMoney(approachSummary(person, role).quote, { cents: false })}
                  note="SLATE's estimate for one job"
                />
                <Stat label="Made With You" value={history.together} note={history.together > 0 ? `best came out at ${Math.round(history.best)}` : 'nothing yet'} />
                <Stat label="In Your World" value={saveWork.length} note="pictures they are on here" />
              </div>

              {saveWork.length > 0 && (
                <div style={{ marginTop: 'var(--s4)' }}>
                  <div className="xs dim" style={{ marginBottom: 4 }}>What They Are On Here</div>
                  <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                    {saveWork.map((project) => (
                      <div key={project.id} className="xs" style={{ padding: '4px 0', borderTop: '1px solid var(--line)', overflowWrap: 'anywhere' }}>
                        <span className="strong">{project.title}</span>
                        <span className="dim"> · {creditRoleOf(project, inSave.id) ?? 'Cast'}</span>
                        <span className="dim"> · {titleCaseLabel(project.phase.replace(/_/g, ' '))}</span>
                        {project.releaseDate && <span className="dim"> · {formatDate(project.releaseDate, sim.homeZone)}</span>}
                        {project.finalQuality !== undefined && <span className="mono dim"> · {Math.round(project.finalQuality)}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {saveContracts.length > 0 && (
                <div style={{ marginTop: 'var(--s4)' }}>
                  <div className="xs dim" style={{ marginBottom: 4 }}>Paper With You</div>
                  {saveContracts.map((contract) => (
                    <div key={contract.id} className="xs" style={{ padding: '4px 0', borderTop: '1px solid var(--line)', overflowWrap: 'anywhere' }}>
                      <span className="strong">{contract.title}</span>
                      <span className="dim"> · {formatMoney(contract.compensation, { cents: false })}</span>
                      <span className="dim"> · {titleCaseLabel(contract.status)}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
