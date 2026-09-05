/**
 * Choosing a place in the world.
 *
 * SLATE knows every country, every first-level subdivision of every country,
 * and every populated place of a thousand people or more — a hundred and
 * seventy thousand of them. A flat dropdown is useless at that size, so this
 * narrows: the map or the country list, then the state or province, then the
 * town itself by name.
 *
 * Only the country you are looking at is ever fetched. Picking Italy pulls
 * Italy's ten thousand towns and nothing else, once.
 *
 * Two of these can sit on one form — where you live and where you are from —
 * so every control here is named from `idPrefix` rather than hard-coded, and
 * each keeps its own country, region and search.
 */

import { useEffect, useId, useMemo, useState } from 'react';
import {
  CITIES, COUNTRIES, REGIONS, cityCount, isCountryLoaded, loadCountryCities,
} from '@/engine/content/geography';
import type { City } from '@/engine/content/geography';
import { WorldMap } from './WorldMap';

/** How many matches to render at once. Enough to choose from, cheap to draw. */
const VISIBLE_MATCHES = 60;

export function LocationPicker({
  cityId, onPick, idPrefix, map = true,
}: {
  cityId: string;
  onPick: (city: City) => void;
  /** Distinguishes this picker's controls from any other on the page. */
  idPrefix?: string;
  /** Whether to offer the map. */
  map?: boolean;
}) {
  const fallbackPrefix = useId();
  const prefix = idPrefix ?? fallbackPrefix;
  const selected = CITIES.get(cityId);
  const [countryId, setCountryId] = useState(selected?.countryId ?? 'us');
  const [regionId, setRegionId] = useState<string>('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [problem, setProblem] = useState<string | undefined>();
  const [loadedTick, setLoadedTick] = useState(0);
  const [mapOpen, setMapOpen] = useState(map);

  // Somebody else changed the selection — the birthplace following the home
  // town, a draft loading — so follow it rather than sitting on a stale country.
  useEffect(() => {
    const city = CITIES.get(cityId);
    if (city && city.countryId !== countryId) {
      setCountryId(city.countryId);
      setRegionId('');
      setQuery('');
    }
    // Only when the selection itself moves; changing the country by hand is
    // meant to leave the chosen city alone until a new one is picked.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityId]);

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
      {map && (
        <div className="row-between wrap gap-2">
          <p className="xs dim" style={{ margin: 0 }}>
            {mapOpen
              ? 'Tap a country on the map, or use the list.'
              : 'The map is hidden. The list below does the same thing.'}
          </p>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            aria-expanded={mapOpen}
            onClick={() => setMapOpen((open) => !open)}
          >
            {mapOpen ? 'Hide Map' : 'Show Map'}
          </button>
        </div>
      )}

      {map && mapOpen && (
        <WorldMap
          countryId={countryId}
          marker={selected && selected.countryId === countryId
            ? { latitude: selected.latitude, longitude: selected.longitude, name: selected.name }
            : undefined}
          onPick={(picked) => {
            if (picked === countryId) return;
            setCountryId(picked);
            setRegionId('');
            setQuery('');
          }}
        />
      )}

      <div className="grid grid-2">
        <div className="field">
          <label htmlFor={`${prefix}-country`}>Country</label>
          <select
            id={`${prefix}-country`}
            value={countryId}
            onChange={(e) => { setCountryId(e.target.value); setRegionId(''); setQuery(''); }}
          >
            {countries.map((c) => (
              <option key={c.id} value={c.id} data-source="gazetteer">{c.name}</option>
            ))}
          </select>
          <p className="hint">
            {known > 0
              ? `${known.toLocaleString('en-US')} town${known === 1 ? '' : 's'} and cit${known === 1 ? 'y' : 'ies'} on record.`
              : 'No settlements on record for this country.'}
          </p>
        </div>

        <div className="field">
          <label htmlFor={`${prefix}-region`}>State Or Region</label>
          <select
            id={`${prefix}-region`}
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
        <label htmlFor={`${prefix}-search`}>Town Or City</label>
        <input
          id={`${prefix}-search`}
          type="search"
          value={query}
          placeholder={loading ? 'Loading the country…' : 'Start typing a town name'}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
        />
        {problem && <p className="hint" role="alert">{problem}</p>}
      </div>

      <div className="picker-results" role="listbox" aria-label="Matching Places">
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
            <span className="picker-option-name truncate" title={c.name} data-source="gazetteer">{c.name}</span>
            <span
              className="picker-option-meta truncate"
              title={[
                REGIONS.get(c.parentId)?.name ?? COUNTRIES.get(c.countryId)?.name,
                c.population > 0 ? `${c.population.toLocaleString('en-US')} people` : '',
                c.industryPresence > 0 ? `industry ${c.industryPresence}/100` : '',
              ].filter(Boolean).join(' · ')}
            >
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
