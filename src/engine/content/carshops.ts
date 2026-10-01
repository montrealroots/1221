/**
 * SLATE — car repair shops by town, and what breaks (Stage 8 of
 * `docs/BACKLOG.md`, from 2026-10-01), from
 * `docs/research/world/research-vehicle-shops.json`, read 2026-10-01.
 *
 * **The shops** are the named garages, chains and dealers' service
 * departments found in each town, with their addresses, and their hours
 * where a page or a listing gave them (`week`); one whose hours weren't
 * found is taken as open. A day a listing leaves out is taken as closed. A
 * dealer's service department works on its own make, as dealers do. Shops
 * for tint, wraps and bodywork, and the inspection stations, aren't here:
 * a repair isn't theirs. Advance Pitstop stays open to 20:00 on Thursdays,
 * which a week of weekdays doesn't hold, so its Thursdays close at 18:00.
 *
 * **What breaks** is RepairPal's 2026 reliability ratings, from US repair
 * invoices: a model's or, failing that, its make's unscheduled repairs a
 * year, the share of them that are severe (over three times the average
 * annual repair cost, RepairPal's line), and the annual cost of repairs and
 * maintenance together; the all-brand average where neither was rated. An
 * ordinary repair costs CarMD's 2026 index's average check-engine repair,
 * $554.01 (2025's invoices); a severe one RepairPal's line, three times the
 * annual cost, the least a severe repair can be, SLATE's estimate of it. US
 * figures, SLATE carries them everywhere at the exchange, as it does AAA's
 * upkeep.
 */

import type { Week } from './storehours';

export type ShopKind = 'dealer' | 'chain' | 'independent';

export interface CarShop {
  id: string;
  name: string;
  cityId: string;
  kind: ShopKind;
  address: string;
  /** A dealer's make, the only one it works on. */
  make?: string;
  week?: Week;
  source: string;
}

const CLOSED = { open: 0, close: 0 };
const week = (weekdays: [number, number], saturday?: [number, number], sunday?: [number, number]): Week => ({
  weekdays: { open: weekdays[0], close: weekdays[1] },
  saturday: saturday ? { open: saturday[0], close: saturday[1] } : CLOSED,
  sunday: sunday ? { open: sunday[0], close: sunday[1] } : CLOSED,
});

