# Geographic Coverage Matrix

Written by `npx vite-node tools/geo-coverage.mjs --write` from the code; `tests/b27-geo-coverage.test.ts` fails when this page is behind it. Brief 27 (the geographic preamble; Part 5).

**Scope:** the gazetteer's 252 countries and territories (51 of them territories), and its 170,911 places, every one accounted for below by its country: the 170,911 the gazetteer counts.

**Coverage:** 3 researched, 66 partly researched, 183 simulated. **Work rules:** the US package, 2 verified, 5 partly researched, 244 unsupported. **Markets:** 12. **Official lists:** 87 performers' unions (FIA), 50 accredited festivals (FIAPF).

## How Every Place Connects

- **A self-tape** goes to any market from any place, so every place is in the career world for screen work cast that way.
- **In person** (an audition, a rehearsal, a performance, a shoot): work in a market within 500 km of a place is a journey from home, and farther it's a trip the production books, its flights the game's (`systems/worktrip.ts`). An open in-person audition that far reaches nobody there, and an agent puts a client up for one half as often (`SLATE_REACH`, `systems/projobs.ts`). The nearest-market column says how far each country's places are from the closest market.
- **Work** needs the work rules of the market's country: the US package for the US, a verified route abroad. A country whose rules aren't in the game gives no permission, and the game says so rather than assume one.
- **Shared everywhere:** each place's time zone, its country's currency, and travel by distance. These are the game's rules, not a country's; where a country's own rule matters and isn't researched, the row says so.

## Coverage

