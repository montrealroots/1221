#!/usr/bin/env bash
# b20-4 on brief 22's starting commit, before any fix: parts 1 to 3, part 4 stopped at 1 September 2029 (the save kept), then on to its end.
S=/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad
W=$S/b22-base-work
cd $S/b22-base || exit 2
echo "at $(git rev-parse --short HEAD), $(git status --short --untracked-files=no | wc -l) tracked files uncommitted, $(date -u +%FT%TZ)" > $W/exits.txt
for p in 1 2 3; do t0=$(date +%s); npx vite-node tools/b20-journeys.ts -- --life b20-4 --part $p --state $W/state --out $W/out > $W/p$p.log 2>&1; echo "p$p exit=$? secs=$(( $(date +%s) - t0 ))" >> $W/exits.txt; done
cp -r $W/state $W/state-2029-06-01
t0=$(date +%s); npx vite-node tools/b20-journeys.ts -- --life b20-4 --part 4 --to 2029-09-01 --state $W/state --out $W/out > $W/p4a.log 2>&1; echo "p4a exit=$? secs=$(( $(date +%s) - t0 ))" >> $W/exits.txt
cp -r $W/state $W/state-2029-09-01
t0=$(date +%s); npx vite-node tools/b20-journeys.ts -- --life b20-4 --part 4 --state $W/state --out $W/out > $W/p4.log 2>&1; echo "p4 exit=$? secs=$(( $(date +%s) - t0 ))" >> $W/exits.txt
echo done >> $W/exits.txt
