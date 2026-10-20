import subprocess, shutil, sys
F='src/engine/systems/feedback.ts'
ORIG=sys.argv[1]
M=[
 ('first gets a step', "if (s === 'first' || s === 'best' || s === 'despite') return false;", "if (s === 'best' || s === 'despite') return false;"),
 ('despite on one point', "const DESPITE_POINTS = 2;", "const DESPITE_POINTS = 1;"),
 ('two first-year voice courses alike', "'Speech And Accents I': 'exacting',", "'Speech And Accents I': 'warm',"),
 ('shape keeps dates', ".replace(new RegExp(`\\\\b${MONTH} \\\\d{1,2}, \\\\d{4}`, 'g'), 'DATE')", ""),
 ('the mark not said as 75%', "const mark = pct(f.enough);", "const mark = pct(0.8);"),
 ('count off by one', "`${cap(t)}, for the ${ordinal(n)} time.", "`${cap(t)}, for the ${ordinal(n - 1)} time."),
 ('colon before a colon note', "const colon = !first.includes(':');", "const colon = true;"),
 ('patient persistent as warm', "`This is the ${ordinal(n)} note on ${t}, the last${w} on ${b.on}. Some notes take longer than others.`", "`${cap(t)} ${has} come up ${count(n)} times now, the last${w} on ${b.on}.`"),
 ('pick ignores memory', "    if (said.has(o)) return Number.MAX_SAFE_INTEGER;", "    return 0;"),
]
for name,a,b in M:
    src=open(ORIG,encoding='utf8').read()
    if src.count(a)!=1:
        print(f'{name}: NOT APPLIED ({src.count(a)})'); continue
    open(F,'w',encoding='utf8').write(src.replace(a,b))
    r=subprocess.run(['npx','vitest','run','tests/feedback-voices.test.ts'],capture_output=True,text=True,timeout=600)
    out=r.stdout+r.stderr
    fails=[l.strip()[:150] for l in out.splitlines() if l.strip().startswith('×')]
    print(f'{name}: exit={r.returncode} failed={len(fails)}')
    for l in fails: print('   ',l)
shutil.copy(ORIG,F)
print('restored')
