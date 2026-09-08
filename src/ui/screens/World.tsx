/**
 * SLATE — WORLD.
 *
 * The discovery layer. Everything SLATE can do, grouped so that new domains can
 * join without the navigation collapsing.
 */

import { WEATHER_EMOJI, weatherAt } from '@/engine/systems/weather';
import { useGame, useWorld } from '@/app/game-context';
import { Panel } from '@/ui/components/primitives';
import { TutorialCard } from '@/ui/shell/Tutorial';
import { CITIES } from '@/engine/content/geography';
import { formatMoneyCompact } from '@/engine/core/money';
import { netWorth } from '@/engine/systems/finance';

interface Domain {
  label: string;
  blurb: string;
  entries: { route: string; label: string; detail: string }[];
}

const DOMAINS: Domain[] = [
  {
    label: 'Life',
    blurb: 'The ordinary days that everything else is built on.',
    entries: [
      { route: '/workspace/calendar', label: 'Calendar', detail: 'Every commitment, and every collision between them.' },
      { route: '/workspace/wellbeing', label: 'Wellbeing', detail: 'Sleep, energy, stress, food and recovery.' },
      { route: '/workspace/health', label: 'Healthcare', detail: 'Doctors, dentists, therapy and specialists.' },
      { route: '/workspace/education', label: 'Education', detail: 'Classes, coaching and training that actually changes you.' },
      { route: '/workspace/history', label: 'History', detail: 'Everything that has happened to you, kept permanently.' },
    ],
  },
  {
    label: 'Relationships',
    blurb: 'People remember what you did and how long ago you did it.',
    entries: [
      { route: '/workspace/relationships', label: 'People', detail: 'Friends, colleagues, partners, family.' },
      { route: '/workspace/relationships', label: 'Dating', detail: 'Ask someone out, plan it, and see how it goes.' },
      { route: '/workspace/relationships', label: 'Family', detail: 'Marriage, children, households and generations.' },
    ],
  },
  {
    label: 'Marketplace',
    blurb: 'Everything you can own, and everything owning it costs.',
    entries: [
      { route: '/workspace/property', label: 'Property', detail: 'Rent, buy, build from raw land, and design the inside.' },
      { route: '/workspace/vehicles', label: 'Vehicles', detail: 'Buy, finance, service and modify, with fitment that is checked.' },
      { route: '/workspace/shopping', label: 'Shopping', detail: 'Groceries to grand complications, all of it becoming real property.' },
      { route: '/workspace/insurance', label: 'Insurance', detail: 'Quote, premium, claim, decision, renewal.' },
    ],
  },
  {
    label: 'Travel',
    blurb: 'Geography, time zones and being in the right place.',
    entries: [
      { route: '/workspace/travel', label: 'Trips', detail: 'Plan multi-city travel around what you have to attend.' },
      { route: '/workspace/travel', label: 'Flights', detail: 'Commercial cabins and private charter, with real range limits.' },
      { route: '/workspace/travel', label: 'Hotels', detail: 'Rooms, suites and what a long stay actually costs.' },
    ],
  },
  {
    label: 'Film',
    blurb: 'A picture of your own, made with kit somebody else owns.',
    entries: [
      { route: '/workspace/film', label: 'Rental Houses', detail: 'The houses that hire cameras, lamps and sound by the day, and what a week actually bills at.' },
      { route: '/workspace/film', label: 'On Hire', detail: 'What you have out on a ticket, when it is due back, and what it costs when it is late.' },
      { route: '/workspace/film', label: 'Your Own Kit', detail: 'What you bought outright, beside what you hired.' },
      { route: '/workspace/goingout', label: 'What Is On', detail: 'The cinemas in this city, what is showing this week and what a seat costs at each time.' },
      { route: '/workspace/goingout', label: 'Your Tickets', detail: 'The seats you have bought, when the doors open, and what you thought of what you saw.' },
    ],
  },
  {
    label: 'Social',
    blurb: 'Four platforms, one audience engine, no guarantees.',
    entries: [
      { route: '/workspace/phone', label: 'The Phone', detail: 'A handset on the desk, running on the world clock, with YouTube, Instagram, X and TikTok built as the apps.' },
      { route: '/workspace/social', label: 'Platforms', detail: 'Long video, short video, photo and text, each behaving differently.' },
      { route: '/workspace/social', label: 'Audience', detail: 'Segments, affinity, churn and momentum.' },
      { route: '/workspace/social', label: 'Brand Deals', detail: 'Real deliverables, real deadlines, real consequences for missing them.' },
    ],
  },
  {
    label: 'Career And Money',
    blurb: 'The unglamorous machinery underneath all of it.',
    entries: [
      { route: '/workspace/bank', label: 'Finance', detail: 'Accounts, bills, credit, loans and tax that depends on where you live.' },
      { route: '/workspace/character', label: 'Character', detail: '88 attributes, 42 traits, professional skills and seven reputations.' },
    ],
  },
];

export function World() {
  const { navigate } = useGame();
  const { sim } = useGame();
  const player = useWorld((s) => s.player);
  const worth = useWorld((s) => netWorth(s, s.player.id));
  const city = CITIES.get(player.currentLocationId);

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">World</div>
        <h1>Everything there is to do.</h1>
        <p className="muted">
          You are in {city?.name} with {formatMoneyCompact(worth.total)} to your name. Every one of these
          connects to the others; nothing here is a separate game.
        </p>
        {city && (() => {
          const weather = weatherAt(sim, city.id);
          if (!weather) return null;
          const unit = weather.fahrenheit ? '°F' : '°C';
          return (
            <p className="small dim" style={{ marginTop: 'var(--s1)' }}>
              <span aria-hidden="true">{WEATHER_EMOJI[weather.condition]}</span>{' '}
              {weather.temperature}{unit} and {weather.condition.toLowerCase()} in {city.name} right now,
              {' '}high {weather.high}{unit}, low {weather.low}{unit}. {weather.climateName} climate.
            </p>
          );
        })()}
      </div>

      <div className="col gap-5">
        {DOMAINS.map((domain) => (
          <Panel key={domain.label} title={domain.label} subtitle={domain.blurb} flush>
            <div className="list">
              {domain.entries.map((entry) => (
                <button
                  key={`${domain.label}-${entry.label}`}
                  className="list-item"
                  onClick={() => navigate(entry.route, entry.label)}
                >
                  <div className="grow">
                    <div className="small strong">{entry.label}</div>
                    <div className="xs dim">{entry.detail}</div>
                  </div>
                  <span className="dim" aria-hidden="true">›</span>
                </button>
              ))}
            </div>
          </Panel>
        ))}
      </div>

      <TutorialCard />
    </>
  );
}
