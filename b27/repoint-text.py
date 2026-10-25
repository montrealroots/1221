#!/usr/bin/env python3
"""Re-points file:line citations in the records' JSON to where the same line of code is now, by its text at HEAD; ambiguous
or vanished lines are printed for a reader. Usage: repoint-text.py <file> [<file> ...] (the source files that changed)."""
import json, re, subprocess, sys, os
os.chdir('/home/user/1221')
files = sys.argv[1:]
old = {f: subprocess.run(['git', 'show', 'HEAD:' + f], capture_output=True, text=True).stdout.split('\n') for f in files}
new = {f: open(f, encoding='utf-8').read().split('\n') for f in files}
targets = [p for p in subprocess.run(['git', 'grep', '-l', '-E', '(' + '|'.join(re.escape(f) for f in files) + r'):[0-9]+', '--', 'docs/**/*.json', 'docs/*.json'], capture_output=True, text=True).stdout.split()]
for p in targets:
    raw = open(p, encoding='utf-8').read()
    def sub(m):
        f, ln = m.group(1), int(m.group(2))
        text = old[f][ln - 1] if ln - 1 < len(old[f]) else None
        if text is not None and ln - 1 < len(new[f]) and new[f][ln - 1] == text:
            return m.group(0)
        hits = [i + 1 for i, l in enumerate(new[f]) if text is not None and l == text]
        if len(hits) == 1:
            return f'{f}:{hits[0]}'
        print(f'{p}: {f}:{ln} UNRESOLVED ({len(hits)} matches): {(text or "").strip()[:90]}')
        return m.group(0)
    out = re.sub('(' + '|'.join(re.escape(f) for f in files) + r'):(\d+)', sub, raw)
    if out != raw:
        open(p, 'w', encoding='utf-8').write(out)
        print('re-pointed', p)