- **Researched:** verified work rules (the US package, or a route read from the government's own page) or a market of the game's.
- **Partly researched:** work rules located and not read, or an official list (FIA, FIAPF) names an organization there.
- **Simulated:** only the shared rules. Its actors are reached by the markets' work like anyone's; work in it can't be accepted, since it has no market and no rules in the game.

## Markets

| Market | Country | Places nearest it |
| --- | --- | --- |
| New York | United States | 1,069 |
| Los Angeles | United States | 1,639 |
| Atlanta | United States | 22,528 |
| Chicago | United States | 4,667 |
| Boston | United States | 3,204 |
| Washington | United States | 2,556 |
| Philadelphia | United States | 1,903 |
| Seattle | United States | 4,150 |
| San Diego | United States | 3,564 |
| New Haven | United States | 803 |
| London | United Kingdom | 105,238 |
| Sydney | Australia | 19,590 |

## Every Country And Territory

| Country | Kind | Places | Work rules | Markets | Unions (FIA) | Festivals (FIAPF) | Nearest market for most places | Km to it (median, max) | Coverage | Not in the game |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Afghanistan (AF) | country | 319 | unsupported | — | — | — | London (319) | 5,620, 5,851 | simulated | its rules for working there; a market of its own |
| Aland Islands (AX) | territory of Finland | 21 | unsupported | — | — | — | London (21) | 1,579, 1,636 | simulated | its rules for working there; a market of its own |
| Albania (AL) | country | 380 | unsupported | — | — | — | London (380) | 1,924, 2,046 | simulated | its rules for working there; a market of its own |
| Algeria (DZ) | country | 350 | unsupported | — | — | — | London (350) | 1,773, 3,588 | simulated | its rules for working there; a market of its own |
| American Samoa (AS) | territory of United States | 17 | unsupported | — | — | — | Sydney (17) | 4,395, 4,589 | simulated | its rules for working there; a market of its own |
| Andorra (AD) | country | 15 | unsupported | — | — | — | London (15) | 1,006, 1,014 | simulated | its rules for working there; a market of its own |
| Angola (AO) | country | 565 | unsupported | — | — | — | London (565) | 7,105, 8,011 | simulated | its rules for working there; a market of its own |
| Anguilla (AI) | territory of United Kingdom | 14 | unsupported | — | — | — | Washington (14) | 2,667, 2,669 | simulated | its rules for working there; a market of its own |
| Antarctica (AQ) | no citizens | 0 | unsupported | — | — | — | — | — | simulated | its rules for working there; a market of its own |
| Antigua and Barbuda (AG) | country | 20 | unsupported | — | — | — | Washington (20) | 2,838, 2,848 | simulated | its rules for working there; a market of its own |
| Argentina (AR) | country | 1,178 | unsupported | — | 1 | 1 | Atlanta (1,175) | 7,630, 9,608 | partly researched | its rules for working there; a market of its own |
| Armenia (AM) | country | 455 | unsupported | — | — | 1 | London (455) | 3,607, 3,818 | partly researched | its rules for working there; a market of its own |
| Aruba (AW) | territory of The Netherlands | 14 | unsupported | — | — | — | Atlanta (14) | 2,772, 2,787 | simulated | its rules for working there; a market of its own |
| Australia (AU) | country | 3,834 | verified: Temporary Activity visa (subclass 408), Entertainment Activities stream; Special Category visa (subclass 444) | Sydney | 1 | 1 | Sydney (3,834) | 716, 3,854 | researched | Australian tax on pay for work there; the agreements of MEAA, the Australian actors’ union, that a production there would use; permanent residence and the other visas that let you work in Australia |
| Austria (AT) | country | 2,266 | unsupported | — | 1 | 2 | London (2,266) | 1,157, 1,300 | partly researched | its rules for working there; a market of its own |
| Azerbaijan (AZ) | country | 218 | unsupported | — | 1 | — | London (218) | 3,819, 4,030 | partly researched | its rules for working there; a market of its own |
| Bahamas (BS) | country | 28 | unsupported | — | — | — | Atlanta (28) | 1,183, 1,771 | simulated | its rules for working there; a market of its own |
| Bahrain (BH) | country | 11 | unsupported | — | — | — | London (11) | 5,076, 5,081 | simulated | its rules for working there; a market of its own |
| Bangladesh (BD) | country | 161 | unsupported | — | — | — | London (161) | 8,001, 8,371 | simulated | its rules for working there; a market of its own |
| Barbados (BB) | country | 14 | unsupported | — | — | — | Washington (14) | 3,335, 3,349 | simulated | its rules for working there; a market of its own |
| Belarus (BY) | country | 260 | unsupported | — | 1 | — | London (260) | 1,881, 2,207 | partly researched | its rules for working there; a market of its own |
| Belgium (BE) | country | 1,735 | unsupported | — | 3 | — | London (1,735) | 338, 474 | partly researched | its rules for working there; a market of its own |
| Belize (BZ) | country | 81 | unsupported | — | — | — | Atlanta (81) | 1,856, 2,012 | simulated | its rules for working there; a market of its own |
| Benin (BJ) | country | 87 | unsupported | — | — | — | London (87) | 4,934, 5,036 | simulated | its rules for working there; a market of its own |
| Bermuda (BM) | territory of United Kingdom | 11 | unsupported | — | — | — | New Haven (11) | 1,236, 1,237 | simulated | its rules for working there; a market of its own |
| Bhutan (BT) | country | 30 | unsupported | — | — | — | London (30) | 7,687, 7,817 | simulated | its rules for working there; a market of its own |
| Bolivia (BO) | country | 148 | unsupported | — | — | — | Atlanta (148) | 6,085, 6,630 | simulated | its rules for working there; a market of its own |
| Bonaire, Saint Eustatius and Saba (BQ) | territory of The Netherlands | 8 | unsupported | — | — | — | Atlanta (5) | 2,893, 2,907 | simulated | its rules for working there; a market of its own |
| Bosnia and Herzegovina (BA) | country | 292 | unsupported | — | — | — | London (292) | 1,565, 1,699 | simulated | its rules for working there; a market of its own |
| Botswana (BW) | country | 120 | unsupported | — | — | — | London (120) | 8,686, 8,925 | simulated | its rules for working there; a market of its own |
| Bouvet Island (BV) | territory of Norway | 0 | unsupported | — | — | — | — | — | simulated | its rules for working there; a market of its own |
| Brazil (BR) | country | 5,874 | unsupported | — | 3 | — | Atlanta (3,719) | 7,047, 8,165 | partly researched | its rules for working there; a market of its own |
| British Indian Ocean Territory (IO) | territory of United Kingdom | 1 | unsupported | — | — | — | Sydney (1) | 8,529, 8,529 | simulated | its rules for working there; a market of its own |
| British Virgin Islands (VG) | territory of United Kingdom | 2 | unsupported | — | — | — | Washington (2) | 2,572, 2,579 | simulated | its rules for working there; a market of its own |
| Brunei (BN) | country | 47 | unsupported | — | — | — | Sydney (47) | 5,756, 5,778 | simulated | its rules for working there; a market of its own |
| Bulgaria (BG) | country | 304 | unsupported | — | 1 | 1 | London (304) | 2,138, 2,359 | partly researched | its rules for working there; a market of its own |
| Burkina Faso (BF) | country | 113 | unsupported | — | — | — | London (113) | 4,365, 4,643 | simulated | its rules for working there; a market of its own |
| Burundi (BI) | country | 32 | unsupported | — | — | — | London (32) | 6,714, 6,820 | simulated | its rules for working there; a market of its own |
| Cabo Verde (CV) | country | 141 | unsupported | — | — | — | London (141) | 4,550, 4,624 | simulated | its rules for working there; a market of its own |
| Cambodia (KH) | country | 301 | unsupported | — | — | — | Sydney (301) | 7,049, 7,381 | simulated | its rules for working there; a market of its own |
| Cameroon (CM) | country | 142 | unsupported | — | — | — | London (142) | 5,249, 5,580 | simulated | its rules for working there; a market of its own |
| Canada (CA) | country | 2,858 | partly researched | — | 3 | 3 | Seattle (1,193) | 589, 3,394 | partly researched | which work permit a film actor needs: the regulations’ exemption for performing artists leaves out film and television, and the government’s pages on permits didn’t answer; ACTRA’s agreements, and British Columbia’s own; a market of its own |
| Cayman Islands (KY) | territory of United Kingdom | 67 | unsupported | — | — | — | Atlanta (67) | 1,634, 1,639 | simulated | its rules for working there; a market of its own |
| Central African Republic (CF) | country | 51 | unsupported | — | — | — | London (51) | 5,398, 5,686 | simulated | its rules for working there; a market of its own |
| Chad (TD) | country | 72 | unsupported | — | — | — | London (72) | 4,697, 5,078 | simulated | its rules for working there; a market of its own |
| Chile (CL) | country | 305 | unsupported | — | 1 | — | Atlanta (300) | 7,795, 9,575 | partly researched | its rules for working there; a market of its own |
| China (CN) | country | 4,970 | unsupported | — | — | 1 | Sydney (2,534) | 8,127, 8,550 | partly researched | its rules for working there; a market of its own |
| Christmas Island (CX) | territory of Australia | 1 | unsupported | — | — | — | Sydney (1) | 5,305, 5,305 | simulated | its rules for working there; a market of its own |
| Cocos Islands (CC) | territory of Australia | 1 | unsupported | — | — | — | Sydney (1) | 5,987, 5,987 | simulated | its rules for working there; a market of its own |
| Colombia (CO) | country | 1,172 | unsupported | — | 2 | — | Atlanta (1,172) | 3,317, 4,486 | partly researched | its rules for working there; a market of its own |
| Comoros (KM) | country | 93 | unsupported | — | — | — | London (93) | 8,254, 8,299 | simulated | its rules for working there; a market of its own |
| Cook Islands (CK) | territory of New Zealand | 2 | unsupported | — | — | — | Sydney (2) | 4,984, 4,987 | simulated | its rules for working there; a market of its own |
| Costa Rica (CR) | country | 130 | unsupported | — | — | — | Atlanta (130) | 2,645, 2,809 | simulated | its rules for working there; a market of its own |
| Croatia (HR) | country | 764 | unsupported | — | 1 | — | London (764) | 1,385, 1,701 | partly researched | its rules for working there; a market of its own |
| Cuba (CU) | country | 207 | unsupported | — | 1 | — | Atlanta (207) | 1,323, 1,811 | partly researched | its rules for working there; a market of its own |
| Curacao (CW) | territory of The Netherlands | 12 | unsupported | — | — | — | Atlanta (12) | 2,865, 2,879 | simulated | its rules for working there; a market of its own |
| Cyprus (CY) | country | 102 | unsupported | — | 1 | — | London (102) | 3,230, 3,275 | partly researched | its rules for working there; a market of its own |
| Czechia (CZ) | country | 1,476 | unsupported | — | 1 | 1 | London (1,476) | 1,128, 1,354 | partly researched | its rules for working there; a market of its own |
| Democratic Republic of the Congo (CD) | country | 118 | unsupported | — | — | — | London (118) | 6,496, 7,622 | simulated | its rules for working there; a market of its own |
| Denmark (DK) | country | 434 | unsupported | — | 2 | — | London (434) | 865, 1,097 | partly researched | its rules for working there; a market of its own |
| Djibouti (DJ) | country | 26 | unsupported | — | — | — | London (26) | 5,885, 5,927 | simulated | its rules for working there; a market of its own |
| Dominica (DM) | country | 18 | unsupported | — | — | — | Washington (18) | 3,028, 3,046 | simulated | its rules for working there; a market of its own |
| Dominican Republic (DO) | country | 210 | unsupported | — | — | 1 | Atlanta (210) | 2,148, 2,319 | partly researched | its rules for working there; a market of its own |
| Ecuador (EC) | country | 541 | unsupported | — | — | — | Atlanta (541) | 3,951, 4,310 | simulated | its rules for working there; a market of its own |
| Egypt (EG) | country | 259 | unsupported | — | — | 1 | London (259) | 3,507, 4,532 | partly researched | its rules for working there; a market of its own |
| El Salvador (SV) | country | 101 | unsupported | — | — | — | Atlanta (101) | 2,279, 2,315 | simulated | its rules for working there; a market of its own |
| Equatorial Guinea (GQ) | country | 25 | unsupported | — | — | — | London (25) | 5,613, 5,913 | simulated | its rules for working there; a market of its own |
| Eritrea (ER) | country | 18 | unsupported | — | — | — | London (18) | 5,309, 5,742 | simulated | its rules for working there; a market of its own |
| Estonia (EE) | country | 130 | unsupported | — | 1 | 1 | London (130) | 1,792, 1,969 | partly researched | its rules for working there; a market of its own |
| Eswatini (SZ) | country | 24 | unsupported | — | — | — | London (24) | 9,197, 9,307 | simulated | its rules for working there; a market of its own |
| Ethiopia (ET) | country | 255 | unsupported | — | — | — | London (255) | 5,929, 6,595 | simulated | its rules for working there; a market of its own |
| Falkland Islands (FK) | territory of United Kingdom | 1 | unsupported | — | — | — | Atlanta (1) | 9,847, 9,847 | simulated | its rules for working there; a market of its own |
| Faroe Islands (FO) | territory of Denmark | 26 | unsupported | — | — | — | London (26) | 1,244, 1,270 | simulated | its rules for working there; a market of its own |
| Fiji (FJ) | country | 16 | unsupported | — | — | — | Sydney (16) | 3,218, 3,532 | simulated | its rules for working there; a market of its own |
| Finland (FI) | country | 885 | unsupported | — | 3 | 1 | London (885) | 1,828, 2,478 | partly researched | its rules for working there; a market of its own |
| France (FR) | country | 8,940 | partly researched | — | 1 | 3 | London (8,940) | 554, 1,329 | partly researched | the permit for an engagement shorter than three months: the talent card for an artist asks for contracts of three months or more in a year, and the salaried work page refused this build; the talent visa’s fee and how long a decision takes; a market of its own |
| French Guiana (GF) | territory of France | 19 | unsupported | — | — | — | Philadelphia (16) | 4,516, 4,646 | simulated | its rules for working there; a market of its own |
| French Polynesia (PF) | territory of France | 38 | unsupported | — | — | — | Sydney (33) | 6,110, 6,491 | simulated | its rules for working there; a market of its own |
| French Southern Territories (TF) | territory of France | 1 | unsupported | — | — | — | Sydney (1) | 6,616, 6,616 | simulated | its rules for working there; a market of its own |
| Gabon (GA) | country | 50 | unsupported | — | — | — | London (50) | 5,969, 6,194 | simulated | its rules for working there; a market of its own |
| Gambia (GM) | country | 126 | unsupported | — | — | — | London (126) | 4,460, 4,525 | simulated | its rules for working there; a market of its own |
| Georgia (GE) | country | 175 | unsupported | — | 1 | — | London (175) | 3,375, 3,643 | partly researched | its rules for working there; a market of its own |
| Germany (DE) | country | 7,646 | unsupported | — | 4 | 3 | London (7,646) | 747, 1,049 | partly researched | its rules for working there; a market of its own |
| Ghana (GH) | country | 119 | unsupported | — | 1 | — | London (119) | 5,040, 5,190 | partly researched | its rules for working there; a market of its own |
| Gibraltar (GI) | territory of United Kingdom | 6 | unsupported | — | — | — | London (6) | 1,759, 1,761 | simulated | its rules for working there; a market of its own |
| Greece (GR) | country | 1,132 | unsupported | — | 2 | — | London (1,132) | 2,257, 2,900 | partly researched | its rules for working there; a market of its own |
| Greenland (GL) | territory of Denmark | 13 | unsupported | — | — | — | Boston (12) | 2,802, 3,474 | simulated | its rules for working there; a market of its own |
| Grenada (GD) | country | 9 | unsupported | — | — | — | Atlanta (9) | 3,324, 3,336 | simulated | its rules for working there; a market of its own |
| Guadeloupe (GP) | territory of France | 25 | unsupported | — | — | — | Washington (25) | 2,942, 2,982 | simulated | its rules for working there; a market of its own |
| Guam (GU) | territory of United States | 26 | unsupported | — | — | — | Sydney (26) | 5,308, 5,318 | simulated | its rules for working there; a market of its own |
| Guatemala (GT) | country | 340 | unsupported | — | — | — | Atlanta (340) | 2,213, 2,298 | simulated | its rules for working there; a market of its own |
| Guernsey (GG) | territory of United Kingdom | 11 | unsupported | — | — | — | London (11) | 287, 292 | simulated | its rules for working there; a market of its own |
| Guinea (GN) | country | 83 | unsupported | — | — | — | London (83) | 4,644, 4,958 | simulated | its rules for working there; a market of its own |
| Guinea-Bissau (GW) | country | 50 | unsupported | — | — | — | London (50) | 4,622, 4,693 | simulated | its rules for working there; a market of its own |
| Guyana (GY) | country | 22 | unsupported | — | — | — | Atlanta (18) | 4,059, 4,231 | simulated | its rules for working there; a market of its own |
| Haiti (HT) | country | 109 | unsupported | — | — | — | Atlanta (109) | 2,006, 2,151 | simulated | its rules for working there; a market of its own |
| Heard Island and McDonald Islands (HM) | territory of Australia | 0 | unsupported | — | — | — | — | — | simulated | its rules for working there; a market of its own |
| Honduras (HN) | country | 468 | unsupported | — | — | — | Atlanta (468) | 2,132, 2,309 | simulated | its rules for working there; a market of its own |
| Hong Kong (HK) | territory of China | 325 | unsupported | — | — | — | Sydney (325) | 7,375, 7,398 | simulated | its rules for working there; a market of its own |
| Hungary (HU) | country | 1,101 | unsupported | — | 1 | — | London (1,101) | 1,481, 1,684 | partly researched | its rules for working there; a market of its own |
| Iceland (IS) | country | 35 | unsupported | — | 1 | — | London (35) | 1,887, 2,068 | partly researched | its rules for working there; a market of its own |
| India (IN) | country | 7,070 | partly researched | — | 1 | 4 | London (7,061) | 7,616, 8,471 | partly researched | the film visa, which follows permission to shoot, and the rules for documentary filming; a market of its own |
| Indonesia (ID) | country | 2,014 | unsupported | — | — | — | Sydney (2,014) | 5,091, 7,344 | simulated | its rules for working there; a market of its own |
| Iran (IR) | country | 1,984 | unsupported | — | — | 1 | London (1,984) | 4,497, 5,906 | partly researched | its rules for working there; a market of its own |
| Iraq (IQ) | country | 169 | unsupported | — | — | — | London (169) | 3,970, 4,628 | simulated | its rules for working there; a market of its own |
| Ireland (IE) | country | 370 | unsupported | — | 1 | — | London (370) | 514, 727 | partly researched | its rules for working there; a market of its own |
| Isle of Man (IM) | territory of United Kingdom | 21 | unsupported | — | — | — | London (21) | 421, 432 | simulated | its rules for working there; a market of its own |
| Israel (IL) | country | 433 | unsupported | — | 1 | — | London (433) | 3,552, 3,779 | partly researched | its rules for working there; a market of its own |
| Italy (IT) | country | 10,052 | unsupported | — | 1 | 4 | London (10,052) | 1,130, 2,049 | partly researched | its rules for working there; a market of its own |
| Ivory Coast (CI) | country | 3,775 | unsupported | — | — | — | London (3,775) | 4,970, 5,281 | simulated | its rules for working there; a market of its own |
| Jamaica (JM) | country | 101 | unsupported | — | — | — | Atlanta (101) | 1,877, 1,939 | simulated | its rules for working there; a market of its own |
| Japan (JP) | country | 2,160 | partly researched | — | 1 | 1 | Seattle (1,194) | 7,702, 8,010 | partly researched | the Entertainer status’s criteria and documents for film and broadcast work, which an ordinance this build didn’t read sets, and its fee and timing; a market of its own |
| Jersey (JE) | territory of United Kingdom | 6 | unsupported | — | — | — | London (6) | 289, 294 | simulated | its rules for working there; a market of its own |
| Jordan (JO) | country | 146 | unsupported | — | — | — | London (146) | 3,638, 3,806 | simulated | its rules for working there; a market of its own |
| Kazakhstan (KZ) | country | 344 | unsupported | — | 1 | 1 | London (344) | 4,920, 5,843 | partly researched | its rules for working there; a market of its own |
| Kenya (KE) | country | 334 | unsupported | — | — | — | London (334) | 6,711, 7,280 | simulated | its rules for working there; a market of its own |
| Kiribati (KI) | country | 19 | unsupported | — | — | — | Sydney (14) | 4,540, 5,410 | simulated | its rules for working there; a market of its own |
| Kosovo (XK) | country | 65 | unsupported | — | — | — | London (65) | 1,860, 1,923 | simulated | its rules for working there; a market of its own |
| Kuwait (KW) | country | 28 | unsupported | — | — | — | London (28) | 4,655, 4,698 | simulated | its rules for working there; a market of its own |
| Kyrgyzstan (KG) | country | 108 | unsupported | — | 1 | — | London (108) | 5,478, 5,767 | partly researched | its rules for working there; a market of its own |
| Laos (LA) | country | 94 | unsupported | — | — | — | Sydney (94) | 7,747, 8,101 | simulated | its rules for working there; a market of its own |
| Latvia (LV) | country | 131 | unsupported | — | 1 | — | London (131) | 1,701, 1,911 | partly researched | its rules for working there; a market of its own |
| Lebanon (LB) | country | 50 | unsupported | — | — | — | London (50) | 3,479, 3,514 | simulated | its rules for working there; a market of its own |
| Lesotho (LS) | country | 47 | unsupported | — | — | — | London (47) | 9,419, 9,506 | simulated | its rules for working there; a market of its own |
| Liberia (LR) | country | 27 | unsupported | — | — | — | London (27) | 5,083, 5,288 | simulated | its rules for working there; a market of its own |
| Libya (LY) | country | 119 | unsupported | — | — | — | London (119) | 2,728, 3,633 | simulated | its rules for working there; a market of its own |
| Liechtenstein (LI) | country | 14 | unsupported | — | — | — | London (14) | 848, 855 | simulated | its rules for working there; a market of its own |
| Lithuania (LT) | country | 133 | unsupported | — | 1 | — | London (133) | 1,637, 1,801 | partly researched | its rules for working there; a market of its own |
| Luxembourg (LU) | country | 172 | unsupported | — | 1 | — | London (172) | 486, 512 | partly researched | its rules for working there; a market of its own |
| Macao (MO) | territory of China | 7 | unsupported | — | — | — | Sydney (7) | 7,395, 7,400 | simulated | its rules for working there; a market of its own |
| Madagascar (MG) | country | 152 | unsupported | — | 1 | — | London (152) | 9,108, 9,672 | partly researched | its rules for working there; a market of its own |
| Malawi (MW) | country | 39 | unsupported | — | — | — | London (39) | 8,041, 8,348 | simulated | its rules for working there; a market of its own |
| Malaysia (MY) | country | 731 | unsupported | — | — | — | Sydney (731) | 6,616, 7,023 | simulated | its rules for working there; a market of its own |
| Maldives (MV) | country | 30 | unsupported | — | — | — | London (27) | 8,573, 8,876 | simulated | its rules for working there; a market of its own |
| Mali (ML) | country | 94 | unsupported | — | — | — | London (94) | 4,269, 4,631 | simulated | its rules for working there; a market of its own |
| Malta (MT) | country | 68 | unsupported | — | — | — | London (68) | 2,087, 2,096 | simulated | its rules for working there; a market of its own |
| Marshall Islands (MH) | country | 26 | unsupported | — | — | — | Sydney (26) | 5,026, 5,388 | simulated | its rules for working there; a market of its own |
| Martinique (MQ) | territory of France | 21 | unsupported | — | — | — | Washington (21) | 3,121, 3,147 | simulated | its rules for working there; a market of its own |
| Mauritania (MR) | country | 85 | unsupported | — | — | — | London (85) | 4,020, 4,226 | simulated | its rules for working there; a market of its own |
| Mauritius (MU) | country | 113 | unsupported | — | — | — | Sydney (112) | 9,090, 9,127 | simulated | its rules for working there; a market of its own |
| Mayotte (YT) | territory of France | 57 | unsupported | — | — | — | London (57) | 8,376, 8,391 | simulated | its rules for working there; a market of its own |
| Mexico (MX) | country | 8,947 | unsupported | — | 1 | — | Atlanta (6,009) | 2,072, 2,438 | partly researched | its rules for working there; a market of its own |
| Micronesia (FM) | country | 51 | unsupported | — | — | — | Sydney (51) | 4,595, 5,029 | simulated | its rules for working there; a market of its own |
| Moldova (MD) | country | 98 | unsupported | — | 1 | — | London (98) | 2,145, 2,261 | partly researched | its rules for working there; a market of its own |
| Monaco (MC) | country | 10 | unsupported | — | — | — | London (10) | 1,032, 1,033 | simulated | its rules for working there; a market of its own |
| Mongolia (MN) | country | 331 | unsupported | — | — | — | London (331) | 6,791, 7,578 | simulated | its rules for working there; a market of its own |
| Montenegro (ME) | country | 41 | unsupported | — | — | 1 | London (41) | 1,765, 1,811 | partly researched | its rules for working there; a market of its own |
| Montserrat (MS) | territory of United Kingdom | 3 | unsupported | — | — | — | Washington (3) | 2,850, 2,857 | simulated | its rules for working there; a market of its own |
| Morocco (MA) | country | 479 | unsupported | — | 1 | — | London (479) | 2,115, 3,444 | partly researched | its rules for working there; a market of its own |
| Mozambique (MZ) | country | 94 | unsupported | — | — | — | London (94) | 8,479, 9,292 | simulated | its rules for working there; a market of its own |
| Myanmar (MM) | country | 525 | unsupported | — | — | — | Sydney (460) | 8,116, 8,525 | simulated | its rules for working there; a market of its own |
| Namibia (NA) | country | 80 | unsupported | — | — | — | London (80) | 8,250, 9,089 | simulated | its rules for working there; a market of its own |
| Nauru (NR) | country | 10 | unsupported | — | — | — | Sydney (10) | 4,053, 4,056 | simulated | its rules for working there; a market of its own |
| Nepal (NP) | country | 74 | unsupported | — | 1 | — | London (74) | 7,276, 7,613 | partly researched | its rules for working there; a market of its own |
| Netherlands Antilles (AN) | country | 0 | unsupported | — | — | — | — | — | simulated | its rules for working there; a market of its own |
| New Caledonia (NC) | territory of France | 60 | unsupported | — | — | — | Sydney (60) | 1,972, 2,136 | simulated | its rules for working there; a market of its own |
| New Zealand (NZ) | country | 647 | partly researched | — | 1 | — | Sydney (647) | 2,153, 2,982 | partly researched | the visa’s fee and how long a decision takes, which its pages give only in a browser; what the union’s or guild’s view of an engagement decides; a market of its own |
| Nicaragua (NI) | country | 166 | unsupported | — | — | — | Atlanta (166) | 2,365, 2,536 | simulated | its rules for working there; a market of its own |
| Niger (NE) | country | 74 | unsupported | — | — | — | London (74) | 4,204, 4,418 | simulated | its rules for working there; a market of its own |
| Nigeria (NG) | country | 927 | unsupported | — | 1 | — | London (927) | 4,853, 5,281 | partly researched | its rules for working there; a market of its own |
| Niue (NU) | territory of New Zealand | 1 | unsupported | — | — | — | Sydney (1) | 4,174, 4,174 | simulated | its rules for working there; a market of its own |
| Norfolk Island (NF) | territory of Australia | 1 | unsupported | — | — | — | Sydney (1) | 1,675, 1,675 | simulated | its rules for working there; a market of its own |
| North Korea (KP) | country | 127 | unsupported | — | — | — | Seattle (127) | 8,162, 8,383 | simulated | its rules for working there; a market of its own |
| North Macedonia (MK) | country | 202 | unsupported | — | — | 1 | London (202) | 1,958, 2,082 | partly researched | its rules for working there; a market of its own |
| Northern Mariana Islands (MP) | territory of United States | 6 | unsupported | — | — | — | Sydney (6) | 5,485, 5,488 | simulated | its rules for working there; a market of its own |
| Norway (NO) | country | 533 | unsupported | — | 2 | — | London (533) | 1,169, 2,630 | partly researched | its rules for working there; a market of its own |
| Oman (OM) | country | 38 | unsupported | — | — | — | London (38) | 5,784, 6,089 | simulated | its rules for working there; a market of its own |
| Pakistan (PK) | country | 566 | unsupported | — | — | — | London (566) | 6,181, 6,542 | simulated | its rules for working there; a market of its own |
| Palau (PW) | country | 22 | unsupported | — | — | — | Sydney (22) | 4,911, 4,979 | simulated | its rules for working there; a market of its own |
| Palestinian Territory (PS) | country | 378 | unsupported | — | — | — | London (378) | 3,586, 3,635 | simulated | its rules for working there; a market of its own |
| Panama (PA) | country | 643 | unsupported | — | 1 | — | Atlanta (643) | 2,835, 2,986 | partly researched | its rules for working there; a market of its own |
| Papua New Guinea (PG) | country | 52 | unsupported | — | — | — | Sydney (52) | 3,147, 3,617 | simulated | its rules for working there; a market of its own |
| Paraguay (PY) | country | 151 | unsupported | — | — | — | Atlanta (151) | 7,196, 7,428 | simulated | its rules for working there; a market of its own |
| Peru (PE) | country | 1,773 | unsupported | — | 1 | — | Atlanta (1,773) | 5,149, 5,972 | partly researched | its rules for working there; a market of its own |
| Philippines (PH) | country | 4,523 | unsupported | — | — | — | Sydney (4,523) | 5,891, 6,827 | simulated | its rules for working there; a market of its own |
| Pitcairn (PN) | territory of United Kingdom | 1 | unsupported | — | — | — | San Diego (1) | 6,570, 6,570 | simulated | its rules for working there; a market of its own |
| Poland (PL) | country | 3,022 | unsupported | — | 2 | 2 | London (3,022) | 1,366, 1,685 | partly researched | its rules for working there; a market of its own |
| Portugal (PT) | country | 962 | unsupported | — | 1 | — | London (962) | 1,465, 2,743 | partly researched | its rules for working there; a market of its own |
| Puerto Rico (PR) | territory of United States | 220 | unsupported | — | — | — | Atlanta (219) | 2,487, 2,562 | simulated | its rules for working there; a market of its own |
| Qatar (QA) | country | 42 | unsupported | — | — | — | London (42) | 5,208, 5,240 | simulated | its rules for working there; a market of its own |
| Republic of the Congo (CG) | country | 59 | unsupported | — | — | — | London (59) | 6,173, 6,387 | simulated | its rules for working there; a market of its own |
| Reunion (RE) | territory of France | 28 | unsupported | — | — | — | Sydney (28) | 9,219, 9,246 | simulated | its rules for working there; a market of its own |
| Romania (RO) | country | 4,571 | unsupported | — | 1 | 1 | London (4,571) | 1,975, 2,304 | partly researched | its rules for working there; a market of its own |
| Russia (RU) | country | 4,933 | unsupported | — | 2 | — | London (4,609) | 3,194, 7,685 | partly researched | its rules for working there; a market of its own |
| Rwanda (RW) | country | 51 | unsupported | — | — | — | London (51) | 6,591, 6,645 | simulated | its rules for working there; a market of its own |
| Saint Barthelemy (BL) | territory of France | 1 | unsupported | — | — | — | Washington (1) | 2,708, 2,708 | simulated | its rules for working there; a market of its own |
| Saint Helena (SH) | territory of United Kingdom | 4 | unsupported | — | — | — | London (4) | 7,518, 9,921 | simulated | its rules for working there; a market of its own |
| Saint Kitts and Nevis (KN) | country | 16 | unsupported | — | — | — | Washington (16) | 2,768, 2,797 | simulated | its rules for working there; a market of its own |
| Saint Lucia (LC) | country | 37 | unsupported | — | — | — | Washington (37) | 3,190, 3,215 | simulated | its rules for working there; a market of its own |
| Saint Martin (MF) | territory of France | 9 | unsupported | — | — | — | Washington (9) | 2,680, 2,684 | simulated | its rules for working there; a market of its own |
| Saint Pierre and Miquelon (PM) | territory of France | 2 | unsupported | — | — | — | Boston (2) | 1,271, 1,275 | simulated | its rules for working there; a market of its own |
| Saint Vincent and the Grenadines (VC) | country | 20 | unsupported | — | — | — | Washington (20) | 3,255, 3,272 | simulated | its rules for working there; a market of its own |
| Samoa (WS) | country | 32 | unsupported | — | — | — | Sydney (32) | 4,330, 4,352 | simulated | its rules for working there; a market of its own |
| San Marino (SM) | country | 13 | unsupported | — | — | — | London (13) | 1,260, 1,264 | simulated | its rules for working there; a market of its own |
| Sao Tome and Principe (ST) | country | 26 | unsupported | — | — | — | London (26) | 5,729, 5,748 | simulated | its rules for working there; a market of its own |
| Saudi Arabia (SA) | country | 158 | unsupported | — | — | — | London (158) | 4,936, 5,635 | simulated | its rules for working there; a market of its own |
| Senegal (SN) | country | 151 | unsupported | — | — | — | London (151) | 4,366, 4,604 | simulated | its rules for working there; a market of its own |
| Serbia (RS) | country | 437 | unsupported | — | — | — | London (437) | 1,671, 1,973 | simulated | its rules for working there; a market of its own |
| Serbia and Montenegro (CS) | country | 0 | unsupported | — | — | — | — | — | simulated | its rules for working there; a market of its own |
| Seychelles (SC) | country | 26 | unsupported | — | — | — | London (26) | 8,150, 8,166 | simulated | its rules for working there; a market of its own |
| Sierra Leone (SL) | country | 87 | unsupported | — | — | — | London (87) | 4,918, 5,032 | simulated | its rules for working there; a market of its own |
| Singapore (SG) | country | 116 | unsupported | — | — | — | Sydney (116) | 6,303, 6,317 | simulated | its rules for working there; a market of its own |
| Sint Maarten (SX) | territory of The Netherlands | 6 | unsupported | — | — | — | Washington (6) | 2,684, 2,686 | simulated | its rules for working there; a market of its own |
| Slovakia (SK) | country | 602 | unsupported | — | — | — | London (602) | 1,356, 1,614 | simulated | its rules for working there; a market of its own |
| Slovenia (SI) | country | 301 | unsupported | — | 4 | — | London (301) | 1,251, 1,324 | partly researched | its rules for working there; a market of its own |
| Solomon Islands (SB) | country | 23 | unsupported | — | — | — | Sydney (23) | 2,861, 3,067 | simulated | its rules for working there; a market of its own |
| Somalia (SO) | country | 75 | unsupported | — | — | — | London (75) | 6,607, 7,091 | simulated | its rules for working there; a market of its own |
| South Africa (ZA) | country | 975 | unsupported | — | 1 | — | London (975) | 9,258, 9,833 | partly researched | its rules for working there; a market of its own |
| South Georgia and the South Sandwich Islands (GS) | territory of United Kingdom | 1 | unsupported | — | — | — | Sydney (1) | 10,185, 10,185 | simulated | its rules for working there; a market of its own |
| South Korea (KR) | country | 306 | unsupported | — | — | 1 | Sydney (246) | 8,136, 8,421 | partly researched | its rules for working there; a market of its own |
| South Sudan (SS) | country | 23 | unsupported | — | — | — | London (23) | 5,582, 6,098 | simulated | its rules for working there; a market of its own |
| Spain (ES) | country | 7,158 | unsupported | — | 3 | 8 | London (7,158) | 1,202, 3,035 | partly researched | its rules for working there; a market of its own |
| Sri Lanka (LK) | country | 89 | unsupported | — | — | — | Sydney (47) | 8,678, 8,730 | simulated | its rules for working there; a market of its own |
| Sudan (SD) | country | 112 | unsupported | — | — | — | London (112) | 5,035, 5,515 | simulated | its rules for working there; a market of its own |
| Suriname (SR) | country | 31 | unsupported | — | — | — | Washington (31) | 4,285, 4,375 | simulated | its rules for working there; a market of its own |
| Svalbard and Jan Mayen (SJ) | territory of Norway | 2 | unsupported | — | — | — | London (2) | 2,202, 3,038 | simulated | its rules for working there; a market of its own |
| Sweden (SE) | country | 832 | unsupported | — | 1 | — | London (832) | 1,237, 2,167 | partly researched | its rules for working there; a market of its own |
| Switzerland (CH) | country | 1,425 | unsupported | — | 2 | 1 | London (1,425) | 774, 949 | partly researched | its rules for working there; a market of its own |
| Syria (SY) | country | 309 | unsupported | — | — | — | London (309) | 3,457, 3,771 | simulated | its rules for working there; a market of its own |
| Taiwan (TW) | country | 89 | unsupported | — | — | — | Sydney (89) | 7,209, 7,446 | simulated | its rules for working there; a market of its own |
| Tajikistan (TJ) | country | 102 | unsupported | — | 1 | — | London (102) | 5,426, 5,765 | partly researched | its rules for working there; a market of its own |
| Tanzania (TZ) | country | 324 | unsupported | — | — | — | London (324) | 7,239, 7,912 | simulated | its rules for working there; a market of its own |
| Thailand (TH) | country | 1,069 | unsupported | — | — | — | Sydney (1,069) | 7,536, 8,168 | simulated | its rules for working there; a market of its own |
| The Netherlands (NL) | country | 1,567 | unsupported | — | 1 | — | London (1,567) | 396, 527 | partly researched | its rules for working there; a market of its own |
| Timor Leste (TL) | country | 32 | unsupported | — | — | — | Sydney (32) | 3,819, 3,882 | simulated | its rules for working there; a market of its own |
| Togo (TG) | country | 35 | unsupported | — | — | — | London (35) | 4,876, 5,048 | simulated | its rules for working there; a market of its own |
| Tokelau (TK) | territory of New Zealand | 3 | unsupported | — | — | — | Sydney (3) | 4,660, 4,696 | simulated | its rules for working there; a market of its own |
| Tonga (TO) | country | 24 | unsupported | — | — | — | Sydney (24) | 3,582, 4,023 | simulated | its rules for working there; a market of its own |
| Trinidad and Tobago (TT) | country | 27 | unsupported | — | — | — | Atlanta (27) | 3,495, 3,520 | simulated | its rules for working there; a market of its own |
| Tunisia (TN) | country | 285 | unsupported | — | — | — | London (285) | 1,940, 2,341 | simulated | its rules for working there; a market of its own |
| Turkey (TR) | country | 2,684 | unsupported | — | 2 | 1 | London (2,684) | 3,004, 3,815 | partly researched | its rules for working there; a market of its own |
| Turkmenistan (TM) | country | 111 | unsupported | — | — | — | London (111) | 4,769, 5,275 | simulated | its rules for working there; a market of its own |
| Turks and Caicos Islands (TC) | territory of United Kingdom | 7 | unsupported | — | — | — | Atlanta (7) | 1,786, 1,886 | simulated | its rules for working there; a market of its own |
| Tuvalu (TV) | country | 9 | unsupported | — | — | — | Sydney (9) | 4,017, 4,094 | simulated | its rules for working there; a market of its own |
| U.S. Virgin Islands (VI) | territory of United States | 6 | unsupported | — | — | — | Washington (6) | 2,569, 2,637 | simulated | its rules for working there; a market of its own |
| Uganda (UG) | country | 208 | unsupported | — | — | — | London (208) | 6,428, 6,530 | simulated | its rules for working there; a market of its own |
| Ukraine (UA) | country | 3,873 | unsupported | — | 1 | 1 | London (3,873) | 2,267, 2,856 | partly researched | its rules for working there; a market of its own |
| United Arab Emirates (AE) | country | 105 | unsupported | — | — | — | London (105) | 5,476, 5,597 | simulated | its rules for working there; a market of its own |
| United Kingdom (GB) | country | 4,643 | verified: Common Travel Area; Creative Worker visa concession; Temporary Work – Creative Worker visa | London | 1 | — | London (4,643) | 202, 3,256 | researched | the agreements of Pact and Equity that a British production would use, since the game’s work in London is an American production’s; the UK’s tax on a visiting performer’s pay, which the game doesn’t withhold; the other visas that let you work in the UK |
| United States (US) | country | 17,342 | US package | New York, Los Angeles, Atlanta, Chicago, Boston, Washington, Philadelphia, Seattle, San Diego, New Haven | 3 | 1 | Chicago (4,449) | 353, 4,254 | researched | — |
| United States Minor Outlying Islands (UM) | territory of United States | 0 | unsupported | — | — | — | — | — | simulated | its rules for working there; a market of its own |
| Uruguay (UY) | country | 135 | unsupported | — | 1 | — | Atlanta (135) | 8,083, 8,233 | partly researched | its rules for working there; a market of its own |
| Uzbekistan (UZ) | country | 219 | unsupported | — | — | — | London (219) | 5,219, 5,516 | simulated | its rules for working there; a market of its own |
| Vanuatu (VU) | country | 9 | unsupported | — | — | — | Sydney (9) | 2,558, 2,767 | simulated | its rules for working there; a market of its own |
| Vatican (VA) | country | 1 | unsupported | — | — | — | London (1) | 1,432, 1,432 | simulated | its rules for working there; a market of its own |
| Venezuela (VE) | country | 414 | unsupported | — | — | — | Atlanta (414) | 3,142, 4,037 | simulated | its rules for working there; a market of its own |
| Vietnam (VN) | country | 904 | unsupported | — | — | — | Sydney (904) | 7,523, 8,091 | simulated | its rules for working there; a market of its own |
| Wallis and Futuna (WF) | territory of France | 3 | unsupported | — | — | — | Sydney (3) | 3,773, 4,006 | simulated | its rules for working there; a market of its own |
| Western Sahara (EH) | country | 22 | unsupported | — | — | — | London (22) | 2,994, 3,715 | simulated | its rules for working there; a market of its own |
| Yemen (YE) | country | 309 | unsupported | — | — | — | London (309) | 5,730, 6,471 | simulated | its rules for working there; a market of its own |
| Zambia (ZM) | country | 98 | unsupported | — | — | — | London (98) | 7,729, 8,115 | simulated | its rules for working there; a market of its own |
| Zimbabwe (ZW) | country | 68 | unsupported | — | — | — | London (68) | 8,297, 8,709 | simulated | its rules for working there; a market of its own |
