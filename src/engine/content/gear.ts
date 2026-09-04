/**
 * SLATE — the kit, by name.
 *
 * Cameras, glass, lights, grip, sound and the edit are real products from
 * real manufacturers. What is stated about each is public record: who makes
 * it, what it is, roughly when it shipped, and what it is used for. Prices are
 * SLATE's calibration for a working package — a number the game needs so that
 * buying and renting mean something — and are labelled as calibration wherever
 * the player sees them. They are not quotes, and some of this kit is rental
 * only in real life, which is recorded.
 */

import type { Equipment } from '../domain/model';

export interface GearItem {
  id: string;
  name: string;
  maker: string;
  category: Equipment['category'];
  /** A sentence on what it is and what it is for. */
  about: string;
  /** Year it shipped, where it is on the record. */
  since?: number;
  /** SLATE calibration, in cents, for the package as the game rents it. */
  purchaseCalibration: number;
  dailyRentalCalibration: number;
  /** 0-100 what it does for the picture, on SLATE's scale. */
  qualityRating: number;
  /** Real-world availability: some of this is never sold. */
  rentalOnly?: boolean;
  /** What a DP uses it for, so the game can match kit to a script. */
  suits: ('drama' | 'action' | 'night' | 'handheld' | 'anamorphic' | 'large_format' | 'documentary' | 'series' | 'vfx' | 'water')[];
}

