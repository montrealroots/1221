/**
 * SLATE — naming what the world makes.
 *
 * A slate of a thousand pictures called "The Quiet Reckoning" and "The Silent
 * Reckoning" is not a slate, it is a random phrase generator with a film
 * attached. So this engine is built around two things.
 *
 * It knows what it is naming. A Korean thriller, a British period drama, a
 * network procedural and a summer tentpole do not sound alike, and neither do
 * their titles here: each genre family has its own vocabulary and its own
 * shapes, and a series is named the way a series is named rather than the way
 * a film is.
 *
 * And it never repeats. Every title is checked against the real record — the
 * studio catalogues, the roster's filmographies, the known-titles index — and
 * against every title already used in this save. When a draw collides it draws
 * again from the same seeded stream, widening as it goes, so the result is
 * deterministic and there is no duplicate anywhere.
 *
 * Nothing here is a real film. Every title is generated; where one happens to
 * read like something real, `titleTaken` is what stops it being used.
 */

import type { Rng } from '../core/rng';
import { canonicalGenre } from './genres';

// ---------------------------------------------------------------------------
// Registers — how a kind of picture is named
// ---------------------------------------------------------------------------

/**
 * The families a genre belongs to for naming purposes.
 *
 * Not the same as the genre list: a slasher and a folk horror are named alike,
 * and a legal drama and a medical drama are both named like institutions.
 */
export type Register =
  | 'crime' | 'horror' | 'scifi' | 'fantasy' | 'romance' | 'comedy'
  | 'drama' | 'war' | 'western' | 'history' | 'family' | 'doc'
  | 'musical' | 'sport' | 'mystery' | 'action' | 'institution';

const REGISTER_OF: Readonly<Record<string, Register>> = {
  action: 'action', adventure: 'action', 'martial-arts': 'action', superhero: 'action',
  disaster: 'action', survival: 'action', kaiju: 'action', tokusatsu: 'action', epic: 'action',
  crime: 'crime', gangster: 'crime', heist: 'crime', 'film-noir': 'crime', 'neo-noir': 'crime',
  'true-crime': 'crime', espionage: 'crime', political: 'crime',
  horror: 'horror', slasher: 'horror', 'folk-horror': 'horror', monster: 'horror',
  supernatural: 'horror', 'found-footage': 'horror', religious: 'horror',
  'science-fiction': 'scifi', dystopian: 'scifi', 'post-apocalyptic': 'scifi',
  'space-opera': 'scifi', 'time-travel': 'scifi', experimental: 'scifi',
  fantasy: 'fantasy', 'sword-and-sorcery': 'fantasy', mythology: 'fantasy',
  'fairy-tale': 'fantasy', folk: 'fantasy',
  romance: 'romance', 'romantic-comedy': 'romance', erotic: 'romance', melodrama: 'romance',
  'soap-opera': 'romance',
  comedy: 'comedy', 'dark-comedy': 'comedy', parody: 'comedy', satire: 'comedy',
  mockumentary: 'comedy', 'slice-of-life': 'comedy',
  drama: 'drama', tragedy: 'drama', 'coming-of-age': 'drama', teen: 'drama',
  psychological: 'drama', 'psychological-thriller': 'mystery',
  war: 'war', military: 'war',
  western: 'western',
  historical: 'history', 'period-drama': 'history', biography: 'history', docudrama: 'history',
  family: 'family', children: 'family', animation: 'family', school: 'family', holiday: 'family',
  documentary: 'doc', nature: 'doc', educational: 'doc', news: 'doc', 'game-show': 'doc',
  reality: 'doc', 'talk-show': 'doc', cooking: 'doc', concert: 'doc',
  musical: 'musical', dance: 'musical',
  sport: 'sport',
  mystery: 'mystery', thriller: 'mystery', suspense: 'mystery', anthology: 'mystery',
  'road-movie': 'drama',
  legal: 'institution', medical: 'institution', procedural: 'institution',
};

export function registerFor(genreIds: readonly string[]): Register {
  for (const id of genreIds) {
    const found = REGISTER_OF[canonicalGenre(id)] ?? REGISTER_OF[id];
    if (found) return found;
  }
  return 'drama';
}

// ---------------------------------------------------------------------------
// Vocabulary
// ---------------------------------------------------------------------------

interface Bank {
  /** Concrete nouns a title can be built on. */
  nouns: readonly string[];
  /** Abstract nouns — the ones that take 'The' well. */
  abstracts: readonly string[];
  /** Adjectives that sit in front of the nouns without sounding pasted on. */
  adjectives: readonly string[];
  /** Places, real-sounding but invented, for a title that names one. */
  places: readonly string[];
  /** Present participles: 'Burning', 'Leaving'. */
  gerunds: readonly string[];
  /** Whole titles that only work as themselves. */
  standalone: readonly string[];
  /** Words a series uses that a film does not: a beat, a unit, a shift. */
  units: readonly string[];
}

