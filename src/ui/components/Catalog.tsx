/**
 * The controls every catalog shares (`systems/catalog.ts`, from 2026-10-01):
 * a search, its filters and its sort, the cheapest first unless changed.
 * Each list keeps its own for the session, so going into an item and coming
 * back finds the list as it was left.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { SORT_LABEL, arrange, facetValues, favoritesIn, type CatalogEntry, type CatalogSort, type CatalogView } from '@/engine/systems/catalog';
import { useGame, useWorld } from '@/app/game-context';
import { Gated } from '@/ui/guide/Guide';

/** A list's view, kept for the session under its own key. Browser storage is a convenience: without it, the list starts fresh. */
export function useCatalogView(key: string): [CatalogView, (next: CatalogView) => void] {
  const storageKey = `slate.catalog.${key}`;
  const [view, setView] = useState<CatalogView>(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as CatalogView) : {};
    } catch {
      return {};
    }
  });
  const update = (next: CatalogView) => {
    setView(next);
    try { sessionStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* the list works without it */ }
  };
  return [view, update];
}

/** A facet's value as a label: a research word's hyphens as spaces, and each word capitalized, after a slash too (from 2026-10-05; until then "bath-towel" read "Bath-Towel" and "islamic/modest wear" "Islamic/modest Wear"). */
export const facetLabel = (v: string): string => v.replace(/-/g, ' ').replace(/(^|[\s/(])(\p{L})/gu, (_m, s: string, c: string) => s + c.toUpperCase());

/** The search, the filters by each facet named, and the sort. */
export function CatalogControls({ id, entries, view, onChange, facets = {}, lead }: { id: string; entries: readonly CatalogEntry[]; view: CatalogView; onChange: (v: CatalogView) => void; facets?: Readonly<Record<string, string>>; lead?: ReactNode }) {
  const basis = entries[0]?.basis;
  // A list's favorites, by the list's name (from 2026-10-03); narrowed to them, it follows them as they change.
  const list = id.replace(/-catalog$/, '');
  const favorites = useWorld((s) => favoritesIn(s.player, list));
  const key = favorites.join('|');
  useEffect(() => { if (view.only && view.only.join('|') !== key) onChange({ ...view, only: favorites }); });
  return (
    <div className="col gap-1">
      {/* The screen's own field grid, so each field is as wide as the rest of the form; a choice the list depends on leads it. */}
      <div className="field-row field-row-tight">
        {lead}
        <div className="field">
          <label htmlFor={`${id}-search`}>Search</label>
          <input id={`${id}-search`} value={view.query ?? ''} placeholder="A name or a word" onChange={(e) => onChange({ ...view, query: e.target.value })} />
        </div>
        {Object.entries(facets).map(([facet, label]) => {
          // Each filter offers what's left by the others and the search (from 2026-10-05; until then every value, whatever else was chosen).
          const { [facet]: _own, ...others } = view.filters ?? {};
          const values = facetValues(arrange(entries, { ...view, filters: others }), facet);
          const chosen = view.filters?.[facet];
          if (chosen && !values.includes(chosen)) values.push(chosen);
          if (values.length < 2 && !chosen) return null;
          return (
            <div key={facet} className="field">
              <label htmlFor={`${id}-${facet}`}>{label}</label>
              <select id={`${id}-${facet}`} value={view.filters?.[facet] ?? ''} onChange={(e) => onChange({ ...view, filters: { ...(view.filters ?? {}), [facet]: e.target.value } })}>
                <option value="">Any</option>
                {values.map((v) => <option key={v} value={v}>{facetLabel(v)}</option>)}
              </select>
            </div>
          );
        })}
        {(favorites.length > 0 || view.only) && (
          <label className="small row gap-1" style={{ alignItems: 'center', alignSelf: 'flex-end' }}><input type="checkbox" checked={Boolean(view.only)} onChange={(e) => { const { only: _only, ...rest } = view; onChange(e.target.checked ? { ...view, only: favorites } : rest); }} />Favorites Only</label>
        )}
        <div className="field">
          <label htmlFor={`${id}-sort`}>Sort</label>
          <select id={`${id}-sort`} value={view.sort ?? 'cheapest'} onChange={(e) => onChange({ ...view, sort: e.target.value as CatalogSort })}>
            {(Object.keys(SORT_LABEL) as CatalogSort[]).map((s) => <option key={s} value={s}>{SORT_LABEL[s]}</option>)}
          </select>
        </div>
      </div>
      {basis && <div className="xs dim">{`Prices are ${basis.toLowerCase()}. One SLATE doesn’t know is never counted as nothing: it’s listed last, as a quote or unknown.`}</div>}
    </div>
  );
}

/** Marks a thing in a list a favorite, or not. */
export function FavoriteToggle({ list, id }: { list: string; id: string }) {
  const { run } = useGame();
  const on = useWorld((s) => favoritesIn(s.player, list).includes(id));
  return <Gated feature="catalog.favorite" className="btn btn-sm btn-ghost" aria-pressed={on} onClick={() => run('catalog.favorite', { list, id })}>{on ? 'Unfavorite' : 'Favorite'}</Gated>;
}

/** A price as a catalog shows it: the amount, or what stands in its place. */
export function catalogPrice(entry: CatalogEntry, money: (c: number) => string): string {
  if (entry.price === null) return entry.priceKind === 'quote' ? 'By Quote' : 'Not Known';
  return `${money(entry.price)}${entry.priceKind === 'estimate' ? ' (Estimate)' : ''}`;
}

/**
 * A long list shown a page at a time (from 2026-10-04, the owner's expansion,
 * §7): how many are shown, kept for the session under the list's key, so a
 * list come back to is as far down as it was left.
 */
export function usePaged(key: string, page = 24): [number, () => void, () => void] {
  const storageKey = `slate.paged.${key}`;
  const [count, setCount] = useState<number>(() => {
    try { const n = Number(sessionStorage.getItem(storageKey)); return n > 0 ? n : page; } catch { return page; }
  });
  const set = (n: number) => { setCount(n); try { sessionStorage.setItem(storageKey, String(n)); } catch { /* the list works without it */ } };
  return [count, () => set(count + page), () => set(page)];
}

/** The rest of a list, a page more at a time, and how many there are. */
export function ShowMore({ shown, total, onMore }: { shown: number; total: number; onMore: () => void }) {
  if (total <= shown) return total > 0 ? <div className="xs dim">{`All ${total} shown.`}</div> : null;
  return (
    <div className="row gap-2" style={{ alignItems: 'center' }}>
      <button type="button" className="btn btn-sm btn-ghost" onClick={onMore}>Show More</button>
      <span className="xs dim">{`${shown} of ${total} shown`}</span>
    </div>
  );
}

/** Up to three of a list set side by side (from 2026-10-04): which are chosen, kept for the session. */
export function useCompare(key: string, most = 3): [readonly string[], (id: string) => void, () => void] {
  const storageKey = `slate.compare.${key}`;
  const [ids, setIds] = useState<string[]>(() => {
    try { const raw = sessionStorage.getItem(storageKey); return raw ? (JSON.parse(raw) as string[]) : []; } catch { return []; }
  });
  const set = (next: string[]) => { setIds(next); try { sessionStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* the list works without it */ } };
  const toggle = (id: string) => set(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id].slice(-most));
  return [ids, toggle, () => set([])];
}

