"""Brief 20's mutations (criteria T2): each breaks one connection a test claims to hold, applied alone to the clone given,
its tests run, and the file put back as it was. A mutation is a JSON object, {"id", "what", "file", "find", "replace",
"tests"}, its `find` met exactly once in the file; a list of them is a file under mutations/.

What a run says, from vitest's JSON report:
- killed: a test failed on an assertion (an `expect`, an AssertionError), the failing test and its first line given;
- SETUP ERROR: the run failed, and no test failed on an assertion: a file that didn't load, an error thrown before an
  expectation, or no test collected. Not a kill: the mutation broke the test's setup, not the behavior it holds;
- SURVIVED: every test passed with the connection broken;
- NOT APPLIED: `find` wasn't met exactly once.

    python3 docs/verification/audit-2026-10-21/mutate.py <clone> <mutations.json> <out.txt> [id ...]
"""
import json, os, subprocess, sys, tempfile

root, listing, out = sys.argv[1], sys.argv[2], sys.argv[3]
only = set(sys.argv[4:])
mutations = json.load(open(listing, encoding='utf-8'))
ASSERTION = ('AssertionError', 'expected ', 'Expected', 'toBe', 'toEqual', 'toContain', 'toMatch', 'toHaveLength', 'toBeGreaterThan', 'toBeLessThan', 'toBeTruthy', 'toBeFalsy', 'toBeDefined', 'toBeUndefined', 'toStrictEqual', 'toHaveProperty')


def verdict(report, code):
    if code == 0:
        return 'SURVIVED', ''
    assertion, setup = [], []
    for f in report.get('testResults', []):
        if f.get('status') == 'failed' and not f.get('assertionResults'):
            setup.append(f"{os.path.relpath(f.get('name', ''), root)}: {(f.get('message') or '').strip().splitlines()[0][:200] if f.get('message') else 'failed to load'}")
        for a in f.get('assertionResults', []):
            if a.get('status') != 'failed':
                continue
            msg = ' '.join((a.get('failureMessages') or [''])[0].strip().splitlines()[:1])[:220]
            (assertion if any(k in msg for k in ASSERTION) else setup).append(f"{a.get('fullName', '')[:160]}: {msg}")
    if assertion:
        return 'killed', assertion[0]
    return 'SETUP ERROR', setup[0] if setup else f'exit {code}, no test failed'


for m in mutations:
    if only and m['id'] not in only:
        continue
    path = os.path.join(root, m['file'])
    src = open(path, encoding='utf-8').read()
    n = src.count(m['find'])
    if n != 1:
        line = f"{m['id']} NOT APPLIED (its text met {n} times): {m['what']} [{m['file']}]"
    else:
        open(path, 'w', encoding='utf-8').write(src.replace(m['find'], m['replace'], 1))
        report_file = tempfile.mktemp(suffix='.json')
        try:
            r = subprocess.run(['npx', 'vitest', 'run', *m['tests'], '--reporter=json', f'--outputFile={report_file}', '--pool=forks', '--poolOptions.forks.singleFork=true'], cwd=root, capture_output=True, text=True, timeout=3600)
            report = json.load(open(report_file, encoding='utf-8')) if os.path.exists(report_file) else {}
            v, why = verdict(report, r.returncode)
            counts = f"{report.get('numFailedTests', '?')} of {report.get('numTotalTests', '?')} failed"
            line = f"{m['id']} {v}: {m['what']} [{m['file']}] ({counts})" + (f" by: {why}" if why else '')
        finally:
            open(path, 'w', encoding='utf-8').write(src)
            if os.path.exists(report_file):
                os.remove(report_file)
    print(line, flush=True)
    open(out, 'a', encoding='utf-8').write(line + '\n')
