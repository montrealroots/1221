// Corrects the rows tools/coverage.mjs found not holding after 2026-10-23's changes (the owner's brief 23: Home read in
// the day's order, Your Affairs gone from it, its lines at the heads of Money, School and Papers, the notices Recent
// Updates and Updates), in doc-fields.json and renames.json, which merge-review.cjs applies. EDITS replace a text found
// exactly once; SETS write a field whole, where the row's place moved with the panel it was about. A row keeps what it
// said before in the past tense, with the day it stopped being so.
const fs = require('fs');
const S = require('path').join(__dirname, 'inputs') + '/';
const ROOT = require('path').join(__dirname, '../../..') + '/';
const df = JSON.parse(fs.readFileSync(S + 'doc-fields.json', 'utf8'));
const renames = JSON.parse(fs.readFileSync(S + 'renames.json', 'utf8'));
const audit = {};
for (const a of ['life', 'school', 'money', 'papers', 'ui']) for (const i of JSON.parse(fs.readFileSync(`${ROOT}docs/verification/audit/${a}.json`, 'utf8')).items) audit[i.id] = i;

const RENAMES = {
  // Round three's shortened citation of the Scraping card's test, whose full title renames.json already follows.
  'PLAYER JOURNEY: a Scraping family’s card … charged off 180 days past the first due date missed … the checking still named on the Money line …': 'PLAYER JOURNEY: a Scraping family’s card … charged off 180 days past the first due date missed … the checking still listed on Money …',
};

const EDITS = [
  // health.dental's lines in defects-g8-4.test.ts aren't here: they're the health-eligibility area's row text
  // (docs/verification/remaining/), which remaining-fold.cjs writes over doc-fields.json on every run, so an edit here
  // was undone by the next regeneration (tried on 2026-10-23). The Papers test above them was kept to its old length.
  ['h-head', 'tests', "'PLAYER JOURNEY: on the first morning it reads Monday, August 24, 2026 · Actress, Good Morning, Ada., and 7:30 AM in New Haven · EDT · Summer with the sky as it is; each opens its look, and none of it changes the save'", "'PLAYER JOURNEY: on the first morning it reads Monday, August 24, 2026 · Actress, Good Morning, Ada., and 7:30 AM in New Haven, Connecticut · EDT · Summer · its daylight, with the sky as it is beside it; each opens its look, and none of it changes the save'"],
  ['h-needs', 'tests', '‘PLAYER JOURNEY: Dismiss and Mark N Read, pressed on the panel…; a reload keeps it so, and the return still files’', '‘PLAYER JOURNEY: Dismiss, pressed on the panel, takes the row away…; a reload keeps it so, and the return still files’, "PLAYER JOURNEY: more unread than Recent Updates’ four: it says how many more and View All Updates goes to Updates…"'],
  ['h-needs', 'tests', '‘PLAYER JOURNEY: on 1 February 2027 the notices under her return are the six most pressing of 159…’', '‘PLAYER JOURNEY: on 1 February 2027 Recent Updates draws the four most pressing of 159 notices…’'],
  ['h-needs', 'tests', '‘PLAYER JOURNEY: File It pressed with nothing in the bank… You owe $166 of income tax…’', '‘PLAYER JOURNEY: File It pressed with nothing in the bank files her return unpaid, and What Needs You says $166 of tax owed…’'],
  ['h-needs', 'tests', 'tools/acceptance-ui.mjs:196', 'tools/acceptance-ui.mjs:198'],
  ['h-needs', 'tests', 'Until 2026-10-14 unpaid, near-limit, medical and collections rested only on TEST SETUP debts;', 'Until 2026-10-23 (brief 23) every unread notice was under the questions, where Recent Updates has the four most important and Updates every one. Until 2026-10-14 unpaid, near-limit, medical and collections rested only on TEST SETUP debts;'],
  ['h-needs', 'explanation', 'the sentence went: an unsuspended card is a payment behind (Home.tsx:65-68).', 'the sentence went: an unsuspended card is a payment behind (Home.tsx:518-526 from 2026-10-23, in thingsToDo, which says too what Your Affairs’ lines said needed doing until that day).'],
  ['h-how', 'tests', "'PLAYER JOURNEY: a meal, eaten through Look After Yourself, fills her and the meters move…'", "'PLAYER JOURNEY: a meal, eaten through Look After Yourself on How You Are, fills her and the meters move…'"],
  ['h-where-weather', 'tests', "'PLAYER JOURNEY: on the first morning Where You Are names New Haven, Connecticut · United States, says Home. 130K people., Local Time 7:30 AM EDT, and Daylight within two minutes of the sunrise equation’s at each end'", "'PLAYER JOURNEY, guided: Where You Are and the Weather, locked, are buttons whose reason names the chapter that opens each…', 'PLAYER JOURNEY: on the first morning Today names New Haven, Connecticut, its local time 7:30 AM EDT and its daylight within two minutes of the sunrise equation’s at each end…'"],
  ['h-where-weather', 'tests', "'PLAYER JOURNEY: the Weather is the sky now in °F with its high and low, humidity, the wind in miles an hour, the climate, and the five days ahead…'", "'PLAYER JOURNEY: the Weather is the sky now in °F with its high and low and the five days ahead, its look the humidity, the wind in miles an hour and the climate…'"],
  ['h-where-weather', 'tests', 'Until 2026-10-13 no test rendered the panels.', 'Until 2026-10-23 (brief 23) they were panels of their own, Where You Are and the Weather; until 2026-10-13 no test rendered the panels.'],
  ['h-papers', 'tests', '‘PLAYER JOURNEY: the return the tax season raised is “due April 15, 2027, $166 to pay”…; the Papers button opens Papers’', '‘PLAYER JOURNEY: the return the tax season raised is “due April 15, 2027, $166 to pay”…’'],
  ['h-papers', 'tests', 'Until 2026-10-13 this said no test rendered Home, though defects-g8-4 rendered this line.', 'Until 2026-10-23 (brief 23) these read Your Affairs’ Papers line on Home, and its button to Papers; Papers’ head says it from then, and What Needs You on Home what of it needs doing. Until 2026-10-13 this said no test rendered Home, though defects-g8-4 rendered this line.'],
  ['h-papers', 'explanation', '(taxreturn.ts:523: the IRS’s and the states’, each with its interest and penalty to today, as the Papers screen’s; Home.tsx:527)', '(taxreturn.ts:523: the IRS’s and the states’, each with its interest and penalty to today, as the Papers screen’s; Glance.tsx:92 from 2026-10-23, Home.tsx:527 until then)'],
  ['h-papers', 'explanation', 'it says so only once something owed is past its due date since (Home.tsx:536).', 'it says so only once something owed is past its due date since (Glance.tsx:100-101 from 2026-10-23, Home.tsx:536 until then).'],
];