/** One thing set beside the others, or taken out; as wide either way, so a row's buttons don't shift when it's chosen. */
export function CompareToggle({ on, onToggle, className = 'btn btn-sm btn-ghost' }: { on: boolean; onToggle: () => void; className?: string }) {
  return <button type="button" className={className} style={{ minWidth: '6.5rem', justifyContent: 'center' }} aria-pressed={on} onClick={onToggle}>{on ? 'Comparing' : 'Compare'}</button>;
}

/** The chosen side by side: a row for each thing compared, a column for each chosen. */
export function CompareTable({ heads, rows, onClear }: { heads: readonly string[]; rows: readonly { label: string; values: readonly ReactNode[] }[]; onClear: () => void }) {
  if (heads.length < 2) return heads.length === 1 ? <div className="xs dim">Choose one more to compare.</div> : null;
  return (
    <div className="col gap-1">
      <div className="table-scroll">
        <table>
          <thead><tr><th scope="col">Compared</th>{heads.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
          <tbody>{rows.map((r) => <tr key={r.label}><th scope="row" className="small">{r.label}</th>{r.values.map((v, i) => <td key={i} className="small">{v}</td>)}</tr>)}</tbody>
        </table>
      </div>
      <div><button type="button" className="btn btn-sm btn-ghost" onClick={onClear}>Clear The Comparison</button></div>
    </div>
  );
}
