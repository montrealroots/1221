/**
 * Builds the tappable world map.
 *
 * Natural Earth's 110m country outlines, projected and simplified into SVG
 * path data keyed by the same country ids the rest of SLATE uses. The result
 * lives in public/geo alongside the city files and is fetched only when
 * somebody opens a map, because an outline of every country on Earth does not
 * belong in the bundle any more than every city does.
 *
 * Equirectangular, because the map is for pointing at a country rather than
 * for navigation: longitude and latitude map straight onto x and y, which
 * makes hit-testing a tap trivial and keeps the projection honest about being
 * a convenience rather than a claim about area.
 *
 * Run with: node tools/build-world-map.mjs <geonames-dir>
 */

import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { feature } from 'topojson-client';

const source = process.argv[2];
if (!source) {
  console.error('Usage: node tools/build-world-map.mjs <directory containing countryInfo.txt>');
  process.exit(1);
}

const TOPO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

/** The drawing surface. Two-to-one, as an equirectangular world is. */
const MAP_WIDTH = 2000;
const MAP_HEIGHT = 1000;

/** Decimal places kept in the projected space. One is ~20km, plenty here. */
const PRECISION = 1;

/** SLATE keeps GB under 'uk'; everything else is ISO 3166-1 alpha-2, lowercased. */
const COUNTRY_ID_OVERRIDE = { GB: 'uk' };
const countryId = (iso2) => COUNTRY_ID_OVERRIDE[iso2] ?? iso2.toLowerCase();

// --- Numeric ISO -> the ids SLATE uses -------------------------------------

const byNumeric = new Map();
for (const line of readFileSync(join(source, 'countryInfo.txt'), 'utf8').split('\n')) {
  if (!line || line.startsWith('#')) continue;
  const [iso2, , numeric, , name] = line.split('\t');
  if (!iso2 || !numeric) continue;
  byNumeric.set(String(Number(numeric)), { id: countryId(iso2), name });
}

// --- Fetch and decode ------------------------------------------------------

const response = await fetch(TOPO_URL);
if (!response.ok) throw new Error(`Could not fetch the world outlines: ${response.status}`);
const topology = await response.json();
const collection = feature(topology, topology.objects.countries);

/** Longitude and latitude straight onto the drawing surface. */
const project = ([lon, lat]) => [
  ((lon + 180) / 360) * MAP_WIDTH,
  ((90 - lat) / 180) * MAP_HEIGHT,
];

/**
 * Longitudes made continuous along the ring.
 *
 * A country that straddles the antimeridian — Fiji, the Russian far east —
 * arrives with longitudes that flip between 179 and -179 as the outline
 * crosses it. Projected literally, that flip becomes a segment straight across
 * the entire map, and the country renders as a band through every other
 * country's territory. Unwrapping keeps the ring continuous past 180 instead,
 * so the shape stays a shape; the halves that fall off the canvas are put back
 * by drawing a second copy shifted a full turn.
 */
function unwrap(points) {
  const out = [];
  let offset = 0;
  let previous = null;
  for (const [lon, lat] of points) {
    if (previous !== null) {
      if (lon - previous > 180) offset -= 360;
      else if (lon - previous < -180) offset += 360;
    }
    previous = lon;
    out.push([lon + offset, lat]);
  }
  return out;
}

/** One ring as an SVG subpath, dropping points that round to the same place. */
function subpath(points) {
  let path = '';
  let lastX = null;
  let lastY = null;
  for (const point of points) {
    const [px, py] = project(point);
    const x = px.toFixed(PRECISION);
    const y = py.toFixed(PRECISION);
    if (x === lastX && y === lastY) continue;
    path += path === '' ? `M${x} ${y}` : `L${x} ${y}`;
    lastX = x;
    lastY = y;
  }
  return path === '' ? '' : `${path}Z`;
}

/**
 * One ring, drawn once, and again a turn away if it overhangs the canvas.
 *
 * Returns the subpath along with the ring's true extent on the surface —
 * true meaning before the duplicate copy is added, so that zooming to Russia
 * frames Russia rather than the whole northern hemisphere.
 */
