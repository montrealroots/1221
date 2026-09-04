/**
 * SLATE — the help panel.
 *
 * Contextual by default: it opens on whatever screen you are looking at and
 * answers the five questions. Search finds any article by what a player would
 * actually type.
 */

import { useMemo, useState } from 'react';
import { useGame } from '@/app/game-context';
import { HELP_ARTICLES, HELP_BY_ROUTE, searchHelp, type HelpArticle } from './help-content';

export function HelpPanel() {
  const { sim, route, setHelpOpen, navigate, run } = useGame();
  const [query, setQuery] = useState('');
  const [pinned, setPinned] = useState<string | null>(null);

  const advanced = sim.universe.tutorial.advancedMode;
  const results = useMemo(() => (query.trim() ? searchHelp(query) : []), [query]);
  const article: HelpArticle | undefined = pinned
    ? HELP_ARTICLES.find((a) => a.id === pinned)
    : HELP_BY_ROUTE[route] ?? HELP_BY_ROUTE['/home'];

  return (
    <aside className="help-panel" role="complementary" aria-label="Help">
      <div className="modal-head">
        <div className="row-between">
          <h2>Help</h2>
          <button className="btn btn-ghost btn-sm" onClick={() => setHelpOpen(false)} aria-label="Close Help">✕</button>
        </div>
        <input
          type="search"
          placeholder="How do I buy a house?"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPinned(null); }}
          style={{ marginTop: 'var(--s3)' }}
          aria-label="Search Help"
        />
      </div>

      <div className="help-body">
        {query.trim() !== '' && (
          <>
            {results.length === 0 ? (
              <p className="muted small">
                Nothing matched that. Try naming the thing you want to do — “audition”, “buy a car”, “start a studio”.
              </p>
            ) : (
              <div className="list card card-flush" style={{ marginBottom: 'var(--s5)' }}>
                {results.map((result) => (
                  <button key={result.id} className="list-item" onClick={() => { setPinned(result.id); setQuery(''); }}>
                    <div className="grow">
                      <div className="small strong">{result.title}</div>
                      <div className="xs dim truncate">{result.what}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {article && query.trim() === '' && (
          <>
            <div className="row-between" style={{ marginBottom: 'var(--s4)' }}>
              <h3>{article.title}</h3>
              {article.route !== route && (
                <button className="btn btn-sm" onClick={() => navigate(article.route, article.title)}>
                  Go There
                </button>
              )}
            </div>

            <div className="help-section">
              <h4>What is this?</h4>
              <p className="small">{article.what}</p>
            </div>

            {article.affects.length > 0 && (
              <div className="help-section">
                <h4>What affects it?</h4>
                <ul className="small" style={{ margin: 0, paddingLeft: 'var(--s4)' }}>
                  {article.affects.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            )}

            {article.actions.length > 0 && (
              <div className="help-section">
                <h4>What can I do here?</h4>
                <ul className="small" style={{ margin: 0, paddingLeft: 'var(--s4)' }}>
                  {article.actions.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            )}

            {article.connects.length > 0 && (
              <div className="help-section">
                <h4>Where does it connect?</h4>
                <ul className="small" style={{ margin: 0, paddingLeft: 'var(--s4)' }}>
                  {article.connects.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            )}

            {advanced && article.advanced && article.advanced.length > 0 && (
              <div className="help-section">
                <h4>Under The Hood</h4>
                <ul className="small mono" style={{ margin: 0, paddingLeft: 'var(--s4)' }}>
                  {article.advanced.map((item) => <li key={item} style={{ marginBottom: 'var(--s2)' }}>{item}</li>)}
                </ul>
              </div>
            )}

            {!advanced && article.advanced && (
              <button
                className="btn btn-sm"
                onClick={() => run('tutorial.set_mode', { advanced: true })}
              >
                Show The Mechanics Behind This
              </button>
            )}
          </>
        )}

        <hr className="divider" />

        <div className="help-section">
          <h4>Everything</h4>
          <div className="list card card-flush">
            {HELP_ARTICLES.map((entry) => (
              <button key={entry.id} className="list-item" onClick={() => { setPinned(entry.id); setQuery(''); }}>
                <span className="small grow">{entry.title}</span>
                <span className="xs dim">›</span>
              </button>
            ))}
          </div>
        </div>

        <div className="help-section">
          <h4>Keyboard</h4>
          <div className="col gap-1 small">
            <div className="row-between"><span className="muted">Go Anywhere</span><span><kbd>/</kbd> or <kbd>Ctrl</kbd><kbd>K</kbd></span></div>
            <div className="row-between"><span className="muted">Help</span><kbd>?</kbd></div>
            <div className="row-between"><span className="muted">Home</span><kbd>H</kbd></div>
            <div className="row-between"><span className="muted">World</span><kbd>W</kbd></div>
            <div className="row-between"><span className="muted">Close anything</span><kbd>Esc</kbd></div>
          </div>
        </div>
      </div>
    </aside>
  );
}
