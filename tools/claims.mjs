/**
 * SLATE — the comments that make a claim about the code, checked against it.
 *
 * This project writes load-bearing prose on purpose. A doc comment here does not
 * describe what a function does — it says what was measured, what was tried, what
 * was deleted and why, and every one of those sentences is part of the change it
 * sits in. That is the right way round and it has one failure mode nothing was
 * catching: **the prose outlives the code.**
 *
 * It is not hypothetical. In a single day of work this tree produced, in its own
 * comments, after the thing each described had changed:
 *
 *   - "The rate is the one written on the account, and nothing has charged it
 *     against you yet" — a month after interest started being charged.
 *   - "nothing in the engine writes to a person's `reputation` again — one
 *     assignment, at bootstrap, and no second write anywhere in `src/engine`",
 *     where seven fields now move on four different clocks.
 *   - "`endedAt` has no writer at all — not in the engine and not in a test."
 *   - "income tax on the player is the only tax left that is a screen", written
 *     three commits before income tax was wired.
 *
 * Every one of those is the same sentence shape: **a present-tense claim that
 * nothing reads or writes some named thing.** That shape is mechanically
 * checkable, it is the exact claim this project's One Rule is about, and a false
 * one is worse than no comment — it tells the next reader a field is dead when
 * something now depends on it.
 *
 * ## What it checks, and what it deliberately does not
 *
 * Only the present tense. "`X` has no writer" is a claim about the tree as it
 * stands and is checked. "`X` had no writer" is history, and this project keeps
 * its history in the prose on purpose — the comment above `Signature.endedAt`
 * explaining that it used to have no writer is the most useful paragraph in the
 * file. So the past tense is left alone, and a sentence that needs to say
 * something is no longer true should say it in the past tense.
 *
 * It resolves what the claim is about in one of two ways, and refuses to guess
 * beyond them. Either the sentence names the thing in backticks, close enough to
 * the phrase to be its subject — "`Holding.expiresAt` is read by nothing" — or the
 * comment is the docstring on a declaration, in which case a bare "no clock reads
 * it" is a claim about the field on the next line. A sentence that names nothing
 * and sits on nothing is left alone, because guessing at its subject would put the
 * tool in the business of being mostly right, which is the one thing a gate check
 * may not be.
 *
 *   node tools/claims.mjs           report every claim and its verdict
 *   node tools/claims.mjs --check   fail the gate on a claim the code contradicts
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const CHECK = process.argv.includes('--check');
const VERBOSE = process.argv.includes('--all');

const ROOTS = ['src'];
const SKIP_DIRS = new Set(['node_modules', 'dist', 'geography', 'world-data', '__snapshots__']);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const path = join(dir, entry).split('\\').join('/');
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.tsx?$/.test(path) && !/\.d\.ts$/.test(path)) out.push(path);
  }
  return out;
}

const FILES = ROOTS.flatMap((root) => walk(root));

/**
 * Every comment in a file, as one blob per comment with its starting line.
 *
 * Crude on purpose: a `//` inside a string literal would be picked up as a
 * comment, and the cost of that is a claim checked that did not need to be, which
 * is harmless. Missing a real comment would not be harmless, so the sweep errs
 * toward reading too much.
 */
function commentsIn(text) {
  const out = [];
  const lines = text.split('\n');
  let block = null;
  for (const [i, line] of lines.entries()) {
    const trimmed = line.trim();
    if (block) {
      block.text += ` ${trimmed.replace(/^\*\s?/, '')}`;
      block.end = i + 1;
      if (trimmed.includes('*/')) { out.push(block); block = null; }
      continue;
    }
    if (trimmed.startsWith('/*')) {
      block = { at: i + 1, end: i + 1, kind: 'block', text: trimmed.replace(/^\/\*+\s?/, '') };
      if (trimmed.includes('*/')) { out.push(block); block = null; }
      continue;
    }
    const slash = line.indexOf('//');
    if (slash >= 0) {
      const last = out[out.length - 1];
      // A run of `//` lines is one comment, so a claim spanning two lines is seen.
      if (last && last.kind === 'line' && last.end === i) {
        last.text += ` ${line.slice(slash + 2).trim()}`;
        last.end = i + 1;
      } else {
        out.push({ at: i + 1, end: i + 1, kind: 'line', text: line.slice(slash + 2).trim() });
      }
    }
  }
  return out;
}

