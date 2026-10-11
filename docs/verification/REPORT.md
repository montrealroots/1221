# Verification Results

Written by `node tools/verify-report.mjs` from `docs/verification/<suite>/results.jsonl`, which `node tools/verify.mjs <suite> --max N` appends to job by job. Every figure below is read from a result.

## Played Lives

Ran on 6470a2f4 (tree bc5d8f22, 0 dirty). Each plays a student from creation for 3.3 years through public commands (`tools/lives.ts`), saving and reopening every thirty days.

| Profile and seed | Policy | Dates | Outcome | Terms (standing, attendance %) | Pieces judged (mastery) | Fitness, first and last month | Condition at end | Breaches | Unbalanced | Reloads | Error |
|---|---|---|---|---|---|---|---|---|---|---|---|
| new-york, attentive / lives-0 | attentive | 2026-08-24 to 2029-12-11 | Graduated | good 100; good 100; good 100; good 100; good 100; good 100 | 160 (0) | 50 → 35 | 91 | 0 | 0 | 39 |  |
| new-york, attentive / lives-1 | attentive | 2026-08-24 to 2029-12-11 | Graduated | good 100; good 100; good 100; good 100; good 100; good 100 | 160 (0) | 50 → 35 | 91 | 0 | 0 | 39 |  |
| new-york, attentive / lives-2 | attentive | 2026-08-24 to 2029-12-11 | Graduated | good 100; good 100; good 100; good 100; good 100; good 100 | 160 (0) | 50 → 35 | 91 | 0 | 0 | 39 |  |
| mexico-city, attentive / lives-0 | attentive | 2026-08-24 to 2029-12-11 | Graduated | good 100; good 100; good 100; good 100; good 100; good 100 | 160 (0) | 50 → 35 | 91 | 0 | 0 | 39 |  |
| mexico-city, attentive / lives-1 | attentive | 2026-08-24 to 2029-12-11 | Graduated | good 100; good 100; good 100; good 100; good 100; good 100 | 160 (0) | 50 → 35 | 91 | 0 | 0 | 39 |  |
| mexico-city, attentive / lives-2 | attentive | 2026-08-24 to 2029-12-11 | Graduated | good 100; good 100; good 100; good 100; good 100; good 100 | 160 (0) | 50 → 35 | 91 | 0 | 0 | 39 |  |
| london, early riser and curious, attentive / lives-0 | attentive | 2026-08-24 to 2029-12-10 | Graduated | good 100; good 100; good 100; good 100; good 100; good 100 | 160 (0) | 50 → 35 | 91 | 0 | 0 | 39 |  |
| london, early riser and curious, attentive / lives-1 | attentive | 2026-08-24 to 2029-12-11 | Graduated | good 100; good 100; good 100; good 100; good 100; good 100 | 160 (0) | 50 → 35 | 91 | 0 | 0 | 39 |  |
| london, early riser and curious, attentive / lives-2 | attentive | 2026-08-24 to 2029-12-10 | Graduated | good 100; good 100; concern 100; good 100; good 100; good 100 | 160 (0) | 50 → 35 | 91 | 0 | 0 | 39 |  |
| reykjavik, autopilot / lives-0 | autopilot | 2026-08-24 to 2029-12-11 | dismissed | concern 100; warning 100; dismissed 100 | 160 (0) | 49.8 → 35 | 91 | 0 | 0 | 40 |  |
| reykjavik, autopilot / lives-1 | autopilot | 2026-08-24 to 2029-12-11 | dismissed | concern 100; warning 100; dismissed 100 | 160 (0) | 49.8 → 35 | 91 | 0 | 0 | 40 |  |
| reykjavik, autopilot / lives-2 | autopilot | 2026-08-24 to 2029-12-11 | dismissed | concern 100; warning 100; dismissed 100 | 160 (0) | 49.8 → 35 | 91 | 0 | 0 | 40 |  |
| new-york, practicing / lives-0 | practicing | 2026-08-24 to 2029-12-11 | Graduated | good 100; good 100; good 100; good 100; good 100; good 100 | 160 (0) | 50 → 35 | 91 | 0 | 0 | 39 |  |
| new-york, practicing / lives-1 | practicing | 2026-08-24 to 2029-12-11 | Graduated | good 100; good 100; good 100; good 100; good 100; good 100 | 160 (0) | 50 → 35 | 91 | 0 | 0 | 39 |  |
| new-york, practicing / lives-2 | practicing | 2026-08-24 to 2029-12-11 | Graduated | good 100; good 100; good 100; good 100; good 100; good 100 | 160 (0) | 50 → 35 | 91 | 0 | 0 | 39 |  |
| pressure: scraping, the flu and an injury, attentive / lives-0 | attentive | 2026-08-24 to 2029-12-11 | Graduated | good 100; good 100; good 100; good 100; good 100; good 100 | 160 (0) | 50 → 35 | 91 | 0 | 0 | 39 |  |
| pressure: scraping, the flu and an injury, attentive / lives-1 | attentive | 2026-08-24 to 2029-12-11 | Graduated | good 100; good 100; good 100; good 100; good 100; good 100 | 160 (0) | 50 → 35 | 91 | 0 | 0 | 39 |  |
| pressure: scraping, the flu and an injury, attentive / lives-2 | attentive | 2026-08-24 to 2029-12-11 | Graduated | good 100; good 100; good 100; good 100; good 100; good 100 | 160 (0) | 50 → 35 | 91 | 0 | 0 | 39 |  |

