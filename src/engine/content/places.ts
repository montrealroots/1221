/**
 * SLATE — the places you actually go.
 *
 * Two kinds of place live here. The landmarks are real: public monuments,
 * parks, museums, piers and observatories, each with what it is and, where it
 * is a matter of public record, when it opened. Nothing is claimed about a
 * real place that is not durable and on the record — no opening hours, no
 * prices, no menus.
 *
 * Everything else — the restaurants, cafés, bars, gyms, markets, garages and
 * cinemas of a city — is SLATE's own. They are generated per city so that any
 * of a hundred and seventy thousand cities has somewhere to eat, and they are
 * labelled as the game's inventions wherever the player can see them. The
 * cuisines and the dishes are real things people cook; the businesses are not
 * real businesses.
 *
 * Prices are SLATE's calibration against the city's cost of living, not a
 * quote from anybody.
 */

import { makeRng, type Rng } from '../core/rng';
import type { Money } from '../core/money';
import { CITIES, NEIGHBOURHOODS, cityTimeZone } from './geography';
import { costOfLiving } from './tax';
import { REAL_GYMS } from './fitness';
import { HOUSES_NOT_SHOPS, RENTAL_HOUSES, ownHousesIn } from './rental';
import { shoppableRetailers } from './catalog';
import { ALL_RETAILERS, tradesIn } from './brands';

export type PlaceKind =
  | 'restaurant' | 'cafe' | 'bar' | 'fast_food' | 'market'
  | 'gas_station' | 'garage' | 'hotel' | 'gym' | 'salon'
  | 'cinema' | 'theatre' | 'club' | 'park' | 'beach' | 'viewpoint'
  | 'museum' | 'landmark' | 'stadium' | 'studio_gate' | 'airport' | 'shop' | 'dealership'
  | 'marina' | 'storage' | 'jeweller' | 'costumier' | 'rental_house';

export const PLACE_KIND_LABEL: Readonly<Record<PlaceKind, string>> = {
  jeweller: 'Jeweler', costumier: 'Costume House',
  restaurant: 'Restaurant', cafe: 'Café', bar: 'Bar', fast_food: 'Fast Food', market: 'Market',
  gas_station: 'Filling Station', garage: 'Garage', hotel: 'Hotel', gym: 'Gym', salon: 'Salon',
  cinema: 'Cinema', theatre: 'Theater', club: 'Club', park: 'Park', beach: 'Beach', viewpoint: 'Viewpoint',
  museum: 'Museum', landmark: 'Landmark', stadium: 'Stadium', studio_gate: 'Studio Gate', airport: 'Airport', shop: 'Shop',
  dealership: 'Dealership', marina: 'Marina', storage: 'Vehicle Storage',
  rental_house: 'Rental House',
};

/** What you can do somewhere. */
export type PlaceAction = 'eat' | 'drink' | 'refuel' | 'sleep' | 'shower' | 'train' | 'watch' | 'visit' | 'shop' | 'meet' | 'service' | 'browse';

export interface Place {
  id: string;
  name: string;
  kind: PlaceKind;
  cityId: string;
  neighbourhoodId?: string;
  /** A sentence on what it is. For a real landmark, only what is on the record. */
  about: string;
  /** Real place, or one of SLATE's. Shown to the player, never blurred. */
  real: boolean;
  /** Year it opened, where that is public record. Real places only. */
  opened?: number;
  /** 0-100 on SLATE's scale: how good, how expensive, how hard to get into. */
  quality: number;
  price: 1 | 2 | 3 | 4;
  /** Minutes a visit usually takes. */
  minutes: number;
  actions: PlaceAction[];
  /** Where the industry drinks. Raises the chance of running into somebody. */
  industryHaunt?: boolean;
  /** For a landmark that charges: SLATE's calibrated admission in cents, before cost of living. */
  admissionCalibration?: number;
  /** A dealership's stock in trade. Absent on anything that is not a lot. */
  sells?: LotSells;
  /** A marina's water: how big a boat its longest slips take, in feet. SLATE's calibration even at a real marina. */
  maxSlipFeet?: number;
  /** A storefront's chain. Absent on anything that is not a shop you can walk into. */
  retailerId?: string;
}

// ---------------------------------------------------------------------------
// The real ones
// ---------------------------------------------------------------------------

/** A landmark on the record. Facts here are durable ones only. */
interface RealPlace extends Omit<Place, 'quality' | 'price' | 'minutes' | 'real'> {
  quality?: number;
  price?: 1 | 2 | 3 | 4;
  minutes?: number;
}

