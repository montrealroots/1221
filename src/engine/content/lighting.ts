/**
 * SLATE — a home's lighting as the surveys find it (from 2026-10-05,
 * `docs/research/world/research-lighting-bulbs.json`), which the typical
 * month of electricity already holds.
 *
 * - Lamps a household: America's 52 (the DOE's 2015 U.S. Lighting Market
 *   Characterization, read through a summary), Britain's about 45 (OVO
 *   Energy, read secondhand). Canada and Mexico take America's and Ireland
 *   Britain's, SLATE's assumption: none of the three was found published.
 * - Lighting's share of a household's electricity: America's 6% (the EIA's
 *   RECS 2020), Britain's 15.4% in a home without electric heating (DECC's
 *   Household Electricity Survey, measured in 2010–11, before LEDs were
 *   common, so likely high now). Canada and Mexico take America's and Ireland
 *   Britain's, SLATE's assumption.
 *
 * From the two, and the bulb the typical home is taken to have in every
 * socket, come the hours a socket is lit a day; the hours a life is home and
 * awake in the dark move them from there (`systems/lighting.ts`).
 */

export interface LightingNorm { lamps: number; share: number; socket: 'edison' | 'bayonet'; source: string }

const US: LightingNorm = { lamps: 52, share: 0.06, socket: 'edison', source: 'DOE 2015 U.S. Lighting Market Characterization; EIA RECS 2020' };
const GB: LightingNorm = { lamps: 45, share: 0.154, socket: 'bayonet', source: 'OVO Energy (secondhand); DECC Household Electricity Survey, Lighting Report' };

/**
 * By market. A British home's sockets are bayonets, the GLS bulb Britain sells most;
 * an Irish home's are taken as Edison screws, the only general bulbs read on sale there
 * (SLATE's assumption: Ireland has bayonets too, and none was read on sale).
 */
export const LIGHTING_NORM: Readonly<Record<string, LightingNorm>> = {
  us: US, ca: US, mx: US,
  uk: GB, ie: { ...GB, socket: 'edison' },
};

/** The hours of a day a typical household is up: 07:00 to 23:00, SLATE's reading of a waking day. */
export const WAKING_HOURS: readonly [number, number] = [7, 23];
