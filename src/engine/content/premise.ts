/**
 * SLATE — What the world's own films are about.
 *
 * A production the world commissioned needs a plot, and "A US production" is
 * not one. This holds the raw material: for each genre, the kind of person it
 * happens to, the thing that happens, what they then want, who is in the way,
 * and what it costs to fail. Those are the five parts of a logline, so the
 * fragments go straight into the same grammar the player's own logline builder
 * uses (content/logline) and come out as a sentence.
 *
 * Two things keep it from feeling generated. Each slot is drawn from a
 * different one of the project's genres, so a crime-romance takes its
 * protagonist from one bank and its stakes from the other; and the banks are
 * written as specifics rather than placeholders, because "a body turns up on
 * her ward" is a premise and "something bad happens" is not.
 *
 * Everything here is invented for the simulation. None of it is a real film,
 * and nothing in it should ever be presented as one.
 */

import type { Rng } from '../core/rng';
import { composeLogline } from './logline';
import { canonicalGenre, genre } from './genres';

export interface PremiseBank {
  who: readonly string[];
  incident: readonly string[];
  goal: readonly string[];
  against: readonly string[];
  stakes: readonly string[];
  world?: readonly string[];
}

/** The banks used when a genre has none of its own, keyed by genre category. */
const CATEGORY_BANKS: Readonly<Record<string, PremiseBank>> = {
  narrative: {
    who: ['a hospital porter', 'a retired teacher', 'a single father', 'a translator', 'a night cleaner', 'a country solicitor'],
    incident: ['a letter arrives twenty years late', 'his brother comes home', 'the factory closes', 'a stranger says they are family', 'the diagnosis comes back', 'the house is sold out from under them'],
    goal: ['say the thing they never said', 'keep the family in one place', 'get the money together by spring', 'find out what really happened', 'hold the job for one more year', 'bring her home'],
    against: ['a father who will not admit it', 'the bank', 'a sister who wants it sold', 'the town they grew up in', 'his own pride', 'a system that has no room for them'],
    stakes: ['they lose the last of it', 'the family stops speaking for good', 'the children are split up', 'the words go unsaid for good', 'the house goes', 'they end up exactly like him'],
    world: ['in a mill town in its last year', 'over one winter', 'in a village of four hundred people', 'across three funerals'],
  },
  comedy: {
    who: ['a wedding planner', 'a substitute teacher', 'a failing food critic', 'a middle child', 'an unemployed magician', 'a very literal accountant'],
    incident: ['he is mistaken for the groom', 'she inherits a hotel with no rooms', 'the wrong body arrives', 'his ex moves in next door', 'the family reunion is booked at his flat', 'a video of it goes everywhere'],
    goal: ['get through the weekend', 'put on the show anyway', 'keep the lie going one more day', 'win the bet', 'get everyone home before the parents land', 'undo it before Monday'],
    against: ['a mother with a plan', 'the neighbour who films everything', 'a rival with better hair', 'the health inspector', 'his own best friend', 'a groom who will not be talked out of it'],
    stakes: ['everyone finds out at once', 'the wedding collapses', 'he loses the flat and the friend', 'the family stops speaking', 'the restaurant closes for good', 'it is a story told at every christmas after'],
  },
  speculative: {
    who: ['a station engineer', 'a courier on the last route', 'a survey pilot', 'a lab assistant', 'a colony doctor', 'a salvage diver'],
    incident: ['the signal repeats itself', 'the ship comes back with nobody on it', 'the machine answers a question nobody asked', 'the sky changes colour', 'the ice gives up something old', 'the company shuts the corridor'],
    goal: ['get everyone off before it closes', 'find out what came back with them', 'switch it off', 'reach the last transmitter', 'keep the colony breathing until spring'],
    against: ['a company that owns the air', 'the thing wearing a familiar face', 'a captain who will not turn back', 'the countdown', 'her own copy'],
    stakes: ['the way home is lost with the last of them', 'it gets out', 'the colony freezes', 'the last record of them is lost', 'the year takes all of them'],
    world: ['on a station nobody has visited in nine years', 'in the last habitable valley', 'aboard a ship six months from anywhere'],
  },
  factual: {
    who: ['a local reporter', 'a retired inspector', 'an archivist', 'a former employee', 'the only surviving witness'],
    incident: ['a box of files is released', 'a second body is identified', 'the company denies it happened', 'a recording surfaces', 'the site is scheduled for demolition'],
    goal: ['get it on the record before the deadline', 'find the family and tell them', 'prove the timeline is wrong', 'get one person to say it on camera'],
    against: ['a firm of lawyers', 'a department that has lost the paperwork', 'everybody who was there', 'the clock on the inquiry'],
    stakes: ['it is buried for good', 'the family are told by a stranger', 'the site goes and the evidence with it', 'the record closes with the wrong name on it'],
  },
  unscripted: {
    who: ['a first-time contestant', 'a returning champion', 'a home cook', 'a village team', 'a self-taught builder'],
    incident: ['the format changes overnight', 'the favourite drops out', 'a judge walks off', 'the prize is doubled'],
    goal: ['make it to the final week', 'beat the house record', 'get the family business out of debt'],
    against: ['a champion who has done it twice', 'a producer with a story in mind', 'the clock', 'their own nerve'],
    stakes: ['they go home with nothing', 'the business closes', 'it is the last year they can enter', 'somebody else takes the prize on a technicality'],
  },
  form: {
    who: ['a stagehand', 'a session player', 'a courtroom sketch artist', 'a night porter', 'a projectionist'],
    incident: ['the tape runs out mid-sentence', 'the show goes on without its lead', 'the recording is found in a skip', 'the last night is announced'],
    goal: ['finish it before the room is closed', 'get the piece performed once', 'keep the doors open until Sunday'],
    against: ['a landlord', 'a director who wants it another way', 'the money', 'nobody caring at all'],
    stakes: ['the last copy goes in a skip', 'the room goes', 'the work is thrown out with the rest', 'the last people who cared move on'],
  },
  audience: {
    who: ['a twelve-year-old', 'a new kid at school', 'two cousins', 'a girl and her grandfather', 'a boy who talks to a dog'],
    incident: ['the family moves in August', 'the dog goes missing', 'a door in the garden opens', 'the summer camp closes', 'a stranger moves in next door'],
    goal: ['get the dog home before term starts', 'win the tournament', 'get back through before dark', 'keep the club going'],
    against: ['a school bully with a good reason', 'a landlord', 'a rule nobody bends', 'a grown-up who does not believe them'],
    stakes: ['the club is lost', 'the door closes behind them for good', 'the summer ends with nothing changed', 'the whole thing is forgotten by september'],
  },
};

