"""
Brief 13's clauses, as brief 19's verify.py held them, on brief 20's tested commit, read from brief 20's runs, never
typed. Brief 20 changed what the game does in money (a card's limit carried by income or savings), the career (a request
to meet that lapses, a part posted again), the School, papers, benefits and life, and with it files the clauses'
measurements watch, so each clause brief 19's verify.py held is held again here where brief 20's runs bear it out,
carrying brief 20's commit as its measurement; one that isn't borne out is left Implemented, Verification Incomplete with
what the run showed. Writes verification-result.json, which criteria.py reads after brief 19's results, so its rows
replace theirs. Brief 19's verify.py (`../../career-2026-10-20/final-runs/verify.py`), on brief 20's records.

    python3 docs/verification/audit-2026-10-21/final-runs/verify.py

Run from the repository's root once runs20.sh's journeys lanes and its UI lane are done and gathered (collect20.sh).
- The journeys: every one of brief 13's played to the end on brief 20's commit, each of its ten checks passed, and each
  ending as brief 19's final run ended (`../../career-2026-10-20/final-runs/journeys-final/summary.json`), or moved where
  `journeys-moved.json` says which of brief 20's changes moved it and how. Brief 20's starting point, 340ce7ae, has the
  source brief 19 measured (no file under src/engine changed after 63fe7391), so brief 19's endings are the endings with
  brief 20's changes taken out. An ending that moved with no such reading isn't explained, and the clause isn't held.
- The interface: brief 13's three playthroughs at both widths, every step passed. Brief 14's three journeys run in the
  same lane (journeys14-final/) and are reported apart: they aren't brief 13's clauses.
"""
import json, os, re
B = 'docs/verification/audit-2026-10-21/final-runs'
PRIOR = 'docs/verification/career-2026-10-20/final-runs'   # the pass before: brief 19's held rows and final journeys
IAV, IVI = 'Implemented And Verified', 'Implemented, Verification Incomplete'

def lane_at(name):
    p = f'{B}/runs/exits-{name}.txt'
    return re.search(r'^at (\w+)', open(p, encoding='utf-8').read(), re.M).group(1) if os.path.exists(p) else None

def lane_exits(*names, only=None):
    """Each step a lane recorded, and the ones that didn't exit 0; `only` keeps the steps whose names match it."""
    steps, bad = 0, []
    for n in names:
        p = f'{B}/runs/exits-{n}.txt'
        if not os.path.exists(p): bad.append(f'{n} not run'); continue
        for line in open(p, encoding='utf-8'):
            m = re.match(r'^(\S+) exit=(\d+) ', line)
            if m and (only is None or re.match(only, m.group(1))):
                steps += 1; bad += [m.group(1)] if m.group(2) != '0' else []
    return steps, bad

was = json.load(open(f'{PRIOR}/verification-result.json', encoding='utf-8'))
before = {x['id']: x for x in json.load(open(f'{PRIOR}/journeys-final/summary.json', encoding='utf-8'))}
final = {x['id']: x for x in json.load(open(f'{B}/journeys-final/summary.json', encoding='utf-8'))}
ui = json.load(open(f'{B}/interface-final/summary.json', encoding='utf-8'))
# Each moved ending's reading, by the journey's id: {"was", "now", "by", "why"}, written after the runs from the two
# endings and the journey's own record, and held here to the endings as they stand (a reading of another ending is void).
MOVED = f'{B}/journeys-moved.json'
readings = json.load(open(MOVED, encoding='utf-8')) if os.path.exists(MOVED) else {}

flat = lambda x: re.sub(r'\s+', ' ', str(x.get('actual', '')))
j_fail = [i for i, x in final.items() if not x.get('done') or any(v != 'pass' for v in x.get('checks', {}).values())]
j_moved = [i for i, x in final.items() if i in before and flat(x) != flat(before[i])]
j_read = [i for i in j_moved if i in readings and readings[i].get('was') == flat(before[i]) and readings[i].get('now') == flat(final[i]) and readings[i].get('by') and readings[i].get('why')]
j_unexplained = [i for i in j_moved if i not in j_read]
j_missing = sorted(set(before) - set(final))
j_steps, j_bad = lane_exits('JR1', 'JR2', 'JR3', 'JRC')
j_ok = not j_fail and not j_missing and not j_bad and not j_unexplained
j_at = lane_at('JR1')
j_said = (f"Played again on brief 20's commit {j_at} (runs20.sh JR1 to JR3 and JRC, {j_steps} steps, " + (f"not exit 0: {', '.join(j_bad)}" if j_bad else 'every one exit 0') + f"): {len(final)} journeys, "
          f"{sum(1 for x in final.values() if x.get('done'))} played to the end, {len(final) - len(j_fail)} with all ten checks passed"
          + (f'; failed: {", ".join(j_fail)}' if j_fail else '') + (f'; missing: {", ".join(j_missing)}' if j_missing else '')
          + (f"; ending other than brief 19's final run, with no reading of why: {', '.join(j_unexplained)}" if j_unexplained else '')
          + (f"; ending other than brief 19's final run by brief 20's changes, each read in journeys-moved.json: {', '.join(f'{i} ({readings[i]['by']})' for i in j_read)}" if j_read else '')
          + ('' if j_moved else "; each ending as brief 19's final run ended") + '.')
j_evidence = [{'file': f'{B}/journeys-final/summary.json', 'kind': 'measurement', 'proves': "brief 13's 25 journeys on brief 20's tested commit"}] + ([{'file': MOVED, 'kind': 'review', 'proves': "why each moved ending moved"}] if j_read else [])

u_at = lane_at('UI')
u_steps, u_bad = lane_exits('UI', only=r'ui-(build|save-workload|save-specialist|normal|setback|specialist)')
u_ok = bool(ui.get('allPassed')) and len(ui.get('runs', [])) == 6 and not u_bad
u_said = (f"Played again on brief 20's commit {u_at} (runs20.sh UI, on its build, {u_steps} steps of brief 13's playthroughs, " + (f"not exit 0: {', '.join(u_bad)}" if u_bad else 'every one exit 0') + "): "
          + '; '.join(f"{x['playthrough']} at {x['width']}: {x.get('passed')} of {x.get('steps')}" for x in ui.get('runs', [])) + '.')

rows = []
for r in was['rows']:
    m = r.get('measured')
    if r['status'] != IAV or not m:
        continue
    ok, at, said, ev = (j_ok, j_at, j_said, j_evidence) if m['watch'] == 'engine' else (u_ok, u_at, u_said, [{'file': f'{B}/interface-final/summary.json', 'kind': 'measurement', 'proves': u_said}])
    if ok:
        rows.append({**r, 'evidence': r.get('evidence', []) + ev, 'measured': {'commit': at, 'watch': m['watch']}, 'statusNote': said})
    else:
        rows.append({**r, 'status': IVI, 'disposition': 'remaining', 'missing': said, 'statusNote': said})
json.dump({'rows': rows, 'journeys': j_said, 'interface': u_said, 'moved': j_moved}, open(f'{B}/verification-result.json', 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
print(j_said); print(u_said); print(f'{len(rows)} rows: {sum(1 for r in rows if r["status"] == IAV)} held on brief 20\'s commit')
