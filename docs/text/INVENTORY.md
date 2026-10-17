# The Text Inventory

Every string the game can show, by source and subsystem, written by `tools/text-inventory.mjs --write` from `src/` and `statuses/`. Nothing here is typed. A status is recorded with a hash of its source’s strings; a source changed since is Pending again until it’s read again.

| Subsystem | Sources | Strings | Words | Engine-Speak Hits | Rewritten And Verified | Reviewed And Retained | Pending | Blocked |
|---|---|---|---|---|---|---|---|---|
| Startup, Save Selection, Character Creation And Onboarding | 316 | 1270 | 13371 | 14 | 0 | 0 | 316 | 0 |
| Tutorials, Guides, Help Panels And Connected-System Explanations | 43 | 333 | 9328 | 18 | 0 | 0 | 43 | 0 |
| Home And Its Retained Actions | 17 | 165 | 754 | 1 | 0 | 0 | 17 | 0 |
| Player Profile, Attributes, Genres, Mastery And Progression | 462 | 2588 | 25363 | 257 | 0 | 0 | 462 | 0 |
| School, Classes, Coursework, Rehearsals, Productions, Assessments And Completion | 610 | 5997 | 62227 | 159 | 0 | 0 | 610 | 0 |
| Money, Banking, Payments, Fees, Holds, Statements And Transactions | 678 | 5065 | 97757 | 73 | 0 | 0 | 678 | 0 |
| Papers, Documents, Applications, Taxes And Status Notices | 465 | 4435 | 53141 | 73 | 0 | 0 | 465 | 0 |
| Health, Treatment, Coverage, Stamina, Energy And Recovery | 97 | 738 | 6718 | 20 | 0 | 0 | 97 | 0 |
| Calendar, Schedules, Time Advancement And Reminders | 80 | 1090 | 9219 | 14 | 0 | 0 | 80 | 0 |
| Notifications, Invitations, Feedback And Generated Messages | 22 | 176 | 1110 | 1 | 0 | 0 | 22 | 0 |
| Buttons, Menus, Tabs, Filters, Placeholders, Empty And Loading States, Confirmations | 40 | 175 | 630 | 0 | 0 | 0 | 40 | 0 |
| In-World Material: Scenes, Plays And Audition Sides, In Their Characters’ Voices | 994 | 9182 | 153517 | 127 | 0 | 0 | 994 | 0 |
| The World: Places, Countries, Weather And Reference Data | 70 | 183 | 30353 | 1 | 0 | 0 | 70 | 0 |
| **All** | 3894 | 31397 | 463488 | 758 | 0 | 0 | 3894 | 0 |

## Startup, Save Selection, Character Creation And Onboarding

| Source | Strings | Kinds | Engine-Speak | Status | Reason Or Evidence |
|---|---|---|---|---|---|
| `src/app/SlateApp.tsx#SlateApp` | 4 | label, prose | 0 | Pending |  |
| `src/app/game-context.tsx#useGame` | 1 | internal | 0 | Pending |  |
| `src/app/game-context.tsx#GameProvider` | 5 | label, prose | 0 | Pending |  |
| `src/app/game-context.tsx#ROUTE_LABELS` | 6 | label | 0 | Pending |  |
| `src/engine/content/entry.ts#ENTRY .US` | 22 | label, prose | 0 | Pending |  |
| `src/engine/content/entry.ts#ENTRY .GB` | 20 | label, prose | 0 | Pending |  |
| `src/engine/content/entry.ts#ENTRY .CA` | 22 | label, prose | 0 | Pending |  |
| `src/engine/content/entry.ts#ENTRY .IE` | 17 | prose | 0 | Pending |  |
| `src/engine/content/entry.ts#ENTRY .IS` | 20 | label, prose | 0 | Pending |  |
| `src/engine/content/entry.ts#ENTRY .DE` | 20 | label, prose | 0 | Pending |  |
| `src/engine/content/entry.ts#ENTRY .FR` | 20 | label, prose | 0 | Pending |  |
| `src/engine/content/entry.ts#ENTRY .ES` | 20 | label, prose | 0 | Pending |  |
| `src/engine/content/entry.ts#ENTRY .LV` | 20 | label, prose | 0 | Pending |  |
| `src/engine/content/entry.ts#ENTRY .JP` | 17 | prose | 0 | Pending |  |
| `src/engine/content/entry.ts#ENTRY .KR` | 25 | label, prose | 0 | Pending |  |
| `src/engine/content/entry.ts#ENTRY .MX` | 18 | label, prose | 0 | Pending |  |
| `src/engine/content/entry.ts#ENTRY .AU` | 25 | label, prose | 0 | Pending |  |
| `src/engine/content/entry.ts#ENTRY .BR` | 22 | label, prose | 0 | Pending |  |
| `src/engine/content/entry.ts#ENTRY .NZ` | 20 | label, prose | 0 | Pending |  |
| `src/engine/content/entry.ts#ENTRY_UNCERTAIN` | 15 | prose | 0 | Pending |  |
| `src/engine/content/ethnicity.ts#ETHNICITIES [american-indian]` | 1 | label | 0 | Pending |  |
| `src/engine/content/ethnicity.ts#ETHNICITIES [asian]` | 1 | label | 0 | Pending |  |
| `src/engine/content/ethnicity.ts#ETHNICITIES [black]` | 1 | label | 0 | Pending |  |
| `src/engine/content/ethnicity.ts#ETHNICITIES [hispanic]` | 1 | label | 0 | Pending |  |
| `src/engine/content/ethnicity.ts#ETHNICITIES [mena]` | 1 | label | 0 | Pending |  |
| `src/engine/content/ethnicity.ts#ETHNICITIES [pacific]` | 1 | label | 0 | Pending |  |
| `src/engine/content/ethnicity.ts#ETHNICITIES [white]` | 1 | label | 0 | Pending |  |
| `src/engine/content/ethnicity.ts#ETHNICITIES [other]` | 1 | label | 0 | Pending |  |
| `src/engine/content/ethnicity.ts#ETHNICITY_NOTE` | 3 | prose | 0 | Pending |  |
| `src/engine/content/guide/start.ts#START [start.home]` | 36 | label, prose | 2 | Pending |  |
| `src/engine/content/guide/start.ts#START [prerequisite]` | 3 | prose | 0 | Pending |  |
| `src/engine/content/guide/start.ts#START [optional]` | 2 | prose | 0 | Pending |  |
| `src/engine/content/guide/start.ts#START [immediate]` | 3 | prose | 0 | Pending |  |
| `src/engine/content/guide/start.ts#START [start.guide]` | 34 | label, prose | 1 | Pending |  |
| `src/engine/content/guide/start.ts#START [start.find]` | 26 | label, prose | 0 | Pending |  |
| `src/engine/content/identity.ts#ID_CARDS` | 6 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .aa` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .ab` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .af` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .ak` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .am` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .ar` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .as` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .ay` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .az` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .ba` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .be` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .bg` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .bi` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .bm` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .bn` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .bo` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .bs` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .ca` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .ch` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .cs` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .cy` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .da` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .de` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .dv` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .dz` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .el` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .en` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .es` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .et` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .eu` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .fa` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .ff` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .fi` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .fj` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .fo` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .fr` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .ga` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .gd` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .gl` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .gn` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .gu` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .gv` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .ha` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .he` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .hi` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .hr` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .ht` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .hu` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .hy` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .id` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .ig` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .is` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .it` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .ja` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .jv` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .ka` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .kg` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .kk` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .kl` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .km` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .kn` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .ko` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .ku` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .ky` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .la` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .lb` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .ln` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .lo` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .lt` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .lv` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .mg` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .mh` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .mi` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .mk` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .ml` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .mn` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .mr` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .ms` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .mt` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .my` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .na` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .nb` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .nd` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .ne` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .nl` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .nn` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .no` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .ny` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .om` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .or` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .pa` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .pl` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .ps` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .pt` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .qu` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .rm` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .rn` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .ro` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .ru` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .rw` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .sd` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .sg` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .si` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .sk` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .sl` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .sm` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .sn` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .so` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .sq` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .sr` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .ss` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .st` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .su` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .sv` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .sw` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .ta` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .te` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .tg` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .th` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .ti` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .tk` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .tl` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .tn` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .to` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .tr` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .ts` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .tt` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .ty` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .uk` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .ur` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .uz` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .ve` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .vi` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .wo` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .xh` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .yo` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .zh` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .zu` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .fil` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .haw` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .nso` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .tet` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .gil` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .tvl` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .pap` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .crs` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .niu` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .tkl` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .gsw` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .prs` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .ckb` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .yue` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .nan` | 1 | label | 0 | Pending |  |
| `src/engine/content/languages.ts#NAMES .hak` | 1 | label | 0 | Pending |  |
| `src/engine/content/personality-traits.ts#PERSONALITY_GROUPS` | 6 | label | 0 | Pending |  |
| `src/engine/content/personality-traits.ts#KNOB_READS` | 19 | label, prose | 0 | Pending |  |
| `src/engine/content/personality-traits.ts#PERSONALITY_TRAITS [even_tempered]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/personality-traits.ts#PERSONALITY_TRAITS [quick_tempered]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/personality-traits.ts#PERSONALITY_TRAITS [highly_strung]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/personality-traits.ts#PERSONALITY_TRAITS [unshakeable]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/personality-traits.ts#PERSONALITY_TRAITS [sentimental]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/personality-traits.ts#PERSONALITY_TRAITS [detached]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/personality-traits.ts#PERSONALITY_TRAITS [early_riser]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/personality-traits.ts#PERSONALITY_TRAITS [night_owl]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/personality-traits.ts#PERSONALITY_TRAITS [orderly]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/personality-traits.ts#PERSONALITY_TRAITS [chaotic]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/personality-traits.ts#PERSONALITY_TRAITS [homebody]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/personality-traits.ts#PERSONALITY_TRAITS [restless]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/personality-traits.ts#PERSONALITY_TRAITS [disciplined_body]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/personality-traits.ts#PERSONALITY_TRAITS [indulgent]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/personality-traits.ts#PERSONALITY_TRAITS [resilient]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/personality-traits.ts#PERSONALITY_TRAITS [burns_out]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/personality-traits.ts#PERSONALITY_TRAITS [light_sleeper]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/personality-traits.ts#PERSONALITY_TRAITS [sleeps_anywhere]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/personality-traits.ts#PERSONALITY_TRAITS [frugal]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/personality-traits.ts#PERSONALITY_TRAITS [spender]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/personality-traits.ts#PERSONALITY_TRAITS [generous]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/personality-traits.ts#PERSONALITY_TRAITS [keeps_accounts]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/personality-traits.ts#PERSONALITY_TRAITS [loyal]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/personality-traits.ts#PERSONALITY_TRAITS [independent]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/personality-traits.ts#PERSONALITY_TRAITS [needs_people]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/personality-traits.ts#PERSONALITY_TRAITS [guarded]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/personality-traits.ts#PERSONALITY_TRAITS [open_book]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/personality-traits.ts#PERSONALITY_TRAITS [peacemaker]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/personality-traits.ts#PERSONALITY_TRAITS [holds_grudges]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/personality-traits.ts#PERSONALITY_TRAITS [forgiving]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/personality-traits.ts#PERSONALITY_TRAITS [curious]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/personality-traits.ts#PERSONALITY_TRAITS [single_minded]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/personality-traits.ts#PERSONALITY_TRAITS [scattered]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/personality-traits.ts#PERSONALITY_TRAITS [self_critical]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/personality-traits.ts#PERSONALITY_TRAITS [self_assured]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/decided.ts#SPREAD_OF_PLACES` | 1 | internal | 0 | Pending |  |
| `src/engine/decided.ts#top [weather.day]` | 1 | prose | 0 | Pending |  |
| `src/engine/decided.ts#skyFor` | 1 | label | 0 | Pending |  |
| `src/engine/decided.ts#top [life.end]` | 1 | prose | 0 | Pending |  |
| `src/engine/decided.ts#SPREAD_OF_BANKS` | 1 | internal | 0 | Pending |  |
| `src/engine/decided.ts#top [bank.number]` | 1 | prose | 0 | Pending |  |
| `src/engine/decided.ts#top [bank.fraud]` | 1 | prose | 0 | Pending |  |
| `src/engine/decided.ts#top [documents.start]` | 1 | prose | 0 | Pending |  |
| `src/engine/decided.ts#top [attributes.presence]` | 1 | prose | 0 | Pending |  |
| `src/engine/decided.ts#top [school.class]` | 1 | prose | 0 | Pending |  |
| `src/engine/decided.ts#top [school.attendance]` | 1 | prose | 0 | Pending |  |
| `src/engine/decided.ts#top [school.cabaret_mates]` | 1 | prose | 0 | Pending |  |
| `src/engine/decided.ts#top [school.night]` | 1 | prose | 0 | Pending |  |
| `src/engine/decided.ts#top [production.direction]` | 1 | prose | 0 | Pending |  |
| `src/engine/decided.ts#top [school.understudy]` | 1 | prose | 0 | Pending |  |
| `src/engine/decided.ts#top [bank.chex]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/decided.ts#top [health.illness]` | 1 | prose | 0 | Pending |  |
| `src/engine/decided.ts#top [health.chronic]` | 1 | prose | 0 | Pending |  |
| `src/engine/decided.ts#top [body.draw]` | 1 | prose | 0 | Pending |  |
| `src/engine/decided.ts#top [health.onset]` | 1 | prose | 0 | Pending |  |
| `src/engine/decided.ts#top [health.injury]` | 1 | prose | 0 | Pending |  |
| `src/engine/decided.ts#top [health.referral]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/decided.ts#top [school.coursework]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/decided.ts#top [school.partner]` | 1 | prose | 0 | Pending |  |
| `src/engine/decided.ts#top [health.appointment]` | 1 | prose | 2 | Pending |  |
| `src/engine/decided.ts#top [health.therapy]` | 1 | prose | 0 | Pending |  |
| `src/engine/decided.ts#top [school.classmates]` | 1 | prose | 0 | Pending |  |
| `src/engine/index.ts#armWorldClock [life.day_rollover]` | 1 | label | 0 | Pending |  |
| `src/engine/index.ts#armWorldClock [world.tick]` | 1 | label | 0 | Pending |  |
| `src/engine/index.ts#populateWorld [checking]` | 1 | label | 0 | Pending |  |
| `src/engine/index.ts#populateWorld [savings]` | 1 | label | 0 | Pending |  |
| `src/engine/index.ts#populateWorld [credit_card]` | 2 | label | 0 | Pending |  |
| `src/engine/index.ts#populateWorld` | 2 | label | 0 | Pending |  |
| `src/engine/index.ts#refreshMeta` | 5 | label | 0 | Pending |  |
| `src/engine/index.ts#loadSave` | 1 | label | 0 | Pending |  |
| `src/engine/index.ts#loadSave [life.day_rollover]` | 1 | label | 0 | Pending |  |
| `src/engine/index.ts#loadSave [world.tick]` | 1 | label | 0 | Pending |  |
| `src/engine/index.ts#returnTheHomesMoney` | 3 | label | 0 | Pending |  |
| `src/engine/index.ts#migrate` | 59 | label, prose | 1 | Pending |  |
| `src/engine/index.ts#openSlot` | 3 | prose | 0 | Pending |  |
| `src/engine/index.ts#validateUniverse` | 8 | prose | 0 | Pending |  |
| `src/engine/persistence/adapter.ts#deserialise` | 2 | prose | 0 | Pending |  |
| `src/engine/persistence/base44.ts#Base44SaveAdapter` | 12 | label, prose | 1 | Pending |  |
| `src/engine/persistence/local.ts#KEY` | 1 | label | 0 | Pending |  |
| `src/engine/persistence/local.ts#BACKUP_KEY` | 1 | label | 0 | Pending |  |
| `src/engine/persistence/local.ts#unpack` | 1 | prose | 0 | Pending |  |
| `src/engine/persistence/local.ts#localStore` | 1 | prose | 0 | Pending |  |
| `src/engine/persistence/local.ts#LocalSaveAdapter` | 4 | label, prose | 0 | Pending |  |
| `src/main.tsx#top` | 1 | internal | 0 | Pending |  |
| `src/ui/creation/CharacterCreation.tsx#STEPS` | 5 | label | 0 | Pending |  |
| `src/ui/creation/CharacterCreation.tsx#DRAFT_KEY` | 1 | label | 0 | Pending |  |
| `src/ui/creation/CharacterCreation.tsx#PERSONALITY_AXES [openness]` | 3 | label | 0 | Pending |  |
| `src/ui/creation/CharacterCreation.tsx#PERSONALITY_AXES [conscientiousness]` | 3 | label | 0 | Pending |  |
| `src/ui/creation/CharacterCreation.tsx#PERSONALITY_AXES [extraversion]` | 3 | label | 0 | Pending |  |
| `src/ui/creation/CharacterCreation.tsx#PERSONALITY_AXES [agreeableness]` | 3 | label | 0 | Pending |  |
| `src/ui/creation/CharacterCreation.tsx#PERSONALITY_AXES [emotionalStability]` | 3 | label | 0 | Pending |  |
| `src/ui/creation/CharacterCreation.tsx#PERSONALITY_AXES [ambition]` | 3 | label | 0 | Pending |  |
| `src/ui/creation/CharacterCreation.tsx#PERSONALITY_AXES [riskTolerance]` | 3 | label | 0 | Pending |  |
| `src/ui/creation/CharacterCreation.tsx#CharacterCreation` | 10 | label, prose | 0 | Pending |  |
| `src/ui/creation/CharacterCreation.tsx#BodyFields` | 13 | label, placeholder, prose | 3 | Pending |  |
| `src/ui/creation/CharacterCreation.tsx#billedAs` | 1 | label | 0 | Pending |  |
| `src/ui/creation/CharacterCreation.tsx#IdentityStep` | 28 | accessible, label, placeholder, prose | 0 | Pending |  |
| `src/ui/creation/CharacterCreation.tsx#blockedTraitReason` | 2 | prose | 0 | Pending |  |
| `src/ui/creation/CharacterCreation.tsx#PersonalityStep` | 4 | label, prose | 0 | Pending |  |
| `src/ui/creation/CharacterCreation.tsx#PersonalStep` | 11 | accessible, label, placeholder, prose | 0 | Pending |  |
| `src/ui/creation/CharacterCreation.tsx#FamilyChoice` | 10 | label, prose | 0 | Pending |  |
| `src/ui/creation/CharacterCreation.tsx#StartingPointStep` | 34 | label, prose | 2 | Pending |  |
| `src/ui/creation/CharacterCreation.tsx#BeforeYale` | 17 | label, prose | 0 | Pending |  |
| `src/ui/creation/CharacterCreation.tsx#BankChoice` | 8 | label, prose | 1 | Pending |  |
| `src/ui/creation/CharacterCreation.tsx#ReviewStep` | 38 | accessible, label, prose | 0 | Pending |  |
| `src/ui/creation/CharacterCreation.tsx#MONTHS` | 12 | label | 0 | Pending |  |
| `src/ui/creation/CharacterCreation.tsx#validate` | 12 | prose | 0 | Pending |  |
| `src/ui/creation/LocationPicker.tsx#LocationPicker` | 24 | accessible, label, prose | 0 | Pending |  |
| `src/ui/creation/PortraitPicker.tsx#PortraitPicker` | 15 | accessible, label, prose | 0 | Pending |  |
| `src/ui/creation/WorldMap.tsx#WorldMap` | 15 | accessible, attribute, label, prose | 0 | Pending |  |
| `src/ui/creation/portrait.ts#CANNOT_ENCODE` | 1 | prose | 0 | Pending |  |
| `src/ui/creation/portrait.ts#CANNOT_DECODE` | 1 | prose | 0 | Pending |  |
| `src/ui/creation/portrait.ts#describeRejection` | 5 | label, prose | 0 | Pending |  |
| `src/ui/creation/world-map.ts#MAP_URL` | 1 | label | 1 | Pending |  |
| `src/ui/creation/world-map.ts#loadWorldMap` | 3 | internal | 0 | Pending |  |
| `src/ui/saves/SaveSlots.tsx#SaveSlots` | 35 | accessible, label, prose | 0 | Pending |  |
| `src/ui/saves/SaveSlots.tsx#BackupNote` | 2 | label | 0 | Pending |  |
| `src/ui/saves/SaveSlots.tsx#formatPlaytime` | 1 | label | 0 | Pending |  |
| `src/ui/startup/StartupSequence.tsx#STAGES [storage]` | 1 | label | 0 | Pending |  |
| `src/ui/startup/StartupSequence.tsx#STAGES [saves]` | 2 | internal, label | 0 | Pending |  |
| `src/ui/startup/StartupSequence.tsx#STAGES [validate]` | 2 | label, prose | 0 | Pending |  |
| `src/ui/startup/StartupSequence.tsx#STAGES [migrations]` | 3 | label, prose | 0 | Pending |  |
| `src/ui/startup/StartupSequence.tsx#StartupSequence` | 10 | accessible, label, prose | 0 | Pending |  |
| `src/ui/startup/StartupSequence.tsx#currentLabel` | 1 | label | 0 | Pending |  |

## Tutorials, Guides, Help Panels And Connected-System Explanations

| Source | Strings | Kinds | Engine-Speak | Status | Reason Or Evidence |
|---|---|---|---|---|---|
| `src/engine/content/guide/index.ts#GOALS [start]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/guide/index.ts#GOALS [day]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/guide/index.ts#GOALS [body]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/guide/index.ts#GOALS [school]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/guide/index.ts#GOALS [coursework]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/guide/index.ts#GOALS [productions]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/guide/index.ts#GOALS [craft]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/guide/index.ts#GOALS [money]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/guide/index.ts#GOALS [papers]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/tutorial.ts#hoursOf` | 1 | label | 0 | Pending |  |
| `src/engine/content/tutorial.ts#CHAPTERS [welcome]` | 9 | label, prose | 1 | Pending |  |
| `src/engine/content/tutorial.ts#CHAPTERS [calendar]` | 10 | label, prose | 0 | Pending |  |
| `src/engine/content/tutorial.ts#CHAPTERS [clock]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/tutorial.ts#CHAPTERS [advance]` | 7 | label, prose | 0 | Pending |  |
| `src/engine/content/tutorial.ts#CHAPTERS [needs]` | 9 | label, prose | 0 | Pending |  |
| `src/engine/content/tutorial.ts#CHAPTERS [body]` | 8 | label, prose | 4 | Pending |  |
| `src/engine/content/tutorial.ts#CHAPTERS [sleep]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/tutorial.ts#CHAPTERS [looking-after]` | 8 | label, prose | 1 | Pending |  |
| `src/engine/content/tutorial.ts#CHAPTERS [plans]` | 8 | label, prose | 0 | Pending |  |
| `src/engine/content/tutorial.ts#CHAPTERS [weather]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/tutorial.ts#CHAPTERS [school]` | 27 | label, prose | 2 | Pending |  |
| `src/engine/content/tutorial.ts#CHAPTERS [profile]` | 16 | label, prose | 4 | Pending |  |
| `src/engine/content/tutorial.ts#CHAPTERS [papers]` | 37 | label, prose | 0 | Pending |  |
| `src/engine/content/tutorial.ts#CHAPTERS [documents]` | 17 | label, prose | 2 | Pending |  |
| `src/engine/content/tutorial.ts#CHAPTERS [money]` | 7 | label, prose | 0 | Pending |  |
| `src/engine/content/tutorial.ts#CHAPTERS [bank]` | 36 | label, prose | 2 | Pending |  |
| `src/engine/content/tutorial.ts#CHAPTERS [life]` | 8 | label, prose | 1 | Pending |  |
| `src/engine/world/tutorial.ts#lockedBecause` | 2 | label, prose | 0 | Pending |  |
| `src/engine/world/tutorial.ts#registerTutorial` | 4 | refusal | 0 | Pending |  |
| `src/ui/guide/Guide.tsx#Gated` | 1 | label | 0 | Pending |  |
| `src/ui/guide/Guide.tsx#LockedPanel` | 5 | label, prose | 0 | Pending |  |
| `src/ui/guide/Guide.tsx#GuideStrip` | 2 | label | 0 | Pending |  |
| `src/ui/guide/Guide.tsx#GuideButton` | 1 | label | 0 | Pending |  |
| `src/ui/guide/Guide.tsx#GuideDialog` | 24 | accessible, label, prose | 0 | Pending |  |
| `src/ui/guide/Help.tsx#pageLabel` | 2 | label | 0 | Pending |  |
| `src/ui/guide/Help.tsx#CONNECTION_HEADING` | 6 | label | 0 | Pending |  |
| `src/ui/guide/Help.tsx#HelpProvider` | 2 | accessible, label | 0 | Pending |  |
| `src/ui/guide/Help.tsx#HelpDialog` | 8 | accessible, label, placeholder, prose | 0 | Pending |  |
| `src/ui/guide/Help.tsx#Contents` | 6 | label, prose | 0 | Pending |  |
| `src/ui/guide/Help.tsx#Results` | 3 | label, prose | 0 | Pending |  |
| `src/ui/guide/Help.tsx#Facts` | 1 | label | 0 | Pending |  |
| `src/ui/guide/Help.tsx#Entry` | 21 | label, prose | 1 | Pending |  |
| `src/ui/guide/HowItWorks.tsx#HowItWorks` | 1 | label | 0 | Pending |  |

## Home And Its Retained Actions

| Source | Strings | Kinds | Engine-Speak | Status | Reason Or Evidence |
|---|---|---|---|---|---|
| `src/engine/systems/life.ts#WET` | 4 | label | 0 | Pending |  |
| `src/engine/systems/life.ts#wellbeingSummary` | 8 | prose | 1 | Pending |  |
| `src/engine/systems/life.ts#registerLife [life.day_rollover]` | 1 | label | 0 | Pending |  |
| `src/engine/systems/life.ts#registerLife <life.sleep>` | 6 | label, refusal | 0 | Pending |  |
| `src/engine/systems/life.ts#registerLife <life.look_after>` | 5 | label, refusal | 0 | Pending |  |
| `src/engine/systems/life.ts#LOOKING_AFTER` | 5 | label | 0 | Pending |  |
| `src/engine/systems/life.ts#WORKOUTS_TODAY` | 1 | label | 0 | Pending |  |
| `src/engine/systems/life.ts#commitmentWithin` | 1 | prose | 0 | Pending |  |
| `src/engine/systems/life.ts#startRefusal` | 2 | prose | 0 | Pending |  |
| `src/engine/systems/life.ts#lookAfterRefusal` | 7 | prose | 0 | Pending |  |
| `src/engine/systems/life.ts#whyNow` | 14 | label, prose | 0 | Pending |  |
| `src/engine/systems/life.ts#suggestedSleep` | 3 | prose | 0 | Pending |  |
| `src/engine/systems/life.ts#sleepReason` | 11 | prose | 0 | Pending |  |
| `src/ui/screens/Home.tsx#Home` | 72 | accessible, attribute, label, prose | 0 | Pending |  |
| `src/ui/screens/Home.tsx#SchoolLine` | 10 | accessible, attribute, label, prose | 0 | Pending |  |
| `src/ui/screens/Home.tsx#PapersLine` | 11 | accessible, label, prose | 0 | Pending |  |
| `src/ui/screens/Home.tsx#partOfDay` | 4 | label | 0 | Pending |  |

## Player Profile, Attributes, Genres, Mastery And Progression

