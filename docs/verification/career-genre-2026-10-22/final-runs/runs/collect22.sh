#!/usr/bin/env bash
# Brief 22's runs gathered (from 2026-10-22), as brief 21's collect21.sh gathered its own: each f22- clone's final-runs/
# over the repository's, the judge's shared folder into final/, the journeys' outputs whole into journeys-final/, brief
# 20's journeys into b20-journeys/, the lives in one file.
# Usage: [P=<prefix>] collect22.sh. With P (after #54's merge: P=f22d, the runs lanes played again on the paydays fix),
# only that prefix's lanes are gathered, and the judge's outputs (final/), which those lanes don't make, are left as they
# are.
set -u
# The scratchpad is the session's own (from 2026-10-24, brief 26): until then brief 22's session's path was written here,
# and a later session ran the lanes in a folder it could not read back.
S="${S:-/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad}"
B=/home/user/1221/docs/verification/career-genre-2026-10-22/final-runs
if [ -n "${P:-}" ]; then
  # Only what each lane wrote, as its clone's git reads it changed or new: a clone of a later commit holds every lane's
  # earlier outputs as committed, and copied whole they'd put one lane's earlier results over another's new ones.
  for L in A ADVF ADVR B C D J UI APP JR1 JR2 JR3 JRC BJ1 BJ2 BJ3; do
    CL="$S/$P-$L"
    [ -d "$CL" ] || { echo "no lane $L"; continue; }
    git -C "$CL" -c core.quotePath=false status --porcelain --untracked-files=all -- docs/verification/career-genre-2026-10-22/final-runs \
      | grep -E '^( M|\?\?) ' | cut -c4- | grep -vE '\.(sh|py|before)$' \
      | while read -r f; do mkdir -p "/home/user/1221/$(dirname "$f")" && cp "$CL/$f" "/home/user/1221/$f"; done
    echo "lane $L: $(git -C "$CL" status --porcelain --untracked-files=all -- docs/verification/career-genre-2026-10-22/final-runs | grep -cE '^( M|\?\?) ') files"
  done
  # The shared folders only where this prefix's lanes made them: a prefix of some lanes alone (f22e, the advice lanes
  # played again) leaves the journeys and the lives as they are.
  [ -d "$S/$P-journeys" ] && [ -d "$S/$P-JR1" ] && { rm -f "$B"/journeys-final/*.json; cp -r "$S/$P-journeys/." "$B/journeys-final/"; }
  [ -d "$S/$P-b20journeys" ] && [ -d "$S/$P-BJ1" ] && { rm -rf "${B:?}/b20-journeys/"*; cp -r "$S/$P-b20journeys/." "$B/b20-journeys/"; }
  [ -d "$S/$P-B-work" ] && [ -d "$S/$P-C-work" ] && cat $(ls "$S/$P"-B-work/life-*.json "$S/$P"-C-work/life-*.json | sort -V) > "$B/runs/lives.jsonl"
  echo "collected $P $(date -u +%T)"; exit 0
fi
# Brief 20's journeys (BJ1 to BJ3) were played again on afe751f1, its src the tested commit's, once their coherence check
# read what each part asks (`tools/b20-journeys.ts`): those lanes' clones are f22b-, and their journeys f22b-b20journeys.
# Brief 13's journeys (JR1 to JR3, and JRC after them) were played again on 0ae97df3, also its src the tested commit's, once
# their check 3 read an unmet genre no known genre is linked to (`tools/journeys.ts`): clones f22c-, journeys f22c-journeys.
for L in A ADVF ADVR B C D J UI APP JR1 JR2 JR3 JRC BJ1 BJ2 BJ3 M1 M2 M3 M4 MF; do
  C="$S/f22-$L/docs/verification/career-genre-2026-10-22/final-runs"
  [ -d "$S/f22b-$L" ] && C="$S/f22b-$L/docs/verification/career-genre-2026-10-22/final-runs"
  [ -d "$S/f22c-$L" ] && C="$S/f22c-$L/docs/verification/career-genre-2026-10-22/final-runs"
  [ -d "$C" ] || { echo "no lane $L"; continue; }
  # The runs' outputs only: a clone's scripts are its commit's, and copied over the repository's they'd undo what was
  # changed since (on 2026-10-22 its older collect22.sh overwrote this one as it ran).
  for d in runs advice final interface-final journeys14-final app; do [ -d "$C/$d" ] && mkdir -p "$B/$d" && (cd "$C/$d" && tar cf - --exclude='*.sh' --exclude='*.py' .) | (cd "$B/$d" && tar xf -); done
done
mkdir -p "$B/final" "$B/journeys-final" "$B/b20-journeys"
cp -r "$S/f22-final/." "$B/final/"
rm -f "$B"/journeys-final/*.json
cp -r "$( [ -d "$S/f22c-journeys" ] && echo "$S/f22c-journeys" || echo "$S/f22-journeys")/." "$B/journeys-final/"
rm -rf "${B:?}/b20-journeys/"*
cp -r "$( [ -d "$S/f22b-b20journeys" ] && echo "$S/f22b-b20journeys" || echo "$S/f22-b20journeys")/." "$B/b20-journeys/"
cat $(ls "$S"/f22-B-work/life-*.json "$S"/f22-C-work/life-*.json | sort -V) > "$B/runs/lives.jsonl"
echo "collected $(date -u +%T)"
