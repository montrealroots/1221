/**
 * SLATE — Certificates, from the lightest to the hardest.
 *
 * Every board has its own ladder and its own words for the same idea. The
 * ladders here are the real ones, in the real order, with what each rung
 * actually permits and who it actually admits. A certificate is not
 * decoration: it decides who can buy a ticket, which is why an R takes a
 * quarter of the audience off a picture that could have been a PG-13, and
 * why an NC-17 takes most of the theatres away entirely.
 *
 * The codes, names, age limits and definitions are the boards' own. The
 * `reach` figure beside each — how much of a potential audience the
 * certificate leaves — is SLATE's calibration from how titles at each rung
 * have historically performed, and the interface says so.
 */

export type RatingSystemId =
  | 'mpa' | 'us-tv' | 'bbfc' | 'ifco' | 'acb' | 'canada' | 'fsk' | 'cnc'
  | 'eirin' | 'kmrb' | 'classind' | 'oflc-nz';

export interface RatingSystem {
  id: RatingSystemId;
  name: string;
  authority: string;
  countryId: string;
  /** What it certifies. */
  scope: 'film' | 'television' | 'both';
  description: string;
  /** Whether the rating is enforced at the box office by law or by trade agreement. */
  enforcement: string;
}

export const RATING_SYSTEMS: readonly RatingSystem[] = [
  { id: 'mpa', name: 'MPA Film Rating System', authority: 'Motion Picture Association, Classification And Rating Administration', countryId: 'us', scope: 'film', description: 'The American film certificate, assigned by a board of parents rather than a government body.', enforcement: 'Voluntary, but enforced at the box office by the theatre chains, which makes it binding in practice.' },
  { id: 'us-tv', name: 'TV Parental Guidelines', authority: 'TV Parental Guidelines Monitoring Board', countryId: 'us', scope: 'television', description: 'The American television advisory, applied by the network or service that carries the programme.', enforcement: 'Advisory, shown on screen at the start of a programme and after each break.' },
  { id: 'bbfc', name: 'BBFC Classification', authority: 'British Board of Film Classification', countryId: 'uk', scope: 'both', description: 'The British certificate, legally binding in cinemas and on physical media.', enforcement: 'Legally enforced. Admitting somebody under age to a 15 or an 18 is an offence.' },
  { id: 'ifco', name: 'IFCO Classification', authority: 'Irish Film Classification Office', countryId: 'ie', scope: 'film', description: 'The Irish certificate, close to the British ladder with its own middle rungs.', enforcement: 'Legally enforced in cinemas.' },
  { id: 'acb', name: 'Australian Classification', authority: 'Australian Classification Board', countryId: 'au', scope: 'both', description: 'The Australian certificate, with legally restricted categories above M.', enforcement: 'MA 15+ and above are legally restricted.' },
  { id: 'canada', name: 'Canadian Home Video Rating', authority: 'The provincial film classification boards', countryId: 'ca', scope: 'film', description: 'Canada rates by province; this is the common national ladder used for distribution.', enforcement: 'Enforced provincially, with 18A and R restricted.' },
  { id: 'fsk', name: 'FSK', authority: 'Freiwillige Selbstkontrolle der Filmwirtschaft', countryId: 'de', scope: 'both', description: 'The German certificate, stated as the age from which a film is released.', enforcement: 'Legally binding for cinema admission and sale.' },
  { id: 'cnc', name: 'Visa d\'Exploitation', authority: 'Centre National du Cinéma et de l\'Image Animée', countryId: 'fr', scope: 'film', description: 'The French certificate: everything is admitted unless a restriction is stated.', enforcement: 'Legally binding, with restrictions stated as a minimum age.' },
  { id: 'eirin', name: 'Eirin Classification', authority: 'Film Classification and Rating Committee', countryId: 'jp', scope: 'film', description: 'The Japanese certificate, with two restricted tiers above a parental advisory.', enforcement: 'Industry-enforced at the box office.' },
  { id: 'kmrb', name: 'KMRB Rating', authority: 'Korea Media Rating Board', countryId: 'kr', scope: 'both', description: 'The South Korean certificate, with a legally restricted adult tier.', enforcement: 'Legally binding; 19 is enforced with identification.' },
  { id: 'classind', name: 'ClassInd', authority: 'Departamento de Justiça, Classificação, Títulos e Qualificação', countryId: 'br', scope: 'both', description: 'The Brazilian advisory, stated as a recommended minimum age and tied to broadcast hours.', enforcement: 'Advisory for cinema, binding for broadcast scheduling.' },
  { id: 'oflc-nz', name: 'New Zealand Classification', authority: 'Office of Film and Literature Classification', countryId: 'nz', scope: 'both', description: 'The New Zealand certificate, with green unrestricted and red restricted labels.', enforcement: 'Restricted labels are legally binding.' },
];

