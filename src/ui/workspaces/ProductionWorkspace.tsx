/**
 * SLATE — the production floor.
 *
 * One picture at a time, from a title to a run, with every door that has shut behind
 * it visible on the way. The screen exists because the engine's production commands
 * had nothing calling them, and a command nobody can reach is engine work the game
 * does not have — which `tests/interface.test.ts` states as the thing that must stay
 * true.
 *
 * The page decides nothing. Every control runs a command and every figure is read
 * from the world, so a person engaged here changes what the shape panel will accept
 * without anybody redrawing it.
 *
 * ## Why refusals are shown rather than controls hidden
 *
 * A disabled button teaches nothing. Every step renders its own refusal in the
 * player's words — *the shape is settled, everybody engaged was priced against this
 * much work* — because the refusal is the mechanic. Hiding it would leave a form.
 */

import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Empty } from '@/ui/components/primitives';
import { formatMoney } from '@/engine/core/money';
import { FORMATS, FORMAT_BY_ID, CHANNEL_LABEL, type Channel } from '@/engine/content/format';
import { postsFor } from '@/engine/content/craft';
import { MONTH_SAID } from '@/engine/content/release';
import { MOST_POINTS, THRESHOLD_AT, type DealKind } from '@/engine/content/talent';
import {
  ATTENTION, DIALS, DIAL_BY_ID, GENRES, MOST, genreById, leftToSpend, servesIts,
} from '@/engine/content/story';
import { carriedInto } from '@/engine/content/source';
import { ancillariesFor, type AncillaryDeal } from '@/engine/content/ancillary';
import {
  LOCKS, LOCK_SAID, feesOn, isLocked, offersFor, pointsGiven, shortlistFor,
  whyNotCommit, whyNotFollowUp, whyNotJoin, whyNotOpen, whyNotShape, whyNotWriteIt,
  dialsOn, sourceOf,
  offersOnIt,
  type Lock,
} from '@/engine/world/production';
import { theWeeksAhead } from '@/engine/world/field';
import { receivedBy, costOf } from '@/engine/world/takings';
import { companyCash, projectsOf } from '@/engine/world/company';
import type { Project } from '@/engine/domain/company';

const MS_WEEK = 7 * 24 * 60 * 60 * 1000;

export function ProductionWorkspace() {
  const slate = useWorld((s) => projectsOf(s.universe));
  const cash = useWorld((s) => companyCash(s.universe));
  const [chosenId, setChosenId] = useState<string | undefined>(undefined);

  if (slate.length === 0) {
    return (
      <Empty
        title="An Empty Slate"
        body="Put something on the slate from the business screen first. A production floor
              with no production on it is a room."
      />
    );
  }
  const project = slate.find((p) => p.id === chosenId) ?? slate[0]!;

  return (
    <div className="stack">
      <Panel title="The Slate" tight>
        <div className="field">
          <label htmlFor="which">Which Picture</label>
          <select id="which" value={project.id} onChange={(e) => setChosenId(e.target.value)}>
            {slate.map((one) => (
              <option key={one.id} value={one.id}>
                {one.title}{one.shelvedAt ? ' (shelved)' : ''} — {one.stage}
              </option>
            ))}
          </select>
        </div>
        <p className="xs dim" style={{ margin: 0 }}>
          The company has {formatMoney(cash, { cents: false })}.
        </p>
      </Panel>

      <Settled project={project} />
      <WritePanel project={project} />
      <ShapePanel project={project} />
      <EngagePanel project={project} />
      <SellPanel project={project} />
      <CommitPanel project={project} />
      <OpenPanel project={project} />
      <OutPanel project={project} />
    </div>
  );
}

function Settled({ project }: { project: Project }) {
  return (
    <Panel title="What Is Settled" tight>
      <ul className="plain small">
        {LOCKS.map((lock: Lock) => (
          <li key={lock}>
            <strong>{isLocked(project, lock) ? 'Shut' : 'Open'}</strong> — {LOCK_SAID[lock]}
          </li>
        ))}
      </ul>
      <p className="xs dim" style={{ margin: 0 }}>
        Each shuts on its own as you go and none of them re-opens. Anybody who took a
        share of the back end priced it against the shape they were told about.
      </p>
    </Panel>
  );
}

