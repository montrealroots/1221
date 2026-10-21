/**
 * Whether anyone else in the walk's played life could be taken for the agent (brief 19, the app part's third defect
 * checked again, 2026-10-21). Defect 3 was a classmate called Jordan beside the agent Jordan Parente (`jordan.ts`); that
 * day the owner had a fictional agent, Thomas Ashgrove of Halberd Talent, take the real one's place (`59da1351`), and
 * this asks the same of him: is any classmate, teacher or other person the life meets named Thomas, Ashgrove or
 * something near either, and where do the agent's notices sit among the others in What Needs You.
 *
 *   npx vite-node docs/verification/career-2026-10-20/app/ashgrove.ts -- OUT.txt SAVEDIR [WALKDIR]
 *
 * PLAYED: the life `make-saves.ts` plays, by `make-saves.ts` itself, on its first default seed (`app-walk-112`), into a
 * folder of its own, with every notice the game is asked to say recorded as it is said (`Simulation.prototype.notify`
 * wrapped, so the log's cap of 500 loses nothing; a notice said inside a command the game then refused would be counted
 * too). Each of the nine saves it writes is compared with SAVEDIR's, the walk's, byte for byte, so the life read is the
 * life walked. Then: the class and every person in the save, each name held to `NEAR`; every notice naming anything
 * `NEAR` matches, his own told from the rest; every notice from the last term's first day whose title names a
 * classmate's first name; What Needs You's unread list in its own order at `follow-up.json`, an hour after his first
 * notice, and at `audition.json`, where this life's first part, Theo in Paper Moons, shares its name with a classmate,
 * Theo Sullivan; and, given WALKDIR (the walk's folder), every line of every surface the walk read that names him, his
 * agency or anything `NEAR` matches.
 */
import { mkdtempSync, readFileSync, readdirSync, existsSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Simulation } from '../../../../src/engine/core/simulation';
import { formatDateTime, instantFromZoned, MS_DAY } from '../../../../src/engine/core/time';
import { unreadNotifications } from '../../../../src/engine/world/world';
import { AGENTS, agencyOf } from '../../../../src/engine/content/agents';

const [OUT = 'ashgrove.txt', SAVEDIR = '.', WALKDIR] = process.argv.slice(2).filter((a) => a !== '--');
const SEED = 'app-walk-112';
const zone = 'America/New_York';
const AGENT = AGENTS[0]!;
const AGENCY = agencyOf(AGENT).name;
const [FIRST, LAST] = AGENT.name.split(' ') as [string, string];
/** A name that could be taken for his: Thomas and its short and near forms, anything beginning Ash, and his agency's. */
const NEAR = /\b(?:Thomas|Tomas|Tomás|Thom|Tom|Tommy|Thomson|Thompson)\b|\bAsh[a-z]*|Halberd/g;
const lines: string[] = [];
const say = (s = '') => { lines.push(s); };

// Every notice as it is said, from the first day.
const heard: { at: number; category: string; title: string; body: string; importance: number }[] = [];
const said = Simulation.prototype.notify;
Simulation.prototype.notify = function (this: Simulation, spec) {
  heard.push({ at: this.now, category: spec.category, title: spec.title, body: spec.body, importance: spec.importance ?? 50 });
  return said.call(this, spec);
};
const PLAYED = mkdtempSync(join(tmpdir(), 'ashgrove-'));
const argv = process.argv;
process.argv = [argv[0]!, argv[1]!, PLAYED, SEED];
const out = console.log;
console.log = () => {};
await import('./make-saves');
console.log = out;
process.argv = argv;
Simulation.prototype.notify = said;