| Source | Strings | Kinds | Engine-Speak | Status | Reason Or Evidence |
|---|---|---|---|---|---|
| `src/engine/content/abilities.ts#ABILITY_DEFS [emotionalDepth]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/abilities.ts#ABILITY_DEFS [presence]` | 6 | label, prose | 2 | Pending |  |
| `src/engine/content/abilities.ts#ABILITY_DEFS [listening]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/abilities.ts#ABILITY_DEFS [imagination]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/abilities.ts#ABILITY_DEFS [focus]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/abilities.ts#ABILITY_DEFS [memory]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/abilities.ts#ABILITY_DEFS [adaptability]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/abilities.ts#ABILITY_DEFS [composure]` | 6 | label, prose | 2 | Pending |  |
| `src/engine/content/abilities.ts#ABILITY_DEFS [vocal]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/abilities.ts#ABILITY_DEFS [physical]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/abilities.ts#ABILITY_DEFS [discipline]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/abilities.ts#ABILITY_DEFS [stamina]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/approaches.ts#AXES` | 3 | label | 0 | Pending |  |
| `src/engine/content/approaches.ts#APPROACH_EFFECT` | 12 | label, prose | 0 | Pending |  |
| `src/engine/content/attributes-matrix.ts#SAVED` | 5 | label | 5 | Pending |  |
| `src/engine/content/attributes-matrix.ts#ORDINARY` | 12 | label, prose | 0 | Pending |  |
| `src/engine/content/attributes-matrix.ts#HEAD` | 7 | label | 0 | Pending |  |
| `src/engine/content/attributes-matrix.ts#attributesMatrix` | 204 | label, prose | 88 | Pending |  |
| `src/engine/content/attributes-matrix.ts#attributesMatrix carry()` | 1 | prose | 0 | Pending |  |
| `src/engine/content/attributes-matrix.ts#attributesMatrix effect()` | 1 | label | 0 | Pending |  |
| `src/engine/content/contemporary.ts#CONTEMPORARY_PLAYS [proof]` | 6 | label | 0 | Pending |  |
| `src/engine/content/contemporary.ts#CONTEMPORARY_PLAYS [doubt-a-parable]` | 7 | label, prose | 0 | Pending |  |
| `src/engine/content/contemporary.ts#CONTEMPORARY_PLAYS [topdog-underdog]` | 6 | label | 0 | Pending |  |
| `src/engine/content/contemporary.ts#CONTEMPORARY_PLAYS [sweat]` | 8 | label, prose | 0 | Pending |  |
| `src/engine/content/contemporary.ts#CONTEMPORARY_PLAYS [clybourne-park]` | 8 | label, prose | 0 | Pending |  |
| `src/engine/content/contemporary.ts#CONTEMPORARY_PLAYS [venus-in-fur]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/contemporary.ts#CONTEMPORARY_PLAYS [disgraced]` | 5 | label | 0 | Pending |  |
| `src/engine/content/contemporary.ts#CONTEMPORARY_PLAYS [water-by-the-spoonful]` | 5 | label | 0 | Pending |  |
| `src/engine/content/contemporary.ts#CONTEMPORARY_PLAYS [august-osage-county]` | 8 | label, prose | 0 | Pending |  |
| `src/engine/content/contemporary.ts#CONTEMPORARY_PLAYS [the-humans]` | 7 | label, prose | 0 | Pending |  |
| `src/engine/content/contemporary.ts#CONTEMPORARY_PLAYS [constellations]` | 8 | label, prose | 0 | Pending |  |
| `src/engine/content/contemporary.ts#CONTEMPORARY_PLAYS [lungs]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/contemporary.ts#CONTEMPORARY_PLAYS [the-flick]` | 9 | label, prose | 0 | Pending |  |
| `src/engine/content/contemporary.ts#CONTEMPORARY_PLAYS [fairview]` | 5 | label | 0 | Pending |  |
| `src/engine/content/contemporary.ts#CONTEMPORARY_PLAYS [the-wolves]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/contemporary.ts#CONTEMPORARY_PLAYS [cost-of-living]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/contemporary.ts#CONTEMPORARY_PLAYS [gloria]` | 8 | label, prose | 0 | Pending |  |
| `src/engine/content/contemporary.ts#CONTEMPORARY_PLAYS [rabbit-hole]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/contemporary.ts#CONTEMPORARY_PLAYS [between-riverside-and-crazy]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/contemporary.ts#CONTEMPORARY_PLAYS [fat-ham]` | 8 | label, prose | 0 | Pending |  |
| `src/engine/content/contemporary.ts#CONTEMPORARY_PLAYS [english]` | 7 | label, prose | 0 | Pending |  |
| `src/engine/content/contemporary.ts#CONTEMPORARY_PLAYS [primary-trust]` | 8 | label | 0 | Pending |  |
| `src/engine/content/contemporary.ts#CONTEMPORARY_PLAYS [the-children]` | 8 | label, prose | 0 | Pending |  |
| `src/engine/content/contemporary.ts#CONTEMPORARY_PLAYS [enron]` | 7 | label, prose | 0 | Pending |  |
| `src/engine/content/contemporary.ts#CONTEMPORARY_PLAYS [escaped-alone]` | 9 | label, prose | 0 | Pending |  |
| `src/engine/content/contemporary.ts#CONTEMPORARY_PLAYS [king-charles-iii]` | 9 | label, prose | 0 | Pending |  |
| `src/engine/content/contemporary.ts#CONTEMPORARY_PLAYS [fleabag]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/contemporary.ts#CONTEMPORARY_PLAYS [the-laramie-project]` | 8 | label, prose | 0 | Pending |  |
| `src/engine/content/contemporary.ts#CONTEMPORARY_PLAYS [black-watch]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/demands.ts#DEMAND_LABEL` | 12 | label | 0 | Pending |  |
| `src/engine/content/film-genres.ts#FILM_GENRES` | 149 | label | 0 | Pending |  |
| `src/engine/content/genre-coverage.ts#NO_TECHNIQUE` | 10 | prose | 0 | Pending |  |
| `src/engine/content/genre-coverage.ts#genreCoverage` | 17 | label, prose | 1 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .absurdist` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .action` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .action_comedy` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .adventure` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .alternate_history` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .animated` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .anime` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .anthology` | 1 | prose | 1 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .apocalyptic` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .art_house` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .avant_garde` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .backstage_musical` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .biker` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .biographical` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .black_comedy` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .blaxploitation` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .body_horror` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .buddy_comedy` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .buddy_cop` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .caper` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .chanbara` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .chase` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .childrens` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .christmas` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .comedy` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .coming_of_age` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .concert_film` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .conspiracy_thriller` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .cosmic_horror` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .costume_drama` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .courtroom_drama` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .creature_feature` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .crime` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .cyberpunk` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .dance` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .dark_fantasy` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .detective` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .disaster` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .docudrama` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .docufiction` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .documentary` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .domestic_drama` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .drama` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .dystopian` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .eco_horror` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .epic` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .erotic_thriller` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .espionage` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .experimental` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .exploitation` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .fairy_tale` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .family` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .fantasy` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .farce` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .film_noir` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .folk_horror` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .found_footage` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .gangster` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .giallo` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .gothic_horror` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .grindhouse` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .hangout` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .heist` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .historical_drama` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .historical_fiction` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .holiday` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .hood_film` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .horror` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .horror_comedy` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .isekai` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .jidaigeki` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .jukebox_musical` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .kaiju` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .kitchen_sink` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .legal_drama` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .magical_realism` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .martial_arts` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .medical_drama` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .melodrama` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .military` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .mockumentary` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .monster_movie` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .mumblecore` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .musical` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .mystery` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .nature_documentary` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .neo_noir` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .neorealism` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .new_wave` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .nordic_noir` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .occult` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .parody` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .period_drama` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .picaresque` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .police_procedural` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .political_drama` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .political_thriller` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .post_apocalyptic` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .prison_film` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .psychological_horror` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .psychological_thriller` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .queer_cinema` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .revenge` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .road_movie` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .rockumentary` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .romance` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .romantic_comedy` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .romantic_drama` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .samurai` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .satire` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .science_fantasy` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .science_fiction` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .screwball_comedy` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .sea_adventure` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .silent_film` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .slapstick` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .slasher` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .slice_of_life` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .social_realism` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .space_opera` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .spaghetti_western` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .splatter` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .sports` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .spy` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .steampunk` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .stoner_comedy` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .superhero` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .supernatural` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .surrealist` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .survival` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .swashbuckler` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .sword_and_sandal` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .sword_and_sorcery` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .techno_thriller` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .teen` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .thriller` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .time_travel` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .tokusatsu` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .tragedy` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .tragicomedy` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .true_crime` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .vampire` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .war` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .werewolf` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .western` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .whodunit` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .wuxia` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .yakuza` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genre-register.ts#GENRE_REGISTER .zombie` | 1 | prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .absurdist` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .action` | 2 | label | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .action_comedy` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .adventure` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .alternate_history` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .animated` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .anime` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .anthology` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .apocalyptic` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .art_house` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .avant_garde` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .backstage_musical` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .biker` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .biographical` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .black_comedy` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .blaxploitation` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .body_horror` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .buddy_comedy` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .buddy_cop` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .caper` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .chanbara` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .chase` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .childrens` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .christmas` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .comedy` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .coming_of_age` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .concert_film` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .conspiracy_thriller` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .cosmic_horror` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .costume_drama` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .courtroom_drama` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .creature_feature` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .crime` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .cyberpunk` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .dance` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .dark_fantasy` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .detective` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .disaster` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .docudrama` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .docufiction` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .documentary` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .domestic_drama` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .drama` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .dystopian` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .eco_horror` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .epic` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .erotic_thriller` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .espionage` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .experimental` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .exploitation` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .fairy_tale` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .family` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .fantasy` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .farce` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .film_noir` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .folk_horror` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .found_footage` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .gangster` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .giallo` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .gothic_horror` | 2 | label, prose | 1 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .grindhouse` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .hangout` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .heist` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .historical_drama` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .historical_fiction` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .holiday` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .hood_film` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .horror` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .horror_comedy` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .isekai` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .jidaigeki` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .jukebox_musical` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .kaiju` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .kitchen_sink` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .legal_drama` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .magical_realism` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .martial_arts` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .medical_drama` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .melodrama` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .military` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .mockumentary` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .monster_movie` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .mumblecore` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .musical` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .mystery` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .nature_documentary` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .neo_noir` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .neorealism` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .new_wave` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .nordic_noir` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .occult` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .parody` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .period_drama` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .picaresque` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .police_procedural` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .political_drama` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .political_thriller` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .post_apocalyptic` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .prison_film` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .psychological_horror` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .psychological_thriller` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .queer_cinema` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .revenge` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .road_movie` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .rockumentary` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .romance` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .romantic_comedy` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .romantic_drama` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .samurai` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .satire` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .science_fantasy` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .science_fiction` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .screwball_comedy` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .sea_adventure` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .silent_film` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .slapstick` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .slasher` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .slice_of_life` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .social_realism` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .space_opera` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .spaghetti_western` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .splatter` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .sports` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .spy` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .steampunk` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .stoner_comedy` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .superhero` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .supernatural` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .surrealist` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .survival` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .swashbuckler` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .sword_and_sandal` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .sword_and_sorcery` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .techno_thriller` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .teen` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .thriller` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .time_travel` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .tokusatsu` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .tragedy` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .tragicomedy` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .true_crime` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .vampire` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .war` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .werewolf` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .western` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .whodunit` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .wuxia` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .yakuza` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/genres.ts#GENRE_DEFS .zombie` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/guide/craft.ts#OPENED` | 1 | label | 0 | Pending |  |
| `src/engine/content/guide/craft.ts#LOCKED` | 1 | prose | 0 | Pending |  |
| `src/engine/content/guide/craft.ts#RECORDING` | 1 | label | 0 | Pending |  |
| `src/engine/content/guide/craft.ts#mate` | 1 | label | 0 | Pending |  |
| `src/engine/content/guide/craft.ts#READER_WAYS` | 3 | label | 0 | Pending |  |
| `src/engine/content/guide/craft.ts#CRAFT [craft.profile]` | 60 | label, prose | 9 | Pending |  |
| `src/engine/content/guide/craft.ts#CRAFT [prerequisite]` | 6 | prose | 1 | Pending |  |
| `src/engine/content/guide/craft.ts#CRAFT [optional]` | 21 | prose | 1 | Pending |  |
| `src/engine/content/guide/craft.ts#CRAFT [craft.practice]` | 75 | label, prose | 5 | Pending |  |
| `src/engine/content/guide/craft.ts#CRAFT [immediate]` | 12 | prose | 3 | Pending |  |
| `src/engine/content/guide/craft.ts#CRAFT [evaluation]` | 5 | prose | 8 | Pending |  |
| `src/engine/content/guide/craft.ts#CRAFT [history]` | 8 | prose | 3 | Pending |  |
| `src/engine/content/guide/craft.ts#CRAFT [craft.genre]` | 61 | label, prose | 13 | Pending |  |
| `src/engine/content/guide/craft.ts#CRAFT [craft.brief-prepare]` | 62 | label, prose | 6 | Pending |  |
| `src/engine/content/guide/craft.ts#CRAFT [craft.brief-choose]` | 57 | label, prose | 23 | Pending |  |
| `src/engine/content/guide/craft.ts#CRAFT [craft.brief-reader]` | 61 | label, prose | 16 | Pending |  |
| `src/engine/content/guide/craft.ts#CRAFT [craft.brief-tape]` | 74 | label, prose | 26 | Pending |  |
| `src/engine/content/guide/craft.ts#CRAFT [craft.work]` | 57 | label, prose | 14 | Pending |  |
| `src/engine/content/guide/craft.ts#CRAFT [craft.identity]` | 57 | label, prose | 3 | Pending |  |
| `src/engine/content/interpretation.ts#CONCERN_AFFINITY` | 13 | prose | 0 | Pending |  |
| `src/engine/content/interpretation.ts#READER_AFFINITY` | 4 | label | 0 | Pending |  |
| `src/engine/content/interpretation.ts#MEDIUM_AFFINITY` | 3 | label | 0 | Pending |  |
| `src/engine/content/interpretation.ts#TONE_AFFINITY` | 4 | label | 0 | Pending |  |
| `src/engine/content/interpretation.ts#FEATURE_AFFINITY` | 5 | label | 0 | Pending |  |
| `src/engine/content/interpretation.ts#CIRCUMSTANCE_AFFINITY` | 4 | label | 0 | Pending |  |
| `src/engine/content/interpretation.ts#LANGUAGE_AFFINITY` | 2 | label | 0 | Pending |  |
| `src/engine/content/interpretation.ts#GRAIN_LABEL` | 3 | label | 0 | Pending |  |
| `src/engine/content/practice.ts#EXERCISES` | 81 | label, prose | 4 | Pending |  |
| `src/engine/content/practice.ts#EXERCISE_DESIGN .sense-memory` | 4 | prose | 1 | Pending |  |
| `src/engine/content/practice.ts#EXERCISE_DESIGN .repetition` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/practice.ts#EXERCISE_DESIGN .given-circumstances` | 4 | prose | 0 | Pending |  |
| `src/engine/content/practice.ts#EXERCISE_DESIGN .concentration` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/practice.ts#EXERCISE_DESIGN .recall-drill` | 4 | prose | 0 | Pending |  |
| `src/engine/content/practice.ts#EXERCISE_DESIGN .adjustments` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/practice.ts#EXERCISE_DESIGN .voice-work` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/practice.ts#EXERCISE_DESIGN .movement-work` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/practice.ts#EXERCISE_DESIGN .showing-for-classmates` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/practice.ts#EXERCISE_DESIGN .graded-exposure` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/practice.ts#EXERCISE_DESIGN .dialect-drill` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/practice.ts#EXERCISE_DESIGN .audition-pieces` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/practice.ts#EXERCISE_DESIGN .character-work` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/practice.ts#EXERCISE_DESIGN .verse-speaking` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/practice.ts#EXERCISE_DESIGN .clown-practice` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/practice.ts#EXERCISE_DESIGN .cold-reading` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/practice.ts#EXERCISE_DESIGN .comic-timing` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/practice.ts#EXERCISE_DESIGN .dance-class` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/practice.ts#EXERCISE_DESIGN .improv-session` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/practice.ts#EXERCISE_DESIGN .intimacy-study` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/practice.ts#EXERCISE_DESIGN .self-tape-practice` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/practice.ts#EXERCISE_DESIGN .scene-work` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/practice.ts#EXERCISE_DESIGN .script-analysis` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/practice.ts#EXERCISE_DESIGN .singing-practice` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/practice.ts#EXERCISE_DESIGN .speech-drill` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/practice.ts#EXERCISE_DESIGN .combat-drill` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/practice.ts#EXERCISE_DESIGN .copy-reading` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/practice.ts#TIER` | 3 | label | 0 | Pending |  |
| `src/engine/content/practice.ts#FOCUS` | 10 | label, prose | 0 | Pending |  |
| `src/engine/content/reference.ts#Registry` | 2 | internal | 0 | Pending |  |
| `src/engine/systems/artistry.ts#identityOf` | 35 | label, prose | 0 | Pending |  |
| `src/engine/systems/attributes.ts#alreadyApplied` | 1 | prose | 0 | Pending |  |
| `src/engine/systems/engagement.ts#hourRefusal` | 3 | prose | 0 | Pending |  |
| `src/engine/systems/engagement.ts#studyRefusal` | 1 | prose | 0 | Pending |  |
| `src/engine/systems/engagement.ts#study` | 2 | label | 0 | Pending |  |
| `src/engine/systems/experience.ts#FEATURE_LABEL` | 12 | label | 0 | Pending |  |
| `src/engine/systems/experience.ts#recommendations` | 25 | label, prose | 1 | Pending |  |
| `src/engine/systems/interpretation-read.ts#grainWords` | 5 | label, prose | 2 | Pending |  |
| `src/engine/systems/interpretation-read.ts#takeGrainWords` | 4 | prose | 0 | Pending |  |
| `src/engine/systems/interpretation.ts#suitabilityOf` | 3 | label, prose | 0 | Pending |  |
| `src/engine/systems/interpretation.ts#suitabilityWords` | 3 | label, prose | 0 | Pending |  |
| `src/engine/systems/learning.ts#APPROACHES` | 8 | label, prose | 0 | Pending |  |
| `src/engine/systems/learning.ts#ADVANCED` | 7 | prose | 0 | Pending |  |
| `src/engine/systems/learning.ts#DIM_SUBJECT` | 6 | label | 0 | Pending |  |
| `src/engine/systems/learning.ts#noteSubject` | 2 | label | 0 | Pending |  |
| `src/engine/systems/next-steps.ts#standingOf` | 27 | label, prose | 0 | Pending |  |
| `src/engine/systems/next-steps.ts#PART_SAID` | 4 | label | 0 | Pending |  |
| `src/engine/systems/next-steps.ts#movedSaid` | 3 | prose | 1 | Pending |  |
| `src/engine/systems/next-steps.ts#assumesOf` | 14 | label, prose | 1 | Pending |  |
| `src/engine/systems/next-steps.ts#attentionSaid` | 10 | label, prose | 0 | Pending |  |
| `src/engine/systems/next-steps.ts#disciplinePart` | 3 | label, prose | 0 | Pending |  |
| `src/engine/systems/next-steps.ts#nextOf` | 5 | label, prose | 0 | Pending |  |
| `src/engine/systems/next-steps.ts#allFull` | 7 | label, prose | 0 | Pending |  |
| `src/engine/systems/next-steps.ts#heldVersusNext` | 3 | prose | 0 | Pending |  |
| `src/engine/systems/practice.ts#practiceRefusal` | 7 | prose | 0 | Pending |  |
| `src/engine/systems/practice.ts#focusRefusal` | 1 | prose | 0 | Pending |  |
| `src/engine/systems/practice.ts#practicePreview` | 9 | label, prose | 0 | Pending |  |
| `src/engine/systems/practice.ts#pastMastery` | 1 | prose | 0 | Pending |  |
| `src/engine/systems/practice.ts#practiceFeedback` | 23 | label, prose | 0 | Pending |  |
| `src/engine/systems/practice.ts#registerPractice <practice.exercise>` | 1 | refusal | 0 | Pending |  |
| `src/engine/systems/register.ts#concernWords` | 1 | prose | 2 | Pending |  |
| `src/engine/systems/register.ts#registerBasisWords` | 2 | prose | 1 | Pending |  |
| `src/engine/systems/register.ts#concernNote` | 1 | label | 0 | Pending |  |
| `src/ui/components/AttributesPanel.tsx#AttributesPanel` | 7 | accessible, attribute, label, prose | 1 | Pending |  |
| `src/ui/looks/actor.tsx#BAND_WORD` | 7 | label | 0 | Pending |  |
| `src/ui/looks/actor.tsx#sourceWords` | 27 | label | 0 | Pending |  |
| `src/ui/looks/actor.tsx#top` | 94 | attribute, label, prose | 8 | Pending |  |
| `src/ui/workspaces/ProfileWorkspace.tsx#riskWords` | 4 | label, prose | 0 | Pending |  |
| `src/ui/workspaces/ProfileWorkspace.tsx#DISPOSITIONS` | 13 | label, prose | 0 | Pending |  |
| `src/ui/workspaces/ProfileWorkspace.tsx#todayFor` | 4 | label | 0 | Pending |  |
| `src/ui/workspaces/ProfileWorkspace.tsx#ProfileWorkspace` | 3 | accessible, attribute, label | 0 | Pending |  |
| `src/ui/workspaces/ProfileWorkspace.tsx#IdentityPanel` | 28 | accessible, attribute, label, prose | 0 | Pending |  |
| `src/ui/workspaces/ProfileWorkspace.tsx#PracticeButton` | 5 | label | 0 | Pending |  |
| `src/ui/workspaces/ProfileWorkspace.tsx#PracticeControl` | 5 | label | 0 | Pending |  |
| `src/ui/workspaces/ProfileWorkspace.tsx#NextWork` | 6 | label, prose | 0 | Pending |  |
| `src/ui/workspaces/ProfileWorkspace.tsx#WorkSoFarPanel` | 16 | accessible, label, prose | 0 | Pending |  |
| `src/ui/workspaces/ProfileWorkspace.tsx#AbilitiesPanel` | 24 | accessible, attribute, label, prose | 2 | Pending |  |
| `src/ui/workspaces/ProfileWorkspace.tsx#TechniquesPanel` | 9 | accessible, attribute, label | 0 | Pending |  |
| `src/ui/workspaces/ProfileWorkspace.tsx#ListControls` | 3 | label, placeholder | 0 | Pending |  |
| `src/ui/workspaces/ProfileWorkspace.tsx#GenresPanel` | 31 | accessible, attribute, label, prose | 1 | Pending |  |
| `src/ui/workspaces/ProfileWorkspace.tsx#ConditionPanel` | 15 | accessible, attribute, label, prose | 1 | Pending |  |
| `src/ui/workspaces/ProfileWorkspace.tsx#JourneyPanel` | 28 | accessible, label, prose | 0 | Pending |  |
| `src/ui/workspaces/ProfileWorkspace.tsx#HistoryPanel` | 4 | accessible, attribute, label, prose | 0 | Pending |  |

## School, Classes, Coursework, Rehearsals, Productions, Assessments And Completion

