/**
 * SLATE — the people a life meets (Stage 10 of `docs/BACKLOG.md`, from
 * 2026-10-01), from `docs/research/world/research-relationships.json`.
 *
 * **Names** are the commonest of each country, for people born in the
 * 1990s, as the national registers list them: the ONS's baby names for
 * England and Wales, the CSO's for Ireland, Statistics Canada's and the
 * provinces', RENAPO's for Mexico, the Social Security Administration's for
 * America; surnames as each country's are counted. From SLATE's knowledge of
 * those lists, not re-read on 2026-10-01. A name says nothing of a person
 * but what they're called.
 *
 * **Friendship** is time: Hall (2018) found about 50 hours together make an
 * acquaintance a casual friend, 90 a friend, and more than 200 a close one.
 * Of Americans' close friends, 54% were met at work and 47% at school (the
 * Survey Center on American Life, 2021), which is where SLATE's are met.
 *
 * **Living alone** carries an odds ratio of 1.32 for death against living
 * with others, adjusted (Holt-Lunstad and others, 2015, 70 studies). The
 * life table is everybody's, so SLATE spreads it over the share who live
 * alone: about 38.5 million Americans in one-person households in 2024 of
 * some 262 million adults, 14.7% (the Census Bureau's America's Families
 * and Living Arrangements, from SLATE's knowledge, not re-read). Somebody
 * living alone is then 1.32 / (1 + 0.32 x 0.147) of the table, and
 * anybody else 1 / (1 + 0.32 x 0.147). The odds ratio is taken as the
 * ratio of the chances, as it nearly is when the chance is small.
 */

export interface Names { female: readonly string[]; male: readonly string[]; family: readonly string[] }

export const NAMES: Readonly<Record<'us' | 'uk' | 'ie' | 'ca' | 'mx', Names>> = {
  us: {
    female: ['Jessica', 'Ashley', 'Emily', 'Sarah', 'Samantha', 'Amanda', 'Brittany', 'Elizabeth', 'Taylor', 'Megan', 'Hannah', 'Kayla'],
    male: ['Michael', 'Christopher', 'Matthew', 'Joshua', 'Jacob', 'Nicholas', 'Andrew', 'Daniel', 'Tyler', 'Joseph', 'Brandon', 'David'],
    family: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor'],
  },
  uk: {
    female: ['Rebecca', 'Lauren', 'Jessica', 'Charlotte', 'Hannah', 'Sophie', 'Amy', 'Emily', 'Laura', 'Emma', 'Chloe', 'Sarah'],
    male: ['Thomas', 'James', 'Jack', 'Daniel', 'Matthew', 'Ryan', 'Joshua', 'Luke', 'Samuel', 'Jordan', 'Adam', 'Michael'],
    family: ['Smith', 'Jones', 'Williams', 'Taylor', 'Brown', 'Davies', 'Evans', 'Wilson', 'Thomas', 'Johnson', 'Roberts', 'Robinson', 'Thompson', 'Wright', 'Walker', 'White'],
  },
  ie: {
    female: ['Sarah', 'Aoife', 'Ciara', 'Emma', 'Chloe', 'Rachel', 'Niamh', 'Laura', 'Sinead', 'Amy', 'Rebecca', 'Katie'],
    male: ['Sean', 'Conor', 'Jack', 'James', 'Michael', 'David', 'Daniel', 'Adam', 'Patrick', 'Cian', 'Ryan', 'Eoin'],
    family: ['Murphy', 'Kelly', 'O’Sullivan', 'Walsh', 'Smith', 'O’Brien', 'Byrne', 'Ryan', 'O’Connor', 'O’Neill', 'O’Reilly', 'Doyle', 'McCarthy', 'Gallagher', 'Doherty', 'Kennedy'],
  },
  ca: {
    female: ['Jessica', 'Ashley', 'Emily', 'Sarah', 'Samantha', 'Amanda', 'Stephanie', 'Jennifer', 'Megan', 'Laura', 'Emilie', 'Catherine'],
    male: ['Michael', 'Matthew', 'Christopher', 'Ryan', 'Andrew', 'Daniel', 'Justin', 'Kevin', 'Tyler', 'Alexandre', 'David', 'Jonathan'],
    family: ['Smith', 'Brown', 'Tremblay', 'Martin', 'Roy', 'Wilson', 'MacDonald', 'Gagnon', 'Johnson', 'Taylor', 'Côté', 'Campbell', 'Anderson', 'Leblanc', 'Lee', 'Jones'],
  },
  mx: {
    female: ['María', 'Guadalupe', 'Fernanda', 'Daniela', 'Andrea', 'Mariana', 'Alejandra', 'Gabriela', 'Karla', 'Valeria', 'Ana', 'Paola'],
    male: ['José', 'Juan', 'Luis', 'Carlos', 'Jorge', 'Miguel', 'Alejandro', 'Daniel', 'Eduardo', 'Ricardo', 'Fernando', 'Javier'],
    family: ['Hernández', 'García', 'Martínez', 'López', 'González', 'Rodríguez', 'Pérez', 'Sánchez', 'Ramírez', 'Cruz', 'Flores', 'Gómez', 'Morales', 'Vázquez', 'Reyes', 'Jiménez'],
  },
};