/** Genre-specific material. Anything not listed falls back to its category. */
const GENRE_BANKS: Readonly<Record<string, PremiseBank>> = {
  drama: {
    who: ['a night-shift nurse', 'a disgraced headmaster', 'a fisherman with one boat left', 'an interpreter', 'a mother of three on her last warning', 'a young priest'],
    incident: ['a patient dies on her shift', 'his son is arrested', 'the quota is cut in half', 'she recognises the voice in the room', 'the eviction notice is nailed to the door', 'a confession is made to him'],
    goal: ['clear her name', 'keep the boy out of prison', 'hold the crew together for one more season', 'say what she heard', 'keep the flat', 'do the right thing without breaking the seal'],
    against: ['a hospital that needs an answer', 'a lawyer paid to lose slowly', 'the men who own the licence', 'her own family', 'a landlord with the law on his side', 'the bishop'],
    stakes: ['she is finished in the profession', 'the boy takes the full sentence', 'the crew scatters and the town empties', 'the truth stays in the room', 'the children go into care', 'everything is signed off exactly as it stands'],
    world: ['over one long winter', 'in a town with one employer', 'across three weeks of an inquiry'],
  },
  comedy: {
    who: ['a wedding DJ', 'a very bad estate agent', 'a mild-mannered dentist', 'two brothers who cannot agree', 'a woman who says yes to everything'],
    incident: ['he books two weddings on the same afternoon', 'a body is found in the show home', 'his practice is reviewed by his ex-wife', 'they inherit a pub with no licence', 'she agrees to run a marathon by mistake'],
    goal: ['get through both without either side noticing', 'sell the house by Friday', 'keep the practice open', 'get the licence back before the darts final', 'actually run it'],
    against: ['a best man with a speech', 'a rival agent with a bigger car', 'a review board that has read everything', 'a brewery', 'her own knees'],
    stakes: ['both weddings find out at once', 'the agency folds', 'he loses the practice and the house', 'the pub goes to the developers', 'the whole town hears the real version'],
  },
  'romantic-comedy': {
    who: ['a florist with a lease running out', 'a matchmaker who cannot be matched', 'a chef who hates weddings', 'a locum vet'],
    incident: ['the man she keeps arguing with buys the building', 'her ex hires her to plan his', 'he is booked to cook at his own ex-wife\'s wedding', 'she is assigned to the practice of the man she left'],
    goal: ['keep the shop and not fall for him', 'get through the wedding season', 'get the restaurant its second star', 'get out of the village by autumn'],
    against: ['a landlord who is also the man', 'a fiancée who is genuinely lovely', 'a business partner with a plan', 'the whole village'],
    stakes: ['she loses the shop and says nothing', 'he watches her marry someone else', 'they both settle for less than this', 'neither of them ever says it out loud'],
  },
  romance: {
    who: ['a widowed bookbinder', 'a translator at a hard border', 'a soldier home for six weeks', 'a woman who writes other people\'s letters'],
    incident: ['a letter arrives for the wrong house', 'they are assigned to the same crossing', 'his leave is cut to two weeks', 'she is asked to write to the man she loves for someone else'],
    goal: ['find out who wrote it', 'get her across before the border closes', 'say it before he goes back', 'stop writing them'],
    against: ['a family that will not have it', 'a state that keeps a list', 'the calendar', 'her own promise'],
    stakes: ['they never meet at all', 'the border closes with her on the wrong side', 'he goes back without knowing', 'the letter is burned unopened'],
  },
  thriller: {
    who: ['a night auditor', 'a customs officer', 'a data analyst on a temporary contract', 'a court interpreter', 'a long-haul driver'],
    incident: ['the same account is emptied twice', 'a container arrives that is not on the manifest', 'she finds her own name in the file', 'the man in the dock speaks to her directly', 'a passenger gets in at a service station'],
    goal: ['prove it before the audit closes', 'get the manifest to somebody honest', 'find out who put her there', 'get to the police without being seen', 'reach the depot'],
    against: ['a manager who has already been paid', 'the people the container belongs to', 'a department that says the file does not exist', 'a man who knows her route'],
    stakes: ['she takes the fall for all of it', 'the shipment goes through and people die', 'the whole thing is put down to somebody else', 'it goes through and nobody is ever charged'],
  },
  'psychological-thriller': {
    who: ['a sleep researcher', 'a house-sitter', 'a ghostwriter', 'a woman recovering from a head injury'],
    incident: ['a subject wakes up speaking as somebody else', 'the owners come back early', 'the memoir starts confessing to something', 'she remembers a room she has never been in'],
    goal: ['work out which of them is lying', 'get out of the house with the tapes', 'finish the book without being made part of it', 'find the room'],
    against: ['a supervisor with a paper to publish', 'a family that owns the street', 'the man whose story it is', 'her own memory'],
    stakes: ['she is committed and believed by nobody', 'the tape is destroyed', 'she signs off on a lie in her own hand', 'the version on paper becomes the only version'],
  },
  horror: {
    who: ['a caretaker at an empty school', 'a hospice night nurse', 'a surveyor sent to value a farm', 'a sound recordist'],
    incident: ['the alarm goes off in a wing that was sealed', 'a patient stops dying', 'the farm has no one on it and the animals are fed', 'the microphone picks up a second room'],
    goal: ['get the doors open and everyone out', 'last until the morning shift', 'finish the survey and leave', 'find the room the sound is coming from'],
    against: ['whatever the school was built over', 'a matron who knew and said nothing', 'the family who still own the land', 'the thing that copies voices'],
    stakes: ['none of them are found', 'it follows him home', 'the next shift walks into it', 'the building is signed over and reopened'],
    world: ['over one night', 'in a house cut off by water', 'in a village that empties at dusk'],
  },
  slasher: {
    who: ['a camp counsellor', 'a locksmith\'s apprentice', 'a final-year student', 'a lifeguard out of season'],
    incident: ['the first one does not come back from the lake', 'every lock on the corridor has been changed', 'the halls empty for reading week', 'the pool is drained overnight'],
    goal: ['get the rest of them off the site', 'reach the road', 'last until the coach comes'],
    against: ['someone who knows the building better than they do', 'a caretaker with a key to everything', 'a face from a summer nobody talks about'],
    stakes: ['the site is emptied by morning', 'the coach arrives to an empty camp', 'the site opens again next summer'],
  },
  crime: {
    who: ['a bookkeeper for the wrong firm', 'a boxing promoter in debt', 'a probation officer', 'a scrapyard owner'],
    incident: ['the audit is brought forward', 'his fighter is asked to go down in the fourth', 'a client turns up with a bag of money', 'a car comes in that should not exist'],
    goal: ['get the books straight before Monday', 'get the fight over with honestly', 'get the client out of the city', 'make the car disappear properly'],
    against: ['the family who own the firm', 'the men who bought the odds', 'a detective who has waited years', 'a partner who has already talked'],
    stakes: ['he goes down for all of it', 'the boy takes the beating and the blame', 'the client is found first', 'the firm carries on without a mark on it'],
  },
  gangster: {
    who: ['a driver who wants out', 'the youngest of three brothers', 'a club owner', 'an enforcer with a bad heart'],
    incident: ['the old man dies without saying who takes it', 'a shipment is taken by somebody local', 'the police put a man inside the club', 'his brother is picked up'],
    goal: ['hold the streets he has for one more year', 'find who took it before the others do', 'get the family out clean'],
    against: ['a brother who wants it all', 'a syndicate from the coast', 'a detective with photographs', 'his own name'],
    stakes: ['the family is finished', 'his son grows up in it', 'they lose the city', 'the name is worth nothing by spring'],
  },
  heist: {
    who: ['a retired safe man', 'a security consultant with a gambling debt', 'a museum conservator', 'a demolition engineer'],
    incident: ['the vault is being decommissioned in nine days', 'the collection is moved for cleaning', 'the building is scheduled to come down'],
    goal: ['get it out before the doors are welded shut', 'swap it before the loan is signed', 'take exactly what they came for and nothing else'],
    against: ['a head of security who trained him', 'a partner who wants more than the plan', 'a schedule that changes on the day'],
    stakes: ['everyone goes down together', 'the piece is destroyed in the attempt', 'they walk away with nothing and are known', 'the vault is emptied by somebody else first'],
  },
  mystery: {
    who: ['a village doctor', 'a paper\'s last reporter', 'a coroner\'s clerk', 'a schoolteacher standing in as registrar'],
    incident: ['a body is found on the tide line', 'the same photograph runs twice with different names', 'a death certificate is signed by a doctor who is dead', 'a child is registered twice'],
    goal: ['find out who he was', 'work out which name is real', 'find the doctor who actually signed it'],
    against: ['a village that has agreed on a story', 'an editor with an interest', 'a family who paid for silence'],
    stakes: ['it is written off and forgotten', 'the wrong man is buried under the right name', 'the next one goes the same way', 'the inquest records misadventure and closes'],
  },
  whodunit: {
    who: ['a house guest nobody invited', 'the family solicitor', 'a retired inspector at a wedding', 'the new housekeeper'],
    incident: ['the host does not come down to dinner', 'the will is read and one page is missing', 'the best man never arrives'],
    goal: ['work it out before the road reopens', 'find the page', 'keep the party in one room until morning'],
    against: ['seven people with reasons', 'a family closing ranks', 'a storm that cut the line'],
    stakes: ['the wrong person is arrested', 'they leave in the morning and it is never solved', 'the house is sold with it still unanswered'],
  },
  action: {
    who: ['an off-duty firefighter', 'a hostage negotiator on leave', 'a bodyguard on his last job', 'a courier'],
    incident: ['the tunnel comes down with his daughter in it', 'the call comes from a number only she knows', 'the convoy is hit on the bridge', 'the package is not what he was told'],
    goal: ['get them out before the water reaches them', 'get the hostages to the roof', 'get the car across the border', 'deliver it and walk'],
    against: ['a crew who planned for everyone but him', 'a commander following the wrong orders', 'the men who hired him'],
    stakes: ['the tunnel fills', 'they are all on the roof when it goes', 'his family is next', 'the building comes down with them in it'],
  },
  'martial-arts': {
    who: ['a gym\'s last student', 'a bouncer who used to compete', 'a woman who trains in her father\'s hall'],
    incident: ['the hall is bought by the man who closed it before', 'his old opponent is back and taking students', 'the tournament is reopened after twenty years'],
    goal: ['keep the hall open', 'win it once, properly', 'get the students to the final'],
    against: ['a school that fights dirty and wins', 'a promoter who owns both sides', 'a body that will not take another year'],
    stakes: ['the hall goes and the style with it', 'he is beaten in front of his students', 'the belt is handed over without a fight'],
  },
  war: {
    who: ['a stretcher bearer', 'a signals clerk', 'a village mayor under occupation', 'a bomber crew\'s youngest'],
    incident: ['the line moves overnight', 'an order comes through that cannot be right', 'the garrison changes hands', 'the crew is one man short'],
    goal: ['get the wounded to the river', 'get the message to the battalion', 'keep the village fed until spring', 'finish the tour'],
    against: ['an officer who will not hear it', 'a front that keeps moving', 'a commander billeted in his house', 'the arithmetic of it'],
    stakes: ['the battalion walks into it', 'the village is emptied', 'the crew is lost over the channel', 'the ground is given up for nothing'],
    world: ['in the last winter of it', 'in an occupied town', 'over four days on one road'],
  },
  western: {
    who: ['a stage driver', 'a homesteader\'s widow', 'a marshal with a month left', 'a Chinese railroad cook'],
    incident: ['the water is fenced off', 'the herd comes through the crop', 'a man is hanged without a trial', 'the railroad changes its route'],
    goal: ['get the claim recorded in town', 'get the herd to the railhead', 'take the man to the county seat alive'],
    against: ['the man who owns the valley', 'a company with paperwork and men', 'a posse that has already decided'],
    stakes: ['the family loses the land', 'the town takes the law back off him', 'the posse gets there first', 'the valley belongs to one man by autumn'],
  },
  'science-fiction': {
    who: ['a terraforming surveyor', 'a memory technician', 'a shipping clerk on a long haul', 'a first-generation colonist'],
    incident: ['the atmosphere reading is wrong by a decade', 'a client asks to have a real memory removed', 'the manifest lists a passenger nobody has seen', 'the seed vault fails'],
    goal: ['get the correction filed before the settlers land', 'find out what she is being paid to forget', 'find the passenger', 'get one harvest out of the ground'],
    against: ['a company with ships already in transit', 'a client who is also the client\'s lawyer', 'a ship that has decided otherwise', 'a winter nobody modelled'],
    stakes: ['nine thousand people land on a dead world', 'the memory is gone for good', 'the colony is gone by the second winter', 'the correction is filed a decade too late'],
  },
  'space-opera': {
    who: ['a courier captain', 'a house\'s youngest heir', 'a jump navigator', 'a station arbiter'],
    incident: ['the gate closes behind them', 'the succession is contested at the funeral', 'a fleet arrives at a neutral station'],
    goal: ['find another way home', 'hold the house together until the vote', 'keep the station out of the war'],
    against: ['an admiral with a mandate', 'a sibling with better claim', 'a truce with a date on it'],
    stakes: ['a hundred worlds go with it', 'the house ends with her', 'the station is taken', 'the gate closes for a generation'],
  },
  fantasy: {
    who: ['a mapmaker', 'a hedge witch', 'the last of a broken order', 'a miller\'s daughter'],
    incident: ['the river stops where it always ran', 'a king\'s man comes for the harvest and the children', 'the old road opens again', 'something is traded for her name'],
    goal: ['get to the source before the valley dries', 'get the children back', 'close the road', 'buy the name back'],
    against: ['a court that profits by it', 'a bargain already struck', 'an order that wants it kept shut'],
    stakes: ['the valley is abandoned', 'her name belongs to somebody else', 'the thing on the road comes down it', 'the bargain is kept and the price with it'],
  },
  'sword-and-sorcery': {
    who: ['a sell-sword with debts', 'a temple thief', 'a bodyguard to a bad prince'],
    incident: ['the relic is real after all', 'the city gates are closed from the inside', 'the prince is poisoned at his own table'],
    goal: ['get it out of the city', 'get the prince to his uncle alive', 'reach the pass before the snow'],
    against: ['a sorcerer who has waited a long time', 'the temple guard', 'a rival with the same contract'],
    stakes: ['the city burns for it', 'the line ends and the war starts', 'the pass is closed until spring with them outside it'],
  },
  supernatural: {
    who: ['a parish priest', 'a medium who knows it is a trick', 'a fire investigator'],
    incident: ['a house is left to somebody who was never born', 'a real one answers', 'the same address burns twice'],
    goal: ['find out who is in the house', 'get the family out of the seance', 'prove the fire was not set'],
    against: ['a bishop who wants it quiet', 'something that has been waiting to be asked', 'a family that keeps paying'],
    stakes: ['the family stays in the house', 'it comes back through her', 'the next fire has people in it', 'the house is let to somebody new'],
  },
  zombie: {
    who: ['a supermarket manager', 'a coach driver', 'a border nurse'],
    incident: ['the motorway is closed in both directions', 'the depot stops answering', 'the ward is sealed from outside'],
    goal: ['get the people in the store to the depot', 'get the coach north', 'get the children out of the ward'],
    against: ['an army with orders about the cordon', 'a man who will not be told', 'the amount of daylight left'],
    stakes: ['the cordon holds with them inside it', 'the depot falls before they reach it', 'the road south closes at dark'],
  },
  'post-apocalyptic': {
    who: ['a water engineer', 'a teacher walking a class south', 'a radio operator'],
    incident: ['the well runs orange', 'the road south is taken', 'the daily broadcast stops'],
    goal: ['reach the reservoir before the tanks are dry', 'get the class to the coast', 'find whoever was broadcasting'],
    against: ['a settlement that got there first', 'a convoy that takes what it needs', 'the distance'],
    stakes: ['the town dies of thirst', 'the road south takes the class', 'the settlement is empty by winter'],
  },
  dystopian: {
    who: ['a compliance clerk', 'a schools inspector', 'a housing officer'],
    incident: ['a file is corrected in front of her', 'a school is removed from the register overnight', 'a whole block is reassigned'],
    goal: ['get the original out of the building', 'find the children', 'get one family rehoused honestly'],
    against: ['a department that audits its auditors', 'a policy nobody signed', 'a colleague who has already reported her'],
    stakes: ['she is corrected too', 'the register comes back without them', 'the file is amended and everyone agrees it was always so'],
  },
  'time-travel': {
    who: ['a records clerk', 'a physicist\'s widow', 'a paramedic'],
    incident: ['the same day is logged twice', 'his notes describe her funeral', 'the call comes in before the crash'],
    goal: ['find out which day was the real one', 'stop the experiment being run', 'get there before it happens'],
    against: ['a version of himself who wants it kept', 'a department with the funding', 'the shape of the thing itself'],
    stakes: ['the loop closes with him in it', 'the crash happens anyway and worse', 'the same day runs again with nobody left to notice'],
  },
  superhero: {
    who: ['a city paramedic who cannot be hurt', 'a retired hero running a hardware shop', 'a teenager who can hear everything'],
    incident: ['a bridge comes down at rush hour', 'the old team is being brought back', 'she hears a bomb being wired'],
    goal: ['get the city through the night', 'refuse and be left alone', 'find the flat before it goes off'],
    against: ['a mayor who wants them registered', 'somebody they used to work with', 'a city that stopped trusting them'],
    stakes: ['the bridge is only the first', 'the team goes out without him and dies', 'the block goes up', 'the city stops asking for help at all'],
  },
  disaster: {
    who: ['a dam engineer', 'a ferry master', 'a seismologist nobody reads'],
    incident: ['the seepage doubles overnight', 'the storm turns two hours early', 'the swarm starts under the city'],
    goal: ['get the valley evacuated before the crest', 'get the ferry to the lee shore', 'get the order given'],
    against: ['a board that will not authorise it', 'a schedule', 'a mayor with an election'],
    stakes: ['the valley goes under with everyone in it', 'the ferry is lost with all aboard', 'the order comes an hour after it would have mattered'],
  },
  survival: {
    who: ['a bush pilot', 'a diver on a solo charter', 'a hiker with a broken radio'],
    incident: ['the engine dies over the interior', 'the boat is gone when she surfaces', 'the snow comes down three days early'],
    goal: ['walk out before the freeze', 'reach the shipping lane', 'get down to the treeline'],
    against: ['the country itself', 'a leg that will not hold', 'the temperature after dark'],
    stakes: ['the wreck is found in spring with nobody in it', 'the file is closed as a missing person', 'the search is called off on the fourth day'],
  },
  adventure: {
    who: ['a salvage diver', 'a mountain guide', 'a museum courier'],
    incident: ['the wreck is where nobody said it was', 'a client insists on the north face', 'the crate is opened at customs and is empty'],
    goal: ['get to the hold before the weather turns', 'get the party down alive', 'trace the crate to whoever swapped it'],
    against: ['a rival team with a faster boat', 'a client who will not turn back', 'a dealer with better lawyers'],
    stakes: ['the wreck is stripped by somebody else', 'the party is still up there at nightfall', 'the find goes on a shelf in another country'],
  },
  espionage: {
    who: ['a cultural attaché', 'a cipher clerk', 'a defector\'s handler'],
    incident: ['a walk-in offers a name', 'the code changes a day early', 'his source misses two meetings'],
    goal: ['get the source out before the list is read', 'find the leak inside the section', 'make the exchange and go home'],
    against: ['a service that is already reading it', 'a superior protecting somebody', 'a deadline in another country'],
    stakes: ['the network is rolled up in a night', 'the source is shot for it', 'the list is read by the wrong service'],
  },
  political: {
    who: ['a chief of staff', 'a backbencher with one term left', 'a city auditor'],
    incident: ['the vote is brought forward a week', 'a whip asks for something specific', 'the accounts do not close'],
    goal: ['hold the votes together', 'get the amendment onto the paper', 'get the audit published'],
    against: ['a leader who needs it to fail', 'a party machine', 'a newspaper that has been fed the other half'],
    stakes: ['the bill dies and the ward with it', 'his career ends in one afternoon', 'the vote is lost by two and nobody remembers why'],
  },
  legal: {
    who: ['a duty solicitor', 'a junior barrister on her first brief', 'a legal aid clerk'],
    incident: ['the disclosure arrives on the morning of trial', 'her client changes his plea', 'a witness is withdrawn'],
    goal: ['get the trial stopped', 'find the witness before the summing up', 'get the case reopened'],
    against: ['a prosecutor with a career riding on it', 'a judge running to time', 'a firm that wants it settled'],
    stakes: ['an innocent man goes down for twenty years', 'she is struck off for saying it', 'the verdict stands and the appeal is refused'],
  },
  medical: {
    who: ['a locum registrar', 'a transplant coordinator', 'a rural GP'],
    incident: ['the same drug fails on three patients', 'a donor match is refused by the board', 'an outbreak is called a coincidence'],
    goal: ['get the batch pulled', 'get the transplant approved before Friday', 'get the water tested'],
    against: ['a trust protecting its figures', 'a committee that meets monthly', 'a company with a contract'],
    stakes: ['the next patient dies of it', 'the child is taken off the list', 'the village drinks it all summer', 'the trust records it as an isolated incident'],
  },
  procedural: {
    who: ['a detective sergeant on nights', 'a scene-of-crime officer', 'a missing persons liaison'],
    incident: ['the same fibre turns up in two counties', 'the caller gives an address before there is one', 'a file is closed by somebody else'],
    goal: ['tie the two cases together before the review', 'find the caller', 'get the file reopened'],
    against: ['a chief who wants clearance rates', 'a force in the next county', 'the twenty-eight day rule'],
    stakes: ['it happens a third time', 'the file is destroyed on schedule', 'the case is written up as cleared'],
  },
  'film-noir': {
    who: ['a house detective', 'an insurance investigator', 'a nightclub pianist'],
    incident: ['a woman checks in under a name he knows', 'a claim is made on a policy signed last week', 'a man is shot during his set'],
    goal: ['find out who she really is', 'prove the fire was arranged', 'get out of the city clean'],
    against: ['a husband with money', 'a firm that would rather pay', 'a lieutenant who owns the block'],
    stakes: ['he takes the fall for it', 'the money buys the verdict', 'the file goes into a drawer and stays there'],
  },
  'neo-noir': {
    who: ['a private investigator on divorce work', 'a bail bondsman', 'a repossession agent'],
    incident: ['the wife he is following is following someone else', 'a client skips with the collateral', 'the car he takes has a body in the boot'],
    goal: ['finish the job and get paid', 'find the client before the court date', 'get rid of the car'],
    against: ['a developer with police on the payroll', 'a partner who has taken a better offer', 'a client who was never the client'],
    stakes: ['he is the one they find with it', 'the girl he was following disappears', 'the development goes ahead on schedule'],
  },
  biography: {
    who: ['a self-taught mathematician', 'a union organiser', 'a concert cellist', 'a war photographer'],
    incident: ['a paper is published under another name', 'the plant announces it is closing', 'the tremor starts in her left hand', 'the picture runs on every front page'],
    goal: ['have the work put right', 'keep the plant open through the winter', 'play the season anyway', 'go back and find the family in the picture'],
    against: ['an institution that has decided', 'an owner with a board to answer to', 'a body that is finished with it', 'an editor who owns the negative'],
    stakes: ['the credit goes to someone else for good', 'two thousand jobs go', 'the hand is finished and the career with it', 'the name is left off the plaque'],
  },
  historical: {
    who: ['a cartographer to a court', 'a plague doctor', 'a shipwright', 'a lady\'s companion'],
    incident: ['the border is redrawn on his map before it is agreed', 'the town gates are shut with him inside', 'the contract is given to a foreign yard', 'the marriage is announced'],
    goal: ['get the true map to the treaty table', 'keep the sick fed and separate', 'finish the ship without the yard', 'get her out before the wedding'],
    against: ['a chancellor with a use for the lie', 'a council that will not open the gates', 'a guild', 'a family with debts to settle'],
    stakes: ['a war is fought over the wrong line', 'the town is written off', 'the yard closes and the town with it', 'the lie is copied into every map after'],
  },
  'period-drama': {
    who: ['a governess', 'a second son', 'a mill owner\'s daughter', 'a returning officer of no fortune'],
    incident: ['the estate is entailed away', 'a letter is found in the wrong drawer', 'the mill takes on machines', 'a proposal is made in front of everyone'],
    goal: ['keep the household together', 'find out who wrote it', 'keep the hands employed', 'refuse without ruining them all'],
    against: ['a cousin with the law behind him', 'a mother with plans', 'a town that wants the machines'],
    stakes: ['the family is turned out', 'the sisters marry where they must', 'the letter is read aloud', 'the house passes to a cousin nobody has met'],
  },
  'coming-of-age': {
    who: ['a fifteen-year-old on a caravan site', 'a boy who works his father\'s round', 'a girl in her brother\'s year'],
    incident: ['the site is sold for development', 'his father does not get up one morning', 'she is picked for the team'],
    goal: ['get through the last summer', 'keep the round going alone', 'make the county side'],
    against: ['a mother who wants them gone', 'the customers', 'a coach who has already chosen'],
    stakes: ['they leave and never come back', 'the round is lost and the house with it', 'the summer ends and nothing is the same'],
  },
  teen: {
    who: ['a scholarship student', 'the newest member of the marching band', 'two best friends in their last year'],
    incident: ['the prize is announced with one place in it', 'the band is cut from the budget', 'one of them is offered a place away'],
    goal: ['get the place without losing the friend', 'get the band to the competition', 'get through the year together'],
    against: ['a friend who wants it as much', 'a principal with a spreadsheet', 'everyone telling them to grow up'],
    stakes: ['the friendship ends over it', 'the band is finished for good', 'the year is remembered for the wrong thing'],
  },
  family: {
    who: ['a father who has lost his job', 'two sisters and a dog', 'a grandmother and a grandson'],
    incident: ['the farm is put up for sale', 'the dog runs off on the day they move', 'the boy is sent for the summer'],
    goal: ['keep the farm in the family', 'find the dog before the removal van goes', 'get through the summer'],
    against: ['a buyer with cash', 'a very large county', 'a grandmother who does things her way'],
    stakes: ['the farm is sold and split', 'the dog is rehomed two counties away', 'the family spends the winter apart'],
  },
  animation: {
    who: ['a lighthouse keeper\'s cat', 'a very small dragon', 'a robot left behind at a fair', 'a bookshop mouse'],
    incident: ['the light goes out for the first time in ninety years', 'she is told she is the wrong kind', 'the fair packs up overnight', 'the shop is boxed up'],
    goal: ['get the light lit before the boats come in', 'prove what she is', 'find the fair again', 'get the books to the new shop'],
    against: ['a storm', 'a council of very serious dragons', 'a scrap merchant', 'a cat with plans'],
    stakes: ['the harbour loses its boats', 'she is sent away for good', 'the fair goes without him', 'the light stays out and the rock is left to itself'],
  },
  musical: {
    who: ['a dance hall pianist', 'a chorus understudy', 'a brass band conductor'],
    incident: ['the hall is licensed for bingo instead', 'the lead loses her voice on opening night', 'the colliery band is told to hand back the instruments'],
    goal: ['get one last season out of the hall', 'go on and be good enough', 'get the band to the finals'],
    against: ['a brewery', 'a producer who wants a name', 'a board that has already closed the pit'],
    stakes: ['the hall becomes a car park', 'the offer goes to somebody else', 'the band is broken up for good', 'the last night is played to eleven people'],
  },
  sport: {
    who: ['a club\'s last academy graduate', 'a swimmer coming back from injury', 'a manager on a one-match contract'],
    incident: ['the club is put into administration', 'the trials are moved forward six weeks', 'the captain refuses to play'],
    goal: ['keep the club up', 'make the time in six weeks', 'get eleven fit players on the pitch'],
    against: ['an owner asset-stripping it', 'a shoulder that is not ready', 'a dressing room that has given up'],
    stakes: ['the club folds after a hundred years', 'the trials go on without her', 'the ground is sold for houses'],
  },
  'dark-comedy': {
    who: ['a crematorium manager', 'a life coach in debt', 'a hospice chaplain who has stopped believing'],
    incident: ['a body is delivered to the wrong family', 'his own seminar goes viral for the wrong reason', 'a patient leaves him everything'],
    goal: ['sort it out before either family finds out', 'give the money back', 'get through the funeral'],
    against: ['a regulator', 'a family with a solicitor', 'his own better nature'],
    stakes: ['both families find out at the same funeral', 'he keeps it and knows he did', 'the whole thing is written up in the local paper'],
  },
  satire: {
    who: ['a ministerial adviser', 'a brand consultant', 'a school inspector'],
    incident: ['the policy is announced before it is written', 'the campaign is a hit for the opposite reason', 'a failing school tops the table'],
    goal: ['write the policy backwards from the headline', 'keep the account', 'find out how the numbers happened'],
    against: ['a minister who believes it now', 'a client who loves it', 'a department that prefers the number'],
    stakes: ['it becomes law exactly as invented', 'the school is used as the model for all of them', 'the campaign wins an award for it'],
  },
  documentary: {
    who: ['a filmmaker with one interview', 'a researcher going through a landfill of files', 'a former inspector'],
    incident: ['the only witness agrees to speak on camera', 'the department releases the wrong box', 'the site is scheduled for clearance'],
    goal: ['get it filmed before he changes his mind', 'match the records to the burials', 'get the film finished before the injunction'],
    against: ['a firm of libel lawyers', 'a records office with a fire in its history', 'a broadcaster getting cold feet'],
    stakes: ['the story dies with him', 'the ground is cleared and nothing is proved', 'the film is pulled a week before transmission'],
  },
  'true-crime': {
    who: ['a podcaster with a day job', 'the victim\'s sister', 'a retired detective'],
    incident: ['a name comes up in a second county', 'the case is quietly closed', 'the evidence is scheduled for destruction'],
    goal: ['get the samples retested', 'get the file reopened', 'find the man in both counties'],
    against: ['a force protecting a conviction', 'a family that wants it left', 'a clock on the storage contract'],
    stakes: ['the samples are destroyed', 'the wrong man dies inside', 'the case is closed a second time'],
  },
  workplace: {
    who: ['a shift supervisor', 'a call centre team leader', 'a warehouse picker'],
    incident: ['the targets are doubled overnight', 'the site is put under review', 'a colleague collapses on the floor'],
    goal: ['keep the team together through the review', 'get the rota changed', 'get somebody to admit the targets did it'],
    against: ['a regional manager with a spreadsheet', 'a company that measures the toilet breaks', 'a colleague going for the same job'],
    stakes: ['the site closes and the town has nothing else', 'the team is broken up', 'the targets are held up as a success'],
  },
  'slice-of-life': {
    who: ['a launderette owner', 'a night bus driver', 'a school caretaker'],
    incident: ['the shop next door becomes a chain', 'a passenger rides the whole route every night', 'the school is merged with another'],
    goal: ['keep the regulars', 'find out where she is going', 'see the last term out properly'],
    against: ['rent', 'the timetable', 'a new head with new ideas'],
    stakes: ['the launderette closes', 'the route is cut', 'the street is unrecognisable within a year'],
  },
  epic: {
    who: ['a bridge builder', 'a young emperor\'s regent', 'a fleet\'s last navigator'],
    incident: ['the river changes course', 'the capital is besieged in the spring', 'the charts are proved wrong'],
    goal: ['build it anyway', 'hold the city until the thaw', 'find the passage'],
    against: ['a treasury with nothing in it', 'an army that does not need to hurry', 'an ocean with no chart'],
    stakes: ['a generation is lost to it', 'the city falls and the line ends', 'the work is abandoned half finished'],
  },
  tragedy: {
    who: ['a foreman who covered for a friend', 'a surgeon at the end of a long shift', 'a father who signed the papers'],
    incident: ['the scaffold comes down', 'the wrong side is opened', 'the money is gone by morning'],
    goal: ['make it right before the inquiry', 'tell the family himself', 'get it back before anyone knows'],
    against: ['a company that needs a name to give', 'a hospital closing ranks', 'time'],
    stakes: ['the friend takes it and never works again', 'he tells nobody and lives with it', 'the inquiry finds nobody at fault'],
  },
  melodrama: {
    who: ['a woman married to the town\'s doctor', 'a returning sister', 'a piano teacher'],
    incident: ['a child arrives with his eyes', 'the will is read in front of the town', 'a letter is returned unopened'],
    goal: ['keep it from the children', 'take what is hers', 'be heard once'],
    against: ['a husband with a reputation', 'a mother who chose the other one', 'a town that talks'],
    stakes: ['the family is finished in that town', 'she goes back to the same house', 'the truth is known by everyone and said by nobody'],
  },
  'road-movie': {
    who: ['two estranged brothers', 'a daughter driving her father north', 'a woman with a van and a deadline'],
    incident: ['the funeral is nine hundred miles away', 'the care home cannot take him for a week', 'the job is on the other coast on Monday'],
    goal: ['get there before it starts', 'get him there in one piece', 'make the delivery'],
    against: ['a car that will not do it', 'everything neither of them ever said', 'the distance and the money'],
    stakes: ['they miss it', 'they say it and cannot take it back', 'the drive is made in silence both ways'],
  },
  'folk-horror': {
    who: ['a district nurse', 'a surveyor for the water board', 'a new schoolmistress'],
    incident: ['the village will not register a birth', 'the reservoir plan meets the parish', 'the children are kept home in May'],
    goal: ['get the child seen by a doctor', 'complete the survey', 'find out what happens in May'],
    against: ['a parish council that is also a family', 'a custom nobody explains', 'the season itself'],
    stakes: ['she is still there in May', 'the valley is flooded with it still in there', 'the parish register is closed and nothing is written in it'],
  },
  monster: {
    who: ['a harbour master', 'a game warden', 'a lighthouse relief keeper'],
    incident: ['the nets come up cut', 'the herd is found on the ridge, all of it', 'the foghorn answers itself'],
    goal: ['get the boats in and keep them in', 'find what came through the fence', 'get off the rock'],
    against: ['a council that needs the season', 'a hunting party from the city', 'the fog'],
    stakes: ['the fleet goes out on Saturday', 'it reaches the town', 'the season opens on time'],
  },
  kaiju: {
    who: ['a harbour engineer', 'a defence liaison officer', 'a seismologist'],
    incident: ['something comes ashore at the container port', 'the trace is a hundred metres long', 'the evacuation order is given too late'],
    goal: ['get the city moved inland', 'work out what it wants', 'get the bridge cleared'],
    against: ['a general with one plan', 'a city that cannot move fast enough', 'the thing itself'],
    stakes: ['the city is gone by morning', 'it turns inland', 'the evacuation is ordered from the wrong side'],
  },
  religious: {
    who: ['a novice', 'a tribunal clerk', 'a chaplain to a prison'],
    incident: ['a miracle is claimed in the parish', 'a case is reopened after four hundred years', 'a condemned man asks for him by name'],
    goal: ['find out what really happened in the field', 'read the whole file before the ruling', 'hear him out'],
    against: ['a bishop with a shrine to build', 'an office that has already written the finding', 'his own doubt'],
    stakes: ['a lie becomes a shrine', 'the record stands as written', 'the shrine is built and the money follows'],
  },
  mythology: {
    who: ['a ferryman', 'a smith\'s apprentice', 'a king\'s youngest daughter'],
    incident: ['a passenger comes back the other way', 'the forge fire will not take', 'the tribute is asked for again'],
    goal: ['get the passenger back where they belong', 'finish the blade', 'go in her sister\'s place'],
    against: ['a god who was owed', 'a bargain older than the town', 'a father who has already agreed'],
    stakes: ['the river takes the town instead', 'the sister goes', 'the bargain is honoured to the letter'],
  },
  holiday: {
    who: ['a postal sorter', 'a hotel night manager', 'a village choir leader'],
    incident: ['a sack of letters is found from thirty years ago', 'the snow closes the road with a full hotel', 'the church roof falls in on the first of December'],
    goal: ['deliver them all before the day', 'get everyone fed and warm until the plough', 'get the concert on somewhere'],
    against: ['thirty years of moving house', 'a hotel with no power', 'a parish with no money'],
    stakes: ['they go back in the sack', 'everybody spends it in the wrong place', 'the day passes and nobody says anything about it'],
  },
  school: {
    who: ['a supply teacher', 'a head of year', 'a sixth-former on report'],
    incident: ['the class has had five teachers this term', 'a pupil stops coming in', 'the exam paper is leaked'],
    goal: ['get the class through the exam', 'find the boy', 'prove she did not take it'],
    against: ['a school on its last inspection', 'a family that will not open the door', 'a board that needs a name'],
    stakes: ['the year is written off', 'he is written off as gone', 'she is excluded weeks before the exams'],
  },
};