| Source | Strings | Kinds | Engine-Speak | Status | Reason Or Evidence |
|---|---|---|---|---|---|
| `src/engine/content/concerns.ts#CONCERNS` | 52 | label, prose | 0 | Pending |  |
| `src/engine/content/coursework.ts#QUESTIONS [circumstances]` | 1 | label | 0 | Pending |  |
| `src/engine/content/coursework.ts#QUESTIONS [relationship]` | 1 | label | 0 | Pending |  |
| `src/engine/content/coursework.ts#QUESTIONS [objective]` | 1 | label | 0 | Pending |  |
| `src/engine/content/coursework.ts#QUESTIONS [obstacle]` | 1 | label | 0 | Pending |  |
| `src/engine/content/coursework.ts#QUESTIONS [tactic]` | 1 | label | 0 | Pending |  |
| `src/engine/content/coursework.ts#SCENES [seagull-4]` | 52 | label, prose | 0 | Pending |  |
| `src/engine/content/coursework.ts#SCENES [dollhouse-3]` | 54 | label, prose | 0 | Pending |  |
| `src/engine/content/coursework.ts#SCENES [earnest-2]` | 52 | label, prose | 0 | Pending |  |
| `src/engine/content/coursework.ts#SCENES [vanya-2]` | 52 | label, prose | 0 | Pending |  |
| `src/engine/content/coursework.ts#SCENES [trifles]` | 54 | label, prose | 0 | Pending |  |
| `src/engine/content/coursework.ts#SCENES [julie]` | 54 | label, prose | 0 | Pending |  |
| `src/engine/content/coursework.ts#SCENES [cherry-orchard-4]` | 54 | label, prose | 0 | Pending |  |
| `src/engine/content/coursework.ts#SCENES [pygmalion-4]` | 52 | label, prose | 0 | Pending |  |
| `src/engine/content/coursework.ts#SCENES [playboy-3]` | 52 | label, prose | 0 | Pending |  |
| `src/engine/content/coursework.ts#SCENES [machinal-2]` | 52 | label, prose | 0 | Pending |  |
| `src/engine/content/coursework.ts#SCENES [muchado-4-1]` | 52 | label, prose | 0 | Pending |  |
| `src/engine/content/coursework.ts#SCENES [romeo-2-2]` | 52 | label, prose | 0 | Pending |  |
| `src/engine/content/coursework.ts#SCENES [macbeth-1-7]` | 52 | label, prose | 0 | Pending |  |
| `src/engine/content/coursework.ts#read` | 1 | label | 0 | Pending |  |
| `src/engine/content/coursework.ts#learn` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/coursework.ts#alone` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/coursework.ts#withPartner` | 1 | label | 0 | Pending |  |
| `src/engine/content/coursework.ts#revise` | 1 | label | 0 | Pending |  |
| `src/engine/content/coursework.ts#SHOWCASE_SCENE` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/coursework.ts#TEMPLATES [simulated-rehearsal]` | 16 | label, prose | 0 | Pending |  |
| `src/engine/content/coursework.ts#TEMPLATES [greek-scene]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/coursework.ts#TEMPLATES [read]` | 1 | label | 0 | Pending |  |
| `src/engine/content/coursework.ts#TEMPLATES [voice-text]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/coursework.ts#TEMPLATES [scene-study]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/coursework.ts#TEMPLATES [classical-scene]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/coursework.ts#TEMPLATES [scan]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/coursework.ts#TEMPLATES [voice-sequence]` | 9 | label, prose | 0 | Pending |  |
| `src/engine/content/coursework.ts#TEMPLATES [learn-sequence]` | 1 | label | 0 | Pending |  |
| `src/engine/content/coursework.ts#TEMPLATES [practice]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/coursework.ts#TEMPLATES [speech-drill]` | 11 | label, prose | 0 | Pending |  |
| `src/engine/content/coursework.ts#TEMPLATES [transcribe]` | 1 | label | 0 | Pending |  |
| `src/engine/content/coursework.ts#TEMPLATES [learn-text]` | 1 | label | 0 | Pending |  |
| `src/engine/content/coursework.ts#TEMPLATES [drill]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/coursework.ts#TEMPLATES [movement-score]` | 11 | label, prose | 1 | Pending |  |
| `src/engine/content/coursework.ts#TEMPLATES [devise]` | 1 | label | 0 | Pending |  |
| `src/engine/content/coursework.ts#TEMPLATES [rehearse-score]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/coursework.ts#TEMPLATES [alexander-practice]` | 9 | label, prose | 0 | Pending |  |
| `src/engine/content/coursework.ts#TEMPLATES [review]` | 1 | label | 0 | Pending |  |
| `src/engine/content/coursework.ts#TEMPLATES [daily]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/coursework.ts#TEMPLATES [play-game]` | 10 | label, prose | 0 | Pending |  |
| `src/engine/content/coursework.ts#TEMPLATES [build]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/coursework.ts#TEMPLATES [table-work]` | 11 | label, prose | 0 | Pending |  |
| `src/engine/content/coursework.ts#TEMPLATES [write]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/coursework.ts#TEMPLATES [fight-sequence]` | 12 | label, prose | 0 | Pending |  |
| `src/engine/content/coursework.ts#TEMPLATES [learn-fight]` | 1 | label | 0 | Pending |  |
| `src/engine/content/coursework.ts#TEMPLATES [shadow]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/coursework.ts#TEMPLATES [intimacy-practice]` | 11 | label, prose | 0 | Pending |  |
| `src/engine/content/coursework.ts#TEMPLATES [protocol]` | 1 | label | 0 | Pending |  |
| `src/engine/content/coursework.ts#TEMPLATES [score]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/coursework.ts#TEMPLATES [context-presentation]` | 9 | label, prose | 0 | Pending |  |
| `src/engine/content/coursework.ts#TEMPLATES [read-play]` | 1 | label | 0 | Pending |  |
| `src/engine/content/coursework.ts#TEMPLATES [research]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/coursework.ts#TEMPLATES [prepare-talk]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/coursework.ts#TEMPLATES [song]` | 10 | label, prose | 0 | Pending |  |
| `src/engine/content/coursework.ts#TEMPLATES [learn-song]` | 1 | label | 0 | Pending |  |
| `src/engine/content/coursework.ts#TEMPLATES [song-text]` | 1 | label | 0 | Pending |  |
| `src/engine/content/coursework.ts#TEMPLATES [sing]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/coursework.ts#TEMPLATES [self-tape]` | 10 | label, prose | 0 | Pending |  |
| `src/engine/content/coursework.ts#TEMPLATES [record]` | 2 | label, prose | 1 | Pending |  |
| `src/engine/content/coursework.ts#TEMPLATES [clown-turn]` | 8 | label, prose | 0 | Pending |  |
| `src/engine/content/coursework.ts#TEMPLATES [find-turn]` | 1 | label | 0 | Pending |  |
| `src/engine/content/coursework.ts#TEMPLATES [play-turn]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/coursework.ts#TEMPLATES [audition-pair]` | 9 | label, prose | 0 | Pending |  |
| `src/engine/content/guide/coursework.ts#CHAPTER` | 1 | label | 0 | Pending |  |
| `src/engine/content/guide/coursework.ts#OPENED` | 1 | label | 0 | Pending |  |
| `src/engine/content/guide/coursework.ts#LOCKED` | 1 | prose | 0 | Pending |  |
| `src/engine/content/guide/coursework.ts#clock` | 2 | prose | 0 | Pending |  |
| `src/engine/content/guide/coursework.ts#points` | 2 | label | 0 | Pending |  |
| `src/engine/content/guide/coursework.ts#TABLE_SHORT` | 1 | label | 0 | Pending |  |
| `src/engine/content/guide/coursework.ts#NOTE_TEXT` | 1 | prose | 0 | Pending |  |
| `src/engine/content/guide/coursework.ts#TURN` | 1 | label | 0 | Pending |  |
| `src/engine/content/guide/coursework.ts#COURSEWORK [coursework.prepare]` | 93 | label, prose | 8 | Pending |  |
| `src/engine/content/guide/coursework.ts#COURSEWORK [prerequisite]` | 7 | prose | 1 | Pending |  |
| `src/engine/content/guide/coursework.ts#COURSEWORK [immediate]` | 11 | prose | 0 | Pending |  |
| `src/engine/content/guide/coursework.ts#COURSEWORK [scheduled]` | 9 | prose | 0 | Pending |  |
| `src/engine/content/guide/coursework.ts#COURSEWORK [evaluation]` | 11 | prose | 4 | Pending |  |
| `src/engine/content/guide/coursework.ts#COURSEWORK [history]` | 5 | prose | 0 | Pending |  |
| `src/engine/content/guide/coursework.ts#COURSEWORK [coursework.table]` | 56 | label, prose | 3 | Pending |  |
| `src/engine/content/guide/coursework.ts#COURSEWORK [optional]` | 4 | prose | 0 | Pending |  |
| `src/engine/content/guide/coursework.ts#COURSEWORK [coursework.playing]` | 61 | label, prose | 18 | Pending |  |
| `src/engine/content/guide/coursework.ts#COURSEWORK [coursework.feedback]` | 60 | label, prose | 3 | Pending |  |
| `src/engine/content/guide/coursework.ts#COURSEWORK [coursework.approach]` | 54 | label, prose | 1 | Pending |  |
| `src/engine/content/guide/coursework.ts#COURSEWORK [coursework.partners]` | 84 | label, prose | 2 | Pending |  |
| `src/engine/content/guide/coursework.ts#COURSEWORK [coursework.class]` | 69 | label, prose | 0 | Pending |  |
| `src/engine/content/guide/coursework.ts#COURSEWORK [coursework.workbook]` | 72 | label, prose | 3 | Pending |  |
| `src/engine/content/guide/productions.ts#OPENED` | 1 | label | 0 | Pending |  |
| `src/engine/content/guide/productions.ts#LOCKED` | 1 | prose | 0 | Pending |  |
| `src/engine/content/guide/productions.ts#MONTHS` | 12 | label | 0 | Pending |  |
| `src/engine/content/guide/productions.ts#clock` | 2 | prose | 0 | Pending |  |
| `src/engine/content/guide/productions.ts#hoursOf` | 3 | label | 0 | Pending |  |
| `src/engine/content/guide/productions.ts#axisFact` | 2 | prose | 2 | Pending |  |
| `src/engine/content/guide/productions.ts#WOYZECK` | 1 | label | 0 | Pending |  |
| `src/engine/content/guide/productions.ts#W_TITLE` | 1 | label | 0 | Pending |  |
| `src/engine/content/guide/productions.ts#PLAY_CAST` | 1 | label | 0 | Pending |  |
| `src/engine/content/guide/productions.ts#PRODUCTIONS [productions.casting]` | 70 | label, prose | 2 | Pending |  |
| `src/engine/content/guide/productions.ts#PRODUCTIONS [prerequisite]` | 8 | prose | 0 | Pending |  |
| `src/engine/content/guide/productions.ts#PRODUCTIONS [immediate]` | 13 | prose | 0 | Pending |  |
| `src/engine/content/guide/productions.ts#PRODUCTIONS [scheduled]` | 3 | prose | 0 | Pending |  |
| `src/engine/content/guide/productions.ts#PRODUCTIONS [evaluation]` | 9 | prose | 3 | Pending |  |
| `src/engine/content/guide/productions.ts#PRODUCTIONS [optional]` | 5 | prose | 1 | Pending |  |
| `src/engine/content/guide/productions.ts#PRODUCTIONS [productions.part]` | 68 | label, prose | 1 | Pending |  |
| `src/engine/content/guide/productions.ts#PRODUCTIONS [productions.notes]` | 71 | label, prose | 0 | Pending |  |
| `src/engine/content/guide/productions.ts#PRODUCTIONS [history]` | 7 | prose | 0 | Pending |  |
| `src/engine/content/guide/productions.ts#PRODUCTIONS [productions.playing]` | 62 | label, prose | 14 | Pending |  |
| `src/engine/content/guide/productions.ts#PRODUCTIONS [productions.nights]` | 81 | label, prose | 3 | Pending |  |
| `src/engine/content/guide/productions.ts#PRODUCTIONS [productions.cabaret]` | 67 | label, prose | 1 | Pending |  |
| `src/engine/content/guide/productions.ts#PRODUCTIONS [productions.plays]` | 58 | label, prose | 0 | Pending |  |
| `src/engine/content/guide/school.ts#OPENED` | 1 | label | 0 | Pending |  |
| `src/engine/content/guide/school.ts#LOCKED` | 1 | prose | 0 | Pending |  |
| `src/engine/content/guide/school.ts#MONTHS` | 12 | label | 0 | Pending |  |
| `src/engine/content/guide/school.ts#MAKE_UP` | 1 | label | 0 | Pending |  |
| `src/engine/content/guide/school.ts#clock` | 2 | prose | 0 | Pending |  |
| `src/engine/content/guide/school.ts#season` | 1 | label | 0 | Pending |  |
| `src/engine/content/guide/school.ts#FAMILY_MONEY` | 1 | prose | 0 | Pending |  |
| `src/engine/content/guide/school.ts#LENGTH_WORD` | 3 | label | 0 | Pending |  |
| `src/engine/content/guide/school.ts#SHARE_WORD` | 2 | label | 0 | Pending |  |
| `src/engine/content/guide/school.ts#REBATE` | 1 | label | 0 | Pending |  |
| `src/engine/content/guide/school.ts#WITHDRAWN_EARLY` | 4 | prose | 0 | Pending |  |
| `src/engine/content/guide/school.ts#BY_TERM` | 1 | label | 0 | Pending |  |
| `src/engine/content/guide/school.ts#SCHOOL [school.standing]` | 74 | label, prose | 3 | Pending |  |
| `src/engine/content/guide/school.ts#SCHOOL [evaluation]` | 8 | prose | 0 | Pending |  |
| `src/engine/content/guide/school.ts#SCHOOL [immediate]` | 9 | prose | 0 | Pending |  |
| `src/engine/content/guide/school.ts#SCHOOL [scheduled]` | 11 | prose | 0 | Pending |  |
| `src/engine/content/guide/school.ts#SCHOOL [school.sick]` | 54 | label, prose | 1 | Pending |  |
| `src/engine/content/guide/school.ts#SCHOOL [prerequisite]` | 8 | prose | 0 | Pending |  |
| `src/engine/content/guide/school.ts#SCHOOL [history]` | 5 | prose | 0 | Pending |  |
| `src/engine/content/guide/school.ts#SCHOOL [school.orientation]` | 50 | label, prose | 0 | Pending |  |
| `src/engine/content/guide/school.ts#SCHOOL [school.leave]` | 92 | label, prose | 2 | Pending |  |
| `src/engine/content/guide/school.ts#SCHOOL [school.repeat]` | 80 | label, prose | 2 | Pending |  |
| `src/engine/content/guide/school.ts#SCHOOL [optional]` | 2 | prose | 0 | Pending |  |
| `src/engine/content/guide/school.ts#SCHOOL [school.money]` | 77 | label, prose | 0 | Pending |  |
| `src/engine/content/guide/school.ts#SCHOOL [school.shifts]` | 65 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [seagull-4]` | 5 | label, prose | 1 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [dollhouse-3]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [earnest-2]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [vanya-2]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [trifles]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [julie]` | 7 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [cherry-orchard-4]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [pygmalion-4]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [playboy-3]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [machinal-2]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [muchado-4-1]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [romeo-2-2]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [macbeth-1-7]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [twelfth-1-5]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [shrew-2-1]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [scandal-2-1]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [richard3-1-2]` | 7 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [hamlet-3-1]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [othello-4-3]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [measure-2-4]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [antigone-441]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [oedipus-300]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [electra-328]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [medea-446]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [bacchae-451]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [agamemnon-855]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [hedda-2]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [arms-1]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [proposal]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [windermere-1]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [suppressed-2]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [rising-moon]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [creditors]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [anna-christie-1]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [hamlet-3-4]` | 8 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [caesar-4-3]` | 7 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [caesar-2-1]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [lear-4-7]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [asyoulike-3-2]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [dream-3-2]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [twelfth-2-4]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [faustus-3]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [malfi-1]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [wayoftheworld-4]` | 7 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [stoops-2]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [ghosts-1]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [masterbuilder-1]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [riders-sea]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [orig-night-desk]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [orig-bed-fourteen]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [orig-what-we-keep]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [orig-runway]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [orig-hundred-questions]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [orig-office-hours]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [orig-two-time-zones]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [orig-the-reception]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [enemy-2]` | 7 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [strife-1]` | 9 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [justice-2]` | 8 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [weavers-1]` | 10 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [caesar-3-2]` | 10 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [henry5-4-3]` | 7 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [oedipus-1]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [dream-5-1]` | 9 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [scapin-3-2]` | 11 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [enemy-4]` | 9 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#SCENE_MATERIAL [strife-2-2]` | 9 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#PLAY_MATERIAL [Hedda Gabler]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#PLAY_MATERIAL [The Importance Of Being Earnest]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#PLAY_MATERIAL [Woyzeck]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#PLAY_MATERIAL [Three Sisters]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#PLAY_MATERIAL [Blood Wedding]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#PLAY_MATERIAL [The Cherry Orchard]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#PLAY_MATERIAL [Major Barbara]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#PLAY_MATERIAL [Ghosts]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#PLAY_MATERIAL [The Wild Duck]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#PLAY_MATERIAL [Spring Awakening]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#PLAY_MATERIAL [Twelfth Night]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#PLAY_MATERIAL [Measure For Measure]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#PLAY_MATERIAL [The Winter’s Tale]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#PLAY_MATERIAL [Julius Caesar]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#PLAY_MATERIAL [A Midsummer Night’s Dream]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#PLAY_MATERIAL [Macbeth]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#PLAY_MATERIAL [As You Like It]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#PLAY_MATERIAL [Much Ado About Nothing]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#PLAY_MATERIAL [A Doll’s House]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#PLAY_MATERIAL [Uncle Vanya]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#PLAY_MATERIAL [Tartuffe]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#PLAY_MATERIAL [An Enemy Of The People]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#PLAY_MATERIAL [The Playboy Of The Western World]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#PLAY_MATERIAL [Mrs Warren’s Profession]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#PLAY_MATERIAL [Miss Julie]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#PLAY_MATERIAL [Trifles]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#PLAY_MATERIAL [The Bear]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#PLAY_MATERIAL [A Marriage Proposal]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#PLAY_MATERIAL [Riders To The Sea]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/material.ts#PLAY_MATERIAL [Salomé]` | 4 | prose | 0 | Pending |  |
| `src/engine/content/material.ts#SELF_TAPE_MATERIAL [self-tape]` | 3 | label, prose | 1 | Pending |  |
| `src/engine/content/plays.ts#THESIS_PLAYS` | 110 | label | 0 | Pending |  |
| `src/engine/content/plays.ts#SHAKESPEARE_PLAYS` | 103 | label | 0 | Pending |  |
| `src/engine/content/plays.ts#REP_PLAYS` | 58 | label | 0 | Pending |  |
| `src/engine/content/plays.ts#SUMMER_PLAYS` | 34 | label | 0 | Pending |  |
| `src/engine/content/plays.ts#SIZE_WORD` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/plays.ts#PLAY_ALIASES` | 1 | label | 0 | Pending |  |
| `src/engine/content/replacements.ts#LICENSE_REPLACEMENT` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/roundups.ts#DROPPED_UNSAID` | 1 | prose | 0 | Pending |  |
| `src/engine/content/roundups.ts#OFF` | 1 | prose | 1 | Pending |  |
| `src/engine/content/roundups.ts#ROUND_UPS .us-bank-of-america` | 7 | label, prose | 0 | Pending |  |
| `src/engine/content/roundups.ts#ROUND_UPS .us-wells-fargo` | 8 | label, prose | 0 | Pending |  |
| `src/engine/content/roundups.ts#ROUND_UPS .us-citi` | 7 | label, prose | 1 | Pending |  |
| `src/engine/content/roundups.ts#ROUND_UPS .fr-lcl` | 9 | label, prose | 0 | Pending |  |
| `src/engine/content/roundups.ts#ROUND_UPS .gb-lloyds` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/roundups.ts#ROUND_UPS .gb-natwest` | 7 | label, prose | 0 | Pending |  |
| `src/engine/content/roundups.ts#ROUND_UPS .de-ing` | 7 | label, prose | 0 | Pending |  |
| `src/engine/content/roundups.ts#ROUND_UPS .ca-scotiabank` | 9 | label, prose | 0 | Pending |  |
| `src/engine/content/roundups.ts#ROUND_UPS .ca-td` | 7 | label, prose | 0 | Pending |  |
| `src/engine/content/roundups.ts#ROUND_UPS .mx-bbva` | 7 | label, prose | 0 | Pending |  |
| `src/engine/content/roundups.ts#ROUND_UPS .mx-santander` | 8 | label, prose | 1 | Pending |  |
| `src/engine/content/roundups.ts#ROUND_UPS .kr-kakaobank` | 7 | label, prose | 0 | Pending |  |
| `src/engine/content/roundups.ts#ROUND_UPS .es-santander` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/roundups.ts#ROUND_UPS .es-bbva` | 7 | label, prose | 0 | Pending |  |
| `src/engine/content/roundups.ts#ROUND_UPS .es-sabadell` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/roundups.ts#ROUND_UPS .es-bankinter` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/roundups.ts#ROUND_UPS .is-landsbankinn` | 9 | label, prose | 0 | Pending |  |
| `src/engine/content/roundups.ts#ROUND_UPS .is-islandsbanki` | 8 | label, prose | 0 | Pending |  |
| `src/engine/content/roundups.ts#ROUND_UPS .au-anz` | 7 | label, prose | 0 | Pending |  |
| `src/engine/content/roundups.ts#ROUND_UPS .nz-asb` | 8 | label, prose | 0 | Pending |  |
| `src/engine/content/school.ts#YALE_DRAMA` | 8 | label, prose | 0 | Pending |  |
| `src/engine/content/school.ts#COST_2026_27` | 1 | prose | 0 | Pending |  |
| `src/engine/content/school.ts#SKILLS [accents]` | 1 | label | 0 | Pending |  |
| `src/engine/content/school.ts#SKILLS [audition]` | 1 | label | 0 | Pending |  |
| `src/engine/content/school.ts#SKILLS [character]` | 1 | label | 0 | Pending |  |
| `src/engine/content/school.ts#SKILLS [classical]` | 1 | label | 0 | Pending |  |
| `src/engine/content/school.ts#SKILLS [clown]` | 1 | label | 0 | Pending |  |
| `src/engine/content/school.ts#SKILLS [coldReading]` | 1 | label | 0 | Pending |  |
| `src/engine/content/school.ts#SKILLS [comedy]` | 1 | label | 0 | Pending |  |
| `src/engine/content/school.ts#SKILLS [dance]` | 1 | label | 0 | Pending |  |
| `src/engine/content/school.ts#SKILLS [emotion]` | 1 | label | 0 | Pending |  |
| `src/engine/content/school.ts#SKILLS [improv]` | 1 | label | 0 | Pending |  |
| `src/engine/content/school.ts#SKILLS [intimacy]` | 1 | label | 0 | Pending |  |
| `src/engine/content/school.ts#SKILLS [memorization]` | 1 | label | 0 | Pending |  |
| `src/engine/content/school.ts#SKILLS [screen]` | 1 | label | 0 | Pending |  |
| `src/engine/content/school.ts#SKILLS [movement]` | 1 | label | 0 | Pending |  |
| `src/engine/content/school.ts#SKILLS [scene]` | 1 | label | 0 | Pending |  |
| `src/engine/content/school.ts#SKILLS [script]` | 1 | label | 0 | Pending |  |
| `src/engine/content/school.ts#SKILLS [singing]` | 1 | label | 0 | Pending |  |
| `src/engine/content/school.ts#SKILLS [speech]` | 1 | label | 0 | Pending |  |
| `src/engine/content/school.ts#SKILLS [combat]` | 1 | label | 0 | Pending |  |
| `src/engine/content/school.ts#SKILLS [voice]` | 1 | label | 0 | Pending |  |
| `src/engine/content/school.ts#SKILLS [voiceover]` | 1 | label | 0 | Pending |  |
| `src/engine/content/school.ts#COURSES` | 105 | label, prose | 0 | Pending |  |
| `src/engine/content/school.ts#WORK_STUDY` | 1 | label | 0 | Pending |  |
| `src/engine/content/school.ts#SEAGULL_2027` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/school.ts#SCHOOL_POLICIES` | 9 | prose | 0 | Pending |  |
| `src/engine/content/school.ts#LABS` | 3 | label | 0 | Pending |  |
| `src/engine/content/school.ts#LEAVE_RULES` | 1 | prose | 1 | Pending |  |
| `src/engine/content/school.ts#MANDATORY_LEAVE` | 1 | prose | 1 | Pending |  |
| `src/engine/content/school.ts#EXTENDED_STUDY` | 1 | prose | 1 | Pending |  |
| `src/engine/content/tasks.ts#DIMENSION_LABEL` | 6 | label | 0 | Pending |  |
| `src/engine/content/tasks.ts#DIMENSION_MEANS` | 6 | prose | 0 | Pending |  |
| `src/engine/content/tasks.ts#COURSEWORK_PREP` | 6 | label | 0 | Pending |  |
| `src/engine/content/tasks.ts#TASK_PROFILES [scene]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/tasks.ts#TASK_PROFILES [written]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/tasks.ts#TASK_PROFILES [voice]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/tasks.ts#TASK_PROFILES [song]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/tasks.ts#TASK_PROFILES [movement]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/tasks.ts#TASK_PROFILES [partnered]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/tasks.ts#TASK_PROFILES [improvisation]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/tasks.ts#TASK_PROFILES [clown]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/tasks.ts#TASK_PROFILES [camera]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/tasks.ts#TASK_PROFILES [tape]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/tasks.ts#TASK_PROFILES [tapeOnFeet]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/tasks.ts#TASK_PROFILES [audition]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/tasks.ts#TASK_PROFILES [performance]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/workbook.ts#ADJUSTMENTS [work-beat]` | 2 | label, prose | 1 | Pending |  |
| `src/engine/content/workbook.ts#ADJUSTMENTS [run-into]` | 2 | label, prose | 1 | Pending |  |
| `src/engine/content/workbook.ts#ADJUSTMENTS [beat-way]` | 2 | label, prose | 2 | Pending |  |
| `src/engine/content/workbook.ts#ADJUSTMENTS [breathe]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/workbook.ts#ADJUSTMENTS [objective]` | 2 | label, prose | 1 | Pending |  |
| `src/engine/content/workbook.ts#ADJUSTMENTS [with-partner]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/workload.ts#RUNNING_TIMES` | 30 | prose | 0 | Pending |  |
| `src/engine/content/workload.ts#UNNAMED_RUNNING` | 4 | prose | 3 | Pending |  |
| `src/engine/systems/briefs.ts#BRIEF` | 6 | label, prose | 0 | Pending |  |
| `src/engine/systems/briefs.ts#READER_PLAYS` | 4 | label | 0 | Pending |  |
| `src/engine/systems/briefs.ts#PURPOSE_WORDS` | 6 | prose | 0 | Pending |  |
| `src/engine/systems/briefs.ts#hourRefusal` | 3 | prose | 0 | Pending |  |
| `src/engine/systems/briefs.ts#prepareRefusal` | 5 | prose | 0 | Pending |  |
| `src/engine/systems/briefs.ts#chooseRefusal` | 2 | prose | 0 | Pending |  |
| `src/engine/systems/briefs.ts#tapeRefusal` | 5 | prose | 1 | Pending |  |
| `src/engine/systems/briefs.ts#readerRead` | 1 | label | 0 | Pending |  |
| `src/engine/systems/briefs.ts#readerRefusal` | 4 | prose | 0 | Pending |  |
| `src/engine/systems/briefs.ts#chooseReader` | 1 | label | 0 | Pending |  |
| `src/engine/systems/briefs.ts#callbackFor` | 1 | prose | 0 | Pending |  |
| `src/engine/systems/briefs.ts#tapeBrief` | 1 | label | 0 | Pending |  |
| `src/engine/systems/briefs.ts#suggestions` | 9 | label, prose | 0 | Pending |  |
| `src/engine/systems/classmates.ts#PRIORITY_WORDS` | 4 | label | 0 | Pending |  |
| `src/engine/systems/classmates.ts#boundaryRefusal` | 1 | prose | 0 | Pending |  |
| `src/engine/systems/classmates.ts#classMoment [help]` | 3 | prose | 0 | Pending |  |
| `src/engine/systems/classmates.ts#classMoment [encouragement]` | 1 | prose | 0 | Pending |  |
| `src/engine/systems/classmates.ts#classMoment [apology]` | 3 | prose | 0 | Pending |  |
| `src/engine/systems/classmates.ts#classMoment [boundary]` | 1 | prose | 0 | Pending |  |
| `src/engine/systems/classmates.ts#classMoment` | 1 | label | 0 | Pending |  |
| `src/engine/systems/classmates.ts#MOMENT_TITLE` | 6 | label, prose | 0 | Pending |  |
| `src/engine/systems/classmates.ts#disagreement` | 2 | prose | 0 | Pending |  |
| `src/engine/systems/classmates.ts#studyEvening` | 2 | prose | 0 | Pending |  |
| `src/engine/systems/classmates.ts#CHOICES [hold]` | 1 | label | 0 | Pending |  |
| `src/engine/systems/classmates.ts#CHOICES [theirs]` | 1 | label | 0 | Pending |  |
| `src/engine/systems/classmates.ts#CHOICES [both]` | 1 | label | 0 | Pending |  |
| `src/engine/systems/classmates.ts#CHOICES [yes]` | 1 | label | 0 | Pending |  |
| `src/engine/systems/classmates.ts#CHOICES [no]` | 2 | label | 0 | Pending |  |
| `src/engine/systems/classmates.ts#CHOICES [help]` | 1 | label | 0 | Pending |  |
| `src/engine/systems/classmates.ts#CHOICES [accept]` | 1 | label | 0 | Pending |  |
| `src/engine/systems/classmates.ts#CHOICES [cool]` | 1 | label | 0 | Pending |  |
| `src/engine/systems/classmates.ts#CHOICES [respect]` | 1 | label | 0 | Pending |  |
| `src/engine/systems/classmates.ts#CHOICES [argue]` | 1 | label | 0 | Pending |  |
| `src/engine/systems/classmates.ts#respondRefusal` | 8 | prose | 0 | Pending |  |
| `src/engine/systems/classmates.ts#lapse` | 1 | prose | 0 | Pending |  |
| `src/engine/systems/classmates.ts#amendsRefusal` | 2 | prose | 0 | Pending |  |
| `src/engine/systems/classmates.ts#registerClassmates <school.respond>` | 26 | label, prose, refusal | 0 | Pending |  |
| `src/engine/systems/classmates.ts#registerClassmates <school.make_amends>` | 1 | label | 0 | Pending |  |
| `src/engine/systems/classmates.ts#registerClassmates` | 9 | label, prose | 0 | Pending |  |
| `src/engine/systems/courserecord.ts#LAB_CODES` | 3 | label | 0 | Pending |  |
| `src/engine/systems/courserecord.ts#settleCourses` | 3 | prose | 0 | Pending |  |
| `src/engine/systems/courserecord.ts#tellFails` | 2 | label, prose | 0 | Pending |  |
| `src/engine/systems/courserecord.ts#remedy` | 3 | prose | 0 | Pending |  |
| `src/engine/systems/courserecord.ts#scheduleDue` | 2 | label | 0 | Pending |  |
| `src/engine/systems/courserecord.ts#extendRefusal` | 3 | prose | 0 | Pending |  |
| `src/engine/systems/courserecord.ts#makeUpRefusal` | 3 | prose | 0 | Pending |  |
| `src/engine/systems/courserecord.ts#registerCourseRecord <school.make_up>` | 1 | label | 0 | Pending |  |
| `src/engine/systems/courserecord.ts#registerCourseRecord` | 5 | label, prose | 0 | Pending |  |
| `src/engine/systems/coursework.ts#afterTogether` | 1 | prose | 0 | Pending |  |
| `src/engine/systems/coursework.ts#BAND_LABEL` | 4 | label | 0 | Pending |  |
| `src/engine/systems/coursework.ts#ORIENTATION [register]` | 1 | label | 0 | Pending |  |
| `src/engine/systems/coursework.ts#ORIENTATION [classmates]` | 1 | label | 0 | Pending |  |
| `src/engine/systems/coursework.ts#ORIENTATION [faculty]` | 1 | label | 0 | Pending |  |
| `src/engine/systems/coursework.ts#ORIENTATION [tour]` | 1 | label | 0 | Pending |  |
| `src/engine/systems/coursework.ts#ORIENTATION [expectations]` | 1 | label | 0 | Pending |  |
| `src/engine/systems/coursework.ts#mateBusy` | 5 | prose | 0 | Pending |  |
| `src/engine/systems/coursework.ts#setWork` | 5 | label, prose | 0 | Pending |  |
| `src/engine/systems/coursework.ts#needRefusal` | 3 | prose | 0 | Pending |  |
| `src/engine/systems/coursework.ts#approachRefusal` | 9 | prose | 0 | Pending |  |
| `src/engine/systems/coursework.ts#READER` | 1 | label | 0 | Pending |  |
| `src/engine/systems/coursework.ts#tableWorkRefusal` | 1 | prose | 0 | Pending |  |
| `src/engine/systems/coursework.ts#prepareRefusal` | 10 | prose | 0 | Pending |  |
| `src/engine/systems/coursework.ts#revisitWords` | 3 | prose | 0 | Pending |  |
| `src/engine/systems/coursework.ts#noteText` | 8 | label, prose | 0 | Pending |  |
| `src/engine/systems/coursework.ts#feedbackWords` | 5 | label, prose | 0 | Pending |  |
| `src/engine/systems/coursework.ts#playingRefusal` | 4 | prose | 0 | Pending |  |
| `src/engine/systems/coursework.ts#show` | 7 | label, prose | 0 | Pending |  |
| `src/engine/systems/coursework.ts#remedyWords` | 4 | label, prose | 0 | Pending |  |
| `src/engine/systems/coursework.ts#termWarning` | 12 | label, prose | 2 | Pending |  |
| `src/engine/systems/coursework.ts#meetingWeight` | 16 | label, prose | 0 | Pending |  |
| `src/engine/systems/coursework.ts#orient` | 8 | prose | 0 | Pending |  |
| `src/engine/systems/coursework.ts#orientationRefusal` | 5 | prose | 0 | Pending |  |
| `src/engine/systems/coursework.ts#askRefusal` | 12 | prose | 0 | Pending |  |
| `src/engine/systems/coursework.ts#rehearsalOutcome` | 10 | label, prose | 0 | Pending |  |
| `src/engine/systems/coursework.ts#peerNote` | 5 | prose | 0 | Pending |  |
| `src/engine/systems/coursework.ts#partnerAsks` | 2 | label, prose | 0 | Pending |  |
| `src/engine/systems/coursework.ts#answerRefusal` | 5 | label, prose | 0 | Pending |  |
| `src/engine/systems/coursework.ts#book` | 1 | label | 0 | Pending |  |
| `src/engine/systems/coursework.ts#registerCoursework <school.approach>` | 1 | refusal | 0 | Pending |  |
| `src/engine/systems/coursework.ts#registerCoursework <school.choose>` | 5 | refusal | 0 | Pending |  |
| `src/engine/systems/coursework.ts#registerCoursework <school.read_feedback>` | 2 | refusal | 0 | Pending |  |
| `src/engine/systems/coursework.ts#registerCoursework <school.ask_partner>` | 1 | label | 0 | Pending |  |
| `src/engine/systems/coursework.ts#registerCoursework <school.answer_partner>` | 1 | prose | 0 | Pending |  |
| `src/engine/systems/coursework.ts#registerCoursework` | 3 | label, prose | 0 | Pending |  |
| `src/engine/systems/coursework.ts#registerCoursework <school.cancel_rehearsal>` | 3 | label, prose, refusal | 0 | Pending |  |
| `src/engine/systems/ensemble.ts#sharedOf` | 1 | label | 0 | Pending |  |
| `src/engine/systems/ensemble.ts#sharedWords` | 7 | label, prose | 0 | Pending |  |
| `src/engine/systems/evaluation.ts#judgeExact` | 4 | label | 0 | Pending |  |
| `src/engine/systems/evaluation.ts#judgeExact [difficulty]` | 1 | label | 0 | Pending |  |
| `src/engine/systems/evaluation.ts#judgeExact [preparation]` | 1 | label | 1 | Pending |  |
| `src/engine/systems/evaluation.ts#halfOf` | 2 | label | 0 | Pending |  |
| `src/engine/systems/evaluation.ts#chiefLimit` | 6 | label, prose | 0 | Pending |  |
| `src/engine/systems/leave.ts#LEAVE_REASONS [medical]` | 3 | label | 0 | Pending |  |
| `src/engine/systems/leave.ts#LEAVE_REASONS [personal]` | 4 | label | 0 | Pending |  |
| `src/engine/systems/leave.ts#tellOutsideTheCover` | 4 | label, prose | 0 | Pending |  |
| `src/engine/systems/leave.ts#leaveLengths` | 2 | prose | 0 | Pending |  |
| `src/engine/systems/leave.ts#clearedToReturn` | 4 | prose | 0 | Pending |  |
| `src/engine/systems/leave.ts#leaveRefusal` | 15 | prose | 0 | Pending |  |
| `src/engine/systems/leave.ts#requestLeave` | 2 | label, refusal | 0 | Pending |  |
| `src/engine/systems/leave.ts#startLeave` | 25 | label, prose | 1 | Pending |  |
| `src/engine/systems/leave.ts#returnFromLeave` | 2 | label, prose | 0 | Pending |  |
| `src/engine/systems/leave.ts#followFormerClasses` | 5 | label, prose | 0 | Pending |  |
| `src/engine/systems/leave.ts#joinCohort` | 2 | label, prose | 0 | Pending |  |
| `src/engine/systems/leave.ts#facultyReview` | 6 | label, prose | 0 | Pending |  |
| `src/engine/systems/leave.ts#extraRefusal` | 8 | prose | 0 | Pending |  |
| `src/engine/systems/leave.ts#welfareTrigger` | 2 | label, prose | 0 | Pending |  |
| `src/engine/systems/leave.ts#considerWelfare` | 3 | label, prose | 0 | Pending |  |
| `src/engine/systems/leave.ts#assess` | 4 | prose | 0 | Pending |  |
| `src/engine/systems/leave.ts#rescindable` | 3 | label, prose | 0 | Pending |  |
| `src/engine/systems/leave.ts#rescind` | 2 | label, prose | 0 | Pending |  |
| `src/engine/systems/leave.ts#billUnsupportedTerm` | 10 | label, prose | 0 | Pending |  |
| `src/engine/systems/leave.ts#yaleAccount [loan]` | 2 | label | 0 | Pending |  |
| `src/engine/systems/leave.ts#liftHold` | 3 | label, prose | 0 | Pending |  |
| `src/engine/systems/leave.ts#holdsOverNothing` | 2 | label, prose | 0 | Pending |  |
| `src/engine/systems/leave.ts#creditAccount` | 4 | label, prose | 0 | Pending |  |
| `src/engine/systems/leave.ts#aidReviewRefusal` | 4 | prose | 0 | Pending |  |
| `src/engine/systems/leave.ts#bankShortWords` | 4 | prose | 0 | Pending |  |
| `src/engine/systems/leave.ts#payBalanceRefusal` | 3 | prose | 0 | Pending |  |
| `src/engine/systems/leave.ts#payBalance` | 2 | label, prose | 0 | Pending |  |
| `src/engine/systems/leave.ts#accountDue` | 5 | label, prose | 0 | Pending |  |
| `src/engine/systems/leave.ts#disqualified` | 3 | prose | 0 | Pending |  |
| `src/engine/systems/leave.ts#repeatRefusal` | 11 | prose | 0 | Pending |  |
| `src/engine/systems/leave.ts#cancelRepeatWarning` | 3 | prose | 0 | Pending |  |
| `src/engine/systems/leave.ts#requestRepeat` | 1 | label | 0 | Pending |  |
| `src/engine/systems/leave.ts#offerRepeat` | 5 | label, prose | 0 | Pending |  |
| `src/engine/systems/leave.ts#registerLeave <school.request_leave>` | 1 | refusal | 0 | Pending |  |
| `src/engine/systems/leave.ts#registerLeave` | 52 | label, prose | 3 | Pending |  |
| `src/engine/systems/leave.ts#registerLeave <school.appeal_leave>` | 4 | label, refusal | 0 | Pending |  |
| `src/engine/systems/leave.ts#registerLeave <school.request_extra_term>` | 2 | label, refusal | 0 | Pending |  |
| `src/engine/systems/leave.ts#registerLeave <school.request_aid_review>` | 2 | label, refusal | 0 | Pending |  |
| `src/engine/systems/leave.ts#registerLeave <school.cancel_leave>` | 5 | refusal | 0 | Pending |  |
| `src/engine/systems/leave.ts#registerLeave <school.return_notice>` | 3 | refusal | 0 | Pending |  |
| `src/engine/systems/leave.ts#registerLeave <school.buy_affiliate>` | 8 | prose, refusal | 0 | Pending |  |
| `src/engine/systems/leave.ts#registerLeave <school.reregister>` | 4 | refusal | 0 | Pending |  |
| `src/engine/systems/leave.ts#registerLeave <school.cancel_repeat>` | 3 | prose, refusal | 0 | Pending |  |
| `src/engine/systems/material.ts#misfitOf` | 3 | label, prose | 0 | Pending |  |
| `src/engine/systems/piece.ts#segmentNames` | 5 | label | 0 | Pending |  |
| `src/engine/systems/piece.ts#judgePieceExact` | 2 | label | 0 | Pending |  |
| `src/engine/systems/playreading.ts#copyAt` | 3 | label, prose | 0 | Pending |  |
| `src/engine/systems/playreading.ts#aspects [form]` | 1 | prose | 0 | Pending |  |
| `src/engine/systems/playreading.ts#aspects [cast]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/systems/playreading.ts#aspects [setting]` | 1 | prose | 0 | Pending |  |
| `src/engine/systems/playreading.ts#readRefusal` | 1 | prose | 0 | Pending |  |
| `src/engine/systems/playreading.ts#researchRefusal` | 2 | prose | 0 | Pending |  |
| `src/engine/systems/playreading.ts#registerPlayReading <plays.read>` | 6 | label, prose, refusal | 0 | Pending |  |
| `src/engine/systems/playreading.ts#registerPlayReading <plays.research>` | 10 | label, prose | 0 | Pending |  |
| `src/engine/systems/production.ts#STAGE_LABEL` | 7 | label | 0 | Pending |  |
| `src/engine/systems/production.ts#partPlayingRefusal` | 2 | prose | 0 | Pending |  |
| `src/engine/systems/production.ts#noteText` | 5 | label, prose | 0 | Pending |  |
| `src/engine/systems/production.ts#noteWords` | 12 | label, prose | 0 | Pending |  |
| `src/engine/systems/production.ts#ownWorkRefusal` | 8 | prose | 0 | Pending |  |
| `src/engine/systems/production.ts#registerProduction <school.work_note>` | 3 | refusal | 0 | Pending |  |
| `src/engine/systems/production.ts#reflect` | 10 | label, prose | 0 | Pending |  |
| `src/engine/systems/school.ts#sickRefusal` | 5 | prose | 0 | Pending |  |
| `src/engine/systems/school.ts#STANDING_LABEL` | 7 | label | 0 | Pending |  |
| `src/engine/systems/school.ts#bondWord` | 3 | label | 0 | Pending |  |
| `src/engine/systems/school.ts#STIPEND_MEMO` | 1 | label | 0 | Pending |  |
| `src/engine/systems/school.ts#termLabel` | 2 | label | 0 | Pending |  |
| `src/engine/systems/school.ts#termBegins` | 3 | label | 0 | Pending |  |
| `src/engine/systems/school.ts#termWords` | 1 | label | 0 | Pending |  |
| `src/engine/systems/school.ts#CEILING` | 1 | prose | 0 | Pending |  |
| `src/engine/systems/school.ts#GIVEN_ACTRESS` | 12 | label | 0 | Pending |  |
| `src/engine/systems/school.ts#GIVEN_ACTOR` | 12 | label | 0 | Pending |  |
| `src/engine/systems/school.ts#FAMILY` | 24 | label | 0 | Pending |  |
| `src/engine/systems/school.ts#drawCohort` | 2 | label | 0 | Pending |  |
| `src/engine/systems/school.ts#CABARET_RUN` | 1 | label | 0 | Pending |  |
| `src/engine/systems/school.ts#formerCompanyRun` | 1 | label | 0 | Pending |  |
| `src/engine/systems/school.ts#classCabaret` | 1 | label | 0 | Pending |  |
| `src/engine/systems/school.ts#formerProductions` | 1 | label | 0 | Pending |  |
| `src/engine/systems/school.ts#ppeRefusal` | 2 | prose | 0 | Pending |  |
| `src/engine/systems/school.ts#buyPpe` | 1 | label | 0 | Pending |  |
| `src/engine/systems/school.ts#cabaretRefusal` | 7 | prose | 0 | Pending |  |
| `src/engine/systems/school.ts#summerRefusal` | 5 | prose | 0 | Pending |  |
| `src/engine/systems/school.ts#shiftRefusal` | 2 | prose | 0 | Pending |  |
| `src/engine/systems/school.ts#cabaretSeason` | 1 | label | 0 | Pending |  |
| `src/engine/systems/school.ts#enroll` | 2 | label, prose | 0 | Pending |  |
| `src/engine/systems/school.ts#planWeek` | 3 | label | 0 | Pending |  |
| `src/engine/systems/school.ts#conversionRefusal` | 7 | prose | 0 | Pending |  |
| `src/engine/systems/school.ts#bookPayday` | 1 | label | 0 | Pending |  |
| `src/engine/systems/school.ts#setStanding` | 18 | label, prose | 0 | Pending |  |
| `src/engine/systems/school.ts#leaveCabaret` | 2 | label, prose | 0 | Pending |  |
| `src/engine/systems/school.ts#missedCallsOut` | 2 | label, prose | 0 | Pending |  |
| `src/engine/systems/school.ts#breach` | 1 | prose | 0 | Pending |  |
| `src/engine/systems/school.ts#schoolProduction` | 4 | label | 0 | Pending |  |
| `src/engine/systems/school.ts#repProduction` | 3 | label | 0 | Pending |  |
| `src/engine/systems/school.ts#scheduleLabs` | 1 | label | 0 | Pending |  |
| `src/engine/systems/school.ts#companyPart` | 2 | label | 0 | Pending |  |
| `src/engine/systems/school.ts#companyRead` | 1 | label | 0 | Pending |  |
| `src/engine/systems/school.ts#NIGHT_WORD_TITLE` | 4 | label | 0 | Pending |  |
| `src/engine/systems/school.ts#directorsNote` | 4 | prose | 0 | Pending |  |
| `src/engine/systems/school.ts#teachersNotes` | 3 | prose | 0 | Pending |  |
| `src/engine/systems/school.ts#readRuns` | 1 | label | 0 | Pending |  |
| `src/engine/systems/school.ts#partsFor` | 1 | label | 0 | Pending |  |
| `src/engine/systems/school.ts#partLabel` | 2 | label | 0 | Pending |  |
| `src/engine/systems/school.ts#cast` | 20 | label, prose | 0 | Pending |  |
| `src/engine/systems/school.ts#termGrowth` | 3 | label | 0 | Pending |  |
| `src/engine/systems/school.ts#evaluate` | 15 | label, prose | 1 | Pending |  |
| `src/engine/systems/school.ts#conferIfReady` | 1 | prose | 0 | Pending |  |
| `src/engine/systems/school.ts#registerSchool` | 77 | label, prose | 0 | Pending |  |
| `src/engine/systems/school.ts#registerSchool <school.buy_ppe>` | 1 | refusal | 0 | Pending |  |
| `src/engine/systems/school.ts#registerSchool <school.request_conversion>` | 1 | label | 0 | Pending |  |
| `src/engine/systems/school.ts#registerSchool closeRun()` | 4 | label, prose | 0 | Pending |  |
| `src/engine/systems/school.ts#registerSchool <school.cabaret>` | 2 | label | 0 | Pending |  |
| `src/engine/systems/school.ts#registerSchool <school.summer_cabaret>` | 5 | label | 0 | Pending |  |
| `src/engine/systems/school.ts#registerSchool [summer]` | 2 | label | 0 | Pending |  |
| `src/engine/systems/school.ts#registerSchool <school.withdraw>` | 14 | label, prose, refusal | 0 | Pending |  |
| `src/engine/systems/school.ts#registerSchool <school.take_shift>` | 3 | label, refusal | 0 | Pending |  |
| `src/engine/systems/workbook.ts#problemsOf` | 5 | label, prose | 0 | Pending |  |
| `src/engine/systems/workbook.ts#problemsOf [segment]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/systems/workbook.ts#problemsOf [stamina]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/systems/workbook.ts#problemsOf [limit]` | 3 | label, prose | 2 | Pending |  |
| `src/engine/systems/workbook.ts#problemsOf [prep]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/systems/workbook.ts#problemsOf [objective]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/systems/workbook.ts#problemsOf [partner]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/systems/workbook.ts#identifyRefusal` | 3 | prose | 0 | Pending |  |
| `src/engine/systems/workbook.ts#tryRefusal` | 6 | prose | 0 | Pending |  |
| `src/engine/systems/workbook.ts#wayRefusal` | 3 | prose | 0 | Pending |  |
| `src/engine/systems/workbook.ts#settleRefusal` | 2 | prose | 0 | Pending |  |
| `src/engine/systems/workbook.ts#discoveriesOf` | 3 | prose | 1 | Pending |  |
| `src/engine/systems/workload.ts#runningOf` | 1 | label | 0 | Pending |  |
| `src/engine/systems/workload.ts#SIZE_WORDS` | 4 | label, prose | 0 | Pending |  |
| `src/engine/systems/workload.ts#workloadWords` | 4 | label, prose | 0 | Pending |  |
| `src/engine/systems/workpieces.ts#away` | 3 | prose | 0 | Pending |  |
| `src/engine/systems/workpieces.ts#briefWork` | 3 | label, prose | 0 | Pending |  |
| `src/engine/systems/workpieces.ts#sceneWork` | 1 | prose | 0 | Pending |  |
| `src/engine/systems/workpieces.ts#partWork` | 2 | label, prose | 0 | Pending |  |
| `src/ui/components/BriefPane.tsx#TONE` | 4 | label | 0 | Pending |  |
| `src/ui/components/BriefPane.tsx#ReaderChoice` | 8 | accessible, label, prose | 0 | Pending |  |
| `src/ui/components/BriefPane.tsx#studiedWords` | 1 | prose | 0 | Pending |  |
| `src/ui/components/BriefPane.tsx#readerPlaysWords` | 3 | label, prose | 2 | Pending |  |
| `src/ui/components/BriefPane.tsx#BriefPane` | 85 | accessible, attribute, label, prose | 12 | Pending |  |
| `src/ui/components/BriefPane.tsx#BriefPane step()` | 1 | prose | 0 | Pending |  |
| `src/ui/components/ClassMoments.tsx#ClassMoments` | 11 | accessible, attribute, label, prose | 1 | Pending |  |
| `src/ui/components/CourseworkPane.tsx#CourseworkPane` | 7 | accessible, label, prose | 0 | Pending |  |
| `src/ui/components/CourseworkPane.tsx#FirstWeek` | 7 | accessible, attribute, label, prose | 1 | Pending |  |
| `src/ui/components/CourseworkPane.tsx#AssignmentCard` | 18 | attribute, label, prose | 1 | Pending |  |
| `src/ui/components/CourseworkPane.tsx#TableWork` | 7 | label, prose | 1 | Pending |  |
| `src/ui/components/CourseworkPane.tsx#Rehearsals` | 28 | accessible, label, prose | 0 | Pending |  |
| `src/ui/components/CourseworkPane.tsx#FeedbackBlock` | 7 | label, prose | 0 | Pending |  |
| `src/ui/components/CourseworkPane.tsx#KIND_LABEL` | 5 | label | 0 | Pending |  |
| `src/ui/components/CourseworkPane.tsx#objectiveWhy` | 2 | prose | 0 | Pending |  |
| `src/ui/components/CourseworkPane.tsx#NotesLedger` | 5 | accessible, attribute, label, prose | 0 | Pending |  |
| `src/ui/components/CourseworkPane.tsx#Shown` | 11 | accessible, attribute, label | 0 | Pending |  |
| `src/ui/components/CourseworkPane.tsx#Partners` | 12 | accessible, attribute, label, prose | 0 | Pending |  |
| `src/ui/components/CourseworkPane.tsx#AnotherWay` | 5 | label, prose | 0 | Pending |  |
| `src/ui/components/PlayingChooser.tsx#LEVEL` | 4 | label | 0 | Pending |  |
| `src/ui/components/PlayingChooser.tsx#FEATURE_WORD` | 5 | label | 0 | Pending |  |
| `src/ui/components/PlayingChooser.tsx#LANGUAGE_WORD` | 3 | label | 0 | Pending |  |
| `src/ui/components/PlayingChooser.tsx#MaterialDemands` | 6 | label, prose | 0 | Pending |  |
| `src/ui/components/PlayingChooser.tsx#PlayingChooser` | 29 | label, prose | 8 | Pending |  |
| `src/ui/components/RehearsalProcess.tsx#DRESS_WORD` | 4 | label | 0 | Pending |  |
| `src/ui/components/RehearsalProcess.tsx#OUTCOME_WORD` | 3 | label | 0 | Pending |  |
| `src/ui/components/RehearsalProcess.tsx#noteState` | 2 | label | 0 | Pending |  |
| `src/ui/components/RehearsalProcess.tsx#RehearsalProcess` | 55 | accessible, attribute, label, prose | 2 | Pending |  |
| `src/ui/components/StudyPlanPanels.tsx#STATUS` | 9 | label | 0 | Pending |  |
| `src/ui/components/StudyPlanPanels.tsx#LeavePanel` | 75 | label, prose | 2 | Pending |  |
| `src/ui/components/StudyPlanPanels.tsx#at9` | 1 | label | 0 | Pending |  |
| `src/ui/components/StudyPlanPanels.tsx#DeanLeave` | 10 | label, prose | 0 | Pending |  |
| `src/ui/components/StudyPlanPanels.tsx#RepeatPanel` | 34 | label, prose | 0 | Pending |  |
| `src/ui/components/StudyPlanPanels.tsx#YaleAccountPanel` | 21 | attribute, label, prose | 1 | Pending |  |
| `src/ui/components/StudyPlanPanels.tsx#WorkLimitsBlock` | 16 | attribute, label, prose | 1 | Pending |  |
| `src/ui/components/StudyPlanPanels.tsx#ClassesPanel` | 20 | label, prose | 1 | Pending |  |
| `src/ui/components/WorkThrough.tsx#TONE` | 4 | label | 0 | Pending |  |
| `src/ui/components/WorkThrough.tsx#Segments` | 17 | label, prose | 0 | Pending |  |
| `src/ui/components/WorkThrough.tsx#WorkThrough` | 25 | label, prose | 1 | Pending |  |
| `src/ui/looks/classmate.tsx#top` | 21 | label, prose | 0 | Pending |  |
| `src/ui/looks/school.tsx#YEAR_WORD` | 3 | label | 0 | Pending |  |
| `src/ui/looks/school.tsx#STANDING_SAID` | 3 | label | 0 | Pending |  |
| `src/ui/looks/school.tsx#top` | 93 | attribute, label, prose | 6 | Pending |  |
| `src/ui/looks/school.tsx#STATUS_WORD` | 6 | label | 0 | Pending |  |
| `src/ui/workspaces/SchoolWorkspace.tsx#SchoolWorkspace` | 10 | accessible, attribute, label, prose | 0 | Pending |  |
| `src/ui/workspaces/SchoolWorkspace.tsx#SchoolTabs` | 2 | accessible, attribute | 0 | Pending |  |
| `src/ui/workspaces/SchoolWorkspace.tsx#StandingPane` | 53 | accessible, attribute, label, prose | 2 | Pending |  |
| `src/ui/workspaces/SchoolWorkspace.tsx#SLOTS` | 3 | prose | 0 | Pending |  |
| `src/ui/workspaces/SchoolWorkspace.tsx#WEEKDAYS` | 5 | label | 0 | Pending |  |
| `src/ui/workspaces/SchoolWorkspace.tsx#ClassesPane` | 29 | accessible, attribute, label, prose | 2 | Pending |  |
| `src/ui/workspaces/SchoolWorkspace.tsx#KIND_WORDS` | 7 | label | 0 | Pending |  |
| `src/ui/workspaces/SchoolWorkspace.tsx#nightsLine` | 2 | label | 0 | Pending |  |
| `src/ui/workspaces/SchoolWorkspace.tsx#NIGHT_WORD` | 4 | label | 0 | Pending |  |
| `src/ui/workspaces/SchoolWorkspace.tsx#SOURCE_WORD` | 4 | label | 0 | Pending |  |
| `src/ui/workspaces/SchoolWorkspace.tsx#CastReadPanel` | 14 | accessible, label, prose | 0 | Pending |  |
| `src/ui/workspaces/SchoolWorkspace.tsx#CastingPane` | 36 | accessible, attribute, label, prose | 1 | Pending |  |
| `src/ui/workspaces/SchoolWorkspace.tsx#CabaretPanel` | 12 | accessible, attribute, label, prose | 1 | Pending |  |
| `src/ui/workspaces/SchoolWorkspace.tsx#PoliciesPanel` | 2 | label | 0 | Pending |  |
| `src/ui/workspaces/SchoolWorkspace.tsx#CoursesPanel` | 26 | label, prose | 0 | Pending |  |
| `src/ui/workspaces/SchoolWorkspace.tsx#WithdrawControl` | 5 | label, prose | 0 | Pending |  |
| `src/ui/workspaces/SchoolWorkspace.tsx#SummerPanel` | 11 | accessible, label, prose | 1 | Pending |  |
| `src/ui/workspaces/SchoolWorkspace.tsx#WorkPane` | 19 | accessible, attribute, label, prose | 1 | Pending |  |
| `src/ui/workspaces/SchoolWorkspace.tsx#TermsPane` | 34 | accessible, attribute, label, prose | 3 | Pending |  |
| `src/ui/workspaces/SchoolWorkspace.tsx#PlaysToRead` | 21 | accessible, label, prose | 0 | Pending |  |

