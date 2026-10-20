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
 * From 2026-10-20 (the owner's brief 17, "Final Comprehensive Writing And Continuity Pass", section 10), four more:
 * - `tired`: attentive, asleep seven hours a night from eleven, so it prepares on less rest than the policy's (six left
 *   too little energy to prepare at all; in a first three months its limits were stamina's more than the day's).
 * - `distant`: attentive, but every other classmate's moment of each kind answered the other way (their reading kept,
 *   an evening refused, help refused, an apology taken coolly, a boundary pushed back on), so the classmates' repeated
 *   requests meet both answers.
 * - `approaches`: underprepared, and where a note keeps coming back, each of the four other ways at it taken in turn
 *   (`school.approach`), so a persistent note meets what was tried.
 * - `newplayer`: attentive, from Sydney, with drama and musicals chosen: a new life's first months.
 *
 * `--summarize` measures what a player reads again (brief 16, section 10's baseline):
 * - **openings:** each showing's feedback, its first sentence with figures, dates, quotes and names taken out; how many
 *   distinct, the commonest, and how many repeat one of the last five from the same course;
 * - **duplicates:** notices whose title and body were both said before in the same run, word for word, by title;
 * - **shared:** sentences of showing feedback that came from two or more courses, with names and figures taken out;
 * - **advice:** the Profile's block, its words, its figures, its items, and its sentences said more than once in it;
 * - **directors:** each director's note, its opening, and how many repeat one of the last five.
 *
 * And from 2026-10-20, brief 17's (`brief17`, each with its denominator, window and exclusions in `definitions`):
 * - **exact duplicates** of every kind of message, in one run;
 * - **openings, bodies and structures:** a message's first sentence, the rest of it (its body: the advice), and each
 *   sentence's structure, dates, figures, quotes and names taken out, against the same speaker's last five messages;
 * - **justified:** a body said again is the same finding again (the same note, or the same director's note) or isn't, and
 *   says it's continuing or doesn't;
 * - **contradictions:** what a message claims against the record it's read beside: a band's move against the course's
 *   last piece, a best, a run, a note's count; and from the events alone, a classmate apologizing more times than they
 *   missed, a miss or a request counted otherwise than the notices count them;
 * - **speakers:** how much of their sentence structures two courses of one discipline share;
 * - **rerolled:** a delivered message whose words differ after a save and its reload.
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
import { courseworkOf, notesOf } from '../src/engine/systems/coursework';
import { templateById } from '../src/engine/content/coursework';
import { COURSES } from '../src/engine/content/school';
import { noteKey } from '../src/engine/systems/learning';
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

interface Said { at: string; kind: 'notice' | 'showing' | 'director' | 'moment' | 'advice'; speaker: string; title?: string; text: string; band?: string; note?: string; course?: string; piece?: string; details?: string; focus?: string; t?: number; mate?: number; choice?: string }

const SCENARIOS: Record<string, { config: Record<string, unknown>; setup?: (sim: Simulation) => void; underprepared?: (day: string) => boolean; extra?: boolean; adverse?: boolean; shortSleep?: number; contrary?: boolean; approaches?: boolean }> = {
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
  // Brief 17's (section 10).
  tired: { config: { homeRegionId: 'us-il-chicago', pronouns: 'she/her' }, shortSleep: 7 },
  distant: { config: { homeRegionId: 'us-ny-newyork', pronouns: 'he/him' }, contrary: true },
  approaches: { config: { homeRegionId: 'us-tx-austin', pronouns: 'they/them' }, underprepared: () => true, approaches: true },
  newplayer: { config: { homeRegionId: 'au-nsw-sydney', pronouns: 'she/her', genres: ['drama', 'musical'] } },
};

/** The other answer to a moment, for `distant` (brief 17): what a student who keeps their distance says. */
const OTHER: Record<string, string> = { disagreement: 'hold', study: 'no', help: 'no', apology: 'cool', boundary: 'argue' };
const WAYS = ['drill', 'objective', 'partner', 'smaller'] as const;

function play(name: string, seed: string, months: number): { said: Said[]; reloads: number; endedOn: string; rerolled: number; checkedAtReload: number; error?: string } {
  const s = SCENARIOS[name];
  if (!s) throw new Error(`No scenario named "${name}": ${Object.keys(SCENARIOS).join(', ')}`);
  let sim = life(seed, s.config as never);
  s.setup?.(sim);
  const said: Said[] = [];
  const dayOf = (t: number) => { const p = zonedParts(t, sim.homeZone); return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`; };
  const watch = () => {
    const notify = sim.notify.bind(sim);
    sim.notify = ((spec: { category: string; title: string; body: string }) => { said.push({ at: dayOf(sim.now), kind: 'notice', speaker: spec.category, title: spec.title, text: spec.body, focus: `notice:${structureOf(spec.title)}` }); return notify(spec as never); }) as typeof sim.notify;
  };
  watch();
  const seenShowing = new Set<string>(); const seenNote = new Set<string>(); const seenMoment = new Map<string, Said>();
  // A production's notes still open at its close, as they enter the notes ledger (`reflect`): a course's later count of a
  // note counts them, so the measure does (brief 17: until then 59 of 460 counts read one or two over the course's own).
  const ledger: { at: string; focus: string }[] = []; const seenLedger = new Set<string>();
  const read = () => {
    const cw = courseworkOf(sim, sim.player);
    for (const a of cw?.assignments ?? []) {
      if (!a.feedback || !a.shown) continue;
      const key = `${a.id}:${a.shown.at}`;
      if (seenShowing.has(key)) continue;
      seenShowing.add(key);
      said.push({ at: dayOf(a.shown.at), kind: 'showing', speaker: a.feedback.course, course: courseOf(a.course)?.name ?? a.course, piece: templateById(a.template)?.title, band: a.shown.band, note: `${a.feedback.kind}:${a.feedback.focus.kind}`, focus: noteKey(a.feedback.focus as never), t: a.shown.at, text: a.feedback.text });
    }
    for (const rec of cw ? notesOf(cw) : []) for (const h of rec.history) {
      if (!h.assignmentId.startsWith('production:') || h.kind === 'applied') continue;
      const key = `${rec.key}:${h.on}:${h.assignmentId}`;
      if (seenLedger.has(key)) continue;
      seenLedger.add(key);
      ledger.push({ at: h.on, focus: rec.key });
    }
    for (const m of cw ? momentsOf(cw) : []) {
      // The answer, once given, kept with the moment it answers (brief 17: what a later moment says of the last answer
      // is checked against it).
      const had = seenMoment.get(m.id);
      if (had) { if (m.choice && !had.choice) had.choice = m.choice; continue; }
      const x: Said = { at: dayOf(m.at), kind: 'moment', speaker: `mate:${m.mate}`, note: m.kind, mate: m.mate, t: m.at, text: m.text, ...(m.choice ? { choice: m.choice } : {}) };
      seenMoment.set(m.id, x);
      said.push(x);
    }
    for (const which of WHICH) {
      const h = holderFor(sim, sim.player, which);
      if (!hasProcess(h)) continue;
      for (const n of h.process.notes) {
        const key = `${which}:${n.at}`;
        if (seenNote.has(key)) continue;
        seenNote.add(key);
        const f = n.focus as { kind: string; problem?: string; skill?: string; side?: string };
        said.push({ at: dayOf(n.at), kind: 'director', speaker: `director:${which}`, note: n.focus.kind, focus: [f.kind, f.problem ?? f.skill ?? f.side ?? ''].join(':'), text: n.text });
      }
    }
  };
  const end = sim.now + months * 30.4 * MS_DAY;
  let lastReload = sim.now;
  let reloads = 0;
  let rerolled = 0; let checked = 0;
  const sleptOn = new Set<string>();
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
      if (s.contrary && p.hour === 19) {
        // Every other moment of each kind answered the other way; the rest left to the evening's careful answers.
        const cw = courseworkOf(sim, sim.player);
        const seenKind: Record<string, number> = {};
        for (const m of cw ? momentsOf(cw) : []) {
          seenKind[m.kind] = (seenKind[m.kind] ?? 0) + 1;
          if (m.status === 'open' && OTHER[m.kind] && seenKind[m.kind]! % 2 === 0) sim.execute({ kind: 'school.respond', payload: { momentId: m.id, choice: OTHER[m.kind] } });
        }
      }
      if (s.approaches && p.hour === 16) {
        // Each way at a note that keeps coming back, in turn, where the piece offers one.
        const cw = courseworkOf(sim, sim.player);
        for (const a of (cw?.assignments ?? []).filter((x) => x.status === 'open' && !(x as { approach?: unknown }).approach)) {
          const n = (cw!.assignments.filter((x) => (x as { approach?: unknown }).approach).length) % WAYS.length;
          for (const k of [...WAYS.slice(n), ...WAYS.slice(0, n)]) if (sim.execute({ kind: 'school.approach', payload: { assignmentId: a.id, kind: k } }).ok) break;
        }
      }
      if (s.shortSleep && (p.hour >= 23 || p.hour < 5)) {
        // One short sleep a night, from eleven: woken early, the rest of the night up, never back to bed (the policy's own
        // hour would sleep again until five).
        const night = p.hour >= 23 ? day : dayOf(sim.now - 6 * 3_600_000);
        if (!sleptOn.has(night) && (sim.player.awakeSince ?? 0) <= sim.now && sim.execute({ kind: 'life.sleep', payload: { hours: s.shortSleep } }).ok) { sleptOn.add(night); continue; }
        if (sleptOn.has(night)) { lookAfter(sim); sim.advanceTo(sim.now + 3_600_000); continue; }
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
      // Every hour (from 2026-10-20, brief 17): a piece shown in rounds can show two in a day, and the first round's words
      // are replaced by the second's on the piece; read at noon alone, the first was lost to the transcript.
      read();
      if (p.hour === 12) {
        if (new Date(sim.now).getUTCDay() === 0) {
          const recs = adviceFor(sim, sim.player);
          // As the card draws it (from 2026-10-20, brief 16's `adviceSummary`): what's shown, and what's behind Why This
          // Recommendation. Until then the block was every recommendation's whole reasoning, all of it shown.
          const card = recs.length ? adviceSummary(sim, sim.player, recs) : undefined;
          if (card) said.push({ at: day, kind: 'advice', speaker: 'profile', text: [`${card.what}. ${card.why}`, (card as { continuing?: string }).continuing, card.action, card.estimate, card.unavailable].filter(Boolean).join('\n'), details: card.details.map((d) => `${d.heading}: ${d.lines.join(' ')}`).join('\n'), note: String(recs.length), focus: `advice:${card.what}` });
        }
        if (sim.now - lastReload >= 30 * MS_DAY) {
          // What was delivered, before and after the reload (brief 17, section 7): a message whose words differ was
          // chosen again, not kept.
          const delivered = (x: Simulation) => { const cw = courseworkOf(x, x.player); return [...(cw?.assignments ?? []).map((a) => `${a.id}:${a.feedback?.text ?? ''}`), ...(cw ? momentsOf(cw) : []).map((m) => `${m.id}:${m.text}`), ...WHICH.flatMap((w) => { const h = holderFor(x, x.player, w); return hasProcess(h) ? h.process.notes.map((n) => `${w}:${n.at}:${n.text}`) : []; })]; };
          const was = delivered(sim);
          sim = loadSave(deserialise(serialise(sim.universe)) as never);
          const now = new Set(delivered(sim));
          rerolled += was.filter((x) => !now.has(x)).length;
          checked += was.length;
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
  return { said, ledger, reloads, endedOn: formatDate(sim.now, sim.homeZone), rerolled, checkedAtReload: checked, ...(error ? { error } : {}) };
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
  out.brief17 = brief17(runs);
  return out;
}

// --- Brief 17's measures (section 10), from 2026-10-20 ---------------------------------------------------------------
/** A sentence's structure: dates, figures, quotes, the part played and every run of capitalised words past the first word taken out. */
const structureOf = (s: string) => norm(s).replace(/You played [^.]+ in [^.]+\./g, 'You played ROLE in PLAY.').replace(/(?<=\S\s)(?:[A-Z][\w’'-]*)(?:\s+(?:[A-Z][\w’'-]*|Of|And|The|In|On|To|With|A|For|At|By))*(?:\s+[A-Z][\w’'-]*)?/g, 'NAME').replace(/\b(?:first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|\d+(?:st|nd|rd|th))\b/gi, 'NTH').replace(/\b(?:one|two|three|four|five|six|seven|eight|nine|ten)\b/gi, 'N');
/** A message's body: everything after its first sentence, the part played aside, as a structure. Empty for a one-sentence message. */
const bodyOf = (text: string) => sentences(text).slice(1).filter((x) => !/^You played /.test(x)).map(structureOf).join(' ');
const WINDOW = 5;
const CONTINUING = /\b(?:again|still|same|as on|as at|last time|before|back|since|keeps|kept|another|continu|running|in a row)\b/i;
const BAND_WORD: Record<string, number> = { unready: 0, working: 1, strong: 2, exceptional: 3 };

export function brief17(runs: { scenario: string; seed: string; said: Said[]; ledger?: { at: string; focus: string }[]; rerolled?: number; checkedAtReload?: number }[]) {
  const KINDS = ['showing', 'director', 'moment', 'notice', 'advice'] as const;
  const speakerOf = (x: Said) => (x.kind === 'showing' ? `course:${x.course}` : x.kind === 'notice' ? `notice:${x.speaker}` : `${x.kind}:${x.speaker}`);
  const per: Record<string, { messages: number; exact: number; openings: number; withBody: number; bodies: number; bodiesSameFinding: number; bodiesSameFindingSaidContinuing: number; sentences: number; structures: number; allStale: number }> = {};
  for (const k of KINDS) per[k] = { messages: 0, exact: 0, openings: 0, withBody: 0, bodies: 0, bodiesSameFinding: 0, bodiesSameFindingSaidContinuing: 0, sentences: 0, structures: 0, allStale: 0 };
  const bodyTop = new Map<string, number>();
  for (const r of runs) {
    const seen = new Set<string>();
    const last = new Map<string, Said[]>();
    for (const x of r.said) {
      const e = per[x.kind]!;
      e.messages += 1;
      const exactKey = `${x.kind}\n${x.title ?? ''}\n${x.text}`;
      if (seen.has(exactKey)) e.exact += 1;
      seen.add(exactKey);
      const sp = speakerOf(x);
      const before = (last.get(sp) ?? []).slice(-WINDOW);
      if (before.some((y) => opening(y.text) === opening(x.text))) e.openings += 1;
      const body = bodyOf(x.text);
      if (body) {
        e.withBody += 1;
        const twin = before.filter((y) => bodyOf(y.text) === body).at(-1);
        if (twin) {
          e.bodies += 1;
          bodyTop.set(`${x.kind}: ${body.slice(0, 140)}`, (bodyTop.get(`${x.kind}: ${body.slice(0, 140)}`) ?? 0) + 1);
          if (x.focus && twin.focus === x.focus) { e.bodiesSameFinding += 1; if (CONTINUING.test(sentences(x.text)[0] ?? '')) e.bodiesSameFindingSaidContinuing += 1; }
        }
      }
      const ss = sentences(x.text).filter((y) => !/^You played /.test(y)).map(structureOf);
      const prior = new Set(before.flatMap((y) => sentences(y.text).filter((z) => !/^You played /.test(z)).map(structureOf)));
      e.sentences += ss.length;
      const stale = ss.filter((y) => prior.has(y)).length;
      e.structures += stale;
      if (ss.length && stale === ss.length) e.allStale += 1;
      last.set(sp, [...(last.get(sp) ?? []), x]);
    }
  }
  // Contradictions: a showing's claims against the course's own record, read in order.
  const claims = { moveClaims: 0, moveWrong: 0, bestClaims: 0, bestWrong: 0, runClaims: 0, runWrong: 0, countClaims: 0, countWrong: 0, examples: [] as string[] };
  for (const r of runs) {
    const byCourse = new Map<string, Said[]>();
    const sorted = r.said.filter((y) => y.kind === 'showing').sort((a, b) => (a.t ?? 0) - (b.t ?? 0));
    for (const x of sorted) {
      const prev = byCourse.get(x.course ?? '') ?? [];
      const p = prev.at(-1);
      const t = x.text;
      // A band's move, in brief 16's words and brief 17's ("A step up to Strong, from Working", "Up a band to Strong, from
      // Working", "Strong, not as strong as the Working piece").
      const up = /\b(?:[Uu]p from|[Bb]etter than the|That’s up from|[Uu]p (?:a band|\w+ bands) to \w+, from|step up to \w+, from)\s+(Unready|Working|Strong|Exceptional)/.exec(t);
      const down = /\b(?:[Dd]own from|Lower than the|That’s down from|[Dd]own (?:a band|\w+ bands) to \w+, from|step down to \w+, from|[Nn]ot as strong as the)\s+(Unready|Working|Strong|Exceptional)/.exec(t);
      const m = up ?? down;
      if (m && p) {
        claims.moveClaims += 1;
        const ok = m[1]!.toLowerCase() === p.band && (up ? BAND_WORD[x.band!]! > BAND_WORD[p.band!]! : BAND_WORD[x.band!]! < BAND_WORD[p.band!]!);
        if (!ok) { claims.moveWrong += 1; if (claims.examples.length < 12) claims.examples.push(`${r.scenario} ${x.at} ${x.course}: "${m[0]}" after ${p.band}`); }
      }
      if (/\b(?:best|strongest)\b[^.]*\b(?:so far|yet|has been)\b/i.test(t)) {
        claims.bestClaims += 1;
        if (!(prev.length && prev.every((y) => BAND_WORD[y.band!]! < BAND_WORD[x.band!]!))) { claims.bestWrong += 1; if (claims.examples.length < 12) claims.examples.push(`${r.scenario} ${x.at} ${x.course}: a best after ${prev.map((y) => y.band).join(',')}`); }
      }
      const runM = /\b(two|three|four|five|six|seven|eight|nine|ten|\d+) times running|\b(second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|\d+(?:st|nd|rd|th)) time in a row|twice running|two in a row/i.exec(t);
      if (runM) {
        const words = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
        const ords = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
        const said = runM[1] ? (words.indexOf(runM[1].toLowerCase()) > 0 ? words.indexOf(runM[1].toLowerCase()) : parseInt(runM[1], 10)) : runM[2] ? (ords.indexOf(runM[2].toLowerCase()) > 0 ? ords.indexOf(runM[2].toLowerCase()) : parseInt(runM[2], 10)) : 2;
        let run = BAND_WORD[x.band!]! >= 2 ? 1 : 0;
        for (const y of [...prev].reverse()) { if (!run || BAND_WORD[y.band!]! < 2) break; run += 1; }
        claims.runClaims += 1;
        if (said !== run) { claims.runWrong += 1; if (claims.examples.length < 12) claims.examples.push(`${r.scenario} ${x.at} ${x.course}: "${runM[0]}", the run ${run}`); }
      }
      // The showings before on the same note: those of earlier days, and of the same day, whose order a run's record doesn't
      // keep (a showing's time is its day's), so a count is right if some order of the day's makes it so.
      const fromRuns = (r.ledger ?? []).filter((y) => y.focus === x.focus);
      const earlier = x.focus ? sorted.filter((y) => y.focus === x.focus && y.at < x.at).length + fromRuns.filter((y) => y.at < x.at).length : 0;
      const sameDay = x.focus ? sorted.filter((y) => y !== x && y.focus === x.focus && y.at === x.at).length + fromRuns.filter((y) => y.at === x.at).length : 0;
      const n = earlier + 1;
      // A count of the note, in brief 16's words ("the fourth time you’ve had…", "after three notes") and brief 17's (each
      // voice's: "for the fourth time", "a fourth note on", "Note 4 on", "four notes now", "come up four times", "that’s four
      // notes", "a fourth time"). A run of bands ("the second time running", "in a row") isn't a note's count.
      const ORD = '(second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|\\d+(?:st|nd|rd|th))';
      const NUM = '(two|three|four|five|six|seven|eight|nine|ten|\\d+)';
      const COUNT = [
        new RegExp(`\\b(?:the|a|an) ${ORD} (?:time you’ve had|time for the note|note on|note\\b)`, 'i'),
        new RegExp(`\\bfor the ${ORD} time\\b(?! (?:running|in a row))`, 'i'),
        new RegExp(`\\b${ORD} note on\\b`, 'i'),
        new RegExp(`\\b(?:again, )?a ${ORD} time\\b(?! (?:running|in a row))`, 'i'),
        new RegExp(`\\bthe ${ORD} time\\b(?! (?:running|in a row))`, 'i'),
        new RegExp(`\\bNote (\\d+) on\\b`),
        new RegExp(`\\b${NUM} (?:notes|times) now\\b`, 'i'),
        new RegExp(`\\b(?:that’s|That’s) ${NUM} notes\\b`),
        new RegExp(`\\bcome up ${NUM} times\\b`, 'i'),
      ];
      const AFTER = /after (one|two|three|four|five|six|seven|eight|nine|ten|\d+) notes/i.exec(t);
      const cm = COUNT.map((re) => re.exec(t)).find(Boolean) ?? null;
      if ((cm || AFTER) && x.focus && !x.focus.startsWith('advanced')) {
        const ords = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
        const words = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
        const num = (w: string) => (ords.indexOf(w.toLowerCase()) > 0 ? ords.indexOf(w.toLowerCase()) : words.indexOf(w.toLowerCase()) >= 0 ? words.indexOf(w.toLowerCase()) : parseInt(w, 10));
        const said = cm ? num(cm[1]!) : num(AFTER![1]!) + 1;
        claims.countClaims += 1;
        if (said < n || said > n + sameDay) { claims.countWrong += 1; if (claims.examples.length < 12) claims.examples.push(`${r.scenario} ${x.at} ${x.course}: said ${said}, the transcript's ${n}${sameDay ? ` to ${n + sameDay}` : ''} (${x.focus})`); }
      }
      byCourse.set(x.course ?? '', [...prev, x]);
    }
  }
  // From the events alone: a classmate's apologies against their misses, and the counts notices say.
  const events = { apologies: 0, apologiesBeyondMisses: 0, missCounts: 0, missCountWrong: 0, helpCounts: 0, helpCountWrong: 0, examples: [] as string[] };
  const ORD: Record<string, number> = { second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10 };
  const ordOf = (w: string) => ORD[w] ?? parseInt(w, 10);
  for (const r of runs) {
    const missed = new Map<string, number>(); const sorry = new Map<string, number>(); const asked = new Map<string, number>();
    for (const x of r.said.filter((y) => y.kind === 'notice')) {
      const who = /^(\w+)(?: Didn’t Come|: )/.exec(x.title ?? '')?.[1];
      if (!who) continue;
      if (/ Didn’t Come$/.test(x.title ?? '')) {
        const n = (missed.get(who) ?? 0) + 1; missed.set(who, n);
        const c = /the (\w+) time they haven’t come/.exec(x.text);
        if (c || n >= 2) { events.missCounts += 1; if ((c ? ordOf(c[1]!) : 1) !== n) { events.missCountWrong += 1; if (events.examples.length < 10) events.examples.push(`${r.scenario} ${x.at}: ${who} didn't come, said ${c?.[1] ?? 'no count'}, the ${n}th`); } }
      }
      if (/: An Apology$/.test(x.title ?? '')) {
        events.apologies += 1;
        const n = (sorry.get(who) ?? 0) + 1; sorry.set(who, n);
        if (n > (missed.get(who) ?? 0)) { events.apologiesBeyondMisses += 1; if (events.examples.length < 10) events.examples.push(`${r.scenario} ${x.at}: ${who}'s apology ${n}, for ${missed.get(who) ?? 0} misses`); }
      }
      if (/: A Request For Help$/.test(x.title ?? '')) {
        const n = (asked.get(who) ?? 0) + 1; asked.set(who, n);
        const c = /the (\w+) time they’ve asked/i.exec(x.text);
        if (c || n >= 2) { events.helpCounts += 1; if ((c ? ordOf(c[1]!) : 1) !== n && !(n >= 2 && /asked before|again/i.test(x.text) && !c)) { events.helpCountWrong += 1; if (events.examples.length < 10) events.examples.push(`${r.scenario} ${x.at}: ${who}'s request, said ${c?.[1] ?? 'no count'}, the ${n}th`); } }
      }
    }
  }
  // A moment's claim about the last time (brief 17): a request for help or an invitation to run lines that says how the
  // last one of its kind from the same classmate was answered, against that answer.
  const last = { claims: 0, wrong: 0, examples: [] as string[] };
  const CLAIM: [RegExp, string][] = [[/you helped them last time/, 'help'], [/last time you said you couldn’t/, 'no'], [/You ran lines together the last time they asked/, 'yes'], [/Last time, you couldn’t/, 'no']];
  for (const r of runs) {
    const byMateKind = new Map<string, Said[]>();
    for (const x of r.said.filter((y) => y.kind === 'moment').sort((a, b) => (a.t ?? 0) - (b.t ?? 0))) {
      const k = `${x.mate}:${x.note}`;
      const before = byMateKind.get(k) ?? [];
      for (const [re, answer] of CLAIM) if (re.test(x.text)) {
        last.claims += 1;
        const prior = before.at(-1)?.choice;
        if (prior !== answer) { last.wrong += 1; if (last.examples.length < 10) last.examples.push(`${r.scenario} ${x.at}: "${re.source}", the last answer ${prior ?? 'none recorded'}`); }
      }
      byMateKind.set(k, [...before, x]);
    }
  }
  // Speakers: of two courses of one discipline, the share of their sentence structures in common (Jaccard), the
  // discipline's own steps and the template notes included, since a voice is all a course says.
  const discOf = (name?: string) => { const c = COURSES.find((x) => x.name === name); return c ? disciplineOf(c.skills) : undefined; };
  const structs = new Map<string, Set<string>>();
  for (const r of runs) for (const x of r.said.filter((y) => y.kind === 'showing')) for (const y of sentences(x.text).filter((z) => !/^You played /.test(z))) (structs.get(x.course ?? '') ?? structs.set(x.course ?? '', new Set()).get(x.course ?? '')!).add(structureOf(y));
  const pairs: { a: string; b: string; shared: number }[] = [];
  const names = [...structs.keys()].filter((c) => (structs.get(c)?.size ?? 0) >= 10);
  for (let i = 0; i < names.length; i += 1) for (let j = i + 1; j < names.length; j += 1) {
    if (discOf(names[i]) !== discOf(names[j])) continue;
    const A = structs.get(names[i]!)!; const B = structs.get(names[j]!)!;
    const inter = [...A].filter((x) => B.has(x)).length;
    pairs.push({ a: names[i]!, b: names[j]!, shared: Math.round((inter / (A.size + B.size - inter)) * 1000) / 1000 });
  }
  const mean = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 1000) / 1000 : 0);
  return {
    definitions: {
      runs: runs.map((r) => `${r.scenario} ${r.seed}`),
      window: `the same speaker's last ${WINDOW} messages, in one run: a course for a showing, a production's director, a classmate, a notice's category, the Profile's card`,
      exact: 'a message whose kind, title and whole text were all said before in the same run',
      openings: 'a first sentence, with dates, figures, quotes and names taken out, said in the window',
      bodies: 'everything after the first sentence (the part played aside), as structures, said in the window; denominator: messages of more than one sentence',
      sameFinding: 'a repeated body whose message is on the same thing as the one it repeats (the note\'s key, or the director\'s note and its problem); said continuing: its first sentence says so (again, still, same, as on, last time, before, back, since, keeps, another, running, in a row)',
      structures: 'a sentence whose structure (dates, figures, quotes, ordinals, counts and runs of capitalised words past the first taken out) was said in the window; allStale: a message every one of whose sentences was',
      contradictions: 'a showing\'s claims read from its words against the course\'s showings before it in the run: a band\'s move named against the last piece, a best against every piece before, a run against the Strong-or-better run, a note\'s count against the earlier showings on the same note (any course), either order of a day\'s two on it allowed, since a showing\'s recorded time is its day\'s; the claims a phrasing the parser doesn\'t know makes aren\'t counted, so each count of claims is its denominator',
      events: 'from notices alone: each classmate\'s apologies against their Didn\'t Come notices before them; a miss\'s and a request\'s stated count against the notices before',
      lastAnswer: 'a classmate\'s moment that says how the last of its kind was answered, against the answer the run recorded for the one before it from the same classmate',
      excluded: 'nothing is left out of a denominator but the sentence naming the part played, which every scene\'s feedback ends on',
    },
    perKind: per,
    commonestRepeatedBodies: [...bodyTop.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([body, n]) => ({ body, n })),
    contradictions: claims,
    events,
    lastAnswer: last,
    speakers: { pairs: pairs.length, meanShared: mean(pairs.map((p) => p.shared)), mostShared: [...pairs].sort((a, b) => b.shared - a.shared).slice(0, 8) },
    rerolled: { checked: runs.reduce((a, r) => a + (r.checkedAtReload ?? 0), 0), differed: runs.reduce((a, r) => a + (r.rerolled ?? 0), 0) },
  };
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
