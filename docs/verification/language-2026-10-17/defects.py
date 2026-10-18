"""
Brief 14's defect index: reads defects.json, counts its entries, writes the counts back into it and writes DEFECTS.md.

Nothing in DEFECTS.md is typed by hand. The entries are the data; every number and table is made from them here, so a
count can't disagree with the list it counts.

    python3 docs/verification/language-2026-10-17/defects.py            write the counts and DEFECTS.md
    python3 docs/verification/language-2026-10-17/defects.py --check    exit 1 if either file is behind the entries
    python3 docs/verification/language-2026-10-17/defects.py --verify   exit 1 if an entry's facts don't hold in the tree

--verify holds each entry to the tree: every record's file holds the words the entry quotes from it; a fixed entry's
commit exists, lies on this pass (after 0368d46b, up to HEAD) and changed each file the entry says it touched (a merge
against its first parent); each test named holds the title given, word for word; each source named holds, or no
longer holds, the words given. It doesn't run the checks an entry names (guide-quotes, tutorial-routes, coverage, tsc):
those are run on their own and their exits recorded where the entry names them.
"""
import json
import re
import subprocess
import sys
import textwrap
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA = HERE / 'defects.json'
PAGE = HERE / 'DEFECTS.md'
BASE = '0368d46b'

KINDS = ['text', 'assembly', 'layout', 'behavior', 'test-or-tool', 'data']
STATUSES = ['fixed', 'left']
OWNERS = ['owner', 'a future pass', 'none']
KIND_WORDS = {
    'text': 'A sentence that misstated the game',
    'assembly': 'A sentence built from parts that came out wrong: a plural, a leaked value, a date, a sign',
    'layout': 'A control or a screen’s layout',
    'behavior': 'What the game does, not what it says',
    'test-or-tool': 'A test, a check or a tool the pass runs',
    'data': 'The research data, or the builder that writes it',
}


def root() -> Path:
    return Path(subprocess.run(['git', 'rev-parse', '--show-toplevel'], cwd=HERE, capture_output=True, text=True, check=True).stdout.strip())


def load() -> dict:
    return json.loads(DATA.read_text(encoding='utf-8'))


def problems_in_shape(data: dict) -> list[str]:
    out = []
    seen = set()
    for e in data['entries']:
        i = e.get('id', '?')
        if i in seen:
            out.append(f'{i}: the id is used twice')
        seen.add(i)
        for field in ('id', 'title', 'records', 'kind', 'status'):
            if not e.get(field):
                out.append(f'{i}: no {field}')
        if e.get('kind') not in KINDS:
            out.append(f'{i}: kind {e.get("kind")!r} is none of {KINDS}')
        if e.get('status') not in STATUSES:
            out.append(f'{i}: status {e.get("status")!r} is none of {STATUSES}')
        if e.get('status') == 'fixed':
            if not e.get('commit') or not e.get('evidence'):
                out.append(f'{i}: fixed, but no commit or no evidence')
            if 'why' in e or 'owner' in e:
                out.append(f'{i}: fixed, but given a why or an owner')
        if e.get('status') == 'left':
            if not e.get('why') or e.get('owner') not in OWNERS:
                out.append(f'{i}: left, but no why or an owner that is none of {OWNERS}')
            if 'commit' in e:
                out.append(f'{i}: left, but given a commit')
    return out


def held_by(e: dict) -> str:
    """How a fixed entry is held now: by a test, by a check, or only by the source as it stands."""
    kinds = {next(iter(k for k in ('test', 'check', 'source', 'absent', 'record') if k in ev)) for ev in e['evidence']}
    if 'test' in kinds:
        return 'a test'
    if 'check' in kinds:
        return 'a check'
    return 'the source alone'


def counts(data: dict) -> dict:
    entries = data['entries']
    by_status = {s: sum(1 for e in entries if e['status'] == s) for s in STATUSES}
    by_kind = {k: {s: sum(1 for e in entries if e['kind'] == k and e['status'] == s) for s in STATUSES} for k in KINDS}
    for k in KINDS:
        by_kind[k]['total'] = sum(by_kind[k][s] for s in STATUSES)
    files = Counter()
    for e in entries:
        for f in sorted({r['file'] for r in e['records']}):
            files[f] += 1
    by_record = dict(sorted(files.items(), key=lambda kv: (-kv[1], kv[0])))
    held = Counter(held_by(e) for e in entries if e['status'] == 'fixed')
    order = ['a test', 'a check', 'the source alone']
    left_owner = Counter(e['owner'] for e in entries if e['status'] == 'left')
    return {
        'total': len(entries),
        'by_status': by_status,
        'by_kind': by_kind,
        'by_record': by_record,
        'fixed_held_by': {h: held.get(h, 0) for h in order},
        'left_by_owner': {o: left_owner.get(o, 0) for o in OWNERS},
        'not_counted': len(data.get('excluded', [])),
    }


