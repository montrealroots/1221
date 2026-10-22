"""
The completion matrix's criterion and integration rows (the integration pass of 2026-10-16), written to criteria.json,
which tools/completion-matrix.mjs joins with what the gate already holds. Until later on 2026-10-16 this lived only in the
scratchpad of the session that wrote it, and criteria.json could not be made again from the repository.

    python3 docs/verification/integration-2026-10-16/criteria.py docs/verification/integration-2026-10-16/criteria.json

Run from the repository's root; then node tools/completion-matrix.mjs and --check.
"""
import json, os, re, sys
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
 ('MA6', 'At mastery no draw moves a result off 100', 'tests/engine-properties.test.ts', 'keeps the mastery contract: every input full, preparation complete, a sufficient day and a fitting choice is 100, every time'),
 ('MA7', 'Each shortfall a take has is named in words', 'tests/integration-mastery.test.ts', 'PLAYER JOURNEY: a brief taped with its lines barely begun names the lines'),
]
for id, goal, f, t in MA:
    row(id, 'Criteria: Mastery Through Play', goal, 'Played through the commands (practice.exercise, brief.choose, brief.prepare, practice.self_tape)', 'as README.md writes it', 'not measured before', 'holds', 'Met', [f], [cite(f, t)] if t else [cite(f)], implementation='systems/evaluation.ts (specWith, dimensionQuality), systems/practice.ts, systems/briefs.ts', sees='The brief’s forecast and How You’ll Play It; the take’s note')
row('MA5', 'Criteria: Mastery Through Play', 'A played mastery plan reaches 100 on every payoff tape', 'npx vite-node tools/mastery.ts -- --mode plan --genre <id> --seed <s> --years 8', 'every payoff tape 100', 'all six plans (journeys-2026-10-16)', 'all six plans 100, 100, 100; mastered 2 to 3 weeks sooner; breaches 0', 'Met', [f'{D}/runs/plan-nordic_noir-m-0.json', f'{D}/runs/plan-musical-m-0.json', f'{D}/runs/plan-slapstick-m-0.json'], [cite(f'{D}/runs/plan-nordic_noir-m-0.json'), cite(f'{D}/runs/plan-nordic_noir-m-1.json'), cite(f'{D}/runs/plan-social_realism-m-0.json'), cite(f'{D}/runs/plan-social_realism-m-1.json'), cite(f'{D}/runs/plan-musical-m-0.json'), cite(f'{D}/runs/plan-slapstick-m-0.json')])
row('MA8', 'Criteria: Mastery Through Play', 'Mastery in the work doesn’t stand in for the work the school asks: a mastered student who misses pieces is Unready on them and the review counts them', 'tests/integration-mastery.test.ts', 'as README.md writes it', 'not measured before', 'two pieces slept through, both Unready, the review counting exactly two; the twin missing nothing, none', 'Met', ['tests/integration-mastery.test.ts'], [cite('tests/integration-mastery.test.ts', 'PLAYER JOURNEY: a mastered student asleep through two pieces is Unready on both and the review counts exactly those two; the same student missing nothing is counted Unready on none')], changes='None to the engine: a played test, killed by the tally leaving pieces not shown out of its Unready')
print(len(rows))
# ---- appended: the genres ----
SIG = f'{D}/closeout/signature.json'; SIGF = f'{D}/closeout/signature-fresh.json'; G1R = 'docs/verification/genres-2026-10-16/g1-replacement.md'
for id, goal, th, b, a in [
  ('S1', 'A genre’s conventions are recognizable across very different scenes', 'mean cosine 0.7 or more, every genre', '0.90, 0.88, 0.90, 0.87', '0.901, 0.883, 0.904, 0.880'),
  ('S2', 'Contrasting genres differ and related ones overlap (revised)', 'contrasting over one 1.5×; nearest shares a concern 90%', '1.60, 1.61, 1.60, 1.61; 98.7%', '1.599, 1.612, 1.598, 1.613; 98.7%'),
  ('S3', 'Contrasting genres change outcomes on the same scene (revised), on all four samples', '80% on each', '12,757, 11,887, 24,832, 23,300 of 14,350, 14,350, 28,413, 28,413', '12,744, 11,890, 24,838, 23,304 (82.0% the lowest)'),
  ('S4', 'No two briefs of different genres identical in every number a take reads (G2)', '0 pairs', '0', '0')]:
    row(id, 'Criteria: The Genres', goal, 'npx vite-node tools/genre-signature.ts -- [--fresh] --out <file>; tools/genre-identity.ts', th, b, a, 'Met', [SIG, SIGF, f'{D}/closeout/genre-identity.json', G1R], [cite(SIG), cite(SIGF), cite(G1R)], systems='Every take of a brief, a class scene and a play, read in its genre’s register', sees='The Genre Asks on a brief; the take’s note; the genre’s look')
row('Genre Audit', 'Criteria: The Genres', 'Every genre in the code (149): knowing it helps its own work and transfers to no other; what each reads and suits', 'npx vite-node tools/genre-audit.ts -- --out <file>', 'helps its own in every genre; leaks into none', '149 of 149; 0; 56 to weigh', '149 of 149; 0; 55 to weigh (drama’s restraint-only stage settled by ST4)', 'Met', [f'{D}/closeout/genre-audit.md', 'tests/genre-identity.test.ts'], [cite(f'{D}/closeout/genre-audit.md'), cite('tests/genre-identity.test.ts')], failure='The 55 genres whose two briefs suited the same sides on every axis were weighed, not faults (their registers agree; I2 holds across the catalog); 54 until brief 09 counted them again, 46 after it replaced fourteen genres’ second briefs (genres-09.md)')
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
integ('INT-gate', 'The gate and the build on the final revision', 'npm run gate (exit from a file); npm run build', 'exit 0', 'Met', [f'{D}/runs/gate.txt', f'{D}/runs/README.md'], [cite(f'{D}/runs/gate.txt')], failure='Exit 0 on f68516b0: 361 files, 4,316 tests, none skipped, and all seventeen checks; the build exit 0 on the same commit. What came after it is the account and the handoff, documents the gate’s text checks were run on again')
print(len(rows))
# ---- appended: the seven statuses (brief 09, section 1) ----
# Until brief 09 each row carried the word its source gave it (Met, Not Met, Superseded), and the matrix read "none
# open" while the handoff listed unfinished work. Each row now carries one of the seven statuses the owner named, and
# what that status asks of it: the commit a measurement was made on and what it reads (a criterion measured before the
# code it reads changed isn't current), what's missing, the gap, the decision with its evidence and recommendation, or
# who deferred it. The source's own word stays beside it as `sourceStatus`.
IAV, IVI, PI, NI, BE, DR, ED = ('Implemented And Verified', 'Implemented, Verification Incomplete', 'Partially Implemented',
  'Not Implemented', 'Blocked Externally', 'Decision Required', 'Explicitly Deferred')
# Where a measurement was made, and what it reads. The judge's criteria were measured again on 4a1b339f (the close-out),
# and no file the judge reads has changed since (checked on 2026-10-16 with git log 4a1b339f..HEAD over those paths).
CLOSEOUT = {'commit': '4a1b339f', 'watch': 'judge'}
RUNS = {'commit': 'd1452195', 'watch': 'engine'}
BUILT = {'commit': 'f68516b0', 'watch': 'app'}
READ_ONLY = ['A4', 'A5', 'T1', 'O3', 'F1', 'F3']
for r in rows:
    r['sourceStatus'] = r['status']
    g, i = r['group'], r['id']
    if i in ('MA5', 'F2-A', 'INT-long-runs'):
        r['status'], r['measured'] = IAV, RUNS
    elif i in READ_ONLY:
        r['status'], r['missing'] = IVI, 'Judged by reading the code (phase-2b.md §9), not by a test the gate runs: no assertion would fail if it stopped holding'
    elif r['status'] == 'Met' and g in ('Criteria: The Stage', 'Criteria: Interpretation', 'Criteria: The Attributes', 'Criteria: The Genres', 'Criteria: Long-Term Continuity'):
        r['status'], r['measured'] = IAV, CLOSEOUT
    elif i in ('INT-navigation', 'INT-skipped', 'INT-gate'):
        r['status'], r['measured'] = IAV, BUILT
    elif r['status'] == 'Met':
        r['status'] = IAV
# Measured again on the integrated tree (brief 09, section 7): the judge's and the genre area's changes together, on
# c9cba9c8, each figure read from the tools' outputs into integrated-09/figures.json, none typed. Until then these rows
# were the close-out's of 4a1b339f, which the judge's evaluation-10 left behind, and the matrix called them unverified.
INTEGRATED = {'commit': 'c9cba9c8', 'watch': 'judge'}
FIG = json.load(open(f'{D}/integrated-09/figures.json', encoding='utf-8'))
for r in rows:
    if r.get('measured') == CLOSEOUT:
        assert r['id'] in FIG, r['id']
        r['measured'] = INTEGRATED
        r['failure'] = f"{r['failure']}; on the integrated tree, brief 09 (c9cba9c8): {FIG[r['id']]}"
        r['evidence'] = f"{r['evidence']}; {D}/integrated-09/README.md"
        r['citations'] = r['citations'] + [{'file': f'{D}/integrated-09/figures.json'}]
# Brief 09's final runs (runs-09/, figures.json read from their outputs, none typed): the long runs and the built app on
# bcd75970's code (7c1198a2 differs from it in no file they read), the gate on 7c1198a2. Until then these rows were the
# last pass's, on d1452195 and f68516b0, which brief 09's code left behind.
RUNS09, BUILT09, GATE09 = {'commit': 'bcd75970', 'watch': 'engine'}, {'commit': 'bcd75970', 'watch': 'app'}, {'commit': '7c1198a2', 'watch': 'app'}
FIG09 = json.load(open(f'{D}/runs-09/figures.json', encoding='utf-8'))
for r in rows:
    m = r.get('measured')
    if m in (RUNS, BUILT):
        assert r['id'] in FIG09, r['id']
        r['measured'] = GATE09 if r['id'] == 'INT-gate' else (RUNS09 if m == RUNS else BUILT09)
        r['failure'] = f"{r['failure']}; brief 09 ({r['measured']['commit']}): {FIG09[r['id']]}"
        r['evidence'] = f"{r['evidence']}; {D}/runs-09/README.md"
        r['citations'] = r['citations'] + [{'file': f'{D}/runs-09/figures.json'}] + ([{'file': f'{D}/runs-09/gate.txt'}] if r['id'] == 'INT-gate' else [])
