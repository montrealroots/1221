/**
 * SLATE — Go Anywhere.
 *
 * Searches the actual universe, not a list of menu names: people you know,
 * properties you own, projects you are on, vehicles, companies, cities,
 * catalog items, and every workspace. Keyboard first.
 */

import { titleCaseLabel } from '@/engine/core/text';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '@/app/game-context';
import type { Simulation } from '@/engine';
import { CITIES, AIRPORTS } from '@/engine/content/geography';
import { CATALOG } from '@/engine/content/catalog';
import { VEHICLE_MODELS } from '@/engine/content/vehicles';
import { normalise, scoreMatch } from '@/engine/content/reference';
import { formatMoneyCompact } from '@/engine/core/money';
import { labelForRoute } from '@/app/game-context';

interface Hit {
  id: string;
  group: string;
  title: string;
  detail: string;
  route: string;
  score: number;
}

const DESTINATIONS: { route: string; label: string; keywords: string[]; detail: string }[] = [
  { route: '/home', label: 'Home', keywords: ['dashboard', 'decisions', 'today'], detail: 'Your immediate life' },
  { route: '/world', label: 'World', keywords: ['discover', 'browse', 'explore'], detail: 'Everything there is to do' },
  { route: '/workspace/calendar', label: 'Calendar', keywords: ['schedule', 'diary', 'conflicts', 'dates', 'plan', 'plan something', 'reminder'], detail: 'Every commitment you have' },
  { route: '/workspace/bank', label: 'Bank', keywords: ['money', 'accounts', 'bills', 'credit', 'transactions', 'tax'], detail: 'Accounts, bills and credit' },
  { route: '/workspace/wellbeing', label: 'Wellbeing', keywords: ['energy', 'stress', 'sleep', 'health', 'rest', 'eat', 'play it out', 'scene', 'workout', 'run', 'read', 'rehearse'], detail: 'Energy, stress and rest' },
  { route: '/workspace/relationships', label: 'Relationships', keywords: ['friends', 'dating', 'family', 'spouse', 'partner', 'marriage', 'children'], detail: 'Everyone you know' },
  { route: '/workspace/property', label: 'Property', keywords: ['house', 'home', 'buy house', 'build house', 'rent', 'real estate', 'mansion', 'land', 'construction', 'interior'], detail: 'Buy, build and furnish' },
  { route: '/workspace/vehicles', label: 'Vehicles', keywords: ['car', 'cars', 'buy car', 'service', 'modify', 'garage'], detail: 'Buy, own, service and modify' },
  { route: '/workspace/shopping', label: 'Shopping', keywords: ['buy', 'store', 'groceries', 'clothes', 'watch', 'jewellery', 'wardrobe'], detail: 'Everything you can buy' },
  { route: '/workspace/city', label: 'The City', keywords: ['eat', 'restaurant', 'food', 'dinner', 'drink', 'bar', 'coffee', 'gas', 'fuel', 'petrol', 'drive', 'walk', 'taxi', 'sights', 'landmark', 'museum', 'park', 'beach', 'gym', 'workout', 'train', 'membership', 'day pass', 'trainer', 'shower', 'where am i'], detail: 'Where you are and everywhere you could go' },
  { route: '/workspace/travel', label: 'Travel', keywords: ['flight', 'fly', 'hotel', 'trip', 'airport', 'private jet', 'charter'], detail: 'Trips, flights and hotels' },
  { route: '/workspace/health', label: 'Health', keywords: ['doctor', 'dentist', 'chiropractor', 'appointment', 'therapy', 'optometrist'], detail: 'Providers and appointments' },
  { route: '/workspace/insurance', label: 'Insurance', keywords: ['policy', 'claim', 'cover', 'premium'], detail: 'Policies and claims' },
  { route: '/workspace/education', label: 'Education', keywords: ['class', 'course', 'coach', 'training', 'acting class', 'learn'], detail: 'Classes and coaching' },
  { route: '/workspace/social', label: 'Social', keywords: ['post', 'followers', 'audience', 'brand deal', 'sponsorship', 'creator'], detail: 'Platforms and audience' },
  { route: '/workspace/history', label: 'History', keywords: ['timeline', 'past', 'memories', 'milestones', 'what happened'], detail: 'Everything that has happened' },
  { route: '/workspace/character', label: 'Character', keywords: ['attributes', 'traits', 'skills', 'reputation', 'me', 'stats'], detail: 'Attributes, traits and standing' },
  { route: '/workspace/settings', label: 'Settings', keywords: ['preferences', 'accessibility', 'motion', 'audio', 'tutorial'], detail: 'Preferences and accessibility' },
];

