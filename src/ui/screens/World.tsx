/**
 * SLATE — WORLD.
 *
 * The discovery layer. Everything SLATE can do, grouped so that new domains can
 * join without the navigation collapsing.
 */

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
    label: 'Social',
    blurb: 'Four platforms, one audience engine, no guarantees.',
    entries: [
      { route: '/workspace/social', label: 'Platforms', detail: 'Long video, short video, photo and text, each behaving differently.' },
      { route: '/workspace/social', label: 'Audience', detail: 'Segments, affinity, churn and momentum.' },
      { route: '/workspace/social', label: 'Brand deals', detail: 'Real deliverables, real deadlines, real consequences for missing them.' },
    ],
  },
  {
    label: 'Film and television',
    blurb: 'One canonical project, idea to library.',
    entries: [
      { route: '/workspace/casting', label: 'Casting', detail: 'Breakdowns, self-tapes, callbacks and offers you can lose.' },
      { route: '/workspace/projects', label: 'Projects', detail: 'Rights, writing, packaging, greenlight, shoot, post, release.' },
      { route: '/workspace/awards', label: 'Awards and festivals', detail: 'Edition-specific, eligibility-gated, and permanent once decided.' },
    ],
  },
  {
    label: 'Business',
    blurb: 'From one person with a laptop to a studio with a slate.',
    entries: [
      { route: '/workspace/company', label: 'Companies', detail: 'Found one, capitalise it, staff it, and earn the right to scale.' },
      { route: '/workspace/company', label: 'Equipment', detail: 'Own or rent the gear that raises what you can produce.' },
      { route: '/workspace/company', label: 'Merchandise', detail: 'Manufacture, sell through, and write down what does not move.' },
    ],
  },
  {
    label: 'Career and money',
    blurb: 'The unglamorous machinery underneath all of it.',
    entries: [
      { route: '/workspace/jobs', label: 'Employment', detail: 'Apply, interview, work shifts, get promoted, or get let go.' },
      { route: '/workspace/bank', label: 'Finance', detail: 'Accounts, bills, credit, loans and tax that depends on where you live.' },
      { route: '/workspace/character', label: 'Character', detail: '88 attributes, 42 traits, professional skills and seven reputations.' },
    ],
  },
];

export function World() {
  const { navigate } = useGame();
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