## Mastery Through The Commands

Ran on f899ecd7 (tree 8894a59c, 0 dirty). A student practices one ability or technique as far as the day allows (`tools/mastery.ts --mode single`), or a plan for a genre (`--mode plan`).

| Target | Start | End | Sessions to full | Calendar days | Full | Full after a reload | Refusals | Most refused by | Standing | Breaches | Unbalanced |
|---|---|---|---|---|---|---|---|---|---|---|---|
| emotionalDepth | 58 | 100 | 309 | 253 | Yes | Yes | 755 | sessions a day (374) | good | 0 | 0 |
| listening | 54.5 | 100 | 335 | 266 | Yes | Yes | 853 | sessions a day (472) | good | 0 | 0 |
| imagination | 50.2 | 100 | 357 | 277 | Yes | Yes | 929 | sessions a day (548) | good | 0 | 0 |
| focus | 54.6 | 100 | 337 | 267 | Yes | Yes | 859 | sessions a day (478) | good | 0 | 0 |
| memory | 49.1 | 100 | 367 | 282 | Yes | Yes | 969 | sessions a day (588) | good | 0 | 0 |
| adaptability | 56.1 | 100 | 332 | 264 | Yes | Yes | 831 | sessions a day (450) | good | 0 | 0 |
| vocal | 52.5 | 100 | 349 | 273 | Yes | Yes | 905 | sessions a day (524) | good | 0 | 0 |
| physical | 50.2 | 100 | 356 | 278 | Yes | Yes | 914 | sessions a day (533) | good | 0 | 0 |
| presence | 60.2 | 100 | 311 | 254 | Yes | Yes | 761 | sessions a day (380) | good | 0 | 0 |
| composure | 44.3 | 100 | 395 | 296 | Yes | Yes | 1073 | sessions a day (692) | good | 0 | 0 |
| discipline | 57.5 | 100 | 363 | 362 | Yes | Yes | 1723 | already practised today (1723) | good | 0 | 0 |
| stamina | 50 | 99.4 | 64 | 64 | Yes | Yes | 153 | one workout a day (153) | good | 0 | 0 |
| accents | 52.7 | 100 | 349 | 273 | Yes | Yes | 905 | sessions a day (524) | good | 0 | 0 |
| audition | 56.7 | 100 | 333 | 265 | Yes | Yes | 842 | sessions a day (461) | good | 0 | 0 |
| character | 51 | 100 | 351 | 274 | Yes | Yes | 911 | sessions a day (530) | good | 0 | 0 |
| classical | 56.6 | 100 | 333 | 265 | Yes | Yes | 842 | sessions a day (461) | good | 0 | 0 |
| clown | 54.8 | 100 | 344 | 272 | Yes | Yes | 875 | sessions a day (492) | good | 0 | 0 |
| coldReading | 59.9 | 100 | 313 | 255 | Yes | Yes | 767 | sessions a day (386) | good | 0 | 0 |
| comedy | 48.2 | 100 | 379 | 288 | Yes | Yes | 1015 | sessions a day (634) | good | 0 | 0 |
| dance | 51.6 | 100 | 362 | 281 | Yes | Yes | 944 | sessions a day (561) | good | 0 | 0 |
| improv | 56.1 | 100 | 332 | 264 | Yes | Yes | 831 | sessions a day (450) | good | 0 | 0 |
| intimacy | 55.8 | 100 | 333 | 265 | Yes | Yes | 842 | sessions a day (461) | good | 0 | 0 |
| screen | 52.5 | 100 | 356 | 276 | Yes | Yes | 923 | sessions a day (542) | good | 0 | 0 |
| scene | 52.9 | 100 | 341 | 269 | Yes | Yes | 871 | sessions a day (490) | good | 0 | 0 |
| script | 49.3 | 100 | 362 | 279 | Yes | Yes | 946 | sessions a day (565) | good | 0 | 0 |
| singing | 55.7 | 100 | 338 | 267 | Yes | Yes | 859 | sessions a day (478) | good | 0 | 0 |
| speech | 53.7 | 100 | 342 | 269 | Yes | Yes | 871 | sessions a day (490) | good | 0 | 0 |
| combat | 55.9 | 100 | 334 | 267 | Yes | Yes | 840 | sessions a day (457) | good | 0 | 0 |
| voiceover | 53.5 | 100 | 351 | 274 | Yes | Yes | 911 | sessions a day (530) | good | 0 | 0 |

