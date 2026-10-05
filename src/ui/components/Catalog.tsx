/**
 * The controls every catalog shares (`systems/catalog.ts`, from 2026-10-01):
 * a search, its filters and its sort, the cheapest first unless changed.
 * Each list keeps its own for the session, so going into an item and coming
 * back finds the list as it was left.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { SORT_LABEL, facetValues, favoritesIn, type CatalogEntry, type CatalogSort, type CatalogView } from '@/engine/systems/catalog';
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
          const values = facetValues(entries, facet);
          if (values.length < 2) return null;
          return (
            <div key={facet} className="field">
              <label htmlFor={`${id}-${facet}`}>{label}</label>
              <select id={`${id}-${facet}`} value={view.filters?.[facet] ?? ''} onChange={(e) => onChange({ ...view, filters: { ...(view.filters ?? {}), [facet]: e.target.value } })}>
                <option value="">Any</option>
                {values.map((v) => <option key={v} value={v}>{v.replace(/(^|[\s-])(\w)/g, (_m, s: string, c: string) => s + c.toUpperCase())}</option>)}
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
