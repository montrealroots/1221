/**
 * SLATE — the production floor.
 *
 * One picture at a time, taken from a title to a run, with every door that has
 * shut behind it visible on the way. The screen exists because the engine's five
 * production commands had nothing calling them, and a command nobody can reach is
 * engine work the game does not have — which `tests/interface.test.ts` states as
 * the thing that has to stay true.
 *
 * The page decides nothing. Every control runs a command and every figure is read
 * from the world, so a head engaged here changes what the shape panel will accept
 * without anybody redrawing it.
 *
 * ## Why the refusals are shown rather than the buttons hidden
 *
 * A disabled control teaches nothing. Every step here renders its own refusal in
 * the player's words — *the heads were engaged against this many parts*, *a
 * micro-series does not open in cinemas, what is open to it is streaming* —
 * because the refusal is the mechanic. Hiding it would leave a form.
 */

import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Empty } from '@/ui/components/primitives';
import { formatMoney } from '@/engine/core/money';
import { FORMATS, FORMAT_BY_ID, CHANNEL_LABEL, type Channel } from '@/engine/content/format';
import { BANDS, DEPARTMENTS, headsCostCents } from '@/engine/content/department';
import { MONTH_SAID } from '@/engine/content/release';
import { theReceipt } from '@/engine/world/boxoffice';
import {
  LOCKS, LOCK_SAID, isLocked, staffingOf, whyNotShape, whyNotStaff, whyNotCommit,
  whyNotRelease, type Lock,
} from '@/engine/world/production';
import { companyCash, projectsOf } from '@/engine/world/company';
import type { Project } from '@/engine/domain/company';

export function ProductionWorkspace() {
  const slate = useWorld((s) => projectsOf(s.universe));
  const cash = useWorld((s) => companyCash(s.universe));
  const [chosenId, setChosenId] = useState<string | undefined>(undefined);

  if (slate.length === 0) {
    return (
      <Empty
        title="An Empty Slate"
        body="Put something on the slate from the business screen first. A production floor with
              no production on it is a room."
      />
    );
  }

  const project = slate.find((p) => p.id === chosenId) ?? slate[0]!;

  return (
    <div className="stack">
      <Panel title="The Slate" tight>
        <div className="field">
          <label htmlFor="which-project">Which picture</label>
          <select
            id="which-project"
            value={project.id}
            onChange={(e) => setChosenId(e.target.value)}
          >
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

      <Locks project={project} />
      <ShapePanel project={project} />
      <HeadsPanel project={project} />
      <CommitPanel project={project} />
      <ReleasePanel project={project} />
    </div>
  );
}

/** What has settled, and what it settled. */
function Locks({ project }: { project: Project }) {
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
        Each of these shuts on its own as you go, and none of them re-opens. That is what makes
        the choices above them weigh anything.
      </p>
    </Panel>
  );
}

// ---------------------------------------------------------------------------

function ShapePanel({ project }: { project: Project }) {
  const { run } = useGame();
  const [formatId, setFormatId] = useState(project.formatId ?? 'feature');
  const [parts, setParts] = useState(project.parts?.length ?? 1);
  const [mins, setMins] = useState(Math.round((project.secondsEach ?? 110 * 60) / 60));
  const [said, setSaid] = useState<string | undefined>(undefined);

  const refusal = useWorld(
    (s) => whyNotShape(s, { projectId: project.id, formatId, parts, secondsEach: mins * 60 }),
    [project.id, formatId, parts, mins],
  );
  const format = FORMAT_BY_ID[formatId];

  const set = () => {
    const answer = run<{ ok: boolean; error?: string }>(
      'production.shape',
      { projectId: project.id, formatId, parts, secondsEach: mins * 60 },
      { silent: true },
    );
    setSaid(answer.value?.error ?? (answer.value?.ok ? 'Settled.' : answer.error));
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
        <input
          id="parts" type="number" value={parts}
          onChange={(e) => setParts(Number(e.target.value) || 1)}
        />
      </div>
      <div className="field">
        <label htmlFor="mins">
          Minutes each {format
            ? `(${Math.round(format.secondsEach.least / 60)}–${Math.round(format.secondsEach.most / 60)})`
            : ''}
        </label>
        <input
          id="mins" type="number" value={mins}
          onChange={(e) => setMins(Number(e.target.value) || 1)}
        />
      </div>
      {format ? (
        <p className="xs dim">
          Can be sold: {format.channels.map((c) => CHANNEL_LABEL[c]).join(', ')}.
          {' '}It expects a campaign of about {formatMoney(format.expectsCampaignCents, { cents: false })}.
        </p>
      ) : null}
      {refusal ? <p className="small warn">{refusal}</p> : null}
      {said ? <p className="small">{said}</p> : null}
      <button className="btn btn-primary" onClick={set} disabled={refusal !== undefined}>
        Settle The Shape
      </button>
    </Panel>
  );
}

// ---------------------------------------------------------------------------