## Money, Banking, Payments, Fees, Holds, Statements And Transactions

| Source | Strings | Kinds | Engine-Speak | Status | Reason Or Evidence |
|---|---|---|---|---|---|
| `src/engine/content/accountlife.ts#ACCOUNT_LIFE` | 1 | prose | 1 | Pending |  |
| `src/engine/content/accountlife.ts#UNCLAIMED` | 1 | prose | 0 | Pending |  |
| `src/engine/content/bankopening.ts#OPENING` | 5 | prose | 3 | Pending |  |
| `src/engine/content/bankopening.ts#TRANSFERS` | 23 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-lending.ts#FR_LOAN` | 1 | prose | 0 | Pending |  |
| `src/engine/content/banks-lending.ts#FR_TERM` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-lending.ts#DE_LOAN` | 1 | prose | 0 | Pending |  |
| `src/engine/content/banks-lending.ts#DE_TERM` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-lending.ts#ES_LOAN` | 1 | prose | 0 | Pending |  |
| `src/engine/content/banks-lending.ts#ES_TERM` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-lending.ts#LENDING [per_item]` | 8 | prose | 0 | Pending |  |
| `src/engine/content/banks-lending.ts#LENDING .us-chase` | 1 | prose | 0 | Pending |  |
| `src/engine/content/banks-lending.ts#LENDING .us-bank-of-america` | 1 | prose | 0 | Pending |  |
| `src/engine/content/banks-lending.ts#LENDING .us-wells-fargo` | 2 | prose | 1 | Pending |  |
| `src/engine/content/banks-lending.ts#LENDING .us-citi` | 2 | prose | 1 | Pending |  |
| `src/engine/content/banks-lending.ts#LENDING .us-capital-one` | 3 | label, prose | 1 | Pending |  |
| `src/engine/content/banks-lending.ts#LENDING [arranged]` | 30 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-lending.ts#LENDING .ca-rbc` | 1 | prose | 0 | Pending |  |
| `src/engine/content/banks-lending.ts#LENDING .ca-td` | 1 | prose | 0 | Pending |  |
| `src/engine/content/banks-lending.ts#LENDING .ca-scotiabank` | 1 | prose | 0 | Pending |  |
| `src/engine/content/banks-lending.ts#LENDING .ca-bmo` | 1 | prose | 0 | Pending |  |
| `src/engine/content/banks-lending.ts#LENDING .ca-cibc` | 1 | prose | 0 | Pending |  |
| `src/engine/content/banks-lending.ts#LENDING .gb-barclays` | 1 | prose | 0 | Pending |  |
| `src/engine/content/banks-lending.ts#LENDING .gb-natwest` | 3 | label, prose | 1 | Pending |  |
| `src/engine/content/banks-lending.ts#LENDING .gb-hsbc` | 1 | prose | 1 | Pending |  |
| `src/engine/content/banks-lending.ts#LENDING .ie-aib` | 3 | label | 0 | Pending |  |
| `src/engine/content/banks-lending.ts#LENDING .ie-bank-of-ireland` | 3 | label | 0 | Pending |  |
| `src/engine/content/banks-lending.ts#LENDING .ie-ptsb` | 3 | label | 0 | Pending |  |
| `src/engine/content/banks-lending.ts#LENDING .is-landsbankinn` | 3 | label | 0 | Pending |  |
| `src/engine/content/banks-lending.ts#LENDING .is-arion` | 3 | label | 0 | Pending |  |
| `src/engine/content/banks-lending.ts#LENDING .is-islandsbanki` | 3 | label | 0 | Pending |  |
| `src/engine/content/banks-lending.ts#LENDING .de-deutsche-bank` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-lending.ts#LENDING .de-ing` | 3 | label | 0 | Pending |  |
| `src/engine/content/banks-lending.ts#LENDING [tacit]` | 4 | prose | 0 | Pending |  |
| `src/engine/content/banks-lending.ts#LENDING [secured]` | 1 | prose | 0 | Pending |  |
| `src/engine/content/banks-lending.ts#LENDING .jp-mufg` | 3 | label | 0 | Pending |  |
| `src/engine/content/banks-lending.ts#LENDING .jp-smbc` | 3 | label | 0 | Pending |  |
| `src/engine/content/banks-lending.ts#LENDING .jp-mizuho` | 3 | label | 0 | Pending |  |
| `src/engine/content/banks-lending.ts#LENDING .jp-resona` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-lending.ts#LENDING .jp-japan-post-bank` | 2 | label | 0 | Pending |  |
| `src/engine/content/banks-lending.ts#LENDING .kr-kb-kookmin` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-lending.ts#LENDING .kr-shinhan` | 2 | label | 0 | Pending |  |
| `src/engine/content/banks-lending.ts#LENDING .kr-hana` | 2 | label | 0 | Pending |  |
| `src/engine/content/banks-lending.ts#LENDING .kr-nh` | 2 | label | 0 | Pending |  |
| `src/engine/content/banks-lending.ts#LENDING .kr-kakaobank` | 3 | label | 0 | Pending |  |
| `src/engine/content/banks-lending.ts#LENDING .au-commbank` | 3 | label | 0 | Pending |  |
| `src/engine/content/banks-lending.ts#LENDING .au-westpac` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-lending.ts#LENDING .au-nab` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-lending.ts#LENDING .au-anz` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-lending.ts#LENDING .nz-anz` | 2 | label | 0 | Pending |  |
| `src/engine/content/banks-lending.ts#LENDING .nz-asb` | 2 | label | 0 | Pending |  |
| `src/engine/content/banks-lending.ts#LENDING [unarranged]` | 1 | prose | 0 | Pending |  |
| `src/engine/content/banks-lending.ts#LENDING .nz-bnz` | 2 | label | 0 | Pending |  |
| `src/engine/content/banks-lending.ts#LENDING .nz-westpac` | 2 | label | 0 | Pending |  |
| `src/engine/content/banks-lending.ts#LENDING .nz-kiwibank` | 2 | label | 0 | Pending |  |
| `src/engine/content/banks-lending.ts#SWITCHING` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#ARION_CARD_YEAR` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#NOT_FOUND` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN` | 22 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [us-chase]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [us-bank-of-america]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [us-wells-fargo]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [us-citi]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [us-capital-one]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [ca-rbc]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [ca-td]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [ca-scotiabank]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [ca-bmo]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [ca-cibc]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [mx-bbva]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [mx-banorte]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [mx-santander]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [mx-banamex]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [gb-barclays]` | 5 | label | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [gb-lloyds]` | 5 | label | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [gb-natwest]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [gb-hsbc]` | 5 | label | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [gb-santander]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [gb-nationwide]` | 4 | label | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [ie-aib]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [ie-bank-of-ireland]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [ie-ptsb]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [is-landsbankinn]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [is-arion]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [is-islandsbanki]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [fr-bnp-paribas]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [fr-societe-generale]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [fr-lcl]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [fr-credit-agricole]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [fr-la-banque-postale]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [de-deutsche-bank]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [de-commerzbank]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [de-postbank]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [de-ing]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [de-berliner-sparkasse]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [es-santander]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [es-bbva]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [es-caixabank]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [es-sabadell]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [es-bankinter]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [jp-mufg]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [jp-smbc]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [jp-mizuho]` | 5 | label | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [jp-resona]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [jp-japan-post-bank]` | 5 | label | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [kr-kb-kookmin]` | 5 | label | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [kr-shinhan]` | 5 | label | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [kr-hana]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [kr-nh]` | 5 | label | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [kr-kakaobank]` | 4 | label | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [au-commbank]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [au-westpac]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [au-nab]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [au-anz]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [nz-anz]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [nz-asb]` | 4 | label | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [nz-bnz]` | 3 | label | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [nz-westpac]` | 5 | label | 0 | Pending |  |
| `src/engine/content/banks-thirteen.ts#THIRTEEN [nz-kiwibank]` | 5 | label | 0 | Pending |  |
| `src/engine/content/banks-world-fees.ts#WORLD_FEES` | 22 | prose | 1 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .FI` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .AL` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .AD` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .AT` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .AZ` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .BH` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .BY` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .BE` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .BA` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .VG` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .BG` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .BI` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .CR` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .HR` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .CY` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .CZ` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .DK` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .DJ` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .DO` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .EG` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .SV` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .EE` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .FK` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .FO` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .FR` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .GE` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .GI` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .GR` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .GL` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .GT` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .GB` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .HN` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .HU` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .IQ` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .IL` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .IT` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .JO` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .KZ` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .XK` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .KW` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .LV` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .LB` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .LY` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .LI` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .LT` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .LU` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .MT` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .MR` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .MU` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .MD` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .MC` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .MN` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .ME` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .NI` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .MK` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .NO` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .OM` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .PK` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .PS` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .PL` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .PT` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .QA` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .RO` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .LC` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .SM` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .ST` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .SA` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .RS` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .SC` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .SK` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .SI` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .SO` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .SD` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .SE` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .CH` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .NL` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .TL` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .TR` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .UA` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .AE` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .VA` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_FORMATS .YE` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-iban.ts#IBAN_CODES` | 1 | prose | 1 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .AF` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .AX` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .AL` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .DZ` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .AS` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .AD` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .AO` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .AI` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .AG` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .AR` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .AM` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .AW` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .AT` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .AZ` | 2 | prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .BS` | 3 | label | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .BH` | 3 | label, prose | 1 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .BD` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .BB` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .BY` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .BE` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .BZ` | 3 | label | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .BJ` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .BM` | 8 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .BT` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .BO` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .BQ` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .BA` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .BW` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .BR` | 3 | label | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .VG` | 2 | label | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .BN` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .BG` | 2 | prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .BF` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .KH` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .CM` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .KY` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .TD` | 1 | prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .CL` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .CN` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .CO` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .KM` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .CG` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .CD` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .CK` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .CR` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .CI` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .HR` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .CW` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .CY` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .CZ` | 7 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .DK` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .DJ` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .DM` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .DO` | 7 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .EC` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .EG` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .SV` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .EE` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .SZ` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .ET` | 2 | prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .FO` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .FJ` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .FI` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .GF` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .PF` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .GA` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .GM` | 1 | prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .GE` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .GH` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .GI` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .GR` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .GL` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .GD` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .GP` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .GU` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .GT` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .GG` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .GN` | 2 | label | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .GW` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .GY` | 2 | label | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .HT` | 2 | label | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .HN` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .HK` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .HU` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .IN` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .ID` | 2 | prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .IR` | 1 | prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .IM` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .IL` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .IT` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .JM` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .JE` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .JO` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .KZ` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .KE` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .KI` | 2 | label | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .KW` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .LA` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .LV` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .LB` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .LS` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .LR` | 2 | label | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .LI` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .LT` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .LU` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .MO` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .MG` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .MW` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .MY` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .MV` | 3 | label | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .ML` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .MT` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .MH` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .MQ` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .MU` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .YT` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .FM` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .MD` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .MC` | 1 | prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .MN` | 2 | prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .ME` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .MS` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .MA` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .MZ` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .MM` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .NA` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .NP` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .NL` | 3 | label | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .NC` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .NI` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .NE` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .NG` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .NF` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .MK` | 2 | prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .MP` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .NO` | 2 | label | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .OM` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .PK` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .PW` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .PS` | 2 | label | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .PA` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .PG` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .PY` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .PE` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .PH` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .PL` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .PT` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .PR` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .QA` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .RE` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .RO` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .RU` | 1 | prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .RW` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .BL` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .SH` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .KN` | 2 | label | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .LC` | 2 | label | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .MF` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .PM` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .VC` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .WS` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .SM` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .ST` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .SA` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .SN` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .RS` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .SC` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .SL` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .SG` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .SX` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .SK` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .SI` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .SB` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .SO` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .ZA` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .SS` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .LK` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .SD` | 2 | label | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .SR` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .SJ` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .SE` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .CH` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .SY` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .TW` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .TZ` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .TH` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .TL` | 1 | label | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .TG` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .TO` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .TT` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .TN` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .TR` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .TC` | 2 | label | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .UG` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .UA` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .AE` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .UY` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .UZ` | 2 | label | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .VU` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .VE` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .VN` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .VI` | 2 | label | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .WF` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .EH` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .YE` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .ZM` | 5 | label | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .ZW` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world-sheets.ts#SHEETS .XK` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world.ts#ROWS` | 738 | label, prose | 0 | Pending |  |
| `src/engine/content/banks-world.ts#worldBanking` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/cards.ts#CARDS` | 1 | prose | 2 | Pending |  |
| `src/engine/content/cards.ts#CARD_LAW` | 1 | prose | 3 | Pending |  |
| `src/engine/content/cash.ts#CASH` | 1 | prose | 1 | Pending |  |
| `src/engine/content/currency.ts#RATES_NOTE` | 1 | prose | 0 | Pending |  |
| `src/engine/content/currency.ts#SYMBOLS` | 10 | label, prose | 0 | Pending |  |
| `src/engine/content/guide/money.ts#Fee` | 1 | label | 0 | Pending |  |
| `src/engine/content/guide/money.ts#businessDays` | 1 | label | 0 | Pending |  |
| `src/engine/content/guide/money.ts#chapter` | 1 | label | 0 | Pending |  |
| `src/engine/content/guide/money.ts#card` | 1 | label | 0 | Pending |  |
| `src/engine/content/guide/money.ts#clockOf` | 2 | label | 0 | Pending |  |
| `src/engine/content/guide/money.ts#CHASE_BANDS` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/guide/money.ts#MONEY [money.affairs]` | 58 | label, prose | 0 | Pending |  |
| `src/engine/content/guide/money.ts#MONEY [optional]` | 17 | prose | 0 | Pending |  |
| `src/engine/content/guide/money.ts#MONEY [evaluation]` | 3 | prose | 0 | Pending |  |
| `src/engine/content/guide/money.ts#MONEY [scheduled]` | 13 | prose | 2 | Pending |  |
| `src/engine/content/guide/money.ts#MONEY [bank.accounts]` | 65 | label, prose | 1 | Pending |  |
| `src/engine/content/guide/money.ts#MONEY [immediate]` | 21 | prose | 0 | Pending |  |
| `src/engine/content/guide/money.ts#MONEY [prerequisite]` | 8 | prose | 1 | Pending |  |
| `src/engine/content/guide/money.ts#MONEY [bank.transfer]` | 66 | label, prose | 0 | Pending |  |
| `src/engine/content/guide/money.ts#MONEY [bank.term]` | 61 | label, prose | 1 | Pending |  |
| `src/engine/content/guide/money.ts#MONEY [bank.upkeep]` | 69 | label, prose | 0 | Pending |  |
| `src/engine/content/guide/money.ts#MONEY [bank.round-ups]` | 59 | label, prose | 0 | Pending |  |
| `src/engine/content/guide/money.ts#MONEY [bank.payments]` | 76 | label, prose | 3 | Pending |  |
| `src/engine/content/guide/money.ts#MONEY [bank.cash]` | 64 | label, prose | 0 | Pending |  |
| `src/engine/content/guide/money.ts#MONEY [bank.card]` | 97 | label, prose | 4 | Pending |  |
| `src/engine/content/guide/money.ts#MONEY [bank.card-offers]` | 69 | label, prose | 0 | Pending |  |
| `src/engine/content/guide/money.ts#MONEY [bank.card-security]` | 76 | label, prose | 0 | Pending |  |
| `src/engine/content/guide/money.ts#MONEY [bank.borrowing]` | 79 | label, prose | 1 | Pending |  |
| `src/engine/content/guide/money.ts#MONEY [history]` | 1 | prose | 0 | Pending |  |
| `src/engine/content/guide/money.ts#MONEY [bank.other-banks]` | 81 | label, prose | 1 | Pending |  |
| `src/engine/content/guide/money.ts#MONEY [bank.home-account]` | 66 | label, prose | 4 | Pending |  |
| `src/engine/content/homeaccounts.ts#ASSUMED_WORDS` | 2 | prose | 2 | Pending |  |
| `src/engine/content/homeaccounts.ts#RETENTION_CONFIDENCE` | 3 | prose | 2 | Pending |  |
| `src/engine/content/homeaccounts.ts#READ` | 31 | prose | 2 | Pending |  |
| `src/engine/content/homeaccounts.ts#NEW_HERE` | 1 | prose | 0 | Pending |  |
| `src/engine/content/homeaccounts.ts#ABROAD` | 36 | label, prose | 0 | Pending |  |
| `src/engine/content/homeaccounts.ts#conditionOf` | 1 | prose | 0 | Pending |  |
| `src/engine/content/homeaccounts.ts#NON_RESIDENT_TAX` | 12 | prose | 0 | Pending |  |
| `src/engine/content/pending.ts#PENDING` | 1 | prose | 1 | Pending |  |
| `src/engine/content/rents.ts#PUBLISHED_RENTS` | 28 | label, prose | 0 | Pending |  |
| `src/engine/content/security.ts#SECURITY` | 1 | prose | 1 | Pending |  |
| `src/engine/content/security.ts#FRAUD_LAW` | 1 | prose | 1 | Pending |  |
| `src/engine/core/ledger.ts#Ledger` | 15 | label, prose | 0 | Pending |  |
| `src/engine/core/money.ts#formatMoney` | 1 | label | 0 | Pending |  |
| `src/engine/systems/accountlife.ts#unclaimedLaw` | 3 | label, prose | 0 | Pending |  |
| `src/engine/systems/accountlife.ts#breakQuote` | 2 | label, prose | 0 | Pending |  |
| `src/engine/systems/accountlife.ts#cancelWords` | 5 | label, prose | 0 | Pending |  |
| `src/engine/systems/accountlife.ts#cancelRefusal` | 5 | label, prose | 0 | Pending |  |
| `src/engine/systems/accountlife.ts#breakTerm` | 4 | label | 0 | Pending |  |
| `src/engine/systems/accountlife.ts#registerAccountLife <world.day_rollover>` | 5 | label, prose | 0 | Pending |  |
| `src/engine/systems/accountlife.ts#registerAccountLife <bank.set_term_end>` | 5 | refusal | 0 | Pending |  |
| `src/engine/systems/accountlife.ts#registerAccountLife <bank.break_term>` | 2 | refusal | 0 | Pending |  |
| `src/engine/systems/accountlife.ts#registerAccountLife` | 2 | label, prose | 0 | Pending |  |
| `src/engine/systems/accountlife.ts#registerAccountLife <bank.take_term_interest>` | 6 | label, refusal | 0 | Pending |  |
| `src/engine/systems/accountlife.ts#registerAccountLife <bank.reactivate>` | 1 | refusal | 0 | Pending |  |
| `src/engine/systems/accountlife.ts#registerAccountLife <bank.cancel_new>` | 8 | label, refusal | 0 | Pending |  |
| `src/engine/systems/accountlife.ts#registerAccountLife <bank.claim_unclaimed>` | 3 | label, refusal | 0 | Pending |  |
| `src/engine/systems/accountlife.ts#idleAccounts` | 15 | label, prose | 0 | Pending |  |
| `src/engine/systems/accountlife.ts#END_WORDS` | 3 | prose | 0 | Pending |  |
| `src/engine/systems/accountlife.ts#creditInterest` | 2 | label | 0 | Pending |  |
| `src/engine/systems/accountlife.ts#endTerm` | 2 | label | 0 | Pending |  |
| `src/engine/systems/banking.ts#closeSavings` | 1 | label | 0 | Pending |  |
| `src/engine/systems/banking.ts#endedWords` | 5 | label, prose | 0 | Pending |  |
| `src/engine/systems/banking.ts#settleFees` | 5 | label, prose | 0 | Pending |  |
| `src/engine/systems/banking.ts#cardYearWords` | 13 | label, prose | 0 | Pending |  |
| `src/engine/systems/banking.ts#closingFeesWords` | 8 | label, prose | 0 | Pending |  |
| `src/engine/systems/banking.ts#feesWords` | 12 | label, prose | 0 | Pending |  |
| `src/engine/systems/banking.ts#payInterest` | 2 | label | 0 | Pending |  |
| `src/engine/systems/banking.ts#scheduleMonthEnd` | 1 | label | 0 | Pending |  |
| `src/engine/systems/banking.ts#registerBanking <world.day_rollover>` | 2 | label | 0 | Pending |  |
| `src/engine/systems/banking.ts#registerBanking` | 9 | label, prose | 0 | Pending |  |
| `src/engine/systems/banking.ts#registerBanking <bank.transfer>` | 16 | label, refusal | 0 | Pending |  |
| `src/engine/systems/banking.ts#registerBanking <bank.open_savings>` | 2 | refusal | 0 | Pending |  |
| `src/engine/systems/banking.ts#registerBanking <bank.close_savings>` | 3 | refusal | 0 | Pending |  |
| `src/engine/systems/banking.ts#rebank` | 1 | label | 0 | Pending |  |
| `src/engine/systems/bankmoves.ts#inTransitOf [escrow]` | 1 | label | 0 | Pending |  |
| `src/engine/systems/bankmoves.ts#openRefusal` | 8 | prose | 0 | Pending |  |
| `src/engine/systems/bankmoves.ts#openApproved` | 1 | label | 0 | Pending |  |
| `src/engine/systems/bankmoves.ts#limitRefusal` | 2 | prose | 0 | Pending |  |
| `src/engine/systems/bankmoves.ts#sendBetweenBanks` | 4 | label | 0 | Pending |  |
| `src/engine/systems/bankmoves.ts#PRIMARY_DOES` | 4 | prose | 0 | Pending |  |
| `src/engine/systems/bankmoves.ts#closeRefusal` | 12 | label, prose | 0 | Pending |  |
| `src/engine/systems/bankmoves.ts#closeNow` | 1 | label | 0 | Pending |  |
| `src/engine/systems/bankmoves.ts#closedByBank` | 4 | label, prose | 0 | Pending |  |
| `src/engine/systems/bankmoves.ts#registerBankMoves <bank.open_current>` | 6 | label, refusal | 0 | Pending |  |
| `src/engine/systems/bankmoves.ts#registerBankMoves` | 14 | label, prose | 0 | Pending |  |
| `src/engine/systems/bankmoves.ts#registerBankMoves <world.day_rollover>` | 2 | prose | 0 | Pending |  |
| `src/engine/systems/bankmoves.ts#registerBankMoves <bank.set_primary>` | 3 | refusal | 0 | Pending |  |
| `src/engine/systems/bankmoves.ts#registerBankMoves <bank.redirect_deposits>` | 3 | refusal | 0 | Pending |  |
| `src/engine/systems/bankmoves.ts#registerBankMoves <bank.set_order_source>` | 3 | refusal | 0 | Pending |  |
| `src/engine/systems/bankmoves.ts#registerBankMoves <card.set_autopay_from>` | 4 | refusal | 0 | Pending |  |
| `src/engine/systems/bankmoves.ts#registerBankMoves <bank.close_current>` | 3 | refusal | 0 | Pending |  |
| `src/engine/systems/banknumber.ts#accountNumber` | 5 | label, prose | 0 | Pending |  |
| `src/engine/systems/cardlife.ts#registerCardLife` | 4 | label, prose | 0 | Pending |  |
| `src/engine/systems/cardlife.ts#registerCardLife <card.apply>` | 16 | label, prose, refusal | 0 | Pending |  |
| `src/engine/systems/cardlife.ts#registerCardLife <card.close>` | 2 | refusal | 0 | Pending |  |
| `src/engine/systems/cardlife.ts#registerCardLife <card.set_statement_day>` | 2 | refusal | 0 | Pending |  |
| `src/engine/systems/cardlife.ts#registerCardLife <card.request_limit>` | 4 | label, prose, refusal | 0 | Pending |  |
| `src/engine/systems/cardlife.ts#registerCardLife <card.set_auto_raise>` | 1 | refusal | 0 | Pending |  |
| `src/engine/systems/cardlife.ts#registerCardLife <card.set_over_limit>` | 2 | refusal | 0 | Pending |  |
| `src/engine/systems/cardlife.ts#registerCardLife <card.request_hardship>` | 4 | refusal | 0 | Pending |  |
| `src/engine/systems/cardlife.ts#armCardLife` | 1 | label | 0 | Pending |  |
| `src/engine/systems/cardoffers.ts#statementOffers` | 7 | label | 0 | Pending |  |
| `src/engine/systems/cardoffers.ts#transferOnArrival` | 5 | label, prose | 0 | Pending |  |
| `src/engine/systems/cardoffers.ts#registerCardOffers <card.money_transfer>` | 8 | label, refusal | 0 | Pending |  |
| `src/engine/systems/cardoffers.ts#registerCardOffers <card.plan>` | 5 | refusal | 0 | Pending |  |
| `src/engine/systems/cardoffers.ts#registerCardOffers <card.redeem_rewards>` | 3 | label, refusal | 0 | Pending |  |
| `src/engine/systems/cardoffers.ts#transferRefusal` | 6 | label, prose | 0 | Pending |  |
| `src/engine/systems/cash.ts#walletOf [cash]` | 1 | label | 0 | Pending |  |
| `src/engine/systems/cash.ts#withdrawalQuote` | 12 | prose | 0 | Pending |  |
| `src/engine/systems/cash.ts#registerCash <cash.withdraw>` | 13 | label, refusal | 0 | Pending |  |
| `src/engine/systems/cash.ts#registerCash <cash.deposit>` | 13 | label, refusal | 0 | Pending |  |
| `src/engine/systems/credit.ts#scoreWord` | 5 | label | 0 | Pending |  |
| `src/engine/systems/credit.ts#statementDayRefusal` | 1 | prose | 0 | Pending |  |
| `src/engine/systems/credit.ts#scheduleStatement` | 1 | label | 0 | Pending |  |
| `src/engine/systems/credit.ts#scheduleDue` | 1 | label | 0 | Pending |  |
| `src/engine/systems/credit.ts#registerCredit` | 40 | label, prose | 0 | Pending |  |
| `src/engine/systems/credit.ts#registerCredit <card.refund_credit>` | 1 | refusal | 0 | Pending |  |
| `src/engine/systems/credit.ts#registerCredit <finance.pay_card>` | 4 | refusal | 0 | Pending |  |
| `src/engine/systems/credit.ts#registerCredit <finance.set_autopay>` | 4 | refusal | 0 | Pending |  |
| `src/engine/systems/credit.ts#registerCredit <card.set_everyday>` | 2 | refusal | 0 | Pending |  |
| `src/engine/systems/credit.ts#refundCredit` | 1 | label | 0 | Pending |  |
| `src/engine/systems/credit.ts#afterMissed` | 6 | label, prose | 0 | Pending |  |
| `src/engine/systems/credit.ts#chargeOff` | 5 | label, prose | 0 | Pending |  |
| `src/engine/systems/credit.ts#persistentDebt` | 4 | label, prose | 0 | Pending |  |
| `src/engine/systems/earnings.ts#workedBetween` | 1 | label | 0 | Pending |  |
| `src/engine/systems/earnings.ts#ukTaxYear` | 1 | label | 0 | Pending |  |
| `src/engine/systems/homeaccount.ts#countryWord` | 2 | label | 0 | Pending |  |
| `src/engine/systems/homeaccount.ts#before` | 2 | label | 0 | Pending |  |
| `src/engine/systems/homeaccount.ts#homeAccountRefusal` | 9 | prose | 0 | Pending |  |
| `src/engine/systems/homeaccount.ts#startOf` | 1 | label | 0 | Pending |  |
| `src/engine/systems/homeaccount.ts#closesOn` | 1 | label | 0 | Pending |  |
| `src/engine/systems/homeaccount.ts#whatFollows` | 15 | label, prose | 0 | Pending |  |
| `src/engine/systems/homeaccount.ts#openHomeAccount` | 2 | label | 0 | Pending |  |
| `src/engine/systems/lending.ts#switchApplicationRefusal` | 5 | prose | 0 | Pending |  |
| `src/engine/systems/lending.ts#frenchOverrun` | 7 | label, prose | 0 | Pending |  |
| `src/engine/systems/lending.ts#collectionsOf` | 1 | label | 0 | Pending |  |
| `src/engine/systems/lending.ts#collectionsSource` | 2 | label | 0 | Pending |  |
| `src/engine/systems/lending.ts#overdraftOffer` | 5 | label, prose | 0 | Pending |  |
| `src/engine/systems/lending.ts#loanOffer` | 18 | label, prose | 0 | Pending |  |
| `src/engine/systems/lending.ts#cardYearNight` | 4 | label | 0 | Pending |  |
| `src/engine/systems/lending.ts#settleOverdraftInterest` | 2 | label | 0 | Pending |  |
| `src/engine/systems/lending.ts#chargeForItem` | 2 | label | 0 | Pending |  |
| `src/engine/systems/lending.ts#chargeReturned` | 2 | label | 0 | Pending |  |
| `src/engine/systems/lending.ts#chargeForPurchase` | 4 | label | 0 | Pending |  |
| `src/engine/systems/lending.ts#scheduleLoan` | 1 | label | 0 | Pending |  |
| `src/engine/systems/lending.ts#completeSwitch` | 16 | label, prose | 0 | Pending |  |
| `src/engine/systems/lending.ts#monthlyCharges` | 6 | label | 0 | Pending |  |
| `src/engine/systems/lending.ts#refundInterestTax` | 4 | label, prose | 0 | Pending |  |
| `src/engine/systems/lending.ts#settlePendingItems` | 2 | label | 0 | Pending |  |
| `src/engine/systems/lending.ts#closeForOverdraft` | 14 | label, prose | 0 | Pending |  |
| `src/engine/systems/lending.ts#closeForOverdraft [loan]` | 1 | label | 0 | Pending |  |
| `src/engine/systems/lending.ts#registerLending <world.day_rollover>` | 22 | label, prose | 0 | Pending |  |
| `src/engine/systems/lending.ts#registerLending` | 5 | label, prose | 0 | Pending |  |
| `src/engine/systems/lending.ts#registerLending <bank.stop_balance_transfer>` | 5 | refusal | 0 | Pending |  |
| `src/engine/systems/lending.ts#registerLending <bank.debit_overdraft>` | 2 | refusal | 0 | Pending |  |
| `src/engine/systems/lending.ts#registerLending <bank.pay_collections>` | 4 | label, refusal | 0 | Pending |  |
| `src/engine/systems/lending.ts#registerLending <bank.arrange_overdraft>` | 10 | label, refusal | 0 | Pending |  |
| `src/engine/systems/lending.ts#registerLending <bank.borrow>` | 3 | label, refusal | 0 | Pending |  |
| `src/engine/systems/lending.ts#registerLending [loan]` | 2 | label | 0 | Pending |  |
| `src/engine/systems/lending.ts#registerLending <bank.set_loan_repayment>` | 3 | refusal | 0 | Pending |  |
| `src/engine/systems/lending.ts#registerLending <bank.take_overrun_loan>` | 4 | label, refusal | 0 | Pending |  |
| `src/engine/systems/lending.ts#registerLending <bank.repay_loan>` | 4 | label, refusal | 0 | Pending |  |
| `src/engine/systems/lending.ts#registerLending <bank.open_term>` | 6 | refusal | 0 | Pending |  |
| `src/engine/systems/lending.ts#registerLending <bank.cancel_switch>` | 4 | refusal | 0 | Pending |  |
| `src/engine/systems/lending.ts#registerLending <bank.switch>` | 14 | label, refusal | 0 | Pending |  |
| `src/engine/systems/obligations.ts#obligationsAhead` | 7 | label, prose | 0 | Pending |  |
| `src/engine/systems/obligations.ts#accountAlerts` | 6 | label, prose | 0 | Pending |  |
| `src/engine/systems/payments.ts#coveredBanks` | 2 | label | 0 | Pending |  |
| `src/engine/systems/payments.ts#blockedBy` | 4 | label, prose | 0 | Pending |  |
| `src/engine/systems/payments.ts#registerPayments` | 18 | label, prose | 0 | Pending |  |
| `src/engine/systems/payments.ts#registerPayments <bank.set_payments>` | 4 | refusal | 0 | Pending |  |
| `src/engine/systems/payments.ts#registerPayments <bank.add_standing_order>` | 5 | label, refusal | 0 | Pending |  |
| `src/engine/systems/payments.ts#registerPayments <bank.cancel_standing_order>` | 1 | refusal | 0 | Pending |  |
| `src/engine/systems/payments.ts#registerPayments <bank.schedule_payment>` | 5 | label, refusal | 0 | Pending |  |
| `src/engine/systems/payments.ts#registerPayments <bank.cancel_scheduled>` | 1 | refusal | 0 | Pending |  |
| `src/engine/systems/payments.ts#armPayments` | 1 | label | 0 | Pending |  |
| `src/engine/systems/roundups.ts#EVERY_WORDS` | 1 | label | 0 | Pending |  |
| `src/engine/systems/roundups.ts#roundUpChoiceRefusal` | 9 | prose | 0 | Pending |  |
| `src/engine/systems/roundups.ts#roundUpRefusal` | 4 | label, prose | 0 | Pending |  |
| `src/engine/systems/roundups.ts#moveRoundUps` | 8 | label, prose | 0 | Pending |  |
| `src/engine/systems/roundups.ts#move` | 1 | label | 0 | Pending |  |
| `src/engine/systems/routing.ts#linkedTo` | 6 | label, prose | 0 | Pending |  |
| `src/engine/systems/routing.ts#PAYER_NAMES` | 1 | label | 0 | Pending |  |
| `src/engine/systems/routing.ts#movingDays` | 2 | label | 0 | Pending |  |
| `src/engine/systems/routing.ts#paidInto` | 3 | label, prose | 0 | Pending |  |
| `src/engine/systems/routing.ts#closeHold` | 4 | label, prose | 0 | Pending |  |
| `src/engine/systems/security.ts#replace` | 1 | label | 0 | Pending |  |
| `src/engine/systems/security.ts#disputeRefusal` | 3 | prose | 0 | Pending |  |
| `src/engine/systems/security.ts#registerSecurity` | 9 | label, prose | 0 | Pending |  |
| `src/engine/systems/security.ts#registerSecurity <world.day_rollover>` | 2 | label, prose | 0 | Pending |  |
| `src/engine/systems/security.ts#registerSecurity <card.lock>` | 3 | refusal | 0 | Pending |  |
| `src/engine/systems/security.ts#registerSecurity <card.report>` | 12 | label, refusal | 0 | Pending |  |
| `src/engine/systems/security.ts#registerSecurity <bank.new_number>` | 2 | refusal | 0 | Pending |  |
| `src/engine/systems/security.ts#registerSecurity <card.dispute>` | 1 | label | 0 | Pending |  |
| `src/engine/systems/security.ts#somebodyElse` | 6 | label, prose | 0 | Pending |  |
| `src/engine/systems/security.ts#attemptOnNumber` | 6 | label, prose | 0 | Pending |  |
| `src/engine/systems/spending.ts#arrearsAccount [loan]` | 2 | label | 0 | Pending |  |
| `src/engine/systems/spending.ts#drawFromBank` | 1 | label | 0 | Pending |  |
| `src/engine/systems/spending.ts#EXPENSE_LINE` | 7 | label | 0 | Pending |  |
| `src/engine/systems/spending.ts#expenseFor` | 1 | label | 0 | Pending |  |
| `src/engine/systems/spending.ts#CANT_AFFORD` | 1 | prose | 0 | Pending |  |
| `src/engine/systems/spending.ts#CASH_UNSPENT` | 1 | prose | 0 | Pending |  |
| `src/engine/systems/spending.ts#spendRefusal` | 2 | prose | 0 | Pending |  |
| `src/engine/systems/spending.ts#spend` | 2 | label | 0 | Pending |  |
| `src/engine/systems/spending.ts#buyTheDaysFood` | 7 | label, prose | 0 | Pending |  |
| `src/engine/systems/spending.ts#settleArrears` | 1 | label | 0 | Pending |  |
| `src/engine/systems/statements.ts#MONTHS` | 12 | label | 0 | Pending |  |
| `src/engine/systems/statements.ts#periodsOf` | 3 | label | 0 | Pending |  |
| `src/engine/systems/statements.ts#cardPeriods` | 3 | label | 0 | Pending |  |
| `src/engine/systems/statements.ts#statementReady` | 1 | label | 0 | Pending |  |
| `src/engine/systems/statements.ts#registerStatements <world.day_rollover>` | 2 | label, prose | 0 | Pending |  |
| `src/engine/systems/statements.ts#registerStatements <bank.set_alerts>` | 3 | label, refusal | 0 | Pending |  |
| `src/ui/bank/BankAccountLife.tsx#END_BUTTON` | 3 | label | 0 | Pending |  |
| `src/ui/bank/BankAccountLife.tsx#BankAccountLife` | 32 | accessible, attribute, label, prose | 1 | Pending |  |
| `src/ui/bank/BankCard.tsx#MONTH_NAMES` | 12 | label | 0 | Pending |  |
| `src/ui/bank/BankCard.tsx#TERM_WORDS` | 7 | label | 0 | Pending |  |
| `src/ui/bank/BankCard.tsx#CardApplication` | 25 | label, prose | 0 | Pending |  |
| `src/ui/bank/BankCard.tsx#CardPanel` | 91 | label, prose | 3 | Pending |  |
| `src/ui/bank/BankCardOffers.tsx#CardOffers` | 37 | accessible, label, prose | 0 | Pending |  |
| `src/ui/bank/BankCash.tsx#BankCash` | 27 | accessible, attribute, label, prose | 1 | Pending |  |
| `src/ui/bank/BankLending.tsx#SWITCH_OUTCOME` | 6 | label, prose | 0 | Pending |  |
| `src/ui/bank/BankLending.tsx#BankLending` | 180 | accessible, attribute, label, prose | 9 | Pending |  |
| `src/ui/bank/BankMoves.tsx#BankMoves` | 73 | accessible, attribute, label, prose | 4 | Pending |  |
| `src/ui/bank/BankPayments.tsx#BankPayments` | 28 | accessible, attribute, label, prose | 0 | Pending |  |
| `src/ui/bank/BankPayments.tsx#coverText` | 8 | label, prose | 2 | Pending |  |
| `src/ui/bank/BankSecurity.tsx#WHY_WORDS` | 5 | label | 0 | Pending |  |
| `src/ui/bank/BankSecurity.tsx#BankSecurity` | 44 | accessible, attribute, label, prose | 2 | Pending |  |
| `src/ui/bank/BankStatements.tsx#BankStatements` | 5 | accessible, attribute, label, prose | 0 | Pending |  |
| `src/ui/bank/BankStatements.tsx#AccountStatementView` | 18 | attribute, label, prose | 1 | Pending |  |
| `src/ui/bank/BankStatements.tsx#PendingTerms` | 3 | label, prose | 1 | Pending |  |
| `src/ui/bank/BankStatements.tsx#CardStatementView` | 21 | attribute, label, prose | 0 | Pending |  |
| `src/ui/bank/BankStatements.tsx#YearView` | 10 | accessible, attribute, label | 0 | Pending |  |
| `src/ui/bank/BankStatements.tsx#AlertsView` | 14 | accessible, attribute, label, placeholder, prose | 1 | Pending |  |
| `src/ui/bank/BankStatements.tsx#Lines` | 9 | label | 0 | Pending |  |
| `src/ui/bank/BankStatements.tsx#yearsAndMonths` | 3 | label | 0 | Pending |  |
| `src/ui/bank/RoundUps.tsx#RoundUps` | 39 | accessible, label, prose | 0 | Pending |  |
| `src/ui/bank/feeWords.ts#waiverWords` | 16 | label, prose | 0 | Pending |  |
| `src/ui/looks/bank.tsx#standing` | 2 | label | 0 | Pending |  |
| `src/ui/looks/bank.tsx#top` | 54 | attribute, label, prose | 0 | Pending |  |
| `src/ui/looks/bank.tsx#movedWords` | 4 | label, prose | 0 | Pending |  |
| `src/ui/looks/money.tsx#RECENT_WORDS` | 1 | label | 0 | Pending |  |
| `src/ui/looks/money.tsx#ACCOUNT_KIND` | 17 | label | 0 | Pending |  |
| `src/ui/looks/money.tsx#CATEGORY_WORDS` | 2 | label | 0 | Pending |  |
| `src/ui/looks/money.tsx#heldFor` | 4 | label | 0 | Pending |  |
| `src/ui/looks/money.tsx#top` | 23 | label, prose | 0 | Pending |  |
| `src/ui/looks/money.tsx#accountSentence` | 8 | label, prose | 0 | Pending |  |
| `src/ui/looks/money.tsx#movementSentence` | 4 | prose | 0 | Pending |  |
| `src/ui/looks/money.tsx#tailFor` | 6 | prose | 0 | Pending |  |
| `src/ui/looks/money.tsx#accountBody` | 18 | attribute, label, prose | 0 | Pending |  |
| `src/ui/looks/money.tsx#top [went]` | 1 | label | 0 | Pending |  |
| `src/ui/looks/money.tsx#HELD_AS` | 2 | label | 0 | Pending |  |
| `src/ui/looks/money.tsx#worthSentence` | 7 | label, prose | 0 | Pending |  |
| `src/ui/looks/money.tsx#worthBody` | 11 | attribute, label, prose | 0 | Pending |  |
| `src/ui/looks/money.tsx#spendBody` | 3 | label, prose | 0 | Pending |  |
| `src/ui/looks/money.tsx#debtBody` | 14 | attribute, label, prose | 0 | Pending |  |
| `src/ui/workspaces/BankWorkspace.tsx#BankWorkspace` | 48 | accessible, attribute, label, prose | 2 | Pending |  |
| `src/ui/workspaces/BankWorkspace.tsx#BorrowingAt` | 1 | label | 0 | Pending |  |
| `src/ui/workspaces/BankWorkspace.tsx#BankTabs` | 2 | accessible, attribute | 0 | Pending |  |
| `src/ui/workspaces/BankWorkspace.tsx#othersText` | 3 | label | 0 | Pending |  |
| `src/ui/workspaces/BankWorkspace.tsx#CONFIDENCE` | 2 | prose | 0 | Pending |  |
| `src/ui/workspaces/BankWorkspace.tsx#MONTH_NAMES` | 12 | label | 0 | Pending |  |
| `src/ui/workspaces/BankWorkspace.tsx#interestWords` | 21 | label, prose | 0 | Pending |  |
| `src/ui/workspaces/BankWorkspace.tsx#OtherCharges` | 18 | accessible, label, prose | 1 | Pending |  |
| `src/ui/workspaces/BankWorkspace.tsx#closingWords` | 5 | prose | 0 | Pending |  |

