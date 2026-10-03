/**
 * SLATE — how long a quartz watch's battery lasts, by the watch (from
 * 2026-10-02), built by `tools/build-watch-batteries.mjs` from
 * `docs/research/world/research-watch-batteries.json`. Don't edit by hand; rebuild it.
 *
 * Each maker's own manual or care page: Timex 2 to 5 years, Casio's F-91W 7 and
 * its LTP-1234 3, G-SHOCK's DW-5600E 2, Tommy Hilfiger 18 to 36 months (Movado
 * Group's), Longines 1 to 5, Frederique Constant six months to 2; Fossil's 2 to 3
 * read secondhand. A range is taken at its middle, SLATE's reading.
 */

export const BATTERY_YEARS: Readonly<Record<string, number>> = {
  "us-timex-easy-reader-35mm-leather-strap-watch": 3.5,
  "us-timex-weekender-37mm-fabric-strap-watch": 3.5,
  "us-timex-ironman-classic-30-full-size-resin-strap-watch": 3.5,
  "us-timex-marlin-quartz-gmt-40mm-leather-strap-watch": 3.5,
  "us-timex-easy-reader-25mm-stainless-steel-expansion-band-watch": 3.5,
  "us-fossil-grant-44mm-chronograph-brown-leather-watch": 2.5,
  "us-fossil-everett-27mm-three-hand-two-tone-stainless-steel-watch": 2.5,
  "us-casio-f91w-1": 7,
  "us-casio-dw5600e-1v": 2,
  "ie-brown-thomas-jade-watch-1782855": 2.25,
  "ie-arnotts-georgia-watch-1782820": 2.25,
  "gb-selfridges-l81154616-primaluna-moonphase-stainless-steel-quartz-watch": 3,
  "mx-liverpool-mx-reloj-bruce-para-hombre-1710739": 2.25,
  "mx-liverpool-mx-reloj-vintage-para-mujer-ltp-1234pdc-7bcf": 3,
  "mx-palacio-mx-reloj-para-hombre-classic-casual-blanco": 1.25
};

/** The ones whose figure was read secondhand. */
export const BATTERY_SECONDHAND: readonly string[] = ["us-fossil-grant-44mm-chronograph-brown-leather-watch","us-fossil-everett-27mm-three-hand-two-tone-stainless-steel-watch"];
