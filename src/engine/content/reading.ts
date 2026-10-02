/**
 * SLATE — something to read (the master plan's §34b, from 2026-10-02;
 * `docs/research/world/research-reading.json`, each library's and seller's
 * own page read that day, a few secondhand as marked).
 *
 * **A library card** is free to a resident in each of the eight towns, as
 * each library's own page says: the New York Public Library to anyone who
 * lives in New York State, the Los Angeles Public Library to a Californian,
 * New Haven's Free Public Library to a resident, Toronto's to one who lives
 * in the city, Vancouver's (read secondhand), Westminster's, Dublin City
 * Libraries and the Biblioteca Vasconcelos.
 *
 * **A book**: a current paperback at a named bookseller's own price
 * (Barnes & Noble, Indigo, Waterstones read secondhand, Easons, Librerías
 * Gandhi). **An e-reader**: the Kobo Clara BW at Kobo's own price, a Kobo
 * Clara Colour at Gandhi in Mexico.
 */

export interface Library { cityId: string; name: string; source: string }
export const LIBRARIES: readonly Library[] = [
  { cityId: 'us-ny-newyork', name: 'The New York Public Library', source: 'https://www.nypl.org/library-card' },
  { cityId: 'us-ca-losangeles', name: 'The Los Angeles Public Library', source: 'https://www.lapl.org/borrow/cards' },
  { cityId: 'us-ct-newhaven', name: 'The New Haven Free Public Library', source: 'https://nhfpl.org/' },
  { cityId: 'ca-on-toronto', name: 'The Toronto Public Library', source: 'https://www.torontopubliclibrary.ca/' },
  { cityId: 'ca-bc-vancouver', name: 'The Vancouver Public Library', source: 'https://www.vpl.ca/' },
  { cityId: 'uk-eng-london', name: 'Westminster Libraries', source: 'https://www.westminster.gov.uk/libraries' },
  { cityId: 'ie-lei-dublin', name: 'Dublin City Libraries', source: 'https://www.dublincity.ie/residential/libraries' },
  { cityId: 'mx-cmx-mexicocity', name: 'The Biblioteca Vasconcelos', source: 'https://bibliotecavasconcelos.gob.mx/' },
];

export interface ReadingBuy { id: string; country: string; kind: 'book' | 'ereader'; label: string; seller: string; price: number; currency: string; taxIncluded: boolean }
export const READING_BUYS: readonly ReadingBuy[] = [
  { id: 'us-james', country: 'us', kind: 'book', label: 'James, Percival Everett, Paperback', seller: 'Barnes & Noble', price: 17, currency: 'USD', taxIncluded: false },
  { id: 'us-intermezzo', country: 'us', kind: 'book', label: 'Intermezzo, Sally Rooney, Paperback', seller: 'Barnes & Noble', price: 19, currency: 'USD', taxIncluded: false },
  { id: 'ca-intermezzo', country: 'ca', kind: 'book', label: 'Intermezzo, Sally Rooney, Paperback', seller: 'Indigo', price: 25, currency: 'CAD', taxIncluded: false },
  { id: 'uk-intermezzo', country: 'uk', kind: 'book', label: 'Intermezzo, Sally Rooney, Paperback', seller: 'Waterstones', price: 9.99, currency: 'GBP', taxIncluded: true },
  { id: 'uk-james', country: 'uk', kind: 'book', label: 'James, Percival Everett, Paperback', seller: 'Waterstones', price: 9.99, currency: 'GBP', taxIncluded: true },
  { id: 'ie-intermezzo', country: 'ie', kind: 'book', label: 'Intermezzo, Sally Rooney, Paperback', seller: 'Easons', price: 9.49, currency: 'EUR', taxIncluded: true },
  { id: 'mx-intermezzo', country: 'mx', kind: 'book', label: 'Intermezzo, Sally Rooney, Tapa Blanda', seller: 'Librerías Gandhi', price: 349, currency: 'MXN', taxIncluded: true },
  { id: 'mx-cien-anos', country: 'mx', kind: 'book', label: 'Cien Años De Soledad, Gabriel García Márquez', seller: 'Librerías Gandhi', price: 298, currency: 'MXN', taxIncluded: true },
  { id: 'us-kobo-clara-bw', country: 'us', kind: 'ereader', label: 'Kobo Clara BW', seller: 'Rakuten Kobo', price: 159.99, currency: 'USD', taxIncluded: false },
  { id: 'ca-kobo-clara-bw', country: 'ca', kind: 'ereader', label: 'Kobo Clara BW', seller: 'Rakuten Kobo', price: 179.99, currency: 'CAD', taxIncluded: false },
  { id: 'uk-kobo-clara-bw', country: 'uk', kind: 'ereader', label: 'Kobo Clara BW', seller: 'Rakuten Kobo', price: 149.99, currency: 'GBP', taxIncluded: true },
  { id: 'ie-kobo-clara-bw', country: 'ie', kind: 'ereader', label: 'Kobo Clara BW', seller: 'Rakuten Kobo', price: 169.99, currency: 'EUR', taxIncluded: true },
  { id: 'mx-kobo-clara-colour', country: 'mx', kind: 'ereader', label: 'Kobo Clara Colour', seller: 'Librerías Gandhi', price: 3899, currency: 'MXN', taxIncluded: true },
];
