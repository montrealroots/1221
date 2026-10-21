#!/usr/bin/env bash
# Brief 18's lanes: brief 17's final lanes on brief 18's tested commit, four at a time, each in its own clone. Usage: queue18.sh <commit> [lanes]
# JRC (the journeys' compare and summary) and MF (the judge's merge) run last, once their parts are done.
set -u
S=/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad
COMMIT="$1"
export JSTATE="$S/jr18-state" JOUT="$S/f18-journeys" MOUT="$S/f18-final"
mkdir -p "$JSTATE" "$JOUT" "$MOUT"
lane() {
  local L="$1" C="$S/f18-$1"
  [ -d "$C" ] || { git clone -q /home/user/1221 "$C" && git -C "$C" checkout -q "$COMMIT" && ln -s /home/user/1221/node_modules "$C/node_modules"; }
  bash "$S/runs18.sh" "$C" "$L" > "$S/f18-$L.out" 2>&1
  echo "lane $L done $(date -u +%T)"
}
export -f lane; export S COMMIT
# The lanes to run, all of them unless named (from 2026-10-20: the queue's shell was stopped at two hours, and the lanes
# not done were run again by name; each skips a step it already passed).
LANES="${2:-JR1 JR2 JR3 M1 M2 M3 M4 B C D A ADVF ADVR J UI}"
printf '%s\n' $LANES | xargs -P 4 -I{} bash -c 'lane {}'
lane JRC
lane MF
echo "QUEUE DONE $(date -u +%T)"
