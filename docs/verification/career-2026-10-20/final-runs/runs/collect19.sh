#!/usr/bin/env bash
# From brief 19's runs (queue19.sh), their f19- clones. Gathers brief 19's lanes (brief 17's collect17.sh) into the repository's record: each lane clone's outputs, the judge's shared folder
# (final/), the journeys' (journeys-final/), the lives from lanes B and C (runs/lives.jsonl), and the final walk.
set -u
S=/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad
B=/home/user/1221/docs/verification/career-2026-10-20/final-runs
for L in A ADVF ADVR B C D J UI JR1 JR2 JR3 JRC M1 M2 M3 M4 MF; do
  C="$S/f19-$L/docs/verification/career-2026-10-20/final-runs"
  [ -d "$C" ] || { echo "no lane $L"; continue; }
  for d in runs advice final interface-final journeys14-final; do [ -d "$C/$d" ] && mkdir -p "$B/$d" && cp -r "$C/$d/." "$B/$d/"; done
done
mkdir -p "$B/final" "$B/journeys-final"
cp -r "$S/f19-final/." "$B/final/"
cp -r "$S/f19-journeys/." "$B/journeys-final/"
cat $(ls "$S"/f19-B-work/life-*.json "$S"/f19-C-work/life-*.json | sort -V) > "$B/runs/lives.jsonl"
echo "collected $(date -u +%T)"