/**
 * The sentence shapes that assert nothing touches a thing, in the present tense.
 *
 * `kind` says what the claim is about, because "nothing writes it" and "nothing
 * reads it" are checked differently: a writer is an assignment and a reader is any
 * mention at all.
 *
 * Every pattern requires a present-tense verb. The past tense is this project's
 * way of keeping what a thing used to be, and checking it would make the tool
 * demand the deletion of the most useful comments in the tree.
 */
const NOBODY = String.raw`(?:nothing|nobody|no (?:clock|code|screen|caller|command|reader|writer|other)\w*)`;
const HERE = String.raw`(?:\s+(?:in|on|anywhere in|at all in)\s+(?:the\s+)?[\w` + '`' + String.raw`./\s-]{0,24}?)?`;

const CLAIMS = [
  { kind: 'writer', re: new RegExp(String.raw`\bhas? no writer\b`, 'i') },
  { kind: 'writer', re: new RegExp(String.raw`\bno writer at all\b`, 'i') },
  { kind: 'writer', re: new RegExp(String.raw`\bis never written\b`, 'i') },
  { kind: 'writer', re: new RegExp(String.raw`\bwritten by ${NOBODY}\b`, 'i') },
  { kind: 'writer', re: new RegExp(`\\b${NOBODY}${HERE}\\s+(?:ever\\s+)?writes\\b`, 'i'), object: true },
  { kind: 'reader', re: new RegExp(String.raw`\bhas? no reader\b`, 'i') },
  { kind: 'reader', re: new RegExp(String.raw`\bis never read\b`, 'i') },
  { kind: 'reader', re: new RegExp(String.raw`\bread by ${NOBODY}\b`, 'i') },
  { kind: 'reader', re: new RegExp(`\\b${NOBODY}${HERE}\\s+(?:ever\\s+)?reads\\b`, 'i'), object: true },
];

/**
 * Past-tense markers that make a sentence history rather than a claim.
 *
 * Only forms that are unambiguously past. "read" and "cut" are the same word in
 * both tenses and are not here; neither is an `-ed` participle, because "are
 * rendered and read by nothing" is present tense and is exactly the sentence this
 * tool exists to catch.
 */
const HISTORY = new RegExp(String.raw`\b(?:had|used to|was|were|until|no longer|since`
  + String.raw`|before this|first draft|first version|came out|went|sat|stood|ran|gave`
  + String.raw`|kept|took|wrote|meant|felt|deleted|cut for|it did not|stopped|turned out)\b`, 'i');

/** Sentences, roughly. Good enough: a claim is one sentence and they end in stops. */
const sentences = (text) => text.split(/(?<=[.!?])\s+/).filter(Boolean);

/** `Signature.endedAt`, `w.fitness`, `rep.controversy()` → the name a grep can find. */
function bareName(raw) {
  const bare = raw.replace(/\(\)$/, '').split('.').pop()?.trim() ?? '';
  return /^[A-Za-z_$][\w$]*$/.test(bare) && bare.length > 2 ? bare : undefined;
}

/**
 * How far from the claim a backticked name may sit and still be its subject.
 *
 * A sentence can name four things and make a claim about one of them. "…shuts
 * `trade`" ten words after "has no writer" is a different clause about a different
 * thing, and counting it would make the tool fail on a true sentence — the worst
 * thing a gate check can do, because the fix for a false alarm is to weaken the
 * prose. The window is wide enough for the real shape, which is a subject and a
 * verb phrase with a screen's name in between.
 */
const REACHES_BACK = 100;
const REACHES_FORWARD = 40;