def cell(text: str) -> str:
    return str(text).replace('|', '\\|').replace('\n', ' ')


def short(text: str, n: int = 90) -> str:
    return text if len(text) <= n else text[: n - 1].rstrip() + '…'


def quoted(at: str) -> str:
    """A record's words as the page shows them: its Markdown's heading marks and bold dropped."""
    return re.sub(r'^#+ ', '', at).replace('**', '')


def records_cell(e: dict) -> str:
    seen = []
    for r in e['records']:
        if r['file'] not in seen:
            seen.append(r['file'])
    return '<br>'.join(f'`{f}`' for f in seen)


def evidence_cell(e: dict) -> str:
    parts = []
    for ev in e['evidence']:
        if 'test' in ev:
            parts.append(f'`{ev["test"]}`, “{cell(short(ev["title"]))}”')
        elif 'check' in ev:
            parts.append(f'`{cell(ev["check"])}`' + (f' ({cell(ev["result"])})' if ev.get('result') else ''))
        elif 'source' in ev:
            parts.append(f'`{ev["source"]}` holds “{cell(short(ev["holds"], 60))}”')
        elif 'absent' in ev:
            parts.append(f'`{ev["absent"]}` no longer holds “{cell(short(ev["string"], 60))}”')
        elif 'record' in ev:
            parts.append(f'`{ev["record"]}` holds “{cell(short(ev["holds"], 60))}”')
    return '<br>'.join(parts)


def commit_cell(e: dict) -> str:
    out = f'`{e["commit"]}`'
    if e.get('also'):
        out += ' (also ' + ', '.join(f'`{c}`' for c in e['also']) + ')'
    return out


def page(data: dict) -> str:
    c = data['counts']
    entries = data['entries']
    fixed = [e for e in entries if e['status'] == 'fixed']
    left = [e for e in entries if e['status'] == 'left']
    out = []
    out.append('# Brief 14’s Defects')
    out.append('')
    out.append('Every defect the brief 14 pass found, from the eight areas, the integration’s passes and the editorial review, in')
    out.append('one index the receipt can count. Written by `defects.py` from `defects.json`; edit the entries there, never this')
    out.append('page, and run the script again.')
    out.append('')
    out.append(textwrap.fill(data['note'], 120, break_on_hyphens=False))
    out.append('')
    out.append('## The Counts')
    out.append('')
    out.append(f'**{c["total"]} defects:** {c["by_status"]["fixed"]} fixed and {c["by_status"]["left"]} left. '
               f'{c["not_counted"]} more items in the records were read and not counted (the last table says why).')
    out.append('')
    out.append('| Kind | What It Covers | Fixed | Left | All |')
    out.append('|---|---|---|---|---|')
    for k in KINDS:
        b = c['by_kind'][k]
        out.append(f'| {k} | {KIND_WORDS[k]} | {b["fixed"]} | {b["left"]} | {b["total"]} |')
    out.append(f'| **all** | | **{c["by_status"]["fixed"]}** | **{c["by_status"]["left"]}** | **{c["total"]}** |')
    out.append('')
    held = c['fixed_held_by']
    out.append(f'Of the {c["by_status"]["fixed"]} fixed, {held["a test"]} are held by a test, {held["a check"]} by a check alone, and '
               f'{held["the source alone"]} by the source as it reads now, where no test was found that asserts the new words. '
               f'Of the {c["by_status"]["left"]} left, {c["left_by_owner"]["owner"]} are for the owner and '
               f'{c["left_by_owner"]["a future pass"]} for a future pass'
               + (f', and {c["left_by_owner"]["none"]} need nothing.' if c['left_by_owner']['none'] else '.'))
    out.append('')
    out.append('By record: how many defects each file names. A defect two records describe is counted in each, so this column')
    out.append(f'adds up to more than {c["total"]}.')
    out.append('')
    out.append('| Record | Defects |')
    out.append('|---|---|')
    for f, n in c['by_record'].items():
        out.append(f'| `{f}` | {n} |')
    out.append('')
    out.append('## Fixed')
    out.append('')
    out.append('| Id | Defect | Kind | Records | Commit | Held By Now |')
    out.append('|---|---|---|---|---|---|')
    for e in fixed:
        title = cell(e['title']) + (f' *({cell(e["remark"])})*' if e.get('remark') else '')
        out.append(f'| `{e["id"]}` | {title} | {e["kind"]} | {records_cell(e)} | {commit_cell(e)} | {evidence_cell(e)} |')
    out.append('')
    out.append('## Left')
    out.append('')
    out.append('| Id | Defect | Kind | Records | Why It’s Left | For |')
    out.append('|---|---|---|---|---|---|')
    for e in left:
        out.append(f'| `{e["id"]}` | {cell(e["title"])} | {e["kind"]} | {records_cell(e)} | {cell(e["why"])} | {e["owner"]} |')
    out.append('')
    out.append('## Read And Not Counted')
    out.append('')
    out.append('Items in the records that read like defects and aren’t counted as one, each with why. Ordinary rewording, a')
    out.append('choice between two true wordings and a note for the next writer are the pass’s work, not its defects.')
    out.append('')
    out.append('| Records | Why It Isn’t Counted |')
    out.append('|---|---|')
    for x in data.get('excluded', []):
        files = '<br>'.join(f'`{r["file"]}`, “{cell(short(quoted(r["at"]), 70))}”' for r in x['records'])
        out.append(f'| {files} | {cell(x["why"])} |')
    out.append('')
    return '\n'.join(out)


