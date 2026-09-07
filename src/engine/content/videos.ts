/**
 * SLATE — what the channels actually put out, and what the comments say.
 *
 * A channel that has been running four years has a few hundred videos behind
 * it. Writing those by hand is neither possible nor the point; what matters is
 * that no two are the same and that each one reads like something a person
 * would click. So a title is built from a pattern and a set of words that
 * belong to the subject, seeded from the channel and the video, which means a
 * save always has the same back catalog and two saves do not have the same one.
 *
 * The comments are the same idea with a different job. A comment section is not
 * a mood meter: it is warm, it is pedantic, it is off topic, it is somebody who
 * watched thirty seconds, and occasionally it is somebody being cruel. The
 * cruel ones are marked, so the app can offer them rather than serve them —
 * "comments you can read and reply to, and the ones you should not read".
 */

import type { Rng } from '../core/rng';
import { BEAT_SLOT, type Topic } from './channels';

export interface TitleKit {
  patterns: readonly string[];
  slots: Readonly<Record<string, readonly string[]>>;
}

const COMMON_SLOTS = {
  number: ['Three', 'Five', 'Seven', 'Ten', 'Twelve', 'Twenty', 'Thirty', 'Forty'],
  span: ['A Week', 'A Month', 'Six Months', 'A Year', 'Three Years', 'A Decade', 'One Afternoon', 'Two Days'],
  judgement: ['Everybody Gets Wrong', 'Nobody Talks About', 'Changed My Mind', 'I Was Wrong About', 'Still Holds Up', 'Aged Badly', 'Deserved Better', 'Nearly Worked'],
} as const;

