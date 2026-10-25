#!/usr/bin/env python3
"""Re-points file:line citations in the records' JSON through a line map from HEAD to the working tree (difflib): a line
that didn't change goes where it went; a line in a changed stretch is printed for a reader. Usage: repoint-diff.py <file>..."""
import difflib, re, subprocess, sys, os
os.chdir('/home/user/1221')
files = sys.argv[1:]
maps = {}
for f in files:
    old = subprocess.run(['git', 'show', 'HEAD:' + f], capture_output=True, text=True).stdout.split('\n')
    new = open(f, encoding='utf-8').read().split('\n')
    m = {}
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, old, new, autojunk=False).get_opcodes():
        if tag == 'equal':
            for k in range(i2 - i1): m[i1 + k + 1] = j1 + k + 1
    maps[f] = m
pat = '(' + '|'.join(re.escape(f) for f in files) + r'):(\d+)'
targets = subprocess.run(['git', 'grep', '-l', '-E', pat.replace(r'(\d+)', '([0-9]+)'), '--', 'docs/**/*.json', 'docs/*.json'], capture_output=True, text=True).stdout.split()
for p in targets:
    raw = open(p, encoding='utf-8').read()
    def sub(mt):
        f, ln = mt.group(1), int(mt.group(2))
        if ln in maps[f]: return f'{f}:{maps[f][ln]}'
        print(f'{p}: {f}:{ln} in a changed stretch')
        return mt.group(0)
    out = re.sub(pat, sub, raw)
    if out != raw: open(p, 'w', encoding='utf-8').write(out); print('re-pointed', p)