say(`The life make-saves.ts plays on ${SEED}, played again by it into a folder of its own, against the walk's saves (${SAVEDIR.split('/').at(-1)}):`);
const names = ['last-term', 'after-new-york', 'follow-up', 'meeting', 'offered', 'audition', 'offer', 'work-day', 'paid'];
for (const n of names) {
  const mine = existsSync(`${PLAYED}/${n}.json`) ? readFileSync(`${PLAYED}/${n}.json`) : undefined;
  const walked = existsSync(`${SAVEDIR}/${n}.json`) ? readFileSync(`${SAVEDIR}/${n}.json`) : undefined;
  say(`  ${n}.json: ${!mine ? 'not written' : !walked ? 'not in the walk' : mine.equals(walked) ? 'the same to the byte' : 'DIFFERENT'}`);
}
const paid = JSON.parse(readFileSync(`${PLAYED}/paid.json`, 'utf8'));
const player = paid.people[paid.playerId];
const near = (s: string) => [...s.matchAll(NEAR)].map((m) => m[0]);

say('');
say(`The agent: ${AGENT.name} of ${AGENCY}. A name held to: ${NEAR.source}`);
say('');
const classmates: { name: string; title: string }[] = player.school?.classmates ?? [];
const former: { name: string }[] = (player.school?.formerClasses ?? []).flatMap((c: { classmates: { name: string }[] }) => c.classmates);
say(`The class (${classmates.length}): ${classmates.map((m) => m.name).join(', ')}`);
say(`Former classes' classmates: ${former.length ? former.map((m) => m.name).join(', ') : 'none'}`);
for (const m of [...classmates, ...former]) if (near(m.name).length) say(`  NEAR: classmate ${m.name}`);
const people = Object.values(paid.people) as { firstName: string; lastName: string; isPlayer?: boolean }[];
say(`People in the save (${people.length}): ${people.map((p) => `${p.firstName} ${p.lastName}${p.isPlayer ? ' (the player)' : ''}`).join(', ')}`);
for (const p of people) if (near(`${p.firstName} ${p.lastName}`).length) say(`  NEAR: person ${p.firstName} ${p.lastName}`);

const isHis = (t: string, b: string) => `${t} ${b}`.includes(AGENT.name) || `${t} ${b}`.includes(AGENCY);
const end = paid.now as number;
say('');
say(`Notices said from the first day to ${formatDateTime(end, zone)}: ${heard.length}; naming him or his agency: ${heard.filter((n) => isHis(n.title, n.body)).length}.`);
const firstHis = heard.find((n) => isHis(n.title, n.body));
say(`His first: ${firstHis ? `${formatDateTime(firstHis.at, zone)}, "${firstHis.title}"` : 'none'}`);
say('');
say('Every notice naming anything NEAR matches that is not his, in the order it came, days from his first notice:');
const others = heard.filter((n) => near(`${n.title} ${n.body}`).length && !isHis(n.title, n.body));
for (const n of others) say(`  ${formatDateTime(n.at, zone)} [${n.category}, importance ${n.importance}, ${firstHis ? ((n.at - firstHis.at) / MS_DAY).toFixed(1) : '-'} days] ${n.title}: ${n.body}  (NEAR: ${near(`${n.title} ${n.body}`).join(', ')})`);
if (!others.length) say('  none');
say('');
say(`His notices where a NEAR word isn't his name or his agency's (a bare "${FIRST}", "${LAST}" or "Halberd" alone):`);
const loose = heard.filter((n) => isHis(n.title, n.body)).filter((n) => near(`${n.title} ${n.body}`.replaceAll(AGENT.name, '').replaceAll(AGENCY, '')).length);
for (const n of loose) say(`  ${formatDateTime(n.at, zone)} ${n.title}: ${n.body}`);
if (!loose.length) say('  none');
say('');
say('How each of his notices names him in its title:');
const titles = new Map<string, number>();
for (const n of heard.filter((x) => isHis(x.title, x.body))) titles.set(n.title, (titles.get(n.title) ?? 0) + 1);
for (const [t, c] of titles) say(`  ${c > 1 ? `${c} x ` : ''}${t}`);
say('');
const term = instantFromZoned({ year: 2029, month: 1, day: 8, hour: 12, minute: 0 }, zone);
say(`Every notice from the last term's first day (${formatDateTime(term, zone)}) whose title names a classmate's first name, in the order it came, days from his first notice:`);
const firsts = new Set(classmates.map((m) => m.name.split(' ')[0]!));
const namesMate = (t: string) => [...firsts].some((f) => new RegExp(`\\b${f}\\b`).test(t));
const byName = heard.filter((n) => n.at >= term && namesMate(n.title));
for (const n of byName) say(`  ${formatDateTime(n.at, zone)} [${n.category}, ${isHis(n.title, n.body) ? 'HIS' : 'not his'}, ${firstHis ? ((n.at - firstHis.at) / MS_DAY).toFixed(1) : '-'} days] ${n.title}: ${n.body.slice(0, 200)}`);
if (!byName.length) say('  none');