export interface RatingDef {
  id: string;
  system: RatingSystemId;
  /** The code as it is printed. */
  code: string;
  name: string;
  /** Severity on one scale across every system, 0 lightest to 100 hardest. */
  severity: number;
  /** The age from which it is admitted or advised, when the board states one. */
  minimumAge?: number;
  /** Whether a younger viewer may attend with an adult. */
  accompanied?: boolean;
  description: string;
  /** What this rung permits that the one below it does not. */
  permits: string;
  /** The line it will not cross. */
  limit: string;
  /**
   * Fraction of the potential audience the certificate leaves. SLATE's
   * calibration from how titles at each rung have performed, not a published figure.
   */
  reach: number;
  /** True where the certificate materially restricts where it can play or be advertised. */
  restrictive?: boolean;
  /** No longer issued. Kept because older titles carry it. */
  historical?: boolean;
  /**
   * Not a decision a board made. "Not Rated" means nobody submitted it, so it
   * is never what a board would suggest — it is what a distributor chooses.
   */
  unsubmitted?: boolean;
}

/**
 * Every certificate, grouped by system and ordered lightest to hardest inside it.
 */
export const RATINGS: readonly RatingDef[] = [
  // --- MPA, United States, film -------------------------------------------
  { id: 'g', system: 'mpa', code: 'G', name: 'General Audiences', severity: 5, description: 'Nothing that would offend a parent of a young child.', permits: 'Mild language at most, and no depiction of anything a small child would find frightening.', limit: 'No nudity, no drug use, and violence only as slapstick.', reach: 1 },
  { id: 'pg', system: 'mpa', code: 'PG', name: 'Parental Guidance Suggested', severity: 20, description: 'Some material may not suit children; a parent should look at it first.', permits: 'Brief mild language, some violence, and frightening sequences in a fantasy register.', limit: 'No drug use, no nudity beyond the incidental, and no sustained realistic violence.', reach: 0.98 },
  { id: 'pg-13', system: 'mpa', code: 'PG-13', name: 'Parents Strongly Cautioned', severity: 40, minimumAge: 13, accompanied: true, description: 'Some material may be inappropriate for children under thirteen.', permits: 'Sustained action violence, one use of the harshest language as an expletive, brief non-sexual nudity, and drug material with consequence.', limit: 'No realistic sexualised nudity, no repeated hard language, and violence without dwelling on the gore.', reach: 1 },
  { id: 'r', system: 'mpa', code: 'R', name: 'Restricted', severity: 65, minimumAge: 17, accompanied: true, description: 'Under seventeen requires an accompanying parent or adult guardian.', permits: 'Strong language throughout, graphic violence, drug use, and sexual content.', limit: 'Sexual content that is explicit rather than depicted, which is the line to NC-17.', reach: 0.76 },
  { id: 'nc-17', system: 'mpa', code: 'NC-17', name: 'Adults Only', severity: 85, minimumAge: 18, description: 'No one seventeen and under admitted, with no exception for an accompanying adult.', permits: 'Anything the board considers adult, most often explicit sexual content or extreme violence.', limit: 'Not a legal ban, but many chains will not book it and many outlets will not carry the advertising.', reach: 0.18, restrictive: true },
  { id: 'nr', system: 'mpa', code: 'NR', name: 'Not Rated', severity: 50, unsubmitted: true, description: 'Never submitted to the board. Common for documentaries, foreign titles and festival releases.', permits: 'Anything, because nothing was certified.', limit: 'Chains treat an unrated wide release as an R at best, and many will not book one.', reach: 0.55, restrictive: true },
  { id: 'm', system: 'mpa', code: 'M', name: 'Mature Audiences', severity: 35, description: 'The original 1968 middle rung, for mature audiences with parental discretion advised.', permits: 'What PG later covered.', limit: 'Replaced by GP in 1970 because audiences read it as restricted.', reach: 0.9, historical: true },
  { id: 'gp', system: 'mpa', code: 'GP', name: 'All Ages Admitted, Parental Guidance Suggested', severity: 25, description: 'The 1970 replacement for M, itself replaced by PG in 1972.', permits: 'What PG covers now.', limit: 'Withdrawn as confusing.', reach: 0.95, historical: true },
  { id: 'x', system: 'mpa', code: 'X', name: 'X', severity: 88, minimumAge: 17, description: 'The original adults-only rung, unregistered as a trademark and so adopted by the pornographic trade.', permits: 'Adult content of any kind.', limit: 'Replaced by NC-17 in 1990 precisely because the label had been taken.', reach: 0.12, restrictive: true, historical: true },

  // --- TV Parental Guidelines, United States, television -------------------
  { id: 'tv-y', system: 'us-tv', code: 'TV-Y', name: 'All Children', severity: 2, description: 'Designed for a very young audience, including children from ages two to six.', permits: 'Nothing that would frighten a small child.', limit: 'No peril presented as real.', reach: 1 },
  { id: 'tv-y7', system: 'us-tv', code: 'TV-Y7', name: 'Directed To Older Children', severity: 12, minimumAge: 7, description: 'For children age seven and above, who can tell make-believe from real.', permits: 'Mild fantasy violence and comedic peril.', limit: 'Nothing a younger child could not distinguish from reality.', reach: 1 },
  { id: 'tv-y7-fv', system: 'us-tv', code: 'TV-Y7-FV', name: 'Directed To Older Children, Fantasy Violence', severity: 16, minimumAge: 7, description: 'As TV-Y7, where fantasy violence is more intense or combative than usual.', permits: 'Combat as the ordinary business of the programme.', limit: 'Fantasy register only; nothing realistic.', reach: 1 },
  { id: 'tv-g', system: 'us-tv', code: 'TV-G', name: 'General Audience', severity: 8, description: 'Most parents would find this suitable for all ages.', permits: 'Little or no violence, no strong language, and little or no sexual dialogue.', limit: 'Nothing a parent would need to be present for.', reach: 1 },
  { id: 'tv-pg', system: 'us-tv', code: 'TV-PG', name: 'Parental Guidance Suggested', severity: 28, description: 'Contains material parents may find unsuitable for younger children.', permits: 'Moderate violence, some suggestive dialogue, infrequent coarse language.', limit: 'No strong language, no explicit sexual content.', reach: 1 },
  { id: 'tv-14', system: 'us-tv', code: 'TV-14', name: 'Parents Strongly Cautioned', severity: 48, minimumAge: 14, description: 'Contains material many parents would find unsuitable for children under fourteen.', permits: 'Intense violence, intense sexual situations, strong coarse language, and suggestive dialogue.', limit: 'Short of the sustained explicit content that takes it to TV-MA.', reach: 0.97 },
  { id: 'tv-ma', system: 'us-tv', code: 'TV-MA', name: 'Mature Audience Only', severity: 70, minimumAge: 17, description: 'Specifically designed to be viewed by adults and unsuitable for children under seventeen.', permits: 'Graphic violence, explicit sexual activity, and crude indecent language.', limit: 'What a broadcaster will carry; on a streaming service, effectively nothing.', reach: 0.9 },

  // --- BBFC, United Kingdom ------------------------------------------------
  { id: 'bbfc-u', system: 'bbfc', code: 'U', name: 'Universal', severity: 5, description: 'Suitable for audiences aged four years and over.', permits: 'Very mild bad language, and mild violence with no detail or emphasis.', limit: 'Nothing that would unsettle a young child, and no references to illegal drugs.', reach: 1 },
  { id: 'bbfc-pg', system: 'bbfc', code: 'PG', name: 'Parental Guidance', severity: 20, description: 'General viewing, but some scenes may be unsuitable for young children.', permits: 'Mild bad language, mild sex references, and moderate violence without detail.', limit: 'Should not unsettle a child of around eight or older.', reach: 0.98 },
  { id: 'bbfc-12a', system: 'bbfc', code: '12A', name: '12A', severity: 38, minimumAge: 12, accompanied: true, description: 'Cinema only. No one under twelve may see it unless accompanied by an adult.', permits: 'Moderate violence without dwelling on detail, brief strong language, and infrequent sex references.', limit: 'Sexual violence only if discreet and justified.', reach: 1 },
  { id: 'bbfc-12', system: 'bbfc', code: '12', name: '12', severity: 40, minimumAge: 12, description: 'Video and disc only. No one under twelve may rent or buy it.', permits: 'The same as 12A, in the home.', limit: 'The same line as 12A.', reach: 0.99 },
  { id: 'bbfc-15', system: 'bbfc', code: '15', name: '15', severity: 60, minimumAge: 15, description: 'No one under fifteen is admitted, with no accompanied exception.', permits: 'Strong violence, frequent strong language, strong sex references, and drug taking.', limit: 'No sexual violence presented for entertainment, and no promotion of illegal behaviour.', reach: 0.85 },
  { id: 'bbfc-18', system: 'bbfc', code: '18', name: '18', severity: 78, minimumAge: 18, description: 'Suitable only for adults. No one under eighteen is admitted.', permits: 'Very strong violence, strong sexual content, and hard drug use.', limit: 'Material that is criminal, or that presents sexual violence as endorsement.', reach: 0.62 },
  { id: 'bbfc-r18', system: 'bbfc', code: 'R18', name: 'R18', severity: 95, minimumAge: 18, description: 'A special certificate for explicit works, sold only in licensed sex shops and shown only in licensed cinemas.', permits: 'Explicit consensual sexual activity between adults.', limit: 'Not available in ordinary retail or general cinemas at all.', reach: 0.02, restrictive: true },

  // --- Ireland -------------------------------------------------------------
  { id: 'ifco-g', system: 'ifco', code: 'G', name: 'General', severity: 5, description: 'Suitable for viewing by everyone, including children of school-going age.', permits: 'Mild peril in a clearly unreal register.', limit: 'Nothing a young child could find distressing.', reach: 1 },
  { id: 'ifco-pg', system: 'ifco', code: 'PG', name: 'Parental Guidance', severity: 20, description: 'Parental guidance is recommended for children under twelve.', permits: 'Mild bad language and moderate, undetailed violence.', limit: 'No strong language and no sexual content.', reach: 0.98 },
  { id: 'ifco-12a', system: 'ifco', code: '12A', name: '12A', severity: 38, minimumAge: 12, accompanied: true, description: 'Children under twelve may attend with an adult.', permits: 'Moderate violence, brief strong language, and discreet sexual references.', limit: 'Nothing sustained or explicit.', reach: 1 },
  { id: 'ifco-15a', system: 'ifco', code: '15A', name: '15A', severity: 56, minimumAge: 15, accompanied: true, description: 'Children under fifteen may attend with an adult.', permits: 'Strong violence, strong language, and sexual content that is not explicit.', limit: 'Short of the sustained adult content of a 16.', reach: 0.9 },
  { id: 'ifco-16', system: 'ifco', code: '16', name: '16', severity: 68, minimumAge: 16, description: 'No one under sixteen is admitted.', permits: 'Sustained strong violence and strong sexual content.', limit: 'Short of the explicit.', reach: 0.72 },
  { id: 'ifco-18', system: 'ifco', code: '18', name: '18', severity: 80, minimumAge: 18, description: 'Suitable only for adults.', permits: 'Very strong material of any kind that is lawful.', limit: 'Criminal content and material that endorses sexual violence.', reach: 0.6 },

  // --- Australia -----------------------------------------------------------
  { id: 'acb-g', system: 'acb', code: 'G', name: 'General', severity: 5, description: 'Suitable for everyone, though not necessarily of interest to children.', permits: 'Very mild impact only.', limit: 'Nothing above very mild in any category.', reach: 1 },
  { id: 'acb-pg', system: 'acb', code: 'PG', name: 'Parental Guidance', severity: 22, description: 'Material that a child may find confusing or upsetting.', permits: 'Mild impact across violence, language and themes.', limit: 'Nothing above mild.', reach: 0.98 },
  { id: 'acb-m', system: 'acb', code: 'M', name: 'Mature', severity: 45, minimumAge: 15, description: 'Recommended for mature audiences of fifteen and over, but not legally restricted.', permits: 'Moderate impact violence, language, drug use and nudity.', limit: 'Nothing above moderate.', reach: 0.97 },
  { id: 'acb-ma15', system: 'acb', code: 'MA 15+', name: 'Mature Accompanied', severity: 62, minimumAge: 15, accompanied: true, description: 'Legally restricted. Under fifteen must be with a parent or guardian.', permits: 'Strong impact violence, language, themes, drug use and sex.', limit: 'Nothing above strong.', reach: 0.84 },
  { id: 'acb-r18', system: 'acb', code: 'R 18+', name: 'Restricted', severity: 80, minimumAge: 18, description: 'Legally restricted to adults.', permits: 'High impact material across every category.', limit: 'Anything the board refuses classification to cannot be sold or shown at all.', reach: 0.6 },
  { id: 'acb-x18', system: 'acb', code: 'X 18+', name: 'Restricted, Sexually Explicit', severity: 95, minimumAge: 18, description: 'Sexually explicit material, legal to sell only in some territories.', permits: 'Real depictions of consenting sexual activity between adults.', limit: 'No violence of any kind, and unavailable in most of the country.', reach: 0.02, restrictive: true },

  // --- Canada --------------------------------------------------------------
  { id: 'ca-g', system: 'canada', code: 'G', name: 'General', severity: 5, description: 'Suitable for viewers of all ages.', permits: 'Minimal violence and no offensive language.', limit: 'Nothing requiring guidance.', reach: 1 },
  { id: 'ca-pg', system: 'canada', code: 'PG', name: 'Parental Guidance', severity: 20, description: 'Parental guidance advised; may not suit all children.', permits: 'Infrequent coarse language and mild violence.', limit: 'No sexual content beyond the incidental.', reach: 0.98 },
  { id: 'ca-14a', system: 'canada', code: '14A', name: '14 Accompaniment', severity: 48, minimumAge: 14, accompanied: true, description: 'Under fourteen must be accompanied by an adult.', permits: 'Violence, coarse language and sexually suggestive scenes.', limit: 'Short of graphic.', reach: 0.97 },
  { id: 'ca-18a', system: 'canada', code: '18A', name: '18 Accompaniment', severity: 66, minimumAge: 18, accompanied: true, description: 'Under eighteen must be accompanied by an adult.', permits: 'Explicit violence, frequent coarse language, sexual activity and horror.', limit: 'Short of what would restrict it entirely.', reach: 0.8 },
  { id: 'ca-r', system: 'canada', code: 'R', name: 'Restricted', severity: 80, minimumAge: 18, description: 'Admittance restricted to eighteen and over.', permits: 'Material intended for adults, with no accompanied exception.', limit: 'Nothing unlawful.', reach: 0.6 },
  { id: 'ca-a', system: 'canada', code: 'A', name: 'Adult', severity: 95, minimumAge: 18, description: 'Sexually explicit, sold and shown only in restricted settings.', permits: 'Explicit sexual content.', limit: 'Not available in general release.', reach: 0.02, restrictive: true },

  // --- Germany -------------------------------------------------------------
  { id: 'fsk-0', system: 'fsk', code: 'FSK 0', name: 'Released Without Age Restriction', severity: 5, minimumAge: 0, description: 'Released for all ages.', permits: 'Nothing that could disturb the development of a young child.', limit: 'No frightening or violent sequences of substance.', reach: 1 },
  { id: 'fsk-6', system: 'fsk', code: 'FSK 6', name: 'Released From Six', severity: 18, minimumAge: 6, description: 'Released from the age of six.', permits: 'Brief tension and mild peril.', limit: 'No sustained threat.', reach: 0.99 },
  { id: 'fsk-12', system: 'fsk', code: 'FSK 12', name: 'Released From Twelve', severity: 38, minimumAge: 12, accompanied: true, description: 'Released from twelve; from six with a parent in the cinema.', permits: 'Sustained tension and violence without dwelling on it.', limit: 'No lasting distress for a child of twelve.', reach: 0.99 },
  { id: 'fsk-16', system: 'fsk', code: 'FSK 16', name: 'Released From Sixteen', severity: 60, minimumAge: 16, description: 'Released from the age of sixteen.', permits: 'Strong violence, drug use and sexuality.', limit: 'Nothing that would disorient a sixteen-year-old.', reach: 0.82 },
  { id: 'fsk-18', system: 'fsk', code: 'FSK 18', name: 'No Youth Release', severity: 80, minimumAge: 18, description: 'Not released to young people; adults only.', permits: 'Material for adults across every category.', limit: 'Anything indexed or criminal cannot be sold at all.', reach: 0.6 },

  // --- France --------------------------------------------------------------
  { id: 'cnc-tp', system: 'cnc', code: 'Tous Publics', name: 'All Audiences', severity: 10, description: 'Authorised for all audiences, with an optional warning attached.', permits: 'Anything the board does not consider harmful to a child.', limit: 'Where a warning is attached, the board is signalling scenes that may disturb.', reach: 1 },
  { id: 'cnc-12', system: 'cnc', code: '-12', name: 'Prohibited Under Twelve', severity: 40, minimumAge: 12, description: 'Prohibited to those under twelve.', permits: 'Violence and themes a younger child should not see.', limit: 'Short of sustained adult content.', reach: 0.97 },
  { id: 'cnc-16', system: 'cnc', code: '-16', name: 'Prohibited Under Sixteen', severity: 62, minimumAge: 16, description: 'Prohibited to those under sixteen.', permits: 'Strong violence, drug use and explicit sexuality.', limit: 'Short of the pornographic or extremely violent.', reach: 0.8 },
  { id: 'cnc-18', system: 'cnc', code: '-18', name: 'Prohibited Under Eighteen', severity: 82, minimumAge: 18, description: 'Prohibited to minors, without being classified pornographic.', permits: 'Very strong material for adults.', limit: 'The X classification above it carries tax and distribution penalties.', reach: 0.5, restrictive: true },

  // --- Japan ---------------------------------------------------------------
  { id: 'eirin-g', system: 'eirin', code: 'G', name: 'General', severity: 5, description: 'Suitable for all ages.', permits: 'Nothing requiring guidance.', limit: 'Nothing frightening or sexual.', reach: 1 },
  { id: 'eirin-pg12', system: 'eirin', code: 'PG12', name: 'Parental Guidance Twelve', severity: 30, minimumAge: 12, accompanied: true, description: 'Parental guidance requested for those under twelve.', permits: 'Violence and themes needing an adult present.', limit: 'Nothing a guided child could not handle.', reach: 0.99 },
  { id: 'eirin-r15', system: 'eirin', code: 'R15+', name: 'Restricted Fifteen', severity: 58, minimumAge: 15, description: 'Admission restricted to fifteen and over.', permits: 'Strong violence and sexual content.', limit: 'Short of explicit.', reach: 0.85 },
  { id: 'eirin-r18', system: 'eirin', code: 'R18+', name: 'Restricted Eighteen', severity: 80, minimumAge: 18, description: 'Admission restricted to eighteen and over.', permits: 'Adult material of every kind.', limit: 'Subject to the obscenity law regardless of certificate.', reach: 0.55 },

  // --- South Korea ---------------------------------------------------------
  { id: 'kmrb-all', system: 'kmrb', code: 'ALL', name: 'Suitable For All', severity: 5, description: 'Suitable for audiences of all ages.', permits: 'Nothing harmful to a child.', limit: 'Nothing frightening or sexual.', reach: 1 },
  { id: 'kmrb-12', system: 'kmrb', code: '12', name: 'Twelve And Over', severity: 32, minimumAge: 12, accompanied: true, description: 'For twelve and over; younger with a guardian.', permits: 'Moderate violence and mature themes.', limit: 'Nothing sustained.', reach: 0.99 },
  { id: 'kmrb-15', system: 'kmrb', code: '15', name: 'Fifteen And Over', severity: 55, minimumAge: 15, accompanied: true, description: 'For fifteen and over; younger with a guardian.', permits: 'Strong violence, language and sexual reference.', limit: 'Short of explicit.', reach: 0.92 },
  { id: 'kmrb-19', system: 'kmrb', code: '19', name: 'Restricted To Nineteen', severity: 78, minimumAge: 19, description: 'Legally restricted; identification is checked.', permits: 'Adult content across every category.', limit: 'A restricted-screening rating above it effectively bars general release.', reach: 0.62 },

  // --- Brazil --------------------------------------------------------------
  { id: 'classind-l', system: 'classind', code: 'L', name: 'Free For All Audiences', severity: 5, description: 'No age restriction.', permits: 'Nothing harmful to a child.', limit: 'No violence, sex or drug content.', reach: 1 },
  { id: 'classind-10', system: 'classind', code: '10', name: 'Not Recommended Under Ten', severity: 18, minimumAge: 10, description: 'Not recommended for those under ten.', permits: 'Mild violence and fear.', limit: 'Nothing sustained.', reach: 0.99 },
  { id: 'classind-12', system: 'classind', code: '12', name: 'Not Recommended Under Twelve', severity: 34, minimumAge: 12, description: 'Not recommended for those under twelve.', permits: 'Violence, mild sexual content and drug references.', limit: 'Nothing graphic.', reach: 0.98 },
  { id: 'classind-14', system: 'classind', code: '14', name: 'Not Recommended Under Fourteen', severity: 48, minimumAge: 14, description: 'Not recommended for those under fourteen.', permits: 'Strong violence and sexual content.', limit: 'Short of explicit.', reach: 0.95 },
  { id: 'classind-16', system: 'classind', code: '16', name: 'Not Recommended Under Sixteen', severity: 64, minimumAge: 16, description: 'Not recommended for those under sixteen.', permits: 'Graphic violence, drug use and strong sexual content.', limit: 'Short of the explicitly adult.', reach: 0.82 },
  { id: 'classind-18', system: 'classind', code: '18', name: 'Not Recommended Under Eighteen', severity: 80, minimumAge: 18, description: 'Not recommended for those under eighteen; broadcast only late at night.', permits: 'Adult content of every kind.', limit: 'Broadcast hours are legally restricted.', reach: 0.6 },

  // --- New Zealand ---------------------------------------------------------
  { id: 'nz-g', system: 'oflc-nz', code: 'G', name: 'General', severity: 5, description: 'Suitable for general audiences.', permits: 'Nothing likely to harm a child.', limit: 'Nothing above very mild.', reach: 1 },
  { id: 'nz-pg', system: 'oflc-nz', code: 'PG', name: 'Parental Guidance', severity: 20, description: 'Parental guidance recommended for younger viewers.', permits: 'Mild violence and themes.', limit: 'Nothing above mild.', reach: 0.98 },
  { id: 'nz-m', system: 'oflc-nz', code: 'M', name: 'Mature', severity: 42, minimumAge: 16, description: 'Suitable for mature audiences of sixteen and over, but unrestricted.', permits: 'Moderate violence, language, sex and drug use.', limit: 'Nothing above moderate.', reach: 0.97 },
  { id: 'nz-r13', system: 'oflc-nz', code: 'R13', name: 'Restricted To Thirteen', severity: 50, minimumAge: 13, description: 'Legally restricted to thirteen and over.', permits: 'Content beyond the moderate for a young teenage audience.', limit: 'Short of strong.', reach: 0.95 },
  { id: 'nz-r16', system: 'oflc-nz', code: 'R16', name: 'Restricted To Sixteen', severity: 66, minimumAge: 16, description: 'Legally restricted to sixteen and over.', permits: 'Strong violence, sexual content and drug use.', limit: 'Short of the adult tier.', reach: 0.82 },
  { id: 'nz-r18', system: 'oflc-nz', code: 'R18', name: 'Restricted To Eighteen', severity: 80, minimumAge: 18, description: 'Legally restricted to adults.', permits: 'Adult content across every category.', limit: 'Anything banned outright cannot be supplied at all.', reach: 0.6 },
];