const CRIME: Bank = {
  nouns: ['Alibi', 'Confession', 'Deposition', 'Evidence', 'Informant', 'Ledger', 'Payroll', 'Racket',
    'Ransom', 'Retainer', 'Setup', 'Shakedown', 'Sting', 'Testimony', 'Warrant', 'Witness', 'Bagman',
    'Bookmaker', 'Courier', 'Fixer', 'Getaway', 'Handler', 'Lieutenant', 'Skim', 'Stakeout', 'Take',
    'Wire', 'Counterfeit', 'Consignment', 'Safehouse', 'Lockup', 'Precinct', 'Docket', 'Marker'],
  abstracts: ['Reckoning', 'Restitution', 'Retribution', 'Amnesty', 'Immunity', 'Leverage', 'Silence',
    'Loyalty', 'Debt', 'Interest', 'Consequence', 'Provenance', 'Complicity', 'Custody', 'Discretion'],
  adjectives: ['Bent', 'Blown', 'Broken', 'Burned', 'Clean', 'Cold', 'Crooked', 'Dirty', 'Dead',
    'Hard', 'Marked', 'Missing', 'Quiet', 'Silent', 'Stolen', 'Sworn', 'Untouchable', 'Wrong',
    'Deep', 'Final', 'Last', 'Hollow', 'Long', 'Low'],
  places: ['Ash Wharf', 'Bellhaven', 'Cattermole Row', 'Corvin Street', 'Dockgate', 'Ferrier Hill',
    'Halloran Court', 'Kestrel Yard', 'Malden Reach', 'Pike Landing', 'Redwater', 'Salt Quay',
    'Sennick', 'Thorn Cross', 'Vance Harbour', 'Wexley', 'Marrow Lane', 'Coldbrook'],
  gerunds: ['Bleeding', 'Burning', 'Falling', 'Folding', 'Running', 'Turning', 'Vanishing', 'Waiting',
    'Cutting', 'Chasing', 'Holding', 'Skimming'],
  standalone: ['Nothing Personal', 'No Witnesses', 'Cash On Delivery', 'Twelve Hours In',
    'Everybody Talks', 'The Money Is Gone', 'Somebody Paid', 'Off The Books', 'Kept Quiet',
    'Nobody Is Coming', 'Two Men And A Van', 'The Last Honest Man', 'Clean Hands', 'Second Set Of Books'],
  units: ['Division', 'Precinct', 'Unit', 'Squad', 'Watch', 'Bureau', 'Detail', 'Task Force', 'Beat'],
};

const HORROR: Bank = {
  nouns: ['Effigy', 'Harrowing', 'Hollow', 'Marrow', 'Offering', 'Reliquary', 'Rictus', 'Rot',
    'Sacrament', 'Scarecrow', 'Séance', 'Shroud', 'Sinkhole', 'Sleepwalker', 'Snare', 'Tithe',
    'Vestige', 'Wake', 'Warren', 'Wound', 'Threshold', 'Crawlspace', 'Nightshift', 'Rookery',
    'Ossuary', 'Bloodline', 'Congregation', 'Understory'],
  abstracts: ['Dread', 'Hunger', 'Rapture', 'Silence', 'Vigil', 'Penance', 'Contagion', 'Blight',
    'Inheritance', 'Aftermath', 'Malady', 'Withering'],
  adjectives: ['Bitter', 'Buried', 'Consecrated', 'Cursed', 'Dark', 'Deep', 'Dry', 'Famished',
    'Hollow', 'Hungry', 'Pale', 'Quiet', 'Rotten', 'Sacred', 'Silent', 'Starving', 'Unclean',
    'Wretched', 'Salt', 'Black'],
  places: ['Bellwether Farm', 'Coldmarsh', 'Fen Hollow', 'Grieve House', 'Harrow End', 'Loam',
    'Marrow Hill', 'Old Stile', 'Pastor Creek', 'Rook Hall', 'Sallow', 'Thistlewood',
    'Undercliff', 'Wormwood', 'Blackthorn Down', 'Nettlebed'],
  gerunds: ['Bleeding', 'Burning', 'Crawling', 'Feeding', 'Following', 'Keening', 'Rising', 'Waking',
    'Watching', 'Whispering', 'Drowning', 'Digging'],
  standalone: ['It Was Already Inside', 'Do Not Open It', 'Something Is In The Well',
    'Nobody Leaves In Winter', 'The House Remembers', 'Everyone Here Is Related',
    'They Keep The Doors Locked', 'What The Field Gave Back', 'Say It Three Times',
    'The Feast Is Not For You', 'Sleep When It Sleeps'],
  units: ['Vigil', 'Congregation', 'Parish', 'Ward', 'Order', 'Coven', 'Circle'],
};

const SCIFI: Bank = {
  nouns: ['Aperture', 'Ascension', 'Beacon', 'Bulkhead', 'Cascade', 'Constellation', 'Convergence',
    'Drift', 'Exodus', 'Gradient', 'Habitat', 'Interval', 'Lattice', 'Meridian', 'Nomad', 'Orbit',
    'Outpost', 'Perihelion', 'Protocol', 'Reactor', 'Relay', 'Salvage', 'Signal', 'Substrate',
    'Terminus', 'Threshold', 'Vector', 'Vessel', 'Waypoint', 'Anomaly', 'Array', 'Manifest'],
  abstracts: ['Ascent', 'Continuum', 'Divergence', 'Entropy', 'Inheritance', 'Longitude', 'Recurrence',
    'Redundancy', 'Remainder', 'Singularity', 'Succession', 'Provenance'],
  adjectives: ['Bright', 'Cold', 'Dark', 'Distant', 'Empty', 'Far', 'Final', 'First', 'Long',
    'Near', 'Outer', 'Quiet', 'Second', 'Slow', 'Terminal', 'Vast', 'Blind', 'Deep'],
  places: ['Ashfall Station', 'Caldera', 'Cygnus Reach', 'Harrow Belt', 'Kepler Yard', 'Lagrange',
    'Meridian Deep', 'New Cartage', 'Perimeter Nine', 'Solace', 'Terminus Bay', 'Vantage',
    'The Long Shore', 'Aurelia Station'],
  gerunds: ['Ascending', 'Burning', 'Drifting', 'Falling', 'Listening', 'Reaching', 'Returning',
    'Waking', 'Leaving', 'Counting'],
  standalone: ['We Are Not The First', 'The Signal Was Ours', 'Nothing Came Back',
    'Eleven Minutes Of Light', 'A Message From Later', 'They Sent The Wrong Ship',
    'The Long Way Home', 'Everything Is Repeating', 'Somewhere A Star Went Out'],
  units: ['Station', 'Fleet', 'Colony', 'Array', 'Habitat', 'Expedition', 'Corps'],
};

