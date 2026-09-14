/**
 * SLATE — the family business.
 *
 * One question, asked at the top and answered all the way down: what is this
 * company allowed to do, and what is stopping it doing more?
 *
 * Everything a production company is made of — the register it is on, the
 * guilds it has signed with, the cover it carries, the rights it holds, the
 * posts it keeps, the slate it is developing — is only interesting because of
 * a door it opens. So this page leads with the doors. Each shut one names the
 * single missing piece of paper that shuts it, and that piece of paper opens.
 *
 * The page does not decide anything. Every control on it runs a command and
 * every fact on it is read from the world, which is why a registration made
 * here changes the answer at the top without anybody redrawing it.
 */

import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Empty, Modal, Stat } from '@/ui/components/primitives';
import { LookRegion, Open } from '@/ui/looks/Look';
import { at } from '@/ui/looks/subject';
import { said, toStart } from '@/ui/looks/words';
import { formatMoney } from '@/engine/core/money';
import { formatDate } from '@/engine/core/time';
import { DELIVERY, plansFor, planById } from '@/engine/content/making';
import { DEALS, dealById } from '@/engine/content/selling';
import { rateById, throughput } from '@/engine/content/inventory';
import { cuttingPeriod } from '@/engine/world/inventory';
import { pullOn, sellsFor, stillToCarry } from '@/engine/world/lot';
import { SELLING } from '@/engine/content/lot';
import { AXES, feeReads } from '@/engine/content/casting';
import {
  askFor, castOf, datesFor, howManyCast, quoteOf, readOf, seatFor, whereTheCastStands, whoCameIn,
} from '@/engine/world/casting';
import {
  AIRDATE_WEEKS, LEAD_WEEKS, LONGEST_SHOOT, canHandOver, windowOf, wouldBe,
} from '@/engine/world/making';
import type { GuildId, PolicyKind, RegistryId, RoleId } from '@/engine/domain/company';
import {
  GUILD_BY_ID, POLICY_BY_ID, REGISTRY_BY_ID, ROLE_BY_ID,
} from '@/engine/content/incorporation';
import {
  americanArm, capabilitiesOf, companyCash, holdingsOf, parentCompany, policiesOf,
  postsOf, projectsOf, registrationsOf, signaturesOf, whereItStands,
  type Blocker, type Capability,
} from '@/engine/world/company';

export function BusinessWorkspace() {
  const company = useWorld((s) => parentCompany(s.universe));
  const doors = useWorld((s) => capabilitiesOf(s));
  const standing = useWorld((s) => whereItStands(s));
  const cash = useWorld((s) => companyCash(s.universe));
  const arm = useWorld((s) => americanArm(s.universe));

  if (!company) {
    return (
      <Empty
        title="There Is No Company"
        body="This save was made before the family formed one, so there’s nothing here to run."
      />
    );
  }

  const open = doors.filter((one) => one.can);

  return (
    // One region around the whole screen, because every name on it is a way
    // into something: the company, a right it holds, a picture on the slate, a
    // register, a guild, a policy, a post. Without it `Open` has nowhere to
    // open into and renders all seven of them as plain text, which is a screen
    // full of things that look like they lead somewhere and do not.
    <LookRegion>
      <div className="row-between" style={{ marginBottom: 'var(--s5)' }}>
        <div>
          <div className="eyebrow">The Family Business</div>
          <h1 style={{ fontSize: 'var(--size-lg)' }}>
            <Open subject={at('firm', company.id)}>{company.legalName}</Open>
          </h1>
          <p className="muted small" style={{ marginTop: 2 }}>{standing}</p>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 'var(--s5)' }}>
        <Stat label="In The Company" value={formatMoney(cash, { cents: false })} note="Its money, not yours" />
        <Stat label="What It Can Do" value={`${open.length}/${doors.length}`} note="Doors open" />
        <Stat
          label="American Arm"
          value={arm ? 'Formed' : 'None'}
          note={arm ? arm.legalName : 'No guild will sign without one'}
        />
      </div>

      <Panel title="What It May Do" tight>
        <p className="muted small" style={{ marginBottom: 'var(--s3)' }}>
          Here are the nine, open or shut. A shut one names the single thing keeping it shut, and
          that thing is a door of its own.
        </p>
        <div className="col gap-2">
          {doors.map((door) => <Door key={door.id} door={door} />)}
        </div>
      </Panel>

      <Holdings />
      <Slate />
      <TheLotsName />
      <Standings />

      <p className="xs dim" style={{ marginTop: 'var(--s5)' }}>
        Every figure the company spends comes out of its own account and is posted to the ledger, so
        the business and the household are never spending the same money twice.
      </p>
    </LookRegion>
  );
}

