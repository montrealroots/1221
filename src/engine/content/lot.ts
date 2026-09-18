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
  /**
   * Whether the line moves with how much building there is.
   *
   * The table below is what four stages cost. It was the whole answer while
   * four stages was the whole lot, and it stopped being one the moment the
   * player could put up a fifth: a room that cost nothing to run would be a
   * room worth building the instant the money existed, and the break-even
   * figure beside it would have gone *down* when the lot got bigger.
   *
   * So the lines that are a function of what stands there scale with the floor
   * that stands there, and the two that aren't, don't. The sinking fund is
   * defined as a share of what the thing cost. Fasteignaskattur is levied on
   * assessed value and insurance on replacement value, both of which are the
   * building. Heat and light and the fire certificate are per square meter of
   * room. But a gate is a gate however many stages are behind it, and what the
   * lot spends on being known is a decision rather than a consequence.
   */
  withTheFloor: boolean;
  /**
   * Whether the line is a purchase that carries VSK.
   *
   * Three of the seven are, and the other four are not, which is the reason
   * this is a field rather than one rate across the table. A wage carries no
   * value added tax and neither does the employer's side of it, so the standing
   * crew is out. Insurance is an exempt supply in Iceland, so the cover is out.
   * Fasteignaskattur is a tax and not a supply anybody makes. And the sinking
   * fund is the company moving its own money into its own reserve, which is not
   * a purchase at all — it only becomes one on the day the roof is actually
   * replaced.
   *
   * What is left is electricity and heat, the contracted services, and what the
   * lot spends on being known. Those are bought from somebody who charges VSK
   * on them, and a registered company gets that part back.
   */
  carriesVat: boolean;
}

export const OVERHEAD: readonly OverheadLine[] = [
  {
    id: 'sinking',
    label: 'Set Aside For Repairs',
    monthlyCents: 200_000_00,
    said: 'One percent of what it cost to build, every year, against the day something big fails.',
    withTheFloor: true,
    carriesVat: false,
  },
  {
    id: 'property_tax',
    label: 'Property Tax',
    monthlyCents: 176_000_00,
    said: 'Fasteignaskattur, at the commercial rate the municipality sets.',
    withTheFloor: true,
    carriesVat: false,
  },
  {
    id: 'crew',
    label: 'Standing Crew',
    monthlyCents: 154_000_00,
    said: 'Sixteen people who are there whether anybody is shooting or not, five of them on the gate.',
    withTheFloor: false,
    carriesVat: false,
  },
  {
    id: 'insurance',
    label: 'Insurance',
    monthlyCents: 57_000_00,
    said: 'Including the statutory catastrophe cover, which in Iceland means volcano and earthquake.',
    withTheFloor: true,
    carriesVat: false,
  },
  {
    id: 'selling',
    label: 'Selling It',
    monthlyCents: 50_000_00,
    said: 'A stage nobody has heard of has to be sold, continuously, at every market there is.',
    withTheFloor: false,
    carriesVat: true,
  },
  {
    id: 'utilities',
    label: 'Keeping The Lights On',
    monthlyCents: 27_000_00,
    said: 'Cheap, because the heat comes out of the ground and the power off the grid behind it.',
    withTheFloor: true,
    carriesVat: true,
  },
  {
    id: 'services',
    label: 'Contracted Services',
    monthlyCents: 25_000_00,
    said: 'Fire and sprinkler certification, hoist inspection, snow clearing, waste.',
    withTheFloor: true,
    carriesVat: true,
  },
];

/** What a dark month costs, in cents. */
/**
 * The floor: what a month costs with the one line somebody chooses at its least.
 *
 * Not what a month costs. The selling line is a decision and this table carries
 * its smallest value, so the live figure is `monthlyOverhead(sim)` in
 * `world/lot.ts` and it is larger whenever the lot is being sold harder than
 * the minimum. This was named `MONTHLY_OVERHEAD_CENTS` and read as though it
 * were the answer, which is how the break-even figure came to measure against a
 * bar the player had already moved.
 */
