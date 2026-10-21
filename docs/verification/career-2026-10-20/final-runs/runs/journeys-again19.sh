#!/usr/bin/env bash
# The journeys played again on the tested commit's game (728b4972) with the journeys tool as it is now: check 2 reading
# each piece's own record where two of one title are shown at one moment (the Actor Showcase's two scenes), into folders
# of their own. The first play's exits are kept beside these as *-exits-first.txt, and its state and work folders as
# *-first. Brief 17's journeys-again17.sh, for brief 19's lanes. Usage: journeys-again19.sh
S=/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad
B=docs/verification/career-2026-10-20/final-runs/runs
for L in JR1 JR2 JR3 JRC; do
  C="$S/f19-$L"
  if [ ! -d "$C" ]; then git clone -q /home/user/1221 "$C" && git -C "$C" checkout -q 728b4972 && ln -s /home/user/1221/node_modules "$C/node_modules"; fi
  cp /home/user/1221/tools/journeys.ts "$C/tools/journeys.ts"
  [ -f "$C/$B/exits-$L.txt" ] && mv "$C/$B/exits-$L.txt" "$S/f19-$L-exits-first.txt"
  [ -d "$C-work" ] && mv "$C-work" "$C-work-first"
done
export JOUT="$S/f19-journeys-2" JSTATE="$S/jr19-state-2"; mkdir -p "$JOUT" "$JSTATE"
printf '%s\n' JR1 JR2 JR3 | xargs -P 3 -I{} bash -c "bash $S/runs19.sh $S/f19-{} {} > $S/f19-{}-again.out 2>&1; echo \"{} done \$(date -u +%T)\""
bash "$S/runs19.sh" "$S/f19-JRC" JRC > "$S/f19-JRC-again.out" 2>&1; echo "JRC done $(date -u +%T)"
echo "JOURNEYS AGAIN DONE $(date -u +%T)"
