#!/usr/bin/env bash
# Brief 15's final lanes again, on the commit with the interface tools moved to the new words and the coursework warning
# shortened (queue15.sh ran them first on c3478f9e). Brief 15's final lanes (brief 14's again), four at a time, each in its own clone of the tested commit. Usage: queue15.sh <commit>
# JRC (the journeys' compare and summary) and MF (the judge's merge) run last, once their parts are done.
set -u
S=/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad
COMMIT="$1"
export JSTATE="$S/jr15b-state" JOUT="$S/f15b-journeys" MOUT="$S/f15b-final"
mkdir -p "$JSTATE" "$JOUT" "$MOUT"
lane() {
  local L="$1" C="$S/f15b-$1"
  [ -d "$C" ] || { git clone -q /home/user/1221 "$C" && git -C "$C" checkout -q "$COMMIT" && ln -s /home/user/1221/node_modules "$C/node_modules"; }
  bash "$S/runs15.sh" "$C" "$L" > "$S/f15b-$L.out" 2>&1
  echo "lane $L done $(date -u +%T)"
}
export -f lane; export S COMMIT
printf '%s\n' JR1 JR2 JR3 M1 M2 M3 M4 B C D A ADVF ADVR J UI | xargs -P 4 -I{} bash -c 'lane {}'
lane JRC
lane MF
echo "QUEUE DONE $(date -u +%T)"