/** The backticked names a claim phrase could be about, nearest first. */
function named(sentence, claim) {
  const at = sentence.search(claim.re);
  const phrase = sentence.match(claim.re)?.[0] ?? '';
  const out = [];
  for (const match of sentence.matchAll(/`([^`]+)`/g)) {
    const bare = bareName(match[1]);
    if (!bare) continue;
    const before = at - (match.index + match[0].length);
    const after = match.index - (at + phrase.length);
    const near = before >= 0
      ? before <= REACHES_BACK
      : claim.object === true && after >= 0 && after <= REACHES_FORWARD;
    if (near) out.push({ raw: match[1], bare });
  }
  return out;
}

/**
 * The thing a docstring is the docstring of.
 *
 * This is what makes "no clock reads it" checkable. A sentence like that names
 * nothing, but a docstring sits on a declaration, and the declaration is the
 * subject. It resolves the first line of code under the comment and nothing
 * further: if that line is not a declaration, the claim is skipped.
 */
/**
 * Whether a subject-less claim is really about the thing it sits on.
 *
 * "No clock reads **it**" is. "…an account nothing reads" and "a guard nothing can
 * trip is a line nothing reads" are figures of speech about an account and a line,
 * and attaching them to whatever constant happens to follow is how a gate check
 * earns its reputation for being ignored. So the docstring's declaration is only
 * taken as the subject when the verb has a pronoun where its object goes.
 */
const ANAPHOR = /\b(?:reads?|writes?|written)\s+(?:it|this|one|them|either)\b/i;

function declaredUnder(lines, endLine) {
  for (let i = endLine; i < Math.min(lines.length, endLine + 3); i += 1) {
    const line = lines[i]?.trim() ?? '';
    if (line === '' || line.startsWith('*') || line.startsWith('//')) continue;
    const found = line.match(
      /^(?:export\s+)?(?:declare\s+)?(?:readonly\s+)?(?:const|let|var|function|class|interface|type)?\s*([A-Za-z_$][\w$]*)\s*[?:=(<]/,
    );
    return found ? bareName(found[1]) : undefined;
  }
  return undefined;
}

const source = new Map(FILES.map((path) => [path, readFileSync(path, 'utf8')]));

/** Lines of a file with comments stripped, so a claim is checked against code. */
function codeOnly(text) {
  return text
    .split('\n')
    .map((line) => {
      const slash = line.indexOf('//');
      return slash >= 0 ? line.slice(0, slash) : line;
    })
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '');
}

const CODE = new Map([...source].map(([path, text]) => [path, codeOnly(text)]));

/** Every assignment to a name anywhere in the tree's code. */
function writersOf(bare, within) {
  const patterns = [
    new RegExp(`\\b${bare}\\s*=[^=>]`, 'g'),
    new RegExp(`\\b${bare}\\s*[-+*/]=`, 'g'),
    new RegExp(`\\b${bare}\\s*:\\s*[^;]`, 'g'),
  ];
  const hits = [];
  for (const [path, code] of CODE) {
    if (within && !path.startsWith(within)) continue;
    for (const re of patterns) {
      for (const _ of code.matchAll(re)) hits.push(path);
    }
  }
  return [...new Set(hits)];
}

/**
 * Every mention of a name in the tree's code that is not the declaration of it.
 *
 * `renewsAt: Instant;` in the domain model is not a reader of `renewsAt`, and
 * counting it would make every "nothing reads it" docstring fail the moment it was
 * written, which would teach people to stop writing them.
 */
function readersOf(bare, within) {
  const re = new RegExp(`\\b${bare}\\b`, 'g');
  // The name standing where a key or an assignment target stands is the thing
  // being filled in, not somewhere it is consulted.
  const asTarget = new RegExp(`^\\s*(?:readonly\\s+)?${bare}\\??\\s*[:=]`);
  const hits = [];
  for (const [path, code] of CODE) {
    if (within && !path.startsWith(within)) continue;
    const n = code.split('\n').filter((line) => {
      const times = [...line.matchAll(re)].length;
      return times > (asTarget.test(line) ? 1 : 0);
    }).length;
    if (n > 0) hits.push({ path, n });
  }
  return hits;
}

/**
 * Where a claim says to look.
 *
 * A comment that says nothing *in the engine* reads a field is not contradicted by
 * the screen that prints it — that is the claim, not a hole in it. So a qualifier
 * narrows the search, and a claim with no qualifier is checked against everything.
 */
function scopeOf(sentence) {
  if (/\bin (?:the )?(?:engine|simulation|build|world|sim)\b/i.test(sentence)) return 'src/engine';
  return undefined;
}

/**
 * The files a comment excuses by naming them.
 *
 * The useful version of a claim like this names the one place that does touch the
 * thing — "nothing reads it but `core/taste.ts`, and nothing goes through that
 * door yet" says more than "nothing reads it" and survives being checked. So a
 * backticked name matching a file is not a contradiction: the comment already
 * said so.
 */
function excusedBy(comment) {
  const out = new Set();
  for (const match of comment.matchAll(/`([^`]+)`/g)) {
    const token = match[1].replace(/\.tsx?$/, '').split('/').pop()?.trim() ?? '';
    if (token) out.add(token);
  }
  return out;
}