const LANDMARKS: readonly RealPlace[] = [
  // --- Marinas. The harbor and its name are public record; slip counts, sizes and rates are SLATE's. ---
  { id: 'la-marina-del-rey', name: 'Marina del Rey', kind: 'marina', cityId: 'us-ca-losangeles', about: 'A man-made small-craft harbor on the Westside, dug out of the Ballona wetlands and opened in 1965; one of the largest of its kind in the world.', opened: 1965, actions: ['visit'], minutes: 60, quality: 84, price: 3, maxSlipFeet: 150 },
  { id: 'sf-marina-yacht-harbor', name: 'San Francisco Marina Yacht Harbor', kind: 'marina', cityId: 'us-ca-sanfrancisco', about: 'The city’s own small-boat harbor on the Marina waterfront, with the Golden Gate in view from the breakwater.', actions: ['visit'], minutes: 60, quality: 80, price: 3, maxSlipFeet: 65 },
  { id: 'ny-north-cove', name: 'North Cove Marina', kind: 'marina', cityId: 'us-ny-newyork', about: 'A marina at Battery Park City on the Hudson, tucked behind Brookfield Place, that takes yachts up to superyacht size.', actions: ['visit'], minutes: 60, quality: 88, price: 4, maxSlipFeet: 180 },
  { id: 'chi-burnham-harbor', name: 'Burnham Harbor', kind: 'marina', cityId: 'us-il-chicago', about: 'A Chicago Park District harbor between Museum Campus and Northerly Island, open for the lake season.', actions: ['visit'], minutes: 60, quality: 76, price: 2, maxSlipFeet: 65 },
  { id: 'yvr-coal-harbour', name: 'Coal Harbor Marina', kind: 'marina', cityId: 'ca-bc-vancouver', about: 'A marina on the downtown waterfront beside Stanley Park, with float planes coming and going off the end of it.', actions: ['visit'], minutes: 60, quality: 82, price: 3, maxSlipFeet: 120 },
  { id: 'ldn-st-katharine', name: 'St Katharine Docks Marina', kind: 'marina', cityId: 'uk-eng-london', about: 'A marina in the old dock basins beside Tower Bridge, entered through a lock off the Thames.', opened: 1828, actions: ['visit'], minutes: 60, quality: 84, price: 4, maxSlipFeet: 130 },
  { id: 'mia-miami-beach-marina', name: 'Miami Beach Marina', kind: 'marina', cityId: 'us-fl-miami', about: 'A marina at the south end of Miami Beach on Government Cut, with the cruise ships passing the end of the docks.', actions: ['visit'], minutes: 60, quality: 86, price: 4, maxSlipFeet: 250 },
  { id: 'sea-elliott-bay', name: 'Elliott Bay Marina', kind: 'marina', cityId: 'us-wa-seattle', about: 'A private marina at the foot of Magnolia bluff on Elliott Bay, with the downtown skyline across the water.', actions: ['visit'], minutes: 60, quality: 82, price: 3, maxSlipFeet: 100 },

  // --- Los Angeles ---------------------------------------------------------
  { id: 'la-griffith', name: 'Griffith Observatory', kind: 'viewpoint', cityId: 'us-ca-losangeles', about: 'A public observatory on the south slope of Mount Hollywood, given to the city by Griffith J. Griffith and open free to the public since it was built.', opened: 1935, actions: ['visit'], minutes: 120, admissionCalibration: 0 },
  { id: 'la-hollywood-sign', name: 'The Hollywood Sign', kind: 'landmark', cityId: 'us-ca-losangeles', about: 'Erected as "Hollywoodland" to advertise a housing development, shortened in 1949 and rebuilt in 1978. You can walk up to look at it; you cannot walk to it.', opened: 1923, actions: ['visit'], minutes: 150 },
  { id: 'la-santa-monica-pier', name: 'Santa Monica Pier', kind: 'landmark', cityId: 'us-ca-losangeles', about: 'A municipal pier at the end of Colorado Avenue, with a small amusement park on it since the 1990s.', opened: 1909, actions: ['visit', 'eat'], minutes: 120 },
  { id: 'la-venice-beach', name: 'Venice Beach Boardwalk', kind: 'beach', cityId: 'us-ca-losangeles', about: 'The oceanfront walk through Venice, laid out by Abbot Kinney as a canal resort.', opened: 1905, actions: ['visit'], minutes: 120 },
  { id: 'la-getty', name: 'The Getty Center', kind: 'museum', cityId: 'us-ca-losangeles', about: 'Richard Meier’s campus above the 405, holding the J. Paul Getty Museum’s European collection. Admission is free; the parking is not.', opened: 1997, actions: ['visit'], minutes: 180 },
  { id: 'la-lacma', name: 'LACMA', kind: 'museum', cityId: 'us-ca-losangeles', about: 'The Los Angeles County Museum of Art on Wilshire, the largest art museum in the western United States.', opened: 1965, actions: ['visit'], minutes: 150, admissionCalibration: 2_500 },
  { id: 'la-grand-central-market', name: 'Grand Central Market', kind: 'market', cityId: 'us-ca-losangeles', about: 'A public market hall on Broadway downtown, trading continuously for over a century.', opened: 1917, actions: ['eat', 'visit'], minutes: 75 },
  { id: 'la-runyon', name: 'Runyon Canyon Park', kind: 'park', cityId: 'us-ca-losangeles', about: 'A hillside park at the top of Fuller Avenue, and the most-walked dog hike in the city.', opened: 1984, actions: ['visit', 'train'], minutes: 90 },
  { id: 'la-tcl-chinese', name: 'TCL Chinese Theatre', kind: 'cinema', cityId: 'us-ca-losangeles', about: 'Sid Grauman’s cinema on Hollywood Boulevard, with the handprints in the forecourt. Premieres still happen here.', opened: 1927, actions: ['watch', 'visit'], minutes: 150 },
  { id: 'la-dodger-stadium', name: 'Dodger Stadium', kind: 'stadium', cityId: 'us-ca-losangeles', about: 'A ballpark in Chavez Ravine; the third-oldest in Major League Baseball.', opened: 1962, actions: ['visit'], minutes: 210 },
  { id: 'la-walk-of-fame', name: 'The Hollywood Walk Of Fame', kind: 'landmark', cityId: 'us-ca-losangeles', about: 'Brass stars set into the pavement of Hollywood Boulevard and Vine Street, administered by the Hollywood Chamber of Commerce.', opened: 1960, actions: ['visit'], minutes: 60 },

  // --- New York ------------------------------------------------------------
  { id: 'ny-central-park', name: 'Central Park', kind: 'park', cityId: 'us-ny-newyork', about: 'Olmsted and Vaux’s 843 acres between the Upper East and Upper West Sides.', opened: 1858, actions: ['visit', 'train'], minutes: 120 },
  { id: 'ny-moma', name: 'The Museum Of Modern Art', kind: 'museum', cityId: 'us-ny-newyork', about: 'MoMA, on West 53rd Street, holding one of the great collections of modern and contemporary art — and a film archive.', opened: 1929, actions: ['visit'], minutes: 180, admissionCalibration: 3_000 },
  { id: 'ny-brooklyn-bridge', name: 'Brooklyn Bridge', kind: 'landmark', cityId: 'us-ny-newyork', about: 'John and Washington Roebling’s suspension bridge over the East River, with a walkway above the traffic.', opened: 1883, actions: ['visit'], minutes: 75 },
  { id: 'ny-times-square', name: 'Times Square', kind: 'landmark', cityId: 'us-ny-newyork', about: 'The junction of Broadway and Seventh Avenue, named for the newspaper that moved there in 1904.', opened: 1904, actions: ['visit'], minutes: 45 },
  { id: 'ny-lincoln-center', name: 'Lincoln Center', kind: 'theatre', cityId: 'us-ny-newyork', about: 'A performing arts campus on the Upper West Side; the New York Film Festival is held here.', opened: 1962, actions: ['watch', 'visit'], minutes: 180 },
  { id: 'ny-met', name: 'The Metropolitan Museum Of Art', kind: 'museum', cityId: 'us-ny-newyork', about: 'The Met, on Fifth Avenue at 82nd Street, with two million works across five thousand years.', opened: 1870, actions: ['visit'], minutes: 210, admissionCalibration: 3_000 },
  { id: 'ny-high-line', name: 'The High Line', kind: 'park', cityId: 'us-ny-newyork', about: 'A park built along a disused elevated freight line on the West Side.', opened: 2009, actions: ['visit'], minutes: 75 },

  // --- London --------------------------------------------------------------
  { id: 'ldn-british-museum', name: 'The British Museum', kind: 'museum', cityId: 'uk-eng-london', about: 'A museum of human history in Bloomsbury, founded on Hans Sloane’s collection. Admission to the permanent collection is free.', opened: 1753, actions: ['visit'], minutes: 180 },
  { id: 'ldn-tower-bridge', name: 'Tower Bridge', kind: 'landmark', cityId: 'uk-eng-london', about: 'A bascule and suspension bridge over the Thames beside the Tower of London. It still opens for shipping.', opened: 1894, actions: ['visit'], minutes: 60 },
  { id: 'ldn-hyde-park', name: 'Hyde Park', kind: 'park', cityId: 'uk-eng-london', about: 'A royal park of 350 acres with the Serpentine through the middle of it.', opened: 1637, actions: ['visit', 'train'], minutes: 90 },
  { id: 'ldn-national-gallery', name: 'The National Gallery', kind: 'museum', cityId: 'uk-eng-london', about: 'The nation’s collection of Western European painting, on the north side of Trafalgar Square. Free to enter.', opened: 1824, actions: ['visit'], minutes: 150 },
  { id: 'ldn-bfi', name: 'BFI Southbank', kind: 'cinema', cityId: 'uk-eng-london', about: 'The British Film Institute’s repertory cinema under Waterloo Bridge, and the home of the London Film Festival.', opened: 1957, actions: ['watch', 'visit'], minutes: 150, industryHaunt: true },
  { id: 'ldn-camden-market', name: 'Camden Market', kind: 'market', cityId: 'uk-eng-london', about: 'Market halls and stalls along the Regent’s Canal at Camden Lock.', opened: 1974, actions: ['eat', 'shop', 'visit'], minutes: 90 },
  { id: 'ldn-soho', name: 'Soho', kind: 'landmark', cityId: 'uk-eng-london', about: 'The square mile between Oxford Street and Shaftesbury Avenue where most of British post-production works.', actions: ['visit', 'drink', 'meet'], minutes: 90, industryHaunt: true },
  { id: 'ldn-primrose-hill', name: 'Primrose Hill', kind: 'viewpoint', cityId: 'uk-eng-london', about: 'A hill on the north side of Regent’s Park with the whole skyline from the top.', opened: 1842, actions: ['visit'], minutes: 60 },

  // --- Elsewhere -----------------------------------------------------------
  { id: 'sf-golden-gate', name: 'Golden Gate Bridge', kind: 'landmark', cityId: 'us-ca-sanfrancisco', about: 'Joseph Strauss and Irving Morrow’s suspension bridge across the strait, painted International Orange.', opened: 1937, actions: ['visit'], minutes: 90 },
  { id: 'sf-golden-gate-park', name: 'Golden Gate Park', kind: 'park', cityId: 'us-ca-sanfrancisco', about: 'A thousand acres of park running to the ocean, with the de Young and the Academy of Sciences in it.', opened: 1870, actions: ['visit'], minutes: 120 },
  { id: 'atl-piedmont', name: 'Piedmont Park', kind: 'park', cityId: 'us-ga-atlanta', about: 'Midtown’s park, with the skyline over the lake.', opened: 1904, actions: ['visit', 'train'], minutes: 90 },
  { id: 'atl-fox', name: 'Fox Theater', kind: 'theatre', cityId: 'us-ga-atlanta', about: 'A Moorish-revival picture palace on Peachtree Street, saved from demolition in the 1970s.', opened: 1929, actions: ['watch', 'visit'], minutes: 180 },
  { id: 'chi-art-institute', name: 'The Art Institute Of Chicago', kind: 'museum', cityId: 'us-il-chicago', about: 'A museum and school on Michigan Avenue, with the lions outside.', opened: 1879, actions: ['visit'], minutes: 180, admissionCalibration: 3_200 },
  { id: 'chi-millennium', name: 'Millennium Park', kind: 'park', cityId: 'us-il-chicago', about: 'A park over a rail yard in the Loop, with Kapoor’s Cloud Gate in it.', opened: 2004, actions: ['visit'], minutes: 75 },
  { id: 'yvr-stanley', name: 'Stanley Park', kind: 'park', cityId: 'ca-bc-vancouver', about: 'A thousand acres of rainforest and seawall on the peninsula north of downtown.', opened: 1888, actions: ['visit', 'train'], minutes: 120 },
  { id: 'yyz-cn-tower', name: 'CN Tower', kind: 'viewpoint', cityId: 'ca-on-toronto', about: 'A concrete communications tower by the lake; the tallest freestanding structure in the world until 2007.', opened: 1976, actions: ['visit'], minutes: 90, admissionCalibration: 4_500 },
  { id: 'yul-mont-royal', name: 'Mount Royal Park', kind: 'viewpoint', cityId: 'ca-qc-montreal', about: 'Olmsted’s park on the mountain the city is named for, with the lookout over downtown.', opened: 1876, actions: ['visit'], minutes: 90 },
  { id: 'par-louvre', name: 'The Louvre', kind: 'museum', cityId: 'fr-idf-paris', about: 'A royal palace turned public museum, with Pei’s pyramid in the courtyard since 1989.', opened: 1793, actions: ['visit'], minutes: 240, admissionCalibration: 2_200 },
  { id: 'par-eiffel', name: 'The Eiffel Tower', kind: 'viewpoint', cityId: 'fr-idf-paris', about: 'Built for the 1889 Exposition Universelle and meant to be temporary.', opened: 1889, actions: ['visit'], minutes: 150, admissionCalibration: 2_900 },
  { id: 'rom-colosseum', name: 'The Colosseum', kind: 'landmark', cityId: 'it-laz-rome', about: 'The Flavian Amphitheatre, finished under Titus and used for spectacle for four centuries.', opened: 80, actions: ['visit'], minutes: 150, admissionCalibration: 1_800 },
  { id: 'rom-pantheon', name: 'The Pantheon', kind: 'landmark', cityId: 'it-laz-rome', about: 'Hadrian’s temple with the open oculus, in continuous use since antiquity.', opened: 126, actions: ['visit'], minutes: 60 },
  { id: 'ber-brandenburg', name: 'Brandenburg Gate', kind: 'landmark', cityId: 'de-be-berlin', about: 'Langhans’s gate at the end of Unter den Linden, and for twenty-eight years the wall ran past it.', opened: 1791, actions: ['visit'], minutes: 45 },
  { id: 'ber-museum-island', name: 'Museum Island', kind: 'museum', cityId: 'de-be-berlin', about: 'Five state museums on an island in the Spree.', opened: 1830, actions: ['visit'], minutes: 210, admissionCalibration: 1_900 },
  { id: 'prg-charles-bridge', name: 'Charles Bridge', kind: 'landmark', cityId: 'cz-52-prague', about: 'A stone bridge over the Vltava begun under Charles IV, lined with baroque statues.', opened: 1402, actions: ['visit'], minutes: 60 },
  { id: 'bud-parliament', name: 'The Hungarian Parliament Building', kind: 'landmark', cityId: 'hu-05-budapest', about: 'Steindl’s neo-Gothic parliament on the Pest bank of the Danube.', opened: 1902, actions: ['visit'], minutes: 90, admissionCalibration: 3_000 },
  { id: 'syd-opera-house', name: 'Sydney Opera House', kind: 'theatre', cityId: 'au-nsw-sydney', about: 'Jørn Utzon’s shells on Bennelong Point, finished long after he left the project.', opened: 1973, actions: ['watch', 'visit'], minutes: 150, admissionCalibration: 4_500 },
  { id: 'syd-bondi', name: 'Bondi Beach', kind: 'beach', cityId: 'au-nsw-sydney', about: 'A kilometer of sand in the eastern suburbs, with the coastal walk south to Coogee.', actions: ['visit', 'train'], minutes: 120 },
  { id: 'mel-ngv', name: 'National Gallery Of Victoria', kind: 'museum', cityId: 'au-vic-melbourne', about: 'Australia’s oldest public art museum, on St Kilda Road.', opened: 1861, actions: ['visit'], minutes: 150 },
  { id: 'wlg-te-papa', name: 'Te Papa Tongarewa', kind: 'museum', cityId: 'nz-wgn-wellington', about: 'New Zealand’s national museum on the Wellington waterfront. Free to enter.', opened: 1998, actions: ['visit'], minutes: 180 },
  { id: 'dub-trinity', name: 'Trinity College Library', kind: 'museum', cityId: 'ie-lei-dublin', about: 'The Long Room, and the Book of Kells beneath it.', opened: 1732, actions: ['visit'], minutes: 90, admissionCalibration: 2_000 },
  { id: 'mum-gateway', name: 'Gateway Of India', kind: 'landmark', cityId: 'in-16-mumbai', about: 'A basalt arch on the Apollo Bunder waterfront, built to mark a royal visit.', opened: 1924, actions: ['visit'], minutes: 60 },
  { id: 'mum-marine-drive', name: 'Marine Drive', kind: 'viewpoint', cityId: 'in-16-mumbai', about: 'The promenade along Back Bay, lit at night in a curve people call the Queen’s Necklace.', opened: 1920, actions: ['visit'], minutes: 75 },
  { id: 'tok-shibuya', name: 'Shibuya Crossing', kind: 'landmark', cityId: 'jp-13-tokyo', about: 'The scramble outside Shibuya Station, where every direction crosses at once.', actions: ['visit'], minutes: 45 },
  { id: 'tok-senso-ji', name: 'Sensō-ji', kind: 'landmark', cityId: 'jp-13-tokyo', about: 'A Buddhist temple in Asakusa, the oldest in Tokyo, approached through the Kaminarimon.', opened: 645, actions: ['visit'], minutes: 90 },
  { id: 'seo-gyeongbokgung', name: 'Gyeongbokgung', kind: 'landmark', cityId: 'kr-11-seoul', about: 'The main palace of the Joseon dynasty, rebuilt after the Japanese occupation.', opened: 1395, actions: ['visit'], minutes: 120, admissionCalibration: 300 },
  { id: 'vegas-strip', name: 'The Las Vegas Strip', kind: 'landmark', cityId: 'us-nv-lasvegas', about: 'Four miles of Las Vegas Boulevard south of the city line, which is why the big resorts are not in Las Vegas at all.', actions: ['visit', 'drink'], minutes: 120 },
  { id: 'nola-french-quarter', name: 'The French Quarter', kind: 'landmark', cityId: 'us-la-neworleans', about: 'The Vieux Carré, the oldest neighborhood in the city, laid out in 1718.', opened: 1718, actions: ['visit', 'drink', 'eat'], minutes: 120 },
  { id: 'mia-south-beach', name: 'South Beach', kind: 'beach', cityId: 'us-fl-miami', about: 'The barrier-island end of Miami Beach, with the Art Deco district behind it.', actions: ['visit'], minutes: 120 },
  { id: 'nm-santa-fe-plaza', name: 'The Santa Fe Plaza', kind: 'landmark', cityId: 'us-nm-santafe', about: 'The Spanish colonial plaza at the end of the Camino Real, laid out when the city was founded.', opened: 1610, actions: ['visit'], minutes: 75 },
  { id: 'nm-georgia-okeeffe', name: 'Georgia O’Keeffe Museum', kind: 'museum', cityId: 'us-nm-santafe', about: 'A museum on Johnson Street holding the largest collection of O’Keeffe’s work anywhere.', opened: 1997, actions: ['visit'], minutes: 120, admissionCalibration: 2_000 },
];