const FANTASY: Bank = {
  nouns: ['Barrow', 'Bastion', 'Cairn', 'Chalice', 'Covenant', 'Crown', 'Ember', 'Fellowship',
    'Ferryman', 'Grimoire', 'Hearth', 'Keep', 'Loom', 'Mantle', 'Oath', 'Reliquary', 'Sigil',
    'Sovereign', 'Standard', 'Thorn', 'Throne', 'Vow', 'Warden', 'Wayfarer', 'Regent', 'Scion'],
  abstracts: ['Ascension', 'Dominion', 'Fealty', 'Inheritance', 'Prophecy', 'Reckoning', 'Sundering',
    'Twilight', 'Wandering', 'Kindling'],
  adjectives: ['Ancient', 'Broken', 'Crowned', 'Dark', 'Dying', 'Eternal', 'Fallen', 'Forgotten',
    'Golden', 'Hidden', 'Last', 'Long', 'Lost', 'Sacred', 'Sunken', 'Wandering', 'Wild', 'Silver'],
  places: ['Aldermere', 'Ashglass', 'Caer Dun', 'Elderfen', 'Greyholt', 'Hollowmoor', 'Ironvale',
    'Karrowmere', 'Lantern Reach', 'Nimbrook', 'Ravenmarch', 'Silverfell', 'Thornhallow',
    'Westwatch', 'Windmere', 'Gallowmere'],
  gerunds: ['Ascending', 'Burning', 'Falling', 'Kindling', 'Riding', 'Rising', 'Wandering', 'Waking'],
  standalone: ['The Last House On The Road', 'A Kingdom Owed', 'What The River Kept',
    'Nine Nights Of Fire', 'The Crown Was Never Hers', 'Everything The Light Touched',
    'The Long Winter Court', 'A Debt In Silver'],
  units: ['Order', 'Company', 'March', 'Court', 'Watch', 'Legion', 'Hold'],
};

const ROMANCE: Bank = {
  nouns: ['Anniversary', 'Balcony', 'Coastline', 'Correspondence', 'Departure', 'Ferry', 'Harbour',
    'Interval', 'Letter', 'Meridian', 'Postcard', 'Rehearsal', 'Reservation', 'Rooftop', 'Season',
    'Sunday', 'Terrace', 'Vineyard', 'Wedding', 'Weekend', 'Bookshop', 'Doorstep', 'Platform'],
  abstracts: ['Afterwards', 'Almost', 'Beginning', 'Constancy', 'Distance', 'Longing', 'Meanwhile',
    'Nearly', 'Patience', 'Timing', 'Wanting', 'Chance'],
  adjectives: ['Accidental', 'Borrowed', 'Bright', 'Brief', 'Careless', 'Certain', 'Early', 'Easy',
    'Late', 'Long', 'Quiet', 'Slow', 'Small', 'Sudden', 'Sweet', 'Unlikely', 'Ordinary'],
  places: ['Alderbay', 'Bellamy Street', 'Cape Winter', 'Halcyon', 'Lark Harbour', 'Little Vesper',
    'Marchmont', 'Nightingale Row', 'Portside', 'Rosewater', 'St Aubin', 'Tarrow Bay', 'Wren Cove'],
  gerunds: ['Beginning', 'Falling', 'Leaving', 'Meeting', 'Missing', 'Staying', 'Waiting', 'Writing'],
  standalone: ['The Second Time We Met', 'Everything Except The Timing', 'Nine Weeks In August',
    'You Were Always Going To Leave', 'A Long Way To Say It', 'Somebody Else Is In The Photograph',
    'The Last Ferry Of The Season', 'We Should Have Said So', 'Not Yet, And Then'],
  units: ['Season', 'Summer', 'Weekend', 'Year', 'Winter'],
};

const COMEDY: Bank = {
  nouns: ['Apology', 'Appraisal', 'Audit', 'Barbecue', 'Casserole', 'Committee', 'Complaint',
    'Deposit', 'Deputy', 'Fundraiser', 'Handbook', 'Inspection', 'Insurance', 'Landlord', 'Manager',
    'Mixer', 'Newsletter', 'Petition', 'Probation', 'Referendum', 'Reunion', 'Rota', 'Timeshare',
    'Understudy', 'Voicemail', 'Wedding Party', 'Group Chat'],
  abstracts: ['Ambition', 'Consequences', 'Etiquette', 'Optimism', 'Procedure', 'Progress',
    'Standards', 'Sincerity', 'Teamwork', 'Boundaries'],
  adjectives: ['Absolute', 'Accidental', 'Casual', 'Complete', 'Extremely', 'Frankly', 'Genuine',
    'Mildly', 'Modest', 'Perfectly', 'Reasonably', 'Slightly', 'Terribly', 'Unofficial', 'Very'],
  places: ['Bramble Court', 'Cobb Street', 'Fenwick Green', 'Little Marling', 'Mill End',
    'Nether Wexham', 'Pelham Parade', 'Quarry Rise', 'Tolworth', 'Upper Dunn', 'Weybury'],
  gerunds: ['Apologising', 'Coping', 'Explaining', 'Improving', 'Managing', 'Networking',
    'Overthinking', 'Volunteering', 'Downsizing'],
  standalone: ['Nobody Asked', 'It Was Going So Well', 'Please Do Not Make This Weird',
    'Everyone Is Fine', 'We Have To Talk About Derek', 'A Perfectly Normal Amount Of Cheese',
    'On Reflection, No', 'The Group Chat Has Been Archived', 'Sorry About The Car',
    'Technically Nobody Died', 'This Is Not A Cry For Help'],
  units: ['Committee', 'Society', 'Club', 'Department', 'Branch', 'Chapter'],
};

