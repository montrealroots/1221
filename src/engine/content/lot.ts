/**
 * SLATE — Sugar Land Studios, as a plant and as a bet.
 *
 * A lot is not a building. A lot is a fixed cost with a variable income, and
 * everything interesting about it comes from that mismatch. The overhead is
 * owed on a Tuesday in February when nothing is shooting and nobody is on the
 * land. Against that you have stage weeks, which arrive in lumps and only when
 * somebody chooses you over Budapest.
 *
 * That is why owning stages is a bet rather than a convenience. A company that
 * rents stages pays only when it shoots. A company that owns them pays always,
 * and in exchange keeps the margin when it does. Get the occupancy and it was
 * the best decision the family ever made. Miss it and the lot eats the company
 * that built it.
 *
 * ## What is real here and what is ours
 *
 * Every comparison figure below comes from an operator's own published
 * specification and is named. Every figure describing Sugar Land is SLATE's
 * own and says so. The distinction matters more than the numbers: "the largest
 * stage in the world" has no registry and no auditor, so a game that prints it
 * flatly is repeating marketing. Where Sugar Land claims a record it states
 * the measure in the same breath.
 *
 * ## The shape of the bet, and why it is this shape
 *
 * The obvious build was one enormous room — beat Qingdao's ten thousand square
 * meters and own the outright record. It was the wrong build, for three
 * reasons that are all about this land rather than about ambition.
 *
 * One room is binary. It is booked or it is not, and at this size the
 * productions that can fill it are a handful a year in a market that is
 * contracting. Four stages that let separately are a business with an
 * occupancy rate; one stage is a coin.
 *
 * Height is the cheap axis. Volume is floor times height, and height costs a
 * fraction of what floor costs, so a tall room takes the European record
 * without the span that makes a wide one ruinous.
 *
 * And the tank is the defensible record. Qingdao's floor figure rests on a
 * width its own sources dispute; Pinewood publishes its tank on a spec sheet
 * anybody can read. Beating a published number is a claim that survives
 * somebody checking it.
 */

import type { Money } from '../core/money';

// ---------------------------------------------------------------------------
// What the rest of the world has
// ---------------------------------------------------------------------------

export interface StageElsewhere {
  /** The operator's own name for it. */
  name: string;
  where: string;
  /** Clear floor, square meters, as the operator publishes it. */
  floorSqm: number;
  /** Working height to the underside of the grid, meters. */
  heightM?: number;
  /** In-stage water tank floor area, square meters. */
  tankSqm?: number;
  /** Where the figure comes from. */
  source: string;
  /** What it is the biggest of, if anything, and by whose measure. */
  claim?: string;
}

/**
 * The stages Sugar Land is measured against, with their own operators' figures.
 *
 * Two things worth knowing before reading the claims. Pinewood's 007 Stage is
 * not a sound stage: Pinewood's own spec sheet gives its acoustic treatment as
 * "Mute", which makes it a silent stage, and that is the crux of a European
 * argument nobody can settle. And Korda and Babelsberg both call themselves
 * Europe's largest, truthfully, because Korda wins on volume and Babelsberg
 * wins on floor. Neither is audited by anyone.
 */
export const STAGES_ELSEWHERE: readonly StageElsewhere[] = [
  {
    name: 'Stage 1',
    where: 'Qingdao Oriental Movie Metropolis, Shandong',
    floorSqm: 10_000,
    heightM: 27.5,
    source: 'Qingdao municipal press, opening day, April 2018',
    claim: 'The largest purpose-built stage in the world by floor and by volume.',
  },
  {
    name: 'Stage 6',
    where: 'Korda Studios, Etyek',
    floorSqm: 5_856,
    heightM: 20.05,
    source: 'Korda Studios’ own specification',
    claim: 'The largest purpose-built sound stage in Europe, by volume.',
  },
  {
    name: 'Stage 20, the Rainbow Stage',
    where: 'Studio Babelsberg',
    floorSqm: 7_044,
    heightM: 10.36,
    source: 'Studio Babelsberg’s own site',
    claim: 'Babelsberg’s largest sound stage, and Europe’s largest by floor.',
  },
  {
    name: 'The Albert R. Broccoli 007 Stage',
    where: 'Pinewood Studios',
    floorSqm: 5_490,
    heightM: 12,
    tankSqm: 2_015,
    source: 'Pinewood’s own specification table',
    claim: 'A silent stage rather than a sound stage, and Europe’s largest in-stage tank.',
  },
  {
    name: 'Stage 22',
    where: 'Cinecittà, Rome',
    floorSqm: 3_500,
    heightM: 19.2,
    source: 'Cinecittà',
    claim: 'Cinecittà’s largest, ahead of the historic Teatro 5.',
  },
  {
    name: 'Stage 1',
    where: 'RVK Studios, Gufunes, Reykjavík',
    floorSqm: 2_775,
    heightM: 16,
    source: 'RVK Studios’ own technical page',
    claim: 'The largest sound stage in Iceland.',
  },
];