// ---------------------------------------------------------------------------
// The ones SLATE makes
// ---------------------------------------------------------------------------

/** A cuisine, and the dishes people actually cook in it. */
export interface Cuisine {
  id: string;
  name: string;
  dishes: { name: string; price: 1 | 2 | 3 | 4; nourishment: number }[];
}

/**
 * What a place serving this food calls itself. A trattoria serves Italian; a
 * cantina does not serve Korean. Names are built from these so the sign over
 * the door matches the kitchen behind it.
 */
const VENUE_WORDS: Readonly<Record<string, string[]>> = {
  italian: ['Trattoria', 'Osteria', 'Ristorante', 'Enoteca', 'Pizzeria'],
  japanese: ['Izakaya', 'Sushi', 'Ramen', 'Noodle Bar', 'Omakase'],
  mexican: ['Taqueria', 'Cantina', 'Cocina', 'Mezcaleria'],
  french: ['Bistro', 'Brasserie', 'Café', 'Bar À Vin'],
  chinese: ['Kitchen', 'Dim Sum', 'Noodle House', 'Dining Room'],
  indian: ['Kitchen', 'Dhaba', 'Curry House', 'Tiffin Room'],
  greek: ['Taverna', 'Grill', 'Meze Bar', 'Kouzina'],
  levantine: ['Mezze Bar', 'Grill', 'Kitchen', 'Bakery'],
  american: ['Grill', 'Chophouse', 'Diner', 'Supper Club', 'Tavern'],
  korean: ['BBQ', 'Kitchen', 'Pocha', 'Table'],
  thai: ['Kitchen', 'Noodle Bar', 'Canteen', 'House'],
  spanish: ['Tapas Bar', 'Bodega', 'Asador', 'Taberna'],
  vietnamese: ['Phở House', 'Kitchen', 'Canteen', 'Café'],
  ethiopian: ['Kitchen', 'House', 'Café'],
  peruvian: ['Cevicheria', 'Cocina', 'Kitchen', 'Bar'],
};