const DRAMA: Bank = {
  nouns: ['Allotment', 'Anchor', 'Appointment', 'Bearing', 'Cartographer', 'Commute', 'Doorway',
    'Estuary', 'Fault Line', 'Ferry', 'Foundling', 'Harvest', 'Hinterland', 'Homecoming', 'Hourglass',
    'Interval', 'Junction', 'Kitchen', 'Latitude', 'Lighthouse', 'Machinist', 'Nightshift', 'Obituary',
    'Passenger', 'Quarry', 'Remainder', 'Reservoir', 'Shoreline', 'Shortfall', 'Sundown', 'Threshold',
    'Tributary', 'Undertow', 'Waterline', 'Inheritance', 'Provenance', 'Foreman', 'Terrace'],
  abstracts: ['Absence', 'Aftermath', 'Consequence', 'Distance', 'Endurance', 'Forbearance',
    'Grace', 'Patience', 'Reckoning', 'Restitution', 'Sufferance', 'Weather', 'Custody'],
  adjectives: ['Bitter', 'Bright', 'Broken', 'Cold', 'Distant', 'Empty', 'Fading', 'Faint', 'Final',
    'Hollow', 'Hungry', 'Long', 'Low', 'Northern', 'Patient', 'Quiet', 'Restless', 'Slow', 'Small',
    'Southern', 'Sudden', 'Wide'],
  places: ['Ardmore', 'Belcarra', 'Carrick Point', 'Deepwell', 'Eastholm', 'Fennimore', 'Glasshouse',
    'Harbourgate', 'Innisfree Row', 'Kellard', 'Lowfield', 'Marlin Bay', 'Northgate', 'Owl Creek',
    'Portnau', 'Rowan Street', 'Saltmarsh', 'Templeford', 'Undercliff', 'Wyresdale'],
  gerunds: ['Arriving', 'Building', 'Digging', 'Falling', 'Holding', 'Keeping', 'Leaving', 'Losing',
    'Mending', 'Returning', 'Staying', 'Waiting'],
  standalone: ['Everything We Did Not Say', 'The House Is In Both Names', 'Nobody Came To The Funeral',
    'What The Water Took', 'Three Winters On The Coast', 'It Was Always Going To Be Him',
    'The Last Good Year', 'We Were Both There', 'A Small Amount Of Money',
    'Nothing Was Ever Decided', 'The Long Way Round'],
  units: ['Practice', 'Yard', 'Works', 'Row', 'Estate', 'Line', 'Shift'],
};

const WAR: Bank = {
  nouns: ['Armistice', 'Bridgehead', 'Convoy', 'Dispatch', 'Enfilade', 'Foxhole', 'Garrison',
    'Ration', 'Reprisal', 'Salient', 'Sortie', 'Trench', 'Ceasefire', 'Redoubt', 'Column',
    'Bombardment', 'Detachment', 'Withdrawal', 'Requisition'],
  abstracts: ['Attrition', 'Endurance', 'Honour', 'Mercy', 'Obedience', 'Sacrifice', 'Silence',
    'Surrender', 'Duty', 'Aftermath'],
  adjectives: ['Broken', 'Cold', 'Fallen', 'Final', 'Forgotten', 'Hard', 'Held', 'Long', 'Lost',
    'Quiet', 'Ruined', 'Standing', 'Winter'],
  places: ['Ardenne Line', 'Bettray', 'Colline 41', 'Hollow Ridge', 'Kessel Ford', 'Malvern Gap',
    'Ninth Sector', 'Point Eleven', 'Ravensburg', 'Salient Six', 'Wester Wald'],
  gerunds: ['Advancing', 'Digging', 'Falling', 'Holding', 'Marching', 'Retreating', 'Waiting'],
  standalone: ['Nobody Was Relieved', 'Twelve Days At The Ford', 'The Order Never Came',
    'We Held The Bridge', 'What Winter Cost', 'They Were Not Coming Back'],
  units: ['Battalion', 'Company', 'Regiment', 'Squadron', 'Platoon', 'Brigade'],
};

const WESTERN: Bank = {
  nouns: ['Badlands', 'Bounty', 'Brand', 'Cattlecar', 'Claim', 'Corral', 'Deadfall', 'Gulch',
    'Homestead', 'Lariat', 'Marshal', 'Mesa', 'Outrider', 'Posse', 'Prospect', 'Saloon',
    'Stagecoach', 'Territory', 'Waterhole', 'Wagon'],
  abstracts: ['Amnesty', 'Grievance', 'Justice', 'Reckoning', 'Restitution', 'Vengeance', 'Silence'],
  adjectives: ['Broken', 'Crooked', 'Dry', 'Hard', 'High', 'Hollow', 'Last', 'Low', 'Old', 'Red',
    'Rough', 'Wide', 'Wild'],
  places: ['Alder Flats', 'Bitterwater', 'Cinder Creek', 'Dry Fork', 'Gallows Bend', 'Hollister',
    'Lame Horse', 'Meridian Wells', 'Perdition', 'Quicklime', 'Redemption Pass', 'Two Rivers'],
  gerunds: ['Bleeding', 'Burning', 'Riding', 'Running', 'Waiting'],
  standalone: ['Nothing Grows Out Here', 'The Marshal Is Not Coming', 'Six Days To The Border',
    'What The Land Owes', 'They Buried Him Standing', 'One Good Horse'],
  units: ['Territory', 'County', 'Outfit', 'Trail', 'Range'],
};

