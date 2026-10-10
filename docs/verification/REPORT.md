# Verification Results

Written by `node tools/verify-report.mjs` from `docs/verification/<suite>/results.jsonl`, which `node tools/verify.mjs <suite> --max N` appends to job by job. Every figure below is read from a result.

## Played Lives

Ran on e7a4b3b4 (tree 5aff35ab, 0 dirty). Each plays a student from creation for 3.3 years through public commands (`tools/lives.ts`), saving and reopening every thirty days.

| Profile and seed | Policy | Dates | Outcome | Terms (standing, attendance %) | Pieces judged (mastery) | Fitness, first and last month | Condition at end | Breaches | Unbalanced | Reloads | Error |
|---|---|---|---|---|---|---|---|---|---|---|---|
| new-york, attentive / lives-0 | attentive | 2026-08-24 to 2029-12-11 | Graduated | good 100; good 100; good 100; good 100; good 100; good 100 | 160 (0) | 50 → 35 | 91 | 0 | 0 | 39 |  |
| new-york, attentive / lives-1 | attentive | 2026-08-24 to 2029-12-11 | Graduated | good 100; good 100; good 100; good 100; good 100; good 100 | 160 (0) | 50 → 35 | 91 | 0 | 0 | 39 |  |
| new-york, attentive / lives-2 | attentive | 2026-08-24 to 2029-12-11 | Graduated | good 100; good 100; good 100; good 100; good 100; good 100 | 160 (0) | 50 → 35 | 91 | 0 | 0 | 39 |  |
| mexico-city, attentive / lives-0 | attentive | 2026-08-24 to 2029-12-11 | Graduated | good 100; good 100; good 100; good 100; good 100; good 100 | 160 (0) | 50 → 35 | 91 | 0 | 0 | 39 |  |
| mexico-city, attentive / lives-1 | attentive | 2026-08-24 to 2029-12-11 | Graduated | good 100; good 100; good 100; good 100; good 100; good 100 | 160 (0) | 50 → 35 | 91 | 0 | 0 | 39 |  |
| mexico-city, attentive / lives-2 | attentive | 2026-08-24 to 2029-12-11 | Graduated | good 100; good 100; good 100; good 100; good 100; good 100 | 160 (0) | 50 → 35 | 91 | 0 | 0 | 39 |  |
| london, early riser and curious, attentive / lives-0 | attentive | 2026-08-24 to 2029-12-11 | Graduated | good 100; good 100; concern 100; good 100; good 100; good 100 | 160 (0) | 50 → 35 | 91 | 0 | 0 | 39 |  |
| london, early riser and curious, attentive / lives-1 | attentive | 2026-08-24 to 2029-12-11 | Graduated | good 100; good 100; good 100; good 100; good 100; good 100 | 160 (0) | 50 → 35 | 91 | 0 | 0 | 39 |  |
| london, early riser and curious, attentive / lives-2 | attentive | 2026-08-24 to 2029-12-10 | Graduated | good 100; good 100; good 100; good 100; good 100; good 100 | 160 (0) | 50 → 35 | 91 | 0 | 0 | 39 |  |
| reykjavik, autopilot / lives-0 | autopilot | 2026-08-24 to 2029-12-11 | dismissed | concern 100; warning 100; dismissed 100 | 160 (0) | 49.8 → 35 | 91 | 0 | 0 | 40 |  |
| reykjavik, autopilot / lives-1 | autopilot | 2026-08-24 to 2029-12-11 | dismissed | concern 100; warning 100; dismissed 100 | 160 (0) | 49.8 → 35 | 91 | 0 | 0 | 40 |  |
| reykjavik, autopilot / lives-2 | autopilot | 2026-08-24 to 2029-12-11 | dismissed | concern 100; warning 100; dismissed 100 | 160 (0) | 49.8 → 35 | 91 | 0 | 0 | 40 |  |
| new-york, practicing / lives-0 | practicing | 2026-08-24 to 2029-12-10 | Graduated | good 100; good 100; good 100; good 100; good 100; good 100 | 160 (0) | 50 → 35 | 91 | 0 | 0 | 39 |  |
| new-york, practicing / lives-1 | practicing | 2026-08-24 to 2029-12-11 | Graduated | good 100; good 100; good 100; good 100; good 100; good 100 | 160 (0) | 50 → 35 | 91 | 0 | 0 | 39 |  |
| new-york, practicing / lives-2 | practicing | 2026-08-24 to 2029-12-11 | Graduated | good 100; good 100; good 100; good 100; good 100; good 100 | 160 (0) | 50 → 35 | 91 | 0 | 0 | 39 |  |
| pressure: scraping, the flu and an injury, attentive / lives-0 | attentive | 2026-08-24 to 2029-12-11 | Graduated | good 100; good 100; concern 100; good 100; good 100; good 100 | 160 (0) | 50 → 35 | 91 | 0 | 0 | 39 |  |
| pressure: scraping, the flu and an injury, attentive / lives-1 | attentive | 2026-08-24 to 2029-12-11 | Graduated | good 100; good 100; good 100; good 100; good 100; good 100 | 160 (0) | 50 → 35 | 91 | 0 | 0 | 39 |  |
| pressure: scraping, the flu and an injury, attentive / lives-2 | attentive | 2026-08-24 to 2029-12-11 | Graduated | good 100; good 100; good 100; good 100; good 100; good 100 | 160 (0) | 50 → 35 | 91 | 0 | 0 | 39 |  |