const basename = (path) => path.split('/').pop().replace(/\.tsx?$/, '');

const found = [];
for (const [path, text] of source) {
  const lines = text.split('\n');
  for (const comment of commentsIn(text)) {
    for (const sentence of sentences(comment.text)) {
      const claim = CLAIMS.find((one) => one.re.test(sentence));
      if (!claim) continue;
      if (HISTORY.test(sentence)) continue;
      let things = named(sentence, claim);
      // Nothing named near the phrase: the docstring's own declaration is the
      // subject, if it has one and the verb has a pronoun for an object. If not,
      // the claim is unresolvable and the tool says nothing rather than guessing.
      if (things.length === 0 && comment.kind === 'block' && ANAPHOR.test(sentence)) {
        const under = declaredUnder(lines, comment.end);
        things = under ? [{ raw: under, bare: under }] : [];
      }
      const within = scopeOf(sentence);
      const excused = excusedBy(comment.text);
      for (const thing of things) {
        const who = (claim.kind === 'writer' ? writersOf(thing.bare, within) : readersOf(thing.bare, within))
          .filter((where) => !excused.has(basename(where.path ?? where)));
        found.push({ path, at: comment.at, kind: claim.kind, thing, who, sentence });
      }
    }
  }
}

// A writer claim is contradicted by any assignment outside the file that declares
// the thing, and a reader claim by a mention in more than one file. Both are
// deliberately loose: the point is to catch a field something now depends on,
// not to count precisely.
const broken = found.filter((one) => (one.kind === 'writer'
  ? one.who.some((where) => where !== one.path)
  : one.who.filter((where) => where.path !== one.path).length > 0));

console.log(`${FILES.length} files. ${found.length} present-tense claims that nothing touches a named thing.\n`);

if (VERBOSE) {
  for (const one of found) {
    const count = one.kind === 'writer' ? one.who.length : one.who.length;
    console.log(`  ${broken.includes(one) ? 'BROKEN ' : 'ok     '} ${one.path}:${one.at}`
      + `  ${one.kind} of \`${one.thing.raw}\` — ${count} file${count === 1 ? '' : 's'}`);
  }
  console.log('');
}

if (broken.length === 0) {
  console.log('Every one of them is still true. No comment here says a thing is dead that something now depends on.');
} else {
  console.log('Comments that say nothing touches a thing, where something does:\n');
  for (const one of broken) {
    const others = one.kind === 'writer'
      ? one.who.filter((where) => where !== one.path)
      : one.who.filter((where) => where.path !== one.path).map((where) => where.path);
    console.log(`  ${one.path}:${one.at}`);
    console.log(`    claims: ${one.sentence.trim().slice(0, 150)}`);
    console.log(`    but \`${one.thing.raw}\` is ${one.kind === 'writer' ? 'assigned' : 'mentioned'} in: `
      + `${others.slice(0, 4).join(', ')}${others.length > 4 ? ` and ${others.length - 4} more` : ''}\n`);
  }
  console.log('Say it in the past tense if it used to be true. The past tense is not checked,');
  console.log('because keeping what a thing used to be is the whole point of prose like this.');
}

if (CHECK && broken.length > 0) process.exit(1);
