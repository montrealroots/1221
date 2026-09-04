/**
 * SLATE — going to somebody by name.
 *
 * The other way to fill a part. A breakdown is a room full of people you have
 * never heard of; this is the phone call to somebody you have. It is the same
 * search that runs the People tab, narrowed to who could actually do this job
 * on this picture, with what SLATE reckons they would cost and how likely they
 * are to say yes.
 *
 * Two things are kept straight on every screen here. What the record holds —
 * their name, what they have made, what they have won — is theirs and is never
 * edited. What it costs to hire them and whether they take your call is SLATE's
 * estimate, is labelled as one, and is not a claim about anybody's real fee or
 * real availability.
 */

import { useMemo, useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Modal, Empty, Meter } from '@/ui/components/primitives';
import { formatMoney, formatMoneyCompact } from '@/engine/core/money';
import { titleCaseLabel } from '@/engine/core/text';
import { redactForPlayer } from '@/engine/core/audit';
import {
  ageIsApproximate, ageOf, awardsFor, creditsFor, franchisesOf, isPeopleLoaded,
  type PersonRecord,
} from '@/engine/content/people';
import { CRAFT_ROLE_LABEL, type CraftRole } from '@/engine/content/craft-attributes';
import { approachSummary, candidatesFor } from '@/engine/systems/real-people';
import type { AuditRecord } from '@/engine/core/audit';

interface Answer {
  ok: boolean;
  accepted: boolean;
  name: string;
  amount: number;
  wanted: number;
  reason: string;
  audit?: AuditRecord;
}

/**
 * One person as they read on a list you are choosing from: what they have done,
 * what they are worth, and how hard they will be to get.
 */