# Measured again on brief 10's tested commit (its criteria, section 5): the four areas and the genre row's Mastered on
# 567d27dd (decisions-2026-10-16/final/, every exit 0), every output byte for byte the judge area's on 167f996b
# (integrated/after/), each figure read by integrated-09/figures.py from those outputs into final/figures.json, none
# typed. Until then these rows were brief 09's of c9cba9c8, which brief 10's rules left behind; for a while that day,
# 167f996b's, which the Mastered's two engine files left behind.
INTEGRATED10 = {'commit': '567d27dd', 'watch': 'judge'}
A10 = 'docs/verification/decisions-2026-10-16/final'
FIG10 = json.load(open(f'{A10}/figures.json', encoding='utf-8'))
for r in rows:
    if r.get('measured') == INTEGRATED:
        assert r['id'] in FIG10, r['id']
        r['measured'] = INTEGRATED10
        r['failure'] = f"{r['failure']}; on brief 10's tested commit (567d27dd): {FIG10[r['id']]}"
        r['evidence'] = f"{r['evidence']}; {A10}/README.md"
        r['citations'] = r['citations'] + [{'file': f'{A10}/figures.json'}]
# Brief 10's final runs (runs-10/, figures.json read from their outputs, none typed): the long runs, the built app and the
# advice on 57b64401's code, the gate on the commit gate.txt names. They ran first on 2634283b and then on 567d27dd, which
# the Mastered and Table Work's fix each left behind; the outputs those runs share with 57b64401's are the same. Until then these rows were brief 09's, on bcd75970
# and 7c1198a2, which brief 10's code left behind.
# Until the runs' figures are there, these rows stay brief 09's, and the matrix calls them unverified.
FIG10R = json.load(open(f'{D}/runs-10/figures.json', encoding='utf-8')) if os.path.exists(f'{D}/runs-10/figures.json') else {}
GATE10 = re.search(r'^at (\w+)', open(f'{D}/runs-10/gate.txt', encoding='utf-8').read(), re.M).group(1) if 'INT-gate' in FIG10R else None
# The built app and the saves it opens ran again on 9c40be73, whose ability's Mastered changed a screen and no engine file.
RUNS10, BUILT10 = {'commit': '57b64401', 'watch': 'engine'}, {'commit': '9c40be73', 'watch': 'app'}
for r in rows:
    m = r.get('measured')
    if m in (RUNS09, BUILT09, GATE09):
        if r['id'] == 'INT-gate' and not GATE10: continue  # the gate's figure, folded in once it has run
        if not FIG10R: continue
        assert r['id'] in FIG10R, r['id']
        r['measured'] = {'commit': GATE10, 'watch': 'app'} if r['id'] == 'INT-gate' else (RUNS10 if m == RUNS09 else BUILT10)
        r['failure'] = f"{r['failure']}; brief 10 ({r['measured']['commit']}): {FIG10R[r['id']]}"
        r['evidence'] = f"{r['evidence']}; {D}/runs-10/README.md"
        r['citations'] = r['citations'] + [{'file': f'{D}/runs-10/figures.json'}] + ([{'file': f'{D}/runs-10/gate.txt'}] if r['id'] == 'INT-gate' else [])
# L1 held before brief 10 and fails after it: a regression, traced to the advice area's change (decisions-2026-10-16/l1/).
# Section 5 of brief 10's criteria asks it fixed or reported with its cause; no fix moves it back without moving the advice
# off the input whose training brings most, which F2-A10 (b) fails, so it's put to the owner. Until 2026-10-16 it was
# Implemented And Verified on brief 09's measurement (the specialist 4 weeks, the beginner 3).
for r in rows:
    if r['id'] == 'L1':
        r['status'] = DR
        r['decision'] = {
            'question': 'L1 held before brief 10 and fails after it. On the final code the week’s top recommendation in the 120-day journeys is focus 8 weeks running for the specialist (51 to 55) and 6 for the beginner (55 to 56), where L1 allows 4 without the input rising 5 points; brief 09 read 4 and 3. The advice area’s change moved it on its own (84db36b7 reads 8 and 6; the judge’s first phase alone read 4 and 3). The journeys’ student never trains the named input, and F2-A10 holds the advice to naming the input whose training brings most. Should the advice change its first-named input after 4 weeks a player hasn’t acted on it, against F2-A10 (b); should L1 be read on a journey whose student acts on the advice, as F2-A10 (h) is; or does L1 stay as written and not met?',
            'evidence': 'docs/verification/decisions-2026-10-16/l1/README.md (each measurement point’s sequence, the 84db36b7 journeys); decisions-2026-10-16/integrated/after/journey-specialist-bj-0.json and journey-beginner-bj-0.json; integrated-09’s for brief 09',
            'recommendation': 'Keep the advice naming the best input, and read L1 on a journey that follows the advice: F2-A10 (h) shows the first-named moves on once it’s followed, which is what “changes or is acted on” asks. Until decided, L1 is counted not met.'}
# The four shortfalls of the stage and the attributes, as measured, and what each awaits.
for r in rows:
    # ST3, ST6, H4 and L3 after brief 09, section 2 (remaining-09/judge-result.json, followup-09/README.md): each reproduced,
    # traced case by case, and not met as written; each a decision with its proposal, none counted met. Until later on
    # 2026-10-16 ST6, H4 and L3 were Partially Implemented, being worked.
    # The owner's brief 10 (decision 1) approved replacing ST3, ST6, H4 and L3 with criteria that measure what was intended,
    # and ST3-R, ST6-R, H4-R and L3-R were written before any change (decisions-2026-10-16/criteria.md). Each original stays
    # in the record as measured, not met, and is superseded; its replacement is the judge area's rows of brief 10
    # (remaining-10/judge-result.json), counted in its place. Until then each was Decision Required with its proposal.
    SUPERSEDED = {
        'ST3': 'ST3 as written: the even actor the same as shown on 178 of 189 (integrated-09), not met; 185 of 193 on brief 10’s final code (decisions-2026-10-16/integrated/after/st3.json), not met; superseded by ST3-R',
        'ST6': 'ST6 as written: the restrained half 9 of 42 (integrated-09; 10 of 42 once the specialists’ budgets were made equal in brief 10), not met; 11 of 44 on brief 10’s final code, the 25% floor to the case (integrated/after/stage.json); superseded by ST6-R',
        'H4': 'H4 as written: 1 of 12 (integrated-09), not met; 1 of 12 on brief 10’s final code (integrated/after/criteria.txt); superseded by H4-R',
        'L3': 'L3 as written: the specialist 65.5 to 64.3, the beginner 54.0 to 56.8 (integrated-09), not met for the specialist; failing on 2 of brief 10’s 8 journeys on its final code (integrated/after/l3r.json); superseded by L3-R',
    }
    if r['id'] in SUPERSEDED:
        r['status'], r['deferredBy'] = ED, f"{SUPERSEDED[r['id']]}, approved by the owner in brief 10 (decision 1) and measured as the judge area's rows of brief 10 (remaining-10/judge-result.json); the original's result stays in the record"
    elif r['id'] == 'F2':
        # The owner's brief 10 approved F2-A as the advice's measure (decision 2). F2 as written stays in the record as
        # measured, not met; until then this row was Decision Required.
        r['status'], r['deferredBy'] = ED, 'Superseded by F2-A, approved by the owner in brief 10 (decision 2), and F2-A10 its broadened proof (remaining-10/advice-result.json); F2 as written stays in the record, not met (67.6%, 302 of 447 on brief 09’s integrated tree; 68.9%, 308 of 447 on brief 10’s final code, decisions-2026-10-16/integrated/after/criteria.txt), and is still run and reported'
    elif r['id'] == 'G1':
        r['status'], r['deferredBy'] = ED, 'Replaced under the owner’s authorization in brief 02, section 3 ("I authorize replacing a demonstrably invalid metric…"), on the conditions it set (docs/verification/genres-2026-10-16/g1-replacement.md); S1 to S4 are counted in its place, and its result is kept as measured'
# Every known shortfall and missing test not already a row of its own: the handoff's open work, the areas' reports.
def known(id, goal, status, field, text, evidence=None, citations=None):
    r = {'id': id, 'group': 'Known Shortfalls And Missing Tests', 'kind': 'shortfall', 'goal': goal, 'entry': 'Not recorded',
      'preconditions': 'Not recorded', 'reads': 'Not recorded', 'decisions': 'Not recorded', 'validation': 'Not recorded',
      'changes': 'Not recorded', 'later': 'Not recorded', 'systems': 'Not recorded', 'sees': 'Not recorded', 'saveLoad': 'Not recorded',
      'failure': text if isinstance(text, str) else text.get('question', ''), 'implementation': 'Not recorded',
      'evidence': '; '.join(evidence or []) or 'Not recorded', 'status': status, 'sourceStatus': 'listed by the handoff or an area', 'citations': citations or []}
    r[field] = text
    rows.append(r)