function HeadsPanel({ project }: { project: Project }) {
  const { run } = useGame();
  const standing = staffingOf(project);
  const [posts, setPosts] = useState<Record<string, string>>({ ...standing });
  const [said, setSaid] = useState<string | undefined>(undefined);

  const refusal = useWorld(
    (s) => whyNotStaff(s, { projectId: project.id, posts }),
    [project.id, JSON.stringify(posts)],
  );
  const cost = headsCostCents(posts, project.parts?.length ?? 1);

  const engage = () => {
    const answer = run<{ ok: boolean; error?: string }>(
      'production.staff', { projectId: project.id, posts }, { silent: true },
    );
    setSaid(answer.value?.error ?? (answer.value?.ok ? 'Engaged. The shape is now settled.' : answer.error));
  };

  return (
    <Panel title="The Heads" tight>
      {DEPARTMENTS.map((dept) => (
        <div className="field" key={dept.id}>
          <label htmlFor={`d-${dept.id}`}>{dept.post}</label>
          <select
            id={`d-${dept.id}`}
            value={posts[dept.id] ?? 'working'}
            onChange={(e) => setPosts({ ...posts, [dept.id]: e.target.value })}
          >
            {BANDS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label} — {formatMoney(b.perPartCents, { cents: false })} a part
              </option>
            ))}
          </select>
          <p className="xs dim" style={{ margin: 0 }}>{dept.what}</p>
        </div>
      ))}
      <p className="small">
        They want {formatMoney(cost, { cents: false })} for{' '}
        {project.parts?.length ?? 1} part{(project.parts?.length ?? 1) === 1 ? '' : 's'}.
      </p>
      {refusal ? <p className="small warn">{refusal}</p> : null}
      {said ? <p className="small">{said}</p> : null}
      <button className="btn btn-primary" onClick={engage} disabled={refusal !== undefined}>
        Engage Them
      </button>
    </Panel>
  );
}

// ---------------------------------------------------------------------------

function CommitPanel({ project }: { project: Project }) {
  const { run } = useGame();
  const [said, setSaid] = useState<string | undefined>(undefined);
  const refusal = useWorld((s) => whyNotCommit(s, project.id), [project.id, project.stage]);

  const commit = () => {
    const answer = run<{ ok: boolean; error?: string; cents?: number }>(
      'production.commit', { projectId: project.id }, { silent: true },
    );
    setSaid(answer.value?.error
      ?? (answer.value?.ok ? `Committed. ${formatMoney(answer.value.cents ?? 0, { cents: false })} paid out.` : answer.error));
  };

  const shelve = () => {
    const answer = run<{ ok: boolean; error?: string }>(
      'production.shelve', { projectId: project.id, off: project.shelvedAt !== undefined }, { silent: true },
    );
    setSaid(answer.value?.error ?? (answer.value?.ok ? 'Done.' : answer.error));
  };

  return (
    <Panel title="Committing" tight>
      <p className="small">
        The heads are paid now, out of company cash, before anybody has seen a frame. A picture
        that fails still cost every penny of its crew.
      </p>
      {refusal ? <p className="small warn">{refusal}</p> : null}
      {said ? <p className="small">{said}</p> : null}
      <button className="btn btn-primary" onClick={commit} disabled={refusal !== undefined}>
        Greenlight It
      </button>
      {' '}
      <button className="btn btn-ghost" onClick={shelve}>
        {project.shelvedAt ? 'Take It Off The Shelf' : 'Shelve It'}
      </button>
    </Panel>
  );
}

// ---------------------------------------------------------------------------

function ReleasePanel({ project }: { project: Project }) {
  const { run } = useGame();
  const format = FORMAT_BY_ID[project.formatId ?? ''];
  const [channel, setChannel] = useState<Channel>(format?.channels[0] ?? 'theatrical');
  const [campaign, setCampaign] = useState(format?.expectsCampaignCents ?? 0);
  const [receipt, setReceipt] = useState<readonly string[]>([]);
  const [said, setSaid] = useState<string | undefined>(undefined);

  const refusal = useWorld(
    (s) => whyNotRelease(s, { projectId: project.id, channel, campaignCents: campaign }),
    [project.id, project.stage, channel, campaign],
  );

  const out = () => {
    const answer = run<{
      ok: boolean; error?: string; cents?: number;
      run?: { reckoning: Parameters<typeof theReceipt>[0]; totalCents: number; grossCents: number };
    }>('production.release', {
      projectId: project.id, channel, campaignCents: campaign, field: 0.3,
    }, { silent: true });
    const value = answer.value;
    if (value?.ok && value.run) {
      setReceipt(theReceipt(value.run.reckoning));
      setSaid(`The audience paid ${formatMoney(value.run.grossCents, { cents: false })}. `
        + `${formatMoney(value.cents ?? 0, { cents: false })} reached the company.`);
    } else {
      setSaid(value?.error ?? answer.error);
    }
  };

  return (
    <Panel title="Letting It Out" tight>
      <div className="field">
        <label htmlFor="channel">Where it opens</label>
        <select id="channel" value={channel} onChange={(e) => setChannel(e.target.value as Channel)}>
          {(format?.channels ?? (['theatrical'] as Channel[])).map((c) => (
            <option key={c} value={c}>{CHANNEL_LABEL[c]}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="campaign">Campaign</label>
        <input
          id="campaign" type="number" value={Math.round(campaign / 100)}
          onChange={(e) => setCampaign(Math.round((Number(e.target.value) || 0) * 100))}
        />
        {format ? (
          <p className="xs dim" style={{ margin: 0 }}>
            {format.label} expects about {formatMoney(format.expectsCampaignCents, { cents: false })}.
            Spending under that is worse than spending nothing.
          </p>
        ) : null}
      </div>
      <p className="xs dim">
        It will open in {MONTH_SAID[new Date(Date.now()).getUTCMonth()]} terms — the month a
        picture opens in moves what it takes, and the year has two peaks.
      </p>
      {refusal ? <p className="small warn">{refusal}</p> : null}
      {said ? <p className="small">{said}</p> : null}
      {receipt.length > 0 ? (
        <pre className="xs" style={{ whiteSpace: 'pre-wrap' }}>{receipt.join('\n')}</pre>
      ) : null}
      <button className="btn btn-primary" onClick={out} disabled={refusal !== undefined}>
        Release It
      </button>
    </Panel>
  );
}