/**
 * Every square meter of purpose-built sound stage in Iceland, before this lot.
 *
 * RVK Studios in Gufunes: three stages at 2,775, 1,506 and 1,317 square
 * meters. Fossa Studios, five minutes away: two at 1,130 and 816. Both from
 * the operators' own pages. The sum is SLATE's arithmetic, not a published
 * total — nobody publishes one, because until now there was no reason to.
 *
 * It is the number that makes this lot make sense. A country with a rebate,
 * a landscape and no rooms sends its interiors to Budapest.
 */
export const ICELAND_STAGE_FLOOR_SQM = 7_544;

// ---------------------------------------------------------------------------
// What stands on this land
// ---------------------------------------------------------------------------

export type StageFeature =
  | 'tank' | 'dive_well' | 'cyclorama' | 'interconnect'
  | 'elephant_door' | 'geothermal_floor' | 'silent_hvac';

/** What each fitting is called on a screen. */
export const FITTING_LABEL: Readonly<Record<StageFeature, string>> = {
  tank: 'Water Tank',
  dive_well: 'Dive Well',
  cyclorama: 'Cyclorama',
  interconnect: 'A Door To The Next Stage',
  elephant_door: 'Elephant Door',
  geothermal_floor: 'Geothermal Floor',
  silent_hvac: 'Silent Air',
};

export interface StageFacts {
  id: string;
  /** The world's word for it. */
  name: string;
  /** Clear floor inside the acoustic liner, square meters. SLATE's own. */
  floorSqm: number;
  /** Clear height to the underside of the perms, meters. SLATE's own. */
  clearHeightM: number;
  /** What a shooting week costs, in cents. See `THE_RATE_CARD`. */
  weekRateCents: Money;
  fitted: readonly StageFeature[];
  /** Tank floor area in square meters, where there is one. */
  tankSqm?: number;
  /** One sentence a person would say about it. */
  said: string;
}

/**
 * What a stage actually lets for, and where the figure comes from.
 *
 * The rates here used to be invented and were roughly twice the market. That
 * mattered more than a wrong number usually does, because the break-even
 * occupancy — the one figure this entire bet turns on — is the overhead
 * divided by what a full lot earns, so an inflated rate card made the lot look
 * twice as easy to fill as it is.
 *
 * The benchmark is published: Lambert Smith Hampton's 2018 UK studio review
 * lists a prestige 20,000 sq ft near-London stage at £25,000–30,000 a week,
 * which is £1.25–1.50 per square foot per week. Carried to 2026 money that is
 * about €21–25 per square meter per week for a room that size, and large rooms
 * let for less per square meter than small ones, which is why Askja is the
 * cheapest square meter on the lot and the 2,000s are the dearest.
 *
 * One honest caveat, stated because it changes what the number means. A rate
 * card is a list price and the same review is blunt that substantial discounts
 * are nearly always negotiated off it. SLATE charges the list, because it does
 * not model a negotiation yet. When it does, these become the asking price and
 * what is actually taken will sit below them.
 */
export const THE_RATE_CARD = {
  /** €/m²/week for a room of about 20,000 sq ft, in 2026 money. */
  benchmarkPerSqmWeek: 23,
  source: 'Lambert Smith Hampton, UK studio market review, 2018, carried forward',
  said: 'A list price, and list prices get discounted.',
} as const;

/**
 * The four stages, and why each one is the size it is.
 *
 * Askja is a caldera and also, in Icelandic, a box — which is what a stage is.
 * Lón is a lagoon. The other two are numbered, because that is what real lots
 * do: Pinewood names the 007 Stage and numbers the rest.
 */