known('KS-matrix-gate', 'tools/completion-matrix.mjs --check runs in the required gate', IAV, 'note', 'In `npm run gate` from 2026-10-16 at the owner’s brief 09, section 5, and CLAUDE.md counts eighteen checks; until then it ran by hand. Its checks were each broken in a copy and caught (a status outside the seven, a decision without its question, a verified row with no titled test, a cited title not there, the handoff’s line altered, a measurement made before the engine changed)', ['package.json', 'CLAUDE.md'], [cite('tools/completion-matrix.mjs')])
known('KS-degree-text', 'A graduated student’s School page says the degree is done', IAV, 'note', 'Fixed under brief 09, section 6 (journeys-result.json, journeys.known-graduated-school-page): once the School has ended the page says how, the degree conferred and its day, with the last term’s figures and their floors in the past and no casting ahead; a withdrawal and a dismissal say theirs. Until 2026-10-16 this row was Not Implemented: the page said “Only the terms to come stand between you and the degree” (found in the built app that day)', ['docs/verification/remaining-09/journeys-result.json'], [cite('tests/remaining-09-journeys.test.ts', 'journeys.known-graduated-school-page: the School page once the School has ended > DEFECT: a life played to the degree reads it on its Standing, Casting and Coursework tabs…')])
known('KS-genres-54', 'Each genre’s two briefs ask different things of the actor where its conventions allow', IAV, 'note', 'Settled under brief 09, section 3 (genres-09.md): the genres were 55, not the 54 the close-out counted, drama’s stage scenes taken off twice. Read in six parts as the engine reads them (tools/genre-pairs.ts), 14 were the same in three or more; each had its second situation replaced by a new scene under a new id, and none of the 55 is the same in three or more now. Until 2026-10-16 this row was Partially Implemented: whether the 54 were the same work wasn’t read', ['docs/verification/integration-2026-10-16/genres-09.md', 'docs/verification/remaining-09/genres-result.json'], [cite('tests/remaining-genres.test.ts', 'a genre’s two briefs, read as the engine reads them > none of the 55 genres whose briefs suited the same sides on 2026-10-16 is the same in three of the six parts or more'), cite('tests/remaining-genres.test.ts', 'a genre’s two briefs, read as the engine reads them > a brief against itself renamed is the same in all six parts: a renamed description is caught, never passed')])
known('KS-bank-rows-scope', 'The nine bank rows no Yale player reaches: kept as unresolved or moved to deferred', DR, 'decision', {'question': 'Nine bank commands (an arranged overdraft, a switch and its steps, a money transfer, a canceled new account, an overrun loan) are reached only on fixtures, since no New Haven bank offers them and lives abroad went in the scope reset. Do they stay counted against completion, or move to Explicitly Deferred?', 'evidence': 'docs/verification/CURRENT-SCOPE-2026-10-15.md, The Owner’s Decisions, 2; each row’s four-part acceptance on docs/GAMEPLAY-COVERAGE.md', 'recommendation': 'Defer them with the scope reset’s lives abroad, keeping their fixture tests, unless a home-country account now reaches one (being read under brief 09, section 5)'})
known('KS-homecloses', 'A home bank’s own close settles its fees once', IAV, 'note', 'Fixed under brief 09, section 4 (banking-result.json, banking.3): the settling is stamped (`feesEndedAt`), so the daily tries after a close finding the account overdrawn charge no more fees. No New Haven life reaches it, since no German bank closes a home account, so a GUARD holds it. Until 2026-10-16 this row was Not Implemented', ['docs/verification/remaining-09/banking-result.json'], [cite('tests/remaining-09-banking.test.ts', 'banking.3: a home bank’s own close settles the fees once > GUARD: Deutsche Bank given Barclays’ kind of rule…')])
known('KS-ct-idcard', 'A Connecticut ID card’s term and its mailing are the DMV’s', IVI, 'missing', 'The tax area’s sources weren’t conclusive on the term and the mailing for a non-citizen; unchanged, and no authoritative source verifies them (tax-result.json)')
known('KS-passport-fees', 'A passport renewed abroad costs its issuer’s published fee', IVI, 'missing', 'Some fees in content/passportsabroad.ts are estimates, marked as assumptions, not verified figures (tax-result.json)')
# An area's item whose status its result doesn't give rightly, said here with why: only an item the area left reported or
# open that was settled after, with the test that settles it.
OVERRIDES = [
  {'id': 'judge.ST3', 'status': ED, 'deferredBy': 'The owner’s brief 10 (decision 1) decided it: ST3 as written stays in the record, not met, superseded by ST3-R, measured as the judge area’s rows of brief 10 (remaining-10/judge-result.json)', 'why': 'Decided by the owner in brief 10', 'citations': []},
  {'id': 'judge.ST6', 'status': ED, 'deferredBy': 'The owner’s brief 10 (decision 1) decided it: ST6 as written stays in the record, not met, superseded by ST6-R, measured as the judge area’s rows of brief 10 (remaining-10/judge-result.json)', 'why': 'Decided by the owner in brief 10', 'citations': []},
  {'id': 'judge.H4', 'status': ED, 'deferredBy': 'The owner’s brief 10 (decision 1) decided it: H4 as written stays in the record, not met, superseded by H4-R, measured as the judge area’s rows of brief 10 (remaining-10/judge-result.json)', 'why': 'Decided by the owner in brief 10', 'citations': []},
  {'id': 'judge.L3', 'status': ED, 'deferredBy': 'The owner’s brief 10 (decision 1) decided it: L3 as written stays in the record, not met, superseded by L3-R, measured as the judge area’s rows of brief 10 (remaining-10/judge-result.json)', 'why': 'Decided by the owner in brief 10', 'citations': []},
  # Brief 09 left Arion's card year to the owner; brief 10 approved a labelled simulation where no source settles the
  # timing, and Iceland's Act 114/2021 art. 57(4) settles what a close owes (remaining-10/arion-result.json).
  {'id': 'banking.5.arion-card', 'status': IAV, 'why': 'Settled under brief 10, section 3: the amount and age from Arion’s price list, a close’s refund in proportion from Act 114/2021 art. 57(4), the year paid ahead as SLATE’s labelled, configurable simulation (`ARION_CARD_YEAR`), verified as specified; Arion’s real timing stays unverified',
   'citations': [cite('tests/decisions-arion.test.ts', 'arion.AR3: a close gives back the card year’s days left > PLAYER JOURNEY: on Wednesday 14 October 2026 Your Banks says closing the Veltureikningur refunds 817 kr…')]},
  # The judge area kept ST6 as written as Not Implemented, but its second phase measured it holding on the final code: the
  # restrained specialist 11 of 44 against the grain, the floor of 25% to the case (integrated/after/stage.json, holds:
  # true). It's superseded all the same (brief 10, decision 1), so it's kept as the record, as the ST6 criterion row is.
  # ST3, H4 and L3 as written stay as the area put them, not met.
  {'id': 'ST6.asWritten', 'status': ED, 'deferredBy': 'Superseded by ST6-R, approved by the owner in brief 10 (decision 1); as written it holds on brief 10’s final code at its floor to the case (restrained 11 of 44, expansive 24 of 50, decisions-2026-10-16/integrated/after/stage.json), kept as the record, not counted', 'why': 'Measured holding on the final code, where the area’s status said not met', 'citations': []},
  # The stamina area put A1's night to the owner (a supporting part's 0.32 or a lead's 0.50). The judge area's second
  # phase met A1 on the integrated code without that choice: the drain went to 0.4, SLATE's choice set by testing on
  # H4-R's 797 pieces to give stamina's specialist work of its own (content/piece.ts says what each value gave), and
  # stamina's briefs and scenes passed 0.5 with it. Nights are still read at a supporting part. The stamina area had
  # advised against a larger drain moved to lift A1 alone, and this one was moved for H4-R; A1 moved with it.
  {'id': 'stamina.A1', 'status': IVI, 'why': 'Met on brief 10’s integrated code by the judge area’s second phase (remaining-10/judge-result.json, A1): stamina’s briefs 0.53 and scenes 0.54, its nights 0.334 at a supporting part as the tool reads them (0.487 at a lead, 0.138 featured), measured by tools/ag-baseline.ts and tools/ag-criteria.mjs (decisions-2026-10-16/integrated/after/criteria.txt, a1-nights.json); no gate test holds A1’s figure. Which part a night is read at no longer decides A1, and stays the owner’s to change',
   'citations': []},
  # The last pass's banking area left Germany's month's fee on a close to the owner; brief 09 implemented it from the
  # statute and the banks' price lists (remaining-09/banking-result.json, banking.1.pro-rata), so the decision is settled.
  {'id': 'banking.1.pro-rata', 'status': IAV, 'why': 'Settled by brief 09, section 4 (8f0d25c6): the month’s fee on a German close charged to the day under BGB § 675h(3), shown before the press, its last pass’s decision row superseded',
   'citations': [cite('tests/remaining-09-banking.test.ts', 'banking.1.pro-rata: a German account’s month’s fee on a close, to the day > PLAYER JOURNEY: on Wednesday 14 October 2026 Your Banks tells the Berlin-raised student…')]},
  {'id': 'coverage.7-overdraft-home-panel', 'status': IAV, 'why': 'Reported by the coverage area and fixed outside it the same day (d31f0a94): the overdraft and loan offers ask abroadRefusal first, and the panels say the refusal in place of their controls',
   'citations': [cite('tests/integration-home-lending.test.ts', 'borrowing at a bank kept from home > PLAYER JOURNEY: a London-raised student keeping HSBC UK is told at Borrowing that it opens nothing new for a customer abroad')]},
]
# Brief 11 (2026-10-16): the open rows' administrative reconciliations (docs/verification/completion-2026-10-16/
# classification.json). Each is a record, not progress: it leaves the in-scope rows and is reported apart from the rows
# closed by work. Brief 11's own words decide each, so none goes back to the owner. Until brief 11 ST3, H4 and L3 as written stayed Not
# Implemented, the two duplicates were open rows of their own, and the four records were Implemented, Verification
# Incomplete, which nothing in the current build could verify.
B11 = 'docs/verification/completion-2026-10-16'
B11_HISTORICAL = 'brief 11, section 3: “Superseded acting criteria remain historical evidence. Do not count their historical failures as separate current implementation tasks.”'
B11_ADMIN = {
  'ST3.asWritten': f'Superseded by ST3-R, approved by the owner in brief 10 (decision 1), and kept as historical evidence ({B11_HISTORICAL}); as written, not met: the even actor the same as shown on 185 of 193 on brief 10’s final code (decisions-2026-10-16/integrated/after/st3.json)',
  'H4.asWritten': f'Superseded by H4-R, approved by the owner in brief 10 (decision 1), and kept as historical evidence ({B11_HISTORICAL}); as written, not met: 1 of 12 on brief 10’s final code (decisions-2026-10-16/integrated/after/criteria.txt)',
  'L3.asWritten': f'Superseded by L3-R, approved by the owner in brief 10 (decision 1), and kept as historical evidence ({B11_HISTORICAL}); as written, not met: failing on 2 of brief 10’s 8 journeys on its final code (decisions-2026-10-16/integrated/after/l3r.json)',
  'tax.s8.residence_naturalization': 'A duplicate: residence abroad and naturalization were deferred by the owner’s scope reset of 2026-10-09, as the audit’s own rows for them already are (documents.residence, documents.settle, documents.renew_residence, documents.naturalize, citizenship.decided, each Explicitly Deferred); counted there, not twice (brief 11, section 3)',
  'judge.stamina-load': 'A duplicate: brief 09’s question whether a night’s load should read a heavier, sourced account was answered by the owner’s decision 5 in brief 10, a night’s workload by its running time, part, intensity and breaks, verified as stamina.W1 to stamina.W10 (each Implemented And Verified; W2 and W3 hold that a longer or harder night drains more); counted there, not twice (brief 11, section 3)',
  'tax.s8.jurisdiction': 'A historical record of a process step: the tax area’s research of which office’s rules each papers system follows (remaining/tax-result.json); the rules themselves are each audit row’s own, verified there (brief 11, section 3)',
  'judge.baseline': 'A historical record of a process step: its brief’s criteria measured on the engine before any change, the outputs kept; nothing in the current build can measure an engine that no longer exists, and the current figures are the criteria rows’ (brief 11, section 3)',
  'stamina.measure': 'A historical record of a process step: the stamina area’s first look at what moved, before and after its change (brief 10); the current figures are the criteria rows’ and the judge area’s, measured on the tested commit (brief 11, section 3)',
}
for id, why in B11_ADMIN.items():
    OVERRIDES.append({'id': id, 'status': ED, 'deferredBy': why, 'why': 'Reconciled administratively under brief 11, section 3; not counted as progress', 'citations': [{'file': f'{B11}/classification.json'}]})