export const CAR_SHOPS: readonly CarShop[] = [
  { id: 'toyota-of-manhattan', name: 'Toyota of Manhattan', cityId: 'us-ny-newyork', kind: 'dealer', make: 'Toyota', address: '679 11th Avenue, New York, NY 10019', week: week([7, 18]), source: 'https://www.toyotaofmanhattan.com/service/center.htm' },
  { id: 'pep-boys-4th-ave', name: 'Pep Boys Auto Service & Tire', cityId: 'us-ny-newyork', kind: 'chain', address: '354 4th Ave, Brooklyn, NY 11215', week: week([7, 20], [7, 19], [9, 18]), source: 'https://www.yellowpages.com/brooklyn-ny/mip/pep-boys-541028096' },
  { id: 'midas-w53', name: 'Midas', cityId: 'us-ny-newyork', kind: 'chain', address: '455 W 53rd St, New York, NY 10019', source: 'https://www.yellowpages.com/new-york-ny/midas-auto-service-experts' },
  { id: 'manhattan-auto-repair', name: 'Manhattan Auto Repair', cityId: 'us-ny-newyork', kind: 'independent', address: '552 W 48th St, New York, NY 10036', source: 'https://www.yelp.com/biz/manhattan-auto-repair-new-york-3' },
  { id: 'toyota-of-hollywood', name: 'Toyota of Hollywood', cityId: 'us-ca-losangeles', kind: 'dealer', make: 'Toyota', address: '6920 W Sunset Blvd, Los Angeles, CA 90028', week: week([7, 18], [7, 17]), source: 'https://www.hollywoodtoyota.com/service/center.htm' },
  { id: 'firestone-santa-monica-blvd', name: 'Firestone Complete Auto Care', cityId: 'us-ca-losangeles', kind: 'chain', address: '10785 Santa Monica Blvd, Los Angeles, CA 90025', source: 'https://www.firestonecompleteautocare.com/california/los-angeles/10785-santa-monica-blvd/' },
  { id: 'a1-toyota', name: 'A-1 Toyota', cityId: 'us-ct-newhaven', kind: 'dealer', make: 'Toyota', address: '50 Amity Road, New Haven, CT 06515', week: week([7.5, 19], [7.5, 17]), source: 'https://www.a1toyota.com/service/' },
  { id: 'midas-whalley-ave', name: 'Midas Auto Service Experts', cityId: 'us-ct-newhaven', kind: 'chain', address: '75 Whalley Ave, New Haven, CT 06511', source: 'https://auto-parts-stores.cmac.ws/midas-auto-service-experts/12371/' },
  { id: 'meineke-122', name: 'Meineke Car Care Center #122', cityId: 'us-ct-newhaven', kind: 'chain', address: '1175 Whalley Avenue, New Haven, CT 06515', source: 'https://www.meineke.com/locations/ct/new-haven-122/' },
  { id: 'firestone-chapel-st', name: 'Firestone Complete Auto Care', cityId: 'us-ct-newhaven', kind: 'chain', address: '680 Chapel St, New Haven, CT 06510', source: 'https://www.yellowpages.com/new-haven-ct/auto-repair-service' },
  { id: 'kwik-fit-holloway', name: 'Kwik Fit Holloway', cityId: 'uk-eng-london', kind: 'chain', address: '379 Camden Road, London N7 0SH', week: week([8.5, 18], [8.5, 17], [10, 16]), source: 'https://www.kwik-fit.com/locate-a-centre/london-islington-holloway' },
  { id: 'halfords-southfields', name: 'Halfords Autocentre Southfields', cityId: 'uk-eng-london', kind: 'chain', address: '271 Merton Road, Southfields, London SW18 5JS', week: week([8, 18], [8, 17]), source: 'https://www.halfords.com/locations/southfields-london-autocentre/' },
  { id: 'jemca-toyota-edgware-road', name: 'Jemca Toyota Edgware Road', cityId: 'uk-eng-london', kind: 'dealer', make: 'Toyota', address: '78 Capitol Way, London NW9 0EW', week: week([8, 18], [8, 13]), source: 'https://www.toyota.co.uk/dealers/jemcaedgwareroad' },
  { id: 'advance-pitstop-townsend-st', name: 'Advance Pitstop Townsend Street', cityId: 'ie-lei-dublin', kind: 'chain', address: '53 Townsend Street, Dublin 2', week: week([8.5, 18], [9, 17]), source: 'https://www.yelp.com/biz/advance-pitstop-dublin-2' },
  { id: 'sweeneys-bridgefoot-st', name: 'Sweeneys Garage', cityId: 'ie-lei-dublin', kind: 'independent', address: 'Bridgefoot Street, Dublin', source: 'https://sweeneysgarage.ie/car-service/' },
  { id: 'tadg-riordan-motors', name: 'Tadg Riordan Motors', cityId: 'ie-lei-dublin', kind: 'dealer', make: 'Toyota', address: 'Airton Rd, Tallaght, Dublin 24, D24 F252', week: week([9, 18]), source: 'https://www.trmtallaght.ie/service-at-tadg-riordan-motors' },
  { id: 'canadian-tire-yonge-st', name: 'Canadian Tire Auto Service Centre', cityId: 'ca-on-toronto', kind: 'chain', address: '839 Yonge St, Toronto, ON M4W 2H2', week: week([8, 21], [8, 21]), source: 'https://www.yellowpages.ca/bus/Ontario/Toronto/Canadian-Tire-Associate-Stores-Auto-Service-Centre/101568658.html' },
  { id: 'mr-lube-overlea', name: 'Mr. Lube', cityId: 'ca-on-toronto', kind: 'chain', address: '61 Overlea Blvd., Toronto, ON M4H 1C2', source: 'https://www.mrlube.com/en/locations/40' },
  { id: 'downtown-toyota', name: 'Downtown Toyota', cityId: 'ca-on-toronto', kind: 'dealer', make: 'Toyota', address: '79 E Don Roadway, Toronto, ON M4M 2A5', source: 'https://www.yelp.ca/biz/downtown-toyota-toronto-18' },
  { id: 'toronto-honda', name: 'Toronto Honda', cityId: 'ca-on-toronto', kind: 'dealer', make: 'Honda', address: '2300 Danforth Ave, Toronto', source: 'https://www.torontohonda.com/service/' },
  { id: 'jim-pattison-toyota-downtown', name: 'Jim Pattison Toyota Downtown', cityId: 'ca-bc-vancouver', kind: 'dealer', make: 'Toyota', address: '1290 Burrard Street, Vancouver, BC V6Z 1Z1', week: week([7.5, 18], [7.5, 18]), source: 'http://www.jptoyota-downtown.com/service' },
  { id: 'canadian-tire-604', name: 'Canadian Tire Grandview Highway', cityId: 'ca-bc-vancouver', kind: 'chain', address: '2830 Bentall Street, Vancouver, BC V5M 4H4', week: week([7, 19], [8, 18], [8, 18]), source: 'https://www.canadianplanet.net/canadian-tire-604-grandview-highway-F110EC00F1FD441' },
  { id: 'kal-tire-w4th', name: 'Kal Tire Vancouver Downtown', cityId: 'ca-bc-vancouver', kind: 'chain', address: '1500 W 4th Ave, Vancouver, BC V6J 1L7', source: 'https://www.michelin.ca/en/auto/dealer-locator/vancouver/kal-tire-vancouver-673' },
  { id: 'nissan-insurgentes-norte', name: 'Nissan Insurgentes Norte', cityId: 'mx-cmx-mexicocity', kind: 'dealer', make: 'Nissan', address: 'Av. Insurgentes Nte. 208, San Simón Tolnahuac, Cuauhtémoc, CDMX 06920', source: 'https://www.nissaninsurgentesnorte.com.mx/promociones-de-servicio' },
  { id: 'toyota-universidad', name: 'Toyota Universidad', cityId: 'mx-cmx-mexicocity', kind: 'dealer', make: 'Toyota', address: 'Av. Universidad 1112, CDMX 03330', week: week([7, 19], [7, 14]), source: 'https://www.toyotauniversidad.mx/horarios-y-direcciones' },
  { id: 'toyota-polanco', name: 'Toyota Polanco', cityId: 'mx-cmx-mexicocity', kind: 'dealer', make: 'Toyota', address: 'Lago Alberto 320, Granada, Miguel Hidalgo, CDMX 11520', week: week([7.25, 19], [9.25, 14]), source: 'https://www.toyotapolanco.com.mx/horarios-y-direcciones' },
  { id: 'speedee-pedregal', name: 'SpeeDee Pedregal', cityId: 'mx-cmx-mexicocity', kind: 'chain', address: 'Av. San Jerónimo 538, Álvaro Obregón, CDMX', source: 'https://speedee.com.mx/servicios/afinacion-mayor-en-cdmx' },
  { id: 'goodyear-servisan', name: 'Goodyear Grupo Servisan', cityId: 'mx-cmx-mexicocity', kind: 'chain', address: 'Ermita Iztapalapa 2186, Constitución de 1917, Iztapalapa, CDMX 09260', source: 'https://llanteracercademi.com.mx/cdmx/iztapalapa/goodyear-grupo-servisan-iztapalapa/' },
];