## Mastery Through The Commands

Ran on e31dbffc (tree 139ef86d, 0 dirty). A student practices one ability or technique as far as the day allows (`tools/mastery.ts --mode single`), or a plan for a genre (`--mode plan`).

| Target | Start | End | Sessions to full | Calendar days | Full | Full after a reload | Refusals | Most refused by | Standing | Breaches | Unbalanced |
|---|---|---|---|---|---|---|---|---|---|---|---|
| emotionalDepth | 58 | 100 | 314 | 252 | Yes | Yes | 770 | sessions a day (409) | good | 0 | 0 |
| listening | 54.5 | 100 | 340 | 265 | Yes | Yes | 863 | sessions a day (502) | good | 0 | 0 |
| imagination | 50.2 | 100 | 361 | 275 | Yes | Yes | 938 | sessions a day (577) | good | 0 | 0 |
| focus | 54.6 | 100 | 340 | 265 | Yes | Yes | 863 | sessions a day (502) | good | 0 | 0 |
| memory | 49.1 | 100 | 370 | 280 | Yes | Yes | 978 | sessions a day (617) | good | 0 | 0 |
| adaptability | 56.1 | 100 | 336 | 263 | Yes | Yes | 846 | sessions a day (485) | good | 0 | 0 |
| vocal | 52.5 | 100 | 352 | 271 | Yes | Yes | 904 | sessions a day (543) | good | 0 | 0 |
| physical | 50.2 | 100 | 361 | 276 | Yes | Yes | 921 | sessions a day (561) | good | 0 | 0 |
| presence | 60.2 | 100 | 314 | 252 | Yes | Yes | 770 | sessions a day (409) | good | 0 | 0 |
| composure | 44.3 | 100 | 398 | 294 | Yes | Yes | 1082 | sessions a day (721) | good | 0 | 0 |
| discipline | 57.5 | 100 | 363 | 362 | Yes | Yes | 1751 | already practised today (1751) | good | 0 | 0 |
| stamina | 50 | 99.4 | 64 | 64 | Yes | Yes | 152 | one workout a day (144) | good | 0 | 0 |
| accents | 52.7 | 100 | 352 | 271 | Yes | Yes | 904 | sessions a day (543) | good | 0 | 0 |
| audition | 56.7 | 100 | 336 | 263 | Yes | Yes | 846 | sessions a day (485) | good | 0 | 0 |
| character | 51 | 100 | 355 | 272 | Yes | Yes | 915 | sessions a day (554) | good | 0 | 0 |
| classical | 56.6 | 100 | 336 | 263 | Yes | Yes | 846 | sessions a day (485) | good | 0 | 0 |
| clown | 54.8 | 100 | 348 | 269 | Yes | Yes | 868 | sessions a day (509) | good | 0 | 0 |
| coldReading | 59.9 | 100 | 316 | 253 | Yes | Yes | 776 | sessions a day (415) | good | 0 | 0 |
| comedy | 48.2 | 100 | 382 | 286 | Yes | Yes | 1019 | sessions a day (658) | good | 0 | 0 |
| dance | 51.6 | 100 | 366 | 278 | Yes | Yes | 932 | sessions a day (573) | good | 0 | 0 |
| improv | 56.1 | 100 | 336 | 263 | Yes | Yes | 846 | sessions a day (485) | good | 0 | 0 |
| intimacy | 55.8 | 100 | 337 | 263 | Yes | Yes | 846 | sessions a day (485) | good | 0 | 0 |
| screen | 52.5 | 100 | 360 | 275 | Yes | Yes | 938 | sessions a day (577) | good | 0 | 0 |
| scene | 52.9 | 100 | 344 | 267 | Yes | Yes | 880 | sessions a day (519) | good | 0 | 0 |
| script | 49.3 | 100 | 366 | 278 | Yes | Yes | 956 | sessions a day (595) | good | 0 | 0 |
| singing | 55.7 | 100 | 342 | 266 | Yes | Yes | 874 | sessions a day (513) | good | 0 | 0 |
| speech | 53.7 | 100 | 346 | 268 | Yes | Yes | 886 | sessions a day (525) | good | 0 | 0 |
| combat | 55.9 | 100 | 338 | 264 | Yes | Yes | 828 | sessions a day (469) | good | 0 | 0 |
| voiceover | 53.5 | 100 | 354 | 272 | Yes | Yes | 915 | sessions a day (554) | good | 0 | 0 |

