"""
Brief 13's own clauses on its tested commit, read from the final runs, never typed: the journeys area's rows and the
interface area's, each as its area wrote it, re-stated where the runs on the tested commit bear it out and carrying that
commit as their measurement; one that doesn't is left Implemented, Verification Incomplete with what the run showed.
Writes verification-result.json, which criteria.py and receipt.py read after the areas' results, so its rows replace
theirs.

    python3 docs/verification/playthroughs-2026-10-17/verify.py [journeys-final] [interface-final]

Run from the repository's root once runs13.sh's journeys lanes (JR1 to JR3, JRC) and its UI lane are done, their outputs
copied into those folders. The folders default to brief 13's final runs; the areas' own (journeys, interface) can be
named instead, to check this against what the areas saw.
"""
import json, os, re, sys
B = 'docs/verification/playthroughs-2026-10-17'
JF = f'{B}/{sys.argv[1] if len(sys.argv) > 1 else "journeys-final"}'
UF = f'{B}/{sys.argv[2] if len(sys.argv) > 2 else "interface-final"}'
IAV, IVI = 'Implemented And Verified', 'Implemented, Verification Incomplete'

def lane_at(name):
    p = f'{B}/runs/exits-{name}.txt'
    return re.search(r'^at (\w+)', open(p, encoding='utf-8').read(), re.M).group(1) if os.path.exists(p) else None

def lane_exits(*names):
    # Each step a lane recorded, and the ones that didn't exit 0; a lane with no record counts as not run.
    steps, bad = 0, []
    for n in names:
        p = f'{B}/runs/exits-{n}.txt'
        if not os.path.exists(p): bad.append(f'{n} not run'); continue
        for line in open(p, encoding='utf-8'):
            m = re.match(r'^(\S+) exit=(\d+) ', line)
            if m: steps += 1; bad += [m.group(1)] if m.group(2) != '0' else []
    return steps, bad

journeys = json.load(open(f'{B}/journeys-result.json', encoding='utf-8'))
interface = json.load(open(f'{B}/interface-result.json', encoding='utf-8'))
area = {x['id']: x for x in json.load(open(f'{B}/journeys/summary.json', encoding='utf-8'))}
final = {x['id']: x for x in json.load(open(f'{JF}/summary.json', encoding='utf-8'))}
ui = json.load(open(f'{UF}/summary.json', encoding='utf-8'))

# The journeys: every one played to the end, each of the ten checks passed, and each ending as the area's run ended.
same_end = lambda a, b: re.sub(r'\s+', ' ', str(a.get('actual', ''))) == re.sub(r'\s+', ' ', str(b.get('actual', '')))
j_fail = [i for i, x in final.items() if not x.get('done') or any(v != 'pass' for v in x.get('checks', {}).values())]
j_moved = [i for i, x in final.items() if i in area and not same_end(x, area[i])]
j_missing = sorted(set(area) - set(final))
j_steps, j_bad = lane_exits('JR1', 'JR2', 'JR3', 'JRC')
j_ok = not j_fail and not j_missing and not j_bad
j_at = lane_at('JR1')
j_said = (f"Played again on the tested commit {j_at} (runs13.sh JR1 to JR3 and JRC, {j_steps} steps, " + (f"not exit 0: {', '.join(j_bad)}" if j_bad else 'every one exit 0') + f"): {len(final)} journeys, "
          f"{sum(1 for x in final.values() if x.get('done'))} played to the end, {len(final) - len(j_fail)} with all ten checks passed"
          + (f'; failed: {", ".join(j_fail)}' if j_fail else '') + (f'; missing: {", ".join(j_missing)}' if j_missing else '')
          + (f"; ending other than the area's run: {', '.join(j_moved)}" if j_moved else "; each ending as the area's run ended") + '.')
j_evidence = [{'file': f'{JF}/summary.json', 'kind': 'measurement', 'proves': 'the 25 journeys on the tested commit: profile, seed, played, expected, actual, the ten checks'},
              {'file': f'{JF}/compare.json', 'kind': 'measurement', 'proves': 'what the expectations compare across journeys, on the tested commit'}]

