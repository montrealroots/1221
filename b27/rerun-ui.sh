#!/usr/bin/env bash
# Lanes A, UI and APP of brief 22's final runs played again on the commit that corrected the walks (4cba6159, its src
# 9f974984's), gathered over batch 2's.
set -u
S=/tmp/claude-0/-home-user-1221/93119f3d-c8d9-5356-8130-0e0fe32e5c95/scratchpad
Q=/home/user/1221/docs/verification/career-genre-2026-10-22/final-runs/runs
cd /home/user/1221
echo "rerun $(date -u +%T)"
S=$S P=f27c bash $Q/queue22.sh "$1" "A UI APP"
S=$S P=f27c bash $Q/collect22.sh
echo "ALL DONE $(date -u +%T)"
