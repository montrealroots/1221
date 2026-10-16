"""
The completion matrix's criterion and integration rows (the integration pass of 2026-10-16), written to criteria.json,
which tools/completion-matrix.mjs joins with what the gate already holds. Until later on 2026-10-16 this lived only in the
scratchpad of the session that wrote it, and criteria.json could not be made again from the repository.

    python3 docs/verification/integration-2026-10-16/criteria.py docs/verification/integration-2026-10-16/criteria.json

Run from the repository's root; then node tools/completion-matrix.mjs and --check.
"""
import json, sys
D = 'docs/verification/integration-2026-10-16'
AG = 'docs/verification/attributes-genres-2026-10-16/acceptance-criteria.md'
STC = 'docs/verification/stage-2026-10-16/criteria.md'
rows = []
def row(id, group, goal, entry, threshold, before, after, status, evidence, citations, changes='Nothing in this pass', failure='', implementation='', reads='', sees='', systems=''):
    rows.append({
        'id': id, 'group': group, 'kind': 'criterion',
        'goal': goal, 'entry': entry,
        'preconditions': 'A measurement: the set and the actors its criterion names, written before it was first run',
        'reads': reads or 'The judge (`systems/evaluation.ts`, `systems/piece.ts`) over the pieces the criterion names',
        'decisions': 'None: a measurement, not a player decision',
        'validation': f'Threshold: {threshold}',
        'changes': changes, 'later': 'None', 'systems': systems or 'Every judged piece: briefs, class scenes, nights, casting reads, coursework',
        'sees': sees or 'Its figures on the screens that show a take, a scene or a part (the account says which)',
        'saveLoad': 'A result kept under its ruleset (`RULESET` evaluation-9) is shown as it was',
        'failure': failure or (f'Before: {before}; after: {after}'),
        'implementation': implementation or 'systems/evaluation.ts, systems/piece.ts, content/tasks.ts, content/approaches.ts',
        'evidence': '; '.join(evidence), 'status': status, 'citations': citations,
        'before': before, 'after': after,
    })