**Plan, musical** (seed m-0): targets emotionalDepth, imagination, memory, focus, composure, discipline, screen, scene, singing, dance; every one full or mastered on 2029-11-14; graduated 2029-05-28 (graduated); the journey's mastered pieces {"scene":0,"written":0,"movement":0,"voice":0,"improvisation":0,"camera":3,"partnered":0,"performance":0,"clown":0,"song":0,"audition":0}; breaches 0, unbalanced 0.

| Target | Start | First session | Mastered | Full | End |
|---|---|---|---|---|---|
| emotionalDepth | 58 | 2027-05-01 | — | 2029-11-13 (264 sessions) | 100 |
| imagination | 50.2 | 2026-09-26 | — | 2029-11-13 (326 sessions) | 100 |
| memory | 49.1 | 2026-08-24 | — | 2029-11-13 (344 sessions) | 100 |
| focus | 54.6 | 2026-12-09 | — | 2029-11-12 (309 sessions) | 100 |
| composure | 44.3 | 2026-08-24 | — | 2029-11-14 (348 sessions) | 100 |
| discipline | 57.5 | — | — | 2027-09-02 (0 sessions) | 100 |
| screen | 52.5 | 2026-10-10 | 2029-05-04 (257 sessions) | 2029-11-12 (341 sessions) | 100 |
| scene | 52.9 | 2026-12-09 | 2029-05-03 (208 sessions) | 2029-11-13 (296 sessions) | 100 |
| singing | 55.7 | 2026-12-01 | 2029-05-04 (239 sessions) | 2029-11-12 (326 sessions) | 100 |
| dance | 51.6 | 2026-09-28 | 2029-05-03 (256 sessions) | — | 99.99 |

**Plan, drama** (seed m-1): targets emotionalDepth, imagination, memory, focus, composure, discipline, screen, scene; every one full or mastered on 2029-06-06; graduated 2029-05-28 (graduated); the journey's mastered pieces {"scene":0,"written":0,"movement":0,"voice":0,"improvisation":0,"camera":3,"partnered":0,"performance":0,"clown":0,"song":0,"audition":0}; breaches 0, unbalanced 0.

| Target | Start | First session | Mastered | Full | End |
|---|---|---|---|---|---|
| emotionalDepth | 54.5 | 2026-12-13 | — | 2029-06-05 (301 sessions) | 100 |
| imagination | 52.4 | 2026-10-30 | — | 2029-06-05 (310 sessions) | 100 |
| memory | 48.6 | 2026-08-24 | — | 2029-06-06 (346 sessions) | 100 |
| focus | 54 | 2026-11-10 | — | 2029-06-06 (311 sessions) | 100 |
| composure | 44.3 | 2026-08-24 | — | 2029-06-06 (350 sessions) | 100 |
| discipline | 57.5 | — | — | 2027-09-02 (0 sessions) | 100 |
| screen | 55.8 | 2026-11-12 | 2028-08-21 (242 sessions) | 2029-06-05 (320 sessions) | 100 |
| scene | 50.1 | 2026-10-09 | 2028-08-22 (238 sessions) | — | 99.987 |

## Fitness Through Look After Yourself

