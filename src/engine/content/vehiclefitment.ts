/**
 * SLATE — what fits each car read (from 2026-10-05), built by `tools/build-fitment.mjs` from
 * `docs/research/catalog/vehicle-fitment.json` (makers' spec pages, tire sellers' fitment tools and
 * Crutchfield's, Metra's and Scosche's fit guides). Don't edit by hand; rebuild it.
 *
 * For the model year it was read for: its factory tire sizes, wheel diameter, bolt pattern and its dash's
 * head-unit opening ("integrated" is a maker's screen with no standard opening), and whether a dash kit takes
 * a double-DIN unit.
 */

export interface Fitment { modelYear: number | null; front: string | null; rear: string | null; wheelIn: number | null; bolt: string | null; opening: 'single-din' | 'double-din' | 'integrated' | null; doubleDinKit: boolean; confirmed: boolean }

export const FITMENT: Readonly<Record<string, Fitment>> = {
 "us-ford-f-series": {
  "modelYear": 2026,
  "front": "245/70R17",
  "rear": null,
  "wheelIn": 17,
  "bolt": "6x135",
  "opening": "integrated",
  "doubleDinKit": false,
  "confirmed": true
 },
 "us-chevrolet-silverado": {
  "modelYear": 2026,
  "front": "255/70R17",
  "rear": null,
  "wheelIn": 17,
  "bolt": "6x139.7",
  "opening": "integrated",
  "doubleDinKit": false,
  "confirmed": true
 },
 "us-toyota-rav4": {
  "modelYear": 2026,
  "front": "225/65R17",
  "rear": null,
  "wheelIn": 17,
  "bolt": "5x114.3",
  "opening": "integrated",
  "doubleDinKit": false,
  "confirmed": true
 },
 "us-honda-cr-v": {
  "modelYear": 2026,
  "front": "235/65R17",
  "rear": null,
  "wheelIn": 17,
  "bolt": "5x114.3",
  "opening": "integrated",
  "doubleDinKit": false,
  "confirmed": true
 },
 "us-ram-pickup-1500-heavy-duty": {
  "modelYear": 2026,
  "front": "265/70R17",
  "rear": null,
  "wheelIn": 17,
  "bolt": "6x139.7",
  "opening": "integrated",
  "doubleDinKit": false,
  "confirmed": true
 },
 "us-gmc-sierra": {
  "modelYear": 2026,
  "front": "255/70R17",
  "rear": null,
  "wheelIn": 17,
  "bolt": "6x139.7",
  "opening": "integrated",
  "doubleDinKit": false,
  "confirmed": false
 },
 "us-chevrolet-equinox": {
  "modelYear": 2026,
  "front": "235/65R17",
  "rear": null,
  "wheelIn": 17,
  "bolt": "5x115",
  "opening": "integrated",
  "doubleDinKit": false,
  "confirmed": true
 },
 "us-toyota-camry": {
  "modelYear": 2026,
  "front": "205/65R16",
  "rear": null,
  "wheelIn": 16,
  "bolt": "5x114.3",
  "opening": "integrated",
  "doubleDinKit": false,
  "confirmed": true
 },
 "ca-ford-f-series": {
  "modelYear": 2026,
  "front": "245/70R17",
  "rear": null,
  "wheelIn": 17,
  "bolt": "6x135",
  "opening": "integrated",
  "doubleDinKit": false,
  "confirmed": true
 },
 "ca-toyota-rav4": {
  "modelYear": 2026,
  "front": "235/65R17",
  "rear": null,
  "wheelIn": 17,
  "bolt": "5x114.3",
  "opening": "integrated",
  "doubleDinKit": false,
  "confirmed": true
 },
 "ca-gmc-sierra": {
  "modelYear": 2026,
  "front": "255/70R17",
  "rear": null,
  "wheelIn": 17,
  "bolt": "6x139.7",
  "opening": "integrated",
  "doubleDinKit": false,
  "confirmed": false
 },
 "ca-honda-cr-v": {
  "modelYear": 2026,
  "front": "235/65R17",
  "rear": null,
  "wheelIn": 17,
  "bolt": "5x114.3",
  "opening": "integrated",
  "doubleDinKit": false,
  "confirmed": true
 },
 "ca-chevrolet-silverado": {
  "modelYear": 2026,
  "front": "255/70R17",
  "rear": null,
  "wheelIn": 17,
  "bolt": "6x139.7",
  "opening": "integrated",
  "doubleDinKit": false,
  "confirmed": true
 },
 "ca-nissan-rogue": {
  "modelYear": 2026,
  "front": "225/65R17",
  "rear": null,
  "wheelIn": 17,
  "bolt": "5x114.3",
  "opening": null,
  "doubleDinKit": false,
  "confirmed": true
 },
 "mx-nissan-versa": {
  "modelYear": 2026,
  "front": "185/65R15",
  "rear": null,
  "wheelIn": 15,
  "bolt": null,
  "opening": null,
  "doubleDinKit": false,
  "confirmed": true
 },
 "mx-chevrolet-aveo": {
  "modelYear": 2026,
  "front": "175/65R14",
  "rear": null,
  "wheelIn": 14,
  "bolt": "4x100",
  "opening": "single-din",
  "doubleDinKit": false,
  "confirmed": false
 },
 "mx-nissan-np300": {
  "modelYear": 2026,
  "front": "205R16C",
  "rear": null,
  "wheelIn": 16,
  "bolt": "6x114.3",
  "opening": null,
  "doubleDinKit": false,
  "confirmed": true
 },
 "mx-kia-k3-sedan": {
  "modelYear": 2026,
  "front": "185/65R15",
  "rear": null,
  "wheelIn": 15,
  "bolt": "4x100",
  "opening": "integrated",
  "doubleDinKit": false,
  "confirmed": true
 },
 "mx-nissan-march": {
  "modelYear": 2026,
  "front": "165/70R14",
  "rear": null,
  "wheelIn": 14,
  "bolt": "4x100",
  "opening": "single-din",
  "doubleDinKit": false,
  "confirmed": false
 },
 "mx-mazda-cx-30": {
  "modelYear": 2026,
  "front": "215/55R18",
  "rear": null,
  "wheelIn": 18,
  "bolt": "5x114.3",
  "opening": "integrated",
  "doubleDinKit": false,
  "confirmed": true
 },
 "mx-nissan-kicks": {
  "modelYear": 2026,
  "front": "215/60R17",
  "rear": null,
  "wheelIn": 17,
  "bolt": "5x114.3",
  "opening": "integrated",
  "doubleDinKit": false,
  "confirmed": true
 },
 "mx-volkswagen-virtus": {
  "modelYear": 2026,
  "front": "195/65R15",
  "rear": null,
  "wheelIn": 15,
  "bolt": "5x100",
  "opening": "integrated",
  "doubleDinKit": false,
  "confirmed": true
 },
 "gb-ford-puma": {
  "modelYear": 2026,
  "front": "215/55R17",
  "rear": null,
  "wheelIn": 17,
  "bolt": "5x108",
  "opening": "integrated",
  "doubleDinKit": false,
  "confirmed": true
 },
 "gb-kia-sportage": {
  "modelYear": 2026,
  "front": "225/60R17",
  "rear": null,
  "wheelIn": 17,
  "bolt": "5x114.3",
  "opening": "integrated",
  "doubleDinKit": false,
  "confirmed": true
 },
 "gb-nissan-qashqai": {
  "modelYear": 2026,
  "front": "215/65R17",
  "rear": null,
  "wheelIn": 17,
  "bolt": "5x114.3",
  "opening": "integrated",
  "doubleDinKit": false,
  "confirmed": true
 },
 "gb-vauxhall-corsa": {
  "modelYear": 2026,
  "front": "195/55R16",
  "rear": null,
  "wheelIn": 16,
  "bolt": "4x108",
  "opening": "integrated",
  "doubleDinKit": false,
  "confirmed": false
 },
 "gb-nissan-juke": {
  "modelYear": 2026,
  "front": "215/60R17",
  "rear": null,
  "wheelIn": 17,
  "bolt": "5x114.3",
  "opening": "integrated",
  "doubleDinKit": false,
  "confirmed": true
 },
 "gb-volkswagen-golf": {
  "modelYear": 2026,
  "front": "205/55R16",
  "rear": null,
  "wheelIn": 16,
  "bolt": "5x112",
  "opening": "integrated",
  "doubleDinKit": false,
  "confirmed": true
 },
 "gb-volvo-xc40": {
  "modelYear": 2026,
  "front": "235/60R17",
  "rear": null,
  "wheelIn": 17,
  "bolt": "5x108",
  "opening": "integrated",
  "doubleDinKit": false,
  "confirmed": true
 },
 "gb-mg-hs": {
  "modelYear": 2026,
  "front": "225/55R19",
  "rear": null,
  "wheelIn": 19,
  "bolt": "5x112",
  "opening": "integrated",
  "doubleDinKit": false,
  "confirmed": true
 },
 "ie-hyundai-tucson": {
  "modelYear": 2026,
  "front": "235/65R17",
  "rear": null,
  "wheelIn": 17,
  "bolt": "5x114.3",
  "opening": "integrated",
  "doubleDinKit": false,
  "confirmed": false
 },
 "ie-skoda-octavia": {
  "modelYear": 2026,
  "front": "205/55R17",
  "rear": null,
  "wheelIn": 17,
  "bolt": "5x112",
  "opening": "integrated",
  "doubleDinKit": false,
  "confirmed": false
 },
 "ie-toyota-yaris-cross": {
  "modelYear": 2026,
  "front": "205/65R16",
  "rear": null,
  "wheelIn": 16,
  "bolt": "5x114.3",
  "opening": "integrated",
  "doubleDinKit": false,
  "confirmed": true
 },
 "ie-kia-sportage": {
  "modelYear": 2026,
  "front": "215/65R17",
  "rear": null,
  "wheelIn": 17,
  "bolt": "5x114.3",
  "opening": "integrated",
  "doubleDinKit": false,
  "confirmed": true
 },
 "ie-toyota-rav4": {
  "modelYear": 2026,
  "front": "245/45R20",
  "rear": null,
  "wheelIn": 20,
  "bolt": "5x114.3",
  "opening": "integrated",
  "doubleDinKit": false,
  "confirmed": false
 },
 "ie-toyota-corolla": {
  "modelYear": 2026,
  "front": "205/55R16",
  "rear": null,
  "wheelIn": 16,
  "bolt": "5x100",
  "opening": "integrated",
  "doubleDinKit": false,
  "confirmed": false
 },
 "ie-skoda-kodiaq": {
  "modelYear": 2026,
  "front": "215/65R17",
  "rear": null,
  "wheelIn": 17,
  "bolt": "5x112",
  "opening": "integrated",
  "doubleDinKit": false,
  "confirmed": false
 },
 "ie-volkswagen-tiguan": {
  "modelYear": 2026,
  "front": "215/65R17",
  "rear": null,
  "wheelIn": 17,
  "bolt": "5x112",
  "opening": "integrated",
  "doubleDinKit": false,
  "confirmed": false
 }
};

/** A tire size as sellers write it: no "P", no spaces. */
export const tireSize = (s: string | null | undefined): string | null => (s ? s.toUpperCase().replace(/\s+/g, '').replace(/^P(?=\d)/, '') : null);
