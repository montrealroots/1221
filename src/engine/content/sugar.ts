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
 * The employer's own contribution on a wage, which nothing was charging.
 *
 * `content/tax.ts` has carried the sentence for as long as the tax rules have
 * existed — "Tryggingagjald at 6.35% is the employer's and is not withheld from
 * a wage, so it does not belong in a figure about what somebody takes home" —
 * and it was right about where it does not belong and silent about where it
 * does. The employee side is in `PAYROLL_TAX_RULES` and reaches a screen. The
 * employer side was a named, rated, real Icelandic tax in a comment, and no
 * company in this save had ever paid a króna of it.
 *
 * It is charged on both payrolls now: the group's three thousand one hundred
 * people and the production company's posts. A wage is not what a wage costs,
 * and a company that thought it was would be a company whose accounts a player
 * cannot reason about.
 */
export const TRYGGINGAGJALD = 0.0635;

/**
 * The employer's own contribution on that payroll, as a day of it.
 *
 * Derived from the payroll and the published rate rather than written down, and
 * deducted from the cost of goods below rather than added to the cost base — so
 * naming it does not invent a króna of new money. It was always inside the
 * eighty-nine percent of turnover that is not profit; it just had no name, and
 * a real Icelandic tax with a real rate that nothing in the save had ever paid
 * was sitting inside a line labelled "cane, milling and freight".
 */
export const EMPLOYER_TAX_A_DAY_CENTS: Money = Math.round(PAYROLL_A_DAY_CENTS * TRYGGINGAGJALD);

/**
 * Everything that is not wages: cane bought in, milling, freight, duty.
 *
 * Derived rather than declared, so the lines cannot drift out of agreement with
 * the margin they are supposed to produce. Revenue less profit is the whole cost
 * base; wages and the contribution on them are the part with people on the end,
 * and this is the rest. Every line the group posts in a day sums to what it
 * sold, exactly, because this one is whatever is left after the others.
 */
export const COST_OF_GOODS_A_DAY_CENTS: Money =
  REVENUE_A_DAY_CENTS - PROFIT_A_DAY_CENTS - PAYROLL_A_DAY_CENTS - EMPLOYER_TAX_A_DAY_CENTS;

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

// ---------------------------------------------------------------------------
// Everything else it takes to run a company, which the group did not have
// ---------------------------------------------------------------------------
/**
 * The posts a cane group has, as against the ones a film company has.
 *
 * `ROLES` in `content/incorporation.ts` is the film side and is right to be —
 * a head of development and a production accountant are not jobs at a sugar
 * mill. Giving the group those posts to save writing six lines would have made
 * the one screen that says who runs the business say something false about it.
 *
 * The two seats with no salary are the parents'. They are the board, they draw
 * from it monthly through `payTheBoard`, and a director's fee is not a wage —
 * which is also why no employer contribution is charged on them.
 */
export const GROUP_ROLES = [
  {
    id: 'chair', label: 'The Chair', said: 'the chair',
    what: 'Holds the board. Decides what the group does with a year it didn’t expect, '
      + 'good or bad, and answers for it to nobody but the family.',
    without: 'Nobody holds the board, so a year the group didn’t expect is a year nobody answers for.',
    monthlyCents: 0,
  },
  {
    id: 'board', label: 'The Other Seat On The Board', said: 'the other seat on the board',
    what: 'The second family holding, and the second signature on anything that commits the group.',
    without: 'One signature commits a billion-euro group on its own.',
    monthlyCents: 0,
  },
  {
    id: 'managing', label: 'The Managing Director', said: 'the managing director',
    what: 'Runs it day to day. The board decides what the group is for; this is whoever '
      + 'makes two point two million tonnes a year actually happen.',
    without: 'Two point two million tonnes a year with nobody running it day to day.',
    monthlyCents: 21_000_00,
  },
  {
    id: 'agronomy', label: 'Head Of Agronomy', said: 'head of agronomy',
    what: 'The estates, the cane and the certification the organic premium depends on.',
    without: 'The certification lapses, and organic cane sells at the conventional price.',
    monthlyCents: 14_000_00,
  },
  {
    id: 'milling', label: 'Head Of Milling', said: 'head of milling',
    what: 'The plant. Crush rates, downtime and the difference between raw and refined.',
    without: 'The plant runs on whatever it did last year, and downtime nobody owns.',
    monthlyCents: 15_000_00,
  },
  {
    id: 'trade', label: 'Head Of Trade', said: 'head of trade',
    what: 'Sells it, and is the person in the building who reads the quota announcement '
      + 'the morning it lands.',
    without: 'Nobody in the building is watching the one announcement that decides the year.',
    monthlyCents: 17_000_00,
  },
  {
    id: 'finance', label: 'The Finance Director', said: 'the finance director',
    what: 'The group accounts, the audit an hf. files as a matter of course, and the '
      + 'corporation tax return.',
    without: 'An hf. that doesn’t file. The form requires the audit and somebody has to sign it.',
    monthlyCents: 16_000_00,
  },
] as const;