Ran on e31dbffc (tree 139ef86d, 0 dirty). Each scenario works out on its schedule through `life.look_after` (`tools/fitness.ts`).

| Scenario | Born | Age at end | Start | End | Full | Full on day | Workouts done / days planned | Most refused by | Readiness at nine | Standing | Breaches | Unbalanced |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| none | 2001 | 25.9 | 50 | 35 | 99.3 | never | 0 / 0 |  | 93.6 | good | 0 | 0 |
| daily | 2001 | 25.9 | 50 | 99.3 | 99.3 | 84 | 196 / 239 | Not with a pulled muscle; it has N days yet to men (227) | 92.3 | good | 0 | 0 |
| three-a-week | 2001 | 25.9 | 50 | 99.3 | 99.3 | 178 | 95 / 104 | Not with a pulled muscle; it has N days yet to men (73) | 93.9 | good | 0 | 0 |
| two-a-week | 2001 | 25.9 | 50 | 97.69 | 99.3 | never | 69 / 69 |  | 94.2 | good | 0 | 0 |
| twice-daily | 2001 | 25.9 | 50 | 99.3 | 99.3 | 46 | 428 / 205 | Not with a pulled muscle; it has N days yet to men (139) | 93.5 | good | 0 | 0 |
| injured | 2001 | 25.9 | 50 | 99.3 | 99.3 | 137 | 172 / 240 | Not with a pulled muscle; it has N days yet to men (361) | 92.6 | good | 0 | 0 |
| ill | 2001 | 25.9 | 50 | 99.3 | 99.3 | 90 | 219 / 239 | Not with a pulled muscle; it has N days yet to men (107) | 91.6 | good | 0 | 0 |
| return | 2001 | 26.3 | 50 | 99.2 | 99.2 | 84 | 234 / 297 | Not with a pulled muscle; it has N days yet to men (361) | 94.2 | good | 0 | 0 |
| daily | 2006 | 20.9 | 50 | 99.9 | 99.9 | 107 | 206 / 239 | Not with a pulled muscle; it has N days yet to men (238) | 92.3 | good | 0 | 0 |
| three-a-week | 2006 | 20.9 | 50 | 99.9 | 99.9 | 148 | 104 / 104 |  | 93.9 | good | 0 | 0 |
| daily | 1991 | 35.9 | 50 | 96.7 | 96.7 | 81 | 213 / 238 | Not with a pulled muscle; it has N days yet to men (107) | 91.6 | good | 0 | 0 |
| three-a-week | 1991 | 35.9 | 50 | 96.7 | 96.7 | 171 | 95 / 104 | Not with a pulled muscle; it has N days yet to men (74) | 93.5 | good | 0 | 0 |
| daily | 1981 | 45.9 | 50 | 91.6 | 91.6 | 76 | 218 / 182 | Not with a pulled muscle; it has N days yet to men (95) | 92.3 | good | 0 | 0 |
| three-a-week | 1981 | 45.9 | 50 | 91.6 | 91.6 | 124 | 101 / 95 | Not with a sprained ankle; it has N days yet to me (13) | 93.2 | good | 0 | 0 |

## Illness And Injury On A Piece Of Work