## Papers, Documents, Applications, Taxes And Status Notices

| Source | Strings | Kinds | Engine-Speak | Status | Reason Or Evidence |
|---|---|---|---|---|---|
| `src/engine/content/guide/documents.ts#NEW_HAVEN` | 1 | label | 0 | Pending |  |
| `src/engine/content/guide/documents.ts#SSN_VISIT` | 1 | label | 0 | Pending |  |
| `src/engine/content/guide/documents.ts#NY_MAILS` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/guide/documents.ts#DOCUMENTS [documents.passport-id]` | 95 | label, prose | 4 | Pending |  |
| `src/engine/content/guide/documents.ts#DOCUMENTS [evaluation]` | 6 | prose | 0 | Pending |  |
| `src/engine/content/guide/documents.ts#DOCUMENTS [prerequisite]` | 4 | prose | 0 | Pending |  |
| `src/engine/content/guide/documents.ts#DOCUMENTS [immediate]` | 2 | prose | 0 | Pending |  |
| `src/engine/content/guide/documents.ts#DOCUMENTS [documents.work]` | 66 | label, prose | 0 | Pending |  |
| `src/engine/content/guide/documents.ts#DOCUMENTS [scheduled]` | 1 | prose | 0 | Pending |  |
| `src/engine/content/guide/documents.ts#DOCUMENTS [documents.residence]` | 45 | label, prose | 1 | Pending |  |
| `src/engine/content/guide/documents.ts#DOCUMENTS [optional]` | 2 | prose | 0 | Pending |  |
| `src/engine/content/guide/papers.ts#MONTHS` | 12 | label | 0 | Pending |  |
| `src/engine/content/guide/papers.ts#FROM_CURRENT` | 1 | prose | 0 | Pending |  |
| `src/engine/content/guide/papers.ts#BENCH_WORDS` | 1 | label | 0 | Pending |  |
| `src/engine/content/guide/papers.ts#PRACTICE` | 1 | label | 0 | Pending |  |
| `src/engine/content/guide/papers.ts#YALE_PRACTICE` | 1 | label | 0 | Pending |  |
| `src/engine/content/guide/papers.ts#EMERGENCY_ROOM` | 1 | label | 0 | Pending |  |
| `src/engine/content/guide/papers.ts#YALE_SOON` | 2 | label | 0 | Pending |  |
| `src/engine/content/guide/papers.ts#CHAINS` | 1 | label | 0 | Pending |  |
| `src/engine/content/guide/papers.ts#CT_FLOOR_WORDS` | 1 | prose | 1 | Pending |  |
| `src/engine/content/guide/papers.ts#SNAP_FULL` | 1 | label | 0 | Pending |  |
| `src/engine/content/guide/papers.ts#PAPERS [papers.overview]` | 36 | label, prose | 0 | Pending |  |
| `src/engine/content/guide/papers.ts#PAPERS [prerequisite]` | 5 | prose | 0 | Pending |  |
| `src/engine/content/guide/papers.ts#PAPERS [optional]` | 4 | prose | 0 | Pending |  |
| `src/engine/content/guide/papers.ts#PAPERS [papers.health-cover]` | 111 | label, prose | 1 | Pending |  |
| `src/engine/content/guide/papers.ts#PAPERS [history]` | 4 | prose | 0 | Pending |  |
| `src/engine/content/guide/papers.ts#PAPERS [evaluation]` | 5 | prose | 0 | Pending |  |
| `src/engine/content/guide/papers.ts#PAPERS [scheduled]` | 8 | prose | 1 | Pending |  |
| `src/engine/content/guide/papers.ts#PAPERS [papers.doctor]` | 76 | label, prose | 1 | Pending |  |
| `src/engine/content/guide/papers.ts#PAPERS [immediate]` | 2 | prose | 0 | Pending |  |
| `src/engine/content/guide/papers.ts#PAPERS [papers.conditions]` | 62 | label, prose | 0 | Pending |  |
| `src/engine/content/guide/papers.ts#PAPERS [papers.benefits]` | 65 | label, prose | 0 | Pending |  |
| `src/engine/content/guide/papers.ts#PAPERS [papers.pensions]` | 53 | label, prose | 0 | Pending |  |
| `src/engine/content/guide/taxes.ts#NEW_HAVEN` | 1 | label | 0 | Pending |  |
| `src/engine/content/guide/taxes.ts#PART` | 3 | label | 0 | Pending |  |
| `src/engine/content/guide/taxes.ts#REFUND_WORDS` | 2 | prose | 0 | Pending |  |
| `src/engine/content/guide/taxes.ts#TAXES [taxes.return]` | 79 | label, prose | 2 | Pending |  |
| `src/engine/content/guide/taxes.ts#TAXES [immediate]` | 8 | prose | 0 | Pending |  |
| `src/engine/content/guide/taxes.ts#TAXES [scheduled]` | 4 | prose | 0 | Pending |  |
| `src/engine/content/guide/taxes.ts#TAXES [optional]` | 4 | prose | 0 | Pending |  |
| `src/engine/content/guide/taxes.ts#TAXES [taxes.pay]` | 72 | label, prose | 1 | Pending |  |
| `src/engine/content/guide/taxes.ts#TAXES [prerequisite]` | 4 | prose | 0 | Pending |  |
| `src/engine/content/guide/taxes.ts#TAXES [taxes.plan]` | 86 | label, prose | 2 | Pending |  |
| `src/engine/content/guide/taxes.ts#TAXES [taxes.lien]` | 69 | label, prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS .us-ny` | 1 | prose | 2 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS [permit]` | 9 | label, prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS [course]` | 8 | label, prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS [road]` | 15 | label, prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS .us-ct` | 1 | prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS [knowledge]` | 9 | label, prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS .us-ca` | 1 | prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS [application]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS .gb` | 1 | prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS [provisional]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS [theory]` | 17 | label, prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS [practical]` | 15 | label, prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS .gb-nir` | 1 | prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS [training]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS .ca-on` | 1 | prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS [g1]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS [g2]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS [g]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS .ca-bc` | 1 | prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS [learner]` | 9 | label, prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS [class7]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS [class7-50]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS [class5]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS .ie` | 1 | prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS [edt]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS [test]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS .is` | 1 | prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS [school]` | 18 | label, prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS [school3]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS [full]` | 9 | label, prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS .de` | 1 | prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS [eyes]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS [firstaid]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS .fr` | 1 | prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS [neph]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS [code]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS [lessons]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS [exam]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS .es` | 1 | prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS [aptitude]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS [tasa]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS .jp` | 1 | prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS [written]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS .kr` | 1 | prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS [safety]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS [skill]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS [practice]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS .mx-cmx` | 1 | prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS [license]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS .au-nsw` | 1 | prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS [dkt]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS [logbook]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS [hpt]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS [dt]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS [p2]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS .br` | 1 | prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS [medical]` | 5 | label, prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS [toxicology]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS [cnh]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS .nz` | 1 | prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS [restricted]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS [full25]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS [full2027]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS .lv` | 1 | prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_PATHS [driving]` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#PASS_RATES [road]` | 24 | label, prose | 1 | Pending |  |
| `src/engine/content/licensepaths.ts#PASS_RATES [theory]` | 8 | label, prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#passRate` | 2 | prose | 0 | Pending |  |
| `src/engine/content/licensepaths.ts#LICENSE_EXCHANGES` | 5 | prose | 0 | Pending |  |
| `src/engine/content/licenses.ts#LICENSES .us-ny` | 29 | label, prose | 0 | Pending |  |
| `src/engine/content/licenses.ts#LICENSES .us-ct` | 28 | label, prose | 0 | Pending |  |
| `src/engine/content/licenses.ts#LICENSES .us-ca` | 24 | label, prose | 0 | Pending |  |
| `src/engine/content/licenses.ts#LICENSES .gb` | 28 | label, prose | 0 | Pending |  |
| `src/engine/content/licenses.ts#LICENSES .gb-nir` | 24 | label, prose | 0 | Pending |  |
| `src/engine/content/licenses.ts#LICENSES .ca-on` | 30 | label, prose | 0 | Pending |  |
| `src/engine/content/licenses.ts#LICENSES .ca-bc` | 30 | label, prose | 0 | Pending |  |
| `src/engine/content/licenses.ts#LICENSES .ie` | 26 | label, prose | 0 | Pending |  |
| `src/engine/content/licenses.ts#LICENSES .is` | 29 | label, prose | 0 | Pending |  |
| `src/engine/content/licenses.ts#LICENSES .de` | 31 | label, prose | 0 | Pending |  |
| `src/engine/content/licenses.ts#LICENSES .fr` | 29 | label, prose | 0 | Pending |  |
| `src/engine/content/licenses.ts#LICENSES .es` | 28 | label, prose | 0 | Pending |  |
| `src/engine/content/licenses.ts#LICENSES .jp` | 32 | label, prose | 0 | Pending |  |
| `src/engine/content/licenses.ts#LICENSES .kr` | 29 | label, prose | 0 | Pending |  |
| `src/engine/content/licenses.ts#LICENSES .mx-cmx` | 22 | label, prose | 0 | Pending |  |
| `src/engine/content/licenses.ts#LICENSES .au-nsw` | 32 | label, prose | 0 | Pending |  |
| `src/engine/content/licenses.ts#LICENSES .br` | 34 | label, prose | 0 | Pending |  |
| `src/engine/content/licenses.ts#LICENSES .nz` | 30 | label, prose | 0 | Pending |  |
| `src/engine/content/licenses.ts#LICENSES .lv` | 28 | label, prose | 0 | Pending |  |
| `src/engine/content/passports.ts#PASSPORTS .US` | 12 | label, prose | 0 | Pending |  |
| `src/engine/content/passports.ts#PASSPORTS .GB` | 17 | label, prose | 0 | Pending |  |
| `src/engine/content/passports.ts#PASSPORTS .CA` | 16 | label, prose | 0 | Pending |  |
| `src/engine/content/passports.ts#PASSPORTS .IE` | 18 | label, prose | 0 | Pending |  |
| `src/engine/content/passports.ts#PASSPORTS .IS` | 19 | label, prose | 0 | Pending |  |
| `src/engine/content/passports.ts#PASSPORTS .DE` | 18 | label, prose | 0 | Pending |  |
| `src/engine/content/passports.ts#PASSPORTS .FR` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/passports.ts#PASSPORTS .ES` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/passports.ts#PASSPORTS .JP` | 19 | label, prose | 0 | Pending |  |
| `src/engine/content/passports.ts#PASSPORTS .KR` | 18 | label, prose | 0 | Pending |  |
| `src/engine/content/passports.ts#PASSPORTS .MX` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/passports.ts#PASSPORTS .AU` | 16 | label, prose | 0 | Pending |  |
| `src/engine/content/passports.ts#PASSPORTS .BR` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/passports.ts#PASSPORTS .NZ` | 18 | label, prose | 0 | Pending |  |
| `src/engine/content/passports.ts#PASSPORTS .LV` | 15 | label, prose | 0 | Pending |  |
| `src/engine/content/passportsabroad.ts#PASSPORTS_ABROAD` | 28 | prose | 0 | Pending |  |
| `src/engine/content/passportsabroad.ts#nzTerms` | 6 | prose | 4 | Pending |  |
| `src/engine/content/safetynet.ts#ENHANCED_CREDIT` | 1 | label | 0 | Pending |  |
| `src/engine/content/safetynet.ts#CARE` | 1 | prose | 0 | Pending |  |
| `src/engine/content/safetynet.ts#PLANS` | 8 | label | 0 | Pending |  |
| `src/engine/content/safetynet.ts#CHARITY` | 1 | prose | 0 | Pending |  |
| `src/engine/content/safetynet.ts#CHRONIC` | 1 | prose | 0 | Pending |  |
| `src/engine/content/safetynet.ts#DENTAL_PLANS` | 3 | label | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX .us-ct` | 11 | label, prose | 1 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [DRS Bill]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [Notice Of Intent To Levy]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [Failure To File Notice]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX .us-ny` | 9 | label, prose | 1 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [DTF Bill]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [DTF-966-E]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [Tax Warrant]` | 9 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [AU-222]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [Statement Of Proposed Audit Change]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [Notice Of Deficiency]` | 12 | label, prose | 1 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX .us-ca` | 12 | label, prose | 1 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [Statement Of Tax Due]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [FTB 4963]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [FTB 4966]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [FTB 4600]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [FTB 4601]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [Notice Of Proposed Assessment]` | 18 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX .us-az` | 10 | label, prose | 1 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [ADOR Bill]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [Final Demand]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [Demand To File]` | 12 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [Proposed Assessment]` | 15 | label, prose | 1 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX .us-co` | 11 | label, prose | 1 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [Final Determination And Demand]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [Notice Of Intent To Issue Judgment/Lien]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX .us-ga` | 10 | label, prose | 1 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [Official Assessment And Demand]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [State Tax Execution]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [Notice To Submit Return]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX .us-hi` | 11 | label, prose | 1 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [DOTAX Bill]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [Written Demand]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX .us-il` | 12 | label, prose | 1 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [IDOR-2-BILL]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [LTR-393-IPD]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [Nonfiling Notice]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX .us-la` | 14 | label, prose | 1 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [Notice Of Assessment]` | 15 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [Notice Of Final Assessment]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [Notice Of Intent To Offset]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX .us-ma` | 10 | label, prose | 1 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [Statement Of Account]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [Final Notice]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [Notice Of Failure To File]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [Notice Of Intent To Assess]` | 3 | label, prose | 1 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX .us-nc` | 10 | label, prose | 1 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [Notice Of Collection]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [Notice Of Collection, Second]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [Notice To File]` | 12 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [Notice Of Individual Income Tax Assessment]` | 3 | label, prose | 1 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX .us-nm` | 12 | label, prose | 1 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [Final Notice Before Seizure]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX .us-or` | 10 | label, prose | 1 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [Notice And Demand]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [Distraint Warrant]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [Notice Of Determination And Assessment]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX .us-pa` | 13 | label, prose | 1 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [Billing Notice]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [Notice Of Intent To Garnish]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [Personal Income Tax Non-Filer Notice]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [Notice Of Estimated Assessment]` | 3 | label, prose | 1 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX .us-oh` | 12 | label, prose | 1 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [bL0001]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [bL0006]` | 4 | label, prose | 1 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [bL0008]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [Top Notice]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [Certified Claim]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [ITDQ0009]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX .us-in` | 11 | label, prose | 1 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [Demand For Payment]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX .us-dc` | 11 | label, prose | 1 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [Notice Of Tax, Penalty And/Or Interest Due]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [Notice Of Enforcement]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [Information Request For Non-Filed Period]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX .us-ok` | 10 | label, prose | 1 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX .us-pa-philadelphia` | 11 | label, prose | 1 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [Past-Due Bill]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [Referral Notice]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [Earnings Tax Assessment]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX .us-oh-columbus` | 9 | label, prose | 1 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [Bill]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX [Delinquent Notice]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#STATE_TAX .us-or-portland` | 6 | label, prose | 1 | Pending |  |
| `src/engine/content/statetax.ts#STATE_UNRESEARCHED` | 1 | prose | 0 | Pending |  |
| `src/engine/content/statetax.ts#FEDERAL_STATE_OFFSET` | 1 | label | 1 | Pending |  |
| `src/engine/content/tax.ts#APPROX` | 1 | prose | 0 | Pending |  |
| `src/engine/content/tax.ts#ICELAND_NOTE` | 2 | prose | 0 | Pending |  |
| `src/engine/content/tax.ts#INCOME_TAX_RULES [progressive]` | 63 | label, prose | 1 | Pending |  |
| `src/engine/content/tax.ts#INCOME_TAX_RULES` | 2 | label | 0 | Pending |  |
| `src/engine/content/tax.ts#INCOME_TAX_RULES [flat]` | 46 | label, prose | 5 | Pending |  |
| `src/engine/content/tax.ts#INCOME_TAX_RULES [none]` | 17 | label, prose | 0 | Pending |  |
| `src/engine/content/tax.ts#SALES_TAX_RULES` | 29 | label | 0 | Pending |  |
| `src/engine/content/tax.ts#PROPERTY_TAX_RULES` | 19 | label | 0 | Pending |  |
| `src/engine/content/tax.ts#computeAnnualTax` | 9 | label, prose | 0 | Pending |  |
| `src/engine/content/tax.ts#DENVER_OPT` | 1 | label | 1 | Pending |  |
| `src/engine/content/visas.ts#US_B1B2` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/visas.ts#CA_TRV` | 4 | label, prose | 0 | Pending |  |
| `src/engine/content/visas.ts#AU_600` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/visas.ts#BR_EVISA` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/visas.ts#VISAS` | 2 | label, prose | 0 | Pending |  |
| `src/engine/content/workrules.ts#WORK_RULES` | 4 | label, prose | 0 | Pending |  |
| `src/engine/systems/abroad.ts#chargeWords` | 3 | label | 0 | Pending |  |
| `src/engine/systems/abroad.ts#homeAccountLines` | 16 | label, prose | 0 | Pending |  |
| `src/engine/systems/abroad.ts#abroadRefusal` | 1 | prose | 0 | Pending |  |
| `src/engine/systems/abroad.ts#chargeAbroadFee` | 2 | label | 0 | Pending |  |
| `src/engine/systems/abroad.ts#cardAbroadRefusal` | 1 | prose | 0 | Pending |  |
| `src/engine/systems/abroad.ts#atmAbroad` | 2 | prose | 0 | Pending |  |
| `src/engine/systems/abroad.ts#abroadQuote` | 7 | prose | 0 | Pending |  |
| `src/engine/systems/abroad.ts#limitRefusal` | 2 | prose | 0 | Pending |  |
| `src/engine/systems/abroad.ts#quoteWords` | 6 | label, prose | 1 | Pending |  |
| `src/engine/systems/abroad.ts#sendAbroad` | 4 | label | 0 | Pending |  |
| `src/engine/systems/abroad.ts#arriveFromAbroad` | 10 | label, prose | 0 | Pending |  |
| `src/engine/systems/abroad.ts#closingBanks` | 2 | prose | 0 | Pending |  |
| `src/engine/systems/abroad.ts#armHomeAccounts` | 4 | label, prose | 0 | Pending |  |
| `src/engine/systems/abroad.ts#homeCloses` | 6 | label, prose | 0 | Pending |  |
| `src/engine/systems/abroad.ts#foreignAccountsNotice` | 6 | prose | 1 | Pending |  |
| `src/engine/systems/assistance.ts#snapStudentRefusal` | 1 | prose | 0 | Pending |  |
| `src/engine/systems/assistance.ts#assistanceRefusal` | 9 | label, prose | 0 | Pending |  |
| `src/engine/systems/assistance.ts#snapYearOn` | 1 | label | 0 | Pending |  |
| `src/engine/systems/assistance.ts#schedule` | 1 | label | 0 | Pending |  |
| `src/engine/systems/assistance.ts#registerAssistance` | 13 | label, prose | 0 | Pending |  |
| `src/engine/systems/assistance.ts#registerAssistance [escrow]` | 1 | label | 0 | Pending |  |
| `src/engine/systems/citizenship.ts#naturalizeRefusal` | 9 | label, prose | 0 | Pending |  |
| `src/engine/systems/citizenship.ts#registerCitizenship <documents.naturalize>` | 3 | label, refusal | 0 | Pending |  |
| `src/engine/systems/citizenship.ts#registerCitizenship` | 2 | label, prose | 0 | Pending |  |
| `src/engine/systems/documents.ts#mayEnter` | 17 | label, prose | 0 | Pending |  |
| `src/engine/systems/documents.ts#residenceRefusal` | 1 | prose | 0 | Pending |  |
| `src/engine/systems/documents.ts#registerDocuments <documents.apply_passport>` | 2 | label, refusal | 0 | Pending |  |
| `src/engine/systems/documents.ts#registerDocuments <documents.report_lost>` | 2 | refusal | 0 | Pending |  |
| `src/engine/systems/documents.ts#policeReportRefusal` | 7 | prose | 0 | Pending |  |
| `src/engine/systems/documents.ts#passportOffice` | 1 | prose | 0 | Pending |  |
| `src/engine/systems/documents.ts#passportRefusal` | 5 | prose | 0 | Pending |  |
| `src/engine/systems/documents.ts#STARTING` | 1 | prose | 0 | Pending |  |
| `src/engine/systems/documents.ts#startingDocuments` | 1 | label | 0 | Pending |  |
| `src/engine/systems/documents.ts#startingDocuments [visa]` | 1 | label | 0 | Pending |  |
| `src/engine/systems/documents.ts#startingDocuments [license]` | 1 | label | 0 | Pending |  |
| `src/engine/systems/documents.ts#issue` | 2 | prose | 0 | Pending |  |
| `src/engine/systems/documents.ts#mayDrive` | 7 | prose | 0 | Pending |  |
| `src/engine/systems/eiself.ts#eiRefusal` | 3 | prose | 0 | Pending |  |
| `src/engine/systems/eiself.ts#eiWeek` | 2 | label | 0 | Pending |  |
| `src/engine/systems/homebenefits.ts#CDMX_DESEMPLEO` | 1 | prose | 0 | Pending |  |
| `src/engine/systems/homebenefits.ts#jobseekerRefusal` | 4 | prose | 0 | Pending |  |
| `src/engine/systems/homebenefits.ts#desempleoRefusal` | 1 | prose | 0 | Pending |  |
| `src/engine/systems/homebenefits.ts#claimAtHome` | 1 | label | 0 | Pending |  |
| `src/engine/systems/homebenefits.ts#registerHomeBenefits` | 10 | label, prose | 0 | Pending |  |
| `src/engine/systems/homepensions.ts#irishMeans` | 2 | label | 0 | Pending |  |
| `src/engine/systems/homepensions.ts#irishPensionRefusal` | 4 | prose | 0 | Pending |  |
| `src/engine/systems/homepensions.ts#bienestarRefusal` | 4 | prose | 0 | Pending |  |
| `src/engine/systems/homepensions.ts#registerHomePensions <pension.ie_state>` | 1 | label | 0 | Pending |  |
| `src/engine/systems/homepensions.ts#registerHomePensions` | 11 | label, prose | 0 | Pending |  |
| `src/engine/systems/homepensions.ts#registerHomePensions <pension.bienestar>` | 1 | label | 0 | Pending |  |
| `src/engine/systems/identity.ts#noncitizenTermNote` | 2 | prose | 2 | Pending |  |
| `src/engine/systems/identity.ts#idCardRefusal` | 15 | prose | 0 | Pending |  |
| `src/engine/systems/identity.ts#licenseReplaceRefusal` | 5 | prose | 0 | Pending |  |
| `src/engine/systems/identity.ts#pastItsDate` | 2 | label, prose | 0 | Pending |  |
| `src/engine/systems/identity.ts#idReplaceRefusal` | 5 | prose | 0 | Pending |  |
| `src/engine/systems/identity.ts#registerIdentity <documents.replace_idcard>` | 2 | label, refusal | 0 | Pending |  |
| `src/engine/systems/identity.ts#registerIdentity` | 1 | prose | 0 | Pending |  |
| `src/engine/systems/identity.ts#registerIdentity <documents.apply_idcard>` | 3 | label, refusal | 0 | Pending |  |
| `src/engine/systems/identity.ts#registerIdentity <documents.replace_license>` | 2 | label, refusal | 0 | Pending |  |
| `src/engine/systems/imss.ts#imssRefusal` | 4 | prose | 0 | Pending |  |
| `src/engine/systems/imss.ts#registerImss <pension.imss>` | 1 | label | 0 | Pending |  |
| `src/engine/systems/imss.ts#registerImss` | 5 | label, prose | 0 | Pending |  |
| `src/engine/systems/papervisits.ts#VISITS` | 10 | label, prose | 1 | Pending |  |
| `src/engine/systems/papervisits.ts#registerPaperVisits` | 5 | label, prose | 0 | Pending |  |
| `src/engine/systems/permission.ts#businessDaysOn` | 1 | label | 0 | Pending |  |
| `src/engine/systems/permission.ts#optRefusal` | 6 | prose | 0 | Pending |  |
| `src/engine/systems/permission.ts#scheduleUsStatus` | 1 | label | 0 | Pending |  |
| `src/engine/systems/permission.ts#registerPermission` | 16 | label, prose, refusal | 0 | Pending |  |
| `src/engine/systems/permission.ts#registerPermission <documents.apply_opt>` | 2 | label | 0 | Pending |  |
| `src/engine/systems/permission.ts#registerPermission [permit]` | 1 | label | 0 | Pending |  |
| `src/engine/systems/residence.ts#MEXICO_UNREAD` | 1 | prose | 0 | Pending |  |
| `src/engine/systems/residence.ts#MEXICO_RULE` | 1 | prose | 0 | Pending |  |
| `src/engine/systems/residence.ts#MEXICO_RENEWAL` | 1 | prose | 0 | Pending |  |
| `src/engine/systems/residence.ts#routeRefusal` | 13 | prose | 0 | Pending |  |
| `src/engine/systems/residence.ts#settleRefusal` | 7 | prose | 0 | Pending |  |
| `src/engine/systems/residence.ts#registerResidence <documents.settle>` | 3 | label, refusal | 0 | Pending |  |
| `src/engine/systems/socialsecurity.ts#socialSecurityRefusal` | 3 | prose | 0 | Pending |  |
| `src/engine/systems/socialsecurity.ts#registerSocialSecurity <pension.social_security>` | 1 | label | 0 | Pending |  |
| `src/engine/systems/socialsecurity.ts#registerSocialSecurity` | 5 | label, prose | 0 | Pending |  |
| `src/engine/systems/statepension.ts#statePensionRefusal` | 3 | prose | 0 | Pending |  |
| `src/engine/systems/statepension.ts#registerStatePension <pension.state>` | 1 | label | 0 | Pending |  |
| `src/engine/systems/statepension.ts#registerStatePension` | 5 | label, prose | 0 | Pending |  |
| `src/engine/systems/statetax.ts#HOME` | 1 | label | 0 | Pending |  |
| `src/engine/systems/statetax.ts#agencyOf` | 1 | label | 0 | Pending |  |
| `src/engine/systems/statetax.ts#stateName` | 24 | label | 0 | Pending |  |
| `src/engine/systems/statetax.ts#payLateFor` | 1 | label | 0 | Pending |  |
| `src/engine/systems/statetax.ts#nextJanuary` | 2 | label | 0 | Pending |  |
| `src/engine/systems/statetax.ts#fileState` | 2 | label | 0 | Pending |  |
| `src/engine/systems/statetax.ts#applyStatePayment` | 1 | label | 0 | Pending |  |
| `src/engine/systems/statetax.ts#statePlanRefusal` | 22 | label, prose | 0 | Pending |  |
| `src/engine/systems/statetax.ts#startStatePlan` | 4 | label, prose | 0 | Pending |  |
| `src/engine/systems/statetax.ts#missStatePlan` | 9 | label, prose | 1 | Pending |  |
| `src/engine/systems/statetax.ts#statePlanNewBalance` | 1 | label | 0 | Pending |  |
| `src/engine/systems/statetax.ts#payStateRefund` | 12 | label, prose | 0 | Pending |  |
| `src/engine/systems/statetax.ts#federalOffsetToState` | 5 | label, prose | 0 | Pending |  |
| `src/engine/systems/statetax.ts#stateLienStep` | 2 | prose | 0 | Pending |  |
| `src/engine/systems/statetax.ts#lienReleaseWords` | 6 | label | 0 | Pending |  |
| `src/engine/systems/statetax.ts#fileStateLien` | 7 | label, prose | 0 | Pending |  |
| `src/engine/systems/statetax.ts#stateLienPaid` | 4 | label, prose | 0 | Pending |  |
| `src/engine/systems/statetax.ts#releaseLater` | 1 | label | 0 | Pending |  |
| `src/engine/systems/statetax.ts#releaseStateLien` | 3 | label, prose | 0 | Pending |  |
| `src/engine/systems/statetax.ts#lienReleaseRefusal` | 6 | prose | 0 | Pending |  |
| `src/engine/systems/statetax.ts#lienDisputeRefusal` | 4 | prose | 0 | Pending |  |
| `src/engine/systems/statetax.ts#threeYearCheck` | 2 | label, prose | 0 | Pending |  |
| `src/engine/systems/statetax.ts#waiverRefusal` | 4 | prose | 0 | Pending |  |
| `src/engine/systems/statetax.ts#scheduleStateNonFiler` | 1 | label | 0 | Pending |  |
| `src/engine/systems/statetax.ts#stateNonFilerStep` | 2 | label | 0 | Pending |  |
| `src/engine/systems/statetax.ts#assessStateNonFiler` | 2 | label, prose | 0 | Pending |  |
| `src/engine/systems/statetax.ts#reconsiderState` | 7 | label, prose | 0 | Pending |  |
| `src/engine/systems/statetax.ts#payLateWords` | 9 | label | 0 | Pending |  |
| `src/engine/systems/statetax.ts#interestWords` | 8 | label, prose | 0 | Pending |  |
| `src/engine/systems/statetax.ts#orderWords` | 3 | label, prose | 0 | Pending |  |
| `src/engine/systems/statetax.ts#registerStateTax` | 29 | label, prose | 0 | Pending |  |
| `src/engine/systems/statetax.ts#registerStateTax <tax.pay_state>` | 6 | label, refusal | 0 | Pending |  |
| `src/engine/systems/statetax.ts#registerStateTax <tax.apply_state_plan>` | 9 | label, prose, refusal | 0 | Pending |  |
| `src/engine/systems/statetax.ts#registerStateTax <tax.request_waiver>` | 7 | label, prose | 0 | Pending |  |
| `src/engine/systems/statetax.ts#registerStateTax <tax.lien_release>` | 4 | label, refusal | 0 | Pending |  |
| `src/engine/systems/statetax.ts#registerStateTax <tax.lien_dispute>` | 1 | prose | 0 | Pending |  |
| `src/engine/systems/statetax.ts#registerStateTax <tax.catch_up_state_plan>` | 6 | label, refusal | 0 | Pending |  |
| `src/engine/systems/taxid.ts#ssnRefusal` | 7 | prose | 0 | Pending |  |
| `src/engine/systems/taxid.ts#registerTaxId <documents.apply_ssn>` | 1 | label | 0 | Pending |  |
| `src/engine/systems/taxid.ts#registerTaxId` | 2 | label, prose | 0 | Pending |  |
| `src/engine/systems/taxreturn.ts#COLLECTION [CP501]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/systems/taxreturn.ts#COLLECTION [CP503]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/systems/taxreturn.ts#COLLECTION [CP504]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/systems/taxreturn.ts#COLLECTION [LT11]` | 2 | label, prose | 0 | Pending |  |
| `src/engine/systems/taxreturn.ts#FEDERAL_LIEN` | 4 | label, prose | 1 | Pending |  |
| `src/engine/systems/taxreturn.ts#federalLienStep` | 3 | label, prose | 0 | Pending |  |
| `src/engine/systems/taxreturn.ts#federalLienPaid` | 1 | prose | 0 | Pending |  |
| `src/engine/systems/taxreturn.ts#federalLienWithdrawRefusal` | 5 | prose | 0 | Pending |  |
| `src/engine/systems/taxreturn.ts#registerFederalLien` | 8 | label, prose | 0 | Pending |  |
| `src/engine/systems/taxreturn.ts#registerFederalLien <tax.federal_lien_withdraw>` | 2 | label, prose | 0 | Pending |  |
| `src/engine/systems/taxreturn.ts#nextNotice` | 1 | label | 0 | Pending |  |
| `src/engine/systems/taxreturn.ts#billed` | 5 | label, prose | 0 | Pending |  |
| `src/engine/systems/taxreturn.ts#HOME` | 1 | label | 0 | Pending |  |
| `src/engine/systems/taxreturn.ts#planRefusal` | 6 | prose | 0 | Pending |  |
| `src/engine/systems/taxreturn.ts#startPlan` | 4 | label | 0 | Pending |  |
| `src/engine/systems/taxreturn.ts#refusePlan` | 2 | label, prose | 0 | Pending |  |
| `src/engine/systems/taxreturn.ts#newLiability` | 5 | label, prose | 0 | Pending |  |
| `src/engine/systems/taxreturn.ts#armCollection` | 2 | label | 0 | Pending |  |
| `src/engine/systems/taxreturn.ts#armTaxes` | 1 | label | 0 | Pending |  |
| `src/engine/systems/taxreturn.ts#settleUkYears` | 9 | label, prose | 0 | Pending |  |
| `src/engine/systems/taxreturn.ts#registerTaxReturn` | 73 | label, prose | 0 | Pending |  |
| `src/engine/systems/taxreturn.ts#registerTaxReturn tell()` | 1 | label | 0 | Pending |  |
| `src/engine/systems/taxreturn.ts#registerTaxReturn <tax.apply_plan>` | 5 | label, prose, refusal | 0 | Pending |  |
| `src/engine/systems/taxreturn.ts#registerTaxReturn <tax.catch_up_plan>` | 6 | label, refusal | 0 | Pending |  |
| `src/engine/systems/taxreturn.ts#registerTaxReturn <tax.revise_plan>` | 7 | label, refusal | 0 | Pending |  |
| `src/engine/systems/taxreturn.ts#registerTaxReturn <tax.file>` | 6 | label, refusal | 0 | Pending |  |
| `src/engine/systems/taxreturn.ts#registerTaxReturn <tax.pay>` | 6 | label, refusal | 0 | Pending |  |
| `src/engine/systems/taxreturn.ts#registerTaxReturn <tax.amend>` | 3 | label, refusal | 0 | Pending |  |
| `src/engine/systems/taxreturn.ts#amendRefusal` | 5 | prose | 0 | Pending |  |
| `src/engine/systems/taxreturn.ts#reconsider` | 7 | label, prose | 0 | Pending |  |
| `src/engine/systems/taxreturn.ts#amendState` | 9 | label, prose | 0 | Pending |  |
| `src/engine/systems/taxreturn.ts#splitReturns` | 3 | prose | 1 | Pending |  |
| `src/engine/systems/unemployment.ts#monetary` | 8 | prose | 0 | Pending |  |
| `src/engine/systems/unemployment.ts#claimStateFor` | 1 | label | 0 | Pending |  |
| `src/engine/systems/unemployment.ts#basePeriodFor` | 1 | label | 0 | Pending |  |
| `src/engine/systems/unemployment.ts#close` | 1 | label | 0 | Pending |  |
| `src/engine/systems/unemployment.ts#studentUnavailable` | 1 | prose | 0 | Pending |  |
| `src/engine/systems/unemployment.ts#registerUnemployment <benefits.claim>` | 5 | label, refusal | 0 | Pending |  |
| `src/engine/systems/unemployment.ts#registerUnemployment` | 7 | label, prose | 0 | Pending |  |
| `src/engine/systems/universalcredit.ts#creditRefusal` | 6 | label, prose | 0 | Pending |  |
| `src/engine/systems/universalcredit.ts#creditAward` | 4 | label | 0 | Pending |  |
| `src/engine/systems/universalcredit.ts#schedule` | 1 | label | 0 | Pending |  |
| `src/engine/systems/universalcredit.ts#close` | 1 | label | 0 | Pending |  |
| `src/engine/systems/universalcredit.ts#registerUniversalCredit` | 6 | label, prose | 0 | Pending |  |
| `src/ui/components/LienPanels.tsx#STATUS` | 7 | label | 0 | Pending |  |
| `src/ui/components/LienPanels.tsx#LienFacts` | 10 | label, prose | 0 | Pending |  |
| `src/ui/components/LienPanels.tsx#StateLienAndPenalty` | 18 | label, prose | 0 | Pending |  |
| `src/ui/components/LienPanels.tsx#FederalLien` | 9 | label, prose | 0 | Pending |  |
| `src/ui/looks/papers.tsx#KIND_WORD` | 7 | label | 0 | Pending |  |
| `src/ui/looks/papers.tsx#PLAIN_NAME` | 7 | label | 0 | Pending |  |
| `src/ui/looks/papers.tsx#whatItDoes` | 20 | label, prose | 0 | Pending |  |
| `src/ui/looks/papers.tsx#top` | 39 | attribute, label, prose | 0 | Pending |  |
| `src/ui/papers/Documents.tsx#KIND_WORD` | 7 | label | 0 | Pending |  |
| `src/ui/papers/Documents.tsx#STATUS_WORD` | 4 | label | 0 | Pending |  |
| `src/ui/papers/Documents.tsx#DocumentList` | 31 | label, prose | 0 | Pending |  |
| `src/ui/papers/Documents.tsx#PassportPane` | 36 | accessible, attribute, label, prose | 1 | Pending |  |
| `src/ui/papers/Documents.tsx#IdPanel` | 8 | accessible, label, prose | 0 | Pending |  |
| `src/ui/papers/Documents.tsx#WorkPane` | 27 | accessible, attribute, label, prose | 0 | Pending |  |
| `src/ui/papers/Documents.tsx#WorkPane <documents.apply_opt>` | 2 | label | 0 | Pending |  |
| `src/ui/papers/Documents.tsx#TaxIdPanel` | 9 | accessible, label, prose | 1 | Pending |  |
| `src/ui/papers/Documents.tsx#ResidencePanel` | 11 | accessible, attribute, label, prose | 0 | Pending |  |
| `src/ui/papers/Documents.tsx#ResidencePanel <documents.residence>` | 1 | label | 0 | Pending |  |
| `src/ui/papers/Documents.tsx#ResidencePanel <documents.renew_residence>` | 1 | label | 0 | Pending |  |
| `src/ui/papers/Documents.tsx#ResidencePanel <documents.naturalize>` | 1 | label | 0 | Pending |  |
| `src/ui/papers/Documents.tsx#ResidencePanel <documents.settle>` | 1 | label | 0 | Pending |  |
| `src/ui/workspaces/PapersWorkspace.tsx#WhoIsOwed` | 32 | label, prose | 0 | Pending |  |
| `src/ui/workspaces/PapersWorkspace.tsx#filedWords` | 10 | label, prose | 0 | Pending |  |
| `src/ui/workspaces/PapersWorkspace.tsx#amendWords` | 4 | label | 0 | Pending |  |
| `src/ui/workspaces/PapersWorkspace.tsx#StatePlanPanel` | 46 | label, prose | 0 | Pending |  |
| `src/ui/workspaces/PapersWorkspace.tsx#ReturnLife` | 31 | attribute, label, prose | 2 | Pending |  |
| `src/ui/workspaces/PapersWorkspace.tsx#PLAN_STATUS` | 6 | label | 0 | Pending |  |
| `src/ui/workspaces/PapersWorkspace.tsx#TaxPlanPanel` | 32 | accessible, label, prose | 0 | Pending |  |
| `src/ui/workspaces/PapersWorkspace.tsx#PapersWorkspace` | 6 | accessible, attribute, label, prose | 0 | Pending |  |
| `src/ui/workspaces/PapersWorkspace.tsx#ReturnsPane` | 60 | accessible, attribute, label, prose | 0 | Pending |  |
| `src/ui/workspaces/PapersWorkspace.tsx#HealthPane` | 70 | accessible, attribute, label, prose | 1 | Pending |  |
| `src/ui/workspaces/PapersWorkspace.tsx#aidWord` | 3 | label | 0 | Pending |  |
| `src/ui/workspaces/PapersWorkspace.tsx#TherapyRow` | 6 | label, prose | 0 | Pending |  |
| `src/ui/workspaces/PapersWorkspace.tsx#ConditionsPanel` | 21 | accessible, label, prose | 1 | Pending |  |
| `src/ui/workspaces/PapersWorkspace.tsx#DentalPanel` | 15 | accessible, label, prose | 2 | Pending |  |
| `src/ui/workspaces/PapersWorkspace.tsx#STATE_NAMES` | 6 | label | 0 | Pending |  |
| `src/ui/workspaces/PapersWorkspace.tsx#HomeClaimsPanel` | 30 | accessible, attribute, label, prose | 0 | Pending |  |
| `src/ui/workspaces/PapersWorkspace.tsx#AssistancePanel` | 21 | label, prose | 0 | Pending |  |
| `src/ui/workspaces/PapersWorkspace.tsx#EiPanel` | 19 | accessible, attribute, label, prose | 0 | Pending |  |
| `src/ui/workspaces/PapersWorkspace.tsx#BenefitsPane` | 26 | accessible, attribute, label, prose | 0 | Pending |  |
| `src/ui/workspaces/PapersWorkspace.tsx#YourDoctor` | 35 | accessible, attribute, label, prose | 0 | Pending |  |
| `src/ui/workspaces/PapersWorkspace.tsx#PensionsPanel` | 62 | accessible, attribute, label, prose | 1 | Pending |  |