# Brief 11's criteria on its tested commit (completion-2026-10-16/final/, figures.json read from the outputs, none typed):
# the areas' changes to systems/material.ts, systems/briefs.ts and systems/leave.ts left every judge measurement stale, so
# each was made again there. Every output is brief 10's, byte for byte, but for fields this pass added to two tools, so a
# figure the same as brief 10's is said to be. Until then these rows stood on brief 10's 567d27dd.
B11F = f'{B11}/final'
if os.path.exists(f'{B11F}/figures.json'):
    FIG11 = json.load(open(f'{B11F}/figures.json', encoding='utf-8'))
    B11AT = re.search(r'^at (\w+)', open(f'{B11F}/exits.txt', encoding='utf-8').read(), re.M).group(1)
    for r in rows:
        if r.get('measured') == INTEGRATED10:
            assert r['id'] in FIG11, r['id']
            r['measured'] = {'commit': B11AT, 'watch': 'judge'}
            r['failure'] = f"{r['failure']}; on brief 11's tested commit ({B11AT}): {'the same' if FIG11[r['id']] == FIG10.get(r['id']) else FIG11[r['id']]}"
            r['evidence'] = f"{r['evidence']}; {B11F}/README.md"
            r['citations'] = r['citations'] + [{'file': f'{B11F}/figures.json'}]
# Brief 11's final runs (completion-2026-10-16/runs/, figures.json read from their outputs by runs/figures.py, none
# typed): the long runs, the built app and F2-A's cases on the commit the runs name, the gate on the commit gate.txt names.
# Until they're there, these rows stay brief 10's, and the matrix calls them unverified where what they read has changed.
B11R = f'{B11}/runs'
FIG11R = json.load(open(f'{B11R}/figures.json', encoding='utf-8')) if os.path.exists(f'{B11R}/figures.json') else {}
if FIG11R:
    # Each by the commit its lane ran on: the built app's (lane A) and the engine's runs (the lives' lane, B) can differ
    # where a commit between changed a screen and no engine file (43a82efa's comments).
    lane = lambda name: re.search(r'^at (\w+)', open(f'{B11R}/exits-{name}.txt', encoding='utf-8').read(), re.M).group(1)
    R11 = {'app': lane('A'), 'engine': lane('B')}
    GATE11 = re.search(r'^at (\w+)', open(f'{B11R}/gate.txt', encoding='utf-8').read(), re.M).group(1) if 'INT-gate' in FIG11R else None
    for r in rows:
        m = r.get('measured')
        gate = r['id'] == 'INT-gate'
        if not (m in (RUNS10, BUILT10) or (gate and m and m.get('watch') == 'app')):
            continue
        if gate and not GATE11:
            continue  # the gate's figure, folded in once it has run
        assert r['id'] in FIG11R, r['id']
        r['measured'] = {'commit': GATE11, 'watch': 'app'} if gate else {'commit': R11[m['watch']], 'watch': m['watch']}
        r['failure'] = f"{r['failure']}; brief 11 ({r['measured']['commit']}): {'the same' if FIG11R[r['id']] == FIG10R.get(r['id']) else FIG11R[r['id']]}"
        r['evidence'] = f"{r['evidence']}; {B11R}/README.md"
        r['citations'] = r['citations'] + [{'file': f'{B11R}/figures.json'}] + ([{'file': f'{B11R}/gate.txt'}] if gate else [])
# Brief 12's final runs (resolution-2026-10-17/runs/, figures.json read from their outputs by its runs/figures.py, none
# typed), as brief 11's: the advice area's change to systems/advice.ts and next-steps.ts left brief 11's stale. Each row
# brief 11's runs measured moves to the commit its lane ran on, the gate's to the commit gate.txt names, and its figure is
# said beside brief 11's, or "the same".
B12R = 'docs/verification/resolution-2026-10-17/runs'
FIG12R = json.load(open(f'{B12R}/figures.json', encoding='utf-8')) if os.path.exists(f'{B12R}/figures.json') else {}
if FIG12R and FIG11R:
    lane12 = lambda name: re.search(r'^at (\w+)', open(f'{B12R}/exits-{name}.txt', encoding='utf-8').read(), re.M).group(1)
    R12 = {'app': lane12('A'), 'engine': lane12('B')}
    GATE12 = re.search(r'^at (\w+)', open(f'{B12R}/gate.txt', encoding='utf-8').read(), re.M).group(1) if 'INT-gate' in FIG12R else None
    for r in rows:
        m = r.get('measured')
        gate = r['id'] == 'INT-gate'
        if not (m and r['id'] in FIG11R and (gate or m.get('commit') == R11.get(m.get('watch')))):
            continue
        if gate and not GATE12:
            continue  # the gate's figure, folded in once it has run
        assert r['id'] in FIG12R, r['id']
        r['measured'] = {'commit': GATE12, 'watch': 'app'} if gate else {'commit': R12[m['watch']], 'watch': m['watch']}
        r['failure'] = f"{r['failure']}; brief 12 ({r['measured']['commit']}): {'the same' if FIG12R[r['id']] == FIG11R.get(r['id']) else FIG12R[r['id']]}"
        r['evidence'] = f"{r['evidence']}; {B12R}/README.md"
        r['citations'] = r['citations'] + [{'file': f'{B12R}/figures.json'}] + ([{'file': f'{B12R}/gate.txt'}] if gate else [])
# Brief 13's final runs (playthroughs-2026-10-17/), as brief 11's and brief 12's. The acting area's comments on grainOf and
# briefs.ts, and the interface area's fixes to Home and the looks, changed files the measurements watch. So:
# - the judge's are made again (final/, figures.json by integrated-09/figures.py), and each row brief 11's judge
#   measurement held moves to brief 13's commit, with its figure beside brief 11's;
# - an area item it held, which has no figure of its own, moves only where every output both folders make is byte for
#   byte the same;
# - the long runs, the built app and the gate (runs/, by its runs/figures.py) as brief 12's did.
import filecmp
B13F = 'docs/verification/playthroughs-2026-10-17/final'
if os.path.exists(f'{B13F}/figures.json') and os.path.exists(f'{B11F}/figures.json'):
    FIG13 = json.load(open(f'{B13F}/figures.json', encoding='utf-8'))
    B13AT = re.search(r'^at (\w+)', open(f'{B13F}/exits.txt', encoding='utf-8').read(), re.M).group(1)
    shared = sorted(f for f in os.listdir(B11F) if f.endswith('.json') and f != 'figures.json' and os.path.exists(f'{B13F}/{f}'))
    SAME13 = bool(shared) and all(filecmp.cmp(f'{B11F}/{f}', f'{B13F}/{f}', shallow=False) for f in shared)
    for r in rows:
        if r.get('measured') == {'commit': B11AT, 'watch': 'judge'}:
            assert r['id'] in FIG13, r['id']
            r['measured'] = {'commit': B13AT, 'watch': 'judge'}
            r['failure'] = f"{r['failure']}; on brief 13's tested commit ({B13AT}): {'the same' if FIG13[r['id']] == FIG11.get(r['id']) else FIG13[r['id']]}"
            r['evidence'] = f"{r['evidence']}; {B13F}/README.md"
            r['citations'] = r['citations'] + [{'file': f'{B13F}/figures.json'}]
B13R = 'docs/verification/playthroughs-2026-10-17/runs'
FIG13R = json.load(open(f'{B13R}/figures.json', encoding='utf-8')) if os.path.exists(f'{B13R}/figures.json') else {}
if FIG13R and FIG12R:
    lane13 = lambda name: re.search(r'^at (\w+)', open(f'{B13R}/exits-{name}.txt', encoding='utf-8').read(), re.M).group(1)
    R13 = {'app': lane13('A'), 'engine': lane13('B')}
    GATE13 = re.search(r'^at (\w+)', open(f'{B13R}/gate.txt', encoding='utf-8').read(), re.M).group(1) if 'INT-gate' in FIG13R else None
    for r in rows:
        m = r.get('measured')
        gate = r['id'] == 'INT-gate'
        if not (m and r['id'] in FIG12R and (gate or m.get('commit') == R12.get(m.get('watch')))):
            continue
        if gate and not GATE13:
            continue  # the gate's figure, folded in once it has run
        assert r['id'] in FIG13R, r['id']
        r['measured'] = {'commit': GATE13, 'watch': 'app'} if gate else {'commit': R13[m['watch']], 'watch': m['watch']}
        r['failure'] = f"{r['failure']}; brief 13 ({r['measured']['commit']}): {'the same' if FIG13R[r['id']] == FIG12R.get(r['id']) else FIG13R[r['id']]}"
        r['evidence'] = f"{r['evidence']}; {B13R}/README.md"
        r['citations'] = r['citations'] + [{'file': f'{B13R}/figures.json'}] + ([{'file': f'{B13R}/gate.txt'}] if gate else [])
