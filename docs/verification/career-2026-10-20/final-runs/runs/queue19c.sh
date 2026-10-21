#!/usr/bin/env bash
# Brief 19's lanes again on the parts' commit (from 2026-10-21, once the parts were written for an actor, an actress or either), queue19b.sh with f19c- clones: the lanes whose rows read the engine's or the app's whole source, in clones named f19c-. The judge's (M1 to M4, MF) and the acting area's (J) aren't run: nothing they read changed after 728b4972. Usage: queue19c.sh <commit>
# JRC (the journeys' compare and summary) and MF (the judge's merge) run last, once their parts are done.
set -u
S=/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad
COMMIT="$1"
export JSTATE="$S/jr19c-state" JOUT="$S/f19c-journeys" MOUT="$S/f19c-final"
mkdir -p "$JSTATE" "$JOUT" "$MOUT"
lane() {
  local L="$1" C="$S/f19c-$1"
  [ -d "$C" ] || { git clone -q /home/user/1221 "$C" && git -C "$C" checkout -q "$COMMIT" && ln -s /home/user/1221/node_modules "$C/node_modules"; }
  bash "$S/runs19b.sh" "$C" "$L" > "$S/f19c-$L.out" 2>&1
  echo "lane $L done $(date -u +%T)"
}
export -f lane; export S COMMIT
# Lanes by name (from 2026-10-21, when the container restarted at 12:31 UTC and stopped the queue with C, ADVR, UI, JRC
# and MF not done): each skips the steps it passed (runs19.sh). Usage: queue19.sh <commit> ["<lanes>"]
LANES="${2:-JR1 JR2 JR3 B C D A ADVF ADVR UI}"
printf '%s\n' $LANES | xargs -P 4 -I{} bash -c 'lane {}'
lane JRC
# MF (the judge merge) is not run: nothing the judge reads changed after 728b4972.
echo "QUEUE DONE $(date -u +%T)"
