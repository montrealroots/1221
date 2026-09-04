/**
 * SLATE — one box that searches the whole industry.
 *
 * People, titles, franchises, studios, networks, awards, genres, certificates
 * and countries, ranked together. It says what it searched and how many of
 * each it holds, so an empty answer is an answer rather than a shrug, and it
 * never invents a result to avoid one.
 */

import { useMemo, useState } from 'react';
import { Panel, Empty } from '@/ui/components/primitives';
import {
  SEARCH_KIND_LABEL, indexCoverage, searchEverything, type SearchKind, type SearchResult,
} from '@/engine/content/search';
import { personByQid } from '@/engine/content/people';
import { PersonProfile } from '@/ui/components/PeopleTab';

const KIND_ORDER: SearchKind[] = ['person', 'title', 'franchise', 'studio', 'network', 'award', 'genre', 'certificate', 'country'];

export function SearchEverything({
  onOpenStudio, onOpenNetwork,
}: {
  onOpenStudio?: (id: string) => void;
  onOpenNetwork?: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [kinds, setKinds] = useState<Set<SearchKind>>(new Set());
  const [openPerson, setOpenPerson] = useState<string | null>(null);

  const coverage = useMemo(() => indexCoverage(), []);
  const results = useMemo(
    () => searchEverything(query, { kinds: kinds.size > 0 ? [...kinds] : undefined, limit: 60 }),
    [query, kinds],
  );

  const toggle = (kind: SearchKind) => {
    setKinds((current) => {
      const next = new Set(current);
      if (next.has(kind)) next.delete(kind); else next.add(kind);
      return next;
    });
  };

  const open = (result: SearchResult) => {
    if (result.kind === 'person') { setOpenPerson(result.id); return; }
    if (result.kind === 'studio') { onOpenStudio?.(result.id); return; }
    if (result.kind === 'network') { onOpenNetwork?.(result.id); return; }
  };

  const person = openPerson ? personByQid(openPerson) : undefined;
  const total = coverage.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <>
      <Panel
        title="Search The Industry"
        subtitle={`${total.toLocaleString('en-US')} things indexed: ${coverage.map((c) => `${c.count.toLocaleString('en-US')} ${SEARCH_KIND_LABEL[c.kind].toLowerCase()}`).join(', ')}.`}
      >
        <input
          className="search-input"
          type="search"
          value={query}
          placeholder="A name, a title, a franchise, a studio, an award, a year"
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search The Industry"
          style={{ width: '100%', marginBottom: 'var(--s3)' }}
          autoFocus
        />
        <div className="row wrap gap-1">
          {KIND_ORDER.filter((kind) => coverage.some((c) => c.kind === kind)).map((kind) => (
            <button
              key={kind}
              className="chip"
              aria-pressed={kinds.has(kind)}
              style={kinds.has(kind) ? { background: 'var(--accent-dim)', color: 'var(--accent-strong)', borderColor: 'var(--accent-line)' } : undefined}
              onClick={() => toggle(kind)}
            >
              {SEARCH_KIND_LABEL[kind]}
            </button>
          ))}
          {kinds.size > 0 && <button className="link xs" onClick={() => setKinds(new Set())}>Clear The Filters</button>}
        </div>
      </Panel>

      {query.trim().length < 2 ? (
        <Empty
          title="Type Anything"
          body="A person, a film, a series, a franchise, a studio, a network, an award, a genre, a certificate or a country. Two letters is enough to start."
        />
      ) : results.length === 0 ? (
        <Empty
          title="Nothing Matches That"
          body="It is not in what has been loaded. The catalogue arrives a studio at a time, so something recent or obscure may simply not be in hand yet."
        />
      ) : (
        <Panel title={`${results.length} Result${results.length === 1 ? '' : 's'}`} flush>
          <div className="list">
            {results.map((result) => {
              const clickable = result.kind === 'person' || (result.kind === 'studio' && onOpenStudio) || (result.kind === 'network' && onOpenNetwork);
              const Row = clickable ? 'button' : 'div';
              return (
                <Row
                  key={`${result.kind}-${result.id}`}
                  className={`list-item${clickable ? '' : ' list-static'}`}
                  onClick={clickable ? () => open(result) : undefined}
                >
                  <span className="chip" style={{ flexShrink: 0 }}>{SEARCH_KIND_LABEL[result.kind]}</span>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="small strong" style={{ overflowWrap: 'anywhere' }}>{result.label}</div>
                    <div className="xs dim" style={{ overflowWrap: 'anywhere' }}>{result.detail}</div>
                  </div>
                  {clickable && <span className="xs dim">Open</span>}
                </Row>
              );
            })}
          </div>
        </Panel>
      )}

      {person && <PersonProfile person={person} onClose={() => setOpenPerson(null)} />}
    </>
  );
}