function ring(points) {
  const unwrapped = unwrap(points);
  let low = Infinity;
  let high = -Infinity;
  for (const [lon] of unwrapped) {
    if (lon < low) low = lon;
    if (lon > high) high = lon;
  }

  const extentOf = (lonLow, lonHigh, pts) => {
    let top = Infinity;
    let bottom = -Infinity;
    for (const [, lat] of pts) {
      const y = ((90 - lat) / 180) * MAP_HEIGHT;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
    }
    return [((lonLow + 180) / 360) * MAP_WIDTH, top, ((lonHigh + 180) / 360) * MAP_WIDTH, bottom];
  };

  // A whole-world ring — Antarctica's coast closes along the bottom edge —
  // is not a crossing and must be left exactly where it is.
  if (high - low >= 359) {
    return { path: subpath(unwrapped), extent: extentOf(low, high, unwrapped) };
  }

  // Center the ring on the canvas before deciding whether it overhangs.
  const middle = (low + high) / 2;
  const turns = middle > 180 ? -1 : middle < -180 ? 1 : 0;
  const shift = (by) => unwrapped.map(([lon, lat]) => [lon + by * 360, lat]);
  const centred = turns === 0 ? unwrapped : shift(turns);
  const left = low + turns * 360;
  const right = high + turns * 360;

  let path = subpath(centred);
  if (right > 180) path += subpath(centred.map(([lon, lat]) => [lon - 360, lat]));
  else if (left < -180) path += subpath(centred.map(([lon, lat]) => [lon + 360, lat]));
  return { path, extent: extentOf(left, right, centred) };
}

const paths = {};
const names = {};
const bounds = {};
let skipped = 0;

/** How far from the main landmass an outlying piece is still counted in. */
const CLUSTER_X = MAP_WIDTH * 0.15;
const CLUSTER_Y = MAP_HEIGHT * 0.15;

/**
 * The box to frame a country in.
 *
 * Not simply every ring: Russia owns two islands past the antimeridian, and
 * taking the union with those would frame the entire northern hemisphere and
 * call it Russia. So the largest piece leads, and the smaller ones join only
 * if they sit near it. Wrangel Island is left out of the view; Kaliningrad,
 * Alaska and Hawaii are not.
 */
function frame(extents) {
  const area = ([x1, y1, x2, y2]) => (x2 - x1) * (y2 - y1);
  const rest = extents.slice().sort((a, b) => area(b) - area(a));
  const first = rest.shift();
  if (!first) return null;
  const box = first.slice();

  let joined = true;
  while (joined) {
    joined = false;
    for (let i = rest.length - 1; i >= 0; i--) {
      const [x1, y1, x2, y2] = rest[i];
      const near = x1 <= box[2] + CLUSTER_X && x2 >= box[0] - CLUSTER_X
        && y1 <= box[3] + CLUSTER_Y && y2 >= box[1] - CLUSTER_Y;
      if (!near) continue;
      if (x1 < box[0]) box[0] = x1;
      if (y1 < box[1]) box[1] = y1;
      if (x2 > box[2]) box[2] = x2;
      if (y2 > box[3]) box[3] = y2;
      rest.splice(i, 1);
      joined = true;
    }
  }
  return box;
}

for (const shape of collection.features) {
  const entry = byNumeric.get(String(Number(shape.id)));
  if (!entry) { skipped++; continue; }

  const polygons = shape.geometry.type === 'Polygon'
    ? [shape.geometry.coordinates]
    : shape.geometry.type === 'MultiPolygon'
      ? shape.geometry.coordinates
      : [];

  let path = '';
  const extents = [];
  for (const polygon of polygons) {
    for (const points of polygon) {
      const drawn = ring(points);
      path += drawn.path;
      if (drawn.path) extents.push(drawn.extent);
    }
  }
  if (!path) continue;
  const box = frame([...(bounds[entry.id] ? [bounds[entry.id]] : []), ...extents]);
  if (box) bounds[entry.id] = box;

  // Several polygons for one country simply concatenate into one path.
  paths[entry.id] = (paths[entry.id] ?? '') + path;
  names[entry.id] = entry.name;
}

const output = {
  width: MAP_WIDTH,
  height: MAP_HEIGHT,
  projection: 'equirectangular',
  source: 'Natural Earth 110m via world-atlas. Public domain.',
  countries: paths,
  names,
  bounds: Object.fromEntries(
    Object.entries(bounds).map(([id, box]) => [id, box.map((n) => Number(n.toFixed(PRECISION)))]),
  ),
};

writeFileSync('public/geo/world-map.json', JSON.stringify(output));

const bytes = JSON.stringify(output).length;
console.log(`countries drawn  ${Object.keys(paths).length}`);
console.log(`unmatched ids    ${skipped}`);
console.log(`file size        ${(bytes / 1024).toFixed(0)}KB`);