function ShapePanel({ project }: { project: Project }) {
  const { run } = useGame();
  const [formatId, setFormatId] = useState(project.formatId ?? 'feature');
  const [parts, setParts] = useState(project.parts?.length ?? 1);
  const [mins, setMins] = useState(Math.round((project.secondsEach ?? 110 * 60) / 60));
  const [said, setSaid] = useState<string | undefined>(undefined);
  const [world, setWorld] = useState(project.universeId ?? '');
  const format = FORMAT_BY_ID[formatId];
  const joinRefusal = useWorld(
    (s) => whyNotJoin(s, { projectId: project.id, universeId: world }),
    [project.id, world, project.formatId],
  );
  const putInWorld = () => {
    const done = run<{ ok: boolean; error?: string }>(
      'production.join', { projectId: project.id, universeId: world }, { silent: true },
    );
    setSaid(done.value?.error ?? (done.value?.ok ? `In ${world}.` : done.error));
  };
  const refusal = useWorld(
    (s) => whyNotShape(s, { projectId: project.id, formatId, parts, secondsEach: mins * 60 }),
    [project.id, formatId, parts, mins],
  );

  const settle = () => {
    const done = run<{ ok: boolean; error?: string }>(
      'production.shape',
      { projectId: project.id, formatId, parts, secondsEach: mins * 60 },
      { silent: true },
    );
    setSaid(done.value?.error ?? (done.value?.ok ? 'Settled.' : done.error));
  };

  return (
    <Panel title="What Shape It Is" tight>
      <div className="field">
        <label htmlFor="format">Format</label>
        <select id="format" value={formatId} onChange={(e) => setFormatId(e.target.value)}>
          {FORMATS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
        </select>
      </div>
      {format ? <p className="xs dim">{format.what}</p> : null}
      <div className="field">
        <label htmlFor="parts">
          Parts {format ? `(${format.parts.least}–${format.parts.most})` : ''}
        </label>
        <input id="parts" type="number" value={parts}
          onChange={(e) => setParts(Number(e.target.value) || 1)} />
      </div>
      <div className="field">
        <label htmlFor="mins">
          Minutes each {format
            ? `(${Math.round(format.secondsEach.least / 60)}–${Math.round(format.secondsEach.most / 60)})`
            : ''}
        </label>
        <input id="mins" type="number" value={mins}
          onChange={(e) => setMins(Number(e.target.value) || 1)} />
      </div>
      {format ? (
        <p className="xs dim">
          Can be sold: {format.channels.map((c) => CHANNEL_LABEL[c]).join(', ')}. It expects a
          campaign of about {formatMoney(format.expectsCampaignCents, { cents: false })}.
        </p>
      ) : null}
      {refusal ? <p className="small warn">{refusal}</p> : null}
      {said ? <p className="small">{said}</p> : null}
      <button className="btn btn-primary" onClick={settle} disabled={refusal !== undefined}>
        Settle The Shape
      </button>

      <div className="field" style={{ marginTop: '0.6rem' }}>
        <label htmlFor="world">Part Of A Shared World</label>
        <input id="world" value={world} placeholder="Leave empty for a world of its own"
          onChange={(e) => setWorld(e.target.value)} />
        <p className="xs dim" style={{ margin: 0 }}>
          Two pictures can share a world without sharing a story. It carries about half
          what a direct follow-up does, and it tires on how much of it there is.
        </p>
      </div>
      {joinRefusal ? <p className="small warn">{joinRefusal}</p> : null}
      <button className="btn" onClick={putInWorld} disabled={joinRefusal !== undefined}>
        Put It In That World
      </button>
    </Panel>
  );
}

function EngagePanel({ project }: { project: Project }) {
  const { run } = useGame();
  const [postId, setPostId] = useState('director');
  const [said, setSaid] = useState<string | undefined>(undefined);
  const posts = postsFor(project.medium);
  const post = posts.find((p) => p.id === postId) ?? posts[0]!;
  const parts = project.parts?.length ?? 1;
  const shortlist = useWorld(
    (s) => shortlistFor(s, project.id, postId),
    [project.id, postId, project.parts?.length],
  );

  const take = (talentId: string, dealKind: DealKind) => {
    const done = run<{ ok: boolean; error?: string }>(
      'production.engage', { projectId: project.id, postId, talentId, dealKind }, { silent: true },
    );
    setSaid(done.value?.error ?? (done.value?.ok ? 'Engaged. The shape is now settled.' : done.error));
  };

  return (
    <Panel title="Who Is On It" tight>
      <div className="field">
        <label htmlFor="post">Post</label>
        <select id="post" value={postId} onChange={(e) => setPostId(e.target.value)}>
          {posts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}{project.engaged?.[p.id] ? ` — ${project.engaged[p.id]!.name}` : ''}
            </option>
          ))}
        </select>
      </div>
      <p className="xs dim">{post.what}</p>
      <ul className="plain small">
        {shortlist.map((one) => {
          const offers = offersFor(one, parts);
          return (
            <li key={one.id} style={{ marginBottom: '0.4rem' }}>
              <strong>{one.name}</strong>
              {one.worked > 0 ? ` — worked for us ${one.worked} time${one.worked === 1 ? '' : 's'}` : ''}
              <br />
              <button className="btn btn-sm" onClick={() => take(one.id, 'fee')}>
                {formatMoney(offers.fee.feeCents, { cents: false })} flat
              </button>
              {post.aboveTheLine ? (
                <>
                  {' '}
                  <button className="btn btn-sm" onClick={() => take(one.id, 'points')}>
                    {formatMoney(offers.points.feeCents, { cents: false })} and{' '}
                    {offers.points.points}% of what comes in
                  </button>
                  {' '}
                  <button className="btn btn-sm" onClick={() => take(one.id, 'threshold')}>
                    {formatMoney(offers.threshold.feeCents, { cents: false })} and a bonus
                    {' '}past {THRESHOLD_AT}x
                  </button>
                </>
              ) : null}
              {offers.fee.feeCents > offers.fee.theyGetCents ? (
                <p className="xs dim" style={{ margin: '3px 0 0' }}>
                  They see {formatMoney(offers.fee.theyGetCents, { cents: false })} of the flat
                  fee. The rest is their agent.
                </p>
              ) : (
                <p className="xs dim" style={{ margin: '3px 0 0' }}>
                  Nobody represents them, so the price is the price.
                </p>
              )}
            </li>
          );
        })}
      </ul>
      <p className="xs dim">
        {formatMoney(feesOn(project), { cents: false })} owed at the greenlight.{' '}
        {pointsGiven(project)}% of the back end given away, of {MOST_POINTS}% possible.
      </p>
      {said ? <p className="small">{said}</p> : null}
    </Panel>
  );
}