cite = lambda f, t=None: ({'file': f, 'title': t} if t else {'file': f})
ST = f'{D}/st3/stage-restraint-draw.json'
# The stage
row('ST1', 'Criteria: The Stage', 'No universal best: each scale side ahead on at least 25% of materials where both fit, for an even actor', 'npx vite-node tools/interpretation.ts -- --fresh --stage', '25% each side', 'restrained 50, expansive 33 of 85', 'restrained 49, expansive 37 of 89', 'Met', [ST, STC], [cite(ST), cite(STC)])
row('ST2', 'Criteria: The Stage', 'The house moves no scale; the better side rests on the scene', 'the same', 'no house signal; every band-apart case rests on the scene', '72 of 72', '75 of 75', 'Met', [ST], [cite(ST)])
row('ST3', 'Criteria: The Stage', 'Projection is a demand: the voice-and-body specialist better on stage; the even actor the same on both', 'the same, and tests/rounding-once.test.ts', 'specialist 171 of 171; even actor the same on 171 of 171', 'specialist 171/171; even actor 159 of 171', 'specialist 171/171; even actor 157 of 171 as shown; ST3′ (proposed) 171 of 171 on each part', 'Not Met', [f'{D}/st3.md', ST, 'tests/rounding-once.test.ts'], [cite(f'{D}/st3.md'), cite('tests/rounding-once.test.ts', 'an actor even in everything the formula reads, its stamina not draining, comes out the same on stage and at a close frame on every case'), cite('tests/rounding-once.test.ts', 'the criterion’s even actor comes out less than half a rounding step apart on every case')], changes='A result rounded once from exact parts (evaluation-9); the 0.1 steps were the rounding’s', failure='As written it asks two different real numbers to show the same tenth; the difference is the even actor’s stamina drain on the execution the stage weighs. Contradictory as written; ST3′ proposed in st3.md, not counted')
row('ST4', 'Criteria: The Stage', 'Scenes within a genre differ: drama, comedy and tragedy each suit both sides somewhere', 'the same', 'at least one each way in every genre with 5 or more materials', 'drama 25 / 0', 'drama 25 / 4; comedy 13 / 15; tragedy 4 / 16', 'Met', [f'{D}/st6.md', ST, 'tests/integration-stage.test.ts'], [cite(f'{D}/st6.md'), cite('tests/integration-stage.test.ts', 'the catalog’s drama has scenes where restraint suits better and scenes where size does')], changes='Four public-domain drama scenes of public or open conflict, read from their texts before measurement (`content/scenes-public.ts`)', implementation='content/scenes-public.ts, content/material.ts, content/coursework.ts')
row('ST5', 'Criteria: The Stage', 'Mastery: a mastered, prepared actor reaches 100 on every fitting combination', 'the same', 'every case', '2,277 of 2,277', '2,385 of 2,385', 'Met', [ST], [cite(ST)])
row('ST6', 'Criteria: The Stage', 'Strength carries the harder side: specialists ahead against the grain on at least 25%', 'the same, and probe/st6 (the cases in st6.md)', '25% for each specialist', 'expansive 21 of 49; restrained 7 of 34', 'expansive 21 of 49; restrained 8 of 38 (21.1%)', 'Not Met', [f'{D}/st6.md', ST, 'tests/integration-stage.test.ts'], [cite(f'{D}/st6.md'), cite('tests/integration-stage.test.ts', 'on a class scene, a restrained take rises with focus and with composure')], changes='Restraint draws composure and focus as well as emotional depth (sourced); it moved no case', failure='The grain against a scene built on size costs more than strength gives past a gap of about 0.5; the owner’s options in st6.md')
row('ST7', 'Criteria: The Stage', 'More than one good way: two or more interpretations within a point of the best', 'the same', '80% of materials', '84 of 86', '88 of 90', 'Met', [ST], [cite(ST)])
row('ST8', 'Criteria: The Stage', 'The even actor follows the scene where the sides are a band apart', 'the same', '75%', '72 of 72', '75 of 75', 'Met', [ST], [cite(ST)])
row('ST9', 'Criteria: The Stage', 'Nothing else lost: I1 to I5, the signature, the camera and microphone briefs, G2', 'the tools for each', 'as each says', 'held', 'see I1 to I5, S1 to S4 and G2', 'Met', [ST, f'{D}/closeout/signature.json'], [cite(ST)])
row('Stage F1', 'Criteria: The Stage', 'Fresh validation: the plays as a night (ST1, ST5, ST7, ST8)', 'the same', 'as each', 'all hold', 'all hold', 'Met', [ST], [cite(ST)])
row('Stage F2', 'Criteria: The Stage', 'Fresh validation: even actors at 40 and 75 (ST1, ST8)', 'the same', 'as each', 'all hold', 'all hold', 'Met', [ST], [cite(ST)])
# Interpretation
for i, (g, th, b, a) in enumerate([
    ('A mastered actor reaches 100 on every fitting combination of briefs and readings', 'every case', '8,010 and 9,117 at 100', '8,010, 9,117 and 2,385 at 100'),
    ('The better-suited side differs within a genre on each axis', '20% of genres', 'pace 24.2%, scale 20.8%, structure 32.9%', 'the same'),
    ('Suitability spreads results and neither scale side dominates', 'the account’s', 'spread 1.29 / 1.19; expansive ahead 27.0%', 'spread 1.28 / 1.19 / 3.43; expansive ahead 27.0% / 41.2% / 41.6%'),
    ('The even actor follows suitability where the sides are a band apart', '75%', '100%', '100% on every sample'),
    ('Two or more ways within a point of the best', '80%', '≥ 98.7%', '99.3%, 98.0%, 97.8%')], start=1):
    row(f'I{i}', 'Criteria: Interpretation', g, 'npx vite-node tools/interpretation.ts -- --fresh --stage', th, b, a, 'Met', [ST, 'docs/verification/interpretation-2026-10-16/criteria.md'], [cite(ST), cite('docs/verification/interpretation-2026-10-16/criteria.md')])
