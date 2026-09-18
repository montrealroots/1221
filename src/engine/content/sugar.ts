/**
 * SLATE — where the money comes from, and why the gate says Sugar Land.
 *
 * The family did not make its money in film. It made it in sugar, and the
 * land is named after the thing that paid for it. That is the whole reason
 * an unknown production company in a country with no film industry can build
 * a lot nobody asked for: somebody else is paying, out of a business that has
 * nothing to do with any of it.
 *
 * ## The shape, and why it is this shape
 *
 * The obvious version was a single organic sugar company, and the numbers say
 * it could not have built the lot. The entire world trade in organic sugar is
 * four to five hundred thousand tonnes a year — about 0.3% of the 186 million
 * tonnes the world makes — and the largest real producer of it turns over
 * somewhere in the low hundreds of millions. That is roughly what Sugar Land
 * Studios cost to build, once. A company that size does not also absorb seven
 * hundred thousand euros a month of empty stages.
 *
 * So the group is shaped the way the real one is. Grupo Balbo has been in cane
 * in São Paulo since 1903, at conventional scale, and inside it sits Native —
 * the largest organic sugar producer in the world. Conventional pays for
 * everything. Organic is the part that is first.
 *
 * The family's group is that: large in sugar, and the biggest organic sugar
 * business anywhere. Both halves are needed. Without the second the name means
 * nothing; without the first the money does not exist.
 *
 * ## What is real here
 *
 * The market figures, the origins, the trade shares and the tariff are public
 * record and each says where it came from. The family's group is invented and
 * says so. Nothing here claims a real company did anything.
 */

import type { Money } from '../core/money';

// ---------------------------------------------------------------------------
// The trade, as it actually is
// ---------------------------------------------------------------------------

/**
 * How small organic sugar really is.
 *
 * Worth stating plainly because the intuition is wrong in both directions:
 * organic sugar sounds like a niche and is a niche, but the world sugar market
 * it sits inside is enormous, so being first in the niche and large in the
 * whole are two entirely different businesses.
 */
export const THE_TRADE = {
  /** World centrifugal sugar, thousand tonnes raw value, 2024/25. */
  worldSugarKt: 186_056,
  worldSugarSource: 'USDA Foreign Agricultural Service, Sugar: World Markets and Trade',
  /** Everything organic, traded, in a year. Tonnes. */
  organicTonnes: 450_000,
  /** Organic as a share of all of it. */
  organicShare: 0.003,
  /** Certified organic sugarcane worldwide, hectares, 2023. */
  organicHectares: 89_635,
  organicSource: 'FiBL, and USDA Economic Research Service',
  /** What organic cane fetched leaving Paraguay, first half of 2025, per tonne. */
  fobPerTonneUsd: 585,
} as const;

export interface Origin {
  id: string;
  country: string;
  /** The world's word for where in it. */
  where: string;
  /** What it is, in the trade. */
  said: string;
  /** Where the standing comes from. */
  source: string;
}

/**
 * Where organic cane actually comes from.
 *
 * Note what is not here. Paraguay is routinely called the world's largest
 * organic sugar exporter and the claim traces back to trade-press repetition
 * with no figures behind it; the trade data puts Brazil first into America and
 * Colombia first into Europe. Malawi and Mauritius are not organic origins at
 * all — Malawi is a Fairtrade origin and Mauritius a specialty one, which are
 * different things that get confused constantly.
 */
export const ORIGINS: readonly Origin[] = [
  {
    id: 'br',
    country: 'Brazil',
    where: 'São Paulo state',
    said: 'First into America, at nearly half of everything organic that lands there.',
    source: 'USDA Economic Research Service, May 2025',
  },
  {
    id: 'co',
    country: 'Colombia',
    where: 'the Cauca valley',
    said: 'First into Europe, at two fifths of it, and the quiet giant of the trade.',
    source: 'European Commission DG AGRI, from TRACES, 2024',
  },
  {
    id: 'py',
    country: 'Paraguay',
    where: 'Arroyos y Esteros and the Cordillera',
    said: 'Second into America, fifth into Europe, and smallholder country: three hectares a grower.',
    source: 'USDA ERS and DG AGRI',
  },
  {
    id: 'in',
    country: 'India',
    where: 'Maharashtra and Uttar Pradesh',
    said: 'Small and growing fast, certified under India’s own scheme rather than anybody else’s.',
    source: 'DG AGRI, 2024',
  },
];

/**
 * What certification actually takes, which is the reason organic sugar is
 * rare rather than a marketing decision.
 *
 * Cane is a ratooned perennial, so the European rule wants three clean years
 * before the first harvest counts. That is three years of farming to organic
 * cost and selling at conventional price, on land held by growers with a few
 * hectares each. It is why almost all of it is certified in groups.
 */