function CommitPanel({ project }: { project: Project }) {
  const { run } = useGame();
  const [said, setSaid] = useState<string | undefined>(undefined);
  const refusal = useWorld((s) => whyNotCommit(s, project.id), [project.id, project.stage]);

  const go = () => {
    const done = run<{ ok: boolean; error?: string; cents?: number }>(
      'production.commit', { projectId: project.id }, { silent: true },
    );
    setSaid(done.value?.error ?? (done.value?.ok
      ? `Committed. ${formatMoney(done.value.cents ?? 0, { cents: false })} paid out.`
      : done.error));
  };
  const shelve = () => {
    const done = run<{ ok: boolean; error?: string }>(
      'production.shelve',
      { projectId: project.id, off: project.shelvedAt !== undefined },
      { silent: true },
    );
    setSaid(done.value?.error ?? (done.value?.ok ? 'Done.' : done.error));
  };

  return (
    <Panel title="Committing" tight>
      <p className="small">
        Fees go out now, before a frame exists. A picture that fails still cost every
        penny of the people who made it — which is what the standing you chose was a bet on.
      </p>
      {refusal ? <p className="small warn">{refusal}</p> : null}
      {said ? <p className="small">{said}</p> : null}
      <button className="btn btn-primary" onClick={go} disabled={refusal !== undefined}>
        Greenlight It
      </button>{' '}
      <button className="btn btn-ghost" onClick={shelve}>
        {project.shelvedAt ? 'Take It Off The Shelf' : 'Shelve It'}
      </button>
    </Panel>
  );
}