# Brief 14's final runs (language-2026-10-17/, from 2026-10-18), as brief 13's: the pass changed the player's words, and
# with them files the measurements watch, so each measurement brief 13 held is made again on brief 14's tested commit:
# - the judge's (final/, figures.json by integrated-09/figures.py): each row at brief 13's judge commit moves to brief
#   14's, with its figure beside brief 13's;
# - an area item brief 13's judge measurement held moves only where every output both final folders make is byte for
#   byte the same (below, after the results);
# - the long runs, the built app and the gate (runs/, by its runs/figures.py), as brief 13's did.
B14F = 'docs/verification/language-2026-10-17/final'
SAME14 = False
if os.path.exists(f'{B14F}/figures.json') and os.path.exists(f'{B13F}/figures.json'):
    FIG14 = json.load(open(f'{B14F}/figures.json', encoding='utf-8'))
    B14AT = re.search(r'^at (\w+)', open(f'{B14F}/exits.txt', encoding='utf-8').read(), re.M).group(1)
    # Brief 14 changed words, and the eight brief journeys record a take's words, so byte for byte can't hold. What
    # holds is its own measure (numbers-same.py): every number, id and key in every output the same as brief 13's, with
    # nothing explained away. An area item moves only on that.
    NS14 = json.load(open('docs/verification/language-2026-10-17/numbers-same.json', encoding='utf-8')).get('final', {}) if os.path.exists('docs/verification/language-2026-10-17/numbers-same.json') else {}
    SAME14 = bool(NS14) and NS14.get('same') == NS14.get('files') and not NS14.get('unexplained') and not NS14.get('missing') and not NS14.get('explained')
    for r in rows:
        if r.get('measured') == {'commit': B13AT, 'watch': 'judge'}:
            assert r['id'] in FIG14, r['id']
            r['measured'] = {'commit': B14AT, 'watch': 'judge'}
            r['failure'] = f"{r['failure']}; on brief 14's tested commit ({B14AT}): {'the same' if FIG14[r['id']] == FIG13.get(r['id']) else FIG14[r['id']]}"
            r['evidence'] = f"{r['evidence']}; {B14F}/README.md"
            r['citations'] = r['citations'] + [{'file': f'{B14F}/figures.json'}]
B14R = 'docs/verification/language-2026-10-17/runs'
FIG14R = json.load(open(f'{B14R}/figures.json', encoding='utf-8')) if os.path.exists(f'{B14R}/figures.json') else {}
if FIG14R and FIG13R:
    lane14 = lambda name: re.search(r'^at (\w+)', open(f'{B14R}/exits-{name}.txt', encoding='utf-8').read(), re.M).group(1)
    R14 = {'app': lane14('A'), 'engine': lane14('B')}
    GATE14 = re.search(r'^at (\w+)', open(f'{B14R}/gate.txt', encoding='utf-8').read(), re.M).group(1) if 'INT-gate' in FIG14R else None
    for r in rows:
        m = r.get('measured')
        gate = r['id'] == 'INT-gate'
        if not (m and r['id'] in FIG13R and (gate or m.get('commit') == R13.get(m.get('watch')))):
            continue
        if gate and not GATE14:
            continue  # the gate's figure, folded in once it has run
        assert r['id'] in FIG14R, r['id']
        r['measured'] = {'commit': GATE14, 'watch': 'app'} if gate else {'commit': R14[m['watch']], 'watch': m['watch']}
        r['failure'] = f"{r['failure']}; brief 14 ({r['measured']['commit']}): {'the same' if FIG14R[r['id']] == FIG13R.get(r['id']) else FIG14R[r['id']]}"
        r['evidence'] = f"{r['evidence']}; {B14R}/README.md"
        r['citations'] = r['citations'] + [{'file': f'{B14R}/figures.json'}] + ([{'file': f'{B14R}/gate.txt'}] if gate else [])
# Brief 15's final runs (editorial-2026-10-19/, from 2026-10-19), as brief 14's: an editorial pass that changed the
# player's words, and with them files the measurements watch, so each measurement brief 14 held is made again on brief
# 15's tested commit, the same three ways (the judge's figures, an area item only where every number is the same, and
# the long runs, the built app and the gate).
B15F = 'docs/verification/editorial-2026-10-19/final'
SAME15 = False
if os.path.exists(f'{B15F}/figures.json') and os.path.exists(f'{B14F}/figures.json'):
    FIG15 = json.load(open(f'{B15F}/figures.json', encoding='utf-8'))
    B15AT = re.search(r'^at (\w+)', open(f'{B15F}/exits.txt', encoding='utf-8').read(), re.M).group(1)
    NS15 = json.load(open('docs/verification/editorial-2026-10-19/numbers-same.json', encoding='utf-8')).get('final', {}) if os.path.exists('docs/verification/editorial-2026-10-19/numbers-same.json') else {}
    SAME15 = bool(NS15) and NS15.get('same') == NS15.get('files') and not NS15.get('unexplained') and not NS15.get('missing') and not NS15.get('explained')
    for r in rows:
        if r.get('measured') == {'commit': B14AT, 'watch': 'judge'}:
            assert r['id'] in FIG15, r['id']
            r['measured'] = {'commit': B15AT, 'watch': 'judge'}
            r['failure'] = f"{r['failure']}; on brief 15's tested commit ({B15AT}): {'the same' if FIG15[r['id']] == FIG14.get(r['id']) else FIG15[r['id']]}"
            r['evidence'] = f"{r['evidence']}; {B15F}/README.md"
            r['citations'] = r['citations'] + [{'file': f'{B15F}/figures.json'}]
B15R = 'docs/verification/editorial-2026-10-19/runs'
FIG15R = json.load(open(f'{B15R}/figures.json', encoding='utf-8')) if os.path.exists(f'{B15R}/figures.json') else {}
if FIG15R and FIG14R:
    lane15 = lambda name: re.search(r'^at (\w+)', open(f'{B15R}/exits-{name}.txt', encoding='utf-8').read(), re.M).group(1)
    R15 = {'app': lane15('A'), 'engine': lane15('B')}
    GATE15 = re.search(r'^at (\w+)', open(f'{B15R}/gate.txt', encoding='utf-8').read(), re.M).group(1) if 'INT-gate' in FIG15R and os.path.exists(f'{B15R}/gate.txt') else None
    for r in rows:
        m = r.get('measured')
        gate = r['id'] == 'INT-gate'
        if not (m and r['id'] in FIG14R and (gate or m.get('commit') == R14.get(m.get('watch')))):
            continue
        if gate and not GATE15:
            continue  # the gate's figure, folded in once it has run
        assert r['id'] in FIG15R, r['id']
        r['measured'] = {'commit': GATE15, 'watch': 'app'} if gate else {'commit': R15[m['watch']], 'watch': m['watch']}
        r['failure'] = f"{r['failure']}; brief 15 ({r['measured']['commit']}): {'the same' if FIG15R[r['id']] == FIG14R.get(r['id']) else FIG15R[r['id']]}"
        r['evidence'] = f"{r['evidence']}; {B15R}/README.md"
        r['citations'] = r['citations'] + [{'file': f'{B15R}/figures.json'}] + ([{'file': f'{B15R}/gate.txt'}] if gate else [])
# Brief 16's runs (voices-2026-10-20/, from 2026-10-20), as brief 15's: a pass that changed the player's words, and with
# them files the measurements watch, so each measurement brief 15 held is made again on brief 16's tested commit, the
# same three ways (the judge's figures, an area item only where every number is the same, and the long runs, the built
# app and the gate).
B16F = 'docs/verification/voices-2026-10-20/final'
SAME16 = False
if os.path.exists(f'{B16F}/figures.json') and os.path.exists(f'{B15F}/figures.json'):
    FIG16 = json.load(open(f'{B16F}/figures.json', encoding='utf-8'))
    B16AT = re.search(r'^at (\w+)', open(f'{B16F}/exits.txt', encoding='utf-8').read(), re.M).group(1)
    NS16 = json.load(open('docs/verification/voices-2026-10-20/numbers-same.json', encoding='utf-8')).get('final', {}) if os.path.exists('docs/verification/voices-2026-10-20/numbers-same.json') else {}
    SAME16 = bool(NS16) and NS16.get('same') == NS16.get('files') and not NS16.get('unexplained') and not NS16.get('missing') and not NS16.get('explained')
    for r in rows:
        if r.get('measured') == {'commit': B15AT, 'watch': 'judge'}:
            assert r['id'] in FIG16, r['id']
            r['measured'] = {'commit': B16AT, 'watch': 'judge'}
            r['failure'] = f"{r['failure']}; on brief 16's tested commit ({B16AT}): {'the same' if FIG16[r['id']] == FIG15.get(r['id']) else FIG16[r['id']]}"
            r['evidence'] = f"{r['evidence']}; {B16F}/README.md"
            r['citations'] = r['citations'] + [{'file': f'{B16F}/figures.json'}]
B16R = 'docs/verification/voices-2026-10-20/runs'
FIG16R = json.load(open(f'{B16R}/figures.json', encoding='utf-8')) if os.path.exists(f'{B16R}/figures.json') else {}
if FIG16R and FIG15R:
    lane16 = lambda name: re.search(r'^at (\w+)', open(f'{B16R}/exits-{name}.txt', encoding='utf-8').read(), re.M).group(1)
    R16 = {'app': lane16('A'), 'engine': lane16('B')}
    GATE16 = re.search(r'^at (\w+)', open(f'{B16R}/gate.txt', encoding='utf-8').read(), re.M).group(1) if 'INT-gate' in FIG16R and os.path.exists(f'{B16R}/gate.txt') else None
    for r in rows:
        m = r.get('measured')
        gate = r['id'] == 'INT-gate'
        if not (m and r['id'] in FIG15R and (gate or m.get('commit') == R15.get(m.get('watch')))):
            continue
        if gate and not GATE16:
            continue  # the gate's figure, folded in once it has run
        assert r['id'] in FIG16R, r['id']
        r['measured'] = {'commit': GATE16, 'watch': 'app'} if gate else {'commit': R16[m['watch']], 'watch': m['watch']}
        r['failure'] = f"{r['failure']}; brief 16 ({r['measured']['commit']}): {'the same' if FIG16R[r['id']] == FIG15R.get(r['id']) else FIG16R[r['id']]}"
        r['evidence'] = f"{r['evidence']}; {B16R}/README.md"
        r['citations'] = r['citations'] + [{'file': f'{B16R}/figures.json'}] + ([{'file': f'{B16R}/gate.txt'}] if gate else [])