function bankFor(genreId: string): PremiseBank | undefined {
  const id = canonicalGenre(genreId);
  const own = GENRE_BANKS[id];
  if (own) return own;
  const def = genre(id);
  return def ? CATEGORY_BANKS[def.category] : undefined;
}

/**
 * Whether a fragment can be moved into another story.
 *
 * Two things stop it. A pronoun belongs to whoever the row was about, so
 * "before he goes back without knowing" cannot follow somebody else's spine.
 * And a definite person — "the boy", "the client" — refers to somebody that
 * row introduced and this one never did, which reads as a missing scene.
 */
function portable(text: string): boolean {
  if (/\b(he|she|his|her|him|hers|himself|herself|they|them|their)\b/i.test(text)) return false;
  return !/\bthe (boy|girl|man|woman|kid|child|children|family|friend|client|source|sister|brother|father|mother|son|daughter|wife|husband|prince|passenger|patient|crew|team|band|class|party|students?|witness|dog|shop|hall|farm|pub|club|site|village|town)\b/i.test(text);
}

export interface Premise {
  /** The one sentence, built by the same grammar the player's builder uses. */
  logline: string;
  /** The parts it was built from, so nothing about it is a black box. */
  parts: { protagonist: string; incident: string; goal: string; antagonist: string; stakes: string; world?: string };
}

