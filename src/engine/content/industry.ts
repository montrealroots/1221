/**
 * SLATE — the screen industry's organizations the game names worldwide, and why each is named (from 2026-10-24, the owner's
 * brief 27, Part 5: "Use verified real names ... Build broad coverage of major film and television markets rather than
 * limiting the world to the United States, United Kingdom, or Australia ... Define selection criteria for major entities.
 * Do not invent a universal 'top ten' ranking across unrelated markets.").
 *
 * **The selection criteria.** An organization is here because an official list names it, never because the game ranked
 * it: a performers' union because the International Federation of Actors (FIA) lists it among its members, and a film
 * festival because the International Federation of Film Producers Associations (FIAPF) accredits it. Each list is read
 * whole from the federation's own page, retrieved on 2026-10-24 (`docs/verification/career-universe-2026-10-24/research/
 * register.json`, `b27-FIA-members` and `b27-FIAPF-accredited`), and the countries are the gazetteer's ids. A country with
 * no entry has no union or festival on those lists; it doesn't mean the country has none. FIA's page carried links to
 * unrelated sites in its menus when it was read (injected, by the look of them); its member list read as the federation's
 * own, and is kept with that said.
 *
 * Reference data, read by the geographic coverage matrix (`tools/geo-coverage.mjs`) and shown on the Career screen's
 * Charts And Awards tab, Unions And Festivals Around The World (`ui/career/IndustryPane.tsx`). Nothing here says an
 * organization has dealt with the player.
 */

/** A performers' union FIA lists as a member, in its own name, by country. */
export interface PerformerUnion { country: string; name: string }