export const TITLE_KITS: Readonly<Record<Topic, TitleKit>> = {
  film: {
    patterns: [
      'The {element} In {picture}',
      'What {picture} Does With {element}',
      '{picture} And The {element} Problem',
      'The {element} That {judgement}',
      'Why {picture} Opens On {element}',
      'Reading {picture} Through Its {element}',
      '{number} Films That Understood {element}',
      'The Case For {picture}',
      '{picture}, {span} Later',
      'Nobody Noticed The {element} In {picture}',
      'How {picture} Ends, And Why',
      'The {element} Is The Whole Film',
      '{picture} Is Not About What You Think',
      'Rewatching {picture} After {span}',
    ],
    slots: {
      ...COMMON_SLOTS,
      element: ['Blocking', 'Color', 'Sound Design', 'Score', 'Costume', 'Editing', 'Framing', 'Lighting', 'Casting', 'Silence', 'The Cold Open', 'Camera Movement', 'Production Design', 'The Final Shot', 'Voiceover', 'Pacing', 'Transitions', 'The Absent Score', 'Aspect Ratio', 'Depth Of Field', 'The Opening Credits', 'Reaction Shots', 'Color Grading', 'Camera Height',],
      picture: ['A Second Language', 'The Quiet Hours', 'Northbound', 'Glasshouse', 'The Long Weekend', 'Salt And Iron', 'Everything Below', 'The Understudy', 'Fault Lines', 'Winter Term', 'A Small Fire', 'The Borrowed Year', 'Low Tide', 'The Fourth Wall', 'Nightingale Road', 'The Paper House'],
    },
  },
  making: {
    patterns: [
      'How To Light {subject} With {kit}',
      '{kit}, Tested On A Real Shoot',
      'The {element} Mistake Everybody Makes',
      'Shooting {subject} For Under {price}',
      '{number} Setups, One Room',
      'Why Your {element} Looks Cheap',
      'The Whole Day, Uncut: {subject}',
      '{kit} Versus {kit2}, Honestly',
      'Fixing {element} In The Edit',
      'What I Learned Shooting {subject}',
      'One Light, {number} Looks',
      'The {element} Nobody Budgets For',
      'Prepping {subject} Properly',
      'This Is Why Your Sound Is Bad',
    ],
    slots: {
      ...COMMON_SLOTS,
      subject: ['A Night Exterior', 'A Two Hander', 'A Car Interior', 'A Kitchen Scene', 'An Interview', 'A Chase', 'A Wedding', 'A Music Video', 'A Short Film', 'A Rain Scene', 'A Crowd Scene', 'A Single Take', 'A Bar Scene', 'A Hospital Corridor', 'A Dinner Table', 'A Doorway', 'A Beach', 'A Staircase', 'A Phone Call', 'A Funeral', 'A Boardroom', 'A Bedroom', 'A Market', 'A Rooftop',],
      kit: ['One Light', 'A Bounce Board', 'A Shoulder Rig', 'A Cheap Zoom', 'A Prime Lens', 'A Field Recorder', 'A Slider', 'A Gimbal', 'Natural Light', 'A Practical Lamp', 'A Diffusion Frame', 'A Shotgun Mic', 'A Bounce Card', 'A Flag', 'A Color Gel', 'A Follow Focus', 'A Matte Box', 'A Long Lens', 'A Wide Lens', 'A Lavalier',],
      kit2: ['A Rented Package', 'Three Lights', 'A Studio Setup', 'The Expensive One', 'A Tripod', 'Available Light'],
      element: ['Lighting', 'Sound', 'Focus', 'Coverage', 'Continuity', 'Color', 'Blocking', 'Grip', 'Scheduling', 'The Look', 'Framing', 'Exposure', 'Continuity Of Light', 'Camera Height', 'Eyelines', 'The Schedule', 'Depth', 'Contrast',],
      price: ['A Hundred Dollars', 'Five Hundred Dollars', 'A Thousand Dollars', 'Nothing At All'],
    },
  },
  acting: {
    patterns: [
      'The {element} In A Self Tape',
      'How To Play {subject} Without Playing It',
      '{number} Ways To Read One Line',
      'What The Reader Is Actually Watching',
      'The {element} That Loses You The Room',
      'Scene Study: {subject}',
      'Working On {element} For {span}',
      'Why You Are Rushing {subject}',
      'The Callback, Step By Step',
      'Stillness Is Not Nothing',
      'Playing {subject} At {number} Different Sizes',
      'Notes I Give Every Actor About {element}',
      'The {element} Problem In Auditions',
      'Reading Cold, On Camera',
    ],
    slots: {
      ...COMMON_SLOTS,
      element: ['Eyeline', 'Breath', 'Pace', 'Stillness', 'Volume', 'Diction', 'Listening', 'Intention', 'Physicality', 'Framing', 'Silence', 'Subtext', 'Rhythm', 'Focus', 'Weight', 'Contact', 'Timing', 'Restraint', 'Repetition', 'Improvisation',],
      subject: ['Grief', 'Anger', 'A Lie', 'Good News', 'A Confession', 'Boredom', 'Fear', 'A First Meeting', 'A Goodbye', 'An Argument', 'Exhaustion', 'Relief', 'Jealousy', 'Regret', 'Shame', 'Hope', 'Suspicion', 'Certainty', 'Nerves', 'Contempt', 'Longing', 'Forgiveness', 'Doubt', 'Delight',],
    },
  },
  cooking: {
    patterns: [
      'The Only {dish} Recipe You Need',
      '{dish}, In {number} Minutes',
      'Why Your {dish} Is {problem}',
      'I Made {dish} {number} Ways',
      'The {technique} Method For {dish}',
      '{dish} With Whatever Is In The Fridge',
      'Restaurant {dish} At Home',
      'How To {technique} Properly',
      '{dish} For One, Without The Waste',
      'The {ingredient} Trick That Fixes {dish}',
      'Cooking {dish} On A Weeknight',
      '{number} Things To Do With {ingredient}',
      'Testing {number} {dish} Recipes',
      'The Case Against {technique}',
    ],
    slots: {
      ...COMMON_SLOTS,
      dish: ['Roast Chicken', 'Ragu', 'Risotto', 'Bread', 'Pasta', 'Curry', 'Soup', 'Omelette', 'Steak', 'Dal', 'Pizza', 'Stew', 'Fried Rice', 'Tarte Tatin', 'Focaccia', 'Ramen', 'Chowder', 'Tagine', 'Gnocchi', 'Paella', 'Laksa', 'Tacos', 'Cassoulet', 'Pho', 'Shakshuka', 'Cottage Pie', 'Congee', 'Moussaka',],
      technique: ['Braising', 'Searing', 'Proving', 'Emulsifying', 'Blanching', 'Resting', 'Salting', 'Roasting', 'Confit', 'Deglazing', 'Pickling', 'Steaming', 'Poaching', 'Curing', 'Smoking', 'Reducing',],
      ingredient: ['Anchovies', 'Butter', 'Lemon', 'Garlic', 'Stock', 'Vinegar', 'Miso', 'Bay', 'Cream', 'Chilli', 'Parmesan', 'Eggs'],
      problem: ['Dry', 'Bland', 'Greasy', 'Falling Apart', 'Overcooked', 'Watery', 'Taking Too Long'],
    },
  },
  cars: {
    patterns: [
      'Buying A {car} For {price}',
      '{car} After {span}',
      'The {part} On A {car} Is A Nightmare',
      'Fixing The {part} Myself',
      '{car} Versus {car2}, On The Road',
      'What {price} Actually Buys You',
      'The {part} Job Nobody Warns You About',
      '{span} Living With A {car}',
      'Why The {car} Is Suddenly Worth Money',
      'Stripping The {part}, Start To Finish',
      'The Cheapest {car} On The Market',
      'Rebuilding A {part} On The Bench',
      'Driving A {car} Across {distance}',
      '{number} Things Wrong With This {car}',
    ],
    slots: {
      ...COMMON_SLOTS,
      car: ['Estate', 'Hatchback', 'Saloon', 'Roadster', 'Coupe', 'Pickup', 'Van', 'Wagon', 'Hot Hatch', 'Diesel', 'Convertible', 'Track Car', 'Estate Wagon', 'Shooting Brake', 'Off Roader', 'Camper', 'Taxi', 'Sports Saloon', 'Kit Car', 'Panel Van', 'City Car', 'Grand Tourer',],
      car2: ['Something Newer', 'The Modern One', 'A Rental', 'Its Replacement', 'The Expensive Version'],
      part: ['Clutch', 'Head Gasket', 'Suspension', 'Gearbox', 'Brake System', 'Wiring Loom', 'Turbo', 'Radiator', 'Sills', 'Timing Belt', 'Alternator', 'Injectors', 'Exhaust', 'Steering Rack', 'Driveshaft', 'Cooling System', 'Fuel Pump', 'Battery Pack', 'Bushings', 'Clutch Pedal', 'Handbrake', 'Differential',],
      price: ['Two Thousand', 'Five Thousand', 'Ten Thousand', 'Under A Grand', 'Book Value'],
      distance: ['Three Countries', 'A Continent', 'Nine Hundred Miles', 'The Long Way'],
    },
  },
  fitness: {
    patterns: [
      '{span} Of {training}, Honestly',
      'The {element} Nobody Programs',
      'How To {verb} Without Getting Hurt',
      '{training} For People With No Time',
      'Why Your {element} Is Not Improving',
      '{number} Weeks Of {training}',
      'The Cheapest Way To {verb}',
      'What {span} Of {training} Actually Did',
      'Fixing {element} In Ten Minutes A Day',
      'Coming Back From {injury}',
      'Training Around {injury}',
      'The {element} Test, Repeated',
      'One Session, Broken Down',
      'Stop Doing {training} Like This',
    ],
    slots: {
      ...COMMON_SLOTS,
      training: ['Squats', 'Easy Running', 'Deadlifts', 'Intervals', 'Zone Two', 'Bodyweight Work', 'Kettlebells', 'Rowing', 'Swimming', 'Hill Repeats', 'Mobility Work', 'Pressing', 'Lunges', 'Pull Ups', 'Sled Pushes', 'Farmers Carries', 'Sprints', 'Step Ups', 'Planks', 'Turkish Get Ups', 'Cycling', 'Skipping', 'Hinge Work', 'Overhead Work',],
      element: ['Grip', 'Hips', 'Ankles', 'Posture', 'Breathing', 'Recovery', 'Sleep', 'Warm Up', 'Tempo', 'Volume', 'Knees', 'Shoulders', 'Core', 'Wrists', 'Calves', 'Balance', 'Cadence', 'Consistency',],
      verb: ['Get Stronger', 'Run Further', 'Move Better', 'Lift Heavier', 'Stay Injury Free', 'Train At Home'],
      injury: ['A Bad Back', 'A Torn Calf', 'Shin Splints', 'A Frozen Shoulder', 'Runners Knee', 'Tennis Elbow', 'A Sprained Ankle', 'A Slipped Disc', 'Plantar Fasciitis', 'A Pulled Hamstring', 'A Stress Fracture', 'A Rotator Cuff Tear',],
    },
  },
  music: {
    patterns: [
      'The {element} In {song}',
      'How {song} Was Built',
      'Why {song} Works And {song2} Does Not',
      '{element}, Explained With One Song',
      'Playing {song} Properly',
      'The {element} Trick Behind {song}',
      '{number} Songs That Use {element}',
      'Recording {instrument} In One Room',
      'The Whole Session: {song}',
      'What A {role} Actually Does',
      'Mixing {instrument} Without Ruining It',
      '{song} Without The {instrument}',
      'The Arrangement Of {song}',
      'One Chord, {number} Songs',
    ],
    slots: {
      ...COMMON_SLOTS,
      element: ['Bass Line', 'Chord Voicing', 'Rhythm', 'Reverb', 'Arrangement', 'The Bridge', 'Countermelody', 'Compression', 'Key Change', 'Silence', 'Groove', 'Harmony', 'Tempo', 'Dynamics', 'Modulation', 'Texture', 'Phrasing', 'The Hook', 'Counterpoint', 'Timbre',],
      song: ['Long Division', 'Harbor Light', 'Empty Handed', 'Slow Burn', 'Paper Moon', 'The Second Time', 'Blue Hour', 'Undertow', 'Cold Front', 'Half Past', 'Even Ground', 'Second Sight', 'Bright Water', 'The Turning', 'Small Hours', 'Ninth Street', 'Ash And Ember', 'Open Season',],
      song2: ['Its Follow Up', 'The Single', 'The Radio Edit', 'The Demo'],
      instrument: ['Drums', 'Piano', 'Bass', 'Strings', 'Vocals', 'Guitar', 'Synth', 'Brass', 'Organ', 'Cello', 'Saxophone', 'Banjo', 'Clarinet', 'Harp',],
      role: ['Producer', 'Mix Engineer', 'Session Player', 'Arranger', 'Mastering Engineer'],
    },
  },
  tech: {
    patterns: [
      '{device} After {span}',
      'The {device} Is Not What They Said',
      'Testing {device} Properly',
      '{device} Versus {device2}',
      'Inside The {device}',
      'Why {device} Feels {feeling}',
      'The {device} Nobody Bought',
      '{span} With {device}, No Sponsorship',
      'Repairing A {device}',
      'What {price} Gets You Now',
      'The {device} Benchmark Nobody Runs',
      'Setting Up {device} Correctly',
      '{device}, Measured Rather Than Reviewed',
      'The Cheapest {device} That Is Actually Good',
    ],
    slots: {
      ...COMMON_SLOTS,
      device: ['Laptop', 'Phone', 'Monitor', 'Camera', 'Microphone', 'Router', 'Keyboard', 'Tablet', 'Headphones', 'Drive', 'Handheld', 'Watch', 'Projector', 'E Reader', 'Speaker', 'Console', 'Scanner', 'Printer', 'Power Bank', 'Docking Station', 'Mouse', 'Webcam', 'Mixer', 'Recorder',],
      device2: ['Last Year Model', 'The Cheap One', 'The Pro Version', 'A Second Hand One'],
      feeling: ['Slow', 'Fast', 'Cheap', 'Overbuilt', 'Unfinished', 'Right', 'Loud', 'Quiet', 'Warm', 'Fragile', 'Solid', 'Rushed',],
      price: ['Two Hundred Dollars', 'Five Hundred Dollars', 'A Thousand Dollars', 'Half Price'],
    },
  },
  travel: {
    patterns: [
      '{span} In {place}',
      '{place} On {price} A Day',
      'The Slow Way To {place}',
      'Getting To {place} Without Flying',
      '{place} Out Of Season',
      'What Nobody Tells You About {place}',
      'The Night Train To {place}',
      'Walking {distance} Through {place}',
      'Eating In {place} For {price}',
      'Why I Went Back To {place}',
      '{place}, Second Class',
      'One Bag, {span}, {place}',
      'The Border Crossing Into {place}',
      'Missing The Last Train In {place}',
    ],
    slots: {
      ...COMMON_SLOTS,
      place: ['The North Coast', 'A Mountain Town', 'The Old Quarter', 'The Islands', 'A Border Region', 'The Delta', 'A Port City', 'The Highlands', 'A Desert Road', 'The Lakes', 'An Inland Sea', 'The Far South', 'A Fishing Town', 'The Steppe', 'A Hill Station', 'The Marshes', 'A Cathedral City', 'The Fjords', 'A Spa Town', 'The Pampas', 'An Oasis', 'The Archipelago', 'A Mining Valley', 'The Salt Lakes',],
      price: ['Twenty Dollars', 'Forty Dollars', 'Almost Nothing', 'A Hundred Dollars'],
      distance: ['Ninety Miles', 'Four Days', 'The Whole Coast', 'Two Valleys'],
    },
  },
  comedy: {
    patterns: [
      'The Bit About {subject}',
      '{subject}, But Worse',
      'Ten Minutes On {subject}',
      'Why {subject} Is Funny',
      'The {subject} Sketch',
      'Trying Not To Laugh At {subject}',
      'One Joke, {number} Rewrites',
      'Crowd Work: {subject}',
      'The Night {subject} Went Wrong',
      'New Material About {subject}',
      'Reading Old Notebooks About {subject}',
      '{subject} Is Not A Personality',
      'Bombing, And Then {subject}',
      'The Set About {subject}',
    ],
    slots: {
      ...COMMON_SLOTS,
      subject: ['Weddings', 'Airports', 'Landlords', 'Group Chats', 'Dentists', 'Hen Nights', 'Supermarkets', 'Bin Day', 'Car Parks', 'Family Christmas', 'Motorway Services', 'Dating Apps', 'Neighbors', 'Job Interviews', 'Sat Navs', 'School Runs', 'Bin Men', 'Passport Photos', 'Waiting Rooms', 'Return Policies', 'Self Checkouts', 'Roundabouts', 'Hotel Breakfasts', 'Group Holidays', 'Parents Evenings', 'Wedding Speeches', 'Fancy Dress', 'Gym Memberships',],
    },
  },
  news: {
    patterns: [
      'The {story} Story, Explained',
      'What The {source} Actually Says',
      '{story}: What We Know',
      'The Numbers Behind {story}',
      'We Got {story} Wrong',
      'Six Weeks Inside {story}',
      'The {source} Nobody Read',
      '{story}, One Year On',
      'Why {story} Matters More Than It Looks',
      'Following The Money In {story}',
      'The {source} That Changes {story}',
      'On The Ground: {story}',
      'The Quiet Part Of {story}',
      'Correcting The Record On {story}',
    ],
    slots: {
      ...COMMON_SLOTS,
      story: ['The Planning Row', 'The Contract', 'The Shortage', 'The Strike', 'The Merger', 'The Inquiry', 'The Overrun', 'The Recall', 'The Ruling', 'The Shutdown', 'The Audit', 'The Delay', 'The Closure', 'The Handover', 'The Backlog', 'The Fine', 'The Vote', 'The Deal', 'The Resignation', 'The Leak', 'The Bailout', 'The Freeze', 'The Verdict', 'The Reshuffle',],
      source: ['Report', 'Filing', 'Transcript', 'Dataset', 'Minutes', 'Judgment', 'Memo', 'Submission', 'Register', 'Ledger', 'Statement', 'Hearing', 'Disclosure', 'Bulletin',],
    },
  },
  fashion: {
    patterns: [
      'The {garment} Problem',
      'How A {garment} Should Fit',
      '{number} {garment} Options, Honestly Priced',
      'Buying A {garment} Once',
      'The {cloth} {garment}, Explained',
      'What A Tailor Does To A {garment}',
      '{garment}s Under {price}',
      'Why Your {garment} Looks Wrong',
      'A Hundred Years Of The {garment}',
      'Second Hand {garment} Hunting',
      'The {cloth} Nobody Understands',
      'Wearing One {garment} For {span}',
      'The {garment} Is Back, Apparently',
      'Repairing A {garment} Properly',
    ],
    slots: {
      ...COMMON_SLOTS,
      garment: ['Jacket', 'Trouser', 'Shirt', 'Coat', 'Knit', 'Shoe', 'Suit', 'Dress', 'Denim', 'Boot', 'Scarf', 'Belt', 'Watch', 'Bag', 'Cardigan', 'Blazer', 'Skirt', 'Jumper', 'Waistcoat', 'Overshirt', 'Chino', 'Loafer', 'Parka', 'Gilet',],
      cloth: ['Worsted', 'Flannel', 'Tweed', 'Linen', 'Cashmere', 'Canvas', 'Corduroy', 'Poplin', 'Denim', 'Cotton Twill', 'Moleskin', 'Cashmere Blend', 'Silk', 'Herringbone', 'Gabardine', 'Fleece',],
      price: ['A Hundred Dollars', 'Two Hundred Dollars', 'Five Hundred Dollars'],
    },
  },
  gaming: {
    patterns: [
      '{game} Is Better Than You Remember',
      'The {element} In {game}',
      'Finishing {game} After {span}',
      'Why {game} Failed',
      '{game} Without {element}',
      'The Hardest Part Of {game}',
      '{number} Hours Into {game}',
      'The Design Of {game}',
      'Replaying {game} On {difficulty}',
      'What {game} Taught Without Telling You',
      'The Patch That Broke {game}',
      'Speedrunning {game}, Explained',
      'The Ending Of {game}',
      '{game} Is Not For Everybody',
    ],
    slots: {
      ...COMMON_SLOTS,
      game: ['Hollow Ridge', 'The Long Dark Hall', 'Signal Lost', 'Iron Harbor', 'Nine Lanterns', 'Deep Field', 'The Cartographer', 'Last Ferry', 'Salt Flats', 'The Quiet Machine', 'Ashfall', 'Paper Tigers', 'The Ninth Gate House', 'Vermilion', 'Low Orbit', 'The Tidewalker', 'Gray Harvest', 'Stationkeeper', 'Foxglove', 'The Lantern Road',],
      element: ['Level Design', 'Combat', 'The Map', 'Difficulty', 'Sound', 'The Opening Hour', 'Inventory', 'Pacing', 'The Camera', 'Fast Travel', 'Progression', 'Bosses', 'The Economy', 'Saving', 'Multiplayer', 'The Tutorial', 'Crafting', 'Enemy Design',],
      difficulty: ['The Hardest Setting', 'One Life', 'No Upgrades', 'A Fresh Save'],
    },
  },
  home: {
    patterns: [
      'The {room}, Start To Finish',
      'Fixing {problem} Properly',
      'What A {trade} Actually Charges',
      '{room} On A {price} Budget',
      'The {problem} Nobody Diagnoses Correctly',
      'Doing The {room} Ourselves',
      '{span} Renovating One {room}',
      'Why Your {room} Is Cold',
      'The {trade} Job You Can Do Yourself',
      'Living Through A {room} Rebuild',
      'The Cheapest Fix For {problem}',
      'Planning A {room} Before Touching It',
      '{problem}: What It Really Costs',
      'One {room}, Three Layouts',
    ],
    slots: {
      ...COMMON_SLOTS,
      room: ['Kitchen', 'Bathroom', 'Loft', 'Hallway', 'Bedroom', 'Garden', 'Utility Room', 'Living Room', 'Garage', 'Porch', 'Cellar', 'Landing', 'Conservatory', 'Pantry', 'Shed', 'Attic', 'Driveway', 'Boot Room',],
      problem: ['Damp', 'Drafts', 'A Leaking Roof', 'Bad Wiring', 'Cracked Render', 'Rotten Sills', 'Low Water Pressure', 'Condensation', 'A Blocked Gutter', 'Subsidence', 'Sticking Doors', 'Noisy Pipes', 'A Cold Floor', 'Peeling Paint', 'A Failing Boiler', 'Blown Plaster',],
      trade: ['Electrician', 'Plumber', 'Plasterer', 'Roofer', 'Joiner', 'Tiler', 'Decorator', 'Surveyor', 'Glazier', 'Bricklayer', 'Carpet Fitter', 'Damp Specialist',],
      price: ['Five Thousand', 'Ten Thousand', 'Twenty Thousand', 'Almost Nothing'],
    },
  },
  money: {
    patterns: [
      'The {topic} Nobody Explains',
      'What {span} Of {topic} Looks Like',
      '{topic}, With Real Numbers',
      'The Arithmetic Of {topic}',
      'Why {topic} Feels Worse Than It Is',
      'Reading A {document} Line By Line',
      '{topic} For People Who Hate {topic}',
      'The {document} You Should Check',
      'How Much {topic} Actually Costs',
      'One Household, {span} Of {topic}',
      'The Boring Answer To {topic}',
      '{topic} When You Are Self Employed',
      'The Mistake I Made With {topic}',
      'Tracking {topic} For {span}',
    ],
    slots: {
      ...COMMON_SLOTS,
      topic: ['Budgeting', 'Saving', 'Debt', 'A Mortgage', 'Pensions', 'Insurance', 'Tax', 'Investing', 'Rent', 'Bills', 'Credit', 'Emergencies', 'Overdrafts', 'Bills', 'Interest', 'Refunds', 'Bonuses', 'Cashflow', 'Wills', 'Fees', 'Salaries', 'Deposits',],
      document: ['Statement', 'Payslip', 'Tax Return', 'Mortgage Offer', 'Policy Schedule', 'Contract', 'Invoice', 'Statement Of Account', 'Pension Forecast', 'Loan Agreement', 'Bank Letter', 'Annual Report',],
    },
  },
  science: {
    patterns: [
      'The {thing}, Properly Explained',
      'How We Know About {thing}',
      '{thing} At Every Scale',
      'The Experiment That Found {thing}',
      'What {thing} Is Actually Doing',
      'Measuring {thing} At Home',
      'The Problem With {thing}',
      '{thing}: The Whole Argument',
      'Running The {thing} Experiment Again',
      'Why {thing} Is Harder Than It Sounds',
      'The Paper On {thing}, Read Properly',
      '{thing} Without The Metaphors',
      'The History Of Getting {thing} Wrong',
      'One Number: {thing}',
      '{span} Reading About {thing}',
      '{number} Things Nobody Tells You About {thing}',
      '{thing}, And Why It {judgement}',
      'The {thing} Question, {span} On',
    ],
    slots: {
      ...COMMON_SLOTS,
      thing: ['Entropy', 'The Tides', 'Antibiotics', 'Plate Tectonics', 'Photosynthesis', 'Radioactivity', 'The Immune System', 'Gravity', 'Sleep', 'Fermentation', 'Vaccines', 'The Water Cycle', 'Antibiotics Resistance', 'Enzymes', 'Magnetism', 'Erosion', 'Viruses', 'Pollination', 'Superconductors', 'Half Lives', 'Genetic Drift', 'Salt', 'Color Vision', 'Pain', 'Memory', 'Migration', 'Volcanoes', 'Rust', 'Orbits', 'Starlight', 'Eclipses', 'Comets', 'Black Holes', 'The Moon', 'Prime Numbers', 'Infinity', 'Probability', 'Symmetry', 'Clouds', 'Storms', 'Wind', 'Pressure Systems', 'Attention', 'Dreams', 'Addiction', 'Language',],
    },
  },
  history: {
    patterns: [
      'The {event}, In Order',
      'What The Records Say About {event}',
      '{event}: The Week It Happened',
      'The People Left Out Of {event}',
      'Standing Where {event} Happened',
      'The Economics Of {event}',
      '{event} Told Through One {object}',
      'Why {event} Is Taught Wrong',
      'The Year Before {event}',
      'Reading The {object} From {event}',
      '{event} And What Came After',
      'The Map That Explains {event}',
      'Ordinary Life During {event}',
      'The Aftermath Of {event}',
    ],
    slots: {
      ...COMMON_SLOTS,
      event: ['The Enclosure', 'The Great Fire', 'The Canal Boom', 'The Cotton Crash', 'The Long Winter', 'The Railway Mania', 'The Cholera Year', 'The Land Reform', 'The Mill Strike', 'The Harbor Blockade', 'The Grain Riots', 'The Turnpike Act', 'The Copper Strike', 'The Fen Drainage', 'The Wool Trade', 'The Salt Tax', 'The Bridge Collapse', 'The Poor Law', 'The Tram Boom', 'The Quarantine',],
      object: ['Ledger', 'Letter', 'Photograph', 'Map', 'Bill Of Sale', 'Diary', 'Census', 'Timetable', 'Bill', 'Almanac', 'Deed', 'Inventory', 'Broadsheet', 'Register', 'Receipt', 'Sketchbook',],
    },
  },
  outdoors: {
    patterns: [
      '{span} On {route}',
      'Wild Camping On {route}',
      'The {kit} That Survived {route}',
      '{route} In {weather}',
      'Walking {route} Alone',
      'What Went Wrong On {route}',
      'Packing For {route}',
      '{route}, Winter Conditions',
      'The Water Problem On {route}',
      'Three Nights Out On {route}',
      'Navigation On {route} Without A Phone',
      'The Cheapest Kit For {route}',
      '{route} At First Light',
      'Turning Back On {route}',
    ],
    slots: {
      ...COMMON_SLOTS,
      route: ['The Ridge', 'The Coast Path', 'The High Traverse', 'The River Route', 'The Old Drove Road', 'The Forest Loop', 'The Cirque', 'The Long Valley', 'The Cape Trail', 'The Watershed', 'The Corrie', 'The Saddle', 'The Moor Crossing', 'The Estuary', 'The Pine Belt', 'The Escarpment', 'The Tarn Circuit', 'The Sea Cliffs',],
      kit: ['Tent', 'Stove', 'Sleeping Bag', 'Pack', 'Boots', 'Waterproof', 'Mat', 'Filter', 'Compass', 'Head Torch', 'Poles', 'Bivvy Bag', 'Gaiters', 'Down Jacket',],
      weather: ['Driving Rain', 'Full Sun', 'Fog', 'A Gale', 'Snow', 'Thirty Degrees', 'Sleet', 'Hail', 'Low Cloud', 'A Heat Wave', 'Frost', 'A Steady Drizzle',],
    },
  },
  craft: {
    patterns: [
      'Making A {object} By Hand',
      'The {object}, From Rough Stock',
      '{span} Building One {object}',
      'The Joint That Holds A {object} Together',
      'Restoring A Broken {object}',
      '{object}: Every Step, No Talking',
      'The Hardest Part Of A {object}',
      'One {material}, One {object}',
      'Sharpening For {object} Work',
      'The {object} I Ruined Twice',
      'Traditional {object} Making',
      'Finishing A {object} Properly',
      'Tools For {object} Work',
      'A {object} That Will Outlast Me',
      '{span} On One {object}',
      'The {number} Cuts In A {object}',
      'A {object} That {judgement}',
      'Making A {object} From One {material}',
    ],
    slots: {
      ...COMMON_SLOTS,
      object: ['Chair', 'Bowl', 'Knife', 'Table', 'Box', 'Book', 'Bag', 'Lamp', 'Guitar', 'Cabinet', 'Kettle', 'Plane', 'Bench', 'Stool', 'Frame', 'Spoon', 'Bowl Saw', 'Chest', 'Screen', 'Handle', 'Shelf', 'Case', 'Tray', 'Mallet', 'Coat', 'Apron', 'Cushion', 'Violin', 'Mandolin', 'Ukulele', 'Satchel', 'Quilt',],
      material: ['Board', 'Billet', 'Hide', 'Ingot', 'Block', 'Sheet', 'Plank', 'Bar', 'Slab', 'Coil', 'Offcut', 'Blank',],
    },
  },
  talk: {
    patterns: [
      'A Conversation About {subject}',
      '{span} Talking About {subject}',
      'The Truth About {subject}',
      'How They Got Into {subject}',
      '{subject}: The Long Version',
      'What Nobody Says About {subject}',
      'The Question Everybody Avoids About {subject}',
      'Talking Honestly About {subject}',
      'The Working Life Behind {subject}',
      'Starting Over In {subject}',
      'The Worst Year In {subject}',
      'Twenty Years Of {subject}',
      'On {subject}, And Giving Up',
      'What {subject} Costs You',
    ],
    slots: {
      ...COMMON_SLOTS,
      subject: ['The Craft', 'Failure', 'The First Break', 'Money', 'Burnout', 'Ambition', 'Rejection', 'Working Alone', 'Getting Older', 'Being Wrong', 'The Long Haul', 'Starting Again', 'The First Failure', 'Being Typecast', 'Money And Friends', 'Leaving A Career', 'Working With Family', 'The Bad Boss', 'Imposter Feelings', 'Going Freelance', 'Turning Fifty', 'The Move Abroad', 'Saying No', 'The Break Year',],
    },
  },
};

