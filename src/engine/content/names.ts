/**
 * SLATE — Icelandic names, for the people a production has to invent.
 *
 * The lot is in Mosfellsdalur and four in five productions claiming the
 * Icelandic rebate are domestic, so the crew that turns up is mostly Icelandic
 * and ought to be named like it.
 *
 * ## Why the genitive is written down instead of worked out
 *
 * An Icelandic surname is usually a patronymic: the father's given name in the
 * genitive, plus `son` or `dóttir`. The genitive is not a suffix rule — Jón
 * becomes Jóns, Sigurður becomes Sigurðar, Árni becomes Árna, Magnús becomes
 * Magnúsar — so a function that appends an `s` would produce names that are
 * wrong in a way an Icelandic speaker would notice immediately. Every name here
 * therefore carries its own genitive stem, and the engine only ever joins.
 *
 * Anything the game cannot get right it should not generate. This is the
 * cheapest possible way to be right about it.
 */

export interface Given {
  /** The name itself. */
  name: string;
  /** The same name in the genitive, for building a patronymic off it. */
  of: string;
}

/**
 * Men's given names, with the genitive each one takes.
 *
 * Doubles as the pool of fathers, because a patronymic is built off a man's
 * name whether or not that man is ever a person in the save.
 */
export const MEN: readonly Given[] = [
  { name: 'Jón', of: 'Jóns' },
  { name: 'Sigurður', of: 'Sigurðar' },
  { name: 'Guðmundur', of: 'Guðmundar' },
  { name: 'Ólafur', of: 'Ólafs' },
  { name: 'Einar', of: 'Einars' },
  { name: 'Magnús', of: 'Magnúsar' },
  { name: 'Kristján', of: 'Kristjáns' },
  { name: 'Gunnar', of: 'Gunnars' },
  { name: 'Árni', of: 'Árna' },
  { name: 'Bjarni', of: 'Bjarna' },
  { name: 'Helgi', of: 'Helga' },
  { name: 'Stefán', of: 'Stefáns' },
  { name: 'Halldór', of: 'Halldórs' },
  { name: 'Páll', of: 'Páls' },
  { name: 'Baldur', of: 'Baldurs' },
  { name: 'Hrafn', of: 'Hrafns' },
  { name: 'Ragnar', of: 'Ragnars' },
  { name: 'Sveinn', of: 'Sveins' },
  { name: 'Egill', of: 'Egils' },
  { name: 'Þorsteinn', of: 'Þorsteins' },
  { name: 'Ásgeir', of: 'Ásgeirs' },
  { name: 'Viðar', of: 'Viðars' },
];

/** Women's given names. Nothing is built off them, so they carry no genitive. */
export const WOMEN: readonly string[] = [
  'Guðrún', 'Anna', 'Sigríður', 'Kristín', 'Margrét', 'Helga', 'Katrín', 'Elín',
  'Hildur', 'Jóhanna', 'Sóley', 'Bryndís', 'Þóra', 'Ragnheiður', 'Ásta', 'Halla',
  'Lilja', 'Unnur', 'Dagný', 'Sigrún', 'Brynja', 'Vigdís',
];

/**
 * A patronymic, built the way Icelandic builds one.
 *
 * `son` for a man, `dóttir` for a woman, onto the father's genitive. A person
 * whose pronouns are neither takes the father's name with `bur`, which is the
 * non-gendered form in use since the law allowed it in 2019.
 */
export function patronymic(father: Given, takes: 'son' | 'dóttir' | 'bur'): string {
  return `${father.of}${takes}`;
}