export const STAGES: readonly StageFacts[] = [
  {
    id: 'askja',
    name: 'Askja',
    floorSqm: 6_000,
    clearHeightM: 30,
    weekRateCents: 90_000_00,
    fitted: ['cyclorama', 'elephant_door', 'geothermal_floor', 'silent_hvac'],
    said: 'A hundred meters by sixty, and thirty meters of air above it.',
  },
  {
    id: 'lon',
    name: 'Lón',
    floorSqm: 3_200,
    clearHeightM: 18,
    weekRateCents: 82_000_00,
    fitted: ['tank', 'dive_well', 'geothermal_floor', 'silent_hvac'],
    tankSqm: 2_400,
    said: 'Most of the floor is water, and it’s heated because the country heats things.',
  },
  {
    id: 'stage-3',
    name: 'Stage 3',
    floorSqm: 2_000,
    clearHeightM: 18,
    weekRateCents: 43_000_00,
    fitted: ['interconnect', 'elephant_door', 'geothermal_floor', 'silent_hvac'],
    said: 'Ordinary, in the way most of the work is ordinary.',
  },
  {
    id: 'stage-4',
    name: 'Stage 4',
    floorSqm: 2_000,
    clearHeightM: 18,
    weekRateCents: 43_000_00,
    fitted: ['interconnect', 'elephant_door', 'geothermal_floor', 'silent_hvac'],
    said: 'The twin of Stage 3, and the door between them opens.',
  },
];

/** Stage floor across the whole lot, in square meters. */
export const LOT_FLOOR_SQM = STAGES.reduce((n, s) => n + s.floorSqm, 0);

/** Askja's enclosed volume, which is the figure the record rests on. */
export const ASKJA_VOLUME_M3 = 6_000 * 30;

/**
 * What the lot may truthfully say about itself, with the measure attached.
 *
 * Never "the largest in the world". Askja is a third the volume of Qingdao and
 * saying otherwise would be a lie the game could be caught in. What it is, it
 * is by a measure anybody can check against a published number.
 */
export const CLAIMS: readonly { said: string; against: string }[] = [
  {
    said: 'The largest sound stage in Europe by volume',
    against: 'Askja holds 180,000 cubic meters against Korda Stage 6’s 117,400, from Korda’s own figures.',
  },
  {
    said: 'The largest water tank inside a stage anywhere',
    against: 'Lón’s tank floor is 2,400 square meters against the 007 Stage’s 2,015, from Pinewood’s own spec table.',
  },
  {
    said: 'More stage floor than the rest of Iceland put together',
    against: `13,200 square meters here against ${ICELAND_STAGE_FLOOR_SQM.toLocaleString('en-US')} at RVK and Fossa combined.`,
  },
];

// ---------------------------------------------------------------------------
// What it cost, and what it costs
// ---------------------------------------------------------------------------

/**
 * What the family spent building it. SLATE's own, and the reasoning is the
 * point of writing it down.
 *
 * The anchor is real: a UK studio market study puts new-build stage
 * construction at roughly £430 to £577 a square foot, so about £5,400 a square
 * meter. Iceland moves that both ways — labor is scarce and everything
 * structural is imported and priced in euros, but the power is geothermal and
 * the ground is stable.
 *
 * It is held in euros on purpose. The króna is small and moves, the steel and
 * the acoustic liner were bought in euros, and a four-year build carries the
 * exchange rate as a live risk rather than a footnote.
 */
export const BUILD_COST_CENTS: Money = 240_000_000_00;

/**
 * What it costs a month with nothing shooting on it.
 *
 * The largest line is not the crew. It is the sinking fund — a percentage of
 * what the thing cost, put aside every month against the day a roof or a
 * chiller has to be replaced. It is the line every private operator
 * underfunds, and it is the one that decides whether a lot is still a lot in
 * twenty years.
 */
export interface OverheadLine {
  id: string;
  label: string;
  monthlyCents: Money;
  said: string;
}