/**
 * A premise for something the world is making.
 *
 * Each bank is written in rows: the first protagonist goes with the first
 * incident, the first objective, the first opposition and the first cost. A
 * premise takes its spine — who, what happened, what they now want — from one
 * row, so the person and the trouble always belong to each other and nobody is
 * called "her" in one half and "him" in the other.
 *
 * The opposition and the cost are then free to come from any row of any of the
 * project's genres, as long as they name nobody: that is where the variety
 * comes from, and it is why a crime picture with a romance in it gets the
 * trouble from one and what it costs from the other without reading like two
 * films stapled together.
 */
export function buildPremise(
  genreIds: readonly string[],
  rng: Rng,
  /** A line the caller has already used. Drawn again until it is not one of them. */
  taken: (line: string) => boolean = () => false,
  attempts = 14,
): Premise | undefined {
  const banks = genreIds.map(bankFor).filter((b): b is PremiseBank => Boolean(b));
  if (banks.length === 0) return undefined;

  // The world does not make the same film twice, so a premise it has already
  // used is thrown away and drawn again rather than shipped.
  for (let attempt = 0; attempt < attempts; attempt++) {
    const candidate = drawPremise(banks, rng);
    if (candidate && !taken(candidate.logline)) return candidate;
  }
  return drawPremise(banks, rng);
}