/**
 * Builds one title. Two calls with the same seeded generator give the same one.
 *
 * A channel with a beat draws its subject from that beat rather than from the
 * whole shelf, which is how an astronomy channel stays an astronomy channel.
 */
export function makeTitle(topic: Topic, beat: readonly string[] | undefined, rng: Rng): string {
  const kit = TITLE_KITS[topic];
  const pattern = rng.pick([...kit.patterns]);
  const narrowed = BEAT_SLOT[topic];
  const filled = pattern.replace(/\{(\w+)\}/g, (whole, slot: string) => {
    if (beat && beat.length > 0 && slot === narrowed) return rng.pick([...beat]);
    const options = kit.slots[slot];
    return options ? rng.pick([...options]) : whole;
  });
  return tidy(filled);
}

/**
 * A pattern that already carries a definite article and a subject that also
 * starts with one produce a doubled article, which nobody has ever typed.
 * This is the copy editor that takes the second one out.
 */
function tidy(title: string): string {
  return title
    .replace(/\bThe (?:The|A|An) /g, 'The ')
    .replace(/\bA (?:The|A|An) /g, 'The ')
    .replace(/\ban (?=[bcdfgjklmnpqrstvwxyz])/gi, (m) => (m[0] === 'A' ? 'A ' : 'a '))
    .replace(/\s{2,}/g, ', ')
    .trim();
}