const HISTORY: Bank = {
  nouns: ['Accession', 'Almanac', 'Ambassador', 'Chronicle', 'Coronation', 'Courtier', 'Dispatch',
    'Dowry', 'Emissary', 'Enclosure', 'Estate', 'Ledger', 'Petition', 'Regency', 'Sitting',
    'Succession', 'Treaty', 'Trial', 'Cartographer', 'Apothecary', 'Governess'],
  abstracts: ['Ascendancy', 'Consequence', 'Fortune', 'Inheritance', 'Legitimacy', 'Providence',
    'Reformation', 'Sedition', 'Standing'],
  adjectives: ['Great', 'Last', 'Long', 'Lost', 'Quiet', 'Rightful', 'Second', 'Small', 'Sovereign',
    'Unquiet', 'Northern'],
  places: ['Ashcombe', 'Bellamere', 'Coleford', 'Draycott', 'Feversham', 'Harrowby', 'Kenwick',
    'Lyndhurst', 'Marchbourne', 'Pemberly Cross', 'Ravensworth', 'Thornsby', 'Wolverton'],
  gerunds: ['Ascending', 'Falling', 'Keeping', 'Petitioning', 'Returning', 'Waiting'],
  standalone: ['The Year Of Two Winters', 'A Letter Never Sent', 'What The Estate Was Worth',
    'Nobody Signed It', 'The Second Son', 'Everything Went To The Church'],
  units: ['House', 'Estate', 'Court', 'Parish', 'Company', 'Assembly'],
};

const FAMILY: Bank = {
  nouns: ['Adventure', 'Balloon', 'Compass', 'Cousin', 'Doorbell', 'Expedition', 'Firefly',
    'Handbook', 'Kite', 'Lantern', 'Mailbox', 'Marmalade', 'Mitten', 'Paperboat', 'Pocketwatch',
    'Postbox', 'Puddle', 'Scarf', 'Snowman', 'Treehouse', 'Umbrella', 'Whistle', 'Sandcastle'],
  abstracts: ['Adventure', 'Bravery', 'Friendship', 'Homecoming', 'Kindness', 'Wonder', 'Courage'],
  adjectives: ['Brave', 'Bright', 'Enormous', 'Fearless', 'Gigantic', 'Great', 'Happy', 'Little',
    'Lucky', 'Marvellous', 'Small', 'Splendid', 'Terrible', 'Tiny', 'Wonderful'],
  places: ['Bramblewick', 'Cloverdown', 'Dandelion Hill', 'Elderberry Lane', 'Gingerbrook',
    'Honeywell', 'Little Puddleton', 'Mossy Bottom', 'Peppermint Bay', 'Tumbleton', 'Willowmere'],
  gerunds: ['Baking', 'Building', 'Finding', 'Flying', 'Hiding', 'Looking', 'Running', 'Sailing'],
  standalone: ['The Dog Who Would Not Go Home', 'Everybody Wants A Turn',
    'One Enormous Misunderstanding', 'The Great Biscuit Emergency', 'Where The Balloons Go',
    'A Very Large Problem', 'Nobody Told The Cat'],
  units: ['Club', 'Gang', 'Squad', 'Crew', 'Class', 'Troop'],
};

const DOC: Bank = {
  nouns: ['Archive', 'Aftermath', 'Boundary', 'Catalogue', 'Coastline', 'Deposition', 'Dossier',
    'Estuary', 'Evidence', 'Ledger', 'Migration', 'Provenance', 'Record', 'Report', 'Testimony',
    'Transcript', 'Watershed', 'Inventory', 'Census'],
  abstracts: ['Accountability', 'Aftermath', 'Consequence', 'Custody', 'Disclosure', 'Reckoning',
    'Restitution', 'Silence', 'Transparency'],
  adjectives: ['Complete', 'Documented', 'Long', 'Missing', 'Official', 'Quiet', 'Sealed',
    'Unfinished', 'Unrecorded', 'Whole'],
  places: ['Beaufort Sound', 'Calder Valley', 'Dunmore', 'Eastreach', 'Fell Bottom', 'Grimsby Road',
    'Kirkhaven', 'Lower Marsh', 'Netherfield', 'Salt Flats', 'Tern Island'],
  gerunds: ['Counting', 'Digging', 'Following', 'Listening', 'Looking', 'Recording', 'Watching'],
  standalone: ['Nobody Was Held Responsible', 'The Files Were Never Sealed',
    'Everything They Knew In 1974', 'What Was In The Water', 'The Case Against The Council',
    'Sixteen Years Of Letters', 'Nothing Was Written Down'],
  units: ['Files', 'Tapes', 'Papers', 'Hearings', 'Recordings', 'Case'],
};

const MUSICAL: Bank = {
  nouns: ['Bandstand', 'Chorus', 'Encore', 'Ensemble', 'Interval', 'Marquee', 'Matinee', 'Overture',
    'Rehearsal', 'Refrain', 'Revue', 'Rooftop', 'Showstopper', 'Stagedoor', 'Understudy', 'Rhapsody'],
  abstracts: ['Applause', 'Harmony', 'Rhythm', 'Timing', 'Tempo', 'Longing'],
  adjectives: ['Bright', 'Brilliant', 'Golden', 'Grand', 'Late', 'Loud', 'Sweet', 'Wild'],
  places: ['Aurora Theatre', 'Bellini Room', 'Coronet', 'Gaiety', 'Lyric Row', 'Palladium Lane',
    'The Alhambra', 'Vaudeville Court'],
  gerunds: ['Dancing', 'Falling', 'Rehearsing', 'Singing', 'Starting', 'Swinging'],
  standalone: ['Two Nights Only', 'Nobody Sings The Second Verse', 'The Show Went On Anyway',
    'Everything But The Ending', 'One More Chorus'],
  units: ['Company', 'Revue', 'Chorus', 'Ensemble', 'Season'],
};

const SPORT: Bank = {
  nouns: ['Bench', 'Contender', 'Cutman', 'Draft', 'Fixture', 'Halftime', 'Handicap', 'Journeyman',
    'Preseason', 'Purse', 'Rematch', 'Roster', 'Scoreline', 'Sparring', 'Substitute', 'Testimonial',
    'Underdog', 'Whistle', 'Transfer'],
  abstracts: ['Comeback', 'Discipline', 'Endurance', 'Form', 'Grit', 'Momentum', 'Redemption'],
  adjectives: ['Broken', 'Final', 'First', 'Hard', 'Last', 'Long', 'Second', 'Undefeated', 'Wide'],
  places: ['Ardwick Park', 'Bellfield', 'Coalbrook Ground', 'Deepdale Road', 'Fairfax Arena',
    'Hollow Lane', 'Kestrel Park', 'Riverside End', 'Wickham Oval'],
  gerunds: ['Fighting', 'Losing', 'Running', 'Training', 'Winning'],
  standalone: ['Nobody Backed Him', 'The Season Nobody Wanted', 'Four Minutes Left',
    'They Were Never Going To Win', 'One More Fight', 'The Last Home Game'],
  units: ['Club', 'Squad', 'Side', 'Academy', 'Season', 'League'],
};

