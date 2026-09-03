/**
 * SLATE — every real event the industry keeps a date for, in one list.
 */

import type { IndustryEventSpec } from './events';
import { MAJOR_AWARDS } from './events-awards-major';
import { SEASON_AWARDS } from './events-awards-season';
import { GUILD_AWARDS } from './events-awards-guilds';
import { MORE_AWARDS } from './events-awards-more';
import { WORLD_AWARDS } from './events-awards-world';
import { FESTIVALS_A } from './events-festivals-a';
import { FESTIVALS_B } from './events-festivals-b';
import { FAN_EVENTS, MARKETS } from './events-fan-markets';

export const INDUSTRY_EVENTS: readonly IndustryEventSpec[] = [
  ...MAJOR_AWARDS, ...SEASON_AWARDS, ...GUILD_AWARDS, ...MORE_AWARDS, ...WORLD_AWARDS,
  ...FESTIVALS_A, ...FESTIVALS_B, ...FAN_EVENTS, ...MARKETS,
];

const BY_ID = new Map(INDUSTRY_EVENTS.map((e) => [e.id, e]));

export function lookupEvent(id: string): IndustryEventSpec | undefined {
  return BY_ID.get(id);
}
