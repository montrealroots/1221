import { titleCaseLabel } from '@/engine/core/text';
import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Empty, Tabs } from '@/ui/components/primitives';
import { redactForPlayer } from '@/engine/core/audit';
import type { HistoryCategory } from '@/engine/core/audit';
import { formatDate } from '@/engine/core/time';
import { formatMoneyCompact } from '@/engine/core/money';

const CATEGORIES: (HistoryCategory | 'all')[] = [
  'all', 'life', 'career', 'project', 'finance', 'property', 'vehicle',
  'relationship', 'family', 'travel', 'social', 'company', 'award', 'education', 'health',
];

export function HistoryWorkspace() {
  const { sim } = useGame();
  const [category, setCategory] = useState<HistoryCategory | 'all'>('all');
  const [tab, setTab] = useState<'timeline' | 'why'>('timeline');

  const history = useWorld((s) => s.historian.timeline({
    category: category === 'all' ? undefined : category,
    limit: 400,
  }));
  const audits = useWorld((s) => s.universe.audits.slice(-60).reverse().map(redactForPlayer));

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">History</div>
        <h1>The world remembers.</h1>
        <p className="muted">
          Everywhere you lived, everything you drove, everyone you were with, everything you made.
        </p>
      </div>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'timeline', label: 'Timeline' },
          { id: 'why', label: 'Why Did This Happen?' },
        ]}
      />

      {tab === 'timeline' && (
        <>
          <div className="row wrap gap-2" style={{ marginBottom: 'var(--s4)' }}>
            {CATEGORIES.map((name) => (
              <button
                key={name}
                className="chip"
                aria-pressed={category === name}
                style={category === name ? { background: 'var(--accent-dim)', color: 'var(--accent-strong)', borderColor: 'var(--accent-line)' } : undefined}
                onClick={() => setCategory(name)}
              >
                {name === 'all' ? 'Everything' : titleCaseLabel(name)}
              </button>
            ))}
          </div>

          <Panel flush>
            {history.length === 0 ? (
              <Empty title="Nothing Yet" body="Your history begins the moment something worth remembering happens." />
            ) : (
              <div className="list">
                {history.map((record) => (
                  <div key={record.id} className="list-item list-static">
                    <div style={{ minWidth: 108 }} className="xs dim nowrap">
                      {formatDate(record.at, sim.homeZone)}
                    </div>
                    <div className="grow">
                      <div className="small strong">{record.title}</div>
                      <div className="xs muted">{record.detail}</div>
                    </div>
                    {record.amount !== undefined && record.amount !== 0 && (
                      <span className="mono xs">{formatMoneyCompact(record.amount)}</span>
                    )}
                    <span className="chip">{titleCaseLabel(record.category)}</span>
                    {record.public && <span className="chip chip-info">Public</span>}
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </>
      )}

      {tab === 'why' && (
        <Panel
          title="Explanations"
          subtitle="Every consequential outcome records what went into it. Information your character couldn’t have known is never shown."
          flush
        >
          {audits.length === 0 ? (
            <Empty title="Nothing To Explain Yet" body="Once decisions start going for and against you, the reasons appear here." />
          ) : (
            <div className="list">
              {audits.map((audit) => (
                <details key={audit.id} className="list-item list-static" style={{ display: 'block' }}>
                  <summary style={{ cursor: 'pointer' }}>
                    <div className="row gap-3">
                      <span className="xs dim nowrap" style={{ minWidth: 100 }}>
                        {formatDate(audit.at, sim.homeZone)}
                      </span>
                      <div className="grow">
                        <div className="small strong">{audit.question}</div>
                        <div className="xs muted">{audit.summary}</div>
                      </div>
                      <span className="chip">{titleCaseLabel(audit.outcome)}</span>
                    </div>
                  </summary>

                  <div style={{ paddingTop: 'var(--s3)', paddingLeft: 112 }}>
                    {audit.factors.map((factor, index) => (
                      <div key={index} style={{ marginBottom: 'var(--s3)' }}>
                        <div className="row-between">
                          <span className="small strong">{factor.label}</span>
                          {factor.weight > 0 && (
                            <span className="xs dim mono">{Math.round(factor.weight * 100)}% weight</span>
                          )}
                        </div>
                        <div className="xs muted">{factor.detail}</div>
                      </div>
                    ))}

                    {(audit.probability !== undefined || audit.score !== undefined) && (
                      <div className="callout" style={{ marginTop: 'var(--s3)' }}>
                        <div className="xs mono">
                          {audit.score !== undefined && `score ${audit.score.toFixed(3)}  `}
                          {audit.probability !== undefined && `probability ${(audit.probability * 100).toFixed(1)}%  `}
                          {audit.roll !== undefined && `roll ${audit.roll.toFixed(4)}  `}
                          rules {audit.rulesVersion}
                        </div>
                        {audit.seed && (
                          <div className="xs dim" style={{ marginTop: 4 }}>
                            This outcome is reproducible from the seed <span className="mono wrap">{audit.seed}</span>. It will never silently reroll.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </details>
              ))}
            </div>
          )}
        </Panel>
      )}
    </>
  );
}