export const CERTIFYING = {
  /** Clean years the European rule wants before a perennial's first harvest. */
  euYears: 3,
  euRule: 'EU Regulation 2018/848',
  /** Months the American rule wants before harvest. */
  usMonths: 36,
  usRule: 'USDA National Organic Program, 7 CFR 205.202',
  /** Typical smallholder plot in the trade, hectares. */
  growerHectares: 3,
  said: 'Three years of organic cost at conventional prices before a single tonne can be sold as organic.',
} as const;

/**
 * The thing that is happening to this business right now.
 *
 * Real, dated, and sitting underneath everything the family is doing in
 * Iceland: the quota that organic sugar actually enters America through was
 * set to nothing for the year. A group that sells into America is absorbing
 * that while it funds an empty stage in Mosfellsbær.
 */
export const THE_TARIFF = {
  announced: { year: 2025, month: 7, day: 14 },
  by: 'The United States Department of Agriculture',
  what: 'No additional refined specialty sugar quota for the 2026 fiscal year — the quota organic sugar is imported through.',
  /** Duty outside the quota, cents per pound, refined and raw. */
  refinedCentsPerLb: 16.21,
  rawCentsPerLb: 15.36,
  /** What the trade body put the bill at, in dollars. */
  costUsd: 85_000_000,
  costedBy: 'The Organic Trade Association',
  said: 'Tariffs on organic sugar landing in America went from about a twentieth of its cost to about a third.',
} as const;

// ---------------------------------------------------------------------------
// The family's group
// ---------------------------------------------------------------------------

/**
 * The business the money comes out of. Invented, and sized to be able to do
 * what the premise needs it to do.
 *
 * Iceland grows neither cane nor beet and never will, so this cannot be a
 * grower at home and is not pretending to be. It is an Icelandic holding
 * company over estates and mills that are somewhere else, which is exactly how
 * a northern European fortune in a tropical crop has always been held.
 */
export const GROUP = {
  name: 'Sugar Land',
  /** What goes on a contract. An Icelandic public limited company. */
  legalName: 'Sykurland hf.',
  /** Where it is registered, in the gazetteer. */
  locationId: 'is-39-mosfellsbr',
  /** The year the family got into cane. */
  since: 1946,
  /** Sugar of every kind, tonnes a year. SLATE's own. */
  tonnesAYear: 2_200_000,
  /** Of which organic, tonnes a year. SLATE's own. */
  organicTonnesAYear: 112_000,
  /** Turnover, in cents. SLATE's own. */
  revenueCents: 1_400_000_000_00,
  remit: 'Cane sugar, grown and milled abroad and sold into Europe and America.',
  said: 'Large in sugar, and first in the part of it that’s organic.',
} as const;

/**
 * The claim, and the measure it rests on.
 *
 * The group is invented, so being first is the fiction's to decide and it does
 * not need a source. What needs to be true is the size of the thing it is
 * first in, and that is where the figures above come from. 112,000 tonnes is
 * about a quarter of the entire world organic trade, which is what being
 * comfortably first in it looks like.
 */
export const ORGANIC_SHARE_OF_WORLD = GROUP.organicTonnesAYear / THE_TRADE.organicTonnes;

/** What the group makes in a year, before anything is spent. SLATE's own. */
export const GROUP_MARGIN = 0.11;
export const GROUP_PROFIT_CENTS: Money = Math.round(GROUP.revenueCents * GROUP_MARGIN);

/**
 * What the lot costs the group, said as the group would say it.
 *
 * The number that makes the bet legible: not whether the family can afford it,
 * which they plainly can, but what share of a good year it eats. A studio lot
 * running empty is not ruin here. It is a line on somebody else's accounts
 * that a sugar business has to keep explaining.
 */
export const LOT_AS_A_SHARE_NOTE =
  'The lot isn’t going to bankrupt anybody. It’s going to sit on the group’s accounts, every year, '
  + 'as a number somebody has to justify.';

// ---------------------------------------------------------------------------
// The quota, which is decided again every year
// ---------------------------------------------------------------------------

/**
 * How organic sugar actually gets into America, and why it is a live question
 * rather than a fact.
 *
 * Almost all organic cane sugar trades raw, because organic rules restrict the
 * refining aids, and raw specialty sugar enters the United States through a
 * tariff-rate quota that is set fresh every year. Certified organic is 99% of
 * everything that comes in under it. So one line in one announcement decides
 * whether a year's worth of the group's American business lands at four
 * percent duty or thirty-four.
 *
 * In July 2025 the answer was nothing at all. That is real and dated. What
 * happens in the years after is not knowable, so the game does not pretend to
 * model the politics: it models the one thing that is reliably true about
 * policy, which is that last year's answer is the best guess at this year's.
 */