export const OVERHEAD: readonly OverheadLine[] = [
  {
    id: 'sinking',
    label: 'Set Aside For Repairs',
    monthlyCents: 200_000_00,
    said: 'One percent of what it cost to build, every year, against the day something big fails.',
  },
  {
    id: 'property_tax',
    label: 'Property Tax',
    monthlyCents: 176_000_00,
    said: 'Fasteignaskattur, at the commercial rate the municipality sets.',
  },
  {
    id: 'crew',
    label: 'Standing Crew',
    monthlyCents: 154_000_00,
    said: 'Sixteen people who are there whether anybody is shooting or not, five of them on the gate.',
  },
  {
    id: 'insurance',
    label: 'Insurance',
    monthlyCents: 57_000_00,
    said: 'Including the statutory catastrophe cover, which in Iceland means volcano and earthquake.',
  },
  {
    id: 'selling',
    label: 'Selling It',
    monthlyCents: 50_000_00,
    said: 'A stage nobody has heard of has to be sold, continuously, at every market there is.',
  },
  {
    id: 'utilities',
    label: 'Keeping The Lights On',
    monthlyCents: 27_000_00,
    said: 'Cheap, because the heat comes out of the ground and the power off the grid behind it.',
  },
  {
    id: 'services',
    label: 'Contracted Services',
    monthlyCents: 25_000_00,
    said: 'Fire and sprinkler certification, hoist inspection, snow clearing, waste.',
  },
];

/** What a dark month costs, in cents. */
export const MONTHLY_OVERHEAD_CENTS: Money = OVERHEAD.reduce((n, line) => n + line.monthlyCents, 0);

/**
 * The three rates a stage is let at, as a share of the shooting rate.
 *
 * Stages are quoted by the week, never by the day, and never at one price. A
 * production pre-lights and strikes at a lower rate than it shoots at, and
 * pays a lower one again to hold a standing set on a dark day. Anybody who has
 * booked one knows this; a game that charges one flat rate has not.
 */
export const RATE_SHARE = { shooting: 1, prep: 0.6, hold: 0.35 } as const;

/**
 * How long a stage is held either side of the shoot, as multiples of it.
 *
 * The line above says a production pre-lights and strikes at a lower rate. It
 * had nothing on how LONG for, so every booking in the engine was the shooting
 * weeks and nothing else — which understates what a stage is actually occupied
 * for by most of a half, and understates what it earns by about as much again.
 * Prep and strike are 40-60% of a feature's stage weeks in the research, and
 * these are set so a feature lands in the middle of that band.
 *
 * By kind, because the spread is enormous and it is the difference between a
 * stage business and a spreadsheet. A feature builds a set over weeks and takes
 * days to get it out again. A documentary on a stage is an interview against a
 * backdrop: it arrives in the morning and is gone by the evening.
 */
export const AROUND_THE_SHOOT: Record<Enquiry['kind'], { prep: number; strike: number }> = {
  feature: { prep: 0.6, strike: 0.2 },
  'limited series': { prep: 0.45, strike: 0.15 },
  commercial: { prep: 0.25, strike: 0.1 },
  documentary: { prep: 0.1, strike: 0.05 },
};

/**
 * The most of its Icelandic spend a production will hand to a stage.
 *
 * SLATE's own, and it is the term that makes a rate card a decision rather
 * than an invoice. `wouldBook` worked the rate out and then never looked at it:
 * the answer was size, then availability, then the rebate, so a stage could
 * have been priced at anything and the same productions would have booked.
 *
 * The figure is reasoned rather than published. Stage rental is a single line
 * in a budget whose Icelandic spend also carries crew, transport, accommodation
 * and the build, so a room asking a fifth of everything the production will
 * spend in the country is a room being asked about and then not booked. Foreign
 * money has somewhere else to go and holds a harder line than local money,
 * which is comparing this stage against the one across town.
 */
export const MOST_OF_THE_SPEND = { local: 0.3, foreign: 0.18 } as const;

/**
 * How full it has to be to pay for itself, before any return on the money.
 *
 * No film commission or property research house publishes a break-even
 * occupancy for a sound stage — it was looked for and it does not exist — so
 * this is the game's own arithmetic over the figures above and nothing more.
 */
