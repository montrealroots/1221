import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat, Meter, Empty, Tabs, Modal, MoneyText } from '@/ui/components/primitives';
import { companyDashboard, playerCompanies, explainCeiling, COMPANY_ROLES, EQUIPMENT_CATALOG } from '@/engine/systems/company';
import { CITIES } from '@/engine/content/geography';
import { formatMoney, formatMoneyCompact } from '@/engine/core/money';
import { formatDate } from '@/engine/core/time';

export function CompanyWorkspace() {
  const companies = useWorld(playerCompanies);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [founding, setFounding] = useState(false);

  const selected = companies.find((c) => c.id === selectedId) ?? companies[0];

  if (companies.length === 0) {
    return (
      <>
        <div className="page-head">
          <div className="eyebrow">Company</div>
          <h1>You do not own a company.</h1>
          <p className="muted">
            You do not need to be famous to found one. What you can commit to comes from what the company
            actually has, so scale is earned rather than declared.
          </p>
        </div>
        <Empty
          title="Nothing Founded"
          body="A production company separates your money from the business's, and is the only way to greenlight anything yourself."
          action={<button className="btn btn-primary" onClick={() => setFounding(true)}>Found a company</button>}
        />
        {founding && <FoundDialog onClose={() => setFounding(false)} />}
      </>
    );
  }

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Company</div>
        <h1>{selected?.name}</h1>
        <p className="muted">{selected?.legalName} · {CITIES.get(selected?.headquartersLocationId ?? '')?.name}</p>
      </div>

      {companies.length > 1 && (
        <div className="row wrap gap-2" style={{ marginBottom: 'var(--s4)' }}>
          {companies.map((company) => (
            <button key={company.id} className="chip" aria-pressed={selected?.id === company.id} onClick={() => setSelectedId(company.id)}
              style={selected?.id === company.id ? { background: 'var(--accent-dim)', color: 'var(--accent-strong)' } : undefined}>
              {company.name}
            </button>
          ))}
        </div>
      )}

      {selected && <CompanyDetail companyId={selected.id} />}

      <div className="row gap-2" style={{ marginTop: 'var(--s5)' }}>
        <button className="btn" onClick={() => setFounding(true)}>Found another company</button>
      </div>

      {founding && <FoundDialog onClose={() => setFounding(false)} />}
    </>
  );
}

