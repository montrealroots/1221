#!/usr/bin/env bash
# The advice lanes again, the tested commit's and the counterfactual's, with S3 reading the named standing line.
S=/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad
run() { bash "$S/runs17.sh" "$S/$1" "$2" > "$S/$1-again.out" 2>&1; echo "lane $1 done $(date -u +%T)"; }
export -f run; export S
printf '%s\n' "f17-ADVF ADVF" "f17-ADVR ADVR" "fo17-ADVF ADVF" "fo17-ADVR ADVR" | xargs -P 4 -L 1 bash -c 'run "$0" "$1"'
echo "ADVICE AGAIN DONE $(date -u +%T)"
