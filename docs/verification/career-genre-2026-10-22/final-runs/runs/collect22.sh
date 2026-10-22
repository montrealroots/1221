#!/usr/bin/env bash
# Brief 22's runs gathered (from 2026-10-22), as brief 21's collect21.sh gathered its own: each f22- clone's final-runs/
# over the repository's, the judge's shared folder into final/, the journeys' outputs whole into journeys-final/, brief
# 20's journeys into b20-journeys/, the lives in one file.
set -u
S=/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad
B=/home/user/1221/docs/verification/career-genre-2026-10-22/final-runs
# Brief 20's journeys (BJ1 to BJ3) were played again on afe751f1, its src the tested commit's, once their coherence check
# read what each part asks (`tools/b20-journeys.ts`): those lanes' clones are f22b-, and their journeys f22b-b20journeys.
for L in A ADVF ADVR B C D J UI APP JR1 JR2 JR3 JRC BJ1 BJ2 BJ3 M1 M2 M3 M4 MF; do
  C="$S/f22-$L/docs/verification/career-genre-2026-10-22/final-runs"
  [ -d "$S/f22b-$L" ] && C="$S/f22b-$L/docs/verification/career-genre-2026-10-22/final-runs"
  [ -d "$C" ] || { echo "no lane $L"; continue; }
  # The runs' outputs only: a clone's scripts are its commit's, and copied over the repository's they'd undo what was
  # changed since (on 2026-10-22 its older collect22.sh overwrote this one as it ran).
  for d in runs advice final interface-final journeys14-final app; do [ -d "$C/$d" ] && mkdir -p "$B/$d" && (cd "$C/$d" && tar cf - --exclude='*.sh' --exclude='*.py' .) | (cd "$B/$d" && tar xf -); done
done
mkdir -p "$B/final" "$B/journeys-final" "$B/b20-journeys"
cp -r "$S/f22-final/." "$B/final/"
rm -f "$B"/journeys-final/*.json
cp -r "$S/f22-journeys/." "$B/journeys-final/"
rm -rf "${B:?}/b20-journeys/"*
cp -r "$( [ -d "$S/f22b-b20journeys" ] && echo "$S/f22b-b20journeys" || echo "$S/f22-b20journeys")/." "$B/b20-journeys/"
cat $(ls "$S"/f22-B-work/life-*.json "$S"/f22-C-work/life-*.json | sort -V) > "$B/runs/lives.jsonl"
echo "collected $(date -u +%T)"
