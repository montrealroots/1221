"""Runs each mutation in a clone of the tested commit: applies it, runs its tests, records killed or survived, puts it back.

    python3 run.py <clone> <results.json> [B22-A1,B22-W3]   (brief 22, 2026-10-22, as brief 21's run.py)

A mutation whose text doesn't occur exactly once is recorded not applied, never guessed at. A run whose tests fail to
load or time out is recorded as such, not as killed: only an assertion that fails counts.
"""
import json, subprocess, sys, os
clone, out = sys.argv[1], sys.argv[2]
muts = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'mutations.json')))
only = set(sys.argv[3].split(',')) if len(sys.argv) > 3 else None
results = json.load(open(out)) if os.path.exists(out) else {}
for m in muts:
    if only and m['id'] not in only: continue
    p = os.path.join(clone, m['file']); src = open(p).read()
    if src.count(m['old']) != 1:
        results[m['id']] = {'claim': m['claim'], 'result': f"not applied: the text occurs {src.count(m['old'])} times"}
        json.dump(results, open(out, 'w'), indent=1, ensure_ascii=False); print(m['id'], 'not applied', flush=True); continue
    open(p, 'w').write(src.replace(m['old'], m['new']))
    try:
        r = subprocess.run(['npx', 'vitest', 'run', *m['tests']], cwd=clone, capture_output=True, text=True, timeout=2400)
        lines = r.stdout.splitlines()
        tail = [l.strip() for l in lines if 'Tests ' in l or 'Test Files' in l]
        failed = [l.strip() for l in lines if l.strip().startswith('×')][:8]
        asserted = any('AssertionError' in l or 'expected' in l for l in lines)
        result = 'survived' if r.returncode == 0 else ('killed' if failed and asserted else 'failed to run')
        results[m['id']] = {'claim': m['claim'], 'file': m['file'], 'tests': m['tests'], 'result': result, 'summary': tail, 'failing': failed}
    except subprocess.TimeoutExpired:
        results[m['id']] = {'claim': m['claim'], 'file': m['file'], 'tests': m['tests'], 'result': 'timed out'}
    finally:
        open(p, 'w').write(src)
    json.dump(results, open(out, 'w'), indent=1, ensure_ascii=False)
    print(m['id'], results[m['id']]['result'], flush=True)
