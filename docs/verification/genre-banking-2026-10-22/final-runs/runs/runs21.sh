#!/usr/bin/env bash
# Brief 21's runs on its tested commit (from 2026-10-22): brief 20's lanes (runs20.sh) into brief 21's folder, so every row
# whose measurement brief 21's changes left behind what it reads is measured again on the code as it is. Brief 21 changed
# the genre measure the judge and every evaluation path read (`relevantGenre`, `genreKnown` in briefs.ts, the School's
# genre part) and banking's interest, a US card's delinquency and due day, and standing orders, so the judge's rows (M1
# to MF), the acting area's (J), the engine's and the app's are all measured again.
# Each step's exit is recorded in runs/exits-<lane>.txt, and a step already passed is skipped when a lane is started again
# (the container restarts). Usage: runs21.sh <clone> <lane>
set -u
C="$1"; LANE="$2"
SCR="$C-work"
cd "$C" || exit 2
B=docs/verification/genre-banking-2026-10-22/final-runs
OUT=$B/runs
ADV=$B/advice
MEAS=$B/final
mkdir -p "$OUT" "$OUT/acceptance" "$OUT/saves" "$ADV" "$MEAS" "$SCR"
EX="$OUT/exits-$LANE.txt"
[ -f "$EX" ] || echo "at $(git rev-parse --short HEAD), $(git status --short --untracked-files=no | wc -l) tracked files uncommitted, $(date -u +%FT%TZ)" > "$EX"
# A record from another commit would skip steps that never ran on this one (2026-10-18, lanes A and UI on ebdb5577).
grep -q "^at $(git rev-parse --short HEAD)," "$EX" || { echo "$EX is from another commit: $(head -1 "$EX")" >&2; exit 3; }
done_() { grep -q "^$1 exit=0 " "$EX"; }
# The preview as vite itself, so its pid is the server's and kill stops it (npx's child outlived kill, 2026-10-18), and no
# browser step unless the page served is this clone's build.
preview() { local port="$1"; node node_modules/vite/bin/vite.js preview --port "$port" --strictPort > "$SCR/preview-$port.log" 2>&1 &
  PREVIEW=$!; sleep 6
  if kill -0 "$PREVIEW" 2>/dev/null && curl -sf "http://localhost:$port/" | cmp -s - dist/index.html; then log "preview-$port" 0 6 "this clone's dist/index.html served"; return 0; fi
  log "preview-$port" 1 6 "not this clone's build: $(head -c 200 "$SCR/preview-$port.log" | tr '\n' ' ')"; kill "$PREVIEW" 2>/dev/null; return 1; }
