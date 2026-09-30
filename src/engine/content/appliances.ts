/**
 * SLATE — appliances fitted to a home one owns (docs/WORLD.md, stage 6a),
 * from 2026-09-29, researched in docs/research/world/research-contents.json.
 *
 * Prices are what each country's consumer body or a named retailer
 * publishes, and where a body gives a range SLATE takes its middle, said
 * so: in America, Consumer Reports' ranges, retailers' install fees and the
 * cost guides' installed central air; in Britain, Which?'s; in Ireland and
 * Canada, a retailer's price as a search read it, the retailers refusing to
 * be read directly; in Mexico, a retailer's sale price the same way. What no
 * one prices isn't sold: central air in Britain, Ireland and Mexico, a
 * dryer or a window unit in Mexico. A single-room split system is sold as
 * the units it is where no window unit is priced.
 *
 * Each lasts its published life: NAHB's Study of Life Expectancy of Home
 * Components (2007) for a dishwasher (9 years), a washer (10) and a dryer
 * (13); the Department of Energy's for a room unit (9) and central air (the
 * low end of its 18 to 25). Then it gives out.
 */

export type ApplianceKind = 'dishwasher' | 'washer' | 'dryer' | 'ac-units' | 'central-air';

export const APPLIANCE_LABEL: Readonly<Record<ApplianceKind, string>> = {
  dishwasher: 'Dishwasher', washer: 'Washing Machine', dryer: 'Dryer', 'ac-units': 'Air Conditioning Units', 'central-air': 'Central Air',
};

/** Years each lasts. */
export const APPLIANCE_LIFE: Readonly<Record<ApplianceKind, number>> = { dishwasher: 9, washer: 10, dryer: 13, 'ac-units': 9, 'central-air': 18 };

export interface AppliancePrice { price: number; install: number; basis: string }

/** By country: the price and its fitting, whole units of the country's money. */
export const APPLIANCES: Readonly<Record<string, { currency: string; items: Partial<Record<ApplianceKind, AppliancePrice>> }>> = {
  us: {
    currency: 'USD',
    items: {
      dishwasher: { price: 750, install: 175, basis: 'the middle of Consumer Reports’ $500 to $1,000, and of a retailer’s $130 to $220 to fit' },
      washer: { price: 975, install: 100, basis: 'the middle of Consumer Reports’ $450 to $1,500 top-loaders, and half the $100 to $300 a pair costs to hook up' },
      dryer: { price: 1_325, install: 100, basis: 'the middle of Consumer Reports’ $450 to $2,200, and half the $100 to $300 a pair costs to hook up' },
      'ac-units': { price: 350, install: 230, basis: 'the middle of Consumer Reports’ $250 to $450 mid-size window unit, and of the $60 to $400 cost guides give to fit' },
      'central-air': { price: 3_500, install: 5_250, basis: 'the middle of the cost guides’ $2,500 to $4,500 unit and $3,500 to $7,000 to install, where ducts stand' },
    },
  },
  uk: {
    currency: 'GBP',
    items: {
      dishwasher: { price: 600, install: 30, basis: 'the middle of Which?’s £200 to £1,000, and a retailer’s £30 to fit' },
      washer: { price: 325, install: 30, basis: 'the middle of the £250 to £400 in which Which? found its best, and a retailer’s £30 to fit' },
      dryer: { price: 313, install: 0, basis: 'Which?’s average condenser dryer, plugged in' },
      'ac-units': { price: 463, install: 0, basis: 'the middle of the £227 to £700 portable units Which? tested' },
    },
  },
  ie: {
    currency: 'EUR',
    items: {
      dishwasher: { price: 449, install: 0, basis: 'a retailer’s price, read from a search' },
      washer: { price: 499, install: 0, basis: 'a retailer’s price, read from a search' },
      dryer: { price: 424, install: 0, basis: 'the middle of a retailer’s €399 to €449 heat-pump dryers, read from a search' },
      'ac-units': { price: 1_000, install: 1_800, basis: 'the middle of the €2,100 to €3,500 a single split costs installed, its hardware €700 to €1,300' },
    },
  },
  ca: {
    currency: 'CAD',
    items: {
      dishwasher: { price: 448, install: 0, basis: 'a retailer’s price, read from a search' },
      washer: { price: 898, install: 0, basis: 'a retailer’s price, read from a search' },
      dryer: { price: 698, install: 0, basis: 'a retailer’s price, read from a search' },
      'ac-units': { price: 337, install: 0, basis: 'the middle of a retailer’s C$245 to C$428 window units, read from a search' },
      'central-air': { price: 2_500, install: 2_250, basis: 'the middle of the C$3,500 to C$6,000 a cost guide gives installed, its equipment C$1,800 to C$3,200' },
    },
  },
  mx: {
    currency: 'MXN',
    items: {
      dishwasher: { price: 12_000, install: 0, basis: 'a retailer’s sale price, read from a search' },
      washer: { price: 8_799, install: 0, basis: 'a retailer’s sale price, read from a search' },
      'ac-units': { price: 15_999, install: 4_000, basis: 'the middle of a retailer’s one-ton inverter mini-split and of the MX$2,500 to MX$5,500 Mexico City installers charge' },
    },
  },
};

export const APPLIANCE_SOURCE = 'docs/research/world/research-contents.json: Consumer Reports; Which?; retailers in Ireland, Canada and Mexico as searches read them; Angi and Carrier; NAHB, Study of Life Expectancy of Home Components (2007); the Department of Energy';