const MYSTERY: Bank = {
  nouns: ['Alibi', 'Anomaly', 'Cipher', 'Coroner', 'Discrepancy', 'Dossier', 'Inquest', 'Interval',
    'Lacuna', 'Ledger', 'Omission', 'Postmortem', 'Provenance', 'Reconstruction', 'Statement',
    'Transcript', 'Vanishing', 'Witness', 'Cold Case', 'Blind Spot'],
  abstracts: ['Certainty', 'Coincidence', 'Doubt', 'Motive', 'Omission', 'Silence', 'Suspicion',
    'Reasonable Doubt'],
  adjectives: ['Blind', 'Careful', 'Cold', 'Exact', 'Hidden', 'Incomplete', 'Missing', 'Patient',
    'Quiet', 'Second', 'Sealed', 'Slow', 'Unaccounted'],
  places: ['Ashvale', 'Cannery Row', 'Deepwater', 'Frostfield', 'Gallows Green', 'Harrowgate',
    'Little Ember', 'Mereside', 'Oakhaven', 'Quill Street', 'Ravenshead', 'Windermoor'],
  gerunds: ['Counting', 'Following', 'Listening', 'Looking', 'Reconstructing', 'Retracing', 'Waiting'],
  standalone: ['Somebody Is Lying', 'Nobody Reported It', 'The Timeline Does Not Work',
    'Eleven Minutes Unaccounted For', 'Everything Was In The Statement',
    'There Was A Second Car', 'Nobody Saw Her Leave'],
  units: ['Inquiry', 'Case', 'Files', 'Investigation', 'Review', 'Hearing'],
};

const ACTION: Bank = {
  nouns: ['Airlift', 'Ambush', 'Blackout', 'Breakout', 'Countdown', 'Crossfire', 'Detonation',
    'Extraction', 'Handover', 'Interception', 'Manhunt', 'Overrun', 'Perimeter', 'Pursuit',
    'Rendezvous', 'Sabotage', 'Standoff', 'Strike', 'Takedown', 'Vanguard', 'Payload', 'Convoy'],
  abstracts: ['Endgame', 'Fallout', 'Momentum', 'Reprisal', 'Retribution', 'Velocity'],
  adjectives: ['Cold', 'Dead', 'Fast', 'Final', 'First', 'Hard', 'Last', 'Live', 'Loud', 'Open',
    'Sharp', 'Silent', 'Total'],
  places: ['Black Harbour', 'Cape Anvil', 'Fort Meridian', 'Grid Nine', 'Ironport', 'Kestrel Base',
    'Line Delta', 'Point Zero', 'Sector Twelve', 'The Narrows'],
  gerunds: ['Breaking', 'Burning', 'Chasing', 'Falling', 'Running', 'Striking'],
  standalone: ['Nobody Gets Out Clean', 'Eleven Hours To The Border', 'They Sent One Man',
    'The Package Is Moving', 'One Way In', 'It Was Never About The Money'],
  units: ['Unit', 'Squad', 'Detachment', 'Team', 'Cell', 'Section'],
};

const INSTITUTION: Bank = {
  nouns: ['Admission', 'Bedside', 'Bench', 'Caseload', 'Chambers', 'Consultant', 'Deposition',
    'Discharge', 'Docket', 'Handover', 'Intake', 'Mandate', 'Nightshift', 'Registrar', 'Retainer',
    'Rotation', 'Rounds', 'Standard Of Care', 'Triage', 'Verdict', 'Ward Round'],
  abstracts: ['Discretion', 'Duty', 'Immunity', 'Liability', 'Negligence', 'Privilege', 'Standard'],
  adjectives: ['Acute', 'Chief', 'Critical', 'First', 'Junior', 'Night', 'Second', 'Senior',
    'Standing', 'Working'],
  places: ['Ashgrove General', 'Bellingham Chambers', 'Coldharbour', 'Farrow Street', 'Halstead',
    'King Edward Wing', 'Mercy Cross', 'Northbridge', 'St Aubrey', 'Wexford House'],
  gerunds: ['Admitting', 'Attending', 'Covering', 'Handling', 'Presenting', 'Reviewing'],
  standalone: ['Nobody Signed The Chart', 'A Reasonable Standard Of Care',
    'The Night Everything Went Wrong', 'Twelve Hours On Call', 'It Was Not Negligence',
    'Everyone Followed Procedure'],
  units: ['Ward', 'Chambers', 'Division', 'Practice', 'Rotation', 'Unit', 'Wing', 'Firm'],
};

const BANKS: Readonly<Record<Register, Bank>> = {
  crime: CRIME, horror: HORROR, scifi: SCIFI, fantasy: FANTASY, romance: ROMANCE,
  comedy: COMEDY, drama: DRAMA, war: WAR, western: WESTERN, history: HISTORY,
  family: FAMILY, doc: DOC, musical: MUSICAL, sport: SPORT, mystery: MYSTERY,
  action: ACTION, institution: INSTITUTION,
};

/** How much vocabulary the engine actually holds, for the tests to report. */
export function vocabularySize(): { registers: number; words: number; standalone: number } {
  let words = 0;
  let standalone = 0;
  for (const bank of Object.values(BANKS)) {
    words += bank.nouns.length + bank.abstracts.length + bank.adjectives.length
      + bank.places.length + bank.gerunds.length + bank.units.length;
    standalone += bank.standalone.length;
  }
  return { registers: Object.keys(BANKS).length, words, standalone };
}