export const OVERHEAD_FLOOR_CENTS: Money = OVERHEAD.reduce((n, line) => n + line.monthlyCents, 0);

/**
 * The rates a stage is let at, as a share of the shooting rate.
 *
 * Stages are quoted by the week, never by the day, and never at one price: a
 * production pre-lights and strikes at a lower rate than it shoots at. Anybody
 * who has booked one knows this; a game that charges one flat rate has not.
 *
 * Building and striking are the same price on purpose, and that is the design
 * rather than a shortcut — the crew, the rigging and the hours are the same
 * going up as coming down. What was a shortcut was writing the strike weeks as
 * `prep` rows because the rate matched, which made the two indistinguishable in
 * the save and cost the board the one figure that says turnaround fills a room.
 * Equal rates and equal names are different claims.
 *
 * There was a fourth, `hold`, for a standing set on a dark day, and it is worth
 * saying why it went. It was true of the world and false of this build: nothing
 * ever wrote a booking of that kind, so the rate was never once looked up. The
 * measurement that settled it replaced this table with one that throws when
 * anything reads `hold`, and then ran eighteen played years and the whole test
 * suite — `shooting` was read seven hundred times, `prep` a hundred, `hold` not
 * at all. A returning series that holds its sets between seasons is a good
 * feature and the rate comes back with it.
 */
export const RATE_SHARE = { shooting: 1, prep: 0.6, strike: 0.6 } as const;

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
 * How many people ring about a stage in a month, before anything is earned.
 *
 * One, and deliberately not many. A lot nobody has heard of, in a country with
 * no business to speak of, does not have a queue — that was right when it was
 * written and it is still right. What was wrong was that it was the whole
 * model: the number never moved, so no action a player took could change the
 * outcome, which by this project's own falsifiability test makes the axis a
 * slot machine with prose on it.
 *
 * It is the floor now rather than the figure. What sits on top of it is two
 * things the lot earns, and both of them are read off the save rather than
 * stored: how many people there are in the country to crew a picture with, and
 * how much of the last three years the rooms were let for.
 */
export const CALLS_A_MONTH = 1;

/**
 * How far the two things that earn a call can carry it.
 *
 * SLATE's own, and the ceiling matters more than the floor. Iceland draws on
 * the order of a dozen foreign projects in a year, so a lot that has tripled
 * its calls has taken most of what the country gets and there is nothing above
 * that to buy. A model without a ceiling would let a player grind the number
 * up forever, which is the same inert axis facing the other way.
 */
export const MOST_CALLS = 3;

/**
 * What a lot can spend a month telling people it exists, and what it buys.
 *
 * The overhead table has always carried a line called Selling It, at fifty
 * thousand a month, and nobody chose it — it was a cost the lot paid the way it
 * pays for insurance. It is the one thing on the whole axis an owner actually
 * decides week to week, so it is a decision now: the standing figure is the
 * floor, and anything above it is a bet on being in the conversation before a
 * budget is locked rather than after.
 *
 * `most` is SLATE's own and is the point at which more money stops buying
 * anything. Stage bookings come from a small world — the research puts the
 * number of people who place them at a few hundred — and once you are known to
 * all of them there is nobody left to tell.
 */
export const SELLING = {
  /** What it costs before anybody decides anything. */
  floor: 50_000_00,
  /**
   * Past this, more money buys nothing.
   *
   * Three times the standing line and SLATE's own. It is deliberately not a
   * large number: a four-stage lot that spends more than this on being known
   * is a lot spending more on the telling than it can earn from anybody it
   * tells, and the research's own count of who places stage bookings — a few
   * hundred people in the world — is the reason there is a ceiling at all.
   */
  most: 150_000_00,
  /**
   * How much of the calls the selling line can be worth, at the top.
   *
   * The rest comes from the crew in the country and what the rooms did, and it
   * is deliberately not most of it: a lot that has never let a stage cannot buy
   * its way to a full book, because the first thing anybody asks is who else
   * has shot there.
   */
  worth: 0.6,
  /**
   * Months of spending the market takes to notice, and to forget.
   *
   * The research puts the sales cycle at three to twelve months, so this is
   * read as an average across the window rather than as this month's figure —
   * which means a player cannot buy a booking the month before they need one,
   * and cannot stop paying without it showing up two quarters later.
   */
  remembers: 9,
} as const;