function CandidateRow({
  record, role, age, selected, onSelect,
}: {
  record: PersonRecord;
  role: CraftRole;
  age?: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const summary = approachSummary(record, role);
  const credits = creditsFor(record.qid);
  const won = awardsFor(record.qid).filter((a) => a.outcome === 'won').length;
  const franchises = franchisesOf(record.qid);
  const recent = credits
    .filter((credit) => credit.year)
    .sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
    .slice(0, 3)
    .map((credit) => credit.title);

  return (
    <button className="list-item" aria-selected={selected} onClick={onSelect}>
      <div className="grow">
        <div className="row wrap gap-1" style={{ alignItems: 'baseline' }}>
          <span className="small strong">{record.name}</span>
          {age !== undefined && <span className="xs dim">{age}{ageIsApproximate(record) ? ' Or So' : ''}</span>}
          {won > 0 && <span className="chip chip-accent">{won} Won</span>}
        </div>
        <div className="xs dim">
          {credits.length || record.creditCount} Credits
          {recent.length > 0 && ` · ${recent.join(', ')}`}
        </div>
        {franchises.length > 0 && (
          <div className="row wrap gap-1" style={{ marginTop: 3 }}>
            {franchises.slice(0, 3).map((franchise) => (
              <span key={franchise} className="chip">{franchise}</span>
            ))}
          </div>
        )}
      </div>
      <div style={{ textAlign: 'right', minWidth: 92 }}>
        <div className="small mono">{formatMoneyCompact(summary.quote)}</div>
        <div className="xs dim">{summary.standing} Craft · {summary.demand} Busy</div>
      </div>
    </button>
  );
}

/** The audit, shown in the room rather than filed away in it. */
function Reasons({ audit }: { audit: AuditRecord }) {
  const shown = redactForPlayer(audit).factors;
  return (
    <div className="list" style={{ marginTop: 'var(--s3)' }}>
      {shown.map((factor) => (
        <div key={factor.label} className="list-item list-static" style={{ display: 'block' }}>
          <div className="row-between">
            <span className="xs strong">{factor.label}</span>
            <span className={`xs mono ${factor.contribution >= 0 ? 'positive' : 'negative'}`}>
              {factor.contribution >= 0 ? '+' : ''}{Math.round(factor.contribution * 100)}
            </span>
          </div>
          <div className="xs muted">{factor.detail}</div>
        </div>
      ))}
    </div>
  );
}

/**
 * Take a part to an actor by name.
 *
 * The list is filtered by the age the part is written for, read off their real
 * date of birth. Nobody already in the picture appears, because nobody plays
 * two parts in the same film.
 */
export function OfferRealDialog({ roleId, onClose }: { roleId: string; onClose: () => void }) {
  const { sim, run } = useGame();
  const role = useWorld((s) => s.universe.roles[roleId]);
  const project = useWorld((s) => (role ? s.universe.projects[role.projectId] : undefined));
  const [query, setQuery] = useState('');
  const [chosen, setChosen] = useState<string | null>(null);
  const [offer, setOffer] = useState<string>('');
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [shown, setShown] = useState(24);

  const loaded = isPeopleLoaded();
  const inPicture = useMemo(
    () => new Set((project?.castIds ?? []).map((id) => sim.universe.people[id]?.recordQid).filter(Boolean)),
    [project?.castIds, sim],
  );

  const rows = useMemo(() => {
    if (!loaded || !role) return [];
    return candidatesFor('actor', { query, limit: 400 })
      .map((record) => ({ record, age: ageOf(record, sim.now) }))
      // The part is written for an age. Their real date of birth decides.
      .filter(({ age }) => age === undefined || (age >= role.ageRange[0] - 6 && age <= role.ageRange[1] + 8))
      .filter(({ record }) => !inPicture.has(record.qid));
  }, [loaded, role, query, sim.now, inPicture]);

  const record = chosen ? rows.find((r) => r.record.qid === chosen)?.record : undefined;
  const summary = record ? approachSummary(record, 'actor') : undefined;
  const prior = (role?.offers ?? []).filter((entry) => entry.recordQid === chosen);
  const asking = offer.trim() === '' ? (summary?.quote ?? 0) : Math.round(Number(offer) * 100);

  if (!role || !project) return null;

  const send = () => {
    if (!record) return;
    const result = run<{ accepted: boolean; name: string; amount: number; wanted: number; reason: string }>(
      'cast.offer_real',
      { roleId: role.id, qid: record.qid, amount: asking },
      { silent: true },
    );
    if (!result.ok || !result.value) {
      setAnswer({ ok: false, accepted: false, name: record.name, amount: asking, wanted: summary?.quote ?? 0, reason: result.error ?? 'That could not be sent.' });
      return;
    }
    const audit = sim.universe.audits
      .filter((entry) => entry.kind === 'cast.real_offer_decided' && entry.subjectId === role.id)
      .slice(-1)[0];
    setAnswer({
      ok: true,
      accepted: result.value.accepted,
      name: result.value.name,
      amount: result.value.amount,
      wanted: result.value.wanted,
      reason: result.value.reason,
      audit,
    });
  };

  return (
    <Modal
      title={`Offer ${role.characterName}`}
      onClose={onClose}
      wide
      footer={
        <div className="row-between wrap gap-2">
          <span className="xs muted">
            What somebody costs and whether they say yes is SLATE&rsquo;s estimate, not a real fee and not a real answer.
          </span>
          <div className="row gap-2">
            <button className="btn btn-ghost" onClick={onClose}>Close</button>
            {record && !answer?.accepted && (
              <button className="btn btn-primary" onClick={send}>
                Send The Offer
              </button>
            )}
          </div>
        </div>
      }
    >
      {!loaded ? (
        <Empty
          title="The People Are Still Loading"
          body="Who they are and everything they are on comes from the public record, fetched in the background."
        />
      ) : (
        <>
          <div className="callout" style={{ marginBottom: 'var(--s3)' }}>
            <strong className="small">{project.title} — {titleCaseLabel(role.billing.replace(/_/g, ' '))}</strong>
            <p className="xs" style={{ margin: '4px 0 0' }}>
              {role.description} Written for {role.ageRange[0]} to {role.ageRange[1]}. {role.shootDays} shoot days.
              The part is budgeted at {formatMoney(role.payLow, { cents: false })} to {formatMoney(role.payHigh, { cents: false })}.
            </p>
          </div>

          <div className="field">
            <label htmlFor="offer-search">Who You Have In Mind</label>
            <input
              id="offer-search"
              type="search"
              placeholder="A name, a film they are in, or a franchise"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShown(24); }}
            />
          </div>

          <div className="side-by-side">
            <div className="list" style={{ maxHeight: 380, overflowY: 'auto' }}>
              {rows.length === 0 ? (
                <Empty title="Nobody Fits" body="Nobody on the record is the age this part is written for. Rewrite the part or search again." />
              ) : (
                <>
                  {rows.slice(0, shown).map(({ record: person, age }) => (
                    <CandidateRow
                      key={person.qid}
                      record={person}
                      role="actor"
                      age={age}
                      selected={chosen === person.qid}
                      onSelect={() => { setChosen(person.qid); setOffer(''); setAnswer(null); }}
                    />
                  ))}
                  {rows.length > shown && (
                    <button className="btn btn-ghost btn-sm" onClick={() => setShown((n) => n + 40)}>
                      Show More ({rows.length - shown} Left)
                    </button>
                  )}
                </>
              )}
            </div>

            <div>
              {!record || !summary ? (
                <Empty title="Nobody Chosen" body="Pick somebody and the terms appear here." />
              ) : (
                <>
                  <div className="small strong">{record.name}</div>
                  <div className="xs dim" style={{ marginBottom: 'var(--s3)' }}>
                    {record.bornIn ?? record.citizenship[0] ?? 'Where They Are From Is Not On The Record'}
                  </div>
                  <Meter label="Craft, Read From The Work" value={summary.standing} />
                  <Meter label="How Busy They Are" value={summary.demand} invert />
                  <Meter label="How Much The Record Supports This" value={summary.confidence} />

                  <div className="field" style={{ marginTop: 'var(--s3)' }}>
                    <label htmlFor="offer-amount">Your Offer</label>
                    <input
                      id="offer-amount"
                      type="text"
                      inputMode="decimal"
                      placeholder={formatMoney(summary.quote, { cents: false })}
                      value={offer}
                      onChange={(e) => setOffer(e.target.value.replace(/[^0-9.]/g, ''))}
                    />
                    <div className="xs muted" style={{ marginTop: 4 }}>
                      In whole dollars. Leave it empty to offer what SLATE reckons the part is worth to
                      them, which is {formatMoney(summary.quote, { cents: false })}.
                    </div>
                  </div>

                  {prior.length > 0 && (
                    <div className="callout callout-negative" style={{ marginTop: 'var(--s3)' }}>
                      <strong className="xs">
                        {prior.length === 1 ? 'You Have Been Here Once' : `You Have Been Here ${prior.length} Times`}
                      </strong>
                      <p className="xs" style={{ margin: '4px 0 0' }}>
                        Last at {formatMoney(prior[prior.length - 1]?.amount ?? 0, { cents: false })}. Going back needs real money on the table.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {answer && (
            <div className={`callout ${answer.accepted ? 'callout-accent' : 'callout-negative'}`} style={{ marginTop: 'var(--s4)' }}>
              <strong className="small">{answer.reason}</strong>
              {answer.ok && (
                <p className="xs" style={{ margin: '4px 0 0' }}>
                  {answer.accepted
                    ? `Signed at ${formatMoney(answer.amount)}. The contract, the credit and the booking are all on the project now.`
                    : `You offered ${formatMoney(answer.amount)}; SLATE reckons the part is worth ${formatMoney(answer.wanted)} to them.`}
                </p>
              )}
              {answer.audit && <Reasons audit={answer.audit} />}
            </div>
          )}
        </>
      )}
    </Modal>
  );
}

/**
 * Attach a real director, producer, showrunner, cinematographer or composer.
 *
 * The same call, for the chairs rather than the parts. What they are worth is
 * read off their own trade — a cinematographer is not priced like a lead — and
 * a picture with money behind it papers the deal on the spot.
 */
export function ApproachCraftDialog({
  projectId, role, onClose,
}: {
  projectId: string;
  role: Exclude<CraftRole, 'actor'>;
  onClose: () => void;
}) {
  const { sim, run } = useGame();
  const project = useWorld((s) => s.universe.projects[projectId]);
  const [query, setQuery] = useState('');
  const [chosen, setChosen] = useState<string | null>(null);
  const [offer, setOffer] = useState('');
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [shown, setShown] = useState(24);

  const loaded = isPeopleLoaded();
  const attached = useMemo(
    () => new Set((project?.attachments ?? []).map((a) => sim.universe.people[a.personId]?.recordQid).filter(Boolean)),
    [project?.attachments, sim],
  );

  const rows = useMemo(() => {
    if (!loaded) return [];
    return candidatesFor(role, { query, limit: 400 }).filter((record) => !attached.has(record.qid));
  }, [loaded, role, query, attached]);

  const record = chosen ? rows.find((r) => r.qid === chosen) : undefined;
  const summary = record ? approachSummary(record, role) : undefined;
  const asking = offer.trim() === '' ? (summary?.quote ?? 0) : Math.round(Number(offer) * 100);

  if (!project) return null;

  const send = () => {
    if (!record) return;
    const result = run<{ attached: boolean; name: string; amount: number; wanted: number; reason: string }>(
      'film.approach_real',
      { projectId: project.id, qid: record.qid, role, amount: asking },
      { silent: true },
    );
    if (!result.ok || !result.value) {
      setAnswer({ ok: false, accepted: false, name: record.name, amount: asking, wanted: summary?.quote ?? 0, reason: result.error ?? 'That could not be sent.' });
      return;
    }
    const audit = sim.universe.audits
      .filter((entry) => entry.kind === 'film.real_approach_decided' && entry.subjectId === project.id)
      .slice(-1)[0];
    setAnswer({
      ok: true,
      accepted: result.value.attached,
      name: result.value.name,
      amount: result.value.amount,
      wanted: result.value.wanted,
      reason: result.value.reason,
      audit,
    });
  };

  return (
    <Modal
      title={`Approach A ${CRAFT_ROLE_LABEL[role]}`}
      onClose={onClose}
      wide
      footer={
        <div className="row-between wrap gap-2">
          <span className="xs muted">
            What somebody costs and whether they say yes is SLATE&rsquo;s estimate, not a real fee and not a real answer.
          </span>
          <div className="row gap-2">
            <button className="btn btn-ghost" onClick={onClose}>Close</button>
            {record && !answer?.accepted && <button className="btn btn-primary" onClick={send}>Make The Approach</button>}
          </div>
        </div>
      }
    >
      {!loaded ? (
        <Empty
          title="The People Are Still Loading"
          body="Who they are and everything they are on comes from the public record, fetched in the background."
        />
      ) : (
        <>
          <div className="callout" style={{ marginBottom: 'var(--s3)' }}>
            <strong className="small">{project.title}</strong>
            <p className="xs" style={{ margin: '4px 0 0' }}>
              {project.logline}
              {project.scriptQuality > 0
                ? ` The script reads at ${Math.round(project.scriptQuality)} and the package at ${project.packageValue}.`
                : ' Nothing is written yet, which is the first thing anybody will ask about.'}
              {project.greenlitAt && project.financingIds.length > 0
                ? ' There is money behind it, so a yes is papered on the spot.'
                : ' Until it is greenlit and funded, a yes is a deal memo rather than a contract.'}
            </p>
          </div>

          <div className="field">
            <label htmlFor="craft-search">Who You Have In Mind</label>
            <input
              id="craft-search"
              type="search"
              placeholder="A name, a title they worked on, or a franchise"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShown(24); }}
            />
          </div>

          <div className="side-by-side">
            <div className="list" style={{ maxHeight: 380, overflowY: 'auto' }}>
              {rows.length === 0 ? (
                <Empty title="Nobody Found" body="Nothing on the record matches that search in this trade." />
              ) : (
                <>
                  {rows.slice(0, shown).map((person) => (
                    <CandidateRow
                      key={person.qid}
                      record={person}
                      role={role}
                      age={ageOf(person, sim.now)}
                      selected={chosen === person.qid}
                      onSelect={() => { setChosen(person.qid); setOffer(''); setAnswer(null); }}
                    />
                  ))}
                  {rows.length > shown && (
                    <button className="btn btn-ghost btn-sm" onClick={() => setShown((n) => n + 40)}>
                      Show More ({rows.length - shown} Left)
                    </button>
                  )}
                </>
              )}
            </div>

            <div>
              {!record || !summary ? (
                <Empty title="Nobody Chosen" body="Pick somebody and the terms appear here." />
              ) : (
                <>
                  <div className="small strong">{record.name}</div>
                  <div className="xs dim" style={{ marginBottom: 'var(--s3)' }}>
                    {creditsFor(record.qid).length || record.creditCount} Credits On The Record
                  </div>
                  <Meter label="Craft, Read From The Work" value={summary.standing} />
                  <Meter label="How Busy They Are" value={summary.demand} invert />
                  <Meter label="How Much The Record Supports This" value={summary.confidence} />

                  <div className="field" style={{ marginTop: 'var(--s3)' }}>
                    <label htmlFor="craft-amount">Your Offer</label>
                    <input
                      id="craft-amount"
                      type="text"
                      inputMode="decimal"
                      placeholder={formatMoney(summary.quote, { cents: false })}
                      value={offer}
                      onChange={(e) => setOffer(e.target.value.replace(/[^0-9.]/g, ''))}
                    />
                    <div className="xs muted" style={{ marginTop: 4 }}>
                      In whole dollars. Leave it empty to offer what SLATE reckons the job is worth to
                      them, which is {formatMoney(summary.quote, { cents: false })}.
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {answer && (
            <div className={`callout ${answer.accepted ? 'callout-accent' : 'callout-negative'}`} style={{ marginTop: 'var(--s4)' }}>
              <strong className="small">{answer.reason}</strong>
              {answer.ok && (
                <p className="xs" style={{ margin: '4px 0 0' }}>
                  {answer.accepted
                    ? `Attached at ${formatMoney(answer.amount)}.`
                    : `You offered ${formatMoney(answer.amount)}; SLATE reckons the job is worth ${formatMoney(answer.wanted)} to them.`}
                </p>
              )}
              {answer.audit && <Reasons audit={answer.audit} />}
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
