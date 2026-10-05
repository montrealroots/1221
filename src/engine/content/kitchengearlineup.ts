/**
 * SLATE — blenders and slow cookers by make and model where you live, built
 * by `tools/build-kitchenware.mjs` from `docs/research/catalog/kitchenware-*.json`
 * (from 2026-10-05). Don't edit by hand. Each at its retailer's regular price;
 * America's and Canada's before sales tax.
 */

import type { GearOffer } from './kitchengear';

export const GEAR_LINEUP: Readonly<Record<string, readonly GearOffer[]>> = {};