export const CUISINES: readonly Cuisine[] = [
  { id: 'italian', name: 'Italian', dishes: [
    { name: 'Cacio E Pepe', price: 2, nourishment: 34 }, { name: 'Bucatini All’Amatriciana', price: 2, nourishment: 36 },
    { name: 'Osso Buco', price: 4, nourishment: 44 }, { name: 'Margherita Pizza', price: 2, nourishment: 32 },
    { name: 'Vitello Tonnato', price: 3, nourishment: 26 }, { name: 'Risotto Alla Milanese', price: 3, nourishment: 33 },
    { name: 'Tiramisu', price: 2, nourishment: 14 }, { name: 'Burrata And Peaches', price: 3, nourishment: 18 } ] },
  { id: 'japanese', name: 'Japanese', dishes: [
    { name: 'Omakase, Chef’s Choice', price: 4, nourishment: 40 }, { name: 'Tonkotsu Ramen', price: 2, nourishment: 38 },
    { name: 'Chirashi Bowl', price: 3, nourishment: 34 }, { name: 'Katsu Curry', price: 2, nourishment: 40 },
    { name: 'Agedashi Tofu', price: 1, nourishment: 16 }, { name: 'Yakitori, Five Skewers', price: 2, nourishment: 26 },
    { name: 'Okonomiyaki', price: 2, nourishment: 34 }, { name: 'Zaru Soba', price: 1, nourishment: 26 } ] },
  { id: 'mexican', name: 'Mexican', dishes: [
    { name: 'Al Pastor Tacos', price: 1, nourishment: 30 }, { name: 'Mole Poblano', price: 3, nourishment: 42 },
    { name: 'Chiles En Nogada', price: 3, nourishment: 36 }, { name: 'Birria Quesadilla', price: 2, nourishment: 38 },
    { name: 'Ceviche Tostada', price: 2, nourishment: 22 }, { name: 'Elote', price: 1, nourishment: 14 },
    { name: 'Cochinita Pibil', price: 2, nourishment: 40 }, { name: 'Sopa De Lima', price: 1, nourishment: 24 } ] },
  { id: 'french', name: 'French', dishes: [
    { name: 'Steak Frites', price: 3, nourishment: 42 }, { name: 'Coq Au Vin', price: 3, nourishment: 40 },
    { name: 'Sole Meunière', price: 4, nourishment: 32 }, { name: 'Soupe À L’Oignon', price: 2, nourishment: 24 },
    { name: 'Tarte Tatin', price: 2, nourishment: 16 }, { name: 'Croque Monsieur', price: 1, nourishment: 28 },
    { name: 'Blanquette De Veau', price: 3, nourishment: 42 }, { name: 'Île Flottante', price: 2, nourishment: 14 } ] },
  { id: 'chinese', name: 'Chinese', dishes: [
    { name: 'Xiaolongbao', price: 2, nourishment: 28 }, { name: 'Mapo Tofu', price: 2, nourishment: 32 },
    { name: 'Peking Duck', price: 4, nourishment: 46 }, { name: 'Dan Dan Noodles', price: 1, nourishment: 30 },
    { name: 'Salt And Pepper Squid', price: 2, nourishment: 24 }, { name: 'Hainanese Chicken Rice', price: 2, nourishment: 36 },
    { name: 'Char Siu', price: 2, nourishment: 34 } ] },
  { id: 'indian', name: 'Indian', dishes: [
    { name: 'Dal Makhani', price: 2, nourishment: 34 }, { name: 'Rogan Josh', price: 3, nourishment: 42 },
    { name: 'Masala Dosa', price: 1, nourishment: 30 }, { name: 'Butter Chicken', price: 2, nourishment: 40 },
    { name: 'Paneer Tikka', price: 2, nourishment: 26 }, { name: 'Chettinad Pepper Chicken', price: 2, nourishment: 38 },
    { name: 'Baingan Bharta', price: 1, nourishment: 28 } ] },
  { id: 'greek', name: 'Greek', dishes: [
    { name: 'Lamb Kleftiko', price: 3, nourishment: 44 }, { name: 'Grilled Octopus', price: 3, nourishment: 26 },
    { name: 'Horiatiki Salad', price: 1, nourishment: 18 }, { name: 'Moussaka', price: 2, nourishment: 40 },
    { name: 'Saganaki', price: 1, nourishment: 20 }, { name: 'Gigantes Plaki', price: 1, nourishment: 24 },
    { name: 'Galaktoboureko', price: 1, nourishment: 14 } ] },
  { id: 'levantine', name: 'Levantine', dishes: [
    { name: 'Mezze, The Whole Table', price: 3, nourishment: 38 }, { name: 'Lamb Shawarma', price: 1, nourishment: 34 },
    { name: 'Muhammara', price: 1, nourishment: 16 }, { name: 'Fattoush', price: 1, nourishment: 18 },
    { name: 'Musakhan', price: 2, nourishment: 36 }, { name: 'Kibbeh Nayyeh', price: 2, nourishment: 28 },
    { name: 'Knafeh', price: 1, nourishment: 16 } ] },
  { id: 'american', name: 'American', dishes: [
    { name: 'Dry-Aged Ribeye', price: 4, nourishment: 48 }, { name: 'Fried Chicken And Biscuits', price: 2, nourishment: 44 },
    { name: 'Cheeseburger, Medium Rare', price: 1, nourishment: 38 }, { name: 'Cobb Salad', price: 2, nourishment: 24 },
    { name: 'Key Lime Pie', price: 1, nourishment: 14 }, { name: 'Gumbo', price: 2, nourishment: 38 },
    { name: 'Clam Chowder', price: 2, nourishment: 30 } ] },
  { id: 'korean', name: 'Korean', dishes: [
    { name: 'Galbi, Cooked At The Table', price: 3, nourishment: 44 }, { name: 'Bibimbap', price: 2, nourishment: 36 },
    { name: 'Sundubu Jjigae', price: 2, nourishment: 32 }, { name: 'Japchae', price: 2, nourishment: 28 },
    { name: 'Bossam', price: 3, nourishment: 42 }, { name: 'Kimchi Jjigae', price: 1, nourishment: 32 },
    { name: 'Hotteok', price: 1, nourishment: 16 } ] },
  { id: 'thai', name: 'Thai', dishes: [
    { name: 'Khao Soi', price: 2, nourishment: 36 }, { name: 'Som Tam', price: 1, nourishment: 18 },
    { name: 'Massaman Curry', price: 2, nourishment: 40 }, { name: 'Pad Kee Mao', price: 2, nourishment: 34 },
    { name: 'Tom Kha Gai', price: 2, nourishment: 26 }, { name: 'Larb Moo', price: 1, nourishment: 28 },
    { name: 'Mango Sticky Rice', price: 1, nourishment: 18 } ] },
  { id: 'spanish', name: 'Spanish', dishes: [
    { name: 'Tortilla Española', price: 1, nourishment: 26 }, { name: 'Gambas Al Ajillo', price: 2, nourishment: 22 },
    { name: 'Paella Valenciana', price: 3, nourishment: 42 }, { name: 'Jamón And Pan Con Tomate', price: 2, nourishment: 20 },
    { name: 'Pulpo A La Gallega', price: 3, nourishment: 28 }, { name: 'Croquetas', price: 1, nourishment: 22 },
    { name: 'Crema Catalana', price: 1, nourishment: 14 } ] },
  { id: 'vietnamese', name: 'Vietnamese', dishes: [
    { name: 'Phở Bò', price: 1, nourishment: 34 }, { name: 'Bánh Mì', price: 1, nourishment: 28 },
    { name: 'Bún Chả', price: 2, nourishment: 34 }, { name: 'Gỏi Cuốn', price: 1, nourishment: 16 },
    { name: 'Cá Kho Tộ', price: 2, nourishment: 36 }, { name: 'Bún Bò Huế', price: 2, nourishment: 36 },
    { name: 'Cà Phê Sữa Đá', price: 1, nourishment: 6 } ] },
  { id: 'ethiopian', name: 'Ethiopian', dishes: [
    { name: 'Doro Wat With Injera', price: 2, nourishment: 40 }, { name: 'Shiro', price: 1, nourishment: 30 },
    { name: 'Kitfo', price: 3, nourishment: 38 }, { name: 'Tibs', price: 2, nourishment: 36 },
    { name: 'Gomen', price: 1, nourishment: 20 }, { name: 'Beyaynetu', price: 2, nourishment: 38 } ] },
  { id: 'peruvian', name: 'Peruvian', dishes: [
    { name: 'Ceviche Clásico', price: 3, nourishment: 26 }, { name: 'Lomo Saltado', price: 2, nourishment: 42 },
    { name: 'Causa Limeña', price: 2, nourishment: 24 }, { name: 'Anticuchos', price: 2, nourishment: 28 },
    { name: 'Ají De Gallina', price: 2, nourishment: 38 }, { name: 'Papa A La Huancaína', price: 1, nourishment: 22 },
    { name: 'Suspiro Limeño', price: 1, nourishment: 16 } ] },
];