## Health, Treatment, Coverage, Stamina, Energy And Recovery

| Source | Strings | Kinds | Engine-Speak | Status | Reason Or Evidence |
|---|---|---|---|---|---|
| `src/engine/content/body.ts#BODY` | 1 | prose | 0 | Pending |  |
| `src/engine/content/body.ts#TRAINING_CLASS_NAMES` | 1 | label | 0 | Pending |  |
| `src/engine/content/body.ts#ONSET` | 1 | prose | 0 | Pending |  |
| `src/engine/content/carevisits.ts#US_PHARMACIES [walmart]` | 1 | label | 0 | Pending |  |
| `src/engine/content/carevisits.ts#US_PHARMACIES [costco]` | 1 | label | 0 | Pending |  |
| `src/engine/content/carevisits.ts#US_PHARMACIES [kroger]` | 1 | label | 0 | Pending |  |
| `src/engine/content/carevisits.ts#US_PHARMACIES [cvs]` | 1 | label | 0 | Pending |  |
| `src/engine/content/clinics.ts#CLINICS` | 98 | label, prose | 0 | Pending |  |
| `src/engine/content/clinics.ts#SELF_PAY` | 5 | label | 0 | Pending |  |
| `src/engine/content/guide/body.ts#BODY [body.how]` | 56 | label, prose | 9 | Pending |  |
| `src/engine/content/guide/body.ts#BODY [immediate]` | 6 | prose | 2 | Pending |  |
| `src/engine/content/guide/body.ts#BODY [evaluation]` | 4 | prose | 0 | Pending |  |
| `src/engine/content/guide/body.ts#BODY [optional]` | 2 | prose | 0 | Pending |  |
| `src/engine/content/guide/body.ts#BODY [history]` | 3 | prose | 0 | Pending |  |
| `src/engine/content/guide/body.ts#BODY [body.sleep]` | 58 | label, prose | 0 | Pending |  |
| `src/engine/content/guide/body.ts#BODY [body.look-after]` | 72 | label, prose | 3 | Pending |  |
| `src/engine/content/guide/body.ts#BODY [scheduled]` | 1 | prose | 0 | Pending |  |
| `src/engine/content/injury.ts#INJURY_KIND` | 7 | label | 0 | Pending |  |
| `src/engine/content/lifespan.ts#AGING` | 8 | prose | 0 | Pending |  |
| `src/engine/systems/appointments.ts#SPECIALIST` | 1 | label | 0 | Pending |  |
| `src/engine/systems/appointments.ts#mayRefer` | 1 | label | 0 | Pending |  |
| `src/engine/systems/appointments.ts#bookIn` | 6 | label, prose | 0 | Pending |  |
| `src/engine/systems/appointments.ts#registerAppointments` | 5 | label, prose | 0 | Pending |  |
| `src/engine/systems/appointments.ts#registerAppointments <health.book>` | 3 | refusal | 0 | Pending |  |
| `src/engine/systems/appointments.ts#registerAppointments <health.cancel_appointment>` | 1 | refusal | 0 | Pending |  |
| `src/engine/systems/body.ts#bmiWord` | 4 | label | 0 | Pending |  |
| `src/engine/systems/body.ts#bodyUnits` | 3 | label, prose | 0 | Pending |  |
| `src/engine/systems/clinics.ts#MEMBERS_ONLY` | 1 | prose | 0 | Pending |  |
| `src/engine/systems/clinics.ts#clinicRefusal` | 3 | prose | 0 | Pending |  |
| `src/engine/systems/health.ts#CONDITION_LABEL` | 5 | label | 0 | Pending |  |
| `src/engine/systems/health.ts#reviewWhat` | 1 | label | 0 | Pending |  |
| `src/engine/systems/health.ts#HOME` | 1 | label | 0 | Pending |  |
| `src/engine/systems/health.ts#PROGRAM_NAMES` | 6 | label | 0 | Pending |  |
| `src/engine/systems/health.ts#mayEnroll` | 8 | prose | 0 | Pending |  |
| `src/engine/systems/health.ts#marketplaceOpen` | 5 | prose | 0 | Pending |  |
| `src/engine/systems/health.ts#armHealth` | 2 | label | 0 | Pending |  |
| `src/engine/systems/health.ts#MONTH_NAMES` | 12 | label | 0 | Pending |  |
| `src/engine/systems/health.ts#onsetMonth` | 1 | prose | 0 | Pending |  |
| `src/engine/systems/health.ts#healthMonth` | 26 | label, prose | 0 | Pending |  |
| `src/engine/systems/health.ts#BY_WORDS` | 5 | label, prose | 0 | Pending |  |
| `src/engine/systems/health.ts#renewProgram` | 2 | prose | 0 | Pending |  |
| `src/engine/systems/health.ts#applyRenewal` | 8 | label, prose | 0 | Pending |  |
| `src/engine/systems/health.ts#endAhead` | 4 | label, prose | 0 | Pending |  |
| `src/engine/systems/health.ts#workWords` | 1 | prose | 0 | Pending |  |
| `src/engine/systems/health.ts#inMonths` | 1 | label | 0 | Pending |  |
| `src/engine/systems/health.ts#noticeOfNoncompliance` | 9 | label, prose | 0 | Pending |  |
| `src/engine/systems/health.ts#grantPending` | 3 | label, prose | 0 | Pending |  |
| `src/engine/systems/health.ts#hardshipRefusal` | 6 | label, prose | 0 | Pending |  |
| `src/engine/systems/health.ts#applyRefusal` | 7 | prose | 0 | Pending |  |
| `src/engine/systems/health.ts#keepUp` | 1 | label | 0 | Pending |  |
| `src/engine/systems/health.ts#RX` | 1 | label | 0 | Pending |  |
| `src/engine/systems/health.ts#fillMedicine` | 1 | label | 0 | Pending |  |
| `src/engine/systems/health.ts#renewalDue` | 2 | label, prose | 0 | Pending |  |
| `src/engine/systems/health.ts#prepayRefusal` | 4 | prose | 0 | Pending |  |
| `src/engine/systems/health.ts#NAMED_TEETH_EYES` | 12 | label | 0 | Pending |  |
| `src/engine/systems/health.ts#illnessWeek` | 11 | label | 0 | Pending |  |
| `src/engine/systems/health.ts#careFor` | 13 | label, prose | 0 | Pending |  |
| `src/engine/systems/health.ts#repriceCare` | 7 | label, prose | 0 | Pending |  |
| `src/engine/systems/health.ts#aidRefusal` | 4 | prose | 0 | Pending |  |
| `src/engine/systems/health.ts#billCare` | 1 | label | 0 | Pending |  |
| `src/engine/systems/health.ts#extraSupplyRefusal` | 2 | prose | 0 | Pending |  |
| `src/engine/systems/health.ts#appealRefusal` | 3 | prose | 0 | Pending |  |
| `src/engine/systems/health.ts#registerHealth` | 23 | label, prose | 0 | Pending |  |
| `src/engine/systems/health.ts#registerHealth [loan]` | 2 | label | 0 | Pending |  |
| `src/engine/systems/health.ts#registerHealth <health.appeal>` | 1 | label | 0 | Pending |  |
| `src/engine/systems/health.ts#registerHealth <health.extra_supply>` | 1 | refusal | 0 | Pending |  |
| `src/engine/systems/health.ts#registerHealth <health.prepay>` | 2 | label, refusal | 0 | Pending |  |
| `src/engine/systems/health.ts#registerHealth <health.drop>` | 2 | refusal | 0 | Pending |  |
| `src/engine/systems/health.ts#registerHealth <health.choose_pharmacy>` | 2 | refusal | 0 | Pending |  |
| `src/engine/systems/health.ts#registerHealth <health.treat>` | 2 | label, refusal | 0 | Pending |  |
| `src/engine/systems/health.ts#registerHealth <health.dental>` | 8 | label, refusal | 0 | Pending |  |
| `src/engine/systems/health.ts#registerHealth <health.apply_aid>` | 1 | refusal | 0 | Pending |  |
| `src/engine/systems/health.ts#registerHealth <health.pay_bill>` | 8 | label, refusal | 0 | Pending |  |
| `src/engine/systems/health.ts#COVER_LABEL` | 4 | label | 0 | Pending |  |
| `src/engine/systems/injury.ts#shareWords` | 2 | label | 0 | Pending |  |
| `src/engine/systems/injury.ts#trainingRefusal` | 1 | prose | 0 | Pending |  |
| `src/engine/systems/injury.ts#mayHurt` | 7 | label, prose | 0 | Pending |  |
| `src/engine/systems/injury.ts#compWeek` | 2 | label | 0 | Pending |  |
| `src/engine/systems/injury.ts#registerInjury` | 1 | label | 0 | Pending |  |
| `src/engine/systems/mortality.ts#decideStretch` | 1 | label | 0 | Pending |  |
| `src/engine/systems/mortality.ts#starvedPastTheLimit` | 1 | label | 0 | Pending |  |
| `src/engine/systems/mortality.ts#registerMortality` | 2 | label, prose | 0 | Pending |  |
| `src/engine/systems/therapy.ts#THERAPISTS` | 10 | label | 0 | Pending |  |
| `src/engine/systems/therapy.ts#therapyRefusal` | 4 | prose | 0 | Pending |  |
| `src/engine/systems/therapy.ts#registerTherapy` | 8 | label, prose | 0 | Pending |  |
| `src/ui/looks/wellbeing.tsx#bodyWords` | 2 | prose | 0 | Pending |  |
| `src/ui/looks/wellbeing.tsx#DIALS [energy]` | 2 | label | 0 | Pending |  |
| `src/ui/looks/wellbeing.tsx#DIALS [stress]` | 2 | label | 0 | Pending |  |
| `src/ui/looks/wellbeing.tsx#DIALS [sleepDebt]` | 2 | label | 0 | Pending |  |
| `src/ui/looks/wellbeing.tsx#DIALS [morale]` | 2 | label, prose | 0 | Pending |  |
| `src/ui/looks/wellbeing.tsx#DIALS [condition]` | 2 | label, prose | 0 | Pending |  |
| `src/ui/looks/wellbeing.tsx#DIALS [fitness]` | 2 | label, prose | 0 | Pending |  |
| `src/ui/looks/wellbeing.tsx#DIALS [nourishment]` | 2 | label | 0 | Pending |  |
| `src/ui/looks/wellbeing.tsx#DIALS [hygiene]` | 2 | label, prose | 0 | Pending |  |
| `src/ui/looks/wellbeing.tsx#top` | 60 | label, prose | 6 | Pending |  |
| `src/ui/looks/wellbeing.tsx#sentenceFor` | 30 | label, prose | 0 | Pending |  |
| `src/ui/looks/wellbeing.tsx#leftAlone` | 5 | prose | 0 | Pending |  |