export function GoAnywhere() {
  const { sim, navigate, setSearchOpen, recent, favourites, toggleFavourite } = useGame();
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { setCursor(0); }, [query]);

  const hits = useMemo(() => search(sim, query), [sim, query]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setCursor((c) => Math.min(hits.length - 1, c + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const hit = hits[cursor];
      if (hit) navigate(hit.route, hit.title);
    }
  };

  const grouped = useMemo(() => {
    const map = new Map<string, Hit[]>();
    for (const hit of hits) {
      const list = map.get(hit.group) ?? [];
      list.push(hit);
      map.set(hit.group, list);
    }
    return [...map.entries()];
  }, [hits]);

  let flatIndex = -1;

  return (
    <div className="overlay" onClick={() => setSearchOpen(false)}>
      <div
        className="search-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Go Anywhere"
      >
        <input
          ref={inputRef}
          className="search-input"
          type="search"
          placeholder="Go anywhere. Try a doctor, a car, a person, build house, box office…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          aria-label="Search Everything"
          aria-controls="go-anywhere-results"
        />

        <div className="search-results" id="go-anywhere-results" role="listbox">
          {query.trim() === '' && (
            <>
              {favourites.length > 0 && (
                <>
                  <div className="search-group-label">Favourites</div>
                  {favourites.map((entry) => (
                    <div key={entry.route} className="search-row">
                      <button className="search-result grow" onClick={() => navigate(entry.route, entry.label)}>
                        <span className="grow">{entry.label}</span>
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => toggleFavourite(entry)} aria-label={`Unfavourite ${entry.label}`}>
                        Unfavourite
                      </button>
                    </div>
                  ))}
                </>
              )}
              {recent.length > 0 && (
                <>
                  <div className="search-group-label">Recent</div>
                  {recent.map((entry) => {
                    const saved = favourites.some((f) => f.route === entry.route);
                    return (
                      <div key={entry.route} className="search-row">
                        <button className="search-result grow" onClick={() => navigate(entry.route, entry.label)}>
                          <span className="grow">{entry.label}</span>
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => toggleFavourite(entry)} aria-label={`${saved ? 'Unfavourite' : 'Favourite'} ${entry.label}`}>
                          {saved ? 'Unfavourite' : 'Favorite'}
                        </button>
                      </div>
                    );
                  })}
                </>
              )}
              <div className="search-group-label">Everywhere you can go</div>
              {DESTINATIONS.map((destination) => (
                <button
                  key={destination.route}
                  className="search-result"
                  onClick={() => navigate(destination.route, destination.label)}
                >
                  <span className="grow">
                    <span className="small strong">{destination.label}</span>
                    <span className="xs dim" style={{ display: 'block' }}>{destination.detail}</span>
                  </span>
                </button>
              ))}
            </>
          )}

          {query.trim() !== '' && hits.length === 0 && (
            <div className="empty">
              <h3>Nothing matched “{query}”</h3>
              <p className="small">
                Try a place, a person you know, something you own, or what you are trying to do —
                “buy a house”, “audition”, “start a studio”.
              </p>
            </div>
          )}

          {grouped.map(([group, groupHits]) => (
            <div key={group}>
              <div className="search-group-label">{group}</div>
              {groupHits.map((hit) => {
                flatIndex++;
                const index = flatIndex;
                return (
                  <button
                    key={hit.id}
                    className="search-result"
                    role="option"
                    aria-selected={cursor === index}
                    onMouseEnter={() => setCursor(index)}
                    onClick={() => navigate(hit.route, hit.title)}
                  >
                    <span className="grow">
                      <span className="small strong">{hit.title}</span>
                      <span className="xs dim" style={{ display: 'block' }}>{hit.detail}</span>
                    </span>
                    <span className="xs dim">{labelForRoute(hit.route)}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="search-hint">
          <span><kbd>↑</kbd><kbd>↓</kbd> move</span>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>Esc</kbd> close</span>
          <span className="grow" />
          <span>{hits.length > 0 ? `${hits.length} result${hits.length === 1 ? '' : 's'}` : ''}</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

const MAX_PER_GROUP = 6;

function search(sim: Simulation, rawQuery: string): Hit[] {
  const query = normalise(rawQuery);
  if (!query) return [];
  const hits: Hit[] = [];

  const push = (group: string, id: string, title: string, detail: string, route: string, score: number) => {
    if (score > 0) hits.push({ id, group, title, detail, route, score });
  };

  // Destinations and intents.
  for (const destination of DESTINATIONS) {
    const score = Math.max(
      scoreMatch(query, { name: destination.label, type: 'destination' }),
      ...destination.keywords.map((k) => (normalise(k).includes(query) ? (normalise(k) === query ? 95 : 70) : 0)),
    );
    push('Go to', destination.route, destination.label, destination.detail, destination.route, score);
  }

  // People the player actually knows or has worked with.
  for (const person of Object.values(sim.universe.people)) {
    if (person.tier === 'dormant' && !person.isPlayer) continue;
    const score = scoreMatch(query, { name: person.displayName, aliases: [person.stageName ?? ''], type: 'person' });
    push(
      'People', person.id, person.displayName,
      `${person.careerTrack}${person.industryRole ? ` · ${titleCaseLabel(person.industryRole.replace(/_/g, ' '))}` : ''}`,
      '/workspace/relationships', score,
    );
  }

  // Things the player owns.
  for (const property of Object.values(sim.universe.properties)) {
    if (property.soldAt) continue;
    const score = scoreMatch(query, { name: property.addressLine, aliases: [property.name, property.kind], type: 'property' });
    push('Property', property.id, property.addressLine, `${titleCaseLabel(property.kind.replace(/_/g, ' '))} · ${CITIES.get(property.locationId)?.name ?? ''}`, '/workspace/property', score);
  }
  for (const vehicle of Object.values(sim.universe.vehicles)) {
    if (vehicle.soldAt) continue;
    const label = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
    const score = scoreMatch(query, { name: label, aliases: [vehicle.make, vehicle.model], type: 'vehicle' });
    push('Vehicles', vehicle.id, label, `${vehicle.mileage.toLocaleString('en-US')} miles · ${formatMoneyCompact(vehicle.currentValue)}`, '/workspace/vehicles', score);
  }
  for (const asset of Object.values(sim.universe.assets)) {
    if (asset.soldAt || asset.ownerId !== sim.universe.playerId) continue;
    const score = scoreMatch(query, { name: asset.name, aliases: [asset.brand ?? '', ...asset.tags], type: 'asset' });
    push('Your things', asset.id, asset.name, `${titleCaseLabel(asset.category)} · ${formatMoneyCompact(asset.currentValue)}`, '/workspace/shopping', score);
  }

  // Reference data: places, cars, brands, buyers.
  for (const city of CITIES.all()) {
    const score = scoreMatch(query, city);
    push('Places', city.id, city.name, city.tags.slice(0, 3).join(' · '), '/workspace/travel', score);
  }
  for (const airport of AIRPORTS.all()) {
    const score = scoreMatch(query, airport);
    push('Airports', airport.id, `${airport.iata} — ${airport.name}`, CITIES.get(airport.parentId)?.name ?? '', '/workspace/travel', score);
  }
  for (const model of VEHICLE_MODELS.all()) {
    const score = scoreMatch(query, model);
    push('Cars for sale', model.id, `${model.make} ${model.name}`, `${model.bodyStyle} · ${titleCaseLabel(model.segment)}`, '/workspace/vehicles', score);
  }
  for (const item of CATALOG.all()) {
    if (item.category === 'groceries') continue;
    const score = scoreMatch(query, item);
    push('Things to buy', item.id, item.name, `${titleCaseLabel(item.category)} · ${formatMoneyCompact(item.basePrice)}`, '/workspace/shopping', score);
  }

  // Rank, then cap each group so one category cannot flood the list.
  hits.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  const counts = new Map<string, number>();
  return hits.filter((hit) => {
    const used = counts.get(hit.group) ?? 0;
    if (used >= MAX_PER_GROUP) return false;
    counts.set(hit.group, used + 1);
    return true;
  }).slice(0, 40);
}