/** How many different titles a subject can make, for the checker to count. */
export function titleSpace(topic: Topic): number {
  const kit = TITLE_KITS[topic];
  let total = 0;
  for (const pattern of kit.patterns) {
    let combos = 1;
    for (const [, slot] of pattern.matchAll(/\{(\w+)\}/g)) {
      combos *= kit.slots[slot!]?.length ?? 1;
    }
    total += combos;
  }
  return total;
}

// ---------------------------------------------------------------------------
// The description under the video
// ---------------------------------------------------------------------------

const DESCRIPTION_OPENERS: readonly string[] = [
  'Everything is in the video. Timestamps below.',
  'Filmed over two days. No sponsor on this one.',
  'A long one. Make a cup of tea first.',
  'Follow up to the last video, which you should watch first.',
  'Sources and further reading in the pinned comment.',
  'Shot on what I had. It was that or not make it.',
  'Third attempt at this. The first two did not work.',
  'Recorded in one take because the second one was worse.',
  'Thanks to everybody who asked for this.',
  'The full version, uncut, as promised.',
  'This one took a month. I hope it shows.',
  'Corrections go in the pinned comment as they come in.',
];

export function makeDescription(rng: Rng, tagline: string): string {
  return `${rng.pick([...DESCRIPTION_OPENERS])} ${tagline}`;
}