export const CUISINE_BY_ID: Readonly<Record<string, Cuisine>> = Object.fromEntries(CUISINES.map((c) => [c.id, c]));

/** Drinks, for the bars and cafés. */
export const CAFE_ITEMS: readonly { name: string; price: 1 | 2 | 3 | 4; nourishment: number }[] = [
  { name: 'Flat White', price: 1, nourishment: 4 }, { name: 'Cortado', price: 1, nourishment: 4 },
  { name: 'Filter Coffee And A Pastry', price: 1, nourishment: 16 }, { name: 'Matcha Latte', price: 1, nourishment: 6 },
  { name: 'Breakfast Sandwich', price: 1, nourishment: 26 }, { name: 'Avocado On Toast', price: 2, nourishment: 22 },
];

export const BAR_ITEMS: readonly { name: string; price: 1 | 2 | 3 | 4; nourishment: number }[] = [
  { name: 'A Glass Of Red', price: 2, nourishment: 4 }, { name: 'An Old Fashioned', price: 2, nourishment: 3 },
  { name: 'A Negroni', price: 2, nourishment: 3 }, { name: 'A Pint', price: 1, nourishment: 6 },
  { name: 'A Martini, Very Cold', price: 3, nourishment: 2 }, { name: 'Soda And Lime', price: 1, nourishment: 1 },
];

export const FAST_ITEMS: readonly { name: string; price: 1 | 2 | 3 | 4; nourishment: number }[] = [
  { name: 'Double Cheeseburger', price: 1, nourishment: 36 }, { name: 'Chicken Sandwich', price: 1, nourishment: 32 },
  { name: 'Loaded Fries', price: 1, nourishment: 26 }, { name: 'Breakfast Burrito', price: 1, nourishment: 34 },
  { name: 'A Slice, Folded', price: 1, nourishment: 24 },
];

// --- Name banks ------------------------------------------------------------

const RESTAURANT_FIRST = ['Aster', 'Bellwether', 'Carbon', 'Delphine', 'Ember', 'Fathom', 'Gild', 'Harrow', 'Iron', 'Juniper', 'Kestrel', 'Lantern', 'Marrow', 'Nightjar', 'Orchard', 'Palomar', 'Quarry', 'Roost', 'Salt', 'Tallow', 'Umber', 'Verdant', 'Wharf', 'Yarrow', 'Ash', 'Brine', 'Clove', 'Drift', 'Elm', 'Foundry'];
/**
 * Words that say nothing about the kitchen, for when the sign is just a name.
 * Anything that names a cuisine — trattoria, taqueria, izakaya — lives with
 * that cuisine instead, so a Korean kitchen is never called a trattoria.
 */