## Calendar, Schedules, Time Advancement And Reminders

| Source | Strings | Kinds | Engine-Speak | Status | Reason Or Evidence |
|---|---|---|---|---|---|
| `src/engine/content/climate.ts#CLIMATE_NAMES` | 13 | label | 0 | Pending |  |
| `src/engine/content/guide/day.ts#HAVEN_THUNDER_FROM` | 2 | label, prose | 1 | Pending |  |
| `src/engine/content/guide/day.ts#RUN_COLD` | 1 | label | 0 | Pending |  |
| `src/engine/content/guide/day.ts#RUN_HOT` | 1 | label | 0 | Pending |  |
| `src/engine/content/guide/day.ts#DAY [day.calendar]` | 55 | label, prose | 0 | Pending |  |
| `src/engine/content/guide/day.ts#DAY [prerequisite]` | 1 | prose | 0 | Pending |  |
| `src/engine/content/guide/day.ts#DAY [immediate]` | 11 | prose | 1 | Pending |  |
| `src/engine/content/guide/day.ts#DAY [optional]` | 10 | prose | 0 | Pending |  |
| `src/engine/content/guide/day.ts#DAY [evaluation]` | 2 | prose | 0 | Pending |  |
| `src/engine/content/guide/day.ts#DAY [day.clock]` | 51 | label, prose | 0 | Pending |  |
| `src/engine/content/guide/day.ts#DAY [day.advance]` | 50 | label, prose | 0 | Pending |  |
| `src/engine/content/guide/day.ts#DAY [scheduled]` | 2 | prose | 0 | Pending |  |
| `src/engine/content/guide/day.ts#DAY [day.needs]` | 53 | label, prose | 3 | Pending |  |
| `src/engine/content/guide/day.ts#DAY [history]` | 2 | prose | 0 | Pending |  |
| `src/engine/content/guide/day.ts#DAY [day.plans]` | 60 | label, prose | 2 | Pending |  |
| `src/engine/content/guide/day.ts#DAY [day.weather]` | 41 | label, prose | 2 | Pending |  |
| `src/engine/content/holiday-data.ts#HOLIDAY_FILES` | 1 | label | 0 | Pending |  |
| `src/engine/content/holidays.ts#loadCountryHolidays` | 2 | internal, label | 0 | Pending |  |
| `src/engine/content/thunder.ts#THUNDER_DAYS` | 17 | label, prose | 0 | Pending |  |
| `src/engine/core/sun.ts#formatDaylight` | 1 | label | 0 | Pending |  |
| `src/engine/core/time.ts#WEEKDAY_NAMES` | 7 | label | 0 | Pending |  |
| `src/engine/core/time.ts#MONTH_NAMES` | 12 | label | 0 | Pending |  |
| `src/engine/core/time.ts#formatDuration` | 3 | label | 0 | Pending |  |
| `src/engine/core/time.ts#seasonOf` | 17 | label | 0 | Pending |  |
| `src/engine/systems/birthdays.ts#schedule` | 1 | label | 0 | Pending |  |
| `src/engine/systems/birthdays.ts#registerBirthdays` | 2 | label, prose | 0 | Pending |  |
| `src/engine/systems/seasons.ts#FLU_TIMING` | 1 | prose | 0 | Pending |  |
| `src/engine/systems/weather.ts#SHORT` | 9 | label | 0 | Pending |  |
| `src/engine/systems/weather.ts#weatherOn` | 9 | label | 0 | Pending |  |
| `src/engine/systems/weather.ts#hourCondition` | 4 | label | 0 | Pending |  |
| `src/engine/systems/weather.ts#weatherAt` | 1 | prose | 0 | Pending |  |
| `src/engine/world/plans.ts#checkPlan` | 8 | prose | 0 | Pending |  |
| `src/engine/world/plans.ts#registerPlans` | 4 | label, prose | 0 | Pending |  |
| `src/engine/world/plans.ts#registerPlans <calendar.skip>` | 6 | label, prose | 0 | Pending |  |
| `src/engine/world/plans.ts#registerPlans <calendar.cancel>` | 5 | prose | 0 | Pending |  |
| `src/engine/world/plans.ts#PLAN_LENGTHS` | 6 | label | 0 | Pending |  |
| `src/ui/looks/day.tsx#SEASONS` | 4 | label | 0 | Pending |  |
| `src/ui/looks/day.tsx#STATUS_WORD` | 5 | label | 0 | Pending |  |
| `src/ui/looks/day.tsx#dayKindOf` | 5 | label | 0 | Pending |  |
| `src/ui/looks/day.tsx#spokenWhen` | 1 | label | 0 | Pending |  |
| `src/ui/looks/day.tsx#missCost` | 9 | label, prose | 0 | Pending |  |
| `src/ui/looks/day.tsx#entryDetail` | 4 | label, prose | 0 | Pending |  |
| `src/ui/looks/day.tsx#top` | 110 | attribute, label, prose | 1 | Pending |  |
| `src/ui/looks/day.tsx#top [observed]` | 8 | label, prose | 0 | Pending |  |
| `src/ui/looks/day.tsx#loadOf` | 5 | label | 0 | Pending |  |
| `src/ui/looks/day.tsx#daySentence` | 11 | label, prose | 0 | Pending |  |
| `src/ui/looks/day.tsx#lightSentence` | 3 | prose | 0 | Pending |  |
| `src/ui/looks/day.tsx#lightDetail` | 3 | label | 0 | Pending |  |
| `src/ui/looks/day.tsx#quarterSentence` | 3 | label | 0 | Pending |  |
| `src/ui/looks/day.tsx#entrySentence` | 8 | label, prose | 0 | Pending |  |
| `src/ui/looks/place.tsx#spokenName` | 1 | label | 0 | Pending |  |
| `src/ui/looks/place.tsx#clockAgainstHome` | 3 | label | 0 | Pending |  |
| `src/ui/looks/place.tsx#lightLine` | 4 | label | 0 | Pending |  |
| `src/ui/looks/place.tsx#rateLine` | 4 | label, prose | 0 | Pending |  |
| `src/ui/looks/place.tsx#top` | 140 | attribute, label, prose | 3 | Pending |  |
| `src/ui/looks/place.tsx#summaryOfPlace` | 3 | prose | 0 | Pending |  |
| `src/ui/looks/place.tsx#REGION_WORD` | 26 | label | 0 | Pending |  |
| `src/ui/looks/place.tsx#regionWord` | 1 | label | 0 | Pending |  |
| `src/ui/looks/place.tsx#swingLine` | 2 | prose | 0 | Pending |  |
| `src/ui/looks/place.tsx#latitudeLine` | 7 | label, prose | 0 | Pending |  |
| `src/ui/looks/place.tsx#yearLine` | 5 | label, prose | 0 | Pending |  |
| `src/ui/looks/plans.tsx#top` | 38 | attribute, label, prose | 0 | Pending |  |
| `src/ui/looks/weather.tsx#DOING` | 1 | label | 0 | Pending |  |
| `src/ui/looks/weather.tsx#BRINGS` | 5 | label | 0 | Pending |  |
| `src/ui/looks/weather.tsx#BAND` | 13 | prose | 0 | Pending |  |
| `src/ui/looks/weather.tsx#WHEN_KIND` | 7 | label | 0 | Pending |  |
| `src/ui/looks/weather.tsx#windOf` | 1 | label | 0 | Pending |  |
| `src/ui/looks/weather.tsx#weekdayAt` | 1 | label | 0 | Pending |  |
| `src/ui/looks/weather.tsx#againstNormal` | 2 | label | 0 | Pending |  |
| `src/ui/looks/weather.tsx#top` | 97 | attribute, label, prose | 0 | Pending |  |
| `src/ui/looks/weather.tsx#top [band]` | 7 | label, prose | 1 | Pending |  |
| `src/ui/looks/weather.tsx#stretchOf` | 5 | label | 0 | Pending |  |
| `src/ui/looks/weather.tsx#clockWord` | 2 | label | 0 | Pending |  |
| `src/ui/looks/weather.tsx#spellSentence` | 4 | prose | 0 | Pending |  |
| `src/ui/workspaces/CalendarWorkspace.tsx#WEEKDAYS` | 7 | label | 0 | Pending |  |
| `src/ui/workspaces/CalendarWorkspace.tsx#CalendarWorkspace` | 19 | accessible, attribute, label, prose | 0 | Pending |  |
| `src/ui/workspaces/CalendarWorkspace.tsx#PlanForm` | 11 | accessible, label, placeholder, prose | 0 | Pending |  |
| `src/ui/workspaces/CalendarWorkspace.tsx#EntryDetail` | 11 | label, prose | 0 | Pending |  |
| `src/ui/workspaces/CalendarWorkspace.tsx#MONTHS` | 12 | label | 0 | Pending |  |
| `src/ui/workspaces/CalendarWorkspace.tsx#statusWords` | 1 | label | 0 | Pending |  |

## Notifications, Invitations, Feedback And Generated Messages

| Source | Strings | Kinds | Engine-Speak | Status | Reason Or Evidence |
|---|---|---|---|---|---|
| `src/engine/core/events.ts#EventBus` | 4 | internal | 0 | Pending |  |
| `src/engine/core/simulation.ts#Simulation` | 15 | internal, label, prose, refusal | 0 | Pending |  |
| `src/engine/world/bootstrap.ts#defaultConfig` | 2 | label | 0 | Pending |  |
| `src/engine/world/bootstrap.ts#WEALTH_PROFILE` | 6 | prose | 0 | Pending |  |
| `src/engine/world/bootstrap.ts#createUniverse` | 1 | internal | 0 | Pending |  |
| `src/engine/world/calendar.ts#CALENDAR_LEGEND` | 10 | label, prose | 0 | Pending |  |
| `src/engine/world/calendar.ts#skipTargets` | 3 | label, prose | 0 | Pending |  |
| `src/engine/world/place.ts#placeKindLabel` | 2 | label | 0 | Pending |  |
| `src/engine/world/place.ts#REGION_WORD` | 28 | label | 0 | Pending |  |
| `src/engine/world/place.ts#placeProfile` | 2 | label | 0 | Pending |  |
| `src/engine/world/world.ts#registerWorld [world.tick]` | 1 | label | 0 | Pending |  |
| `src/engine/world/world.ts#registerWorld <world.dismiss_decision>` | 2 | refusal | 0 | Pending |  |
| `src/engine/world/world.ts#registerWorld <world.take_decision_action>` | 5 | refusal | 0 | Pending |  |
| `src/engine/world/world.ts#registerWorld <world.set_preferences>` | 2 | refusal | 0 | Pending |  |
| `src/ui/looks/attention.tsx#RAISED_BY` | 16 | label | 0 | Pending |  |
| `src/ui/looks/attention.tsx#raisedBy` | 1 | label | 0 | Pending |  |
| `src/ui/looks/attention.tsx#categoryLabel` | 1 | label | 0 | Pending |  |
| `src/ui/looks/attention.tsx#nameOf` | 1 | label | 0 | Pending |  |
| `src/ui/looks/attention.tsx#weightOf` | 4 | label, prose | 0 | Pending |  |
| `src/ui/looks/attention.tsx#stageOf` | 2 | label | 0 | Pending |  |
| `src/ui/looks/attention.tsx#decisionSentence` | 5 | prose | 0 | Pending |  |
| `src/ui/looks/attention.tsx#top` | 63 | attribute, label, prose | 1 | Pending |  |

## Buttons, Menus, Tabs, Filters, Placeholders, Empty And Loading States, Confirmations

| Source | Strings | Kinds | Engine-Speak | Status | Reason Or Evidence |
|---|---|---|---|---|---|
| `src/ui/components/primitives.tsx#WhyNot` | 1 | label | 0 | Pending |  |
| `src/ui/components/primitives.tsx#Fine` | 1 | label | 0 | Pending |  |
| `src/ui/components/primitives.tsx#Empty` | 1 | label | 0 | Pending |  |
| `src/ui/components/primitives.tsx#FOCUSABLE` | 1 | label | 0 | Pending |  |
| `src/ui/components/primitives.tsx#Modal` | 3 | accessible, label | 0 | Pending |  |
| `src/ui/looks/Look.tsx#LookPanel` | 1 | label | 0 | Pending |  |
| `src/ui/looks/Look.tsx#LookHeader` | 1 | label | 0 | Pending |  |
| `src/ui/looks/Look.tsx#Ways` | 1 | label | 0 | Pending |  |
| `src/ui/looks/registry.ts#defineLook` | 1 | internal | 0 | Pending |  |
| `src/ui/looks/registry.ts#trailTo` | 1 | internal | 0 | Pending |  |
| `src/ui/shell/GameShell.tsx#GameShell` | 19 | accessible, label, prose | 0 | Pending |  |
| `src/ui/shell/GameShell.tsx#SaveIndicator` | 4 | label | 0 | Pending |  |
| `src/ui/shell/LifeEnded.tsx#LifeEnded` | 12 | label, prose | 0 | Pending |  |
| `src/ui/shell/TimeControls.tsx#MENU_FOOT` | 1 | label | 0 | Pending |  |
| `src/ui/shell/TimeControls.tsx#DIAL_LABEL` | 8 | label | 0 | Pending |  |
| `src/ui/shell/TimeControls.tsx#TimeControls` | 18 | accessible, label, prose | 0 | Pending |  |
| `src/ui/shell/TimeControls.tsx#SleepDialog` | 13 | accessible, label, prose | 0 | Pending |  |
| `src/ui/shell/TimeControls.tsx#DueNow` | 12 | label, prose | 0 | Pending |  |
| `src/ui/shell/TimeControls.tsx#SkipDialog` | 16 | accessible, label, prose | 0 | Pending |  |
| `src/ui/shell/TimeControls.tsx#AdvanceMenu` | 13 | accessible, label, prose | 0 | Pending |  |
| `src/ui/shell/TimeControls.tsx#LookAfterMenu` | 6 | accessible, label, prose | 0 | Pending |  |
| `src/ui/shell/destinations.ts#DESTINATIONS` | 14 | label, prose | 0 | Pending |  |
| `src/ui/shell/sections.ts#SECTIONS [standing]` | 1 | label | 0 | Pending |  |
| `src/ui/shell/sections.ts#SECTIONS [classes]` | 1 | label | 0 | Pending |  |
| `src/ui/shell/sections.ts#SECTIONS [coursework]` | 1 | label | 0 | Pending |  |
| `src/ui/shell/sections.ts#SECTIONS [casting]` | 1 | label | 0 | Pending |  |
| `src/ui/shell/sections.ts#SECTIONS [work]` | 2 | label | 0 | Pending |  |
| `src/ui/shell/sections.ts#SECTIONS [terms]` | 1 | label | 0 | Pending |  |
| `src/ui/shell/sections.ts#SECTIONS [accounts]` | 1 | label | 0 | Pending |  |
| `src/ui/shell/sections.ts#SECTIONS [cards]` | 1 | label | 0 | Pending |  |
| `src/ui/shell/sections.ts#SECTIONS [payments]` | 1 | label | 0 | Pending |  |
| `src/ui/shell/sections.ts#SECTIONS [borrowing]` | 1 | label | 0 | Pending |  |
| `src/ui/shell/sections.ts#SECTIONS [statements]` | 1 | label | 0 | Pending |  |
| `src/ui/shell/sections.ts#SECTIONS [returns]` | 1 | label | 0 | Pending |  |
| `src/ui/shell/sections.ts#SECTIONS [health]` | 1 | label | 0 | Pending |  |
| `src/ui/shell/sections.ts#SECTIONS [benefits]` | 1 | label | 0 | Pending |  |
| `src/ui/shell/sections.ts#SECTIONS [passport]` | 1 | label | 0 | Pending |  |
| `src/ui/workspaces/WorkspaceRouter.tsx#LockedScreen` | 4 | label, prose | 0 | Pending |  |
| `src/ui/workspaces/WorkspaceRouter.tsx#NoSuchScreen` | 4 | label, prose | 0 | Pending |  |
| `src/ui/workspaces/cell.ts#dayLabel` | 3 | prose | 0 | Pending |  |

