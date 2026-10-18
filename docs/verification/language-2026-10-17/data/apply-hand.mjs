// Brief 14, the research data's dates. Applies the date step (tools/research-dates.mjs) to the string literals of hand-kept TypeScript files, by their raw text, and lists each change
// with the property it's under: how the hand-kept files' dates were rewritten, each change then read by hand. A literal that is a date and nothing else is data, and is left. Run from the clone.
//   node docs/verification/language-2026-10-17/data/apply-hand.mjs [--write] [--skip <substring>]... <file>...
import ts from 'typescript';
import { readFileSync, writeFileSync } from 'node:fs';
const { gameDates } = await import(process.cwd() + '/tools/research-dates.mjs');
const args = process.argv.slice(2);
const write = args.includes('--write');
const skips = []; const files = [];
for (let i = 0; i < args.length; i++) { if (args[i] === '--write') continue; if (args[i] === '--skip') { skips.push(args[++i]); continue; } files.push(args[i]); }
const PURE = /^\s*\d{4}-\d{2}(-\d{2})?\s*$/;
let total = 0;
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const edits = [];
  const owner = (node) => { for (let a = node.parent; a; a = a.parent) { if (ts.isPropertyAssignment(a)) return a.name.getText(); if (ts.isCallExpression(a)) return a.expression.getText() + '()'; if (ts.isVariableDeclaration(a)) return a.name.getText(); } return '?'; };
  const visit = (node) => {
    let parts = null;
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) parts = [[node.getStart() + 1, node.getEnd() - 1]];
    else if (ts.isTemplateHead(node)) parts = [[node.getStart() + 1, node.getEnd() - 2]];
    else if (ts.isTemplateMiddle(node)) parts = [[node.getStart() + 1, node.getEnd() - 2]];
    else if (ts.isTemplateTail(node)) parts = [[node.getStart() + 1, node.getEnd() - 1]];
    if (parts) {
      const p = node.parent;
      const isKey = p && (ts.isPropertyAssignment(p) || ts.isPropertySignature(p)) && p.name === node;
      const isImport = p && (ts.isImportDeclaration(p) || ts.isExportDeclaration(p));
      for (const [s, e] of parts) {
        const raw = text.slice(s, e);
        if (isKey || isImport || PURE.test(raw) || skips.some((k) => raw.includes(k))) continue;
        const after = gameDates(raw);
        if (after !== raw) edits.push({ s, e, raw, after, line: sf.getLineAndCharacterOfPosition(s).line + 1, owner: owner(node) });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  let out = text;
  for (const ed of [...edits].sort((a, b) => b.s - a.s)) out = out.slice(0, ed.s) + ed.after + out.slice(ed.e);
  for (const ed of edits) console.log(`${file}:${ed.line} [${ed.owner}]\n  - ${ed.raw}\n  + ${ed.after}`);
  total += edits.length;
  if (write && edits.length) writeFileSync(file, out);
}
console.log(`${total} literals ${write ? 'rewritten' : 'would be rewritten'}`);