// ---------------------------------------------------------------------------
// The comment section
// ---------------------------------------------------------------------------

export type CommentBand = 'praise' | 'warm' | 'pedantic' | 'offtopic' | 'critical' | 'harsh';

/**
 * Real comment sections are full of emoji, so these are too. They sit in the
 * content rather than in the interface: SLATE's own screens are words, and a
 * comment somebody typed is not one of SLATE's screens.
 */
export const COMMENT_LINES: Readonly<Record<CommentBand, readonly string[]>> = {
  praise: [
    'This is the best thing on this whole platform and it has four thousand views.',
    'I have watched this three times. Still finding new things.',
    'The amount of work in this is obvious and nobody is paying you enough.',
    'Genuinely changed how I look at this. Thank you.',
    'You explained in nine minutes what a whole course did not.',
    'Instant subscribe. Went straight into the back catalog after.',
    'This is what the algorithm should be pushing instead of what it pushes.',
    'The edit on this is so clean I did not notice it once.',
    'Sent this to three people already.',
    'You have earned a very long career off the back of videos like this.',
    'The pacing is perfect. Not one wasted second.',
    'Been waiting years for somebody to explain this properly.',
    'no because this actually changed how I think about it 😭🙏',
    'the production value here is insane 🔥',
    '10/10 no notes 👏👏',
    'how is this free 😭',
    'okay the transition at 6:40 😮‍💨',
    'criminally underrated channel 💯',
    'I have watched this at least 5 times 😂❤️',
  ],
  warm: [
    'Good one. Cheers.',
    'Watched this with my dinner. Very pleasant.',
    'Nice work as always.',
    'This came up at exactly the right time for me.',
    'Enjoyed that. The bit in the middle especially.',
    'Great stuff. Looking forward to the next one.',
    'Comment for the algorithm. Keep going.',
    'Lovely to see somebody take their time over something.',
    'Sunday morning sorted.',
    'Been subscribed since about forty thousand. Still the best.',
    'The dog in the background made this.',
    'You sound tired. Get some sleep, the video was great.',
    'great video as always 👍',
    'watching while I do the washing up 😌',
    'algorithm did me a favor today ☺️',
    'early gang 🙋',
    'commenting so this gets pushed 📈',
    'the dog at 3:12 🐕',
  ],
  pedantic: [
    'At 4:12 you say it the wrong way round. Small thing, otherwise good.',
    'Technically that is not quite right but the point stands.',
    'Source on the number at the start?',
    'The second example is a bit of a stretch honestly.',
    'You skipped the obvious counterexample here.',
    'Worth noting this varies a lot by region.',
    'Not to be that person, but the date is off by a year.',
    'This was covered in a paper in the eighties and it went further.',
    'Good video but the audio is quiet on the left channel.',
    'You are conflating two different things at about the ten minute mark.',
    'Half of this only applies if you already have the expensive version.',
    'Would love a follow up that actually addresses the exceptions.',
    'small correction at 2:04 but otherwise solid 🤓',
    'source? 🙂',
    'this is regional though, worth saying ⚠️',
    'the audio is a bit hot on the left 🎧',
  ],
  offtopic: [
    'Anybody else here from the other video?',
    'What is the song at the end?',
    'Where is the jacket from?',
    'The algorithm sent me here at two in the morning and I am not mad.',
    'Who else is watching this instead of doing what they should be doing?',
    'I have no idea why this was recommended to me and I watched all of it.',
    'That is the exact same table my grandmother had.',
    'Came for the thumbnail, stayed for the whole thing.',
    'Third video of yours tonight.',
    'Reading the comments before watching, as is tradition.',
    'The camera work made me want to go outside.',
    'Not related but your microphone sounds excellent.',
    'who else is here at 3am 😴',
    'song at the end?? 🎵',
    'came from the shorts 👀',
    'anyone else get recommended this out of nowhere 😅',
    'the mic sounds great btw 🎙️',
  ],
  critical: [
    'Felt about six minutes too long honestly.',
    'This is fine but it does not really say anything new.',
    'The premise falls apart if you think about it for a minute.',
    'Disagree with basically all of this, but fairly argued.',
    'The music is way too loud under the voice.',
    'Feels like this was made to hit a length rather than to say something.',
    'You have made this same video three times now.',
    'The conclusion does not follow from anything before it.',
    'I wanted to like this and I did not.',
    'Sponsored segment right in the middle of the argument. Come on.',
    'Less of the intro, more of the actual thing please.',
    'The thumbnail promised something the video did not deliver.',
    'felt way too long ngl 😬',
    'clickbait thumbnail, mid video 🤷',
    'you have made this exact video before 🙃',
    'sponsor segment right in the middle 💀',
  ],
  harsh: [
    'Nobody asked for this.',
    'Every single video is the same and you know it.',
    'Painful to listen to. Get someone else to present.',
    'How does this have any subscribers at all.',
    'Genuinely one of the worst things I have watched this year.',
    'Delete the channel.',
    'Talking with your hands does not make you interesting.',
    'You clearly have no idea what you are talking about.',
    'This is why people do not take any of this seriously.',
    'Stop. Just stop.',
    'Unwatchable. Unsubscribed after four years.',
    'Whoever told you this was good lied to you.',
    'nobody asked 💀',
    'unwatchable 🤮',
    'quit 🚮',
    'this channel fell off so hard 📉',
  ],
};

