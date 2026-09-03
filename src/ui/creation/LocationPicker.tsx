/**
 * Choosing where in the world to start.
 *
 * SLATE knows every country, every first-level subdivision of every country,
 * and every populated place of a thousand people or more — a hundred and
 * seventy thousand of them. A flat dropdown is useless at that size, so this
 * narrows: country, then state or province, then the town itself by name.
 *
 * Only the country you are looking at is ever fetched. Picking Italy pulls
 * Italy's ten thousand towns and nothing else, once.
 */

import { useEffect, useMemo, useState } from 'react';
import {
  CITIES, COUNTRIES, REGIONS, cityCount, isCountryLoaded, loadCountryCities,
} from '@/engine/content/geography';
import type { City } from '@/engine/content/geography';

/** How many matches to render at once. Enough to choose from, cheap to draw. */
const VISIBLE_MATCHES = 60;

export function LocationPicker({
  cityId, onPick,
}: {
  cityId: string;
  onPick: (city: City) => void;
}) {
  const selected = CITIES.get(cityId);
  const [countryId, setCountryId] = useState(selected?.countryId ?? 'us');
  const [regionId, setRegionId] = useState<string>('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [problem, setProblem] = useState<string | undefined>();
  const [loadedTick, setLoadedTick] = useState(0);

  const countries = useMemo(
    () => COUNTRIES.all().slice().sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );

  const regions = useMemo(
    () => REGIONS.all().filter((r) => r.parentId === countryId).sort((a, b) => a.name.localeCompare(b.name)),
    [countryId],
  );

  // Pull the chosen country's towns in, once.
  useEffect(() => {
    let cancelled = false;
    if (isCountryLoaded(countryId)) return;
    setLoading(true);
    setProblem(undefined);
    loadCountryCities(countryId)
      .then(() => { if (!cancelled) setLoadedTick((n) => n + 1); })
      .catch((error: unknown) => {
        if (!cancelled) setProblem(error instanceof Error ? error.message : 'That country could not be loaded.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [countryId]);

  const matches = useMemo(() => {
    void loadedTick;
    const needle = query.trim().toLowerCase();
    const pool = CITIES.all().filter((c) => (
      c.countryId === countryId
      && (regionId === '' || c.parentId === regionId)
      && (needle === '' || c.name.toLowerCase().includes(needle))
    ));
    // The places most people mean come first: where the industry is, then size.
    pool.sort((a, b) => b.industryPresence - a.industryPresence
      || b.population - a.population
      || a.name.localeCompare(b.name));
    return pool;
  }, [countryId, regionId, query, loadedTick]);

  const known = cityCount(countryId);

  return (
    <div className="col gap-3">
      <div className="grid grid-2">
        <div className="field">
          <label htmlFor="country">Country</label>
          <select
            id="country"
            value={countryId}
            onChange={(e) => { setCountryId(e.target.value); setRegionId(''); setQuery(''); }}
          >
            {countries.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <p className="hint">
            {known > 0
              ? `${known.toLocaleString('en-US')} town${known === 1 ? '' : 's'} and cit${known === 1 ? 'y' : 'ies'} on record.`
              : 'No settlements on record for this country.'}
          </p>
        </div>

        <div className="field">
          <label htmlFor="region">State Or Region</label>
          <select
            id="region"
            value={regionId}
            onChange={(e) => { setRegionId(e.target.value); setQuery(''); }}
            disabled={regions.length === 0}
          >
            <option value="">
              {regions.length === 0 ? 'No subdivisions' : `Anywhere in ${COUNTRIES.get(countryId)?.name ?? 'the country'}`}
            </option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <p className="hint">
            {regions.length > 0
              ? `${regions.length} to choose from.`
              : 'This country is not subdivided.'}
          </p>
        </div>
      </div>

      <div className="field">
        <label htmlFor="city-search">Town Or City</label>
        <input
          id="city-search"
          type="search"
          value={query}
          placeholder={loading ? 'Loading the country…' : 'Start typing a town name'}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
        />
        {problem && <p className="hint" role="alert">{problem}</p>}
      </div>

      <div className="picker-results" role="listbox" aria-label="Matching places">
        {matches.length === 0 && !loading && (
          <p className="hint" style={{ padding: 'var(--s3)' }}>
            Nothing matches “{query}” there. Try a different spelling, or widen the region.
          </p>
        )}
        {matches.slice(0, VISIBLE_MATCHES).map((c) => (
          <button
            type="button"
            key={c.id}
            role="option"
            aria-selected={c.id === cityId}
            className="picker-option"
            data-selected={c.id === cityId ? 'true' : undefined}
            onClick={() => onPick(c)}
          >
            <span className="picker-option-name truncate">{c.name}</span>
            <span className="picker-option-meta truncate">
              {REGIONS.get(c.parentId)?.name ?? COUNTRIES.get(c.countryId)?.name}
              {c.population > 0 && ` · ${c.population.toLocaleString('en-US')} people`}
              {c.industryPresence > 0 && ` · industry ${c.industryPresence}/100`}
            </span>
          </button>
        ))}
        {matches.length > VISIBLE_MATCHES && (
          <p className="hint" style={{ padding: 'var(--s3)' }}>
            {(matches.length - VISIBLE_MATCHES).toLocaleString('en-US')} more match. Keep typing to narrow it down.
          </p>
        )}
      </div>
    </div>
  );
}