const RESTAURANT_SECOND = ['& Rye', 'House', 'Room', 'Table', 'Kitchen', 'Social', 'Provisions', 'Larder', 'Supper Club', 'Canteen', 'Counter', 'Dining Room', 'Yard', 'Club'];
const CAFE_NAMES = ['Morning Glory', 'The Third Cup', 'Paper Boat Coffee', 'Sparrow & Sons', 'Little Wren', 'Dust & Grind', 'Fig Tree Coffee', 'The Slow Pour', 'Ridgeline Roasters', 'Blue Hour Coffee'];
const BAR_NAMES = ['The Long Odds', 'Cutter’s', 'The Quiet Car', 'Room 12', 'The Blue Line', 'Hardwick’s', 'The Anchor & Key', 'Nightingale’s', 'The Back Room', 'The Standing Room'];
const GYM_NAMES = ['Ironworks Strength', 'The Basement Gym', 'Northside Athletic', 'Fulcrum Fitness', 'The Yard', 'Pier Six Boxing'];
const MARKET_NAMES = ['The Corner Market', 'Halyard Grocers', 'Green Row Provisions', 'The Daily Shop', 'Wharf Street Market'];
const GARAGE_NAMES = ['Bell & Sons Motors', 'The Service Bay', 'Kerridge Automotive', 'Tenth Street Garage'];
const FUEL_NAMES = ['Compass Fuel', 'Roadline Petrol', 'The Filling Station', 'Meridian Fuel', 'Junction Services'];
const CINEMA_NAMES = ['The Rialto', 'Odeon Row Cinema', 'The Palace Picture House', 'Star & Garter Cinema', 'The Lumen'];
const HOTEL_NAMES = ['The Wren Hotel', 'Hotel Meridian', 'The Standing Stone', 'The Kestrel', 'Harbourside Hotel', 'The Sennet'];
const SALON_NAMES = ['Chair Six', 'The Grooming Room', 'Marlow & Co.', 'The Cutting Room'];
const CLUB_NAMES = ['Basement 9', 'The Meridian Room', 'Nightshift', 'Vault'];
/**
 * Independent benches. There is no national chain of bench jewelers, so
 * unlike the shops these are SLATE's own the way its restaurants are: a
 * workshop above a shop, one or two people, a torch and a bench peg.
 */
const COSTUMIER_NAMES = [
  'The Cutting Room', 'Thread & Bone', 'Pilcher & Vane', 'The Wardrobe Department',
  'Mallory Costume Works', 'The Toile Room', 'Sabine & Ash',
];

const JEWELLER_NAMES = ['The Bench', 'Ansell & Pike', 'Halliwell Goldsmiths', 'The Setting Room', 'Verrall & Daughter', 'Ironmonger Row Goldsmiths'];

// ---------------------------------------------------------------------------
// Generating a city's places
// ---------------------------------------------------------------------------

interface Spec { kind: PlaceKind; count: (industry: number, population: number, waterfront: boolean) => number; }

const SPECS: readonly Spec[] = [
  { kind: 'restaurant', count: (i, p) => Math.min(12, 4 + Math.round(i / 20) + Math.round(Math.log10(Math.max(1, p)))) },
  { kind: 'cafe', count: () => 3 },
  { kind: 'bar', count: (i) => (i > 50 ? 3 : 2) },
  { kind: 'fast_food', count: () => 2 },
  { kind: 'market', count: () => 2 },
  { kind: 'gas_station', count: () => 3 },
  { kind: 'garage', count: () => 1 },
  { kind: 'gym', count: () => 2 },
  { kind: 'cinema', count: () => 2 },
  { kind: 'hotel', count: (i) => (i > 50 ? 3 : 2) },
  { kind: 'salon', count: () => 1 },
  { kind: 'club', count: (i) => (i > 60 ? 2 : 1) },
  // Last, so adding it moved nothing that was already there: the same city
  // still has the same places with the same ids. The three car lots came
  // first; the bike shop, the boat yard and the aircraft broker were added
  // after them, so the first three ids still mean what they meant.
  { kind: 'dealership', count: () => 6 },
  // A storage yard everywhere; a marina only where there is water. Added after
  // the lots, so nothing before them moved.
  { kind: 'storage', count: () => 1 },
  { kind: 'marina', count: (_i, _p, waterfront) => (waterfront ? 1 : 0) },
  // A bench jeweler, added after everything else so no existing place id moved.
  { kind: 'jeweller', count: () => 1 },
  { kind: 'costumier', count: () => 1 },
];

/** City tags that put it on water a boat can be kept in. */
const WATERFRONT_TAGS = ['beach', 'coastal', 'harbour', 'island', 'riviera'];

export function isWaterfront(city: { tags: string[] }): boolean {
  return city.tags.some((t) => WATERFRONT_TAGS.includes(t));
}

const MARINA_NAMES = ['Harbor Point Marina', 'Westbank Yacht Harbor', 'The Basin Marina', 'Breakwater Marina', 'Kingfisher Yacht Basin'];
const STORAGE_NAMES = ['Lockbox Vehicle Storage', 'Northline Secure Storage', 'The Vault Garage', 'Keystone Car Storage'];

/** What a lot sells. */
export type LotSells = 'car' | 'motorcycle' | 'boat' | 'jet';

/**
 * Six lots to a city, by what they sell: the new-car mall, the used lot and
 * the classic dealer; then the motorcycle dealer, the boat yard and the
 * aircraft broker. Named by position so a listing can find its lot.
 */
const DEALERSHIP_NAMES: readonly ((city: string) => string)[] = [
  (city) => `${city} Auto Mall`,
  () => 'Crossroads Auto Sales',
  () => 'Meridian Classic Motors',
  () => 'Northline Motorcycles',
  (city) => `${city} Yacht And Boat Sales`,
  (city) => `${city} Jet Center`,
];

const DEALERSHIP_SELLS: readonly LotSells[] = ['car', 'car', 'car', 'motorcycle', 'boat', 'jet'];

const DEALERSHIP_ABOUT: readonly ((where: string) => string)[] = [
  (where) => `New and certified cars in ${where}, every make under one roof. Somebody will find you within a minute of parking.`,
  (where) => `A used lot in ${where}. Prices on the windscreen, and every one of them is a starting point.`,
  (where) => `Classics and collector cars in ${where}. They know what they have, and they will wait for the right buyer.`,
  (where) => `Motorcycles in ${where}, new and used, from the makes you have heard of. Helmets on the wall and a workshop out the back.`,
  (where) => `Boats and yachts in ${where}, on trailers, on hard standing and in the water. Ask for a sea trial.`,
  (where) => `Aircraft sales at the executive terminal near ${where}. Pre-owned jets on the ramp, factory orders by appointment, and a demonstration flight for anyone serious.`,
];

const ACTIONS_BY_KIND: Readonly<Record<PlaceKind, PlaceAction[]>> = {
  restaurant: ['eat', 'meet'], cafe: ['eat', 'drink', 'meet'], bar: ['drink', 'meet'], fast_food: ['eat'],
  market: ['shop'], gas_station: ['refuel', 'shop'], garage: ['service'], hotel: ['sleep', 'shower', 'eat', 'meet'],
  gym: ['train', 'shower'], salon: ['shower'], cinema: ['watch'], theatre: ['watch'], club: ['drink', 'meet'],
  park: ['visit', 'train'], beach: ['visit'], viewpoint: ['visit'], museum: ['visit'], landmark: ['visit'],
  stadium: ['visit'], studio_gate: ['meet'], airport: ['meet'], shop: ['shop'], dealership: ['browse'],
  marina: ['visit'], storage: ['visit'], jeweller: ['browse'], costumier: ['browse'],
  rental_house: ['browse'],
};

