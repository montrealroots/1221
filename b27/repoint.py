#!/usr/bin/env python3
"""Re-points the guide's wiring list's hand-kept handler lines to where each command is registered now, by the rule
tests/b20-guide-wiring.test.ts holds (the line names the kind, or a constant holding it). Usage: repoint.py"""
import json, re, os
os.chdir('/home/user/1221')
p = 'docs/verification/audit-2026-10-21/areas/guide/wiring.json'
d = json.load(open(p))
named = {}
for root, _, files in os.walk('src/engine'):
    for f in files:
        if f.endswith('.ts'):
            for m in re.finditer(r"const ([A-Z][A-Z0-9_]*) = '([a-z0-9_]+\.[a-z0-9_]+)'", open(os.path.join(root, f)).read()):
                named[m.group(1)] = m.group(2)
fixed, bad = 0, []
for x in d['controls'] + d['decisionAnswers'] + d['stopChoices']:
    h, k = x.get('handler'), x.get('kind')
    if not h or not k:
        continue
    m = re.match(r'^([\w./-]+):(\d+)$', h)
    if not m:
        continue
    path, ln = m.group(1), int(m.group(2))
    lines = open(path).read().split('\n')
    def ok(line):
        return f"'{k}'" in line or any(named.get(n) == k for n in re.findall(r'\b([A-Z][A-Z0-9_]+)\b', line))
    if ln - 1 < len(lines) and ok(lines[ln - 1]):
        continue
    cands = [i + 1 for i, l in enumerate(lines) if ok(l) and any(w in l for w in ('onCommand', 'onSchedule', 'defineStop', 'registerCommand'))]
    if len(cands) == 1:
        x['handler'] = f'{path}:{cands[0]}'
        fixed += 1
        print('re-pointed', k, h, '->', x['handler'])
    else:
        bad.append((k, h, cands))
open(p, 'w').write(json.dumps(d, indent=1, ensure_ascii=False) + '\n')
print('re-pointed', fixed, 'unresolved', bad)
