#!/usr/bin/env bash
# From fixoff-lanes17.sh's fo17- clones, as collect17.sh gathers the final lanes: each lane clone's runs and advice, the
# journeys' shared folder and the lives from lanes B and C, into fixoff/ beside the tested commit's records.
set -u
S=/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad
B=/home/user/1221/docs/verification/continuity-2026-10-20/fixoff
mkdir -p "$B/runs" "$B/advice" "$B/journeys-final"
for L in JR1 JR2 JR3 JRC B C D ADVF ADVR; do
  C="$S/fo17-$L/docs/verification/continuity-2026-10-20"
  [ -d "$C" ] || { echo "no lane $L"; continue; }
  for d in runs advice; do [ -d "$C/$d" ] && cp -r "$C/$d/." "$B/$d/"; done
done
cp -r "$S/fo17-journeys/." "$B/journeys-final/"
cat $(ls "$S"/fo17-B-work/life-*.json "$S"/fo17-C-work/life-*.json | sort -V) > "$B/runs/lives.jsonl"
# The scripts runs17.sh copies with the folder aren't this run's: only its outputs and exits are kept.
rm -f "$B/runs/"*.sh "$B/runs/figures.py"
echo "collected $(date -u +%T)"
