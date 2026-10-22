"""Runs each mutation in a clone of the tested commit: applies it, runs its tests, records killed or survived, puts it back.

    python3 run.py <clone> <results.json> [B21-G5,B21-G9]   (brief 21, 2026-10-22; the clone was 59e9c4af)
"""
import json, subprocess, sys, os
clone, out = sys.argv[1], sys.argv[2]
muts = json.load(open(os.path.join(os.path.dirname(__file__), 'mutations.json')))
only = set(sys.argv[3].split(',')) if len(sys.argv) > 3 else None
results = json.load(open(out)) if os.path.exists(out) else {}
for m in muts:
    if only and m['id'] not in only: continue
    p = os.path.join(clone, m['file']); src = open(p).read()
    if src.count(m['old']) != 1:
        results[m['id']] = {'claim': m['claim'], 'result': f"not applied: the text occurs {src.count(m['old'])} times"}; continue
    open(p, 'w').write(src.replace(m['old'], m['new']))
    try:
        r = subprocess.run(['npx', 'vitest', 'run', *m['tests']], cwd=clone, capture_output=True, text=True, timeout=1800)
        tail = [l for l in r.stdout.splitlines() if 'Tests ' in l or 'Test Files' in l]
        failed = [l.strip() for l in r.stdout.splitlines() if l.strip().startswith('×')][:6]
        results[m['id']] = {'claim': m['claim'], 'file': m['file'], 'tests': m['tests'], 'result': 'killed' if r.returncode != 0 else 'survived', 'summary': tail, 'failing': failed}
    finally:
        open(p, 'w').write(src)
    json.dump(results, open(out, 'w'), indent=1, ensure_ascii=False)
    print(m['id'], results[m['id']]['result'], flush=True)
