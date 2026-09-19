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
import { fixFor } from './fix';
import { toStart } from '@/ui/looks/words';
import { formatMoney } from '@/engine/core/money';
import { formatDate } from '@/engine/core/time';
import { CADENCE_LABEL, ENGINES, RENEWAL_SAID, engineById } from '@/engine/content/concept';
import { CITIES } from '@/engine/content/geography';
import {
  BEST_TEAM, DEPARTMENTS, LEAST_TEAM, monthsFor, rateFor,
} from '@/engine/content/departments';
import { LOCK_BY_ID, canReopen, undoCosts, wouldForeclose } from '@/engine/content/locks';
import {
  behindTheCompany, breakEvenShare, goingUp, pullOn, sellsFor, theSmallStage,
  turnedAway, whereTheBuildStands, whyNotBuild,
} from '@/engine/world/lot';
import {
  A_SMALL_STAGE, SELLING, SMALL_STAGE_COST_CENTS, buildRefusalById,
} from '@/engine/content/lot';
import {
  GUILD_BY_ID, POLICY_BY_ID, REGISTRY_BY_ID, ROLE_BY_ID,
} from '@/engine/content/incorporation';
import type { Project, RoleId } from '@/engine/domain/company';
import {
  americanArm, capabilitiesOf, companyCash, holdingsOf, parentCompany, policiesOf,
  postFacts, postsOf, projectsOf, registrationsOf, signaturesOf, whereItStands,
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
      <Staffing />
      <TheLotsName />
      <TheFifthRoom />
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
  const [filling, setFilling] = useState<RoleId | undefined>();
  const [taking, setTaking] = useState(false);

  const act = (kind: string, payload: Record<string, unknown>) => {
    const answer = run<{ ok: boolean; error?: string }>(kind, payload, { silent: true });
    setError(answer.value?.ok ? undefined : answer.value?.error ?? answer.error);
  };

  const fix = fixFor(blocker);
  const press = () => {
    if (!fix) return;
    if (!('asks' in fix)) { act(fix.kind, fix.payload); return; }
    if (fix.asks === 'who') setFilling(fix.role); else setTaking(true);
  };

  return (
    <div className="row-between">
      <div className="grow">
        <div className="small strong">{blocker.need}</div>
        <div className="xs muted">{blocker.how}</div>
        {error && <div className="xs negative" style={{ marginTop: 2 }}>{error}</div>}
      </div>
      {fix && <button className="btn btn-sm" onClick={press}>{fix.label}</button>}
      {taking && <OptionForm onClose={() => setTaking(false)} />}
      {filling && (
        <PostForm
          role={filling}
          onClose={() => setFilling(undefined)}
          onDone={(said) => { setError(said); if (!said) setFilling(undefined); }}
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
        {/* The rate, said as a rate. This read "It pays X a month from the day
            they start, whether or not the company is making anything", which
            described a standing charge the engine does not make: no clock in
            world/company.ts bills a filled post, once or monthly. */}
        {facts?.what ?? ''} The going rate for the job is{' '}
        {formatMoney(facts?.monthlyCents ?? 0, { cents: false })} a month.
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
                    {holding.expiresAt ? ` · optioned to ${formatDate(holding.expiresAt, 'UTC')}` : ''}
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
      {/* This said "It runs out, and when it does the rights go back to
          whoever you took them from", which was the flattest promise of a
          lapse anywhere in the build and the one a player would actually have
          planned around. No clock takes an option back: the term is written
          on the agreement, the date is printed on the holding's own page, and
          a picture can still be greenlit off it in 2046. */}
      <p className="xs dim" style={{ margin: 0 }}>
        An option is the right to make it for a while, not ownership of it. The term on this one is
        eighteen months, and buying it outright is a different and dearer thing.
      </p>
      {error && <p className="small negative" style={{ marginTop: 'var(--s3)' }}>{error}</p>}
    </Modal>
  );
}

/** What it is trying to make. */
function Slate() {
  const slate = useWorld((s) => projectsOf(s.universe));
  const [putting, setPutting] = useState(false);
  const [conceiving, setConceiving] = useState<string | undefined>();

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
                  {project.title}
                </div>
                <div className="row gap-2">
                  {/* The stage is an id. A chip is a label, so it is read as one. */}
                  <span className="chip">{toStart(project.stage)}</span>
                  {project.planId === undefined && !project.shelvedAt && (
                    <button className="btn btn-sm" onClick={() => setConceiving(project.id)}>
                      {project.concept ? 'What It Is' : 'Say What It Is'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {putting && <DevelopForm onClose={() => setPutting(false)} />}
      {conceiving && slate.find((one) => one.id === conceiving) && (
        <ConceiveForm
          project={slate.find((one) => one.id === conceiving)!}
          onClose={() => setConceiving(undefined)}
        />
      )}
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
      {error && <p className="small negative" style={{ marginTop: 'var(--s3)' }}>{error}</p>}
    </Modal>
  );
}

/**
 * Saying what a thing is.
 *
 * The first act in the real process and the last one this screen learned. Three
 * answers, and none of them is a label: the engine decides what the thing can be
 * made as, the ensemble is checked against what that engine needs, and the world is
 * where the unit works out of.
 *
 * The engine list says what each one asks every week, because "A Case Every Week" is
 * a name and "What came in this week?" is the thing a person is actually choosing.
 */
function ConceiveForm({ project, onClose }: { project: Project; onClose: () => void }) {
  const { sim, run, refresh } = useGame();
  const held = project.concept;
  const [engineId, setEngineId] = useState(held?.engineId ?? ENGINES[0]!.id);
  const [worldId, setWorldId] = useState(held?.worldId ?? sim.player.currentLocationId);
  const [howMany, setHowMany] = useState(held?.people ?? 4);
  const [error, setError] = useState<string | undefined>();
  const engine = engineById(engineId);

  const say = () => {
    const answer = run<{ ok: boolean; error?: string }>('company.conceive', { projectId: project.id, engineId, worldId, people: howMany });
    if (answer.value?.ok) { refresh(); onClose(); return; }
    setError(answer.value?.error ?? answer.error ?? 'It wouldn’t take.');
  };

  // Somewhere to set it. The player's own town first, then the cities the world
  // already knows about, because a list of every city on earth is not a choice.
  const places = [...CITIES.all()].slice(0, 60);

  return (
    <Modal
      title={`${project.title}: What Is It`}
      onClose={onClose}
      footer={(
        <>
          <button className="btn btn-ghost" onClick={onClose}>Never Mind</button>
          <button className="btn btn-primary" onClick={say}>That’s What It Is</button>
        </>
      )}
    >
      <div className="field">
        <label htmlFor="conceive-engine">What Makes The Next One</label>
        <select id="conceive-engine" value={engineId} onChange={(e) => { setEngineId(e.target.value); setError(undefined); }}>
          {ENGINES.map((one) => (
            <option key={one.id} value={one.id}>{one.label}</option>
          ))}
        </select>
      </div>
      {engine && (
        <p className="xs dim" style={{ margin: '0 0 var(--s4)' }}>
          {engine.what}{' '}<strong>{engine.asks}</strong>{' '}{RENEWAL_SAID[engine.renewal]}
          {engine.carries !== undefined && ` About ${engine.carries} parts in it.`}
          {' '}It can be made as {engine.cadences.map((c) => CADENCE_LABEL[c].toLowerCase()).join(' or ')}.
        </p>
      )}
      <div className="field">
        <label htmlFor="conceive-world">Where It Is Set</label>
        <select id="conceive-world" value={worldId} onChange={(e) => { setWorldId(e.target.value); setError(undefined); }}>
          {places.map((one) => (
            <option key={one.id} value={one.id}>{one.name}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="conceive-people">How Many People It Is About</label>
        <input
          id="conceive-people" type="number" min={1} max={40} value={howMany}
          onChange={(e) => { setHowMany(Number(e.target.value)); setError(undefined); }}
        />
      </div>
      <p className="xs dim" style={{ margin: 0 }}>
        {engine ? `${engine.label} needs ${engine.leastPeople} of them. ${engine.rules}` : ''}
      </p>
      {error && <p className="small negative" style={{ marginTop: 'var(--s3)' }}>{error}</p>}
    </Modal>
  );
}
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

/**
 * The one decision on this lot that changes what the lot is.
 *
 * Everything it can refuse on is shown before it refuses, because a door whose
 * lock is invisible is not a decision. The money and the wait are said in the
 * same breath as the reason, and so is the thing a page like this normally
 * leaves out: what it costs to keep afterwards.
 */
function TheFifthRoom() {
  const { run } = useGame();
  const standing = useWorld((s) => theSmallStage(s));
  const building = useWorld((s) => goingUp(s));
  const saying = useWorld((s) => whereTheBuildStands(s));
  const why = useWorld((s) => whyNotBuild(s));
  const behind = useWorld((s) => behindTheCompany(s));
  const bar = useWorld((s) => breakEvenShare(s));
  const priced = useWorld((s) => turnedAway(s).find((one) => one.why === 'price')?.count ?? 0);
  const [error, setError] = useState<string | undefined>();

  const build = () => {
    const answer = run<{ ok: boolean; error?: string }>('lot.build', {}, { silent: true });
    setError(answer.value?.ok ? undefined : answer.value?.error ?? answer.error);
  };

  return (
    <Panel title={A_SMALL_STAGE.name} tight look={at('lot')}>
      {standing ? (
        <>
          <p className="small">{A_SMALL_STAGE.said}</p>
          <div className="row-between">
            <div className="xs muted">{A_SMALL_STAGE.floorSqm}m², {A_SMALL_STAGE.clearHeightM}m to the perms</div>
            <div className="xs muted">{formatMoney(standing.weekRateCents, { cents: false })} a week</div>
          </div>
        </>
      ) : building ? (
        <p className="small">{saying}</p>
      ) : (
        <>
          <p className="small">
            The smallest room here is two thousand square meters, and a week-long job has to pay for
            all of it. {priced > 0 ? `${priced} enquiries have gone elsewhere on price.` : 'It\u2019s why the short work goes elsewhere.'}
          </p>
          <p className="xs dim" style={{ margin: 'var(--s2) 0 var(--s3)' }}>
            {A_SMALL_STAGE.floorSqm}m² at {formatMoney(A_SMALL_STAGE.weekRateCents, { cents: false })} a week.{' '}
            {formatMoney(SMALL_STAGE_COST_CENTS, { cents: false })} now, {A_SMALL_STAGE.weeksToBuild} weeks
            to stand it up, and five rooms cost more to keep dark than four
            {bar === undefined ? '' : ` — the lot has to take ${Math.round(bar * 100)}% of a full month to cover one`}.
          </p>
          <div className="row-between">
            <button type="button" className="btn" onClick={build} disabled={why !== undefined}>
              Build It
            </button>
            <div className="xs muted">
              {formatMoney(Math.max(0, behind), { cents: false })} behind the company
            </div>
          </div>
          {why && (
            <p className="small dim" style={{ marginTop: 'var(--s3)' }}>
              {buildRefusalById(why)?.said}
            </p>
          )}
        </>
      )}
      {error && <p className="small negative" style={{ marginTop: 'var(--s3)' }}>{error}</p>}
    </Panel>
  );
}

/**
 * Where it stands with everybody it has to stand with.
 *
 * Scoped to the production company, which it was not. These four read the whole
 * save, and for as long as the sugar group was a name with a cap table and
 * nothing under it that came to the same thing. The group is on three registers
 * and carries seven posts now, so unscoped this panel told a producer their
 * company employed a head of agronomy and had been VAT registered since 1946.
 */
function Standings() {
  const company = useWorld((s) => parentCompany(s.universe));
  const id = company?.id;
  const registrations = useWorld((s) => registrationsOf(s.universe, id));
  const signatures = useWorld((s) => signaturesOf(s.universe, id));
  const policies = useWorld((s) => policiesOf(s.universe, id));
  const posts = useWorld((s) => postsOf(s.universe, id));
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
                  <Open subject={at('role', one.role)}>{postFacts(one.role)?.label ?? one.role}</Open>
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

/**
 * Who is hired into each of a picture's departments, and what that makes it cost.
 *
 * The two halves of a budget, side by side, because the whole point of the engine
 * behind this is that they are different things. The months are the material's and
 * cannot be argued with here; the team is the player's and is the only thing on the
 * screen they can change. Showing the rate beside the months is what makes the
 * multiplication legible — the total is never presented as a figure without the two
 * numbers it came from sitting next to it.
 *
 * Only the departments a picture actually needs are listed. One that its material
 * asks nothing of is absent rather than shown at zero, which is the same rule the
 * schedule follows and the reason a small picture reads as small.
 */
function Staffing() {
  const { run } = useGame();
  const slate = useWorld((s) => projectsOf(s.universe).filter((one) => !one.shelvedAt));
  const holdings = useWorld((s) => s.universe.holdings);
  const [chosenId, setChosenId] = useState<string | undefined>(undefined);
  const [said, setSaid] = useState<string | undefined>(undefined);

  const project = slate.find((one) => one.id === chosenId) ?? slate[0];
  const holding = project?.holdingId ? holdings[project.holdingId] : undefined;
  if (!project || !holding) return null;

  const needed = DEPARTMENTS
    .map((department) => ({ department, months: monthsFor(department, holding.demands) }))
    .filter((one) => one.months > 0);

  const hire = (departmentId: string, level: number) => {
    const done = run<{ ok: boolean; error?: string }>(
      'company.staff', { projectId: project.id, departmentId, level }, { silent: true },
    );
    setSaid(done.value?.error ?? (done.value?.ok ? undefined : done.error));
  };

  return (
    <Panel title="What It Will Cost" tight>
      {slate.length > 1 && (
        <div className="field">
          <label htmlFor="staffing-which">Which Picture</label>
          <select
            id="staffing-which"
            value={project.id}
            onChange={(e) => setChosenId(e.target.value)}
          >
            {slate.map((one) => <option key={one.id} value={one.id}>{one.title}</option>)}
          </select>
        </div>
      )}
      <p className="muted small" style={{ marginBottom: 'var(--s3)' }}>
        The material decides the months. You decide what a month costs. A better team
        finishes on the same date and charges more for getting there.
      </p>
      <div className="col gap-2">
        {needed.map(({ department, months }) => {
          const level = project.levels?.[department.id] ?? LEAST_TEAM;
          return (
            <div className="holding" key={department.id}>
              <div className="row-between">
                <div className="grow">
                  <span className="strong">{department.label}</span>
                  <div className="small muted" style={{ marginTop: 2 }}>
                    {months} months at {formatMoney(rateFor(department, level), { cents: false })} a month
                  </div>
                </div>
                <div className="row gap-2">
                  {Array.from({ length: BEST_TEAM - LEAST_TEAM + 1 }, (_, i) => i + LEAST_TEAM)
                    .map((at) => (
                      <button
                        key={at}
                        className={`btn btn-sm ${at === level ? 'btn-primary' : ''}`}
                        onClick={() => hire(department.id, at)}
                      >
                        {at}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="small" style={{ marginTop: 'var(--s3)' }}>
        <strong>{formatMoney(project.budgetCents ?? 0, { cents: false })}</strong> to make,
        as it stands.
      </p>
      <Committing project={project} />
      {said ? <p className="small warn">{said}</p> : null}
    </Panel>
  );
}

/**
 * Shutting the budget, and saying yes.
 *
 * The two links of the chain, with the foreclosure named before it happens rather
 * than after. A player about to greenlight is told which reversal they are spending,
 * by name — "these doors close" is a briefing and "this is permanent" is only a
 * warning, and the difference is whether somebody can decide against it.
 */
function Committing({ project }: { project: Project }) {
  const { run } = useGame();
  const [said, setSaid] = useState<string | undefined>(undefined);
  const shut = project.locked ?? [];
  const budgetShut = shut.includes('budget');
  const greenlit = shut.includes('greenlit');
  const reopens = canReopen(LOCK_BY_ID.budget!, shut);
  const losing = wouldForeclose(LOCK_BY_ID.greenlit!, shut);

  const go = (kind: string, payload: Record<string, unknown>) => {
    const done = run<{ ok: boolean; error?: string }>(kind, payload, { silent: true });
    setSaid(done.value?.error ?? (done.value?.ok ? undefined : done.error));
  };

  if (project.releasedAt !== undefined) {
    return (
      <p className="small" style={{ marginTop: 'var(--s3)' }}>
        Out, and paying. What it takes was settled the day it opened.
      </p>
    );
  }

  if (project.stage === 'delivered') {
    return (
      <div style={{ marginTop: 'var(--s3)' }}>
        <button
          className="btn btn-sm btn-primary"
          onClick={() => go('company.release', { projectId: project.id })}
        >
          Let It Out
        </button>
        <p className="xs dim" style={{ marginTop: 'var(--s2)' }}>
          What it takes is worked out once, on the day it opens, and paid over the best
          part of a year.
        </p>
        {said ? <p className="small warn">{said}</p> : null}
      </div>
    );
  }

  if (greenlit) {
    return (
      <p className="small" style={{ marginTop: 'var(--s3)' }}>
        Greenlit, and being made. The money has gone out and the budget is shut for good.
      </p>
    );
  }

  return (
    <div style={{ marginTop: 'var(--s3)' }}>
      <div className="row gap-2">
        {!budgetShut && (
          <button className="btn btn-sm" onClick={() => go('company.lock_budget', { projectId: project.id })}>
            Shut The Budget
          </button>
        )}
        {budgetShut && reopens && (
          <button
            className="btn btn-sm"
            onClick={() => go('company.lock_budget', { projectId: project.id, off: true })}
          >
            Open It Again
          </button>
        )}
        {budgetShut && (
          <button
            className="btn btn-sm btn-primary"
            onClick={() => go('company.greenlight', { projectId: project.id })}
          >
            Say Yes
          </button>
        )}
      </div>
      {budgetShut && reopens && (
        <p className="xs dim" style={{ marginTop: 'var(--s2)' }}>
          Opening it again costs{' '}
          {formatMoney(undoCosts(LOCK_BY_ID.budget!, project.budgetCents ?? 0), { cents: false })}.
        </p>
      )}
      {losing.length > 0 && (
        <p className="xs warn" style={{ marginTop: 'var(--s2)' }}>
          Saying yes pays the budget out and closes one door for good:{' '}
          {losing.map((one) => one.label.toLowerCase()).join(', ')} can no longer be reopened.
        </p>
      )}
      {said ? <p className="small warn">{said}</p> : null}
    </div>
  );
}