export interface Reliability { visits: number; severe: number; annualUsd: number }

/** RepairPal's 2026 ratings: models by make and model, and makes. */
export const RELIABILITY = {
  average: { visits: 0.4, severe: 0.12, annualUsd: 652 },
  makes: {
    Honda: { visits: 0.3, severe: 0.1, annualUsd: 428 },
    Kia: { visits: 0.2, severe: 0.1, annualUsd: 474 },
    Hyundai: { visits: 0.27, severe: 0.1, annualUsd: 468 },
    Toyota: { visits: 0.3, severe: 0.12, annualUsd: 441 },
    Nissan: { visits: 0.3, severe: 0.13, annualUsd: 500 },
    Volkswagen: { visits: 0.5, severe: 0.11, annualUsd: 676 },
    Chevrolet: { visits: 0.3, severe: 0.15, annualUsd: 649 },
    Ford: { visits: 0.3, severe: 0.15, annualUsd: 775 },
    Ram: { visits: 0.26, severe: 0.15, annualUsd: 858 },
  } as Record<string, Reliability>,
  models: {
    'Toyota Corolla': { visits: 0.35, severe: 0.07, annualUsd: 362 },
    'Toyota Camry': { visits: 0.28, severe: 0.11, annualUsd: 388 },
    'Toyota RAV4': { visits: 0.26, severe: 0.1, annualUsd: 429 },
    'Honda CR-V': { visits: 0.3, severe: 0.09, annualUsd: 407 },
    // RepairPal's F-150, the F-Series's best seller.
    'Ford F-Series': { visits: 0.28, severe: 0.15, annualUsd: 788 },
    'Volkswagen Golf': { visits: 0.35, severe: 0.11, annualUsd: 630 },
    'Nissan Versa': { visits: 0.37, severe: 0.1, annualUsd: 456 },
    'Hyundai Tucson': { visits: 0.26, severe: 0.1, annualUsd: 426 },
    'Kia Sportage': { visits: 0.19, severe: 0.11, annualUsd: 462 },
  } as Record<string, Reliability>,
} as const;

/** CarMD's average check-engine repair, 2025's invoices, dollars. */
export const ORDINARY_REPAIR_USD = 554.01;
/** RepairPal's severe repair: over three times the annual cost. */
export const SEVERE_TIMES_ANNUAL = 3;
/** Days a severe repair keeps a car in the shop: none is published, SLATE's estimate. An ordinary one is the same day (Sweeneys Garage: dropped off in the morning, collected at the end of the day). */
export const SEVERE_DAYS = 3;
