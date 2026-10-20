# Applies one mutation (a claim taken out), runs the test file, and restores the source whatever happens.
import subprocess, sys, shutil
src, old, new, test, name = sys.argv[1:6]
orig = open(src).read()
assert orig.count(old) == 1, f'{name}: the text to mutate is there {orig.count(old)} times'
shutil.copy(src, src + '.mutbak')
try:
    open(src, 'w').write(orig.replace(old, new))
    r = subprocess.run(['npx', 'vitest', 'run', test], capture_output=True, text=True, timeout=1200)
    tail = '\n'.join((r.stdout + r.stderr).strip().splitlines()[-6:])
    print(f'MUTATION {name}: vitest exit={r.returncode} ({"failed, as it should" if r.returncode else "PASSED: the test does not hold the claim"})')
    print(tail)
finally:
    shutil.move(src + '.mutbak', src)
