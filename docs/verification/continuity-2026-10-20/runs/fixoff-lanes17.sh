#!/usr/bin/env bash
# The final lanes whose games have a class in them, run again with the incident fix taken out (fixoff17.sh's one line),
# each in its own clone of the tested commit, into folders of their own: the journeys (JR1 to JR3, then JRC), the lives
# (B, C), the workloads and the mastery plans (D), and the advice (ADVF, ADVR). The judge's lanes (M1 to MF, J) and the
# built app's (A, UI) aren't: the judge reads no classmate, and its outputs are brief 16's byte for byte. Then
# numbers-same.py can hold the words apart from the fix: brief 16's runs against these, every number the same, and these
# against the tested commit's, every difference the fix's. Started after queue17.sh, so the built app's lanes there run
# without this load. Usage: fixoff-lanes17.sh <commit>
set -u
S=/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad
COMMIT="$1"
export JSTATE="$S/fo17-jr-state" JOUT="$S/fo17-journeys" MOUT="$S/fo17-final"
mkdir -p "$JSTATE" "$JOUT" "$MOUT"
lane() {
  local L="$1" C="$S/fo17-$1"
  if [ ! -d "$C" ]; then
    git clone -q /home/user/1221 "$C" && git -C "$C" checkout -q "$COMMIT" && ln -s /home/user/1221/node_modules "$C/node_modules"
    python3 - "$C/src/engine/systems/classmates.ts" <<'PY' || exit 3
import sys
p = sys.argv[1]; s = open(p, encoding='utf-8').read()
new = "if (owed.length && !recent(mate, 'apology'))"
old = "if ((mateRecord(mate).stoodUp ?? 0) > (personOf(mate).moments ?? []).filter((m) => m.kind === 'apology').length && !recent(mate, 'apology'))"
if s.count(new) != 1: sys.exit(f'the condition is in {p} {s.count(new)} times, not once')
open(p, 'w', encoding='utf-8').write(s.replace(new, old))
PY
  fi
  bash "$S/runs17.sh" "$C" "$L" > "$S/fo17-$L.out" 2>&1
  echo "lane $L done $(date -u +%T)"
}
export -f lane; export S COMMIT
LANES="${2:-JR1 JR2 JR3 B C D ADVF ADVR}"
printf '%s\n' $LANES | xargs -P 4 -I{} bash -c 'lane {}'
lane JRC
echo "FIXOFF QUEUE DONE $(date -u +%T)"