function CompanyDetail({ companyId }: { companyId: string }) {
  const { sim, run } = useGame();
  const dashboard = useWorld((s) => companyDashboard(s, companyId));
  const ceiling = useWorld((s) => explainCeiling(s, companyId));
  const [tab, setTab] = useState<'overview' | 'people' | 'equipment' | 'merchandise'>('overview');
  const [hiring, setHiring] = useState(false);

  if (!dashboard) return <Empty title="Gone" body="That company no longer exists." />;
  const { company } = dashboard;

  return (
    <>
      <div className="grid grid-4" style={{ marginBottom: 'var(--s5)' }}>
        <Stat label="Cash" value={<MoneyText amount={dashboard.cash} compact />} note={`${formatMoneyCompact(dashboard.committed)} committed`} />
        <Stat label="Greenlight Ceiling" value={formatMoneyCompact(company.greenlightCeiling)} note="Largest single project" />
        <Stat label="Valuation" value={formatMoneyCompact(company.valuation)} />
        <Stat
          label="Runway"
          value={dashboard.runwayMonths !== undefined ? `${dashboard.runwayMonths} months` : '—'}
          tone={dashboard.runwayMonths !== undefined && dashboard.runwayMonths < 4 ? 'negative' : undefined}
          note={`${dashboard.headcount} on payroll`}
        />
      </div>

      <Tabs active={tab} onChange={setTab} tabs={[
        { id: 'overview', label: 'Overview' },
        { id: 'people', label: 'People', badge: dashboard.headcount },
        { id: 'equipment', label: 'Equipment', badge: dashboard.equipment.length },
        { id: 'merchandise', label: 'Merchandise', badge: dashboard.merchandise.length },
      ]} />

      {tab === 'overview' && (
        <div className="grid grid-2">
          <Panel title="Why The Ceiling Is What It Is">
            <ul className="small" style={{ margin: 0, paddingLeft: 'var(--s4)' }}>
              {ceiling.map((line) => <li key={line} style={{ marginBottom: 4 }}>{line}</li>)}
            </ul>
            <hr className="divider" />
            <div className="row gap-2">
              <button className="btn btn-sm" onClick={() => run('co.invest', { companyId, amount: 5_000_000 })}>
                Put in $50,000
              </button>
              <button className="btn btn-sm" onClick={() => run('co.distribute', { companyId, amount: 5_000_000 })}>
                Take out $50,000
              </button>
            </div>
            <p className="xs dim" style={{ marginTop: 'var(--s2)' }}>
              Money committed to projects in progress cannot be distributed out.
            </p>
          </Panel>

          <Panel title="Slate" flush>
            {dashboard.projects.length === 0 ? (
              <Empty title="No Projects" body="A company with nothing in development is an expensive hobby." />
            ) : (
              <div className="list">
                {dashboard.projects.map((project) => project && (
                  <div key={project.id} className="list-item list-static">
                    <div className="grow">
                      <div className="small strong">{project.title}</div>
                      <div className="xs dim">{project.phase.replace(/_/g, ' ')} · {formatMoneyCompact(project.budget)}</div>
                    </div>
                    {project.totalRevenue > 0 && (
                      <MoneyText amount={project.totalRevenue - project.totalCost} compact signed />
                    )}
                  </div>
                ))}
              </div>
            )}
            <hr className="divider" />
            <div className="grid grid-2" style={{ padding: '0 var(--s4) var(--s4)' }}>
              <Stat label="In Production" value={dashboard.inProduction} />
              <Stat label="Library Value" value={formatMoneyCompact(dashboard.libraryValue)} />
            </div>
          </Panel>
        </div>
      )}

      {tab === 'people' && (
        <Panel
          title="Payroll"
          subtitle={`${formatMoneyCompact(dashboard.payrollAnnual)} a year`}
          actions={<button className="btn btn-sm btn-primary" onClick={() => setHiring(true)}>Hire</button>}
          flush
        >
          {dashboard.employees.length === 0 ? (
            <Empty title="No Employees" body="Executives bring skills and authority the company can delegate." />
          ) : (
            <div className="list">
              {dashboard.employees.map((employee) => {
                const person = sim.universe.people[employee.personId];
                return (
                  <div key={employee.id} className="list-item list-static">
                    <div className="grow">
                      <div className="small strong">{person?.displayName ?? 'Someone'}</div>
                      <div className="xs dim">
                        {employee.title} · {employee.department} · since {formatDate(employee.hiredAt, sim.homeZone)}
                        {employee.authority > 0 && ` · can commit ${formatMoneyCompact(employee.authority)}`}
                      </div>
                    </div>
                    <div style={{ width: 100 }}>
                      <Meter label="" value={employee.performance} />
                    </div>
                    <span className="mono small">{formatMoneyCompact(employee.annualSalary)}</span>
                    <button className="btn btn-sm btn-danger" onClick={() => run('co.terminate', { employeeId: employee.id })}>
                      Let go
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      )}

      {tab === 'equipment' && (
        <>
          <Panel title="Owned And Rented" flush>
            {dashboard.equipment.length === 0 ? (
              <Empty title="Nothing Owned" body="Owning gear raises what your productions can achieve and adds to the balance sheet." />
            ) : (
              <div className="list">
                {dashboard.equipment.map((item) => item && (
                  <div key={item.id} className="list-item list-static">
                    <div className="grow">
                      <div className="small strong">{item.name}</div>
                      <div className="xs dim">
                        {item.brand} · {item.category} · {item.acquiredVia}
                        {item.rentalEndsAt && ` until ${formatDate(item.rentalEndsAt, sim.homeZone)}`}
                      </div>
                    </div>
                    <span className="chip">quality {item.qualityRating}</span>
                    <span className="mono small">{formatMoneyCompact(item.currentValue)}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Available" flush>
            <div className="list">
              {EQUIPMENT_CATALOG.map((template) => (
                <div key={template.name} className="list-item list-static">
                  <div className="grow">
                    <div className="small strong">{template.name}</div>
                    <div className="xs dim">{template.brand} · {template.category} · quality {template.qualityRating}</div>
                  </div>
                  <span className="mono small">{formatMoneyCompact(template.price)}</span>
                  <button className="btn btn-sm" onClick={() => run('co.acquire_equipment', { companyId, templateName: template.name, acquire: 'rental', days: 30 })}>
                    Rent 30d
                  </button>
                  <button className="btn btn-sm" onClick={() => run('co.acquire_equipment', { companyId, templateName: template.name, acquire: 'purchase' })}>
                    Buy
                  </button>
                </div>
              ))}
            </div>
          </Panel>
        </>
      )}

      {tab === 'merchandise' && (
        <Panel title="Merchandise" subtitle="Needs the merchandising rights to exist. Overstock gets written down." flush>
          {dashboard.merchandise.length === 0 ? (
            <Empty title="Nothing Launched" body="Merchandise only works when something people love exists to attach it to." />
          ) : (
            <div className="list">
              {dashboard.merchandise.map((line) => (
                <div key={line.id} className="list-item list-static">
                  <div className="grow">
                    <div className="small strong">{line.name}</div>
                    <div className="xs dim">
                      {line.category} · {line.unitsSold.toLocaleString('en-US')} of {line.unitsManufactured.toLocaleString('en-US')} sold
                      {line.unitsReturned > 0 && ` · ${line.unitsReturned} returned`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="mono small">{formatMoneyCompact(line.revenue)}</div>
                    <div className="xs dim">{formatMoneyCompact(line.inventoryValue)} inventory</div>
                  </div>
                  <span className="chip">{line.status.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {hiring && <HireDialog companyId={companyId} onClose={() => setHiring(false)} />}
    </>
  );
}

function HireDialog({ companyId, onClose }: { companyId: string; onClose: () => void }) {
  const { run } = useGame();
  return (
    <Modal title="Hire" onClose={onClose} footer={<button className="btn" onClick={onClose}>Close</button>}>
      <p className="muted small">
        Salaries scale with local cost of living. The company must be able to carry four months of
        payroll before it can add anyone.
      </p>
      <div className="list">
        {COMPANY_ROLES.map((role) => (
          <div key={role.title} className="list-item list-static">
            <div className="grow">
              <div className="small strong">{role.title}</div>
              <div className="xs dim">{role.description}</div>
              {role.authorityShare > 0 && (
                <div className="xs muted">Carries {Math.round(role.authorityShare * 100)}% of the greenlight ceiling.</div>
              )}
            </div>
            <span className="mono small">{formatMoney(role.baseSalary, { cents: false })}</span>
            <button
              className="btn btn-sm"
              onClick={() => { run('co.hire', { companyId, title: role.title }); onClose(); }}
            >
              Hire
            </button>
          </div>
        ))}
      </div>
    </Modal>
  );
}

function FoundDialog({ onClose }: { onClose: () => void }) {
  const { run } = useGame();
  const [name, setName] = useState('');
  const [structure, setStructure] = useState<'llc' | 's_corp' | 'c_corp' | 'sole_proprietor'>('llc');
  const [capital, setCapital] = useState(25_000);

  const submit = () => {
    const result = run('co.found', {
      name, structure, kind: 'production',
      initialCapital: capital * 100,
      strategy: 'Develop and produce original material.',
    });
    if (result.ok) onClose();
  };

  return (
    <Modal
      title="Found A Company"
      onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={submit}>Found It</button></>}
    >
      <div className="field">
        <label htmlFor="name">Name</label>
        <input id="name" type="text" value={name} placeholder="Leave blank and one will be suggested" onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="structure">Structure</label>
        <select id="structure" value={structure} onChange={(e) => setStructure(e.target.value as typeof structure)}>
          <option value="sole_proprietor">Sole proprietor — cheapest, no separation</option>
          <option value="llc">LLC — the usual choice</option>
          <option value="s_corp">S corporation</option>
          <option value="c_corp">C corporation — for taking outside money</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="capital">Starting Capital</label>
        <input id="capital" type="number" min={1000} step={1000} value={capital} onChange={(e) => setCapital(Number(e.target.value))} />
        <p className="xs dim" style={{ marginTop: 4 }}>
          This moves out of your personal account and becomes the company's. Everything it can commit to
          is derived from it.
        </p>
      </div>
      <div className="callout callout-accent">
        Overhead starts immediately. A company that cannot make payroll damages its reputation and its
        people.
      </div>
    </Modal>
  );
}