# Brief 17's runs (continuity-2026-10-20/, from 2026-10-20), as brief 16's: a pass that changed the player's words and,
# at the owner's word, one mechanic (a classmate's apology kept on the misses it's for), and with them files the
# measurements watch, so each measurement brief 16 held is made again on brief 17's tested commit, the same three ways.
B17F = 'docs/verification/continuity-2026-10-20/final'
SAME17 = False
if os.path.exists(f'{B17F}/figures.json') and os.path.exists(f'{B16F}/figures.json'):
    FIG17 = json.load(open(f'{B17F}/figures.json', encoding='utf-8'))
    B17AT = re.search(r'^at (\w+)', open(f'{B17F}/exits.txt', encoding='utf-8').read(), re.M).group(1)
    # Brief 17's numbers-same.json holds two comparisons (the words, and the fix); the judge's outputs are the words'.
    NS17 = json.load(open('docs/verification/continuity-2026-10-20/numbers-same.json', encoding='utf-8')).get('words', {}).get('final', {}) if os.path.exists('docs/verification/continuity-2026-10-20/numbers-same.json') else {}
    SAME17 = bool(NS17) and NS17.get('same') == NS17.get('files') and not NS17.get('unexplained') and not NS17.get('missing') and not NS17.get('explained')
    for r in rows:
        if r.get('measured') == {'commit': B16AT, 'watch': 'judge'}:
            assert r['id'] in FIG17, r['id']
            r['measured'] = {'commit': B17AT, 'watch': 'judge'}
            r['failure'] = f"{r['failure']}; on brief 17's tested commit ({B17AT}): {'the same' if FIG17[r['id']] == FIG16.get(r['id']) else FIG17[r['id']]}"
            r['evidence'] = f"{r['evidence']}; {B17F}/README.md"
            r['citations'] = r['citations'] + [{'file': f'{B17F}/figures.json'}]
B17R = 'docs/verification/continuity-2026-10-20/runs'
FIG17R = json.load(open(f'{B17R}/figures.json', encoding='utf-8')) if os.path.exists(f'{B17R}/figures.json') else {}
if FIG17R and FIG16R:
    lane17 = lambda name: re.search(r'^at (\w+)', open(f'{B17R}/exits-{name}.txt', encoding='utf-8').read(), re.M).group(1)
    R17 = {'app': lane17('A'), 'engine': lane17('B')}
    GATE17 = re.search(r'^at (\w+)', open(f'{B17R}/gate.txt', encoding='utf-8').read(), re.M).group(1) if 'INT-gate' in FIG17R and os.path.exists(f'{B17R}/gate.txt') else None
    for r in rows:
        m = r.get('measured')
        gate = r['id'] == 'INT-gate'
        if not (m and r['id'] in FIG16R and (gate or m.get('commit') == R16.get(m.get('watch')))):
            continue
        if gate and not GATE17:
            continue  # the gate's figure, folded in once it has run
        assert r['id'] in FIG17R, r['id']
        r['measured'] = {'commit': GATE17, 'watch': 'app'} if gate else {'commit': R17[m['watch']], 'watch': m['watch']}
        r['failure'] = f"{r['failure']}; brief 17 ({r['measured']['commit']}): {'the same' if FIG17R[r['id']] == FIG16R.get(r['id']) else FIG17R[r['id']]}"
        r['evidence'] = f"{r['evidence']}; {B17R}/README.md"
        r['citations'] = r['citations'] + [{'file': f'{B17R}/figures.json'}] + ([{'file': f'{B17R}/gate.txt'}] if gate else [])
# Brief 19's runs (career-2026-10-20/final-runs/, from 2026-10-21), as brief 17's: a pass that added the career and with
# it changed the School's last term (the Actor Showcase's coursework), the clock's stops and the understudy's part, files
# the measurements watch, so each measurement brief 17 held is made again on brief 19's tested commit, the same ways.
B19F = 'docs/verification/career-2026-10-20/final-runs/final'
SAME19 = False
if os.path.exists(f'{B19F}/figures.json') and os.path.exists(f'{B17F}/figures.json'):
    FIG19 = json.load(open(f'{B19F}/figures.json', encoding='utf-8'))
    B19AT = re.search(r'^at (\w+)', open(f'{B19F}/exits.txt', encoding='utf-8').read(), re.M).group(1)
    NS19P = 'docs/verification/career-2026-10-20/final-runs/numbers-same.json'
    NS19 = json.load(open(NS19P, encoding='utf-8')).get('final', {}) if os.path.exists(NS19P) else {}
    SAME19 = bool(NS19) and NS19.get('same') == NS19.get('files') and not NS19.get('unexplained') and not NS19.get('missing') and not NS19.get('explained')
    for r in rows:
        if r.get('measured') == {'commit': B17AT, 'watch': 'judge'}:
            assert r['id'] in FIG19, r['id']
            r['measured'] = {'commit': B19AT, 'watch': 'judge'}
            r['failure'] = f"{r['failure']}; on brief 19's tested commit ({B19AT}): {'the same' if FIG19[r['id']] == FIG17.get(r['id']) else FIG19[r['id']]}"
            r['evidence'] = f"{r['evidence']}; {B19F}/README.md"
            r['citations'] = r['citations'] + [{'file': f'{B19F}/figures.json'}]
B19R = 'docs/verification/career-2026-10-20/final-runs/runs'
FIG19R = json.load(open(f'{B19R}/figures.json', encoding='utf-8')) if os.path.exists(f'{B19R}/figures.json') else {}
if FIG19R and FIG17R:
    lane19 = lambda name: re.search(r'^at (\w+)', open(f'{B19R}/exits-{name}.txt', encoding='utf-8').read(), re.M).group(1)
    R19 = {'app': lane19('A'), 'engine': lane19('B')}
    GATE19 = re.search(r'^at (\w+)', open(f'{B19R}/gate.txt', encoding='utf-8').read(), re.M).group(1) if 'INT-gate' in FIG19R and os.path.exists(f'{B19R}/gate.txt') else None
    for r in rows:
        m = r.get('measured')
        gate = r['id'] == 'INT-gate'
        if not (m and r['id'] in FIG17R and (gate or m.get('commit') == R17.get(m.get('watch')))):
            continue
        if gate and not GATE19:
            continue  # the gate's figure, folded in once it has run
        assert r['id'] in FIG19R, r['id']
        r['measured'] = {'commit': GATE19, 'watch': 'app'} if gate else {'commit': R19[m['watch']], 'watch': m['watch']}
        r['failure'] = f"{r['failure']}; brief 19 ({r['measured']['commit']}): {'the same' if FIG19R[r['id']] == FIG17R.get(r['id']) else FIG19R[r['id']]}"
        r['evidence'] = f"{r['evidence']}; {B19R}/README.md"
        r['citations'] = r['citations'] + [{'file': f'{B19R}/figures.json'}] + ([{'file': f'{B19R}/gate.txt'}] if gate else [])
# Brief 20's runs (audit-2026-10-21/final-runs/, from 2026-10-22), as brief 19's: a pass that changed what the game does
# in money, the career, the School, papers, benefits and life, files the measurements watch, so each measurement brief 19
# held is made again on brief 20's tested commit, the same ways. The judge's rows aren't among them unless the judge's
# files moved (its lanes weren't run, and a judge row brief 19 measured stays brief 19's).
B20R = 'docs/verification/audit-2026-10-21/final-runs/runs'
FIG20R = json.load(open(f'{B20R}/figures.json', encoding='utf-8')) if os.path.exists(f'{B20R}/figures.json') else {}
if FIG20R and FIG19R:
    lane20 = lambda name: re.search(r'^at (\w+)', open(f'{B20R}/exits-{name}.txt', encoding='utf-8').read(), re.M).group(1)
    R20 = {'app': lane20('A'), 'engine': lane20('B')}
    GATE20 = re.search(r'^at (\w+)', open(f'{B20R}/gate.txt', encoding='utf-8').read(), re.M).group(1) if 'INT-gate' in FIG20R and os.path.exists(f'{B20R}/gate.txt') else None
    for r in rows:
        m = r.get('measured')
        gate = r['id'] == 'INT-gate'
        if not (m and r['id'] in FIG19R and (gate or m.get('commit') == R19.get(m.get('watch')))):
            continue
        if gate and not GATE20:
            continue  # the gate's figure, folded in once it has run
        assert r['id'] in FIG20R, r['id']
        r['measured'] = {'commit': GATE20, 'watch': 'app'} if gate else {'commit': R20[m['watch']], 'watch': m['watch']}
        r['failure'] = f"{r['failure']}; brief 20 ({r['measured']['commit']}): {'the same' if FIG20R[r['id']] == FIG19R.get(r['id']) else FIG20R[r['id']]}"
        r['evidence'] = f"{r['evidence']}; {B20R}/README.md"
        r['citations'] = r['citations'] + [{'file': f'{B20R}/figures.json'}] + ([{'file': f'{B20R}/gate.txt'}] if gate else [])
# Brief 21's judge (genre-banking-2026-10-22/final-runs/final/, from 2026-10-22), as brief 19's: a pass that changed files
# the judge's measurements watch (a night's interpretation reads the genre, `content/tasks.ts`; a taped brief's practice
# shared by weight, `systems/briefs.ts`; the Seagull's kinds, `content/plays.ts`), so every criterion brief 19 measured is
# measured again on brief 21's tested commit, each figure beside brief 19's ("the same" where it is). Brief 20 ran no
# judge lanes, none of its files being among them. A figure that moved is read against its criterion in judge-moved.json:
# one read as holding stays verified, one whose reading puts a question to the owner is Decision Required, and one moved
# with no reading leaves its row Implemented, Verification Incomplete.
B21F = 'docs/verification/genre-banking-2026-10-22/final-runs/final'
B21MOVED = 'docs/verification/genre-banking-2026-10-22/final-runs/judge-moved.json'
if os.path.exists(f'{B21F}/figures.json') and os.path.exists(f'{B19F}/figures.json'):
    FIG21 = json.load(open(f'{B21F}/figures.json', encoding='utf-8'))
    B21AT = re.search(r'^at (\w+)', open(f'{B21F}/exits.txt', encoding='utf-8').read(), re.M).group(1)
    MOVED21 = json.load(open(B21MOVED, encoding='utf-8')) if os.path.exists(B21MOVED) else {}
    for r in rows:
        if r.get('measured') == {'commit': B19AT, 'watch': 'judge'}:
            assert r['id'] in FIG21, r['id']
            same = FIG21[r['id']] == FIG19.get(r['id'])
            read = MOVED21.get(r['id'])
            held = same or bool(read and read.get('was') == FIG19.get(r['id']) and read.get('now') == FIG21[r['id']] and read.get('holds') and read.get('why'))
            r['measured'] = {'commit': B21AT, 'watch': 'judge'}
            r['failure'] = f"{r['failure']}; on brief 21's tested commit ({B21AT}): {'the same' if same else FIG21[r['id']]}{'' if same or not read else ' (' + read['why'] + ')'}"
            r['evidence'] = f"{r['evidence']}; {B21F}/README.md"
            r['citations'] = r['citations'] + [{'file': f'{B21F}/figures.json'}] + ([] if same else [{'file': B21MOVED}] if read else [])
            # A move its reading leaves to the owner (the criterion as written against what brief 21 asked) is a decision.
            if not held and r['status'] == IAV and read and read.get('decision'):
                r['status'] = DR
                r['decision'] = read['decision']
            elif not held and r['status'] == IAV:
                r['status'] = IVI
                r['missing'] = f"brief 21's figure moved from brief 19's ({FIG19.get(r['id'])}) to {FIG21[r['id']]}, with no reading in {B21MOVED} that its criterion still holds"