def rendered(data: dict) -> tuple[str, str]:
    data = dict(data)
    data['counts'] = counts(data)
    ordered = {k: data[k] for k in ('note', 'entries', 'excluded', 'counts') if k in data}
    return json.dumps(ordered, ensure_ascii=False, indent=2) + '\n', page(ordered)


def git(*args: str, cwd: Path) -> subprocess.CompletedProcess:
    return subprocess.run(['git', *args], cwd=cwd, capture_output=True, text=True)


def verify(data: dict) -> list[str]:
    top = root()
    out = []
    head = git('rev-parse', 'HEAD', cwd=top).stdout.strip()
    touched_cache: dict[str, set[str]] = {}

    def touched(c: str) -> set[str]:
        if c not in touched_cache:
            parents = git('rev-list', '--parents', '-n', '1', c, cwd=top).stdout.split()[1:]
            base = parents[0] if parents else '4b825dc642cb6eb9a060e54bf8d69288fbee4904'
            touched_cache[c] = set(git('diff', '--name-only', base, c, cwd=top).stdout.split())
        return touched_cache[c]

    def holds(path: str, words: str) -> bool:
        p = top / path
        return p.is_file() and words in p.read_text(encoding='utf-8')

    for x in data['entries'] + data.get('excluded', []):
        i = x.get('id', 'excluded')
        for r in x['records']:
            if not holds(f'docs/verification/language-2026-10-17/{r["file"]}', r['at']):
                out.append(f'{i}: {r["file"]} doesn’t hold “{r["at"]}”')
    for e in data['entries']:
        i = e['id']
        for c in ([e['commit']] if e.get('commit') else []) + e.get('also', []):
            if git('cat-file', '-e', f'{c}^{{commit}}', cwd=top).returncode != 0:
                out.append(f'{i}: no commit {c}')
                continue
            if git('merge-base', '--is-ancestor', BASE, c, cwd=top).returncode != 0 or c.startswith(BASE):
                out.append(f'{i}: {c} isn’t after {BASE}')
            if git('merge-base', '--is-ancestor', c, head, cwd=top).returncode != 0:
                out.append(f'{i}: {c} isn’t in HEAD')
        if e.get('commit'):
            for f in e.get('touches', []):
                if f not in touched(e['commit']):
                    out.append(f'{i}: {e["commit"]} doesn’t change {f}')
            if not e.get('touches'):
                out.append(f'{i}: fixed, but names no file its commit changed')
        for ev in e.get('evidence', []):
            if 'test' in ev and not holds(ev['test'], ev['title']):
                out.append(f'{i}: {ev["test"]} has no title “{ev["title"]}”')
            if 'source' in ev and not holds(ev['source'], ev['holds']):
                out.append(f'{i}: {ev["source"]} doesn’t hold “{ev["holds"]}”')
            if 'record' in ev and not holds(ev['record'], ev['holds']):
                out.append(f'{i}: {ev["record"]} doesn’t hold “{ev["holds"]}”')
            if 'absent' in ev and (not (top / ev['absent']).is_file() or holds(ev['absent'], ev['string'])):
                out.append(f'{i}: {ev["absent"]} still holds “{ev["string"]}”, or isn’t there')
    return out


def main() -> int:
    data = load()
    shape = problems_in_shape(data)
    if shape:
        print('\n'.join(shape))
        return 1
    if '--verify' in sys.argv:
        found = verify(data)
        print('\n'.join(found) if found else f'Every entry holds: {len(data["entries"])} entries, {len(data.get("excluded", []))} not counted.')
        return 1 if found else 0
    text, md = rendered(data)
    if '--check' in sys.argv:
        behind = [p.name for p, want in ((DATA, text), (PAGE, md)) if not p.is_file() or p.read_text(encoding='utf-8') != want]
        print(f'Behind the entries: {", ".join(behind)}' if behind else 'defects.json’s counts and DEFECTS.md are the entries’.')
        return 1 if behind else 0
    DATA.write_text(text, encoding='utf-8')
    PAGE.write_text(md, encoding='utf-8')
    c = counts(data)
    print(f'{c["total"]} defects: {c["by_status"]["fixed"]} fixed, {c["by_status"]["left"]} left; '
          + ', '.join(f'{k} {c["by_kind"][k]["total"]}' for k in KINDS) + f'; {c["not_counted"]} not counted.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
