/**
 * Every control on screen that issues a command, read from the code (from 2026-10-21, the owner's brief 20, D1: "UI
 * controls connected to the wrong action"; the guide area's audit, `docs/verification/audit-2026-10-21/areas/guide/`).
 *
 * For each call of the game's `run` in `src/ui` and `src/app` it finds the control the call sits under: the JSX element
 * whose handler holds it, directly or through a helper of the same file that the handler calls (`const sleep = () =>
 * run('life.sleep', …)` under `<Gated … onClick={sleep}>`), however many helpers deep. It writes down the file, the
 * control's label as the JSX draws it (its text, an expression in braces as its source, a select by its `<label>`), the
 * kind issued and the payload's source. A kind held by a helper's parameter is read from each call of the helper, so
 * Papers' `act('documents.apply_passport', …)` is a line of its own; a kind held by a constant (`READ_KIND`) is read
 * from the engine's `export const`. A kind decided at run time (a stop's own choice, `choice.command`) is written as its
 * source, and the test that holds the list resolves it. A call no control holds (one in an effect, say) is written with
 * the control `(none)`, which is what the list is for finding.
 *
 * Beside the controls it lists the two kinds of button the engine itself names: a decision's answers (`requireDecision`'s
 * `actions`, drawn on Home as buttons that issue `world.take_decision_action` with the answer's index) and a stop's own
 * choices (`defineStop`, drawn in the stop's dialog), each by its label, the command it runs and the payload's source.
 *
 *   node tools/wiring.mjs           prints the list
 *   node tools/wiring.mjs --write   writes the list into docs/verification/audit-2026-10-21/areas/guide/wiring.json,
 *                                   keeping each line's reading (`verdict`, `handler`, `note`) where the line is the same
 *   node tools/wiring.mjs --check   exits 1 where the code's list and the file's differ, or a line has no reading
 *
 * `tests/b20-guide-wiring.test.ts` holds the same list in the gate.
 */
import ts from 'typescript';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const WIRING = 'docs/verification/audit-2026-10-21/areas/guide/wiring.json';

const read = (f) => readFileSync(f, 'utf8');
const filesUnder = (dir, test) => readdirSync(dir, { recursive: true }).map((p) => join(dir, String(p)).replace(/\\/g, '/')).filter((p) => test.test(p)).sort();
const parse = (f) => ts.createSourceFile(f, read(f), ts.ScriptTarget.Latest, true, f.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
const walk = (node, visit) => { visit(node); ts.forEachChild(node, (c) => walk(c, visit)); };
const squash = (s) => s.replace(/\s+/g, ' ').trim();

/** The engine's constants that hold a kind (`export const READ_KIND = 'tutorial.read'`), by name. */
function kindConstants() {
  const out = new Map();
  for (const f of filesUnder('src/engine', /\.ts$/)) for (const m of read(f).matchAll(/export const ([A-Z][A-Z0-9_]*) = '([a-z0-9_]+\.[a-z0-9_]+)'/g)) out.set(m[1], m[2]);
  return out;
}

/** Whether a call is the game's `run`: `run(…)` or `run<…>(…)`. */
const isRun = (n) => ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === 'run';

/** The words a JSX child draws: its text, a literal's text, a template's, an expression's source in braces. */
function textOf(node, sf) {
  if (ts.isJsxText(node)) return node.text;
  if (ts.isJsxExpression(node)) {
    const e = node.expression;
    if (!e) return '';
    if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) return e.text;
    // A chip or a note drawn only on a condition (`{first && <span>…</span>}`) isn't the control's name.
    let jsx = false;
    walk(e, (x) => { if (ts.isJsxElement(x) || ts.isJsxSelfClosingElement(x)) jsx = true; });
    return jsx ? '' : `{${squash(e.getText(sf))}}`;
  }
  if (ts.isJsxElement(node)) return node.children.map((c) => textOf(c, sf)).join('');
  if (ts.isJsxFragment(node)) return node.children.map((c) => textOf(c, sf)).join('');
  return '';
}