/** FIA's members as its page lists them on 2026-10-24: 87 organizations in 61 countries. */
export const PERFORMER_UNIONS: readonly PerformerUnion[] = [
  { country: 'ar', name: 'AAA – Asociación Argentina de Actores' },
  { country: 'au', name: 'MEAA – Media, Entertainment and Arts Alliance' },
  { country: 'at', name: 'younion_Die Daseinsgewerkschaft' },
  { country: 'az', name: 'ACWU – Azerbaijani Cultural Workers’ Union' },
  { country: 'by', name: 'SAGB – Screen Actors’ Guild of Belarus' },
  { country: 'be', name: 'ACOD Cultuur' },
  { country: 'be', name: 'CSC / TransCom & Culture' },
  { country: 'be', name: 'IRW-CGSP – Interrégionale Wallonne CGSP' },
  { country: 'br', name: 'SATED/CE – Sindicato dos Artistas e Técnicos em Espetáculos de Diversões do Estado do Ceará' },
  { country: 'br', name: 'SATED/MG – Sindicato dos Artistas e Técnicos em Espetáculos de Diversões do Estado do Minas Gerais' },
  { country: 'br', name: 'SATED/SP – Sindicato dos Artistas e Técnicos em Espetáculos de Diversões do Estado do São Paulo' },
  { country: 'bg', name: 'UBA – Union of Bulgarian Actors' },
  { country: 'ca', name: 'ACTRA – Alliance of Canadian Cinema, Television and Radio Artists' },
  { country: 'ca', name: 'CAEA – Canadian Actors’ Equity Association' },
  { country: 'ca', name: 'UDA – Union des Artistes' },
  { country: 'cl', name: 'SIDARTE – Sindicato de Actores de Chile' },
  { country: 'co', name: 'ACA – Asociación Colombiana de Actores' },
  { country: 'co', name: 'CICA – Círculo Colombiano de Artistas' },
  { country: 'hr', name: 'HDDU- Hrvatsko Društvo Dramskih Umjetnika' },
  { country: 'cu', name: 'UNEAC – Unión de Escritores y Artistas de Cuba' },
  { country: 'cy', name: 'AUC – Actors’ Union of Cyprus' },
  { country: 'cz', name: 'HA – Herecká Asociace' },
  { country: 'dk', name: 'DAF – Dansk Artist Forbund' },
  { country: 'dk', name: 'DSF – Dansk Skuespillerforbund' },
  { country: 'ee', name: 'ENL – Eesti Näitlejate Liit' },
  { country: 'fi', name: 'FSSF – Finlands Svenska Skådespelarförbund' },
  { country: 'fi', name: 'SNL – Suomen Näyttelijäliitto' },
  { country: 'fi', name: 'STST – Suomen tanssi-ja sirkustaiteilijat' },
  { country: 'fr', name: 'SFA – Syndicat Français des Artistes-Interprètes' },
  { country: 'ge', name: 'GICSTEU – Georgian Independent Culture, Sports and Tourism Employees’ Union' },
  { country: 'de', name: 'BFFS – Bundesverband Schauspiel' },
  { country: 'de', name: 'GDBA – Genossenschaft Deutscher Bühnen-Angehöriger' },
  { country: 'de', name: 'VdO – Vereinigung deutscher Opern- und Tanzensembles' },
  { country: 'de', name: 'VER.DI – Vereinte Dienstleistungsgewerkschaft' },
  { country: 'gh', name: 'GAG – Ghana Actors’ Guild' },
  { country: 'gr', name: 'ETE – Greek Singers’ Union' },
  { country: 'gr', name: 'HAU – Hellenic Actors’ Union' },
  { country: 'hu', name: 'SDS – Színházi Dolgozók Szakszervezete' },
  { country: 'is', name: 'FÍL – Félag Íslenskra Leikara' },
  { country: 'in', name: 'CINTAA – Cine & TV Artistes Association' },
  { country: 'ie', name: 'IEG – Irish Equity Group' },
  { country: 'il', name: 'SHAHAM – The Israeli Screen Actors’ Guild' },
  { country: 'it', name: 'SLC- Sindacato Lavoratori Comunicazione' },
  { country: 'jp', name: 'JAU – Japan Actors’ Union' },
  { country: 'kz', name: 'CSMWUK – Culture, Sports and Media Workers’ Union of Kazakhstan' },
  { country: 'kg', name: 'CWUK – Cultural Workers’ Union of Kyrghizstan' },
  { country: 'lv', name: 'LKDAF – Latvijas Kultūras Darbinieku Arodbiedrība Federācija' },
  { country: 'lt', name: 'LAG – Lietuvos Aktorių Gildija' },
  { country: 'lu', name: 'Actors.Lu' },
  { country: 'mg', name: 'FMTM – Fikambanan’ny Mpanao Teatra Malagasy' },
  { country: 'mx', name: 'ANDA – Asociación Nacional de Actores' },
  { country: 'md', name: 'FSLC – Federaƫia Sindicatelor Lucrătorilor din Cultură' },
  { country: 'ma', name: 'SMPAD – Syndicat Marocain des Professionnels des Arts Dramatiques' },
  { country: 'np', name: 'FAAN – Film Artists Association of Nepal' },
  { country: 'nl', name: 'Kunstenbond' },
  { country: 'nz', name: 'ENZ – Equity New Zealand' },
  { country: 'ng', name: 'AGN – Actors’ Guild of Nigeria' },
  { country: 'no', name: 'NODA – Norske Dansekunstnere' },
  { country: 'no', name: 'NSF – Norsk Skuespillerforbund' },
  { country: 'pa', name: 'UNAP – Unión Nacional de Artistas de Panamá' },
  { country: 'pe', name: 'SAIP – Sindicato de Artistas Intérpretes del Perú' },
  { country: 'pl', name: 'ZASP – Związek Artystów Scen Polskich' },
  { country: 'pl', name: 'ZZAP – Związek Zawodowy Aktorów Polskich' },
  { country: 'pt', name: 'CENA-STE – Sindicato dos Trabalhadores de Espectáculos, do Audiovisual e dos Músicos' },
  { country: 'ro', name: 'FAIR-MEDIASIND – Federația Cultură și Mass-Media' },
  { country: 'ru', name: 'ITUTCA – Independent Trade Union of Theater and Cinema Actors' },
  { country: 'ru', name: 'RCWU – Russian Cultural Workers’ Union' },
  { country: 'si', name: 'GLOSA – Sindikat kulture in narave Slovenije' },
  { country: 'si', name: 'SAGS – Screen Actors’ Guild of Slovenia' },
  { country: 'si', name: 'SVIZ- Education, Science and Culture Trade Union of Slovenia' },
  { country: 'si', name: 'ZDUS – Zdruzenje Dramskih Umetnikov Slovenije' },
  { country: 'za', name: 'SAGA – South African Guild of Actors' },
  { country: 'es', name: 'CONARTE – Confederación de Artistas – Trabajadores del Espectáculo' },
  { country: 'es', name: 'FSC-CC.OO. – Comisiones Obreras – Comunicación, Artes, Cultura y Deporte' },
  { country: 'es', name: 'UAA – Unión de Actores y Actrices' },
  { country: 'se', name: 'Scen & Film' },
  { country: 'ch', name: 'SSRS – Syndicat Suisse Romand du Spectacle' },
  { country: 'ch', name: 'SzeneSchweiz' },
  { country: 'tj', name: 'CMSTWU – Culture, Media, Sports and Tourism Workers’ Union of Tajikistan' },
  { country: 'tr', name: 'AUT – Oyuncular Sendikası' },
  { country: 'tr', name: 'ÇASOD – Çağdaş Sinema Oyuncuları Derneği' },
  { country: 'ua', name: 'CWU – Cultural Workers’ Union of the Ukraine' },
  { country: 'uk', name: 'Equity' },
  { country: 'us', name: 'AEA – Actors’ Equity Association' },
  { country: 'us', name: 'AGMA – American Guild of Musical Artists' },
  { country: 'us', name: 'SAG-AFTRA – Screen Actors’ Guild – American Federation of Television and Radio Artists' },
  { country: 'uy', name: 'SUA – Sociedad Uruguaya de Actores' },
];