/** One door, open or shut, and what shuts it. */
function Door({ door }: { door: Capability }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="holding">
      <div className="row-between">
        <div className="grow">
          <div className="row gap-2">
            <span className={`chip ${door.can ? 'chip-accent' : ''}`}>{door.can ? 'Yes' : 'Not Yet'}</span>
            <span className="strong">{door.label}</span>
          </div>
          <div className="small muted" style={{ marginTop: 2 }}>{door.what}</div>
        </div>
        <button className="btn btn-ghost btn-sm" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? 'Less' : door.can ? 'Why' : 'What’s Missing'}
        </button>
      </div>
      {open && (
        <div style={{ marginTop: 'var(--s3)' }}>
          <p className="small">{door.because}</p>
          {door.blockers.length > 0 && (
            <div className="col gap-2" style={{ marginTop: 'var(--s2)' }}>
              {door.blockers.map((blocker) => <Missing key={blocker.need} blocker={blocker} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** One missing thing, and the control that gets it. */
function Missing({ blocker }: { blocker: Blocker }) {
  const { run } = useGame();
  const [error, setError] = useState<string | undefined>();
  const [filling, setFilling] = useState(false);

  const act = (kind: string, payload: Record<string, unknown>) => {
    const answer = run<{ ok: boolean; error?: string }>(kind, payload, { silent: true });
    setError(answer.value?.ok ? undefined : answer.value?.error ?? answer.error);
  };

  const id = blocker.fixId ?? '';
  const control = (() => {
    switch (blocker.fixKind) {
      case 'registry': {
        const facts = REGISTRY_BY_ID[id as RegistryId];
        return facts && { label: `Register With ${facts.body}`, go: () => act('company.register', { registry: id }) };
      }
      case 'arm':
        return { label: 'Form The American Arm', go: () => act('company.form_arm', {}) };
      case 'guild': {
        const facts = GUILD_BY_ID[id as GuildId];
        return facts && facts.signable && { label: `Sign With ${facts.body}`, go: () => act('company.sign', { guild: id }) };
      }
      case 'policy': {
        const facts = POLICY_BY_ID[id as PolicyKind];
        return facts && { label: `Bind ${facts.label}`, go: () => act('company.insure', { policy: id }) };
      }
      // A post is the one blocker that cannot be fixed by pressing a button,
      // because it needs a person and the company has to choose which. It was
      // the only unreachable one, and it shut the greenlight door — so a player
      // could walk every other step of the sequence and stop here for good.
      case 'role':
        return { label: 'Fill The Post', go: () => setFilling(true) };
      default:
        return undefined;
    }
  })();

  return (
    <div className="row-between">
      <div className="grow">
        <div className="small strong">{blocker.need}</div>
        <div className="xs muted">{blocker.how}</div>
        {error && <div className="xs negative" style={{ marginTop: 2 }}>{error}</div>}
      </div>
      {control && <button className="btn btn-sm" onClick={control.go}>{control.label}</button>}
      {filling && (
        <PostForm
          role={id as RoleId}
          onClose={() => setFilling(false)}
          onDone={(said) => { setError(said); if (!said) setFilling(false); }}
        />
      )}
    </div>
  );
}

/**
 * Who sits in a post.
 *
 * A list of everybody the company could ask, which at the start of a save is
 * three people and two of them are your parents. That is the honest shape of
 * it: a production company nobody has worked for hires the people in the
 * house, and the post costs its salary from the month they start.
 */
function PostForm({ role, onClose, onDone }: {
  role: RoleId;
  onClose: () => void;
  onDone: (error: string | undefined) => void;
}) {
  const { run } = useGame();
  const everybody = useWorld((s) => Object.values(s.universe.people));
  const facts = ROLE_BY_ID[role];
  const [chosen, setChosen] = useState<string>(everybody[0]?.id ?? '');

  const put = () => {
    const answer = run<{ ok: boolean; error?: string }>(
      'company.fill_post', { role, personId: chosen }, { silent: true },
    );
    onDone(answer.value?.ok ? undefined : answer.value?.error ?? answer.error ?? 'Nobody took it.');
    if (answer.value?.ok) onClose();
  };

  return (
    <Modal
      title={`Fill ${facts?.label ?? 'The Post'}`}
      onClose={onClose}
      footer={(
        <>
          <button className="btn btn-ghost" onClick={onClose}>Never Mind</button>
          <button className="btn btn-primary" onClick={put} disabled={!chosen}>Give Them The Post</button>
        </>
      )}
    >
      <div className="field">
        <label htmlFor="post-person">Who</label>
        <select id="post-person" value={chosen} onChange={(e) => setChosen(e.target.value)}>
          {everybody.map((one) => (
            <option key={one.id} value={one.id}>
              {one.displayName}{one.isPlayer ? ' (you)' : ''}
            </option>
          ))}
        </select>
      </div>
      <p className="xs dim" style={{ margin: 0 }}>
        {facts?.what ?? ''} It pays {formatMoney(facts?.monthlyCents ?? 0, { cents: false })} a month
        from the day they start, whether or not the company is making anything.
      </p>
    </Modal>
  );
}

/** What the company holds the rights to. */
function Holdings() {
  const held = useWorld((s) => holdingsOf(s.universe));
  const [taking, setTaking] = useState(false);

  return (
    <Panel
      title="What It Holds"
      tight
      actions={<button className="btn btn-sm btn-primary" onClick={() => setTaking(true)}>Take An Option</button>}
    >
      {held.length === 0 ? (
        <p className="muted small">
          Nothing. A production company with no material is an address and a bank account.
        </p>
      ) : (
        <div className="col gap-2">
          {held.map((holding) => (
            <div key={holding.id} className="holding">
              <div className="row-between">
                <div>
                  <div className="strong">
                    <Open subject={at('holding', holding.id)}>{holding.title}</Open>
                  </div>
                  <div className="xs muted">
                    {holding.hold === 'option' ? 'Optioned' : holding.hold === 'owned' ? 'Owned outright' : 'Commissioned'}
                    {holding.expiresAt ? ` · runs out ${formatDate(holding.expiresAt, 'UTC')}` : ''}
                  </div>
                </div>
                <span className={`chip ${holding.chainComplete ? '' : 'chip-accent'}`}>
                  {holding.chainComplete ? 'Chain Clean' : 'Chain Broken'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      {taking && <OptionForm onClose={() => setTaking(false)} />}
    </Panel>
  );
}

function OptionForm({ onClose }: { onClose: () => void }) {
  const { run } = useGame();
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | undefined>();

  const take = () => {
    const answer = run<{ ok: boolean; error?: string }>('company.option', { title }, { silent: true });
    if (answer.value?.ok) { onClose(); return; }
    setError(answer.value?.error ?? answer.error ?? 'The company couldn’t take it.');
  };

  return (
    <Modal
      title="Take An Option"
      onClose={onClose}
      footer={(
        <>
          <button className="btn btn-ghost" onClick={onClose}>Never Mind</button>
          <button className="btn btn-primary" onClick={take} disabled={title.trim().length === 0}>Take It</button>
        </>
      )}
    >
      <div className="field">
        <label htmlFor="option-title">What Is It Called</label>
        <input
          id="option-title" type="text" value={title} maxLength={80}
          placeholder="The title of the thing"
          onChange={(e) => { setTitle(e.target.value); setError(undefined); }}
        />
      </div>
      <p className="xs dim" style={{ margin: 0 }}>
        An option is the right to make it for a while, not ownership of it. It runs out, and when it
        does the rights go back to whoever you took them from.
      </p>
      {error && <p className="small negative" style={{ marginTop: 'var(--s3)' }}>{error}</p>}
    </Modal>
  );
}

/** What it is trying to make. */
function Slate() {
  const slate = useWorld((s) => projectsOf(s.universe));
  const [putting, setPutting] = useState(false);
  const [saying, setSaying] = useState<string | undefined>();
  const [casting, setCasting] = useState<string | undefined>();
  const [filing, setFiling] = useState<string | undefined>();
  const [selling, setSelling] = useState<string | undefined>();

  return (
    <Panel
      title="The Slate"
      tight
      actions={<button className="btn btn-sm btn-primary" onClick={() => setPutting(true)}>Put Something On It</button>}
    >
      {slate.length === 0 ? (
        <p className="muted small">
          Nothing on it. A company with one project has no slate — it has a hope — so this is worse
          than that.
        </p>
      ) : (
        <div className="col gap-2">
          {slate.map((project) => (
            <div key={project.id} className="holding">
              <div className="row-between">
                <div className="strong">
                  <Open subject={at('project', project.id)}>{project.title}</Open>
                </div>
                <div className="row gap-2">
                  {/* The stage is an id. A chip is a label, so it is read as one. */}
                  <span className="chip">{toStart(project.stage)}</span>
                  {project.planId === undefined && !project.shelvedAt && (
                    <button className="btn btn-sm" onClick={() => setSaying(project.id)}>Say Yes To It</button>
                  )}
                  {(project.roles ?? []).length > 0 && project.stage !== 'delivered' && (
                    <button className="btn btn-sm" onClick={() => setCasting(project.id)}>
                      {`The Parts (${howManyCast(project)}/${(project.roles ?? []).length})`}
                    </button>
                  )}
                  {project.planId !== undefined && project.stage !== 'delivered' && (
                    <button className="btn btn-sm" onClick={() => setFiling(project.id)}>The Delivery List</button>
                  )}
                  {project.stage === 'delivered' && project.dealId === undefined && (
                    <button className="btn btn-sm btn-primary" onClick={() => setSelling(project.id)}>Sell It</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {putting && <DevelopForm onClose={() => setPutting(false)} />}
      {saying && <GreenlightForm projectId={saying} onClose={() => setSaying(undefined)} />}
      {casting && <CastForm projectId={casting} onClose={() => setCasting(undefined)} />}
      {filing && <DeliveryForm projectId={filing} onClose={() => setFiling(undefined)} />}
      {selling && <SellForm projectId={selling} onClose={() => setSelling(undefined)} />}
    </Panel>
  );
}

/**
 * Putting a title on the slate.
 *
 * Three answers, and the middle one is the only one that cannot be changed
 * afterward: a picture is a film or it is television from the moment it is
 * developed, and which it is decides how it can be made at all.
 */
function DevelopForm({ onClose }: { onClose: () => void }) {
  const { run } = useGame();
  const held = useWorld((s) => holdingsOf(s.universe));
  const [title, setTitle] = useState('');
  const [medium, setMedium] = useState<'film' | 'television'>('film');
  const [holdingId, setHoldingId] = useState('');
  const [error, setError] = useState<string | undefined>();

  const put = () => {
    const answer = run<{ ok: boolean; error?: string }>(
      'company.develop', { title, medium, holdingId: holdingId || undefined }, { silent: true },
    );
    if (answer.value?.ok) { onClose(); return; }
    setError(answer.value?.error ?? answer.error ?? 'It couldn’t go on the slate.');
  };

  const ways = plansFor(medium);
  return (
    <Modal
      title="Put Something On The Slate"
      onClose={onClose}
      footer={(
        <>
          <button className="btn btn-ghost" onClick={onClose}>Never Mind</button>
          <button className="btn btn-primary" onClick={put} disabled={title.trim().length === 0}>
            Put It On
          </button>
        </>
      )}
    >
      <div className="field">
        <label htmlFor="develop-title">What Is It Called</label>
        <input
          id="develop-title" type="text" value={title} maxLength={80}
          placeholder="The title of the thing"
          onChange={(e) => { setTitle(e.target.value); setError(undefined); }}
        />
      </div>
      <div className="field">
        <label htmlFor="develop-medium">Film Or Television</label>
        <select
          id="develop-medium" value={medium}
          onChange={(e) => { setMedium(e.target.value as 'film' | 'television'); setError(undefined); }}
        >
          <option value="film">A Film</option>
          <option value="television">Television</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="develop-holding">What It Is Made From</label>
        <select id="develop-holding" value={holdingId} onChange={(e) => setHoldingId(e.target.value)}>
          <option value="">An idea, and no rights behind it</option>
          {held.map((one) => (
            <option key={one.id} value={one.id}>{one.title}</option>
          ))}
        </select>
      </div>
      <p className="xs dim" style={{ margin: 0 }}>
        {ways.length === 1
          ? `There is one way to make ${medium === 'film' ? 'a film' : 'television'} here: ${ways[0]!.label}.`
          : `${said(ways.length, 'way')} to make television here: ${ways.map((one) => one.label).join(', ')}.`}
        {' '}That choice is made at the greenlight, and this one is made now and not again.
      </p>
      {error && <p className="small negative" style={{ marginTop: 'var(--s3)' }}>{error}</p>}
    </Modal>
  );
}

/**
 * Saying yes to something.
 *
 * Seven choices and they are not seven questions. The plan decides what the
 * parts are and which end of the calendar is nailed down; the budget and the
 * shoot length together decide how far the schedule is cut below what the money
 * implies, which is what the overrun is drawn from; the hands decide whether
 * the cut makes the date. So the form shows what the answers come to rather
 * than what they are, and it asks the engine for that rather than working it
 * out again: `wouldBe` runs every check and lays every date and commits
 * nothing, so the schedule on screen is the schedule the button lays and the
 * refusal on screen is the sentence the button would return.
 */
function GreenlightForm({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const { run, sim } = useGame();
  const project = useWorld((s) => s.universe.projects[projectId]);
  const ways = project ? plansFor(project.medium) : [];
  const [planId, setPlanId] = useState(ways[0]?.id ?? 'feature');
  const plan = planById(planId);
  const [budget, setBudget] = useState(4_000_000);
  const [weeks, setWeeks] = useState(5);
  const [minutes, setMinutes] = useState(Math.round((plan?.delivers.secondsEach ?? 6_000) / 60));
  const [hands, setHands] = useState(2);
  const [when, setWhen] = useState<string>('');

  // The week count does not set a shoot on every plan — an unscripted season
  // does not shoot — so the label is the plan's own base period.
  const shootLabel = plan?.periods.find((one) => one.per === 1)?.label ?? 'How Long It Shoots';
  const anchoredAt = plan?.anchor === 'delivery' ? AIRDATE_WEEKS : LEAD_WEEKS;
  const from = when
    ? new Date(`${when}T00:00:00Z`).getTime()
    : sim.now + anchoredAt * 7 * 24 * 60 * 60 * 1000;
  const spec = {
    projectId, planId, budgetCents: Math.round(budget * 100), shootWeeks: weeks,
    secondsEach: minutes * 60, hands, from,
  };
  const answer = wouldBe(sim, spec);

  const say = () => {
    const done = run<{ ok: boolean; error?: string }>('company.greenlight', spec, { silent: true });
    if (done.value?.ok) onClose();
  };

  return (
    <Modal
      title={`Say Yes To ${project?.title ?? 'It'}`}
      wide
      onClose={onClose}
      footer={(
        <>
          <button className="btn btn-ghost" onClick={onClose}>Never Mind</button>
          <button className="btn btn-primary" onClick={say} disabled={!answer.ok}>Say Yes</button>
        </>
      )}
    >
      <div className="field">
        <label htmlFor="gl-plan">How It Gets Made</label>
        <select id="gl-plan" value={planId} onChange={(e) => setPlanId(e.target.value)}>
          {ways.map((one) => <option key={one.id} value={one.id}>{one.label}</option>)}
        </select>
        {plan && <p className="xs dim" style={{ margin: 'var(--s2) 0 0' }}>{plan.what}</p>}
      </div>

      <div className="field">
        <label htmlFor="gl-budget">What It Costs</label>
        <input id="gl-budget" type="number" min={1} step={100_000} value={budget}
          onChange={(e) => setBudget(Math.max(1, Number(e.target.value)))} />
        <p className="xs dim" style={{ margin: 'var(--s2) 0 0' }}>
          {formatMoney(Math.round(budget * 100), { cents: false })}, against{' '}
          {formatMoney(stillToCarry(sim), { cents: false })} the family would still put in.
        </p>
      </div>

      <div className="field">
        <label htmlFor="gl-weeks">{shootLabel}</label>
        <input id="gl-weeks" type="number" min={1} max={LONGEST_SHOOT} value={weeks}
          onChange={(e) => setWeeks(Math.max(1, Number(e.target.value)))} />
        <p className={`xs ${answer.ok && answer.prospect.tightness < 0.8 ? 'negative' : 'dim'}`} style={{ margin: 'var(--s2) 0 0' }}>
          {answer.ok
            ? `The money implies about ${Math.round(weeks / Math.max(0.01, answer.prospect.tightness))} weeks and you have set ${weeks}. `
              + `A schedule cut below what it costs is what an overrun is drawn from.`
            : 'The schedule against the money is worked out once the rest of it holds.'}
        </p>
      </div>

      <div className="field">
        <label htmlFor="gl-minutes">What Each Part Runs To</label>
        <input id="gl-minutes" type="number" min={1} value={minutes}
          onChange={(e) => setMinutes(Math.max(1, Number(e.target.value)))} />
        <p className="xs dim" style={{ margin: 'var(--s2) 0 0' }}>
          {said(plan?.delivers.parts ?? 1, 'part')} at {minutes} minutes.
        </p>
      </div>

      <div className="field">
        <label htmlFor="gl-hands">The Cutting Room</label>
        <input id="gl-hands" type="number" min={1} value={hands}
          onChange={(e) => setHands(Math.max(1, Number(e.target.value)))} />
        <p className="xs dim" style={{ margin: 'var(--s2) 0 0' }}>
          {rateById(plan ? cuttingPeriod(plan)?.converts?.at ?? '' : '')?.who ?? 'Nobody'}
          {plan && cuttingPeriod(plan)
            ? `, ${Math.round(throughput(cuttingPeriod(plan)!.converts!.at, hands) / 60)} finished minutes a week between them.`
            : '.'}
        </p>
      </div>

      <div className="field">
        <label htmlFor="gl-when">
          {plan?.anchor === 'delivery' ? 'The Transmission Date' : 'The First Day Of Prep'}
        </label>
        <input id="gl-when" type="date" value={when}
          onChange={(e) => setWhen(e.target.value)} />
        <p className="xs dim" style={{ margin: 'var(--s2) 0 0' }}>
          Left alone it is {formatDate(from, sim.homeZone)}, which is the engine’s own default of{' '}
          {anchoredAt} weeks out.
        </p>
      </div>

      {answer.ok ? (
        <div className="table-wrap">
          <table className="table">
            <tbody>
              {answer.prospect.periods.map((window) => {
                const period = plan?.periods.find((one) => one.id === window.id);
                return (
                  <tr key={window.id}>
                    <td className="nowrap">{period?.label ?? window.id}</td>
                    <td className="small nowrap">{formatDate(window.from, sim.homeZone)}</td>
                    <td className="small nowrap">{formatDate(window.to, sim.homeZone)}</td>
                  </tr>
                );
              })}
              <tr>
                <td className="nowrap strong">Delivered By</td>
                <td className="small nowrap" colSpan={2}>
                  {formatDate(answer.prospect.deliverBy, sim.homeZone)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <p className="small negative" style={{ marginTop: 'var(--s3)' }}>{answer.error}</p>
      )}
    </Modal>
  );
}

/**
 * The contractual delivery list.
 *
 * A distributor does not pay for a film, it pays for a list, and four items on
 * that list are paperwork nobody on the crew makes. Those four are the ones
 * with a button. The rest come out of the work and arrive when the work does,
 * which is why `handOver` refuses them outright and this shows them without a
 * control rather than with one that always says no.
 *
 * And a piece of paperwork cannot be filed before the period it waits on is
 * behind the picture, so a row that is not ready yet says when it will be
 * instead of offering a button that would refuse for four months.
 */
function DeliveryForm({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const { run, sim } = useGame();
  const project = useWorld((s) => s.universe.projects[projectId]);
  const [error, setError] = useState<string | undefined>();
  if (!project) return null;

  const file = (elementId: string) => {
    const answer = run<{ ok: boolean; error?: string }>(
      'company.deliver', { projectId, elementId }, { silent: true },
    );
    setError(answer.value?.ok ? undefined : answer.value?.error ?? answer.error);
  };

  return (
    <Modal
      title={`The Delivery List: ${project.title}`}
      wide
      onClose={onClose}
      footer={<button className="btn btn-ghost" onClick={onClose}>Close</button>}
    >
      <p className="small">
        A distributor pays for a list, not for a film, and it pays when the list is complete.
        Four of these are paperwork no one on the crew makes.
      </p>
      <div className="table-wrap">
        <table className="table">
          <tbody>
            {DELIVERY.map((element) => {
              const over = project.delivered.includes(element.id);
              const ready = canHandOver(project, element, sim.now);
              const waits = windowOf(project, element.after);
              return (
                <tr key={element.id}>
                  <td className="nowrap">{element.label}</td>
                  <td className="small">{element.what}</td>
                  <td className="small nowrap">
                    {over ? 'Over'
                      : element.by === 'production' ? 'Comes out of the work'
                        : ready ? (
                          <button className="btn btn-sm" onClick={() => file(element.id)}>File It</button>
                        ) : waits
                          ? `Not until ${formatDate(waits.to, sim.homeZone)}`
                          : 'Waiting'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {error && <p className="small negative" style={{ marginTop: 'var(--s3)' }}>{error}</p>}
    </Modal>
  );
}

/**
 * The parts, and who is in them.
 *
 * Two screens in one, and the seam between them is the whole mechanic. The
 * left-hand fact is what the picture set aside for a part; the right-hand fact
 * is what the person wants. Everything a producer can actually do about casting
 * happens in the gap between those two numbers.
 *
 * The read is printed as three figures and never as one, because three is what
 * it is. A performer the camera loves who cannot hit the same mark twice is a
 * different object from a reliable one nobody wants to look at, and an average
 * of the two would say they were the same buy.
 */
function CastForm({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const { run, sim } = useGame();
  const project = useWorld((s) => s.universe.projects[projectId]);
  const [open, setOpen] = useState<string | undefined>();
  const [asking, setAsking] = useState<Record<string, string>>({});
  const [heard, setHeard] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  if (!project) return null;

  const put = (roleId: string) => {
    const answer = run<{ ok: boolean; error?: string }>(
      'company.breakdown', { projectId, roleId }, { silent: true },
    );
    setError(answer.value?.ok ? undefined : answer.value?.error ?? answer.error);
    setHeard(undefined);
  };
  const offer = (roleId: string, personId: string, feeCents: number) => {
    const answer = run<{ ok: boolean; error?: string; said?: string }>(
      'company.cast', { projectId, roleId, personId, feeCents }, { silent: true },
    );
    setError(answer.value?.ok ? undefined : answer.value?.error ?? answer.error);
    setHeard(answer.value?.said);
  };
  const release = (roleId: string) => {
    const answer = run<{ ok: boolean; error?: string }>(
      'company.release', { projectId, roleId }, { silent: true },
    );
    setError(answer.value?.ok ? undefined : answer.value?.error ?? answer.error);
    setHeard(undefined);
  };

  const inIt = castOf(sim, project);
  const filled = howManyCast(project);

  return (
    <Modal
      title={`The Parts: ${project.title}`}
      wide
      onClose={onClose}
      footer={<button className="btn btn-ghost" onClick={onClose}>Close</button>}
    >
      <p className="small">{whereTheCastStands(sim, project)}</p>
      <p className="muted small">
        Two weeks before the camera turns over the office fills whatever is left, at the band, out
        of whoever the band reaches. Paying over it is the only way to reach further, and the only
        reason to.
      </p>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Part</th>
              <th>The Band</th>
              <th>Who</th>
              {AXES.map((axis) => <th key={axis.id} className="nowrap">{axis.label}</th>)}
              <th />
            </tr>
          </thead>
          <tbody>
            {inIt.map((one) => {
              const when = datesFor(project, one.role);
              return (
                <tr key={one.role.id}>
                  <td className="nowrap">
                    <div className="strong">{one.role.name}</div>
                    <div className="muted small">
                      {when ? formatDate(when.from, sim.homeZone) : one.size.label}
                    </div>
                  </td>
                  <td className="nowrap">{formatMoney(one.role.bandCents)}</td>
                  <td className="small">
                    {one.person
                      ? <Open subject={at('person', one.person.id)}>{one.person.displayName}</Open>
                      : <span className="muted">Whoever is free</span>}
                    {one.seat && (
                      <div className="muted small">
                        {formatMoney(one.seat.feeCents)}
                        {` · ${feeReads(one.seat.feeCents, one.role.bandCents)}`}
                      </div>
                    )}
                  </td>
                  {AXES.map((axis) => (
                    <td key={axis.id} className="nowrap small">{`${Math.round(one.read[axis.id])}/100`}</td>
                  ))}
                  <td className="nowrap">
                    {seatFor(project, one.role.id)
                      ? <button className="btn btn-sm" onClick={() => release(one.role.id)}>Let Them Go</button>
                      : one.role.seen
                        ? (
                          <button className="btn btn-sm" onClick={() => setOpen(open === one.role.id ? undefined : one.role.id)}>
                            {open === one.role.id ? 'Close' : `Who Came In (${(one.role.seen ?? []).length})`}
                          </button>
                        )
                        : <button className="btn btn-sm btn-primary" onClick={() => put(one.role.id)}>Put It Out</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {open && (() => {
        const role = project.roles?.find((r) => r.id === open);
        if (!role) return null;
        const came = whoCameIn(sim, role);
        return (
          <div style={{ marginTop: 'var(--s4)' }}>
            <div className="strong">{`Who Came In For ${role.name}`}</div>
            <p className="muted small">
              What they were last paid is what their people argue from, and what you pay now is
              what the next three producers will read.
            </p>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    {AXES.map((axis) => <th key={axis.id} className="nowrap">{axis.label}</th>)}
                    <th className="nowrap">Quote</th>
                    <th className="nowrap">They Want</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {came.map((person) => {
                    const read = readOf(person);
                    const ask = askFor(person, role, sim.now);
                    const typed = asking[person.id];
                    const fee = typed === undefined || typed === ''
                      ? ask
                      : Math.round(Number(typed) * 100);
                    return (
                      <tr key={person.id}>
                        <td className="nowrap">
                          <Open subject={at('person', person.id)}>{person.displayName}</Open>
                        </td>
                        {AXES.map((axis) => (
                          <td key={axis.id} className="nowrap small">{`${Math.round(read[axis.id])}/100`}</td>
                        ))}
                        <td className="nowrap small">
                          {quoteOf(person, role.size, sim.now) > 0
                            ? formatMoney(quoteOf(person, role.size, sim.now))
                            : <span className="muted">Never been paid</span>}
                        </td>
                        <td className="nowrap small">{formatMoney(ask)}</td>
                        <td className="nowrap">
                          <input
                            aria-label={`What to offer ${person.displayName}`}
                            type="number"
                            min={0}
                            step={1_000}
                            style={{ width: '7rem' }}
                            placeholder={String(Math.round(ask / 100))}
                            value={typed ?? ''}
                            onChange={(e) => setAsking({ ...asking, [person.id]: e.target.value })}
                          />
                          <button
                            className="btn btn-sm btn-primary"
                            style={{ marginLeft: 'var(--s2)' }}
                            onClick={() => offer(role.id, person.id, fee)}
                          >
                            Offer It
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {heard && <p className="small" style={{ marginTop: 'var(--s3)' }}>{heard}</p>}
      {error && <p className="small negative" style={{ marginTop: 'var(--s3)' }}>{error}</p>}
      {filled === 0 && (
        <p className="muted small" style={{ marginTop: 'var(--s3)' }}>
          Nobody is cast yet, so every figure above is what the part would be if it stayed that way.
        </p>
      )}
    </Modal>
  );
}

/**
 * Selling the finished thing.
 *
 * The one decision that can pay the company back, and the terms differ more
 * than the money does: a buyout is a check and no more, and a studio release
 * reaches everybody for a decade after taking a third off the top.
 */
function SellForm({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const { run } = useGame();
  const project = useWorld((s) => s.universe.projects[projectId]);
  const [dealId, setDealId] = useState(DEALS[0]?.id ?? '');
  const [error, setError] = useState<string | undefined>();
  const deal = dealById(dealId);

  const sell = () => {
    const answer = run<{ ok: boolean; error?: string }>(
      'company.sell', { projectId, dealId }, { silent: true },
    );
    if (answer.value?.ok) { onClose(); return; }
    setError(answer.value?.error ?? answer.error ?? 'Nobody bought it.');
  };

  return (
    <Modal
      title={`Sell ${project?.title ?? 'It'}`}
      onClose={onClose}
      footer={(
        <>
          <button className="btn btn-ghost" onClick={onClose}>Never Mind</button>
          <button className="btn btn-primary" onClick={sell} disabled={!deal}>Take The Deal</button>
        </>
      )}
    >
      <div className="field">
        <label htmlFor="sell-deal">Who Takes It</label>
        <select id="sell-deal" value={dealId} onChange={(e) => { setDealId(e.target.value); setError(undefined); }}>
          {DEALS.map((one) => <option key={one.id} value={one.id}>{one.label}</option>)}
        </select>
      </div>
      {deal && (
        <p className="xs dim" style={{ margin: 0 }}>
          {deal.said}{' '}
          {deal.reach === 0
            ? 'Nobody licenses it again, so there are no windows to open and no statements to read.'
            : 'It pays as the windows open, across years, and what comes home is what the waterfall leaves.'}
        </p>
      )}
      {error && <p className="small negative" style={{ marginTop: 'var(--s3)' }}>{error}</p>}
    </Modal>
  );
}

/**
 * What the lot spends on being known.
 *
 * The one decision on the whole estate taken again every month, and the only
 * control in the game whose consequence is already fully explained on the page
 * it opens onto. What it buys is read back off the ledger across three
 * quarters rather than off this figure, so it cannot be bought the month
 * before it is wanted and cannot be dropped without the market noticing two
 * quarters later.
 */
function TheLotsName() {
  const { run } = useGame();
  const spending = useWorld((s) => sellsFor(s));
  const pull = useWorld((s) => pullOn(s));
  const [error, setError] = useState<string | undefined>();

  const set = (monthlyCents: number) => {
    const answer = run<{ ok: boolean; error?: string }>('lot.sell', { monthlyCents }, { silent: true });
    setError(answer.value?.ok ? undefined : answer.value?.error ?? answer.error);
  };

  return (
    <Panel title="Being Known" tight look={at('lot')}>
      <p className="small">
        A producer in Reykjavik knows the stages are there whatever anybody spends. A desk in Los
        Angeles hears about a show after the budget is locked unless the lot was in that
        conversation first.
      </p>
      <div className="field">
        <label htmlFor="lot-selling">What It Spends A Month</label>
        <input
          id="lot-selling" type="range" min={SELLING.floor} max={SELLING.most} step={10_000_00}
          value={spending} onChange={(e) => set(Number(e.target.value))}
        />
        <p className="xs dim" style={{ margin: 'var(--s2) 0 0' }}>
          {formatMoney(spending, { cents: false })} a month. The floor is{' '}
          {formatMoney(SELLING.floor, { cents: false })}, and past{' '}
          {formatMoney(SELLING.most, { cents: false })} there is nobody left to tell.
        </p>
      </div>
      <div className="row-between">
        <div className="xs muted">{Math.round(pull.reach * 100)}/100 of the way to everybody who books a stage</div>
        <div className="xs muted">{pull.calls.toFixed(1)} calls a month</div>
      </div>
      {error && <p className="small negative" style={{ marginTop: 'var(--s3)' }}>{error}</p>}
    </Panel>
  );
}

/** Where it stands with everybody it has to stand with. */
function Standings() {
  const registrations = useWorld((s) => registrationsOf(s.universe));
  const signatures = useWorld((s) => signaturesOf(s.universe));
  const policies = useWorld((s) => policiesOf(s.universe));
  const posts = useWorld((s) => postsOf(s.universe));
  const { sim } = useGame();

  return (
    <div className="grid grid-2">
      <Panel title="On The Register" tight>
        <div className="col gap-2">
          {registrations.map((one) => (
            <div key={one.id} className="row-between">
              <div>
                <div className="small strong">
                  <Open subject={at('register', one.registry)}>{REGISTRY_BY_ID[one.registry].label}</Open>
                </div>
                <div className="xs muted">{REGISTRY_BY_ID[one.registry].body}</div>
              </div>
              <span className="xs mono dim">{one.number}</span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Signed With" tight>
        {signatures.length === 0 ? (
          <p className="muted small">Nobody. Which is why nobody American can work here.</p>
        ) : (
          <div className="col gap-2">
            {signatures.map((one) => (
              <div key={one.id} className="row-between">
                <div className="small strong">
                  <Open subject={at('guild', one.guild)}>{GUILD_BY_ID[one.guild].body}</Open>
                </div>
                <span className="xs dim">{one.agreement}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Covered For" tight>
        {policies.length === 0 ? (
          <p className="muted small">Nothing. Which stops a shoot before it starts and a delivery after it ends.</p>
        ) : (
          <div className="col gap-2">
            {policies.map((one) => (
              <div key={one.id} className="row-between">
                <div className="small strong">
                  <Open subject={at('cover', one.kind)}>{POLICY_BY_ID[one.kind].label}</Open>
                </div>
                <span className="xs dim">{formatMoney(one.limitCents, { cents: false })}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Who Works Here" tight>
        <div className="col gap-2">
          {posts.map((one) => {
            const who = one.personId ? sim.universe.people[one.personId] : undefined;
            return (
              <div key={one.id} className="row-between">
                <div className="small strong">
                  <Open subject={at('role', one.role)}>{ROLE_BY_ID[one.role].label}</Open>
                </div>
                <span className="xs dim">{who ? who.displayName || who.firstName : 'Empty'}</span>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
