#!/usr/bin/env bash
# Brief 22's final runs on brief 27's final source, in two batches, each gathered and its clones deleted before the next,
# so the session's disk holds one batch's clones at a time.
set -u
S=/tmp/claude-0/-home-user-1221/93119f3d-c8d9-5356-8130-0e0fe32e5c95/scratchpad
C=$1
P=f27b
Q=/home/user/1221/docs/verification/career-genre-2026-10-22/final-runs/runs
cd /home/user/1221
echo "batch 1 $(date -u +%T)"
S=$S P=$P bash $Q/queue22.sh $C "JR1 JR2 JR3 M1 M2 M3 M4 BJ1 BJ2 BJ3"
S=$S P=$P bash $Q/collect22.sh
F=docs/verification/career-universe-2026-10-24/final-runs/final
rm -rf $F && mkdir -p $F && cp -r $S/$P-final/. $F/
echo "judge copied $(ls $F | wc -l) files $(date -u +%T)"
for L in JR1 JR2 JR3 JRC M1 M2 M3 M4 MF BJ1 BJ2 BJ3; do rm -rf "$S/$P-$L"; done
echo "batch 1 clones deleted; $(df -h / | tail -1)"
echo "batch 2 $(date -u +%T)"
S=$S P=$P bash $Q/queue22.sh $C "B C D J A ADVF ADVR UI APP"
S=$S P=$P bash $Q/collect22.sh
echo "ALL DONE $(date -u +%T)"
