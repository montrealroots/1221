// Corrects what the completion matrix still said of Home's rows after briefs 23 and 24 (2026-10-24, the owner's brief 26,
// "fix whatever and all thats stale"): the matrix showed each audit row's goal as the review's claim of 2026-10-13, so
// h-money, h-school and h-papers still described Your Affairs' lines on Home, h-where-weather two panels, h-needs the
// notices under the questions and h-calendar a Calendar section, none of which Home has had since 2026-10-23. SETS give
// each its `claim` as the code stands (a field merge-review.cjs applies from this day, which the matrix shows before the
// review's); EDITS replace a text found exactly once. A row keeps what it said before in the past tense, with the day it
// stopped being so. Run from anywhere: node docs/verification/pipeline/fix-citations-1024.cjs
const fs = require('fs');
const S = require('path').join(__dirname, 'inputs') + '/';
const df = JSON.parse(fs.readFileSync(S + 'doc-fields.json', 'utf8'));

const SETS = {
  'h-money': { claim: 'The head of Money says the worth, “Worth $…, after $… owed.” (WorthWords, Glance.tsx:33-43, mounted at BankWorkspace.tsx:297), and “Your account is overdrawn.” while the primary balance is negative; what money needs putting right (money owed unpaid, an overdrawn account, a card near its limit or behind, a debt in collections) is a line under What Needs You on Home with Open Money (thingsToDo, Home.tsx:568-608), the button open once “Your Bank” is read. Until 2026-10-23 (brief 23) Home’s Your Affairs had a Money line, ‘<primary account name>: <balance>. Worth <net worth>[, <liabilities> of it owed].’, with its bank button, locked until “Money”.' },
  'h-school': { claim: 'The head of School reads ‘<where>, <standing>. You’re <rank> of 16 in the class. Next: <label>, <date>.’ (SchoolGlance, Glance.tsx:51-70, mounted at SchoolWorkspace.tsx:89), <where> Arriving, Year N, On Leave, Graduated or Left the School and Next the first pending school item that wants the player, else the next classes; a standing of concern, warning or dismissed is a line under What Needs You on Home with Open School (thingsToDo, Home.tsx:568-608). Until 2026-10-23 (brief 23) Home’s Your Affairs School line (Home.tsx:480-505 that day) said the same.' },
  'h-papers': { claim: 'The head of Papers reads ‘Cover: <coverLabel or none>.’, ‘Unemployment, $X a week.’ with a claim, and what the returns and taxes ask (PapersGlance and papersAlerts, Glance.tsx:79-129, mounted at PapersWorkspace.tsx:450): no cover, an open return’s due date with what filing it would pay and the late penalty once past due, tax owed and growing; each is a line under What Needs You on Home with Open Papers, a return’s held back while its own question is open (thingsToDo, Home.tsx:568-608). Until 2026-10-23 (brief 23) Home’s Papers line in Your Affairs (Home.tsx:511-540 that day) said the same.' },
  'h-where-weather': { claim: 'Today’s line under the greeting names the time, the town, its region, the zone and the season, and once “Your Life, Hour By Hour” is read the daylight, each a way into its look; the sky beside it, once “Weather” is read, shows the temperature, the condition, the high and low and the five days ahead, each opening its day (Home.tsx:134-215); until each chapter, a locked button in its place. The town’s country, money, people and Local Time, and the sky’s humidity, wind and climate, are in their looks. Until 2026-10-23 (brief 23) Where You Are and Weather were panels of their own on Home, the first saying ‘Home.’ of the town.' },
  'h-needs': { claim: 'What Needs You lists the open questions (title, due or Overdue, detail, Read It All past 160 characters), each answer sending world.take_decision_action, Go There navigating and Dismiss sending world.dismiss_decision, six and then Show All N; under them what needs putting right, each with Open <screen> and its How This Works (thingsToDo); with nothing waiting, one All Clear line (Home.tsx:218-275; on a phone on its side the most pressing one and Show All N). The unread notices are Recent Updates’ (the four most important, a repeated one a single line) and Updates’ (every one), Mark N Read and Mark Read sending world.mark_read (Home.tsx:279-328). Until 2026-10-23 (brief 23) the notices were under the questions here, with Mark N Read in this head and Show All N past six.' },
  'h-calendar': { claim: 'Up Next shows the next commitment (its time to go, its title, its date and time, its own city’s clock where it names another, ‘you’re not in <city>’ when away with no trip of its own, and the full night before it while one’s still to be had) or ‘No plans or commitments ahead.’, up to five more, and Open Calendar (open once “What’s Coming” is read) to /workspace/calendar, where Back To Home brings you back (Home.tsx:274, 423-513). Until 2026-10-23 (brief 23) it was Home’s Calendar section, the words the same; until brief 24 that day Open Calendar waited for “Your Own Plans”, the menu’s Calendar bridging the gap.' },
};

const EDITS = [
  ['h-calendar', 'entry', "Calendar panel (Home.tsx:148-210; another city’s clock and 'you’re not in' at :170-179)", "Up Next (Home.tsx:274, drawn at :423-513; another city’s clock and ‘you’re not in’ at :456-471; Open Calendar at :438). Until 2026-10-23 (brief 23) the Calendar panel (Home.tsx:148-210 that day; the clock and ‘you’re not in’ at :170-179); its button opened with “Your Own Plans” until brief 24 later that day"],
];

let n = 0;
for (const [id, fields] of Object.entries(SETS)) { const row = (df[id] ??= {}); for (const [k, v] of Object.entries(fields)) { row[k] = v; n += 1; } }
for (const [id, field, from, to] of EDITS) {
  const row = df[id];
  if (!row || row[field] === undefined) throw new Error(`${id}.${field}: not in doc-fields.json`);
  const at = row[field].split(from).length - 1;
  if (at !== 1) throw new Error(`${id}.${field}: found ${at} times: ${from}`);
  row[field] = row[field].replace(from, () => to);
  n += 1;
}
fs.writeFileSync(S + 'doc-fields.json', JSON.stringify(df, null, 1));
console.log(`${n} fields set or edited`);