## In-World Material: Scenes, Plays And Audition Sides, In Their Characters’ Voices

| Source | Strings | Kinds | Engine-Speak | Status | Reason Or Evidence |
|---|---|---|---|---|---|
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [brief-action]` | 16 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [clock]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [reason]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [brief-absurdist]` | 15 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [reasonable]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [dread]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [brief-action_comedy]` | 16 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [cake]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [whisper]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [brief-adventure]` | 15 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [quest]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [betrayed]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [brief-alternate_history]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [ordinary]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [memory]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [brief-animated]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [brag]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [brave]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [brief-anime]` | 16 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [sync]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [laugh]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [brief-anthology]` | 13 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [secret]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [tale]` | 3 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [brief-apocalyptic]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [keeper]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [debt]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [brief-art_house]` | 15 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [still]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [listening]` | 3 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [brief-avant_garde]` | 15 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [task]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [found]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [brief-backstage_musical]` | 17 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [nerve]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [number]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [brief-biker]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [hard]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [mother]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [brief-biographical]` | 15 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [likeness]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [person]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [brief-black_comedy]` | 15 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [calm]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [grief]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [brief-blaxploitation]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [block]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [known]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [brief-body_horror]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [control]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [loss]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [brief-buddy_comedy]` | 15 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [friction]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [scared]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [brief-buddy_cop]` | 15 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [banter]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [partners]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [brief-caper]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [pro]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [student]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [brief-chanbara]` | 17 | label, prose | 2 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [form]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [teacher]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [brief-chase]` | 16 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [breath]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [persuade]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [brief-childrens]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [speech]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [brief-christmas]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [sincere]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [brisk]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [brief-comedy]` | 15 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [timing]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-a.ts#BRIEFS_A [truth]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [brief-coming_of_age]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [growing]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [loyal]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [brief-concert_film]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [decided]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [grieving]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [brief-conspiracy_thriller]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [hunter]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [hunted]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [brief-cosmic_horror]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [detached]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [holding]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [brief-costume_drama]` | 15 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [form]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [pride]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [brief-courtroom_drama]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [craft]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [care]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [brief-creature_feature]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [expert]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [afraid]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [brief-crime]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [protector]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [business]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [brief-cyberpunk]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [system]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [person]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [brief-dance]` | 15 | label, prose | 2 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [legacy]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [farewell]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [brief-dark_fantasy]` | 15 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [bargainer]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [mother]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [brief-detective]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [chess]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [sympathy]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [brief-disaster]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [professional]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [strangers]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [brief-docudrama]` | 16 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [witness]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [memory]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [brief-docufiction]` | 16 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [ordinary]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [open]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [brief-documentary]` | 15 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [letters]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [narration]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [brief-domestic_drama]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [tired]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [partners]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [brief-drama]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [guarded]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [listening]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [brief-dystopian]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [liar]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [pleader]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [brief-eco_horror]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [scientist]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [brief-epic]` | 15 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [courtier]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [son]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [brief-erotic_thriller]` | 16 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [control]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [danger]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [brief-espionage]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [still]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [father]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [brief-experimental]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [precision]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [reaction]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [brief-exploitation]` | 16 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [revenge]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-b.ts#BRIEFS_B [player]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [brief-fairy_tale]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [riddle]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [forgive]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [brief-family]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [deal]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [scared]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [brief-fantasy]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [craft]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [brother]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [wonder]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [brief-farce]` | 17 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [calm]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [panic]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [brief-film_noir]` | 17 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [cool]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [liked]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [two]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [brief-folk_horror]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [polite]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [slow]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [brief-found_footage]` | 17 | label, prose | 2 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [mom]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [live]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [brief-gangster]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [king]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [lesson]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [brief-giallo]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [sleuth]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [dread]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [brief-gothic_horror]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [inquiry]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [longing]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [brief-grindhouse]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [nerve]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [terror]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [brief-hangout]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [easy]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [unsaid]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [brief-heist]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [recall]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [reason]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [brief-historical_drama]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [duty]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [sister]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [brief-historical_fiction]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [true]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [learned]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [brief-holiday]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [sincere]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [light]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [brief-hood_film]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [brothers]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [own]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [brief-horror]` | 16 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [trust]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [training]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [brief-horror_comedy]` | 15 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [straight]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [hustle]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [brief-isekai]` | 15 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [audit]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [nobody]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [brief-jidaigeki]` | 18 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [forms]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [grief]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [brief-jukebox_musical]` | 16 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [dare]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [apology]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [brief-kaiju]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [line]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [awe]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [brief-kitchen_sink]` | 16 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [angry]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [son]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [brief-legal_drama]` | 15 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [counsel]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-c.ts#BRIEFS_C [promise]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [brief-magical_realism]` | 13 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [plain]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [keeping]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [brief-martial_arts]` | 16 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [form]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [temper]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [brief-medical_drama]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [numbers]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [hunch]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [brief-melodrama]` | 15 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [full]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [held]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [brief-military]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [rank]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [human]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [brief-mockumentary]` | 17 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [believes]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [lens]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [brief-monster_movie]` | 16 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [dread]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [sister]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [brief-mumblecore]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [small]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [friends]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [brief-musical]` | 19 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [persuade]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [farewell]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [brief-mystery]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [sleuth]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [fear]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [brief-nature_documentary]` | 16 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [observer]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [story]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [brief-neo_noir]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [cool]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [tempted]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [brief-neorealism]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [pride]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [brief-new_wave]` | 15 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [whim]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [hope]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [brief-nordic_noir]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [closed]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [reach]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [brief-occult]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [skeptic]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [family]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [brief-parody]` | 17 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [deadpan]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [size]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [brief-period_drama]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [appeal]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [brief-picaresque]` | 14 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [charm]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [survival]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [brief-police_procedural]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [procedure]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [loyalty]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [brief-political_drama]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [operator]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [friend]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [brief-political_thriller]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [still]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [betrayal]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [brief-post_apocalyptic]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [steward]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [voice]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [brief-prison_film]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [dignity]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [reaching]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [brief-psychological_horror]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [grief]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [real]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-d.ts#BRIEFS_D [unsure]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [brief-psychological_thriller]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [right]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [slipping]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [brief-queer_cinema]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [comedy]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [decision]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [brief-revenge]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [plan]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [chance]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [brief-road_movie]` | 13 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [driver]` | 3 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [friends]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [brief-rockumentary]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [pro]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [relief]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [brief-romance]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [hoping]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [surprised]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [brief-romantic_comedy]` | 15 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [sparring]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [flustered]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [brief-romantic_drama]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [sacrifice]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [listening]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [brief-samurai]` | 17 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [duty]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [debt]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [brief-satire]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [believer]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [trapped]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [brief-science_fantasy]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [con]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [wonder]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [brief-science_fiction]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [catchup]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [loss]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [brief-screwball_comedy]` | 16 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [speed]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [pair]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [brief-sea_adventure]` | 15 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [craft]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [fear]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [brief-silent_film]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [clown]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [heart]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [brief-slapstick]` | 16 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [dignity]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [panic]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [brief-slasher]` | 15 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [clear]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [dread]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [brief-slice_of_life]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [drawn]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [glad]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [brief-social_realism]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [tired]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [organizer]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [brief-space_opera]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [grand]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [sisters]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [brief-spaghetti_western]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [stone]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [trade]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [brief-splatter]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [politeness]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [shock]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [brief-sports]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [coach]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [goodbye]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [brief-spy]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [tradecraft]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [marriage]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [brief-steampunk]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [bluff]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-e.ts#BRIEFS_E [pride]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [brief-stoner_comedy]` | 15 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [host]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [dawning]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [brief-superhero]` | 18 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [sister]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [cost]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [brief-supernatural]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [skeptic]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [welcome]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [brief-surrealist]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [straight]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [dream]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [brief-survival]` | 14 | label, prose | 3 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [procedure]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [body]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [daughter]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [brief-swashbuckler]` | 17 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [play]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [stall]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [brief-sword_and_sandal]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [servant]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [father]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [brief-sword_and_sorcery]` | 16 | label, prose | 2 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [blade]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [mirror]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [brief-techno_thriller]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [expert]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [town]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [brief-teen]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [righteous]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [caught]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [brief-thriller]` | 16 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [steady]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [fraying]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [brief-time_travel]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [weary]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [puzzle]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [brief-tokusatsu]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [scale]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [recruit]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [brief-tragedy]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [duty]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [brief-tragicomedy]` | 16 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [performer]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [dam]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [brief-true_crime]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [rote]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [guilt]` | 3 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [brief-vampire]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [brother]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [hunger]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [brief-war]` | 16 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [medic]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [mother]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [brief-werewolf]` | 15 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [planner]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [fear]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [brief-western]` | 17 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [iron]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [neighbor]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [brief-whodunit]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [sleuth]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [danger]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [brief-wuxia]` | 17 | label, prose | 2 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [code]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [grief]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [brief-yakuza]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [elder]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [regret]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [brief-zombie]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [route]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/briefs-f.ts#BRIEFS_F [friend]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/index.ts#RETIRED_BRIEFS` | 14 | label | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [brief-action-2]` | 19 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [corner]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [champion]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [roof]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [brief-absurdist-2]` | 15 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [escape]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [relief]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [brief-action_comedy-2]` | 17 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [book]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [stunt]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [kid]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [brief-adventure-2]` | 16 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [mother]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [silence]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [brief-alternate_history-2]` | 17 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [calm]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [world]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [names]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [brief-animated-3]` | 18 | label, prose | 2 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [weight]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [teacher]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [proud]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [brief-anime-2]` | 16 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [strain]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [sister]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [brief-anthology-2]` | 16 | label, prose | 3 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [frame]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [glove]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [brief-apocalyptic-2]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [ordinary]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [promise]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [brief-art_house-2]` | 17 | label, prose | 2 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [close]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [voice]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [found]` | 3 | label, prose | 2 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [brief-avant_garde-2]` | 16 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [score]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [freed]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [brief-backstage_musical-2]` | 21 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [sell]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [hers]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [company]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [brief-biker-2]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [business]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [family]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [brief-biographical-2]` | 19 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [mind]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [record]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [room]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [brief-black_comedy-2]` | 16 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [deadpan]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [goodbye]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [brief-blaxploitation-2]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [cool]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [garland]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [brief-body_horror-2]` | 17 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [lesson]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [becoming]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [marriage]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [brief-buddy_comedy-2]` | 17 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [poles]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [laugh]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [brief-buddy_cop-2]` | 18 | label, prose | 2 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [cover]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [team]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [brief-caper-2]` | 17 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [bait]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [hero]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [brief-chanbara-2]` | 18 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [line]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [painter]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [brief-chase-2]` | 15 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [pace]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [husband]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [race]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [brief-childrens-2]` | 12 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [jealous]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [friend]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [brief-christmas-3]` | 17 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [live]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [suit]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [brief-comedy-2]` | 19 | label, prose | 3 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [list]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [horn]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-a.ts#SECOND_A [tess]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [brief-coming_of_age-2]` | 15 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [free]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [losing]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [brief-concert_film-2]` | 16 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [pro]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [song]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [wings]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [brief-conspiracy_thriller-3]` | 16 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [ledger]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [nerve]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [name]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [brief-cosmic_horror-2]` | 16 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [record]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [tomas]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [peace]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [brief-costume_drama-2]` | 16 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [robe]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [caution]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [brief-courtroom_drama-2]` | 12 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [right]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [parents]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [brief-creature_feature-2]` | 16 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [measure]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [stubborn]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [brief-crime-2]` | 16 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [boy]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [game]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [brief-cyberpunk-2]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [buyback]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [keeper]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [brief-dance-2]` | 18 | label, prose | 2 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [promise]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [two]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [brief-dark_fantasy-2]` | 16 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [mercy]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [voices]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [brief-detective-2]` | 16 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [minute]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [heard]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [guilt]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [brief-disaster-2]` | 17 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [anchor]` | 3 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [listener]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [brief-docudrama-2]` | 17 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [delegate]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [door]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [brief-docufiction-2]` | 17 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [rules]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [offers]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [brief-documentary-2]` | 17 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [film]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [him]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [brief-domestic_drama-2]` | 16 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [sewing]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [son]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [brief-drama-2]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [own]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [brief-dystopian-2]` | 17 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [spelling]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [sent]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [brief-eco_horror-2]` | 15 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [out]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [pulled]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [brief-epic-2]` | 18 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [soldier]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [orchard]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [brief-erotic_thriller-2]` | 16 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [vote]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [want]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [brief-espionage-2]` | 16 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [never]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [trust]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [brief-experimental-2]` | 19 | label, prose | 2 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [list]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [her]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [brief-exploitation-2]` | 17 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [cool]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-b.ts#SECOND_B [afraid]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [brief-fairy_tale-2]` | 17 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [vain]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [keeper]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [bell]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [brief-family-2]` | 17 | label, prose | 4 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [pro]` | 6 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [son]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [spotter]` | 3 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [brief-fantasy-2]` | 16 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [race]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [price]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [meet]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [brief-farce-3]` | 19 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [ledger]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [doors]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [believer]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [brief-film_noir-3]` | 19 | label, prose | 3 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [hands]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [working]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [tired]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [brief-folk_horror-2]` | 15 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [grief]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [outsider]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [win]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [brief-found_footage-2]` | 16 | label, prose | 2 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [party]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [letter]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [brief-gangster-2]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [business]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [fear]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [brief-giallo-2]` | 18 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [story]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [next]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [brief-gothic_horror-3]` | 16 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [record]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [door]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [hand]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [brief-grindhouse-2]` | 17 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [calm]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [stunt]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [brief-hangout-2]` | 17 | label, prose | 2 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [company]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [alone]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [brief-heist-2]` | 17 | label, prose | 6 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [pass]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [pride]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [brief-historical_drama-2]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [facts]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [neighbor]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [brief-historical_fiction-2]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [guilt]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [gift]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [brief-holiday-2]` | 16 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [policy]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [boy]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [brief-hood_film-2]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [place]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [nod]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [brief-horror-2]` | 15 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [steady]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [eli]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [brief-horror_comedy-2]` | 19 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [show]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [made]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [kids]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [brief-isekai-2]` | 19 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [fan]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [author]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [word]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [brief-jidaigeki-2]` | 19 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [rule]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [face]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [spear]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [brief-jukebox_musical-3]` | 19 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [floor]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [chair]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [uncle]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [brief-kaiju-2]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [waiting]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [customer]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [brief-kitchen_sink-2]` | 16 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [sister]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [brief-legal_drama-2]` | 16 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [advocate]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [fond]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-c.ts#SECOND_C [two]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [brief-magical_realism-2]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [routine]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [messenger]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [brief-martial_arts-2]` | 18 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [restraint]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [brother]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [endure]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [brief-medical_drama-2]` | 15 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [steady]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [witness]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [brief-melodrama-2]` | 18 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [storm]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [child]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [pride]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [brief-military-2]` | 16 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [light]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [reach]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [brief-mockumentary-2]` | 18 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [sell]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [invent]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [dream]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [brief-monster_movie-2]` | 15 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [leader]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [terror]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [brief-mumblecore-2]` | 15 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [cool]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [hoping]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [brief-musical-2]` | 20 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [number]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [love]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [brief-mystery-2]` | 17 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [reasoner]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [student]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [cornered]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [brief-nature_documentary-2]` | 17 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [storyteller]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [clock]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [brief-neo_noir-2]` | 17 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [confession]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [brief-neorealism-2]` | 15 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [plain]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [house]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [brief-new_wave-3]` | 19 | label, prose | 4 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [narration]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [waiting]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [brief-nordic_noir-2]` | 15 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [method]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [town]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [brief-occult-2]` | 18 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [business]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [pulled]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [brief-parody-2]` | 17 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [straight]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [epic]` | 3 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [brief-period_drama-2]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [ledger]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [widow]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [brief-picaresque-2]` | 17 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [raconteur]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [tired]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [breath]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [brief-police_procedural-2]` | 16 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [procedure]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [strain]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [brief-political_drama-2]` | 18 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [orator]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [conscience]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [walt]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [brief-political_thriller-2]` | 16 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [neutral]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [defiance]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [brief-post_apocalyptic-2]` | 15 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [teacher]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [future]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [brief-prison_film-2]` | 16 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [rules]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [kid]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [brief-psychological_horror-2]` | 15 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [together]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [loop]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-d.ts#SECOND_D [awake]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [brief-psychological_thriller-3]` | 17 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [exact]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [detail]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [studying]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [brief-queer_cinema-2]` | 14 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [title]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [teammate]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [brief-revenge-2]` | 17 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [stacked]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [straight]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [brief-road_movie-2]` | 12 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [pitch]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [gift]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [brief-rockumentary-2]` | 16 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [show]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [song]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [brief-romance-2]` | 16 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [nerve]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [knew]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [brief-romantic_comedy-2]` | 15 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [bet]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [questions]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [brief-romantic_drama-2]` | 16 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [listen]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [plan]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [brief-samurai-3]` | 17 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [pride]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [hunger]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [haggle]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [brief-satire-2]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [company]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [sees]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [brief-science_fantasy-2]` | 15 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [letter]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [surety]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [brief-science_fiction-2]` | 16 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [record]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [sister]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [afraid]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [brief-screwball_comedy-2]` | 18 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [liar]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [caught]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [brief-sea_adventure-2]` | 18 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [command]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [shipmate]` | 3 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [brief-silent_film-3]` | 17 | label, prose | 2 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [calls]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [own]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [eyes]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [brief-slapstick-2]` | 17 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [sport]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [father]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [brief-slasher-2]` | 17 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [medic]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [terror]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [brief-slice_of_life-2]` | 14 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [properly]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [tour]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [brief-social_realism-2]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [braced]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [angry]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [brief-space_opera-2]` | 17 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [order]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [goodnight]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [enemy]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [brief-spaghetti_western-2]` | 15 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [books]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [dare]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [brief-splatter-2]` | 15 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [farmer]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [alone]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [brief-sports-2]` | 15 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [honest]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [brief-spy-2]` | 15 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [breath]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [brief-steampunk-2]` | 15 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [hands]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-e.ts#SECOND_E [forgive]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [brief-stoner_comedy-2]` | 18 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [impression]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [honest]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [adrift]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [brief-superhero-2]` | 17 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [public]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [bakery]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [brief-supernatural-2]` | 13 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [father]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [lonely]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [dread]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [brief-surrealist-2]` | 18 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [home]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [wish]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [name]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [brief-survival-2]` | 15 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [mechanic]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [afraid]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [brief-swashbuckler-2]` | 18 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [blade]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [rogue]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [respect]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [brief-sword_and_sandal-2]` | 16 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [devout]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [shrewd]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [boy]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [brief-sword_and_sorcery-3]` | 20 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [word]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [faith]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [silence]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [brief-techno_thriller-2]` | 15 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [script]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [friend]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [doubt]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [brief-teen-2]` | 17 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [poet]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [hustle]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [brief-thriller-2]` | 15 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [knows]` | 6 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [believe]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [either]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [brief-time_travel-2]` | 16 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [sister]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [clock]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [brief-tokusatsu-2]` | 17 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [hero]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [cadets]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [suit]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [brief-tragedy-2]` | 16 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [certain]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [teacher]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [brief-tragicomedy-3]` | 17 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [half]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [listeners]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [line]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [brief-true_crime-2]` | 15 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [record]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [reckoning]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [brief-vampire-2]` | 17 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [gentleman]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [hunger]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [decent]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [brief-war-2]` | 18 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [hunted]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [book]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [brief-werewolf-2]` | 17 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [charm]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [feather]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [brief-western-2]` | 16 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [craft]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [street]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [decision]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [brief-whodunit-2]` | 19 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [ear]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [help]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [brief-wuxia-2]` | 16 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [eager]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [student]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [brief-yakuza-3]` | 19 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [form]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [room]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [between]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [brief-zombie-2]` | 14 | label, prose | 1 | Pending |  |
| `src/engine/content/briefs/second-f.ts#SECOND_F [nurse]` | 3 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-classical.ts#CLASSICAL_SCENES [twelfth-1-5]` | 45 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-classical.ts#CLASSICAL_SCENES [shrew-2-1]` | 44 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-classical.ts#CLASSICAL_SCENES [scandal-2-1]` | 42 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-classical.ts#CLASSICAL_SCENES [richard3-1-2]` | 43 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-classical.ts#CLASSICAL_SCENES [hamlet-3-1]` | 44 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-classical.ts#CLASSICAL_SCENES [othello-4-3]` | 41 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-classical.ts#CLASSICAL_SCENES [measure-2-4]` | 42 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-classical.ts#CLASSICAL_SCENES [hamlet-3-4]` | 50 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-classical.ts#CLASSICAL_SCENES [caesar-4-3]` | 48 | label, prose | 1 | Pending |  |
| `src/engine/content/scenes-classical.ts#CLASSICAL_SCENES [caesar-2-1]` | 45 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-classical.ts#CLASSICAL_SCENES [lear-4-7]` | 47 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-classical.ts#CLASSICAL_SCENES [asyoulike-3-2]` | 45 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-classical.ts#CLASSICAL_SCENES [dream-3-2]` | 48 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-classical.ts#CLASSICAL_SCENES [twelfth-2-4]` | 46 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-classical.ts#CLASSICAL_SCENES [faustus-3]` | 46 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-classical.ts#CLASSICAL_SCENES [malfi-1]` | 44 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-classical.ts#CLASSICAL_SCENES [wayoftheworld-4]` | 42 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-classical.ts#CLASSICAL_SCENES [stoops-2]` | 40 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-greek.ts#GREEK_SCENES [antigone-441]` | 50 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-greek.ts#GREEK_SCENES [oedipus-300]` | 50 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-greek.ts#GREEK_SCENES [electra-328]` | 50 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-greek.ts#GREEK_SCENES [medea-446]` | 50 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-greek.ts#GREEK_SCENES [bacchae-451]` | 50 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-greek.ts#GREEK_SCENES [agamemnon-855]` | 50 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-house.ts#HOUSE_SCENES [caesar-3-2]` | 54 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-house.ts#HOUSE_SCENES [henry5-4-3]` | 54 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-house.ts#HOUSE_SCENES [oedipus-1]` | 54 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-house.ts#HOUSE_SCENES [dream-5-1]` | 54 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-meeting.ts#MEETING_SCENES [enemy-4]` | 54 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-meeting.ts#MEETING_SCENES [strife-2-2]` | 54 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-modern.ts#MODERN_SCENES [hedda-2]` | 52 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-modern.ts#MODERN_SCENES [arms-1]` | 48 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-modern.ts#MODERN_SCENES [proposal]` | 46 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-modern.ts#MODERN_SCENES [windermere-1]` | 46 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-modern.ts#MODERN_SCENES [suppressed-2]` | 46 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-modern.ts#MODERN_SCENES [rising-moon]` | 46 | label, prose | 2 | Pending |  |
| `src/engine/content/scenes-modern.ts#MODERN_SCENES [creditors]` | 47 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-modern.ts#MODERN_SCENES [anna-christie-1]` | 46 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-modern.ts#MODERN_SCENES [ghosts-1]` | 43 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-modern.ts#MODERN_SCENES [masterbuilder-1]` | 40 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-modern.ts#MODERN_SCENES [riders-sea]` | 39 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-original.ts#BY` | 1 | label | 0 | Pending |  |
| `src/engine/content/scenes-original.ts#ORIGINAL_SCENES [orig-night-desk]` | 54 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-original.ts#ORIGINAL_SCENES [orig-bed-fourteen]` | 54 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-original.ts#ORIGINAL_SCENES [orig-what-we-keep]` | 54 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-original.ts#ORIGINAL_SCENES [orig-runway]` | 54 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-original.ts#ORIGINAL_SCENES [orig-hundred-questions]` | 54 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-original.ts#ORIGINAL_SCENES [orig-office-hours]` | 54 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-original.ts#ORIGINAL_SCENES [orig-two-time-zones]` | 54 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-original.ts#ORIGINAL_SCENES [orig-the-reception]` | 54 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-public.ts#PUBLIC_SCENES [enemy-2]` | 52 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-public.ts#PUBLIC_SCENES [strife-1]` | 54 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-public.ts#PUBLIC_SCENES [justice-2]` | 50 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-public.ts#PUBLIC_SCENES [weavers-1]` | 52 | label, prose | 0 | Pending |  |
| `src/engine/content/scenes-scored.ts#SCORED_SCENES [scapin-3-2]` | 54 | label, prose | 0 | Pending |  |

## The World: Places, Countries, Weather And Reference Data

| Source | Strings | Kinds | Engine-Speak | Status | Reason Or Evidence |
|---|---|---|---|---|---|
| `src/engine/content/geography.ts#CONTINENT_NAMES` | 7 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#COUNTRY_ALIASES` | 11 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#city` | 1 | prose | 0 | Pending |  |
| `src/engine/content/geography.ts#CALIBRATED_CITIES [us-ca-losangeles]` | 3 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#CALIBRATED_CITIES [us-ca-burbank]` | 2 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#CALIBRATED_CITIES [us-ca-santamonica]` | 2 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#CALIBRATED_CITIES [us-ca-sanfrancisco]` | 2 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#CALIBRATED_CITIES [us-ca-sandiego]` | 2 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#CALIBRATED_CITIES [us-ny-newyork]` | 3 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#CALIBRATED_CITIES [us-ga-atlanta]` | 3 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#CALIBRATED_CITIES [us-tx-austin]` | 2 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#CALIBRATED_CITIES [us-tx-dallas]` | 2 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#CALIBRATED_CITIES [us-fl-miami]` | 2 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#CALIBRATED_CITIES [us-il-chicago]` | 2 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#CALIBRATED_CITIES [us-nv-lasvegas]` | 3 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#CALIBRATED_CITIES [us-wa-seattle]` | 3 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#CALIBRATED_CITIES [us-or-portland]` | 3 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#CALIBRATED_CITIES [us-co-denver]` | 2 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#CALIBRATED_CITIES [us-nm-santafe]` | 2 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#CALIBRATED_CITIES [us-la-neworleans]` | 2 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#CALIBRATED_CITIES [us-nc-wilmington]` | 2 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#CALIBRATED_CITIES [us-tn-nashville]` | 3 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#CALIBRATED_CITIES [us-ma-boston]` | 2 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#CALIBRATED_CITIES [us-az-phoenix]` | 3 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#CALIBRATED_CITIES [us-hi-honolulu]` | 3 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#CALIBRATED_CITIES [ca-bc-vancouver]` | 3 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#CALIBRATED_CITIES [ca-on-toronto]` | 3 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#CALIBRATED_CITIES [ca-qc-montreal]` | 2 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#CALIBRATED_CITIES [uk-eng-london]` | 3 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#CALIBRATED_CITIES [uk-eng-manchester]` | 2 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#CALIBRATED_CITIES [uk-sct-glasgow]` | 2 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#CALIBRATED_CITIES [ie-lei-dublin]` | 2 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#CALIBRATED_CITIES [fr-idf-paris]` | 2 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#CALIBRATED_CITIES [fr-paca-cannes]` | 2 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#CALIBRATED_CITIES [de-be-berlin]` | 2 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#CALIBRATED_CITIES [es-md-madrid]` | 3 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#CALIBRATED_CITIES [es-cat-barcelona]` | 2 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#CALIBRATED_CITIES [it-laz-rome]` | 3 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#CALIBRATED_CITIES [au-nsw-sydney]` | 4 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#CALIBRATED_CITIES [au-vic-melbourne]` | 3 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#CALIBRATED_CITIES [au-qld-goldcoast]` | 3 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#CALIBRATED_CITIES [nz-wgn-wellington]` | 3 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#CALIBRATED_CITIES [nz-akl-auckland]` | 3 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#CALIBRATED_CITIES [jp-13-tokyo]` | 2 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#CALIBRATED_CITIES [kr-11-seoul]` | 2 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#CALIBRATED_CITIES [mx-cmx-mexicocity]` | 3 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#CALIBRATED_CITIES [ae-du-dubai]` | 3 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#deriveCity` | 2 | prose | 0 | Pending |  |
| `src/engine/content/geography.ts#NEEDED_AT_BOOT [is-39-mosfellsbr]` | 2 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#NEEDED_AT_BOOT [us-ct-newhaven]` | 2 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#NEEDED_AT_BOOT [ca-02-victoria]` | 2 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#NEEDED_AT_BOOT [uk-nir-belfast]` | 2 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#NEEDED_AT_BOOT [uk-sct-edinburgh]` | 2 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#NEEDED_AT_BOOT [us-ny-hudson]` | 2 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#NEEDED_AT_BOOT [us-ct-litchfield]` | 2 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#NEEDED_AT_BOOT [us-ca-bakersfield]` | 2 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#NEEDED_AT_BOOT [ie-l-naas]` | 2 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#NEEDED_AT_BOOT [ca-08-millbrook]` | 2 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#NEEDED_AT_BOOT [ca-02-sechelt]` | 2 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#NEEDED_AT_BOOT [mx-15-toluca]` | 2 | label | 0 | Pending |  |
| `src/engine/content/geography.ts#loadCountryCities` | 2 | internal, label | 0 | Pending |  |
| `src/engine/content/world-data.ts#COUNTRY_TABLE` | 1 | prose | 0 | Pending |  |
| `src/engine/content/world-data.ts#REGION_TABLE` | 1 | prose | 0 | Pending |  |
| `src/engine/content/world-data.ts#CITY_TABLE` | 1 | prose | 0 | Pending |  |
| `src/engine/content/world-data.ts#CITY_COUNTS` | 1 | label | 0 | Pending |  |
| `src/engine/core/deciders.ts#defineDecider` | 2 | internal | 0 | Pending |  |
| `src/engine/core/deciders.ts#sweepOne` | 1 | internal | 0 | Pending |  |
| `src/engine/core/invariants.ts#breaches` | 15 | label, prose | 0 | Pending |  |
| `src/engine/core/performer.ts#PERFORMER_NOUN` | 2 | label | 0 | Pending |  |
| `src/engine/core/rng.ts#makeRng` | 2 | internal | 1 | Pending |  |