// What Needs You, as the player has it (nothing in this life is ever marked read): at follow-up.json, an hour after his
// first notice, and at audition.json, the morning of the first audition, whose part shares its name with a classmate's.
for (const save of ['follow-up', 'audition']) {
  const u = JSON.parse(readFileSync(`${PLAYED}/${save}.json`, 'utf8'));
  const list = unreadNotifications({ universe: u } as unknown as Simulation);
  // A first name a notice near the top shares with a classmate, where the notice isn't the classmate's own (a School
  // notice from a classmate opens with their name: "Theo: A Request For Help", "Julian Asks To Rehearse").
  const own = (t: string, f: string) => t.startsWith(`${f}:`) || t.startsWith(`${f} `);
  const shared = new Set(list.slice(0, 15).flatMap((n) => [...firsts].filter((f) => new RegExp(`\\b${f}\\b`).test(n.title) && !own(n.title, f))));
  const mark = (n: { title: string; body: string }) => (isHis(n.title, n.body) ? '  <- HIS' : [...shared].some((f) => own(n.title, f)) ? '  <- THE CLASSMATE OF THAT NAME' : [...shared].some((f) => new RegExp(`\\b${f}\\b`).test(n.title)) ? '  <- SHARES A CLASSMATE\'S FIRST NAME' : '');
  say('');
  say(`What Needs You's unread notices at ${save}.json (${formatDateTime(u.now, zone)}), ${list.length} in all, as ordered: the first 15, then his and, for a first name a notice among them shares with a classmate (${shared.size ? [...shared].join(', ') : 'none'}), that classmate's own.`);
  list.forEach((n, i) => { if (i < 15 || mark(n)) say(`  ${i + 1}. [${n.importance}] ${formatDateTime(n.at, zone)} ${n.title}${mark(n)}`); });
}

if (WALKDIR) {
  say('');
  say(`The walk's surfaces (${WALKDIR}): every line naming ${AGENT.name}, ${AGENCY} or anything NEAR matches.`);
  for (const w of ['1440', '390']) {
    const dir = `${WALKDIR}/${w}`;
    if (!existsSync(dir)) continue;
    let his = 0;
    const odd: string[] = [];
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.txt')).sort()) {
      for (const l of readFileSync(`${dir}/${f}`, 'utf8').split('\n')) {
        if (!near(l).length) continue;
        his += 1;
        const rest = near(l.replaceAll(AGENT.name, '').replaceAll(AGENCY, ''));
        if (rest.length) odd.push(`  ${w}/${f}: ${l.trim().slice(0, 300)}  (NEAR, besides his name and his agency's: ${rest.join(', ')})`);
      }
    }
    say(`At ${w}: ${his} lines name him, his agency or a NEAR word; those with a NEAR word besides his full name and his agency's:`);
    for (const o of odd) say(o);
    if (!odd.length) say('  none');
  }
}
writeFileSync(OUT, `${lines.join('\n')}\n`);
rmSync(PLAYED, { recursive: true, force: true });
console.log(lines.join('\n'));