export type GroupRoleId = typeof GROUP_ROLES[number]['id'];
export const GROUP_ROLE_BY_ID = Object.fromEntries(
  GROUP_ROLES.map((one) => [one.id, one]),
) as Record<GroupRoleId, typeof GROUP_ROLES[number]>;

/** The two the parents hold, in the order the family generator writes them. */
export const BOARD_SEATS = ['chair', 'board'] as const;

/**
 * What the seven posts cost a month, and what that leaves for everybody else.
 *
 * The five salaried seats are paid out of the payroll the three thousand one
 * hundred are already in, not on top of it, so `WAGES_A_DAY_CENTS` is the
 * workforce less them. Naming the management therefore costs the group nothing
 * it was not paying, and the margin, the turnover and every figure derived from
 * them are untouched.
 *
 * Two shapes were available and this is the one that leaves no dead words. The
 * other was to charge the posts on top, which would have quietly raised the
 * group's costs by a million a year and made the eleven percent margin a lie; or
 * to cost them at nought, which would have put a salary on a screen and charged
 * it to nobody — the exact defect this cleanup exists to remove.
 */
export const GROUP_POSTS_A_MONTH_CENTS: Money =
  GROUP_ROLES.reduce((sum, one) => sum + one.monthlyCents, 0);
export const GROUP_POSTS_A_DAY_CENTS: Money =
  Math.round((GROUP_POSTS_A_MONTH_CENTS * 12) / A_YEAR_OF_DAYS);
export const WAGES_A_DAY_CENTS: Money = PAYROLL_A_DAY_CENTS - GROUP_POSTS_A_DAY_CENTS;

/**
 * The registers a 1946 hf. with three thousand people on it is obviously on.
 *
 * The production company is put on two at boot because it could not have built
 * a stage otherwise. The group was put on none, which made it the only company
 * in the save employing anybody without standing to employ anybody — and
 * `is_employer` exists, says "Nobody can be paid a wage by this company until
 * it exists", and is the door the production company has to open before it can
 * greenlight. The group was paying three thousand one hundred people through a
 * door it had never opened.
 */
export const GROUP_REGISTRIES = ['is_companies', 'is_vat', 'is_employer'] as const;

/**
 * The month the group's corporation tax return is due.
 *
 * Iceland takes corporate returns at the end of May for the year before, which
 * is why the tax lands seven months after the year it is charged on rather than
 * on the last day of it. Real, and the reason the money leaves when it does.
 */
export const TAX_RETURN_MONTH = 5;

/**
 * What the group's own account opens with.
 *
 * SLATE's own, and deliberately a fortnight of the worldwide payroll rather
 * than a round number with nothing behind it: it is the same figure
 * `KEPT_IN_HAND_CENTS` holds back before the group will fund a film, so the
 * save opens at exactly the floor the group refuses to go under. The first day
 * of trading is what puts it above the line, which is the correct shape for a
 * business — the money comes from selling something.
 */
export const GROUP_OPENING_BALANCE: Money = KEPT_IN_HAND_CENTS;