rows = []
for r in journeys['rows']:
    if r['id'] == 'journeys.6-interpretations':
        # Closed by the coordinator's FIXTUREs (tests/stage-interpretation.test.ts), which show every such difference to
        # be the way's lean and draws, as the chooser says, and nothing else.
        rows.append({**r, 'disposition': 'closed', 'status': IAV,
                     'exercised': "The 78 previews the journeys found differing from leaving the way open, with no fit or grain named, are shown to be the way's lean and its draws alone, which the chooser names (What It Draws On, and 'Each side leans the work's quality dimensions toward what it is and draws on the abilities shown'). On every class scene, for two uneven actors, the 52 ways that name nothing each move the take, and each comes to the open take exactly with its lean and draws taken out; all 800 that name no misfit come to it exactly with the grain taken out too. A hidden effect put in materialContext fails them.",
                     'evidence': [{'file': 'tests/stage-interpretation.test.ts', 'title': "a way of playing’s difference where the scene names no fit and no grain (brief 13) > FIXTURE: on every class scene, for two uneven actors, a way that names no fit and no grain differs from leaving it open only by its lean and its draws: taken out, the take is the open one’s exactly", 'kind': 'fixture'},
                                  {'file': 'tests/stage-interpretation.test.ts', 'title': "a way of playing’s difference where the scene names no fit and no grain (brief 13) > FIXTURE: on every class scene, for the same two actors, every way that names no misfit differs from leaving it open by its lean, its draws and the scene’s grain alone: all three taken out, the take is the open one’s exactly", 'kind': 'fixture'}],
                     'statusNote': 'Closed by the coordinator (verify.py), with the two FIXTUREs it names; until then Implemented, Verification Incomplete, as the journeys area left it.'})
        continue
    if r['status'] != IAV:
        rows.append(r)
        continue
    if j_ok:
        rows.append({**r, 'evidence': r.get('evidence', []) + j_evidence, 'measured': {'commit': j_at, 'watch': 'engine'}, 'statusNote': j_said})
    else:
        rows.append({**r, 'status': IVI, 'disposition': 'remaining', 'missing': j_said, 'statusNote': j_said})

# The interface: every playthrough at both widths, every step passed and each of the six things exercised.
u_at = lane_at('UI')
u_steps, u_bad = lane_exits('UI')
u_ok = bool(ui.get('allPassed')) and len(ui.get('runs', [])) == 6 and not u_bad
u_said = (f"Played again on the tested commit {u_at} (runs13.sh UI, on its build, {u_steps} steps, " + (f"not exit 0: {', '.join(u_bad)}" if u_bad else 'every one exit 0') + "): "
          + '; '.join(f"{x['playthrough']} at {x['width']}: {x.get('passed')} of {x.get('steps')}" + (f", missing {', '.join(x['sixMissing'])}" if x.get('sixMissing') else '') for x in ui.get('runs', [])) + '.')
for r in interface['rows']:
    if r['status'] != IAV:
        rows.append(r)
        continue
    ev = r.get('evidence', []) + [{'file': f'{UF}/summary.json', 'kind': 'measurement', 'proves': u_said}]
    if u_ok:
        rows.append({**r, 'evidence': ev, 'measured': {'commit': u_at, 'watch': 'app'}, 'statusNote': u_said})
    else:
        rows.append({**r, 'status': IVI, 'disposition': 'remaining', 'missing': u_said, 'statusNote': u_said})

# The defects the coordinator found or was handed, each with its fix and what ran again; lane A's rerun read from its
# record. And what stays open, from the areas' own words, the one finding fixed here left out.
a_steps, a_bad = lane_exits('A')
a_first, a_first_bad = lane_exits('A-first')
defects = [
    {'what': "OPT was approved at its decision for an application made in the window before the program's end, though the degree was withheld meanwhile, against optRefusal's own rule at the application (the journeys area's finding, J02's superseded first run).",
     'foundBy': 'the journeys area (findingsNotFixed), left for the coordinator', 'fixed': True, 'commit': 'fa36c201', 'blocksCompletion': False,
     'test': "tests/evidence-g15-papers.test.ts ‘documents.apply_opt > PLAYER JOURNEY: an application made in the window before the program’s end is denied at its decision when the degree is withheld meanwhile, the fee kept, and approved for a twin whose degree is conferred’",
     'rerun': 'the OPT test files; with the check taken out, the test fails'},
    {'what': f"The built app's acceptance run chose a way of playing for Table Work on the workload save, which is written work: the step had relied on D3, the defect the journeys area fixed, and failed at both widths on {lane_at('A-first')} ({a_first} steps, not exit 0: {', '.join(a_first_bad) or 'none'}).",
     'foundBy': 'the final runs (runs13.sh A, runs/exits-A-first.txt)', 'fixed': True, 'commit': '51cdd7d6', 'blocksCompletion': False,
     'test': "tools/acceptance-ui.mjs: on the workload save, Table Work offers no way of playing; the circumstances choice on the roundups save's scene study",
     'rerun': f"lane A again on {lane_at('A')}, the game's code unchanged: {a_steps} steps, " + (f"not exit 0: {', '.join(a_bad)}" if a_bad else 'every one exit 0') + ' (runs/exits-A.txt)'},
]
journeys_open = [{'what': x['what'], 'why': x['why']} for x in journeys.get('findingsNotFixed', []) if not x['what'].startswith('OPT approved')]
limitations = journeys_open + [{'what': x, 'why': 'the interface area'} for x in interface.get('remaining', []) if 'stale' not in x]

json.dump({'area': 'verification', 'on': '2026-10-17', 'journeys': j_said, 'interface': u_said, 'rows': rows, 'defectsFound': defects, 'limitations': limitations},
          open(f'{B}/verification-result.json', 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
print(j_said); print(u_said)
print(f"{sum(1 for r in rows if r['status'] == IAV)} of {len(rows)} rows verified")