# Brief 22's judge (career-genre-2026-10-22/final-runs/final/, from 2026-10-22), as brief 21's: a pass that changed what
# the judge reads (each work asks its genres as its material states them, `content/genre-weights.ts`; a related genre
# counts across one direct link, at 0.65 or 0.40), so every criterion brief 21 measured is measured again on brief 22's
# tested commit, each figure beside brief 21's ("the same" where it is). A figure that moved is read against its criterion
# in judge-moved.json ("figures"), as brief 21's were. The Genre Audit as written ("leaks into none") is superseded at the
# owner's word (brief 22): kept in the record with its figure, and counted as Genre Audit-R, its replacement, measured on
# the same run (judge-result.json's replacements). Until brief 22 it was Decision Required (brief 21's judge-moved.json).
B22F = 'docs/verification/career-genre-2026-10-22/final-runs/final'
B22MOVED = 'docs/verification/career-genre-2026-10-22/final-runs/judge-moved.json'
B22SUPERSEDED = ("Superseded by Genre Audit-R at the owner's word in brief 22 (\"Explicitly supersede the old 'no transfer to any other genre' "
                 "criterion with: 'No unrelated-genre contribution; only documented, bounded transfer across approved direct relationships.'\"), "
                 "measured on brief 22's tested commit (career-genre-2026-10-22/final-runs/judge-result.json); as written it stays in the record with "
                 "its figure, the next genre over moving in pairs each a genre and its own kind, and its history, brief 21's question and the "
                 "authorization are kept in career-genre-2026-10-22/decision-history.md")
if os.path.exists(f'{B22F}/figures.json') and os.path.exists(f'{B21F}/figures.json'):
    FIG22 = json.load(open(f'{B22F}/figures.json', encoding='utf-8'))
    B22AT = re.search(r'^at (\w+)', open(f'{B22F}/exits.txt', encoding='utf-8').read(), re.M).group(1)
    MOVED22 = json.load(open(B22MOVED, encoding='utf-8')).get('figures', {}) if os.path.exists(B22MOVED) else {}
    for r in rows:
        if r.get('measured') == {'commit': B21AT, 'watch': 'judge'}:
            assert r['id'] in FIG22, r['id']
            same = FIG22[r['id']] == FIG21.get(r['id'])
            read = MOVED22.get(r['id'])
            held = same or bool(read and read.get('was') == FIG21.get(r['id']) and read.get('now') == FIG22[r['id']] and read.get('holds') and read.get('why'))
            r['measured'] = {'commit': B22AT, 'watch': 'judge'}
            r['failure'] = f"{r['failure']}; on brief 22's tested commit ({B22AT}): {'the same' if same else FIG22[r['id']]}{'' if same or not read else ' (' + read['why'] + ')'}"
            r['evidence'] = f"{r['evidence']}; {B22F}/README.md"
            r['citations'] = r['citations'] + [{'file': f'{B22F}/figures.json'}] + ([] if same else [{'file': B22MOVED}] if read else [])
            if r['id'] == 'Genre Audit':
                r.pop('decision', None)
                r['status'], r['deferredBy'] = ED, B22SUPERSEDED
            elif not held and r['status'] == IAV and read and read.get('decision'):
                r['status'] = DR
                r['decision'] = read['decision']
            elif not held and r['status'] == IAV:
                r['status'] = IVI
                r['missing'] = f"brief 22's figure moved from brief 21's ({FIG21.get(r['id'])}) to {FIG22[r['id']]}, with no reading in {B22MOVED} that its criterion still holds"
# Brief 21's runs (genre-banking-2026-10-22/final-runs/, from 2026-10-22), as brief 20's: a pass that changed how genres
# are weighed and read, and money's yields, a US card's late days and due day and standing orders, files the
# measurements watch, so each measurement brief 20 held is made again on brief 21's tested commit, the same ways.
B21R = 'docs/verification/genre-banking-2026-10-22/final-runs/runs'
FIG21R = json.load(open(f'{B21R}/figures.json', encoding='utf-8')) if os.path.exists(f'{B21R}/figures.json') else {}
if FIG21R and FIG20R:
    lane21 = lambda name: re.search(r'^at (\w+)', open(f'{B21R}/exits-{name}.txt', encoding='utf-8').read(), re.M).group(1)
    R21 = {'app': lane21('A'), 'engine': lane21('B')}
    GATE21 = re.search(r'^at (\w+)', open(f'{B21R}/gate.txt', encoding='utf-8').read(), re.M).group(1) if 'INT-gate' in FIG21R and os.path.exists(f'{B21R}/gate.txt') else None
    for r in rows:
        m = r.get('measured')
        gate = r['id'] == 'INT-gate'
        if not (m and r['id'] in FIG20R and (gate or m.get('commit') == R20.get(m.get('watch')))):
            continue
        if gate and not GATE21:
            continue  # the gate's figure, folded in once it has run
        assert r['id'] in FIG21R, r['id']
        r['measured'] = {'commit': GATE21, 'watch': 'app'} if gate else {'commit': R21[m['watch']], 'watch': m['watch']}
        r['failure'] = f"{r['failure']}; brief 21 ({r['measured']['commit']}): {'the same' if FIG21R[r['id']] == FIG20R.get(r['id']) else FIG21R[r['id']]}"
        r['evidence'] = f"{r['evidence']}; {B21R}/README.md"
        r['citations'] = r['citations'] + [{'file': f'{B21R}/figures.json'}] + ([{'file': f'{B21R}/gate.txt'}] if gate else [])
# Brief 22's runs (career-genre-2026-10-22/final-runs/, from 2026-10-22), as brief 21's: a pass that changed how a
# work's genres are weighed and what a related genre counts for, and work authorization (OPT counted by the day,
# permission read at each work day, release, pay for days worked), files the measurements watch, so each measurement brief
# 21 held is made again on brief 22's tested commit, the same ways.
B22R = 'docs/verification/career-genre-2026-10-22/final-runs/runs'
FIG22R = json.load(open(f'{B22R}/figures.json', encoding='utf-8')) if os.path.exists(f'{B22R}/figures.json') else {}
if FIG22R and FIG21R:
    lane22 = lambda name: re.search(r'^at (\w+)', open(f'{B22R}/exits-{name}.txt', encoding='utf-8').read(), re.M).group(1)
    R22 = {'app': lane22('A'), 'engine': lane22('B')}
    GATE22 = re.search(r'^at (\w+)', open(f'{B22R}/gate.txt', encoding='utf-8').read(), re.M).group(1) if 'INT-gate' in FIG22R and os.path.exists(f'{B22R}/gate.txt') else None
    for r in rows:
        m = r.get('measured')
        gate = r['id'] == 'INT-gate'
        if not (m and r['id'] in FIG21R and (gate or m.get('commit') == R21.get(m.get('watch')))):
            continue
        if gate and not GATE22:
            continue  # the gate's figure, folded in once it has run
        assert r['id'] in FIG22R, r['id']
        r['measured'] = {'commit': GATE22, 'watch': 'app'} if gate else {'commit': R22[m['watch']], 'watch': m['watch']}
        r['failure'] = f"{r['failure']}; brief 22 ({r['measured']['commit']}): {'the same' if FIG22R[r['id']] == FIG21R.get(r['id']) else FIG22R[r['id']]}"
        r['evidence'] = f"{r['evidence']}; {B22R}/README.md"
        r['citations'] = r['citations'] + [{'file': f'{B22R}/figures.json'}] + ([{'file': f'{B22R}/gate.txt'}] if gate else [])
