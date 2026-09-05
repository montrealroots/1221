/**
 * The company, which does not work yet.
 *
 * The engine underneath it is real as far as it goes — the company exists,
 * it is owned, it has an account and an overhead that is charged every month,
 * and the quality chain that will decide what its work is worth is built and
 * tested. What is not built is everything between those two things: material
 * to develop, people to hire, buyers to sell to.
 *
 * So the tab is here and it is locked, and it says which half is standing and
 * which half is not. A screen that pretended to work would be worse than one
 * that says it does not.
 */

import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat } from '@/ui/components/primitives';
import { formatMoney } from '@/engine/core/money';
import { formatDate } from '@/engine/core/time';
import { SHINGLE_BY_ID } from '@/engine/content/shingle';
import { companyView } from '@/engine/systems/shingle';
import { JOB_DEFS } from '@/engine/content/authorship';
import { jobSheet } from '@/engine/systems/authorship';

/** What is standing, and what is not. Read off the build, not written twice. */
const BUILT: readonly string[] = [
  'The company itself — founded, wholly owned, with its own account.',
  'Overhead, charged every month whether anything is shooting or not.',
  'The quality chain: what your work comes out as, and what holding more than one job on it is worth.',
];

const NOT_BUILT: readonly string[] = [
  'Material. Nothing to write, option or develop yet.',
  'Hiring. No writers, directors, crew or cast to bring in.',
  'Buyers. Nobody to sell a finished thing to.',
  'Production. No schedule, no budget, no shoot.',
];

export function CompanyWorkspace() {
  const { sim } = useGame();
  useWorld((s) => s.player);
  const view = companyView(sim);

  if (!view) {
    return (
      <div className="empty">
        <h3>No Company</h3>
        <p className="small">This save has no production company on it.</p>
      </div>
    );
  }

  const { company, cash } = view;
  const shape = SHINGLE_BY_ID[company.shingle];

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Company</div>
        <h1>
          <span role="img" aria-hidden="true" style={{ marginRight: '0.4em' }}>🎬</span>
          {company.name}
        </h1>
        <p className="muted">
          {shape?.name ?? 'An Independent'} · Opened {formatDate(company.foundedAt, sim.homeZone)}
        </p>
      </div>

      <p className="god-banner" style={{ marginBottom: 'var(--s4)' }}>
        Under Construction. The company is real and the engine behind what it makes is built, but
        there is nothing to develop and nobody to sell to yet, so this screen is locked.
      </p>

      <div className="grid grid-4" style={{ marginBottom: 'var(--s5)' }}>
        <Stat label="In The Bank" value={formatMoney(cash, { cents: false })} note="Company money, not yours" />
        <Stat label="Overhead" value={`${formatMoney(company.overhead, { cents: false })} A Month`} note="Charged whether you shoot or not" />
        <Stat
          label="Runway"
          value={Number.isFinite(view.monthsOfRunway) ? `${view.monthsOfRunway} Months` : '—'}
          note="At overhead alone, making nothing"
        />
        <Stat label="Owned By You" value="100%" note="No partners, no investors" />
      </div>

      <div className="grid grid-2">
        <Panel title="What Works" subtitle="Built, tested and running underneath this screen.">
          <ul className="small" style={{ margin: 0, paddingLeft: '1.1em' }}>
            {BUILT.map((line) => <li key={line} style={{ marginBottom: 4 }}>{line}</li>)}
          </ul>
        </Panel>

        <Panel title="What Does Not" subtitle="Not started. This is why the screen is locked.">
          <ul className="small" style={{ margin: 0, paddingLeft: '1.1em' }}>
            {NOT_BUILT.map((line) => <li key={line} style={{ marginBottom: 4 }}>{line}</li>)}
          </ul>
        </Panel>
      </div>

      <div style={{ marginTop: 'var(--s5)' }}>
      <Panel
        title="What You Would Bring To It"
        subtitle="The five jobs, as the engine reads them off your sheet today."
      >
        <div className="grid grid-3">
          {jobSheet(sim).map((row) => (
            <div key={row.job} className="trait is-fixed">
              <div className="row-between">
                <div className="trait-name">{row.name}</div>
                <span className="chip chip-accent">{row.capability}</span>
              </div>
              <div className="xs dim" style={{ marginTop: 4 }}>
                {JOB_DEFS.find((j) => j.id === row.job)?.owns}
              </div>
            </div>
          ))}
        </div>
      </Panel>
      </div>
    </>
  );
}