const RATING_BY_ID = new Map(RATINGS.map((r) => [r.id, r]));
const RATING_BY_CODE = new Map<string, RatingDef>();
for (const r of RATINGS) {
  const key = `${r.system}|${r.code.toUpperCase()}`;
  RATING_BY_CODE.set(key, r);
  // A bare code resolves to the American ladder first, which is what the record usually means.
  if (!RATING_BY_CODE.has(r.code.toUpperCase())) RATING_BY_CODE.set(r.code.toUpperCase(), r);
}

export function rating(id: string): RatingDef | undefined {
  return RATING_BY_ID.get(id) ?? RATING_BY_CODE.get(id.toUpperCase());
}

export function ratingSystem(id: RatingSystemId): RatingSystem | undefined {
  return RATING_SYSTEMS.find((s) => s.id === id);
}

/** One system's ladder, lightest first, with the historical rungs last. */
export function ladder(system: RatingSystemId, includeHistorical = false): RatingDef[] {
  return RATINGS
    .filter((r) => r.system === system && (includeHistorical || !r.historical))
    .sort((a, b) => a.severity - b.severity);
}

/** Every certificate a format can carry in a country, lightest first. */
export function ratingsFor(countryId: string, television: boolean): RatingDef[] {
  const systems = RATING_SYSTEMS.filter((s) => s.countryId === countryId
    && (s.scope === 'both' || s.scope === (television ? 'television' : 'film')));
  const chosen = systems.length > 0 ? systems : RATING_SYSTEMS.filter((s) => s.id === (television ? 'us-tv' : 'mpa'));
  return chosen.flatMap((s) => ladder(s.id)).sort((a, b) => a.severity - b.severity);
}