/** Handles for the people in a comment section, which are not anybody's. */
const HANDLE_HEADS: readonly string[] = [
  'quiet', 'north', 'paper', 'iron', 'salt', 'blue', 'grey', 'late', 'first', 'half',
  'open', 'slow', 'wide', 'dry', 'lamp', 'river', 'stone', 'sharp', 'plain', 'winter',
  'hollow', 'copper', 'amber', 'still', 'long', 'small', 'bright', 'low', 'far', 'old',
];

const HANDLE_TAILS: readonly string[] = [
  'field', 'harbour', 'lane', 'works', 'house', 'radio', 'press', 'garden', 'signal', 'archive',
  'kitchen', 'bench', 'window', 'ferry', 'market', 'attic', 'station', 'orchard', 'bridge', 'yard',
  'club', 'room', 'street', 'hill', 'tape', 'reel', 'letter', 'notes', 'diary', 'shed',
];

export function makeHandle(rng: Rng): string {
  const tail = rng.chance(0.55) ? `${rng.int(2, 99)}` : '';
  return `@${rng.pick([...HANDLE_HEADS])}${rng.pick([...HANDLE_TAILS])}${tail}`;
}

/** How many different comments the library can produce, for the checker. */
export function commentSpace(): number {
  return Object.values(COMMENT_LINES).reduce((total, lines) => total + lines.length, 0);
}

