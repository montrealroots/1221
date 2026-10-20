#!/usr/bin/env bash
# The journeys played again, the tested commit's and the counterfactual's, into folders of their own, with the journeys tool
# as it is now: check 8 reading a revision after a warning, and a recheck that leaves the parts it didn't play. The first
# play's parts were lost to the recheck; its exits, logs, outputs and state are kept beside these, as *-first.
S=/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad
B=docs/verification/continuity-2026-10-20/runs
for V in f17 fo17; do for L in JR1 JR2 JR3 JRC; do
  C="$S/$V-$L"; cp /home/user/1221/tools/journeys.ts "$C/tools/journeys.ts"
  [ -f "$C/$B/exits-$L.txt" ] && mv "$C/$B/exits-$L.txt" "$S/$V-$L-exits-first.txt"
  [ -d "$C-work" ] && mv "$C-work" "$C-work-first"
done; done
variant() {
  local V="$1"; export JOUT="$S/$V-journeys-2" JSTATE="$S/$V-jr-state-2"; mkdir -p "$JOUT" "$JSTATE"
  printf '%s\n' JR1 JR2 JR3 | xargs -P 3 -I{} bash -c "nice -n 5 bash $S/runs17.sh $S/$V-{} {} > $S/$V-{}-again.out 2>&1; echo \"$V {} done \$(date -u +%T)\""
  nice -n 5 bash "$S/runs17.sh" "$S/$V-JRC" JRC > "$S/$V-JRC-again.out" 2>&1; echo "$V JRC done $(date -u +%T)"
}
export -f variant; export S
printf '%s\n' f17 fo17 | xargs -P 2 -I{} bash -c 'variant {}'
echo "JOURNEYS AGAIN DONE $(date -u +%T)"