/**
 * How much of the potential audience a certificate leaves. A hard rating is a
 * commercial decision as much as a creative one, and this is where it shows.
 */
export function audienceReach(ratingId: string | undefined): number {
  return rating(ratingId ?? '')?.reach ?? 0.95;
}

/** The certificate the content itself earns, given how hard the material runs. */
export function suggestRating(system: RatingSystemId, severity: number): RatingDef {
  // Only rungs a board actually issues. "Not Rated" is not a decision, it is
  // the absence of one, so nothing is ever suggested into it.
  const rungs = ladder(system).filter((r) => !r.unsubmitted);
  const target = Math.max(0, Math.min(100, severity));
  let best = rungs[0]!;
  for (const rung of rungs) {
    if (rung.severity <= target + 6) best = rung;
  }
  return best;
}

/** The content that pushes a certificate up, as a board would list it. */
export const CONTENT_DESCRIPTORS = [
  { id: 'violence', label: 'Violence', explain: 'Physical harm depicted, and how far the camera stays with it.' },
  { id: 'gore', label: 'Gore', explain: 'Injury detail: blood, wounds, and what happens to a body.' },
  { id: 'language', label: 'Language', explain: 'Strength and frequency of the words used.' },
  { id: 'sex', label: 'Sexual Content', explain: 'Sexual activity depicted or referred to, and how explicitly.' },
  { id: 'nudity', label: 'Nudity', explain: 'Whether it appears, and whether it is sexualised.' },
  { id: 'drugs', label: 'Drug Use', explain: 'Substances used on screen, and whether use is presented with consequence.' },
  { id: 'themes', label: 'Themes', explain: 'Subject matter that is adult regardless of how it is shown.' },
  { id: 'peril', label: 'Peril And Threat', explain: 'Sustained danger and how frightening it is made.' },
  { id: 'horror', label: 'Horror', explain: 'Material designed to frighten, including images intended to disturb.' },
  { id: 'discrimination', label: 'Discrimination', explain: 'Prejudiced language or behaviour, and whether the work endorses it.' },
  { id: 'suicide', label: 'Suicide And Self-Harm', explain: 'Depiction or discussion, and whether method is shown.' },
  { id: 'smoking', label: 'Smoking', explain: 'Tobacco use, which several boards now note explicitly.' },
] as const;

export type ContentDescriptor = (typeof CONTENT_DESCRIPTORS)[number]['id'];

/**
 * The severity a set of content levels adds up to, 0-100, on the same scale
 * the certificates are placed on. Violence, sex and language carry the most
 * weight because that is what moves a certificate in practice.
 */
export function contentSeverity(levels: Partial<Record<ContentDescriptor, number>>): number {
  const weights: Record<string, number> = {
    violence: 1, gore: 1.15, language: 0.95, sex: 1.2, nudity: 0.85, drugs: 0.9,
    themes: 0.7, peril: 0.6, horror: 0.8, discrimination: 0.7, suicide: 0.9, smoking: 0.3,
  };
  let peak = 0;
  let sum = 0;
  let count = 0;
  for (const [key, value] of Object.entries(levels)) {
    if (value === undefined) continue;
    const scaled = Math.max(0, Math.min(100, value)) * (weights[key] ?? 0.7);
    peak = Math.max(peak, scaled);
    sum += scaled;
    count++;
  }
  if (count === 0) return 0;
  // The hardest single element sets the floor; the rest of it pushes from there.
  return Math.round(Math.min(100, peak * 0.75 + (sum / count) * 0.35));
}