/**
 * How much harder a fully sold lot is heard abroad than at home.
 *
 * SLATE's own, and the shape of it is the corpus's. Four in five projects
 * claiming the Icelandic rebate are domestic and those producers know the
 * stages are there whatever anybody spends; the foreign ones land at the film
 * commission first and hear about a lot they were never told about after the
 * budget is locked. At nothing spent the book is four fifths local, which is
 * the national figure. At everything spent it is about half, which is what a
 * lot that is actually being sold looks like.
 */
export const FOREIGN_REACH = 2;

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
  /**
   * Who this is, and it is not `from`.
   *
   * An office's identity used to be the sentence printed about it. Every memory
   * the player builds up — how many of their rooms this office has sat through,
   * what it keeps asking for, whether it has stopped ringing — was keyed on
   * `${from}, ${kind}` by string equality, and `theHouse` seeded that office's
   * taste off the same string. So rewording a line of prose wiped the player's
   * history with that office and gave it different preferences, and two rows
   * whose sentences happened to match were one office.
   *
   * Prose and identity are different jobs. This one never changes; the sentence
   * above it can be rewritten any afternoon.
   */
  officeId: string;
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
    of: { officeId: 'is_agency_spot', kind: 'commercial', from: 'an Icelandic agency', needsSqm: 700, needsHeightM: 8, needsTank: false, weeks: 1, spendIsk: 25_000_000, local: true },
  },
  {
    weight: 18,
    of: { officeId: 'ruv_series', kind: 'limited series', from: 'RÚV', needsSqm: 1_400, needsHeightM: 10, needsTank: false, weeks: 6, spendIsk: 260_000_000, local: true },
  },
  {
    weight: 10,
    of: { officeId: 'is_doc', kind: 'documentary', from: 'an Icelandic producer', needsSqm: 500, needsHeightM: 8, needsTank: false, weeks: 2, spendIsk: 35_000_000, local: true },
  },
  {
    weight: 8,
    of: { officeId: 'is_feature', kind: 'feature', from: 'an Icelandic production', needsSqm: 1_800, needsHeightM: 12, needsTank: false, weeks: 5, spendIsk: 380_000_000, local: true },
  },
  // And the rest is the world, which is where the stage-weeks are. Iceland
  // draws on the order of a dozen foreign projects in a year, so these are
  // rare, and each one is worth more than a season of the ones above.
  {
    weight: 12,
    of: { officeId: 'eu_agency_spot', kind: 'commercial', from: 'a European agency', needsSqm: 900, needsHeightM: 9, needsTank: false, weeks: 1, spendIsk: 40_000_000, local: false },
  },
  {
    weight: 9,
    of: { officeId: 'nordic_series', kind: 'limited series', from: 'a Nordic broadcaster', needsSqm: 1_800, needsHeightM: 12, needsTank: false, weeks: 9, spendIsk: 420_000_000, local: false },
  },
  {
    weight: 5,
    of: { officeId: 'streamer_doc', kind: 'documentary', from: 'a streamer', needsSqm: 600, needsHeightM: 8, needsTank: false, weeks: 2, spendIsk: 60_000_000, local: false },
  },
  {
    weight: 4,
    of: { officeId: 'hollywood_feature', kind: 'feature', from: 'a Hollywood studio', needsSqm: 5_200, needsHeightM: 24, needsTank: false, weeks: 14, spendIsk: 1_900_000_000, local: false },
  },
  {
    weight: 3,
    of: { officeId: 'uk_feature', kind: 'feature', from: 'a British production', needsSqm: 2_600, needsHeightM: 14, needsTank: true, weeks: 7, spendIsk: 780_000_000, local: false },
  },
  {
    weight: 2,
    of: { officeId: 'us_feature', kind: 'feature', from: 'an American studio', needsSqm: 3_000, needsHeightM: 16, needsTank: true, weeks: 11, spendIsk: 2_400_000_000, local: false },
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

// ---------------------------------------------------------------------------
// The room the lot does not have
// ---------------------------------------------------------------------------

/**
 * The small stage, and what putting one up costs.
 *
 * `docs/DEPTH.md` has carried this as a decision rather than a defect since the
 * lot was built, and the measurement bears it out: four rooms, and the smallest
 * is larger than four of the ten enquiry shapes need. Both ordinary commercials
 * and both documentaries — fifty-seven of the hundred and one weight between
 * them — are turned away because the only room that will hold them costs well
 * over half of everything they came here to spend. Nobody designed that. It fell
 * out of pricing a whole hold against a budget.
 *
 * Half of that was a bug and this is where it was found. Pricing the room meant
 * asking what the short work can actually pay, and the answer is €23 a square
 * meter a week — all four short shapes land between €22.97 and €23.92, and the
 * benchmark above is €23. They could always afford the going rate for a stage.
 * What they could not afford was two thousand square meters of it, and on top of
 * that `heldFor` was tripling their quote with a floor that only ever fired on
 * them. Deleting the floor took the lot from about four and a half outside jobs
 * a year to seven and a half, and the player from fifteen auditions in ten years
 * to thirty-three, without a euro spent. Measurements taken before that was
 * found — thirty-five shoots against eighty-six — were measuring the floor.
 *
 * What the room is worth after it, over six seeds and twenty-five years: the
 * documentary, which is the one kind of production that cannot happen here at
 * any hold length without it; a sixth holder; about thirteen more shoots a
 * decade; and four more auditions by year ten, twelve by year twenty-five. It
 * never pays for itself — seventeen million to put up and about four hundred
 * thousand a year to keep, against under a hundred thousand a year of letting.
 *
 * That is the correct shape rather than a disappointment. Auditions are gated on
 * whether a holder would think of the player at all, so a new holder is a door
 * that takes years to open: the room does not buy work, it buys doors. And it is
 * paid for out of the same patience the greenlight spends from. Build the room
 * and get asked about parts, or keep the patience and greenlight your own
 * pictures — both are routes to a career and there is one pool.
 *
 * One figure above is no longer the whole price, and the correction makes the
 * bet better rather than worse. A construction bill carries VSK, and a company
 * on the VAT register gets that part back: a fifth of seventeen and a quarter
 * million is about three and a third million, filed on the return for the
 * period the money went out. The room costs what the panel says on the day and
 * about fourteen million once the tax comes home, which is the largest single
 * claim this company will ever make and the clearest reason the Reclaim The Tax
 * door is worth opening before the build rather than after.
 */
/**
 * How big the fifth room is, and why exactly this big.
 *
 * The smallest room that holds every short job that rings. The largest of them
 * — a European agency's commercial — asks for nine hundred square meters, and
 * a room that missed it would leave the dearest piece of short work on the
 * table while carrying the floor to shoot it. Smaller than this is a room that
 * turns away the work it was built for; larger is floor the short work does not
 * need and has to pay the overhead on.
 */
export const A_SMALL_STAGE_SQM = 950;

export const A_SMALL_STAGE = {
  name: 'Stage 5',
  floorSqm: A_SMALL_STAGE_SQM,
  clearHeightM: 10,
  /**
   * What a week in it lets for: the published benchmark, by the square meter.
   *
   * Derived and not chosen, which took two goes to get right. The first figure
   * here was picked because it made the commercials book, and at €11.58 a
   * square meter it was the cheapest floor on a lot whose own rate card says
   * small rooms are the dearest — a number tuned to an outcome with the
   * reasoning written afterwards.
   *
   * What the arithmetic actually says is better than the invention. Every short
   * job that rings — both commercials and both documentaries — will carry
   * between €22.97 and €23.92 a square meter a week for a room this size, and
   * the benchmark is €23. They can afford the going rate for a stage. What they
   * cannot afford is two thousand square meters of it, which is the smallest
   * room the lot has. The lot was never turning the short work away on price
   * per meter. It was turning it away on the size of its smallest room, and
   * that is a thing somebody can build their way out of.
   */
  weekRateCents: Math.round(A_SMALL_STAGE_SQM * THE_RATE_CARD.benchmarkPerSqmWeek * 100) as Money,
  fitted: ['geothermal_floor', 'silent_hvac'] as readonly StageFeature[],
  said: 'The small one, and the only room here a week-long job can afford.',
  /**
   * How long it takes to stand up, in weeks.
   *
   * Eighteen months. A stage is a steel frame, an acoustic liner and a power
   * feed, and none of it is quick — which is the point of it as a decision. The
   * money goes now and the work arrives in a year and a half, so it is the same
   * bet as the selling spend and on a longer fuse.
   */
  weeksToBuild: 78,
} as const;

/**
 * What new stage floor costs a square meter.
 *
 * Derived from what this lot cost rather than quoted fresh, so the two numbers
 * cannot drift: `BUILD_COST_CENTS` is what the family paid to put up
 * `LOT_FLOOR_SQM`, and a new room is priced at the same rate.
 *
 * It is higher than a pure construction quote, because it is the whole of what
 * a lot costs by the meter — the workshops, the power, the road. A fifth room
 * on land that already has all of that would be cheaper in life, and it is
 * charged the full rate here anyway, for the same reason `ISK_A_EURO` is held
 * flat: this is the only construction price the game knows, and a marginal
 * discount invented to sit under it would be a second guess stacked on the
 * first. The bet is dearer than it needs to be, and the game says so rather
 * than quietly making it easier.
 */
export const A_SQUARE_METRE_CENTS: Money = Math.round(BUILD_COST_CENTS / LOT_FLOOR_SQM);

/** What the small stage costs to build, all in. */
export const SMALL_STAGE_COST_CENTS: Money =
  Math.round(A_SQUARE_METRE_CENTS * A_SMALL_STAGE.floorSqm);

export type WhyNotBuild = 'no-lot' | 'already' | 'going-up' | 'cannot-carry';

export interface BuildRefusal {
  id: WhyNotBuild;
  /** Said to whoever asked for it, in the world's words. */
  said: string;
}

/**
 * Every way the fifth room is refused before the money moves.
 *
 * `cannot-carry` is the one a player will meet and the only one that ever
 * changes its answer. The other three are facts about the lot; that one is a
 * fact about the family, and it moves both ways — a year America stays shut
 * brings the rungs down and closes a door that was open in the spring.
 *
 * What it tests is not the cash in the account. A building is committed to, not
 * paid for out of the current month, and the same figure the greenlight asks
 * about is the honest ceiling here too: what is in the account plus what the
 * family will still put in before the money comes with a condition. A company
 * that spends all of that on a room has nothing left to make a picture with,
 * which is the whole of what makes this a decision instead of an upgrade.
 */
export const BUILD_REFUSALS: readonly BuildRefusal[] = [
  {
    id: 'no-lot',
    said: 'There’s no lot to build it on.',
  },
  {
    id: 'already',
    said: `${A_SMALL_STAGE.name} is already standing.`,
  },
  {
    id: 'going-up',
    said: 'It’s already going up. Nobody builds the same room twice.',
  },
  {
    id: 'cannot-carry',
    said: 'The family won’t carry it on top of what it is already carrying.',
  },
];

export const buildRefusalById = (id: WhyNotBuild): BuildRefusal | undefined =>
  BUILD_REFUSALS.find((one) => one.id === id);