/**
 * **Partners.** Pew Research found 38% of American adults aged 25 to 54
 * unpartnered in 2019, neither married nor living with anybody (2021, from
 * SLATE's knowledge, not re-read), which is the chance somebody known is
 * free to be asked out. A couple calls itself one after nine dates on
 * average (a Mic and Google Consumer Surveys poll of 3,058, in the
 * research; no academic figure was found). A couple who move in together
 * split the rent and the bills evenly, as 69% of British couples on similar
 * incomes do (YouGov); what each earns isn't kept for the other, so it's
 * always even.
 */
export const PARTNERS = { single: 0.38, datesToCouple: 9, share: 0.5 } as const;

/** Hall's hours together: a casual friend, a friend, a close one. */
export const HALL = { casual: 50, friend: 90, close: 200 } as const;

/** Holt-Lunstad's odds ratio for living alone, and the share of American adults who do. */
export const LIVING_ALONE = { oddsRatio: 1.32, share: 38.5 / 262 } as const;

/**
 * SLATE's estimates where nothing is published:
 * - `notBefore` and `notAfter`: the hours, local, a friend will start a meal or a visit between.
 * - `rest`: the days a friend leaves between two meetings.
 * - `morale` and `stress`: what time with a friend lifts the mood by, by how much the person needs company, and the stress it takes off.
 * - `visitMinutes`: how long a visit at home lasts.
 * - A castmate becomes somebody you know, one a job.
 * - `interested`: the chance somebody free to be asked out would want to, one in two.
 * - `breakup`: the stress a parting adds, and the mood it takes.
 */
export const SOCIAL = { notBefore: 10, notAfter: 22, rest: 3, morale: 4, stress: 3, visitMinutes: 120, interested: 0.5, breakup: 10 } as const;

/**
 * A friend asking first (`systems/reachingout.ts`, from 2026-10-06). Pew
 * found 29% of American adults with close friends see one in person at
 * least a few times a week (July 2023, 5,057 adults; reported January
 * 2025). Nobody publishes who of two friends asks, nor how often one friend
 * does, so the rest are SLATE's estimates, a friendship taken as asked for
 * from both sides:
 * - `weekly`: the asks a week from a close friend, a friend and a casual one,
 *   about one a fortnight, one a month and one in ten weeks;
 * - `ahead`: the days on it's for, two to six;
 * - `hour`: seven in the evening, theirs and yours;
 * - `pause`: the days after asking, or after being answered, before they ask again.
 */
export const ASKS = { weekly: { close: 0.5, friend: 0.25, casual: 0.1 }, ahead: { least: 2, most: 6 }, hour: 19, pause: 14 } as const;

/**
 * Going out together (from 2026-10-06; until then the only outing was a meal):
 * - `walkMinutes`: a walk in the park, the American Time Use Survey 2025's 0.96 hours a day of walking for those
 *   who walked (Table A-1, `research-atus-household.json`); free.
 * - `film`: the average cinema ticket, by country, where a trade body publishes one (`research-outings.json`):
 *   America's $10.75 (the theater owners' national association, now Cinema United, as reported) and Britain's £8.01 (the UK Cinema
 *   Association, 2025). Ireland's, Canada's and Mexico's are only Numbeo's, so no film is seen together there. A film
 *   is taken as a visit's two hours, SLATE's estimate: no average running time was read.
 * - a pint at a bar, at the town's own bar price (`pintPrice` in `systems/alcohol.ts`), the one a pint alone costs.
 *   For a few hours on 2026-10-06 it was Britain's alone, at the ONS's national £4.83, while a pint alone in London
 *   cost Numbeo's £7: one pint, two prices. London's is now the reported £6.10 for its pubs.
 */
export const OUTINGS = {
  walkMinutes: 0.96 * 60,
  film: { us: { price: 10.75, currency: 'USD' }, uk: { price: 8.01, currency: 'GBP' } } as Readonly<Record<string, { price: number; currency: string }>>,
} as const;
