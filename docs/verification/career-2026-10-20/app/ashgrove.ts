/**
 * Whether anyone else in the walk's played life could be taken for the agent (brief 19, the app part's third defect
 * checked again, 2026-10-21). Defect 3 was a classmate called Jordan beside the agent Jordan Parente (`jordan.ts`);
 * that day the owner had a fictional agent, Thomas Ashgrove of Halberd Talent, take the real one's place (`59da1351`),
 * and this asks the same of him: is any classmate, teacher or other person the life meets named Thomas, Ashgrove or
 * something near either, and where do the agent's notices sit among the others in What Needs You. Later that day each
 * part was written for an actor, an actress or either (`9c3b7ee8`), and it asks two things more: whether a classmate
 * shares a name with any of the parts, which one did until the film's Theo became Felix (`a43b4f8f`), and whether the
 * life is ever shown a part written for an actor. And since `a43b4f8f` it asks whether she is ever at two commitments
 * in person at once, which until then she could be.
 *
 *   npx vite-node docs/verification/career-2026-10-20/app/ashgrove.ts -- OUT.txt SAVEDIR [WALKDIR]
 *
 * PLAYED: the life `make-saves.ts` plays, by `make-saves.ts` itself, on its first default seed (`app-walk-112`), into a
 * folder of its own, with every notice the game is asked to say recorded as it is said (`Simulation.prototype.notify`
 * wrapped, so the log's cap of 500 loses nothing; a notice said inside a command the game then refused would be counted
 * too). Each of the nine saves it writes is compared with SAVEDIR's, the walk's, byte for byte, so the life read is the
 * life walked. Then: the class and every person in the save, each name held to `NEAR`; each part (`PROJECTS`) with who
 * it's written for, against every classmate's given and family name, the same or one short for the other, and how many
 * of 100 other lives' classes have a classmate with a part's name; every notice naming anything `NEAR` matches, his own
 * told from the rest; every notice from the last term's first day whose title names a classmate's first name; What
 * Needs You's unread list in its own order at `follow-up.json`, an hour after his first notice, and at `audition.json`,
 * the morning of the first audition; every role the nine saves hold and every notice, by the parts written for an
 * actor; every commitment in person she went to, with its window, any two that meet or fall on one day, and every
 * notice of one missed for another; and, given WALKDIR (the walk's folder), every line of every surface the walk read
 * that names him, his agency, anything `NEAR` matches or a part written for an actor (a classmate's full name taken out
 * first, as Theo Sullivan had to be while the part was Theo).
 */