function OpenPanel({ project }: { project: Project }) {
  const { run } = useGame();
  const format = FORMAT_BY_ID[project.formatId ?? ''];
  const [channel, setChannel] = useState<Channel>(format?.channels[0] ?? 'theatrical');
  const [weeksOut, setWeeksOut] = useState(8);
  const [campaign, setCampaign] = useState(format?.expectsCampaignCents ?? 0);
  const [said, setSaid] = useState<string | undefined>(undefined);
  const [receipt, setReceipt] = useState<readonly string[]>([]);

  const ahead = useWorld((s) => theWeeksAhead(s, s.now, channel, 26), [channel]);
  const at = useWorld((s) => s.now + weeksOut * MS_WEEK, [weeksOut]);
  const refusal = useWorld(
    (s) => whyNotOpen(s, { projectId: project.id, channel, at: s.now + weeksOut * MS_WEEK, campaignCents: campaign }),
    [project.id, project.stage, channel, weeksOut, campaign],
  );

  const out = () => {
    const done = run<{ ok: boolean; error?: string; reckonedCents?: number; receipt?: string[] }>(
      'production.open',
      { projectId: project.id, channel, at, campaignCents: campaign },
      { silent: true },
    );
    if (done.value?.ok) {
      setReceipt(done.value.receipt ?? []);
      setSaid(`Out. Reckoned at ${formatMoney(done.value.reckonedCents ?? 0, { cents: false })} `
        + 'across the run, paid week by week from here.');
    } else setSaid(done.value?.error ?? done.error);
  };

  return (
    <Panel title="Letting It Out" tight>
      <div className="field">
        <label htmlFor="channel">Where It Opens</label>
        <select id="channel" value={channel} onChange={(e) => setChannel(e.target.value as Channel)}>
          {(format?.channels ?? (['theatrical'] as Channel[])).map((c) => (
            <option key={c} value={c}>{CHANNEL_LABEL[c]}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="week">Which Week</label>
        <select id="week" value={weeksOut} onChange={(e) => setWeeksOut(Number(e.target.value))}>
          {ahead.map((w, i) => (
            <option key={w.at} value={i}>
              {MONTH_SAID[new Date(w.at).getUTCMonth()]} {new Date(w.at).getUTCDate()} —{' '}
              {Math.round(w.crowding * 100)}% taken
              {w.against.length > 0 ? ` (${w.against.map((a) => a.who).join(', ')})` : ' (clear)'}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="campaign">Campaign</label>
        <input id="campaign" type="number" value={Math.round(campaign / 100)}
          onChange={(e) => setCampaign(Math.round((Number(e.target.value) || 0) * 100))} />
        {format ? (
          <p className="xs dim" style={{ margin: 0 }}>
            {format.label} expects about {formatMoney(format.expectsCampaignCents, { cents: false })}.
            Spending under that is worse than spending nothing.
          </p>
        ) : null}
      </div>
      {refusal ? <p className="small warn">{refusal}</p> : null}
      {said ? <p className="small">{said}</p> : null}
      {receipt.length > 0 ? (
        <pre className="xs" style={{ whiteSpace: 'pre-wrap' }}>{receipt.join('\n')}</pre>
      ) : null}
      <button className="btn btn-primary" onClick={out} disabled={refusal !== undefined}>
        Open It
      </button>
    </Panel>
  );
}

function OutPanel({ project }: { project: Project }) {
  const { run } = useGame();
  const [title, setTitle] = useState('');
  const [said, setSaid] = useState<string | undefined>(undefined);
  const received = useWorld((s) => receivedBy(s, project.id), [project.id]);
  const cost = useWorld((s) => costOf(s, project.id), [project.id]);
  const refusal = useWorld((s) => whyNotFollowUp(s, project.id), [project.id]);

  if (!project.opening) return null;
  const again = () => {
    const done = run<{ ok: boolean; error?: string; inherits?: number }>(
      'production.follow_up', { projectId: project.id, title: title || `${project.title} II` },
      { silent: true },
    );
    setSaid(done.value?.error ?? (done.value?.ok
      ? `On the slate. It would open at ${(done.value.inherits ?? 1).toFixed(2)}x what it `
        + 'would alone.'
      : done.error));
  };

  return (
    <Panel title="Since It Came Out" tight>
      <p className="small">
        Week {project.opening.weeksPaid} of its life. In:{' '}
        {formatMoney(received, { cents: false })}. Out: {formatMoney(cost, { cents: false })}.
      </p>
      <p className="xs dim">
        The windows open on their own dates — abroad at six weeks, home at fourteen, a
        service at thirty, a broadcaster at a year. Anybody on points takes their share
        as each one lands.
      </p>
      <div className="field">
        <label htmlFor="again">Follow It With</label>
        <input id="again" value={title} placeholder={`${project.title} II`}
          onChange={(e) => setTitle(e.target.value)} />
      </div>
      {refusal ? <p className="small warn">{refusal}</p> : null}
      {said ? <p className="small">{said}</p> : null}
      <button className="btn btn-primary" onClick={again} disabled={refusal !== undefined}>
        Make Another
      </button>
    </Panel>
  );
}

/**
 * The authoring panel: a genre, and six dials paid for out of one pool.
 *
 * The pool is shown as what is left rather than as what is spent, because the
 * question in front of the player is always "can I afford another point of this",
 * and a screen that made them do the subtraction would be a form.
 */
function WritePanel({ project }: { project: Project }) {
  const { run } = useGame();
  const [genreId, setGenreId] = useState(project.genreId ?? 'drama');
  const [dials, setDials] = useState<Record<string, number>>({ ...dialsOn(project) });
  const [said, setSaid] = useState<string | undefined>(undefined);
  const genre = genreById(genreId);
  const carried = useWorld((s) => carriedInto(sourceOf(s, project)), [project.id, project.holdingId]);
  const refusal = useWorld(
    (s) => whyNotWriteIt(s, { projectId: project.id, genreId, dials }),
    [project.id, genreId, JSON.stringify(dials)],
  );

  const write = () => {
    const done = run<{ ok: boolean; error?: string }>(
      'production.write', { projectId: project.id, genreId, dials }, { silent: true },
    );
    setSaid(done.value?.error ?? (done.value?.ok ? 'Written.' : done.error));
  };

  return (
    <Panel title="What It Is" tight>
      <div className="field">
        <label htmlFor="genre">Genre</label>
        <select id="genre" value={genreId} onChange={(e) => setGenreId(e.target.value)}>
          {GENRES.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
        </select>
      </div>
      {genre ? <p className="xs dim">{genre.what}</p> : null}
      {DIALS.map((d) => (
        <div className="field" key={d}>
          <label htmlFor={`d-${d}`}>
            {DIAL_BY_ID[d]!.label} — {dials[d] ?? 0} of {MOST}
            {genre && genre.wants[d] >= 2 ? ' · this audience came for it' : ''}
          </label>
          <input
            id={`d-${d}`} type="range" min={0} max={MOST} value={dials[d] ?? 0}
            onChange={(e) => setDials({ ...dials, [d]: Number(e.target.value) })}
          />
          <p className="xs dim" style={{ margin: 0 }}>{DIAL_BY_ID[d]!.what}</p>
        </div>
      ))}
      <p className="small">
        {leftToSpend(dials, carried)} of {ATTENTION + carried} points left.
        {carried > 0 ? ` The material carries ${carried} of them.` : ''}
        {genre ? ` The page serves its audience at ${servesIts(genre, dials).toFixed(2)}.` : ''}
      </p>
      {refusal ? <p className="small warn">{refusal}</p> : null}
      {said ? <p className="small">{said}</p> : null}
      <button className="btn btn-primary" onClick={write} disabled={refusal !== undefined}>
        Write It
      </button>
    </Panel>
  );
}

/**
 * What can be sold off the picture before it opens, and on what terms.
 *
 * The producer is on the other side of the table here. A guarantee is money
 * somebody committed while the outcome was unknown, so it is the cash to reach for
 * when the greenlight is short — and a share is the better end of it if you turn
 * out to be right.
 */
function SellPanel({ project }: { project: Project }) {
  const { run } = useGame();
  const [said, setSaid] = useState<string | undefined>(undefined);
  const could = ancillariesFor(project.genreId);

  const take = (ancillaryId: string, kind: AncillaryDeal) => {
    const done = run<{ ok: boolean; error?: string; cents?: number }>(
      'production.sell', { projectId: project.id, ancillaryId, kind }, { silent: true },
    );
    setSaid(done.value?.error ?? (done.value?.ok
      ? (done.value.cents ? `Signed. ${formatMoney(done.value.cents, { cents: false })} in.` : 'Signed.')
      : done.error));
  };

  return (
    <Panel title="Sold Off It" tight>
      {could.length === 0 ? (
        <p className="small">
          Nobody is buying merchandise or a soundtrack off this one. That is a fact
          about the genre, not a mark against the picture.
        </p>
      ) : could.map((one) => {
        const offers = offersOnIt(project, one);
        const done = project.ancillaries?.[one.id];
        return (
          <div key={one.id} style={{ marginBottom: '0.5rem' }}>
            <strong>{one.label}</strong>
            <p className="xs dim" style={{ margin: '2px 0 5px' }}>{one.what}</p>
            {done ? (
              <p className="small">
                {done.kind === 'guarantee'
                  ? `Sold for ${formatMoney(done.guaranteeCents, { cents: false })}, paid.`
                  : `Sold for ${(done.share * 100).toFixed(1)}% of what comes in.`}
              </p>
            ) : (
              <>
                <button className="btn btn-sm" onClick={() => take(one.id, 'guarantee')}>
                  {formatMoney(offers.guarantee.guaranteeCents, { cents: false })} now
                </button>{' '}
                <button className="btn btn-sm" onClick={() => take(one.id, 'share')}>
                  {(offers.share.share * 100).toFixed(1)}% of what comes in
                </button>
              </>
            )}
          </div>
        );
      })}
      {said ? <p className="small">{said}</p> : null}
    </Panel>
  );
}