// ---------------------------------------------------------------------------
// Thumbnails
// ---------------------------------------------------------------------------

/**
 * The picture on the front, which is most of whether anybody clicks. These are
 * described rather than drawn: SLATE has no artwork, and saying what the frame
 * shows is honest where inventing a still would not be.
 */
export const THUMBNAILS: readonly { id: string; label: string; clickBias: number; note: string }[] = [
  { id: 'frame', label: 'A Frame From It', clickBias: 0.9, note: 'Honest, and it undersells every time.' },
  { id: 'face', label: 'Your Face, Reacting', clickBias: 1.18, note: 'It works, and you will hate looking at it.' },
  { id: 'text', label: 'Three Words, Large', clickBias: 1.1, note: 'Clear, and it dates badly.' },
  { id: 'before', label: 'Before And After', clickBias: 1.25, note: 'The best one, when the video earns it.' },
  { id: 'object', label: 'The Thing, On White', clickBias: 1.05, note: 'Clean. Works for anything you can hold.' },
  { id: 'arrow', label: 'An Arrow And A Circle', clickBias: 1.3, note: 'Everybody knows. Everybody still clicks.' },
  { id: 'plain', label: 'Just The Title', clickBias: 0.72, note: 'Nobody clicks this, and you know why.' },
];

export const THUMBNAIL_BY_ID: Readonly<Record<string, (typeof THUMBNAILS)[number]>> =
  Object.fromEntries(THUMBNAILS.map((t) => [t.id, t]));