const attr = (opening, name) => opening.attributes.properties.find((p) => ts.isJsxAttribute(p) && p.name.getText() === name);
const attrText = (opening, name, sf) => {
  const a = attr(opening, name);
  if (!a || !a.initializer) return undefined;
  if (ts.isStringLiteral(a.initializer)) return a.initializer.text;
  const e = a.initializer.expression;
  if (e && (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e))) return e.text;
  return e ? `{${squash(e.getText(sf))}}` : undefined;
};

/** A control's label: its drawn words; a select or an input by the `<label htmlFor>` that names its id; else its aria-label, its own label prop or its title. */
function labelOf(opening, sf) {
  const element = opening.parent;
  const tag = opening.tagName.getText(sf);
  // A select's drawn words are its options: its name is its `<label>`'s.
  const drawn = ts.isJsxElement(element) && tag !== 'select' ? resolved(squash(element.children.map((c) => textOf(c, sf)).join('')), opening, sf) : '';
  if (drawn) return drawn;
  const id = attrText(opening, 'id', sf);
  if ((tag === 'select' || tag === 'input') && id) {
    let found;
    walk(sf, (n) => {
      if (found || !(ts.isJsxOpeningElement(n) && n.tagName.getText(sf) === 'label' && attrText(n, 'htmlFor', sf) === id)) return;
      found = squash(n.parent.children.map((c) => textOf(c, sf)).join(''));
    });
    if (found) return `${found} (${tag})`;
  }
  return attrText(opening, 'aria-label', sf) ?? attrText(opening, 'label', sf) ?? attrText(opening, 'title', sf) ?? `(${tag} with no words)`;
}

/**
 * A label that is one name in braces (`{label}`) read from the `const` that holds it in the control's own function, where
 * that's a string or a template: `const label = 'Submit Yourself'`.
 */
function resolved(text, at, sf) {
  const m = /^\{([A-Za-z_]\w*)\}$/.exec(text);
  if (!m) return text;
  for (let scope = at.parent; scope; scope = scope.parent) {
    if (!(ts.isFunctionDeclaration(scope) || ts.isArrowFunction(scope) || ts.isFunctionExpression(scope))) continue;
    let found;
    walk(scope, (n) => {
      if (found || !ts.isVariableDeclaration(n) || !ts.isIdentifier(n.name) || n.name.text !== m[1] || !n.initializer) return;
      const i = n.initializer;
      if (ts.isStringLiteral(i) || ts.isNoSubstitutionTemplateLiteral(i)) found = i.text;
      else if (ts.isTemplateExpression(i)) found = squash(i.getText(sf)).replace(/^`|`$/g, '');
    });
    if (found) return found;
  }
  return text;
}

/** The function a node sits in, named: a declaration, or an arrow or function given to a `const`. */
function namedFunctionAround(node) {
  for (let at = node.parent; at; at = at.parent) {
    if (ts.isJsxAttribute(at)) return undefined;
    if (ts.isFunctionDeclaration(at) && at.name) return { fn: at, name: at.name.text };
    if ((ts.isArrowFunction(at) || ts.isFunctionExpression(at)) && ts.isVariableDeclaration(at.parent) && ts.isIdentifier(at.parent.name)) return { fn: at, name: at.parent.name.text };
  }
  return undefined;
}

/** The JSX attribute a node sits in, if any, and its element. */
function handlerAround(node) {
  for (let at = node.parent; at; at = at.parent) {
    if (ts.isJsxAttribute(at)) return { attribute: at.name.getText(), opening: at.parent.parent };
    if (ts.isFunctionDeclaration(at)) return undefined;
    if ((ts.isArrowFunction(at) || ts.isFunctionExpression(at)) && ts.isVariableDeclaration(at.parent)) return undefined;
  }
  return undefined;
}