**Plan, musical** (seed m-0): targets emotionalDepth, imagination, memory, focus, composure, discipline, screen, scene, singing, dance; every one full or mastered on 2029-11-18; graduated 2029-05-21 (graduated); the journey's mastered pieces {"scene":0,"written":0,"movement":0,"voice":0,"improvisation":0,"camera":3,"partnered":0,"performance":0,"clown":0,"song":0,"audition":0}; breaches 0, unbalanced 0.

| Target | Start | First session | Mastered | Full | End |
|---|---|---|---|---|---|
| emotionalDepth | 58 | 2027-05-08 | — | 2029-11-17 (268 sessions) | 100 |
| imagination | 50.2 | 2026-09-27 | — | 2029-11-18 (322 sessions) | 100 |
| memory | 49.1 | 2026-08-24 | — | 2029-11-17 (343 sessions) | 100 |
| focus | 54.6 | 2026-12-12 | — | 2029-11-17 (306 sessions) | 100 |
| composure | 44.3 | 2026-08-24 | — | 2029-11-18 (344 sessions) | 100 |
| discipline | 57.5 | — | — | 2027-09-03 (0 sessions) | 100 |
| screen | 52.5 | 2026-10-12 | 2029-05-08 (255 sessions) | 2029-11-18 (341 sessions) | 100 |
| scene | 52.9 | 2026-12-14 | 2029-05-07 (204 sessions) | — | 99.963 |
| singing | 55.7 | 2026-12-01 | 2029-05-09 (242 sessions) | 2029-11-18 (326 sessions) | 100 |
| dance | 51.6 | 2026-09-29 | 2029-05-07 (255 sessions) | 2029-11-17 (339 sessions) | 100 |

**Plan, drama** (seed m-1): targets emotionalDepth, imagination, memory, focus, composure, discipline, screen, scene; every one full or mastered on 2029-06-08; graduated 2029-05-21 (graduated); the journey's mastered pieces {"scene":0,"written":0,"movement":0,"voice":0,"improvisation":0,"camera":3,"partnered":0,"performance":0,"clown":0,"song":0,"audition":0}; breaches 0, unbalanced 0.