import { mkdtempSync, readFileSync, readdirSync, existsSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Simulation } from '../../../../src/engine/core/simulation';
import { formatDateTime, instantFromZoned, MS_DAY, MS_MINUTE } from '../../../../src/engine/core/time';
import { WORK, tripMinutes } from '../../../../src/engine/systems/projobs';
import { AGENT_TIMES, TRAVEL_MINUTES } from '../../../../src/engine/systems/proagent';
import { unreadNotifications } from '../../../../src/engine/world/world';
import { AGENTS, agencyOf } from '../../../../src/engine/content/agents';
import { createSave } from '../../../../src/engine';
import { newLifeConfig } from '../../../../src/engine/world/bootstrap';
import { PROJECTS } from '../../../../src/engine/content/careerwork';

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
const names9 = ['last-term', 'after-new-york', 'follow-up', 'meeting', 'offered', 'audition', 'offer', 'work-day', 'paid'];
for (const n of names9) {
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

// The parts, and a classmate whose given or family name is a part's, or one a part's name is short for (Sam, Samuel).
const parts = [...new Map(PROJECTS.map((t) => [t.role.part, t.role.for])).entries()];
say('');
say(`The parts (${parts.length}): ${parts.map(([part, f]) => `${part} (${f})`).join(', ')}`);
const names = (n: string) => n.split(' ');
const shares: string[] = [];
for (const m of classmates) {
  for (const [part, f] of parts) {
    for (const w of names(part)) {
      for (const x of names(m.name)) {
        if (w === x) shares.push(`  SHARES: classmate ${m.name} and the part ${part}, written for ${f === 'either' ? 'either' : `an ${f}`}`);
        else if (w.length >= 3 && x.length >= 3 && (x.startsWith(w) || w.startsWith(x))) shares.push(`  SHORT FOR: classmate ${m.name} and the part ${part}, written for ${f === 'either' ? 'either' : `an ${f}`}`);
      }
    }
  }
}
say(`A classmate who shares a name with a part, or whose name one is short for: ${shares.length ? '' : 'none'}`);
for (const x of shares) say(x);
// How often a class has one: the classes of 100 other lives, `app-walk-0` to `app-walk-99`, drawn when the save is made.
const tally = new Map<string, number>();
for (let i = 0; i < 100; i += 1) {
  const other = createSave(1, `app-walk-${i}`, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
  const words = new Set((other.player.school?.classmates ?? []).flatMap((m) => names(m.name)));
  for (const [part] of parts) for (const w of names(part)) if (words.has(w)) tally.set(w, (tally.get(w) ?? 0) + 1);
}
say(`Of the 100 classes of app-walk-0 to app-walk-99, how many have a classmate with a part's name in theirs: ${tally.size ? [...tally].map(([w, c]) => `${w}, ${c}`).join('; ') : 'none'}`);

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

// The parts written for an actor, and whether the life is ever shown one: every role its nine saves hold, every notice.
const actorParts = parts.filter(([, f]) => f === 'actor').map(([part]) => part);
const forOf = new Map(PROJECTS.map((t) => [t.id, t]));
const roles = new Map<string, { part: string; for: string; project: string; via: string; status: string }>();
for (const n of names9) {
  const u = JSON.parse(readFileSync(`${PLAYED}/${n}.json`, 'utf8'));
  for (const o of u.people[u.playerId].pro?.opportunities ?? []) {
    const t = forOf.get(o.projectId);
    roles.set(o.id, { part: t?.role.part ?? '?', for: t?.role.for ?? '?', project: t?.project ?? o.projectId, via: o.via, status: o.status });
  }
}
say('');
say(`The parts written for an actor: ${actorParts.join(', ')}. The roles the nine saves hold, ${roles.size} in all, by part:`);
const byPart = new Map<string, number>();
for (const r of roles.values()) byPart.set(`${r.part}, ${r.project} (written for ${r.for})`, (byPart.get(`${r.part}, ${r.project} (written for ${r.for})`) ?? 0) + 1);
for (const [k, c] of [...byPart.entries()].sort()) say(`  ${c} x ${k}`);
const actorRoles = [...roles.values()].filter((r) => r.for === 'actor');
say(`Roles written for an actor among them: ${actorRoles.length ? actorRoles.map((r) => `${r.part}, ${r.project} (${r.via}, ${r.status})`).join('; ') : 'none'}`);
const partRe = (part: string) => new RegExp(`\\b${part}\\b`);
// The career's notices: a classmate's own ("Theo: A Request For Help") are the School's, and name the classmate.
const actorNotices = heard.filter((n) => n.category === 'career' && actorParts.some((part) => partRe(part).test(`${n.title} ${n.body}`)));
say(`The career's notices naming a part written for an actor: ${actorNotices.length ? '' : 'none'}`);
for (const n of actorNotices) say(`  ${formatDateTime(n.at, zone)} ${n.title}: ${n.body.slice(0, 200)}`);

// The commitments in person she went to: every round in person judged and every meeting kept, from the nine saves (an
// opportunity as the last save that holds it has it), each with its trip each way from where she lived, as the game
// reckons it (`tripMinutes`, `TRAVEL_MINUTES`). Two whose windows meet, or two on one day, would be two places at once.
const latest = new Map<string, { o: { projectId: string; rounds?: { round: string; form: string; status: string; at: number }[] }; loc: string }>();
const kept = new Map<string, { at: number; where: string; loc: string }>();
for (const n of names9) {
  const u = JSON.parse(readFileSync(`${PLAYED}/${n}.json`, 'utf8'));
  const me = u.people[u.playerId];
  for (const o of me.pro?.opportunities ?? []) latest.set(o.id, { o, loc: me.currentLocationId });
  for (const rel of Object.values(me.pro?.relations ?? {}) as { meeting?: { id: string; at: number; where: string; status: string } }[]) {
    if (rel.meeting?.status === 'kept') kept.set(rel.meeting.id, { at: rel.meeting.at, where: rel.meeting.where, loc: me.currentLocationId });
  }
}
const gone: { what: string; at: number; from: number; to: number }[] = [];
for (const { o, loc } of latest.values()) {
  const t = forOf.get(o.projectId)!;
  for (const r of o.rounds ?? []) {
    if (r.form !== 'in-person' || r.status !== 'done') continue;
    const away = tripMinutes(loc, t.place.cityId) * MS_MINUTE;
    gone.push({ what: `the ${r.round} for ${t.role.part} in ${t.place.city}`, at: r.at, from: r.at - away, to: r.at + WORK.auditionMinutes * MS_MINUTE + away });
  }
}
for (const m of kept.values()) {
  const away = (m.where === 'office' ? TRAVEL_MINUTES[m.loc] ?? 0 : 0) * MS_MINUTE;
  gone.push({ what: 'the meeting with his office', at: m.at, from: m.at - away, to: m.at + AGENT_TIMES.meetingMinutes * MS_MINUTE + away });
}
gone.sort((a, b) => a.at - b.at);
say('');
say(`Commitments in person she went to, judged or kept, from the nine saves: ${gone.length}`);
for (const g of gone) say(`  ${formatDateTime(g.at, zone)} ${g.what}: away from ${formatDateTime(g.from, zone)} to ${formatDateTime(g.to, zone)}`);
const day = (t: number) => formatDateTime(t, zone).split(' at ')[0];
const twice: string[] = [];
for (let i = 0; i < gone.length; i += 1) for (let j = i + 1; j < gone.length; j += 1) {
  const a = gone[i]!, b = gone[j]!;
  if ((a.from < b.to && b.from < a.to) || day(a.at) === day(b.at)) twice.push(`  ${a.what} (${formatDateTime(a.at, zone)}) and ${b.what} (${formatDateTime(b.at, zone)})`);
}
say(`Two of them whose times meet, or on one day: ${twice.length ? '' : 'none'}`);
for (const x of twice) say(x);
const where = heard.filter((n) => /^You were at /.test(n.body));
say(`Notices of a commitment missed for another one gone to, saying where she was: ${where.length ? '' : 'none'}`);
for (const n of where) say(`  ${formatDateTime(n.at, zone)} ${n.title}: ${n.body}`);

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
    const actorLines: string[] = [];
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.txt')).sort()) {
      for (const l of readFileSync(`${dir}/${f}`, 'utf8').split('\n')) {
        let rest = l;
        for (const m of classmates) rest = rest.replaceAll(m.name, '');
        const hit = actorParts.filter((part) => partRe(part).test(rest));
        if (hit.length) actorLines.push(`  ${w}/${f}: ${l.trim().slice(0, 300)}  (${hit.join(', ')})`);
      }
    }
    say(`At ${w}, lines naming a part written for an actor, a classmate's full name taken out first: ${actorLines.length ? '' : 'none'}`);
    for (const o of actorLines) say(o);
  }
}
writeFileSync(OUT, `${lines.join('\n')}\n`);
rmSync(PLAYED, { recursive: true, force: true });
console.log(lines.join('\n'));