/** Each control a node reaches: through the attribute it's in, or through every use of the helper it's in. */
function controlsOf(node, sf, depth = 0, bindings = new Map()) {
  const h = handlerAround(node);
  if (h) return [{ ...h, bindings }];
  const around = namedFunctionAround(node);
  if (!around || depth > 6) return [{ attribute: undefined, opening: undefined, bindings }];
  const out = [];
  // Its uses, in the scope it's declared in: two components of a file may each have an `apply` of their own.
  const declared = ts.isFunctionDeclaration(around.fn) ? around.fn : around.fn.parent.parent.parent;
  walk(declared.parent, (n) => {
    if (!ts.isIdentifier(n) || n.text !== around.name || n === (around.fn.name ?? around.fn.parent.name)) return;
    // A property's name (`item.choose`, `{ choose: true }`) isn't the helper.
    if ((ts.isPropertyAccessExpression(n.parent) && n.parent.name === n) || (ts.isPropertyAssignment(n.parent) && n.parent.name === n)) return;
    // A call of the helper binds its parameters to the call's arguments; a bare reference (`onClick={sleep}`) binds none.
    const call = ts.isCallExpression(n.parent) && n.parent.expression === n ? n.parent : undefined;
    const next = new Map(bindings);
    if (call) around.fn.parameters.forEach((p, i) => { if (ts.isIdentifier(p.name) && call.arguments[i]) next.set(p.name.text, call.arguments[i]); });
    out.push(...controlsOf(n, sf, depth + 1, next));
  });
  return out.length ? out : [{ attribute: undefined, opening: undefined, bindings }];
}

/** The kind a `run` call issues, read through a helper's binding or an engine constant where it can be. */
function kindOf(arg, bindings, constants, sf) {
  if (!arg) return '(none)';
  if (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg)) return arg.text;
  if (ts.isIdentifier(arg)) {
    const bound = bindings.get(arg.text);
    if (bound) return kindOf(bound, new Map(), constants, sf);
    if (constants.has(arg.text)) return constants.get(arg.text);
  }
  return `{${squash(arg.getText(sf))}}`;
}

/** The payload's source, a helper's parameters written as the argument each call gives. */
function payloadOf(arg, bindings, sf) {
  if (!arg) return '';
  let text = squash(arg.getText(sf));
  for (const [name, value] of bindings) {
    const given = squash(value.getText(sf));
    // Shorthand first (`{ expedite }` is `{ expedite: true }`), then every other use of the name that isn't a key.
    text = text.replace(new RegExp(`([{,]\\s*)${name}(\\s*[,}])`, 'g'), `$1${name}: ${given}$2`).replace(new RegExp(`(?<![\\w.]|${name}: )\\b${name}\\b(?!\\s*:)`, 'g'), given);
  }
  return text;
}

/** Every control that issues a command, sorted by file, label and kind. */
export function controls() {
  const constants = kindConstants();
  const out = [];
  for (const f of [...filesUnder('src/ui', /\.tsx?$/), ...filesUnder('src/app', /\.tsx?$/)]) {
    const sf = parse(f);
    walk(sf, (n) => {
      if (!isRun(n)) return;
      for (const c of controlsOf(n, sf)) {
        const opening = c.opening;
        out.push({
          file: f,
          control: opening ? `<${opening.tagName.getText(sf)} ${c.attribute}>` : '(none)',
          // The guide's lock on the control, where it has one (`<Gated feature>`, or a chooser's own `feature`).
          ...(opening && attrText(opening, 'feature', sf) ? { feature: attrText(opening, 'feature', sf) } : {}),
          label: opening ? labelOf(opening, sf) : '(none)',
          kind: kindOf(n.arguments[0], c.bindings, constants, sf),
          payload: payloadOf(n.arguments[1], c.bindings, sf),
        });
      }
    });
  }
  const key = (x) => `${x.file}\u0000${x.label}\u0000${x.kind}\u0000${x.payload}\u0000${x.control}`;
  const seen = new Set();
  return out.filter((x) => (seen.has(key(x)) ? false : (seen.add(key(x)), true))).sort((a, b) => key(a).localeCompare(key(b)));
}