/** A film festival FIAPF accredits, by country. */
export interface AccreditedFestival { country: string; name: string }

/** FIAPF's accredited festivals as its page lists them on 2026-10-24: 50 festivals in 29 countries. */
export const ACCREDITED_FESTIVALS: readonly AccreditedFestival[] = [
  { country: 'ar', name: 'Mar del Plata International Film Festival' },
  { country: 'am', name: 'Golden Apricot Yerevan International Film Festival' },
  { country: 'au', name: 'Sydney Film Festival' },
  { country: 'at', name: 'Kitzbuehel Film Festival' },
  { country: 'at', name: 'Vienna International Film Festival' },
  { country: 'bg', name: 'Sofia International Film Festival' },
  { country: 'ca', name: 'Festival du Nouveau Cinéma' },
  { country: 'ca', name: 'Hot Docs' },
  { country: 'ca', name: 'Toronto International Film Festival' },
  { country: 'cn', name: 'Shanghai International Film Festival' },
  { country: 'cz', name: 'Karlovy Vary International Film Festival' },
  { country: 'do', name: 'Festival de Cine Global Santo Domingo' },
  { country: 'eg', name: 'Cairo International Film Festival' },
  { country: 'ee', name: 'Tallinn Black Nights Film Festival' },
  { country: 'fi', name: 'Tampere Film Festival' },
  { country: 'fr', name: 'Annecy International Animation Film Festival' },
  { country: 'fr', name: 'Festival de Cannes' },
  { country: 'fr', name: 'Clermont-Ferrand International Short Film Festival' },
  { country: 'de', name: 'Berlin International Film Festival' },
  { country: 'de', name: 'FILMFEST MÜNCHEN' },
  { country: 'de', name: 'International Short Film Festival Oberhausen' },
  { country: 'in', name: 'Bengaluru International Film Festival' },
  { country: 'in', name: 'International Film Festival of India – IFFI Goa' },
  { country: 'in', name: 'International Film Festival of Kerala' },
  { country: 'in', name: 'Kolkata International Film Festival' },
  { country: 'ir', name: 'Fajr International Film Festival' },
  { country: 'it', name: 'Noir In Film Festival' },
  { country: 'it', name: 'Rome Film Fest' },
  { country: 'it', name: 'Torino Film Festival' },
  { country: 'it', name: 'Venice International Film Festival' },
  { country: 'jp', name: 'Tokyo International Film Festival' },
  { country: 'kz', name: 'Eurasia International Film Festival' },
  { country: 'me', name: 'Herceg Novi Montenegro Film Festival' },
  { country: 'mk', name: 'Cinedays' },
  { country: 'pl', name: 'Krakow Film Festival' },
  { country: 'pl', name: 'Warsaw International Film Festival' },
  { country: 'ro', name: 'Transilvania International Film Festival' },
  { country: 'kr', name: 'Busan International Film Festival' },
  { country: 'es', name: 'Cinema Jove' },
  { country: 'es', name: 'Gijon International Film Festival' },
  { country: 'es', name: 'Malaga Film Festival' },
  { country: 'es', name: 'Mostra de Valencia – Cinema del Mediterrani' },
  { country: 'es', name: 'Punto de Vista International Documentary Film Festival' },
  { country: 'es', name: 'San Sebastian International Film Festival' },
  { country: 'es', name: 'Sitges International Fantastic Film Festival of Catalunya' },
  { country: 'es', name: 'Zinebi – International Festival of Documentary and Short Film of Bilbao' },
  { country: 'ch', name: 'Locarno Film Festival' },
  { country: 'tr', name: 'Antalya Golden Orange Film Festival' },
  { country: 'ua', name: 'Molodist – Kyiv International Film Festival' },
  { country: 'us', name: 'Fantastic Fest' },
];

/** The research register's ids for the two lists. */
export const INDUSTRY_SOURCES = { unions: 'b27-FIA-members', festivals: 'b27-FIAPF-accredited' } as const;

export const unionsIn = (country: string): readonly PerformerUnion[] => PERFORMER_UNIONS.filter((u) => u.country === country);
export const festivalsIn = (country: string): readonly AccreditedFestival[] => ACCREDITED_FESTIVALS.filter((f) => f.country === country);