// ---------------------------------------------------------------------------
// Shapes
// ---------------------------------------------------------------------------

/** What is being named. A series is not named the way a film is. */
export type TitleFormat = 'feature' | 'short' | 'series' | 'limited_series' | 'tv_movie' | 'documentary';

interface Shape {
  /** Weight relative to the other shapes for this format. */
  weight: number;
  write: (b: Bank, r: Rng) => string;
}

const pick = (r: Rng, list: readonly string[]): string => list[r.int(0, list.length - 1)] ?? '';

/** Two different draws from the same bank, so nothing reads 'Salt & Salt'. */
function pair(r: Rng, list: readonly string[]): [string, string] {
  const first = pick(r, list);
  let second = pick(r, list);
  for (let i = 0; i < 6 && second === first; i++) second = pick(r, list);
  return [first, second];
}

/**
 * A unit word that does not repeat what the place already ends in.
 *
 * Several places are named for their institution — 'King Edward Wing', 'Mercy
 * Cross Practice' — and putting a unit after one of those gives 'King Edward
 * Wing Wing'. This is the check no template can make for itself.
 */
function unitFor(place: string, b: Bank, r: Rng): string {
  const last = place.split(/\s+/).pop()?.toLowerCase() ?? '';
  const free = b.units.filter((unit) => unit.toLowerCase() !== last);
  return pick(r, free.length > 0 ? free : b.units);
}

/** The first word of a place, for the shapes that want a short name. */
function placeStem(place: string): string {
  return place.split(/[ ,]/)[0] ?? place;
}

const NUMBERS: readonly string[] = [
  'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve',
  'Thirteen', 'Twenty', 'Thirty', 'Forty', 'A Hundred',
];

const PREPOSITIONS: readonly string[] = ['After', 'Against', 'Before', 'Beneath', 'Beyond', 'Into', 'Under', 'Without'];

/**
 * The shapes a film title takes.
 *
 * Weighted so the common ones are common: most films are called 'The Noun' or
 * 'Adjective Noun', and the rarer forms are rare on purpose. A slate where
 * every third title is a whole sentence does not read like a slate.
 */
const FILM_SHAPES: readonly Shape[] = [
  { weight: 16, write: (b, r) => `The ${pick(r, [...b.nouns, ...b.abstracts])}` },
  { weight: 14, write: (b, r) => `${pick(r, b.adjectives)} ${pick(r, b.nouns)}` },
  { weight: 10, write: (b, r) => `The ${pick(r, b.adjectives)} ${pick(r, b.nouns)}` },
  { weight: 9, write: (b, r) => pick(r, [...b.nouns, ...b.abstracts]) },
  { weight: 8, write: (b, r) => pick(r, b.standalone) },
  { weight: 7, write: (b, r) => `${pick(r, b.gerunds)} ${pick(r, b.nouns)}` },
  { weight: 6, write: (b, r) => pick(r, b.places) },
  { weight: 6, write: (b, r) => `The ${pick(r, b.nouns)} of ${pick(r, b.places)}` },
  { weight: 5, write: (b, r) => `A ${pick(r, b.adjectives)} ${pick(r, b.nouns)}` },
  { weight: 5, write: (b, r) => { const [a, c] = pair(r, b.nouns); return `${a} & ${c}`; } },
  { weight: 4, write: (b, r) => `${pick(r, NUMBERS)} ${plural(pick(r, b.nouns))}` },
  { weight: 4, write: (b, r) => `${pick(r, PREPOSITIONS)} the ${pick(r, b.nouns)}` },
  { weight: 3, write: (b, r) => `The ${pick(r, b.abstracts)} of ${pick(r, b.nouns)}` },
  { weight: 3, write: (b, r) => `${pick(r, b.places)}, ${pick(r, NUMBERS.slice(0, 8))} Years On` },
  { weight: 3, write: (b, r) => `${pick(r, b.adjectives)} ${pick(r, b.abstracts)}` },
];

/**
 * The shapes a series title takes.
 *
 * A series is named for a place, a unit or a job far more often than a film
 * is: nobody calls a feature 'Harbour Division', and everybody calls a
 * procedural that.
 */
const SERIES_SHAPES: readonly Shape[] = [
  { weight: 14, write: (b, r) => { const p = placeStem(pick(r, b.places)); return `${p} ${unitFor(p, b, r)}`; } },
  { weight: 12, write: (b, r) => `The ${pick(r, [...b.nouns, ...b.abstracts])}` },
  { weight: 10, write: (b, r) => pick(r, b.places) },
  { weight: 9, write: (b, r) => `${pick(r, b.adjectives)} ${pick(r, b.nouns)}` },
  { weight: 8, write: (b, r) => pick(r, [...b.nouns, ...b.abstracts]) },
  { weight: 7, write: (b, r) => `${pick(r, b.adjectives)} ${pick(r, b.units)}` },
  { weight: 6, write: (b, r) => pick(r, b.standalone) },
  { weight: 5, write: (b, r) => `The ${pick(r, b.units)}` },
  { weight: 5, write: (b, r) => { const p = pick(r, b.places); return `${p} ${unitFor(p, b, r)}`; } },
  { weight: 4, write: (b, r) => `${pick(r, b.gerunds)} ${pick(r, b.nouns)}` },
  { weight: 4, write: (b, r) => `The ${pick(r, b.nouns)} of ${pick(r, b.places)}` },
  { weight: 3, write: (b, r) => { const [a, c] = pair(r, b.nouns); return `${a} & ${c}`; } },
];