export const QUOTA = {
  /** The month the announcement lands, and the fiscal year it governs. */
  announcedInMonth: 7,
  /** Tonnes of additional specialty quota in an ordinary year. SLATE's own. */
  ordinaryTonnes: 100_000,
  /** What was actually announced for the 2026 fiscal year. */
  firstYear: 2026,
  firstYearTonnes: 0,
  /** How much of the group's profit rides on the American window. SLATE's own. */
  shareOfProfitAtRisk: 0.28,
  /** How much of that is lost when the quota is shut. SLATE's own. */
  lostWhenShut: 0.6,
  said: 'Set once a year, and the year it was set to nothing cost the trade eighty-five million dollars.',
} as const;

/** What a year's quota does to what the group clears. */
export function profitAfterQuota(profitCents: Money, tonnes: number): Money {
  const open = Math.min(1, tonnes / QUOTA.ordinaryTonnes);
  const lost = QUOTA.shareOfProfitAtRisk * QUOTA.lostWhenShut * (1 - open);
  return Math.round(profitCents * (1 - lost));
}

// ---------------------------------------------------------------------------
// The group as a business that actually trades
// ---------------------------------------------------------------------------

/** Days in the year every daily figure here is quoted against. */
export const A_YEAR_OF_DAYS = 365.2425;

/**
 * The people who actually grow, mill and ship it.
 *
 * SLATE's own, and sized off the one figure above that is load-bearing: two
 * point two million tonnes a year. Cane is labor at the growing end and plant
 * at the milling end, and a group at this tonnage running its own estates sits
 * in the low thousands rather than the hundreds or the tens of thousands.
 *
 * The wage is a worldwide average and is meant to read as one: most of these
 * people are in cane-growing countries and a minority are in Reykjavík, so the
 * mean is far under what an Icelandic salary would be and far over what a
 * field wage in the tropics is. A single average is the honest simplification
 * here, because the alternative is a payroll table by country that decides
 * nothing this build can reach.
 */
export const WORKFORCE = {
  people: 3_100,
  /** A year of one of them, averaged worldwide, in cents. */
  aYearEachCents: 26_000_00,
} as const;

/** What the whole payroll costs a year, and then a day. */
export const PAYROLL_A_YEAR_CENTS: Money = WORKFORCE.people * WORKFORCE.aYearEachCents;
export const PAYROLL_A_DAY_CENTS: Money = Math.round(PAYROLL_A_YEAR_CENTS / A_YEAR_OF_DAYS);

/** What it sells in a day, and what the cane, the milling and the freight cost. */
export const REVENUE_A_DAY_CENTS: Money = Math.round(GROUP.revenueCents / A_YEAR_OF_DAYS);
export const PROFIT_A_DAY_CENTS: Money = Math.round(GROUP_PROFIT_CENTS / A_YEAR_OF_DAYS);

/**
 * Everything that is not wages: cane bought in, milling, freight, duty.
 *
 * Derived rather than declared, so the three lines cannot drift out of
 * agreement with the margin they are supposed to produce. Revenue less profit
 * is the whole cost base; wages are the part of it with people on the end, and
 * this is the rest.
 */
export const COST_OF_GOODS_A_DAY_CENTS: Money =
  REVENUE_A_DAY_CENTS - PROFIT_A_DAY_CENTS - PAYROLL_A_DAY_CENTS;

/**
 * What the two of them draw for sitting on the board of it.
 *
 * The parents are the group, and a family that owns a billion-euro sugar
 * business does not live on a salary from it — but something has to arrive in
 * their own accounts or "the parents are paid" is a sentence rather than a
 * transaction. A director's fee each, monthly, which is what the arrangement
 * actually is.
 */
export const A_PARENT_A_MONTH_CENTS: Money = 18_000_00;

/**
 * What the group keeps in hand before it will send anything to the pictures.
 *
 * A fortnight of paying everybody. Below this the sugar business is covering
 * its own payroll out of reserves and has no business funding a film slate;
 * above it, the surplus is genuinely spare. It is the one figure standing
 * between "the pictures company cannot go broke" and "the sugar company can",
 * and it is deliberately a real operating constraint rather than nought.
 */
export const KEPT_IN_HAND_CENTS: Money = Math.round(PAYROLL_A_DAY_CENTS * 14);

/**
 * The two memos the money between the two companies is posted under.
 *
 * They live here rather than in `world/lot.ts`, where they were, because both
 * ends now need them and only one end can own them. The lot's side reads them
 * to work out how much of the sugar money has gone into the bet — which is the
 * figure the family's patience is made of — and the group's side writes them
 * when it actually sends the money. While the group was a nominal there was
 * only a writer, so the name could sit next to the reader; now there are two.
 *
 * The wrong version of this fix is a second memo for the real transfer, which
 * is what the first pass did: the sugar paid out of a real balance, the ledger
 * was correct, and `paidInSoFar` saw nothing, so the rungs stayed at nought,
 * the greenlight condition never bit and the family was infinitely patient
 * again. The postings were right and the sentence about them was dead.
 */
export const PAID_IN_MEMO = `Paid In By ${GROUP.name}`;
export const PAID_BACK_MEMO = `Paid Back To ${GROUP.name}`;