/**
 * What the family will carry, and what it says on the way.
 *
 * The lot loses about six million a year and the sugar group clears a hundred
 * and fifty-four, so this was never going to be a solvency question. Nobody is
 * bankrupted by four per cent of profit. What runs out is willingness, and the
 * conversation is the one every family business has about the part of it that
 * does not pay: how long, and to what end.
 *
 * So the ladder is cumulative money in against a year of the group's profit,
 * and the rungs are SLATE's own — the research has plenty to say about studios
 * that failed and nothing to say about how long anybody's patience is. What is
 * not ours is the shape: the corpus is blunt that the lots that went under
 * mostly went under at the covenant rather than at the rate card, which is to
 * say they ran out of somebody willing to keep paying, not out of tenants.
 *
 * At six million a year the first rung arrives in under three years and the
 * last in about thirteen — and both come sooner every time America shuts the
 * quota, because the same money read against a smaller year is a bigger share.
 * That is the only place the sugar is ever felt on this side of the family.
 */
export interface Rung {
  id: string;
  /** Cumulative money in, as a share of a year of the group's profit. */
  at: number;
  /** Title Case, for a screen. */
  label: string;
  /** What the family is saying at this point. */
  what: string;
}

export const PATIENCE: readonly Rung[] = [
  {
    id: 'nothing',
    at: 0,
    label: 'Nobody Has Mentioned It',
    what: 'The lot costs what a bad month in the cane costs. It hasn’t come up.',
  },
  {
    id: 'noticed',
    at: 0.1,
    label: 'It Has Been Noticed',
    what: 'A tenth of a year’s profit has gone into stages nobody is standing on, and it’s in the group accounts where anybody can read it.',
  },
  {
    id: 'asked',
    at: 0.25,
    label: 'They’re Asking What The Plan Is',
    what: 'A quarter of a year. That’s no longer a thing the group absorbs without anybody putting a name to it, and the question is what it’s for.',
  },
  {
    id: 'conditional',
    at: 0.5,
    label: 'The Money Comes With A Condition',
    what: 'Half a year’s profit, and the family will keep the lights on in a month the lot earned something. A month it earned nothing is a month it funds itself.',
  },
];

/**
 * How much shorter the family's patience gets for every year America stays shut.
 *
 * SLATE's own. A run of shut years is when a loss-making side business stops
 * being a rounding error and starts being a line somebody defends, and the
 * quota already decides those years without being asked.
 */
export const SHUT_YEAR_BITE = 0.12;

export const BREAK_EVEN_NOTE =
  'Nobody publishes a break-even for a stage, so this is worked out from what the lot costs and what '
  + 'it charges, and from nothing else.';

// ---------------------------------------------------------------------------
// Who comes looking
// ---------------------------------------------------------------------------

/**
 * What an enquiry for stage time looks like.
 *
 * Deliberately not named after real companies. A game that said a particular
 * studio shot on this lot would be inventing a fact about somebody who exists,
 * and the rule here is that a real name carries its provenance. What a
 * production is and where its money comes from is enough to make it feel like
 * a real phone call.
 */
export interface Enquiry {
  kind: 'feature' | 'limited series' | 'commercial' | 'documentary';
  /** Where the money is from, in the world's words. */
  from: string;
  /** Floor it needs, square meters. */
  needsSqm: number;
  /** Height to the grid it needs, meters. */
  needsHeightM: number;
  /** Whether it needs water, which only one stage here has. */
  needsTank: boolean;
  /** How many weeks it wants. */
  weeks: number;
  /** What it would spend in Iceland, in króna. Decides the rebate tier. */
  spendIsk: number;
  /**
   * Whether the crew is already here.
   *
   * The single largest thing separating one enquiry from another. A production
   * from abroad pays to fly and house most of a crew; an Icelandic one pays
   * none of that and is comparing Sugar Land against the stage across town
   * rather than against Budapest. Four in five projects claiming the Icelandic
   * rebate are domestic, so the ordinary enquiry here is a local one.
   */
  local: boolean;
}

/**
 * The shapes of production that come looking for a stage in the North
 * Atlantic, and roughly how often.
 *
 * The weights are SLATE's own and they encode the thing the research kept
 * saying: the work that actually exists is mostly middling. A room the size of
 * Askja is wanted by a handful of productions a year, and a two thousand meter
 * stage is wanted constantly.
 */