function nameFor(kind: PlaceKind, rng: Rng, cuisine?: Cuisine): string {
  switch (kind) {
    case 'restaurant': {
      const first = rng.pick(RESTAURANT_FIRST);
      const words = cuisine ? VENUE_WORDS[cuisine.id] ?? RESTAURANT_SECOND : RESTAURANT_SECOND;
      // Half the time the sign is the kitchen's own word for itself; the rest
      // of the time it is a name and a general one, which is also how it goes.
      const second = rng.chance(0.55) ? rng.pick(words) : rng.pick(RESTAURANT_SECOND);
      return `${first} ${second}`;
    }
    case 'cafe': return rng.pick(CAFE_NAMES);
    case 'bar': return rng.pick(BAR_NAMES);
    case 'fast_food': return rng.pick(['Quick Six', 'The Drive-Thru On Fifth', 'Corner Burger', 'Late Plate']);
    case 'market': return rng.pick(MARKET_NAMES);
    case 'gas_station': return rng.pick(FUEL_NAMES);
    case 'garage': return rng.pick(GARAGE_NAMES);
    case 'marina': return rng.pick(MARINA_NAMES);
    case 'storage': return rng.pick(STORAGE_NAMES);
    case 'gym': return rng.pick(GYM_NAMES);
    case 'cinema': return rng.pick(CINEMA_NAMES);
    case 'hotel': return rng.pick(HOTEL_NAMES);
    case 'salon': return rng.pick(SALON_NAMES);
    case 'club': return rng.pick(CLUB_NAMES);
    case 'jeweller': return rng.pick(JEWELLER_NAMES);
    case 'costumier': return rng.pick(COSTUMIER_NAMES);
    default: return 'A Place';
  }
}

const MINUTES_BY_KIND: Readonly<Record<PlaceKind, number>> = {
  restaurant: 95, cafe: 35, bar: 75, fast_food: 25, market: 30, gas_station: 10, garage: 120,
  hotel: 30, gym: 75, salon: 60, cinema: 140, theatre: 160, club: 150, park: 60, beach: 90,
  viewpoint: 60, museum: 150, landmark: 60, stadium: 180, studio_gate: 20, airport: 45, shop: 35, dealership: 90,
  marina: 60, storage: 20, jeweller: 45, costumier: 70, rental_house: 55,
};

/**
 * Every place in a city, the real ones first.
 *
 * Deterministic from the city id, so the same city always has the same
 * places in the same order and nothing has to be stored in the save.
 */
export function placesIn(cityId: string): Place[] {
  const city = CITIES.get(cityId);
  if (!city) return [];
  const out: Place[] = LANDMARKS.filter((l) => l.cityId === cityId).map((l) => ({
    ...l,
    real: true,
    quality: l.quality ?? 82,
    price: l.price ?? 2,
    minutes: l.minutes ?? MINUTES_BY_KIND[l.kind],
    actions: l.actions.length > 0 ? l.actions : ACTIONS_BY_KIND[l.kind],
  }));

  // The real gyms: a chain's presence here is public record, the rest of the
  // profile is calibration and says so.
  for (const gym of REAL_GYMS) {
    if (gym.cityId !== cityId) continue;
    out.push({
      ...gym,
      real: true,
      quality: gym.quality ?? 78,
      minutes: MINUTES_BY_KIND.gym,
      actions: gym.actions ?? ACTIONS_BY_KIND.gym,
    });
  }

  // The rental houses: the real ones where the house really works, and one or
  // two of SLATE's own everywhere else that shoots anything at all.
  for (const house of RENTAL_HOUSES) {
    if (house.cityId !== cityId) continue;
    out.push({
      ...house,
      real: true,
      quality: house.quality ?? 88,
      minutes: MINUTES_BY_KIND.rental_house,
      actions: house.actions ?? ACTIONS_BY_KIND.rental_house,
    });
  }
  if (!RENTAL_HOUSES.some((h) => h.cityId === cityId)) {
    for (const house of ownHousesIn(cityId, city.name, city.industryPresence, city.population)) {
      out.push({
        ...house,
        real: false,
        quality: house.quality ?? 60,
        minutes: MINUTES_BY_KIND.rental_house,
        actions: ACTIONS_BY_KIND.rental_house,
      });
    }
  }

  const rng = makeRng(`places:${cityId}`);
  const hoods = NEIGHBOURHOODS.childrenOf(cityId);
  const industry = city.industryPresence;
  const used = new Set(out.map((p) => p.name.toLowerCase()));

  const waterfront = isWaterfront(city);
  const realMarinas = out.filter((p) => p.kind === 'marina').length;
  for (const spec of SPECS) {
    // A city with a real marina on the record does not get an invented one as well.
    const wanted = spec.kind === 'marina' && realMarinas > 0 ? 0 : spec.count(industry, city.population, waterfront);
    const count = spec.kind === 'marina' ? wanted : Math.max(1, wanted);
    for (let i = 0; i < count; i++) {
      const cuisine = spec.kind === 'restaurant' ? rng.pick(CUISINES) : undefined;
      let name = spec.kind === 'dealership' ? (DEALERSHIP_NAMES[i % DEALERSHIP_NAMES.length] ?? DEALERSHIP_NAMES[0]!)(city.name) : nameFor(spec.kind, rng, cuisine);
      if (spec.kind === 'marina' && rng.chance(0.5)) name = `${city.name} ${rng.pick(['Yacht Harbor', 'Marina', 'Yacht Basin'])}`;
      let guard = 0;
      while (used.has(name.toLowerCase()) && guard++ < 12) name = `${nameFor(spec.kind, rng, cuisine)}${guard > 6 ? ` ${['On Fifth', 'Uptown', 'By The Water', 'On The Hill'][guard % 4]}` : ''}`;
      used.add(name.toLowerCase());
      const hood = hoods.length > 0 ? rng.pick(hoods) : undefined;
      const prestige = hood?.prestige ?? 50;
      const price = (spec.kind === 'fast_food' ? 1
        : spec.kind === 'restaurant' ? Math.max(1, Math.min(4, Math.round(1 + prestige / 33 + rng.float(-0.4, 0.6))))
          : Math.max(1, Math.min(4, Math.round(1 + prestige / 45)))) as 1 | 2 | 3 | 4;
      out.push({
        id: `${cityId}:${spec.kind}:${i}`,
        name,
        kind: spec.kind,
        cityId,
        neighbourhoodId: hood?.id,
        about: spec.kind === 'dealership' ? (DEALERSHIP_ABOUT[i % DEALERSHIP_ABOUT.length] ?? DEALERSHIP_ABOUT[0]!)(hood?.name ?? city.name) : aboutFor(spec.kind, cuisine, hood?.name ?? city.name, rng),
        real: false,
        quality: Math.round(Math.min(98, 40 + prestige * 0.4 + rng.float(0, 26))),
        price,
        minutes: MINUTES_BY_KIND[spec.kind],
        actions: ACTIONS_BY_KIND[spec.kind],
        industryHaunt: industry > 60 && (spec.kind === 'bar' || spec.kind === 'restaurant') && rng.chance(0.3),
        sells: spec.kind === 'dealership' ? DEALERSHIP_SELLS[i % DEALERSHIP_SELLS.length] : undefined,
        maxSlipFeet: spec.kind === 'marina' ? rng.pick([45, 65, 80, 100]) : undefined,
        cuisineId: cuisine?.id,
      } as Place & { cuisineId?: string });
    }
  }

  // Storefronts. Every chain that is not online only has a door here, so the
  // catalog and the street agree with each other. The id carries the chain
  // rather than a number, so adding a chain never moves an existing shop.
  for (const retailer of shoppableRetailers()) {
    const real = ALL_RETAILERS.find((r) => r.id === retailer.id);
    if (!real || real.kind === 'online') continue;
    // A house that hires and does not sell has a counter rather than a shop,
    // and it is already on the street as one.
    if (HOUSES_NOT_SHOPS.has(retailer.id)) continue;
    if (!tradesIn(real, cityId, city.population)) continue;
    const hood = hoods.length > 0 ? hoods[Math.abs(hashOf(`${cityId}:${retailer.id}`)) % hoods.length] : undefined;
    out.push({
      id: `${cityId}:shop:${retailer.id}`,
      name: retailer.name,
      kind: retailer.type === 'grocery' ? 'market' : 'shop',
      cityId,
      neighbourhoodId: hood?.id,
      about: `${retailer.description} ${SHOP_STREET[retailer.tier - 1] ?? SHOP_STREET[2]!}`,
      real: false,
      quality: Math.round(Math.min(98, 44 + retailer.tier * 10)),
      price: Math.max(1, Math.min(4, Math.round(retailer.tier * 0.8))) as 1 | 2 | 3 | 4,
      minutes: MINUTES_BY_KIND.shop,
      actions: ['shop'],
      retailerId: retailer.id,
    });
  }
  return out;
}