const SETS = [
  ['h-head', 'entry', 'Home’s head, Today: the date and her calling, the greeting and her name, the time, the town, its region, zone and season, its daylight once Where You Are is open, and the sky beside it (Home.tsx:99-175; partOfDay at :548, calledBy at :564). Until 2026-10-23 (brief 23) the head said the date, the name, the town, the zone, the season and the weather, and Where You Are and the Weather were panels of their own.'],
  ['h-needs', 'entry', 'What Needs You: the questions, the first six and Show All past them, Dismiss and Go There, and the things to put right with Open and their screen’s How This Works, or All Clear (Home.tsx:178-221; thingsToDo at :506-546, needsLine at :289). Recent Updates: the four most important unread notices, Mark Read, Mark N Read, Go There and View All Updates (Home.tsx:228-274); Updates keeps every notice (Updates.tsx). Until 2026-10-23 (brief 23) every unread notice was under the questions, with Mark Read and Mark N Read there, and the weighing sentences were at Home.tsx:49-75.'],
  ['h-how', 'entry', 'How You Are: the line that sums her up, Energy, Stress and Readiness, and the first two things Look After Yourself offers, done as the bar’s menu does them (Home.tsx:452-498). Until 2026-10-23 (brief 23) it had the three meters alone (Home.tsx:320-339 that day), and Look After Yourself was in the bar alone.'],
  ['h-where-weather', 'entry', 'Today’s town, region, zone, season and daylight, and the sky beside it with the five days ahead, at the head of Home (Home.tsx:114-136, 142-174). Until 2026-10-23 (brief 23) they were panels of their own, Where You Are and the Weather (Home.tsx:341-388, 390-441 that day); until 2026-10-13 this cited 338-436.'],
  ['h-where-weather', 'explanation', 'The town opens on where she lives (“This is where you live.”), the city homeCityOf (world/place.ts) returns, since nothing has moved a player since the scope reset of 2026-10-09; until 2026-10-23 (brief 23) the Where You Are panel said Home. of it. Until 2026-10-13 the panel kept an away line, the distance and hours from home, and a Local Time note of hours from home, which nothing reached; both went that day (Home.tsx:356-362 then).'],
  ['h-school', 'entry', 'The head of School: the year and the standing, then her place in the class and what’s next (SchoolGlance, Glance.tsx:51-70, mounted at SchoolWorkspace.tsx:89); a standing of concern, warning or dismissal is put right from What Needs You on Home (thingsToDo, Home.tsx:537-539). Until 2026-10-23 (brief 23) it was Your Affairs’ School line on Home (SchoolLine, Home.tsx:484-516, mounted at :458).'],
  ['h-school', 'tests', 'tests/evidence-g33-ui.test.ts h-school: ‘PLAYER JOURNEY: a new student is “Arriving for the fall term”, her place counted from the class’s skills…’, ‘a day in, “Year 1 of 3, good standing”…’, ‘PLAYER JOURNEY: a fall played without going to class ends in the faculty’s concern…’, ‘PLAYER JOURNEY: a personal leave asked on 13 January 2027 and begun on its decision is “On leave until …”, with no Next’, ‘PLAYER JOURNEY: withdrawn on 1 September 2026, “Left the School.”, with no Next and no alert, across a reload’, ‘a graduate’s head says Graduated once, not “Graduated, graduated”, with no Next’ (the degree set by setStanding: no played life reaches one in a test’s time), ‘PLAYER JOURNEY, guided: a standing of concern is put right from Home once “Drama School” is read, and not before’; tests/evidence2-b12.test.ts h-school: the fall recess’s and the winter’s Next from nextClasses, ‘PLAYER JOURNEY: a personal leave begun on its decision after a fall left to the clock is “On leave”, with the concern put right from Home and no Next’, ‘PLAYER JOURNEY: a first year left to the clock, its concern unremedied in the spring, is “Year 2 of 3, academic warning” in its second fall…’, ‘PLAYER JOURNEY: left to the clock, the warning unmet, the second fall’s evaluation dismisses her: “Left the School”, the dismissal on Home and no Next, across a reload’, and the place in the class as a worked literal; tests/evidence3-home.test.ts ‘h-school: PLAYER JOURNEY: the degree played, the School says “Graduated. You’re N of 16 in the class.”…’. Until 2026-10-23 (brief 23) these read Your Affairs’ School line on Home, “Arriving, good standing”, “On Leave, academic concern” and “Left the school, dismissed” among its words, and its Yale button to the School screen. Until 2026-10-13 this said no test rendered Home, though defects-g8-4, guide-examples-money and guide-examples-papers did, and none of them read this line.'],
  ['h-school', 'issue', 'None. Until 2026-10-13 a graduate’s line read ‘Graduated, graduated, N of 16 in the class.’; it says Graduated once since (evidence-g33-ui holds it, at the head of School from 2026-10-23).'],
  ['h-papers', 'entry', 'The head of Papers: what covers her, a claim’s weekly pay, and what the returns and taxes ask (PapersGlance and papersAlerts, Glance.tsx:79-129, mounted at PapersWorkspace.tsx:450); what of it needs doing is under What Needs You on Home (thingsToDo, Home.tsx:542-544), the return’s line held back while its own question is open. Until 2026-10-23 (brief 23) it was Your Affairs’ Papers line on Home (PapersLine, Home.tsx:518-552, mounted at :459).'],
  ['h-money', 'entry', 'The head of Money: the bank’s sum, then Worth, what she has less what she owes and, if she owes anything, how much (WorthWords, Glance.tsx:33-43, mounted at BankWorkspace.tsx:297), and “Your account is overdrawn.” (BankWorkspace.tsx:299); what needs putting right is under What Needs You on Home (thingsToDo, Home.tsx:514-534). Until 2026-10-23 (brief 23) it was Your Affairs’ Money line on Home (Home.tsx:449-457, in Your Affairs at :447).'],
  ['h-money', 'tests', 'tests/evidence-g33-ui.test.ts and tests/evidence2-b12.test.ts ‘h-money’ (the worth at the head of Money and its alert, what What Needs You says by play, Open Money, guided locks); tests/evidence-g33-ui.test.ts ‘a worth below nothing is written with the minus sign, as Money writes an overdrawn balance’; tests/evidence3-home.test.ts (why “No account” is reached by no life); tests/scope-money.test.ts ‘h-money’ (the fallback as a guard, and a student’s month ends across reloads against a twin: interest, income records, worth and line agree, counted once); tests/guide-examples-money.test.ts. Until 2026-10-23 (brief 23) these read Your Affairs’ Money line on Home and its button.'],
];

for (const [k, v] of Object.entries(RENAMES)) renames[k] = v;
const fieldOf = (id, field) => {
  const row = (df[id] ??= {});
  if (row[field] === undefined) {
    if (!audit[id]) throw new Error(`no row ${id}`);
    row[field] = field === 'corrected.now' ? audit[id].corrected?.now : audit[id][field];
    if (row[field] === undefined) throw new Error(`${id} has no ${field}`);
  }
  return row;
};
let n = 0;
for (const [id, field, from, to] of EDITS) {
  const row = fieldOf(id, field);
  const at = row[field].split(from).length - 1;
  if (at !== 1) throw new Error(`${id}.${field}: found ${at} times: ${from}`);
  row[field] = row[field].replace(from, () => to);
  n += 1;
}
for (const [id, field, text] of SETS) { fieldOf(id, field)[field] = text; n += 1; }
fs.writeFileSync(S + 'doc-fields.json', JSON.stringify(df, null, 1));
fs.writeFileSync(S + 'renames.json', JSON.stringify(renames, null, 1) + '\n');
console.log(`${n} edits, ${Object.keys(RENAMES).length} renames`);
