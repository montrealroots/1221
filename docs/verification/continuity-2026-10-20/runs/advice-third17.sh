#!/usr/bin/env bash
# The advice's two lanes a third time, each in a clean clone of the commit that holds the harness fix (a683f9ea), whose
# game is ecd961cc's, so each file records that commit and a clean tree, as close.py asks.
S=/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad
COMMIT="$1"
run() { local L="$1" C="$S/f17x-$1"
  [ -d "$C" ] || { git clone -q /home/user/1221 "$C" && git -C "$C" checkout -q "$COMMIT" && ln -s /home/user/1221/node_modules "$C/node_modules"; }
  bash "$S/runs17.sh" "$C" "$L" > "$S/f17x-$L.out" 2>&1; echo "lane $L done $(date -u +%T)"; }
export -f run; export S COMMIT
printf '%s\n' ADVF ADVR | xargs -P 2 -I{} bash -c 'run {}'
echo "ADVICE THIRD DONE $(date -u +%T)"