export const ENQUIRY_SHAPES: readonly { weight: number; of: Enquiry }[] = [
  // The ordinary week here. Four in five projects claiming the Icelandic
  // rebate are domestic, and a domestic one is short, small and comparing
  // Sugar Land against the stage in Gufunes rather than against Budapest.
  {
    weight: 30,
    of: { kind: 'commercial', from: 'an Icelandic agency', needsSqm: 700, needsHeightM: 8, needsTank: false, weeks: 1, spendIsk: 25_000_000, local: true },
  },
  {
    weight: 18,
    of: { kind: 'limited series', from: 'RÚV', needsSqm: 1_400, needsHeightM: 10, needsTank: false, weeks: 6, spendIsk: 260_000_000, local: true },
  },
  {
    weight: 10,
    of: { kind: 'documentary', from: 'an Icelandic producer', needsSqm: 500, needsHeightM: 8, needsTank: false, weeks: 2, spendIsk: 35_000_000, local: true },
  },
  {
    weight: 8,
    of: { kind: 'feature', from: 'an Icelandic production', needsSqm: 1_800, needsHeightM: 12, needsTank: false, weeks: 5, spendIsk: 380_000_000, local: true },
  },
  // And the rest is the world, which is where the stage-weeks are. Iceland
  // draws on the order of a dozen foreign projects in a year, so these are
  // rare, and each one is worth more than a season of the ones above.
  {
    weight: 12,
    of: { kind: 'commercial', from: 'a European agency', needsSqm: 900, needsHeightM: 9, needsTank: false, weeks: 1, spendIsk: 40_000_000, local: false },
  },
  {
    weight: 9,
    of: { kind: 'limited series', from: 'a Nordic broadcaster', needsSqm: 1_800, needsHeightM: 12, needsTank: false, weeks: 9, spendIsk: 420_000_000, local: false },
  },
  {
    weight: 5,
    of: { kind: 'documentary', from: 'a streamer', needsSqm: 600, needsHeightM: 8, needsTank: false, weeks: 2, spendIsk: 60_000_000, local: false },
  },
  {
    weight: 4,
    of: { kind: 'feature', from: 'an American studio', needsSqm: 5_200, needsHeightM: 24, needsTank: false, weeks: 14, spendIsk: 1_900_000_000, local: false },
  },
  {
    weight: 3,
    of: { kind: 'feature', from: 'a British production', needsSqm: 2_600, needsHeightM: 14, needsTank: true, weeks: 7, spendIsk: 780_000_000, local: false },
  },
  {
    weight: 2,
    of: { kind: 'feature', from: 'an American studio', needsSqm: 3_000, needsHeightM: 16, needsTank: true, weeks: 11, spendIsk: 2_400_000_000, local: false },
  },
];

/**
 * What it costs a foreign production to make anything in Iceland, over what
 * the same thing would cost where it came from.
 *
 * The number that carries the whole disadvantage, and it had been guessed too
 * low. Everything structural and most of everything else arrives by sea; the
 * national crew base is on the order of a thousand people, so heads of
 * department are flown in and housed for the run; and the program is
 * weather-dependent in a way a Budapest program is not. Quantity surveying
 * of exactly this puts the uplift at 25–40% over a UK cost for an imported
 * build, and the middle of that band is what a production is weighing.
 *
 * Why the exact figure matters more than it looks. It sits directly against
 * the rebate, and the rebate has two tiers: 25% ordinarily, 35% for a
 * production big enough to clear the higher test. At the old 0.22 both tiers
 * beat it, so every enquiry that found a free room booked and the refusal this
 * file exists to model could never happen. At the real figure, only the
 * productions large enough for the higher rebate find Iceland worth it — which
 * is both what the tier was designed to do and what actually happens.
 */
export const CREW_PENALTY = 0.32;
export const CREW_PENALTY_SOURCE = 'Imported-build cost uplift over UK, 25–40%, taken at the middle.';

/**
 * How many people in Iceland do this for a living, before the save adds any.
 *
 * On the order of a thousand, which is the figure the research uses and the
 * reason the higher rebate's fifty-crew test is a real constraint rather than a
 * formality: two large productions at once want a tenth of everybody. It is a
 * base and not a total — every picture the company makes brings people into
 * existence who are still here afterwards, and they count.
 */
export const CREW_BASE = 1_000;