# Brief 11's areas' results (completion-2026-10-16/<area>-result.json, the coordinator's integration-result.json among
# them): each row an area worked, its status and the tests it cites, read onto the matrix, never typed here. An area's
# item takes an override; a criterion or shortfall row here is changed in place. The audit's rows aren't taken: their
# status is the audit's own, through the pipeline's fold and a second reader's check (health.enroll, l-actor). Until
# later on 2026-10-17 the coordinator's five rows were copied in by hand.
AUDIT_IDS = {it['id'] for f in sorted(os.listdir('docs/verification/audit')) if f.endswith('.json') for it in json.load(open(f'docs/verification/audit/{f}', encoding='utf-8'))['items']}
NEEDS11 = {IVI: 'missing', PI: 'gap', NI: 'gap', BE: 'blocker', DR: 'decision', ED: 'deferredBy'}
# Brief 12's (resolution-2026-10-17/, from 2026-10-17) are read after brief 11's, the same way, so a later result replaces an
# earlier override; and a replacement criterion it writes (`replacements`: ST6-R2's four, which supersede ST6-R's (a), (c),
# (e) and (g) at the owner's authorization) is a row of its own, closed on its own evidence and never on its original's.
B12 = 'docs/verification/resolution-2026-10-17'
# Brief 13's (playthroughs-2026-10-17/, from 2026-10-17) after brief 12's: its ST6-R2.c and .e rows change the replacement
# rows brief 12 wrote, in place.
B13 = 'docs/verification/playthroughs-2026-10-17'
# Brief 14's (language-2026-10-17/, from 2026-10-18) after brief 13's: its verify.py restates brief 13's own clauses on
# brief 14's runs (verification-result.json), and a later pass's row replaces an earlier one's in place.
B14 = 'docs/verification/language-2026-10-17'
# Brief 15's (editorial-2026-10-19/, from 2026-10-19) after brief 14's, the same way: its verify.py restates brief 14's
# held rows on brief 15's runs, and its advice/close.py the advice's four rows.
B15 = 'docs/verification/editorial-2026-10-19'
# Brief 16's (voices-2026-10-20/, from 2026-10-20) after brief 15's, the same way.
B16 = 'docs/verification/voices-2026-10-20'
# Brief 17's (continuity-2026-10-20/, from 2026-10-20) after brief 16's, the same way.
B17 = 'docs/verification/continuity-2026-10-20'
# Brief 19's (career-2026-10-20/final-runs/, from 2026-10-21) after brief 17's, the same way: its verify.py restates
# brief 17's held rows on brief 19's runs, and its advice/close.py the advice's four rows.
B19 = 'docs/verification/career-2026-10-20/final-runs'
# Brief 20's (audit-2026-10-21/final-runs/, from 2026-10-22) after brief 19's, the same way: its verify.py restates brief
# 19's held rows on brief 20's runs, and its advice/close.py the advice's four rows.
B20 = 'docs/verification/audit-2026-10-21/final-runs'
# Brief 21's (genre-banking-2026-10-22/final-runs/, from 2026-10-22) after brief 20's, the same way, with its judge's four
# area items restated on its own outputs (judge.py, judge-result.json): they're read from brief 21's figures where they
# moved, not carried as brief 19's.
B21 = 'docs/verification/genre-banking-2026-10-22/final-runs'
# Brief 22's (career-genre-2026-10-22/final-runs/, from 2026-10-22) after brief 21's, the same way: its verify.py restates
# brief 21's held rows on brief 22's runs, its advice/close.py the advice's four rows, and its judge.py the judge's four
# area items and the Genre Audit's replacement, Genre Audit-R.
B22 = 'docs/verification/career-genre-2026-10-22/final-runs'
PASSES = [(B11, 'Brief 11')] + ([(B12, 'Brief 12')] if os.path.isdir(B12) else []) + ([(B13, 'Brief 13')] if os.path.isdir(B13) else []) + ([(B14, 'Brief 14')] if os.path.exists(f'{B14}/verification-result.json') else []) + ([(B15, 'Brief 15')] if os.path.exists(f'{B15}/verification-result.json') else []) + ([(B16, 'Brief 16')] if os.path.exists(f'{B16}/verification-result.json') else []) + ([(B17, 'Brief 17')] if os.path.exists(f'{B17}/verification-result.json') else []) + ([(B19, 'Brief 19')] if os.path.exists(f'{B19}/verification-result.json') else []) + ([(B20, 'Brief 20')] if os.path.exists(f'{B20}/verification-result.json') else []) + ([(B21, 'Brief 21')] if os.path.exists(f'{B21}/verification-result.json') else []) + ([(B22, 'Brief 22')] if os.path.exists(f'{B22}/verification-result.json') else [])
for d, brief, f in [(d, brief, f) for d, brief in PASSES for f in sorted(x for x in os.listdir(d) if x.endswith('-result.json'))]:
    area = f[:-len('-result.json')]
    result = json.load(open(f'{d}/{f}', encoding='utf-8'))
    for n in result.get('replacements', []):
        cites = [cite(e['file'], e.get('title')) for e in n.get('evidence', []) if e.get('file')]
        rec = {'id': n['id'], 'group': f'{brief}: Replacement Criteria', 'kind': 'criterion', 'goal': n.get('criterion') or n.get('goal', 'Not recorded'),
               'entry': n.get('entry', 'Not recorded'), 'preconditions': f"The owner's authorization ({brief}); it replaces {n['replaces']}, which stays as historical evidence",
               'reads': n.get('reads', 'Not recorded'), 'decisions': 'None: a criterion, not a player decision', 'validation': n.get('threshold', n.get('criterion', 'Not recorded')),
               'changes': n.get('changes', 'Not recorded'), 'later': 'None', 'systems': n.get('systems', 'Not recorded'), 'sees': n.get('sees', 'Not recorded'),
               'saveLoad': 'Not recorded', 'failure': n.get('failure', 'Not recorded'), 'implementation': n.get('implementation', 'Not recorded'),
               'evidence': '; '.join(f"{e['file']}{(' ‘' + e['title'] + '’') if e.get('title') else ''}" for e in n.get('evidence', [])) or 'Not recorded',
               'status': n['status'], 'sourceStatus': f'{d}/{f}', 'citations': cites}
        for k in ('missing', 'gap', 'blocker', 'decision', 'deferredBy', 'measured'):
            if n.get(k): rec[k] = n[k]
        rows[:] = [x for x in rows if not (x['id'] == rec['id'] and x['group'] == rec['group'])] + [rec]
    for r in result.get('rows', []):
        if r['id'] in AUDIT_IDS:
            continue
        cites = [cite(e['file'], e.get('title')) for e in r.get('evidence', []) if e.get('file')]
        status = r['status']
        why = f"{brief}, the {area} area ({d}/{f}): {r.get('exercised') or r.get('notProved') or ''}".strip()
        # What the status asks, from whichever of the fields the area wrote it in (common.md: "missing | gap | blocker |
        # decision"); a verified row carries none.
        need = NEEDS11.get(status)
        said = next((r[k] for k in ((need, 'missing', 'gap', 'blocker') if need in ('missing', 'gap') else (need,)) if need and r.get(k)), None)
        assert need is None or said, f"{f}: {r['id']} is {status} without its {need}"
        # A decision whose evidence is its area's result (ST6-R's (c), (e) and (g) rest on (a)'s measurements there) names
        # the result, as the matrix does for brief 09's areas.
        if need == 'decision' and isinstance(said, dict) and not said.get('evidence'):
            said = {**said, 'evidence': f'{d}/{f}'}
        extra = {**({need: said} if need else {}), **({'measured': r['measured']} if r.get('measured') else {})}
        crit = [x for x in rows if x['id'] == r['id'] and x['group'] == r['group']]
        # A clause of brief 13's own (its journeys' and its interface's, from 2026-10-17), which no earlier brief made a row
        # of: a row of its own, in its area's group, the first result to write it making it and a later one changing it.
        if not crit and brief == 'Brief 13' and str(r.get('group', '')).startswith('Brief 13'):
            rows.append({'id': r['id'], 'group': r['group'], 'kind': 'criterion', 'goal': r.get('ownersWords') or r.get('criterion', 'Not recorded'),
                         'entry': r.get('exercised', 'Not recorded'), 'preconditions': f"The owner's brief 13 ({d}/{f})", 'reads': 'Not recorded',
                         'decisions': 'None: a measurement of play, not a player decision', 'validation': r.get('criterion', 'Not recorded'), 'changes': 'Not recorded',
                         'later': 'None', 'systems': 'Not recorded', 'sees': 'Not recorded', 'saveLoad': 'Not recorded', 'failure': r.get('statusNote', 'Not recorded'),
                         'implementation': 'Not recorded', 'evidence': f'{d}/{f}', 'status': status, 'sourceStatus': f'{d}/{f}', 'citations': cites, **extra})
            continue
        if crit:
            x = crit[0]
            # What its old status asked goes with it (KS-ct-idcard's missing, once it's Blocked Externally).
            for k in ('missing', 'gap', 'blocker', 'decision', 'deferredBy'):
                if k != need: x.pop(k, None)
            x.update({'status': status, 'citations': x['citations'] + cites, 'evidence': f"{x['evidence']}; {d}/{f}", **extra})
            if status == IAV:
                # Verified by the tests it cites, not by the measurement it carried, and no longer a decision (L1, brief 11).
                # A result that measures it again keeps its own measurement (brief 13's verify.py, from 2026-10-17): until
                # then this dropped it, and a row its area had verified by a run lost what verified it.
                if not r.get('measured'):
                    x.pop('measured', None)
                x.pop('decision', None)
            continue
        # It replaces an earlier override of the same item (stamina.A1's of brief 10), since the matrix reads the first.
        OVERRIDES[:] = [o for o in OVERRIDES if o['id'] != r['id']]
        OVERRIDES.append({'id': r['id'], 'status': status, 'why': why, 'citations': cites, **extra})
# The area items brief 11's judge measurement held, after the results that write them: moved to brief 13's commit only where
# every output both final folders make is byte for byte the same (above).
if os.path.exists(f'{B13F}/figures.json') and SAME13:
    for o in OVERRIDES:
        if o.get('measured') == {'commit': B11AT, 'watch': 'judge'}:
            o['measured'] = {'commit': B13AT, 'watch': 'judge'}
            o['citations'] = o.get('citations', []) + [{'file': f'{B13F}/README.md'}]
# And brief 14's, the same way (from 2026-10-18): moved from brief 13's commit only where every output both final folders
# make is byte for byte the same.
if SAME14:
    for o in OVERRIDES:
        if o.get('measured') == {'commit': B13AT, 'watch': 'judge'}:
            o['measured'] = {'commit': B14AT, 'watch': 'judge'}
            o['citations'] = o.get('citations', []) + [{'file': f'{B14F}/README.md'}]
# And brief 15's (from 2026-10-19): moved from brief 14's commit only where every output both final folders make is
# the same in every number, nothing explained away.
if SAME15:
    for o in OVERRIDES:
        if o.get('measured') == {'commit': B14AT, 'watch': 'judge'}:
            o['measured'] = {'commit': B15AT, 'watch': 'judge'}
            o['citations'] = o.get('citations', []) + [{'file': f'{B15F}/README.md'}]
# And brief 16's (from 2026-10-20), the same way.
if SAME16:
    for o in OVERRIDES:
        if o.get('measured') == {'commit': B15AT, 'watch': 'judge'}:
            o['measured'] = {'commit': B16AT, 'watch': 'judge'}
            o['citations'] = o.get('citations', []) + [{'file': f'{B16F}/README.md'}]
# And brief 17's (from 2026-10-20), the same way.
if SAME17:
    for o in OVERRIDES:
        if o.get('measured') == {'commit': B16AT, 'watch': 'judge'}:
            o['measured'] = {'commit': B17AT, 'watch': 'judge'}
            o['citations'] = o.get('citations', []) + [{'file': f'{B17F}/README.md'}]
# And brief 19's (from 2026-10-21), the same way.
if SAME19:
    for o in OVERRIDES:
        if o.get('measured') == {'commit': B17AT, 'watch': 'judge'}:
            o['measured'] = {'commit': B19AT, 'watch': 'judge'}
            o['citations'] = o.get('citations', []) + [{'file': f'{B19F}/README.md'}]
json.dump({'rows': rows, 'overrides': OVERRIDES}, open(sys.argv[1], 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
print(len(rows))