export const GEAR: readonly GearItem[] = [
  // --- Cameras ---------------------------------------------------------------
  { id: 'alexa-35', name: 'ALEXA 35', maker: 'ARRI', category: 'camera', about: 'ARRI’s Super 35 cinema camera with a new sensor and seventeen stops of range; the workhorse of studio pictures since it shipped.', since: 2022, purchaseCalibration: 92_000_00, dailyRentalCalibration: 1_650_00, qualityRating: 95, suits: ['drama', 'action', 'night', 'series', 'vfx'] },
  { id: 'alexa-mini-lf', name: 'ALEXA Mini LF', maker: 'ARRI', category: 'camera', about: 'The large-format ALEXA in a small body, for gimbals, handheld and tight sets.', since: 2019, purchaseCalibration: 78_000_00, dailyRentalCalibration: 1_400_00, qualityRating: 93, suits: ['drama', 'handheld', 'large_format', 'series'] },
  { id: 'alexa-65', name: 'ALEXA 65', maker: 'ARRI', category: 'camera', about: 'The 65mm-format digital camera, rented through ARRI Rental only; The Revenant and Dune.', since: 2014, purchaseCalibration: 0, dailyRentalCalibration: 3_400_00, qualityRating: 98, rentalOnly: true, suits: ['large_format', 'drama', 'vfx'] },
  { id: 'venice-2', name: 'VENICE 2', maker: 'Sony', category: 'camera', about: 'Sony’s full-frame cinema camera with a detachable sensor block; Top Gun: Maverick used the Rialto extension.', since: 2022, purchaseCalibration: 62_000_00, dailyRentalCalibration: 1_250_00, qualityRating: 92, suits: ['drama', 'action', 'night', 'large_format', 'series'] },
  { id: 'v-raptor', name: 'V-RAPTOR [X]', maker: 'RED Digital Cinema', category: 'camera', about: 'RED’s 8K large-format body with a global-shutter sensor; RED became part of Nikon in 2024.', since: 2024, purchaseCalibration: 34_000_00, dailyRentalCalibration: 850_00, qualityRating: 89, suits: ['action', 'large_format', 'vfx', 'series'] },
  { id: 'komodo-x', name: 'KOMODO-X', maker: 'RED Digital Cinema', category: 'camera', about: 'A compact 6K body for crash cams, rigs and second units.', since: 2023, purchaseCalibration: 12_000_00, dailyRentalCalibration: 320_00, qualityRating: 78, suits: ['action', 'handheld', 'documentary'] },
  { id: 'dxl2', name: 'Millennium DXL2', maker: 'Panavision', category: 'camera', about: 'Panavision’s large-format camera built around a RED sensor; rental only, as all Panavision kit is.', since: 2018, purchaseCalibration: 0, dailyRentalCalibration: 2_200_00, qualityRating: 94, rentalOnly: true, suits: ['large_format', 'drama', 'anamorphic'] },
  { id: 'ursa-cine-17k', name: 'URSA Cine 17K 65', maker: 'Blackmagic Design', category: 'camera', about: 'Blackmagic’s 65mm-format body, at a fraction of the price of the others in the class.', since: 2024, purchaseCalibration: 30_000_00, dailyRentalCalibration: 700_00, qualityRating: 86, suits: ['large_format', 'documentary', 'series'] },
  { id: 'pocket-6k', name: 'Pocket Cinema Camera 6K Pro', maker: 'Blackmagic Design', category: 'camera', about: 'The camera a first feature gets made on when there is no money.', since: 2021, purchaseCalibration: 2_600_00, dailyRentalCalibration: 90_00, qualityRating: 62, suits: ['documentary', 'handheld'] },
  { id: 'fx6', name: 'FX6', maker: 'Sony', category: 'camera', about: 'A full-frame documentary and second-unit body with the VENICE colour science.', since: 2020, purchaseCalibration: 6_500_00, dailyRentalCalibration: 180_00, qualityRating: 70, suits: ['documentary', 'handheld', 'series'] },
  { id: 'arricam-lt', name: 'ARRICAM LT', maker: 'ARRI', category: 'camera', about: '35mm film. Still rented for the pictures that shoot on it.', since: 2000, purchaseCalibration: 0, dailyRentalCalibration: 1_100_00, qualityRating: 90, rentalOnly: true, suits: ['drama', 'anamorphic'] },
  { id: 'panaflex-millennium-xl2', name: 'Panaflex Millennium XL2', maker: 'Panavision', category: 'camera', about: 'Panavision’s 35mm film camera; Nolan and Tarantino territory.', since: 2004, purchaseCalibration: 0, dailyRentalCalibration: 1_300_00, qualityRating: 91, rentalOnly: true, suits: ['drama', 'anamorphic', 'large_format'] },

  // --- Lenses ------------------------------------------------------------------
  { id: 'signature-primes', name: 'Signature Prime Set', maker: 'ARRI', category: 'lens', about: 'Large-format spherical primes with a soft, flattering look.', since: 2018, purchaseCalibration: 190_000_00, dailyRentalCalibration: 2_100_00, qualityRating: 94, suits: ['drama', 'large_format', 'series'] },
  { id: 'cooke-s7i', name: 'S7/i Full Frame Plus Set', maker: 'Cooke Optics', category: 'lens', about: 'The Cooke look — warm skin, gentle roll-off — in a full-frame set.', since: 2017, purchaseCalibration: 175_000_00, dailyRentalCalibration: 1_900_00, qualityRating: 93, suits: ['drama', 'large_format'] },
  { id: 'cooke-anamorphic-i', name: 'Anamorphic/i Full Frame Set', maker: 'Cooke Optics', category: 'lens', about: 'Oval bokeh and horizontal flares; the anamorphic look, done gently.', since: 2019, purchaseCalibration: 260_000_00, dailyRentalCalibration: 2_800_00, qualityRating: 95, suits: ['anamorphic', 'drama', 'action'] },
  { id: 'supreme-primes', name: 'Supreme Prime Set', maker: 'ZEISS', category: 'lens', about: 'Clean, fast, consistent large-format primes.', since: 2018, purchaseCalibration: 165_000_00, dailyRentalCalibration: 1_800_00, qualityRating: 92, suits: ['drama', 'large_format', 'vfx', 'series'] },
  { id: 'master-primes', name: 'Master Prime Set', maker: 'ARRI/ZEISS', category: 'lens', about: 'Super 35 primes with almost no distortion; the VFX supervisor’s choice.', since: 2005, purchaseCalibration: 150_000_00, dailyRentalCalibration: 1_500_00, qualityRating: 91, suits: ['vfx', 'drama', 'night'] },
  { id: 'panavision-primo', name: 'Primo Prime Set', maker: 'Panavision', category: 'lens', about: 'The house primes of Panavision, rental only.', since: 1989, purchaseCalibration: 0, dailyRentalCalibration: 1_600_00, qualityRating: 92, rentalOnly: true, suits: ['drama', 'anamorphic'] },
  { id: 'panavision-c-series', name: 'C Series Anamorphic Set', maker: 'Panavision', category: 'lens', about: 'Vintage anamorphics from the 1960s and 70s, still the most requested glass on the shelf.', purchaseCalibration: 0, dailyRentalCalibration: 3_000_00, qualityRating: 96, rentalOnly: true, suits: ['anamorphic', 'drama'] },
  { id: 'angenieux-optimo', name: 'Optimo Ultra 12x Zoom', maker: 'Angénieux', category: 'lens', about: 'A long cinema zoom that covers large format; the second camera’s lens.', since: 2017, purchaseCalibration: 95_000_00, dailyRentalCalibration: 1_100_00, qualityRating: 90, suits: ['action', 'documentary', 'series'] },
  { id: 'leitz-prime', name: 'Leitz Prime Set', maker: 'Leitz Cine', category: 'lens', about: 'Full-frame primes from the Leica family, with a clean, slightly cool look.', since: 2019, purchaseCalibration: 170_000_00, dailyRentalCalibration: 1_900_00, qualityRating: 92, suits: ['drama', 'large_format'] },
  { id: 'sigma-cine', name: 'Cine FF High Speed Prime Set', maker: 'Sigma', category: 'lens', about: 'Fast, affordable full-frame primes; the low-budget feature’s set.', since: 2017, purchaseCalibration: 28_000_00, dailyRentalCalibration: 420_00, qualityRating: 78, suits: ['documentary', 'drama', 'night'] },

  // --- Lighting ------------------------------------------------------------------
  { id: 'skypanel-x', name: 'SkyPanel X Package', maker: 'ARRI', category: 'lighting', about: 'Modular LED soft lights that replaced the tungsten wall on most sets.', since: 2023, purchaseCalibration: 64_000_00, dailyRentalCalibration: 900_00, qualityRating: 88, suits: ['drama', 'series', 'night'] },
  { id: 'arri-m18', name: 'M18 HMI Package', maker: 'ARRI', category: 'lighting', about: 'Daylight-balanced HMIs for punching sun through a window.', since: 2010, purchaseCalibration: 48_000_00, dailyRentalCalibration: 750_00, qualityRating: 84, suits: ['drama', 'action'] },
  { id: 'arri-orbiter', name: 'Orbiter Package', maker: 'ARRI', category: 'lighting', about: 'A hard LED source with interchangeable optics.', since: 2020, purchaseCalibration: 38_000_00, dailyRentalCalibration: 600_00, qualityRating: 85, suits: ['drama', 'night', 'series'] },
  { id: 'aputure-600d', name: 'LS 600d Pro Package', maker: 'Aputure', category: 'lighting', about: 'The independent film’s daylight LED; cheap, bright and everywhere.', since: 2020, purchaseCalibration: 14_000_00, dailyRentalCalibration: 260_00, qualityRating: 74, suits: ['documentary', 'handheld', 'night'] },
  { id: 'creamsource-vortex', name: 'Vortex8 Package', maker: 'Creamsource', category: 'lighting', about: 'Weatherproof RGB LED panels, favoured on exteriors.', since: 2020, purchaseCalibration: 52_000_00, dailyRentalCalibration: 800_00, qualityRating: 86, suits: ['action', 'night', 'water'] },
  { id: 'kino-flo', name: 'FreeStyle LED Package', maker: 'Kino Flo', category: 'lighting', about: 'Soft LED tubes descended from the fluorescent banks Kino Flo made its name on.', purchaseCalibration: 22_000_00, dailyRentalCalibration: 380_00, qualityRating: 78, suits: ['drama', 'series'] },
  { id: 'tungsten-truck', name: 'Tungsten Lighting Truck', maker: 'Mole-Richardson', category: 'lighting', about: 'Fresnels and 10Ks from the company that has made them since 1927; still the warmest light there is.', since: 1927, purchaseCalibration: 90_000_00, dailyRentalCalibration: 1_100_00, qualityRating: 80, suits: ['drama', 'anamorphic'] },
  { id: 'astera-titan', name: 'Titan Tube Kit', maker: 'Astera', category: 'lighting', about: 'Battery LED tubes for practicals, car interiors and colour effects.', since: 2018, purchaseCalibration: 9_000_00, dailyRentalCalibration: 180_00, qualityRating: 72, suits: ['night', 'handheld', 'series'] },

  // --- Grip ------------------------------------------------------------------------
  { id: 'hybrid-iv', name: 'Hybrid IV Dolly', maker: 'Chapman/Leonard', category: 'grip', about: 'The standard studio dolly, with its own track and riser package.', purchaseCalibration: 0, dailyRentalCalibration: 520_00, qualityRating: 86, rentalOnly: true, suits: ['drama', 'series'] },
  { id: 'fisher-10', name: 'Model 10 Dolly', maker: 'J.L. Fisher', category: 'grip', about: 'The other standard dolly; rental only, as Fisher has always run it.', since: 1963, purchaseCalibration: 0, dailyRentalCalibration: 500_00, qualityRating: 85, rentalOnly: true, suits: ['drama', 'series'] },
  { id: 'grip-package', name: 'Grip Truck Package', maker: 'Matthews Studio Equipment', category: 'grip', about: 'Stands, flags, frames, rags and the truck they live on.', since: 1970, purchaseCalibration: 58_000_00, dailyRentalCalibration: 820_00, qualityRating: 76, suits: ['drama', 'action', 'series', 'documentary'] },
  { id: 'supertechno-50', name: 'SuperTechno 50', maker: 'Technocrane', category: 'specialty', about: 'A fifty-foot telescoping crane with a remote head, and the crew to run it.', purchaseCalibration: 0, dailyRentalCalibration: 3_600_00, qualityRating: 92, rentalOnly: true, suits: ['action', 'drama', 'vfx'] },
  { id: 'steadicam-m2', name: 'Steadicam M-2 Volt', maker: 'Tiffen', category: 'specialty', about: 'The camera stabiliser, in its current form, with an operator who has spent a career on it.', since: 2019, purchaseCalibration: 75_000_00, dailyRentalCalibration: 950_00, qualityRating: 88, suits: ['handheld', 'action', 'drama'] },
  { id: 'ronin-2', name: 'Ronin 2', maker: 'DJI', category: 'specialty', about: 'A three-axis gimbal that carries a full cinema body.', since: 2017, purchaseCalibration: 8_500_00, dailyRentalCalibration: 220_00, qualityRating: 76, suits: ['handheld', 'action', 'documentary'] },
  { id: 'russian-arm', name: 'Russian Arm Camera Car', maker: 'Filmotechnic', category: 'vehicle', about: 'A gyro-stabilised crane on a chase car, with a precision driver; the moving shot in every car chase.', purchaseCalibration: 0, dailyRentalCalibration: 9_500_00, qualityRating: 94, rentalOnly: true, suits: ['action'] },
  { id: 'camera-truck', name: 'Camera Truck', maker: 'Various', category: 'vehicle', about: 'A ten-ton truck built out for the camera department.', purchaseCalibration: 140_000_00, dailyRentalCalibration: 640_00, qualityRating: 70, suits: ['drama', 'action', 'series'] },
  { id: 'led-volume', name: 'LED Volume (Stage Rental)', maker: 'Various', category: 'specialty', about: 'A curved wall of LED panels with real-time backgrounds, booked with a stage and a virtual art department.', since: 2019, purchaseCalibration: 0, dailyRentalCalibration: 45_000_00, qualityRating: 90, rentalOnly: true, suits: ['vfx', 'series', 'action'] },
  { id: 'underwater-housing', name: 'Underwater Housing and Dive Team', maker: 'Gates Underwater Products', category: 'specialty', about: 'A pressure housing for the camera and the divers to go with it.', purchaseCalibration: 0, dailyRentalCalibration: 4_200_00, qualityRating: 84, rentalOnly: true, suits: ['water'] },

  // --- Sound -------------------------------------------------------------------------
  { id: 'sound-devices-888', name: '888 Sound Cart Package', maker: 'Sound Devices', category: 'sound', about: 'A location mixer-recorder with Dante and sixteen tracks, and the cart around it.', since: 2019, purchaseCalibration: 34_000_00, dailyRentalCalibration: 520_00, qualityRating: 88, suits: ['drama', 'series', 'action'] },
  { id: 'schoeps-cmit', name: 'CMIT 5 Boom Kit', maker: 'Schoeps', category: 'sound', about: 'The boom microphone most feature mixers reach for.', since: 2007, purchaseCalibration: 4_500_00, dailyRentalCalibration: 85_00, qualityRating: 86, suits: ['drama', 'series'] },
  { id: 'lectrosonics-kit', name: 'Digital Wireless Kit', maker: 'Lectrosonics', category: 'sound', about: 'Radio mics for the cast, from the company that has built them since 1971.', since: 1971, purchaseCalibration: 18_000_00, dailyRentalCalibration: 260_00, qualityRating: 82, suits: ['drama', 'series', 'documentary'] },
  { id: 'dpa-lav', name: '6060 Lavalier Set', maker: 'DPA Microphones', category: 'sound', about: 'Tiny lavaliers hidden in costume.', since: 2018, purchaseCalibration: 6_000_00, dailyRentalCalibration: 90_00, qualityRating: 84, suits: ['drama', 'series'] },

  // --- Post and computers ---------------------------------------------------------------
  { id: 'avid-suite', name: 'Media Composer Edit Suite', maker: 'Avid', category: 'computer', about: 'The editorial standard for studio features since the 1990s, with the shared storage editors need.', since: 1989, purchaseCalibration: 42_000_00, dailyRentalCalibration: 400_00, qualityRating: 88, suits: ['drama', 'series', 'action'] },
  { id: 'resolve-suite', name: 'DaVinci Resolve Grading Suite', maker: 'Blackmagic Design', category: 'computer', about: 'Colour grading, with the panels and the reference monitor a grade needs.', since: 2009, purchaseCalibration: 95_000_00, dailyRentalCalibration: 1_500_00, qualityRating: 92, suits: ['drama', 'series', 'action', 'vfx'] },
  { id: 'baselight', name: 'Baselight Grading Suite', maker: 'FilmLight', category: 'computer', about: 'The other grading system, in the rooms where studio features are finished.', since: 2002, purchaseCalibration: 180_000_00, dailyRentalCalibration: 2_100_00, qualityRating: 95, suits: ['drama', 'anamorphic', 'large_format'] },
  { id: 'pro-tools-stage', name: 'Pro Tools Mix Stage', maker: 'Avid', category: 'computer', about: 'A dubbing theatre built around Pro Tools and an S6 console.', purchaseCalibration: 420_000_00, dailyRentalCalibration: 4_500_00, qualityRating: 92, suits: ['drama', 'action', 'series'] },
  { id: 'nexis', name: 'NEXIS Shared Storage', maker: 'Avid', category: 'storage', about: 'The storage the cutting rooms share.', purchaseCalibration: 36_000_00, dailyRentalCalibration: 260_00, qualityRating: 82, suits: ['series', 'drama', 'action'] },
  { id: 'lto-archive', name: 'LTO Archive System', maker: 'Various', category: 'storage', about: 'Tape backup of the negative, because a drive is not an archive.', purchaseCalibration: 12_000_00, dailyRentalCalibration: 80_00, qualityRating: 70, suits: ['drama', 'series', 'documentary', 'action'] },
];

export const GEAR_BY_ID: Readonly<Record<string, GearItem>> = Object.fromEntries(GEAR.map((g) => [g.id, g]));

export function gearIn(category: Equipment['category']): GearItem[] {
  return GEAR.filter((g) => g.category === category);
}

/** The kit a DP would ask for, given what the script is. */
export function gearSuited(suits: GearItem['suits'][number][]): GearItem[] {
  return GEAR.filter((g) => g.suits.some((s) => suits.includes(s)));
}

/** A note every price in this file carries when the player sees it. */
export const GEAR_CALIBRATION_NOTE = 'Prices are SLATE’s calibration for a working package, not a quote from the maker or a rental house.';