json.dump({'rows': rows}, open(sys.argv[1], 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
print(len(rows))
# ---- appended: the attributes, mastery through play, long-term, the genres, integration ----
rows_head = rows
AGF = f'{D}/closeout/ag-baseline.json'
AGB = f'{D}/baseline/ag-baseline.json'
crit = lambda *ids: f'{AG} ({", ".join(ids)})'
A = [
 ('A1', 'Every ability is causal somewhere', 'each of the 12 with a kind of work at a mean effect of 0.5 or more', 'met', 'met'),
 ('A2', 'No two abilities do the same job', 'no pair of effects correlated at 0.9 or more', 'highest 0.536', 'highest 0.527'),
 ('A3', 'No ability is a universal bonus', 'none moves 95% of pieces with a cv under 0.30', 'met', 'met'),
 ('T2', 'Training resists exploits (a): four hours of one exercise at most half four different ones', 'at most half', '1.875 of 4', '1.875 of 4'),
 ('T3', 'Caps don’t erase progression early (a): the gain an hour at 90 at least 25% of that at 30', '25%', '36%', '36%'),
 ('G3', 'Different genres reward different actors', 'no actor best on more than half the genres; 4 actors best on 10 or more', '53 of 149; 8 actors', '53 of 149; 8 actors'),
 ('G4', 'Every genre offers enough to play', '2 briefs and 4 readings a genre; 3 reader behaviours', 'met', 'met'),
 ('G5', 'Genre proficiency progresses across its range', 'a rise from 30 to 100 known changes the take', '51.23 → 53.86', '51.22 → 53.86'),
 ('M1', 'Maximum work quality under the qualifying conditions is 100 on every judged piece', 'every case 100, no drawn case off it', '4,495 briefs, 56 scenes, 30 nights, 30 casting, 13 coursework; 0 drawn off', '4,495 briefs, 60 scenes, 30 nights, 30 casting, 13 coursework; 0 drawn off'),
 ('M3', 'Nobody else can hold a mastered player’s own result under 100', '100, or a route the player controls', 'own 100 on 56 scenes, the partner never coming (the reader)', 'own 100 on 60 scenes'),
 ('O1', 'Your own result is invariant to the reader', 'sd 0', 'sd 0', 'sd 0'),
 ('O2', 'The take together moves with the reader', '5 points apart', '93.1, 86.1, 100', '93.1, 86.1, 100'),
 ('H2', 'No universally dominant allocation', 'no actor best on more than half the pieces of a kind with 30 or more', 'briefs 96 of 298; scenes 20 of 56', 'briefs 96 of 298; scenes 20 of 60'),
 ('H5', 'Generalists are useful', 'ahead of half the specialists on 50%; within a point of the best on 10%', '427 of 427; 26.5%', '431 of 431; 26.9%'),
 ('H7', 'Randomness doesn’t overwhelm skill, and still exists', 'better loses under 10%; a developing actor ranges a point', '0%; 2.61', '0%; 2.62'),
]
for id, goal, th, b, a in A:
    row(id, 'Criteria: The Attributes', goal, 'npx vite-node tools/ag-baseline.ts -- --out <file>; node tools/ag-criteria.mjs <file>', th, b, a, 'Met', [AGF, AGB, crit(id)], [cite(AGF), cite(AGB), cite(AG)])
row('H4', 'Criteria: The Attributes', 'Specialists are advantaged on suitable work', 'the same', 'ahead on 60% of the pieces where its ability reads most, for 10 of 12', '1 of 12', '2 of 12 (emotional depth 85.0%, listening 66.4%)', 'Not Met', [f'{D}/h4.md', AGF, f'{D}/h4/grid.txt'], [cite(f'{D}/h4.md'), cite(AGF), cite(f'{D}/h4/grid.txt')], failure='Every configuration measured that lifted H4 past 3 broke H2 on class scenes; presence, discipline and stamina reach 60% in none. The owner’s options and H4′ in h4.md')
row('F2', 'Criteria: The Attributes', 'Acting on the first-named weakness pays more than training at random (as written)', 'the same', 'named 2× the mean read; unread 0; the largest gain in 80%', '303 of 447 (67.8%)', '302 of 447 (67.6%)', 'Not Met', [AGF, 'docs/verification/advice-2026-10-16/criteria.md'], [cite(AGF), cite('docs/verification/advice-2026-10-16/criteria.md')], failure='As written it reads the take’s chief limit, not the advice, against a comparator that isn’t equal cost (advice-2026-10-16/criteria.md); superseded for advice by F2-A, and reported as measured, not counted met')
row('F2-A', 'Criteria: The Attributes', 'The advice’s first-named input is the largest realized gain, played', 'npx vite-node tools/advice.ts -- --from 0 --to 40 (docs/verification/advice-2026-10-16/README.md)', '80% held out and designed', '40 of 40; the exact best in 38', '40 of 40 (designed 10 of 10, held out 30 of 30); the exact best in 39; 529 candidates, forecast against realized 0.894', 'Met', [f'{D}/runs/advice-cases.json', f'{D}/runs/advice.txt', 'docs/verification/advice-2026-10-16/README.md'], [cite(f'{D}/runs/advice-cases.json'), cite('docs/verification/advice-2026-10-16/README.md')])
row('G1', 'Criteria: The Attributes', 'A genre’s label predicts what its work asks (as written)', 'tools/ag-baseline.ts §3', '1.5×; at most 15 with a nearer neighbor', 'fails', 'fails', 'Superseded', ['docs/verification/genres-2026-10-16/g1-replacement.md'], [cite('docs/verification/genres-2026-10-16/g1-replacement.md')], failure='Replaced by the genre signature S1 to S4 on 2026-10-16 (work plan section 5), defined before it ran')
for id, goal in [('A4', 'What the game says an ability does, it does'), ('A5', 'Every ability can be developed by an action the player chooses, and says what moved'), ('T1', 'Training says its value before and after'), ('O3', 'Grades and bands read the personal result; casting the expected; preparation and condition named as limits'), ('F1', 'Every note names what the evaluation found'), ('F3', 'Feedback says the condition and the preparation apart from ability')]:
    row(id, 'Criteria: The Attributes', goal, 'By reading the code (phase-2b.md §9)', 'as the criterion says', 'met by review', 'met by review; A4 brought to restraint’s new draw (composure, focus)' if id == 'A4' else 'met by review; unchanged code', 'Met', ['docs/verification/attributes-genres-2026-10-16/phase-2b.md', crit(id)], [cite('docs/verification/attributes-genres-2026-10-16/phase-2b.md')])
row('L1', 'Criteria: Long-Term Continuity', 'Repeated feedback changes or is acted on', 'npx vite-node tools/brief-journeys.ts -- --profile <p> --seed bj-0 --days 120', 'at most 4 weeks running', 'specialist 4, beginner 3', 'specialist 4, beginner 3', 'Met', [f'{D}/closeout/journey-specialist-bj-0.json', f'{D}/closeout/journey-beginner-bj-0.json'], [cite(f'{D}/closeout/journey-specialist-bj-0.json'), cite(f'{D}/closeout/journey-beginner-bj-0.json')])
row('L2', 'Criteria: Long-Term Continuity', 'No mindless repetition', 'the same', '0', '0', '0', 'Met', [f'{D}/closeout/journey-specialist-bj-0.json'], [cite(f'{D}/closeout/journey-specialist-bj-0.json')])
row('L3', 'Criteria: Long-Term Continuity', 'A learning student’s work improves over a term (as written: the last month’s mean at or over the first’s)', 'the same, with --trace', 'every non-mastered profile', 'specialist 65.5 → 64.0; beginner 54.0 → 56.9', 'specialist 65.5 → 64.1; beginner 54.0 → 56.6; L3′ (proposed) 17 of 17 and 19 of 19', 'Not Met', [f'{D}/l3.md', f'{D}/closeout/l3-trace-specialist-bj-0.json', f'{D}/closeout/l3-trace-beginner-bj-0.json'], [cite(f'{D}/l3.md'), cite(f'{D}/closeout/l3-trace-specialist-bj-0.json')], failure='Nothing deteriorated: every take rose 3.0 to 4.2 points at the end’s levels; the last month holds the callbacks earned, pitched harder. As written it fails a student who earns them; L3′ proposed in l3.md, not counted')
MA = [
 ('MA1', 'An ability a piece reads, raised by practice, raises the take', 'tests/integration-mastery.test.ts', 'PLAYER JOURNEY: a week of Circles Of Attention raises a comic brief’s forecast'),
 ('MA2', 'An ability it doesn’t read, raised by practice, moves it by nothing of that ability', 'tests/integration-mastery.test.ts', 'PLAYER JOURNEY: a week of Circles Of Attention raises a comic brief’s forecast'),
 ('MA3', 'No dimension, segment or whole leaves 0 to 100 on any judged piece', 'tests/integration-mastery.test.ts', 'every brief and reading, every class scene and every play as a night'),
 ('MA4', 'An ability read twice by one dimension is counted once, at its summed weight', 'tests/integration-mastery.test.ts', 'a grave scene’s believability reads emotional depth from the task and from the material'),
 ('MA6', 'At mastery no draw moves a result off 100', 'tests/engine-properties.test.ts', None),
 ('MA7', 'Each shortfall a take has is named in words', 'tests/integration-mastery.test.ts', 'PLAYER JOURNEY: a brief taped with its lines barely begun names the lines'),
]
for id, goal, f, t in MA:
    row(id, 'Criteria: Mastery Through Play', goal, 'Played through the commands (practice.exercise, brief.choose, brief.prepare, practice.self_tape)', 'as README.md writes it', 'not measured before', 'holds', 'Met', [f], [cite(f, t)] if t else [cite(f)], implementation='systems/evaluation.ts (specWith, dimensionQuality), systems/practice.ts, systems/briefs.ts', sees='The brief’s forecast and How You’ll Play It; the take’s note')
row('MA5', 'Criteria: Mastery Through Play', 'A played mastery plan reaches 100 on every payoff tape', 'npx vite-node tools/mastery.ts -- --mode plan --genre <id> --seed <s> --years 8', 'every payoff tape 100', 'all six plans (journeys-2026-10-16)', 'all six plans 100, 100, 100; mastered 2 to 3 weeks sooner; breaches 0', 'Met', [f'{D}/runs/plan-nordic_noir-m-0.json', f'{D}/runs/plan-musical-m-0.json', f'{D}/runs/plan-slapstick-m-0.json'], [cite(f'{D}/runs/plan-nordic_noir-m-0.json'), cite(f'{D}/runs/plan-nordic_noir-m-1.json'), cite(f'{D}/runs/plan-social_realism-m-0.json'), cite(f'{D}/runs/plan-social_realism-m-1.json'), cite(f'{D}/runs/plan-musical-m-0.json'), cite(f'{D}/runs/plan-slapstick-m-0.json')])
row('MA8', 'Criteria: Mastery Through Play', 'Mastery in the work doesn’t stand in for the work the school asks: a mastered student who misses pieces is Unready on them and the review counts them', 'tests/integration-mastery.test.ts', 'as README.md writes it', 'not measured before', 'two pieces slept through, both Unready, the review counting exactly two; the twin missing nothing, none', 'Met', ['tests/integration-mastery.test.ts'], [cite('tests/integration-mastery.test.ts', 'PLAYER JOURNEY: a mastered student asleep through two pieces is Unready on both and the review counts exactly those two; the same student missing nothing is counted Unready on none')], changes='None to the engine: a played test, killed by the tally leaving pieces not shown out of its Unready')
json.dump({'rows': rows}, open(sys.argv[1], 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
print(len(rows))
# ---- appended: the genres ----
SIG = f'{D}/closeout/signature.json'; SIGF = f'{D}/closeout/signature-fresh.json'; G1R = 'docs/verification/genres-2026-10-16/g1-replacement.md'
for id, goal, th, b, a in [
  ('S1', 'A genre’s conventions are recognizable across very different scenes', 'mean cosine 0.7 or more, every genre', '0.90, 0.88, 0.90, 0.87', '0.901, 0.883, 0.904, 0.880'),
  ('S2', 'Contrasting genres differ and related ones overlap (revised)', 'contrasting over one 1.5×; nearest shares a concern 90%', '1.60, 1.61, 1.60, 1.61; 98.7%', '1.599, 1.612, 1.598, 1.613; 98.7%'),
  ('S3', 'Contrasting genres change outcomes on the same scene (revised), on all four samples', '80% on each', '12,757, 11,887, 24,832, 23,300 of 14,350, 14,350, 28,413, 28,413', '12,744, 11,890, 24,838, 23,304 (82.0% the lowest)'),
  ('S4', 'No two briefs of different genres identical in every number a take reads (G2)', '0 pairs', '0', '0')]:
    row(id, 'Criteria: The Genres', goal, 'npx vite-node tools/genre-signature.ts -- [--fresh] --out <file>; tools/genre-identity.ts', th, b, a, 'Met', [SIG, SIGF, f'{D}/closeout/genre-identity.json', G1R], [cite(SIG), cite(SIGF), cite(G1R)], systems='Every take of a brief, a class scene and a play, read in its genre’s register', sees='The Genre Asks on a brief; the take’s note; the genre’s look')
row('Genre Audit', 'Criteria: The Genres', 'Every genre in the code (149): knowing it helps its own work and transfers to no other; what each reads and suits', 'npx vite-node tools/genre-audit.ts -- --out <file>', 'helps its own in every genre; leaks into none', '149 of 149; 0; 56 to weigh', '149 of 149; 0; 55 to weigh (drama’s restraint-only stage settled by ST4)', 'Met', [f'{D}/closeout/genre-audit.md', 'tests/genre-identity.test.ts'], [cite(f'{D}/closeout/genre-audit.md'), cite('tests/genre-identity.test.ts')], failure='The 54 genres whose two briefs suit the same sides on every axis are weighed, not faults (their registers agree; I2 holds across the catalog)')
json.dump({'rows': rows}, open(sys.argv[1], 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
print(len(rows))
# ---- appended: integration rows (the brief's sections 6, 9 to 13) ----
def integ(id, goal, entry, threshold, status, evidence, citations, failure='', changes='Nothing in this pass', sees='', systems='', implementation=''):
    rows.append({'id': id, 'group': 'Integration', 'kind': 'integration', 'goal': goal, 'entry': entry,
      'preconditions': 'As each test or run sets it up, said in its header', 'reads': 'The save as play leaves it', 'decisions': 'The player’s, as each journey plays them',
      'validation': f'Holds when: {threshold}', 'changes': changes, 'later': 'As each journey runs on', 'systems': systems or 'Every retained system the journey passes through',
      'sees': sees or 'The screens the journey plays', 'saveLoad': 'Saved and opened again where the evidence says', 'failure': failure or 'Each refusal says why, and what comes next',
      'implementation': implementation or 'src/engine, src/ui', 'evidence': '; '.join(evidence), 'status': status, 'citations': citations})
integ('INT-determinism', 'A played life is the same to the byte straight through and reloaded halfway', 'tests/determinism-played.test.ts', 'byte-identical', 'Met', ['tests/determinism-played.test.ts'], [cite('tests/determinism-played.test.ts', 'is the same to the byte, straight through and reloaded halfway')])
integ('INT-time', 'A large time advance and the same span in small steps come to the same', 'tests/simulation.test.ts, and each area’s twins', 'the same state', 'Met', ['tests/simulation.test.ts'], [cite('tests/simulation.test.ts', 'keeps the debt a short night left over sixty, and drains it the same by the minute as in one jump')])
integ('INT-duplicates', 'A command sent twice (a repeat click, a duplicate submission) is lived once, across a reload', 'tests/briefs.test.ts, tests/engagement.test.ts, tests/evidence-g06-life.test.ts, tests/base44-contract.test.ts', 'once', 'Met', ['tests/briefs.test.ts', 'tests/engagement.test.ts', 'tests/base44-contract.test.ts'], [cite('tests/briefs.test.ts', 'lives an action sent twice once'), cite('tests/engagement.test.ts', 'lives an action sent twice once'), cite('tests/base44-contract.test.ts', 'writes once for a repeated idempotency key')])
integ('INT-migration', 'An older save opens, migrates and plays on', 'tests/save-migration.test.ts, tests/migration-94.test.ts', 'opens, nothing charged or filed after the fact', 'Met', ['tests/save-migration.test.ts', 'tests/migration-94.test.ts'], [cite('tests/save-migration.test.ts', 'opens with nothing charged or filed after the fact'), cite('tests/migration-94.test.ts')])
integ('INT-missed-term', 'A term played with missed pieces and a missed revision: warning, forecast, notices and review count alike, once, through reloads', 'tests/remaining-school-term.test.ts (the school area)', 'as README.md writes it', 'Met', ['tests/remaining-school-term.test.ts'], [cite('tests/remaining-school-term.test.ts', 'the missed-work term, played > PLAYER JOURNEY: two pieces missed unexcused, a revision missed and the pieces after shown'), cite('tests/remaining-school-term.test.ts', 'the missed-work term, reloaded > PLAYER JOURNEY: reloaded at the first miss, at the warning and at the review')])
integ('INT-skipped', 'Every skipped check accounted for: the suite skips none; the built app’s two steps played', 'tools/acceptance-ui.mjs at 1440 and 390', 'no step skipped, or its reason said', 'Met', ['tools/acceptance-ui.mjs', f'{D}/runs/acceptance/1440.log', f'{D}/runs/acceptance/390.log'], [cite('tools/acceptance-ui.mjs'), cite(f'{D}/runs/acceptance/1440.log'), cite(f'{D}/runs/acceptance/390.log')], changes='The workbook step learns the lines its ways wait on and reads a locked way’s chapter, as a player does; the casting step on a new life checks the screen says when casting comes. The suite skips none, at the baseline and at the end')
integ('INT-navigation', 'Home readable; Money, School and Papers usable and aligned at 1440 and 390', 'node tools/acceptance-ui.mjs <out> 1440|390 <saves>', '0 failed, 0 overflows', 'Met', ['tools/acceptance-ui.mjs', f'{D}/runs/acceptance/1440.log', f'{D}/runs/acceptance/390.log'], [cite(f'{D}/runs/acceptance/1440.log'), cite(f'{D}/runs/acceptance/390.log')])
integ('INT-long-runs', 'Played lives through graduation, the workload runs, the mastery plans, the advice cases and three years of variety on the final code', 'tools/lives.ts, tools/workload.ts, tools/mastery.ts, tools/advice.ts, tools/variety.ts, tools/freshness.ts', 'breaches 0, unbalanced 0, no errors; the figures each account set', 'Met', [f'{D}/runs/README.md', f'{D}/runs/lives.jsonl', f'{D}/runs/variety-v-0.json', f'{D}/runs/freshness.json'], [cite(f'{D}/runs/README.md'), cite(f'{D}/runs/lives.jsonl'), cite(f'{D}/runs/variety-v-0.json'), cite(f'{D}/runs/freshness.json')])
integ('INT-gate', 'The gate and the build on the final revision', 'npm run gate (exit from a file); npm run build', 'exit 0', 'Open', ['package.json'], [cite('package.json')])
json.dump({'rows': rows}, open(sys.argv[1], 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
print(len(rows))
