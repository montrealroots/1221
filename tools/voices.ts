/**
 * SLATE — what the game says to a student over a long run, as they meet it (from 2026-10-20, the owner's brief 16,
 * "Contextual Writing, Distinct Voices, And Clear Information"): every notice as it's made, every showing's feedback,
 * every director's note, every classmate's moment, and the Profile's What To Work On Next each Sunday. One scenario a
 * run, played by the policy `tools/lives.ts` plays (`tools/policy.ts`), through the public commands; the save is written
 * and opened again every thirty days, as a player would between sessions. Nothing here changes the game: the notices are
 * read as `notify` makes them, and the rest is read off the save.
 *
 *   npx vite-node tools/voices.ts -- --scenario attentive --seed v16-0 --months 14 --out <file.json>
 *   npx vite-node tools/voices.ts -- --summarize <file.json> … --out <summary.json> [--transcript <file.md>]
 *
 * The scenarios, each a kind of student the brief names (section 10):
 * - `attentive`: prepares every piece as it comes, the partner part with it.
 * - `underprepared`: the partner part left alone and a free hour used one day in three, so notes come back.
 * - `improving`: underprepared until the second Monday of December 2026, then attentive.
 * - `regressing`: attentive until the second Monday of January 2027, then underprepared.
 * - `skilled`: attentive, with TEST SETUP every ability and technique at 85 on the first morning.
 * - `pressure`: attentive, a student without the family's money, with the flu each autumn and winter and an everyday
 *   injury each spring, as `tools/lives.ts`'s pressure profile is.
 * - `practicing`: attentive, and the hours left spent as the Profile suggests, with comedy and tragedy chosen.
 *
 * `--summarize` measures what a player reads again (brief 16, section 10's baseline):
 * - **openings:** each showing's feedback, its first sentence with figures, dates, quotes and names taken out; how many
 *   distinct, the commonest, and how many repeat one of the last five from the same course;
 * - **duplicates:** notices whose title and body were both said before in the same run, word for word, by title;
 * - **shared:** sentences of showing feedback that came from two or more courses, with names and figures taken out;
 * - **advice:** the Profile's block, its words, its figures, its items, and its sentences said more than once in it;
 * - **directors:** each director's note, its opening, and how many repeat one of the last five.
 *
 *   npx vite-node tools/voices.ts -- --guide --out <file.json>
 *
 * `--guide` reads the tutorial's chapters and every How This Works entry (section 8): each string of more than three
 * sentences, where one paragraph carries several rules, and each reference to "it" or "this" happening with nothing
 * before it in the same string to say what.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { loadSave } from '../src/engine';
import type { Simulation } from '../src/engine/core/simulation';
import { deserialise, serialise } from '../src/engine/persistence/adapter';
import { MS_DAY, zonedParts, formatDate } from '../src/engine/core/time';
import { courseworkOf } from '../src/engine/systems/coursework';
import { templateById } from '../src/engine/content/coursework';
import { COURSES } from '../src/engine/content/school';
import { momentsOf } from '../src/engine/systems/classmates';
import { WHICH, hasProcess, holderFor } from '../src/engine/systems/production';
import { adviceFor, adviceSummary } from '../src/engine/systems/next-steps';
import { STEP, disciplineOf, type Discipline } from '../src/engine/systems/feedback';
import { careFor } from '../src/engine/systems/health';
import { mayHurt } from '../src/engine/systems/injury';
import { TECHNIQUES } from '../src/engine/content/abilities';
import { suggestedSleep } from '../src/engine/systems/life';
import { CHAPTERS } from '../src/engine/content/tutorial';
import { GUIDE } from '../src/engine/content/guide';
import { POLICY, attentiveHour, evening, keepCovered, life, lookAfter, practiceHour } from './policy';

const courseOf = (code: string) => COURSES.find((c) => c.code === code);

const argv = process.argv.slice(2).filter((a) => a !== '--');
const arg = (n: string, d: string) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1]! : d; };

interface Said { at: string; kind: 'notice' | 'showing' | 'director' | 'moment' | 'advice'; speaker: string; title?: string; text: string; band?: string; note?: string; course?: string; piece?: string; details?: string }

const SCENARIOS: Record<string, { config: Record<string, unknown>; setup?: (sim: Simulation) => void; underprepared?: (day: string) => boolean; extra?: boolean; adverse?: boolean }> = {
  attentive: { config: { homeRegionId: 'us-ny-newyork', pronouns: 'she/her' } },
  underprepared: { config: { homeRegionId: 'us-ny-newyork', pronouns: 'he/him' }, underprepared: () => true },
  improving: { config: { homeRegionId: 'uk-eng-london', pronouns: 'they/them' }, underprepared: (d) => d < '2026-12-14' },
  regressing: { config: { homeRegionId: 'mx-cmx-mexicocity', pronouns: 'she/her' }, underprepared: (d) => d >= '2027-01-11' },
  skilled: {
    config: { homeRegionId: 'us-ny-newyork', pronouns: 'he/him' },
    // TEST SETUP: a highly skilled student, every ability and technique at 85 on the first morning. A new life can't be
    // made one through creation, whose dispositions set composure and discipline only.
    setup(sim) {
      const p = sim.player;
      for (const t of TECHNIQUES) p.craft![t] = 85;
      p.attrs = Object.fromEntries(Object.keys(p.attrs ?? {}).map((k) => [k, 85])) as typeof p.attrs;
    },
  },
  pressure: { config: { homeRegionId: 'us-ca-losangeles', pronouns: 'he/him', wealth: 'scraping', family: undefined }, adverse: true },
  practicing: { config: { homeRegionId: 'us-ny-newyork', pronouns: 'she/her', genres: ['comedy', 'tragedy'] }, extra: true },
};

function play(name: string, seed: string, months: number): { said: Said[]; reloads: number; endedOn: string; error?: string } {
  const s = SCENARIOS[name];
  if (!s) throw new Error(`No scenario named "${name}": ${Object.keys(SCENARIOS).join(', ')}`);
  let sim = life(seed, s.config as never);
  s.setup?.(sim);
  const said: Said[] = [];
  const dayOf = (t: number) => { const p = zonedParts(t, sim.homeZone); return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`; };
  const watch = () => {
    const notify = sim.notify.bind(sim);
    sim.notify = ((spec: { category: string; title: string; body: string }) => { said.push({ at: dayOf(sim.now), kind: 'notice', speaker: spec.category, title: spec.title, text: spec.body }); return notify(spec as never); }) as typeof sim.notify;
  };
  watch();
  const seenShowing = new Set<string>(); const seenNote = new Set<string>(); const seenMoment = new Set<string>();
  const read = () => {
    const cw = courseworkOf(sim, sim.player);
    for (const a of cw?.assignments ?? []) {
      if (!a.feedback || !a.shown) continue;
      const key = `${a.id}:${a.shown.at}`;
      if (seenShowing.has(key)) continue;
      seenShowing.add(key);
      said.push({ at: dayOf(a.shown.at), kind: 'showing', speaker: a.feedback.course, course: courseOf(a.course)?.name ?? a.course, piece: templateById(a.template)?.title, band: a.shown.band, note: `${a.feedback.kind}:${a.feedback.focus.kind}`, text: a.feedback.text });
    }
    for (const m of cw ? momentsOf(cw) : []) {
      if (seenMoment.has(m.id)) continue;
      seenMoment.add(m.id);
      said.push({ at: dayOf(m.at), kind: 'moment', speaker: `mate:${m.mate}`, note: m.kind, text: m.text });
    }
    for (const which of WHICH) {
      const h = holderFor(sim, sim.player, which);
      if (!hasProcess(h)) continue;
      for (const n of h.process.notes) {
        const key = `${which}:${n.at}`;
        if (seenNote.has(key)) continue;
        seenNote.add(key);
        said.push({ at: dayOf(n.at), kind: 'director', speaker: `director:${which}`, note: n.focus.kind, text: n.text });
      }
    }
  };
  const end = sim.now + months * 30.4 * MS_DAY;
  let lastReload = sim.now;
  let reloads = 0;
  const struck = new Set<string>();
  let error: string | undefined;
  try {
    while (sim.now < end && sim.universe.meta.endedAt === undefined) {
      const p = zonedParts(sim.now, sim.zone);
      const day = dayOf(sim.now);
      const under = s.underprepared?.(day) ?? false;
      POLICY.partnerPart = !under;
      // One day in three the underprepared student keeps their free hours; the other two they don't prepare.
      const idle = under && Number(day.slice(-2)) % 3 !== 0;
      if (s.adverse && p.hour === 9) {
        const key = (m: number, d: number) => (p.month === m && p.day >= d) || (p.month === m + 1 && p.day < d) ? `${p.year}-${m}` : undefined;
        const flu = key(10, 15) ?? key(2, 15);
        if (flu && !struck.has(`flu ${flu}`)) { struck.add(`flu ${flu}`); careFor(sim, sim.player, { care: 'visit', what: 'The flu', flu: true }, sim.now); }
        const hurt = key(3, 1);
        if (hurt && !struck.has(`hurt ${hurt}`)) { struck.add(`hurt ${hurt}`); mayHurt(sim, sim.player, 'fall', 1, sim.now); }
      }
      if (idle) {
        // The attentive hour (`attentiveHour`) without its free hour: what's urgent, cover, the evening's reading, sleep,
        // and the hours the policy would spend preparing spent on nothing.
        lookAfter(sim);
        if (p.hour === 12) keepCovered(sim);
        if (p.hour === 20 && sim.player.currentLocationId === 'us-ct-newhaven') evening(sim);
        const awake = (sim.player.awakeSince ?? 0) <= sim.now;
        if (!((p.hour >= 23 || p.hour < 5) && awake && sim.execute({ kind: 'life.sleep', payload: { hours: suggestedSleep(sim).hours } }).ok)) sim.advanceTo(sim.now + 3_600_000);
      } else attentiveHour(sim, s.extra ? () => practiceHour(sim) : undefined);
      if (p.hour === 12) {
        read();
        if (new Date(sim.now).getUTCDay() === 0) {
          const recs = adviceFor(sim, sim.player);
          // As the card draws it (from 2026-10-20, brief 16's `adviceSummary`): what's shown, and what's behind Why This
          // Recommendation. Until then the block was every recommendation's whole reasoning, all of it shown.
          const card = recs.length ? adviceSummary(sim, sim.player, recs) : undefined;
          if (card) said.push({ at: day, kind: 'advice', speaker: 'profile', text: [`${card.what}. ${card.why}`, card.action, card.estimate, card.unavailable].filter(Boolean).join('\n'), details: card.details.map((d) => `${d.heading}: ${d.lines.join(' ')}`).join('\n'), note: String(recs.length) });
        }
        if (sim.now - lastReload >= 30 * MS_DAY) {
          sim = loadSave(deserialise(serialise(sim.universe)) as never);
          watch();
          reloads += 1;
          lastReload = sim.now;
        }
      }
    }
    read();
  } catch (e) {
    error = String((e as Error).message ?? e);
  }
  POLICY.partnerPart = true;
  return { said, reloads, endedOn: formatDate(sim.now, sim.homeZone), ...(error ? { error } : {}) };
}

// --- The measure ---------------------------------------------------------------------------------------------------
const NAMES = /\b(?:[A-Z][a-z’']+(?: [A-Z][a-z’']+)*)\b/g;
const norm = (s: string) => s.replace(/“[^”]*”/g, '“…”').replace(/\b(January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, \d{4}\b/g, 'DATE').replace(/[-+]?\d+(?:[.,]\d+)*%?/g, '#').replace(/\s+/g, ' ').trim();
const sentences = (s: string) => s.replace(/^Simulated note from [^:]+: /, '').split(/(?<=[.!?])\s+(?=[A-Z“])/).map((x) => x.trim()).filter(Boolean);
const opening = (s: string) => norm(sentences(s)[0] ?? '');
const words = (s: string) => (s.match(/\S+/g) ?? []).length;

export function summarize(runs: { scenario: string; seed: string; said: Said[] }[]) {
  const out: Record<string, unknown> = {};
  const showings = runs.flatMap((r) => r.said.filter((x) => x.kind === 'showing').map((x) => ({ ...x, scenario: r.scenario })));
  // Openings: per run, in order; a repeat is an opening said in one of the last five showings from the same course.
  const openCount = new Map<string, number>();
  let repeats = 0;
  for (const r of runs) {
    const byCourse = new Map<string, string[]>();
    for (const x of r.said.filter((y) => y.kind === 'showing')) {
      const o = opening(x.text);
      openCount.set(o, (openCount.get(o) ?? 0) + 1);
      const last = byCourse.get(x.course ?? '') ?? [];
      if (last.slice(-5).includes(o)) repeats += 1;
      byCourse.set(x.course ?? '', [...last, o]);
    }
  }
  const top = [...openCount.entries()].sort((a, b) => b[1] - a[1]);
  out.openings = { showings: showings.length, distinct: openCount.size, repeatedWithinFiveFromSameCourse: repeats, top: top.slice(0, 12).map(([o, n]) => ({ opening: o, n })) };
  // Duplicates: a notice's title and body both said before in the same run.
  const dupByTitle = new Map<string, number>();
  let notices = 0; let dups = 0;
  for (const r of runs) {
    const seen = new Set<string>();
    for (const x of r.said.filter((y) => y.kind === 'notice')) {
      notices += 1;
      const k = `${x.title}\n${x.text}`;
      if (seen.has(k)) { dups += 1; const t = norm(x.title ?? '').replace(NAMES, (w) => w); dupByTitle.set(t, (dupByTitle.get(t) ?? 0) + 1); }
      seen.add(k);
    }
  }
  const fbSeen = new Set<string>(); let fbDups = 0;
  for (const x of showings) { const k = `${x.scenario}\n${x.text}`; if (fbSeen.has(k)) fbDups += 1; fbSeen.add(k); }
  out.duplicates = { notices, exactRepeats: dups, byTitle: [...dupByTitle.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([title, n]) => ({ title, n })), showingFeedbackExactRepeats: fbDups };
  // Shared across courses: a sentence of feedback, names and figures out, said from two or more courses.
  const courseOfSentence = new Map<string, Set<string>>(); const countOfSentence = new Map<string, number>();
  for (const x of showings) for (const s of sentences(x.text)) {
    const k = norm(s).replace(/You played [^.]+ in [^.]+\./, 'You played ROLE in PLAY.');
    (courseOfSentence.get(k) ?? courseOfSentence.set(k, new Set()).get(k)!).add(x.course ?? '');
    countOfSentence.set(k, (countOfSentence.get(k) ?? 0) + 1);
  }
  const shared = [...courseOfSentence.entries()].filter(([, c]) => c.size >= 2).sort((a, b) => b[1].size - a[1].size || (countOfSentence.get(b[0]) ?? 0) - (countOfSentence.get(a[0]) ?? 0));
  const sharedShowings = showings.filter((x) => sentences(x.text).some((s) => (courseOfSentence.get(norm(s).replace(/You played [^.]+ in [^.]+\./, 'You played ROLE in PLAY.'))?.size ?? 0) >= 2)).length;
  out.shared = { sentencesFromTwoOrMoreCourses: shared.length, showingsWithOne: sharedShowings, top: shared.slice(0, 12).map(([s, c]) => ({ sentence: s, courses: c.size, times: countOfSentence.get(s) })) };
  // Whose words the step beyond was (from 2026-10-20, brief 16): a showing's step said in another discipline's terms, as
  // when Voice I heard acting's "trust the text in them". Each course's discipline is read from its skills
  // (`disciplineOf`); a step is found by its words in any discipline's table (`STEP`, acting's being `ADVANCED`).
  const discOf = (name?: string) => { const c = COURSES.find((x) => x.name === name); return c ? disciplineOf(c.skills) : undefined; };
  const stepOf = (text: string) => (Object.entries(STEP) as [Discipline, Record<string, string>][]).flatMap(([d, t]) => Object.values(t).filter((w) => text.includes(w)).map(() => d));
  const byDisc: Record<string, { showings: number; openings: Set<string>; withStep: number; anotherDisciplinesStep: number }> = {};
  for (const x of showings) {
    const d = discOf(x.course) ?? 'unknown';
    const e = (byDisc[d] ??= { showings: 0, openings: new Set(), withStep: 0, anotherDisciplinesStep: 0 });
    e.showings += 1; e.openings.add(opening(x.text));
    const found = stepOf(x.text);
    if (found.length) { e.withStep += 1; if (!found.includes(d as Discipline)) e.anotherDisciplinesStep += 1; }
  }
  out.voices = Object.fromEntries(Object.entries(byDisc).map(([d, e]) => [d, { showings: e.showings, distinctOpenings: e.openings.size, withAStep: e.withStep, stepInAnotherDisciplinesWords: e.anotherDisciplinesStep }]));
  // The Profile's advice, each Sunday.
  const advice = runs.flatMap((r) => r.said.filter((x) => x.kind === 'advice'));
  // Shown is what the screen shows before anything is opened; with the details, everything there is to read. A run made
  // before brief 16's card has no details: all of it was shown.
  const blocks = advice.map((x) => {
    const all = `${x.text}\n${x.details ?? ''}`;
    const ss = sentences(all.replace(/\n/g, ' ')).map(norm);
    const again = ss.filter((s, i) => ss.indexOf(s) !== i).length;
    return { words: words(x.text), figures: (x.text.match(/\d+(?:\.\d+)?/g) ?? []).length, allWords: words(all), allFigures: (all.match(/\d+(?:\.\d+)?/g) ?? []).length, items: Number(x.note ?? 0), sentencesAgain: again };
  });
  const mean = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : 0);
  out.advice = { blocks: blocks.length, meanWords: mean(blocks.map((b) => b.words)), maxWords: Math.max(0, ...blocks.map((b) => b.words)), meanFigures: mean(blocks.map((b) => b.figures)), meanWordsWithDetails: mean(blocks.map((b) => b.allWords)), maxWordsWithDetails: Math.max(0, ...blocks.map((b) => b.allWords)), meanFiguresWithDetails: mean(blocks.map((b) => b.allFigures)), meanItems: mean(blocks.map((b) => b.items)), meanSentencesSaidAgainInTheBlock: mean(blocks.map((b) => b.sentencesAgain)) };
  // Directors' notes.
  const dir = runs.flatMap((r) => r.said.filter((x) => x.kind === 'director'));
  const dOpen = new Map<string, number>(); let dRep = 0;
  for (const r of runs) { const last: string[] = []; for (const x of r.said.filter((y) => y.kind === 'director')) { const o = opening(x.text); dOpen.set(o, (dOpen.get(o) ?? 0) + 1); if (last.slice(-5).includes(o)) dRep += 1; last.push(o); } }
  out.directors = { notes: dir.length, distinctOpenings: dOpen.size, repeatedWithinFive: dRep, top: [...dOpen.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([o, n]) => ({ opening: o, n })) };
  const moments = runs.flatMap((r) => r.said.filter((x) => x.kind === 'moment'));
  const mOpen = new Map<string, number>();
  for (const x of moments) { const o = opening(x.text); mOpen.set(o, (mOpen.get(o) ?? 0) + 1); }
  out.moments = { said: moments.length, distinctOpenings: mOpen.size, top: [...mOpen.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([o, n]) => ({ opening: o, n })) };
  return out;
}

function transcript(runs: { scenario: string; seed: string; said: Said[] }[]): string {
  const md: string[] = ['# What The Game Said, In Order', '', 'Written by `tools/voices.ts --summarize`. Each run\'s showings, directors\' notes and the school\'s notices, in the order a player met them.', ''];
  for (const r of runs) {
    md.push(`## ${r.scenario} (seed ${r.seed})`, '');
    for (const x of r.said) {
      if (x.kind === 'showing') md.push(`- ${x.at} · **${x.course}, ${x.piece}** (${x.band}, ${x.note}): ${x.text}`);
      else if (x.kind === 'director') md.push(`- ${x.at} · **Director (${x.speaker.split(':')[1]})**: ${x.text}`);
      else if (x.kind === 'notice' && x.speaker === 'school') md.push(`- ${x.at} · *${x.title}*: ${x.text}`);
      else if (x.kind === 'moment') md.push(`- ${x.at} · Classmate (${x.note}): ${x.text}`);
    }
    md.push('');
  }
  return md.join('\n');
}

function guide() {
  const strings: { where: string; text: string }[] = [];
  for (const c of CHAPTERS as readonly { id: string; title: string; lead?: string; body: readonly string[] }[]) c.body.forEach((b, i) => strings.push({ where: `tutorial ${c.id} body ${i + 1}`, text: b }));
  const FIELDS = ['short', 'steps', 'needs', 'now', 'later', 'interpret', 'unavailable', 'mistakes', 'next'] as const;
  for (const e of GUIDE) for (const f of FIELDS) {
    const v = (e as unknown as Record<string, string | readonly string[]>)[f];
    for (const [i, t] of (typeof v === 'string' ? [v] : v).entries()) strings.push({ where: `guide ${e.id} ${f}${typeof v === 'string' ? '' : ` ${i + 1}`}`, text: t });
  }
  const many = strings.map((x) => ({ ...x, sentences: sentences(x.text).length, words: words(x.text) })).filter((x) => x.sentences > 3);
  const vague = strings.filter((x) => /(?:^|[.:;]\s)(?:It|This|That) (?:happens|does|is done)\b/.test(x.text));
  const five = many.filter((x) => x.sentences >= 5);
  return { strings: strings.length, moreThanThreeSentences: many.length, fiveOrMore: five.length, vague: vague.length, fiveOrMoreAll: five.map((x) => ({ where: x.where, sentences: x.sentences, words: x.words })), examplesMany: many.sort((a, b) => b.sentences - a.sentences).slice(0, 15).map((x) => ({ where: x.where, sentences: x.sentences, words: x.words, text: x.text.slice(0, 220) })), vagueAll: vague.map((x) => ({ where: x.where, text: x.text })) };
}

if (argv.includes('--guide')) {
  const g = guide();
  writeFileSync(arg('out', 'voices-guide.json'), `${JSON.stringify(g, null, 1)}\n`);
  console.log(JSON.stringify({ strings: g.strings, moreThanThreeSentences: g.moreThanThreeSentences, fiveOrMore: g.fiveOrMore, vague: g.vague }));
} else if (argv.includes('--summarize')) {
  const files = argv.slice(argv.indexOf('--summarize') + 1).filter((a) => !a.startsWith('--') && a.endsWith('.json') && a !== arg('out', ''));
  const runs = files.map((f) => JSON.parse(readFileSync(f, 'utf8')));
  const s = summarize(runs);
  writeFileSync(arg('out', 'voices-summary.json'), `${JSON.stringify(s, null, 1)}\n`);
  if (argv.includes('--transcript')) writeFileSync(arg('transcript', 'voices-transcript.md'), `${transcript(runs)}\n`);
  console.log(JSON.stringify(s, null, 1).slice(0, 4000));
} else {
  const scenario = arg('scenario', 'attentive'); const seed = arg('seed', 'v16-0'); const months = Number(arg('months', '14'));
  const r = play(scenario, seed, months);
  writeFileSync(arg('out', `voices-${scenario}-${seed}.json`), `${JSON.stringify({ scenario, seed, months, ...r }, null, 1)}\n`);
  console.log(`${scenario} ${seed}: ${r.said.length} said, ${r.said.filter((x) => x.kind === 'showing').length} showings, ${r.reloads} reloads, to ${r.endedOn}${r.error ? `; error: ${r.error}` : ''}`);
}