function drawPremise(banks: readonly PremiseBank[], rng: Rng): Premise | undefined {

  const spine = banks[rng.int(0, banks.length - 1)]!;
  const rows = Math.min(
    spine.who.length, spine.incident.length, spine.goal.length,
    spine.against.length, spine.stakes.length,
  );
  if (rows === 0) return undefined;
  const row = rng.int(0, rows - 1);

  // The opposition and the cost: this row's own most of the time, another row
  // of the same genre often, and another genre on the project occasionally.
  // Weighted that way round because the genre's own language is what makes it
  // sound like that genre, and the blend is seasoning rather than the dish.
  const own = (slot: 'against' | 'stakes'): string | undefined => spine[slot]?.[row];
  const sameGenre = (slot: 'against' | 'stakes'): string[] => (spine[slot] ?? [])
    .filter((text, i) => i !== row && portable(text));
  const otherGenres = (slot: 'against' | 'stakes'): string[] => banks
    .filter((bank) => bank !== spine)
    .flatMap((bank) => [...(bank[slot] ?? [])])
    .filter(portable);
  const pick = (options: readonly string[]): string | undefined => (
    options.length === 0 ? undefined : options[rng.int(0, options.length - 1)]
  );
  const draw = (slot: 'against' | 'stakes'): string => {
    const mine = own(slot);
    const roll = rng.next();
    const order = roll < 0.42
      ? [mine, pick(sameGenre(slot)), pick(otherGenres(slot))]
      : roll < 0.78
        ? [pick(sameGenre(slot)), pick(otherGenres(slot)), mine]
        : [pick(otherGenres(slot)), pick(sameGenre(slot)), mine];
    return order.find((option): option is string => Boolean(option)) ?? mine ?? '';
  };

  const parts = {
    protagonist: spine.who[row]!,
    incident: spine.incident[row]!,
    goal: spine.goal[row]!,
    antagonist: draw('against'),
    stakes: draw('stakes'),
    world: undefined as string | undefined,
  };

  // A setting only when one of the genres carries one, and not every time: a
  // logline that always opens with a place reads like a form.
  const withWorld = banks.filter((b) => b.world && b.world.length > 0);
  if (withWorld.length > 0 && rng.chance(0.34)) {
    const bank = withWorld[rng.int(0, withWorld.length - 1)]!;
    parts.world = bank.world![rng.int(0, bank.world!.length - 1)];
  }

  const logline = composeLogline(parts);
  if (!logline) return undefined;
  return { logline, parts };
}
