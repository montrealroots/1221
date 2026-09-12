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
import { toStart } from '@/ui/looks/words';
import { formatMoney } from '@/engine/core/money';
import { formatDate } from '@/engine/core/time';
import type { GuildId, PolicyKind, RegistryId } from '@/engine/domain/company';
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
        body="This save was made before the family formed one, so there is nothing here to run."
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
    </div>
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
  return (
    <Panel title="The Slate" tight>
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
                {/* The stage is an id. A chip is a label, so it is read as one. */}
                <span className="chip">{toStart(project.stage)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
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