/** A line about the street the shop is on, by how dear it is. */
const SHOP_STREET: readonly string[] = [
  'A retail park unit with its own car park.',
  'On the high street, between a bank and a phone shop.',
  'A corner site with two windows onto the street.',
  'A dressed window on the good street, and a doorman who is not called one.',
  'By appointment as much as by the door, on the street where the rents are announced.',
];

/** A small, stable hash so a shop lands in the same neighborhood every time. */
function hashOf(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (Math.imul(h, 31) + text.charCodeAt(i)) | 0;
  return h;
}

function aboutFor(kind: PlaceKind, cuisine: Cuisine | undefined, where: string, rng: Rng): string {
  switch (kind) {
    case 'restaurant': return `${cuisine?.name ?? 'Modern'} cooking in ${where}. ${rng.pick([
      'Booths at the back and a bar you can eat at.',
      'Open kitchen, and a wait unless you called.',
      'Twelve tables and a chef who does the ordering.',
      'Loud, bright, and full every night.',
      'Paper menus that change on a Tuesday.',
      'The kind of room where the second bottle happens.',
      'Family-run, and the family is usually in.',
      'Tiled, tiny, and worth the queue.',
      'White tablecloths and a wine list with opinions.',
      'A counter, ten stools and no reservations.',
      'Somewhere you take people you want to impress.',
      'Somewhere you go alone with a book.',
      'Half the room is regulars and they all know each other.',
      'The lighting is unkind and nobody cares.',
      'Two rooms: one for eating, one for being seen.',
      'Cash preferred, and the sign has said so for years.',
    ])}`;
    case 'cafe': return `Coffee in ${where}. ${rng.pick([
      'People work here all day on one flat white.',
      'A counter, four stools and the good machine.',
      'The pastries go by ten.',
      'A queue out the door and it moves fast.',
      'Somewhere to take a meeting that is not a meeting.',
      'Wi-fi, a plug at every table, and a two-hour limit nobody enforces.',
    ])}`;
    case 'bar': return `A bar in ${where}. ${rng.pick([
      'Dark, and nobody looks up when you come in.',
      'The kind of place deals get done in the corner booth.',
      'Good ice, bad lighting, fair prices.',
      'A jukebox nobody has updated since it was funny.',
      'Two deep at the bar by nine.',
      'Quiet enough to hear what the other person is saying.',
      'A back room you can book if you know to ask.',
      'The bartender remembers what you drink.',
    ])}`;
    case 'fast_food': return `Counter service in ${where}. Fast, cheap, and exactly what it says.`;
    case 'market': return `Groceries in ${where}. Everything a kitchen needs and a queue at six.`;
    case 'gas_station': return `Fuel and a shop in ${where}. Open when you need it.`;
    case 'garage': return `A workshop in ${where}. Servicing, diagnostics and an honest estimate.`;
    case 'marina': return `A marina in ${where}. Slips by the foot, a fuel dock, and a harbourmaster who knows every boat by its owner.`;
    case 'storage': return `Secure indoor vehicle storage in ${where}. Alarmed, dry, and charged by the month.`;
    case 'gym': return `Weights and space in ${where}. ${rng.pick(['Chalk allowed.', 'Open at five.', 'No mirrors, no music.'])}`;
    case 'cinema': return `A cinema in ${where}. ${rng.pick(['Two screens and a projectionist who cares.', 'Reclining seats and an eight-dollar soda.', 'Repertory on Sundays.'])}`;
    case 'hotel': return `Rooms in ${where}. ${rng.pick(['A lobby people meet in.', 'Quiet, and the bar stays open.', 'Clean, central and no surprises.'])}`;
    case 'salon': return `Cutting and color in ${where}.`;
    case 'club': return `Late in ${where}. ${rng.pick(['A queue after eleven.', 'Low ceilings and a good sound system.'])}`;
    case 'jeweller': return `A working bench in ${where}. ${rng.pick([
      'One goldsmith, a torch, and a wait for everything.',
      'Repairs in the window, commissions in the back.',
      'Two benches, a rolling mill, and a kettle that is always on.',
      'They will make you what you draw, and tell you why it will not work.',
      'A safe, a loupe, and forty years of somebody else’s wedding rings.',
    ])}`;
    case 'costumier': return `A workroom in ${where}. ${rng.pick([
      'Toiles on the wall, a cutting table, and three fittings before anything is finished.',
      'Bolts to the ceiling, one industrial machine, and a kettle nobody turns off.',
      'They cut for stage and screen, and they will cut for you.',
      'Dress forms in every size, a steamer going, and pins everywhere.',
      'A pattern library going back forty years, and somebody who knows where everything is.',
    ])}`;
    default: return `In ${where}.`;
  }
}

/** The cuisine on a generated restaurant, when it has one. */
export function cuisineOf(place: Place): Cuisine | undefined {
  const id = (place as Place & { cuisineId?: string }).cuisineId;
  return id ? CUISINE_BY_ID[id] : undefined;
}

/** What one item costs here, in cents, with the city's cost of living on it. */
export function priceOf(place: Place, item: { price: 1 | 2 | 3 | 4 }): Money {
  const base = [0, 1_400, 3_200, 6_800, 14_000][item.price] ?? 3_200;
  const tier = 0.8 + place.price * 0.18;
  return Math.round(base * tier * costOfLiving(place.cityId));
}

/** The menu at a place, whatever kind of menu it has. */
export function menuOf(place: Place): { name: string; price: 1 | 2 | 3 | 4; nourishment: number }[] {
  switch (place.kind) {
    case 'restaurant': return [...(cuisineOf(place)?.dishes ?? [])];
    case 'cafe': return [...CAFE_ITEMS];
    case 'bar': return [...BAR_ITEMS];
    case 'fast_food': return [...FAST_ITEMS];
    case 'hotel': return [...CAFE_ITEMS.slice(0, 3), ...FAST_ITEMS.slice(0, 2)];
    case 'market': return [];
    default: return [];
  }
}

export function placeById(cityId: string, placeId: string): Place | undefined {
  return placesIn(cityId).find((p) => p.id === placeId);
}

/** Every real landmark SLATE knows, for the world map and the tests. */
export const REAL_PLACES = LANDMARKS;

export function landmarksIn(cityId: string): Place[] {
  return placesIn(cityId).filter((p) => p.real);
}

/** Cities that have at least one real landmark on the record. */
export const CITIES_WITH_LANDMARKS = [...new Set(LANDMARKS.map((l) => l.cityId))];

/** The note every generated place carries where the player can see it. */
export const INVENTED_NOTE = 'One of SLATE’s own places, not a real business.';
export const REAL_NOTE = 'A real place. Only what is on the public record is stated here.';

void cityTimeZone;