/** A decision's answers, as the engine raises them: each a button on Home. */
export function decisionAnswers() {
  const out = [];
  for (const f of filesUnder('src/engine', /\.ts$/)) {
    const sf = parse(f);
    walk(sf, (n) => {
      if (!ts.isObjectLiteralExpression(n)) return;
      const label = n.properties.find((p) => ts.isPropertyAssignment(p) && p.name.getText(sf) === 'label');
      const kind = n.properties.find((p) => ts.isPropertyAssignment(p) && p.name.getText(sf) === 'commandKind');
      const payload = n.properties.find((p) => ts.isPropertyAssignment(p) && p.name.getText(sf) === 'payload');
      if (!label || !kind || f === 'src/engine/core/simulation.ts') return;
      out.push({ file: f, label: squash(label.initializer.getText(sf)).replace(/^'|'$/g, ''), kind: squash(kind.initializer.getText(sf)).replace(/^'|'$/g, ''), payload: payload ? squash(payload.initializer.getText(sf)) : '' });
    });
  }
  return out;
}

/** A stop's own choices (`defineStop`, in `world/clock.ts` or a system's own module), each a button in the stop's dialog. */
export function stopChoices() {
  const out = [];
  for (const f of filesUnder('src/engine', /\.ts$/)) {
  const sf = parse(f);
  walk(sf, (n) => {
    if (!(ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === 'defineStop')) return;
    const list = n.arguments[1];
    if (!list || !ts.isArrayLiteralExpression(list)) return;
    for (const o of list.elements) {
      if (!ts.isObjectLiteralExpression(o)) continue;
      const get = (name) => o.properties.find((p) => ts.isPropertyAssignment(p) && p.name.getText(sf) === name)?.initializer;
      out.push({ file: f, stop: squash(n.arguments[0].getText(sf)), label: get('label')?.text, kind: get('command')?.text, payload: squash(get('payload')?.getText(sf) ?? '') });
    }
  });
  }
  return out;
}

/**
 * The payload keys each command's handler takes, by kind: its payload type's members where the type is written out, and
 * `p.key` on its first parameter or a destructured key; `null` where the handler passes the payload on whole (to a helper
 * or by an index) under a named type, so what it takes can't be told from here.
 */
export function handlerReads() {
  const constants = kindConstants();
  const out = new Map();
  for (const f of filesUnder('src/engine', /\.ts$/)) {
    const sf = parse(f);
    walk(sf, (n) => {
      if (!ts.isCallExpression(n) || !ts.isPropertyAccessExpression(n.expression) || n.expression.name.text !== 'onCommand') return;
      const a0 = n.arguments[0];
      const kind = a0 && (ts.isStringLiteral(a0) ? a0.text : constants.get(a0.getText(sf)));
      const fn = n.arguments[1];
      if (!kind || !fn || !(ts.isArrowFunction(fn) || ts.isFunctionExpression(fn))) return;
      const p = fn.parameters[0];
      const keys = new Set();
      let whole = false;
      if (p && ts.isObjectBindingPattern(p.name)) for (const e of p.name.elements) keys.add((e.propertyName ?? e.name).getText(sf));
      else if (p && ts.isIdentifier(p.name)) {
        const name = p.name.text;
        walk(fn.body, (x) => {
          if (ts.isPropertyAccessExpression(x) && ts.isIdentifier(x.expression) && x.expression.text === name) keys.add(x.name.text);
          else if (ts.isVariableDeclaration(x) && x.initializer && ts.isIdentifier(x.initializer) && x.initializer.text === name && ts.isObjectBindingPattern(x.name)) for (const e of x.name.elements) keys.add((e.propertyName ?? e.name).getText(sf));
          else if (ts.isIdentifier(x) && x.text === name && !(ts.isPropertyAccessExpression(x.parent) && x.parent.expression === x) && !(ts.isVariableDeclaration(x.parent) && ts.isObjectBindingPattern(x.parent.name)) && x.parent !== p) whole = true;
        });
      }
      // The payload's declared type, where it's written out (`onCommand<{ accountId: string; amount: Money }, …>`), says
      // what it takes when the handler hands the payload on whole.
      const declared = n.typeArguments?.[0];
      if (declared && ts.isTypeLiteralNode(declared)) {
        for (const m of declared.members) if (m.name) keys.add(m.name.getText(sf));
        whole = false;
      }
      out.set(kind, whole ? null : [...keys].sort());
    });
  }
  return out;
}

