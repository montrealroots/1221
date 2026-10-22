#!/usr/bin/env bash
# Brief 20's runs gathered (from 2026-10-22), as brief 19's collect19c.sh gathered its own: each f20- clone's
# final-runs/ over the repository's, the journeys' outputs whole into journeys-final/, the lives in one file.
set -u
S=/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad
B=/home/user/1221/docs/verification/audit-2026-10-21/final-runs
for L in A ADVF ADVR B C D UI APP JR1 JR2 JR3 JRC BJ1 BJ2 BJ3; do
  C="$S/f20-$L/docs/verification/audit-2026-10-21/final-runs"
  [ -d "$C" ] || { echo "no lane $L"; continue; }
  for d in runs advice interface-final journeys14-final app; do [ -d "$C/$d" ] && mkdir -p "$B/$d" && cp -r "$C/$d/." "$B/$d/"; done
done
mkdir -p "$B/journeys-final"
rm -f "$B"/journeys-final/*.json
cp -r "$S/f20-journeys/." "$B/journeys-final/"
# Brief 20's journeys, whole, beside their first run (../journeys/), so the two can be set side by side.
mkdir -p "$B/b20-journeys"
rm -rf "${B:?}/b20-journeys/"*
cp -r "$S/f20-b20journeys/." "$B/b20-journeys/"
cat $(ls "$S"/f20-B-work/life-*.json "$S"/f20-C-work/life-*.json | sort -V) > "$B/runs/lives.jsonl"
echo "collected $(date -u +%T)"
