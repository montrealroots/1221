#!/usr/bin/env bash
# Brief 20's lanes on its tested commit (from 2026-10-22), as brief 19's queue19c.sh ran them: each lane in a clone of the
# commit named f20-<lane>, four at a time, the journeys' parts sharing one state folder and one output folder outside the
# clones, then JRC (the journeys' compare and summary, brief 20's journeys' table, and brief 19's lives played again) once
# its parts are done. BJ1 to BJ3 are brief 20's own journeys; APP is the built app at both widths. The judge's lanes (M1 to MF) and the
# acting area's (J) are named only when the judge's files moved since brief 19 measured them.
# Usage: queue20.sh <commit> ["<lanes>"]   (the second argument names lanes to run, for a queue the container stopped)
# No run with brief 20's changes taken out is made: its starting point, 340ce7ae, has the source brief 19 measured (no file
# under src/engine changed after 63fe7391, none under src after ef2ab8b9), so brief 19's runs are that run.
set -u
S=/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad
COMMIT="$1"
P=f20
export JSTATE="$S/$P-jstate" JOUT="$S/$P-journeys" MOUT="$S/$P-final" J20STATE="$S/$P-b20state" J20OUT="$S/$P-b20journeys"
mkdir -p "$JSTATE" "$JOUT" "$MOUT" "$J20STATE" "$J20OUT"
lane() {
  local L="$1" C="$S/$P-$1"
  [ -d "$C" ] || { git clone -q /home/user/1221 "$C" && git -C "$C" checkout -q "$COMMIT" && ln -s /home/user/1221/node_modules "$C/node_modules"; }
  bash "$C/docs/verification/audit-2026-10-21/final-runs/runs/runs20.sh" "$C" "$L" > "$S/$P-$L.out" 2>&1
  echo "lane $L done $(date -u +%T)"
}
export -f lane; export S COMMIT P
LANES="${2:-JR1 JR2 JR3 BJ1 BJ2 BJ3 B C D A ADVF ADVR UI APP}"
printf '%s\n' $LANES | xargs -P 4 -I{} bash -c 'lane {}'
lane JRC
echo "QUEUE DONE $(date -u +%T)"