| Target | Start | First session | Mastered | Full | End |
|---|---|---|---|---|---|
| emotionalDepth | 54.5 | 2026-12-17 | — | 2029-06-08 (295 sessions) | 100 |
| imagination | 52.4 | 2026-11-01 | — | 2029-06-08 (309 sessions) | 100 |
| memory | 48.6 | 2026-08-24 | — | 2029-06-08 (343 sessions) | 100 |
| focus | 54 | 2026-11-12 | — | 2029-06-07 (306 sessions) | 100 |
| composure | 44.3 | 2026-08-24 | — | 2029-06-07 (349 sessions) | 100 |
| discipline | 57.5 | — | — | 2027-09-04 (0 sessions) | 100 |
| screen | 55.8 | 2026-11-15 | 2028-08-22 (245 sessions) | — | 99.99 |
| scene | 50.1 | 2026-10-09 | 2028-08-24 (237 sessions) | 2029-06-08 (316 sessions) | 100 |

## Fitness Through Look After Yourself

Ran on f899ecd7 (tree 8894a59c, 0 dirty). Each scenario works out on its schedule through `life.look_after` (`tools/fitness.ts`).

| Scenario | Born | Age at end | Start | End | Full | Full on day | Workouts done / days planned | Most refused by | Readiness at nine | Standing | Breaches | Unbalanced |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| none | 2001 | 25.9 | 50 | 35 | 99.3 | never | 0 / 0 |  | 93.5 | good | 0 | 0 |
| daily | 2001 | 25.9 | 50 | 99.3 | 99.3 | 110 | 203 / 238 | Not with a pulled muscle; it has N days yet to men (256) | 92.1 | good | 0 | 0 |
| three-a-week | 2001 | 25.9 | 50 | 99.3 | 99.3 | 148 | 104 / 104 |  | 93.7 | good | 0 | 0 |
| two-a-week | 2001 | 25.9 | 50 | 96.36 | 99.3 | never | 68 / 69 | Not with a sprained ankle; it has N day yet to men (9) | 94.2 | good | 0 | 0 |
| twice-daily | 2001 | 25.9 | 50 | 99.3 | 99.3 | 48 | 473 / 197 | You’re at Drama N: The Theatrical Event until N:N  (42) | 93.2 | good | 0 | 0 |
| injured | 2001 | 25.9 | 50 | 97.86 | 99.3 | 118 | 185 / 238 | Not with a pulled muscle; it has N days yet to men (304) | 92.4 | good | 0 | 0 |
| ill | 2001 | 25.9 | 50 | 99.3 | 99.3 | 89 | 220 / 239 | Not with a pulled muscle; it has N days yet to men (102) | 91.5 | good | 0 | 0 |
| return | 2001 | 26.3 | 50 | 99.2 | 99.2 | 110 | 194 / 297 | Not with a broken bone; it has N days yet to mend. (421) | 94.5 | good | 0 | 0 |
| daily | 2006 | 20.9 | 50 | 99.9 | 99.9 | 85 | 200 / 239 | Not with a pulled muscle; it has N days yet to men (225) | 92.3 | good | 0 | 0 |
| three-a-week | 2006 | 20.9 | 50 | 99.9 | 99.9 | 148 | 104 / 104 |  | 93.8 | good | 0 | 0 |
| daily | 1991 | 35.9 | 50 | 96.7 | 96.7 | 81 | 224 / 239 | Not with a pulled muscle; it has N days yet to men (103) | 91.3 | good | 0 | 0 |
| three-a-week | 1991 | 35.9 | 50 | 96.7 | 96.7 | 176 | 94 / 104 | Not with a pulled muscle; it has N days yet to men (69) | 93.4 | good | 0 | 0 |
| daily | 1981 | 45.9 | 50 | 90.16 | 91.6 | 77 | 205 / 183 | Not with a pulled muscle; it has N days yet to men (144) | 92.5 | good | 0 | 0 |
| three-a-week | 1981 | 45.9 | 50 | 91.6 | 91.6 | 194 | 85 / 95 | Not with a back strain; it has N days yet to mend. (133) | 93.4 | good | 0 | 0 |

## Illness And Injury On A Piece Of Work

Ran on f899ecd7 (tree 8894a59c, 0 dirty). The same piece shown healthy and under each condition (`tools/condition.ts`).

