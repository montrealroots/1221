#!/usr/bin/env bash
# Brief 21's runs gathered (from 2026-10-22), as brief 20's collect20.sh gathered its own: each f21- clone's final-runs/
# over the repository's, the judge's shared folder into final/, the journeys' outputs whole into journeys-final/, brief
# 20's journeys into b20-journeys/, the lives in one file.
set -u
S=/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad
B=/home/user/1221/docs/verification/genre-banking-2026-10-22/final-runs
for L in A ADVF ADVR B C D J UI APP JR1 JR2 JR3 JRC BJ1 BJ2 BJ3 M1 M2 M3 M4 MF; do
  C="$S/f21-$L/docs/verification/genre-banking-2026-10-22/final-runs"
  [ -d "$C" ] || { echo "no lane $L"; continue; }
  for d in runs advice final interface-final journeys14-final app; do [ -d "$C/$d" ] && mkdir -p "$B/$d" && cp -r "$C/$d/." "$B/$d/"; done
done
mkdir -p "$B/final" "$B/journeys-final" "$B/b20-journeys"
cp -r "$S/f21-final/." "$B/final/"
rm -f "$B"/journeys-final/*.json
cp -r "$S/f21-journeys/." "$B/journeys-final/"
rm -rf "${B:?}/b20-journeys/"*
cp -r "$S/f21-b20journeys/." "$B/b20-journeys/"
cat $(ls "$S"/f21-B-work/life-*.json "$S"/f21-C-work/life-*.json | sort -V) > "$B/runs/lives.jsonl"
echo "collected $(date -u +%T)"