/** The top-level keys a payload's source sends, or `null` where it's built some other way (a call, a variable). */
export function sentKeys(payload) {
  if (!payload) return [];
  const sf = ts.createSourceFile('payload.ts', `const x = (${payload});`, ts.ScriptTarget.Latest, true);
  const init = sf.statements[0].declarationList.declarations[0].initializer.expression;
  const keys = new Set();
  const visit = (o) => { for (const p of o.properties) { if (ts.isSpreadAssignment(p)) walk(p.expression, (x) => { if (ts.isObjectLiteralExpression(x)) visit(x); }); else if (p.name) keys.add(p.name.getText(sf)); } };
  if (ts.isObjectLiteralExpression(init)) visit(init);
  else if (ts.isConditionalExpression(init) || ts.isParenthesizedExpression(init)) walk(init, (x) => { if (ts.isObjectLiteralExpression(x)) visit(x); });
  else return null;
  return [...keys].sort();
}

const same = (a, b) => a.file === b.file && a.label === b.label && a.kind === b.kind && a.payload === b.payload && (a.control ?? '') === (b.control ?? '') && (a.feature ?? '') === (b.feature ?? '') && (a.stop ?? '') === (b.stop ?? '');
const READING = ['verdict', 'handler', 'note'];

function current() {
  return { controls: controls(), decisionAnswers: decisionAnswers(), stopChoices: stopChoices() };
}

const args = process.argv.slice(2);
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('tools/wiring.mjs')) {
  const now = current();
  if (args.includes('--write')) {
    const was = existsSync(WIRING) ? JSON.parse(read(WIRING)) : {};
    const keep = (list, old = []) => list.map((x) => {
      const o = old.find((y) => same(x, y));
      return { ...x, ...Object.fromEntries(READING.filter((k) => o?.[k] !== undefined).map((k) => [k, o[k]])) };
    });
    const out = { about: was.about ?? '', controls: keep(now.controls, was.controls), decisionAnswers: keep(now.decisionAnswers, was.decisionAnswers), stopChoices: keep(now.stopChoices, was.stopChoices) };
    writeFileSync(WIRING, JSON.stringify(out, null, 1) + '\n');
    console.log(`wrote ${WIRING}: ${out.controls.length} controls, ${out.decisionAnswers.length} decision answers, ${out.stopChoices.length} stop choices`);
  } else if (args.includes('--check')) {
    const file = existsSync(WIRING) ? JSON.parse(read(WIRING)) : { controls: [], decisionAnswers: [], stopChoices: [] };
    const problems = [];
    for (const part of ['controls', 'decisionAnswers', 'stopChoices']) {
      for (const x of now[part]) if (!file[part].some((y) => same(x, y))) problems.push(`${part}: in the code, not the list: ${x.file} “${x.label}” issues ${x.kind} ${x.payload}`);
      for (const y of file[part]) {
        if (!now[part].some((x) => same(x, y))) problems.push(`${part}: in the list, not the code: ${y.file} “${y.label}” issues ${y.kind} ${y.payload}`);
        if (!y.verdict) problems.push(`${part}: not read: ${y.file} “${y.label}” issues ${y.kind}`);
      }
    }
    for (const p of problems) console.log(p);
    console.log(problems.length ? `wiring: ${problems.length} problems` : `wiring: ${now.controls.length} controls, each read`);
    process.exitCode = problems.length ? 1 : 0;
  } else {
    for (const x of now.controls) console.log(`${x.file}\t${x.control}\t${x.label}\t${x.kind}\t${x.payload}`);
    console.log(`${now.controls.length} controls; ${now.decisionAnswers.length} decision answers; ${now.stopChoices.length} stop choices`);
  }
}
