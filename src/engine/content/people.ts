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
 */
export const SOCIAL = { notBefore: 10, notAfter: 22, rest: 3, morale: 4, stress: 3, visitMinutes: 120 } as const;
