#!/usr/bin/env bash
# Brief 19's runs again on the fictional agent's commit (from 2026-10-21, queue19c.sh, its f19c- clones): collect19.sh's
# gathering, from each clone's final-runs-b/ over the repository's final-runs/. The lanes run again replace their first
# run's outputs; the first run's exits go to runs/at-728b4972/ so the record of what ran there stays beside them. The
# judge's lanes (M1 to M4, MF) and the acting area's (J) weren't run again, and final/ and their exits are left as they are.
set -u
S=/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad
B=/home/user/1221/docs/verification/career-2026-10-20/final-runs
mkdir -p "$B/runs/at-728b4972"
for f in "$B"/runs/exits-{A,ADVF,ADVR,B,C,D,UI,JR1,JR2,JR3,JRC,F1-again}.txt; do
  [ -f "$f" ] && grep -q '^at 728b4972,' "$f" && git -C /home/user/1221 mv "$f" "$B/runs/at-728b4972/"
done
for L in A ADVF ADVR B C D UI JR1 JR2 JR3 JRC; do
  C="$S/f19c-$L/docs/verification/career-2026-10-20/final-runs-b"
  [ -d "$C" ] || { echo "no lane $L"; continue; }
  for d in runs advice interface-final journeys14-final; do [ -d "$C/$d" ] && mkdir -p "$B/$d" && cp -r "$C/$d/." "$B/$d/"; done
done
# The journeys' outputs replaced whole, so none of the first run's is left among them.
rm -f "$B"/journeys-final/*.json
cp -r "$S/f19c-journeys/." "$B/journeys-final/"
cat $(ls "$S"/f19c-B-work/life-*.json "$S"/f19c-C-work/life-*.json | sort -V) > "$B/runs/lives.jsonl"
echo "collected $(date -u +%T)"
