#!/usr/bin/env bash
# Brief 22's lanes on its tested commit (from 2026-10-22), as brief 21's queue21.sh ran them: each lane in a clone of the
# commit named f22-<lane>, four at a time, the journeys' parts sharing one state folder and one output folder outside the
# clones, the judge's parts (M1 to M4) one output folder; then JRC (the journeys' compare and summary, brief 20's journeys'
# table, and brief 19's lives played again) and MF (the judge's merge) once their parts are done.
# Usage: [P=<prefix>] queue22.sh <commit> ["<lanes>"]   (the second argument names lanes to run, for a queue the container
# stopped, or the lanes to play again on a later commit: after #54's merge, P=f22d and the runs lanes on the paydays fix)
# From that run a lane's clone shares the repository's objects (git clone --shared), 45 MB where a full one took 570.
set -u
S=/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad
COMMIT="$1"
P="${P:-f22}"
export JSTATE="$S/$P-jstate" JOUT="$S/$P-journeys" MOUT="$S/$P-final" J20STATE="$S/$P-b20state" J20OUT="$S/$P-b20journeys"
mkdir -p "$JSTATE" "$JOUT" "$MOUT" "$J20STATE" "$J20OUT"
lane() {
  local L="$1" C="$S/$P-$1"
  [ -d "$C" ] || { git clone -q --shared /home/user/1221 "$C" && git -C "$C" checkout -q "$COMMIT" && ln -s /home/user/1221/node_modules "$C/node_modules"; }
  bash "$C/docs/verification/career-genre-2026-10-22/final-runs/runs/runs22.sh" "$C" "$L" > "$S/$P-$L.out" 2>&1
  echo "lane $L done $(date -u +%T)"
}
export -f lane; export S COMMIT P
LANES="${2:-JR1 JR2 JR3 M1 M2 M3 M4 BJ1 BJ2 BJ3 B C D J A ADVF ADVR UI APP}"
printf '%s\n' $LANES | xargs -P 4 -I{} bash -c 'lane {}'
# The journeys' compare only where they ran, and the judge's merge only where its parts ran: until 2026-10-23 JRC ran after
# every queue, and after the advice lanes alone (f22e) it had no journeys of its own, and was set aside.
case " $LANES " in *" JR1 "*) lane JRC ;; esac
case " $LANES " in *" M1 "*) lane MF ;; esac
echo "QUEUE DONE $(date -u +%T)"