log() { echo "$1 exit=$2 secs=$3 cmd: ${*:4}" >> "$EX"; }
run() { local name="$1" lf="$2"; shift 2; done_ "$name" && return 0; local t0=$(date +%s); "$@" > "$lf" 2>&1; log "$name" $? $(( $(date +%s) - t0 )) "$@"; }
runj() { local name="$1" jf="$2"; shift 2; done_ "$name" && return 0; local t0=$(date +%s); "$@" > "$jf" 2> "$SCR/$name.err"; log "$name" $? $(( $(date +%s) - t0 )) "$@"; }
P=('new-york, attentive' 'mexico-city, attentive' 'london, early riser and curious, attentive' 'reykjavik, autopilot' 'new-york, practicing' 'pressure: scraping, the flu and an injury, attentive')
lives() { for i in "$@"; do for n in 0 1 2 3; do runj "life-p$i-lives-$n" "$SCR/life-p$i-lives-$n.json" npx vite-node tools/lives.ts -- --why --profile "${P[$i]}" --seed "lives-$n" --years 3.2; done; done; }
batches() { local from="$1" to="$2" step=10 a; for ((a = from; a <= to; a += step)); do echo "$a..$((a + step - 1))"; done; }
case "$LANE" in
  A)
    run build "$OUT/build.log" npm run build
    run saves "$OUT/saves.log" node tools/scenario-saves.mjs "$SCR/saves"
    cp "$SCR/saves/"*.log "$SCR/saves/exits.txt" "$OUT/saves/" 2>/dev/null
    if ! done_ acceptance-390; then
      preview 4219 || exit 4
      run acceptance-1440 "$OUT/acceptance/1440.log" env SLATE_BASE=http://localhost:4219 node tools/acceptance-ui.mjs "$SCR/acc-1440" 1440 "$SCR/saves"
      cp "$SCR/acc-1440/report.json" "$OUT/acceptance/1440-report.json" 2>/dev/null
      run acceptance-390 "$OUT/acceptance/390.log" env SLATE_BASE=http://localhost:4219 node tools/acceptance-ui.mjs "$SCR/acc-390" 390 "$SCR/saves"
      cp "$SCR/acc-390/report.json" "$OUT/acceptance/390-report.json" 2>/dev/null
      kill "$PREVIEW" 2>/dev/null
    fi ;;
  ADVF)
    # The fresh set, adv-v-0 to 119, run again on brief 13's tested commit: brief 12 ran it once, unseen, on ed24ff3b.
    for b in $(batches 0 119); do f="adv-v-${b/../-}"; run "fresh-$f" "$ADV/fresh-$f.log" npx vite-node tools/advice.ts -- --cases "adv-v-$b" --fresh --out "$ADV/fresh-$f.json"; done
    run fresh-summary "$ADV/fresh-summary.log" npx vite-node tools/advice.ts -- --summarize $(ls $ADV/fresh-adv-v-*.json | sort -V) --out "$ADV/fresh-summary.json" ;;
  ADVR)
    # F2-A's forty (adv-0 to 9 tuning, 10 to 39 held out) and the held-out set, regression coverage from brief 12.
    run f2a-adv-0-9 "$ADV/f2a-adv-0-9.log" npx vite-node tools/advice.ts -- --cases adv-0..9 --out "$ADV/f2a-adv-0-9.json"
    for b in 10..19 20..29 30..39; do f="adv-${b/../-}"; run "f2a-$f" "$ADV/f2a-$f.log" npx vite-node tools/advice.ts -- --cases "adv-$b" --held-out --out "$ADV/f2a-$f.json"; done
    for b in $(batches 0 119); do f="adv-h-${b/../-}"; run "regression-$f" "$ADV/regression-$f.log" npx vite-node tools/advice.ts -- --cases "adv-h-$b" --held-out --out "$ADV/regression-$f.json"; done
    run regression-summary "$ADV/regression-summary.log" npx vite-node tools/advice.ts -- --summarize $(ls $ADV/f2a-adv-*.json | sort -V) $(ls $ADV/regression-adv-h-*.json | sort -V) --out "$ADV/regression-summary.json"
    run tuning "$ADV/tuning.log" npx vite-node tools/advice.ts -- --cases tuning --out "$ADV/tuning-final.json" ;;
  B) lives 0 1 2
     runj variety "$OUT/variety-v-0.json" npx vite-node tools/variety.ts -- --seed v-0 --years 3 ;;
  C) lives 3 4 5
     run freshness "$OUT/freshness.log" npx vite-node tools/freshness.ts -- --months 4 --seeds fr-0,fr-1
     cp docs/verification/connected-journey/freshness.json "$OUT/freshness.json" && git checkout -- docs/verification/connected-journey ;;
  D)
    for w in "london lives-0 attentive" "london lives-1 attentive" "london lives-2 attentive" "london lives-3 attentive" "london lives-0 neglect" "mexico-city lives-0 attentive" "new-york lives-0 attentive" "scraping lives-0 attentive"; do
      set -- $w; run "workload-$1-$2-$3" "$SCR/workload-$1-$2-$3.log" npx vite-node tools/workload.ts -- --seed "$2" --profile "$1" --years 1.4 --policy "$3" --out "$OUT/workload-$1-$2-$3.json"; done
    for g in "musical m-0" "nordic_noir m-0" "nordic_noir m-1" "slapstick m-0" "social_realism m-0" "social_realism m-1"; do
      set -- $g; runj "plan-$1-$2" "$OUT/plan-$1-$2.json" npx vite-node tools/mastery.ts -- --mode plan --genre "$1" --seed "$2" --years 8; done ;;
  J)
    # The acting area's measurements (playthroughs-2026-10-17/acting-result.json): ST6-R2 as brief 12 measured it, and
    # brief 13's (c), (e) and the trace.
    run st6r2 "$MEAS/st6r2.log" npx vite-node tools/interpretation.ts -- --st6r2 "$MEAS/st6r2.json" --st6r2-only
    run st6r2-13-c "$MEAS/st6r2-13-c.log" npx vite-node tools/interpretation.ts -- --st6r2-13 "$MEAS/st6r2-13-c.json" --part c
    run st6r2-13-e "$MEAS/st6r2-13-e.log" npx vite-node tools/interpretation.ts -- --st6r2-13 "$MEAS/st6r2-13-e.json" --part e
    run st6r2-13-trace "$MEAS/st6r2-13-trace.log" npx vite-node tools/interpretation.ts -- --st6r2-13 "$MEAS/st6r2-13-trace.json" --part trace ;;
  UI)
    # The interface's three playthroughs at both widths (interface-result.json), on a build of the tested commit.
    U=$B/interface-final
    mkdir -p "$U" "$SCR/ui-saves"
    run ui-build "$U/build.log" npm run build
    run ui-save-workload "$U/save-workload.log" npx vite-node tools/scenarios.ts -- --scenario workload --seed sc-0 --save "$SCR/ui-saves/workload.json"
    run ui-save-specialist "$U/save-specialist.log" npx vite-node tools/scenarios.ts -- --scenario specialist --seed sc-0 --save "$SCR/ui-saves/specialist.json"
    preview 4217 || exit 4
    for p in normal setback specialist; do for w in 1440 390; do run "ui-$p-$w" "$U/$p-$w.log" env SLATE_BASE=http://localhost:4217 node tools/playthroughs-ui.mjs $p $w "$SCR/ui-saves" "$U"; done; done
    # Brief 14's three journeys (journeys/README.md), on the saves they open, into journeys14-final/ (brief 13's twenty-five go to journeys-final/).
    JF=$B/journeys14-final
    mkdir -p "$JF"
    for sc in roundups brief health; do run "ui-save-$sc" "$JF/save-$sc.log" npx vite-node tools/scenarios.ts -- --scenario $sc --seed sc-0 --save "$SCR/ui-saves/$sc.json"; done
    for p in banking document health; do for w in 1440 390; do run "ui-$p-$w" "$JF/$p-$w.log" env SLATE_BASE=http://localhost:4217 node tools/playthroughs-ui.mjs $p $w "$SCR/ui-saves" "$JF"; done; done
    kill "$PREVIEW" 2>/dev/null ;;
  JR1|JR2|JR3)
    # The journeys (journeys-result.json), each in its four parts, the state shared by the three lanes in one folder outside
    # the repository (a journey's own file each), the outputs to journeys-final/.
    J="${JOUT:?JOUT names the shared folder of the journeys}"; ST="${JSTATE:?JSTATE names the journeys state folder}"
    mkdir -p "$J" "$ST"
    case "$LANE" in JR1) IDS="J01 J02 J03 J04 J05 J06 J07 J08" ;; JR2) IDS="J09 J10 J11 J12 J13 J14 J15 J16" ;; JR3) IDS="J17 J18 J19 J20 J21 J22 J23 F1 F2" ;; esac
    for id in $IDS; do for n in 1 2 3 4; do run "$id-p$n" "$SCR/$id-p$n.log" npx vite-node tools/journeys.ts -- --journey $id --part $n --state "$ST" --out "$J/$id-p$n.json"; done; done ;;
  JRC)
    J="${JOUT:?JOUT names the shared folder of the journeys}"; ST="${JSTATE:?JSTATE names the journeys state folder}"
    run journeys-compare "$SCR/journeys-compare.log" npx vite-node tools/journeys.ts -- --compare "$ST" --out "$J/compare.json"
    run journeys-summarize "$SCR/journeys-summarize.log" npx vite-node tools/journeys.ts -- --summarize "$J"
    # Brief 20's own journeys (BJ1 to BJ3), their table once every part is done, and brief 19's four lives played again
    # (play.ts lives), each transcript then set beside the one brief 19 committed.
    BJ="${J20OUT:?J20OUT names the shared folder of the journeys of brief 20}"
    run b20-journeys-table "$BJ/table.log" npx vite-node tools/b20-journeys.ts -- --table "$BJ"
    run b19-lives "$BJ/b19-lives.log" npx vite-node docs/verification/career-2026-10-20/playthroughs/play.ts -- lives "$BJ/b19-lives"
    run b19-lives-diff "$BJ/b19-lives-diff.log" diff -r docs/verification/career-2026-10-20/playthroughs/transcripts "$BJ/b19-lives" ;;
  BJ1|BJ2|BJ3)
    # Brief 20's journeys (journeys/REPORT.md, "To Run It Again"): eight fixed-seed lives from creation into the career and
    # the seven older saves played on, each part after the one before, the state in one folder outside the repository.
    BJ="${J20OUT:?J20OUT names the shared folder of the journeys of brief 20}"; BST="${J20STATE:?J20STATE names its state folder}"
    mkdir -p "$BJ" "$BST"
    part() { run "$1-p$2" "$SCR/$1-p$2.log" npx vite-node tools/b20-journeys.ts -- "$3" "$1" --part "$2" --state "$BST" --out "$BJ"; }
    case "$LANE" in
      BJ1) for life in b20-1 b20-2 b20-3 b20-4; do for n in 1 2 3 4 5; do part $life $n --life; done; done ;;
      BJ2) for life in b20-5 b20-6 b20-8; do for n in 1 2 3 4 5; do part $life $n --life; done; done
           for n in 1 2 3 4 5 6 7 8; do part b20-7 $n --life; done ;;
      BJ3) part journey-j01-last-term-8283f80c 1 --older; part journey-j01-degree-8283f80c 1 --older
           for f in old-nonfiler-086d00ca old-state-plan-086d00ca; do for n in 1 2; do part $f $n --older; done; done
           for f in journey-j01-year-one-8283f80c old-tax-plan-ff837dfa old-leave-ff837dfa; do for n in 1 2 3; do part $f $n --older; done; done ;;
    esac ;;
  APP)
    # The built app at both widths (brief 20, section 5): the career's surfaces from one played life (brief 19's app walk
    # and its saves, from the School's last term through the showcase, representation, an audition, work and pay), and
    # the seven older saves opened, every destination pressed, the clock moved, saved and continued (older-walk.mjs).
    # Creation and the School's first weeks are the UI lane's (brief 13's playthroughs).
    W=$B/app
    mkdir -p "$W"
    run app-build "$W/build.log" npm run build
    run app-saves "$W/make-saves.log" npx vite-node docs/verification/career-2026-10-20/app/make-saves.ts -- "$SCR/app-saves"
    preview 4221 || exit 4
    for w in 1440 390; do run "app-walk-$w" "$W/walk-$w.log" env SLATE_BASE=http://localhost:4221 node docs/verification/career-2026-10-20/app/app-walk.mjs "$W/walk" $w "$SCR/app-saves"; done
    for w in 1440 390; do run "older-walk-$w" "$W/older-$w.log" env SLATE_BASE=http://localhost:4221 node docs/verification/audit-2026-10-21/app/older-walk.mjs "$W/older" $w; done
    # Brief 21's own saves (a card behind, Capital One's savings, a London standing order) and its walk at both widths:
    # the words brief 21 changed, read off the screens of this build.
    run b21-saves "$W/b21-make-saves.log" npx vite-node docs/verification/genre-banking-2026-10-22/app/make-saves.ts
    for w in 1440 390; do run "b21-walk-$w" "$W/b21-walk-$w.log" env SLATE_BASE=http://localhost:4221 node docs/verification/genre-banking-2026-10-22/app/walk.mjs "$W/b21" $w; done
    kill "$PREVIEW" 2>/dev/null ;;
  M1) for p in stage indirect genres-a; do bash docs/verification/decisions-2026-10-16/measure.sh "${MOUT:?MOUT names the shared folder of the judge parts}" $p; done ;;
  M2) for p in ag journeys-a genres-b; do bash docs/verification/decisions-2026-10-16/measure.sh "${MOUT:?MOUT names the shared folder of the judge parts}" $p; done ;;
  M3) for p in journeys-b mono-0 mono-1; do bash docs/verification/decisions-2026-10-16/measure.sh "${MOUT:?MOUT names the shared folder of the judge parts}" $p; done ;;
  M4) for p in mono-2 mono-3; do bash docs/verification/decisions-2026-10-16/measure.sh "${MOUT:?MOUT names the shared folder of the judge parts}" $p; done ;;
  MF) for p in mono-merge l3r; do bash docs/verification/decisions-2026-10-16/measure.sh "${MOUT:?MOUT names the shared folder of the judge parts}" $p; done ;;
  *) echo "no such lane: $LANE"; exit 2 ;;
esac
echo "DONE $(date -u +%FT%TZ)" >> "$EX"