| Work | Variant | Shown | Status | Overall | Band | Dimensions | Below healthy, same day | Condition among the record’s top three limits | Class days attended | Abilities lower than healthy | Breaches | Unbalanced |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| movement-score | healthy | 2026-09-10 | done | 63 | working | execution 67.9, consistency 58.9, interpretation 64.9 | none | — | 8/8, 0 excused | none | 0 | 0 |
| movement-score | flu at the showing | 2026-09-10 | done | 54.8 | working | execution 58.1, consistency 49.7, interpretation 64.9 | execution −9.8, consistency −9.2 | — | 8/8, 0 excused | none | 0 | 0 |
| movement-score | flu, called in sick | 2026-09-16 | done | 64.3 | working | execution 64.1, consistency 64.1, interpretation 65.5 | another day | — | 9/12, 3 excused | none | 0 | 0 |
| movement-score | flu, recovering (over the day before) | 2026-09-10 | done | 63 | working | execution 67.9, consistency 58.9, interpretation 64.9 | none | — | 8/8, 0 excused | none | 0 | 0 |
| movement-score | flu, recovered (nine days before) | 2026-09-10 | done | 63 | working | execution 67.8, consistency 58.9, interpretation 64.9 | execution −0.1 | — | 8/8, 0 excused | none | 0 | 0 |
| movement-score | sprain at the showing | 2026-09-10 | done | 40.9 | unready | execution 41.8, consistency 34.3, interpretation 64.9 | execution −26.1, consistency −24.6 | execution: An Injury Still Mending (−26.1), consistency: An Injury Still Mending (−24.6) | 8/8, 0 excused | none | 0 | 0 |
| movement-score | sprain, called in sick | 2026-09-23 | done | 64 | working | execution 67.4, consistency 61.5, interpretation 63.9 | another day | — | 11/17, 6 excused | none | 0 | 0 |
| movement-score | back strain at the showing | 2026-09-10 | done | 40.9 | unready | execution 41.8, consistency 34.3, interpretation 64.9 | execution −26.1, consistency −24.6 | execution: An Injury Still Mending (−26.1), consistency: An Injury Still Mending (−24.6) | 8/8, 0 excused | none | 0 | 0 |
| movement-score | a deep cut at the showing | 2026-09-10 | done | 63 | working | execution 67.9, consistency 58.9, interpretation 64.9 | none | — | 8/8, 0 excused | none | 0 | 0 |
| movement-score | concussion at the showing | 2026-09-23 | done | 64 | working | execution 67.3, consistency 61.5, interpretation 63.9 | another day | — | 9/17, 8 excused | none | 0 | 0 |
| movement-score | sprain, recovered (nine days before) | 2026-09-10 | done | 63 | working | execution 67.9, consistency 58.9, interpretation 64.9 | none | — | 8/8, 0 excused | none | 0 | 0 |
| voice-sequence | healthy | 2026-09-11 | done | 62 | working | execution 61.7, consistency 61.9, interpretation 63.6 | none | — | 9/9, 0 excused | none | 0 | 0 |
| voice-sequence | flu at the showing | 2026-09-11 | done | 52.4 | working | execution 50.8, consistency 50.9, interpretation 63.6 | execution −10.9, consistency −11 | — | 9/9, 0 excused | none | 0 | 0 |
| voice-sequence | flu, called in sick | 2026-09-17 | done | 61 | working | execution 63.7, consistency 62.3, interpretation 57.3 | another day | — | 10/13, 3 excused | none | 0 | 0 |
| voice-sequence | flu, recovering (over the day before) | 2026-09-11 | done | 58.8 | working | execution 58.1, consistency 58.3, interpretation 63.6 | execution −3.6, consistency −3.6 | — | 9/9, 0 excused | none | 0 | 0 |
| voice-sequence | flu, recovered (nine days before) | 2026-09-11 | done | 58.9 | working | execution 58.1, consistency 58.3, interpretation 63.7 | execution −3.6, consistency −3.6 | — | 9/9, 0 excused | none | 0 | 0 |
| voice-sequence | sprain at the showing | 2026-09-11 | done | 62 | working | execution 61.7, consistency 61.9, interpretation 63.6 | none | — | 9/9, 0 excused | none | 0 | 0 |
| voice-sequence | sprain, called in sick | 2026-09-24 | done | 62.6 | working | execution 64.7, consistency 63.8, interpretation 59.6 | another day | — | 12/18, 6 excused | none | 0 | 0 |
| voice-sequence | back strain at the showing | 2026-09-11 | done | 62 | working | execution 61.7, consistency 61.9, interpretation 63.6 | none | — | 9/9, 0 excused | none | 0 | 0 |
| voice-sequence | a deep cut at the showing | 2026-09-11 | done | 62 | working | execution 61.7, consistency 61.9, interpretation 63.6 | none | — | 9/9, 0 excused | none | 0 | 0 |
| voice-sequence | concussion at the showing | 2026-09-24 | done | 62.5 | working | execution 64.7, consistency 63.8, interpretation 59.4 | another day | — | 10/18, 8 excused | none | 0 | 0 |
| voice-sequence | sprain, recovered (nine days before) | 2026-09-11 | done | 64 | working | execution 64, consistency 64.4, interpretation 63.7 | none | — | 9/9, 0 excused | none | 0 | 0 |
| fight-sequence | healthy | 2027-02-12 | done | 57.7 | working | execution 67.1, responsiveness 50.4, consistency 61.8, connection 55.7 | none | — | 24/24, 0 excused | none | 0 | 0 |
| fight-sequence | flu at the showing | 2027-02-12 | done | 53.1 | working | execution 56.7, responsiveness 50.4, consistency 52.8, connection 55.7 | execution −10.4, consistency −9 | — | 24/24, 0 excused | none | 0 | 0 |
| fight-sequence | flu, called in sick | 2027-02-26 | done | 60.1 | working | execution 72, responsiveness 53.9, consistency 57.8, connection 58.1 | another day | — | 29/32, 3 excused | none | 0 | 0 |
| fight-sequence | flu, recovering (over the day before) | 2027-02-12 | done | 57.7 | working | execution 67.1, responsiveness 50.4, consistency 61.8, connection 55.7 | none | — | 24/24, 0 excused | none | 0 | 0 |
| fight-sequence | flu, recovered (nine days before) | 2027-02-12 | done | 56 | working | execution 64.6, responsiveness 49.2, consistency 59.6, connection 54.5 | execution −2.5, responsiveness −1.2, consistency −2.2, connection −1.2 | — | 24/24, 0 excused | none | 0 | 0 |
| fight-sequence | sprain at the showing | 2027-02-12 | done | 42.3 | unready | execution 39.5, responsiveness 50.4, consistency 37.8, connection 55.7 | execution −27.6, consistency −24 | execution: An Injury Still Mending (−27.6), consistency: An Injury Still Mending (−24) | 24/24, 0 excused | none | 0 | 0 |
| fight-sequence | sprain, called in sick | 2027-02-26 | done | 60.1 | working | execution 72, responsiveness 53.9, consistency 57.8, connection 58 | another day | — | 28/32, 4 excused | none | 0 | 0 |
| fight-sequence | back strain at the showing | 2027-02-12 | done | 42.3 | unready | execution 39.5, responsiveness 50.4, consistency 37.8, connection 55.7 | execution −27.6, consistency −24 | execution: An Injury Still Mending (−27.6), consistency: An Injury Still Mending (−24) | 24/24, 0 excused | none | 0 | 0 |
| fight-sequence | a deep cut at the showing | 2027-02-12 | done | 57.7 | working | execution 67.1, responsiveness 50.4, consistency 61.8, connection 55.7 | none | — | 24/24, 0 excused | none | 0 | 0 |
| fight-sequence | concussion at the showing | 2027-02-26 | done | 60.1 | working | execution 72, responsiveness 53.8, consistency 57.8, connection 58 | another day | — | 26/32, 6 excused | none | 0 | 0 |
| fight-sequence | sprain, recovered (nine days before) | 2027-02-12 | done | 54.4 | working | execution 67.1, responsiveness 44.2, consistency 61.8, connection 49.3 | responsiveness −6.2, connection −6.4 | — | 24/24, 0 excused | none | 0 | 0 |