Ran on e31dbffc (tree 139ef86d, 0 dirty). The same piece shown healthy and under each condition (`tools/condition.ts`).

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
| voice-sequence | healthy | 2026-09-11 | done | 62.3 | working | execution 62, consistency 62.3, interpretation 63.7 | none | — | 9/9, 0 excused | none | 0 | 0 |
| voice-sequence | flu at the showing | 2026-09-11 | done | 52.8 | working | execution 51.2, consistency 51.2, interpretation 63.7 | execution −10.8, consistency −11.1 | — | 9/9, 0 excused | none | 0 | 0 |
| voice-sequence | flu, called in sick | 2026-09-17 | done | 61 | working | execution 63.7, consistency 62.3, interpretation 57.3 | another day | — | 10/13, 3 excused | none | 0 | 0 |
| voice-sequence | flu, recovering (over the day before) | 2026-09-11 | done | 60.7 | working | execution 60.2, consistency 60.5, interpretation 63.6 | execution −1.8, consistency −1.8, interpretation −0.1 | — | 9/9, 0 excused | none | 0 | 0 |
| voice-sequence | flu, recovered (nine days before) | 2026-09-11 | done | 58.9 | working | execution 58.1, consistency 58.4, interpretation 63.6 | execution −3.9, consistency −3.9, interpretation −0.1 | — | 9/9, 0 excused | none | 0 | 0 |
| voice-sequence | sprain at the showing | 2026-09-11 | done | 62.3 | working | execution 62, consistency 62.3, interpretation 63.7 | none | — | 9/9, 0 excused | none | 0 | 0 |
| voice-sequence | sprain, called in sick | 2026-09-24 | done | 62.6 | working | execution 64.7, consistency 63.8, interpretation 59.7 | another day | — | 12/18, 6 excused | none | 0 | 0 |
| voice-sequence | back strain at the showing | 2026-09-11 | done | 62.3 | working | execution 62, consistency 62.3, interpretation 63.7 | none | — | 9/9, 0 excused | none | 0 | 0 |
| voice-sequence | a deep cut at the showing | 2026-09-11 | done | 62.3 | working | execution 62, consistency 62.3, interpretation 63.7 | none | — | 9/9, 0 excused | none | 0 | 0 |
| voice-sequence | concussion at the showing | 2026-09-24 | done | 62.5 | working | execution 64.7, consistency 63.8, interpretation 59.5 | another day | — | 10/18, 8 excused | none | 0 | 0 |
| voice-sequence | sprain, recovered (nine days before) | 2026-09-11 | done | 61.9 | working | execution 61.6, consistency 61.9, interpretation 63.6 | execution −0.4, consistency −0.4, interpretation −0.1 | — | 9/9, 0 excused | none | 0 | 0 |
| fight-sequence | healthy | 2027-02-12 | done | 51.4 | working | execution 69.5, responsiveness 39, consistency 59.3, connection 39.1 | none | — | 24/24, 0 excused | none | 0 | 0 |
| fight-sequence | flu at the showing | 2027-02-12 | done | 46.8 | unready | execution 59.2, responsiveness 39, consistency 50.3, connection 39.1 | execution −10.3, consistency −9 | — | 24/24, 0 excused | none | 0 | 0 |
| fight-sequence | flu, called in sick | 2027-02-26 | done | 51.4 | working | execution 70.4, responsiveness 37.5, consistency 62.4, connection 37.4 | another day | — | 29/32, 3 excused | none | 0 | 0 |
| fight-sequence | flu, recovering (over the day before) | 2027-02-12 | done | 51.4 | working | execution 69.5, responsiveness 39, consistency 59.3, connection 39.1 | none | — | 24/24, 0 excused | none | 0 | 0 |
| fight-sequence | flu, recovered (nine days before) | 2027-02-12 | done | 51.4 | working | execution 69.5, responsiveness 39, consistency 59.3, connection 39.1 | none | — | 24/24, 0 excused | none | 0 | 0 |
| fight-sequence | sprain at the showing | 2027-02-12 | done | 38.2 | unready | execution 41.9, responsiveness 39, consistency 35.3, connection 39.1 | execution −27.6, consistency −24 | execution: An Injury Still Mending (−27.6) | 24/24, 0 excused | none | 0 | 0 |
| fight-sequence | sprain, called in sick | 2027-02-26 | done | 51.4 | working | execution 70.4, responsiveness 37.5, consistency 62.4, connection 37.4 | another day | — | 28/32, 4 excused | none | 0 | 0 |
| fight-sequence | back strain at the showing | 2027-02-12 | done | 38.2 | unready | execution 41.9, responsiveness 39, consistency 35.3, connection 39.1 | execution −27.6, consistency −24 | execution: An Injury Still Mending (−27.6) | 24/24, 0 excused | none | 0 | 0 |
| fight-sequence | a deep cut at the showing | 2027-02-12 | done | 51.4 | working | execution 69.5, responsiveness 39, consistency 59.3, connection 39.1 | none | — | 24/24, 0 excused | none | 0 | 0 |
| fight-sequence | concussion at the showing | 2027-02-26 | done | 51.3 | working | execution 70.4, responsiveness 37.4, consistency 62.4, connection 37.3 | another day | — | 26/32, 6 excused | none | 0 | 0 |
| fight-sequence | sprain, recovered (nine days before) | 2027-02-12 | done | 51.4 | working | execution 69.5, responsiveness 39, consistency 59.3, connection 39.1 | none | — | 24/24, 0 excused | none | 0 | 0 |