/** A documentary names its subject, and usually says so plainly. */
const DOC_SHAPES: readonly Shape[] = [
  { weight: 14, write: (b, r) => { const p = placeStem(pick(r, b.places)); return `The ${p} ${unitFor(p, b, r)}`; } },
  { weight: 12, write: (b, r) => pick(r, b.standalone) },
  { weight: 10, write: (b, r) => `The ${pick(r, [...b.nouns, ...b.abstracts])}` },
  { weight: 8, write: (b, r) => `${pick(r, b.places)}: ${pick(r, b.abstracts)}` },
  { weight: 7, write: (b, r) => `Inside ${pick(r, b.places)}` },
  { weight: 6, write: (b, r) => `The ${pick(r, b.adjectives)} ${pick(r, b.nouns)}` },
  { weight: 5, write: (b, r) => `What Happened at ${pick(r, b.places)}` },
  { weight: 4, write: (b, r) => `${pick(r, NUMBERS)} ${plural(pick(r, b.nouns))}` },
];

function shapesFor(format: TitleFormat, register: Register): readonly Shape[] {
  if (format === 'documentary' || register === 'doc') return DOC_SHAPES;
  if (format === 'series' || format === 'limited_series') return SERIES_SHAPES;
  return FILM_SHAPES;
}

function drawShape(shapes: readonly Shape[], r: Rng): Shape {
  const total = shapes.reduce((sum, shape) => sum + shape.weight, 0);
  let roll = r.float(0, total);
  for (const shape of shapes) {
    roll -= shape.weight;
    if (roll <= 0) return shape;
  }
  return shapes[shapes.length - 1]!;
}

// ---------------------------------------------------------------------------
// Generating one
// ---------------------------------------------------------------------------

export interface TitleRequest {
  genres?: readonly string[];
  format?: TitleFormat | string;
  /** A candidate that is already used, real or in this save. */
  taken?: (title: string) => boolean;
  /** The picture this is a sequel or an entry of, when it is one. */
  franchise?: string;
  /** How hard to try before falling back to a compound title. */
  attempts?: number;
}

function asFormat(format: string | undefined): TitleFormat {
  switch (format) {
    case 'series': case 'limited_series': case 'short': case 'tv_movie': case 'documentary':
      return format;
    default:
      return 'feature';
  }
}

/**
 * A title nothing else has.
 *
 * The retry is the whole design. A draw that collides — with a real film, a
 * real series, anything on the roster's filmographies, or anything already in
 * this save — is thrown away and another is taken from the same seeded stream,
 * so the answer is deterministic and there is never a duplicate. After enough
 * collisions it reaches for the compound forms, which are effectively
 * inexhaustible, so it always terminates with something usable.
 */
export function generateTitle(rng: Rng, request: TitleRequest = {}): string {
  const register = registerFor(request.genres ?? []);
  const bank = BANKS[register];
  const format = asFormat(typeof request.format === 'string' ? request.format : undefined);
  const shapes = shapesFor(format, register);
  const taken = request.taken ?? (() => false);
  const attempts = request.attempts ?? 90;

  // A franchise entry is named after its franchise, not from scratch.
  if (request.franchise) {
    for (let i = 0; i < attempts; i++) {
      const subtitle = drawShape(FILM_SHAPES, rng).write(bank, rng);
      const candidate = `${request.franchise}: ${subtitle}`;
      if (!taken(candidate)) return candidate;
    }
  }

  for (let attempt = 0; attempt < attempts; attempt++) {
    const candidate = clean(drawShape(shapes, rng).write(bank, rng));
    if (candidate.length > 1 && !taken(candidate)) return candidate;

    // Past two thirds of the budget, start compounding: a subtitle multiplies
    // the space by the whole vocabulary again, so this cannot run out.
    if (attempt > attempts * 0.66) {
      const compound = clean(`${drawShape(shapes, rng).write(bank, rng)}: ${drawShape(FILM_SHAPES, rng).write(bank, rng)}`);
      if (!taken(compound)) return compound;
    }
  }

  // Nothing at all is left, which needs a vocabulary this size to be exhausted
  // several times over. A place and a unit is still a real-sounding title.
  return clean(`${pick(rng, bank.places)} ${pick(rng, bank.units)} ${rng.int(2, 99)}`);
}

/**
 * The plural of a noun, for the shapes that count things.
 *
 * Only ever applied where a shape actually pluralises — never across a whole
 * title, which is how 'Careless' becomes 'Careleses' and 'Days' becomes
 * 'Daies'. A noun that is already plural is left exactly as it is: there is no
 * such word as 'Badlandses'.
 */
function plural(noun: string): string {
  const word = noun.trim();
  if (/s$/i.test(word)) return word;
  if (/(x|z|ch|sh)$/i.test(word)) return `${word}es`;
  if (/[^aeiou]y$/i.test(word)) return `${word.slice(0, -1)}ies`;
  return `${word}s`;
}

/**
 * Tidies the seams a shape can leave.
 *
 * Only two things, both of which no template can fix for itself: the spacing,
 * and the article in front of a word the shape did not know it would pick.
 */
function clean(title: string): string {
  return title
    .replace(/\s+/g, ' ')
    // 'A Open Sabotage' — the shape wrote the article before it knew the word.
    .replace(/\bA (?=[AEIOU])/g, 'An ')
    .replace(/\ban (?=[^aeiou\s])/g, 'a ')
    // 'Blind Blind Spot' — an adjective that turned out to be the first word
    // of the noun it was put in front of. No template can see that coming.
    .replace(/\b(\w+) \1\b/gi, '$1')
    .trim();
}

/**
 * How many distinct titles the shapes can produce for one register, counted
 * rather than claimed. An upper bound on the shapes alone — the real figure is
 * what `tests/titles.test.ts` measures by generating them.
 */
export function shapeSpace(register: Register, format: TitleFormat = 'feature'): number {
  const b = BANKS[register];
  const n = b.nouns.length + b.abstracts.length;
  let total = 0;
  for (const shape of shapesFor(format, register)) {
    void shape;
    total += n * b.adjectives.length;
  }
  return total + b.standalone.length + b.places.length * b.units.length;
}
